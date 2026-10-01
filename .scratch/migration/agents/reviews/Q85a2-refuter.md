# Step Q85a2 refuter report (on .agents/worktrees/Q85a2, base 4f4dcfc4)

Not done, first: the step is not green. `npm test` and `npm run test:checks` each fail two cases. Both failures come from the move of `core/json.ts` and the `bodies.ts` text, and are handed to the orchestrator. The review also found one defect that no case catches: an `event_msg` record with no `payload` key throws inside `foldCodex`. That stops the fold, and every later scan double-counts the rollout.

## Verification lines (verbatim)

`checks.sh` (Verify 1):
```
$ npm test
 FAIL  |unit| tests/routes/edit/config-key.test.ts > a setting written through the route > has a word of its own in the History view, a setting
AssertionError: expected [] to include 'config-key'
 FAIL  |unit| tests/views/system/history.test.ts > the History view > names every kind of write in words, and never draws the wire word
AssertionError: expected 0 to be greater than 0
 Test Files  2 failed | 369 passed | 20 skipped (391)
      Tests  2 failed | 5927 passed | 600 skipped (6529)
checks: failed with exit 1: npm test
```
`npm run test:checks`:
```
 FAIL  |unit| tests/checks/diagrams/readable.test.ts > the drawings the source gives > have no two arrows running along each other in the write diagram
+   "lib/server/edit/entry-edit/entries.ts->lib/server/edit/yaml-edit.ts along lib/server/edit/writes/entries.ts->lib/server/edit/entry-edit/entries.ts for 48",
    (8 pairs in all)
 FAIL  |unit| tests/checks/source/keys.test.ts > text keys > has a reader for every catalog key
AssertionError: expected [ 'history.kind_manifest', ...(18) ] to deeply equal []
 Test Files  2 failed | 27 passed | 2 skipped (31)
      Tests  2 failed | 440 passed | 9 skipped (451)
```
- `npm run check`: `COMPLETED 2838 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npm run build`: exit 0.
- `npm run format:check`: `All matched files use Prettier code style!`.
- `npm run lint`: exit 0.
- `! LC_ALL=C grep -rna '[^ -~]' src tests`: exit 0.
- `npm run diagrams`: exit 0. It regenerates `layer-server`, `layers` and `writes` (.dot/.svg).
- The 12 changed test files on a copy of base with the new tests: `Test Files 1 failed | 11 passed (12)`, `Tests 1 failed | 345 passed | 3 skipped (349)`. The failing case is "drops an entry with a field of the wrong type, and the scan folds from zero", as the brief expects.
- The same files on the worktree: `Test Files 12 passed (12)`, `Tests 349 passed (349)`.
- The slow files by name (`write.test.ts`, `yaml-edit.test.ts` and the third): `Test Files 3 passed (3)`, `Tests 162 passed (162)`.
- Verify 3 count: base `total 308 28`, worktree `total 134 20`.
- Verify 4: all three greps print nothing.
- Verify 7: the rename grep has no stale hits.

## Verdicts on "What to build"

- 1, the rule: **violated**.
  - The schema at `codex.ts:185` makes `payload` required, so a reader that was total on main now throws (Behaviour B1).
  - `commandShape` (`turns.ts:186`) changes an answer (Behaviour B2).
- 2, request bodies: **holds**. I sent 31,164 JSON bodies through all 20 readers on base and worktree and got 0 differences. Decision 7 excludes the only other difference, own keys holding `undefined`, because they are not JSON.
- 3, `asFieldValue`: **holds**. 48 values give 1 difference, the sparse array, which cases ruling 8 rules no change.
- 4, files oculus parses: **holds**. `readFeedFile` keeps its three thrown sentences; case 13 passes.
- 5, run-time configuration: **holds**. `careerRules`, `fieldTypes`, the identity readers, `overrides` and the registry candidates: 405 probes, 0 differences.
- 6, changes-log values: **holds**.
- 7, transcripts: **violated**.
  - B1 and B2.
  - The Claude content-text rule is written twice (Spec S4).
  - `eventOf` is read by hand on a time reason that I could not reproduce (Proof P1).
- 8, JSON files: **violated, and stated by the builder**. `cacheEntryShape` (`cache.ts:50,53`) requires `size` and `offset` to pass `Number.isInteger`; the brief says "finite numbers".
- 9, guard duplicates: **holds**.
- 10, what stays: **violated**.
  - The `core/json.ts:92-93` comment names only `git/git-routes.ts`. It does not name the folders that import the `isMap` re-export or the new helpers.
  - Verify 3's literal condition is not met (Spec S3).
- 11, docs: **violated**. The `DESIGN.md:148` sentence "since a schema for it slows the pass over a rollout past 1.5 times its time without one" rests on a measurement I could not reproduce (P1).
- 12, no existing case edited: **holds**.
  - `registry.test.ts` changed its `it` import to `../../fixtures/scratch.ts`, so its existing cases now run under that `it`. Their bodies are not edited.
  - `transcripts.test.ts` sits at 900 lines, the file limit.
- 13, the fold's time: **violated**. The one hand reader kept for time (`eventOf`) is not justified by my measurements, and whether the 1.5x bound holds over whole passes is not settled on this loaded machine (P1, P2).

## Verdicts on "Cases"

- 1 to 15: **met**.
- 16: **met**, with the adapted inputs that cases ruling 5 accepts.
- 17 to 22: **met**.
- 23: **met**, with `acc.aiTitle` per cases ruling 1.
- 24: **met**.
- 25: **partial**. `config-key.ts` itself is unchanged, but `config-key.test.ts > has a word of its own in the History view` fails through `tests/fixtures/kinds.ts` (S2).

## 1. Spec

**S1. `codex.ts:185`: an `event_msg` with no payload throws.** Verdict: item 1 and item 7 violated (major).
```
const eventRecordShape = z.object({ timestamp: stampShape, payload: z.unknown() });
...
        const { timestamp: stamp, payload } = eventRecordShape.parse(record);
```
A `z.unknown()` key in `z.object` is required. On main the reader is total. On the worktree, `.parse` throws a ZodError, `foldFrom`'s outer catch returns 0, and the rest of the rollout is never folded.

Failure scenario, `p/nopayload.mts`, a rollout of session_meta, then `{type:'event_msg', timestamp}`, then a user message:
```
orig foldFrom read 314 prompts 1 seen 3 firstPrompt hello
orig readSession prompts 1 title "hello"
wt foldFrom read 0 prompts 0 seen 1 firstPrompt null
wt readSession prompts 0 title "abc"
```
See B1 for the repeated-scan effect. The fix is `payload: z.unknown().optional()`, plus a case in `transcripts.test.ts`. That file sits at 900 lines and cases ruling 4 forbids a further line there, so the case goes in the codex store's test file.

**S2. The two red checks.** Verdict: Verify 1 unmet.
- `tests/fixtures/kinds.ts:20` still matches `/body\.kind !== '([a-z-]+)'/g` against `bodies.ts`. That text is gone, so `recordedKinds()` answers `[]`. Three tests use it: `config-key.test.ts:82`, `history.test.ts:180` and `keys.test.ts:165`.
- The write diagram (`utils/diagrams/writes.mjs` `reachesDisk`) works at module level. `core/json.ts` reaches the disk through `writeTextAtomic`, so every module that now imports a zod helper from `json.ts` is drawn as a writer. That gives 8 arrow pairs.

The diagnosis and options are judged below.

**S3. Verify 3's literal condition is not met.** Verdict: item 10 violated.

The helper grep prints 30 lines that the brief does not list under "The other check lines". Among them:
- `feeds.ts:349,414,418,471,509`
- `writes/entries.ts:286,362,363,381,384,397,535,559`
- `undo.ts:173`
- `deck.ts:39,76`
- `rail.ts:47,93`
- `deck-edit.ts:45,49`
- `list-edit.ts:183`

The builder classes them as comparisons and bare map tests. I read them: most are a `typeof x === 'string'` scalar test on a YAML node or a bare `isMap` on a parsed document. Neither the brief nor a ruling covers them, so the orchestrator should rule on them rather than accept them silently.

**S4. `fold.ts:92-97` duplicates `background.ts:44-48`.** Verdict: item 7 violated; spec rule "a parser, a fold or a rule exists once".
```
const userContentShape = z
...
            text: blocks.map((block) => block.text ?? '').join('\n')
```
Against `background.ts:48`: `.transform((blocks) => blocks.map((block) => block.text ?? '').join('\n'))`.

Item 7 says a schema two files need is written once and imported. The failure scenario is drift: a change to how Claude content text is joined lands in one file and not the other, and the background-agent id and the prompt text disagree.

**S5. `cache.ts:50,53`: `size` and `offset` must be whole numbers.** Verdict: item 8 violated; the builder states it.

A fractional `size` or `offset` now drops the entry, and that transcript is folded from the start (`p/cache.ts` cases sizeFrac and offsetFrac). It is harmless, since no writer produces a fractional value, but it differs from the brief and needs a ruling or a change back to finite.

**S6. No case covers an `event_msg` without `payload`.** Verdict: item 7 violated. This is the missing check that would have caught S1.

## 2. Proof

**P1. The 1.61 figure behind the hand-read `eventOf` is not reproduced.** Verdict: items 11 and 13 violated.

`codex.ts:151` says "read without a schema: an event is most of a rollout's records". `DESIGN.md:148` says "since a schema for it slows the pass over a rollout past 1.5 times its time without one". The builder's report quotes 55.3 vs 34.4 (1.61) for the schema form.

I built a copy of the worktree in which `eventOf` reads through a `quickly` five-field schema (`$S/rev/alt`). I then ran a steady-state pass over the same rollout, 4 rounds of min/median ms:
- unchanged: 37.8/47.4, 33.1/42.2, 33.9/36.6, 33.4/40.8
- worktree (hand `eventOf`): 54.8/68.6, 45.8/57.9, 54.1/71.2, 47.0/68.1
- schema `eventOf`: 46.1/63.9, 45.4/55.1, 46.2/58.7, 43.8/46.6

On this machine, the schema form was no slower than the hand form, and in most rounds it was faster. The decision the figure supports, keeping a hand narrowing where the brief asks for a schema, plus its DESIGN sentence, is therefore unproven.

The failure scenario is a permanent hand reader and a false sentence in DESIGN.md. The fix is to re-measure on an unloaded machine with both forms in the same process, and to keep `eventOf` by hand only if the schema form exceeds the bound there.

**P2. The bound over whole passes is unsettled.** Verdict: item 13 violated (not verified either way). I ran 3 alternating rounds of `timing.mjs` on a loaded machine. Means, unchanged vs worktree:

| pass | unchanged | worktree | ratio |
|---|---|---|---|
| foldFrom+foldClaude | 91.4 | 109.1 | 1.19 |
| foldFrom+foldCodex | 46.6 | 49.5 | 1.06 |
| usage table claude | 75.2 | 97.3 | 1.29 |
| usage table codex | 43.4 | 51.9 | 1.20 |
| readTurns claude | 112.4 | 138.2 | 1.23 |
| readTurns codex | 37.9 | 50.0 | 1.32 |

A second 3-round run of the codex passes gave foldCodex 40.3 vs 67.3 (1.67), with the schema-event copy at 56.0 (1.39). The run-to-run spread on this machine is larger than the margin to 1.5, so these figures neither confirm nor refute the bound.

`claudeUsage` alone went from 2.0 to 12.3 ms and `codexUsage` from 2.5 to 9.4. The bound applies per whole pass under cases ruling 2, so these per-function figures do not break it, but they show where the time goes.

The check the brief asked for, that the `event_msg` reader is the only reader that kept its hand checks for time, holds. I read every transcript reader: `eventOf`/`wholeField` (`codex.ts:145-160`) is the only remaining hand narrowing, and the `record.type ===` dispatch is a comparison.

## 3. Standards

**T1. `core/json.ts:134-138`: the `quickly` comment is false in general.** Verdict: spec rule "a sentence ... that the change makes false is a defect".
```
 * `shape`, read the quick way first. A well-formed value passes the same shape without its `.catch`
 * wrappers and gives the answer `shape` gives; ... The answer is `shape`'s either way.
```
`withoutCatch` rebuilds a ZodObject as a plain `z.object` and a ZodArray as a plain `z.array`. That loses `looseObject` passthrough, object-level `.refine` and array `.min`. Output of `p/quick.mts`:
```
looseObject: shape {"a":"x","b":1} quickly {"a":"x"}
object refine: shape {"a":"refused"} quickly {"a":"x"}
array min: shape ["none"] quickly []
```
No current call site uses those forms; the fuzz of all four readers, seeds 7, 11, 23 and 99, shows 0 differences. The failure scenario is the next caller who wraps a loose or refined shape in `quickly`. The fix is either to keep those forms in `withoutCatch` or to make the comment name the forms it supports and refuse the others.

**T2. `DESIGN.md:148` time clause.** See P1. Verdict: item 11.

**T3. One name for two different schemas.** Verdict: spec naming (no synonyms, and its converse, one name for one thing).
- `contentTextShape`: `background.ts:44` joins with '\n'; `codex.ts:64` is local and joins with ''.
- `stampShape`: `record.ts:219` takes a string only; `usage.ts:24` takes a string or a number.
- `claudeMessageShape`: `usage.ts:60` and `turns.ts:118`.
- `codexPayloadShape`: `usage.ts:157` and `turns.ts:219`.

The failure scenario is an auto-import picking the wrong one.

**T4. `fold.ts:105` `const NO_CONTENT = { prompt: '', blocks: [], text: '' };`** Verdict: spec rule "a file-scope mutable is a defect" (minor). It is a shared object holding an array. Nothing mutates it today, but the type does not stop a caller that pushes to `blocks`. The fix is to freeze it or build it per call.

**T5. `core/json.ts` now holds both the zod helpers and disk writes.** Verdict: the module's head comment ("plus the type guards every fold uses") and the layer drawing. This is the cause of S2's diagram failure.

**T6. The builder ran `git ls-files` and `git -C . diff --stat`.** Verdict: spec rule "builders run no git". Both were read-only, and the builder's report admits both.

## 4. Behaviour

**B1. A missing `event_msg` payload stops the fold, and each scan double-counts.** Verdict: item 1 violated (major). From `p/scanloop.mts`, a rollout scanned three times with one line appended between scans:
```
orig scan1: prompts=2 messages=2 | scan2: prompts=2 messages=2 | scan3: prompts=2 messages=2
wt scan1: prompts=1 messages=1 | scan2: prompts=2 messages=2 | scan3: prompts=3 messages=3
```
The cache entry is saved with offset 0 and the partial accumulator, so each scan folds the file again on top of it. Counts on the Sessions page grow without bound. The fix is the one in S1.

**B2. `turns.ts:186-195` `commandShape` changes a Codex tool summary.** Verdict: item 1 violated (minor). From `p/cmd.mts`, an item with `path: 'src/a.ts'`:
```
command ['']: orig {"...","summary":"","ok":true} | wt {"...","summary":"src/a.ts","ok":true}
command ['', 3]: orig {"...","summary":"","ok":true} | wt {"...","summary":"src/a.ts","ok":true}
command []: orig ..."src/a.ts"... | wt ..."src/a.ts"...
command ['', '']: orig ..."" ... | wt ..."" ...
```
On main, an array command was taken even when it joined to the empty string. Now `''` is falsy at `turns.ts:278` and the summary falls through to the path. The builder's report does not state this change.

**B3. `loadCache` is about 15 ms slower, and a cache entry with a wrong-typed field is dropped.** Verdict: stated by the builder; noted only.
- Probe cases that differ from main: sizeFrac, offsetFrac, offsetStr, mtimeStr, inodeNull, noPath, aiTitleNum, tokensOld, toolOther.
- An entry with an own `__proto__` key gives the same answer as main.
- 1600 fuzz-folded accumulators survive a save and load round trip unchanged.

## The builder's diagnosis of its two red checks

Both diagnoses are correct.
- **Fixture:** the proposed pattern `/kind: z\.literal\('([a-z-]+)'\)/g` finds the same 19 kinds in the same order (probe output `19 19 true`). The one-line change in `tests/fixtures/kinds.ts` touches only the three tests that call `recordedKinds()`. `tests/fixtures/kinds.ts` is outside the brief's paths, so the orchestrator must widen the paths or make the change at landing.
- **Diagram:** correct. `reachesDisk` propagates per module, and `json.ts` holds `writeTextAtomic`. The new drawing shows `bodies.ts`, `yaml-edit.ts` and the five `entry-edit` modules as writers, which is false.

What changes in the tree under each option:

- **A, a new `core/shapes.ts` with one item moved out of `core`.** `core` holds 10 items (auth, changes, channels, file-poll, git-parse, git, json, paths, words, write-file-atomic.d.ts), so a slot must be freed. Every importer of the zod helpers changes its import, across about 25 files in edit, sessions and transcripts.
  - A1, move `write-file-atomic.d.ts` to `src/lib` (9 items) beside `highlight-languages.d.ts`. No import changes. Its "Layer 2, server" head comment would then not match its folder. The layers diagram may gain a bare node, which earlier reviews called clutter (not verified).
  - A2, put `git.ts` and `git-parse.ts` in `core/git/`. Ten files import them, some inside Q85a4's `git` folder, so it does not merge simply with Q85a4.
- **B, make `reachesDisk` work per function.** This changes the diagram tool and its tests, and probably redraws main's write diagram beyond this step (not verified).
- **C, loosen the check or copy the helpers.** The builder correctly names this as the lazy option. It breaks "a rule exists once" or the test rule against loosening, so it is not a candidate.
- **G, the builder did not list it: `src/lib/data/shapes.ts`.** `data` holds 8 items, so no slot is needed, and `server/transcripts` may import `data/**` under `tests/checks/tree/boundaries.test.ts:138`. That lets `transcripts/usage.ts` share `stampShape` and the count helpers instead of its own copies.
  - Against it: it puts the server-only zod helpers in the data layer. `data/helpers/guards.ts` is imported by the client (`state/forms/form-values.ts`), and whether `shapes.ts` would stay out of the client bundle is not verified.

For every option, the Q85a4 worktree carries its own `anyNumberShape` (`machine/pty/channel.ts:122`, `files/search.ts:185`) and `mapShape` (`machine/usage/accounts.ts:57`). It also drops `text` and keeps `whole`/`list` in its `core/json.ts`. Whichever option lands, those copies duplicate the shared helpers at the second landing and must be folded into whichever file holds them.

My recommendation: A1 if the layers drawing stays clean, otherwise G. A2 and B both cost more merge or tool work for the same result.

## Declined to judge

- Whether the 1.5x bound holds over whole passes on an unloaded machine: my machine was loaded, and the spread exceeds the margin.
- Option B's effect on main's write diagram: not built.
- Whether A1 adds a bare node to the layers diagram, and whether G keeps zod out of the client bundle: not built.

## Own deviation

Besides the two allowed commands, I ran one read-only `git show 4f4dcfc4:tools/oculus/src/lib/server/edit/writes/bodies.ts` inside a `node -e` script to compare the base readers. I changed nothing.

## Probe files

All under `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/rev/`: `p/nopayload.mts`, `p/scanloop.mts`, `p/cmd.mts`, `p/quick.mts`, `p/bodies.mts`, `p/afv.mts`, `p/cache.mts`, `fuzz.mts`, `fuzz-cache.mts`, `timing.txt`, `checks.txt`, `testchecks.txt`. The base copy is `base/` and the schema-event copy is `alt/`.

Reviewer usage: about 440,000 tokens (estimate, not measured), about 150 tool uses (estimate), minutes not measured.
