// Типы для payload различных типов миссий

// Базовый интерфейс для всех payload
export interface BaseMissionPayload {
  type: string;
}

// QUIZ payload
export interface QuizQuestion {
  id: string;
  text: string;
  type: 'single' | 'multiple' | 'text'; // Тип вопроса
  answers?: {
    id: string;
    text: string;
  }[];
  correctAnswerIds?: string[]; // Для single - один ID, для multiple - массив
  required?: boolean;
}

export interface QuizPayload extends BaseMissionPayload {
  type: 'COMPLETE_QUIZ';
  passingScore: number; // Проходной балл в процентах
  timeLimit?: number; // Ограничение времени в минутах
  allowRetries?: boolean;
  maxRetries?: number;
  questions: QuizQuestion[];
}

// VIDEO payload
export interface VideoPayload extends BaseMissionPayload {
  type: 'WATCH_VIDEO';
  videoUrl: string;
  watchThreshold: number; // Процент просмотра для засчитывания (0.0 - 1.0)
  allowSkip?: boolean; // Можно ли перематывать
  duration?: number; // Длительность в секундах (для прогресс-бара)
}

// FILE UPLOAD payload
export interface FileUploadPayload extends BaseMissionPayload {
  type: 'UPLOAD_FILE';
  templateFileUrl?: string; // Ссылка на шаблон для скачивания
  allowedFormats: string[]; // ['pdf', 'docx', 'jpg']
  maxFileSize: number; // Максимальный размер в байтах
  requiredFiles: number; // Количество требуемых файлов
  instructions?: string; // Дополнительные инструкции
}

// FORM payload
export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'number' | 'email' | 'date';
  required: boolean;
  options?: string[]; // Для select, radio, checkbox
  placeholder?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string; // Regex паттерн
  };
}

export interface FormPayload extends BaseMissionPayload {
  type: 'SUBMIT_FORM';
  title: string;
  description?: string;
  fields: FormField[];
  submitButtonText?: string;
}

// OFFLINE EVENT payload
export interface OfflineEventPayload extends BaseMissionPayload {
  type: 'ATTEND_OFFLINE';
  eventName: string;
  location: string;
  startTime: string; // ISO date string
  endTime: string;
  qrCode?: string; // QR код для подтверждения присутствия
  checkInWindow?: number; // Окно для регистрации в минутах до/после события
}

// ONLINE EVENT payload
export interface OnlineEventPayload extends BaseMissionPayload {
  type: 'ATTEND_ONLINE';
  eventName: string;
  meetingUrl: string;
  startTime: string;
  endTime: string;
  attendanceCheckInterval?: number; // Интервал проверки присутствия в минутах
}

// EXTERNAL ACTION payload
export interface ExternalActionPayload extends BaseMissionPayload {
  type: 'EXTERNAL_ACTION';
  actionDescription: string;
  externalSystemName: string;
  verificationUrl?: string; // URL для проверки выполнения
  instructions: string;
  completionCriteria: string;
}

// CUSTOM payload
export interface CustomPayload extends BaseMissionPayload {
  type: 'CUSTOM';
  description: string;
  instructions: string;
  requirements: string[];
  submissionFormat: 'text' | 'file' | 'link' | 'none';
}

// Union type для всех payload
export type MissionPayload = 
  | QuizPayload 
  | VideoPayload 
  | FileUploadPayload 
  | FormPayload 
  | OfflineEventPayload 
  | OnlineEventPayload 
  | ExternalActionPayload 
  | CustomPayload;

// Типы для submission (ответы пользователя)
export interface QuizSubmission {
  answers: {
    questionId: string;
    answerIds: string[]; // Для multiple choice может быть несколько
    textAnswer?: string; // Для текстовых вопросов
  }[];
  score: number;
  completedAt: string;
  timeSpent: number; // В секундах
}

export interface VideoSubmission {
  watchedDuration: number; // В секундах
  totalDuration: number;
  watchPercentage: number;
  completedAt: string;
}

export interface FileUploadSubmission {
  files: {
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
    fileSize: number;
  }[];
}

export interface FormSubmission {
  responses: {
    fieldId: string;
    value: string | string[];
  }[];
  submittedAt: string;
}

export interface EventSubmission {
  attendedAt: string;
  location?: string; // Для offline событий
  verificationData?: any; // QR код, подпись модератора и т.д.
}

export interface CustomSubmission {
  content: string;
  attachments?: {
    fileName: string;
    fileUrl: string;
  }[];
  submittedAt: string;
}

export type MissionSubmission = 
  | QuizSubmission 
  | VideoSubmission 
  | FileUploadSubmission 
  | FormSubmission 
  | EventSubmission 
  | CustomSubmission;

// Утилитные функции для работы с типами
export function createEmptyQuizPayload(): QuizPayload {
  return {
    type: 'COMPLETE_QUIZ',
    passingScore: 70,
    questions: []
  };
}

export function createEmptyVideoPayload(): VideoPayload {
  return {
    type: 'WATCH_VIDEO',
    videoUrl: '',
    watchThreshold: 0.9
  };
}

export function createEmptyFileUploadPayload(): FileUploadPayload {
  return {
    type: 'UPLOAD_FILE',
    allowedFormats: ['pdf', 'docx'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    requiredFiles: 1
  };
}

export function createEmptyFormPayload(): FormPayload {
  return {
    type: 'SUBMIT_FORM',
    title: 'Новая форма',
    fields: []
  };
}

// Функция для валидации payload по типу миссии
export function validatePayload(missionType: string, payload: any): boolean {
  switch (missionType) {
    case 'COMPLETE_QUIZ':
      return payload.type === 'COMPLETE_QUIZ' && 
             Array.isArray(payload.questions) && 
             typeof payload.passingScore === 'number';
    case 'WATCH_VIDEO':
      return payload.type === 'WATCH_VIDEO' && 
             typeof payload.videoUrl === 'string' && 
             typeof payload.watchThreshold === 'number';
    case 'UPLOAD_FILE':
      return payload.type === 'UPLOAD_FILE' && 
             Array.isArray(payload.allowedFormats) && 
             typeof payload.maxFileSize === 'number';
    case 'SUBMIT_FORM':
      return payload.type === 'SUBMIT_FORM' && 
             Array.isArray(payload.fields);
    default:
      return true; // Для остальных типов пока не валидируем
  }
}
