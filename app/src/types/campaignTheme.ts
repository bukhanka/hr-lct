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
  palette?: {
    primary: string;
    secondary: string;
    surface: string;
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