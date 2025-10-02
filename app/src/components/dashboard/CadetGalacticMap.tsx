"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import type { LucideIcon } from "lucide-react";
import {
  Orbit,
  GaugeCircle,
  Sparkles,
  Shield,
  FileText,
  Users,
  Target,
  BookOpen,
  CheckCircle,
  Search,
  Rocket,
  Compass,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

type NodeStatus = "completed" | "active" | "available" | "locked" | "elite";

type MapNode = {
  id: string;
  title: string;
  tagline: string;
  status: NodeStatus;
  description: string;
  rewards: string;
  competencies: string[];
  requirements?: string[];
  objectives?: string[];
  x: number;
  y: number;
  icon: LucideIcon;
  progress: number;
  matchesFilter: boolean;
  isDimmed: boolean;
  isHidden: boolean;
};

type MapConnection = {
  from: string;
  to: string;
  state: "complete" | "active" | "future";
};

type ViewMode = "galaxy" | "timeline";
type StatusFilter = NodeStatus | "all";

// Types for real mission data
interface UserMission {
  id: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
  submission?: any;
  mission: {
    id: string;
    name: string;
    description?: string;
    missionType: string;
    experienceReward: number;
    manaReward: number;
    positionX: number;
    positionY: number;
    confirmationType: string;
    payload?: any;
    competencies: Array<{
      points: number;
      competency: {
        name: string;
      };
    }>;
    dependenciesFrom: Array<{ sourceMissionId: string; targetMissionId: string }>;
    dependenciesTo: Array<{ sourceMissionId: string; targetMissionId: string }>;
  };
}

interface CadetGalacticMapProps {
  userMissions?: UserMission[];
  onMissionSelect?: (mission: UserMission) => void;
}

// Static demo data removed - using real mission data from API

const STATUS_THEME: Record<
  NodeStatus,
  {
    glow: string;
    surface: string;
    border: string;
    label: string;
    indicator: string;
  }
> = {
  completed: {
    glow: "shadow-[0_0_45px_rgba(74,222,128,0.35)]",
    surface: "bg-emerald-500/10",
    border: "border-emerald-300/60",
    label: "text-emerald-100",
    indicator: "bg-emerald-400",
  },
  active: {
    glow: "shadow-[0_0_50px_rgba(99,102,241,0.45)]",
    surface: "bg-indigo-500/15",
    border: "border-indigo-300/70",
    label: "text-indigo-100",
    indicator: "bg-indigo-400",
  },
  available: {
    glow: "shadow-[0_0_40px_rgba(244,114,182,0.4)]",
    surface: "bg-fuchsia-500/15",
    border: "border-fuchsia-300/60",
    label: "text-fuchsia-100",
    indicator: "bg-fuchsia-400",
  },
  locked: {
    glow: "shadow-[0_0_28px_rgba(148,163,184,0.25)]",
    surface: "bg-slate-500/10",
    border: "border-slate-400/40",
    label: "text-slate-200",
    indicator: "bg-slate-300",
  },
  elite: {
    glow: "shadow-[0_0_45px_rgba(56,189,248,0.45)]",
    surface: "bg-cyan-500/15",
    border: "border-cyan-300/60",
    label: "text-cyan-100",
    indicator: "bg-cyan-300",
  },
};

const STATUS_PROGRESS: Record<NodeStatus, number> = {
  completed: 1,
  active: 0.66,
  available: 0.45,
  locked: 0.2,
  elite: 0.85,
};

const STATUS_ACCENT: Record<NodeStatus, string> = {
  completed: "#34d399",
  active: "#6366f1",
  available: "#f472b6",
  locked: "#94a3b8",
  elite: "#22d3ee",
};

const STARFIELD = [
  { left: "8%", top: "18%", size: 2, delay: 0 },
  { left: "22%", top: "62%", size: 3, delay: 1.4 },
  { left: "34%", top: "12%", size: 2, delay: 0.7 },
  { left: "48%", top: "78%", size: 2, delay: 2.1 },
  { left: "56%", top: "8%", size: 3, delay: 1.8 },
  { left: "72%", top: "48%", size: 2, delay: 0.5 },
  { left: "86%", top: "24%", size: 2, delay: 1.1 },
  { left: "88%", top: "70%", size: 3, delay: 2.4 },
  { left: "14%", top: "30%", size: 2, delay: 1.7 },
  { left: "64%", top: "64%", size: 2, delay: 0.3 },
  { left: "28%", top: "82%", size: 2, delay: 2.6 },
];

const VIEWBOX_WIDTH = 100;
const VIEWBOX_HEIGHT = 70;

function createConnectionPath(from: MapNode, to: MapNode) {
  // Create smooth curved path between nodes
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // Calculate control points for smooth S-curve
  const curvature = 0.3;
  const controlDist = dist * curvature;
  
  // Perpendicular offset for curve
  const perpX = -dy / dist;
  const perpY = dx / dist;
  
  const control1X = from.x + dx * 0.33 + perpX * controlDist;
  const control1Y = from.y + dy * 0.33 + perpY * controlDist;
  const control2X = from.x + dx * 0.67 + perpX * controlDist;
  const control2Y = from.y + dy * 0.67 + perpY * controlDist;
  
  return `M ${from.x} ${from.y} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${to.x} ${to.y}`;
}

// Helper function to get mission type icon
const getMissionTypeIcon = (missionType: string): LucideIcon => {
  switch (missionType) {
    case "FILE_UPLOAD": return FileText;
    case "OFFLINE_EVENT": return Users;
    case "QUIZ": return Target;
    default: return BookOpen;
  }
};

// Helper function to map mission status to node status
const mapMissionStatus = (status: string): NodeStatus => {
  switch (status) {
    case "COMPLETED": return "completed";
    case "AVAILABLE": return "available";
    case "IN_PROGRESS": return "active";
    case "PENDING_REVIEW": return "active";
    default: return "locked";
  }
};

// Helper function to get mission type tagline
const getMissionTagline = (missionType: string): string => {
  switch (missionType) {
    case "FILE_UPLOAD": return "Файл";
    case "OFFLINE_EVENT": return "Событие";
    case "QUIZ": return "Тест";
    case "CUSTOM": return "Задание";
    default: return "Миссия";
  }
};

function MissionStatusBadge({ status, compact = false }: { status: NodeStatus; compact?: boolean }) {
  const labels: Record<NodeStatus, string> = {
    completed: "Завершено",
    active: "В процессе",
    available: "Доступно",
    locked: "Заблокировано",
    elite: "Элитная",
  };

  return (
    <span
      className={clsx(
        "flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-indigo-200/70",
        compact && "px-2 py-0.5 text-[10px]"
      )}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_ACCENT[status] }} />
      <span>{labels[status]}</span>
    </span>
  );
}

function MetricPill({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-indigo-200/80">
      <Icon className="h-3.5 w-3.5 text-indigo-300" />
      <span className="uppercase tracking-[0.25em] text-indigo-200/60">{label}</span>
      <span className="text-indigo-100/80">{value}</span>
    </div>
  );
}

function MissionProgressBar({ value, status }: { value: number; status: NodeStatus }) {
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-indigo-950/60">
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: `${Math.min(100, Math.max(0, Math.round(value * 100)))}%`,
          background: `linear-gradient(90deg, ${STATUS_ACCENT[status]}AA, ${STATUS_ACCENT[status]}FF)`,
          boxShadow: `0 0 12px ${STATUS_ACCENT[status]}55`,
        }}
      />
    </div>
  );
}

function MapLegend() {
  const items = [
    { label: "Завершено", color: STATUS_ACCENT.completed },
    { label: "Текущая миссия", color: STATUS_ACCENT.active },
    { label: "Готово к запуску", color: STATUS_ACCENT.available },
    { label: "Заблокировано", color: STATUS_ACCENT.locked },
  ];

  return (
    <div className="mt-6 flex flex-wrap gap-3 text-xs">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-indigo-100/70">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="uppercase tracking-[0.3em]">{item.label}</span>
        </span>
      ))}
    </div>
  );
}

function MissionBriefingPanel({
  selectedNode,
  onMissionSelect,
  userMissions,
}: {
  selectedNode: MapNode | undefined;
  onMissionSelect?: (mission: UserMission) => void;
  userMissions: UserMission[];
}) {
  if (!selectedNode) {
    return (
      <aside className="relative flex flex-col items-center justify-center rounded-[32px] border border-white/10 bg-white/5 p-6 text-sm text-indigo-100/80 backdrop-blur">
        <p className="text-indigo-200/70">Миссии не найдены</p>
        <p className="mt-2 text-sm text-indigo-100/60">Подключитесь к активной кампании для просмотра миссий</p>
      </aside>
    );
  }

  const mission = userMissions.find((um) => um.mission.id === selectedNode.id);

  return (
    <aside className="relative flex flex-col gap-6 rounded-[32px] border border-white/10 bg-white/5 p-6 text-sm text-indigo-100/80 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-indigo-200/70">Брифинг миссии</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{selectedNode.title}</h3>
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/60">{selectedNode.tagline}</p>
        </div>
        <MissionStatusBadge status={selectedNode.status} />
      </div>

      <p className="text-sm leading-relaxed text-indigo-100/80">{selectedNode.description}</p>

      <div className="grid gap-4">
        <Callout title="Награды" value={selectedNode.rewards} />
        <Callout
          title="Компетенции"
          value={selectedNode.competencies.length > 0 ? selectedNode.competencies.join(" · ") : "Не указаны"}
        />
        {(selectedNode as any).requirements && (
          <Callout title="Требования">
            <ul className="space-y-2 text-sm leading-snug text-indigo-100/75">
              {(selectedNode as any).requirements.map((item: string) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </Callout>
        )}
      </div>

      {(selectedNode as any).objectives && (selectedNode as any).objectives.length > 0 && (
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-xs text-indigo-100/70">
          <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-indigo-200/60">Оперативный план</p>
          <ul className="space-y-2 text-sm leading-snug text-indigo-100/80">
            {(selectedNode as any).objectives.map((step: string) => (
              <li key={step} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-indigo-300" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mission && onMissionSelect && (
        <button
          type="button"
          onClick={() => onMissionSelect(mission)}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-indigo-400/60 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-100 transition hover:bg-indigo-500/20"
        >
          Начать миссию
        </button>
      )}
    </aside>
  );
}

function FocusableMap({
  mapNodes,
  mapConnections,
  nodeLookup,
  selectedNodeId,
  hoveredNodeId,
  setHoveredNodeId,
  setSelectedNodeId,
  onMissionSelect,
  userMissions,
  zoom,
  setZoom,
}: {
  mapNodes: MapNode[];
  mapConnections: MapConnection[];
  nodeLookup: Record<string, MapNode>;
  selectedNodeId?: string;
  hoveredNodeId: string | null;
  setHoveredNodeId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedNodeId: (id?: string) => void;
  onMissionSelect?: (mission: UserMission) => void;
  userMissions: UserMission[];
  zoom: number;
  setZoom: (value: number) => void;
}) {
  const handleWheel = useCallback<React.WheelEventHandler<HTMLDivElement>>((event) => {
    if (event.ctrlKey) {
      event.preventDefault();
      const nextZoom = Math.min(1.6, Math.max(0.7, zoom - event.deltaY * 0.001));
      setZoom(nextZoom);
    }
  }, [zoom, setZoom]);

  return (
    <div
      onWheel={handleWheel}
      className="relative h-full w-full overflow-auto"
      style={{ cursor: hoveredNodeId ? "pointer" : "default" }}
    >
      <div
        className="h-full w-full"
        style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
      >
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className="absolute inset-0 h-full w-full pointer-events-none"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="path-glow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(129,140,248,0.4)" />
              <stop offset="50%" stopColor="rgba(236,72,153,0.45)" />
              <stop offset="100%" stopColor="rgba(96,165,250,0.35)" />
            </linearGradient>
          </defs>

          {mapConnections.map((connection, index) => {
            const from = nodeLookup[connection.from];
            const to = nodeLookup[connection.to];
            if (!from || !to || from.isHidden || to.isHidden) return null;

            const connectionId = `${connection.from}-${connection.to}`;
            const isHovered = hoveredNodeId === from.id || hoveredNodeId === to.id;
            const isNextHop = selectedNodeId === to.id;
            const strokeColor =
              connection.state === "complete"
                ? "rgba(99,102,241,0.4)"
                : connection.state === "active"
                  ? "rgba(129,140,248,0.5)"
                  : "rgba(148,163,184,0.2)";

            return (
              <g key={connectionId}>
                <motion.path
                  d={createConnectionPath(from, to)}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={connection.state === "complete" ? 0.5 : 0.4}
                  strokeLinecap="round"
                  strokeDasharray={connection.state === "future" ? "2 3" : undefined}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ 
                    pathLength: 1, 
                    opacity: isNextHop ? 0.8 : isHovered ? 0.6 : 0.4 
                  }}
                  transition={{ duration: 1.2, delay: index * 0.15, ease: "easeInOut" }}
                  style={{ 
                    filter: isHovered ? "drop-shadow(0 0 4px rgba(129,140,248,0.3))" : undefined 
                  }}
                />

                <path
                  d={createConnectionPath(from, to)}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={3}
                  strokeLinecap="round"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredNodeId(to.id)}
                  onMouseLeave={() => {
                    setHoveredNodeId((prev) => prev === to.id ? null : prev);
                  }}
                />
              </g>
            );
          })}
        </svg>

        <div className="absolute inset-0">
          {mapNodes.map((node) => {
            if (node.isHidden) {
              return null;
            }

            const theme = STATUS_THEME[node.status];
            const Icon = node.icon;
            const isSelected = node.id === selectedNodeId;
            const userMission = userMissions.find(um => um.mission.id === node.id);
            const isHovering = hoveredNodeId === node.id;

            const nodeScale = isSelected ? 1.1 : isHovering ? 1.05 : 1;
            const nodeOpacity = node.isDimmed ? 0.4 : 1;

            return (
              <motion.button
                key={node.id}
                type="button"
                whileHover={{ scale: isSelected ? 1.08 : 1.05 }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => {
                  setHoveredNodeId((prev) => prev === node.id ? null : prev);
                }}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  if (userMission && onMissionSelect) {
                    onMissionSelect(userMission);
                  }
                }}
                className={clsx(
                  "group absolute flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-center transition duration-300 ease-out sm:h-24 sm:w-24 pointer-events-auto backdrop-blur-sm",
                  theme.surface,
                  theme.border,
                  node.isDimmed && "opacity-40"
                )}
                style={{
                  left: `${node.x}%`,
                  top: `${(node.y / VIEWBOX_HEIGHT) * 100}%`,
                  scale: nodeScale,
                  opacity: nodeOpacity,
                  borderWidth: isSelected ? '2px' : '1.5px',
                  boxShadow: isHovering 
                    ? `0 0 20px ${STATUS_ACCENT[node.status]}40, 0 4px 12px rgba(0,0,0,0.3)` 
                    : isSelected
                      ? `0 0 16px ${STATUS_ACCENT[node.status]}30, 0 4px 8px rgba(0,0,0,0.2)`
                      : '0 2px 8px rgba(0,0,0,0.2)',
                }}
                aria-pressed={isSelected}
                aria-label={`Миссия: ${node.title}. Статус: ${node.status}. Награда: ${node.rewards}`}
              >
                <div className="relative flex flex-col items-center justify-center gap-1">
                  <Icon className="h-6 w-6 text-white/90 sm:h-7 sm:w-7" strokeWidth={1.8} />
                  {node.progress === 1 && node.status === "completed" && (
                    <div className="absolute -right-1 -top-1">
                      <CheckCircle className="h-4 w-4 text-emerald-400" fill="currentColor" />
                    </div>
                  )}
                </div>
                
                {/* Progress ring around node */}
                <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="48"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="48"
                    fill="none"
                    stroke={STATUS_ACCENT[node.status]}
                    strokeWidth="2"
                    strokeDasharray={`${node.progress * 301.59} 301.59`}
                    strokeLinecap="round"
                    opacity={0.6}
                  />
                </svg>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MissionProgressRing({ value, status, accent }: { value: number; status: NodeStatus; accent: string }) {
  const circumference = 2 * Math.PI * 18;
  const progressLength = Math.min(100, Math.max(0, value * 100)) * circumference / 100;
  const backgroundLength = circumference;

  return (
    <div className="relative">
      <svg className="h-12 w-12" viewBox="0 0 48 48">
        <circle
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke="rgba(148,163,184,0.25)"
          strokeWidth="2"
        />
        <circle
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke={accent}
          strokeWidth="2.5"
          strokeDasharray={`${progressLength} ${backgroundLength}`}
          strokeLinecap="round"
          transform="rotate(-90 24 24)"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white/80">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}
function MapToolbar({
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  showOnlyAvailable,
  setShowOnlyAvailable,
  viewMode,
  setViewMode,
  onFocusActive
}: {
  statusFilter: StatusFilter;
  setStatusFilter: (value: StatusFilter) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  showOnlyAvailable: boolean;
  setShowOnlyAvailable: (value: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onFocusActive: () => void;
}) {
  const toolbarButtons = [
    { label: "Все", value: "all" as StatusFilter },
    { label: "Активные", value: "active" as StatusFilter },
    { label: "Доступные", value: "available" as StatusFilter },
    { label: "Завершённые", value: "completed" as StatusFilter },
  ];

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-[24px] border border-white/10 bg-[#090b1a]/80 p-4 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-indigo-300" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/60">Навигация</p>
            <p className="text-sm text-indigo-100/80">Настройки видимости миссий</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={clsx(
              "rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] transition",
              viewMode === "galaxy" ? "bg-indigo-500/20 text-indigo-100" : "text-indigo-200/60 hover:bg-white/5"
            )}
            onClick={() => setViewMode("galaxy")}
          >
            Галактика
          </button>
          <button
            type="button"
            className={clsx(
              "rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] transition",
              viewMode === "timeline" ? "bg-indigo-500/20 text-indigo-100" : "text-indigo-200/60 hover:bg-white/5"
            )}
            onClick={() => setViewMode("timeline")}
          >
            Линия
          </button>
          <button
            type="button"
            onClick={onFocusActive}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-indigo-100 transition hover:bg-white/10"
          >
            <Compass className="h-4 w-4" />
            Центрировать
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-300/70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск миссий..."
            className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-indigo-100 placeholder:text-indigo-300/50 focus:border-indigo-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {toolbarButtons.map((button) => (
            <button
              key={button.value}
              type="button"
              onClick={() => setStatusFilter(button.value)}
              className={clsx(
                "rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] transition",
                statusFilter === button.value ? "bg-white/15 text-white" : "text-indigo-200/70 hover:bg-white/5"
              )}
            >
              {button.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-indigo-200/70">
          <input
            type="checkbox"
            checked={showOnlyAvailable}
            onChange={(e) => setShowOnlyAvailable(e.target.checked)}
            className="h-3 w-3 rounded border border-indigo-400/80 bg-transparent text-indigo-400 focus:ring-indigo-400"
          />
          Только доступные или активные
        </label>
      </div>
    </div>
  );
}

function Callout({
  title,
  value,
  children,
}: {
  title: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <p className="text-[10px] uppercase tracking-[0.3em] text-indigo-200/60">
        {title}
      </p>
      {value && <p className="mt-2 text-sm text-indigo-100/90">{value}</p>}
      {children}
    </div>
  );
}

export function CadetGalacticMap({ userMissions = [], onMissionSelect }: CadetGalacticMapProps) {
  const { theme, getMotivationText, getCompetencyName } = useTheme();
  const primaryColor = theme.palette?.primary || "#8B5CF6";
  const secondaryColor = theme.palette?.secondary || "#38BDF8";
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);
  const [hasAutoZoomed, setHasAutoZoomed] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("galaxy");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [zoom, setZoom] = useState(1);
  
  // Determine layout style based on theme and gamification level
  const isCorporateTheme = theme.themeId === "corporate-metropolis";
  const isESGTheme = theme.themeId === "esg-mission";
  const isLowGamification = theme.gamificationLevel === "low";
  const useSimpleLayout = isCorporateTheme || isESGTheme || isLowGamification;
  
  // Helper function to create spiral/organic layout
  const createOrganicLayout = (count: number) => {
    const positions: Array<{ x: number; y: number }> = [];
    const centerX = VIEWBOX_WIDTH / 2;
    const centerY = VIEWBOX_HEIGHT / 2;
    const minDistance = 18; // Minimum distance between nodes
    
    // Create positions based on fibonacci spiral
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5 degrees in radians
    
    for (let i = 0; i < count; i++) {
      const angle = i * goldenAngle;
      const radius = Math.sqrt(i + 1) * 8; // Spiral radius
      
      // Calculate position with some wave variation
      let x = centerX + radius * Math.cos(angle);
      let y = centerY + radius * Math.sin(angle) * 0.8; // Slightly flattened
      
      // Add slight randomness for more organic feel (deterministic based on index)
      const seed = i * 0.5432; // Pseudo-random but consistent
      x += Math.sin(seed * 7) * 3;
      y += Math.cos(seed * 5) * 3;
      
      // Ensure minimum distance from other nodes
      let attempts = 0;
      while (attempts < 20) {
        let tooClose = false;
        for (const pos of positions) {
          const dist = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
          if (dist < minDistance) {
            tooClose = true;
            break;
          }
        }
        
        if (!tooClose) break;
        
        // Adjust position if too close
        const adjustAngle = (attempts * Math.PI) / 6;
        x += Math.cos(adjustAngle) * 4;
        y += Math.sin(adjustAngle) * 4;
        attempts++;
      }
      
      // Clamp to viewbox bounds
      x = Math.max(12, Math.min(VIEWBOX_WIDTH - 12, x));
      y = Math.max(12, Math.min(VIEWBOX_HEIGHT - 12, y));
      
      positions.push({ x, y });
    }
    
    return positions;
  };

  // Convert real missions to map nodes
  const baseNodes = useMemo(() => {
    if (userMissions.length === 0) {
      console.warn("[CadetGalacticMap] No missions provided - empty map");
      return []; // Don't fallback to static mock data
    }

    const organicPositions = createOrganicLayout(userMissions.length);

    const rawNodes = userMissions.map((userMission, index) => {
      const { mission, status } = userMission;
      const nodeStatus = mapMissionStatus(status);
      const icon = getMissionTypeIcon(mission.missionType);
      const tagline = getMissionTagline(mission.missionType);

      const hasPositionX = typeof mission.positionX === "number" && !Number.isNaN(mission.positionX);
      const hasPositionY = typeof mission.positionY === "number" && !Number.isNaN(mission.positionY);

      const usesCustomPosition = hasPositionX && hasPositionY && !(mission.positionX === 0 && mission.positionY === 0);

      const fallbackPos = organicPositions[index] || { x: 50, y: 35 };

      const rawX = usesCustomPosition ? mission.positionX : fallbackPos.x;
      const rawY = usesCustomPosition ? mission.positionY : fallbackPos.y;

      return {
        id: mission.id,
        title: mission.name,
        tagline,
        status: nodeStatus,
        description: mission.description || "Выполните эту миссию для получения опыта и наград",
        rewards: `${mission.experienceReward} ${getMotivationText('xp')} · ${mission.manaReward} ${getMotivationText('mana')}`,
        competencies: mission.competencies?.map(comp => 
          `${getCompetencyName(comp.competency.name)} +${comp.points}`
        ) || [],
        icon,
        rawX,
        rawY,
        fallbackX: fallbackPos.x,
        fallbackY: fallbackPos.y,
        progress: STATUS_PROGRESS[nodeStatus] ?? 0.4,
        matchesFilter: true,
        isDimmed: false,
        isHidden: false,
      };
    });

    const xs = rawNodes.map((node) => node.rawX);
    const ys = rawNodes.map((node) => node.rawY);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const rangeX = maxX - minX;
    const rangeY = maxY - minY;

    const shouldNormalize = rangeX > VIEWBOX_WIDTH * 0.8 || rangeY > VIEWBOX_HEIGHT * 0.8;

    const viewWidth = VIEWBOX_WIDTH;
    const viewHeight = VIEWBOX_HEIGHT;
    const horizontalMargin = viewWidth * 0.15;
    const verticalMargin = viewHeight * 0.15;

    return rawNodes.map((node) => {
      let normalizedX = node.rawX;
      let normalizedY = node.rawY;

      if (shouldNormalize) {
        const safeRangeX = rangeX === 0 ? 1 : rangeX;
        const safeRangeY = rangeY === 0 ? 1 : rangeY;

        normalizedX = horizontalMargin + ((node.rawX - minX) / safeRangeX) * (viewWidth - horizontalMargin * 2);
        normalizedY = verticalMargin + ((node.rawY - minY) / safeRangeY) * (viewHeight - verticalMargin * 2);
      }

      const clampedX = Math.min(Math.max(normalizedX, 10), viewWidth - 10);
      const clampedY = Math.min(Math.max(normalizedY, 10), viewHeight - 10);

      return {
        id: node.id,
        title: node.title,
        tagline: node.tagline,
        status: node.status,
        description: node.description,
        rewards: node.rewards,
        competencies: node.competencies,
        icon: node.icon,
        x: clampedX,
        y: clampedY,
        progress: node.progress,
        matchesFilter: true,
        isDimmed: false,
        isHidden: false,
      };
    });
  }, [userMissions, getMotivationText, getCompetencyName]);

  // Convert dependencies to connections
  const mapConnections = useMemo(() => {
    if (userMissions.length === 0) {
      return []; // No fallback to mock data
    }

    const connections: Record<string, MapConnection> = {};
    userMissions.forEach((userMission) => {
      userMission.mission.dependenciesFrom.forEach((dep) => {
        const fromMission = userMissions.find(um => um.mission.id === dep.sourceMissionId);
        const toMission = userMissions.find(um => um.mission.id === dep.targetMissionId);
        
        if (fromMission && toMission) {
          let connectionState: "complete" | "active" | "future" = "future";
          if (fromMission.status === "COMPLETED") {
            connectionState = toMission.status === "COMPLETED" ? "complete" : "active";
          }
          
          const key = `${dep.sourceMissionId}-${dep.targetMissionId}`;
          const existing = connections[key];

          if (!existing || existing.state === "future") {
            connections[key] = {
              from: dep.sourceMissionId,
              to: dep.targetMissionId,
              state: connectionState,
            };
          } else if (existing.state === "active" && connectionState === "complete") {
            connections[key] = {
              from: dep.sourceMissionId,
              to: dep.targetMissionId,
              state: "complete",
            };
          }
        }
      });
    });
    
    return Object.values(connections);
  }, [userMissions]);

  const mapNodes = useMemo(() => {
    const normalizedNodes = baseNodes.map((node) => {
      const matchesSearch = searchQuery.length === 0
        || node.title.toLowerCase().includes(searchQuery.toLowerCase())
        || node.tagline.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || node.status === statusFilter;
      const matchesAvailability = !showOnlyAvailable || node.status === "available" || node.status === "active";

      const matchesFilter = matchesSearch && matchesStatus && matchesAvailability;

      return {
        ...node,
        matchesFilter,
        isDimmed: !matchesFilter,
        isHidden: !matchesFilter && (statusFilter !== "all" || showOnlyAvailable || searchQuery.length > 0),
      };
    });

    const anyVisible = normalizedNodes.some((node) => !node.isHidden);
    if (!anyVisible && normalizedNodes.length > 0) {
      return normalizedNodes.map((node) => ({
        ...node,
        isHidden: false,
        isDimmed: searchQuery.length > 0 ? !node.matchesFilter : false,
      }));
    }

    return normalizedNodes;
  }, [baseNodes, searchQuery, statusFilter, showOnlyAvailable]);

  const defaultNode = useMemo(
    () => mapNodes.find((node) => node.status === "active") ?? mapNodes[0],
    [mapNodes]
  );
  const [selectedNodeId, setSelectedNodeId] = useState(defaultNode?.id);
  const selectedNode = mapNodes.find((node) => node.id === selectedNodeId) ?? defaultNode;
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Breadcrumbs for mobile navigation
  const breadcrumbs = useMemo(() => {
    if (mapNodes.length === 0) return [];
    const path: MapNode[] = [];
    let current = selectedNode;
    
    // Build path backwards from selected node
    const visited = new Set<string>();
    while (current && !visited.has(current.id)) {
      path.unshift(current);
      visited.add(current.id);
      
      // Find parent (mission that leads to this one)
      const parentConnection = mapConnections.find(c => c.to === current.id);
      current = parentConnection ? mapNodes.find(n => n.id === parentConnection.from) : undefined;
    }
    
    return path;
  }, [selectedNode, mapNodes, mapConnections]);

  // Update selected node when nodes change
  useEffect(() => {
    if (!selectedNodeId && mapNodes.length > 0) {
      setSelectedNodeId(defaultNode?.id || mapNodes[0]?.id);
    }
  }, [mapNodes, defaultNode, selectedNodeId]);
  
  // Auto-zoom to active mission on first load
  useEffect(() => {
    if (!hasAutoZoomed && defaultNode && mapContainerRef.current) {
      setHasAutoZoomed(true);
      
      // Calculate scroll position to center the active node
      const container = mapContainerRef.current;
      const nodeX = (defaultNode.x / VIEWBOX_WIDTH) * container.scrollWidth;
      const nodeY = (defaultNode.y / VIEWBOX_HEIGHT) * container.scrollHeight;
      
      // Smooth scroll animation
      container.scrollTo({
        left: nodeX - container.clientWidth / 2,
        top: nodeY - container.clientHeight / 2,
        behavior: 'smooth'
      });
    }
  }, [hasAutoZoomed, defaultNode]);

  const nodeLookup = useMemo(() => {
    return mapNodes.reduce<Record<string, MapNode>>((acc, node) => {
      acc[node.id] = node;
      return acc;
    }, {});
  }, [mapNodes]);

  // Simple roadmap view for corporate/ESG/low gamification themes
  if (useSimpleLayout || viewMode === "timeline") {
    const corporateStyle = (isCorporateTheme || isLowGamification || isESGTheme) || viewMode === "timeline";
    
    return (
      <div className="space-y-4" aria-label="Путь миссий">
        {mapNodes.map((node, index) => {
          if (node.isHidden) {
            return null;
          }
          const themeColors = STATUS_THEME[node.status];
          const Icon = node.icon;
          const userMission = userMissions.find(um => um.mission.id === node.id);
          const isFirst = index === 0;
          const isLast = index === mapNodes.length - 1;

          const dimClass = node.isDimmed ? "opacity-40" : "";

          return (
            <div key={node.id} className={clsx("flex gap-4 transition", dimClass)}>
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                {!isFirst && (
                  <div 
                    className="w-0.5 h-6 -mb-6" 
                    style={{ backgroundColor: mapNodes[index - 1].status === "completed" ? primaryColor : "rgba(148,163,184,0.3)" }}
                  />
                )}
                <button
                  onClick={() => {
                    setSelectedNodeId(node.id);
                    if (userMission && onMissionSelect) {
                      onMissionSelect(userMission);
                    }
                  }}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId((prev) => prev === node.id ? null : prev)}
                  className={clsx(
                    corporateStyle ? "rounded-lg" : "rounded-full",
                    "p-3 border-2 transition-all z-10",
                    themeColors.surface,
                    themeColors.border,
                    node.id === selectedNodeId
                      ? "scale-110"
                      : !node.isDimmed
                        ? "hover:scale-105"
                        : ""
                  )}
                  style={{
                    boxShadow: corporateStyle && node.id === selectedNodeId
                      ? `0 4px 12px ${primaryColor}40`
                      : node.id === selectedNodeId
                        ? `0 0 20px ${primaryColor}80`
                        : hoveredNodeId === node.id
                          ? `0 0 12px ${primaryColor}40`
                          : undefined,
                    opacity: node.isDimmed ? 0.35 : 1
                  }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </button>
                {!isLast && (
                  <div 
                    className="w-0.5 flex-1 min-h-6" 
                    style={{ backgroundColor: node.status === "completed" ? primaryColor : "rgba(148,163,184,0.3)" }}
                  />
                )}
              </div>

              {/* Mission card */}
              <div 
                className={clsx(
                  "flex-1 border p-4 transition-all cursor-pointer",
                  corporateStyle ? "rounded-lg" : "rounded-xl",
                  themeColors.surface,
                  themeColors.border,
                  node.id === selectedNodeId
                    ? "ring-2"
                    : !node.isDimmed
                      ? "hover:border-white/20"
                      : ""
                )}
                style={{
                  ...(node.id === selectedNodeId ? { '--tw-ring-color': primaryColor } as React.CSSProperties : {}),
                  ...(corporateStyle ? { backgroundColor: 'rgba(8, 16, 32, 0.6)' } : {}),
                  opacity: node.isDimmed ? 0.4 : 1,
                  filter: node.isDimmed ? "grayscale(0.4)" : "none"
                }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId((prev) => prev === node.id ? null : prev)}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  if (userMission && onMissionSelect) {
                    onMissionSelect(userMission);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        "text-xs px-2 py-0.5 uppercase tracking-wider bg-white/10",
                        corporateStyle ? "rounded font-medium" : "rounded",
                        themeColors.label
                      )}>
                        {node.tagline}
                      </span>
                      {node.status === "completed" && (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={clsx(
                        "text-white",
                        corporateStyle ? "font-semibold text-base" : "font-medium"
                      )}>
                        {node.title}
                      </h3>
                      <MissionStatusBadge status={node.status} />
                    </div>
                    <p className="text-sm text-indigo-100/60 mb-2 line-clamp-2">{node.description}</p>
                    <div className="grid gap-2 text-xs text-indigo-200/70 md:grid-cols-2">
                      <MetricPill label="Награды" value={node.rewards} icon={Rocket} />
                      {node.competencies.length > 0 && (
                        <MetricPill label="Компетенции" value={node.competencies.join(", ")} icon={Target} />
                      )}
                    </div>

                    <MissionProgressBar value={node.progress} status={node.status} />
                  </div>

                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-indigo-100 transition hover:bg-white/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(node.id);
                      if (userMission && onMissionSelect) {
                        onMissionSelect(userMission);
                      }
                    }}
                  >
                    Подробнее
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" aria-label="Галактическая карта миссий">
      <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[#060818] p-6 sm:p-8">
        <MapToolbar
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showOnlyAvailable={showOnlyAvailable}
          setShowOnlyAvailable={setShowOnlyAvailable}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onFocusActive={() => {
            const activeNode = mapNodes.find((node) => node.status === "active");
            if (activeNode && mapContainerRef.current) {
              mapContainerRef.current.scrollTo({
                left: ((activeNode.x / VIEWBOX_WIDTH) * mapContainerRef.current.scrollWidth) - mapContainerRef.current.clientWidth / 2,
                top: (((activeNode.y / VIEWBOX_HEIGHT) * mapContainerRef.current.scrollHeight) - mapContainerRef.current.clientHeight / 2),
                behavior: "smooth"
              });
              setSelectedNodeId(activeNode.id);
            }
          }}
        />
        {viewMode === "galaxy" && (
          <div className="mb-4 flex items-center justify-between text-xs text-indigo-200/60">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              <span>Масштаб: {Math.round(zoom * 100)}%</span>
            </div>
            {hoveredNodeId && (
              <div className="flex items-center gap-2">
                <span className="text-indigo-100">{mapNodes.find((node) => node.id === hoveredNodeId)?.title}</span>
                <MissionStatusBadge status={mapNodes.find((node) => node.id === hoveredNodeId)?.status || "available"} compact />
              </div>
            )}
          </div>
        )}
        {/* Background image from theme */}
        {theme.assets?.background && (
          <div
            className="pointer-events-none absolute inset-0 opacity-30 bg-cover bg-center rounded-[36px]"
            style={{
              backgroundImage: `url(${theme.assets.background})`,
            }}
          />
        )}

        <div
          className="pointer-events-none absolute inset-0 rounded-[36px]"
          style={{
            background: `radial-gradient(circle at top, ${primaryColor}59, transparent 60%), radial-gradient(circle at bottom right, ${secondaryColor}33, transparent 55%)`
          }}
        />

        <div
          ref={mapContainerRef}
          className="relative h-[360px] w-full sm:h-[420px]"
          role="region"
          aria-label="Карта миссий галактической академии"
        >
          <FocusableMap
            mapNodes={mapNodes}
            mapConnections={mapConnections}
            nodeLookup={nodeLookup}
            selectedNodeId={selectedNodeId}
            hoveredNodeId={hoveredNodeId}
            setHoveredNodeId={setHoveredNodeId}
            setSelectedNodeId={setSelectedNodeId}
            onMissionSelect={onMissionSelect}
            userMissions={userMissions}
            zoom={zoom}
            setZoom={setZoom}
          />
        </div>

        <MapLegend />
      </div>

      <MissionBriefingPanel selectedNode={selectedNode} onMissionSelect={onMissionSelect} userMissions={userMissions} />
    </div>
  );
}


