"use client";

import React from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Edit3, Trash2, Star, Zap, CheckCircle2, PlayCircle, LockKeyhole, Clock3, Copy } from "lucide-react";
import clsx from "clsx";
import { useTheme } from "@/contexts/ThemeContext";

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
  testStatus?: "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "PENDING_REVIEW" | "COMPLETED" | null;
  onEdit: (mission: Mission) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
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

const statusStyles: Record<string, { chip: string; border: string; icon: React.ReactNode; label: string }> = {
  COMPLETED: {
    chip: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30",
    border: "ring-2 ring-emerald-400/40",
    icon: <CheckCircle2 size={12} className="text-emerald-300" />,
    label: "Завершено",
  },
  AVAILABLE: {
    chip: "bg-sky-500/15 text-sky-200 border border-sky-500/30",
    border: "ring-2 ring-sky-400/40",
    icon: <PlayCircle size={12} className="text-sky-300" />,
    label: "Доступно",
  },
  LOCKED: {
    chip: "bg-zinc-700/40 text-zinc-300 border border-zinc-600/60",
    border: "ring-2 ring-zinc-500/30",
    icon: <LockKeyhole size={12} className="text-zinc-200" />,
    label: "Заблокировано",
  },
  PENDING_REVIEW: {
    chip: "bg-amber-500/15 text-amber-200 border border-amber-500/30",
    border: "ring-2 ring-amber-400/40",
    icon: <Clock3 size={12} className="text-amber-300" />,
    label: "На проверке",
  },
};

export function MissionNode({ data }: NodeProps<MissionNodeData>) {
  const { mission, testStatus, onEdit, onDelete, onDuplicate } = data;
  const { getMotivationText, theme } = useTheme();
  
  const colorClass = missionTypeColors[mission.missionType as keyof typeof missionTypeColors] || "bg-gray-600";
  const typeLabel = missionTypeLabels[mission.missionType as keyof typeof missionTypeLabels] || "Неизв.";
  const statusStyle = testStatus ? statusStyles[testStatus] : null;
  
  // Use theme primary color for accents
  const primaryColor = theme.palette?.primary || "#8B5CF6";

  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          backgroundColor: primaryColor,
          boxShadow: `0 0 0 4px rgba(45, 29, 123, 0.35)`
        }}
        className="h-2 w-2 translate-y-[-8px] rounded-full border-[3px] border-[#111127]"
      />

      <div
        className={clsx(
          "min-w-[220px] max-w-[260px] rounded-2xl border border-white/10 bg-white/10 p-4 shadow-[0_18px_40px_rgba(8,5,34,0.45)] backdrop-blur transition hover:border-white/30",
          statusStyle?.border
        )}
      >
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2 flex-wrap">
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
              {statusStyle && (
                <span className={clsx("flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] uppercase tracking-[0.12em]", statusStyle.chip)}>
                  {statusStyle.icon}
                  {statusStyle.label}
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
            {onDuplicate && (
              <button
                onClick={onDuplicate}
                className="rounded-lg p-1.5 text-green-300 transition hover:bg-green-500/20 hover:text-green-200"
                title="Дублировать"
              >
                <Copy size={12} />
              </button>
            )}
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
            <Star size={12} style={{ color: primaryColor }} />
            <span style={{ color: primaryColor }}>{mission.experienceReward} {getMotivationText('xp')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap size={12} style={{ color: theme.palette?.secondary || "#38BDF8" }} />
            <span style={{ color: theme.palette?.secondary || "#38BDF8" }}>{mission.manaReward} {getMotivationText('mana')}</span>
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
        style={{ 
          backgroundColor: primaryColor,
          boxShadow: `0 0 0 4px rgba(45, 29, 123, 0.35)`
        }}
        className="h-2 w-2 translate-y-[8px] rounded-full border-[3px] border-[#111127]"
      />
    </div>
  );
}
