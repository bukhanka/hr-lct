"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Variant {
  id: string;
  name: string;
  variantName: string;
  theme: string;
  analytics: {
    uniqueUsers: number;
    totalMissions: number;
    completedMissions: number;
    completionRate: number;
    avgTimeToCompleteHours: number;
  };
}

interface ABTestingPanelProps {
  campaignId: string;
  variants: Variant[];
  onCreateVariant: (data: { variantName: string; theme: string; themeConfig?: any }) => Promise<void>;
}

export function ABTestingPanel({ campaignId, variants = [], onCreateVariant }: ABTestingPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newVariantName, setNewVariantName] = useState("");
  const [newVariantTheme, setNewVariantTheme] = useState("");

  const handleCreate = async () => {
    if (!newVariantName.trim() || !newVariantTheme.trim()) {
      alert("Пожалуйста, заполните все поля");
      return;
    }

    try {
      await onCreateVariant({
        variantName: newVariantName,
        theme: newVariantTheme,
      });
      setNewVariantName("");
      setNewVariantTheme("");
      setIsCreating(false);
    } catch (error) {
      console.error("Error creating variant:", error);
      alert("Ошибка при создании варианта");
    }
  };

  const getBestVariant = () => {
    if (variants.length === 0) return null;
    return variants.reduce((best, current) => {
      return current.analytics.completionRate > best.analytics.completionRate ? current : best;
    });
  };

  const bestVariant = getBestVariant();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">A/B Тестирование</h3>
          <p className="text-sm text-indigo-200/60">
            Создавайте варианты кампании с разными темами и анализируйте эффективность
          </p>
        </div>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
        >
          {isCreating ? "Отмена" : "+ Создать вариант"}
        </button>
      </div>

      {isCreating && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-xl border border-white/10 bg-white/5 p-6"
        >
          <h4 className="text-white font-medium mb-4">Новый вариант</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-indigo-200/70 mb-2">Название варианта</label>
              <input
                type="text"
                value={newVariantName}
                onChange={(e) => setNewVariantName(e.target.value)}
                placeholder="Вариант A, Вариант B..."
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-indigo-200/40"
              />
            </div>
            <div>
              <label className="block text-sm text-indigo-200/70 mb-2">ID темы</label>
              <select
                value={newVariantTheme}
                onChange={(e) => setNewVariantTheme(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
              >
                <option value="">Выберите тему</option>
                <option value="galactic-academy">Galactic Academy</option>
                <option value="corporate-metropolis">Corporate Metropolis</option>
                <option value="cyberpunk-hub">Cyberpunk Hub</option>
                <option value="esg-mission">ESG Mission</option>
                <option value="scientific-expedition">Scientific Expedition</option>
              </select>
            </div>
            <button
              onClick={handleCreate}
              className="w-full px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              Создать вариант
            </button>
          </div>
        </motion.div>
      )}

      {variants.length === 0 ? (
        <div className="text-center py-12 text-indigo-200/60">
          <p>Вариантов пока нет. Создайте первый вариант для A/B тестирования.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {variants.map((variant) => {
            const isBest = bestVariant?.id === variant.id;
            return (
              <motion.div
                key={variant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border p-6 ${
                  isBest
                    ? "border-emerald-400/50 bg-emerald-500/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-white font-medium">{variant.variantName}</h4>
                    <p className="text-sm text-indigo-200/60">{variant.theme}</p>
                  </div>
                  {isBest && (
                    <span className="px-2 py-1 text-xs rounded-lg bg-emerald-400/20 text-emerald-300">
                      👑 Лидер
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-indigo-200/70">Пользователей</span>
                    <span className="text-white font-medium">{variant.analytics.uniqueUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-indigo-200/70">Выполнено миссий</span>
                    <span className="text-white font-medium">
                      {variant.analytics.completedMissions} / {variant.analytics.totalMissions}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-indigo-200/70">Конверсия</span>
                    <span className={`font-medium ${
                      variant.analytics.completionRate > 70 ? "text-emerald-400" : "text-white"
                    }`}>
                      {variant.analytics.completionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-indigo-200/70">Среднее время</span>
                    <span className="text-white font-medium">
                      {variant.analytics.avgTimeToCompleteHours}ч
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${variant.analytics.completionRate}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${
                      isBest ? "bg-emerald-400" : "bg-indigo-400"
                    }`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {variants.length > 1 && bestVariant && (
        <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-6">
          <h4 className="text-white font-medium mb-2">💡 Рекомендация</h4>
          <p className="text-sm text-indigo-200/80">
            Вариант <strong>{bestVariant.variantName}</strong> показывает лучшую конверсию (
            {bestVariant.analytics.completionRate.toFixed(1)}%). Рассмотрите возможность использования
            темы <strong>{bestVariant.theme}</strong> для основной кампании.
          </p>
        </div>
      )}
    </div>
  );
}
