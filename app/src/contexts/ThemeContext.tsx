"use client";

import React, { createContext, useContext, ReactNode } from "react";
import type { CampaignThemeConfig } from "@/types/campaignTheme";

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

interface ThemeContextValue {
  theme: CampaignThemeConfig;
  getMotivationText: (key: keyof NonNullable<CampaignThemeConfig['motivationOverrides']>) => string;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  getMotivationText: (key) => {
    const defaults = { xp: "XP", mana: "Мана", rank: "Ранг" };
    return defaults[key] || key;
  },
});

interface ThemeProviderProps {
  children: ReactNode;
  theme?: CampaignThemeConfig | null;
}

export function ThemeProvider({ children, theme }: ThemeProviderProps) {
  const activeTheme = theme || DEFAULT_THEME;

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

  const contextValue: ThemeContextValue = {
    theme: activeTheme,
    getMotivationText,
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
