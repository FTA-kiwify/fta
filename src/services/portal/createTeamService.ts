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

  return prisma.$transaction(
    async tx => {

      const team =
        await tx.team.create({
          data: {
            name,
            description,
            color,
            group: group || null,
          },
        });

      /*
       * Se estamos criando uma vertical/subtime,
       * vincula automaticamente os processos
       * existentes importados do Notion.
       *
       * Ex.:
       * group = Financeiro
       * name = FP&A
       *
       * notionTeam = Financeiro
       * notionVertical = FP&A
       */
      if (group) {

        await tx.process.updateMany({
          where: {
            teamId: null,

            notionTeam: {
              equals: group,
              mode: "insensitive",
            },

            notionVertical: {
              equals: name,
              mode: "insensitive",
            },
          },

          data: {
            teamId: team.id,
          },
        });
      }

      return team;
    }
  );
}