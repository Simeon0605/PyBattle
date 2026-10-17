# Python-Executor (Wichtig: die öffentlichen Piston-API ist zu!)

Die öffentliche Piston-API (emkc.org) ist **seit 15.02.2026 whitelist-only** und
antwortet mit HTTP 401. Die Problem-Prüfung braucht deshalb eine eigene
Ausführungs-Instanz. Drei Optionen:

## Option A: Mitgelieferter Pyodide-Executor (empfohlen, kostenlos, kein Docker)

Der Ordner [`executor/`](../executor/) enthält einen eigenen Executor auf Basis
von **Pyodide (Python/WASM)**. Er spricht die **Piston-API 1:1** – backend/api
und backend/realtime bleiben unverändert.

Eigenschaften:
- Python läuft in der WASM-Sandbox (kein Datei-/Netzwerkzugriff für User-Code)
- Ausführung im Worker-Thread mit Timeout-Kill (Standard 10 s, `RUN_TIMEOUT_MS`)
- Worker-Recycling nach 50 Läufen gegen Speicherleichen

**Deployment (Render):**
1. Render → New → **Web Service** → Repository `Simeon0605/PyBattle`
2. Root Directory: `executor/` · Start Command: `node src/server.js`
3. Keine Env-Vars nötig (Port übernimmt Render automatisch)
4. Danach bei **api** und **realtime** setzen:
   `PISTON_URL=https://<dein-executor>.onrender.com/api/v2/piston/execute`

Hinweis Free Tier: Bei Inaktivität schläft der Service ein – der erste Submit
nach einer Pause braucht dann ~10–30 s (Cold Start).

## Option B: Whitelist beantragen

Lies den „Important Note" unter https://github.com/engineer-man/piston#public-api
und beantrage eine Freischaltung. Bearbeitungsdauer unklar.

## Option C: Eigene Piston-Instanz per Docker

Piston braucht `--privileged` (nsjail) – das unterstützen Render/Railway
**nicht**. Geeignet: VPS, Raspberry Pi oder Docker Desktop.

```bash
docker build -t pyclash-piston .
docker run -d --privileged --name pyclash-piston -p 2000:2000 \
  --restart unless-stopped pyclash-piston
```

Danach wie bei Option A die `PISTON_URL` auf
`http://<host>:2000/api/v2/piston/execute` setzen.

Ohne erreichbaren Executor schlägt jeder Submit bewusst sichtbar fehl:
„Piston nicht erreichbar: …" – statt stumm „0/N Tests".
