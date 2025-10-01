"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User, Mail, Calendar, Award, TrendingUp, Target, Edit } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { CadetNavigation } from "./CadetNavigation";

interface UserProfile {
  user: {
    id: string;
    email: string;
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
    completionRate: number;
    currentStreak: number;
    avgTimePerMission: number;
    totalPurchases: number;
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
}

export function CadetProfile() {
  const { data: session } = useSession();
  const { theme, getThemeText, getMotivationText, getGradientColors } = useTheme();
  const gradients = getGradientColors();
  const primary = theme.palette?.primary || "#8B5CF6";
  const secondary = theme.palette?.secondary || "#38BDF8";

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!(session as any)?.user?.id) return;

      try {
        const response = await fetch(`/api/users/${(session as any)?.user?.id}/profile`);
        
        if (response.ok) {
          const profile = await response.json();
          setUserProfile(profile);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [session]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mx-auto mb-4" />
          <p className="text-indigo-100/70 text-lg">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-indigo-200">Не удалось загрузить профиль</p>
        </div>
      </div>
    );
  }

  const { user, statistics, competencies, ranks } = userProfile;

  return (
    <main 
      className="min-h-screen relative"
      style={{
        background: `linear-gradient(to bottom right, ${gradients.from}, ${gradients.via}, ${gradients.to})`
      }}
    >
      <CadetNavigation />

      <div className="relative z-10 mx-auto max-w-5xl space-y-8 px-6 py-12 text-white md:px-12 lg:px-16">
        {/* Profile Header */}
        <div 
          className="rounded-[32px] p-8 relative overflow-hidden"
          style={{
            background: `linear-gradient(to bottom right, ${primary}10, ${secondary}10)`,
            border: `1px solid ${primary}30`
          }}
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div 
                className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold border-4"
                style={{
                  background: `linear-gradient(to bottom right, ${primary}, ${secondary})`,
                  borderColor: `${primary}80`
                }}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.displayName || "User"} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-white" />
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold text-white mb-2">
                {user.displayName || "Кадет"}
              </h1>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm mb-4">
                <div className="flex items-center gap-2" style={{ color: `${primary}CC` }}>
                  <Mail className="w-4 h-4" />
                  {user.email}
                </div>
                <div className="flex items-center gap-2" style={{ color: `${primary}CC` }}>
                  <Calendar className="w-4 h-4" />
                  Присоединился {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <div 
                  className="px-4 py-2 rounded-full border"
                  style={{
                    backgroundColor: `${primary}20`,
                    borderColor: `${primary}40`,
                    color: primary
                  }}
                >
                  {getMotivationText('rank')} {user.currentRank}
                </div>
                <div 
                  className="px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: `${secondary}20`,
                    border: `1px solid ${secondary}40`,
                    color: secondary
                  }}
                >
                  {user.experience} {getMotivationText('xp')}
                </div>
                <div 
                  className="px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: `${primary}20`,
                    border: `1px solid ${primary}40`,
                    color: primary
                  }}
                >
                  {user.mana} {getMotivationText('mana')}
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <button 
              className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:scale-105"
              style={{
                backgroundColor: `${primary}20`,
                border: `1px solid ${primary}40`,
                color: primary
              }}
            >
              <Edit className="w-4 h-4" />
              Редактировать
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            className="rounded-[24px] p-6"
            style={{
              background: `linear-gradient(to bottom right, ${primary}10, ${secondary}10)`,
              border: `1px solid ${primary}30`
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${primary}20` }}
              >
                <Target className="w-6 h-6" style={{ color: primary }} />
              </div>
              <div>
                <p className="text-sm opacity-70">Выполнено {getThemeText('missions').toLowerCase()}</p>
                <p className="text-3xl font-bold">{statistics.completedMissions}</p>
              </div>
            </div>
            <div className="text-sm opacity-60">
              Из {statistics.totalMissions} доступных ({statistics.completionRate}%)
            </div>
          </div>

          <div 
            className="rounded-[24px] p-6"
            style={{
              background: `linear-gradient(to bottom right, ${secondary}10, ${primary}10)`,
              border: `1px solid ${secondary}30`
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${secondary}20` }}
              >
                <TrendingUp className="w-6 h-6" style={{ color: secondary }} />
              </div>
              <div>
                <p className="text-sm opacity-70">Текущая серия</p>
                <p className="text-3xl font-bold">{statistics.currentStreak}</p>
              </div>
            </div>
            <div className="text-sm opacity-60">
              {statistics.currentStreak > 0 ? "Продолжайте в том же духе!" : "Начните новую серию сегодня"}
            </div>
          </div>

          <div 
            className="rounded-[24px] p-6"
            style={{
              background: `linear-gradient(to bottom right, ${primary}10, ${secondary}10)`,
              border: `1px solid ${primary}30`
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${primary}20` }}
              >
                <Award className="w-6 h-6" style={{ color: primary }} />
              </div>
              <div>
                <p className="text-sm opacity-70">{getThemeText('competencies')}</p>
                <p className="text-3xl font-bold">{competencies.length}</p>
              </div>
            </div>
            <div className="text-sm opacity-60">
              Всего баллов: {competencies.reduce((sum, c) => sum + c.points, 0)}
            </div>
          </div>
        </div>

        {/* Competencies Detail */}
        <div 
          className="rounded-[32px] p-8"
          style={{
            background: `linear-gradient(to bottom right, ${primary}10, ${secondary}10)`,
            borderColor: `${primary}30`
          }}
        >
          <h2 className="text-2xl font-bold mb-6">{getThemeText('competencies')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {competencies.sort((a, b) => b.points - a.points).map((comp) => (
              <div 
                key={comp.id}
                className="rounded-2xl p-4"
                style={{
                  backgroundColor: `${primary}08`,
                  border: `1px solid ${primary}20`
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {comp.icon && <span className="text-xl">{comp.icon}</span>}
                    <span className="font-medium text-white">{comp.name}</span>
                  </div>
                  <span className="font-bold" style={{ color: primary }}>
                    {comp.points} баллов
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className="h-full"
                    style={{
                      width: `${(comp.points / Math.max(...competencies.map(c => c.points))) * 100}%`,
                      background: `linear-gradient(to right, ${primary}, ${secondary})`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

