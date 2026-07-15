import { prisma } from "../../lib/prisma";
import { getSlackUserName } from "../slackUserLookup";

export type CollaboratorTask = {
    id: string;
    title: string;
    term: Date | null;
    deadlineTime: string | null;
    project: string | null;
    urgency: "light" | "asap" | "turbo";
};

export type CollaboratorProject = {
    id: string | null;
    name: string;
    count: number;
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
    projects: CollaboratorProject[];
    recurrences: CollaboratorRecurrence[];
    urgencies: CollaboratorUrgency[];
    members?: {
        slackUserId: string;
        name: string;
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
        },
        include: {
            project: true,
        },
        orderBy: {
            term: "asc",
        },
    });

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);

    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTasks = tasks.filter(task => {

        if (!task.term) return false;

        return task.term >= today && task.term < tomorrow;

    }).length;

    const projectsMap = new Map<
        string,
        {
            id: string | null;
            name: string;
            count: number;
        }
    >();

    for (const task of tasks) {

        if (!task.project) {
            continue;
        }

        const existing = projectsMap.get(task.project.id);

        if (existing) {

            existing.count++;

        } else {

            projectsMap.set(task.project.id, {
                id: task.project.id,
                name: task.project.name,
                count: 1,
            });

        }

    }

    const projects = [...projectsMap.values()]
        .sort((a, b) => b.count - a.count);

    const recurrences: CollaboratorRecurrence[] = [

        {
            name: "Diárias",
            tasks: tasks.filter(task => task.recurrence === "daily")
                .map(task => ({
                    id: task.id,
                    title: task.title,
                    term: task.term,
                    deadlineTime: task.deadlineTime,
                    project: task.project?.name ?? null,
                    urgency: task.urgency,
                })),
        },

        {
            name: "Semanais",
            tasks: tasks.filter(task => task.recurrence === "weekly")
                .map(task => ({
                    id: task.id,
                    title: task.title,
                    term: task.term,
                    deadlineTime: task.deadlineTime,
                    project: task.project?.name ?? null,
                    urgency: task.urgency,
                })),
        },

        {
            name: "Quinzenais",
            tasks: tasks.filter(task => task.recurrence === "biweekly")
                .map(task => ({
                    id: task.id,
                    title: task.title,
                    term: task.term,
                    deadlineTime: task.deadlineTime,
                    project: task.project?.name ?? null,
                    urgency: task.urgency,
                })),
        },

        {
            name: "Mensais",
            tasks: tasks.filter(task => task.recurrence === "monthly")
                .map(task => ({
                    id: task.id,
                    title: task.title,
                    term: task.term,
                    deadlineTime: task.deadlineTime,
                    project: task.project?.name ?? null,
                    urgency: task.urgency,
                })),
        },

        {
            name: "Trimestrais",
            tasks: tasks.filter(task => task.recurrence === "quarterly")
                .map(task => ({
                    id: task.id,
                    title: task.title,
                    term: task.term,
                    deadlineTime: task.deadlineTime,
                    project: task.project?.name ?? null,
                    urgency: task.urgency,
                })),
        },

        {
            name: "Semestrais",
            tasks: tasks.filter(task => task.recurrence === "semiannual")
                .map(task => ({
                    id: task.id,
                    title: task.title,
                    term: task.term,
                    deadlineTime: task.deadlineTime,
                    project: task.project?.name ?? null,
                    urgency: task.urgency,
                })),
        },

        {
            name: "Anuais",
            tasks: tasks.filter(task => task.recurrence === "annual")
                .map(task => ({
                    id: task.id,
                    title: task.title,
                    term: task.term,
                    deadlineTime: task.deadlineTime,
                    project: task.project?.name ?? null,
                    urgency: task.urgency,
                })),
        },

        {
            name: "Sem recorrência",
            tasks: tasks.filter(task => task.recurrence === "none")
                .map(task => ({
                    id: task.id,
                    title: task.title,
                    term: task.term,
                    deadlineTime: task.deadlineTime,
                    project: task.project?.name ?? null,
                    urgency: task.urgency,
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
                    term: task.term,
                    deadlineTime: task.deadlineTime,
                    project: task.project?.name ?? null,
                    urgency: task.urgency,
                })),
        },

        {
            name: "🟡 ASAP",
            tasks: tasks
                .filter(task => task.urgency === "asap")
                .map(task => ({
                    id: task.id,
                    title: task.title,
                    term: task.term,
                    deadlineTime: task.deadlineTime,
                    project: task.project?.name ?? null,
                    urgency: task.urgency,
                })),
        },

        {
            name: "🟢 Light",
            tasks: tasks
                .filter(task => task.urgency === "light")
                .map(task => ({
                    id: task.id,
                    title: task.title,
                    term: task.term,
                    deadlineTime: task.deadlineTime,
                    project: task.project?.name ?? null,
                    urgency: task.urgency,
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
        projects,
        recurrences,
        urgencies,
        members: await Promise.all(

            members.map(async member => ({

                slackUserId: member.slackUserId,

                name: await getSlackUserName(
                    member.slackUserId
                ),

            }))

        ),
        tasks: tasks.map(task => ({
            id: task.id,
            title: task.title,
            term: task.term,
            deadlineTime: task.deadlineTime,
            project: task.project?.name ?? null,
            urgency: task.urgency,
        })),
    };

}