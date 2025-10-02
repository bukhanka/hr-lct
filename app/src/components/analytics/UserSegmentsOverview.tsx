"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Users, TrendingUp, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";

interface UserSegmentsOverviewProps {
  campaignId: string;
}

interface SegmentData {
  count: number;
  percentage: number;
  users: Array<{
    userId: string;
    email: string;
    displayName: string | null;
    completedMissions: number;
    totalMissions: number;
    lastActivity: string | null;
    daysSinceActivity: number;
  }>;
  description: string;
  color: string;
  icon: string;
}

interface UserSegmentsData {
  totalParticipants: number;
  segments: {
    activeChampions: SegmentData;
    inProgress: SegmentData;
    stalled: SegmentData;
    droppedOff: SegmentData;
  };
  insights: Array<{
    type: "success" | "warning" | "critical";
    title: string;
    description: string;
    action: string | null;
  }>;
}

export function UserSegmentsOverview({ campaignId }: UserSegmentsOverviewProps) {
  const [data, setData] = useState<UserSegmentsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/analytics/campaigns/${campaignId}/segments`);
        if (!response.ok) {
          throw new Error("Не удалось загрузить сегменты");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("[UserSegmentsOverview]", err);
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
        <div className="flex items-center gap-2 text-indigo-200">
          <Loader2 size={16} className="animate-spin" />
          <span>Загрузка сегментации...</span>
        </div>
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

  if (data.totalParticipants === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-center text-indigo-200">
          <Users size={48} className="mx-auto mb-3 text-indigo-300" />
          <p>Пока нет участников в кампании</p>
          <Link
            href={`/dashboard/architect/campaigns/${campaignId}/participants`}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-200 transition hover:border-indigo-500"
          >
            Пригласить участников
          </Link>
        </div>
      </div>
    );
  }

  const segments = [
    {
      key: "activeChampions" as const,
      data: data.segments.activeChampions,
      borderColor: "border-emerald-500/40",
      bgColor: "bg-emerald-500/10",
    },
    {
      key: "inProgress" as const,
      data: data.segments.inProgress,
      borderColor: "border-blue-500/40",
      bgColor: "bg-blue-500/10",
    },
    {
      key: "stalled" as const,
      data: data.segments.stalled,
      borderColor: "border-amber-500/40",
      bgColor: "bg-amber-500/10",
    },
    {
      key: "droppedOff" as const,
      data: data.segments.droppedOff,
      borderColor: "border-red-500/40",
      bgColor: "bg-red-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Insights */}
      {data.insights.length > 0 && (
        <div className="space-y-3">
          {data.insights.map((insight, index) => (
            <div
              key={index}
              className={clsx(
                "flex items-start gap-3 rounded-2xl border p-4",
                insight.type === "success" && "border-emerald-500/40 bg-emerald-500/10",
                insight.type === "warning" && "border-amber-500/40 bg-amber-500/10",
                insight.type === "critical" && "border-red-500/40 bg-red-500/10"
              )}
            >
              <div className="text-2xl">
                {insight.type === "success" && "✅"}
                {insight.type === "warning" && "⚠️"}
                {insight.type === "critical" && "❌"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{insight.title}</p>
                <p className="mt-1 text-xs text-indigo-100/70">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Сегменты */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-indigo-100/80">
            <Users size={16} className="text-indigo-300" />
            <span>Сегментация участников</span>
          </div>
          <Link
            href={`/dashboard/architect/campaigns/${campaignId}/participants`}
            className="text-xs text-indigo-200 hover:text-white transition"
          >
            Смотреть всех →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {segments.map((segment) => (
            <SegmentCard
              key={segment.key}
              icon={segment.data.icon}
              count={segment.data.count}
              percentage={segment.data.percentage}
              description={segment.data.description}
              borderColor={segment.borderColor}
              bgColor={segment.bgColor}
            />
          ))}
        </div>

        {/* Распределение */}
        <div className="mt-6">
          <div className="mb-2 text-xs text-indigo-200/70">Распределение ({data.totalParticipants} всего)</div>
          <div className="flex h-4 w-full overflow-hidden rounded-full border border-white/10">
            {segments.map((segment, index) => {
              if (segment.data.count === 0) return null;
              return (
                <div
                  key={segment.key}
                  className="relative group"
                  style={{
                    width: `${segment.data.percentage}%`,
                    backgroundColor: segment.data.color,
                  }}
                  title={`${segment.data.description}: ${segment.data.count} (${segment.data.percentage}%)`}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {segment.data.icon} {segment.data.count} ({segment.data.percentage}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SegmentCard({
  icon,
  count,
  percentage,
  description,
  borderColor,
  bgColor,
}: {
  icon: string;
  count: number;
  percentage: number;
  description: string;
  borderColor: string;
  bgColor: string;
}) {
  return (
    <div className={clsx("rounded-2xl border p-4", borderColor, bgColor)}>
      <div className="flex items-center gap-3 mb-2">
        <div className="text-2xl">{icon}</div>
        <div>
          <div className="text-2xl font-bold text-white">{count}</div>
          <div className="text-xs text-indigo-100/70">{percentage}%</div>
        </div>
      </div>
      <p className="text-xs text-indigo-100/70">{description}</p>
    </div>
  );
}

