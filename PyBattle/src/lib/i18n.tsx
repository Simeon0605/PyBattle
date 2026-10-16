"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";

export type Lang = "de" | "en";

const de = {
  "nav.problems": "PROBLEME",
  "nav.battle": "BATTLE",
  "nav.league": "LIGA",
  "nav.login": "LOGIN",
  "nav.register": "REGISTRIEREN_",
  "nav.logout": "LOGOUT",
  "nav.settings": "EINSTELLUNGEN",
  "nav.menu.open": "Menü öffnen",
  "nav.menu.close": "Menü schließen",
  "footer.problems": "PROBLEME",
  "footer.battle": "BATTLE",
  "footer.league": "LIGA",
  "footer.privacy": "DATENSCHUTZ",
  "footer.register": "ANMELDEN",
  "cookie.notice":
    "HINWEIS: PYCLASH SPEICHERT NUR TECHNISCH NOTWENDIGE COOKIES FÜR DEN LOGIN – KEINE TRACKING- ODER WERBECOOKIES. DETAILS IN DER ",
  "cookie.ok": "ALLES KLAR_",
  "privacy.kicker": "RECHTLICHES / VERTRAUEN",
  "privacy.title": "DATENSCHUTZERKLÄRUNG",
  "privacy.updated": "STAND: OKTOBER 2026",
  "settings.kicker": "EINSTELLUNGEN / ACCOUNT",
  "settings.title": "ACCOUNT VERWALTEN",
  "settings.language.title": "SPRACHE",
  "settings.language.desc":
    "Übersetzt Navigation, Footer, Cookie-Hinweis, die Datenschutzerklärung und diese Seite.",
  "settings.password.title": "PASSWORT ÄNDERN",
  "settings.password.desc":
    "Andere Geräte werden abgemeldet, deine aktuelle Sitzung bleibt aktiv.",
  "settings.password.current": "AKTUELLES PASSWORT",
  "settings.password.new": "NEUES PASSWORT",
  "settings.password.confirm": "NEUES PASSWORT BESTÄTIGEN",
  "settings.password.save": "SPEICHERN_",
  "settings.password.saving": "SPEICHERE…",
  "settings.password.success": "PASSWORT GEÄNDERT. ✱",
  "settings.password.mismatch": "Die neuen Passwörter stimmen nicht überein.",
  "settings.password.tooshort": "Das neue Passwort braucht mindestens 8 Zeichen.",
  "settings.delete.title": "GEFAHRENZONE / KONTO LÖSCHEN",
  "settings.delete.desc":
    "Löscht deinen Account unwiderruflich: Profil, ELO, Solo-Statistiken, Bestzeiten und Match-Historie. Diese Aktion kann nicht rückgängig gemacht werden.",
  "settings.delete.password": "PASSWORT ZUR BESTÄTIGUNG",
  "settings.delete.button": "KONTO LÖSCHEN_",
  "settings.delete.armed": "WIRKLICH? ENDGÜLTIG LÖSCHEN_",
  "settings.delete.deleting": "LÖSCHE…",
} as const;

const en: Record<keyof typeof de, string> = {
  "nav.problems": "PROBLEMS",
  "nav.battle": "BATTLE",
  "nav.league": "LEAGUE",
  "nav.login": "LOGIN",
  "nav.register": "REGISTER_",
  "nav.logout": "LOGOUT",
  "nav.settings": "SETTINGS",
  "nav.menu.open": "Open menu",
  "nav.menu.close": "Close menu",
  "footer.problems": "PROBLEMS",
  "footer.battle": "BATTLE",
  "footer.league": "LEAGUE",
  "footer.privacy": "PRIVACY",
  "footer.register": "SIGN UP",
  "cookie.notice":
    "NOTE: PYCLASH ONLY STORES TECHNICALLY NECESSARY COOKIES FOR LOGIN – NO TRACKING OR AD COOKIES. SEE THE ",
  "cookie.ok": "GOT IT_",
  "privacy.kicker": "LEGAL / TRUST",
  "privacy.title": "PRIVACY POLICY",
  "privacy.updated": "LAST UPDATED: OCTOBER 2026",
  "settings.kicker": "SETTINGS / ACCOUNT",
  "settings.title": "MANAGE ACCOUNT",
  "settings.language.title": "LANGUAGE",
  "settings.language.desc":
    "Applies to navigation, footer, cookie notice, the privacy policy and this page.",
  "settings.password.title": "CHANGE PASSWORD",
  "settings.password.desc":
    "Other devices will be logged out; your current session stays active.",
  "settings.password.current": "CURRENT PASSWORD",
  "settings.password.new": "NEW PASSWORD",
  "settings.password.confirm": "CONFIRM NEW PASSWORD",
  "settings.password.save": "SAVE_",
  "settings.password.saving": "SAVING…",
  "settings.password.success": "PASSWORD CHANGED. ✱",
  "settings.password.mismatch": "The new passwords do not match.",
  "settings.password.tooshort": "The new password needs at least 8 characters.",
  "settings.delete.title": "DANGER ZONE / DELETE ACCOUNT",
  "settings.delete.desc":
    "Permanently deletes your account: profile, ELO, solo stats, best times and match history. This cannot be undone.",
  "settings.delete.password": "CONFIRM WITH PASSWORD",
  "settings.delete.button": "DELETE ACCOUNT_",
  "settings.delete.armed": "REALLY? DELETE PERMANENTLY_",
  "settings.delete.deleting": "DELETING…",
};

export type TKey = keyof typeof de;

const dictionaries: Record<Lang, Record<TKey, string>> = { de, en };

const LANG_KEY = "pyclash_lang";

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

let langListeners: Array<() => void> = [];

function subscribeLang(cb: () => void) {
  langListeners.push(cb);
  window.addEventListener("storage", cb);
  return () => {
    langListeners = langListeners.filter((l) => l !== cb);
    window.removeEventListener("storage", cb);
  };
}

function readLang(): Lang {
  try {
    return localStorage.getItem(LANG_KEY) === "en" ? "en" : "de";
  } catch {
    return "de";
  }
}

function writeLang(next: Lang) {
  try {
    localStorage.setItem(LANG_KEY, next);
  } catch {
    // Speicher nicht verfügbar – Sprache nur für diese Sitzung
  }
  for (const listener of langListeners) listener();
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Server-Snapshot "de": nach der Hydration übernimmt der gespeicherte Wert
  const lang = useSyncExternalStore<Lang>(subscribeLang, readLang, () => "de");

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang: writeLang,
      t: (key) => dictionaries[lang][key] ?? dictionaries.de[key],
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}
