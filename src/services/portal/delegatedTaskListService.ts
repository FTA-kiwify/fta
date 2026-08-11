import { prisma } from "../../lib/prisma";
import { getBrazilToday } from "../../utils/date";

export async function getDelegatedTaskList(
  slackUserId: string,
  filter: string
) {

  const today = getBrazilToday();

  const tomorrow = new Date(today);
  tomorrow.setDate(
    tomorrow.getDate() + 1
  );

  switch (filter) {

    case "pending":

      return prisma.task.findMany({
        where: {
          status: "pending",
          delegation: slackUserId,

          // "Delegadas por mim":
          // não inclui tarefa criada para si mesma.
          responsible: {
            not: slackUserId,
          },
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


    case "today":

      return prisma.task.findMany({
        where: {
          status: "pending",
          delegation: slackUserId,

          responsible: {
            not: slackUserId,
          },

          term: {
            gte: today,
            lt: tomorrow,
          },
        },

        orderBy: {
          deadlineTime: "asc",
        },
      });


    case "turbo":

      return prisma.task.findMany({
        where: {
          status: "pending",
          delegation: slackUserId,

          responsible: {
            not: slackUserId,
          },

          urgency: "turbo",
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


    case "completed":

      return prisma.taskAuditLog.findMany({
        where: {
          action: "TASK_DONE",

          createdAt: {
            gte: today,
            lt: tomorrow,
          },

          task: {
            delegation: slackUserId,

            responsible: {
              not: slackUserId,
            },
          },
        },

        include: {
          task: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });


    default:
      return [];
  }
}
