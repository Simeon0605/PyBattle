import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { randomUUID } from "crypto";
import { supabase, config } from "../config.js";
import { ok, fail, asyncRoute } from "../lib/http.js";
import { requireAuth, signAccessToken } from "../middleware/auth.js";
import { registerSchema, loginSchema, parseBody } from "../middleware/validate.js";

export const authRouter = Router();

const REFRESH_COOKIE = "pyclash_refresh_token";
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Zu viele Login-Versuche, bitte warte eine Minute" },
});

const publicUser = (u) => ({ id: u.id, username: u.username, email: u.email, elo: u.elo, created_at: u.created_at });

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: config.refreshDays * 24 * 60 * 60 * 1000,
  });
}

async function issueTokens(user, res) {
  const access = signAccessToken(user);
  const refresh = randomUUID();
  const expires = new Date(Date.now() + config.refreshDays * 24 * 60 * 60 * 1000);
  const { error } = await supabase
    .from("refresh_tokens")
    .insert({ token: refresh, user_id: user.id, expires_at: expires.toISOString() });
  if (error) throw new Error("Token-Erstellung fehlgeschlagen");
  setRefreshCookie(res, refresh);
  return access;
}

authRouter.post(
  "/register",
  asyncRoute(async (req, res) => {
    const { username, email, password } = parseBody(registerSchema, req.body);

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .or(`email.eq.${email},username.eq.${username}`)
      .maybeSingle();
    if (existing) return fail(res, "Username oder E-Mail bereits vergeben", 400);

    const password_hash = await bcrypt.hash(password, 12);
    const { data: user, error } = await supabase
      .from("users")
      .insert({ username, email, password_hash })
      .select("id, username, email, elo, created_at")
      .single();
    if (error) return fail(res, "Registrierung fehlgeschlagen", 500);

    const access_token = await issueTokens(user, res);
    ok(res, { access_token, user }, 201);
  }),
);

authRouter.post(
  "/login",
  loginLimiter,
  asyncRoute(async (req, res) => {
    const { email, password } = parseBody(loginSchema, req.body);

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return fail(res, "E-Mail oder Passwort falsch", 401);
    }

    const access_token = await issueTokens(user, res);
    ok(res, { access_token, user: publicUser(user) });
  }),
);

authRouter.post(
  "/refresh",
  asyncRoute(async (req, res) => {
    const refresh = req.cookies?.[REFRESH_COOKIE];
    if (!refresh) return fail(res, "Refresh-Token ungültig", 401);

    const { data: stored } = await supabase
      .from("refresh_tokens")
      .select("user_id, expires_at")
      .eq("token", refresh)
      .maybeSingle();
    if (!stored || new Date(stored.expires_at) < new Date()) {
      if (stored) await supabase.from("refresh_tokens").delete().eq("token", refresh);
      return fail(res, "Refresh-Token ungültig/abgelaufen", 401);
    }

    const { data: user } = await supabase
      .from("users")
      .select("id, username, email, elo, created_at")
      .eq("id", stored.user_id)
      .single();
    if (!user) return fail(res, "User nicht gefunden", 401);

    const access_token = await issueTokens(user, res);
    ok(res, { access_token });
  }),
);

authRouter.post(
  "/logout",
  asyncRoute(async (req, res) => {
    const refresh = req.cookies?.[REFRESH_COOKIE];
    if (refresh) await supabase.from("refresh_tokens").delete().eq("token", refresh);
    res.clearCookie(REFRESH_COOKIE);
    ok(res, { ok: true });
  }),
);

authRouter.get("/me", requireAuth, (req, res) => ok(res, { user: req.user }));

// fuer JWT-Pruefung im Realtime-Server
export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}
