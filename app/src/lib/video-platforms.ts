// Поддержка популярных видеоплатформ в России

export interface VideoPlatform {
  name: string;
  detectUrl: (url: string) => boolean;
  extractId: (url: string) => string | null;
  getEmbedUrl: (id: string, options?: VideoOptions) => string;
  getDirectUrl?: (url: string) => string;
  supportedFeatures: {
    embed: boolean;
    autoplay: boolean;
    controls: boolean;
    disableSeek: boolean;
    apiTracking: boolean;
  };
}

export interface VideoOptions {
  autoplay?: boolean;
  controls?: boolean;
  disableSeek?: boolean;
  startTime?: number;
}

// YouTube
const youTube: VideoPlatform = {
  name: 'YouTube',
  detectUrl: (url) => url.includes('youtube.com') || url.includes('youtu.be'),
  extractId: (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  },
  getEmbedUrl: (id, options = {}) => {
    const params = new URLSearchParams({
      autoplay: options.autoplay ? '1' : '0',
      rel: '0',
      modestbranding: '1',
      ...(options.controls === false && { controls: '0' }),
      ...(options.disableSeek && { disablekb: '1' }),
      ...(options.startTime && { start: options.startTime.toString() })
    });
    return `https://www.youtube.com/embed/${id}?${params}`;
  },
  supportedFeatures: {
    embed: true,
    autoplay: true,
    controls: true,
    disableSeek: true,
    apiTracking: false // Требует YouTube API
  }
};

// Rutube
const rutube: VideoPlatform = {
  name: 'Rutube',
  detectUrl: (url) => url.includes('rutube.ru'),
  extractId: (url) => {
    const regExp = /rutube\.ru\/video\/([a-f0-9]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  },
  getEmbedUrl: (id, options = {}) => {
    const params = new URLSearchParams({
      autoPlay: options.autoplay ? 'true' : 'false',
      ...(options.controls === false && { skinColor: '0xffffff' }),
      ...(options.disableSeek && { 
        seekable: 'false',
        controlbar: 'false' 
      })
    });
    return `https://rutube.ru/play/embed/${id}?${params}`;
  },
  supportedFeatures: {
    embed: true,
    autoplay: true,
    controls: true,
    disableSeek: true, // Rutube поддерживает ограничение перемотки
    apiTracking: false
  }
};

// VK Video
const vkVideo: VideoPlatform = {
  name: 'VK Video',
  detectUrl: (url) => url.includes('vk.com') && url.includes('video'),
  extractId: (url) => {
    // VK URLs like: https://vk.com/video-123456_789012345
    const regExp = /vk\.com\/video(-?\d+_\d+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  },
  getEmbedUrl: (id, options = {}) => {
    const params = new URLSearchParams({
      autoplay: options.autoplay ? '1' : '0',
      hd: '1',
      ...(options.disableSeek && { controls: '0' })
    });
    return `https://vk.com/video_ext.php?oid=${id.split('_')[0].replace('-', '')}&id=${id.split('_')[1]}&${params}`;
  },
  supportedFeatures: {
    embed: true,
    autoplay: true,
    controls: true,
    disableSeek: true, // VK поддерживает отключение контролов
    apiTracking: false
  }
};

// Яндекс.Видео
const yandexVideo: VideoPlatform = {
  name: 'Яндекс.Видео',
  detectUrl: (url) => url.includes('yandex.ru') && url.includes('video'),
  extractId: (url) => {
    // Яндекс URLs like: https://yandex.ru/video/preview/123456789
    const regExp = /yandex\.ru\/video\/preview\/(\d+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  },
  getEmbedUrl: (id, options = {}) => {
    const params = new URLSearchParams({
      autoplay: options.autoplay ? '1' : '0',
      mute: '0',
      ...(options.disableSeek && { controls: '0' })
    });
    return `https://frontend.vh.yandex.ru/player/${id}?${params}`;
  },
  supportedFeatures: {
    embed: true,
    autoplay: true,
    controls: true,
    disableSeek: true, // Яндекс поддерживает отключение контролов
    apiTracking: false
  }
};

// Одноклассники (OK.ru)
const odnoklassniki: VideoPlatform = {
  name: 'Одноклассники',
  detectUrl: (url) => url.includes('ok.ru') && url.includes('video'),
  extractId: (url) => {
    // OK URLs like: https://ok.ru/video/123456789
    const regExp = /ok\.ru\/video\/(\d+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  },
  getEmbedUrl: (id, options = {}) => {
    const params = new URLSearchParams({
      autoplay: options.autoplay ? '1' : '0',
      playerStart: options.startTime ? options.startTime.toString() : '0',
      ...(options.disableSeek && { controls: '0' })
    });
    return `https://ok.ru/videoembed/${id}?${params}`;
  },
  supportedFeatures: {
    embed: true,
    autoplay: true,
    controls: true,
    disableSeek: true, // OK.ru поддерживает отключение контролов
    apiTracking: false
  }
};

// Mail.ru Video
const mailruVideo: VideoPlatform = {
  name: 'Mail.ru Video',
  detectUrl: (url) => url.includes('mail.ru') && url.includes('video'),
  extractId: (url) => {
    // Mail.ru URLs like: https://my.mail.ru/video/embed/123456789
    const regExp = /mail\.ru\/.*\/video\/.*\/(\d+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  },
  getEmbedUrl: (id, options = {}) => {
    const params = new URLSearchParams({
      autoplay: options.autoplay ? '1' : '0',
      ...(options.disableSeek && { controls: '0' })
    });
    return `https://videoapi.my.mail.ru/videos/embed/${id}.html?${params}`;
  },
  supportedFeatures: {
    embed: true,
    autoplay: true,
    controls: true,
    disableSeek: true, // Mail.ru поддерживает отключение контролов
    apiTracking: false
  }
};

// Vimeo (международная платформа)
const vimeo: VideoPlatform = {
  name: 'Vimeo',
  detectUrl: (url) => url.includes('vimeo.com'),
  extractId: (url) => {
    const regExp = /vimeo\.com\/(?:.*\/)?(\d+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  },
  getEmbedUrl: (id, options = {}) => {
    const params = new URLSearchParams({
      autoplay: options.autoplay ? '1' : '0',
      title: '0',
      byline: '0',
      portrait: '0',
      ...(options.controls === false && { controls: '0' })
    });
    return `https://player.vimeo.com/video/${id}?${params}`;
  },
  supportedFeatures: {
    embed: true,
    autoplay: true,
    controls: true,
    disableSeek: true,
    apiTracking: false
  }
};

// Все поддерживаемые платформы
export const VIDEO_PLATFORMS: VideoPlatform[] = [
  youTube,
  rutube,
  vkVideo,
  yandexVideo,
  odnoklassniki,
  mailruVideo,
  vimeo
];

// Утилитарные функции
export function detectVideoPlatform(url: string): VideoPlatform | null {
  return VIDEO_PLATFORMS.find(platform => platform.detectUrl(url)) || null;
}

export function getEmbedUrl(url: string, options: VideoOptions = {}): string | null {
  const platform = detectVideoPlatform(url);
  if (!platform) return null;

  const id = platform.extractId(url);
  if (!id) return null;

  return platform.getEmbedUrl(id, options);
}

export function isVideoUrl(url: string): boolean {
  return VIDEO_PLATFORMS.some(platform => platform.detectUrl(url));
}

export function getPlatformName(url: string): string {
  const platform = detectVideoPlatform(url);
  return platform?.name || 'Неизвестная платформа';
}

// Проверка поддерживаемых функций
export function getPlatformFeatures(url: string) {
  const platform = detectVideoPlatform(url);
  return platform?.supportedFeatures || {
    embed: false,
    autoplay: false,
    controls: false,
    disableSeek: false,
    apiTracking: false
  };
}

// Список популярных платформ для UI
export const POPULAR_PLATFORMS_INFO = [
  { name: 'YouTube', domains: ['youtube.com', 'youtu.be'], example: 'https://youtube.com/watch?v=dQw4w9WgXcQ' },
  { name: 'Rutube', domains: ['rutube.ru'], example: 'https://rutube.ru/video/abc123def456' },
  { name: 'VK Video', domains: ['vk.com'], example: 'https://vk.com/video-12345_67890' },
  { name: 'Яндекс.Видео', domains: ['yandex.ru'], example: 'https://yandex.ru/video/preview/123456' },
  { name: 'Одноклассники', domains: ['ok.ru'], example: 'https://ok.ru/video/123456789' },
  { name: 'Mail.ru', domains: ['mail.ru'], example: 'https://my.mail.ru/video/embed/123456' },
  { name: 'Vimeo', domains: ['vimeo.com'], example: 'https://vimeo.com/123456' }
];
