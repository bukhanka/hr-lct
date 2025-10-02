# Кастомизация страницы онбординга под тему кампании

## 🎨 Обзор

Страница присоединения к кампании (`/join/[slug]`) теперь полностью кастомизируется под тему кампании, используя `themeConfig` из базы данных. Это обеспечивает единый пользовательский опыт от момента регистрации до работы в личном кабинете.

## ✅ Что было реализовано

### 1. **Полная интеграция themeConfig**

Страница теперь загружает и использует полный `themeConfig` из кампании:

```typescript
const themeConfig: CampaignThemeConfig = campaign.themeConfig || {
  themeId: "galactic-academy",
  funnelType: "onboarding",
  personas: ["students"],
  gamificationLevel: "high",
  motivationOverrides: { xp: "Опыт", mana: "Мана", rank: "Ранг" },
  palette: {
    primary: "#8B5CF6",
    secondary: "#38BDF8",
    surface: "rgba(23, 16, 48, 0.85)",
  },
};
```

### 2. **Кастомная палитра цветов**

#### Фоновые эффекты
Динамические blob-эффекты используют цвета из `palette`:

```jsx
<div style={{ backgroundColor: themeConfig.palette?.primary || "#8B5CF6" }} />
<div style={{ backgroundColor: themeConfig.palette?.secondary || "#38BDF8" }} />
```

#### Кнопка регистрации
Градиент кнопки адаптируется под тему:

```jsx
<button style={{
  background: `linear-gradient(to right, ${themeConfig.palette?.primary}, ${themeConfig.palette?.secondary})`,
}}>
  {getThemeCTA(themeConfig.themeId)}
</button>
```

### 3. **Мотивационные переопределения**

Карточки статистики показывают кастомизированные названия валют:

| Тема | XP → | Мана → | Ранг → |
|------|------|--------|--------|
| `galactic-academy` | Опыт | Мана | Ранг |
| `esg-mission` | **Вклад** | **Импакт** | Статус |
| `corporate-metropolis` | KPI | Бонусы | Статус |
| `cyberpunk-hub` | Репутация | Кредиты | Уровень доступа |
| `scientific-expedition` | Исследовательские очки | Образцы | Научная степень |

```jsx
<div className="text-xs text-white/80 font-medium">{motivators.xp}</div>
<div className="text-xs text-white/80 font-medium">{motivators.mana}</div>
<div className="text-xs text-white/80 font-medium">{motivators.rank}</div>
```

### 4. **Тематические элементы**

#### Иконки и символы
Каждая тема имеет уникальную иконку:
- `galactic-academy`: 🚀 Rocket
- `esg-mission`: 🌱 Sprout
- `corporate-metropolis`: 🏢 Building2
- `cyberpunk-hub`: ⚡ Zap
- `scientific-expedition`: 🌍 Globe

#### Слоганы
Уникальный слоган для каждой темы:
- `galactic-academy`: "Покоряй космос вместе с нами"
- `esg-mission`: "Создавай лучшее будущее для всех"
- `corporate-metropolis`: "Строй карьеру с нами"
- `cyberpunk-hub`: "Взломай свой потенциал"
- `scientific-expedition`: "Исследуй неизведанное"

#### CTA кнопки
Тематизированные призывы к действию:
- `galactic-academy`: "Начать путешествие"
- `esg-mission`: "Присоединиться к миссии"
- `corporate-metropolis`: "Начать карьеру"
- `cyberpunk-hub`: "Войти в сеть"
- `scientific-expedition`: "Начать исследование"

## 🎭 Примеры тем

### ESG Mission (Зелёная тема)
```
URL: /join/programma-esg-vklad-v-buduschee

Визуал:
- 🌱 Иконка: Sprout
- 🎨 Палитра: Зелёные тона (#22C55E, #4ADE80)
- 📊 Мотиваторы: Вклад, Импакт, Статус
- 💬 Слоган: "Создавай лучшее будущее для всех"
- 🔘 CTA: "Присоединиться к миссии"
```

### Galactic Academy (Космическая тема)
```
URL: /join/put-v-kosmos

Визуал:
- 🚀 Иконка: Rocket
- 🎨 Палитра: Фиолетово-синие тона (#8B5CF6, #38BDF8)
- 📊 Мотиваторы: Опыт, Мана, Ранг
- 💬 Слоган: "Покоряй космос вместе с нами"
- 🔘 CTA: "Начать путешествие"
```

### Corporate Metropolis (Корпоративная тема)
```
URL: /join/korporativnaya-adaptaciya

Визуал:
- 🏢 Иконка: Building2
- 🎨 Палитра: Серо-синие тона (#38BDF8, #0EA5E9)
- 📊 Мотиваторы: KPI, Бонусы, Статус
- 💬 Слоган: "Строй карьеру с нами"
- 🔘 CTA: "Начать карьеру"
```

## 📋 Связь с другими компонентами

### Database (schema.prisma)
```prisma
model Campaign {
  id          String   @id @default(cuid())
  slug        String?  @unique  // Для invite URLs
  themeConfig Json?    // Полная конфигурация темы
  // ...
}
```

### Seed данные (seed.ts)
Каждая кампания в seed.ts создается с детальным `themeConfig`:

```typescript
await prisma.campaign.create({
  data: {
    slug: "programma-esg-vklad-v-buduschee",
    themeConfig: {
      themeId: "esg-mission",
      motivationOverrides: {
        xp: "Вклад",
        mana: "Импакт",
        rank: "Статус"
      },
      palette: {
        primary: "#22C55E",
        secondary: "#4ADE80",
        surface: "rgba(6, 24, 18, 0.9)"
      },
      // ...
    }
  }
});
```

### Dashboard (ThemeProvider)
После регистрации пользователь попадает в dashboard, где используется тот же `themeConfig` через `ThemeProvider`.

## 🔄 Полный flow кастомизации

```
1. HR создает кампанию в конструкторе
   └─> Выбирает тему, настраивает цвета и мотиваторы
   
2. Campaign.themeConfig сохраняется в БД
   └─> Включает palette, motivationOverrides, themeId

3. Генерируется invite link: /join/campaign-slug
   └─> QR-код ведет на эту страницу

4. Кандидат открывает /join/campaign-slug
   └─> Страница загружает themeConfig из API
   └─> Применяет кастомные цвета, иконки, терминологию
   └─> Показывает тематизированную форму регистрации

5. После регистрации → /onboarding
   └─> Затем → /dashboard/cadet
   └─> ThemeProvider применяет ту же тему во всём интерфейсе
```

## 🎯 Бизнес-ценность

1. **Единый опыт**: Кандидат видит согласованную тему от приглашения до dashboard
2. **Персонализация**: Темы адаптированы под целевые аудитории (студенты, волонтёры, профессионалы)
3. **Бренд работодателя**: ESG-кампании выглядят "зелёными", корпоративные — профессиональными
4. **Мотивация**: Правильная терминология повышает вовлечённость (например, "Импакт" для волонтёров)

## 🚀 Что дальше

### Возможные улучшения:
1. **Фоновые изображения**: Использовать `themeConfig.assets.background` для SVG/PNG фонов
2. **Аудио**: Фоновая музыка при загрузке страницы (опционально)
3. **Анимации**: Адаптировать под `gamificationLevel` (high = больше эффектов)
4. **A/B тестирование**: Разные варианты join страницы для одной кампании

## 📝 Техническая документация

### Типы
```typescript
interface CampaignThemeConfig {
  themeId: string;
  funnelType: FunnelType;
  personas: string[];
  gamificationLevel: GamificationLevel;
  motivationOverrides?: {
    xp?: string;
    mana?: string;
    rank?: string;
  };
  palette?: {
    primary: string;
    secondary: string;
    surface: string;
  };
  assets?: ThemeAssets;
}
```

### API endpoint
```
GET /api/campaigns?slug=programma-esg-vklad-v-buduschee

Response:
{
  "campaigns": [{
    "id": "...",
    "name": "Программа ESG: вклад в будущее",
    "slug": "programma-esg-vklad-v-buduschee",
    "themeConfig": { ... }
  }]
}
```

---

**Дата создания**: 2 октября 2025  
**Статус**: ✅ Реализовано и протестировано  
**Файлы**: `/app/src/app/join/[slug]/page.tsx`

