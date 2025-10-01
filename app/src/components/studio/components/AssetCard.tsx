"use client";

import React from "react";
import { Image, Music, Mic, Trash2, Eye, Download, Sparkles, CheckSquare, Square } from "lucide-react";
import clsx from "clsx";

interface Asset {
  id: string;
  type: "image" | "audio" | "voice" | "music";
  fileName: string;
  fileUrl: string;
  fileSize: number;
  generatedBy?: "ai_gemini" | "manual" | "template";
  usedIn: string[];
  createdAt: string;
}

interface AssetCardProps {
  asset: Asset;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUse: () => void;
}

const TYPE_CONFIG = {
  image: { icon: Image, label: "Изображение", color: "indigo" },
  audio: { icon: Music, label: "Музыка", color: "purple" },
  voice: { icon: Mic, label: "Озвучка", color: "pink" },
  music: { icon: Music, label: "Музыка", color: "purple" },
};

const SOURCE_LABELS = {
  ai_gemini: { label: "AI Gemini", icon: Sparkles, color: "indigo" },
  manual: { label: "Загружено", icon: null, color: "gray" },
  template: { label: "Шаблон", icon: null, color: "green" },
};

export function AssetCard({ asset, isSelected, onSelect, onDelete, onUse }: AssetCardProps) {
  const config = TYPE_CONFIG[asset.type];
  const Icon = config.icon;
  const sourceConfig = asset.generatedBy ? SOURCE_LABELS[asset.generatedBy] : null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    return date.toLocaleDateString("ru-RU");
  };

  return (
    <div
      className={clsx(
        "group relative overflow-hidden rounded-xl border transition",
        isSelected
          ? "border-indigo-400 bg-indigo-500/10"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
      )}
    >
      {/* Selection Checkbox */}
      <button
        onClick={onSelect}
        className="absolute left-3 top-3 z-10 rounded-lg bg-black/40 p-1.5 text-white opacity-0 backdrop-blur transition group-hover:opacity-100"
      >
        {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
      </button>

      {/* Preview */}
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
        {asset.type === "image" ? (
          <img
            src={asset.fileUrl}
            alt={asset.fileName}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Icon size={48} className="text-indigo-300/40" />
          </div>
        )}

        {/* Type Badge */}
        <div className={clsx(
          "absolute right-3 top-3 rounded-full border border-white/20 px-2 py-1 text-[10px] font-medium backdrop-blur",
          `bg-${config.color}-500/20 text-${config.color}-200`
        )}>
          {config.label}
        </div>

        {/* AI Badge */}
        {sourceConfig?.icon && (
          <div className={clsx(
            "absolute left-3 bottom-3 flex items-center gap-1 rounded-full border border-white/20 px-2 py-1 text-[10px] font-medium backdrop-blur",
            `bg-${sourceConfig.color}-500/20 text-${sourceConfig.color}-200`
          )}>
            <sourceConfig.icon size={10} />
            {sourceConfig.label}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="truncate text-sm font-medium text-white" title={asset.fileName}>
          {asset.fileName}
        </p>
        
        <div className="mt-2 flex items-center justify-between text-xs text-indigo-200/60">
          <span>{formatFileSize(asset.fileSize)}</span>
          <span>{formatDate(asset.createdAt)}</span>
        </div>

        {/* Usage Info */}
        {asset.usedIn.length > 0 && (
          <div className="mt-3 rounded-lg bg-green-500/10 px-2 py-1 text-xs text-green-300">
            Используется: {asset.usedIn.length}×
          </div>
        )}

        {/* Audio Player */}
        {(asset.type === "audio" || asset.type === "voice" || asset.type === "music") && (
          <audio controls className="mt-3 w-full">
            <source src={asset.fileUrl} type="audio/mpeg" />
          </audio>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={onUse}
            className="flex-1 rounded-lg bg-indigo-500/20 px-3 py-2 text-xs font-medium text-indigo-200 transition hover:bg-indigo-500/30"
          >
            Использовать
          </button>
          <button
            onClick={onDelete}
            disabled={asset.usedIn.length > 0}
            className="rounded-lg bg-white/5 p-2 text-indigo-200/60 transition hover:bg-red-500/20 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
            title={asset.usedIn.length > 0 ? "Файл используется" : "Удалить"}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
