import { NextResponse } from "next/server";
import { getTextModel, AI_CONFIG, getCachedResult, setCachedResult } from "@/lib/ai/gemini-client";
import { SchemaType } from "@google/generative-ai";

/**
 * AI-генерация рекомендаций для Campaign Brief
 * Помогает HR определить метрики и структуру воронки на основе бизнес-цели
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { businessGoal, funnelType, targetAudienceSegment } = body;

    if (!businessGoal) {
      return NextResponse.json(
        { error: "Business goal is required" },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `brief:${businessGoal}:${funnelType}`;
    const cached = getCachedResult(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, source: "cached" });
    }

    try {
      const model = getTextModel();

      const prompt = `
Ты — эксперт по HR-аналитике и воронкам конверсии. Помоги HR-специалисту спланировать кампанию.

Бизнес-цель кампании: ${businessGoal}
Тип воронки: ${funnelType || "не указан"}
Целевая аудитория: ${targetAudienceSegment || "не указана"}

Задача: Предложи структуру измерения успеха этой кампании.

Создай:
1. Главную метрику успеха (краткая формулировка)
2. 2-3 дополнительные метрики (что еще важно отслеживать)
3. Воронку конверсий — этапы процесса с реалистичными целевыми конверсиями в процентах
4. 3-5 практических советов по настройке кампании

Важно:
- Конверсии должны быть реалистичными (не завышай цифры)
- Учитывай специфику типа воронки
- Формулировки должны быть понятными и измеримыми
`;

      const schema = {
        type: SchemaType.OBJECT,
        properties: {
          primaryMetric: {
            type: SchemaType.STRING,
            description: "Главная метрика успеха кампании",
          },
          secondaryMetrics: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.STRING,
            },
            description: "Дополнительные метрики (2-3 штуки)",
          },
          recommendedStages: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                stage: {
                  type: SchemaType.STRING,
                  description: "Название этапа воронки",
                },
                targetRate: {
                  type: SchemaType.NUMBER,
                  description: "Целевая конверсия в процентах (0-100)",
                },
                description: {
                  type: SchemaType.STRING,
                  description: "Краткое описание этапа",
                },
              },
              required: ["stage", "targetRate"],
            },
            description: "Этапы воронки конверсий",
          },
          tips: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.STRING,
            },
            description: "Практические советы по настройке кампании (3-5 советов)",
          },
        },
        required: ["primaryMetric", "secondaryMetrics", "recommendedStages", "tips"],
      };

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          ...AI_CONFIG,
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: schema as any,
        },
      });

      const response = result.response.text();
      const suggestion = JSON.parse(response);

      // Cache the result
      setCachedResult(cacheKey, suggestion);

      return NextResponse.json({
        ...suggestion,
        source: "ai",
      });
    } catch (aiError) {
      console.error("[brief-suggestion] AI failed:", aiError);

      // Fallback: Generate basic recommendations
      return NextResponse.json({
        primaryMetric: "Конверсия участников на финальный этап",
        secondaryMetrics: [
          "Среднее время прохождения кампании",
          "Уровень вовлеченности (% активных участников)",
        ],
        recommendedStages: getFallbackStages(funnelType),
        tips: [
          "Начните с малого — запустите пилотную кампанию на 20-30 человек",
          "Настройте автоматические уведомления о прогрессе участников",
          "Отслеживайте точки отсева — где участники чаще всего останавливаются",
          "Собирайте обратную связь после каждого ключевого этапа",
        ],
        source: "fallback",
        note: "AI generation failed. Using fallback recommendations. Add GEMINI_API_KEY for AI-powered suggestions.",
      });
    }
  } catch (error) {
    console.error("[api/ai/brief-suggestion] error", error);
    return NextResponse.json(
      { error: "Failed to generate brief suggestions" },
      { status: 500 }
    );
  }
}

function getFallbackStages(funnelType?: string) {
  const stagesByType: Record<string, Array<{ stage: string; targetRate: number; description?: string }>> = {
    onboarding: [
      { stage: "Регистрация", targetRate: 100, description: "Начальная точка воронки" },
      { stage: "Первая миссия", targetRate: 85, description: "Первый контакт с платформой" },
      { stage: "Середина пути", targetRate: 70, description: "Участник активно вовлечен" },
      { stage: "Финальная миссия", targetRate: 60, description: "Близко к завершению" },
    ],
    assessment: [
      { stage: "Подача заявки", targetRate: 100, description: "Старт процесса отбора" },
      { stage: "Первый тест", targetRate: 75, description: "Скрининговый этап" },
      { stage: "Кейс-интервью", targetRate: 50, description: "Глубокая оценка" },
      { stage: "Финальное решение", targetRate: 30, description: "Получение оффера" },
    ],
    engagement: [
      { stage: "Первая активность", targetRate: 90, description: "Начальное взаимодействие" },
      { stage: "Регулярное участие", targetRate: 70, description: "Формирование привычки" },
      { stage: "Активный участник", targetRate: 50, description: "Высокая вовлеченность" },
    ],
    growth: [
      { stage: "Диагностика навыков", targetRate: 90, description: "Оценка текущего уровня" },
      { stage: "Обучающий контент", targetRate: 75, description: "Прохождение материалов" },
      { stage: "Практические задания", targetRate: 60, description: "Применение знаний" },
      { stage: "Итоговая аттестация", targetRate: 50, description: "Подтверждение компетенций" },
    ],
    esg: [
      { stage: "Знакомство с проектом", targetRate: 95, description: "Первичная информация" },
      { stage: "Первое участие", targetRate: 70, description: "Пробное вовлечение" },
      { stage: "Регулярный вклад", targetRate: 50, description: "Системное участие" },
    ],
  };

  return stagesByType[funnelType || "onboarding"] || stagesByType.onboarding;
}

