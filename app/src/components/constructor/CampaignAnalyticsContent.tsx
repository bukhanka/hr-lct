"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertCircle, BarChart3, Layers3, Loader2, Sparkles, Target, Activity, Users } from "lucide-react";
import clsx from "clsx";
import { FunnelChart } from "@/components/analytics/FunnelChart";
import { GoalProgressDashboard } from "@/components/analytics/GoalProgressDashboard";
import { LiveStatusBoard } from "@/components/analytics/LiveStatusBoard";
import { UserSegmentsOverview } from "@/components/analytics/UserSegmentsOverview";

interface CampaignAnalyticsContentProps {
  campaignId: string;
}

interface FunnelMetric {
  missionId: string;
  missionName: string;
  stage: string;
  users: number;
  completed: number;
  dropOff: number;
}

interface CampaignStatsResponse {
  funnel: FunnelMetric[];
  campaignStats: {
    total_users: number;
    active_users: number;
    total_completions: number;
    overall_completion_rate: number;
  };
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
}

type AnalyticsTab = "overview" | "goals" | "live" | "segments";

export function CampaignAnalyticsContent({ campaignId }: CampaignAnalyticsContentProps) {
  const [metrics, setMetrics] = useState<CampaignStatsResponse | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("overview");

  useEffect(() => {
    async function loadMetrics() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/analytics/campaigns/${campaignId}/funnel`);
        if (!response.ok) {
          throw new Error("Не удалось получить аналитику");
        }
        const data: CampaignStatsResponse = await response.json();
        setMetrics(data);
      } catch (err) {
        console.error("[CampaignAnalyticsContent] load", err);
        setError(err instanceof Error ? err.message : "Ошибка загрузки аналитики");
      } finally {
        setIsLoading(false);
      }
    }

    loadMetrics();
  }, [campaignId]);

  const handleAiRecommendations = () => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/ai/funnel-recommendation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campaignId }),
        });
        if (!response.ok) {
          throw new Error("Не удалось получить рекомендации ИИ");
        }
        const data = await response.json();
        setRecommendations(
          data.tips.map((tip: any) => ({
            id: tip.id,
            title: tip.title,
            description: tip.summary,
            severity: tip.severity || "medium",
          }))
        );
      } catch (err) {
        console.error("[CampaignAnalyticsContent] AI", err);
        setError(err instanceof Error ? err.message : "Ошибка AI рекомендаций");
      }
    });
  };

  if (isLoading) {
    return <div className="text-indigo-200">Загружаем аналитику...</div>;
  }

  if (error || !metrics) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
        <AlertCircle size={18} />
        <span>{error || "Аналитика недоступна"}</span>
      </div>
    );
  }

  const { campaignStats, funnel } = metrics;

  // Transform funnel data for FunnelChart
  const funnelChartData = funnel.map(stage => ({
    id: stage.missionId,
    name: stage.missionName,
    users_started: stage.users,
    users_completed: stage.completed,
    users_in_progress: Math.max(0, stage.users - stage.completed),
    users_pending: 0,
    completion_rate: stage.users > 0 ? Math.round((stage.completed / stage.users) * 100) : 0,
  }));

  const tabs = [
    { id: "overview" as const, label: "Обзор", icon: BarChart3 },
    { id: "goals" as const, label: "Цели", icon: Target },
    { id: "live" as const, label: "Live Status", icon: Activity },
    { id: "segments" as const, label: "Сегменты", icon: Users },
  ];

  return (
    <div className="space-y-8">
      {/* Header with Stats */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-indigo-100/80">
          <Layers3 size={16} className="text-indigo-300" />
          <span>Общий прогресс кампании</span>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <AnalyticsStat label="Активных пользователей" value={campaignStats.active_users} />
          <AnalyticsStat label="Всего пользователей" value={campaignStats.total_users} />
          <AnalyticsStat label="Завершено миссий" value={campaignStats.total_completions} />
          <AnalyticsStat label="Конверсия" value={`${campaignStats.overall_completion_rate}%`} />
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "border-indigo-500 bg-indigo-500/20 text-white shadow-lg shadow-indigo-500/20"
                  : "border-white/10 bg-white/5 text-indigo-200/70 hover:border-white/20 hover:text-white"
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <>
          {/* Funnel visualization */}
          {funnelChartData.length > 0 && (
            <section>
              <FunnelChart data={funnelChartData} />
            </section>
          )}

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-indigo-100/80">
                <BarChart3 size={16} className="text-indigo-300" />
                <span>Воронка миссий</span>
              </div>
              <button
                onClick={handleAiRecommendations}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-200 transition hover:border-indigo-500 hover:text-white"
                disabled={isPending}
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Рекомендации ИИ
              </button>
            </div>

            <div className="space-y-4">
              {funnel.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-indigo-100/60">
                  Пока нет данных. Добавьте пользователей или активируйте тестовый режим, чтобы собрать аналитику.
                </div>
              ) : (
                funnel.map((stage) => (
                  <div key={stage.missionId} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{stage.missionName}</p>
                        <p className="text-xs text-indigo-100/70">{stage.stage}</p>
                      </div>
                      <div className="text-xs text-indigo-100/70">{stage.users} пользователей</div>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3 text-center text-xs text-indigo-100/70">
                      <div>
                        <p className="text-lg font-semibold text-white">{stage.completed}</p>
                        <p>Выполнили</p>
                      </div>
                      <div>
                        <p className={clsx("text-lg font-semibold", stage.dropOff > 30 ? "text-red-300" : stage.dropOff > 20 ? "text-yellow-300" : "text-green-300")}>{stage.dropOff}%</p>
                        <p>Отток</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-white">{stage.users - stage.completed}</p>
                        <p>Осталось</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {recommendations.length > 0 && (
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-white">Рекомендации ИИ</h3>
              <div className="mt-4 grid gap-3">
                {recommendations.map((tip) => (
                  <div
                    key={tip.id}
                    className={clsx(
                      "rounded-2xl border p-4",
                      tip.severity === "high"
                        ? "border-red-500/40 bg-red-500/10"
                        : tip.severity === "medium"
                        ? "border-yellow-500/40 bg-yellow-500/10"
                        : "border-blue-500/40 bg-blue-500/10"
                    )}
                  >
                    <p className="text-sm font-semibold text-white">{tip.title}</p>
                    <p className="mt-1 text-xs text-indigo-100/70">{tip.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {activeTab === "goals" && <GoalProgressDashboard campaignId={campaignId} />}

      {activeTab === "live" && <LiveStatusBoard campaignId={campaignId} />}

      {activeTab === "segments" && <UserSegmentsOverview campaignId={campaignId} />}
    </div>
  );
}

function AnalyticsStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

