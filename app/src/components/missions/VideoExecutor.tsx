"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, CheckCircle, Clock, Zap, Volume2, ExternalLink, Info } from "lucide-react";
import { VideoPayload, VideoSubmission } from "@/lib/mission-types";
import { 
  detectVideoPlatform, 
  getEmbedUrl, 
  getPlatformName, 
  getPlatformFeatures,
  isVideoUrl 
} from "@/lib/video-platforms";
import { OptimizedVideoPlayer } from "@/components/common/OptimizedVideoPlayer";

interface Mission {
  id: string;
  name: string;
  description?: string;
  experienceReward: number;
  manaReward: number;
}

interface VideoExecutorProps {
  mission: Mission;
  payload: VideoPayload;
  onSubmit: (submission: VideoSubmission) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function VideoExecutor({ mission, payload, onSubmit, onCancel, isSubmitting = false }: VideoExecutorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watchedPercent, setWatchedPercent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasStartedWatching, setHasStartedWatching] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Create default payload if missing
  const safePayload = payload || {
    type: 'WATCH_VIDEO' as const,
    videoUrl: '',
    watchThreshold: 0.9,
    allowSkip: true,
    duration: 0
  };

  // Detect platform and get embed URL
  const platform = detectVideoPlatform(safePayload.videoUrl);
  const platformName = getPlatformName(safePayload.videoUrl);
  const platformFeatures = getPlatformFeatures(safePayload.videoUrl);
  
  const getVideoEmbedUrl = (url: string) => {
    return getEmbedUrl(url, {
      autoplay: false,
      controls: safePayload.allowSkip !== false,
      disableSeek: !safePayload.allowSkip
    });
  };

  const isEmbeddableVideo = (url: string) => {
    return isVideoUrl(url) && platformFeatures?.embed;
  };

  useEffect(() => {
    // Simulate video progress tracking
    if (isPlaying && hasStartedWatching) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          const newPercent = duration > 0 ? (newTime / duration) * 100 : 0;
          setWatchedPercent(newPercent);

          // Check if video should be completed
          if (newPercent >= safePayload.watchThreshold * 100 && !isCompleted) {
            setIsCompleted(true);
            handleVideoComplete();
          }

          return Math.min(newTime, duration);
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, hasStartedWatching, duration, safePayload.watchThreshold, isCompleted]);
  
  // Show error if video URL is not configured
  if (!safePayload.videoUrl) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-red-400">Ошибка: не указан URL видео для миссии</p>
        <p className="text-sm text-indigo-100/60 mt-2">
          Миссия создана некорректно. Обратитесь к архитектору для настройки видео.
        </p>
        {onCancel && (
          <button 
            onClick={onCancel}
            className="mt-4 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
          >
            Закрыть
          </button>
        )}
      </div>
    );
  }

  const startWatching = () => {
    setHasStartedWatching(true);
    setStartTime(new Date());
    setIsPlaying(true);
  };

  const togglePlayPause = () => {
    if (!hasStartedWatching) {
      startWatching();
    } else {
      setIsPlaying(prev => !prev);
    }
  };

  const handleVideoComplete = async () => {
    setIsPlaying(false);
    
    const endTime = new Date();
    const submission: VideoSubmission = {
      watchedDuration: currentTime,
      totalDuration: duration,
      watchPercentage: watchedPercent / 100,
      completedAt: endTime.toISOString()
    };

    await onSubmit(submission);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const requiredWatchPercent = Math.round(safePayload.watchThreshold * 100);

  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle size={32} className="text-green-400" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Видео просмотрено!</h1>
            <p className="text-green-400">
              Вы просмотрели {Math.round(watchedPercent)}% видео
            </p>
            <p className="text-indigo-100/70">
              Поздравляем! Вы успешно завершили просмотр обучающего материала.
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
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8 space-y-4">
        <h1 className="text-2xl font-bold text-white">{mission.name}</h1>
        {mission.description && (
          <p className="text-indigo-100/70 max-w-2xl mx-auto">{mission.description}</p>
        )}

        {/* Platform info */}
        <div className="flex items-center justify-center gap-2 text-sm text-indigo-300">
          <Info size={16} />
          <span>Платформа: {platformName}</span>
          {!platformFeatures.embed && (
            <span className="text-yellow-400">(откроется в новом окне)</span>
          )}
        </div>
        
        {!hasStartedWatching && (
          <div className="bg-indigo-500/10 rounded-xl border border-indigo-500/30 p-4 max-w-md mx-auto">
            <div className="flex items-center gap-3 text-sm text-indigo-200">
              <Clock size={16} />
              <span>Требуется просмотреть {requiredWatchPercent}% видео для завершения</span>
            </div>
          </div>
        )}
      </div>

      {/* Video Player */}
      <div className="relative mb-8">
        <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
          {isEmbeddableVideo(safePayload.videoUrl) ? (
            // Embedded video player for supported platforms
            <div className="relative w-full h-full">
              {!hasStartedWatching ? (
                // Optimized video player with lazy loading and thumbnail
                <OptimizedVideoPlayer
                  videoUrl={safePayload.videoUrl}
                  title={mission.name}
                  mode="full"
                  showPlatformInfo={false}
                  preloadThumbnail={true}
                  options={{
                    controls: safePayload.allowSkip !== false,
                    disableSeek: !safePayload.allowSkip,
                    autoplay: false
                  }}
                  onPlay={() => {
                    console.log("Video started playing via OptimizedVideoPlayer");
                    startWatching();
                  }}
                  onError={(error) => {
                    console.warn("Optimized video player error:", error);
                    // Fallback to direct iframe loading
                    startWatching();
                  }}
                />
              ) : (
                // Switch to iframe with tracking after first play
                <iframe
                  src={getVideoEmbedUrl(safePayload.videoUrl) || safePayload.videoUrl}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={mission.name}
                />
              )}
            </div>
          ) : safePayload.videoUrl.startsWith('http') && (safePayload.videoUrl.includes('.mp4') || safePayload.videoUrl.includes('.webm') || safePayload.videoUrl.includes('.ogg')) ? (
            // Direct video file
            <video
              ref={videoRef}
              src={safePayload.videoUrl}
              className="w-full h-full"
              controls={safePayload.allowSkip}
              onLoadedMetadata={(e) => {
                const video = e.target as HTMLVideoElement;
                setDuration(video.duration);
              }}
              onTimeUpdate={(e) => {
                const video = e.target as HTMLVideoElement;
                setCurrentTime(video.currentTime);
                const percent = (video.currentTime / video.duration) * 100;
                setWatchedPercent(percent);
                
                if (percent >= safePayload.watchThreshold * 100 && !isCompleted) {
                  setIsCompleted(true);
                  handleVideoComplete();
                }
              }}
            >
              Ваш браузер не поддерживает воспроизведение видео.
            </video>
          ) : (
            // External link for non-embeddable platforms
            <div className="flex flex-col items-center justify-center h-full space-y-4 bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="text-center space-y-3">
                <ExternalLink size={48} className="text-indigo-400 mx-auto" />
                <h3 className="text-white font-medium">Видео на внешней платформе</h3>
                <p className="text-indigo-100/70 text-sm max-w-md">
                  Это видео размещено на платформе {platformName} и не может быть встроено.
                  Нажмите кнопку ниже, чтобы открыть его в новой вкладке.
                </p>
              </div>
              
              <a
                href={safePayload.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={startWatching}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition"
              >
                <ExternalLink size={16} />
                Открыть на {platformName}
              </a>
              
              <p className="text-xs text-indigo-200/50 text-center max-w-sm">
                После просмотра {requiredWatchPercent}% видео вернитесь сюда и нажмите "Завершить"
              </p>
            </div>
          )}
        </div>

        {/* Progress bar for embedded videos */}
        {isEmbeddableVideo(safePayload.videoUrl) && hasStartedWatching && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black/60 rounded-lg p-3 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-white text-sm">
                <button
                  onClick={togglePlayPause}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                </button>
                
                <span>{formatTime(currentTime)}</span>
                
                <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${watchedPercent}%` }}
                  />
                </div>
                
                <span>{formatTime(duration)}</span>
                
                <Volume2 size={16} className="text-white/70" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Info */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Прогресс просмотра</h3>
          <span className="text-indigo-200 font-medium">
            {Math.round(watchedPercent)}% / {requiredWatchPercent}%
          </span>
        </div>
        
        <div className="space-y-3">
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${Math.min(watchedPercent, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm text-indigo-100/70">
            <span>Просмотрено: {formatTime(currentTime)}</span>
            <span>Общая длительность: {formatTime(duration)}</span>
          </div>
        </div>

        {watchedPercent >= safePayload.watchThreshold * 100 && (
          <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle size={16} />
              <span>Минимальный объем просмотра достигнут!</span>
            </div>
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
        
        {!hasStartedWatching && (
          <button
            onClick={startWatching}
            className="px-6 py-3 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition inline-flex items-center gap-2"
          >
            <Play size={16} />
            Начать просмотр
          </button>
        )}

        {(watchedPercent >= safePayload.watchThreshold * 100 || (!isEmbeddableVideo(safePayload.videoUrl) && hasStartedWatching)) && !isCompleted && (
          <button
            onClick={handleVideoComplete}
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition disabled:opacity-50"
          >
            {isSubmitting ? 'Завершение...' : 'Завершить миссию'}
          </button>
        )}
      </div>
    </div>
  );
}
