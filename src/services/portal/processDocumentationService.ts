import { prisma } from "../../lib/prisma";

import { loadNotionTree } from "../notion/loadNotionTree";
import { extractNotionPageId } from "../notion/extractNotionPageId";

import { renderNotionBlocks } from "../../portal/notion/renderNotionBlocks";

export async function getProcessDocumentation(
  processId: string
) {

  const process = await prisma.process.findUnique({
    where: {
      id: processId,
    },
  });

  if (!process) {
    return null;
  }

  const pageId = extractNotionPageId(
    process.notionPageUrl
  );

  const blocks = await loadNotionTree(
    pageId
  );

  return await renderNotionBlocks(
    blocks
  );

}