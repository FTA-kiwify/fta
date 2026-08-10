// src/slack/views/homeHeaderActions.ts
import type { KnownBlock } from "@slack/web-api";

export const HOME_CREATE_TASK_ACTION_ID = "home_create_task" as const;
export const HOME_SEND_BATCH_ACTION_ID = "home_send_batch" as const;

export function homeHeaderActionsBlocks(): KnownBlock[] {
  return [
    {
      type: "header",
      text: { type: "plain_text", text: "📋 Home" },
    },
    { type: "divider" },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "➕ Criar tarefa" },
          action_id: HOME_CREATE_TASK_ACTION_ID,
          value: "open_create_task_modal",
        },
        {
          type: "button",
          text: { type: "plain_text", text: "📦 Enviar atividades em lote" },
          action_id: HOME_SEND_BATCH_ACTION_ID,
          value: "open_send_batch_modal",
        },
      ],
    },
    { type: "divider" },
  ];
}
