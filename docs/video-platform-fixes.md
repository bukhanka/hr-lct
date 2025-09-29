# Исправление поддержки контроля перемотки

## Проблема

В интерфейсе для Rutube и других российских платформ показывалось сообщение:
> "Разрешить перемотку (не поддерживается платформой)"

## Причина

Неправильная настройка флага `disableSeek` в конфигурации платформ:

```typescript
// ❌ БЫЛО (неправильно)
supportedFeatures: {
  disableSeek: false // означает "НЕ может отключать перемотку"
}

// ✅ СТАЛО (правильно)  
supportedFeatures: {
  disableSeek: true // означает "МОЖЕТ отключать перемотку"
}
```

## Исправления

### 1. Rutube
- ✅ Добавлены параметры `seekable: 'false'` и `controlbar: 'false'`
- ✅ Установлен `disableSeek: true`

### 2. VK Video
- ✅ Добавлен параметр `controls: '0'`
- ✅ Установлен `disableSeek: true`

### 3. Яндекс.Видео
- ✅ Добавлен параметр `controls: '0'`  
- ✅ Установлен `disableSeek: true`

### 4. Одноклассники (OK.ru)
- ✅ Добавлен параметр `controls: '0'`
- ✅ Установлен `disableSeek: true`

### 5. Mail.ru Video
- ✅ Добавлен параметр `controls: '0'`
- ✅ Установлен `disableSeek: true`

## Результат

Теперь для всех российских платформ в интерфейсе будет:
```
☑️ Разрешить перемотку
```

Без предупреждающего сообщения о неподдержке.

## Логика интерфейса

В `MissionEditPanel.tsx`:

```typescript
// Checkbox отключен ТОЛЬКО если платформа НЕ поддерживает disableSeek
disabled={features && !features.disableSeek}

// Сообщение показывается ТОЛЬКО если платформа НЕ поддерживает disableSeek  
{features && !features.disableSeek && (
  <span>(не поддерживается платформой)</span>
)}
```

После исправлений для большинства платформ `features.disableSeek = true`, поэтому:
- `!features.disableSeek = false` → Checkbox активен
- Предупреждающее сообщение не показывается
