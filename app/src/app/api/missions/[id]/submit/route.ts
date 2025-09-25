import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { MissionStatus } from "@/generated/prisma";
import { applyMissionCompletion } from "@/lib/testMode";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    const { id: missionId } = await params;
    
    if (!session || session.user.role !== "cadet") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { submission } = body;

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
          userId: session.user.id,
          missionId: missionId
        }
      }
    });

    if (!userMission) {
      return NextResponse.json({ error: "Mission not accessible" }, { status: 403 });
    }

    if (userMission.status === MissionStatus.COMPLETED) {
      return NextResponse.json({ error: "Mission already completed" }, { status: 400 });
    }

    if (userMission.status === MissionStatus.LOCKED) {
      return NextResponse.json({ error: "Mission is locked" }, { status: 400 });
    }

    const newStatus = mission.confirmationType === "AUTO" 
      ? MissionStatus.COMPLETED 
      : MissionStatus.PENDING_REVIEW;

    const updatedUserMission = await prisma.userMission.update({
      where: {
        userId_missionId: {
          userId: session.user.id,
          missionId: missionId
        }
      },
      data: {
        status: newStatus,
        submission: submission || null,
        completedAt: newStatus === MissionStatus.COMPLETED ? new Date() : null
      }
    });

    if (newStatus === MissionStatus.COMPLETED) {
      await applyMissionCompletion(session.user.id, mission, { awardRewards: true });
    }

    return NextResponse.json(updatedUserMission);
  } catch (error) {
    console.error("Error submitting mission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
