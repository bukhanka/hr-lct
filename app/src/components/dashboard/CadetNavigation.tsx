"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Award, History, Trophy, Map } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export function CadetNavigation() {
  const pathname = usePathname();
  const { theme, getThemeText } = useTheme();
  const primary = theme.palette?.primary || "#8B5CF6";
  const secondary = theme.palette?.secondary || "#38BDF8";

  const navItems = [
    {
      href: "/dashboard/cadet",
      label: "Главная",
      icon: Home,
      exact: true
    },
    {
      href: "/dashboard/cadet/missions",
      label: getThemeText('missions') || "Миссии",
      icon: Map,
      exact: false
    },
    {
      href: "/dashboard/cadet/profile",
      label: getThemeText('profile'),
      icon: User,
      exact: false
    },
    {
      href: "/dashboard/cadet/achievements",
      label: getThemeText('achievements'),
      icon: Award,
      exact: false
    },
    {
      href: "/dashboard/cadet/history",
      label: getThemeText('history'),
      icon: History,
      exact: false
    },
    {
      href: "/dashboard/cadet/leaderboard",
      label: getThemeText('leaderboard'),
      icon: Trophy,
      exact: false
    }
  ];

  return (
    <nav 
      className="sticky top-0 z-20 backdrop-blur-xl mb-8" 
      style={{ borderBottom: `1px solid ${primary}20` }}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16">
        <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200"
                style={{
                  backgroundColor: isActive ? `${primary}20` : "transparent",
                  border: `1px solid ${isActive ? `${primary}40` : "transparent"}`,
                  color: isActive ? primary : "#ffffff80"
                }}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

