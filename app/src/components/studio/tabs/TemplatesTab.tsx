"use client";

import React, { useState } from "react";
import { Package, Download, Sparkles, Image, Music, Mic, Check } from "lucide-react";
import clsx from "clsx";

interface TemplatesTabProps {
  campaignId: string;
}

interface MediaTemplate {
  id: string;
  name: string;
  description: string;
  category: "space" | "corporate" | "esg" | "cyberpunk";
  assets: {
    images: number;
    audio: number;
    voice: number;
  };
  preview: string;
  tags: string[];
}

const TEMPLATES: MediaTemplate[] = [
  {
    id: "space-academy",
    name: "Космическая Академия",
    description: "Полный набор для космической тематики: иконки миссий, фоновая музыка, звуковые эффекты",
    category: "space",
    assets: {
      images: 8,
      audio: 3,
      voice: 2,
    },
    preview: "/themes/galactic-academy/background.svg",
    tags: ["космос", "студенты", "мотивация", "приключения"],
  },
  {
    id: "corporate-track",
    name: "Корпоративный Трек",
    description: "Минималистичные иконки и профессиональное музыкальное сопровождение для бизнес-кампаний",
    category: "corporate",
    assets: {
      images: 12,
      audio: 2,
      voice: 1,
    },
    preview: "/themes/corporate-metropolis/background.svg",
    tags: ["бизнес", "профессионализм", "KPI", "рост"],
  },
  {
    id: "esg-mission",
    name: "ESG Миссия",
    description: "Эко-дизайн и вдохновляющее аудио для волонтёрских и социальных программ",
    category: "esg",
    assets: {
      images: 6,
      audio: 2,
      voice: 3,
    },
    preview: "/themes/esg-mission/background.svg",
    tags: ["экология", "волонтёры", "импакт", "ценности"],
  },
  {
    id: "cyber-hub",
    name: "Киберпанк Хаб",
    description: "Неоновые визуалы и синтезаторная музыка для технологичных кампаний",
    category: "cyberpunk",
    assets: {
      images: 10,
      audio: 4,
      voice: 1,
    },
    preview: "/themes/cyberpunk-hub/background.svg",
    tags: ["будущее", "технологии", "инновации", "хакатон"],
  },
];

export function TemplatesTab({ campaignId }: TemplatesTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installedIds, setInstalledIds] = useState<string[]>([]);

  const categories = [
    { id: "all", label: "Все" },
    { id: "space", label: "Космос" },
    { id: "corporate", label: "Бизнес" },
    { id: "esg", label: "ESG" },
    { id: "cyberpunk", label: "Киберпанк" },
  ];

  const filteredTemplates = TEMPLATES.filter(
    template => selectedCategory === "all" || template.category === selectedCategory
  );

  const handleInstall = async (templateId: string) => {
    setInstallingId(templateId);
    
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/templates/install`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });

      if (response.ok) {
        setInstalledIds(prev => [...prev, templateId]);
        setTimeout(() => {
          alert("Шаблон успешно установлен! Все файлы добавлены в библиотеку.");
        }, 500);
      }
    } catch (error) {
      console.error("Failed to install template:", error);
      alert("Ошибка установки шаблона");
    } finally {
      setInstallingId(null);
    }
  };

  return (
    <div className="flex h-full gap-6 p-6">
      <aside className="custom-scroll flex h-full w-64 shrink-0 flex-col gap-6 overflow-y-auto pr-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div>
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-indigo-300/70">
              <Package size={14} /> Наборы
            </span>
            <h2 className="mt-3 text-xl font-semibold text-white">Готовые шаблоны</h2>
            <p className="mt-2 text-xs leading-relaxed text-indigo-200/70">
              Выберите пресет, и мы моментально добавим иконки, музыку и эффекты в библиотеку кампании.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200/60">Категории</p>
          <div className="mt-3 grid gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={clsx(
                  "flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium transition",
                  selectedCategory === category.id
                    ? "border-indigo-400 bg-indigo-500/20 text-white shadow-inner shadow-indigo-500/10"
                    : "border-white/10 bg-white/5 text-indigo-200/70 hover:border-white/20 hover:bg-white/10 hover:text-white"
                )}
              >
                {category.label}
                {selectedCategory === category.id && <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4 text-sm text-indigo-200/80">
          <div className="flex items-start gap-2">
            <Sparkles size={16} className="mt-0.5 text-indigo-300" />
            <div>
              <p className="font-semibold text-white">Как это работает</p>
              <p className="mt-1 text-xs leading-relaxed">
                Мы импортируем пресет в библиотеку, отмечаем файлы по категориям и связываем их с текущей кампанией.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <section className="flex-1 overflow-hidden">
        <div className="custom-scroll h-full overflow-y-auto pr-2">
          <div className="grid auto-rows-fr gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredTemplates.map((template) => {
            const isInstalled = installedIds.includes(template.id);
            const isInstalling = installingId === template.id;

              return (
                <div
                  key={template.id}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition hover:border-white/20 hover:bg-white/10"
                >
                  {/* Preview Image */}
                  <div className="relative h-28 overflow-hidden bg-gradient-to-br from-indigo-500/30 to-purple-500/25">
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-40 transition group-hover:scale-105 group-hover:opacity-60"
                      style={{ backgroundImage: `url(${template.preview})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0924] to-transparent" />
                    
                    {/* Category Badge */}
                    <div className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                      {categories.find(c => c.id === template.category)?.label}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-indigo-200/70">
                        {template.description}
                      </p>

                      {/* Assets Count */}
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-indigo-200/60">
                        <div className="flex items-center gap-1">
                          <Image size={14} />
                          <span>{template.assets.images} изображений</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Music size={14} />
                          <span>{template.assets.audio} музыки</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Mic size={14} />
                          <span>{template.assets.voice} озвучек</span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {template.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-indigo-200/70"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleInstall(template.id)}
                      disabled={isInstalling || isInstalled}
                      className={clsx(
                        "mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                        isInstalled
                          ? "bg-green-500/20 text-green-300 cursor-default"
                          : isInstalling
                          ? "bg-indigo-500/50 text-white cursor-wait"
                          : "bg-indigo-500/90 text-white hover:bg-indigo-500"
                      )}
                    >
                      {isInstalled ? (
                        <>
                          <Check size={18} />
                          Установлено
                        </>
                      ) : isInstalling ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Установка...
                        </>
                      ) : (
                        <>
                          <Download size={18} />
                          Использовать шаблон
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
