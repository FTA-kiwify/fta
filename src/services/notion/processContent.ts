import { notion } from "./client";

function extractNotionPageId(notionPageUrl: string): string | null {
  const decodedUrl = decodeURIComponent(notionPageUrl.trim());

  // Aceita ID com hífens:
  // 2b729291-8369-8016-9fb8-ef4957290c34
  const dashedMatches = decodedUrl.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi
  );

  if (dashedMatches?.length) {
    return dashedMatches[dashedMatches.length - 1];
  }

  // Aceita ID sem hífens:
  // 2b729291836980169fb8ef4957290c34
  const compactMatches = decodedUrl.match(/[0-9a-f]{32}/gi);

  if (!compactMatches?.length) {
    return null;
  }

  const compactId = compactMatches[compactMatches.length - 1];

  return [
    compactId.slice(0, 8),
    compactId.slice(8, 12),
    compactId.slice(12, 16),
    compactId.slice(16, 20),
    compactId.slice(20),
  ].join("-");
}

export async function getProcessBlocks(
  notionPageUrl: string
) {
  const pageId = extractNotionPageId(notionPageUrl);

  if (!pageId) {
    throw new Error(
      `Não foi possível extrair o ID da página do Notion: ${notionPageUrl}`
    );
  }

  console.log("[Notion Process] URL:", notionPageUrl);
  console.log("[Notion Process] Page ID extraído:", pageId);

  const results: any[] = [];
  let startCursor: string | undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
      start_cursor: startCursor,
    });

    results.push(...response.results);

    startCursor =
      response.has_more && response.next_cursor
        ? response.next_cursor
        : undefined;
  } while (startCursor);

  console.log(
    "[Notion Process] Blocos encontrados:",
    results.length
  );

  return results;
}