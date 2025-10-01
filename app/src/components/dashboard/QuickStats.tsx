"use client";

import { motion } from "framer-motion";
import { 
  Target, 
  Zap, 
  CheckCircle, 
  Clock, 
  Flame, 
  TrendingUp,
  ShoppingBag,
  Award
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface Statistics {
  totalMissions: number;
  completedMissions: number;
  inProgressMissions: number;
  lockedMissions: number;
  completionRate: number;
  currentStreak: number;
  avgTimePerMission: number;
  totalPurchases: number;
  unreadNotifications: number;
}

interface QuickStatsProps {
  stats: Statistics;
  experience: number;
  mana: number;
  getMotivationText: (key: string) => string;
}

export function QuickStats({ stats, experience, mana, getMotivationText }: QuickStatsProps) {
  const { theme, shouldShowAnimations, getThemeText } = useTheme();
  const primary = theme.palette?.primary || "#8B5CF6";
  const secondary = theme.palette?.secondary || "#38BDF8";
  
  // Helper to generate themed colors
  const getCardColors = (index: number) => {
    const hue = (parseInt(primary.slice(1, 3), 16) + index * 30) % 360;
    return {
      from: `${primary}33`,
      to: `${secondary}33`,
      icon: index % 2 === 0 ? primary : secondary,
      border: `${index % 2 === 0 ? primary : secondary}4D`
    };
  };
  const statsCards = [
    {
      icon: Target,
      label: `${getThemeText('missions')} выполнено`,
      value: `${stats.completedMissions}/${stats.totalMissions}`,
      subValue: `${stats.completionRate}% завершено`,
      index: 0
    },
    {
      icon: Flame,
      label: "Серия",
      value: `${stats.currentStreak} ${stats.currentStreak === 1 ? 'день' : 'дней'}`,
      subValue: stats.currentStreak > 0 ? "Продолжайте!" : "Начните сегодня",
      index: 1
    },
    {
      icon: Zap,
      label: getMotivationText('xp'),
      value: experience.toLocaleString(),
      subValue: "Опыт",
      index: 2
    },
    {
      icon: Award,
      label: getMotivationText('mana'),
      value: mana.toLocaleString(),
      subValue: "Доступно",
      index: 3
    },
    {
      icon: Clock,
      label: "Среднее время",
      value: stats.avgTimePerMission > 0 ? `${stats.avgTimePerMission.toFixed(1)}ч` : "—",
      subValue: "На миссию",
      index: 4
    },
    {
      icon: ShoppingBag,
      label: "Покупки",
      value: stats.totalPurchases.toString(),
      subValue: "Приобретено",
      index: 5
    }
  ];

  const Card = shouldShowAnimations() ? motion.div : 'div';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statsCards.map((card, index) => {
        const Icon = card.icon;
        const colors = getCardColors(card.index);
        
        return (
          <Card
            key={card.label}
            {...(shouldShowAnimations() ? {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: index * 0.05, duration: 0.3 }
            } : {})}
            className="rounded-2xl p-4 relative overflow-hidden group hover:scale-105 transition-transform duration-200"
            style={{
              background: `linear-gradient(to bottom right, ${colors.from}, ${colors.to})`,
              border: `1px solid ${colors.border}`
            }}
          >
            {/* Glow effect on hover */}
            {shouldShowAnimations() && (
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            )}
            
            <div className="relative">
              {/* Icon */}
              <div 
                className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3"
              >
                <Icon className="w-5 h-5" style={{ color: colors.icon }} />
              </div>

              {/* Value */}
              <div className="text-2xl font-bold text-white mb-1">
                {card.value}
              </div>

              {/* Label */}
              <div className="text-xs mb-1" style={{ color: `${primary}B3` }}>
                {card.label}
              </div>

              {/* Sub Value */}
              <div className="text-xs" style={{ color: `${primary}80` }}>
                {card.subValue}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// Separate component for "In Progress" missions quick view
export function InProgressMissionsCard({ count }: { count: number }) {
  const { theme, shouldShowAnimations, getThemeText } = useTheme();
  const secondary = theme.palette?.secondary || "#FBBF24";
  
  if (count === 0) return null;

  const Card = shouldShowAnimations() ? motion.div : 'div';

  return (
    <Card
      {...(shouldShowAnimations() ? {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 }
      } : {})}
      className="rounded-2xl p-4 flex items-center gap-4"
      style={{
        background: `linear-gradient(to bottom right, ${secondary}1A, ${secondary}0D)`,
        border: `1px solid ${secondary}4D`
      }}
    >
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${secondary}33` }}
      >
        <TrendingUp className="w-6 h-6" style={{ color: secondary }} />
      </div>
      <div className="flex-1">
        <div className="text-xl font-bold text-white mb-1">
          {count} {count === 1 ? getThemeText('missions').slice(0, -1).toLowerCase() : getThemeText('missions').slice(0, -1).toLowerCase() + (count < 5 ? 'и' : 'й')}
        </div>
        <div className="text-sm" style={{ color: `${secondary}B3` }}>
          В процессе выполнения
        </div>
      </div>
      <div 
        className="px-3 py-1.5 rounded-full text-xs font-medium"
        style={{
          backgroundColor: `${secondary}33`,
          color: secondary
        }}
      >
        Активно
      </div>
    </Card>
  );
}

