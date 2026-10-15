"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CodeEditor } from "@/components/code-editor";
import { Protected } from "@/components/protected";
import { DifficultyBadge, Panel } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDuration, formatMs } from "@/lib/format";
import type { SoloSession, SoloSubmitResult } from "@/lib/types";

function SoloArena() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SoloSession | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SoloSubmitResult | null>(null);
  const [pending, setPending] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    void api
      .post<SoloSession>("/api/solo/start", { problem_id: params.id })
      .then((res) => {
        if (!res.success) {
          setError(res.error);
          return;
        }
        setSession(res.data);
        setCode(res.data.problem.starter_code);
      });
  }, [params.id]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  if (error) {
    return (
      <div className="p-10">
        <p className="text-xs tracking-[0.2em] text-signal">{error}</p>
        <button
          className="link-pink mt-4 text-xs"
          onClick={() => router.push("/problems")}
        >
          ZURÜCK
        </button>
      </div>
    );
  }

  if (!session)
    return (
      <p className="p-10 text-xs tracking-[0.2em] text-ink">
        SESSION WIRD VOM SERVER GESTARTET…
      </p>
    );

  const started = new Date(session.started_at).getTime();
  const elapsed = now - started;
  const timedOut = elapsed >= 15 * 60 * 1000;

  async function submit() {
    if (!session) return;
    setPending(true);
    setError(null);
    const res = await api.post<SoloSubmitResult>("/api/solo/submit", {
      session_id: session.session_id,
      code,
    });
    setPending(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    setResult(res.data);
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[0.9fr_1.1fr]">
      <Panel className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="kicker">
              <span className="sigil">✱</span> SOLO / SERVER-TIMING
            </p>
            <DifficultyBadge level={session.problem.difficulty} />
            <h1 className="font-pixel mt-3 text-lg text-ink">
              {session.problem.title}
            </h1>
          </div>
          <div className="text-right">
            <p className="font-pixel text-lg text-accent">
              {formatDuration(elapsed)}
            </p>
            <p className="mt-1 text-[9px] tracking-[0.2em] text-ink opacity-70">
              SERVER-TIMER (STARTED_AT)
            </p>
          </div>
        </div>
        <p className="mt-4 whitespace-pre-wrap text-[11px] leading-6 tracking-[0.1em] text-ink">
          {session.problem.description}
        </p>
        <div className="mt-4 border border-ink bg-ink p-3 font-mono text-[11px] text-paper lowercase">
          <p>Input: {session.problem.example_input}</p>
          <p>Output: {session.problem.example_output}</p>
        </div>
        {session.problem.best_score ? (
          <p className="mt-4 text-[11px] text-accent">
            DEIN REKORD: {formatMs(session.problem.best_score)}
          </p>
        ) : null}
      </Panel>
      <div>
        <CodeEditor value={code} onChange={setCode} />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            disabled={pending || timedOut || result?.correct}
            onClick={() => void submit()}
            className="btn btn-pink"
          >
            {pending ? "PISTON PRÜFT…" : "SUBMIT_"}
          </button>
          <p className="text-[9px] tracking-[0.2em] text-ink opacity-70">
            MIN. 5S · MAX. 15MIN · 1 SUBMIT (AUSSER COMPILE-ERROR)
          </p>
        </div>
        {error ? <p className="mt-3 text-xs text-signal">{error}</p> : null}
        {result ? (
          <Panel className="mt-4 p-4 text-[11px] tracking-[0.15em]" aria-live="polite">
            {result.compile_error ? (
              <p className="text-pink">
                {result.compile_error} — du darfst erneut submitten.
              </p>
            ) : result.correct ? (
              <p className="text-accent">
                ✱ ALLE TESTS BESTANDEN IN {formatMs(result.duration_ms ?? 0)}.
                BESTZEIT: {result.best_score ? formatMs(result.best_score) : "—"}
              </p>
            ) : (
              <p className="text-signal">
                {result.tests_passed}/{result.tests_total} TESTS. SESSION FAILED.
              </p>
            )}
          </Panel>
        ) : null}
      </div>
    </main>
  );
}

export default function SoloPage() {
  return (
    <Protected>
      <SoloArena />
    </Protected>
  );
}
