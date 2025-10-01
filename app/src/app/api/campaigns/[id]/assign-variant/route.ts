import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/campaigns/[id]/assign-variant - Assign user to a variant (A/B testing)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user already has a variant assignment
    const existingAssignment = await prisma.userCampaignVariant.findUnique({
      where: {
        userId_campaignId: {
          userId,
          campaignId: id,
        },
      },
      include: {
        campaign: true,
      },
    });

    if (existingAssignment) {
      return NextResponse.json({
        assignment: existingAssignment,
        message: "User already assigned to a variant",
      });
    }

    // Get campaign and its variants
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        variants: {
          where: { isActive: true },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // If no variants, assign to original campaign
    if (campaign.variants.length === 0) {
      const assignment = await prisma.userCampaignVariant.create({
        data: {
          userId,
          campaignId: id,
        },
        include: {
          campaign: true,
        },
      });

      return NextResponse.json({ assignment });
    }

    // Get current distribution
    const allCampaigns = [campaign, ...campaign.variants];
    const distribution = await Promise.all(
      allCampaigns.map(async (c) => ({
        campaignId: c.id,
        count: await prisma.userCampaignVariant.count({
          where: { campaignId: c.id },
        }),
      }))
    );

    // Find campaign with lowest count (balanced distribution)
    const targetCampaign = distribution.reduce((min, curr) =>
      curr.count < min.count ? curr : min
    );

    // Create assignment
    const assignment = await prisma.userCampaignVariant.create({
      data: {
        userId,
        campaignId: targetCampaign.campaignId,
      },
      include: {
        campaign: true,
      },
    });

    // Initialize user missions for assigned variant
    const missions = await prisma.mission.findMany({
      where: {
        campaignId: targetCampaign.campaignId,
      },
      include: {
        dependenciesFrom: true,
      },
    });

    // Create UserMission entries
    for (const mission of missions) {
      // Check if mission has dependencies
      const hasDependencies = mission.dependenciesFrom.length > 0;

      await prisma.userMission.create({
        data: {
          userId,
          missionId: mission.id,
          status: hasDependencies ? "LOCKED" : "AVAILABLE",
        },
      });
    }

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error("Error assigning user to variant:", error);
    return NextResponse.json(
      { error: "Failed to assign user to variant" },
      { status: 500 }
    );
  }
}

// GET /api/campaigns/[id]/assign-variant?userId=xxx - Get user's variant assignment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const assignment = await prisma.userCampaignVariant.findUnique({
      where: {
        userId_campaignId: {
          userId,
          campaignId: id,
        },
      },
      include: {
        campaign: {
          include: {
            parentCampaign: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "No assignment found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("Error fetching user variant assignment:", error);
    return NextResponse.json(
      { error: "Failed to fetch user variant assignment" },
      { status: 500 }
    );
  }
}
