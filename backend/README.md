# PyClash Backend

Das Backend besteht aus **zwei eigenständigen Diensten**, beide nutzen **Supabase (PostgreSQL)** als Datenbank:

```
backend/
├── api/        Express REST-API  (Port 4000) – Auth, Problems, Solo, Leaderboard, Battle-History
└── realtime/   Socket.io-Server  (Port 4001) – Matchmaking, Live-Battles, ELO
supabase/
└── schema.sql  Komplettes DB-Schema + Seed-Probleme (im Supabase SQL Editor ausführen)
```

## Setup

1. **Supabase**: Projekt anlegen → SQL Editor → Inhalt von `supabase/schema.sql` ausführen.
2. **.env anlegen** (in beiden Ordnern, Vorlage: `.env.example`):
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Settings → API; Service-Role-Key **nur** im Backend!)
   - `JWT_SECRET` (langer Zufallsstring, in **beiden** Ordnern identisch)
3. Installieren & starten:

```bash
cd backend/api && npm install && npm run dev        # REST-API auf :4000
cd backend/realtime && npm install && npm run dev   # Battles auf :4001
```

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
| GET | `/api/leaderboard` | ELO-Ranking mit Wins/Losses |

### Anti-Cheat (Solo)
- `started_at` kommt **nur** vom Server, Session-ID ist eine Server-UUID.
- Lösung < 5 Sekunden → Ablehnung (Cheating-Verdacht).
- > 15 Minuten → automatisch `timeout`/`failed`.
- Ein Submit pro Session, außer vorheriger Submit war ein Compile-Error.

### Sicherheit
helmet, CORS (nur `CLIENT_ORIGIN`), express-rate-limit (120 req/min global, 5 Logins/min), bcrypt (12 Runden), JWT Access-Token 15 min + Refresh-Token 30 Tage in httpOnly/secure/sameSite-strict Cookie, Zod-Validierung, Supabase-Client (kein SQL-Concatenation), Refresh-Tokens serverseitig in DB (widerrufbar).

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

Matchmaking paart Spieler mit ähnlichem ELO (±200, wächst um +10/s Wartezeit). Disconnect = Aufgabe; Sieger-ELO wird sofort in Supabase aktualisiert.

## Deployment (Free Tier)
- API: Render (Root `backend/api`, Start: `node src/server.js`)
- Realtime: Render (Root `backend/realtime`) – WebSockets aktivieren
- Supabase: Free (500 MB Postgres)
- Frontend: Vercel, `NEXT_PUBLIC_API_URL` und `NEXT_PUBLIC_USE_MOCK=false` setzen
