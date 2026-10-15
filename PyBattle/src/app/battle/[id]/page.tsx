"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CodeEditor } from "@/components/code-editor";
import { Protected } from "@/components/protected";
import { Panel } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDuration } from "@/lib/format";
import type { BattleMatch, SoloSubmitResult } from "@/lib/types";

function Arena() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [match, setMatch] = useState<BattleMatch | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [now, setNow] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [over, setOver] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const init = setTimeout(() => {
      const raw = sessionStorage.getItem("pyclash_match");
      if (!raw) return;
      const parsed = JSON.parse(raw) as BattleMatch;
      if (parsed.id !== params.id) return;
      setMatch(parsed);
      setCode(parsed.problem.starter_code);
      void api
        .post<{ session_id: string }>("/api/solo/start", { problem_id: parsed.problem.id })
        .then((res) => {
          if (res.success) setSessionId(res.data.session_id);
        });
    }, 0);
    return () => clearTimeout(init);
  }, [params.id]);

  useEffect(() => {
    if (!match) return;
    const fail = setTimeout(() => {
      setLog((l) => [...l, `${match.opponent.username} hat einen Fehler (3/6 Tests)`]);
    }, 4000);
    const progress = setTimeout(() => {
      setLog((l) => [...l, `${match.opponent.username} ist bei Test 5/6`]);
    }, 9000);
    return () => {
      clearTimeout(fail);
      clearTimeout(progress);
    };
  }, [match]);

  if (!match) {
    return (
      <div className="p-10">
        <p className="text-xs tracking-[0.2em] text-ink">MATCH NICHT GEFUNDEN.</p>
        <button
          className="link-pink mt-3 text-xs"
          onClick={() => router.push("/battle")}
        >
          ZUR QUEUE
        </button>
      </div>
    );
  }

  const elapsed = now - new Date(match.started_at).getTime();
  const left = Math.max(0, match.time_limit_ms - elapsed);

  async function submit() {
    if (!match || !sessionId) return;
    setPending(true);
    const res = await api.post<SoloSubmitResult>("/api/solo/submit", {
      session_id: sessionId,
      code,
    });
    setPending(false);
    if (!res.success) {
      setLog((l) => [...l, res.error]);
      return;
    }
    if (res.data.compile_error) {
      setLog((l) => [...l, `Compile-Error: ${res.data.compile_error}`]);
      return;
    }
    if (!res.data.correct) {
      setLog((l) => [...l, `Du: ${res.data.tests_passed}/${res.data.tests_total} Tests`]);
      return;
    }
    const finish = await api.post<{ elo_change: number }>("/api/battle/finish", {
      win: true,
      opponent: match.opponent.username,
      problem_title: match.problem.title,
      duration_ms: elapsed,
    });
    const change = finish.success ? finish.data.elo_change : 18;
    setOver(`SIEG GEGEN ${match.opponent.username} (${change >= 0 ? "+" : ""}${change} ELO)`);
  }

  return (
    <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_280px]">
      <div>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="kicker">
              <span className="sigil">✱</span> ARENA / {match.problem.id}
            </p>
            <h1 className="font-pixel mt-3 text-lg text-ink">
              {match.problem.title}
            </h1>
            <p className="mt-2 text-[10px] tracking-[0.15em] text-ink opacity-70">
              {match.problem.description}
            </p>
          </div>
          <p className="font-pixel text-lg text-accent">{formatDuration(left)}</p>
        </div>
        <CodeEditor value={code} onChange={setCode} />
        <button
          disabled={pending || Boolean(over) || left <= 0}
          onClick={() => void submit()}
          className="btn btn-pink mt-4"
        >
          {pending ? "SUBMIT…" : "LÖSUNG SENDEN_"}
        </button>
        {over ? (
          <p className="mt-4 text-xs tracking-[0.2em] text-accent">✱ {over}</p>
        ) : null}
      </div>
      <Panel className="p-5">
        <p className="text-[10px] tracking-[0.25em] text-ink opacity-70">GEGNER</p>
        <p className="font-pixel mt-2 text-sm text-ink">
          {match.opponent.username}
        </p>
        <p className="mt-1 font-mono text-xs text-ink">{match.opponent.elo} ELO</p>
        <div className="mt-6 space-y-2 text-[10px] leading-5 tracking-[0.15em] text-ink">
          {log.length === 0 ? <p>WARTE AUF LIVE-UPDATES…</p> : null}
          {log.map((line) => (
            <p key={line} className="border border-ink bg-paper-alt px-3 py-2">
              {line}
            </p>
          ))}
        </div>
      </Panel>
    </main>
  );
}

export default function BattleMatchPage() {
  return (
    <Protected>
      <Arena />
    </Protected>
  );
}
