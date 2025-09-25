"use client";

import React, { useEffect, useState } from "react";
import { X, Save, Sparkles } from "lucide-react";
import { PanelSection, FieldLabel, NumberStepper } from "./ui";

interface Mission {
  id: string;
  name: string;
  description?: string;
  missionType: string;
  experienceReward: number;
  manaReward: number;
  positionX: number;
  positionY: number;
  confirmationType: string;
  minRank: number;
  competencies: any[];
}

interface Competency {
  id: string;
  name: string;
  iconUrl?: string;
}

interface MissionEditPanelProps {
  mission: Mission;
  onSave: (mission: Mission) => void | Promise<void>;
  onClose: () => void;
  campaignId: string;
}

const missionTypes = [
  { value: "FILE_UPLOAD", label: "Загрузка файла" },
  { value: "QUIZ", label: "Тест/Викторина" },
  { value: "OFFLINE_EVENT", label: "Офлайн событие" },
  { value: "CUSTOM", label: "Произвольное задание" },
];

const confirmationTypes = [
  { value: "AUTO", label: "Автоматически" },
  { value: "MANUAL_REVIEW", label: "Ручная проверка" },
  { value: "QR_SCAN", label: "QR-код" },
  { value: "FILE_CHECK", label: "Проверка файла" },
];

export function MissionEditPanel({ mission, onSave, onClose }: MissionEditPanelProps) {
  const [formData, setFormData] = useState<Mission>(mission);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");

  useEffect(() => {
    fetch("/api/competencies")
      .then((res) => res.json())
      .then((data) => setCompetencies(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setFormData(mission);
  }, [mission]);

  const handleInputChange = (field: keyof Mission, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCompetencyChange = (competencyId: string, points: number) => {
    setFormData((prev) => {
      const existingCompetencies = prev.competencies || [];
      const index = existingCompetencies.findIndex((comp) => comp.competencyId === competencyId);

      if (index >= 0) {
        if (points === 0) {
          return {
            ...prev,
            competencies: existingCompetencies.filter((comp) => comp.competencyId !== competencyId),
          };
        }

        const updated = [...existingCompetencies];
        updated[index].points = points;
        return {
          ...prev,
          competencies: updated,
        };
      }

      if (points > 0) {
        return {
          ...prev,
          competencies: [...existingCompetencies, { competencyId, points }],
        };
      }

      return prev;
    });
  };

  const getCompetencyPoints = (competencyId: string) => {
    const comp = formData.competencies?.find((c) => c.competencyId === competencyId);
    return comp?.points || 0;
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await Promise.resolve(onSave(formData));
    } finally {
      setIsLoading(false);
    }
  };

  const generateAiSuggestion = () => {
    setAiSuggestion("Загружаем предложение ИИ...");
    setTimeout(() => {
      const suggestions = [
        "Кадет, для прохождения в следующий сектор галактики, загрузите доказательство вашей квалификации в виде сертификата или диплома в бортовой компьютер.",
        "Командир поручает вам пройти симуляцию боевых действий. Покажите своё мастерство в виртуальном тренажёре и докажите готовность к реальным миссиям.",
        "Внимание, кадет! Для участия в межгалактической экспедиции необходимо посетить брифинг в командном центре. Ваше присутствие обязательно!",
      ];
      setAiSuggestion(suggestions[Math.floor(Math.random() * suggestions.length)]);
    }, 1500);
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion || aiSuggestion === "Загружаем предложение ИИ...") {
      return;
    }
    handleInputChange("description", aiSuggestion);
    setAiSuggestion("");
  };

  return (
    <aside className="flex h-full w-[380px] flex-col border-l border-white/10 bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514] shadow-[0_24px_54px_rgba(4,2,18,0.6)]">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div>
          <h2 className="text-xl font-semibold text-white">Редактирование миссии</h2>
          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-indigo-200/60">Настройте карточку и награды</p>
        </div>
        <button onClick={onClose} className="rounded-xl border border-white/10 p-2 text-indigo-200 transition hover:border-white/30 hover:text-white">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <PanelSection
          title="Основное"
          description="Название и описание миссии"
          action={
            <button
              onClick={generateAiSuggestion}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-500/80 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500"
            >
              <Sparkles size={12} />
              ИИ-помощь
            </button>
          }
        >
          <div className="space-y-3">
            <div className="space-y-2">
              <FieldLabel label="Название миссии" hint="Для кадета" htmlFor="mission-name" />
              <input
                id="mission-name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-indigo-100/40 focus:border-indigo-400 focus:outline-none"
                placeholder="Например, 'Досье кадета'"
              />
            </div>
            <div className="space-y-2">
              <FieldLabel label="Описание" htmlFor="mission-desc" />
              <textarea
                id="mission-desc"
                value={formData.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-indigo-100/40 focus:border-indigo-400 focus:outline-none"
                placeholder="Опишите миссию в стилистике кампании..."
              />
            </div>
          </div>

          {aiSuggestion && (
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-600/15 p-4 text-sm text-indigo-100/70">
              <div className="flex items-start justify-between gap-3">
                <p className="flex-1 leading-snug">{aiSuggestion}</p>
                {aiSuggestion !== "Загружаем предложение ИИ..." && (
                  <button onClick={applyAiSuggestion} className="rounded-lg bg-indigo-500/80 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-500">
                    Применить
                  </button>
                )}
              </div>
            </div>
          )}
        </PanelSection>

        <PanelSection title="Тип и подтверждение" description="Определите формат миссии">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <FieldLabel label="Тип миссии" />
              <select
                value={formData.missionType}
                onChange={(e) => handleInputChange("missionType", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-indigo-400 focus:outline-none"
              >
                {missionTypes.map((type) => (
                  <option key={type.value} value={type.value} className="bg-slate-900">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <FieldLabel label="Подтверждение" />
              <select
                value={formData.confirmationType}
                onChange={(e) => handleInputChange("confirmationType", e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-indigo-400 focus:outline-none"
              >
                {confirmationTypes.map((type) => (
                  <option key={type.value} value={type.value} className="bg-slate-900">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </PanelSection>

        <PanelSection title="Награды" description="Сбалансируйте экономику кампании">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <FieldLabel label="Опыт (XP)" />
              <NumberStepper value={formData.experienceReward} min={0} max={500} step={5} onChange={(value) => handleInputChange("experienceReward", value)} />
            </div>
            <div className="space-y-2">
              <FieldLabel label="Мана" />
              <NumberStepper value={formData.manaReward} min={0} max={500} step={5} onChange={(value) => handleInputChange("manaReward", value)} />
            </div>
            <div className="space-y-2">
              <FieldLabel label="Мин. ранг" />
              <NumberStepper value={formData.minRank} min={1} max={10} onChange={(value) => handleInputChange("minRank", value)} />
            </div>
          </div>
        </PanelSection>

        <PanelSection title="Компетенции" description="Прокачиваемые навыки">
          <div className="space-y-3">
            {competencies.length === 0 && (
              <p className="text-sm text-indigo-100/40">Компетенции не найдены. Создайте их через API или админку.</p>
            )}
            {competencies.map((competency) => (
              <div key={competency.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{competency.name}</p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-100/50">Макс 10 очков</p>
                </div>
                <NumberStepper value={getCompetencyPoints(competency.id)} min={0} max={10} onChange={(value) => handleCompetencyChange(competency.id, value)} />
              </div>
            ))}
          </div>
        </PanelSection>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 px-6 py-5">
        <button onClick={onClose} className="rounded-xl border border-white/10 px-5 py-2 text-sm text-indigo-100/80 transition hover:border-white/30 hover:text-white">
          Отменить
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-500/90 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={16} />
          {isLoading ? "Сохранение..." : "Сохранить"}
        </button>
      </div>
    </aside>
  );
}
