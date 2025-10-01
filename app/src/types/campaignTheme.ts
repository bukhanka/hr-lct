export type FunnelType =
  | "onboarding"
  | "engagement"
  | "assessment"
  | "growth"
  | "esg";

export type GamificationLevel = "low" | "balanced" | "high";

export interface CampaignThemeConfig {
  themeId: string;
  funnelType: FunnelType;
  personas: string[];
  gamificationLevel: GamificationLevel;
  motivationOverrides?: {
    xp?: string;
    mana?: string;
    rank?: string;
  };
  competencyOverrides?: Record<string, string>; // Переименование компетенций под тему
  palette?: {
    primary: string;
    secondary: string;
    surface: string;
  };
  assets?: ThemeAssets;
  customRanks?: RankConfig[]; // Кастомные ранги для кампании
}

export interface RankConfig {
  level: number;
  name: string;
  title: string;
  description?: string;
  iconUrl?: string;
  minExperience: number;
  minMissions: number;
  requiredCompetencies?: Record<string, number>; // { "Аналитика": 3 }
  rewards?: {
    mana?: number;
    badge?: string;
    [key: string]: any;
  };
}

export interface ThemeAssets {
  background?: string;
  icon?: string;
  audio?: string;
}

export interface ThemePreset {
  id: string;
  title: string;
  description: string;
  recommendedFunnel: FunnelType[];
  spotlightColor: string;
  assets?: ThemeAssets;
  config: CampaignThemeConfig;
}

export interface PersonaPreset {
  id: string;
  title: string;
  description: string;
  defaultGamification: GamificationLevel;
  tags: string[];
}