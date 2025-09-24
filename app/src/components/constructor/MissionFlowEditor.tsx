"use client";

import React, { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
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
import { Plus } from "lucide-react";

const nodeTypes: NodeTypes = {
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
  onMissionCreate: (mission: Partial<Mission>) => void;
  onMissionDelete: (missionId: string) => void;
  onDependencyCreate: (source: string, target: string) => void;
  onDependencyDelete: (source: string, target: string) => void;
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
}: MissionFlowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Convert missions to React Flow nodes
  useEffect(() => {
    const flowNodes: Node[] = missions.map((mission) => ({
      id: mission.id,
      type: "missionNode",
      position: { x: mission.positionX, y: mission.positionY },
      data: {
        mission,
        onEdit: (mission: Mission) => {
          setSelectedNode({
            id: mission.id,
            type: "missionNode",
            position: { x: mission.positionX, y: mission.positionY },
            data: { mission }
          });
          setIsPanelOpen(true);
        },
        onDelete: () => onMissionDelete(mission.id),
      },
    }));
    setNodes(flowNodes);
  }, [missions, setNodes, onMissionDelete]);

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
        onDependencyCreate(connection.source, connection.target);
      }
    },
    [onDependencyCreate]
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
      campaignId,
      name: "Новая миссия",
      description: "",
      missionType: "CUSTOM",
      experienceReward: 10,
      manaReward: 5,
      positionX: Math.random() * 500,
      positionY: Math.random() * 500,
      confirmationType: "MANUAL_REVIEW",
      minRank: 1,
      competencies: [],
    };
    onMissionCreate(newMission);
  }, [campaignId, onMissionCreate]);

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
  }, []);

  return (
    <div className="w-full h-[600px] relative border border-white/10 rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600/5 via-transparent to-purple-600/5">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        className="bg-transparent"
      >
        <Background color="#6366f1" gap={20} size={0.5} />
        <Controls className="bg-white/10 border border-white/20" />
        <MiniMap
          className="bg-white/10 border border-white/20"
          nodeColor="#8b5cf6"
          maskColor="rgba(255, 255, 255, 0.1)"
        />
        <Panel position="top-right">
          <button
            onClick={addNewMission}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium text-sm"
          >
            <Plus size={16} />
            Добавить миссию
          </button>
        </Panel>
      </ReactFlow>

      {isPanelOpen && selectedNode && (
        <MissionEditPanel
          mission={selectedNode.data.mission}
          onSave={handlePanelSave}
          onClose={handlePanelClose}
          campaignId={campaignId}
        />
      )}
    </div>
  );
}
