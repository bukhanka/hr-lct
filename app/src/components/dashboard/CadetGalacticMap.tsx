"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { motion, useAnimation } from "framer-motion";
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
};

type MapConnection = {
  from: string;
  to: string;
  state: "complete" | "active" | "future";
};

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

const MAP_NODES: MapNode[] = [
  {
    id: "academy-orbit",
    title: "Академия орбит",
    tagline: "База",
    status: "completed",
    description: "Вводный цикл, где кадет подтверждает базовые компетенции и знакомится со стандартами флотилии.",
    rewards: "80 XP · 30 маны",
    competencies: ["Аналитика +1", "Дисциплина +1"],
    objectives: [
      "Пройти адаптационный модуль",
      "Сдать тест навигации",
      "Получить бейдж участия в офлайн-брифинге",
    ],
    x: 18,
    y: 48,
    icon: Orbit,
  },
  {
    id: "hypersimulator",
    title: "Гиперсимулятор",
    tagline: "Соло",
    status: "active",
    description: "Серия практических симуляций. Проверяет реакцию, стрессоустойчивость и скорость принятия решений.",
    rewards: "120 XP · 50 маны",
    competencies: ["Стрессоустойчивость +2", "Тактика +1"],
    objectives: [
      "Пройти три сессии симулятора",
      "Загрузить отчёт о прохождении",
      "Получить рекомендацию ИИ-инструктора",
    ],
    requirements: ["Открывается после Академии", "Минимальный ранг · 2"],
    x: 40,
    y: 32,
    icon: GaugeCircle,
  },
  {
    id: "expedition",
    title: "Экспедиция туманностей",
    tagline: "Команда",
    status: "available",
    description: "Совместная миссия с экипажем. Кадет демонстрирует лидерство и способность работать в команде.",
    rewards: "160 XP · 70 маны",
    competencies: ["Лидерство +3", "Командная работа +2"],
    objectives: [
      "Собрать команду из трёх участников",
      "Выполнить разведку сектора в AR-сценарии",
      "Защитить решение на итоговом брифинге",
    ],
    requirements: ["Доступно для ранга 3", "Необходим бейдж симулятора"],
    x: 67,
    y: 30,
    icon: Sparkles,
  },
  {
    id: "flagship-bridge",
    title: "Флагманский мостик",
    tagline: "Элит",
    status: "locked",
    description: "Финальный брифинг с капитаном флота. Решается, готов ли кадет занять место в команде флагмана.",
    rewards: "240 XP · 120 маны · Эмблема флотилии",
    competencies: ["Лидерство +3", "Стратегия +2", "Дипломатия +1"],
    objectives: [
      "Пройти интервью с капитаном",
      "Презентовать итоговый проект",
      "Подписать контракт флагмана",
    ],
    requirements: ["Будет доступно после ранга 4", "Требуется знак доверия капитана"],
    x: 58,
    y: 56,
    icon: Shield,
  },
];

const MAP_CONNECTIONS: MapConnection[] = [
  { from: "academy-orbit", to: "hypersimulator", state: "complete" },
  { from: "hypersimulator", to: "expedition", state: "active" },
  { from: "expedition", to: "flagship-bridge", state: "future" },
];

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
  const controlX = (from.x + to.x) / 2;
  const peakYOffset = Math.min(from.y, to.y) - Math.min(Math.abs(from.x - to.x) * 0.15 + 8, 18);
  const controlY = Math.max(peakYOffset, 6);
  return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
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

export function CadetGalacticMap({ userMissions = [], onMissionSelect }: CadetGalacticMapProps) {
  const { theme, getMotivationText, getCompetencyName } = useTheme();
  const primaryColor = theme.palette?.primary || "#8B5CF6";
  const secondaryColor = theme.palette?.secondary || "#38BDF8";
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);
  const [hasAutoZoomed, setHasAutoZoomed] = useState(false);
  
  // Determine layout style based on theme and gamification level
  const isCorporateTheme = theme.themeId === "corporate-metropolis";
  const isESGTheme = theme.themeId === "esg-mission";
  const isLowGamification = theme.gamificationLevel === "low";
  const useSimpleLayout = isCorporateTheme || isESGTheme || isLowGamification;
  
  // Convert real missions to map nodes
  const mapNodes = useMemo(() => {
    if (userMissions.length === 0) {
      console.warn("[CadetGalacticMap] No missions provided - empty map");
      return []; // Don't fallback to static mock data
    }

    return userMissions.map((userMission, index) => {
      const { mission, status } = userMission;
      const nodeStatus = mapMissionStatus(status);
      const icon = getMissionTypeIcon(mission.missionType);
      const tagline = getMissionTagline(mission.missionType);

      // Use mission positions from database or auto-layout
      const x = mission.positionX || (20 + (index % 4) * 20);
      const y = mission.positionY || (25 + Math.floor(index / 4) * 20);

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
        x,
        y,
        icon,
      };
    });
  }, [userMissions, getMotivationText]);

  // Convert dependencies to connections
  const mapConnections = useMemo(() => {
    if (userMissions.length === 0) {
      return []; // No fallback to mock data
    }

    const connections: MapConnection[] = [];
    userMissions.forEach((userMission) => {
      userMission.mission.dependenciesFrom.forEach((dep) => {
        const fromMission = userMissions.find(um => um.mission.id === dep.sourceMissionId);
        const toMission = userMissions.find(um => um.mission.id === dep.targetMissionId);
        
        if (fromMission && toMission) {
          let connectionState: "complete" | "active" | "future" = "future";
          if (fromMission.status === "COMPLETED") {
            connectionState = toMission.status === "COMPLETED" ? "complete" : "active";
          }
          
          connections.push({
            from: dep.sourceMissionId,
            to: dep.targetMissionId,
            state: connectionState
          });
        }
      });
    });
    
    return connections;
  }, [userMissions]);

  const defaultNode = useMemo(
    () => mapNodes.find((node) => node.status === "active") ?? mapNodes[0],
    [mapNodes]
  );
  const [selectedNodeId, setSelectedNodeId] = useState(defaultNode?.id);
  const selectedNode = mapNodes.find((node) => node.id === selectedNodeId) ?? defaultNode;
  
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
  if (useSimpleLayout) {
    // Corporate style: more structured, less playful
    const corporateStyle = isCorporateTheme || isLowGamification;
    
    return (
      <div className="space-y-4">
        {mapNodes.map((node, index) => {
          const themeColors = STATUS_THEME[node.status];
          const Icon = node.icon;
          const userMission = userMissions.find(um => um.mission.id === node.id);
          const isFirst = index === 0;
          const isLast = index === mapNodes.length - 1;
          
          return (
            <div key={node.id} className="flex gap-4">
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
                  className={clsx(
                    corporateStyle ? "rounded-lg" : "rounded-full",
                    "p-3 border-2 transition-all z-10",
                    themeColors.surface,
                    themeColors.border,
                    node.id === selectedNodeId ? "scale-110" : "hover:scale-105"
                  )}
                  style={{
                    boxShadow: corporateStyle && node.id === selectedNodeId 
                      ? `0 4px 12px ${primaryColor}40` 
                      : node.id === selectedNodeId 
                        ? `0 0 20px ${primaryColor}80` 
                        : undefined
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
                  node.id === selectedNodeId ? "ring-2" : "hover:border-white/20"
                )}
                style={{
                  ...(node.id === selectedNodeId ? { '--tw-ring-color': primaryColor } as React.CSSProperties : {}),
                  ...(corporateStyle ? { backgroundColor: 'rgba(8, 16, 32, 0.6)' } : {})
                }}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  if (userMission && onMissionSelect) {
                    onMissionSelect(userMission);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
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
                    <h3 className={clsx(
                      "text-white mb-1",
                      corporateStyle ? "font-semibold text-base" : "font-medium"
                    )}>
                      {node.title}
                    </h3>
                    <p className="text-sm text-indigo-100/60 mb-2">{node.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="text-indigo-200/80">
                        {corporateStyle ? "📈" : "📊"} {node.rewards}
                      </span>
                      {node.competencies.length > 0 && (
                        <span className="text-indigo-200/70">
                          {corporateStyle ? "📊" : "🎯"} {node.competencies.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Galactic map view (original)
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[#060818] p-6 sm:p-8">
        {/* Background image from theme */}
        {theme.assets?.background && (
          <div 
            className="pointer-events-none absolute inset-0 opacity-30 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${theme.assets.background})`,
            }}
          />
        )}
        
        <div 
          className="pointer-events-none absolute inset-0"
          style={{ 
            background: `radial-gradient(circle at top, ${primaryColor}59, transparent 60%), radial-gradient(circle at bottom right, ${secondaryColor}33, transparent 55%)`
          }}
        />

        <div 
          ref={mapContainerRef}
          className="relative h-[360px] w-full sm:h-[420px] overflow-auto"
          role="region"
          aria-label="Карта миссий галактической академии"
        >
          <svg
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            className="absolute inset-0 h-full w-full"
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
              if (!from || !to) return null;

              const connectionId = `${connection.from}-${connection.to}`;
              const isHovered = hoveredConnection === connectionId;
              const isNextHop = selectedNodeId === to.id;
              const strokeColor =
                connection.state === "complete"
                  ? "url(#path-glow)"
                  : connection.state === "active"
                    ? "rgba(129,140,248,0.85)"
                    : "rgba(148,163,184,0.4)";

              return (
                <g key={connectionId}>
                  <motion.path
                    d={createConnectionPath(from, to)}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={connection.state === "complete" ? 0.85 : 0.65}
                    strokeLinecap="round"
                    strokeDasharray={connection.state === "future" ? "1.4 2.4" : undefined}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: isNextHop ? 1 : 0.9 }}
                    transition={{ duration: 1.2, delay: index * 0.2, ease: "easeInOut" }}
                  />
                  
                  {/* Invisible wider path for hover detection */}
                  <motion.path
                    d={createConnectionPath(from, to)}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={3}
                    strokeLinecap="round"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredConnection(connectionId)}
                    onMouseLeave={() => setHoveredConnection(null)}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, delay: index * 0.2, ease: "easeInOut" }}
                  />
                  
                  {/* Animated particles on hover */}
                  {isHovered && connection.state !== "future" && (
                    <>
                      {[0, 1, 2].map((particleIndex) => (
                        <motion.circle
                          key={particleIndex}
                          r="0.4"
                          fill="rgba(129,140,248,0.9)"
                          initial={{ opacity: 0 }}
                          animate={{
                            offsetDistance: ['0%', '100%'],
                            opacity: [0, 1, 1, 0]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: particleIndex * 0.6,
                            ease: "linear"
                          }}
                          style={{
                            offsetPath: `path('${createConnectionPath(from, to)}')`,
                            offsetRotate: '0deg'
                          }}
                        />
                      ))}
                    </>
                  )}
                </g>
              );
            })}
          </svg>

          <div className="absolute inset-0">
            {mapNodes.map((node) => {
              const theme = STATUS_THEME[node.status];
              const Icon = node.icon;
              const isSelected = node.id === selectedNodeId;
              const userMission = userMissions.find(um => um.mission.id === node.id);

              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => {
                    setSelectedNodeId(node.id);
                    if (userMission && onMissionSelect) {
                      onMissionSelect(userMission);
                    }
                  }}
                  className={clsx(
                    "group absolute flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-2 rounded-full border text-center transition-transform duration-300 ease-out sm:h-28 sm:w-28",
                    theme.surface,
                    theme.border,
                    theme.glow,
                    isSelected ? "scale-105" : "hover:scale-105"
                  )}
                  style={{
                    left: `${node.x}%`,
                    top: `${(node.y / VIEWBOX_HEIGHT) * 100}%`,
                  }}
                  aria-pressed={isSelected}
                  aria-label={`Миссия: ${node.title}. Статус: ${node.status}. Награда: ${node.rewards}`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedNodeId(node.id);
                      const userMission = userMissions.find(um => um.mission.id === node.id);
                      if (userMission && onMissionSelect) {
                        onMissionSelect(userMission);
                      }
                    }
                  }}
                >
                  <span
                    className={clsx(
                      "rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.3em]",
                      theme.label,
                      "bg-white/10 backdrop-blur"
                    )}
                  >
                    {node.tagline}
                  </span>
                  <span className={clsx("rounded-full p-2 text-white", isSelected ? "bg-white/10" : "bg-black/20")}
                  >
                    <Icon className="h-5 w-5 text-white/90" strokeWidth={1.5} />
                  </span>
                  <span className="px-3 text-xs font-medium text-white/90 max-w-20 truncate">
                    {node.title}
                  </span>
                  <span className={clsx("h-1 w-8 rounded-full", theme.indicator)} />
                </button>
              );
            })}
          </div>

          {STARFIELD.map((star) => (
            <span
              key={`${star.left}-${star.top}`}
              className="pointer-events-none absolute rounded-full bg-white/70 opacity-70 animate-pulse"
              style={
                {
                  left: star.left,
                  top: star.top,
                  width: star.size,
                  height: star.size,
                  animationDelay: `${star.delay}s`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        {/* Breadcrumbs navigation for mobile */}
        <div className="mt-4 lg:hidden">
          <div className="flex items-center gap-2 text-xs text-indigo-200/70 overflow-x-auto custom-scroll pb-2">
            {breadcrumbs.map((node, index) => (
              <div key={node.id} className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setSelectedNodeId(node.id)}
                  className={clsx(
                    "px-3 py-1 rounded-lg transition-colors",
                    node.id === selectedNodeId
                      ? "bg-indigo-500/20 text-indigo-100"
                      : "hover:bg-white/5 text-indigo-200/70"
                  )}
                >
                  {node.title}
                </button>
                {index < breadcrumbs.length - 1 && (
                  <span className="text-indigo-300/40">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em] text-indigo-100/70">
          <LegendPill color="bg-emerald-400" label="Завершено" />
          <LegendPill color="bg-indigo-400" label="Текущая миссия" />
          <LegendPill color="bg-fuchsia-400" label="Готово к запуску" />
          <LegendPill color="bg-slate-300" label="Заблокировано" />
        </div>
      </div>

      <aside className="relative flex flex-col justify-between gap-6 rounded-[32px] border border-white/10 bg-white/5 p-6 text-sm text-indigo-100/80 backdrop-blur">
        {selectedNode ? (
          <>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.4em] text-indigo-200/70">Брифинг миссии</p>
              <h3 className="text-2xl font-semibold text-white">{selectedNode.title}</h3>
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/60">
                {selectedNode.tagline}
              </p>
              <p className="text-sm leading-relaxed text-indigo-100/80">
                {selectedNode.description}
              </p>
            </div>

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
                <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-indigo-200/60">
                  Оперативный план
                </p>
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
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-indigo-200/70">Миссии не найдены</p>
            <p className="text-sm text-indigo-100/60 mt-2">
              Подключитесь к активной кампании для просмотра миссий
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

function LegendPill({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
      <span className={clsx("h-2 w-2 rounded-full", color)} />
      <span>{label}</span>
    </span>
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


