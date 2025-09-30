"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import type { TestModeState, TestModeMission } from "@/types/testMode";
import type { CampaignThemeConfig } from "@/types/campaignTheme";

interface TestModeContextValue {
  isTestMode: boolean;
  testUserId: string;
  testState: TestModeState | null;
  userMissions: any[];
  user: any;
  onStateChange: (state: TestModeState | null) => void;
  handleMissionSubmit: (missionId: string, submission: any) => Promise<void>;
  handleQuickTest: (missionId: string) => Promise<void>;
}

const TestModeContext = createContext<TestModeContextValue | null>(null);

interface TestModeProviderProps {
  children: React.ReactNode;
  testState: TestModeState | null;
  onStateChange: (state: TestModeState | null) => void;
  campaignId: string;
}

export function TestModeProvider({ children, testState, onStateChange, campaignId }: TestModeProviderProps) {
  const testUserId = "u-architect-1"; // Fixed test user ID
  const [campaignTheme, setCampaignTheme] = useState<CampaignThemeConfig | null>(null);

  // Fetch campaign theme
  useEffect(() => {
    async function loadCampaignTheme() {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}`);
        if (response.ok) {
          const campaign = await response.json();
          if (campaign.themeConfig) {
            setCampaignTheme(campaign.themeConfig);
          }
        }
      } catch (error) {
        console.error("[TestModeProvider] Failed to load campaign theme:", error);
      }
    }
    
    if (campaignId) {
      loadCampaignTheme();
    }
  }, [campaignId]);

  // Convert test missions to user missions format
  const userMissions = testState?.missions.map((testMission: TestModeMission) => ({
    id: testMission.id,
    status: testMission.status,
    startedAt: null,
    completedAt: testMission.status === "COMPLETED" ? new Date().toISOString() : null,
    submission: null,
    mission: {
      id: testMission.mission.id,
      name: testMission.mission.name,
      description: testMission.mission.description,
      missionType: testMission.mission.missionType,
      experienceReward: testMission.mission.experienceReward,
      manaReward: testMission.mission.manaReward,
      positionX: testMission.mission.positionX || 0,
      positionY: testMission.mission.positionY || 0,
      competencies: testMission.mission.competencies?.map(comp => ({
        points: comp.points,
        competency: {
          name: comp.competency.name,
        },
      })) || [],
      dependenciesFrom: testMission.mission.dependenciesFrom || [],
      dependenciesTo: testMission.mission.dependenciesTo || [],
    },
  })) || [];

  // Mock user data for test mode
  const user = {
    id: testUserId,
    displayName: "Тестовый Кадет",
    experience: calculateTotalExperience(userMissions),
    mana: calculateTotalMana(userMissions),
    currentRank: calculateRank(calculateTotalExperience(userMissions)),
    competencies: calculateCompetencies(userMissions),
  };

  const refreshTestState = async () => {
    console.log("[TestModeProvider] Refreshing test state...");
    const testResponse = await fetch(`/api/campaigns/${campaignId}/test-mode`, {
      method: "POST",
    });
    
    if (testResponse.ok) {
      const data = await testResponse.json();
      onStateChange(data.state);
    } else {
      console.error("Failed to refresh test state");
      throw new Error("Failed to refresh test state");
    }
  };

  const handleMissionSubmit = async (missionId: string, submission: any) => {
    try {
      console.log("[TestModeProvider] Submitting mission:", { missionId, submission });
      const response = await fetch(`/api/missions/${missionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit mission");
      }

      // Refresh test state to get updated missions and progress
      await refreshTestState();
    } catch (error) {
      console.error("Failed to submit mission in test mode:", error);
      throw error;
    }
  };

  const handleQuickTest = async (missionId: string) => {
    try {
      console.log("[TestModeProvider] Quick testing mission:", missionId);
      const response = await fetch(`/api/missions/${missionId}/quick-test`, {
        method: "POST",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to test mission");
      }
      
      // Refresh test state to get updated missions and progress
      await refreshTestState();
    } catch (error) {
      console.error("Failed to quick test mission:", error);
      throw error;
    }
  };

  const contextValue: TestModeContextValue = {
    isTestMode: true,
    testUserId,
    testState,
    userMissions,
    user,
    onStateChange,
    handleMissionSubmit,
    handleQuickTest,
  };

  return (
    <ThemeProvider theme={campaignTheme}>
      <TestModeContext.Provider value={contextValue}>
        {children}
      </TestModeContext.Provider>
    </ThemeProvider>
  );
}

export function useTestMode() {
  const context = useContext(TestModeContext);
  // Don't throw error, just return null if not in test mode
  return context;
}

// Utility functions to calculate test user stats
function calculateTotalExperience(userMissions: any[]): number {
  return userMissions
    .filter(um => um.status === "COMPLETED")
    .reduce((total, um) => total + um.mission.experienceReward, 0);
}

function calculateTotalMana(userMissions: any[]): number {
  const earnedMana = userMissions
    .filter(um => um.status === "COMPLETED")
    .reduce((total, um) => total + um.mission.manaReward, 0);
  
  // Start with base mana
  return 100 + earnedMana;
}

function calculateRank(experience: number): number {
  // Simple rank calculation: 100 XP per rank
  return Math.floor(experience / 100) + 1;
}

function calculateCompetencies(userMissions: any[]): Array<{points: number; competency: {name: string}}> {
  const competencyMap = new Map<string, number>();
  
  userMissions
    .filter(um => um.status === "COMPLETED")
    .forEach(um => {
      um.mission.competencies?.forEach((comp: any) => {
        const current = competencyMap.get(comp.competency.name) || 0;
        competencyMap.set(comp.competency.name, current + comp.points);
      });
    });
  
  return Array.from(competencyMap.entries()).map(([name, points]) => ({
    points,
    competency: { name },
  }));
}
