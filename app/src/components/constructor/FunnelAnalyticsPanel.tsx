"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, TrendingDown, Sparkles, AlertTriangle } from "lucide-react";
import clsx from "clsx";

interface FunnelAnalyticsPanelProps {
  campaignId: string;
}

interface FunnelMetrics {
  personas: Array<{
    id: string;
    name: string;
    entry: number;
    progress: number;
    completion: number;
    dropOff: number;
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    severity: "low" | "medium" | "high";
  }>;
}

// Mock data for A/B testing demo
const generateVariantData = (baseMetrics: FunnelMetrics, variant: "A" | "B"): FunnelMetrics => {
  if (variant === "A") return baseMetrics;
  
  // Variant B shows improved metrics (e.g., after theme optimization)
  return {
    ...baseMetrics,
    personas: baseMetrics.personas.map(persona => ({
      ...persona,
      progress: Math.min(100, persona.progress + 8),
      completion: Math.min(100, persona.completion + 12),
      dropOff: Math.max(0, persona.dropOff - 10),
    })),
  };
};

export function FunnelAnalyticsPanel({ campaignId }: FunnelAnalyticsPanelProps) {
  const [baseMetrics, setBaseMetrics] = useState<FunnelMetrics | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<"A" | "B">("A");
  const [showAiRecommendations, setShowAiRecommendations] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  const metrics = baseMetrics ? generateVariantData(baseMetrics, selectedVariant) : null;

  useEffect(() => {
    loadMetrics();
  }, [campaignId]);

  const loadMetrics = async () => {
    try {
      const response = await fetch(`/api/analytics/campaigns/${campaignId}/funnel`);
      if (response.ok) {
        const data = await response.json();
        
        // Transform API data to our format
        const personas = data.funnel?.map((item: any) => ({
          id: item.stage?.toLowerCase() || 'unknown',
          name: item.stage || 'Неизвестно',
          entry: item.users || 0,
          progress: Math.round((item.users / (data.campaignStats?.total_users || 1)) * 100),
          completion: Math.round((item.completed / (item.users || 1)) * 100),
          dropOff: Math.round(((item.users - item.completed) / (item.users || 1)) * 100),
        })) || [];

        setBaseMetrics({
          personas,
          recommendations: [], // Start with empty recommendations
        });
      } else {
        // Fallback for demo - minimal data
        setBaseMetrics({
          personas: [
            {
              id: "campaign",
              name: "Общий прогресс",
              entry: 0,
              progress: 0,
              completion: 0,
              dropOff: 0,
            },
          ],
          recommendations: [],
        });
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
      // Fallback data
      setBaseMetrics({
        personas: [
          {
            id: "campaign", 
            name: "Общий прогресс",
            entry: 0,
            progress: 0,
            completion: 0,
            dropOff: 0,
          },
        ],
        recommendations: [],
      });
    }
  };

  const handleAiRecommendations = async () => {
    setAiLoading(true);
    try {
      const response = await fetch("/api/ai/funnel-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setBaseMetrics(prev => prev ? {
          ...prev,
          recommendations: data.tips.map((tip: any) => ({
            id: tip.id,
            title: tip.title,
            description: tip.summary,
            severity: "medium" as const,
          }))
        } : null);
        setShowAiRecommendations(true);
      }
    } catch (error) {
      console.error("AI recommendations failed:", error);
    } finally {
      setAiLoading(false);
    }
  };

  if (!metrics) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3">
          <BarChart3 size={20} className="text-indigo-300" />
          <h3 className="text-lg font-semibold text-white">Аналитика воронки</h3>
        </div>
        <p className="mt-3 text-sm text-indigo-100/70">
          Загрузка метрик...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 size={20} className="text-indigo-300" />
            <h3 className="text-lg font-semibold text-white">Аналитика воронки</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-indigo-100/60">
              <span>A/B тест:</span>
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value as "A" | "B")}
                className="rounded border border-white/10 bg-white/5 px-2 py-1 text-sm text-white"
              >
                <option value="A" className="bg-gray-800">Вариант A (текущая тема)</option>
                <option value="B" className="bg-gray-800">Вариант B (оптимизация)</option>
              </select>
            </div>
            {selectedVariant === "B" && (
              <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-200">
                +12% конверсия
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {metrics.personas.map((persona) => (
            <div
              key={persona.id}
              className="rounded-lg border border-white/10 bg-white/5 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-medium text-white">{persona.name}</h4>
                <div className="text-xs text-indigo-100/70">
                  {persona.entry} входов
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-white">{persona.progress}%</div>
                  <div className="text-xs text-indigo-100/60">Прогресс</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-green-300">{persona.completion}%</div>
                  <div className="text-xs text-indigo-100/60">Завершение</div>
                </div>
                <div>
                  <div
                    className={clsx(
                      "text-lg font-semibold",
                      persona.dropOff > 30 ? "text-red-300" : persona.dropOff > 20 ? "text-yellow-300" : "text-green-300"
                    )}
                  >
                    {persona.dropOff}%
                  </div>
                  <div className="text-xs text-indigo-100/60">Отток</div>
                </div>
              </div>

              {persona.dropOff > 30 && (
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-200">
                  <AlertTriangle size={12} />
                  <span>Высокий отток - рекомендуется пересмотреть настройки</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleAiRecommendations}
            disabled={aiLoading}
            className="flex items-center gap-2 rounded-lg bg-indigo-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {aiLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Анализируем...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Получить рекомендации ИИ
              </>
            )}
          </button>
        </div>
      </div>

      {showAiRecommendations && metrics.recommendations.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h4 className="mb-4 flex items-center gap-2 font-medium text-white">
            <Sparkles size={16} className="text-indigo-300" />
            Рекомендации ИИ
          </h4>
          <div className="space-y-3">
            {metrics.recommendations.map((rec) => (
              <div
                key={rec.id}
                className={clsx(
                  "rounded-lg border p-3",
                  rec.severity === "high"
                    ? "border-red-500/30 bg-red-500/10"
                    : rec.severity === "medium"
                    ? "border-yellow-500/30 bg-yellow-500/10"
                    : "border-blue-500/30 bg-blue-500/10"
                )}
              >
                <div className="flex items-start gap-3">
                  <TrendingDown
                    size={16}
                    className={clsx(
                      "mt-0.5",
                      rec.severity === "high"
                        ? "text-red-300"
                        : rec.severity === "medium"
                        ? "text-yellow-300"
                        : "text-blue-300"
                    )}
                  />
                  <div>
                    <div className="font-medium text-white">{rec.title}</div>
                    <div className="mt-1 text-sm text-indigo-100/70">{rec.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
