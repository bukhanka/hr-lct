import { heroContent } from "@/data/product";
import Link from "next/link";

export function HeroSection() {
  return (
    <header className="relative overflow-hidden pb-24 pt-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(88,_28,_135,_0.35),_transparent_60%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 text-center md:px-12 lg:px-16">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-indigo-300">
          {heroContent.eyebrow}
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-6xl">
          {heroContent.title}
        </h1>
        <p className="mx-auto max-w-2xl text-pretty text-lg text-indigo-100/80 md:text-xl">
          {heroContent.description}
        </p>
        <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
          <Link
            href={heroContent.primaryCta.href}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-purple-600 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-indigo-500/40 transition hover:scale-[1.02] hover:shadow-xl"
          >
            {heroContent.primaryCta.label}
          </Link>
          <Link
            href={heroContent.secondaryCta.href}
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-100 transition hover:border-white/40 hover:text-white"
          >
            {heroContent.secondaryCta.label}
          </Link>
        </div>

        <dl className="mx-auto grid max-w-3xl grid-cols-1 gap-6 text-sm text-indigo-100/70 md:grid-cols-3">
          {heroContent.stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <dt className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">
                {stat.label}
              </dt>
              <dd className="mt-3 text-lg font-semibold text-white">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  );
}

