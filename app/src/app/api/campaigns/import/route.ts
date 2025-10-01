import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/campaigns/import - Import campaign from JSON
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const importData = await request.json();

    // Validate import data
    if (!importData.campaign || !importData.missions) {
      return NextResponse.json(
        { error: "Invalid import format" },
        { status: 400 }
      );
    }

    // Create new campaign
    const newCampaign = await prisma.campaign.create({
      data: {
        name: `${importData.campaign.name} (импорт)`,
        description: importData.campaign.description,
        theme: importData.campaign.theme || "space",
        themeConfig: importData.campaign.themeConfig,
        isActive: false, // Start as inactive for safety
      },
    });

    // Create mission ID mapping (old ID -> new ID)
    const missionIdMap = new Map<string, string>();

    // Get all competencies for mapping
    const competencies = await prisma.competency.findMany();
    const competencyMap = new Map(
      competencies.map(c => [c.name.toLowerCase(), c.id])
    );

    // Create missions
    for (const missionData of importData.missions) {
      const newMission = await prisma.mission.create({
        data: {
          campaignId: newCampaign.id,
          name: missionData.name,
          description: missionData.description,
          missionType: missionData.missionType,
          experienceReward: missionData.experienceReward,
          manaReward: missionData.manaReward,
          positionX: missionData.positionX,
          positionY: missionData.positionY,
          confirmationType: missionData.confirmationType,
          minRank: missionData.minRank,
          payload: missionData.payload,
        },
      });

      missionIdMap.set(missionData.id, newMission.id);

      // Create competencies if they exist
      if (missionData.competencies && missionData.competencies.length > 0) {
        for (const comp of missionData.competencies) {
          const competencyId = competencyMap.get(comp.competencyName.toLowerCase());
          if (competencyId) {
            await prisma.missionCompetency.create({
              data: {
                missionId: newMission.id,
                competencyId,
                points: comp.points,
              },
            });
          }
        }
      }
    }

    // Create dependencies using new IDs
    if (importData.dependencies && importData.dependencies.length > 0) {
      for (const dep of importData.dependencies) {
        const newSourceId = missionIdMap.get(dep.sourceMissionId);
        const newTargetId = missionIdMap.get(dep.targetMissionId);

        if (newSourceId && newTargetId) {
          await prisma.missionDependency.create({
            data: {
              sourceMissionId: newSourceId,
              targetMissionId: newTargetId,
            },
          });
        }
      }
    }

    // Return the created campaign with missions
    const createdCampaign = await prisma.campaign.findUnique({
      where: { id: newCampaign.id },
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

    return NextResponse.json({
      success: true,
      campaign: createdCampaign,
      stats: {
        missionsImported: importData.missions.length,
        dependenciesImported: importData.dependencies?.length || 0,
      },
    });
  } catch (error) {
    console.error("Error importing campaign:", error);
    return NextResponse.json(
      { error: "Failed to import campaign" },
      { status: 500 }
    );
  }
}
