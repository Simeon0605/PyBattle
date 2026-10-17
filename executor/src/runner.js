// Worker-Thread: lädt Pyodide (Python/WASM) einmalig und führt damit
// den übermittelten Code aus. STDOUT/STDERR werden mitgeschnitten.
import { parentPort } from "node:worker_threads";
import { loadPyodide } from "pyodide";

let pyodide = null;
let loading = null;

async function ensure() {
  if (pyodide) return pyodide;
  if (!loading) {
    loading = loadPyodide().then((p) => {
      pyodide = p;
      return p;
    });
  }
  return loading;
}

parentPort.on("message", async (msg) => {
  if (msg.cmd === "ensure") {
    try {
      await ensure();
      parentPort.postMessage({ cmd: "ready" });
    } catch (err) {
      parentPort.postMessage({ cmd: "error", error: err.message });
    }
    return;
  }

  if (msg.cmd === "run") {
    try {
      const py = await ensure();
      const outChunks = [];
      const errChunks = [];
      py.setStdout({ batched: (s) => outChunks.push(s) });
      py.setStderr({ batched: (s) => errChunks.push(s) });
      let code = 0;
      try {
        await py.runPythonAsync(msg.code);
      } catch (err) {
        // Python-Fehler (NameError, SyntaxError, ...) -> Exit-Code 1 + Meldung
        code = 1;
        errChunks.push(String(err.message ?? err));
      }
      parentPort.postMessage({
        cmd: "result",
        ok: true,
        code,
        stdout: outChunks.join(""),
        stderr: errChunks.join(""),
      });
    } catch (err) {
      parentPort.postMessage({ cmd: "result", ok: false, error: String(err.message ?? err) });
    }
  }
});
