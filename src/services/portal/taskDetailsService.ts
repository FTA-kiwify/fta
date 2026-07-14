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
  recurrence: string | null;
  project: string | null;
  projectId: string | null;
  notionProcessUrl: string | null;   // <-- adicionar
  copies: string[];
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

  };

}