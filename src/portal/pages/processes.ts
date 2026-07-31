import { DepartmentTree } from "../../services/portal/processService";
import { treeItem } from "../components/treeItem";

export function processesPage(
    departments: DepartmentTree[]
) {

    return departments
        .map(renderDepartment)
        .join("");

    function renderDepartment(
        department: DepartmentTree
    ) {

        return `

    <div
      class="card"
      style="margin-bottom:24px;"
    >

      <h2 style="margin-top:0;">
        🏦 ${department.name}
      </h2>

      ${department.teams
                .map(renderTeam)
                .join("")}

    </div>

  `;
        function renderTeam(team: DepartmentTree["teams"][0]) {

            return treeItem({

                title: `📁 ${team.name}`,

                body: team.themes
                    .map(renderTheme)
                    .join(""),

            });

        }
        function renderTheme(
            theme: DepartmentTree["teams"][0]["themes"][0]
        ) {

            return treeItem({

                title: `📂 ${theme.name}`,

                body: theme.processes
                    .map(process => `
        <div
          style="
            padding:8px 0 8px 12px;
            border-left:2px solid #E5E7EB;
            margin-left:8px;
          "
        >
          📄 ${process.title}
        </div>
      `)
                    .join(""),

            });

        }

    }

}