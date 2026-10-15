import { Router } from "express";
import { supabase } from "../config.js";
import { ok, fail, asyncRoute } from "../lib/http.js";
import { optionalAuth } from "../middleware/auth.js";

export const problemsRouter = Router();

async function solvedAndBest(userId, problemIds) {
  if (!userId || problemIds.length === 0) return { solved: new Set(), best: new Map() };
  const { data } = await supabase
    .from("solo_attempts")
    .select("problem_id, duration_ms, status")
    .eq("user_id", userId)
    .eq("status", "completed")
    .in("problem_id", problemIds);
  const solved = new Set();
  const best = new Map();
  for (const row of data ?? []) {
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
    const { data: problems, error } = await supabase
      .from("problems")
      .select("id, title, difficulty")
      .order("created_at");
    if (error) return fail(res, "Probleme konnten nicht geladen werden", 500);

    const counts = await supabase.from("test_cases").select("problem_id");
    const countMap = {};
    for (const row of counts.data ?? []) countMap[row.problem_id] = (countMap[row.problem_id] ?? 0) + 1;

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
    const { data: problem } = await supabase
      .from("problems")
      .select("*")
      .eq("id", req.params.id)
      .maybeSingle();
    if (!problem) return fail(res, "Problem nicht gefunden", 404);

    const { count } = await supabase
      .from("test_cases")
      .select("id", { count: "exact", head: true })
      .eq("problem_id", problem.id);

    const { solved, best } = await solvedAndBest(req.user?.id, [problem.id]);

    ok(res, {
      id: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
      description: problem.description,
      starter_code: problem.starter_code,
      example_input: problem.example_input,
      example_output: problem.example_output,
      test_case_count: count ?? 0,
      solved: solved.has(problem.id),
      best_score: best.get(problem.id) ?? null,
    });
  }),
);
