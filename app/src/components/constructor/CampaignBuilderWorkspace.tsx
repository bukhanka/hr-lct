"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { MissionFlowEditor } from "./MissionFlowEditor";
import { ThemeProvider } from "@/contexts/ThemeContext";
import type { CampaignThemeConfig } from "@/types/campaignTheme";

interface MissionDependency {
  sourceMissionId: string;
  targetMissionId: string;
}

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
  dependenciesFrom: MissionDependency[];
}

interface Campaign {
  id: string;
  name: string;
  description?: string;
  theme?: string;
  themeConfig?: CampaignThemeConfig | null;
  missions: Mission[];
}

interface CampaignBuilderWorkspaceProps {
  campaignId: string;
}

export function CampaignBuilderWorkspace({ campaignId }: CampaignBuilderWorkspaceProps) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCampaign = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      if (!response.ok) {
        throw new Error(`Не удалось загрузить кампанию (${response.status})`);
      }
      const data = await response.json();
      setCampaign(data);
    } catch (err) {
      console.error("[CampaignBuilderWorkspace] loadCampaign", err);
      setError(err instanceof Error ? err.message : "Неизвестная ошибка загрузки");
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  const reloadCampaign = useCallback(async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      if (!response.ok) {
        throw new Error(`Не удалось обновить кампанию (${response.status})`);
      }
      const data = await response.json();
      setCampaign(data);
    } catch (err) {
      console.error("[CampaignBuilderWorkspace] reloadCampaign", err);
      setError(err instanceof Error ? err.message : "Неизвестная ошибка обновления");
    } finally {
    }
  }, [campaignId]);

  const dependencies = useMemo(
    () =>
      campaign?.missions?.flatMap((mission) =>
        mission.dependenciesFrom?.map((dep) => ({
          sourceMissionId: dep.sourceMissionId,
          targetMissionId: dep.targetMissionId,
        })) || []
      ) || [],
    [campaign?.missions]
  );

  const handleMissionUpdate = useCallback(
    async (mission: Mission) => {
      try {
        const response = await fetch(`/api/missions/${mission.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(mission),
        });
        if (!response.ok) {
          throw new Error("Не удалось обновить миссию");
        }
        await reloadCampaign();
      } catch (err) {
        console.error("[CampaignBuilderWorkspace] handleMissionUpdate", err);
        setError(err instanceof Error ? err.message : "Ошибка обновления миссии");
      }
    },
    [reloadCampaign]
  );

  const handleMissionCreate = useCallback(
    async (missionData: Partial<Mission>): Promise<Mission | null> => {
      try {
        const response = await fetch("/api/missions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...missionData, campaignId }),
        });
        if (!response.ok) {
          throw new Error("Не удалось создать миссию");
        }
        const created = await response.json();
        await reloadCampaign();
        return created;
      } catch (err) {
        console.error("[CampaignBuilderWorkspace] handleMissionCreate", err);
        setError(err instanceof Error ? err.message : "Ошибка создания миссии");
        return null;
      }
    },
    [campaignId, reloadCampaign]
  );

  const handleMissionDelete = useCallback(
    async (missionId: string) => {
      try {
        const response = await fetch(`/api/missions/${missionId}`, { method: "DELETE" });
        if (!response.ok) {
          throw new Error("Не удалось удалить миссию");
        }
        await reloadCampaign();
      } catch (err) {
        console.error("[CampaignBuilderWorkspace] handleMissionDelete", err);
        setError(err instanceof Error ? err.message : "Ошибка удаления миссии");
      }
    },
    [reloadCampaign]
  );

  const handleDependencyCreate = useCallback(
    async (source: string, target: string) => {
      try {
        const response = await fetch("/api/missions/dependencies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceMissionId: source, targetMissionId: target }),
        });
        if (!response.ok) {
          throw new Error("Не удалось создать связь");
        }
        await reloadCampaign();
      } catch (err) {
        console.error("[CampaignBuilderWorkspace] handleDependencyCreate", err);
        setError(err instanceof Error ? err.message : "Ошибка создания связи");
      }
    },
    [reloadCampaign]
  );

  const handleDependencyDelete = useCallback(
    async (source: string, target: string) => {
      try {
        const response = await fetch(`/api/missions/dependencies?sourceMissionId=${source}&targetMissionId=${target}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Не удалось удалить связь");
        }
        await reloadCampaign();
      } catch (err) {
        console.error("[CampaignBuilderWorkspace] handleDependencyDelete", err);
        setError(err instanceof Error ? err.message : "Ошибка удаления связи");
      }
    },
    [reloadCampaign]
  );

  const handleTestCampaign = () => {
    router.push(`/dashboard/architect/campaigns/${campaignId}/test`);
  };

  const handleThemeChange = async (themeConfig: CampaignThemeConfig) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: campaign?.name,
          description: campaign?.description,
          theme: campaign?.theme,
          themeConfig,
        }),
      });
      
      if (response.ok) {
        await reloadCampaign();
      }
    } catch (err) {
      console.error("[CampaignBuilderWorkspace] handleThemeChange", err);
      setError(err instanceof Error ? err.message : "Ошибка сохранения темы");
    }
  };

  const totalMissions = campaign?.missions?.length || 0;
  const totalExperience = campaign?.missions?.reduce((acc, mission) => acc + (mission.experienceReward || 0), 0) || 0;

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-[#03020f] via-[#0b0926] to-[#050414] text-white overflow-hidden">

      {error && (
        <div className="mx-auto mt-4 flex max-w-6xl items-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}


      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {isLoading || !campaign ? (
          <div className="flex flex-1 items-center justify-center rounded-none border-none bg-white/5">
            <div className="flex flex-col items-center gap-3 text-indigo-200/80">
              <Loader2 size={28} className="animate-spin" />
              <span className="text-sm">Загружаем кампанию...</span>
            </div>
          </div>
        ) : (
          <ThemeProvider theme={campaign?.themeConfig}>
            <MissionFlowEditor
              campaignId={campaign.id}
              missions={campaign.missions || []}
              dependencies={dependencies}
              onMissionUpdate={handleMissionUpdate}
              onMissionCreate={handleMissionCreate}
              onMissionDelete={handleMissionDelete}
              onDependencyCreate={handleDependencyCreate}
              onDependencyDelete={handleDependencyDelete}
              onReloadCampaign={reloadCampaign}
              onNavigateToDashboard={() => router.push('/dashboard/architect')}
              campaignInfo={{
                name: campaign?.name || '',
                totalMissions,
                totalExperience
              }}
              campaignTheme={campaign?.themeConfig}
              onThemeChange={handleThemeChange}
              fullBleed
            />
          </ThemeProvider>
        )}
      </main>
    </div>
  );
}
