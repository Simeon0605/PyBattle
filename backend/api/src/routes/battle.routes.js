import { Router } from "express";
import { supabase } from "../config.js";
import { ok, fail, asyncRoute } from "../lib/http.js";
import { requireAuth } from "../middleware/auth.js";
import { applyElo } from "../services/elo.js";

export const battleRouter = Router();

battleRouter.use(requireAuth);

battleRouter.post(
  "/queue",
  asyncRoute(async (req, res) => {
    const { error } = await supabase
      .from("battle_queue")
      .upsert({ user_id: req.user.id, joined_at: new Date().toISOString(), elo_at_join: req.user.elo });
    if (error) return fail(res, "Queue-Beitritt fehlgeschlagen", 500);

    const { count } = await supabase
      .from("battle_queue")
      .select("user_id", { count: "exact", head: true });
    ok(res, { queued: true, players_waiting: count ?? 1 });
  }),
);

battleRouter.get(
  "/history",
  asyncRoute(async (req, res) => {
    const uid = req.user.id;
    const { data: matches, error } = await supabase
      .from("matches")
      .select("*")
      .or(`player1_id.eq.${uid},player2_id.eq.${uid}`)
      .order("finished_at", { ascending: false })
      .limit(50);
    if (error) return fail(res, "Historie konnte nicht geladen werden", 500);

    const opponentIds = matches.map((m) => (m.player1_id === uid ? m.player2_id : m.player1_id));
    const { data: opponents } = opponentIds.length
      ? await supabase.from("users").select("id, username").in("id", opponentIds)
      : { data: [] };
    const nameMap = new Map((opponents ?? []).map((u) => [u.id, u.username]));
    const problemIds = [...new Set(matches.map((m) => m.problem_id).filter(Boolean))];
    const { data: problems } = problemIds.length
      ? await supabase.from("problems").select("id, title").in("id", problemIds)
      : { data: [] };
    const titleMap = new Map((problems ?? []).map((p) => [p.id, p.title]));

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
    if (!match_id) return fail(res, "match_id erforderlich", 400);

    const { data: match } = await supabase.from("matches").select("*").eq("id", match_id).maybeSingle();
    if (!match) return fail(res, "Match nicht gefunden", 404);
    if (match.winner_id) return fail(res, "Match bereits abgeschlossen", 400);
    if (match.player1_id !== req.user.id && match.player2_id !== req.user.id) {
      return fail(res, "Nicht Teilnehmer des Matches", 403);
    }

    const { data: users } = await supabase
      .from("users")
      .select("id, elo")
      .in("id", [match.player1_id, match.player2_id]);
    const [p1, p2] = users;
    const { player1_elo_change, player2_elo_change, player1_new_elo, player2_new_elo } = applyElo(p1, p2, req.user.id);

    await supabase.from("users").update({ elo: player1_new_elo }).eq("id", p1.id);
    await supabase.from("users").update({ elo: player2_new_elo }).eq("id", p2.id);
    await supabase
      .from("matches")
      .update({
        winner_id: req.user.id,
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - new Date(match.started_at).getTime(),
        player1_elo_change,
        player2_elo_change,
      })
      .eq("id", match_id);
    await supabase.from("battle_queue").delete().in("user_id", [p1.id, p2.id]);

    ok(res, { winner_id: req.user.id, player1_elo_change, player2_elo_change });
  }),
);

battleRouter.post(
  "/forfeit",
  asyncRoute(async (req, res) => {
    const { match_id } = req.body ?? {};
    if (!match_id) return fail(res, "match_id erforderlich", 400);

    const { data: match } = await supabase.from("matches").select("*").eq("id", match_id).maybeSingle();
    if (!match) return fail(res, "Match nicht gefunden", 404);
    if (match.winner_id) return fail(res, "Match bereits abgeschlossen", 400);
    if (match.player1_id !== req.user.id && match.player2_id !== req.user.id) {
      return fail(res, "Nicht Teilnehmer des Matches", 403);
    }

    // Aufgeben = automatische Niederlage, Sieger ist der Gegner
    const winnerId = match.player1_id === req.user.id ? match.player2_id : match.player1_id;
    const { data: users } = await supabase
      .from("users")
      .select("id, elo")
      .in("id", [match.player1_id, match.player2_id]);
    const [p1, p2] = users;
    const { player1_elo_change, player2_elo_change, player1_new_elo, player2_new_elo } = applyElo(p1, p2, winnerId);

    await supabase.from("users").update({ elo: player1_new_elo }).eq("id", p1.id);
    await supabase.from("users").update({ elo: player2_new_elo }).eq("id", p2.id);
    await supabase
      .from("matches")
      .update({
        winner_id: winnerId,
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - new Date(match.started_at).getTime(),
        player1_elo_change,
        player2_elo_change,
      })
      .eq("id", match_id);
    await supabase.from("battle_queue").delete().in("user_id", [p1.id, p2.id]);

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
    const { data: users, error } = await supabase
      .from("users")
      .select("id, username, elo")
      .order("elo", { ascending: false })
      .limit(100);
    if (error) return fail(res, "Leaderboard konnte nicht geladen werden", 500);

    const ids = users.map((u) => u.id);
    const { data: matches } = ids.length
      ? await supabase.from("matches").select("player1_id, player2_id, winner_id").in("winner_id", ids)
      : { data: [] };

    const stats = new Map(ids.map((id) => [id, { wins: 0, losses: 0 }]));
    for (const m of matches ?? []) {
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
