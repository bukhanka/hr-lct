import { techStack } from "@/data/product";

export function TechStackSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 md:px-12 lg:px-16" id="tech">
      <div className="flex flex-col gap-12">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">
            Архитектура
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
            Современный стек для быстрого запуска и масштабирования
          </h2>
          <p className="mt-4 text-base text-indigo-100/75 md:text-lg">
            Next.js 15 объединяет фронтенд и бэкенд в одном репозитории. Prisma обеспечивает типобезопасный доступ к PostgreSQL, а ИИ-сервисы подключаются через REST или edge-функции.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {techStack.map((category) => (
            <article
              key={category.id}
              className="flex h-full flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg"
            >
              <div className="flex flex-col gap-3">
                <h3 className="text-xl font-semibold text-white">
                  {category.title}
                </h3>
                <p className="text-sm text-indigo-100/75">
                  {category.description}
                </p>
              </div>
              <ul className="mt-auto flex flex-wrap gap-2 text-xs font-medium uppercase tracking-[0.2em] text-indigo-100/70">
                {category.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-white/10 bg-black/30 px-4 py-2"
                  >
                    {item}
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

