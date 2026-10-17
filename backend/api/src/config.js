import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
  // Neon → Dashboard → Connection String (idealerweise die "pooled"-Variante)
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
  refreshDays: Number(process.env.REFRESH_TOKEN_DAYS ?? 30),
};

if (!config.databaseUrl) {
  console.error("DATABASE_URL muss in .env gesetzt sein (Neon-Connection-String).");
  process.exit(1);
}
