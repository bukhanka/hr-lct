import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { MissionStatus } from "@/generated/prisma";
import { applyMissionCompletion } from "@/lib/testMode";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/missions/[id]/approve - Approve or reject mission submission
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    const { id: missionId } = await params;
    
    if (!session || (session as any)?.user?.role !== "officer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, approved, comment } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: {
        competencies: {
          include: {
            competency: true
          }
        }
      }
    });

    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    const userMission = await prisma.userMission.findUnique({
      where: {
        userId_missionId: {
          userId: userId,
          missionId: missionId
        }
      }
    });

    if (!userMission) {
      return NextResponse.json({ error: "User mission not found" }, { status: 404 });
    }

    if (userMission.status !== MissionStatus.PENDING_REVIEW) {
      return NextResponse.json({ error: "Mission is not pending review" }, { status: 400 });
    }

    const newStatus = approved ? MissionStatus.COMPLETED : MissionStatus.AVAILABLE;
    
    const updatedUserMission = await prisma.userMission.update({
      where: {
        userId_missionId: {
          userId: userId,
          missionId: missionId
        }
      },
      data: {
        status: newStatus,
        completedAt: approved ? new Date() : null,
        submission: comment ? { 
          ...(userMission.submission as any), 
          officerComment: comment 
        } : userMission.submission
      }
    });

    // Award rewards if approved
    if (approved) {
      await awardMissionRewards(userId, mission);
    }

    // TODO: Send notification to user about approval/rejection

    return NextResponse.json({
      success: true,
      approved,
      userMission: updatedUserMission
    });
  } catch (error) {
    console.error("Error approving mission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Award experience, mana, and competency points
async function awardMissionRewards(userId: string, mission: any) {
  // Update user experience and mana
  await prisma.user.update({
    where: { id: userId },
    data: {
      experience: { increment: mission.experienceReward },
      mana: { increment: mission.manaReward }
    }
  });

  // Award competency points
  if (mission.competencies && mission.competencies.length > 0) {
    for (const competency of mission.competencies) {
      await prisma.userCompetency.upsert({
        where: {
          userId_competencyId: {
            userId: userId,
            competencyId: competency.competencyId
          }
        },
        update: {
          points: { increment: competency.points }
        },
        create: {
          userId: userId,
          competencyId: competency.competencyId,
          points: competency.points
        }
      });
    }
  }

  // TODO: Check if user can rank up based on new experience/competencies
}
