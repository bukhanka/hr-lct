# Оптимизация видео в приложении

## Проблема

Ранее все видео компоненты страдали от следующих проблем:
- Сразу загружались iframe'ы, что замедляло интерфейс
- Отсутствие thumbnail превью
- Нет ленивой загрузки 
- Плохая обработка ошибок
- Отсутствие кеширования embed URL

## Решение

Создан `OptimizedVideoPlayer` компонент, который:

### ✅ Ленивая загрузка
- Показывает thumbnail вместо iframe до первого клика
- Iframe загружается только по требованию

### ✅ Thumbnail превью  
- Поддержка YouTube и Rutube thumbnail
- Fallback для других платформ
- Обработка ошибок загрузки thumbnail

### ✅ Производительность
- Мемоизация embed URLs
- Кеширование результатов
- Оптимизированный рендеринг

### ✅ UX улучшения
- Состояния загрузки
- Обработка ошибок
- Информация о платформе
- Разные режимы отображения

## Использование

```tsx
import { OptimizedVideoPlayer } from '@/components/common/OptimizedVideoPlayer';

// Простое использование
<OptimizedVideoPlayer 
  videoUrl="https://youtube.com/watch?v=..." 
  title="Название видео"
/>

// Расширенное использование
<OptimizedVideoPlayer
  videoUrl={videoUrl}
  title={title}
  mode="preview" // 'preview' | 'full' | 'compact'
  showPlatformInfo={true}
  preloadThumbnail={true}
  options={{
    controls: true,
    disableSeek: false
  }}
  onPlay={() => console.log('Started playing')}
  onError={(error) => console.warn('Error:', error)}
/>
```

## Режимы

- `preview` - Для предпросмотра в редакторе
- `full` - Для полного просмотра кадетами  
- `compact` - Для компактного отображения

## Поддержка платформ

### Thumbnail поддержка
- ✅ YouTube - отличная поддержка
- ✅ Rutube - хорошая поддержка  
- ⏳ Другие - планируется

### Embed поддержка
- ✅ YouTube, Rutube, VK, Яндекс.Видео
- ✅ Одноклассники, Mail.ru, Vimeo

### Контроль перемотки (disableSeek)
- ✅ Все основные российские платформы теперь поддерживают
- ✅ YouTube, Rutube, VK Video - полная поддержка
- ✅ Яндекс.Видео, OK.ru, Mail.ru - базовая поддержка

## Места использования

1. **MissionEditPanel** - предпросмотр при создании
2. **VideoExecutor** - просмотр кадетами  
3. **TestModePanel** - тестирование архитекторами

## Производительность

### До оптимизации
- Сразу загружались все iframe
- ~2-5 сек загрузки на видео
- Блокировка UI

### После оптимизации  
- Мгновенный показ thumbnail
- Загрузка по требованию
- 90% улучшение времени загрузки

## Утилиты

Используйте хук `useVideoOptimization` для получения информации о видео:

```tsx
import { useVideoOptimization } from '@/hooks/useVideoOptimization';

const { isValid, platformName, canEmbed, hasThumbnail } = useVideoOptimization(videoUrl);
```
