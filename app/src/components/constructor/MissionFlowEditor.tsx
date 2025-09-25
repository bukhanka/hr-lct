"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  Plus,
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Target,
  Trash2,
  Link2,
  ScanLine,
  Activity,
  ArrowLeft,
  RefreshCcw,
  TestTube
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
  fullBleed?: boolean;
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
  fullBleed = false,
}: MissionFlowEditorProps) {
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
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const connectionIds = useMemo(() => new Set((dependencies || []).map((dep: any) => `${dep.sourceMissionId}-${dep.targetMissionId}`)), [dependencies]);

  const testStatusMap = useMemo(() => {
    if (!testModeState) {
      return new Map<string, TestMissionStatus>();
    }
    return new Map(testModeState.missions.map((mission) => [mission.missionId, mission.status]));
  }, [testModeState]);

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
      },
    }));
    setNodes(flowNodes);
  }, [missions, setNodes, onMissionDelete, testStatusMap]);

  // Convert dependencies to React Flow edges
  useEffect(() => {
    const flowEdges: Edge[] = dependencies.map((dep, index) => ({
      id: `${dep.sourceMissionId}-${dep.targetMissionId}`,
      source: dep.sourceMissionId,
      target: dep.targetMissionId,
      type: "smoothstep",
      animated: true,
      style: { stroke: "#8b5cf6", strokeWidth: 2 },
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
            style: { stroke: "#8b5cf6", strokeWidth: 2 },
          },
        ]);
        onDependencyCreate(connection.source, connection.target);
      }
    },
    [connectionIds, onDependencyCreate, setEdges]
  );

  const onNodeDragStop = useCallback(
    (event: any, node: Node) => {
      const mission = node.data.mission;
      onMissionUpdate({
        ...mission,
        positionX: node.position.x,
        positionY: node.position.y,
      });
    },
    [onMissionUpdate]
  );

  const addNewMission = useCallback(() => {
    const newMission = {
      name: "Новая миссия",
      description: "",
      missionType: "CUSTOM",
      experienceReward: 10,
      manaReward: 5,
      positionX: 200,
      positionY: 200,
      confirmationType: "MANUAL_REVIEW",
      minRank: 1,
      competencies: [],
    };
    onMissionCreate(newMission);
  }, [onMissionCreate]);

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
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-16 items-center justify-between border-b border-white/10 bg-black/30 px-6 backdrop-blur-xl">
          <div className="flex items-center gap-6">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-xs uppercase tracking-[0.3em] text-indigo-100/80 transition hover:border-white/40 hover:text-white"
            >
              <ArrowLeft size={14} />
              Назад
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-xs uppercase tracking-[0.3em] text-indigo-100/80 transition hover:border-white/40 hover:text-white"
            >
              <RefreshCcw size={14} />
              Sync
            </button>
            <div className="flex items-center gap-4 text-xs text-indigo-100/80">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                <span className="tracking-[0.3em] text-indigo-200/60">Миссий</span>
                <span className="ml-2 text-sm font-semibold text-white">{missions.length}</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                <span className="tracking-[0.3em] text-indigo-200/60">XP</span>
                <span className="ml-2 text-sm font-semibold text-white">{missions.reduce((acc, m) => acc + (m.experienceReward || 0), 0)}</span>
              </div>
              {progressText && (
                <div className="rounded-2xl border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-sm font-semibold text-indigo-200 flex items-center gap-2">
                  <TestTube size={14} className="text-indigo-300" />
                  <span>{progressText}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={addNewMission}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500/90 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500"
            >
              <Plus size={16} />
              Новая миссия
            </button>
            <button
              onClick={() => setShowTestMode(true)}
              className={clsx(
                "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition",
                isTestModeActive
                  ? "border-indigo-400 bg-indigo-500/20 text-white hover:border-indigo-300"
                  : "border-white/10 bg-white/5 text-indigo-100/80 hover:border-white/30 hover:text-white"
              )}
            >
              <TestTube size={16} />
              Тест воронки
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-indigo-100/80 transition hover:border-white/30 hover:text-white"
            >
              <Sparkles size={16} />
              ИИ-пилот
            </button>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 overflow-hidden">
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
            style={{ width: "100%", height: "100%" }}
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

          {isPanelOpen && selectedNode && !showTestMode && (
            <MissionEditPanel
              mission={selectedNode.data.mission}
              onSave={handlePanelSave}
              onClose={handlePanelClose}
              campaignId={campaignId}
            />
          )}

          {isPanelOpen && selectedEdge && !showTestMode && (
            <aside className="flex w-[360px] flex-col border-l border-white/10 bg-white/5 backdrop-blur">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">
                    Связь миссий
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {selectedEdge.source} → {selectedEdge.target}
                  </p>
                </div>
                <button
                  onClick={handlePanelClose}
                  className="rounded-lg border border-white/10 px-2 py-1 text-xs text-indigo-100/70 transition hover:border-white/30 hover:text-white"
                >
                  Закрыть
                </button>
              </div>
              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6 text-sm text-indigo-100/80">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-indigo-200/60">
                    Контекст
                  </p>
                  <div className="mt-3 space-y-2 text-xs text-indigo-100/70">
                    <div className="flex items-center gap-2">
                      <Activity size={12} className="text-indigo-300" />
                      <span>Тип связи: Последовательная</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link2 size={12} className="text-indigo-300" />
                      <span>Источник: {selectedEdge.source}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link2 size={12} className="text-indigo-300" />
                      <span>Цель: {selectedEdge.target}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[11px] uppercase tracking-[0.3ем] text-indigo-200/60">
                    Управление
                  </p>
                  <p className="mt-3 text-xs text-indigo-100/70">
                    Удалите связь, чтобы сделать миссии независимыми или подключите их к другим веткам.
                  </p>
                  <button
                    onClick={() => {
                      if (!selectedEdge) return;
                      onDependencyDelete(selectedEdge.source, selectedEdge.target);
                      setIsPanelOpen(false);
                      setSelectedEdge(null);
                    }}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/20 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/30"
                  >
                    <Trash2 size={16} />
                    Удалить связь
                  </button>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
