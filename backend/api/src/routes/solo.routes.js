import { Router } from "express";
import { randomUUID } from "crypto";
import { supabase } from "../config.js";
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

    const { data: problem } = await supabase
      .from("problems")
      .select("*")
      .eq("id", problem_id)
      .maybeSingle();
    if (!problem) return fail(res, "Problem nicht gefunden", 404);

    const { count } = await supabase
      .from("test_cases")
      .select("id", { count: "exact", head: true })
      .eq("problem_id", problem.id);

    const { data: previousBest } = await supabase
      .from("solo_attempts")
      .select("duration_ms")
      .eq("user_id", req.user.id)
      .eq("problem_id", problem.id)
      .eq("status", "completed")
      .order("duration_ms", { ascending: true })
      .limit(1);

    const session_id = randomUUID();
    const started_at = new Date();
    const { error } = await supabase.from("solo_attempts").insert({
      id: session_id,
      user_id: req.user.id,
      problem_id,
      started_at: started_at.toISOString(),
      status: "in_progress",
    });
    if (error) return fail(res, "Session konnte nicht erstellt werden", 500);

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
        test_case_count: count ?? 0,
        solved: false,
        best_score: previousBest?.[0]?.duration_ms ?? null,
      },
      started_at: started_at.toISOString(),
    });
  }),
);

soloRouter.post(
  "/submit",
  asyncRoute(async (req, res) => {
    const { session_id, code } = parseBody(soloSubmitSchema, req.body);

    const { data: session } = await supabase
      .from("solo_attempts")
      .select("*")
      .eq("id", session_id)
      .eq("user_id", req.user.id)
      .maybeSingle();
    if (!session) return fail(res, "Session nicht gefunden", 404);
    if (session.status !== "in_progress") return fail(res, "Session bereits abgeschlossen", 400);
    if (session.submitted && !session.last_was_compile_error) {
      return fail(res, "Es ist nur ein Submit pro Session erlaubt", 400);
    }

    const elapsed = Date.now() - new Date(session.started_at).getTime();

    // Maximalzeit: automatisch "failed"
    if (elapsed > MAX_MS) {
      await supabase
        .from("solo_attempts")
        .update({ status: "timeout", finished_at: new Date().toISOString(), duration_ms: elapsed, submitted: true, last_was_compile_error: false })
        .eq("id", session_id);
      return ok(res, { correct: false, tests_passed: 0, tests_total: 0, duration_ms: elapsed, status: "timeout", best_score: null });
    }

    const { data: problem } = await supabase
      .from("problems")
      .select("*")
      .eq("id", session.problem_id)
      .single();
    const { data: testCases } = await supabase
      .from("test_cases")
      .select("input, expected_output")
      .eq("problem_id", session.problem_id);

    const entry = entryFunctionOf(problem.starter_code);
    const result = await runTests(code, testCases ?? [], entry);

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
      const { data: prev } = await supabase
        .from("solo_attempts")
        .select("best_score")
        .eq("user_id", req.user.id)
        .eq("problem_id", session.problem_id)
        .eq("status", "completed")
        .order("best_score", { ascending: true, nullsFirst: false })
        .limit(1);
      best_score = prev?.[0]?.best_score != null ? Math.min(prev[0].best_score, elapsed) : elapsed;
    }

    await supabase
      .from("solo_attempts")
      .update({
        finished_at: new Date().toISOString(),
        duration_ms,
        status,
        code,
        submitted: true,
        last_was_compile_error: isCompileError,
      })
      .eq("id", session_id);

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
    const { data: attempts } = await supabase
      .from("solo_attempts")
      .select("problem_id, status, duration_ms")
      .eq("user_id", req.user.id);

    const completed = (attempts ?? []).filter((a) => a.status === "completed");
    const bestByProblem = new Map();
    for (const a of completed) {
      if (a.duration_ms == null) continue;
      bestByProblem.set(a.problem_id, Math.min(bestByProblem.get(a.problem_id) ?? Infinity, a.duration_ms));
    }

    const problemIds = [...bestByProblem.keys()];
    const { data: problems } = problemIds.length
      ? await supabase.from("problems").select("id, title").in("id", problemIds)
      : { data: [] };
    const titleMap = new Map((problems ?? []).map((p) => [p.id, p.title]));

    ok(res, {
      solved: bestByProblem.size,
      attempts: (attempts ?? []).length,
      best_times: [...bestByProblem.entries()].map(([problem_id, duration_ms]) => ({
        problem_id,
        title: titleMap.get(problem_id) ?? problem_id,
        duration_ms,
      })),
    });
  }),
);
