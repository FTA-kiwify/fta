import { prisma } from "../../lib/prisma";
import { resolveManySlackNames } from "../slackUserLookup";
import { getPortalAccess } from "./portalAccessService";

export type PortalCreateTaskOption = {
  id: string;
  name: string;
};

export type PortalCreateTaskOptions = {
  collaborators: PortalCreateTaskOption[];

  processes: Array<{
    id: string;
    name: string;
  }>;

  dependencies: Array<{
    id: string;
    name: string;
  }>;
};

export async function getPortalCreateTaskOptions(
  viewerSlackUserId: string
): Promise<PortalCreateTaskOptions> {

  const access =
    await getPortalAccess(
      viewerSlackUserId
    );

  if (!access.department) {
    return {
      collaborators: [],
      processes: [],
      dependencies: [],
    };
  }

  /*
   * =====================================================
   * COLABORADORES
   * =====================================================
   *
   * Todos os membros do departamento permitido.
   */

  const collaboratorIds =
    Array.from(
      new Set(
        access.memberSlackUserIds
      )
    );

  /*
   * Garante que o próprio usuário também
   * apareça caso exista alguma inconsistência
   * de membership.
   */
  if (
    !collaboratorIds.includes(
      viewerSlackUserId
    )
  ) {
    collaboratorIds.push(
      viewerSlackUserId
    );
  }

  const collaboratorNames =
    await resolveManySlackNames(
      collaboratorIds
    );

  const collaborators =
    collaboratorIds
      .map(id => ({
        id,
        name:
          collaboratorNames[id] ?? id,
      }))
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      );

  /*
   * =====================================================
   * PROCESSOS
   * =====================================================
   *
   * Apenas processos ativos dos times
   * aos quais o Portal dá acesso.
   */

  const rawProcesses =
    await prisma.process.findMany({
      where: {
        active: true,

        teamId: {
          in: access.teamIds,
        },
      },

      select: {
        id: true,
        title: true,
        theme: true,
        notionVertical: true,

        team: {
          select: {
            name: true,
            group: true,
          },
        },
      },

      orderBy: [
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

  const processes =
    rawProcesses.map(process => {

      const vertical =
        process.team?.name ??
        process.notionVertical;

      const theme =
        process.theme?.trim();

      const parts = [
        vertical,
        theme,
        process.title,
      ].filter(Boolean);

      return {
        id: process.id,
        name: parts.join(" › "),
      };
    });

  /*
   * =====================================================
   * DEPENDÊNCIAS
   * =====================================================
   *
   * Mesma regra utilizada no Slack:
   *
   * - tarefa ainda aberta;
   * - usuário é responsável;
   * - OU delegou;
   * - OU está em cópia.
   */

  const rawDependencies =
    await prisma.task.findMany({
      where: {
        status: {
          notIn: [
            "done",
            "cancelled",
          ],
        },

        OR: [
          {
            responsible:
              viewerSlackUserId,
          },
          {
            delegation:
              viewerSlackUserId,
          },
          {
            carbonCopies: {
              some: {
                slackUserId:
                  viewerSlackUserId,
              },
            },
          },
        ],
      },

      select: {
        id: true,
        title: true,
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 50,
    });

  const dependencies =
    rawDependencies.map(task => ({
      id: task.id,
      name: task.title,
    }));

  return {
    collaborators,
    processes,
    dependencies,
  };
}
