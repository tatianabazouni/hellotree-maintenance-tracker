CREATE TYPE "Role" AS ENUM ('CLIENT', 'ADMIN');
CREATE TYPE "RequestStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'DONE');
CREATE TYPE "RequestPriority" AS ENUM ('LOW', 'NORMAL', 'URGENT');
CREATE TABLE "User" ("id" UUID NOT NULL, "name" VARCHAR(100) NOT NULL, "email" VARCHAR(255) NOT NULL, "role" "Role" NOT NULL DEFAULT 'CLIENT', "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(6) NOT NULL, CONSTRAINT "User_pkey" PRIMARY KEY ("id"));
CREATE TABLE "MaintenanceRequest" ("id" UUID NOT NULL, "clientId" UUID NOT NULL, "title" VARCHAR(160) NOT NULL, "description" VARCHAR(2000) NOT NULL, "priority" "RequestPriority" NOT NULL DEFAULT 'NORMAL', "status" "RequestStatus" NOT NULL DEFAULT 'NEW', "resolutionNote" VARCHAR(2000), "resolvedAt" TIMESTAMPTZ(6), "statusChangedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMPTZ(6) NOT NULL, CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "MaintenanceRequest_clientId_idx" ON "MaintenanceRequest"("clientId");
CREATE INDEX "MaintenanceRequest_status_statusChangedAt_idx" ON "MaintenanceRequest"("status", "statusChangedAt");
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
