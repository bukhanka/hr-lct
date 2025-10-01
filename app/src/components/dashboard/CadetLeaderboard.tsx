"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Trophy, Medal, Award, TrendingUp, User } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { CadetNavigation } from "./CadetNavigation";

interface LeaderboardUser {
  id: string;
  displayName: string | null;
  experience: number;
  currentRank: number;
  completedMissions: number;
}

export function CadetLeaderboard() {
  const { data: session } = useSession();
  const { theme, getThemeText, getMotivationText, getGradientColors } = useTheme();
  const gradients = getGradientColors();
  const primary = theme.palette?.primary || "#8B5CF6";
  const secondary = theme.palette?.secondary || "#38BDF8";

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      if (!(session as any)?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch real leaderboard data from API
        const response = await fetch("/api/users/leaderboard?limit=50");
        
        if (response.ok) {
          const data = await response.json();
          setLeaderboard(data);
          
          // Find current user's rank
          const userRank = data.findIndex((u: LeaderboardUser) => u.id === (session as any)?.user?.id) + 1;
          setCurrentUserRank(userRank);
        } else {
          console.error("Failed to fetch leaderboard:", response.status);
        }
      } catch (error) {
        console.error("Failed to load leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadLeaderboard();
  }, [session]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto mb-4" />
          <p className="text-indigo-100/70 text-lg">Загрузка рейтинга...</p>
        </div>
      </div>
    );
  }

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2: return <Medal className="w-6 h-6 text-gray-300" />;
      case 3: return <Medal className="w-6 h-6 text-orange-400" />;
      default: return null;
    }
  };

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
          <h1 className="text-4xl font-bold mb-4">{getThemeText('leaderboard')}</h1>
          <p className="text-xl opacity-70">
            Ваша позиция: <span className="font-bold" style={{ color: primary }}>#{currentUserRank}</span>
          </p>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {leaderboard.slice(0, 3).map((user, index) => {
            const position = index + 1;
            const height = position === 1 ? "h-40" : position === 2 ? "h-32" : "h-24";
            
            return (
              <div 
                key={user.id}
                className={`rounded-[24px] p-6 text-center ${height} flex flex-col justify-end`}
                style={{
                  background: `linear-gradient(to bottom, ${index === 0 ? primary : secondary}10, ${index === 0 ? secondary : primary}10)`,
                  border: `1px solid ${index === 0 ? primary : secondary}40`
                }}
              >
                <div className="mb-4">
                  {getMedalIcon(position)}
                </div>
                <div className="text-lg font-bold mb-1">{user.displayName || "Кадет"}</div>
                <div className="text-sm opacity-70 mb-2">{user.experience} {getMotivationText('xp')}</div>
                <div className="text-2xl font-bold">#{position}</div>
              </div>
            );
          })}
        </div>

        {/* Full Leaderboard */}
        <div className="space-y-3">
          {leaderboard.map((user, index) => {
            const position = index + 1;
            const isCurrentUser = user.id === (session as any)?.user?.id;
            
            return (
              <div 
                key={user.id}
                className={`rounded-[24px] p-4 flex items-center gap-4 ${isCurrentUser ? 'ring-2' : ''}`}
                style={{
                  background: `linear-gradient(to right, ${primary}${isCurrentUser ? '20' : '10'}, ${secondary}${isCurrentUser ? '20' : '10'})`,
                  border: `1px solid ${primary}${isCurrentUser ? '60' : '30'}`,
                  ...(isCurrentUser ? { '--tw-ring-color': primary } as React.CSSProperties : {})
                }}
              >
                {/* Position */}
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                  style={{
                    backgroundColor: `${primary}30`,
                    color: position <= 3 ? primary : 'white'
                  }}
                >
                  {position <= 3 ? getMedalIcon(position) : `#${position}`}
                </div>

                {/* Avatar */}
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `linear-gradient(to bottom right, ${primary}, ${secondary})`
                  }}
                >
                  <User className="w-6 h-6 text-white" />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="font-bold text-lg">
                    {user.displayName || "Кадет"} {isCurrentUser && "(Вы)"}
                  </div>
                  <div className="text-sm opacity-70">
                    {getMotivationText('rank')} {user.currentRank} • {user.completedMissions} миссий выполнено
                  </div>
                </div>

                {/* Experience */}
                <div className="text-right">
                  <div className="text-2xl font-bold" style={{ color: primary }}>
                    {user.experience}
                  </div>
                  <div className="text-xs opacity-70">{getMotivationText('xp')}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

