import { prisma } from "../../lib/prisma";
import { getSlackUserName } from "../slackUserLookup";

export type ProjectTask = {
    id: string;
    title: string;
    term: Date | null;
    deadlineTime: string | null;
    responsible: string;
    urgency: "light" | "asap" | "turbo";
    status: string;
};

export type ProjectDetails = {
    id: string;
    name: string;
    status: string;
    totalTasks: number;
    pendingTasks: number;
    completedTasks: number;
    todayTasks: number;
    members: {
        slackUserId: string;
        name: string;
    }[];
    tasks: ProjectTask[];
    description: string | null;
};

export async function getProjectDetails(
    projectId: string
): Promise<ProjectDetails> {

    const project = await prisma.project.findUniqueOrThrow({

        where: {
            id: projectId,
        },

        include: {
            tasks: {
                orderBy: [
                    {
                        status: "asc",
                    },
                    {
                        term: "asc",
                    },
                ],
            },
        },

    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const memberIds = [
        ...new Set(
            project.tasks.map(task => task.responsible)
        ),
    ];

    const members = await Promise.all(
        memberIds.map(async slackUserId => ({
            slackUserId,
            name: await getSlackUserName(slackUserId),
        }))
    );

    const tasks = await Promise.all(

        project.tasks.map(async task => ({

            id: task.id,
            title: task.title,
            term: task.term,
            deadlineTime: task.deadlineTime,
            responsible: await getSlackUserName(task.responsible),
            urgency: task.urgency,
            status: task.status,

        }))

    );

    const pendingTasks = tasks.filter(
        task =>
            task.status !== "done" &&
            task.status !== "cancelled"
    );

    const completedTasks = tasks.filter(
        task => task.status === "done"
    );

    return {

        id: project.id,

        name: project.name,

        description: project.description,

        status: project.status,

        totalTasks: tasks.length,

        pendingTasks: pendingTasks.length,

        completedTasks: completedTasks.length,

        todayTasks: pendingTasks.filter(task =>
            task.term &&
            task.term >= today &&
            task.term < tomorrow
        ).length,

        members,

        tasks,

    };

}