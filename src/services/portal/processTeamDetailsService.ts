import { prisma } from "../../lib/prisma";

export type ProcessTheme = {
  name: string;
  processes: {
    id: string;
    title: string;
  }[];
};

export type ProcessTeamDetails = {
  id: string;
  name: string;
  themes: ProcessTheme[];
};

export async function getProcessTeamDetails(
  teamId: string
): Promise<ProcessTeamDetails | null> {

  const team = await prisma.team.findUnique({
    where: {
      id: teamId,
    },
    include: {
      processes: {
        where: {
          active: true,
        },
        orderBy: [
          {
            theme: "asc",
          },
          {
            title: "asc",
          },
        ],
      },
    },
  });

  if (!team) {
    return null;
  }

  const themes = new Map<string, ProcessTheme>();

  for (const process of team.processes) {

    const themeName = process.theme?.trim() || "Sem tema";

    let theme = themes.get(themeName);

    if (!theme) {

      theme = {
        name: themeName,
        processes: [],
      };

      themes.set(themeName, theme);

    }

    theme.processes.push({
      id: process.id,
      title: process.title,
    });

  }

  return {
    id: team.id,
    name: team.name,
    themes: [...themes.values()],
  };

}