"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MetricCard, Section, Table } from "./widgets";
import { CadetGalacticMap } from "./CadetGalacticMap";
import { MissionModal } from "./MissionModal";

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
  submission?: Record<string, unknown>;
  mission: {
    id: string;
    name: string;
    description?: string;
    missionType: string;
    experienceReward: number;
    manaReward: number;
    competencies: Array<{
      points: number;
      competency: {
        name: string;
      };
    }>;
  };
}

export function CadetOverview() {
  const { data: session } = useSession();
  const [userMissions, setUserMissions] = useState<UserMission[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selectedMission, setSelectedMission] = useState<UserMission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
    console.log("[CadetOverview] useEffect triggered with session", session.user);
      loadUserData();
  } else {
    console.log("[CadetOverview] useEffect: session missing user id", session);
    }
  }, [session, loadUserData]);

  useEffect(() => {
    console.log("[CadetOverview] render snapshot", {
      hasSessionId: Boolean(session?.user?.id),
      isLoading,
      missionsCount: userMissions.length,
      selectedMissionId: selectedMission?.id,
    });
  });

  const loadUserData = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
    console.log("[CadetOverview] loadUserData start", { userId: session.user.id });
      // Load user missions
      const missionsResponse = await fetch(`/api/users/${session.user.id}/missions`);
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
        id: session.user.id,
        displayName: session.user.name || "Кадет А. Вектор",
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
  }, [session?.user?.id, session?.user?.name]);

  const handleMissionSubmit = async (missionId: string, submission: Record<string, unknown>) => {
    try {
    console.log("[CadetOverview] handleMissionSubmit", { missionId, submission });
      const response = await fetch(`/api/missions/${missionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission }),
      });

    console.log("[CadetOverview] mission submit response", response.status, response.statusText);
      if (response.ok) {
        // Reload user missions
        await loadUserData();
        setSelectedMission(null);
    } else {
      console.warn("[CadetOverview] mission submit failed", await response.text());
      }
    } catch (error) {
      console.error("Failed to submit mission:", error);
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
        <p className="text-xs uppercase tracking-[0.4em] text-indigo-200/70">
          Бортовой журнал кадета
        </p>
        <h1 className="text-3xl font-semibold text-white">
          {user?.displayName || "Кадет"} · Ранг: {user?.currentRank || 1}
        </h1>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard 
          title="Опыт" 
          value={`${user?.experience || 0} XP`} 
          description={`До следующего ранга: ${expToNext} XP`} 
        />
        <MetricCard 
          title="Мана" 
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
                {userMission.mission.experienceReward} XP / {userMission.mission.manaReward} маны
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
        <CadetGalacticMap />
      </Section>

      {/* Mission Modal */}
      {selectedMission && (
        <MissionModal
          userMission={selectedMission}
          onSubmit={handleMissionSubmit}
          onClose={() => setSelectedMission(null)}
        />
      )}
    </div>
  );
}

