import pg from "pg";
import { config } from "../config.js";

// Neon/Postgres-Verbindung über pg-Pool.
// Der Connection String kommt aus DATABASE_URL (Neon, "pooled"-Variante).
export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 10,
});

pool.on("error", (err) => console.error("Postgres Pool-Fehler:", err));

/** Kleiner Query-Helper: liefert direkt die Zeilen zurück. */
export function q(text, params = []) {
  return pool.query(text, params).then((r) => r.rows);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** UUID-Format prüfen, bevor ein Wert als uuid-Parameter an Postgres geht. */
export function isUuid(value) {
  return typeof value === "string" && UUID_RE.test(value);
}

export async function closePool() {
  await pool.end();
}
