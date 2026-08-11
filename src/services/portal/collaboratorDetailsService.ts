import { prisma } from "../../lib/prisma";
import { getSlackUserName } from "../slackUserLookup";

export type CollaboratorTask = {
  id: string;
  title: string;
  term: Date | null;
  deadlineTime: string | null;
  urgency: "light" | "asap" | "turbo";
  taskType: "normal" | "on_demand";
  responsibleName?: string;
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
  isTeam?: boolean;
  slackUserId: string;
  name: string;
  totalTasks: number;
  todayTasks: number;

  tasks: CollaboratorTask[];

  completedToday: {
    id: string;
    title: string;
    urgency: "light" | "asap" | "turbo";
    completedAt: Date;
  }[];

  recurrences: CollaboratorRecurrence[];
  urgencies: CollaboratorUrgency[];

  members?: {
    slackUserId: string;
    name: string;
  }[];
};

export async function getCollaboratorDetails(
  slackUserId: string
): Promise<CollaboratorDetails> {

    const responsibleName =
    await getSlackUserName(slackUserId);

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);

  tomorrow.setDate(
    tomorrow.getDate() + 1
  );

  const tasks = await prisma.task.findMany({

    where: {
      responsible: slackUserId,
      status: "pending",
      calendarPrivate: false,
    },


    orderBy: {
      term: "asc",
    },

  });

  const completedLogs =
    await prisma.taskAuditLog.findMany({

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

  const todayTasks = tasks.filter(task => {

    if (!task.term) {
      return false;
    }

    return (
      task.term >= today &&
      task.term < tomorrow
    );

  }).length;

  

  const recurrences: CollaboratorRecurrence[] = [

    {
      name: "Diárias",
      tasks: tasks
        .filter(task => task.recurrence === "daily")
        .map(task => ({
          id: task.id,
          title: task.title,
          term: task.term,
          deadlineTime: task.deadlineTime,
          urgency: task.urgency,
          taskType: task.taskType,
          responsibleName,
        })),
    },

    {
      name: "Semanais",
      tasks: tasks
        .filter(task => task.recurrence === "weekly")
        .map(task => ({
          id: task.id,
          title: task.title,
          term: task.term,
          deadlineTime: task.deadlineTime,
          urgency: task.urgency,
          taskType: task.taskType,
          responsibleName,
        })),
    },

    {
      name: "Quinzenais",
      tasks: tasks
        .filter(task => task.recurrence === "biweekly")
        .map(task => ({
          id: task.id,
          title: task.title,
          term: task.term,
          deadlineTime: task.deadlineTime,
          urgency: task.urgency,
          taskType: task.taskType,
          responsibleName,
        })),
    },

    {
      name: "Mensais",
      tasks: tasks
        .filter(task => task.recurrence === "monthly")
        .map(task => ({
          id: task.id,
          title: task.title,
          term: task.term,
          deadlineTime: task.deadlineTime,
          urgency: task.urgency,
          taskType: task.taskType,
          responsibleName,
        })),
    },

    {
      name: "Trimestrais",
      tasks: tasks
        .filter(task => task.recurrence === "quarterly")
        .map(task => ({
          id: task.id,
          title: task.title,
          term: task.term,
          deadlineTime: task.deadlineTime,
          urgency: task.urgency,
          taskType: task.taskType,
          responsibleName,
        })),
    },

    {
      name: "Semestrais",
      tasks: tasks
        .filter(task => task.recurrence === "semiannual")
        .map(task => ({
          id: task.id,
          title: task.title,
          term: task.term,
          deadlineTime: task.deadlineTime,
          urgency: task.urgency,
          taskType: task.taskType,
          responsibleName,
        })),
    },

    {
      name: "Anuais",
      tasks: tasks
        .filter(task => task.recurrence === "annual")
        .map(task => ({
          id: task.id,
          title: task.title,
          term: task.term,
          deadlineTime: task.deadlineTime,
          urgency: task.urgency,
          taskType: task.taskType,
          responsibleName,
        })),
    },

    {
      name: "Sem recorrência",
      tasks: tasks
        .filter(task => task.recurrence === "none")
        .map(task => ({
          id: task.id,
          title: task.title,
          term: task.term,
          deadlineTime: task.deadlineTime,
          urgency: task.urgency,
          taskType: task.taskType,
          responsibleName,
        })),
    },

  ].filter(
    group => group.tasks.length > 0
  );


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
          urgency: task.urgency,
          taskType: task.taskType,
          responsibleName,
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
          urgency: task.urgency,
          taskType: task.taskType,
          responsibleName,
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
          urgency: task.urgency,
          taskType: task.taskType,
          responsibleName,
        })),
    },

  ].filter(group => group.tasks.length > 0);

  return {

    isTeam: false,

    slackUserId,

    name: responsibleName,

    totalTasks: tasks.length,

    todayTasks,

    completedToday: completedLogs.map(log => ({
      id: log.task.id,
      title: log.task.title,
      urgency: log.task.urgency,
      completedAt: log.createdAt,
    })),

    recurrences,

    urgencies,

    tasks: tasks.map(task => ({
      id: task.id,
      title: task.title,
      term: task.term,
      deadlineTime: task.deadlineTime,
      urgency: task.urgency,
      taskType: task.taskType,
      responsibleName,
    })),

  };

}