import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

export const config = {
  port: Number(process.env.PORT ?? 4001),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret",
  timeLimitMs: 10 * 60 * 1000,
  eloRange: 200,
  eloRangeGrowthPerSec: 10,
};

if (!config.supabaseUrl || !config.supabaseKey) {
  console.error("SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen in .env gesetzt sein.");
  process.exit(1);
}

export const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
  auth: { persistSession: false },
});

export function verifyToken(token) {
  const payload = jwt.verify(token, config.jwtSecret);
  return { id: payload.id, username: payload.username };
}
