import { NextResponse } from "next/server";
import { THEME_PRESETS } from "@/data/theme-presets";
import { getTextModel, AI_CONFIG, getCachedResult, setCachedResult } from "@/lib/ai/gemini-client";
import { SchemaType } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { funnelType, personaId, preferredThemeId, campaignGoals } = body || {};

    // Check cache
    const cacheKey = `theme-suggestion:${funnelType}:${personaId}`;
    const cached = getCachedResult(cacheKey);
    if (cached) {
      return NextResponse.json({
        generatedAt: cached.generatedAt,
        personaId,
        suggestion: cached.suggestion,
        source: "cached"
      });
    }

    // Try real AI first
    try {
      const model = getTextModel();
      
      const availableThemes = THEME_PRESETS.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        recommendedFunnel: t.recommendedFunnel
      }));

      const prompt = `
Ты — AI-консультант по геймификации для HR-платформы.

Доступные темы:
${availableThemes.map(t => `- ${t.id}: ${t.title} (${t.description})`).join('\n')}

Задача: Порекомендовать тему для кампании со следующими параметрами:
- Тип воронки: ${funnelType || "не указан"}
- Целевая персона: ${personaId || "не указана"}
- Цели кампании: ${campaignGoals || "адаптация и мотивация"}

Выбери наиболее подходящую тему из списка выше и объясни почему.
Также предложи оптимальный уровень геймификации (low, balanced, high) и кастомизацию терминологии.
`;

      const schema = {
        type: SchemaType.OBJECT,
        properties: {
          recommendedThemeId: {
            type: SchemaType.STRING,
            description: "ID рекомендуемой темы"
          },
          reasoning: {
            type: SchemaType.STRING,
            description: "Объяснение выбора"
          },
          gamificationLevel: {
            type: SchemaType.STRING,
            description: "Уровень геймификации: low, balanced или high"
          },
          motivationOverrides: {
            type: SchemaType.OBJECT,
            properties: {
              xp: { type: SchemaType.STRING },
              mana: { type: SchemaType.STRING },
              rank: { type: SchemaType.STRING }
            }
          }
        },
        required: ["recommendedThemeId", "reasoning", "gamificationLevel"]
      };

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          ...AI_CONFIG,
          responseMimeType: "application/json",
          responseSchema: schema as any,
        }
      });

      const response = result.response.text();
      const aiRecommendation = JSON.parse(response);

      // Find the recommended theme
      const recommendedTheme = THEME_PRESETS.find(t => t.id === aiRecommendation.recommendedThemeId) || THEME_PRESETS[0];

      const suggestion = {
        themeId: recommendedTheme.id,
        funnelType: funnelType || recommendedTheme.config.funnelType,
        personas: personaId ? [personaId] : recommendedTheme.config.personas,
        gamificationLevel: aiRecommendation.gamificationLevel as "low" | "balanced" | "high",
        motivationOverrides: aiRecommendation.motivationOverrides || recommendedTheme.config.motivationOverrides,
        palette: recommendedTheme.config.palette,
        aiReasoning: aiRecommendation.reasoning
      };

      const resultData = {
        generatedAt: new Date().toISOString(),
        suggestion
      };

      // Cache the result
      setCachedResult(cacheKey, resultData);

      return NextResponse.json({
        ...resultData,
        personaId,
        source: "ai"
      });

    } catch (aiError) {
      console.warn("[ai/theme-suggestion] AI failed, using fallback:", aiError);
      
      // Fallback to preset logic
      const preset = preferredThemeId
        ? THEME_PRESETS.find((theme) => theme.id === preferredThemeId)
        : THEME_PRESETS.find((theme) =>
            funnelType ? theme.recommendedFunnel.includes(funnelType) : true
          ) || THEME_PRESETS[0];

      return NextResponse.json({
        generatedAt: new Date().toISOString(),
        personaId,
        suggestion: {
          ...preset.config,
          personas: personaId ? [personaId] : preset.config.personas,
        },
        source: "fallback"
      });
    }

  } catch (error) {
    console.error("[api/ai/theme-suggestion] error", error);
    return NextResponse.json(
      { error: "Failed to generate suggestion" },
      { status: 500 }
    );
  }
}


