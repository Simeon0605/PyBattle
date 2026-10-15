"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "./auth-provider";

const links = [
  { href: "/problems", label: "PROBLEME" },
  { href: "/battle", label: "BATTLE" },
  { href: "/leaderboard", label: "LIGA" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
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
          {user ? (
            <>
              <Link href="/profile" className="flex items-center gap-2">
                <span className="text-ink">{user.username}</span>
                <span className="border border-ink px-2 py-0.5 text-[10px] text-accent">
                  {user.elo} ELO
                </span>
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="btn btn-line px-3 py-2"
              >
                LOGOUT
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="link-pink py-2">
                LOGIN
              </Link>
              <Link href="/register" className="btn btn-pink px-3 py-2">
                REGISTRIEREN_
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="flex h-11 w-11 flex-col items-center justify-center border border-ink md:hidden"
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
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
          {user ? (
            <>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="block border-b border-ink px-4 py-4 text-xs tracking-[0.2em] text-ink"
              >
                PROFIL / {user.username} / {user.elo} ELO
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="block w-full border-b border-ink px-4 py-4 text-left text-xs tracking-[0.2em] text-ink"
              >
                LOGOUT
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block border-b border-ink px-4 py-4 text-xs tracking-[0.2em] text-ink"
              >
                LOGIN
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="block bg-pink px-4 py-4 text-xs tracking-[0.2em] text-ink"
              >
                REGISTRIEREN_
              </Link>
            </>
          )}
        </nav>
      ) : null}
    </header>
  );
}
