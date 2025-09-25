export type MissionType = "FILE_UPLOAD" | "QUIZ" | "OFFLINE_EVENT" | "CUSTOM";

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
];

export function resolveTemplate(templateId: string): MissionTemplate | undefined {
  return missionTemplates.find((template) => template.id === templateId);
}


