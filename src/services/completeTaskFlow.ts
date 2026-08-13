// src/services/completeTaskFlow.ts

import type { WebClient } from "@slack/web-api";

import { prisma } from "../lib/prisma";

import { syncCalendarEventForTask } from "./googleCalendar";

import {
    createNextRecurringTaskFromCompleted,
} from "./createNextRecurringTaskFromCompleted";

import {
    notifyTaskCreated,
} from "./notifyTaskCreated";

import {
    notifyTaskCompleted,
} from "./notifyTaskCompleted";

import {
    publishHome,
} from "./publishHome";


type CompleteTaskFlowArgs = {
    slack: WebClient;

    taskIds: string[];

    requesterSlackId: string;
};


export async function completeTaskFlow({
    slack,
    taskIds,
    requesterSlackId,
}: CompleteTaskFlowArgs) {

    /*
     * ==========================================
     * NORMALIZA IDs
     * ==========================================
     */

    const ids = Array.from(
        new Set(
            (taskIds ?? []).filter(Boolean)
        )
    );

    if (!ids.length) {
        return {
            completedIds: [],
            unauthorizedIds: [],
        };
    }


    /*
     * ==========================================
     * BUSCA AS TAREFAS
     *
     * Não filtramos responsible/delegation aqui
     * porque queremos saber também quais IDs
     * foram enviados sem autorização.
     * ==========================================
     */

    const requestedTasks =
        await prisma.task.findMany({
            where: {
                id: {
                    in: ids,
                },

                status: {
                    notIn: [
                        "done",
                        "cancelled",
                    ],
                },
            },

            select: {
                id: true,
                title: true,
                taskType: true,


                responsible: true,
                delegation: true,

                carbonCopies: {
                    select: {
                        slackUserId: true,
                    },
                },
            },
        });


    /*
     * ==========================================
     * AUTORIZAÇÃO
     *
     * Mesma regra do Slack:
     *
     * responsável OU delegador.
     * ==========================================
     */

    const tasksToConclude =
        requestedTasks.filter(
            task =>
                task.taskType !== "on_demand" &&
                (
                    task.responsible === requesterSlackId ||
                    task.delegation === requesterSlackId
                )
        );


    const completedIds =
        tasksToConclude.map(
            task => task.id
        );


    const completedIdSet =
        new Set(completedIds);


    const unauthorizedIds =
        ids.filter(
            id => !completedIdSet.has(id)
        );


    if (!completedIds.length) {
        return {
            completedIds: [],
            unauthorizedIds,
        };
    }


    /*
     * ==========================================
     * AUDITORIA
     * ==========================================
     */

    await Promise.all(
        completedIds.map(
            taskId =>
                prisma.taskAuditLog.create({
                    data: {
                        taskId,
                        action: "TASK_DONE",
                        actorSlackId:
                            requesterSlackId,
                    },
                })
        )
    );


    /*
     * ==========================================
     * CONCLUI AS TAREFAS
     * ==========================================
     */

    await prisma.task.updateMany({
        where: {
            id: {
                in: completedIds,
            },

            status: {
                notIn: [
                    "done",
                    "cancelled",
                ],
            },

            OR: [
                {
                    responsible:
                        requesterSlackId,
                },
                {
                    delegation:
                        requesterSlackId,
                },
            ],
        },

        data: {
            status: "done",
        },
    });


    /*
     * ==========================================
     * CALENDAR
     * ==========================================
     */

    void Promise.allSettled(
        completedIds.map(
            id =>
                syncCalendarEventForTask(id)
        )
    ).catch(() => { });


    /*
     * ==========================================
     * RECORRÊNCIA
     *
     * Exatamente o mecanismo atualmente
     * utilizado pelo fluxo do Slack.
     * ==========================================
     */

    const nextResults =
        await Promise.allSettled(
            completedIds.map(
                id =>
                    createNextRecurringTaskFromCompleted({
                        completedTaskId: id,
                    })
            )
        );


    const nextCreated =
        nextResults
            .filter(
                (
                    result
                ): result is PromiseFulfilledResult<any> =>
                    result.status === "fulfilled"
            )
            .map(
                result => result.value
            )
            .filter(Boolean) as Array<{
                id: string;
                title: string;
                term: Date | null;
                deadlineTime: string | null;
                responsible: string;
                delegation: string | null;
                carbonCopiesSlackIds: string[];
            }>;


    /*
     * ==========================================
     * VERIFICA DEPENDÊNCIAS DAS NOVAS
     * RECORRÊNCIAS
     * ==========================================
     */

    const nextIdsAllowedToNotify =
        new Set<string>();


    if (nextCreated.length) {

        const meta =
            await prisma.task.findMany({
                where: {
                    id: {
                        in: nextCreated.map(
                            task => task.id
                        ),
                    },
                },

                select: {
                    id: true,

                    dependsOnId: true,

                    dependsOn: {
                        select: {
                            status: true,
                        },
                    },

                    slackOpenMessageTs: true,
                },
            });


        for (const task of meta) {

            const unlocked =
                !task.dependsOnId ||
                task.dependsOn?.status === "done";

            const notYetNotified =
                !task.slackOpenMessageTs;


            if (
                unlocked &&
                notYetNotified
            ) {
                nextIdsAllowedToNotify.add(
                    task.id
                );
            }
        }
    }


    /*
     * ==========================================
     * NOTIFICA NOVAS RECORRÊNCIAS
     * ==========================================
     */

    if (nextCreated.length) {

        await Promise.allSettled(

            nextCreated

                .filter(
                    task =>
                        nextIdsAllowedToNotify.has(
                            task.id
                        )
                )

                .map(
                    task =>
                        notifyTaskCreated({
                            slack,

                            taskId: task.id,

                            createdBy:
                                task.delegation ??
                                task.responsible,

                            taskTitle:
                                task.title,

                            responsible:
                                task.responsible,

                            carbonCopies:
                                task.carbonCopiesSlackIds ??
                                [],

                            term:
                                task.term,

                            deadlineTime:
                                task.deadlineTime ??
                                null,
                        })
                )
        );
    }


    /*
     * ==========================================
     * NOTIFICA CONCLUSÃO
     * ==========================================
     */

    await Promise.allSettled(
        completedIds.map(
            id =>
                notifyTaskCompleted({
                    slack,

                    taskId: id,

                    completedBySlackId:
                        requesterSlackId,
                })
        )
    );


    /*
     * ==========================================
     * ATUALIZA SLACK HOME DOS ENVOLVIDOS
     * ==========================================
     */

    const affected =
        new Set<string>();


    affected.add(
        requesterSlackId
    );


    for (
        const task of tasksToConclude
    ) {

        affected.add(
            task.responsible
        );

        if (task.delegation) {
            affected.add(
                task.delegation
            );
        }

        for (
            const cc of task.carbonCopies
        ) {
            affected.add(
                cc.slackUserId
            );
        }
    }


    for (
        const task of nextCreated
    ) {

        affected.add(
            task.responsible
        );

        if (task.delegation) {
            affected.add(
                task.delegation
            );
        }

        for (
            const cc of
            task.carbonCopiesSlackIds ?? []
        ) {
            affected.add(cc);
        }
    }


    await Promise.allSettled(
        Array
            .from(affected)
            .map(
                userId =>
                    publishHome(
                        slack,
                        userId
                    )
            )
    );


    /*
     * ==========================================
     * RESULTADO PARA O PORTAL
     * ==========================================
     */

    return {
        completedIds,
        unauthorizedIds,
        nextCreatedIds:
            nextCreated.map(
                task => task.id
            ),
    };
}