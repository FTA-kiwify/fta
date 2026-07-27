// src/views/createTaskModal.ts
import type { ModalView, KnownBlock } from "@slack/web-api";

export const CREATE_TASK_MODAL_CALLBACK_ID = "create_task_modal" as const;

// IDs dos novos campos (pra bater com o interactive)
export const TASK_TIME_BLOCK_ID = "time_block" as const;
export const TASK_TIME_ACTION_ID = "deadline_time" as const;

export const TASK_RECURRENCE_BLOCK_ID = "recurrence_block" as const;
export const TASK_RECURRENCE_ACTION_ID = "recurrence" as const;

export const TASK_PROJECT_BLOCK_ID = "project_block" as const;
export const TASK_PROJECT_ACTION_ID = "project" as const;

// ✅ NOVO: depende de (external_select)
export const TASK_DEPENDS_BLOCK_ID = "depends_block" as const;
export const TASK_DEPENDS_ACTION_ID = "depends_on" as const;

export const TASK_NOTION_PROCESS_BLOCK_ID = "notion_process_block" as const;
export const TASK_NOTION_PROCESS_ACTION_ID = "notion_process_action" as const;

export const TASK_REMINDER_MODE_BLOCK_ID = "reminder_mode_block" as const;
export const TASK_REMINDER_MODE_ACTION_ID = "reminder_mode" as const;

export const TASK_CAL_PRIVATE_BLOCK_ID = "task_cal_private_block" as const;
export const TASK_CAL_PRIVATE_ACTION_ID = "task_cal_private_action" as const;

export type ProjectOption = { id: string; name: string };
export const TASK_URGENCY_BLOCK_ID = "urgency_block" as const;
export const TASK_URGENCY_ACTION_ID = "urgency" as const;
export const TASK_TYPE_BLOCK_ID = "task_type_block" as const;
export const TASK_TYPE_ACTION_ID = "task_type" as const;

type CreateTaskModalArgs = {
  projects?: ProjectOption[];
  initialProjectId?: string | null;

  showTurboFields?: boolean;

  initialTitle?: string;
  initialDescription?: string;
  initialResponsible?: string;
  initialDueDate?: string | null;
  initialDeadlineTime?: string | null;
  initialDependsOnOption?: any;
  initialNotionProcessUrl?: string | null;
  initialRecurrence?: string | null;
  initialUrgency?: string | null;
  initialTaskType?: string | null;
  initialReminderMode?: string | null;
  initialCarbonCopies?: string[];
  initialCalendarPrivate?: boolean;
  initialTurboPreviousDay?: boolean;
  initialTurboStartTime?: string | null;
};

export function createTaskModalView(args?: CreateTaskModalArgs): ModalView {
  const projects = args?.projects ?? [];
  const initialProjectId = args?.initialProjectId ?? null;
  const showTurboFields = Boolean(args?.showTurboFields);


  const recurrenceValue = args?.initialRecurrence ?? "none";
  const urgencyValue = args?.initialUrgency ?? "light";
  const taskTypeValue = args?.initialTaskType ?? "normal";
  const isOnDemand = taskTypeValue === "on_demand";

  const reminderModeValue = args?.initialReminderMode ?? "until";
  console.log(
  "[MODAL]",
  {
    showTurboFields,
    taskTypeValue,
    isOnDemand,
  }
);

  const recurrenceOptions = [
    { text: { type: "plain_text" as const, text: "Sem recorrência" }, value: "none" },
    { text: { type: "plain_text" as const, text: "Diária" }, value: "daily" },
    { text: { type: "plain_text" as const, text: "Semanal" }, value: "weekly" },
    { text: { type: "plain_text" as const, text: "Quinzenal" }, value: "biweekly" },
    { text: { type: "plain_text" as const, text: "Mensal" }, value: "monthly" },
    { text: { type: "plain_text" as const, text: "Trimestral" }, value: "quarterly" },
    { text: { type: "plain_text" as const, text: "Semestral" }, value: "semiannual" },
    { text: { type: "plain_text" as const, text: "Anual" }, value: "annual" },
  ];

  const urgencyOptions = [
    { text: { type: "plain_text" as const, text: "🟢 Light" }, value: "light" },
    { text: { type: "plain_text" as const, text: "🟡 ASAP" }, value: "asap" },
    { text: { type: "plain_text" as const, text: "🔴 Turbo" }, value: "turbo" },
  ];

  const taskTypeOptions = [
    {
      text: {
        type: "plain_text" as const,
        text: "📅 Normal",
      },
      value: "normal",
    },
    {
      text: {
        type: "plain_text" as const,
        text: "⚡ Sob demanda",
      },
      value: "on_demand",
    },
  ];

  const reminderModeOptions = [
    { text: { type: "plain_text" as const, text: "⏰ Entregar até o prazo" }, value: "until" },
    { text: { type: "plain_text" as const, text: "▶️ Entregar a partir do prazo" }, value: "from" },
  ];

  const projectOptions = projects.slice(0, 100).map((p) => ({
    text: { type: "plain_text" as const, text: p.name.slice(0, 75) },
    value: p.id,
  }));

  const initialProjectOption = initialProjectId
    ? projectOptions.find((opt) => opt.value === initialProjectId)
    : undefined;

  const projectBlock: KnownBlock =
    projects.length > 0
      ? ({
        type: "input",
        optional: true,
        block_id: TASK_PROJECT_BLOCK_ID,
        label: { type: "plain_text", text: "Projeto" },
        element: {
          type: "static_select",
          action_id: TASK_PROJECT_ACTION_ID,
          placeholder: { type: "plain_text", text: "Selecione um projeto" },
          options: projectOptions,
          ...(initialProjectOption ? { initial_option: initialProjectOption } : {}), // ✅ pré-seleção
        },
      } as const)
      : ({
        type: "section",
        text: { type: "mrkdwn", text: "_Nenhum projeto cadastrado ainda._" },
      } as const);

  return {
    type: "modal",
    callback_id: CREATE_TASK_MODAL_CALLBACK_ID,

    title: { type: "plain_text", text: "Criar tarefa" },
    submit: { type: "plain_text", text: "Criar" },
    close: { type: "plain_text", text: "Cancelar" },

    blocks: [
      {
        type: "input",
        block_id: "title_block",
        label: { type: "plain_text", text: "Título" },
        element: { type: "plain_text_input", action_id: "title" },
      },
      {
        type: "input",
        optional: true,
        block_id: "desc_block",
        label: { type: "plain_text", text: "Descrição" },
        element: {
          type: "plain_text_input",
          action_id: "description",
          multiline: true,
        },
      },
      {
        type: "input",
        optional: true,
        block_id: TASK_NOTION_PROCESS_BLOCK_ID,
        label: {
          type: "plain_text",
          text: "Link do processo (Notion)",
        },
        element: {
          type: "plain_text_input",
          action_id: TASK_NOTION_PROCESS_ACTION_ID,
          ...(args?.initialNotionProcessUrl
            ? { initial_value: args.initialNotionProcessUrl }
            : {}),
        },
      },
      {
        type: "input",
        block_id: "resp_block",
        label: { type: "plain_text", text: "Responsável" },
        element: { type: "users_select", action_id: "responsible" },
      },
      {
        type: "input",
        block_id: TASK_TYPE_BLOCK_ID,
        dispatch_action: true,
        label: {
          type: "plain_text",
          text: "Tipo da tarefa",
        },
        element: {
          type: "static_select",
          action_id: TASK_TYPE_ACTION_ID,
          initial_option:
            taskTypeOptions.find((o) => o.value === taskTypeValue) ??
            taskTypeOptions[0],
          options: taskTypeOptions,
        },
      },
      {
        type: "input",
        block_id: "due_block",
        label: { type: "plain_text", text: "Prazo (data)" },
        element: { type: "datepicker", action_id: "due_date" },
      },
      ...(
        !isOnDemand
          ? ([
            {
              type: "input",
              optional: true,
              block_id: TASK_TIME_BLOCK_ID,
              label: { type: "plain_text", text: "Horário do prazo" },
              element: {
                type: "timepicker",
                action_id: TASK_TIME_ACTION_ID,
                placeholder: {
                  type: "plain_text",
                  text: "Ex: 18:30",
                },
              },
            },
          ] as KnownBlock[])
          : []
      ),

      // ✅ DEPENDE DE
      {
        type: "input",
        optional: true,
        block_id: TASK_DEPENDS_BLOCK_ID,
        label: { type: "plain_text", text: "Depende de" },
        element: {
          type: "external_select",
          action_id: TASK_DEPENDS_ACTION_ID,
          min_query_length: 0,
          placeholder: { type: "plain_text", text: "Selecione a tarefa principal" },
        },
      },

      {
        type: "input",
        optional: true,
        block_id: TASK_RECURRENCE_BLOCK_ID,
        label: { type: "plain_text", text: "Recorrência" },
        element: {
          type: "static_select",
          action_id: TASK_RECURRENCE_ACTION_ID,
          placeholder: { type: "plain_text", text: "Sem recorrência" },
          options: [
            { text: { type: "plain_text", text: "Sem recorrência" }, value: "none" },
            { text: { type: "plain_text", text: "Diária" }, value: "daily" },
            { text: { type: "plain_text", text: "Semanal" }, value: "weekly" },
            { text: { type: "plain_text", text: "Quinzenal" }, value: "biweekly" },
            { text: { type: "plain_text", text: "Mensal" }, value: "monthly" },
            { text: { type: "plain_text", text: "Trimestral" }, value: "quarterly" },
            { text: { type: "plain_text", text: "Semestral" }, value: "semiannual" },
            { text: { type: "plain_text", text: "Anual" }, value: "annual" },
          ],
          initial_option: { text: { type: "plain_text", text: "Sem recorrência" }, value: "none" },
        },
      },

      projectBlock,

      {
        type: "input",
        block_id: TASK_URGENCY_BLOCK_ID,
        dispatch_action: true,
        label: { type: "plain_text", text: "Nível de urgência" },
        element: {
          type: "static_select",
          action_id: TASK_URGENCY_ACTION_ID,
          initial_option:
            urgencyOptions.find((o) => o.value === urgencyValue) ??
            urgencyOptions[0],
          options: urgencyOptions,
        },
      },
      {
        type: "input",
        block_id: TASK_REMINDER_MODE_BLOCK_ID,
        label: { type: "plain_text", text: "Tipo de follow-up" },
        element: {
          type: "static_select",
          action_id: TASK_REMINDER_MODE_ACTION_ID,
          initial_option: {
            text: { type: "plain_text", text: "⏰ Entregar até o prazo" },
            value: "until",
          },
          options: [
            { text: { type: "plain_text", text: "⏰ Entregar até o prazo" }, value: "until" },
            { text: { type: "plain_text", text: "▶️ Entregar a partir do prazo" }, value: "from" },
          ],
        },
      },
      {
        type: "input",
        optional: true,
        block_id: "cc_block",
        label: { type: "plain_text", text: "Pessoas em cópia" },
        element: { type: "multi_users_select", action_id: "carbon_copies" },
      },
      ...((showTurboFields
        ? [
          {
            type: "input",
            optional: true,
            block_id: "turbo_previous_day_block",
            label: { type: "plain_text", text: "Turbo avançado" },
            element: {
              type: "checkboxes",
              action_id: "turbo_previous_day",
              options: [
                {
                  text: {
                    type: "plain_text",
                    text: "Iniciar follow-ups no dia anterior ao prazo",
                  },
                  value: "yes",
                },
              ],
            },
          },
          {
            type: "input",
            optional: true,
            block_id: "turbo_start_time_block",
            label: {
              type: "plain_text",
              text: "Horário de início dos follow-ups",
            },
            element: {
              type: "timepicker",
              action_id: "turbo_start_time",
              placeholder: {
                type: "plain_text",
                text: "Ex: 20:00",
              },
            },
          },
        ]
        : []) as KnownBlock[]),
      {
        type: "input",
        optional: true,
        block_id: TASK_CAL_PRIVATE_BLOCK_ID,
        label: { type: "plain_text", text: "Privacidade" },
        element: {
          type: "checkboxes",
          action_id: TASK_CAL_PRIVATE_ACTION_ID,
          options: [
            {
              text: { type: "plain_text", text: "🔒 Atividade privada" },
              value: "private",
            },
          ],
        },
      },
    ],
  };
}