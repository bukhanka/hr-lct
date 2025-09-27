"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Eye, RotateCcw, Loader2, AlertCircle } from "lucide-react";
import { CadetOverview } from "@/components/dashboard/CadetOverview";
import { TestModeProvider } from "@/components/constructor/TestModeProvider";
import type { TestModeState } from "@/types/testMode";

export default function CampaignTestPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params?.campaignId as string;
  const [testState, setTestState] = useState<TestModeState | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeTestMode();
  }, [campaignId]);

  const initializeTestMode = async () => {
    setIsInitializing(true);
    setError(null);
    try {
      console.log("[CampaignTestPage] Initializing test mode for campaign:", campaignId);
      const response = await fetch(`/api/campaigns/${campaignId}/test-mode`, {
        method: "POST",
      });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `Server error (${response.status})` };
        }
        throw new Error(errorData.error || "Failed to initialize test mode");
      }
      
      const data = await response.json();
      console.log("[CampaignTestPage] Test mode initialized:", data);
      setTestState(data.state);
    } catch (err) {
      console.error("[CampaignTestPage] Error initializing test mode:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsInitializing(false);
    }
  };

  const resetTestMode = async () => {
    try {
      await fetch(`/api/campaigns/${campaignId}/test-mode`, {
        method: "DELETE",
      });
      await initializeTestMode();
    } catch (err) {
      console.error("[CampaignTestPage] Error resetting test mode:", err);
      setError(err instanceof Error ? err.message : "Failed to reset test mode");
    }
  };

  const handleBackToBuilder = () => {
    router.push(`/dashboard/architect/campaigns/${campaignId}/builder`);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#03020f] via-[#0b0926] to-[#050414] text-white">
        <div className="flex h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-indigo-200/80">
            <Loader2 size={32} className="animate-spin" />
            <h2 className="text-lg font-semibold">Инициализируем режим тестирования...</h2>
            <p className="text-sm text-indigo-200/60">Загружаем интерфейс кадета</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#03020f] via-[#0b0926] to-[#050414] text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={handleBackToBuilder}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-indigo-200 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={16} />
              Вернуться к конструктору
            </button>
          </div>

          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex items-center gap-3 mb-4 text-red-400">
              <AlertCircle size={24} />
              <h2 className="text-xl font-semibold">Ошибка инициализации</h2>
            </div>
            <p className="text-indigo-200/70 text-center mb-6 max-w-md">
              {error}
            </p>
            <button
              onClick={initializeTestMode}
              className="px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#03020f] via-[#0b0926] to-[#050414]">
      {/* Test Mode Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToBuilder}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-indigo-200 hover:bg-white/10 transition-colors text-sm"
              >
                <ArrowLeft size={14} />
                К конструктору
              </button>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20">
                  <Eye size={16} className="text-indigo-300" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-white">Режим тестирования кампании</h1>
                  <p className="text-xs text-indigo-200/60">Интерфейс глазами кадета</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30">
                <span className="text-xs font-medium text-indigo-200">
                  {testState?.summary.completed || 0} из {testState?.summary.total || 0} выполнено
                </span>
              </div>
              <button
                onClick={resetTestMode}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-indigo-200 hover:bg-white/10 transition-colors text-sm"
              >
                <RotateCcw size={14} />
                Сбросить
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Test Mode Content */}
      <div className="container mx-auto px-6 py-8">
        <TestModeProvider testState={testState} onStateChange={setTestState} campaignId={campaignId}>
          <CadetOverview />
        </TestModeProvider>
      </div>
    </div>
  );
}

