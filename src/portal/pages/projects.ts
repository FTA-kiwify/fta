import type { Project } from "../../services/portal/projectService";

export function projectsPage(
  projects: Project[]
) {
  return `
    <div class="card">

      <h1>📁 Projetos</h1>

      <p>
        Visualize os projetos cadastrados.
      </p>

    </div>

    <div class="collaborator-list">

      ${projects
        .map(project => `
          <div class="collaborator-card">

            <div class="collaborator-info">

              <h3>${project.name}</h3>

              <p>
                ${project.status}
              </p>

              <div class="collaborator-stats">

                <span>
                  📋 ${project.totalTasks} tarefas
                </span>

              </div>

            </div>

            <a
              class="button-primary"
              href="/portal/projects/${project.id}"
            >
              Ver detalhes →
            </a>

          </div>
        `)
        .join("")}

    </div>

  `;
}