import { useMemo } from 'react';
import { detectVideoPlatform, getPlatformName, getPlatformFeatures, isVideoUrl } from '@/lib/video-platforms';

interface VideoOptimizationInfo {
  isValid: boolean;
  platformName: string;
  canEmbed: boolean;
  features: ReturnType<typeof getPlatformFeatures>;
  hasThumbnail: boolean;
  recommendedMode: 'preview' | 'full' | 'compact';
}

// Platforms that we have good thumbnail support for
const THUMBNAIL_SUPPORTED_PLATFORMS = ['YouTube', 'Rutube'];

// Platforms that support seek control
const SEEK_CONTROL_PLATFORMS = ['YouTube', 'Rutube', 'VK Video', 'Яндекс.Видео', 'Одноклассники', 'Mail.ru Video', 'Vimeo'];

export function useVideoOptimization(videoUrl: string): VideoOptimizationInfo {
  return useMemo(() => {
    if (!videoUrl) {
      return {
        isValid: false,
        platformName: 'Неизвестная платформа',
        canEmbed: false,
        features: {
          embed: false,
          autoplay: false,
          controls: false,
          disableSeek: false,
          apiTracking: false
        },
        hasThumbnail: false,
        recommendedMode: 'preview'
      };
    }

    const isValid = isVideoUrl(videoUrl);
    const platformName = getPlatformName(videoUrl);
    const features = getPlatformFeatures(videoUrl);
    const canEmbed = features.embed;
    const hasThumbnail = THUMBNAIL_SUPPORTED_PLATFORMS.includes(platformName);
    
    // Determine recommended mode based on platform capabilities
    let recommendedMode: 'preview' | 'full' | 'compact' = 'preview';
    if (canEmbed && hasThumbnail) {
      recommendedMode = 'full';
    } else if (canEmbed) {
      recommendedMode = 'preview';
    } else {
      recommendedMode = 'compact';
    }

    return {
      isValid,
      platformName,
      canEmbed,
      features,
      hasThumbnail,
      recommendedMode
    };
  }, [videoUrl]);
}
