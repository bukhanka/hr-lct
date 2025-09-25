"use client";

import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Edit3, Trash2, Star, Zap } from "lucide-react";
import clsx from "clsx";

interface Mission {
  id: string;
  name: string;
  description?: string;
  missionType: string;
  experienceReward: number;
  manaReward: number;
  confirmationType: string;
  minRank: number;
  competencies: any[];
}

interface MissionNodeData {
  mission: Mission;
  onEdit: (mission: Mission) => void;
  onDelete: () => void;
}

const missionTypeColors = {
  FILE_UPLOAD: "bg-blue-600",
  QUIZ: "bg-green-600", 
  OFFLINE_EVENT: "bg-purple-600",
  CUSTOM: "bg-indigo-600",
};

const missionTypeLabels = {
  FILE_UPLOAD: "Файл",
  QUIZ: "Тест",
  OFFLINE_EVENT: "Событие", 
  CUSTOM: "Кастом",
};

export function MissionNode({ data }: NodeProps<MissionNodeData>) {
  const { mission, onEdit, onDelete } = data;
  
  const colorClass = missionTypeColors[mission.missionType as keyof typeof missionTypeColors] || "bg-gray-600";
  const typeLabel = missionTypeLabels[mission.missionType as keyof typeof missionTypeLabels] || "Неизв.";

  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top}
        className="h-2 w-2 translate-y-[-8px] rounded-full border-[3px] border-[#111127] bg-indigo-400 shadow-[0_0_0_4px_rgba(45,29,123,0.35)]"
      />

      <div className="min-w-[220px] max-w-[260px] rounded-2xl border border-white/10 bg-white/10 p-4 shadow-[0_18px_40px_rgba(8,5,34,0.45)] backdrop-blur transition hover:border-white/30">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span
                className={clsx(
                  "rounded-lg px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white",
                  colorClass
                )}
              >
                {typeLabel}
              </span>
              {mission.minRank > 1 && (
                <span className="rounded-lg bg-yellow-500/20 px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-yellow-200">
                  Ранг {mission.minRank}+
                </span>
              )}
            </div>
            <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-white">
              {mission.name}
            </h3>
          </div>

          <div className="ml-2 flex gap-1">
            <button
              onClick={() => onEdit(mission)}
              className="rounded-lg p-1.5 text-indigo-200 transition hover:bg-white/20 hover:text-white"
              title="Редактировать"
            >
              <Edit3 size={12} />
            </button>
            <button
              onClick={onDelete}
              className="rounded-lg p-1.5 text-red-300 transition hover:bg-red-500/20 hover:text-red-200"
              title="Удалить"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        {mission.description && (
          <p className="mb-3 line-clamp-2 text-xs leading-snug text-indigo-100/70">
            {mission.description}
          </p>
        )}

        <div className="mb-3 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-100/60">
          <div className="flex items-center gap-1">
            <Star size={12} className="text-yellow-400" />
            <span className="text-yellow-300">{mission.experienceReward} XP</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap size={12} className="text-blue-400" />
            <span className="text-blue-300">{mission.manaReward} маны</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {mission.competencies?.slice(0, 3).map((comp, index) => (
            <span
              key={index}
              className="rounded-lg bg-white/10 px-2 py-0.5 text-[11px] text-white"
            >
              {comp.competency?.name || comp.name} +{comp.points}
            </span>
          ))}
          {mission.competencies && mission.competencies.length > 3 && (
            <span className="rounded-lg bg-white/10 px-2 py-0.5 text-[11px] text-white">+{mission.competencies.length - 3}</span>
          )}
        </div>
        {mission.competencies && mission.competencies.length > 0 && (
          <div className="mt-3 h-px bg-white/5" />
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="h-2 w-2 translate-y-[8px] rounded-full border-[3px] border-[#111127] bg-indigo-400 shadow-[0_0_0_4px_rgba(45,29,123,0.35)]"
      />
    </div>
  );
}
