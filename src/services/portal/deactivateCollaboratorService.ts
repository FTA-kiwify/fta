// src/services/portal/deactivateCollaboratorService.ts

import type { WebClient } from "@slack/web-api";
import { prisma } from "../../lib/prisma";
import { transferTaskResponsibility } from "../transferTaskResponsibility";
import { syncTaskParticipantEmails } from "../syncTaskParticipantEmails";
import { getSlackUserName } from "../slackUserLookup";
import { notifyTaskCanceledGroup } from "../notifyTaskCanceledGroup";
import { markTaskOpenMessageAsCanceled } from "../markTaskOpenMessageAsCanceled";
import { deleteCalendarEventForTask } from "../googleCalendar";

/*
 * =========================================================
 * PREVIEW DO DESLIGAMENTO
 *
 * IMPORTANTE:
 * tarefas privadas NÃO aparecem no preview.
 *
 * Elas serão canceladas automaticamente no desligamento
 * e nunca serão transferidas para backup.
 * =========================================================
 */

export async function getCollaboratorDeactivationPreview(
    slackUserId: string
) {
    const tasks = await prisma.task.findMany({
        where: {
            responsible: slackUserId,
            status: "pending",
            calendarPrivate: false,
        },

        select: {
            id: true,
            title: true,
            backupResponsible: true,
        },
    });

    let toBackup = 0;
    let toReplacement = 0;

    for (const task of tasks) {
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

    const taskDetails =
        await Promise.all(
            tasks.map(async task => {
                const backupResponsible =
                    task.backupResponsible?.trim() ||
                    null;

                const hasValidBackup =
                    Boolean(
                        backupResponsible &&
                        backupResponsible !==
                            slackUserId
                    );

                const backupResponsibleName =
                    hasValidBackup &&
                    backupResponsible
                        ? await getSlackUserName(
                            backupResponsible
                        ).catch(
                            () =>
                                backupResponsible
                        )
                        : null;

                return {
                    id: task.id,
                    title: task.title,

                    backupResponsible:
                        hasValidBackup
                            ? backupResponsible
                            : null,

                    backupResponsibleName,

                    needsBackup:
                        !hasValidBackup,
                };
            })
        );

    return {
        total: tasks.length,
        toBackup,
        toReplacement,
        tasks: taskDetails,
    };
}


/*
 * =========================================================
 * DESLIGAMENTO DEFINITIVO
 * =========================================================
 */

export async function deactivateCollaborator(args: {
    slack: WebClient;
    slackUserId: string;
    actorSlackId: string;

    taskBackups: Array<{
        taskId: string;
        backupSlackId: string;
    }>;
}) {
    const {
        slack,
        slackUserId,
        actorSlackId,
    } = args;

    /*
     * Backups escolhidos no modal para tarefas
     * que ainda não possuíam backup cadastrado.
     */

    const taskBackupMap =
        new Map(
            (args.taskBackups ?? [])
                .filter(
                    item =>
                        item.taskId?.trim() &&
                        item.backupSlackId?.trim()
                )
                .map(item => [
                    item.taskId.trim(),
                    item.backupSlackId.trim(),
                ])
        );

    /*
     * ==========================================
     * ESTADO ATUAL DO COLABORADOR
     * ==========================================
     */

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
     * TAREFAS PRIVADAS
     *
     * Não são transferidas.
     * Não exigem backup.
     * São canceladas automaticamente.
     * ==========================================
     */

    const privateTasks =
        await prisma.task.findMany({
            where: {
                responsible:
                    slackUserId,

                status:
                    "pending",

                calendarPrivate:
                    true,
            },

            select: {
                id: true,
                title: true,
                responsible: true,
                backupResponsible: true,

                carbonCopies: {
                    select: {
                        slackUserId: true,
                    },
                },
            },
        });

    /*
     * ==========================================
     * TAREFAS PÚBLICAS
     *
     * Somente estas serão redistribuídas.
     * ==========================================
     */

    const tasks =
        await prisma.task.findMany({
            where: {
                responsible:
                    slackUserId,

                status:
                    "pending",

                calendarPrivate:
                    false,
            },

            select: {
                id: true,
                delegation: true,
                backupResponsible: true,
                responsible: true,

                carbonCopies: {
                    select: {
                        slackUserId: true,
                    },
                },
            },
        });

    /*
     * ==========================================
     * VALIDA DESTINO DAS TAREFAS PÚBLICAS
     *
     * Fazemos esta validação ANTES de cancelar
     * privadas ou transferir qualquer tarefa.
     *
     * Assim, se faltar backup em alguma pública,
     * nada é alterado.
     * ==========================================
     */

    for (const task of tasks) {
        const existingBackup =
            task.backupResponsible?.trim();

        const selectedBackup =
            taskBackupMap.get(
                task.id
            );

        const destination =
            selectedBackup ||
            (
                existingBackup &&
                    existingBackup !==
                        slackUserId
                    ? existingBackup
                    : null
            );

        if (!destination) {
            throw new Error(
                "Todas as atividades precisam ter um backup definido antes do desligamento."
            );
        }

        if (
            destination ===
            slackUserId
        ) {
            throw new Error(
                "O backup de uma atividade não pode ser o próprio colaborador desligado."
            );
        }
    }

    /*
     * ==========================================
     * CANCELA TAREFAS PRIVADAS
     * ==========================================
     */

    if (privateTasks.length) {

        /*
         * Notificação de cancelamento.
         */

        await Promise.allSettled(
            privateTasks.map(task =>
                notifyTaskCanceledGroup({
                    slack,

                    canceledBySlackId:
                        actorSlackId,

                    responsibleSlackId:
                        task.responsible,

                    backupResponsibleSlackId:
                        task.backupResponsible ??
                        null,

                    carbonCopiesSlackIds:
                        task.carbonCopies.map(
                            copy =>
                                copy.slackUserId
                        ),

                    taskTitle:
                        task.title,
                })
            )
        );

        /*
         * Invalida a mensagem aberta no Slack.
         */

        await Promise.allSettled(
            privateTasks.map(task =>
                markTaskOpenMessageAsCanceled({
                    slack,

                    taskId:
                        task.id,

                    taskTitle:
                        task.title,

                    canceledBySlackId:
                        actorSlackId,
                })
            )
        );

        /*
         * Remove evento do Google Calendar.
         */

        await Promise.allSettled(
            privateTasks.map(task =>
                deleteCalendarEventForTask(
                    task.id
                )
            )
        );

        /*
         * Auditoria.
         */

        await Promise.all(
            privateTasks.map(task =>
                prisma.taskAuditLog.create({
                    data: {
                        taskId:
                            task.id,

                        action:
                            "TASK_CANCELLED",

                        actorSlackId:
                            actorSlackId,
                    },
                })
            )
        );

        /*
         * Cancela efetivamente.
         */

        await prisma.task.updateMany({
            where: {
                id: {
                    in:
                        privateTasks.map(
                            task =>
                                task.id
                        ),
                },

                responsible:
                    slackUserId,

                status:
                    "pending",
            },

            data: {
                status:
                    "cancelled",
            },
        });
    }

    /*
     * ==========================================
     * REDISTRIBUIÇÃO DAS TAREFAS PÚBLICAS
     * ==========================================
     */

    const transferredTaskIds: string[] =
        [];

    const failedTaskIds: string[] =
        [];

    for (const task of tasks) {
        const existingBackup =
            task.backupResponsible?.trim();

        const selectedBackup =
            taskBackupMap.get(
                task.id
            );

        const destination =
            selectedBackup ||
            (
                existingBackup &&
                    existingBackup !==
                        slackUserId
                    ? existingBackup
                    : null
            );

        /*
         * Em tese nunca chegamos aqui sem destino,
         * pois já validamos todas anteriormente.
         */

        if (!destination) {
            failedTaskIds.push(
                task.id
            );

            continue;
        }

        try {

            /*
             * Se o backup foi escolhido durante
             * o desligamento, salva esse backup
             * definitivamente na tarefa.
             */

            if (selectedBackup) {
                await prisma.task.update({
                    where: {
                        id:
                            task.id,
                    },

                    data: {
                        backupResponsible:
                            selectedBackup,
                    },
                });
            }

            /*
             * Transfere responsabilidade.
             */

            await transferTaskResponsibility({
                slack,

                taskId:
                    task.id,

                newResponsibleSlackId:
                    destination,

                actorSlackId,

                reason:
                    "deactivation",
            });

            /*
             * Se o colaborador desligado também
             * era o delegador, o backup passa
             * a ser o novo delegador.
             *
             * Se outra pessoa delegou a tarefa,
             * preservamos essa pessoa.
             */

            if (
                task.delegation ===
                slackUserId
            ) {
                await prisma.task.update({
                    where: {
                        id:
                            task.id,
                    },

                    data: {
                        delegation:
                            destination,
                    },
                });

                /*
                 * Atualiza os e-mails após
                 * a troca do delegador.
                 */

                await syncTaskParticipantEmails({
                    slack,

                    taskId:
                        task.id,

                    delegationSlackId:
                        destination,

                    responsibleSlackId:
                        destination,

                    backupResponsibleSlackId:
                        destination,

                    carbonCopiesSlackIds:
                        task.carbonCopies.map(
                            copy =>
                                copy.slackUserId
                        ),
                });
            }

            /*
             * O desligamento é definitivo.
             * Portanto qualquer estado de backup
             * temporário deixa de fazer sentido.
             */

            await prisma.task.update({
                where: {
                    id:
                        task.id,
                },

                data: {
                    backupActive:
                        false,

                    backupOriginalResponsible:
                        null,

                    backupOriginalResponsibleEmail:
                        null,

                    backupActivatedAt:
                        null,
                },
            });

            transferredTaskIds.push(
                task.id
            );

        } catch (error) {
            console.error(
                "[COLLABORATOR_DEACTIVATE] task failed",
                {
                    taskId:
                        task.id,

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
     * Depois do processo:
     *
     * - privadas devem estar canceladas;
     * - públicas devem ter sido transferidas;
     * - nenhuma pending pode continuar atribuída
     *   ao colaborador desligado.
     * ==========================================
     */

    const remainingTasks =
        await prisma.task.count({
            where: {
                responsible:
                    slackUserId,

                status:
                    "pending",
            },
        });

    if (
        failedTaskIds.length > 0 ||
        remainingTasks > 0
    ) {
        return {
            deactivated:
                false as const,

            total:
                tasks.length,

            transferred:
                transferredTaskIds.length,

            cancelledPrivate:
                privateTasks.length,

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

            status:
                "inactive",

            backupActivatedAt:
                null,

            deactivatedAt:
                new Date(),
        },

        update: {
            status:
                "inactive",

            backupActivatedAt:
                null,

            deactivatedAt:
                new Date(),
        },
    });

    return {
        deactivated:
            true as const,

        total:
            tasks.length,

        transferred:
            transferredTaskIds.length,

        cancelledPrivate:
            privateTasks.length,

        failed:
            0,

        remaining:
            0,

        transferredTaskIds,

        failedTaskIds:
            [],
    };
}