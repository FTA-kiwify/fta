// src/services/generateTasksImportTemplate.ts

import ExcelJS from "exceljs";
import { prisma } from "../lib/prisma";

export async function generateTasksImportTemplate(): Promise<Buffer> {
  const processes = await prisma.process.findMany({
    where: {
      active: true,
    },
    orderBy: [
      {
        notionVertical: "asc",
      },
      {
        notionTeam: "asc",
      },
      {
        title: "asc",
      },
    ],
    select: {
      id: true,
      title: true,
      notionVertical: true,
      notionTeam: true,
      theme: true,
      notionPageUrl: true,
    },
  });

  const workbook = new ExcelJS.Workbook();

  workbook.creator = "FTA";
  workbook.created = new Date();

  // =====================================================
  // ABA PRINCIPAL
  // =====================================================

  const tasksSheet = workbook.addWorksheet("Tasks", {
    views: [
      {
        state: "frozen",
        ySplit: 1,
      },
    ],
  });

  const headers = [
    "Título*",
    "Descrição",
    "E-mail do responsável",
    "ID Slack do responsável",
    "ID Slack de quem delegou",
    "Tipo da tarefa",
    "Prazo",
    "Horário",
    "Urgência",
    "Tipo de prazo",
    "Recorrência",
    "Processo",
    "Privacidade",
    "Turbo dia anterior",
    "Horário início Turbo",
    "E-mail das cópias",
    "ID Slack das cópias",
  ];

  tasksSheet.addRow(headers);

  tasksSheet.columns = [
    { key: "title", width: 32 },
    { key: "description", width: 40 },
    { key: "responsibleEmail", width: 32 },
    { key: "responsibleSlackId", width: 24 },
    { key: "delegationSlackId", width: 26 },
    { key: "taskType", width: 20 },
    { key: "term", width: 16 },
    { key: "deadlineTime", width: 16 },
    { key: "urgency", width: 16 },
    { key: "reminderMode", width: 22 },
    { key: "recurrence", width: 20 },
    { key: "process", width: 42 },
    { key: "calendarPrivate", width: 18 },
    { key: "turboPreviousDay", width: 22 },
    { key: "turboStartTime", width: 22 },
    { key: "ccEmails", width: 36 },
    { key: "ccSlackIds", width: 32 },
  ];

  // Cabeçalho
  const headerRow = tasksSheet.getRow(1);

  headerRow.font = {
    bold: true,
  };

  headerRow.height = 24;

  // =====================================================
  // ABA DE PROCESSOS
  // =====================================================

  const processSheet = workbook.addWorksheet("Processos");

  processSheet.columns = [
    {
      header: "Processo",
      key: "title",
      width: 48,
    },
    {
      header: "Vertical",
      key: "vertical",
      width: 24,
    },
    {
      header: "Time",
      key: "team",
      width: 24,
    },
    {
      header: "Tema",
      key: "theme",
      width: 28,
    },
    {
      header: "ID",
      key: "id",
      width: 30,
    },
    {
      header: "Notion",
      key: "notion",
      width: 50,
    },
  ];

  processSheet.getRow(1).font = {
    bold: true,
  };

  for (const process of processes) {
    processSheet.addRow({
      title: process.title,
      vertical: process.notionVertical,
      team: process.notionTeam,
      theme: process.theme ?? "",
      id: process.id,
      notion: process.notionPageUrl,
    });
  }

  // =====================================================
  // LISTAS AUXILIARES
  // =====================================================

  const listsSheet = workbook.addWorksheet("_Listas");

  listsSheet.state = "hidden";

  listsSheet.getCell("A1").value = "Tipo da tarefa";
  listsSheet.getCell("A2").value = "normal";
  listsSheet.getCell("A3").value = "on_demand";

  listsSheet.getCell("B1").value = "Urgência";
  listsSheet.getCell("B2").value = "light";
  listsSheet.getCell("B3").value = "asap";
  listsSheet.getCell("B4").value = "turbo";

  listsSheet.getCell("C1").value = "Tipo de prazo";
  listsSheet.getCell("C2").value = "until";
  listsSheet.getCell("C3").value = "from";

  listsSheet.getCell("D1").value = "Recorrência";
  listsSheet.getCell("D2").value = "none";
  listsSheet.getCell("D3").value = "daily";
  listsSheet.getCell("D4").value = "weekly";
  listsSheet.getCell("D5").value = "biweekly";
  listsSheet.getCell("D6").value = "monthly";
  listsSheet.getCell("D7").value = "quarterly";
  listsSheet.getCell("D8").value = "semiannual";
  listsSheet.getCell("D9").value = "annual";

  listsSheet.getCell("E1").value = "Sim/Não";
  listsSheet.getCell("E2").value = "não";
  listsSheet.getCell("E3").value = "sim";

  // =====================================================
  // DROPDOWNS
  // =====================================================

  // Aplicamos em várias linhas para a pessoa poder preencher o arquivo.
  const firstDataRow = 2;
  const lastDataRow = 501;

  // F = Tipo da tarefa
  for (let row = firstDataRow; row <= lastDataRow; row++) {
    tasksSheet.getCell(`F${row}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ["'_Listas'!$A$2:$A$3"],
    };
  }

  // I = Urgência
  for (let row = firstDataRow; row <= lastDataRow; row++) {
    tasksSheet.getCell(`I${row}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ["'_Listas'!$B$2:$B$4"],
    };
  }

  // J = Tipo de prazo
  for (let row = firstDataRow; row <= lastDataRow; row++) {
    tasksSheet.getCell(`J${row}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ["'_Listas'!$C$2:$C$3"],
    };
  }

  // K = Recorrência
  for (let row = firstDataRow; row <= lastDataRow; row++) {
    tasksSheet.getCell(`K${row}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ["'_Listas'!$D$2:$D$9"],
    };
  }

  // L = Processo
  if (processes.length > 0) {
    for (let row = firstDataRow; row <= lastDataRow; row++) {
      tasksSheet.getCell(`L${row}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [
          `'Processos'!$A$2:$A$${processes.length + 1}`,
        ],
        showErrorMessage: true,
        errorStyle: "stop",
        errorTitle: "Processo inválido",
        error:
          "Selecione um processo disponível na lista.",
      };
    }
  }

  // M = Privacidade
  for (let row = firstDataRow; row <= lastDataRow; row++) {
    tasksSheet.getCell(`M${row}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ["'_Listas'!$E$2:$E$3"],
    };
  }

  // N = Turbo dia anterior
  for (let row = firstDataRow; row <= lastDataRow; row++) {
    tasksSheet.getCell(`N${row}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ["'_Listas'!$E$2:$E$3"],
    };
  }

  // =====================================================
  // FORMATAÇÕES
  // =====================================================

  for (let row = firstDataRow; row <= lastDataRow; row++) {
    tasksSheet.getCell(`G${row}`).numFmt = "dd/mm/yyyy";
    tasksSheet.getCell(`H${row}`).numFmt = "hh:mm";
    tasksSheet.getCell(`O${row}`).numFmt = "hh:mm";
  }

  tasksSheet.autoFilter = {
    from: "A1",
    to: "Q1",
  };

  // =====================================================
  // ABA DE INSTRUÇÕES
  // =====================================================

  const instructions = workbook.addWorksheet("Instruções");

  instructions.columns = [
    {
      width: 110,
    },
  ];

  const instructionsText = [
    "IMPORTAÇÃO DE ATIVIDADES EM LOTE - FTA",
    "",
    "1. Preencha as atividades na aba Tasks.",
    "",
    "2. Título é obrigatório.",
    "",
    "3. Informe o responsável por E-mail ou ID Slack.",
    "",
    "4. Tipo da tarefa:",
    "   • normal = tarefa com prazo",
    "   • on_demand = atividade sob demanda, sem prazo",
    "",
    "5. Para tarefa normal, o Prazo é obrigatório.",
    "",
    "6. Processo:",
    "   Use o dropdown da coluna Processo.",
    "   A lista é atualizada automaticamente toda vez que o FTA gera este arquivo.",
    "",
    "7. Privacidade:",
    "   • não = evento padrão",
    "   • sim = atividade privada no Google Calendar",
    "",
    "8. Recorrências disponíveis:",
    "   none, daily, weekly, biweekly, monthly, quarterly, semiannual e annual.",
    "",
    "9. Urgências disponíveis:",
    "   light, asap e turbo.",
    "",
    "10. Para múltiplas pessoas em cópia, separe os valores por vírgula.",
    "",
    "Não altere os nomes das colunas da aba Tasks.",
    "",
    `Template gerado em: ${new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    })}`,
  ];

  instructionsText.forEach((text) => {
    instructions.addRow([text]);
  });

  instructions.getCell("A1").font = {
    bold: true,
    size: 14,
  };

  // Deixa a aba principal aberta ao baixar.
  tasksSheet.views = [
    {
      state: "frozen",
      ySplit: 1,
    },
  ];

  // Retorna o arquivo em memória.
  const output =
    await workbook.xlsx.writeBuffer();

  return Buffer.from(output);
}