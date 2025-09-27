import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    const { userId } = await params;
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Users can only see their own rank progress, or architects can see any user's progress
    if ((session as any)?.user?.id !== userId && (session as any)?.user?.role !== "architect") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get user data with completed missions and competencies
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userMissions: {
          where: { status: "COMPLETED" },
          include: {
            mission: {
              include: {
                competencies: {
                  include: {
                    competency: true
                  }
                }
              }
            }
          }
        },
        competencies: {
          include: {
            competency: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current and next rank
    const currentRank = await prisma.rank.findUnique({
      where: { level: user.currentRank }
    });

    const nextRank = await prisma.rank.findUnique({
      where: { level: user.currentRank + 1 }
    });

    // Calculate user's competency totals
    const competencyTotals = user.competencies.reduce((acc, userComp) => {
      acc[userComp.competency.name] = userComp.points;
      return acc;
    }, {} as Record<string, number>);

    // Check if user meets requirements for next rank
    let isReadyForPromotion = false;
    let missingRequirements: string[] = [];

    if (nextRank) {
      const requirements = nextRank.requiredCompetencies as Record<string, number> || {};
      
      // Check experience requirement
      if (user.experience < nextRank.minExperience) {
        missingRequirements.push(`Не хватает опыта: ${user.experience}/${nextRank.minExperience} XP`);
      }

      // Check missions requirement
      const completedMissionCount = user.userMissions.length;
      if (completedMissionCount < nextRank.minMissions) {
        missingRequirements.push(`Не хватает миссий: ${completedMissionCount}/${nextRank.minMissions}`);
      }

      // Check competency requirements
      for (const [competencyName, requiredPoints] of Object.entries(requirements)) {
        const userPoints = competencyTotals[competencyName] || 0;
        if (userPoints < requiredPoints) {
          missingRequirements.push(`${competencyName}: ${userPoints}/${requiredPoints} очков`);
        }
      }

      isReadyForPromotion = missingRequirements.length === 0;
    }

    return NextResponse.json({
      currentRank,
      nextRank,
      progress: {
        experience: user.experience,
        missionsCompleted: user.userMissions.length,
        competencies: competencyTotals,
        nextRankExperience: nextRank?.minExperience || 0,
        nextRankMissions: nextRank?.minMissions || 0,
        progressPercentage: nextRank ? 
          Math.min((user.experience / nextRank.minExperience) * 100, 100) : 100
      },
      isReadyForPromotion,
      missingRequirements,
      canPromote: nextRank !== null
    });
  } catch (error) {
    console.error("Error fetching user rank progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Promote user to next rank (for admin/architect use)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    const { userId } = await params;
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only architects can promote users
    if ((session as any)?.user?.role !== "architect") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const nextRank = await prisma.rank.findUnique({
      where: { level: user.currentRank + 1 }
    });

    if (!nextRank) {
      return NextResponse.json({ error: "No higher rank available" }, { status: 400 });
    }

    // Update user rank
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { currentRank: nextRank.level }
    });

    // Give rank promotion rewards
    const rewards = nextRank.rewards as { mana?: number; badge?: string } || {};
    if (rewards.mana) {
      await prisma.user.update({
        where: { id: userId },
        data: { mana: { increment: rewards.mana } }
      });
    }

    // Create notification
    await prisma.userNotification.create({
      data: {
        userId,
        type: "RANK_UP",
        title: `Повышение до ранга "${nextRank.name}"!`,
        message: `Поздравляем! Вы достигли ранга ${nextRank.name} - ${nextRank.title}. ${rewards.mana ? `Получено ${rewards.mana} маны в награду.` : ''}`,
        metadata: { rankId: nextRank.id, rewards }
      }
    });

    return NextResponse.json({
      success: true,
      newRank: nextRank,
      rewards,
      user: updatedUser
    });
  } catch (error) {
    console.error("Error promoting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
