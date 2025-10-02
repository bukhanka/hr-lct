"use client";

import { useEffect, useState } from "react";
import { Activity, AlertCircle, Clock, TrendingUp, Users, Zap } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";

interface LiveStatusBoardProps {
  campaignId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // в секундах
}

interface LiveStatusData {
  timestamp: string;
  activeNow: {
    count: number;
    users: Array<{
      userId: string;
      userName: string;
      missionId: string;
      missionName: string;
      startedAt: string | null;
    }>;
  };
  activeLastHour: {
    count: number;
  };
  activeToday: {
    count: number;
  };
  newToday: {
    count: number;
    users: Array<{
      userId: string;
      userName: string;
      joinedAt: string;
    }>;
  };
  stuckUsers: {
    count: number;
    users: Array<{
      userId: string;
      userName: string;
      missionId: string;
      missionName: string;
      daysStuck: number;
    }>;
  };
  activityByDay: Array<{
    date: string;
    count: number;
  }>;
  topActiveMissions: Array<{
    missionId: string;
    missionName: string;
    activityCount: number;
    completedToday: number;
  }>;
}

export function LiveStatusBoard({
  campaignId,
  autoRefresh = true,
  refreshInterval = 30,
}: LiveStatusBoardProps) {
  const [data, setData] = useState<LiveStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const loadData = async () => {
    try {
      const response = await fetch(`/api/analytics/campaigns/${campaignId}/live-status`);
      if (!response.ok) {
        throw new Error("Не удалось загрузить данные");
      }
      const result = await response.json();
      setData(result);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error("[LiveStatusBoard]", err);
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    if (autoRefresh) {
      const interval = setInterval(loadData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [campaignId, autoRefresh, refreshInterval]);

  if (isLoading && !data) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-indigo-200">Загрузка live status...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
        <AlertCircle size={18} />
        <span>{error}</span>
      </div>
    );
  }

  if (!data) return null;

  const formatTimeAgo = (date: string | null) => {
    if (!date) return "—";
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "только что";
    if (minutes < 60) return `${minutes} мин назад`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ч назад`;
    return `${Math.floor(hours / 24)} дн назад`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-emerald-900/30 via-green-900/20 to-emerald-900/30 p-6">
        <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
              <Activity size={24} className="text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">Live Status</h3>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  <span className="text-xs text-emerald-300">В реальном времени</span>
                </div>
              </div>
              {lastUpdate && (
                <p className="text-xs text-indigo-100/60">
                  Обновлено: {lastUpdate.toLocaleTimeString("ru-RU")}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={loadData}
            className="text-xs text-emerald-200 hover:text-white transition"
          >
            🔄 Обновить
          </button>
        </div>

        {/* Главные метрики */}
        <div className="relative mt-6 grid gap-4 sm:grid-cols-4">
          <LiveMetric
            icon={<Zap size={16} className="text-emerald-400" />}
            label="Прямо сейчас"
            value={data.activeNow.count}
            subtext="в миссии"
            highlight
          />
          <LiveMetric
            icon={<Clock size={16} className="text-blue-400" />}
            label="За последний час"
            value={data.activeLastHour.count}
            subtext="активных"
          />
          <LiveMetric
            icon={<Users size={16} className="text-purple-400" />}
            label="Сегодня активны"
            value={data.activeToday.count}
            subtext="человек"
          />
          <LiveMetric
            icon={<TrendingUp size={16} className="text-cyan-400" />}
            label="Новых за 24ч"
            value={data.newToday.count}
            subtext="присоединились"
          />
        </div>
      </div>

      {/* Предупреждения */}
      {data.stuckUsers.count > 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                {data.stuckUsers.count} кадетов застряли на миссиях
              </p>
              <div className="mt-2 space-y-1">
                {data.stuckUsers.users.slice(0, 3).map((user) => (
                  <div key={user.userId} className="text-xs text-indigo-100/70">
                    <span className="font-medium text-white">{user.userName}</span> •{" "}
                    {user.missionName} • {user.daysStuck} дней
                  </div>
                ))}
                {data.stuckUsers.count > 3 && (
                  <Link
                    href={`/dashboard/architect/campaigns/${campaignId}/participants`}
                    className="text-xs text-amber-200 hover:text-white"
                  >
                    Ещё {data.stuckUsers.count - 3} →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Детали */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Активные прямо сейчас */}
        {data.activeNow.count > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h4 className="mb-3 text-sm font-semibold text-white">
              🔥 Активны прямо сейчас ({data.activeNow.count})
            </h4>
            <div className="space-y-2">
              {data.activeNow.users.slice(0, 5).map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between rounded-lg bg-white/5 p-2 text-xs"
                >
                  <div>
                    <div className="font-medium text-white">{user.userName}</div>
                    <div className="text-indigo-100/60">{user.missionName}</div>
                  </div>
                  <div className="text-indigo-100/60">
                    {formatTimeAgo(user.startedAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Топ активные миссии */}
        {data.topActiveMissions.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h4 className="mb-3 text-sm font-semibold text-white">
              📊 Самые активные миссии сегодня
            </h4>
            <div className="space-y-2">
              {data.topActiveMissions.map((mission, index) => (
                <div
                  key={mission.missionId}
                  className="flex items-center justify-between rounded-lg bg-white/5 p-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={clsx(
                        "flex h-6 w-6 items-center justify-center rounded-full font-semibold",
                        index === 0 && "bg-amber-500/20 text-amber-400",
                        index === 1 && "bg-slate-400/20 text-slate-300",
                        index === 2 && "bg-orange-500/20 text-orange-400"
                      )}
                    >
                      {index + 1}
                    </div>
                    <div className="font-medium text-white">{mission.missionName}</div>
                  </div>
                  <div className="text-indigo-100/60">
                    {mission.completedToday}/{mission.activityCount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* График активности за 7 дней */}
      {data.activityByDay.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h4 className="mb-3 text-sm font-semibold text-white">
            📅 Активность за последние 7 дней
          </h4>
          <div className="flex items-end gap-2 h-32">
            {data.activityByDay.map((day) => {
              const maxCount = Math.max(...data.activityByDay.map((d) => d.count));
              const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
              
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-indigo-500 to-purple-500 transition-all hover:from-indigo-400 hover:to-purple-400"
                    style={{ height: `${height}%` }}
                    title={`${day.date}: ${day.count} активностей`}
                  />
                  <div className="text-[10px] text-indigo-200/60">
                    {new Date(day.date).toLocaleDateString("ru-RU", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function LiveMetric({
  icon,
  label,
  value,
  subtext,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  subtext: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border p-3",
        highlight
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-white/10 bg-black/20"
      )}
    >
      <div className="flex items-center gap-2 text-xs text-indigo-200/70">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white">{value}</span>
        <span className="text-xs text-indigo-100/60">{subtext}</span>
      </div>
    </div>
  );
}

