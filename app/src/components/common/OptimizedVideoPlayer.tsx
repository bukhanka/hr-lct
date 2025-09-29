"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { Play, ExternalLink, Loader2, AlertCircle, Maximize2 } from "lucide-react";
import { 
  detectVideoPlatform, 
  getEmbedUrl, 
  getPlatformName, 
  getPlatformFeatures,
  isVideoUrl 
} from "@/lib/video-platforms";

interface VideoPlayerOptions {
  autoplay?: boolean;
  controls?: boolean;
  disableSeek?: boolean;
  startTime?: number;
}

interface OptimizedVideoPlayerProps {
  videoUrl: string;
  title?: string;
  className?: string;
  options?: VideoPlayerOptions;
  mode?: 'preview' | 'full' | 'compact';
  onPlay?: () => void;
  onError?: (error: string) => void;
  showPlatformInfo?: boolean;
  preloadThumbnail?: boolean;
}

// URL-based thumbnail generation
const getVideoThumbnail = (videoUrl: string): string | null => {
  const platform = detectVideoPlatform(videoUrl);
  if (!platform) return null;
  
  try {
    const id = platform.extractId(videoUrl);
    if (!id) return null;

    // Generate thumbnail URLs based on platform
    switch (platform.name) {
      case 'YouTube':
        return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
      case 'Rutube':
        return `https://pic.rutube.ru/video/${id.slice(0, 2)}/${id}/original.jpg`;
      case 'VK Video':
        // VK uses different thumbnail format, fallback to generic
        return null;
      case 'Яндекс.Видео':
        // Yandex has thumbnail API but requires additional parsing
        return null;
      case 'Одноклассники':
        // OK.ru has thumbnails but complex API
        return null;
      case 'Vimeo':
        // For Vimeo we'd need API call, so use a placeholder for now
        return null;
      default:
        return null;
    }
  } catch {
    return null;
  }
};

// Cache for embed URLs to avoid recomputation
const embedUrlCache = new Map<string, string | null>();

export function OptimizedVideoPlayer({
  videoUrl,
  title = "Видео",
  className = "",
  options = {},
  mode = 'full',
  onPlay,
  onError,
  showPlatformInfo = false,
  preloadThumbnail = true
}: OptimizedVideoPlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Memoize platform detection and validation
  const videoInfo = useMemo(() => {
    if (!videoUrl) return null;
    
    const isValid = isVideoUrl(videoUrl);
    if (!isValid) return null;
    
    const platform = detectVideoPlatform(videoUrl);
    const platformName = getPlatformName(videoUrl);
    const features = getPlatformFeatures(videoUrl);
    
    return {
      isValid,
      platform,
      platformName,
      features,
      canEmbed: features?.embed || false
    };
  }, [videoUrl]);

  // Memoize embed URL with caching
  const embedUrl = useMemo(() => {
    if (!videoInfo?.canEmbed) return null;
    
    const cacheKey = `${videoUrl}_${JSON.stringify(options)}`;
    if (embedUrlCache.has(cacheKey)) {
      return embedUrlCache.get(cacheKey);
    }
    
    const url = getEmbedUrl(videoUrl, {
      autoplay: false, // Always start with autoplay false for optimization
      controls: options.controls !== false,
      disableSeek: options.disableSeek,
      startTime: options.startTime
    });
    
    embedUrlCache.set(cacheKey, url);
    return url;
  }, [videoUrl, options, videoInfo]);

  // Memoize thumbnail URL
  const thumbnailUrl = useMemo(() => {
    if (!preloadThumbnail || !videoInfo?.isValid) return null;
    return getVideoThumbnail(videoUrl);
  }, [videoUrl, preloadThumbnail, videoInfo]);

  const handlePlayClick = useCallback(() => {
    if (error) return;
    
    setIsLoading(true);
    setError(null);
    
    // Add slight delay to show loading state
    setTimeout(() => {
      setIsLoaded(true);
      setIsLoading(false);
      onPlay?.();
    }, 300);
  }, [error, onPlay]);

  const handleIframeError = useCallback(() => {
    const errorMsg = `Ошибка загрузки видео с ${videoInfo?.platformName || 'платформы'}`;
    setError(errorMsg);
    setIsLoading(false);
    onError?.(errorMsg);
  }, [videoInfo?.platformName, onError]);

  const openExternalVideo = useCallback(() => {
    window.open(videoUrl, '_blank', 'noopener,noreferrer');
  }, [videoUrl]);

  // Preload thumbnail
  useEffect(() => {
    if (!thumbnailUrl) return;
    
    const img = new window.Image();
    img.onload = () => setThumbnailLoaded(true);
    img.onerror = () => setThumbnailError(true);
    img.src = thumbnailUrl;
  }, [thumbnailUrl]);

  // Error state
  if (!videoInfo?.isValid) {
    return (
      <div className={`relative bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center ${className}`}>
        <div className="text-center text-red-400">
          <AlertCircle size={24} className="mx-auto mb-2" />
          <p className="text-sm">Неподдерживаемый формат видео</p>
        </div>
      </div>
    );
  }

  const aspectRatio = mode === 'compact' ? 'aspect-[16/10]' : 'aspect-video';
  
  return (
    <div className={`relative bg-black rounded-xl overflow-hidden ${aspectRatio} ${className}`}>
      {/* Platform info */}
      {showPlatformInfo && (
        <div className="absolute top-2 left-2 z-30 bg-black/70 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
          {videoInfo.platformName}
          {videoInfo.canEmbed ? " (встраивается)" : " (внешняя ссылка)"}
        </div>
      )}

      {/* Loading/Error States */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
          <div className="text-white text-center">
            <Loader2 size={24} className="animate-spin mx-auto mb-2" />
            <p className="text-sm">Загрузка видео...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center z-20">
          <div className="text-center text-red-400">
            <AlertCircle size={24} className="mx-auto mb-2" />
            <p className="text-sm">{error}</p>
            <button
              onClick={openExternalVideo}
              className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 underline"
            >
              Открыть в новой вкладке
            </button>
          </div>
        </div>
      )}

      {/* Thumbnail or placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0">
          {thumbnailUrl && thumbnailLoaded && !thumbnailError ? (
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              className="object-cover"
              onError={() => setThumbnailError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
              <div className="text-center text-white/60">
                <Play size={mode === 'compact' ? 32 : 48} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs">{videoInfo.platformName}</p>
                {thumbnailError && (
                  <p className="text-[10px] text-white/40 mt-1">Превью недоступно</p>
                )}
              </div>
            </div>
          )}

          {/* Play button overlay */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            {videoInfo.canEmbed ? (
              <button
                onClick={handlePlayClick}
                disabled={isLoading}
                className="group relative"
                aria-label={`Воспроизвести видео: ${title}`}
              >
                <div className={`
                  rounded-full bg-indigo-500 hover:bg-indigo-600 transition-all duration-200 
                  flex items-center justify-center group-hover:scale-110
                  ${mode === 'compact' ? 'w-12 h-12' : 'w-16 h-16'}
                `}>
                  {isLoading ? (
                    <Loader2 size={mode === 'compact' ? 20 : 24} className="text-white animate-spin" />
                  ) : (
                    <Play size={mode === 'compact' ? 20 : 24} className="text-white ml-0.5" />
                  )}
                </div>
                
                {mode !== 'compact' && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    Воспроизвести
                  </div>
                )}
              </button>
            ) : (
              <button
                onClick={openExternalVideo}
                className="group relative"
                aria-label={`Открыть видео в новой вкладке: ${title}`}
              >
                <div className={`
                  rounded-full bg-indigo-500 hover:bg-indigo-600 transition-all duration-200 
                  flex items-center justify-center group-hover:scale-110
                  ${mode === 'compact' ? 'w-12 h-12' : 'w-16 h-16'}
                `}>
                  <ExternalLink size={mode === 'compact' ? 16 : 20} className="text-white" />
                </div>
                
                {mode !== 'compact' && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    Открыть во внешнем плеере
                  </div>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Actual video iframe - loaded lazily */}
      {isLoaded && embedUrl && (
        <iframe
          ref={iframeRef}
          src={embedUrl}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title}
          onError={handleIframeError}
          loading="lazy"
        />
      )}

      {/* Fullscreen button for preview mode */}
      {mode === 'preview' && !isLoaded && (
        <button
          onClick={openExternalVideo}
          className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded-md backdrop-blur-sm hover:bg-black/80 transition-colors z-10"
          aria-label="Открыть в полноэкранном режиме"
        >
          <Maximize2 size={14} />
        </button>
      )}
    </div>
  );
}
