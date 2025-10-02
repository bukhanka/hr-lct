import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/analytics/campaigns/[id]/live-status?days=14
 * Возвращает реальное время статус активности в кампании
 * Query параметры:
 * - days: количество дней для графика активности (7, 14, 30), по умолчанию 14
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId } = await params;
    
    // Получаем параметр days из query string
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : 14;
    const validDays = [7, 14, 30].includes(days) ? days : 14;

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last1h = new Date(now.getTime() - 60 * 60 * 1000);
    const lastNdays = new Date(now.getTime() - validDays * 24 * 60 * 60 * 1000);

    // Получаем все миссии кампании с активностью пользователей
    const missions = await prisma.mission.findMany({
      where: { campaignId },
      include: {
        userMissions: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    console.log(`[Live Status] Campaign ${campaignId}: fetched missions`, {
      missionCount: missions.length,
      sampleUserMissionStatuses: missions
        .flatMap((mission) => mission.userMissions)
        .slice(0, 5)
        .map((um) => ({
          status: um.status,
          startedAt: um.startedAt,
          completedAt: um.completedAt,
        })),
    });

    // Пользователи, активные прямо сейчас (в процессе миссии)
    const activeNow = missions.flatMap((m) =>
      m.userMissions
        .filter((um) => um.status === "IN_PROGRESS")
        .map((um) => ({
          userId: um.user.id,
          userName: um.user.displayName || um.user.email,
          missionId: m.id,
          missionName: m.name,
          startedAt: um.startedAt,
        }))
    );

    // Уникальные пользователи, активные в последний час
    const activeLastHourUserIds = new Set(
      missions.flatMap((m) =>
        m.userMissions
          .filter(
            (um) =>
              (um.completedAt && um.completedAt >= last1h) ||
              (um.startedAt && um.startedAt >= last1h)
          )
          .map((um) => um.user.id)
      )
    );

    // Уникальные пользователи, активные за последние 24ч
    const activeToday = missions.flatMap((m) =>
      m.userMissions.filter(
        (um) =>
          (um.completedAt && um.completedAt >= last24h) ||
          (um.startedAt && um.startedAt >= last24h)
      )
    );
    const activeTodayUserIds = new Set(activeToday.map((um) => um.user.id));

    // Новые пользователи за последние 24ч
    const newUsers = await prisma.userCampaignVariant.findMany({
      where: {
        campaignId,
        assignedAt: { gte: last24h },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    // Пользователи, застрявшие на миссиях (>5 дней)
    const stuckThreshold = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const stuckUsers = missions.flatMap((m) =>
      m.userMissions
        .filter(
          (um) =>
            um.status === "IN_PROGRESS" &&
            um.startedAt &&
            um.startedAt < stuckThreshold
        )
        .map((um) => {
          const daysStuck = um.startedAt
            ? Math.floor(
                (now.getTime() - um.startedAt.getTime()) / (1000 * 60 * 60 * 24)
              )
            : 0;
          return {
            userId: um.user.id,
            userName: um.user.displayName || um.user.email,
            missionId: m.id,
            missionName: m.name,
            daysStuck,
          };
        })
    );

    // Активность за последние N дней (по дням)
    const activityByDay = await calculateActivityByDay(campaignId, lastNdays, now);

    console.log(`[Live Status] Campaign ${campaignId}: aggregates`, {
      activeNowCount: activeNow.length,
      activeLastHour: activeLastHourUserIds.size,
      activeToday: activeTodayUserIds.size,
      activityDays: activityByDay.length,
      totalActivityCount: activityByDay.reduce((sum, day) => sum + day.count, 0)
    });

    // Топ-3 самых активных миссии сегодня
    const missionActivity = missions.map((m) => {
      const todayActivity = m.userMissions.filter(
        (um) =>
          (um.completedAt && um.completedAt >= last24h) ||
          (um.startedAt && um.startedAt >= last24h)
      );
      return {
        missionId: m.id,
        missionName: m.name,
        activityCount: todayActivity.length,
        completedToday: todayActivity.filter((um) => um.status === "COMPLETED")
          .length,
      };
    });

    const topActiveMissions = missionActivity
      .sort((a, b) => b.activityCount - a.activityCount)
      .slice(0, 3);

    return NextResponse.json({
      timestamp: now,
      activeNow: {
        count: activeNow.length,
        users: activeNow,
      },
      activeLastHour: {
        count: activeLastHourUserIds.size,
      },
      activeToday: {
        count: activeTodayUserIds.size,
      },
      newToday: {
        count: newUsers.length,
        users: newUsers.map((u) => ({
          userId: u.user.id,
          userName: u.user.displayName || u.user.email,
          joinedAt: u.assignedAt,
        })),
      },
      stuckUsers: {
        count: stuckUsers.length,
        users: stuckUsers,
      },
      activityByDay,
      topActiveMissions,
    });
  } catch (error) {
    console.error("Error fetching live status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Рассчитывает активность по дням
 */
async function calculateActivityByDay(
  campaignId: string,
  startDate: Date,
  endDate: Date
) {
  const missions = await prisma.mission.findMany({
    where: { campaignId },
    include: {
      userMissions: {
        where: {
          OR: [
            { completedAt: { gte: startDate, lte: endDate } },
            { startedAt: { gte: startDate, lte: endDate } },
          ],
        },
      },
    },
  });

  // Группируем по дням
  const dayMap = new Map<string, number>();
  
  missions.forEach((mission) => {
    mission.userMissions.forEach((um) => {
      const date = um.completedAt || um.startedAt;
      if (date) {
        const dayKey = date.toISOString().split("T")[0];
        dayMap.set(dayKey, (dayMap.get(dayKey) || 0) + 1);
      }
    });
  });

  // Преобразуем в массив
  const result = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayKey = currentDate.toISOString().split("T")[0];
    result.push({
      date: dayKey,
      count: dayMap.get(dayKey) || 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

