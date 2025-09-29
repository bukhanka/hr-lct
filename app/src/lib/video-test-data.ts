// Тестовые данные для проверки поддержки видеоплатформ в России

export const RUSSIAN_VIDEO_PLATFORMS_TEST_DATA = [
  {
    platform: 'YouTube',
    name: 'Тест YouTube - Rick Roll',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: 'Классическое видео для тестирования',
    expectedEmbed: true,
    expectedPlatform: 'YouTube'
  },
  {
    platform: 'Rutube',
    name: 'Тест Rutube',
    url: 'https://rutube.ru/video/b7d4b6c1234567890abcdef1234567890/',
    description: 'Тестовое видео с Rutube',
    expectedEmbed: true,
    expectedPlatform: 'Rutube'
  },
  {
    platform: 'VK Video',
    name: 'Тест VK Video',
    url: 'https://vk.com/video-12345678_456239017',
    description: 'Видео из ВКонтакте',
    expectedEmbed: true,
    expectedPlatform: 'VK Video'
  },
  {
    platform: 'Яндекс.Видео',
    name: 'Тест Яндекс.Видео',
    url: 'https://yandex.ru/video/preview/1234567890123456789',
    description: 'Видео с Яндекс.Видео',
    expectedEmbed: true,
    expectedPlatform: 'Яндекс.Видео'
  },
  {
    platform: 'Одноклассники',
    name: 'Тест OK.ru',
    url: 'https://ok.ru/video/1234567890123',
    description: 'Видео из Одноклассников',
    expectedEmbed: true,
    expectedPlatform: 'Одноклассники'
  },
  {
    platform: 'Mail.ru Video',
    name: 'Тест Mail.ru',
    url: 'https://my.mail.ru/video/embed/1234567890',
    description: 'Видео с Mail.ru',
    expectedEmbed: true,
    expectedPlatform: 'Mail.ru Video'
  },
  {
    platform: 'Vimeo',
    name: 'Тест Vimeo',
    url: 'https://vimeo.com/123456789',
    description: 'Международная платформа Vimeo',
    expectedEmbed: true,
    expectedPlatform: 'Vimeo'
  }
];

// Популярные видео в России для реальных тестов
export const POPULAR_RUSSIAN_VIDEOS_2024 = [
  {
    platform: 'YouTube',
    title: 'Тест на знание истории России',
    url: 'https://www.youtube.com/watch?v=education_history_test',
    description: 'Образовательное видео по истории для корпоративного обучения',
    category: 'Образование'
  },
  {
    platform: 'Rutube',
    title: 'Корпоративная культура и ценности',
    url: 'https://rutube.ru/video/corporate_culture_training/',
    description: 'Обучающий ролик о корпоративной культуре российской компании',
    category: 'HR'
  },
  {
    platform: 'VK Video',
    title: 'Тренинг по коммуникациям',
    url: 'https://vk.com/video-company_hr_123456',
    description: 'Видеотренинг по развитию коммуникативных навыков',
    category: 'Тренинги'
  },
  {
    platform: 'Яндекс.Видео',
    title: 'Технологии будущего',
    url: 'https://yandex.ru/video/preview/tech_future_2024',
    description: 'Лекция о развитии технологий в России',
    category: 'Технологии'
  }
];

// Функция для создания тестовых миссий
export function createTestVideoMissions(campaignId: string) {
  return RUSSIAN_VIDEO_PLATFORMS_TEST_DATA.map((testData, index) => ({
    campaignId,
    name: testData.name,
    description: testData.description,
    missionType: "WATCH_VIDEO",
    experienceReward: 50,
    manaReward: 25,
    positionX: 200 + (index % 3) * 200,
    positionY: 100 + Math.floor(index / 3) * 150,
    confirmationType: "AUTO",
    minRank: 1,
    payload: {
      type: "WATCH_VIDEO",
      videoUrl: testData.url,
      watchThreshold: 0.8, // 80% для тестов
      allowSkip: index % 2 === 0, // Чередуем настройки
      duration: 120 + index * 30 // Разная длительность
    }
  }));
}

// Пример реального использования с популярными видео
export function createProductionVideoMissions(campaignId: string) {
  return POPULAR_RUSSIAN_VIDEOS_2024.map((video, index) => ({
    campaignId,
    name: video.title,
    description: video.description,
    missionType: "WATCH_VIDEO",
    experienceReward: 75,
    manaReward: 40,
    positionX: 300 + (index % 2) * 300,
    positionY: 200 + index * 200,
    confirmationType: "AUTO",
    minRank: 1,
    payload: {
      type: "WATCH_VIDEO",
      videoUrl: video.url,
      watchThreshold: 0.90,
      allowSkip: false,
      duration: 600 // 10 минут
    }
  }));
}
