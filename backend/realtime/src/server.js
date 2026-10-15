import { Server } from "socket.io";
import { config, supabase, verifyToken } from "./config.js";
import { BattleManager } from "./battle-manager.js";
import { runTests } from "./services/piston.js";
import { applyElo } from "./services/elo.js";

const io = new Server(config.port, {
  cors: { origin: config.clientOrigin, credentials: true },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token ?? socket.handshake.headers.authorization?.split(" ")[1];
  if (!token) return next(new Error("Nicht eingeloggt"));
  try {
    socket.user = verifyToken(token);
    next();
  } catch {
    next(new Error("Token ungültig/abgelaufen"));
  }
});

const manager = new BattleManager(supabase, config, { runTests, applyElo });

io.on("connection", (socket) => {
  socket.emit("connected", { user_id: socket.user.id });

  socket.on("queue:join", async (cb) => {
    try {
      const { data: user } = await supabase
        .from("users")
        .select("id, username, elo")
        .eq("id", socket.user.id)
        .single();
      if (!user) return cb?.({ success: false, error: "User nicht gefunden" });

      const result = await manager.enqueue(socket, user);
      if (result.matched) {
        for (const player of Object.values(result.match.players)) {
          player.socket.emit("battle:start", result.match.publicFor(player.id));
        }
      }
      cb?.({ success: true, data: { matched: result.matched } });
    } catch (err) {
      console.error(err);
      cb?.({ success: false, error: "Matchmaking fehlgeschlagen" });
    }
  });

  socket.on("queue:leave", () => manager.removeFromQueue(socket.user.id));

  socket.on("battle:submit", async ({ code }, cb) => {
    try {
      const result = await manager.submit(socket.user.id, code);
      cb?.({ success: !result.error, ...(result.error ? { error: result.error } : { data: result }) });
    } catch (err) {
      console.error(err);
      cb?.({ success: false, error: "Auswertung fehlgeschlagen" });
    }
  });

  socket.on("disconnect", () => {
    manager.leave(socket.user.id).catch(console.error);
  });
});

console.log(`PyClash Realtime-Server läuft auf Port ${config.port}`);
