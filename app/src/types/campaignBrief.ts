/**
 * Типы для бизнес-контекста кампании (Campaign Brief)
 * 
 * Это первый уровень планирования кампании — стратегия и бизнес-цели,
 * до настройки геймификации и миссий.
 */

export interface TargetAudience {
  segment: string; // "Студенты 3-4 курса", "Молодые специалисты 25-30 лет"
  size: number; // Ожидаемое количество участников
  characteristics: string[]; // ["Digital natives", "Интерес к технологиям"]
}

export interface ConversionStage {
  stage: string; // Название этапа воронки
  targetRate: number; // Целевая конверсия в % (например, 80 = 80%)
  description?: string; // Дополнительное описание этапа
}

export interface SuccessMetrics {
  primary: string; // Главная метрика успеха
  secondary: string[]; // Дополнительные метрики
  conversionFunnel: ConversionStage[]; // Ожидаемая воронка конверсий
}

export interface CompanyContext {
  why: string; // Зачем компании эта кампания?
  timeline: {
    start: string; // ISO date string
    end: string; // ISO date string
  };
  stakeholders: string[]; // Кто заинтересован в результатах
}

/**
 * Полный бизнес-контекст кампании
 */
export interface CampaignBrief {
  businessGoal: string; // Главная бизнес-цель
  targetAudience: TargetAudience;
  successMetrics: SuccessMetrics;
  companyContext: CompanyContext;
}

/**
 * Частичный Brief для постепенного заполнения в wizard
 */
export type PartialCampaignBrief = Partial<CampaignBrief>;

/**
 * Опции для AI-генерации рекомендаций по brief
 */
export interface BriefAIRequest {
  businessGoal: string;
  funnelType?: string;
  targetAudienceSegment?: string;
}

/**
 * AI-рекомендации по структуре воронки
 */
export interface BriefAISuggestion {
  recommendedStages: ConversionStage[];
  suggestedMetrics: {
    primary: string;
    secondary: string[];
  };
  tips: string[]; // Советы по настройке кампании
}

