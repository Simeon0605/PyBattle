import jwt from "jsonwebtoken";
import { config, supabase } from "../config.js";
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
    const { data, error } = await supabase
      .from("users")
      .select("id, username, email, elo, created_at")
      .eq("id", payload.id)
      .single();
    if (error || !data) return fail(res, "User nicht gefunden", 401);
    req.user = data;
    next();
  } catch {
    return fail(res, "Token ungültig/abgelaufen", 401);
  }
}

export function optionalAuth(req, _res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try {
      req.user = { id: jwt.verify(token, config.jwtSecret).id };
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
}
