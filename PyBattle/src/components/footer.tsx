"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function Footer() {
  const [year, setYear] = useState(2026);

  useEffect(() => {
    const t = setTimeout(() => setYear(new Date().getFullYear()), 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <footer className="border-t border-ink bg-paper-alt">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-[10px] tracking-[0.25em] text-ink sm:flex-row sm:items-center sm:justify-between">
        <p className="font-wide text-base">
          pyclash<span className="sigil">✱</span>
        </p>
        <nav className="flex flex-wrap gap-4" aria-label="Footer-Navigation">
          <Link href="/problems" className="link-pink">
            PROBLEME
          </Link>
          <Link href="/battle" className="link-pink">
            BATTLE
          </Link>
          <Link href="/leaderboard" className="link-pink">
            LIGA
          </Link>
          <Link href="/register" className="link-pink">
            ANMELDEN
          </Link>
        </nav>
        <p>
          © <span>{year}</span> PYCLASH ✱ SUPABASE / VERCEL / RENDER
        </p>
      </div>
    </footer>
  );
}
