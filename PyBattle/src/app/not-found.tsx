import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <p className="kicker">
        <span className="sigil">✱</span> FEHLER / SEITE NICHT GEFUNDEN
      </p>
      <h1 className="font-pixel mt-8 text-[clamp(48px,14vw,120px)] leading-none text-accent">
        404
      </h1>
      <p className="mt-8 max-w-md text-xs leading-6 tracking-[0.2em] text-ink">
        Diese Route existiert nicht im System. Vielleicht wurde sie
        refaktoriert — oder sie hat nie einen Test bestanden.
      </p>
      <Link href="/" className="btn btn-pink mt-10 px-5 py-3">
        ZURÜCK ZUM START_
      </Link>
    </main>
  );
}
