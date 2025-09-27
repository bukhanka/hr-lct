"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, CheckCircle, Clock, Zap, Volume2 } from "lucide-react";
import { VideoPayload, VideoSubmission } from "@/lib/mission-types";

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
  const [duration, setDuration] = useState(payload.duration || 0);
  const [watchedPercent, setWatchedPercent] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasStartedWatching, setHasStartedWatching] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Extract video ID from YouTube URL for embedding
  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      const videoId = match[2];
      const params = payload.allowSkip ? '' : '&disablekb=1&controls=0&modestbranding=1';
      return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0${params}`;
    }
    return url; // Return original URL if not YouTube
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
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
          if (newPercent >= payload.watchThreshold * 100 && !isCompleted) {
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
  }, [isPlaying, hasStartedWatching, duration, payload.watchThreshold, isCompleted]);

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

  const requiredWatchPercent = Math.round(payload.watchThreshold * 100);

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
          {isYouTubeUrl(payload.videoUrl) ? (
            // YouTube embed
            <div className="relative w-full h-full">
              {!hasStartedWatching ? (
                // Custom play button overlay for YouTube
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                  <button
                    onClick={startWatching}
                    className="w-20 h-20 rounded-full bg-indigo-500 hover:bg-indigo-600 transition-colors flex items-center justify-center group"
                  >
                    <Play size={32} className="text-white ml-1 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              ) : null}
              
              <iframe
                src={getYouTubeEmbedUrl(payload.videoUrl)}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={mission.name}
              />
            </div>
          ) : (
            // Regular video player
            <video
              ref={videoRef}
              src={payload.videoUrl}
              className="w-full h-full"
              controls={payload.allowSkip}
              onLoadedMetadata={(e) => {
                const video = e.target as HTMLVideoElement;
                setDuration(video.duration);
              }}
              onTimeUpdate={(e) => {
                const video = e.target as HTMLVideoElement;
                setCurrentTime(video.currentTime);
                const percent = (video.currentTime / video.duration) * 100;
                setWatchedPercent(percent);
                
                if (percent >= payload.watchThreshold * 100 && !isCompleted) {
                  setIsCompleted(true);
                  handleVideoComplete();
                }
              }}
            >
              Ваш браузер не поддерживает воспроизведение видео.
            </video>
          )}
        </div>

        {/* Progress bar for YouTube videos */}
        {isYouTubeUrl(payload.videoUrl) && hasStartedWatching && (
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

        {watchedPercent >= payload.watchThreshold * 100 && (
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

        {watchedPercent >= payload.watchThreshold * 100 && !isCompleted && (
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
