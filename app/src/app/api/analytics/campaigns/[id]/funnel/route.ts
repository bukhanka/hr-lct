import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MissionStatus } from "@/generated/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface FunnelAnalytics {
  missionId: string;
  missionName: string;
  missionType: string;
  position: { x: number; y: number };
  usersStarted: number;
  usersCompleted: number;
  usersPending: number;
  usersLocked: number;
  completionRate: number;
  avgCompletionTimeSeconds: number | null;
  dropOffRate: number;
  experienceReward: number;
  manaReward: number;
}

// GET /api/analytics/campaigns/[id]/funnel - Get detailed funnel analytics
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId } = await params;
    const { searchParams } = new URL(request.url);
    
    // Optional filters
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const userRole = searchParams.get('userRole');

    // Get campaign with missions
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        missions: {
          include: {
            userMissions: {
              where: {
                ...(dateFrom && { startedAt: { gte: new Date(dateFrom) } }),
                ...(dateTo && { completedAt: { lte: new Date(dateTo) } }),
                ...(userRole && { user: { role: userRole as any } })
              },
              include: {
                user: true
              }
            },
            dependenciesFrom: {
              include: {
                targetMission: true
              }
            },
            dependenciesTo: {
              include: {
                sourceMission: true
              }
            }
          },
          orderBy: {
            positionY: 'asc'
          }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Calculate analytics for each mission
    const funnelData: FunnelAnalytics[] = campaign.missions.map((mission) => {
      const userMissions = mission.userMissions;
      
      const usersStarted = userMissions.filter(um => 
        um.status !== MissionStatus.LOCKED
      ).length;
      
      const usersCompleted = userMissions.filter(um => 
        um.status === MissionStatus.COMPLETED
      ).length;
      
      const usersPending = userMissions.filter(um => 
        um.status === MissionStatus.PENDING_REVIEW || um.status === MissionStatus.IN_PROGRESS
      ).length;
      
      const usersLocked = userMissions.filter(um => 
        um.status === MissionStatus.LOCKED
      ).length;

      const completionRate = usersStarted > 0 
        ? (usersCompleted / usersStarted) * 100 
        : 0;

      // Calculate average completion time
      const completedWithTime = userMissions.filter(um => 
        um.status === MissionStatus.COMPLETED && 
        um.startedAt && 
        um.completedAt
      );

      let avgCompletionTimeSeconds: number | null = null;
      if (completedWithTime.length > 0) {
        const totalSeconds = completedWithTime.reduce((sum, um) => {
          const diff = um.completedAt!.getTime() - um.startedAt!.getTime();
          return sum + (diff / 1000);
        }, 0);
        avgCompletionTimeSeconds = Math.round(totalSeconds / completedWithTime.length);
      }

      // Calculate drop-off rate
      const dropOffRate = usersStarted > 0 
        ? ((usersStarted - usersCompleted) / usersStarted) * 100 
        : 0;

      return {
        missionId: mission.id,
        missionName: mission.name,
        missionType: mission.missionType,
        position: {
          x: mission.positionX,
          y: mission.positionY
        },
        usersStarted,
        usersCompleted,
        usersPending,
        usersLocked,
        completionRate: Math.round(completionRate * 100) / 100,
        avgCompletionTimeSeconds,
        dropOffRate: Math.round(dropOffRate * 100) / 100,
        experienceReward: mission.experienceReward,
        manaReward: mission.manaReward
      };
    });

    // Calculate overall funnel metrics
    const totalUniqueUsers = new Set(
      campaign.missions.flatMap(m => m.userMissions.map(um => um.userId))
    ).size;

    const overallStarted = funnelData.reduce((sum, m) => sum + m.usersStarted, 0);
    const overallCompleted = funnelData.reduce((sum, m) => sum + m.usersCompleted, 0);
    const overallCompletionRate = overallStarted > 0 
      ? (overallCompleted / overallStarted) * 100 
      : 0;
    
    // Calculate active users (users with at least one in-progress or pending mission)
    const activeUsers = new Set(
      campaign.missions.flatMap(m => 
        m.userMissions
          .filter(um => um.status === MissionStatus.IN_PROGRESS || um.status === MissionStatus.PENDING_REVIEW)
          .map(um => um.userId)
      )
    ).size;

    // Find drop-off points (missions with highest drop-off rate)
    const dropOffPoints = [...funnelData]
      .sort((a, b) => b.dropOffRate - a.dropOffRate)
      .slice(0, 5)
      .map(m => ({
        missionId: m.missionId,
        missionName: m.missionName,
        dropOffRate: m.dropOffRate
      }));

    // Cohort analysis by registration date
    const cohortAnalysis = await getCohortAnalysis(campaignId, dateFrom, dateTo);

    // Transform funnel data for frontend compatibility
    const transformedFunnel = funnelData.map(mission => ({
      missionId: mission.missionId,
      missionName: mission.missionName,
      stage: mission.missionType,
      users: mission.usersStarted,
      completed: mission.usersCompleted,
      dropOff: mission.dropOffRate
    }));

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        theme: campaign.theme
      },
      summary: {
        totalMissions: campaign.missions.length,
        totalUniqueUsers,
        overallCompletionRate: Math.round(overallCompletionRate * 100) / 100,
        dropOffPoints
      },
      campaignStats: {
        total_users: totalUniqueUsers,
        active_users: activeUsers,
        total_completions: overallCompleted,
        overall_completion_rate: Math.round(overallCompletionRate)
      },
      funnel: transformedFunnel,
      cohorts: cohortAnalysis
    });
  } catch (error) {
    console.error("Error fetching funnel analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function for cohort analysis
async function getCohortAnalysis(
  campaignId: string, 
  dateFrom?: string | null, 
  dateTo?: string | null
) {
  const userMissions = await prisma.userMission.findMany({
    where: {
      mission: { campaignId },
      ...(dateFrom && { startedAt: { gte: new Date(dateFrom) } }),
      ...(dateTo && { completedAt: { lte: new Date(dateTo) } })
    },
    include: {
      user: true,
      mission: true
    }
  });

  // Group by user creation date (cohort)
  const cohortMap = new Map<string, {
    cohortDate: string;
    userCount: number;
    completedMissions: number;
    totalMissions: number;
    avgCompletionRate: number;
  }>();

  userMissions.forEach(um => {
    const cohortDate = um.user.createdAt.toISOString().split('T')[0];
    
    if (!cohortMap.has(cohortDate)) {
      cohortMap.set(cohortDate, {
        cohortDate,
        userCount: 0,
        completedMissions: 0,
        totalMissions: 0,
        avgCompletionRate: 0
      });
    }

    const cohort = cohortMap.get(cohortDate)!;
    cohort.totalMissions++;
    if (um.status === MissionStatus.COMPLETED) {
      cohort.completedMissions++;
    }
  });

  // Calculate completion rates
  const cohorts = Array.from(cohortMap.values()).map(cohort => {
    const uniqueUsers = new Set(
      userMissions
        .filter(um => um.user.createdAt.toISOString().split('T')[0] === cohort.cohortDate)
        .map(um => um.userId)
    ).size;

    cohort.userCount = uniqueUsers;
    cohort.avgCompletionRate = cohort.totalMissions > 0 
      ? (cohort.completedMissions / cohort.totalMissions) * 100 
      : 0;
    cohort.avgCompletionRate = Math.round(cohort.avgCompletionRate * 100) / 100;

    return cohort;
  }).sort((a, b) => a.cohortDate.localeCompare(b.cohortDate));

  return cohorts;
}