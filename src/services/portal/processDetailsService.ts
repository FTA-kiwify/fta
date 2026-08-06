import { prisma } from "../../lib/prisma";

export async function getProcessDetails(
    processId: string
) {

    return prisma.process.findUnique({

        where: {
            id: processId,
        },

        include: {

            team: true,

            tasks: {

                where: {

                    calendarPrivate: false,

                    status: {
                        in: [
                            "pending",
                            "blocked",
                            "overdue",
                        ],
                    },

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

}