import { departmentCard } from "../components/departmentCard";
import { type Team } from "../../services/portal/teamService";

export function teamsPage(
  teams: Team[]
) {

  return `

    ${teams
      .map(team => departmentCard(team))
      .join("")}

  `;

}