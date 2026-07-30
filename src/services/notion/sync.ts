import { notion } from "./client";
import { prisma } from "../../lib/prisma";

type Process = {
  notionPageId: string;
  nome: string;
  time: string;
  vertical: string;
  tema: string;
  processo: string;
};

const DATA_SOURCE_ID = "3a529291-8369-803d-85e7-000b07ba2376";

function getPlainText(items: any[] = []) {
  return items
    .map((item) => item.plain_text)
    .join("")
    .trim();
}

async function syncProcesses(processes: Process[]) {
  let created = 0;
  let updated = 0;

  for (const process of processes) {
    const team = await prisma.team.findFirst({
      where: {
        name: process.vertical,
      },
    });

    const existing = await prisma.process.findUnique({
      where: {
        notionPageId: process.notionPageId,
      },
    });

    await prisma.process.upsert({
      where: {
        notionPageId: process.notionPageId,
      },

      update: {
        title: process.nome,
        notionPageUrl: process.processo,
        notionTeam: process.time,
        notionVertical: process.vertical,
        theme: process.tema || null,
        teamId: team?.id ?? null,
        active: true,
      },

      create: {
        notionPageId: process.notionPageId,
        title: process.nome,
        notionPageUrl: process.processo,
        notionTeam: process.time,
        notionVertical: process.vertical,
        theme: process.tema || null,
        teamId: team?.id ?? null,
        active: true,
      },
    });

    if (existing) {
      updated++;
    } else {
      created++;
    }
  }

  console.log(`[Notion] Criados: ${created}`);
  console.log(`[Notion] Atualizados: ${updated}`);
}

export async function syncNotionProcesses() {
  const processes: Process[] = [];

  let cursor: string | undefined;

  do {
    const response = await notion.dataSources.query({
      data_source_id: DATA_SOURCE_ID,
      page_size: 100,
      start_cursor: cursor,
    });

    for (const page of response.results as any[]) {
      processes.push({
        notionPageId: page.id,

        nome: getPlainText(page.properties.Nome?.title),

        time: getPlainText(page.properties.Time?.rich_text),

        vertical:
          page.properties.Vertical?.multi_select
            ?.map((value: any) => value.name.trim())
            .join(", ") ?? "",

        tema: getPlainText(page.properties.Tema?.rich_text),

        processo: page.properties.Processo?.url?.trim() ?? "",
      });
    }

    cursor =
      response.has_more && response.next_cursor
        ? response.next_cursor
        : undefined;
  } while (cursor);

  const uniqueProcesses = Array.from(
    new Map(
      processes
        .filter(
          (process) =>
            process.nome.length > 0 &&
            process.processo.length > 0,
        )
        .map((process) => [process.notionPageId, process]),
    ).values(),
  );

  console.log(`[Notion] Total lidos: ${processes.length}`);
  console.log(`[Notion] Total válidos: ${uniqueProcesses.length}`);

  await syncProcesses(uniqueProcesses);
  await prisma.process.updateMany({
    where: {
      notionPageId: {
        notIn: uniqueProcesses.map((process) => process.notionPageId),
      },
    },
    data: {
      active: false,
    },
  });

  console.log("[Notion] Sincronização concluída.");
}

/*
 * Mantém o comando manual funcionando:
 * npm run notion:sync
 */
if (require.main === module) {
  syncNotionProcesses()
    .catch((error) => {
      console.error("[Notion] Erro na sincronização:", error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}