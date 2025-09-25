import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { MissionType, ConfirmationType } from "@/generated/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    const { id } = await params;
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mission = await prisma.mission.findUnique({
      where: { id },
      include: {
        competencies: {
          include: {
            competency: true
          }
        },
        dependenciesFrom: true,
        dependenciesTo: true,
        campaign: true
      }
    });

    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    return NextResponse.json(mission);
  } catch (error) {
    console.error("Error fetching mission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    const { id } = await params;
    
    if (!session || session.user.role !== "architect") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      missionType,
      experienceReward,
      manaReward,
      positionX,
      positionY,
      confirmationType,
      minRank,
      competencies = []
    } = body;

    // Delete existing competencies and create new ones
    await prisma.missionCompetency.deleteMany({
      where: { missionId: id }
    });

    const mission = await prisma.mission.update({
      where: { id },
      data: {
        name,
        description,
        missionType: missionType as MissionType,
        experienceReward,
        manaReward,
        positionX,
        positionY,
        confirmationType: confirmationType as ConfirmationType,
        minRank,
        competencies: {
          create: competencies.map((comp: { competencyId: string; points?: number }) => ({
            competencyId: comp.competencyId,
            points: comp.points || 0
          }))
        }
      },
      include: {
        competencies: {
          include: {
            competency: true
          }
        },
        dependenciesFrom: true,
        dependenciesTo: true
      }
    });

    return NextResponse.json(mission);
  } catch (error) {
    console.error("Error updating mission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    const { id } = await params;
    
    if (!session || session.user.role !== "architect") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.mission.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting mission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
