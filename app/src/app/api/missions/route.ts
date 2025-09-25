import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { MissionType, ConfirmationType } from "@/generated/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session || (session as any)?.user?.role !== "architect") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      campaignId,
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

    if (!campaignId || !name) {
      return NextResponse.json(
        { error: "Campaign ID and mission name are required" },
        { status: 400 }
      );
    }

    const mission = await prisma.mission.create({
      data: {
        campaignId,
        name,
        description,
        missionType: missionType as MissionType,
        experienceReward: experienceReward || 0,
        manaReward: manaReward || 0,
        positionX: positionX || 0,
        positionY: positionY || 0,
        confirmationType: confirmationType as ConfirmationType,
        minRank: minRank || 0,
        competencies: {
          create: competencies.map((comp: any) => ({
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
    console.error("Error creating mission:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
