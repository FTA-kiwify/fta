import { ProcessTree } from "../../services/portal/processService";
import { treeItem } from "../components/treeItem";

export function processesPage(
  tree: ProcessTree[]
) {

  return `

    <div class="card">

      ${tree.map(renderTeam).join("")}

    </div>

  `;

}
function renderTeam(team: ProcessTree) {

  return treeItem({

    title: `🏢 ${team.team.name}`,

    body: team.verticals
      .map(renderVertical)
      .join(""),

  });

}

function renderVertical(vertical: ProcessTree["verticals"][0]) {

  return treeItem({

    title: `📂 ${vertical.name}`,

    body: vertical.themes
      .map(renderTheme)
      .join(""),

  });

}

function renderTheme(theme: ProcessTree["verticals"][0]["themes"][0]) {

  return treeItem({

    title: `📁 ${theme.name}`,

    body: theme.processes
      .map(process => `
        <div
          style="
            padding:6px 0;
            margin-left:12px;
          "
        >
          📄 ${process.title}
        </div>
      `)
      .join(""),

  });

}