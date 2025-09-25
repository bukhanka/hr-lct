"use client";

import { useState } from "react";
import { X, Upload, CheckCircle, Clock, Star, Zap } from "lucide-react";
import { clsx } from "clsx";

interface UserMission {
  id: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
  submission?: Record<string, unknown>;
  mission: {
    id: string;
    name: string;
    description?: string;
    missionType: string;
    experienceReward: number;
    manaReward: number;
    competencies: Array<{
      points: number;
      competency: {
        name: string;
      };
    }>;
  };
}

interface MissionModalProps {
  userMission: UserMission;
  onSubmit: (missionId: string, submission: Record<string, unknown>) => void;
  onClose: () => void;
}

const missionTypeLabels = {
  FILE_UPLOAD: "Загрузка файла",
  QUIZ: "Тест/Викторина",
  OFFLINE_EVENT: "Офлайн событие",
  CUSTOM: "Произвольное задание",
};

const statusLabels = {
  AVAILABLE: "Доступно",
  IN_PROGRESS: "В процессе",
  PENDING_REVIEW: "На проверке", 
  COMPLETED: "Выполнено",
  LOCKED: "Заблокировано",
};

export function MissionModal({ userMission, onSubmit, onClose }: MissionModalProps) {
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mission, status } = userMission;
  const typeLabel = missionTypeLabels[mission.missionType as keyof typeof missionTypeLabels];
  const statusLabel = statusLabels[status as keyof typeof statusLabels];

  const canSubmit = status === "AVAILABLE" || status === "IN_PROGRESS";
  const isCompleted = status === "COMPLETED";
  const isPending = status === "PENDING_REVIEW";

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    
    const submission: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      type: mission.missionType,
    };

    if (mission.missionType === "FILE_UPLOAD" && submissionFile) {
      // In a real app, you'd upload the file to cloud storage
      submission.fileName = submissionFile.name;
      submission.fileSize = submissionFile.size;
      submission.fileType = submissionFile.type;
    } else if (submissionText) {
      submission.text = submissionText;
    }

    try {
      await onSubmit(mission.id, submission);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSubmissionFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514] border border-white/20 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-xs font-medium text-indigo-200">
                {typeLabel}
              </span>
              <span className={clsx(
                "px-3 py-1 rounded-lg text-xs font-medium",
                isCompleted ? "bg-green-600/20 border border-green-500/30 text-green-200" :
                isPending ? "bg-orange-600/20 border border-orange-500/30 text-orange-200" :
                canSubmit ? "bg-blue-600/20 border border-blue-500/30 text-blue-200" :
                "bg-gray-600/20 border border-gray-500/30 text-gray-200"
              )}>
                {statusLabel}
              </span>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              {mission.name}
            </h2>
            {mission.description && (
              <p className="text-indigo-100/70 leading-relaxed">
                {mission.description}
              </p>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-indigo-200 hover:text-white ml-4"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Rewards and Competencies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <h3 className="text-xs uppercase tracking-[0.3em] text-indigo-200/70 mb-3">
                Награды
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-yellow-400" />
                  <span className="text-white font-medium">
                    {mission.experienceReward} XP
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-blue-400" />
                  <span className="text-white font-medium">
                    {mission.manaReward} маны
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <h3 className="text-xs uppercase tracking-[0.3em] text-indigo-200/70 mb-3">
                Компетенции
              </h3>
              <div className="flex flex-wrap gap-2">
                {mission.competencies?.map((comp, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-sm text-white"
                  >
                    {comp.competency.name} +{comp.points}
                  </span>
                )) || (
                  <span className="text-indigo-100/50 text-sm italic">
                    Компетенции не указаны
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Submission Form */}
          {canSubmit && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Выполнение миссии
              </h3>
              
              {mission.missionType === "FILE_UPLOAD" ? (
                <div>
                  <label className="block text-sm font-medium text-indigo-200 mb-3">
                    Загрузите файл
                  </label>
                  <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-indigo-400/50 transition-colors">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center gap-3"
                    >
                      <Upload size={32} className="text-indigo-300" />
                      <div>
                        <p className="text-white font-medium">
                          {submissionFile ? submissionFile.name : "Выберите файл"}
                        </p>
                        <p className="text-indigo-100/60 text-sm mt-1">
                          PDF, DOC, DOCX, JPG, PNG (макс. 10 МБ)
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-indigo-200 mb-3">
                    Описание выполнения
                  </label>
                  <textarea
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-indigo-100/40 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-colors resize-none"
                    placeholder="Опишите, как вы выполнили задание..."
                  />
                </div>
              )}

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || (!submissionText && !submissionFile)}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-colors font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <Clock size={16} className="animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Завершить миссию
                    </>
                  )}
                </button>
                
                <p className="text-xs text-indigo-100/60">
                  {mission.missionType === "FILE_UPLOAD" 
                    ? "Файл будет проверен автоматически"
                    : "Задание будет отправлено на модерацию"
                  }
                </p>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {isCompleted && (
            <div className="bg-green-600/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle size={20} className="text-green-400" />
              <div>
                <p className="text-green-200 font-medium">Миссия завершена!</p>
                <p className="text-green-100/70 text-sm">
                  Награды начислены на ваш счет
                </p>
              </div>
            </div>
          )}

          {isPending && (
            <div className="bg-orange-600/10 border border-orange-500/20 rounded-2xl p-4 flex items-center gap-3">
              <Clock size={20} className="text-orange-400" />
              <div>
                <p className="text-orange-200 font-medium">Миссия на проверке</p>
                <p className="text-orange-100/70 text-sm">
                  Ожидайте подтверждения от офицера миссии
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-white/20 rounded-xl text-indigo-200 hover:text-white hover:border-white/40 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
