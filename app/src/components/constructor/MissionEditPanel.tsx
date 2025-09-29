"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, Save, Sparkles, Plus, Trash2, Play, FileText, Video, Upload, Calendar, Settings2, Package, Trophy, Star } from "lucide-react";
import { PanelSection, FieldLabel, NumberStepper } from "./ui";
import { 
  MissionPayload,
  QuizPayload, 
  VideoPayload, 
  FileUploadPayload, 
  FormPayload,
  OfflineEventPayload,
  OnlineEventPayload,
  createEmptyQuizPayload,
  createEmptyVideoPayload,
  createEmptyFileUploadPayload,
  createEmptyFormPayload
} from "@/lib/mission-types";
import { 
  POPULAR_PLATFORMS_INFO, 
  isVideoUrl, 
  getPlatformName,
  getPlatformFeatures
} from "@/lib/video-platforms";
import { OptimizedVideoPlayer } from "@/components/common/OptimizedVideoPlayer";
import clsx from "clsx";

const MIN_PANEL_WIDTH = 420;
const DEFAULT_PANEL_WIDTH = 620;
const MAX_PANEL_WIDTH = 960;

interface Mission {
  id: string;
  name: string;
  description?: string;
  missionType: string;
  experienceReward: number;
  manaReward: number;
  positionX: number;
  positionY: number;
  confirmationType: string;
  minRank: number;
  competencies: any[];
  payload?: MissionPayload | null;
}

interface Competency {
  id: string;
  name: string;
  iconUrl?: string;
}

interface MissionEditPanelProps {
  mission: Mission;
  onSave: (mission: Mission) => void | Promise<void>;
  onClose: () => void;
  campaignId: string;
}

const missionTypes = [
  { value: "COMPLETE_QUIZ", label: "🧠 Тест/Викторина", icon: FileText },
  { value: "WATCH_VIDEO", label: "📹 Просмотр видео", icon: Video },
  { value: "UPLOAD_FILE", label: "📎 Загрузка файла", icon: Upload },
  { value: "SUBMIT_FORM", label: "📝 Заполнение формы", icon: FileText },
  { value: "ATTEND_OFFLINE", label: "🏢 Офлайн событие", icon: Calendar },
  { value: "ATTEND_ONLINE", label: "💻 Онлайн событие", icon: Play },
  { value: "EXTERNAL_ACTION", label: "🔗 Внешнее действие", icon: Play },
  { value: "CUSTOM", label: "⚡ Произвольное задание", icon: Sparkles },
];

const confirmationTypes = [
  { value: "AUTO", label: "Автоматически" },
  { value: "MANUAL_REVIEW", label: "Ручная проверка" },
  { value: "QR_SCAN", label: "QR-код" },
  { value: "FILE_CHECK", label: "Проверка файла" },
];

export function MissionEditPanel({ mission, onSave, onClose }: MissionEditPanelProps) {
  const [formData, setFormData] = useState<Mission>(mission);
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [activeSection, setActiveSection] = useState<string>("overview");
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [panelWidth, setPanelWidth] = useState<number>(DEFAULT_PANEL_WIDTH);
  const resizeStateRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const sectionConfig = useMemo(
    () =>
      [
        { id: "overview", label: "Карточка", icon: FileText },
        { id: "mission-settings", label: "Механика", icon: Settings2 },
        { id: "rewards", label: "Награды", icon: Trophy },
        { id: "competencies", label: "Компетенции", icon: Package },
      ] as const,
    []
  );

  const getSectionScrollTop = useCallback((node: HTMLDivElement, container: HTMLDivElement) => {
    const containerRect = container.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    return nodeRect.top - containerRect.top + container.scrollTop;
  }, []);

  const handleSectionChange = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
    const container = scrollContainerRef.current;
    const node = sectionRefs.current[sectionId];

    if (container && node) {
      const targetTop = Math.max(0, getSectionScrollTop(node, container) - 16);
      container.scrollTo({ top: targetTop, behavior: "smooth" });
    }
  }, [getSectionScrollTop]);

  const handleScrollSpy = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const scrollTop = container.scrollTop;
    let currentSection = sectionConfig[0]?.id ?? "overview";

    sectionConfig.forEach(({ id }) => {
      const node = sectionRefs.current[id];
      if (!node) {
        return;
      }

      const sectionTop = getSectionScrollTop(node, container);
      if (scrollTop + 140 >= sectionTop) {
        currentSection = id;
      }
    });

    setActiveSection((prev) => (prev === currentSection ? prev : currentSection));
  }, [getSectionScrollTop, sectionConfig]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ top: 0, behavior: "auto" });
    }
    setActiveSection("overview");
  }, [mission.id]);

  useEffect(() => {
    setPanelWidth(DEFAULT_PANEL_WIDTH);
  }, [mission.id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handlePanelWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = element;

    if (
      (event.deltaY < 0 && scrollTop <= 0) ||
      (event.deltaY > 0 && scrollTop + clientHeight >= scrollHeight)
    ) {
      event.preventDefault();
    }
    event.stopPropagation();
  }, []);

  const handleResizeDrag = useCallback((event: MouseEvent) => {
    const state = resizeStateRef.current;
    if (!state) {
      return;
    }

    const delta = state.startX - event.clientX;
    const nextWidth = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, state.startWidth + delta));
    setPanelWidth(nextWidth);
  }, []);

  const stopResizing = useCallback(() => {
    resizeStateRef.current = null;
    document.body.style.cursor = "";
    document.removeEventListener("mousemove", handleResizeDrag);
    document.removeEventListener("mouseup", stopResizing);
  }, [handleResizeDrag]);

  const handleResizeStart = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    resizeStateRef.current = {
      startX: event.clientX,
      startWidth: panelWidth,
    };
    document.body.style.cursor = "ew-resize";
    document.addEventListener("mousemove", handleResizeDrag);
    document.addEventListener("mouseup", stopResizing);
  }, [handleResizeDrag, panelWidth, stopResizing]);

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleResizeDrag);
      document.removeEventListener("mouseup", stopResizing);
    };
  }, [handleResizeDrag, stopResizing]);

  // Helper functions for payload management
  const createDefaultPayload = (missionType: string): MissionPayload | null => {
    switch (missionType) {
      case 'COMPLETE_QUIZ':
        return createEmptyQuizPayload();
      case 'WATCH_VIDEO':
        return createEmptyVideoPayload();
      case 'UPLOAD_FILE':
        return createEmptyFileUploadPayload();
      case 'SUBMIT_FORM':
        return createEmptyFormPayload();
      case 'ATTEND_OFFLINE':
        return {
          type: 'ATTEND_OFFLINE',
          eventName: '',
          location: '',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          checkInWindow: 15
        } as OfflineEventPayload;
      case 'ATTEND_ONLINE':
        return {
          type: 'ATTEND_ONLINE',
          eventName: '',
          meetingUrl: '',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          attendanceCheckInterval: 10
        } as OnlineEventPayload;
      default:
        return null;
    }
  };

  const handleMissionTypeChange = (newType: string) => {
    const newPayload = createDefaultPayload(newType);
    setFormData(prev => ({
      ...prev,
      missionType: newType,
      payload: newPayload
    }));
  };

  const updatePayload = (updates: any) => {
    setFormData(prev => ({
      ...prev,
      payload: prev.payload ? { ...prev.payload, ...updates } : null
    }));
  };

  useEffect(() => {
    fetch("/api/competencies")
      .then((res) => res.json())
      .then((data) => setCompetencies(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setFormData(mission);
  }, [mission]);

  const handleInputChange = (field: keyof Mission, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCompetencyChange = (competencyId: string, points: number) => {
    setFormData((prev) => {
      const existingCompetencies = prev.competencies || [];
      const index = existingCompetencies.findIndex((comp) => comp.competencyId === competencyId);

      if (index >= 0) {
        if (points === 0) {
          return {
            ...prev,
            competencies: existingCompetencies.filter((comp) => comp.competencyId !== competencyId),
          };
        }

        const updated = [...existingCompetencies];
        updated[index].points = points;
        return {
          ...prev,
          competencies: updated,
        };
      }

      if (points > 0) {
        return {
          ...prev,
          competencies: [...existingCompetencies, { competencyId, points }],
        };
      }

      return prev;
    });
  };

  const getCompetencyPoints = (competencyId: string) => {
    const comp = formData.competencies?.find((c) => c.competencyId === competencyId);
    return comp?.points || 0;
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await Promise.resolve(onSave(formData));
    } finally {
      setIsLoading(false);
    }
  };

  const generateAiSuggestion = () => {
    setAiSuggestion("Загружаем предложение ИИ...");
    setTimeout(() => {
      const suggestions = [
        "Кадет, для прохождения в следующий сектор галактики, загрузите доказательство вашей квалификации в виде сертификата или диплома в бортовой компьютер.",
        "Командир поручает вам пройти симуляцию боевых действий. Покажите своё мастерство в виртуальном тренажёре и докажите готовность к реальным миссиям.",
        "Внимание, кадет! Для участия в межгалактической экспедиции необходимо посетить брифинг в командном центре. Ваше присутствие обязательно!",
      ];
      setAiSuggestion(suggestions[Math.floor(Math.random() * suggestions.length)]);
    }, 1500);
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion || aiSuggestion === "Загружаем предложение ИИ...") {
      return;
    }
    handleInputChange("description", aiSuggestion);
    setAiSuggestion("");
  };

  const renderPayloadConfiguration = () => {
    const { payload, missionType } = formData;

    switch (missionType) {
      case 'COMPLETE_QUIZ':
        return renderQuizConfiguration(payload as QuizPayload);
      case 'WATCH_VIDEO':
        return renderVideoConfiguration(payload as VideoPayload);
      case 'UPLOAD_FILE':
        return renderFileUploadConfiguration(payload as FileUploadPayload);
      case 'SUBMIT_FORM':
        return renderFormConfiguration(payload as FormPayload);
      case 'ATTEND_OFFLINE':
        return renderOfflineEventConfiguration(payload as OfflineEventPayload);
      case 'ATTEND_ONLINE':
        return renderOnlineEventConfiguration(payload as OnlineEventPayload);
      default:
        return null;
    }
  };

  const renderQuizConfiguration = (payload: QuizPayload) => {
    if (!payload) return null;

    return (
      <PanelSection title="🧠 Настройки квиза" description="Конфигурация теста">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <FieldLabel label="Проходной балл (%)" />
              <NumberStepper 
                value={payload.passingScore} 
                min={1} 
                max={100} 
                step={5}
                onChange={(value) => updatePayload({ passingScore: value })} 
              />
            </div>
            <div className="space-y-2">
              <FieldLabel label="Лимит времени (мин)" />
              <NumberStepper 
                value={payload.timeLimit || 0} 
                min={0} 
                max={120} 
                step={5}
                onChange={(value) => updatePayload({ timeLimit: value })} 
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <FieldLabel label="Вопросы" />
              <button
                onClick={() => addQuestion()}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/20 px-2 py-1 text-xs text-indigo-200 hover:bg-indigo-500/30"
              >
                <Plus size={12} />
                Добавить
              </button>
            </div>
            
            {payload.questions.map((question, index) => (
              <div key={question.id} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={question.text}
                      onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                      placeholder="Текст вопроса"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-indigo-100/40 focus:border-indigo-400 focus:outline-none"
                    />
                    <select 
                      value={question.type}
                      onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    >
                      <option value="single">Один вариант</option>
                      <option value="multiple">Несколько вариантов</option>
                      <option value="text">Текстовый ответ</option>
                    </select>
                  </div>
                  <button
                    onClick={() => removeQuestion(index)}
                    className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {question.type !== 'text' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-indigo-200/70">Варианты ответов</span>
                      <button
                        onClick={() => addAnswerOption(index)}
                        className="text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        + Добавить вариант
                      </button>
                    </div>
                    {question.answers?.map((answer, answerIndex) => (
                      <div key={answer.id} className="flex items-center gap-2">
                        <input
                          type={question.type === 'single' ? 'radio' : 'checkbox'}
                          checked={question.correctAnswerIds?.includes(answer.id)}
                          onChange={(e) => toggleCorrectAnswer(index, answer.id, e.target.checked)}
                          className="text-indigo-500"
                        />
                        <input
                          type="text"
                          value={answer.text}
                          onChange={(e) => updateAnswerOption(index, answerIndex, e.target.value)}
                          placeholder="Текст варианта"
                          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder:text-indigo-100/40"
                        />
                        <button
                          onClick={() => removeAnswerOption(index, answerIndex)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </PanelSection>
    );
  };

  const renderVideoConfiguration = (payload: VideoPayload) => {
    if (!payload) return null;

    const isValid = isVideoUrl(payload.videoUrl);
    const platformName = isValid ? getPlatformName(payload.videoUrl) : '';
    const features = isValid ? getPlatformFeatures(payload.videoUrl) : null;

    return (
      <PanelSection title="📹 Настройки видео" description="Конфигурация просмотра">
        <div className="space-y-4">
          {/* Platform support info */}
          <div className="bg-indigo-500/10 rounded-xl border border-indigo-500/30 p-4">
            <h4 className="text-white font-medium mb-3">Поддерживаемые платформы</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {POPULAR_PLATFORMS_INFO.map(platform => (
                <div key={platform.name} className="text-indigo-200/70">
                  • {platform.name}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel label="URL видео" />
            <input
              type="url"
              value={payload.videoUrl}
              onChange={(e) => updatePayload({ videoUrl: e.target.value })}
              placeholder="https://youtube.com/watch?v=... или https://rutube.ru/video/..."
              className={`w-full rounded-xl border px-4 py-3 text-sm text-white placeholder:text-indigo-100/40 focus:outline-none transition ${
                payload.videoUrl && !isValid
                  ? 'border-red-500/50 bg-red-500/10 focus:border-red-400'
                  : 'border-white/10 bg-white/5 focus:border-indigo-400'
              }`}
            />
            
            {/* Platform detection feedback */}
            {payload.videoUrl && (
              <div className="text-xs">
                {isValid ? (
                  <div className="flex items-center gap-2 text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Платформа: {platformName}</span>
                    {features?.embed ? (
                      <span className="text-indigo-300">(встраивается)</span>
                    ) : (
                      <span className="text-yellow-400">(внешняя ссылка)</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span>Неподдерживаемая платформа или неверный URL</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <FieldLabel label="Процент просмотра" />
              <NumberStepper 
                value={Math.round(payload.watchThreshold * 100)} 
                min={10} 
                max={100} 
                step={5}
                onChange={(value) => updatePayload({ watchThreshold: value / 100 })} 
              />
            </div>
            <div className="space-y-2">
              <FieldLabel label="Длительность (сек)" />
              <NumberStepper 
                value={payload.duration || 0} 
                min={0} 
                max={7200} 
                step={30}
                onChange={(value) => updatePayload({ duration: value })} 
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allowSkip"
              checked={payload.allowSkip}
              onChange={(e) => updatePayload({ allowSkip: e.target.checked })}
              disabled={features && !features.disableSeek}
              className="rounded text-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
            />
            <label htmlFor="allowSkip" className={`text-sm ${features && !features.disableSeek ? 'text-indigo-100/50' : 'text-white'}`}>
              Разрешить перемотку
              {features && !features.disableSeek && (
                <span className="text-xs text-yellow-400 ml-1">(не поддерживается платформой)</span>
              )}
            </label>
          </div>
          
          {/* Video Preview */}
          {payload.videoUrl && isValid && (
            <div className="mt-4 space-y-2">
              <FieldLabel label="Предварительный просмотр" />
              <OptimizedVideoPlayer
                videoUrl={payload.videoUrl}
                title="Предпросмотр видео миссии"
                mode="preview"
                showPlatformInfo={true}
                preloadThumbnail={true}
                options={{
                  controls: true,
                  disableSeek: !payload.allowSkip
                }}
                onPlay={() => console.log("Preview video started playing")}
                onError={(error) => console.warn("Video preview error:", error)}
              />
            </div>
          )}
        </div>
      </PanelSection>
    );
  };

  const renderFileUploadConfiguration = (payload: FileUploadPayload) => {
    if (!payload) return null;

    return (
      <PanelSection title="📎 Настройки загрузки" description="Конфигурация файлов">
        <div className="space-y-4">
          <div className="space-y-2">
            <FieldLabel label="Ссылка на шаблон" />
            <input
              type="url"
              value={payload.templateFileUrl || ''}
              onChange={(e) => updatePayload({ templateFileUrl: e.target.value })}
              placeholder="/templates/example.docx"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-indigo-100/40 focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <FieldLabel label="Инструкции" />
            <textarea
              value={payload.instructions || ''}
              onChange={(e) => updatePayload({ instructions: e.target.value })}
              placeholder="Дополнительные инструкции для загрузки"
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-indigo-100/40 focus:border-indigo-400 focus:outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <FieldLabel label="Макс. размер (МБ)" />
              <NumberStepper 
                value={Math.round(payload.maxFileSize / (1024 * 1024))} 
                min={1} 
                max={100} 
                step={1}
                onChange={(value) => updatePayload({ maxFileSize: value * 1024 * 1024 })} 
              />
            </div>
            <div className="space-y-2">
              <FieldLabel label="Кол-во файлов" />
              <NumberStepper 
                value={payload.requiredFiles} 
                min={1} 
                max={10} 
                step={1}
                onChange={(value) => updatePayload({ requiredFiles: value })} 
              />
            </div>
          </div>
          <div className="space-y-2">
            <FieldLabel label="Допустимые форматы" />
            <div className="flex flex-wrap gap-2">
              {['pdf', 'docx', 'doc', 'jpg', 'png', 'zip'].map(format => (
                <label key={format} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={payload.allowedFormats.includes(format)}
                    onChange={(e) => {
                      const formats = e.target.checked 
                        ? [...payload.allowedFormats, format]
                        : payload.allowedFormats.filter(f => f !== format);
                      updatePayload({ allowedFormats: formats });
                    }}
                    className="rounded text-indigo-500 focus:ring-indigo-500"
                  />
                  <span className="text-white">{format}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </PanelSection>
    );
  };

  const renderFormConfiguration = (payload: FormPayload) => {
    if (!payload) return null;

    return (
      <PanelSection title="📝 Настройки формы" description="Конфигурация полей">
        <div className="space-y-4">
          <div className="space-y-2">
            <FieldLabel label="Заголовок формы" />
            <input
              type="text"
              value={payload.title}
              onChange={(e) => updatePayload({ title: e.target.value })}
              placeholder="Название формы"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-indigo-100/40 focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <FieldLabel label="Описание" />
            <textarea
              value={payload.description || ''}
              onChange={(e) => updatePayload({ description: e.target.value })}
              placeholder="Описание формы"
              rows={2}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-indigo-100/40 focus:border-indigo-400 focus:outline-none resize-none"
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <FieldLabel label="Поля формы" />
              <button
                onClick={() => addFormField()}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/20 px-2 py-1 text-xs text-indigo-200 hover:bg-indigo-500/30"
              >
                <Plus size={12} />
                Добавить поле
              </button>
            </div>
            {payload.fields.map((field, index) => (
              <div key={field.id} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateFormField(index, 'label', e.target.value)}
                      placeholder="Название поля"
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-indigo-100/40"
                    />
                    <select 
                      value={field.type}
                      onChange={(e) => updateFormField(index, 'type', e.target.value)}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                    >
                      <option value="text">Текст</option>
                      <option value="textarea">Многострочный текст</option>
                      <option value="select">Выбор из списка</option>
                      <option value="radio">Радиокнопки</option>
                      <option value="checkbox">Чекбокс</option>
                      <option value="number">Число</option>
                      <option value="email">Email</option>
                      <option value="date">Дата</option>
                    </select>
                  </div>
                  <button
                    onClick={() => removeFormField(index)}
                    className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateFormField(index, 'required', e.target.checked)}
                      className="rounded text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-white">Обязательное</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PanelSection>
    );
  };

  const renderOfflineEventConfiguration = (payload: OfflineEventPayload) => {
    if (!payload) return null;

    return (
      <PanelSection title="🏢 Настройки события" description="Конфигурация офлайн мероприятия">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <FieldLabel label="Название события" />
              <input
                type="text"
                value={payload.eventName}
                onChange={(e) => updatePayload({ eventName: e.target.value })}
                placeholder="Название мероприятия"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-indigo-100/40 focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <FieldLabel label="Место проведения" />
              <input
                type="text"
                value={payload.location}
                onChange={(e) => updatePayload({ location: e.target.value })}
                placeholder="Адрес или помещение"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-indigo-100/40 focus:border-indigo-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <FieldLabel label="Время начала" />
              <input
                type="datetime-local"
                value={payload.startTime.slice(0, 16)}
                onChange={(e) => updatePayload({ startTime: new Date(e.target.value).toISOString() })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <FieldLabel label="Время окончания" />
              <input
                type="datetime-local"
                value={payload.endTime.slice(0, 16)}
                onChange={(e) => updatePayload({ endTime: new Date(e.target.value).toISOString() })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-indigo-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <FieldLabel label="Окно регистрации (мин)" />
            <NumberStepper 
              value={payload.checkInWindow || 15} 
              min={5} 
              max={60} 
              step={5}
              onChange={(value) => updatePayload({ checkInWindow: value })} 
            />
          </div>
        </div>
      </PanelSection>
    );
  };

  const renderOnlineEventConfiguration = (payload: OnlineEventPayload) => {
    if (!payload) return null;

    return (
      <PanelSection title="💻 Настройки онлайн события" description="Конфигурация веб-мероприятия">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <FieldLabel label="Название события" />
              <input
                type="text"
                value={payload.eventName}
                onChange={(e) => updatePayload({ eventName: e.target.value })}
                placeholder="Название мероприятия"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-indigo-100/40 focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <FieldLabel label="Ссылка на встречу" />
              <input
                type="url"
                value={payload.meetingUrl}
                onChange={(e) => updatePayload({ meetingUrl: e.target.value })}
                placeholder="https://zoom.us/j/..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-indigo-100/40 focus:border-indigo-400 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <FieldLabel label="Время начала" />
              <input
                type="datetime-local"
                value={payload.startTime.slice(0, 16)}
                onChange={(e) => updatePayload({ startTime: new Date(e.target.value).toISOString() })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <FieldLabel label="Время окончания" />
              <input
                type="datetime-local"
                value={payload.endTime.slice(0, 16)}
                onChange={(e) => updatePayload({ endTime: new Date(e.target.value).toISOString() })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-indigo-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </PanelSection>
    );
  };

  // Quiz helper functions
  const addQuestion = () => {
    if (!formData.payload || formData.payload.type !== 'COMPLETE_QUIZ') return;
    
    const newQuestion = {
      id: `q_${Date.now()}`,
      text: '',
      type: 'single' as const,
      required: true,
      answers: [
        { id: `a_${Date.now()}_1`, text: '' },
        { id: `a_${Date.now()}_2`, text: '' }
      ],
      correctAnswerIds: []
    };

    const payload = formData.payload as QuizPayload;
    updatePayload({
      questions: [...payload.questions, newQuestion]
    });
  };

  const removeQuestion = (index: number) => {
    if (!formData.payload || formData.payload.type !== 'COMPLETE_QUIZ') return;
    
    const payload = formData.payload as QuizPayload;
    const questions = payload.questions.filter((_, i) => i !== index);
    updatePayload({ questions });
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    if (!formData.payload || formData.payload.type !== 'COMPLETE_QUIZ') return;
    
    const payload = formData.payload as QuizPayload;
    const questions = [...payload.questions];
    questions[index] = { ...questions[index], [field]: value };
    updatePayload({ questions });
  };

  const addAnswerOption = (questionIndex: number) => {
    if (!formData.payload || formData.payload.type !== 'COMPLETE_QUIZ') return;
    
    const payload = formData.payload as QuizPayload;
    const questions = [...payload.questions];
    const newAnswer = { id: `a_${Date.now()}`, text: '' };
    questions[questionIndex] = {
      ...questions[questionIndex],
      answers: [...(questions[questionIndex].answers || []), newAnswer]
    };
    updatePayload({ questions });
  };

  const removeAnswerOption = (questionIndex: number, answerIndex: number) => {
    if (!formData.payload || formData.payload.type !== 'COMPLETE_QUIZ') return;
    
    const payload = formData.payload as QuizPayload;
    const questions = [...payload.questions];
    questions[questionIndex] = {
      ...questions[questionIndex],
      answers: questions[questionIndex].answers?.filter((_, i) => i !== answerIndex)
    };
    updatePayload({ questions });
  };

  const updateAnswerOption = (questionIndex: number, answerIndex: number, text: string) => {
    if (!formData.payload || formData.payload.type !== 'COMPLETE_QUIZ') return;
    
    const payload = formData.payload as QuizPayload;
    const questions = [...payload.questions];
    const answers = [...(questions[questionIndex].answers || [])];
    answers[answerIndex] = { ...answers[answerIndex], text };
    questions[questionIndex] = { ...questions[questionIndex], answers };
    updatePayload({ questions });
  };

  const toggleCorrectAnswer = (questionIndex: number, answerId: string, checked: boolean) => {
    if (!formData.payload || formData.payload.type !== 'COMPLETE_QUIZ') return;
    
    const payload = formData.payload as QuizPayload;
    const questions = [...payload.questions];
    const question = questions[questionIndex];
    
    let correctAnswerIds = question.correctAnswerIds || [];
    
    if (question.type === 'single') {
      correctAnswerIds = checked ? [answerId] : [];
    } else {
      correctAnswerIds = checked
        ? [...correctAnswerIds, answerId]
        : correctAnswerIds.filter(id => id !== answerId);
    }
    
    questions[questionIndex] = { ...question, correctAnswerIds };
    updatePayload({ questions });
  };

  // Form helper functions
  const addFormField = () => {
    if (!formData.payload || formData.payload.type !== 'SUBMIT_FORM') return;
    
    const newField = {
      id: `field_${Date.now()}`,
      label: '',
      type: 'text' as const,
      required: false
    };

    const payload = formData.payload as FormPayload;
    updatePayload({
      fields: [...payload.fields, newField]
    });
  };

  const removeFormField = (index: number) => {
    if (!formData.payload || formData.payload.type !== 'SUBMIT_FORM') return;
    
    const payload = formData.payload as FormPayload;
    const fields = payload.fields.filter((_, i) => i !== index);
    updatePayload({ fields });
  };

  const updateFormField = (index: number, field: string, value: any) => {
    if (!formData.payload || formData.payload.type !== 'SUBMIT_FORM') return;
    
    const payload = formData.payload as FormPayload;
    const fields = [...payload.fields];
    fields[index] = { ...fields[index], [field]: value };
    updatePayload({ fields });
  };

  return (
    <aside
      className="pointer-events-auto fixed inset-0 z-[200] flex items-stretch justify-end bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 z-10 h-full w-full cursor-pointer"
        aria-label="Закрыть редактор"
        onClick={onClose}
      />

      <div className="relative z-20 flex h-full flex-row items-stretch justify-end">
        <div
          className="absolute inset-y-0 right-full w-1 cursor-ew-resize rounded-l-full bg-indigo-400/40 opacity-0 transition hover:opacity-100"
          onMouseDown={handleResizeStart}
          role="separator"
          aria-orientation="vertical"
          aria-label="Изменить ширину панели"
        />
        <div
          className="flex h-full flex-col border-l border-white/10 bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514] shadow-[0_32px_64px_rgba(4,2,18,0.7)]"
          style={{ width: `${panelWidth}px` }}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-7 py-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-indigo-200/60">
                <Star size={14} className="text-indigo-300" />
                <span>Редактирование миссии</span>
              </div>
              <h2 className="text-2xl font-semibold text-white leading-tight">{formData.name || "Новая миссия"}</h2>
              <p className="text-[11px] uppercase tracking-[0.23em] text-indigo-200/50">Настройте карточку, механику и награды</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 p-2 text-indigo-200 transition hover:border-white/30 hover:text-white"
              aria-label="Закрыть"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="sticky top-0 z-30 flex items-center gap-2 border-b border-white/10 bg-gradient-to-r from-[#0b0924]/95 to-[#050514]/95 px-7 py-3 backdrop-blur">
            {sectionConfig.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSectionChange(section.id)}
                className={clsx(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium uppercase tracking-[0.2em] transition",
                  activeSection === section.id
                    ? "bg-indigo-500/20 text-white"
                    : "text-indigo-200/60 hover:text-white hover:bg-white/10"
                )}
              >
                <section.icon size={14} className="text-indigo-300" />
                {section.label}
              </button>
            ))}
          </nav>

          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-7 py-6"
            onScroll={handleScrollSpy}
            onWheel={handlePanelWheel}
            style={{ overscrollBehavior: "contain" }}
          >
            <div className="grid gap-6">
              <div ref={(node) => (sectionRefs.current["overview"] = node)}>
                <PanelSection
                  title="Основное"
                  description="Название и описание миссии"
                  action={
                    <button
                      onClick={generateAiSuggestion}
                      className="inline-flex items-center gap-2 rounded-lg bg-indigo-500/80 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500"
                    >
                      <Sparkles size={12} />
                      ИИ-помощь
                    </button>
                  }
                >
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <FieldLabel label="Название миссии" hint="Для кадета" htmlFor="mission-name" />
                      <input
                        id="mission-name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-indigo-100/40 focus:border-indigo-400 focus:outline-none"
                        placeholder="Например, 'Досье кадета'"
                      />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel label="Описание" htmlFor="mission-desc" />
                      <textarea
                        id="mission-desc"
                        value={formData.description || ""}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        rows={4}
                        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-indigo-100/40 focus:border-indigo-400 focus:outline-none"
                        placeholder="Опишите миссию в стилистике кампании..."
                      />
                    </div>
                  </div>

                  {aiSuggestion && (
                    <div className="rounded-2xl border border-indigo-500/20 bg-indigo-600/15 p-4 text-sm text-indigo-100/70">
                      <div className="flex items-start justify-between gap-3">
                        <p className="flex-1 leading-snug">{aiSuggestion}</p>
                        {aiSuggestion !== "Загружаем предложение ИИ..." && (
                          <button
                            onClick={applyAiSuggestion}
                            className="rounded-lg bg-indigo-500/80 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-500"
                          >
                            Применить
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </PanelSection>
              </div>

              <div ref={(node) => (sectionRefs.current["mission-settings"] = node)}>
                <PanelSection title="Тип и подтверждение" description="Определите формат миссии">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <FieldLabel label="Тип миссии" />
                      <select
                        value={formData.missionType}
                        onChange={(e) => handleMissionTypeChange(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-indigo-400 focus:outline-none"
                      >
                        {missionTypes.map((type) => (
                          <option key={type.value} value={type.value} className="bg-slate-900">
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <FieldLabel label="Подтверждение" />
                      <select
                        value={formData.confirmationType}
                        onChange={(e) => handleInputChange("confirmationType", e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-indigo-400 focus:outline-none"
                      >
                        {confirmationTypes.map((type) => (
                          <option key={type.value} value={type.value} className="bg-slate-900">
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {renderPayloadConfiguration()}
                </PanelSection>
              </div>

              <div ref={(node) => (sectionRefs.current["rewards"] = node)}>
                <PanelSection title="Награды" description="Сбалансируйте экономику кампании">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <FieldLabel label="Опыт (XP)" />
                      <NumberStepper value={formData.experienceReward} min={0} max={500} step={5} onChange={(value) => handleInputChange("experienceReward", value)} />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel label="Мана" />
                      <NumberStepper value={formData.manaReward} min={0} max={500} step={5} onChange={(value) => handleInputChange("manaReward", value)} />
                    </div>
                    <div className="space-y-2">
                      <FieldLabel label="Мин. ранг" />
                      <NumberStepper value={formData.minRank} min={1} max={10} onChange={(value) => handleInputChange("minRank", value)} />
                    </div>
                  </div>
                </PanelSection>
              </div>

              <div ref={(node) => (sectionRefs.current["competencies"] = node)}>
                <PanelSection title="Компетенции" description="Прокачиваемые навыки">
                  <div className="space-y-3">
                    {competencies.length === 0 && (
                      <p className="text-sm text-indigo-100/40">Компетенции не найдены. Создайте их через API или админку.</p>
                    )}
                    {competencies.map((competency) => (
                      <div key={competency.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-3">
                        <div>
                          <p className="text-sm font-medium text-white">{competency.name}</p>
                          <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-100/50">Макс 10 очков</p>
                        </div>
                        <NumberStepper value={getCompetencyPoints(competency.id)} min={0} max={10} onChange={(value) => handleCompetencyChange(competency.id, value)} />
                      </div>
                    ))}
                  </div>
                </PanelSection>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 bg-black/20 px-7 py-5 backdrop-blur-lg">
            <button onClick={onClose} className="rounded-xl border border-white/10 px-5 py-2 text-sm text-indigo-100/80 transition hover:border-white/30 hover:text-white">
              Отменить
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500/90 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />
              {isLoading ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
