import { WebClient } from "@slack/web-api";
import { prisma } from "../../lib/prisma";
import { getPortalAccess } from "./portalAccessService";

const slack = new WebClient(
  process.env.SLACK_BOT_TOKEN
);

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
   * No Slack, o modal usa users_select / multi_users_select.
   * Portanto, a população é o workspace do Slack.
   *
   * No Portal fazemos a mesma coisa através de users.list().
   */

  const collaborators: PortalCreateTaskOption[] = [];

  let cursor: string | undefined;

  do {

    const response = await slack.users.list({
      limit: 200,
      ...(cursor ? { cursor } : {}),
    });

    for (const member of response.members ?? []) {

      /*
       * Ignora:
       * - usuários sem ID;
       * - bots;
       * - usuários deletados/desativados.
       */

      if (!member.id) {
        continue;
      }

      if (member.deleted) {
        continue;
      }

      if (member.is_bot) {
        continue;
      }

      /*
       * O Slack normalmente também possui o Slackbot.
       */
      if (member.id === "USLACKBOT") {
        continue;
      }

      const name =
        member.profile?.display_name?.trim() ||
        member.profile?.real_name?.trim() ||
        member.real_name?.trim() ||
        member.name?.trim() ||
        member.id;

      collaborators.push({
        id: member.id,
        name,
      });
    }

    cursor =
      response.response_metadata
        ?.next_cursor
        ?.trim() || undefined;

  } while (cursor);

  collaborators.sort((a, b) =>
    a.name.localeCompare(
      b.name,
      "pt-BR"
    )
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
