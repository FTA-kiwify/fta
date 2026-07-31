import { prisma } from "../../lib/prisma";

export type Department = {
  name: string;
};

export async function getDepartments() {

  const departments = await prisma.team.findMany({
    where: {
      group: null,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      name: true,
    },
  });

  return departments;

}