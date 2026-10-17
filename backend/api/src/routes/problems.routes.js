import { Router } from "express";
import { q, isUuid } from "../lib/db.js";
import { ok, fail, asyncRoute } from "../lib/http.js";
import { optionalAuth } from "../middleware/auth.js";

export const problemsRouter = Router();

async function solvedAndBest(userId, problemIds) {
  if (!userId || problemIds.length === 0) return { solved: new Set(), best: new Map() };
  const rows = await q(
    `SELECT problem_id, duration_ms FROM solo_attempts
     WHERE user_id = $1::uuid AND status = 'completed' AND problem_id = ANY($2::uuid[])`,
    [userId, problemIds],
  );
  const solved = new Set();
  const best = new Map();
  for (const row of rows) {
    solved.add(row.problem_id);
    if (row.duration_ms != null) {
      best.set(row.problem_id, Math.min(best.get(row.problem_id) ?? Infinity, row.duration_ms));
    }
  }
  return { solved, best };
}

problemsRouter.get(
  "/",
  optionalAuth,
  asyncRoute(async (req, res) => {
    const problems = await q("SELECT id, title, difficulty FROM problems ORDER BY created_at");
    const counts = await q("SELECT problem_id, COUNT(*)::int AS count FROM test_cases GROUP BY problem_id");
    const countMap = {};
    for (const row of counts) countMap[row.problem_id] = row.count;

    const { solved, best } = await solvedAndBest(req.user?.id, problems.map((p) => p.id));

    ok(res, problems.map((p) => ({
      id: p.id,
      title: p.title,
      difficulty: p.difficulty,
      test_case_count: countMap[p.id] ?? 0,
      solved: solved.has(p.id),
      best_score: best.get(p.id) ?? null,
    })));
  }),
);

problemsRouter.get(
  "/:id",
  optionalAuth,
  asyncRoute(async (req, res) => {
    if (!isUuid(req.params.id)) return fail(res, "Problem nicht gefunden", 404);
    const rows = await q("SELECT * FROM problems WHERE id = $1::uuid", [req.params.id]);
    const problem = rows[0];
    if (!problem) return fail(res, "Problem nicht gefunden", 404);

    const countRows = await q(
      "SELECT COUNT(*)::int AS count FROM test_cases WHERE problem_id = $1::uuid",
      [problem.id],
    );
    const count = countRows[0]?.count ?? 0;

    const { solved, best } = await solvedAndBest(req.user?.id, [problem.id]);

    ok(res, {
      id: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
      description: problem.description,
      starter_code: problem.starter_code,
      example_input: problem.example_input,
      example_output: problem.example_output,
      test_case_count: count,
      solved: solved.has(problem.id),
      best_score: best.get(problem.id) ?? null,
    });
  }),
);
