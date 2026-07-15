import { prisma } from "../../lib/prisma";

export type Team = {
  id: string;
  name: string;
  group: string | null;
  members: number;
  openTasks: number;
  todayTasks: number;
};

export async function getTeams() {

  const departments = await prisma.team.findMany({
    where: {
      group: null,
    },
    orderBy: {
      name: "asc",
    },
  });

  return Promise.all(

    departments.map(async (department) => {

      const teams = await prisma.team.findMany({
        where: {
          OR: [
            {
              id: department.id,
            },
            {
              group: department.name,
            },
          ],
        },
        include: {
          members: true,
        },
      });

      const slackUserIds = [
        ...new Set(
          teams.flatMap(team =>
            team.members.map(member => member.slackUserId)
          )
        ),
      ];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const openTasks = await prisma.task.count({
        where: {
          status: {
            in: [
              "pending",
              "blocked",
              "overdue",
            ],
          },
          responsible: {
            in: slackUserIds,
          },
        },
      });

      const todayTasks = await prisma.task.count({
        where: {
          status: {
            in: [
              "pending",
              "blocked",
              "overdue",
            ],
          },
          responsible: {
            in: slackUserIds,
          },
          term: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      return {
        id: department.id,
        name: department.name,
        group: null,
        members: slackUserIds.length,
        openTasks,
        todayTasks,
      };

    })

  );

}