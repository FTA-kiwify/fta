import { prisma } from "../../lib/prisma";

type CreateTeamInput = {
  name: string;
  description?: string;
  color?: string;
  group?: string | null;
};

export async function createTeam({
  name,
  description,
  color,
  group,
}: CreateTeamInput) {

  return prisma.team.create({
    data: {
      name,
      description,
      color,
      group: group || null,
    },
  });

}