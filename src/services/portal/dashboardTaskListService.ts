import { prisma } from "../../lib/prisma";

const slackUserId = process.env.PORTAL_TEST_SLACK_USER!;

export async function getDashboardTaskList(filter: string) {

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  switch (filter) {

    case "pending":

      return prisma.task.findMany({
        where: {
          status: "pending",
          responsible: slackUserId,
        },
        orderBy: {
          term: "asc",
        },
      });

    case "today":

      return prisma.task.findMany({
        where: {
          status: "pending",
          responsible: slackUserId,
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
          responsible: slackUserId,
          urgency: "turbo",
        },
        orderBy: {
          term: "asc",
        },
      });

    case "completed":

      return prisma.taskAuditLog.findMany({
        where: {
          actorSlackId: slackUserId,
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

    default:
      return [];

  }

}