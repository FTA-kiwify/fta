import { prisma } from "../../lib/prisma";
import { getSlackUserName } from "../slackUserLookup";
import { getBrazilToday } from "../../utils/date";

export type UpcomingTask = {
  id: string;
  title: string;
  responsibleSlackId: string;
  responsibleName: string;
  term: Date;
  deadlineTime: string | null;
  urgency: "light" | "asap" | "turbo";
};

export type CompletedTask = {
  id: string;
  title: string;
  urgency: "light" | "asap" | "turbo";
  completedAt: Date;
};

export type DashboardData = {
  pendingTasks: number;
  todayTasks: number;
  turboTasks: number;
  completedTodayTasks: number;
  upcomingTasks: UpcomingTask[];
  completedToday: CompletedTask[];
  userName: string;
};

export async function getDashboardData(
  slackUserId: string
): Promise<DashboardData> {

  if (!slackUserId) {
    throw new Error(
      "Slack User ID não informado."
    );
  }

  const userName =
    await getSlackUserName(slackUserId);

  const today = getBrazilToday();

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    pendingTasks,
    todayTasks,
    turboTasks,
    completedTodayTasks,
    completedTodayLogs,
    upcomingTaskRows,
  ] = await Promise.all([

    prisma.task.count({
      where: {
        status: "pending",
        responsible: slackUserId,
      },
    }),

    prisma.task.count({
      where: {
        status: "pending",
        responsible: slackUserId,
        term: {
          gte: today,
          lt: tomorrow,
        },
      },
    }),

    prisma.task.count({
      where: {
        status: "pending",
        responsible: slackUserId,
        urgency: "turbo",
      },
    }),

    prisma.taskAuditLog.count({
      where: {
        actorSlackId: slackUserId,
        action: "TASK_DONE",
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    }),

    prisma.taskAuditLog.findMany({
      where: {
        actorSlackId: slackUserId,
        action: "TASK_DONE",
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            urgency: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.task.findMany({
      where: {
        status: "pending",
        responsible: slackUserId,
        term: {
          not: null,
          gte: today,
        },
      },
      select: {
        id: true,
        title: true,
        responsible: true,
        term: true,
        deadlineTime: true,
        urgency: true,
      },
      take: 10,
      orderBy: {
        term: "asc",
      },
    }),

  ]);

  const urgencyOrder = {
    turbo: 0,
    asap: 1,
    light: 2,
  };

  const upcomingTasks: UpcomingTask[] = upcomingTaskRows
    .filter(
      (task): task is typeof task & { term: Date } =>
        task.term !== null
    )
    .map(task => ({
      id: task.id,
      title: task.title,
      responsibleSlackId: task.responsible,
      responsibleName: "Você",
      term: task.term,
      deadlineTime: task.deadlineTime,
      urgency: task.urgency,
    }))
    .sort((a, b) => {

      const date = a.term.getTime() - b.term.getTime();

      if (date !== 0) {
        return date;
      }

      const urgency =
        urgencyOrder[a.urgency] -
        urgencyOrder[b.urgency];

      if (urgency !== 0) {
        return urgency;
      }

      return (a.deadlineTime ?? "").localeCompare(
        b.deadlineTime ?? ""
      );

    });

  const completedToday = completedTodayLogs.map(log => ({
    id: log.task.id,
    title: log.task.title,
    urgency: log.task.urgency,
    completedAt: log.createdAt,
  }));

  return {
    pendingTasks,
    todayTasks,
    turboTasks,
    completedTodayTasks,
    upcomingTasks,
    completedToday,
    userName,
  };

}