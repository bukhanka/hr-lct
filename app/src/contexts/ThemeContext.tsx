"use client";

import React, { createContext, useContext, ReactNode } from "react";
import type { CampaignThemeConfig } from "@/types/campaignTheme";
import { THEME_PRESETS } from "@/data/theme-presets";

// Default theme config (Galactic Academy)
const DEFAULT_THEME: CampaignThemeConfig = {
  themeId: "galactic-academy",
  funnelType: "onboarding",
  personas: ["students"],
  gamificationLevel: "high",
  motivationOverrides: {
    xp: "Опыт",
    mana: "Мана",
    rank: "Ранг",
  },
  palette: {
    primary: "#8B5CF6",
    secondary: "#38BDF8",
    surface: "rgba(23, 16, 48, 0.85)",
  },
};

// Thematic terminology dictionary
const THEME_TERMINOLOGY: Record<string, Record<string, string>> = {
  "galactic-academy": {
    header: "Бортовой журнал кадета",
    mapTitle: "Галактическая карта прогресса",
    competencies: "Компетенции",
    skills: "Навыки",
    missions: "Миссии",
    achievements: "Артефакты",
    profile: "Профиль кадета",
    history: "Журнал миссий",
    leaderboard: "Рейтинг флота",
  },
  "corporate-metropolis": {
    header: "Личный кабинет сотрудника",
    mapTitle: "Карта развития",
    competencies: "KPI и метрики",
    skills: "Компетенции",
    missions: "Задачи",
    achievements: "Достижения",
    profile: "Мой профиль",
    history: "История задач",
    leaderboard: "Рейтинг команды",
  },
  "esg-mission": {
    header: "Личный кабинет волонтера",
    mapTitle: "Карта вклада",
    competencies: "Области влияния",
    skills: "Навыки",
    missions: "Инициативы",
    achievements: "Награды",
    profile: "Профиль волонтера",
    history: "История участия",
    leaderboard: "Топ-активисты",
  },
  "cyberpunk-hub": {
    header: "Персональный терминал",
    mapTitle: "Цифровая сеть",
    competencies: "Навыки хакера",
    skills: "Скиллы",
    missions: "Контракты",
    achievements: "Трофеи",
    profile: "Профиль оператора",
    history: "Лог операций",
    leaderboard: "Топ-операторы",
  },
  "scientific-expedition": {
    header: "Журнал исследователя",
    mapTitle: "Карта экспедиций",
    competencies: "Научные направления",
    skills: "Экспертиза",
    missions: "Исследования",
    achievements: "Открытия",
    profile: "Профиль ученого",
    history: "История исследований",
    leaderboard: "Топ-исследователи",
  },
};

interface ThemeContextValue {
  theme: CampaignThemeConfig;
  getMotivationText: (key: keyof NonNullable<CampaignThemeConfig['motivationOverrides']>) => string;
  getCompetencyName: (originalName: string) => string;
  getThemeText: (key: string) => string;
  shouldShowAnimations: () => boolean;
  shouldShowEffects: () => boolean;
  getGradientColors: () => { from: string; via: string; to: string };
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  getMotivationText: (key) => {
    const defaults = { xp: "XP", mana: "Мана", rank: "Ранг" };
    return defaults[key] || key;
  },
  getCompetencyName: (originalName) => originalName,
  getThemeText: (key) => key,
  shouldShowAnimations: () => true,
  shouldShowEffects: () => true,
  getGradientColors: () => ({ from: "#050514", via: "#0b0924", to: "#050514" }),
});

interface ThemeProviderProps {
  children: ReactNode;
  theme?: CampaignThemeConfig | null;
}

export function ThemeProvider({ children, theme }: ThemeProviderProps) {
  console.log("[ThemeProvider] 🎨 Initializing with theme:", theme);
  console.log("[ThemeProvider] 🔧 Using theme:", theme ? "custom" : "default");
  
  const activeTheme = theme || DEFAULT_THEME;
  
  console.log("[ThemeProvider] ✨ Active theme config:", {
    themeId: activeTheme.themeId,
    funnelType: activeTheme.funnelType,
    gamificationLevel: activeTheme.gamificationLevel,
    hasAssets: !!activeTheme.assets,
    assets: activeTheme.assets,
    hasPalette: !!activeTheme.palette,
    palette: activeTheme.palette,
    motivationOverrides: activeTheme.motivationOverrides
  });

  const getMotivationText = (key: keyof NonNullable<CampaignThemeConfig['motivationOverrides']>) => {
    const overrides = activeTheme.motivationOverrides;
    if (overrides && overrides[key]) {
      return overrides[key]!;
    }
    
    const defaults = { 
      xp: "XP", 
      mana: "Мана", 
      rank: "Ранг" 
    };
    return defaults[key] || key;
  };

  const getCompetencyName = (originalName: string): string => {
    // Try current theme overrides first
    const overrides = activeTheme.competencyOverrides;
    if (overrides && overrides[originalName]) {
      return overrides[originalName]!;
    }
    
    // Fallback to preset overrides for backward compatibility
    const preset = THEME_PRESETS.find(p => p.id === activeTheme.themeId);
    if (preset?.config.competencyOverrides && preset.config.competencyOverrides[originalName]) {
      return preset.config.competencyOverrides[originalName]!;
    }
    
    return originalName;
  };

  const getThemeText = (key: string): string => {
    const themeTerms = THEME_TERMINOLOGY[activeTheme.themeId];
    if (themeTerms && themeTerms[key]) {
      return themeTerms[key];
    }
    
    // Fallback to galactic-academy
    const defaults = THEME_TERMINOLOGY["galactic-academy"];
    return defaults[key] || key;
  };

  const shouldShowAnimations = (): boolean => {
    // High gamification = all animations
    // Balanced = moderate animations
    // Low = minimal animations
    return activeTheme.gamificationLevel !== "low";
  };

  const shouldShowEffects = (): boolean => {
    // High = all effects (particles, glow, confetti, etc)
    // Balanced = some effects
    // Low = minimal effects
    return activeTheme.gamificationLevel === "high";
  };

  const getGradientColors = (): { from: string; via: string; to: string } => {
    const primary = activeTheme.palette?.primary || "#8B5CF6";
    const secondary = activeTheme.palette?.secondary || "#38BDF8";
    
    // Convert hex to dark variants for background
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 5, g: 5, b: 20 };
    };
    
    const primaryRgb = hexToRgb(primary);
    const secondaryRgb = hexToRgb(secondary);
    
    // Create dark background based on theme colors
    const from = `rgb(${Math.min(primaryRgb.r * 0.05, 10)}, ${Math.min(primaryRgb.g * 0.05, 10)}, ${Math.min(primaryRgb.b * 0.1, 20)})`;
    const via = `rgb(${Math.min(secondaryRgb.r * 0.08, 15)}, ${Math.min(secondaryRgb.g * 0.08, 15)}, ${Math.min(secondaryRgb.b * 0.12, 30)})`;
    const to = from;
    
    return { from, via, to };
  };

  const contextValue: ThemeContextValue = {
    theme: activeTheme,
    getMotivationText,
    getCompetencyName,
    getThemeText,
    shouldShowAnimations,
    shouldShowEffects,
    getGradientColors,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
