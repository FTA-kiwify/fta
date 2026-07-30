import type { FastifyInstance } from "fastify";

import { portalLayout } from "../portal/layout";
import { sidebar } from "../portal/components/sidebar";
import { topbar } from "../portal/components/topbar";

import { dashboardPage } from "../portal/pages/dashboard";
import { collaboratorsPage } from "../portal/pages/collaborators";
import { collaboratorPage } from "../portal/pages/collaborator";
import { projectsPage } from "../portal/pages/projects";
import { projectPage } from "../portal/pages/project";
import { taskPage } from "../portal/pages/task";

import { taskModal } from "../portal/components/taskModal";
import { projectModal } from "../portal/components/projectModal";

import { getDashboardData } from "../services/portal/dashboardService";
import { getCollaborators } from "../services/portal/collaboratorService";
import { getCollaboratorDetails } from "../services/portal/collaboratorDetailsService";
import { getTeamDetails } from "../services/portal/teamDetailsService";
import { getProjects } from "../services/portal/projectService";
import { getProjectDetails } from "../services/portal/projectDetailsService";
import { getTaskDetails } from "../services/portal/taskDetailsService";
import { getDashboardTaskList } from "../services/portal/dashboardTaskListService";
import { dashboardTasksModal } from "../portal/components/dashboardTasksModal";
import { getCollaboratorTaskList } from "../services/portal/collaboratorTaskListService";
import { getProjectTaskList } from "../services/portal/projectTaskListService";
import { projectMembersModal } from "../portal/components/projectMembersModal";
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
import { getProcessTree } from "../services/portal/processService";

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

    const { slackUserId } = request.params as {
      slackUserId: string;
    };

    const collaborator = await getCollaboratorDetails(slackUserId);

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

  app.get("/portal/teams", async (request, reply) => {

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

  app.get("/portal/projects", async (request, reply) => {

    const projects = await getProjects();

    return reply.type("text/html").send(
      portalLayout({
        title: "Projetos",
        sidebar: sidebar("projects"),
        topbar: topbar({
          title: "Projetos",
          searchPlaceholder: "Pesquisar projeto...",
          user: getTopbarUser(request),
        }),

        body: projectsPage(projects),
      })
    );

  });

  app.get(
    "/portal/processes",
    async (request, reply) => {

      const processes = await getProcessTree();

      return reply.type("text/html").send(

        portalLayout({

          title: "Processos",

          sidebar: sidebar("processes"),

          topbar: topbar({
            title: "Processos",
            searchPlaceholder: "Pesquisar processo...",
            user: getTopbarUser(request),
          }),

          body: processesPage(processes),

        })

      );

    }
  );

  app.get("/portal/projects/:id", async (request, reply) => {

    const { id } = request.params as {
      id: string;
    };

    const project = await getProjectDetails(id);

    return reply.type("text/html").send(
      portalLayout({
        title: project.name,
        sidebar: sidebar("projects"),
        topbar: topbar({
          title: project.name,
          user: getTopbarUser(request),
        }),
        body: projectPage(project),
      })
    );

  });

  app.get("/portal/teams/:id", async (request, reply) => {

    const { id } = request.params as {
      id: string;
    };

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

  app.get("/portal/projects/:id/modal", async (request, reply) => {

    const { id } = request.params as {
      id: string;
    };

    const project = await getProjectDetails(id);

    return reply
      .type("text/html")
      .send(projectModal(project));

  });

  app.get("/portal/tasks/:id", async (request, reply) => {

    const { id } = request.params as {
      id: string;
    };

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

  app.get(
    "/portal/projects/:projectId/tasks/:filter/modal",
    async (request, reply) => {

      const {
        projectId,
        filter,
      } = request.params as {
        projectId: string;
        filter: string;
      };

      const tasks = await getProjectTaskList(
        projectId,
        filter
      );

      const titles: Record<string, string> = {
        pending: "📋 Tarefas pendentes",
        today: "📅 Vencem hoje",
        completed: "✅ Concluídas",
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
    "/portal/projects/:projectId/members/modal",
    async (request, reply) => {

      const { projectId } = request.params as {
        projectId: string;
      };

      const project = await getProjectDetails(projectId);

      return reply
        .type("text/html")
        .send(
          projectMembersModal({
            projectName: project.name,
            members: project.members,
          })
        );

    }
  );

  app.post("/portal/teams", async (request, reply) => {

    const body = request.body as {
      name: string;
      description?: string;
      color?: string;
      group?: string;
    };

    await createTeam(body);

    return reply.send({
      success: true,
    });

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