// Smoke-Test für die Neon-Datenbank: prüft Tabellen und Seed-Stand.
// Ausführen: npm run check:db  (benötigt DATABASE_URL in backend/api/.env)
import "dotenv/config";
import { pool, q } from "../src/lib/db.js";

const TABLES = [
  "users",
  "problems",
  "test_cases",
  "solo_attempts",
  "matches",
  "battle_queue",
  "refresh_tokens",
];

let ok = true;

for (const table of TABLES) {
  const rows = await q("SELECT to_regclass($1) AS reg", [`public.${table}`]);
  const exists = Boolean(rows[0]?.reg);
  console.log(`${exists ? "OK    " : "FEHLT "} Tabelle ${table}`);
  if (!exists) ok = false;
}

if (ok) {
  const problems = await q("SELECT COUNT(*)::int AS count FROM problems");
  const testCases = await q("SELECT COUNT(*)::int AS count FROM test_cases");
  const problemCount = problems[0]?.count ?? 0;
  const testCaseCount = testCases[0]?.count ?? 0;
  console.log(`Probleme: ${problemCount} (erwartet: 25)`);
  console.log(`Test-Cases: ${testCaseCount}`);
  if (problemCount < 25) ok = false;
}

console.log(
  ok
    ? "\n✓ Datenbank bereit für PyClash."
    : "\n✗ Datenbank unvollständig – bitte db/schema.sql ausführen.",
);

await pool.end();
process.exit(ok ? 0 : 1);
