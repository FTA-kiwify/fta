import { prisma } from "../../lib/prisma";
import { getProcessBlocks } from "../notion/processContent";
import { renderNotionBlocks } from "../../portal/notion/renderNotionBlocks";

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
        process.notionPageUrl
    );

    return {
        process,
        content: renderNotionBlocks(blocks),

    };

}