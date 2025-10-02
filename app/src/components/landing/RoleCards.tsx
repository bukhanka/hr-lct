import { roleDefinitions } from "@/data/product";

export function RoleCards() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 md:px-12 lg:px-16">
      <div className="flex flex-col gap-12">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">
            Три роли в системе
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
            Единая платформа для всех участников
          </h2>
          <p className="mt-4 text-base text-indigo-100/75 md:text-lg">
            HR-Архитектор создает и управляет кампаниями, Кадет проходит миссии, Офицер 
            подтверждает офлайн-активности. Данные синхронизируются в реальном времени.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {roleDefinitions.map((role) => (
            <article
              key={role.id}
              className="group relative flex h-full flex-col gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/3 to-transparent p-8 shadow-xl shadow-black/20 backdrop-blur transition hover:-translate-y-1 hover:shadow-indigo-500/40"
            >
              <div
                className={`absolute inset-x-8 top-0 h-1 rounded-full bg-gradient-to-r ${role.accent}`}
              />
              <div className="mt-4">
                <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">
                  {role.subtitle}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-white">
                  {role.title}
                </h3>
                <p className="mt-3 text-sm text-indigo-100/75">
                  {role.description}
                </p>
              </div>
              <ul className="mt-auto flex flex-col gap-3 text-sm text-indigo-100/80">
                {role.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 backdrop-blur-sm transition group-hover:border-white/20"
                  >
                    <span className="inline-flex h-2 w-2 translate-y-2 rounded-full bg-gradient-to-br from-white to-indigo-200 shadow shadow-indigo-500/50" />
                    <span>{highlight}</span>
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

