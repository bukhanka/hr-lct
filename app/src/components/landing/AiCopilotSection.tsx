import { aiCopilotCapabilities } from "@/data/product";

export function AiCopilotSection() {
  return (
    <section className="relative overflow-hidden py-24" id="copilot">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(79,_70,_229,_0.25),_transparent_70%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 md:px-12 lg:px-16">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">
            Google Gemini 2.0 Flash
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
            ИИ заменяет дизайнера и копирайтера
          </h2>
          <p className="mt-4 text-base text-indigo-100/70 md:text-lg">
            Gemini генерирует тексты за 3 секунды и изображения за 4 секунды. Экономия 
            100,000₽ на копирайтере и 600,000₽ на дизайнере в год. HR фокусируется на 
            стратегии, а не на производстве контента.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {aiCopilotCapabilities.map((capability) => (
            <article
              key={capability.id}
              className="group relative flex h-full flex-col gap-5 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8 backdrop-blur-lg"
            >
              <div className="flex flex-col gap-2">
                <span className="text-[11px] uppercase tracking-[0.4em] text-indigo-200/70">
                  {capability.title}
                </span>
                <p className="text-sm text-indigo-100/75">
                  {capability.description}
                </p>
              </div>
              <div className="mt-auto rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-indigo-100/75">
                <p className="text-[10px] uppercase tracking-[0.4em] text-indigo-300/80">
                  Пример запроса
                </p>
                <p className="mt-3 text-base text-white">
                  “{capability.promptExample}”
                </p>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-3xl border border-transparent transition group-hover:border-indigo-400/60" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

