"use client";

import { useState, useEffect } from "react";
import { MetricCard, Section, Table } from "./widgets";
import { FunnelChart } from "@/components/analytics/FunnelChart";
import { Plus, Folder, BarChart3, MousePointerClick } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  description?: string;
  missions: any[];
}

interface AnalyticsData {
  funnel: any[];
  campaignStats: {
    total_users: number;
    active_users: number;
    total_completions: number;
    overall_completion_rate: number;
  };
}

export function ArchitectOverview() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [activeTab, setActiveTab] = useState<"constructor" | "analytics">("constructor");

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaign && activeTab === "analytics") {
      loadAnalytics();
    }
  }, [selectedCampaign, activeTab]);

  const loadCampaigns = async () => {
    console.log("[ArchitectOverview] loadCampaigns start");
    try {
      const response = await fetch("/api/campaigns");
      console.log("[ArchitectOverview] loadCampaigns response", response.status, response.statusText);
      if (response.ok) {
        const data = await response.json();
        console.log("[ArchitectOverview] loadCampaigns payload", data);
        setCampaigns(data);
        if (data.length > 0 && !selectedCampaign) {
          setSelectedCampaign(data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to load campaigns:", error);
    } finally {
      console.log("[ArchitectOverview] loadCampaigns finished");
      setIsLoading(false);
    }
  };

  const createCampaign = async () => {
    if (!newCampaignName.trim()) return;

    try {
      console.log("[ArchitectOverview] createCampaign start", { name: newCampaignName });
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCampaignName,
          description: `Геймифицированная кампания "${newCampaignName}"`,
          theme: "cosmic"
        }),
      });

      console.log("[ArchitectOverview] createCampaign response", response.status, response.statusText);
      if (response.ok) {
        const campaign = await response.json();
        console.log("[ArchitectOverview] createCampaign success", campaign);
        setCampaigns(prev => [campaign, ...prev]);
        setSelectedCampaign(campaign);
        setNewCampaignName("");
        setShowCreateModal(false);
      } else {
        console.warn("[ArchitectOverview] createCampaign failure", await response.text());
      }
    } catch (error) {
      console.error("Failed to create campaign:", error);
    }
  };

  const loadAnalytics = async () => {
    if (!selectedCampaign) return;

    setIsLoadingAnalytics(true);
    try {
      const response = await fetch(`/api/analytics/campaigns/${selectedCampaign.id}/funnel`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const handleMissionUpdate = async (mission: any) => {
    try {
      const response = await fetch(`/api/missions/${mission.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mission),
      });

      if (response.ok) {
        // Reload campaign data
        if (selectedCampaign) {
          const campaignResponse = await fetch(`/api/campaigns/${selectedCampaign.id}`);
          if (campaignResponse.ok) {
            const updatedCampaign = await campaignResponse.json();
            setSelectedCampaign(updatedCampaign);
            setCampaigns(prev => prev.map(c => c.id === updatedCampaign.id ? updatedCampaign : c));
          }
        }
      }
    } catch (error) {
      console.error("Failed to update mission:", error);
    }
  };

  const handleMissionCreate = async (missionData: any) => {
    try {
      const response = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(missionData),
      });

      if (response.ok) {
        // Reload campaign data
        if (selectedCampaign) {
          const campaignResponse = await fetch(`/api/campaigns/${selectedCampaign.id}`);
          if (campaignResponse.ok) {
            const updatedCampaign = await campaignResponse.json();
            setSelectedCampaign(updatedCampaign);
            setCampaigns(prev => prev.map(c => c.id === updatedCampaign.id ? updatedCampaign : c));
          }
        }
      }
    } catch (error) {
      console.error("Failed to create mission:", error);
    }
  };

  const handleMissionDelete = async (missionId: string) => {
    try {
      const response = await fetch(`/api/missions/${missionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Reload campaign data
        if (selectedCampaign) {
          const campaignResponse = await fetch(`/api/campaigns/${selectedCampaign.id}`);
          if (campaignResponse.ok) {
            const updatedCampaign = await campaignResponse.json();
            setSelectedCampaign(updatedCampaign);
            setCampaigns(prev => prev.map(c => c.id === updatedCampaign.id ? updatedCampaign : c));
          }
        }
      }
    } catch (error) {
      console.error("Failed to delete mission:", error);
    }
  };

  const handleDependencyCreate = async (source: string, target: string) => {
    try {
      const response = await fetch("/api/missions/dependencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceMissionId: source, targetMissionId: target }),
      });

      if (response.ok) {
        // Reload campaign data
        if (selectedCampaign) {
          const campaignResponse = await fetch(`/api/campaigns/${selectedCampaign.id}`);
          if (campaignResponse.ok) {
            const updatedCampaign = await campaignResponse.json();
            setSelectedCampaign(updatedCampaign);
          }
        }
      }
    } catch (error) {
      console.error("Failed to create dependency:", error);
    }
  };

  const handleDependencyDelete = async (source: string, target: string) => {
    try {
      const response = await fetch(
        `/api/missions/dependencies?sourceMissionId=${source}&targetMissionId=${target}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        // Reload campaign data
        if (selectedCampaign) {
          const campaignResponse = await fetch(`/api/campaigns/${selectedCampaign.id}`);
          if (campaignResponse.ok) {
            const updatedCampaign = await campaignResponse.json();
            setSelectedCampaign(updatedCampaign);
          }
        }
      }
    } catch (error) {
      console.error("Failed to delete dependency:", error);
    }
  };

  const dependencies = selectedCampaign?.missions?.flatMap(mission =>
    mission.dependenciesFrom.map((dep: any) => ({
      sourceMissionId: dep.sourceMissionId,
      targetMissionId: dep.targetMissionId,
    }))
  ) || [];

  const totalMissions = selectedCampaign?.missions?.length || 0;
  const totalRewards = selectedCampaign?.missions?.reduce(
    (acc, mission) => acc + (mission.experienceReward || 0),
    0
  ) || 0;

  if (isLoading) {
    return <div className="text-center text-indigo-200">Загрузка...</div>;
  }

  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-[0.4em] text-indigo-200/70">
          Командный центр HR-архитектора
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold text-white flex-1 min-w-[200px]">
            {selectedCampaign ? selectedCampaign.name : "Выберите кампанию"}
          </h1>
          
          <div className="flex items-center gap-3">
            {campaigns.length > 1 && (
              <select
                value={selectedCampaign?.id || ""}
                onChange={(e) => {
                  const campaign = campaigns.find(c => c.id === e.target.value);
                  setSelectedCampaign(campaign || null);
                }}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:border-indigo-400 transition-colors"
              >
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id} className="bg-gray-800">
                    {campaign.name}
                  </option>
                ))}
              </select>
            )}
            {selectedCampaign && (
              <a
                href={`/dashboard/architect/campaigns/${selectedCampaign.id}/builder`}
                className="flex items-center gap-2 px-4 py-2 border border-white/20 text-sm rounded-xl text-indigo-100/80 hover:text-white hover:border-white/40 transition-colors"
              >
                <BarChart3 size={16} />
                Открыть конструктор
              </a>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors text-sm"
            >
              <Plus size={16} />
              Новая кампания
            </button>
          </div>
        </div>
      </header>

      {!selectedCampaign ? (
        <div className="text-center py-12">
          <Folder size={48} className="mx-auto text-indigo-200/50 mb-4" />
          <p className="text-indigo-200/70 mb-4">У вас пока нет кампаний</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
          >
            Создать первую кампанию
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard 
              title="Миссий в кампании" 
              value={totalMissions.toString()} 
              description={totalMissions > 0 ? "Готово к запуску" : "Добавьте миссии"} 
            />
            <MetricCard 
              title="Общий опыт" 
              value={`${totalRewards} XP`} 
              description="Суммарная награда" 
            />
            <MetricCard 
              title="Пользователей" 
              value={analytics?.campaignStats.active_users?.toString() || "0"} 
              description="Активных кадетов" 
            />
            <MetricCard
              title="Конверсия"
              value={analytics?.campaignStats.overall_completion_rate ? `${analytics.campaignStats.overall_completion_rate}%` : "—"}
              description="Общий показатель"
            />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-indigo-100/80">
            <BarChart3 size={16} className="text-indigo-300" />
            <div className="space-y-1">
              <p className="uppercase tracking-[0.3em] text-indigo-200/70">Конструктор</p>
              <p className="text-indigo-100/80">
                Работайте в полноэкранном режиме: нажмите «Открыть конструктор» для текущей кампании.
              </p>
            </div>
          </div>

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <Section title="Аналитика кампании">
              {isLoadingAnalytics ? (
                <div className="text-center text-indigo-200 py-12">
                  Загрузка аналитики...
                </div>
              ) : analytics ? (
                <FunnelChart data={analytics.funnel} />
              ) : (
                <div className="text-center text-indigo-200/70 py-12">
                  <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="mb-4">Нет данных для аналитики</p>
                  <p className="text-sm">
                    Кадеты должны начать выполнять миссии, чтобы появились данные
                  </p>
                </div>
              )}
            </Section>
          )}

          <Section title="ИИ-ассистенты">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-indigo-100/80">
                <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">ИИ-сценарист</p>
                <p className="mt-3 text-white">
                  Помощник встроен в редактор миссий. Нажмите "ИИ-помощь" при редактировании описания миссии.
                </p>
                <p className="mt-4 text-xs text-indigo-100/70">
                  Доступно: генерация описаний в космическом стиле
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-indigo-100/80">
                <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">ИИ-дизайнер</p>
                <p className="mt-3 text-white">
                  Функция в разработке. Скоро: генерация иконок и артефактов для миссий.
                </p>
                <p className="mt-4 text-xs text-indigo-100/70">
                  Планируется интеграция с DALL-E
                </p>
              </div>
            </div>
          </Section>
        </>
      )}

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514] border border-white/20 rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Новая кампания</h3>
            
            <input
              type="text"
              value={newCampaignName}
              onChange={(e) => setNewCampaignName(e.target.value)}
              placeholder="Название кампании..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-indigo-100/40 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors mb-4"
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCampaignName("");
                }}
                className="flex-1 px-4 py-2 border border-white/20 rounded-xl text-indigo-200 hover:text-white hover:border-white/40 transition-colors"
              >
                Отменить
              </button>
              <button
                onClick={createCampaign}
                disabled={!newCampaignName.trim()}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl text-white transition-colors"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

