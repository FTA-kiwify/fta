import { prisma } from "../../lib/prisma";

export type Project = {
  id: string;
  name: string;
  status: string;
  totalTasks: number;
};

export async function getProjects(): Promise<Project[]> {

  const projects = await prisma.project.findMany({

    include: {
      _count: {
        select: {
          tasks: {
            where: {
              status: "pending",
            },
          },
        },
      },
    },

    orderBy: {
      name: "asc",
    },

  });

  return projects.map(project => ({

    id: project.id,
    name: project.name,
    status: project.status,
    totalTasks: project._count.tasks,

  }));

}