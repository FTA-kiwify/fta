import { prisma } from "../../lib/prisma";
import { resolveManySlackNames } from "../slackUserLookup";
import { getPortalAccess } from "./portalAccessService";

export type ReportFilters = {
  teamId?: string;
  collaboratorId?: string;
  processId?: string;
};

export type ReportOption = {
  id: string;
  name: string;
};

export type ReportRow = {
  id: string;
  title: string;
  responsibleId: string;
  responsibleName: string;
  recurrence: string;
  processId: string | null;
  processTitle: string | null;
  notionUrl: string | null;
  teamId: string | null;
  teamName: string | null;
  vertical: string | null;
};

export type ReportData = {
  vertical: string | null;
  teams: ReportOption[];
  collaborators: ReportOption[];
  processes: ReportOption[];
  rows: ReportRow[];
  filters: ReportFilters;
};

export async function getReportData(
  viewerSlackUserId: string,
  filters: ReportFilters = {}
): Promise<ReportData> {

  const access = await getPortalAccess(
    viewerSlackUserId
  );

  if (!access.department) {
    return {
      vertical: null,
      teams: [],
      collaborators: [],
      processes: [],
      rows: [],
      filters,
    };
  }

  /*
   * Times que pertencem à vertical permitida.
   * O departamento principal também está em teamIds,
   * mas para o filtro queremos principalmente os subtimes.
   */
  const teams = await prisma.team.findMany({
    where: {
      id: {
        in: access.teamIds,
      },
    },
    include: {
      members: {
        select: {
          slackUserId: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  /*
   * Validação de segurança dos filtros recebidos.
   */
  const selectedTeam =
    filters.teamId
      ? teams.find(team => team.id === filters.teamId)
      : null;

  if (filters.teamId && !selectedTeam) {
    throw new Error("REPORT_ACCESS_DENIED");
  }

  const allowedMemberIds = new Set(
    access.memberSlackUserIds
  );

  if (
    filters.collaboratorId &&
    !allowedMemberIds.has(filters.collaboratorId)
  ) {
    throw new Error("REPORT_ACCESS_DENIED");
  }

  /*
   * Processos acessíveis ao usuário.
   */
  const processes = await prisma.process.findMany({
    where: {
      active: true,
      teamId: {
        in: access.teamIds,
      },
    },
    select: {
      id: true,
      title: true,
      notionPageUrl: true,
      notionVertical: true,
      teamId: true,
      team: {
        select: {
          id: true,
          name: true,
          group: true,
        },
      },
    },
    orderBy: {
      title: "asc",
    },
  });

  const selectedProcess =
    filters.processId
      ? processes.find(
          process => process.id === filters.processId
        )
      : null;

  if (filters.processId && !selectedProcess) {
    throw new Error("REPORT_ACCESS_DENIED");
  }

  /*
   * Se um time foi selecionado, limita colaboradores
   * e processos às opções daquele time.
   */
  const collaboratorIdsForOptions =
    selectedTeam
      ? selectedTeam.members.map(
          member => member.slackUserId
        )
      : access.memberSlackUserIds;

  const processOptions = processes.filter(
    process =>
      !selectedTeam ||
      process.teamId === selectedTeam.id
  );

  const collaboratorNames =
    await resolveManySlackNames(
      collaboratorIdsForOptions
    );

  const collaborators = collaboratorIdsForOptions
    .map(id => ({
      id,
      name: collaboratorNames[id] ?? id,
    }))
    .sort((a, b) =>
      a.name.localeCompare(b.name)
    );

  /*
   * Busca das tarefas.
   *
   * Segurança principal:
   * responsável precisa estar dentro da vertical
   * à qual o usuário tem acesso.
   */
  const tasks = await prisma.task.findMany({
    where: {
      calendarPrivate: false,

      status: {
        in: [
          "pending",
          "blocked",
          "overdue",
        ],
      },

      responsible: {
        in: access.memberSlackUserIds,
      },

      ...(filters.collaboratorId
        ? {
            responsible:
              filters.collaboratorId,
          }
        : {}),

      ...(filters.processId
        ? {
            processId: filters.processId,
          }
        : {}),
    },

    select: {
      id: true,
      title: true,
      responsible: true,
      recurrence: true,
      processId: true,

      process: {
        select: {
          id: true,
          title: true,
          notionPageUrl: true,
          notionVertical: true,
          teamId: true,

          team: {
            select: {
              id: true,
              name: true,
              group: true,
            },
          },
        },
      },
    },

    orderBy: {
      title: "asc",
    },
  });

  /*
   * Mapa responsável -> time.
   * Serve também para tarefas sem processo.
   */
  const memberTeamMap = new Map<
    string,
    {
      id: string;
      name: string;
      vertical: string;
    }
  >();

  for (const team of teams) {
    for (const member of team.members) {

      /*
       * Dá preferência ao subtime.
       * Evita que Financeiro sobrescreva Tesouraria,
       * por exemplo.
       */
      const existing =
        memberTeamMap.get(member.slackUserId);

      if (
        !existing ||
        team.group !== null
      ) {
        memberTeamMap.set(
          member.slackUserId,
          {
            id: team.id,
            name: team.name,
            vertical:
              team.group ??
              access.department.name,
          }
        );
      }
    }
  }

  let filteredTasks = tasks;

  /*
   * O filtro de time precisa considerar:
   *
   * 1. time do processo, quando houver;
   * 2. time do responsável, quando não houver processo.
   */
  if (selectedTeam) {
    filteredTasks = tasks.filter(task => {

      if (task.process?.teamId) {
        return (
          task.process.teamId === selectedTeam.id
        );
      }

      return (
        memberTeamMap.get(task.responsible)?.id ===
        selectedTeam.id
      );

    });
  }

  const responsibleIds = [
    ...new Set(
      filteredTasks.map(task => task.responsible)
    ),
  ];

  const responsibleNames =
    await resolveManySlackNames(
      responsibleIds
    );

  const rows: ReportRow[] =
    filteredTasks.map(task => {

      const responsibleTeam =
        memberTeamMap.get(task.responsible);

      const processTeam =
        task.process?.team ?? null;

      return {
        id: task.id,
        title: task.title,

        responsibleId: task.responsible,

        responsibleName:
          responsibleNames[task.responsible] ??
          task.responsible,

        recurrence:
          task.recurrence ?? "none",

        processId:
          task.process?.id ?? null,

        processTitle:
          task.process?.title ?? null,

        notionUrl:
          task.process?.notionPageUrl ?? null,

        teamId:
          processTeam?.id ??
          responsibleTeam?.id ??
          null,

        teamName:
          processTeam?.name ??
          responsibleTeam?.name ??
          null,

        vertical:
          processTeam?.group ??
          task.process?.notionVertical ??
          responsibleTeam?.vertical ??
          access.department?.name ??
          null,
      };

    });

  return {
    vertical: access.department.name,

    teams: teams
      .filter(team => team.group !== null)
      .map(team => ({
        id: team.id,
        name: team.name,
      })),

    collaborators,

    processes: processOptions.map(
      process => ({
        id: process.id,
        name: process.title,
      })
    ),

    rows,
    filters,
  };
}