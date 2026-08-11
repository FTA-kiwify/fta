import { prisma } from "../../lib/prisma";
import { getSlackUserName } from "../slackUserLookup";

export type CollaboratorTask = {
    id: string;
    title: string;
    responsibleName: string;
    term: Date | null;
    deadlineTime: string | null;
    urgency: "light" | "asap" | "turbo";
    taskType: "normal" | "on_demand";
};



export type CollaboratorRecurrence = {
    name: string;
    tasks: CollaboratorTask[];
};

export type CollaboratorUrgency = {
    name: string;
    tasks: CollaboratorTask[];
};

export type CollaboratorDetails = {
    slackUserId: string;
    name: string;
    totalTasks: number;
    todayTasks: number;
    tasks: CollaboratorTask[];
    recurrences: CollaboratorRecurrence[];
    urgencies: CollaboratorUrgency[];
    members?: {
        slackUserId: string;
        name: string;
        openTasks: number;
    }[];
    completedToday: {
        id: string;
        title: string;
        urgency: "light" | "asap" | "turbo";
        completedAt: Date;
    }[];
    isTeam?: boolean;
};

export async function getTeamDetails(
    teamId: string
): Promise<CollaboratorDetails> {


    const team = await prisma.team.findUnique({
        where: {
            id: teamId,
        },
        include: {
            members: true,
        },
    });

    if (!team) {
        throw new Error("Time não encontrado.");
    }

    let slackUserIds: string[];

    if (team.group === null) {

        const teams = await prisma.team.findMany({
            where: {
                OR: [
                    {
                        id: team.id,
                    },
                    {
                        group: team.name,
                    },
                ],
            },
            include: {
                members: true,
            },
        });

        slackUserIds = [
            ...new Set(
                teams.flatMap(team =>
                    team.members.map(member => member.slackUserId)
                )
            ),
        ];

    } else {

        slackUserIds = team.members.map(
            member => member.slackUserId
        );

    }

    const tasks = await prisma.task.findMany({
        where: {
            responsible: {
                in: slackUserIds,
            },
            status: "pending",
            calendarPrivate: false,
        },

        orderBy: {
            term: "asc",
        },
    });

    const responsibleNames = new Map<string, string>();

    await Promise.all(
        [...new Set(tasks.map(task => task.responsible))]
            .map(async slackUserId => {
                responsibleNames.set(
                    slackUserId,
                    await getSlackUserName(slackUserId)
                );
            })
    );

    const getResponsibleName = (
        slackUserId: string
    ) =>
        responsibleNames.get(slackUserId) ??
        slackUserId;

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);

    tomorrow.setDate(tomorrow.getDate() + 1);

    const completedLogs = await prisma.taskAuditLog.findMany({

        where: {

            actorSlackId: {
                in: slackUserIds,
            },

            action: "TASK_DONE",

            createdAt: {
                gte: today,
                lt: tomorrow,
            },

        },

        include: {
            task: true,
        },

        orderBy: {
            createdAt: "desc",
        },

    });

    const todayTasks = tasks.filter(task => {

        if (!task.term) return false;

        return task.term >= today && task.term < tomorrow;

    }).length;



    const recurrences: CollaboratorRecurrence[] = [

        {
            name: "Diárias",
            tasks: tasks.filter(task => task.recurrence === "daily")
                .map(task => ({
                    id: task.id,
                    title: task.title,
                    responsibleName:
                        getResponsibleName(task.responsible),
                    term: task.term,
                    deadlineTime: task.deadlineTime,
                    urgency: task.urgency,
                    taskType: task.taskType,
                })),
        },

        {
            name: "Semanais",
            tasks: tasks.filter(task => task.recurrence === "weekly")
                .map(task => ({
                    id: task.id,
                    title: task.title,
                    responsibleName:
                        getResponsibleName(task.responsible),
                    term: task.term,
                    deadlineTime: task.deadlineTime,
                    urgency: task.urgency,
                    taskType: task.taskType,
                })),
        },

        {
            name: "Quinzenais",
            tasks: tasks.filter(task => task.recurrence === "biweekly")
                .map(task => ({
                    id: task.id,
                    title: task.title,
                    responsibleName:
                        getResponsibleName(task.responsible),
                    term: task.term,
                    deadlineTime: task.deadlineTime,
                    urgency: task.urgency,
                    taskType: task.taskType,
                })),
        },

        {
            name: "Mensais",
            tasks: tasks.filter(task => task.recurrence === "monthly")
                .map(task => ({
                    id: task.id,
                    title: task.title,
                    responsibleName:
                        getResponsibleName(task.responsible),
                    term: task.term,
                    deadlineTime: task.deadlineTime,
                    urgency: task.urgency,
                    taskType: task.taskType,
                })),
        },

        {
            name: "Trimestrais",
            tasks: tasks.filter(task => task.recurrence === "quarterly")
                .map(task => ({
                    id: task.id,
                    title: task.title,
                    responsibleName:
                        getResponsibleName(task.responsible),
                    term: task.term,
                    deadlineTime: task.deadlineTime,
                    urgency: task.urgency,
                    taskType: task.taskType,
                })),
        },

        {
            name: "Semestrais",
            tasks: tasks.filter(task => task.recurrence === "semiannual")
                .map(task => ({
                    id: task.id,
                    title: task.title,
                    responsibleName:
                        getResponsibleName(task.responsible),
                    term: task.term,
                    deadlineTime: task.deadlineTime,
                    urgency: task.urgency,
                    taskType: task.taskType,
                })),
        },

        {
            name: "Anuais",
            tasks: tasks.filter(task => task.recurrence === "annual")
                .map(task => ({
                    id: task.id,
                    title: task.title,
                    responsibleName:
                        getResponsibleName(task.responsible),
                    term: task.term,
                    deadlineTime: task.deadlineTime,
                    urgency: task.urgency,
                    taskType: task.taskType,
                })),
        },

        {
            name: "Sem recorrência",
            tasks: tasks.filter(task => task.recurrence === "none")
                .map(task => ({
                    id: task.id,
                    title: task.title,
                    responsibleName:
                        getResponsibleName(task.responsible),
                    term: task.term,
                    deadlineTime: task.deadlineTime,
                    urgency: task.urgency,
                    taskType: task.taskType,
                })),
        },

    ].filter(group => group.tasks.length > 0);


    const urgencies: CollaboratorUrgency[] = [

        {
            name: "🔴 Turbo",
            tasks: tasks
                .filter(task => task.urgency === "turbo")
                .map(task => ({
                    id: task.id,
                    title: task.title,
                    responsibleName:
                        getResponsibleName(task.responsible),
                    term: task.term,
                    deadlineTime: task.deadlineTime,
                    urgency: task.urgency,
                    taskType: task.taskType,
                })),
        },

        {
            name: "🟡 ASAP",
            tasks: tasks
                .filter(task => task.urgency === "asap")
                .map(task => ({
                    id: task.id,
                    title: task.title,
                    responsibleName:
                        getResponsibleName(task.responsible),
                    term: task.term,
                    deadlineTime: task.deadlineTime,
                    urgency: task.urgency,
                    taskType: task.taskType,
                })),
        },

        {
            name: "🟢 Light",
            tasks: tasks
                .filter(task => task.urgency === "light")
                .map(task => ({
                    id: task.id,
                    title: task.title,
                    responsibleName:
                        getResponsibleName(task.responsible),
                    term: task.term,
                    deadlineTime: task.deadlineTime,
                    urgency: task.urgency,
                    taskType: task.taskType,
                })),
        },

    ].filter(group => group.tasks.length > 0);

    let members;

    if (team.group === null) {

        const teams = await prisma.team.findMany({
            where: {
                OR: [
                    {
                        id: team.id,
                    },
                    {
                        group: team.name,
                    },
                ],
            },
            include: {
                members: true,
            },
        });

        members = teams.flatMap(team => team.members);

    } else {

        members = team.members;

    }

    return {
        isTeam: true,
        slackUserId: team.id,
        name: team.name,
        totalTasks: tasks.length,
        todayTasks,
        recurrences,
        urgencies,
        members: await Promise.all(

            slackUserIds.map(async slackUserId => ({

                slackUserId,

                name: await getSlackUserName(slackUserId),

                openTasks: await prisma.task.count({
                    where: {
                        responsible: slackUserId,
                        calendarPrivate: false,
                        status: {
                            in: [
                                "pending",
                                "blocked",
                                "overdue",
                            ],
                        },
                    },
                }),

            }))

        ),
        tasks: tasks.map(task => ({
            id: task.id,
            title: task.title,
            responsibleName:
                getResponsibleName(task.responsible),
            term: task.term,
            deadlineTime: task.deadlineTime,
            urgency: task.urgency,
            taskType: task.taskType,
        })),
        completedToday: completedLogs.map(log => ({
            id: log.task.id,
            title: log.task.title,
            urgency: log.task.urgency,
            completedAt: log.createdAt,
        })),
    };

}