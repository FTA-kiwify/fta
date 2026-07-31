import { DepartmentTeam } from "../../services/portal/processDepartmentDetailsService";
import { processTeamCard } from "../components/processTeamCard";

export function processDepartmentPage(
  teams: DepartmentTeam[]
) {

  return `

    ${teams
  .map(team =>
    processTeamCard({
      id: team.id,
      name: team.name,
      processCount: team.processCount,
    })
  )
  .join("")}

  `;

}