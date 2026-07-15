import type { Project } from "../../services/portal/projectService";

export function projectsPage(
  projects: Project[]
) {

  return `

    <div class="collaborator-list">

      ${projects
        .map(project => `
          <div
            class="collaborator-card"
            data-search="${project.name.toLowerCase()}"
            onclick="window.location='/portal/projects/${project.id}'"
            style="cursor:pointer;"
            onmouseover="this.style.background='#F9FAFB'"
            onmouseout="this.style.background='white'"
          >

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

          </div>
        `)
        .join("")}

    </div>

    <script>

      const input = document.getElementById("portal-search");

      if (input) {

        input.addEventListener("input", function () {

          const value = this.value
            .toLowerCase()
            .trim();

          document
            .querySelectorAll(".collaborator-card")
            .forEach(card => {

              const search =
                card.dataset.search ?? "";

              card.style.display =
                search.includes(value)
                  ? ""
                  : "none";

            });

        });

      }

    </script>

  `;

}