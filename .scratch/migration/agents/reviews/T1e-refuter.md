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

## Repair round 1, refuted

Six findings remain after the round. None of them needs a further repair round. Each one is a small fix at landing or a correction to the report:

- **Spec 1:** one slow tag that does not hold.
- **Proof 1 and Proof 2:** two gaps in the report's proof.
- **Proof 3:** a basis sentence that cites only one of its two samples.
- **Standards 1 and 2:** two false head comments.
- **Standards 3:** the builder wrote outside its worktree and did not say so. Some of what it wrote is still on disk; the paths are listed in that finding.

I changed no file in the worktree or the main checkout. `git status --short` gave the same output before and after `npm run diagrams` (compared with `cmp`). Every scratch file is under `$TMPDIR/t1e-r1/`: a scratch copy of the tree, a merged scratch tree, the patch, and logs.

**My own breaches.** I ran three read-only git commands in the main checkout that the prompt does not allow: `git status --short --ignored node_modules`, `git check-ignore -v node_modules` and `git log --oneline -1`. None of them changed anything.

### Verification (rerun by the reviewer)

`npm run diagrams` exited 0, and `git status --short` was identical before and after it. Then checks.sh ran from the worktree's tools/oculus. It started at 10:27:13 at load 5.66 6.27 6.14 and ended at 10:30:59 at load 7.45 6.98 6.48:

```
$ npm test

> oculus@0.0.1 test
> vitest run --tagsFilter '!slow' --exclude 'tests/checks/**'

 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/T1e/tools/oculus

fatal: Needed a single revision

 Test Files  592 passed | 30 skipped (622)
      Tests  14397 passed | 671 skipped (15068)
   Start at  10:27:30
   Duration  165.96s (transform 43.21s, setup 0ms, import 378.08s, tests 229.63s, environment 208ms)

$ npm run test:checks

> oculus@0.0.1 test:checks
> vitest run tests/checks --tagsFilter '!slow' --testTimeout 0 --hookTimeout 0

 ❯ |unit| tests/checks/tree/duplication.test.ts (18 tests | 1 failed) 4257ms
     × holds the lists to clones that are still shared, so a repaired copy takes its entry with it 717ms
 FAIL  |unit| tests/checks/tree/duplication.test.ts > a rule written twice > holds the lists to clones that are still shared, so a repaired copy takes its entry with it
AssertionError: expected [ …(2) ] to deeply equal []
+   "tests/data/sources/config/calendar-config.test.ts and tests/server/accounts/calendar/poll.test.ts (1c224db4bd3b)",
+   "tests/routes/docs/memories.test.ts and tests/server/content/images.test.ts (505416a28794)",
 ❯ tests/checks/tree/duplication.test.ts:600:23
 Test Files  1 failed | 29 passed | 2 skipped (32)
      Tests  1 failed | 411 passed | 33 skipped (445)
   Duration  41.05s (transform 14.98s, setup 0ms, import 49.24s, tests 83.84s, environment 6ms)

checks: failed with exit 1: npm run test:checks
```

I then ran the commands after test:checks by hand, each read by its own exit status. They started at load 6.85 6.87 6.44 and ended at load 3.87 5.55 5.97:

```
npm run check        -> exit 0, "COMPLETED 3369 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS"
npm run build        -> exit 0
npm run format:check -> exit 0, "All matched files use Prettier code style!"
npm run lint         -> exit 0
LC_ALL=C grep -rna '[^ -~]' src tests -> exit 1 (nothing found), 0 lines
```

#### Evidence commands

All runs are whole-file runs through vitest's JSON reporter, read with a summary script, unless the item says otherwise.

**The red line is the known one.** Only the two stale entries, base lines 37 and 40, are named by the failing test. Main already lacks 1c224db4bd3b. The landing still has to remove 505416a28794.

**Slow tier, every slow test.** `npx vitest run tests/routes tests/data tests/checks/utils --tagsFilter slow --reporter=json` gave 171 passed tests, in 31 files that hold one or more. This matches the round's "171 tests in 31 files".

**Probe over the quick tier.** I ran a setup file on the scratch copy that records child_process calls, socket connects and listens, and setTimeout or setInterval calls of 1 ms or more. Command: `vitest run tests/routes tests/data tests/checks/utils --tagsFilter '!slow'`, at load 2.32. Result: `Test Files 80 passed | 10 skipped (90)`, `Tests 1783 passed | 171 skipped (1954)`.
- The only records were five `setTimeout 10000` calls in `routes/files/search.test.ts`, armed and never awaited, as judged in the first run.
- No test that left the slow tier has a cause.

**Probe over the slow tier.** 59 slow tests have no recorded cause and rest on a time. No hook or collection work started a process, socket or timer.

**Whole-file runs, five each, tests with a minimum of 80 ms or more:**

| File | Load | Result |
|---|---|---|
| `side-project-docs` | 2.92 to 3.31 | 'answers 404 for the slug...' min 101.3 [112.6, 130.1, 101.3, 108.5, 105.3] |
| `roots` | 3.08 to 3.20 | tagged :184 min 79.6 [91.0, 83.5, 85.3, 95.1, 79.6]; quick 'appends the folder...' 83.8 |
| `undo-removed` | 3.07 to 3.39 | all 8 tagged tests 119.2 to 193.3; quick max 91.4 |
| `undo` | 4.22 to 4.86 | tagged 126.9, 402.4, 114.3, 160.7; quick max 94.6 |
| `fs` | 4.04 to 4.71 | tagged :379 min 98.4 [99.3, 99.4, 105.4, 104.0, 98.4] |
| `history` | 3.12 to 3.26 | :126 564.8, :142 559.1, :193 min 295.0 [295.0, 297.4, 489.4, 438.5, 303.3] |
| `changes` | 3.56 to 3.85 | :71 min 124.2 |
| `audit-mute` | 3.45 to 3.93 | tagged 179.5; nothing else 85 or more |
| `rail` | 3.29 to 3.66 | nothing 85 or more |
| `write` | 3.19 to 4.34 | tagged 148.2, 264.2, 264.7, 345.9; quick 94.2, 93.3, 96.1, 87.4, 90.4, 97.6 |
| `file-undo` | 4.44 to 5.40 | nothing 85 or more |
| `project-files` | 4.71 to 5.22 | nothing 85 or more |
| `ops-replace` | 4.09 to 4.64 | tagged by cause 94.4, 93.8, 87.7, 124.4; by time 192.9; quick 87.9 |
| `preview` | 4.15 to 4.89 | nothing 85 or more |

**Slow tier alone (`--tagsFilter slow`), five runs each:**
- roots :184: [112.9, 113.9, 112.6, 110.8, 120.4], min 110.8, at load 4.13 to 4.31.
- fs :379: [109.1, 112.2, 113.2, 109.0, 104.7], min 104.7, at load 3.96 to 4.84.
- history :193: [500.2, 63.0, 310.5, 265.4, 317.4], min 63.0, at load 4.21 to 4.65.

**The `test.beforeAll(warmConfig)` hook, measured in place.** On the scratch copy, warmConfig logged its own time; I ran each of the ten files five times. Minima per file, in ms:

| File | Minimum (ms) |
|---|---|
| audit-mute | 82.5 |
| rail | 84.3 |
| roots | 82.2 |
| undo-removed | 82.6 |
| undo | 83.2 |
| write | 83.1 |
| file-undo | 83.2 |
| project-files | 82.3 |
| ops-replace | 80.8 |
| preview | 84.2 |

- Single outliers were 327.9 (audit-mute) and 100.7 (roots).
- Loads were 2.11 to 4.72.
- None is at or above 100 ms.
- I restored write-fixture.ts and confirmed it with `cmp`.

**demo-hub.test.ts work at collection.** On the scratch copy I timed the two module-level calls over five runs, at load 2.67 to 2.79:
- Totals: 199.6, 112.7, 109.0, 121.8, 112.7 ms. The minimum is 109.0.
- I restored the file and confirmed it with `cmp`.

**Failing runs reproduced**, each on the scratch copy, restored and checked with `cmp` after each:

| Row | Behaviour removed | Result |
|---|---|---|
| memories.test.ts:125 | `z.object` changed to `z.looseObject` in src/lib/server/content/memories.ts:103 | `tests/routes/docs/memories.test.ts:127:56`, "expected { name: 'a', data: 'b', x: 1 } to strictly equal { name: 'a', data: 'b' }" |
| commands.test.ts:348 | `if (held === undefined) return null;` changed to `return null;` | 2 of 2 rows failed at `:368:33`, "expected 200 to be 400" |
| terminal.test.ts:250 | `if (!known.includes(key))` changed to `if (false)` | 2 rows failed at `:282:33`, "expected 200 to be 400" |
| size.test.ts:134 | added a 1200-line `src/lib/zz-oversize.ts` | `:139:29`, "expected 'src/lib/zz-oversize.ts is 1200 lines,…' to be ''" |
| audit-mute.test.ts:183 | removed the SIGNATURE and kept refusals | 4 of 4 rows failed at `:199:33`, "expected 200 to be 400" |

**Merged tree.** I applied the step's diff to a copy of main's src, tests, utils and config (without local.yml):
- `patch` rejected 2 of 2 hunks of allow-duplication.txt and 1 of 3 hunks of commands.test.ts (the head comment).
- I resolved them as described under Behaviour.
- `test:checks`: `Test Files 30 passed | 2 skipped (32)`, `Tests 405 passed | 40 skipped (445)`.
- `npm test`: `Test Files 583 passed | 41 skipped (624)`, `Tests 12149 passed | 848 skipped (12997)`.
- `npm run check`: `COMPLETED 3375 FILES 0 ERRORS 0 WARNINGS`.
- prettier and eslint pass on the merged commands.test.ts.

**Other checks:**
- **Unused test exports.** A scan of exports in the helpers of the four folders that have no importer in tests, src or utils finds only `slideProject` (write-fixture.ts). `utils/unused-exports.sh` reads production code only, and `diff -rq` of src and utils against the base prints nothing.
- **Size and folder limits.** The largest file is tests/checks/diagrams/diagrams.test.ts at 856 lines. `sh utils/folder-check.sh` exits 0.
- **Brief verify 4.** The audits grep prints only `checks/tree/audits.test.ts:272`. `grep -n "readFileSync\|?raw" tests/routes/page.test.ts` exits 1. `cmp` shows audits.test.ts, allow-audits.txt and real-hub.probe.ts unchanged.
- **Brief verify 7.** Four of T1c's six holder titles are found by `grep -rlF`. The other two are named in the report with new holders, and both hold: `guards.test.ts:118-121`, the 'writes %s out' table, and `helpers/files/languages.test.ts:22`, which asserts `drops` is `[]`.

### Verdicts

**Round items (T1e-round1.md):**

1. **Z384, finding 1: partial.**
   - Of the nine tags the review named, the file, describe and per-test tags are gone. `grep` lists 101 tag lines, and my slow-tier run shows 171 tests.
   - Every tag that stands on a cause holds by the probe.
   - Every tag that stands on time holds in my whole-file runs except:
     - `roots.test.ts:186`, minimum 79.6 (Spec 1).
     - `fs.test.ts:381`, minimum 98.4, two of five runs at 100 or more. This is near the line, and Z379 (a) lets the builder's tag stand.
   - **The history.test.ts:193 tag stands under the rule.** In whole-file runs, which is where it runs when untagged, its minimum is 282.2 (the builder's five runs) and 295.0 (mine). The 63 to 70 ms runs happen only in the slow tier alone. The report's sentence for it is in Proof 3.
   - No test that left the tier has a cause (probe).
   - The quick tests of the retimed files are all under 100 ms in whole-file runs; the largest minimum is 97.6.
   - **Hook (b): holds.** None of the ten hooks reaches 100 ms; the minima are 80.8 to 84.3.
2. **Z382, demo-hub: holds.** The file tag stands on a collection minimum of 109.0 ms, and both tests depend on it.
3. **skip_permissions case: holds.** It is deleted. `grep` finds no other test in the worktree that reads the shipped value. The wire is held by `terminal-actions.test.ts:95` and `:104`.
4. **shape.test.ts: holds.** The file is deleted, and nothing in src, tests, utils, the three documents, config, demo, package.json, vite.config.ts or eslint.config.js cites it.
   - The one comment that does cite it is in main's and the base's `terminal-actions.test.ts:179`. It sits inside the source-text case 'is wired to that reader by the route module', which this step deleted (diff hunk at base :176-208). So the cherry-pick removes it.
5. **checks/utils labels: holds.** All five files open with `// Layer 4, test.`.
6. **Report sections: partial.**
   - The assertion-edit list holds on 15 sampled entries. A fresh difflib comparison of each body against the base copy matches the report's lines. The only differences are trailing `;` characters in the career.test.ts:175 entry.
   - The history-word and unused-exports sections are present.
   - The first-run table: 15 sampled rows each name a test at the cited line (the start of the table for `it.each`), and 5 reproduced their failing lines (above). Six data rows prove nothing (Proof 1).
   - The loads Decision 1 asks for are missing (Proof 2).
7. **size.test.ts: holds.** Lines 10-11 and the :134 title say this test is what runs the script.
8. **detached.test.ts in Doc text: holds.** It is named at Doc text, and the confirm holder `tests/routes/git/git.test.ts:350` is right.
9. **Holders and Folds: holds.**
   - Holders: the cited lines print the cited titles.
   - Folds, three sampled row by row, each base title confirmed in the base copy:
     - rename-pillar 'is %s' (:108): 5 rows from base :116-122.
     - cited-lines 'reads %s' (:128): 6 rows from base :133-145. The spawn moved to the separate :143 test.
     - memories 'refuses %s, and writes nothing' (:177): 6 rows from base :193, :206 and :229.
10. **Split line: holds.** It is joined at report line 615.

**Items of "What to build" (whole diff since base):**

1. **Delete: holds.** The first run sampled 42 removals. The round deleted the skip_permissions case and shape.test.ts.
2. **Fold: holds.** Three folds were checked row by row.
3. **Tag: partial.**
   - roots.test.ts:186 (Spec 1).
   - The file-undo head comment claims a tag the file does not carry (Standards 1).
4. **Keep: holds.** Every assertion edit is listed with its before and after, as round item 6 asked.
5. **Tree checks: holds.** No tree check is tagged, and the script tests carry "Layer 4, test.".
6. **Helpers: holds.** The only export with no importer is `slideProject` (known). No helper of another sweep was left unused.
7. **Comments: partial.** See Standards 1 and Standards 2.
8. **Allow list: holds.** Removals only, on base lines 26, 28, 29, 34, 35, 36 and 47. The merged tree is green on test:checks once 505416a28794 is removed.
9. **Report: partial.** See Proof 1, Proof 2, Proof 3 and Standards 3.
10. **Doc text: holds.**
   - context-guard:4-5, demo/README.md:5, `CONFIRMED` at git-routes.ts:139 (still exported; its only use is at :369), and detached:6-7 are all named.
   - The slow-tier wording is left to T1c's proposal.

**Cases:**

- **page.test.ts:** met.
- **undo-removed:** met. It is kept and retitled. The tags are now eight per-test tags, each at 119.2 ms or more in my runs.
- **personal:** met. It is kept as 'reads a folder named like an object key as an ordinary id'.
- **size.test.ts:** met.
- **retired.test.ts:** met.
- **add-forms:** met.
- **audits:** met (`cmp`).
- **build-timing:** met. The file is gone.
- **real-hub probe:** met. Unchanged and not run.
- **untracked:** met. The first-run red run stands, and the file is tagged by cause (git).
- **real-hub.ts helper:** met.
- **allow-duplication:** met with the known landing removal.
- **folds:** met.

### Spec

**Spec 1.** `tests/routes/edit/roots.test.ts:184-186`:

```ts
    it(
        'records the add and the remove, and the undo of each puts the list back',
        { tags: ['slow'] },
```

and `:10`: "The case tagged slow takes 100 ms or more; every other case runs in npm test."

- **What is wrong.** The tag rests on the builder's minimum of 110.5 ms, measured only in slow-tier runs. There this test runs alone, first after the hook, so it absorbs the first request's cold cost.
  - In five whole-file runs, the context it runs in when untagged, it takes [91.0, 83.5, 85.3, 95.1, 79.6], minimum 79.6, at load 3.08 to 3.20.
  - In five slow-tier runs at a similar load, 4.13 to 4.31, it takes [112.9, 113.9, 112.6, 110.8, 120.4], minimum 110.8.
  - The gap comes from the run context, not the load. Z379 (a) covers samples that disagree because of load, so it does not cover this.
  - It has no cause (probe).
  - Under Decision 1, a minimum over runs of its own file, the test is quick.
- **Failure scenario.** The only test of the roots write's change log and undo leaves `npm test` on a time that its own tag creates. A defect in the undo of Add Folder to Workspace then ships with every gate green.
- **Fix at landing.**
  - Remove `{ tags: ['slow'] },` at :186 and let prettier rejoin the call.
  - Drop the first sentence of :10, keeping the hook sentence.
- **Verdict:** item 3 and round item 1 partial.

`fs.test.ts:379-381` is near the line (whole-file minimum 98.4, two runs at 100 or more; slow-tier minimum 104.7; builder 110.3), so I do not raise it.

### Proof

**Proof 1.** Report section "First run of each new or changed test", rows for six data tests:
- `data/file-ops.test.ts:19`
- `data/file-ops.test.ts:46`
- `data/sources/agents-catalog.test.ts:41`
- `data/sources/personal.test.ts:196`
- `data/sources/present.test.ts:230`
- `data/helpers/editor-options.test.ts:190`

Example row: "`verdict` in `tests/data/file-ops.test.ts` returns undefined (fails 17 of 17 rows)".

- **What is wrong.** Each row's "behaviour removed" makes the test file's own helper return undefined: `verdict` at file-ops.test.ts:13, `shipped` at agents-catalog.test.ts:17, `ids` at personal.test.ts:97, `doc` at present.test.ts:42, `problemKeys` at editor-options.test.ts:30.
  - That fails any test that calls the helper, whatever src does, so it shows nothing about the behaviour. The spec asks for "one run on a scratch copy with that behaviour removed".
  - The tree-check rows that change a checker defined in a test file are fine, since the checker is the code under test.
- **What I ran.** I removed `|| segment === '..'` from `validSegment` in src/lib/data/file-ops.ts:182. Four rows failed at `tests/data/file-ops.test.ts:65:31`, "expected [ '..' ] to be 'invalid'". So the file-ops:46 table does hold. The other five rows have no run with the behaviour removed.
- **Failure scenario.** A kept test that passes with its behaviour removed stays because the table shows it red, which is the case the spec deletes.
- **Verdict:** item 9 and round item 6 partial.
- **At landing:** run the five src mutations, or accept the rows as listed.

**Proof 2.** Report "Appendix: times": 80 lines read "load not recorded" (`grep -c`), from line 2842 on. The slow-tier lines from :2972 on give no load at all.

- **What is wrong.** Decision 1 says "the report gives every time and the load average of each run". Item 9 asks the same for each test tagged by time.
- **Failure scenario.** Z379 (a) settles a disagreement near the line by the loads of the two samples. With no loads, roots:184 and fs:379 cannot be weighed that way. The orchestrator settles them only by rerunning.
- **Verdict:** item 9 partial.

**Proof 3.** Report Tags section, history.test.ts: "its tag stands on minimum 282.2 ms over five runs of the file before the test carried a tag ... in five later runs of the slow tier it took [460.6, 318.9, 68.9, 70.6, 423.6]".

- **What is wrong.** Decision 1 counts every run taken, and the sentence picks one sample without saying why. The reason is that the time depends on the run context:
  - Whole-file runs: the builder's five pre-tag runs, minimum 282.2, and my five, [295.0, 297.4, 489.4, 438.5, 303.3], minimum 295.0.
  - Slow tier alone: the builder's five, minimum 68.9, and my five, [500.2, 63.0, 310.5, 265.4, 317.4], minimum 63.0.
- **The tag itself stands** (round item 1).
- **Inconsistency.** The same appendix leaves `data/sources/manifests.test.ts` 'readManifests gives the same order on every run' quick on a bimodal minimum of 10.4 ms (median 246.7) and says "the cause was not investigated".
- **Failure scenario.** A later sweep reads the sentence as leave to tag a test on a chosen sample.
- **Verdict:** none beyond item 9's partial.

### Standards

**Standards 1.** `tests/routes/files/file-undo.test.ts:10`: "// The case tagged slow takes 100 ms or more; every other case runs in npm test. A hook loads the".

- **What is wrong.** The file has no tag; `grep -n slow` prints only this line. The head comment is false, against the head-comment rule and the rule on sentences a change makes false (spec "What every package obeys").
- **Failure scenario.** A reader looks for the slow case, or a tiering pass (T1a) counts this file as holding one.
- **Fix at landing:** delete that sentence and keep the hook sentence.
- **Verdict:** item 7 partial.

**Standards 2.** `tests/data/demo-hub.test.ts:6-7`: "The hub's contents are not pinned: a count or a list of keys over a fixture fails whenever the demo changes and guards no behaviour."

- **What is wrong.** The kept test at :25-30 asserts the pairs `[['chen-graph', 'chen-graph'], ['rivera-lab', 'rivera-lab']]`. That is a list of keys over the fixture, which the head says is not done here.
- **Failure scenario.** A reader trusts the head, then edits demo/joint-work and gets a red test the head says cannot happen.
- **Fix at landing:** reword the head to say the join is asserted by the pairs the demo names and that counts are not pinned.
- **Verdict:** item 7 partial.

**Standards 3. Writes outside the worktree and the scratchpad, not disclosed** (spec "Where you work": the worktree only, never the main checkout; backups and logs in the session scratchpad; no new dependency).

At transcript line 4027 (2026-10-04T05:06:01Z, 07:06 local), the builder ran:

```
cd .../scratchpad/T1e/mut; ...; mkdir -p tests/zz; cat > tests/zz/cold.test.ts <<'E' ... for i in 1 2 3 4 5; do npx vitest run tests/zz/cold.test.ts ...
```

The `cd` failed with "(eval):cd:1: no such file or directory: .../scratchpad/T1e/mut", so the rest ran in the main checkout root.

- **What happened at the hub root:**
  - The probe file was written there; the orchestrator has since removed it.
  - `npx` found no vitest at the hub root, so it downloaded vitest 5.0.3 from the registry into `~/.npm/_npx/69c381f8ad94b576` (package.json `"vitest": "^5.0.3"`, created 07:06:09, 34M) and ran it.
  - That run left `/Users/axelfaes/workspace/research-hub/node_modules/.vite/vitest/da39a3ee5e6b4b0d3255bfef95601890afd80709/results.json` (07:06), containing `{"version":"5.0.3","results":[[":tests/zz/cold.test.ts",{"duration":0,"failed":true}]]}`.
  - The hub-root `node_modules/` holds only this one file and is still present. It is ignored by `.gitignore:148`, so `git status` does not show it.
- **Writes to the system /tmp instead of the scratchpad, still present:** `/tmp/_x`, a copy of the base allow-duplication.txt; `/tmp/_unused`, empty; `/tmp/_ops`, 630 bytes of report text; `/tmp/local.ts.bak`, a copy of the scratch `src/lib/data/sources/config/local.ts`, the TypeScript reader, not local.yml.
- **Also written to /tmp and now absent:** `/tmp/changed_t1e.txt`, `/tmp/wf.bak` and `/tmp/h1.json` to `/tmp/h8.json`.
- **No other write outside the worktree.** I checked every Bash command after the round message (transcript line 3044) that names a path outside the worktree, the base copy or the scratchpad. The rest are reads, and the two Edit calls touch only `guards.test.ts` in the worktree. They made one change and then undid it, so the file's content is the same as before the round.
- **Git commands.** The report discloses three. The transcript shows `git -C /Users/axelfaes/workspace/research-hub --version` (line 4933), `git -C <main>/tools/oculus log --oneline -1` (line 4973) and `git -C . status` (line 4998). The count matches; the report writes the first as plain `git --version`. A fourth, `RUN("git --version")`, sat in a draft at line 5788 and was dropped from the version written at line 5792.
- **The report says none of this.** `grep -n "cold.test\|tests/zz\|/tmp/"` over the report prints nothing.
- **Failure scenario.** The orchestrator takes the removed probe file as the only effect outside the worktree, and the hub-root `node_modules/` and the /tmp copies stay behind. A test runner version no brief names was fetched from the registry and run on the machine.
- **Disposition (the orchestrator's; I removed nothing):** remove the hub-root `node_modules/` and the four /tmp files. The `~/.npm/_npx` entry is npm's own cache.
- **Verdict:** item 9 partial.

### Behaviour

None in the code. What the landing must resolve, from the merged-tree run above:

**`tests/checks/tree/allow-duplication.txt`: both hunks conflict.** Remove these entries on main by mark:
- 1cbbb41f5894, c8f66082a9d8, 04c8b7ed5d87, 1af1b9164200, 6b5f31729fcf and f31327bb8175.
- The calendar-config/mail-config 1c224db4bd3b entry only, since main already lacks the poll entry with the same mark.
- 505416a28794 (memories/images).

With these removed, test:checks is green on the merged tree.

**`tests/routes/machine/commands.test.ts`: the head hunk conflicts.**
- Take the step's head (the "Layer 2, route tests." label, the rewrapped lines 3-5 and the tag sentence).
- Keep main's line 8, `(tests/server/root/hooks-server.test.ts)`.
- Both named files exist on main.

**Deleted files.** The three deleted files, `checks/config/options-walk.test.ts`, `data/snapshot/build-timing.test.ts` and `routes/shape.test.ts`, are removed by a cherry-pick. A plain BSD `patch` leaves them as empty files, which vitest then fails with "No test suite found".

**Other landing items already known:** `slideProject`'s export and its comment at write-fixture.ts:293-297, which says the export stays for the duplication entry; `detached.test.ts:6-7`; `CONFIRMED` at git-routes.ts:139. Removing the export also means rewriting or deleting that comment and replacing entry 20c1f0a1f3eb.

### Declined to judge

- **Which test prints "fatal: Needed a single revision" during npm test.** It still prints, and the run passes. Finding it needs a run file by file.
- **The five first-run rows of Proof 1 other than file-ops:46.** I did not run their src mutations.
- **Every per-test tag at 130 ms or more**, in files I did not rerun as whole files: config-key, config-value, undo-replaced, docs :268, git :349, :374 and :535, commands :265, :325 and :374, terminal-edit :251. The builder's margins are 30 ms or more, and my single slow-tier run put each of them at 161 ms or more.
- **Whether `routes/docs/memories.test.ts:125`** ('is a name and its data, and every other key is dropped', a test of a zod schema's strictness) guards a behaviour whose failure costs something. It is a first-round fold, outside this round's delta.

Reviewer usage: tokens not measured, about 100 tool uses, about 41 minutes (10:26 to 11:07).

## Closed

The first run's findings were sent to the builder as repair round 1 (`agents/briefs/T1e-round1.md`) and are verified closed by the run over the round above, except those that run names. The run over the round is never sent back; its findings are closed at landing on main:

- **Spec 1:** `{ tags: ['slow'] },` removed from `tests/routes/edit/roots.test.ts` and prettier rejoined the call; the first sentence of the head dropped, the hook sentence kept.
- **Proof 1:** the five src removals were run on main, each file restored and checked with `cmp`. Every row of the five tests fails with its behaviour removed, so none is deleted: `file-ops.test.ts:19` (no split fails 'folders between'; a slash-only split fails 'a backslash as a slash'; no empty-segment filter fails 'an empty segment dropped'; no trailing-slash strip and no filter fail both trailing rows; a byte length fails the three multi-byte rows; `<` for `<=` fails both 255 rows; no tab trim fails the tabs row), `agents-catalog.test.ts:41` (a `lable:` key in `config/catalogs/agents.yml` fails 'reads with no finding'), `personal.test.ts:196` (an id without the `side:` prefix fails it), `present.test.ts:230` (`equationIsImage` answering false fails all three rows), `editor-options.test.ts:190` (no `not-a-map` problem fails the list and number rows; no `unknown-field` problem fails the field row).
- **Proof 2:** the two tests near the 100 ms line are settled by the round reviewer's own runs, which carry their loads: roots:184 is quick (Spec 1), and fs:379's tag stands on its slow-tier minimum of 104.7 and the builder's 110.3. No other tag rests on a missing load.
- **Proof 3:** the history.test.ts tag stands on both samples' whole-file minimums (282.2 and 295.0); the report's sentence changes no tag, and `manifests.test.ts` stays quick on its minimum of 10.4 ms under Decision 1.
- **Standards 1:** the false sentence deleted from `tests/routes/files/file-undo.test.ts`'s head, the hook sentence kept.
- **Standards 2:** `tests/data/demo-hub.test.ts`'s head now says the join is asserted by the pairs the demo names and that counts are not pinned.
- **Standards 3:** the hub-root `node_modules/`, `tests/zz/` and the four /tmp files are gone (`ls` of each prints "No such file or directory").
- **Behaviour:** `allow-duplication.txt` took main's side with the listed marks removed; `commands.test.ts` keeps main's line 8; the three deleted files are deleted by the cherry-pick. `slideProject` lost its export: `tests/server/core/changes.test.ts` now imports `deckTarget` from `write-fixture.ts` in place of its own `DECK`, `slideProject` and `deckTarget` clones (the two decks differed by one YAML comment line), and entries 20c1f0a1f3eb and b1c8135285d1 are removed. `detached.test.ts:6-7` names `tests/routes/git/git.test.ts`. `CONFIRMED` at `git-routes.ts:139` is no longer exported.
