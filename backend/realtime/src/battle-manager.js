import { randomUUID } from "crypto";

export class BattleManager {
  constructor(db, config, { runTests, applyElo }) {
    this.db = db;
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
    const problemIds = await this.db("SELECT id FROM problems");
    const problemId = problemIds[Math.floor(Math.random() * problemIds.length)]?.id;
    if (!problemId) throw new Error("Keine Probleme in der Datenbank");
    const problemRows = await this.db("SELECT * FROM problems WHERE id = $1::uuid", [problemId]);
    const problem = problemRows[0];
    const countRows = await this.db(
      "SELECT COUNT(*)::int AS count FROM test_cases WHERE problem_id = $1::uuid",
      [problemId],
    );
    const count = countRows[0]?.count ?? 0;

    const matchRows = await this.db(
      `INSERT INTO matches (player1_id, player2_id, problem_id, started_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4) RETURNING *`,
      [a.user.id, b.user.id, problemId, new Date().toISOString()],
    );
    const match = matchRows[0];

    const battle = {
      id: match.id,
      problem,
      testTotal: count,
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
            test_case_count: count,
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

    const testCases = await this.db(
      "SELECT input, expected_output FROM test_cases WHERE problem_id = $1::uuid",
      [battle.problem.id],
    );

    const result = await this.runTests(code, testCases, this.entryFunctionOf(battle.problem.starter_code));
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

  async forfeit(userId) {
    const battle = this.matches.get(userId);
    if (!battle || battle.players[userId].finished) return { error: "Kein aktives Match" };
    // Aufgeben = automatische Niederlage, Sieger ist der Gegner
    const opponentId = Object.keys(battle.players).find((id) => id !== userId);
    await this.finish(battle, opponentId);
    return { forfeited: true };
  }

  async finish(battle, winnerId) {
    clearTimeout(battle.timeout);
    const [p1, p2] = Object.values(battle.players);
    const userRows = await this.db("SELECT id, elo FROM users WHERE id = ANY($1::uuid[])", [
      [p1.id, p2.id],
    ]);
    const u1 = userRows.find((u) => u.id === p1.id);
    const u2 = userRows.find((u) => u.id === p2.id);
    const elo = this.applyElo(u1, u2, winnerId);

    await this.db("UPDATE users SET elo = $2 WHERE id = $1::uuid", [p1.id, elo.player1_new_elo]);
    await this.db("UPDATE users SET elo = $2 WHERE id = $1::uuid", [p2.id, elo.player2_new_elo]);
    await this.db(
      `UPDATE matches
       SET winner_id = $2::uuid, finished_at = $3, duration_ms = $4,
           player1_elo_change = $5, player2_elo_change = $6
       WHERE id = $1::uuid`,
      [battle.id, winnerId, new Date().toISOString(), Date.now() - battle.startedAt, elo.player1_elo_change, elo.player2_elo_change],
    );

    for (const player of [p1, p2]) {
      this.matches.delete(player.id);
      const won = player.id === winnerId;
      const change = player.id === p1.id ? elo.player1_elo_change : elo.player2_elo_change;
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
