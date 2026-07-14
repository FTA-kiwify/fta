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

export async function portalRoutes(app: FastifyInstance) {

  app.get("/portal", async (_request, reply) => {

    const dashboard = await getDashboardData();

    return reply.type("text/html").send(
      portalLayout({
        title: "FTA Manager Portal",
        sidebar: sidebar("dashboard"),
        topbar: topbar("Dashboard"),
        body: dashboardPage(dashboard),
      })
    );

  });

  app.get("/portal/collaborators", async (_request, reply) => {

    const collaborators = await getCollaborators();

    return reply.type("text/html").send(
      portalLayout({
        title: "Colaboradores",
        sidebar: sidebar("collaborators"),
        topbar: topbar("Colaboradores"),
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
        topbar: topbar(collaborator.name),
        body: collaboratorPage(collaborator),
      })
    );

  });

  app.get("/portal/projects", async (_request, reply) => {

    const projects = await getProjects();

    return reply.type("text/html").send(
      portalLayout({
        title: "Projetos",
        sidebar: sidebar("projects"),
        topbar: topbar("Projetos"),
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
        topbar: topbar(project.name),
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
        topbar: topbar(task.title),
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

}