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

/*
 * Card de resumo.
 *
 * Segue a mesma lógica dos cards do restante
 * do Portal: o próprio card executa uma ação,
 * sem navegar para uma página nova.
 */
function reportCard({
    title,
    value,
    subtitle,
    icon,
    onclick,
}: {
    title: string;
    value: number | string;
    subtitle: string;
    icon: string;
    onclick?: string;
}) {
    return `
        <div
      class="stat-card"
      ${onclick ? `onclick="${onclick}"` : ""}
      style="
        width:100%;
        min-width:0;
        box-sizing:border-box;
        ${onclick ? "cursor:pointer;" : ""}
      "
      ${onclick
            ? `
            onmouseover="
              this.style.transform='translateY(-2px)';
            "
            onmouseout="
              this.style.transform='translateY(0)';
            "
          `
            : ""
        }
    >

      <div>

        <div class="stat-title">
          ${escapeHtml(title)}
        </div>

        <div class="stat-value">
          ${escapeHtml(String(value))}
        </div>

        <div class="stat-subtitle">
          ${escapeHtml(subtitle)}
        </div>

      </div>

      <div
        class="stat-icon"
        style="background:#F1F5F9;"
      >
        ${icon}
      </div>

    </div>
  `;
}

/*
 * Linha de atividade do relatório.
 *
 * Não navega para /portal/tasks/:id.
 *
 * Ao clicar, abre o mesmo modal de tarefa
 * utilizado no Dashboard, Colaborador etc.
 */
function activityRow(
    row: ReportData["rows"][number]
) {
    return `
    <div
      onclick="openPortalModal('/portal/tasks/${encodeURIComponent(row.id)}/modal')"
      style="
        display:grid;
        grid-template-columns:
          minmax(260px,2fr)
          minmax(170px,1fr)
          minmax(130px,.8fr)
          minmax(200px,1.3fr)
          minmax(130px,.8fr)
          minmax(130px,.8fr)
          28px;
        gap:18px;
        align-items:center;
        padding:15px 12px;
        border-bottom:1px solid #E5E7EB;
        cursor:pointer;
        transition:background .15s ease;
      "
      onmouseover="
        this.style.background='#F8FAFC';
      "
      onmouseout="
        this.style.background='transparent';
      "
    >

      <div
        style="
          font-weight:600;
          color:#1F2937;
          min-width:0;
        "
      >
        ${escapeHtml(row.title)}
      </div>

      <div
        style="
          color:#475569;
          font-size:14px;
        "
      >
        ${escapeHtml(row.responsibleName)}
      </div>

      <div
        style="
          color:#475569;
          font-size:14px;
        "
      >
        ${escapeHtml(
        recurrenceLabel(row.recurrence)
    )}
      </div>

      <div
        style="
          color:#475569;
          font-size:14px;
        "
      >
        ${escapeHtml(
        row.processTitle ?? "—"
    )}
      </div>

      <div
        style="
          color:#475569;
          font-size:14px;
        "
      >
        ${escapeHtml(
        row.verticalName ?? "—"
    )}
      </div>

      <div
        style="
          color:#475569;
          font-size:14px;
        "
      >
        ${escapeHtml(
        row.teamName ?? "—"
    )}
      </div>

      <div
        style="
          color:#94A3B8;
          font-size:20px;
          text-align:right;
        "
      >
        ›
      </div>

    </div>
  `;
}

export function reportsPage(
    data: ReportData
) {

    /*
     * =========================
     * CONTADORES
     * =========================
     */

    const collaboratorCount =
        new Set(
            data.rows.map(
                row => row.responsibleId
            )
        ).size;

    const processCount =
        new Set(
            data.rows
                .map(row => row.processId)
                .filter(Boolean)
        ).size;

    const verticalCount =
        new Set(
            data.rows
                .map(row => row.verticalId)
                .filter(Boolean)
        ).size;

    /*
     * =========================
     * URL DO EXCEL
     * =========================
     */

    const exportParams =
        new URLSearchParams();

    if (data.filters.verticalId) {
        exportParams.set(
            "verticalId",
            data.filters.verticalId
        );
    }

    if (data.filters.collaboratorId) {
        exportParams.set(
            "collaboratorId",
            data.filters.collaboratorId
        );
    }

    if (data.filters.processId) {
        exportParams.set(
            "processId",
            data.filters.processId
        );
    }

    const exportUrl =
        `/portal/reports/export${exportParams.toString()
            ? `?${exportParams.toString()}`
            : ""
        }`;

    /*
     * =========================
     * QUERY DOS MODAIS
     * =========================
     *
     * Mantém exatamente os mesmos filtros
     * utilizados no relatório.
     */

    const reportParams =
        new URLSearchParams();

    if (data.filters.verticalId) {
        reportParams.set(
            "verticalId",
            data.filters.verticalId
        );
    }

    if (data.filters.collaboratorId) {
        reportParams.set(
            "collaboratorId",
            data.filters.collaboratorId
        );
    }

    if (data.filters.processId) {
        reportParams.set(
            "processId",
            data.filters.processId
        );
    }

    const reportQuery =
        reportParams.toString()
            ? `?${reportParams.toString()}`
            : "";

    return `

    <!-- ========================= -->
    <!-- FILTROS                   -->
    <!-- ========================= -->

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

          <h2
            style="
              margin:0 0 6px 0;
            "
          >
            Filtros
          </h2>

          <div
            style="
              color:#6B7280;
              font-size:14px;
            "
          >
            Time:
            <strong>
              ${escapeHtml(data.team ?? "—")}
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

        <!-- VERTICAL -->

        <label>

          <div
            style="
              font-size:13px;
              font-weight:600;
              margin-bottom:7px;
            "
          >
            Vertical
          </div>

          <select
            name="verticalId"
            style="
              width:100%;
              padding:10px 12px;
              border:1px solid #D1D5DB;
              border-radius:10px;
              background:white;
            "
          >

            <option value="">
              Todas
            </option>

            ${data.verticals
            .map(vertical => `
                <option
                  value="${escapeHtml(vertical.id)}"
                  ${data.filters.verticalId ===
                    vertical.id
                    ? "selected"
                    : ""
                }
                >
                  ${escapeHtml(vertical.name)}
                </option>
              `)
            .join("")}

          </select>

        </label>

        <!-- COLABORADOR -->

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
                  value="${escapeHtml(
                collaborator.id
            )}"
                  ${data.filters.collaboratorId ===
                    collaborator.id
                    ? "selected"
                    : ""
                }
                >
                  ${escapeHtml(
                    collaborator.name
                )}
                </option>
              `)
            .join("")}

          </select>

        </label>

        <!-- PROCESSO -->

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
                  ${data.filters.processId ===
                    process.id
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


    <!-- ========================= -->
    <!-- CARDS RESUMO              -->
    <!-- ========================= -->

        <div
      style="
        display:grid;
        grid-template-columns:repeat(4,minmax(0,1fr));
        gap:18px;
        width:100%;
        margin-top:28px;
        box-sizing:border-box;
      "
    >

      ${reportCard({
                title: "Atividades",
                value: data.rows.length,
                subtitle: "No relatório",
                icon: "📋",
                onclick:
                    `openPortalModal('/portal/reports/activities/modal${reportQuery}', '480px')`,
            })}

      ${reportCard({
                title: "Colaboradores",
                value: collaboratorCount,
                subtitle: "Com atividades",
                icon: "👥",
                onclick:
                    `openPortalModal('/portal/reports/collaborators/modal${reportQuery}', '480px')`,
            })}

      ${reportCard({
                title: "Processos",
                value: processCount,
                subtitle: "Vinculados",
                icon: "📚",
                onclick:
                    `openPortalModal('/portal/reports/processes/modal${reportQuery}', '480px')`,
            })}

      ${reportCard({
                title: "Verticais",
                value: verticalCount,
                subtitle: `Time ${data.team ?? ""}`,
                icon: "🏢",
                onclick:
                    `openPortalModal('/portal/reports/verticals/modal${reportQuery}', '480px')`,
            })}

    </div>


    <!-- ========================= -->
    <!-- ATIVIDADES                -->
    <!-- ========================= -->

    <div
      id="report-activities"
      class="card"
      style="
        margin-top:28px;
      "
    >

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:16px;
          margin-bottom:20px;
        "
      >

        <div>

          <h2
            style="
              margin:0 0 5px 0;
            "
          >
            Atividades
          </h2>

          <span
            style="
              font-size:13px;
              color:#6B7280;
            "
          >
            ${data.rows.length}
            atividade${data.rows.length === 1
            ? ""
            : "s"
        }
          </span>

        </div>

        ${data.rows.length
            ? `
              <a
                href="${escapeHtml(exportUrl)}"
                style="
                  display:inline-flex;
                  align-items:center;
                  gap:8px;
                  padding:10px 16px;
                  background:#16A34A;
                  color:white;
                  border-radius:10px;
                  text-decoration:none;
                  font-size:13px;
                  font-weight:700;
                  white-space:nowrap;
                "
              >
                📥 Exportar Excel
              </a>
            `
            : ""
        }

      </div>

      ${data.rows.length
            ? `
            <div
              style="
                width:100%;
                overflow-x:auto;
              "
            >

              <div
                style="
                  min-width:1050px;
                "
              >

                <!-- CABEÇALHO -->

                <div
                  style="
                    display:grid;
                    grid-template-columns:
                      minmax(260px,2fr)
                      minmax(170px,1fr)
                      minmax(130px,.8fr)
                      minmax(200px,1.3fr)
                      minmax(130px,.8fr)
                      minmax(130px,.8fr)
                      28px;
                    gap:18px;
                    padding:10px 12px;
                    border-bottom:1px solid #D1D5DB;
                    color:#64748B;
                    font-size:12px;
                    font-weight:700;
                  "
                >

                  <div>Atividade</div>

                  <div>
                    Responsável
                  </div>

                  <div>
                    Recorrência
                  </div>

                  <div>
                    Processo
                  </div>

                  <div>
                    Vertical
                  </div>

                  <div>
                    Time
                  </div>

                  <div></div>

                </div>

                <!-- LINHAS -->

                ${data.rows
                .map(row =>
                    activityRow(row)
                )
                .join("")}

              </div>

            </div>
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