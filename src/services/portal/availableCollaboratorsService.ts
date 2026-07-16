import { prisma } from "../../lib/prisma";
import { getSlackUserName } from "../slackUserLookup";

export async function getAvailableCollaborators(teamId: string) {

  const members = await prisma.teamMember.findMany({
    where: {
      teamId,
    },
    select: {
      slackUserId: true,
    },
  });

  const existingMembers = members.map(m => m.slackUserId);

  const users = await prisma.task.findMany({
    distinct: ["responsible"],
    select: {
      responsible: true,
    },
    where: {
      responsible: {
        notIn: existingMembers,
      },
    },
  });

  return Promise.all(

    users.map(async user => ({

      slackUserId: user.responsible,

      name: await getSlackUserName(user.responsible),

    }))

  );

}