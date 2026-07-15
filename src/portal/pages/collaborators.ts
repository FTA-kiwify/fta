import { collaboratorCard } from "../components/collaboratorCard";
import type { Collaborator } from "../../services/portal/collaboratorService";

export function collaboratorsPage(
  collaborators: Collaborator[]
) {

  return `

    <div class="collaborator-list">

      ${collaborators
        .map(collaborator => collaboratorCard(collaborator))
        .join("")}

    </div>

    <script>

      const input = document.getElementById("portal-search");

      if (input) {

        input.addEventListener("input", function () {

          const value = this.value
            .toLowerCase()
            .trim();

          document
            .querySelectorAll(".collaborator-card")
            .forEach(card => {

              const search =
                card.dataset.search ?? "";

              card.style.display =
                search.includes(value)
                  ? ""
                  : "none";

            });

        });

      }

    </script>

  `;

}