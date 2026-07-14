import { prisma } from "../../lib/prisma";
import { getSlackUserName } from "../slackUserLookup";

export type ProjectTask = {
    id: string;
    title: string;
    term: Date | null;
    deadlineTime: string | null;
    responsible: string;
    urgency: "light" | "asap" | "turbo";
};

export type ProjectDetails = {
    id: string;
    name: string;
    status: string;
    totalTasks: number;
    todayTasks: number;
    members: string[];
    tasks: ProjectTask[];
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
                where: {
                    status: "pending",
                },
                orderBy: {
                    term: "asc",
                },
            },
        },

    });

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);

    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await Promise.all(

        project.tasks.map(async task => ({

            id: task.id,
            title: task.title,
            term: task.term,
            deadlineTime: task.deadlineTime,
            responsible: await getSlackUserName(task.responsible),
            urgency: task.urgency,

        }))

    );

    return {

        id: project.id,
        name: project.name,
        status: project.status,

        totalTasks: tasks.length,

        todayTasks: tasks.filter(task =>
            task.term &&
            task.term >= today &&
            task.term < tomorrow
        ).length,

        members: [...new Set(tasks.map(task => task.responsible))],
        tasks,

    };

}