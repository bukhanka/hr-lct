"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Compass,
  Palette,
  PlayCircle,
  Rocket,
  Sparkles,
  Telescope,
  Users,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import type { CampaignThemeConfig } from "@/types/campaignTheme";
import type { CampaignBrief } from "@/types/campaignBrief";
import { BusinessContextPanel } from "./BusinessContextPanel";
import { CampaignBriefWizard } from "./CampaignBriefWizard";
import { useSearchParams } from "next/navigation";

interface CampaignOverviewProps {
  campaignId: string;
}

interface MissionSummary {
  id: string;
  name: string;
  experienceReward: number;
  manaReward: number;
}

interface CampaignSummary {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  themeConfig?: CampaignThemeConfig | null;
  missions: MissionSummary[];
  // Business Context
  businessGoal?: string | null;
  targetAudience?: any;
  successMetrics?: any;
  companyContext?: any;
  briefCompleted?: boolean;
}

type CampaignStatus = "draft" | "active" | "paused";

type StepStatus = "done" | "active" | "upnext";

const TARGET_MISSION_COUNT = 12;

export function CampaignOverview({ campaignId }: CampaignOverviewProps) {
  const [campaign, setCampaign] = useState<CampaignSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBriefWizard, setShowBriefWizard] = useState(false);
  const { theme } = useTheme();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/campaigns/${campaignId}`);
        if (!response.ok) {
          throw new Error("Не удалось загрузить кампанию");
        }

        const data = await response.json();
        setCampaign(data);
      } catch (err) {
        console.error("[CampaignOverview]", err);
        setError(err instanceof Error ? err.message : "Ошибка загрузки кампании");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [campaignId]);

  // Check if we should show brief wizard from URL
  useEffect(() => {
    const shouldShowBrief = searchParams?.get("showBrief") === "true";
    if (shouldShowBrief && campaign && !campaign.briefCompleted) {
      setShowBriefWizard(true);
    }
  }, [searchParams, campaign]);

  const totalExperience = useMemo(
    () => campaign?.missions.reduce((acc, mission) => acc + (mission.experienceReward || 0), 0) ?? 0,
    [campaign?.missions],
  );
  const totalMissions = campaign?.missions.length ?? 0;
  const missionPreview = useMemo(() => campaign?.missions.slice(0, 4) ?? [], [campaign?.missions]);

  const status = useMemo(
    () => deriveCampaignStatus({ isActive: campaign?.isActive ?? true, totalMissions }),
    [campaign?.isActive, totalMissions]
  );
  const progressFraction = useMemo(
    () => (totalMissions === 0 ? 0 : Math.min(totalMissions / TARGET_MISSION_COUNT, 1)),
    [totalMissions]
  );
  const steps = useMemo(
    () =>
      buildSteps({
        campaignId,
        hasTheme: Boolean(campaign?.themeConfig?.themeId),
        hasMissions: totalMissions > 0,
      }),
    [campaignId, campaign?.themeConfig?.themeId, totalMissions]
  );

  if (isLoading) {
    return <div className="text-indigo-200">Загрузка...</div>;
  }

  if (error || !campaign) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-red-500/10 p-4 text-sm text-red-200">
        <AlertCircle size={18} />
        <span>{error || "Кампания не найдена"}</span>
      </div>
    );
  }

  const handleBriefComplete = async () => {
    setShowBriefWizard(false);
    // Reload campaign data
    const response = await fetch(`/api/campaigns/${campaignId}`);
    if (response.ok) {
      const data = await response.json();
      setCampaign(data);
    }
  };

  return (
    <div className="space-y-10">
      {/* Brief Wizard Modal */}
      {showBriefWizard && campaign && (
        <CampaignBriefWizard
          campaignId={campaignId}
          campaignName={campaign.name}
          onComplete={handleBriefComplete}
          onSkip={() => setShowBriefWizard(false)}
        />
      )}

      {/* Business Context Panel */}
      <BusinessContextPanel
        campaignId={campaignId}
        brief={{
          businessGoal: campaign.businessGoal || undefined,
          targetAudience: campaign.targetAudience,
          successMetrics: campaign.successMetrics,
          companyContext: campaign.companyContext,
        }}
        briefCompleted={campaign.briefCompleted}
      />

      <CampaignHero
        campaign={campaign}
        status={status}
        totalExperience={totalExperience}
        totalMissions={totalMissions}
        progressFraction={progressFraction}
        campaignId={campaignId}
      />

      <section className="grid gap-6 lg:grid-cols-[7fr_5fr]">
        <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-indigo-900/20">
          <header className="flex items-start justify-between gap-4">
              <div>
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">Нарратив</p>
              <h2 className="mt-2 text-xl font-semibold text-white">{campaign.name}</h2>
            </div>
            <Link
              href={`/dashboard/architect/campaigns/${campaignId}/settings`}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.25em] text-indigo-100/90 transition hover:border-indigo-400 hover:text-white"
            >
              <Sparkles size={14} /> ИИ-помощник
            </Link>
          </header>

          <p className="mt-4 text-sm leading-6 text-indigo-100/80">
            {campaign.description || "Добавьте описание кампании, чтобы команда поняла сюжет, тему и ключевые цели."}
          </p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <OverviewStat label="Миссий в орбите" value={String(totalMissions)} icon={<PlayCircle size={16} />} />
            <OverviewStat label="Суммарный XP-потенциал" value={String(totalExperience)} icon={<Sparkles size={16} />} />
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <PrimaryAction href={`/dashboard/architect/campaigns/${campaignId}/builder`} icon={<Rocket size={16} />}>
              Открыть конструктор
            </PrimaryAction>
            <SecondaryAction href={`/dashboard/architect/campaigns/${campaignId}/participants`} icon={<Users size={16} />}>
              Участники
            </SecondaryAction>
            <SecondaryAction href={`/dashboard/architect/campaigns/${campaignId}/test`} icon={<Telescope size={16} />}>
              Тестовый режим
            </SecondaryAction>
            <GhostAction href={`/dashboard/architect/campaigns/${campaignId}/settings`} icon={<Palette size={16} />}>
              Настройки
            </GhostAction>
          </div>
        </article>

        <ThemePanel campaign={campaign} themeFallbackColor={theme.palette?.primary} campaignId={campaignId} />
      </section>

      <MetricsPanel missions={missionPreview} hasMissions={totalMissions > 0} />

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">Следующие шаги</h3>
            <p className="mt-1 text-xs uppercase tracking-[0.3em] text-indigo-200/70">Путь архитектора</p>
          </div>
          <Link
            href={`/dashboard/architect/campaigns/${campaignId}/builder`}
            className="inline-flex items-center gap-2 text-xs text-indigo-200 transition hover:text-white"
          >
            В библиотеку миссий
            <ArrowRight size={14} />
          </Link>
        </header>

        <div className="mt-6 space-y-5">
          {steps.map((step) => (
            <TimelineStep key={step.title} {...step} />
          ))}
        </div>
      </section>
    </div>
  );
}

function OverviewStat({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-black/30 via-black/10 to-black/20 p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-indigo-500/10 p-2 text-indigo-200">{icon}</div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">{label}</p>
          <p className="text-lg font-semibold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

interface CampaignHeroProps {
  campaign: CampaignSummary;
  status: CampaignStatus;
  totalExperience: number;
  totalMissions: number;
  progressFraction: number;
  campaignId: string;
}

function CampaignHero({ campaign, status, totalExperience, totalMissions, progressFraction, campaignId }: CampaignHeroProps) {
  const progressPercent = Math.round(progressFraction * 100);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-900/40 via-indigo-700/30 to-indigo-900/40 p-8 shadow-[0_35px_90px_rgba(14,11,40,0.55)]">
      <div className="absolute inset-0">
        <div className="absolute -left-10 top-6 h-48 w-48 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute -bottom-8 right-4 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent)]" />
      </div>

      <div className="relative grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={status} />
            <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-indigo-100/80">
              #{campaign.id}
            </span>
            <ScheduleBadge startDate={campaign.startDate} endDate={campaign.endDate} />
          </div>

          <div>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">{campaign.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100/80">
              {campaign.description?.slice(0, 220) || "Задайте легенду кампании, чтобы каждый участник понял свой путь к звёздам."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <HeroStat
              label="Прогресс подготовки"
              value={`${Math.min(totalMissions, TARGET_MISSION_COUNT)}/${TARGET_MISSION_COUNT} миссий`}
              accent={`${progressPercent}%`}
            />
            <HeroStat label="XP потенциал" value={`${totalExperience} XP`} accent="Экономика" />
            <HeroStat
              label="Тематика"
              value={campaign.themeConfig?.themeId || "baseline"}
              accent={campaign.themeConfig?.gamificationLevel || "balanced"}
            />
          </div>

          <div className="flex items-center gap-4">
            <ProgressBar value={progressPercent} />
            <Link
              href={`/dashboard/architect/campaigns/${campaignId}/analytics`}
              className="inline-flex items-center gap-2 text-xs text-indigo-200 transition hover:text-white"
            >
              Смотреть аналитику
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="relative rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur">
          <div className="absolute -top-10 right-6 h-24 w-24 rounded-full border border-indigo-500/40 bg-indigo-500/10" />
          <div className="relative space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">Мини карта кампании</p>
            <div className="relative h-40 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-950 via-indigo-800/60 to-slate-900">
              <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_center,rgba(130,110,255,0.2),transparent_70%)]" />
              <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-200 shadow-[0_0_20px_rgba(129,140,248,0.8)]" />
              <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-300/20" />
              <div className="absolute left-8 top-6 h-2 w-2 rounded-full bg-purple-300" />
              <div className="absolute right-10 bottom-8 h-2 w-2 rounded-full bg-sky-300" />
              <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-indigo-400/20" />
            </div>

            <p className="text-xs text-indigo-100/70">
              Установите главную ветку, добавьте ключевые миссии и закрепите цели. Оформление автоматически адаптируется под выбранную тему.
            </p>

            <Link
              href={`/dashboard/architect/campaigns/${campaignId}/builder`}
              className="inline-flex items-center gap-2 text-xs text-indigo-200 transition hover:text-white"
            >
              Управлять картой
              <Compass size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function deriveCampaignStatus({ isActive, totalMissions }: { isActive: boolean; totalMissions: number }): CampaignStatus {
  if (!totalMissions) {
    return "draft";
  }

  return isActive ? "active" : "paused";
}

function StatusBadge({ status }: { status: CampaignStatus }) {
  const config: Record<CampaignStatus, { label: string; className: string }> = {
    draft: { label: "Черновик", className: "bg-orange-500/10 text-orange-200 border-orange-400/40" },
    active: { label: "Активна", className: "bg-emerald-500/10 text-emerald-200 border-emerald-400/40" },
    paused: { label: "Пауза", className: "bg-slate-500/10 text-slate-200 border-slate-400/40" },
  };

  const { label, className } = config[status];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.35em] ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function ScheduleBadge({ startDate, endDate }: { startDate?: string | null; endDate?: string | null }) {
  if (!startDate && !endDate) {
    return null;
  }

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "без даты";

    try {
      return new Date(value).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
    } catch {
      return value;
    }
  };

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-indigo-100/70">
      <CalendarDays size={12} />
      {`${formatDate(startDate)} · ${formatDate(endDate)}`}
    </span>
  );
}

function HeroStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-[11px] uppercase tracking-[0.3em] text-indigo-200/70">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-indigo-100/60">{accent}</p>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full border border-white/10 bg-white/5">
      <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-400 via-indigo-300 to-sky-300" style={{ width: `${value}%` }} />
    </div>
  );
}

interface ThemePanelProps {
  campaign: CampaignSummary;
  themeFallbackColor?: string;
  campaignId: string;
}

function ThemePanel({ campaign, themeFallbackColor, campaignId }: ThemePanelProps) {
  const tone = campaign.themeConfig?.palette?.primary || themeFallbackColor || "#4b5bff";

  return (
    <aside className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black/40 via-black/20 to-indigo-950/30 p-6">
      <div className="absolute -right-14 top-10 h-40 w-40 rounded-full" style={{ background: `${tone}22` }} />

      <div className="relative space-y-6">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">Текущая тема</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{campaign.themeConfig?.themeId || "baseline"}</h3>
          <p className="mt-1 text-xs text-indigo-100/70">Геймификация: {campaign.themeConfig?.gamificationLevel || "balanced"}</p>
        </header>

        <div className="flex items-center gap-4">
          <div
            className="h-16 w-16 rounded-full border border-white/10 shadow-[0_0_25px_rgba(99,102,241,0.4)]"
            style={{ background: tone }}
          />
          <div className="space-y-1 text-xs text-indigo-100/70">
            <p>Персоны: {campaign.themeConfig?.personas?.join(", ") || "Не задано"}</p>
            <p>Фокус: {campaign.themeConfig?.funnelType || "onboarding"}</p>
          </div>
        </div>

        <Link
          href={`/dashboard/architect/campaigns/${campaignId}/settings`}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs uppercase tracking-[0.3em] text-indigo-100/80 transition hover:border-white/40 hover:text-white"
        >
          Управлять темой
          <Palette size={14} />
        </Link>
      </div>
    </aside>
  );
}

interface MetricsPanelProps {
  missions: MissionSummary[];
  hasMissions: boolean;
}

function MetricsPanel({ missions, hasMissions }: MetricsPanelProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-indigo-100/80">
          <BarChart3 size={16} className="text-indigo-300" />
          <span>Основные метрики</span>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-indigo-100/60">
          в реальном времени
        </span>
      </header>

      {!hasMissions ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { title: "Старт воронки", description: "Добавьте первую миссию, чтобы увидеть конверсию" },
            { title: "Время прохождения", description: "Появится после первых прохождений" },
            { title: "Опыт на миссию", description: "Настройте награды в конструкторе" },
          ].map((item) => (
            <EmptyMetricCard key={item.title} {...item} />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {missions.map((mission) => (
            <div
              key={mission.id}
              className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-white/30 hover:bg-black/30"
            >
              <p className="text-sm font-semibold text-white">{mission.name}</p>
              <p className="mt-1 text-xs text-indigo-100/70">
                {mission.experienceReward} XP · {mission.manaReward} маны
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyMetricCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-black/10 p-4 text-sm text-indigo-100/70">
      <p className="font-semibold text-white/80">{title}</p>
      <p className="mt-2 text-xs text-indigo-100/50">{description}</p>
    </div>
  );
}

function buildSteps({
  campaignId,
  hasTheme,
  hasMissions,
}: {
  campaignId: string;
  hasTheme: boolean;
  hasMissions: boolean;
}) {
  const steps: Array<{ title: string; description: string; href: string; status: StepStatus }> = [
    {
      title: "Настройте тему кампании",
      description: "Выберите визуальную легенду, персоны и геймификацию под аудиторию.",
      href: `/dashboard/architect/campaigns/${campaignId}/settings`,
      status: hasTheme ? "done" : "active",
    },
    {
      title: "Постройте карту миссий",
      description: "Используйте библиотеку заготовок или создайте уникальные ветки.",
      href: `/dashboard/architect/campaigns/${campaignId}/builder`,
      status: hasMissions ? "done" : hasTheme ? "active" : "upnext",
    },
    {
      title: "Запустите тестовый режим",
      description: "Пройдите кампанию глазами кадета, соберите обратную связь.",
      href: `/dashboard/architect/campaigns/${campaignId}/test`,
      status: hasMissions ? "active" : "upnext",
    },
    {
      title: "Следите за аналитикой",
      description: "Отслеживайте прогресс и drop-off на вкладке аналитики.",
      href: `/dashboard/architect/campaigns/${campaignId}/analytics`,
      status: "upnext",
    },
  ];

  return steps;
}

function TimelineStep({ title, description, href, status }: { title: string; description: string; href: string; status: StepStatus }) {
  const statusConfig: Record<StepStatus, { icon: ReactNode; tone: string; accent: string }> = {
    done: {
      icon: <CheckCircle2 size={16} className="text-emerald-300" />,
      tone: "border-emerald-400/40 bg-emerald-500/10",
      accent: "Выполнено",
    },
    active: {
      icon: <Rocket size={16} className="text-indigo-300" />,
      tone: "border-indigo-400/40 bg-indigo-500/10",
      accent: "В работе",
    },
    upnext: {
      icon: <ArrowRight size={16} className="text-slate-300" />,
      tone: "border-white/10 bg-black/20",
      accent: "Далее",
    },
  };

  const { icon, tone, accent } = statusConfig[status];

  return (
    <Link
      href={href}
      className={`group flex items-start gap-4 rounded-2xl border p-4 transition hover:border-white/40 hover:bg-black/30 ${tone}`}
    >
      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white group-hover:text-indigo-100">{title}</p>
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.28em] text-indigo-100/70">
            {accent}
          </span>
        </div>
        <p className="mt-1 text-xs text-indigo-100/70">{description}</p>
      </div>
    </Link>
  );
}

function PrimaryAction({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 px-5 py-2 text-sm font-medium text-white shadow-[0_20px_45px_rgba(99,102,241,0.35)] transition hover:brightness-110"
    >
      {icon}
      {children}
    </Link>
  );
}

function SecondaryAction({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-2 text-sm text-indigo-100/90 transition hover:border-white/40 hover:text-white"
    >
      {icon}
      {children}
    </Link>
  );
}

function GhostAction({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-indigo-100/70 transition hover:border-white/30 hover:text-white"
    >
      {icon}
      {children}
    </Link>
  );
}

