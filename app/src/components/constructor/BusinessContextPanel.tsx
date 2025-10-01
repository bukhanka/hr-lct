"use client";

import { Target, Users, TrendingUp, Building2, Edit3, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { CampaignBrief } from "@/types/campaignBrief";

interface BusinessContextPanelProps {
  campaignId: string;
  brief?: Partial<CampaignBrief> | null;
  briefCompleted?: boolean;
}

export function BusinessContextPanel({ campaignId, brief, briefCompleted }: BusinessContextPanelProps) {
  // Если brief не заполнен, показываем призыв к действию
  if (!briefCompleted || !brief) {
    return (
      <section className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-amber-500/20 p-3">
            <AlertCircle className="text-amber-300" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">Заполните бизнес-контекст кампании</h3>
            <p className="mt-2 text-sm text-amber-100/80">
              Прежде чем создавать миссии, определите бизнес-цели, целевую аудиторию и метрики успеха.
              Это поможет AI генерировать релевантный контент и вам — измерять эффективность кампании.
            </p>
            <Link
              href={`/dashboard/architect/campaigns/${campaignId}?showBrief=true`}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-amber-500/30 transition hover:shadow-amber-500/50"
            >
              <Target size={16} />
              Заполнить бизнес-контекст
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-indigo-950/40 p-6 shadow-lg">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">Стратегия</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Бизнес-контекст кампании</h3>
        </div>
        <Link
          href={`/dashboard/architect/campaigns/${campaignId}?showBrief=true`}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-indigo-200 transition hover:border-white/30 hover:text-white"
        >
          <Edit3 size={14} />
          Редактировать
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Business Goal */}
        {brief.businessGoal && (
          <ContextCard
            icon={<Target size={18} className="text-indigo-300" />}
            title="Бизнес-цель"
            className="lg:col-span-2"
          >
            <p className="text-sm leading-6 text-indigo-100/90">{brief.businessGoal}</p>
          </ContextCard>
        )}

        {/* Target Audience */}
        {brief.targetAudience && (
          <ContextCard icon={<Users size={18} className="text-purple-300" />} title="Целевая аудитория">
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">{brief.targetAudience.segment}</p>
              <p className="text-xs text-indigo-200/70">
                Ожидается участников: <span className="font-semibold text-indigo-100">{brief.targetAudience.size}</span>
              </p>
              {brief.targetAudience.characteristics && brief.targetAudience.characteristics.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {brief.targetAudience.characteristics.map((char, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-indigo-200"
                    >
                      {char}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </ContextCard>
        )}

        {/* Success Metrics */}
        {brief.successMetrics && (
          <ContextCard icon={<TrendingUp size={18} className="text-emerald-300" />} title="Метрики успеха">
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-indigo-200/70">Главная метрика</p>
                <p className="mt-1 text-sm font-medium text-white">{brief.successMetrics.primary}</p>
              </div>

              {brief.successMetrics.conversionFunnel && brief.successMetrics.conversionFunnel.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-indigo-200/70">Целевая воронка</p>
                  <div className="mt-2 space-y-1.5">
                    {brief.successMetrics.conversionFunnel.map((stage, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-1.5"
                      >
                        <span className="text-xs text-indigo-100">{stage.stage}</span>
                        <span className="text-xs font-semibold text-emerald-300">{stage.targetRate}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {brief.successMetrics.secondary && brief.successMetrics.secondary.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-indigo-200/70">Дополнительно</p>
                  <ul className="mt-2 space-y-1">
                    {brief.successMetrics.secondary.map((metric, i) => (
                      <li key={i} className="text-xs text-indigo-100/80">
                        • {metric}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </ContextCard>
        )}

        {/* Company Context */}
        {brief.companyContext && (
          <ContextCard
            icon={<Building2 size={18} className="text-sky-300" />}
            title="Контекст компании"
            className="lg:col-span-2"
          >
            <div className="space-y-3">
              {brief.companyContext.why && (
                <p className="text-sm leading-6 text-indigo-100/90">{brief.companyContext.why}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 text-xs text-indigo-200/70">
                {brief.companyContext.timeline && (
                  <span>
                    📅 {new Date(brief.companyContext.timeline.start).toLocaleDateString("ru-RU")} →{" "}
                    {new Date(brief.companyContext.timeline.end).toLocaleDateString("ru-RU")}
                  </span>
                )}
                
                {brief.companyContext.stakeholders && brief.companyContext.stakeholders.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span>Стейкхолдеры:</span>
                    {brief.companyContext.stakeholders.map((sh, i) => (
                      <span key={i} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-indigo-200">
                        {sh}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ContextCard>
        )}
      </div>
    </section>
  );
}

function ContextCard({
  icon,
  title,
  children,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-black/20 p-4 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider text-indigo-200/70">{title}</span>
      </div>
      {children}
    </div>
  );
}

