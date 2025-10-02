"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CadetMissions } from "./CadetMissions";
import type { CampaignThemeConfig } from "@/types/campaignTheme";

export function CadetMissionsWrapper() {
  const { data: session } = useSession();
  const [campaignTheme, setCampaignTheme] = useState<CampaignThemeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCampaignTheme() {
      if (!(session as any)?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/users/${(session as any)?.user?.id}/missions`);
        
        if (response.ok) {
          const missions = await response.json();
          if (missions.length > 0 && missions[0].mission?.campaign?.themeConfig) {
            setCampaignTheme(missions[0].mission.campaign.themeConfig);
          }
        }
      } catch (error) {
        console.error("[CadetMissionsWrapper] Failed to load theme:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadCampaignTheme();
  }, [session]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto mb-4" />
          <p className="text-indigo-100/70">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider theme={campaignTheme}>
      <CadetMissions />
    </ThemeProvider>
  );
}

