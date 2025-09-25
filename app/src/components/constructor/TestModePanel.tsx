"use client";

import React, { useState, useMemo } from "react";
import { X, Play, RotateCcw, CheckCircle, Lock, Clock, Zap, ArrowRightCircle } from "lucide-react";
import clsx from "clsx";
import type { TestModeState, TestModeSummary, TestModeMission } from "@/types/testMode";

type TestMissionStatus = TestModeMission["status"];

interface TestModePanelProps {
  campaignId: string;
  onClose: () => void;
  onStateChange: (state: TestModeState | null) => void;
  state: TestModeState | null;
}

export function TestModePanel({ campaignId, onClose, onStateChange, state }: TestModePanelProps) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isActive = !!state;

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
    <div className="flex h-full w-full max-w-[400px] flex-col border-l border-white/10 bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514] shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Режим тестирования</h2>
          <p className="mt-1 text-xs uppercase tracking-[0.25em] text-indigo-200/60">
            Проверьте воронку глазами кадета
          </p>
        </div>
        <button 
          onClick={onClose} 
          className="rounded-xl border border-white/10 p-2 text-indigo-200 transition hover:border-white/30 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!isActive ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/20">
                <Play size={20} className="text-indigo-300" />
              </div>
              <h3 className="text-sm font-medium text-white">Протестируйте воронку</h3>
              <p className="mt-2 text-xs text-indigo-100/70">
                Инициализируйте тестовый режим, чтобы пройти кампанию от лица кадета
              </p>
              <button
                onClick={initializeTestMode}
                disabled={isInitializing}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-500/90 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
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
            <div className="flex flex-col gap-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/30">
                    <Zap size={14} className="text-indigo-300" />
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
                  <div className="h-2 w-full rounded-full bg-indigo-900/40">
                    <div
                      className="h-full rounded-full bg-indigo-400 transition-all"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-indigo-200/60">
                    <span>✅ {summary.completed}</span>
                    <span>▶️ {summary.available}</span>
                    <span>🔒 {summary.locked}</span>
                    <span>⏳ {summary.pending}</span>
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
                      <button
                        onClick={() => quickTestMission(testMission.mission.id)}
                        className="ml-2 rounded-lg bg-white/10 px-2 py-1 text-xs text-white transition hover:bg-white/20"
                      >
                        Пройти
                      </button>
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
            <p className="font-medium text-white mb-2">💡 Как тестировать:</p>
            <ul className="space-y-1 text-indigo-100/60">
              <li>• Доступные миссии можно "пройти" кнопкой</li>
              <li>• Заблокированные откроются после выполнения зависимостей</li>
              <li>• Кнопка "Следующая миссия" выполняет ближайшую доступную миссию</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
