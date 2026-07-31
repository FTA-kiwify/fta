import { notion } from "./client";
import type { NotionBlock } from "./notionBlock";

export async function loadNotionTree(
  pageId: string
): Promise<NotionBlock[]> {

  const blocks: NotionBlock[] = [];

  let startCursor: string | undefined;

  do {

    const response = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
      start_cursor: startCursor,
    });

    for (const raw of response.results as any[]) {

      const children = raw.has_children
        ? await loadNotionTree(raw.id)
        : [];

      blocks.push({
        id: raw.id,
        type: raw.type,
        raw,
        children,
      });

    }

    startCursor = response.has_more
      ? response.next_cursor ?? undefined
      : undefined;

  } while (startCursor);

  return blocks;

}