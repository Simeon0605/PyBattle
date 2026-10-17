# PyClash Backend (Branch `neon-migration`)

Das Backend besteht aus **zwei eigenständigen Diensten**, beide nutzen **Neon (PostgreSQL)** als Datenbank:

```
backend/
├── api/        Express REST-API  (Port 4000) – Auth, Problems, Solo, Leaderboard, Battle-History
└── realtime/   Socket.io-Server  (Port 4001) – Matchmaking, Live-Battles, ELO
db/
└── schema.sql  Komplettes DB-Schema + 25 LeetCode-Probleme (in Neon ausführen)
supabase/
└── schema.sql  Gleicher Stand für den Supabase-Branch `main`
```

## Setup (Neon)

1. **Neon**: Projekt anlegen (Region z. B. `eu-central-1`) → Dashboard → Connection String kopieren (idealerweise die **pooled**-Variante).
2. **Schema anlegen**:
   - Neon Dashboard → SQL Editor → Inhalt von `db/schema.sql` ausführen, **oder**
   - `psql "$DATABASE_URL" -f db/schema.sql`
3. **Prüfen**: `cd backend/api`, `.env` mit `DATABASE_URL` anlegen, dann `npm install && npm run check:db` → muss `✓ Datenbank bereit` melden (25 Probleme, Test-Cases vorhanden).
4. **.env anlegen** (in beiden Ordnern, Vorlage: `.env.example`):
   - `DATABASE_URL` (Neon-Connection-String)
   - `JWT_SECRET` (langer Zufallsstring, in **beiden** Ordnern identisch)
5. Installieren & starten:

```bash
cd backend/api && npm install && npm run dev        # REST-API auf :4000
cd backend/realtime && npm install && npm run dev   # Battles auf :4001
```

> **Hinweis:** Der API-Vertrag ist identisch zum Supabase-Stand auf `main` – das Frontend braucht keine Änderung, nur `NEXT_PUBLIC_USE_MOCK=false`.

## REST-API (`backend/api`)

Antwortformat immer `{ success: true, data }` / `{ success: false, error }`.

| Methode | Endpunkt | Beschreibung |
|---|---|---|
| POST | `/api/auth/register` | Registrierung (bcrypt-Hash, 201) |
| POST | `/api/auth/login` | Login (max. 5 Versuche/Min/IP) |
| POST | `/api/auth/refresh` | Neuer Access-Token via httpOnly-Refresh-Cookie |
| POST | `/api/auth/logout` | Refresh-Token löschen |
| GET | `/api/auth/me` | Eigener User (🔒) |
| PUT | `/api/auth/password` | 🔒 Passwort ändern (aktuelles PW nötig; andere Sessions werden abgemeldet) |
| DELETE | `/api/auth/account` | 🔒 Konto löschen (PW-Bestätigung; Cascade über Matches/Solo-Attempts) |
| GET | `/api/problems` | Liste inkl. `solved`/`best_score` (Token optional) |
| GET | `/api/problems/:id` | Detail + Test-Case-**Anzahl** (nie die Tests selbst) |
| POST | `/api/solo/start` | 🔒 Server-Timing-Session `{ session_id, problem, started_at }` |
| POST | `/api/solo/submit` | 🔒 Piston-Auswertung + serverseitige Dauer |
| GET | `/api/solo/stats` | 🔒 Gelöste Probleme + Bestzeiten |
| POST | `/api/battle/queue` | 🔒 Matchmaking-Queue beitreten |
| GET | `/api/battle/history` | 🔒 Vergangene Matches |
| POST | `/api/battle/finish` | 🔒 Match per REST abschließen (Fallback ohne Socket) |
| POST | `/api/battle/forfeit` | 🔒 Match aufgeben – zählt automatisch als Niederlage (ELO-Abzug) |
| GET | `/api/leaderboard` | ELO-Ranking mit Wins/Losses |

### Anti-Cheat (Solo)
- `started_at` kommt **nur** vom Server, Session-ID ist eine Server-UUID.
- Lösung < 5 Sekunden → Ablehnung (Cheating-Verdacht).
- > 15 Minuten → automatisch `timeout`/`failed`.
- Ein Submit pro Session, außer vorheriger Submit war ein Compile-Error.

### Sicherheit
helmet, CORS (nur `CLIENT_ORIGIN`), express-rate-limit (120 req/min global, 5 Logins/min), bcrypt (12 Runden), JWT Access-Token 15 min + Refresh-Token 30 Tage in httpOnly/secure/sameSite-strict Cookie, Zod-Validierung, parametrisierte SQL-Queries über `pg` (keine String-Concatenation), UUID-Formatprüfung vor DB-Zugriff, Refresh-Tokens serverseitig in DB (widerrufbar).

## Realtime (`backend/realtime`)

Socket.io-Events (Auth via `auth: { token: "<access_token>" }` beim Verbinden):

| Richtung | Event | Payload |
|---|---|---|
| Client → Server | `queue:join` | Callback `{ matched: bool }` |
| Client → Server | `queue:leave` | – |
| Server → Client | `battle:start` | `BattleMatch` (Problem, Gegner, Timer) |
| Client → Server | `battle:submit` | `{ code }`, Callback mit Testergebnis |
| Server → Client | `battle:event` | `BattleEvent` (opponent_fail/win/loss/timeout) |
| Server → Client | `battle:end` | `{ match_id, winner_id }` |

Matchmaking paart Spieler mit ähnlichem ELO (±200, wächst um +10/s Wartezeit). Disconnect = Aufgabe; Sieger-ELO wird sofort in Neon aktualisiert. Client kann zudem `battle:forfeit` senden (Aufgeben = Niederlage).

## Deployment (Free Tier, Branch `neon-migration`)
- API: Render (Root `backend/api`, Start: `node src/server.js`) – Env: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`
- Realtime: Render (Root `backend/realtime`) – WebSockets aktivieren, gleiche Envs
- Neon: Free Tier (0,5 GB) – Connection String **pooled** verwenden
- Frontend: Vercel, `NEXT_PUBLIC_API_URL` und `NEXT_PUBLIC_USE_MOCK=false` setzen
