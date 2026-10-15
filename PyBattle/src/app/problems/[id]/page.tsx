"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatMs } from "@/lib/format";
import type { Problem } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import { DifficultyBadge, Panel } from "@/components/ui";

export default function ProblemDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api.get<Problem>(`/api/problems/${params.id}`).then((res) => {
      if (!res.success) setError(res.error);
      else setProblem(res.data);
    });
  }, [params.id]);

  if (error) return <p className="p-10 text-xs text-signal">{error}</p>;
  if (!problem) return <p className="p-10 text-xs text-ink">LADE PROBLEM…</p>;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <p className="kicker">
        <span className="sigil">✱</span> AUFGABE / {problem.id}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <DifficultyBadge level={problem.difficulty} />
        <h1 className="font-pixel text-xl text-ink">{problem.title}</h1>
      </div>
      {problem.best_score ? (
        <p className="mt-3 text-[11px] text-accent">
          DEIN REKORD: {formatMs(problem.best_score)}
        </p>
      ) : (
        <p className="mt-3 text-[11px] text-ink opacity-70">NOCH KEINE BESTZEIT.</p>
      )}
      <Panel className="mt-8 p-6">
        <p className="whitespace-pre-wrap text-xs leading-6 tracking-[0.1em] text-ink">
          {problem.description}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] tracking-[0.25em] text-ink opacity-70">
              BEISPIEL INPUT
            </p>
            <pre className="mt-2 border border-ink bg-ink p-3 font-mono text-xs text-paper lowercase">
              {problem.example_input}
            </pre>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.25em] text-ink opacity-70">
              BEISPIEL OUTPUT
            </p>
            <pre className="mt-2 border border-ink bg-ink p-3 font-mono text-xs text-paper lowercase">
              {problem.example_output}
            </pre>
          </div>
        </div>
      </Panel>
      <div className="mt-6">
        {user ? (
          <Link href={`/solo/${problem.id}`} className="btn btn-pink px-5 py-3">
            SOLO STARTEN_
          </Link>
        ) : (
          <Link href="/login" className="link-pink text-xs">
            EINLOGGEN, UM SOLO ZU SPIELEN
          </Link>
        )}
      </div>
    </main>
  );
}
