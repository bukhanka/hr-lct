"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CheckCircle, Clock, Calendar, Award } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { CadetNavigation } from "./CadetNavigation";

interface UserMission {
  id: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
  mission: {
    id: string;
    name: string;
    description?: string;
    missionType: string;
    experienceReward: number;
    manaReward: number;
  };
}

export function CadetHistory() {
  const { data: session } = useSession();
  const { theme, getThemeText, getMotivationText, getGradientColors } = useTheme();
  const gradients = getGradientColors();
  const primary = theme.palette?.primary || "#8B5CF6";
  const secondary = theme.palette?.secondary || "#38BDF8";

  const [missions, setMissions] = useState<UserMission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      if (!(session as any)?.user?.id) return;

      try {
        const response = await fetch(`/api/users/${(session as any)?.user?.id}/missions`);
        
        if (response.ok) {
          const data = await response.json();
          // Filter completed missions
          const completedMissions = data.filter((m: UserMission) => m.status === "COMPLETED");
          // Sort by completion date (newest first)
          completedMissions.sort((a: UserMission, b: UserMission) => {
            const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
            const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
            return dateB - dateA;
          });
          setMissions(completedMissions);
        }
      } catch (error) {
        console.error("Failed to load history:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadHistory();
  }, [session]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto mb-4" />
          <p className="text-indigo-100/70 text-lg">Загрузка истории...</p>
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
      <CadetNavigation />

      <div className="relative z-10 mx-auto max-w-5xl space-y-8 px-6 py-12 text-white md:px-12 lg:px-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{getThemeText('history')}</h1>
          <p className="text-xl opacity-70">
            {missions.length} {getThemeText('missions').toLowerCase()} выполнено
          </p>
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          {missions.map((userMission, index) => (
            <div 
              key={userMission.id}
              className="flex gap-6"
            >
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div 
                  className="w-12 h-12 rounded-full border-4 flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: `${primary}20`,
                    borderColor: primary
                  }}
                >
                  <CheckCircle className="w-6 h-6" style={{ color: primary }} />
                </div>
                {index < missions.length - 1 && (
                  <div 
                    className="w-0.5 flex-1 min-h-12 mt-2"
                    style={{ backgroundColor: `${primary}40` }}
                  />
                )}
              </div>

              {/* Mission Card */}
              <div 
                className="flex-1 rounded-[24px] p-6 mb-6"
                style={{
                  background: `linear-gradient(to bottom right, ${primary}10, ${secondary}10)`,
                  border: `1px solid ${primary}30`
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{userMission.mission.name}</h3>
                    {userMission.mission.description && (
                      <p className="text-sm opacity-70">{userMission.mission.description}</p>
                    )}
                  </div>
                  <div 
                    className="px-3 py-1.5 rounded-full"
                    style={{
                      backgroundColor: `${secondary}20`,
                      border: `1px solid ${secondary}40`,
                      color: secondary
                    }}
                  >
                    {userMission.mission.missionType}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 opacity-70">
                    <Calendar className="w-4 h-4" />
                    {userMission.completedAt ? new Date(userMission.completedAt).toLocaleDateString() : "Не завершено"}
                  </div>
                  <div className="flex items-center gap-2" style={{ color: primary }}>
                    <Award className="w-4 h-4" />
                    {userMission.mission.experienceReward} {getMotivationText('xp')}
                  </div>
                  <div className="flex items-center gap-2" style={{ color: secondary }}>
                    <Award className="w-4 h-4" />
                    {userMission.mission.manaReward} {getMotivationText('mana')}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {missions.length === 0 && (
            <div className="text-center py-16">
              <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color: primary }} />
              <p className="text-xl opacity-70">Пока нет завершённых {getThemeText('missions').toLowerCase()}</p>
              <p className="text-sm opacity-50 mt-2">Начните выполнять задания, чтобы увидеть их здесь</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

