import { prisma } from "../../lib/prisma";

export async function getCollaboratorTaskList(
  slackUserId: string,
  filter: string
) {

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (filter === "today") {

    return prisma.task.findMany({
      where: {
        responsible: slackUserId,
        status: "pending",
        calendarPrivate: false,
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

  }

  return prisma.task.findMany({
    where: {
      responsible: slackUserId,
      status: "pending",
      calendarPrivate: false,
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