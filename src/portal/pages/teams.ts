import { departmentCard } from "../components/departmentCard";
import { type Team } from "../../services/portal/teamService";

export function teamsPage(
  teams: Team[]
) {

  return `

    <div
      style="
        display:flex;
        justify-content:flex-end;
        margin-bottom:24px;
      "
    >

      <button
        onclick="openPortalModal('/portal/teams/create/modal')"
        class="btn-primary"
      >
        + Novo Time
      </button>

    </div>

    ${teams
      .map(team => departmentCard(team))
      .join("")}

  `;

}