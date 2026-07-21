import { prisma } from "../../lib/prisma";

export async function getProjectTaskList(
  projectId: string,
  filter: string
) {

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  switch (filter) {

    case "today":

      return prisma.task.findMany({
        where: {
          projectId,
          calendarPrivate: false,
          status: {
            notIn: ["done", "cancelled"],
          },
          term: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          project: true,
        },
        orderBy: [
          {
            deadlineTime: "asc",
          },
          {
            term: "asc",
          },
        ],
      });

    case "completed":

      return prisma.task.findMany({
        where: {
          projectId,
          calendarPrivate: false,
          status: "done",
        },
        include: {
          project: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

    default:

      return prisma.task.findMany({
        where: {
          projectId,
          calendarPrivate: false,
          status: {
            notIn: ["done", "cancelled"],
          },
        },
        include: {
          project: true,
        },
        orderBy: [
          {
            term: "asc",
          },
          {
            deadlineTime: "asc",
          },
        ],
      });

  }

}