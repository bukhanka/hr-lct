import { getTextModel, AI_CONFIG, getCachedResult, setCachedResult } from "./gemini-client";
import { SchemaType } from "@google/generative-ai";

export interface TextImproveRequest {
  text: string;
  context?: string;
  theme?: string;
  targetAudience?: string;
  tone?: "formal" | "casual" | "enthusiastic" | "professional";
  variantsCount?: number;
}

export interface TextImproveResult {
  variants: string[];
  originalText: string;
}

/**
 * Improve text using Gemini AI
 */
export async function improveText(request: TextImproveRequest): Promise<TextImproveResult> {
  const {
    text,
    context = "",
    theme = "космическая тематика",
    targetAudience = "кандидаты и сотрудники",
    tone = "enthusiastic",
    variantsCount = 3
  } = request;

  // Check cache
  const cacheKey = `improve:${text}:${theme}:${tone}`;
  const cached = getCachedResult(cacheKey);
  if (cached) {
    return cached;
  }

  const toneDescriptions = {
    formal: "официальный, строгий",
    casual: "неформальный, дружелюбный",
    enthusiastic: "воодушевляющий, мотивирующий",
    professional: "профессиональный, уверенный"
  };

  const prompt = `
Ты — профессиональный копирайтер для геймифицированной HR-платформы.

Тема кампании: ${theme}
Целевая аудитория: ${targetAudience}
Тон: ${toneDescriptions[tone]}
Контекст: ${context || "Нет дополнительного контекста"}

Исходный текст: "${text}"

Задача: Переписать текст, сделав его более увлекательным, соответствующим теме и целевой аудитории. 
Текст должен мотивировать пользователей выполнить миссию.
Создай ${variantsCount} разных варианта.
`;

  try {
    const model = getTextModel();
    
    // Define structured output schema
    const schema = {
      type: SchemaType.OBJECT,
      properties: {
        variants: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.STRING,
            description: "Улучшенный вариант текста"
          },
          description: "Массив улучшенных вариантов текста"
        }
      },
      required: ["variants"]
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
    const parsed = JSON.parse(response);
    
    const resultData = {
      variants: parsed.variants && parsed.variants.length > 0 ? parsed.variants : [text],
      originalText: text
    };

    // Cache result
    setCachedResult(cacheKey, resultData);

    return resultData;
  } catch (error) {
    console.error("Error improving text with Gemini:", error);
    // Return original text as fallback
    return {
      variants: [text],
      originalText: text
    };
  }
}

export interface NarrativeRequest {
  campaignType: string;
  theme: string;
  targetAudience: string;
  missionCount?: number;
  objectives?: string[];
}

export interface NarrativeResult {
  storyArc: string;
  campaignTitle: string;
  campaignDescription: string;
  missionSynopses: {
    order: number;
    title: string;
    synopsis: string;
    narrativeHook: string;
  }[];
}

/**
 * Generate campaign narrative using Gemini AI
 */
export async function generateNarrative(request: NarrativeRequest): Promise<NarrativeResult> {
  const {
    campaignType,
    theme,
    targetAudience,
    missionCount = 5,
    objectives = []
  } = request;

  // Check cache
  const cacheKey = `narrative:${campaignType}:${theme}:${missionCount}`;
  const cached = getCachedResult(cacheKey);
  if (cached) {
    return cached;
  }

  const prompt = `
Ты — сценарист для геймифицированной HR-платформы. Создай увлекательный сюжет для кампании.

Тип кампании: ${campaignType}
Тема: ${theme}
Целевая аудитория: ${targetAudience}
Количество миссий: ${missionCount}
Цели кампании: ${objectives.join(", ") || "адаптация и мотивация сотрудников"}

Создай:
1. Общую сюжетную линию (Story Arc) для всей кампании - 2-3 предложения
2. Название кампании
3. Краткое описание кампании для пользователей
4. Синопсис для каждой из ${missionCount} миссий
`;

  try {
    const model = getTextModel();
    
    // Define structured output schema
    const schema = {
      type: SchemaType.OBJECT,
      properties: {
        storyArc: {
          type: SchemaType.STRING,
          description: "Общая сюжетная линия кампании (2-3 предложения)"
        },
        campaignTitle: {
          type: SchemaType.STRING,
          description: "Название кампании"
        },
        campaignDescription: {
          type: SchemaType.STRING,
          description: "Описание кампании для пользователей"
        },
        missionSynopses: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              order: {
                type: SchemaType.NUMBER,
                description: "Порядковый номер миссии"
              },
              title: {
                type: SchemaType.STRING,
                description: "Название миссии"
              },
              synopsis: {
                type: SchemaType.STRING,
                description: "Краткое описание миссии"
              },
              narrativeHook: {
                type: SchemaType.STRING,
                description: "Захватывающая фраза для мотивации"
              }
            },
            required: ["order", "title", "synopsis", "narrativeHook"]
          },
          description: "Массив синопсисов миссий"
        }
      },
      required: ["storyArc", "campaignTitle", "campaignDescription", "missionSynopses"]
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
    const narrative = JSON.parse(response) as NarrativeResult;

    // Cache result
    setCachedResult(cacheKey, narrative);

    return narrative;
  } catch (error) {
    console.error("Error generating narrative with Gemini:", error);
    // Return fallback
    return {
      storyArc: "Захватывающее путешествие через серию испытаний к достижению цели.",
      campaignTitle: `${theme} - ${campaignType}`,
      campaignDescription: `Пройдите увлекательный путь и достигните новых высот.`,
      missionSynopses: Array.from({ length: missionCount }, (_, i) => ({
        order: i + 1,
        title: `Миссия ${i + 1}`,
        synopsis: `Выполните задание ${i + 1} для продвижения по кампании`,
        narrativeHook: "Новый вызов ждет вас!"
      }))
    };
  }
}
