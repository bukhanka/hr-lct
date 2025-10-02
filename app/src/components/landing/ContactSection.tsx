import Link from "next/link";

export function ContactSection() {
  return (
    <section className="relative overflow-hidden py-24" id="contact">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(147,_51,_234,_0.18),_transparent_70%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 md:px-12 lg:px-16">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">
            Контакты
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
            Свяжитесь с разработчиком
          </h2>
          <p className="mt-4 text-base text-indigo-100/70 md:text-lg">
            Ответим на вопросы, покажем живое демо и обсудим интеграцию. Прямой контакт без посредников.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg">
            <span className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">
              Точка контакта
            </span>
            <h3 className="text-2xl font-semibold text-white">
              Даниил Духанин
            </h3>
            <p className="text-sm text-indigo-100/75">
              Разработчик Командного Центра. Отвечаю за архитектуру, ИИ-интеграции и запуск продукта.
            </p>
            <div className="flex flex-col gap-3 text-sm text-indigo-100/80">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-2 w-2 rounded-full bg-cyan-300" />
                <span>Телефон: <Link href="tel:89655294423" className="text-white transition hover:text-cyan-300">8&nbsp;965&nbsp;529-44-23</Link></span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-2 w-2 rounded-full bg-cyan-300" />
                <span>Telegram: <Link href="https://t.me/DukhaninDY" className="text-white transition hover:text-cyan-300">@DukhaninDY</Link></span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 text-sm text-indigo-100/75">
            <Link
              href="tel:89655294423"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 px-10 py-4 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-lg shadow-cyan-500/30 transition hover:scale-[1.02] hover:shadow-cyan-500/50"
            >
              Позвонить
            </Link>
            <Link
              href="https://t.me/DukhaninDY"
              className="inline-flex items-center justify-center rounded-full border border-white/20 px-10 py-4 text-sm font-semibold uppercase tracking-[0.25em] text-indigo-100 transition hover:border-white/40 hover:text-white"
            >
              Написать в Telegram
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
