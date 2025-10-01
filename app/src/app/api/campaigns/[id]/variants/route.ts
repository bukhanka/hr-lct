import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/campaigns/[id]/variants - Get all variants for a campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const variants = await prisma.campaign.findMany({
      where: {
        parentCampaignId: id,
      },
      include: {
        missions: {
          select: {
            id: true,
            name: true,
          },
        },
        userAssignments: {
          select: {
            id: true,
            userId: true,
          },
        },
        _count: {
          select: {
            missions: true,
            userAssignments: true,
          },
        },
      },
    });

    // Get analytics for each variant
    const variantsWithAnalytics = await Promise.all(
      variants.map(async (variant) => {
        const analytics = await getVariantAnalytics(variant.id);
        return {
          ...variant,
          analytics,
        };
      })
    );

    return NextResponse.json({ variants: variantsWithAnalytics });
  } catch (error) {
    console.error("Error fetching campaign variants:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign variants" },
      { status: 500 }
    );
  }
}

// POST /api/campaigns/[id]/variants - Create a new variant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { variantName, theme, themeConfig } = body;

    if (!variantName) {
      return NextResponse.json(
        { error: "Variant name is required" },
        { status: 400 }
      );
    }

    // Get original campaign
    const originalCampaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        missions: {
          include: {
            competencies: true,
            dependenciesFrom: true,
          },
        },
      },
    });

    if (!originalCampaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Create variant campaign
    const variant = await prisma.campaign.create({
      data: {
        name: `${originalCampaign.name} - ${variantName}`,
        description: originalCampaign.description,
        theme: theme || originalCampaign.theme,
        themeConfig: themeConfig || originalCampaign.themeConfig,
        startDate: originalCampaign.startDate,
        endDate: originalCampaign.endDate,
        category: originalCampaign.category,
        targetRole: originalCampaign.targetRole,
        isActive: originalCampaign.isActive,
        isVariant: true,
        parentCampaignId: id,
        variantName,
      },
    });

    // Copy missions structure
    const missionIdMap = new Map<string, string>();

    for (const mission of originalCampaign.missions) {
      const newMission = await prisma.mission.create({
        data: {
          campaignId: variant.id,
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
        },
      });

      missionIdMap.set(mission.id, newMission.id);

      // Copy competencies
      for (const comp of mission.competencies) {
        await prisma.missionCompetency.create({
          data: {
            missionId: newMission.id,
            competencyId: comp.competencyId,
            points: comp.points,
          },
        });
      }
    }

    // Copy dependencies
    for (const mission of originalCampaign.missions) {
      for (const dep of mission.dependenciesFrom) {
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

    return NextResponse.json({ variant }, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign variant:", error);
    return NextResponse.json(
      { error: "Failed to create campaign variant" },
      { status: 500 }
    );
  }
}

// Helper function to get variant analytics
async function getVariantAnalytics(variantId: string) {
  // Get all user missions for this variant
  const userMissions = await prisma.userMission.findMany({
    where: {
      mission: {
        campaignId: variantId,
      },
    },
    include: {
      mission: true,
    },
  });

  const uniqueUsers = new Set(userMissions.map((um) => um.userId)).size;
  const completedMissions = userMissions.filter(
    (um) => um.status === "COMPLETED"
  ).length;
  const totalMissions = userMissions.length;

  const completionRate =
    totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;

  // Calculate average time to complete
  const completedWithTime = userMissions.filter(
    (um) => um.status === "COMPLETED" && um.startedAt && um.completedAt
  );

  const avgTimeToComplete =
    completedWithTime.length > 0
      ? completedWithTime.reduce((sum, um) => {
          const time =
            new Date(um.completedAt!).getTime() -
            new Date(um.startedAt!).getTime();
          return sum + time;
        }, 0) / completedWithTime.length
      : 0;

  return {
    uniqueUsers,
    totalMissions,
    completedMissions,
    completionRate: Math.round(completionRate * 100) / 100,
    avgTimeToCompleteMs: Math.round(avgTimeToComplete),
    avgTimeToCompleteHours: Math.round(avgTimeToComplete / 1000 / 60 / 60),
  };
}
