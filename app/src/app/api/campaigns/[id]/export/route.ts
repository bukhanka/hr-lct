import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/campaigns/[id]/export - Export campaign as JSON
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        missions: {
          include: {
            competencies: {
              include: {
                competency: true,
              },
            },
            dependenciesFrom: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Create export format
    const exportData = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      campaign: {
        name: campaign.name,
        description: campaign.description,
        theme: campaign.theme,
        themeConfig: campaign.themeConfig,
        isActive: campaign.isActive,
      },
      missions: campaign.missions.map((mission) => ({
        id: mission.id,
        name: mission.name,
        description: mission.description,
        missionType: mission.missionType,
        experienceReward: mission.experienceReward,
        manaReward: mission.manaReward,
        positionX: mission.positionX,
        positionY: mission.positionY,
        confirmationType: mission.confirmationType,
        minRank: mission.minRank,
        payload: mission.payload,
        competencies: mission.competencies.map((comp) => ({
          competencyName: comp.competency.name,
          points: comp.points,
        })),
      })),
      dependencies: campaign.missions.flatMap((mission) =>
        mission.dependenciesFrom.map((dep) => ({
          sourceMissionId: dep.sourceMissionId,
          targetMissionId: dep.targetMissionId,
        }))
      ),
    };

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${campaign.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting campaign:", error);
    return NextResponse.json(
      { error: "Failed to export campaign" },
      { status: 500 }
    );
  }
}
