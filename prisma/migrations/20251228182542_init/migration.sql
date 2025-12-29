/*
  Warnings:

  - You are about to drop the column `relatedId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[phoneNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PLAYER', 'OWNER', 'EMPLOYEE', 'ADMIN');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('WEAK', 'AVERAGE', 'GOOD', 'EXCELLENT', 'LEGENDARY');

-- DropIndex
DROP INDEX "Booking_createdAt_idx";

-- DropIndex
DROP INDEX "Payment_paymentId_idx";

-- DropIndex
DROP INDEX "Slot_fieldId_startTime_status_idx";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "relatedId";

-- AlterTable
ALTER TABLE "Slot" ADD COLUMN     "lockedByUserId" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "phone",
ADD COLUMN     "age" INTEGER,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "loginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "skillLevel" "SkillLevel" NOT NULL DEFAULT 'AVERAGE',
DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'PLAYER';

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "Slot_lockedByUserId_idx" ON "Slot"("lockedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- AddForeignKey
ALTER TABLE "Slot" ADD CONSTRAINT "Slot_lockedByUserId_fkey" FOREIGN KEY ("lockedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
