import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { q, isUuid } from "../lib/db.js";
import { fail } from "../lib/http.js";

export function signAccessToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return fail(res, "Nicht eingeloggt", 401);
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (!isUuid(payload.id)) return fail(res, "User nicht gefunden", 401);
    const rows = await q(
      "SELECT id, username, email, elo, created_at FROM users WHERE id = $1::uuid",
      [payload.id],
    );
    const user = rows[0];
    if (!user) return fail(res, "User nicht gefunden", 401);
    req.user = user;
    next();
  } catch {
    return fail(res, "Token ungültig/abgelaufen", 401);
  }
}

export function optionalAuth(req, _res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try {
      const id = jwt.verify(token, config.jwtSecret).id;
      req.user = isUuid(id) ? { id } : null;
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}
