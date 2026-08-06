import { ProcessTeamDetails } from "../../services/portal/processTeamDetailsService";
import { accordion } from "../components/accordion";

export function processTeamPage(
  team: ProcessTeamDetails
) {

  return `

    ${team.themes
      .map(theme =>

        `
          <div
            class="card"
            style="
              margin-bottom:20px;
              padding:0;
              overflow:hidden;
            "
          >

            ${accordion({

              id: theme.name
                .replace(/\s+/g, "-")
                .toLowerCase(),

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
                      padding:18px 24px;
                      cursor:pointer;
                      border-top:1px solid #E5E7EB;
                      transition:background .15s;
                    "
                    onmouseover="this.style.background='#F9FAFB'"
                    onmouseout="this.style.background='white'"
                  >

                    <div
                      style="
                        display:flex;
                        align-items:center;
                        gap:12px;
                        font-weight:600;
                      "
                    >
                      📚 ${process.title}
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

            })}

          </div>
        `

      )
      .join("")}

  `;

}