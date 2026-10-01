# Step Q85a4 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q85a4, base a549ed92)

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
