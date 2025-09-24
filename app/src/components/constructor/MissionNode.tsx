"use client";

import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Edit3, Trash2, Star, Zap } from "lucide-react";
import { clsx } from "clsx";

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
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-500 border-2 border-white" />
      
      <div className="min-w-[200px] bg-white/10 backdrop-blur border border-white/20 rounded-xl p-4 shadow-lg hover:border-white/40 transition-all">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={clsx(
                "px-2 py-0.5 rounded-lg text-xs font-medium text-white",
                colorClass
              )}>
                {typeLabel}
              </span>
              {mission.minRank > 1 && (
                <span className="px-2 py-0.5 rounded-lg bg-yellow-600/80 text-xs font-medium text-white">
                  Ранг {mission.minRank}+
                </span>
              )}
            </div>
            <h3 className="text-white font-medium text-sm leading-tight line-clamp-2">
              {mission.name}
            </h3>
          </div>
          
          <div className="flex gap-1 ml-2">
            <button
              onClick={() => onEdit(mission)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-indigo-200 hover:text-white"
              title="Редактировать"
            >
              <Edit3 size={12} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-red-300 hover:text-red-200"
              title="Удалить"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Description */}
        {mission.description && (
          <p className="text-indigo-100/70 text-xs mb-3 line-clamp-2">
            {mission.description}
          </p>
        )}

        {/* Rewards */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-1">
            <Star size={12} className="text-yellow-400" />
            <span className="text-xs text-yellow-400 font-medium">
              {mission.experienceReward} XP
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Zap size={12} className="text-blue-400" />
            <span className="text-xs text-blue-400 font-medium">
              {mission.manaReward} маны
            </span>
          </div>
        </div>

        {/* Competencies */}
        {mission.competencies && mission.competencies.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {mission.competencies.slice(0, 3).map((comp, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-white/10 text-xs text-white rounded-md"
              >
                {comp.competency?.name || comp.name} +{comp.points}
              </span>
            ))}
            {mission.competencies.length > 3 && (
              <span className="px-2 py-0.5 bg-white/10 text-xs text-white rounded-md">
                +{mission.competencies.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-500 border-2 border-white" />
    </div>
  );
}
