"use client";

import { Book, Palette, Users, Sparkles, TrendingUp } from "lucide-react";

export function ThemeGuide() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Руководство по темам кампаний</h2>
        <p className="mt-2 text-sm text-indigo-100/70">
          Узнайте, как использовать темы, персоны и AI-помощник для создания идеального опыта для ваших кадетов.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* What are themes */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-purple-500/20 p-2">
              <Palette size={20} className="text-purple-300" />
            </div>
            <h3 className="text-lg font-semibold text-white">Что такое темы?</h3>
          </div>
          <p className="text-sm text-indigo-100/70 leading-relaxed">
            Тема определяет визуальный стиль, цветовую палитру, иконки и нарратив интерфейса кадета. 
            Темы связаны с типами воронок и целевыми аудиториями, чтобы создать наиболее подходящий опыт.
          </p>
          <div className="mt-4 space-y-2 text-xs text-indigo-100/60">
            <div>• <span className="font-medium">Галактическая академия</span> — для студентов, высокая геймификация</div>
            <div>• <span className="font-medium">Корпоративный мегаполис</span> — для специалистов, упор на KPI</div>
            <div>• <span className="font-medium">ESG-миссия</span> — для волонтёров, фокус на вклад и импакт</div>
          </div>
        </div>

        {/* Personas */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-sky-500/20 p-2">
              <Users size={20} className="text-sky-300" />
            </div>
            <h3 className="text-lg font-semibold text-white">Целевые аудитории (персоны)</h3>
          </div>
          <p className="text-sm text-indigo-100/70 leading-relaxed">
            Персоны определяют рекомендованный уровень геймификации и тон общения. Выбирайте одну или несколько персон,
            чтобы адаптировать опыт под вашу аудиторию.
          </p>
          <div className="mt-4 space-y-2 text-xs text-indigo-100/60">
            <div>• <span className="font-medium">Студенты 18-25</span> — яркая геймификация, ачивки, streak</div>
            <div>• <span className="font-medium">Специалисты 26-35</span> — баланс геймификации и профессионализма</div>
            <div>• <span className="font-medium">Волонтёры/ESG</span> — фокус на импакт и признание</div>
          </div>
        </div>

        {/* AI Copilot */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-indigo-500/20 p-2">
              <Sparkles size={20} className="text-indigo-300" />
            </div>
            <h3 className="text-lg font-semibold text-white">Как работает ИИ-помощник?</h3>
          </div>
          <p className="text-sm text-indigo-100/70 leading-relaxed">
            ИИ-помощник подбирает оптимальную тему и настройки на основе выбранного типа воронки и целевой аудитории.
            Он также генерирует рекомендации по улучшению конверсии.
          </p>
          <div className="mt-4 space-y-2 text-xs text-indigo-100/60">
            <div>1. Выберите тип воронки и целевую персону</div>
            <div>2. Нажмите «ИИ-пилот» в настройках кампании</div>
            <div>3. ИИ предложит тему и конфигурацию</div>
            <div>4. Примените или адаптируйте предложение</div>
          </div>
        </div>

        {/* Analytics */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-green-500/20 p-2">
              <TrendingUp size={20} className="text-green-300" />
            </div>
            <h3 className="text-lg font-semibold text-white">Аналитика и A/B тесты</h3>
          </div>
          <p className="text-sm text-indigo-100/70 leading-relaxed">
            Отслеживайте эффективность воронки по персонам и запускайте A/B тесты разных тем. 
            ИИ подскажет, что изменить для улучшения конверсии.
          </p>
          <div className="mt-4 space-y-2 text-xs text-indigo-100/60">
            <div>• Метрики drop-off по этапам воронки</div>
            <div>• Сравнение конверсии между вариантами</div>
            <div>• ИИ-рекомендации на основе данных</div>
            <div>• Сегментация по персонам и темам</div>
          </div>
        </div>
      </div>

      {/* Quick start */}
      <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-full bg-indigo-500/30 p-2">
            <Book size={20} className="text-indigo-200" />
          </div>
          <h3 className="text-lg font-semibold text-white">Быстрый старт</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-3 text-sm">
          <div>
            <div className="mb-2 font-medium text-white">1. Выберите тему</div>
            <p className="text-xs text-indigo-100/70">
              Перейдите в «Настройки кампании» и выберите подходящую тему из каталога или используйте ИИ-помощник.
            </p>
          </div>
          <div>
            <div className="mb-2 font-medium text-white">2. Настройте терминологию</div>
            <p className="text-xs text-indigo-100/70">
              Адаптируйте названия мотиваторов под язык вашей компании: XP, Мана, Ранги можно переименовать.
            </p>
          </div>
          <div>
            <div className="mb-2 font-medium text-white">3. Тестируйте и улучшайте</div>
            <p className="text-xs text-indigo-100/70">
              Используйте тестовый режим и аналитику, чтобы оценить эффективность и внести корректировки.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
