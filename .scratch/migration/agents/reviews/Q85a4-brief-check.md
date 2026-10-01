# Step Q85a4 brief check (on main at 42cc92fd)

The brief was read on disk at `tools/oculus/.scratch/migration/agents/briefs/Q85a4.md`. The brief says it was read at b528da19. `git diff --stat b528da19 42cc92fd` shows that only ledger files changed between the two commits (Q85a2.md, Q85a2-brief-check.md, orchestrator-state.md, queue.md), so every source premise below was checked against the same `src` and `tests` the brief describes. Commands ran from `tools/oculus` unless another path is given. Probes ran with `npx tsx` from the scratchpad (`.../scratchpad/probe/`) and wrote nothing in the tree. I did not open `config/local.yml`, and no probe called `loadLocalOrDefaults`, which would read it.

## 1. Names

- `mapOf` (rules.ts:77, deposit.ts:209): `grep -rnw mapOf src tests config HELP.md DESIGN.md README.md docs --exclude=local.yml`. The hits outside the paths are the other functions named `mapOf`: `edit/deck-edit.ts:34`, `edit/writes/rail.ts:36`, `edit/writes/audit-mute.ts:40` and `sessions/stores/customizations.ts:136` (all in Q85a2's paths), plus `state/sessions/terminal/composer.ts:53`, `state/sessions/terminals.svelte.ts:125`, `state/workbench/navigation/catalogue.ts:179`, `data/sources/config/agents.ts:261` and `data/sources/config/rail.ts:32`. Each is its own module-private function, so the change makes none of them false. The allowlist lines 23 and 24 name `rules.ts:73` and are in the paths.
- `text`, `number`, `json` (accounts.ts:34-49), `text` (fs.ts:357, deposit-routes.ts:81), `word` (git-routes.ts:166): all are module-private (`grep -nE "function (text|number|json|word)\b"` in those files). The only outside hit is the same-named `text` in `core/json.ts:96`, which the brief handles under item 9.
- `scalar`, `number` and `listOf` of rules.ts are exported. `grep -rn "rules.ts'" src tests` shows `scalar` imported by `content/audit/projects.ts:23` and `content/audit/publications.ts:8`, and `listOf` by `projects.ts:24`. Both files are in the paths. No test imports them.
- `requireRefreshSettings`: `grep -rn requireRefreshSettings src tests`. Outside the paths the only caller is `edit/writes/config-key.ts:93-97` (Q85a2's file). It ignores the return value, so a typed answer keeps it working (refresh.ts:134-138's comment stays true).
- The comments the step changes: `guards.ts:3-10`, `core/json.ts:91-92` and `DESIGN.md:148`. `grep -n "guards\|isMap\|zod\|narrow" DESIGN.md HELP.md README.md` turns up one more sentence the step bears on, `DESIGN.md:148`'s last one: "A request body read through `gatedBody` ... is narrowed to a map by `isMap`, and the route that reads it narrows its fields". Finding 3.4 covers it. `README.md:13` ("zod ... checks a value that comes from outside the process where the server reads it") stays true.

Findings:
1. **"What is on the tree" (the `core/json.ts:91-92` bullet) and item 9: `text` in `core/json.ts` will be left with no caller once both steps land.** `grep -rnE "from '[./]*(core/)?json(\.ts)?'" src` shows `text` imported by `sessions/stores/turns.ts:22`, `sessions/registry.ts:17` and `sessions/stores/codex.ts:18` (Q85a2's files) and by `git/git-routes.ts:22` (this step). Each brief deletes a helper only when it has "no caller anywhere in `src` of the worktree". In this worktree the sessions files still call `text`, and in Q85a2's worktree git-routes still does. If both steps convert their callers, `text` survives both steps with no caller after both land. No check in the verify list finds an unused export (`grep -rln "knip\|unused export" tests/checks` finds none). `core/json.ts:96-98` `text` is also the same function as `guards.ts:42` `text`. **Change:** item 9 says that the step landing second checks the callers on main after the first landing and deletes what is left without a caller. Name `core/json.ts:96` `text` beside the item 8 duplicates.

## 2. The step line

- "the same" (Q85a1's rule) in the five folders: items 1 to 6 and 8.
- "(44 files, 222 check lines)": "What is on the tree", and verify 3 (count before and after).
- "the two config casts of `root/context.ts:266-267` whose check is `refresh.ts:139-142`": item 7.
- "the head comment of `data/helpers/guards.ts:3-5` corrected": item 10.
- "the `data/model` types kept as the facade through `satisfies`": item 1.
- "the redundant hand checks deleted": items 1 to 6, with item 9 listing what stays.
- "every reader answering what it answers today": item 1 and the Cases.
- "after Q85a1": Q85a1 is booked as landed (`plan.md:316`).

Findings: none.

## 3. Premises

- zod: `grep -n '"zod"' package.json` prints `84: "zod": "4.6.5"`. Matches.
- The loop: rerun verbatim, it prints 44 files and 222 lines (`awk` sum: "44 files, 222 lines"). The counts per file match the brief's lists.
- The helper duplicates: `sed -n` at accounts.ts:43-49, fs.ts:357-359, deposit-routes.ts:81-83, rules.ts:38-40, 77-79 and 184-188, and deposit.ts:209-211 shows each as described. guards.ts: `numericSetting` starts at line 76, not 75 (75 is the end of its doc comment).
- `guards.ts:3-5`, `core/json.ts:91-92`, `fs.ts:47` and `git-routes.ts:22`: as quoted (fs.ts:47 also imports `chained` and `FsWrites`).
- `context.ts:266-267`, `refresh.ts:139-147` and `:153-154`, `config-key.ts:93-97`, `refresh.test.ts:543-554`: as described.
- The reader citations: opened at each line. All of them land on the named function.

Findings:
1. **"accounts/calendar/routes.ts:54 ... is in this step": eight more files in the five folders hold check lines without the word `unknown`, and the brief names none of them.** The loop with `grep -rL unknown` prints `1 machine/usage/routes.ts`, `1 machine/hpc/ssh.ts`, `2 machine/hpc/routes.ts`, `1 machine/hpc/poll.ts`, `1 accounts/mail/plate.ts`, `5 git/git-index.ts`, `1 git/git-remote.ts` and `7 git/git-reads.ts`. Two of them are request-body readers of the same kind the brief converts:
   - `machine/hpc/routes.ts:19-26` reads `body.action` and `body.id`.
   - `machine/usage/routes.ts:18-19` reads `body.account`.

   Both bodies come from `gatedBody`. git-index.ts:91,148,151,184,205 and git-remote.ts:71 are argument checks. The rest are `typeof` in a type. **Change:** list all nine files in "What is on the tree", each line classified. Add the two body readers to item 2 and to the paths, or list them under "stays" with the reason.
2. **"The places where a map or a list from outside ... is read by hand": several readers of outside maps in the 44 files are in neither group.** Each was read at its line:
   - `files/fs.ts:536-553` `handleFsWrite` and its actions at `:443,470,482,493,503-504,511` read the body's `action`, `dir`, `key`, `name`, `id`, `title` and `body` through `text`. This is the pattern of `handleGit`. The brief only replaces fs.ts's `text` with guards' `text` (item 8). The verify 3 grep would then print those lines, which are in no listed group.
   - `accounts/connect/actions.ts:262-276` `accountAction`, `:178-188` `addRow` (`{ provider: record.provider, label: record.label } as AccountRow`, an unchecked cast like the ones Decision 2 removes) and `:248-256` `removeAccount`. These read the mail and calendar bodies' `action`, `account`, `provider`, `label` and `url`.
   - `mail/routes.ts:130-160` `handleMail` reads `record.action`, `record.thread` and `record.fields`. `calendar/routes.ts:46-60` reads `record.action`.
   - `accounts/connect/setup.ts:60-69` `handleSetupWrite` reads `action`, `provider`, `client_id`, `client_secret` and `tenant` from a `gatedBody` body. The file is not in the 44.
   - The provider answers, field by field through `str`: `calendar/google.ts:35,52-54,89-100` (`nextPageToken`, `id`, `summary`, `location`, `htmlLink`, `status`), `calendar/microsoft.ts:44,57-59,93-105`, `mail/google.ts:50,74,108,191`, `mail/microsoft.ts:70,133-151,211-272`, and `connect/oauth.ts:277` (`access_token`, `refresh_token`). The brief lists only `edge`, `location`, `header`, `labels`, `personOf`, `replyToOf`, `categories`, `codeOf`, `rowsOf` and `refusal`.
   - `content/audit/projects.ts:440,450,459,471` reads collection entry fields (`status`, `date`, `related`, `link`) through `scalar` and `listOf`, and `publications.ts:93` reads a paper's `title`. The brief files `scalar` and `listOf` under "Configuration read at run time", but they read entry fields and a website paper.

   **Change:** put each one in a group: converted (with its schema), or stays (with its reason).
3. **"`handleTerminal` ... `message.kind as TerminalKind`, `message.cols as number` and `message.rows as number`": the cast premise is short.** `grep -n " as [A-Z][A-Za-z]*\b\| as number\| as string" src/lib/server/machine/pty/routes.ts` prints:
   - body casts in the other actions: 199-200 (fork), 234-235 (compose), 364 (`message.step as LatexStep`), 396-397 (latex), 475 and 517 (`message.tool as TerminalResume['tool']`), 541-542 (resume);
   - casts of `unknown` arguments: 146-147, 278-279 and 321-322 (`cols as number`, `rows as number` in `recoverDataset`, `startChat` and `startTask`).

   Verify 4's `message\.\(kind\|cols\|rows\) as` grep catches 11 of these lines but not 364, 475, 517 or the argument casts. **Change:** list every cast with its line, and say which go under Decision 2. Widen the verify grep to `grep -nE " as (number|string|TerminalKind|LatexStep|TerminalResume)" src/lib/server/machine/pty/routes.ts`, or name the lines that stay.
4. **"What is on the tree" and item 10: `DESIGN.md:148`'s last sentence says the route reading a `gatedBody` body "narrows its fields".** The brief converts some such routes (`triageFields`, `event`, the reply `body`) but not their `action`, `thread` and `fields` reads (finding 3.2), nor hpc, usage and setup (finding 3.1). **Change:** item 10 says what that sentence becomes once this step decides.
5. **"Some lines the loop counts are not checks" misses `machine/pty/compose.ts:69` (`ReturnType<typeof parseAgents>`).** **Change:** add it.
6. **The classification of `compose` (compose.ts:150-182) is wrong.** Its input is the typed `ComposeStart` that `composeRequest` returns. Its only caller is `pty/routes.ts:219-221`: `grep -rn "compose(\|composeRequest(" src`. So `compose.ts:156,170,174` are hand checks a schema makes redundant, not a read of an outside map. **Change:** item 2 drops `compose` from "one schema per body". Item 1 or 9 deletes those three checks (the `typeof image !== 'string'` part of 174 included), and `isAbsolute` and `below` stay.
7. **The `rows.ts:72` classification.** `same()` reads `item.provider` and `item.label` with `===`, so it is not a bare map test. It still stays, since strict equality needs no narrowing. **Change:** move it to its own line with that reason.
8. **The argument-check list (git-refs.ts:64,92,100,119; git-write.ts:241,666; deposit.ts:341,407,740) includes parameters typed `string`.** Read at each line, the signatures are `message: string`, `ref: string` and `name: string`. Once the route's schema answers strings, the `typeof x !== 'string'` part of each is a redundant hand check (the step line's "redundant hand checks deleted"). The empty or blank sentence stays. The brief describes them as "one `unknown` or `string` argument" with no reason why a `typeof` on a typed `string` parameter stays. **Change:** give the reason in Decision 1 (for example, a refusal kept for a caller outside TypeScript, as git-routes.ts:11-13 says of `permitted`), or delete the `typeof` part.
9. **The shared paths with Q85a2, which is in flight (base 4f4dcfc4).** Both briefs rewrite the one-line paragraph `DESIGN.md:148` and the comment `core/json.ts:91-92`. On `tests/checks/tree/allow-duplication.txt`, Q85a2 removes lines 19, 23 and 25 and this step removes 22, 23, 24 and 27: overlapping and adjacent hunks in lines 22-25. Both run `npm run diagrams` over `docs/diagrams/`. A cherry-pick of the second landing will conflict on the first two and very likely on the allowlist. The brief names Q85a2 but says nothing about the merge. **Change:** add a sentence naming these shared paths and how the second landing merges: DESIGN.md:148 names the folders of both steps, json.ts:91-92 names the importers left on the merged tree, the allowlist is the union of removals, and the diagrams are regenerated once on main. Or record the judgment in the dispatch's `shared_paths:`.

## 4. Cases and checks

Each case was read against the hand code on main, and the doubtful ones were probed (`probe.mts` and `p2.mts` under the scratchpad's `probe/`).

- Cases 1, 2, 3, 4, 5, 8, 10, 11, 12, 14, 16, 17, 19, 21, 22, 23 and 25: the expected results match the code. Probe output: `case2 {"agent":"shell","cwd":"","account":"","picks":{"a":"b"},"prompt":"","images":["p"]}`; `case1 resize {...,"cols":80.5,"rows":24}`; `messageModel ["","","m"]`.
- Every named test file exists (one `[ -f ]` loop, all "ok").

Findings:
1. **Case 13 fails on the unchanged tree.** Probe: `requireRefreshSettings({ refreshMin: 10, model: 'haiku' })` prints `case13 answer undefined`, because the function returns `void` (refresh.ts:139). The brief says every case passes on the unchanged tree. **Change:** on the first run the first part asserts `not.toThrow()`, and the typed answer is a new case for after the change. Or exempt it by name from "passes on the unchanged tree", in the brief's rule above the Cases.
2. **Case 20 uses the wrong key.** The configuration key is `read_limits` (rules.ts:55, and `tests/server/content/audit.test.ts:31`). Probe: `auditRules({ limits: {...} }).readLimits` prints `{}`, and `auditRules({ read_limits: { a: 1, b: '2', c: NaN } })` prints `{"a":1}`. As written, "keeps `a` only" is false on the unchanged tree. **Change:** `read_limits`.
3. **Case 24 "the wallpaper `file: 3` answers no `file`" is wrong under the brief's own assertion rule.** `wallpaper.ts:103-107` returns `{ dir, file: typeof held.file === 'string' ? held.file : undefined, pick }`, so `file` is an own key with the value `undefined`. "Absent" is asserted with `toStrictEqual` or `Object.keys`, and either fails on the unchanged tree. **Change:** "answers `file: undefined` (the key present)".
4. **Case 15 names the wrong identity field.** `BOOKMARK_IDENTITY = 'label'` (bookmarks.ts:35). An entry with `id: 7` and no `label` is dropped, so the case tests only "no label". The number path (`typeof held === 'number'`, then `String(held)`, bookmarks.ts:84-85) goes untested. **Change:** an entry with `label: 7` answers `id: '7'`, `title: '7'`. Keep `id: 7` with no label as "dropped" if wanted.
5. **Case 26 does not say which dependencies are real.** `createServerContext` takes `replacements`, and `tests/server/root/context.test.ts:75` replaces `watchUsageRefresh` with a stub. With the stub, the unchanged tree does not throw on `usage_refresh_min: 0`, while after item 7 (context.ts calling `requireRefreshSettings` itself) it would. With the real `watchUsageRefresh`, it throws inside that call, after `watchPortfolio` and `watchSessions` ran (context.ts:240-262). **Change:** "with every dependency replaced except `watchUsageRefresh`, `usage_refresh_min: 0` throws the cadence sentence. `watchPortfolio` and `watchSessions` were called before the throw, and `watchUsage` was not." Also state what happens with the stubbed `watchUsageRefresh` after the change (it throws, which is a new answer of the replaced form) so the builder does not stop on it.
6. **Case 6 needs `confirm: true` on the commit body.** `commit` is in `CONFIRMED` (git-routes.ts:123), so without it the body is refused with "this action needs the page to confirm it" and never reaches `commit`. **Change:** add `confirm: true`.
7. **The commit and stash parts of case 6 cannot be observed with `git.test.ts`'s fixture.** `options()` injects `run` (git.test.ts:75), which records the raw `fields` (`message: 3`, `mode: ''`). The operation table and `word` are never reached, and `ROOT` is `/hub`. **Change:** say these two parts run with `run: undefined` and `rootsFor` naming a scratch repository, so the real `commit` answers "a commit needs a message" and the real `stash` runs in mode `tracked`. Also state whether `GitOptions.run` and `DepositOptions.run` receive the input body or the parsed body after the change. Item 2 says "the action table reads the parsed body", while `git.test.ts:137,150,436,450` and `tests/routes/git/deposit.test.ts:32` record `fields`.
8. **Case 7 says "the same four refusals", but case 6 lists five** (no `action`, `'nope'`, `3`, `[]`, `null`). **Change:** "five".
9. **Some case homes are not in "Paths this step writes":**
   - case 18's mail half: `readGoogleMail` and `readMicrosoftMail` are imported by `tests/server/accounts/mail/plate.test.ts:9-10`, not by `calendar/providers.test.ts` (its imports are lines 7-10);
   - case 23: `readRoots` is imported by `tests/routes/files/file.test.ts` and `tests/checks/config/config-folder.test.ts`, by none of the five files its group names;
   - case 17: no test imports `connect/api.ts` (`grep -rln "connect/api" tests` prints nothing), and `codeOf` is private, reached through the exported `refusalLine` (api.ts:27).

   **Change:** name `tests/server/accounts/mail/plate.test.ts` and `tests/routes/files/file.test.ts` (or `tests/server/files/fs.test.ts`) and add them to the paths. Case 17 calls `refusalLine`. Case 12 calls `newestCodexLimits` (`usage.test.ts:15` imports it). Case 8 runs through `countLines` with a stub cloc script, as `lines.test.ts:211-216` does.
10. **Item 7 does not say how one schema keeps two sentences without reading `.error`.** It asks for one `refreshSettingsShape` that throws the two sentences in order, while verify 4 forbids reading `.error` of a parse result. The same holds for item 6's `readRoots` and `docFindings` findings "chosen by which part of the entry fails". A single `safeParse` of the whole value cannot tell which field failed without its issues. **Change:** name the construction, for example each field checked with `refreshSettingsShape.shape.refreshMin.safeParse(...)` in turn, or one schema per part, so the builder does not read issues or fall back to hand checks.
11. **Verify 3 cannot pass as written on main.** `grep -rnE "\b(text|str|scalar|fields|strings|word|number)\(" <five folders> | grep -v "function "` prints lines that are none of "named in The other check lines", "a `typeof` in a type" or "inside a schema":
   - `accounts/calendar/ics.ts:91,104,105,111,137,141,145,150` (ics.ts's own `text(component, name)` over `ICAL`) and `:196` (`response.text()`);
   - `files/open.ts:109` (`scalar(error.message, 'failed')`, a node error);
   - `git/git-write.ts:172` (`scalar(path)` inside `checkPaths`);
   - `content/audit/projects.ts:440,450,471`;
   - the provider `str` lines of finding 3.2.

   **Change:** list the hits expected to remain, each with its reason, or narrow the grep.

## 5. The question

- Cases 1 to 25 are behaviour cases built to pass on the unchanged tree, so each could pass without zod. That is by design: they hold "answers what it answers today", and the zod half is held by verifies 3 and 4. Taken on that part of the goal:
  - **Case 9** could pass without exercising anything: a `summary` line is ignored by `createFold` (search.ts:271-300 reads only `begin`, `end` and `match`), so "a `summary` line whose `stats` is a list" holds nothing. **Change:** an `end` line whose `stats` is a list, and one whose `matched_lines` is `'5'`.
  - **Case 20** as written could pass without reading `read_limits` at all (finding 4.2).
  - **Case 15** as written could pass without exercising the number label (finding 4.4).
  - **Case 26** could pass vacuously with the stubbed watcher (finding 4.5).
  - Cases 27 and 28 rest on existing tests, but no existing test exercises the calendar `event` of a non-string type (`grep -n "event: " tests/server/accounts/calendar/routes.test.ts` shows only string events), the reply `body` of a non-string type ("an answer needs words" appears in no test), or the terminal start's unknown `kind` (`grep -rn "kind must be one of" tests` prints nothing). For those three readers both cases could pass without the reader being held. **Change:** add cases (section 6), and add `tests/server/accounts/calendar/routes.test.ts` and `tests/routes/sessions/terminal.test.ts` to the paths.
- The step line's count (44 files, 222 lines): it could fall without zod, for example a `typeof` moved into a new local helper the verify 3 grep does not name. Verify 3's per-reader table of schemas and the `safeParse` counts are what hold it, but no expected value is stated. **Change:** state that every reader listed as converted has a schema named in the table, and that its file's `safeParse` count is at least the number of its readers.
- Item 9 could pass while a helper is left with no caller on the merged tree (finding 1.1).
- Item 12 could stall. If the mean stays above 1.5 times after "one parse per line, schemas built once", the brief gives no next step. The state file records Z96: "the transcript's line readers keep `isMap` where a schema costs time (200,000 lines: 1.4 ms against 54 ms in the check's probe)" (`orchestrator-state.md:258`). **Change:** cite Z96 in item 12, and say that a hot reader still above the bound keeps `isMap` under Z96, with both timings in the report. Also say whether `foldFile` (machine/usage/transcripts.ts:76-109, read per line over seven days of rollouts) is timed. It is per line like the other two, and the brief converts its `turn_context` read.
- Items 2 to 8 and 10 are each judged by reading plus the cases. Nothing else to add.

Findings: case 9, case 20, case 15 and case 26 as above, the uncovered route readers, the unstated table expectation, item 9's merged state, and item 12's missing fallback.

## 6. Implied inputs

This is a code step. Inputs the step implies but the Cases do not hold, each with the result the unchanged tree gives (from reading the code, and probes where marked):

1. **A body that is a primitive** (`3`, `"x"`, `true`) to `handleGit` and `handleDeposit`: 400 "the body is not a git action" or "the body is not a deposit action" (git-routes.ts:265, deposit-routes.ts:174). Same for `handleTerminal` ("the body is not an action"). Cases 6 and 7 hold only `[]` and `null`.
2. **A field of the wrong type that is refused later in the order, not as "not an action":**
   - git `{ action: 'stage', root: 3 }`: 400 "that directory is not a workspace oculus knows";
   - git `{ action: 'push', root: ROOT, confirm: 'true' }`: 400 "this action needs the page to confirm it";
   - deposit `{ action: 'push', id: 3 }`: 404 "the portfolio holds no project with that id".

   A strict `z.string()` or `z.boolean()` in the body schema would turn each into "the body is not a ... action". Missing.
3. **`null` where a field is optional:**
   - wallpaper `file: null`: answer with `file: undefined`;
   - terminal start `name: null`: starts with no name;
   - `fileIndex` `ext: null`: the default extensions;
   - `readSaved` workspace `roots: null`: the workspace kept with no roots;
   - git `message: null` on commit (confirmed): "a commit needs a message";
   - `composeRequest` `images: null`: `[]`.

   Missing (case 2 has no `null`).
4. **A number that is NaN or infinite.** JSON `1e999` parses to Infinity, and YAML `.inf` and `.nan` parse to Infinity and NaN.
   - `terminalMessage` resize with `cols: 1e999` answers `cols: Infinity`. Probe: `resize 1e999 ... Infinity`. `z.number()` refuses Infinity (`node -e` probe: `number NaN false Inf false`).
   - terminal start `cols: 1e999`: reaches `startTerminal`, which answers its geometry sentence.
   - `fileIndex` `max_per_project: Infinity` answers `cap: Infinity` (probe), and `NaN` answers 400 (probe).
   - `auditRules` `stale_lag_days: Infinity` answers 1.
   - a Claude status `used_percentage: 1e999`: the window is dropped.

   Missing.
5. **A whole number at or above 2^53:** cloc `"code": 1152921504606846976` is counted (`Number.isInteger` is true; probe: `int 2**60 false refine true`). Case 8 has none.
6. **An own `__proto__` key:**
   - a triage file `{"notes":{"__proto__":{"what":"w"},"b":{...}}}`: `readTriage` answers notes whose own keys are `['b']`. Their prototype is the `__proto__` note (probe: `triage keys [ 'b' ] proto is note true {"what":"w","written":""}`). This is a latent defect, a local object's prototype set from file content, and the brief's "same answer" rule preserves it. Report it as such.
   - a cloc path key `"__proto__"`: today it is a Map entry (`files.set`).
   - a website section `"__proto__"` in `sitePapers`;
   - a bookmark entry with an own `__proto__` key: `fields: { ...item }` keeps it as an own key;
   - a git body with an own `__proto__`, as recorded by `run`.

   zod drops an own `__proto__` key even in `z.looseObject` (`node -e` probe: `loose keys [ 'a', 'b' ] false`). Only case 2 holds one.
7. **`first ?? second` where the first is not null.** Item 1's rule 4 is wrong for the `str(a) ?? str(b)` form:
   - `codeOf` `{ error: { status: 3, code: 'C' } }` answers `C` (probe: `codeOf status3 code C: google: 400 C`). Rule 4 as stated would answer `''`.
   - Google `edge` `{ dateTime: 3, date: '2026-10-01' }` answers `{ at: '2026-10-01', allDay: true }` (google.ts:69-72).
   - Microsoft `senderOf` with `from: 3` and a valid `sender` answers `''` (raw `??`, microsoft.ts:113).

   **Change:** rule 4 applies to a raw `first ?? second`. A read through `str`/`text` falls back whenever the first is not a string. Add the three inputs to cases 17 and 18.
8. **`nav_groups` as a list** in `docFindings`: `Object.keys` of a list gives `'0'`, `'1'`, so a group `'0'` is "known" and a group `'g'` gives "nav_groups names no group g" (docs.ts:429). Missing.
9. **The output of `gh` as `null`, `[]` or not JSON:** `defaultBranchOf` and `urlOf` answer `''` (deposit.ts:771-789, the `TypeError` caught). Missing.
10. **`topics` holding non-strings** (`[1, {a:1}, null]`): `depositFor` answers `['1', '[object Object]', 'null']` (deposit.ts:228). Missing.
11. **The readers with no case at all:**
    - terminal start with `kind: 'nope'` or `kind: 3` answers 400 "kind must be one of claude, codex, shell" (`KINDS`), and with `cols: '80'` answers `startTerminal`'s geometry sentence;
    - calendar `{ action: 'open', event: 3 }` answers 400 "no such event";
    - mail `{ action: 'reply', thread: <held>, body: 3 }` answers 400 "an answer needs words";
    - `handleOpen`'s body is held by `tests/routes/files/open.test.ts:329-357`, but that file is not in the paths.
12. **A `match` record whose `submatches[0]` is `null` or a string:** a hit at column 1 with length 0 (probe: `fold ... "length":0`). Missing from case 9.

Findings: items 1 to 12 above are missing from "Cases".

## 7. ADRs

- `ls tools/oculus/docs/adr` prints "No such file or directory", and so does `ls docs/adr` at the hub root. The configuration block in `orchestrator-state.md` names no `adr` key (`grep -n adr` prints nothing). No record exists. The brief says so in its first paragraph.
- The rulings the step is under: Z73 (b), Z96 (a), Z127 (a) and LA7 (a), read at `plan.md:576,602,662`, `orchestrator-state.md:258,269` and `agents/reviews/library-audit.md:73-81`. The brief names all four. Z96's record also carries a decision the brief does not repeat: "a schema stands where a value of type `unknown` is narrowed, wherever it was parsed ... the transcript's line readers keep `isMap` where a schema costs time". The brief's Decision 1 draws a narrower boundary: a map or list read for its fields, with a single `unknown` argument kept by hand. That is a reversible decision, which the brief names, but it differs from the boundary written in Z96's record and does not cite it.

Findings: no ADR. **Change on Z96:** cite it in Decision 1 and say why the boundary is narrower here. Cite it in item 12 (section 5).

## Declined to judge

- Whether the unlisted readers of finding 3.2 should be converted or kept is the orchestrator's decision under Decision 1's boundary. I only report that the brief must place them.
- How simply the second landing merges against Q85a2 (finding 3.9) is the orchestrator's judgment under Z34 and Z71. I report the overlapping lines only.
- I did not run the full verify list or the existing suites, since nothing in this check changes code. Verify 1's script exists (`ls ~/.claude/skills/land/templates/checks.sh`), `npm run diagrams` is defined (`package.json:17`), and the state file's first yaml block holds seven commands. Whether each later fails on its defect depends on the builder's change.
- The wallpaper `settings` and `folderOf` cases were judged by reading only. A probe would call `loadLocalOrDefaults(engine)`, which reads `config/local.yml`.

Agent usage: claude-opus-5-5, 322,964 tokens, 100 tool uses, 15.8 min (the completion notice).

## Closed

Each finding is closed by a change to `agents/briefs/Q85a4.md`, made before the preparation commit.

- 1.1 (`text` of `core/json.ts` left with no caller once both steps land): What is on the tree names its callers in both steps and its duplicate in `guards.ts:42`; item 9 says the landing that comes second deletes it when the merged tree leaves it none; the shared-paths bullet says the same.
- 3.1 (nine files without `unknown`): listed and classified under What is on the tree; `machine/usage/routes.ts:19`, `machine/hpc/routes.ts:25`, `git-index.ts` and `git-remote.ts:71` stay as single checks with their own refusal (Decision 1), the rest are `typeof` in a type.
- 3.2 (readers in neither group): `handleFsWrite` converted with `handleGit`'s rule (item 2); `addRow`'s cast goes through `addedRowShape` (item 2); every provider-answer field read converted (item 5, the list widened with lines); `projects.ts:440,450,459,471` and `publications.ts:93` converted (item 6); the `action` comparisons, `accountAction`, `removeAccount`, `handleMail`'s `thread`, `setup.ts`'s `handleSetupWrite` (via `providerHalf`) stay with their reason; the reply `body` and the calendar `event` move to the stays list as single checks with their own refusal.
- 3.3 (the casts of `pty/routes.ts`): every cast listed with its line; item 2 and Decision 2 say they all go, `StartRequest`'s `kind`, `cols`, `rows` typed `unknown` where `startTerminal` checks them; Verify 4's grep widened.
- 3.4 (`DESIGN.md:148`'s last sentence): item 10 gives its new text.
- 3.5: `compose.ts:69` added to the type list.
- 3.6 (`compose`): dropped from the body readers; its `typeof` tests at 156, 170, 174 are deleted (item 2).
- 3.7 (`rows.ts:72`): its own bullet with the reason.
- 3.8 (`typeof` on typed `string` parameters): Decision 1 gives the reason they stay, `git-routes.ts:10-12`.
- 3.9 (shared paths with Q85a2): a bullet under What is on the tree says how the second landing merges; the dispatch entry carries `shared_paths:`.
- 4.1 (case 13): the first part asserts no throw, the typed answer is marked "after the change", and the rule above the Cases names the exception.
- 4.2: `read_limits` and `readLimits`.
- 4.3: `file: undefined`, the key present.
- 4.4: `label: 7` answers `id: '7'`, `title: '7'`; `id: 7` with no label dropped.
- 4.5 (case 26): rewritten with the real `watchUsageRefresh` and the stubbed form's new throw stated as item 7's design.
- 4.6: `confirm: true` on the commit body.
- 4.7: the commit and stash parts run with `run` left out and a scratch repository; item 2 says `run` receives what it receives today.
- 4.8: eight refusals, the primitives added.
- 4.9: `plate.test.ts`, `file.test.ts`, `open.test.ts`, `calendar/routes.test.ts` and `sessions/terminal.test.ts` named in the cases and the paths; case 17 through `refusalLine`, case 12 through `newestCodexLimits`, case 8 through `countLines`.
- 4.10 (two sentences from one schema): items 6 and 7 name the construction, each part checked by its own schema in the hand code's order.
- 4.11 (Verify 3): the hits expected to remain named (`ics.ts`'s own `text`, `response.text()`, `open.ts:109`, `git-write.ts:172`); the others are converted.
- 5 (the question): case 9 uses `end` lines; Verify 3 states the table's expectation; item 12 cites Z96 with its fallback and times `UsageTranscriptFold.fold`; cases 26b and 26c hold the terminal start, the calendar `event` and the reply `body`.
- 6 (implied inputs): items 1 to 12 added to cases 1, 2, 6 to 10, 11b, 14 to 18, 20, 22, 24, 26b to 26d; item 6's triage `__proto__` is a defect the step ends (item 13, case 19, Decision 6), since a test never asserts a known defect; item 7's `??` rule corrected in item 1.
- 7 (ADRs and Z96): no ADR folder; What is on the tree and Decision 1 cite Z96 and say why the boundary is narrower; item 12 cites its second decision.
