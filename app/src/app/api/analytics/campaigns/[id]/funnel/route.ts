import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: campaignId } = await params;

    // Get campaign with missions
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        missions: {
          include: {
            userMissions: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Calculate funnel metrics
    const totalUsers = await prisma.user.count();
    const totalMissions = campaign.missions.length;

    // Get user missions for this campaign
    const allUserMissions = campaign.missions.flatMap((m) => m.userMissions);
    const uniqueUsers = new Set(allUserMissions.map((um) => um.userId)).size;

    // Calculate completion rates per mission
    const missionStats = campaign.missions.map((mission, index) => {
      const userMissions = mission.userMissions;
      const started = userMissions.length;
      const completed = userMissions.filter(
        (um) => um.status === "COMPLETED"
      ).length;

      return {
        missionId: mission.id,
        missionName: mission.name,
        stage: `Миссия ${index + 1}`,
        users: started,
        completed,
        dropOff: started > 0 ? Math.round(((started - completed) / started) * 100) : 0,
      };
    });

    // Overall campaign stats
    const totalCompletions = allUserMissions.filter(
      (um) => um.status === "COMPLETED"
    ).length;

    const campaignStats = {
      total_users: uniqueUsers,
      active_users: uniqueUsers, // Simplification
      total_completions: totalCompletions,
      overall_completion_rate:
        uniqueUsers > 0 ? Math.round((totalCompletions / (uniqueUsers * totalMissions)) * 100) : 0,
    };

    return NextResponse.json({
      funnel: missionStats,
      campaignStats,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[api/analytics/campaigns/funnel] error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}