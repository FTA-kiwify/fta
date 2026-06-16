import { prisma } from "../lib/prisma";

export type TaskAuditAction =
    | "TASK_CREATED"
    | "TASK_COMPLETED"
    | "TASK_REOPENED"
    | "TASK_RESCHEDULED"
    | "TASK_EDITED"
    | "TASK_CANCELLED";

export async function createTaskAuditLog(args: {
    taskId: string;

    action: TaskAuditAction;

    actorSlackId?: string | null;
    actorName?: string | null;

    beforeJson?: unknown;
    afterJson?: unknown;
}) {
    console.log("[AUDIT]", {
        action: args.action,
        taskId: args.taskId,
        actorSlackId: args.actorSlackId,
    });


    return prisma.taskAuditLog.create({
        data: {
            taskId: args.taskId,

            action: args.action,

            actorSlackId: args.actorSlackId ?? null,
            actorName: args.actorName ?? null,

            beforeJson: args.beforeJson as any,
            afterJson: args.afterJson as any,
        },
    });
}