"use client";

import Link from "next/link";
import clsx from "clsx";
import { usePathname } from "next/navigation";

interface CampaignTabsProps {
  tabs: Array<{ href: string; label: string }>;
}

export function CampaignTabs({ tabs }: CampaignTabsProps) {
  const pathname = usePathname();

  return (
    <nav
      className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 text-sm text-indigo-100/80"
      aria-label="Разделы кампании"
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={clsx(
              "rounded-xl px-4 py-2 transition hover:bg-indigo-500/20 hover:text-white",
              isActive && "bg-indigo-500/20 text-white"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

