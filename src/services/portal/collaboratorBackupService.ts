// src/services/portal/collaboratorBackupService.ts

import type { WebClient } from "@slack/web-api";
import { prisma } from "../../lib/prisma";
import { transferTaskResponsibility } from "../transferTaskResponsibility";

export async function startCollaboratorBackup(args: {
  slack: WebClient;
  slackUserId: string;
  actorSlackId: string;
}) {
  const {
    slack,
    slackUserId,
    actorSlackId,
  } = args;

  /*
   * ==========================================
   * TAREFAS ELEGÍVEIS
   *
   * Backup temporário:
   * - somente pendentes
   * - não privadas
   * - titular atual = colaborador
   * - backup cadastrado
   * - ainda não transferidas por backup
   * ==========================================
   */

  const tasks = await prisma.task.findMany({
    where: {
      responsible: slackUserId,
      status: "pending",
      taskType: "normal",
      calendarPrivate: false,
      backupActive: false,

      backupResponsible: {
        not: null,
      },
    },

    select: {
      id: true,
      responsible: true,
      responsibleEmail: true,
      backupResponsible: true,
    },
  });

  const eligibleTasks = tasks.filter(
    task =>
      Boolean(
        task.backupResponsible?.trim()
      ) &&
      task.backupResponsible !==
        task.responsible
  );

  /*
   * ==========================================
   * MARCA COLABORADOR EM BACKUP
   * ==========================================
   */

  await prisma.collaboratorState.upsert({
    where: {
      slackUserId,
    },

    create: {
      slackUserId,
      status: "backup",
      backupActivatedAt: new Date(),
      deactivatedAt: null,
    },

    update: {
      status: "backup",
      backupActivatedAt: new Date(),
      deactivatedAt: null,
    },
  });

  const transferredTaskIds: string[] = [];
  const failedTaskIds: string[] = [];

  /*
   * ==========================================
   * TRANSFERE TAREFAS
   * ==========================================
   */

  for (const task of eligibleTasks) {
    const backupResponsible =
      task.backupResponsible!.trim();

    try {
      /*
       * Primeiro registramos quem era o titular.
       *
       * Isso permite devolver exatamente
       * esta tarefa no Parar backup.
       */

      await prisma.task.update({
        where: {
          id: task.id,
        },

        data: {
          backupActive: true,

          backupOriginalResponsible:
            task.responsible,

          backupOriginalResponsibleEmail:
            task.responsibleEmail,

          backupActivatedAt:
            new Date(),
        },
      });

      try {
        await transferTaskResponsibility({
          slack,
          taskId: task.id,
          newResponsibleSlackId:
            backupResponsible,
          actorSlackId,
          reason: "backup_start",
        });
      } catch (error) {
        /*
         * Se a transferência falhar,
         * desfaz o estado temporário da task.
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

        throw error;
      }

      transferredTaskIds.push(
        task.id
      );
    } catch (error) {
      console.error(
        "[BACKUP_START] task failed",
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

  return {
    eligible:
      eligibleTasks.length,

    transferred:
      transferredTaskIds.length,

    failed:
      failedTaskIds.length,

    transferredTaskIds,
    failedTaskIds,
  };
}


export async function stopCollaboratorBackup(args: {
  slack: WebClient;
  slackUserId: string;
  actorSlackId: string;
}) {
  const {
    slack,
    slackUserId,
    actorSlackId,
  } = args;

  /*
   * ==========================================
   * TAREFAS TRANSFERIDAS DESTE COLABORADOR
   *
   * Não buscamos pelo responsável atual.
   * A referência segura é
   * backupOriginalResponsible.
   * ==========================================
   */

  const tasks = await prisma.task.findMany({
    where: {
      backupActive: true,

      backupOriginalResponsible:
        slackUserId,

      status: "pending",
    },

    select: {
      id: true,
      responsible: true,
      backupOriginalResponsible: true,
    },
  });

  const restoredTaskIds: string[] = [];
  const failedTaskIds: string[] = [];

  for (const task of tasks) {
    const originalResponsible =
      task.backupOriginalResponsible?.trim();

    if (!originalResponsible) {
      failedTaskIds.push(
        task.id
      );

      continue;
    }

    try {
      await transferTaskResponsibility({
        slack,
        taskId: task.id,
        newResponsibleSlackId:
          originalResponsible,
        actorSlackId,
        reason: "backup_stop",
      });

      /*
       * Só limpamos os campos depois que
       * a transferência de volta funcionou.
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

      restoredTaskIds.push(
        task.id
      );
    } catch (error) {
      console.error(
        "[BACKUP_STOP] task failed",
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
   * Só voltamos o colaborador para ACTIVE
   * se nenhuma tarefa falhou.
   *
   * Se houver falha, mantemos BACKUP para
   * não fingir que o retorno terminou.
   */

  if (
    failedTaskIds.length === 0
  ) {
    await prisma.collaboratorState.upsert({
      where: {
        slackUserId,
      },

      create: {
        slackUserId,
        status: "active",
        backupActivatedAt: null,
        deactivatedAt: null,
      },

      update: {
        status: "active",
        backupActivatedAt: null,
      },
    });
  }

  return {
    found: tasks.length,

    restored:
      restoredTaskIds.length,

    failed:
      failedTaskIds.length,

    restoredTaskIds,
    failedTaskIds,
  };
}