import { ProcessTeamDetails } from "../../services/portal/processTeamDetailsService";
import { accordion } from "../components/accordion";

export function processTeamPage(
  team: ProcessTeamDetails
) {

  return `

    ${team.themes
      .map(theme =>

        accordion({

          id: theme.name
            .replace(/\s+/g, "-")
            .toLowerCase(),

          title: `📂 ${theme.name}`,

          count: theme.processes.length,

          body: `

            <div
              style="
                display:grid;
                grid-template-columns:repeat(auto-fill,minmax(340px,1fr));
                gap:18px;
                padding-top:18px;
              "
            >

              ${theme.processes.map(process => `

                <div
                  onclick="window.location='/portal/processes/${process.id}'"
                  style="
                    border:1px solid #E5E7EB;
                    border-radius:14px;
                    padding:18px;
                    cursor:pointer;
                    transition:.15s;
                    background:white;
                  "
                  onmouseover="
                    this.style.boxShadow='0 6px 20px rgba(0,0,0,.08)';
                    this.style.transform='translateY(-2px)';
                  "
                  onmouseout="
                    this.style.boxShadow='none';
                    this.style.transform='translateY(0)';
                  "
                >

                  <div
                    style="
                      display:flex;
                      justify-content:space-between;
                      align-items:flex-start;
                      gap:12px;
                    "
                  >

                    <div>

                      <div
                        style="
                          font-size:16px;
                          font-weight:600;
                          color:#111827;
                          line-height:1.4;
                        "
                      >
                        📚 ${process.title}
                      </div>

                      <div
                        style="
                          margin-top:10px;
                          color:#6B7280;
                          font-size:13px;
                        "
                      >
                        Clique para abrir o processo
                      </div>

                    </div>

                    <div
                      style="
                        font-size:20px;
                        color:#9CA3AF;
                      "
                    >
                      →
                    </div>

                  </div>

                </div>

              `).join("")}

            </div>

          `,

        })

      )
      .join("")}

  `;

}