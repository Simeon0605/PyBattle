"use client";

import { useI18n } from "@/lib/i18n";

const CONTACT_EMAIL = "simeon2feil@gmail.com";

function DeContent() {
  return (
    <div className="panel panel-alt chamfer mt-8 p-6 text-[13px] leading-7 tracking-[0.02em] text-ink normal-case sm:p-8">
      <p>
        Kurzfassung: PyClash verwendet <strong>keine Tracking-, Analyse- oder
        Werbe-Cookies</strong> und keine externen Tracker. Gespeichert werden nur
        Accountdaten (Username, E-Mail, Passwort-Hash) und Spieldaten (ELO, Zeiten,
        Matches) sowie die technisch notwendige Login-Sitzung.
      </p>

      <h2 className="font-pixel mt-10 text-sm text-accent">1. VERANTWORTLICHER</h2>
      <p className="mt-3">
        Betreiber von PyClash ist Simeon (
        <a
          className="link-pink"
          href="https://github.com/Simeon0605"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/Simeon0605
        </a>
        ). Anfragen zum Datenschutz erreichst du unter{" "}
        <a className="link-pink" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
        .
      </p>

      <h2 className="font-pixel mt-10 text-sm text-accent">2. WELCHE DATEN WIR VERARBEITEN</h2>
      <h3 className="mt-6 text-xs font-bold">Account (Registrierung)</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Username und E-Mail-Adresse</li>
        <li>
          Passwort – ausschließlich als bcrypt-Hash (12 Runden) gespeichert, nie im
          Klartext
        </li>
        <li>Konto-ID (zufällige UUID), Start-ELO (1000) und Registrierungszeitpunkt</li>
      </ul>
      <h3 className="mt-6 text-xs font-bold">Spieldaten</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>ELO-Punkte, Siege/Niederlagen und deine Match-History (Gegner, Aufgabe, Dauer)</li>
        <li>
          Solo-Versuche: Start-/Endzeit, Dauer, Status, Bestleistung sowie der zuletzt
          abgeschickte Code
        </li>
      </ul>
      <p className="mt-3">
        Dein <strong>Username ist öffentlich sichtbar</strong> (Leaderboard,
        Matchmaking). E-Mail-Adresse und Passwort-Hash sind nicht öffentlich.
        Rechtsgrundlage für Account- und Spieldaten ist Art. 6 Abs. 1 lit. b DSGVO
        (Vertragserfüllung).
      </p>
      <h3 className="mt-6 text-xs font-bold">Server-Logfiles</h3>
      <p className="mt-2">
        Beim Aufruf der Seite verarbeiten die unten genannten Hosting-Anbieter
        technische Zugriffsdaten (u. a. IP-Adresse, Zeitpunkt, aufgerufene Seite,
        Browsertyp) in Logfiles, um den Betrieb sicherzustellen und Missbrauch
        abzuwehren. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
        Interesse).
      </p>

      <h2 className="font-pixel mt-10 text-sm text-accent">3. COOKIES & LOKALE SPEICHER</h2>
      <p className="mt-3">
        PyClash setzt ausschließlich <strong>technisch notwendige</strong> Cookies und
        Browser-Speicher ein, damit der Login funktioniert. Tracking-, Analyse- oder
        Werbe-Cookies verwenden wir nicht – deshalb fragen wir auch keine
        Cookie-Einwilligung ab (§ 25 Abs. 2 Nr. 2 TDDDG). Folgende Speicher werden
        genutzt:
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] border border-ink text-left text-[12px] leading-6">
          <thead className="bg-paper-alt">
            <tr className="border-b border-ink">
              <th className="border-r border-ink px-3 py-2">Name</th>
              <th className="border-r border-ink px-3 py-2">Typ</th>
              <th className="border-r border-ink px-3 py-2">Zweck</th>
              <th className="px-3 py-2">Dauer</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-ink">
              <td className="border-r border-ink px-3 py-2 font-bold">pyclash_refresh_token</td>
              <td className="border-r border-ink px-3 py-2">Cookie (httpOnly, SameSite=Strict, Secure)</td>
              <td className="border-r border-ink px-3 py-2">Bleibst eingeloggt und erhältst automatisch neue Access-Tokens</td>
              <td className="px-3 py-2">30 Tage, bei Logout sofort gelöscht</td>
            </tr>
            <tr className="border-b border-ink">
              <td className="border-r border-ink px-3 py-2 font-bold">pyclash_access_token</td>
              <td className="border-r border-ink px-3 py-2">sessionStorage (kein Cookie)</td>
              <td className="border-r border-ink px-3 py-2">Hält deine Anmeldung im aktuellen Tab</td>
              <td className="px-3 py-2">bis der Tab geschlossen wird</td>
            </tr>
            <tr>
              <td className="border-r border-ink px-3 py-2 font-bold">pyclash_cookie_notice</td>
              <td className="border-r border-ink px-3 py-2">localStorage (kein Cookie)</td>
              <td className="border-r border-ink px-3 py-2">Merkt sich, dass du den Cookie-Hinweis bestätigt hast</td>
              <td className="px-3 py-2">bis du deine Browserdaten löschst</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="font-pixel mt-10 text-sm text-accent">4. DIENSTE & AUFTRAGSVERARBEITER</h2>
      <p className="mt-3">
        Sämtliche Übertragungen laufen verschlüsselt über TLS/HTTPS. Bei den
        folgenden Anbietern kann Datenverarbeitung in Rechenzentren außerhalb der EU
        (v. a. USA) erfolgen; Grundlage sind die jeweiligen Datenschutz-Zusagen und
        Standardvertragsklauseln der Anbieter:
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <li><strong>Vercel, Inc. (USA)</strong> — Frontend-Hosting: Liefert die Web-App aus und verarbeitet technische Zugriffsdaten in Logfiles.</li>
        <li><strong>Render (Render.com, Inc., USA)</strong> — Backend (REST-API & Realtime-Server): Betreibt die Spiel-Logik und verarbeitet technische Zugriffsdaten in Logfiles.</li>
        <li><strong>Supabase, Inc. (USA)</strong> — PostgreSQL-Datenbank: Speichert Accounts, Spieldaten und Login-Tokens.</li>
        <li><strong>Piston (öffentliche Instanz auf emkc.org)</strong> — Sandbox zur Ausführung von Python-Code: Führt deinen abgeschickten Code gegen die versteckten Tests aus.</li>
      </ul>

      <h2 className="font-pixel mt-10 text-sm text-accent">5. EXTERNE AUSFÜHRUNG DEINES CODES</h2>
      <p className="mt-3">
        Damit deine Lösungen ausgewertet werden können, wird dein Python-Quellcode
        bei jeder Abgabe (Solo und Battle) an die Open-Source-Sandbox{" "}
        <strong>Piston</strong> übertragen und dort isoliert ausgeführt. Es werden
        nur der Quellcode und die nötigen Testaufrufe übermittelt – keine
        Accountdaten. Da Piston außerhalb unserer Kontrolle liegt, gilt:{" "}
        <strong>Gib in deinen Lösungen keine persönlichen Daten ein.</strong>
      </p>

      <h2 className="font-pixel mt-10 text-sm text-accent">6. SPEICHERDAUER</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5">
        <li>Account- und Spieldaten: bis zur Löschung deines Kontos</li>
        <li>Refresh-Tokens: maximal 30 Tage (bei Logout sofort gelöscht)</li>
        <li>Server-Logfiles: gemäß den Löschfristen der Hosting-Anbieter</li>
      </ul>

      <h2 className="font-pixel mt-10 text-sm text-accent">7. DEINE RECHTE</h2>
      <p className="mt-3">
        Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16),
        Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18),
        Datenübertragbarkeit (Art. 20), Widerspruch (Art. 21) sowie das Recht, dich
        bei einer Datenschutz-Aufsichtsbehörde zu beschweren (Art. 77).
      </p>
      <p className="mt-3">
        Für Auskunft, Korrekturen oder die <strong>Löschung deines Kontos</strong>{" "}
        (einschließlich aller Spieldaten) genügt eine E-Mail an{" "}
        <a className="link-pink" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
        .
      </p>

      <h2 className="font-pixel mt-10 text-sm text-accent">8. ÄNDERUNGEN DIESER ERKLÄRUNG</h2>
      <p className="mt-3">
        Wenn sich PyClash weiterentwickelt, kann sich auch diese Erklärung ändern. Es
        gilt die jeweils aktuelle Version auf dieser Seite.
      </p>
    </div>
  );
}

function EnContent() {
  return (
    <div className="panel panel-alt chamfer mt-8 p-6 text-[13px] leading-7 tracking-[0.02em] text-ink normal-case sm:p-8">
      <p>
        In short: PyClash uses <strong>no tracking, analytics or advertising
        cookies</strong> and no external trackers. We only store account data
        (username, email, password hash) and gameplay data (ELO, times, matches)
        plus the technically necessary login session.
      </p>

      <h2 className="font-pixel mt-10 text-sm text-accent">1. CONTROLLER</h2>
      <p className="mt-3">
        PyClash is operated by Simeon (
        <a
          className="link-pink"
          href="https://github.com/Simeon0605"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/Simeon0605
        </a>
        ). For all privacy matters, contact{" "}
        <a className="link-pink" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
        .
      </p>

      <h2 className="font-pixel mt-10 text-sm text-accent">2. WHAT DATA WE PROCESS</h2>
      <h3 className="mt-6 text-xs font-bold">Account (registration)</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Username and email address</li>
        <li>
          Password – stored exclusively as a bcrypt hash (12 rounds), never in plain
          text
        </li>
        <li>Account ID (random UUID), starting ELO (1000) and registration timestamp</li>
      </ul>
      <h3 className="mt-6 text-xs font-bold">Gameplay data</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>ELO points, wins/losses and your match history (opponent, task, duration)</li>
        <li>
          Solo attempts: start/end time, duration, status, best time and the code you
          last submitted
        </li>
      </ul>
      <p className="mt-3">
        Your <strong>username is publicly visible</strong> (leaderboard, matchmaking).
        Email address and password hash are not public. The legal basis for account
        and gameplay data is Art. 6(1)(b) GDPR (performance of a contract).
      </p>
      <h3 className="mt-6 text-xs font-bold">Server log files</h3>
      <p className="mt-2">
        When you visit the site, the hosting providers listed below process technical
        access data (e.g. IP address, time, requested page, browser type) in log
        files to keep the service running and to prevent abuse. Legal basis:
        Art. 6(1)(f) GDPR (legitimate interest).
      </p>

      <h2 className="font-pixel mt-10 text-sm text-accent">3. COOKIES & LOCAL STORAGE</h2>
      <p className="mt-3">
        PyClash uses only <strong>technically necessary</strong> cookies and browser
        storage so that login works. We do not use tracking, analytics or advertising
        cookies – which is why we do not ask for cookie consent (§ 25(2) No. 2
        TDDDG). The following storage is used:
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] border border-ink text-left text-[12px] leading-6">
          <thead className="bg-paper-alt">
            <tr className="border-b border-ink">
              <th className="border-r border-ink px-3 py-2">Name</th>
              <th className="border-r border-ink px-3 py-2">Type</th>
              <th className="border-r border-ink px-3 py-2">Purpose</th>
              <th className="px-3 py-2">Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-ink">
              <td className="border-r border-ink px-3 py-2 font-bold">pyclash_refresh_token</td>
              <td className="border-r border-ink px-3 py-2">Cookie (httpOnly, SameSite=Strict, Secure)</td>
              <td className="border-r border-ink px-3 py-2">Keeps you logged in and automatically issues new access tokens</td>
              <td className="px-3 py-2">30 days, deleted immediately on logout</td>
            </tr>
            <tr className="border-b border-ink">
              <td className="border-r border-ink px-3 py-2 font-bold">pyclash_access_token</td>
              <td className="border-r border-ink px-3 py-2">sessionStorage (not a cookie)</td>
              <td className="border-r border-ink px-3 py-2">Keeps your session in the current tab</td>
              <td className="px-3 py-2">until the tab is closed</td>
            </tr>
            <tr>
              <td className="border-r border-ink px-3 py-2 font-bold">pyclash_cookie_notice</td>
              <td className="border-r border-ink px-3 py-2">localStorage (not a cookie)</td>
              <td className="border-r border-ink px-3 py-2">Remembers that you acknowledged this notice</td>
              <td className="px-3 py-2">until you clear your browser data</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="font-pixel mt-10 text-sm text-accent">4. SERVICES & PROCESSORS</h2>
      <p className="mt-3">
        All transmissions run encrypted over TLS/HTTPS. With the following providers,
        data processing may take place in data centers outside the EU (mainly USA);
        the basis is each provider’s privacy commitments and standard
        contractual clauses:
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <li><strong>Vercel, Inc. (USA)</strong> — frontend hosting: serves the web app and processes technical access data in log files.</li>
        <li><strong>Render (Render.com, Inc., USA)</strong> — backend (REST API & realtime server): runs the game logic and processes technical access data in log files.</li>
        <li><strong>Supabase, Inc. (USA)</strong> — PostgreSQL database: stores accounts, gameplay data and login tokens.</li>
        <li><strong>Piston (public instance at emkc.org)</strong> — sandbox for running Python code: executes your submitted code against the hidden tests.</li>
      </ul>

      <h2 className="font-pixel mt-10 text-sm text-accent">5. EXTERNAL EXECUTION OF YOUR CODE</h2>
      <p className="mt-3">
        So your solutions can be evaluated, your Python source code is sent to the
        open-source sandbox <strong>Piston</strong> on every submission (solo and
        battle) and executed there in isolation. Only the source code and the
        necessary test calls are transmitted – no account data. Since Piston is
        outside our control, one rule applies:{" "}
        <strong>never include personal data in your solutions.</strong>
      </p>

      <h2 className="font-pixel mt-10 text-sm text-accent">6. RETENTION PERIODS</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5">
        <li>Account and gameplay data: until your account is deleted</li>
        <li>Refresh tokens: maximum 30 days (deleted immediately on logout)</li>
        <li>Server log files: according to the hosting providers’ deletion periods</li>
      </ul>

      <h2 className="font-pixel mt-10 text-sm text-accent">7. YOUR RIGHTS</h2>
      <p className="mt-3">
        You have the right of access (Art. 15 GDPR), rectification (Art. 16), erasure
        (Art. 17), restriction of processing (Art. 18), data portability (Art. 20),
        objection (Art. 21) and the right to lodge a complaint with a data protection
        supervisory authority (Art. 77).
      </p>
      <p className="mt-3">
        For access, corrections or <strong>deletion of your account</strong>{" "}
        (including all gameplay data), an email to{" "}
        <a className="link-pink" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>{" "}
        is enough.
      </p>

      <h2 className="font-pixel mt-10 text-sm text-accent">8. CHANGES TO THIS POLICY</h2>
      <p className="mt-3">
        As PyClash evolves, this policy may change as well. The current version on
        this page always applies.
      </p>
    </div>
  );
}

export default function DatenschutzPage() {
  const { lang, t } = useI18n();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
      <p className="kicker">
        <span className="sigil">✱</span> {t("privacy.kicker")}
      </p>
      <h1 className="font-pixel mt-4 text-xl text-ink">{t("privacy.title")}</h1>
      <p className="mt-2 text-[11px] tracking-[0.2em] text-ink">
        {t("privacy.updated")}
      </p>
      {lang === "en" ? <EnContent /> : <DeContent />}
    </main>
  );
}
