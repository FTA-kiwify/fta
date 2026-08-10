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

function reportCard({
  title,
  value,
  subtitle,
  icon,
  href,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: string;
  href?: string;
}) {

  const content = `
    <div
      class="card"
      style="
        padding:20px 22px;
        min-height:105px;
        height:100%;
        box-sizing:border-box;
        transition:
          transform .15s ease,
          box-shadow .15s ease;
        ${href ? "cursor:pointer;" : ""}
      "
      ${
        href
          ? `
            onmouseover="
              this.style.transform='translateY(-2px)';
              this.style.boxShadow='0 10px 25px rgba(15,23,42,.10)';
            "
            onmouseout="
              this.style.transform='translateY(0)';
              this.style.boxShadow='';
            "
          `
          : ""
      }
    >
      <div
        style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:16px;
        "
      >
        <div>
          <div
            style="
              font-size:13px;
              color:#6B7280;
              margin-bottom:8px;
            "
          >
            ${escapeHtml(title)}
          </div>

          <div
            style="
              font-size:28px;
              font-weight:700;
              line-height:1;
              margin-bottom:8px;
            "
          >
            ${escapeHtml(String(value))}
          </div>

          <div
            style="
              font-size:12px;
              color:#94A3B8;
            "
          >
            ${escapeHtml(subtitle)}
          </div>
        </div>

        <div
          style="
            width:44px;
            height:44px;
            border-radius:12px;
            background:#F1F5F9;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:22px;
            flex-shrink:0;
          "
        >
          ${icon}
        </div>
      </div>
    </div>
  `;

  if (!href) {
    return content;
  }

  return `
    <a
      href="${escapeHtml(href)}"
      style="
        display:block;
        color:inherit;
        text-decoration:none;
      "
    >
      ${content}
    </a>
  `;
}

function activityCard(
  row: ReportData["rows"][number]
) {
  return `
    <a
      href="/portal/tasks/${encodeURIComponent(row.id)}"
      style="
        display:block;
        color:inherit;
        text-decoration:none;
      "
    >
      <div
        style="
          border:1px solid #E5E7EB;
          border-radius:12px;
          padding:16px 18px;
          background:#FFFFFF;
          min-height:125px;
          height:100%;
          box-sizing:border-box;
          cursor:pointer;
          transition:
            transform .15s ease,
            box-shadow .15s ease,
            border-color .15s ease;
        "
        onmouseover="
          this.style.transform='translateY(-2px)';
          this.style.boxShadow='0 8px 22px rgba(15,23,42,.08)';
          this.style.borderColor='#CBD5E1';
        "
        onmouseout="
          this.style.transform='translateY(0)';
          this.style.boxShadow='';
          this.style.borderColor='#E5E7EB';
        "
      >

        <div
          style="
            display:flex;
            justify-content:space-between;
            gap:16px;
            align-items:flex-start;
          "
        >

          <div
            style="
              min-width:0;
              flex:1;
            "
          >

            <div
              style="
                font-size:14px;
                font-weight:700;
                color:#1F2937;
                margin-bottom:10px;
              "
            >
              ${escapeHtml(row.title)}
            </div>

            <div
              style="
                font-size:12px;
                color:#64748B;
                line-height:1.7;
              "
            >
              👤 ${escapeHtml(row.responsibleName)}

              <br>

              🔁 ${escapeHtml(
                recurrenceLabel(row.recurrence)
              )}

              ${
                row.processTitle
                  ? `
                    <br>
                    📚 ${escapeHtml(row.processTitle)}
                  `
                  : ""
              }
            </div>

          </div>

          <div
            style="
              color:#94A3B8;
              font-size:20px;
              line-height:1;
              flex-shrink:0;
            "
          >
            ›
          </div>

        </div>

        <div
          style="
            display:flex;
            gap:8px;
            flex-wrap:wrap;
            margin-top:13px;
          "
        >

          ${
            row.verticalName
              ? `
                <span
                  style="
                    background:#F1F5F9;
                    border-radius:999px;
                    padding:4px 9px;
                    font-size:11px;
                    color:#475569;
                  "
                >
                  ${escapeHtml(row.verticalName)}
                </span>
              `
              : ""
          }

          ${
            row.teamName
              ? `
                <span
                  style="
                    background:#F1F5F9;
                    border-radius:999px;
                    padding:4px 9px;
                    font-size:11px;
                    color:#475569;
                  "
                >
                  ${escapeHtml(row.teamName)}
                </span>
              `
              : ""
          }

        </div>

      </div>
    </a>
  `;
}

export function reportsPage(
  data: ReportData
) {

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
   * URL DO EXCEL
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
    `/portal/reports/export${
      exportParams.toString()
        ? `?${exportParams.toString()}`
        : ""
    }`;

  /*
   * LINKS DOS CARDS
   */

  const activitiesHref =
    "#report-activities";

  const collaboratorsHref =
    data.filters.collaboratorId
      ? `/portal/collaborators/${encodeURIComponent(
          data.filters.collaboratorId
        )}`
      : "#report-activities";

  const processesHref =
    data.filters.processId
      ? `/portal/processes/${encodeURIComponent(
          data.filters.processId
        )}`
      : "#report-activities";

  const verticalsHref =
    data.filters.verticalId
      ? `/portal/teams/${encodeURIComponent(
          data.filters.verticalId
        )}`
      : "/portal/teams";

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
                  ${
                    data.filters.verticalId ===
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
                  ${
                    data.filters.collaboratorId ===
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
                  ${
                    data.filters.processId ===
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
        grid-template-columns:
          repeat(4,minmax(0,1fr));
        gap:18px;
        margin-top:28px;
      "
    >

      ${reportCard({
        title: "Atividades",
        value: data.rows.length,
        subtitle: "No relatório",
        icon: "📋",
        href: activitiesHref,
      })}

      ${reportCard({
        title: "Colaboradores",
        value: collaboratorCount,
        subtitle: "Com atividades",
        icon: "👥",
        href: collaboratorsHref,
      })}

      ${reportCard({
        title: "Processos",
        value: processCount,
        subtitle: "Vinculados",
        icon: "📚",
        href: processesHref,
      })}

      ${reportCard({
        title: "Verticais",
        value: verticalCount,
        subtitle: `Time ${data.team ?? ""}`,
        icon: "🏢",
        href: verticalsHref,
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
            atividade${
              data.rows.length === 1
                ? ""
                : "s"
            }
          </span>

        </div>


        ${
          data.rows.length
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


      ${
        data.rows.length
          ? `
            <div
              style="
                display:grid;
                grid-template-columns:
                  repeat(
                    auto-fill,
                    minmax(360px,1fr)
                  );
                gap:14px;
              "
            >

              ${data.rows
                .map(row =>
                  activityCard(row)
                )
                .join("")}

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