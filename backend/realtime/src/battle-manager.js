import { randomUUID } from "crypto";

export class BattleManager {
  constructor(supabase, config, { runTests, applyElo }) {
    this.supabase = supabase;
    this.config = config;
    this.runTests = runTests;
    this.applyElo = applyElo;
    this.queue = [];
    this.matches = new Map();
  }

  async enqueue(socket, user) {
    if (this.matches.has(user.id)) return { matched: true, match: this.matches.get(user.id).publicFor(user.id) };
    if (this.queue.some((q) => q.user.id === user.id)) return { matched: false };

    const existing = this.queue.find(
      (q) => Math.abs(q.user.elo - user.elo) <= this.currentEloRange(q.joinedAt),
    );
    this.queue = this.queue.filter((q) => q.user.id !== user.id);
    if (existing) {
      this.queue = this.queue.filter((q) => q.user.id !== existing.user.id);
      return { matched: true, match: await this.createMatch(existing, { user, socket }) };
    }
    this.queue.push({ user, socket, joinedAt: Date.now() });
    return { matched: false };
  }

  currentEloRange(joinedAt) {
    const waitedSec = (Date.now() - joinedAt) / 1000;
    return this.config.eloRange + waitedSec * this.config.eloRangeGrowthPerSec;
  }

  async createMatch(a, b) {
    const problemIds = (await this.supabase.from("problems").select("id")).data ?? [];
    const problemId = problemIds[Math.floor(Math.random() * problemIds.length)]?.id;
    const { data: problem } = await this.supabase.from("problems").select("*").eq("id", problemId).maybeSingle();
    const { count } = await this.supabase
      .from("test_cases")
      .select("id", { count: "exact", head: true })
      .eq("problem_id", problemId);

    const { data: match, error } = await this.supabase
      .from("matches")
      .insert({
        player1_id: a.user.id,
        player2_id: b.user.id,
        problem_id: problemId,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;

    const battle = {
      id: match.id,
      problem,
      testTotal: count ?? 0,
      startedAt: Date.now(),
      timeLimitMs: this.config.timeLimitMs,
      players: {
        [a.user.id]: { ...a.user, socket: a.socket, progress: 0, finished: false, lastCompileError: false },
        [b.user.id]: { ...b.user, socket: b.socket, progress: 0, finished: false, lastCompileError: false },
      },
      timeout: setTimeout(() => this.finishByTimeout(battle), this.config.timeLimitMs),
      publicFor(userId) {
        const opponentId = userId === a.user.id ? b.user.id : a.user.id;
        return {
          id: match.id,
          problem: {
            id: problem.id,
            title: problem.title,
            difficulty: problem.difficulty,
            description: problem.description,
            starter_code: problem.starter_code,
            example_input: problem.example_input,
            example_output: problem.example_output,
            test_case_count: count ?? 0,
          },
          opponent: { username: battle.players[opponentId].username, elo: battle.players[opponentId].elo },
          started_at: match.started_at,
          time_limit_ms: battle.timeLimitMs,
        };
      },
    };
    this.matches.set(a.user.id, battle);
    this.matches.set(b.user.id, battle);
    return battle;
  }

  entryFunctionOf(starterCode) {
    const match = starterCode?.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
    return match ? match[1] : "solve";
  }

  async submit(userId, code) {
    const battle = this.matches.get(userId);
    if (!battle) return { error: "Kein aktives Match" };
    const player = battle.players[userId];
    if (player.finished) return { error: "Bereits abgeschlossen" };

    const { data: testCases } = await this.supabase
      .from("test_cases")
      .select("input, expected_output")
      .eq("problem_id", battle.problem.id);

    const result = await this.runTests(code, testCases ?? [], this.entryFunctionOf(battle.problem.starter_code));
    player.lastCompileError = Boolean(result.compile_error);

    if (!result.correct) {
      this.broadcast(battle, "battle:event", {
        type: "opponent_fail",
        message: `${player.username} hatte einen Fehler (Test ${result.tests_passed}/${result.tests_total})`,
        by: userId,
        tests_passed: result.tests_passed,
        tests_total: result.tests_total,
      });
      return { correct: false, ...result };
    }

    player.finished = true;
    return this.finish(battle, userId);
  }

  async finish(battle, winnerId) {
    clearTimeout(battle.timeout);
    const [p1, p2] = Object.values(battle.players);
    const { data: users } = await this.supabase
      .from("users")
      .select("id, elo")
      .in("id", [p1.id, p2.id]);
    const u1 = users.find((u) => u.id === p1.id);
    const u2 = users.find((u) => u.id === p2.id);
    const elo = this.applyElo(u1, u2, winnerId);

    await this.supabase.from("users").update({ elo: elo.player1_new_elo }).eq("id", p1.id);
    await this.supabase.from("users").update({ elo: elo.player2_new_elo }).eq("id", p2.id);
    await this.supabase
      .from("matches")
      .update({
        winner_id: winnerId,
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - battle.startedAt,
        player1_elo_change: elo.player1_elo_change,
        player2_elo_change: elo.player2_elo_change,
      })
      .eq("id", battle.id);

    for (const player of [p1, p2]) {
      this.matches.delete(player.id);
      const won = player.id === winnerId;
      const change = won ? (player.id === p1.id ? elo.player1_elo_change : elo.player2_elo_change) : (player.id === p1.id ? elo.player1_elo_change : elo.player2_elo_change);
      player.socket.emit("battle:event", {
        type: won ? "win" : "loss",
        message: won ? "Du hast gewonnen!" : "Du hast verloren.",
        elo_change: change,
        tests_total: battle.testTotal,
      });
      player.socket.emit("battle:end", { match_id: battle.id, winner_id: winnerId });
    }
    return { winnerId, elo };
  }

  async forfeit(userId) {
    const battle = this.matches.get(userId);
    if (!battle || battle.players[userId].finished) return { error: "Kein aktives Match" };
    // Aufgeben = automatische Niederlage, Sieger ist der Gegner
    const opponentId = Object.keys(battle.players).find((id) => id !== userId);
    await this.finish(battle, opponentId);
    return { forfeited: true };
  }

  async finishByTimeout(battle) {
    const [p1, p2] = Object.values(battle.players);
    const winner = p1.progress >= p2.progress ? p1.id : p2.id;
    for (const player of [p1, p2]) {
      player.socket.emit("battle:event", { type: "timeout", message: "Zeit abgelaufen!" });
    }
    await this.finish(battle, winner);
  }

  broadcast(battle, event, payload) {
    for (const player of Object.values(battle.players)) {
      player.socket.emit(event, payload);
    }
  }

  removeFromQueue(userId) {
    this.queue = this.queue.filter((q) => q.user.id !== userId);
  }

  leave(userId) {
    this.removeFromQueue(userId);
    const battle = this.matches.get(userId);
    if (battle && !battle.players[userId].finished) {
      const opponentId = Object.keys(battle.players).find((id) => id !== userId);
      return this.finish(battle, opponentId).catch(() => {});
    }
  }
}
