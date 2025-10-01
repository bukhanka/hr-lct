"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Target, 
  Users, 
  TrendingUp, 
  Building2, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Loader2
} from "lucide-react";
import type { CampaignBrief, ConversionStage } from "@/types/campaignBrief";
import { FunnelType } from "@/types/campaignTheme";

interface CampaignBriefWizardProps {
  campaignId: string;
  campaignName: string;
  onComplete?: () => void;
  onSkip?: () => void;
}

type WizardStep = "goal" | "audience" | "metrics" | "context" | "review";

const FUNNEL_TYPES: { value: FunnelType; label: string; description: string }[] = [
  { value: "onboarding", label: "Онбординг / Адаптация", description: "Введение новых сотрудников или кандидатов" },
  { value: "assessment", label: "Отбор / Assessment", description: "Оценка и отбор кандидатов" },
  { value: "engagement", label: "Вовлечение", description: "Повышение активности и лояльности" },
  { value: "growth", label: "Развитие", description: "Прокачка навыков и компетенций" },
  { value: "esg", label: "ESG / Ценности", description: "Социальные проекты и корпоративные ценности" },
];

export function CampaignBriefWizard({
  campaignId,
  campaignName,
  onComplete,
  onSkip,
}: CampaignBriefWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>("goal");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);

  // Состояние формы
  const [brief, setBrief] = useState<Partial<CampaignBrief>>({
    businessGoal: "",
    targetAudience: {
      segment: "",
      size: 100,
      characteristics: [],
    },
    successMetrics: {
      primary: "",
      secondary: [],
      conversionFunnel: [],
    },
    companyContext: {
      why: "",
      timeline: {
        start: new Date().toISOString().split("T")[0],
        end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      },
      stakeholders: [],
    },
  });

  const [funnelType, setFunnelType] = useState<FunnelType>("onboarding");
  const [newCharacteristic, setNewCharacteristic] = useState("");
  const [newSecondaryMetric, setNewSecondaryMetric] = useState("");
  const [newStakeholder, setNewStakeholder] = useState("");

  const steps: WizardStep[] = ["goal", "audience", "metrics", "context", "review"];
  const currentStepIndex = steps.indexOf(currentStep);

  const updateBrief = (updates: Partial<CampaignBrief>) => {
    setBrief((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleAISuggestion = async () => {
    if (!brief.businessGoal) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/ai/brief-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessGoal: brief.businessGoal,
          funnelType,
          targetAudienceSegment: brief.targetAudience?.segment,
        }),
      });

      if (!response.ok) throw new Error("Не удалось получить рекомендации");

      const data = await response.json();
      setAiSuggestion(data);
      
      // Автозаполнение рекомендованными значениями
      if (data.recommendedStages && currentStep === "metrics") {
        updateBrief({
          successMetrics: {
            ...brief.successMetrics!,
            conversionFunnel: data.recommendedStages,
          },
        });
      }
    } catch (err) {
      console.error("[CampaignBriefWizard] AI error:", err);
      setError(err instanceof Error ? err.message : "Ошибка AI");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessGoal: brief.businessGoal,
          targetAudience: brief.targetAudience,
          successMetrics: brief.successMetrics,
          companyContext: brief.companyContext,
          briefCompleted: true,
        }),
      });

      if (!response.ok) throw new Error("Не удалось сохранить бизнес-контекст");

      if (onComplete) {
        onComplete();
      } else {
        router.push(`/dashboard/architect/campaigns/${campaignId}/settings`);
      }
    } catch (err) {
      console.error("[CampaignBriefWizard] submit error:", err);
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setIsLoading(false);
    }
  };

  const addCharacteristic = () => {
    if (newCharacteristic.trim()) {
      updateBrief({
        targetAudience: {
          ...brief.targetAudience!,
          characteristics: [...(brief.targetAudience?.characteristics || []), newCharacteristic.trim()],
        },
      });
      setNewCharacteristic("");
    }
  };

  const removeCharacteristic = (index: number) => {
    updateBrief({
      targetAudience: {
        ...brief.targetAudience!,
        characteristics: brief.targetAudience?.characteristics?.filter((_, i) => i !== index) || [],
      },
    });
  };

  const addSecondaryMetric = () => {
    if (newSecondaryMetric.trim()) {
      updateBrief({
        successMetrics: {
          ...brief.successMetrics!,
          secondary: [...(brief.successMetrics?.secondary || []), newSecondaryMetric.trim()],
        },
      });
      setNewSecondaryMetric("");
    }
  };

  const removeSecondaryMetric = (index: number) => {
    updateBrief({
      successMetrics: {
        ...brief.successMetrics!,
        secondary: brief.successMetrics?.secondary?.filter((_, i) => i !== index) || [],
      },
    });
  };

  const addConversionStage = () => {
    updateBrief({
      successMetrics: {
        ...brief.successMetrics!,
        conversionFunnel: [
          ...(brief.successMetrics?.conversionFunnel || []),
          { stage: "", targetRate: 80, description: "" },
        ],
      },
    });
  };

  const updateConversionStage = (index: number, updates: Partial<ConversionStage>) => {
    const funnel = [...(brief.successMetrics?.conversionFunnel || [])];
    funnel[index] = { ...funnel[index], ...updates };
    updateBrief({
      successMetrics: {
        ...brief.successMetrics!,
        conversionFunnel: funnel,
      },
    });
  };

  const removeConversionStage = (index: number) => {
    updateBrief({
      successMetrics: {
        ...brief.successMetrics!,
        conversionFunnel: brief.successMetrics?.conversionFunnel?.filter((_, i) => i !== index) || [],
      },
    });
  };

  const addStakeholder = () => {
    if (newStakeholder.trim()) {
      updateBrief({
        companyContext: {
          ...brief.companyContext!,
          stakeholders: [...(brief.companyContext?.stakeholders || []), newStakeholder.trim()],
        },
      });
      setNewStakeholder("");
    }
  };

  const removeStakeholder = (index: number) => {
    updateBrief({
      companyContext: {
        ...brief.companyContext!,
        stakeholders: brief.companyContext?.stakeholders?.filter((_, i) => i !== index) || [],
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0a0a1f] via-[#0e0e2a] to-[#0a0a1f] shadow-2xl">
        {/* Header */}
        <div className="border-b border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Бизнес-контекст кампании</h2>
              <p className="mt-1 text-sm text-indigo-200/70">{campaignName}</p>
            </div>
            <button
              onClick={onSkip}
              className="text-sm text-indigo-200/70 transition hover:text-white"
            >
              Пропустить
            </button>
          </div>

          {/* Progress */}
          <div className="mt-6 flex items-center gap-2">
            {steps.map((step, index) => (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  index <= currentStepIndex
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                    : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 180px)" }}>
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Step: Goal */}
          {currentStep === "goal" && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-indigo-500/20 p-3">
                  <Target className="text-indigo-300" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">Зачем эта кампания?</h3>
                  <p className="mt-1 text-sm text-indigo-200/70">
                    Опишите главную бизнес-цель. Например: "Привлечь 100 студентов на стажировку" или "Адаптировать 50 новых сотрудников за 2 месяца"
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-100/90">
                  Бизнес-цель кампании
                </label>
                <textarea
                  value={brief.businessGoal || ""}
                  onChange={(e) => updateBrief({ businessGoal: e.target.value })}
                  placeholder="Например: Привлечь талантливых студентов 3-4 курса на стажировку в нашу компанию. Цель — получить 20 офферов из 100 заявок."
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-indigo-200/50 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-100/90">
                  Тип воронки процесса
                </label>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {FUNNEL_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFunnelType(type.value)}
                      className={`rounded-xl border p-4 text-left transition ${
                        funnelType === type.value
                          ? "border-indigo-500 bg-indigo-500/20"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="font-medium text-white">{type.label}</div>
                      <div className="mt-1 text-xs text-indigo-200/70">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step: Audience */}
          {currentStep === "audience" && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-indigo-500/20 p-3">
                  <Users className="text-indigo-300" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">Целевая аудитория</h3>
                  <p className="mt-1 text-sm text-indigo-200/70">
                    Кто будет участвовать в этой кампании? Опишите сегмент и его характеристики.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-100/90">Сегмент аудитории</label>
                <input
                  type="text"
                  value={brief.targetAudience?.segment || ""}
                  onChange={(e) =>
                    updateBrief({
                      targetAudience: { ...brief.targetAudience!, segment: e.target.value },
                    })
                  }
                  placeholder="Например: Студенты 3-4 курса технических вузов"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-indigo-200/50 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-100/90">
                  Ожидаемое количество участников
                </label>
                <input
                  type="number"
                  value={brief.targetAudience?.size || 100}
                  onChange={(e) =>
                    updateBrief({
                      targetAudience: { ...brief.targetAudience!, size: parseInt(e.target.value) || 0 },
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-100/90">
                  Характеристики аудитории
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newCharacteristic}
                    onChange={(e) => setNewCharacteristic(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCharacteristic())}
                    placeholder="Добавить характеристику"
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-indigo-200/50 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addCharacteristic}
                    className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-indigo-200 transition hover:bg-indigo-500/20"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {brief.targetAudience?.characteristics?.map((char, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-indigo-100"
                    >
                      {char}
                      <button
                        type="button"
                        onClick={() => removeCharacteristic(index)}
                        className="text-indigo-200/70 transition hover:text-red-300"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step: Metrics */}
          {currentStep === "metrics" && (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-indigo-500/20 p-3">
                    <TrendingUp className="text-indigo-300" size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">Метрики успеха</h3>
                    <p className="mt-1 text-sm text-indigo-200/70">
                      Определите, как будет измеряться успех кампании
                    </p>
                  </div>
                </div>
                {brief.businessGoal && (
                  <button
                    type="button"
                    onClick={handleAISuggestion}
                    disabled={isLoading}
                    className="flex items-center gap-2 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-200 transition hover:bg-indigo-500/20 disabled:opacity-50"
                  >
                    <Sparkles size={16} />
                    {isLoading ? "Думаю..." : "AI подсказка"}
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-100/90">Главная метрика</label>
                <input
                  type="text"
                  value={brief.successMetrics?.primary || ""}
                  onChange={(e) =>
                    updateBrief({
                      successMetrics: { ...brief.successMetrics!, primary: e.target.value },
                    })
                  }
                  placeholder="Например: Конверсия в офферы 20%"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-indigo-200/50 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-100/90">
                  Дополнительные метрики
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newSecondaryMetric}
                    onChange={(e) => setNewSecondaryMetric(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSecondaryMetric())}
                    placeholder="Добавить метрику"
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-indigo-200/50 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addSecondaryMetric}
                    className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-indigo-200 transition hover:bg-indigo-500/20"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {brief.successMetrics?.secondary?.map((metric, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <span className="text-sm text-indigo-100">{metric}</span>
                      <button
                        type="button"
                        onClick={() => removeSecondaryMetric(index)}
                        className="text-indigo-200/70 transition hover:text-red-300"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-indigo-100/90">Воронка конверсий</label>
                  <button
                    type="button"
                    onClick={addConversionStage}
                    className="text-sm text-indigo-300 transition hover:text-indigo-200"
                  >
                    + Добавить этап
                  </button>
                </div>
                <div className="mt-3 space-y-3">
                  {brief.successMetrics?.conversionFunnel?.map((stage, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            value={stage.stage}
                            onChange={(e) => updateConversionStage(index, { stage: e.target.value })}
                            placeholder="Название этапа"
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-indigo-200/50 focus:border-indigo-500 focus:outline-none"
                          />
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-indigo-200/70">Целевая конверсия:</span>
                            <input
                              type="number"
                              value={stage.targetRate}
                              onChange={(e) =>
                                updateConversionStage(index, { targetRate: parseInt(e.target.value) || 0 })
                              }
                              min="0"
                              max="100"
                              className="w-20 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                            />
                            <span className="text-sm text-indigo-200/70">%</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeConversionStage(index)}
                          className="text-indigo-200/70 transition hover:text-red-300"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step: Context */}
          {currentStep === "context" && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-indigo-500/20 p-3">
                  <Building2 className="text-indigo-300" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">Контекст компании</h3>
                  <p className="mt-1 text-sm text-indigo-200/70">
                    Дополнительная информация о кампании и стейкхолдерах
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-100/90">
                  Зачем компании эта кампания?
                </label>
                <textarea
                  value={brief.companyContext?.why || ""}
                  onChange={(e) =>
                    updateBrief({
                      companyContext: { ...brief.companyContext!, why: e.target.value },
                    })
                  }
                  placeholder="Опишите стратегическое значение кампании для компании"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-indigo-200/50 focus:border-indigo-500 focus:outline-none"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-indigo-100/90">Дата начала</label>
                  <input
                    type="date"
                    value={brief.companyContext?.timeline.start || ""}
                    onChange={(e) =>
                      updateBrief({
                        companyContext: {
                          ...brief.companyContext!,
                          timeline: { ...brief.companyContext!.timeline, start: e.target.value },
                        },
                      })
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-indigo-100/90">Дата окончания</label>
                  <input
                    type="date"
                    value={brief.companyContext?.timeline.end || ""}
                    onChange={(e) =>
                      updateBrief({
                        companyContext: {
                          ...brief.companyContext!,
                          timeline: { ...brief.companyContext!.timeline, end: e.target.value },
                        },
                      })
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-100/90">Заинтересованные стороны</label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newStakeholder}
                    onChange={(e) => setNewStakeholder(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addStakeholder())}
                    placeholder="Добавить стейкхолдера"
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-indigo-200/50 focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addStakeholder}
                    className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-indigo-200 transition hover:bg-indigo-500/20"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {brief.companyContext?.stakeholders?.map((stakeholder, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-indigo-100"
                    >
                      {stakeholder}
                      <button
                        type="button"
                        onClick={() => removeStakeholder(index)}
                        className="text-indigo-200/70 transition hover:text-red-300"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step: Review */}
          {currentStep === "review" && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-indigo-500/20 p-3">
                  <CheckCircle2 className="text-indigo-300" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">Проверка и сохранение</h3>
                  <p className="mt-1 text-sm text-indigo-200/70">
                    Проверьте введенные данные перед сохранением
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <ReviewSection title="Бизнес-цель" icon={<Target size={16} />}>
                  <p className="text-sm text-indigo-100">{brief.businessGoal || "Не указана"}</p>
                  <p className="mt-1 text-xs text-indigo-200/70">Тип воронки: {funnelType}</p>
                </ReviewSection>

                <ReviewSection title="Целевая аудитория" icon={<Users size={16} />}>
                  <p className="text-sm text-indigo-100">{brief.targetAudience?.segment || "Не указана"}</p>
                  <p className="mt-1 text-xs text-indigo-200/70">
                    Ожидаемое количество: {brief.targetAudience?.size || 0} чел.
                  </p>
                  {brief.targetAudience?.characteristics && brief.targetAudience.characteristics.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {brief.targetAudience.characteristics.map((char, i) => (
                        <span
                          key={i}
                          className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-indigo-200"
                        >
                          {char}
                        </span>
                      ))}
                    </div>
                  )}
                </ReviewSection>

                <ReviewSection title="Метрики успеха" icon={<TrendingUp size={16} />}>
                  <p className="text-sm font-medium text-indigo-100">
                    {brief.successMetrics?.primary || "Не указана"}
                  </p>
                  {brief.successMetrics?.conversionFunnel && brief.successMetrics.conversionFunnel.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wider text-indigo-200/70">
                        Воронка конверсий:
                      </p>
                      {brief.successMetrics.conversionFunnel.map((stage, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs"
                        >
                          <span className="text-indigo-100">{stage.stage}</span>
                          <span className="font-medium text-indigo-300">{stage.targetRate}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </ReviewSection>

                <ReviewSection title="Контекст компании" icon={<Building2 size={16} />}>
                  <p className="text-sm text-indigo-100">{brief.companyContext?.why || "Не указан"}</p>
                  <p className="mt-2 text-xs text-indigo-200/70">
                    {brief.companyContext?.timeline.start} → {brief.companyContext?.timeline.end}
                  </p>
                  {brief.companyContext?.stakeholders && brief.companyContext.stakeholders.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {brief.companyContext.stakeholders.map((sh, i) => (
                        <span
                          key={i}
                          className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-indigo-200"
                        >
                          {sh}
                        </span>
                      ))}
                    </div>
                  )}
                </ReviewSection>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-2 text-sm text-indigo-200 transition hover:text-white disabled:opacity-50 disabled:hover:text-indigo-200"
            >
              <ArrowLeft size={16} />
              Назад
            </button>

            <div className="flex items-center gap-3">
              {currentStep !== "review" ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-indigo-500/50"
                >
                  Далее
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-500/30 transition hover:shadow-emerald-500/50 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Сохранение...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Сохранить и продолжить
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center gap-2 text-indigo-300">
        {icon}
        <span className="text-sm font-medium uppercase tracking-wider">{title}</span>
      </div>
      {children}
    </div>
  );
}

