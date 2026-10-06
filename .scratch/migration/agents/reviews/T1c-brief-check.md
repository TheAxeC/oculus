# T1c brief check

## Names

1. **Source-text gates outside the eight "audits".** Item 1's third bullet deletes every assertion over source text except `core/paths.test.ts:105`. Under `tests/server` that reaches about fifteen tests the brief never names, not just the five audit cases. Command: `grep -n "it('" tests/server/core/git/git.test.ts`, then reading `git-write.test.ts:563-585`, `deposit.test.ts:632-645`, `server-args.test.ts:118-140`, `compare-gate.test.ts:80-130` and `paths.test.ts:89`. The tests:
   - `git/git-write.test.ts:564` "names each allowed subcommand at exactly one call site", `:571` "never names --force", `:579` "leaves the modules beside it no subprocess of their own";
   - `git/deposit.test.ts:633` "names the force option exactly once", `:638` "names only enumerated subcommands";
   - `core/git/git.test.ts:751` "names no writing subcommand in its source", `:761` (`PINNED_SOURCE` over `gitSources()` from `git-gates.ts`);
   - `core/git/compare-gate.test.ts:83`, `:115`, `:123`;
   - `root/process/server-args.test.ts:127`, `:136`;
   - `core/paths.test.ts:89`.

   Deleting them makes these sentences outside the write list false:
   - `DESIGN.md:128`: "held to their exact vectors in the source and in every command the suite ran, and a test asserts both", and "a test pins the list, the absence of `--force`";
   - `src/lib/server/core/git/run.ts:61-67`;
   - `src/lib/server/core/git/compare.ts:6`;
   - `src/lib/server/git/git-write.ts:3-8` and `:305-308`;
   - `src/lib/server/git/deposit-git.ts:16-19`, `:72` and `:251-254`.

   Under `spec.md:66`, a sentence the change makes false is a defect of the change. These are the gates behind "no writing git from a watcher" and "never force".

2. **`tests/checks/tree/allow-duplication.txt:39-65` (T1e's path, also edited by X3c).** It lists 22 clone pairs that involve `tests/server` files. `tests/checks/tree/duplication.test.ts:597-606` fails on an entry whose clone is no longer shared. It also fails on a new clone (`:304`, `findCopies(ROOT, 'tests')`), which a fold could create. The duplication case reads the stale entry as `stale` and expects `[]`, so a deletion in a listed pair turns `npm run test:checks` red. That breaks verify item 1, and the fix lies outside T1c's write list. In-flight check: running `git diff --name-only c02b75703` inside the X3c worktree lists `tools/oculus/tests/checks/tree/allow-duplication.txt`. The file is shared between the sweeps and X3c, which contradicts Z367's disjoint paths.

3. **Comments in other folders that name `tests/server` files.** `grep -rn "tests/server" tests src ... | grep -v "^tests/server/"` finds them in:
   - `tests/state`: `terminals.test.ts:9`, `commands-output.test.ts:9`, `ops.test.ts:12`, `acts/store.test.ts:7`, `acts/folders.test.ts:5`, `view.test.ts:6`, `merge.test.ts:3`, `repositories.test.ts:6`, `diff.test.ts:5`, `schema-modelled.test.ts:6`, `editors-writer.test.ts:8`, `store-wire.test.ts:8`;
   - `tests/data`: `file-ops.test.ts:3`, `sources/personal.test.ts:11-12`;
   - `tests/views`: `boards/deposit.test.ts:11`, `boards/editor/editor.test.ts:10`;
   - `tests/routes`: `edit/config-value.test.ts:10`, `machine/commands.test.ts:8`, `git/git.test.ts:7`, `files/search.test.ts:6`, `git/changes.test.ts:3`, `git/deposit.test.ts:6`;
   - `src`: `machine/pty/tmux.ts:118`, `machine/pty/sessions.ts:166`, `root/hooks.ts:63`, `git/git-message.ts:11`.

   Any `tests/server` file the sweep deletes or empties makes the matching sentence false. All of these are in other sweeps' paths or in `src/`, and the brief does not say who corrects them.

4. **Helper exports and in-flight importers.** Decision 2 allows removing an export that "no file in `tests/`" imports, using `grep -rn "<module name>" tests`. On main, `tests/server/machine/line-counts.ts`'s `folder` and `tally` are imported only by `tests/server/machine/lines.test.ts:27`. In the Q116 worktree, `tests/state/system/lines.test.ts:17` imports `{ COUNT, folder, tally, type Sums }` from it. Command: `grep -rn "line-counts" tests | grep import`, run in both trees. A sweep that cuts `lines.test.ts`'s cases could drop `folder` and `tally` and break Q116's landing. The grep has to include the in-flight worktrees (Q116, X3c, T1b, T1d, T1e), or the rule has to forbid dropping any export of a helper that is imported from outside `tests/server`. On main the outside importers are:
   - `writes-fixture` (`tests/routes/edit/side-project-writes.test.ts:17`);
   - `history-fixture` (`routes/files/history.test.ts:33`, `file-undo.test.ts:26`);
   - `ops-fixture` (`routes/files/file-undo.test.ts:28`, `routes/replace/preview.test.ts:23`, `routes/replace/replace-fixture.ts:26`);
   - `git/refs/repo` (`routes/git/refs.test.ts:23`, `untracked.test.ts:20`);
   - `machine/commands/commands-fixture` (`routes/machine/commands.test.ts:35`);
   - `machine/line-counts` (three files);
   - `machine/pty/tmux-fixture` (`state/sessions/terminal/commands-pane.test.ts:27`);
   - `root/context-fixture` (six route files).

5. **Docs that describe the slow tier only by its file form.** Decision 4 hands only `spec.md:56` to T1a. These sentences also become incomplete once single tests carry the tag:
   - `vite.config.ts:31-35`: "A file tagged slow (`// @module-tag slow` in its head comment)";
   - `README.md:15`: "the files tagged slow left out";
   - `HELP.md:342`: "runs the files tagged slow (`// @module-tag slow` in a test file's head comment)";
   - `orchestrator-state.md:87`.

   None of them is named for T1a or for T1c.

6. **`spec.md:37`** names `tests/server/edit/yaml-edit.test.ts` as one of the four real-hub readers. The file is at `tests/server/edit/yaml/yaml-edit.test.ts` (`ls tests/server/edit/yaml`), so the path is already stale. If the sweep changes the real-hub cases of that file or of `entry-edit.test.ts`, the sentence becomes falser. It is the orchestrator's file.

7. **Comments inside `tests/server` that name other `tests/server` tests.** There are 44 (`grep -rnE "^\s*(//|\*).*(tests/server/|[a-z-]+\.test\.ts)" tests/server | wc -l`), for example `core/git/git-gates.ts:4-5`, `compare-gate.test.ts:6`, `git-reads.test.ts:9-10` and `fetch-period.test.ts:3-4`. Item 5 rewrites head comments only of "each file the sweep changes". A file left unchanged whose comment names a test deleted elsewhere is not covered.

## The step line

1. **"a behaviour is tested at the lowest level that reaches the defect" (Z365).** No item states it. Item 1's fifth bullet keeps "the case that reaches the most of the branch", which is a different tie-break and can favour the higher-level case, for example a `listShown` case over an `ignoredIn` case.

2. **"where a behaviour is tested both in its own module and at a higher level ... the step owning the higher folder deletes the higher test".** T1c owns the higher folder relative to `tests/data`, since the data layer sits below the server layer (`tests/checks/tree/boundaries.test.ts:20`). Item 1's fifth bullet limits the comparison to "another file under `tests/server/`", so no item has T1c delete a server test that duplicates a `tests/data` test. The allow-list already names such pairs, for example `tests/data/sources/config/calendar-config.test.ts` with `tests/server/accounts/calendar/poll.test.ts`, and `tests/data/sources/docs.test.ts` with `tests/server/content/latex.test.ts` (`allow-duplication.txt:39`, `:41`).

3. **Mapped:**
   - deletes per `:57`: item 1;
   - read file by file, slow-tagged included: the intro to "What to build" and "What it must do";
   - may cut harder (Z363): item 1, fifth bullet;
   - one outcome as rows of one table: item 2;
   - passes with its behaviour taken out: item 1, fourth bullet;
   - slow tag: item 3;
   - report of removals and line counts before and after: item 6;
   - disjoint, T1a follows: "Paths this step writes". Disjointness is broken by Names 2.

## Premises

1. Counts: `find tests/server -name '*.test.ts' | wc -l` prints 138, and the `cat | wc -l` gives 49184. Per folder, running `find` once per folder gives the same figures as the brief: accounts 15/5571, content 7/2090, core 15/3807, edit 12/5455, files 8/3299, git 11/4194, machine 35/11632, root 24/8752, sessions 9/4043, transcripts 2/341. `ls -p tests/server | grep -v /` prints nothing, so no file sits directly in the folder. Holds.

2. `grep -rl "@module-tag slow" tests/server` prints 17 files, the brief's list, `core/paths` included. Holds. The existing form is `// @module-tag slow: <reason>` as the last line of the head comment (for example `core/paths.test.ts:9`). Item 3 says "on its own line under the head comment" and does not give the reason clause the tree uses.

3. The audit grep prints the eight lines the brief lists. Holds.

4. `wc -l | sort -n | tail -6` gives 848, 865, 892, 896, 900, matching the brief. Holds.

5. Vitest is `"version": "4.1.11"`. Holds. **Wrong:** `vitest.config.ts` does not exist (`sed: vitest.config.ts: No such file or directory`). The tag is declared at `vite.config.ts:35`, and the "Read" item 3 should name `vite.config.ts:30-70`.

6. Per-test tag probe: not rerun, because I may write no file. The types allow `(name, options, fn)` on the base callable, on `each` and on `for` (`node_modules/@vitest/runner/dist/tasks.d-DEYaIMIu.d.ts:716-718`, `:691-694`, `:705-706`). However, 99 `tests/server` files take `it` from `tests/fixtures/scratch.ts:117`, a `test.extend` API (`grep -rln ... fixtures/ | wc -l` gives 99). The brief's probe used a plain test, so the per-test tag on the extended `it` is not verified at runtime. `grep -rn "{ tags:" tests` confirms that no test uses the per-test form.

7. Timings, rerun per file alone at load 5.47 to 7.92 (`uptime` before each run):
   - `ignored.test.ts`: listing cases 134, 132 and 86 ms; no-repository 11 ms; git-missing 41 ms; timeout 245 ms; failed git 277 ms; empty folder 2 ms.
   - `autofetch.test.ts`: real-git cases 509 to 1739 ms; audit 1 ms.
   - Audits: `folders:173` 7 ms; `block-edit:411` 1 ms; `customizations:99` 2 ms.

   These differ from the brief's numbers (250 to 308, 120 and 57 ms). The "marks each ignored entry" case measured 86 ms, under Decision 1's 100 ms bound, so its verdict flips with load (see Implied inputs 1).

8. `ignoredIn` at `files.ts:29-41`, single failure branch at `:38`. Holds (`cat -n src/lib/server/core/git/files.ts`). `run()` at `run.ts:160-168` returns `ok: false` for a spawn error, a timeout and a non-zero exit, so all four cases reach `:38`.

9. `core/paths.test.ts:105` red in the slow tier. Holds: `npx vitest run tests/server/core/paths.test.ts --tagsFilter slow` gives `1 failed | 8 passed`, listing `block-edit.ts`, `block-source.ts` and `commands/files.ts`. **Wrong attribution:** the brief calls Z364 "Axel's ruling" (`:17`, Decision 3), but `plan.md:1052` ends "(the orchestrator, automode)".

10. Folder at ten items: `ls tests/server/files | wc -l` prints 10. Holds. The 900-line cap is at `size.test.ts:28` (`const LINES = 900;`), not `:29`. No `tests/` entry is in `utils/size-allow.txt`.

11. Helper imported from outside: holds, and see Names 4 for the full list.

12. X3c and Q116 change nothing under `tests/server` (`git diff --name-only <base>` plus `git ls-files --others` inside each worktree). Holds. X3c does change `tests/checks/tree/allow-duplication.txt` (Names 2).

13. No ADR folder exists. Holds (see ADRs).

## Cases and checks

1. **`block-edit.test.ts:411` (delete).** Correct. It reads `block-render.ts` and `block-edit.ts` as text (`:412-420`). `:405` and `:420` exercise the writer.

2. **`autofetch.test.ts:799` (delete, real-git cases slow per test).** The deletion follows the brief's rule. The real-git cases build their repositories inside each test (`remoteWithClones()`, `:565-590`), so the per-test times are real and every one is over 100 ms. Note: the head comment `:1-4` says the module "runs nothing but `git remote` and `git fetch --prune`". After the deletion, nothing in the file holds that for paths the real cases do not run. Same class as Names 1.

3. **`sessions/folders.test.ts:173` (delete).** The verdict holds, but the stated reason does not. The behaviour is "no default store when no account is named". The regression is a fallback added in `sessionFolders` (`src/lib/server/sessions/folders.ts:52-60`), not a scan with its reading taken out. `scan` is always given `stores: []` (not `undefined`), so the `??` at `transcripts.ts:232-233` never fires. The planted `<tmp>/claude/projects` transcript sits where no fallback would look. A fallback could therefore be seen only through the machine's real `~/.claude`, which the file's head comment (`:5-6`) says no test reads. The correct reason: the test cannot fail on its own fixture.

4. **`customizations.test.ts:99` (delete).** Correct: it asserts `rows` in `CUSTOMIZATION_KINDS` order (`src/.../customizations.ts:389` maps the constant) plus the constant's length. Its describe keeps a `test.beforeAll` (`:96-98`) shared with the other cases. The `CUSTOMIZATION_KINDS` import becomes unused, and lint will name it.

5. **`files/ignored.test.ts`.** The verdicts are right and the line references are wrong:
   - the timeout case starts at `:164` (the brief says `:162`, which is the end of `:158`);
   - the failed-git case starts at `:172` (the brief says `:175`, which is its `fakeGit` line).

   `:153` goes through `listShown`, then `cachedIgnored` (`fs.ts:365`), then `ignoredIn`, so it is the one case that lists a folder in no repository through the listing. Cutting it as a variation is consistent with the lowest-level reading.

   The kept timeout case asserts a wall-clock margin (`:169`, `expect(Date.now() - started).toBeLessThan(3000)`), which breaks `spec.md:64`. `machine/lines.test.ts:240` does the same. The brief's item 4 forbids changing them, and it does not say whether `spec.md:64` is part of the sweep's rule.

6. **`core/paths.test.ts:105` (untouched).** This conflicts with item 3. `paths.test.ts:89` is a source-text check that item 1 deletes (measured 770 ms). After that deletion, the remaining cases run in 0 to 17 ms and `:105` in 459 ms (same run as Premises 9). Item 3 then says the module tag goes and `:105` takes a per-test tag, which touches it. If `:105` takes no tag, it enters `npm test` and turns it red until T1a lands, which fails verify item 1. The brief must say which applies.

7. **Shared helpers (Decision 2).** See Names 4: the grep misses in-flight importers.

8. **Folds.** The case is sound, but see The question 8.

9. **`spec.md:61` is cited out of its context.** Its sentence is about DOM behaviours ("A behaviour that needs a DOM ... The unit suite renders to a string, so an assertion over source text ... proves nothing"). `spec.md:57` itself names "a constant, a label or catalog string, stylesheet text, a type, a pass-through or re-export, or markup", not server source scans. The git and force gates of Names 1 fail when the guarded thing appears, so they do not "still pass with the behaviour removed". Whether they are "audits" under Z354 is a judgment the brief does not name, and DESIGN.md:128 promises them.

## The question

1. **Item 1 (delete).** It can pass while deleting the git and force gates, which the goal does not ask for (Names 1). It can also pass while keeping a misnamed behavioural test only by renaming it (point 4 below). Nothing checks the per-test reasons beyond the report.

2. **Item 2 (fold).** Verify item 4 ("the table's run passes") also passes when a row is dropped or an expectation is merged away. Only a one-to-one list in the report, of old case title against table row, lets a reviewer check "keeps every distinct expectation".

3. **Item 3 (tag).** Verify item 2 runs only the files that are tagged. No check shows that the untagged tests are under the bound, so an untagged real-git case passes every verify item. A verbose run of each changed untagged file, with the load average, would close this. The bound also depends on load (Premises 7).

4. **Verify item 3 (audit grep empty).** It can pass by renaming. It also forces a change to `edit/yaml/yaml-edit-followup.test.ts:157`, a behavioural test of comment preservation (`setFields` exact output, a lost or moved comment being corrupted work). It is misnamed "audits", the brief gives it no verdict, and item 4 forbids rewriting a kept test. `files/picker.test.ts:111` asserts strings of the constant `PICKER_SCRIPT` and also has no verdict, though item 1 covers it.

5. **Verify item 1 (`checks.sh`, 7 commands).** `test:checks` goes red from Names 2 through no fault of the sweep's judgment, and the fix is outside the write list.

6. **Item 5 (head comments, helpers).** It passes while comments in unchanged files and in other folders name deleted tests (Names 3 and 7).

7. **Item 6 (timings).** Run under four other sweeps, the before and after times of `tests/server` carry load noise. The comparison says nothing unless both runs report a comparable load.

8. **Case "fold of N cases"** passes after a row is dropped (as in point 2).

## Implied inputs

1. **The 100 ms bound depends on load.** The same case measured 86 ms in my run and 250 ms or more in the brief's. Decision 1 does not fix the load to measure at, and Z370's protocol applies to T1a only. Alternatively the bound could classify by cause, as `spec.md:57` lists "a real process" among the causes. Decision 1 says a real process under 100 ms stays quick, which reads `:57` narrowly; it is stated, but it is not Z365's text.

2. **What counts as "a real timer or the network" is undefined.** 26 files use `setTimeout` (5 with a zero delay or `setImmediate`). 13 files use `createServer`, `listen` or `fetch`, for example loopback servers on port 0 in `root/vite-plugin.test.ts:105`. Is a loopback server "the network"? Is a zero-delay yield "a real timer"?

3. **Slowness in hooks.** There are 16 `beforeAll` hooks under `tests/server`. Per-test verbose times exclude `beforeAll`, so a quick-timed test can sit behind a slow hook. An example is `customizations.test.ts:96-98`, whose describe pays for `customizationRows(scope())`. The brief does not say how such a hook counts.

4. **A describe left empty, or a shared `beforeAll` left with no user, after deletions.** Not settled.

5. **Describe-level tags.** `describe(name, { tags }, fn)` exists (`tasks.d.ts:1200-1201`). The brief names only file and test forms.

6. **18 tests pass a numeric timeout as the third argument.** Examples: `ssh.test.ts:292-435`, `ignored.test.ts:170`. Adding `{ tags: ['slow'] }` as the second argument requires moving the timeout into the options. The brief does not say so.

7. **Import cost.** A file whose tests are all per-test tagged is still imported by `npm test`, which takes 0.9 to 1.6 s per file here (`import 1.63s` for `autofetch`). Item 3's file rule handles a file that is wholly slow, but not the import cost of mixed files.

8. **A kept test made slow only by its fixture.** For example, `ignored.test.ts:172` builds `repository()` (`git init`) although its `fakeGit` replaces git. Item 4 forbids changing the fixture, so the test is tagged slow rather than made fast.

9. **Tests of the test harness itself.** `ssh.test.ts`'s head comment (`:5-7`) names "the eight over the measurement". The brief does not say whether tests of test helpers fall under the cost list.

10. **The real-hub read cases** in `edit/entry-edit.test.ts` and `edit/yaml/yaml-edit.test.ts` (`spec.md:37`). The brief does not say whether they are tests under `:57` or probes.

11. **`tests/fixtures/` helpers** (`scratch.ts`, `real-hub.ts` and others) that the sweep leaves unused are T1e's. The brief does not say what T1c does about them.

12. **The report path** is under `.scratch/`, which `spec.md:35` forbids builders to edit. The other briefs share this convention. X3c's brief adds "in the worktree" (`agents/briefs/X3c.md:211`), and T1c's does not.

## ADRs

1. None. `ls -d .../docs/adr .../tools/oculus/docs/adr` prints "No such file or directory" for both. `ls tools/oculus/docs` prints `diagrams` alone. `grep -n -i "adr" .agents/plan.yaml` prints nothing, and `standards: []`. No record touches the step.

## Declined to judge

- **Whether the git and force source gates (Names 1) should be deleted or kept.** They guard writing git and force-push, which is Axel's rule (`run.ts:61`), and `DESIGN.md:128` promises them. Whether "no audits" (Z354) covers them, or whether `spec.md:61` reaches beyond DOM behaviours, is a ruling for the orchestrator or Axel. Reading alone does not settle it.
- **Every test in the 138 files.** I read only the five cases, the gates above and the helpers. I did not judge whether the brief's rules give the right result elsewhere.
- **Whether 100 ms is the right meaning of "well under a second".** That is a design choice, and Decision 1 states it openly.

## Usage

claude-opus-5-5, 204,893 tokens, 70 tool uses, 9.4 min (from the completion notice).

## Closed

Each finding closed by a change to `agents/briefs/T1c.md` before the preparation commit:

- Names 1 (source checks of forbidden writes): item 1's source-text bullet now deletes only a check that pins how code is written while a behaviour test holds what it does; the checks that fail when a git write, `--force` or a process enters the code are kept (Decision 5), listed under "What is on the tree" with `DESIGN.md:128`; `autofetch.test.ts:799` turned from delete to keep, retitled.
- Names 2 (`allow-duplication.txt`): the file's lines 39-65, the 24 entries naming a `tests/server` file, joined the paths (item 6); X3c changes only lines 16-23, so the merge is simple, written as `shared_paths` in the dispatch entry.
- Names 3 and 7 (comments naming deleted tests): item 5 corrects every comment under `tests/server/`, changed file or not; item 8's "Doc text" carries the sentences outside the step's paths, `src/` included, for the landing.
- Names 4 (helper exports and in-flight importers): Decision 2 now keeps every export of a helper imported from outside `tests/server/`; Q116 has landed, so its importer is on main.
- Names 5 (docs naming only the file form of the tag): item 8 rewrites `vite.config.ts:31-35`, `README.md:15`, `HELP.md:342` and `agents/spec.md:56` through "Doc text".
- Names 6 (`spec.md:37`'s stale path): corrected in `agents/spec.md` at this /spec to `tests/server/edit/yaml/yaml-edit.test.ts`.
- The step line 1 (lowest level): item 1's fifth bullet keeps the case at the lowest level that reaches the branch first.
- The step line 2 (duplicates of `tests/data`): item 1's sixth bullet deletes a server test of a behaviour a `tests/data` test holds, unless it is the one wiring case.
- Premises 2: item 3 gives the tree's form, `// @module-tag slow: <reason>` as the last head-comment line.
- Premises 5: `vite.config.ts:35` and `:30-70` in place of `vitest.config.ts`.
- Premises 6: the per-test tag probed on the `it` of `tests/fixtures/scratch.ts`, with a timeout and on `it.each`; the dropped `%s` title of the `it.each` form led to item 3's describe tag for a slow table.
- Premises 7 and Implied inputs 1: Decision 1 classifies by cause first (a real process, a real timer, a socket), which does not move with the load, and by 100 ms only for a test with none of those causes.
- Premises 9: Z364 named as the orchestrator's automode ruling.
- Premises 10: `size.test.ts:28`.
- Cases 3: `folders.test.ts:173`'s reason rewritten (it cannot fail on its own fixture).
- Cases 4: the describe's `beforeAll` and the unused import named.
- Cases 5: line references `:164` and `:172`; item 4 replaces the wall-clock margins of `ignored.test.ts:169` and `machine/lines.test.ts:240` under `spec.md:64`.
- Cases 6: Decision 3 leaves `core/paths.test.ts` wholly untouched, out of the step's paths.
- Cases 9: Decision 5 says `spec.md:61` is about behaviours that need a DOM.
- The question 2 and 8: item 7 and verify 5 ask for the old-title-to-row list of each fold.
- The question 3: verify 3 runs each changed file's quick tests verbose and checks no test at 100 ms or with a cause of Decision 1.
- The question 4: verdicts given for `yaml-edit-followup.test.ts:157` (keep, retitled) and `picker.test.ts:111` (delete, a constant); item 4 allows a false title to be corrected.
- The question 5: closed by Names 2.
- The question 7: item 7 gives the load average beside each timing.
- Implied inputs 2: Decision 1 defines a real timer (1 ms or more, awaited) and a socket (a loopback server included); a zero-delay yield is no timer.
- Implied inputs 3, 4 and 5: Decision 1 counts a hook's cause; item 5 deletes an empty describe or hook; item 3 adds the describe form.
- Implied inputs 6: item 3 moves a numeric timeout into the options object.
- Implied inputs 7: a mixed file keeps its quick tests in `npm test` at the cost of its import, which item 3 accepts; a wholly slow file takes the file tag.
- Implied inputs 8: item 4 lets a kept test's setup lose what it does not use.
- Implied inputs 9 and 10: the tests of test helpers and the real-hub readers are judged under item 1 like any test ("What it must do").
- Implied inputs 11: an unused `tests/fixtures` helper is named in the report for T1e.
- Implied inputs 12: the report is written in the worktree's copy of the ledger.
