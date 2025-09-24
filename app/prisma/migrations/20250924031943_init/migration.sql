-- CreateEnum
CREATE TYPE "public"."MissionType" AS ENUM ('FILE_UPLOAD', 'QUIZ', 'OFFLINE_EVENT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ConfirmationType" AS ENUM ('AUTO', 'MANUAL_REVIEW', 'QR_SCAN', 'FILE_CHECK');

-- CreateEnum
CREATE TYPE "public"."MissionStatus" AS ENUM ('LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'PENDING_REVIEW', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('CADET', 'ARCHITECT', 'OFFICER', 'ADMIN');

-- CreateTable
CREATE TABLE "public"."Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "theme" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Mission" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "missionType" "public"."MissionType" NOT NULL,
    "experienceReward" INTEGER NOT NULL DEFAULT 0,
    "manaReward" INTEGER NOT NULL DEFAULT 0,
    "positionX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positionY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confirmationType" "public"."ConfirmationType" NOT NULL,
    "minRank" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MissionDependency" (
    "id" TEXT NOT NULL,
    "sourceMissionId" TEXT NOT NULL,
    "targetMissionId" TEXT NOT NULL,

    CONSTRAINT "MissionDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Competency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iconUrl" TEXT,

    CONSTRAINT "Competency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MissionCompetency" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MissionCompetency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'CADET',
    "avatarUrl" TEXT,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "mana" INTEGER NOT NULL DEFAULT 0,
    "currentRank" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserCompetency" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserCompetency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserMission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "status" "public"."MissionStatus" NOT NULL DEFAULT 'LOCKED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "submission" JSONB,

    CONSTRAINT "UserMission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MissionDependency_sourceMissionId_targetMissionId_key" ON "public"."MissionDependency"("sourceMissionId", "targetMissionId");

-- CreateIndex
CREATE UNIQUE INDEX "MissionCompetency_missionId_competencyId_key" ON "public"."MissionCompetency"("missionId", "competencyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserCompetency_userId_competencyId_key" ON "public"."UserCompetency"("userId", "competencyId");

-- CreateIndex
CREATE UNIQUE INDEX "UserMission_userId_missionId_key" ON "public"."UserMission"("userId", "missionId");

-- AddForeignKey
ALTER TABLE "public"."Mission" ADD CONSTRAINT "Mission_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MissionDependency" ADD CONSTRAINT "MissionDependency_sourceMissionId_fkey" FOREIGN KEY ("sourceMissionId") REFERENCES "public"."Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MissionDependency" ADD CONSTRAINT "MissionDependency_targetMissionId_fkey" FOREIGN KEY ("targetMissionId") REFERENCES "public"."Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MissionCompetency" ADD CONSTRAINT "MissionCompetency_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "public"."Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MissionCompetency" ADD CONSTRAINT "MissionCompetency_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "public"."Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserCompetency" ADD CONSTRAINT "UserCompetency_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserCompetency" ADD CONSTRAINT "UserCompetency_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "public"."Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMission" ADD CONSTRAINT "UserMission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMission" ADD CONSTRAINT "UserMission_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "public"."Mission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
