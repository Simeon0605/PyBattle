"use client";

import { useState } from "react";
import { Protected } from "@/components/protected";
import { useAuth } from "@/components/auth-provider";
import { useI18n, type Lang } from "@/lib/i18n";
import { api } from "@/lib/api";
import { setAccessToken } from "@/lib/token";

function SettingsContent() {
  const { clearSession } = useAuth();
  const { lang, setLang, t } = useI18n();

  // Passwort ändern
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwPending, setPwPending] = useState(false);

  // Konto löschen
  const [delPassword, setDelPassword] = useState("");
  const [armed, setArmed] = useState(false);
  const [delPending, setDelPending] = useState(false);
  const [delError, setDelError] = useState<string | null>(null);

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);
    if (next !== confirm) {
      setPwError(t("settings.password.mismatch"));
      return;
    }
    if (next.length < 8) {
      setPwError(t("settings.password.tooshort"));
      return;
    }
    setPwPending(true);
    const res = await api.put<{ access_token: string }>("/api/auth/password", {
      current_password: current,
      new_password: next,
    });
    setPwPending(false);
    if (!res.success) {
      setPwError(res.error);
      return;
    }
    setAccessToken(res.data.access_token);
    setPwSuccess(true);
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  async function deleteAccount() {
    if (!armed) {
      setArmed(true);
      return;
    }
    setDelPending(true);
    setDelError(null);
    const res = await api.del<{ deleted: boolean }>("/api/auth/account", {
      password: delPassword,
    });
    setDelPending(false);
    if (!res.success) {
      setDelError(res.error);
      setArmed(false);
      return;
    }
    // Vollständiger Reload: verhindert den Protected-Redirect-Race und
    // räumt sämtlichen Client-State (SessionStorage etc.) auf.
    clearSession();
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/");
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <p className="kicker">
        <span className="sigil">✱</span> {t("settings.kicker")}
      </p>
      <h1 className="font-pixel mt-4 text-2xl text-ink">{t("settings.title")}</h1>

      {/* Sprache */}
      <section className="panel mt-8 p-6 sm:p-8" aria-labelledby="lang-heading">
        <h2 id="lang-heading" className="font-pixel text-sm text-ink">
          {t("settings.language.title")}
        </h2>
        <p className="mt-3 text-[11px] leading-5 tracking-[0.15em] text-ink opacity-70">
          {t("settings.language.desc")}
        </p>
        <div className="mt-4 inline-flex border border-ink" role="group" aria-label="Sprache / Language">
          {(["de", "en"] as const).map((l: Lang) => (
            <button
              key={l}
              type="button"
              aria-pressed={lang === l}
              onClick={() => setLang(l)}
              className={`px-4 py-2 text-xs tracking-[0.2em] ${
                lang === l
                  ? "bg-accent text-white"
                  : "bg-paper text-ink hover:bg-accent hover:text-white"
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      {/* Passwort */}
      <section className="panel mt-6 p-6 sm:p-8" aria-labelledby="pw-heading">
        <h2 id="pw-heading" className="font-pixel text-sm text-ink">
          {t("settings.password.title")}
        </h2>
        <p className="mt-3 text-[11px] leading-5 tracking-[0.15em] text-ink opacity-70">
          {t("settings.password.desc")}
        </p>
        <form
          className="mt-6 space-y-5"
          onSubmit={(e) => void changePassword(e)}
        >
          <label className="block text-xs">
            <span className="tracking-[0.2em] text-ink">
              {t("settings.password.current")}
            </span>
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="field mt-2"
              autoComplete="current-password"
              required
            />
          </label>
          <label className="block text-xs">
            <span className="tracking-[0.2em] text-ink">
              {t("settings.password.new")}
            </span>
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className="field mt-2"
              autoComplete="new-password"
              required
            />
          </label>
          <label className="block text-xs">
            <span className="tracking-[0.2em] text-ink">
              {t("settings.password.confirm")}
            </span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="field mt-2"
              autoComplete="new-password"
              required
            />
          </label>
          <p aria-live="assertive">
            {pwError ? <span className="block text-xs text-signal">{pwError}</span> : null}
            {pwSuccess ? (
              <span className="block text-xs text-accent">
                {t("settings.password.success")}
              </span>
            ) : null}
          </p>
          <button disabled={pwPending} className="btn btn-pink w-full sm:w-auto">
            {pwPending ? t("settings.password.saving") : t("settings.password.save")}
          </button>
        </form>
      </section>

      {/* Konto löschen */}
      <section
        className="mt-6 border border-signal bg-paper p-6 sm:p-8"
        aria-labelledby="del-heading"
      >
        <h2 id="del-heading" className="font-pixel text-sm text-signal">
          {t("settings.delete.title")}
        </h2>
        <p className="mt-3 text-[11px] leading-5 tracking-[0.15em] text-ink">
          {t("settings.delete.desc")}
        </p>
        <div className="mt-6 space-y-5">
          <label className="block text-xs">
            <span className="tracking-[0.2em] text-ink">
              {t("settings.delete.password")}
            </span>
            <input
              type="password"
              value={delPassword}
              onChange={(e) => {
                setDelPassword(e.target.value);
                setArmed(false);
              }}
              className="field mt-2"
              autoComplete="current-password"
              required
            />
          </label>
          {delError ? (
            <p aria-live="assertive">
              <span className="block text-xs text-signal">{delError}</span>
            </p>
          ) : null}
          <button
            type="button"
            disabled={!delPassword || delPending}
            onClick={() => void deleteAccount()}
            className={`btn w-full ${
              armed ? "bg-signal text-white" : "btn-black"
            } sm:w-auto`}
          >
            {delPending
              ? t("settings.delete.deleting")
              : armed
                ? t("settings.delete.armed")
                : t("settings.delete.button")}
          </button>
        </div>
      </section>
    </main>
  );
}

export default function SettingsPage() {
  return (
    <Protected>
      <SettingsContent />
    </Protected>
  );
}
