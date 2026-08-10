// src/views/sendBatchModal.ts

import {
  TASK_TIME_ACTION_ID,
  TASK_RECURRENCE_ACTION_ID,
  TASK_DEPENDS_ACTION_ID,
} from "./createTaskModal";

export const SEND_BATCH_MODAL_CALLBACK_ID = "send_batch_modal" as const;

// botão dentro do modal
export const BATCH_ADD_TASK_ACTION_ID = "batch_add_task" as const;
export const BATCH_REMOVE_TASK_ACTION_ID = "batch_remove_task" as const;

const MAX_TASKS = 8;

function taskBlockIds(i: number) {
  return {
    titleBlock: `batch_title_block_${i}`,
    descBlock: `batch_desc_block_${i}`,
    respBlock: `batch_resp_block_${i}`,
    dueBlock: `batch_due_block_${i}`,
    timeBlock: `batch_time_block_${i}`,
    urgencyBlock: `batch_urgency_block_${i}`,
    ccBlock: `batch_cc_block_${i}`,
    recurrenceBlock: `batch_recurrence_block_${i}`,
    dependsBlock: `batch_depends_block_${i}`,
  } as const;
}

function taskBlocks(i: number) {
  const ids = taskBlockIds(i);

  return [
    { type: "divider" },

    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Tarefa ${i + 1}*`,
      },
    },

    {
      type: "input",
      block_id: ids.titleBlock,
      label: { type: "plain_text", text: "Título" },
      element: {
        type: "plain_text_input",
        action_id: "title",
      },
    },

    {
      type: "input",
      optional: true,
      block_id: ids.descBlock,
      label: { type: "plain_text", text: "Descrição" },
      element: {
        type: "plain_text_input",
        action_id: "description",
        multiline: true,
      },
    },

    {
      type: "input",
      block_id: ids.respBlock,
      label: { type: "plain_text", text: "Responsável" },
      element: {
        type: "users_select",
        action_id: "responsible",
      },
    },

    {
      type: "input",
      optional: true,
      block_id: ids.dueBlock,
      label: { type: "plain_text", text: "Prazo (data)" },
      element: {
        type: "datepicker",
        action_id: "due_date",
      },
    },

    {
      type: "input",
      optional: true,
      block_id: ids.timeBlock,
      label: { type: "plain_text", text: "Prazo (horário)" },
      element: {
        type: "timepicker",
        action_id: TASK_TIME_ACTION_ID,
      },
    },

    {
      type: "input",
      optional: true,
      block_id: ids.dependsBlock,
      label: { type: "plain_text", text: "Depende de" },
      element: {
        type: "external_select",
        action_id: TASK_DEPENDS_ACTION_ID,
        placeholder: {
          type: "plain_text",
          text: "Buscar tarefa...",
        },
        min_query_length: 0,
      },
    },

    {
      type: "input",
      optional: true,
      block_id: ids.recurrenceBlock,
      label: { type: "plain_text", text: "Recorrência" },
      element: {
        type: "static_select",
        action_id: TASK_RECURRENCE_ACTION_ID,
        options: [
          {
            text: { type: "plain_text", text: "Sem recorrência" },
            value: "none",
          },
          {
            text: { type: "plain_text", text: "Diária" },
            value: "daily",
          },
          {
            text: { type: "plain_text", text: "Semanal" },
            value: "weekly",
          },
          {
            text: { type: "plain_text", text: "Quinzenal" },
            value: "biweekly",
          },
          {
            text: { type: "plain_text", text: "Mensal" },
            value: "monthly",
          },
          {
            text: { type: "plain_text", text: "Trimestral" },
            value: "quarterly",
          },
          {
            text: { type: "plain_text", text: "Semestral" },
            value: "semiannual",
          },
          {
            text: { type: "plain_text", text: "Anual" },
            value: "annual",
          },
        ],
      },
    },

    {
      type: "input",
      optional: true,
      block_id: ids.urgencyBlock,
      label: { type: "plain_text", text: "Urgência" },
      element: {
        type: "static_select",
        action_id: "urgency",
        options: [
          {
            text: { type: "plain_text", text: "🟢 Light" },
            value: "light",
          },
          {
            text: { type: "plain_text", text: "🟡 ASAP" },
            value: "asap",
          },
          {
            text: { type: "plain_text", text: "🔴 Turbo" },
            value: "turbo",
          },
        ],
      },
    },

    {
      type: "input",
      optional: true,
      block_id: ids.ccBlock,
      label: { type: "plain_text", text: "Cópias" },
      element: {
        type: "multi_users_select",
        action_id: "carbon_copies",
      },
    },
  ];
}

export function sendBatchModalView(args: {
  count?: number;
}) {
  const count = Math.max(
    1,
    Math.min(MAX_TASKS, Number(args.count ?? 1))
  );

  const blocks: any[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          `Preencha as tasks abaixo e clique *Criar*.\n` +
          `Você pode adicionar até *${MAX_TASKS}* tasks neste envio.`,
      },
    },
  ];

  for (let i = 0; i < count; i++) {
    blocks.push(...taskBlocks(i));
  }

  blocks.push(
    { type: "divider" },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "➕ Adicionar outra task",
          },
          action_id: BATCH_ADD_TASK_ACTION_ID,
          value: "add",
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "➖ Remover última",
          },
          action_id: BATCH_REMOVE_TASK_ACTION_ID,
          value: "remove",
        },
      ],
    }
  );

  return {
    type: "modal",
    callback_id: SEND_BATCH_MODAL_CALLBACK_ID,
    title: {
      type: "plain_text",
      text: "Criar tarefas (lote)",
    },
    submit: {
      type: "plain_text",
      text: "Criar",
    },
    close: {
      type: "plain_text",
      text: "Cancelar",
    },
    private_metadata: JSON.stringify({ count }),
    blocks,
  } as const;
}