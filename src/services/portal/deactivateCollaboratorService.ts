// src/services/portal/deactivateCollaboratorService.ts

import type { WebClient } from "@slack/web-api";
import { prisma } from "../../lib/prisma";
import { transferTaskResponsibility } from "../transferTaskResponsibility";
import { syncTaskParticipantEmails } from "../syncTaskParticipantEmails";
import { getSlackUserName } from "../slackUserLookup";

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
            title: true,
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


    const taskDetails =
    await Promise.all(
        tasks.map(async task => {
            const backupResponsible =
                task.backupResponsible?.trim() || null;

            const hasValidBackup =
                Boolean(
                    backupResponsible &&
                    backupResponsible !== slackUserId
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
                calendarPrivate:
                    task.calendarPrivate,

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
        privateTasks,
        tasks: taskDetails,
    };
}


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
            delegation: true,
            calendarPrivate: true,
            backupResponsible: true,
            responsible: true,
            carbonCopies: {
                select: {
                    slackUserId: true,
                },
            },
        },
    });

    for (const task of tasks) {
        const existingBackup =
            task.backupResponsible?.trim();

        const selectedBackup =
            taskBackupMap.get(task.id);

        const destination =
            selectedBackup ||
            (
                existingBackup &&
                    existingBackup !== slackUserId
                    ? existingBackup
                    : null
            );

        if (!destination) {
            throw new Error(
                "Todas as atividades precisam ter um backup definido antes do desligamento."
            );
        }

        if (destination === slackUserId) {
            throw new Error(
                "O backup de uma atividade não pode ser o próprio colaborador desligado."
            );
        }
    }

    const transferredTaskIds: string[] = [];
    const failedTaskIds: string[] = [];

    /*
     * ==========================================
     * REDISTRIBUIÇÃO DEFINITIVA
     * ==========================================
     */

    for (const task of tasks) {
        const existingBackup =
            task.backupResponsible?.trim();

        const selectedBackup =
            taskBackupMap.get(task.id);

        const destination =
            selectedBackup ||
            (
                existingBackup &&
                    existingBackup !== slackUserId
                    ? existingBackup
                    : null
            );

        if (!destination) {
            failedTaskIds.push(task.id);
            continue;
        }

        try {
            /*
             * Se o backup foi escolhido durante
             * o desligamento, salva esse backup
             * definitivamente na própria tarefa.
             */
            if (selectedBackup) {
                await prisma.task.update({
                    where: {
                        id: task.id,
                    },
                    data: {
                        backupResponsible:
                            selectedBackup,
                    },
                });
            }

            /*
             * Transfere a responsabilidade
             * para o backup da atividade.
             */
            await transferTaskResponsibility({
                slack,
                taskId: task.id,
                newResponsibleSlackId:
                    destination,
                actorSlackId,
                reason: "deactivation",
            });

            /*
             * Se o próprio colaborador desligado
             * também era o delegador, o backup
             * passa a ser o novo delegador.
             *
             * Se a tarefa foi delegada por outra
             * pessoa, preservamos o delegador.
             */
            if (
                task.delegation ===
                slackUserId
            ) {
                await prisma.task.update({
                    where: {
                        id: task.id,
                    },
                    data: {
                        delegation:
                            destination,
                    },
                });

                /*
                 * Atualiza também os e-mails dos
                 * participantes após a mudança
                 * de delegador.
                 */
                await syncTaskParticipantEmails({
                    slack,
                    taskId: task.id,
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