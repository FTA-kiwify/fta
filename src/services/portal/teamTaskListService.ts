import { prisma } from "../../lib/prisma";

export async function getTeamTaskList(
  teamId: string,
  filter: string
) {

  const team = await prisma.team.findUnique({
    where: {
      id: teamId,
    },
    include: {
      members: true,
    },
  });

  if (!team) {
    return [];
  }

  let slackUserIds: string[];

  if (team.group === null) {

    const teams = await prisma.team.findMany({
      where: {
        OR: [
          {
            id: team.id,
          },
          {
            group: team.name,
          },
        ],
      },
      include: {
        members: true,
      },
    });

    slackUserIds = [
      ...new Set(
        teams.flatMap(team =>
          team.members.map(member => member.slackUserId)
        ),
      ),
    ];

  } else {

    slackUserIds = team.members.map(
      member => member.slackUserId
    );

  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  switch (filter) {

    case "pending":

      return prisma.task.findMany({
        where: {
          status: "pending",
          calendarPrivate: false,
          responsible: {
            in: slackUserIds,
          },
        },
        orderBy: {
          term: "asc",
        },
      });

    case "today":

      return prisma.task.findMany({
        where: {
          status: "pending",
          calendarPrivate: false,
          responsible: {
            in: slackUserIds,
          },
          term: {
            gte: today,
            lt: tomorrow,
          },
        },
        orderBy: {
          deadlineTime: "asc",
        },
      });

    case "turbo":

      return prisma.task.findMany({
        where: {
          status: "pending",
          calendarPrivate: false,
          responsible: {
            in: slackUserIds,
          },
          urgency: "turbo",
        },
        orderBy: {
          term: "asc",
        },
      });

    case "completed":

      return prisma.taskAuditLog.findMany({
        where: {
          actorSlackId: {
            in: slackUserIds,
          },
          action: "TASK_DONE",
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          task: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    default:
      return [];

  }

}