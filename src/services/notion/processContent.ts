import { notion } from "./client";

export async function getProcessBlocks(
  pageId: string
) {

  const blocks = await notion.blocks.children.list({
    block_id: pageId,
    page_size: 100,
  });

  return blocks.results;

}