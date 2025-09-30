"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { AlertCircle, CheckCircle2, Loader2, Sparkles, BookOpen, Star, Zap } from "lucide-react";
import type { CampaignThemeConfig, FunnelType, GamificationLevel } from "@/types/campaignTheme";
import { THEME_PRESETS, PERSONA_PRESETS } from "@/data/theme-presets";
import { ThemeGuide } from "./ThemeGuide";

interface CampaignSettingsFormProps {
  campaignId: string;
}

interface CampaignPayload {
  id: string;
  name: string;
  description?: string;
  themeConfig?: CampaignThemeConfig | null;
}

export function CampaignSettingsForm({ campaignId }: CampaignSettingsFormProps) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<CampaignPayload | null>(null);
  const [config, setConfig] = useState<CampaignThemeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    async function loadCampaign() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/campaigns/${campaignId}`);
        if (!response.ok) {
          throw new Error("Не удалось загрузить кампанию");
        }
        const data = await response.json();
        setCampaign(data);
        setConfig(data.themeConfig || THEME_PRESETS[0].config);
      } catch (err) {
        console.error("[CampaignSettingsForm] load", err);
        setError(err instanceof Error ? err.message : "Ошибка загрузки");
      } finally {
        setIsLoading(false);
      }
    }

    loadCampaign();
  }, [campaignId]);

  const updateConfig = (updates: Partial<CampaignThemeConfig>) => {
    setConfig((prev) => (prev ? { ...prev, ...updates } : prev));
  };

  const handlePersonaToggle = (personaId: string) => {
    if (!config) return;
    const personas = config.personas.includes(personaId)
      ? config.personas.filter((p) => p !== personaId)
      : [...config.personas, personaId];
    updateConfig({ personas });
  };

  const handleThemeSelect = (themeId: string) => {
    const preset = THEME_PRESETS.find((theme) => theme.id === themeId);
    if (preset) {
      setConfig({ ...preset.config, personas: config?.personas || preset.config.personas });
    }
  };

  const handleFunnelChange = (funnelType: FunnelType) => updateConfig({ funnelType });
  const handleGammaChange = (level: GamificationLevel) => updateConfig({ gamificationLevel: level });

  const handleMotivationOverride = (key: keyof NonNullable<CampaignThemeConfig["motivationOverrides"]>, value: string) => {
    if (!config) return;
    updateConfig({
      motivationOverrides: {
        ...config.motivationOverrides,
        [key]: value || undefined,
      },
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!config || !campaign) return;

    setSaveError(null);
    setSaveSuccess(false);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: campaign.name,
            description: campaign.description,
            theme: campaign.theme,
            themeConfig: config,
          }),
        });

        if (!response.ok) {
          throw new Error("Не удалось сохранить настройки кампании");
        }

        setSaveSuccess(true);
        router.refresh();
        setTimeout(() => setSaveSuccess(false), 2500);
      } catch (err) {
        console.error("[CampaignSettingsForm] save", err);
        setSaveError(err instanceof Error ? err.message : "Ошибка сохранения");
      }
    });
  };

  const handleAiSuggestion = async () => {
    if (!config) return;
    setSaveError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/ai/theme-suggestion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ funnelType: config.funnelType, personaId: config.personas[0] }),
        });

        if (!response.ok) {
          throw new Error("Не удалось получить рекомендацию");
        }
        const data = await response.json();
        const suggestion = data.suggestion as CampaignThemeConfig;
        setConfig({ ...suggestion, personas: config.personas });
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : "Ошибка AI");
      }
    });
  };

  if (isLoading) {
    return <div className="text-indigo-200">Загрузка настроек...</div>;
  }

  if (error || !campaign || !config) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-red-500/10 p-4 text-sm text-red-200">
        <AlertCircle size={18} />
        <span>{error || "Настройки недоступны"}</span>
      </div>
    );
  }

  if (showGuide) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Руководство по настройке тем</h2>
          <button
            type="button"
            onClick={() => setShowGuide(false)}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-indigo-200 transition hover:text-white"
          >
            Вернуться к настройкам
          </button>
        </div>
        <ThemeGuide />
      </div>
    );
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">Кампания</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">{campaign.name}</h2>
            {campaign.description && (
              <p className="mt-2 text-sm text-indigo-100/80">{campaign.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-200 transition hover:border-indigo-500 hover:text-white"
          >
            <BookOpen size={16} />
            Гайд
          </button>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <FieldGroup title="Тип воронки">
          <select
            value={config.funnelType}
            onChange={(event) => handleFunnelChange(event.target.value as FunnelType)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
          >
            {THEME_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.config.funnelType} className="bg-gray-900">
                {preset.config.funnelType}
              </option>
            ))}
            {/** Provide full list from constant */}
            {(["onboarding", "engagement", "assessment", "growth", "esg"] as FunnelType[]).map((option) => (
              <option key={`option-${option}`} value={option} className="bg-gray-900">
                {option}
              </option>
            ))}
          </select>
        </FieldGroup>

        <FieldGroup title="Уровень геймификации">
          <div className="flex gap-2">
            {(["low", "balanced", "high"] as GamificationLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => handleGammaChange(level)}
                className={clsx(
                  "flex-1 rounded-lg border px-3 py-2 text-xs font-medium uppercase tracking-[0.1em] transition",
                  config.gamificationLevel === level
                    ? "border-indigo-400 bg-indigo-500/20 text-white"
                    : "border-white/10 bg-white/5 text-indigo-100/70 hover:text-white"
                )}
              >
                {level === "low" ? "Мин" : level === "balanced" ? "Сбал" : "Макс"}
              </button>
            ))}
          </div>
        </FieldGroup>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">Целевые аудитории</h3>
        <div className="mt-4 grid gap-3">
          {PERSONA_PRESETS.map((persona) => (
            <label
              key={persona.id}
              className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/30"
            >
              <input
                type="checkbox"
                checked={config.personas.includes(persona.id)}
                onChange={() => handlePersonaToggle(persona.id)}
                className="mt-1 rounded"
              />
              <div>
                <p className="text-sm font-semibold text-white">{persona.title}</p>
                <p className="mt-1 text-xs text-indigo-100/70">{persona.description}</p>
                <p className="mt-1 text-xs text-indigo-200/60">Уровень геймификации: {persona.defaultGamification}</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">Темы</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleThemeSelect(preset.id)}
              className={clsx(
                "rounded-2xl border p-4 text-left transition",
                config.themeId === preset.id
                  ? "border-indigo-400 bg-indigo-500/20 text-white"
                  : "border-white/10 bg-black/20 text-indigo-100/80 hover:border-white/30"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-full border border-white/10"
                  style={{ background: preset.spotlightColor }}
                />
                <div>
                  <p className="text-sm font-semibold text-white">{preset.title}</p>
                  <p className="mt-1 text-xs text-indigo-100/70">{preset.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Preview */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Предпросмотр интерфейса кадета</h3>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-indigo-100/60">
            Live Preview
          </span>
        </div>
        <div 
          className="relative overflow-hidden rounded-2xl border border-white/10 p-6"
          style={{ 
            background: config.palette?.surface || "rgba(23, 16, 48, 0.85)",
            backgroundImage: `radial-gradient(circle at top left, ${config.palette?.primary}22, transparent 50%), radial-gradient(circle at bottom right, ${config.palette?.secondary}22, transparent 50%)`
          }}
        >
          {/* Mini mission card preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">Миссия: Добро пожаловать</h4>
              <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
                {config.gamificationLevel === "high" ? "⚡ Активна" : config.gamificationLevel === "low" ? "Доступна" : "● Доступна"}
              </div>
            </div>
            <p className="text-xs text-indigo-100/70">
              Пример описания миссии в стиле выбранной темы
            </p>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <Star size={14} style={{ color: config.palette?.primary }} />
                <span className="font-semibold" style={{ color: config.palette?.primary }}>
                  100 {config.motivationOverrides?.xp || "XP"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Zap size={14} style={{ color: config.palette?.secondary }} />
                <span className="font-semibold" style={{ color: config.palette?.secondary }}>
                  50 {config.motivationOverrides?.mana || "Мана"}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-lg bg-white/10 px-2 py-1 text-white">
                +2 Аналитика
              </span>
              <span className="rounded-lg bg-white/10 px-2 py-1 text-white">
                +1 Коммуникация
              </span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-indigo-100/60">
          💡 Интерфейс кадета автоматически адаптируется под выбранную тему, палитру и терминологию
        </p>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h3 className="text-lg font-semibold text-white">Терминология</h3>
        <div className="mt-4 space-y-3">
          {Object.entries({ xp: "Опыт", mana: "Валюта", rank: "Ранг" }).map(([key, label]) => (
            <div key={key} className="flex items-center gap-3">
              <label className="w-24 text-xs uppercase tracking-[0.2em] text-indigo-200/70">{label}</label>
              <input
                type="text"
                value={config.motivationOverrides?.[key as keyof typeof config.motivationOverrides] || ""}
                onChange={(event) => handleMotivationOverride(key as any, event.target.value)}
                placeholder={label}
                className="flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder-indigo-100/40 focus:border-indigo-400 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </section>

      {saveError && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          <AlertCircle size={16} />
          <span>{saveError}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="flex items-center gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-200">
          <CheckCircle2 size={16} />
          <span>Настройки сохранены</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleAiSuggestion}
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-200 transition hover:border-indigo-400 hover:text-white"
        >
          <Sparkles size={16} />
          Запросить рекомендации ИИ
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-60"
          disabled={isPending}
        >
          {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
          Сохранить изменения
        </button>
      </div>
    </form>
  );
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

