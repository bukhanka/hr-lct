"use client";

import React, { useState, useEffect } from "react";
import { Settings2, Sparkles, Eye, ChevronDown, X, HelpCircle } from "lucide-react";
import clsx from "clsx";
import { THEME_PRESETS, PERSONA_PRESETS } from "@/data/theme-presets";
import type { CampaignThemeConfig, FunnelType, GamificationLevel } from "@/types/campaignTheme";

interface CampaignSettingsPanelProps {
  campaignId: string;
  currentTheme?: CampaignThemeConfig | null;
  onThemeChange: (theme: CampaignThemeConfig) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const FUNNEL_OPTIONS = [
  { value: "onboarding", label: "Адаптация", description: "Ранги и прогресс" },
  { value: "engagement", label: "Вовлечение", description: "Энергия и ресурсы" },
  { value: "assessment", label: "Отбор", description: "Достижения и рейтинг" },
  { value: "growth", label: "Развитие", description: "Навыковые треки" },
  { value: "esg", label: "Ценности", description: "Вклад и влияние" },
] as const;

// Help tooltips for each section
const HELP_INFO = {
  funnel: "Тип воронки определяет основные мотиваторы и терминологию. Например, 'Адаптация' фокусируется на рангах и опыте, а 'ESG' — на вкладе и импакте.",
  personas: "Выберите целевые аудитории для кампании. Каждая персона имеет рекомендованный уровень геймификации и предпочтительные мотиваторы.",
  theme: "Визуальная тема определяет палитру, иконки и нарратив в интерфейсе кадета. Темы подобраны под типы воронок и аудитории.",
  gamification: "Уровень геймификации влияет на визуальные эффекты, анимации и тон общения. 'Макс' — для молодой аудитории, 'Мин' — для опытных специалистов.",
  terminology: "Переименуйте мотивационные элементы под язык вашей компании. Например, 'XP' можно заменить на 'Баллы' или 'Очки развития'.",
  ai: "ИИ-помощник подберет оптимальную тему и настройки на основе выбранного типа воронки и целевой аудитории.",
};

interface TooltipProps {
  text: string;
}

function HelpTooltip({ text }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="rounded-full p-0.5 text-indigo-300/60 transition hover:text-indigo-200"
      >
        <HelpCircle size={14} />
      </button>
      {isVisible && (
        <div className="absolute left-6 top-0 z-50 w-64 rounded-lg border border-white/20 bg-[#0b0924] p-3 text-xs leading-relaxed text-indigo-100/90 shadow-xl">
          {text}
          <div className="absolute -left-1 top-1 h-2 w-2 rotate-45 border-b border-l border-white/20 bg-[#0b0924]" />
        </div>
      )}
    </div>
  );
}

export function CampaignSettingsPanel({
  campaignId,
  currentTheme,
  onThemeChange,
  isOpen,
  onToggle,
}: CampaignSettingsPanelProps) {
  const [config, setConfig] = useState<CampaignThemeConfig>(
    currentTheme || THEME_PRESETS[0].config
  );
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showJsonDebug, setShowJsonDebug] = useState(false);

  useEffect(() => {
    if (currentTheme) {
      setConfig(currentTheme);
    }
  }, [currentTheme]);

  const handleFunnelChange = (funnelType: FunnelType) => {
    const newConfig = { ...config, funnelType };
    setConfig(newConfig);
    onThemeChange(newConfig);
  };

  const handlePersonaToggle = (personaId: string) => {
    const newPersonas = config.personas.includes(personaId)
      ? config.personas.filter(p => p !== personaId)
      : [...config.personas, personaId];
    
    const newConfig = { ...config, personas: newPersonas };
    setConfig(newConfig);
    onThemeChange(newConfig);
  };

  const handleThemeSelect = (themeId: string) => {
    const preset = THEME_PRESETS.find(t => t.id === themeId);
    if (preset) {
      const newConfig = { ...preset.config, personas: config.personas };
      setConfig(newConfig);
      onThemeChange(newConfig);
    }
  };

  const handleGamificationChange = (level: GamificationLevel) => {
    const newConfig = { ...config, gamificationLevel: level };
    setConfig(newConfig);
    onThemeChange(newConfig);
  };

  const handleMotivationOverride = (key: string, value: string) => {
    const newConfig = {
      ...config,
      motivationOverrides: {
        ...config.motivationOverrides,
        [key]: value || undefined,
      },
    };
    setConfig(newConfig);
    onThemeChange(newConfig);
  };

  const handleAiSuggestion = async () => {
    setAiLoading(true);
    try {
      const response = await fetch("/api/ai/theme-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funnelType: config.funnelType,
          personaId: config.personas[0],
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const newConfig = { ...data.suggestion, personas: config.personas };
        setConfig(newConfig);
        onThemeChange(newConfig);
        setShowAiModal(false);
      }
    } catch (error) {
      console.error("AI suggestion failed:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const triggerClass = clsx(
    "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition",
    isOpen
      ? "border-indigo-400 bg-indigo-500/20 text-white"
      : "border-white/10 bg-white/5 text-indigo-100/80 hover:border-white/30 hover:text-white"
  );

  return (
    <>
      <button
        onClick={onToggle}
        className={triggerClass}
      >
        <Settings2 size={16} />
        Настройки кампании
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[70] flex justify-end bg-black/60 backdrop-blur-sm"
          onClick={onToggle}
        >
          <div
            className="relative h-full w-full max-w-md overflow-y-auto border-l border-white/20 bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-black/40 px-6 py-4 backdrop-blur">
              <div>
                <h3 className="text-lg font-semibold text-white">Настройки кампании</h3>
                <p className="mt-1 text-xs text-indigo-200/70">
                  Управляйте темой, персонами и терминологией кампании
                </p>
              </div>
              <button
                onClick={onToggle}
                className="rounded-lg p-1 text-indigo-200 transition hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">
              {/* Funnel Type */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-indigo-100/60">
                  Тип воронки
                  <HelpTooltip text={HELP_INFO.funnel} />
                </label>
                <select
                  value={config.funnelType}
                  onChange={(e) => handleFunnelChange(e.target.value as FunnelType)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
                >
                  {FUNNEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-gray-900">
                      {option.label} — {option.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Personas */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-indigo-100/60">
                  Целевые аудитории
                  <HelpTooltip text={HELP_INFO.personas} />
                </label>
                <div className="space-y-2">
                  {PERSONA_PRESETS.map((persona) => (
                    <label
                      key={persona.id}
                      className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm transition hover:bg-white/10"
                    >
                      <input
                        type="checkbox"
                        checked={config.personas.includes(persona.id)}
                        onChange={() => handlePersonaToggle(persona.id)}
                        className="mt-1 rounded"
                      />
                      <div>
                        <div className="font-medium text-white">{persona.title}</div>
                        <div className="text-xs text-indigo-100/70">{persona.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Theme Selection */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-indigo-100/60">
                  Тематический пакет
                  <HelpTooltip text={HELP_INFO.theme} />
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {THEME_PRESETS.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeSelect(theme.id)}
                      className={clsx(
                        "rounded-lg border p-3 text-left text-sm transition",
                        config.themeId === theme.id
                          ? "border-indigo-400 bg-indigo-500/20 text-white"
                          : "border-white/10 bg-white/5 text-indigo-100/80 hover:border-white/20"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: theme.spotlightColor }}
                        />
                        <div className="font-medium">{theme.title}</div>
                      </div>
                      <div className="mt-1 text-xs text-indigo-100/60">{theme.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gamification Level */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-indigo-100/60">
                  Уровень геймификации
                  <HelpTooltip text={HELP_INFO.gamification} />
                </label>
                <div className="flex gap-2">
                  {(["low", "balanced", "high"] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => handleGamificationChange(level)}
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
              </div>

              {/* Motivation Overrides */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2ем] text-indigo-100/60">
                  Терминология
                  <HelpTooltip text={HELP_INFO.terminology} />
                </label>
                <div className="space-y-2">
                  {Object.entries({ xp: "Очки опыта", mana: "Валюта", rank: "Ранг" }).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      <label className="w-24 text-xs text-indigo-100/70">{label}:</label>
                      <input
                        type="text"
                        value={config.motivationOverrides?.[key as keyof typeof config.motivationOverrides] || ""}
                        onChange={(e) => handleMotivationOverride(key, e.target.value)}
                        placeholder={key === "xp" ? "XP" : key === "mana" ? "Мана" : "Ранг"}
                        className="flex-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white placeholder-indigo-100/40 focus:border-indigo-400 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Copilot */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-indigo-100/60">
                  ИИ-помощник
                  <HelpTooltip text={HELP_INFO.ai} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAiModal(true)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-500/90 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                  >
                    <Sparkles size={14} />
                    ИИ-пилот
                  </button>
                  <button
                    onClick={() => setShowJsonDebug(!showJsonDebug)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-indigo-100/80 transition hover:text-white"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>

              {/* JSON Debug */}
              {showJsonDebug && (
                <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                  <div className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-indigo-100/60">
                    Конфигурация (JSON)
                  </div>
                  <pre className="max-h-60 overflow-auto text-xs text-indigo-100/80">
                    {JSON.stringify(config, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur">
          <div className="w-full max-w-md rounded-xl border border-white/20 bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514] p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">ИИ-помощник</h3>
            <p className="mb-6 text-sm text-indigo-100/70">
              Генерировать тему и настройки на основе выбранного типа воронки и аудитории?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAiModal(false)}
                className="flex-1 rounded-lg border border-white/20 px-4 py-2 text-sm text-indigo-200 transition hover:text-white"
              >
                Отмена
              </button>
              <button
                onClick={handleAiSuggestion}
                disabled={aiLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
              >
                {aiLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Генерируем...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Применить
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
