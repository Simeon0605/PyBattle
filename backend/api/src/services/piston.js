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

function lastLine(text) {
  const lines = String(text).split("\n").map((l) => l.trim()).filter(Boolean);
  return lines[lines.length - 1] ?? null;
}

// Python-Syntaxfehler landen in run (Exit-Code != 0), nicht in compile –
// deshalb pruefen wir beides und geben die Fehlermeldung zurueck.
function errorOf(result) {
  const compileOut = result.compile?.output?.trim();
  if (compileOut) return compileOut;
  if ((result.run?.code ?? 0) !== 0) {
    const err = (result.run?.stderr || result.run?.output || "").trim();
    return err ? lastLine(err) : null;
  }
  return null;
}

export function isCompileError(result) {
  return Boolean(errorOf(result));
}

function serialize(value) {
  if (value === null || value === undefined) return "None";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (Array.isArray(value)) return `[${value.map(serialize).join(", ")}]`;
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "object") {
    const entries = Object.entries(value).map(
      ([key, val]) => `${/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) ? key : JSON.stringify(key)}: ${serialize(val)}`,
    );
    return `{${entries.join(", ")}}`;
  }
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
      const error = errorOf(result);
      if (error) {
        compileError = error;
        break;
      }
      // Der Harness gibt genau eine JSON-Zeile aus – Debug-Prints des Users
      // landen davor und werden ignoriert.
      const stdoutLines = (result.run?.stdout ?? "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const actual = stdoutLines[stdoutLines.length - 1] ?? "";
      // expected_output liegt in der DB als exakter JSON-Text vor
      // (Format wie json.dumps) – direkter Vergleich, kein Re-Serialize.
      const expected = String(tc.expected_output ?? "").trim();
      if (actual === expected) {
        passed += 1;
      } else {
        details.push({ expected, actual });
      }
    } catch (err) {
      details.push({ expected: String(tc.expected_output ?? ""), actual: err.message });
    }
  }

  return {
    compile_error: compileError,
    tests_passed: passed,
    tests_total: testCases.length,
    correct: !compileError && passed === testCases.length,
  };
}
