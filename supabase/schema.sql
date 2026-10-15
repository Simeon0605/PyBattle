-- PyClash – Supabase / PostgreSQL Schema
-- In Supabase Dashboard → SQL Editor komplett ausführen.

create extension if not exists "pgcrypto";

-- ═══════════════ USERS ═══════════════
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  username      text not null unique,
  email         text not null unique,
  password_hash text not null,
  elo           int  not null default 1000,
  created_at    timestamptz not null default now()
);

-- ═══════════════ PROBLEMS ═══════════════
create table if not exists problems (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text not null,
  difficulty     text not null check (difficulty in ('easy','medium','hard')),
  starter_code   text not null,
  example_input  text not null,
  example_output text not null,
  created_at     timestamptz not null default now()
);

-- Versteckte Test-Cases (nur Anzahl geht an den Client!)
create table if not exists test_cases (
  id              uuid primary key default gen_random_uuid(),
  problem_id      uuid not null references problems(id) on delete cascade,
  input           jsonb not null,
  expected_output text not null
);
create index if not exists idx_test_cases_problem on test_cases(problem_id);

-- ═══════════════ SOLO ATTEMPTS (Server-Side-Timing) ═══════════════
create table if not exists solo_attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references users(id) on delete cascade,
  problem_id    uuid not null references problems(id) on delete cascade,
  started_at    timestamptz not null,
  finished_at   timestamptz,
  duration_ms   int,
  status        text not null default 'in_progress'
                check (status in ('in_progress','completed','failed','timeout')),
  code          text,
  best_score    int,
  last_was_compile_error boolean not null default false,
  submitted     boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists idx_solo_user_problem on solo_attempts(user_id, problem_id);

-- ═══════════════ MATCHES ═══════════════
create table if not exists matches (
  id                 uuid primary key default gen_random_uuid(),
  player1_id         uuid not null references users(id) on delete cascade,
  player2_id         uuid not null references users(id) on delete cascade,
  problem_id         uuid references problems(id) on delete set null,
  winner_id          uuid references users(id) on delete set null,
  started_at         timestamptz not null,
  finished_at        timestamptz,
  duration_ms        int,
  player1_elo_change int not null default 0,
  player2_elo_change int not null default 0,
  created_at         timestamptz not null default now()
);
create index if not exists idx_matches_p1 on matches(player1_id);
create index if not exists idx_matches_p2 on matches(player2_id);

-- ═══════════════ BATTLE QUEUE (Matchmaking) ═══════════════
create table if not exists battle_queue (
  user_id     uuid primary key references users(id) on delete cascade,
  joined_at   timestamptz not null default now(),
  elo_at_join int not null
);

-- ═══════════════ REFRESH TOKENS ═══════════════
create table if not exists refresh_tokens (
  token      uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_refresh_user on refresh_tokens(user_id);

-- ═══════════════ SEED: 3 Beispiel-Probleme ═══════════════
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('11111111-1111-1111-1111-111111111111', 'Two Sum',
'Gegeben ein Array `nums` und ein Ziel `target`, gib die Indizes zweier Zahlen zurück, die zusammen `target` ergeben.

Du darfst dasselbe Element nicht zweimal verwenden. Es gibt genau eine Lösung.',
'easy',
'def two_sum(nums, target):
    # TODO: Indizes zurückgeben
    pass
',
'nums = [2, 7, 11, 15], target = 9',
'[0, 1]')
on conflict (id) do nothing;

insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('22222222-2222-2222-2222-222222222222', 'Valid Parentheses',
'Prüfe, ob ein String aus Klammern `()[]{}` gültig ist.

Gültig heißt: jede öffnende Klammer hat eine schließende in der richtigen Reihenfolge.',
'easy',
'def is_valid(s):
    # TODO: True/False zurückgeben
    pass
',
's = "()[]{}"',
'True')
on conflict (id) do nothing;

insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('33333333-3333-3333-3333-333333333333', 'Longest Substring',
'Finde die Länge der längsten Teilzeichenkette ohne wiederholte Zeichen.',
'medium',
'def length_of_longest_substring(s):
    # TODO: Länge zurückgeben
    pass
',
's = "abcabcbb"',
'3')
on conflict (id) do nothing;

insert into test_cases (problem_id, input, expected_output) values
('11111111-1111-1111-1111-111111111111', '{"nums": [2,7,11,15], "target": 9}',   '[0, 1]'),
('11111111-1111-1111-1111-111111111111', '{"nums": [3,2,4], "target": 6}',        '[1, 2]'),
('11111111-1111-1111-1111-111111111111', '{"nums": [3,3], "target": 6}',          '[0, 1]'),
('11111111-1111-1111-1111-111111111111', '{"nums": [1,5,3,7], "target": 8}',      '[1, 3]'),
('11111111-1111-1111-1111-111111111111', '{"nums": [-1,-2,-3], "target": -5}',    '[1, 2]'),
('11111111-1111-1111-1111-111111111111', '{"nums": [0,4,3,0], "target": 0}',      '[0, 3]'),
('22222222-2222-2222-2222-222222222222', '{"s": "()[]{}"}', 'True'),
('22222222-2222-2222-2222-222222222222', '{"s": "(]"}',     'False'),
('22222222-2222-2222-2222-222222222222', '{"s": "()"}',     'True'),
('22222222-2222-2222-2222-222222222222', '{"s": "([)]"}',   'False'),
('22222222-2222-2222-2222-222222222222', '{"s": "{[]}"}',   'True'),
('22222222-2222-2222-2222-222222222222', '{"s": ""}',       'True'),
('22222222-2222-2222-2222-222222222222', '{"s": "("}',      'False'),
('22222222-2222-2222-2222-222222222222', '{"s": "]"}',      'False'),
('33333333-3333-3333-3333-333333333333', '{"s": "abcabcbb"}', '3'),
('33333333-3333-3333-3333-333333333333', '{"s": "bbbbb"}',    '1'),
('33333333-3333-3333-3333-333333333333', '{"s": "pwwkew"}',   '3'),
('33333333-3333-3333-3333-333333333333', '{"s": ""}',         '0'),
('33333333-3333-3333-3333-333333333333', '{"s": "au"}',       '2'),
('33333333-3333-3333-3333-333333333333', '{"s": "dvdf"}',     '3'),
('33333333-3333-3333-3333-333333333333', '{"s": "abba"}',     '2')
on conflict do nothing;

-- Wichtig: Service-Role-Key des Backends umgeht RLS.
-- Tabellen dennoch absichern, falls Supabase-Auto-API versehentlich aktiv ist:
alter table users enable row level security;
alter table problems enable row level security;
alter table test_cases enable row level security;
alter table solo_attempts enable row level security;
alter table matches enable row level security;
alter table battle_queue enable row level security;
alter table refresh_tokens enable row level security;
