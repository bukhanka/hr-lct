"use client";

import { mockUserGroups } from "@/lib/auth";
import { signIn } from "next-auth/react";
import { useState } from "react";

const groupLabels = {
  admins: "👑 Администраторы",
  champions: "🏆 Чемпионы (высокая активность)",
  progress: "📈 В процессе",
  stalled: "⚠️ Застопорились",
  dropped: "❌ Отвалились",
  corporate: "🏢 Корпоративная адаптация",
  esg: "🌱 ESG Программа",
  newbies: "🆕 Новички (чистый старт)",
} as const;

const groupColors = {
  admins: "border-purple-500/30 bg-purple-500/5 hover:border-purple-400/50 hover:bg-purple-500/10",
  champions: "border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-400/50 hover:bg-yellow-500/10",
  progress: "border-blue-500/30 bg-blue-500/5 hover:border-blue-400/50 hover:bg-blue-500/10",
  stalled: "border-orange-500/30 bg-orange-500/5 hover:border-orange-400/50 hover:bg-orange-500/10",
  dropped: "border-red-500/30 bg-red-500/5 hover:border-red-400/50 hover:bg-red-500/10",
  corporate: "border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-400/50 hover:bg-cyan-500/10",
  esg: "border-green-500/30 bg-green-500/5 hover:border-green-400/50 hover:bg-green-500/10",
  newbies: "border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-400/50 hover:bg-indigo-500/10",
} as const;

export function RoleSwitcher() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async (email: string, role: string) => {
    try {
      setIsSubmitting(true);
      await signIn("credentials", {
        email,
        role,
        callbackUrl: `/dashboard/${role}`,
        redirect: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {Object.entries(mockUserGroups).map(([groupKey, users]) => (
        <div key={groupKey} className="flex flex-col gap-4">
          <h3 className="text-sm font-medium uppercase tracking-wider text-indigo-300/80">
            {groupLabels[groupKey as keyof typeof groupLabels]}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSignIn(user.email, user.role)}
                disabled={isSubmitting}
                className={`group flex flex-col gap-3 rounded-2xl border p-5 text-left backdrop-blur transition disabled:opacity-70 ${
                  groupColors[groupKey as keyof typeof groupColors]
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-lg font-semibold text-white">
                    {user.name}
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] uppercase tracking-widest text-white/70">
                    {user.role}
                  </span>
                </div>
                {user.description && (
                  <span className="text-xs leading-relaxed text-white/60">
                    {user.description}
                  </span>
                )}
                <span className="text-xs text-white/40">{user.email}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

