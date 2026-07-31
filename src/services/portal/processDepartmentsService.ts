import { prisma } from "../../lib/prisma";

export type Department = {
  name: string;
  processCount: number;
};

export async function getDepartments(): Promise<Department[]> {

  const departments = await prisma.team.findMany({
    where: {
      group: null,
    },
    orderBy: {
      name: "asc",
    },
  });

  const result: Department[] = [];

  for (const department of departments) {

    const subTeams = await prisma.team.findMany({
      where: {
        group: department.name,
      },
      select: {
        id: true,
      },
    });

    const processCount = await prisma.process.count({
      where: {
        active: true,
        teamId: {
          in: subTeams.map(team => team.id),
        },
      },
    });

    result.push({
      name: department.name,
      processCount,
    });

  }

  return result;

}