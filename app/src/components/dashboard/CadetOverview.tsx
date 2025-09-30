"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ShoppingCart, Palette } from "lucide-react";
import { MetricCard, Section, Table } from "./widgets";
import { CadetGalacticMap } from "./CadetGalacticMap";
import { MissionModal } from "./MissionModal";
import { RankProgressCard } from "./RankProgressCard";
import { StoreModal } from "./StoreModal";
import { NotificationToast } from "./NotificationToast";
import { useTestMode } from "@/components/constructor/TestModeProvider";
import { useTheme } from "@/contexts/ThemeContext";

interface User {
  id: string;
  displayName?: string;
  experience: number;
  mana: number;
  currentRank: number;
  competencies: Array<{
    points: number;
    competency: {
      name: string;
    };
  }>;
}

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

export function CadetOverview() {
  const { data: session } = useSession();
  const { getMotivationText, theme } = useTheme();
  
  // Try to get test mode context (will be null if not in test mode)
  const testModeContext = useTestMode();

  const [userMissions, setUserMissions] = useState<UserMission[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selectedMission, setSelectedMission] = useState<UserMission | null>(null);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (testModeContext) {
      // Use test mode data
      console.log("[CadetOverview] Using test mode data");
      setUserMissions(testModeContext.userMissions);
      setUser(testModeContext.user);
      setIsLoading(false);
    } else if ((session as any)?.user?.id) {
      console.log("[CadetOverview] useEffect triggered with session", session.user);
      loadUserData();
    } else {
      console.log("[CadetOverview] useEffect: session missing user id", session);
    }
  }, [session, testModeContext]);

  useEffect(() => {
    console.log("[CadetOverview] render snapshot", {
      hasSessionId: Boolean((session as any)?.user?.id),
      isLoading,
      missionsCount: userMissions.length,
      selectedMissionId: selectedMission?.id,
    });
  });

  const loadUserData = async () => {
    if (!(session as any)?.user?.id) return;

    try {
    console.log("[CadetOverview] loadUserData start", { userId: (session as any)?.user?.id });
      // Load user missions
      const missionsResponse = await fetch(`/api/users/${(session as any)?.user?.id}/missions`);
    console.log("[CadetOverview] missionsResponse", missionsResponse.status, missionsResponse.statusText);
      if (missionsResponse.ok) {
        const missions = await missionsResponse.json();
      console.log("[CadetOverview] missions payload", missions);
        setUserMissions(missions);
    } else {
      console.warn("[CadetOverview] missionsResponse not ok", missionsResponse);
      }

      // Mock user data (will be replaced with real API later)
      console.log("[CadetOverview] applying mock user fallback");
      setUser({
        id: (session as any)?.user?.id,
        displayName: (session as any)?.user?.name || "Кадет А. Вектор",
        experience: 420,
        mana: 210,
        currentRank: 3,
        competencies: [
          { points: 3, competency: { name: "Аналитика" } },
          { points: 2, competency: { name: "Лидерство" } },
          { points: 4, competency: { name: "Командная работа" } }
        ]
      });
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
    console.log("[CadetOverview] loadUserData finished");
      setIsLoading(false);
    }
  };

  const handleMissionSubmit = async (missionId: string, submission: any) => {
    try {
      console.log("[CadetOverview] handleMissionSubmit", { missionId, submission });
      
      if (testModeContext) {
        // Use test mode submission handler
        await testModeContext.handleMissionSubmit(missionId, submission);
        // The TestModeProvider will automatically update its state,
        // and the useEffect will pick up the changes
      } else {
        // Normal submission for real users
        const response = await fetch(`/api/missions/${missionId}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submission }),
        });

        console.log("[CadetOverview] mission submit response", response.status, response.statusText);
        if (response.ok) {
          // Reload user missions
          await loadUserData();
        } else {
          console.warn("[CadetOverview] mission submit failed", await response.text());
        }
      }
      
      setSelectedMission(null);
    } catch (error) {
      console.error("Failed to submit mission:", error);
    }
  };

  const handlePurchaseSuccess = (newManaBalance: number) => {
    // Update user mana balance
    if (user) {
      setUser({ ...user, mana: newManaBalance });
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      LOCKED: "Заблокировано",
      AVAILABLE: "Доступно", 
      IN_PROGRESS: "В процессе",
      PENDING_REVIEW: "На проверке",
      COMPLETED: "Выполнено"
    };
    return labels[status as keyof typeof labels] || status;
  };

  const activeMissions = userMissions.filter(um => 
    ["AVAILABLE", "IN_PROGRESS", "PENDING_REVIEW"].includes(um.status)
  ).slice(0, 5);

  const completedMissions = userMissions.filter(um => um.status === "COMPLETED").length;
  const totalMissions = userMissions.length;
  const nextRankExp = user ? (user.currentRank * 100) : 500;
  const expToNext = nextRankExp - (user?.experience || 0);

  const topCompetencies = user?.competencies
    ?.sort((a, b) => b.points - a.points)
    ?.slice(0, 3)
    ?.map(comp => `${comp.competency.name} ${comp.points}`)
    ?.join(" · ") || "Загрузка...";

  if (isLoading) {
    return <div className="text-center text-indigo-200">Загрузка...</div>;
  }

  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.4em] text-indigo-200/70">
            Бортовой журнал кадета
          </p>
          {/* Theme indicator */}
          <div className="group relative">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-indigo-200/70">
              <Palette size={12} />
              <span>Themed by HR</span>
            </div>
            <div className="invisible absolute right-0 top-8 z-50 w-64 rounded-lg border border-white/20 bg-[#0b0924] p-3 text-xs leading-relaxed text-indigo-100/90 shadow-xl opacity-0 transition-all group-hover:visible group-hover:opacity-100">
              Этот опыт кастомизирован HR-архитектором: тема "{theme.themeId}", уровень геймификации "{theme.gamificationLevel}".
              <div className="absolute -top-1 right-6 h-2 w-2 rotate-45 border-l border-t border-white/20 bg-[#0b0924]" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-white">
            {user?.displayName || "Кадет"} · {getMotivationText('rank')}: {user?.currentRank || 1}
          </h1>
          
          <button
            onClick={() => setIsStoreOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-purple-200 hover:bg-purple-500/30 transition-all duration-200"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="font-medium">Магазин</span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-semibold">
              {user?.mana || 0}
            </span>
          </button>
        </div>
      </header>

      {/* Rank Progress - Main Feature */}
      <RankProgressCard userId={testModeContext?.testUserId || (session as any)?.user?.id} />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard 
          title={getMotivationText('xp')} 
          value={`${user?.experience || 0}`} 
          description={`До следующего ранга: ${expToNext}`} 
        />
        <MetricCard 
          title={getMotivationText('mana')} 
          value={user?.mana?.toString() || "0"} 
          description={`Выполнено миссий: ${completedMissions}/${totalMissions}`} 
        />
        <MetricCard
          title="Компетенции"
          value={topCompetencies}
          description={activeMissions.length > 0 ? `${activeMissions.length} активных миссий` : "Все миссии завершены"}
        />
      </div>

      {activeMissions.length > 0 && (
        <Section title="Активные миссии">
          <Table
            columns={["Миссия", "Статус", "Награды", "Компетенции"]}
            rows={activeMissions.map((userMission) => [
              <button
                key={`name-${userMission.id}`}
                onClick={() => setSelectedMission(userMission)}
                className="text-left text-indigo-300 hover:text-white transition-colors"
              >
                {userMission.mission.name}
              </button>,
              <span key={`status-${userMission.id}`}>
                {getStatusLabel(userMission.status)}
              </span>,
              <span key={`rewards-${userMission.id}`}>
                {userMission.mission.experienceReward} {getMotivationText('xp')} / {userMission.mission.manaReward} {getMotivationText('mana')}
              </span>,
              <span key={`comp-${userMission.id}`}>
                {userMission.mission.competencies
                  ?.map(comp => `${comp.competency.name} +${comp.points}`)
                  ?.join(", ") || "—"}
              </span>
            ])}
          />
        </Section>
      )}

      <Section title="Галактическая карта прогресса">
        <CadetGalacticMap 
          userMissions={userMissions} 
          onMissionSelect={setSelectedMission}
        />
      </Section>

      {/* Mission Modal */}
      {selectedMission && (
        <MissionModal
          userMission={selectedMission}
          onSubmit={handleMissionSubmit}
          onClose={() => setSelectedMission(null)}
        />
      )}

      {/* Store Modal */}
      <StoreModal
        isOpen={isStoreOpen}
        onClose={() => setIsStoreOpen(false)}
        userId={testModeContext?.testUserId || (session as any)?.user?.id}
        userMana={user?.mana || 0}
        onPurchaseSuccess={handlePurchaseSuccess}
      />

      {/* Notification Toast */}
      <NotificationToast userId={testModeContext?.testUserId || (session as any)?.user?.id} />
    </div>
  );
}

