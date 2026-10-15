"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui";
import { api } from "@/lib/api";
import type { LeaderboardEntry } from "@/lib/types";

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.get<LeaderboardEntry[]>("/api/leaderboard").then((res) => {
      if (!res.success) setError(res.error);
      else setRows(res.data);
    });
  }, []);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <p className="kicker">
        <span className="sigil">✱</span> RATING / SEASON 04
      </p>
      <h1 className="font-pixel mt-4 text-2xl text-ink">DIE LIGA</h1>
      <p className="mt-3 text-[11px] tracking-[0.15em] text-ink">
        Globales ELO-Ranking.
      </p>
      {error ? <p className="mt-6 text-xs text-signal">{error}</p> : null}
      <Panel className="mt-8 max-w-full overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-[11px] tracking-[0.15em]">
          <thead className="border-b border-ink bg-paper-alt text-accent">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">SPIELER</th>
              <th className="px-4 py-3">ELO</th>
              <th className="px-4 py-3">W</th>
              <th className="px-4 py-3">L</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.username}
                className={`border-b border-ink last:border-b-0 ${i === 0 ? "bg-pink" : ""}`}
              >
                <td className="px-4 py-3 font-mono">{r.rank}</td>
                <td className="px-4 py-3 text-ink">{r.username}</td>
                <td className="px-4 py-3 font-mono text-accent">{r.elo}</td>
                <td className="px-4 py-3">{r.wins}</td>
                <td className="px-4 py-3">{r.losses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <p className="mt-4 text-[10px] tracking-[0.25em] text-signal">
        ✱ RAGEQUIT ZÄHLT ALS NIEDERLAGE
      </p>
    </main>
  );
}
