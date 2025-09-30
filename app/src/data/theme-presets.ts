import type { CampaignThemeConfig, PersonaPreset, ThemePreset } from "@/types/campaignTheme";

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "galactic-academy",
    title: "Галактическая академия",
    description: "Космический визуал с фиолетовыми акцентами и нарративом кадетов",
    recommendedFunnel: ["onboarding", "growth"],
    spotlightColor: "#8B5CF6",
    assets: {
      background: "/themes/galactic-academy/background.png",
      icon: "/themes/galactic-academy/icon.svg",
      audio: "/themes/galactic-academy/ambient.mp3",
    },
    config: {
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
    },
  },
  {
    id: "corporate-metropolis",
    title: "Корпоративный мегаполис",
    description: "Строгий стиль, метрики KPI и минимальная геймификация",
    recommendedFunnel: ["onboarding", "engagement"],
    spotlightColor: "#38BDF8",
    assets: {
      background: "/themes/corporate-metropolis/background.png",
      icon: "/themes/corporate-metropolis/icon.svg",
      audio: "/themes/corporate-metropolis/ambient.mp3",
    },
    config: {
      themeId: "corporate-metropolis",
      funnelType: "engagement",
      personas: ["professionals"],
      gamificationLevel: "low",
      motivationOverrides: {
        xp: "KPI",
        mana: "Бонусы",
        rank: "Статус",
      },
      palette: {
        primary: "#38BDF8",
        secondary: "#0EA5E9",
        surface: "rgba(8, 16, 32, 0.9)",
      },
    },
  },
  {
    id: "esg-mission",
    title: "ESG-миссия",
    description: "Зелёный мотив, акцент на вклад и социальный импакт",
    recommendedFunnel: ["esg", "growth"],
    spotlightColor: "#22C55E",
    assets: {
      background: "/themes/esg-mission/background.png",
      icon: "/themes/esg-mission/icon.svg",
      audio: "/themes/esg-mission/ambient.mp3",
    },
    config: {
      themeId: "esg-mission",
      funnelType: "esg",
      personas: ["volunteers"],
      gamificationLevel: "balanced",
      motivationOverrides: {
        xp: "Вклад",
        mana: "Импакт",
        rank: "Статус",
      },
      palette: {
        primary: "#22C55E",
        secondary: "#4ADE80",
        surface: "rgba(6, 24, 18, 0.9)",
      },
    },
  },
];

export const PERSONA_PRESETS: PersonaPreset[] = [
  {
    id: "students",
    title: "Студенты и стажёры",
    description: "Digital natives, любят яркую геймификацию и быстрый фидбек",
    defaultGamification: "high",
    tags: ["emoji", "achievements", "streak"],
  },
  {
    id: "professionals",
    title: "Специалисты 26-35",
    description: "Ценят влияние и развитие, предпочитают баланс геймификации",
    defaultGamification: "balanced",
    tags: ["competencies", "career", "mentor"],
  },
  {
    id: "volunteers",
    title: "Волонтёры и ESG",
    description: "Ориентируются на вклад и признание",
    defaultGamification: "balanced",
    tags: ["impact", "community", "stories"],
  },
];

export function resolveThemePreset(id: string): CampaignThemeConfig | undefined {
  return THEME_PRESETS.find((preset) => preset.id === id)?.config;
}


