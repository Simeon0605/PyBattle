import type {
  ApiResponse,
  BattleMatch,
  Difficulty,
  LeaderboardEntry,
  MatchHistoryItem,
  Problem,
  ProblemListItem,
  SoloSession,
  SoloStats,
  SoloSubmitResult,
  User,
} from "./types";

type StoredUser = User & { password: string };

type SoloAttempt = {
  session_id: string;
  user_id: string;
  problem_id: string;
  started_at: number;
  finished_at?: number;
  duration_ms?: number;
  status: "in_progress" | "completed" | "failed" | "timeout";
  code?: string;
  last_was_compile_error?: boolean;
  submitted?: boolean;
};

type MockDb = {
  users: StoredUser[];
  refresh: Record<string, string>;
  attempts: SoloAttempt[];
  matches: MatchHistoryItem[];
};

const DB_KEY = "pyclash_mock_db";
const MIN_MS = 5_000;
const MAX_MS = 15 * 60 * 1000;

type ProblemSeed = {
  id: string;
  title: string;
  difficulty: Difficulty;
  test_case_count: number;
  description: string;
  starter_code: string;
  example_input: string;
  example_output: string;
};

// Die ersten 25 LeetCode-Probleme – identisch mit supabase/schema.sql
// (gleiche IDs), damit Mock- und Echt-Modus dasselbe Problem-Set zeigen.
const SEEDS: ProblemSeed[] = [
  { id: "00000000-0000-4000-8000-000000000001", title: "Two Sum", difficulty: "easy", test_case_count: 4,
    description: "Gegeben ein Array `nums` und ein Ziel `target`, gib die Indizes zweier Zahlen zurück, die zusammen `target` ergeben.\n\nDu darfst dasselbe Element nicht zweimal verwenden. Es gibt genau eine Lösung.",
    starter_code: "def two_sum(nums, target):\n    # TODO: Indizes zurückgeben\n    pass\n",
    example_input: "nums = [2, 7, 11, 15], target = 9", example_output: "[0, 1]" },
  { id: "00000000-0000-4000-8000-000000000002", title: "Add Two Numbers", difficulty: "medium", test_case_count: 4,
    description: "Zwei Zahlen sind als Arrays von Ziffern gegeben (kleinste Stelle zuerst). Beispiel: [2,4,3] steht für 342.\n\nGib die Summe beider Zahlen im selben Format zurück: [2,4,3] + [5,6,4] = [7,0,8], weil 342 + 465 = 807.",
    starter_code: "def add_two_numbers(a, b):\n    # TODO: Summe als Ziffern-Array (kleinste Stelle zuerst)\n    pass\n",
    example_input: "a = [2, 4, 3], b = [5, 6, 4]", example_output: "[7, 0, 8]" },
  { id: "00000000-0000-4000-8000-000000000003", title: "Longest Substring Without Repeating Characters", difficulty: "medium", test_case_count: 6,
    description: "Finde die Länge der längsten Teilzeichenkette ohne wiederholte Zeichen.",
    starter_code: "def length_of_longest_substring(s):\n    # TODO: Länge zurückgeben\n    pass\n",
    example_input: 's = "abcabcbb"', example_output: "3" },
  { id: "00000000-0000-4000-8000-000000000004", title: "Median of Two Sorted Arrays", difficulty: "hard", test_case_count: 4,
    description: "Gib den Median der beiden sortierten Arrays zurück – als Float (z. B. 2.0 oder 2.5).\n\nDie optimale Laufzeit ist O(log(m+n)); korrekt ist aber auch ein einfacher Merge.",
    starter_code: "def find_median_sorted_arrays(nums1, nums2):\n    # TODO: Median als Float zurückgeben\n    pass\n",
    example_input: "nums1 = [1, 3], nums2 = [2]", example_output: "2.0" },
  { id: "00000000-0000-4000-8000-000000000005", title: "Longest Palindromic Substring", difficulty: "medium", test_case_count: 4,
    description: "Gib die längste Teilzeichenkette von s zurück, die ein Palindrom ist. Bei mehreren längsten Palindromen gib die erste (linkeste) zurück.",
    starter_code: "def longest_palindrome(s):\n    # TODO: längstes Palindrom zurückgeben\n    pass\n",
    example_input: 's = "babad"', example_output: '"bab"' },
  { id: "00000000-0000-4000-8000-000000000006", title: "Zigzag Conversion", difficulty: "medium", test_case_count: 4,
    description: "Schreibe die Zeichen von s zeilenweise in ein Zigzag-Muster mit num_rows Zeilen und lies das Ergebnis dann Zeile für Zeile.\n\nBeispiel: PAYPALISHIRING mit 3 Zeilen:\nP   A   H   N\nA P L S I I G\nY   I   R\nErgebnis: PAHNAPLSIIGYIR",
    starter_code: "def convert(s, num_rows):\n    # TODO: Zigzag-Ergebnis zurückgeben\n    pass\n",
    example_input: 's = "PAYPALISHIRING", num_rows = 3', example_output: '"PAHNAPLSIIGYIR"' },
  { id: "00000000-0000-4000-8000-000000000007", title: "Reverse Integer", difficulty: "medium", test_case_count: 4,
    description: "Drehe die Ziffern einer 32-Bit-Ganzzahl um. Vorzeichen bleiben erhalten.\n\nLäuft das Ergebnis über den 32-Bit-Bereich [-2147483648, 2147483647], gib 0 zurück.",
    starter_code: "def reverse(x):\n    # TODO: umgedrehte 32-Bit-Ganzzahl\n    pass\n",
    example_input: "x = 123", example_output: "321" },
  { id: "00000000-0000-4000-8000-000000000008", title: "String to Integer (atoi)", difficulty: "medium", test_case_count: 4,
    description: "Implementiere String-zu-Integer (atoi): Überspringe führende Leerzeichen, lies ein optionales Vorzeichen und danach alle Ziffern.\n\nBei Überlauf clampe auf 2147483647 bzw. -2147483648. Steht vor den Ziffern etwas anderes als Leerzeichen/Vorzeichen, ist das Ergebnis 0.",
    starter_code: "def my_atoi(s):\n    # TODO: geparste Ganzzahl\n    pass\n",
    example_input: 's = "42"', example_output: "42" },
  { id: "00000000-0000-4000-8000-000000000009", title: "Palindrome Number", difficulty: "easy", test_case_count: 4,
    description: "Prüfe, ob eine Ganzzahl ein Palindrom ist (vorwärts wie rückwärts gleich). Negative Zahlen sind keine Palindrome. Rückgabe True/False.",
    starter_code: "def is_palindrome(x):\n    # TODO: True/False\n    pass\n",
    example_input: "x = 121", example_output: "true" },
  { id: "00000000-0000-4000-8000-000000000010", title: "Regular Expression Matching", difficulty: "hard", test_case_count: 4,
    description: "Implementiere Regex-Matching mit Unterstützung für Punkt und Stern:\nDer Punkt trifft genau ein beliebiges Zeichen.\nDer Stern trifft null oder mehr des vorherigen Zeichens.\n\nDer Match muss die gesamte Zeichenkette s umfassen. Rückgabe True/False.",
    starter_code: "def is_match(s, p):\n    # TODO: True/False\n    pass\n",
    example_input: 's = "aa", p = "a*"', example_output: "true" },
  { id: "00000000-0000-4000-8000-000000000011", title: "Container With Most Water", difficulty: "medium", test_case_count: 3,
    description: "Gegeben ein Array height, wobei height[i] die Höhe einer Wand an Position i ist. Wähle zwei Wände so, dass der Behälter das meiste Wasser fasst.\n\nDie Fläche ist min(height[i], height[j]) multipliziert mit dem Abstand (j - i). Gib die maximale Fläche zurück.",
    starter_code: "def max_area(height):\n    # TODO: maximale Fläche\n    pass\n",
    example_input: "height = [1, 8, 6, 2, 5, 4, 8, 3, 7]", example_output: "49" },
  { id: "00000000-0000-4000-8000-000000000012", title: "Integer to Roman", difficulty: "medium", test_case_count: 3,
    description: "Wandle eine Zahl (1-3999) in eine römische Zahl um. Verwende die Symbole I, V, X, L, C, D, M inklusive Subtraktionsform (IV, IX, XL, XC, CD, CM).",
    starter_code: "def int_to_roman(num):\n    # TODO: römische Zahl als String\n    pass\n",
    example_input: "num = 1994", example_output: '"MCMXCIV"' },
  { id: "00000000-0000-4000-8000-000000000013", title: "Roman to Integer", difficulty: "easy", test_case_count: 3,
    description: "Wandle eine römische Zahl (I, V, X, L, C, D, M inklusive Subtraktionsform) in eine Ganzzahl um.",
    starter_code: "def roman_to_int(s):\n    # TODO: Ganzzahl\n    pass\n",
    example_input: 's = "MCMXCIV"', example_output: "1994" },
  { id: "00000000-0000-4000-8000-000000000014", title: "Longest Common Prefix", difficulty: "easy", test_case_count: 3,
    description: "Finde den längsten gemeinsamen Präfix aller Strings im Array strs. Gibt es keinen, gib einen leeren String zurück.",
    starter_code: "def longest_common_prefix(strs):\n    # TODO: längster gemeinsamer Präfix\n    pass\n",
    example_input: 'strs = ["flower", "flow", "flight"]', example_output: '"fl"' },
  { id: "00000000-0000-4000-8000-000000000015", title: "3Sum", difficulty: "medium", test_case_count: 3,
    description: "Gib alle eindeutigen Triplets [a, b, c] aus nums zurück, deren Summe 0 ist.\n\nSortiere jedes Triplet aufsteigend und die Ergebnisliste lexikografisch. Kein Triplet darf doppelt vorkommen.",
    starter_code: "def three_sum(nums):\n    # TODO: sortierte Triplets\n    pass\n",
    example_input: "nums = [-1, 0, 1, 2, -1, -4]", example_output: "[[-1, -1, 2], [-1, 0, 1]]" },
  { id: "00000000-0000-4000-8000-000000000016", title: "3Sum Closest", difficulty: "medium", test_case_count: 3,
    description: "Finde die Summe von drei Zahlen aus nums, die der Zielzahl target am nächsten liegt. Es gibt genau eine nächstliegende Summe. Rückgabe: die Summe als Ganzzahl.",
    starter_code: "def three_sum_closest(nums, target):\n    # TODO: nächstliegende Summe\n    pass\n",
    example_input: "nums = [-1, 2, 1, -4], target = 1", example_output: "2" },
  { id: "00000000-0000-4000-8000-000000000017", title: "Letter Combinations of a Phone Number", difficulty: "medium", test_case_count: 3,
    description: "Gib alle möglichen Buchstabenkombinationen zurück, die die Ziffern digits (2-9) auf einer Telefontastatur repräsentieren.\n\nBelegung je Taste: 2=abc, 3=def, 4=ghi, 5=jkl, 6=mno, 7=pqrs, 8=tuv, 9=wxyz. Kombiniere in der Reihenfolge der Ziffern und Buchstaben. Bei leerem Input: leere Liste.",
    starter_code: "def letter_combinations(digits):\n    # TODO: Buchstabenkombinationen\n    pass\n",
    example_input: 'digits = "23"', example_output: '["ad", "ae", "af", "bd", "be", "bf", "cd", "ce", "cf"]' },
  { id: "00000000-0000-4000-8000-000000000018", title: "4Sum", difficulty: "medium", test_case_count: 2,
    description: "Gib alle eindeutigen Quadruplets [a, b, c, d] aus nums zurück, deren Summe target ist.\n\nSortiere jedes Quadruplet aufsteigend und die Ergebnisliste lexikografisch. Kein Quadruplet darf doppelt vorkommen.",
    starter_code: "def four_sum(nums, target):\n    # TODO: sortierte Quadruplets\n    pass\n",
    example_input: "nums = [1, 0, -1, 0, -2, 2], target = 0", example_output: "[[-2, -1, 1, 2], [-2, 0, 0, 2], [-1, 0, 0, 1]]" },
  { id: "00000000-0000-4000-8000-000000000019", title: "Remove Nth Node From End of List", difficulty: "medium", test_case_count: 4,
    description: "Die Liste ist als Array gegeben. Entferne das n-te Element von hinten und gib die Liste als Array zurück. In einem Durchlauf möglich (n = Listenlänge ist erlaubt).",
    starter_code: "def remove_nth_from_end(head, n):\n    # TODO: Liste ohne n-tes Element von hinten\n    pass\n",
    example_input: "head = [1, 2, 3, 4, 5], n = 2", example_output: "[1, 2, 3, 5]" },
  { id: "00000000-0000-4000-8000-000000000020", title: "Valid Parentheses", difficulty: "easy", test_case_count: 6,
    description: "Prüfe, ob ein String aus Klammern ()[]{} gültig ist.\n\nGültig heißt: jede öffnende Klammer hat eine schließende in der richtigen Reihenfolge. Rückgabe True/False.",
    starter_code: "def is_valid(s):\n    # TODO: True/False\n    pass\n",
    example_input: 's = "()[]{}"', example_output: "true" },
  { id: "00000000-0000-4000-8000-000000000021", title: "Merge Two Sorted Lists", difficulty: "easy", test_case_count: 3,
    description: "Zwei sortierte Listen sind als Arrays gegeben. Mische sie zu einer sortierten Liste und gib sie als Array zurück.",
    starter_code: "def merge_two_lists(a, b):\n    # TODO: gemischte sortierte Liste\n    pass\n",
    example_input: "a = [1, 2, 4], b = [1, 3, 4]", example_output: "[1, 1, 2, 3, 4, 4]" },
  { id: "00000000-0000-4000-8000-000000000022", title: "Generate Parentheses", difficulty: "medium", test_case_count: 3,
    description: "Gib für n Paare alle gültigen Kombinationen gut formatierter Klammern zurück – in der Reihenfolge, die entsteht, wenn pro Schritt zuerst eine öffnende und dann eine schließende Klammer probiert wird.",
    starter_code: "def generate_parenthesis(n):\n    # TODO: gültige Kombinationen\n    pass\n",
    example_input: "n = 3", example_output: '["((()))", "(()())", "(())()", "()(())", "()()()"]' },
  { id: "00000000-0000-4000-8000-000000000023", title: "Merge k Sorted Lists", difficulty: "hard", test_case_count: 3,
    description: "Gegeben ein Array aus sortierten Arrays, mische alle zu einem sortierten Array.",
    starter_code: "def merge_k_lists(lists):\n    # TODO: gemischtes sortiertes Array\n    pass\n",
    example_input: "lists = [[1, 4, 5], [1, 3, 4], [2, 6]]", example_output: "[1, 1, 2, 3, 4, 4, 5, 6]" },
  { id: "00000000-0000-4000-8000-000000000024", title: "Swap Nodes in Pairs", difficulty: "medium", test_case_count: 4,
    description: "Die Liste ist als Array gegeben. Tausche benachbarte Elemente paarweise (1. mit 2., 3. mit 4., ...) und gib die Liste zurück. Ein einzelnes letztes Element bleibt stehen.",
    starter_code: "def swap_pairs(head):\n    # TODO: paarweise getauschte Liste\n    pass\n",
    example_input: "head = [1, 2, 3, 4]", example_output: "[2, 1, 4, 3]" },
  { id: "00000000-0000-4000-8000-000000000025", title: "Reverse Nodes in k-Group", difficulty: "hard", test_case_count: 4,
    description: "Die Liste ist als Array gegeben. Drehe die Elemente in Gruppen von k um. Bleibt am Ende eine unvollständige Gruppe, bleibt sie unverändert. Gib die Liste als Array zurück.",
    starter_code: "def reverse_k_group(head, k):\n    # TODO: in k-Gruppen umgedrehte Liste\n    pass\n",
    example_input: "head = [1, 2, 3, 4, 5], k = 2", example_output: "[2, 1, 4, 3, 5]" },
];

const PROBLEMS: Problem[] = SEEDS.map((s) => ({ ...s, solved: false, best_score: null }));

const BOT_USERS: StoredUser[] = [
  demoUser("nova", 1420, 12),
  demoUser("bytefox", 1388, 18),
  demoUser("pyro", 1310, 40),
  demoUser("lambda", 1274, 55),
  demoUser("stackcat", 1190, 80),
  demoUser("nullptr", 1102, 120),
];

function demoUser(name: string, elo: number, daysAgo: number): StoredUser {
  const created = new Date(Date.now() - daysAgo * 86400000).toISOString();
  return {
    id: crypto.randomUUID(),
    username: name,
    email: `${name}@pyclash.dev`,
    password: "demo",
    elo,
    created_at: created,
  };
}

function loadDb(): MockDb {
  if (typeof window === "undefined") {
    return { users: [...BOT_USERS], refresh: {}, attempts: [], matches: [] };
  }
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const db: MockDb = { users: [...BOT_USERS], refresh: {}, attempts: [], matches: [] };
    saveDb(db);
    return db;
  }
  try {
    return JSON.parse(raw) as MockDb;
  } catch {
    const db: MockDb = { users: [...BOT_USERS], refresh: {}, attempts: [], matches: [] };
    saveDb(db);
    return db;
  }
}

function saveDb(db: MockDb) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function tokenFor(user: StoredUser) {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      id: user.id,
      username: user.username,
      email: user.email,
      exp: Date.now() + 15 * 60 * 1000,
    }),
  );
  return `${header}.${payload}.mock`;
}

function ok<T>(data: T, status = 200): { status: number; body: ApiResponse<T> } {
  return { status, body: { success: true, data } };
}

function fail(error: string, status: number) {
  return { status, body: { success: false, error } as ApiResponse<never> };
}

function authUser(headers: Headers) {
  const raw = headers.get("authorization")?.split(" ")[1];
  if (!raw) return null;
  const parsed = parsePayload(raw);
  if (!parsed) return null;
  const db = loadDb();
  return db.users.find((u) => u.id === parsed.id) ?? null;
}

function parsePayload(token: string) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(atob(payload)) as { id: string; username: string; email: string; exp: number };
  } catch {
    return null;
  }
}

function bestFor(userId: string, problemId: string) {
  const db = loadDb();
  const times = db.attempts
    .filter((a) => a.user_id === userId && a.problem_id === problemId && a.status === "completed" && a.duration_ms)
    .map((a) => a.duration_ms as number);
  return times.length ? Math.min(...times) : null;
}

function withProblemMeta(userId: string | null, p: Problem): Problem {
  return {
    ...p,
    solved: userId ? bestFor(userId, p.id) !== null : false,
    best_score: userId ? bestFor(userId, p.id) : null,
  };
}

function grade(code: string, problem: Problem): SoloSubmitResult {
  const trimmed = code.trim();
  if (!trimmed.includes("def ") || trimmed.endsWith("pass")) {
    return {
      correct: false,
      compile_error: "SyntaxError: unexpected indent / empty function (Mock-Runner)",
      tests_passed: 0,
      tests_total: problem.test_case_count,
    };
  }
  if (!trimmed.includes("return")) {
    return {
      correct: false,
      tests_passed: Math.max(1, Math.floor(problem.test_case_count / 3)),
      tests_total: problem.test_case_count,
    };
  }
  const quality = Math.min(trimmed.length / 80, 1);
  if (quality < 0.35) {
    return {
      correct: false,
      tests_passed: problem.test_case_count - 2,
      tests_total: problem.test_case_count,
    };
  }
  return {
    correct: true,
    tests_passed: problem.test_case_count,
    tests_total: problem.test_case_count,
  };
}

export async function mockRequest(
  path: string,
  init: RequestInit,
): Promise<{ status: number; body: ApiResponse<unknown> }> {
  await delay(220 + Math.random() * 180);
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  const json = init.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};

  if (path === "/api/auth/register" && method === "POST") {
    const db = loadDb();
    const username = String(json.username ?? "");
    const email = String(json.email ?? "");
    const password = String(json.password ?? "");
    if (db.users.some((u) => u.email === email || u.username === username)) {
      return fail("Username oder E-Mail bereits vergeben", 400);
    }
    const user: StoredUser = {
      id: crypto.randomUUID(),
      username,
      email,
      password,
      elo: 1000,
      created_at: new Date().toISOString(),
    };
    db.users.push(user);
    const access = tokenFor(user);
    const refresh = crypto.randomUUID();
    db.refresh[refresh] = user.id;
    saveDb(db);
    localStorage.setItem("pyclash_refresh_token", refresh);
    return ok({ access_token: access, user: publicUser(user) }, 201);
  }

  if (path === "/api/auth/login" && method === "POST") {
    const db = loadDb();
    const email = String(json.email ?? "");
    const password = String(json.password ?? "");
    const user = db.users.find((u) => u.email === email && u.password === password);
    if (!user) return fail("E-Mail oder Passwort falsch", 401);
    const access = tokenFor(user);
    const refresh = crypto.randomUUID();
    db.refresh[refresh] = user.id;
    saveDb(db);
    localStorage.setItem("pyclash_refresh_token", refresh);
    return ok({ access_token: access, user: publicUser(user) });
  }

  if (path === "/api/auth/refresh" && method === "POST") {
    const db = loadDb();
    const refresh = localStorage.getItem("pyclash_refresh_token");
    if (!refresh || !db.refresh[refresh]) return fail("Refresh-Token ungültig", 401);
    const user = db.users.find((u) => u.id === db.refresh[refresh]);
    if (!user) return fail("User nicht gefunden", 401);
    return ok({ access_token: tokenFor(user) });
  }

  if (path === "/api/auth/logout" && method === "POST") {
    const db = loadDb();
    const refresh = localStorage.getItem("pyclash_refresh_token");
    if (refresh) delete db.refresh[refresh];
    localStorage.removeItem("pyclash_refresh_token");
    saveDb(db);
    return ok({ ok: true });
  }

  if (path === "/api/auth/me" && method === "GET") {
    const user = authUser(headers);
    if (!user) return fail("Nicht eingeloggt", 401);
    return ok({ user: publicUser(user) });
  }

  if (path === "/api/auth/password" && method === "PUT") {
    const user = authUser(headers);
    if (!user) return fail("Nicht eingeloggt", 401);
    if (String(json.current_password ?? "") !== user.password) {
      return fail("Aktuelles Passwort ist falsch", 401);
    }
    const newPassword = String(json.new_password ?? "");
    if (newPassword.length < 8) {
      return fail("new_password: String must contain at least 8 character(s)", 400);
    }
    const db = loadDb();
    const target = db.users.find((u) => u.id === user.id);
    if (!target) return fail("User nicht gefunden", 401);
    target.password = newPassword;
    // Andere Sitzungen abmelden, aktuelle behalten
    const currentRefresh = localStorage.getItem("pyclash_refresh_token");
    for (const token of Object.keys(db.refresh)) {
      if (db.refresh[token] === user.id && token !== currentRefresh) {
        delete db.refresh[token];
      }
    }
    saveDb(db);
    return ok({ access_token: tokenFor(target) });
  }

  if (path === "/api/auth/account" && method === "DELETE") {
    const user = authUser(headers);
    if (!user) return fail("Nicht eingeloggt", 401);
    if (String(json.password ?? "") !== user.password) {
      return fail("Passwort falsch – Konto wurde nicht gelöscht", 401);
    }
    const db = loadDb();
    db.users = db.users.filter((u) => u.id !== user.id);
    for (const token of Object.keys(db.refresh)) {
      if (db.refresh[token] === user.id) delete db.refresh[token];
    }
    db.attempts = db.attempts.filter((a) => a.user_id !== user.id);
    localStorage.removeItem("pyclash_refresh_token");
    saveDb(db);
    return ok({ deleted: true });
  }

  if (path === "/api/problems" && method === "GET") {
    const user = authUser(headers);
    const list: ProblemListItem[] = PROBLEMS.map((p) => {
      const meta = withProblemMeta(user?.id ?? null, p);
      return {
        id: meta.id,
        title: meta.title,
        difficulty: meta.difficulty,
        test_case_count: meta.test_case_count,
        solved: meta.solved,
        best_score: meta.best_score,
      };
    });
    return ok(list);
  }

  const problemMatch = path.match(/^\/api\/problems\/([^/]+)$/);
  if (problemMatch && method === "GET") {
    const user = authUser(headers);
    const problem = PROBLEMS.find((p) => p.id === problemMatch[1]);
    if (!problem) return fail("Problem nicht gefunden", 404);
    return ok(withProblemMeta(user?.id ?? null, problem));
  }

  if (path === "/api/solo/start" && method === "POST") {
    const user = authUser(headers);
    if (!user) return fail("Nicht eingeloggt", 401);
    const problem = PROBLEMS.find((p) => p.id === json.problem_id);
    if (!problem) return fail("Problem nicht gefunden", 404);
    const db = loadDb();
    const session: SoloAttempt = {
      session_id: crypto.randomUUID(),
      user_id: user.id,
      problem_id: problem.id,
      started_at: Date.now(),
      status: "in_progress",
    };
    db.attempts.push(session);
    saveDb(db);
    const data: SoloSession = {
      session_id: session.session_id,
      problem: withProblemMeta(user.id, problem),
      started_at: new Date(session.started_at).toISOString(),
    };
    return ok(data, 201);
  }

  if (path === "/api/solo/submit" && method === "POST") {
    const user = authUser(headers);
    if (!user) return fail("Nicht eingeloggt", 401);
    const db = loadDb();
    const session = db.attempts.find((a) => a.session_id === json.session_id && a.user_id === user.id);
    if (!session) return fail("Session nicht gefunden", 404);
    const problem = PROBLEMS.find((p) => p.id === session.problem_id);
    if (!problem) return fail("Problem nicht gefunden", 404);

    const now = Date.now();
    const elapsed = now - session.started_at;
    if (elapsed > MAX_MS) {
      session.status = "timeout";
      session.finished_at = session.started_at + MAX_MS;
      saveDb(db);
      return fail("Zeit abgelaufen (15 Minuten)", 400);
    }
    if (session.submitted && !session.last_was_compile_error) {
      return fail("Nur ein Submit pro Session (außer Compile-Error)", 400);
    }
    if (elapsed < MIN_MS) {
      return fail("Lösung unter 5 Sekunden – Cheating-Verdacht", 400);
    }

    const result = grade(String(json.code ?? ""), problem);
    session.code = String(json.code ?? "");
    if (result.compile_error) {
      session.last_was_compile_error = true;
      session.submitted = true;
      saveDb(db);
      return ok(result);
    }
    session.last_was_compile_error = false;
    session.submitted = true;
    if (result.correct) {
      session.status = "completed";
      session.finished_at = now;
      session.duration_ms = elapsed;
      result.duration_ms = elapsed;
      result.status = "completed";
    } else {
      session.status = "failed";
      session.finished_at = now;
      session.duration_ms = elapsed;
      result.duration_ms = elapsed;
      result.status = "failed";
    }
    saveDb(db);
    result.best_score = bestFor(user.id, problem.id);
    return ok(result);
  }

  if (path === "/api/solo/stats" && method === "GET") {
    const user = authUser(headers);
    if (!user) return fail("Nicht eingeloggt", 401);
    const db = loadDb();
    const mine = db.attempts.filter((a) => a.user_id === user.id);
    const completed = mine.filter((a) => a.status === "completed");
    const bestMap = new Map<string, number>();
    for (const a of completed) {
      if (!a.duration_ms) continue;
      const prev = bestMap.get(a.problem_id);
      if (!prev || a.duration_ms < prev) bestMap.set(a.problem_id, a.duration_ms);
    }
    const stats: SoloStats = {
      solved: bestMap.size,
      attempts: mine.length,
      best_times: [...bestMap.entries()].map(([problem_id, duration_ms]) => ({
        problem_id,
        title: PROBLEMS.find((p) => p.id === problem_id)?.title ?? "Unknown",
        duration_ms,
      })),
    };
    return ok(stats);
  }

  if (path === "/api/battle/queue" && method === "POST") {
    const user = authUser(headers);
    if (!user) return fail("Nicht eingeloggt", 401);
    return ok({ queued: true, elo: user.elo }, 201);
  }

  if (path === "/api/battle/match" && method === "POST") {
    const user = authUser(headers);
    if (!user) return fail("Nicht eingeloggt", 401);
    const problem = withProblemMeta(user.id, PROBLEMS[Math.floor(Math.random() * 3)]!);
    const opponent = BOT_USERS[Math.floor(Math.random() * BOT_USERS.length)]!;
    const match: BattleMatch = {
      id: crypto.randomUUID(),
      problem,
      opponent: { username: opponent.username, elo: opponent.elo },
      started_at: new Date().toISOString(),
      time_limit_ms: 10 * 60 * 1000,
    };
    return ok(match, 201);
  }

  if (path === "/api/battle/history" && method === "GET") {
    const user = authUser(headers);
    if (!user) return fail("Nicht eingeloggt", 401);
    const db = loadDb();
    return ok(db.matches.slice(0, 20));
  }

  if (path === "/api/battle/finish" && method === "POST") {
    const user = authUser(headers);
    if (!user) return fail("Nicht eingeloggt", 401);
    const db = loadDb();
    const target = db.users.find((u) => u.id === user.id);
    const win = Boolean(json.win);
    const change = win ? 18 : -18;
    if (target) target.elo += change;
    const item: MatchHistoryItem = {
      id: crypto.randomUUID(),
      opponent: String(json.opponent ?? "unknown"),
      problem_title: String(json.problem_title ?? "Battle"),
      result: win ? "win" : "loss",
      duration_ms: Number(json.duration_ms ?? 0),
      elo_change: change,
      finished_at: new Date().toISOString(),
    };
    db.matches.unshift(item);
    saveDb(db);
    return ok({ elo: target?.elo ?? user.elo, elo_change: change, result: item.result });
  }

  if (path === "/api/battle/forfeit" && method === "POST") {
    const user = authUser(headers);
    if (!user) return fail("Nicht eingeloggt", 401);
    const db = loadDb();
    const target = db.users.find((u) => u.id === user.id);
    // Aufgeben = automatische Niederlage mit ELO-Abzug
    const change = -18;
    if (target) target.elo += change;
    const item: MatchHistoryItem = {
      id: crypto.randomUUID(),
      opponent: String(json.opponent ?? "unknown"),
      problem_title: String(json.problem_title ?? "Battle"),
      result: "loss",
      duration_ms: Number(json.duration_ms ?? 0),
      elo_change: change,
      finished_at: new Date().toISOString(),
    };
    db.matches.unshift(item);
    saveDb(db);
    return ok({ forfeited: true, elo_change: change });
  }

  if (path === "/api/leaderboard" && method === "GET") {
    const db = loadDb();
    const ranked = [...db.users]
      .filter((u) => u.password !== "demo" || BOT_USERS.some((b) => b.username === u.username) || u.elo !== 1000 || true)
      .sort((a, b) => b.elo - a.elo)
      .slice(0, 20)
      .map((u, i): LeaderboardEntry => ({
        rank: i + 1,
        username: u.username,
        elo: u.elo,
        wins: Math.max(0, Math.round((u.elo - 900) / 40)),
        losses: Math.max(0, Math.round((1400 - u.elo) / 50)),
      }));
    return ok(ranked);
  }

  return fail("Route nicht gefunden", 404);
}

function publicUser(user: StoredUser): User {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    elo: user.elo,
    created_at: user.created_at,
  };
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
