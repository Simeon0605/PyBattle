"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Protected } from "@/components/protected";
import { Panel } from "@/components/ui";
import { api } from "@/lib/api";
import type { BattleMatch } from "@/lib/types";

function Queue() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "queued" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setError(null);
    setStatus("queued");
    const queued = await api.post<{ queued: boolean }>("/api/battle/queue");
    if (!queued.success) {
      setStatus("error");
      setError(queued.error);
      return;
    }
    await new Promise((r) => setTimeout(r, 1600));
    const match = await api.post<BattleMatch>("/api/battle/match");
    if (!match.success) {
      setStatus("error");
      setError(match.error);
      return;
    }
    sessionStorage.setItem("pyclash_match", JSON.stringify(match.data));
    router.push(`/battle/${match.data.id}`);
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-12">
      <Panel className="chamfer relative p-10 text-center">
        <span className="mark absolute left-3 top-3" aria-hidden="true" />
        <span className="mark absolute right-3 top-3" aria-hidden="true" />
        <span className="mark absolute bottom-3 left-3" aria-hidden="true" />
        <span className="mark absolute bottom-3 right-3" aria-hidden="true" />
        <p className="kicker">
          <span className="sigil">✱</span> QUEUE / MATCHMAKING
        </p>
        <h1 className="font-pixel mt-6 text-2xl text-accent">1V1 BATTLE</h1>
        <p className="mx-auto mt-5 max-w-sm text-[11px] leading-6 tracking-[0.15em] text-ink">
          Matchmaking nach ELO. Beide Spieler bekommen dasselbe Problem und 10
          Minuten.
        </p>
        <button
          disabled={status === "queued"}
          onClick={() => void join()}
          className="btn btn-pink mt-8 w-full py-3"
        >
          {status === "queued" ? "SUCHE GEGNER…" : "QUEUE BEITRETEN_"}
        </button>
        {error ? <p className="mt-4 text-xs text-signal">{error}</p> : null}
      </Panel>
    </main>
  );
}

export default function BattlePage() {
  return (
    <Protected>
      <Queue />
    </Protected>
  );
}
