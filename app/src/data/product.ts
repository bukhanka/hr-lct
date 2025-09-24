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
  eyebrow: "Мотивационная платформа",
  title: "Алабуга: Командный Центр",
  description:
    "Создавайте геймифицированные HR-воронки, управляйте экономикой кампаний и анализируйте вовлеченность — с поддержкой ИИ-ассистентов на каждом этапе.",
  primaryCta: {
    label: "Запустить демо",
    href: "#contact",
  },
  secondaryCta: {
    label: "Смотреть архитектуру",
    href: "#tech",
  },
  stats: [
    { label: "3 роли", value: "единая платформа" },
    { label: "100%", value: "настройка без кода" },
    { label: "ИИ", value: "встроенный со-пилот" },
  ],
};

export const roleDefinitions: RoleDefinition[] = [
  {
    id: "cadet",
    title: "Кадет",
    subtitle: "Пользователь, проходящий путь",
    description:
      "Иммерсивный игровой опыт с персональной картой миссий, прокачкой компетенций и магазином наград.",
    highlights: [
      "Бортовой журнал с рангами и прогрессом",
      "Звёздная карта миссий с визуальной воронкой",
      "Игровая валюта и коллекция артефактов",
    ],
    accent: "from-indigo-500 to-purple-600",
  },
  {
    id: "architect",
    title: "Архитектор кампании",
    subtitle: "HR-методолог",
    description:
      "Визуальный конструктор, аналитика и управление экономикой для создания кампаний без разработчиков.",
    highlights: [
      "Drag-and-drop конструктор миссий",
      "Гибкая настройка наград и компетенций",
      "Аналитический дашборд с конверсией",
    ],
    accent: "from-sky-500 to-cyan-400",
  },
  {
    id: "officer",
    title: "Офицер миссии",
    subtitle: "Организатор офлайн активностей",
    description:
      "Лёгкая модерация офлайн-ивентов и подтверждение выполнения миссий в одно касание.",
    highlights: [
      "Мобильный интерфейс подтверждений",
      "Сканирование QR и быстрая проверка",
      "История действий и уведомления",
    ],
    accent: "from-amber-500 to-rose-500",
  },
];

export const featureClusters: FeatureCluster[] = [
  {
    id: "journal",
    title: "Бортовой журнал",
    description:
      "Единый экран кадета с рангами, прогресс-барами компетенций и лентой достижений.",
    category: "user",
    items: [
      "HUD с аватаром и текущим рангом",
      "Прогресс до следующей ступени и XP",
      "Лента событий и быстрый доступ к миссиям",
    ],
  },
  {
    id: "mission-map",
    title: "Звёздная карта миссий",
    description:
      "Интерактивная визуализация воронки: от доступных миссий до скрытых планет и будущих веток.",
    category: "user",
    items: [
      "Мультиветвистые кампании",
      "Миссии онлайн/офлайн с разными подтверждениями",
      "Анимации прогресса и открытий",
    ],
  },
  {
    id: "economy",
    title: "Управление экономикой",
    description:
      "Балансировка наград, стоимостей и уровня сложности кампаний в режиме реального времени.",
    category: "hr",
    items: [
      "Настройка XP/маны и цен в магазине",
      "Редактирование компетенций и рангов",
      "Гибкие правила доступа к миссиям",
    ],
  },
  {
    id: "analytics",
    title: "Аналитический дашборд",
    description:
      "Конверсия по каждому узлу воронки, время прохождения и выявление узких мест.",
    category: "hr",
    metrics: ["Conversion Rate", "Avg. Completion Time", "Popular Missions"],
    items: [
      "Funnel chart с проваливанием",
      "Материализованные представления в БД",
      "Фильтрация по кампаниям и когортам",
    ],
  },
  {
    id: "operations",
    title: "Операции миссий",
    description:
      "Инструменты офицера миссии для подтверждения офлайн активностей и модерации сабмитов.",
    category: "ops",
    items: [
      "Сканирование QR и загрузка документов",
      "Быстрые решения approve/reject",
      "Уведомления о статусе миссий",
    ],
  },
];

export const aiCopilotCapabilities: AiCopilotCapability[] = [
  {
    id: "narrative",
    title: "ИИ-сценарист",
    description:
      "Генерирует сюжетные линии кампаний, описания миссий и тексты сообщений на нужном тоне и языке.",
    promptExample:
      "Создай описание миссии по загрузке резюме для студентов-первокурсников в стиле звездного флота.",
  },
  {
    id: "visual",
    title: "ИИ-дизайнер",
    description:
      "Генерирует иконки, фоны и артефакты в едином визуальном стиле по текстовому запросу.",
    promptExample:
      "Иконка для достижения 'Первый контакт', неон, минимализм, sci-fi, 8-bit акценты.",
  },
  {
    id: "audio",
    title: "ИИ-композитор",
    description:
      "Создает фоновые треки и короткие звуковые эффекты, усиливающие эмоции игрока.",
    promptExample:
      "Короткий звук получения артефакта, кристаллический звон, sci-fi, 2 секунды.",
  },
  {
    id: "voice",
    title: "ИИ-диктор",
    description:
      "Озвучивает описания миссий и приветствия голосами персонажей вселенной кампании.",
    promptExample:
      "Озвучь вступительное сообщение от бортового ИИ, голос женский, уверенный и теплый.",
  },
];

export const techStack: TechStackCategory[] = [
  {
    id: "frontend",
    title: "Frontend",
    description:
      "Интерактивные интерфейсы на базе современного React и Tailwind с использованием React Flow и Recharts.",
    items: ["Next.js 15", "React 19", "Tailwind CSS", "React Flow", "Recharts"],
  },
  {
    id: "backend",
    title: "Backend",
    description:
      "API Routes Next.js, Prisma ORM и PostgreSQL обеспечивают надежную работу конструктора и аналитики.",
    items: ["Next.js API Routes", "Prisma", "PostgreSQL", "tRPC (опционально)", "Zod"],
  },
  {
    id: "ai",
    title: "ИИ-интеграции",
    description:
      "Генерация текста, графики, музыки и озвучки через специализированные сервисы.",
    items: ["OpenAI GPT-4.1", "DALL·E 3", "Suno AI", "ElevenLabs", "Stable Diffusion"],
  },
  {
    id: "infrastructure",
    title: "Инфраструктура",
    description:
      "Шаблон для гибкого деплоя: Vercel, edge-функции и фоновые задания на базе планировщиков.",
    items: ["Vercel", "Edge/Serverless Functions", "Background Jobs", "Feature Flags"],
  },
];

