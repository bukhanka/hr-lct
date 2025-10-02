# Полная система аналитики для HR-архитектора
## Comprehensive Guide | Полное руководство

---

## 📋 Оглавление

1. [Введение и концепция](#введение-и-концепция)
2. [Архитектура системы](#архитектура-системы)
3. [API Endpoints - полное описание](#api-endpoints)
4. [React Components - полное описание](#react-components)
5. [Интерфейсы и страницы](#интерфейсы-и-страницы)
6. [Функциональность в действии](#функциональность-в-действии)
7. [Технические детали](#технические-детали)
8. [Руководство пользователя](#руководство-пользователя)

---

## Введение и концепция

### Проблема

HR-архитектор создаёт воронки для кандидатов и сотрудников, но:
- ❌ Не видит прогресс к бизнес-целям
- ❌ Не понимает, где пользователи застревают
- ❌ Нет real-time статуса активности
- ❌ Сложно анализировать эффективность воронки

### Решение

**Комплексная система аналитики**, которая даёт HR:
- ✅ **Live Status** — кто активен прямо сейчас
- ✅ **Goal Progress** — прогресс к бизнес-целям в реальном времени
- ✅ **User Segments** — автоматическая сегментация по активности
- ✅ **Funnel Analytics** — план vs факт по каждому этапу
- ✅ **Participant Management** — управление с фильтрами и детальными карточками

### Главный принцип

**За 10 секунд HR видит:**
1. 🎯 Идём ли к цели?
2. ⚠️ Где проблемы?
3. 💡 Что делать?

---

## Архитектура системы

### Схема работы

```
┌─────────────────────────────────────────────────────────┐
│                    HR-архитектор                         │
│                 (opens campaign page)                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│              CampaignOverview (главная страница)          │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 1. BusinessContextPanel (бизнес-цели)            │   │
│  └──────────────────────────────────────────────────┘   │
│                       │                                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 2. LiveStatusBoard                               │   │
│  │    • GET /api/analytics/campaigns/[id]/live-status│   │
│  │    • Auto-refresh каждые 30 сек                  │   │
│  └──────────────────────────────────────────────────┘   │
│                       │                                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 3. GoalProgressDashboard                         │   │
│  │    • GET /api/analytics/campaigns/[id]/goal-progress│   │
│  │    • Прогресс к целям, прогноз                   │   │
│  └──────────────────────────────────────────────────┘   │
│                       │                                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 4. UserSegmentsOverview                          │   │
│  │    • GET /api/analytics/campaigns/[id]/segments  │   │
│  │    • Сегментация + insights                      │   │
│  └──────────────────────────────────────────────────┘   │
│                       │                                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 5. CampaignHero (статус кампании)               │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│         Participants Page (управление участниками)        │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Фильтры и сортировка:                            │   │
│  │  • Поиск по имени/email                          │   │
│  │  • Фильтр по статусу (active/stalled)           │   │
│  │  • Фильтр по прогрессу (0-25%, 25-50%, ...)     │   │
│  │  • Сортировка (прогресс, опыт, имя)             │   │
│  └──────────────────────────────────────────────────┘   │
│                       │                                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Таблица участников                               │   │
│  │  • Клик на строку → ParticipantDetailModal      │   │
│  │  • Действия: reset, unlock, remove               │   │
│  └──────────────────────────────────────────────────┘   │
│                       │                                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ ParticipantDetailModal                           │   │
│  │    • GET /api/users/[userId]/profile             │   │
│  │    • Timeline активности                         │   │
│  │    • Компетенции                                 │   │
│  │    • Детальная статистика                        │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│      Analytics Page (глубокая аналитика воронки)         │
│                                                           │
│  • GET /api/analytics/campaigns/[id]/funnel              │
│  • Детальная воронка с drop-off анализом                 │
│  • AI рекомендации                                       │
│  • FunnelChart визуализация                              │
└──────────────────────────────────────────────────────────┘
```

### Стек технологий

```yaml
Frontend:
  - React 18 + TypeScript
  - Next.js 15 (App Router)
  - Tailwind CSS
  - Recharts (для графиков)
  - React Flow (для конструктора)

Backend:
  - Next.js API Routes
  - Prisma ORM
  - PostgreSQL

Real-time:
  - Auto-refresh polling (30 сек)
  - Опционально: WebSocket/SSE

Deployment:
  - Vercel / любой Node.js хостинг
```

---

## API Endpoints

### 1. GET `/api/analytics/campaigns/[id]/live-status`

**Назначение:** Возвращает live статус активности в кампании

**Response:**
```typescript
{
  timestamp: string;
  activeNow: {
    count: number;
    users: Array<{
      userId: string;
      userName: string;
      missionId: string;
      missionName: string;
      startedAt: string | null;
    }>;
  };
  activeLastHour: {
    count: number;
  };
  activeToday: {
    count: number;
  };
  newToday: {
    count: number;
    users: Array<{
      userId: string;
      userName: string;
      joinedAt: string;
    }>;
  };
  stuckUsers: {
    count: number;
    users: Array<{
      userId: string;
      userName: string;
      missionId: string;
      missionName: string;
      daysStuck: number;
    }>;
  };
  activityByDay: Array<{
    date: string; // YYYY-MM-DD
    count: number;
  }>;
  topActiveMissions: Array<{
    missionId: string;
    missionName: string;
    activityCount: number;
    completedToday: number;
  }>;
}
```

**Пример:**
```json
{
  "timestamp": "2025-10-01T15:30:00.000Z",
  "activeNow": {
    "count": 12,
    "users": [
      {
        "userId": "u-123",
        "userName": "Алекс Новиков",
        "missionId": "m-456",
        "missionName": "Личное собеседование",
        "startedAt": "2025-10-01T15:20:00.000Z"
      }
    ]
  },
  "activeToday": { "count": 45 },
  "newToday": { "count": 23, "users": [...] },
  "stuckUsers": {
    "count": 8,
    "users": [
      {
        "userId": "u-789",
        "userName": "Мария Иванова",
        "missionName": "Мотивационное эссе",
        "daysStuck": 6
      }
    ]
  }
}
```

**Логика:**
- **ActiveNow**: пользователи со статусом `IN_PROGRESS`
- **ActiveToday**: активность за последние 24ч (completedAt или startedAt >= 24h ago)
- **StuckUsers**: `IN_PROGRESS` и startedAt > 5 дней назад
- **ActivityByDay**: агрегация по дням за последние 7 дней

---

### 2. GET `/api/analytics/campaigns/[id]/goal-progress`

**Назначение:** Прогресс кампании к бизнес-целям из Campaign Brief

**Response:**
```typescript
{
  campaign: {
    id: string;
    name: string;
  };
  businessGoal: string | null;
  timeline: {
    startDate: string | null;
    endDate: string | null;
    totalDays: number | null;
    daysPassed: number | null;
    daysRemaining: number | null;
    progressPercentage: number | null;
  };
  target: {
    totalUsers: number;
    targetCompletions: number;
    targetConversionRate: number;
  };
  actual: {
    registered: number;
    withProgress: number;
    completedFullFunnel: number;
    conversionRate: number;
  };
  performance: {
    onTrack: boolean;
    status: "excellent" | "good" | "warning" | "critical";
    deviation: number;
    dailyRateNeeded: number;
    currentDailyRate: number;
  };
  projection: {
    projectedCompletions: number;
    projectedConversionRate: number;
    willMeetGoal: boolean;
  };
  funnelProgress: Array<{
    stage: string;
    description: string;
    targetRate: number;
    actualRate: number;
    usersCompleted: number;
    totalUsers: number;
    status: string;
    deviation: number;
  }>;
}
```

**Пример:**
```json
{
  "businessGoal": "Привлечь 150 студентов, получить 30 офферов",
  "target": {
    "totalUsers": 150,
    "targetCompletions": 30,
    "targetConversionRate": 20
  },
  "actual": {
    "registered": 150,
    "completedFullFunnel": 18,
    "conversionRate": 12
  },
  "performance": {
    "onTrack": false,
    "status": "warning",
    "deviation": -8,
    "dailyRateNeeded": 0.27,
    "currentDailyRate": 0.4
  },
  "projection": {
    "projectedCompletions": 36,
    "projectedConversionRate": 24,
    "willMeetGoal": true
  }
}
```

**Логика расчёта:**

1. **Actual Conversion Rate:**
   ```js
   actualConversionRate = (completedFullFunnel / registered) * 100
   ```

2. **Target Conversion Rate:**
   Парсится из `successMetrics.primary` (например: "20% (30 из 150)")

3. **Performance Status:**
   - `excellent`: actual >= 100% от target
   - `good`: actual >= 90% от target
   - `warning`: actual >= 75% от target
   - `critical`: actual < 75% от target

4. **Daily Rate:**
   ```js
   currentDailyRate = completedFullFunnel / daysPassed
   dailyRateNeeded = (targetCompletions - completedFullFunnel) / daysRemaining
   ```

5. **Projection:**
   ```js
   projectedTotal = completedFullFunnel + (currentDailyRate * daysRemaining)
   willMeetGoal = projectedTotal >= targetCompletions
   ```

---

### 3. GET `/api/analytics/campaigns/[id]/segments`

**Назначение:** Сегментация пользователей по активности

**Response:**
```typescript
{
  totalParticipants: number;
  segments: {
    activeChampions: SegmentData;
    inProgress: SegmentData;
    stalled: SegmentData;
    droppedOff: SegmentData;
  };
  insights: Array<{
    type: "success" | "warning" | "critical";
    title: string;
    description: string;
    action: string | null;
  }>;
}

interface SegmentData {
  count: number;
  percentage: number;
  users: Array<{
    userId: string;
    email: string;
    displayName: string | null;
    completedMissions: number;
    totalMissions: number;
    lastActivity: string | null;
    daysSinceActivity: number;
  }>;
  description: string;
  color: string;
  icon: string;
}
```

**Пример:**
```json
{
  "totalParticipants": 150,
  "segments": {
    "activeChampions": {
      "count": 52,
      "percentage": 35,
      "description": ">3 миссии, активны <24ч",
      "color": "#10b981",
      "icon": "🚀",
      "users": [...]
    },
    "stalled": {
      "count": 33,
      "percentage": 22,
      "description": "Нет активности 7-30 дней",
      "color": "#f59e0b",
      "icon": "⏸️",
      "users": [...]
    }
  },
  "insights": [
    {
      "type": "warning",
      "title": "Высокий процент застрявших",
      "description": "22% не проявляли активность 7-30 дней. Рассмотрите отправку напоминаний.",
      "action": "send_reminder"
    }
  ]
}
```

**Логика сегментации:**

```typescript
// Вычисляем часы с последней активности
const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);
const daysSinceActivity = hoursSinceActivity / 24;

if (completedMissions >= 3 && hoursSinceActivity <= 24) {
  return "activeChampions";
} else if (completedMissions >= 1 && completedMissions <= 2 && daysSinceActivity <= 7) {
  return "inProgress";
} else if (daysSinceActivity > 7 && daysSinceActivity <= 30) {
  return "stalled";
} else if (daysSinceActivity > 30) {
  return "droppedOff";
}
```

**Insights логика:**
```typescript
if (stalledPercentage > 20) {
  insights.push({
    type: "warning",
    title: "Высокий процент застрявших",
    description: `${stalledPercentage}% не активны 7-30 дней`,
    action: "send_reminder"
  });
}

if (droppedPercentage > 15) {
  insights.push({
    type: "critical",
    title: "Критический отток",
    ...
  });
}

if (activePercentage > 40) {
  insights.push({
    type: "success",
    title: "Отличная активность!",
    ...
  });
}
```

---

### 4. GET `/api/analytics/campaigns/[id]/funnel`

**Назначение:** Детальная аналитика воронки

**Response:**
```typescript
{
  campaign: {
    id: string;
    name: string;
    theme: string;
  };
  summary: {
    totalMissions: number;
    totalUniqueUsers: number;
    overallCompletionRate: number;
    dropOffPoints: Array<{
      missionId: string;
      missionName: string;
      dropOffRate: number;
    }>;
  };
  campaignStats: {
    total_users: number;
    active_users: number;
    total_completions: number;
    overall_completion_rate: number;
  };
  funnel: Array<{
    missionId: string;
    missionName: string;
    stage: string;
    users: number;
    completed: number;
    dropOff: number;
  }>;
  cohorts: Array<{...}>;
}
```

---

### 5. GET `/api/campaigns/[id]/participants`

**Назначение:** Список участников кампании с их прогрессом

**Response:**
```typescript
{
  participants: Array<{
    userId: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    assignedAt: string;
    stats: {
      experience: number;
      mana: number;
      currentRank: number;
      totalMissions: number;
      completedMissions: number;
      inProgressMissions: number;
      lockedMissions: number;
      completionRate: number;
    };
    lastActivity: {
      missionName: string;
      date: string;
      status: string;
    } | null;
    competencies: Array<{
      name: string;
      points: number;
    }>;
  }>;
  summary: {
    totalParticipants: number;
    activeParticipants: number;
    avgCompletionRate: number;
  };
}
```

---

### 6. GET `/api/users/[userId]/profile`

**Назначение:** Полный профиль пользователя для детального просмотра

**Response:**
```typescript
{
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: string;
  experience: number;
  mana: number;
  currentRank: number;
  competencies: Array<{
    competency: {
      id: string;
      name: string;
      iconUrl: string | null;
    };
    points: number;
  }>;
  missions: Array<{
    mission: {
      id: string;
      name: string;
      missionType: string;
      experienceReward: number;
      manaReward: number;
      campaign: {
        id: string;
        name: string;
      };
    };
    status: string;
    startedAt: string | null;
    completedAt: string | null;
  }>;
  purchases: Array<...>;
  notifications: Array<...>;
  stats: {
    totalMissions: number;
    completedMissions: number;
    inProgressMissions: number;
    completionRate: number;
  };
}
```

---

## React Components

### 1. LiveStatusBoard

**Файл:** `app/src/components/analytics/LiveStatusBoard.tsx`

**Props:**
```typescript
interface LiveStatusBoardProps {
  campaignId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // в секундах, default 30
}
```

**Что показывает:**
- 🔴 **LIVE**: Кто активен прямо сейчас (в миссии)
- ⏱️ Активность за последний час / 24ч
- 📈 Новых за последние 24ч
- ⚠️ Застрявшие на миссиях (>5 дней)
- 📊 График активности за 7 дней
- 🏆 Топ-3 самых активных миссий сегодня

**Особенности:**
- Auto-refresh каждые 30 сек (если `autoRefresh=true`)
- Зелёная индикация live статуса (пульсирующая точка)
- Показывает время последнего обновления

**Использование:**
```tsx
<LiveStatusBoard 
  campaignId="cmg123" 
  autoRefresh 
  refreshInterval={30} 
/>
```

---

### 2. GoalProgressDashboard

**Файл:** `app/src/components/analytics/GoalProgressDashboard.tsx`

**Props:**
```typescript
interface GoalProgressDashboardProps {
  campaignId: string;
}
```

**Что показывает:**
- 🎯 Бизнес-цель из Campaign Brief
- 📊 Прогресс-бар: факт vs план
- ✅ Статус badge (excellent/good/warning/critical)
- 📈 Метрики:
  - Конверсия: факт vs цель
  - Скорость: текущая vs необходимая
  - Времени осталось
- 🔮 Прогноз достижения цели
- ⚡ Воронка план vs факт по этапам

**Цветовая индикация:**
```typescript
const statusConfig = {
  excellent: { color: "emerald", label: "Отлично", icon: "🎯" },
  good: { color: "green", label: "Хорошо", icon: "✅" },
  warning: { color: "amber", label: "Внимание", icon: "⚠️" },
  critical: { color: "red", label: "Критично", icon: "❌" },
};
```

**Использование:**
```tsx
{campaign.briefCompleted && campaign.businessGoal && (
  <GoalProgressDashboard campaignId={campaignId} />
)}
```

---

### 3. UserSegmentsOverview

**Файл:** `app/src/components/analytics/UserSegmentsOverview.tsx`

**Props:**
```typescript
interface UserSegmentsOverviewProps {
  campaignId: string;
}
```

**Что показывает:**
- 📊 Карточки сегментов:
  - 🚀 Active Champions (>3 миссии, <24ч)
  - 🔄 In Progress (1-2 миссии, <7 дней)
  - ⏸️ Stalled (7-30 дней неактивности)
  - ❌ Dropped Off (>30 дней)
- 🎨 Визуальное распределение (progress bar)
- 💡 Автоматические insights

**Insights примеры:**
```typescript
⚠️ Высокий процент застрявших
22% не проявляли активность 7-30 дней. 
Рассмотрите отправку напоминаний.

❌ Критический отток
15% не возвращались >30 дней. 
Проанализируйте, где они застревают.

✅ Отличная активность!
40% активно проходят кампанию.
```

---

### 4. ParticipantDetailModal

**Файл:** `app/src/components/analytics/ParticipantDetailModal.tsx`

**Props:**
```typescript
interface ParticipantDetailModalProps {
  userId: string;
  campaignId: string;
  onClose: () => void;
}
```

**Что показывает:**
- 👤 Профиль пользователя
- ⭐ Статистика (XP, мана, ранг)
- 📊 Прогресс по миссиям
- 🎖️ Компетенции с баллами
- 📅 Timeline активности:
  - ✅ Выполненные миссии (с датами)
  - 🔄 В процессе
  - ⏸️ На проверке
  - 🔒 Заблокированные
- 💰 Награды за каждую миссию

**Статусы миссий:**
```typescript
const statusConfig = {
  COMPLETED: { label: "Выполнено", color: "emerald", icon: CheckCircle },
  IN_PROGRESS: { label: "В процессе", color: "blue", icon: Loader2 },
  PENDING_REVIEW: { label: "На проверке", color: "amber", icon: Clock },
  AVAILABLE: { label: "Доступна", color: "purple", icon: TrendingUp },
  LOCKED: { label: "Заблокирована", color: "slate", icon: Lock },
};
```

---

### 5. CampaignAnalyticsContent

**Файл:** `app/src/components/constructor/CampaignAnalyticsContent.tsx`

**Что показывает:**
- 📊 Общий прогресс кампании
- 📉 Funnel Chart (Recharts)
- 📈 Воронка миссий с метриками
- 💡 AI рекомендации (через `/api/ai/funnel-recommendation`)

---

### 6. FunnelChart

**Файл:** `app/src/components/analytics/FunnelChart.tsx`

**Что показывает:**
- 📊 Bar Chart: начали vs завершили
- 🥧 Pie Chart: распределение по миссиям

**Использует:** Recharts

---

## Интерфейсы и страницы

### 1. Главная страница кампании

**URL:** `/dashboard/architect/campaigns/[campaignId]`

**Файл:** `app/src/app/dashboard/architect/campaigns/[campaignId]/page.tsx`

**Компонент:** `CampaignOverview`

**Секции (сверху вниз):**
1. ✅ Business Context Panel (бизнес-цели)
2. 🆕 Live Status Board
3. 🆕 Goal Progress Dashboard
4. 🆕 User Segments Overview
5. Campaign Hero (статус кампании)
6. Theme Panel & Mission Metrics
7. Next Steps Timeline

**Что видит HR:**
```
┌─────────────────────────────────────────────────┐
│ Бизнес-контекст                                 │
│ "Привлечь 150 студентов, получить 30 офферов"  │
└─────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────┐
│ 🔴 LIVE STATUS              Обновлено: 15:30   │
│                                                 │
│ 🚀 12 прямо сейчас   ⏱ 45 сегодня   📈 +23     │
│                                                 │
│ ⚠️ 8 застряли на "Собеседование" >5 дней       │
└─────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────┐
│ 🎯 Прогресс к бизнес-цели                      │
│                                                 │
│ [==========60%==========------------] 18/30     │
│                                                 │
│ ✅ Статус: Хорошо                              │
│                                                 │
│ • Конверсия: 12% (цель 20%) ⚠️ -8%            │
│ • Скорость: 0.4/день (нужно 0.27) ✅           │
│ • Осталось: 45 дней                            │
│                                                 │
│ 📈 Прогноз: Цель будет достигнута              │
│    При текущей скорости → 36 завершений (24%)  │
│                                                 │
│ ⚡ Воронка: план vs факт                       │
│ Регистрация         100% → 100% ✅              │
│ Мотив эссе          80%  → 65%  ⚠️ -15%       │
│ Брифинг             75%  → 58%  ❌ -17%        │
│ Собеседование       40%  → 28%  ❌ -12%        │
└─────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────┐
│ 👥 Сегментация участников                      │
│                                                 │
│ 🚀 Active      🔄 In Progress   ⏸️ Stalled     │
│    52 (35%)       42 (28%)        33 (22%)     │
│                                                 │
│ [======35%======|===28%===|==22%==|=15%=]      │
│                                                 │
│ ⚠️ 22% не активны 7-30 дней                    │
│    Рассмотрите отправку напоминаний            │
└─────────────────────────────────────────────────┘
```

---

### 2. Страница участников

**URL:** `/dashboard/architect/campaigns/[campaignId]/participants`

**Файл:** `app/src/app/dashboard/architect/campaigns/[campaignId]/participants/page.tsx`

**Функционал:**

#### Фильтры и поиск:
```tsx
// Поиск по имени или email
<input 
  type="text" 
  placeholder="🔍 Поиск..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
/>

// Фильтр по статусу
<select value={filterStatus}>
  <option value="all">Все статусы</option>
  <option value="active">Активные</option>
  <option value="stalled">Застрявшие</option>
</select>

// Фильтр по прогрессу
<select value={filterProgress}>
  <option value="all">Весь прогресс</option>
  <option value="0-25">0-25%</option>
  <option value="25-50">25-50%</option>
  <option value="50-75">50-75%</option>
  <option value="75-100">75-100%</option>
</select>

// Сортировка
<select value={sortBy}>
  <option value="progress_desc">Прогресс ↓</option>
  <option value="progress_asc">Прогресс ↑</option>
  <option value="experience_desc">Опыт ↓</option>
  <option value="experience_asc">Опыт ↑</option>
  <option value="name_asc">Имя А-Я</option>
  <option value="name_desc">Имя Я-А</option>
</select>
```

#### Логика фильтрации:
```typescript
const getFilteredAndSortedParticipants = () => {
  let filtered = [...data.participants];

  // Поиск
  if (searchQuery) {
    filtered = filtered.filter(p =>
      p.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Фильтр по статусу
  if (filterStatus === "active") {
    filtered = filtered.filter(p => p.stats.completedMissions > 0);
  }
  if (filterStatus === "stalled") {
    filtered = filtered.filter(p => 
      p.stats.completedMissions === 0 && 
      p.stats.inProgressMissions === 0
    );
  }

  // Фильтр по прогрессу
  if (filterProgress === "0-25") {
    filtered = filtered.filter(p => 
      p.stats.completionRate >= 0 && p.stats.completionRate < 25
    );
  }
  // ... остальные диапазоны

  // Сортировка
  filtered.sort((a, b) => {
    if (sortBy === "progress_desc") {
      return b.stats.completionRate - a.stats.completionRate;
    }
    // ... остальные варианты
  });

  return filtered;
};
```

#### Детальная карточка:
```tsx
// Клик на строку таблицы
<tr onClick={() => setSelectedUserId(participant.userId)}>
  ...
</tr>

// Модальное окно
{selectedUserId && (
  <ParticipantDetailModal
    userId={selectedUserId}
    campaignId={campaignId}
    onClose={() => setSelectedUserId(null)}
  />
)}
```

#### Действия над участниками:
```tsx
// Кнопки действий (stopPropagation чтобы не открывать модал)
<button
  onClick={(e) => {
    e.stopPropagation();
    handleAction(userId, "reset_progress");
  }}
>
  <RotateCcw /> Сбросить прогресс
</button>

<button
  onClick={(e) => {
    e.stopPropagation();
    handleAction(userId, "unlock_all");
  }}
>
  <Unlock /> Разблокировать всё
</button>

<button
  onClick={(e) => {
    e.stopPropagation();
    handleAction(userId, "remove");
  }}
>
  <UserMinus /> Удалить из кампании
</button>
```

---

### 3. Страница Analytics

**URL:** `/dashboard/architect/campaigns/[campaignId]/analytics`

**Файл:** `app/src/app/dashboard/architect/campaigns/[campaignId]/analytics/page.tsx`

**Компонент:** `CampaignAnalyticsContent`

**Что показывает:**
- Общий прогресс кампании (карточки метрик)
- Funnel Chart (визуализация)
- Детальная воронка миссий
- AI рекомендации

---

## Функциональность в действии

### Сценарий 1: Утренняя проверка статуса

**HR открывает главную страницу кампании:**

```
09:00 - Открыл /dashboard/architect/campaigns/[id]

1. Видит Live Status:
   "🔴 23 кадета активны прямо сейчас"
   "⚠️ 5 застряли на 'Собеседование' >6 дней"
   → Решение: Нужно связаться с застрявшими

2. Смотрит Goal Progress:
   "📊 18/30 завершений (60%)"
   "⚠️ Конверсия 12% (цель 20%, -8%)"
   "📈 Прогноз: Цель будет достигнута (24%)"
   → Решение: Скорость хорошая, но нужно улучшить конверсию

3. Анализирует воронку план vs факт:
   "❌ Мотивационное эссе: 65% (цель 80%, -15%)"
   "❌ Просмотр брифинга: 58% (цель 75%, -17%)"
   → Решение: Проблема в эссе и брифинге

4. Проверяет сегменты:
   "⚠️ 22% застряли (7-30 дней)"
   → Решение: Отправить email-напоминание

Итог: За 2 минуты понял:
- Есть проблема с мотивационным эссе
- Нужно активировать застрявших
- Общий прогноз положительный
```

---

### Сценарий 2: Глубокий анализ участника

**HR хочет понять, почему участник застрял:**

```
1. Переходит на /participants
2. Ищет "Иван Петров" в поиске
3. Кликает на строку
   → Открывается ParticipantDetailModal

Видит:
┌──────────────────────────────────────────┐
│ Иван Петров                              │
│ ivan.petrov@example.com                  │
│                                          │
│ ⭐ 125 XP   💎 60 маны   🎖️ Ранг 2      │
│                                          │
│ Прогресс: 2/5 миссий (40%)               │
│                                          │
│ Timeline:                                │
│ ✅ 01 окт - Тест на профпригодность      │
│ ✅ 03 окт - Мотивационное эссе           │
│ 🔄 05 окт - Брифинг (в процессе 7 дней) │
│ 🔒 Собеседование (заблокировано)         │
│ 🔒 Обратная связь (заблокировано)        │
│                                          │
│ Компетенции:                             │
│ • Аналитическое мышление: 3 pts          │
│ • Коммуникация: 5 pts                    │
└──────────────────────────────────────────┘

Проблема: Застрял на "Брифинге" уже 7 дней!
Решение: Отправить напоминание или упростить миссию
```

---

### Сценарий 3: Еженедельный отчёт

**HR готовит отчёт для руководства:**

```
1. Открывает Goal Progress Dashboard
   → Скриншот прогресса к целям

2. Переходит на /analytics
   → Экспортирует FunnelChart

3. Копирует ключевые метрики:
   - Зарегистрировано: 150
   - Завершили: 18 (12%)
   - Прогноз: 36 (24%)
   - Проблемные этапы: Эссе (-15%), Брифинг (-17%)

4. Recommendations:
   - Упростить форму эссе
   - Сократить видео брифинга
   - Отправить напоминания застрявшим (33 чел)

Отчёт готов за 10 минут!
```

---

## Технические детали

### Оптимизация производительности

#### 1. Кеширование запросов

```typescript
// В API endpoints
export const dynamic = 'force-dynamic'; // Для live data
export const revalidate = 300; // 5 минут для goal-progress

// Или использовать кеш в функции
const cachedData = await redis.get(`campaign:${id}:goal-progress`);
if (cachedData) {
  return JSON.parse(cachedData);
}

const freshData = await calculateGoalProgress(id);
await redis.set(`campaign:${id}:goal-progress`, JSON.stringify(freshData), 'EX', 300);
```

#### 2. Pagination для участников

```typescript
// Добавить пагинацию
GET /api/campaigns/[id]/participants?page=1&limit=50

// Response
{
  participants: [...],
  pagination: {
    total: 1500,
    page: 1,
    limit: 50,
    totalPages: 30
  }
}
```

#### 3. Debounce для поиска

```typescript
// В компоненте Participants
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

const debouncedSearch = useMemo(
  () => debounce((query: string) => {
    // Выполняем поиск
  }, 300),
  []
);
```

---

### Real-time обновления

#### Вариант 1: Polling (текущий)

```typescript
// LiveStatusBoard
useEffect(() => {
  const interval = setInterval(() => {
    loadData();
  }, refreshInterval * 1000); // 30 сек

  return () => clearInterval(interval);
}, [refreshInterval]);
```

#### Вариант 2: Server-Sent Events

```typescript
// API: app/src/app/api/analytics/campaigns/[id]/live-stream/route.ts
export async function GET(request: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      while (true) {
        const data = await getLiveStatus(campaignId);
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        await sleep(30000); // 30 сек
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Component
useEffect(() => {
  const eventSource = new EventSource(`/api/analytics/campaigns/${campaignId}/live-stream`);
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    setLiveStatus(data);
  };

  return () => eventSource.close();
}, [campaignId]);
```

#### Вариант 3: WebSocket (для больших объёмов)

```typescript
// Требует отдельный WebSocket сервер
import { io } from 'socket.io-client';

const socket = io('ws://your-server.com');

socket.on('live-status', (data) => {
  setLiveStatus(data);
});
```

---

### Безопасность

#### 1. Проверка ролей

```typescript
// В каждом API endpoint
const session = await getServerSession(authConfig);

if (!session || (session as any)?.user?.role !== "architect") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

#### 2. Валидация параметров

```typescript
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().cuid(),
});

const { id } = paramsSchema.parse(await params);
```

#### 3. Rate limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // 100 запросов
});

export async function GET(request: Request) {
  await limiter(request);
  // ...
}
```

---

## Руководство пользователя

### Быстрый старт

#### 1. Создайте кампанию

```
1. Перейдите в /dashboard/architect
2. Нажмите "Создать кампанию"
3. Заполните Campaign Brief:
   - Бизнес-цель
   - Целевая аудитория
   - Метрики успеха
   - Целевые показатели воронки
```

#### 2. Постройте воронку

```
1. Откройте конструктор (/builder)
2. Добавьте миссии
3. Настройте зависимости
4. Сохраните
```

#### 3. Пригласите участников

```
1. Перейдите на /participants
2. Нажмите "Generate Invite Link"
3. Отправьте ссылку участникам
```

#### 4. Отслеживайте прогресс

```
1. Откройте главную страницу кампании
2. Смотрите:
   - Live Status: кто активен сейчас
   - Goal Progress: идём ли к цели
   - User Segments: кто застрял
3. При необходимости:
   - Отправьте напоминания
   - Упростите сложные миссии
   - Разблокируйте миссии вручную
```

---

### FAQ

#### Q: Как часто обновляются данные?

A:
- **Live Status**: каждые 30 сек (auto-refresh)
- **Goal Progress**: при загрузке страницы
- **User Segments**: при загрузке страницы
- **Participants**: при загрузке страницы + кнопка "Обновить"

#### Q: Можно ли экспортировать данные?

A: Пока нет, но планируется в Phase 3:
- Export в Excel
- Export в PDF
- Scheduled email reports

#### Q: Как изменить целевые показатели воронки?

A:
```
1. Откройте /campaigns/[id]/settings
2. Найдите "Campaign Brief"
3. Измените successMetrics.conversionFunnel
4. Сохраните
```

#### Q: Почему прогноз показывает "willMeetGoal: false"?

A: Прогноз рассчитывается на основе текущей скорости прохождения. Если при текущих темпах цель не будет достигнута, система предупреждает об этом.

**Решение:**
- Увеличьте приток новых участников
- Упростите сложные миссии
- Отправьте напоминания застрявшим

#### Q: Что делать с "застрявшими" пользователями?

A:
1. Откройте ParticipantDetailModal
2. Посмотрите на какой миссии застрял
3. Варианты действий:
   - Отправить напоминание
   - Упростить миссию
   - Разблокировать следующую миссию вручную
   - Позвонить лично (если важный кандидат)

---

### Лучшие практики

#### 1. Регулярно проверяйте Live Status

```
✅ Проверяйте 2-3 раза в день
✅ Обращайте внимание на stuckUsers
✅ Анализируйте topActiveMissions
```

#### 2. Используйте фильтры на странице Participants

```
✅ Найдите всех "Stalled" (фильтр по статусу)
✅ Отсортируйте по прогрессу (сначала отстающие)
✅ Используйте поиск для конкретных людей
```

#### 3. Следите за Goal Progress

```
✅ Если status = "critical" → срочно корректируйте
✅ Если deviation < -15% → анализируйте причины
✅ Если willMeetGoal = false → пересмотрите стратегию
```

#### 4. Анализируйте Funnel Progress

```
✅ Находите этапы с deviation < -10%
✅ Упрощайте сложные миссии
✅ A/B тестируйте изменения
```

---

### Глоссарий

| Термин | Описание |
|--------|----------|
| **Campaign** | Воронка миссий для достижения HR-цели |
| **Mission** | Отдельная задача в воронке (тест, файл, событие) |
| **Cadet** | Участник кампании |
| **Architect** | HR-специалист, создающий кампании |
| **XP (Experience)** | Очки опыта, начисляемые за миссии |
| **Mana** | Игровая валюта для покупок в магазине |
| **Rank** | Ранг пользователя (1-5) |
| **Competency** | Навык, прокачиваемый через миссии |
| **Active Champions** | Пользователи с >3 миссий, активны <24ч |
| **Stalled** | Пользователи без активности 7-30 дней |
| **Dropped Off** | Пользователи без активности >30 дней |
| **Conversion Rate** | % пользователей, завершивших всю воронку |
| **Drop-off** | % пользователей, покинувших воронку |
| **Campaign Brief** | Бизнес-контекст кампании (цели, метрики) |

---

## Заключение

Эта система аналитики превращает HR-платформу из **простого конструктора** в **мощный инструмент управления воронками**:

✅ **Видимость**: HR видит всё в реальном времени  
✅ **Контроль**: Прогресс к целям, прогнозы, отклонения  
✅ **Действия**: Конкретные рекомендации, что делать  
✅ **Эффективность**: Фильтры, поиск, детальные карточки  

**Результат:** HR принимает решения на основе данных, а не интуиции.

---

## Файловая структура

```
app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── analytics/
│   │   │       └── campaigns/
│   │   │           └── [id]/
│   │   │               ├── live-status/
│   │   │               │   └── route.ts          ✅ Live статус
│   │   │               ├── goal-progress/
│   │   │               │   └── route.ts          ✅ Прогресс к целям
│   │   │               ├── segments/
│   │   │               │   └── route.ts          ✅ Сегментация
│   │   │               └── funnel/
│   │   │                   └── route.ts          ✅ Воронка
│   │   │
│   │   └── dashboard/
│   │       └── architect/
│   │           └── campaigns/
│   │               └── [campaignId]/
│   │                   ├── page.tsx              ✅ Главная (Overview)
│   │                   ├── participants/
│   │                   │   └── page.tsx          ✅ Участники
│   │                   └── analytics/
│   │                       └── page.tsx          ✅ Аналитика
│   │
│   └── components/
│       ├── analytics/
│       │   ├── LiveStatusBoard.tsx               ✅ Live статус
│       │   ├── GoalProgressDashboard.tsx         ✅ Прогресс к целям
│       │   ├── UserSegmentsOverview.tsx          ✅ Сегменты
│       │   ├── ParticipantDetailModal.tsx        ✅ Детальная карточка
│       │   ├── FunnelChart.tsx                   ✅ График воронки
│       │   └── CampaignAnalyticsContent.tsx      ✅ Аналитика
│       │
│       └── constructor/
│           ├── CampaignOverview.tsx              ✅ Overview компонент
│           └── BusinessContextPanel.tsx          ✅ Бизнес-контекст
│
docs/
├── HR_ANALYTICS_COMPLETE_SYSTEM.md               ✅ Этот документ
├── ANALYTICS_CONCEPT.md                          ✅ Концепция
└── ANALYTICS_IMPLEMENTATION_SUMMARY.md           ✅ Итоги Phase 1
```

---

## Changelog

### 2025-10-01 - Version 1.0

✅ **Реализовано:**
- Live Status Board API + Component
- Goal Progress Dashboard API + Component
- User Segments API + Component
- Participant Detail Modal
- Улучшенная страница Participants с фильтрами
- Интеграция в CampaignOverview

📝 **Документация:**
- Comprehensive guide (этот документ)
- API спецификации
- Component описания
- User guide

🚀 **Следующие шаги:**
- Cohort Analysis
- Time-based Analytics
- Mission Deep Dive
- Export функционал

---

**Автор документа:** AI Assistant  
**Дата:** 2025-10-01  
**Версия:** 1.0  
**Статус:** Production Ready ✅

