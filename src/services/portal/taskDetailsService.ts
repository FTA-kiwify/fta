import { prisma } from "../../lib/prisma";
import { getSlackUserName } from "../slackUserLookup";

export type TaskDetails = {
  id: string;
  title: string;
  description: string | null;
  responsible: string;
  delegatedBy: string | null;
  deadline: Date | null;
  originalDeadline: Date | null;
  deadlineTime: string | null;

  urgency: "light" | "asap" | "turbo";
  taskType: "normal" | "on_demand";
  calendarPrivate: boolean;

  recurrence: string | null;
  project: string | null;
  projectId: string | null;
  notionProcessUrl: string | null;
  copies: string[];

  auditLogs: {
    id: string;
    action: string;
    actorName: string | null;
    actorSlackId: string | null;
    beforeJson: unknown;
    afterJson: unknown;
    createdAt: Date;
  }[];
};

export async function getTaskDetails(
  id: string
): Promise<TaskDetails> {

  const task = await prisma.task.findUniqueOrThrow({

    where: {
      id,
    },

    include: {
      project: true,
      carbonCopies: true,

      auditLogs: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
    },

  });

  const responsible = await getSlackUserName(
    task.responsible
  );

  const delegatedBy = task.delegation
    ? await getSlackUserName(task.delegation)
    : null;

  const copies = await Promise.all(
    task.carbonCopies.map(cc =>
      getSlackUserName(cc.slackUserId)
    )
  );
  const auditLogs = await Promise.all(

    task.auditLogs.map(async log => ({

      ...log,

      actorName:
        log.actorName ??
        (
          log.actorSlackId
            ? await getSlackUserName(log.actorSlackId)
            : "Sistema"
        )

    }))

  );

  return {

    id: task.id,

    title: task.title,

    description: task.description,

    responsible,

    delegatedBy,

    deadline: task.term,

    originalDeadline: task.originalTerm,

    deadlineTime: task.deadlineTime,

    urgency: task.urgency,

    recurrence: task.recurrence,

    project: task.project?.name ?? null,

    copies,
    projectId: task.project?.id ?? null,
    notionProcessUrl: task.notionProcessUrl,
    auditLogs,
    taskType: task.taskType,
    calendarPrivate: task.calendarPrivate,

  };

}