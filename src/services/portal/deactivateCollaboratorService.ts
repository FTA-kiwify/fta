// src/services/portal/deactivateCollaboratorService.ts

import type { WebClient } from "@slack/web-api";
import { prisma } from "../../lib/prisma";
import { transferTaskResponsibility } from "../transferTaskResponsibility";

export async function getCollaboratorDeactivationPreview(
  slackUserId: string
) {
  const tasks = await prisma.task.findMany({
    where: {
      responsible: slackUserId,
      status: "pending",
    },

    select: {
      id: true,
      calendarPrivate: true,
      backupResponsible: true,
    },
  });

  let toBackup = 0;
  let toReplacement = 0;
  let privateTasks = 0;

  for (const task of tasks) {
    if (task.calendarPrivate) {
      privateTasks++;
      toReplacement++;
      continue;
    }

    const backup =
      task.backupResponsible?.trim();

    if (
      backup &&
      backup !== slackUserId
    ) {
      toBackup++;
    } else {
      toReplacement++;
    }
  }

  return {
    total: tasks.length,
    toBackup,
    toReplacement,
    privateTasks,
  };
}


export async function deactivateCollaborator(args: {
  slack: WebClient;
  slackUserId: string;
  actorSlackId: string;
  replacementSlackId: string | null;
}) {
  const {
    slack,
    slackUserId,
    actorSlackId,
  } = args;

  const replacementSlackId =
    args.replacementSlackId?.trim() ||
    null;

  if (
    replacementSlackId ===
    slackUserId
  ) {
    throw new Error(
      "O substituto não pode ser o próprio colaborador."
    );
  }

  const currentState =
    await prisma.collaboratorState.findUnique({
      where: {
        slackUserId,
      },
    });

  if (
    currentState?.status ===
    "inactive"
  ) {
    throw new Error(
      "Este colaborador já está desativado."
    );
  }

  /*
   * ==========================================
   * TAREFAS ATIVAS
   * ==========================================
   */

  const tasks = await prisma.task.findMany({
    where: {
      responsible: slackUserId,
      status: "pending",
    },

    select: {
      id: true,
      calendarPrivate: true,
      backupResponsible: true,
    },
  });

  /*
   * Antes de começar, garantimos que TODAS
   * possuem destino.
   *
   * Privadas sempre vão para o substituto.
   * Não privadas usam backup quando houver.
   */

  const needsReplacement =
    tasks.some(task => {
      if (task.calendarPrivate) {
        return true;
      }

      const backup =
        task.backupResponsible?.trim();

      return (
        !backup ||
        backup === slackUserId
      );
    });

  if (
    needsReplacement &&
    !replacementSlackId
  ) {
    throw new Error(
      "Existem atividades que precisam de um substituto."
    );
  }

  const transferredTaskIds: string[] = [];
  const failedTaskIds: string[] = [];

  /*
   * ==========================================
   * REDISTRIBUIÇÃO DEFINITIVA
   * ==========================================
   */

  for (const task of tasks) {
    const backup =
      task.backupResponsible?.trim();

    const destination =
      task.calendarPrivate
        ? replacementSlackId
        : backup &&
            backup !== slackUserId
          ? backup
          : replacementSlackId;

    if (!destination) {
      failedTaskIds.push(task.id);
      continue;
    }

    try {
      await transferTaskResponsibility({
        slack,
        taskId: task.id,
        newResponsibleSlackId:
          destination,
        actorSlackId,
        reason: "deactivation",
      });

      /*
       * Caso esta pessoa estivesse em backup
       * temporário antes da desativação,
       * qualquer estado temporário desta task
       * deixa de fazer sentido.
       */

      await prisma.task.update({
        where: {
          id: task.id,
        },

        data: {
          backupActive: false,
          backupOriginalResponsible: null,
          backupOriginalResponsibleEmail: null,
          backupActivatedAt: null,
        },
      });

      transferredTaskIds.push(
        task.id
      );
    } catch (error) {
      console.error(
        "[COLLABORATOR_DEACTIVATE] task failed",
        {
          taskId: task.id,
          slackUserId,
          error,
        }
      );

      failedTaskIds.push(
        task.id
      );
    }
  }

  /*
   * ==========================================
   * SEGURANÇA FINAL
   *
   * Não desativa enquanto existir qualquer
   * task pending atribuída ao colaborador.
   * ==========================================
   */

  const remainingTasks =
    await prisma.task.count({
      where: {
        responsible: slackUserId,
        status: "pending",
      },
    });

  if (
    failedTaskIds.length > 0 ||
    remainingTasks > 0
  ) {
    return {
      deactivated: false as const,

      total: tasks.length,

      transferred:
        transferredTaskIds.length,

      failed:
        failedTaskIds.length,

      remaining:
        remainingTasks,

      transferredTaskIds,
      failedTaskIds,
    };
  }

  /*
   * ==========================================
   * DESATIVA COLABORADOR
   * ==========================================
   */

  await prisma.collaboratorState.upsert({
    where: {
      slackUserId,
    },

    create: {
      slackUserId,
      status: "inactive",
      backupActivatedAt: null,
      deactivatedAt: new Date(),
    },

    update: {
      status: "inactive",
      backupActivatedAt: null,
      deactivatedAt: new Date(),
    },
  });

  return {
    deactivated: true as const,

    total: tasks.length,

    transferred:
      transferredTaskIds.length,

    failed: 0,

    remaining: 0,

    transferredTaskIds,
    failedTaskIds: [],
  };
}