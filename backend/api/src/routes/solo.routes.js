import { Router } from "express";
import { randomUUID } from "crypto";
import { q, isUuid } from "../lib/db.js";
import { ok, fail, asyncRoute } from "../lib/http.js";
import { requireAuth } from "../middleware/auth.js";
import { soloStartSchema, soloSubmitSchema, parseBody } from "../middleware/validate.js";
import { runTests } from "../services/piston.js";

export const soloRouter = Router();

soloRouter.use(requireAuth);

const MIN_MS = 5_000;
const MAX_MS = 15 * 60 * 1000;

function entryFunctionOf(starterCode) {
  const match = starterCode.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
  return match ? match[1] : "solve";
}

soloRouter.post(
  "/start",
  asyncRoute(async (req, res) => {
    const { problem_id } = parseBody(soloStartSchema, req.body);
    if (!isUuid(problem_id)) return fail(res, "Problem nicht gefunden", 404);

    const problemRows = await q("SELECT * FROM problems WHERE id = $1::uuid", [problem_id]);
    const problem = problemRows[0];
    if (!problem) return fail(res, "Problem nicht gefunden", 404);

    const countRows = await q(
      "SELECT COUNT(*)::int AS count FROM test_cases WHERE problem_id = $1::uuid",
      [problem.id],
    );
    const count = countRows[0]?.count ?? 0;

    const prevRows = await q(
      `SELECT duration_ms FROM solo_attempts
       WHERE user_id = $1::uuid AND problem_id = $2::uuid AND status = 'completed'
       ORDER BY duration_ms ASC LIMIT 1`,
      [req.user.id, problem.id],
    );
    const previousBest = prevRows[0] ?? null;

    const session_id = randomUUID();
    const started_at = new Date();
    await q(
      `INSERT INTO solo_attempts (id, user_id, problem_id, started_at, status)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'in_progress')`,
      [session_id, req.user.id, problem.id, started_at.toISOString()],
    );

    ok(res, {
      session_id,
      problem: {
        id: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        description: problem.description,
        starter_code: problem.starter_code,
        example_input: problem.example_input,
        example_output: problem.example_output,
        test_case_count: count,
        solved: false,
        best_score: previousBest?.duration_ms ?? null,
      },
      started_at: started_at.toISOString(),
    });
  }),
);

soloRouter.post(
  "/submit",
  asyncRoute(async (req, res) => {
    const { session_id, code } = parseBody(soloSubmitSchema, req.body);
    if (!isUuid(session_id)) return fail(res, "Session nicht gefunden", 404);

    const sessionRows = await q(
      "SELECT * FROM solo_attempts WHERE id = $1::uuid AND user_id = $2::uuid",
      [session_id, req.user.id],
    );
    const session = sessionRows[0];
    if (!session) return fail(res, "Session nicht gefunden", 404);
    if (session.status !== "in_progress") return fail(res, "Session bereits abgeschlossen", 400);
    if (session.submitted && !session.last_was_compile_error) {
      return fail(res, "Es ist nur ein Submit pro Session erlaubt", 400);
    }

    const elapsed = Date.now() - new Date(session.started_at).getTime();

    // Maximalzeit: automatisch "failed"
    if (elapsed > MAX_MS) {
      await q(
        `UPDATE solo_attempts
         SET status = 'timeout', finished_at = $2, duration_ms = $3,
             submitted = true, last_was_compile_error = false
         WHERE id = $1::uuid`,
        [session_id, new Date().toISOString(), elapsed],
      );
      return ok(res, { correct: false, tests_passed: 0, tests_total: 0, duration_ms: elapsed, status: "timeout", best_score: null });
    }

    const problemRows = await q("SELECT * FROM problems WHERE id = $1::uuid", [session.problem_id]);
    const problem = problemRows[0];
    const testCases = await q(
      "SELECT input, expected_output FROM test_cases WHERE problem_id = $1::uuid",
      [session.problem_id],
    );

    const entry = entryFunctionOf(problem.starter_code);
    const result = await runTests(code, testCases, entry);

    // Mindestzeit-Check (Anti-Cheat)
    if (result.correct && elapsed < MIN_MS) {
      return fail(res, "Lösung zu schnell – Cheating-Verdacht", 400);
    }

    const isCompileError = Boolean(result.compile_error);
    let duration_ms = null;
    let status = "failed";
    let best_score = null;

    if (result.correct) {
      duration_ms = elapsed;
      status = "completed";
      const prevRows = await q(
        `SELECT best_score FROM solo_attempts
         WHERE user_id = $1::uuid AND problem_id = $2::uuid AND status = 'completed'
         ORDER BY best_score ASC NULLS LAST LIMIT 1`,
        [req.user.id, session.problem_id],
      );
      const prev = prevRows[0] ?? null;
      best_score = prev?.best_score != null ? Math.min(prev.best_score, elapsed) : elapsed;
    }

    await q(
      `UPDATE solo_attempts
       SET finished_at = $2, duration_ms = $3, status = $4, code = $5,
           submitted = true, last_was_compile_error = $6
       WHERE id = $1::uuid`,
      [session_id, new Date().toISOString(), duration_ms, status, code, isCompileError],
    );

    ok(res, {
      correct: result.correct,
      compile_error: result.compile_error ?? undefined,
      tests_passed: result.tests_passed,
      tests_total: result.tests_total,
      duration_ms: duration_ms ?? undefined,
      status,
      best_score,
    });
  }),
);

soloRouter.get(
  "/stats",
  asyncRoute(async (req, res) => {
    const attempts = await q(
      "SELECT problem_id, status, duration_ms FROM solo_attempts WHERE user_id = $1::uuid",
      [req.user.id],
    );

    const completed = attempts.filter((a) => a.status === "completed");
    const bestByProblem = new Map();
    for (const a of completed) {
      if (a.duration_ms == null) continue;
      bestByProblem.set(a.problem_id, Math.min(bestByProblem.get(a.problem_id) ?? Infinity, a.duration_ms));
    }

    const problemIds = [...bestByProblem.keys()];
    const problems = problemIds.length
      ? await q("SELECT id, title FROM problems WHERE id = ANY($1::uuid[])", [problemIds])
      : [];
    const titleMap = new Map(problems.map((p) => [p.id, p.title]));

    ok(res, {
      solved: bestByProblem.size,
      attempts: attempts.length,
      best_times: [...bestByProblem.entries()].map(([problem_id, duration_ms]) => ({
        problem_id,
        title: titleMap.get(problem_id) ?? problem_id,
        duration_ms,
      })),
    });
  }),
);
