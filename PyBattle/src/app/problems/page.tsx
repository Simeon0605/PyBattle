"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatMs } from "@/lib/format";
import type { ProblemListItem } from "@/lib/types";
import { DifficultyBadge, Panel } from "@/components/ui";

export default function ProblemsPage() {
  const [items, setItems] = useState<ProblemListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.get<ProblemListItem[]>("/api/problems").then((res) => {
      if (!res.success) setError(res.error);
      else setItems(res.data);
    });
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <p className="kicker">
        <span className="sigil">✱</span> ARCHIV / AUFGABEN
      </p>
      <h1 className="font-pixel mt-4 text-2xl text-ink">PROBLEME</h1>
      <p className="mt-3 text-[11px] tracking-[0.15em] text-ink">
        Öffentliche Liste. Test-Cases siehst du nicht — nur die Anzahl.
      </p>
      {error ? <p className="mt-6 text-xs text-signal">{error}</p> : null}
      <div className="mt-8 space-y-3">
        {items.map((p) => (
          <Link key={p.id} href={`/problems/${p.id}`} className="block">
            <Panel className="flex items-center justify-between px-5 py-4 hover:bg-paper-alt">
              <div className="flex items-center gap-4">
                <DifficultyBadge level={p.difficulty} />
                <div>
                  <p className="text-sm text-ink">{p.title}</p>
                  <p className="text-[10px] tracking-[0.2em] text-ink opacity-70">
                    {p.test_case_count} VERSTECKTE TESTS
                  </p>
                </div>
              </div>
              <div className="text-right text-[11px]">
                {p.solved ? (
                  <p className="text-accent">
                    GELÖST · BESTZEIT {p.best_score ? formatMs(p.best_score) : "—"}
                  </p>
                ) : (
                  <p className="text-ink opacity-70">OFFEN</p>
                )}
              </div>
            </Panel>
          </Link>
        ))}
      </div>
    </main>
  );
}
