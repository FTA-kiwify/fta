import { prisma } from "../../lib/prisma";

export type DepartmentTree = {
    name: string;
    teams: TeamTree[];
};

type TeamTree = {
    id: string;
    name: string;
    themes: ThemeTree[];
};

type ThemeTree = {
    name: string;
    processes: ProcessTree[];
};

type ProcessTree = {
    id: string;
    title: string;
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
                    group: "asc",
                },
            },
            {
                team: {
                    name: "asc",
                },
            },
            {
                theme: "asc",
            },
            {
                title: "asc",
            },
        ],
    });
    const departments = new Map<string, DepartmentTree>();

    for (const process of processes) {

        if (!process.team) {
            continue;
        }
        const teamData = process.team;

        const departmentName = teamData.group || "Sem departamento";

        let department = departments.get(departmentName);

        if (!department) {

            department = {
                name: departmentName,
                teams: [],
            };

            departments.set(departmentName, department);

        }
        let team = department.teams.find(
            team => team.id === teamData.id
        );

        if (!team) {

            team = {
                id: teamData.id,
                name: teamData.name,
                themes: [],
            };

            department.teams.push(team);

        }

        const themeName = process.theme?.trim() || "Sem tema";

        let theme = team.themes.find(
            theme => theme.name === themeName
        );

        if (!theme) {

            theme = {
                name: themeName,
                processes: [],
            };

            team.themes.push(theme);

        }
        theme.processes.push({
            id: process.id,
            title: process.title,
        });

    }
    return [...departments.values()];
}