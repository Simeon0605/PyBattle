"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./auth-provider";
import { useI18n, type Lang } from "@/lib/i18n";

function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <span
      className="inline-flex border border-ink"
      role="group"
      aria-label="Sprache / Language"
    >
      {(["de", "en"] as const).map((l: Lang) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
          className={`px-2 py-2 text-[10px] tracking-[0.2em] ${
            lang === l
              ? "bg-accent text-white"
              : "text-ink hover:bg-accent hover:text-white"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </span>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  // Esc schließt das Menü
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links = [
    { href: "/problems", label: t("nav.problems") },
    { href: "/battle", label: t("nav.battle") },
    { href: "/leaderboard", label: t("nav.league") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-ink bg-paper">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-wide text-xl leading-none"
          aria-label="PyClash Startseite"
        >
          pyclash<span className="sigil">✱</span>
        </Link>

        <nav
          className="hidden items-center gap-6 text-xs tracking-[0.2em] text-ink md:flex"
          aria-label="Hauptnavigation"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-2 py-2 ${
                pathname.startsWith(l.href)
                  ? "bg-accent text-white"
                  : "hover:bg-accent hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 text-xs md:flex">
          <LangToggle />
          {user ? (
            <>
              <Link href="/profile" className="flex items-center gap-2">
                <span className="text-ink">{user.username}</span>
                <span className="border border-ink px-2 py-0.5 text-[10px] text-accent">
                  {user.elo} ELO
                </span>
              </Link>
              <Link href="/settings" className="link-pink py-2">
                {t("nav.settings")}
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="btn btn-line px-3 py-2"
              >
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="link-pink py-2">
                {t("nav.login")}
              </Link>
              <Link href="/register" className="btn btn-pink px-3 py-2">
                {t("nav.register")}
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="flex h-11 w-11 flex-col items-center justify-center border border-ink md:hidden"
          aria-label={open ? t("nav.menu.close") : t("nav.menu.open")}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="block h-1 w-5 bg-ink" />
          <span className="mt-1 block h-1 w-5 bg-ink" />
          <span className="mt-1 block h-1 w-5 bg-ink" />
        </button>
      </div>

      {/* Mobile menu */}
      {open ? (
        <nav
          className="border-t border-ink bg-paper md:hidden"
          aria-label="Mobile Navigation"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`block border-b border-ink px-4 py-4 text-xs tracking-[0.2em] ${
                pathname.startsWith(l.href)
                  ? "bg-accent text-white"
                  : "text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="border-b border-ink px-4 py-4">
            <LangToggle />
          </div>
          {user ? (
            <>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="block border-b border-ink px-4 py-4 text-xs tracking-[0.2em] text-ink"
              >
                PROFIL / {user.username} / {user.elo} ELO
              </Link>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="block border-b border-ink px-4 py-4 text-xs tracking-[0.2em] text-ink"
              >
                {t("nav.settings")}
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="block w-full border-b border-ink px-4 py-4 text-left text-xs tracking-[0.2em] text-ink"
              >
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block border-b border-ink px-4 py-4 text-xs tracking-[0.2em] text-ink"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="block bg-pink px-4 py-4 text-xs tracking-[0.2em] text-ink"
              >
                {t("nav.register")}
              </Link>
            </>
          )}
        </nav>
      ) : null}
    </header>
  );
}
