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
import { getProjects } from "../services/portal/projectService";
import { getProjectDetails } from "../services/portal/projectDetailsService";
import { getTaskDetails } from "../services/portal/taskDetailsService";
import { getDashboardTaskList } from "../services/portal/dashboardTaskListService";
import { dashboardTasksModal } from "../portal/components/dashboardTasksModal";
import { getCollaboratorTaskList } from "../services/portal/collaboratorTaskListService";
import { getProjectTaskList } from "../services/portal/projectTaskListService";
import { projectMembersModal } from "../portal/components/projectMembersModal";
import { portalLoginPage } from "../portal/pages/login";

import {
  clearPortalCookie,
  getPortalUser,
  requirePortalUser,
} from "../portal/auth";

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



}