import { prisma } from "../../lib/prisma";

export type DepartmentTeam = {
  id: string;
  name: string;
  processCount: number;
};

export async function getDepartmentTeams(
  department: string
): Promise<DepartmentTeam[]> {

  const teams = await prisma.team.findMany({
    where: {
      group: department,
    },
    orderBy: {
      name: "asc",
    },
    include: {
      _count: {
        select: {
          processes: {
            where: {
              active: true,
            },
          },
        },
      },
    },
  });

  return teams.map(team => ({
    id: team.id,
    name: team.name,
    processCount: team._count.processes,
  }));

}