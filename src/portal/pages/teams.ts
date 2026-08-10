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

    <div id="portal-teams-list">

      ${teams
        .map(team => `
          <div
            class="portal-team-card"
            data-search="${team.name.toLowerCase()}"
          >
            ${departmentCard(team)}
          </div>
        `)
        .join("")}

    </div>

    <div
      id="portal-teams-empty"
      style="
        display:none;
        padding:40px;
        text-align:center;
        color:#6B7280;
      "
    >
      Nenhum time encontrado.
    </div>

    <script>
      (() => {

        const search =
          document.getElementById("portal-search");

        const cards = Array.from(
          document.querySelectorAll(".portal-team-card")
        );

        const empty =
          document.getElementById("portal-teams-empty");

        if (!search) return;

        search.addEventListener("input", () => {

          const value =
            search.value
              .toLowerCase()
              .trim();

          let visible = 0;

          cards.forEach((card) => {

            const text =
              card.getAttribute("data-search") || "";

            const show =
              text.includes(value);

            card.style.display =
              show ? "" : "none";

            if (show) visible++;

          });

          if (empty) {
            empty.style.display =
              visible === 0
                ? "block"
                : "none";
          }

        });

      })();
    </script>

  `;

}