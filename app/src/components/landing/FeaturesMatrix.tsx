import { featureClusters } from "@/data/product";

const categoryLabels: Record<string, string> = {
  user: "Для кадета",
  hr: "Для архитектора кампании",
  ops: "Для офицера миссий",
};

export function FeaturesMatrix() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 md:px-12 lg:px-16">
      <div className="grid gap-12 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col gap-6">
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">
            Система модулей
          </p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
            Модульная архитектура платформы
          </h2>
          <p className="text-base text-indigo-100/70">
            Каждый модуль отвечает за конкретную часть воронки и может развиваться
            независимо. Платформа масштабируется через добавление новых миссий,
            кампаний и ИИ-сервисов без остановки работы.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {featureClusters.map((cluster) => (
            <article
              key={cluster.id}
              className="flex h-full flex-col gap-5 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg"
            >
              <div className="flex flex-col gap-2">
                <span className="text-[11px] uppercase tracking-[0.4em] text-indigo-200/60">
                  {categoryLabels[cluster.category]}
                </span>
                <h3 className="text-xl font-semibold text-white">
                  {cluster.title}
                </h3>
                <p className="text-sm text-indigo-100/75">
                  {cluster.description}
                </p>
              </div>
              {cluster.metrics && (
                <dl className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-indigo-200/75">
                  {cluster.metrics.map((metric) => (
                    <div key={metric} className="flex flex-col">
                      <dt className="font-semibold text-indigo-100/90">
                        {metric}
                      </dt>
                    </div>
                  ))}
                </dl>
              )}
              <ul className="mt-auto flex flex-col gap-3 text-sm text-indigo-100/75">
                {cluster.items.map((item) => (
                  <li key={item} className="inline-flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-indigo-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

