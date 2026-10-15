"use client";

import { useEffect, useState } from "react";
import { Protected } from "@/components/protected";
import { useAuth } from "@/components/auth-provider";
import { Panel } from "@/components/ui";
import { api } from "@/lib/api";
import { formatMs } from "@/lib/format";
import type { MatchHistoryItem, SoloStats } from "@/lib/types";

function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SoloStats | null>(null);
  const [history, setHistory] = useState<MatchHistoryItem[]>([]);

  useEffect(() => {
    void api.get<SoloStats>("/api/solo/stats").then((res) => {
      if (res.success) setStats(res.data);
    });
    void api.get<MatchHistoryItem[]>("/api/battle/history").then((res) => {
      if (res.success) setHistory(res.data);
    });
  }, []);

  if (!user) return null;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <p className="kicker">
        <span className="sigil">✱</span> AKKOUNT / STATS
      </p>
      <h1 className="font-pixel mt-4 text-2xl text-ink">{user.username}</h1>
      <p className="mt-2 text-[11px] tracking-[0.15em] text-ink opacity-70">
        {user.email}
      </p>
      <div className="mt-8 grid gap-px border border-ink bg-ink sm:grid-cols-3">
        <div className="bg-paper p-5">
          <p className="text-[10px] tracking-[0.25em] text-ink opacity-70">ELO</p>
          <p className="font-pixel mt-2 text-xl text-accent">{user.elo}</p>
        </div>
        <div className="bg-paper p-5">
          <p className="text-[10px] tracking-[0.25em] text-ink opacity-70">
            SOLO GELÖST
          </p>
          <p className="font-pixel mt-2 text-xl text-ink">{stats?.solved ?? "—"}</p>
        </div>
        <div className="bg-paper p-5">
          <p className="text-[10px] tracking-[0.25em] text-ink opacity-70">
            SOLO-ATTEMPTS
          </p>
          <p className="font-pixel mt-2 text-xl text-ink">
            {stats?.attempts ?? "—"}
          </p>
        </div>
      </div>
      <h2 className="font-pixel mt-10 text-sm text-ink">BESTZEITEN</h2>
      <div className="mt-3 space-y-2">
        {stats?.best_times.length ? (
          stats.best_times.map((t) => (
            <Panel
              key={t.problem_id}
              className="flex justify-between px-4 py-3 text-[11px] tracking-[0.15em]"
            >
              <span>{t.title}</span>
              <span className="font-mono text-accent">
                {formatMs(t.duration_ms)}
              </span>
            </Panel>
          ))
        ) : (
          <p className="text-[11px] text-ink opacity-70">
            NOCH KEINE SOLO-BESTZEITEN.
          </p>
        )}
      </div>
      <h2 className="font-pixel mt-10 text-sm text-ink">MATCH-HISTORIE</h2>
      <div className="mt-3 space-y-2">
        {history.length ? (
          history.map((m) => (
            <Panel
              key={m.id}
              className="flex justify-between px-4 py-3 text-[11px] tracking-[0.15em]"
            >
              <span>
                VS {m.opponent} · {m.problem_title}
              </span>
              <span
                className={
                  m.result === "win" ? "text-accent" : "text-signal"
                }
              >
                {m.result === "win" ? "WIN" : "LOSS"}{" "}
                {m.elo_change >= 0 ? "+" : ""}
                {m.elo_change}
              </span>
            </Panel>
          ))
        ) : (
          <p className="text-[11px] text-ink opacity-70">NOCH KEINE BATTLES.</p>
        )}
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Protected>
      <Profile />
    </Protected>
  );
}
