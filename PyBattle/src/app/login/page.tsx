"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loginSchema } from "@/lib/schemas";
import { useAuth } from "@/components/auth-provider";
import { Panel } from "@/components/ui";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(form: FormData) {
    setError(null);
    const parsed = loginSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Ungültige Eingabe");
      return;
    }
    setPending(true);
    const err = await login(parsed.data.email, parsed.data.password);
    setPending(false);
    if (err) {
      setError(err);
      return;
    }
    router.push("/problems");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <Panel className="chamfer p-8">
        <p className="kicker">
          <span className="sigil">✱</span> LOGIN / TOKEN / FLOW
        </p>
        <h1 className="font-pixel mt-4 text-xl text-ink">LOGIN</h1>
        <p className="mt-3 text-[11px] tracking-[0.15em] text-ink">
          Access Token + Refresh-Flow, bereit für die echte API.
        </p>
        <form
          className="mt-8 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit(new FormData(e.currentTarget));
          }}
        >
          <label className="block text-xs">
            <span className="tracking-[0.2em] text-ink">E-MAIL</span>
            <input
              name="email"
              type="email"
              className="field mt-2"
              required
              aria-describedby={error ? "login-error" : undefined}
            />
          </label>
          <label className="block text-xs">
            <span className="tracking-[0.2em] text-ink">PASSWORT</span>
            <input
              name="password"
              type="password"
              className="field mt-2"
              required
            />
          </label>
          <p id="login-error" aria-live="assertive">
            {error ? <span className="block text-xs text-signal">{error}</span> : null}
          </p>
          <button disabled={pending} className="btn btn-pink w-full">
            {pending ? "PRÜFE…" : "EINLOGGEN_"}
          </button>
        </form>
        <p className="mt-6 text-[11px] tracking-[0.15em] text-ink">
          NOCH KEIN ACCOUNT?{" "}
          <Link href="/register" className="link-pink">
            REGISTRIEREN
          </Link>
        </p>
      </Panel>
    </main>
  );
}
