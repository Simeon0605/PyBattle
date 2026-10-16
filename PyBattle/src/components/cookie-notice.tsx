"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useI18n } from "@/lib/i18n";

const NOTICE_KEY = "pyclash_cookie_notice";

let noticeListeners: Array<() => void> = [];
let sessionAcknowledged = false;

function subscribeNotice(cb: () => void) {
  noticeListeners.push(cb);
  window.addEventListener("storage", cb);
  return () => {
    noticeListeners = noticeListeners.filter((l) => l !== cb);
    window.removeEventListener("storage", cb);
  };
}

function isAcknowledged(): boolean {
  if (sessionAcknowledged) return true;
  try {
    return localStorage.getItem(NOTICE_KEY) === "1";
  } catch {
    return sessionAcknowledged;
  }
}

function acknowledgeNotice() {
  sessionAcknowledged = true;
  try {
    localStorage.setItem(NOTICE_KEY, "1");
  } catch {
    // Speicher nicht verfügbar – Hinweis wird nur für diese Sitzung ausgeblendet
  }
  for (const listener of noticeListeners) listener();
}

export function CookieNotice() {
  const { t } = useI18n();
  // Server-Snapshot true: Banner taucht erst nach Hydration auf (kein SSR-Mismatch)
  const acknowledged = useSyncExternalStore(subscribeNotice, isAcknowledged, () => true);

  if (acknowledged) return null;

  return (
    <aside
      role="region"
      aria-label="Cookie-Hinweis"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-ink bg-paper-alt"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[10px] leading-5 tracking-[0.2em] text-ink">
          {t("cookie.notice")}
          <Link href="/datenschutz" className="link-pink">
            {t("footer.privacy")}
          </Link>
        </p>
        <button onClick={acknowledgeNotice} className="btn btn-black shrink-0 px-5 py-2">
          {t("cookie.ok")}
        </button>
      </div>
    </aside>
  );
}
