"use client";

import React, { useState } from "react";
import { X, Image, Music, Mic, Upload, Sparkles, Library, Package } from "lucide-react";
import clsx from "clsx";
import { LibraryTab } from "./tabs/LibraryTab";
import { AIGeneratorTab } from "./tabs/AIGeneratorTab";
import { UploadTab } from "./tabs/UploadTab";
import { TemplatesTab } from "./tabs/TemplatesTab";

interface ContentStudioProps {
  campaignId: string;
  isOpen: boolean;
  onClose: () => void;
  onAssetSelect?: (assetUrl: string) => void;
  context?: {
    type: "campaign" | "mission";
    id?: string;
    name?: string;
  };
}

type TabType = "library" | "ai" | "upload" | "templates";

const TABS = [
  { id: "library" as TabType, label: "Библиотека", icon: Library, description: "Все медиа-файлы кампании" },
  { id: "ai" as TabType, label: "AI Генератор", icon: Sparkles, description: "Создание с помощью ИИ" },
  { id: "upload" as TabType, label: "Загрузка", icon: Upload, description: "Загрузить свои файлы" },
  { id: "templates" as TabType, label: "Шаблоны", icon: Package, description: "Готовые наборы от экспертов" },
];

export function ContentStudio({ campaignId, isOpen, onClose, onAssetSelect, context }: ContentStudioProps) {
  const [activeTab, setActiveTab] = useState<TabType>("library");

  if (!isOpen) return null;

  const handleAssetSelect = (assetUrl: string) => {
    // Callback для выбора ассета
    if (onAssetSelect) {
      onAssetSelect(assetUrl);
    } else {
      console.log("Asset selected:", assetUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Panel */}
      <div className="relative z-10 flex h-[85vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514] shadow-[0_32px_64px_rgba(4,2,18,0.8)] animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <header className="relative border-b border-white/10 bg-black/20 px-8 py-6 backdrop-blur">
          <div className="absolute -left-16 top-2 h-32 w-32 rounded-full bg-indigo-600/25 blur-3xl" />
          <div className="absolute -top-10 right-8 h-36 w-36 rounded-full bg-purple-500/20 blur-3xl" />
          
          <div className="relative flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Content Studio</h2>
              <p className="mt-1 text-sm text-indigo-200/70">
                Управление медиа-контентом кампании · AI генерация · Библиотека ассетов
              </p>
              {context && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  Контекст: {context.type === "mission" ? "Миссия" : "Кампания"} {context.name && `"${context.name}"`}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-indigo-200 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Tabs Navigation */}
        <nav className="border-b border-white/10 bg-black/10 px-8 py-4">
          <div className="flex gap-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    "group relative flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                    isActive
                      ? "bg-indigo-500/20 text-white shadow-lg shadow-indigo-500/20"
                      : "text-indigo-200/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon size={16} className={clsx(isActive ? "text-indigo-300" : "text-indigo-400/60")} />
                  <div className="text-left">
                    <div className="font-semibold">{tab.label}</div>
                    {isActive && (
                      <div className="text-[10px] uppercase tracking-wider text-indigo-300/60">
                        {tab.description}
                      </div>
                    )}
                  </div>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Tab Content */}
        <main className="flex-1 overflow-hidden">
          {activeTab === "library" && (
            <LibraryTab campaignId={campaignId} onAssetSelect={handleAssetSelect} />
          )}
          {activeTab === "ai" && (
            <AIGeneratorTab campaignId={campaignId} context={context} />
          )}
          {activeTab === "upload" && (
            <UploadTab campaignId={campaignId} />
          )}
          {activeTab === "templates" && (
            <TemplatesTab campaignId={campaignId} />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black/20 px-8 py-4 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-indigo-200/60">
            <div className="flex items-center gap-4">
              <span>Поддерживаемые форматы: JPG, PNG, SVG, MP3, WAV</span>
              <span>·</span>
              <span>Макс размер: 10 МБ</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="rounded bg-white/10 px-2 py-1 font-mono text-[10px]">Esc</kbd>
              <span>закрыть</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
