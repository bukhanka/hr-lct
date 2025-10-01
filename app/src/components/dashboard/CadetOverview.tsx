"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ShoppingCart, Palette, User as UserIcon } from "lucide-react";
import { MetricCard, Section, Table } from "./widgets";
import { CadetGalacticMap } from "./CadetGalacticMap";
import { MissionModal } from "./MissionModal";
import { RankProgressCard } from "./RankProgressCard";
import { StoreModal } from "./StoreModal";
import { NotificationToast } from "./NotificationToast";
import { NotificationCenter } from "./NotificationCenter";
import { CompetencyDashboard } from "./CompetencyDashboard";
import { QuickStats, InProgressMissionsCard } from "./QuickStats";
import { RecentActivity } from "./RecentActivity";
import { CadetNavigation } from "./CadetNavigation";
import { useTestMode } from "@/components/constructor/TestModeProvider";
import { useTheme } from "@/contexts/ThemeContext";

interface UserProfile {
  user: {
    id: string;
    displayName: string | null;
    experience: number;
    mana: number;
    currentRank: number;
    avatarUrl: string | null;
    createdAt: string;
  };
  statistics: {
    totalMissions: number;
    completedMissions: number;
    inProgressMissions: number;
    lockedMissions: number;
    completionRate: number;
    currentStreak: number;
    avgTimePerMission: number;
    totalPurchases: number;
    unreadNotifications: number;
  };
  competencies: Array<{
    id: string;
    name: string;
    icon: string | null;
    points: number;
  }>;
  ranks: {
    current: any;
    next: any;
  };
  recentPurchases: Array<any>;
  recentNotifications: Array<any>;
  recentActivity: Array<any>;
}

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
  const { getMotivationText, theme, getThemeText, getGradientColors, shouldShowAnimations } = useTheme();
  const gradients = getGradientColors();
  
  console.log("[CadetOverview] 🎨 Theme from context:", theme);
  console.log("[CadetOverview] 🖼️ Theme assets:", theme.assets);
  console.log("[CadetOverview] 🎨 Theme palette:", theme.palette);
  console.log("[CadetOverview] 💬 Motivation overrides:", theme.motivationOverrides);
  console.log("[CadetOverview] 🌈 Gradient colors:", gradients);
  
  // Try to get test mode context (will be null if not in test mode)
  const testModeContext = useTestMode();

  const [userMissions, setUserMissions] = useState<UserMission[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedMission, setSelectedMission] = useState<UserMission | null>(null);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (testModeContext) {
      // Use test mode data
      console.log("[CadetOverview] Using test mode data");
      setUserMissions(testModeContext.userMissions);
      // Convert test mode user to profile format
      setUserProfile({
        user: {
          id: testModeContext.user.id,
          displayName: testModeContext.user.displayName || null,
          experience: testModeContext.user.experience,
          mana: testModeContext.user.mana,
          currentRank: testModeContext.user.currentRank,
          avatarUrl: null,
          createdAt: new Date().toISOString()
        },
        statistics: {
          totalMissions: testModeContext.userMissions.length,
          completedMissions: testModeContext.userMissions.filter(um => um.status === "COMPLETED").length,
          inProgressMissions: testModeContext.userMissions.filter(um => 
            ["IN_PROGRESS", "PENDING_REVIEW", "AVAILABLE"].includes(um.status)
          ).length,
          lockedMissions: testModeContext.userMissions.filter(um => um.status === "LOCKED").length,
          completionRate: 0,
          currentStreak: 0,
          avgTimePerMission: 0,
          totalPurchases: 0,
          unreadNotifications: 0
        },
        competencies: testModeContext.user.competencies.map((c, i) => ({
          id: `comp-${i}`,
          name: c.competency.name,
          icon: null,
          points: c.points
        })),
        ranks: { current: null, next: null },
        recentPurchases: [],
        recentNotifications: [],
        recentActivity: []
      });
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
      
      // Load user missions and profile in parallel
      const [missionsResponse, profileResponse] = await Promise.all([
        fetch(`/api/users/${(session as any)?.user?.id}/missions`),
        fetch(`/api/users/${(session as any)?.user?.id}/profile`)
      ]);

      console.log("[CadetOverview] missionsResponse", missionsResponse.status, missionsResponse.statusText);
      console.log("[CadetOverview] profileResponse", profileResponse.status, profileResponse.statusText);
      
      if (missionsResponse.ok) {
        const missions = await missionsResponse.json();
        console.log("[CadetOverview] missions payload", missions);
        setUserMissions(missions);
      } else {
        console.warn("[CadetOverview] missionsResponse not ok", missionsResponse);
      }

      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        console.log("[CadetOverview] profile payload", profile);
        setUserProfile(profile);
      } else {
        console.warn("[CadetOverview] profileResponse not ok", profileResponse);
      }
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
    // Update user profile mana balance
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        user: {
          ...userProfile.user,
          mana: newManaBalance
        }
      });
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514]">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto mb-4" />
          <p className="text-indigo-100/70 text-lg">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514]">
        <div className="text-center">
          <p className="text-indigo-200">Не удалось загрузить данные профиля</p>
        </div>
      </div>
    );
  }

  const { user, statistics, competencies, recentPurchases, recentActivity } = userProfile;

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
      
      <div className="relative z-10 mx-auto max-w-7xl space-y-8 px-6 py-12 text-white md:px-12 lg:px-16">
        {/* Header */}
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p 
              className="text-xs uppercase tracking-[0.4em]"
              style={{ color: `${theme.palette?.primary || "#818CF8"}99` }}
            >
              {getThemeText('header')}
            </p>
            <div className="flex items-center gap-3">
              {/* Notification Center */}
              <NotificationCenter userId={testModeContext?.testUserId || user.id} />
              
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
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* User Avatar */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-2xl font-bold">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.displayName || "User"} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <UserIcon className="w-8 h-8 text-white" />
                )}
              </div>
              
              <div>
                <h1 className="text-3xl font-semibold text-white">
                  {user.displayName || "Кадет"}
                </h1>
                <p className="text-indigo-200/70">
                  {getMotivationText('rank')} {user.currentRank}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsStoreOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-purple-200 hover:bg-purple-500/30 transition-all duration-200 hover:scale-105"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="font-medium">Магазин</span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs font-semibold">
                {user.mana}
              </span>
            </button>
          </div>
        </header>

        {/* Quick Stats Dashboard */}
        <QuickStats 
          stats={statistics} 
          experience={user.experience} 
          mana={user.mana}
          getMotivationText={getMotivationText}
        />

        {/* In Progress Missions Alert */}
        {statistics.inProgressMissions > 0 && (
          <InProgressMissionsCard count={statistics.inProgressMissions} />
        )}

        {/* Rank Progress - Main Feature */}
        <RankProgressCard userId={testModeContext?.testUserId || user.id} />

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Competency Dashboard */}
          <CompetencyDashboard competencies={competencies} />

          {/* Recent Activity */}
          <RecentActivity 
            activities={recentActivity}
            purchases={recentPurchases}
            getMotivationText={getMotivationText}
          />
        </div>

        {/* Galactic Map */}
        <Section title={getThemeText('mapTitle')}>
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
    </main>
  );
}

