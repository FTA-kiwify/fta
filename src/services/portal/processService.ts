import { prisma } from "../../lib/prisma";

export type ProcessTree = {
    team: {
        id: string;
        name: string;
    };
    verticals: {
        name: string;
        themes: {
            name: string;
            processes: {
                id: string;
                title: string;
            }[];
        }[];
    }[];
};

export async function getProcessTree() {
    const processes = await prisma.process.findMany({
        where: {
            active: true,
            teamId: {
                not: null,
            },
        },
        include: {
            team: true,
        },
        orderBy: [
            {
                team: {
                    name: "asc",
                },
            },
            {
                notionVertical: "asc",
            },
            {
                theme: "asc",
            },
            {
                title: "asc",
            },
        ],
    });
    const teams = new Map<string, ProcessTree>();
    for (const process of processes) {

        if (!process.team) {
            continue;
        }
        let team = teams.get(process.team.id);

        if (!team) {

            team = {
                team: {
                    id: process.team.id,
                    name: process.team.name,
                },
                verticals: [],
            };

            teams.set(process.team.id, team);

        }

        let vertical = team.verticals.find(
            vertical => vertical.name === process.notionVertical
        );

        if (!vertical) {

            vertical = {
                name: process.notionVertical,
                themes: [],
            };

            team.verticals.push(vertical);

        }
        const themeName = process.theme?.trim() || "Sem tema";

        let theme = vertical.themes.find(
            theme => theme.name === themeName
        );

        if (!theme) {

            theme = {
                name: themeName,
                processes: [],
            };

            vertical.themes.push(theme);

        }
        theme.processes.push({
            id: process.id,
            title: process.title,
        });
    }
    return [...teams.values()];
}