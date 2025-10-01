"use client";

import React, { useState } from "react";
import { Image, Music, Mic, Sparkles, Wand2, Loader2 } from "lucide-react";
import clsx from "clsx";

interface AIGeneratorTabProps {
  campaignId: string;
  context?: {
    type: "campaign" | "mission";
    id?: string;
    name?: string;
  };
}

type GeneratorType = "image" | "music" | "voice";

interface Generator {
  id: GeneratorType;
  label: string;
  icon: React.ComponentType<{ size: number; className?: string }>;
  description: string;
  placeholder: string;
  examples: string[];
}

const GENERATORS: Generator[] = [
  {
    id: "image",
    label: "Генерация изображения",
    icon: Image,
    description: "Создайте иконку миссии, фон кампании или артефакт с помощью AI",
    placeholder: "Например: космический шлем, неоновый стиль, голубое свечение",
    examples: [
      "Космический компас с золотым свечением",
      "Футуристичный бейдж миссии, минимализм",
      "Звездная карта галактики, фиолетовые тона",
    ],
  },
  {
    id: "music",
    label: "Генерация музыки",
    icon: Music,
    description: "Создайте фоновую музыку для кампании",
    placeholder: "Например: спокойный космический эмбиент, без барабанов",
    examples: [
      "Эпическая космическая музыка, оркестр",
      "Кибер-панк, синтезаторы, энергичная",
      "Медитативный эмбиент для концентрации",
    ],
  },
  {
    id: "voice",
    label: "Озвучка текста",
    icon: Mic,
    description: "Озвучьте описание миссии голосом бортового компьютера",
    placeholder: "Введите текст для озвучки...",
    examples: [
      "Кадет, добро пожаловать на борт флагмана!",
      "Миссия активирована. Приготовьтесь к старту.",
      "Внимание! Обнаружена аномалия в секторе 7.",
    ],
  },
];

const VOICE_OPTIONS = [
  { id: "captain", label: "Капитан корабля", voice: "ru-RU-Wavenet-B" },
  { id: "ai", label: "Бортовой компьютер", voice: "ru-RU-Wavenet-D" },
  { id: "narrator", label: "Рассказчик", voice: "ru-RU-Wavenet-A" },
];

export function AIGeneratorTab({ campaignId, context }: AIGeneratorTabProps) {
  const [activeGenerator, setActiveGenerator] = useState<GeneratorType>("image");
  const [prompt, setPrompt] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0].id);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const currentGenerator = GENERATORS.find(g => g.id === activeGenerator)!;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Введите описание для генерации");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResults([]);

    try {
      if (activeGenerator === "image") {
        const response = await fetch("/api/ai/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            theme: "galactic-academy",
            aspectRatio: "square",
          }),
        });

        if (!response.ok) throw new Error("Ошибка генерации");
        
        const data = await response.json();
        setResults(data.images || [data.imageUrl]);
        
      } else if (activeGenerator === "music") {
        const response = await fetch("/api/ai/generate-music", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            duration: 60,
          }),
        });

        if (!response.ok) throw new Error("Ошибка генерации");
        
        const data = await response.json();
        setResults([data.audioUrl]);
        
      } else if (activeGenerator === "voice") {
        const voiceConfig = VOICE_OPTIONS.find(v => v.id === selectedVoice);
        const response = await fetch("/api/ai/text-to-speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: prompt,
            voice: voiceConfig?.voice || "ru-RU-Wavenet-A",
          }),
        });

        if (!response.ok) throw new Error("Ошибка генерации");
        
        const data = await response.json();
        setResults([data.audioUrl]);
      }
    } catch (err) {
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "Не удалось сгенерировать");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseExample = (example: string) => {
    setPrompt(example);
  };

  const handleSaveToLibrary = async (resultUrl: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeGenerator,
          fileUrl: resultUrl,
          fileName: `ai_${activeGenerator}_${Date.now()}`,
          generatedBy: "ai_gemini",
          prompt,
        }),
      });

      if (response.ok) {
        alert("Сохранено в библиотеку!");
      }
    } catch (error) {
      console.error("Failed to save:", error);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Generator Selection Sidebar */}
      <aside className="custom-scroll w-72 overflow-y-auto border-r border-white/10 bg-black/10 p-6 pr-4">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-indigo-200/60">
          Тип генерации
        </h3>
        <div className="space-y-2">
          {GENERATORS.map((generator) => {
            const Icon = generator.icon;
            const isActive = activeGenerator === generator.id;
            
            return (
              <button
                key={generator.id}
                onClick={() => {
                  setActiveGenerator(generator.id);
                  setPrompt("");
                  setResults([]);
                  setError(null);
                }}
                className={clsx(
                  "group w-full rounded-xl border p-4 text-left transition",
                  isActive
                    ? "border-indigo-400 bg-indigo-500/20 text-white"
                    : "border-white/10 bg-white/5 text-indigo-200/70 hover:border-white/20 hover:bg-white/10 hover:text-white"
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon
                    size={20}
                    className={clsx(
                      "mt-0.5 shrink-0",
                      isActive ? "text-indigo-300" : "text-indigo-400/60"
                    )}
                  />
                  <div>
                    <div className="font-semibold">{generator.label}</div>
                    <div className="mt-1 text-xs text-indigo-200/60">
                      {generator.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Tips */}
        <div className="mt-8 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-200">
            <Sparkles size={14} />
            Совет
          </div>
          <p className="mt-2 text-xs leading-relaxed text-indigo-200/70">
            Для лучших результатов указывайте стиль, цвета и настроение. Например: "минимализм, голубые тона, космос"
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="custom-scroll flex-1 overflow-y-auto p-8 pr-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white">{currentGenerator.label}</h2>
            <p className="mt-1 text-sm text-indigo-200/70">{currentGenerator.description}</p>
          </div>

          {/* Input Section */}
          <div className="space-y-4">
            {/* Voice Selection (only for voice generator) */}
            {activeGenerator === "voice" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Голос</label>
                <div className="grid grid-cols-3 gap-2">
                  {VOICE_OPTIONS.map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => setSelectedVoice(voice.id)}
                      className={clsx(
                        "rounded-lg border px-3 py-2 text-sm transition",
                        selectedVoice === voice.id
                          ? "border-indigo-400 bg-indigo-500/20 text-white"
                          : "border-white/10 bg-white/5 text-indigo-200/70 hover:border-white/20"
                      )}
                    >
                      {voice.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                {activeGenerator === "voice" ? "Текст для озвучки" : "Описание"}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={currentGenerator.placeholder}
                rows={4}
                className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-indigo-200/40 focus:border-indigo-400 focus:outline-none"
              />
            </div>

            {/* Examples */}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-indigo-200/60">
                Примеры
              </label>
              <div className="flex flex-wrap gap-2">
                {currentGenerator.examples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleUseExample(example)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-indigo-200/80 transition hover:border-indigo-400/50 hover:bg-indigo-500/10 hover:text-white"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500/90 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Генерируем...
                </>
              ) : (
                <>
                  <Wand2 size={18} />
                  Создать с AI
                </>
              )}
            </button>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            )}
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-semibold text-white">Результаты</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {results.map((resultUrl, index) => (
                  <div
                    key={index}
                    className="overflow-hidden rounded-xl border border-white/10 bg-white/5"
                  >
                    {activeGenerator === "image" ? (
                      <img
                        src={resultUrl}
                        alt={`Result ${index + 1}`}
                        className="h-48 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-48 items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                        <Music size={48} className="text-indigo-300/60" />
                      </div>
                    )}
                    <div className="p-4">
                      {(activeGenerator === "music" || activeGenerator === "voice") && (
                        <audio controls className="mb-3 w-full">
                          <source src={resultUrl} type="audio/mpeg" />
                        </audio>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveToLibrary(resultUrl)}
                          className="flex-1 rounded-lg bg-indigo-500/20 px-3 py-2 text-sm font-medium text-indigo-200 transition hover:bg-indigo-500/30"
                        >
                          Сохранить в библиотеку
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
