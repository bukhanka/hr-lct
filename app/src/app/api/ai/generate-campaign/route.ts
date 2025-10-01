import { NextResponse } from "next/server";
import { getTextModel, AI_CONFIG, getCachedResult, setCachedResult } from "@/lib/ai/gemini-client";
import { SchemaType } from "@google/generative-ai";
import { THEME_PRESETS } from "@/data/theme-presets";

/**
 * Auto-generate entire campaign with missions using Gemini AI
 * This is the "killer feature" - HR can create a full campaign in one click
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      campaignGoal,
      targetAudience,
      funnelType,
      themeId,
      numberOfMissions = 5,
      difficulty = "balanced", // easy, balanced, hard
      // New: Business Brief context
      businessBrief,
      successMetrics,
    } = body;

    if (!campaignGoal) {
      return NextResponse.json(
        { error: "Campaign goal is required" },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `campaign:${campaignGoal}:${funnelType}:${numberOfMissions}`;
    const cached = getCachedResult(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, source: "cached" });
    }

    // Get theme info
    const theme = THEME_PRESETS.find(t => t.id === themeId) || THEME_PRESETS[0];

    try {
      const model = getTextModel();

      const briefContext = businessBrief ? `

БИЗНЕС-КОНТЕКСТ:
- Бизнес-цель: ${businessBrief.businessGoal || campaignGoal}
- Целевая аудитория: ${businessBrief.targetAudience?.segment || targetAudience || "сотрудники компании"} (${businessBrief.targetAudience?.size || "?"} человек)
- Характеристики аудитории: ${businessBrief.targetAudience?.characteristics?.join(", ") || "не указано"}
- Главная метрика успеха: ${businessBrief.successMetrics?.primary || "не указана"}
- Целевая воронка конверсий: ${businessBrief.successMetrics?.conversionFunnel?.map((s: any) => `${s.stage} (${s.targetRate}%)`).join(" → ") || "не указана"}
` : "";

      const prompt = `
Ты — эксперт по геймификации и HR-процессам. Создай полную кампанию для мотивационной платформы.

ПАРАМЕТРЫ КАМПАНИИ:
- Цель кампании: ${campaignGoal}
- Целевая аудитория: ${targetAudience || "сотрудники компании"}
- Тип воронки: ${funnelType || "onboarding"}
- Тема оформления: ${theme.title} - ${theme.description}
- Количество миссий: ${numberOfMissions}
- Уровень сложности: ${difficulty}
${briefContext}

ЗАДАЧА: Создай структурированную кампанию, которая поможет достичь бизнес-цели через серию увлекательных миссий.

${businessBrief ? `
ВАЖНО: Учитывай бизнес-контекст!
- Миссии должны вести к достижению целевых конверсий
- Формулировки и сложность должны соответствовать характеристикам аудитории
- Структура должна отражать этапы воронки из бизнес-контекста
` : ""}

Для кампании создай:
1. Название (короткое, запоминающееся, отражающее бизнес-цель)
2. Описание (2-3 предложения, мотивирующие целевую аудиторию)
3. Сюжетную линию (narrative arc) в стиле темы "${theme.title}"
4. ${numberOfMissions} миссий с:
   - Название (в стиле темы)
   - Описание (что нужно сделать)
   - Тип миссии (SUBMIT_FORM, UPLOAD_FILE, COMPLETE_QUIZ, WATCH_VIDEO, ATTEND_OFFLINE, ATTEND_ONLINE, SURVEY, CODE_CHALLENGE)
   - Награды (XP: 10-100, Mana: 5-50) - больше XP/маны для более важных этапов
   - Компетенции которые прокачивает (1-3 из: communication, teamwork, technical, leadership, analytics, creativity)

Миссии должны:
- Быть логически связаны и постепенно усложняться
- Соответствовать этапам бизнес-воронки (если указаны)
- Быть релевантными для целевой аудитории
`;

      const schema = {
        type: SchemaType.OBJECT,
        properties: {
          campaignTitle: {
            type: SchemaType.STRING,
            description: "Название кампании"
          },
          campaignDescription: {
            type: SchemaType.STRING,
            description: "Описание кампании"
          },
          narrativeArc: {
            type: SchemaType.STRING,
            description: "Общая сюжетная линия"
          },
          missions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                order: {
                  type: SchemaType.NUMBER,
                  description: "Порядковый номер миссии (1-based)"
                },
                name: {
                  type: SchemaType.STRING,
                  description: "Название миссии"
                },
                description: {
                  type: SchemaType.STRING,
                  description: "Подробное описание задания"
                },
                missionType: {
                  type: SchemaType.STRING,
                  description: "Тип миссии из списка"
                },
                experienceReward: {
                  type: SchemaType.NUMBER,
                  description: "Награда в опыте (XP)"
                },
                manaReward: {
                  type: SchemaType.NUMBER,
                  description: "Награда в игровой валюте"
                },
                competencies: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.STRING
                  },
                  description: "Прокачиваемые компетенции"
                },
                estimatedTimeMinutes: {
                  type: SchemaType.NUMBER,
                  description: "Ожидаемое время выполнения в минутах"
                },
                difficulty: {
                  type: SchemaType.STRING,
                  description: "Сложность: easy, medium, hard"
                }
              },
              required: ["order", "name", "description", "missionType", "experienceReward", "manaReward", "competencies"]
            }
          },
          recommendedFlow: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                fromMission: {
                  type: SchemaType.NUMBER,
                  description: "Номер миссии-источника"
                },
                toMission: {
                  type: SchemaType.NUMBER,
                  description: "Номер миссии-назначения"
                },
                type: {
                  type: SchemaType.STRING,
                  description: "Тип связи: sequential или optional"
                }
              }
            },
            description: "Рекомендуемая последовательность и связи между миссиями"
          },
          estimatedCompletionTime: {
            type: SchemaType.STRING,
            description: "Общее время прохождения кампании"
          },
          successMetrics: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.STRING
            },
            description: "Ключевые метрики успеха кампании"
          }
        },
        required: ["campaignTitle", "campaignDescription", "narrativeArc", "missions", "recommendedFlow"]
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
      const campaign = JSON.parse(response);

      // Add theme configuration
      const fullCampaign = {
        ...campaign,
        themeConfig: {
          themeId: theme.id,
          funnelType: funnelType || theme.config.funnelType,
          personas: targetAudience ? [targetAudience] : theme.config.personas,
          gamificationLevel: difficulty === "easy" ? "low" : difficulty === "hard" ? "high" : "balanced",
          palette: theme.config.palette,
          motivationOverrides: theme.config.motivationOverrides
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: "Gemini AI",
          parameters: {
            campaignGoal,
            targetAudience,
            funnelType,
            numberOfMissions,
            difficulty
          }
        }
      };

      // Cache result
      setCachedResult(cacheKey, fullCampaign);

      return NextResponse.json({
        ...fullCampaign,
        source: "ai"
      });

    } catch (aiError) {
      console.error("[generate-campaign] AI failed:", aiError);

      // Fallback: Generate basic campaign structure
      return NextResponse.json({
        campaignTitle: `${campaignGoal} - Кампания`,
        campaignDescription: `Достигните цели: ${campaignGoal}`,
        narrativeArc: "Пройдите серию заданий для достижения вашей цели",
        missions: generateFallbackMissions(numberOfMissions, difficulty),
        recommendedFlow: generateLinearFlow(numberOfMissions),
        themeConfig: theme.config,
        source: "fallback",
        note: "AI generation failed. Using fallback structure. Add GEMINI_API_KEY for AI-powered generation."
      });
    }

  } catch (error) {
    console.error("[api/ai/generate-campaign] error", error);
    return NextResponse.json(
      { error: "Failed to generate campaign" },
      { status: 500 }
    );
  }
}

// Fallback: Generate basic missions structure
function generateFallbackMissions(count: number, difficulty: string) {
  const baseXP = difficulty === "easy" ? 20 : difficulty === "hard" ? 60 : 40;
  const baseMana = difficulty === "easy" ? 10 : difficulty === "hard" ? 30 : 20;

  const types = ["FILE_UPLOAD", "QUIZ", "VIDEO_WATCH", "ATTEND_OFFLINE"];
  const competencies = ["communication", "teamwork", "technical", "leadership"];

  return Array.from({ length: count }, (_, i) => ({
    order: i + 1,
    name: `Миссия ${i + 1}`,
    description: `Выполните задание ${i + 1} для продвижения по кампании`,
    missionType: types[i % types.length],
    experienceReward: baseXP + i * 10,
    manaReward: baseMana + i * 5,
    competencies: [competencies[i % competencies.length]],
    estimatedTimeMinutes: 15 + i * 5,
    difficulty: i === 0 ? "easy" : i === count - 1 ? "hard" : "medium"
  }));
}

// Generate simple linear flow
function generateLinearFlow(count: number) {
  return Array.from({ length: count - 1 }, (_, i) => ({
    fromMission: i + 1,
    toMission: i + 2,
    type: "sequential"
  }));
}
