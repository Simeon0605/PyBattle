// PyClash Executor: piston-kompatible API auf Basis von Pyodide (Python/WASM).
//
// Wichtig, weil die öffentliche Piston-API (emkc.org) seit 15.02.2026
// whitelist-only ist und mit HTTP 401 ablehnt. Dieser Service emuliert
// POST /api/v2/piston/execute, sodass backend/api und backend/realtime
// unverändert bleiben – es genügt PISTON_URL auf diesen Service zeigen zu lassen.
//
// Sicherheit: Python läuft in der WASM-Sandbox von Pyodide (kein FS-/Netz-
// Zugriff). Ausführung erfolgt in einem Worker-Thread, der bei Timeout
// hart beendet und neu gestartet wird.
import express from "express";
import cors from "cors";
import { Worker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import path from "node:path";

const PORT = Number(process.env.PORT ?? 2000);
const RUN_TIMEOUT_MS = Number(process.env.RUN_TIMEOUT_MS ?? 10_000);
const MAX_RUNS_PER_WORKER = 50;

const runnerPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "runner.js");

let worker = null;
let workerRuns = 0;
let ready = Promise.resolve();

function spawnWorker() {
  worker = new Worker(runnerPath);
  workerRuns = 0;
  ready = new Promise((resolve, reject) => {
    const onMsg = (m) => {
      if (m?.cmd === "ready") {
        worker.off("error", onErr);
        resolve();
      }
    };
    const onErr = (err) => reject(err);
    worker.once("message", onMsg);
    worker.once("error", onErr);
    worker.postMessage({ cmd: "ensure" });
  });
  ready.catch(() => {});
}

async function recycleIfNeeded() {
  if (workerRuns >= MAX_RUNS_PER_WORKER && worker) {
    await worker.terminate();
    worker = null;
  }
  if (!worker) spawnWorker();
  await ready;
}

function runOnWorker(code) {
  return new Promise((resolve) => {
    const current = worker;
    if (!current) {
      resolve({ code: 1, stdout: "", stderr: "Executor-Worker nicht verfügbar" });
      return;
    }
    const timer = setTimeout(() => {
      // Endlosschleife o. ä. -> Worker hart beenden, beim nächsten Request neu starten
      current.removeAllListeners("message");
      current.terminate();
      if (worker === current) {
        worker = null;
      }
      resolve({
        code: 124,
        stdout: "",
        stderr: `Zeitüberschreitung: Ausführung nach ${RUN_TIMEOUT_MS} ms abgebrochen`,
      });
    }, RUN_TIMEOUT_MS);

    current.once("message", (m) => {
      if (m?.cmd !== "result") return;
      clearTimeout(timer);
      workerRuns += 1;
      if (m.ok) {
        resolve({ code: m.code, stdout: m.stdout, stderr: m.stderr });
      } else {
        resolve({ code: 1, stdout: "", stderr: m.error });
      }
    });

    current.postMessage({ cmd: "run", code });
  });
}

// Requests seriell abarbeiten (ein Worker, keine Teilung nötig)
let queue = Promise.resolve();
function enqueue(task) {
  const next = queue.then(task, task);
  queue = next.catch(() => {});
  return next;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/v2/piston/runtimes", (_req, res) => {
  res.json([{ language: "python", version: "3.12.1", aliases: ["py", "py3", "python3"] }]);
});

app.post("/api/v2/piston/execute", async (req, res) => {
  const file = req.body?.files?.[0];
  if (!file?.content) {
    return res.status(400).json({ message: "files[0].content fehlt" });
  }
  try {
    const result = await enqueue(async () => {
      await recycleIfNeeded();
      return runOnWorker(String(file.content));
    });
    const output = (result.stdout + (result.stderr ? (result.stdout ? "\n" : "") + result.stderr : "")).trim();
    res.json({
      language: "python",
      version: "3.12.1",
      run: {
        code: result.code,
        stdout: result.stdout,
        stderr: result.stderr,
        output,
      },
      compile: { code: 0, stdout: "", stderr: "", output: "" },
    });
  } catch (err) {
    res.status(500).json({ message: String(err?.message ?? err) });
  }
});

app.get("/healthz", (_req, res) => res.json({ ok: true, runs: workerRuns }));

spawnWorker(); // Pyodide im Hintergrund vorwärmen

app.listen(PORT, () => {
  console.log(`PyClash Executor (Pyodide) läuft auf Port ${PORT}`);
});
