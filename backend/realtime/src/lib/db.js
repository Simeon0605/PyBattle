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

export async function closePool() {
  await pool.end();
}
