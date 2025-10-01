"use client";

import React, { useEffect, useState } from "react";
import { Image, Music, Mic, Trash2, Eye, Download, Search, Filter } from "lucide-react";
import clsx from "clsx";
import { AssetCard } from "../components/AssetCard";

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

interface LibraryTabProps {
  campaignId: string;
  onAssetSelect: (assetUrl: string) => void;
}

const ASSET_TYPES = [
  { id: "all", label: "Все", icon: null },
  { id: "image", label: "Изображения", icon: Image },
  { id: "audio", label: "Музыка", icon: Music },
  { id: "voice", label: "Озвучка", icon: Mic },
];

export function LibraryTab({ campaignId, onAssetSelect }: LibraryTabProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  useEffect(() => {
    loadAssets();
  }, [campaignId]);

  const loadAssets = async () => {
    setLoading(true);
    try {
      // TODO: Replace with real API call
      const response = await fetch(`/api/campaigns/${campaignId}/assets`);
      if (response.ok) {
        const data = await response.json();
        setAssets(data.assets || []);
      }
    } catch (error) {
      console.error("Failed to load assets:", error);
      // Mock data for demo
      setAssets([
        {
          id: "1",
          type: "image",
          fileName: "mission_icon_space.svg",
          fileUrl: "/themes/galactic-academy/icon.svg",
          fileSize: 12500,
          generatedBy: "ai_gemini",
          usedIn: ["mission_1", "mission_3"],
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          type: "image",
          fileName: "campaign_background.jpg",
          fileUrl: "/themes/galactic-academy/background.svg",
          fileSize: 450000,
          generatedBy: "manual",
          usedIn: ["campaign_theme"],
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm("Удалить этот файл? Он будет удалён из всех мест использования.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/assets/${assetId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setAssets(prev => prev.filter(a => a.id !== assetId));
      }
    } catch (error) {
      console.error("Failed to delete asset:", error);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Удалить выбранные файлы (${selectedAssets.length})?`)) {
      return;
    }
    
    // TODO: Implement bulk delete
    setSelectedAssets([]);
  };

  const filteredAssets = assets.filter(asset => {
    const matchesType = filterType === "all" || asset.type === filterType;
    const matchesSearch = asset.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const unusedAssets = assets.filter(a => a.usedIn.length === 0);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="border-b border-white/10 bg-black/10 p-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300/60" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени файла..."
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-indigo-200/40 focus:border-indigo-400 focus:outline-none"
            />
          </div>

          {/* Type Filter */}
          <div className="flex gap-2">
            {ASSET_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setFilterType(type.id)}
                  className={clsx(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
                    filterType === type.id
                      ? "bg-indigo-500/20 text-white"
                      : "text-indigo-200/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {Icon && <Icon size={14} />}
                  {type.label}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          {selectedAssets.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 rounded-lg bg-red-500/20 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/30"
            >
              <Trash2 size={14} />
              Удалить ({selectedAssets.length})
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 flex gap-6 text-xs text-indigo-200/60">
          <span>Всего файлов: {assets.length}</span>
          <span>·</span>
          <span>Не используется: {unusedAssets.length}</span>
          <span>·</span>
          <span>Показано: {filteredAssets.length}</span>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="flex-1 overflow-hidden">
        <div className="custom-scroll h-full overflow-y-auto p-6 pr-4">
          {loading ? (
            <div className="flex h-full items-center justify-center text-indigo-200/60">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
                <p className="mt-3 text-sm">Загрузка библиотеки...</p>
              </div>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex h-full items-center justify-center text-indigo-200/60">
              <div className="text-center">
                <Image size={48} className="mx-auto text-indigo-400/30" />
                <p className="mt-4 text-sm">
                  {searchQuery || filterType !== "all" ? "Файлы не найдены" : "Библиотека пуста"}
                </p>
                <p className="mt-1 text-xs text-indigo-200/40">
                  Загрузите файлы или создайте с помощью AI
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  isSelected={selectedAssets.includes(asset.id)}
                  onSelect={() => {
                    setSelectedAssets(prev =>
                      prev.includes(asset.id)
                        ? prev.filter(id => id !== asset.id)
                        : [...prev, asset.id]
                    );
                  }}
                  onDelete={() => handleDelete(asset.id)}
                  onUse={() => onAssetSelect(asset.fileUrl)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
