-- CreateEnum
CREATE TYPE "CollaboratorStatus" AS ENUM ('active', 'backup', 'inactive');

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "backupActivatedAt" TIMESTAMP(3),
ADD COLUMN     "backupActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "backupOriginalResponsible" TEXT,
ADD COLUMN     "backupOriginalResponsibleEmail" TEXT,
ADD COLUMN     "backupResponsible" TEXT,
ADD COLUMN     "backupResponsibleEmail" TEXT;

-- CreateTable
CREATE TABLE "collaborator-states" (
    "slackUserId" TEXT NOT NULL,
    "status" "CollaboratorStatus" NOT NULL DEFAULT 'active',
    "backupActivatedAt" TIMESTAMP(3),
    "deactivatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collaborator-states_pkey" PRIMARY KEY ("slackUserId")
);

