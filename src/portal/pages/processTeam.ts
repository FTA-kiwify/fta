import { ProcessTeamDetails } from "../../services/portal/processTeamDetailsService";
import { accordion } from "../components/accordion";

export function processTeamPage(
  team: ProcessTeamDetails
) {

  return `

    ${team.themes
      .map(theme =>

        accordion({

          id: theme.name.replace(/\s+/g, "-").toLowerCase(),

          title: `📂 ${theme.name}`,

          count: theme.processes.length,

          body: theme.processes

            .map(process => `

              <div
                onclick="window.location='/portal/processes/${process.id}'"
                style="
                  display:flex;
                  justify-content:space-between;
                  align-items:center;
                  padding:18px 0;
                  cursor:pointer;
                  border-bottom:1px solid #E5E7EB;
                  transition:background .15s;
                "
                onmouseover="this.style.background='#F9FAFB'"
                onmouseout="this.style.background='transparent'"
              >

                <div>

                  <div
                    style="
                      font-weight:600;
                      font-size:15px;
                      color:#111827;
                    "
                  >
                    📚 ${process.title}
                  </div>

                  <div
                    style="
                      color:#6B7280;
                      font-size:13px;
                      margin-top:4px;
                    "
                  >
                    Clique para abrir o processo
                  </div>

                </div>

                <div
                  style="
                    color:#9CA3AF;
                    font-size:18px;
                  "
                >
                  →
                </div>

              </div>

            `)
            .join(""),

        })

      )
      .join("")}

  `;

}