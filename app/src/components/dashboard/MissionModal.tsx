"use client";

import { useState } from "react";
import { X, CheckCircle, Clock, Star, Zap } from "lucide-react";
import { clsx } from "clsx";
import { MissionExecutor } from "@/components/missions/MissionExecutor";
import { MissionPayload, MissionSubmission } from "@/lib/mission-types";

interface UserMission {
  id: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
  submission?: any;
  mission: {
    id: string;
    name: string;
    description?: string;
    missionType: string;
    experienceReward: number;
    manaReward: number;
    confirmationType: string;
    payload?: MissionPayload | null;
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
  onSubmit: (missionId: string, submission: any) => void;
  onClose: () => void;
}

const missionTypeLabels = {
  SUBMIT_FORM: "Заполнение формы",
  UPLOAD_FILE: "Загрузка файла", 
  COMPLETE_QUIZ: "Тест/Викторина",
  WATCH_VIDEO: "Просмотр видео",
  ATTEND_OFFLINE: "Офлайн событие",
  ATTEND_ONLINE: "Онлайн событие", 
  EXTERNAL_ACTION: "Внешнее действие",
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mission, status } = userMission;
  const typeLabel = missionTypeLabels[mission.missionType as keyof typeof missionTypeLabels];
  const statusLabel = statusLabels[status as keyof typeof statusLabels];

  const canSubmit = status === "AVAILABLE" || status === "IN_PROGRESS";
  const isCompleted = status === "COMPLETED";
  const isPending = status === "PENDING_REVIEW";

  const handleMissionSubmit = async (submission: MissionSubmission) => {
    setIsSubmitting(true);
    try {
      await onSubmit(mission.id, submission);
    } finally {
      setIsSubmitting(false);
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

          {/* Mission Executor */}
          {canSubmit && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Выполнение миссии
              </h3>
              
              <MissionExecutor
                mission={mission}
                onSubmit={handleMissionSubmit}
                onCancel={onClose}
                isSubmitting={isSubmitting}
              />
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
