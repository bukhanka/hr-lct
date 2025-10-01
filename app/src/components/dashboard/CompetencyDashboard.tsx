"use client";

import { motion } from "framer-motion";
import { TrendingUp, Target, Award } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface Competency {
  id: string;
  name: string;
  icon: string | null;
  points: number;
}

interface CompetencyDashboardProps {
  competencies: Competency[];
}

export function CompetencyDashboard({ competencies }: CompetencyDashboardProps) {
  const { theme, getThemeText, getCompetencyName, shouldShowAnimations } = useTheme();
  const primary = theme.palette?.primary || "#8B5CF6";
  const secondary = theme.palette?.secondary || "#38BDF8";
  
  const sortedCompetencies = [...competencies].sort((a, b) => b.points - a.points);
  const maxPoints = Math.max(...competencies.map(c => c.points), 1);
  const totalPoints = competencies.reduce((sum, c) => sum + c.points, 0);
  
  // Corporate style for low gamification
  const corporateStyle = theme.gamificationLevel === "low" || theme.themeId === "corporate-metropolis";

  return (
    <div 
      className={corporateStyle ? "rounded-lg p-6 relative overflow-hidden" : "rounded-[24px] p-6 relative overflow-hidden"}
      style={{
        border: `1px solid ${primary}20`,
        background: corporateStyle 
          ? `linear-gradient(135deg, rgba(8, 16, 32, 0.8), rgba(8, 16, 32, 0.6))`
          : `linear-gradient(to bottom right, ${primary}10, ${secondary}10)`
      }}
    >
      {/* Background decoration */}
      {shouldShowAnimations() && (
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            background: `radial-gradient(circle at bottom left, ${primary}, transparent 60%)`
          }}
        />
      )}
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Award className="w-5 h-5" style={{ color: primary }} />
              {getThemeText('competencies')}
            </h3>
            <p className="text-sm opacity-60 mt-1" style={{ color: primary }}>
              Всего баллов: {totalPoints}
            </p>
          </div>
          <div 
            className="px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: `${primary}20`,
              border: `1px solid ${primary}30`
            }}
          >
            <span className="text-sm font-medium" style={{ color: primary }}>
              {competencies.length} {getThemeText('skills').toLowerCase()}
            </span>
          </div>
        </div>

        {/* Competencies List */}
        {competencies.length > 0 ? (
          <div className="space-y-4">
            {sortedCompetencies.map((competency, index) => {
              const percentage = (competency.points / maxPoints) * 100;
              const isTop3 = index < 3;
              
              const CompetencyItem = shouldShowAnimations() ? motion.div : 'div';
              
              return (
                <CompetencyItem
                  key={competency.id}
                  {...(shouldShowAnimations() ? {
                    initial: { opacity: 0, x: -20 },
                    animate: { opacity: 1, x: 0 },
                    transition: { delay: index * 0.1 }
                  } : {})}
                  className="relative"
                >
                  {/* Competency Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {competency.icon && (
                        <span className="text-lg">{competency.icon}</span>
                      )}
                      <span className={`font-medium ${isTop3 ? 'text-white' : 'text-white/80'}`}>
                        {getCompetencyName(competency.name)}
                      </span>
                      {isTop3 && shouldShowAnimations() && (
                        <TrendingUp className="w-4 h-4" style={{ color: secondary }} />
                      )}
                    </div>
                    <span 
                      className="text-sm font-semibold"
                      style={{ color: isTop3 ? primary : `${primary}90` }}
                    >
                      {competency.points} {competency.points === 1 ? 'балл' : 'баллов'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={shouldShowAnimations() ? { width: 0 } : { width: `${percentage}%` }}
                      animate={{ width: `${percentage}%` }}
                      transition={shouldShowAnimations() ? { duration: 0.8, delay: index * 0.1, ease: "easeOut" } : { duration: 0 }}
                      className="h-full"
                      style={{
                        background: isTop3
                          ? `linear-gradient(to right, ${primary}, ${secondary})`
                          : `linear-gradient(to right, ${primary}CC, ${secondary}CC)`,
                        boxShadow: isTop3 ? `0 0 10px ${primary}80` : "none"
                      }}
                    />
                  </div>
                </CompetencyItem>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto mb-3" style={{ color: `${primary}50` }} />
            <p className="text-white/70">Начните выполнять {getThemeText('missions').toLowerCase()} для развития {getThemeText('competencies').toLowerCase()}</p>
          </div>
        )}

        {/* Top 3 Badge */}
        {competencies.length >= 3 && (
          <div 
            className="mt-6 p-4 rounded-2xl"
            style={{
              background: `linear-gradient(to right, ${primary}20, ${secondary}20)`,
              border: `1px solid ${primary}30`
            }}
          >
            <p className="text-xs mb-2" style={{ color: `${primary}CC` }}>⭐ Топ-3 {getThemeText('competencies').toLowerCase()}:</p>
            <div className="flex flex-wrap gap-2">
              {sortedCompetencies.slice(0, 3).map((comp) => (
                <span
                  key={comp.id}
                  className="px-3 py-1 rounded-full bg-white/10 text-sm text-white"
                >
                  {comp.icon} {getCompetencyName(comp.name)} +{comp.points}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

