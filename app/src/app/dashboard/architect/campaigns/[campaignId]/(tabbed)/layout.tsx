import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronRight, MoveLeft, Radar, Sparkles, Telescope } from "lucide-react";
import { CampaignTabs } from "@/components/constructor/CampaignTabs";
import { prisma } from "@/lib/prisma";

interface CampaignTabbedLayoutProps {
  children: React.ReactNode;
  params: Promise<{ campaignId: string }>;
}

const buildTabs = (campaignId: string) => [
  { href: `/dashboard/architect/campaigns/${campaignId}`, label: "Обзор" },
  { href: `/dashboard/architect/campaigns/${campaignId}/builder`, label: "Конструктор" },
  { href: `/dashboard/architect/campaigns/${campaignId}/settings`, label: "Настройки" },
  { href: `/dashboard/architect/campaigns/${campaignId}/analytics`, label: "Аналитика" },
];

export default async function CampaignTabbedLayout({ children, params }: CampaignTabbedLayoutProps) {
  const { campaignId } = await params;

  if (!campaignId) {
    notFound();
  }

  // Загружаем данные кампании для отображения названия
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, name: true, description: true },
  });

  if (!campaign) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050514] via-[#0b0924] to-[#050514]">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-6 py-8 text-white">
        <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-[0_25px_70px_rgba(8,7,26,0.55)]">
          <div className="absolute -left-16 top-2 h-32 w-32 rounded-full bg-indigo-600/25 blur-3xl" />
          <div className="absolute -top-10 right-8 h-36 w-36 rounded-full bg-purple-500/20 blur-3xl" />

          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/architect"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-[11px] uppercase tracking-[0.3em] text-indigo-100/70 transition hover:border-white/40 hover:text-white"
              >
                <MoveLeft size={14} />
                К кампаниям
              </Link>

              <div className="h-6 w-px bg-white/10" />

              <div>
                <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.35em] text-indigo-200/70">
                  <span className="inline-flex h-2 w-2 rounded-full bg-indigo-300" />
                  Кампания · Архитектор
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-[0.05em] text-white lg:text-[28px]">
                  {campaign.name}
                </h1>
                {campaign.description && (
                  <p className="mt-1 text-sm text-indigo-200/60">{campaign.description}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.32em] text-indigo-100/70">
              <Link
                href={`/dashboard/architect/campaigns/${campaignId}/analytics`}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 transition hover:border-white/35 hover:text-white"
              >
                <Radar size={14} />
                Аналитика
              </Link>
              <Link
                href={`/dashboard/architect/campaigns/${campaignId}/settings`}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 transition hover:border-white/35 hover:text-white"
              >
                <Telescope size={14} />
                Настройки
              </Link>
              <Link
                href={`/dashboard/architect/campaigns/${campaignId}/builder`}
                className="inline-flex items-center gap-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-indigo-100/90 transition hover:border-indigo-400 hover:text-white"
              >
                <Sparkles size={14} />
                Конструктор
              </Link>
            </div>
          </div>

          <div className="relative mt-4 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-indigo-200/60">
            <span className="inline-flex items-center gap-2">
              <ChevronRight size={14} className="text-indigo-200/50" />
              Обзор кампании
            </span>
            <span className="h-3 w-px bg-white/10" />
            <span className="inline-flex items-center gap-2">
              <ChevronRight size={14} className="text-indigo-200/50" />
              Орбитальный статус
            </span>
          </div>
        </header>

        <CampaignTabs tabs={buildTabs(campaignId)} />

        <Suspense fallback={<div className="rounded-3xl border border-white/10 bg-black/25 p-6 text-indigo-200">Загрузка...</div>}>
          <div className="rounded-3xl border border-white/10 bg-black/25 p-6 shadow-[0_20px_60px_rgba(5,4,20,0.45)] backdrop-blur">
            {children}
          </div>
        </Suspense>
      </div>
    </div>
  );
}


