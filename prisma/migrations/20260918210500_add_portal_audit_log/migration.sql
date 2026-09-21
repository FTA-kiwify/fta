-- CreateTable
CREATE TABLE "portal-audit-logs" (
    "id" TEXT NOT NULL,
    "slackUserId" TEXT NOT NULL,
    "userName" TEXT,
    "userEmail" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "entityTitle" TEXT,
    "path" TEXT,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal-audit-logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "portal-audit-logs_slackUserId_idx" ON "portal-audit-logs"("slackUserId");

-- CreateIndex
CREATE INDEX "portal-audit-logs_action_idx" ON "portal-audit-logs"("action");

-- CreateIndex
CREATE INDEX "portal-audit-logs_createdAt_idx" ON "portal-audit-logs"("createdAt");

-- CreateIndex
CREATE INDEX "portal-audit-logs_entityType_entityId_idx" ON "portal-audit-logs"("entityType", "entityId");

