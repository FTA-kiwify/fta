// src/views/homeTasksBlocks.ts
import type { KnownBlock } from "@slack/web-api";

export type Urgency = "light" | "asap" | "turbo";

export type HomeTaskItem = {
  id: string;
  title: string;
  description?: string | null;
  delegation?: string | null;
  delegationName?: string | null;
  term?: Date | string | null;
  urgency: Urgency;
};

export type DelegatedTaskItem = {
  id: string;
  title: string;
  description?: string | null;
  term?: Date | string | null;
  urgency: Urgency;
  responsible: string;
  responsibleName?: string | null;
};

export type CcTaskItem = {
  id: string;
  title: string;
  description?: string | null;
  term?: Date | string | null;
  urgency: Urgency;
  responsible: string;
  responsibleName?: string | null;
  delegation?: string | null;
  delegationName?: string | null;
};

export type RecurrenceItem = {
  id: string;
  title: string;
  recurrence: string;
};



// =========================
// ✅ Feedback (Home)
// =========================
export type FeedbackHomeItem = {
  id: string;
  type: "bug" | "suggestion";
  title: string;
  status: "pending" | "wip" | "done" | "rejected";
  updatedAt?: Date | string | null;
};

export const TASK_SELECT_ACTION_ID = "task_select" as const;

export const TASKS_CONCLUDE_SELECTED_ACTION_ID = "tasks_conclude_selected" as const;
export const TASKS_SEND_QUESTION_ACTION_ID = "tasks_send_question" as const;
export const TASKS_RESCHEDULE_ACTION_ID = "tasks_reschedule" as const;
export const TASKS_VIEW_DETAILS_ACTION_ID = "tasks_view_details" as const;
export const TASKS_REFRESH_ACTION_ID = "tasks_refresh" as const;

// ✅ pager buttons
export const HOME_PAGER_PREV_ACTION_ID = "home_pager_prev" as const;
export const HOME_PAGER_NEXT_ACTION_ID = "home_pager_next" as const;

export const HOME_MYTASKS_FILTER_ACTION_ID = "home_mytasks_filter" as const;
export const HOME_DELEGATED_FILTER_ACTION_ID = "home_delegated_filter" as const;
export const HOME_DELEGATED_CC_FILTER_ACTION_ID = "home_delegated_cc_filter" as const;
export const HOME_CC_FILTER_ACTION_ID = "home_cc_filter" as const;
export const HOME_MYTASKS_CC_FILTER_ACTION_ID = "home_mytasks_cc_filter" as const;

// placeholders
export const DELEGATED_SEND_FUP_ACTION_ID = "delegated_send_fup" as const;
export const DELEGATED_EDIT_ACTION_ID = "delegated_edit" as const;
export const DELEGATED_CANCEL_ACTION_ID = "delegated_cancel" as const;

export const CC_SEND_QUESTION_ACTION_ID = "cc_send_question" as const;

export const RECURRENCE_CANCEL_ACTION_ID = "recurrence_cancel" as const;
export const HOME_FEEDBACK_OPEN_ACTION_ID = "home_feedback_open" as const;
export const HOME_FEEDBACK_ADMIN_ACTION_ID = "home_feedback_admin" as const;



export type PagerInfo = {
  scope:
  | "my_today"
  | "my_tomorrow"
  | "my_future"
  | "delegated_today"
  | "delegated_tomorrow"
  | "delegated_future"
  | "cc_today"
  | "cc_tomorrow"
  | "cc_future";

  page: number;
  pageSize: number;
  total: number;
};

// =======================================
// ⚠️ Slack limits (para não dar invalid_arguments)
// - option.text: ~75 chars
// - option.description: ~75 chars
// =======================================
const OPTION_TEXT_MAX = 150;
const OPTION_DESC_MAX = 75;

// “pagina” de opções dentro de um único bloco de checkboxes (igual seu AppScript)
const CHECKBOX_PAGE_SIZE = 10;

function urgencyEmoji(u: Urgency) {
  if (u === "light") return "🟢";
  if (u === "asap") return "🟡";
  return "🔴";
}

function formatDateBR(d?: Date | string | null) {
  if (!d) return null;
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return null;

  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(dt);
}

function atName(nameOrNull?: string | null, fallbackId?: string | null) {
  const n = (nameOrNull ?? "").trim();
  if (n) return `@${n}`;
  const fb = (fallbackId ?? "").trim();
  return fb ? `@${fb}` : "";
}

function escapeMrkdwn(s: string) {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function truncate(s: string, max = 70) {
  const t = (s ?? "").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1) + "…";
}

function feedbackTypeEmoji(t: FeedbackHomeItem["type"]) {
  return t === "bug" ? "🐞" : "💡";
}
function feedbackStatusEmoji(s: FeedbackHomeItem["status"]) {
  if (s === "pending") return "🟠";
  if (s === "wip") return "🟡";
  if (s === "done") return "🟢";
  return "🔴";
}
function feedbackStatusLabel(s: FeedbackHomeItem["status"]) {
  if (s === "pending") return "Pendente";
  if (s === "wip") return "WIP";
  if (s === "done") return "Concluído";
  return "Rejeitado";
}

// =========================
// ✅ Pager (Futuras)
// =========================
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function renderPager(p?: PagerInfo | null): KnownBlock[] {
  if (!p) return [];

  const pageSize = Math.max(1, Number(p.pageSize ?? 10));
  const total = Math.max(0, Number(p.total ?? 0));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1) return [];

  const page = clamp(Number(p.page ?? 0) || 0, 0, totalPages - 1);

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  const labelScope =
    p.scope === "my_today"
      ? "Suas tarefas - Hoje"
      : p.scope === "my_tomorrow"
        ? "Suas tarefas - Amanhã"
        : p.scope === "my_future"
          ? "Suas tarefas - Futuras"
          : p.scope === "delegated_today"
            ? "Suas demandas - Hoje"
            : p.scope === "delegated_tomorrow"
              ? "Suas demandas - Amanhã"
              : p.scope === "delegated_future"
                ? "Suas demandas - Futuras"
                : p.scope === "cc_today"
                  ? "Acompanhando - Hoje"
                  : p.scope === "cc_tomorrow"
                    ? "Acompanhando - Amanhã"
                    : "Acompanhando - Futuras";

  const actions: any[] = [];

  if (canPrev) {
    actions.push({
      type: "button",
      text: { type: "plain_text", text: "⬅️ Anteriores" },
      action_id: HOME_PAGER_PREV_ACTION_ID,
      value: JSON.stringify({ scope: p.scope, page: page - 1 }),
    });
  }

  if (canNext) {
    actions.push({
      type: "button",
      text: { type: "plain_text", text: "➡️ Próximas" },
      action_id: HOME_PAGER_NEXT_ACTION_ID,
      value: JSON.stringify({ scope: p.scope, page: page + 1 }),
    });
  }

  const blocks: KnownBlock[] = [
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `_${labelScope}: página *${page + 1}* delegado por *${totalPages}* (total ${total})_`,
        },
      ],
    } as KnownBlock,
  ];

  if (actions.length) {
    blocks.push({
      type: "actions",
      block_id: `pager_${p.scope}_future_${page}`, // ✅ evita action_id duplicado no mesmo block
      elements: actions as any,
    } as KnownBlock);
  }

  return blocks;
}

// =========================
// ✅ Compact checkbox blocks (igual AppScript)
// - 1 bloco “section” com accessory checkboxes contendo até 10 opções
// - description da task vai em option.description (fica coladinho)
// =========================
function cleanOneLine(s?: string | null) {
  return String(s ?? "").replace(/\s+/g, " ").replace(/\n+/g, " ").trim();
}

function hardCut(s: string, max: number) {
  const t = cleanOneLine(s);
  if (!t) return "";
  return t.length <= max ? t : t.slice(0, max); // ✅ sem "…"
}

function makeOption(value: string, line: string, desc?: string | null) {
  const text = hardCut(line, OPTION_TEXT_MAX);
  const d = cleanOneLine(desc ?? "");
  const opt: any = {
    text: { type: "plain_text", text },
    value,
  };
  if (d) {
    opt.description = { type: "plain_text", text: hardCut(d, OPTION_DESC_MAX) };
  }
  return opt;
}

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function groupWithCheckboxes(args: {
  title: string;
  blockIdPrefix: string;
  options: any[];
}): KnownBlock[] {
  const { title, blockIdPrefix, options } = args;

  if (!options.length) {
    return [
      {
        type: "section",
        text: { type: "mrkdwn", text: `*${title}:* _Nenhuma_` },
      } as KnownBlock,
    ];
  }

  const pages = chunk(options, CHECKBOX_PAGE_SIZE);

  return pages.map((slice, idx) => {
    const showTitle = idx === 0;
    return {
      type: "section",
      block_id: `${blockIdPrefix}_${idx + 1}`,
      text: { type: "mrkdwn", text: showTitle ? `*${title}:*` : " " },
      accessory: {
        type: "checkboxes",
        action_id: TASK_SELECT_ACTION_ID,
        options: slice,
      },
    } as any as KnownBlock;
  });
}

// =========================
// ✅ Linhas (mais compactas para caber no Slack)
// =========================
function myLine(t: HomeTaskItem) {
  const due = formatDateBR(t.term ?? null);
  const dueText = due ? ` (vence ${due})` : "";

  const delegatedBy = t.delegationName
    ? ` — delegado por ${atName(t.delegationName, t.delegation ?? null)}`
    : t.delegation
      ? ` — delegado por ${atName(null, t.delegation)}`
      : "";

  return `${urgencyEmoji(t.urgency)} ${t.title}${dueText}${delegatedBy}`;
}

function delegatedLine(t: DelegatedTaskItem) {
  const due = formatDateBR(t.term ?? null);
  const dueText = due ? ` (vence ${due})` : "";

  const resp = atName(t.responsibleName ?? null, t.responsible);
  return `${urgencyEmoji(t.urgency)} ${t.title}${dueText} — Responsável: ${resp}`;
}

function ccLineOnlyResponsible(t: CcTaskItem) {
  const due = formatDateBR(t.term ?? null);
  const dueText = due ? ` (vence ${due})` : "";

  const resp = atName(t.responsibleName ?? null, t.responsible);
  return `${urgencyEmoji(t.urgency)} ${t.title}${dueText} — Responsável: ${resp}`;
}

function renderMyOptions(items: HomeTaskItem[]) {
  return (items ?? []).map((t) => makeOption(t.id, myLine(t), t.description ?? null));
}
function renderDelegatedOptions(items: DelegatedTaskItem[]) {
  return (items ?? []).map((t) => makeOption(t.id, delegatedLine(t), t.description ?? null));
}
function renderCcOptions(items: CcTaskItem[]) {
  return (items ?? []).map((t) => makeOption(t.id, ccLineOnlyResponsible(t), t.description ?? null));
}

function renderMyOpenFeedback(items: FeedbackHomeItem[]): KnownBlock[] {
  const MAX = 6;
  const visible = (items ?? []).slice(0, MAX);

  if (!visible.length) {
    return [
      {
        type: "section",
        text: { type: "mrkdwn", text: "_Você não tem tickets abertos._" },
      } as KnownBlock,
    ];
  }

  const lines = visible.map((f) => {
    const title = escapeMrkdwn(truncate(f.title, 60));
    return `• ${feedbackTypeEmoji(f.type)} *${title}* — ${feedbackStatusEmoji(f.status)} ${feedbackStatusLabel(f.status)}`;
  });

  const suffix = (items?.length ?? 0) > MAX ? `\n_… e mais ${(items.length - MAX)}_` : "";

  return [
    {
      type: "section",
      text: { type: "mrkdwn", text: lines.join("\n") + suffix },
    } as KnownBlock,
  ];
}

export function homeTasksBlocks(args: {
  // você é responsável
  tasksOverdue: HomeTaskItem[]; // mantido por compatibilidade
  tasksToday: HomeTaskItem[];
  tasksTomorrow: HomeTaskItem[];
  tasksFuture: HomeTaskItem[];
  onDemandTasks: HomeTaskItem[];
  myDelegatorFilter?: string | null;

  myDelegatorOptions?: Array<{
    slackId: string;
    name: string;
  }>;

  myCcFilter?: string | null;

  myCcOptions?: Array<{
    slackId: string;
    name: string;
  }>;

  // você delegou
  delegatedToday: DelegatedTaskItem[];
  delegatedTomorrow: DelegatedTaskItem[];
  delegatedFuture: DelegatedTaskItem[];

  delegatedResponsibleFilter?: string | null;

  delegatedResponsibleOptions?: Array<{
    slackId: string;
    name: string;
  }>;

  delegatedCcFilter?: string | null;

  delegatedCcOptions?: Array<{
    slackId: string;
    name: string;
  }>;

  // você está em cópia
  ccToday: CcTaskItem[];
  ccTomorrow: CcTaskItem[];
  ccFuture: CcTaskItem[];
  ccResponsibleFilter?: string | null;

  // recorrências
  recurrences: RecurrenceItem[];


  // feedback
  myOpenFeedback?: FeedbackHomeItem[];


  // pager (somente Futuras)

  myTodayPager?: PagerInfo | null;
  myTomorrowPager?: PagerInfo | null;
  myFuturePager?: PagerInfo | null;

  delegatedTodayPager?: PagerInfo | null;
  delegatedTomorrowPager?: PagerInfo | null;
  delegatedFuturePager?: PagerInfo | null;

  ccTodayPager?: PagerInfo | null;
  ccTomorrowPager?: PagerInfo | null;
  ccFuturePager?: PagerInfo | null;
}): KnownBlock[] {
  const blocks: KnownBlock[] = [];

  const pushDivider = () => blocks.push({ type: "divider" } as KnownBlock);
  const pushHeader = (text: string) => blocks.push({ type: "header", text: { type: "plain_text", text } } as KnownBlock);

  // =========================
  // SUAS TAREFAS (RESPONSÁVEL)
  // =========================
  pushHeader("📌 Suas tarefas (você é responsável)");

  blocks.push({
    type: "actions",
    elements: [
      {
        type: "users_select",
        action_id: HOME_MYTASKS_FILTER_ACTION_ID,
        placeholder: {
          type: "plain_text",
          text: "👤 Delegado por",
        },
        ...(args.myDelegatorFilter
          ? { initial_user: args.myDelegatorFilter }
          : {}),
      },
      {
        type: "users_select",
        action_id: HOME_MYTASKS_CC_FILTER_ACTION_ID,
        placeholder: {
          type: "plain_text",
          text: "👥 Em cópia",
        },
        ...(args.myCcFilter
          ? { initial_user: args.myCcFilter }
          : {}),
      },
    ],
  } as any);

  blocks.push(
    ...groupWithCheckboxes({ title: "Hoje", blockIdPrefix: "my_today", options: renderMyOptions(args.tasksToday) })
  );
  blocks.push(...renderPager(args.myTodayPager));
  pushDivider();

  blocks.push(
    ...groupWithCheckboxes({ title: "Amanhã", blockIdPrefix: "my_tomorrow", options: renderMyOptions(args.tasksTomorrow) })
  );
  blocks.push(...renderPager(args.myTomorrowPager));
  pushDivider();

  blocks.push(
    ...groupWithCheckboxes({
      title: "Futuras",
      blockIdPrefix: "my_future",
      options: renderMyOptions(args.tasksFuture),
    })
  );

  blocks.push(...renderPager(args.myFuturePager));

  pushDivider();

  blocks.push(
    ...groupWithCheckboxes({
      title: "⚡ Sob demanda",
      blockIdPrefix: "my_on_demand",
      options: renderMyOptions(args.onDemandTasks),
    })
  );


  pushDivider();

  // =========================
  // SUAS DEMANDAS (DELEGOU)
  // =========================
  pushHeader("📌 Suas demandas (você delegou)");

  blocks.push({
    type: "actions",
    elements: [
      {
        type: "users_select",
        action_id: HOME_DELEGATED_FILTER_ACTION_ID,
        placeholder: {
          type: "plain_text",
          text: "👤 Responsável",
        },
        ...(args.delegatedResponsibleFilter
          ? { initial_user: args.delegatedResponsibleFilter }
          : {}),
      },
      {
        type: "users_select",
        action_id: HOME_DELEGATED_CC_FILTER_ACTION_ID,
        placeholder: {
          type: "plain_text",
          text: "👥 Em cópia",
        },
        ...(args.delegatedCcFilter
          ? { initial_user: args.delegatedCcFilter }
          : {}),
      },
    ],
  } as any);

  blocks.push(
    ...groupWithCheckboxes({ title: "Hoje", blockIdPrefix: "del_today", options: renderDelegatedOptions(args.delegatedToday) })
  );
  blocks.push(...renderPager(args.delegatedTodayPager));
  pushDivider();

  blocks.push(
    ...groupWithCheckboxes({ title: "Amanhã", blockIdPrefix: "del_tomorrow", options: renderDelegatedOptions(args.delegatedTomorrow) })
  );
  blocks.push(...renderPager(args.delegatedTomorrowPager));
  pushDivider();

  blocks.push(
    ...groupWithCheckboxes({ title: "Futuras", blockIdPrefix: "del_future", options: renderDelegatedOptions(args.delegatedFuture) })
  );
  blocks.push(...renderPager(args.delegatedFuturePager));


  pushDivider();

  // =========================
  // EM CÓPIA
  // =========================
  pushHeader("📌 Acompanhando (você está em cópia)");

  blocks.push({
    type: "actions",
    elements: [
      {
        type: "users_select",
        action_id: HOME_CC_FILTER_ACTION_ID,
        placeholder: {
          type: "plain_text",
          text: "👤 Responsável",
        },
        ...(args.ccResponsibleFilter
          ? { initial_user: args.ccResponsibleFilter }
          : {}),
      },
    ],
  } as any);

  blocks.push(
    ...groupWithCheckboxes({ title: "Hoje", blockIdPrefix: "cc_today", options: renderCcOptions(args.ccToday) })
  );
  blocks.push(...renderPager(args.ccTodayPager));
  pushDivider();

  blocks.push(
    ...groupWithCheckboxes({ title: "Amanhã", blockIdPrefix: "cc_tomorrow", options: renderCcOptions(args.ccTomorrow) })
  );
  blocks.push(...renderPager(args.ccTomorrowPager));
  pushDivider();

  blocks.push(
    ...groupWithCheckboxes({ title: "Futuras", blockIdPrefix: "cc_future", options: renderCcOptions(args.ccFuture) })
  );
  blocks.push(...renderPager(args.ccFuturePager));

  pushHeader("⚙️ Ações da(s) tarefa(s) selecionada(s)");

  blocks.push({
    type: "section",
    text: {
      type: "mrkdwn",
      text:
        "_Selecione uma ou mais tarefas acima. Algumas ações dependem da sua relação com a tarefa._",
    },
  } as KnownBlock);

  blocks.push({
    type: "actions",
    block_id: "global_task_actions",
    elements: [
      {
        type: "button",
        text: { type: "plain_text", text: "🔎 Ver detalhes" },
        action_id: TASKS_VIEW_DETAILS_ACTION_ID,
        value: "details",
      },
      {
        type: "button",
        text: { type: "plain_text", text: "🧵 Abrir thread" },
        action_id: TASKS_SEND_QUESTION_ACTION_ID,
        value: "send_question",
      },
      {
        type: "button",
        text: { type: "plain_text", text: "📅 Reprogramar" },
        action_id: TASKS_RESCHEDULE_ACTION_ID,
        value: "reschedule",
      },
      {
        type: "button",
        text: { type: "plain_text", text: "✏️ Editar" },
        action_id: DELEGATED_EDIT_ACTION_ID,
        value: "edit",
      },
      {
        type: "button",
        text: { type: "plain_text", text: "❌ Cancelar" },
        action_id: DELEGATED_CANCEL_ACTION_ID,
        value: "cancel",
      },
      {
        type: "button",
        text: { type: "plain_text", text: "✅ Concluir" },
        action_id: TASKS_CONCLUDE_SELECTED_ACTION_ID,
        value: "conclude_selected",
      },
    ],
  } as KnownBlock);

  pushDivider();

  // =========================
  // RECORRÊNCIAS
  // =========================
  pushHeader("🔁 Suas recorrências");
  if (args.recurrences.length) {
    blocks.push(
      ...args.recurrences.flatMap((r) => [
        { type: "section", text: { type: "mrkdwn", text: `• ${r.title} — \`${r.recurrence}\`` } } as KnownBlock,
      ])
    );
  } else {
    blocks.push({ type: "section", text: { type: "mrkdwn", text: "_Nenhuma_" } } as KnownBlock);
  }
  pushDivider();



  // =========================
  // BUGS / SUGESTÕES
  // =========================
  pushHeader("💡 Bugs e sugestões");
  blocks.push({ type: "section", text: { type: "mrkdwn", text: "*Seus tickets abertos:*" } } as KnownBlock);
  blocks.push(...renderMyOpenFeedback(args.myOpenFeedback ?? []));

  blocks.push({
    type: "actions",
    block_id: "feedback_actions",
    elements: [
      { type: "button", text: { type: "plain_text", text: "🐞 Enviar bug/sugestão" }, action_id: HOME_FEEDBACK_OPEN_ACTION_ID, value: "open_feedback" },
      { type: "button", text: { type: "plain_text", text: "📋 Ver bugs/sugestões" }, action_id: HOME_FEEDBACK_ADMIN_ACTION_ID, value: "view_feedback" },
    ] as any,
  } as KnownBlock);

  pushDivider();

  // padding pequeno
  blocks.push({
    type: "context",
    block_id: "bottom_pad_0",
    elements: [{ type: "mrkdwn", text: " " }],
  } as KnownBlock);

  return blocks;
}