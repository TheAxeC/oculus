# Step T1e refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/T1e, base 44187f9f3)

The worktree was not changed by this review. `git status --short` run from the worktree at the end shows the 125 tracked test-folder changes plus the untracked `tools/oculus/.scratch/migration/agents/reviews/T1e-report.md`, and nothing else. All my experiments ran on a scratch copy under my scratchpad.

## Verification (rerun by the reviewer)

`npm run diagrams` was run first. Then checks.sh was run from the worktree's tools/oculus. It started 05:21:37 at load 3.55 3.71 5.70 and ended at load 7.48 6.44 6.47.

```
$ npm test
> vitest run --tagsFilter '!slow' --exclude 'tests/checks/**'
fatal: Needed a single revision
 Test Files  587 passed | 36 skipped (623)
      Tests  14232 passed | 839 skipped (15071)
   Duration  178.34s (transform 44.04s, setup 0ms, import 436.47s, tests 217.93s, environment 212ms)

$ npm run test:checks
> vitest run tests/checks --tagsFilter '!slow' --testTimeout 0 --hookTimeout 0
 ❯ |unit| tests/checks/tree/duplication.test.ts (18 tests | 1 failed) 3787ms
     × holds the lists to clones that are still shared, so a repaired copy takes its entry with it 780ms
+   "tests/data/sources/config/calendar-config.test.ts and tests/server/accounts/calendar/poll.test.ts (1c224db4bd3b)",
+   "tests/routes/docs/memories.test.ts and tests/server/content/images.test.ts (505416a28794)",
 Test Files  1 failed | 29 passed | 2 skipped (32)
      Tests  1 failed | 412 passed | 33 skipped (446)
   Duration  36.93s
checks: failed with exit 1: npm run test:checks
```

After checks.sh stopped, I ran the remaining checks by hand. The ASCII grep ran at load 4.92 6.08 6.33.

```
npm run check     -> COMPLETED 3370 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS, exit 0
npm run build     -> exit 0
npm run format:check -> All matched files use Prettier code style!
npm run lint      -> exit 0
ASCII grep        -> exit 0
```

Evidence commands, rerun:

- **Diff extent.**
  - `git diff 44187f9f3 --stat` gives 126 files changed, 2825 insertions and 5396 deletions, all under tests/routes, tests/data, tests/checks and tests/fixtures.
  - `diff -rq` against the base copy gives 126 differences, none outside those four folders.
- **Deleted files.**
  - Deleted: tests/checks/config/options-walk.test.ts and tests/data/snapshot/build-timing.test.ts.
  - `grep -rn "options-walk\|build-timing"` over src, tests, utils, DESIGN.md, HELP.md, README.md, demo, package.json, vite.config.ts and config (with --exclude=local.yml) prints nothing.
- **Unused exports.** `sh utils/unused-exports.sh` prints the same 382 lines in the worktree and in the base copy.
- **Size and folder limits.**
  - The largest file is tests/checks/diagrams/diagrams.test.ts at 856 lines (limit 880).
  - The folder check exits 0. tests/routes, tests/fixtures, routes/files, data/sources and checks/tree hold exactly 10 items each.
- **Duplication on a scratch copy.**
  - With the two stale allow-duplication lines removed: `Tests 18 passed (18)` (load 6.28).
  - With `export` removed from slideProject at tests/routes/edit/write-fixture.ts:288: 2 tests fail. One is the new clone "tests/routes/edit/write-fixture.ts:288 and tests/server/core/changes.test.ts:94 hold the same 11 lines (84838e85ca2b)", and the other names entry 20c1f0a1f3eb as stale.
- **Merged tree.** I built a scratch tree from main ffb4457ae plus the T1e diff, resolved the rejects by hand and removed the memories/images entry.
  - test:checks: `Test Files 30 passed | 2 skipped (32)`, `Tests 406 passed | 40 skipped (446)` (load 9.19).
  - npm test: `Test Files 578 passed | 46 skipped (624)`, `Tests 13896 passed | 1010 skipped (14906)`, Duration 134.69s (load 8.85 to 8.49).
- **Probe for slow causes.**
  - I added a setup file that records child_process, net and setTimeout/setInterval calls of 1 ms or more, and ran it over `tests/routes tests/data tests/checks/utils --tagsFilter '!slow'` (1619 passed, 339 skipped).
  - The only records were 5 `setTimeout 10000` calls in tests/routes/files/search.test.ts.
  - The same probe over the tagged files of tests/routes/replace records an rg process, a socket or a timer for every tagged test except 9 in ops-replace.test.ts and 1 in preview.test.ts. All 10 measured 109.7 to 446.9 ms in that single run.
- **Red run for untracked.**
  - With `ordered` in src/lib/server/git/git-routes.ts:278-280 changed to `return work();` (scratch copy): `× waits behind the write chain it is given 151ms`, `AssertionError: expected Promise{…} not to be Promise{…}` at untracked.test.ts:124:34, `Tests 1 failed | 5 passed (6)`.
  - With the source restored: 6 passed.
- **My five runs** of each tagged file at loads of about 3.4 to 6.5, and the collection-time probe at loads 4.25 to 4.58: the numbers are in the findings below.

## Verdicts

Items of "What to build":

- **1:** holds for removals.
  - I sampled 42 removals and found the holder for each (list in Proof, last bullet).
  - The exception is the skip_permissions case at tests/routes/sessions/terminal-actions.test.ts:180, which was kept, still pins a shipped constant, and was retitled to say something it does not test (Spec 3).
- **2 (folds):** holds in the code. The fold listing in the report is wrong (Proof 2).
- **3 (slow tags):** violated.
  - Several file and describe tags cover tests whose minima are under 100 ms and that do nothing slow (Spec 1).
  - Three per-test tags in roots.test.ts sit under 100 ms by the builder's own numbers (Spec 1).
  - demo-hub.test.ts does slow work at collection and is left quick against Z382 (Spec 2).
- **4 (assertions kept):** partial.
  - Several assertions were rewritten beyond folding (Spec 4).
  - The skip_permissions title is false (Spec 3).
- **5 (no tree check tagged slow):** holds. The checks/utils files are script tests, not tree checks, but their new label says "tree check" (Standards 1).
- **6 (exports):** holds. slideProject stays exported only so the duplication check passes, because allow-duplication line 42 is outside the step's paths (confirmed by the scratch run above).
- **7 (labels):** partial (Standards 1). The helper label "Layer 4, test helper." on graph.ts, order.ts, code.ts, allow-styling.ts, latex-headings.ts, write-fixture.ts, open-fixture.ts, request.ts and terminal-fixture.ts is correct.
- **8 (allow-duplication removals):** holds.
  - The removed base lines are 26, 28, 29, 34, 35, 36 and 47, all within the permitted set.
  - test:checks is red only on the two known stale entries (base lines 37 and 40), both outside the step's paths.
- **9 (report):** partial (Proof 1 to 4).
- **10 (doc text):** partial (Spec 5).

Cases:

- **page.test.ts:** met. No readFileSync and no `?raw` remain.
- **undo-removed:** met. File tag; 41 of 42 tests have a minimum of 100 ms or more, the last 98.9.
- **personal:** met. The named-pipe test is tagged by cause (`execFileSync('mkfifo')`).
- **size.test.ts:** partial. The head and the title still say the verification list runs utils/size-check.sh (Spec 6).
- **retired.test.ts:** met. Kept and retitled 'name no Config view, no Config card and no local.yml card'.
- **add-forms:** met.
- **audits:** met. tests/checks/tree/audits.test.ts and allow-audits.txt are untouched.
- **build-timing:** met. The file is deleted and nothing references it.
- **real-hub probe:** met. Not run, by the constraint.
- **untracked:** met. The red run reproduces, and the wait is bounded at 1000 turns with a message.
- **real-hub.ts helper:** met.
- **allow-duplication:** partial. test:checks is red until the two stale lines are removed at landing. With them removed it is green on the worktree and on the merged tree.
- **folds:** partial. The code is folded, but the row lists in the report are wrong (Proof 2).
- **search guard timers:** met.
  - The probe shows the 10000 ms timer of `within()` (src/lib/server/files/search.ts:166-175) armed 5 times.
  - Each one is cleared when the stub resolves, and no test awaits it.
- **options-walk move:** met. The holder covers:
  - the family stop
  - the nested leaf
  - the list leaf
  - the empty map
  - the non-map file
  - the non-map rows of catalogOf

## 1. Spec

**Spec 1. Slow tags that do not meet Decision 1 (each tag judged on its own, my five runs).**

| Tag | Tests at 100 ms or more | Tests under 100 ms (minima) | What this means |
|---|---|---|---|
| tests/routes/edit/audit-mute.test.ts:6, file tag: "slow: every case takes 85 ms or more to load the configuration." | 3 of 12 (156.6, 103.6, 343.7) | 9 tests, 86.0 to 99.6 | No process, timer or socket. The cold start is about 60 to 70 ms. The tag widens the predicate from "100 ms or more" to "85 ms or more". |
| tests/routes/files/file-undo.test.ts:9, file tag: "every case takes 90 ms or more, and the first of a run 150 ms or more." | 9 of 20 | 11 tests, 93 to 99.9 | Same widening to 90 ms. The builder's own run (19 of 20 at 100 or more) was at higher load. |
| tests/routes/files/project-files.test.ts:8, file tag: "the first case of a run takes 100 ms or more to load the configuration." | 0 of 4 | 96.1, 52.8, 50.1, 48.5 (the builder's own: 99.2, 64.5, 55.3, 52.1) | Meets neither the cause nor the measure. |
| tests/routes/edit/write.test.ts:48, describe 'the write endpoint' | 6 of 12 | 6 tests | Widened. |
| tests/routes/edit/write.test.ts:274, describe 'the kinds the write endpoint takes' | 4 of 29 | 25 tests | Widened. The builder's own Times appendix shows 14 tagged write tests under 100. |
| tests/routes/edit/write.test.ts:481, describe 'the deck write' | 3 of 9 | 6 tests | Widened. |
| tests/routes/edit/rail.test.ts:63, describe 'the rail write' | 3 of 8 | 5 tests, 90.6 to 99.5 | Widened. The builder's own run also has 5 under 100. |

- **Failure scenario for these tags.**
  - A test whose own code costs nothing leaves `npm test` and runs only in the slow tier, which no step of the verification list runs.
  - A regression in, for example, the 25 quick-by-measure kind cases of write.test.ts goes unseen by the gate.
- **Brief item 3.** Item 3 lets a cold-start cost move into the beforeAll of a slow describe. It does not let a describe or file take the tag when most of its tests are under the line. config-key (11 of 12), undo (32 of 35) and undo-removed (41 of 42) are near the line, and Z379 (a) lets the builder's measured tags stand there. The tags in the table are not near-the-line disagreements: most tests in them are under 100 in both the builder's samples and mine.
- **Per-test tags in tests/routes/edit/roots.test.ts.** These three tag single tests whose minimum is under 100 ms in the builder's own report:
  - :150 'removes an entry by its key and keeps every other line': builder 106.0 (single), mine 97.8.
  - :160 'offers no removal of the hub or the engine config folder, or of a key not listed': builder 94.9, mine 90.6.
  - :187 'answers unwritable when the target holds no sources file': builder 96.6, mine 90.9.
  - None of the three starts a process, opens a socket or awaits a timer (probe).
- **Verdict:** item 3 violated.

**Spec 2. tests/data/demo-hub.test.ts:16-17 is left quick against Z382.**

```ts
const config = portfolioConfigFrom(loadConfig(engine).config, engine);
const snapshot = buildPortfolio(demo, config);
```

- **Timing.** Five-run probe of the collection work:
  - loadConfig cold: 81.8 to 98.7 ms.
  - portfolioConfigFrom: about 2.3 ms.
  - buildPortfolio over demo: 21.8 to 25.0 ms.
  - Collection total: minimum 105.8 ms (range 105.8 to 126.1).
- **What is wrong.** Z382 counts work at collection with the tests it serves, so the file's 2 tests are slow and should take the file tag. The report times demo-hub at 0.8 ms and never mentions collection.
- **Other files.** Files that only load a catalog or the configuration at collection have a minimum of about 82 ms, under the line.
- **Failure scenario.** The quick tier carries about 106 ms of hidden cost that the measuring rule says belongs to the slow tier, and the report's largest quick minimum (97.1 ms) understates it.
- **Verdict:** item 3 violated.

**Spec 3. tests/routes/sessions/terminal-actions.test.ts:180-188.**

```ts
it('carries tasks.skip_permissions on the wire, off in the checked-in configuration', () => {
    const merged = loadConfig(engineDir()).config as {...};
    expect(merged.tasks?.skip_permissions).toBe(false);
    expect(merged.chat?.skip_permissions).toBeUndefined();
    expect(taskSkipPermissions(merged as Record<string, unknown>)).toBe(false);
```

- **What is wrong.**
  - The test asserts the value of a shipped setting, which spec:57 and item 1 remove.
  - Its new title says "on the wire", but nothing in it touches the request or the argv. The wire behaviour is held by :96 and :105.
  - loadConfig leaves local.yml out by name (src/lib/data/sources/config/merge.ts:89), so the test reads only the checked-in files.
- **Failure scenario.** Open item Z314 has Axel set skip_permissions true to look at it. That one configuration edit turns this test red with no defect in the code, and the title leads a reader to think wire carriage broke.
- **Verdict:** item 1 and item 4 partial.

**Spec 4. Assertions rewritten beyond folding (item 4 keeps existing assertions).** The report lists each of these, but none has the before/after line spec:59 asks for.

- tests/checks/utils/rename-pillar.test.ts now asserts the relation `RENAMED_FIELDS[from] === to` in place of the literal pairs.
- tests/checks/source/text.test.ts moves the glyph cases to a synthetic STAND_INS map.
- tests/routes/sessions/terminal.test.ts adds a reason assertion to the 'mimic; touch nope' row.
- tests/routes/files/open.test.ts adds an `answer.error` assertion to the unknown-root row.
- tests/data/sources/config/catalog/options.test.ts:
  - It adds 'returns a path once for each key that gives it' and 'is not misled by a reserved name of objects...'.
  - It drops 'answers the map it was given, whatever it holds'.

**Verdict:** item 4 partial.

**Spec 5. tests/server/git/refs/detached.test.ts:6-7 was made false by the sweep.**

```
// What this does NOT cover: the questions the page asks first, and the route's confirm
// (tests/routes/git/refs.test.ts).
```

- **What is wrong.** The confirm now lives in tests/routes/git/git.test.ts (the ASKING table), as the new head of refs.test.ts says. Item 10 asks for every outside sentence the sweep makes false to be named, and the report does not name this one.
- **Checked and still true:**
  - context-guard.test.ts:4-5
  - demo/README.md:5
  - the CONFIRMED export at src/lib/server/git/git-routes.ts:139 (it lost its only test importer; its use at :369 is in the same file, and unused-exports output is identical to the base in production mode)
  - bodies.ts:5
  - Glyph.svelte:73
  - DESIGN.md:85
  - the config-key and config-value server heads
  - history.test.ts:7
- **Verdict:** item 10 partial.

**Spec 6. tests/checks/tree/size.test.ts:10-11 and :134.**

```
// utils/size-allow.txt is read by this and by utils/size-check.sh, which holds the same rule in awk
// and is run by the verification list; ...
it('reports nothing from utils/size-check.sh, the awk of the verification list, over the tree as it stands', ...
```

- **What is wrong.** The verification list in orchestrator-state.md holds no size command, and this test is the only place that runs size-check.sh. The case asked for this sentence to be corrected.
- **Failure scenario.** A reader takes the size rule as doubly gated and drops this test as redundant, leaving the awk unchecked.
- **Verdict:** size case partial.

## 2. Proof

**Proof 1. Stale holder line numbers.** The report cites these holders with lines taken before the sweep changed the files they point into:

| Report line | Cited | Now |
|---|---|---|
| 477 | normalise.test.ts:658 | :637 |
| 477 | integrity.test.ts:185 | :163 |
| 484 | tests/checks/config/config.test.ts:636 | :411 |

Holders cited in tests/server have moved since T1c landed on main:

| Holder | Cited | Now |
|---|---|---|
| changes | 507 | 524 |
| compare | 97 | 105 |
| config-value | 354 | 241 |
| fs | 667 | 596 |

- **Rule broken.** spec:14 says every file:line in the report is taken after the last change.
- **Failure scenario.** A lander following the citation reads the wrong case and cannot confirm the holder.
- **Verdict:** item 9 partial.

**Proof 2. The Folds appendix is matched by machine and is wrong.**

- The rename-pillar "is %s" fold lists 7 rows, but the table has 5. The list includes 'the rename the script carries...' and 'the migration...writes nothing on a second run', which are separate tests.
- The cited-lines "reads %s" fold lists 8 rows, including titles that are not rows.
- Old titles are not mapped row by row to the table entries.
- **Failure scenario.** A reviewer checking that no case was lost in a fold cannot trust the mapping.
- **Verdict:** fold case partial, item 9 partial.

**Proof 3. Report items missing against the spec.**

- **spec:42.** There is no history-word grep with each hit judged. The new title 'still serves the file beside a link that leads out of the root' (tests/routes/files/file.test.ts:133) is such a hit and is not judged. My reading: "still" here means "even so", so the title passes. The report should have said so.
- **spec:62-63.** There is no first-run or failing-run table for each new or changed test. I reproduced the failing run only for untracked.
- **spec:59.** There is no per-line before/after for the assertion edits in Spec 4.
- **spec:83.** The report uses its own export script, where spec:83 calls for the `utils/unused-exports.sh` comparison. My rerun of utils/unused-exports.sh gives identical output to the base, so the conclusion holds.
- **Verdict:** item 9 partial.

**Proof 4. tests/routes/edit/audit-mute.test.ts:6 and config-key.test.ts:9 tag reasons.** Both say "every case takes 85 ms or more".

- For config-key, 11 of 12 cases are at 193 ms or more, so the reason understates the cost.
- For audit-mute, the measured reason (85 ms) is below the rule's 100 ms line and is the widened predicate of Spec 1.
- **Failure scenario.** A later sweep reads "85 ms" as the threshold.

**Proof 5. Report formatting.** The literal text of the report at lines 466-467 is split by a stray newline ("writes a newline for \n in a CRLF file").

**Sample of removals and their holders (42 checked).** Each holder was found at the location given.

*routes:*

- memories png/jpeg: memories.test.ts:141.
- write token kinds: tokenedBody at src writes.ts:274.
- write pin/rename: overrides:83 and :100.
- fs 404 outside: server fs:186.
- fs note id: server fs:596.
- search:
  - cap: :301
  - root failed: :350
  - root outside: :174
  - runs every root: :114
- search pattern bound: data search.test.ts.
- changes page size: server changes:524.
- refs:
  - 'from side as option': compare:105.
  - dash: delete-branch:94, detached:61, cherry-pick:76, git-ops '-d' and checkName at git-write.ts:757.
  - token and unconfirmed: git.test.ts ASKING.
- undo unreadable setting: the same settled() catch, config-write.ts:37-41.
- git.test.ts root and refusal: :144 and :209.
- auth: auth.test.ts:53.

*data:*

- languages: helpers/files/languages.test.ts:22.
- validate top-level key: validate-shapes:162; relation field: :208.
- career null: normalise:787.
- personal 70 KiB: personal:238.
- conference call: the whole-entity compare in normalise.
- present: :411.
- search dash pattern: '--regexp' before the pattern.
- editor-options tracked config: config.test.ts:411.
- demo-hub round trip: normalise:637 and integrity:163.
- personal DRAFTS: synthetic, plausibly held.

*checks:*

- integrity config: config-folder:283.
- diagrams comment import: cycles:55.
- outside-paths: :196.
- config-folder theme lists: portfolio-config:33.
- catalogs paint limit: :131.
- options-walk cases: options.test.ts.

## 3. Standards

**Standards 1. The five checks/utils heads now say "Layer 4, tree check." (line 1 of each).**

- The five files: cited-lines, claude-usage, migrate-joint-work, outside-paths and rename-pillar.
- **Base labels.** Four of the five were "// Layer 4, test.", which is the tree's most common label with 65 uses, and rename-pillar had none.
- **What is wrong.** These files test scripts in utils/; they are not checks over the tree. Item 3 allows script tests to take the slow tag, but under the tree-check label they read as tree checks tagged slow, which item 5 forbids. I found no label list in orchestrator-state.md, spec.md or plan.md that names "tree check" for script tests.
- **Coverage change.** cited-lines and outside-paths leave test:checks for the slow tier.
- **Failure scenario.** A later reviewer applies item 5 and strips the tags, or trusts the label and misses that the scripts are no longer gated.
- **Verdict:** item 7 partial.

**Standards 2. tests/routes/shape.test.ts:1, "Layer 2, route tests."**

- The file reads the source of every API route for structure. It is a check over the whole tree, filed under tests/routes and run in npm test.
- DESIGN.md has no written rule for it: my grep found none.
- Keeping it and naming it for Axel fits "a check guarding no written rule is named". But item 1 (third bullet) would delete source-text assertions, and the report names the file only among its judgment calls, not as an open item.
- **Failure scenario.** The decision sits in a judgment-call list rather than the open items, so it is not carried to Axel.

**Standards 3. spec:32 (no git command by the builder).**

- The report discloses one `git -C . status` call.
- It had no effect: `git status --short` shows only the step's changes and the untracked report.
- It is still a breach of the standing spec.

## 4. Behaviour

**Behaviour 1. Coverage that leaves the gate.**

- The slow tier is run by no command in the verification list.
- Every over-wide tag in Spec 1, and the checks/utils tags for cited-lines and outside-paths, moves tests out of `npm test` or `npm run test:checks`.
- The report states the tags but not that these tests are no longer run by any gate.
- **Failure scenario.** A defect in the rail write, the write kinds or the citation script ships with every gate green.
- **Verdict:** item 3 violated.

**Behaviour 2. Landing interactions.** These are facts for the lander, not defects of the step.

- T1c landed after this base (44187f9f3 is an ancestor of ffb4457ae).
- The cherry-pick will conflict in tests/checks/tree/allow-duplication.txt (2 of 2 hunks) and in the head hunk of tests/routes/machine/commands.test.ts (1 of 3).
- In commands.test.ts, main's line 8 names hooks-server.test.ts and should be kept.
- Main already lacks the calendar-config/poll entry, so only the memories/images entry (505416a28794) needs removing.
- T1b, landing first, removes the base entries tests/state/client/writes (5f8d3f4b7492) and tests/state/sessions/terminals (f86fb737d860), which is a further overlap in the same file.
- The merged scratch tree is green on test:checks and npm test (numbers above).

## Declined to judge

- **Which test prints "fatal: Needed a single revision" during npm test.** Not verified. The run passes, and finding it needs a file-by-file run I did not do.
- **The fourth git.test.ts per-test tag ('answers a refused read...') and the three fs tags.** These are tagged by cause; I did not confirm the cause by the probe for each one.
- **docs.test.ts (my minimum 97.4, times 779, 513, 97.4, 278, 260; builder 133.6).** Near the line; Z379 (a) lets the builder's tag stand.
- **Whether shape.test.ts should stay, move to tests/checks or go.** That is Axel's call, since no written rule exists for it.
- **The 10 tagged ops-replace and preview tests with no recorded cause.** I measured them in one run only (109.7 to 446.9 ms), not five.

Reviewer usage: tokens not measured exactly; about 67 tool uses; about 50 minutes from the start of checks.sh (05:21) to the report (about 06:10).
