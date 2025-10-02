"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import clsx from "clsx";
import { ArrowLeft } from "lucide-react";

export function DashboardHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Извлекаем ID кампании из URL если мы на странице кампании
  const campaignMatch = pathname?.match(/\/campaigns\/([^\/]+)/);
  const campaignId = campaignMatch?.[1];
  const isCampaignPage = !!campaignId;

  // Определяем, находимся ли мы на странице конструктора
  const isBuilderPage = pathname?.includes('/builder');

  // Не показываем хедер на странице builder'а (там свой хедер)
  if (isBuilderPage) {
    return null;
  }

  const tabs = campaignId ? [
    { href: `/dashboard/architect/campaigns/${campaignId}`, label: "Обзор" },
    { href: `/dashboard/architect/campaigns/${campaignId}/builder`, label: "Конструктор" },
    { href: `/dashboard/architect/campaigns/${campaignId}/settings`, label: "Настройки" },
    { href: `/dashboard/architect/campaigns/${campaignId}/analytics`, label: "Аналитика" },
    { href: `/dashboard/architect/campaigns/${campaignId}/participants`, label: "Участники" },
    { href: `/dashboard/architect/campaigns/${campaignId}/test`, label: "Тестовый режим" },
  ] : [];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050514]/95 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6">
        {/* Основная строка header */}
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-4">
            {/* Кнопка назад к дашборду на страницах кампаний */}
            {isCampaignPage && (
              <Link
                href="/dashboard/architect"
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-indigo-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft size={14} />
                <span>К дашборду</span>
              </Link>
            )}
            
            {/* Логотип */}
            <Link 
              href="/dashboard/architect" 
              className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-200 hover:text-white transition"
            >
              АЛАБУГА · КОМАНДНЫЙ ЦЕНТР
            </Link>
          </div>

          {/* Правая область - информация о пользователе */}
          <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.25em] text-indigo-100/80">
            {session && (
              <>
                <span className="hidden lg:inline-block text-indigo-200/60 text-[10px]">
                  {(session as any)?.user?.email}
                </span>
                <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-white text-[10px]">
                  {(session as any)?.user?.role}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                >
                  Выйти
                </button>
              </>
            )}
          </div>
        </div>

        {/* Вкладки для страниц кампании */}
        {isCampaignPage && tabs.length > 0 && (
          <nav className="flex gap-1 border-t border-white/5 py-2">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={clsx(
                    "rounded-lg px-4 py-2 text-sm transition-all",
                    isActive 
                      ? "bg-indigo-500/20 text-white font-medium" 
                      : "text-indigo-200/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}
