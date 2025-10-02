# 🚀 Быстрый старт: Система аналитики HR

## За 5 минут к работающей системе

### 1️⃣ Запустите проект

```bash
cd app
npm run dev
```

### 2️⃣ Откройте кампанию

```
http://localhost:3000/dashboard/architect/campaigns/cmg85i5d6002dv1psq0ygwce5
```
*(или любой другой campaignId из вашей базы)*

### 3️⃣ Что вы увидите

#### 🔴 Live Status (обновляется каждые 30 сек)
```
12 кадетов в миссии прямо сейчас
45 активных сегодня
⚠️ 8 застряли на "Собеседование" >5 дней
```

#### 🎯 Прогресс к бизнес-целям
```
18 / 30 завершений (60%)
✅ Статус: Хорошо
Конверсия: 12% (цель 20%) ⚠️ -8%
📈 Прогноз: Цель будет достигнута
```

#### 👥 Сегментация участников
```
🚀 52 Active Champions (35%)
🔄 42 In Progress (28%)
⏸️ 33 Stalled (22%)
❌ 23 Dropped Off (15%)
```

---

## 💡 Главные фичи

### 1. Live Status Board
- Кто активен **прямо сейчас**
- Застрявшие пользователи
- График за 7 дней
- Auto-refresh каждые 30 сек

### 2. Goal Progress
- Прогресс к целям из Campaign Brief
- Прогноз достижения
- Воронка план vs факт

### 3. User Segments
- Автоматическая сегментация
- Insights и рекомендации

### 4. Participant Management
- 🔍 Поиск
- 🎛️ Фильтры
- 🔀 Сортировки
- 👆 Клик → детальная карточка

---

## 📍 Куда идти

### Главная страница кампании:
```
/dashboard/architect/campaigns/[id]
```
Показывает: Live Status, Goal Progress, Segments

### Участники:
```
/dashboard/architect/campaigns/[id]/participants
```
Управление участниками с фильтрами

### Аналитика:
```
/dashboard/architect/campaigns/[id]/analytics
```
Детальная воронка и AI рекомендации

---

## 🔑 Ключевые URL API

```bash
# Live Status
GET /api/analytics/campaigns/[id]/live-status

# Goal Progress
GET /api/analytics/campaigns/[id]/goal-progress

# User Segments
GET /api/analytics/campaigns/[id]/segments

# Funnel Analytics
GET /api/analytics/campaigns/[id]/funnel

# Participants
GET /api/campaigns/[id]/participants

# User Profile
GET /api/users/[userId]/profile
```

---

## 🎨 Цветовая индикация

| Цвет | Значение | Когда |
|------|----------|-------|
| 🟢 Зелёный | Excellent/Good | ≥90% от цели |
| 🟡 Жёлтый | Warning | 75-89% от цели |
| 🔴 Красный | Critical | <75% от цели |

---

## 📖 Полная документация

**Comprehensive Guide (176 KB):**
```
docs/HR_ANALYTICS_COMPLETE_SYSTEM.md
```

Содержит:
- Архитектуру системы
- Все API endpoints с примерами
- Все компоненты
- Сценарии использования
- FAQ и best practices

---

## ✅ Готово к работе!

Система **полностью реализована** и готова к использованию.

**Что дальше?**
1. Откройте любую кампанию
2. Смотрите live статус
3. Анализируйте прогресс
4. Принимайте решения! 🎯

