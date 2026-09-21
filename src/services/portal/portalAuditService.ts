import { prisma } from "../../lib/prisma";

type PortalAuditArgs = {
  slackUserId: string;

  userName?: string | null;
  userEmail?: string | null;

  action: string;

  entityType?: string | null;
  entityId?: string | null;
  entityTitle?: string | null;

  path?: string | null;

  beforeJson?: unknown;
  afterJson?: unknown;
  metadata?: unknown;
};

export async function logPortalAction(
  args: PortalAuditArgs
) {
  try {
    await prisma.portalAuditLog.create({
      data: {
        slackUserId:
          args.slackUserId,

        userName:
          args.userName ?? null,

        userEmail:
          args.userEmail ?? null,

        action:
          args.action,

        entityType:
          args.entityType ?? null,

        entityId:
          args.entityId ?? null,

        entityTitle:
          args.entityTitle ?? null,

        path:
          args.path ?? null,

        beforeJson:
          args.beforeJson === undefined
            ? undefined
            : (args.beforeJson as any),

        afterJson:
          args.afterJson === undefined
            ? undefined
            : (args.afterJson as any),

        metadata:
          args.metadata === undefined
            ? undefined
            : (args.metadata as any),
      },
    });
  } catch (error) {
    /*
     * Falha na auditoria nunca pode
     * bloquear uma ação do Portal.
     */
    console.error(
      "[PORTAL_AUDIT] failed",
      {
        slackUserId:
          args.slackUserId,

        action:
          args.action,

        error,
      }
    );
  }
}