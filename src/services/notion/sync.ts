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
  return items.map((i) => i.plain_text).join("").trim();
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

  console.log(`Criados: ${created}`);
  console.log(`Atualizados: ${updated}`);
}

async function main() {
  const processes: Process[] = [];

  let cursor: string | undefined = undefined;

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
            ?.map((v: any) => v.name.trim())
            .join(", ") ?? "",

        tema: getPlainText(page.properties.Tema?.rich_text),

        processo: page.properties.Processo?.url?.trim() ?? "",
      });
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  const uniqueProcesses = Array.from(
    new Map(
      processes
        .filter(
          (p) =>
            p.nome.length > 0 &&
            p.processo.length > 0
        )
        .map((p) => [p.notionPageId, p])
    ).values()
  );

  console.log(`Total lidos: ${processes.length}`);
  console.log(`Total válidos: ${uniqueProcesses.length}`);

  await syncProcesses(uniqueProcesses);

  console.log("Sincronização concluída.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});