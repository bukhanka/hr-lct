import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/campaigns/[id]/ranks/clone-defaults
 * Clone global ranks to campaign as a starting point for customization
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;

    // Check if campaign already has custom ranks
    const existingRanks = await prisma.rank.findMany({
      where: { campaignId },
    });

    if (existingRanks.length > 0) {
      return NextResponse.json(
        { error: "Campaign already has custom ranks. Delete them first to clone defaults." },
        { status: 409 }
      );
    }

    // Get global ranks
    const globalRanks = await prisma.rank.findMany({
      where: { campaignId: null },
      orderBy: { level: "asc" },
    });

    if (globalRanks.length === 0) {
      return NextResponse.json(
        { error: "No global ranks found to clone" },
        { status: 404 }
      );
    }

    // Clone global ranks to campaign
    const clonedRanks = await Promise.all(
      globalRanks.map((rank) =>
        prisma.rank.create({
          data: {
            campaignId,
            level: rank.level,
            name: rank.name,
            title: rank.title,
            description: rank.description,
            iconUrl: rank.iconUrl,
            minExperience: rank.minExperience,
            minMissions: rank.minMissions,
            requiredCompetencies: rank.requiredCompetencies,
            rewards: rank.rewards,
          },
        })
      )
    );

    return NextResponse.json({
      message: `Successfully cloned ${clonedRanks.length} ranks to campaign`,
      ranks: clonedRanks,
    });
  } catch (error) {
    console.error("Error cloning default ranks:", error);
    return NextResponse.json(
      { error: "Failed to clone default ranks" },
      { status: 500 }
    );
  }
}

