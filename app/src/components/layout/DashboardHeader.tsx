"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { BarChart3, Settings2 } from "lucide-react";
import clsx from "clsx";

export function DashboardHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

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

  const handleAnalyticsClick = () => {
    if (campaignId) {
      router.push(`/dashboard/architect/campaigns/${campaignId}/analytics`);
    }
  };

  const handleSettingsClick = () => {
    if (campaignId) {
      router.push(`/dashboard/architect/campaigns/${campaignId}/settings`);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050514]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-12 lg:px-16">
        {/* Логотип */}
        <Link 
          href="/dashboard/architect" 
          className="text-sm font-semibold uppercase tracking-[0.4em] text-indigo-200 hover:text-white transition"
        >
          АЛАБУГА · КОМАНДНЫЙ ЦЕНТР
        </Link>

        {/* Центральная область - кнопки для страниц кампаний */}
        {isCampaignPage && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleAnalyticsClick}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                pathname?.includes('/analytics')
                  ? "border-indigo-400 bg-indigo-500/20 text-white"
                  : "border-white/10 bg-white/5 text-indigo-100/80 hover:border-white/30 hover:text-white"
              )}
            >
              <BarChart3 size={16} />
              Аналитика
            </button>
            
            <button
              onClick={handleSettingsClick}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                pathname?.includes('/settings')
                  ? "border-indigo-400 bg-indigo-500/20 text-white"
                  : "border-white/10 bg-white/5 text-indigo-100/80 hover:border-white/30 hover:text-white"
              )}
            >
              <Settings2 size={16} />
              Настройки кампании
            </button>
          </div>
        )}

        {/* Правая область - информация о пользователе */}
        <div className="flex items-center gap-4 text-xs font-medium uppercase tracking-[0.3em] text-indigo-100/80">
          {session && (
            <>
              <span className="hidden md:inline-block text-indigo-200/70">
                {(session as any)?.user?.email}
              </span>
              <span className="rounded-full border border-white/20 px-3 py-1.5 text-white">
                {(session as any)?.user?.role}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-full border border-white/10 px-4 py-2 transition hover:border-white/30 hover:text-white"
              >
                Выйти
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
