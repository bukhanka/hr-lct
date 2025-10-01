export type MissionType = 
  | "FILE_UPLOAD" 
  | "QUIZ" 
  | "OFFLINE_EVENT" 
  | "CUSTOM" 
  | "SURVEY" 
  | "CODE_CHALLENGE" 
  | "TEAM_MISSION" 
  | "TIMED_CHALLENGE";

export interface MissionTemplate {
  id: string;
  title: string;
  description: string;
  missionType: MissionType;
  experienceReward: number;
  manaReward: number;
  confirmationType: string;
  minRank: number;
  tags?: string[];
}

export interface MissionCollectionItem {
  templateId: string;
  offset?: { x: number; y: number };
}

export interface MissionCollection {
  id: string;
  title: string;
  description: string;
  items: MissionCollectionItem[];
  recommendFor: string;
}

export interface MapTemplate {
  id: string;
  title: string;
  description: string;
  missions: Array<{
    templateId: string;
    position: { x: number; y: number };
  }>;
  connections: Array<{ sourceIndex: number; targetIndex: number }>;
  recommendFor: string;
}

export const missionTemplates: MissionTemplate[] = [
  {
    id: "upload-docs",
    title: "Загрузка документов",
    description: "Запросите у кадета резюме, сертификаты или другой обязательный пакет файлов.",
    missionType: "FILE_UPLOAD",
    experienceReward: 20,
    manaReward: 5,
    confirmationType: "FILE_CHECK",
    minRank: 1,
    tags: ["onboarding", "compliance"],
  },
  {
    id: "welcome-quiz",
    title: "Приветственный квиз",
    description: "Короткая викторина, знакомящая кандидата с культурой и правилами.",
    missionType: "QUIZ",
    experienceReward: 30,
    manaReward: 10,
    confirmationType: "AUTO",
    minRank: 1,
    tags: ["onboarding", "engagement"],
  },
  {
    id: "company-orientation",
    title: "Знакомство с кампанией",
    description: "Серия карточек с ключевой информацией о миссии и целях кампании.",
    missionType: "CUSTOM",
    experienceReward: 15,
    manaReward: 8,
    confirmationType: "MANUAL_REVIEW",
    minRank: 1,
    tags: ["onboarding", "narrative"],
  },
  {
    id: "offline-meetup",
    title: "Офлайн-встреча",
    description: "Личное мероприятие: экскурсия, тимбилдинг, лекция или собеседование.",
    missionType: "OFFLINE_EVENT",
    experienceReward: 40,
    manaReward: 25,
    confirmationType: "QR_SCAN",
    minRank: 2,
    tags: ["engagement", "hybrid"],
  },
  {
    id: "custom-creative",
    title: "Творческое задание",
    description: "Задача, где кадет показывает soft/hard навыки — видео, презентация, эссе.",
    missionType: "CUSTOM",
    experienceReward: 50,
    manaReward: 35,
    confirmationType: "MANUAL_REVIEW",
    minRank: 2,
    tags: ["assessment", "portfolio"],
  },
  {
    id: "tech-simulation",
    title: "Техническая симуляция",
    description: "Онлайн-тренажер или кейс с автоматической проверкой результата.",
    missionType: "QUIZ",
    experienceReward: 60,
    manaReward: 40,
    confirmationType: "AUTO",
    minRank: 3,
    tags: ["assessment", "skills"],
  },
  {
    id: "mentor-intro",
    title: "Знакомство с наставником",
    description: "Созвон или чат-знакомство, подтверждаемый организатором.",
    missionType: "OFFLINE_EVENT",
    experienceReward: 45,
    manaReward: 30,
    confirmationType: "MANUAL_REVIEW",
    minRank: 2,
    tags: ["engagement", "growth"],
  },
  {
    id: "final-presentation",
    title: "Финальная защита",
    description: "Финальное выступление или демо, после которого выдается оффер/ранг.",
    missionType: "CUSTOM",
    experienceReward: 80,
    manaReward: 50,
    confirmationType: "MANUAL_REVIEW",
    minRank: 4,
    tags: ["final", "assessment"],
  },
  {
    id: "feedback-survey",
    title: "Опрос обратной связи",
    description: "Детальный опрос с открытыми вопросами о впечатлениях и ожиданиях.",
    missionType: "SURVEY",
    experienceReward: 25,
    manaReward: 15,
    confirmationType: "AUTO",
    minRank: 1,
    tags: ["feedback", "engagement"],
  },
  {
    id: "coding-challenge",
    title: "Задача по программированию",
    description: "Алгоритмическая задача с автоматической проверкой кода.",
    missionType: "CODE_CHALLENGE",
    experienceReward: 70,
    manaReward: 45,
    confirmationType: "AUTO",
    minRank: 3,
    tags: ["technical", "assessment"],
  },
  {
    id: "team-project",
    title: "Командный проект",
    description: "Совместная миссия для группы из 3-5 участников.",
    missionType: "TEAM_MISSION",
    experienceReward: 100,
    manaReward: 60,
    confirmationType: "MANUAL_REVIEW",
    minRank: 2,
    tags: ["teamwork", "collaboration"],
  },
  {
    id: "speed-challenge",
    title: "Челлендж на скорость",
    description: "Задание с ограничением по времени — тест реакции и приоритизации.",
    missionType: "TIMED_CHALLENGE",
    experienceReward: 55,
    manaReward: 35,
    confirmationType: "AUTO",
    minRank: 2,
    tags: ["speed", "skills"],
  },
];

export const missionCollections: MissionCollection[] = [
  {
    id: "onboarding-bundle",
    title: "Onboarding Bundle",
    description: "Быстрый старт для новых кадетов: документы, приветствие и знакомство с миссией.",
    recommendFor: "Старт кампании",
    items: [
      { templateId: "company-orientation", offset: { x: 0, y: 0 } },
      { templateId: "upload-docs", offset: { x: 220, y: 140 } },
      { templateId: "welcome-quiz", offset: { x: 420, y: 280 } },
    ],
  },
  {
    id: "engagement-bundle",
    title: "Engagement Bundle",
    description: "Поддержание интереса через сочетание офлайн- и творческих миссий.",
    recommendFor: "Середина воронки",
    items: [
      { templateId: "offline-meetup", offset: { x: 0, y: 0 } },
      { templateId: "mentor-intro", offset: { x: 240, y: 160 } },
      { templateId: "custom-creative", offset: { x: 460, y: 320 } },
    ],
  },
  {
    id: "assessment-bundle",
    title: "Assessment Bundle",
    description: "Комбинация практических проверок для финального отбора кандидатов.",
    recommendFor: "Финальный этап",
    items: [
      { templateId: "tech-simulation", offset: { x: 0, y: 0 } },
      { templateId: "custom-creative", offset: { x: 240, y: 160 } },
      { templateId: "final-presentation", offset: { x: 480, y: 320 } },
    ],
  },
  {
    id: "technical-assessment-bundle",
    title: "Technical Assessment Bundle",
    description: "Продвинутая техническая оценка с кодингом и командной работой.",
    recommendFor: "Tech-позиции",
    items: [
      { templateId: "coding-challenge", offset: { x: 0, y: 0 } },
      { templateId: "team-project", offset: { x: 240, y: 160 } },
      { templateId: "speed-challenge", offset: { x: 480, y: 320 } },
    ],
  },
  {
    id: "engagement-advanced-bundle",
    title: "Advanced Engagement Bundle",
    description: "Инновационные форматы для повышения вовлеченности.",
    recommendFor: "Инновационные кампании",
    items: [
      { templateId: "feedback-survey", offset: { x: 0, y: 0 } },
      { templateId: "team-project", offset: { x: 220, y: 140 } },
      { templateId: "speed-challenge", offset: { x: 440, y: 280 } },
    ],
  },
];

export const mapTemplates: MapTemplate[] = [
  {
    id: "linear-path",
    title: "Linear Path",
    description: "Последовательная цепочка из пяти миссий для прозрачного пути кандидата.",
    recommendFor: "Классические сценарии",
    missions: [
      { templateId: "company-orientation", position: { x: 0, y: 0 } },
      { templateId: "upload-docs", position: { x: 220, y: 80 } },
      { templateId: "welcome-quiz", position: { x: 440, y: 160 } },
      { templateId: "tech-simulation", position: { x: 660, y: 240 } },
      { templateId: "final-presentation", position: { x: 880, y: 320 } },
    ],
    connections: [
      { sourceIndex: 0, targetIndex: 1 },
      { sourceIndex: 1, targetIndex: 2 },
      { sourceIndex: 2, targetIndex: 3 },
      { sourceIndex: 3, targetIndex: 4 },
    ],
  },
  {
    id: "hub-and-spoke",
    title: "Hub & Spoke",
    description: "Центральная миссия-навигация и несколько параллельных веток.",
    recommendFor: "Тематические кампании",
    missions: [
      { templateId: "company-orientation", position: { x: 300, y: 100 } },
      { templateId: "upload-docs", position: { x: 60, y: 0 } },
      { templateId: "welcome-quiz", position: { x: 540, y: 20 } },
      { templateId: "offline-meetup", position: { x: 120, y: 240 } },
      { templateId: "custom-creative", position: { x: 540, y: 260 } },
      { templateId: "final-presentation", position: { x: 780, y: 180 } },
    ],
    connections: [
      { sourceIndex: 1, targetIndex: 0 },
      { sourceIndex: 2, targetIndex: 0 },
      { sourceIndex: 0, targetIndex: 3 },
      { sourceIndex: 0, targetIndex: 4 },
      { sourceIndex: 4, targetIndex: 5 },
    ],
  },
  {
    id: "branching-dual",
    title: "Branching Dual",
    description: "Две параллельные ветки, сходящиеся на финальной миссии.",
    recommendFor: "Сценарии с выбором роли",
    missions: [
      { templateId: "upload-docs", position: { x: 200, y: 60 } },
      { templateId: "welcome-quiz", position: { x: 400, y: 0 } },
      { templateId: "tech-simulation", position: { x: 600, y: 40 } },
      { templateId: "mentor-intro", position: { x: 400, y: 200 } },
      { templateId: "custom-creative", position: { x: 600, y: 240 } },
      { templateId: "final-presentation", position: { x: 820, y: 140 } },
    ],
    connections: [
      { sourceIndex: 0, targetIndex: 1 },
      { sourceIndex: 1, targetIndex: 2 },
      { sourceIndex: 0, targetIndex: 3 },
      { sourceIndex: 3, targetIndex: 4 },
      { sourceIndex: 2, targetIndex: 5 },
      { sourceIndex: 4, targetIndex: 5 },
    ],
  },
  {
    id: "tech-intensive",
    title: "Tech Intensive",
    description: "Интенсивный технический трек с кодингом, челленджами и командными проектами.",
    recommendFor: "Технические специалисты",
    missions: [
      { templateId: "feedback-survey", position: { x: 100, y: 80 } },
      { templateId: "coding-challenge", position: { x: 320, y: 40 } },
      { templateId: "speed-challenge", position: { x: 540, y: 80 } },
      { templateId: "team-project", position: { x: 760, y: 120 } },
      { templateId: "final-presentation", position: { x: 980, y: 160 } },
    ],
    connections: [
      { sourceIndex: 0, targetIndex: 1 },
      { sourceIndex: 1, targetIndex: 2 },
      { sourceIndex: 2, targetIndex: 3 },
      { sourceIndex: 3, targetIndex: 4 },
    ],
  },
];

export function resolveTemplate(templateId: string): MissionTemplate | undefined {
  return missionTemplates.find((template) => template.id === templateId);
}

// Get mission icon based on type
export function getMissionTypeIcon(missionType: MissionType): string {
  const iconMap: Record<MissionType, string> = {
    FILE_UPLOAD: "📄",
    QUIZ: "📝",
    OFFLINE_EVENT: "🎯",
    CUSTOM: "⚙️",
    SURVEY: "💬",
    CODE_CHALLENGE: "💻",
    TEAM_MISSION: "👥",
    TIMED_CHALLENGE: "⏱️",
  };
  return iconMap[missionType] || "🎯";
}

// Get mission type description
export function getMissionTypeDescription(missionType: MissionType): string {
  const descMap: Record<MissionType, string> = {
    FILE_UPLOAD: "Загрузка файлов и документов",
    QUIZ: "Тест или викторина",
    OFFLINE_EVENT: "Офлайн-мероприятие",
    CUSTOM: "Кастомное задание",
    SURVEY: "Опрос с открытыми вопросами",
    CODE_CHALLENGE: "Задача по программированию",
    TEAM_MISSION: "Командная миссия для группы",
    TIMED_CHALLENGE: "Задание с ограничением по времени",
  };
  return descMap[missionType] || "Задание";
}


