import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/missions/[id]/duplicate - Duplicate a mission
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { offset = { x: 100, y: 100 } } = body;

    // Get the original mission with all its relations
    const originalMission = await prisma.mission.findUnique({
      where: { id },
      include: {
        competencies: true,
      },
    });

    if (!originalMission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    // Create the duplicated mission
    const duplicatedMission = await prisma.mission.create({
      data: {
        campaignId: originalMission.campaignId,
        name: `${originalMission.name} (копия)`,
        description: originalMission.description,
        missionType: originalMission.missionType,
        experienceReward: originalMission.experienceReward,
        manaReward: originalMission.manaReward,
        positionX: originalMission.positionX + offset.x,
        positionY: originalMission.positionY + offset.y,
        confirmationType: originalMission.confirmationType,
        minRank: originalMission.minRank,
        payload: originalMission.payload,
        competencies: {
          create: originalMission.competencies.map((comp) => ({
            competencyId: comp.competencyId,
            points: comp.points,
          })),
        },
      },
      include: {
        competencies: {
          include: {
            competency: true,
          },
        },
      },
    });

    return NextResponse.json(duplicatedMission);
  } catch (error) {
    console.error("Error duplicating mission:", error);
    return NextResponse.json(
      { error: "Failed to duplicate mission" },
      { status: 500 }
    );
  }
}
