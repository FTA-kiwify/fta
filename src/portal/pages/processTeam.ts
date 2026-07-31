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
          title: theme.name,
          count: theme.processes.length,
          body: theme.processes
            .map(process => `
              <div
                onclick="window.location='/portal/processes/${process.id}'"
                style="
                  padding:10px 0 10px 14px;
                  cursor:pointer;
                  border-left:2px solid #E5E7EB;
                  margin-left:12px;
                "
              >
                📄 ${process.title}
              </div>
            `)
            .join(""),
        })
      )
      .join("")}

  `;

}