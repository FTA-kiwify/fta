import type { FastifyInstance } from "fastify";

import { portalLayout } from "../portal/layout";
import { sidebar } from "../portal/components/sidebar";
import { topbar } from "../portal/components/topbar";

import { dashboardPage } from "../portal/pages/dashboard";
import { collaboratorsPage } from "../portal/pages/collaborators";
import { collaboratorPage } from "../portal/pages/collaborator";

import { taskPage } from "../portal/pages/task";

import { taskModal } from "../portal/components/taskModal";


import { getDashboardData } from "../services/portal/dashboardService";
import { getCollaborators } from "../services/portal/collaboratorService";
import { getCollaboratorDetails } from "../services/portal/collaboratorDetailsService";
import { getTeamDetails } from "../services/portal/teamDetailsService";

import { getTaskDetails } from "../services/portal/taskDetailsService";
import { getDashboardTaskList } from "../services/portal/dashboardTaskListService";
import { dashboardTasksModal } from "../portal/components/dashboardTasksModal";
import { getCollaboratorTaskList } from "../services/portal/collaboratorTaskListService";

import { portalLoginPage } from "../portal/pages/login";
import { getTeamTaskList } from "../services/portal/teamTaskListService";
import { teamMembersModal } from "../portal/components/teamMembersModal";
import { subTeamsPage } from "../portal/pages/subTeams";
import { prisma } from "../lib/prisma";
import { getSubTeams } from "../services/portal/subTeamsService";
import { createTeam } from "../services/portal/createTeamService";
import { teamCreateModal } from "../portal/components/teamCreateModal";
import {
  clearPortalCookie,
  getPortalUser,
  requirePortalUser,
} from "../portal/auth";

import { teamsPage } from "../portal/pages/teams";
import { getTeams } from "../services/portal/teamService";
import { addTeamMemberModal } from "../portal/components/addTeamMemberModal";
import { getAvailableCollaborators } from "../services/portal/availableCollaboratorsService";
import { processesPage } from "../portal/pages/processes";
import { getDepartments } from "../services/portal/processDepartmentsService";
import { getDepartmentTeams } from "../services/portal/processDepartmentDetailsService";
import { processDepartmentPage } from "../portal/pages/processDepartment";
import { getProcessTeamDetails } from "../services/portal/processTeamDetailsService";
import { processTeamPage } from "../portal/pages/processTeam";
import { getProcessDetails } from "../services/portal/processDetailsService";
import { processPage } from "../portal/pages/process";
import { getProcessDocumentation } from "../services/portal/processDocumentationService";
import {
  getPortalAccess,
  canAccessCollaborator,
  canAccessTeam,
  canAccessDepartment,
  canAccessProcess,
  canAccessTask,
} from "../services/portal/portalAccessService";
import { accessDeniedPage } from "../portal/pages/accessDenied";
import {
  getReportData,
  type ReportFilters,
} from "../services/portal/reportService";

import {
  reportsPage,
} from "../portal/pages/reports";
import ExcelJS from "exceljs";

function getTopbarUser(request: any) {

  const portalUser = getPortalUser(request);

  if (!portalUser) {
    return undefined;
  }

  return {
    name: portalUser.name,
    email: portalUser.email,
    image: portalUser.picture,
  };

}

export async function portalRoutes(app: FastifyInstance) {

  app.addHook(
    "preHandler",
    (request, reply, next) => {

      if (
        request.url === "/portal/login" ||
        request.url.startsWith(
          "/portal/login?"
        )
      ) {
        next();
        return;
      }

      requirePortalUser(
        request,
        reply,
        next
      );

    }
  );

  app.get("/portal/login", async (_request, reply) => {

    return reply
      .type("text/html")
      .send(portalLoginPage());

  });

  app.get("/portal", async (request, reply) => {

    const portalUser = getPortalUser(request);

    if (!portalUser) {
      return reply.redirect("/portal/login");
    }

    const dashboard = await getDashboardData(
      portalUser.slackUserId
    );

    return reply.type("text/html").send(
      portalLayout({
        title: "FTA Manager Portal",
        sidebar: sidebar("dashboard"),
        topbar: topbar({
          title: "Dashboard",
          user: getTopbarUser(request),
        }),
        body: dashboardPage(dashboard),
      })
    );

  });

  app.get("/portal/logout", async (_request, reply) => {

    clearPortalCookie(reply);

    return reply.redirect("/portal/login");

  });

  app.get("/portal/collaborators", async (request, reply) => {

    const portalUser = getPortalUser(request);

    if (!portalUser) {
      return reply.redirect("/portal/login");
    }

    const collaborators = await getCollaborators();

    return reply.type("text/html").send(
      portalLayout({
        title: "Colaboradores",
        sidebar: sidebar("collaborators"),
        topbar: topbar({
          title: "Colaboradores",
          searchPlaceholder: "Pesquisar colaborador...",
          user: getTopbarUser(request),
        }),
        body: collaboratorsPage(collaborators),
      })
    );

  });

  app.get("/portal/collaborators/:slackUserId", async (request, reply) => {

    const portalUser = getPortalUser(request);

    if (!portalUser) {
      return reply.redirect("/portal/login");
    }

    const { slackUserId } = request.params as {
      slackUserId: string;
    };

    const allowed = await canAccessCollaborator(
      portalUser.slackUserId,
      slackUserId
    );

    if (!allowed) {
      return reply.code(403).type("text/html").send(
        portalLayout({
          title: "Acesso não permitido",
          sidebar: sidebar("collaborators"),
          topbar: topbar({
            title: "Colaboradores",
            user: getTopbarUser(request),
          }),
          body: accessDeniedPage({
            message: "Você não tem acesso a este colaborador.",
            backHref: "/portal/collaborators",
          }),
        })
      );
    }

    const collaborator = await getCollaboratorDetails(
      slackUserId
    );

    return reply.type("text/html").send(
      portalLayout({
        title: collaborator.name,
        sidebar: sidebar("collaborators"),
        topbar: topbar({
          title: collaborator.name,
          user: getTopbarUser(request),
        }),
        body: collaboratorPage(collaborator),
      })
    );

  });

  app.get(
    "/portal/teams/create/modal",
    async (_request, reply) => {

      const departments = await prisma.team.findMany({
        where: {
          group: null,
        },
        orderBy: {
          name: "asc",
        },
        select: {
          id: true,
          name: true,
        },
      });

      return reply
        .type("text/html")
        .send(
          teamCreateModal(departments)
        );

    }
  );




  app.get(
    "/portal/processes",
    async (request, reply) => {

      const portalUser = getPortalUser(request);

      if (!portalUser) {
        return reply.redirect("/portal/login");
      }

      const departments = await getDepartments();

      return reply.type("text/html").send(
        portalLayout({
          title: "Processos",
          sidebar: sidebar("processes"),
          topbar: topbar({
            title: "Processos",
            user: getTopbarUser(request),
          }),
          body: processesPage(departments),
        })
      );

    }
  );
  app.get(
    "/portal/processes/department/:department",
    async (request, reply) => {

      const portalUser = getPortalUser(request);

      if (!portalUser) {
        return reply.redirect("/portal/login");
      }

      const { department } = request.params as {
        department: string;
      };

      const allowed = await canAccessDepartment(
        portalUser.slackUserId,
        department
      );

      if (!allowed) {
        return reply.code(403).type("text/html").send(
          portalLayout({
            title: "Acesso não permitido",
            sidebar: sidebar("processes"),
            topbar: topbar({
              title: "Processos",
              user: getTopbarUser(request),
            }),
            body: accessDeniedPage({
              message: "Você não tem acesso a este departamento.",
              backHref: "/portal/processes",
            }),
          })
        );
      }

      const teams = await getDepartmentTeams(department);

      return reply.type("text/html").send(
        portalLayout({
          title: department,
          sidebar: sidebar("processes"),
          topbar: topbar({
            title: department,
            user: getTopbarUser(request),
          }),
          body: processDepartmentPage(teams),
        })
      );

    }
  );
  app.get(
    "/portal/processes/team/:teamId",
    async (request, reply) => {

      const portalUser = getPortalUser(request);

      if (!portalUser) {
        return reply.redirect("/portal/login");
      }

      const { teamId } = request.params as {
        teamId: string;
      };

      const allowed = await canAccessTeam(
        portalUser.slackUserId,
        teamId
      );

      if (!allowed) {
        return reply.code(403).type("text/html").send(
          portalLayout({
            title: "Acesso não permitido",
            sidebar: sidebar("processes"),
            topbar: topbar({
              title: "Processos",
              user: getTopbarUser(request),
            }),
            body: accessDeniedPage({
              message: "Você não tem acesso a este time.",
              backHref: "/portal/processes",
            }),
          })
        );
      }

      const team = await getProcessTeamDetails(teamId);

      if (!team) {
        return reply.status(404).send("Time não encontrado.");
      }

      return reply.type("text/html").send(
        portalLayout({
          title: team.name,
          sidebar: sidebar("processes"),
          topbar: topbar({
            title: team.name,
            user: getTopbarUser(request),
          }),
          body: processTeamPage(team),
        })
      );

    }
  );
  app.get(
    "/portal/processes/:processId",
    async (request, reply) => {

      const portalUser = getPortalUser(request);

      if (!portalUser) {
        return reply.redirect("/portal/login");
      }

      const { processId } = request.params as {
        processId: string;
      };

      const allowed = await canAccessProcess(
        portalUser.slackUserId,
        processId
      );

      if (!allowed) {
        return reply.code(403).type("text/html").send(
          portalLayout({
            title: "Acesso não permitido",
            sidebar: sidebar("processes"),
            topbar: topbar({
              title: "Processos",
              user: getTopbarUser(request),
            }),
            body: accessDeniedPage({
              message: "Você não tem acesso a este processo.",
              backHref: "/portal/processes",
            }),
          })
        );
      }

      const process = await getProcessDetails(processId);

      if (!process) {
        return reply.status(404).send("Processo não encontrado.");
      }

      return reply.type("text/html").send(
        portalLayout({
          title: process.title,
          sidebar: sidebar("processes"),
          topbar: topbar({
            title: "Processos",
            user: getTopbarUser(request),
          }),
          body: processPage(process),
        })
      );

    }
  );
  app.get(
    "/portal/processes/:processId/documentation",
    async (request, reply) => {

      const portalUser = getPortalUser(request);

      if (!portalUser) {
        return reply.redirect("/portal/login");
      }

      const { processId } = request.params as {
        processId: string;
      };

      const allowed = await canAccessProcess(
        portalUser.slackUserId,
        processId
      );

      if (!allowed) {
        return reply.code(403).send(
          "Acesso não permitido."
        );
      }

      const html = await getProcessDocumentation(
        processId
      );

      if (!html) {
        return reply
          .status(404)
          .send("Processo não encontrado.");
      }

      return reply
        .type("text/html")
        .send(html);

    }
  );
  app.get("/portal/teams/:id", async (request, reply) => {

    const { id } = request.params as {
      id: string;
    };

    const portalUser = getPortalUser(request);

    if (!portalUser) {
      return reply.redirect("/portal/login");
    }

    const allowed = await canAccessTeam(
      portalUser.slackUserId,
      id
    );

    if (!allowed) {
      return reply.code(403).type("text/html").send(
        portalLayout({
          title: "Acesso não permitido",
          sidebar: sidebar("teams"),
          topbar: topbar({
            title: "Times",
            user: getTopbarUser(request),
          }),
          body: accessDeniedPage({
            message: "Você não tem acesso a este time.",
            backHref: "/portal/teams",
          }),
        })
      );
    }

    const team = await prisma.team.findUnique({
      where: {
        id,
      },
    });

    if (!team) {
      return reply.status(404).send("Time não encontrado.");
    }

    if (team.group === null) {

      const subTeams = await getSubTeams(id);

      return reply.type("text/html").send(
        portalLayout({
          title: team.name,
          sidebar: sidebar("teams"),
          topbar: topbar({
            title: team.name,
            user: getTopbarUser(request),
          }),
          body: subTeamsPage(
            team.id,
            subTeams
          ),
        })
      );

    }

    const details = await getTeamDetails(id);

    return reply.type("text/html").send(
      portalLayout({
        title: details.name,
        sidebar: sidebar("teams"),
        topbar: topbar({
          title: details.name,
          user: getTopbarUser(request),
        }),
        body: collaboratorPage(details),
      })
    );

  });

  app.get(
    "/portal/reports",
    async (request, reply) => {

      const portalUser =
        getPortalUser(request);

      if (!portalUser) {
        return reply.redirect(
          "/portal/login"
        );
      }

      const query =
        request.query as {
          verticalId?: string;
          collaboratorId?: string;
          processId?: string;
        };

      const filters: ReportFilters = {
        verticalId:
          query.verticalId?.trim() || undefined,

        collaboratorId:
          query.collaboratorId?.trim() ||
          undefined,

        processId:
          query.processId?.trim() || undefined,
      };

      try {

        const report =
          await getReportData(
            portalUser.slackUserId,
            filters
          );

        return reply
          .type("text/html")
          .send(
            portalLayout({
              title: "Relatórios",
              sidebar: sidebar("reports"),
              topbar: topbar({
                title: "Relatórios",
                user: getTopbarUser(request),
              }),
              body: reportsPage(report),
            })
          );

      } catch (error) {

        if (
          error instanceof Error &&
          error.message ===
          "REPORT_ACCESS_DENIED"
        ) {
          return reply
            .code(403)
            .type("text/html")
            .send(
              portalLayout({
                title: "Acesso não permitido",
                sidebar: sidebar("reports"),
                topbar: topbar({
                  title: "Relatórios",
                  user: getTopbarUser(request),
                }),
                body: accessDeniedPage({
                  message:
                    "Você não tem acesso aos dados selecionados.",
                  backHref:
                    "/portal/reports",
                }),
              })
            );
        }

        throw error;
      }

    }
  );

  app.get(
    "/portal/reports/:type/modal",
    async (request, reply) => {

      const portalUser =
        getPortalUser(request);

      if (!portalUser) {
        return reply
          .code(401)
          .send("Não autenticado.");
      }

      const { type } =
        request.params as {
          type: string;
        };

      const query =
        request.query as {
          verticalId?: string;
          collaboratorId?: string;
          processId?: string;
        };

      const filters: ReportFilters = {
        verticalId:
          query.verticalId?.trim() || undefined,

        collaboratorId:
          query.collaboratorId?.trim() ||
          undefined,

        processId:
          query.processId?.trim() || undefined,
      };

      const report =
        await getReportData(
          portalUser.slackUserId,
          filters
        );

      let title = "";
      let body = "";

      if (type === "activities") {

        title = "📋 Atividades";

        body = report.rows
          .map(row => `
          <div
            onclick="openPortalModal('/portal/tasks/${encodeURIComponent(row.id)}/modal')"
            style="
              padding:14px 0;
              border-bottom:1px solid #E5E7EB;
              cursor:pointer;
            "
          >
            <div
              style="
                font-weight:600;
                margin-bottom:5px;
              "
            >
              ${row.title}
            </div>

            <div
              style="
                font-size:13px;
                color:#6B7280;
              "
            >
              👤 ${row.responsibleName}
            </div>
          </div>
        `)
          .join("");
      }

      else if (type === "collaborators") {

        title = "👥 Colaboradores";

        const collaborators =
          new Map<string, {
            id: string;
            name: string;
            count: number;
          }>();

        for (const row of report.rows) {

          const current =
            collaborators.get(
              row.responsibleId
            );

          if (current) {
            current.count++;
          } else {
            collaborators.set(
              row.responsibleId,
              {
                id: row.responsibleId,
                name: row.responsibleName,
                count: 1,
              }
            );
          }
        }

        body = [...collaborators.values()]
          .sort((a, b) =>
            a.name.localeCompare(b.name)
          )
          .map(item => `
      <div
        onclick="window.location.href='/portal/collaborators/${encodeURIComponent(item.id)}'"
        style="
          padding:14px 6px;
          border-bottom:1px solid #E5E7EB;
          cursor:pointer;
          transition:background .15s ease;
        "
        onmouseover="
          this.style.background='#F8FAFC';
        "
        onmouseout="
          this.style.background='transparent';
        "
      >

        <div
          style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:16px;
          "
        >

          <div>

            <div
              style="
                font-weight:600;
                color:#1F2937;
              "
            >
              ${item.name}
            </div>

            <div
              style="
                font-size:13px;
                color:#6B7280;
                margin-top:4px;
              "
            >
              ${item.count}
              atividade${item.count === 1 ? "" : "s"}
            </div>

          </div>

          <span
            style="
              color:#94A3B8;
              font-size:20px;
            "
          >
            ›
          </span>

        </div>

      </div>
    `)
          .join("");
      }

      else if (type === "processes") {

        title = "📚 Processos";

        const processes =
          new Map<string, {
            id: string;
            name: string;
            count: number;
          }>();

        for (const row of report.rows) {

          if (
            !row.processId ||
            !row.processTitle
          ) {
            continue;
          }

          const current =
            processes.get(row.processId);

          if (current) {
            current.count++;
          } else {
            processes.set(
              row.processId,
              {
                id: row.processId,
                name: row.processTitle,
                count: 1,
              }
            );
          }
        }

        body = [...processes.values()]
          .sort((a, b) =>
            a.name.localeCompare(b.name)
          )
          .map(item => `
      <div
        onclick="window.location.href='/portal/processes/${encodeURIComponent(item.id)}'"
        style="
          padding:14px 6px;
          border-bottom:1px solid #E5E7EB;
          cursor:pointer;
          transition:background .15s ease;
        "
        onmouseover="
          this.style.background='#F8FAFC';
        "
        onmouseout="
          this.style.background='transparent';
        "
      >

        <div
          style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:16px;
          "
        >

          <div>

            <div
              style="
                font-weight:600;
                color:#1F2937;
              "
            >
              ${item.name}
            </div>

            <div
              style="
                font-size:13px;
                color:#6B7280;
                margin-top:4px;
              "
            >
              ${item.count}
              atividade${item.count === 1 ? "" : "s"}
            </div>

          </div>

          <span
            style="
              color:#94A3B8;
              font-size:20px;
            "
          >
            ›
          </span>

        </div>

      </div>
    `)
          .join("");
      }

      else if (type === "verticals") {

        title = "🏢 Verticais";

        const verticals =
          new Map<string, {
            id: string;
            name: string;
            count: number;
          }>();

        for (const row of report.rows) {

          if (
            !row.verticalId ||
            !row.verticalName
          ) {
            continue;
          }

          const current =
            verticals.get(row.verticalId);

          if (current) {
            current.count++;
          } else {
            verticals.set(
              row.verticalId,
              {
                id: row.verticalId,
                name: row.verticalName,
                count: 1,
              }
            );
          }
        }

        body = [...verticals.values()]
          .sort((a, b) =>
            a.name.localeCompare(b.name)
          )
          .map(item => `
      <div
        onclick="window.location.href='/portal/teams/${encodeURIComponent(item.id)}'"
        style="
          padding:14px 6px;
          border-bottom:1px solid #E5E7EB;
          cursor:pointer;
          transition:background .15s ease;
        "
        onmouseover="
          this.style.background='#F8FAFC';
        "
        onmouseout="
          this.style.background='transparent';
        "
      >

        <div
          style="
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:16px;
          "
        >

          <div>

            <div
              style="
                font-weight:600;
                color:#1F2937;
              "
            >
              ${item.name}
            </div>

            <div
              style="
                font-size:13px;
                color:#6B7280;
                margin-top:4px;
              "
            >
              ${item.count}
              atividade${item.count === 1 ? "" : "s"}
            </div>

          </div>

          <span
            style="
              color:#94A3B8;
              font-size:20px;
            "
          >
            ›
          </span>

        </div>

      </div>
    `)
          .join("");
      }

      else {
        return reply
          .code(404)
          .send("Relatório não encontrado.");
      }

      return reply
        .type("text/html")
        .send(`
        <div
          style="
            width:min(560px,90vw);
            max-height:75vh;
            overflow-y:auto;
            padding:26px;
          "
        >

          <h2
            style="
              margin:0 0 20px 0;
            "
          >
            ${title}
          </h2>

          ${body ||
          `
              <p
                style="
                  color:#6B7280;
                "
              >
                Nenhum item encontrado.
              </p>
            `
          }

        </div>
      `);

    }
  );

  app.get(
    "/portal/reports/export",
    async (request, reply) => {

      const portalUser =
        getPortalUser(request);

      if (!portalUser) {
        return reply.redirect(
          "/portal/login"
        );
      }

      const query =
        request.query as {
          verticalId?: string;
          collaboratorId?: string;
          processId?: string;
        };

      const filters: ReportFilters = {
        verticalId:
          query.verticalId?.trim() || undefined,

        collaboratorId:
          query.collaboratorId?.trim() ||
          undefined,

        processId:
          query.processId?.trim() || undefined,
      };

      try {

        const report =
          await getReportData(
            portalUser.slackUserId,
            filters
          );

        const workbook =
          new ExcelJS.Workbook();

        const worksheet =
          workbook.addWorksheet("Relatório FTA");

        worksheet.columns = [
          {
            header: "Atividade",
            key: "title",
            width: 42,
          },
          {
            header: "Responsável",
            key: "responsibleName",
            width: 28,
          },
          {
            header: "Recorrência",
            key: "recurrenceLabel",
            width: 20,
          },
          {
            header: "Processo",
            key: "processTitle",
            width: 36,
          },
          {
            header: "Notion",
            key: "notionUrl",
            width: 48,
          },
          {
            header: "Vertical",
            key: "vertical",
            width: 24,
          },
          {
            header: "Time",
            key: "team",
            width: 24,
          },
        ];

        for (const row of report.rows) {

          worksheet.addRow({
            title: row.title,
            responsibleName:
              row.responsibleName,
            recurrenceLabel:
              row.recurrence === "daily"
                ? "Diária"
                : row.recurrence === "weekly"
                  ? "Semanal"
                  : row.recurrence === "biweekly"
                    ? "Quinzenal"
                    : row.recurrence === "monthly"
                      ? "Mensal"
                      : row.recurrence === "quarterly"
                        ? "Trimestral"
                        : row.recurrence === "semiannual"
                          ? "Semestral"
                          : row.recurrence === "annual"
                            ? "Anual"
                            : "Sem recorrência",
            processTitle:
              row.processTitle ?? "",
            notionUrl:
              row.notionUrl ?? "",
            vertical:
              row.verticalName ?? "",
            team:
              row.teamName ?? "",
          });

        }

        const headerRow =
          worksheet.getRow(1);

        headerRow.font = {
          bold: true,
          color: {
            argb: "FFFFFFFF",
          },
        };

        headerRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: "FF25835D",
          },
        };

        headerRow.alignment = {
          vertical: "middle",
        };

        headerRow.height = 24;

        worksheet.views = [
          {
            state: "frozen",
            ySplit: 1,
          },
        ];

        worksheet.autoFilter = {
          from: "A1",
          to: "G1",
        };

        worksheet.eachRow(
          (row, rowNumber) => {

            if (rowNumber === 1) {
              return;
            }

            row.alignment = {
              vertical: "top",
            };

            row.getCell(5).value =
              row.getCell(5).value
                ? {
                  text: String(
                    row.getCell(5).value
                  ),
                  hyperlink: String(
                    row.getCell(5).value
                  ),
                }
                : "";

          }
        );

        const buffer =
          await workbook.xlsx.writeBuffer();

        const fileName =
          `relatorio_fta_${new Date()
            .toISOString()
            .slice(0, 10)}.xlsx`;

        return reply
          .header(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          )
          .header(
            "Content-Disposition",
            `attachment; filename="${fileName}"`
          )
          .send(Buffer.from(buffer));

      } catch (error) {

        if (
          error instanceof Error &&
          error.message ===
          "REPORT_ACCESS_DENIED"
        ) {
          return reply
            .code(403)
            .send(
              "Acesso não permitido."
            );
        }

        throw error;
      }

    }
  );

  app.get("/portal/tasks/:id", async (request, reply) => {

    const { id } = request.params as {
      id: string;
    };

    const portalUser = getPortalUser(request);

    if (!portalUser) {
      return reply.redirect("/portal/login");
    }

    const allowed = await canAccessTask(
      portalUser.slackUserId,
      id
    );

    if (!allowed) {
      return reply.code(403).type("text/html").send(
        portalLayout({
          title: "Acesso não permitido",
          sidebar: sidebar("dashboard"),
          topbar: topbar({
            title: "Dashboard",
            user: getTopbarUser(request),
          }),
          body: accessDeniedPage({
            message: "Você não tem acesso a esta tarefa.",
            backHref: "/portal",
          }),
        })
      );
    }

    const task = await getTaskDetails(id);

    return reply.type("text/html").send(
      portalLayout({
        title: task.title,
        sidebar: sidebar("dashboard"),
        topbar: topbar({
          title: task.title,
          user: getTopbarUser(request),
        }),
        body: taskPage(task),
      })
    );

  });

  app.get("/portal/tasks/:id/modal", async (request, reply) => {

    const { id } = request.params as {
      id: string;
    };

    const portalUser = getPortalUser(request);

    if (!portalUser) {
      return reply
        .code(401)
        .send("Não autenticado.");
    }

    const allowed = await canAccessTask(
      portalUser.slackUserId,
      id
    );

    if (!allowed) {
      return reply
        .code(403)
        .send("Acesso não permitido.");
    }

    const task = await getTaskDetails(id);

    return reply
      .type("text/html")
      .send(taskModal(task));

  });
  app.get(
    "/portal/dashboard/tasks/:filter/modal",
    async (request, reply) => {

      const { filter } = request.params as {
        filter: string;
      };

      const portalUser = getPortalUser(request);

      if (!portalUser) {
        return reply
          .code(401)
          .send("Não autenticado.");
      }

      const tasks = await getDashboardTaskList(
        portalUser.slackUserId,
        filter
      );

      const titles: Record<string, string> = {
        pending: "📋 Minhas tarefas",
        today: "📅 Vencem hoje",
        turbo: "🔥 Tarefas Turbo",
        completed: "✅ Concluídas hoje",
      };

      return reply
        .type("text/html")
        .send(
          dashboardTasksModal({
            title: titles[filter] ?? "Tarefas",
            tasks,
            completed: filter === "completed",
          })
        );

    }
  );
  app.get(
    "/portal/collaborators/:slackUserId/tasks/:filter/modal",
    async (request, reply) => {

      const {
        slackUserId,
        filter,
      } = request.params as {
        slackUserId: string;
        filter: string;
      };

      const portalUser = getPortalUser(request);

      if (!portalUser) {
        return reply
          .code(401)
          .send("Não autenticado.");
      }

      const allowed = await canAccessCollaborator(
        portalUser.slackUserId,
        slackUserId
      );

      if (!allowed) {
        return reply
          .code(403)
          .send("Acesso não permitido.");
      }

      const tasks = await getCollaboratorTaskList(
        slackUserId,
        filter
      );

      const titles: Record<string, string> = {
        pending: "📋 Tarefas abertas",
        today: "📅 Vencem hoje",
      };

      return reply
        .type("text/html")
        .send(
          dashboardTasksModal({
            title: titles[filter] ?? "Tarefas",
            tasks,
            completed: false,
          })
        );

    }
  );

  app.get(
    "/portal/teams/:teamId/tasks/:filter/modal",
    async (request, reply) => {

      const {
        teamId,
        filter,
      } = request.params as {
        teamId: string;
        filter: string;
      };

      const portalUser = getPortalUser(request);

      if (!portalUser) {
        return reply
          .code(401)
          .send("Não autenticado.");
      }

      const allowed = await canAccessTeam(
        portalUser.slackUserId,
        teamId
      );

      if (!allowed) {
        return reply
          .code(403)
          .send("Acesso não permitido.");
      }

      const tasks = await getTeamTaskList(
        teamId,
        filter
      );

      const titles: Record<string, string> = {
        pending: "📋 Tarefas abertas",
        today: "📅 Vencem hoje",
      };

      return reply
        .type("text/html")
        .send(
          dashboardTasksModal({
            title: titles[filter] ?? "Tarefas",
            tasks,
            completed: false,
          })
        );

    }
  );

  app.get(
    "/portal/teams/:id/members/modal",
    async (request, reply) => {

      const { id } = request.params as {
        id: string;
      };

      const portalUser = getPortalUser(request);

      if (!portalUser) {
        return reply
          .code(401)
          .send("Não autenticado.");
      }

      const allowed = await canAccessTeam(
        portalUser.slackUserId,
        id
      );

      if (!allowed) {
        return reply
          .code(403)
          .send("Acesso não permitido.");
      }

      const team = await getTeamDetails(id);

      return reply
        .type("text/html")
        .send(
          teamMembersModal({
            teamName: team.name,
            members: team.members ?? [],
            teamId: team.slackUserId,
          })
        );

    }
  );

  app.delete(
    "/portal/teams/:id",
    async (request, reply) => {

      const { id } = request.params as {
        id: string;
      };

      const team = await prisma.team.findUnique({
        where: {
          id,
        },
        include: {
          members: true,
        },
      });

      if (!team) {
        return reply.status(404).send();
      }

      const subteams = await prisma.team.count({
        where: {
          group: team.name,
        },
      });

      if (subteams > 0) {
        return reply.status(400).send({
          error: `Não é possível excluir este departamento porque ele possui ${subteams} subtime${subteams > 1 ? "s" : ""}. Remova os subtimes primeiro.`,
        });
      }

      if (team.members.length > 0) {
        return reply.status(400).send({
          error: `Não é possível excluir este time porque ele possui ${team.members.length} membro${team.members.length > 1 ? "s" : ""}. Remova os membros primeiro.`,
        });
      }

      await prisma.team.delete({
        where: {
          id,
        },
      });

      return reply.send({
        success: true,
      });

    }
  );




  app.get("/portal/teams", async (request, reply) => {

    const portalUser = getPortalUser(request);

    if (!portalUser) {
      return reply.redirect("/portal/login");
    }

    const teams = await getTeams();

    return reply.type("text/html").send(
      portalLayout({
        title: "Times",
        sidebar: sidebar("teams"),
        topbar: topbar({
          title: "Times",
          searchPlaceholder: "Pesquisar time...",
          user: getTopbarUser(request),
        }),
        body: teamsPage(teams),
      })
    );

  });
  app.get(
    "/portal/teams/:id/members/add/modal",
    async (request, reply) => {

      const { id } = request.params as {
        id: string;
      };

      const collaborators =
        await getAvailableCollaborators(id);

      return reply
        .type("text/html")
        .send(
          addTeamMemberModal({
            teamId: id,
            collaborators,
          })
        );

    }
  );

  app.post(
    "/portal/teams/:id/members",
    async (request, reply) => {

      const { id } = request.params as {
        id: string;
      };

      const body = request.body as {
        slackUserId: string;
      };

      await prisma.teamMember.create({
        data: {
          teamId: id,
          slackUserId: body.slackUserId,
        },
      });

      return reply.send({
        success: true,
      });

    }
  );

  app.delete(
    "/portal/teams/:teamId/members/:slackUserId",
    async (request, reply) => {

      const {
        teamId,
        slackUserId,
      } = request.params as {
        teamId: string;
        slackUserId: string;
      };

      await prisma.teamMember.delete({
        where: {
          teamId_slackUserId: {
            teamId,
            slackUserId,
          },
        },
      });

      return reply.send({
        success: true,
      });

    }
  );

}