import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { randomUUID } from "crypto";
import { config } from "../config.js";
import { q, isUuid } from "../lib/db.js";
import { ok, fail, asyncRoute } from "../lib/http.js";
import { requireAuth, signAccessToken } from "../middleware/auth.js";
import { registerSchema, loginSchema, passwordChangeSchema, deleteAccountSchema, parseBody } from "../middleware/validate.js";

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
  await q(
    "INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1::uuid, $2::uuid, $3)",
    [refresh, user.id, expires.toISOString()],
  );
  setRefreshCookie(res, refresh);
  return access;
}

authRouter.post(
  "/register",
  asyncRoute(async (req, res) => {
    const { username, email, password } = parseBody(registerSchema, req.body);

    const existing = await q("SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1", [email, username]);
    if (existing[0]) return fail(res, "Username oder E-Mail bereits vergeben", 400);

    const password_hash = await bcrypt.hash(password, 12);
    const rows = await q(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, elo, created_at`,
      [username, email, password_hash],
    );
    const user = rows[0];

    const access_token = await issueTokens(user, res);
    ok(res, { access_token, user }, 201);
  }),
);

authRouter.post(
  "/login",
  loginLimiter,
  asyncRoute(async (req, res) => {
    const { email, password } = parseBody(loginSchema, req.body);

    const rows = await q("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
    const user = rows[0];
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
    if (!refresh || !isUuid(refresh)) return fail(res, "Refresh-Token ungültig", 401);

    const storedRows = await q("SELECT user_id, expires_at FROM refresh_tokens WHERE token = $1::uuid", [refresh]);
    const stored = storedRows[0];
    if (!stored || new Date(stored.expires_at) < new Date()) {
      if (stored) await q("DELETE FROM refresh_tokens WHERE token = $1::uuid", [refresh]);
      return fail(res, "Refresh-Token ungültig/abgelaufen", 401);
    }

    const userRows = await q(
      "SELECT id, username, email, elo, created_at FROM users WHERE id = $1::uuid",
      [stored.user_id],
    );
    const user = userRows[0];
    if (!user) return fail(res, "User nicht gefunden", 401);

    const access_token = await issueTokens(user, res);
    ok(res, { access_token });
  }),
);

authRouter.post(
  "/logout",
  asyncRoute(async (req, res) => {
    const refresh = req.cookies?.[REFRESH_COOKIE];
    if (refresh && isUuid(refresh)) await q("DELETE FROM refresh_tokens WHERE token = $1::uuid", [refresh]);
    res.clearCookie(REFRESH_COOKIE);
    ok(res, { ok: true });
  }),
);

authRouter.get("/me", requireAuth, (req, res) => ok(res, { user: req.user }));

authRouter.put(
  "/password",
  requireAuth,
  asyncRoute(async (req, res) => {
    const { current_password, new_password } = parseBody(passwordChangeSchema, req.body);

    const storedRows = await q("SELECT password_hash FROM users WHERE id = $1::uuid", [req.user.id]);
    const stored = storedRows[0];
    if (!stored || !(await bcrypt.compare(current_password, stored.password_hash))) {
      return fail(res, "Aktuelles Passwort ist falsch", 401);
    }

    const password_hash = await bcrypt.hash(new_password, 12);
    await q("UPDATE users SET password_hash = $2 WHERE id = $1::uuid", [req.user.id, password_hash]);

    // Alle anderen Refresh-Tokens widerrufen, aktuelle Sitzung behalten
    const currentRefresh = req.cookies?.[REFRESH_COOKIE];
    if (currentRefresh) {
      await q(
        "DELETE FROM refresh_tokens WHERE user_id = $1::uuid AND token <> $2::uuid",
        [req.user.id, currentRefresh],
      );
    }

    // Frische Tokens für diese Sitzung ausstellen
    const access_token = await issueTokens(req.user, res);
    ok(res, { access_token });
  }),
);

authRouter.delete(
  "/account",
  requireAuth,
  asyncRoute(async (req, res) => {
    const { password } = parseBody(deleteAccountSchema, req.body);

    const storedRows = await q("SELECT password_hash FROM users WHERE id = $1::uuid", [req.user.id]);
    const stored = storedRows[0];
    if (!stored || !(await bcrypt.compare(password, stored.password_hash))) {
      return fail(res, "Passwort falsch – Konto wurde nicht gelöscht", 401);
    }

    await q("DELETE FROM refresh_tokens WHERE user_id = $1::uuid", [req.user.id]);
    // Cascade löscht solo_attempts, matches, battle_queue mit
    await q("DELETE FROM users WHERE id = $1::uuid", [req.user.id]);

    res.clearCookie(REFRESH_COOKIE);
    ok(res, { deleted: true });
  }),
);

// fuer JWT-Pruefung im Realtime-Server
export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}
