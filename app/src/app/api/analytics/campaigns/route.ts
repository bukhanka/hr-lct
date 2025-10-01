import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/analytics/campaigns - Get analytics for all campaigns
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campaigns = await prisma.campaign.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        theme: true,
        isActive: true,
        _count: {
          select: {
            missions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get user counts for each campaign
    const campaignsWithStats = await Promise.all(
      campaigns.map(async (campaign) => {
        const userMissions = await prisma.userMission.findMany({
          where: {
            mission: {
              campaignId: campaign.id
            }
          },
          select: {
            userId: true,
            status: true
          }
        });

        const uniqueUsers = new Set(userMissions.map(um => um.userId)).size;
        const completedCount = userMissions.filter(um => um.status === 'COMPLETED').length;
        const totalMissions = userMissions.length;
        const completionRate = totalMissions > 0 ? (completedCount / totalMissions) * 100 : 0;

        return {
          ...campaign,
          stats: {
            totalMissions: campaign._count.missions,
            uniqueUsers,
            completionRate: Math.round(completionRate * 100) / 100
          }
        };
      })
    );

    return NextResponse.json(campaignsWithStats);
  } catch (error) {
    console.error("Error fetching campaign analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
