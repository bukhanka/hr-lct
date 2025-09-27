-- CreateEnum
CREATE TYPE "public"."CampaignCategory" AS ENUM ('ONBOARDING', 'BRAND_AMBASSADOR', 'PROFESSIONAL_GROWTH', 'CORPORATE_LIFE');

-- CreateEnum
CREATE TYPE "public"."ItemCategory" AS ENUM ('MERCH', 'BONUS', 'BADGE', 'AVATAR');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('MISSION_COMPLETED', 'RANK_UP', 'NEW_MISSION_AVAILABLE', 'PURCHASE_SUCCESS', 'MISSION_APPROVED', 'MISSION_REJECTED');

-- AlterTable
ALTER TABLE "public"."Campaign" ADD COLUMN     "category" "public"."CampaignCategory" NOT NULL DEFAULT 'ONBOARDING',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "targetRole" TEXT;

-- CreateTable
CREATE TABLE "public"."Rank" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "minExperience" INTEGER NOT NULL DEFAULT 0,
    "minMissions" INTEGER NOT NULL DEFAULT 0,
    "requiredCompetencies" JSONB,
    "rewards" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StoreItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "category" "public"."ItemCategory" NOT NULL,
    "imageUrl" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rank_level_key" ON "public"."Rank"("level");

-- CreateIndex
CREATE UNIQUE INDEX "UserPurchase_userId_itemId_key" ON "public"."UserPurchase"("userId", "itemId");

-- AddForeignKey
ALTER TABLE "public"."UserPurchase" ADD CONSTRAINT "UserPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPurchase" ADD CONSTRAINT "UserPurchase_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."StoreItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
