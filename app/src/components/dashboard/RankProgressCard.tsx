"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Star, Zap, ChevronRight, Trophy, Target } from "lucide-react";

interface Rank {
  id: string;
  level: number;
  name: string;
  title: string;
  description?: string;
  minExperience: number;
  minMissions: number;
  requiredCompetencies?: Record<string, number>;
  rewards?: { mana?: number; badge?: string };
}

interface RankProgress {
  experience: number;
  missionsCompleted: number;
  competencies: Record<string, number>;
  nextRankExperience: number;
  nextRankMissions: number;
  progressPercentage: number;
}

interface RankProgressCardProps {
  userId: string;
}

export function RankProgressCard({ userId }: RankProgressCardProps) {
  const [currentRank, setCurrentRank] = useState<Rank | null>(null);
  const [nextRank, setNextRank] = useState<Rank | null>(null);
  const [progress, setProgress] = useState<RankProgress | null>(null);
  const [isReadyForPromotion, setIsReadyForPromotion] = useState(false);
  const [missingRequirements, setMissingRequirements] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadRankProgress();
    }
  }, [userId]);

  const loadRankProgress = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/rank-progress`);
      if (response.ok) {
        const data = await response.json();
        setCurrentRank(data.currentRank);
        setNextRank(data.nextRank);
        setProgress(data.progress);
        setIsReadyForPromotion(data.isReadyForPromotion);
        setMissingRequirements(data.missingRequirements);
      }
    } catch (error) {
      console.error("Failed to load rank progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-[24px] border border-indigo-300/20 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-indigo-200">Загрузка прогресса рангов...</div>
        </div>
      </div>
    );
  }

  if (!currentRank || !progress) {
    return null;
  }

  const experienceProgress = progress.nextRankExperience > 0 ? 
    (progress.experience / progress.nextRankExperience) * 100 : 100;
  
  const missionProgress = progress.nextRankMissions > 0 ?
    (progress.missionsCompleted / progress.nextRankMissions) * 100 : 100;

  return (
    <div className="rounded-[24px] border border-indigo-300/20 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.1),transparent_60%)]" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-orange-400/10 rounded-full blur-3xl" />
      
      <div className="relative">
        {/* Current Rank Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">{currentRank.name}</h3>
              <p className="text-sm text-indigo-200/70">{currentRank.title}</p>
            </div>
          </div>
          
          {isReadyForPromotion ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300 font-medium">Готов к повышению!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-indigo-200/60">
              <Target className="w-4 h-4" />
              <span className="text-sm">Ранг {currentRank.level}</span>
            </div>
          )}
        </div>

        {nextRank ? (
          <div className="space-y-4">
            {/* Next Rank Goal */}
            <div className="flex items-center justify-between">
              <h4 className="text-lg text-white">
                Путь к рангу "{nextRank.name}"
              </h4>
              <div className="flex items-center gap-2 text-indigo-200/70">
                <span className="text-sm">Ранг {nextRank.level}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Experience Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-indigo-200/80">Опыт</span>
                <span className="text-white font-medium">
                  {(progress.experience || 0).toLocaleString()} / {(progress.nextRankExperience || 0).toLocaleString()} XP
                </span>
              </div>
              <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-indigo-400 to-purple-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(experienceProgress, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Missions Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-indigo-200/80">Миссии</span>
                <span className="text-white font-medium">
                  {progress.missionsCompleted || 0} / {progress.nextRankMissions || 0}
                </span>
              </div>
              <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(missionProgress, 100)}%` }}
                  transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Competency Requirements */}
            {nextRank.requiredCompetencies && Object.keys(nextRank.requiredCompetencies).length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-indigo-200/80">Требуемые компетенции:</p>
                <div className="grid gap-2">
                  {Object.entries(nextRank.requiredCompetencies).map(([competency, required]) => {
                    const userPoints = progress.competencies[competency] || 0;
                    const competencyProgress = (userPoints / required) * 100;
                    const isMet = userPoints >= required;
                    
                    return (
                      <div key={competency} className="flex items-center justify-between text-sm">
                        <span className={`${isMet ? 'text-emerald-300' : 'text-indigo-200/70'}`}>
                          {competency}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isMet ? 'text-emerald-300' : 'text-white'}`}>
                            {userPoints} / {required}
                          </span>
                          {isMet && <Star className="w-4 h-4 text-emerald-400" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rewards Preview */}
            {nextRank.rewards && (
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <p className="text-sm text-indigo-200/70 mb-2">Награды за повышение:</p>
                <div className="flex items-center gap-4">
                  {nextRank.rewards.mana && (
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-white">+{nextRank.rewards.mana} маны</span>
                    </div>
                  )}
                  {nextRank.rewards.badge && (
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-white">Бейдж {nextRank.rewards.badge}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Missing Requirements */}
            {!isReadyForPromotion && missingRequirements.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-400/20 rounded-2xl p-4">
                <p className="text-sm text-orange-300 font-medium mb-2">До повышения осталось:</p>
                <ul className="space-y-1">
                  {missingRequirements.map((requirement, index) => (
                    <li key={index} className="text-sm text-orange-200/80 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400/60" />
                      {requirement}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h4 className="text-lg text-white font-semibold mb-2">Максимальный ранг достигнут!</h4>
            <p className="text-indigo-200/70">Поздравляем, вы достигли высшего ранга в системе.</p>
          </div>
        )}
      </div>
    </div>
  );
}
