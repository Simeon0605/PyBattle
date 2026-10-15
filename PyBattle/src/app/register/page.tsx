"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerSchema } from "@/lib/schemas";
import { useAuth } from "@/components/auth-provider";
import { Panel } from "@/components/ui";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(form: FormData) {
    setError(null);
    const parsed = registerSchema.safeParse({
      username: form.get("username"),
      email: form.get("email"),
      password: form.get("password"),
      confirm: form.get("confirm"),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Ungültige Eingabe");
      return;
    }
    setPending(true);
    const err = await register(
      parsed.data.username,
      parsed.data.email,
      parsed.data.password
    );
    setPending(false);
    if (err) {
      setError(err);
      return;
    }
    router.push("/problems");
  }

  const fields = [
    { name: "username", label: "USERNAME", type: "text" },
    { name: "email", label: "E-MAIL", type: "email" },
    { name: "password", label: "PASSWORT", type: "password" },
    { name: "confirm", label: "PASSWORT BESTÄTIGEN", type: "password" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <Panel className="chamfer p-8">
        <p className="kicker">
          <span className="sigil">✱</span> REGISTER / SEED / 1000 ELO
        </p>
        <h1 className="font-pixel mt-4 text-xl text-ink">ACCOUNT ERSTELLEN</h1>
        <p className="mt-3 text-[11px] tracking-[0.15em] text-ink">
          Start-ELO 1000. Passwort wird später serverseitig gehasht.
        </p>
        <form
          className="mt-8 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit(new FormData(e.currentTarget));
          }}
        >
          {fields.map((f) => (
            <label key={f.name} className="block text-xs">
              <span className="tracking-[0.2em] text-ink">{f.label}</span>
              <input name={f.name} type={f.type} className="field mt-2" required />
            </label>
          ))}
          <p id="register-error" aria-live="assertive">
            {error ? <span className="block text-xs text-signal">{error}</span> : null}
          </p>
          <button disabled={pending} className="btn btn-pink w-full">
            {pending ? "ERSTELLE…" : "REGISTRIEREN_"}
          </button>
        </form>
        <p className="mt-6 text-[11px] tracking-[0.15em] text-ink">
          SCHON DABEI?{" "}
          <Link href="/login" className="link-pink">
            LOGIN
          </Link>
        </p>
      </Panel>
    </main>
  );
}
