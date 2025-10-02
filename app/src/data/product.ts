export type RoleId = "cadet" | "architect" | "officer";

export interface RoleDefinition {
  id: RoleId;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  accent: string;
}

export interface FeatureCluster {
  id: string;
  title: string;
  description: string;
  category: "user" | "hr" | "ops";
  metrics?: string[];
  items: string[];
}

export interface AiCopilotCapability {
  id: string;
  title: string;
  description: string;
  promptExample: string;
}

export interface TechStackCategory {
  id: string;
  title: string;
  items: string[];
  description: string;
}

export const heroContent = {
  eyebrow: "ИИ-усиленный конструктор HR-кампаний",
  title: "Командный Центр",
  description:
    "Визуальный конструктор геймифицированных HR-воронок с live-аналитикой и ИИ-генерацией контента. Создавайте кампании за 1 день вместо 2 месяцев, экономьте сотни часов работы и повышайте конверсию на 30-50%.",
  primaryCta: {
    label: "Попробовать демо",
    href: "/auth/sign-in",
  },
  secondaryCta: {
    label: "Смотреть технологии",
    href: "#tech",
  },
  stats: [
    { label: "Экономия времени", value: "95%" },
    { label: "ROI за год", value: ">1000%" },
    { label: "Конверсия", value: "+30-50%" },
  ],
};

export const roleDefinitions: RoleDefinition[] = [
  {
    id: "architect",
    title: "HR-Архитектор",
    subtitle: "Создатель и управляющий кампаниями",
    description:
      "Визуальный конструктор для создания воронок без кода. Live-аналитика показывает проблемы за 2 дня вместо месяца. ИИ генерирует контент — экономия 100,000₽ на копирайтере и дизайнере.",
    highlights: [
      "Drag-and-drop редактор миссий — без разработчиков",
      "Live Analytics: проблемы видны сразу, не через месяц",
      "ИИ-генерация текстов и изображений за секунды",
      "QR-онбординг: 26 часов работы → 0 часов",
    ],
    accent: "from-sky-500 to-cyan-400",
  },
  {
    id: "cadet",
    title: "Кадет",
    subtitle: "Участник кампании",
    description:
      "Галактическая карта миссий снижает отсев на 40%. Прогресс виден на каждом шаге. Ранги, компетенции и достижения мотивируют дойти до конца.",
    highlights: [
      "Галактическая карта — весь путь виден сразу",
      "Ранги и компетенции — прозрачный прогресс",
      "Награды и достижения — реальная мотивация",
      "Mobile-first интерфейс для удобства",
    ],
    accent: "from-indigo-500 to-purple-600",
  },
  {
    id: "officer",
    title: "Офицер",
    subtitle: "Модератор офлайн-миссий",
    description:
      "QR-сканер для мгновенного подтверждения офлайн-активностей. HMAC-защита от подделок. Кадеты получают награды моментально.",
    highlights: [
      "QR-сканирование за секунды",
      "HMAC-защита от мошенничества",
      "Мгновенное начисление наград",
    ],
    accent: "from-amber-500 to-rose-500",
  },
];

export const featureClusters: FeatureCluster[] = [
  {
    id: "constructor",
    title: "Визуальный конструктор",
    description:
      "Drag-and-drop редактор воронок без кода. Создавайте кампании за 1 день вместо 2 месяцев. Экономия 95% времени.",
    category: "hr",
    metrics: ["2 месяца → 1 день", "95% экономии времени"],
    items: [
      "React Flow граф-редактор миссий",
      "Визуальные связи между этапами",
      "Настройка условий без программирования",
    ],
  },
  {
    id: "live-analytics",
    title: "Live Status Board",
    description:
      "Пульс кампании в реальном времени. Видите проблемы за 2 дня, а не через месяц. Обновление каждые 30 секунд.",
    category: "hr",
    metrics: ["Обновление: 30 сек", "Проблемы: 2 дня vs 30 дней"],
    items: [
      "Активные участники прямо сейчас",
      "Где люди застряли (>5 дней)",
      "Автоматические сигналы к действию",
    ],
  },
  {
    id: "goal-progress",
    title: "Goal Progress Dashboard",
    description:
      "Прогресс к бизнес-целям с прогнозами. Видите отсев по миссиям и можете исправить прямо сейчас.",
    category: "hr",
    metrics: ["Прогноз достижения цели", "Воронка конверсии"],
    items: [
      "Связь с реальными KPI из брифа",
      "Воронка показывает где отваливаются",
      "Проактивное управление кампанией",
    ],
  },
  {
    id: "user-segments",
    title: "Автоматическая сегментация",
    description:
      "Система сама раскладывает участников и подсказывает действия. HR не анализирует вручную.",
    category: "hr",
    items: [
      "Champions, In Progress, Stalled, Inactive",
      "Автоматические рекомендации действий",
      "Фильтры и детальные карточки",
    ],
  },
  {
    id: "qr-onboarding",
    title: "QR-онбординг",
    description:
      "Мгновенная регистрация участников через QR-код. 26 часов работы HR → 0 часов. Без ошибок ввода.",
    category: "hr",
    metrics: ["26 часов → 0 часов", "0% ошибок"],
    items: [
      "Генерация QR за 10 секунд",
      "Постер для массовых мероприятий",
      "Мгновенный старт, не ждут неделю",
    ],
  },
  {
    id: "galactic-map",
    title: "Галактическая карта",
    description:
      "Интерактивная карта миссий снижает отсев на 40%. Участники видят весь путь, прогресс и смысл.",
    category: "user",
    metrics: ["30% → 70% конверсия", "+40 кандидатов из 100"],
    items: [
      "Визуализация всего пути сразу",
      "Статусы миссий: завершено/активно/заблокировано",
      "Анимации прогресса и мотивация",
    ],
  },
  {
    id: "rank-system",
    title: "Система рангов",
    description:
      "Сложная логика проверки 3 условий: опыт, миссии, компетенции. Мотивирует участников расти.",
    category: "user",
    items: [
      "Проверка XP, миссий и компетенций",
      "Конфетти и уведомления при повышении",
      "Кастомизация рангов под тему кампании",
    ],
  },
  {
    id: "qr-offline",
    title: "QR-система для офлайн",
    description:
      "Офицер сканирует QR кадета на мероприятии. HMAC-защита от подделок. Мгновенные награды.",
    category: "ops",
    items: [
      "Сканирование QR за секунды",
      "HMAC-подпись для безопасности",
      "История подтверждений",
    ],
  },
];

export const aiCopilotCapabilities: AiCopilotCapability[] = [
  {
    id: "text-enhancement",
    title: "ИИ-улучшение текстов (Gemini 2.0)",
    description:
      "Превращает скучные описания в захватывающие тексты за 3 секунды. Экономия 5,000₽ на каждом тексте. 20 миссий = 100,000₽ → 0₽.",
    promptExample:
      'Было: "Пройди тест на знание компании" → Стало: "🚀 Космическая навигация: Проверь свои знания карты звёздной базы"',
  },
  {
    id: "image-generation",
    title: "ИИ-генерация изображений (Gemini 2.0)",
    description:
      "Создаёт уникальные иконки и фоны за 4 секунды. Без дизайнера, без стоков. Экономия 50,000₽/месяц на дизайнере.",
    promptExample:
      "космический компас → [уникальная иконка в стиле sci-fi за 4 сек]",
  },
  {
    id: "brief-assistant",
    title: "ИИ-помощник в бриф-визарде",
    description:
      "Предлагает цели, KPI и структуру кампании на основе анализа контекста. Ускоряет заполнение брифа в 5 раз.",
    promptExample:
      "Кампания для адаптации джунов → ИИ предлагает: цели, миссии, метрики успеха",
  },
  {
    id: "content-studio",
    title: "Content Studio (Cmd+K)",
    description:
      "Единое окно для генерации любого контента: тексты, изображения, идеи. Работает в любом месте интерфейса через Cmd+K.",
    promptExample:
      "Cmd+K в редакторе → промпт → 4 сек → готовый контент",
  },
];

export const techStack: TechStackCategory[] = [
  {
    id: "frontend",
    title: "Frontend",
    description:
      "Современный React стек с полной типобезопасностью. React Flow для визуального граф-редактора миссий. Recharts для аналитики.",
    items: ["Next.js 15", "React 19", "TypeScript", "Tailwind CSS", "React Flow", "Framer Motion"],
  },
  {
    id: "backend",
    title: "Backend",
    description:
      "Next.js API Routes и Prisma ORM обеспечивают типобезопасный доступ к PostgreSQL. Аналитика на материализованных представлениях.",
    items: ["Next.js API Routes", "Prisma ORM", "PostgreSQL", "JWT Auth", "Zod"],
  },
  {
    id: "ai",
    title: "ИИ (Google Gemini 2.0)",
    description:
      "Полная интеграция с Google Gemini 2.0 Flash: генерация текстов за 3 сек, изображений за 4 сек. Стоимость ~$0.01 на кампанию.",
    items: ["Gemini 2.0 Flash", "Text Generation", "Image Generation (Imagen 3.0)", "Content Studio"],
  },
  {
    id: "features",
    title: "Уникальные фичи",
    description:
      "Визуальный граф-редактор, live-аналитика с auto-refresh, A/B тестирование, HMAC-защита QR, темизация, PWA.",
    items: ["React Flow Graph", "Live Analytics", "A/B Testing", "HMAC QR", "4 Theme Presets", "PWA"],
  },
];

