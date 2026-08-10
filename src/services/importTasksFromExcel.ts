// src/services/importTasksFromExcel.ts

import type { WebClient } from "@slack/web-api";
import ExcelJS from "exceljs";

import { prisma } from "../lib/prisma";
import { createTaskService } from "./createTaskService";
import { notifyTaskCreated } from "./notifyTaskCreated";
import { syncTaskParticipantEmails } from "./syncTaskParticipantEmails";

type SlackFile = {
  id?: string;
  name?: string;
  mimetype?: string;
  url_private_download?: string;
  url_private?: string;
};

function mustEnv(name: string) {
  const v = process.env[name];

  if (!v) {
    throw new Error(`Missing env: ${name}`);
  }

  return v;
}

function normalizeHeader(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\*/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function cellToString(v: any): string {
  if (v == null) return "";

  if (typeof v === "string") {
    return v.trim();
  }

  if (typeof v === "number") {
    return String(v);
  }

  if (v instanceof Date) {
    return v.toISOString().slice(0, 10);
  }

  if (typeof v === "object" && typeof v.text === "string") {
    return v.text.trim();
  }

  return String(v).trim();
}

function parseSlackUserId(raw: string): string | null {
  const s = raw.trim();

  if (!s) return null;

  const mentionMatch = s.match(/^<@([A-Z0-9]+)>$/i);

  if (mentionMatch?.[1]) {
    return mentionMatch[1];
  }

  if (/^[A-Z0-9]{8,}$/.test(s)) {
    return s;
  }

  return null;
}

function parseEmail(raw: string): string | null {
  const s = raw.trim().toLowerCase();

  if (!s) return null;

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
    return s;
  }

  return null;
}

async function slackUserIdFromEmail(
  slack: WebClient,
  email: string
): Promise<string | null> {

  try {

    const res = await slack.users.lookupByEmail({
      email,
    });

    const id = (res.user as any)?.id as string | undefined;

    return id ? String(id) : null;

  } catch {

    return null;

  }
}

function parseDateToTermDate(value: any): Date | null {

  if (!value) {
    return null;
  }

  if (
    value instanceof Date &&
    !Number.isNaN(value.getTime())
  ) {

    const iso = value.toISOString().slice(0, 10);

    return new Date(
      `${iso}T03:00:00.000Z`
    );
  }

  // Excel serial date
  if (
    typeof value === "number" &&
    value > 20000
  ) {

    const ms =
      Math.round(
        (value - 25569) *
        86400 *
        1000
      );

    const d = new Date(ms);

    if (!Number.isNaN(d.getTime())) {

      const iso =
        d.toISOString().slice(0, 10);

      return new Date(
        `${iso}T03:00:00.000Z`
      );

    }
  }

  const s = cellToString(value);

  if (!s) {
    return null;
  }

  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {

    return new Date(
      `${s}T03:00:00.000Z`
    );

  }

  // dd/mm/yyyy
  const brDate =
    s.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/
    );

  if (brDate) {

    const iso =
      `${brDate[3]}-${brDate[2]}-${brDate[1]}`;

    return new Date(
      `${iso}T03:00:00.000Z`
    );

  }

  return null;
}

function parseTime(value: any): string | null {

  if (value == null) {
    return null;
  }

  if (
    value instanceof Date &&
    !Number.isNaN(value.getTime())
  ) {

    const hh =
      String(
        value.getHours()
      ).padStart(2, "0");

    const mm =
      String(
        value.getMinutes()
      ).padStart(2, "0");

    return `${hh}:${mm}`;
  }

  // Excel time fraction
  if (
    typeof value === "number" &&
    value >= 0 &&
    value < 1
  ) {

    const totalMin =
      Math.round(
        value * 24 * 60
      );

    const hh =
      String(
        Math.floor(totalMin / 60)
      ).padStart(2, "0");

    const mm =
      String(
        totalMin % 60
      ).padStart(2, "0");

    return `${hh}:${mm}`;
  }

  const t = cellToString(value);

  if (!t) {
    return null;
  }

  if (/^\d{2}:\d{2}$/.test(t)) {
    return t;
  }

  return null;
}

function parseUrgency(
  raw: string
): "light" | "asap" | "turbo" {

  const v =
    raw
      .trim()
      .toLowerCase();

  if (v.includes("turbo")) {
    return "turbo";
  }

  if (v.includes("asap")) {
    return "asap";
  }

  return "light";
}

function parseRecurrence(
  raw: string
):
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "annual"
  | null {

  const v =
    raw
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  if (
    !v ||
    v === "none" ||
    v === "nenhuma" ||
    v === "sem recorrencia"
  ) {
    return null;
  }

  if (
    v === "diaria" ||
    v === "daily"
  ) {
    return "daily";
  }

  if (
    v === "semanal" ||
    v === "weekly"
  ) {
    return "weekly";
  }

  if (
    v === "quinzenal" ||
    v === "biweekly"
  ) {
    return "biweekly";
  }

  if (
    v === "mensal" ||
    v === "monthly"
  ) {
    return "monthly";
  }

  if (
    v === "trimestral" ||
    v === "quarterly"
  ) {
    return "quarterly";
  }

  if (
    v === "semestral" ||
    v === "semiannual"
  ) {
    return "semiannual";
  }

  if (
    v === "anual" ||
    v === "annual"
  ) {
    return "annual";
  }

  return null;
}

function parseTaskType(
  raw: string
): "normal" | "on_demand" {

  const v =
    raw
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_");

  if (
    v === "on_demand" ||
    v === "ondemand" ||
    v === "sob_demanda" ||
    v === "sobdemanda"
  ) {
    return "on_demand";
  }

  return "normal";
}

function parseBoolean(
  raw: string
): boolean {

  const v =
    raw
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  return [
    "sim",
    "s",
    "yes",
    "y",
    "true",
    "1",
    "privada",
    "privado",
    "private",
  ].includes(v);
}

function parseReminderMode(
  raw: string
): "until" | "from" {

  const v =
    raw
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  if (
    [
      "a partir",
      "a_partir",
      "apartir",
      "from",
    ].includes(v)
  ) {
    return "from";
  }

  return "until";
}

function parseSlackIdsList(
  raw: string
): string[] {

  if (!raw?.trim()) {
    return [];
  }

  return Array.from(
    new Set(
      raw
        .split(",")
        .map(
          (x) =>
            parseSlackUserId(x) ?? ""
        )
        .filter(Boolean)
    )
  );
}

function parseEmailsList(
  raw: string
): string[] {

  if (!raw?.trim()) {
    return [];
  }

  return Array.from(
    new Set(
      raw
        .split(",")
        .map(
          (x) =>
            parseEmail(x) ?? ""
        )
        .filter(Boolean)
    )
  );
}

async function downloadSlackFileToBuffer(
  file: SlackFile
): Promise<Buffer> {

  const token =
    mustEnv("SLACK_BOT_TOKEN");

  const url =
    file.url_private_download ||
    file.url_private;

  if (!url) {
    throw new Error(
      "Slack file missing url_private_download/url_private"
    );
  }

  const res = await fetch(
    url,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {

    throw new Error(
      `Failed to download slack file: ${res.status} ${res.statusText}`
    );

  }

  const ab =
    await res.arrayBuffer();

  return Buffer.from(
    new Uint8Array(ab)
  );
}

export async function importTasksFromExcelSlackFile(
  args: {
    slack: WebClient;
    uploadedBySlackId: string;
    channelId: string;
    threadTs: string;
    file: SlackFile;
  }
) {

  const {
    slack,
    uploadedBySlackId,
    channelId,
    threadTs,
    file,
  } = args;

  await slack.chat.postMessage({
    channel: channelId,
    thread_ts: threadTs,
    text:
      `📥 Recebi o arquivo *${file.name ?? "tasks.xlsx"}*. Vou processar agora…`,
  });

  const buf =
    await downloadSlackFileToBuffer(
      file
    );

  const wb =
    new ExcelJS.Workbook();

  await wb.xlsx.load(buf);

  const ws =
    wb.worksheets[0];

  if (!ws) {

    await slack.chat.postMessage({
      channel: channelId,
      thread_ts: threadTs,
      text:
        "⛔ Não encontrei nenhuma aba no arquivo.",
    });

    return;
  }

  type Cols = {
    title?: number;
    description?: number;

    responsibleEmail?: number;
    responsibleSlackId?: number;

    delegationSlackId?: number;

    term?: number;
    deadlineTime?: number;

    urgency?: number;
    recurrence?: number;
    reminderMode?: number;

    taskType?: number;
    calendarPrivate?: number;

    turboPreviousDay?: number;
    turboStartTime?: number;

    processName?: number;
    processId?: number;

    ccEmails?: number;
    ccSlackIds?: number;
  };

  const cols: Cols = {};

  const headerRow =
    ws.getRow(1);

  headerRow.eachCell(
    (cell, colNumber) => {

      const h =
        normalizeHeader(
          cellToString(cell.value)
        );

      if (!h) {
        return;
      }

      if (
        ["titulo", "title"].includes(h)
      ) {
        cols.title = colNumber;
      }

      if (
        ["descricao", "description"].includes(h)
      ) {
        cols.description = colNumber;
      }

      if (
        [
          "e_mail_do_responsavel",
          "email_do_responsavel",
          "responsible_email",
        ].includes(h)
      ) {
        cols.responsibleEmail =
          colNumber;
      }

      if (
        [
          "id_slack_do_responsavel",
          "responsible_slack_id",
          "responsavel_slack_id",
        ].includes(h)
      ) {
        cols.responsibleSlackId =
          colNumber;
      }

      if (
        [
          "id_slack_de_quem_delegou",
          "id_slack_do_delegador",
          "id_slack_delegador",
          "delegation_slack_id",
          "delegator_slack_id",
        ].includes(h)
      ) {
        cols.delegationSlackId =
          colNumber;
      }

      if (
        [
          "prazo",
          "due_date",
          "due",
        ].includes(h)
      ) {
        cols.term = colNumber;
      }

      if (
        [
          "horario",
          "hora",
          "due_time",
          "time",
        ].includes(h)
      ) {
        cols.deadlineTime =
          colNumber;
      }

      if (
        [
          "urgencia",
          "urgency",
        ].includes(h)
      ) {
        cols.urgency =
          colNumber;
      }

      if (
        [
          "recorrencia",
          "recurrence",
        ].includes(h)
      ) {
        cols.recurrence =
          colNumber;
      }

      if (
        [
          "tipo_de_prazo",
          "tipo_prazo",
          "reminder_mode",
          "remindermode",
        ].includes(h)
      ) {
        cols.reminderMode =
          colNumber;
      }

      if (
        [
          "tipo_da_tarefa",
          "tipo_tarefa",
          "task_type",
          "tasktype",
        ].includes(h)
      ) {
        cols.taskType =
          colNumber;
      }

      if (
        [
          "atividade_privada",
          "tarefa_privada",
          "privacidade",
          "calendar_private",
          "calendarprivate",
        ].includes(h)
      ) {
        cols.calendarPrivate =
          colNumber;
      }

      if (
        [
          "turbo_dia_anterior",
          "fup_dia_anterior",
          "turbo_previous_day",
        ].includes(h)
      ) {
        cols.turboPreviousDay =
          colNumber;
      }

      if (
        [
          "horario_inicio_turbo",
          "inicio_turbo",
          "turbo_start_time",
        ].includes(h)
      ) {
        cols.turboStartTime =
          colNumber;
      }

      if (
        [
          "nome_do_processo",
          "processo",
          "process_name",
        ].includes(h)
      ) {
        cols.processName =
          colNumber;
      }

      if (
        [
          "id_processo",
          "process_id",
        ].includes(h)
      ) {
        cols.processId =
          colNumber;
      }

      if (
        [
          "e_mail_das_copias",
          "email_das_copias",
          "cc_emails",
        ].includes(h)
      ) {
        cols.ccEmails =
          colNumber;
      }

      if (
        [
          "id_slack_das_copias",
          "cc_slack_ids",
        ].includes(h)
      ) {
        cols.ccSlackIds =
          colNumber;
      }

    }
  );

  // Headers mínimos:
  // título + alguma forma de identificar o responsável.
  //
  // Prazo não é obrigatório no cabeçalho porque
  // tarefas "sob demanda" não possuem prazo.
  //
  // Urgência também pode ser omitida:
  // nesse caso usamos Light.
  if (
    !cols.title ||
    (
      !cols.responsibleEmail &&
      !cols.responsibleSlackId
    )
  ) {

    await slack.chat.postMessage({
      channel: channelId,
      thread_ts: threadTs,
      text:
        "⛔ Headers inválidos.\n" +
        "O arquivo precisa ter obrigatoriamente (linha 1):\n" +
        "• *Título*\n" +
        "• *E-mail do responsável* **OU** *ID Slack do responsável*\n\n" +
        "Campos opcionais:\n" +
        "Descrição, ID Slack de quem delegou, Tipo da tarefa, Prazo, Horário, " +
        "Urgência, Recorrência, Tipo de prazo, Nome do Processo, ID Processo, " +
        "Privacidade, Turbo dia anterior, Horário início Turbo, " +
        "E-mail das cópias e ID Slack das cópias.",
    });

    return;
  }

  const created: string[] = [];

  const failed:
    Array<{
      row: number;
      reason: string;
    }> = [];

  for (
    let r = 2;
    r <= ws.rowCount;
    r++
  ) {

    const row =
      ws.getRow(r);

    const title =
      cellToString(
        row.getCell(
          cols.title
        ).value
      );

    if (!title) {
      continue;
    }

    // -------------------------
    // Responsável
    // -------------------------

    const responsibleEmailRaw =
      cols.responsibleEmail
        ? cellToString(
          row.getCell(
            cols.responsibleEmail
          ).value
        )
        : "";

    const responsibleSlackIdRaw =
      cols.responsibleSlackId
        ? cellToString(
          row.getCell(
            cols.responsibleSlackId
          ).value
        )
        : "";

    const responsibleEmail =
      responsibleEmailRaw
        ? parseEmail(
          responsibleEmailRaw
        )
        : null;

    let responsibleSlackId =
      responsibleSlackIdRaw
        ? parseSlackUserId(
          responsibleSlackIdRaw
        )
        : null;

    if (
      !responsibleEmail &&
      !responsibleSlackId
    ) {

      failed.push({
        row: r,
        reason:
          `Informe um responsável válido por E-mail ou ID Slack ` +
          `(email="${responsibleEmailRaw || ""}", slackId="${responsibleSlackIdRaw || ""}")`,
      });

      continue;
    }

    if (
      !responsibleSlackId &&
      responsibleEmail
    ) {

      responsibleSlackId =
        await slackUserIdFromEmail(
          slack,
          responsibleEmail
        );

    }

    if (!responsibleSlackId) {

      failed.push({
        row: r,
        reason:
          responsibleEmail
            ? `Não consegui achar o Slack ID do responsável pelo e-mail: "${responsibleEmail}"`
            : `ID Slack do responsável inválido: "${responsibleSlackIdRaw}"`,
      });

      continue;
    }

    // -------------------------
    // Delegador
    // -------------------------

    let delegationSlackId =
      uploadedBySlackId;

    if (cols.delegationSlackId) {

      const delegationRaw =
        cellToString(
          row.getCell(
            cols.delegationSlackId
          ).value
        );

      if (delegationRaw) {

        const parsedDelegation =
          parseSlackUserId(
            delegationRaw
          );

        if (!parsedDelegation) {

          failed.push({
            row: r,
            reason:
              `ID Slack de quem delegou inválido: "${delegationRaw}"`,
          });

          continue;
        }

        delegationSlackId =
          parsedDelegation;
      }
    }

    // -------------------------
    // Tipo da tarefa
    // -------------------------

    const taskTypeRaw =
      cols.taskType
        ? cellToString(
          row.getCell(
            cols.taskType
          ).value
        )
        : "";

    const taskType =
      parseTaskType(
        taskTypeRaw
      );

    const isOnDemand =
      taskType === "on_demand";

    // -------------------------
    // Descrição
    // -------------------------

    const description =
      cols.description
        ? (
          cellToString(
            row.getCell(
              cols.description
            ).value
          ) || null
        )
        : null;

    // -------------------------
    // Prazo
    // -------------------------

    let term: Date | null =
      null;

    if (cols.term) {

      const rawTerm =
        row.getCell(
          cols.term
        ).value;

      if (rawTerm) {

        term =
          parseDateToTermDate(
            rawTerm
          );

        if (
          !term &&
          !isOnDemand
        ) {

          failed.push({
            row: r,
            reason:
              `Prazo inválido: "${cellToString(rawTerm)}"`,
          });

          continue;
        }
      }
    }

    if (
      !isOnDemand &&
      !term
    ) {

      failed.push({
        row: r,
        reason:
          "Tarefa normal precisa ter prazo.",
      });

      continue;
    }

    if (
      !isOnDemand &&
      term
    ) {

      const todayIsoImport =
        new Intl.DateTimeFormat(
          "en-CA",
          {
            timeZone:
              "America/Sao_Paulo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }
        ).format(
          new Date()
        );

      const termIso =
        term
          .toISOString()
          .slice(0, 10);

      if (
        termIso <
        todayIsoImport
      ) {

        failed.push({
          row: r,
          reason:
            `Prazo não pode ser uma data passada: "${termIso}"`,
        });

        continue;
      }
    }

    // -------------------------
    // Horário
    // -------------------------

    const deadlineTime =
      cols.deadlineTime
        ? parseTime(
          row.getCell(
            cols.deadlineTime
          ).value
        )
        : null;

    // -------------------------
    // Urgência
    // -------------------------

    const urgencyRaw =
      cols.urgency
        ? cellToString(
          row.getCell(
            cols.urgency
          ).value
        )
        : "";

    const urgency =
      parseUrgency(
        urgencyRaw
      );

    // -------------------------
    // Recorrência
    // -------------------------

    const recurrence =
      cols.recurrence
        ? parseRecurrence(
          cellToString(
            row.getCell(
              cols.recurrence
            ).value
          )
        )
        : null;

    // -------------------------
    // Reminder mode
    // -------------------------

    const reminderMode =
      cols.reminderMode
        ? parseReminderMode(
          cellToString(
            row.getCell(
              cols.reminderMode
            ).value
          )
        )
        : "until";

    // -------------------------
    // Privacidade
    // -------------------------

    const calendarPrivate =
      cols.calendarPrivate
        ? parseBoolean(
          cellToString(
            row.getCell(
              cols.calendarPrivate
            ).value
          )
        )
        : false;

    // -------------------------
    // Turbo avançado
    // -------------------------

    const turboPreviousDay =
      cols.turboPreviousDay
        ? parseBoolean(
          cellToString(
            row.getCell(
              cols.turboPreviousDay
            ).value
          )
        )
        : false;

    const turboStartTime =
      cols.turboStartTime
        ? parseTime(
          row.getCell(
            cols.turboStartTime
          ).value
        )
        : null;

    // -------------------------
    // CCs
    // -------------------------

    const ccSlackIds =
      cols.ccSlackIds
        ? parseSlackIdsList(
          cellToString(
            row.getCell(
              cols.ccSlackIds
            ).value
          )
        )
        : [];

    const ccEmails =
      cols.ccEmails
        ? parseEmailsList(
          cellToString(
            row.getCell(
              cols.ccEmails
            ).value
          )
        )
        : [];

    const ccFromEmails =
      await Promise.all(
        ccEmails.map(
          (email) =>
            slackUserIdFromEmail(
              slack,
              email
            )
        )
      );

    const carbonCopies =
      Array.from(
        new Set(
          [
            ...ccSlackIds,
            ...ccFromEmails.filter(
              Boolean
            ),
          ].filter(
            (x): x is string =>
              Boolean(x)
          )
        )
      );

    // -------------------------
    // Processo
    // -------------------------

    const processIdRaw =
      cols.processId
        ? cellToString(
          row.getCell(
            cols.processId
          ).value
        )
        : "";

    const processNameRaw =
      cols.processName
        ? cellToString(
          row.getCell(
            cols.processName
          ).value
        )
        : "";

    let selectedProcess:
      {
        id: string;
        notionPageUrl: string;
      }
      | null = null;

    if (processIdRaw) {

      selectedProcess =
        await prisma.process.findFirst({
          where: {
            id: processIdRaw,
            active: true,
          },
          select: {
            id: true,
            notionPageUrl: true,
          },
        });

      if (!selectedProcess) {

        failed.push({
          row: r,
          reason:
            `Processo não encontrado ou inativo para o ID: "${processIdRaw}"`,
        });

        continue;
      }

    } else if (processNameRaw) {

      const matches =
        await prisma.process.findMany({
          where: {
            title: {
              equals:
                processNameRaw,
              mode:
                "insensitive",
            },
            active: true,
          },
          select: {
            id: true,
            notionPageUrl: true,
          },
          take: 2,
        });

      if (
        matches.length === 0
      ) {

        failed.push({
          row: r,
          reason:
            `Processo não encontrado ou inativo: "${processNameRaw}"`,
        });

        continue;
      }

      if (
        matches.length > 1
      ) {

        failed.push({
          row: r,
          reason:
            `Existe mais de um processo ativo com o nome "${processNameRaw}". Use o ID Processo para identificar exatamente.`,
        });

        continue;
      }

      selectedProcess =
        matches[0];
    }

    try {

      const task =
        await createTaskService({
          title,

          description:
            description?.trim()
              ? description
              : undefined,

          delegation:
            delegationSlackId,

          responsible:
            responsibleSlackId,

          processId:
            selectedProcess?.id ??
            null,

          notionProcessUrl:
            selectedProcess?.notionPageUrl ??
            null,

          term:
            isOnDemand
              ? null
              : term,

          deadlineTime:
            isOnDemand
              ? null
              : deadlineTime,

          recurrence:
            isOnDemand
              ? null
              : recurrence,

          urgency:
            isOnDemand
              ? "light"
              : urgency,

          reminderMode:
            isOnDemand
              ? "until"
              : reminderMode,

          turboPreviousDay:
            isOnDemand
              ? false
              : turboPreviousDay,

          turboStartTime:
            isOnDemand
              ? null
              : turboStartTime,

          taskType,

          calendarPrivate,

          carbonCopies,

          dependsOnId: null,
        });

      // Atualiza/garante emails dos participantes.
      // O Calendar em si já é sincronizado pelo createTaskService.
      try {

        await syncTaskParticipantEmails({
          slack,
          taskId:
            task.id,
          delegationSlackId,
          responsibleSlackId:
            task.responsible,
          carbonCopiesSlackIds:
            task.carbonCopies.map(
              (c) =>
                c.slackUserId
            ),
        });

      } catch { }

      await notifyTaskCreated({
        slack,

        taskId:
          task.id,

        createdBy:
          delegationSlackId,

        taskTitle:
          task.title,

        responsible:
          task.responsible,

        carbonCopies:
          task.carbonCopies.map(
            (c) =>
              c.slackUserId
          ),

        term:
          task.term,

        deadlineTime:
          task.deadlineTime ??
          null,
      });

      created.push(
        task.id
      );

    } catch (e: any) {

      failed.push({
        row: r,
        reason:
          e?.message ??
          "erro ao criar",
      });

    }
  }

  const okMsg =
    created.length
      ? `✅ Criei *${created.length}* tarefa(s).`
      : "⚠️ Não criei nenhuma tarefa.";

  const failMsg =
    failed.length
      ? (
        `\n\n⛔ Falhas (${failed.length}):\n` +
        failed
          .slice(0, 10)
          .map(
            (f) =>
              `• Linha ${f.row}: ${f.reason}`
          )
          .join("\n") +
        (
          failed.length > 10
            ? `\n… +${failed.length - 10} outras`
            : ""
        )
      )
      : "";

  await slack.chat.postMessage({
    channel:
      channelId,
    thread_ts:
      threadTs,
    text:
      okMsg +
      failMsg,
  });
}