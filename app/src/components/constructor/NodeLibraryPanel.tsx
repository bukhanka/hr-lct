"use client";

import { ReactNode } from "react";
import { Sparkles, FolderKanban, Layers } from "lucide-react";
import clsx from "clsx";

interface TemplateMeta {
  id: string;
  title: string;
  description: string;
  missionType: string;
  experienceReward: number;
  manaReward: number;
  confirmationType: string;
  minRank: number;
}

interface TemplateCategory {
  id: string;
  label: string;
  icon: ReactNode;
  templates: TemplateMeta[];
}

interface NodeLibraryPanelProps {
  onCreate: (template: TemplateMeta) => void;
}

const templateCatalog: TemplateCategory[] = [
  {
    id: "onboarding",
    label: "Быстрый старт",
    icon: <Sparkles size={16} />,
    templates: [
      {
        id: "upload-docs",
        title: "Загрузка документов",
        description: "Запросите у кадета резюме или сертификаты",
        missionType: "FILE_UPLOAD",
        experienceReward: 20,
        manaReward: 5,
        confirmationType: "FILE_CHECK",
        minRank: 1,
      },
      {
        id: "welcome-quiz",
        title: "Приветственный квиз",
        description: "Короткая викторина для знакомства",
        missionType: "QUIZ",
        experienceReward: 30,
        manaReward: 10,
        confirmationType: "AUTO",
        minRank: 1,
      },
    ],
  },
  {
    id: "engagement",
    label: "Вовлечение",
    icon: <Layers size={16} />,
    templates: [
      {
        id: "offline-meetup",
        title: "Офлайн встреча",
        description: "Отметьте присутствие на мероприятии",
        missionType: "OFFLINE_EVENT",
        experienceReward: 40,
        manaReward: 25,
        confirmationType: "QR_SCAN",
        minRank: 2,
      },
      {
        id: "custom-creative",
        title: "Творческое задание",
        description: "Произвольная миссия с ручной проверкой",
        missionType: "CUSTOM",
        experienceReward: 50,
        manaReward: 35,
        confirmationType: "MANUAL_REVIEW",
        minRank: 2,
      },
    ],
  },
];

export function NodeLibraryPanel({ onCreate }: NodeLibraryPanelProps) {
  return (
    <aside className="pointer-events-none absolute left-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-4 lg:flex">
      <div className="pointer-events-auto flex max-h-[80vh] w-[252px] flex-col overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-black/40 p-5 text-sm text-indigo-100/80 shadow-[0_20px_40px_rgba(6,3,24,0.45)] backdrop-blur-xl">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-indigo-200/60">
          <span>Библиотека миссий</span>
          <FolderKanban size={14} className="text-indigo-300" />
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-indigo-100/70">
          Перетаскивайте готовые блоки, чтобы ускорить создание кампании. Шаблоны можно редактировать после добавления.
        </p>

        <div className="mt-4 space-y-4">
          {templateCatalog.map((category) => (
            <div key={category.id} className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-200">
                  {category.icon}
                </span>
                {category.label}
              </div>

              <div className="space-y-3">
                {category.templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => onCreate(template)}
                    className={clsx(
                      "w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-indigo-400/50 hover:bg-indigo-500/10",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                    )}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">{template.title}</span>
                        <span className="rounded-lg bg-indigo-500/20 px-2 py-0.5 text-[11px] uppercase tracking-[0.15em] text-indigo-200">
                          {template.missionType}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-100/60">{template.description}</p>
                      <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-indigo-100/50">
                        <span>XP {template.experienceReward}</span>
                        <span>Мана {template.manaReward}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}


