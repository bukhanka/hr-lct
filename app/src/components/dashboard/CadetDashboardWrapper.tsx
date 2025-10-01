"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CadetOverview } from "./CadetOverview";
import type { CampaignThemeConfig } from "@/types/campaignTheme";

export function CadetDashboardWrapper() {
  const { data: session } = useSession();
  const [campaignTheme, setCampaignTheme] = useState<CampaignThemeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCampaignTheme() {
      console.log("[CadetDashboardWrapper] 🎨 Starting theme load...");
      
      if (!(session as any)?.user?.id) {
        console.log("[CadetDashboardWrapper] ❌ No user id in session:", session);
        setIsLoading(false);
        return;
      }

      const userId = (session as any)?.user?.id;
      console.log("[CadetDashboardWrapper] 👤 Loading theme for user:", userId);

      try {
        // Fetch user missions to get campaign theme
        const apiUrl = `/api/users/${userId}/missions`;
        console.log("[CadetDashboardWrapper] 🌐 Fetching missions from:", apiUrl);
        
        const response = await fetch(apiUrl);
        console.log("[CadetDashboardWrapper] 📡 Response status:", response.status, response.statusText);
        
        if (response.ok) {
          const missions = await response.json();
          console.log("[CadetDashboardWrapper] 📦 Missions received:", missions.length, "missions");
          console.log("[CadetDashboardWrapper] 🔍 First mission structure:", missions[0]);
          
          // Get theme from the first mission's campaign
          if (missions.length > 0) {
            const firstMission = missions[0];
            console.log("[CadetDashboardWrapper] 🎯 First mission object:", {
              hasMission: !!firstMission.mission,
              hasCampaign: !!firstMission.mission?.campaign,
              hasThemeConfig: !!firstMission.mission?.campaign?.themeConfig,
              campaignId: firstMission.mission?.campaign?.id,
              campaignName: firstMission.mission?.campaign?.name
            });
            
            if (firstMission.mission?.campaign?.themeConfig) {
              const theme = firstMission.mission.campaign.themeConfig;
              console.log("[CadetDashboardWrapper] ✅ Theme config found:", theme);
              console.log("[CadetDashboardWrapper] 🎨 Theme details:", {
                themeId: theme.themeId,
                funnelType: theme.funnelType,
                gamificationLevel: theme.gamificationLevel,
                hasAssets: !!theme.assets,
                assets: theme.assets,
                hasPalette: !!theme.palette,
                palette: theme.palette,
                motivationOverrides: theme.motivationOverrides
              });
              setCampaignTheme(theme);
            } else {
              console.warn("[CadetDashboardWrapper] ⚠️ No themeConfig in campaign, using default theme");
              console.log("[CadetDashboardWrapper] 📋 Campaign object:", firstMission.mission?.campaign);
            }
          } else {
            console.warn("[CadetDashboardWrapper] ⚠️ No missions found for user");
          }
        } else {
          console.error("[CadetDashboardWrapper] ❌ Failed to fetch missions:", response.status, response.statusText);
        }
      } catch (error) {
        console.error("[CadetDashboardWrapper] 💥 Exception loading campaign theme:", error);
      } finally {
        console.log("[CadetDashboardWrapper] 🏁 Theme loading finished. Theme set:", campaignTheme);
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

  console.log("[CadetDashboardWrapper] 🎭 Rendering with theme:", campaignTheme);
  
  return (
    <ThemeProvider theme={campaignTheme}>
      <CadetOverview />
    </ThemeProvider>
  );
}
