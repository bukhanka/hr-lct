import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/campaigns/[id]/ranks
 * Get all ranks for a campaign (custom + global fallback)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;

    // Get custom ranks for this campaign
    const customRanks = await prisma.rank.findMany({
      where: { campaignId },
      orderBy: { level: "asc" },
    });

    // If campaign has custom ranks, return them
    if (customRanks.length > 0) {
      return NextResponse.json({
        ranks: customRanks,
        isCustom: true,
      });
    }

    // Otherwise, return global ranks
    const globalRanks = await prisma.rank.findMany({
      where: { campaignId: null },
      orderBy: { level: "asc" },
    });

    return NextResponse.json({
      ranks: globalRanks,
      isCustom: false,
    });
  } catch (error) {
    console.error("Error fetching campaign ranks:", error);
    return NextResponse.json(
      { error: "Failed to fetch ranks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/campaigns/[id]/ranks
 * Create a new rank for campaign
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const body = await req.json();

    const {
      level,
      name,
      title,
      description,
      iconUrl,
      minExperience,
      minMissions,
      requiredCompetencies,
      rewards,
    } = body;

    // Validate required fields
    if (!level || !name || !title || minExperience === undefined || minMissions === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: level, name, title, minExperience, minMissions" },
        { status: 400 }
      );
    }

    // Check if rank with this level already exists for this campaign
    const existingRank = await prisma.rank.findUnique({
      where: {
        campaignId_level: {
          campaignId,
          level: parseInt(level),
        },
      },
    });

    if (existingRank) {
      return NextResponse.json(
        { error: `Rank with level ${level} already exists for this campaign` },
        { status: 409 }
      );
    }

    // Create new rank
    const newRank = await prisma.rank.create({
      data: {
        campaignId,
        level: parseInt(level),
        name,
        title,
        description: description || null,
        iconUrl: iconUrl || null,
        minExperience: parseInt(minExperience),
        minMissions: parseInt(minMissions),
        requiredCompetencies: requiredCompetencies || null,
        rewards: rewards || null,
      },
    });

    return NextResponse.json(newRank, { status: 201 });
  } catch (error) {
    console.error("Error creating rank:", error);
    return NextResponse.json(
      { error: "Failed to create rank" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/campaigns/[id]/ranks
 * Delete all custom ranks for campaign (revert to global)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;

    await prisma.rank.deleteMany({
      where: { campaignId },
    });

    return NextResponse.json({
      message: "All custom ranks deleted, campaign will use global ranks",
    });
  } catch (error) {
    console.error("Error deleting ranks:", error);
    return NextResponse.json(
      { error: "Failed to delete ranks" },
      { status: 500 }
    );
  }
}

