import { prisma } from "../../lib/prisma";

export async function getTaskAudit(taskId: string) {
  return prisma.taskAuditLog.findMany({
    where: {
      taskId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });
}