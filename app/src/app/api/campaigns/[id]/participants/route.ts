import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/campaigns/[id]/participants
 * Получить всех участников кампании с их прогрессом
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    const { id: campaignId } = await params;

    if (!session || (session as any)?.user?.role !== "architect") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Получаем всех пользователей, назначенных на эту кампанию
    const participants = await prisma.userCampaignVariant.findMany({
      where: { campaignId },
      include: {
        user: {
          include: {
            userMissions: {
              where: {
                mission: {
                  campaignId,
                },
              },
              include: {
                mission: {
                  select: {
                    id: true,
                    name: true,
                    missionType: true,
                    experienceReward: true,
                    manaReward: true,
                  },
                },
              },
            },
            competencies: {
              include: {
                competency: true,
              },
            },
          },
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
    });

    // Подсчитываем статистику для каждого участника
    const participantsWithStats = participants.map((p) => {
      const userMissions = p.user.userMissions;
      const totalMissions = userMissions.length;
      const completedMissions = userMissions.filter(
        (um) => um.status === "COMPLETED"
      ).length;
      const inProgressMissions = userMissions.filter(
        (um) => um.status === "IN_PROGRESS"
      ).length;
      const lockedMissions = userMissions.filter(
        (um) => um.status === "LOCKED"
      ).length;

      // Последняя активность
      const lastActivity = userMissions
        .filter((um) => um.completedAt || um.startedAt)
        .sort((a, b) => {
          const dateA = a.completedAt || a.startedAt;
          const dateB = b.completedAt || b.startedAt;
          if (!dateA || !dateB) return 0;
          return dateB.getTime() - dateA.getTime();
        })[0];

      return {
        userId: p.user.id,
        email: p.user.email,
        displayName: p.user.displayName,
        avatarUrl: p.user.avatarUrl,
        assignedAt: p.assignedAt,
        stats: {
          experience: p.user.experience,
          mana: p.user.mana,
          currentRank: p.user.currentRank,
          totalMissions,
          completedMissions,
          inProgressMissions,
          lockedMissions,
          completionRate:
            totalMissions > 0
              ? Math.round((completedMissions / totalMissions) * 100)
              : 0,
        },
        lastActivity: lastActivity
          ? {
              missionName: lastActivity.mission.name,
              date: lastActivity.completedAt || lastActivity.startedAt,
              status: lastActivity.status,
            }
          : null,
        competencies: p.user.competencies.map((uc) => ({
          name: uc.competency.name,
          points: uc.points,
        })),
      };
    });

    // Общая статистика по кампании
    const totalParticipants = participantsWithStats.length;
    const activeParticipants = participantsWithStats.filter(
      (p) =>
        p.stats.completedMissions > 0 || p.stats.inProgressMissions > 0
    ).length;
    const avgCompletionRate =
      totalParticipants > 0
        ? Math.round(
            participantsWithStats.reduce(
              (sum, p) => sum + p.stats.completionRate,
              0
            ) / totalParticipants
          )
        : 0;

    return NextResponse.json({
      participants: participantsWithStats,
      summary: {
        totalParticipants,
        activeParticipants,
        avgCompletionRate,
      },
    });
  } catch (error) {
    console.error("Error fetching campaign participants:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

