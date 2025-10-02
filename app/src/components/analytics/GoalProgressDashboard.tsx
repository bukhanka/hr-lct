"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Target, TrendingUp, TrendingDown, Calendar, Zap } from "lucide-react";
import clsx from "clsx";

interface GoalProgressDashboardProps {
  campaignId: string;
}

interface GoalProgressData {
  campaign: {
    id: string;
    name: string;
  };
  businessGoal: string | null;
  timeline: {
    startDate: string | null;
    endDate: string | null;
    totalDays: number | null;
    daysPassed: number | null;
    daysRemaining: number | null;
    progressPercentage: number | null;
  };
  target: {
    totalUsers: number;
    targetCompletions: number;
    targetConversionRate: number;
  };
  actual: {
    registered: number;
    withProgress: number;
    completedFullFunnel: number;
    conversionRate: number;
  };
  performance: {
    onTrack: boolean;
    status: "excellent" | "good" | "warning" | "critical";
    deviation: number;
    dailyRateNeeded: number;
    currentDailyRate: number;
  };
  projection: {
    projectedCompletions: number;
    projectedConversionRate: number;
    willMeetGoal: boolean;
  };
  funnelProgress: Array<{
    stage: string;
    description: string;
    targetRate: number;
    actualRate: number;
    usersCompleted: number;
    totalUsers: number;
    status: string;
    deviation: number;
  }>;
}

export function GoalProgressDashboard({ campaignId }: GoalProgressDashboardProps) {
  const [data, setData] = useState<GoalProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/analytics/campaigns/${campaignId}/goal-progress`);
        if (!response.ok) {
          throw new Error("Не удалось загрузить данные");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("[GoalProgressDashboard]", err);
        setError(err instanceof Error ? err.message : "Ошибка загрузки");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [campaignId]);

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-indigo-200">Загрузка прогресса к целям...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
        <AlertCircle size={18} />
        <span>{error || "Данные недоступны"}</span>
      </div>
    );
  }

  if (!data.businessGoal) {
    return null; // Не показываем, если нет бизнес-цели
  }

  const statusConfig = {
    excellent: {
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/40",
      label: "Отлично",
      icon: "🎯",
    },
    good: {
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/40",
      label: "Хорошо",
      icon: "✅",
    },
    warning: {
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/40",
      label: "Внимание",
      icon: "⚠️",
    },
    critical: {
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/40",
      label: "Критично",
      icon: "❌",
    },
  };

  const status = statusConfig[data.performance.status];
  const progressPercentage = data.target.targetCompletions > 0
    ? Math.round((data.actual.completedFullFunnel / data.target.targetCompletions) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Основной статус */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-indigo-900/30 p-6 shadow-[0_20px_60px_rgba(5,4,20,0.45)]">
        <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
        
        <div className="relative space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-indigo-200/70">
                <Target size={14} />
                <span>Прогресс к бизнес-цели</span>
              </div>
              <h3 className="mt-2 text-xl font-semibold text-white">
                {data.businessGoal}
              </h3>
            </div>

            <div
              className={clsx(
                "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium",
                status.borderColor,
                status.bgColor,
                status.color
              )}
            >
              <span>{status.icon}</span>
              <span>{status.label}</span>
            </div>
          </div>

          {/* Прогресс-бар */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-indigo-100/80">
                {data.actual.completedFullFunnel} / {data.target.targetCompletions} завершений
              </span>
              <span className={clsx("font-semibold", status.color)}>
                {progressPercentage}%
              </span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full border border-white/10 bg-white/5">
              <div
                className={clsx(
                  "absolute inset-y-0 left-0 transition-all duration-500",
                  progressPercentage >= 90
                    ? "bg-gradient-to-r from-emerald-500 to-green-400"
                    : progressPercentage >= 75
                    ? "bg-gradient-to-r from-green-500 to-emerald-400"
                    : progressPercentage >= 50
                    ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                    : "bg-gradient-to-r from-red-500 to-orange-400"
                )}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Метрики */}
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard
              label="Конверсия"
              value={`${data.actual.conversionRate}%`}
              target={`Цель: ${data.target.targetConversionRate}%`}
              trend={data.performance.deviation}
            />
            
            <MetricCard
              label="Скорость прохождения"
              value={`${data.performance.currentDailyRate} / день`}
              target={`Нужно: ${data.performance.dailyRateNeeded.toFixed(2)} / день`}
              trend={data.performance.currentDailyRate - data.performance.dailyRateNeeded}
            />

            {data.timeline.daysRemaining !== null && (
              <MetricCard
                label="Времени осталось"
                value={`${data.timeline.daysRemaining} дней`}
                target={
                  data.timeline.progressPercentage
                    ? `Прошло: ${data.timeline.progressPercentage}%`
                    : undefined
                }
                icon={<Calendar size={16} />}
              />
            )}
          </div>

          {/* Прогноз */}
          {data.projection && (
            <div
              className={clsx(
                "rounded-2xl border p-4",
                data.projection.willMeetGoal
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-amber-500/40 bg-amber-500/10"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={clsx(
                  "text-2xl",
                  data.projection.willMeetGoal ? "text-emerald-400" : "text-amber-400"
                )}>
                  {data.projection.willMeetGoal ? "📈" : "⚠️"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">
                    {data.projection.willMeetGoal
                      ? "Прогноз: Цель будет достигнута"
                      : "Прогноз: Риск недостижения цели"}
                  </p>
                  <p className="mt-1 text-xs text-indigo-100/70">
                    При текущей скорости ожидается {data.projection.projectedCompletions}{" "}
                    завершений ({data.projection.projectedConversionRate}% конверсия)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Воронка vs цели */}
      {data.funnelProgress.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center gap-2 text-sm text-indigo-100/80">
            <Zap size={16} className="text-indigo-300" />
            <span>Воронка: план vs факт</span>
          </div>

          <div className="space-y-3">
            {data.funnelProgress.map((stage, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{stage.stage}</p>
                    <p className="text-xs text-indigo-100/60">{stage.description}</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-indigo-100/70">Цель: {stage.targetRate}%</span>
                      <span
                        className={clsx(
                          "text-lg font-semibold",
                          stage.status === "excellent" || stage.status === "good"
                            ? "text-emerald-400"
                            : stage.status === "warning"
                            ? "text-amber-400"
                            : "text-red-400"
                        )}
                      >
                        {stage.actualRate}%
                      </span>
                      {stage.deviation !== 0 && (
                        <span
                          className={clsx(
                            "text-xs",
                            stage.deviation > 0 ? "text-emerald-400" : "text-red-400"
                          )}
                        >
                          {stage.deviation > 0 ? "+" : ""}
                          {stage.deviation}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-indigo-100/60">
                      {stage.usersCompleted} / {stage.totalUsers}
                    </p>
                  </div>
                </div>

                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={clsx(
                      "h-2 transition-all",
                      stage.status === "excellent" || stage.status === "good"
                        ? "bg-emerald-500"
                        : stage.status === "warning"
                        ? "bg-amber-500"
                        : "bg-red-500"
                    )}
                    style={{ width: `${Math.min(stage.actualRate, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  target,
  trend,
  icon,
}: {
  label: string;
  value: string;
  target?: string;
  trend?: number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-indigo-200/70">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-xl font-semibold text-white">{value}</p>
        {trend !== undefined && trend !== 0 && (
          <div
            className={clsx(
              "flex items-center gap-1 text-xs font-medium",
              trend > 0 ? "text-emerald-400" : "text-red-400"
            )}
          >
            {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>
              {trend > 0 ? "+" : ""}
              {typeof trend === "number" ? trend.toFixed(1) : trend}
            </span>
          </div>
        )}
      </div>
      {target && <p className="mt-1 text-xs text-indigo-100/60">{target}</p>}
    </div>
  );
}

