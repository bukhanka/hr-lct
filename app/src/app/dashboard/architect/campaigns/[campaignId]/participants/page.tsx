"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Users, TrendingUp, Target, UserMinus, RotateCcw, Unlock, CheckCircle, Link2, RefreshCcw } from "lucide-react";
import { InviteLinkGenerator } from "@/components/constructor/InviteLinkGenerator";

interface Participant {
  userId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  assignedAt: string;
  stats: {
    experience: number;
    mana: number;
    currentRank: number;
    totalMissions: number;
    completedMissions: number;
    inProgressMissions: number;
    lockedMissions: number;
    completionRate: number;
  };
  lastActivity: {
    missionName: string;
    date: string;
    status: string;
  } | null;
  competencies: Array<{
    name: string;
    points: number;
  }>;
}

interface ParticipantsData {
  participants: Participant[];
  summary: {
    totalParticipants: number;
    activeParticipants: number;
    avgCompletionRate: number;
  };
}

export default function CampaignParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.campaignId as string;

  const [data, setData] = useState<ParticipantsData | null>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [campaignId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [participantsRes, campaignRes] = await Promise.all([
        fetch(`/api/campaigns/${campaignId}/participants`),
        fetch(`/api/campaigns/${campaignId}`),
      ]);

      if (participantsRes.ok) {
        const participantsData = await participantsRes.json();
        setData(participantsData);
      }

      if (campaignRes.ok) {
        const campaignData = await campaignRes.json();
        setCampaign(campaignData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, action: string) => {
    if (!confirm(`Вы уверены, что хотите выполнить действие: ${getActionLabel(action)}?`)) {
      return;
    }

    setActionLoading(userId);
    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/participants/${userId}`,
        {
          method: action === "remove" ? "DELETE" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: action !== "remove" ? JSON.stringify({ action }) : undefined,
        }
      );

      if (response.ok) {
        await loadData();
        alert("✅ Действие выполнено успешно");
      } else {
        alert("❌ Ошибка при выполнении действия");
      }
    } catch (error) {
      console.error("Error performing action:", error);
      alert("❌ Ошибка при выполнении действия");
    } finally {
      setActionLoading(null);
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "reset_progress":
        return "Сбросить прогресс";
      case "unlock_all":
        return "Разблокировать все миссии";
      case "complete_all":
        return "Завершить все миссии";
      case "remove":
        return "Удалить из кампании";
      default:
        return action;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    return date.toLocaleDateString("ru-RU");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514]">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514] p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <button
              onClick={() => router.push("/dashboard/architect")}
              className="mb-4 inline-flex items-center gap-2 text-indigo-300 hover:text-white transition"
            >
              <ArrowLeft size={20} />
              К дашборду
            </button>
            <h1 className="text-4xl font-bold text-white mb-2">
              Участники кампании
            </h1>
            <p className="text-xl text-indigo-300">
              {campaign?.name || "Загрузка..."}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition"
            >
              <RefreshCcw size={16} />
              Обновить
            </button>
            
            {campaign && (
              <InviteLinkGenerator
                campaignId={campaignId}
                campaignName={campaign.name}
                onSlugUpdate={loadData}
              />
            )}
          </div>
        </div>

        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Users className="text-blue-400" size={24} />
                </div>
                <div>
                  <div className="text-sm text-indigo-300">Всего участников</div>
                  <div className="text-3xl font-bold text-white">
                    {data.summary.totalParticipants}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <TrendingUp className="text-green-400" size={24} />
                </div>
                <div>
                  <div className="text-sm text-indigo-300">Активных</div>
                  <div className="text-3xl font-bold text-white">
                    {data.summary.activeParticipants}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Target className="text-purple-400" size={24} />
                </div>
                <div>
                  <div className="text-sm text-indigo-300">Средний прогресс</div>
                  <div className="text-3xl font-bold text-white">
                    {data.summary.avgCompletionRate}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Participants Table */}
        {data && data.participants.length > 0 ? (
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-indigo-200">
                      Участник
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-indigo-200">
                      Статистика
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-indigo-200">
                      Прогресс
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-indigo-200">
                      Последняя активность
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-indigo-200">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.participants.map((participant) => (
                    <tr
                      key={participant.userId}
                      className="border-b border-white/5 hover:bg-white/5 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                            {participant.displayName?.[0]?.toUpperCase() ||
                              participant.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white">
                              {participant.displayName || "Без имени"}
                            </div>
                            <div className="text-sm text-indigo-300">
                              {participant.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm">
                          <div className="text-amber-400">
                            ⭐ {participant.stats.experience} XP
                          </div>
                          <div className="text-blue-400">
                            💎 {participant.stats.mana} маны
                          </div>
                          <div className="text-purple-400">
                            🎖️ Ранг {participant.stats.currentRank}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-white/10 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
                                style={{
                                  width: `${participant.stats.completionRate}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-white font-medium">
                              {participant.stats.completionRate}%
                            </span>
                          </div>
                          <div className="text-xs text-indigo-300">
                            {participant.stats.completedMissions} /{" "}
                            {participant.stats.totalMissions} миссий
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {participant.lastActivity ? (
                          <div>
                            <div className="text-sm text-white truncate max-w-xs">
                              {participant.lastActivity.missionName}
                            </div>
                            <div className="text-xs text-indigo-300">
                              {formatDate(participant.lastActivity.date)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-indigo-400">
                            Нет активности
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              handleAction(participant.userId, "reset_progress")
                            }
                            disabled={actionLoading === participant.userId}
                            className="p-2 text-amber-400 hover:bg-amber-400/10 rounded-lg transition disabled:opacity-50"
                            title="Сбросить прогресс"
                          >
                            <RotateCcw size={16} />
                          </button>
                          <button
                            onClick={() =>
                              handleAction(participant.userId, "unlock_all")
                            }
                            disabled={actionLoading === participant.userId}
                            className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition disabled:opacity-50"
                            title="Разблокировать все"
                          >
                            <Unlock size={16} />
                          </button>
                          <button
                            onClick={() =>
                              handleAction(participant.userId, "remove")
                            }
                            disabled={actionLoading === participant.userId}
                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition disabled:opacity-50"
                            title="Удалить из кампании"
                          >
                            <UserMinus size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Пока нет участников
            </h3>
            <p className="text-indigo-300 mb-6">
              Создайте invite-ссылку и пригласите кадетов в кампанию
            </p>
            {campaign && (
              <InviteLinkGenerator
                campaignId={campaignId}
                campaignName={campaign.name}
                onSlugUpdate={loadData}
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}

