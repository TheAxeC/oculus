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

## Repair round 1, refuted

Worktree: /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q85a2, base 4f4dcfc4. Everything in the round holds except one defect the round introduced (Spec 1: a fractional cache `offset` now freezes a session). Two smaller Standards findings follow. All three are small and inside the brief, so they can be fixed at landing.

### Verification (rerun by the reviewer, from tools/oculus in the worktree)

`npm run diagrams` printed its file list ending `docs/diagrams/writes.svg`. I did not capture its exit status. `git status --short` lists the same six `docs/diagrams` files as modified as before the run (layer-server, layers and writes, .dot and .svg).

`sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, exit 0, lines verbatim:
```
$ npm test
 Test Files  371 passed | 20 skipped (391)
      Tests  5940 passed | 600 skipped (6540)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
1790844447871 COMPLETED 2839 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build            (passed, output elided)
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```
- `npm run test:checks` alone: `Test Files  29 passed | 2 skipped (31)`, `Tests  442 passed | 9 skipped (451)`.
- Slow files by name: `npx vitest run tests/routes/edit/write.test.ts tests/server/edit/writes.test.ts tests/server/edit/yaml-edit.test.ts` printed `Test Files  3 passed (3)`, `Tests  162 passed (162)`. `grep -l "@module-tag slow"` over the changed test files gives write.test.ts and yaml-edit.test.ts.
- `npx vitest run tests/server/edit tests/routes/edit`: `Test Files  15 passed (15)`, `Tests  443 passed (443)`, as the report says.
- `sh utils/folder-check.sh` exits 0. `ls src/lib/server/core` and `ls src/lib` each list 10 items.
- Verify 4: the `.issues|prettifyError|treeifyError` grep, the `const x = z` name grep (non-Shape names) and the `function (mapOf|rootMap|held|wordsOf)` grep print nothing.
- Check lines per the brief's loop: 133 over 21 files, as the report says.
- Per-file `satisfies` and `safeParse` counts for 8 files match the report's table.
- `grep -rnE "\b(whole|list|text|str|scalar|fields|strings)\(" src/lib/server/edit src/lib/server/sessions src/lib/server/transcripts` prints 20 lines (base prints 80).

My own trees, built in the scratchpad dir `rr1/` outside the tree. `wt` is a copy of the worktree. `base` is the worktree with `git diff 4f4dcfc4` reversed; its `src` equals the older `scratchpad/basetree/src` (`diff -rq` empty).
- **Fuzz, base against wt**, using the first reviewer's `fuzz.mts`: Claude and Codex records, `foldClaude`, `foldCodex`, `claudeUsage`, `codexUsage` and `readTurns`. Seeds 7, 11, 23, 99, 2000 sequences each: `sequences 2000, differences 0` four times. The generator includes `event_msg` records with no payload and `command: ['']`, `['', 3]`, `[]`, `['', '']`.
- **Codex commands:** 500 combinations of `command` (20 forms, `[3]`, `['ls', 3]`, `[null, 'x']`, `{}`, `true` among them) with `path`, `changes`, `name`, `description` and `exit_code`, through `readTurns`: `cases 500 diffs 0`.
- **Write bodies:** all 20 readers, 31,227 JSON bodies: `differences 0`. Bodies with an own `undefined` key are skipped; they differ, and brief decision 7 excludes them.
- **Files and config probes** (careerRules, fieldTypes, identity functions, overrides, registry candidates): `checks 405 differences 0`.
- **`asFieldValue`:** 48 values, 1 difference, the sparse array (cases ruling 8).
- **Deck, rail and the new-idea form** (round 1 changed `deck.ts`, `rail.ts` and `createIdea`): 89 checks over `deckLists`, `railLists`, `writeRail`, `createIdea` with odd fields, 0 differences. `writeDeck` over 12 odd `config.deck` values and 144 selection and order pairs: the 16 outcomes that changed a file were equal apart from the temp path in the record.
- **Scan loop with a payload-less `event_msg`**, three scans, one line appended between: `orig` and `wt` both give `prompts=2 messages=2` each time. `nopayload` probe: orig and wt both `read 314 prompts 1`.
- **Whole-pass timing** (the report's `timing.mjs`, 50,000 records), 10 alternating rounds of base and wt, machine load average 4.5 to 5.3. Mean ratio, and per-round range:

| Pass | Base ms | Worktree ms | Ratio | Per round |
|---|---|---|---|---|
| foldFrom + foldClaude | 73.8 (69.2-81.8) | 105.5 (99.1-107.9) | 1.43 | 1.29 to 1.56 |
| foldFrom + foldCodex | 35.3 | 49.1 | 1.39 | 1.29 to 1.49 |
| usage table claude | 67.3 | 82.6 | 1.23 | 1.08 to 1.42 |
| usage table codex | 39.1 | 46.7 | 1.19 | 1.11 to 1.29 |
| readTurns claude | 97.5 | 128.7 | 1.32 | 1.11 to 1.58 |
| readTurns codex | 36.8 | 43.8 | 1.19 | 1.05 to 1.28 |
| claudeUsage alone (no bound) | 1.5 | 11.1 | 7.6 | |
| codexUsage alone (no bound) | 2.1 | 7.8 | 3.8 | |

- **`loadCache`** (200 entries, 8.5 MB, the report's `loadcache.mjs`): median 25.9 and 24.9 ms base, 38.3 and 39.7 ms wt. About 13 ms slower, as the report says.

### Verdicts (whole diff since the base)

Items of "What to build":
- 1, the rule: **violated** at one point. Spec 1: a fractional cache `offset` is read differently from base, and the report says no other answer changes. Everything else I fuzzed or probed matches base.
- 2, request bodies: holds (31,227 bodies, 0 differences; cases 1 to 11 pass in write.test.ts).
- 3, `asFieldValue`: holds (case 12 passes; probe above).
- 4, files oculus parses: holds (case 13; feeds, entries, subtasks and audit probes).
- 5, configuration read at run time: holds (case 14, 15; 405 probes).
- 6, changes-log values: holds (case 16; `removedShape` read).
- 7, transcripts: holds (fuzz 8000 sequences, 0 differences; S1, S4 and B2 closed).
- 8, JSON files: **violated**, Spec 1. `cacheEntryShape` takes finite numbers as the item says, but the item also deletes `whole(cached.offset)` and `whole(cached.size)`, which are not redundant once the schema accepts fractions.
- 9, guard duplicates: holds (the four grep checks above).
- 10, what stays: holds. The `isMap` comment names exactly the four importing files (my script over `src` and `tests`: overrides.ts, group.ts, stores/transcripts.ts, files/fs.ts). The 20 remaining helper-grep lines are each classed in the report, and I read each. Standards 2 is a wording problem in that comment. See "Declined to judge" for the class of 14 `scalar(...)` lines.
- 11, docs: holds. `DESIGN.md:148` names `core/shapes.ts` and its helpers, has no time clause, no step id and no date.
- 12, no existing case edited: holds. The removed test lines are imports, three allowlist lines (19, 23, 25) and the fixture regex in `tests/fixtures/kinds.ts`.
- 13, the fold's time: holds. In my 10 rounds every whole-pass mean ratio is at most 1.43. The margin on `foldFrom + foldClaude` is 0.07, and 3 of 10 rounds are at or above 1.5 for that pass and `readTurns` claude (1.56, 1.50 and 1.58 in single rounds).

Cases:
- 1 to 15: met (the slow and ordinary files pass, see above).
- 16: met, with the adapted inputs cases ruling 5 accepts.
- 17 to 22: met.
- 23: met, with `acc.aiTitle` per cases ruling 1. On base src with the final tests it is the only expected failure.
- 24: met.
- 25: met. The config-key and History tests pass now.

### 1. Spec

1. **`src/lib/server/sessions/stores/transcripts.ts:185` and `src/lib/server/sessions/cache.ts:51,54`.**
   Hunk now: `offset = cached.offset;`, with `size: z.number(),` and `offset: z.number(),`.
   Base: `offset = whole(cached.offset);` and `found.size >= whole(cached.size)`.
   - **What is wrong:** round-1 ruling 5 drops `Number.isInteger` from the schema, and round 0 deleted the `whole(...)` reads as redundant. A fractional `offset` is kept by `loadCache`, and `foldFrom` then calls `readSync(handle, buffer, read, length - read, offset + read)` with a fractional position. That throws, `foldFrom`'s catch returns 0, and the entry is saved again with the same fractional offset. Base truncated it and went on.
   - **Brief text:** item 1 says the reader answers exactly what it answers on main and that the one changed answer is item 8's malformed entry. The report's "A fractional size or offset is kept, as on the unchanged tree. No other answer changes" holds for `loadCache` only.
   - **Failure scenario** (probe `rr1/frac2.mts`): scan a Codex rollout, edit `offset` in `~/.oculus` cache to `offset + 0.5`, append a user message, scan three times:
     ```
     orig  cache offset +0.5, three appends: prompts=3 prompts=4 prompts=5 | stored offset 919
     wt    cache offset +0.5, three appends: prompts=2 prompts=2 prompts=2 | stored offset 424.5
     ```
     The session's counts and title stay frozen on every later scan until the file shrinks or is replaced.
   - A fractional `size` also differs: `cached.size` 10.5 against a file of 10 bytes is usable on base and not on wt, so it folds from zero. That one self-heals.
   - **Exposure:** a hand-edited or older-shaped cache. No oculus writer produces a fractional `offset`.
   - **Fix:** `offset = Math.trunc(cached.offset)` and `Math.trunc(cached.size)` in `usable`, which restores base's answers and needs no ruling. The alternative is `offset` as an integer in the schema, which drops such an entry and folds from zero. That is a second changed answer, so it needs the orchestrator's ruling.
   - **Verdict:** items 1 and 8 violated.

### 2. Proof

1. **`tests/server/sessions/stores/codex.test.ts:800`.** "is kept, since both are byte counts the cache was written with" asserts that `loadCache` keeps an entry with `size: 10.5, offset: 4.5`.
   - **What is wrong:** it checks only `loadCache`, never a scan over such an entry. It also encodes the kept-entry behaviour that Spec 1 shows freezing a scan.
   - **Failure scenario:** the test stays green over the freeze, and a fix that truncates at the read would not be exercised by it.
   - **Verdict:** supports Spec 1. The scan case should go with the fix, in the nearest file under `tests/server/sessions/` (not `transcripts.test.ts`, at 900 lines).

Closures I reproduced by taking the round's change out of a copy of the final tree (not the worktree), so the re-export in `scratchpad/pre` is not what I rely on. I also checked the re-export itself: `export * from './json.ts'` binds the same function objects, so it changes nothing the pre-round code does.
- **Ruling 1:** `eventRecordShape` with `payload: z.unknown()` fails exactly the two new cases: `expected +0 to be 1` and `expected [ [ 1, 1 ], [ 2, 2 ], [ 3, 3 ] ] to strictly equal [ [ 2, 2 ], [ 2, 2 ], [ 2, 2 ] ]`. On base src with the final tests both pass.
- **Ruling 5:** `size` and `offset` refined with `Number.isInteger` fails the cache case with `expected {} to strictly equal { ...(1) }`.
- **Ruling 7:** removing `refuseUnrebuildable(shape)` fails all five `quickly` refusal cases with `expected [Function] to throw an error`.
- **Ruling 11:** a list command that joins to `''` returning undefined fails the turns case with `expected [ 'src/a.ts', 'src/a.ts', ...(5) ] to strictly equal [ '', '', 'src/a.ts', '', ...(3) ]`. On base src the case passes.
- **Ruling 2 fixture:** with the old regex `body\.kind !== '...'`, `config-key.test.ts` and `history.test.ts` fail. The new regex finds the same 20 kinds in the same order as the old one did on base `bodies.ts` (`true`).

### 3. Standards

1. **`src/lib/server/sessions/record.ts:216` and `src/lib/server/root/hooks.ts:45`.**
   Both read `export const filledTextShape = z.string().min(1).optional().catch(undefined);` (hooks.ts without `export`).
   - **What is wrong:** two schemas under one name answer alike, and the diff added the one in record.ts. The T3 ruling says the second imports the first. A grep of the identical one-line `Shape` definitions under `src/lib/server` finds this as the only repeated one, so it was missed. The brief's rule is "a parser, a fold or a rule exists once".
   - **Failure scenario:** a change to what counts as filled text lands in one file and not the other. The hook body and the transcript fields then disagree on an empty string.
   - **Fix:** move it to `core/shapes.ts`, and both files import it. `hooks.ts` is outside the step's paths, so the landing widens them (the landing already edits `core/shapes.ts`).
2. **`src/lib/server/core/json.ts:92-95`.** "re-exported here for the modules that read a JSON file through it: group.ts, overrides.ts and stores/transcripts.ts in server/sessions, and fs.ts in server/files."
   - **What is wrong:** `group.ts` does not read a JSON file. `group.ts:87,220` use `isMap` as argument checks of an exported function, which the brief's own "other check lines" says.
   - **Failure scenario:** a reader takes `group.ts` for a JSON-file reader that should go through a schema.
   - **Fix:** word it as the modules that import `isMap` from here.

Other Standards checks: no history in the added comments (pattern grep over the added comment lines), ASCII clean (`checks.sh` last line), `NO_CONTENT` gone and replaced by a function in both files, no file-scope mutable added, and `shapes.ts` (108 lines) holds exactly the helper list ruling 2 gives plus the private `refuseUnrebuildable`.

### 4. Behaviour

None beyond Spec 1. The slower `loadCache`, the dropped wrong-typed entry and the per-call cost of `claudeUsage` and `codexUsage` are stated in the report with figures I reproduced. `git/git-routes.ts` changes only an import path.

### Specific rulings you asked me to judge

- **Ruling 2:** holds.
  - `src/lib/write-file-atomic.d.ts` has "Layer 2, types." like `highlight-languages.d.ts`. `grep -rn write-file-atomic docs/diagrams` prints nothing.
  - `core/json.ts` holds `readJson`, the three atomic writers, `fsWrites`, `chained`, `FsWrites` and the `isMap` re-export.
  - The 15 modules that import from `shapes.ts` that appear in `writes.dot` are feeds, writes/entries, audit-mute, undo, subtasks, manifest and overrides. All write through `writeTextAtomic` or `writeJsonAtomic` themselves. `yaml-edit.ts` and `bodies.ts` are not drawn. `shapes.ts` appears in no diagram.
  - The `layer-server.dot` edge changes follow from `usage.ts` no longer importing `guards`.
- **Ruling 3:** the 30 lines are accepted with the point under "Declined to judge". I read all 20 that remain plus the 10 changed lines (`deck.ts`, `rail.ts`, `manifest.ts`), and my deck, rail and new-idea probes show the 10 changed lines answer as base.
- **Ruling 6:** `eventOf` and `wholeField` are gone, and the schema `eventPayloadShape` is built once. No `without a schema` or `1.5 times` text remains in `src` or `DESIGN.md`. The ratios are in the table above, against the report's 1.15 to 1.38. My spread is wider because of the load.
- **Ruling 7:** I probed 25 forms with `rr1/wt/probes/q.mts`.
  - `quickly` throws on loose, strict (two spellings), `.passthrough()`, `.catchall()`, `.refine`, `.superRefine`, `.check`, `.min`, `.max`, `.length`, `.nonempty` and a list `.refine`.
  - It throws on the same forms nested in a field, `.optional()`, `.nullable()`, `.catch()`, a list and a union.
  - It builds for a discriminated union, a `.transform` pipe over a loose object (a leaf), a record, a tuple and `z.string().min(1)`.
  - Strict is right to refuse. `z.strictObject({a: z.string()}).catch(() => ({a: 'default'}))` on `{a: 'x', b: 1}` gives `{"a":"default"}`, and the plain rebuild gives `{"a":"x"}`.
  - Key sets of quick and full agree on the `{}`, partial and wrong-typed inputs I tried.
- **Ruling 8:** the four pairs differ.
  - Claude message: usage reads `model` and `usage`, turns reads `content`.
  - Codex payload: usage reads `info`, turns reads `item`.
  - Stamp: the fold's `stampShape` gives null for a number, usage's accepts one (case 19 shows `stamp: 5`).
  - Content text: background joins with `\n` and takes a string whole, codex joins with nothing.
  - No same name for two schemas remains except `filledTextShape` (Standards 1).
- **Ruling 11:** `commandShape` against base on the 500 command combinations above gives 0 differences.

### Declined to judge

- **The class "comparison" for 14 `scalar(...)` lines.** These are `feeds.ts` 350, 415, 419, 472 and 510, `writes/entries.ts` 287, 364, 382, 385, 398, 536 and 560, and `undo.ts:173`. Each reads a named field of a parsed entry through `scalar` and compares it with wanted text. The ruling's classes (comparison, bare map test, type test on a yaml node) cover them only if "comparison" is read broadly.
  - Brief item 4 asks for `idPartShape` on every identity field read, but `scalar` also stringifies booleans, so switching would change base's answer for a boolean identity.
  - I could not settle which reading the brief meant. It is the orchestrator's call, and I raise no finding.
- **Whole-pass timing on an unloaded machine.** The machine ran other agents' work during my runs. Single rounds reached 1.56 and 1.58, so the 1.5 bound has about 0.07 of margin on two passes.
- **Visual quality of the regenerated SVG diagrams.** `readable.test.ts` passes, but I did not look at the drawings.
- **The merge with Q85a4.** That is the landing's, as your note says.

Reviewer usage: tokens not measured, about 110 tool uses (estimate), about 45 minutes (estimate). My probes and trees are under `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/rr1/`. I changed no file in the worktree; `npm run diagrams` rewrote the same six already-modified `docs/diagrams` files, and I ran no git command other than `git diff 4f4dcfc4` and `git status --short`.

Recorded usage: reviewer a890ccc337bb5cdfb, served claude-sonnet-5-5; 321,329 tokens, 105 tool uses, 23.8 min (from its completion notice).
