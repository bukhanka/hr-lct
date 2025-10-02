import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/analytics/campaigns/[id]/segments
 * Возвращает сегментацию пользователей кампании по активности
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId } = await params;

    // Получаем всех участников кампании с их миссиями
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
                mission: true,
              },
              orderBy: {
                completedAt: "desc",
              },
            },
          },
        },
      },
    });

    // Пороги для сегментации (в часах)
    const ACTIVE_THRESHOLD_HOURS = 24;
    const IN_PROGRESS_THRESHOLD_DAYS = 7;
    const STALLED_THRESHOLD_DAYS = 7;
    const DROPPED_THRESHOLD_DAYS = 30;

    const now = new Date();
    const segments = {
      activeChampions: [] as any[],
      inProgress: [] as any[],
      stalled: [] as any[],
      droppedOff: [] as any[],
    };

    participants.forEach((participant) => {
      const user = participant.user;
      const missions = user.userMissions;

      const completedMissions = missions.filter((m) => m.status === "COMPLETED");
      const totalMissions = missions.length;

      // Находим последнюю активность
      const lastActivity = missions
        .filter((m) => m.completedAt || m.startedAt)
        .sort((a, b) => {
          const dateA = a.completedAt || a.startedAt;
          const dateB = b.completedAt || b.startedAt;
          if (!dateA || !dateB) return 0;
          return dateB.getTime() - dateA.getTime();
        })[0];

      const lastActivityDate = lastActivity?.completedAt || lastActivity?.startedAt;
      const hoursSinceActivity = lastActivityDate
        ? (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60)
        : Infinity;

      const daysSinceActivity = hoursSinceActivity / 24;

      const userData = {
        userId: user.id,
        email: user.email,
        displayName: user.displayName,
        completedMissions: completedMissions.length,
        totalMissions,
        lastActivity: lastActivityDate,
        daysSinceActivity: Math.round(daysSinceActivity * 10) / 10,
      };

      // Сегментация
      if (completedMissions.length >= 3 && hoursSinceActivity <= ACTIVE_THRESHOLD_HOURS) {
        // Active Champions: >3 миссии + активны в последние 24ч
        segments.activeChampions.push(userData);
      } else if (
        completedMissions.length >= 1 &&
        completedMissions.length <= 2 &&
        daysSinceActivity <= IN_PROGRESS_THRESHOLD_DAYS
      ) {
        // In Progress: 1-2 миссии + активны в последние 7 дней
        segments.inProgress.push(userData);
      } else if (
        daysSinceActivity > STALLED_THRESHOLD_DAYS &&
        daysSinceActivity <= DROPPED_THRESHOLD_DAYS
      ) {
        // Stalled: нет активности >7 дней, но <30 дней
        segments.stalled.push(userData);
      } else if (daysSinceActivity > DROPPED_THRESHOLD_DAYS) {
        // Dropped Off: нет активности >30 дней
        segments.droppedOff.push(userData);
      } else {
        // Если не попали ни в одну категорию, добавляем в In Progress
        segments.inProgress.push(userData);
      }
    });

    const totalParticipants = participants.length;

    return NextResponse.json({
      totalParticipants,
      segments: {
        activeChampions: {
          count: segments.activeChampions.length,
          percentage:
            totalParticipants > 0
              ? Math.round((segments.activeChampions.length / totalParticipants) * 100)
              : 0,
          users: segments.activeChampions,
          description: ">3 миссии, активны <24ч",
          color: "#10b981", // green
          icon: "🚀",
        },
        inProgress: {
          count: segments.inProgress.length,
          percentage:
            totalParticipants > 0
              ? Math.round((segments.inProgress.length / totalParticipants) * 100)
              : 0,
          users: segments.inProgress,
          description: "1-2 миссии, активны <7 дней",
          color: "#3b82f6", // blue
          icon: "🔄",
        },
        stalled: {
          count: segments.stalled.length,
          percentage:
            totalParticipants > 0
              ? Math.round((segments.stalled.length / totalParticipants) * 100)
              : 0,
          users: segments.stalled,
          description: "Нет активности 7-30 дней",
          color: "#f59e0b", // amber
          icon: "⏸️",
        },
        droppedOff: {
          count: segments.droppedOff.length,
          percentage:
            totalParticipants > 0
              ? Math.round((segments.droppedOff.length / totalParticipants) * 100)
              : 0,
          users: segments.droppedOff,
          description: "Не вернулись >30 дней",
          color: "#ef4444", // red
          icon: "❌",
        },
      },
      insights: generateInsights(segments, totalParticipants),
    });
  } catch (error) {
    console.error("Error fetching user segments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Генерирует insights на основе сегментов
 */
function generateInsights(segments: any, total: number) {
  const insights = [];

  const stalledPercentage = total > 0 ? (segments.stalled.length / total) * 100 : 0;
  const droppedPercentage = total > 0 ? (segments.droppedOff.length / total) * 100 : 0;
  const activePercentage = total > 0 ? (segments.activeChampions.length / total) * 100 : 0;

  if (stalledPercentage > 20) {
    insights.push({
      type: "warning",
      title: "Высокий процент застрявших пользователей",
      description: `${stalledPercentage.toFixed(0)}% пользователей не проявляли активность 7-30 дней. Рассмотрите отправку напоминаний.`,
      action: "send_reminder",
    });
  }

  if (droppedPercentage > 15) {
    insights.push({
      type: "critical",
      title: "Критический отток пользователей",
      description: `${droppedPercentage.toFixed(0)}% пользователей не возвращались >30 дней. Проанализируйте, где они застревают.`,
      action: "analyze_dropoff",
    });
  }

  if (activePercentage > 40) {
    insights.push({
      type: "success",
      title: "Отличная активность!",
      description: `${activePercentage.toFixed(0)}% пользователей активно проходят кампанию. Продолжайте в том же духе!`,
      action: null,
    });
  }

  return insights;
}

