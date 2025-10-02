"use client";

import { useEffect, useState } from "react";
import { X, Mail, Award, TrendingUp, Calendar, CheckCircle, Lock, Loader2, Clock, Star, Gem, Shield } from "lucide-react";
import clsx from "clsx";

interface ParticipantDetailModalProps {
  userId: string;
  campaignId: string;
  onClose: () => void;
}

interface UserDetail {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  experience: number;
  mana: number;
  currentRank: number;
  stats: {
    totalMissions: number;
    completedMissions: number;
    inProgressMissions: number;
    lockedMissions: number;
    completionRate: number;
  };
  missions: Array<{
    id: string;
    name: string;
    missionType: string;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
    experienceReward: number;
    manaReward: number;
  }>;
  competencies: Array<{
    name: string;
    points: number;
  }>;
}

export function ParticipantDetailModal({
  userId,
  campaignId,
  onClose,
}: ParticipantDetailModalProps) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserDetail() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/users/${userId}/profile`);
        if (!response.ok) {
          throw new Error("Не удалось загрузить данные пользователя");
        }
        const data = await response.json();
        
        // Фильтруем только миссии из этой кампании
        const campaignMissions = data.missions.filter(
          (m: any) => m.mission.campaign.id === campaignId
        );

        setUser({
          id: data.id,
          email: data.email,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl,
          experience: data.experience,
          mana: data.mana,
          currentRank: data.currentRank,
          stats: data.stats,
          missions: campaignMissions.map((um: any) => ({
            id: um.mission.id,
            name: um.mission.name,
            missionType: um.mission.missionType,
            status: um.status,
            startedAt: um.startedAt,
            completedAt: um.completedAt,
            experienceReward: um.mission.experienceReward,
            manaReward: um.mission.manaReward,
          })),
          competencies: data.competencies,
        });
      } catch (err) {
        console.error("[ParticipantDetailModal]", err);
        setError(err instanceof Error ? err.message : "Ошибка загрузки");
      } finally {
        setIsLoading(false);
      }
    }

    loadUserDetail();
  }, [userId, campaignId]);

  const formatDate = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: any }> = {
      COMPLETED: { label: "Выполнено", color: "text-emerald-400", icon: CheckCircle },
      IN_PROGRESS: { label: "В процессе", color: "text-blue-400", icon: Loader2 },
      PENDING_REVIEW: { label: "На проверке", color: "text-amber-400", icon: Clock },
      AVAILABLE: { label: "Доступна", color: "text-purple-400", icon: TrendingUp },
      LOCKED: { label: "Заблокирована", color: "text-slate-400", icon: Lock },
    };
    return configs[status] || { label: status, color: "text-white", icon: Calendar };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b0924] to-[#050514] p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-indigo-200 hover:text-white transition"
        >
          <X size={24} />
        </button>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-indigo-400" />
          </div>
        ) : error || !user ? (
          <div className="py-12 text-center text-red-200">{error || "Данные недоступны"}</div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-2xl font-bold text-white">
                {user.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">
                  {user.displayName || "Без имени"}
                </h2>
                <div className="mt-1 flex items-center gap-2 text-sm text-indigo-300">
                  <Mail size={14} />
                  <span>{user.email}</span>
                </div>
                <div className="mt-2 flex gap-3">
                  <span className="flex items-center gap-1 text-sm text-amber-400">
                    <Star size={14} /> {user.experience} XP
                  </span>
                  <span className="flex items-center gap-1 text-sm text-blue-400">
                    <Gem size={14} /> {user.mana} маны
                  </span>
                  <span className="flex items-center gap-1 text-sm text-purple-400">
                    <Shield size={14} /> Ранг {user.currentRank}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard
                label="Прогресс"
                value={`${user.stats.completedMissions}/${user.stats.totalMissions}`}
                percentage={user.stats.completionRate}
              />
              <StatCard
                label="В процессе"
                value={user.stats.inProgressMissions}
                color="text-blue-400"
              />
              <StatCard
                label="Заблокировано"
                value={user.stats.lockedMissions}
                color="text-slate-400"
              />
            </div>

            {/* Competencies */}
            {user.competencies.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <Award size={16} />
                  Компетенции
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {user.competencies.map((comp) => (
                    <div
                      key={comp.name}
                      className="flex items-center justify-between rounded-lg bg-white/5 p-2 text-xs"
                    >
                      <span className="text-indigo-100">{comp.name}</span>
                      <span className="font-semibold text-white">{comp.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mission Timeline */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <Calendar size={16} />
                Timeline активности
              </h3>
              <div className="space-y-2">
                {user.missions
                  .sort((a, b) => {
                    // Сортируем по completedAt или startedAt
                    const dateA = a.completedAt || a.startedAt;
                    const dateB = b.completedAt || b.startedAt;
                    if (!dateA) return 1;
                    if (!dateB) return -1;
                    return new Date(dateB).getTime() - new Date(dateA).getTime();
                  })
                  .map((mission) => {
                    const statusConfig = getStatusConfig(mission.status);
                    const Icon = statusConfig.icon;

                    return (
                      <div
                        key={mission.id}
                        className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-3"
                      >
                        <div className={clsx("mt-0.5", statusConfig.color)}>
                          <Icon
                            size={16}
                            className={mission.status === "IN_PROGRESS" ? "animate-spin" : ""}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-sm font-medium text-white">
                                {mission.name}
                              </div>
                              <div className={clsx("text-xs", statusConfig.color)}>
                                {statusConfig.label}
                              </div>
                            </div>
                            <div className="text-right text-xs text-indigo-100/60">
                              {mission.completedAt
                                ? formatDate(mission.completedAt)
                                : mission.startedAt
                                ? `Начато ${formatDate(mission.startedAt)}`
                                : "—"}
                            </div>
                          </div>
                          {mission.status === "COMPLETED" && (
                            <div className="mt-2 flex gap-3 text-xs">
                              <span className="text-amber-400">+{mission.experienceReward} XP</span>
                              <span className="text-blue-400">+{mission.manaReward} маны</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  percentage,
  color = "text-white",
}: {
  label: string;
  value: string | number;
  percentage?: number;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="text-xs text-indigo-200/70">{label}</div>
      <div className={clsx("mt-1 text-xl font-bold", color)}>{value}</div>
      {percentage !== undefined && (
        <div className="mt-1 text-xs text-indigo-100/60">{percentage}%</div>
      )}
    </div>
  );
}

