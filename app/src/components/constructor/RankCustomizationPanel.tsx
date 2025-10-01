"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RankConfig } from "@/types/campaignTheme";
import { DEFAULT_RANKS } from "@/data/theme-presets";

interface RankCustomizationPanelProps {
  campaignId: string;
  themeId: string;
  onRanksChange?: (ranks: RankConfig[]) => void;
}

export function RankCustomizationPanel({
  campaignId,
  themeId,
  onRanksChange,
}: RankCustomizationPanelProps) {
  const [ranks, setRanks] = useState<RankConfig[]>([]);
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingRank, setEditingRank] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load ranks on mount
  useEffect(() => {
    loadRanks();
  }, [campaignId]);

  const loadRanks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/campaigns/${campaignId}/ranks`);
      if (!response.ok) throw new Error("Failed to load ranks");
      
      const data = await response.json();
      setRanks(data.ranks || []);
      setIsCustom(data.isCustom || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const cloneDefaultRanks = async () => {
    if (!confirm("Клонировать стандартные ранги? Текущие кастомные ранги будут удалены.")) {
      return;
    }

    try {
      setLoading(true);
      
      // Delete existing custom ranks
      if (isCustom) {
        await fetch(`/api/campaigns/${campaignId}/ranks`, {
          method: "DELETE",
        });
      }

      // Clone defaults
      const response = await fetch(`/api/campaigns/${campaignId}/ranks/clone-defaults`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to clone ranks");
      
      const data = await response.json();
      setRanks(data.ranks);
      setIsCustom(true);
      onRanksChange?.(data.ranks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clone ranks");
    } finally {
      setLoading(false);
    }
  };

  const applyThemeDefaults = () => {
    const themeRanks = DEFAULT_RANKS[themeId];
    if (themeRanks) {
      setRanks(themeRanks);
      setIsCustom(true);
      onRanksChange?.(themeRanks);
    }
  };

  const saveRank = async (rank: RankConfig) => {
    try {
      // Find existing rank in DB
      const existingRankInDb = ranks.find(r => r.level === rank.level);
      
      if (existingRankInDb && 'id' in existingRankInDb) {
        // Update existing rank
        const response = await fetch(`/api/campaigns/${campaignId}/ranks/${(existingRankInDb as any).id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rank),
        });

        if (!response.ok) throw new Error("Failed to update rank");
        
        const updated = await response.json();
        setRanks(ranks.map(r => r.level === rank.level ? updated : r));
      } else {
        // Create new rank
        const response = await fetch(`/api/campaigns/${campaignId}/ranks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rank),
        });

        if (!response.ok) throw new Error("Failed to create rank");
        
        const created = await response.json();
        setRanks([...ranks, created].sort((a, b) => a.level - b.level));
        setIsCustom(true);
      }

      setEditingRank(null);
      onRanksChange?.(ranks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save rank");
    }
  };

  const deleteRank = async (level: number) => {
    if (!confirm(`Удалить ранг уровня ${level}?`)) return;

    try {
      const rankToDelete = ranks.find(r => r.level === level);
      if (!rankToDelete || !('id' in rankToDelete)) {
        // Just remove from local state if not in DB
        setRanks(ranks.filter(r => r.level !== level));
        return;
      }

      const response = await fetch(
        `/api/campaigns/${campaignId}/ranks/${(rankToDelete as any).id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete rank");
      
      setRanks(ranks.filter(r => r.level !== level));
      onRanksChange?.(ranks.filter(r => r.level !== level));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete rank");
    }
  };

  const addNewRank = () => {
    const nextLevel = ranks.length > 0 ? Math.max(...ranks.map(r => r.level)) + 1 : 1;
    const newRank: RankConfig = {
      level: nextLevel,
      name: `Ранг ${nextLevel}`,
      title: "Новый титул",
      description: "",
      minExperience: nextLevel * 100,
      minMissions: nextLevel * 2,
      rewards: { mana: nextLevel * 50 },
    };
    
    setRanks([...ranks, newRank]);
    setEditingRank(nextLevel);
  };

  const revertToGlobal = async () => {
    if (!confirm("Удалить все кастомные ранги и вернуться к глобальным?")) return;

    try {
      setLoading(true);
      await fetch(`/api/campaigns/${campaignId}/ranks`, {
        method: "DELETE",
      });
      
      await loadRanks();
      onRanksChange?.([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revert to global ranks");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Система рангов</h3>
          <p className="text-sm text-gray-400">
            {isCustom ? "Кастомные ранги кампании" : "Глобальные ранги (по умолчанию)"}
          </p>
        </div>
        
        <div className="flex gap-2">
          {!isCustom && (
            <>
              <button
                onClick={cloneDefaultRanks}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition"
              >
                Клонировать стандартные
              </button>
              <button
                onClick={applyThemeDefaults}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
              >
                Применить ранги темы
              </button>
            </>
          )}
          
          {isCustom && (
            <button
              onClick={revertToGlobal}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition"
            >
              Вернуться к глобальным
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-300 hover:text-red-200 text-xs mt-2"
          >
            Закрыть
          </button>
        </div>
      )}

      {/* Ranks list */}
      <div className="space-y-3">
        <AnimatePresence>
          {ranks.map((rank) => (
            <RankCard
              key={rank.level}
              rank={rank}
              isEditing={editingRank === rank.level}
              isCustom={isCustom}
              onEdit={() => setEditingRank(rank.level)}
              onSave={saveRank}
              onCancel={() => setEditingRank(null)}
              onDelete={() => deleteRank(rank.level)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Add button */}
      {isCustom && (
        <button
          onClick={addNewRank}
          className="w-full py-3 border-2 border-dashed border-gray-600 hover:border-purple-500 rounded-lg text-gray-400 hover:text-purple-400 transition"
        >
          + Добавить ранг
        </button>
      )}
    </div>
  );
}

interface RankCardProps {
  rank: RankConfig;
  isEditing: boolean;
  isCustom: boolean;
  onEdit: () => void;
  onSave: (rank: RankConfig) => void;
  onCancel: () => void;
  onDelete: () => void;
}

function RankCard({ rank, isEditing, isCustom, onEdit, onSave, onCancel, onDelete }: RankCardProps) {
  const [editedRank, setEditedRank] = useState<RankConfig>(rank);

  useEffect(() => {
    setEditedRank(rank);
  }, [rank]);

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-4 space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Уровень</label>
            <input
              type="number"
              value={editedRank.level}
              onChange={(e) => setEditedRank({ ...editedRank, level: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Иконка URL</label>
            <input
              type="text"
              value={editedRank.iconUrl || ""}
              onChange={(e) => setEditedRank({ ...editedRank, iconUrl: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
              placeholder="/ranks/icon.svg"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Название</label>
          <input
            type="text"
            value={editedRank.name}
            onChange={(e) => setEditedRank({ ...editedRank, name: e.target.value })}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Титул</label>
          <input
            type="text"
            value={editedRank.title}
            onChange={(e) => setEditedRank({ ...editedRank, title: e.target.value })}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Описание</label>
          <textarea
            value={editedRank.description || ""}
            onChange={(e) => setEditedRank({ ...editedRank, description: e.target.value })}
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Мин. опыт</label>
            <input
              type="number"
              value={editedRank.minExperience}
              onChange={(e) => setEditedRank({ ...editedRank, minExperience: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Мин. миссий</label>
            <input
              type="number"
              value={editedRank.minMissions}
              onChange={(e) => setEditedRank({ ...editedRank, minMissions: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Награда (мана)</label>
          <input
            type="number"
            value={editedRank.rewards?.mana || 0}
            onChange={(e) =>
              setEditedRank({
                ...editedRank,
                rewards: { ...editedRank.rewards, mana: parseInt(e.target.value) },
              })
            }
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm"
          />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition"
          >
            Отмена
          </button>
          <button
            onClick={() => onSave(editedRank)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition"
          >
            Сохранить
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-gray-800/30 border border-gray-700 hover:border-gray-600 rounded-lg p-4 transition group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 font-bold">
              {rank.level}
            </div>
            <div>
              <h4 className="text-white font-medium">{rank.name}</h4>
              <p className="text-sm text-gray-400">{rank.title}</p>
            </div>
          </div>
          
          {rank.description && (
            <p className="text-sm text-gray-500 mb-2">{rank.description}</p>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="text-blue-400">⚡</span> {rank.minExperience} XP
            </span>
            <span className="flex items-center gap-1">
              <span className="text-green-400">✓</span> {rank.minMissions} миссий
            </span>
            {rank.rewards?.mana && (
              <span className="flex items-center gap-1">
                <span className="text-purple-400">💎</span> +{rank.rewards.mana} маны
              </span>
            )}
          </div>
        </div>

        {isCustom && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={onEdit}
              className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition"
              title="Редактировать"
            >
              ✏️
            </button>
            <button
              onClick={onDelete}
              className="p-2 hover:bg-red-900/30 rounded text-gray-400 hover:text-red-400 transition"
              title="Удалить"
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

