"use client";

import React, { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, ExternalLink, QrCode, CheckCircle, Zap } from "lucide-react";
import { OfflineEventPayload, OnlineEventPayload, EventSubmission } from "@/lib/mission-types";

interface Mission {
  id: string;
  name: string;
  description?: string;
  experienceReward: number;
  manaReward: number;
  confirmationType: string;
}

interface EventExecutorProps {
  mission: Mission;
  payload: OfflineEventPayload | OnlineEventPayload;
  onSubmit: (submission: EventSubmission) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function EventExecutor({ mission, payload, onSubmit, onCancel, isSubmitting = false }: EventExecutorProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCompleted, setIsCompleted] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const isOfflineEvent = payload.type === 'ATTEND_OFFLINE';
  const startTime = new Date(payload.startTime);
  const endTime = new Date(payload.endTime);
  
  // For offline events, calculate check-in window
  const checkInStart = isOfflineEvent 
    ? new Date(startTime.getTime() - ((payload as OfflineEventPayload).checkInWindow || 15) * 60 * 1000)
    : startTime;
  const checkInEnd = isOfflineEvent
    ? new Date(endTime.getTime() + ((payload as OfflineEventPayload).checkInWindow || 15) * 60 * 1000)
    : endTime;

  const isEventActive = currentTime >= checkInStart && currentTime <= checkInEnd;
  const isEventUpcoming = currentTime < checkInStart;
  const isEventEnded = currentTime > checkInEnd;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAttendance = async (verificationData?: any) => {
    const submission: EventSubmission = {
      attendedAt: new Date().toISOString(),
      location: isOfflineEvent ? (payload as OfflineEventPayload).location : undefined,
      verificationData
    };

    await onSubmit(submission);
    setIsCompleted(true);
  };

  const handleQRScan = () => {
    // In a real implementation, this would open camera and scan QR code
    // For demo, we'll simulate a successful scan
    setShowQRScanner(true);
    setTimeout(() => {
      setShowQRScanner(false);
      handleAttendance({ qrCodeScanned: true, timestamp: new Date().toISOString() });
    }, 2000);
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (start: Date, end: Date) => {
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours} ч ${diffMinutes} мин`;
    }
    return `${diffMinutes} мин`;
  };

  const getTimeUntilEvent = () => {
    if (isEventEnded) return 'Событие завершено';
    
    const target = isEventUpcoming ? startTime : endTime;
    const diffMs = target.getTime() - currentTime.getTime();
    
    if (diffMs <= 0) return isEventUpcoming ? 'Событие началось' : 'Событие завершено';
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    const prefix = isEventUpcoming ? 'До начала: ' : 'До окончания: ';
    
    if (hours > 0) {
      return `${prefix}${hours} ч ${minutes} мин`;
    }
    return `${prefix}${minutes} мин`;
  };

  if (showQRScanner) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-indigo-500/20 flex items-center justify-center animate-pulse">
            <QrCode size={32} className="text-indigo-400" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Сканирование QR-кода</h1>
            <p className="text-indigo-100/70">
              Наведите камеру на QR-код для подтверждения присутствия...
            </p>
          </div>

          <div className="w-64 h-64 mx-auto bg-white/10 rounded-xl border-2 border-dashed border-indigo-400 flex items-center justify-center">
            <div className="animate-ping w-4 h-4 bg-indigo-500 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Присутствие подтверждено!</h1>
            <p className="text-green-400">
              Вы успешно отметились на событии
            </p>
            <p className="text-indigo-100/70">
              Спасибо за участие в "{payload.eventName}"!
            </p>
          </div>

          <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30 p-6">
            <div className="flex items-center justify-center gap-2 text-indigo-200 mb-2">
              <Zap size={16} />
              <span className="font-medium">Награда получена</span>
            </div>
            <div className="text-2xl font-bold text-white">
              +{mission.experienceReward} XP • +{mission.manaReward} маны
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8 space-y-4">
        <h1 className="text-2xl font-bold text-white">{mission.name}</h1>
        {mission.description && (
          <p className="text-indigo-100/70">{mission.description}</p>
        )}
      </div>

      {/* Event Info */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-8 mb-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <Calendar size={20} className="text-indigo-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white mb-2">{payload.eventName}</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-indigo-100/70">
                <Clock size={16} />
                <span>
                  {formatDateTime(startTime)} - {formatDateTime(endTime)}
                  <span className="ml-2 text-indigo-200">({formatDuration(startTime, endTime)})</span>
                </span>
              </div>
              
              {isOfflineEvent ? (
                <div className="flex items-center gap-3 text-indigo-100/70">
                  <MapPin size={16} />
                  <span>{(payload as OfflineEventPayload).location}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-indigo-100/70">
                  <ExternalLink size={16} />
                  <a 
                    href={(payload as OnlineEventPayload).meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Ссылка на встречу
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Time Status */}
        <div className={`p-4 rounded-lg border ${
          isEventActive 
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : isEventUpcoming
            ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {isEventActive 
                ? '🟢 Событие сейчас активно'
                : isEventUpcoming
                ? '🟡 Событие ожидается'
                : '🔴 Событие завершено'
              }
            </span>
            <span className="text-sm">
              {getTimeUntilEvent()}
            </span>
          </div>
        </div>

        {/* Check-in window for offline events */}
        {isOfflineEvent && (
          <div className="mt-4 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
            <p className="text-indigo-200 text-sm font-medium mb-1">
              Окно регистрации
            </p>
            <p className="text-indigo-100/70 text-sm">
              {formatDateTime(checkInStart)} - {formatDateTime(checkInEnd)}
            </p>
            <p className="text-indigo-100/50 text-xs mt-2">
              Вы можете отметиться за {(payload as OfflineEventPayload).checkInWindow} минут до и после события
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-4">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-xl border border-white/10 text-indigo-100/80 hover:border-white/30 hover:text-white transition"
          >
            Отмена
          </button>
        )}
        
        {mission.confirmationType === 'QR_SCAN' && isOfflineEvent ? (
          <button
            onClick={handleQRScan}
            disabled={!isEventActive || isSubmitting}
            className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            <QrCode size={16} />
            {isSubmitting 
              ? 'Сканирование...'
              : !isEventActive
              ? (isEventUpcoming ? 'Ожидание события' : 'Событие завершено')
              : 'Сканировать QR-код'
            }
          </button>
        ) : (
          <button
            onClick={() => handleAttendance()}
            disabled={!isEventActive || isSubmitting}
            className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            <CheckCircle size={16} />
            {isSubmitting 
              ? 'Подтверждение...'
              : !isEventActive
              ? (isEventUpcoming ? 'Ожидание события' : 'Событие завершено')
              : 'Подтвердить присутствие'
            }
          </button>
        )}
      </div>

      {!isEventActive && (
        <div className="text-center mt-6">
          <p className="text-indigo-100/50 text-sm">
            {isEventUpcoming 
              ? 'Кнопка подтверждения будет активна во время события'
              : 'Время для подтверждения присутствия истекло'
            }
          </p>
        </div>
      )}
    </div>
  );
}
