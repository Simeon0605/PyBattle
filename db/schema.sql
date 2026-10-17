-- PyClash – PostgreSQL Schema für NEON
-- Ausführen: Neon Dashboard → SQL Editor, oder: psql "$DATABASE_URL" -f db/schema.sql
-- (die Datei ist identisch zu supabase/schema.sql – dort läuft sie im Supabase SQL Editor)

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

-- ═══════════════ SEED: Die ersten 25 LeetCode-Probleme ═══════════════
-- expected_output ist immer exakt json.dumps(rueckgabe) (z. B. "[0, 1]",
-- "true", "\"bab\"", "2.0"), damit der Vergleich im Piston-Harness passt.

-- Alte Beispiel-Probleme entfernen (Idempotenz bei erneutem Ausführen)
delete from test_cases where problem_id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
);
delete from problems where id in (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555'
);

-- ── LC 1: Two Sum ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000001', 'Two Sum',
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

insert into test_cases (problem_id, input, expected_output) values
('00000000-0000-4000-8000-000000000001', '{"nums": [2,7,11,15], "target": 9}',   '[0, 1]'),
('00000000-0000-4000-8000-000000000001', '{"nums": [3,2,4], "target": 6}',       '[1, 2]'),
('00000000-0000-4000-8000-000000000001', '{"nums": [3,3], "target": 6}',         '[0, 1]'),
('00000000-0000-4000-8000-000000000001', '{"nums": [-1,-2,-3,-4,-5], "target": -8}', '[2, 4]')
on conflict do nothing;

-- ── LC 2: Add Two Numbers ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000002', 'Add Two Numbers',
'Zwei Zahlen sind als Arrays von Ziffern gegeben (kleinste Stelle zuerst). Beispiel: [2,4,3] steht für 342.

Gib die Summe beider Zahlen im selben Format zurück: [2,4,3] + [5,6,4] = [7,0,8], weil 342 + 465 = 807.',
'medium',
'def add_two_numbers(a, b):
    # TODO: Summe als Ziffern-Array (kleinste Stelle zuerst)
    pass
',
'a = [2, 4, 3], b = [5, 6, 4]',
'[7, 0, 8]')
on conflict (id) do nothing;

insert into test_cases (problem_id, input, expected_output) values
('00000000-0000-4000-8000-000000000002', '{"a": [2,4,3], "b": [5,6,4]}', '[7, 0, 8]'),
('00000000-0000-4000-8000-000000000002', '{"a": [0], "b": [0]}',         '[0]'),
('00000000-0000-4000-8000-000000000002', '{"a": [9,9,9,9,9,9,9], "b": [9,9,9,9]}', '[8, 9, 9, 9, 0, 0, 0, 1]'),
('00000000-0000-4000-8000-000000000002', '{"a": [5], "b": [5]}',         '[0, 1]')
on conflict do nothing;

-- ── LC 3: Longest Substring Without Repeating Characters ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000003', 'Longest Substring Without Repeating Characters',
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
('00000000-0000-4000-8000-000000000003', '{"s": "abcabcbb"}', '3'),
('00000000-0000-4000-8000-000000000003', '{"s": "bbbbb"}',    '1'),
('00000000-0000-4000-8000-000000000003', '{"s": "pwwkew"}',   '3'),
('00000000-0000-4000-8000-000000000003', '{"s": ""}',         '0'),
('00000000-0000-4000-8000-000000000003', '{"s": "dvdf"}',     '3'),
('00000000-0000-4000-8000-000000000003', '{"s": "abba"}',     '2')
on conflict do nothing;

-- ── LC 4: Median of Two Sorted Arrays ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000004', 'Median of Two Sorted Arrays',
'Gib den Median der beiden sortierten Arrays zurück – als Float (z. B. 2.0 oder 2.5).

Die optimale Laufzeit ist O(log(m+n)); korrekt ist aber auch ein einfacher Merge.',
'hard',
'def find_median_sorted_arrays(nums1, nums2):
    # TODO: Median als Float zurückgeben
    pass
',
'nums1 = [1, 3], nums2 = [2]',
'2.0')
on conflict (id) do nothing;

insert into test_cases (problem_id, input, expected_output) values
('00000000-0000-4000-8000-000000000004', '{"nums1": [1,3], "nums2": [2]}', '2.0'),
('00000000-0000-4000-8000-000000000004', '{"nums1": [1,2], "nums2": [3,4]}', '2.5'),
('00000000-0000-4000-8000-000000000004', '{"nums1": [0,0], "nums2": [0,0]}', '0.0'),
('00000000-0000-4000-8000-000000000004', '{"nums1": [], "nums2": [1]}',      '1.0')
on conflict do nothing;

-- ── LC 5: Longest Palindromic Substring ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000005', 'Longest Palindromic Substring',
'Gib die längste Teilzeichenkette von s zurück, die ein Palindrom ist. Bei mehreren längsten Palindromen gib die erste (linkeste) zurück.',
'medium',
'def longest_palindrome(s):
    # TODO: längstes Palindrom zurückgeben
    pass
',
's = "babad"',
'"bab"')
on conflict (id) do nothing;

insert into test_cases (problem_id, input, expected_output) values
('00000000-0000-4000-8000-000000000005', '{"s": "babad"}',   '"bab"'),
('00000000-0000-4000-8000-000000000005', '{"s": "cbbd"}',    '"bb"'),
('00000000-0000-4000-8000-000000000005', '{"s": "bananas"}', '"anana"'),
('00000000-0000-4000-8000-000000000005', '{"s": "abcda"}',   '"a"')
on conflict do nothing;

-- ── LC 6: Zigzag Conversion ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000006', 'Zigzag Conversion',
'Schreibe die Zeichen von s zeilenweise in ein Zigzag-Muster mit num_rows Zeilen und lies das Ergebnis dann Zeile für Zeile.

Beispiel: PAYPALISHIRING mit 3 Zeilen:
P   A   H   N
A P L S I I G
Y   I   R
Ergebnis: PAHNAPLSIIGYIR',
'medium',
'def convert(s, num_rows):
    # TODO: Zigzag-Ergebnis zurückgeben
    pass
',
's = "PAYPALISHIRING", num_rows = 3',
'"PAHNAPLSIIGYIR"')
on conflict (id) do nothing;

insert into test_cases (problem_id, input, expected_output) values
('00000000-0000-4000-8000-000000000006', '{"s": "PAYPALISHIRING", "num_rows": 3}', '"PAHNAPLSIIGYIR"'),
('00000000-0000-4000-8000-000000000006', '{"s": "PAYPALISHIRING", "num_rows": 4}', '"PINALSIGYAHRPI"'),
('00000000-0000-4000-8000-000000000006', '{"s": "A", "num_rows": 1}', '"A"'),
('00000000-0000-4000-8000-000000000006', '{"s": "AB", "num_rows": 1}', '"AB"')
on conflict do nothing;

-- ── LC 7: Reverse Integer ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000007', 'Reverse Integer',
'Drehe die Ziffern einer 32-Bit-Ganzzahl um. Vorzeichen bleiben erhalten.

Läuft das Ergebnis über den 32-Bit-Bereich [-2147483648, 2147483647], gib 0 zurück.',
'medium',
'def reverse(x):
    # TODO: umgedrehte 32-Bit-Ganzzahl
    pass
',
'x = 123',
'321')
on conflict (id) do nothing;

insert into test_cases (problem_id, input, expected_output) values
('00000000-0000-4000-8000-000000000007', '{"x": 123}', '321'),
('00000000-0000-4000-8000-000000000007', '{"x": -123}', '-321'),
('00000000-0000-4000-8000-000000000007', '{"x": 120}', '21'),
('00000000-0000-4000-8000-000000000007', '{"x": 1534236469}', '0')
on conflict do nothing;

-- ── LC 8: String to Integer (atoi) ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000008', 'String to Integer (atoi)',
'Implementiere String-zu-Integer (atoi): Überspringe führende Leerzeichen, lies ein optionales Vorzeichen und danach alle Ziffern.

Bei Überlauf clampe auf 2147483647 bzw. -2147483648. Steht vor den Ziffern etwas anderes als Leerzeichen/Vorzeichen, ist das Ergebnis 0.',
'medium',
'def my_atoi(s):
    # TODO: geparste Ganzzahl
    pass
',
's = "42"',
'42')
on conflict (id) do nothing;

insert into test_cases (problem_id, input, expected_output) values
('00000000-0000-4000-8000-000000000008', '{"s": "42"}', '42'),
('00000000-0000-4000-8000-000000000008', '{"s": "   -42"}', '-42'),
('00000000-0000-4000-8000-000000000008', '{"s": "4193 with words"}', '4193'),
('00000000-0000-4000-8000-000000000008', '{"s": "-91283472332"}', '-2147483648')
on conflict do nothing;

-- ── LC 9: Palindrome Number ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000009', 'Palindrome Number',
'Prüfe, ob eine Ganzzahl ein Palindrom ist (vorwärts wie rückwärts gleich). Negative Zahlen sind keine Palindrome. Rückgabe True/False.',
'easy',
'def is_palindrome(x):
    # TODO: True/False
    pass
',
'x = 121',
'true')
on conflict (id) do nothing;

insert into test_cases (problem_id, input, expected_output) values
('00000000-0000-4000-8000-000000000009', '{"x": 121}',  'true'),
('00000000-0000-4000-8000-000000000009', '{"x": -121}', 'false'),
('00000000-0000-4000-8000-000000000009', '{"x": 10}',   'false'),
('00000000-0000-4000-8000-000000000009', '{"x": 0}',    'true')
on conflict do nothing;

-- ── LC 10: Regular Expression Matching ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000010', 'Regular Expression Matching',
'Implementiere Regex-Matching mit Unterstützung für Punkt und Stern:
Der Punkt trifft genau ein beliebiges Zeichen.
Der Stern trifft null oder mehr des vorherigen Zeichens.

Der Match muss die gesamte Zeichenkette s umfassen. Rückgabe True/False.',
'hard',
'def is_match(s, p):
    # TODO: True/False
    pass
',
's = "aa", p = "a*"',
'true')
on conflict (id) do nothing;

insert into test_cases (problem_id, input, expected_output) values
('00000000-0000-4000-8000-000000000010', '{"s": "aa", "p": "a"}',          'false'),
('00000000-0000-4000-8000-000000000010', '{"s": "aa", "p": "a*"}',         'true'),
('00000000-0000-4000-8000-000000000010', '{"s": "ab", "p": ".*"}',         'true'),
('00000000-0000-4000-8000-000000000010', '{"s": "aab", "p": "c*a*b"}',     'true')
on conflict do nothing;

-- ── LC 11: Container With Most Water ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000011', 'Container With Most Water',
'Gegeben ein Array height, wobei height[i] die Höhe einer Wand an Position i ist. Wähle zwei Wände so, dass der Behälter das meiste Wasser fasst.

Die Fläche ist min(height[i], height[j]) multipliziert mit dem Abstand (j - i). Gib die maximale Fläche zurück.',
'medium',
'def max_area(height):
    # TODO: maximale Fläche
    pass
',
'height = [1, 8, 6, 2, 5, 4, 8, 3, 7]',
'49')
on conflict (id) do nothing;

insert into test_cases (problem_id, input, expected_output) values
('00000000-0000-4000-8000-000000000011', '{"height": [1,8,6,2,5,4,8,3,7]}', '49'),
('00000000-0000-4000-8000-000000000011', '{"height": [1,1]}', '1'),
('00000000-0000-4000-8000-000000000011', '{"height": [4,3,2,1,4]}', '16')
on conflict do nothing;

-- ── LC 12: Integer to Roman ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000012', 'Integer to Roman',
'Wandle eine Zahl (1-3999) in eine römische Zahl um. Verwende die Symbole I, V, X, L, C, D, M inklusive Subtraktionsform (IV, IX, XL, XC, CD, CM).',
'medium',
'def int_to_roman(num):
    # TODO: römische Zahl als String
    pass
',
'num = 1994',
'"MCMXCIV"')
on conflict (id) do nothing;

insert into test_cases (problem_id, input, expected_output) values
('00000000-0000-4000-8000-000000000012', '{"num": 3}',    '"III"'),
('00000000-0000-4000-8000-000000000012', '{"num": 58}',   '"LVIII"'),
('00000000-0000-4000-8000-000000000012', '{"num": 1994}', '"MCMXCIV"')
on conflict do nothing;

-- ── LC 13: Roman to Integer ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000013', 'Roman to Integer',
'Wandle eine römische Zahl (I, V, X, L, C, D, M inklusive Subtraktionsform) in eine Ganzzahl um.',
'easy',
'def roman_to_int(s):
    # TODO: Ganzzahl
    pass
',
's = "MCMXCIV"',
'1994')
on conflict (id) do nothing;

insert into test_cases (problem_id, input, expected_output) values
('00000000-0000-4000-8000-000000000013', '{"s": "III"}',    '3'),
('00000000-0000-4000-8000-000000000013', '{"s": "LVIII"}',  '58'),
('00000000-0000-4000-8000-000000000013', '{"s": "MCMXCIV"}', '1994')
on conflict do nothing;

-- ── LC 14: Longest Common Prefix ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000014', 'Longest Common Prefix',
'Finde den längsten gemeinsamen Präfix aller Strings im Array strs. Gibt es keinen, gib einen leeren String zurück.',
'easy',
'def longest_common_prefix(strs):
    # TODO: längster gemeinsamer Präfix
    pass
',
'strs = ["flower", "flow", "flight"]',
'"fl"')
on conflict (id) do nothing;

insert into test_cases (problem_id, input, expected_output) values
('00000000-0000-4000-8000-000000000014', '{"strs": ["flower","flow","flight"]}', '"fl"'),
('00000000-0000-4000-8000-000000000014', '{"strs": ["dog","racecar","car"]}', '""'),
('00000000-0000-4000-8000-000000000014', '{"strs": ["single"]}', '"single"')
on conflict do nothing;

-- ── LC 15: 3Sum ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000015', '3Sum',
'Gib alle eindeutigen Triplets [a, b, c] aus nums zurück, deren Summe 0 ist.

Sortiere jedes Triplet aufsteigend und die Ergebnisliste lexikografisch. Kein Triplet darf doppelt vorkommen.',
'medium',
'def three_sum(nums):
    # TODO: sortierte Triplets
    pass
',
'nums = [-1, 0, 1, 2, -1, -4]',
'[[-1, -1, 2], [-1, 0, 1]]')
on conflict (id) do nothing;

insert into test_cases (problem_id, input, expected_output) values
('00000000-0000-4000-8000-000000000015', '{"nums": [-1,0,1,2,-1,-4]}', '[[-1, -1, 2], [-1, 0, 1]]'),
('00000000-0000-4000-8000-000000000015', '{"nums": [0,1,1]}', '[]'),
('00000000-0000-4000-8000-000000000015', '{"nums": [0,0,0]}', '[[0, 0, 0]]')
on conflict do nothing;

-- ── LC 16: 3Sum Closest ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000016', '3Sum Closest',
'Finde die Summe von drei Zahlen aus nums, die der Zielzahl target am nächsten liegt. Es gibt genau eine nächstliegende Summe. Rückgabe: die Summe als Ganzzahl.',
'medium',
'def three_sum_closest(nums, target):
    # TODO: nächstliegende Summe
    pass
',
'nums = [-1, 2, 1, -4], target = 1',
'2')
on conflict (id) do nothing;

insert into test_cases (problem_id, input, expected_output) values
('00000000-0000-4000-8000-000000000016', '{"nums": [-1,2,1,-4], "target": 1}',   '2'),
('00000000-0000-4000-8000-000000000016', '{"nums": [0,0,0], "target": 1}',       '0'),
('00000000-0000-4000-8000-000000000016', '{"nums": [1,1,1,0], "target": -100}',  '2')
on conflict do nothing;

-- ── LC 17: Letter Combinations of a Phone Number ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000017', 'Letter Combinations of a Phone Number',
'Gib alle möglichen Buchstabenkombinationen zurück, die die Ziffern digits (2-9) auf einer Telefontastatur repräsentieren.

Belegung je Taste: 2=abc, 3=def, 4=ghi, 5=jkl, 6=mno, 7=pqrs, 8=tuv, 9=wxyz. Kombiniere in der Reihenfolge der Ziffern und Buchstaben. Bei leerem Input: leere Liste.',
'medium',
'def letter_combinations(digits):
    # TODO: Buchstabenkombinationen
    pass
',
'digits = "23"',
'["ad", "ae", "af", "bd", "be", "bf", "cd", "ce", "cf"]')
on conflict (id) do nothing;

insert into test_cases (problem_id, input, expected_output) values
('00000000-0000-4000-8000-000000000017', '{"digits": "23"}', '["ad", "ae", "af", "bd", "be", "bf", "cd", "ce", "cf"]'),
('00000000-0000-4000-8000-000000000017', '{"digits": ""}', '[]'),
('00000000-0000-4000-8000-000000000017', '{"digits": "2"}', '["a", "b", "c"]')
on conflict do nothing;

-- ── LC 18: 4Sum ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000018', '4Sum',
'Gib alle eindeutigen Quadruplets [a, b, c, d] aus nums zurück, deren Summe target ist.

Sortiere jedes Quadruplet aufsteigend und die Ergebnisliste lexikografisch. Kein Quadruplet darf doppelt vorkommen.',
'medium',
'def four_sum(nums, target):
    # TODO: sortierte Quadruplets
    pass
',
'nums = [1, 0, -1, 0, -2, 2], target = 0',
'[[-2, -1, 1, 2], [-2, 0, 0, 2], [-1, 0, 0, 1]]')
on conflict (id) do nothing;

insert into test_cases (problem_id, input, expected_output) values
('00000000-0000-4000-8000-000000000018', '{"nums": [1,0,-1,0,-2,2], "target": 0}', '[[-2, -1, 1, 2], [-2, 0, 0, 2], [-1, 0, 0, 1]]'),
('00000000-0000-4000-8000-000000000018', '{"nums": [2,2,2,2,2], "target": 8}', '[[2, 2, 2, 2]]')
on conflict do nothing;

-- ── LC 19: Remove Nth Node From End of List ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000019', 'Remove Nth Node From End of List',
'Die Liste ist als Array gegeben. Entferne das n-te Element von hinten und gib die Liste als Array zurück. In einem Durchlauf möglich (n = Listenlänge ist erlaubt).',
'medium',
'def remove_nth_from_end(head, n):
    # TODO: Liste ohne n-tes Element von hinten
    pass
',
'head = [1, 2, 3, 4, 5], n = 2',
'[1, 2, 3, 5]')
on conflict (id) do nothing;

insert into test_cases (problem_id, input, expected_output) values
('00000000-0000-4000-8000-000000000019', '{"head": [1,2,3,4,5], "n": 2}', '[1, 2, 3, 5]'),
('00000000-0000-4000-8000-000000000019', '{"head": [1], "n": 1}', '[]'),
('00000000-0000-4000-8000-000000000019', '{"head": [1,2], "n": 1}', '[1]'),
('00000000-0000-4000-8000-000000000019', '{"head": [1,2], "n": 2}', '[2]')
on conflict do nothing;

-- ── LC 20: Valid Parentheses ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000020', 'Valid Parentheses',
'Prüfe, ob ein String aus Klammern ()[]{} gültig ist.

Gültig heißt: jede öffnende Klammer hat eine schließende in der richtigen Reihenfolge. Rückgabe True/False.',
'easy',
'def is_valid(s):
    # TODO: True/False
    pass
',
's = "()[]{}"',
'true')
on conflict (id) do nothing;

insert into test_cases (problem_id, input, expected_output) values
('00000000-0000-4000-8000-000000000020', '{"s": "()[]{}"}', 'true'),
('00000000-0000-4000-8000-000000000020', '{"s": "(]"}',     'false'),
('00000000-0000-4000-8000-000000000020', '{"s": "([)]"}',   'false'),
('00000000-0000-4000-8000-000000000020', '{"s": "{[]}"}',   'true'),
('00000000-0000-4000-8000-000000000020', '{"s": ""}',       'true'),
('00000000-0000-4000-8000-000000000020', '{"s": "()"}',     'true')
on conflict do nothing;

-- ── LC 21: Merge Two Sorted Lists ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000021', 'Merge Two Sorted Lists',
'Zwei sortierte Listen sind als Arrays gegeben. Mische sie zu einer sortierten Liste und gib sie als Array zurück.',
'easy',
'def merge_two_lists(a, b):
    # TODO: gemischte sortierte Liste
    pass
',
'a = [1, 2, 4], b = [1, 3, 4]',
'[1, 1, 2, 3, 4, 4]')
on conflict (id) do nothing;

insert into test_cases (problem_id, input, expected_output) values
('00000000-0000-4000-8000-000000000021', '{"a": [1,2,4], "b": [1,3,4]}', '[1, 1, 2, 3, 4, 4]'),
('00000000-0000-4000-8000-000000000021', '{"a": [], "b": []}', '[]'),
('00000000-0000-4000-8000-000000000021', '{"a": [5], "b": [1,2,3]}', '[1, 2, 3, 5]')
on conflict do nothing;

-- ── LC 22: Generate Parentheses ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000022', 'Generate Parentheses',
'Gib für n Paare alle gültigen Kombinationen gut formatierter Klammern zurück – in der Reihenfolge, die entsteht, wenn pro Schritt zuerst eine öffnende und dann eine schließende Klammer probiert wird.',
'medium',
'def generate_parenthesis(n):
    # TODO: gültige Kombinationen
    pass
',
'n = 3',
'["((()))", "(()())", "(())()", "()(())", "()()()"]')
on conflict (id) do nothing;

insert into test_cases (problem_id, input, expected_output) values
('00000000-0000-4000-8000-000000000022', '{"n": 3}', '["((()))", "(()())", "(())()", "()(())", "()()()"]'),
('00000000-0000-4000-8000-000000000022', '{"n": 1}', '["()"]'),
('00000000-0000-4000-8000-000000000022', '{"n": 2}', '["(())", "()()"]')
on conflict do nothing;

-- ── LC 23: Merge k Sorted Lists ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000023', 'Merge k Sorted Lists',
'Gegeben ein Array aus sortierten Arrays, mische alle zu einem sortierten Array.',
'hard',
'def merge_k_lists(lists):
    # TODO: gemischtes sortiertes Array
    pass
',
'lists = [[1, 4, 5], [1, 3, 4], [2, 6]]',
'[1, 1, 2, 3, 4, 4, 5, 6]')
on conflict (id) do nothing;

insert into test_cases (problem_id, input, expected_output) values
('00000000-0000-4000-8000-000000000023', '{"lists": [[1,4,5],[1,3,4],[2,6]]}', '[1, 1, 2, 3, 4, 4, 5, 6]'),
('00000000-0000-4000-8000-000000000023', '{"lists": []}', '[]'),
('00000000-0000-4000-8000-000000000023', '{"lists": [[]]}', '[]')
on conflict do nothing;

-- ── LC 24: Swap Nodes in Pairs ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000024', 'Swap Nodes in Pairs',
'Die Liste ist als Array gegeben. Tausche benachbarte Elemente paarweise (1. mit 2., 3. mit 4., ...) und gib die Liste zurück. Ein einzelnes letztes Element bleibt stehen.',
'medium',
'def swap_pairs(head):
    # TODO: paarweise getauschte Liste
    pass
',
'head = [1, 2, 3, 4]',
'[2, 1, 4, 3]')
on conflict (id) do nothing;

insert into test_cases (problem_id, input, expected_output) values
('00000000-0000-4000-8000-000000000024', '{"head": [1,2,3,4]}', '[2, 1, 4, 3]'),
('00000000-0000-4000-8000-000000000024', '{"head": []}', '[]'),
('00000000-0000-4000-8000-000000000024', '{"head": [1]}', '[1]'),
('00000000-0000-4000-8000-000000000024', '{"head": [1,2,3]}', '[2, 1, 3]')
on conflict do nothing;

-- ── LC 25: Reverse Nodes in k-Group ──
insert into problems (id, title, description, difficulty, starter_code, example_input, example_output) values
('00000000-0000-4000-8000-000000000025', 'Reverse Nodes in k-Group',
'Die Liste ist als Array gegeben. Drehe die Elemente in Gruppen von k um. Bleibt am Ende eine unvollständige Gruppe, bleibt sie unverändert. Gib die Liste als Array zurück.',
'hard',
'def reverse_k_group(head, k):
    # TODO: in k-Gruppen umgedrehte Liste
    pass
',
'head = [1, 2, 3, 4, 5], k = 2',
'[2, 1, 4, 3, 5]')
on conflict (id) do nothing;

insert into test_cases (problem_id, input, expected_output) values
('00000000-0000-4000-8000-000000000025', '{"head": [1,2,3,4,5], "k": 2}', '[2, 1, 4, 3, 5]'),
('00000000-0000-4000-8000-000000000025', '{"head": [1,2,3,4,5], "k": 3}', '[3, 2, 1, 4, 5]'),
('00000000-0000-4000-8000-000000000025', '{"head": [1,2,3,4,5], "k": 1}', '[1, 2, 3, 4, 5]'),
('00000000-0000-4000-8000-000000000025', '{"head": [1], "k": 1}', '[1]')
on conflict do nothing;

-- RLS: Auf Supabase als Schutz falls die Auto-API versehentlich aktiv ist
-- (das Backend nutzt den Service-Role-Key / auf Neon den Owner-Connection-String).
alter table users enable row level security;
alter table problems enable row level security;
alter table test_cases enable row level security;
alter table solo_attempts enable row level security;
alter table matches enable row level security;
alter table battle_queue enable row level security;
alter table refresh_tokens enable row level security;
