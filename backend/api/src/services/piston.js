const PISTON_URL = process.env.PISTON_URL ?? "https://emkc.org/api/v2/piston/execute";

async function execute(code) {
  const res = await fetch(PISTON_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: "python",
      version: "3.10.0",
      files: [{ name: "solution.py", content: code }],
      stdin: "",
    }),
  });
  if (!res.ok) throw new Error(`Piston-Fehler: ${res.status}`);
  return res.json();
}

export function isCompileError(result) {
  return Boolean(result.compile?.output?.trim());
}

function serialize(value) {
  if (value === null || value === undefined) return "None";
  if (Array.isArray(value)) return `[${value.map(serialize).join(", ")}]`;
  if (typeof value === "string") return JSON.stringify(value);
  return String(value);
}

const HARNESS_PREFIX = `
import json, sys

def _pyclash_run(func, args):
    result = func(**args)
    print(json.dumps(result))
`;

export async function runTests(code, testCases, entryFunction) {
  let compileError = null;
  let passed = 0;
  const details = [];

  for (const tc of testCases) {
    const callCode = `${HARNESS_PREFIX}\n${code}\n\n_pyclash_run(${entryFunction}, ${serialize(tc.input)})\n`;
    try {
      const result = await execute(callCode);
      if (isCompileError(result)) {
        compileError = result.compile.output.trim();
        break;
      }
      const actual = result.run?.output?.trim();
      const expected = serialize(tc.expected_output);
      if (actual === expected) {
        passed += 1;
      } else {
        details.push({ expected, actual });
      }
    } catch (err) {
      details.push({ expected: serialize(tc.expected_output), actual: err.message });
    }
  }

  return {
    compile_error: compileError,
    tests_passed: passed,
    tests_total: testCases.length,
    correct: !compileError && passed === testCases.length,
  };
}
