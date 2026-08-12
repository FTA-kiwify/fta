import { departmentCard } from "../components/departmentCard";
import type { SubTeam } from "../../services/portal/subTeamsService";

export function subTeamsPage(
    departmentId: string,
    teams: SubTeam[]
) {

    return `

    <div
      class="card"
      style="
        margin-bottom:28px;
        cursor:pointer;
      "
      onclick="openPortalModal('/portal/teams/${departmentId}/members/modal')"
    >
      <div
        style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:20px;
        "
      >
        <div>
          <h2 style="margin:0 0 6px 0;">
            👥 Membros diretos
          </h2>

          <p
            style="
              margin:0;
              color:#6B7280;
            "
          >
            Pessoas que pertencem diretamente a este departamento,
            sem uma subárea específica.
          </p>
        </div>

        <div
          style="
            font-size:24px;
            color:#9CA3AF;
          "
        >
          ›
        </div>
      </div>
    </div>

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