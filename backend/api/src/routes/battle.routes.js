import { Router } from "express";
import { q, isUuid } from "../lib/db.js";
import { ok, fail, asyncRoute } from "../lib/http.js";
import { requireAuth } from "../middleware/auth.js";
import { applyElo } from "../services/elo.js";

export const battleRouter = Router();

battleRouter.use(requireAuth);

battleRouter.post(
  "/queue",
  asyncRoute(async (req, res) => {
    await q(
      `INSERT INTO battle_queue (user_id, joined_at, elo_at_join)
       VALUES ($1::uuid, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
         SET joined_at = EXCLUDED.joined_at, elo_at_join = EXCLUDED.elo_at_join`,
      [req.user.id, new Date().toISOString(), req.user.elo],
    );

    const countRows = await q("SELECT COUNT(*)::int AS count FROM battle_queue");
    ok(res, { queued: true, players_waiting: countRows[0]?.count ?? 1 });
  }),
);

battleRouter.get(
  "/history",
  asyncRoute(async (req, res) => {
    const uid = req.user.id;
    const matches = await q(
      `SELECT * FROM matches
       WHERE player1_id = $1::uuid OR player2_id = $1::uuid
       ORDER BY finished_at DESC
       LIMIT 50`,
      [uid],
    );

    const opponentIds = matches.map((m) => (m.player1_id === uid ? m.player2_id : m.player1_id));
    const opponents = opponentIds.length
      ? await q("SELECT id, username FROM users WHERE id = ANY($1::uuid[])", [opponentIds])
      : [];
    const nameMap = new Map(opponents.map((u) => [u.id, u.username]));
    const problemIds = [...new Set(matches.map((m) => m.problem_id).filter(Boolean))];
    const problems = problemIds.length
      ? await q("SELECT id, title FROM problems WHERE id = ANY($1::uuid[])", [problemIds])
      : [];
    const titleMap = new Map(problems.map((p) => [p.id, p.title]));

    ok(res, matches.map((m) => {
      const isP1 = m.player1_id === uid;
      return {
        id: m.id,
        opponent: nameMap.get(isP1 ? m.player2_id : m.player1_id) ?? "Unbekannt",
        problem_title: m.problem_id ? titleMap.get(m.problem_id) ?? "Unbekannt" : "Unbekannt",
        result: m.winner_id === uid ? "win" : "loss",
        duration_ms: m.duration_ms ?? 0,
        elo_change: isP1 ? m.player1_elo_change : m.player2_elo_change,
        finished_at: m.finished_at ?? m.created_at,
      };
    }));
  }),
);

battleRouter.post(
  "/finish",
  asyncRoute(async (req, res) => {
    const { match_id } = req.body ?? {};
    if (!match_id || !isUuid(match_id)) return fail(res, "match_id erforderlich", 400);

    const matchRows = await q("SELECT * FROM matches WHERE id = $1::uuid", [match_id]);
    const match = matchRows[0];
    if (!match) return fail(res, "Match nicht gefunden", 404);
    if (match.winner_id) return fail(res, "Match bereits abgeschlossen", 400);
    if (match.player1_id !== req.user.id && match.player2_id !== req.user.id) {
      return fail(res, "Nicht Teilnehmer des Matches", 403);
    }

    const userRows = await q("SELECT id, elo FROM users WHERE id = ANY($1::uuid[])", [
      [match.player1_id, match.player2_id],
    ]);
    const p1 = userRows.find((u) => u.id === match.player1_id);
    const p2 = userRows.find((u) => u.id === match.player2_id);
    const { player1_elo_change, player2_elo_change, player1_new_elo, player2_new_elo } = applyElo(p1, p2, req.user.id);

    await q("UPDATE users SET elo = $2 WHERE id = $1::uuid", [p1.id, player1_new_elo]);
    await q("UPDATE users SET elo = $2 WHERE id = $1::uuid", [p2.id, player2_new_elo]);
    await q(
      `UPDATE matches
       SET winner_id = $2::uuid, finished_at = $3, duration_ms = $4,
           player1_elo_change = $5, player2_elo_change = $6
       WHERE id = $1::uuid`,
      [match_id, req.user.id, new Date().toISOString(), Date.now() - new Date(match.started_at).getTime(), player1_elo_change, player2_elo_change],
    );
    await q("DELETE FROM battle_queue WHERE user_id = ANY($1::uuid[])", [[p1.id, p2.id]]);

    ok(res, { winner_id: req.user.id, player1_elo_change, player2_elo_change });
  }),
);

battleRouter.post(
  "/forfeit",
  asyncRoute(async (req, res) => {
    const { match_id } = req.body ?? {};
    if (!match_id || !isUuid(match_id)) return fail(res, "match_id erforderlich", 400);

    const matchRows = await q("SELECT * FROM matches WHERE id = $1::uuid", [match_id]);
    const match = matchRows[0];
    if (!match) return fail(res, "Match nicht gefunden", 404);
    if (match.winner_id) return fail(res, "Match bereits abgeschlossen", 400);
    if (match.player1_id !== req.user.id && match.player2_id !== req.user.id) {
      return fail(res, "Nicht Teilnehmer des Matches", 403);
    }

    // Aufgeben = automatische Niederlage, Sieger ist der Gegner
    const winnerId = match.player1_id === req.user.id ? match.player2_id : match.player1_id;
    const userRows = await q("SELECT id, elo FROM users WHERE id = ANY($1::uuid[])", [
      [match.player1_id, match.player2_id],
    ]);
    const p1 = userRows.find((u) => u.id === match.player1_id);
    const p2 = userRows.find((u) => u.id === match.player2_id);
    const { player1_elo_change, player2_elo_change, player1_new_elo, player2_new_elo } = applyElo(p1, p2, winnerId);

    await q("UPDATE users SET elo = $2 WHERE id = $1::uuid", [p1.id, player1_new_elo]);
    await q("UPDATE users SET elo = $2 WHERE id = $1::uuid", [p2.id, player2_new_elo]);
    await q(
      `UPDATE matches
       SET winner_id = $2::uuid, finished_at = $3, duration_ms = $4,
           player1_elo_change = $5, player2_elo_change = $6
       WHERE id = $1::uuid`,
      [match_id, winnerId, new Date().toISOString(), Date.now() - new Date(match.started_at).getTime(), player1_elo_change, player2_elo_change],
    );
    await q("DELETE FROM battle_queue WHERE user_id = ANY($1::uuid[])", [[p1.id, p2.id]]);

    ok(res, {
      forfeited: true,
      winner_id: winnerId,
      elo_change: req.user.id === p1.id ? player1_elo_change : player2_elo_change,
    });
  }),
);

export const leaderboardRouter = Router();

leaderboardRouter.get(
  "/",
  asyncRoute(async (_req, res) => {
    const users = await q("SELECT id, username, elo FROM users ORDER BY elo DESC LIMIT 100");

    const ids = users.map((u) => u.id);
    const matches = ids.length
      ? await q("SELECT player1_id, player2_id, winner_id FROM matches WHERE winner_id = ANY($1::uuid[])", [ids])
      : [];

    const stats = new Map(ids.map((id) => [id, { wins: 0, losses: 0 }]));
    for (const m of matches) {
      if (stats.has(m.winner_id)) stats.get(m.winner_id).wins += 1;
      const loser = m.winner_id === m.player1_id ? m.player2_id : m.player1_id;
      if (stats.has(loser)) stats.get(loser).losses += 1;
    }

    ok(res, users.map((u, i) => ({
      rank: i + 1,
      username: u.username,
      elo: u.elo,
      wins: stats.get(u.id)?.wins ?? 0,
      losses: stats.get(u.id)?.losses ?? 0,
    })));
  }),
);
