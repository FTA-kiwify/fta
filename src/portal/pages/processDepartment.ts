import { DepartmentTeam } from "../../services/portal/processDepartmentDetailsService";

export function processDepartmentPage(
  department: string,
  teams: DepartmentTeam[]
) {

  return `

    <h1 style="margin-bottom:24px;">
      ${department}
    </h1>

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