import { departmentCard } from "../components/departmentCard";
import type { SubTeam } from "../../services/portal/subTeamsService";

export function subTeamsPage(
    departmentId: string,
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

    <div
      class="card"
      style="
        margin-top:28px;
        border:1px solid #FECACA;
      "
    >

      <h2 style="color:#DC2626;">
        🗑 Zona de perigo
      </h2>

      <p style="margin-bottom:20px;">
        Exclua este departamento caso ele não seja mais utilizado.
      </p>

      <button
        onclick="deleteTeam('${departmentId}')"
        style="
          background:#DC2626;
          color:white;
          border:none;
          padding:12px 18px;
          border-radius:10px;
          cursor:pointer;
          font-weight:600;
        "
      >
        Excluir departamento
      </button>

    </div>

  `;

}