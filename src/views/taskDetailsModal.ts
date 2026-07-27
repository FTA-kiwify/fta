// src/views/taskDetailsModal.ts
import type { View } from "@slack/web-api";

export const TASK_DETAILS_MODAL_TITLE = "Detalhes da Tarefa" as const;

type Urgency = "light" | "asap" | "turbo";

function urgencyLabel(u: Urgency) {
  if (u === "light") return "🟢 Light";
  if (u === "asap") return "🟡 ASAP";
  return "🔴 Turbo";
}

function formatDateBRFromIso(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR");
}

export function taskDetailsModalView(args: {
  taskId: string; // ✅ NOVO
  title: string;
  responsibleSlackId: string;
  delegationSlackId: string | null;
  dueDateIso: string | null; // YYYY-MM-DD
  originalDueDateIso: string | null; // YYYY-MM-DD
  deadlineTime: string | null; // HH:MM
  urgency: Urgency;
  taskType: "normal" | "on_demand";
  recurrence: string | null;
  projectNameOrId: string | null;
  description: string | null;
  notionProcessUrl: string | null;
  calendarPrivate: boolean;


  // ✅ NOVO (opcional): lista de cópias
  carbonCopiesSlackIds?: string[] | null;
}): View {
  const dueBr = formatDateBRFromIso(args.dueDateIso);
  const dueText = dueBr
    ? args.deadlineTime
      ? `${dueBr} às ${args.deadlineTime}`
      : dueBr
    : "Sem prazo";
  const originalDueBr = formatDateBRFromIso(args.originalDueDateIso);

  const originalDueText = originalDueBr
    ? args.deadlineTime
      ? `${originalDueBr} às ${args.deadlineTime}`
      : originalDueBr
    : "—";

  const delegatedText = args.delegationSlackId ? `<@${args.delegationSlackId}>` : "—";
  const projectText = args.projectNameOrId ?? "—";
  const recurrenceText = args.recurrence ?? "—";
  const isOnDemand = args.taskType === "on_demand";

  const taskTypeText = isOnDemand
    ? "⚡ Sob demanda"
    : "📅 Normal";

  const notionText = args.notionProcessUrl?.trim()
    ? `<${args.notionProcessUrl}|Abrir processo>`
    : "—";

  const privacy =
    args.calendarPrivate
      ? "🔒 Privada"
      : "🌎 Pública";

  const ccIds = Array.from(new Set((args.carbonCopiesSlackIds ?? []).filter(Boolean)));
  const hasCc = ccIds.length > 0;

  const blocks: View["blocks"] = [
    { type: "section", text: { type: "mrkdwn", text: `📌 *${args.title}*` } },

    // ✅ UID/ID da task (fácil de copiar)
    { type: "context", elements: [{ type: "mrkdwn", text: `🆔 *UID:* \`${args.taskId}\`` }] },

    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Responsável:*\n<@${args.responsibleSlackId}>\n\n` },
        { type: "mrkdwn", text: `*Delegado por:*\n${delegatedText}\n\n` },

        { type: "mrkdwn", text: `*Tipo da tarefa:*\n${taskTypeText}\n\n` },

        ...(isOnDemand
          ? []
          : [
            { type: "mrkdwn" as const, text: `*Prazo atual:*\n${dueText}` },
            { type: "mrkdwn" as const, text: `*Prazo original:*\n${originalDueText}` },
            {
              type: "mrkdwn" as const,
              text: `*Urgência:*\n${urgencyLabel(args.urgency)}\n\n`,
            },
            {
              type: "mrkdwn" as const,
              text: `*Recorrência:*\n${recurrenceText}\n\n`,
            },
          ]),

        { type: "mrkdwn", text: `*Projeto:*\n${projectText}\n\n` },
        { type: "mrkdwn", text: `*Processo:*\n${notionText}\n\n` },
        { type: "mrkdwn", text: `*Privacidade:*\n${privacy}` },
      ],
    },
  ];

  // ✅ NOVO: bloco de cópias (se existir)
  if (hasCc) {
    blocks.push({ type: "divider" });

    // Slack section text tem limite; por segurança, limita visualmente
    const ccLines = ccIds.slice(0, 20).map((id) => `• <@${id}>`);
    const extra = ccIds.length > 20 ? `\n… +${ccIds.length - 20} cópia(s)` : "";

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `👥 *Cópias (${ccIds.length}):*\n${ccLines.join("\n")}${extra}`,
      },
    });
  }

  if (args.description?.trim()) {
    blocks.push({ type: "divider" });
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `📝 *Descrição:*\n${args.description.trim()}` },
    });
  }

  return {
    type: "modal",
    title: { type: "plain_text", text: TASK_DETAILS_MODAL_TITLE },
    close: { type: "plain_text", text: "Fechar" },
    blocks,
  };
}