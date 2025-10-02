# AI Co-Pilot & Best Practices для Campaign Brief

> **Дата:** 1 октября 2025  
> **Статус:** Концепт для реализации  
> **Цель:** Превратить заполнение Brief из пустого поля в интерактивный процесс с AI-помощником и опытом коллег

---

## 🎯 Проблема

**Текущая ситуация:**
HR-специалист открывает Campaign Brief Wizard и видит пустые поля:
- "Бизнес-цель кампании" — **пустое поле**
- "Сегмент аудитории" — **пустое поле**  
- "Метрики успеха" — **пустое поле**

**Проблемы:**
1. ❌ **Writer's block** — не знает с чего начать
2. ❌ **Нет референсов** — не видит примеров успешных кампаний коллег
3. ❌ **Одиночество** — ощущение "я сам по себе"
4. ❌ **AI только для метрик** — ИИ помогает только на шаге 3/5

**Желаемое:**
- ✅ Видеть **примеры из прошлых кампаний** компании
- ✅ **AI-подсказки** на каждом шаге, не только метрики
- ✅ Возможность **взять готовый Brief** и адаптировать под свою задачу
- ✅ **Шаблоны** от экспертов + **опыт коллег** в одном месте

---

## 💡 Решение: Три источника помощи

### 1. 🤖 AI Co-Pilot (расширенный)
**Что делает:** Генерирует контент на основе минимальной информации от HR

**Где помогает:**
- **Шаг 1 (Цель):** "Я ввел 2 слова 'найм стажеров' → AI предлагает 3 варианта полных формулировок"
- **Шаг 2 (Аудитория):** "Я сказал 'студенты' → AI предлагает характеристики: digital natives, Python, etc."
- **Шаг 3 (Метрики):** Уже работает ✅
- **Шаг 4 (Контекст):** "Я выбрал тип 'Onboarding' → AI предлагает типичные цели компании"

### 2. 📚 Best Practices (опыт экспертов)
**Что это:** Готовые шаблоны брифов от HR-экспертов и лучших практик индустрии

**Примеры:**
- "Привлечение студентов на стажировку (Tech)"
- "Онбординг новых сотрудников (удаленка)"
- "ESG волонтерская программа"
- "Assessment центр для руководителей"

**Источник:** Предзаполненные шаблоны в коде (можно расширять через админку)

### 3. 🏢 Опыт коллег (ваши кампании)
**Что это:** Успешные/завершенные кампании из ВАШЕЙ компании

**Механика:**
- Система показывает briefs кампаний с `briefCompleted = true`
- Фильтр: "Только успешные" (например, где конверсия >= плановой)
- Конфиденциальность: показывает только кампании текущего архитектора (phase 1) или всей команды (phase 2)

---

## 🎨 UX/UI Концепция

### Новый элемент: "Помощник Brief" (Brief Helper Panel)

**Позиция:** Правая боковая панель в Brief Wizard (опционально разворачивается)

**Состояния:**
1. **Свернут** (по умолчанию на мобиле) — только иконка в углу
2. **Развернут** (по умолчанию на десктопе) — панель справа, ~300px

**Контент панели:**

```
┌─────────────────────────────────────┐
│  💡 Помощь в заполнении             │
├─────────────────────────────────────┤
│                                     │
│  [🤖 AI Подсказка]  [📚 Шаблоны]   │
│  [🏢 Опыт коллег]                   │
│                                     │
│  ──────────────────────────────     │
│                                     │
│  На основе того, что вы ввели:     │
│  "найм стажеров"                    │
│                                     │
│  AI предлагает:                     │
│                                     │
│  ⭐ Привлечь 100 талантливых        │
│     студентов 3-4 курса на          │
│     стажировку. Цель — получить     │
│     20 офферов из 100 заявок.       │
│     [Использовать]                  │
│                                     │
│  • Организовать набор на программу  │
│    стажировки для студентов...      │
│    [Использовать]                   │
│                                     │
│  ──────────────────────────────     │
│                                     │
│  Похожие кампании коллег:           │
│                                     │
│  📊 "Летняя стажировка 2024"        │
│     100 участников, 85% completion  │
│     [Посмотреть brief]              │
│                                     │
│  📊 "Набор в Tech Academy"          │
│     200 участников, 78% completion  │
│     [Посмотреть brief]              │
│                                     │
└─────────────────────────────────────┘
```

---

## 🛠️ Технический план

### Архитектура

```
CampaignBriefWizard.tsx
├── CampaignBriefForm (левая часть, как сейчас)
└── BriefHelperPanel (новый компонент, правая панель)
    ├── AIAssistantTab
    ├── TemplatesTab
    └── ColleaguesTab
```

### Новые компоненты

#### 1. `BriefHelperPanel.tsx`

```typescript
interface BriefHelperPanelProps {
  currentStep: WizardStep;
  currentBrief: Partial<CampaignBrief>;
  onApplySuggestion: (updates: Partial<CampaignBrief>) => void;
  campaignId: string;
}

export function BriefHelperPanel({ 
  currentStep, 
  currentBrief, 
  onApplySuggestion,
  campaignId 
}: BriefHelperPanelProps) {
  const [activeTab, setActiveTab] = useState<"ai" | "templates" | "colleagues">("ai");
  const [isExpanded, setIsExpanded] = useState(true);
  
  return (
    <div className={`brief-helper-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tab icon="🤖" label="AI" value="ai" />
        <Tab icon="📚" label="Шаблоны" value="templates" />
        <Tab icon="🏢" label="Коллеги" value="colleagues" />
      </Tabs>
      
      {/* Content */}
      {activeTab === "ai" && (
        <AIAssistantTab 
          step={currentStep}
          brief={currentBrief}
          onApply={onApplySuggestion}
        />
      )}
      
      {activeTab === "templates" && (
        <TemplatesTab 
          onApply={onApplySuggestion}
        />
      )}
      
      {activeTab === "colleagues" && (
        <ColleaguesTab 
          campaignId={campaignId}
          onApply={onApplySuggestion}
        />
      )}
    </div>
  );
}
```

#### 2. `AIAssistantTab.tsx`

**Смарт-генерация на основе контекста:**

```typescript
export function AIAssistantTab({ step, brief, onApply }: AIAssistantTabProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Автоматическая генерация при изменении brief
  useEffect(() => {
    if (brief.businessGoal && brief.businessGoal.length > 10) {
      generateSuggestions();
    }
  }, [brief.businessGoal]);

  const generateSuggestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/brief-copilot", {
        method: "POST",
        body: JSON.stringify({
          step,
          currentBrief: brief,
          requestedFields: getFieldsForStep(step),
        }),
      });
      const data = await response.json();
      setSuggestions(data.suggestions);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-assistant-content">
      {isLoading && <Spinner />}
      
      {!isLoading && suggestions.length > 0 && (
        <div className="suggestions-list">
          <p className="text-sm text-indigo-200/70 mb-3">
            На основе того, что вы ввели:
          </p>
          <p className="text-xs italic text-indigo-300 mb-4">
            "{brief.businessGoal?.substring(0, 50)}..."
          </p>
          
          <div className="space-y-3">
            {suggestions.map((suggestion, idx) => (
              <SuggestionCard
                key={idx}
                suggestion={suggestion}
                isRecommended={idx === 0}
                onUse={() => onApply(suggestion.briefUpdates)}
              />
            ))}
          </div>
        </div>
      )}
      
      {!brief.businessGoal && (
        <EmptyState 
          icon="✍️"
          message="Начните вводить цель кампании, и AI предложит варианты формулировок"
        />
      )}
    </div>
  );
}
```

#### 3. `TemplatesTab.tsx`

**Готовые шаблоны брифов:**

```typescript
const BRIEF_TEMPLATES: BriefTemplate[] = [
  {
    id: "student-internship",
    name: "Привлечение студентов на стажировку",
    category: "Recruitment",
    icon: "🎓",
    brief: {
      businessGoal: "Привлечь 100 талантливых студентов 3-4 курса на летнюю стажировку. Цель — получить 20 офферов из 100 заявок.",
      targetAudience: {
        segment: "Студенты 3-4 курса технических вузов",
        size: 200,
        characteristics: ["Digital natives", "Знание Python", "Интерес к AI/ML"],
      },
      successMetrics: {
        primary: "Конверсия в офферы 20%",
        secondary: ["NPS стажеров > 8", "Время от заявки до оффера < 30 дней"],
        conversionFunnel: [
          { stage: "Регистрация", targetRate: 100 },
          { stage: "Первый тест", targetRate: 80 },
          { stage: "Кейс-интервью", targetRate: 60 },
          { stage: "Финальное решение", targetRate: 20 },
        ],
      },
      companyContext: {
        why: "Пополнить команду молодыми талантами, создать пайплайн для будущих наймов",
        timeline: {
          start: "2025-06-01",
          end: "2025-08-31",
        },
        stakeholders: ["HR-директор", "Руководители Tech отделов", "Служба развития талантов"],
      },
    },
  },
  {
    id: "employee-onboarding",
    name: "Онбординг новых сотрудников",
    category: "Onboarding",
    icon: "👋",
    brief: {
      businessGoal: "Адаптировать 50 новых сотрудников за первые 60 дней. Цель — 90% успешно пройдут испытательный срок.",
      targetAudience: {
        segment: "Новые сотрудники (все отделы)",
        size: 50,
        characteristics: ["Первый месяц в компании", "Различный опыт работы", "Нужна структура"],
      },
      successMetrics: {
        primary: "90% проходят испытательный срок",
        secondary: ["eNPS новичков > 50", "Время до продуктивности < 45 дней"],
        conversionFunnel: [
          { stage: "Первая неделя", targetRate: 100 },
          { stage: "Первый месяц", targetRate: 95 },
          { stage: "Два месяца", targetRate: 90 },
        ],
      },
      companyContext: {
        why: "Снизить текучесть на испытательном сроке, ускорить вхождение в должность",
        timeline: {
          start: "2025-10-01",
          end: "2025-12-31",
        },
        stakeholders: ["HR", "Руководители отделов", "Buddy-наставники"],
      },
    },
  },
  {
    id: "esg-volunteering",
    name: "ESG волонтерская программа",
    category: "ESG",
    icon: "🌱",
    brief: {
      businessGoal: "Вовлечь 500 сотрудников в ESG-активности. Цель — 100 часов волонтерства на человека в год.",
      targetAudience: {
        segment: "Все сотрудники компании",
        size: 500,
        characteristics: ["Интерес к устойчивому развитию", "Разный уровень вовлеченности"],
      },
      successMetrics: {
        primary: "100 часов волонтерства на человека",
        secondary: ["30% участвуют регулярно", "Импакт: 50,000 часов для сообщества"],
        conversionFunnel: [
          { stage: "Знакомство с программой", targetRate: 95 },
          { stage: "Первое участие", targetRate: 70 },
          { stage: "Регулярное участие", targetRate: 30 },
        ],
      },
      companyContext: {
        why: "ESG-цели компании, повышение социальной ответственности, team building",
        timeline: {
          start: "2025-01-01",
          end: "2025-12-31",
        },
        stakeholders: ["CSR отдел", "HR", "CEO", "Комитет по устойчивому развитию"],
      },
    },
  },
  {
    id: "leadership-assessment",
    name: "Assessment для будущих руководителей",
    category: "Development",
    icon: "👔",
    brief: {
      businessGoal: "Выявить 20 high-potentials для программы развития лидеров из 100 номинированных сотрудников.",
      targetAudience: {
        segment: "Сотрудники с потенциалом роста (номинации от руководителей)",
        size: 100,
        characteristics: ["3+ года в компании", "Результативность выше среднего", "Лидерский потенциал"],
      },
      successMetrics: {
        primary: "Выбрать топ-20 для программы развития",
        secondary: ["Прогнозная точность оценки > 85%", "NPS процесса > 7"],
        conversionFunnel: [
          { stage: "Номинация", targetRate: 100 },
          { stage: "Психометрия", targetRate: 80 },
          { stage: "Кейс-ассессмент", targetRate: 50 },
          { stage: "Финальный отбор", targetRate: 20 },
        ],
      },
      companyContext: {
        why: "Формирование кадрового резерва, снижение зависимости от внешних наймов на руководящие позиции",
        timeline: {
          start: "2025-03-01",
          end: "2025-05-31",
        },
        stakeholders: ["C-level", "HR Business Partners", "Руководители департаментов"],
      },
    },
  },
];

export function TemplatesTab({ onApply }: TemplatesTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(BRIEF_TEMPLATES.map(t => t.category)));

  const filteredTemplates = selectedCategory
    ? BRIEF_TEMPLATES.filter(t => t.category === selectedCategory)
    : BRIEF_TEMPLATES;

  return (
    <div className="templates-content">
      <p className="text-sm text-indigo-200/70 mb-4">
        Готовые шаблоны от экспертов — выберите и адаптируйте под свою задачу
      </p>

      {/* Category filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1 rounded-full text-xs ${
            !selectedCategory ? 'bg-indigo-500 text-white' : 'bg-white/10 text-indigo-200'
          }`}
        >
          Все
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs ${
              selectedCategory === cat ? 'bg-indigo-500 text-white' : 'bg-white/10 text-indigo-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates list */}
      <div className="space-y-3">
        {filteredTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onUse={() => onApply(template.brief)}
          />
        ))}
      </div>
    </div>
  );
}

function TemplateCard({ template, onUse }: { template: BriefTemplate; onUse: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 hover:border-indigo-500/40 transition">
      <div className="flex items-start gap-3">
        <div className="text-2xl">{template.icon}</div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-white">{template.name}</h4>
          <p className="text-xs text-indigo-200/70 mt-1">
            {template.brief.targetAudience.segment} • {template.brief.targetAudience.size} чел.
          </p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-indigo-300 hover:text-white"
        >
          {isExpanded ? "Свернуть" : "Детали"}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3 text-xs">
          <div>
            <p className="font-medium text-indigo-300">Цель:</p>
            <p className="text-indigo-100 mt-1">{template.brief.businessGoal}</p>
          </div>
          <div>
            <p className="font-medium text-indigo-300">Метрика:</p>
            <p className="text-indigo-100 mt-1">{template.brief.successMetrics.primary}</p>
          </div>
          <div>
            <p className="font-medium text-indigo-300">Воронка:</p>
            <div className="mt-2 space-y-1">
              {template.brief.successMetrics.conversionFunnel.map((stage, i) => (
                <div key={i} className="flex justify-between text-indigo-100">
                  <span>{stage.stage}</span>
                  <span className="font-medium">{stage.targetRate}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={onUse}
        className="mt-4 w-full rounded-lg bg-indigo-500/20 border border-indigo-500/40 px-4 py-2 text-sm text-indigo-200 hover:bg-indigo-500/30 transition"
      >
        Использовать этот шаблон
      </button>
    </div>
  );
}
```

#### 4. `ColleaguesTab.tsx`

**Опыт из прошлых кампаний компании:**

```typescript
export function ColleaguesTab({ campaignId, onApply }: ColleaguesTabProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "successful">("successful");

  useEffect(() => {
    loadPastCampaigns();
  }, [filter]);

  const loadPastCampaigns = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/campaigns/past-briefs?filter=${filter}&exclude=${campaignId}`
      );
      const data = await response.json();
      setCampaigns(data.campaigns);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Spinner />;

  if (campaigns.length === 0) {
    return (
      <EmptyState
        icon="📊"
        message="Пока нет завершенных кампаний с заполненным брифом"
        hint="Создайте свою первую кампанию с полным бизнес-контекстом!"
      />
    );
  }

  return (
    <div className="colleagues-content">
      <div className="mb-4">
        <p className="text-sm text-indigo-200/70 mb-3">
          Успешные кампании вашей компании
        </p>
        
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("successful")}
            className={`px-3 py-1 rounded-full text-xs ${
              filter === "successful" ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40' : 'bg-white/10 text-indigo-200'
            }`}
          >
            ⭐ Успешные
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-full text-xs ${
              filter === "all" ? 'bg-indigo-500 text-white' : 'bg-white/10 text-indigo-200'
            }`}
          >
            Все
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {campaigns.map(campaign => (
          <PastCampaignCard
            key={campaign.id}
            campaign={campaign}
            onUseBrief={() => onApply(extractBrief(campaign))}
          />
        ))}
      </div>
    </div>
  );
}

function PastCampaignCard({ campaign, onUseBrief }: PastCampaignCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calculate stats
  const stats = calculateCampaignStats(campaign);
  
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 hover:border-indigo-500/40 transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-white">{campaign.name}</h4>
          <div className="flex items-center gap-3 mt-2 text-xs text-indigo-200/70">
            <span>👥 {stats.participants} участников</span>
            <span>✅ {stats.completionRate}% completion</span>
            {stats.isSuccessful && <span className="text-emerald-300">⭐ Успешная</span>}
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-indigo-300 hover:text-white"
        >
          {isExpanded ? "Свернуть" : "Посмотреть"}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3 text-xs border-t border-white/10 pt-4">
          <div>
            <p className="font-medium text-indigo-300">Бизнес-цель:</p>
            <p className="text-indigo-100 mt-1">{campaign.businessGoal}</p>
          </div>
          <div>
            <p className="font-medium text-indigo-300">Аудитория:</p>
            <p className="text-indigo-100 mt-1">
              {campaign.targetAudience.segment} ({campaign.targetAudience.size} чел.)
            </p>
          </div>
          <div>
            <p className="font-medium text-indigo-300">Главная метрика:</p>
            <p className="text-indigo-100 mt-1">{campaign.successMetrics.primary}</p>
          </div>
          
          <button
            onClick={onUseBrief}
            className="w-full rounded-lg bg-indigo-500/20 border border-indigo-500/40 px-4 py-2 text-sm text-indigo-200 hover:bg-indigo-500/30 transition mt-3"
          >
            Использовать этот brief как основу
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 📡 Новые API эндпоинты

### 1. `POST /api/ai/brief-copilot`

**Умный AI, который понимает контекст:**

```typescript
// app/src/app/api/ai/brief-copilot/route.ts
import { NextResponse } from "next/server";
import { getTextModel, AI_CONFIG } from "@/lib/ai/gemini-client";
import { SchemaType } from "@google/generative-ai";

export async function POST(request: Request) {
  const { step, currentBrief, requestedFields } = await request.json();

  const model = getTextModel();

  // Контекстный промпт в зависимости от шага
  const prompt = buildContextualPrompt(step, currentBrief, requestedFields);

  const schema = buildSchemaForStep(step, requestedFields);

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      ...AI_CONFIG,
      temperature: 0.8, // Более креативный
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  const suggestions = JSON.parse(result.response.text());

  return NextResponse.json({ suggestions });
}

function buildContextualPrompt(step: string, brief: any, fields: string[]) {
  switch (step) {
    case "goal":
      return `
        HR-специалист начал вводить бизнес-цель кампании.
        
        Текущий ввод: "${brief.businessGoal || ''}"
        Тип воронки: ${brief.funnelType || 'не выбран'}
        
        Твоя задача: Предложи 3 варианта полной, профессиональной формулировки бизнес-цели.
        
        Требования:
        - Конкретная, измеримая цель
        - Указаны цифры (сколько участников, какая конверсия)
        - Понятна связь с бизнес-результатом
        - Подходит для типа воронки
        
        Формат: краткий параграф (2-3 предложения)
      `;

    case "audience":
      return `
        HR-специалист заполняет целевую аудиторию для кампании.
        
        Бизнес-цель: "${brief.businessGoal}"
        Текущий сегмент: "${brief.targetAudience?.segment || ''}"
        
        Твоя задача: Предложи характеристики аудитории (5-7 тегов).
        
        Это должны быть:
        - Демографические характеристики (возраст, должность)
        - Психографические (интересы, ценности)
        - Навыки и компетенции
        - Поведенческие паттерны
        
        Характеристики должны помочь в дальнейшем выборе темы и миссий.
      `;

    case "metrics":
      // Уже работает через /api/ai/brief-suggestion
      return "...";

    case "context":
      return `
        HR-специалист заполняет контекст компании.
        
        Бизнес-цель: "${brief.businessGoal}"
        Тип воронки: ${brief.funnelType}
        
        Твоя задача: Предложи 2-3 варианта ответа на вопрос
        "Зачем компании эта кампания?"
        
        Это стратегическое обоснование, которое объясняет:
        - Какую бизнес-проблему решает кампания
        - Какой долгосрочный эффект ожидается
        - Как это связано с целями компании/отдела
      `;

    default:
      return "";
  }
}
```

### 2. `GET /api/campaigns/past-briefs`

**Список прошлых кампаний с брифами:**

```typescript
// app/src/app/api/campaigns/past-briefs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authConfig);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const filter = searchParams.get("filter"); // "all" | "successful"
  const exclude = searchParams.get("exclude"); // ID текущей кампании

  const campaigns = await prisma.campaign.findMany({
    where: {
      id: exclude ? { not: exclude } : undefined,
      briefCompleted: true,
      // TODO Phase 2: фильтр по createdBy (только мои) или по команде
    },
    select: {
      id: true,
      name: true,
      businessGoal: true,
      targetAudience: true,
      successMetrics: true,
      companyContext: true,
      createdAt: true,
      missions: {
        select: {
          id: true,
          name: true,
        },
      },
      // TODO: добавить статистику успешности
    },
    orderBy: { createdAt: "desc" },
    take: 10, // Последние 10
  });

  // Если filter === "successful", оставляем только успешные
  // TODO: критерий успешности на основе аналитики
  const filtered = campaigns; // placeholder

  return NextResponse.json({ campaigns: filtered });
}
```

---

## 🎭 UX Сценарии

### Сценарий 1: "AI пишет за меня"

```
1. HR открывает Brief Wizard
2. Видит пустое поле "Бизнес-цель" + справа панель "Помощник"
3. Вводит 2 слова: "найм стажеров"
4. AI (в реальном времени, debounced 500ms) генерирует 3 варианта
5. Первый вариант помечен ⭐ (рекомендованный)
6. HR кликает "Использовать" → поле автозаполняется
7. HR редактирует под себя (меняет цифры)
8. Переходит на шаг 2
9. AI уже предложил характеристики аудитории на основе шага 1
10. HR выбирает нужные теги → готово
```

**Время:** 2 минуты vs 15 минут ручного заполнения

### Сценарий 2: "Делаю как коллега"

```
1. HR открывает Brief Wizard
2. Переключается на таб "🏢 Опыт коллег"
3. Видит 5 кампаний с метками "⭐ Успешная"
4. Кликает "Посмотреть" на "Летняя стажировка 2024"
5. Видит полный brief:
   - Цель: 100 стажеров, 20 офферов
   - Аудитория: студенты 3-4 курса
   - Метрики: конверсия 20%
   - Воронка: 4 этапа с %
6. Кликает "Использовать этот brief как основу"
7. Все поля заполняются
8. HR правит под свою задачу (другие даты, другие цифры)
9. Сохраняет
```

**Время:** 3 минуты + уверенность, что "это работает"

### Сценарий 3: "Профессиональный шаблон"

```
1. HR не знает с чего начать
2. Открывает таб "📚 Шаблоны"
3. Видит категории: Recruitment, Onboarding, ESG, Development
4. Выбирает категорию "Recruitment"
5. Видит 3 шаблона от экспертов
6. Кликает на "Привлечение студентов на стажировку"
7. Читает детали: цель, метрики, воронку
8. "Использовать этот шаблон"
9. Готовый профессиональный brief
10. HR адаптирует под свою компанию
```

**Время:** 4 минуты + получает best practices "из коробки"

---

## 🚀 План реализации

### Phase 1: MVP (для хакатона)

**Приоритет: WOW-эффект с минимальной разработкой**

1. ✅ **AI Co-Pilot для шага "Цель"** (1-2 часа)
   - Добавить кнопку "✨ AI помощник" прямо в поле ввода
   - При клике показывать 2-3 варианта формулировок
   - Использовать существующий Gemini API

2. ✅ **Шаблоны брифов** (2-3 часа)
   - Создать массив из 4 готовых шаблонов (hardcoded)
   - Добавить таб "Шаблоны" в wizard
   - Кнопка "Использовать" → заполняет brief

3. 🔄 **Опыт коллег** (3-4 часа)
   - Новый эндпоинт `/api/campaigns/past-briefs`
   - Простой список прошлых кампаний
   - Кнопка "Использовать как основу"

**Итого:** ~8 часов разработки

### Phase 2: Production (после хакатона)

4. **Полный AI Co-Pilot**
   - AI подсказки на всех шагах wizard
   - Контекстные промпты
   - Кэширование результатов

5. **Умная фильтрация коллег**
   - Показывать только "успешные" кампании
   - Метрика успешности на основе аналитики
   - Группировка по типам воронок

6. **Marketplace шаблонов**
   - База шаблонов в БД (не hardcoded)
   - Возможность сохранить свой brief как шаблон
   - Рейтинги и отзывы

---

## 💎 Ключевые ценности для демо

### Для жюри хакатона:

1. **🤖 Умный AI** — не просто генератор текста, а контекстный помощник
2. **🏢 Коллективный интеллект** — опыт компании не теряется
3. **📚 Best Practices** — новички получают экспертизу "из коробки"
4. **⚡ Скорость** — заполнение brief за 3 минуты vs 20 минут

### Демо-питч:

```
"Раньше HR создавал кампанию с нуля — пустые поля, писательский ступор, 
неуверенность 'правильно ли я делаю'.

Теперь у него 3 источника помощи:

1. AI Co-Pilot пишет за него — он вводит 2 слова, AI предлагает 3 профессиональных варианта
2. Опыт коллег — видит что работало в компании раньше
3. Шаблоны экспертов — best practices из индустрии

Результат: Brief заполняется за 3 минуты, а не за 20.
И главное — HR уверен, что делает правильно."
```

---

## 🎨 Визуальная концепция

### Desktop Layout

```
┌────────────────────────────────────────────────────────────────────┐
│  Campaign Brief Wizard                                    [X]      │
├────────────────────────────────────────────────────────────────────┤
│  Progress: [████████──────────] 2/5                                │
├──────────────────────────────────┬─────────────────────────────────┤
│                                  │ 💡 Помощник Brief               │
│  📝 Бизнес-цель кампании         │ ┌─────────────────────────────┐ │
│                                  │ │ [🤖 AI] [📚] [🏢]           │ │
│  ┌────────────────────────────┐  │ └─────────────────────────────┘ │
│  │ Привлечь студентов на    │  │                                 │
│  │ стажировку...            │  │  На основе вашего ввода:        │
│  │                          │  │  "Привлечь студентов..."        │
│  │                          │  │                                 │
│  └────────────────────────────┘  │  AI предлагает:                │
│         ✨ AI помощник            │                                 │
│                                  │  ⭐ Привлечь 100 талантливых    │
│  Тип воронки:                    │     студентов 3-4 курса на      │
│  [ ] Онбординг                   │     стажировку. Цель — получить │
│  [x] Отбор/Assessment            │     20 офферов из 100 заявок.   │
│  [ ] Вовлечение                  │     [Использовать]              │
│                                  │                                 │
│                                  │  • Организовать набор на...     │
│                                  │    [Использовать]               │
│                                  │                                 │
├──────────────────────────────────┼─────────────────────────────────┤
│  [← Назад]              [Далее →]                                  │
└────────────────────────────────────────────────────────────────────┘
```

### Mobile: Expandable Helper

```
┌─────────────────────────────┐
│ Brief Wizard           [X]  │
├─────────────────────────────┤
│ Progress: [████──] 2/5      │
├─────────────────────────────┤
│                             │
│ 📝 Бизнес-цель              │
│ ┌─────────────────────────┐ │
│ │ Привлечь студентов...   │ │
│ └─────────────────────────┘ │
│                             │
│ [✨ AI помощник]            │
│                             │
│ Тип воронки:                │
│ [ ] Онбординг               │
│ [x] Отбор                   │
│                             │
├─────────────────────────────┤
│ 💡 Нужна помощь?            │
│ [Показать подсказки AI]     │  ← collapse/expand
└─────────────────────────────┘
```

---

## 🧪 Метрики успеха

### Качественные:
- ✅ **WOW-эффект** на демо — жюри видит живую генерацию AI
- ✅ **Понятность** — любой HR понимает как это использовать
- ✅ **Польза** — реально экономит время

### Количественные (production):
- Время заполнения Brief: было 15-20 мин → стало 3-5 мин
- % использования AI/шаблонов/коллег: трекать какой источник популярнее
- Качество брифов: % заполненных всех полей vs пропущенных

---

## 🎯 Итоговый чеклист для реализации

### MVP (хакатон):
- [ ] Создать `BriefHelperPanel.tsx` компонент
- [ ] Добавить AI кнопку на шаге "Цель" с real-time suggestions
- [ ] Создать массив BRIEF_TEMPLATES с 4 готовыми шаблонами
- [ ] Реализовать TemplatesTab с возможностью применить шаблон
- [ ] Создать эндпоинт `/api/campaigns/past-briefs`
- [ ] Реализовать ColleaguesTab со списком прошлых кампаний
- [ ] Интегрировать BriefHelperPanel в CampaignBriefWizard
- [ ] Адаптивная верстка (desktop + mobile collapse)
- [ ] Подготовить демо-сценарий для презентации

### Бонус (если успеете):
- [ ] AI подсказки для шага "Аудитория"
- [ ] Горячая клавиша `Alt+A` для вызова AI
- [ ] Анимации появления suggestions
- [ ] "Сохранить мой brief как шаблон" кнопка

---

**Вывод:** Это превращает заполнение Brief из "пустого листа" в интерактивный, поддерживающий процесс. HR никогда не остается один — у него всегда есть 3 источника вдохновения: AI, эксперты, коллеги. 🚀

