import "dotenv/config";
import jwt from "jsonwebtoken";

export const config = {
  port: Number(process.env.PORT ?? 4001),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
  // Neon → Dashboard → Connection String (idealerweise die "pooled"-Variante)
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret",
  timeLimitMs: 10 * 60 * 1000,
  eloRange: 200,
  eloRangeGrowthPerSec: 10,
};

if (!config.databaseUrl) {
  console.error("DATABASE_URL muss in .env gesetzt sein (Neon-Connection-String).");
  process.exit(1);
}

export function verifyToken(token) {
  const payload = jwt.verify(token, config.jwtSecret);
  return { id: payload.id, username: payload.username };
}
