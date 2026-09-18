export function batchImportModal() {
  return `
    <div
      style="
        width:620px;
        max-width:100%;
        padding:32px;
      "
    >

      <div
        class="portal-modal-header"
        style="
          margin-bottom:24px;
        "
      >
        <div>
          <h2
            style="
              margin:0;
              font-size:26px;
            "
          >
            📦 Enviar atividades em lote
          </h2>

          <p
            style="
              margin:8px 0 0;
              color:#6B7280;
              line-height:1.5;
            "
          >
            Use a planilha padrão do FTA para criar
            várias atividades de uma só vez.
          </p>
        </div>

        <button
          type="button"
          onclick="closePortalModal()"
          style="
            border:none;
            background:none;
            cursor:pointer;
            font-size:28px;
            color:#6B7280;
          "
        >
          ✕
        </button>
      </div>


      <!-- BAIXAR MODELO -->

      <div
        style="
          border:1px solid #E5E7EB;
          border-radius:14px;
          padding:20px;
          margin-bottom:16px;
        "
      >

        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:20px;
          "
        >

          <div>
            <div
              style="
                font-size:16px;
                font-weight:700;
                margin-bottom:5px;
              "
            >
              📥 Baixar planilha modelo
            </div>

            <div
              style="
                color:#6B7280;
                font-size:14px;
                line-height:1.5;
              "
            >
              Baixe o arquivo atualizado com os
              processos e campos aceitos pelo FTA.
            </div>
          </div>

          <a
            href="/portal/tasks/batch/template"
            class="portal-action-btn portal-action-outline"
            style="
              text-decoration:none;
              flex-shrink:0;
            "
          >
            Baixar
          </a>

        </div>

      </div>


      <!-- ENVIAR PLANILHA -->

      <div
        style="
          border:1px solid #E5E7EB;
          border-radius:14px;
          padding:20px;
        "
      >

        <div
          style="
            font-size:16px;
            font-weight:700;
            margin-bottom:5px;
          "
        >
          📤 Enviar planilha preenchida
        </div>

        <div
          style="
            color:#6B7280;
            font-size:14px;
            line-height:1.5;
            margin-bottom:16px;
          "
        >
          Selecione a planilha preenchida.
          O FTA validará as linhas e criará
          as atividades válidas.
        </div>

        <input
          id="portal-batch-import-file"
          type="file"
          accept=".xlsx"
          style="
            display:block;
            width:100%;
            box-sizing:border-box;
            padding:12px;
            border:1px solid #D1D5DB;
            border-radius:10px;
            background:#F9FAFB;
            margin-bottom:16px;
          "
        />

        <div
          id="portal-batch-import-result"
          style="
            display:none;
            margin-bottom:16px;
            padding:12px 14px;
            border-radius:10px;
            font-size:14px;
            line-height:1.5;
          "
        ></div>

        <div
          style="
            display:flex;
            justify-content:flex-end;
          "
        >
          <button
            id="portal-batch-import-button"
            type="button"
            class="portal-action-btn portal-action-primary"
            onclick="portalImportTasksBatch()"
          >
            📤 Enviar
          </button>
        </div>

      </div>

    </div>
  `;
}