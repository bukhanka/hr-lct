import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/analytics/campaigns/[id]/goal-progress
 * Возвращает прогресс кампании к бизнес-целям из Campaign Brief
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authConfig);
    if (!(session as any)?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId } = await params;

    // Получаем кампанию с бизнес-контекстом
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        name: true,
        businessGoal: true,
        targetAudience: true,
        successMetrics: true,
        startDate: true,
        endDate: true,
        missions: {
          select: {
            id: true,
            userMissions: {
              select: {
                status: true,
                userId: true,
              },
            },
          },
        },
        userAssignments: {
          select: {
            userId: true,
            assignedAt: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Парсим целевые метрики
    const successMetrics = campaign.successMetrics as any;
    const targetAudience = campaign.targetAudience as any;
    const conversionFunnel = successMetrics?.conversionFunnel || [];

    // Подсчитываем фактические показатели
    const totalRegistered = campaign.userAssignments.length;
    
    // Уникальные пользователи, завершившие хотя бы одну миссию
    const usersWithProgress = new Set(
      campaign.missions.flatMap((m) =>
        m.userMissions
          .filter((um) => um.status === "COMPLETED")
          .map((um) => um.userId)
      )
    );

    // Пользователи, завершившие ВСЕ миссии
    const totalMissions = campaign.missions.length;
    const userMissionCounts = new Map<string, number>();
    
    campaign.missions.forEach((mission) => {
      mission.userMissions
        .filter((um) => um.status === "COMPLETED")
        .forEach((um) => {
          userMissionCounts.set(um.userId, (userMissionCounts.get(um.userId) || 0) + 1);
        });
    });

    const completedFullFunnel = Array.from(userMissionCounts.values()).filter(
      (count) => count === totalMissions
    ).length;

    // Конверсия
    const actualConversionRate = totalRegistered > 0 
      ? Math.round((completedFullFunnel / totalRegistered) * 100) 
      : 0;

    // Парсим целевую конверсию из metrics
    const targetConversionRate = parseTargetConversion(successMetrics?.primary);

    // Подсчитываем оставшееся время
    const now = new Date();
    const endDate = campaign.endDate ? new Date(campaign.endDate) : null;
    const startDate = campaign.startDate ? new Date(campaign.startDate) : null;
    
    const daysRemaining = endDate 
      ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    const totalDays = startDate && endDate
      ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const daysPassed = startDate
      ? Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Нужная скорость для достижения цели
    const targetTotal = targetAudience?.size || totalRegistered;
    const targetCompletions = Math.ceil(targetTotal * (targetConversionRate / 100));
    const remainingCompletions = Math.max(0, targetCompletions - completedFullFunnel);
    const dailyRateNeeded = daysRemaining && daysRemaining > 0 
      ? remainingCompletions / daysRemaining 
      : 0;

    // Текущая скорость
    const currentDailyRate = daysPassed && daysPassed > 0
      ? completedFullFunnel / daysPassed
      : 0;

    // Статус: на треке или нет
    const onTrack = actualConversionRate >= targetConversionRate * 0.9; // 10% tolerance

    // Прогноз
    const projectedTotal = daysRemaining && currentDailyRate > 0
      ? completedFullFunnel + (currentDailyRate * daysRemaining)
      : completedFullFunnel;

    const projectedConversionRate = totalRegistered > 0
      ? Math.round((projectedTotal / totalRegistered) * 100)
      : 0;

    // Фактические показатели по этапам воронки (если есть в successMetrics)
    const funnelProgress = await calculateFunnelProgress(campaign, conversionFunnel);

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
      },
      businessGoal: campaign.businessGoal,
      timeline: {
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        totalDays,
        daysPassed,
        daysRemaining,
        progressPercentage: totalDays ? Math.round((daysPassed / totalDays) * 100) : null,
      },
      target: {
        totalUsers: targetTotal,
        targetCompletions,
        targetConversionRate,
      },
      actual: {
        registered: totalRegistered,
        withProgress: usersWithProgress.size,
        completedFullFunnel,
        conversionRate: actualConversionRate,
      },
      performance: {
        onTrack,
        status: getPerformanceStatus(actualConversionRate, targetConversionRate),
        deviation: actualConversionRate - targetConversionRate,
        dailyRateNeeded,
        currentDailyRate: Math.round(currentDailyRate * 100) / 100,
      },
      projection: {
        projectedCompletions: Math.round(projectedTotal),
        projectedConversionRate,
        willMeetGoal: projectedConversionRate >= targetConversionRate,
      },
      funnelProgress,
    });
  } catch (error) {
    console.error("Error fetching goal progress:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Парсит целевую конверсию из строки типа "Конверсия в офферы: 20% (30 из 150)"
 */
function parseTargetConversion(primaryMetric: string | undefined): number {
  if (!primaryMetric) return 20; // default

  const match = primaryMetric.match(/(\d+)%/);
  return match ? parseInt(match[1]) : 20;
}

/**
 * Определяет статус выполнения: excellent, good, warning, critical
 */
function getPerformanceStatus(actual: number, target: number): string {
  const ratio = actual / target;
  
  if (ratio >= 1.0) return "excellent";
  if (ratio >= 0.9) return "good";
  if (ratio >= 0.75) return "warning";
  return "critical";
}

/**
 * Подсчитывает прогресс по каждому этапу воронки
 */
async function calculateFunnelProgress(campaign: any, targetFunnel: any[]) {
  if (!targetFunnel || targetFunnel.length === 0) {
    return [];
  }

  const totalUsers = campaign.userAssignments.length;
  const missions = campaign.missions;

  // Предполагаем, что этапы воронки соответствуют миссиям по порядку
  const funnelProgress = [];
  
  for (let i = 0; i < Math.min(targetFunnel.length, missions.length); i++) {
    const targetStage = targetFunnel[i];
    const mission = missions[i];

    const usersStarted = mission.userMissions.filter(
      (um: any) => um.status !== "LOCKED"
    ).length;

    const usersCompleted = mission.userMissions.filter(
      (um: any) => um.status === "COMPLETED"
    ).length;

    const actualRate = totalUsers > 0 ? Math.round((usersCompleted / totalUsers) * 100) : 0;
    const targetRate = targetStage.targetRate || 100;

    funnelProgress.push({
      stage: targetStage.stage,
      description: targetStage.description,
      targetRate,
      actualRate,
      usersCompleted,
      totalUsers,
      status: getPerformanceStatus(actualRate, targetRate),
      deviation: actualRate - targetRate,
    });
  }

  return funnelProgress;
}

