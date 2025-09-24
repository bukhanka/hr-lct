"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Sparkles } from "lucide-react";

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
  onSave: (mission: Mission) => void;
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

export function MissionEditPanel({
  mission,
  onSave,
  onClose,
  campaignId,
}: MissionEditPanelProps) {
  const [formData, setFormData] = useState<Mission>(mission);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");

  useEffect(() => {
    // Load available competencies
    fetch("/api/competencies")
      .then((res) => res.json())
      .then((data) => setCompetencies(data))
      .catch(console.error);
  }, []);

  const handleInputChange = (
    field: keyof Mission,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCompetencyChange = (competencyId: string, points: number) => {
    setFormData((prev) => {
      const existingCompetencies = prev.competencies || [];
      const competencyIndex = existingCompetencies.findIndex(
        (comp) => comp.competencyId === competencyId
      );

      if (competencyIndex >= 0) {
        if (points === 0) {
          // Remove competency
          return {
            ...prev,
            competencies: existingCompetencies.filter(
              (comp) => comp.competencyId !== competencyId
            ),
          };
        } else {
          // Update points
          const updatedCompetencies = [...existingCompetencies];
          updatedCompetencies[competencyIndex].points = points;
          return {
            ...prev,
            competencies: updatedCompetencies,
          };
        }
      } else if (points > 0) {
        // Add new competency
        return {
          ...prev,
          competencies: [
            ...existingCompetencies,
            { competencyId, points },
          ],
        };
      }
      return prev;
    });
  };

  const getCompetencyPoints = (competencyId: string): number => {
    const comp = formData.competencies?.find(
      (c) => c.competencyId === competencyId
    );
    return comp?.points || 0;
  };

  const handleSave = () => {
    setIsLoading(true);
    onSave(formData);
  };

  const generateAiSuggestion = async () => {
    setAiSuggestion("Загружаем предложение ИИ...");
    
    // Mock AI suggestion for now
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
    handleInputChange("description", aiSuggestion);
    setAiSuggestion("");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514] border border-white/20 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">
            Редактирование миссии
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-indigo-200 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-2">
                Название миссии
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-indigo-100/40 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
                placeholder="Введите название миссии..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-indigo-200">
                  Описание
                </label>
                <button
                  onClick={generateAiSuggestion}
                  className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-xs text-white hover:from-indigo-700 hover:to-purple-700 transition-colors"
                >
                  <Sparkles size={12} />
                  ИИ-помощь
                </button>
              </div>
              <textarea
                value={formData.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-indigo-100/40 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors resize-none"
                placeholder="Опишите задание для кадета..."
              />
              
              {aiSuggestion && (
                <div className="mt-3 p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-indigo-100/80 flex-1">
                      {aiSuggestion}
                    </p>
                    {aiSuggestion !== "Загружаем предложение ИИ..." && (
                      <button
                        onClick={applyAiSuggestion}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs text-white transition-colors whitespace-nowrap"
                      >
                        Применить
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mission Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-2">
                Тип миссии
              </label>
              <select
                value={formData.missionType}
                onChange={(e) => handleInputChange("missionType", e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
              >
                {missionTypes.map((type) => (
                  <option key={type.value} value={type.value} className="bg-gray-800">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-2">
                Подтверждение
              </label>
              <select
                value={formData.confirmationType}
                onChange={(e) => handleInputChange("confirmationType", e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
              >
                {confirmationTypes.map((type) => (
                  <option key={type.value} value={type.value} className="bg-gray-800">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rewards */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-2">
                Опыт (XP)
              </label>
              <input
                type="number"
                value={formData.experienceReward}
                onChange={(e) => handleInputChange("experienceReward", parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-2">
                Мана
              </label>
              <input
                type="number"
                value={formData.manaReward}
                onChange={(e) => handleInputChange("manaReward", parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-2">
                Мин. ранг
              </label>
              <input
                type="number"
                value={formData.minRank}
                onChange={(e) => handleInputChange("minRank", parseInt(e.target.value) || 1)}
                min="1"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
              />
            </div>
          </div>

          {/* Competencies */}
          <div>
            <label className="block text-sm font-medium text-indigo-200 mb-3">
              Прокачиваемые компетенции
            </label>
            <div className="space-y-3">
              {competencies.map((competency) => (
                <div key={competency.id} className="flex items-center gap-3">
                  <span className="flex-1 text-sm text-white">
                    {competency.name}
                  </span>
                  <input
                    type="number"
                    value={getCompetencyPoints(competency.id)}
                    onChange={(e) => handleCompetencyChange(competency.id, parseInt(e.target.value) || 0)}
                    min="0"
                    max="10"
                    className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-center focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors"
                  />
                </div>
              ))}
              {competencies.length === 0 && (
                <p className="text-sm text-indigo-100/40 italic">
                  Компетенции не найдены. Создайте их через API или админку.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-white/20 rounded-xl text-indigo-200 hover:text-white hover:border-white/40 transition-colors"
          >
            Отменить
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl text-white transition-colors"
          >
            <Save size={16} />
            {isLoading ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}
