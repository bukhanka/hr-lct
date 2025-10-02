"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Connection,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  Panel
} from "reactflow";
import "reactflow/dist/style.css";
import { MissionNode } from "./MissionNode";
import { MissionEditPanel } from "./MissionEditPanel";
import type { CampaignThemeConfig } from "@/types/campaignTheme";
import {
  Plus,
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Download,
  Upload,
  ArrowLeft,
  RefreshCcw,
  TestTube,
  Grid3x3,
  Layers,
  RotateCcw,
  Undo2,
  Redo2,
  Eye,
  ChevronDown,
  ClipboardList,
  Star,
  Target,
  ScanLine,
  Copy,
  FileJson,
  ShieldCheck,
  X
} from "lucide-react";
import clsx from "clsx";
import { NodeLibraryPanel } from "./NodeLibraryPanel";
import { TestModePanel } from "./TestModePanel";
import type { TestModeState, TestMissionStatus } from "@/types/testMode";
import {
  resolveTemplate,
  mapTemplates,
  type MissionCollection,
  type MissionTemplate,
  type MapTemplate
} from "@/data/nodeLibrary";

// Define nodeTypes outside component to prevent React Flow warnings
const missionNodeTypes: NodeTypes = {
  missionNode: MissionNode,
};

// Define edge style outside component to prevent React Flow warnings
const defaultEdgeStyle = { stroke: "#8b5cf6", strokeWidth: 2 };
const reactFlowStyle = { width: "100%", height: "100%" };

interface Mission {
  id: string;
  name: string;
  description?: string;
  missionType: string;
  experienceReward: number;
  manaReward: number;
  positionX: number;
  positionY: number;
  confirmationType: string;
  minRank: number;
  competencies: any[];
  dependenciesTo?: Array<{ sourceMissionId: string; targetMissionId: string }>;
}

interface MissionFlowEditorProps {
  campaignId: string;
  missions: Mission[];
  dependencies: any[];
  onMissionUpdate: (mission: Mission) => void;
  onMissionCreate: (mission: Partial<Mission>) => Promise<Mission | null> | Mission | null | void;
  onMissionDelete: (missionId: string) => void;
  onDependencyCreate: (source: string, target: string) => Promise<void> | void;
  onDependencyDelete: (source: string, target: string) => Promise<void> | void;
  onReloadCampaign?: () => Promise<void>;
  onNavigateToDashboard?: () => void;
  campaignInfo?: {
    name: string;
    totalMissions: number;
    totalExperience: number;
  };
  fullBleed?: boolean;
  campaignTheme?: CampaignThemeConfig | null;
  onThemeChange?: (theme: CampaignThemeConfig) => void;
}

export function MissionFlowEditor({
  campaignId,
  missions,
  dependencies,
  onMissionUpdate,
  onMissionCreate,
  onMissionDelete,
  onDependencyCreate,
  onDependencyDelete,
  onReloadCampaign,
  onNavigateToDashboard,
  campaignInfo,
  fullBleed = false,
  campaignTheme,
  onThemeChange,
}: MissionFlowEditorProps) {
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [showTestMode, setShowTestMode] = useState(false);
  const [testModeState, setTestModeState] = useState<TestModeState | null>(null);
  const [isTestModeActive, setIsTestModeActive] = useState(false);
  const [isTestDropdownOpen, setIsTestDropdownOpen] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSnapToGrid, setIsSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(25);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  
  // Undo/Redo state
  const [history, setHistory] = useState<Array<{
    missions: Mission[];
    dependencies: any[];
    timestamp: number;
    action: string;
  }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const connectionIds = useMemo(() => new Set((dependencies || []).map((dep: any) => `${dep.sourceMissionId}-${dep.targetMissionId}`)), [dependencies]);

  // History management functions
  const saveToHistory = useCallback((action: string, newMissions?: Mission[], newDependencies?: any[]) => {
    const currentMissions = newMissions || missions;
    const currentDependencies = newDependencies || dependencies;
    
    const newHistoryEntry = {
      missions: JSON.parse(JSON.stringify(currentMissions)),
      dependencies: JSON.parse(JSON.stringify(currentDependencies)),
      timestamp: Date.now(),
      action,
    };

    setHistory(prev => {
      // Remove any history after current index (when we make changes after undo)
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newHistoryEntry);
      
      // Limit history to 50 entries
      return newHistory.slice(-50);
    });
    
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [missions, dependencies, historyIndex]);

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  // Mission layout helpers
  const computeMissionLevels = useCallback(() => {
    const missionMap = new Map<string, Mission>();
    missions.forEach((mission) => missionMap.set(mission.id, mission));

    const memo = new Map<string, number>();
    const visiting = new Set<string>();

    const getLevel = (missionId: string): number => {
      if (memo.has(missionId)) {
        return memo.get(missionId)!;
      }

      if (visiting.has(missionId)) {
        // Cycle detected; treat as root to avoid infinite loop
        return 0;
      }

      visiting.add(missionId);
      const mission = missionMap.get(missionId);
      if (!mission) {
        visiting.delete(missionId);
        memo.set(missionId, 0);
        return 0;
      }

      const incoming = mission.dependenciesTo as Array<{ sourceMissionId: string; targetMissionId: string }> | undefined;
      if (!incoming || incoming.length === 0) {
        visiting.delete(missionId);
        memo.set(missionId, 0);
        return 0;
      }

      let maxLevel = 0;
      incoming.forEach((dep) => {
        const parentLevel = getLevel(dep.sourceMissionId);
        if (parentLevel > maxLevel) {
          maxLevel = parentLevel;
        }
      });

      visiting.delete(missionId);
      memo.set(missionId, maxLevel + 1);
      return maxLevel + 1;
    };

    const levelMap = new Map<number, Mission[]>();
    missions.forEach((mission) => {
      const level = getLevel(mission.id);
      if (!levelMap.has(level)) {
        levelMap.set(level, []);
      }
      levelMap.get(level)!.push(mission);
    });

    return levelMap;
  }, [missions]);

  const undo = useCallback(() => {
    if (!canUndo) return;
    
    const currentEntry = history[historyIndex - 1] || null;
    if (currentEntry) {
      // Restore missions and dependencies from history
      currentEntry.missions.forEach(mission => onMissionUpdate(mission));
      // Note: This is a simplified implementation
      // In a real app, you'd need to handle dependency restoration too
    }
    
    setHistoryIndex(prev => prev - 1);
  }, [canUndo, history, historyIndex, onMissionUpdate]);

  const redo = useCallback(() => {
    if (!canRedo) return;
    
    const nextEntry = history[historyIndex + 1];
    if (nextEntry) {
      // Restore missions and dependencies from history
      nextEntry.missions.forEach(mission => onMissionUpdate(mission));
      // Note: This is a simplified implementation
    }
    
    setHistoryIndex(prev => prev + 1);
  }, [canRedo, history, historyIndex, onMissionUpdate]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'z' && !event.shiftKey) {
          event.preventDefault();
          undo();
        } else if ((event.key === 'y') || (event.key === 'z' && event.shiftKey)) {
          event.preventDefault();
          redo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  useEffect(() => {
    if (!isTestDropdownOpen) {
      return;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as unknown as globalThis.Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsTestDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [isTestDropdownOpen]);

  const testStatusMap = useMemo(() => {
    if (!testModeState) {
      return new Map<string, TestMissionStatus>();
    }
    return new Map(testModeState.missions.map((mission) => [mission.missionId, mission.status]));
  }, [testModeState]);

  const handleFullCampaignTest = () => {
    setIsTestDropdownOpen(false);
    router.push(`/dashboard/architect/campaigns/${campaignId}/test`);
  };

  const handleQuickTest = () => {
    setShowTestMode(true);
    setIsTestDropdownOpen(false);
  };

  const progressText = useMemo(() => {
    if (!testModeState) {
      return null;
    }
    const { summary } = testModeState;
    if (!summary.total) {
      return null;
    }
    return `${summary.completed}/${summary.total} выполнено`;
  }, [testModeState]);

  const totalExperience = useMemo(() => {
    return missions.reduce((acc, mission) => acc + (mission.experienceReward || 0), 0);
  }, [missions]);

  const handleDuplicateMission = useCallback(async (missionId: string) => {
    try {
      const response = await fetch(`/api/missions/${missionId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offset: { x: 100, y: 100 } }),
      });

      if (response.ok) {
        if (onReloadCampaign) {
          await onReloadCampaign();
        }
      }
    } catch (error) {
      console.error('Duplicate error:', error);
    }
  }, [onReloadCampaign]);

  // Convert missions to React Flow nodes
  useEffect(() => {
    const flowNodes: Node[] = missions.map((mission) => ({
      id: mission.id,
      type: "missionNode",
      position: { x: mission.positionX ?? 240, y: mission.positionY ?? 240 },
      data: {
        mission,
        testStatus: testStatusMap.get(mission.id) ?? null,
        onEdit: (mission: Mission) => {
          setSelectedNode({
            id: mission.id,
            type: "missionNode",
            position: { x: mission.positionX ?? 0, y: mission.positionY ?? 0 },
            data: { mission }
          });
          setSelectedEdge(null);
          setIsPanelOpen(true);
        },
        onDelete: () => onMissionDelete(mission.id),
        onDuplicate: () => handleDuplicateMission(mission.id),
      },
    }));
    setNodes(flowNodes);
  }, [missions, setNodes, onMissionDelete, testStatusMap, handleDuplicateMission]);

  // Convert dependencies to React Flow edges
  useEffect(() => {
    const flowEdges: Edge[] = dependencies.map((dep, index) => ({
      id: `${dep.sourceMissionId}-${dep.targetMissionId}`,
      source: dep.sourceMissionId,
      target: dep.targetMissionId,
      type: "smoothstep",
      animated: true,
      style: defaultEdgeStyle,
    }));
    setEdges(flowEdges);
  }, [dependencies, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        const edgeId = `${connection.source}-${connection.target}`;
        if (connectionIds.has(edgeId)) {
          return;
        }

        setEdges((prev) => [
          ...prev,
          {
            id: edgeId,
            source: connection.source!,
            target: connection.target!,
            type: "smoothstep",
            animated: true,
            style: defaultEdgeStyle,
          },
        ]);
        onDependencyCreate(connection.source, connection.target);
      }
    },
    [connectionIds, onDependencyCreate, setEdges]
  );

  // Snap to grid function
  const snapToGrid = useCallback((position: { x: number; y: number }) => {
    if (!isSnapToGrid) return position;
    
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize,
    };
  }, [isSnapToGrid, gridSize]);

  const onNodeDragStop = useCallback(
    (event: any, node: Node) => {
      const mission = node.data.mission;
      const snappedPosition = snapToGrid(node.position);
      
      const updatedMission = {
        ...mission,
        positionX: snappedPosition.x,
        positionY: snappedPosition.y,
      };
      
      onMissionUpdate(updatedMission);
      
      // Save to history after position change
      saveToHistory(`Moved mission: ${mission.name}`);
      
      // Update the node position in the UI immediately if snapped
      if (isSnapToGrid && (snappedPosition.x !== node.position.x || snappedPosition.y !== node.position.y)) {
        setNodes((nodes) =>
          nodes.map((n) =>
            n.id === node.id
              ? { ...n, position: snappedPosition }
              : n
          )
        );
      }
    },
    [onMissionUpdate, snapToGrid, isSnapToGrid, setNodes, saveToHistory]
  );

  // Auto layout function for new missions
  const getNextPosition = useCallback(() => {
    const levelMap = computeMissionLevels();
    const levels = Array.from(levelMap.keys());
    const maxLevel = levels.length > 0 ? Math.max(...levels) : 0;
    const lastLevelMissions = levelMap.get(maxLevel) ?? missions;

    const horizontalSpacing = 320;
    const verticalSpacing = 240;
    const startX = 320;
    const baseY = 200 + maxLevel * verticalSpacing;

    const takenPositions = new Set(lastLevelMissions.map((mission) => `${mission.positionX}-${mission.positionY}`));

    for (let offset = 0; offset < 6; offset++) {
      const x = startX + offset * horizontalSpacing;
      const candidate = snapToGrid({ x, y: baseY });
      const key = `${candidate.x}-${candidate.y}`;
      if (!takenPositions.has(key)) {
        return candidate;
      }
    }

    return snapToGrid({
      x: startX + (lastLevelMissions.length + 1) * horizontalSpacing,
      y: baseY,
    });
  }, [computeMissionLevels, missions, snapToGrid]);

  const addNewMission = useCallback(() => {
    const position = getNextPosition();
    
    const newMission = {
      name: "Новая миссия",
      description: "",
      missionType: "CUSTOM",
      experienceReward: 10,
      manaReward: 5,
      positionX: position.x,
      positionY: position.y,
      confirmationType: "MANUAL_REVIEW",
      minRank: 1,
      competencies: [],
    };
    onMissionCreate(newMission);
  }, [onMissionCreate, getNextPosition]);

  // Auto layout all missions
  const autoLayoutAll = useCallback(() => {
    const levelMap = computeMissionLevels();
    const horizontalSpacing = 320;
    const verticalSpacing = 260;
    const startY = 200;
    const centerX = 480;

    const updatedMissions: Mission[] = [];

    Array.from(levelMap.entries())
      .sort(([levelA], [levelB]) => levelA - levelB)
      .forEach(([level, levelMissions]) => {
        const count = levelMissions.length;
        const totalWidth = count > 1 ? (count - 1) * horizontalSpacing : 0;
        const startX = centerX - totalWidth / 2;

        levelMissions.forEach((mission, index) => {
          const position = snapToGrid({
            x: startX + index * horizontalSpacing,
            y: startY + level * verticalSpacing,
          });

          updatedMissions.push({
            ...mission,
            positionX: position.x,
            positionY: position.y,
          });
        });
      });

    if (updatedMissions.length === 0) {
      return;
    }

    updatedMissions.forEach((mission) => {
      onMissionUpdate(mission);
    });

    saveToHistory("Auto layout applied", updatedMissions);
  }, [computeMissionLevels, onMissionUpdate, snapToGrid, saveToHistory]);

  const handleTemplateCreate = useCallback(
    (template: MissionTemplate) => {
      onMissionCreate({
        name: template.title,
        description: template.description,
        missionType: template.missionType,
        experienceReward: template.experienceReward,
        manaReward: template.manaReward,
        confirmationType: template.confirmationType,
        minRank: template.minRank,
        positionX: 200,
        positionY: 200,
        competencies: [],
      });
    },
    [onMissionCreate]
  );

  const handleCollectionCreate = useCallback(
    async (collection: MissionCollection) => {
      const existingX = missions.map((mission) => mission.positionX ?? 0);
      const existingY = missions.map((mission) => mission.positionY ?? 0);
      const baseX = (existingX.length ? Math.max(...existingX) : 0) + 260;
      const baseY = existingY.length ? Math.min(...existingY) - 40 : 180;

      const createdMissionIds: string[] = [];

      for (let index = 0; index < collection.items.length; index += 1) {
        const item = collection.items[index];
        const template = resolveTemplate(item.templateId);
        if (!template) continue;

        const missionPayload: Partial<Mission> = {
          name: template.title,
          description: template.description,
          missionType: template.missionType,
          experienceReward: template.experienceReward,
          manaReward: template.manaReward,
          confirmationType: template.confirmationType,
          minRank: template.minRank,
          positionX: baseX + (item.offset?.x ?? index * 220),
          positionY: baseY + (item.offset?.y ?? index * 140),
          competencies: [],
        };

        try {
          const created = await onMissionCreate(missionPayload);
          const missionId = typeof created === "object" && created ? (created as Mission).id : undefined;
          if (missionId) {
            createdMissionIds.push(missionId);
          }
        } catch (error) {
          console.error("[MissionFlowEditor] Failed to create mission from collection", collection.id, error);
        }
      }

      if (createdMissionIds.length > 1) {
        for (let index = 0; index < createdMissionIds.length - 1; index += 1) {
          try {
            await onDependencyCreate(createdMissionIds[index], createdMissionIds[index + 1]);
          } catch (error) {
            console.error("[MissionFlowEditor] Failed to create dependency for collection", collection.id, error);
          }
        }
      }
    },
    [missions, onMissionCreate, onDependencyCreate]
  );

  const handleMapTemplateApply = useCallback(
    async (templateId: string) => {
      const mapTemplate: MapTemplate | undefined = mapTemplates.find((template) => template.id === templateId);
      if (!mapTemplate) {
        console.warn("[MissionFlowEditor] Map template not found", templateId);
        return;
      }

      const existingX = missions.map((mission) => mission.positionX ?? 0);
      const existingY = missions.map((mission) => mission.positionY ?? 0);
      const baseX = (existingX.length ? Math.max(...existingX) : 0) + 280;
      const baseY = existingY.length ? Math.min(...existingY) - 60 : 160;

      const createdMapNodes: Record<number, string> = {};

      for (let index = 0; index < mapTemplate.missions.length; index += 1) {
        const missionDef = mapTemplate.missions[index];
        const template = resolveTemplate(missionDef.templateId);
        if (!template) continue;

        const missionPayload: Partial<Mission> = {
          name: template.title,
          description: template.description,
          missionType: template.missionType,
          experienceReward: template.experienceReward,
          manaReward: template.manaReward,
          confirmationType: template.confirmationType,
          minRank: template.minRank,
          positionX: baseX + missionDef.position.x,
          positionY: baseY + missionDef.position.y,
          competencies: [],
        };

        try {
          const created = await onMissionCreate(missionPayload);
          const missionId = typeof created === "object" && created ? (created as Mission).id : undefined;
          if (missionId) {
            createdMapNodes[index] = missionId;
          }
        } catch (error) {
          console.error("[MissionFlowEditor] Failed to create mission from map template", templateId, error);
        }
      }

      for (const connection of mapTemplate.connections) {
        const sourceId = createdMapNodes[connection.sourceIndex];
        const targetId = createdMapNodes[connection.targetIndex];
        if (!sourceId || !targetId) continue;
        try {
          await onDependencyCreate(sourceId, targetId);
        } catch (error) {
          console.error("[MissionFlowEditor] Failed to create map dependency", templateId, error);
        }
      }
    },
    [missions, onMissionCreate, onDependencyCreate]
  );

  const handlePanelSave = useCallback(
    (mission: Mission) => {
      onMissionUpdate(mission);
      setIsPanelOpen(false);
      setSelectedNode(null);
    },
    [onMissionUpdate]
  );

  const handlePanelClose = useCallback(() => {
    setIsPanelOpen(false);
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const handleTestModeStateChange = useCallback((state: TestModeState | null) => {
    setTestModeState(state);
    setIsTestModeActive(!!state);
  }, []);

  const handleValidateCampaign = useCallback(async () => {
    setIsValidating(true);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/validate`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setValidationResults(data);
        setShowValidation(true);
      }
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsValidating(false);
    }
  }, [campaignId]);

  const handleExportCampaign = useCallback(async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `campaign_${campaignId}_export.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  }, [campaignId]);

  const handleImportCampaign = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        const response = await fetch('/api/campaigns/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const result = await response.json();
          alert(`Кампания импортирована! Миссий: ${result.stats.missionsImported}`);
          if (onReloadCampaign) {
            await onReloadCampaign();
          }
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('Ошибка импорта кампании');
      }
    };
    input.click();
  }, [onReloadCampaign]);

  const isMissionPanelOpen = isPanelOpen && !!selectedNode && !showTestMode;

  const containerClass = clsx(
    "relative flex min-h-0 flex-1 w-full overflow-hidden bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514]",
    fullBleed ? "rounded-none" : "rounded-3xl border border-white/10"
  );

  return (
    <div className={containerClass}>
      <NodeLibraryPanel
        onCreate={handleTemplateCreate}
        onCreateCollection={handleCollectionCreate}
        onApplyMapTemplate={handleMapTemplateApply}
        isOpen={isLibraryOpen}
        onToggle={() => setIsLibraryOpen((prev) => !prev)}
      />
      
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="relative z-40 flex flex-wrap items-center gap-4 border-b border-white/5 bg-black/40 px-6 py-4 backdrop-blur-xl shadow-[0_18px_48px_rgba(5,4,20,0.55)]">
          <div className="flex min-w-0 flex-1 items-center gap-6">
            <button
              onClick={onNavigateToDashboard || (() => router.push('/dashboard/architect'))}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-100/80 transition hover:border-white/40 hover:text-white"
            >
              <ArrowLeft size={16} />
              К дашборду
            </button>

            {campaignInfo && (
              <div className="flex min-w-0 flex-col">
                <span className="text-[11px] uppercase tracking-[0.35em] text-indigo-200/70">Кампания</span>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <h1
                    className="truncate text-xl font-semibold text-white"
                    title={campaignInfo.name}
                  >
                    {campaignInfo.name}
                  </h1>
                  <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/50 bg-indigo-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-indigo-200">
                    <ClipboardList size={12} />
                    {campaignInfo.totalMissions} миссий
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-amber-200">
                    <Star size={12} />
                    {totalExperience} XP
                  </div>
                  {progressText && (
                    <div className="inline-flex items-center gap-2 rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-green-200">
                      <TestTube size={12} />
                      {progressText}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1.5">
              <button
                onClick={handleValidateCampaign}
                disabled={isValidating}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-indigo-100/80 transition hover:text-white"
                title="Проверить кампанию"
              >
                <ShieldCheck size={14} />
                {/* {isValidating ? 'Проверка...' : 'Проверить'} */}
              </button>
              <button
                onClick={handleExportCampaign}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-indigo-100/80 transition hover:text-white"
                title="Экспорт в JSON"
              >
                <Download size={14} />
                {/* Экспорт */}
              </button>
              <button
                onClick={handleImportCampaign}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-indigo-100/80 transition hover:text-white"
                title="Импорт из JSON"
              >
                <Upload size={14} />
                {/* Импорт */}
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1.5">
              <button
                onClick={addNewMission}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-[0_12px_28px_rgba(79,70,229,0.45)] transition hover:bg-indigo-500/90"
              >
                <Plus size={16} />
                Новая миссия
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1.5">
              <button
                onClick={undo}
                disabled={!canUndo}
                className={clsx(
                  "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium transition",
                  canUndo
                    ? "text-indigo-100/80 hover:text-white"
                    : "cursor-not-allowed text-indigo-100/30"
                )}
                title="Отменить (Ctrl+Z)"
                aria-label="Отменить"
              >
                <Undo2 size={14} />
              </button>
              <span className="text-indigo-100/20">|</span>
              <button
                onClick={redo}
                disabled={!canRedo}
                className={clsx(
                  "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium transition",
                  canRedo
                    ? "text-indigo-100/80 hover:text-white"
                    : "cursor-not-allowed text-indigo-100/30"
                )}
                title="Повторить (Ctrl+Y)"
                aria-label="Повторить"
              >
                <Redo2 size={14} />
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1.5">
              <button
                onClick={() => setIsSnapToGrid(!isSnapToGrid)}
                className={clsx(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition",
                  isSnapToGrid
                    ? "bg-indigo-500/20 text-indigo-200"
                    : "text-indigo-100/60 hover:text-white"
                )}
                title="Привязка к сетке"
                aria-pressed={isSnapToGrid}
              >
                <Grid3x3 size={14} />
                Сетка
              </button>
              <button
                onClick={autoLayoutAll}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-indigo-100/60 transition hover:text-white"
                title="Автоматический лейаут"
              >
                <Layers size={14} />
                Авто
              </button>
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsTestDropdownOpen((prev) => !prev)}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                  isTestModeActive
                    ? "border-indigo-400 bg-indigo-500/20 text-white hover:border-indigo-300"
                    : "border-white/10 bg-white/5 text-indigo-100/80 hover:border-white/30 hover:text-white"
                )}
                aria-expanded={isTestDropdownOpen}
                aria-haspopup="menu"
              >
                <TestTube size={16} />
                Тестирование
                <ChevronDown size={14} className={clsx("transition-transform", isTestDropdownOpen && "rotate-180")} />
              </button>

              {isTestDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 max-w-sm rounded-2xl border border-white/15 bg-[#0b0a21]/95 shadow-[0_18px_48px_rgba(6,3,24,0.55)] backdrop-blur-xl">
                  <div className="p-3">
                    <button
                      onClick={handleQuickTest}
                      className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-white/10"
                    >
                      <TestTube size={16} className="mt-0.5 text-indigo-400" />
                      <div>
                        <div className="text-sm font-medium text-white">Быстрое тестирование</div>
                        <div className="mt-1 text-xs text-indigo-200/60">Проверяйте миссии прямо в рабочей области</div>
                      </div>
                    </button>
                    <button
                      onClick={handleFullCampaignTest}
                      disabled={!campaignInfo || campaignInfo.totalMissions === 0}
                      className="mt-1 flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Eye size={16} className="mt-0.5 text-green-400" />
                      <div>
                        <div className="text-sm font-medium text-white">Просмотр глазами кадета</div>
                        <div className="mt-1 text-xs text-indigo-200/60">Запустите связанный интерфейс тестирования</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div
          className={clsx(
            "relative flex min-h-0 flex-1 overflow-hidden",
            isMissionPanelOpen && "pointer-events-none"
          )}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={missionNodeTypes}
            minZoom={0.25}
            maxZoom={2}
            className="bg-transparent"
            style={reactFlowStyle}
            onInit={(instance) => {
              setReactFlowInstance(instance);
              instance.fitView({ padding: 0.24 });
            }}
            onNodeClick={(_, node) => {
              setSelectedNode(node);
              setSelectedEdge(null);
              setIsPanelOpen(true);
            }}
            onEdgeClick={(_, edge) => {
              setSelectedEdge(edge);
              setSelectedNode(null);
              setIsPanelOpen(true);
            }}
            onPaneClick={() => {
              setIsPanelOpen(false);
              setSelectedNode(null);
              setSelectedEdge(null);
            }}
          >
            {showGrid && <Background color="#3f3f46" gap={24} size={0.5} />}
            {showMiniMap && (
              <MiniMap
                position="top-right"
                className="bg-white/10 border border-white/10"
                nodeColor={(node) => {
                  const status = testStatusMap.get(node.id);
                  switch (status) {
                    case "COMPLETED":
                      return "#22c55e";
                    case "AVAILABLE":
                      return "#38bdf8";
                    case "LOCKED":
                      return "#6b7280";
                    case "PENDING_REVIEW":
                      return "#facc15";
                    default:
                      return "#8b5cf6";
                  }
                }}
                maskColor="rgba(12, 10, 35, 0.65)"
              />
            )}
            <Controls className="hidden" />
            <Panel position="bottom-left" className="flex gap-2 rounded-xl border border-white/10 bg-black/40 px-2 py-2">
              <button
                onClick={() => reactFlowInstance?.zoomOut({ duration: 200 })}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-indigo-100/80 transition hover:border-white/30 hover:text-white"
              >
                <ZoomOut size={16} />
              </button>
              <button
                onClick={() => reactFlowInstance?.fitView({ padding: 0.24, duration: 200 })}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-indigo-100/80 transition hover:border-white/30 hover:text-white"
              >
                <Target size={16} />
              </button>
              <button
                onClick={() => reactFlowInstance?.zoomIn({ duration: 200 })}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-indigo-100/80 transition hover:border-white/30 hover:text-white"
              >
                <ZoomIn size={16} />
              </button>
            </Panel>
            <Panel position="bottom-right" className="flex gap-2 rounded-xl border border-white/10 bg-black/40 px-2 py-2">
              <button
                onClick={() => setShowGrid((prev) => !prev)}
                className={clsx(
                  "flex items-center gap-2 rounded-lg border px-3 py-1 text-xs transition",
                  showGrid
                    ? "border-indigo-500/60 bg-indigo-500/20 text-white"
                    : "border-white/10 text-indigo-100/70 hover:border-white/30 hover:text-white"
                )}
              >
                <ScanLine size={14} />
                Сетка
              </button>
              <button
                onClick={() => setShowMiniMap((prev) => !prev)}
                className={clsx(
                  "flex items-center gap-2 rounded-lg border px-3 py-1 text-xs transition",
                  showMiniMap
                    ? "border-indigo-500/60 bg-indigo-500/20 text-white"
                    : "border-white/10 text-indigo-100/70 hover:border-white/30 hover:text-white"
                )}
              >
                <Maximize2 size={14} />
                Миникарта
              </button>
            </Panel>
          </ReactFlow>

          {showTestMode && (
            <TestModePanel
              campaignId={campaignId}
              onClose={() => setShowTestMode(false)}
              onStateChange={handleTestModeStateChange}
              state={testModeState}
            />
          )}

          {isMissionPanelOpen && (
            <MissionEditPanel
              mission={selectedNode.data.mission}
              onSave={handlePanelSave}
              onClose={handlePanelClose}
              campaignId={campaignId}
            />
          )}

          {isMissionPanelOpen && (
            <div className="pointer-events-none absolute inset-0 z-[150] bg-black/40 backdrop-blur-sm" />
          )}
        </div>
      </div>

      {/* Validation Results Modal */}
      {showValidation && validationResults && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514] shadow-2xl">
            <div className="border-b border-white/10 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={24} className={validationResults.isValid ? 'text-green-400' : 'text-yellow-400'} />
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Результаты валидации
                    </h3>
                    <p className="text-sm text-indigo-200/70">
                      Оценка здоровья: {validationResults.healthScore}/100
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowValidation(false)}
                  className="rounded-lg p-2 text-indigo-200 hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-6">
              {/* Summary */}
              <div className="mb-6 grid grid-cols-4 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-indigo-200/60">Миссий</div>
                  <div className="text-2xl font-bold text-white">{validationResults.summary.totalMissions}</div>
                </div>
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                  <div className="text-xs text-red-200/80">Критичные</div>
                  <div className="text-2xl font-bold text-red-300">{validationResults.summary.critical}</div>
                </div>
                <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3">
                  <div className="text-xs text-yellow-200/80">Предупреждения</div>
                  <div className="text-2xl font-bold text-yellow-300">{validationResults.summary.high + validationResults.summary.medium}</div>
                </div>
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3">
                  <div className="text-xs text-blue-200/80">Подсказки</div>
                  <div className="text-2xl font-bold text-blue-300">{validationResults.summary.low}</div>
                </div>
              </div>

              {/* Issues List */}
              <div className="space-y-3">
                {validationResults.issues.length === 0 ? (
                  <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center">
                    <div className="text-green-300">✓ Проблем не обнаружено!</div>
                    <div className="mt-1 text-xs text-green-200/60">Кампания готова к запуску</div>
                  </div>
                ) : (
                  validationResults.issues.map((issue: any, index: number) => (
                    <div
                      key={index}
                      className={clsx(
                        'rounded-xl border p-4',
                        issue.severity === 'critical' && 'border-red-500/30 bg-red-500/10',
                        issue.severity === 'high' && 'border-orange-500/30 bg-orange-500/10',
                        issue.severity === 'medium' && 'border-yellow-500/30 bg-yellow-500/10',
                        issue.severity === 'low' && 'border-blue-500/30 bg-blue-500/10'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={clsx(
                            'mt-1 rounded-full px-2 py-0.5 text-xs font-medium',
                            issue.severity === 'critical' && 'bg-red-500/20 text-red-300',
                            issue.severity === 'high' && 'bg-orange-500/20 text-orange-300',
                            issue.severity === 'medium' && 'bg-yellow-500/20 text-yellow-300',
                            issue.severity === 'low' && 'bg-blue-500/20 text-blue-300'
                          )}
                        >
                          {issue.severity}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">{issue.message}</div>
                          {issue.missionName && (
                            <div className="mt-1 text-xs text-indigo-200/60">Миссия: {issue.missionName}</div>
                          )}
                          {issue.suggestion && (
                            <div className="mt-2 text-sm text-indigo-200/70">💡 {issue.suggestion}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-white/10 px-6 py-4">
              <button
                onClick={() => setShowValidation(false)}
                className="w-full rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-600"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
