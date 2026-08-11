import type { FastifyInstance } from "fastify";

import { portalLayout } from "../portal/layout";
import { sidebar } from "../portal/components/sidebar";
import { topbar } from "../portal/components/topbar";

import { dashboardPage } from "../portal/pages/dashboard";
import { delegatedDashboardPage } from "../portal/pages/delegatedDashboard";
import { collaboratorsPage } from "../portal/pages/collaborators";
import { collaboratorPage } from "../portal/pages/collaborator";

import { taskPage } from "../portal/pages/task";

import { taskModal } from "../portal/components/taskModal";


import { getDashboardData } from "../services/portal/dashboardService";
import { getDelegatedDashboardData } from "../services/portal/delegatedDashboardService";
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
import { createTaskModal } from "../portal/components/createTaskModal";
import {
  getPortalCreateTaskOptions,
} from "../services/portal/createTaskOptionsService";
import { WebClient } from "@slack/web-api";
import { createTaskService } from "../services/createTaskService";
import { syncTaskParticipantEmails } from "../services/syncTaskParticipantEmails";
import {
  syncCalendarEventForTask,
  deleteCalendarEventForTask,
} from "../services/googleCalendar";
import { notifyTaskCreated } from "../services/notifyTaskCreated";
import { publishHome } from "../services/publishHome";
import { completeTaskFlow } from "../services/completeTaskFlow";
import { rescheduleTasksModal } from "../portal/components/rescheduleTasksModal";
import { rescheduleTaskService } from "../services/rescheduleTaskService";
import { updateTaskOpenMessage } from "../services/updateTaskOpenMessage";
import { notifyTaskRescheduledGroup } from "../services/notifyTaskRescheduledGroup";
import { updateTaskService } from "../services/updateTaskService";
import { notifyTaskEdited } from "../services/notifyTaskEdited";
import { handleTaskResponsibleReassign } from "../services/handleTaskResponsibleReassign";
import { getSlackUserName } from "../services/slackUserLookup";
import { notifyTaskCanceledGroup } from "../services/notifyTaskCanceledGroup";
import { markTaskOpenMessageAsCanceled } from "../services/markTaskOpenMessageAsCanceled";

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
function formatDateBRFromIso(
  iso: string
) {
  const [year, month, day] =
    iso.split("-");

  return `${day}/${month}/${year}`;
}
export async function portalRoutes(app: FastifyInstance) {
  const slack = new WebClient(
    process.env.SLACK_BOT_TOKEN
  );

  app.post(
    "/portal/tasks/reschedule",
    async (request, reply) => {

      const portalUser =
        getPortalUser(request);

      if (!portalUser) {
        return reply
          .code(401)
          .send({
            error: "Não autenticado.",
          });
      }

      const body = request.body as {
        taskId?: string;
        newDateIso?: string;
        newTime?: string | null;
      };

      const taskId =
        body.taskId?.trim() ?? "";

      const newDateIso =
        body.newDateIso?.trim() ?? "";

      const newTime =
        body.newTime?.trim() || null;

      if (!taskId) {
        return reply
          .code(400)
          .send({
            error: "Tarefa não informada.",
          });
      }

      if (!newDateIso) {
        return reply
          .code(400)
          .send({
            error: "Informe a nova data.",
          });
      }

      /*
       * Não permite data passada.
       * Mesma regra utilizada na criação
       * e na reprogramação do Slack.
       */
      const todayIso =
        new Intl.DateTimeFormat(
          "en-CA",
          {
            timeZone:
              "America/Sao_Paulo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }
        ).format(new Date());

      if (newDateIso < todayIso) {
        return reply
          .code(400)
          .send({
            error:
              "Não é permitido reprogramar para uma data passada.",
          });
      }

      /*
       * Busca antes da alteração.
       */
      const before =
        await prisma.task.findUnique({
          where: {
            id: taskId,
          },

          select: {
            id: true,
            title: true,
            term: true,
            status: true,
            taskType: true,
            responsible: true,
            delegation: true,
          },
        });

      if (!before) {
        return reply
          .code(404)
          .send({
            error: "Tarefa não encontrada.",
          });
      }

      if (
        before.status === "done" ||
        before.status === "cancelled"
      ) {
        return reply
          .code(400)
          .send({
            error:
              "Esta tarefa não pode ser reprogramada.",
          });
      }

      if (before.taskType === "on_demand") {
        return reply
          .code(400)
          .send({
            error:
              "Tarefas sob demanda não possuem prazo para reprogramar.",
          });
      }

      /*
       * Responsável OU delegador.
       *
       * O próprio rescheduleTaskService
       * também valida essa permissão.
       */
      const canReschedule =
        before.responsible ===
        portalUser.slackUserId ||
        before.delegation ===
        portalUser.slackUserId;

      if (!canReschedule) {
        return reply
          .code(403)
          .send({
            error:
              "Apenas o responsável ou quem delegou a tarefa pode reprogramá-la.",
          });
      }

      /*
       * MESMO SERVICE USADO PELO SLACK.
       */
      await rescheduleTaskService({
        taskId,
        requesterSlackId:
          portalUser.slackUserId,
        newDateIso,
        newTime,
      });

      /*
       * A partir daqui a tarefa já foi
       * reprogramada.
       *
       * Os efeitos externos não devem
       * impedir o sucesso da operação.
       */
      void (async () => {

        try {
          await syncCalendarEventForTask(
            taskId
          );
        } catch (error) {
          request.log.error(
            {
              error,
              taskId,
            },
            "[PORTAL_RESCHEDULE] calendar sync failed"
          );
        }

        try {
          await updateTaskOpenMessage(
            slack,
            taskId
          );
        } catch (error) {
          request.log.error(
            {
              error,
              taskId,
            },
            "[PORTAL_RESCHEDULE] updateTaskOpenMessage failed"
          );
        }

        const after =
          await prisma.task.findUnique({
            where: {
              id: taskId,
            },

            select: {
              id: true,
              title: true,
              responsible: true,
              delegation: true,
              slackOpenChannelId: true,
              slackOpenMessageTs: true,

              carbonCopies: {
                select: {
                  slackUserId: true,
                },
              },
            },
          });

        if (!after) {
          return;
        }

        const br =
          formatDateBRFromIso(
            newDateIso
          );

        const newDateBr =
          newTime
            ? `${br} às ${newTime}`
            : br;

        /*
         * Notificação do grupo.
         */
        const dmPromise =
          notifyTaskRescheduledGroup({
            slack,

            responsibleSlackId:
              after.responsible,

            delegationSlackId:
              after.delegation ?? null,

            carbonCopiesSlackIds:
              after.carbonCopies.map(
                cc => cc.slackUserId
              ),

            taskTitle:
              after.title,

            newDateBr,
          });

        /*
         * Mensagem na thread original.
         */
        const threadPromise =
          (async () => {

            if (
              !after.slackOpenChannelId ||
              !after.slackOpenMessageTs
            ) {
              return;
            }

            const fromIso =
              before.term
                ? before.term
                  .toISOString()
                  .slice(0, 10)
                : null;

            const oldBr =
              fromIso
                ? formatDateBRFromIso(
                  fromIso
                )
                : null;

            const text =
              oldBr
                ? `📅 Prazo reprogramado por <@${portalUser.slackUserId}>: *${after.title}* de *${oldBr}* para *${newDateBr}*.`
                : `📅 Prazo reprogramado por <@${portalUser.slackUserId}>: *${after.title}* para *${newDateBr}*.`;

            await slack.chat.postMessage({
              channel:
                after.slackOpenChannelId,

              thread_ts:
                after.slackOpenMessageTs,

              text,
            });
          })();

        /*
         * Atualiza as Homes de todos
         * os participantes.
         */
        await Promise.allSettled([
          dmPromise,
          threadPromise,

          publishHome(
            slack,
            after.responsible
          ),

          ...(after.delegation
            ? [
              publishHome(
                slack,
                after.delegation
              ),
            ]
            : []),

          ...Array.from(
            new Set(
              after.carbonCopies.map(
                cc => cc.slackUserId
              )
            )
          ).map(uid =>
            publishHome(
              slack,
              uid
            )
          ),
        ]);

      })().catch(error => {

        request.log.error(
          {
            error,
            taskId,
          },
          "[PORTAL_RESCHEDULE] side-effects failed"
        );

      });

      return reply.send({
        ok: true,
        taskId,
      });
    }
  );

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

  app.get(
    "/portal/delegated",
    async (request, reply) => {

      const portalUser =
        getPortalUser(request);

      if (!portalUser) {
        return reply.redirect(
          "/portal/login"
        );
      }

      const dashboard =
        await getDelegatedDashboardData(
          portalUser.slackUserId
        );

      return reply
        .type("text/html")
        .send(
          portalLayout({
            title: "Delegadas por mim",

            sidebar:
              sidebar("delegated"),

            topbar: topbar({
              title: "Delegadas por mim",
              user:
                getTopbarUser(request),
            }),

            body:
              delegatedDashboardPage(
                dashboard
              ),
          })
        );
    }
  );

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
          query.collaboratorId?.trim() || undefined,

        processId:
          query.processId?.trim() || undefined,
      };

      try {

        const report =
          await getReportData(
            portalUser.slackUserId,
            filters
          );

        /*
         * =====================================================
         * ATIVIDADES
         * =====================================================
         *
         * Usa exatamente o mesmo componente do Dashboard.
         */

        if (type === "activities") {

          const tasks =
            await prisma.task.findMany({
              where: {
                id: {
                  in: report.rows.map(
                    row => row.id
                  ),
                },
              },

              select: {
                id: true,
                title: true,
                deadlineTime: true,
                urgency: true,
              },

              orderBy: {
                title: "asc",
              },
            });

          return reply
            .type("text/html")
            .send(
              dashboardTasksModal({
                title: "📋 Atividades",
                tasks,
                completed: false,
              })
            );
        }

        /*
         * =====================================================
         * COLABORADORES
         * =====================================================
         */

        if (type === "collaborators") {

          const collaborators =
            new Map<
              string,
              {
                id: string;
                name: string;
                count: number;
              }
            >();

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

          const items =
            [...collaborators.values()]
              .sort((a, b) =>
                a.name.localeCompare(b.name)
              );

          return reply
            .type("text/html")
            .send(`
            <div
              style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:28px;
              "
            >

              <h2 style="margin:0;">
                👥 Colaboradores
              </h2>

              <button
                onclick="closePortalModal()"
                style="
                  border:none;
                  background:none;
                  font-size:28px;
                  cursor:pointer;
                  color:#6B7280;
                "
              >
                ✕
              </button>

            </div>

            ${items.length
                ? items
                  .map(item => `
                      <div
                        onclick="window.location.href='/portal/collaborators/${encodeURIComponent(item.id)}'"
                        style="
                          display:flex;
                          justify-content:space-between;
                          align-items:center;
                          gap:16px;
                          padding:14px 0;
                          border-bottom:1px solid #E5E7EB;
                          cursor:pointer;
                        "
                      >

                        <div>

                          <div
                            style="
                              font-weight:600;
                              margin-bottom:6px;
                              color:#1F2937;
                            "
                          >
                            ${item.name}
                          </div>

                          <div
                            style="
                              color:#6B7280;
                              font-size:14px;
                            "
                          >
                            ${item.count}
                            atividade${item.count === 1 ? "" : "s"}
                          </div>

                        </div>

                        <div
                          style="
                            color:#94A3B8;
                            font-size:20px;
                          "
                        >
                          ›
                        </div>

                      </div>
                    `)
                  .join("")
                : `
                    <p>
                      Nenhum colaborador encontrado.
                    </p>
                  `
              }
          `);
        }

        /*
         * =====================================================
         * PROCESSOS
         * =====================================================
         */

        if (type === "processes") {

          const processes =
            new Map<
              string,
              {
                id: string;
                title: string;
                count: number;
              }
            >();

          for (const row of report.rows) {

            if (
              !row.processId ||
              !row.processTitle
            ) {
              continue;
            }

            const current =
              processes.get(
                row.processId
              );

            if (current) {

              current.count++;

            } else {

              processes.set(
                row.processId,
                {
                  id: row.processId,
                  title: row.processTitle,
                  count: 1,
                }
              );
            }
          }

          const items =
            [...processes.values()]
              .sort((a, b) =>
                a.title.localeCompare(b.title)
              );

          return reply
            .type("text/html")
            .send(`
            <div
              style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:28px;
              "
            >

              <h2 style="margin:0;">
                📚 Processos
              </h2>

              <button
                onclick="closePortalModal()"
                style="
                  border:none;
                  background:none;
                  font-size:28px;
                  cursor:pointer;
                  color:#6B7280;
                "
              >
                ✕
              </button>

            </div>

            ${items.length
                ? items
                  .map(item => `
                      <div
                        onclick="window.location.href='/portal/processes/${encodeURIComponent(item.id)}'"
                        style="
                          display:flex;
                          justify-content:space-between;
                          align-items:center;
                          gap:16px;
                          padding:14px 0;
                          border-bottom:1px solid #E5E7EB;
                          cursor:pointer;
                        "
                      >

                        <div>

                          <div
                            style="
                              font-weight:600;
                              margin-bottom:6px;
                              color:#1F2937;
                            "
                          >
                            ${item.title}
                          </div>

                          <div
                            style="
                              color:#6B7280;
                              font-size:14px;
                            "
                          >
                            ${item.count}
                            atividade${item.count === 1 ? "" : "s"}
                          </div>

                        </div>

                        <div
                          style="
                            color:#94A3B8;
                            font-size:20px;
                          "
                        >
                          ›
                        </div>

                      </div>
                    `)
                  .join("")
                : `
                    <p>
                      Nenhum processo encontrado.
                    </p>
                  `
              }
          `);
        }

        /*
         * =====================================================
         * VERTICAIS
         * =====================================================
         */

        if (type === "verticals") {

          const verticals =
            new Map<
              string,
              {
                id: string;
                name: string;
                count: number;
              }
            >();

          for (const row of report.rows) {

            if (
              !row.verticalId ||
              !row.verticalName
            ) {
              continue;
            }

            const current =
              verticals.get(
                row.verticalId
              );

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

          const items =
            [...verticals.values()]
              .sort((a, b) =>
                a.name.localeCompare(b.name)
              );

          return reply
            .type("text/html")
            .send(`
            <div
              style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:28px;
              "
            >

              <h2 style="margin:0;">
                🏢 Verticais
              </h2>

              <button
                onclick="closePortalModal()"
                style="
                  border:none;
                  background:none;
                  font-size:28px;
                  cursor:pointer;
                  color:#6B7280;
                "
              >
                ✕
              </button>

            </div>

            ${items.length
                ? items
                  .map(item => `
                      <div
                        onclick="window.location.href='/portal/processes/team/${encodeURIComponent(item.id)}'"
                        style="
                          display:flex;
                          justify-content:space-between;
                          align-items:center;
                          gap:16px;
                          padding:14px 0;
                          border-bottom:1px solid #E5E7EB;
                          cursor:pointer;
                        "
                      >

                        <div>

                          <div
                            style="
                              font-weight:600;
                              margin-bottom:6px;
                              color:#1F2937;
                            "
                          >
                            ${item.name}
                          </div>

                          <div
                            style="
                              color:#6B7280;
                              font-size:14px;
                            "
                          >
                            ${item.count}
                            atividade${item.count === 1 ? "" : "s"}
                          </div>

                        </div>

                        <div
                          style="
                            color:#94A3B8;
                            font-size:20px;
                          "
                        >
                          ›
                        </div>

                      </div>
                    `)
                  .join("")
                : `
                    <p>
                      Nenhuma vertical encontrada.
                    </p>
                  `
              }
          `);
        }

        return reply
          .code(404)
          .send("Relatório não encontrado.");

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
  app.get(
    "/portal/tasks/create/modal",
    async (request, reply) => {

      const portalUser =
        getPortalUser(request);

      if (!portalUser) {
        return reply
          .code(401)
          .send("Não autenticado.");
      }

      const options =
        await getPortalCreateTaskOptions(
          portalUser.slackUserId
        );

      return reply
        .type("text/html")
        .send(
          createTaskModal(options)
        );
    }
  );
  app.get(
    "/portal/tasks/:id/edit/modal",
    async (request, reply) => {

      const portalUser =
        getPortalUser(request);

      if (!portalUser) {
        return reply
          .code(401)
          .send("Não autenticado.");
      }

      const { id } =
        request.params as {
          id: string;
        };

      /*
       * ==========================================
       * BUSCA + PERMISSÃO
       *
       * Mesma regra do Slack:
       * somente quem delegou/criou pode editar.
       * ==========================================
       */

      const task =
        await prisma.task.findUnique({
          where: {
            id,
          },

          select: {
            id: true,
            title: true,
            description: true,
            processId: true,
            notionProcessUrl: true,
            responsible: true,
            delegation: true,
            status: true,
            term: true,
            deadlineTime: true,
            recurrence: true,
            urgency: true,
            reminderMode: true,
            turboPreviousDay: true,
            turboStartTime: true,
            calendarPrivate: true,
            taskType: true,

            carbonCopies: {
              select: {
                slackUserId: true,
              },
            },
          },
        });

      if (!task) {
        return reply
          .code(404)
          .send(
            "Tarefa não encontrada."
          );
      }

      if (
        task.delegation !==
        portalUser.slackUserId
      ) {

        const delegatedByName =
          task.delegation
            ? await getSlackUserName(
              task.delegation
            )
            : "outro usuário";

        return reply
          .code(403)
          .send(`
      <div
        style="
          padding:28px;
          font-family:Inter,Arial,sans-serif;
        "
      >
        <h2
          style="
            margin:0 0 10px;
            font-size:22px;
            color:#111827;
          "
        >
          🔒 Edição não permitida
        </h2>

        <p
          style="
            margin:0;
            color:#6B7280;
            line-height:1.6;
          "
        >
          Esta tarefa foi delegada por
          <strong>${delegatedByName}</strong>.
          Apenas quem criou a tarefa pode editá-la.
        </p>
      </div>
    `);
      }

      if (
        task.status === "done" ||
        task.status === "cancelled"
      ) {
        return reply
          .code(400)
          .send(
            "Esta tarefa já foi finalizada e não pode mais ser editada."
          );
      }

      /*
       * Mesmas opções usadas na criação.
       */

      const options =
        await getPortalCreateTaskOptions(
          portalUser.slackUserId
        );

      return reply
        .type("text/html")
        .send(
          createTaskModal(
            options,
            {
              mode: "edit",

              task: {
                id: task.id,
                title: task.title,
                description: task.description,
                processId: task.processId,
                responsible: task.responsible,

                term: task.term
                  ? task.term
                    .toISOString()
                    .slice(0, 10)
                  : null,

                deadlineTime:
                  task.deadlineTime,

                recurrence:
                  task.recurrence
                    ? String(task.recurrence)
                    : null,

                urgency:
                  task.urgency,

                reminderMode:
                  task.reminderMode,

                turboPreviousDay:
                  task.turboPreviousDay,

                turboStartTime:
                  task.turboStartTime,

                calendarPrivate:
                  task.calendarPrivate,

                taskType:
                  task.taskType,

                carbonCopies:
                  task.carbonCopies.map(
                    cc => cc.slackUserId
                  ),
              },
            }
          )
        );
    }
  );
  app.get(
    "/portal/tasks/reschedule/modal",
    async (request, reply) => {

      const portalUser =
        getPortalUser(request);

      if (!portalUser) {
        return reply
          .code(401)
          .send("Não autenticado.");
      }

      const { taskId } =
        request.query as {
          taskId?: string;
        };

      if (!taskId) {
        return reply
          .code(400)
          .send("Tarefa não informada.");
      }

      const allowed =
        await canAccessTask(
          portalUser.slackUserId,
          taskId
        );

      if (!allowed) {
        return reply
          .code(403)
          .send("Acesso não permitido.");
      }

      const task =
        await getTaskDetails(taskId);

      return reply
        .type("text/html")
        .send(
          rescheduleTasksModal({
            id: task.id,
            title: task.title,
            deadline: task.deadline,
            deadlineTime: task.deadlineTime,
          })
        );
    }
  );
  app.post(
    "/portal/tasks/create",
    async (request, reply) => {

      const portalUser =
        getPortalUser(request);

      if (!portalUser) {
        return reply
          .code(401)
          .send({
            error: "Não autenticado.",
          });
      }

      const body = request.body as {
        title?: string;
        description?: string | null;
        processId?: string | null;
        responsible?: string;
        taskType?: string;
        term?: string | null;
        deadlineTime?: string | null;
        dependsOnId?: string | null;
        recurrence?: string | null;
        urgency?: string;
        turboPreviousDay?: boolean;
        turboStartTime?: string | null;
        reminderMode?: string;
        carbonCopies?: string[];
        calendarPrivate?: boolean;
      };

      /*
       * ==========================================
       * VALIDAÇÕES BÁSICAS
       * ==========================================
       */

      const title =
        body.title?.trim() ?? "";

      const responsible =
        body.responsible?.trim() ?? "";

      if (!title) {
        return reply
          .code(400)
          .send({
            error: "Informe o título da tarefa.",
          });
      }

      if (!responsible) {
        return reply
          .code(400)
          .send({
            error: "Selecione o responsável.",
          });
      }

      /*
       * ==========================================
       * PROCESSO / NOTION
       * ==========================================
       */

      const processId =
        body.processId?.trim() || null;

      let notionProcessUrl:
        string | null = null;

      if (processId) {

        const process =
          await prisma.process.findUnique({
            where: {
              id: processId,
            },

            select: {
              notionPageUrl: true,
            },
          });

        notionProcessUrl =
          process?.notionPageUrl ?? null;
      }

      /*
       * ==========================================
       * DATA
       *
       * Mesmo padrão usado pelo Slack:
       * YYYY-MM-DD -> 03:00 UTC
       * ==========================================
       */

      const term =
        body.term
          ? new Date(
            `${body.term}T03:00:00.000Z`
          )
          : null;

      /*
       * Não permitimos criação no passado.
       */

      if (body.term) {

        const todayIso =
          new Intl.DateTimeFormat(
            "en-CA",
            {
              timeZone:
                "America/Sao_Paulo",

              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }
          ).format(new Date());

        if (body.term < todayIso) {

          return reply
            .code(400)
            .send({
              error:
                "Não é permitido criar atividade com data passada.",
            });
        }
      }

      /*
       * ==========================================
       * CRIAÇÃO
       *
       * AQUI reutilizamos o MESMO service
       * usado pelo Slack.
       * ==========================================
       */

      const task =
        await createTaskService({
          title,

          description:
            body.description?.trim()
              ? body.description.trim()
              : undefined,

          notionProcessUrl,

          delegation:
            portalUser.slackUserId,

          responsible,

          term,

          deadlineTime:
            body.deadlineTime || null,

          recurrence:
            body.recurrence || null,

          dependsOnId:
            body.dependsOnId || null,

          urgency:
            body.urgency || "light",

          taskType:
            body.taskType || "normal",

          reminderMode:
            body.reminderMode || "until",

          turboPreviousDay:
            body.turboPreviousDay ?? false,

          turboStartTime:
            body.turboStartTime || null,

          processId,

          carbonCopies:
            body.carbonCopies ?? [],

          calendarPrivate:
            body.calendarPrivate ?? false,
        });

      /*
       * ==========================================
       * MESMOS SIDE EFFECTS DO SLACK
       * ==========================================
       */

      try {

        await syncTaskParticipantEmails({
          slack,

          taskId: task.id,

          delegationSlackId:
            portalUser.slackUserId,

          responsibleSlackId:
            task.responsible,

          carbonCopiesSlackIds:
            (task as any)
              .carbonCopies
              ?.map(
                (copy: any) =>
                  copy.slackUserId
              ) ?? [],
        });

        await syncCalendarEventForTask(
          task.id
        );

      } catch (error) {

        request.log.error(
          {
            error,
            taskId: task.id,
          },
          "[PORTAL_CREATE_TASK] email/calendar sync failed"
        );
      }

      /*
       * ==========================================
       * NOTIFICAÇÃO
       *
       * Igual ao Slack:
       * se depender de uma tarefa ainda aberta,
       * a notificação fica adiada.
       * ==========================================
       */

      let deferNotifyCreated = false;

      if (body.dependsOnId) {

        const dependency =
          await prisma.task.findUnique({
            where: {
              id: body.dependsOnId,
            },

            select: {
              status: true,
            },
          });

        deferNotifyCreated =
          dependency?.status !== "done";
      }

      if (!deferNotifyCreated) {

        await notifyTaskCreated({
          slack,

          taskId: task.id,

          createdBy:
            portalUser.slackUserId,

          taskTitle:
            task.title,

          responsible:
            task.responsible,

          carbonCopies:
            (task as any)
              .carbonCopies
              ?.map(
                (copy: any) =>
                  copy.slackUserId
              ) ?? [],

          term:
            task.term,

          deadlineTime:
            (task as any)
              .deadlineTime ?? null,
        });
      }

      /*
       * ==========================================
       * ATUALIZA HOME DO SLACK
       * ==========================================
       */

      const affected =
        new Set<string>();

      affected.add(
        portalUser.slackUserId
      );

      affected.add(
        task.responsible
      );

      if (task.delegation) {
        affected.add(
          task.delegation
        );
      }

      for (
        const copy of
        (task as any)
          .carbonCopies ?? []
      ) {
        affected.add(
          copy.slackUserId
        );
      }

      await Promise.allSettled(
        Array
          .from(affected)
          .map(
            userId =>
              publishHome(
                slack,
                userId
              )
          )
      );

      /*
       * ==========================================
       * RESPOSTA PARA O PORTAL
       * ==========================================
       */

      return reply.send({
        ok: true,
        taskId: task.id,
      });
    }
  );
  app.post(
    "/portal/tasks/:id/update",
    async (request, reply) => {

      const portalUser =
        getPortalUser(request);

      if (!portalUser) {
        return reply
          .code(401)
          .send({
            error: "Não autenticado.",
          });
      }

      const { id: taskId } =
        request.params as {
          id: string;
        };

      const body = request.body as {
        title?: string;
        description?: string | null;
        processId?: string | null;
        responsible?: string;
        taskType?: string;
        term?: string | null;
        deadlineTime?: string | null;
        recurrence?: string | null;
        urgency?: string;
        reminderMode?: string;
        turboPreviousDay?: boolean;
        turboStartTime?: string | null;
        carbonCopies?: string[];
        calendarPrivate?: boolean;
      };

      /*
       * ==========================================
       * VALIDAÇÕES
       * ==========================================
       */

      const title =
        body.title?.trim() ?? "";

      const responsible =
        body.responsible?.trim() ?? "";

      if (!title) {
        return reply
          .code(400)
          .send({
            error: "Informe o título da tarefa.",
          });
      }

      if (!responsible) {
        return reply
          .code(400)
          .send({
            error: "Selecione o responsável.",
          });
      }

      /*
       * ==========================================
       * PERMISSÃO
       *
       * Igual ao Slack:
       * somente quem delegou/criou pode editar.
       * ==========================================
       */

      const currentTask =
        await prisma.task.findUnique({
          where: {
            id: taskId,
          },

          select: {
            id: true,
            delegation: true,
            responsible: true,
            status: true,
          },
        });

      if (!currentTask) {
        return reply
          .code(404)
          .send({
            error: "Tarefa não encontrada.",
          });
      }

      if (
        currentTask.delegation !==
        portalUser.slackUserId
      ) {
        return reply
          .code(403)
          .send({
            error:
              "Apenas quem criou a tarefa pode editá-la.",
          });
      }

      if (
        currentTask.status === "done" ||
        currentTask.status === "cancelled"
      ) {
        return reply
          .code(400)
          .send({
            error:
              "Não é possível editar uma tarefa finalizada.",
          });
      }

      /*
       * ==========================================
       * DATA
       * ==========================================
       */

      if (body.term) {

        const todayIso =
          new Intl.DateTimeFormat(
            "en-CA",
            {
              timeZone:
                "America/Sao_Paulo",

              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }
          ).format(new Date());

        if (body.term < todayIso) {
          return reply
            .code(400)
            .send({
              error:
                "Não é permitido salvar atividade com data passada.",
            });
        }
      }

      /*
       * ==========================================
       * PROCESSO / NOTION
       * ==========================================
       */

      const processId =
        body.processId?.trim() || null;

      let notionProcessUrl:
        string | null = null;

      if (processId) {

        const process =
          await prisma.process.findUnique({
            where: {
              id: processId,
            },

            select: {
              notionPageUrl: true,
            },
          });

        notionProcessUrl =
          process?.notionPageUrl ?? null;
      }

      /*
       * ==========================================
       * UPDATE
       *
       * Mesmo service utilizado pelo Slack.
       * Ele também valida novamente a permissão.
       * ==========================================
       */

      let updated;

      try {

        updated =
          await updateTaskService({
            taskId,

            delegationSlackId:
              portalUser.slackUserId,

            title,

            description:
              body.description?.trim()
                ? body.description.trim()
                : null,

            processId,

            notionProcessUrl,

            termIso:
              body.term || null,

            deadlineTime:
              body.deadlineTime || null,

            responsibleSlackId:
              responsible,

            carbonCopiesSlackIds:
              body.carbonCopies ?? [],

            recurrence:
              body.recurrence || null,

            urgency:
              body.urgency || "light",

            reminderMode:
              body.reminderMode || "until",

            turboPreviousDay:
              body.turboPreviousDay ?? false,

            turboStartTime:
              body.turboStartTime || null,

            calendarPrivate:
              body.calendarPrivate ?? false,
          });

      } catch (error) {

        request.log.error(
          {
            error,
            taskId,
          },
          "[PORTAL_EDIT_TASK] update failed"
        );

        return reply
          .code(400)
          .send({
            error:
              error instanceof Error
                ? error.message
                : "Não foi possível editar a tarefa.",
          });
      }

      /*
       * ==========================================
       * AUDITORIA
       * ==========================================
       */

      await prisma.taskAuditLog.create({
        data: {
          taskId,

          action:
            "TASK_EDITED",

          actorSlackId:
            portalUser.slackUserId,

          beforeJson:
            updated.before as any,

          afterJson:
            updated.after as any,
        },
      });

      /*
       * ==========================================
       * EMAILS + CALENDAR
       * ==========================================
       */

      try {

        await syncTaskParticipantEmails({
          slack,

          taskId,

          delegationSlackId:
            portalUser.slackUserId,

          responsibleSlackId:
            updated.after.responsible,

          carbonCopiesSlackIds:
            updated.after.carbonCopies ?? [],
        });

        await syncCalendarEventForTask(
          taskId
        );

      } catch (error) {

        request.log.error(
          {
            error,
            taskId,
          },
          "[PORTAL_EDIT_TASK] email/calendar sync failed"
        );
      }

      /*
       * ==========================================
       * MENSAGEM ABERTA NO SLACK
       *
       * Se trocou responsável, fazemos o fluxo
       * especial de reatribuição.
       * ==========================================
       */

      try {

        const beforeResponsible =
          updated.before.responsible;

        const afterResponsible =
          updated.after.responsible;

        if (
          beforeResponsible &&
          afterResponsible &&
          beforeResponsible !==
          afterResponsible
        ) {

          await handleTaskResponsibleReassign({
            slack,
            taskId,
            editedBySlackId:
              portalUser.slackUserId,
          });

        } else {

          await updateTaskOpenMessage(
            slack,
            taskId
          );
        }

      } catch (error) {

        request.log.error(
          {
            error,
            taskId,
          },
          "[PORTAL_EDIT_TASK] open message update failed"
        );
      }

      /*
       * ==========================================
       * NOTIFICAÇÃO DA EDIÇÃO
       *
       * Mesmo notify usado pelo Slack.
       * ==========================================
       */

      const allCc =
        Array.from(
          new Set([
            ...(updated.before.carbonCopies ?? []),
            ...(updated.after.carbonCopies ?? []),
          ])
        );

      try {

        await notifyTaskEdited({
          slack,

          taskId,

          editedBy:
            portalUser.slackUserId,

          responsible:
            updated.after.responsible,

          carbonCopies:
            allCc,

          oldTitle:
            updated.before.title,

          newTitle:
            updated.after.title,

          oldTerm:
            updated.before.term,

          newTerm:
            updated.after.term,

          oldDeadlineTime:
            updated.before.deadlineTime,

          newDeadlineTime:
            updated.after.deadlineTime,

          oldResponsible:
            updated.before.responsible,

          newResponsible:
            updated.after.responsible,

          oldRecurrence:
            updated.before.recurrence,

          newRecurrence:
            updated.after.recurrence,

          oldUrgency:
            updated.before.urgency,

          newUrgency:
            updated.after.urgency,

          oldReminderMode:
            updated.before.reminderMode,

          newReminderMode:
            updated.after.reminderMode,

          oldTurboPreviousDay:
            updated.before.turboPreviousDay,

          newTurboPreviousDay:
            updated.after.turboPreviousDay,

          oldTurboStartTime:
            updated.before.turboStartTime,

          newTurboStartTime:
            updated.after.turboStartTime,

          oldCalendarPrivate:
            updated.before.calendarPrivate,

          newCalendarPrivate:
            updated.after.calendarPrivate,

          oldCarbonCopies:
            updated.before.carbonCopies,

          newCarbonCopies:
            updated.after.carbonCopies,
        });

      } catch (error) {

        request.log.error(
          {
            error,
            taskId,
          },
          "[PORTAL_EDIT_TASK] notification failed"
        );
      }

      /*
       * ==========================================
       * ATUALIZA HOME DO SLACK
       *
       * Inclui participantes antigos e novos.
       * ==========================================
       */

      const affected =
        new Set<string>();

      affected.add(
        portalUser.slackUserId
      );

      affected.add(
        updated.before.responsible
      );

      affected.add(
        updated.after.responsible
      );

      if (updated.before.delegation) {
        affected.add(
          updated.before.delegation
        );
      }

      if (updated.after.delegation) {
        affected.add(
          updated.after.delegation
        );
      }

      for (
        const userId of
        updated.before.carbonCopies ?? []
      ) {
        affected.add(userId);
      }

      for (
        const userId of
        updated.after.carbonCopies ?? []
      ) {
        affected.add(userId);
      }

      await Promise.allSettled(
        Array
          .from(affected)
          .filter(Boolean)
          .map(
            userId =>
              publishHome(
                slack,
                userId
              )
          )
      );

      /*
       * ==========================================
       * RESPOSTA
       * ==========================================
       */

      return reply.send({
        ok: true,
        taskId,
      });
    }
  );

  app.post(
    "/portal/tasks/cancel",
    async (request, reply) => {

      const portalUser =
        getPortalUser(request);

      if (!portalUser) {
        return reply
          .code(401)
          .send({
            error: "Não autenticado.",
          });
      }

      const body =
        request.body as {
          taskIds?: string[];
        };

      const taskIds =
        Array.from(
          new Set(
            (body.taskIds ?? [])
              .map(id => String(id).trim())
              .filter(Boolean)
          )
        );

      if (!taskIds.length) {
        return reply
          .code(400)
          .send({
            error:
              "Nenhuma tarefa selecionada.",
          });
      }

      /*
       * ==========================================
       * MESMA REGRA DO SLACK
       *
       * Apenas quem delegou pode cancelar.
       * ==========================================
       */

      const tasksToCancel =
        await prisma.task.findMany({
          where: {
            id: {
              in: taskIds,
            },

            delegation:
              portalUser.slackUserId,

            status: {
              notIn: [
                "done",
                "cancelled",
              ],
            },
          },

          select: {
            id: true,
            title: true,
            responsible: true,
            delegation: true,

            carbonCopies: {
              select: {
                slackUserId: true,
              },
            },
          },
        });

      /*
       * Se alguma das selecionadas não puder
       * ser cancelada, não fazemos cancelamento
       * parcial.
       */

      if (
        tasksToCancel.length !==
        taskIds.length
      ) {
        return reply
          .code(403)
          .send({
            error:
              "Apenas tarefas delegadas por você e ainda abertas podem ser canceladas.",
          });
      }

      /*
       * ==========================================
       * NOTIFICAÇÃO
       * ==========================================
       */

      await Promise.allSettled(
        tasksToCancel.map(task =>
          notifyTaskCanceledGroup({
            slack,

            canceledBySlackId:
              portalUser.slackUserId,

            responsibleSlackId:
              task.responsible,

            carbonCopiesSlackIds:
              task.carbonCopies.map(
                copy =>
                  copy.slackUserId
              ),

            taskTitle:
              task.title,
          })
        )
      );

      /*
       * ==========================================
       * MENSAGEM ABERTA DO SLACK
       * ==========================================
       */

      await Promise.allSettled(
        tasksToCancel.map(task =>
          markTaskOpenMessageAsCanceled({
            slack,

            taskId:
              task.id,

            taskTitle:
              task.title,

            canceledBySlackId:
              portalUser.slackUserId,
          })
        )
      );

      /*
       * ==========================================
       * GOOGLE CALENDAR
       * ==========================================
       */

      await Promise.allSettled(
        tasksToCancel.map(task =>
          deleteCalendarEventForTask(
            task.id
          )
        )
      );

      /*
       * ==========================================
       * AUDITORIA
       * ==========================================
       */

      await Promise.all(
        tasksToCancel.map(task =>
          prisma.taskAuditLog.create({
            data: {
              taskId:
                task.id,

              action:
                "TASK_CANCELLED",

              actorSlackId:
                portalUser.slackUserId,
            },
          })
        )
      );

      /*
       * ==========================================
       * CANCELA
       * ==========================================
       */

      await prisma.task.updateMany({
        where: {
          id: {
            in:
              tasksToCancel.map(
                task => task.id
              ),
          },

          delegation:
            portalUser.slackUserId,
        },

        data: {
          status:
            "cancelled",
        },
      });

      /*
       * ==========================================
       * ATUALIZA HOME DO SLACK
       * ==========================================
       */

      const affectedUsers =
        new Set<string>();

      affectedUsers.add(
        portalUser.slackUserId
      );

      for (
        const task of
        tasksToCancel
      ) {

        affectedUsers.add(
          task.responsible
        );

        for (
          const copy of
          task.carbonCopies
        ) {
          affectedUsers.add(
            copy.slackUserId
          );
        }
      }

      await Promise.allSettled(
        Array
          .from(affectedUsers)
          .map(userId =>
            publishHome(
              slack,
              userId
            )
          )
      );

      return reply.send({
        ok: true,
        cancelled:
          tasksToCancel.length,
      });
    }
  );
  app.post(
    "/portal/tasks/complete",
    async (request, reply) => {

      const portalUser =
        getPortalUser(request);

      if (!portalUser) {
        return reply
          .code(401)
          .send({
            error: "Não autenticado.",
          });
      }

      const body = request.body as {
        taskIds?: string[];
      };

      const taskIds =
        Array.from(
          new Set(
            (body.taskIds ?? [])
              .map(String)
              .filter(Boolean)
          )
        );

      if (!taskIds.length) {
        return reply
          .code(400)
          .send({
            error:
              "Nenhuma tarefa foi selecionada.",
          });
      }

      const result =
        await completeTaskFlow({
          slack,
          taskIds,
          requesterSlackId:
            portalUser.slackUserId,
        });

      if (!result.completedIds.length) {
        return reply
          .code(403)
          .send({
            error:
              "Você não tem permissão para concluir as tarefas selecionadas.",
            unauthorizedIds:
              result.unauthorizedIds,
          });
      }

      return reply.send({
        ok: true,

        completedIds:
          result.completedIds,

        unauthorizedIds:
          result.unauthorizedIds,

        nextCreatedIds:
          result.nextCreatedIds,
      });
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