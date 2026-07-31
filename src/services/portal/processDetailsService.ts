import { prisma } from "../../lib/prisma";
import { getProcessBlocks } from "../notion/processContent";

export async function getProcessDetails(
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

  const blocks = await getProcessBlocks(
    process.notionPageId
  );

  return {
    process,
    blocks,
  };

}