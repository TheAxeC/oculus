# Step Q85a4 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q85a4, base ec247019)

The step is not ready to land as it stands. Item 6 is violated (Standards 1), item 1 is violated on its naming rule (Spec 1), and Spec 2 and Behaviour 1 need fixes. The verify list passes, and every case is met.

## Verification (rerun by the reviewer)

```
$ npm run diagrams            -> exit 0; the docs/diagrams diff is still 4 files, 12+/12-
$ sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md  -> exit 0
$ npm test
 Test Files  371 passed | 20 skipped (391)
      Tests  5977 passed | 596 skipped (6573)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
COMPLETED 2838 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed

The 28 case files run against the builder's unchanged copy (its src is the same as base for all 40 changed src files; each diff was reverse-applied and compared: "same: 40"):
 Test Files  4 failed | 24 passed (28)
      Tests  4 failed | 640 passed (644)
  The 4 failures:
    context.test.ts   "expected [Function] to throw an error"
    triage.test.ts    the prototype case
    compose.test.ts   "TypeError: Cannot read properties of null (reading 'agent')"
    refresh.test.ts   "expected undefined to strictly equal { refreshMin: 10, model: 'haiku' }"
The same files in the worktree:
 Test Files  28 passed (28)
      Tests  645 passed (645)

The slow-tagged files (deposit.test.ts, lines.test.ts, git-write.test.ts, git-ops), run by name:
 Test Files  4 passed (4)
      Tests  135 passed (135)
duplication.test.ts: 18 passed
paths.test.ts (worktree): Tests  1 failed | 8 passed (9)
  the extra entry: "lib/state/sources/repositories/change-tree.ts: export function insideFolder("

Verify 3:
  the loop:  files 36 lines 102
  its twin:  files 9 lines 20 (usage/routes 1, hpc/ssh 1, hpc/poll 1, hpc/routes 2, calendar/routes 1,
             mail/plate 1, git-index 5, git-remote 1, git-reads 7)
  the name grep: only z.number() lines inside schemas, ics.ts's own text(), response.text(),
                 open.ts:110 and git-write.ts:172

Verify 4:
  grep for .issues / prettifyError / treeifyError: prints nothing
  the const grep: prints no name without the Shape suffix
  the context.ts cast grep and the pty/routes.ts cast grep: print nothing
  the AccountRow grep: prints only actions.ts:186 (rowsIn)

Timing: the builder's timing.ts, run alternately on the unchanged copy and the worktree, 3 pairs.
Each figure is the mean of 5 runs in ms.
  createFold          orig 236.6 / 212.7 / 244.3   new 244.6 / 243.5 / 228.5   ratio of means 1.03
  newestCodexLimits   orig  44.4 /  46.6 /  42.6   new  47.7 /  47.0 /  46.6   ratio 1.06
  UsageTranscriptFold orig 130.7 / 118.4 / 128.6   new 131.6 / 122.2 / 119.8   ratio 0.99
  The answers of the two trees, diffed: "answers identical"

zod 4.6.5 probes (scratchpad/refute-q85a4):
  "catch([]) same instance true", "next parse [ 'polluted' ]", "catch(fn) same instance false"
  alias.ts, worktree:  "compose images same instance true []"   "next compose images [\"leak\"]"
  alias.ts, unchanged: "compose images same instance false []"  "next compose images []"
  scal.ts:  "same 15 of 15 absent {\"title\":\"\"} {\"title\":\"\"}"
  "loose keys [ 'path' ] proto is Object.prototype true 'root' in out false out.root undefined"
```

## Verdicts

Items of the brief's "What to build":

- 1: violated on the naming rule only (Spec 1). Every other part holds:
  - Every converted reader I checked gives the same answer. I read each of them, and the 28 case files pass on both trees, apart from the four parts that are meant to change.
  - The five probe rules are kept.
  - No parse error is read.
- 2: holds.
  - The handleTerminal casts are gone (the verify 4 grep prints nothing), and isTask replaces the TaskKind cast.
  - StartRequest's kind, cols and rows are typed unknown. cwd is typed unknown as well and passed raw. The answers stay the same: `directory()` (sessions.ts:233-235) refuses any non-string, and any string that `scalar` used to produce from a non-string, with the same sentence "cwd must be an absolute path".
  - The git and deposit bodies keep the wrong-type answers (cases 6 and 7). `run` receives the raw body.
  - addRow reads its fields through addedRowShape.
  - The compose typeof tests are gone. composeRequest's widening is Spec 2.
- 3: holds. The cloc, ripgrep and gh readers each have a schema. Cases 8-10 pass on both trees.
- 4: holds. accounts.ts's json, text and number are gone (the rename grep and the name grep). The other file readers have their schemas.
- 5: holds. The schemas are in api.ts, oauth.ts, both calendars and both mail providers. Cases 17 and 18 pass on both trees.
- 6: violated (Standards 1). rules.ts's `scalar` was restated as `scalarShape` instead of becoming guards.ts's `scalar`, although the builder's own case shows the two answer alike. The other parts hold:
  - readRoots and docFindings check each part with its own schema, in the hand code's order (cases 22 and 23).
  - Both mapOf functions and `number` are gone.
- 7: holds.
  - refreshSettingsShape parses part by part, cadence first.
  - context.ts calls requireRefreshSettings and the casts are gone (verify 4).
  - Cases 13 and 26 behave as the brief says.
  - context.ts also has an import hunk at lines 63-67, outside the brief's 262-269 range. The report states it.
- 8: holds. Lines 22, 23, 24 and 27 of allow-duplication.txt are removed, and the duplication check passes (18 passed).
- 9: holds. No core/json.ts helper is left without a caller. The comment names `sessions`, and the grep shows that only sessions files import text, whole, list and isMap.
- 10: holds, with a gap in the DESIGN.md wording (Spec 3).
  - The DESIGN.md paragraph is widened, and its last sentence reads as the brief asked.
  - The guards.ts head comment is rewritten. Its hunk runs to line 11, where the path list says 3-10, and the extra line is part of the same comment.
- 11: holds. The only removed lines in the case files are import lines, in source.test.ts, refresh.test.ts and git-write.test.ts. git.test.ts now imports `it` from the scratch fixture, so its existing cases run under that `it`; their text is unchanged and they pass (see Declined to judge).
- 12: holds. Both the builder's ratios (1.05, 1.18, 1.05) and my rerun (1.03, 1.06, 0.99) are under the 1.5 bound, and both trees give the same answers.
- 13: holds.
  - The triage reader skips `__proto__`. Case 19 fails on the unchanged tree and passes after the change.
  - The builder probed the other readers that build a map by assigning keys, and the report names them.
  - writeNote with the thread id `__proto__` (triage.ts:139) is left as it was, and that is correct by reading. `addressed()` (mail/routes.ts:90-100) only passes a thread id that starts with `${mailKey}-` and has a non-empty provider id, so `__proto__` cannot reach writeNote through the route. The thread id is not a file key, so it is outside item 13.

Cases of the brief's "Cases":

- Cases 1-12, 14-18, 20-25, 26b, 26d: met. I read the new describes in each named file. The 28 files pass on the unchanged tree, except the parts meant to fail there, and pass in the worktree (counts above).
- Case 11b: met (refresh.test.ts).
- Cases 11 and 12: met (refresh.test.ts, which the brief names next to usage.test.ts; usage.test.ts is at 896 lines).
- Case 13: met. The typed answer fails on the unchanged tree and passes after the change.
- Case 19: met. The prototype part fails on the unchanged tree and passes after the change.
- Case 26: met. The stub half does not throw on the unchanged tree and throws after the change, as the brief predicts.
- Case 26c: met.
  - The calendar case and the mail case are new.
  - open.test.ts gained no case. The existing case at open.test.ts:352, `{ root: 'hub', path: 7 }`, gives the `path: 3` answer, since a number path is refused the same way whatever its value.
- Cases 27 and 28: met. npm test passes, and no existing case's text is edited.

## 1. Spec

- 1. src/lib/server/machine/pty/compose.ts:202 `const pick = z.string().safeParse(value);`, and src/lib/server/content/audit/rules.ts:96 `const limit = z.number().safeParse(value);`, :101 `const lag = z.number().safeParse(config.stale_lag_days);`, :104 `const publications = z.string().safeParse(config.publications_file);`.
  - What is wrong: these schemas are built inline on every call, and none of them is a named const. Item 1 says "The schema is a `const` beside the function that reads, in that function's file, named in lower camel case ending in `Shape`".
  - Failure scenario: verify 4's const grep is the brief's check that every schema is named, and it cannot see these reads. A reader looking for a reader's schema next to its function finds nothing. In picksOf, a new z.string() schema is built for every pick of every compose request.
  - Verdict: item 1 violated, on naming only.
- 2. src/lib/server/machine/pty/compose.ts:225-228 `export function composeRequest(message: unknown): ComposeStart { const parsed = composeRequestShape.safeParse(message); return parsed.success ? parsed.data : EMPTY_START; }`. On base the signature was `composeRequest(message: Record<string, unknown>)`.
  - What is wrong: the parameter was widened, and a non-map now answers EMPTY_START where base threw a TypeError (the builder's compose case fails on the unchanged tree with "Cannot read properties of null"). No item asks for this.
  - Item 13 says the prototype changes "are the step's only changed answers", and the report's section on changed behaviour has "There should be none". The report does state this change, as changed behaviour 2.
  - The route cannot reach it: pty/routes.ts:418 checks the body with isMap before line 243 calls composeRequest.
  - Failure scenario: a direct caller that passes a non-map, which today gets a throw, now silently gets a shell start with an empty prompt.
  - The fix: keep the base parameter type and drop EMPTY_START, so that composeRequest reads its fields from a map as before.
  - Verdict: item 1 ("exactly what it answers on main") violated, for direct callers only.
- 3. DESIGN.md:148 "the request bodies of the terminal, git, deposit, file and mail routes".
  - What is wrong: this list leaves out the memories upload body (content/memories.ts `uploadShape`), which this step now reads through a schema. Item 10 asks the paragraph to name what is read in these folders.
  - Failure scenario: a reader who uses DESIGN.md to find which bodies have a schema concludes that the upload route reads its body by hand.
  - Verdict: item 10 partial, a wording gap.

## 2. Proof

- None.
- Each claim of the report I reran holds:
  - The four cases that fail before and pass after.
  - The three changed behaviours.
  - The timing claim, within the bound.
  - The slow-tagged runs.
  - The writeNote reachability claim, by reading.
- The paths.test.ts claim is that the test fails on base the same way. In the worktree it fails with the change-tree.ts entry. The step did not change change-tree.ts or the test, and the test's regex matches no line of the 40 changed files in either version. I derived the base result by reading; I did not run it at base (see Declined to judge).

## 3. Standards

- 1. src/lib/server/content/audit/rules.ts:86-89 `export const scalarShape = z.union([z.string(), z.custom<number>((held) => typeof held === 'number'), z.boolean()]).transform(String).catch('');`, and src/lib/server/machine/pty/routes.ts:94-97 `const steerTextShape = z.union([z.string(), z.custom<number>((held) => typeof held === 'number'), z.boolean()]).transform(String).catch('');`.
  - What is wrong: both are copies of src/lib/data/helpers/guards.ts:36-40 `scalar`. The rules file (agents/spec.md, "The principles every package is judged on") says "a parser, a fold or a rule exists once and is reused".
  - Item 6 says rules.ts's scalar "becomes guards.ts's scalar when the two answer alike for every value". The builder's own case ("a scalar field read as text") shows that they do.
  - On base, pty/routes.ts read the steer text through guards' `scalar(message.text)`. The step replaced that call with a third copy.
  - The report's reason (report item 4 of its judgment calls) is that "a schema field needs a schema". The probe scal.ts refutes it:
    - `z.unknown().optional().transform((v) => scalar(v))` answered the same as scalarShape for 15 of 15 values ('a', '', 0, 5, -1.5, NaN, Infinity, true, false, null, undefined, [], {}, [1], 10n).
    - It did so standing alone and as an object field.
    - It also did so with the key absent: `{"title":""}` from both schemas.
  - Failure scenario: a later change to how a scalar is written out (for example, a non-finite number becoming '') is made in guards.ts. The audit's status, date and link fields, the website papers' titles and the terminal's steer text keep the old rule, and the three readers drift apart without a test failing.
  - Verdict: item 6 violated.

## 4. Behaviour

- 1. The fallback arrays and defaults are now shared between calls.
  - `.catch([])` at:
    - src/lib/server/machine/pty/compose.ts:221
    - src/lib/server/machine/usage/accounts.ts:124 (and `.catch({ limits: [] })`)
    - src/lib/server/files/fs.ts:171 and :177
    - src/lib/server/files/fs/bookmarks.ts:94
    - src/lib/server/files/project-files.ts:107
    - src/lib/server/git/deposit.ts:225
    - src/lib/server/git/git-routes.ts:179
  - `.catch({ name: '' })` at src/lib/server/git/deposit.ts:795.
  - Module constants handed out by reference:
    - EMPTY_START (compose.ts:186, returned at :227)
    - NO_CLAUDE_FILE (accounts.ts:134, :139)
    - NO_CODEX_LIMITS (accounts.ts:504, :524)
    - NO_FILE_INDEX (project-files.ts:112, :123)
    - NO_LIFECYCLE (rules.ts:80, :100)
    - NO_CODE_BLOCK (deposit.ts:229, :245)
  - What changed: on base every fallback was a fresh `[]` or `{}` per call. Now every failing parse answers the same object. The probe alias.ts shows it:
    - The worktree gives `composeRequest({images: 3}).images === composeRequest({images: null}).images` true; the unchanged tree gives false.
    - After `push('leak')` on one answer, the next `composeRequest({images: 'z'}).images` is `["leak"]` in the worktree and `[]` on the unchanged tree.
  - No consumer mutates these today: compose.ts:172-175 only reads `images`, and deposit.ts:266 copies `topics` into the answer. So no host sees the change yet, and the report does not state it.
  - Failure scenario: a later consumer that sorts, pushes into or assigns to one of these answers, for example an in-place `topics.sort()` or `images.push(...)`. That corrupts every later fallback answer for the life of the server process.
  - The fix: `.catch(() => [])` and `.catch(() => ({ ... }))`, which the zod probe shows answer a fresh instance ("catch(fn) same instance false"), and a fresh default per call in place of the module constants.
  - Verdict: no item violated by value. This is a latent defect introduced by the step.

## Declined to judge

- paths.test.ts at base: not run, because I may only run `git diff` and `git status`, so base could not be checked out. The claim that base fails the same way is derived by reading.
- The stash body `mode: 'constructor'` reaches `STASH_FLAGS[mode]`, an inherited property. Base does the same, the step did not change it, and I did not probe it.
- What writeNote should do for the thread id `__proto__`: refuse it or store it. The report rightly leaves this to Axel.
- git.test.ts now runs its existing cases under the scratch fixture's `it` (tests/fixtures/scratch.ts:105) instead of vitest's. The case text is unchanged and every case passes. Whether swapping the runner counts as editing existing cases under item 11 is the orchestrator's reading.
- The hand merge with Q85a2 on DESIGN.md:148, core/json.ts:91-92, allow-duplication.txt and docs/diagrams is the landing's job.

Reviewer usage: about 475,000 tokens by the session counter (15,000,000 at the start, 14,524,612 at the end); the number of tool uses and the minutes were not counted.

Usage (the completion notice): claude-opus-5-5, 118,315 tokens, 88 tool uses, 20.9 min.


## Repair round 1, refuted

Q85a4, worktree /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q85a4, base ec247019. The verify list passes, and every claim of the round that I reran reproduces. I found two Standards findings, both small and inside the brief. Spec, Proof and Behaviour have none.

```
$ npm run diagrams   (docs/diagrams identical before and after the run: diff -r printed nothing)
$ sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md   (exit 0)
$ npm test
 Test Files  371 passed | 20 skipped (391)
      Tests  5976 passed | 600 skipped (6576)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
1790842619572 COMPLETED 2838 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed

Slow-tagged files by name (deposit, git-write, lines, git-ops; the four changed test files that carry @module-tag slow):
npx vitest run tests/server/git/deposit.test.ts tests/server/git/git-write.test.ts tests/server/machine/lines.test.ts tests/server/git/git-ops.test.ts --testTimeout 0 --hookTimeout 0
 Test Files  4 passed (4)
      Tests  139 passed (139)

The 28 case files plus open.test.ts, rows.test.ts and usage.test.ts (the 29 in the report's table), in the worktree:
 685 passed, 0 failed. The per-file counts equal the report's "After" column.
```

Cases claimed to fail first. I made `scratchpad/refute-r1/pre`, a copy of the worktree with the round's source changes taken out: the `.catch([])` form in compose.ts, no `Object.hasOwn` in git-refs.ts and git-index.ts, and no `__proto__` throw in `writeNote`. The tests are in their final form there.
```
npx vitest run tests/server/machine/pty/compose.test.ts tests/server/accounts/mail/triage.test.ts tests/server/git/git-ops.test.ts
 Tests  5 failed | 65 passed (70)
 compose.test.ts  "answers a fresh empty list of images ..."   AssertionError: expected [ 'leak' ] to strictly equal []
 compose.test.ts  "keeps the fields it holds and starts the rest empty"   (the shared array carried 'leak')
 triage.test.ts   "refuses a write for the thread id __proto__ ..."       AssertionError: expected [Function] to throw an error
 git-ops.test.ts  "hunks and lines > refuses a mode that is a property every object inherits"   TypeError: flags is not iterable
 git-ops.test.ts  "stashes > refuses a mode that is a property every object inherits"          TypeError: flags is not iterable
```
Each failure matches the report's quote. The unchanged tree is the base `src` rebuilt by reverse-applying `git diff ec247019 -- src` to a copy, and it equals the builder's `src-orig` (`diff -rq` printed nothing). Running the 26 changed test files against it gives:
```
 Tests  7 failed | 614 passed (621)
 refresh.test.ts "answers the two settings as a number and a string" | context.test.ts "throws the same sentence before a replaced refresher ..." | triage.test.ts (the __proto__ write and the __proto__ note) | audit.test.ts "a scalar field read as text" | git-ops.test.ts (the two inherited-mode cases)
```
These are the report's seven. Every other case passes on the base `src`, so the tests state base behaviour.

Other reruns:
```
verify 3 loop: files 35 lines 99   twin: files 9 lines 20
  name grep: only z.number() inside schemas, ics.ts's own text(), response.text(), open.ts:110 and git-write.ts:172
verify 4: no .issues/prettifyError/treeifyError hit; every "const x = z" name ends in Shape (grep -v printed nothing);
  no " as string/number" in context.ts; no cast of the pty/routes.ts kind in the cast grep; "as AccountRow" only at actions.ts:186 (rowsIn)
timing (builder's timing.ts, 3 pairs, base vs worktree, means of 5 in ms):
  createFold 247.0/264.5/225.2 vs 250.3/241.4/249.8      newestCodexLimits 47.1/50.1/46.6 vs 58.8/51.2/56.6
  UsageTranscriptFold 138.3/123.7/124.3 vs 153.8/147.0/140.3
  highest pair ratios 1.11 / 1.25 / 1.19, all under 1.5; the printed answers are equal in each pair
differential probe, composeRequest on base vs worktree over 17 maps (own __proto__ pick, picks list/null/string, images null/string/mixed, wrong-typed cwd/account/prompt, key order): all "same"
```

## Verdicts

Items of the brief's "What to build", for the whole diff since the base:

- 1: holds. Every schema is a module-level `...Shape` const. The inline ones the first review named (`compose.ts` `pickShape`, `rules.ts` `readLimitShape`, `staleLagShape`, `publicationsFileShape`) are now consts, and no `z.` call is built inside a function. The only non-top-level `z.` hits are `keeping()` at rules.ts:44, a factory that is only called at module level (rules.ts:56, 70, 76), and fields inside module-level schemas. No parse error is read (greps above). The fallbacks are fresh per call (see ruling 5 below). The base-versus-worktree probes and the 614 passing base-tree cases give the same answers.
- 2: holds. `composeRequest(message: Record<string, unknown>)` has base's signature and `EMPTY_START` is gone (`grep -rnw EMPTY_START src tests` prints nothing). The 17-input probe equals base. The handleTerminal casts are gone and `addRow` reads `addedRowShape`.
- 3: holds. The cloc, ripgrep and `gh` readers each have a schema, and cases 8 to 10 pass on both trees.
- 4: holds. `json`, `text` and `number` are gone from usage/accounts.ts. The schema readers are in place and the usage cases pass on both trees.
- 5: holds. The schemas are in api, oauth, both calendars and both mail providers, and cases 17 and 18 pass on both trees.
- 6: holds, and the first review's Standards 1 is closed. `scalarShape` (rules.ts:83) and `steerTextShape` (pty/routes.ts:93) are `z.unknown().optional().transform((value) => scalar(value))` with `scalar` from guards.ts. `scalarShape` is imported by projects.ts and publications.ts. `mapOf` and `number` are gone (rename grep). `readRoots` and `docFindings` keep their findings (cases 22 and 23 pass).
- 7: holds. `requireRefreshSettings` is typed, `context.ts` calls it, and the casts are gone. The context and refresh cases fail on the base tree and pass now.
- 8: holds. Allowlist lines 22, 23, 24 and 27 are removed and the duplication check passes inside `test:checks`.
- 9: holds. No step folder imports `text`, `whole`, `list` or `isMap` from core/json (grep above). Nine `sessions` files do, and the comment at core/json.ts:91-92 names `sessions`.
- 10: holds, and the first review's Spec 3 is closed. DESIGN.md:148 now names the terminal, git, deposit, file-browser write, source, open, account add, mail triage and memories upload bodies. I enumerated the tree's body readers myself:
  - `tokenedBody` is called in pty/routes.ts:454, git-routes.ts:283, deposit-routes.ts:182, fs.ts:567, source.ts:120, open.ts:340 and memories.ts:163.
  - `gatedBody` is called in mail/routes.ts:137, calendar/routes.ts:45, hpc/routes.ts:17, usage/routes.ts:16 and connect/setup.ts:61.
  - The hpc, usage, calendar and setup bodies are the brief's "stays" list.
  - Account add is read at connect/actions.ts:193 (`addedRowShape`), so the paragraph is right to name it as the ninth, beyond the ruling's eight.
  - guards.ts's head comment is rewritten.
- 11: holds. `usage.test.ts` is not in `git status`. `git.test.ts` imports are identical to base: `describe, expect, it` from vitest and no fixture, as in `git show` of the base file as shown in the diff, which changes only the head comment and appends a describe. No existing case text is edited.
- 12: holds (timing above).
- 13: holds. `readTriage` skips `__proto__` (triage.ts:96-99). The case fails on the base tree and passes now. `writeNote` now refuses the thread id `__proto__` (triage.ts:130).

Cases of the brief's "Cases":

- 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 11b, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 26b, 26c, 26d: met. Each is a test in its named file. All 685 tests pass in the worktree and, apart from the 7 parts marked to fail, the same tests pass on the base `src`. Spot greps confirm the specific inputs exist: `[object Object]` in deposit.test.ts, `1e999` in channel.test.ts and terminal.test.ts, `an answer needs words`, `no such event`, and the nav_groups case.
- Case 6, last sentence (`commit` with `message: 3` and `null`; `stash` with `mode: ''`): met, now in `tests/server/git/git-write.test.ts:617-679`. See ruling 8.
- 27, 28: met. `npm test` and `npm run test:checks` pass, and no existing case text is edited.

Rulings of the round:

- 1 (inline schemas): closed. The consts are at compose.ts:186 and rules.ts:89, 92 and 95.
- 2 (`composeRequest`): closed. The signature is `Record<string, unknown>`, the "no map" describe is gone, and the 17-input probe equals base.
- 3 (DESIGN.md:148): closed (item 10).
- 4 (`scalar` once): closed. The shapes call guards.ts's `scalar`, and audit.test.ts:836 compares `scalarShape.parse(v)` with `scalar(v, '')` over the 15 values.
- 5 (fresh fallbacks): closed.
  - In the five step folders plus `root` and `core`, `grep -rnE "\.(catch|default)\(\s*(\[|\{)"` prints nothing and there is no `.default(` call.
  - The remaining `.catch(` arguments are primitives, `undefined` or arrow functions.
  - Every array or object fallback is `.catch(() => [])` or `.catch(() => ({ ... }))`: compose.ts:214, accounts.ts:125-126, fs.ts:171 and 177, bookmarks.ts:94, project-files.ts:107, deposit.ts:225 and 785, git-routes.ts:179, google.ts, microsoft.ts, rules.ts and actions.ts:168.
  - The constants `NO_CLAUDE_FILE`, `NO_CODEX_LIMITS`, `NO_FILE_INDEX`, `NO_LIFECYCLE` and `NO_CODE_BLOCK` are gone (`grep -rnw` over src, tests, config and docs prints nothing). Each use is `<shape>.parse({})` at the failing call (accounts.ts:138 and 520, project-files.ts:120, rules.ts:106, deposit.ts:235).
  - The diff adds no module-level object or array constant outside `...Shape`, apart from `OPERATIONS` in git-routes.ts.
  - The remaining fixed objects `DEFAULT_SHOWN`, `DEFAULT_ROOT` (fs.ts) and `NO_ROWS` (poll.ts) are base code that the diff does not change.
  - The one case (compose.test.ts:410) fails on the pre-round copy and passes now.
- 6 (inherited modes): closed. `Object.hasOwn` is on both tables (git-refs.ts:59, git-index.ts:89), and the cases cover `constructor`, `toString` and `__proto__` for both. They fail on the pre-round copy with `flags is not iterable`. `OPERATIONS` and the deposit table are reached through `byKey`, which is `Object.hasOwn`-based, and `action` is a `z.enum`. The form of the guard is Standards 2.
- 7 (`writeNote`): closed. It throws `no such thread` for `__proto__` before reading the file. The case fails on the pre-round copy.
- 8 (`git.test.ts` runner): the deviation is real and the move holds, so I count it as met.
  - I reproduced the clash. In my copy I added `import { it as scratchIt, scratchDir } from '../../fixtures/scratch.ts'` and one `scratchIt` case to `tests/routes/git/git.test.ts`. `npx vitest run tests/checks/tree/scratch.test.ts` then gave `2 failed | 15 passed`, one entry being `"tests/routes/git/git.test.ts takes a scratch directory and declares cases with vitest's it"`. So the ruling as written cannot pass `npm run test:checks`.
  - `git.test.ts` is back to base's runner for every case. Its import lines are identical to base, the file has no `scratch` reference, and the diff against base is the head comment plus the appended describe of the stub-run cases (bodies with no action, `root: 3`, `confirm: 'true'`, own `__proto__` key).
  - The two moved cases are in `git-write.test.ts` under that file's fixture `it`. They are `commit` with `message` 3 and `null` answering 400 `a commit needs a message`, and `stash` with `mode: ''` answering 200 and leaving only `?? loose.txt` in `git status --porcelain`. That is the brief's case 6 behaviour, with the real operations and no `run`. I could not compare their text with the first-round form, because I have no copy of that tree.
  - The builder raised the clash itself, and the orchestrator has accepted it (state file, builder_usage).

## 1. Spec

None. The ruling 8 move and the DESIGN.md account-add entry are both reasoned above and are not findings.

## 2. Proof

None. Every claim of closure that I reran reproduces: the five failing cases on the pre-round copy, the seven on the base `src`, the slow files, the timing, and the loop, grep and rename counts. The ruling 5 case covers only compose.ts's `images` fallback, which is what the ruling asked for. The twelve other fresh-fallback sites are established by my read and grep and have no test of their own.

## 3. Standards

- 1. tests/server/git/git-write.test.ts:1-10 head comment: "The last describe is the module's gate, the mirror image of the one over git.ts: git.ts may name no writing subcommand at all, and this may name only the enumerated ones". `grep -n "describe(" tests/server/git/git-write.test.ts` shows the gate describe at :561, then 'the commit-message model of a configuration of the wrong shape' at :604 and 'the git route on a body of the wrong shape, over the real operations' at :617. The step adds both after the gate, and the second is this round's move. What is wrong: a sentence in a head comment that the diff makes false (spec.md, "What every package obeys", after changing a name or a shape, a sentence the change makes false is a defect of the change). Failure scenario: a reader who trusts "the last describe is the gate" and looks at the end of the file finds route cases; one who adds a gate case there, or a script that finds the gate at the end, goes wrong. The head also does not mention that the file now holds route cases and the `messageModel` cases. Fix: reword the sentence (the gate is a describe in the middle) and say what the other two describes hold. No verdict changes.
- 2. src/lib/server/git/git-refs.ts:59 `const flags = Object.hasOwn(STASH_FLAGS, mode) ? STASH_FLAGS[mode] : undefined;` and src/lib/server/git/git-index.ts:89 `const flags = Object.hasOwn(FLAGS, mode) ? FLAGS[mode] : undefined;`. What is wrong: these restate `byKey` of src/lib/data/helpers/guards.ts:54, `Object.hasOwn(record, key) ? record[key] : undefined`, which the same step's git-routes.ts (`byKey(OPERATIONS, fields.action)`) and deposit-routes.ts already use. agents/spec.md, "The principles every package is judged on": "a parser, a fold or a rule exists once and is reused". Ruling 6 names `Object.hasOwn(STASH_FLAGS, mode)` in a parenthesis, so the inline form follows its literal text; whether it dictated the form is the orchestrator's reading. Failure scenario: a later change to how an own key is read (for example a `Map`) is made in `byKey` and the two tables keep the old reading. The same inherited-property defect can come back in a third table without a shared helper to point to. Fix: `byKey(STASH_FLAGS, mode)` and `byKey(FLAGS, mode)`; the new git-ops cases are the check, and they already fail without the guard. No verdict changes; this is small and inside the brief, so it can be fixed at landing.

## 4. Behaviour

None. The round's changes of behaviour are the inherited stash and patch mode (now the existing refusal instead of `TypeError: flags is not iterable`) and `writeNote` refusing `__proto__`. The report states both, with before and after, as changed behaviours 3 and 4. A non-map passed directly to `composeRequest` still throws, now a ZodError instead of a TypeError. The route cannot reach that, since pty/routes.ts:457 tests `isMap` first.

## Declined to judge

- `tests/server/core/paths.test.ts`, `root/hooks.ts:125,139` and the merge with Q85a2: on your already-known list. I did not judge them.
- The moved cases against their first-round text: I have no copy of the tree the first review read. I judged them against the brief's case 6 and by the behaviour they check (above).
- Whether the ruling 8 deviation needs a recorded ruling: it is a clash between a round ruling and `scratch.test.ts`. I reproduced the clash. Recording it is the orchestrator's decision.
- The round's delta as a diff: the builder runs no git, so I read it ruling by ruling against the whole diff since the base, not as a diff of two trees.

Reviewer usage: about 255,000 tokens by the session counter (15,000,000 at the start, 14,749,000 at the end), about 80 tool uses, minutes not measured.

## Closed

- Repair round 1, refuted, Standards 1 (`tests/server/git/git-write.test.ts` head comment calling the gate "the last describe"): fixed at landing; the comment names the gate describe and says what the two describes after it read.
- Repair round 1, refuted, Standards 2 (the two flag tables read through `Object.hasOwn` inline, restating `byKey`): fixed at landing; `git-refs.ts` and `git-index.ts` read `byKey(STASH_FLAGS, mode)` and `byKey(FLAGS, mode)`, and the inherited-mode cases of `git-ops.test.ts` pass.
- The first review's findings: closed in repair round 1, as the run over the round records.
