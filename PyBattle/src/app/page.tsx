import Link from "next/link";

const features = [
  {
    no: "01",
    title: "SOLO-MODE",
    text: "Der Server besitzt die Zeit. Anti-Cheat, Bestzeiten, versteckte Tests.",
  },
  {
    no: "02",
    title: "1V1 BATTLES",
    text: "Matchmaking nach ELO, Live-Status, wer zuerst alle Tests knackt, gewinnt.",
  },
  {
    no: "03",
    title: "SICHERE AUTH",
    text: "JWT + Refresh-Cookie-Flow. Frontend spricht nur mit deiner API, nie mit der DB.",
  },
  {
    no: "04",
    title: "LIGA",
    text: "Globales Ranking, Match-Historie und Profil-Stats.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4">
      <div className="ticker mt-6" aria-hidden="true">
        <span className="ticker-row">
          ✱ SYSTEM ONLINE ✱ SEASON 04 LÄUFT ✱ NÄCHSTES TURNIER: FR 22:00 UTC ✱ ELO-RESET IN 12D ✱&nbsp;
        </span>
      </div>

      <section className="grid gap-10 py-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p className="kicker">
            <span className="sigil">✱</span> PYTHON / CODE / ARENA
          </p>
          <h1 className="font-pixel mt-6 text-[clamp(22px,5.5vw,56px)] leading-[1.3]">
            <span className="block text-accent">SCHREIB</span>
            <span className="block text-ink">CODE.</span>
            <span className="block text-accent">SCHLAG DEN</span>
            <span
              className="block text-transparent"
              style={{ WebkitTextStroke: "2px var(--pink)" }}
            >
              GEGNER.
            </span>
          </h1>
          <p className="mt-8 max-w-xl text-xs leading-6 tracking-[0.15em] text-ink">
            PyClash ist eine 1v1-Plattform für Python-Aufgaben. Solo gegen die
            Uhr oder live im Battle — geprüft gegen versteckte Test-Cases.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/register" className="btn btn-pink px-5 py-3">
              JETZT STARTEN_
            </Link>
            <Link href="/problems" className="btn btn-line px-5 py-3">
              PROBLEME ANSEHEN
            </Link>
          </div>
        </div>

        {/* Pixel-Art: Terminal mit Herz */}
        <div className="panel chamfer panel-alt relative p-0">
          <span className="mark absolute left-3 top-3" aria-hidden="true" />
          <span className="mark absolute right-3 top-3" aria-hidden="true" />
          <div className="flex items-center gap-2 border-b border-ink px-4 py-2 text-[10px] tracking-[0.2em]">
            <span className="h-2 w-2 bg-signal" />
            <span className="h-2 w-2 bg-pink" />
            <span className="h-2 w-2 bg-accent" />
            <span className="ml-auto">BATTLE_4471.PY</span>
          </div>
          <div className="bg-ink p-5 font-mono text-[13px] leading-7 text-paper lowercase">
            <pre className="overflow-x-auto">{`def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i`}</pre>
            <p className="mt-3 text-pink">{">>> RUN TESTS …… 6/6 OK"}</p>
            <p className="text-paper">{">>> SUBMIT …… ACCEPTED ✱"}</p>
            <p className="text-paper">{">>> ELO 1487 → 1512 (+25)"}</p>
            <span className="cursor-block px-1">█</span>
          </div>
          <div className="grid place-items-center border-t border-ink bg-paper-alt py-8">
            <svg
              viewBox="0 0 11 10"
              shapeRendering="crispEdges"
              className="h-20"
              aria-label="Pixel-Herz"
            >
              <g fill="#111111">
                <rect x="1" y="1" width="3" height="1" />
                <rect x="7" y="1" width="3" height="1" />
                <rect x="0" y="2" width="11" height="3" />
                <rect x="1" y="5" width="9" height="1" />
                <rect x="2" y="6" width="7" height="1" />
                <rect x="3" y="7" width="5" height="1" />
                <rect x="4" y="8" width="3" height="1" />
              </g>
              <g fill="#FF2A1F">
                <rect x="2" y="2" width="7" height="2" />
                <rect x="2" y="4" width="7" height="1" />
                <rect x="3" y="5" width="5" height="1" />
                <rect x="4" y="6" width="3" height="1" />
                <rect x="5" y="7" width="1" height="1" />
              </g>
              <g fill="#F5F5F5">
                <rect x="2" y="2" width="1" height="1" />
                <rect x="3" y="2" width="1" height="1" />
                <rect x="2" y="3" width="1" height="1" />
              </g>
            </svg>
          </div>
        </div>
      </section>

      <section className="mb-16 grid gap-px border border-ink bg-ink sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.no} className="bg-paper p-5">
            <p className="font-pixel text-xs text-signal">{f.no}</p>
            <h2 className="font-pixel mt-4 text-sm leading-6 text-accent">
              {f.title}
            </h2>
            <p className="mt-3 text-[11px] leading-5 tracking-[0.1em] text-ink">
              {f.text}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
