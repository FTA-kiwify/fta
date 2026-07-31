import { DepartmentTeam } from "../../services/portal/processDepartmentDetailsService";

export function processDepartmentPage(
  teams: DepartmentTeam[]
) {

  return `

    ${teams.map(team => `

      <div
        class="card"
        onclick="window.location='/portal/processes/team/${team.id}'"
        style="cursor:pointer;margin-bottom:16px;"
      >

        <h2>${team.name}</h2>

        <div style="margin-top:12px;">
          📂 ${team.processCount} processos
        </div>

      </div>

    `).join("")}

  `;

}