"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  X,
  Play,
  RotateCcw,
  CheckCircle,
  Lock,
  Clock,
  Zap,
  ArrowRightCircle,
  CheckCircle2,
  PlayCircle,
  Shield,
  Hourglass,
  Lightbulb,
  PanelRightOpen,
  PanelRightClose,
  Eye
} from "lucide-react";
import clsx from "clsx";
import type { TestModeState, TestModeSummary, TestModeMission } from "@/types/testMode";
import { MissionModal } from "@/components/dashboard/MissionModal";
import { useTheme } from "@/contexts/ThemeContext";

type TestMissionStatus = TestModeMission["status"];

interface TestModePanelProps {
  campaignId: string;
  onClose: () => void;
  onStateChange: (state: TestModeState | null) => void;
  state: TestModeState | null;
}

export function TestModePanel({ campaignId, onClose, onStateChange, state }: TestModePanelProps) {
  const { theme } = useTheme();
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<TestModeMission | null>(null);
  const isActive = !!state;
  
  // Theme colors
  const primaryColor = theme.palette?.primary || "#8B5CF6";
  const secondaryColor = theme.palette?.secondary || "#38BDF8";
  const MIN_WIDTH = 360;
  const MAX_WIDTH = 820;
  const getInitialWidth = () => {
    if (typeof window === "undefined") {
      return 440;
    }
    return Math.min(Math.max(window.innerWidth * 0.36, MIN_WIDTH), Math.min(MAX_WIDTH, window.innerWidth - 96));
  };
  const [panelWidth, setPanelWidth] = useState<number>(getInitialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setPanelWidth(prev => {
        const maxAllowed = Math.min(MAX_WIDTH, window.innerWidth - 64);
        const nextWidth = Math.min(prev, maxAllowed);
        return Math.max(nextWidth, MIN_WIDTH);
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const startResize = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (event: MouseEvent) => {
      const widthFromPointer = window.innerWidth - event.clientX;
      const maxAllowed = Math.min(MAX_WIDTH, window.innerWidth - 64);
      const clamped = Math.min(Math.max(widthFromPointer, MIN_WIDTH), maxAllowed);
      setPanelWidth(clamped);
    };

    const stopResize = () => {
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopResize);
    };
  }, [isResizing]);

  const toggleExpanded = () => {
    if (typeof window === "undefined") return;
    if (isExpanded) {
      setPanelWidth(getInitialWidth());
      setIsExpanded(false);
      return;
    }
    const expandedWidth = Math.min(Math.max(window.innerWidth * 0.54, MIN_WIDTH), Math.min(MAX_WIDTH, window.innerWidth - 48));
    setPanelWidth(expandedWidth);
    setIsExpanded(true);
  };

  const initializeTestMode = async () => {
    console.log("[DEBUG] TestModePanel: Starting test mode initialization...");
    setIsInitializing(true);
    setError(null);
    try {
      console.log("[DEBUG] TestModePanel: Making POST request to:", `/api/campaigns/${campaignId}/test-mode`);
      const response = await fetch(`/api/campaigns/${campaignId}/test-mode`, {
        method: "POST",
      });
      
      console.log("[DEBUG] TestModePanel: Response status:", response.status);
      console.log("[DEBUG] TestModePanel: Response ok:", response.ok);
      
      if (!response.ok) {
        let errorData;
        try {
          const responseText = await response.text();
          console.error("[DEBUG] TestModePanel: Raw error response text:", responseText);
          if (responseText.trim()) {
            errorData = JSON.parse(responseText);
          } else {
            errorData = { error: "Empty response from server" };
          }
        } catch (parseError) {
          console.error("[DEBUG] TestModePanel: Failed to parse error response:", parseError);
          errorData = { 
            error: `Server error (${response.status}): Unable to parse response`,
            rawError: parseError.message
          };
        }
        console.error("[DEBUG] TestModePanel: Error response data:", errorData);
        throw new Error(errorData.error || "Failed to initialize test mode");
      }
      
      const data = await response.json();
      console.log("[DEBUG] TestModePanel: Success response data:", data);
      onStateChange(data.state);
    } catch (err) {
      console.error("[DEBUG] TestModePanel: Error during initialization:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsInitializing(false);
    }
  };

  const clearTestMode = async () => {
    console.log("[DEBUG] TestModePanel: Clearing test mode...");
    try {
      console.log("[DEBUG] TestModePanel: Making DELETE request to:", `/api/campaigns/${campaignId}/test-mode`);
      const response = await fetch(`/api/campaigns/${campaignId}/test-mode`, {
        method: "DELETE",
      });
      
      console.log("[DEBUG] TestModePanel: DELETE response status:", response.status);
      console.log("[DEBUG] TestModePanel: DELETE response ok:", response.ok);
      
      onStateChange(null);
      console.log("[DEBUG] TestModePanel: Test mode cleared successfully");
    } catch (err) {
      console.error("[DEBUG] TestModePanel: Error during clear:", err);
      setError(err instanceof Error ? err.message : "Failed to clear test mode");
    }
  };

  const quickTestMission = async (missionId: string) => {
    console.log("[DEBUG] TestModePanel: Quick testing mission:", missionId);
    try {
      console.log("[DEBUG] TestModePanel: Making POST request to:", `/api/missions/${missionId}/quick-test`);
      const response = await fetch(`/api/missions/${missionId}/quick-test`, {
        method: "POST",
      });
      
      console.log("[DEBUG] TestModePanel: Quick test response status:", response.status);
      console.log("[DEBUG] TestModePanel: Quick test response ok:", response.ok);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("[DEBUG] TestModePanel: Quick test error response:", errorData);
        throw new Error(errorData.error || "Failed to test mission");
      }
      
      const data = await response.json();
      console.log("[DEBUG] TestModePanel: Quick test success response:", data);
      onStateChange(data.state);
    } catch (err) {
      console.error("[DEBUG] TestModePanel: Error during quick test:", err);
      setError(err instanceof Error ? err.message : "Failed to test mission");
    }
  };

  const playNextMission = async () => {
    if (!state) return;
    const nextMission = state.missions.find((mission) => mission.status === "AVAILABLE");
    if (nextMission) {
      await quickTestMission(nextMission.missionId);
    }
  };

  const openFullTestMode = (testMission: TestModeMission) => {
    setSelectedMission(testMission);
  };

  const handleMissionSubmit = async (missionId: string, submission: any) => {
    await quickTestMission(missionId);
    setSelectedMission(null);
  };

  const getMissionIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle size={16} className="text-green-400" />;
      case "AVAILABLE":
        return <Play size={16} className="text-blue-400" />;
      case "LOCKED":
        return <Lock size={16} className="text-gray-400" />;
      default:
        return <Clock size={16} className="text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "border-green-500/40 bg-green-500/10 text-green-200";
      case "AVAILABLE":
        return "border-blue-500/40 bg-blue-500/10 text-blue-200";
      case "LOCKED":
        return "border-gray-500/40 bg-gray-500/10 text-gray-400";
      default:
        return "border-yellow-500/40 bg-yellow-500/10 text-yellow-200";
    }
  };

  const summary = state?.summary;
  const completionPercent = useMemo(() => {
    if (!summary || !summary.total) return 0;
    return Math.round((summary.completed / summary.total) * 100);
  }, [summary]);

  return (
    <div
      className={clsx(
        "relative flex h-full max-h-full flex-col border-l border-white/10 bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514] shadow-2xl",
        isResizing && "select-none"
      )}
      style={{ width: panelWidth }}
    >
      <div
        onMouseDown={startResize}
        className="absolute left-0 top-0 z-20 flex h-full w-1 cursor-ew-resize items-center justify-center"
        aria-hidden="true"
      >
        <div className="h-12 w-[1.5px] rounded-full bg-white/30" />
      </div>
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Режим тестирования</h2>
          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-indigo-200/60">
            Проверьте воронку глазами кадета
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleExpanded}
            className="rounded-xl border border-white/10 p-2 text-indigo-200 transition hover:border-white/30 hover:text-white"
            aria-label={isExpanded ? "Свернуть панель" : "Расширить панель"}
          >
            {isExpanded ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 p-2 text-indigo-200 transition hover:border-white/30 hover:text-white"
            aria-label="Закрыть панель тестирования"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!isActive ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <div 
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <Play size={20} style={{ color: primaryColor }} />
              </div>
              <h3 className="text-sm font-medium text-white">Протестируйте воронку</h3>
              <p className="mt-2 text-xs text-indigo-100/70">
                Инициализируйте тестовый режим, чтобы пройти кампанию от лица кадета
              </p>
              <button
                onClick={initializeTestMode}
                disabled={isInitializing}
                className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
                style={{ 
                  backgroundColor: `${primaryColor}E6`,
                  ...(isInitializing ? {} : { ':hover': { backgroundColor: primaryColor } })
                }}
              >
                {isInitializing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Инициализация...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Начать тестирование
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div 
              className="flex flex-col gap-4 rounded-xl border p-4"
              style={{ 
                borderColor: `${primaryColor}33`,
                backgroundColor: `${primaryColor}1A`
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${primaryColor}4D` }}
                  >
                    <Zap size={14} style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Режим активен</p>
                    <p className="text-xs text-indigo-200/70">{summary?.total ?? 0} миссий загружено</p>
                  </div>
                </div>
                <button
                  onClick={clearTestMode}
                  className="rounded-lg border border-white/10 px-3 py-1 text-xs text-indigo-100/70 transition hover:border-white/30 hover:text-white"
                >
                  <RotateCcw size={12} className="mr-1 inline" />
                  Сбросить
                </button>
              </div>

              {summary && summary.total > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-indigo-100/70">
                    <span>Прогресс прохождения</span>
                    <span className="font-semibold text-indigo-200">{completionPercent}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full" style={{ backgroundColor: `${primaryColor}1A` }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${completionPercent}%`,
                        backgroundColor: primaryColor
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] uppercase tracking-[0.2em] text-indigo-200/60">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-green-300" />
                      <span>{summary.completed}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <PlayCircle size={12} className="text-blue-300" />
                      <span>{summary.available}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield size={12} className="text-slate-300" />
                      <span>{summary.locked}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Hourglass size={12} className="text-amber-300" />
                      <span>{summary.pending}</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={playNextMission}
                disabled={!summary || summary.available === 0}
                className={clsx(
                  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition",
                  summary && summary.available > 0
                    ? "bg-white/20 text-white hover:bg-white/30"
                    : "bg-white/5 text-indigo-100/50 cursor-not-allowed"
                )}
              >
                <ArrowRightCircle size={16} />
                Следующая доступная миссия
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-[0.3em] text-indigo-200/60">Миссии кадета</h4>
              {state?.missions.map((testMission) => (
                <div
                  key={testMission.id}
                  className={clsx(
                    "rounded-xl border p-4 transition-all",
                    getStatusColor(testMission.status)
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getMissionIcon(testMission.status)}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {testMission.mission.name}
                        </p>
                        <p className="text-xs opacity-70 mt-1">
                          {testMission.mission.experienceReward} XP • {testMission.mission.manaReward} мана
                        </p>
                      </div>
                    </div>
                    {testMission.status === "AVAILABLE" && (
                      <div className="ml-2 flex gap-1">
                        <button
                          onClick={() => quickTestMission(testMission.mission.id)}
                          className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white transition hover:bg-white/20"
                        >
                          Пройти
                        </button>
                        <button
                          onClick={() => openFullTestMode(testMission)}
                          className="rounded-lg px-2 py-1 text-xs transition"
                          style={{ 
                            backgroundColor: `${primaryColor}33`,
                            color: primaryColor
                          }}
                          title="Полный тест с интерфейсом"
                        >
                          <Eye size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {testMission.mission.description && (
                    <p className="mt-2 text-xs opacity-80 leading-relaxed">
                      {testMission.mission.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}
      </div>

      {isActive && (
        <div className="border-t border-white/10 p-6">
          <div className="rounded-xl bg-black/20 p-4 text-xs text-indigo-100/70">
            <div className="mb-2 flex items-center gap-2 text-white">
              <Lightbulb size={14} className="text-amber-300" />
              <p className="font-medium">Как тестировать</p>
            </div>
            <ul className="space-y-1 text-indigo-100/60">
              <li>Доступные миссии отмечены кнопкой «Пройти»</li>
              <li>Миссии со связями откроются автоматически после зависимостей</li>
              <li>Кнопка «Следующая миссия» завершает ближайший доступный шаг</li>
            </ul>
          </div>
        </div>
      )}

      {/* Full Test Mode Modal */}
      {selectedMission && (
        <MissionModal
          userMission={{
            id: selectedMission.id,
            status: selectedMission.status,
            mission: {
              ...selectedMission.mission,
              competencies: selectedMission.mission.competencies.map(comp => ({
                points: comp.points,
                competency: {
                  name: comp.competency?.name || 'Unknown'
                }
              }))
            }
          }}
          onSubmit={handleMissionSubmit}
          onClose={() => setSelectedMission(null)}
        />
      )}
    </div>
  );
}
