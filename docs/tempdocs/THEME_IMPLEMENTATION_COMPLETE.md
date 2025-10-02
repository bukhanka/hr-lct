# Campaign Theme System - Implementation Complete ✅

## Обзор реализации

Успешно реализована система тематизации кампаний согласно MVP плану. Система позволяет HR-архитекторам настраивать визуальную тему, терминологию и уровень геймификации, которые автоматически применяются в интерфейсе кадета.

## Что реализовано

### ✅ 1. Модель данных и типы

- **Schema**: Добавлено поле `themeConfig: Json?` в модель `Campaign`
- **Types**: Созданы типы в `src/types/campaignTheme.ts`:
  - `CampaignThemeConfig` - конфигурация темы кампании
  - `ThemePreset` - пресет темы
  - `PersonaPreset` - пресет целевой аудитории
  - `FunnelType`, `GamificationLevel` - перечисления

### ✅ 2. Темы и персоны

Реализовано 3 темы в `src/data/theme-presets.ts`:

1. **Галактическая академия** (`galactic-academy`)
   - Космический визуал, фиолетовые акценты
   - Подходит для: Onboarding, Growth
   - Персона: Студенты и стажёры
   - Геймификация: High

2. **Корпоративный мегаполис** (`corporate-metropolis`)
   - Строгий стиль, KPI метрики
   - Подходит для: Onboarding, Engagement
   - Персона: Специалисты 26-35
   - Геймификация: Low

3. **ESG-миссия** (`esg-mission`)
   - Зелёный мотив, фокус на вклад
   - Подходит для: ESG, Growth
   - Персона: Волонтёры
   - Геймификация: Balanced

### ✅ 3. Контекст и хуки

- **ThemeContext** (`src/contexts/ThemeContext.tsx`):
  - Глобальный контекст для темы
  - Хук `useTheme()` для доступа к теме
  - Функция `getMotivationText()` для терминологии

### ✅ 4. Панель настроек в конструкторе

**CampaignSettingsPanel** (`src/components/constructor/CampaignSettingsPanel.tsx`):
- Выбор типа воронки (5 вариантов)
- Выбор целевых аудиторий (множественный выбор)
- Выбор темы из каталога с предпросмотром
- Настройка уровня геймификации (Low/Balanced/High)
- Ручная настройка терминологии (XP, Мана, Ранг)
- ИИ-помощник для автоподбора темы
- Debug-панель с JSON конфигурацией
- Tooltips с подсказками для каждого раздела

### ✅ 5. AI Copilot

Реализовано 2 API endpoint:

1. **`/api/ai/theme-suggestion`** - Генерация темы
   - POST запрос с параметрами `funnelType`, `personaId`
   - Возвращает подходящий `CampaignThemeConfig`
   - Имитирует задержку AI (0.8-2с)

2. **`/api/ai/funnel-recommendation`** - Рекомендации по воронке
   - POST запрос с `campaignId`, `funnelType`
   - Возвращает 2-3 совета по оптимизации
   - Предлагает патчи для конфигурации

### ✅ 6. Адаптация интерфейса кадета

**CadetGalacticMap** - два режима отображения:

1. **Галактическая карта** (для `galactic-academy`):
   - Космическая визуализация с узлами
   - Анимированные звёзды и связи
   - Эффекты свечения и градиенты

2. **Простой роадмап** (для `corporate-metropolis`, `esg-mission`):
   - Вертикальная временная шкала
   - Карточки миссий с прогрессом
   - Минималистичный дизайн
   - Фокус на KPI и метрики

**Использование терминологии**:
- `CadetOverview`: использует `getMotivationText('xp')`, `getMotivationText('mana')`
- `CadetGalacticMap`: адаптирует отображение наград
- `TestModePanel`: применяет цвета темы к HUD

### ✅ 7. Провайдеры тем

1. **CadetDashboardWrapper** - для реальных кадетов:
   - Загружает тему из первой миссии пользователя
   - Оборачивает `CadetOverview` в `ThemeProvider`

2. **TestModeProvider** - для режима тестирования:
   - Загружает тему из кампании
   - Применяет к тестовому интерфейсу кадета

### ✅ 8. Тестовые данные

**Mock Users** (`src/lib/auth.ts`) - 3 типа кадетов:
- **Алекс Новиков (Студент)** - `cadet.student@example.com`
  - Кампания: "Путь в космос" (Galactic Academy)
  - Прогресс: 3/5 миссий завершено
  - 250 XP, 120 Маны, Ранг 2

- **Мария Соколова (Специалист)** - `cadet.pro@example.com`
  - Кампания: "Корпоративная адаптация" (Corporate Metropolis)
  - Прогресс: 2/3 миссий завершено
  - 450 XP, 80 Маны, Ранг 3

- **Иван Зеленский (Волонтёр)** - `cadet.volunteer@example.com`
  - Кампания: "Программа ESG" (ESG Mission)
  - Прогресс: 2/3 миссий завершено
  - 180 XP, 200 Маны, Ранг 2

**Seed** (`src/lib/seed.ts`):
- Создаёт 5 кампаний с разными темами
- Инициализирует 3 кадетов с прогрессом
- Добавляет компетенции и награды

### ✅ 9. Ассеты тем

Созданы директории в `public/themes/` с README:
- `galactic-academy/` - Космическая тема
- `corporate-metropolis/` - Корпоративная тема
- `esg-mission/` - ESG тема

Каждая содержит инструкции для:
- `background.png` - фон темы
- `icon.svg` - иконка темы
- `ambient.mp3` - фоновая музыка (опционально)

## Как протестировать

### 1. Настройка темы в конструкторе

```bash
# Запустить приложение
npm run dev
```

1. Войти как Architect: `architect@example.com`
2. Открыть любую кампанию
3. Перейти на вкладку "Настройки"
4. Настроить тему:
   - Выбрать тип воронки
   - Выбрать целевые аудитории
   - Выбрать тему
   - Настроить терминологию
   - Попробовать ИИ-пилот

### 2. Просмотр от имени кадета

Войти как один из кадетов:
- `cadet.student@example.com` → Галактическая карта
- `cadet.pro@example.com` → Роадмап (корпоративный стиль)
- `cadet.volunteer@example.com` → Роадмап (ESG стиль)

Проверить:
- Визуальное оформление соответствует теме
- Терминология (XP/KPI/Вклад, Мана/Бонусы/Импакт)
- Цветовая схема
- Тип отображения миссий (карта vs роадмап)

### 3. Режим тестирования

1. Войти как Architect
2. Открыть кампанию
3. Нажать "Режим тестирования"
4. URL: `/dashboard/architect/campaigns/{id}/test`

Проверить:
- Тема применяется автоматически
- Терминология соответствует настройкам
- Цвета темы в HUD и статусах

### 4. A/B тестирование

1. Создать 2 кампании с разными темами
2. Назначить разным пользователям
3. Сравнить интерфейсы

## Архитектура

```
┌─────────────────────────────────────────────┐
│          Campaign (Database)                │
│  themeConfig: CampaignThemeConfig           │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│         ThemeProvider                       │
│  - Provides theme context                   │
│  - getMotivationText()                      │
└──────────────────┬──────────────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
┌──────────────────┐  ┌──────────────────┐
│ CadetOverview    │  │ CadetGalacticMap │
│ - Uses theme     │  │ - Adapts layout  │
│ - Terminology    │  │ - Theme colors   │
└──────────────────┘  └──────────────────┘
```

## Что осталось (из расширенного плана)

Для полной реализации стратегии потребуется:

### Средний приоритет:
- [ ] FunnelAnalyticsPanel - визуализация воронки с метриками
- [ ] ThemeGuide - интерактивный гайд по темам
- [ ] Загрузка и хранение реальных ассетов (изображения, аудио)
- [ ] Больше тем (Киберпанк, Мифический орден, Научная экспедиция и т.д.)

### Низкий приоритет:
- [ ] A/B тестирование с реальной аналитикой
- [ ] Событийная схема для отслеживания конверсии
- [ ] Сегментация метрик по персонам
- [ ] Рекомендации AI на основе реальных данных
- [ ] Версионирование тем для запущенных кампаний
- [ ] Advanced mode для детальной настройки

## Технический стек

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **State**: React Context API
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Mock AI**: Simulated delays + preset responses

## Файлы проекта

### Новые файлы:
- `src/types/campaignTheme.ts` - Типы
- `src/data/theme-presets.ts` - Пресеты тем
- `src/contexts/ThemeContext.tsx` - Контекст темы
- `src/components/constructor/CampaignSettingsPanel.tsx` - Панель настроек
- `src/components/dashboard/CadetDashboardWrapper.tsx` - Обёртка для кадета
- `src/app/api/ai/theme-suggestion/route.ts` - AI генерация
- `src/app/api/ai/funnel-recommendation/route.ts` - AI рекомендации
- `public/themes/{theme}/README.md` - Инструкции по ассетам

### Изменённые файлы:
- `prisma/schema.prisma` - Добавлено `themeConfig`
- `src/lib/auth.ts` - Добавлены 3 кадета
- `src/lib/seed.ts` - Функция создания кадетов
- `src/components/dashboard/CadetOverview.tsx` - Использование `useTheme()`
- `src/components/dashboard/CadetGalacticMap.tsx` - Два режима отображения
- `src/components/constructor/TestModePanel.tsx` - Цвета темы
- `src/components/constructor/TestModeProvider.tsx` - ThemeProvider
- `src/app/dashboard/cadet/page.tsx` - Обёртка с темой

## Итог

MVP системы тематизации полностью реализован и готов к демонстрации. Архитектор может настраивать темы, а кадеты видят персонализированный интерфейс. Система легко расширяется новыми темами и функциями аналитики.
