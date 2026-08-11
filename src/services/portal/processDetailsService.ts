import { prisma } from "../../lib/prisma";
import { getSlackUserName } from "../slackUserLookup";

export async function getProcessDetails(
  processId: string
) {

  const process =
    await prisma.process.findUnique({

      where: {
        id: processId,
      },

      include: {

        team: true,

        tasks: {

          where: {
            calendarPrivate: false,
            status: "pending",
          },

          orderBy: [
            {
              status: "asc",
            },
            {
              term: "asc",
            },
          ],

        },

      },

    });

  if (!process) {
    return null;
  }

  const tasks = await Promise.all(
    process.tasks.map(async task => ({
      ...task,

      responsibleName:
        await getSlackUserName(
          task.responsible
        ),
    }))
  );

  return {
    ...process,
    tasks,
  };
}