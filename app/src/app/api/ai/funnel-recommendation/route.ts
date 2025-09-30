import { NextResponse } from "next/server";
import { THEME_PRESETS } from "@/data/theme-presets";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { campaignId, funnelType } = body || {};

    // Simulate AI processing delay
    const responseDelay = 1000 + Math.random() * 1500;
    await new Promise((resolve) => setTimeout(resolve, responseDelay));

    // Get theme options for recommendations
    const relevantThemes = THEME_PRESETS.filter((theme) =>
      funnelType ? theme.recommendedFunnel.includes(funnelType) : true
    );

    const allThemes = relevantThemes.length > 0 ? relevantThemes : THEME_PRESETS;
    
    // Generate realistic recommendations
    const tips = [
      {
        id: "theme-optimization",
        title: "Оптимизировать визуальную тему",
        summary: `Попробуйте тему "${allThemes[0]?.title}" для лучшего соответствия целевой аудитории`,
        patch: allThemes[0]?.config,
      },
      {
        id: "terminology-adjustment", 
        title: "Адаптировать терминологию",
        summary: "Настройте названия валют и рангов под язык вашей аудитории",
        patch: {
          motivationOverrides: {
            xp: "Очки",
            mana: "Ресурсы",
            rank: "Уровень",
          },
        },
      },
      {
        id: "gamification-balance",
        title: "Пересмотреть уровень геймификации", 
        summary: "Сбалансированная геймификация показывает лучшие результаты для смешанных аудиторий",
        patch: {
          gamificationLevel: "balanced",
        },
      },
    ].slice(0, Math.floor(Math.random() * 2) + 2); // Return 2-3 tips

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      campaignId,
      tips,
    });
  } catch (error) {
    console.error("[api/ai/funnel-recommendation] error", error);
    return NextResponse.json(
      { error: "Failed to provide recommendations" },
      { status: 500 }
    );
  }
}


