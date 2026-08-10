// src/services/sendImportTemplateDm.ts

import type { WebClient } from "@slack/web-api";
import { generateTasksImportTemplate } from "./generateTasksImportTemplate";

async function openDm(slack: WebClient, userId: string) {
  const conv = await slack.conversations.open({ users: userId });

  const channelId = conv.channel?.id;

  if (!channelId) {
    throw new Error("Could not open DM channel");
  }

  return channelId;
}

export async function sendImportTemplateDm(
  slack: WebClient,
  userSlackId: string
) {
  const channelId = await openDm(slack, userSlackId);

  // ✅ Gera o template NA HORA com os processos ativos atuais
  const fileBuf = await generateTasksImportTemplate();

  // Envia o arquivo recém-gerado
  await slack.files.uploadV2({
    channel_id: channelId,
    filename: "tasks_import_template.xlsx",
    file: fileBuf,
    title: "Template de importação de tasks",
    initial_comment:
      "📎 Aqui está o *template atualizado*.\n" +
      "A lista de processos foi atualizada automaticamente.\n\n" +
      "Depois é só *anexar o .xlsx neste DM* que eu processo e crio as tasks.",
  });

  await slack.chat.postMessage({
    channel: channelId,
    text:
      "✅ Envie o arquivo .xlsx preenchido aqui no DM.\n" +
      "Eu vou ler as linhas e criar as tasks automaticamente.",
  });
}