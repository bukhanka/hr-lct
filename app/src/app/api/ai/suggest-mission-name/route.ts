import { NextResponse } from "next/server";
import { getTextModel, AI_CONFIG, getCachedResult, setCachedResult } from "@/lib/ai/gemini-client";
import { SchemaType } from "@google/generative-ai";

/**
 * Generate creative mission names based on mission type and context
 * Quick AI assist for naming missions in the constructor
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      missionType,
      description = "",
      theme = "galactic-academy",
      campaignContext = "",
      count = 3
    } = body;

    if (!missionType) {
      return NextResponse.json(
        { error: "Mission type is required" },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `mission-name:${missionType}:${theme}:${description}`;
    const cached = getCachedResult(cacheKey);
    if (cached) {
      return NextResponse.json({ suggestions: cached, source: "cached" });
    }

    const themeContext = {
      "galactic-academy": "космическая академия, звезды, галактика",
      "corporate-metropolis": "корпоративный мир, бизнес, город",
      "cyberpunk-hub": "киберпанк, хакеры, будущее",
      "esg-mission": "экология, устойчивое развитие, природа",
      "scientific-expedition": "наука, исследования, открытия"
    }[theme] || "геймификация";

    const missionTypeContext = {
      "FILE_UPLOAD": "загрузка документов или файлов",
      "QUIZ": "тестирование знаний",
      "VIDEO_WATCH": "просмотр обучающего видео",
      "ATTEND_OFFLINE": "посещение мероприятия",
      "SURVEY": "опрос или анкетирование",
      "CODE_CHALLENGE": "программирование или технические задачи",
      "TEAM_MISSION": "командная работа",
      "TIMED_CHALLENGE": "задание на время"
    }[missionType] || "выполнение задания";

    try {
      const model = getTextModel();

      const prompt = `
Ты — креативный копирайтер для геймифицированной HR-платформы.

Тема: ${themeContext}
Тип миссии: ${missionTypeContext}
${description ? `Описание задания: ${description}` : ""}
${campaignContext ? `Контекст кампании: ${campaignContext}` : ""}

Задача: Придумай ${count} креативных, запоминающихся названий для этой миссии.
Названия должны:
- Соответствовать теме
- Быть мотивирующими и увлекательными
- Отражать суть задания
- Быть короткими (2-5 слов)
- Вызывать интерес и желание выполнить задание

Примеры стиля:
- Для космической темы: "Первый контакт", "Навигация в туманности", "Синхронизация с флотом"
- Для корпоративной: "Стратегический анализ", "Презентация проекта", "Встреча с инвесторами"
`;

      const schema = {
        type: SchemaType.OBJECT,
        properties: {
          suggestions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: {
                  type: SchemaType.STRING,
                  description: "Название миссии"
                },
                subtitle: {
                  type: SchemaType.STRING,
                  description: "Краткий подзаголовок (опционально)"
                },
                emoji: {
                  type: SchemaType.STRING,
                  description: "Подходящий эмодзи для миссии"
                }
              },
              required: ["name"]
            }
          }
        },
        required: ["suggestions"]
      };

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          ...AI_CONFIG,
          temperature: 0.9, // Higher temperature for more creativity
          responseMimeType: "application/json",
          responseSchema: schema as any,
        }
      });

      const response = result.response.text();
      const parsed = JSON.parse(response);
      const suggestions = parsed.suggestions || [];

      // Cache result
      setCachedResult(cacheKey, suggestions);

      return NextResponse.json({
        suggestions,
        missionType,
        theme,
        source: "ai"
      });

    } catch (aiError) {
      console.error("[suggest-mission-name] AI failed:", aiError);

      // Fallback suggestions
      const fallbackNames = generateFallbackNames(missionType, theme);

      return NextResponse.json({
        suggestions: fallbackNames,
        missionType,
        theme,
        source: "fallback"
      });
    }

  } catch (error) {
    console.error("[api/ai/suggest-mission-name] error", error);
    return NextResponse.json(
      { error: "Failed to generate mission names" },
      { status: 500 }
    );
  }
}

// Fallback mission names by type and theme
function generateFallbackNames(missionType: string, theme: string) {
  const nameTemplates: Record<string, Record<string, string[]>> = {
    "FILE_UPLOAD": {
      "galactic-academy": [
        "Синхронизация данных флота",
        "Загрузка бортового журнала",
        "Передача координат"
      ],
      "corporate-metropolis": [
        "Предоставление отчетности",
        "Загрузка документов",
        "Передача портфолио"
      ],
      "default": [
        "Загрузка материалов",
        "Предоставление данных",
        "Отправка файлов"
      ]
    },
    "QUIZ": {
      "galactic-academy": [
        "Экзамен в Академии",
        "Тест навигатора",
        "Проверка знаний протокола"
      ],
      "corporate-metropolis": [
        "Аттестация специалиста",
        "Тест компетенций",
        "Оценка навыков"
      ],
      "default": [
        "Проверка знаний",
        "Тестирование",
        "Квалификационный экзамен"
      ]
    },
    "VIDEO_WATCH": {
      "galactic-academy": [
        "Брифинг капитана",
        "Обучение пилотированию",
        "Инструктаж по протоколу"
      ],
      "corporate-metropolis": [
        "Тренинг по продукту",
        "Обучающий вебинар",
        "Презентация стратегии"
      ],
      "default": [
        "Обучающее видео",
        "Просмотр материалов",
        "Видео-инструктаж"
      ]
    },
    "ATTEND_OFFLINE": {
      "galactic-academy": [
        "Собрание на флагмане",
        "Встреча экипажа",
        "Совет Академии"
      ],
      "corporate-metropolis": [
        "Корпоративное мероприятие",
        "Общее собрание",
        "Встреча команды"
      ],
      "default": [
        "Оффлайн встреча",
        "Посещение мероприятия",
        "Личная встреча"
      ]
    }
  };

  const typeNames = nameTemplates[missionType] || nameTemplates["default"] || {};
  const names = typeNames[theme] || typeNames["default"] || ["Новая миссия"];

  return names.map((name, i) => ({
    name,
    subtitle: "",
    emoji: getMissionEmoji(missionType)
  }));
}

function getMissionEmoji(missionType: string): string {
  const emojiMap: Record<string, string> = {
    "FILE_UPLOAD": "📤",
    "QUIZ": "📝",
    "VIDEO_WATCH": "🎥",
    "ATTEND_OFFLINE": "🤝",
    "SURVEY": "📊",
    "CODE_CHALLENGE": "💻",
    "TEAM_MISSION": "👥",
    "TIMED_CHALLENGE": "⏱️"
  };
  return emojiMap[missionType] || "⭐";
}
