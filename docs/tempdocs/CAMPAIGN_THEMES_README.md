# Campaign Theme System MVP

Рабочий прототип системы тем для кампаний согласно `docs/campaign_theme_mvp_plan.md`.

## 🎯 Что реализовано

### 1. Модель данных
- ✅ Добавлено поле `themeConfig` (JSON) к модели `Campaign`
- ✅ Пресеты тем в `src/data/theme-presets.ts`
- ✅ Типы в `src/types/campaignTheme.ts`
- ✅ Демо-данные в `src/lib/seed.ts`

### 2. UI конструктора
- ✅ Панель настроек кампании в `CampaignSettingsPanel` 
- ✅ Выбор типа воронки, персон, тем
- ✅ Переопределение терминологии (XP, Мана, Ранг)
- ✅ JSON preview для отладки
- ✅ Сохранение через `/api/campaigns/[id]`

### 3. Темизация клиентских интерфейсов
- ✅ `ThemeProvider` и `useTheme()` hook
- ✅ Адаптация `MissionNode` под терминологию
- ✅ Адаптация `CadetOverview` под мотиваторы
- ✅ Fallback на базовую тему

### 4. AI Copilot (mock)
- ✅ `/api/ai/theme-suggestion` - генерация темы
- ✅ `/api/ai/funnel-recommendation` - рекомендации
- ✅ Интеграция в UI с loading states

### 5. Аналитика воронки (POC)
- ✅ `FunnelAnalyticsPanel` с метриками по персонам
- ✅ `/api/analytics/campaigns/[id]/funnel`
- ✅ Интеграция с AI рекомендациями

## 🚀 Как использовать

### Для разработки
1. Запустите `npm run seed` для создания демо-данных с темами
2. Откройте конструктор кампании
3. Нажмите "Настройки кампании" в правом верхнем углу
4. Выберите тему, персону, настройте терминологию
5. Попробуйте "ИИ-пилот" для генерации рекомендаций

### Для демо
1. Создайте кампанию в дашборде архитектора
2. Откройте конструктор
3. Настройте тему через панель справа
4. Протестируйте в режиме кадета - термины обновятся

## 📁 Структура файлов

```
src/
├── types/campaignTheme.ts        # Типы тем и конфигураций
├── data/theme-presets.ts         # Каталог готовых тем
├── contexts/ThemeContext.tsx     # React context для тем
├── components/
│   ├── constructor/
│   │   ├── CampaignSettingsPanel.tsx  # Панель настройки темы
│   │   ├── FunnelAnalyticsPanel.tsx   # Аналитика воронки
│   │   └── MissionNode.tsx            # Обновлен под темы
│   └── dashboard/
│       └── CadetOverview.tsx          # Обновлен под темы
├── app/api/
│   ├── campaigns/[id]/route.ts        # Сохранение themeConfig
│   ├── ai/theme-suggestion/route.ts   # Mock AI для тем
│   ├── ai/funnel-recommendation/      # Mock AI для аналитики
│   └── analytics/campaigns/[id]/funnel/ # Метрики воронки
└── lib/seed.ts                        # Демо-данные с темами
```

## 🎨 Доступные темы

1. **Галактическая академия** - высокая геймификация, студенты
2. **Корпоративный мегаполис** - низкая геймификация, специалисты  
3. **ESG-миссия** - сбалансированная, волонтёры

## ⚡ Следующие шаги

- [ ] Миграция БД для production
- [ ] Загрузка/превью ассетов (изображения, аудио)
- [ ] Расширенная аналитика A/B тестирования
- [ ] Реальная интеграция AI (OpenAI API)
- [ ] Админка для управления пресетами тем
