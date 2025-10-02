"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CadetGalacticMap } from "./CadetGalacticMap";
import { MissionModal } from "./MissionModal";
import { CadetNavigation } from "./CadetNavigation";
import { useTestMode } from "@/components/constructor/TestModeProvider";
import { useTheme } from "@/contexts/ThemeContext";
import { Section } from "./widgets";

interface UserMission {
  id: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
  submission?: any;
  mission: {
    id: string;
    name: string;
    description?: string;
    missionType: string;
    experienceReward: number;
    manaReward: number;
    positionX: number;
    positionY: number;
    confirmationType: string;
    payload?: any;
    competencies: Array<{
      points: number;
      competency: {
        name: string;
      };
    }>;
    dependenciesFrom: Array<{ sourceMissionId: string; targetMissionId: string }>;
    dependenciesTo: Array<{ sourceMissionId: string; targetMissionId: string }>;
  };
}

export function CadetMissions() {
  const { data: session } = useSession();
  const { getThemeText, theme, getGradientColors } = useTheme();
  const gradients = getGradientColors();
  
  const testModeContext = useTestMode();
  const [userMissions, setUserMissions] = useState<UserMission[]>([]);
  const [selectedMission, setSelectedMission] = useState<UserMission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (testModeContext) {
      console.log("[CadetMissions] Using test mode data");
      setUserMissions(testModeContext.userMissions);
      setIsLoading(false);
    } else if ((session as any)?.user?.id) {
      loadUserMissions();
    }
  }, [session, testModeContext]);

  const loadUserMissions = async () => {
    if (!(session as any)?.user?.id) return;

    try {
      const response = await fetch(`/api/users/${(session as any)?.user?.id}/missions`);
      
      if (response.ok) {
        const missions = await response.json();
        setUserMissions(missions);
      }
    } catch (error) {
      console.error("Failed to load missions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMissionSubmit = async (missionId: string, submission: any) => {
    try {
      if (testModeContext) {
        await testModeContext.handleMissionSubmit(missionId, submission);
      } else {
        const response = await fetch(`/api/missions/${missionId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submission }),
        });

        if (response.ok) {
          await loadUserMissions();
        }
      }
      
      setSelectedMission(null);
    } catch (error) {
      console.error("Failed to submit mission:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514]">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto mb-4" />
          <p className="text-indigo-100/70 text-lg">Загрузка миссий...</p>
        </div>
      </div>
    );
  }

  return (
    <main 
      className="min-h-screen relative"
      style={{
        background: `linear-gradient(to bottom right, ${gradients.from}, ${gradients.via}, ${gradients.to})`
      }}
    >
      {/* Background image overlay */}
      {theme.assets?.background && (
        <div 
          className="fixed inset-0 opacity-20 bg-cover bg-center pointer-events-none z-0"
          style={{ 
            backgroundImage: `url(${theme.assets.background})`,
          }}
        />
      )}
      
      {/* Navigation */}
      <CadetNavigation />
      
      <div className="relative z-10 mx-auto max-w-7xl space-y-8 px-4 sm:px-6 py-8 sm:py-12 text-white md:px-12 lg:px-16">
        {/* Header */}
        <header className="flex flex-col gap-4">
          <div>
            <p 
              className="text-xs uppercase tracking-[0.4em] mb-2"
              style={{ color: `${theme.palette?.primary || "#818CF8"}99` }}
            >
              {getThemeText('missionsHeader') || 'ГАЛАКТИЧЕСКАЯ КАРТА ПРОГРЕССА'}
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              {getThemeText('mapTitle') || 'Ваши миссии'}
            </h1>
            <p className="text-sm sm:text-base text-indigo-200/70 mt-2">
              Выполняйте миссии, прокачивайте компетенции и двигайтесь к своей цели
            </p>
          </div>
        </header>

        {/* Galactic Map */}
        <Section>
          <CadetGalacticMap 
            userMissions={userMissions} 
            onMissionSelect={setSelectedMission}
          />
        </Section>
      </div>

      {/* Mission Modal */}
      {selectedMission && (
        <MissionModal
          userMission={selectedMission}
          onSubmit={handleMissionSubmit}
          onClose={() => setSelectedMission(null)}
        />
      )}
    </main>
  );
}

