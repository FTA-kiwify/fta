// src/services/transferTaskResponsibility.ts

import type { WebClient } from "@slack/web-api";
import { prisma } from "../lib/prisma";
import { handleTaskResponsibleReassign } from "./handleTaskResponsibleReassign";
import { syncTaskParticipantEmails } from "./syncTaskParticipantEmails";
import { syncCalendarEventForTask } from "./googleCalendar";
import { publishHome } from "./publishHome";

export type ResponsibilityTransferReason =
  | "manual"
  | "backup_start"
  | "backup_stop"
  | "deactivation";

export async function transferTaskResponsibility(args: {
  slack: WebClient;
  taskId: string;
  newResponsibleSlackId: string;
  actorSlackId: string;
  reason: ResponsibilityTransferReason;
}) {
  const {
    slack,
    taskId,
    newResponsibleSlackId,
    actorSlackId,
    reason,
  } = args;

  const newResponsible =
    newResponsibleSlackId.trim();

  if (!newResponsible) {
    throw new Error(
      "New responsible user is required"
    );
  }

  /*
   * ==========================================
   * TASK ATUAL
   * ==========================================
   */

  const before = await prisma.task.findUnique({
    where: {
      id: taskId,
    },

    select: {
      id: true,
      title: true,
      status: true,
      delegation: true,
      responsible: true,
      responsibleEmail: true,
      calendarPrivate: true,

      carbonCopies: {
        select: {
          slackUserId: true,
        },
      },
    },
  });

  if (!before) {
    throw new Error(
      `Task not found: ${taskId}`
    );
  }

  if (
    before.status === "done" ||
    before.status === "cancelled"
  ) {
    throw new Error(
      `Task cannot be reassigned: ${taskId}`
    );
  }

  /*
   * Não faz nada se já estiver com
   * o responsável solicitado.
   */

  if (
    before.responsible ===
    newResponsible
  ) {
    return {
      changed: false as const,
      before,
      after: before,
    };
  }

  /*
   * ==========================================
   * TROCA DE RESPONSÁVEL
   * ==========================================
   */

  const after = await prisma.task.update({
    where: {
      id: taskId,
    },

    data: {
      responsible: newResponsible,
    },

    select: {
      id: true,
      title: true,
      status: true,
      delegation: true,
      responsible: true,
      responsibleEmail: true,
      calendarPrivate: true,

      carbonCopies: {
        select: {
          slackUserId: true,
        },
      },
    },
  });

  /*
   * ==========================================
   * AUDITORIA
   * ==========================================
   */

  await prisma.taskAuditLog.create({
    data: {
      taskId,
      action: "TASK_RESPONSIBLE_TRANSFERRED",
      actorSlackId,
      beforeJson: {
        responsible:
          before.responsible,
        reason,
      },
      afterJson: {
        responsible:
          after.responsible,
        reason,
      },
    },
  });

  /*
   * ==========================================
   * E-MAIL DOS PARTICIPANTES
   *
   * Atualiza responsibleEmail antes do
   * Calendar, pois o Calendar utiliza e-mail.
   * ==========================================
   */

  await syncTaskParticipantEmails({
    slack,
    taskId,
    delegationSlackId:
      after.delegation ??
      actorSlackId,
    responsibleSlackId:
      after.responsible,
    carbonCopiesSlackIds:
      after.carbonCopies.map(
        cc => cc.slackUserId
      ),
  });

  /*
   * ==========================================
   * CALENDAR
   * ==========================================
   */

  await syncCalendarEventForTask(
    taskId
  );

  /*
   * ==========================================
   * SLACK
   *
   * Invalida mensagem do responsável antigo,
   * envia nova DM e move o ponteiro da task.
   * ==========================================
   */

  await handleTaskResponsibleReassign({
    slack,
    taskId,
    editedBySlackId:
      actorSlackId,
  });

  /*
   * ==========================================
   * HOME
   * ==========================================
   */

  const affectedUsers =
    new Set<string>();

  affectedUsers.add(
    before.responsible
  );

  affectedUsers.add(
    after.responsible
  );

  if (after.delegation) {
    affectedUsers.add(
      after.delegation
    );
  }

  for (
    const cc of
    after.carbonCopies
  ) {
    affectedUsers.add(
      cc.slackUserId
    );
  }

  await Promise.allSettled(
    Array.from(
      affectedUsers
    ).map(userId =>
      publishHome(
        slack,
        userId
      )
    )
  );

  return {
    changed: true as const,
    before,
    after,
  };
}