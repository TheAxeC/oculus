# Step T1b refuter report (on .agents/worktrees/T1b, base db5132b4a)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

Summary first. The verify list is green. The sweep is broadly sound: the removals I sampled have real holders, the folds run, the allow list is clean and the counts reproduce. Five findings matter, in this order:

1. **Behaviour: the slow tag does not keep `tmux -V` out of `npm test`.** `commands-pane.test.ts` still imports under `--tagsFilter '!slow'`, runs `tmux -V` and spends about 6 s on import. The report says the tag keeps the file from loading, which is false.
2. **Proof: the report's hook check could not see file-level hooks.** I measured two file-level `beforeAll` hooks at 94 to 124 ms. The report says no hook takes more than 3.1 ms.
3. **Spec: a new 14-test file was added.** `shared/answers.test.ts` was written although the brief says no new test, and the report quotes no failing line for it.
4. **Spec: about 94 kept tests had assertions removed or rewritten.** Item 4 forbids this, and the report names only four.
5. **Spec: `explorer.test.ts` moved a cold config read out of a `beforeEach` into the describe body.** The cost now runs at collection, outside any timing.

## Verification (rerun by the reviewer)

```
$ npm run diagrams            (exit 0; worktree docs/ shows no change in git status)
$ uptime -> 4:50 load averages: 9.60 8.95 9.79
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md
$ npm test
fatal: Needed a single revision
 Test Files  598 passed | 27 skipped (625)
      Tests  12407 passed | 666 skipped (13073)
   Duration  227.40s (transform 39.22s, setup 0ms, import 551.78s, tests 290.35s, environment 233ms)
$ npm run test:checks
 Test Files  31 passed | 2 skipped (33)
      Tests  471 passed | 9 skipped (480)
   Duration  50.10s (transform 18.15s, setup 0ms, import 60.62s, tests 109.38s, environment 7ms)
$ npm run check
1791082552006 COMPLETED 3374 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build                (✓ built in 5.39s / ✓ built in 14.39s)
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
(exit 0; 04:50:49 to 04:58:10, load 9.60 at start, 7.27 10.24 10.44 at end)
```

Evidence commands from the report, rerun:

```
diff -rq <base>/src src                  -> nothing
diff -rq <base>/tests tests              -> only tests/state/** and tests/checks/tree/allow-duplication.txt
  Only in worktree: tests/state/client/fetch-record.ts, tests/state/sessions/terminal/pty/, tests/state/shared/answers.test.ts
  Only in base: client/socket-timing.test.ts, sessions/terminal/pty-io.test.ts, sources/off-facets.ts; 167 files differ
git status --short                        -> also M .scratch/migration/agents/briefs/T1b.md (byte-identical to main's copy, so it is the orchestrator's sync and not the builder's change)
git diff db5132b4a -- allow-duplication.txt -> two removals (writes/notice-sources 5f8d3f4b7492, terminals/hpc f86fb737d860), no addition
find tests/state -name '*.test.ts' | wc -l -> 206; all .ts lines 58367; per folder test files/lines: boards 23/6866, client 10/3485, feeds 8/1628, forms 5/1853, life 7/2348, sessions 24/7992, shared 12/3076, sources 53/12175, system 19/4569, workbench 45/14375 (all match the report)
largest .ts: life/present.test.ts 807; folders at 10 items: tests/state, sessions, workbench, client, system/settings, sessions/terminal, workbench/layout, workbench/navigation, boards/board, workbench/layout/open (matches)
grep -rn "it('audits\|it(\"audits" tests/state -> nothing; grep -rn "audits" tests/state -> nothing
grep -rn "waitFor" tests/state -> nothing; base: terminals.test.ts 12 + memories-message.test.ts 1 = 13 (the builder's count is right, the brief's 14 is wrong)
timer grep (excluding zero-delay settles) -> view-state.test.ts:136 setTimeout(settle, 2) under vi.useFakeTimers only
process grep -> commands-pane.test.ts:14,76 and hunks-git.test.ts:9,56 only (both file-tagged)
npx vitest run tests/state --tagsFilter '!slow' --reporter=json (load 7.26 -> 10.11): 206 files, 5664 tests, 5658 passed, 0 failed, 6 pending; wall 72.54 s
  slowest: sections.test.ts 'Outline > reads LaTeX sectioning commands outside comments: S > T' 349.0 ms in this folder run; alone, five verbose runs (load 9.70 to 8.54): 20, 13, 17, 14, 14 ms
commands-pane --tagsFilter slow: 1 passed; hunks-git --tagsFilter slow: 5 passed (load 5.14)
sh utils/unused-exports.sh -> exit 0, 382 lines. It runs knip --production over src, and src/ is unchanged against the base (diff -rq prints nothing), so its output equals the base's by construction. The base copy has no node_modules to run it in.
grep for socket-timing / pty-io.test / off-facets / describeOffFacets over src, tests, DESIGN.md, HELP.md, README.md, vite.config.ts, spec.md -> one hit, tests/checks/utils/outside-paths.test.ts:246, which names src pty-io.ts and is unaffected
tsc --noEmit -p . (the report's "not verified" point) -> 14 errors, all TS2614/TS2532/TS2493 on *.svelte module typing in src/lib/views/shared/card/card.ts, tests/shell and tests/views; none touches tests/state or a tests/state helper. The point is closed: the sweep did not cause them.
builder transcript (agent-abd43d8d8cfbcff37.jsonl): six git invocations, not five (the sixth: `git -C /dev/null status`). checks.sh was launched twice: the first launch was killed with pkill after about 1 min, and the second ran to completion.
```

## Verdicts

Items of the brief's "What to build":

- 1 (Delete): holds for the deletions sampled. I checked 30 removals across all ten folders and each named holder exists and gives the same outcome. The sample:
  - boards: board-filters:150, board.test:175, focus:404, collection-fields:105
  - client: client-state (held by the return type; context.ts:451 is an object literal annotated ClientState), queries (held by system/docs.test.ts:121), selectors:286
  - feeds: radar:196, leads:278
  - forms: form-drafts:146, schema:314
  - life: present:597, calendar-store:173, notes:53 and notes:122
  - sessions: changes:229 / transcript:282, pty-io:88, terminal-marks constants
  - shared: wrap-tabs and tones held by checks/config/config-folder.test.ts:388 and :505
  - sources: fs-answers:50, show-in-files:419, rows:431, files.test:189 (the empty-query case)
  - system: lines:87, hpc:72, write.test.ts:65 (the -0 case)
  - workbench: notice-sources:314 plus writes.test.ts:52-69 (the timeout and the unwritten notice go through the same `tell()` path, writes.svelte.ts:121-135 and :534-540), layout-parts:259 and :160, ui-load:152, data/sources/config/rail.test.ts:80, nested:212
  - The adding of a new test file is a separate finding (Spec 1).
- 2 (Fold): holds. The tables run, and the rows of the folds I ran print their names (`client/writes.test.ts`, 11 named rows, 82 passed with `layout.test.ts`).
- 3 (Tag): partial. Both tags are right by cause. Three gaps:
  - the file tag does not keep the module-load probe out of `npm test` (Behaviour 1);
  - two file-level hooks sit at the 100 ms line unmeasured (Proof 1);
  - a cold config read was moved into collection, outside the timing (Spec 3).
- 4 (Keep): violated in its letter. About 94 hunks remove or rewrite assertions of kept tests (Spec 2). The four rewrites are judged below.
- 5 (Comments and helpers): partial. Three gaps:
  - a head comment and a doc comment were left false (Spec 4);
  - the rewritten waits hang to the test timeout instead of failing (Spec 5);
  - the helpers imported from outside are byte-identical to the base (layout-fixture, board-fixture, commands-fixture, rail-badges-fixture, side-fixture, settings/fixture; checked with `cmp`).
- 6 (Allow list): holds. Two entries were removed and nothing was added; duplication.test.ts passes inside test:checks.
- 7 (Report): partial. Some figures are wrong:
  - the hook figure (Proof 1);
  - the claim that the tag keeps the file from loading (Behaviour 1);
  - "58 unchanged files" (it is 53; Proof 3);
  - five git calls (it is six; Proof 3);
  - a dangling "(Doc text)" for `kindWord` (Proof 3);
  - no new-test failing lines (Proof 2).
- 8 (Doc text): holds. `src/lib/state/life/memories.ts:11` and the four export removals (FORMS_SUFFIX, ADDED_SUFFIX, CONFIG_SUFFIX, NARROW) are each confirmed by grep to have no importer outside their own file. The other five source comments that name a tests/state file are still true: text.ts:47, registry.ts:13 and :102 (rail-badges.test.ts:392-409 still checks badgeMark), present.ts:10 and config-files.ts:13. All 43 comments outside tests/state that name a tests/state file point at files that exist; I spot-read eight of them and their claims hold. No comment anywhere names any of the 608 test titles that are gone (python scan of src, tests and the three docs).

Cases of the brief's "Cases":

- registry.test.ts:505 and :522: met (deleted; grep finds no "audits").
- registry.test.ts:547: met.
- forces.test.ts:257: met (deleted, along with the reasoning on forces.ts and layout.ts:240-241).
- fs.test.ts:108: met (retitled at :104).
- terminal-close.test.ts:281: met (retitled; the Revert comment at :278-279 now says what the test holds).
- generation.test.ts:156-175: met (describe, `functions()`, node:fs and node:path all gone; the push cases are kept).
- client/socket-timing.test.ts: met (file deleted; socket-stub.ts kept).
- rows.test.ts:394-421: met (kept; it reads only `FILES` through readFileSync at rows.test.ts:381-382, and no test reads local.yml).
- registry.test.ts:468 and :473: met (now :156 and :161).
- config-files.test.ts:17 kept (:16): met. memories-message.test.ts:76 deleted: met.
- Helper imported from outside keeps every export: met (cmp shows them unchanged).
- Stale allow-list entry removed, test:checks green: met.
- Fold report and runs: met.
- The 95 ms / 105 ms rule case: met by the minimum rule, but measured by a different method (Proof 1, and judgment call 2 below).

The builder's judgment calls, as asked:

- **(1) The four rewrites, each judged on its own.**
  - 'mints a fresh instance id' (arrangement.test.ts:90-91): the 8 is a count of shipped tabs, a constant. Distinctness is still asserted exactly (`new Set(ids).size === ids.length`). This is the removal of a constant, not a loosening.
  - The placement test `toHaveLength(51)` to `> 0` (:156): 51 is a count of shipped views, collections and documents, a constant. The behaviour assertions (each entry on exactly one page, nothing extra, `files` on two) are unchanged, and `> 0` guards the vacuous case. Removal of a constant.
  - 'turns the shipped sessions arrangement' (:78): `root.kind` and the `viewsOf` list are layout.yml constants. Parsing and `checkWorkbench` still assert what the file's head comment says this file is for. Removal of a constant.
  - 'makes the Help page from its shipped arrangement' (:249-258): the tab list is a constant, and the store tests hold the page-from-arrangement behaviour with a synthetic arrangement (`viewsOf(...)` at :368). The title still promises a content check the test no longer makes (Spec 4).
  - None of the four is a widened predicate. All four nonetheless break item 4's letter, as do about 90 other hunks (Spec 2).
- **(2) Timing method.** Whole-folder JSON runs give upper bounds for in-test time, so no test left quick would flip. The sections.test.ts case shows this: 349 ms in a folder run, 13 to 20 ms alone. The method cannot see a file-level or first-describe `beforeAll`, nor collection time. The decisions this misses are listed in Proof 1 and Spec 3. One of those hooks sits on the 100 ms line.
- **(3) The terminals.test.ts split.** It is sound:
  - terminals.test.ts is down to 431 lines;
  - the new `pty/` folder mirrors src/lib/state/sessions/terminal/pty/, with sessions/terminal kept at 10 items;
  - `fetch-record.ts` turns two copies of a recording stub into one (it records `init`, which `stubFetch` in tests/fixtures/client.ts:84 does not), and its creation is what made the allow-list entry stale;
  - `pty-fixture.ts` re-exports `asked` and `serving`.
  - Missing: the grep for an existing helper that spec requires before writing one is not quoted (Standards 2).
- **(4) The vi.waitFor replacements.** All 13 are replaced (the grep is empty).
  - The negative checks after one macrotask `settle()` rest on the builder's control ("8 of 8 runs"), which I did not reproduce (Declined).
  - The three fixed waits are gone: terminals' 20 ms `idle`; sections' 30 ms wait, now an awaited outline whose warm-up `beforeAll` sits after the first describe already loaded the parser; and view-state's 2 ms timer, now on fake timers.
- **(5) Revert: comments judged by reading.** That is what the brief allows ("checked by reading"). I sampled eight Revert comments above trimmed tests (queries:655, terminal-close:278, files:192, and the five above status:222, palette:211, nested:265, editors-draft:141, source:281). None is false.
- **(6) The git calls.** They are a Standards finding (Standards 1), and the count is six, not five.
- **(7) Found-not-changed items.**
  - Duplicate `%j` titles: real. My run counts 28 occurrences in 10 titles, all in tables the sweep kept rather than folded. Outside item 2, which binds folds only. Reported correctly, but the report's "if wanted" offer should be dropped.
  - The tsc point: closed by my run above; it is unrelated to the sweep.
  - `tests/data/file-ops.test.ts:7` naming a missing names.test.ts: confirmed. T1e's file, so correctly routed to T1e.

## 1. Spec

- **Spec 1.** `tests/state/shared/answers.test.ts:1-67`: "// Layer 2, client-state tests. The sentence a failed read is told in. ... the bodies and the statuses are tried here once".
  - What is wrong: a new test file of 14 tests. The brief says "This is a judgment step over tests: no new test is written for it". The refusal and unreadable tables were moved out of eight store tests into this file and those store tests trimmed to one wiring row each. It is a defensible use of the Z365 lowest-level sentence, but it departs from the brief, and the report does not list it among its judgment calls.
  - The first test (:20-24) asserts that the catalog sentences of OPS_REFUSALS are distinct, which is close to a catalog-string assertion (spec.md, the test rule).
  - Failure scenario: the orchestrator reads "Everything in the brief is done" and lands a new test file the brief excluded, without a ruling. Its added tests also carry no failing line (Proof 2).
  - Verdict: item 1 holds otherwise; item 7 partial.
- **Spec 2.** About 94 hunks remove or rewrite assertions inside kept tests (my difflib scan of base against worktree). The four named in judgment call 1 are among them. Others:
  - behaviour assertions removed as "same branch": browser.test.ts:15-24 (seven refused texts down to one); editors-draft.test.ts:141-150; nested.test.ts:265; status.test.ts:222 and :265-288; follow.test.ts:47-55; composer.test.ts:86; terminal-tabs.test.ts:80; client/terminal/terminal-tabs.test.ts:449; schema.test.ts:237;
  - literal-to-`t()` rewrites: search.test.ts:88/:96, comment-draft.client.test.ts:140-201, file-git.test.ts:97-114, review-comment.test.ts:127, hpc.test.ts:127/:131, processes.test.ts:301/:324;
  - a fixture input changed so a slow path is no longer taken: source.test.ts:333-352.
  - Every removal I followed has a holder, so none is a widened predicate. Brief item 4 says "No assertion of a kept test is loosened, widened or rewritten except to fold it into a table", yet the report's judgment call 1 presents the set as "assertions of shipped constants" with four needing a ruling, while many are behaviour cuts made under the Z363 reading.
  - Failure scenario: the orchestrator rules on four rewrites and lands about 90 more edits to kept assertions that were never put to it as a class.
  - Verdict: item 4 violated in letter. My recommendation: accept the cuts as Z363 deletions at assertion level, and correct the one false title (Spec 4). The lazy option is to accept item 4 as met without a ruling.
- **Spec 3.** `tests/state/sources/explorer/explorer.test.ts:275-280`: `const catalog = textCatalog(loadConfig(engineDir()).config);` moved out of `beforeEach`.
  - What is wrong: at the base, `loadConfig` ran in the `beforeEach` of 'a typed root or workspace line as unsaved text'. I timed `loadConfig` in node at load about 8 at 117.8 ms cold and 72.8 ms warm, so per item 3 that hook made those tests slow. The builder moved it into the describe body, which runs at collection. The cost stays in `npm test` but leaves the measured test time.
  - Brief item 3: "a cold-start cost moved into a beforeAll goes into the beforeAll of a slow describe, or the file takes the file tag; it never leaves the cost in npm test." A describe body is the same move by another route.
  - The module-constant changes in arrangement.test.ts, ui.test.ts and kept-panes.test.ts only remove repeated warm calls; each of those files already loaded the config at module level at the base, so they are a real saving.
  - Failure scenario: T1a sizes its 30 s quick list from test times that exclude a cold read of about 120 ms per file. 27 tests/state files load the config at collection; this file is the one the step moved there.
  - Verdict: item 3 partial. This is a rule gap that is the orchestrator's to rule on, since Decision 1 names hooks and module-load processes but not collection-time work.
- **Spec 4.** False comments and a title the step left behind:
  - `tests/state/client/client-state.test.ts:4-5` says "the two things worth checking are that every store named in the type is actually built", and `:12` says `/** Every key the type names, so a store added to the type and not to the factory fails here. */`. The test that checked this ('holds one instance of every store it names') is deleted, and nothing in the file fails any more on a store missing from the factory or from `STORES`; the type check fails instead. Item 5 says each changed file's head comment says what the file tests after the sweep.
  - `arrangement.test.ts:249` titles 'makes the Help page from its shipped arrangement on its first press, tied to help', but the test no longer looks at what the page holds. Item 4 says a kept test's title is corrected when it is false.
  - Failure scenario: a reader trusts the comment and adds a store to the type expecting this file to catch a missing `STORES` entry; nothing does.
  - Verdict: item 5 partial, item 4 partial.
- **Spec 5.** The new waits hang instead of failing:
  - `tests/state/sessions/terminal/pty/pty-fixture.ts:40-44` (`sentCount`);
  - `pty-socket.test.ts:79-90` (`gated().posted`);
  - `life/memories-message.test.ts:74-82` (`held`).
  - What is wrong: each is a promise that resolves on the signal and never rejects. On a defect, a case now hangs to the 5 s test timeout and reports "Test timed out", with no assertion and no awaited count. The `vi.waitFor` it replaced failed after 1 s with the last assertion error. Item 5: "a helper the sweep rewrites keeps how it fails (a fixture that rejects does not come to hang)".
  - Failure scenario: a regression in subscribe ordering shows as a timeout in pty-socket.test.ts, and the reader has to re-run with logging to learn which send never came.
  - Verdict: item 5 partial. A fix within the step: the waits reject with the awaited count after a fake-clock or short bound, or the assertion follows a `Promise.race` with a named rejection.

## 2. Proof

- **Proof 1.** `T1b-report.md` DONE row "No hook of 100 ms or more": "the file's span from the JSON reporter minus the sum of its tests' durations is at most 3.1 ms ..., so no beforeAll or beforeEach costs 100 ms".
  - What is wrong: vitest's JSON reporter sets a file's startTime to the earliest test start and its end to the last test end (`node_modules/vitest/dist/chunks/index.UpGiHP7g.js:3556-3558`), so a file-level or first-describe `beforeAll` falls outside the span. The method cannot see what it claims to rule out.
  - Rerun, verbose, "tests" total minus the sum of the test times:
    - `workbench/layout/open/new-text-file.test.ts:16`, `beforeAll(() => setCatalog(textCatalog(loadConfig(...))))`: 96, 115, 95, 100, 124 ms over five runs (load 7.51);
    - `sessions/terminal/terminal-marks.test.ts:25-29`, `beforeAll` with `loadConfig`: 94, 101, 101 ms over three runs (load about 7);
    - forces.test.ts gap 34-36 ms and layout.test.ts gap 14-17 ms (the Graphviz load measures 13 ms in node).
  - The decision that rests on it: both files stay quick. By the minimum rule they stay quick (94 and 95, under 100), but both are at or above item 7's 80 ms line, so their times were owed in the report, and a run at another load can cross the line (Z379's situation).
  - Failure scenario: T1a builds its quick list from a report that says no hook costs more than 3.1 ms.
  - Verdict: item 3 partial, item 7 partial.
- **Proof 2.** `T1b-report.md` "cross-cutting: failedAnswer": "Controls on shared/answers/answers.ts (swap two keys, drop unreadable branch, drop latex branch, drop word branch) each turn it red".
  - What is wrong: spec.md ("Every package obeys", the per-test revert rule and the first-run rule) requires, for each test a step adds, one quoted run on a scratch copy with the behaviour removed and its failing line, plus a first-run row per new or changed test. The report describes controls in words and quotes no failing line for the 14 tests of answers.test.ts.
  - "Swap two keys" would also leave the first test's distinctness check green, so at least that control cannot be as described. Not verified by me; I made no source edit.
  - Failure scenario: the orchestrator accepts new tests that may pass with their behaviour removed.
  - Verdict: item 7 partial.
- **Proof 3.** Smaller report errors:
  - "58 unchanged files keep their old head; each of the 167 changed files": the tree has 225 .ts files, of which 167 changed, 5 are new or moved (fetch-record, pty-fixture, pty/pty-io, pty-socket, answers) and 53 are unchanged (`cmp` loop).
  - "five read-only status or rev-parse calls": the builder transcript shows six; the sixth is `git -C /dev/null status`.
  - Line 859 says `kindWord` "is now untested (Doc text)", but the Doc text section has no `kindWord` entry. No entry is needed, since Palette.svelte:48 imports it.
  - No decision rests on these; each is a figure stated wrongly.
- **Proof 4.** The report says (lines 132 and 722) the tagged file "never loads" under the quick filter. My rerun shows it does (Behaviour 1). Verdict: item 3 partial.

## 3. Standards

- **Standards 1.** Builder transcript: the builder ran six git commands (`git -C . status` twice, `git diff --stat`, `git -C <worktree> status --short`, `git -C . rev-parse --show-toplevel`, `git -C /dev/null status`).
  - What is wrong: spec.md, "Where you work": "You never run a git command, read-only ones included".
  - Failure scenario: none to the tree (all were read-only), but the rule is broken and the report miscounts the calls.
  - Verdict: none.
- **Standards 2.** The report is missing three quotes that spec.md requires:
  - the `sh utils/unused-exports.sh` comparison with the base (spec.md, design rules). Harmless here, since src/ is unchanged and knip runs in production mode;
  - the grep for an existing helper before `client/fetch-record.ts` and `pty/pty-fixture.ts` were written;
  - the grep of added comments and titles for history words. My grep of the added lines finds only rewrapped existing text and "no longer listed" in terminal-close.test.ts:279, which describes the test's sequence, not history.
  - Failure scenario: a reader cannot tell from the report that these checks were run.
  - Verdict: item 7 partial.
- **Standards 3.** `tests/state/workbench/navigation/registry.test.ts:7-10`: the third paragraph of the head comment ("...in the registry and in the catalogue order / drawn from it.") was rewrapped although no item changed it.
  - What is wrong: brief item 4: "keeps main's formatting and comment wrapping on every line no item changes".
  - Failure scenario: noise in the diff only.
  - Verdict: none.

## 4. Behaviour

- **Behaviour 1.** `tests/state/sessions/terminal/commands-pane.test.ts:12,25,28-31,36-38`: the head ends `// @module-tag slow: starts a private tmux server and runs a shell task in a real pane.` and the file imports `TMUX` from `tests/server/machine/pty/tmux-fixture.ts`, whose module load runs `spawnSync('tmux', ['-V'])` at `:15-17`.
  - What a host sees: `npm test` (`--tagsFilter '!slow'`) still imports this file. `npx vitest run <file> --tagsFilter '!slow'` gives `Tests 1 skipped (1)` and `Duration 6.35s (transform 2.83s, import 6.25s, tests 0ms)`.
  - With a logging `tmux` shim first on PATH (a script in my scratchpad that appends its arguments to a log, then execs /opt/homebrew/bin/tmux), the log after that run holds `25861 -V`. So the quick tier still starts a process and pays about 6 s of import for a skipped test.
  - Brief item 3 says the probe "moves into a beforeAll of the slow describe that needs it, so the quick tests load with no process; where every test needs it, the file takes the file tag". The file tag does not stop the load, so the brief's premise for the file tag is wrong for module-load causes.
  - A fix within the step's paths exists: import tmux-fixture, the server modules and `privateTmux` dynamically inside `test.beforeAll`. The same premise affects T1c's file-tagged tmux files in tests/server.
  - The report should have stated this where it claims the opposite (lines 132 and 722).
  - Failure scenario: T1a measures the quick list and finds 6 s spent in a file that runs no quick test, and every `npm test` keeps running `tmux -V`.
  - Verdict: item 3 partial. Premise found wrong, and the orchestrator's to raise.

## Declined to judge

- The builder's macrotask control for the negative checks after `settle()` in pty-socket.test.ts (`requests.answer(0); await settle(); expect(socket.written()).toEqual([])`, :187, :210, :259, :282, :301, :327), and the controls in Proof 2. Reproducing them needs an edit to a scratch copy of the project, which this review's no-edit brief excludes. They are not verified.
- Whether a describe body at collection counts as a hook under Decision 1 (Spec 3). That is a ruling for the orchestrator or the user, and T1a's tier design depends on it.
- The base-tree timing of 73.36 s quoted in the report: not rerun, since the base copy has no node_modules. No decision rests on it.
- The row-by-row "same branch" claims of the large table prunes (instance-state-* 1932 to 1039 tests; refusal tables in workbench/layout/saved/refusals): I sampled the holders listed above but did not read every pruned row against its zod shape.

Reviewer usage: token count not available to me, about 80 tool uses, about 40 minutes (04:46 to 05:25, machine load 5 to 10 with T1e building).

## Repair round 1, refuted

All ten round items are closed. The verify list is green. My reruns reproduce every closure claim that a decision rests on. Three things remain, all small enough to fix at landing or for the orchestrator to rule on, and none needs a further round:

- **Standards 1:** `arrival` arms a real 1000 ms timer on the success path. Under the reading in my prompt that makes it a Decision 1 cause. Under the brief's own words it is not.
- **Spec 1:** one pure test now sits in the new slow describe without needing its hook. As a result `npm test` no longer checks the view gate of `filesLineTyped`.
- **Proof 1:** the assertion-edit list misses one rewritten kept table, the `headLine` rows of `processes.test.ts`. Every one of the 20+ rows I sampled holds.

The facts behind Z386 and Z387 hold. One more row of `answers.test.ts`, the LaTeX word row of the word table, is same-branch.

```
$ uptime (06:26:59)  load averages: 5.07 6.93 7.54
$ npm run diagrams                      exit 0; `git status --short` afterwards lists nothing under docs/
$ uptime (06:27:11)  load averages: 5.23 6.90 7.52
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md   (exit 0)
$ npm test
fatal: Needed a single revision
 Test Files  598 passed | 27 skipped (625)
      Tests  12404 passed | 668 skipped (13072)
   Duration  195.29s (transform 32.07s, setup 0ms, import 464.33s, tests 257.55s, environment 246ms)
$ npm run test:checks
 Test Files  31 passed | 2 skipped (33)
      Tests  471 passed | 9 skipped (480)
   Duration  50.88s (transform 17.79s, setup 0ms, import 61.40s, tests 106.57s, environment 6ms)
$ npm run check
1791088299991 COMPLETED 3375 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
built in 4.23s        (the line's leading check glyph dropped here)
built in 10.44s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
$ uptime (06:34:03)  load averages: 7.90 8.70 8.35
```

Evidence commands, rerun:

```
diff -rq <base>/src src                                  -> nothing (src unchanged)
git diff db5132b4a --stat -- . ':!tests/state'           -> allow-duplication.txt (2 removals) and .scratch/.../briefs/T1b.md (cmp equal to main's copy, the orchestrator's sync)
cmp over the 226 .ts files of tests/state vs base        -> equal=53 changed=167 new=6 (report's corrected figure holds)
cmp of the six helpers imported from outside tests/state -> all six equal to base
find tests src -newer agents/briefs/T1b-round1.md        -> fixtures/client.ts (cmp equal to base), client-state, queries, terminal-close, memories-message, commands-pane, pty/pty-fixture, pty/pty-socket, shared/answers.test.ts, shared/arrival.ts, explorer, arrangement, registry
folder item counts                                       -> no folder of tests/state above 10 (tests/state/shared 9); sh utils/folder-check.sh exit 0
largest tests/state .ts                                  -> life/present.test.ts 807, sessions/source.test.ts 797
grep "it('audits" tests/state                            -> nothing; grep -c waitFor -> 0
@module-tag slow                                         -> commands-pane.test.ts, hunks-git.test.ts; describe tag: explorer.test.ts:276

Shim proof (scratchpad shims for tmux and git, each appending "<pid> <name> <args>" to shim.log, then exec of the real binary), from tools/oculus in the worktree, load 7.91 8.47 8.30:
  commands-pane.test.ts --tagsFilter '!slow' -> Tests 1 skipped (1); import 12.82s; shim.log 0 lines
  hunks-git.test.ts --tagsFilter '!slow'     -> Tests 5 skipped (5); import 530ms; shim.log 0 lines
  commands-output.test.ts (starts nothing) --tagsFilter '!slow' -> import 8.09s; commands-pane again -> import 6.21s (load 5.53): the import is the client graph's cold start, as the builder says
Slow run, commands-pane.test.ts --tagsFilter slow (load 6.29): Tests 1 passed (1), tests 907ms; shim.log 23 lines:
  6 calls "tmux -S <private sock> ...": new-session holds-the-server, set-hook, wait-for -S printed, wait-for printed, wait-for died, kill-server
  12 calls "tmux -u -S <private sock> ..." (sessions.ts: new-session, set-option, list-sessions, capture-pane, kill-session)
  1 call "tmux -V" (the version probe, no server)
  no other tmux call; before and after: ls -d $TMPDIR/oculus-pane-* -> no match; ps shows no tmux process naming oculus-pane-
hunks-git.test.ts --tagsFilter slow -> Tests 5 passed (5)

explorer.test.ts, three runs --tagsFilter slow --reporter=verbose (load 3.69 to 4.39): the two tests 7 ms and 3 ms; "tests" 109, 110, 109 ms (the hook about 99 to 100 ms); --tagsFilter '!slow' -> Tests 19 passed | 2 skipped (21), tests 5ms
Scratch copy (cp -c clone of the worktree's tools/oculus without config/local.yml), explorer.test.ts with the beforeAll and the tag removed -> both tests fail: "text key not in the text catalog (config/text/): ui.page_default" at catalogEntry src/lib/state/shared/words/text.ts:54, from the describe's beforeEach (loadLayout)

Waits, scratch copy, src edits restored and cmp equal after each:
  pty-subscribe.ts never calls subscribe() -> "Error: timed out after 1000 ms waiting for 1 messages sent on the socket; 0 had been sent" and "... waiting for 3 messages sent on the socket; 2 had been sent", failing tests at 1001 to 1011 ms
  pty-subscribe.ts settle returns true without comparing the size -> 1 failed | 28 passed; "Error: timed out after 1000 ms waiting for 2 requests posted; 1 had been posted", 1003ms
  memories.svelte.ts fetch replaced by a promise that never settles -> "Error: timed out after 1000 ms waiting for the wall's answer in the query cache; 2 cache announcements had come, none with the answer"
  probe test (scratch only, deleted): vi.useFakeTimers() then arrival(...) on nothing -> rejected within the 4 s test timeout (Tests 1 passed): the bound fires under fake timers, as arrival.ts:13 says
  arrival.ts instrumented to log each arm (scratch only), quick run of pty-socket.test.ts + memories-message.test.ts: Tests 51 passed (51); arms: 8 "messages sent on the socket", 3 "requests posted", 19 "the wall's answer in the query cache"
  same two files, worktree, quick, verbose: slowest three tests 3, 13, 14 ms; Tests 51 passed (51)

answers.test.ts controls, scratch copy:
  C10 (exists -> files.refused_denied) -> Tests 13 passed (13)
  C7 (failedAnswer returns another sentence when readAs gives null) -> 6 failed | 7 passed: the rows number, null, no error, list, string, number body
  Z386 test added in the scratch copy (expect(new Set(OPS_REFUSALS.map((word) => refusedAnswer(400, word))).size).toBe(OPS_REFUSALS.length)): unchanged src -> Tests 14 passed (14); under C10 -> 1 failed | 13 passed, at answers.test.ts:25:84
  OPS_REFUSALS: 19 words (src/lib/data/file-ops.ts:63-83); refusalSentence: 19 cases, 19 distinct keys (answers.ts:25-66)

Builder transcript (agent-abd43d8d8cfbcff37.jsonl), Bash calls after 03:19Z matching "git ": 5 hits, each the word inside a grep, sed or python text, none a git invocation
```

### Verdicts

Items of the brief's "What to build":

- **1 (Delete): holds.** The first review's 30-sample stands, and the round deletes no test beyond `answers.test.ts`'s catalog-text test (finding 4). Z387's six rows are deleted at landing.
- **2 (Fold): holds.** The round changed no fold.
- **3 (Tag): partial.**
  - Holds by process cause: in the quick tier, `commands-pane.test.ts` and `hunks-git.test.ts` load with an empty shim log.
  - Holds for the hook: the explorer describe's cold read is in a slow `beforeAll` (Z382), about 100 ms by my three runs.
  - Partial: one pure test sits in that slow describe (Spec 1), and the arrival bound question is the orchestrator's to rule (Standards 1).
- **4 (Keep): holds under Z381.** The cuts are accepted as deletions and listed. The list misses one rewritten table (Proof 1).
- **5 (Comments and helpers): holds.**
  - `client-state.test.ts:1-6` and `:12` say what the file tests now.
  - `arrangement.test.ts:252` is titled for what its body asserts.
  - The `registry.test.ts` head differs from the base only in line 1 (my diff of lines 1-14).
  - The three waits reject with what was awaited and what arrived, reproduced.
  - The six helpers imported from outside `tests/state/` are equal to the base.
- **6 (Allow list): holds.** Two removals, no addition. `test:checks` is green.
- **7 (Report): partial (Proof 1).**
  - The corrected figures hold: 53, 167 and 6; six git calls; the `kindWord` sentence; the hook DONE row now names the two measured file-level hooks; "never loads" is gone.
  - The new-test controls hold: C7 and C10 reproduced, C5 and C6 confirmed by reading.
- **8 (Doc text): holds.** The first review's checks stand. The round changed no `src` and no doc.

Cases of the brief's "Cases":

- `registry.test.ts:505`, `:522` and `:547`: met (deleted; no "audits" left).
- `forces.test.ts:257`: met.
- `fs.test.ts:108`: met (retitled).
- `terminal-close.test.ts:281`: met. The comment at `:278-279` now says "is not listed".
- `generation.test.ts:156-175`: met.
- `client/socket-timing.test.ts`: met (deleted; no reference left in `src` or `tests`).
- `rows.test.ts:394-421`: met (kept; reads only `FILES`).
- `registry.test.ts:468` and `:473`: met.
- `config-files.test.ts:17` kept, `memories-message.test.ts:76` deleted: met.
- A helper imported from outside keeps every export: met (cmp, all six equal).
- A stale allow-list entry removed with `test:checks` green: met.
- A fold reported title to row: met.
- The 95 ms / 105 ms minimum rule: met. The two file-level hooks (minimums 95 and 94 ms) stay quick, and their times are quoted in the report.

### 1. Spec

- **Spec 1.** `tests/state/sources/explorer/explorer.test.ts:288-292`:
  - The quoted hunk: `it('asks nothing of an instance of another view', () => { expect(filesLineTyped('tasks', { form: 'root', typed: '/tmp/a' })).toBe(false); ...`, placed inside `describe('a typed root or workspace line as unsaved text', { tags: ['slow'] }, ...)` at `:276`.
  - What is wrong: the test calls a pure function and needs neither the catalog nor the client. Only the describe's `beforeEach` (`loadLayout`, which reads `ui.page_default`) and therefore the catalog hook are needed, and only by the second test. My scratch run without the hook fails both tests only through that `beforeEach`. The only other test of `filesLineTyped` (`shared/instance-state-files.test.ts:539-540`) always passes `'files'`. So `npm test` no longer checks that another view's typed line is not asked about.
  - Placing it there follows the round brief's ruling to the letter, and it moves a test with no cause of its own into the slow tier.
  - Failure scenario: `filesLineTyped` answers true for every view. Every tab holding a root form with text then asks the close question, and no quick test goes red.
  - Fix at landing: move this one test out of the slow describe, for example into `describe('the workspaces to pick among')` or a describe of its own.
  - Verdict: item 3 partial.

### 2. Proof

- **Proof 1.** `tests/state/system/machine/processes.test.ts:225-235`, the `headLine` table:
  - What changed: at the base (`:240-249`) the table held five rows with literal sentences such as `'1 project in flight, 1 agent running'`. The worktree keeps two rows, `[1, 1, t('processes.head_project_one'), t('processes.head_agent_one')]` and `[3, 2, ...]`, asserting `toBe(t('processes.head', ofProjects, ofAgents))`.
  - What is wrong: the two kept rows' assertions were rewritten from literals to `t()`. The round brief's item 5 and spec.md's assertion-edit rule ask for one row per rewritten assertion. The 128-row list has none for this table. It appears only in the per-file entry (report line 813, "headLine rows 5->2 with t()"). Row 81 names the table only as a holder.
  - Sample: 21 rows of the list, checked by grepping the quoted assertion in the base copy and the worktree, all hold (the assertion is at the base, gone or rewritten in the worktree, and the named holder exists). The rows were 1, 4, 7, 12, 17, 24, 29, 33, 40 to 42, 47, 52, 57, 63, 72, 81, 88, 96, 104, 115, 119 and 126. The holders checked include `tests/data/snapshot/validate.test.ts:281`, `view-source.test.ts:39`, `composer.test.ts:402`, `diff-read.test.ts:80` and `text-kind.test.ts:19`.
  - The omission comes from the builder's pairing method: a retitled `it.each` with its title on its own line was not paired. Other retitled tables may have the same gap. I found no second case among the literal-to-`t()` files: the rows match the removed literals in `hpc`, `search`, `endpoint`, `folders`, `review-comment`, `comment-draft` and `file-git`.
  - The decision that rests on it: whether every edit to a kept assertion was put to the orchestrator. This one is harmless, since the rows still fail when `headLine` picks the wrong plural key.
  - Failure scenario: the orchestrator treats the list as complete and lands rewritten assertions it never saw as rows.
  - Verdict: item 7 partial.

### 3. Standards

- **Standards 1.** `tests/state/shared/arrival.ts:20-33`:
  - The quoted hunk: `const bound = startBound(() => { cleanup(); reject(...) }, ARRIVAL_BOUND_MS);` runs in the promise executor before `register`. It is cleared in `wake`.
  - What is wrong: every call that is not already satisfied arms a real 1000 ms node timer on the success path, and clears it on arrival. `sentCount` (`pty-fixture.ts:46`) and `posted` (`pty-socket.test.ts:93`) return early when the count is already reached. `held` (`memories-message.test.ts:78-92`) always arms.
  - My instrumented scratch run counted 30 arms across the 51 passing quick tests of the two files: 8 tests of `pty-socket.test.ts` and the wall describe of `memories-message.test.ts`.
  - The test time is unaffected: the slowest is 14 ms, and the timer never fires on success.
  - Under the criterion in my prompt (a quick test arms no real timer of 1 ms or more on success), these tests have a Decision 1 cause. Under the brief's Decision 1 text ("awaits a real timer of 1 ms or more"), they do not, since each test awaits the `wake`.
  - Failure scenario: T1a applies the cause rule by reading the code, tags about 25 quick tests slow and takes them out of `npm test`. Or the quick tier keeps tests that arm real timers against the stated criterion.
  - Options for the orchestrator:
    - (a) A bound with no timer on success: register the pending wait with vitest's `onTestFailed`, or reject on the test context's `signal`. Both are declared in `node_modules/@vitest/runner/dist/tasks.d-DEYaIMIu.d.ts:1292` and `:1298`. That either carries the message into a timed-out test's report is not verified.
    - (b) Rule that a bound cleared on success is no Decision 1 cause.
    - (c) Tag the tests slow. This is the lazy option: it removes about 25 passing checks from every gate.
  - Verdict: item 3 partial under my prompt's reading, holds under the brief's words. The ruling is the orchestrator's.
- **Standards 2.** `tests/state/sessions/terminal/commands-pane.test.ts:61-65`:
  - The quoted hunk: `test.afterAll(() => { if (server.socket === '') return; spawnSync('tmux', ['-S', server.socket, 'kill-server'], ...); rmSync(server.dir, ...); });`, with the scratch directory made at `:55-56`.
  - What is wrong: this is a second copy of `privateTmux`'s hooks (`tests/server/machine/pty/tmux-fixture.ts:27-44`), without its `try`/`finally`. Z383 forces it, because importing `tmux-fixture.ts` runs `tmux -V` at load. `duplication.test.ts` passes. The missing `try` costs nothing in practice, since `spawnSync` returns its error rather than throwing.
  - Failure scenario: none today. The two copies can drift when one changes.
  - The single copy comes back when T1a moves `tmux-fixture.ts`'s probe out of module load (Z383 books T1c's tmux files there). `commands-pane.test.ts` can then call `privateTmux` again.
  - Verdict: none.

The rest of the round's delta checks clean:
- No history word in the added comments or titles. The `terminal-close.test.ts:278-279` wording changed from "no longer listed" to "is not listed". The "still" comment in `arrangement.test.ts:259` is at the base (`:427`).
- Non-ASCII: the gate in the verify list prints nothing.
- Head comments are true:
  - `arrival.ts:1-3` and `:13` (my fake-timer probe rejected);
  - `commands-pane.test.ts:13-15` (shim log empty in the quick tier);
  - `explorer.test.ts:275` (hook about 100 ms);
  - `answers.test.ts:11-12`;
  - `client-state.test.ts:1-6`.
- File and folder sizes are within limits.
- New exports have importers: `arrival` has 3. Of `pty-fixture`'s exports, `ID`, `CHANNEL` and `serving` each have 2 importers, and `forgetSockets`, `connected`, `asked` and `lastBody` 1 each.
- No new helper replaces an existing one: the builder's grep shows no named-bound wait in `tests`, and `vi.waitFor` is the polling the brief removes.

### 4. Behaviour

None. The commands-pane cleanup leaves no server and no `$TMPDIR/oculus-pane-*` after a slow run, and every tmux call that reaches a server carries the private `-S` socket.

### Z386 and Z387, the facts checked

- **Z386:**
  - `refusalSentence` maps the 19 words of `OPS_REFUSALS` to 19 distinct keys (`answers.ts:25-66` against `file-ops.ts:63-83`).
  - C10 leaves all 13 tests green (rerun).
  - The distinct-keys test, run over the file's Proxy catalog, passes on the unchanged `src` and fails under C10 at `answers.test.ts:25:84` (rerun in the scratch copy).
- **Z387:**
  - C7 turns exactly the six rows number, null, no error, list, string and number body red (rerun). They share `failedAnswer`'s `?.` on a null `readAs` (`answers.ts:134`, `shapes.ts:209-212`).
  - C5 and C6 hold by reading: the 'empty' row and the 'text of its own' row both reach `refusedAnswer:121` with a string that is no word.
  - Deleting 'empty', 'null', 'no error', 'a body that is a list', 'a body that is a string' and 'a body that is a number' leaves 'a text of its own' and 'a number', one per side of the `?.`.
- **One more same-branch row:** the row 'an error that is a word of the LaTeX endpoint' (`answers.test.ts:33-38`).
  - C4 turns it red only together with the test at `:23`, and no control turns it red alone.
  - The handoff from `failedAnswer` to `refusedAnswer` is already the wire the ops-word row at `:32` covers. That row is red under C1 to C3 together with `:18`. The 'text of its own' row cannot serve as that wire, because it gives `refused(status)` whether or not the error is handed over.
  - The LaTeX row is therefore a second case of one wire and one branch. The ops-word row stays.
- No other row of the file is same-branch. The two statuses in `:18` and in `:56` are assertions inside one test. In `:18` the second status is what the title promises.

### Declined to judge

- What the round changed in `client/queries.test.ts` and `client/terminal/terminal-close.test.ts`. Both carry an mtime after the round brief (05:34:50), and without a snapshot at the round's start their round delta cannot be separated from the first run's. Against the base, `queries.test.ts`'s head is true (the empty-key test is at `:237`), and `terminal-close.test.ts:278-279` reads "is not listed".
- Whether `onTestFailed` or the context `signal` (Standards 1, option (a)) would put the awaited and arrived text into a timed-out test's report. Settling it needs a prototype in a scratch copy. The choice between (a) and (b) is the orchestrator's.
- C1 to C6, C8 and C9 rerun one by one. I reran C7 and C10 and confirmed C5 and C6 by reading. The others carry no decision.
- Every one of the 128 assertion-list rows. I sampled 21, plus a literal-to-`t()` completeness scan over the changed files.

Scratch files: everything is under the session scratchpad `T1b-r1/`: the clone without `config/local.yml`, the shims and their logs. Every src or test edit there was restored and checked with cmp. No file in the worktree or the main checkout was changed.

Reviewer usage: claude-opus-5-5. The token count is not available to me. About 60 tool uses, about 23 minutes (06:26 to 06:49), at a machine load of 3.7 to 8.7 with T1e's builder running.

## Closed

First run (the ten findings): each closed by repair round 1, as "Repair round 1, refuted" verifies item by item.

Repair round 1, refuted:
- Spec 1 (`explorer.test.ts:288-292`, the pure `filesLineTyped` test inside the slow describe): fixed at landing, the test moved out of the slow describe into a describe of its own.
- Proof 1 (the `headLine` table of `processes.test.ts:225-235` missing from the assertion-edit list): closed at landing, named in the landing report as a rewrite of two kept rows from literals to `t()`; the rows still fail on a wrong plural key.
- Standards 1 (`arrival.ts` arms a real 1000 ms bound on the success path): Z388, a bound cleared on success is no Decision 1 cause; no change.
- Standards 2 (`commands-pane.test.ts:61-65`, a second copy of `privateTmux`'s hooks): no change; the single copy returns when T1a moves `tmux-fixture.ts`'s probe out of module load (Z383).
- The LaTeX word row of `answers.test.ts:33-38`, same branch as the ops-word row: deleted at landing under Z387.
- Z386 and Z387: applied at landing.
