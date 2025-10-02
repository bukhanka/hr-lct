"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
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
import { GoalProgressDashboard } from "@/components/analytics/GoalProgressDashboard";
import { UserSegmentsOverview } from "@/components/analytics/UserSegmentsOverview";
import { LiveStatusBoard } from "@/components/analytics/LiveStatusBoard";

interface CampaignOverviewProps {
  campaignId: string;
}

interface MissionSummary {
  id: string;
  name: string;
  experienceReward: number;
}

interface CampaignData {
  id: string;
  name: string;
  description?: string;
  theme?: string;
  themeConfig?: CampaignThemeConfig;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  missions: MissionSummary[];
  // Business Context
  businessGoal?: string | null;
  targetAudience?: any;
  successMetrics?: any;
  companyContext?: any;
  briefCompleted: boolean;
}

type StepStatus = "done" | "active" | "upnext";

const TARGET_MISSION_COUNT = 12;

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-3">
          <div className="text-indigo-300">{icon}</div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {badge && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-indigo-500/20 text-indigo-200">
              {badge}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="text-indigo-300" size={20} />
        ) : (
          <ChevronDown className="text-indigo-300" size={20} />
        )}
      </button>
      {isOpen && <div className="p-6 pt-0">{children}</div>}
    </div>
  );
}

export function CampaignOverview({ campaignId }: CampaignOverviewProps) {
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
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
    if (shouldShowBrief && campaign) {
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
    () => (totalMissions === 0 ? 0 : Math.min(totalMissions, TARGET_MISSION_COUNT) / TARGET_MISSION_COUNT),
    [totalMissions]
  );

  const progressPercent = Math.round(progressFraction * 100);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-indigo-200 text-lg">Загрузка кампании...</div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
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
    <div className="space-y-6">
      {/* Brief Wizard Modal */}
      {showBriefWizard && campaign && (
        <CampaignBriefWizard
          campaignId={campaignId}
          campaignName={campaign.name}
          onComplete={handleBriefComplete}
          onSkip={() => setShowBriefWizard(false)}
        />
      )}

      {/* Campaign Hero - всегда видна */}
      <CampaignHero
        campaign={campaign}
        status={status}
        totalExperience={totalExperience}
        totalMissions={totalMissions}
        progressFraction={progressFraction}
        campaignId={campaignId}
      />

      {/* Business Context Panel - всегда видна если заполнена */}
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

      {/* Analytics Sections - in Accordions */}
      <div className="space-y-4">
        {/* Live Status - открыта по умолчанию */}
        <CollapsibleSection
          title="Live Status"
          icon={<BarChart3 size={20} />}
          defaultOpen={true}
          badge="Обновляется каждые 30 сек"
        >
          <LiveStatusBoard campaignId={campaignId} autoRefresh refreshInterval={30} />
        </CollapsibleSection>

        {/* Goal Progress - если есть бизнес-цель */}
        {campaign.briefCompleted && campaign.businessGoal && (
          <CollapsibleSection
            title="Прогресс к бизнес-целям"
            icon={<Telescope size={20} />}
            defaultOpen={true}
          >
            <GoalProgressDashboard campaignId={campaignId} />
          </CollapsibleSection>
        )}

        {/* User Segments */}
        <CollapsibleSection
          title="Сегментация участников"
          icon={<Users size={20} />}
          defaultOpen={false}
        >
          <UserSegmentsOverview campaignId={campaignId} />
        </CollapsibleSection>

        {/* Theme and Next Steps */}
        <CollapsibleSection
          title="Тема и следующие шаги"
          icon={<Palette size={20} />}
          defaultOpen={false}
        >
          <div className="grid gap-6 lg:grid-cols-[7fr_5fr]">
            {/* Theme Panel */}
            <ThemePanel
              themeConfig={campaign.themeConfig}
              campaignId={campaignId}
              campaignName={campaign.name}
            />

            {/* Next Steps */}
            <NextStepsPanel
              totalMissions={totalMissions}
              briefCompleted={campaign.briefCompleted}
              campaignId={campaignId}
            />
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}

function deriveCampaignStatus({ isActive, totalMissions }: { isActive: boolean; totalMissions: number }) {
  if (!isActive) return "archived";
  if (totalMissions < 3) return "draft";
  if (totalMissions < TARGET_MISSION_COUNT) return "building";
  return "live";
}

interface CampaignHeroProps {
  campaign: CampaignData;
  status: string;
  totalExperience: number;
  totalMissions: number;
  progressFraction: number;
  campaignId: string;
}

function CampaignHero({ campaign, status, totalExperience, totalMissions, progressFraction, campaignId }: CampaignHeroProps) {
  const progressPercent = Math.round(progressFraction * 100);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-indigo-950/60 p-8 shadow-2xl">
      <div className="absolute -right-20 top-0 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl">
        <Sparkles className="absolute left-10 top-20 text-purple-300/30" size={80} />
      </div>

      <div className="relative grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={status} />
            <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-indigo-100/80">
              #{campaign.id.slice(0, 8)}
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
              Детальная аналитика
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="relative rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">Быстрый доступ</p>
          <div className="mt-4 space-y-3">
            <QuickLink
              href={`/dashboard/architect/campaigns/${campaignId}/builder`}
              label="Конструктор миссий"
              icon={<Compass size={16} />}
            />
            <QuickLink
              href={`/dashboard/architect/campaigns/${campaignId}/participants`}
              label="Участники"
              icon={<Users size={16} />}
            />
            <QuickLink
              href={`/dashboard/architect/campaigns/${campaignId}/analytics`}
              label="Аналитика"
              icon={<BarChart3 size={16} />}
            />
            <QuickLink
              href={`/dashboard/architect/campaigns/${campaignId}/studio`}
              label="Студия контента"
              icon={<Palette size={16} />}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    draft: { label: "Черновик", color: "text-slate-300", bg: "bg-slate-500/20", border: "border-slate-500/30" },
    building: { label: "Строится", color: "text-amber-300", bg: "bg-amber-500/20", border: "border-amber-500/30" },
    live: { label: "Активна", color: "text-emerald-300", bg: "bg-emerald-500/20", border: "border-emerald-500/30" },
    archived: { label: "Архив", color: "text-indigo-300", bg: "bg-indigo-500/20", border: "border-indigo-500/30" },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config.border} ${config.bg} ${config.color}`}
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      {config.label}
    </span>
  );
}

function ScheduleBadge({ startDate, endDate }: { startDate?: string; endDate?: string }) {
  if (!startDate && !endDate) return null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  };

  return (
    <span className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-xs text-indigo-100/80">
      <CalendarDays size={12} />
      {startDate && endDate ? (
        <>
          {formatDate(startDate)} → {formatDate(endDate)}
        </>
      ) : startDate ? (
        <>От {formatDate(startDate)}</>
      ) : (
        <>До {formatDate(endDate!)}</>
      )}
    </span>
  );
}

function HeroStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-lg font-semibold text-white">{value}</p>
        <p className="text-xs text-indigo-300">{accent}</p>
      </div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function QuickLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-indigo-100 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
    >
      {icon}
      <span>{label}</span>
      <ArrowRight size={14} className="ml-auto opacity-50" />
    </Link>
  );
}

interface ThemePanelProps {
  themeConfig?: CampaignThemeConfig;
  campaignId: string;
  campaignName: string;
}

function ThemePanel({ themeConfig, campaignId, campaignName }: ThemePanelProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">Оформление</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Тема кампании</h3>
        </div>
        <Link
          href={`/dashboard/architect/campaigns/${campaignId}/themes`}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-indigo-200 transition hover:border-white/30 hover:text-white"
        >
          <Palette size={14} />
          Изменить
        </Link>
      </div>

      {themeConfig ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="Theme ID" value={themeConfig.themeId || "default"} />
            <InfoItem label="Геймификация" value={themeConfig.gamificationLevel || "balanced"} />
            <InfoItem label="Тип воронки" value={themeConfig.funnelType || "—"} />
            <InfoItem
              label="Персоны"
              value={
                themeConfig.personas
                  ? Array.isArray(themeConfig.personas)
                    ? themeConfig.personas.join(", ")
                    : "—"
                  : "—"
              }
            />
          </div>

          {themeConfig.palette && (
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200/70">Палитра</p>
              <div className="flex gap-3">
                <ColorSwatch color={themeConfig.palette.primary} label="Primary" />
                <ColorSwatch color={themeConfig.palette.secondary} label="Secondary" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          Тема не задана. Используется стандартное оформление.
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-indigo-200/70">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-lg border border-white/20" style={{ backgroundColor: color }} />
      <div>
        <p className="text-xs text-indigo-200/70">{label}</p>
        <p className="text-xs font-mono text-white">{color}</p>
      </div>
    </div>
  );
}

interface NextStepsPanelProps {
  totalMissions: number;
  briefCompleted: boolean;
  campaignId: string;
}

function NextStepsPanel({ totalMissions, briefCompleted, campaignId }: NextStepsPanelProps) {
  const steps = useMemo(() => {
    const allSteps: Array<{
      id: string;
      label: string;
      description: string;
      status: StepStatus;
      href: string;
    }> = [
      {
        id: "brief",
        label: "Заполнить бизнес-контекст",
        description: "Определите цели и метрики",
        status: briefCompleted ? "done" : "active",
        href: `?showBrief=true`,
      },
      {
        id: "missions",
        label: "Создать миссии",
        description: `Минимум 5 миссий (сейчас: ${totalMissions})`,
        status: totalMissions >= 5 ? "done" : briefCompleted ? "active" : "upnext",
        href: `/dashboard/architect/campaigns/${campaignId}/builder`,
      },
      {
        id: "theme",
        label: "Настроить тему",
        description: "Выберите визуальный стиль",
        status: totalMissions >= 5 ? "active" : "upnext",
        href: `/dashboard/architect/campaigns/${campaignId}/themes`,
      },
      {
        id: "launch",
        label: "Запустить кампанию",
        description: "Создайте invite-ссылку",
        status: totalMissions >= TARGET_MISSION_COUNT ? "active" : "upnext",
        href: `/dashboard/architect/campaigns/${campaignId}/participants`,
      },
    ];

    return allSteps;
  }, [totalMissions, briefCompleted, campaignId]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">Дорожная карта</p>
        <h3 className="mt-2 text-xl font-semibold text-white">Следующие шаги</h3>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <StepCard key={step.id} step={step} index={index} />
        ))}
      </div>
    </div>
  );
}

function StepCard({
  step,
  index,
}: {
  step: { id: string; label: string; description: string; status: StepStatus; href: string };
  index: number;
}) {
  const statusConfig = {
    done: {
      icon: <CheckCircle2 size={20} className="text-emerald-400" />,
      borderColor: "border-emerald-500/30",
      bgColor: "bg-emerald-500/10",
      textColor: "text-emerald-100",
    },
    active: {
      icon: <PlayCircle size={20} className="text-indigo-400" />,
      borderColor: "border-indigo-500/40",
      bgColor: "bg-indigo-500/10",
      textColor: "text-white",
    },
    upnext: {
      icon: <Rocket size={20} className="text-slate-500" />,
      borderColor: "border-white/10",
      bgColor: "bg-black/20",
      textColor: "text-indigo-100/50",
    },
  };

  const config = statusConfig[step.status];

  return (
    <Link
      href={step.href}
      className={`block rounded-xl border p-4 transition ${config.borderColor} ${config.bgColor} hover:border-white/30`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{config.icon}</div>
        <div className="min-w-0 flex-1">
          <h4 className={`text-sm font-semibold ${config.textColor}`}>
            {index + 1}. {step.label}
          </h4>
          <p className="mt-1 text-xs text-indigo-200/70">{step.description}</p>
        </div>
      </div>
    </Link>
  );
}
