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
  isTeam?: boolean;
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
};

export async function getCollaboratorDetails(
  slackUserId: string
): Promise<CollaboratorDetails> {

  const tasks = await prisma.task.findMany({
    where: {
      responsible: slackUserId,
      status: "pending",
      calendarPrivate: false,

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

  return {
    isTeam: false,
    slackUserId,
    name: await getSlackUserName(slackUserId),
    totalTasks: tasks.length,
    todayTasks,
    projects,
    recurrences,
    urgencies,
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