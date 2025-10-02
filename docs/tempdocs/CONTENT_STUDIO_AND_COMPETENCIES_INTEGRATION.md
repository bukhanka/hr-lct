# Content Studio & Competencies Integration Summary

## 🎯 Проблемы, которые были решены

### 1. **Content Studio не был интегрирован с Mission Edit Panel**
**До:** Архитектор вручную вводил URL видео/аудио/изображений в Mission Edit Panel  
**После:** Кнопка "Из библиотеки" открывает Content Studio для выбора медиа

### 2. **Компетенции не адаптировались под тему кампании**
**До:** Всегда "Адаптивность", "Лидерство" и т.д., даже в космической теме  
**После:** "Пилотирование", "Стратегия флота" для галактической академии; "KPI", "Управление проектами" для корпората

---

## 📚 1. Content Studio Integration

### Добавленные поля в модель Mission

```prisma
model Mission {
  // ... existing fields
  iconUrl          String? // Иконка миссии из Content Studio
  backgroundImage  String? // Фоновое изображение
  backgroundMusic  String? // Фоновая музыка
  narrationAudio   String? // Озвучка описания
}
```

**Миграция применена:** `npx prisma db push`

---

### Mission Edit Panel → Content Studio

#### Новая секция "Медиа" в Mission Edit Panel

Теперь при редактировании миссии есть секция с 4 типами медиа-контента:

```typescript
// Каждое поле имеет:
// 1. Ручной ввод URL
// 2. Кнопку "Из библиотеки" → открывает Content Studio
// 3. Preview выбранного ассета
```

**Поля:**
- 📷 **Иконка миссии** (`iconUrl`)
- 🖼️ **Фоновое изображение** (`backgroundImage`)
- 🎵 **Фоновая музыка** (`backgroundMusic`)
- 🎙️ **Озвучка описания** (`narrationAudio`)

#### Как это работает

```typescript
// Mission Edit Panel
const [isContentStudioOpen, setIsContentStudioOpen] = useState(false);
const [selectingAssetFor, setSelectingAssetFor] = useState<'iconUrl' | 'backgroundImage' | ...>(null);

// При клике на кнопку "Из библиотеки"
const openContentStudio = (assetType: 'iconUrl') => {
  setSelectingAssetFor(assetType);
  setIsContentStudioOpen(true);
};

// Когда пользователь выбрал ассет в Content Studio
const handleAssetSelect = (assetUrl: string) => {
  if (selectingAssetFor === 'videoUrl') {
    updatePayload({ videoUrl: assetUrl }); // Для VIDEO миссий
  } else {
    handleInputChange(selectingAssetFor, assetUrl); // Для остальных полей
  }
  setIsContentStudioOpen(false);
};
```

#### Content Studio Props

```typescript
<ContentStudio
  campaignId={campaignId}
  isOpen={isContentStudioOpen}
  onClose={() => setIsContentStudioOpen(false)}
  onAssetSelect={handleAssetSelect} // ✅ Новый prop
  context={{
    type: "mission",
    id: mission.id,
    name: mission.name,
  }}
/>
```

---

## 🎨 2. Themed Competencies

### Проблема

Компетенции были глобальными и не адаптировались под тему:
- "Адаптивность" в космической академии → должно быть "Пилотирование"
- "Лидерство" в корпорате → должно быть "Управление командой"

### Решение: `competencyOverrides`

Аналогично `motivationOverrides` (XP → Репутация), создана система переименования компетенций под тему.

---

### Типы

```typescript
// src/types/campaignTheme.ts
export interface CampaignThemeConfig {
  themeId: string;
  funnelType: FunnelType;
  personas: string[];
  gamificationLevel: GamificationLevel;
  motivationOverrides?: {
    xp?: string;
    mana?: string;
    rank?: string;
  };
  competencyOverrides?: Record<string, string>; // ✅ Новое!
  palette?: { ... };
  assets?: ThemeAssets;
  customRanks?: RankConfig[];
}
```

---

### Theme Presets с competencyOverrides

#### Galactic Academy (Космическая тема)

```typescript
competencyOverrides: {
  "Адаптивность": "Пилотирование",
  "Аналитическое мышление": "Стратегия флота",
  "Командная работа": "Координация экипажа",
  "Коммуникация": "Межзвёздная связь",
  "Креативность": "Импровизация в кризисе",
  "Лидерство": "Командование",
  "Стрессоустойчивость": "Выносливость в космосе",
  "Техническая грамотность": "Инженерные системы",
}
```

#### Corporate Metropolis (Корпоративная тема)

```typescript
competencyOverrides: {
  "Адаптивность": "Гибкость в работе",
  "Аналитическое мышление": "Анализ данных",
  "Командная работа": "Кросс-функциональное сотрудничество",
  "Коммуникация": "Деловые коммуникации",
  "Креативность": "Инновационное мышление",
  "Лидерство": "Управление командой",
  "Стрессоустойчивость": "Управление временем",
  "Техническая грамотность": "Digital Skills",
}
```

#### ESG Mission (Экологическая тема)

```typescript
competencyOverrides: {
  "Адаптивность": "Экологическая осознанность",
  "Аналитическое мышление": "Анализ воздействия",
  "Командная работа": "Коллективные инициативы",
  "Коммуникация": "Вовлечение сообщества",
  "Креативность": "Устойчивые решения",
  "Лидерство": "Лидерство в изменениях",
  "Стрессоустойчивость": "Долгосрочная приверженность",
  "Техническая грамотность": "Зелёные технологии",
}
```

#### Cyberpunk Hub (Киберпанк тема)

```typescript
competencyOverrides: {
  "Адаптивность": "Адаптация к системе",
  "Аналитическое мышление": "Взлом данных",
  "Командная работа": "Сетевые операции",
  "Коммуникация": "Шифрованная связь",
  "Креативность": "Нестандартные решения",
  "Лидерство": "Командование операцией",
  "Стрессоустойчивость": "Устойчивость к давлению",
  "Техническая грамотность": "Кибернетика",
}
```

#### Scientific Expedition (Научная тема)

```typescript
competencyOverrides: {
  "Адаптивность": "Гибкость исследования",
  "Аналитическое мышление": "Критическое мышление",
  "Командная работа": "Коллаборация в лаборатории",
  "Коммуникация": "Научная коммуникация",
  "Креативность": "Научная креативность",
  "Лидерство": "Руководство проектом",
  "Стрессоустойчивость": "Упорство в исследованиях",
  "Техническая грамотность": "Техническая экспертиза",
}
```

---

### Helper Functions

```typescript
// src/lib/competencies.ts
export function getThemedCompetencyName(
  originalName: string,
  themeConfig?: CampaignThemeConfig | null
): string {
  if (!themeConfig?.competencyOverrides) {
    return originalName;
  }
  return themeConfig.competencyOverrides[originalName] || originalName;
}

export function getThemedCompetencies<T extends { name: string }>(
  competencies: T[],
  themeConfig?: CampaignThemeConfig | null
): T[] {
  return competencies.map(comp => ({
    ...comp,
    name: getThemedCompetencyName(comp.name, themeConfig),
  }));
}
```

---

### ThemeContext

```typescript
// src/contexts/ThemeContext.tsx
interface ThemeContextValue {
  theme: CampaignThemeConfig;
  getMotivationText: (key) => string;
  getCompetencyName: (originalName: string) => string; // ✅ Новое!
  getThemeText: (key: string) => string;
  shouldShowAnimations: () => boolean;
  shouldShowEffects: () => boolean;
  getGradientColors: () => { ... };
}

const getCompetencyName = (originalName: string): string => {
  const overrides = activeTheme.competencyOverrides;
  if (!overrides) return originalName;
  return overrides[originalName] || originalName;
};
```

---

### Использование в компонентах

#### Mission Edit Panel

```typescript
// Отображение компетенций с тематическими названиями
const { getCompetencyName } = useTheme();

{competencies.map((competency) => (
  <div key={competency.id}>
    <p>{getCompetencyName(competency.name)}</p> {/* ✅ "Пилотирование" вместо "Адаптивность" */}
    <NumberStepper value={getCompetencyPoints(competency.id)} ... />
  </div>
))}
```

#### Campaign Settings Panel

```typescript
// UI для редактирования competencyOverrides
<div>
  <label>Переименование компетенций</label>
  {STANDARD_COMPETENCIES.map(name => (
    <div key={name}>
      <label>{name}:</label>
      <input
        value={config.competencyOverrides?.[name] || ""}
        onChange={(e) => handleCompetencyOverride(name, e.target.value)}
        placeholder={`Например: ${COMPETENCY_SUGGESTIONS[config.themeId]?.[name] || name}`}
      />
    </div>
  ))}
</div>
```

#### CompetencyDashboard

```typescript
const { getCompetencyName } = useTheme();

{sortedCompetencies.map((competency) => (
  <div>
    <span>{getCompetencyName(competency.name)}</span> {/* ✅ Тематическое название */}
    <ProgressBar percentage={competency.points / maxPoints * 100} />
  </div>
))}
```

#### CadetGalacticMap

```typescript
const { getCompetencyName } = useTheme();

competencies: mission.competencies?.map(comp => 
  `${getCompetencyName(comp.competency.name)} +${comp.points}`
) || []
```

#### MissionModal

```typescript
const { getCompetencyName } = useTheme();

{mission.competencies?.map((comp, index) => (
  <span>
    {getCompetencyName(comp.competency.name)} +{comp.points}
  </span>
))}
```

---

## 🔄 Как это работает end-to-end

### Сценарий: HR-архитектор создает космическую кампанию

1. **Выбор темы:**
   - Открывает `/dashboard/architect/campaigns/{id}/settings`
   - Выбирает тему "Galactic Academy"
   - Сохраняет → `campaign.themeConfig.competencyOverrides` заполняется из пресета

2. **Создание миссии:**
   - Открывает `/dashboard/architect/campaigns/{id}/builder`
   - Добавляет миссию "Первый полёт"
   - В секции "Компетенции" видит:
     - "Пилотирование" (вместо "Адаптивность")
     - "Координация экипажа" (вместо "Командная работа")
   - Выбирает "Пилотирование +5"

3. **Добавление медиа:**
   - В секции "Медиа" → клик на "Из библиотеки" (Иконка миссии)
   - Открывается Content Studio
   - Выбирает иконку звездолёта из библиотеки
   - `mission.iconUrl` автоматически обновляется

4. **Генерация контента:**
   - Переходит в Content Studio (кнопка в navbar)
   - Генерирует фоновую музыку через AI Generator
   - Музыка появляется в библиотеке
   - Возвращается в Mission Edit Panel → выбирает музыку из библиотеки

5. **Кадет выполняет миссию:**
   - Открывает дашборд кадета
   - Видит миссию "Первый полёт" с иконкой звездолёта
   - Выполняет миссию → получает +5 "Пилотирование"
   - В CompetencyDashboard видит график "Пилотирование: 5 баллов"

---

## ✅ Преимущества интеграции

### Content Studio + Mission Edit Panel

1. **Консистентность:** Все ассеты в одном месте, не теряются
2. **Скорость:** Один клик вместо копипаста URL
3. **Preview:** Сразу видно, что выбрано
4. **Трекинг:** Content Studio показывает, где используется каждый ассет

### Themed Competencies

1. **Иммерсивность:** "Пилотирование" вместо "Адаптивность" → погружение в космическую тему
2. **Гибкость:** HR-архитектор может кастомизировать названия под свою компанию
3. **Единообразие:** Компетенции адаптируются везде автоматически (дашборды, миссии, графики)
4. **Реальная интеграция:** Не просто ресилировка, а реальная связь с narrativом и темой

---

## 📂 Измененные файлы

### База данных
- `app/prisma/schema.prisma` → добавлены поля медиа в Mission

### Типы
- `app/src/types/campaignTheme.ts` → добавлен `competencyOverrides`

### Presets
- `app/src/data/theme-presets.ts` → добавлены competencyOverrides во все темы

### Библиотеки
- `app/src/lib/competencies.ts` → **новый файл** с helper функциями

### Контексты
- `app/src/contexts/ThemeContext.tsx` → добавлен `getCompetencyName()`

### Конструктор
- `app/src/components/constructor/MissionEditPanel.tsx` → секция "Медиа" + Content Studio integration
- `app/src/components/constructor/CampaignSettingsPanel.tsx` → UI для редактирования competencyOverrides

### Studio
- `app/src/components/studio/ContentStudio.tsx` → добавлен prop `onAssetSelect`

### Дашборды (все обновлены для поддержки тематических названий)
- `app/src/components/dashboard/CompetencyDashboard.tsx`
- `app/src/components/dashboard/CadetGalacticMap.tsx`
- `app/src/components/dashboard/MissionModal.tsx`

---

## 🧪 Как протестировать

### Content Studio Integration

1. Откройте конструктор: `/dashboard/architect/campaigns/{id}/builder`
2. Добавьте/редактируйте миссию
3. Перейдите в секцию "Медиа"
4. Кликните "Из библиотеки" → должен открыться Content Studio
5. Выберите любой ассет → URL должен подставиться в поле
6. Сохраните миссию → поле должно сохраниться в БД

### Themed Competencies

1. Откройте настройки кампании: `/dashboard/architect/campaigns/{id}/settings`
2. Выберите тему "Galactic Academy"
3. Откройте конструктор миссий
4. В секции "Компетенции" должны быть космические названия
5. Добавьте компетенцию "Пилотирование +5"
6. Откройте дашборд кадета (или Test Mode)
7. Выполните миссию
8. В CompetencyDashboard должно быть "Пилотирование: 5 баллов"

---

## 🚀 Следующие шаги (опционально)

1. **Автоматическая генерация иконок компетенций** на основе темы
2. **Preview медиа в Mission Card** на карте миссий
3. **Bulk-операции:** выбрать музыку для всех миссий кампании сразу
4. **AI-предложения:** "Для миссии 'Первый полёт' подойдет фоновая музыка 'Space Ambience'"
5. **Кастомизация иконок компетенций** через Content Studio

---

## 📚 Связанные документы

- `/docs/content_studio_guide.md` — подробное описание Content Studio
- `/docs/CAMPAIGN_THEMES_README.md` — система тем кампаний
- `/docs/RANK_CUSTOMIZATION_GUIDE.md` — кастомизация рангов (аналогичный паттерн)

---

**Дата:** 1 октября 2025  
**Статус:** ✅ Интеграция завершена и протестирована

