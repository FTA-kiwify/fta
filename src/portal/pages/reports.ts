import type {
  ReportData,
} from "../../services/portal/reportService";

function escapeHtml(
  value: string | null | undefined
) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function recurrenceLabel(
  recurrence: string
) {

  const labels: Record<string, string> = {
    daily: "Diária",
    weekly: "Semanal",
    biweekly: "Quinzenal",
    monthly: "Mensal",
    quarterly: "Trimestral",
    semiannual: "Semestral",
    annual: "Anual",
    none: "Sem recorrência",
  };

  return labels[recurrence] ?? recurrence;
}

export function reportsPage(
  data: ReportData
) {

  const query = new URLSearchParams();

  if (data.filters.teamId) {
    query.set("teamId", data.filters.teamId);
  }

  if (data.filters.collaboratorId) {
    query.set(
      "collaboratorId",
      data.filters.collaboratorId
    );
  }

  if (data.filters.processId) {
    query.set(
      "processId",
      data.filters.processId
    );
  }

  return `

    <div class="card">

      <div
        style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:20px;
          margin-bottom:24px;
        "
      >

        <div>
          <h2 style="margin:0 0 6px 0;">
            Filtros
          </h2>

          <div
            style="
              color:#6B7280;
              font-size:14px;
            "
          >
            Vertical:
            <strong>
              ${escapeHtml(data.vertical ?? "—")}
            </strong>
          </div>
        </div>

        <a
          href="/portal/reports"
          style="
            text-decoration:none;
            color:#4F46E5;
            font-size:14px;
            font-weight:600;
          "
        >
          Limpar filtros
        </a>

      </div>

      <form
        method="GET"
        action="/portal/reports"
        style="
          display:grid;
          grid-template-columns:
            repeat(3,minmax(180px,1fr))
            auto;
          gap:16px;
          align-items:end;
        "
      >

        <label>
          <div
            style="
              font-size:13px;
              font-weight:600;
              margin-bottom:7px;
            "
          >
            Time
          </div>

          <select
            name="teamId"
            style="
              width:100%;
              padding:10px 12px;
              border:1px solid #D1D5DB;
              border-radius:10px;
              background:white;
            "
          >
            <option value="">
              Todos
            </option>

            ${data.teams
              .map(team => `
                <option
                  value="${escapeHtml(team.id)}"
                  ${
                    data.filters.teamId === team.id
                      ? "selected"
                      : ""
                  }
                >
                  ${escapeHtml(team.name)}
                </option>
              `)
              .join("")}
          </select>
        </label>

        <label>
          <div
            style="
              font-size:13px;
              font-weight:600;
              margin-bottom:7px;
            "
          >
            Colaborador
          </div>

          <select
            name="collaboratorId"
            style="
              width:100%;
              padding:10px 12px;
              border:1px solid #D1D5DB;
              border-radius:10px;
              background:white;
            "
          >
            <option value="">
              Todos
            </option>

            ${data.collaborators
              .map(collaborator => `
                <option
                  value="${escapeHtml(collaborator.id)}"
                  ${
                    data.filters.collaboratorId ===
                    collaborator.id
                      ? "selected"
                      : ""
                  }
                >
                  ${escapeHtml(collaborator.name)}
                </option>
              `)
              .join("")}
          </select>
        </label>

        <label>
          <div
            style="
              font-size:13px;
              font-weight:600;
              margin-bottom:7px;
            "
          >
            Processo
          </div>

          <select
            name="processId"
            style="
              width:100%;
              padding:10px 12px;
              border:1px solid #D1D5DB;
              border-radius:10px;
              background:white;
            "
          >
            <option value="">
              Todos
            </option>

            ${data.processes
              .map(process => `
                <option
                  value="${escapeHtml(process.id)}"
                  ${
                    data.filters.processId === process.id
                      ? "selected"
                      : ""
                  }
                >
                  ${escapeHtml(process.name)}
                </option>
              `)
              .join("")}
          </select>
        </label>

        <button
          type="submit"
          class="btn-primary"
          style="
            height:40px;
            white-space:nowrap;
          "
        >
          Gerar relatório
        </button>

      </form>

    </div>

    <div
      class="card"
      style="
        margin-top:28px;
        overflow-x:auto;
      "
    >

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:20px;
        "
      >
        <h2 style="margin:0;">
          Atividades
        </h2>

        <span
          style="
            font-size:13px;
            color:#6B7280;
          "
        >
          ${data.rows.length}
          atividade${data.rows.length === 1 ? "" : "s"}
        </span>
      </div>

      ${
        data.rows.length
          ? `
            <table
              style="
                width:100%;
                border-collapse:collapse;
                font-size:14px;
              "
            >

              <thead>
                <tr
                  style="
                    text-align:left;
                    border-bottom:1px solid #E5E7EB;
                  "
                >
                  <th style="padding:12px;">
                    Atividade
                  </th>
                  <th style="padding:12px;">
                    Responsável
                  </th>
                  <th style="padding:12px;">
                    Recorrência
                  </th>
                  <th style="padding:12px;">
                    Processo
                  </th>
                  <th style="padding:12px;">
                    Notion
                  </th>
                  <th style="padding:12px;">
                    Time
                  </th>
                  <th style="padding:12px;">
                    Vertical
                  </th>
                </tr>
              </thead>

              <tbody>

                ${data.rows
                  .map(row => `
                    <tr
                      style="
                        border-bottom:1px solid #F3F4F6;
                      "
                    >
                      <td
                        style="
                          padding:14px 12px;
                          font-weight:600;
                        "
                      >
                        ${escapeHtml(row.title)}
                      </td>

                      <td style="padding:14px 12px;">
                        ${escapeHtml(
                          row.responsibleName
                        )}
                      </td>

                      <td style="padding:14px 12px;">
                        ${escapeHtml(
                          recurrenceLabel(
                            row.recurrence
                          )
                        )}
                      </td>

                      <td style="padding:14px 12px;">
                        ${escapeHtml(
                          row.processTitle ?? "—"
                        )}
                      </td>

                      <td style="padding:14px 12px;">
                        ${
                          row.notionUrl
                            ? `
                              <a
                                href="${escapeHtml(row.notionUrl)}"
                                target="_blank"
                                rel="noopener noreferrer"
                                style="
                                  color:#4F46E5;
                                  text-decoration:none;
                                  font-weight:600;
                                "
                              >
                                Abrir ↗
                              </a>
                            `
                            : "—"
                        }
                      </td>

                      <td style="padding:14px 12px;">
                        ${escapeHtml(
                          row.teamName ?? "—"
                        )}
                      </td>

                      <td style="padding:14px 12px;">
                        ${escapeHtml(
                          row.vertical ?? "—"
                        )}
                      </td>
                    </tr>
                  `)
                  .join("")}

              </tbody>

            </table>
          `
          : `
            <div
              style="
                padding:50px 20px;
                text-align:center;
                color:#6B7280;
              "
            >
              Nenhuma atividade encontrada
              para os filtros selecionados.
            </div>
          `
      }

    </div>

  `;
}