"use client";

import Link from "next/link";
import { useState } from "react";
import { mainNavigation } from "@/data/navigation";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

export function SiteHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (pathname?.startsWith("/dashboard/architect/campaigns") && pathname.includes("/builder")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050514]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-12 lg:px-16">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.4em] text-indigo-200">
          АЛАБУГА · КОМАНДНЫЙ ЦЕНТР
        </Link>

        <nav className="hidden items-center gap-4 text-xs font-medium uppercase tracking-[0.3em] text-indigo-100/80 md:flex">
          {mainNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-transparent px-4 py-2 transition hover:border-white/20 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          {session ? (
            <>
              <Link
                href={`/dashboard/${(session as any)?.user?.role}`}
                className={`rounded-full border px-4 py-2 transition hover:border-white/20 hover:text-white ${pathname?.startsWith("/dashboard") ? "border-white/20 text-white" : "border-transparent"}`}
              >
                {(session as any)?.user?.role}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-full border border-white/10 px-4 py-2 transition hover:border-white/30 hover:text-white"
              >
                Выйти
              </button>
            </>
          ) : (
            <Link
              href="/auth/sign-in"
              className="rounded-full border border-white/10 px-4 py-2 transition hover:border-white/30 hover:text-white"
            >
              Войти
            </Link>
          )}
        </nav>

        <button
          type="button"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-indigo-100/80 transition hover:border-white/30 md:hidden"
        >
          Меню
        </button>
      </div>

      {isMenuOpen && (
        <div className="border-t border-white/10 bg-[#050514] px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm text-indigo-100/80">
            {mainNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-2xl border border-white/10 px-4 py-3 text-xs uppercase tracking-[0.3em] transition hover:border-white/30 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            {session ? (
              <>
                <Link
                  href={`/dashboard/${(session as any)?.user?.role}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-2xl border border-white/10 px-4 py-3 text-xs uppercase tracking-[0.3em] transition hover:border-white/30 hover:text-white"
                >
                  Личный кабинет ({(session as any)?.user?.role})
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="rounded-2xl border border-white/10 px-4 py-3 text-left text-xs uppercase tracking-[0.3em] transition hover:border-white/30 hover:text-white"
                >
                  Выйти
                </button>
              </>
            ) : (
              <Link
                href="/auth/sign-in"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-2xl border border-white/10 px-4 py-3 text-xs uppercase tracking-[0.3em] transition hover:border-white/30 hover:text-white"
              >
                Войти
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

