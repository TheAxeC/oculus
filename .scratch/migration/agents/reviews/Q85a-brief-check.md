# Step Q85a brief check (on main at 64275504)

`git rev-parse HEAD` printed `6427550467324c648277dc879256fe7262165b40`. All commands ran from `tools/oculus` unless a scratch folder is named. The zod and tsc probes ran in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/zodprobe` with its own `npm install zod@4.6.5 typescript@6.0.3` on node v24.21.0. Nothing in the repository was written.

## 1. Names

- `text`, `whole`, `list`, `isMap` of `src/lib/server/core/json.ts`: `grep -rnE "core/json|'\./json(\.ts)?'" src tests | grep import`. Importers of one of the four: `sessions/fold.ts:27`, `sessions/group.ts:28`, `sessions/cache.ts:12`, `sessions/overrides.ts:15`, `sessions/registry.ts:17`, `sessions/stores/background.ts:25`, `sessions/stores/turns.ts:22`, `sessions/stores/codex.ts:18`, `sessions/stores/transcripts.ts:39`, `files/fs.ts:47`, `git/git-routes.ts:22`. All eleven are in the brief's 80. No module under `src/routes`, `src/lib/state`, `src/lib/data`, `src/lib/views` or `tests` imports any of the four (the test importers take only `fsWrites` and `writeTextAtomic`). No hit outside the paths.
- Local helpers: `grep -rnE "^(export )?function (text|number|severity|whole|list|count|mapOf|record|str)\(" src/lib/server`. `text`, `number`, `severity` sit at `machine/usage/accounts.ts:43,47,51` as the brief says. Their like: `mapOf` at `content/audit/rules.ts:77`, `edit/deck-edit.ts:34`, `edit/writes/rail.ts:36`, `edit/writes/audit-mute.ts:40`, `sessions/stores/customizations.ts:136`, `git/deposit.ts:209`; `text` at `edit/writes/manifest.ts:232`, `files/fs.ts:357`, `git/deposit-routes.ts:81`; `count` at `transcripts/usage.ts:23`; `str` at `root/hooks.ts:44`; `record` at `files/search.ts:181`; exported `number` at `content/audit/rules.ts:38`. All in the 80.
- `...Schema`: `grep -rnoE "\b[A-Za-z]+Schema\b" src tests` prints `collectionSchema` (11), `scaffoldSchema` (4), `checkCollectionSchema` (2), `markSchema` (2). None is a zod schema; three of them are used in files of the 80 (`edit/feeds.ts:72`, `edit/writes/entries.ts:122`, `files/fs/bookmarks.ts:73`).

Findings:

1. `tests/fixtures/kinds.ts:20` reads the body kinds out of the source text of `bodies.ts` with `/body\.kind !== '([a-z-]+)'/g`. Once the readers are schemas (`kind: z.literal('entry')`), `recordedKinds()` answers `[]`. `tests/views/system/history.test.ts:180` (`expect(kinds.length).toBeGreaterThan(0)`) turns red, and the gate at `tests/checks/source/keys.test.ts:165` loses every `history.kind_*` key. The file is outside "Paths this step writes", and item 7 forbids editing a test file except for a deleted helper import. The brief should add `tests/fixtures/kinds.ts` to the paths and say what the fixture reads after the change (the `z.literal` of each `kind`), or say that bodies.ts keeps a form the fixture reads.
2. `tests/checks/tree/allow-duplication.txt` holds 12 entries naming server files (`grep "lib/server" tests/checks/tree/allow-duplication.txt`), and `tests/checks/tree/duplication.test.ts:596-606` fails on an entry whose clone is no longer shared. Entries whose clone is exactly a hand check the step deletes: `machine/pty/channel.ts` with `root/socket.ts` (`e5967afe7abb`, "10 lines at 96 and 52", which is `parseSubscription` and `terminalMessage`), `content/audit/rules.ts` with `edit/deck-edit.ts` and with `git/deposit.ts` (`3a43caa175b4`, the `mapOf` helper at 73, 30, 206), `edit/deck-edit.ts` with `edit/writes/audit-mute.ts` (`1e0e0eb0f6b5`), `accounts/connect/store.ts` with `accounts/mail/triage.ts` (`46984edf819e`, the JSON read at `store.ts:101-111`). The file is not in the paths. The brief should add it, and say that a schema two files need is written once and imported (the check also fails on a new clone of fifty tokens over eight lines, and the rules file's "a parser, a fold or a rule exists once" applies).
3. `DESIGN.md` cites lines of six places in files of the 80 (`grep -noE "\`[a-zA-Z/._-]+\.(ts|svelte):[0-9]+(-[0-9]+)?\`" DESIGN.md`): `auth.ts:29-38` (DESIGN.md:276), `watch/git.ts:207` (DESIGN.md:299), `writes/undo.ts:181`, `writes/manifest.ts:314`, `edit/feeds.ts:253`, `edit/feeds.ts:306` (DESIGN.md:303). Each reads correctly today (`sed -n 207p src/lib/server/root/watch/git.ts` prints the `hub.publish('files', ...)` line, and so on). An `import { z } from 'zod'` and a schema above any of them moves the line. The brief's DESIGN.md path is "the one sentence of item 8" only; it should add DESIGN.md lines 276, 299 and 303 with the instruction to re-cite.
4. `src/lib/data/helpers/guards.ts:3-5` says a socket frame and an endpoint's answer "arrive as `unknown`, and every module that reads one narrows it the same few ways". After the step the server's readers no longer do. The guards.ts path is "only if a guard loses its last caller"; it should also cover the head comment.
5. `src/lib/server/core/json.ts:91-92` says "the seven session modules that read a transcript line through it"; nine modules import `isMap` from there today (the list above, `fs.ts` included). Item 4 deletes the re-export only "when no server module imports it from there", so a partial conversion leaves a comment that is already false. The brief should say the comment is corrected either way.
6. Decision 2 names a schema `<Type>Schema` while `collectionSchema`, `scaffoldSchema` and `checkCollectionSchema` already mean something else in three files of the 80, and the type `SchemaField` would give `SchemaFieldSchema`. The brief should say how a reader tells the two apart or pick another suffix.

## 2. The step line

`plan.md:286` reads: "Q85a runtime validation of untyped input on `zod` in the server (`src/lib/server`, 80 files with hand checks, counted at /spec 2026-09-30), with the `data/model` types kept as the facade through `satisfies`, the hand checks the schemas make redundant deleted (LA7 a; Axel 2026-09-26, library audit; split by Z73 (b))".

- "runtime validation of untyped input on zod": items 1 and 2.
- "in the server (`src/lib/server`, 80 files with hand checks)": item 2 and the path list.
- "the `data/model` types kept as the facade through `satisfies`": item 3.
- "the hand checks the schemas make redundant deleted": item 4, bounded by item 5.
- Z73 (`plan.md:536`), "puts `zod` schemas at the inputs of its area": item 2.
- LA7 (a) (`library-audit.md:77`), "zod 4.6.5 ... `satisfies z.ZodType<T>`": items 1 and 3.

Findings:

1. The brief's "The plan line" is not the line as the plan holds it: it drops "counted at /spec 2026-09-30" and "Axel 2026-09-26, library audit", and "Premise corrected at /spec: the line said 77 files" describes a plan line that now says 80. Quote the line verbatim and drop the correction sentence or date it.

## 3. Premises

- zod absent: `grep -n '"zod"' package.json` printed nothing; `ls node_modules/zod` printed "No such file or directory". Matches.
- zod release: `npm view zod version license time.modified` printed `4.6.5`, `MIT`, `2026-09-25T10:23:18.499Z`. Matches.
- 80 files and 549 lines: the brief's loop with a counter printed `files 80 lines 549`; `diff` of its sorted output against the brief's 80 path lines printed nothing (equal, counts included). Matches.
- `guards.ts:16`: `export function isMap(value: unknown): value is Record<string, unknown>`. Matches.
- `core/json.ts:93` is `export { isMap } from '../../data/helpers/guards.ts';`, and 96-108 hold `text`, `whole`, `list`. Matches.
- `bodies.ts`: `manifestWrite` at 119, `railWrite` at 338, 351 lines. Matches.
- `root/socket.ts:52`: `export function parseSubscription(data: string): Subscription | null`. Matches.
- `README.md:13` is the dependency sentence. Matches. No second list: `grep -rnE "write-file-atomic|perfect-debounce"` over the tracked text files outside `node_modules` and the lock file hits only `package.json`, `README.md:13`, prose in `DESIGN.md:116,259` and head comments.
- `DESIGN.md:339` names `views/shared/changes/CommitBox.svelte` and the git writes. Matches. `grep -n "server/edit/writes" DESIGN.md` hits line 303 only.
- Decision 3's five sites: `socket.ts:59-67`, `bodies.ts:160-166`, `transcripts/usage.ts:33-45`, `sessions/overrides.ts:34-42`, `machine/usage/accounts.ts:34-41` each read as the brief describes.
- The zod expressions against the hand code (`node probe.mjs` in the scratch folder, deep-equality per input): every input of cases 1 to 6, 9 and 10 printed `same`. The brief's claim holds for those inputs.
- `z.record` against `isMap` on non-JSON values: the probe printed `Date true/false`, `Map true/false`, `class true/false`, `null proto true/true`. Matches the brief.

Findings:

1. The brief says "80 files with hand checks". 14 of the 549 lines are `typeof` in a type position (`grep -E "ReturnType<typeof|= typeof fetch;|\(typeof [A-Z_]+\)\["` over the 549), and two of the 80 files hold no check at all: `accounts/connect/loop.ts:108` (`ReturnType<typeof setTimeout>`) and `core/file-poll.ts:22` (the same). `root/watch/sessions.ts` has four counted lines, two type positions and two timer checks, no untyped input. The brief should say 78 files and 535 lines by the stricter count, or say the two files are listed and untouched.
2. The premise's regex does not count the other hand checks on untyped input in the same 80 files: 83 lines calling `fields(`, `str(`, `scalar(` or `strings(` of `guards.ts`, 16 lines of `Number.isInteger`, `Number.isFinite` or `Number.isSafeInteger` with no `typeof` on them, and 47 casts `as Record<string, unknown>` or `as {` (three `grep -cE` runs over the 80 files). The `isRecord\(` alternative matches nothing under `src/lib/server`. The brief should state which of these item 4 deletes; as written, item 4 names only `typeof`, `Array.isArray` and `isMap`.
3. 24 of the 80 files, holding 214 of the 549 lines, parse nothing themselves (no `JSON.parse`, `parse(`, `readJson`, `tokenedBody`, `gatedBody`, `.json()`, `request.text()` or `searchParams`): `bodies.ts` (64), `sessions/fold.ts` (24), `content/audit/rules.ts` (16), `edit/entry-edit/entries.ts` (14), `transcripts/usage.ts` (12), `sessions/group.ts` (12), `sessions/stores/codex.ts` (10) and 17 more. Their input is an argument another server function hands them. Item 5 says such a check stays; decision 3 converts two of them (`entryWrite`, `claudeUsage`). The two contradict. The brief should define the entry by where the value was parsed, not by who calls the reader.
4. Input sites outside the 80, which item 2 ("in the 80 files listed") leaves out: `edit/writes/deck.ts:33-39` (YAML parsed, read through `fields(fields(parsed).deck)`), `git/git-index.ts:72` (`JSON.parse(name) as string`, a cast with no check), `sessions/transcript-routes.ts:42-43` (`Number(asked)` and `Number.isInteger` on a query value), `git/git-reads.ts:168-169` (`Number.parseInt` on a query value). The brief should add them or say why each is outside.
5. Item 5's reason for keeping `isMap` on YAML values does not occur in the server. `grep -rnE "from 'yaml'" src/lib/server` shows every plain read uses `parse` with no options (`grep -rnE "parse\([^)]*\{"` finds no options object on a YAML parse). The probe `node y.mjs` parsed a document with an anchor, an alias, two timestamps, `.nan` and `.inf`: the result is a plain object, the timestamps are strings, and `z.record(z.string(), z.unknown())` accepted it. `parseDocument` nodes are checked with `isYamlMap`, which the regex does not count. The brief should drop the exemption or restrict it to a site it names.
6. `DESIGN.md:339` is the bullet on git writes and the deposit; nothing in it is about input. `DESIGN.md:146` ("**Auth.**", every request under `/api/`) and `DESIGN.md:28` ("**Data.** Reads files, produces a typed, validated model") are nearer. Item 8 leaves the choice to the builder ("or the paragraph on the write endpoint if one is nearer"); the grep it names hits line 303, which is the apps section. The brief should name one line.

## 4. Cases and checks

- Cases 1 to 12, 15: consistent with the rules file.
- Conventions and Verify 1 to 4: consistent, with the findings below.

Findings:

1. Conventions ("each new test naming the revert that turns it red") and Verify item 5 ("Each new test names the revert that turns it red, run red once with the revert and quoted in the report") contradict the rules file, section "What every package obeys" ("there is no browser suite and no revert directive, and a step adds neither"), and the state file's line "No brief or round message asks for a revert directive or a browser test" (`orchestrator-state.md:40`). Replace with the template's form: a test of a preserved behaviour passes on the unchanged tree and after the change, both runs quoted.
2. Conventions says "The rules file's, unchanged: ... comment lines at most 100 columns, a file at most 900 lines". The rules file says "One source file under 1000 lines" and has no comment width. 900 and 100 are the checks' numbers (`utils/size-check.sh`, `tests/checks/source/comment-width.test.ts:22`). Attribute them to the checks.
3. Case 16 states "`NaN` and `Infinity` cannot come from `JSON.parse`". The probe printed `JSON.parse 1e999 = Infinity | typeof number: true | z.number ok: false`. A JSON body can carry Infinity, and `z.number()` refuses what `typeof x === 'number'` accepts. A site where it matters: `bodies.ts:241-247` (`feedFieldWrite`) accepts `{"value":1e999}` today; `machine/pty/channel.ts:113-114` accepts `cols: 1e999`. The case is wrong as written and must state the expected result for a JSON `1e999`.
4. Case 13 expects "null or the refusal it gets today". An expected result with two alternatives passes when a reader that accepts today starts answering null. The probe showed `entryWrite` accepting `fields` nested 10,000 deep today (hand and zod `same`, a write returned). State: "answers what it answers on main, and does not throw".
5. Case 11 names "every line reader (`machine/usage/accounts.ts:350-356` and its like)". "Its like" is not a list. The brief should name them (`sessions/stores/transcripts.ts:105-112`, `files/search.ts:181-186`, `core/changes.ts:138` and the others the builder would otherwise have to find).
6. "adds a test under `tests/routes/` only": the cases on `parseSubscription`, `overrides`, `claudeUsage` and the line readers belong beside `tests/server/root/socket.test.ts`, `tests/server/sessions/overrides.test.ts`, `tests/server/transcripts/usage.test.ts`, none of which is in the paths, and item 7 forbids editing them. `ls tests/routes | wc -l` printed 9, so the root of `tests/routes` takes one new file before the folder rule fails. The brief should name the test files per case.
7. Existing tests for cases 1 to 12 (`grep -rn` under `tests/`):
   - Case 1: `tests/server/root/socket.test.ts:86` holds the channels through `subscriptionChannels`; no test calls `parseSubscription`, so `token: undefined` is not held.
   - Case 2: `socket.test.ts:90-93` holds another type, `[3]`, a list and `not json`; `'null'` and `["a",1]` are not held.
   - Case 3: not held (`socket.test.ts:151-185` passes a good token only).
   - Case 4: no test calls `entryWrite`; `tests/routes/edit/write.test.ts:301,344` holds a good entry body through `handleWrite` by status only.
   - Case 5: `write.test.ts:329` holds `fields: 'not a map'` only; empty `collection`, empty `id`, `fields` a list, `fields` null and a null body are not held.
   - Case 6: not held.
   - Case 7: `write.test.ts:330` holds the action outside the list; `value: 3` and the absent `value` key are not held.
   - Case 8: `write.test.ts:204` holds it.
   - Case 9: `tests/server/sessions/overrides.test.ts:200-205` holds the file that is not JSON, through a write; `b: 3`, `c: []`, `{ "sessions": [] }` and the key beside are not held for `overrides()` (`tests/server/sessions/group.test.ts:330` runs `'{not json'`, `'[]'`, `'{"sessions": 3}'` through the grouping).
   - Case 10: `tests/server/transcripts/usage.test.ts:65-83` holds a message with no usage; `model: 3`, `output_tokens: 'x'`, `message: 5` and `usage: []` are not held.
   - Case 11: `tests/server/sessions/stores/transcripts.test.ts:117-136` holds it for the transcript store; nothing under `tests/server/machine/usage` holds it for `accounts.ts:350-356`.
   - Case 12: held by definition.
   No existing test holds cases 3 and 6, and cases 1, 2, 4, 5, 7, 9, 10 and 11 are held in part. "Cases 1 to 12 are covered by tests that exist" is false for ten of the twelve.

## 5. The question

- Cases 1 to 12: yes, each could pass with the goal unreached. They pass on the unchanged tree by construction, so they prove behaviour kept and nothing about schemas present or checks gone.
- Cases 13 to 16: yes, same reason; 13 and 16 also for the reasons in section 4.
- The check on the step's line (Verify 1, `checks: 7 commands passed`): yes. It passes on main today with no zod in the tree.
- Verify 3 (the loop before and after): yes. It asks for two numbers and sets no bound.
- Item 1 (the dependency): yes. `zod` in `package.json` and one import satisfies it.
- Item 2 (where a schema goes): no check of the brief counts the entries that got a schema.
- Item 3 (`satisfies`): yes, see finding 3.
- Item 4 (what is deleted) and item 5 (what stays): yes, see finding 1.
- Item 6 (behaviour unchanged): partly; the existing tests bound it only where they have a case, and section 4 finding 7 shows where they do not.
- Item 7 (no test rewritten): no, the diff shows it.
- Item 8 (docs): yes; one sentence in DESIGN.md is true of a tree with one schema.

Findings:

1. The step can pass with most of the 549 lines in place, and nothing bounds it. Item 5 lets a builder keep every check on "an argument one server function hands another" (214 lines in 24 files by section 3 finding 3, `bodies.ts` among them) and every `isMap` on a YAML value (the `edit/` folder holds 189 of the lines), with "the reason per file" as the only cost. The brief should state the expected end state as a fact a command prints: for each of the 80 files either zero lines of the loop or a named list of lines that stay, written into the brief before dispatch (the file list with a kept-lines column), plus a second count the report must give, `grep -c "safeParse\|\.parse("` per file against the entries of that file.
2. No item says how many entries exist. The brief should list the entry kinds with their sites, which a grep gives: `tokenedBody` and `gatedBody` (`core/auth.ts:99,118`), `request.text()` (`root/hooks.ts:218`), `response.json()` (`accounts/connect/oauth.ts:270`, `accounts/connect/api.ts:38`), `readJson` callers, each `JSON.parse`, each YAML `parse`, each `searchParams.get` (17 sites), and the socket's `ws.on('message')` (`root/socket.ts:103`).
3. `satisfies z.ZodType<T>` does not prove the schema matches the type. `npx tsc -p .` in the scratch folder exited 0 on a file where a schema with a missing required field and one with a wider field are each marked `@ts-expect-error` (so both are refused), and where a schema narrower than the type (`collection: z.literal('c')` plus an extra required `extra`) and a schema lacking the type's optional `value` both compile. A schema that refuses valid bodies, or never reads an optional field, passes item 3. The behaviour cases are the only guard, so the brief needs a must-pass case per optional field of each body type.
4. Decision 3's expressions change behaviour on inputs the brief's own rule ("the same keys kept or dropped") covers. The probe printed `DIFF` for an own `__proto__` key: `entryWrite` with `fields: {"__proto__":{"x":1},"a":1}` keeps both keys by hand and answers `fields: { a: 1 }` through `z.record`; the same for an override entry and for `json()` in `accounts.ts`. `z.looseObject` also drops it (`looseObject own keys [ 'b', 'constructor' ]` from an input with `__proto__`), puts the declared keys first (`[ 'z', 'b', 'a' ]` from `{b,z,a}`) and adds a key for an absent `.catch()` field (`[ 'z', 'b' ]` from `{b:1}`). A reader whose answer is written back to a file (the overrides file "keeps every other key", `sessions/overrides.ts:9`) would reorder or add keys. The hand code also returns the same object it was given (`same ref true` against `false`). The brief should rule: the schema decides accept or refuse and the function keeps answering from the input object where the answer is written back or compared by identity, or state the three differences as accepted.
5. `z.record(...).safeParse` on every JSONL line costs more than `isMap`: the probe printed `200000 lines: isMap 1.4ms z.record 54.0ms` for a line of four keys. The brief has no case or check on the transcript fold's time (`sessions/fold.ts`, `sessions/stores/transcripts.ts`). It should say which check holds it (the landing's A/B, if it covers the session scan) or add one.

## 6. Implied inputs

- A request body that is not JSON: not under "Cases" (held by `write.test.ts:131`). Expected: 400 with the route's sentence from `core/auth.ts:100-102`, unchanged, since the parse stays ahead of the schema.
- A body over the size the route accepts: missing. Expected: 413 "the hook body is too large" at `root/hooks.ts:213-224` before any schema runs; no other server route has a limit (`grep -rn "MAX_BODY\|maxPayload"` hits hooks.ts only).
- A query parameter given twice: missing. Expected: the first value, as `searchParams.get` answers; the probe printed `get: a | fromEntries: b`, so a schema over `Object.fromEntries(searchParams)` would take the last.
- A YAML file with an anchor or a timestamp scalar: missing. Expected: read as today; the probe shows a plain object, strings for timestamps, and `z.record` accepting it.
- A YAML `.inf` or `.nan`: listed as case 16, with no site and no expected value. Expected per site: `z.number().catch(0)` answers 0 where the hand code has `Number.isFinite`; where it has a bare `typeof === 'number'` the hand code accepts and zod refuses.
- A JSONL file whose last line is cut off: missing for the usage readers (held for the transcript store at `transcripts.test.ts:120`). Expected: the line is skipped, the lines before it are read.
- A subprocess answer that is empty: missing. Expected: `JSON.parse('')` throws, the reader answers null or skips (`files/search.ts:181-186`); the probe printed `same json empty`.
- A remote API answer with a field of another type: missing. Expected: what `accounts/connect/api.ts` and `oauth.ts:270` answer today, per field.
- A socket message that is binary: missing. Expected: `String(data)` at `root/socket.ts:104` runs first; a Buffer of JSON parses, a fragment list becomes comma-joined text and is handed to `terminals.inbound` (the probe printed `{"a",:1}`).
- A string with a lone surrogate: missing. Expected: accepted as today; the probe printed `same` for channels and ids and `z.string` accepts it.
- `z.string().min(1)` against a check that trims: missing as a must-pass. The probe printed `"  " hand null | min(1) true`, and `" x " ... trim().min(1) 'x'`. `write.test.ts:331` holds the refusal of `do: '   '`. Nothing holds that `do: ' x '` is answered untrimmed. Sites: `bodies.ts:194`, `sessions/overrides.ts:93,139`, `edit/feeds.ts:352,355`, `edit/entry-edit/subtasks.ts:237`, `machine/pty/sessions.ts:494`, `git/git-write.ts:666`. Expected: refused when blank after trimming, and the value answered exactly as sent.
- A hand check that accepts `null`: missing. `feedFieldWrite` accepts `value: null` (`bodies.ts:242`); `edit/yaml-edit.ts:121` treats null and undefined alike. The probe printed `optional null: false`. Expected: null accepted where it is today, refused where it is today (`write.test.ts:215`, `title: null`).
- Numbers given as numeric strings: missing. Expected: a body field `"12"` is refused where the hand code has `typeof === 'number'` (`z.number on "12": false`, the same); a query value keeps `Number(asked)` with `'' -> 0` (`sessions/transcript-routes.ts:42`), which `z.coerce.number()` happens to match (`coerce "" -> 0`).
- Integer checks: missing. 16 lines of `Number.isInteger`, `Number.isFinite` or `Number.isSafeInteger` in the 80 files are outside the premise's count. The probe printed `z.number int() on 2**53: false Number.isInteger: true`. Expected: an integer of 2^53 or more answers as today.
- An own `__proto__` key inside `fields`, inside an override entry and in a JSON status file: missing (case 14 has it only at the top of a body). Expected: kept, as today.
- JSON `1e999`: missing, see section 4 finding 3.
- A body that is a string, a number or a list: missing for every reader but `entryWrite` (case 5 has null). Expected: null.

Findings: every line above marked missing; the last six (trim, null, integers, `__proto__` in a nested map, `1e999`, the repeated query key) are the ones where the probe showed zod answering differently from the hand code.

## 7. ADRs

- `ls docs/adr ../../docs/adr` from `tools/oculus` printed "No such file or directory" for both. No record.

Findings: none.

## 8. Repository checks, the dependency list, the type-check, the size of the step

- Import rules: `tests/checks/tree/boundaries.test.ts` and `tests/checks/imports/order.test.ts` read imports between modules of the tree; an import naming a package is outside them (`tests/checks/imports/graph.ts:26`). No red from `import { z } from 'zod'`.
- Dependency or licence list: `grep -rnE "dependencies|licen[cs]e" tests/checks utils` printed nothing. No check reads it. `README.md:13` is the one list.
- Lint: `grep -n "restricted" eslint.config.js` hits one Svelte element rule. No import restriction.
- Comment width: 100 columns, `tests/checks/source/comment-width.test.ts:22`. The brief states it.
- Folder rule: `tests/routes` holds 9 items, see section 4 finding 6.
- Type-check: `satisfies z.ZodType<T>` compiles for `Subscription` with `token: z.string().optional().catch(undefined)`, for `EntryWrite` with `z.record`, for `Override` (index signature) with `z.record` and with `z.looseObject`, for a body with an optional field through `.optional()`, and for a lenient `z.looseObject` with `.catch()` fields (`npx tsc -p .` exit 0, TypeScript 6.0.3 as the lock file pins, `strict`, `verbatimModuleSyntax`).

Findings:

1. Duplication check: red unless `allow-duplication.txt` is edited, see section 1 finding 2.
2. Size check: `src/lib/server/core/git.ts` is 885 lines (`wc -l`) against a line of 900 in `utils/size-check.sh`, and `utils/size-allow.txt` has no entries. An import and a schema for its three check lines (`core/git.ts:191,194,253`) leave under 15 lines of room. The brief should say the schema for that file is sized to fit or name where it goes.
3. `tests/fixtures/kinds.ts` turns two tests red, see section 1 finding 1.
4. One builder: the 80 files hold 23,210 lines (`cat ... | wc -l`), the brief requires each read whole with its test file, and `tests/server` plus `tests/routes` hold 112 test files of 36,129 lines. 16 of the 80 have no test importing them directly (`bodies.ts`, `entry-edit/entries.ts`, `entry-edit/lines.ts`, `writes/manifest.ts`, `writes/undo.ts` among them), so their behaviour is held only through routes. That is about 59,000 lines to read before the first edit, with 535 check lines to decide one by one and no mechanical rule that settles them (sections 3 and 5). My judgment is that one builder does not finish this in one run with every behaviour held. By folder the list is: `edit` 14 files, 189 lines, 4,494 source lines; `sessions` with `transcripts` 13 files, 105 lines; `machine` 9 files, 79 lines; `accounts` 13 files, 37 lines; `files` 7, 40; `content` 7, 35; `git` 7, 28; `root` 5, 22; `core` 5, 14. A split along those folders, `core` first since `core/json.ts` and `core/auth.ts` are what the others import, gives steps a builder can read whole. The split is the user's ruling (Z73 set four steps by area), so it goes to him as an open item.

## Declined to judge

- Whether the three differences of section 5 finding 4 (`__proto__` dropped, keys reordered, a copy instead of the input object) are acceptable: the user's call, since the brief's item 6 forbids them and the plan line does not speak to them.
- Whether Q85a is split further: the user's call, see section 8 finding 4.
- Whether config values parsed in `src/lib/data` and read as `unknown` in the server (`content/audit/rules.ts`, 16 lines) belong to Q85a or Q85c: the plan's lines do not say, and a read cannot settle it.
- The other 75 conversion sites: only the five of decision 3 were compared input by input.
- The full suite, the build and `npm run diagrams`: not run, by the limits of this check.
- `tools/oculus/config/local.yml`: not opened.
- The time cost of `safeParse` on the real session scan: measured only on a synthetic line in the scratch folder.

Agent usage: claude-opus-5-5, tokens not verified, 33 tool uses, minutes not verified.

Usage, from the completion notice: claude-opus-5-5 (agent a9bfd1366ac361709), 206,223 tokens, 42 tool uses, 554,831 ms.

## Closed

Nothing is closed in the brief yet. Section 8 finding 4 (the step is too large for one builder) is raised to Axel as open item Z96, and Q85a is stopped on it. Every other finding is closed in the briefs written after his ruling, one per step he rules: the entry defined by where a value of type `unknown` is narrowed, each reader answering exactly what it answers on main (the JSON `1e999`, the blank string, `null`, the large integer, the own `__proto__` key and the repeated query key included), `tests/fixtures/kinds.ts`, `tests/checks/tree/allow-duplication.txt`, the DESIGN.md line citations, the head comments, the schema name form, the test files named per case, and no revert directive.
