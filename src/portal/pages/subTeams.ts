import { departmentCard } from "../components/departmentCard";
import type { SubTeam } from "../../services/portal/subTeamsService";

export function subTeamsPage(
    teams: SubTeam[]
) {

    return `

    <div class="collaborator-list">

      ${teams
            .map(team =>
                departmentCard({
                    ...team,
                    subtitle: "Subárea",
                    footer: "Clique para visualizar o dashboard.",
                    icon: "🏦",
                })
            )
            .join("")}

    </div>

  `;

}