import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MissionStatus } from "@/generated/prisma";
import { applyMissionCompletion, getTestModeState } from "@/lib/testMode";
// import type { TestMissionStatus } from "@/types/testMode";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  let missionId: string = "";
  const userId = "u-architect-1"; // Fixed mock user for demo
  
  try {
    const paramsData = await params;
    missionId = paramsData.id;
    
    // Validate missionId
    if (!missionId || typeof missionId !== 'string') {
      console.warn("[api/missions/[id]/quick-test][POST] invalid mission ID", { missionId });
      return NextResponse.json({ error: "Invalid mission ID" }, { status: 400 });
    }
    
    console.log("[api/missions/[id]/quick-test][POST] incoming request", {
      missionId,
      userId: userId,
    });

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (dbError) {
      console.error("[api/missions/[id]/quick-test][POST] database connection error", dbError);
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 503 }
      );
    }

    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: {
        competencies: {
          include: {
            competency: true
          }
        },
        campaign: true
      }
    });

    if (!mission) {
      console.warn("[api/missions/[id]/quick-test][POST] mission not found", {
        missionId,
        userId: userId,
      });
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
      console.warn("[api/missions/[id]/quick-test][POST] test mode not initialized", {
        missionId,
        userId: userId,
      });
      return NextResponse.json({ error: "Test mode not initialized. Please start Test Mode first." }, { status: 403 });
    }

    if (userMission.status === MissionStatus.LOCKED) {
      console.warn("[api/missions/[id]/quick-test][POST] mission locked", {
        missionId,
        userId: userId,
        status: userMission.status,
      });
      return NextResponse.json({ 
        error: "Mission is locked. Complete prerequisite missions first.",
        status: "locked"
      }, { status: 400 });
    }

    if (userMission.status === MissionStatus.COMPLETED) {
      console.log("[api/missions/[id]/quick-test][POST] mission already completed", {
        missionId,
        userId: userId,
      });
      return NextResponse.json({
        success: true,
        message: "Mission already completed in test mode",
        state: await getTestModeState(userId, mission.campaignId)
      });
    }

    await prisma.userMission.update({
      where: {
        userId_missionId: {
          userId: userId,
          missionId: missionId
        }
      },
      data: {
        status: MissionStatus.COMPLETED,
        startedAt: new Date(),
        completedAt: new Date(),
        submission: { testMode: true, completedBy: "architect" }
      }
    });
    console.log("[api/missions/[id]/quick-test][POST] mission marked as completed", {
      missionId,
      userId: userId,
    });

    await applyMissionCompletion(userId, mission, { awardRewards: false });
    console.log("[api/missions/[id]/quick-test][POST] applied mission completion effects", {
      missionId,
      userId: userId,
    });

    const state = await getTestModeState(userId, mission.campaignId);
    console.log("[api/missions/[id]/quick-test][POST] returning updated test mode state", {
      missionId,
      userId: userId,
      summary: state.summary,
    });

    return NextResponse.json({
      success: true,
      message: "Mission completed in test mode",
      state
    });
  } catch (error) {
    console.error("[api/missions/[id]/quick-test][POST] error testing mission", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as { code?: string })?.code,
      meta: (error as { meta?: unknown })?.meta,
      missionId,
      userId: userId,
      timestamp: new Date().toISOString()
    });
    
    // Return more detailed error information
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
        debugInfo: {
          missionId,
          userId: userId,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}
