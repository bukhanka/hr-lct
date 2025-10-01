import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// GET /api/users/[userId]/profile - Get complete user profile
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    const { userId } = await params;
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Users can only see their own profile, or architects can see any user's profile
    if ((session as any)?.user?.id !== userId && (session as any)?.user?.role !== "architect") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get user with all related data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        competencies: {
          include: {
            competency: true
          }
        },
        userMissions: {
          include: {
            mission: {
              include: {
                campaign: true,
                competencies: {
                  include: {
                    competency: true
                  }
                }
              }
            }
          }
        },
        purchases: {
          include: {
            item: true
          },
          orderBy: { purchasedAt: "desc" },
          take: 10 // Last 10 purchases
        },
        notifications: {
          where: { isRead: false },
          orderBy: { createdAt: "desc" },
          take: 5 // Latest 5 unread notifications
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate statistics
    const totalMissions = user.userMissions.length;
    const completedMissions = user.userMissions.filter(um => um.status === "COMPLETED").length;
    const inProgressMissions = user.userMissions.filter(um => 
      ["IN_PROGRESS", "PENDING_REVIEW", "AVAILABLE"].includes(um.status)
    ).length;
    const lockedMissions = user.userMissions.filter(um => um.status === "LOCKED").length;

    // Calculate completion rate
    const completionRate = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;

    // Calculate total time spent (from startedAt to completedAt)
    const totalTimeSpent = user.userMissions
      .filter(um => um.startedAt && um.completedAt)
      .reduce((acc, um) => {
        const start = new Date(um.startedAt!).getTime();
        const end = new Date(um.completedAt!).getTime();
        return acc + (end - start);
      }, 0);

    // Average time per mission (in hours)
    const avgTimePerMission = completedMissions > 0 
      ? (totalTimeSpent / completedMissions) / (1000 * 60 * 60) 
      : 0;

    // Get current rank info
    const currentRank = await prisma.rank.findFirst({
      where: { level: user.currentRank }
    });

    // Get next rank
    const nextRank = await prisma.rank.findFirst({
      where: { level: user.currentRank + 1 }
    });

    // Calculate streak (consecutive days with completed missions)
    const missionsWithDates = user.userMissions
      .filter(um => um.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

    let currentStreak = 0;
    let lastDate: Date | null = null;

    for (const mission of missionsWithDates) {
      const completedDate = new Date(mission.completedAt!);
      completedDate.setHours(0, 0, 0, 0);

      if (!lastDate) {
        // First mission
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (completedDate.getTime() === today.getTime() || 
            completedDate.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
          currentStreak = 1;
          lastDate = completedDate;
        } else {
          break;
        }
      } else {
        const dayDiff = (lastDate.getTime() - completedDate.getTime()) / (24 * 60 * 60 * 1000);
        
        if (dayDiff === 1) {
          currentStreak++;
          lastDate = completedDate;
        } else if (dayDiff > 1) {
          break;
        }
      }
    }

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = user.userMissions
      .filter(um => um.completedAt && new Date(um.completedAt) >= sevenDaysAgo)
      .map(um => ({
        missionId: um.mission.id,
        missionName: um.mission.name,
        campaignName: um.mission.campaign?.name,
        completedAt: um.completedAt,
        experienceEarned: um.mission.experienceReward,
        manaEarned: um.mission.manaReward
      }));

    // Prepare response
    const profile = {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        experience: user.experience,
        mana: user.mana,
        currentRank: user.currentRank,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      statistics: {
        totalMissions,
        completedMissions,
        inProgressMissions,
        lockedMissions,
        completionRate: Math.round(completionRate * 10) / 10,
        currentStreak,
        avgTimePerMission: Math.round(avgTimePerMission * 10) / 10,
        totalPurchases: user.purchases.length,
        unreadNotifications: user.notifications.length
      },
      competencies: user.competencies.map(uc => ({
        id: uc.competency.id,
        name: uc.competency.name,
        icon: uc.competency.iconUrl,
        points: uc.points
      })),
      ranks: {
        current: currentRank,
        next: nextRank
      },
      recentPurchases: user.purchases.map(p => ({
        id: p.id,
        item: p.item,
        purchasedAt: p.purchasedAt
      })),
      recentNotifications: user.notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        metadata: n.metadata,
        createdAt: n.createdAt
      })),
      recentActivity
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

