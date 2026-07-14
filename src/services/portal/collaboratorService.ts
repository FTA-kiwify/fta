import { prisma } from "../../lib/prisma";
import { resolveManySlackNames } from "../slackUserLookup";

export type Collaborator = {
  slackUserId: string;
  name: string;
  totalTasks: number;
};

export async function getCollaborators(): Promise<Collaborator[]> {

  const tasks = await prisma.task.findMany({
    where: {
      status: "pending",
    },
    select: {
      responsible: true,
    },
  });

  const totals = new Map<string, number>();

  for (const task of tasks) {

    const id = task.responsible?.trim();

    if (!id) continue;

    totals.set(id, (totals.get(id) ?? 0) + 1);

  }

  const ids = [...totals.keys()];

  const names = await resolveManySlackNames(ids);

  return ids
    .map(id => ({
      slackUserId: id,
      name: names[id] ?? id,
      totalTasks: totals.get(id) ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

}