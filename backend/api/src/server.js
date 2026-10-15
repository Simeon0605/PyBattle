import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { errorHandler } from "./lib/http.js";
import { authRouter } from "./routes/auth.routes.js";
import { problemsRouter } from "./routes/problems.routes.js";
import { soloRouter } from "./routes/solo.routes.js";
import { battleRouter, leaderboardRouter } from "./routes/battle.routes.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false }));

app.get("/api/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));

app.use("/api/auth", authRouter);
app.use("/api/problems", problemsRouter);
app.use("/api/solo", soloRouter);
app.use("/api/battle", battleRouter);
app.use("/api/leaderboard", leaderboardRouter);

app.use((_req, res) => res.status(404).json({ success: false, error: "Endpunkt nicht gefunden" }));
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`PyClash API läuft auf http://localhost:${config.port}`);
});
