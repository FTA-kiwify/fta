import { prisma } from "../../lib/prisma";
import { resolveManySlackNames } from "../slackUserLookup";
import { getPortalAccess } from "./portalAccessService";

export type ReportFilters = {
  verticalId?: string;
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
  taskType: "normal" | "on_demand";
  responsibleId: string;
  responsibleName: string;
  backupResponsibleId: string | null;
  backupResponsibleName: string;
  recurrence: string;
  processId: string | null;
  processTitle: string | null;
  notionUrl: string | null;
  verticalId: string | null;
  verticalName: string | null;
  teamName: string | null;
};

export type ReportData = {
  team: string | null;
  verticals: ReportOption[];
  collaborators: ReportOption[];
  processes: ReportOption[];
  rows: ReportRow[];
  filters: ReportFilters;
};

export async function getReportData(
  viewerSlackUserId: string,
  filters: ReportFilters = {}
): Promise<ReportData> {
  const access = await getPortalAccess(viewerSlackUserId);

  if (!access.department) {
    return {
      team: null,
      verticals: [],
      collaborators: [],
      processes: [],
      rows: [],
      filters,
    };
  }

  /*
   * REGRA:
   *
   * Time = departamento principal
   * Ex.: Financeiro
   *
   * Vertical = subtimes
   * Ex.: Tesouraria, Compras, FP&A...
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

  const verticals = teams.filter(
    team => team.group !== null
  );

  /*
   * Segurança do filtro de vertical.
   */
  const selectedVertical = filters.verticalId
    ? verticals.find(
      vertical => vertical.id === filters.verticalId
    )
    : null;

  if (filters.verticalId && !selectedVertical) {
    throw new Error("REPORT_ACCESS_DENIED");
  }

  /*
   * Membros permitidos.
   *
   * Se houver vertical selecionada, limita aos membros dela.
   */
  const memberIds = selectedVertical
    ? selectedVertical.members.map(
      member => member.slackUserId
    )
    : access.memberSlackUserIds;

  const allowedMemberIds = new Set(memberIds);

  if (
    filters.collaboratorId &&
    !allowedMemberIds.has(filters.collaboratorId)
  ) {
    throw new Error("REPORT_ACCESS_DENIED");
  }

  /*
   * Processos do time.
   */
  const allProcesses = await prisma.process.findMany({
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

  /*
   * Se uma vertical estiver selecionada,
   * mostra somente os processos daquela vertical.
   */
  const processOptions = allProcesses.filter(
    process =>
      !selectedVertical ||
      process.teamId === selectedVertical.id
  );

  const selectedProcess = filters.processId
    ? processOptions.find(
      process => process.id === filters.processId
    )
    : null;

  if (filters.processId && !selectedProcess) {
    throw new Error("REPORT_ACCESS_DENIED");
  }

  /*
   * Colaboradores disponíveis no filtro.
   */
  const collaboratorNames =
    await resolveManySlackNames(memberIds);

  const collaborators = memberIds
    .map(id => ({
      id,
      name: collaboratorNames[id] ?? id,
    }))
    .sort((a, b) =>
      a.name.localeCompare(b.name)
    );

  /*
   * Mapa:
   *
   * colaborador -> vertical
   */
  const memberVerticalMap = new Map<
    string,
    {
      id: string;
      name: string;
    }
  >();

  for (const vertical of verticals) {
    for (const member of vertical.members) {
      memberVerticalMap.set(
        member.slackUserId,
        {
          id: vertical.id,
          name: vertical.name,
        }
      );
    }
  }

  /*
   * Busca das tarefas.
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
        in: memberIds,
      },

      ...(filters.collaboratorId
        ? {
          responsible:
            filters.collaboratorId,
        }
        : {}),

      ...(filters.processId
        ? {
          processId:
            filters.processId,
        }
        : {}),
    },

    select: {
      id: true,
      title: true,
      taskType: true,
      responsible: true,
      backupResponsible: true,
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
   * Segurança adicional:
   *
   * quando houver vertical selecionada,
   * uma tarefa só entra se:
   *
   * - o processo for da vertical;
   * OU
   * - sem processo, o responsável pertencer à vertical.
   */
  let filteredTasks = tasks;

  if (selectedVertical) {
    filteredTasks = tasks.filter(task => {
      if (task.process?.teamId) {
        return (
          task.process.teamId === selectedVertical.id
        );
      }

      return (
        memberVerticalMap.get(task.responsible)?.id ===
        selectedVertical.id
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

  const backupResponsibleIds = [
    ...new Set(
      filteredTasks
        .map(task => task.backupResponsible)
        .filter(
          (id): id is string =>
            Boolean(id)
        )
    ),
  ];

  const backupResponsibleNames =
    await resolveManySlackNames(
      backupResponsibleIds
    );

  const rows: ReportRow[] =
    filteredTasks.map(task => {
      const responsibleVertical =
        memberVerticalMap.get(task.responsible);

      const processVertical =
        task.process?.team ?? null;

      return {
        id: task.id,
        title: task.title,

        taskType: task.taskType,

        responsibleId: task.responsible,

        responsibleName:
          responsibleNames[task.responsible] ??
          task.responsible,

        backupResponsibleId:
          task.backupResponsible ?? null,

        backupResponsibleName:
          task.backupResponsible
            ? (
              backupResponsibleNames[
              task.backupResponsible
              ] ??
              task.backupResponsible
            )
            : "—",

        recurrence:
          task.recurrence ?? "none",

        processId:
          task.process?.id ?? null,

        processTitle:
          task.process?.title ?? null,

        notionUrl:
          task.process?.notionPageUrl ?? null,

        verticalId:
          processVertical?.id ??
          responsibleVertical?.id ??
          null,

        verticalName:
          processVertical?.name ??
          responsibleVertical?.name ??
          task.process?.notionVertical ??
          null,

        /*
         * O time é sempre o departamento principal.
         */
        teamName:
          access.department?.name ?? null,
      };
    });

  return {
    team: access.department.name,

    verticals: verticals.map(
      vertical => ({
        id: vertical.id,
        name: vertical.name,
      })
    ),

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