import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

export const config = {
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
  refreshDays: Number(process.env.REFRESH_TOKEN_DAYS ?? 30),
};

if (!config.supabaseUrl || !config.supabaseKey) {
  console.error("SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen in .env gesetzt sein.");
  process.exit(1);
}

export const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
  auth: { persistSession: false },
});
