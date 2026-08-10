import { prisma } from "../../lib/prisma";

export type PortalAccess = {
    department: {
        id: string;
        name: string;
    } | null;

    teamIds: string[];
    memberSlackUserIds: string[];
};

export async function getPortalAccess(
    slackUserId: string
): Promise<PortalAccess> {

    /*
     * Descobre todos os times dos quais o usuário faz parte.
     *
     * Normalmente será um subtime, por exemplo:
     * Tesouraria -> group = Financeiro
     */
    const memberships = await prisma.teamMember.findMany({
        where: {
            slackUserId,
        },

        include: {
            team: true,
        },
    });

    if (memberships.length === 0) {
        return {
            department: null,
            teamIds: [],
            memberSlackUserIds: [],
        };
    }

    /*
     * Descobre o departamento principal.
     *
     * Se o usuário estiver diretamente no departamento:
     * group === null
     *
     * Se estiver em um subtime:
     * group contém o nome do departamento.
     */
    let departmentName: string | null = null;

    for (const membership of memberships) {
        if (membership.team.group) {
            departmentName = membership.team.group;
            break;
        }

        if (membership.team.group === null) {
            departmentName = membership.team.name;
            break;
        }
    }

    if (!departmentName) {
        return {
            department: null,
            teamIds: [],
            memberSlackUserIds: [],
        };
    }

    const department = await prisma.team.findFirst({
        where: {
            name: departmentName,
            group: null,
        },

        select: {
            id: true,
            name: true,
        },
    });

    if (!department) {
        return {
            department: null,
            teamIds: [],
            memberSlackUserIds: [],
        };
    }

    /*
     * Todos os subtimes pertencentes ao mesmo departamento.
     *
     * Ex:
     * Financeiro
     * ├── Tesouraria
     * ├── FP&A
     * ├── Controladoria
     * ├── Compras
     * └── Contas a pagar
     */
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
            members: {
                select: {
                    slackUserId: true,
                },
            },
        },
    });

    const teamIds = teams.map(team => team.id);

    const memberSlackUserIds = [
        ...new Set(
            teams.flatMap(team =>
                team.members.map(member => member.slackUserId)
            )
        ),
    ];

    return {
        department,
        teamIds,
        memberSlackUserIds,
    };
}

export async function canAccessCollaborator(
    viewerSlackUserId: string,
    targetSlackUserId: string
) {

    /*
     * Sempre pode acessar a própria página.
     */
    if (viewerSlackUserId === targetSlackUserId) {
        return true;
    }

    const access = await getPortalAccess(viewerSlackUserId);

    return access.memberSlackUserIds.includes(
        targetSlackUserId
    );
}

export async function canAccessTeam(
    viewerSlackUserId: string,
    teamId: string
) {

    const access = await getPortalAccess(viewerSlackUserId);

    return access.teamIds.includes(teamId);
}

export async function canAccessDepartment(
    viewerSlackUserId: string,
    departmentName: string
) {

    const access = await getPortalAccess(viewerSlackUserId);

    return access.department?.name === departmentName;
}

export async function canAccessProcess(
    viewerSlackUserId: string,
    processId: string
) {

    const process = await prisma.process.findUnique({
        where: {
            id: processId,
        },

        select: {
            teamId: true,
        },
    });

    if (!process?.teamId) {
        return false;
    }

    const access = await getPortalAccess(viewerSlackUserId);

    return access.teamIds.includes(process.teamId);


}
export async function canAccessTask(
    viewerSlackUserId: string,
    taskId: string
) {

    const task = await prisma.task.findUnique({
        where: {
            id: taskId,
        },
        select: {
            responsible: true,
        },
    });

    if (!task) {
        return false;
    }

    // A própria tarefa sempre pode ser visualizada
    if (task.responsible === viewerSlackUserId) {
        return true;
    }

    // Caso contrário, aplica a mesma regra de acesso
    // utilizada para colaboradores.
    return canAccessCollaborator(
        viewerSlackUserId,
        task.responsible
    );
}