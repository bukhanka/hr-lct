import { NextResponse } from "next/server";
import { THEME_PRESETS } from "@/data/theme-presets";
import { getTextModel, AI_CONFIG, getCachedResult, setCachedResult } from "@/lib/ai/gemini-client";
import { SchemaType } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { campaignId, funnelType } = body || {};

    if (!campaignId) {
      return NextResponse.json({ error: "Campaign ID required" }, { status: 400 });
    }

    // Check cache
    const cacheKey = `funnel-rec:${campaignId}`;
    const cached = getCachedResult(cacheKey);
    if (cached) {
      return NextResponse.json({ 
        generatedAt: cached.generatedAt,
        campaignId,
        tips: cached.tips, 
        source: "cached" 
      });
    }

    // Get campaign analytics
    let analyticsData = null;
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          missions: {
            include: {
              userMissions: {
                select: {
                  status: true,
                  startedAt: true,
                  completedAt: true
                }
              }
            }
          }
        }
      });

      if (campaign) {
        // Calculate metrics
        const totalMissions = campaign.missions.length;
        const totalUserMissions = campaign.missions.reduce((sum, m) => sum + m.userMissions.length, 0);
        const completedMissions = campaign.missions.reduce(
          (sum, m) => sum + m.userMissions.filter(um => um.status === 'COMPLETED').length,
          0
        );
        const completionRate = totalUserMissions > 0 ? (completedMissions / totalUserMissions) * 100 : 0;

        analyticsData = {
          totalMissions,
          totalUserMissions,
          completedMissions,
          completionRate: Math.round(completionRate),
          themeConfig: campaign.themeConfig
        };
      }
    } catch (dbError) {
      console.warn("[funnel-recommendation] Could not fetch analytics:", dbError);
    }

    // Try real AI
    try {
      const model = getTextModel();

      const prompt = `
Ты — AI-аналитик по геймификации и воронкам HR-платформы.

Данные кампании:
- ID: ${campaignId}
- Тип воронки: ${funnelType || "не указан"}
${analyticsData ? `
- Всего миссий: ${analyticsData.totalMissions}
- Пользовательских прохождений: ${analyticsData.totalUserMissions}
- Завершенных: ${analyticsData.completedMissions}
- Процент завершения: ${analyticsData.completionRate}%
- Текущая тема: ${JSON.stringify(analyticsData.themeConfig)}
` : '- Аналитика недоступна'}

Задача: Проанализировать воронку и дать 2-4 конкретных рекомендации для улучшения вовлеченности и конверсии.
Каждая рекомендация должна включать:
- Заголовок (краткий)
- Подробное описание проблемы и решения
- Конкретные действия для улучшения

Фокусируйся на:
- Оптимизации темы и визуала
- Балансе геймификации
- Терминологии и нарративе
- Структуре воронки и сложности миссий
`;

      const schema = {
        type: SchemaType.OBJECT,
        properties: {
          recommendations: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: {
                  type: SchemaType.STRING,
                  description: "Уникальный ID рекомендации"
                },
                title: {
                  type: SchemaType.STRING,
                  description: "Краткий заголовок рекомендации"
                },
                summary: {
                  type: SchemaType.STRING,
                  description: "Подробное описание и план действий"
                },
                priority: {
                  type: SchemaType.STRING,
                  description: "Приоритет: high, medium или low"
                },
                estimatedImpact: {
                  type: SchemaType.STRING,
                  description: "Ожидаемое влияние на конверсию"
                }
              },
              required: ["id", "title", "summary", "priority"]
            }
          }
        },
        required: ["recommendations"]
      };

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          ...AI_CONFIG,
          temperature: 0.8,
          responseMimeType: "application/json",
          responseSchema: schema as any,
        }
      });

      const response = result.response.text();
      const aiResult = JSON.parse(response);

      const tips = aiResult.recommendations.map((rec: any) => ({
        id: rec.id,
        title: rec.title,
        summary: rec.summary,
        priority: rec.priority,
        estimatedImpact: rec.estimatedImpact
      }));

      const resultData = {
        generatedAt: new Date().toISOString(),
        tips
      };

      // Cache result
      setCachedResult(cacheKey, resultData);

      return NextResponse.json({ 
        ...resultData,
        campaignId,
        source: "ai" 
      });

    } catch (aiError) {
      console.warn("[funnel-recommendation] AI failed, using fallback:", aiError);

      // Fallback recommendations
      const relevantThemes = THEME_PRESETS.filter((theme) =>
        funnelType ? theme.recommendedFunnel.includes(funnelType) : true
      );
      const allThemes = relevantThemes.length > 0 ? relevantThemes : THEME_PRESETS;
      
      const tips = [
        {
          id: "theme-optimization",
          title: "Оптимизировать визуальную тему",
          summary: `Попробуйте тему "${allThemes[0]?.title}" для лучшего соответствия целевой аудитории`,
          priority: "high",
          patch: allThemes[0]?.config,
        },
        {
          id: "terminology-adjustment",
          title: "Адаптировать терминологию",
          summary: "Настройте названия валют и рангов под язык вашей аудитории для повышения вовлеченности",
          priority: "medium",
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
          priority: "medium",
          patch: {
            gamificationLevel: "balanced",
          },
        },
      ];

      return NextResponse.json({ 
        generatedAt: new Date().toISOString(),
        campaignId,
        tips, 
        source: "fallback" 
      });
    }

  } catch (error) {
    console.error("[api/ai/funnel-recommendation] error", error);
    return NextResponse.json(
      { error: "Failed to provide recommendations" },
      { status: 500 }
    );
  }
}