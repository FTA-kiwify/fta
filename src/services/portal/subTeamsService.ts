import { prisma } from "../../lib/prisma";

export type SubTeam = {
  id: string;
  name: string;
  members: number;
  openTasks: number;
  todayTasks: number;
};

export async function getSubTeams(
  departmentId: string
): Promise<SubTeam[]> {

  const department = await prisma.team.findUnique({
    where: {
      id: departmentId,
    },
  });

  if (!department) {
    return [];
  }

  const teams = await prisma.team.findMany({
    where: {
      group: department.name,
    },
    include: {
      members: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return Promise.all(

    teams.map(async team => {

      const slackIds = team.members.map(
        member => member.slackUserId
      );

      const openTasks = await prisma.task.count({
        where: {
          responsible: {
            in: slackIds,
          },
          status: {
            in: [
              "pending",
              "blocked",
              "overdue",
            ],
          },
        },
      });

      const today = new Date();
      today.setHours(0,0,0,0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate()+1);

      const todayTasks = await prisma.task.count({
        where:{
          responsible:{
            in: slackIds,
          },
          status:{
            in:[
              "pending",
              "blocked",
              "overdue",
            ],
          },
          term:{
            gte: today,
            lt: tomorrow,
          },
        },
      });

      return{
        id: team.id,
        name: team.name,
        members: team.members.length,
        openTasks,
        todayTasks,
      };

    })

  );

}