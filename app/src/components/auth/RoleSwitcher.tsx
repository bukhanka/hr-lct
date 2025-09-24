"use client";

import { mockUsers } from "@/lib/auth";
import { signIn } from "next-auth/react";
import { useState } from "react";

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
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {mockUsers.map((user) => (
        <button
          key={user.id}
          type="button"
          onClick={() => handleSignIn(user.email, user.role)}
          disabled={isSubmitting}
          className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-left text-indigo-100/80 backdrop-blur transition hover:border-white/30 hover:text-white disabled:opacity-70"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-indigo-200/70">
            {user.role}
          </span>
          <span className="text-lg font-semibold text-white">{user.name}</span>
          <span className="text-sm">{user.email}</span>
        </button>
      ))}
    </div>
  );
}

