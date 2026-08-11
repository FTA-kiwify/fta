import { prisma } from "../../lib/prisma";
import { getSlackUserName } from "../slackUserLookup";
import { getBrazilToday } from "../../utils/date";

export type DelegatedUpcomingTask = {
  id: string;
  title: string;
  responsibleSlackId: string;
  responsibleName: string;
  term: Date | null;
  deadlineTime: string | null;
  urgency: "light" | "asap" | "turbo";
  taskType: "normal" | "on_demand";
};

export type DelegatedCompletedTask = {
  id: string;
  title: string;
  responsibleSlackId: string;
  responsibleName: string;
  urgency: "light" | "asap" | "turbo";
  completedAt: Date;
};

export type DelegatedDashboardData = {
  pendingTasks: number;
  todayTasks: number;
  turboTasks: number;
  completedTodayTasks: number;
  upcomingTasks: DelegatedUpcomingTask[];
  completedToday: DelegatedCompletedTask[];
  userName: string;
};

export async function getDelegatedDashboardData(
  slackUserId: string
): Promise<DelegatedDashboardData> {

  if (!slackUserId) {
    throw new Error(
      "Slack User ID não informado."
    );
  }

  const userName =
    await getSlackUserName(slackUserId);

  const today = getBrazilToday();

  const tomorrow = new Date(today);
  tomorrow.setDate(
    tomorrow.getDate() + 1
  );

  /*
   * Somente tarefas que:
   *
   * 1. foram delegadas pelo usuário logado;
   * 2. possuem outra pessoa como responsável.
   *
   * Assim, tarefas criadas para si mesmo
   * continuam somente no Dashboard principal.
   */
  const delegatedWhere = {
    delegation: slackUserId,
    responsible: {
      not: slackUserId,
    },
  } as const;

  const [
    pendingTasks,
    todayTasks,
    turboTasks,
    completedTodayLogs,
    upcomingTaskRows,
  ] = await Promise.all([

    prisma.task.count({
      where: {
        ...delegatedWhere,
        status: "pending",
      },
    }),

    prisma.task.count({
      where: {
        ...delegatedWhere,
        status: "pending",
        term: {
          gte: today,
          lt: tomorrow,
        },
      },
    }),

    prisma.task.count({
      where: {
        ...delegatedWhere,
        status: "pending",
        urgency: "turbo",
      },
    }),

    /*
     * Aqui não usamos actorSlackId.
     *
     * No Dashboard principal ele funciona porque
     * queremos saber o que o próprio usuário concluiu.
     *
     * Aqui queremos saber quais tarefas delegadas
     * pelo usuário foram concluídas hoje,
     * independentemente de quem clicou em concluir.
     */
    prisma.taskAuditLog.findMany({
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
        task: {
          select: {
            id: true,
            title: true,
            responsible: true,
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
        ...delegatedWhere,
        status: "pending",

        OR: [
          {
            term: {
              not: null,
              gte: today,
            },
          },
          {
            taskType: "on_demand",
          },
        ],
      },

      select: {
        id: true,
        title: true,
        responsible: true,
        term: true,
        deadlineTime: true,
        urgency: true,
        taskType: true,
      },

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

  const upcomingTasks: DelegatedUpcomingTask[] =
    await Promise.all(
      upcomingTaskRows.map(
        async task => ({
          id: task.id,
          title: task.title,
          responsibleSlackId:
            task.responsible,
          responsibleName:
            await getSlackUserName(
              task.responsible
            ),
          term: task.term,
          deadlineTime:
            task.deadlineTime,
          urgency: task.urgency,
          taskType: task.taskType,
        })
      )
    );

  upcomingTasks.sort((a, b) => {

    if (
      a.taskType === "on_demand" &&
      b.taskType !== "on_demand"
    ) {
      return 1;
    }

    if (
      a.taskType !== "on_demand" &&
      b.taskType === "on_demand"
    ) {
      return -1;
    }

    const date =
      (a.term?.getTime() ??
        Number.MAX_SAFE_INTEGER) -
      (b.term?.getTime() ??
        Number.MAX_SAFE_INTEGER);

    if (date !== 0) {
      return date;
    }

    const urgency =
      urgencyOrder[a.urgency] -
      urgencyOrder[b.urgency];

    if (urgency !== 0) {
      return urgency;
    }

    return (
      a.deadlineTime ?? ""
    ).localeCompare(
      b.deadlineTime ?? ""
    );
  });

  const completedToday =
    await Promise.all(
      completedTodayLogs.map(
        async log => ({
          id: log.task.id,
          title: log.task.title,
          responsibleSlackId:
            log.task.responsible,
          responsibleName:
            await getSlackUserName(
              log.task.responsible
            ),
          urgency:
            log.task.urgency,
          completedAt:
            log.createdAt,
        })
      )
    );

  return {
    pendingTasks,
    todayTasks,
    turboTasks,
    completedTodayTasks:
      completedToday.length,
    upcomingTasks,
    completedToday,
    userName,
  };
}
