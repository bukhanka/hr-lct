export function BusinessResultsSection() {
  return (
    <section className="relative overflow-hidden py-24" id="results">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(139,_92,_246,_0.25),_transparent_70%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 md:px-12 lg:px-16">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">
            Бизнес-ценность
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
            Результаты в цифрах
          </h2>
          <p className="mt-4 text-base text-indigo-100/70 md:text-lg">
            Измеримая экономия времени и денег. Повышение эффективности HR-процессов.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Экономия времени */}
          <article className="flex h-full flex-col gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-white/5 to-transparent p-8 backdrop-blur-lg">
            <div className="flex flex-col gap-3">
              <span className="text-[11px] uppercase tracking-[0.4em] text-emerald-300/70">
                Экономия времени
              </span>
              <h3 className="text-4xl font-bold text-white">
                95%
              </h3>
              <p className="text-sm text-indigo-100/75">
                Создание кампании: 2 месяца → 1 день
              </p>
            </div>
            <ul className="mt-auto flex flex-col gap-3 text-sm text-indigo-100/75">
              <li className="flex items-start gap-3">
                <span className="h-2 w-2 translate-y-2 rounded-full bg-emerald-300" />
                <span>Регистрация: 26 часов → 0 часов</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-2 w-2 translate-y-2 rounded-full bg-emerald-300" />
                <span>Аналитика: 10 часов/неделю экономии</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-2 w-2 translate-y-2 rounded-full bg-emerald-300" />
                <span>Итого: 520 часов/год</span>
              </li>
            </ul>
          </article>

          {/* Экономия денег */}
          <article className="flex h-full flex-col gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/10 via-white/5 to-transparent p-8 backdrop-blur-lg">
            <div className="flex flex-col gap-3">
              <span className="text-[11px] uppercase tracking-[0.4em] text-amber-300/70">
                Экономия денег
              </span>
              <h3 className="text-4xl font-bold text-white">
                1.2М₽
              </h3>
              <p className="text-sm text-indigo-100/75">
                Экономия в год на подрядчиках
              </p>
            </div>
            <ul className="mt-auto flex flex-col gap-3 text-sm text-indigo-100/75">
              <li className="flex items-start gap-3">
                <span className="h-2 w-2 translate-y-2 rounded-full bg-amber-300" />
                <span>Дизайнер: 600,000₽/год</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-2 w-2 translate-y-2 rounded-full bg-amber-300" />
                <span>Копирайтер: 100,000₽/год</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-2 w-2 translate-y-2 rounded-full bg-amber-300" />
                <span>Разработка: 500,000₽+</span>
              </li>
            </ul>
          </article>

          {/* Эффективность */}
          <article className="flex h-full flex-col gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-white/5 to-transparent p-8 backdrop-blur-lg">
            <div className="flex flex-col gap-3">
              <span className="text-[11px] uppercase tracking-[0.4em] text-purple-300/70">
                Повышение эффективности
              </span>
              <h3 className="text-4xl font-bold text-white">
                +40%
              </h3>
              <p className="text-sm text-indigo-100/75">
                Больше участников доходят до конца
              </p>
            </div>
            <ul className="mt-auto flex flex-col gap-3 text-sm text-indigo-100/75">
              <li className="flex items-start gap-3">
                <span className="h-2 w-2 translate-y-2 rounded-full bg-purple-300" />
                <span>Конверсия: 30% → 70%</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-2 w-2 translate-y-2 rounded-full bg-purple-300" />
                <span>Проблемы: за 2 дня vs месяц</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-2 w-2 translate-y-2 rounded-full bg-purple-300" />
                <span>+40 кандидатов из 100 бесплатно</span>
              </li>
            </ul>
          </article>
        </div>

        {/* ROI */}
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8 text-center backdrop-blur-lg md:p-12">
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">
              Return on Investment
            </p>
            <h3 className="mt-3 text-5xl font-bold text-white md:text-7xl">
              {">"} 1000%
            </h3>
            <p className="mt-4 text-base text-indigo-100/75 md:text-lg">
              ROI за первый год использования
            </p>
            <div className="mt-8 flex flex-col gap-4 text-sm text-indigo-100/75 md:flex-row md:items-center md:justify-center md:gap-8">
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">
                  Вложения
                </span>
                <p className="mt-1 text-lg font-semibold text-white">
                  0₽
                </p>
                <p className="text-xs text-indigo-100/60">
                  (разработано на хакатоне)
                </p>
              </div>
              <div className="text-indigo-300/50">→</div>
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">
                  Экономия в 1-й год
                </span>
                <p className="mt-1 text-lg font-semibold text-white">
                  1,900,000₽
                </p>
                <p className="text-xs text-indigo-100/60">
                  (время + деньги + конверсия)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

