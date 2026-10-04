NOT done: (1) `npm run test:checks` is red on one test, `tests/checks/tree/duplication.test.ts` 'holds the lists to clones that are still shared, so a repaired copy takes its entry with it', because two entries of `tests/checks/tree/allow-duplication.txt` that this sweep ended (original line 37, `calendar-config.test.ts` against `tests/server/accounts/calendar/poll.test.ts`, and original line 40, `routes/docs/memories.test.ts` against `tests/server/content/images.test.ts`) lie outside the lines this step may remove, so `checks.sh` stops at `npm run test:checks` and cannot print `checks: 7 commands passed`; the brief asks for removals only on lines 26-29, 31-36, 38 and 47 and for `npm run test:checks` green, and the two cannot both hold; on a scratch copy of the tree with those two lines removed `tests/checks/tree/duplication.test.ts` passes 18 of 18. (2) `export function slideProject` in `tests/routes/edit/write-fixture.ts` has no importer and is still exported: without `export` the clone it makes with `tests/server/core/changes.test.ts` changes its mark, the entry on original line 42 (outside this step's lines) goes stale and a new clone `84838e85ca2b` is reported, so the export stays until that entry is replaced at landing. (3) Sentences outside this step's paths that the sweep made false (among them `tests/server/git/refs/detached.test.ts:6-7`, which names `tests/routes/git/refs.test.ts` for the route's confirm, now in `tests/routes/git/git.test.ts`), and one `src/` export left with no importer (`CONFIRMED` in `src/lib/server/git/git-routes.ts:139`), are listed under Doc text for the landing and are not edited. Everything else in the brief is done.

## Open items of the state file, verbatim

The worktree's `orchestrator-state.md` lists these two under its open-items heading (`sed -n 153p` and `sed -n 155p`):

- Z314 (2026-10-03, the owed look Q81): a Confirm drawn over the update tray. It shows only while `tasks.skip_permissions` is on in `config/behavior.yml`. Axel allowed the edit for the look (2026-10-03); the Claude Code auto-mode classifier refused it again with his permission given, so the session cannot make it. Options: (a) Axel sets `skip_permissions: true` himself, the look is taken, and Axel sets it back (the session checks `git diff --exit-code -- tools/oculus/config/behavior.yml` after); (b) the point is dropped from the look. Recommendation: (a), one line each way and (b) is the lazy option.

- Z376 (2026-10-04, /spec T1d, the sweep of tests/views/, shell/, ui/ and themes/): a clash between two rulings. `tests/checks/tree/audits.test.ts` (added by R14, which Axel approved) fails on a case under `tests/views/` that renders nothing unless its title starts with "audits" or it is on `allow-audits.txt` (107 entries); Z354 says no audits, and T1d's brief retitles and deletes such cases, so T1d's `npm run test:checks` cannot pass as briefed. Options: (a) T1d deletes `audits.test.ts` and `allow-audits.txt`, and Z354 is held by `agents/spec.md:57` and `:61` alone; pros: T1d starts now, one less check; cons: nothing stops a non-rendering case landing under `tests/views/` again, the kind of rule the recurring pass finds broken in step after step. (b) T1d rewrites the check to compute one fact: each case under `tests/views/` whose body reaches no `render()`, no `mount()` and no name the file binds to one, with no title escape and no allow list; a kept case of that kind moves to the folder of the code it calls (a pure function's test to `tests/state/` and so on), so T1d starts after T1b has landed; pros: Z365's lowest-level rule is held by a check, the allow list goes; cons: T1d waits for T1b, and the check needs Axel's approval of what it computes, written here. (c) The kept non-rendering cases keep "audits" in their titles; pros: no change to the check; cons: it keeps audits Z354 removes. Recommendation: (b), since it holds his ruling by a fact a machine computes; (c) is the lazy option.

The copy of `orchestrator-state.md` in the main checkout, read with `sed -n 150,157p`, has `None.` under the same heading.

## The cases, first run on the unchanged tree

Each case was read with the code it reaches before any file changed. The verdict of the brief held for every case. The brief's own rules that cannot be met are listed after the cases.

- `routes/page.test.ts:80-160` and `:106` (ten source-text cases, nine titled as audits): each reads `src/routes/+page.svelte` as text and asserts the channels it names, the effect that registers the collections, the token install and the context-menu listener. Verdict held: all ten deleted (`spec.md:61`), with the `effects()` helper, `ROUTES` and the `readFileSync` imports; the load, server-load and `pushedCollections` cases stay. `grep -n "readFileSync\|?raw" tests/routes/page.test.ts` prints nothing.
- `routes/edit/undo/undo-removed.test.ts:110` and `:138`: run the undo of a write against a file and assert the value written back; no `tests/server` case holds the 'written as a map' fallback. Verdict held: kept, retitled 'writes the value, as a map, ...' and 'writes the value instead ...'.
- `data/sources/personal.test.ts:193`: a folder named like an object key is read as an ordinary id with a plain-object entity map. Verdict held: kept, retitled 'reads a folder named like an object key as an ordinary id'.
- `checks/tree/size.test.ts:134`: runs `utils/size-check.sh` over the tree and asserts it prints nothing, and asserted over the script's text. Verdict held: the run is kept and retitled 'runs utils/size-check.sh, which only this test runs, and reports nothing over the tree as it stands'; the assertion `expect(command).toContain('size-allow.txt')` and the read of the script text are removed; the head comment (`:10-11`) says the verification list runs no size command, so this test is what runs `utils/size-check.sh`.
- `checks/source/retired.test.ts:28`: fails when `HELP.md`, `DESIGN.md` or `README.md` names the retired Config view or card. Verdict: kept and retitled 'name no Config view, no Config card and no local.yml card'; it holds `spec.md:66` (a sentence a change makes false is a defect) for one retired screen only, through a phrase list. Named under the judgment calls for Axel.
- `checks/source/add-forms.test.ts:60` and `:65`: a check that no view draws a second add form, and its parse case. Verdict held: kept and retitled without 'audits'. It guards DESIGN.md 'Unsaved form input is instance state', which holds only while a view draws one add form per collection.
- `checks/tree/audits.test.ts` and `checks/tree/allow-audits.txt`: untouched. `cmp` of both against the base copy prints nothing.
- `data/snapshot/build-timing.test.ts`: prints times and asserts only what it fed. Verdict held: deleted.
- `data/real-hub.probe.ts`: kept unchanged and never run (`cmp` against the base copy prints nothing).
- `routes/git/untracked.test.ts:134`: the 100 ms `setTimeout` wait is replaced by a `setImmediate` loop that waits until `writes.chain` is replaced; the assertion that `trash` was not called is unchanged. The case fails when `ordered` in `src/lib/server/git/git-routes.ts` calls the work without the chain (run on a scratch copy of the tree with that one change: `1 failed | 5 passed (6)`). The file is tagged by cause: every case runs git in a scratch repository.
- A helper of `tests/fixtures/` that one file imports, such as `real-hub.ts`: `real-hub.ts` and every other helper but two are byte-identical to the base copy (`diff -rq` lists only `scratch.ts`, which lost the `export` of `sweepingOnError`, and `sessions-fixture.ts`, which lost the unused `gitPayload` and gained its label).
- A deletion that makes an entry of `allow-duplication.txt` stale: the entries on original lines 26, 28, 29, 34, 35, 36 and 47 are removed (`diff` of the file against the base copy prints exactly those seven lines). Original lines 37 and 40 are stale and outside the permitted lines; they are the two the red test names. The entry on original line 42 is kept live as item (2) of the first line says.
- A fold of several cases into a table: 89 tables (and one list of entries) in the four folders hold the folded cases; the Folds appendix maps each old title to its row, and every row passed in `npx vitest run tests/routes tests/data tests/checks --testTimeout 0 --hookTimeout 0 --reporter=json` (2346 tests, 2345 passed, the one failure being the staleness test above).

Cases where the brief's own rules are wrong or cannot be met:

- Rule: 'a deletion that makes an entry of `allow-duplication.txt` stale: on lines 26-29, 31-36, 38 or 47 the entry removed, on line 30 or 37-46 named in the report; `npm run test:checks` green'. Result: the sweep ends the clones of original lines 37 and 40, so `npm run test:checks` is red on the staleness test until they are removed, and an edit of those lines is outside this step's paths. Ruling needed from the orchestrator at landing: remove those two lines (the order of landing decides which step writes them) and replace or remove line 42 as item (2) says. The lazy option would be to widen the allow list or loosen the staleness test; neither was done.
- Rule: item 4 and Decision 7 on an awaited `vi.waitFor`. Result: `grep -rn waitFor tests/routes tests/data tests/checks tests/fixtures` prints nothing, so the rule has nothing to apply to; `grep -rn 'setTimeout\|sleep' tests/routes tests/data tests/checks tests/fixtures` prints the two `sleep 5` stubs of `routes/sessions/latex.test.ts` (`:419` and `:458`, in cases tagged slow by cause) and the zero-delay yield at `tests/fixtures/client.ts:80`.
- Rule: item 5 says the tree checks of `tests/checks/` are never tagged and are swept only on their planted-fixture cases. `tests/checks/utils/` holds tests of scripts under `utils/` (cited-lines, claude-usage, migrate-joint-work, outside-paths, rename-pillar), not checks that read the tree; Decision 1 applies to them, so four of the five are tagged by cause, and all five carry the base's label for a test of a script, 'Layer 4, test.'.
- Rule: item 7 gives one label for every file of `tests/checks/`. `tests/checks/config/config.test.ts` holds unit tests of the config readers (`loadLocal`, `checkLocal`, `loadConfig`, `behaviorFindings`) besides its checks over the shipped files; it carries 'Layer 4, tree check.' by the literal reading.

## DONE / NOT DONE

`checks.sh` ran once on the final tree and stops at the first failing command, so the five commands after `npm run test:checks` were run by hand once each on the same tree, as the repair brief says. Quoted lines are from those runs.

| Row | Status | Command and result |
|---|---|---|
| `npm run diagrams` | DONE | printed `diagrams exit 0`; `diff -rq` of the main checkout's `tools/oculus/docs` against the worktree's `docs` prints nothing. |
| `checks.sh` (the repair brief's invocation) | NOT DONE (red at `npm run test:checks`) | the last lines printed: `Duration  39.53s (transform 14.27s, setup 0ms, import 45.65s, tests 81.38s, environment 6ms) / checks: failed with exit 1: npm run test:checks / checks.sh exit 1`. |
| `npm test` | DONE | `Test Files  592 passed \| 30 skipped (622)`, `Tests  14397 passed \| 671 skipped (15068)`, from the `checks.sh` run. |
| `npm run test:checks` | NOT DONE, one red | `Test Files  1 failed \| 29 passed \| 2 skipped (32)`, `Tests  1 failed \| 411 passed \| 33 skipped (445)`; the one failure is the staleness test named in the first line. |
| `npm run check` | DONE | `COMPLETED 3369 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, exit 0. |
| `npm run build` | DONE | exit 0. |
| `npm run format:check` | DONE | `All matched files use Prettier code style!`, exit 0. |
| `npm run lint` | DONE | exit 0. |
| `! LC_ALL=C grep -rna '[^ -~]' src tests` | DONE | exit 0 (no non-ASCII byte in `src` or `tests`). |
| Slow tests pass alone | DONE | `npx vitest run tests/routes tests/data tests/checks/utils --tagsFilter slow --testTimeout 0 --hookTimeout 0` printed `Tests  171 passed \| 1783 skipped (1954)`. |
| Check 3: no quick test with a cause of Decision 1, none at 100 ms or more | DONE | A probe (a vitest setup file that counts `child_process` calls, `setTimeout` and `setInterval` of 1 ms or more, and `net` `listen` and `connect` per test) ran over `tests/routes tests/data tests/checks/utils` with `--tagsFilter '!slow'`: `Tests  1783 passed \| 171 skipped (1954)`, 4 records, all in `routes/files/search.test.ts` (a guard timer armed and never awaited), no spawn and no socket; with `--tagsFilter slow`: `Tests  171 passed \| 1783 skipped (1954)`. The per-file minima of the quick tests are in the appendix; the largest is 99.2 ms. |
| Check 4: audits and page greps | DONE | `grep -rn "it(['\"\`]audits" tests/routes tests/data tests/checks` printed `tests/checks/tree/audits.test.ts:272:                "it('audits the catalog key the view names', () => {",`; `grep -n "readFileSync\|?raw" tests/routes/page.test.ts` printed `nothing`. |
| Check 5: every fold's table passes | DONE | 89 tables, 0 rows not passed (the title-to-row lists are under 'Folds'). |
| Check 6: paths of deleted files | DONE | `grep -rn "options-walk\|build-timing\|routes/shape" src tests utils DESIGN.md HELP.md README.md config demo --exclude=local.yml` printed `nothing`. |
| Check 7: the six holders of T1c | DONE | listed below. |
| `prettier --check` and `eslint` on the four folders | DONE | `npx prettier --check tests/routes tests/data tests/checks tests/fixtures` printed `All matched files use Prettier code style!`; `npx eslint tests/routes tests/data tests/checks tests/fixtures` exit 0. |
| Head labels | DONE | A loop over the `.ts` files that `diff -rq` lists as differing from the base copy under `tests` checks `head -n 1` for `// Layer N, `; it printed (count of files, then the files without a label, then the count): `122 / without a label: 0`. |
| Files outside the paths | DONE | `diff -rq` of the base copy's `src`, `utils` and `tests` against the worktree prints 126 lines, every one inside `tests/routes`, `tests/data`, `tests/checks` or `tests/fixtures`. |

The six holders of T1c (check 7, `grep -n` on the final tree):

- `tests/data/helpers/files/nesting.test.ts:122`: `it('says each dropped pattern in the sentence of its kind, on its own key', () => {`
- `tests/data/helpers/guards.test.ts:120`: the title line of the table `writes %s out as its text or the fallback`; its first six rows ('a string', 'the empty string', 'a number', 'zero, whatever the fallback', 'true', 'false') carry the expectations of T1c's holder 'is the string, and writes a number or a boolean out'.
- `tests/data/sources/config/local.test.ts:136`: `])('answers %j with the sentence it would throw', (text, expected) => {`
- `tests/data/sources/config/settings.test.ts:64`: `it('reads the days at both ends of the window and the cadences at both ends of theirs', () => {`
- `tests/routes/sessions/terminal-edit.test.ts:365`: `it('reads them as title, icon and color, empty when the line carries none', () => {`
- `tests/data/sources/config/languages.test.ts`: 'reports nothing for the checked-in map' is deleted; its behaviour (no drops for the checked-in file) is held by `tests/data/helpers/files/languages.test.ts:22`, 'names every language the code window registers and no other, and drops nothing', which asserts `expect(drops).toEqual([])` over the same file.

Output of `checks.sh` on the final tree, as printed, in ASCII (the line `fatal: Needed a single revision` is printed by a test of another folder inside `npm test`):

```
$ npm test

> oculus@0.0.1 test
> vitest run --tagsFilter '!slow' --exclude 'tests/checks/**'


 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/T1e/tools/oculus

fatal: Needed a single revision

 Test Files  592 passed | 30 skipped (622)
      Tests  14397 passed | 671 skipped (15068)
   Start at  10:07:39
   Duration  157.21s (transform 28.25s, setup 0ms, import 357.19s, tests 219.67s, environment 200ms)

$ npm run test:checks

> oculus@0.0.1 test:checks
> vitest run tests/checks --tagsFilter '!slow' --testTimeout 0 --hookTimeout 0


 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/T1e/tools/oculus

 > |unit| tests/checks/tree/duplication.test.ts (18 tests | 1 failed) 3422ms
     x holds the lists to clones that are still shared, so a repaired copy takes its entry with it 599ms

------- Failed Tests 1 -------

 FAIL  |unit| tests/checks/tree/duplication.test.ts > a rule written twice > holds the lists to clones that are still shared, so a repaired copy takes its entry with it
AssertionError: expected [ ...(2) ] to deeply equal []

- Expected
+ Received

- []
+ [
+   "tests/data/sources/config/calendar-config.test.ts and tests/server/accounts/calendar/poll.test.ts (1c224db4bd3b)",
+   "tests/routes/docs/memories.test.ts and tests/server/content/images.test.ts (505416a28794)",
+ ]

 > tests/checks/tree/duplication.test.ts:600:23
    598|             )
    599|             .map((one) => `${one.a} and ${one.b} (${one.mark})`);
    600|         expect(stale).toEqual([]);
       |                       ^
    601|     });
    602| });

------------------------[1/1]-


 Test Files  1 failed | 29 passed | 2 skipped (32)
      Tests  1 failed | 411 passed | 33 skipped (445)
   Start at  10:10:18
   Duration  39.53s (transform 14.27s, setup 0ms, import 45.65s, tests 81.38s, environment 6ms)

checks: failed with exit 1: npm run test:checks
checks.sh exit 1
```

## Counts, before and after

Counted over every file in each folder (`find <folder> -type f`, any extension), base copy against worktree. Test counts below count each row of a table as one test.

| folder | files before | files after | test files before | test files after | lines before | lines after |
|---|---|---|---|---|---|---|
| checks | 2 | 2 | 1 | 1 | 40 | 40 |
| checks/config | 6 | 5 | 5 | 4 | 2768 | 2189 |
| checks/diagrams | 5 | 5 | 3 | 3 | 1426 | 1400 |
| checks/imports | 6 | 6 | 3 | 3 | 797 | 769 |
| checks/look | 3 | 3 | 2 | 2 | 591 | 539 |
| checks/source | 9 | 9 | 8 | 8 | 1599 | 1596 |
| checks/tree | 10 | 10 | 6 | 6 | 3302 | 3253 |
| checks/utils | 5 | 5 | 5 | 5 | 910 | 861 |
| data | 4 | 4 | 3 | 3 | 557 | 436 |
| data/accounts | 1 | 1 | 1 | 1 | 57 | 77 |
| data/helpers | 7 | 7 | 7 | 7 | 1344 | 1302 |
| data/helpers/files | 5 | 5 | 5 | 5 | 667 | 577 |
| data/prose | 3 | 3 | 2 | 2 | 607 | 598 |
| data/snapshot | 5 | 4 | 5 | 4 | 2620 | 2324 |
| data/sources | 9 | 9 | 9 | 9 | 3030 | 2764 |
| data/sources/config | 8 | 8 | 8 | 8 | 1613 | 1421 |
| data/sources/config/catalog | 2 | 2 | 2 | 2 | 118 | 126 |
| fixtures | 10 | 10 | 0 | 0 | 731 | 727 |
| routes | 3 | 2 | 3 | 2 | 295 | 142 |
| routes/docs | 5 | 5 | 5 | 5 | 1227 | 1139 |
| routes/edit | 8 | 8 | 7 | 7 | 2472 | 2277 |
| routes/edit/undo | 3 | 3 | 3 | 3 | 1249 | 1300 |
| routes/files | 10 | 10 | 9 | 9 | 3371 | 3317 |
| routes/git | 6 | 6 | 5 | 5 | 1495 | 1314 |
| routes/machine | 3 | 3 | 3 | 3 | 535 | 533 |
| routes/replace | 4 | 4 | 3 | 3 | 827 | 860 |
| routes/sessions | 8 | 8 | 7 | 7 | 2964 | 2876 |
| total | 150 | 147 | 120 | 117 | 37212 | 34757 |

Tests in the four folders: 2285 before in 120 test files, 2346 after in 117 test files (`npx vitest run ... --reporter=json`, `numTotalTests`). The count rises although tests were deleted because each row of a new table is one test. No file is at 880 lines or more: the three largest are `checks/diagrams/diagrams.test.ts` (856), `data/snapshot/normalise.test.ts` (851), `routes/edit/write.test.ts` (798); `routes/edit/write.test.ts` went from 891 to 798 lines (`wc -l`).

## Timings

Commands: `npx vitest run tests/routes tests/data --tagsFilter '!slow'` and `npx vitest run tests/checks --tagsFilter '!slow' --testTimeout 0 --hookTimeout 0` (the body of `npm run test:checks`), each with `--reporter=dot`, base copy then worktree back to back, two rounds. The machine ran other sessions' work throughout, so every figure carries the load average (1, 5, 15 minutes) read just before it. `Test Files` and `Tests` are the vitest summary lines.

```
== base_rd_1 load 3.82 5.67 5.59
base_rd_1 real 42.89 s exit 0
 Test Files  83 passed | 4 skipped (87)
      Tests  1675 passed | 128 skipped (1803)
   Duration  39.65s (transform 13.53s, setup 0ms, import 54.21s, tests 72.13s, environment 17ms)
== after_rd_1 load 5.20 5.81 5.65
after_rd_1 real 28.51 s exit 0
 Test Files  77 passed | 8 skipped (85)
      Tests  1763 passed | 138 skipped (1901)
   Duration  25.03s (transform 9.66s, setup 0ms, import 50.92s, tests 28.67s, environment 17ms)
== base_chk_1 load 5.22 5.76 5.64
base_chk_1 real 44.20 s exit 0
 Test Files  31 passed | 2 skipped (33)
      Tests  460 passed | 20 skipped (480)
   Duration  40.86s (transform 13.80s, setup 0ms, import 47.27s, tests 86.63s, environment 6ms)
== after_chk_1 load 5.69 5.81 5.66
after_chk_1 real 43.82 s exit 1
 Test Files  1 failed | 29 passed | 2 skipped (32)
      Tests  1 failed | 411 passed | 33 skipped (445)
   Duration  40.42s (transform 15.25s, setup 0ms, import 49.47s, tests 83.30s, environment 7ms)
== base_rd_2 load 7.04 6.22 5.82
base_rd_2 real 38.72 s exit 0
 Test Files  83 passed | 4 skipped (87)
      Tests  1675 passed | 128 skipped (1803)
   Duration  35.16s (transform 10.95s, setup 0ms, import 53.35s, tests 71.45s, environment 16ms)
== after_rd_2 load 7.51 6.44 5.92
after_rd_2 real 28.45 s exit 0
 Test Files  77 passed | 8 skipped (85)
      Tests  1763 passed | 138 skipped (1901)
   Duration  25.11s (transform 9.64s, setup 0ms, import 51.00s, tests 26.86s, environment 16ms)
== base_chk_2 load 7.79 6.61 6.00
base_chk_2 real 43.79 s exit 0
 Test Files  31 passed | 2 skipped (33)
      Tests  460 passed | 20 skipped (480)
   Duration  40.46s (transform 14.79s, setup 0ms, import 47.88s, tests 87.83s, environment 6ms)
== after_chk_2 load 7.36 6.70 6.06
after_chk_2 real 42.57 s exit 1
 Test Files  1 failed | 29 passed | 2 skipped (32)
      Tests  1 failed | 411 passed | 33 skipped (445)
   Duration  39.05s (transform 13.97s, setup 0ms, import 45.88s, tests 82.72s, environment 6ms)
```

The quick tier of routes and data takes `real 42.89` and `38.72` s in the base copy and `real 28.51` and `28.45` s in the worktree (vitest `Duration` 39.65 and 35.16 s against 25.03 and 25.11 s). The tier skips 128 tests in the base copy and 138 in the worktree (the slow ones); tags stand only on a cause or a measured minimum, and 339 tests were slow before this round against 171 now.

`tests/checks` takes `real 44.20` and `43.79` s in the base copy and `real 43.82` and `42.57` s in the worktree, which is not faster. The summed test time of a full run of `tests/checks` (`--reporter=json`, no tag filter) is 88.4 s in the base copy and 84.2 s in the worktree, and the same four files hold most of it in both: `diagrams/diagrams.test.ts` 16.0 s; `imports/order.test.ts` 11.2 s; `diagrams/readable.test.ts` 9.4 s; `tree/scratch.test.ts` 9.4 s in the worktree. They are tree checks and diagram checks the sweep did not shorten. The red entry of the 'after' rows is the staleness test named in the first line.

## Tags

A test is slow when it starts a real process, awaits a real timer of 1 ms or more or opens a socket (in its body, in a hook or at module load, also through imported code), or when its minimum over five runs of its own file is 100 ms or more. A file tag stands only where every test of the file meets one of those, a describe tag only where every test under it does, and a test that meets one without a tag above it carries its own `{ tags: ['slow'] }`. The times are from `npx vitest run <file> --tagsFilter '!slow'` and `--tagsFilter slow`, each of the 90 test files alone, five runs each (appendix); the four files whose tags changed after the first set of runs (`undo/undo.test.ts`, `undo/undo-removed.test.ts`, `files/file-undo.test.ts`, `files/history.test.ts`) were measured again and the later runs replace the earlier ones. The cause of each test comes from a probe over the final tree.

The first load of the engine configuration in a process costs more than a later one. Measured by calling `loadConfig(engineDir())` four times in one vitest process, in five processes: the first call took 83.0 to 85.5 ms and the later calls 44.7 to 56.6 ms (the five lines are in 'Repair round 1', finding 1). Ten route files register `test.beforeAll(warmConfig)` (`warmConfig` is in `tests/routes/edit/write-fixture.ts`): `routes/edit/audit-mute.test.ts`, `rail.test.ts`, `roots.test.ts`, `undo/undo-removed.test.ts`, `undo/undo.test.ts`, `write.test.ts`, `routes/files/file-undo.test.ts`, `project-files.test.ts`, `routes/replace/ops-replace.test.ts` and `preview.test.ts`. The hook is at file level and not in a slow describe, because quick tests of the same files load the configuration as well; its body takes 83.0 to 85.5 ms, under the 100 ms at which a hook makes the tests it serves slow (`briefs/T1e.md:46`), so the first test of a file no longer pays the cold load and a quick test pays a warm one.

#### Before this round

339 tests were slow in 33 files of `tests/routes`, `tests/data` and `tests/checks/utils`. Tag forms per file, as the report of the first round listed them (a file tag with its reason, or the number of describe and test tags), with the number of slow tests in the file:

| File | Tag form | Slow tests |
|---|---|---|
| `checks/utils/cited-lines.test.ts` | 2 test or describe tag(s) | 9 |
| `checks/utils/claude-usage.test.ts` | file tag: every case runs the command, which starts sh and python3. | 3 |
| `checks/utils/migrate-joint-work.test.ts` | file tag: every case runs the migration, which is a node process. | 6 |
| `checks/utils/outside-paths.test.ts` | 2 test or describe tag(s) | 15 |
| `data/sources/personal.test.ts` | 1 test or describe tag(s) | 1 |
| `routes/docs/docs.test.ts` | 1 test or describe tag(s) | 1 |
| `routes/docs/side-project-docs.test.ts` | file tag: its one case takes 100 ms or more. | 1 |
| `routes/edit/audit-mute.test.ts` | file tag: every case takes 85 ms or more to load the configuration. | 12 |
| `routes/edit/config-key.test.ts` | file tag: every case takes 85 ms or more to load the configuration. | 12 |
| `routes/edit/config-value.test.ts` | file tag: every case takes 100 ms or more to load the configuration. | 7 |
| `routes/edit/rail.test.ts` | 1 test or describe tag(s) | 8 |
| `routes/edit/roots.test.ts` | 9 test or describe tag(s) | 9 |
| `routes/edit/undo/undo-removed.test.ts` | file tag: every case takes 99 ms or more to load the configuration. | 43 |
| `routes/edit/undo/undo-replaced.test.ts` | file tag: every case takes 100 ms or more to load the configuration. | 5 |
| `routes/edit/undo/undo.test.ts` | file tag: every case takes 100 ms or more to load the configuration. | 35 |
| `routes/edit/write.test.ts` | 3 test or describe tag(s) | 50 |
| `routes/files/file-undo.test.ts` | file tag: every case takes 90 ms or more, and the first of a run 150 ms or more. | 20 |
| `routes/files/fs.test.ts` | 4 test or describe tag(s) | 4 |
| `routes/files/history.test.ts` | 3 test or describe tag(s) | 3 |
| `routes/files/open-program.test.ts` | 10 test or describe tag(s) | 10 |
| `routes/files/open.test.ts` | 8 test or describe tag(s) | 8 |
| `routes/files/project-files.test.ts` | file tag: the first case of a run takes 100 ms or more to load the configuration. | 4 |
| `routes/git/changes.test.ts` | 1 test or describe tag(s) | 1 |
| `routes/git/git.test.ts` | 4 test or describe tag(s) | 4 |
| `routes/git/refs.test.ts` | file tag: every case runs git in a scratch repository. | 11 |
| `routes/git/untracked.test.ts` | file tag: every case runs git in a scratch repository. | 6 |
| `routes/machine/commands.test.ts` | 3 test or describe tag(s) | 3 |
| `routes/replace/ops-replace.test.ts` | file tag: most cases run ripgrep; the others take 85 ms or more to load the config. | 18 |
| `routes/replace/preview.test.ts` | file tag: most cases run ripgrep or a real HTTP server; the others take 98 ms or more. | 8 |
| `routes/replace/replace-undo.test.ts` | file tag: every case runs ripgrep through the replace it undoes. | 5 |
| `routes/sessions/latex.test.ts` | 11 test or describe tag(s) | 15 |
| `routes/sessions/terminal-actions.test.ts` | 1 test or describe tag(s) | 1 |
| `routes/sessions/terminal-edit.test.ts` | 1 test or describe tag(s) | 1 |

Describe tags of the first round: `routes/edit/write.test.ts` (the write endpoint, the kinds the write endpoint takes, the deck write), `routes/edit/rail.test.ts` (the rail write), `routes/sessions/latex.test.ts` (a chosen formatter that is not found), `checks/utils/cited-lines.test.ts` (the citation check) and `checks/utils/outside-paths.test.ts` (two describes).

#### After this round

171 tests are slow, in 31 files. Every tag site of the final tree (`grep -rn "@module-tag slow" tests/routes tests/data tests/checks` for the file tags and `grep -rn "tags: \['slow'\]" tests/routes tests/data tests/checks` for the others), with the number of tests under it, how many of those have a recorded cause (a `child_process` call, a timer of 1 ms or more, a socket, from the probe run over the slow tier), how many have a minimum of 100 ms or more over five runs, and the lowest minimum under the tag. A test can have both. A test under a tag with neither is listed after the table.

| File | Tag | Line | Reason or title | Tests | With a cause | Min 100 ms or more | Lowest min (ms) |
|---|---|---|---|---|---|---|---|
| `checks/utils/cited-lines.test.ts` | describe | 40 | the citation check | 8 | 8 | 0 | 27.7 |
| `checks/utils/cited-lines.test.ts` | test | 143 | prints the usage for a line that does not read | 1 | 1 | 0 | 27.4 |
| `checks/utils/claude-usage.test.ts` | file | 3 | every case runs the command, which starts sh and python3. | 3 | 3 | 3 | 219.4 |
| `checks/utils/migrate-joint-work.test.ts` | file | 5 | every case runs the migration, which is a node process. | 6 | 6 | 3 | 39.6 |
| `checks/utils/outside-paths.test.ts` | describe | 73 | the paths a step changed that its brief does not name | 12 | 12 | 12 | 111.0 |
| `checks/utils/outside-paths.test.ts` | describe | 300 | the report that cannot compare | 3 | 3 | 0 | 77.5 |
| `data/demo-hub.test.ts` | file | 8 | the configuration and the portfolio built at collection take 100 ms or more. | 2 | 0 | 0 | 0.1 |
| `data/sources/personal.test.ts` | test | 234 | is named for a named pipe, and is not opened | 1 | 1 | 0 | 10.1 |
| `routes/docs/docs.test.ts` | test | 268 | answers 404 for a missing document while the sentence file does not parse | 1 | 0 | 1 | 280.3 |
| `routes/docs/side-project-docs.test.ts` | file | 4 | its one case takes 100 ms or more. | 1 | 0 | 1 | 105.9 |
| `routes/edit/audit-mute.test.ts` | test | 227 | does not know a body whose signature or flag is of the wrong shape | 1 | 0 | 1 | 200.7 |
| `routes/edit/config-key.test.ts` | file | 9 | every case takes 140 ms or more to write a setting through the route. | 12 | 0 | 12 | 140.3 |
| `routes/edit/config-value.test.ts` | file | 10 | every case takes 240 ms or more to write a list through the route. | 7 | 0 | 7 | 240.7 |
| `routes/edit/roots.test.ts` | test | 184 | records the add and the remove, and the undo of each puts the list back | 1 | 0 | 1 | 110.5 |
| `routes/edit/undo/undo-removed.test.ts` | test | 80 | gives a follow-up back whichever shape the file held it in, after the editor cleared it | 1 | 0 | 1 | 221.5 |
| `routes/edit/undo/undo-removed.test.ts` | test | 101 | gives a bare or one-list follow-up back as the text the file held, after an edit of it | 1 | 0 | 1 | 130.7 |
| `routes/edit/undo/undo-removed.test.ts` | test | 137 | gives the shape back when the note was written with its date, whichever shape the note had | 1 | 0 | 1 | 132.9 |
| `routes/edit/undo/undo-removed.test.ts` | test | 174 | gives two fields of one write back in either order of the undos | 1 | 0 | 1 | 139.3 |
| `routes/edit/undo/undo-removed.test.ts` | test | 189 | gives two neighbouring fields back exactly when the upper one is undone first | 1 | 0 | 1 | 144.2 |
| `routes/edit/undo/undo-removed.test.ts` | test | 207 | finds the place again after a line above it was rewritten | 1 | 0 | 1 | 144.1 |
| `routes/edit/undo/undo-removed.test.ts` | test | 222 | finds the place again after the same write changed a field above it | 1 | 0 | 1 | 124.8 |
| `routes/edit/undo/undo-removed.test.ts` | test | 482 | puts the lines back for a whole non-negative offset, however large | 1 | 0 | 1 | 117.5 |
| `routes/edit/undo/undo-replaced.test.ts` | file | 10 | every case takes 410 ms or more to write and take back a value. | 5 | 0 | 5 | 415.9 |
| `routes/edit/undo/undo.test.ts` | test | 225 | puts the deck's two lists back to what the save before them left | 1 | 0 | 1 | 139.8 |
| `routes/edit/undo/undo.test.ts` | test | 593 | answers unwritable for a setting whose file has turned read-only | 1 | 0 | 1 | 423.1 |
| `routes/edit/undo/undo.test.ts` | test | 618 | answers unwritable for a deck whose file has turned read-only | 1 | 0 | 1 | 109.1 |
| `routes/edit/undo/undo.test.ts` | test | 660 | answers unwritable for a deck and a rail list whose file can no longer be read | 1 | 0 | 1 | 155.5 |
| `routes/edit/write.test.ts` | test | 427 | requires a fresh non-empty id for new venues | 1 | 0 | 1 | 183.7 |
| `routes/edit/write.test.ts` | test | 518 | refuses an empty selection, a key it does not know and a repeated key | 1 | 0 | 1 | 277.3 |
| `routes/edit/write.test.ts` | test | 537 | refuses an order that is not a permutation of the catalog | 1 | 0 | 1 | 261.4 |
| `routes/edit/write.test.ts` | test | 601 | does not know a body whose two lists are not lists of words | 1 | 0 | 1 | 344.8 |
| `routes/files/fs.test.ts` | test | 112 | answers the entries of the folder a root and a path name | 1 | 1 | 0 | 19.9 |
| `routes/files/fs.test.ts` | test | 127 | answers the config folder of the engine under the engine root, and nothing above it | 1 | 1 | 0 | 16.3 |
| `routes/files/fs.test.ts` | test | 183 | names a saved root the configuration reserves, and does not serve it | 1 | 1 | 0 | 13.5 |
| `routes/files/fs.test.ts` | test | 379 | answers the bookmarks a write left in the file, with their schema | 1 | 0 | 1 | 110.3 |
| `routes/files/history.test.ts` | test | 126 | keeps the newest 50 copies of kind save and removes the older ones | 1 | 0 | 1 | 578.3 |
| `routes/files/history.test.ts` | test | 142 | does not count a copy of kind delete among the 50 | 1 | 0 | 1 | 585.4 |
| `routes/files/history.test.ts` | test | 193 | builds the index of delete copies again from the folders when it is gone | 1 | 0 | 0 | 68.9 |
| `routes/files/open-program.test.ts` | test | 81 | opens a file of every extension the checked-in map names, with that application | 1 | 1 | 0 | 74.6 |
| `routes/files/open-program.test.ts` | test | 95 | opens a listed extension written in mixed case | 1 | 1 | 0 | 7.2 |
| `routes/files/open-program.test.ts` | test | 147 | opens a file that starts with book but has no mark after it | 1 | 1 | 0 | 9.0 |
| `routes/files/open-program.test.ts` | test | 163 | refuses a file whose FinderInfo carries the alias flag, and opens one whose flags do not | 1 | 1 | 0 | 17.7 |
| `routes/files/open-program.test.ts` | test | 183 | reads a file with no FinderInfo as carrying none, and one with the flag as flagged | 1 | 1 | 0 | 7.7 |
| `routes/files/open-program.test.ts` | test | 221 | reads the map it is handed at the request: one naming .txt opens a .txt the checked-in map refuses | 1 | 1 | 0 | 7.4 |
| `routes/files/open-program.test.ts` | test | 234 | opens a file under a root when an earlier root in the list is gone | 1 | 1 | 0 | 4.8 |
| `routes/files/open-program.test.ts` | test | 297 | refuses a FIFO inside the root in either form without calling the opener | 1 | 1 | 0 | 7.2 |
| `routes/files/open-program.test.ts` | test | 346 | takes a real folder and a real listed file with a bundle id | 1 | 1 | 0 | 4.6 |
| `routes/files/open-program.test.ts` | test | 356 | refuses a file with an execute bit, a bookmark head, an alias flag or no bundle id | 1 | 1 | 0 | 8.0 |
| `routes/files/open.test.ts` | test | 99 | opens a file by its root and its path under that root, once, at its real path | 1 | 1 | 0 | 22.9 |
| `routes/files/open.test.ts` | test | 118 | opens a file under a workspace root by that root's key | 1 | 1 | 0 | 6.0 |
| `routes/files/open.test.ts` | test | 150 | opens a file by a hub-relative path and by an absolute one in the form without a root | 1 | 1 | 0 | 9.1 |
| `routes/files/open.test.ts` | test | 176 | opens a file of the engine root, a reserved key the file browser serves | 1 | 1 | 0 | 6.0 |
| `routes/files/open.test.ts` | test | 196 | opens a file under a root the saved workspace adds, through the roots the file browser serves | 1 | 1 | 0 | 12.3 |
| `routes/files/open.test.ts` | test | 235 | reads open.program_ext from the configuration on disk at every request | 1 | 1 | 0 | 19.4 |
| `routes/files/open.test.ts` | test | 382 | says a path could not be opened when the opener fails | 1 | 1 | 0 | 5.8 |
| `routes/files/open.test.ts` | test | 404 | posts a file by its root and path to the open endpoint with the token | 1 | 1 | 0 | 6.1 |
| `routes/git/changes.test.ts` | test | 71 | answers the page before the moment `before` names | 1 | 0 | 1 | 135.8 |
| `routes/git/git.test.ts` | test | 349 | refuses each asking action unconfirmed, and takes it confirmed with its fields | 1 | 0 | 1 | 837.1 |
| `routes/git/git.test.ts` | test | 374 | takes each plain action with no confirm | 1 | 0 | 1 | 482.8 |
| `routes/git/git.test.ts` | test | 480 | answers a refused read with its reason, and reads a page from 0 when skip is not a number | 1 | 1 | 0 | 58.4 |
| `routes/git/git.test.ts` | test | 535 | refuses a body with no action, an action it does not know and every body that is no map | 1 | 0 | 1 | 333.3 |
| `routes/git/refs.test.ts` | file | 9 | every case runs git in a scratch repository. | 11 | 11 | 11 | 143.3 |
| `routes/git/untracked.test.ts` | file | 8 | every case runs git in a scratch repository. | 6 | 6 | 6 | 119.6 |
| `routes/machine/commands.test.ts` | test | 265 | replaces a saved command of the same name and removes one | 1 | 0 | 1 | 173.3 |
| `routes/machine/commands.test.ts` | test | 325 | keeps every save of requests in flight together, in the order they came | 1 | 0 | 1 | 248.1 |
| `routes/machine/commands.test.ts` | test | 374 | saves a line that writes a placeholder inside quotes, after a backslash or in a comment | 1 | 0 | 1 | 258.6 |
| `routes/replace/ops-replace.test.ts` | test | 38 | replaces the second of two matches on one line and leaves the first | 1 | 1 | 1 | 116.2 |
| `routes/replace/ops-replace.test.ts` | test | 61 | replaces every match a request names, in several files | 1 | 1 | 0 | 86.6 |
| `routes/replace/ops-replace.test.ts` | test | 80 | reads $1 and \\U of a regular expression from the groups ripgrep reports | 1 | 1 | 1 | 102.5 |
| `routes/replace/ops-replace.test.ts` | test | 100 | counts the place of a match in UTF-16 units on a line with multibyte letters | 1 | 1 | 0 | 87.6 |
| `routes/replace/ops-replace.test.ts` | test | 132 | replaces a match longer than a hit row is wide, from the whole text the page keeps | 1 | 1 | 0 | 74.7 |
| `routes/replace/ops-replace.test.ts` | test | 160 | refuses `changed` when the line changed since the run, keeps the files before it and writes none after | 1 | 1 | 0 | 79.0 |
| `routes/replace/ops-replace.test.ts` | test | 187 | refuses `changed` when the text at the place is no longer the text that was found | 1 | 1 | 0 | 54.1 |
| `routes/replace/ops-replace.test.ts` | test | 245 | refuses `too_large` for a file over what the history keeps, and for a result over it | 1 | 1 | 0 | 61.3 |
| `routes/replace/ops-replace.test.ts` | test | 286 | refuses a pattern ripgrep rejects as `search-failed`, and a target with no timeout the same | 1 | 1 | 0 | 54.7 |
| `routes/replace/ops-replace.test.ts` | test | 317 | refuses empty items, empty hits, a file named twice and a hit named twice as not-an-action | 1 | 0 | 1 | 195.8 |
| `routes/replace/ops-replace.test.ts` | test | 360 | appends one files record naming each file, its kept copy and the file as it is | 1 | 1 | 0 | 84.5 |
| `routes/replace/ops-replace.test.ts` | test | 390 | records the files done before a refusal, and records nothing when the first is refused | 1 | 1 | 1 | 123.1 |
| `routes/replace/preview.test.ts` | test | 41 | holds the file as it is on the left and the file with the named matches replaced on the right | 1 | 1 | 0 | 67.5 |
| `routes/replace/preview.test.ts` | test | 61 | leaves a match it was not named for unreplaced, which is how a dismissed hit stays | 1 | 1 | 0 | 56.5 |
| `routes/replace/preview.test.ts` | test | 74 | leaves a named match that is no longer in the file unreplaced instead of refusing the preview | 1 | 1 | 0 | 59.7 |
| `routes/replace/preview.test.ts` | test | 88 | applies the groups, the case and the line ends the write would | 1 | 1 | 0 | 57.9 |
| `routes/replace/preview.test.ts` | test | 163 | previews 2000 hits in one file through the request the pane forms, which an address of the hits could not carr | 1 | 1 | 0 | 73.5 |
| `routes/replace/preview.test.ts` | test | 186 | refuses a preview posted without the write token and reads nothing | 1 | 1 | 0 | 52.6 |
| `routes/replace/preview.test.ts` | test | 203 | refuses a preview whose hit is no line and place | 1 | 1 | 0 | 49.1 |
| `routes/replace/replace-undo.test.ts` | file | 6 | every case runs ripgrep through the replace it undoes. | 5 | 5 | 3 | 88.8 |
| `routes/sessions/latex.test.ts` | test | 313 | refuses a name starting with a dash even when a main file has that name | 1 | 1 | 1 | 297.8 |
| `routes/sessions/latex.test.ts` | test | 338 | answers the number the program printed, run in the folder with the words as arguments | 1 | 1 | 1 | 170.6 |
| `routes/sessions/latex.test.ts` | test | 361 | answers 502 count-failed when the program reports a failure between its marks | 1 | 1 | 1 | 147.4 |
| `routes/sessions/latex.test.ts` | test | 379 | does not read a digit in the main file name as the count | 1 | 1 | 1 | 112.9 |
| `routes/sessions/latex.test.ts` | test | 401 | answers 502 count-missing when the program is not found | 1 | 1 | 0 | 2.4 |
| `routes/sessions/latex.test.ts` | test | 414 | answers 504 when the program runs past the time limit | 1 | 1 | 1 | 103.1 |
| `routes/sessions/latex.test.ts` | test | 438 | answers 502 format-failed when the program exits 1, its standard error never shown | 1 | 1 | 1 | 144.1 |
| `routes/sessions/latex.test.ts` | test | 456 | answers 504 past the time limit | 1 | 1 | 1 | 103.0 |
| `routes/sessions/latex.test.ts` | test | 469 | runs %s with its arguments, the text on standard input | 3 | 3 | 3 | 151.0 |
| `routes/sessions/latex.test.ts` | test | 492 | runs the program its path key names instead of the one on PATH | 1 | 1 | 1 | 147.4 |
| `routes/sessions/latex.test.ts` | describe | 534 | a chosen formatter that is not found | 3 | 3 | 0 | 0.6 |
| `routes/sessions/terminal-actions.test.ts` | test | 399 | quotes a main file name as one word, so a shell passes it to latexmk whole | 1 | 1 | 1 | 159.3 |
| `routes/sessions/terminal-edit.test.ts` | test | 251 | refuses a colour outside the eight names, with no tmux command | 1 | 0 | 1 | 187.2 |

Tests under a tag with neither a recorded cause nor a minimum of 100 ms over five runs of the file in the slow tier:

- `data/demo-hub.test.ts` (file tag, line 8): "the demo hub validates with no findings", minimum 0.8 ms; the file tag stands on the work done at collection, which a per-test time does not show (below)
- `data/demo-hub.test.ts` (file tag, line 8): "the demo hub joins each joint-work entry to the person it names", minimum 0.1 ms; the file tag stands on the work done at collection, which a per-test time does not show (below)
- `routes/files/history.test.ts` (test tag, line 193): "the copy a save keeps builds the index of delete copies again from the folders when it is gone", minimum 68.9 ms; its tag stands on minimum 282.2 ms over five runs of the file before the test carried a tag (times [385.8, 308.3, 282.2, 297.5, 287.6]); the call that rebuilds the index writes through `writeTextAtomic`, which fsyncs (`src/lib/server/core/json.ts:78-86`), and that call alone took 21.5 to 617.4 ms in 8 timed runs, so the test takes between about 70 and 640 ms with the state of the disk; in five later runs of the slow tier it took [460.6, 318.9, 68.9, 70.6, 423.6]

#### Tests that left the slow tier and tests that joined it

Compared by file and full title with the first round's list of slow tests (`round0_slow.json`, 339 tests), the final per-file slow runs list 171 tests. Tests that were slow and are not now, by file:

- `routes/edit/audit-mute.test.ts`: 11 tests
- `routes/edit/rail.test.ts`: 8 tests
- `routes/edit/roots.test.ts`: 8 tests
- `routes/edit/undo/undo-removed.test.ts`: 35 tests
- `routes/edit/undo/undo.test.ts`: 31 tests
- `routes/edit/write.test.ts`: 46 tests
- `routes/files/file-undo.test.ts`: 20 tests
- `routes/files/project-files.test.ts`: 4 tests
- `routes/replace/ops-replace.test.ts`: 6 tests
- `routes/replace/preview.test.ts`: 1 tests
- total: 170 tests

Tests that are slow now and were not before:

- `data/demo-hub.test.ts`: "the demo hub joins each joint-work entry to the person it names"
- `data/demo-hub.test.ts`: "the demo hub validates with no findings"

`data/demo-hub.test.ts` builds the configuration and the portfolio at module level, so its time is collection time, which no per-test duration shows (the two tests take 0.8 and 0.1 ms). A copy of those module-level calls in a scratch copy of the tree, timed with `performance.now()` in five fresh vitest processes, printed:

```
COLLECT config 84.0 ms, portfolio 23.6 ms, total 107.5 ms
COLLECT config 82.6 ms, portfolio 23.9 ms, total 106.5 ms
COLLECT config 84.4 ms, portfolio 55.0 ms, total 139.3 ms
COLLECT config 86.3 ms, portfolio 26.6 ms, total 112.9 ms
COLLECT config 84.9 ms, portfolio 24.2 ms, total 109.1 ms
```

The minimum of the total is 106.5 ms, so the file tag stands on the 100 ms rule. The quick tier by file and the slow tier by test, with every time and the load of each run, are in the appendix.

## Removals, folds, retitles and tags, file by file

One row per file of the four folders (150 in the base copy, 147 now). 'Tests' is the count before and after from the JSON runs; a file with no test (a helper) shows no count. The narrative for each changed file follows the table, in the order the sweep read them.

| File | State | Tests | Slow tags |
|---|---|---|---|
| `checks/config/config-folder.test.ts` | changed | 26 to 20 |  |
| `checks/config/config.test.ts` | changed | 44 to 28 |  |
| `checks/config/integrity.test.ts` | changed | 12 to 8 |  |
| `checks/config/options-catalog.test.ts` | changed | 66 to 62 |  |
| `checks/config/options-findings.ts` | read, unchanged |  |  |
| `checks/config/options-walk.test.ts` | deleted | 10 to - |  |
| `checks/diagrams/counted.ts` | read, unchanged |  |  |
| `checks/diagrams/diagrams.test.ts` | changed | 48 to 45 |  |
| `checks/diagrams/parsed.test.ts` | read, unchanged | 4 to 4 |  |
| `checks/diagrams/readable.test.ts` | read, unchanged | 21 to 21 |  |
| `checks/diagrams/tree.ts` | read, unchanged |  |  |
| `checks/imports/augments.test.ts` | changed | 9 to 9 |  |
| `checks/imports/augments.ts` | read, unchanged |  |  |
| `checks/imports/cycles.test.ts` | read, unchanged | 7 to 7 |  |
| `checks/imports/graph.ts` | changed |  |  |
| `checks/imports/order.test.ts` | changed | 13 to 13 |  |
| `checks/imports/order.ts` | changed |  |  |
| `checks/look/contrast.test.ts` | changed | 25 to 23 |  |
| `checks/look/lane-distance.test.ts` | changed | 20 to 19 |  |
| `checks/look/themes.ts` | read, unchanged |  |  |
| `checks/source/add-forms.test.ts` | changed | 2 to 2 |  |
| `checks/source/code.test.ts` | changed | 10 to 9 |  |
| `checks/source/code.ts` | changed |  |  |
| `checks/source/comment-width.test.ts` | changed | 2 to 2 |  |
| `checks/source/history.test.ts` | read, unchanged | 3 to 3 |  |
| `checks/source/html-sites.test.ts` | changed | 10 to 19 |  |
| `checks/source/keys.test.ts` | changed | 8 to 8 |  |
| `checks/source/retired.test.ts` | changed | 1 to 1 |  |
| `checks/source/text.test.ts` | changed | 13 to 11 |  |
| `checks/tree/allow-audits.txt` | read, unchanged |  |  |
| `checks/tree/allow-duplication.txt` | changed |  |  |
| `checks/tree/allow-negatives.ts` | read, unchanged |  |  |
| `checks/tree/allow-styling.ts` | changed |  |  |
| `checks/tree/audits.test.ts` | read, unchanged | 11 to 11 |  |
| `checks/tree/boundaries.test.ts` | changed | 11 to 11 |  |
| `checks/tree/duplication.test.ts` | changed | 18 to 18 |  |
| `checks/tree/negatives.test.ts` | changed | 11 to 11 |  |
| `checks/tree/scratch.test.ts` | changed | 17 to 16 |  |
| `checks/tree/size.test.ts` | changed | 10 to 10 |  |
| `checks/utils/cited-lines.test.ts` | changed | 10 to 15 | 2 test or describe tag(s) |
| `checks/utils/claude-usage.test.ts` | changed | 3 to 3 | file tag: every case runs the command, which starts sh and python3. |
| `checks/utils/migrate-joint-work.test.ts` | changed | 6 to 6 | file tag: every case runs the migration, which is a node process. |
| `checks/utils/outside-paths.test.ts` | changed | 21 to 19 | 2 test or describe tag(s) |
| `checks/utils/rename-pillar.test.ts` | changed | 7 to 10 |  |
| `checks/walk.test.ts` | read, unchanged | 1 to 1 |  |
| `checks/walk.ts` | read, unchanged |  |  |
| `data/accounts/connect.test.ts` | changed | 4 to 14 |  |
| `data/demo-hub.test.ts` | changed | 8 to 2 | file tag: the configuration and the portfolio built at collection take 100 ms or more. |
| `data/file-ops.test.ts` | changed | 14 to 43 |  |
| `data/helpers/dates.test.ts` | changed | 5 to 18 |  |
| `data/helpers/editor-options.test.ts` | changed | 69 to 71 |  |
| `data/helpers/editor.test.ts` | changed | 8 to 12 |  |
| `data/helpers/files/languages.test.ts` | changed | 17 to 15 |  |
| `data/helpers/files/nesting.test.ts` | changed | 16 to 14 |  |
| `data/helpers/files/opens-in-program.test.ts` | changed | 14 to 32 |  |
| `data/helpers/files/paths.test.ts` | changed | 10 to 27 |  |
| `data/helpers/files/text-kind.test.ts` | changed | 11 to 20 |  |
| `data/helpers/finding-text.test.ts` | changed | 5 to 13 |  |
| `data/helpers/guards.test.ts` | changed | 21 to 70 |  |
| `data/helpers/replace.test.ts` | changed | 49 to 68 |  |
| `data/helpers/search.test.ts` | changed | 37 to 52 |  |
| `data/portfolio-config.test.ts` | changed | 5 to 4 |  |
| `data/prose/latex-headings.ts` | changed |  |  |
| `data/prose/latex.test.ts` | changed | 23 to 23 |  |
| `data/prose/markdown.test.ts` | changed | 24 to 23 |  |
| `data/real-hub.probe.ts` | read, unchanged |  |  |
| `data/snapshot/build-timing.test.ts` | deleted | 3 to - |  |
| `data/snapshot/normalise.test.ts` | changed | 73 to 70 |  |
| `data/snapshot/resources.test.ts` | changed | 14 to 14 |  |
| `data/snapshot/validate-shapes.test.ts` | changed | 23 to 23 |  |
| `data/snapshot/validate.test.ts` | changed | 48 to 35 |  |
| `data/sources/agents-catalog.test.ts` | changed | 15 to 14 |  |
| `data/sources/career.test.ts` | changed | 19 to 16 |  |
| `data/sources/collections.test.ts` | changed | 19 to 17 |  |
| `data/sources/config/calendar-config.test.ts` | changed | 18 to 5 |  |
| `data/sources/config/catalog/agents.test.ts` | changed | 9 to 9 |  |
| `data/sources/config/catalog/options.test.ts` | changed | 11 to 12 |  |
| `data/sources/config/catalogs.test.ts` | changed | 18 to 18 |  |
| `data/sources/config/languages.test.ts` | changed | 10 to 9 |  |
| `data/sources/config/local.test.ts` | changed | 77 to 88 |  |
| `data/sources/config/mail-config.test.ts` | changed | 17 to 4 |  |
| `data/sources/config/merge.test.ts` | changed | 20 to 21 |  |
| `data/sources/config/rail.test.ts` | changed | 22 to 22 |  |
| `data/sources/config/settings.test.ts` | changed | 94 to 91 |  |
| `data/sources/docs.test.ts` | changed | 20 to 16 |  |
| `data/sources/feeds.test.ts` | changed | 16 to 16 |  |
| `data/sources/manifests.test.ts` | changed | 18 to 18 |  |
| `data/sources/personal.test.ts` | changed | 48 to 44 | 1 test or describe tag(s) |
| `data/sources/present.test.ts` | changed | 37 to 46 |  |
| `data/sources/registries.test.ts` | changed | 15 to 15 |  |
| `fixtures/client.ts` | read, unchanged |  |  |
| `fixtures/doubles.ts` | read, unchanged |  |  |
| `fixtures/entities-fixture.ts` | read, unchanged |  |  |
| `fixtures/feeds-fixture.ts` | read, unchanged |  |  |
| `fixtures/kinds.ts` | read, unchanged |  |  |
| `fixtures/present.ts` | read, unchanged |  |  |
| `fixtures/real-hub.ts` | read, unchanged |  |  |
| `fixtures/reason.ts` | read, unchanged |  |  |
| `fixtures/scratch.ts` | changed |  |  |
| `fixtures/sessions-fixture.ts` | changed |  |  |
| `routes/config-seed.test.ts` | changed | 3 to 3 |  |
| `routes/docs/diagrams.test.ts` | changed | 5 to 5 |  |
| `routes/docs/docs.test.ts` | changed | 38 to 33 | 1 test or describe tag(s) |
| `routes/docs/memories.test.ts` | changed | 26 to 39 |  |
| `routes/docs/side-project-docs.test.ts` | changed | 1 to 1 | file tag: its one case takes 100 ms or more. |
| `routes/docs/wallpaper.test.ts` | changed | 17 to 22 |  |
| `routes/edit/audit-mute.test.ts` | changed | 10 to 12 | 1 test or describe tag(s) |
| `routes/edit/config-key.test.ts` | changed | 14 to 12 | file tag: every case takes 140 ms or more to write a setting through the route. |
| `routes/edit/config-value.test.ts` | changed | 12 to 7 | file tag: every case takes 240 ms or more to write a list through the route. |
| `routes/edit/rail.test.ts` | changed | 10 to 9 |  |
| `routes/edit/roots.test.ts` | changed | 11 to 11 | 1 test or describe tag(s) |
| `routes/edit/side-project-writes.test.ts` | changed | 3 to 3 |  |
| `routes/edit/undo/undo-removed.test.ts` | changed | 44 to 43 | 8 test or describe tag(s) |
| `routes/edit/undo/undo-replaced.test.ts` | changed | 5 to 5 | file tag: every case takes 410 ms or more to write and take back a value. |
| `routes/edit/undo/undo.test.ts` | changed | 36 to 35 | 4 test or describe tag(s) |
| `routes/edit/write-fixture.ts` | changed |  |  |
| `routes/edit/write.test.ts` | changed | 82 to 63 | 4 test or describe tag(s) |
| `routes/files/file-undo.test.ts` | changed | 20 to 20 |  |
| `routes/files/file.test.ts` | changed | 25 to 51 |  |
| `routes/files/fs.test.ts` | changed | 19 to 17 | 4 test or describe tag(s) |
| `routes/files/history.test.ts` | changed | 21 to 21 | 3 test or describe tag(s) |
| `routes/files/open-fixture.ts` | changed |  |  |
| `routes/files/open-program.test.ts` | changed | 30 to 29 | 10 test or describe tag(s) |
| `routes/files/open.test.ts` | changed | 26 to 24 | 8 test or describe tag(s) |
| `routes/files/project-files.test.ts` | changed | 5 to 4 |  |
| `routes/files/search.test.ts` | changed | 11 to 6 |  |
| `routes/files/source.test.ts` | changed | 20 to 20 |  |
| `routes/git/changes.test.ts` | changed | 5 to 4 | 1 test or describe tag(s) |
| `routes/git/deposit.test.ts` | changed | 10 to 9 |  |
| `routes/git/git.test.ts` | changed | 32 to 28 | 4 test or describe tag(s) |
| `routes/git/refs.test.ts` | changed | 16 to 11 | file tag: every case runs git in a scratch repository. |
| `routes/git/request.ts` | changed |  |  |
| `routes/git/untracked.test.ts` | changed | 8 to 6 | file tag: every case runs git in a scratch repository. |
| `routes/machine/commands.test.ts` | changed | 19 to 18 | 3 test or describe tag(s) |
| `routes/machine/hpc.test.ts` | changed | 5 to 4 |  |
| `routes/machine/lines.test.ts` | changed | 2 to 2 |  |
| `routes/page.test.ts` | changed | 15 to 5 |  |
| `routes/replace/ops-replace.test.ts` | changed | 22 to 18 | 12 test or describe tag(s) |
| `routes/replace/preview.test.ts` | changed | 9 to 8 | 7 test or describe tag(s) |
| `routes/replace/replace-fixture.ts` | read, unchanged |  |  |
| `routes/replace/replace-undo.test.ts` | changed | 5 to 5 | file tag: every case runs ripgrep through the replace it undoes. |
| `routes/sessions/compose.test.ts` | changed | 11 to 11 |  |
| `routes/sessions/hook.test.ts` | changed | 4 to 3 |  |
| `routes/sessions/latex.test.ts` | changed | 59 to 49 | 11 test or describe tag(s) |
| `routes/sessions/terminal-actions.test.ts` | changed | 36 to 34 | 1 test or describe tag(s) |
| `routes/sessions/terminal-edit.test.ts` | changed | 21 to 21 | 1 test or describe tag(s) |
| `routes/sessions/terminal-fixture.ts` | changed |  |  |
| `routes/sessions/terminal.test.ts` | changed | 17 to 17 |  |
| `routes/sessions/transcript.test.ts` | changed | 9 to 9 |  |
| `routes/shape.test.ts` | deleted | 2 to - |  |

Every 'changed' row is named in the narrative below except two: `checks/source/comment-width.test.ts` (head label, and `export` removed from `WIDTH`, `wrappable` and `tooWide`, which no file imports) and `routes/edit/side-project-writes.test.ts` (head label and a re-wrapped head). `routes/edit/write-fixture.ts` keeps `export` on `slideProject` for the reason in the first line.

### routes/docs/memories.test.ts
- deleted: 'leaves room for the picture base64-encoded' (constant relation BODY_LIMIT_BYTES vs MAX_UPLOAD_BYTES), 'is told to the built handler before the handler is loaded' (source text of src/server.ts), 'writes a real PNG and a real JPEG under their own extensions' (png write held by 'writes the file under the folder', jpeg acceptance held by isPicture table row)
- folded: serve 404 cases; upload; write 'data' refusals (bytes-not-format, larger, empty -> 6 rows); isPicture
- setup: removed redundant made[]/afterAll sweep (fixtures/scratch sweeps)
- head: layer label
### routes/docs/docs.test.ts (edited)
- deleted: 'draws a figure beside a README through the file route' (held by figure table row 1), hub figure cases 'draws a figure beside it ... under the hub root', 'leaves a figure source that climbs out of the hub', 'leaves an address the browser resolves itself alone' (rows of figure table / same function figures()), 'escapes a quote and an ampersand in the alternative text' (marked's escaping, passes with figures() removed)
- folded: 404 id cases (2 -> 2 rows); figure address cases (project README describe 4 + hub 4 -> 4 rows of one describe: project relative, hub folder climb inside hub, browser address kept, climb out of root kept)
- setup: portfolio config read once per file
### routes/docs/wallpaper.test.ts: folded serve type, 404 serve, settings null, merged the two fixture() helpers; label
### routes/docs/diagrams.test.ts, side-project-docs.test.ts: read, kept whole, label only
### routes/edit/config-key.test.ts (edited)
- deleted: 'has a word of its own in the History view, a setting' (catalog string 'history.kind_config_key'), 'lands two writes of different keys in a row' (config-key 'at once' case lands both writes through the same queue and checks both records)
- kept: unwritable x2 (the one pair that reaches settled() in config-write.ts), others
### routes/edit/config-value.test.ts (edited)
- deleted: 'has a word of its own in the History view' (catalog string), 'refuses a list in a family of records and a record in a key/value family' (tests/server/edit/config-value.test.ts:241 and :279 hold the refusals; the wire is held by 'answers the reason of a refusal with a 200'), 'lands two writes of different keys made at once' (config-key 'lands two writes made at once' same queue), the 2 unwritable cases (same settled() branch in src/lib/server/edit/writes/config/config-write.ts:38-42 as config-key's 2)
### routes/edit/rail.test.ts (edited): folded 'refuses a page named twice' + 'refuses a page no arrangement holds, and an empty one' + 'refuses a glyph the vocabulary does not hold' -> 4 rows (400 {error:'invalid'}, file unchanged); deleted 2 unwritable cases (settled() branch src/lib/server/edit/writes/config/config-write.ts:38-42, held by config-key.test.ts unwritable x2)
### routes/edit/roots.test.ts: read, kept whole, label. side-project-writes: read, kept whole (3), label
### routes/edit/audit-mute.test.ts: folded 'refuses a signature that is not twelve hex' (loop of 3) + 'refuses a file whose shape the line edit cannot keep' -> 4 rows; label
### routes/edit/undo/undo-removed.test.ts: retitled 'audits that the value is written, as a map, ...' -> 'writes the value, as a map, ...' and 'audits that the value is written instead ...' -> 'writes the value instead ...'; deleted 'writes the value for an offset that is fractional or negative, or text that is empty' (4 inputs, each a row of the `malformed` table in 'a record without usable removed lines'); label
### routes/edit/undo/undo.test.ts: deleted 'answers unwritable for a setting whose file can no longer be read' (same throw path through the endpoint as 'whose file has turned read-only' for config-key; deck+rail unreadable kept: separate read-catch branches src/lib/server/edit/writes/config/deck.ts:104, src/lib/server/edit/writes/config/rail.ts:93); label
### routes/edit/undo/undo-replaced.test.ts: read, kept whole, label 'Layer 4, route test.' -> 'Layer 2, route tests.'
### routes/edit/write.test.ts: deleted 'refuses a request with a stale token' + 'refuses a request that carries no token' (tokenedBody held by tests/server/core/auth.test.ts:50-83; the wire kept by 'refuses a request with no token'), 'refuses a session write with no token', 'refuses a pin with no token', the 11 per-kind `refuses a <kind> body with no token` cases (same tokenedBody branch before dispatch, src/lib/server/edit/writes.ts:273), 'refuses a session write that names no id or no field' (sessionWrite parser held by 'reads a session body into the keys it names'), 'pins a session to an area through the route, and unpins it' + 'renames a session through the route, and clears the name' (tests/server/sessions/overrides.test.ts:83,100 hold them; wire held by 'carries a dismissal, a pin and a title in one body'), 'answers 400 for a body that is not a write, whatever it is missing' (config-key; MALFORMED row config-key + configKeyWrite parser tests); retitled describe 'the kinds the write endpoint learned in P1' (package id) -> 'the kinds the write endpoint takes'; head comment lost 'curl in the package's verification' clause; label. audit-mute head lost the stale 'thousand-line limit' sentence.
### routes/files/fs.test.ts: deleted 'answers 404 for a path outside the root and for a root nothing names' (tests/server/files/fs.test.ts:186 holds; 404 wire kept by the engine-root test's `path=..` 404), 'refuses a note id that would leave the folder, and writes nothing' (tests/server/files/fs.test.ts:596 holds); label
### routes/files/search.test.ts: deleted 'runs every root when the query names none' (tests/server/files/search.test.ts:114 and :146), 'says the answer was cut when the run reached the cap' (tests/server/files/search.test.ts:301), 'names a root whose search failed while another answered' (tests/server/files/search.test.ts:350), 'refuses a pattern past the bound with 400' (tests/data/helpers/search.test.ts:133, a row of the table at :129-147), 'refuses a root outside the served list with 400 and starts nothing' (tests/server/files/search.test.ts:174 and tests/data/helpers/search.test.ts:129-147; the refused wire is kept by the empty-pattern case); label
### routes/files/project-files.test.ts: deleted 'answers 200 with no rows for a project whose folder holds nothing listed' (same success branch as 'answers the rows'; tests/server/files/project-files.test.ts:117); head lost curl clause; label
### routes/files/file.test.ts (edited): folded 5 typeOf tests ('names the type of every extension a manual is made of', 'names every extension of the manual table as it did', 'names the types a manual may carry beyond that table', 'serves TypeScript as bytes...', 'falls back to bytes...') -> one 28-row table 'names %s as %s'; folded 'has nothing for a file that is not there' / 'a directory, and nothing for the root itself' / 'a path that climbs out of the root' / 'a symbolic link pointing out of the root' / 'a root nobody configured, and none for a root that is not there' -> 9 rows + 'still serves the file beside a link' (the second half of the symlink case); deleted 'serves the stylesheet the page asks for beside it' (typeOf row a/b/manual.css + same serve branch as the html case), 'is the config folder of the engine and nothing above it' (engineRoot pass-through; 404 for ../local.yml in 'serves a file of the engine config folder'), 'reports an entry that is not a pair of strings and a key two entries share' (subset of 'words each entry by the first part of it that fails'); kept 'is the same key on the client, which cannot import the server module' (the client's ENGINE_ROOT equals the server's, two separate definitions that src/lib/state/sources/explorer/view/place.ts:20 cites); folded 'reports one that is not a list' + 'reports roots that are a map as not a list' -> 2 rows; head curl clause removed; label
history.test.ts: label only; sole holder of keepCopy/forgetCopy/handleHistory logic (no tests/server/files history test), all 17 kept
file-undo.test.ts: label only; sole holder of file-undo.ts logic, all 20 kept
open-program.test.ts: deleted 'still opens a .docx whose mode carries no execute bit' (same outcome as the every-extension case: files written 0644); label
open.test.ts: deleted 'requires a path' (folded {} into the path-missing table), 'refuses a file without the write token' (tokenedBody held by tests/server/core/auth.test.ts:50-83; wire kept by 'requires the write token'); folded the two client refusal tests into 2 rows; label.
source.test.ts: sole holder of handleSource; all 22 kept; removed the temporary[]/afterEach rm (scratch sweeps); label. open-fixture.ts: label 'Layer 4, test helper.'
git/untracked.test.ts: deleted 2 'refuses a request with no token' (held by routes/git/git.test.ts 'refuses a request with no token' on /api/git, auth.test.ts); replaced the 100 ms setTimeout in 'waits behind the write chain' with a setImmediate loop until writes.chain is replaced (the case fails when `ordered` calls the work without the chain); label.
git/changes.test.ts: deleted 'answers the page size it used, and every row of a log capped below it' (tests/server/core/changes.test.ts:524 holds readChanges cap<page; handleChanges only forwards before); label;
git/git.test.ts: deleted 'refuses a worktree action on a root it was not given' (same root check before dispatch as 'refuses a root it was not given'), 'answers a refusal from the worktree write with its own reason' (same branch as 'answers a refusal from git with its own reason'), 'answers the branch listing when it is asked for no diff' (handleGitBranches forwards to handleGitGet; the branch listing describe holds it); folded 'refuses each of them unconfirmed...' of the three worktree actions into the ASKING table (3 rows); head lost curl clause; label
git/deposit.test.ts: deleted "answers 404 to a POST and a GET that name the side project's slug" (same 404 branch as the two 404 cases; knownIds held by 'holds the manuscript and not the side project'); head lost curl clause; label. git/request.ts: gitPost sends a text body as it is (git.test.ts uses it now; its own copy of HOST/URL_/request removed); label
git/refs.test.ts: deleted 'names the five new actions' + 'lists the five ... among the confirmed' (assert constants ACTIONS/CONFIRMED; the behaviour is held by the ASKING table and the action tests), 'refuses each without the token and each unconfirmed' (token held by git.test.ts; unconfirmed folded as 4 rows cherryPick/checkoutDetached/deleteBranch/deleteBranchAnyway into git.test.ts ASKING), 'refuses a name or a start point that starts with a dash' (tests/server/git/refs/delete-branch.test.ts:93, detached.test.ts:62, :94 and :127, cherry-pick.test.ts:74), 'refuses a from side that could be taken for an option' (tests/server/core/git/compare.test.ts:95 and :105); head rewritten; label
machine/hpc.test.ts: deleted 'refreshes while there is no host' (subsumed by 'refreshes without reading the host': where throws if read); label + blank line after head. lines.test.ts: label only
machine/commands.test.ts: deleted 'saves again a name that only the saved list holds' (the replace test saves the name twice and asserts the file); folded the two 'refuses a saved name that ... holds' tests into 2 rows; head label 'Layer 2, server test.' -> 'Layer 2, route tests.' and rewrapped
replace/replace-undo.test.ts: label; all 5 kept. replace/replace-fixture.ts: read, kept (all exports imported). replace/preview.test.ts: deleted 'shows another replace text in a second preview of the same file' (each preview is independent; 'holds the file' covers the same path with another replacement); label
replace/ops-replace.test.ts: deleted 'writes the replace text of a literal search as typed' (a row of the table at tests/data/helpers/replace.test.ts:202-208), 'deletes the match when the replace text is empty' (the row 'an empty replace text', tests/data/helpers/replace.test.ts:206), 'writes the case of the match when Preserve Case is on' (the table at tests/data/helpers/replace.test.ts:181-194; the case 'applies the groups, the case and the line ends the write would' at tests/routes/replace/preview.test.ts:88-89 holds the flag through the splicing the write shares), 'writes a newline for \n in a CRLF file as CRLF' (tests/data/helpers/replace.test.ts:211-216; `endsWithCrlf` at src/lib/server/files/fs/replace.ts:103 is shared with the preview, which that preview case holds); quick: denied, protected, marker, binary/missing/outside, the 3 not-an-action/bad-query; label
sessions/hook.test.ts: folded 'accepts 20 requests ... 21st with 429' + 'answers 200 for a request with the 20th call' into one test asserting the 20 statuses 200 and the 21st 429; label. sessions/transcript.test.ts: read, kept whole, label
sessions/compose.test.ts: read, kept whole; label
sessions/terminal.test.ts: folded the 3 recover refusals (unknown dataset, shell-bearing key, dash-prefixed key) into 3 rows with their exact reason (the shell-bearing row now asserts its reason too); label. terminal-fixture.ts: label Layer 4, test helper
sessions/terminal-edit.test.ts: read, kept whole; label
Edits to existing assertions (for the report): terminal.test.ts recover row 'mimic; touch nope' now also asserts reason 'key is not a dataset in the current portfolio'; open.test.ts client refusal rows both assert answer.error (the unknown-root row did not before); hook.test.ts the 20 accepted statuses are asserted in the 429 test (was a separate test); untracked.test.ts wait mechanism setImmediate loop on writes.chain instead of 100 ms
sessions/terminal-actions.test.ts: deleted 'is wired to that reader by the route module, not to the context snapshot' (asserts the text of src/routes/api/(sessions)/terminal/+server.ts; spec.md:61) and 'carries tasks.skip_permissions on the wire, off in the checked-in configuration' (asserts the value of a shipped setting, spec.md:57; the wire is held by 'adds the skip flag and nothing else when tasks.skip_permissions is on' at tests/routes/sessions/terminal-actions.test.ts:95 and 'reads a tasks.skip_permissions of any other shape, and a missing one, as off' at :104); label; head says which case starts a process. terminal-fixture.ts: HERE_FILE export removed (its one importer was the first deleted test)
sessions/latex.test.ts: deleted 'refuses a request naming no project or root' (row 'no project or root' of the word table), 'refuses an id the snapshot does not hold' (folded as row), the status-only 404 table (4 rows) and 400 table (4 rows) (every row but one is a row of 'every refusal is a word', which asserts status and word; 'neither with a path' added as a row), 'refuses a file that is missing and a file outside the root' (2 rows added to the word table with their words missing/outside), 'refuses an outline and a count asked together' (row of the word table), 'answers the text the program printed from the text it was given on standard input' (the tex-fmt row of 'runs %s with its arguments'), 'answers 502 with the missing word of the chosen program when it is not found' (the tex-fmt row of 'refuses %s-missing'); label
routes/page.test.ts: deleted 10 source-text cases (9 titled audits: 'audits that the page carries files beside the other channels...', 'audits that the page carries every channel it reads', 'audits that the collections are registered in one effect...', 'audits that a push is followed only when it carries a real collections list...', 'audits that the first frame is left to the untracked call...', 'audits that the write token the load handed on is installed...', 'audits that one contextmenu listener is added...', 'audits that the browser menu is cancelled through shouldCancel...', 'audits that the listener is taken away when the page goes', and 'takes what the previous address carried before it reads its saved workbench' at :106), plus the effects() helper, ROUTES and the readFileSync imports; kept: page load, server load, 3 pushedCollections; head rewritten. config-seed.test.ts: read, kept whole (3), label. shape.test.ts: deleted (2 cases; it reads the source of every API route for structure, spec.md:61, and no written rule asks for the check; no comment or document of the final tree names it)
tests/data/file-ops.test.ts: label "Layer 1, data tests."; deleted the constants test (TEXT_LIMIT, MAX_UPLOAD_BYTES); name-verdict cases folded into tables (made 10 rows, refused 17 rows), copy-name table 10 rows, stemLength table 4 rows; 137 -> 120 lines; 43 tests.
tests/data/demo-hub.test.ts: label; deleted 6 tests (project id list, software tier, eight registry counts, resource kinds, twelve collection keys, JSON round trip held by tests/data/snapshot/normalise.test.ts:637 and tests/checks/config/integrity.test.ts:163); join test trimmed to jointWorkPerson (tests/data/snapshot/normalise.test.ts:565 holds personIds); 2 kept.
tests/data/accounts/connect.test.ts: label; 4 tests (multi-expect) become 2 tables (7 + 7 rows).
tests/data/helpers/editor.test.ts: label; deleted the checked-in-config constant test (paint_limit_kb 20480; the real config is validated by the findings of src/lib/data/sources/config/catalogs.ts:187-188 in the integrity check); the null test and sizes table merged into one 10-row table that also checks requirePaintLimit; throws test 2-row table. 53 -> ~35 lines.
tests/data/helpers/dates.test.ts: label; ago 4 tests -> one 15-row table; localDate 1 test -> 3 rows.
tests/data/helpers/finding-text.test.ts: label; 5 multi-expect tests -> 4 tables (fillPlaceholders 5 rows, findingText present 4 rows, absent 4 rows).
tests/data/helpers/guards.test.ts: label; 21 multi-expect tests -> tables (isMap 9, str 9, text 7, strings 9, fields 5+1, scalar 13, item 4, numericSetting 4, sameInOrder 7; byKey 2 kept); head count "fifteen modules" checked below.
tests/data/helpers/guards.test.ts head: "fifteen modules" replaced (106 src files import guards.ts, checked with grep -rl "helpers/guards" src | wc -l).
tests/data/helpers/editor-options.test.ts: label; deleted 'the tracked configuration draws no finding' (held by tests/checks/config/config.test.ts:411); 3 pairs of cases folded into tables (languages not a map 2 rows, record shapes 3 rows, repo languages not a map 2 rows); 72 tests.
tests/data/helpers/replace.test.ts: label; 11 multi-expect tests folded into tables (template 5 rows, groupsFrom refusal 2, markers 5, regex reads 15, case ops 2, literal 3); 68 tests.
tests/data/helpers/search.test.ts: label; deleted 'passes a pattern that opens with a dash' and 'per-file count' (default arg list pins --regexp before the pattern and 501 for max 500), 'opens a fresh query on the whole root' (held by the queryFrom default test), the duplicate 'configured cap' describe (merged into the max_hits table); option flags 3 tests -> 4-row table; refusals 4 tests + under refusals -> 15-row table; cap tables; 302 -> see wc.
tests/data/helpers/files/languages.test.ts: label "tests."; deleted 'leaves Wren and Graphviz to plain text' (a config pin) and 'built once per read, as a Map...' (a type); 
tests/data/helpers/files/paths.test.ts: label; 10 multi-expect tests -> tables (nameOf 4, trimSlash 4, joinPath 6, pathUnder 10, deepestHolding 2 rows + null test).
tests/data/helpers/files/nesting.test.ts: label "tests."; deleted 'hold the keys of VS Code default list' and 'write each parent children as a list' (config pins; the shipped file is held by 'says nothing for the shipped patterns').
tests/data/helpers/files/opens-in-program.test.ts: label; deleted the 10-entry map pin (APPS toEqual) and the duplicate lowercase/null tests; refused names -> it.each of 10; inherited/empty map -> 4 rows; isBundleId 6 rows; programApps one 11-row table.
tests/data/helpers/files/text-kind.test.ts: label; deleted the whole 'the sniff over the cases of one rule' describe and the TEXT_SNIFF_READ === TEXT_SNIFF + 1 constant assertion; text 5 rows, not-text 12 rows.
tests/data/portfolio-config.test.ts: label; deleted 'answers the defaults for a config holding nothing' (pins default registry/feed paths, which have config keys); 4 kept.
tests/data/prose/latex.test.ts: label; 'reads the sections of a text the parser refuses', 'reads both sections around a line', 'reads no includes from a text the parser refuses' -> one 3-row table asserting the whole read.
tests/data/prose/latex-headings.ts: label "Layer 4, test helper."
tests/data/prose/markdown.test.ts: label; deleted 'paints the fenced code of a document the route renders' (the route wire is held by the [TOC] and figure cases, the painting by renderDocument); heading assertions repeated in two caller cases removed.
tests/data/snapshot/build-timing.test.ts: deleted (a measurement that prints times and asserts what it fed; brief item 1). No reference to its path remains in src tests utils DESIGN.md HELP.md README.md package.json vite.config.ts config.
tests/data/snapshot/resources.test.ts: label only; read in full, kept whole (each a distinct outcome of the registry/compute readers through buildPortfolio).
tests/data/snapshot/validate-shapes.test.ts: label only; read in full, kept whole (each a distinct wrong-shape field group; the relation-field test is already one table-as-object).
tests/data/snapshot/validate.test.ts: label; 13 tests deleted as outcomes validate-shapes.test.ts gives through the same branch (Z363):
 - 'reports a top-level key the schema does not name' -> validate-shapes 'reports a key the schema does not name'
 - 'reports a wrong shape in every relation field' -> validate-shapes 'reports each relation field set to a value that is neither text nor a list'
 - 'reports a chip outside the chip vocabulary when the config holds one' and 'reports chips that are not a list of strings' -> validate-shapes 'reports a chip that is not text, and one outside the vocabulary' and 'reports a list field holding a number, ... a chip list that is a map'
 - 'reports a collection entry status outside the status vocabulary' -> validate-shapes 'reads a collection entry whose title is a number and whose status is not a known word'
 - 'reports a funding entry that has neither a key nor a title' and 'reports a funding scheme whose funder names no organisation' -> validate-shapes 'reads the fields of a person, an organisation, a funding scheme and a joint-work entry'
 - 'reports a collection file whose schema is not a list of field maps' -> validate-shapes 'reports a collection schema that is not a list of maps naming a field and a type'
 - 'reports every affiliations key that names no organisation', 'reports an organisation kind outside the five words', 'reports a joint-work entry with no person and one whose person is unknown' -> same validate-shapes test
 - 'reports a venue word off the venue list...' and 'reports a dataset word off the dataset list...' -> validate-shapes 'passes over a theme list that is text, and reports each theme word off its list'
 Kept in validate.test.ts because they reach branches validate-shapes does not: funding awarded/contributing/planned statement test, affiliation retired key, self counts, cross-list themes.
tests/data/snapshot/normalise.test.ts: label; deleted 'carries a conference call off the venue registry, by its date and by its month' (held by 'fills the registry entities, hpc_path and retrieval included', which compares the whole bspc entity), 'knows a funding scheme by its title when it has no key' (its Object.keys assertion is repeated in 'carries the funding file as a collection as well as a registry'), 'survives the JSON round trip like the rest of the snapshot' in the schema describe (the whole-snapshot round trip in 'normalise, the wire' covers collections.data.schema and collections.venues.schema). Judgment call: 'takes the version from the caller' and 'carries the findings it was given' kept; they are copies of an argument into the output, but nothing else asserts that the findings and the version reach the wire.
tests/data/sources/agents-catalog.test.ts: label; 'seeds the composer with both agents, their pickers and no finding' kept as 'reads with no finding' (loses the assertions of the agent names, picker keys and the cache file name, which pin shipped config values). EDIT TO EXISTING ASSERTION: before = findings [] + agent names ['claude','codex'] + picker keys + codexModel.cache === 'models_cache.json'; after = findings [].
tests/data/sources/career.test.ts: label; deleted 'reports a file that is not a map of keys' (its input '- a list' is now a row of 'reading a career file of the wrong shape', which asserts the same message and the file), 'answers null for a hub with no career file' (normalise.test.ts 'answers null for no file'), 'reports the one host whose status is outside the vocabulary' and 'names the career file in the finding' (validate-shapes 'reads each host row of the career file by its own shape' asserts the finding, its key and its file '/hub/career.yml').
tests/data/sources/collections.test.ts: label; deleted 'reports a file that parses to something other than a map' (now the row '- one\n- two\n' of the wrong-shape table), 'reports an entries key that is not a list, and keeps the meta it did read' (held by 'reads an entry list that is a map as one finding and no entries', which also asserts the meta), 'reports an entry that is not a map and keeps the entries around it' (held by 'hands a map item on with its fields and provenance and reports a list item').
tests/data/sources/docs.test.ts: label; deleted 'marks future NOTES and DIARY entries from their labels alone' (mutates PROJECT_DOCS to exercise a document kind that does not exist; no user relies on it), 'marks none of the four human, and gives no document any other mark' (pins the constant false and the key list of the type), 'reports the mtime a later write gave a document' (the sibling test reads the same field from the file), 'reads an empty block as no keys' (held by 'splits an empty block and a block closed by three dots'), 'reports a frontmatter block that is not a map' (its input is now a row of the wrong-shape table). 'reports every name in the fixed order, present or not' retitled 'gives each document its path, present or not' and loses two assertions (docs equal PROJECT_DOCS, which compares the constant to itself, and the label list ['README','CODE','PDF','TEX'], a constant).
tests/data/sources/feeds.test.ts: label only; read in full, kept whole.
tests/data/sources/manifests.test.ts: label only; read in full, kept whole.
tests/data/sources/registries.test.ts: label only; read in full, kept whole.
tests/data/sources/present.test.ts: label; deleted 'reports an entry with no kind, an unknown kind, and a ref that is missing' (every one of its five messages is asserted by 'names an order entry that is not a map, has no kind, or names a kind or ref wrongly'); the equation 'reads equation: %s as no equation' table folded into the 'draws no equation and reports nothing' table (rows equation: 3, [a, b], { a: 1 }); equationIsImage two loops -> two it.each tables (7 and 5 rows).
tests/data/sources/personal.test.ts: label; retitled 'audits that a folder named like an object key is an ordinary id' to 'reads a folder named like an object key as an ordinary id' (a kept test; guards a folder __proto__ read as an ordinary id with a plain-object entity map); deleted 'the six drafted manifests' describe with DRAFTS (it reads private draft manifests of six repositories: no behaviour beyond what 'the roots' and 'the fields of a manifest' hold), 'is a 70 KiB manifest refused' (held by 'is named for a file over the size bound, and a file at the bound is read'), 'draws a link list of one text without a finding' (held by 'reads the five fields', which reads two texts with no finding), 'falls back to the root key for a root without a title' (held at the lower level by sideProject 'is the same reading for both sources: the repository takes the key as its fallback title'); 44 tests.
tests/data/sources/config/calendar-config.test.ts: head rewritten to the loadLocal rows only; deleted the 'calendarSettings' describe; removed the made[]/afterEach rmSync cleanup (scratchDir sweeps its own directories).
tests/data/sources/config/mail-config.test.ts: same: deleted the 'mailSettings' describe; made[]/afterEach removed; head rewritten.
tests/data/sources/config/settings.test.ts: label; deleted 'reads the shipped keys from config/behavior.yml: no formatter, every program on PATH' (pins shipped latex values), 'answers the map it was given' (usageTiers pass-through), 'reads the shipped list from config/behavior.yml, which is the default its catalog entry holds' (pins the shipped processes list). EDIT TO EXISTING ASSERTION: in 'refuses the shipped configuration whose behavior.yml was saved unparseable, as the merge reports it' the last statement group (removing processes from the shipped config and expecting the shipped list ['python3','codex','claude','node','latexmk']) is removed; the default-from-catalog branch is held by 'reads the default list the options catalog holds when processes: is missing'.
tests/data/helpers/files/opens-in-program.test.ts: also deleted 'is required at server start, naming the key when it is missing or mistyped' (settings.test.ts 'openSettings' refuses the same shapes and reads the extensions lowercased).
tests/data/sources/config/catalogs.test.ts: label only; read in full, kept whole. tests/data/helpers/editor-options.test.ts: also deleted 'draws no finding' (behaviorFindings over a usable paint limit; held by catalogs.test.ts 'reports nothing for a usable paint limit').
tests/data/sources/config/languages.test.ts: label; deleted 'reports nothing for the checked-in map' (tests/data/helpers/files/languages.test.ts 'names every language the code window registers and no other, and drops nothing' asserts drops [] for the same file, and the findings are those drops). tests/data/sources/config/rail.test.ts: label only; kept whole.
tests/data/sources/config/local.test.ts: label; 11 rows added to the checkLocal table (calendars[0] map, calendars label missing and escape, calendars repeat for google, calendar_dir 7, mail[0] map, mail provider fastmail, mail label missing and escape, mail repeat for google, mail_dir 7), taken from the loadLocal throws cases of calendar-config.test.ts and mail-config.test.ts.
tests/data/sources/config/calendar-config.test.ts and mail-config.test.ts: the 'throws "<sentence>"' loops (7 calendar, 8 mail cases) deleted; every sentence is now a row of checkLocal in local.test.ts (loadLocal throws checkLocal's sentence: 'throws the sentence of a key of the wrong type, naming the file'). Heads rewritten again.
tests/data/sources/config/merge.test.ts: label; 3 'skips an own __proto__ key ...' tests folded into one 5-row table (old titles: 'skips an own __proto__ key at every level' (2 expects), 'skips an own __proto__ key holding text', 'skips an own __proto__ key holding text or a number below the top' (2 expects)); deleted 'answers the map it was given when the __proto__ key holds text' (usageTiers pass-through, identity assertion).
tests/data/sources/config/catalog/agents.test.ts: label only; kept whole. tests/data/sources/agents-catalog.test.ts: also deleted 'reads a list or a map holding one, each model by its slug and its display name' (cacheModels is held by tests/data/sources/config/catalog/agents.test.ts, which covers a list, a map, slug/id/model, display names and the invalid inputs).
tests/data/sources/config/catalog/options.test.ts: label; deleted 'answers the map it was given, whatever it holds' (catalogOf identity, a pass-through); 6 kept.
tests/data/real-hub.probe.ts: read, kept unchanged, never run.
(tests/data sweep complete; npx vitest run tests/data passes.)
tests/checks/tree/size.test.ts: label 'Layer 4, tree check.'; head sentence at :10-11 says the verification list runs no size command, so this test is what runs utils/size-check.sh; the case at :134 is titled 'runs utils/size-check.sh, which only this test runs, and reports nothing over the tree as it stands' and loses its assertion over the script's text (expect(command).toContain('size-allow.txt')) and the read of the script text; the unused exports parseAllow and findOversize are no longer exported (nothing imports them).

### checks/tree/duplication.test.ts
Read in full (608 lines). Planted-fixture cases each hold a different outcome (threshold, import list, script/markup/style split, comment tolerance, mark, listing, group split, extent, same-file); none folds or duplicates another, all kept. Label "Layer 4, tree check." Removed `export` from Pair, markOf, DELIBERATE, readHeld, HELD, copies, findCopies, sharedPairs (no importer: grep "from '.*duplication" prints nothing).
Cause of new clones: writeLocal/scratch helpers in config/calendar-config + mail-config + checks/config/config.test.ts. Fixed in calendar-config.test.ts and mail-config.test.ts with `engineWith(body)` over plantScratch (writeLocal, scratch, fs imports removed); config.test.ts keeps its own writeLocal (used 20+ times with reused dirs).
allow-duplication.txt: removed (original lines) 26 (config.test.ts|calendar-config 1cbbb41f5894), 34, 35, 36 (calendar-config|mail-config), 47 (routes/git/deposit|git f31327bb8175). STALE and outside the permitted lines, named for the orchestrator: original line 37 (calendar-config.test.ts|server/accounts/calendar/poll.test.ts 1c224db4bd3b) and original line 40 (routes/docs/memories.test.ts|server/content/images.test.ts 505416a28794). Both clones ended by this sweep (calendar-config no longer holds the scratch/writeLocal lines; memories.test.ts lost its made[]/scratch helper). duplication.test.ts 'holds the lists to clones that are still shared' stays red on exactly these two until those two lines are removed.

### checks/tree/negatives.test.ts, allow-negatives.ts
Read in full. 10 planted cases each hold a distinct outcome (four shapes, either comment shape, restatement, two-string line, one entry per absence, no-literal keys, stale entry, allow-list files, star line, two-line reason); none removed. Edited: label "Layer 4, tree check."; `export` removed from explains, commentAbove, absenceKey, bareAbsences, findGrowth (no importer, grep over tests src utils); made[] + afterEach(rm) removed (scratch.ts fixture sweeps). allow-negatives.ts unchanged (helper data, in use).

### checks/tree/scratch.test.ts
Read in full (751 lines). Every planted case holds a distinct outcome or a distinct revert named in its comment; none removed or folded. Edited: label 'Layer 4, tree check.'; export removed from vitestNames, findUnswept, findOwnScratch (no importer).

### checks/tree/boundaries.test.ts
Read in full (653 lines). Layer table and rules untouched. Planted cases distinct, kept. Edited: label added ('Layer 4, tree check.'); export removed from findViolations, findGlobalState, findShellStores, primitiveClasses, findPrimitiveStyling (no importer); made[]/afterEach/scratch wrapper removed (scratchDir used directly); two isReason('x')/true assertions deleted from 'holds every styling entry to a reason' (same two assertions are in duplication.test.ts and are the explains() cases of negatives.test.ts). The same pair deleted from duplication.test.ts 'holds every entry of both lists to a reason'; negatives.test.ts explains() cases ('it is closed' false, long reason true) hold isReason.

### checks/config/config-folder.test.ts
Read in full. Standard applied: an assertion that states a consistency rule over the shipped config (a key in one file, a reference that resolves, an entry that is valid) stays; an assertion that pins a shipped value (a list, a label, a path) goes (spec.md:57).
Deleted tests (6): 'reads the venue and dataset theme words into the vocabulary validate checks' (pins venue_themes/data_themes lists; reader held by data/portfolio-config.test.ts 'reads the vocabulary lists of a well-formed config'), 'leaves the theme lists absent when the config holds none, or none with a key' (same branch as data/portfolio-config.test.ts 'reads each key of the wrong type as absent', venue_themes: {a:1}, data_themes: 7), 'names the six research tiers and the side-projects folder' (pins scan; optional/nested read held by portfolio-config.test.ts), 'holds the cross-link exclusions and independent collection lane tones' (pins archive_dead, lane tones, usage tiers, refresh values, notes), 'names the wallpaper directory owned by oculus' (pins one value), 'resolves a drawing through the package rather than through a path into node_modules' (source text of catalogs.ts plus an iconSet case 'ships a drawing for every one of them' already gives).
Edits to kept tests (assertion lost): 'reads one catalog file per owner...' lost the four text['...'] assertions (catalog strings); roots test lost the key list pin and is retitled 'reads the roots of sources.yml without a finding'; 'names a group of its own and a path under the hub for every document' lost the three-path list; 'keys every catalogue group by the rail page...' lost groups.views.label 'System' and groups.help.label 'Help'; 'gives every group a chord and a glyph...' lost the eleven-letter chord list (distinctness, chorded, glyph, not-bound assertions stay); 'reads each file on its own...' lost the CATALOG_FILES loop (same assertion is in 'reads one catalog file per owner').
Label 'Layer 4, tree check.'; head re-wrapped to 100 columns; unused portfolioConfigFrom import removed.

### checks/config/config.test.ts
Read in full. The file holds unit tests of the config readers (loadLocal, checkLocal, configDir, loadConfig, behaviorFindings, themeFindings, vocabCatalog); the lowest holder of loadLocal/checkLocal is tests/data/sources/config/local.test.ts (checkLocal rows, 'reads each key it holds', 'answers the defaults', 'throws the sentence', the path-key table). Label per brief 'Layer 4, tree check.' (judgment call to name: the file is readers' unit tests in a checks folder, 5 of its describes are not tree checks).
Deleted: loadLocal 'falls back to the defaults when there is no file' (local.test 'answers the defaults'), 'takes both keys from the file' ('reads each key it holds'), 'resolves a relative hub against the engine directory rather than the config folder' (hub: ../hub row), 'refuses a port that is not an integer' (port rows), 'takes the two session paths when the machine names them' (path-key table; sessions_* go through the same filledAt loop, src/lib/data/sources/config/local.ts:316), 'takes the Claude binary used by update-task terminals' (claude_bin in 'reads each key'), 'refuses a session path that is not a path' (path rows), 'takes usage accounts and expands home-relative config folders' (accounts in 'reads each key'), 'refuses an account with an unknown tool' (row), 'refuses colliding Claude labels %s and %s' (it.each 2 rows; row 'A b' vs 'a-b'); checkLocal 'names the file and the rule for every value the reader would throw over' (all 19 bodies are rows or same-branch path keys), 'gives a body that is not YAML by one line, and takes the name it is asked for' ('gives the first line of a parse error', 'names the file it is given'), 'is the rule loadLocal reads by, so an accepted body is read and a refused one throws' (both sides are rows); configDir 'is the config folder of the engine it is given' (join pass-through); loadConfig 'audit: reports code_theme defined in two files like any other key' (an audit by its own comment: same branch as 'reports a top-level key two files define').
Kept test reduced: checkLocal 'accepts a body the reader would read, and says nothing about an unknown key' -> 'says nothing, and prints nothing, about an unknown key' (the accepted-body rows are in local.test.ts 'answers null for the readable text'). Edits to existing assertions: 'names a sentence file that does not parse...' lost `expect(textCatalog(config)['app.chat']).toBe('Chat')` (catalog string) and its comment is corrected; 'accepts distinct Claude labels...' lost the try/finally rmSync (scratch fixture sweeps). describe 'configDir' renamed 'the config folder of an engine' (configDir import removed, its remaining cases use engineRoot, rootsFile, layoutFile and loadConfig).

### checks/config/integrity.test.ts
Read in full. Real-hub gate kept: 'validates with no findings', 'holds exactly what a second count of the tree finds', side projects, JSON round trip, front-matter slide floor, equations vs second count, deck order resolves, planted count of written equations.
Deleted (4): 'reads the config with no findings' (same call and assertion as config-folder.test.ts 'merges without a finding, so no key is defined in two files'), 'names the nine lanes and the holding backlog as what a focus may be' (pins config.vocab.lanes), 'reads the covert-theory slide with its diagram panel and its equation' (pins one project of the hub; diagram panels are held by tests/data/sources/present.test.ts:97-99, equations by 'reads an equation out of every slide that writes one'), 'prints every link, url and folder value of the hub whose first segment is host-shaped' (its own comment: "A report, not a check"; asserts only that the walk found a value; spec.md item 1: a measurement that asserts nothing a user relies on). The PATH_KEYS constant and the collection.ts imports went with it. Label 'Layer 4, tree check.' added to the head.

### checks/config/options-walk.test.ts DELETED
Read in full. optionPaths/catalogOf are data functions whose holder is tests/data/sources/config/catalog/options.test.ts. Deleted as same outcome through the same branch as that holder: 'walks a flow map to its leaves', 'returns a three-segment path whole', 'stops at a family and returns its own path', 'gives a list of scalars and a list of records their own path', 'gives an empty map, an empty list and a bare key their own path', 'gives a file that is empty, null or a list no paths', catalogOf 'gives an empty catalog where the key is missing or is not a map'; catalogOf 'reads the options key of the merged config' deleted as an identity pass-through. MOVED into the holder (two outcomes the holder lacked): 'returns a path once for each key that gives it' and 'is not misled by a reserved name of objects as an entry or as a key'. tests/checks/config now holds 5 items.

### checks/config/options-catalog.test.ts, options-findings.ts
Read in full. options-catalog.test.ts: deleted 'accepts an empty list as a family and as a list' (runs the same sound() fixture as the case above it; its extra expects assert the fixture's own contents), row 'with a minimum, which no entry has' (same branch and finding as 'with a misspelt field': field not in ENTRY_FIELDS), rows 'an entry that carries a section' and 'an entry that carries fields' of the machine-local keys (same branch as 'an entry that carries a default': field not in LOCAL_ENTRY_FIELDS). Folded 'names an `options` that is a list', 'names a catalog with no `options` key', 'names a catalog that holds one key path twice, which the parser refuses' into one it.each of 3 rows (same finding through `!isMap(config.options)`). Tree-check case over the shipped tree and all other rows kept. Label already 'Layer 4, tree check.'. options-findings.ts: every export has an importer (findingsOf, shown, Entries in options-catalog.test.ts); unchanged.

### checks/diagrams/{counted.ts,tree.ts,parsed.test.ts,diagrams.test.ts}
counted.ts, tree.ts: read in full, every export has an importer (counted: parsed.test.ts, diagrams.test.ts; ENGINE, copyOfTree, CountedCache, parsedSince: diagrams.test.ts), unchanged. parsed.test.ts: read in full; the four cases are the lowest-level holder of the parse reader (Z363 keeps the lowest), unchanged.
diagrams.test.ts: deleted 'reads imports with the one reader the import checks read them with' (`expect(drawnImports).toBe(importsOf)`, a re-export identity, spec.md:57), 'counts no import a comment names, above a type-only import or in a block' (comment handling is the import reader's, held by checks/imports/cycles.test.ts 'reads no runtime import out of a comment above a type-only import'; same branch), 'carries its own grey for a light and a dark viewer outside oculus' (exact stylesheet text and colour values, spec.md:57). Head comment loses "its standalone style", label 'Layer 4, tree check.' added. 856 lines is under the 880-line split threshold. Kept after weighing: layer/channel/write reader cases (each reaches a different branch of the readers), labelsAcross cases, 'has no colour of its own and nothing opaque behind it' (a diagram in a dark theme must stay readable), the edge-title case.

### checks/diagrams/readable.test.ts
Read in full (405 lines). Unchanged. The two reader cases ('read a call between two strings that hold the marks of a comment', 'read a call after a regular expression that holds two slashes') use the same inputs as 'blank the comments of a script and keep its strings and regular expressions' but through channelsDot and writesDot; kept as the one case per wire (the codeOf wire of each reader). The writesDrawn cases each reach a different branch (first port, every port tried, two modules, plain arrow against words, words against words).

### checks/imports/*, export audit of the four folders
augments.test.ts: folded two block cases (above own folder, fills an empty interface) into one it.each of 2 rows, and the three reference-directive cases into one it.each of 3 rows; label 'Layer 4, tree check.'. cycles.test.ts read in full, unchanged (each case a distinct branch of the reader). order.test.ts: six 'holds the X folders' cases folded into one it.each of 6 rows (comments that narrated which module moved were dropped), the `Object.keys(ORDER)` / `Object.keys(INNER)` assertions removed from 'places every folder of every layer' (constants), ORDER/INNER imports removed, label 'Layer 4, tree check.'.
Export audit (script in the scratchpad resolves each import of tests, src, utils to its file and lists exports no file imports): `export` removed from tests/routes/edit/write-fixture.ts (DATA, DECK, HOST, LEADS, RADAR, URL_, VENUES, deckMapOf, logOf, slideProject), tests/routes/sessions/terminal-fixture.ts (shellWord), tests/checks/tree/allow-styling.ts (Styling), tests/checks/source/code.ts (Kind), tests/fixtures/scratch.ts (sweepingOnError), tests/checks/imports/graph.ts (RuntimeImport, target), tests/checks/imports/order.ts (folderOf, foldersOf, ORDER, INNER; utils/diagrams/source.mjs:82 reads `const ORDER` from the text, with or without export). tests/fixtures/sessions-fixture.ts: gitPayload deleted (an identity function nothing called). Heads relabelled 'Layer 4, test helper.' on the changed helpers write-fixture.ts, sessions-fixture.ts, allow-styling.ts, code.ts.

### checks/look/{themes.ts,contrast.test.ts,lane-distance.test.ts}
themes.ts read in full, every export has an importer, unchanged. contrast.test.ts: deleted 'offers seventeen themes' (`NAMES.length` pin) and 'measured every pair of every theme' (prints a total and asserts it is above zero; each theme case already asserts `found.length > 0`); the per-theme loop became an it.each over NAMES; label 'Layer 4, tree check.'. lane-distance.test.ts: deleted 'measures the light theme within 0.01 of the reference differences' and the LIGHT table of 22 pairs (pins the light theme's derived colours; the published-reference case above it holds the metric); per-theme loop became an it.each over NAMES; label 'Layer 4, tree check.'. Kept 'pairs the headers that touch in the layout the view draws' (models the Focus layout the check measures; its lane-name list and counts come from the shipped config, named below as a judgment call).

### checks/source/{add-forms,retired,code}.test.ts
add-forms.test.ts: titles lose "audits" ('is drawn at most once by a component, since a second would type into its draft', 'reads a form the source draws, and an edit form as no add form'); exports entryForms, addsEntry, twoAddForms removed (no importer); label 'Layer 4, tree check.'. The check guards DESIGN.md "Unsaved form input is instance state" (an entry form's typed values keyed by collection and entry id or null for adding), which holds only while a view draws one add form per collection.
retired.test.ts: title 'name no Config view, no Config card and no local.yml card' (loses "audits"), head says it reads the documents for those phrases, label 'Layer 4, tree check.'. Judgment call for Axel: it enforces agents/spec.md:66 (a sentence in a document that a change makes false is a defect) for one retired screen only, through a phrase list over HELP.md, DESIGN.md and README.md; kept, not deleted.
code.test.ts: deleted 'reads a division as code and a trailing comment as a comment' (its own comment: "Audit: no revert of the parse turns this red"); label 'Layer 4, tree check.'.
tree/scratch.test.ts: deleted 'passes a file that plants a directory and takes it from the fixture' (its comment: "no revert of the shipped rule does [turn it red], since passing a clean file is what the rule does by doing nothing"); the other Audit-comment case ('passes a function called while the file loads that only declares a case making one') is kept because making a nested function count as a caller of a maker turns it red.

### checks/source/text.test.ts
Label added. Deleted 'reads the catalog out of the real config directory' (pins app.title 'oculus'), 'holds a dedicated glyph with a stand-in for the three appearance toggles' (pins crt/wallpaper/icons; the all-stand-ins ASCII rule is tests/checks/config/config-folder.test.ts:412). glyph/bracketedGlyph/lookup cases now use a synthetic STAND_INS map instead of the shipped glyphs.yml values (no pin on shipped values); glyphCatalog import removed.

### checks/source/html-sites.test.ts
Label added. Un-exported htmlSites, introTags, isTrusted, attributeOf, isTrustedArgument, looseTrustedIntros, unfilteredSites. Folded isTrustedArgument (3 true rows + 3 false rows) and isTrusted (3 true + 2 false rows) assertion lists into four it.each tables. Real-tree checks (>=34 sites, >=3 trusted Intros, reason length) are kept unchanged (tree check rules; not planted cases).
### checks/source/keys.test.ts
Label added. Un-exported calls, computedFindingKeys, findingLiterals. Planted cases (findingLiterals, calls) are distinct functions: both kept.

### checks/utils (tests of scripts under utils/; labelled "Layer 4, test.")
- cited-lines.test.ts: label 'Layer 4, test.'; made[]/afterEach removed (scratchDir sweeps); readArgs cases quick. Folds: 4 MISSING cases (past end+missing file / blank line / three bad ranges / punctuation) into one it.each of 4 rows 'calls %s MISSING and fails' (old titles: 'calls a line past the end, and a file the tree has not, MISSING and fails'; 'calls a citation that lands on a blank line MISSING'; 'refuses a range that runs backwards, one wider than a screenful, and a number below one'; 'calls a citation landing on a line of punctuation MISSING'); readArgs 6 rows (old: 'reads the root and the report, the last --root winning' 4 assertions; 'names no report for a line that does not read' 2 readArgs assertions + spawn kept as 'prints the usage for a line that does not read'). Head states tagging rule (Decision 3).
- claude-usage.test.ts: label 'Layer 4, test.'; made[]/afterEach removed.
- migrate-joint-work.test.ts: label 'Layer 4, test.'; made[]/afterEach removed.
- outside-paths.test.ts: label 'Layer 4, test.'; made[]/afterEach removed; head states the rule. Deleted 'takes the tokens of a bullet outside its parentheses and none inside them' (Z363: held lower by 'leaves a folder named in prose out of the list...' on entriesOf) and 'takes no folder named in a parenthesis, a clause or a paragraph...' (Z363: the next case 'prints the state/sources/search files...' fails whenever one of those folders is an entry).
- rename-pillar.test.ts: label 'Layer 4, test.'; deleted the describe 'the rename the script carries' with its one case 'is the one the reader reports a manifest under the old key for' and the `RENAMED_FIELDS` import: the base asserted `RENAMED_FIELDS` equal to `{ program: 'pillar' }` and `{ from, to }` equal to `{ from: 'program', to: 'pillar' }`, two pins of a constant (spec.md:57), and `theRename()` takes `from` and `to` from `Object.entries(RENAMED_FIELDS)[0]` (utils/migrations/rename-program-to-pillar.ts:82), so a relation between `RENAMED_FIELDS`, `from` and `to` holds for any content of the map; rootsOf 5 assertions folded into it.each of 5 rows (tests/checks/utils/rename-pillar.test.ts:108-115).
### checks/source/ remaining: history.test.ts read whole, kept (3), head unchanged.


The tag of each file above is in the 'Tags' section, which lists every tag site of the final tree with its basis.

## Folds

Each table below is a table of the final tree that holds folded cases: a `it.each` or `test.each` template that is not in the base copy of its file, or one that gained rows. Under each, every old title of the base copy it replaces, mapped to its row or rows; tests that are not rows of a table are not listed. The row titles are those the verbose run prints, and the last line of each entry says the rows passed in `npx vitest run tests/routes tests/data tests/checks --testTimeout 0 --hookTimeout 0 --reporter=json`. The text is written by hand in `folds_hand.txt` of the session scratchpad and checked by a script that every old title exists in the base copy and every row in the final tree: 89 tables, 563 rows, 201 old titles mapped, 0 rows not passed.

#### `checks/config/options-catalog.test.ts`: names %s as missing or not a map of config file names (line 554, 3 rows)

- "names an `options` that is a list" -> row "an `options` that is a list"
- "names a catalog with no `options` key" -> row "a catalog with no `options` key"
- "names a catalog that holds one key path twice, which the parser refuses" -> row "a catalog that holds one key path twice, which the parser refuses"
- Run of all 3 rows: all passed

#### `checks/imports/augments.test.ts`: is named for %s (line 37, 2 rows)

- "is named for a block that adds to a module of a folder above its own" -> row "a block that adds to a module of a folder above its own"
- "is named for a block that fills an empty interface a module below declares" -> row "a block that fills an empty interface a module below declares"
- Run of all 2 rows: all passed

#### `checks/imports/augments.test.ts`: is named for %s (line 71, 3 rows)

- "is named for a reference directive to a module of the tree" -> row "a reference directive to a module of the tree, written either way"
- "is named for a reference directive with preserve before its path" -> row "a reference directive with preserve before its path"
- "is named for a reference directive with resolution-mode before its path" -> row "a reference directive with resolution-mode before its path"
- Run of all 3 rows: all passed

#### `checks/source/html-sites.test.ts`: takes %s as the catalog own words (line 256, 3 rows)

- "refuses an Intro marked trusted over words that interpolate a value" -> row "a catalog key" ; row "a catalog key through inline Markdown" ; row "a catalog key with literal arguments"
- Run of all 3 rows: all passed

#### `checks/source/html-sites.test.ts`: refuses an Intro marked trusted over %s (line 264, 3 rows)

- "refuses an Intro marked trusted over words that interpolate a value" -> row "a value among the arguments" ; row "two catalog lines joined" ; row "a value in place of a key"
- Run of all 3 rows: all passed

#### `checks/source/html-sites.test.ts`: judges %s by its words rather than skipping the site (line 272, 3 rows)

- "judges a trusted prop set to an expression by its words rather than skipping the site" -> row "the bare attribute" ; row "the attribute set to true" ; row "the attribute set to a variable"
- Run of all 3 rows: all passed

#### `checks/source/html-sites.test.ts`: does not read %s as trusted (line 280, 2 rows)

- "judges a trusted prop set to an expression by its words rather than skipping the site" -> row "no attribute" ; row "an attribute that only ends in the word"
- Run of all 2 rows: all passed

#### `checks/utils/cited-lines.test.ts`: calls %s MISSING and fails (line 61, 4 rows)

- "calls a line past the end, and a file the tree has not, MISSING and fails" -> row "a line past the end and a file the tree has not"
- "calls a citation that lands on a blank line MISSING" -> row "a line after the last"
- "refuses a range that runs backwards, one wider than a screenful, and a number below one" -> row "a range that is too wide, one that runs backwards and a number below one"
- "calls a citation landing on a line of punctuation MISSING" -> row "a line of punctuation"
- Run of all 4 rows: all passed

#### `checks/utils/cited-lines.test.ts`: reads %s (line 128, 6 rows)

- "reads the root and the report, the last --root winning" -> row "the root and the report" ; row "the last --root winning" ; row "a report alone" ; row "no arguments"
- "names no report for a line that does not read, so the usage is printed" -> row "a --root with no value, as no report" ; row "an unknown flag, as no report"
- Run of all 6 rows: all passed

#### `checks/utils/rename-pillar.test.ts`: is %s (line 108, 5 rows)

- "is every root it names, null for none and for a flag, and a word after -- as a root" -> row "every root it names" ; row "null for none" ; row "null for a flag before a root" ; row "null for a short flag" ; row "a word after -- as a root"
- Run of all 5 rows: all passed

#### `data/accounts/connect.test.ts`: takes %s as %s (line 14, 7 rows)

- "is refused for an unknown provider, a label of the wrong shape and a label taken" -> row "an unknown provider" ; row "a label with a capital" ; row "a label that climbs" ; row "a label taken under the provider" ; row "the same label under the other provider"
- "takes a published link on a calendar and refuses it on the mail" -> row "a published link on a calendar" ; row "a published link on the mail"
- Run of all 7 rows: all passed

#### `data/accounts/connect.test.ts`: answers %s with the refusal or the half it names (line 28, 7 rows)

- "takes a Google id only on googleusercontent.com, and a secret with no space" -> row "a Google id off googleusercontent.com" ; row "a Google secret with a space" ; row "a Google id and secret with stray whitespace"
- "takes a Microsoft id and an optional tenant only as GUIDs" -> row "a Microsoft id that is no GUID" ; row "a Microsoft tenant that is no GUID" ; row "a Microsoft tenant left empty" ; row "a Microsoft tenant that is a GUID"
- Run of all 7 rows: all passed

#### `data/file-ops.test.ts`: makes %s as the segments it names (line 19, 10 rows)

- "makes the folders between and drops an empty segment, as case 2 creates them" -> row "folders between" ; row "a backslash as a slash" ; row "an empty segment dropped" ; row "a trailing slash" ; row "a trailing backslash"
- "takes a segment of 255 characters of any width and trims the tabs at the ends of the name" -> row "255 characters" ; row "128 two-byte characters" ; row "100 wide characters" ; row "255 wide characters" ; row "tabs trimmed at the ends"
- Run of all 10 rows: all passed

#### `data/file-ops.test.ts`: refuses %s as %s (line 46, 17 rows)

- "refuses an empty name, whitespace and a name of tabs" -> row "an empty name" ; row "whitespace" ; row "a name of tabs" ; row "a slash alone"
- "refuses a leading slash of either kind" -> row "a leading slash" ; row "a leading backslash"
- "refuses a `.` or `..` segment wherever it sits, so no segment walks out" -> row "a dot" ; row "a double dot" ; row "a double dot first" ; row "double dots between" ; row "a dot between" ; row "a double dot between backslashes"
- "refuses a NUL, a segment of only whitespace and a segment of 256 characters" -> row "a NUL" ; row "a segment of only whitespace" ; row "256 characters" ; row "256 two-byte characters" ; row "256 wide characters"
- Run of all 17 rows: all passed

#### `data/file-ops.test.ts`: takes %s as %s (line 76, 10 rows)

- "adds `copy`, then `copy 2`, then `copy 3`, keeping the extension" -> row "copy" ; row "copy 2" ; row "the next free number"
- "names a folder, a file with no extension and a dotfile" -> row "a folder" ; row "a file with no extension" ; row "a dotfile" ; row "a folder with a dot"
- "keeps a name that is free" -> row "a free name kept"
- "counts on from a copy that is copied" -> row "a copy copied" ; row "a numbered copy copied"
- Run of all 10 rows: all passed

#### `data/file-ops.test.ts`: %s of %s (line 105, 4 rows)

- "stops before the extension, and takes the whole of a dotfile and of a name without one" -> row "stops before the extension" ; row "stops before the last extension" ; row "takes the whole of a dotfile" ; row "takes the whole of a name without an extension"
- Run of all 4 rows: all passed

#### `data/helpers/dates.test.ts`: reads %s as the count and unit it names (line 15, 15 rows)

- "is now under a minute, then the largest unit that fits" -> row "30 seconds" ; row "5 minutes" ; row "1 hour" ; row "1 month" ; row "2 years"
- "stops at the largest unit it is asked for" -> row "14 days up to days" ; row "2 weeks" ; row "3 hours up to days" ; row "3 days up to days" ; row "12 months up to months"
- "is now for a clock up to a minute ahead, and nothing further ahead" -> row "a clock 20 seconds ahead" ; row "a clock 5 minutes ahead"
- "is nothing for a stamp it cannot read" -> row "text that is no time" ; row "an empty stamp" ; row "no stamp"
- Run of all 15 rows: all passed

#### `data/helpers/dates.test.ts`: writes the local day of %s (line 37, 3 rows)

- "writes the local day of a Date and of a timestamp alike" -> row "a Date late in the day" ; row "a timestamp late in the day" ; row "a Date just after midnight"
- Run of all 3 rows: all passed

#### `data/helpers/editor-options.test.ts`: is a finding when it is %s (line 109, 2 rows)

- "is a finding when it is not a map" -> row "a list" ; row "text"
- Run of all 2 rows: all passed

#### `data/helpers/editor-options.test.ts`: names %s (line 190, 3 rows)

- "names a field the record does not have, and a record that is not a map" -> row "a field the record does not have" ; row "a record that is a list" ; row "a record that is a number"
- Run of all 3 rows: all passed

#### `data/helpers/editor-options.test.ts`: does not read a languages that is %s (line 267, 2 rows)

- "does not read a languages that is not a map" -> row "a list" ; row "text"
- Run of all 2 rows: all passed

#### `data/helpers/editor.test.ts`: reads %s as %j bytes (line 9, 10 rows)

- "is null for a block that is missing, of the wrong shape, or not a size" -> row "a missing block" ; row "a block that is text" ; row "a block that is a list" ; row "an empty block" ; row "a size in text" ; row "a size of zero" ; row "a negative size" ; row "a size that is not a number"
- "reads %j as %j" -> row "a size in text" ; row "a size of zero" ; row "a size that is not a number" ; row "an infinite size" ; row "a size with a fraction"
- Run of all 10 rows: all passed

#### `data/helpers/editor.test.ts`: throws naming the key when it is required and there is %s (line 25, 2 rows)

- "throws naming the key when it is required and the configuration has no usable one" -> row "a missing block" ; row "a size of zero"
- Run of all 2 rows: all passed

#### `data/helpers/files/opens-in-program.test.ts`: names none of the checked-in applications for %s (line 28, 10 rows)

- "names none for a double extension, a type off the map, a name with no extension and a dotfile" -> row "report.docx.command" ; row "bundle.zip" ; row "meeting.ics" ; row "person.vcf" ; row "screen.vncloc" ; row "profile.mobileconfig" ; row "flow.shortcut" ; row "draft.odt" ; row "reproduce" ; row ".docx"
- Run of all 10 rows: all passed

#### `data/helpers/files/opens-in-program.test.ts`: reads %s (line 43, 4 rows)

- "names none for a key an object inherits, and none under an empty map" -> row "a key an object inherits" ; row "the key __proto__" ; row "an empty map" ; row "an upper-case extension"
- Run of all 4 rows: all passed

#### `data/helpers/files/opens-in-program.test.ts`: tells %s by its shape (line 59, 6 rows)

- "tells a bundle id by its shape" -> row "a bundle id of an application" ; row "a bundle id with a capital word" ; row "a name with no dots" ; row "an option for the open command" ; row "an empty segment" ; row "an id followed by a path"
- Run of all 6 rows: all passed

#### `data/helpers/files/opens-in-program.test.ts`: reads %s (line 72, 11 rows)

- "reads the extensions lowercased, and null for a missing or mistyped map" -> row "extensions in capitals" ; row "a missing block" ; row "a map that is a list" ; row "an extension without a dot" ; row "a double extension" ; row "a value that is no bundle id" ; row "a value that is a number" ; row "an empty map"
- "answers null for %j" -> row "a missing block" ; row "a block that is a list" ; row "a map that is a list" ; row "an extension without a dot" ; row "a value that is a number" ; row "a valid extension beside one without a dot" ; row "the key __proto__"
- "answers the extensions lowercased, and an empty map for an empty one" -> row "extensions in capitals" ; row "an empty map"
- Run of all 11 rows: all passed

#### `data/helpers/files/paths.test.ts`: names %s by its last non-empty segment (line 21, 4 rows)

- "is the last non-empty segment" -> row "a folder with a trailing slash" ; row "a bare name" ; row "an empty path" ; row "an absolute path"
- Run of all 4 rows: all passed

#### `data/helpers/files/paths.test.ts`: drops %s and keeps the root (line 32, 4 rows)

- "drops the trailing slashes and keeps the root" -> row "one trailing slash" ; row "two trailing slashes" ; row "none" ; row "the root"
- Run of all 4 rows: all passed

#### `data/helpers/files/paths.test.ts`: joins by one slash for %s (line 43, 6 rows)

- "joins by one slash, the root folder and a trailing slash included" -> row "the root folder" ; row "a folder with a trailing slash" ; row "a folder with a nested path"
- "is the folder itself for an empty path" -> row "an empty path" ; row "an empty path under a trailing slash" ; row "an empty path under the root folder"
- Run of all 6 rows: all passed

#### `data/helpers/files/paths.test.ts`: reads %s as its path below the folder or null (line 56, 10 rows)

- "is the path below the folder, or empty for the folder itself" -> row "a target below the folder" ; row "the folder itself" ; row "the folder with a trailing slash"
- "is null outside the folder, a sibling sharing the prefix included" -> row "a sibling sharing the prefix" ; row "a target above the folder"
- "is null for every target when the folder is empty" -> row "a target when the folder is empty" ; row "the root when the folder is empty" ; row "an empty target when the folder is empty"
- "holds everything absolute under the root folder" -> row "a target below the root folder" ; row "the root folder itself"
- Run of all 10 rows: all passed

#### `data/helpers/files/paths.test.ts`: picks %s for the folder that holds the target most deeply (line 75, 2 rows)

- "picks the item whose folder holds the target most deeply" -> row "the deeper folder" ; row "the shallower folder"
- Run of all 2 rows: all passed

#### `data/helpers/files/text-kind.test.ts`: reads %s as text (line 18, 5 rows)

- "reads plain text, an empty file and accented letters as text" -> row "an empty file" ; row "plain text" ; row "accented letters" ; row "a tab and a return"
- "reads a file opening with a byte order mark as text" -> row "a file opening with a byte order mark"
- Run of all 5 rows: all passed

#### `data/helpers/files/text-kind.test.ts`: reads %s as not text (line 31, 12 rows)

- "reads a file with a zero byte anywhere in the window as not text" -> row "a zero byte in the middle of the window" ; row "a single zero byte"
- "reads a NUL byte as not text" -> row "a zero byte in the middle of the window"
- "reads the heads of the archives a research tree holds as not text" -> row "the head of a PNG" ; row "the head of a ZIP, which a .npz is" ; row "the head of a gzip file"
- "refuses bytes that are not UTF-8, however few of them there are" -> row "a lone continuation byte" ; row "a lead byte with nothing after it" ; row "an overlong encoding of a character with a shorter form" ; row "an overlong three-byte encoding" ; row "a surrogate half" ; row "a value past the last code point"
- "reads UTF-8 as text and a byte no UTF-8 holds as not" -> row "a byte no UTF-8 holds". the text half (the bytes of 'cafe' with an e acute) is read through the row 'accented letters' of the text table, which holds the same property with other bytes
- Run of all 12 rows: all passed

#### `data/helpers/finding-text.test.ts`: fills %s (line 16, 5 rows)

- "puts each argument at its position, as often as the template names it" -> row "each argument at its position, as often as the template names it" ; row "a number"
- "leaves a placeholder with no argument as it is written" -> row "a placeholder with no argument" ; row "a word or nothing in braces"
- "reads an argument that is the empty string as an argument" -> row "an argument that is the empty string"
- Run of all 5 rows: all passed

#### `data/helpers/finding-text.test.ts`: answers the catalog sentence for %s with the arguments in place (line 38, 4 rows)

- "answers the catalog sentence with its arguments in place" -> row "two arguments" ; row "an argument named twice" ; row "no argument" ; row "a missing argument"
- Run of all 4 rows: all passed

#### `data/helpers/finding-text.test.ts`: answers the key followed by its arguments for %s, a key the catalog lacks, and never throws (line 55, 4 rows)

- "answers the key followed by its arguments when the catalog lacks the key, and never throws" -> row "one argument" ; row "three arguments, one a number" ; row "no argument" ; row "a name inherited from Object"
- Run of all 4 rows: all passed

#### `data/helpers/guards.test.ts`: answers %s with %s (line 27, 9 rows)

- "holds for a map, empty or not" -> row "an empty map" ; row "a map"
- "does not hold for null, a list, or anything not an object" -> row "null" ; row "an empty list" ; row "a list of maps" ; row "undefined" ; row "a number" ; row "a string" ; row "a boolean"
- Run of all 9 rows: all passed

#### `data/helpers/guards.test.ts`: reads %s as the string or nothing (line 43, 9 rows)

- "is the value when it is a string, the empty string included" -> row "a string" ; row "the empty string" ; row "a string with spaces, untrimmed"
- "is undefined for a number, a boolean, null, a list and a map" -> row "a number" ; row "a boolean" ; row "null" ; row "undefined" ; row "a list" ; row "a map"
- Run of all 9 rows: all passed

#### `data/helpers/guards.test.ts`: reads %s as the string or the fallback (line 59, 7 rows)

- "is the string, and the fallback for everything else" -> row "a string" ; row "null" ; row "a number" ; row "a list" ; row "the empty string, which is a string". the assertion on the empty string without a fallback is read through the row 'the empty string, which is a string', which names a fallback and expects the empty string
- "takes the fallback the caller names" -> row "null with a fallback named" ; row "a number with a fallback named" ; row "the empty string, which is a string"
- Run of all 7 rows: all passed

#### `data/helpers/guards.test.ts`: keeps %s (line 73, 9 rows)

- "keeps the string items of a list, in order" -> row "the string items in order" ; row "an empty list" ; row "an empty string item"
- "drops the items of a list that are not strings" -> row "items that are not strings"
- "has nothing for a value that is not a list" -> row "null" ; row "undefined" ; row "a string" ; row "a number" ; row "a map"
- Run of all 9 rows: all passed

#### `data/helpers/guards.test.ts`: is an empty map for %s (line 94, 5 rows)

- "is an empty map for null, a list, a string and everything else" -> row "null" ; row "undefined" ; row "a list" ; row "a string" ; row "a number"
- Run of all 5 rows: all passed

#### `data/helpers/guards.test.ts`: writes %s out as its text or the fallback (line 106, 13 rows)

- "is the string, and writes a number or a boolean out" -> row "a string" ; row "the empty string" ; row "a number" ; row "zero, whatever the fallback" ; row "true" ; row "false"
- "is the fallback for null, undefined, a map and a list" -> row "null" ; row "undefined" ; row "a map" ; row "a list" ; row "null with a fallback named" ; row "a map with a fallback named" ; row "a list with a fallback named" ; row "zero, whatever the fallback" ; row "the empty string"
- Run of all 13 rows: all passed

#### `data/helpers/guards.test.ts`: reads %s of a list of two (line 138, 4 rows)

- "is the item at a position the list holds" -> row "the first position" ; row "the last position"
- "is undefined past the end and for a negative position, which is no item from the end" -> row "a position past the end" ; row "a negative position, which counts from nowhere". the third assertion, item of an empty list at position 0, is not a row: item returns list[index] for any position the list holds and undefined otherwise, so an empty list answers undefined; the assertion passes against the original item, against a stub returning undefined, against list.at(index) and against list[index] with no bounds test (run on the scratch copy), so no removal of item's behaviour turns it red
- Run of all 4 rows: all passed

#### `data/helpers/guards.test.ts`: reads %s as the number or null (line 149, 4 rows)

- "is a finite number the config holds, and null for one it lacks or one that is not finite" -> row "a finite number" ; row "a missing key" ; row "a number written as text" ; row "a number that is not finite"
- Run of all 4 rows: all passed

#### `data/helpers/guards.test.ts`: answers %s with %s (line 160, 7 rows)

- "holds for equal values, nested maps and lists included" -> row "equal nested maps and lists" ; row "two empty lists"
- "fails for a map whose keys come in another order, at any depth" -> row "a map with its keys in another order" ; row "a nested map with its keys in another order" ; row "a map in a list with its keys in another order"
- "fails for values that differ" -> row "maps with a different value" ; row "lists in another order"
- Run of all 7 rows: all passed

#### `data/helpers/replace.test.ts`: counts %s as the groups it holds (line 68, 5 rows)

- "does not count an escaped bracket, a class, a nested class or a non-capturing group" -> row "an escaped bracket and a class" ; row "a nested class" ; row "a class that starts with a bracket" ; row "a non-capturing group and a flag group" ; row "a group after an escaped backslash"
- Run of all 5 rows: all passed

#### `data/helpers/replace.test.ts`: refuses %s, which is not what the template makes (line 96, 2 rows)

- "refuses a replacement that is not what the template makes" -> row "plain text" ; row "a replacement missing groups"
- Run of all 2 rows: all passed

#### `data/helpers/replace.test.ts`: finds %s in a text (line 110, 5 rows)

- "are the four private-use characters from U+E000" -> row "U+E000" ; row "U+E001" ; row "U+E002" ; row "U+E003" ; row "the next private-use character"
- Run of all 5 rows: all passed

#### `data/helpers/replace.test.ts`: reads %s (line 137, 15 rows)

- "reads a named group as $<name> only when the pattern has one" -> row "a named group the pattern has" ; row "a named group the pattern lacks" ; row "a name that is not a group"
- "reads a number past the group count as one digit and the rest as typed" -> row "$12 over two groups" ; row "$23 over two groups" ; row "$3 over one group"
- "reads $0 as the match and $& with a group reference beside it" -> row "$0 as the match" ; row "$& beside a group reference"
- "turns \n, \t and \\ into a newline, a tab and one backslash" -> row "a backslash n as a newline" ; row "two backslashes as one" ; row "a backslash t as a tab" ; row "a backslash x as typed" ; row "a trailing backslash as typed"
- "writes an empty replace text as the empty text" -> row "an empty replace text"
- "reads a group the match did not take as the empty text" -> row "a group the match did not take"
- Run of all 15 rows: all passed

#### `data/helpers/replace.test.ts`: reads %s (line 173, 2 rows)

- "leaves the run and its $N as typed for a group with no text" -> row "a group with no text"
- "keeps the characters past the operations of a group" -> row "two operations over one group"
- Run of all 2 rows: all passed

#### `data/helpers/replace.test.ts`: writes %s as typed (line 202, 3 rows)

- "writes the replace text as typed, a backslash and a $1 included" -> row "a backslash and a $1" ; row "a $& and a $$"
- "deletes the match for an empty replace text" -> row "an empty replace text"
- Run of all 3 rows: all passed

#### `data/helpers/search.test.ts`: sets the flags of %s (line 68, 4 rows)

- "adds the word boundary for word, and keeps the pattern one argument" -> row "word"
- "matches the pattern case for case" -> row "case"
- "drops the fixed-strings flag for regex, and keeps it for every other combination" -> row "regex" ; row "word and case without regex"
- Run of all 4 rows: all passed

#### `data/helpers/search.test.ts`: answers %s with %s (line 130, 15 rows)

- "refuses an empty query and one that is only spaces" -> row "an empty query" ; row "a query of only spaces"
- "refuses a query longer than the bound and allows one exactly at it" -> row "a query longer than the bound" ; row "a query exactly at the bound"
- "refuses a root the list does not hold, and allows every root it does" -> row "a root the list does not hold" ; row "a root the list holds" ; row "every root"
- "refuses a folder that climbs out or is absolute, and any folder with every root" -> row "a folder that climbs out" ; row "a folder that climbs from inside" ; row "a folder that is two dots" ; row "an absolute folder" ; row "a folder written with a backslash" ; row "a folder with every root" ; row "no folder with every root" ; row "a folder inside a root"
- Run of all 15 rows: all passed

#### `data/helpers/search.test.ts`: drops %s (line 189, 2 rows)

- "drops the leading dot-slash ripgrep prints against the directory it was given" -> row "the leading dot-slash ripgrep prints against the directory it was given" ; row "a path with none"
- Run of all 2 rows: all passed

#### `data/helpers/search.test.ts`: takes the cap for a max that is %s (line 207, 4 rows)

- "takes the cap for a max that is absent, zero or beyond it" -> row "absent" ; row "zero" ; row "beyond it" ; row "inside it"
- Run of all 4 rows: all passed

#### `data/helpers/search.test.ts`: holds the cap between one and the configured number for %s (line 228, 2 rows)

- "holds the cap between one and the configured number" -> row "not a number" ; row "a fraction"
- Run of all 2 rows: all passed

#### `data/prose/latex.test.ts`: reads the sections of a text the parser refuses by a line scan: %s (line 102, 3 rows)

- "reads the sections of a text the parser refuses by a line scan and says it refused" -> row "a title whose brace never closes"
- "reads both sections around a line the parser refuses" -> row "a stray dollar sign"
- "reads no includes from a text the parser refuses" -> row "an include, which the line scan does not read"
- Run of all 3 rows: all passed

#### `data/sources/config/merge.test.ts`: skips an own __proto__ key %s (line 44, 5 rows)

- "skips an own __proto__ key at every level" -> row "at the top, holding a map" ; row "below the top, holding a map"
- "skips an own __proto__ key holding text" -> row "at the top, holding text"
- "skips an own __proto__ key holding text or a number below the top" -> row "below the top, holding text" ; row "below the top, holding a number"
- Run of all 5 rows: all passed

#### `data/sources/present.test.ts`: reads %j, a value ending in an image suffix, as an image name (line 205, 7 rows)

- "reads a value ending in an image suffix, trimmed and in any case, as an image name" -> row "eq_one.png" ; row "EQ_ONE.PNG" ; row " eq_one.png " ; row "a.jpg" ; row "a.jpeg" ; row "a.svg" ; row "a.webp"
- Run of all 7 rows: all passed

#### `data/sources/present.test.ts`: reads %j as LaTeX (line 212, 5 rows)

- "reads anything else as LaTeX" -> row "\min_{x} f(x)" ; row "x \text{png}" ; row "a.png + b" ; row "" ; row "  "
- Run of all 5 rows: all passed

#### `data/sources/present.test.ts`: draws no equation and reports nothing for %j (line 272, 6 rows)

- "reads equation: %s as no equation" -> row "equation: 3" ; row "equation: [a, b]" ; row "equation: { a: 1 }"
- Rows that were already rows of this table in the base file: "''" ; "equation: ''" ; "equation: "   ""
- Run of all 6 rows: all passed

#### `data/sources/career.test.ts`: reads a file holding %j as one finding (line 175, 5 rows)

- "reports a file that is not a map of keys" -> row "- a list"
- Rows that were already rows of this table in the base file: "[]" ; "3" ; "x" ; "['']"
- Run of all 5 rows: all passed

#### `data/sources/collections.test.ts`: reads a file holding %j as one finding (line 237, 5 rows)

- "reports a file that parses to something other than a map" -> row "- one\n- two\n"
- Rows that were already rows of this table in the base file: "[]" ; "3" ; "x" ; "['']"
- Run of all 5 rows: all passed

#### `data/sources/docs.test.ts`: reads a block holding %j as one finding (line 193, 4 rows)

- "reports a frontmatter block that is not a map" -> row "- one\n- two\n"
- Rows that were already rows of this table in the base file: "[]\n" ; "3\n" ; "x\n"
- Run of all 4 rows: all passed

#### `data/helpers/search.test.ts`: reads %j as %j (line 265, 10 rows)

- "reads max_hits and answers zero for a configuration that has not arrived" -> row "{ search: { max_hits: 120 } }" ; row "{}" ; row "{ search: { max_hits: '5' } }". the third assertion of the old case (max_hits written as the text 'many') is read through the row max_hits '5', which is also text
- Rows with no old title of their own: "0" ; "x" ; "2.7" ; "0" ; "0" ; "0" ; "-3"
- Run of all 10 rows: all passed

#### `routes/sessions/latex.test.ts`: answers %s with its word (line 257, 18 rows)

- "refuses a request naming no project or root" -> row "no project or root"
- "refuses an id the snapshot does not hold" -> row "a project the snapshot does not hold"
- "refuses %s with 404" -> row "a path that leaves the root" ; row "a folder that is a file" ; row "a path the root does not hold" ; row "a root that is not served". the rows use the queries ?path=../x, ?path=notes.md, ?path=nope and ?root=nowhere&path=x, the same refusals as the four cases
- "refuses %s with 400" -> row "a root with no path" ; row "both forms" ; row "a path and neither a project nor a root" ; row "a path and a file". the rows use the queries of the same refusals; 'both forms' leaves out the path the old case also carried
- "refuses a file that is missing and a file outside the root" -> row "a file that is missing" ; row "a file outside the root"
- "refuses an outline and a count asked together" -> row "an outline and a count"
- Rows that were already rows of this table in the base file: "an empty project id" ; "an empty root" ; "a file that is a folder" ; "a count of a chapter" ; "an outline of a chapter"
- Run of all 18 rows: all passed

#### `routes/sessions/latex.test.ts`: runs %s with its arguments, the text on standard input (line 469, 3 rows)

- "answers the text the program printed from the text it was given on standard input" -> row "tex-fmt"
- Rows that were already rows of this table in the base file: "latexindent" ; "badness"
- Run of all 3 rows: all passed

#### `routes/sessions/latex.test.ts`: refuses %s-missing when the chosen program is not found (line 535, 3 rows)

- "answers 502 with the missing word of the chosen program when it is not found" -> row "tex-fmt"
- Rows with no old title of their own: "latexindent" ; "badness"
- Run of all 3 rows: all passed

#### `data/sources/config/local.test.ts`: answers %j with the sentence it would throw (line 32, 49 rows)

- "throws "calendars must be a list"" (in `calendar-config.test.ts`) -> row "calendars: {}"
- "throws "calendars[0] must be a map"" (in `calendar-config.test.ts`) -> row "calendars: [one]"
- "throws "calendars[0].provider must be google, microsoft or ics"" (in `calendar-config.test.ts`) -> row "calendars: [{ provider: yahoo, label: a }]"
- "throws "calendars[0].label must be lowercase letters, digits and dashes"" (in `calendar-config.test.ts`) -> row "calendars: [{ provider: google }]" ; row "calendars: [{ provider: google, label: "../escape" }]"
- "throws "calendars[1].label repeats work for google"" (in `calendar-config.test.ts`) -> row "calendars: [{ provider: google, label: work }, { provider: google, label: work }]"
- "throws "calendar_dir must be a path"" (in `calendar-config.test.ts`) -> row "calendar_dir: 7"
- "throws "mail must be a list"" (in `mail-config.test.ts`) -> row "mail: x"
- "throws "mail[0] must be a map"" (in `mail-config.test.ts`) -> row "mail: [one]"
- "throws "mail[0].provider must be google or microsoft"" (in `mail-config.test.ts`) -> row "mail: [{ provider: fastmail, label: work }]" ; row "mail: [{ provider: ics, label: a }]"
- "throws "mail[0].label must be lowercase letters, digits and dashes"" (in `mail-config.test.ts`) -> row "mail: [{ provider: google }]" ; row "mail: [{ provider: google, label: "../escape" }]"
- "throws "mail[1].label repeats work for google"" (in `mail-config.test.ts`) -> row "mail: [{ provider: google, label: work }, { provider: google, label: work }]"
- "throws "mail_dir must be a path"" (in `mail-config.test.ts`) -> row "mail_dir: 7"
- Rows that were already rows of this table in the base file: "[]" ; "x" ; "3" ; "accounts: {}" ; "accounts: x" ; "accounts: [3]" ; "accounts: [[]]" ; "accounts: [{ tool: gemini, dir: d, label: a }]" ; "accounts: [{ tool: claude, dir: '', label: a }]" ; "accounts: [{ tool: claude, dir: 3, label: a }]" ; "accounts: [{ tool: claude, dir: d, label: '' }]" ; "accounts: [{ tool: claude, dir: d, label: 3 }]" ; "accounts: [{ tool: claude, dir: '', label: '' }]" ; "accounts: [{ tool: claude, dir: d, label: A b }, { tool: claude, dir: e, label: a-b }]" ; "hub: 3\nport: x" ; "hub: ''" ; "port: x" ; "port: 1.5" ; "port: .nan" ; "port: .inf" ; "port: '8790'" ; "hpc_host: ''" ; "hpc_host: 3" ; "claude_bin: 3" ; "open_bin: ''" ; "calendars: [3]" ; "calendars: [{ provider: ics, label: A }]" ; "calendars: [{ provider: ics, label: a }, { provider: ics, label: a }]" ; "notes: ''" ; "workspaces: 3" ; "history: ''" ; "history: [x]" ; "mail_dir: []" ; "calendar_dir: [x]"
- Run of all 49 rows: all passed

#### `routes/docs/docs.test.ts`: answers 404 for %s (line 132, 2 rows)

- "answers 404 for an id the reader does not know" -> row "an id the reader does not know"
- "answers 404 for an id that is a path rather than a folder name" -> row "an id that is a path rather than a folder name"
- Run of all 2 rows: all passed

#### `routes/docs/docs.test.ts`: %s (line 417, 2 rows)

- "draws a figure beside a README through the file route" -> row "a relative source in a project README is addressed through the file route"
- "draws a relative source as the file route address, with its alt and its title" -> row "a relative source in a project README is addressed through the file route"
- "draws a figure beside it through the file route, under the hub root" -> row "a source that climbs inside the hub is resolved against the document folder"
- "resolves a figure beside a document in a folder, whatever it climbs on the way" -> row "a source that climbs inside the hub is resolved against the document folder"
- Run of all 2 rows: all passed

#### `routes/docs/docs.test.ts`: keeps %s as the author wrote it (line 434, 2 rows)

- "leaves a figure source that climbs out of the hub as the author wrote it" -> row "a source that climbs out of the root"
- "keeps a source that climbs out of the root as the author wrote it" -> row "a source that climbs out of the root"
- "leaves an address the browser resolves itself alone" -> row "an address the browser resolves itself"
- "keeps an address the browser resolves itself" -> row "an address the browser resolves itself"
- Run of all 2 rows: all passed

#### `routes/docs/memories.test.ts`: answers 404 for %s (line 108, 6 rows)

- "refuses a name that carries a separator or leaves the folder" -> row "a name that leaves the folder" ; row "a name with a separator" ; row "an absolute path" ; row "a hidden file"
- "refuses a name that is not a picture and one that is not there" -> row "a name that is not a picture" ; row "a name that is not there". the third assertion of the old case, no folder configured, is the separate case 'answers 404 when no folder is configured'
- Run of all 6 rows: all passed

#### `routes/docs/memories.test.ts`: is none for %s (line 130, 4 rows)

- "is a name and its data, and nothing else is one" -> row "no data" ; row "no name" ; row "a bare string". the two assertions that a body is a name and its data are in the case 'is a name and its data, and every other key is dropped'
- "refuses a name that is not text" -> row "a name that is not text"
- Run of all 4 rows: all passed

#### `routes/docs/memories.test.ts`: refuses %s, and writes nothing (line 177, 6 rows)

- "refuses bytes that are not the format the extension names, and writes nothing" -> row "text under a PNG name" ; row "text under a JPEG name" ; row "a PNG under a JPEG name" ; row "a JPEG under a PNG name"
- "refuses a picture larger than the wall takes, and writes nothing" -> row "a picture larger than the wall takes"
- "refuses an empty body of data" -> row "an empty body of data"
- Run of all 6 rows: all passed

#### `routes/docs/memories.test.ts`: %s (line 237, 8 rows)

- "takes a PNG only under .png and a JPEG only under .jpg or .jpeg" -> row "takes a PNG under .png" ; row "takes a JPEG under .jpg" ; row "takes a JPEG under .jpeg" ; row "refuses a JPEG under .png" ; row "refuses a PNG under .jpg"
- "takes nothing under an extension it has no marks for, and nothing too short" -> row "refuses a PNG under .webp, which has no marks" ; row "refuses two bytes under .png, which is too short" ; row "refuses no bytes under .png"
- Run of all 8 rows: all passed

#### `routes/docs/wallpaper.test.ts`: serves %s with its own type and a private cache header (line 86, 3 rows)

- "serves the chosen image with its own type and a private cache header" -> row "a-first"
- "names the type by the extension" -> row "b-second" ; row "c-third"
- Run of all 3 rows: all passed

#### `routes/docs/wallpaper.test.ts`: answers 404 for %s (line 98, 4 rows)

- "answers 404 with no image, no folder and no configuration" -> row "no picture in the folder" ; row "a folder that is not there" ; row "no configuration"
- "answers 404 to a file that would leave the folder" -> row "a file that would leave the folder"
- Run of all 4 rows: all passed

#### `routes/docs/wallpaper.test.ts`: serves nothing for %s (line 146, 4 rows)

- "returns null when dir is absent" -> row "no dir"
- "serves nothing for a dir that is empty or not text, and for a block that is a list" -> row "a dir that is empty" ; row "a dir that is not text" ; row "a block that is a list"
- Run of all 4 rows: all passed

#### `routes/edit/audit-mute.test.ts`: refuses %s, and the file is byte-identical (line 183, 4 rows)

- "refuses a signature that is not twelve hex characters, and the file is byte-identical" -> row "a signature that is not hex" ; row "a signature in capitals" ; row "a signature of thirteen characters"
- "refuses a file whose shape the line edit cannot keep, and the file is byte-identical" -> row "a file whose shape the line edit cannot keep"
- Run of all 4 rows: all passed

#### `routes/edit/rail.test.ts`: refuses %s and leaves the file as it was (line 79, 4 rows)

- "refuses a page named twice and leaves the file as it was" -> row "a page named twice"
- "refuses a page no arrangement of the file holds, and an empty one" -> row "a page no arrangement of the file holds" ; row "an empty page"
- "refuses a glyph the vocabulary does not hold" -> row "a glyph the vocabulary does not hold"
- Run of all 4 rows: all passed

#### `routes/files/file.test.ts`: names %s as %s (line 61, 28 rows)

- "names the type of every extension a manual is made of, text with its charset" -> row "a.html" ; row "MANUAL.HTML" ; row "a/b/manual.css" ; row "a.js" ; row "a.md" ; row "a.svg" ; row "a.woff2". the old case wrote the names manual.html, search.js, notes.md, logo.svg and body.woff2; the rows carry the same extensions under the names of the table of the next old case
- "names every extension of the manual table as it did" -> row "a.html" ; row "a/b/manual.css" ; row "a.js" ; row "a.png" ; row "a.jpg" ; row "a.jpeg" ; row "a.gif" ; row "a.svg" ; row "a.webp" ; row "a.woff" ; row "a.woff2" ; row "a.json" ; row "a.txt" ; row "a.md" ; row "a.pdf". the old css name was a.css; the row reads it as a/b/manual.css, the second css name of the other old case
- "names the types a manual may carry beyond that table, a text one with its charset" -> row "module.mjs" ; row "rows.csv" ; row "favicon.ico" ; row "engine.wasm" ; row "photo.avif" ; row "archive.tar.gz"
- "serves TypeScript as bytes, which a type table reads as video" -> row "main.ts" ; row "main.mts" ; row "main.cts"
- "falls back to bytes for a name it does not know, a bare dotfile and no extension" -> row ".png" ; row "LICENSE" ; row "thing.nosuchext"
- Run of all 28 rows: all passed

#### `routes/files/file.test.ts`: has nothing for %s (line 114, 9 rows)

- "has nothing for a file that is not there" -> row "a file that is not there"
- "has nothing for a directory, and nothing for the root itself" -> row "a directory" ; row "the root itself"
- "has nothing for a path that climbs out of the root" -> row "a path that climbs out of the root" ; row "a path that climbs after descending" ; row "an absolute path"
- "has nothing for a symbolic link pointing out of the root" -> row "a symbolic link pointing out of the root"
- "has nothing for a root nobody configured, and none for a root that is not there" -> row "a root nobody configured" ; row "a root that is not there"
- Run of all 9 rows: all passed

#### `routes/files/file.test.ts`: reports roots that are %s as not a list, and keeps no root (line 267, 2 rows)

- "has nothing to say about a config with no roots, and reports one that is not a list" -> row "text"
- "reports roots that are a map as not a list, and keeps no root" -> row "a map"
- Run of all 2 rows: all passed

#### `routes/files/open.test.ts`: reports the refusal of %s once, without a token refresh or a retry (line 442, 2 rows)

- "reports an unknown root's refusal once without a token refresh or retry" -> row "an unknown root"
- "reports an outside-root refusal once without a token refresh or retry" -> row "a path outside every root"
- Run of all 2 rows: all passed

#### `routes/machine/commands.test.ts`: refuses a saved name that %s, writing nothing (line 348, 2 rows)

- "refuses a saved name that the repository file already holds, writing nothing" -> row "the repository file already holds"
- "refuses a saved name that a command found in the repository holds, writing nothing" -> row "a command found in the repository holds"
- Run of all 2 rows: all passed

#### `routes/sessions/terminal.test.ts`: refuses %s without starting a terminal (line 250, 3 rows)

- "refuses an unknown dataset without starting a terminal" -> row "a dataset the portfolio does not hold"
- "refuses a shell-bearing key absent from the snapshot" -> row "a key that carries a shell command"
- "refuses a dash-prefixed key even when the snapshot holds it" -> row "a dash-prefixed key the portfolio holds"
- Run of all 3 rows: all passed

#### `routes/git/git.test.ts`: the list `ASKING`

- "refuses each of them unconfirmed, and takes each one confirmed" -> entries: "createWorktree" ; "removeWorktree" ; "merge" (the old case compared each unconfirmed answer with the full error object; the list case asserts the status and that nothing ran, and the error object is asserted for a commit by 'refuses a commit that the page did not confirm')
- "refuses each without the token and each unconfirmed" (in `refs.test.ts`) -> entries: "cherryPick" ; "checkoutDetached" ; "deleteBranch" ; "deleteBranchAnyway" (the token half is held by 'refuses a request with no token' in git.test.ts)

#### `checks/imports/order.test.ts`: holds the %s folders (line 29, 6 rows)

- "holds the data folders" -> row "data"
- "holds the server folders" -> row "server"
- "holds the state folders" -> row "state"
- "holds the ui folders" -> row "ui"
- "holds the shell folders" -> row "shell"
- "holds the views folders" -> row "views"
- Run of all 6 rows: all passed

## Doc text

Sentences outside this step's paths that the sweep makes false, as `grep -n` prints them, with the replacement for the orchestrator to apply at landing.

- `tests/shell/context-guard.test.ts:4-5` (the sentence names the deleted source cases of `routes/page.test.ts`): `grep -n "page.test.ts" tests/shell/context-guard.test.ts` prints `5:// tests/routes/page.test.ts.`, and line 4 reads `// yes everywhere else, a blank area included. The listener that calls it is read as source in`. Replace line 4 with `// yes everywhere else, a blank area included.` and delete line 5.
- `demo/README.md:5` (`tests/data/demo-hub.test.ts` no longer asserts counts): `5:`tests/data/demo-hub.test.ts` builds the portfolio over this folder and asserts zero findings and the counts it holds, so a value that oculus's reader rejects is caught by `npm test`.` Replace `asserts zero findings and the counts it holds` with `asserts zero findings`.
- `src/lib/server/git/git-routes.ts:139` (`spec.md:83`, an export left with no importer: `tests/routes/git/refs.test.ts` was its only importer; a script over `src`, `tests` and `utils` that resolves every import lists `CONFIRMED` of this file as the only export newly without an importer): `139:export const CONFIRMED = [`. Replace with `const CONFIRMED = [`; its use at `:369` is in the same file. `src/lib/server/git/deposit-routes.ts:52` `export const CONFIRMED = [...]` also has no importer, and had none in the base copy (the same script on the base copy lists it), so it is not a result of this sweep.
- `tests/server/core/git/head.test.ts:5` names `tests/routes/git/head.test.ts`, a file that exists neither in the base copy (`ls` of its `tests/routes/git` lists changes, deposit, git, refs, request, untracked) nor now; the sweep did not cause it and it lies in T1c's folder.
- The slow tier's wording (`vite.config.ts:31-35`, `README.md:15`, `HELP.md:344` and `:346`, `agents/spec.md:56`): `T1c-report.md:181-184` proposes the rewrite, which names a test, a describe and a file form and the causes (process, real timer, socket, 100 ms). The tagging here follows that rewrite and adds nothing to it.
- `tests/server/git/refs/detached.test.ts:6-7` (T1c's folder; `sed -n 6,7p` of main's file prints `// What this does NOT cover: the questions the page asks first, and the route's confirm` and `// (tests/routes/git/refs.test.ts).`): the sweep moved the confirm cases out of `tests/routes/git/refs.test.ts`, whose head (`:4-5`) now says the token and the confirm are `tests/routes/git/git.test.ts`, where `:350` holds 'refuses each asking action unconfirmed, and takes it confirmed with its fields'. Replace `tests/routes/git/refs.test.ts` at `:7` with `tests/routes/git/git.test.ts`.
- Checked and still true after the sweep, by `grep -n` or `sed -n` on the final tree: `HELP.md:308` (names `tests/checks/imports/cycles.test.ts` and `order.ts`, both present); `config/catalogs/vocab.yml:153` (the lane-distance check still runs under every theme); `config/catalogs/options.yml:3`; `utils/size-allow.txt:3` (names `tests/checks/tree/size.test.ts`, present); `agents/spec.md:37` (the four real-hub readers all exist, `integrity.test.ts` still reads the real hub); `agents/spec.md:53` (`boundaries.test.ts` present); `src/hooks.server.ts:79` (names `tests/checks/source/keys.test.ts`, present); the nine comments in `utils/diagrams/` and `utils/folder-check.sh:8`, `utils/size-check.sh:9` name files that still exist. A script that reads every `tests/(routes|data|checks|fixtures)/...` path out of `src`, `tests`, `utils`, `demo`, `config`, `DESIGN.md`, `HELP.md` and `README.md` finds 169 references to 67 paths, and exactly one path that does not exist: `tests/routes/git/head.test.ts`, cited at `tests/server/core/git/head.test.ts:5` above.
- Comments that name a deleted test: a script lists the 394 test titles of the four folders that are in the base copy and not in the final tree, and searches `src`, `tests`, `utils`, `demo`, `config` and the root documents for each title of 14 characters or more. 16 titles are found elsewhere; each is a case of the same title in another file, a phrase that names no test (`builds the portfolio` in `DESIGN.md:179`, `DESIGN.md:420` and `tests/checks/imports/order.ts:9`), or the sentence at `demo/README.md:5` above. None is a comment that names a deleted case. `grep -rn 'routes/shape' src tests utils DESIGN.md HELP.md README.md config demo` prints nothing in the worktree; the file is cited in `tools/oculus/.scratch/migration/` ledgers only (`plan.md:1079`, `choices.md:1014`, `orchestrator-history.md:10`, `agents/briefs/Q79b.md:269`), and in `tests/routes/sessions/terminal-actions.test.ts:179` of the main checkout, a comment of the case this sweep deletes.

## Helpers of other sweeps left unused

A script over `tests`, `src` and `utils` that resolves every import to its file lists the exports no file imports among the files of the four folders. After the sweep it lists `slideProject` of `tests/routes/edit/write-fixture.ts` (kept exported for the reason in item (2) of the first line), six in `tests/checks/tree/audits.test.ts` (`Audit`, `cases`, `everyCase`, `findAudits`, `readAudits`, `renderNames`), a file this step may not change (T1d's sweep carries it), and `type ClientState` of `tests/fixtures/client.ts`, which `tests/ui/primitives.test.ts` imports inline (`type ClientState` inside the braces), so it is used. No helper of the seven folders of other sweeps became unused through this sweep.

## Checks found to guard nothing

None. Every tree check kept guards a written rule: comment width, history, size, duplication, boundaries, negatives, scratch, keys, retired, add-forms, html-sites, cycles, augments, order, options-catalog, config-folder, integrity, contrast, lane-distance, diagrams. `retired.test.ts` and `add-forms.test.ts` guard `spec.md:66` and DESIGN.md's 'Unsaved form input is instance state'; they are kept and named under the judgment calls.

## Judgment calls the brief left open

- `routes/shape.test.ts` is deleted (Z385, repair finding 4): it read route source text (`spec.md:61`) for a structure rule written only in its own head.
- `routes/sessions/terminal-actions.test.ts`: the case 'carries tasks.skip_permissions on the wire, off in the checked-in configuration' is deleted (repair finding 3): it asserted the value of a shipped setting; the wire is held by 'adds the skip flag and nothing else when tasks.skip_permissions is on' (`:95`) and 'reads a tasks.skip_permissions of any other shape, and a missing one, as off' (`:104`).
- `data/snapshot/normalise.test.ts` 'takes the version from the caller and defaults it to zero' (`:627`) and 'carries the findings it was given' (`:632`) copy an argument to the output; kept because nothing else asserts that the version and the findings reach the wire.
- `checks/config/config.test.ts` carries 'Layer 4, tree check.' though five of its describes are reader unit tests.
- `checks/utils/*` are tests of scripts and not tree checks: they carry the base's label for a test of a script, 'Layer 4, test.', and four are tagged by cause under Decision 1 (`rename-pillar.test.ts` starts no process and is not tagged).
- `checks/source/retired.test.ts` enforces `spec.md:66` for one retired screen only, through a phrase list over three documents; kept.
- `checks/look/lane-distance.test.ts` 'pairs the headers that touch in the layout the view draws' (`:174`) models the Focus layout; its lane-name list and counts come from the shipped config; kept. The light-theme pin table of 22 pairs and the 0.01 reference case were deleted as pins of derived colours.
- `checks/diagrams/parsed.test.ts` cache-count tests are kept: they are the lowest-level holder of the parse reader.
- `checks/config/config-folder.test.ts` lost the assertions that pin shipped values (lists, labels, chord letters, paths); the assertions that state a consistency rule over the shipped config stayed (a key in one file, a reference that resolves, an entry that is valid).
- `checks/config/options-walk.test.ts` is deleted; two cases the holder `data/sources/config/catalog/options.test.ts` lacked ('returns a path once for each key that gives it' and 'is not misled by a reserved name of objects as an entry or as a key') moved into it.
- `routes/files/search.test.ts`: four cases arm a guard `setTimeout` that no test awaits (probe records in the quick tier), so they are quick; if a later change awaits it, the case is slow by cause.
- `routes/files/file.test.ts` keeps 'is the same key on the client, which cannot import the server module' (`:169`): the client's `ENGINE_ROOT` and the server's are two definitions that `src/lib/state/sources/explorer/view/place.ts:20` says agree, so the case is a relation between independent values and not a constant pin.
- `checks/utils/rename-pillar.test.ts`: the describe 'the rename the script carries' and its case 'is the one the reader reports a manifest under the old key for' are deleted with the `RENAMED_FIELDS` import: the base asserted `RENAMED_FIELDS` equal to `{ program: 'pillar' }` and `{ from, to }` equal to `{ from: 'program', to: 'pillar' }`, two pins of a constant (`spec.md:57`). The table of root arguments of the same file stays as an `it.each` of five rows.
- The shared cold start of the configuration load is a file-level `test.beforeAll(warmConfig)` in ten route files and not a `beforeAll` inside a slow describe (the repair brief's wording for finding 1). The quick tests of those files load the configuration too, so a hook inside a slow describe would leave the first quick test of each file paying the 83 ms cold load, and the hook's body is under the 100 ms at which `briefs/T1e.md:46` makes a hook count against the tests it serves. The option that would have kept the tags off the tests is a file tag on all ten files, which is the widened tag the review measured and removed.
- `routes/edit/write-fixture.ts` keeps `export` on `slideProject` for the reason in item (2) of the first line.
- Counts of lines and files use every file of a folder, which gives 37,212 lines in the base copy against the brief's 36,967 for the `.ts` files alone.
- Git commands: in the first round one `git -C . status` was run by mistake. In the repair round three read-only commands were run by mistake: `git -C <main checkout> log --oneline -1`, `git --version` and `git -C . status`. Their output was discarded and none changed anything. Each breaks `spec.md:32` (no git command, read-only ones included); no other git command was run.

## Edits to existing assertions

Made from `diff` of each changed test file and allow list against the base copy (`spec.md:59`), one row per changed line. There are three parts: the tests that keep or continue a test of the base copy with a changed body, the five files the repair brief names, as `diff -U0` hunks, and the allow list.

### Tests with a changed body

77 tests of the four folders keep or continue a test of the base copy with a changed body: those with the same title, and those whose title changed with a body at least half the same as one test no longer in the base file. Each is listed with its line in the final file and in the base file, then its changed lines, `-` for the base copy and `+` for the final file, from a `difflib` comparison of the two bodies with indentation, blank lines and slow tags left out.

- `routes/docs/docs.test.ts:132` (base :205), "answers 404 for an id that is a path rather than a folder name" became "answers 404 for %s" (retitled and edited, 0.76 similar)
    -it('answers 404 for an id that is a path rather than a folder name', async () => {
    +it.each([
    +['an id the reader does not know', 'beta'],
    +['an id that is a path rather than a folder name', '../alpha']
    +])('answers 404 for %s', async (_row, id) => {
    -request(`project=${encodeURIComponent('../alpha')}&name=README.md`),
    +request(`project=${encodeURIComponent(id)}&name=README.md`),
    -expect(fields(await response.json()).error).toBe('no project with the id ../alpha');
    +expect(fields(await response.json()).error).toBe(`no project with the id ${id}`);
- `routes/docs/docs.test.ts:194` (base :185), "finds the folder under a nested scan rule when no portfolio was published" (same title)
    -const real = portfolioConfigFrom(loadConfig(engineDir()).config, engineDir());
- `routes/docs/memories.test.ts:119` (base :335), "refuses a name that is not text" became "answers 404 when no folder is configured" (retitled and edited, 0.53 similar)
    -it('refuses a name that is not text', () => {
    -expect(upload({ name: 3, data: 'b' })).toBeNull();
    +it('answers 404 when no folder is configured', () => {
    +expect(serve(null, 'a-first.jpg').status).toBe(404);
- `routes/docs/memories.test.ts:125` (base :141), "is a name and its data, and nothing else is one" became "is a name and its data, and every other key is dropped" (retitled and edited, 0.71 similar)
    -it('is a name and its data, and nothing else is one', () => {
    +it('is a name and its data, and every other key is dropped', () => {
    -expect(upload({ name: 'a.png' })).toBeNull();
    -expect(upload({ data: PIXEL })).toBeNull();
    -expect(upload('a.png')).toBeNull();
    +expect(upload({ name: 'a', data: 'b', x: 1 })).toStrictEqual({ name: 'a', data: 'b' });
- `routes/docs/wallpaper.test.ts:86` (base :86), "serves the chosen image with its own type and a private cache header" became "serves %s with its own type and a private cache header" (retitled and edited, 0.81 similar)
    -it('serves the chosen image with its own type and a private cache header', async () => {
    -const response = serve({ dir: folder(PICTURES), pick: 'first' }, memory);
    +it.each([
    +['a-first', 'image/jpeg'],
    +['b-second', 'image/png'],
    +['c-third', 'image/webp']
    +])('serves %s with its own type and a private cache header', async (file, type) => {
    +const response = serve({ dir: folder(PICTURES), file, pick: 'first' }, memory);
    -expect(response.headers.get('content-type')).toBe('image/jpeg');
    +expect(response.headers.get('content-type')).toBe(type);
- `routes/docs/wallpaper.test.ts:137` (base :131), "reads the configured directory under the hub of the engine it is given" (same title)
    -expect(settings(wallpaperMemory(), loadConfig(own.engine).config, own.engine)).toEqual({
    +expect(read(own)).toEqual({
- `routes/edit/audit-mute.test.ts:183` (base :179), "refuses a signature that is not twelve hex characters, and the file is byte-identical" became "refuses %s, and the file is byte-identical" (retitled and edited, 0.62 similar)
    -it('refuses a signature that is not twelve hex characters, and the file is byte-identical', async () => {
    -for (const signature of ['nonsense', '0123456789AB', '0123456789abc']) {
    -const into = muteTarget();
    -const before = behaviorOf(into);
    +it.each([
    +['a signature that is not hex', BEHAVIOR, 'nonsense'],
    +['a signature in capitals', BEHAVIOR, '0123456789AB'],
    +['a signature of thirteen characters', BEHAVIOR, '0123456789abc'],
    +[
    +'a file whose shape the line edit cannot keep',
    +'{ read_limits: { next: 300 }, audit_ignore: [] }\n',
    +SIGNATURE
    +]
    +])('refuses %s, and the file is byte-identical', async (_row, body, signature) => {
    +const into = muteTarget(body);
    -expect(behaviorOf(into)).toBe(before);
    -}
    +expect(behaviorOf(into)).toBe(body);
- `routes/edit/rail.test.ts:79` (base :74), "refuses a page named twice and leaves the file as it was" became "refuses %s and leaves the file as it was" (retitled and edited, 0.57 similar)
    -it('refuses a page named twice and leaves the file as it was', async () => {
    +it.each([
    +['a page named twice', [FOCUS, { ...FOCUS, label: 'Again' }]],
    +['a page no arrangement of the file holds', [{ ...FOCUS, page: 'nowhere' }]],
    +['an empty page', [{ ...FOCUS, page: '' }]],
    +['a glyph the vocabulary does not hold', [{ ...FOCUS, glyph: 'nonesuch' }]]
    +])('refuses %s and leaves the file as it was', async (_row, rail) => {
    -const response = await send(into, [FOCUS, { ...FOCUS, label: 'Again' }]);
    +const response = await send(into, rail);
- `routes/edit/undo/undo.test.ts:51` (base :45), "writes a manifest field back, logs the undo, and undoes the undo" (same title)
    -const response = await handleWrite(request({ kind: 'undo', at: change.at }), TOKEN, into);
    +const response = await undone(into, change);
    -const [undone] = changesOf(into);
    -expect(undone).toMatchObject({
    +const [taken] = changesOf(into);
    +expect(taken).toMatchObject({
    -expect(
    -(await handleWrite(request({ kind: 'undo', at: undone.at }), TOKEN, into)).status
    -).toBe(200);
    +expect((await undone(into, taken)).status).toBe(200);
- `routes/sessions/hook.test.ts:55` (base :55), "accepts 20 requests in one second and refuses the 21st with 429" (same title)
    -let last = new Response(null);
    +const statuses: number[] = [];
    -last = await handleHookRequest(request(), into);
    +statuses.push((await handleHookRequest(request(), into)).status);
    -expect(last.status).toBe(429);
    +expect(statuses).toEqual([...Array<number>(20).fill(200), 429]);
- `routes/sessions/latex.test.ts:257` (base :297), "answers %s with its word" (same title)
    +['a path and neither a project nor a root', '?path=proposal', 400, 'not-an-action'],
    +['a project the snapshot does not hold', '?id=nobody', 404, 'no-project'],
    +['a file that is missing', '?root=docs&file=gone.tex', 404, 'missing'],
    +['a file outside the root', '?root=docs&file=../notes.md', 404, 'outside'],
- `routes/sessions/latex.test.ts:535` (base :569), "refuses %s-missing when the chosen program is not found" (same title)
- `routes/sessions/terminal-actions.test.ts:308` (base :340), "refuses %s, a main named with a dash and an absolute path, before anything runs" (same title)
- `routes/sessions/terminal.test.ts:250` (base :287), "refuses a dash-prefixed key even when the snapshot holds it" became "refuses %s without starting a terminal" (retitled and edited, 0.63 similar)
    -it('refuses a dash-prefixed key even when the snapshot holds it', async () => {
    +it.each([
    +[
    +'a dataset the portfolio does not hold',
    +'unknown',
    +['mimic-iv'],
    +'key is not a dataset in the current portfolio'
    +],
    +[
    +'a key that carries a shell command',
    +'mimic; touch nope',
    +['mimic-iv'],
    +'key is not a dataset in the current portfolio'
    +],
    +[
    +'a dash-prefixed key the portfolio holds',
    +'--all',
    +['--all'],
    +'key is not a valid dataset key'
    +]
    +])('refuses %s without starting a terminal', async (_row, key, ids, reason) => {
    -request({ action: 'recover', key: '--all', cols: 80, rows: 24 }),
    +request({ action: 'recover', key, cols: 80, rows: 24 }),
    -datasetIdsFor: () => ['--all'],
    +datasetIdsFor: () => ids,
    -expect((await answer(response)).error).toBe('key is not a valid dataset key');
    +expect((await answer(response)).error).toBe(reason);
- `routes/machine/commands.test.ts:348` (base :350), "refuses a saved name that a command found in the repository holds, writing nothing" became "refuses a saved name that %s, writing nothing" (retitled and edited, 0.54 similar)
    -it('refuses a saved name that a command found in the repository holds, writing nothing', async () => {
    -plant(repo, 'package.json', JSON.stringify({ scripts: { dev: 'vite' } }));
    +it.each([
    +[
    +'the repository file already holds',
    +(): void => undefined,
    +{ name: 'build', run: 'make other' },
    +'build is already a command in .oculus/commands.yml of this repository, so it cannot be saved under that name'
    +],
    +[
    +'a command found in the repository holds',
    +(): void => plant(repo, 'package.json', JSON.stringify({ scripts: { dev: 'vite' } })),
    +{ name: 'npm: dev', run: 'vite' },
    +'npm: dev is already a command found in this repository, so it cannot be saved under that name'
    +]
    +])('refuses a saved name that %s, writing nothing', async (_row, setup, command, error) => {
    +setup();
    -post({ action: 'save', repo, command: { name: 'npm: dev', run: 'vite' } }),
    +post({ action: 'save', repo, command }),
    -expect((await answer(response)).error).toBe(
    -'npm: dev is already a command found in this repository, so it cannot be saved under that name'
    -);
    +expect((await answer(response)).error).toBe(error);
    +expect(readChanges(log)).toEqual([]);
- `routes/files/file.test.ts:133` (base :131), "has nothing for a file that is not there" became "serves the file beside a link that leads out of the root" (retitled and edited, 0.86 similar)
    -it('has nothing for a file that is not there', () => {
    -expect(serveFile(manual(), 'docs', 'docs/user/nothing.html').status).toBe(404);
    +it('serves the file beside a link that leads out of the root', () => {
    +expect(serveFile(linked(), 'docs', 'docs/user/manual.html').status).toBe(200);
- `routes/files/file.test.ts:263` (base :332), "reports roots that are a map as not a list, and keeps no root" became "has nothing to say about a config with no roots" (retitled and edited, 0.69 similar)
    -it('reports roots that are a map as not a list, and keeps no root', () => {
    -expect(readRoots({ roots: {} }, FILE)).toStrictEqual({
    -roots: [],
    -findings: [{ file: FILE, key: 'roots', message: 'roots is not a list' }]
    -});
    +it('has nothing to say about a config with no roots', () => {
    +expect(readRoots({}, FILE)).toEqual({ roots: [], findings: [] });
- `routes/files/file.test.ts:267` (base :332), "reports roots that are a map as not a list, and keeps no root" became "reports roots that are %s as not a list, and keeps no root" (retitled and edited, 0.82 similar)
    -it('reports roots that are a map as not a list, and keeps no root', () => {
    -expect(readRoots({ roots: {} }, FILE)).toStrictEqual({
    +it.each([
    +['text', 'cathedra'],
    +['a map', {}]
    +])('reports roots that are %s as not a list, and keeps no root', (_row, value) => {
    +expect(readRoots({ roots: value }, FILE)).toStrictEqual({
- `routes/files/open.test.ts:371` (base :349), "refuses a path that is not a string, with or without a root" became "refuses a path that is missing or not a string, with or without a root" (retitled and edited, 1.00 similar)
    -it('refuses a path that is not a string, with or without a root', async () => {
    +it('refuses a path that is missing or not a string, with or without a root', async () => {
    -for (const body of [{ root: 'hub', path: 7 }, { root: 'hub' }, { path: ['a'] }]) {
    +for (const body of [{}, { root: 'hub', path: 7 }, { root: 'hub' }, { path: ['a'] }]) {
- `routes/files/open.test.ts:442` (base :426), "reports an unknown root's refusal once without a token refresh or retry" became "reports the refusal of %s once, without a token refresh or a retry" (retitled and edited, 0.67 similar)
    -it("reports an unknown root's refusal once without a token refresh or retry", async () => {
    -const { roots } = withFiles();
    +it.each([
    +[
    +'an unknown root',
    +(): ReturnType<typeof openFile> => openFile('nowhere', 'report.docx'),
    +'root',
    +'the root names no served root'
    +],
    +[
    +'a path outside every root',
    +(): ReturnType<typeof openFolder> => openFolder(scratch('oculus-open-client-')),
    +'path',
    +'the path is outside the configured roots'
    +]
    +])(
    +'reports the refusal of %s once, without a token refresh or a retry',
    +async (_row, call, field, reason) => {
    +const { roots } = fixture();
    -const answer = await openFile('nowhere', 'report.docx');
    +const answer = await call();
    -expect(answer.refused).toEqual([
    -{ field: 'root', reason: 'the root names no served root' }
    -]);
    +expect(answer.refused).toEqual([{ field, reason }]);
    +expect(answer.error).toBe(reason);
    -})
    +}
    +)
- `routes/git/git.test.ts:144` (base :153), "refuses a root it was not given" (same title)
- `routes/git/untracked.test.ts:107` (base :122), "waits behind the write chain it is given" (same title)
    +const blocked = writes.chain;
    -await new Promise((resolve) => setTimeout(resolve, 100));
    +// The route has queued its work behind the blocker once it has replaced the chain's tail.
    +for (let turns = 0; turns < 1000 && writes.chain === blocked; turns += 1) {
    +await new Promise((resolve) => setImmediate(resolve));
    +}
    +expect(writes.chain).not.toBe(blocked);
- `data/demo-hub.test.ts:25` (base :85), "joins each joint-work entry to its person and each person to their organisations" became "joins each joint-work entry to the person it names" (retitled and edited, 0.55 similar)
    -it('joins each joint-work entry to its person and each person to their organisations', () => {
    +it('joins each joint-work entry to the person it names', () => {
    -expect(snapshot.entities.people['rivera-lab'].affiliations).toEqual([
    -'northwood-university'
    -]);
    -expect(snapshot.entities.organisations['northwood-university'].personIds).toEqual([
    -'owner',
    -'rivera-lab'
    -]);
- `data/sources/career.test.ts:175` (base :194), "reads a file holding %j as one finding" (same title)
    -it.each([['[]'], ['3'], ['x'], ['']])('reads a file holding %j as one finding', (body) => {
    +it.each([['[]'], ['- a list'], ['3'], ['x'], ['']])(
    +'reads a file holding %j as one finding',
    +(body) => {
    -})
    +}
    +)
- `data/sources/collections.test.ts:237` (base :282), "reads a file holding %j as one finding" (same title)
    -it.each([['[]'], ['3'], ['x'], ['']])('reads a file holding %j as one finding', (body) => {
    +it.each([['[]'], ['- one\n- two\n'], ['3'], ['x'], ['']])(
    +'reads a file holding %j as one finding',
    +(body) => {
    -expect(read.tasks).toStrictEqual({ key: 'tasks', file: read.file, meta: {}, entries: [] });
    -})
    +expect(read.tasks).toStrictEqual({
    +key: 'tasks',
    +file: read.file,
    +meta: {},
    +entries: []
    +});
    +}
    +)
- `data/sources/docs.test.ts:124` (base :156), "reports every name in the fixed order, present or not" became "gives each document its path, present or not" (retitled and edited, 0.80 similar)
    -it('reports every name in the fixed order, present or not', () => {
    +it('gives each document its path, present or not', () => {
    -expect(docs.map((d) => ({ name: d.name, label: d.label }))).toEqual(PROJECT_DOCS);
    -expect(docs.map((d) => d.label)).toEqual(['README', 'CODE', 'PDF', 'TEX']);
- `data/sources/docs.test.ts:193` (base :253), "reads a block holding %j as one finding" (same title)
    -it.each([['[]\n'], ['3\n'], ['x\n']])('reads a block holding %j as one finding', (block) => {
    +it.each([['[]\n'], ['- one\n- two\n'], ['3\n'], ['x\n']])(
    +'reads a block holding %j as one finding',
    +(block) => {
    -})
    +}
    +)
- `data/sources/present.test.ts:205` (base :204), "reads a value ending in an image suffix, trimmed and in any case, as an image name" became "reads %j, a value ending in an image suffix, as an image name" (retitled and edited, 0.87 similar)
    -it('reads a value ending in an image suffix, trimmed and in any case, as an image name', () => {
    -for (const name of [
    -'eq_one.png',
    -'EQ_ONE.PNG',
    -' eq_one.png ',
    -'a.jpg',
    -'a.jpeg',
    -'a.svg',
    -'a.webp'
    -])
    +it.each(['eq_one.png', 'EQ_ONE.PNG', ' eq_one.png ', 'a.jpg', 'a.jpeg', 'a.svg', 'a.webp'])(
    +'reads %j, a value ending in an image suffix, as an image name',
    +(name) => {
    -})
    +}
    +)
- `data/sources/present.test.ts:212` (base :217), "reads anything else as LaTeX" became "reads %j as LaTeX" (retitled and edited, 0.83 similar)
    -it('reads anything else as LaTeX', () => {
    -for (const latex of ['\\min_{x} f(x)', 'x \\text{png}', 'a.png + b', '', '  '])
    +it.each(['\\min_{x} f(x)', 'x \\text{png}', 'a.png + b', '', '  '])(
    +'reads %j as LaTeX',
    +(latex) => {
    -})
    +}
    +)
- `data/sources/present.test.ts:230` (base :233), "reports the image name %s, keeps no equation and still reads the rest of the slide" (same title)
    -it.each(['', "equation: ''", 'equation: "   "'])(
    -'draws no equation and reports nothing for %j',
    -(value) => {
    +it.each([
    +'',
    +"equation: ''",
    +'equation: "   "',
    +'equation: 3',
    +'equation: [a, b]',
    +'equation: { a: 1 }'
    +])('draws no equation and reports nothing for %j', (value) => {
    -const { slides, findings } = readPresent(paths, 'alpha', CATALOG);
    -expect(findings).toEqual([]);
    -expect(slides[0].equation).toBeUndefined();
    -}
    -);
    -it.each(['3', '[a, b]', '{ a: 1 }'])('reads equation: %s as no equation', (value) => {
    -const paths = project(['---', `present: { title: T, equation: ${value} }`, '---', '']);
    -]);
    -});
    -it('reports an entry with no kind, an unknown kind, and a ref that is missing', () => {
    -const deck = {
    -order: [{}, { slide: 'interlude' }, { slide: 'project' }, { slide: 'framing' }, 'text']
    -};
    -expect(
    -deckFindings(deck, [], 'config/present.yml', CATALOG).map((one) => one.message)
    -).toEqual([
    -'names no slide kind',
    -'unknown slide kind interlude',
    -'names no project slide',
    -'a framing slide names no ref',
    -'is not a map of keys'
- `data/sources/present.test.ts:272` (base :275), "draws no equation and reports nothing for %j" (same title)
    -it.each(['', "equation: ''", 'equation: "   "'])(
    -'draws no equation and reports nothing for %j',
    -(value) => {
    +it.each([
    +'',
    +"equation: ''",
    +'equation: "   "',
    +'equation: 3',
    +'equation: [a, b]',
    +'equation: { a: 1 }'
    +])('draws no equation and reports nothing for %j', (value) => {
    -}
    -)
    +})
- `data/sources/config/calendar-config.test.ts:18` (base :40), "reads one row per account, in the order the file names them" (same title)
    -const dir = scratch();
    -writeLocal(
    -dir,
    +const dir = engineWith(
- `data/sources/config/calendar-config.test.ts:28` (base :52), "gives the same label to one account of each provider" (same title)
    -const dir = scratch();
    -writeLocal(
    -dir,
    +const dir = engineWith(
- `data/sources/config/calendar-config.test.ts:35` (base :61), "reads a published calendar link as a row of the provider ics" (same title)
    -const dir = scratch();
    -writeLocal(dir, 'calendars:\n  - { provider: ics, label: work }\n');
    +const dir = engineWith('calendars:\n  - { provider: ics, label: work }\n');
- `data/sources/config/calendar-config.test.ts:40` (base :67), "leaves the list empty when the machine names no account" (same title)
    -const dir = scratch();
    -writeLocal(dir, 'hub: /srv/research-hub\n');
    +const dir = engineWith('hub: /srv/research-hub\n');
- `data/sources/config/calendar-config.test.ts:46` (base :74), "resolves calendar_dir against the engine when the file gives a relative path" (same title)
    -const dir = scratch();
    -writeLocal(dir, 'calendar_dir: state/calendar\n');
    +const dir = engineWith('calendar_dir: state/calendar\n');
- `data/sources/config/local.test.ts:32` (base :32), "answers %j with the sentence it would throw" (same title)
    +['calendars: [one]', 'local.yml: calendars[0] must be a map'],
    +[
    +'calendars: [{ provider: google }]',
    +'local.yml: calendars[0].label must be lowercase letters, digits and dashes'
    +],
    +[
    +'calendars: [{ provider: google, label: "../escape" }]',
    +'local.yml: calendars[0].label must be lowercase letters, digits and dashes'
    +],
    +[
    +'calendars: [{ provider: google, label: work }, { provider: google, label: work }]',
    +'local.yml: calendars[1].label repeats work for google'
    +],
    +['calendar_dir: 7', 'local.yml: calendar_dir must be a path'],
    +['mail: [one]', 'local.yml: mail[0] must be a map'],
    +[
    +'mail: [{ provider: fastmail, label: work }]',
    +'local.yml: mail[0].provider must be google or microsoft'
    +],
    +[
    +'mail: [{ provider: google }]',
    +'local.yml: mail[0].label must be lowercase letters, digits and dashes'
    +],
    +[
    +'mail: [{ provider: google, label: "../escape" }]',
    +'local.yml: mail[0].label must be lowercase letters, digits and dashes'
    +],
    +[
    +'mail: [{ provider: google, label: work }, { provider: google, label: work }]',
    +'local.yml: mail[1].label repeats work for google'
    +],
    +['mail_dir: 7', 'local.yml: mail_dir must be a path'],
- `data/sources/config/mail-config.test.ts:17` (base :40), "reads one row per account, in the order the file names them" (same title)
    -const dir = scratch();
    -writeLocal(
    -dir,
    +const dir = engineWith(
- `data/sources/config/mail-config.test.ts:27` (base :52), "keeps the two lists apart, so one mailbox may be a calendar and a mail account" (same title)
    -const dir = scratch();
    -writeLocal(
    -dir,
    +const dir = engineWith(
- `data/sources/config/mail-config.test.ts:42` (base :69), "leaves the list empty when the machine names no account" (same title)
    -const dir = scratch();
    -writeLocal(dir, 'hub: /srv/research-hub\n');
    +const dir = engineWith('hub: /srv/research-hub\n');
- `data/sources/config/mail-config.test.ts:48` (base :76), "resolves mail_dir against the engine when the file gives a relative path" (same title)
    -const dir = scratch();
    -writeLocal(dir, 'mail_dir: state/mail\n');
    +const dir = engineWith('mail_dir: state/mail\n');
- `data/sources/config/settings.test.ts:123` (base :123), "refuses each number that is not a number or is past its bound, naming the key" (same title)
- `data/sources/config/settings.test.ts:394` (base :407), "refuses the shipped configuration whose behavior.yml was saved unparseable, as the merge reports it" (same title)
    -const { config: whole, findings: none } = loadConfig(engineDir());
    -const { processes: _removed, ...without } = whole;
    -expect(outcome(() => processesSettings(without, none))).toStrictEqual({
    -value: { patterns: ['python3', 'codex', 'claude', 'node', 'latexmk'] }
    -});
- `data/prose/markdown.test.ts:145` (base :145), "draws the list in a document of the route with a folder to resolve figures against" (same title)
    -expect(html).toContain(heading(1, 'a', 'A'));
- `data/prose/markdown.test.ts:154` (base :155), "draws the list in a document of the route with no folder, the manual" (same title)
    -expect(html).toContain(heading(1, 'a', 'A'));
- `data/helpers/editor-options.test.ts:109` (base :122), "is a finding when it is not a map" became "is a finding when it is %s" (retitled and edited, 0.52 similar)
    -it('is a finding when it is not a map', () => {
    -expect(problemKeys({ languages: ['a'] })).toEqual(['editor.languages']);
    -expect(problemKeys({ languages: 'python' })).toEqual(['editor.languages']);
    +it.each([
    +['a list', ['a']],
    +['text', 'python']
    +])('is a finding when it is %s', (_row, languages) => {
    +expect(problemKeys({ languages })).toEqual(['editor.languages']);
- `data/helpers/editor.test.ts:9` (base :44), "reads %j as %j" became "reads %s as %j bytes" (retitled and edited, 0.61 similar)
    -[{ editor: { paint_limit_kb: '5' } }, null],
    -[{ editor: { paint_limit_kb: 0 } }, null],
    -[{ editor: { paint_limit_kb: Number.NaN } }, null],
    -[{ editor: { paint_limit_kb: Number.POSITIVE_INFINITY } }, null],
    -[{ editor: { paint_limit_kb: 2.5 } }, 2560]
    -])('reads %j as %j', (held, bytes) => {
    +['a missing block', {}, null],
    +['a block that is text', { editor: 'on' }, null],
    +['a block that is a list', { editor: [] }, null],
    +['an empty block', { editor: {} }, null],
    +['a size in text', { editor: { paint_limit_kb: '5' } }, null],
    +['a size of zero', { editor: { paint_limit_kb: 0 } }, null],
    +['a negative size', { editor: { paint_limit_kb: -1 } }, null],
    +['a size that is not a number', { editor: { paint_limit_kb: Number.NaN } }, null],
    +['an infinite size', { editor: { paint_limit_kb: Number.POSITIVE_INFINITY } }, null],
    +['a size with a fraction', { editor: { paint_limit_kb: 2.5 } }, 2560]
    +])('reads %s as %j bytes', (_row, held, bytes) => {
    +if (bytes !== null) expect(requirePaintLimit(held)).toBe(bytes);
- `data/helpers/editor.test.ts:25` (base :33), "throws naming the key when it is required and the configuration has no usable one" became "throws naming the key when it is required and there is %s" (retitled and edited, 0.54 similar)
    -it('throws naming the key when it is required and the configuration has no usable one', () => {
    -expect(() => requirePaintLimit({})).toThrow(
    +it.each([
    +['a missing block', {}],
    +['a size of zero', { editor: { paint_limit_kb: 0 } }]
    +])('throws naming the key when it is required and there is %s', (_row, held) => {
    +expect(() => requirePaintLimit(held)).toThrow(
    -expect(() => requirePaintLimit({ editor: { paint_limit_kb: 0 } })).toThrow(
    -'editor.paint_limit_kb'
    -);
- `data/helpers/guards.test.ts:89` (base :97), "is the map itself, so a write through it reaches the value the caller holds" (same title)
    -expect(fields({})).toEqual({});
- `data/helpers/search.test.ts:265` (base :290), "reads %j as %j" (same title)
    +[{ search: { max_hits: 120 } }, 120],
    +[{}, 0],
- `data/helpers/files/opens-in-program.test.ts:20` (base :20), "names the checked-in application for every listed extension, under a folder and in any case" (same title)
    -expect(APPS).toEqual({
    -'.docx': 'com.microsoft.Word',
    -'.doc': 'com.microsoft.Word',
    -'.xlsx': 'com.microsoft.Excel',
    -'.xls': 'com.microsoft.Excel',
    -'.pptx': 'com.microsoft.Powerpoint',
    -'.ppt': 'com.microsoft.Powerpoint',
    -'.rtf': 'com.apple.TextEdit',
    -'.pages': 'com.apple.iWork.Pages',
    -'.numbers': 'com.apple.iWork.Numbers',
    -'.key': 'com.apple.iWork.Keynote'
    -});
    +expect(Object.keys(APPS).length).toBeGreaterThan(0);
- `data/helpers/files/text-kind.test.ts:57` (base :62), "reads the window and the one byte after it a caller hands over" (same title)
    -expect(TEXT_SNIFF_READ).toBe(TEXT_SNIFF + 1);
- `checks/tree/boundaries.test.ts:457` (base :470), "catches a shell file reading a store the shell may not read" (same title)
    -const dir = scratch('oculus-shell-stores-');
    +const dir = scratchDir('oculus-shell-stores-');
- `checks/tree/boundaries.test.ts:470` (base :483), "catches process-wide state outside app.d.ts" (same title)
    -const dir = scratch('oculus-global-state-');
    +const dir = scratchDir('oculus-global-state-');
- `checks/tree/boundaries.test.ts:493` (base :506), "catches a violation of every row it can be shown one of" (same title)
    -const dir = scratch('oculus-boundaries-');
    +const dir = scratchDir('oculus-boundaries-');
- `checks/tree/boundaries.test.ts:565` (base :578), "admits the index module of a folder a row names exactly, and no other module in it" (same title)
    -const dir = scratch('oculus-boundaries-index-');
    +const dir = scratchDir('oculus-boundaries-index-');
- `checks/tree/boundaries.test.ts:589` (base :602), "catches a view reaching into a primitive, and passes the theme class and its own" (same title)
    -const dir = scratch('oculus-primitive-styling-');
    +const dir = scratchDir('oculus-primitive-styling-');
- `checks/tree/boundaries.test.ts:625` (base :638), "holds every styling entry to a reason" (same title)
    -expect(isReason('x')).toBe(false);
    -expect(isReason('the rule sizes the primitive inside the band')).toBe(true);
- `checks/tree/duplication.test.ts:581` (base :585), "holds every entry of both lists to a reason" (same title)
    -expect(isReason('x')).toBe(false);
    -expect(isReason('the two fold the same rule')).toBe(true);
- `checks/tree/size.test.ts:134` (base :133), "audits the awk of the verification list against this rule, over the tree as it stands" became "runs utils/size-check.sh, which only this test runs, and reports nothing over the tree as it stands" (retitled and edited, 0.74 similar)
    -it('audits the awk of the verification list against this rule, over the tree as it stands', () => {
    -const command = readFileSync(join(ROOT, 'utils', 'size-check.sh'), 'utf8');
    +it('runs utils/size-check.sh, which only this test runs, and reports nothing over the tree as it stands', () => {
    -expect(command).toContain('size-allow.txt');
- `checks/config/config-folder.test.ts:293` (base :394), "reads one catalog file per owner and no legacy catalog file" (same title)
    -const { config } = loadConfig(engineDir());
    -const text = config.text as Record<string, string>;
    -expect(text['server.chat.chat_instruction']).toContain('The hub root is `{0}`');
    -expect(text['server.chat.chat_focus_note']).toContain('`{2}` (absolute)');
    -expect(text['server.chat.chat_index_note']).toBe(
    -'The portfolio index is the file {0}; read it first.'
    -);
    -expect(text['app.chat']).toBe('Chat');
- `checks/config/config-folder.test.ts:326` (base :443), "names a group of its own and a path under the hub for every document" (same title)
    -expect(docs.map((entry) => entry.path)).toEqual([
    -'docs/RESEARCH-APPROACH.md',
    -'docs/AGENT-APPROACH.md',
    -'docs/HPC-UTwente-howto.md'
    -]);
- `checks/config/config-folder.test.ts:357` (base :479), "keys every catalogue group by the rail page it holds, in rail order, System after Help" (same title)
    -expect(groups.views.label).toBe('System');
    -expect(groups.help.label).toBe('Help');
- `checks/config/config-folder.test.ts:482` (base :623), "gives every group a chord and a glyph, and no letter a key the workbench binds" (same title)
    -expect(sections.map((section) => section.chord)).toEqual([
    -'f',
    -'m',
    -'p',
    -'e',
    -'s',
    -'c',
    -'l',
    -'r',
    -'t',
    -'h',
    -'y'
    -]);
- `checks/config/config-folder.test.ts:538` (base :692), "reads each file on its own and finds its own keys there and nowhere else" (same title)
    -for (const name of CATALOG_FILES) {
    -const parsed = parse(readFileSync(join(dir, 'text', name), 'utf8')) as Record<
    -string,
    -unknown
    ->;
    -expect(Object.keys(parsed)).toEqual(['text']);
    -}
- `checks/config/config.test.ts:107` (base :221), "accepts distinct Claude labels on equal folder basenames and a matching Codex label" (same title)
    -try {
    -} finally {
    -rmSync(dir, { recursive: true, force: true });
    -}
- `checks/config/config.test.ts:348` (base :572), "names a sentence file that does not parse by its key and arguments, without throwing" (same title)
    -// The rest of the copy still merges, the words of every other owner file among it.
    -expect(textCatalog(config)['app.chat']).toBe('Chat');
    +// The broken file gives no words, so the key worded above is not in the merged catalog.
- `checks/source/text.test.ts:61` (base :66), "draws a catalog line as written, with nothing filled into a glyph-shaped token" (same title)
    -setGlyphs(GLYPHS);
    +setGlyphs(STAND_INS);
- `checks/source/text.test.ts:74` (base :80), "carries no glyph token in any line, since every glyph is drawn beside the words" (same title)
    -const lines = Object.entries(textCatalog(config));
    +const lines = Object.entries(textCatalog(loadConfig(engineDir()).config));
- `checks/source/text.test.ts:81` (base :87), "answers the stand-in config/catalogs/glyphs.yml gives a name, in either mode" became "answers the stand-in a name is given, in either mode" (retitled and edited, 0.52 similar)
    -it('answers the stand-in config/catalogs/glyphs.yml gives a name, in either mode', () => {
    -setGlyphs(GLYPHS);
    +it('answers the stand-in a name is given, in either mode', () => {
    +setGlyphs(STAND_INS);
- `checks/source/text.test.ts:91` (base :103), "throws on a name config/catalogs/glyphs.yml does not hold, in either mode" became "throws on a name the glyphs do not hold, in either mode" (retitled and edited, 0.96 similar)
    -it('throws on a name config/catalogs/glyphs.yml does not hold, in either mode', () => {
    -setGlyphs(GLYPHS);
    +it('throws on a name the glyphs do not hold, in either mode', () => {
    +setGlyphs(STAND_INS);
- `checks/source/text.test.ts:101` (base :113), "reads a bracketed stand-in as a tag only while the stand-ins are drawn" (same title)
    -setGlyphs(GLYPHS);
    +setGlyphs(STAND_INS);
- `checks/utils/cited-lines.test.ts:143` (base :143), "names no report for a line that does not read, so the usage is printed" became "prints the usage for a line that does not read" (retitled and edited, 0.74 similar)
    -it('names no report for a line that does not read, so the usage is printed', () => {
    -expect(readArgs(['--root'])).toEqual({ root: null, report: null });
    -expect(readArgs(['--bogus', 'a.md'])).toEqual({ root: null, report: null });
    +it('prints the usage for a line that does not read',  () => {
- `checks/imports/order.test.ts:29` (base :39), "holds the state folders" became "holds the %s folders" (retitled and edited, 0.57 similar)
    -it('holds the state folders', () => {
    -// The helpers two folders shared moved below both, so each pair imports one way.
    -expect(brokenIn('state')).toEqual([]);
    -})
    +it.each(['data', 'server', 'state', 'ui', 'shell', 'views'])(
    +'holds the %s folders',
    +(layer) => {
    +expect(brokenIn(layer)).toEqual([]);
    +}
    +)
- `checks/imports/order.test.ts:82` (base :105), "places every folder of every layer the tree holds, and every sub-folder of an inner order" (same title)
    -expect(Object.keys(ORDER)).toEqual(['data', 'server', 'state', 'ui', 'shell', 'views']);
    -expect(Object.keys(INNER)).toEqual(['state/shared']);
- `checks/look/contrast.test.ts:152` (base :156), "keeps every pair at ${MINIMUM}:1 in the ${name} theme" became "keeps every pair at ${MINIMUM}:1 in the %s theme" (retitled and edited, 0.97 similar)
    -it(`keeps every pair at ${MINIMUM}:1 in the ${name} theme`, () => {
    +it.each(NAMES)(`keeps every pair at ${MINIMUM}:1 in the %s theme`, (name) => {
- `checks/look/lane-distance.test.ts:214` (base :257), "keeps every touching pair of lane headers ${MINIMUM} apart in the ${name} theme" became "keeps every touching pair of lane headers ${MINIMUM} apart in the %s theme" (retitled and edited, 0.98 similar)
    -it(`keeps every touching pair of lane headers ${MINIMUM} apart in the ${name} theme`, () => {
    +it.each(NAMES)(
    +`keeps every touching pair of lane headers ${MINIMUM} apart in the %s theme`,
    +(name) => {
    -})
    +}
    +)

### The five files named by the repair brief, as `diff -U0` against the base copy

`diff -U0 <base>/tests/checks/utils/rename-pillar.test.ts <worktree>/tests/checks/utils/rename-pillar.test.ts` (24 changed lines):

```diff
@@ -1 +1 @@
-// The hub migration behind the manifest key `program:` becoming `pillar:`.
+// Layer 4, test. The hub migration behind the manifest key `program:` becoming `pillar:`.
@@ -11 +10,0 @@
-import { RENAMED_FIELDS } from '../../../src/lib/data/snapshot/validate.ts';
@@ -66,7 +64,0 @@
-describe('the rename the script carries', () => {
-    it('is the one the reader reports a manifest under the old key for', () => {
-        expect(RENAMED_FIELDS).toEqual({ program: 'pillar' });
-        expect({ from, to }).toEqual({ from: 'program', to: 'pillar' });
-    });
-});
-
@@ -116,6 +108,8 @@
-    it('is every root it names, null for none and for a flag, and a word after -- as a root', () => {
-        expect(rootsOf(['/a', '/b'])).toEqual(['/a', '/b']);
-        expect(rootsOf([])).toBeNull();
-        expect(rootsOf(['--dry-run', '/a'])).toBeNull();
-        expect(rootsOf(['-x'])).toBeNull();
-        expect(rootsOf(['--', '--odd-folder'])).toEqual(['--odd-folder']);
+    it.each([
+        ['every root it names', ['/a', '/b'], ['/a', '/b']],
+        ['null for none', [], null],
+        ['null for a flag before a root', ['--dry-run', '/a'], null],
+        ['null for a short flag', ['-x'], null],
+        ['a word after -- as a root', ['--', '--odd-folder'], ['--odd-folder']]
+    ])('is %s', (_row, argv, expected) => {
+        expect(rootsOf(argv)).toEqual(expected);
```

`diff -U0 <base>/tests/checks/source/text.test.ts <worktree>/tests/checks/source/text.test.ts` (36 changed lines):

```diff
@@ -1,4 +1,4 @@
-// The catalog: flattening on the server, lookup and interpolation on the client. Then the glyph
-// vocabulary, each name with its ASCII stand-in: read from config/catalogs/glyphs.yml on the
-// server, installed on the client, and answered by glyph() as the stand-in whatever the mode, since
-// the stand-in is the only form of a glyph that may go into text.
+// Layer 4, tree check. The catalog: flattening on the server, lookup and interpolation on the
+// client, and the rule that no catalog line carries a glyph token. Then the glyph vocabulary, each
+// name with its ASCII stand-in, installed on the client and answered by glyph() as the stand-in
+// whatever the mode, since the stand-in is the only form of a glyph that may go into text.
@@ -10 +9,0 @@
-    glyphCatalog,
@@ -43,4 +41,0 @@
-
-    it('reads the catalog out of the real config directory', () => {
-        expect(textCatalog(loadConfig(engineDir()).config)['app.title']).toBe('oculus');
-    });
@@ -68 +63 @@
-        setGlyphs(GLYPHS);
+        setGlyphs(STAND_INS);
@@ -76,2 +71 @@
-const { config } = loadConfig(engineDir());
-const GLYPHS = glyphCatalog(config);
+const STAND_INS = { refresh: '(r)', check: '+', expand: '[+]' };
@@ -81 +75 @@
-        const lines = Object.entries(textCatalog(config));
+        const lines = Object.entries(textCatalog(loadConfig(engineDir()).config));
@@ -87,2 +81,2 @@
-    it('answers the stand-in config/catalogs/glyphs.yml gives a name, in either mode', () => {
-        setGlyphs(GLYPHS);
+    it('answers the stand-in a name is given, in either mode', () => {
+        setGlyphs(STAND_INS);
@@ -97,8 +91,2 @@
-    it('holds a dedicated glyph with a stand-in for the three appearance toggles', () => {
-        for (const name of ['crt', 'wallpaper', 'icons']) {
-            expect(GLYPHS[name]).toMatch(/^[\x20-\x7E]+$/);
-        }
-    });
-
-    it('throws on a name config/catalogs/glyphs.yml does not hold, in either mode', () => {
-        setGlyphs(GLYPHS);
+    it('throws on a name the glyphs do not hold, in either mode', () => {
+        setGlyphs(STAND_INS);
@@ -114 +102 @@
-        setGlyphs(GLYPHS);
+        setGlyphs(STAND_INS);
```

`diff -U0 <base>/tests/routes/sessions/terminal.test.ts <worktree>/tests/routes/sessions/terminal.test.ts` (66 changed lines):

```diff
@@ -1,2 +1,2 @@
-// Layer 2, server tests. GET /api/terminal after a write, and POST /api/terminal on a session
-// oculus did not start, resume and recovery. The update-task, LaTeX and chat actions are
+// Layer 2, route tests. GET /api/terminal after a write, and POST /api/terminal on a session oculus
+// did not start, resume and recovery. The update-task, LaTeX and chat actions are
@@ -250,15 +250,5 @@
-    it('refuses an unknown dataset without starting a terminal', async () => {
-        const driver = tmux();
-        const response = await handleTerminal(
-            request({ action: 'recover', key: 'unknown', cols: 80, rows: 24 }),
-            TOKEN,
-            {
-                engine: task.engine,
-                configFor: configOf(task.engine),
-                run: driver.run,
-                datasetIdsFor: () => ['mimic-iv'],
-                hubFor: () => HERE
-            }
-        );
-        expect(response.status).toBe(400);
-        expect((await answer(response)).error).toBe(
+    it.each([
+        [
+            'a dataset the portfolio does not hold',
+            'unknown',
+            ['mimic-iv'],
@@ -266,22 +256,14 @@
-        );
-        expect(driver.calls).toEqual([]);
-    });
-
-    it('refuses a shell-bearing key absent from the snapshot', async () => {
-        const driver = tmux();
-        const response = await handleTerminal(
-            request({ action: 'recover', key: 'mimic; touch nope', cols: 80, rows: 24 }),
-            TOKEN,
-            {
-                engine: task.engine,
-                configFor: configOf(task.engine),
-                run: driver.run,
-                datasetIdsFor: () => ['mimic-iv'],
-                hubFor: () => HERE
-            }
-        );
-        expect(response.status).toBe(400);
-        expect(driver.calls).toEqual([]);
-    });
-
-    it('refuses a dash-prefixed key even when the snapshot holds it', async () => {
+        ],
+        [
+            'a key that carries a shell command',
+            'mimic; touch nope',
+            ['mimic-iv'],
+            'key is not a dataset in the current portfolio'
+        ],
+        [
+            'a dash-prefixed key the portfolio holds',
+            '--all',
+            ['--all'],
+            'key is not a valid dataset key'
+        ]
+    ])('refuses %s without starting a terminal', async (_row, key, ids, reason) => {
@@ -290 +272 @@
-            request({ action: 'recover', key: '--all', cols: 80, rows: 24 }),
+            request({ action: 'recover', key, cols: 80, rows: 24 }),
@@ -296 +278 @@
-                datasetIdsFor: () => ['--all'],
+                datasetIdsFor: () => ids,
@@ -301 +283 @@
-        expect((await answer(response)).error).toBe('key is not a valid dataset key');
+        expect((await answer(response)).error).toBe(reason);
```

`diff -U0 <base>/tests/routes/files/open.test.ts <worktree>/tests/routes/files/open.test.ts` (433 changed lines):

```diff
@@ -1,4 +1,7 @@
-// The authenticated open endpoint's gates, its route and its client, against directories under
-// system temporary storage. The opener is a stub, so no application is launched and no path outside
-// the fixture is touched. What may be opened, and the floor under the opener, are
-// tests/routes/files/open-program.test.ts.
+// Layer 2, route tests. The authenticated open endpoint's gates, its route and its client, against
+// directories under system temporary storage. The opener is a stub, so no application is launched
+// and no path outside the fixture is touched. What may be opened, and the floor under the opener,
+// are tests/routes/files/open-program.test.ts.
+//
+// A case whose file reaches the opener through the default FinderInfo reader, which runs `xattr`,
+// is tagged slow; the other cases run in npm test.
@@ -59,7 +61,0 @@
-    it('requires a path', async () => {
-        const { roots } = fixture();
-        const response = await handleOpen(request({}), TOKEN, roots, checkedIn, vi.fn());
-        expect(response.status).toBe(400);
-        expect(await response.json()).toEqual({ error: 'the path is required' });
-    });
-
@@ -103,14 +99,18 @@
-    it('opens a file by its root and its path under that root, once, at its real path', async () => {
-        const { report, roots } = withFiles();
-        const opener = vi.fn();
-        const response = await handleOpen(
-            request({ root: 'hub', path: 'projects/active/alpha/report.docx' }),
-            TOKEN,
-            roots,
-            checkedIn,
-            opener
-        );
-        expect(response.status).toBe(200);
-        expect(opener).toHaveBeenCalledOnce();
-        expect(opener).toHaveBeenCalledWith(opened(report));
-    });
+    it(
+        'opens a file by its root and its path under that root, once, at its real path',
+        { tags: ['slow'], timeout: 30_000 },
+        async () => {
+            const { report, roots } = withFiles();
+            const opener = vi.fn();
+            const response = await handleOpen(
+                request({ root: 'hub', path: 'projects/active/alpha/report.docx' }),
+                TOKEN,
+                roots,
+                checkedIn,
+                opener
+            );
+            expect(response.status).toBe(200);
+            expect(opener).toHaveBeenCalledOnce();
+            expect(opener).toHaveBeenCalledWith(opened(report));
+        }
+    );
@@ -118,13 +118,17 @@
-    it("opens a file under a workspace root by that root's key", async () => {
-        const { sheet, roots } = withFiles();
-        const opener = vi.fn();
-        const response = await handleOpen(
-            request({ root: 'work', path: 'deck.xlsx' }),
-            TOKEN,
-            roots,
-            checkedIn,
-            opener
-        );
-        expect(response.status).toBe(200);
-        expect(opener).toHaveBeenCalledExactlyOnceWith(opened(sheet));
-    });
+    it(
+        "opens a file under a workspace root by that root's key",
+        { tags: ['slow'], timeout: 30_000 },
+        async () => {
+            const { sheet, roots } = withFiles();
+            const opener = vi.fn();
+            const response = await handleOpen(
+                request({ root: 'work', path: 'deck.xlsx' }),
+                TOKEN,
+                roots,
+                checkedIn,
+                opener
+            );
+            expect(response.status).toBe(200);
+            expect(opener).toHaveBeenCalledExactlyOnceWith(opened(sheet));
+        }
+    );
@@ -146,21 +150,25 @@
-    it('opens a file by a hub-relative path and by an absolute one in the form without a root', async () => {
-        const { report, sheet, roots } = withFiles();
-        const opener = vi.fn();
-        const relative = await handleOpen(
-            request({ path: 'projects/active/alpha/report.docx' }),
-            TOKEN,
-            roots,
-            checkedIn,
-            opener
-        );
-        const absolute = await handleOpen(
-            request({ path: sheet }),
-            TOKEN,
-            roots,
-            checkedIn,
-            opener
-        );
-        expect(relative.status).toBe(200);
-        expect(absolute.status).toBe(200);
-        expect(opener.mock.calls).toEqual([[opened(report)], [opened(sheet)]]);
-    });
+    it(
+        'opens a file by a hub-relative path and by an absolute one in the form without a root',
+        { tags: ['slow'], timeout: 30_000 },
+        async () => {
+            const { report, sheet, roots } = withFiles();
+            const opener = vi.fn();
+            const relative = await handleOpen(
+                request({ path: 'projects/active/alpha/report.docx' }),
+                TOKEN,
+                roots,
+                checkedIn,
+                opener
+            );
+            const absolute = await handleOpen(
+                request({ path: sheet }),
+                TOKEN,
+                roots,
+                checkedIn,
+                opener
+            );
+            expect(relative.status).toBe(200);
+            expect(absolute.status).toBe(200);
+            expect(opener.mock.calls).toEqual([[opened(report)], [opened(sheet)]]);
+        }
+    );
@@ -168,15 +176,19 @@
-    it('opens a file of the engine root, a reserved key the file browser serves', async () => {
-        const { roots } = withFiles();
-        const engine = scratch('oculus-open-engine-');
-        writeFileSync(join(engine, 'notes.docx'), 'PK a document', { mode: 0o644 });
-        const opener = vi.fn();
-        const response = await handleOpen(
-            request({ root: 'engine', path: 'notes.docx' }),
-            TOKEN,
-            [...roots, { key: 'engine', dir: engine }],
-            checkedIn,
-            opener
-        );
-        expect(response.status).toBe(200);
-        expect(opener).toHaveBeenCalledExactlyOnceWith(opened(join(engine, 'notes.docx')));
-    });
+    it(
+        'opens a file of the engine root, a reserved key the file browser serves',
+        { tags: ['slow'], timeout: 30_000 },
+        async () => {
+            const { roots } = withFiles();
+            const engine = scratch('oculus-open-engine-');
+            writeFileSync(join(engine, 'notes.docx'), 'PK a document', { mode: 0o644 });
+            const opener = vi.fn();
+            const response = await handleOpen(
+                request({ root: 'engine', path: 'notes.docx' }),
+                TOKEN,
+                [...roots, { key: 'engine', dir: engine }],
+                checkedIn,
+                opener
+            );
+            expect(response.status).toBe(200);
+            expect(opener).toHaveBeenCalledExactlyOnceWith(opened(join(engine, 'notes.docx')));
+        }
+    );
@@ -184,17 +196,21 @@
-    it('opens a file under a root the saved workspace adds, through the roots the file browser serves', async () => {
-        // The route hands handleOpen browserRoots(locals.server); this is that fold over a saved
-        // workspaces file whose current workspace carries a root of its own.
-        const { hub, work, sheet } = withFiles();
-        const server = servedOver(hub, work);
-        const served = browserRoots(server);
-        const opener = vi.fn();
-        const response = await handleOpen(
-            request({ root: 'work', path: 'deck.xlsx' }),
-            TOKEN,
-            served,
-            checkedIn,
-            opener
-        );
-        expect(response.status).toBe(200);
-        expect(opener).toHaveBeenCalledExactlyOnceWith(opened(sheet));
-    });
+    it(
+        'opens a file under a root the saved workspace adds, through the roots the file browser serves',
+        { tags: ['slow'], timeout: 30_000 },
+        async () => {
+            // The route hands handleOpen browserRoots(locals.server); this is that fold over a
+            // saved workspaces file whose current workspace carries a root of its own.
+            const { hub, work, sheet } = withFiles();
+            const server = servedOver(hub, work);
+            const served = browserRoots(server);
+            const opener = vi.fn();
+            const response = await handleOpen(
+                request({ root: 'work', path: 'deck.xlsx' }),
+                TOKEN,
+                served,
+                checkedIn,
+                opener
+            );
+            expect(response.status).toBe(200);
+            expect(opener).toHaveBeenCalledExactlyOnceWith(opened(sheet));
+        }
+    );
@@ -219,19 +235,11 @@
-    it('reads open.program_ext from the configuration on disk at every request', async () => {
-        const { hub, work, sheet } = withFiles();
-        const server = { ...servedOver(hub, work), openPath: vi.fn() };
-        const post = async (): Promise<Response> =>
-            POST({
-                request: request({ root: 'work', path: 'deck.xlsx' }),
-                locals: { token: TOKEN, server, config: () => loadConfig(server.engine) }
-            } as unknown as Parameters<typeof POST>[0]);
-
-        expect((await post()).status).toBe(200);
-        writeOpenConfig(server.engine, { '.xlsx': 'com.apple.iWork.Numbers' });
-        expect((await post()).status).toBe(200);
-        writeOpenConfig(server.engine, { '.docx': 'com.microsoft.Word' });
-        const refused = await post();
-        expect(refused.status).toBe(403);
-        writeOpenConfig(server.engine, ['.xlsx']);
-        const unusable = await post();
-        expect(unusable.status).toBe(500);
-        expect(((await unusable.json()) as { error: string }).error).toContain('open.program_ext');
+    it(
+        'reads open.program_ext from the configuration on disk at every request',
+        { tags: ['slow'], timeout: 30_000 },
+        async () => {
+            const { hub, work, sheet } = withFiles();
+            const server = { ...servedOver(hub, work), openPath: vi.fn() };
+            const post = async (): Promise<Response> =>
+                POST({
+                    request: request({ root: 'work', path: 'deck.xlsx' }),
+                    locals: { token: TOKEN, server, config: () => loadConfig(server.engine) }
+                } as unknown as Parameters<typeof POST>[0]);
@@ -239,5 +247,12 @@
-        expect(server.openPath.mock.calls).toEqual([
-            [opened(sheet)],
-            [opened(sheet, { '.xlsx': 'com.apple.iWork.Numbers' })]
-        ]);
-    });
+            expect((await post()).status).toBe(200);
+            writeOpenConfig(server.engine, { '.xlsx': 'com.apple.iWork.Numbers' });
+            expect((await post()).status).toBe(200);
+            writeOpenConfig(server.engine, { '.docx': 'com.microsoft.Word' });
+            const refused = await post();
+            expect(refused.status).toBe(403);
+            writeOpenConfig(server.engine, ['.xlsx']);
+            const unusable = await post();
+            expect(unusable.status).toBe(500);
+            expect(((await unusable.json()) as { error: string }).error).toContain(
+                'open.program_ext'
+            );
@@ -244,0 +260,7 @@
+            expect(server.openPath.mock.calls).toEqual([
+                [opened(sheet)],
+                [opened(sheet, { '.xlsx': 'com.apple.iWork.Numbers' })]
+            ]);
+        }
+    );
+
@@ -349 +371 @@
-    it('refuses a path that is not a string, with or without a root', async () => {
+    it('refuses a path that is missing or not a string, with or without a root', async () => {
@@ -352 +374 @@
-        for (const body of [{ root: 'hub', path: 7 }, { root: 'hub' }, { path: ['a'] }]) {
+        for (const body of [{}, { root: 'hub', path: 7 }, { root: 'hub' }, { path: ['a'] }]) {
@@ -360,42 +382,8 @@
-    it('refuses a file without the write token and never calls the opener', async () => {
-        const { roots } = withFiles();
-        const opener = vi.fn();
-        const response = await handleOpen(
-            request({ root: 'hub', path: 'projects/active/alpha/report.docx' }, ''),
-            TOKEN,
-            roots,
-            checkedIn,
-            opener
-        );
-        expect(response.status).toBe(403);
-        expect(opener).not.toHaveBeenCalled();
-    });
-
-    it('says a path could not be opened when the opener fails', async () => {
-        const { roots } = withFiles();
-        const opener = vi.fn(() => Promise.reject(new Error('no application')));
-        const response = await handleOpen(
-            request({ root: 'hub', path: 'projects/active/alpha/report.docx' }),
-            TOKEN,
-            roots,
-            checkedIn,
-            opener
-        );
-        expect(response.status).toBe(500);
-        expect(await response.json()).toEqual({
-            error: 'the path could not be opened: no application'
-        });
-    });
-});
-
-describe('the open client', () => {
-    it('posts a file by its root and path to the open endpoint with the token', async () => {
-        const { report, roots } = withFiles();
-        const opener = vi.fn();
-        setToken(TOKEN);
-        const fetcher = vi.fn(async (_url: string, init: RequestInit) =>
-            handleOpen(
-                request(
-                    JSON.parse(scalar(init.body)),
-                    new Headers(init.headers).get('x-oculus-token') ?? ''
-                ),
+    it(
+        'says a path could not be opened when the opener fails',
+        { tags: ['slow'], timeout: 30_000 },
+        async () => {
+            const { roots } = withFiles();
+            const opener = vi.fn(() => Promise.reject(new Error('no application')));
+            const response = await handleOpen(
+                request({ root: 'hub', path: 'projects/active/alpha/report.docx' }),
@@ -406,3 +394,8 @@
-            )
-        );
-        vi.stubGlobal('fetch', fetcher);
+            );
+            expect(response.status).toBe(500);
+            expect(await response.json()).toEqual({
+                error: 'the path could not be opened: no application'
+            });
+        }
+    );
+});
@@ -410 +403,21 @@
-        const answer = await openFile('hub', 'projects/active/alpha/report.docx');
+describe('the open client', () => {
+    it(
+        'posts a file by its root and path to the open endpoint with the token',
+        { tags: ['slow'], timeout: 30_000 },
+        async () => {
+            const { report, roots } = withFiles();
+            const opener = vi.fn();
+            setToken(TOKEN);
+            const fetcher = vi.fn(async (_url: string, init: RequestInit) =>
+                handleOpen(
+                    request(
+                        JSON.parse(scalar(init.body)),
+                        new Headers(init.headers).get('x-oculus-token') ?? ''
+                    ),
+                    TOKEN,
+                    roots,
+                    checkedIn,
+                    opener
+                )
+            );
+            vi.stubGlobal('fetch', fetcher);
@@ -412,13 +425 @@
-        expect(answer.ok).toBe(true);
-        expect(fetcher).toHaveBeenCalledOnce();
-        const [url, init] = fetcher.mock.calls[0];
-        expect(url).toBe(OPEN_PATH);
-        expect(OPEN_PATH).toBe('/api/open');
-        expect(init.method).toBe('POST');
-        expect(new Headers(init.headers).get('x-oculus-token')).toBe(TOKEN);
-        expect(JSON.parse(scalar(init.body))).toEqual({
-            root: 'hub',
-            path: 'projects/active/alpha/report.docx'
-        });
-        expect(opener).toHaveBeenCalledExactlyOnceWith(opened(report));
-    });
+            const answer = await openFile('hub', 'projects/active/alpha/report.docx');
@@ -426,17 +427,14 @@
-    it("reports an unknown root's refusal once without a token refresh or retry", async () => {
-        const { roots } = withFiles();
-        const opener = vi.fn();
-        setToken(TOKEN);
-        const fetcher = vi.fn(async (_url: string, init: RequestInit) =>
-            handleOpen(request(JSON.parse(scalar(init.body))), TOKEN, roots, checkedIn, opener)
-        );
-        vi.stubGlobal('fetch', fetcher);
-        const answer = await openFile('nowhere', 'report.docx');
-        expect(answer.ok).toBe(false);
-        expect(answer.refused).toEqual([
-            { field: 'root', reason: 'the root names no served root' }
-        ]);
-        expect(fetcher).toHaveBeenCalledOnce();
-        expect(invalidateAll).not.toHaveBeenCalled();
-        expect(opener).not.toHaveBeenCalled();
-    });
+            expect(answer.ok).toBe(true);
+            expect(fetcher).toHaveBeenCalledOnce();
+            const [url, init] = fetcher.mock.calls[0];
+            expect(url).toBe(OPEN_PATH);
+            expect(OPEN_PATH).toBe('/api/open');
+            expect(init.method).toBe('POST');
+            expect(new Headers(init.headers).get('x-oculus-token')).toBe(TOKEN);
+            expect(JSON.parse(scalar(init.body))).toEqual({
+                root: 'hub',
+                path: 'projects/active/alpha/report.docx'
+            });
+            expect(opener).toHaveBeenCalledExactlyOnceWith(opened(report));
+        }
+    );
@@ -444,17 +442,32 @@
-    it('reports an outside-root refusal once without a token refresh or retry', async () => {
-        const { roots } = fixture();
-        const outside = scratch('oculus-open-client-');
-        const opener = vi.fn();
-        setToken(TOKEN);
-        const fetcher = vi.fn(async (_url: string, init: RequestInit) =>
-            handleOpen(request(JSON.parse(scalar(init.body))), TOKEN, roots, checkedIn, opener)
-        );
-        vi.stubGlobal('fetch', fetcher);
-        const answer = await openFolder(outside);
-        expect(answer.ok).toBe(false);
-        expect(answer.refused[0]?.field).toBe('path');
-        expect(answer.error).toBe('the path is outside the configured roots');
-        expect(fetcher).toHaveBeenCalledOnce();
-        expect(invalidateAll).not.toHaveBeenCalled();
-        expect(opener).not.toHaveBeenCalled();
-    });
+    it.each([
+        [
+            'an unknown root',
+            (): ReturnType<typeof openFile> => openFile('nowhere', 'report.docx'),
+            'root',
+            'the root names no served root'
+        ],
+        [
+            'a path outside every root',
+            (): ReturnType<typeof openFolder> => openFolder(scratch('oculus-open-client-')),
+            'path',
+            'the path is outside the configured roots'
+        ]
+    ])(
+        'reports the refusal of %s once, without a token refresh or a retry',
+        async (_row, call, field, reason) => {
+            const { roots } = fixture();
+            const opener = vi.fn();
+            setToken(TOKEN);
+            const fetcher = vi.fn(async (_url: string, init: RequestInit) =>
+                handleOpen(request(JSON.parse(scalar(init.body))), TOKEN, roots, checkedIn, opener)
+            );
+            vi.stubGlobal('fetch', fetcher);
+            const answer = await call();
+            expect(answer.ok).toBe(false);
+            expect(answer.refused).toEqual([{ field, reason }]);
+            expect(answer.error).toBe(reason);
+            expect(fetcher).toHaveBeenCalledOnce();
+            expect(invalidateAll).not.toHaveBeenCalled();
+            expect(opener).not.toHaveBeenCalled();
+        }
+    );
```

`diff -U0 <base>/tests/data/sources/config/catalog/options.test.ts <worktree>/tests/data/sources/config/catalog/options.test.ts` (21 changed lines):

```diff
@@ -1,2 +1,3 @@
-// The options catalog reader and the walk that says which key paths of a config file are options,
-// over a catalog and a file of every wrong type. Compared whole, in the walk's order.
+// Layer 1, data tests. The options catalog reader and the walk that says which key paths of a
+// config file are options, over a catalog and a file of every wrong type. Compared whole, in the
+// walk's order.
@@ -23,5 +23,0 @@
-
-    it('answers the map it was given, whatever it holds', () => {
-        const options = { 'behavior.yml': 3 };
-        expect(catalogOf({ options })).toBe(options);
-    });
@@ -66,0 +63,11 @@
+
+    it('returns a path once for each key that gives it', () => {
+        expect(optionPaths({ 'a.b': 1, a: { b: 2 } }, {})).toEqual(['a.b', 'a.b']);
+    });
+
+    it('is not misled by a reserved name of objects as an entry or as a key', () => {
+        expect(optionPaths({ constructor: 1, toString: { valueOf: 2 } }, {})).toEqual([
+            'constructor',
+            'toString.valueOf'
+        ]);
+    });
```

### The allow list `tests/checks/tree/allow-duplication.txt`

`diff -U0` against the base copy prints these seven removed lines and no added line. Each clone these entries named ended in this sweep (a fold or a deletion in one of its two files). A removed entry whose clone still existed would be reported by 'is not held anywhere under tests', which passes in the final run of `tests/checks`:

```diff
@@ -26 +25,0 @@
-tests/checks/config/config.test.ts tests/data/sources/config/calendar-config.test.ts 1cbbb41f5894 the same 12 lines at 29 and 26, to fold into one place
@@ -28,2 +26,0 @@
-tests/checks/tree/audits.test.ts tests/checks/tree/boundaries.test.ts c8f66082a9d8 the same 11 lines at 220 and 382, to fold into one place
-tests/checks/tree/audits.test.ts tests/checks/tree/negatives.test.ts 04c8b7ed5d87 the same 12 lines at 219 and 138, to fold into one place
@@ -34,3 +30,0 @@
-tests/data/sources/config/calendar-config.test.ts tests/data/sources/config/mail-config.test.ts 1af1b9164200 the same 15 lines at 25 and 25, to fold into one place
-tests/data/sources/config/calendar-config.test.ts tests/data/sources/config/mail-config.test.ts 1c224db4bd3b the same 9 lines at 17 and 17, to fold into one place
-tests/data/sources/config/calendar-config.test.ts tests/data/sources/config/mail-config.test.ts 6b5f31729fcf the same 11 lines at 103 and 109, to fold into one place
@@ -47 +40,0 @@
-tests/routes/git/deposit.test.ts tests/routes/git/git.test.ts f31327bb8175 the same 20 lines at 46 and 56, to fold into one place
```

No threshold, predicate or tolerance was widened: the only other edits of a check's predicate are the removal of the two `isReason('x')` assertions of 'holds every entry of both lists to a reason' in `checks/tree/boundaries.test.ts` and `duplication.test.ts` and the assertions listed in the first part. Many kept tests became table rows without changing an expectation; the title-to-row lists are under 'Folds'.

## First run of each new or changed test

One row per new test (a title or a table row set that is not in the base copy) and per test whose body changed, 154 rows (`spec.md:62-63`). Each row names the one change to a file of `src/` or `utils/` that removes the behaviour the test holds, made on a scratch copy of the final worktree, and the line of the test that failed when the file ran on that copy; where one change fails only some rows or parts, several changes are listed. The runs used the final form of each test (`mut.py` of the session scratchpad, `npx vitest run <file> --testTimeout 0 --reporter=json`).

| Test (file:line now) | Title | Kind | Behaviour removed on a scratch copy of the tree | Failing line and message |
|---|---|---|---|---|
| routes/docs/docs.test.ts:132 | answers 404 for %s | new | in `src/lib/server/content/docs.ts` replaces ``no project with the id ${id}` }, { status: 404` by ``no project with the id ${id}` }, { status: 200` (fails 2 of 2 rows) | routes/docs/docs.test.ts:140: AssertionError: expected 200 to be 404 // Object.is equality |
| routes/docs/docs.test.ts:194 | finds the folder under a nested scan rule when no portfolio was published | changed | in `src/lib/server/content/docs.ts` replaces `rule.nested === true` by `rule.nested === false` | routes/docs/docs.test.ts:207: AssertionError: expected 404 to be 200 // Object.is equality |
| routes/docs/docs.test.ts:417 | %s | new | in `src/lib/server/content/docs.ts` replaces `image.href = routeUrl(base.root, joined);` by `void routeUrl;` (fails 2 of 2 rows) | routes/docs/docs.test.ts:431: AssertionError: expected '<p><img src="fig.png" alt="a" t... |
| routes/docs/docs.test.ts:434 | keeps %s as the author wrote it | new | in `src/lib/server/content/docs.ts` replaces `if (ABSOLUTE.test(image.href) \|\| climbs(joined)) return;` by `void climbs;` (fails 2 of 2 rows) | routes/docs/docs.test.ts:447: AssertionError: expected '<p><img src="/api/file/hub/../e... |
| routes/docs/memories.test.ts:108 | answers 404 for %s | new | in `src/lib/server/content/images.ts` replaces `if (name === null \|\| !isName(name)) return new Response(n...` by `if (name === null \|\| !isName(name)) return new ...` (fails 4 of 6 rows) / in `src/lib/server/content/images.ts` replaces `const type = PICTURES.includes(extension) ? mime.getType(...` by `const type = mime.getType(extension) ?? 'applic...` (fails 1 of 6 rows) / in `src/lib/server/content/images.ts` replaces `    } catch {\n        return new Response(null, { status...` by `    } catch {\n        void 0;\n    }\n    // T...` (fails 1 of 6 rows) | routes/docs/memories.test.ts:116: AssertionError: expected 200 to be 404 // Object.is equality / routes/docs/memories.test.ts:116: AssertionError: expected 200 to be 404 // Object.is equality / routes/docs/memories.test.ts:116: AssertionError: expected 200 to be 404 // Object.is equality |
| routes/docs/memories.test.ts:119 | answers 404 when no folder is configured | new | in `src/lib/server/content/memories.ts` replaces `if (dir === null) return new Response(null, { status: 404...` by `if (dir === null) return new Response(null, { s...` | routes/docs/memories.test.ts:120: AssertionError: expected 200 to be 404 // Object.is equality |
| routes/docs/memories.test.ts:125 | is a name and its data, and every other key is dropped | new | in `src/lib/server/content/memories.ts` replaces `z.object({ name: z.string(), data: z.string() }) satisfies` by `z.looseObject({ name: z.string(), data: z.strin...` | routes/docs/memories.test.ts:127: AssertionError: expected { name: 'a', data: 'b', x: 1 } t... |
| routes/docs/memories.test.ts:130 | is none for %s | new | in `src/lib/server/content/memories.ts` replaces `return held.success ? held.data : null;` by `return held.success ? held.data : (body as Uplo...` (fails 4 of 4 rows) | routes/docs/memories.test.ts:136: AssertionError: expected 'a.png' to be null |
| routes/docs/memories.test.ts:177 | refuses %s, and writes nothing | new | in `src/lib/server/content/memories.ts` replaces `if (bytes.byteLength === 0 \|\| bytes.byteLength > MAX_UPLO...` by ``; in `src/lib/server/content/memories.ts` replaces `if (!isPicture(name, bytes)) return { error: 'data' };` by `` (fails 6 of 6 rows) | routes/docs/memories.test.ts:192: AssertionError: expected { written: 'mislabelled.png' } t... |
| routes/docs/memories.test.ts:237 | %s | new | in `src/lib/server/content/memories.ts` replaces `const MAGIC: Record<string, number[][]> = {` by `const MAGIC: Record<string, number[][]> = {} as...` (fails 3 of 8 rows) / in `src/lib/server/content/memories.ts` replaces `(marks) => bytes.byteLength >= marks.length && marks.ever...` by `(marks) => marks.slice(0, bytes.byteLength).eve...` (fails 2 of 8 rows) / in `src/lib/server/content/memories.ts` replaces `marks.every((byte, at) => bytes[at] === byte)` by `true` (fails 2 of 8 rows) / in `src/lib/server/content/memories.ts` replaces `    '.png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0...` by `    '.png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0...` (fails 1 of 8 rows) | routes/docs/memories.test.ts:252: AssertionError: expected false to be true // Object.is eq... / routes/docs/memories.test.ts:252: AssertionError: expected true to be false // Object.is eq... / routes/docs/memories.test.ts:252: AssertionError: expected true to be false // Object.is eq... / routes/docs/memories.test.ts:252: AssertionError: expected true to be false // Object.is eq... |
| routes/docs/wallpaper.test.ts:86 | serves %s with its own type and a private cache header | new | in `src/lib/server/content/images.ts` replaces `headers: { 'content-type': type, 'cache-control': CACHE }` by `headers: { 'content-type': 'x/y', 'cache-contro...` (fails 3 of 3 rows) | routes/docs/wallpaper.test.ts:93: AssertionError: expected 'x/y' to be 'image/jpeg' // Obje... |
| routes/docs/wallpaper.test.ts:98 | answers 404 for %s | new | in `src/lib/server/content/images.ts` replaces `if (name === null \|\| !isName(name)) return new Response(n...` by `if (name === null \|\| !isName(name)) return new ...` (fails 3 of 4 rows) / in `src/lib/server/content/wallpaper.ts` replaces `if (settings === null) return new Response(null, { status...` by `if (settings === null) return new Response(null...` (fails 1 of 4 rows) | routes/docs/wallpaper.test.ts:113: AssertionError: expected 200 to be 404 // Object.is equality / routes/docs/wallpaper.test.ts:113: AssertionError: expected 200 to be 404 // Object.is equality |
| routes/docs/wallpaper.test.ts:137 | reads the configured directory under the hub of the engine it is given | changed | in `src/lib/server/content/wallpaper.ts` replaces `return { dir, file: held.data.file, pick: pick.data };` by `return { dir, file: held.data.file, pick: 'rand...` | routes/docs/wallpaper.test.ts:139: AssertionError: expected { \u2026(3) } to deeply equal { \u2026(3) } |
| routes/docs/wallpaper.test.ts:146 | serves nothing for %s | new | in `src/lib/server/content/wallpaper.ts` replaces `if (!held.success) return null;` by `if (!held.success) return { dir: String(raw), p...` (fails 4 of 4 rows) | routes/docs/wallpaper.test.ts:152: AssertionError: expected { dir: '[object Object]', \u2026(1) }... |
| routes/edit/audit-mute.test.ts:183 | refuses %s, and the file is byte-identical | new | in `src/lib/server/edit/writes/config/audit-mute.ts` replaces `if (!SIGNATURE.test(signature)) return { error: 'invalid' };` by ``; in `src/lib/server/edit/writes/config/audit-mute.ts` replaces `if (!kept(source, edited, wanted)) return { error: 'inval...` by `` (fails 4 of 4 rows) | routes/edit/audit-mute.test.ts:199: AssertionError: expected 200 to be 400 // Object.is equality |
| routes/edit/rail.test.ts:79 | refuses %s and leaves the file as it was | new | in `src/lib/server/edit/writes/config/rail.ts` replaces `if (read.problems.length > 0) return { error: 'invalid' };` by `` (fails 4 of 4 rows) | routes/edit/rail.test.ts:87: AssertionError: expected 200 to be 400 // Object.is equality |
| routes/edit/undo/undo-removed.test.ts:125 | writes the value, as a map, for the undo of one field of a two-field write on a bare note | retitled | in `src/lib/server/edit/writes/manifest.ts` replaces `Object.fromEntries(Object.entries(wanted).filter(([field]...` by `Object.fromEntries([])` | routes/edit/undo/undo-removed.test.ts:127: AssertionError: expected 'id: alpha\ntype: manuscript\nfo... |
| routes/edit/undo/undo-removed.test.ts:157 | writes the value instead when the file no longer holds what the expanding write left | retitled | in `src/lib/server/edit/writes/manifest.ts` replaces `Object.fromEntries(Object.entries(wanted).filter(([field]...` by `Object.fromEntries([])` | routes/edit/undo/undo-removed.test.ts:159: AssertionError: expected 'id: alpha\ntype: manuscript\nfo... |
| routes/edit/undo/undo.test.ts:51 | writes a manifest field back, logs the undo, and undoes the undo | changed | in `src/lib/server/edit/writes/undo.ts` replaces `{ [change.field]: change.before },\n            'record',` by `{ [change.field]: change.after },\n            ...` | routes/edit/undo/undo.test.ts:57: AssertionError: expected 400 to be 200 // Object.is equality |
| routes/sessions/hook.test.ts:55 | accepts 20 requests in one second and refuses the 21st with 429 | changed | in `src/lib/server/root/hooks.ts` replaces `if (this.#stamps.length >= this.#limit) return false;` by `` | routes/sessions/hook.test.ts:63: AssertionError: expected [ 200, 200, 200, 200, 200, 200, ... |
| routes/sessions/latex.test.ts:257 | answers %s with its word | changed | in `src/lib/server/content/latex/endpoint.ts` replaces `return json({ error }, { status, headers: NO_STORE });` by `return json({ error }, { status: 200, headers: ...` (fails 18 of 18 rows) | routes/sessions/latex.test.ts:284: AssertionError: expected 200 to be 404 // Object.is equality |
| routes/sessions/latex.test.ts:535 | refuses %s-missing when the chosen program is not found | changed | in `src/lib/server/content/latex/endpoint.ts` replaces `latexindent: 'latexindent-missing',` by `latexindent: 'x-missing',` (fails 1 of 3 rows) / in `src/lib/server/content/latex/endpoint.ts` replaces `'tex-fmt': 'tex-fmt-missing',` by `'tex-fmt': 'x-missing',` (fails 1 of 3 rows) / in `src/lib/server/content/latex/endpoint.ts` replaces `badness: 'badness-missing'` by `badness: 'x-missing'` (fails 1 of 3 rows) | routes/sessions/latex.test.ts:551: AssertionError: expected 'x-missing' to be 'latexindent-m... / routes/sessions/latex.test.ts:551: AssertionError: expected 'x-missing' to be 'tex-fmt-missi... / routes/sessions/latex.test.ts:551: AssertionError: expected 'x-missing' to be 'badness-missi... |
| routes/sessions/terminal-actions.test.ts:308 | refuses %s, a main named with a dash and an absolute path, before anything runs | changed | in `src/lib/server/machine/pty/routes.ts` replaces `if (typeof main !== 'string' \|\| !isMainOf(folder.dir, mai...` by `if (typeof main !== 'string') {` (fails 2 of 2 rows) | routes/sessions/terminal-actions.test.ts:318: AssertionError: expected 200 to be 400 // Object.is equality |
| routes/sessions/terminal.test.ts:250 | refuses %s without starting a terminal | new | in `src/lib/server/machine/pty/routes.ts` replaces `if (!known.includes(key)) {` by `if (false) {`; in `src/lib/server/machine/pty/routes.ts` replaces `if (typeof key !== 'string' \|\| key === '' \|\| key.startsWi...` by `if (typeof key !== 'string' \|\| key === '') {` (fails 3 of 3 rows) | routes/sessions/terminal.test.ts:282: AssertionError: expected 200 to be 400 // Object.is equality |
| routes/machine/commands.test.ts:348 | refuses a saved name that %s, writing nothing | new | in `src/lib/server/machine/commands/routes.ts` replaces `if (held === undefined) return null;` by `return null;` (fails 2 of 2 rows) | routes/machine/commands.test.ts:368: AssertionError: expected 200 to be 400 // Object.is equality |
| routes/files/file.test.ts:61 | names %s as %s | new | in `src/lib/server/files/files.ts` replaces `    if (type === null) return FALLBACK;\n    const text` by `    if (type !== null) return FALLBACK;\n    co...` (fails 28 of 28 rows) | routes/files/file.test.ts:91: TypeError: Cannot read properties of null (reading 'start... |
| routes/files/file.test.ts:114 | has nothing for %s | new | in `src/lib/server/files/files.ts` replaces `if (full === null) return new Response(null, { status: 40...` by `if (full === null) return new Response(null, { ...` (fails 9 of 9 rows) | routes/files/file.test.ts:130: AssertionError: expected 200 to be 404 // Object.is equality |
| routes/files/file.test.ts:133 | serves the file beside a link that leads out of the root | new | in `src/lib/server/files/files.ts` replaces `return statSync(found.path).isFile() ? found : { error: '...` by `return { error: 'missing' };` | routes/files/file.test.ts:134: AssertionError: expected 404 to be 200 // Object.is equality |
| routes/files/file.test.ts:263 | has nothing to say about a config with no roots | new | in `src/lib/server/files/files.ts` replaces `if (config.roots === undefined) return { roots, findings };` by `` | routes/files/file.test.ts:264: AssertionError: expected { roots: [], findings: [ { \u2026(3) ... |
| routes/files/file.test.ts:267 | reports roots that are %s as not a list, and keeps no root | new | in `src/lib/server/files/files.ts` replaces `findings.push({ file, key: 'roots', message: 'roots is no...` by `` (fails 2 of 2 rows) | routes/files/file.test.ts:271: AssertionError: expected { roots: [], findings: [] } to s... |
| routes/files/open.test.ts:371 | refuses a path that is missing or not a string, with or without a root | new | in `src/lib/server/files/open.ts` replaces `return json({ error: 'the path is required' }, { status: ...` by `return json({ error: 'the path is required' }, ...` | routes/files/open.test.ts:376: AssertionError: expected 200 to be 400 // Object.is equality |
| routes/files/open.test.ts:442 | reports the refusal of %s once, without a token refresh or a retry | new | in `src/lib/state/client/writes.svelte.ts` replaces `                        refused: held.refused,\n         ...` by `                        refused: [],\n         ...` (fails 2 of 2 rows) | routes/files/open.test.ts:467: AssertionError: expected [] to deeply equal [ { field: 'p... |
| routes/git/git.test.ts:144 | refuses a root it was not given | changed | in `src/lib/server/git/git-routes.ts` replaces `if (!permitted(root, roots)) {` by `if (!permitted(root, roots) && false) {` | routes/git/git.test.ts:150: AssertionError: expected 200 to be 400 // Object.is equality |
| routes/git/untracked.test.ts:107 | waits behind the write chain it is given | changed | in `src/lib/server/git/git-routes.ts` replaces `return options.writes === undefined ? work() : chained(op...` by `return work();` | routes/git/untracked.test.ts:124: AssertionError: expected Promise{\u2026} not to be Promise{\u2026} ... |
| data/demo-hub.test.ts:25 | joins each joint-work entry to the person it names | new | in `src/lib/data/snapshot/normalise.ts` replaces `if (entities.people.has(entry.person)) jointWorkPerson.pu...` by `` | data/demo-hub.test.ts:26: AssertionError: expected [] to deeply equal [ Array(2) ] |
| data/file-ops.test.ts:19 | makes %s as the segments it names | new | `verdict` in `tests/data/file-ops.test.ts` returns undefined (fails 10 of 10 rows) | data/file-ops.test.ts:31: AssertionError: expected undefined to deeply equal [ Arra... |
| data/file-ops.test.ts:46 | refuses %s as %s | new | `verdict` in `tests/data/file-ops.test.ts` returns undefined (fails 17 of 17 rows) | data/file-ops.test.ts:65: AssertionError: expected undefined to be 'invalid' // Obj... |
| data/file-ops.test.ts:76 | takes %s as %s | new | `freeName` in `src/lib/data/file-ops.ts` returns undefined (fails 10 of 10 rows) | data/file-ops.test.ts:100: AssertionError: expected undefined to be 'report copy 2.m... |
| data/file-ops.test.ts:105 | %s of %s | new | `stemLength` in `src/lib/data/file-ops.ts` returns undefined (fails 4 of 4 rows) | data/file-ops.test.ts:111: AssertionError: expected undefined to be 6 // Object.is e... |
| data/accounts/connect.test.ts:14 | takes %s as %s | new | `accountRefusal` in `src/lib/data/accounts/connect.ts` returns undefined (fails 7 of 7 rows) | data/accounts/connect.test.ts:23: AssertionError: expected undefined to be 'taken' // Objec... |
| data/accounts/connect.test.ts:28 | answers %s with the refusal or the half it names | new | `providerHalf` in `src/lib/data/accounts/connect.ts` returns undefined (fails 7 of 7 rows) | data/accounts/connect.test.ts:74: AssertionError: expected undefined to deeply equal { half... |
| data/sources/agents-catalog.test.ts:41 | reads with no finding | new | `shipped` in `tests/data/sources/agents-catalog.test.ts` returns undefined | data/sources/agents-catalog.test.ts:42: TypeError: Cannot read properties of undefined (reading '... |
| data/sources/career.test.ts:175 | reads a file holding %j as one finding | changed | `readCareer` in `src/lib/data/sources/career.ts` returns undefined (fails 5 of 5 rows) | data/sources/career.test.ts:180: TypeError: Cannot read properties of undefined (reading '... |
| data/sources/collections.test.ts:237 | reads a file holding %j as one finding | changed | `readCollections` in `src/lib/data/sources/collections.ts` returns undefined (fails 5 of 5 rows) | data/sources/collections.test.ts:240: TypeError: Cannot read properties of undefined (reading '... |
| data/sources/docs.test.ts:124 | gives each document its path, present or not | new | `projectDocs` in `src/lib/data/sources/docs.ts` returns undefined | data/sources/docs.test.ts:129: TypeError: Cannot read properties of undefined (reading '0') |
| data/sources/docs.test.ts:193 | reads a block holding %j as one finding | changed | `readDoc` in `src/lib/data/sources/docs.ts` returns undefined (fails 4 of 4 rows) | data/sources/docs.test.ts:197: AssertionError: expected undefined to strictly equal { \u2026(... |
| data/sources/personal.test.ts:196 | reads a folder named like an object key as an ordinary id | retitled | `ids` in `tests/data/sources/personal.test.ts` returns undefined | data/sources/personal.test.ts:199: AssertionError: expected undefined to deeply equal [ 'sid... |
| data/sources/present.test.ts:205 | reads %j, a value ending in an image suffix, as an image name | new | `equationIsImage` in `src/lib/data/sources/present.ts` returns undefined (fails 7 of 7 rows) | data/sources/present.test.ts:208: AssertionError: expected undefined to be true // Object.i... |
| data/sources/present.test.ts:212 | reads %j as LaTeX | new | `equationIsImage` in `src/lib/data/sources/present.ts` returns undefined (fails 5 of 5 rows) | data/sources/present.test.ts:215: AssertionError: expected undefined to be false // Object.... |
| data/sources/present.test.ts:230 | reports the image name %s, keeps no equation and still reads the rest of the slide | changed | `doc` in `tests/data/sources/present.test.ts` returns undefined (fails 3 of 3 rows) | data/sources/present.test.ts:242: AssertionError: expected [ { \u2026(3) } ] to deeply equal [ {... |
| data/sources/present.test.ts:272 | draws no equation and reports nothing for %j | changed | `readPresent` in `src/lib/data/sources/present.ts` returns undefined (fails 6 of 6 rows) | data/sources/present.test.ts:286: TypeError: Cannot destructure property 'slides' of '(0 , ... |
| data/sources/config/calendar-config.test.ts:18 | reads one row per account, in the order the file names them | changed | in `src/lib/data/sources/config/local.ts` replaces `config.calendars = connectAccounts(record.calendars, file...` by `config.calendars = []; connectAccounts(record.c...` | data/sources/config/calendar-config.test.ts:22: AssertionError: expected [] to deeply equal [ { provider:... |
| data/sources/config/calendar-config.test.ts:28 | gives the same label to one account of each provider | changed | in `src/lib/data/sources/config/local.ts` replaces `config.calendars = connectAccounts(record.calendars, file...` by `config.calendars = []; connectAccounts(record.c...` | data/sources/config/calendar-config.test.ts:32: AssertionError: expected [] to have a length of 2 but got +0 |
| data/sources/config/calendar-config.test.ts:35 | reads a published calendar link as a row of the provider ics | changed | in `src/lib/data/sources/config/local.ts` replaces `config.calendars = connectAccounts(record.calendars, file...` by `config.calendars = []; connectAccounts(record.c...` | data/sources/config/calendar-config.test.ts:37: AssertionError: expected [] to deeply equal [ { provider:... |
| data/sources/config/calendar-config.test.ts:40 | leaves the list empty when the machine names no account | changed | in `src/lib/data/sources/config/local.ts` replaces `calendars: [],\n        mail: []` by `calendars: [{ provider: 'ics', label: 'x' }],\n...` | data/sources/config/calendar-config.test.ts:42: AssertionError: expected [ { provider: 'ics', label: 'x' ... |
| data/sources/config/calendar-config.test.ts:46 | resolves calendar_dir against the engine when the file gives a relative path | changed | in `src/lib/data/sources/config/local.ts` replaces `['calendar_dir', 'calendarDir'],\n` by `` | data/sources/config/calendar-config.test.ts:48: AssertionError: expected undefined to be '/var/folders/7r... |
| data/sources/config/local.test.ts:32 | answers %j with the sentence it would throw | changed | `checkLocal` in `src/lib/data/sources/config/local.ts` returns undefined (fails 49 of 49 rows) | data/sources/config/local.test.ts:137: AssertionError: expected undefined to be 'local.yml: expe... |
| data/sources/config/mail-config.test.ts:17 | reads one row per account, in the order the file names them | changed | in `src/lib/data/sources/config/local.ts` replaces `config.mail = connectAccounts(record.mail, file, 'mail', {` by `config.mail = []; connectAccounts(record.mail, ...` | data/sources/config/mail-config.test.ts:21: AssertionError: expected [] to deeply equal [ { provider:... |
| data/sources/config/mail-config.test.ts:27 | keeps the two lists apart, so one mailbox may be a calendar and a mail account | changed | in `src/lib/data/sources/config/local.ts` replaces `config.mail = connectAccounts(record.mail, file, 'mail', {` by `config.mail = []; connectAccounts(record.mail, ...` | data/sources/config/mail-config.test.ts:39: AssertionError: expected [] to deeply equal [ { provider:... |
| data/sources/config/mail-config.test.ts:42 | leaves the list empty when the machine names no account | changed | in `src/lib/data/sources/config/local.ts` replaces `calendars: [],\n        mail: []` by `calendars: [],\n        mail: [{ provider: 'goo...` | data/sources/config/mail-config.test.ts:44: AssertionError: expected [ { provider: 'google', label: '... |
| data/sources/config/mail-config.test.ts:48 | resolves mail_dir against the engine when the file gives a relative path | changed | in `src/lib/data/sources/config/local.ts` replaces `['mail_dir', 'mailDir']\n` by `['zz', 'zz']\n` | data/sources/config/mail-config.test.ts:50: AssertionError: expected undefined to be '/var/folders/7r... |
| data/sources/config/merge.test.ts:44 | skips an own __proto__ key %s | new | `flattenText` in `src/lib/data/sources/config/merge.ts` returns undefined (fails 5 of 5 rows) | data/sources/config/merge.test.ts:51: AssertionError: expected undefined to strictly equal { b:... |
| data/sources/config/settings.test.ts:123 | refuses each number that is not a number or is past its bound, naming the key | changed | `calendarSettings` in `src/lib/data/sources/config/settings.ts` returns undefined | data/sources/config/settings.test.ts:131: AssertionError: expected { value: undefined } to strictly... |
| data/sources/config/settings.test.ts:394 | refuses the shipped configuration whose behavior.yml was saved unparseable, as the merge reports it | changed | `processesSettings` in `src/lib/data/sources/config/settings.ts` returns undefined | data/sources/config/settings.test.ts:398: AssertionError: expected { value: undefined } to strictly... |
| data/sources/config/catalog/options.test.ts:64 | returns a path once for each key that gives it | new | `optionPaths` in `src/lib/data/sources/config/catalog/options.ts` returns undefined | data/sources/config/catalog/options.test.ts:65: AssertionError: expected undefined to deeply equal [ 'a.b... |
| data/sources/config/catalog/options.test.ts:68 | is not misled by a reserved name of objects as an entry or as a key | new | `optionPaths` in `src/lib/data/sources/config/catalog/options.ts` returns undefined | data/sources/config/catalog/options.test.ts:69: AssertionError: expected undefined to deeply equal [ 'con... |
| data/prose/latex.test.ts:102 | reads the sections of a text the parser refuses by a line scan: %s | new | `scanSections` in `src/lib/data/prose/latex.ts` returns undefined (fails 3 of 3 rows) | data/prose/latex.test.ts:120: AssertionError: expected { refused: true, \u2026(2) } to deepl... |
| data/prose/markdown.test.ts:145 | draws the list in a document of the route with a folder to resolve figures against | changed | `renderMarkdown` in `src/lib/server/content/docs.ts` returns undefined | data/prose/markdown.test.ts:150: TypeError: Cannot read properties of undefined (reading '... |
| data/prose/markdown.test.ts:154 | draws the list in a document of the route with no folder, the manual | changed | `renderMarkdown` in `src/lib/server/content/docs.ts` returns undefined | data/prose/markdown.test.ts:156: TypeError: Cannot read properties of undefined (reading '... |
| data/helpers/dates.test.ts:15 | reads %s as the count and unit it names | new | `ago` in `src/lib/data/helpers/dates.ts` returns undefined (fails 15 of 15 rows) | data/helpers/dates.test.ts:32: AssertionError: expected undefined to deeply equal { unit... |
| data/helpers/dates.test.ts:37 | writes the local day of %s | new | `localDate` in `src/lib/data/helpers/dates.ts` returns undefined (fails 3 of 3 rows) | data/helpers/dates.test.ts:42: AssertionError: expected undefined to be '2026-01-02' // ... |
| data/helpers/editor-options.test.ts:109 | is a finding when it is %s | new | in `src/lib/data/helpers/editor.ts` replaces `problems.push({ key: 'editor.languages', reason: 'not-a-m...` by `` (fails 2 of 2 rows) | data/helpers/editor-options.test.ts:113: AssertionError: expected [] to deeply equal [ 'editor.lan... |
| data/helpers/editor-options.test.ts:190 | names %s | new | `problemKeys` in `tests/data/helpers/editor-options.test.ts` returns undefined (fails 3 of 3 rows) | data/helpers/editor-options.test.ts:195: AssertionError: expected undefined to deeply equal [ 'edi... |
| data/helpers/editor-options.test.ts:267 | does not read a languages that is %s | new | `parseRepoSettings` in `src/lib/data/helpers/editor.ts` returns undefined (fails 2 of 2 rows) | data/helpers/editor-options.test.ts:271: TypeError: Cannot read properties of undefined (reading '... |
| data/helpers/editor.test.ts:9 | reads %s as %j bytes | new | `paintLimit` in `src/lib/data/helpers/editor.ts` returns undefined (fails 10 of 10 rows) | data/helpers/editor.test.ts:21: AssertionError: expected undefined to be null // Object.i... |
| data/helpers/editor.test.ts:25 | throws naming the key when it is required and there is %s | new | `requirePaintLimit` in `src/lib/data/helpers/editor.ts` returns undefined (fails 2 of 2 rows) | data/helpers/editor.test.ts:29: AssertionError: expected [Function] to throw an error |
| data/helpers/finding-text.test.ts:16 | fills %s | new | `fillPlaceholders` in `src/lib/data/helpers/finding-text.ts` returns undefined (fails 5 of 5 rows) | data/helpers/finding-text.test.ts:33: AssertionError: expected undefined to be '2 projects' // ... |
| data/helpers/finding-text.test.ts:38 | answers the catalog sentence for %s with the arguments in place | new | `findingText` in `src/lib/data/helpers/finding-text.ts` returns undefined (fails 4 of 4 rows) | data/helpers/finding-text.test.ts:51: AssertionError: expected undefined to be 'related names n... |
| data/helpers/finding-text.test.ts:55 | answers the key followed by its arguments for %s, a key the catalog lacks, and never throws | new | `findingText` in `src/lib/data/helpers/finding-text.ts` returns undefined (fails 4 of 4 rows) | data/helpers/finding-text.test.ts:78: AssertionError: expected undefined to be 'constructor' //... |
| data/helpers/guards.test.ts:27 | answers %s with %s | new | `isMap` in `src/lib/data/helpers/guards.ts` returns undefined (fails 9 of 9 rows) | data/helpers/guards.test.ts:38: AssertionError: expected undefined to be false // Object.... |
| data/helpers/guards.test.ts:43 | reads %s as the string or nothing | new | in `src/lib/data/helpers/guards.ts` replaces `return typeof value === 'string' ? value : undefined;` by `return typeof value === 'string' ? value : Stri...` (fails 6 of 9 rows) / `str` in `src/lib/data/helpers/guards.ts` returns undefined (fails 3 of 9 rows) | data/helpers/guards.test.ts:54: AssertionError: expected 'true' to be undefined // Object... / data/helpers/guards.test.ts:54: AssertionError: expected undefined to be 'a' // Object.is... |
| data/helpers/guards.test.ts:59 | reads %s as the string or the fallback | new | `text` in `src/lib/data/helpers/guards.ts` returns undefined (fails 7 of 7 rows) | data/helpers/guards.test.ts:68: AssertionError: expected undefined to be '' // Object.is ... |
| data/helpers/guards.test.ts:73 | keeps %s | new | `strings` in `src/lib/data/helpers/guards.ts` returns undefined (fails 9 of 9 rows) | data/helpers/guards.test.ts:84: AssertionError: expected undefined to deeply equal [] |
| data/helpers/guards.test.ts:89 | is the map itself, so a write through it reaches the value the caller holds | changed | `fields` in `src/lib/data/helpers/guards.ts` returns undefined | data/helpers/guards.test.ts:91: AssertionError: expected undefined to be { a: 1 } // Obje... |
| data/helpers/guards.test.ts:94 | is an empty map for %s | new | `fields` in `src/lib/data/helpers/guards.ts` returns undefined (fails 5 of 5 rows) | data/helpers/guards.test.ts:101: AssertionError: expected undefined to deeply equal {} |
| data/helpers/guards.test.ts:106 | writes %s out as its text or the fallback | new | `scalar` in `src/lib/data/helpers/guards.ts` returns undefined (fails 13 of 13 rows) | data/helpers/guards.test.ts:121: AssertionError: expected undefined to be '' // Object.is ... |
| data/helpers/guards.test.ts:126 | is the value under a key the record holds, an undefined one included | retitled | `byKey` in `src/lib/data/helpers/guards.ts` returns undefined | data/helpers/guards.test.ts:127: AssertionError: expected undefined to be 1 // Object.is e... |
| data/helpers/guards.test.ts:138 | reads %s of a list of two | new | in `src/lib/data/helpers/guards.ts` replaces `return index >= 0 && index < list.length ? list[index] : ...` by `return list.at(Math.min(index, list.length - 1));` (fails 2 of 4 rows) / `item` in `src/lib/data/helpers/guards.ts` returns undefined (fails 2 of 4 rows) | data/helpers/guards.test.ts:144: AssertionError: expected 'b' to be undefined // Object.is... / data/helpers/guards.test.ts:144: AssertionError: expected undefined to be 'a' // Object.is... |
| data/helpers/guards.test.ts:149 | reads %s as the number or null | new | `numericSetting` in `src/lib/data/helpers/guards.ts` returns undefined (fails 4 of 4 rows) | data/helpers/guards.test.ts:155: AssertionError: expected undefined to be 14 // Object.is ... |
| data/helpers/guards.test.ts:160 | answers %s with %s | new | `sameInOrder` in `src/lib/data/helpers/guards.ts` returns undefined (fails 7 of 7 rows) | data/helpers/guards.test.ts:184: AssertionError: expected undefined to be false // Object.... |
| data/helpers/replace.test.ts:68 | counts %s as the groups it holds | new | `replaceTemplate` in `src/lib/data/helpers/search/replace.ts` returns undefined (fails 5 of 5 rows) | data/helpers/replace.test.ts:75: AssertionError: expected undefined to be '\ue0020\ue003${0}' // Obj... |
| data/helpers/replace.test.ts:96 | refuses %s, which is not what the template makes | new | `groupsFrom` in `src/lib/data/helpers/search/replace.ts` returns undefined (fails 2 of 2 rows) | data/helpers/replace.test.ts:100: AssertionError: expected undefined to be null |
| data/helpers/replace.test.ts:110 | finds %s in a text | new | `hasMarker` in `src/lib/data/helpers/search/replace.ts` returns undefined (fails 5 of 5 rows) | data/helpers/replace.test.ts:117: AssertionError: expected undefined to be true // Object.i... |
| data/helpers/replace.test.ts:137 | reads %s | new | `replacementOf` in `src/lib/data/helpers/search/replace.ts` returns undefined (fails 15 of 15 rows) | data/helpers/replace.test.ts:154: AssertionError: expected undefined to be 'abcabc' // Obje... |
| data/helpers/replace.test.ts:173 | reads %s | new | `replacementOf` in `src/lib/data/helpers/search/replace.ts` returns undefined (fails 2 of 2 rows) | data/helpers/replace.test.ts:177: AssertionError: expected undefined to be '\U' // Object.i... |
| data/helpers/replace.test.ts:202 | writes %s as typed | new | `replacementOf` in `src/lib/data/helpers/search/replace.ts` returns undefined (fails 3 of 3 rows) | data/helpers/replace.test.ts:207: AssertionError: expected undefined to be '$&$$' // Object... |
| data/helpers/search.test.ts:68 | sets the flags of %s | new | `searchQuery` in `src/lib/data/helpers/search/query.ts` returns undefined (fails 4 of 4 rows) | data/helpers/search.test.ts:79: TypeError: Cannot read properties of undefined (reading '... |
| data/helpers/search.test.ts:130 | answers %s with %s | new | `refusalOf` in `src/lib/data/helpers/search/query.ts` returns undefined (fails 15 of 15 rows) | data/helpers/search.test.ts:147: AssertionError: expected undefined to be null // Object.i... |
| data/helpers/search.test.ts:189 | drops %s | new | `pathIn` in `src/lib/data/helpers/search/query.ts` returns undefined (fails 2 of 2 rows) | data/helpers/search.test.ts:193: AssertionError: expected undefined to be 'src/a.ts' // Ob... |
| data/helpers/search.test.ts:207 | takes the cap for a max that is %s | new | `queryFrom` in `src/lib/data/helpers/search/query.ts` returns undefined (fails 4 of 4 rows) | data/helpers/search.test.ts:213: TypeError: Cannot read properties of undefined (reading '... |
| data/helpers/search.test.ts:228 | holds the cap between one and the configured number for %s | new | `clampMax` in `src/lib/data/helpers/search/query.ts` returns undefined (fails 2 of 2 rows) | data/helpers/search.test.ts:232: AssertionError: expected undefined to be 7 // Object.is e... |
| data/helpers/search.test.ts:265 | reads %j as %j | changed | `searchCap` in `src/lib/data/helpers/search/query.ts` returns undefined (10 of 10 rows fail; 1 rows print the same name as another) | data/helpers/search.test.ts:277: AssertionError: expected undefined to be +0 // Object.is ... |
| data/helpers/files/opens-in-program.test.ts:20 | names the checked-in application for every listed extension, under a folder and in any case | changed | `programFor` in `src/lib/data/helpers/files/opens-in-program.ts` returns undefined | data/helpers/files/opens-in-program.test.ts:23: AssertionError: expected undefined to be 'com.microsoft.W... |
| data/helpers/files/opens-in-program.test.ts:28 | names none of the checked-in applications for %s | new | `opensInProgram` in `src/lib/data/helpers/files/opens-in-program.ts` returns undefined (fails 10 of 10 rows) | data/helpers/files/opens-in-program.test.ts:40: AssertionError: expected undefined to be false // Object.... |
| data/helpers/files/opens-in-program.test.ts:43 | reads %s | new | `programFor` in `src/lib/data/helpers/files/opens-in-program.ts` returns undefined (fails 4 of 4 rows) | data/helpers/files/opens-in-program.test.ts:54: AssertionError: expected undefined to be null // Object.i... |
| data/helpers/files/opens-in-program.test.ts:59 | tells %s by its shape | new | `isBundleId` in `src/lib/data/helpers/files/opens-in-program.ts` returns undefined (fails 6 of 6 rows) | data/helpers/files/opens-in-program.test.ts:67: AssertionError: expected undefined to be true // Object.i... |
| data/helpers/files/opens-in-program.test.ts:72 | reads %s | new | `programApps` in `src/lib/data/helpers/files/opens-in-program.ts` returns undefined (fails 11 of 11 rows) | data/helpers/files/opens-in-program.test.ts:101: AssertionError: expected undefined to strictly equal null |
| data/helpers/files/paths.test.ts:21 | names %s by its last non-empty segment | new | `nameOf` in `src/lib/data/helpers/files/paths.ts` returns undefined (fails 4 of 4 rows) | data/helpers/files/paths.test.ts:27: AssertionError: expected undefined to be 'b' // Object.is... |
| data/helpers/files/paths.test.ts:32 | drops %s and keeps the root | new | `trimSlash` in `src/lib/data/helpers/files/paths.ts` returns undefined (fails 4 of 4 rows) | data/helpers/files/paths.test.ts:38: AssertionError: expected undefined to be '/r' // Object.i... |
| data/helpers/files/paths.test.ts:43 | joins by one slash for %s | new | `joinPath` in `src/lib/data/helpers/files/paths.ts` returns undefined (fails 6 of 6 rows) | data/helpers/files/paths.test.ts:51: AssertionError: expected undefined to be '/r/a/b' // Obje... |
| data/helpers/files/paths.test.ts:56 | reads %s as its path below the folder or null | new | `pathUnder` in `src/lib/data/helpers/files/paths.ts` returns undefined (fails 10 of 10 rows) | data/helpers/files/paths.test.ts:68: AssertionError: expected undefined to be null // Object.i... |
| data/helpers/files/paths.test.ts:75 | picks %s for the folder that holds the target most deeply | new | `deepestHolding` in `src/lib/data/helpers/files/paths.ts` returns undefined (fails 2 of 2 rows) | data/helpers/files/paths.test.ts:79: AssertionError: expected undefined to deeply equal { item... |
| data/helpers/files/text-kind.test.ts:18 | reads %s as text | new | `isTextBytes` in `src/lib/data/helpers/files/text-kind.ts` returns undefined (fails 5 of 5 rows) | data/helpers/files/text-kind.test.ts:28: AssertionError: expected undefined to be true // Object.i... |
| data/helpers/files/text-kind.test.ts:31 | reads %s as not text | new | `isTextBytes` in `src/lib/data/helpers/files/text-kind.ts` returns undefined (fails 12 of 12 rows) | data/helpers/files/text-kind.test.ts:54: AssertionError: expected undefined to be false // Object.... |
| data/helpers/files/text-kind.test.ts:57 | reads the window and the one byte after it a caller hands over | changed | `isTextBytes` in `src/lib/data/helpers/files/text-kind.ts` returns undefined | data/helpers/files/text-kind.test.ts:62: AssertionError: expected undefined to be true // Object.i... |
| checks/tree/boundaries.test.ts:457 | catches a shell file reading a store the shell may not read | changed | `findShellStores` in `tests/checks/tree/boundaries.test.ts` returns undefined | checks/tree/boundaries.test.ts:464: AssertionError: expected undefined to deeply equal [ \u2026(2) ] |
| checks/tree/boundaries.test.ts:470 | catches process-wide state outside app.d.ts | changed | `findGlobalState` in `tests/checks/tree/boundaries.test.ts` returns undefined | checks/tree/boundaries.test.ts:484: AssertionError: expected undefined to deeply equal [ Arra... |
| checks/tree/boundaries.test.ts:493 | catches a violation of every row it can be shown one of | changed | `findViolations` in `tests/checks/tree/boundaries.test.ts` returns undefined | checks/tree/boundaries.test.ts:550: AssertionError: expected undefined to deeply equal [ \u2026(11) ] |
| checks/tree/boundaries.test.ts:565 | admits the index module of a folder a row names exactly, and no other module in it | changed | `findViolations` in `tests/checks/tree/boundaries.test.ts` returns undefined | checks/tree/boundaries.test.ts:574: AssertionError: expected undefined to deeply equal [ \u2026(2) ] |
| checks/tree/boundaries.test.ts:589 | catches a view reaching into a primitive, and passes the theme class and its own | changed | `findPrimitiveStyling` in `tests/checks/tree/boundaries.test.ts` returns undefined | checks/tree/boundaries.test.ts:621: AssertionError: expected undefined to deeply equal [ \u2026(2) ] |
| checks/tree/boundaries.test.ts:625 | holds every styling entry to a reason | changed | in `tests/checks/tree/allow-styling.ts` replaces the match of `why: 'the rule at src/lib/shell/keys/PaletteRow...` by `why: 'x'` | checks/tree/boundaries.test.ts:627: AssertionError: expected [ Array(1) ] to deeply equal [] |
| checks/tree/duplication.test.ts:581 | holds every entry of both lists to a reason | changed | `readHeld` in `tests/checks/tree/duplication.test.ts` returns undefined | checks/tree/duplication.test.ts:582: TypeError: HELD is not iterable |
| checks/tree/size.test.ts:134 | runs utils/size-check.sh, which only this test runs, and reports nothing over the tree as it stands | new | creates `src/lib/zz-oversize.ts` | checks/tree/size.test.ts:139: AssertionError: expected 'src/lib/zz-oversize.ts is 1200 ... |
| checks/config/config-folder.test.ts:293 | reads one catalog file per owner and no legacy catalog file | changed | creates `config/text/zz.yml` | checks/config/config-folder.test.ts:298: AssertionError: expected [ 'app.yml', 'findings.yml', \u2026(5... |
| checks/config/config-folder.test.ts:326 | names a group of its own and a path under the hub for every document | changed | in `config/layout.yml` replaces `path: docs/RESEARCH-APPROACH.md, group: help` by `path: /docs/RESEARCH-APPROACH.md, group: help` | checks/config/config-folder.test.ts:332: AssertionError: expected true to be false // Object.is eq... |
| checks/config/config-folder.test.ts:357 | keys every catalogue group by the rail page it holds, in rail order, System after Help | changed | in `config/layout.yml` replaces `  help: { label: "Help", glyph: page, chord: h }` by `  helpx: { label: "Help", glyph: page, chord: h }` | checks/config/config-folder.test.ts:362: AssertionError: expected [ 'focus', 'sessions', \u2026(9) ] to... |
| checks/config/config-folder.test.ts:482 | gives every group a chord and a glyph, and no letter a key the workbench binds | changed | `arrange` in `src/lib/state/workbench/navigation/catalogue.ts` returns undefined | checks/config/config-folder.test.ts:495: TypeError: Cannot read properties of undefined (reading '... |
| checks/config/config-folder.test.ts:538 | reads each file on its own and finds its own keys there and nowhere else | changed | in `config/behavior.yml` replaces the match of `\A` by `zz_extra: 1\n` | checks/config/config-folder.test.ts:543: AssertionError: expected [ 'audit_ignore', 'calendar', \u2026(... |
| checks/config/config.test.ts:107 | accepts distinct Claude labels on equal folder basenames and a matching Codex label | changed | in `src/lib/data/sources/config/local.ts` replaces `const reduced = usageAccountLabel(label);` by `const reduced = 'same';` | checks/config/config.test.ts:119: Error: /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/o... |
| checks/config/config.test.ts:155 | says nothing, and prints nothing, about an unknown key | new | in `src/lib/data/sources/config/local.ts` replaces `if (unknown.length > 0) onUnknown?.(unknown);` by `if (unknown.length > 0) { if (onUnknown) onUnkn...` | checks/config/config.test.ts:159: AssertionError: expected "warn" to not be called at all, ... |
| checks/config/config.test.ts:348 | names a sentence file that does not parse by its key and arguments, without throwing | changed | in `src/lib/data/sources/config/merge.ts` replaces `words: (catalog) => findingText(catalog, 'findings.file.d...` by `words: () => message` | checks/config/config.test.ts:360: AssertionError: expected 'Flow sequence in block collecti... |
| checks/config/options-catalog.test.ts:554 | names %s as missing or not a map of config file names | new | in `tests/checks/config/options-findings.ts` replaces `if (!isMap(config.options)) return ['options: missing or ...` by `` (fails 3 of 3 rows) | checks/config/options-catalog.test.ts:564: AssertionError: expected [ \u2026(11) ] to deeply equal [ Arra... |
| checks/source/add-forms.test.ts:61 | is drawn at most once by a component, since a second would type into its draft | retitled | `twoAddForms` in `tests/checks/source/add-forms.test.ts` returns undefined | checks/source/add-forms.test.ts:62: AssertionError: expected undefined to deeply equal [] |
| checks/source/add-forms.test.ts:66 | reads a form the source draws, and an edit form as no add form | retitled | `entryForms` in `tests/checks/source/add-forms.test.ts` returns undefined | checks/source/add-forms.test.ts:70: TypeError: Cannot read properties of undefined (reading '... |
| checks/source/html-sites.test.ts:256 | takes %s as the catalog own words | new | `isTrustedArgument` in `tests/checks/source/html-sites.test.ts` returns undefined (fails 3 of 3 rows) | checks/source/html-sites.test.ts:261: AssertionError: expected undefined to be true // Object.i... |
| checks/source/html-sites.test.ts:264 | refuses an Intro marked trusted over %s | new | `isTrustedArgument` in `tests/checks/source/html-sites.test.ts` returns undefined (fails 3 of 3 rows) | checks/source/html-sites.test.ts:269: AssertionError: expected undefined to be false // Object.... |
| checks/source/html-sites.test.ts:272 | judges %s by its words rather than skipping the site | new | `isTrusted` in `tests/checks/source/html-sites.test.ts` returns undefined (fails 3 of 3 rows) | checks/source/html-sites.test.ts:277: AssertionError: expected undefined to be true // Object.i... |
| checks/source/html-sites.test.ts:280 | does not read %s as trusted | new | `isTrusted` in `tests/checks/source/html-sites.test.ts` returns undefined (fails 2 of 2 rows) | checks/source/html-sites.test.ts:284: AssertionError: expected undefined to be false // Object.... |
| checks/source/retired.test.ts:29 | name no Config view, no Config card and no local.yml card | retitled | in `README.md` replaces the match of `\A` by `The Config view lists every file.\n` | checks/source/retired.test.ts:30: AssertionError: expected [ Array(1) ] to deeply equal [] |
| checks/source/text.test.ts:61 | draws a catalog line as written, with nothing filled into a glyph-shaped token | changed | `lookup` in `src/lib/state/shared/words/text.ts` returns undefined | checks/source/text.test.ts:65: AssertionError: expected undefined to be '{G.litwatch} wa... |
| checks/source/text.test.ts:74 | carries no glyph token in any line, since every glyph is drawn beside the words | changed | in `config/text/app.yml` replaces `        chat: Chat\n` by `        chat: '{G.warn} Chat'\n` | checks/source/text.test.ts:76: AssertionError: expected [ 'app.chat' ] to deeply equal [] |
| checks/source/text.test.ts:81 | answers the stand-in a name is given, in either mode | new | `glyph` in `src/lib/state/shared/words/text.ts` returns undefined | checks/source/text.test.ts:84: AssertionError: expected undefined to be '(r)' // Object.... |
| checks/source/text.test.ts:91 | throws on a name the glyphs do not hold, in either mode | new | `glyph` in `src/lib/state/shared/words/text.ts` returns undefined | checks/source/text.test.ts:94: AssertionError: expected [Function] to throw an error |
| checks/source/text.test.ts:101 | reads a bracketed stand-in as a tag only while the stand-ins are drawn | changed | `bracketedGlyph` in `src/lib/state/shared/words/text.ts` returns undefined | checks/source/text.test.ts:104: AssertionError: expected undefined to be true // Object.i... |
| checks/utils/cited-lines.test.ts:61 | calls %s MISSING and fails | new | in `utils/cited-lines.mjs` replaces `if (text === '') return 'the line is blank';` by `` (fails 1 of 4 rows) / in `utils/cited-lines.mjs` replaces `if (!existsSync(full)) {` by `if (false) {` (fails 1 of 4 rows) / in `utils/cited-lines.mjs` replaces `if (last < first) {` by `if (false) {` (fails 1 of 4 rows) / in `utils/cited-lines.mjs` replaces `if (/^[{}()[\];,]+$/.test(text)) return 'the line holds o...` by `` (fails 1 of 4 rows) | checks/utils/cited-lines.test.ts:97: AssertionError: expected 'src/rule.ts:4 \| \n1 cited lines... / checks/utils/cited-lines.test.ts:97: AssertionError: expected '' to contain 'MISSING src/rule.... / checks/utils/cited-lines.test.ts:97: AssertionError: expected 'MISSING src/rule.ts:1-9999 the ... / checks/utils/cited-lines.test.ts:97: AssertionError: expected 'src/braces.ts:2 \| };\n1 cited l... |
| checks/utils/cited-lines.test.ts:128 | reads %s | new | in `utils/cited-lines.mjs` replaces `return { root: values.root ?? null, report: positionals[0...` by `return { root: null, report: null };` (fails 3 of 6 rows) / in `utils/cited-lines.mjs` replaces `    } catch {\n        return { root: null, report: null ...` by `    } catch {\n        return { root: null, rep...` (fails 2 of 6 rows) / in `utils/cited-lines.mjs` replaces `report: positionals[0] ?? null };` by `report: positionals[0] ?? 'x' };` (fails 1 of 6 rows) | checks/utils/cited-lines.test.ts:140: AssertionError: expected { root: null, report: null } to ... / checks/utils/cited-lines.test.ts:140: AssertionError: expected { root: null, report: 'x' } to d... / checks/utils/cited-lines.test.ts:140: AssertionError: expected { root: null, report: 'x' } to d... |
| checks/utils/cited-lines.test.ts:143 | prints the usage for a line that does not read | new | in `utils/cited-lines.mjs` replaces `'usage: node utils/cited-lines.mjs [--root <dir>] <report...` by `'use: node utils/cited-lines.mjs\n'` | checks/utils/cited-lines.test.ts:145: AssertionError: expected 'use: node utils/cited-lines.mjs... |
| checks/utils/rename-pillar.test.ts:108 | is %s | new | `rootsOf` in `utils/migrations/rename-program-to-pillar.ts` returns undefined (fails 5 of 5 rows) | checks/utils/rename-pillar.test.ts:115: AssertionError: expected undefined to deeply equal [ '--o... |
| checks/imports/augments.test.ts:37 | is named for %s | new | `findAugments` in `tests/checks/imports/augments.ts` returns undefined (fails 2 of 2 rows) | checks/imports/augments.test.ts:55: AssertionError: expected undefined to deeply equal [ Arra... |
| checks/imports/augments.test.ts:71 | is named for %s | new | `findAugments` in `tests/checks/imports/augments.ts` returns undefined (fails 3 of 3 rows) | checks/imports/augments.test.ts:101: AssertionError: expected undefined to deeply equal [ \u2026(2) ] |
| checks/imports/order.test.ts:29 | holds the %s folders | new | in `tests/checks/imports/order.ts` replaces `function folderOf(id: string): string {` by `for (const layer of Object.keys(ORDER)) ORDER[l...` (fails 6 of 6 rows) | checks/imports/order.test.ts:32: AssertionError: expected [ \u2026(106) ] to deeply equal [] |
| checks/imports/order.test.ts:82 | places every folder of every layer the tree holds, and every sub-folder of an inner order | changed | creates `src/lib/state/zz-new/a.ts` | checks/imports/order.test.ts:83: AssertionError: expected [ Array(1) ] to deeply equal [] |
| checks/look/contrast.test.ts:152 | keeps every pair at ${MINIMUM}:1 in the %s theme | new | in `src/lib/themes/derive.ts` replaces `export const ratio: (a: string, b: string) => number = wc...` by `export const ratio: (a: string, b: string) => n...` | checks/look/contrast.test.ts:158: AssertionError: expected [ \u2026(264) ] to deeply equal [] |
| checks/look/lane-distance.test.ts:214 | keeps every touching pair of lane headers ${MINIMUM} apart in the %s theme | new | in `tests/checks/look/lane-distance.test.ts` replaces `const ciede2000 = differenceCiede2000();` by `const ciede2000 = () => 0;` | checks/look/lane-distance.test.ts:231: AssertionError: expected [ \u2026(22) ] to deeply equal [] |

## History words in added comments and titles

`spec.md:42`: the comment lines and test titles added or changed, found by `diff -r -U0` of each folder against the base copy and a case-insensitive whole-word search of the added lines for `before`, `used to`, `no longer`, `still`, `always has been`, `always had`, `as before`, `previously`, `the step adds` and `after this package lands`. 20 added lines that are comments or titles match; matches in code lines are not listed. Each is judged after the word it matches: a `before` here orders two events or two positions of the behaviour under test (before a save, before a program starts, before the route, before a path) or names the `before` query parameter; a `no longer` here describes a state of the file or the data under test that the code reacts to (a key edited again, a file that cannot be read, a match that is gone). No hit says that a test or the code used to be different, and none names a package or a date, so every hit passes.

- tests/routes/edit/audit-mute.test.ts:4 [comment NEW] // The behavior file is a copy under the system temporary directory, asserted to be inside it before -> judged: orders two events or positions of the behaviour under test; passes.
- tests/routes/edit/config-value.test.ts:3 [comment NEW] // the same writer, the refusal an undo gets once the key was edited again or the file no longer -> judged: describes a state of the data under test that the code reacts to; passes.
- tests/routes/edit/undo/undo-removed.test.ts:157 [title NEW] it('writes the value instead when the file no longer holds what the expanding write left', async () => { -> judged: describes a state of the data under test that the code reacts to; passes.
- tests/routes/edit/undo/undo-removed.test.ts:199 [comment NEW] // which the write removed too, so the upper field returns before the line that now -> judged: orders two events or positions of the behaviour under test; passes.
- tests/routes/edit/undo/undo.test.ts:226 [title NEW] "puts the deck's two lists back to what the save before them left", -> judged: orders two events or positions of the behaviour under test; passes.
- tests/routes/edit/undo/undo.test.ts:661 [title NEW] 'answers unwritable for a deck and a rail list whose file can no longer be read', -> judged: describes a state of the data under test that the code reacts to; passes.
- tests/routes/files/history.test.ts:1 [comment NEW] // Layer 2, route tests. The local history of a file: the copy POST /api/source keeps before a save -> judged: orders two events or positions of the behaviour under test; passes.
- tests/routes/git/changes.test.ts:2 [comment NEW] // before it. Where the request came from is judged before the route, by the origin guard -> judged: orders two events or positions of the behaviour under test; passes.
- tests/routes/git/changes.test.ts:71 [title NEW] it('answers the page before the moment `before` names', { tags: ['slow'] }, async () => { -> judged: orders two events or positions of the behaviour under test; passes.
- tests/routes/replace/ops-replace.test.ts:161 [title NEW] 'refuses `changed` when the line changed since the run, keeps the files before it and writes none after', -> judged: orders two events or positions of the behaviour under test; passes.
- tests/routes/replace/ops-replace.test.ts:188 [title NEW] 'refuses `changed` when the text at the place is no longer the text that was found', -> judged: describes a state of the data under test that the code reacts to; passes.
- tests/routes/replace/ops-replace.test.ts:391 [title NEW] 'records the files done before a refusal, and records nothing when the first is refused', -> judged: orders two events or positions of the behaviour under test; passes.
- tests/routes/replace/preview.test.ts:75 [title NEW] 'leaves a named match that is no longer in the file unreplaced instead of refusing the preview', -> judged: describes a state of the data under test that the code reacts to; passes.
- tests/routes/sessions/latex.test.ts:12 [comment NEW] // slow; a refusal made before any program is started, and the plain readers, run in npm test. -> judged: orders two events or positions of the behaviour under test; passes.
- tests/data/helpers/search.test.ts:2 [comment NEW] // as, the inputs that are refused before anything runs, the window one hit's line is cut to, and -> judged: orders two events or positions of the behaviour under test; passes.
- tests/data/prose/markdown.test.ts:2 [comment NEW] // unique within the document with the GitHub prefix before it, and a paragraph that is `[TOC]` and -> judged: orders two events or positions of the behaviour under test; passes.
- tests/data/sources/feeds.test.ts:3 [comment NEW] // inside it before anything is written; nothing here touches the real hub. -> judged: orders two events or positions of the behaviour under test; passes.
- tests/checks/config/config.test.ts:152 [comment NEW] // The check the source endpoint makes before it writes the machine's own file: it reads a body the -> judged: orders two events or positions of the behaviour under test; passes.
- tests/checks/imports/augments.test.ts:85 [title NEW] 'a reference directive with preserve before its path', -> judged: orders two events or positions of the behaviour under test; passes.
- tests/checks/imports/augments.test.ts:93 [title NEW] 'a reference directive with resolution-mode before its path', -> judged: orders two events or positions of the behaviour under test; passes.

## Unused exports

`sh utils/unused-exports.sh` (knip over the production entry points), run after the last change in the worktree and, with the same command, in a copy of the base tree that has the same `node_modules`, prints 382 lines in the worktree and 382 in the copy, `Unused exports (258)` first in both; the two outputs are identical (`cmp` of the two files, with the copy's path replaced by `X`). Knip reads production code only, so it cannot see an export that lost its test importer; the script over `tests`, `src` and `utils` in the section 'Helpers of other sweeps left unused' covers that.

## Appendix: times

### Quick tier: slowest test of each file (minimum of five runs of the file alone)

Five runs of `npx vitest run <file> --tagsFilter '!slow' --reporter=json` for each of the 90 test files of `tests/routes`, `tests/data` and `tests/checks/utils`, one file at a time. One line per file with a quick test: the quick test with the largest minimum, its times in run order, and the lowest and highest 1-minute load average read just before the five runs.

- `tests/checks/utils/cited-lines.test.ts`: 1.3 ms, times [1.4, 2.8, 1.3, 1.4, 1.4], "the command line reads the root and the report", load not recorded
- `tests/checks/utils/outside-paths.test.ts`: 1.2 ms, times [1.4, 1.3, 1.3, 1.3, 1.2], "the bullets that name entries takes every token of a bullet that does not start with one, and a token that holds parentheses", load not recorded
- `tests/checks/utils/rename-pillar.test.ts`: 2.0 ms, times [2.0, 2.0, 2.6, 2.0, 2.5], "the manifest scan finds every project.yml at any depth under projects/", load not recorded
- `tests/data/accounts/connect.test.ts`: 0.7 ms, times [0.7, 0.7, 0.7, 0.7, 0.7], "a new account takes an unknown provider as mail", load not recorded
- `tests/data/file-ops.test.ts`: 1.0 ms, times [1.1, 1.0, 1.0, 1.0, 1.1], "the names that are made makes folders between as the segments it names", load not recorded
- `tests/data/helpers/dates.test.ts`: 0.8 ms, times [0.8, 0.8, 0.9, 0.9, 0.9], "ago reads 30 seconds as the count and unit it names", load not recorded
- `tests/data/helpers/editor-options.test.ts`: 1.2 ms, times [1.2, 1.2, 1.2, 2.3, 2.5], "editor.languages lists each problem in the Findings view naming its key", load not recorded
- `tests/data/helpers/editor.test.ts`: 0.8 ms, times [0.8, 0.8, 0.8, 0.9, 0.8], "the source editor cap reads a missing block as {} bytes", load not recorded
- `tests/data/helpers/files/languages.test.ts`: 1.2 ms, times [1.2, 1.4, 1.2, 1.2, 1.3], "the tracked map names every language the code window registers and no other, and drops nothing", load not recorded
- `tests/data/helpers/files/nesting.test.ts`: 67.0 ms, times [72.9, 75.6, 70.5, 67.0, 75.0], "the findings says nothing for the shipped patterns", load not recorded
- `tests/data/helpers/files/opens-in-program.test.ts`: 1.0 ms, times [1.0, 1.0, 1.0, 1.0, 1.0], "the application a name opens in names the checked-in application for every listed extension, under a folder and in any case", load not recorded
- `tests/data/helpers/files/paths.test.ts`: 0.6 ms, times [0.6, 1.1, 0.7, 0.7, 0.7], "nameOf names a folder with a trailing slash by its last non-empty segment", load not recorded
- `tests/data/helpers/files/text-kind.test.ts`: 0.7 ms, times [0.7, 0.7, 0.7, 0.7, 0.7], "whether bytes are text reads an empty file as text", load not recorded
- `tests/data/helpers/finding-text.test.ts`: 0.7 ms, times [0.8, 0.7, 1.6, 0.7, 0.8], "fillPlaceholders fills each argument at its position, as often as the template names it", load not recorded
- `tests/data/helpers/guards.test.ts`: 0.7 ms, times [0.7, 0.7, 0.7, 0.7, 0.7], "isMap answers an empty map with {}", load not recorded
- `tests/data/helpers/replace.test.ts`: 0.7 ms, times [0.8, 0.8, 1.8, 0.7, 0.8], "the group template writes every group of the pattern, number 0 and each name, between private-use markers", load not recorded
- `tests/data/helpers/search.test.ts`: 1.0 ms, times [1.0, 1.0, 1.0, 1.0, 1.0], "the argument list reads the pattern as text, ignoring case, when no option is on", load not recorded
- `tests/data/portfolio-config.test.ts`: 9.8 ms, times [10.9, 11.2, 12.5, 10.6, 9.8], "portfolioConfigFrom reads a deck that still holds equations_dir without error and gives the key no effect", load not recorded
- `tests/data/prose/latex.test.ts`: 3.2 ms, times [3.2, 3.2, 3.5, 3.2, 3.4], "readTex sections reads the headings of three real files the parser refuses: 20, 18 and 21", load not recorded
- `tests/data/prose/markdown.test.ts`: 4.7 ms, times [4.9, 4.9, 4.8, 4.7, 4.8], "the code of a document paints a fenced block of a language the highlighter knows", load not recorded
- `tests/data/snapshot/normalise.test.ts`: 1.2 ms, times [1.6, 1.3, 1.2, 1.4, 1.4], "normalise, staleness carries each present document mtime and leaves an absent one without", load not recorded
- `tests/data/snapshot/resources.test.ts`: 13.2 ms, times [18.2, 17.8, 17.0, 16.8, 13.2], "the resources registry holds the three seed entries with their kinds and no finding", load not recorded
- `tests/data/snapshot/validate-shapes.test.ts`: 4.3 ms, times [4.6, 4.3, 6.0, 4.4, 4.5], "validate over fields of the wrong shape reports a key a project.yml carries that the schema does not name, after readManifests", load not recorded
- `tests/data/snapshot/validate.test.ts`: 2.2 ms, times [2.3, 2.3, 2.2, 2.2, 2.2], "validate reports nothing on a manifest that is entirely in order", load not recorded
- `tests/data/sources/agents-catalog.test.ts`: 7.2 ms, times [7.4, 7.4, 7.2, 7.3, 7.6], "the shipped agents catalog reads with no finding", load not recorded
- `tests/data/sources/career.test.ts`: 3.5 ms, times [3.6, 4.9, 3.8, 3.5, 3.9], "reading the career file reports a file that does not parse", load not recorded
- `tests/data/sources/collections.test.ts`: 13.9 ms, times [19.4, 13.9, 17.1, 239.6, 17.9], "readCollections reads the data registry from its datasets list and keeps its metadata", load not recorded
- `tests/data/sources/config/calendar-config.test.ts`: 6.3 ms, times [7.8, 8.3, 7.9, 6.3, 6.3], "the calendars rows of the machine own file reads one row per account, in the order the file names them", load not recorded
- `tests/data/sources/config/catalog/agents.test.ts`: 1.5 ms, times [1.5, 1.5, 1.5, 1.5, 1.5], "cacheModels lists no model for 3", load not recorded
- `tests/data/sources/config/catalog/options.test.ts`: 1.3 ms, times [1.3, 1.4, 1.3, 1.3, 1.3], "catalogOf answers an empty catalog for {}", load not recorded
- `tests/data/sources/config/catalogs.test.ts`: 90.3 ms, times [101.0, 95.7, 90.3, 93.6, 102.6], "themeFindings reports a code theme that is a number or null", load not recorded
- `tests/data/sources/config/languages.test.ts`: 78.8 ms, times [86.5, 78.8, 84.0, 85.1, 87.6], "languageFindings reports nothing for a config without the key", load not recorded
- `tests/data/sources/config/local.test.ts`: 6.2 ms, times [8.9, 12.0, 6.2, 6.3, 8.2], "a path key of local.yml keeps sessions_overrides without ~/ as absolute or under the engine folder", load not recorded
- `tests/data/sources/config/mail-config.test.ts`: 6.1 ms, times [8.5, 8.3, 8.1, 6.1, 6.2], "the mail rows of the machine own file reads one row per account, in the order the file names them", load not recorded
- `tests/data/sources/config/merge.test.ts`: 6.8 ms, times [6.8, 15.2, 8.5, 8.3, 9.9], "loadConfig merges the files in name order, a later file winning, and names the key read twice", load not recorded
- `tests/data/sources/config/rail.test.ts`: 0.7 ms, times [0.7, 0.8, 0.7, 0.7, 0.7], "railRows answers null for "x"", load not recorded
- `tests/data/sources/config/settings.test.ts`: 83.7 ms, times [91.4, 87.8, 83.7, 86.3, 89.7], "processesSettings refuses the shipped configuration whose behavior.yml was saved unparseable, as the merge reports it", load not recorded
- `tests/data/sources/docs.test.ts`: 5.1 ms, times [6.5, 5.1, 7.4, 7.8, 5.6], "readDoc splits an empty block and a block closed by three dots", load not recorded
- `tests/data/sources/feeds.test.ts`: 2.1 ms, times [3.9, 3.7, 4.2, 2.1, 4.1], "readFeeds over feed files of the wrong shape skips a run log line that is not text, and an entry that is not a map", load not recorded
- `tests/data/sources/manifests.test.ts`: 24.6 ms, times [164.9, 25.3, 24.6, 276.1, 203.2], "readManifests keeps a ghost folder id while removing its filing prefix from the title", load not recorded
- `tests/data/sources/personal.test.ts`: 11.0 ms, times [15.7, 15.7, 15.4, 14.8, 11.0], "the fields of a manifest reads a status of the vocabulary exactly", load not recorded
- `tests/data/sources/present.test.ts`: 3.7 ms, times [4.0, 3.7, 3.8, 4.8, 4.1], "the deck file read from values of the wrong shape reads the fields of a slide by their own shapes and drops what is of another", load not recorded
- `tests/data/sources/registries.test.ts`: 12.7 ms, times [18.2, 16.3, 14.4, 12.7, 13.4], "readRegistries reads entries with their provenance and returns the other keys as meta", load not recorded
- `tests/routes/config-seed.test.ts`: 1.0 ms, times [1.0, 1.0, 1.0, 1.0, 1.1], "the server's seed is at least as new as the held push when that push is another configuration, and carries the read", load not recorded
- `tests/routes/docs/diagrams.test.ts`: 12.6 ms, times [19.9, 12.6, 18.1, 17.6, 14.9], "the diagram route serves a diagram of the folder as an SVG image that loads and runs nothing", load not recorded
- `tests/routes/docs/docs.test.ts`: 21.7 ms, times [23.8, 22.7, 21.7, 23.9, 21.9], "the document endpoint renders a README as HTML", load not recorded
- `tests/routes/docs/memories.test.ts`: 14.0 ms, times [20.8, 16.4, 14.0, 28.0, 15.2], "the picture list answers the picture extensions in name order, each with its size, and nothing else", load not recorded
- `tests/routes/docs/wallpaper.test.ts`: 13.3 ms, times [13.3, 13.6, 14.0, 13.7, 13.7], "the response serves a-first with its own type and a private cache header", load not recorded
- `tests/routes/edit/audit-mute.test.ts`: 71.4 ms, times [79.5, 74.1, 71.4, 83.1, 77.3], "the audit mute write parks one signature and keeps every other byte of the file", load not recorded
- `tests/routes/edit/rail.test.ts`: 81.9 ms, times [231.8, 87.4, 89.2, 85.0, 81.9], "the rail write writes the list in its order and keeps every other line of the file", load not recorded
- `tests/routes/edit/roots.test.ts`: 80.2 ms, times [86.1, 86.7, 81.7, 87.2, 80.2], "the roots write appends the folder as an entry under a key made from its name, keeping every other line", load not recorded
- `tests/routes/edit/side-project-writes.test.ts`: 86.4 ms, times [93.9, 256.6, 90.8, 91.8, 86.4], "a side project is not found by the manifest write under its slug", load not recorded
- `tests/routes/edit/undo/undo-removed.test.ts`: 85.6 ms, times [90.3, 90.5, 85.6, 86.5, 90.5], "taking a removed field back where it stood gives a title back with its quotes and its comment", load not recorded
- `tests/routes/edit/undo/undo.test.ts`: 95.9 ms, times [247.9, 100.5, 364.6, 99.1, 95.9], "taking a change back writes a manifest field back, logs the undo, and undoes the undo", load not recorded
- `tests/routes/edit/write.test.ts`: 99.2 ms, times [100.5, 105.5, 103.2, 106.1, 99.2], "the deck write saves the selection in the order the reader left the deck in", load not recorded
- `tests/routes/files/file-undo.test.ts`: 86.9 ms, times [95.3, 86.9, 99.5, 95.5, 88.2], "taking a trash back refuses the undo of a delete whose copy was pruned, and writes nothing", load not recorded
- `tests/routes/files/file.test.ts`: 13.5 ms, times [25.0, 15.2, 13.5, 13.5, 15.4], "serving a file under a root serves an html file with its type and a private cache header", load not recorded
- `tests/routes/files/fs.test.ts`: 15.7 ms, times [21.0, 15.8, 16.8, 15.7, 24.2], "the fs route, writing keeps both changes when two adds are in flight at once", load not recorded
- `tests/routes/files/history.test.ts`: 39.6 ms, times [42.8, 46.8, 46.5, 242.2, 39.6], "restoring a copy writes the copy back, and the history gains the text it replaced", load not recorded
- `tests/routes/files/open-program.test.ts`: 19.2 ms, times [19.8, 19.4, 19.4, 19.5, 19.2], "a file handed to the application its extension names refuses a double extension and every type the map names no application for, in either form", load not recorded
- `tests/routes/files/open.test.ts`: 14.6 ms, times [14.9, 14.7, 14.8, 14.6, 14.7], "the open endpoint requires the write token", load not recorded
- `tests/routes/files/project-files.test.ts`: 59.6 ms, times [63.3, 61.9, 59.6, 59.7, 60.3], "the project-files route answers 400 when the request names no project", load not recorded
- `tests/routes/files/search.test.ts`: 9.7 ms, times [10.2, 9.8, 10.1, 9.7, 10.0], "the gates refuses a request without the write token", load not recorded
- `tests/routes/files/source.test.ts`: 11.9 ms, times [13.3, 13.9, 13.7, 11.9, 14.0], "POST /api/source requires the current write token", load not recorded
- `tests/routes/git/changes.test.ts`: 17.9 ms, times [17.9, 41.8, 18.5, 19.3, 22.0], "the change log endpoint answers the newest page first, with the page size it used", load not recorded
- `tests/routes/git/deposit.test.ts`: 11.8 ms, times [15.4, 14.3, 13.8, 13.8, 11.8], "the ids a deposit may name, over a hub whose scan carries the side-projects tier holds the manuscript and not the side project", load not recorded
- `tests/routes/git/git.test.ts`: 91.7 ms, times [95.6, 94.7, 94.5, 93.5, 91.7], "the git endpoint refuses a request with no token", load not recorded
- `tests/routes/machine/commands.test.ts`: 93.9 ms, times [102.0, 101.9, 99.8, 97.5, 93.9], "POST /api/commands saves a command for the repository, private, and logs the change", load not recorded
- `tests/routes/machine/hpc.test.ts`: 3.5 ms, times [3.5, 3.5, 3.5, 3.5, 3.5], "HPC route returns 400 for a bad body or id", load not recorded
- `tests/routes/machine/lines.test.ts`: 11.4 ms, times [11.5, 11.4, 11.8, 11.4, 11.4], "the line count route answers with the count", load not recorded
- `tests/routes/page.test.ts`: 2.1 ms, times [2.1, 2.1, 2.3, 2.2, 3.6], "the page load installs the catalogs the server shipped and raises the generation once", load not recorded
- `tests/routes/replace/ops-replace.test.ts`: 67.9 ms, times [68.4, 68.4, 159.9, 67.9, 68.1], "what stops a replace refuses `denied` for a file its mode locks, and writes nothing", load not recorded
- `tests/routes/replace/preview.test.ts`: 61.0 ms, times [62.9, 62.5, 64.9, 61.0, 61.7], "the preview of a replace in one file refuses with the word of the check: binary, missing, outside, protected and bad-query", load not recorded
- `tests/routes/sessions/compose.test.ts`: 7.0 ms, times [13.0, 7.3, 17.0, 7.7, 7.0], "POST /api/terminal, the compose action starts the agent with its picks and the prompt as one argument, in the workspace", load not recorded
- `tests/routes/sessions/hook.test.ts`: 5.6 ms, times [5.6, 6.3, 6.2, 6.2, 5.8], "POST /api/hook answers 200 with ok for the hook's post", load not recorded
- `tests/routes/sessions/latex.test.ts`: 12.5 ms, times [12.7, 13.1, 12.7, 12.5, 103.8], "GET /api/latex for a project answers one row per main file, with the folder and the errors of the last build", load not recorded
- `tests/routes/sessions/terminal-actions.test.ts`: 13.0 ms, times [14.8, 13.0, 18.0, 242.6, 19.7], "POST /api/terminal, the latex action over a folder of a root starts the terminal in that folder with the program the main file names", load not recorded
- `tests/routes/sessions/terminal-edit.test.ts`: 87.6 ms, times [96.6, 93.1, 97.7, 97.3, 87.6], "the restyle action unsets the option for an empty value, and touches only the option it was given", load not recorded
- `tests/routes/sessions/terminal.test.ts`: 5.1 ms, times [5.4, 5.2, 5.3, 5.1, 5.7], "GET /api/terminal after a write lists a terminal immediately after POST starts it", load not recorded
- `tests/routes/sessions/transcript.test.ts`: 9.2 ms, times [9.2, 10.9, 9.7, 9.3, 9.4], "GET /api/transcript answers the turns of the session the payload holds", load not recorded

### Quick tier: tests whose minimum is 80 ms or more

- 99.2 ms, times [100.5, 105.5, 103.2, 106.1, 99.2], `tests/routes/edit/write.test.ts`, "the deck write saves the selection in the order the reader left the deck in"
- 96.1 ms, times [104.2, 106.4, 110.7, 96.1, 253.0], `tests/routes/edit/write.test.ts`, "the deck write writes nothing when the file already holds exactly those two lists"
- 95.9 ms, times [247.9, 100.5, 364.6, 99.1, 95.9], `tests/routes/edit/undo/undo.test.ts`, "taking a change back writes a manifest field back, logs the undo, and undoes the undo"
- 94.4 ms, times [96.9, 110.1, 95.8, 107.3, 94.4], `tests/routes/edit/write.test.ts`, "the deck write saves a selection naming an archived project, and the file holds it"
- 94.0 ms, times [105.8, 97.4, 97.3, 94.9, 94.0], `tests/routes/edit/write.test.ts`, "the deck write writes both lists into the deck file and keeps every other byte of it"
- 93.9 ms, times [102.0, 101.9, 99.8, 97.5, 93.9], `tests/routes/machine/commands.test.ts`, "POST /api/commands saves a command for the repository, private, and logs the change"
- 91.7 ms, times [95.6, 94.7, 94.5, 93.5, 91.7], `tests/routes/git/git.test.ts`, "the git endpoint refuses a request with no token"
- 90.3 ms, times [91.1, 92.5, 93.7, 90.3, 90.6], `tests/routes/edit/write.test.ts`, "the deck write refuses a deck file whose map the line edit cannot keep, and writes nothing"
- 90.3 ms, times [101.0, 95.7, 90.3, 93.6, 102.6], `tests/data/sources/config/catalogs.test.ts`, "themeFindings reports a code theme that is a number or null"
- 89.2 ms, times [89.5, 89.2, 90.2, 90.9, 91.1], `tests/data/sources/config/catalogs.test.ts`, "iconFindings reports nothing for a glyphs key that is a list"
- 87.6 ms, times [96.6, 93.1, 97.7, 97.3, 87.6], `tests/routes/sessions/terminal-edit.test.ts`, "the restyle action unsets the option for an empty value, and touches only the option it was given"
- 87.5 ms, times [92.1, 108.6, 87.5, 89.1, 104.5], `tests/routes/sessions/terminal-edit.test.ts`, "the restyle action sets @oculus_icon for a glyph of the vocabulary and refuses one that is not there"
- 87.4 ms, times [89.4, 87.7, 91.2, 87.4, 87.6], `tests/routes/edit/write.test.ts`, "the deck write refuses a deck file that is not there, and says which refusal it was"
- 86.9 ms, times [87.4, 90.6, 86.9, 96.0, 87.6], `tests/routes/git/git.test.ts`, "the git endpoint refuses an action it does not know, and a body that is not JSON"
- 86.9 ms, times [95.3, 86.9, 99.5, 95.5, 88.2], `tests/routes/files/file-undo.test.ts`, "taking a trash back refuses the undo of a delete whose copy was pruned, and writes nothing"
- 86.4 ms, times [93.9, 256.6, 90.8, 91.8, 86.4], `tests/routes/edit/side-project-writes.test.ts`, "a side project is not found by the manifest write under its slug"
- 85.6 ms, times [90.3, 90.5, 85.6, 86.5, 90.5], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood gives a title back with its quotes and its comment"
- 83.7 ms, times [91.4, 87.8, 83.7, 86.3, 89.7], `tests/data/sources/config/settings.test.ts`, "processesSettings refuses the shipped configuration whose behavior.yml was saved unparseable, as the merge reports it"
- 83.3 ms, times [88.5, 104.9, 91.3, 88.3, 83.3], `tests/routes/edit/undo/undo.test.ts`, "taking a change back puts a dismissed session back, and takes a dismissal back"
- 81.9 ms, times [231.8, 87.4, 89.2, 85.0, 81.9], `tests/routes/edit/rail.test.ts`, "the rail write writes the list in its order and keeps every other line of the file"
- 81.1 ms, times [106.5, 82.8, 87.4, 81.2, 81.1], `tests/routes/edit/undo/undo.test.ts`, "taking a change back takes a created entry out again and puts a deleted one back"
- 80.2 ms, times [86.1, 86.7, 81.7, 87.2, 80.2], `tests/routes/edit/roots.test.ts`, "the roots write appends the folder as an entry under a key made from its name, keeping every other line"
- 80.0 ms, times [80.6, 80.0, 85.7, 82.8, 82.2], `tests/routes/edit/write.test.ts`, "the write endpoint adds and promotes LinkedIn files through the two write kinds"

Quick tier summary: 1782 tests timed (0 with fewer than five passing runs), the largest minimum is 99.2 ms, 23 tests have a minimum of 80 ms or more, 0 have 100 ms or more.

### Quick tier: tests whose median is 95 ms or more and whose minimum is under 100 ms

The time of each of these tests moves between a fast and a slow value from run to run; the cause was not investigated. The rule of this step classifies by the minimum over the runs, so they are quick, and a single run of the file can show any of them above 100 ms.

- median 246.7 ms, minimum 10.4 ms, times [254.6, 21.4, 10.4, 250.7, 246.7], `tests/data/sources/manifests.test.ts`, "readManifests gives the same order on every run"
- median 243.7 ms, minimum 9.3 ms, times [9.3, 243.7, 262.1, 9.6, 244.6], `tests/data/sources/manifests.test.ts`, "readManifests reports an id that is not the folder name and keeps both values"
- median 195.0 ms, minimum 53.0 ms, times [200.8, 53.0, 54.7, 195.0, 199.2], `tests/routes/edit/undo/undo.test.ts`, "taking a change back writes no change log at all when the target names none"
- median 164.9 ms, minimum 24.6 ms, times [164.9, 25.3, 24.6, 276.1, 203.2], `tests/data/sources/manifests.test.ts`, "readManifests keeps a ghost folder id while removing its filing prefix from the title"
- median 164.3 ms, minimum 67.6 ms, times [254.1, 164.3, 74.5, 67.6, 189.0], `tests/routes/edit/undo/undo.test.ts`, "taking a manifest write back exactly takes a list field out again when the file did not hold it"
- median 126.9 ms, minimum 10.6 ms, times [260.9, 10.6, 126.9, 13.3, 262.6], `tests/data/sources/manifests.test.ts`, "readManifests reads every tier, includes a ghost folder and skips nested decoys"
- median 113.3 ms, minimum 53.7 ms, times [220.7, 183.7, 113.3, 59.6, 53.7], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 200 for a good entry body"
- median 106.4 ms, minimum 96.1 ms, times [104.2, 106.4, 110.7, 96.1, 253.0], `tests/routes/edit/write.test.ts`, "the deck write writes nothing when the file already holds exactly those two lists"
- median 103.2 ms, minimum 99.2 ms, times [100.5, 105.5, 103.2, 106.1, 99.2], `tests/routes/edit/write.test.ts`, "the deck write saves the selection in the order the reader left the deck in"
- median 100.5 ms, minimum 95.9 ms, times [247.9, 100.5, 364.6, 99.1, 95.9], `tests/routes/edit/undo/undo.test.ts`, "taking a change back writes a manifest field back, logs the undo, and undoes the undo"
- median 99.8 ms, minimum 93.9 ms, times [102.0, 101.9, 99.8, 97.5, 93.9], `tests/routes/machine/commands.test.ts`, "POST /api/commands saves a command for the repository, private, and logs the change"
- median 97.3 ms, minimum 94.0 ms, times [105.8, 97.4, 97.3, 94.9, 94.0], `tests/routes/edit/write.test.ts`, "the deck write writes both lists into the deck file and keeps every other byte of it"
- median 96.9 ms, minimum 94.4 ms, times [96.9, 110.1, 95.8, 107.3, 94.4], `tests/routes/edit/write.test.ts`, "the deck write saves a selection naming an archived project, and the file holds it"
- median 96.6 ms, minimum 87.6 ms, times [96.6, 93.1, 97.7, 97.3, 87.6], `tests/routes/sessions/terminal-edit.test.ts`, "the restyle action unsets the option for an empty value, and touches only the option it was given"
- median 95.7 ms, minimum 90.3 ms, times [101.0, 95.7, 90.3, 93.6, 102.6], `tests/data/sources/config/catalogs.test.ts`, "themeFindings reports a code theme that is a number or null"
- median 95.3 ms, minimum 86.9 ms, times [95.3, 86.9, 99.5, 95.5, 88.2], `tests/routes/files/file-undo.test.ts`, "taking a trash back refuses the undo of a delete whose copy was pruned, and writes nothing"

### Slow tier: every slow test, with the basis of its tag

Five runs of `npx vitest run <file> --tagsFilter slow --testTimeout 0 --hookTimeout 0 --reporter=json` for each file that holds a tag, one file at a time. A line gives the minimum, the times in run order, the basis, the file and the title. The basis is the cause the probe recorded in that test (a `child_process` call, a `setTimeout` or `setInterval` of 1 ms or more, a `net` listen or connect), or the minimum when it is 100 ms or more.

- 33.0 ms, times [41.4, 33.0, 33.6, 35.6, 37.2], basis: process, `tests/checks/utils/cited-lines.test.ts`, "the citation check prints the line the tree holds at every citation"
- 30.0 ms, times [31.2, 30.0, 30.7, 33.0, 244.9], basis: process, `tests/checks/utils/cited-lines.test.ts`, "the citation check calls a line of punctuation MISSING and fails"
- 29.8 ms, times [38.0, 29.8, 31.9, 31.3, 224.4], basis: process, `tests/checks/utils/cited-lines.test.ts`, "the citation check calls a range that is too wide, one that runs backwards and a number below one MISSING and fails"
- 29.4 ms, times [32.8, 30.2, 31.6, 30.3, 29.4], basis: process, `tests/checks/utils/cited-lines.test.ts`, "the citation check reads a list of lines, and prints each one once"
- 29.4 ms, times [36.0, 29.9, 30.5, 31.3, 29.4], basis: process, `tests/checks/utils/cited-lines.test.ts`, "the citation check calls a line past the end and a file the tree has not MISSING and fails"
- 29.1 ms, times [32.8, 29.1, 32.0, 32.2, 32.3], basis: process, `tests/checks/utils/cited-lines.test.ts`, "the citation check calls a citation that climbs out of the tree MISSING, and reads nothing there"
- 28.8 ms, times [29.9, 28.8, 29.7, 32.0, 31.9], basis: process, `tests/checks/utils/cited-lines.test.ts`, "the citation check calls a line after the last MISSING and fails"
- 27.7 ms, times [29.7, 27.7, 31.3, 33.7, 32.2], basis: process, `tests/checks/utils/cited-lines.test.ts`, "the citation check refuses a report the tree does not hold"
- 27.4 ms, times [27.5, 27.4, 27.9, 31.1, 30.5], basis: process, `tests/checks/utils/cited-lines.test.ts`, "the command line prints the usage for a line that does not read"
- 736.7 ms, times [757.3, 822.9, 737.1, 736.7, 779.6], basis: process, `tests/checks/utils/claude-usage.test.ts`, "claude-usage.sh preserves an existing target on malformed stdin and replaces it on valid stdin"
- 234.2 ms, times [237.2, 305.2, 243.6, 235.4, 234.2], basis: process, `tests/checks/utils/claude-usage.test.ts`, "claude-usage.sh writes the input unchanged under the account and prints the complete status"
- 219.4 ms, times [235.9, 219.4, 235.4, 235.6, 225.7], basis: process, `tests/checks/utils/claude-usage.test.ts`, "claude-usage.sh leaves absent status parts out"
- 162.1 ms, times [180.4, 198.5, 166.0, 162.1, 175.9], basis: process, `tests/checks/utils/migrate-joint-work.test.ts`, "migrate-joint-work.mjs reads the owner flags, and refuses a flag it does not know or one with nothing after it"
- 114.4 ms, times [119.3, 284.5, 114.4, 218.7, 120.0], basis: process, `tests/checks/utils/migrate-joint-work.test.ts`, "migrate-joint-work.mjs gives a person every organisation their Institution row names, the first one primary"
- 103.4 ms, times [115.5, 112.7, 313.8, 104.9, 103.4], basis: process, `tests/checks/utils/migrate-joint-work.test.ts`, "migrate-joint-work.mjs carries the Institution rows of a handed-in file onto people the registry already holds"
- 60.4 ms, times [62.7, 69.5, 70.5, 64.9, 60.4], basis: process, `tests/checks/utils/migrate-joint-work.test.ts`, "migrate-joint-work.mjs writes a note holding a line break, a colon and a quote so it reads back unchanged"
- 50.6 ms, times [55.1, 61.5, 51.9, 50.6, 55.1], basis: process, `tests/checks/utils/migrate-joint-work.test.ts`, "migrate-joint-work.mjs writes a list inside an entry on one line with no padding inside its brackets, a tag plain"
- 39.6 ms, times [40.2, 53.3, 39.6, 40.0, 41.6], basis: process, `tests/checks/utils/migrate-joint-work.test.ts`, "migrate-joint-work.mjs refuses a --from file that is not there, writing nothing"
- 138.3 ms, times [151.4, 138.3, 146.4, 145.1, 142.2], basis: process, `tests/checks/utils/outside-paths.test.ts`, "the paths a step changed that its brief does not name prints nothing for a changed file the section names"
- 131.7 ms, times [137.1, 131.7, 324.8, 136.1, 616.4], basis: process, `tests/checks/utils/outside-paths.test.ts`, "the paths a step changed that its brief does not name prints the old and the new path of a rename when neither is named"
- 121.1 ms, times [121.4, 164.3, 121.1, 123.9, 476.9], basis: process, `tests/checks/utils/outside-paths.test.ts`, "the paths a step changed that its brief does not name covers tools/oculus/<token> by a token written relative to tools/oculus"
- 120.5 ms, times [145.3, 147.8, 324.2, 120.5, 171.7], basis: process, `tests/checks/utils/outside-paths.test.ts`, "the paths a step changed that its brief does not name lets a token of one segment cover only the path equal to it"
- 119.8 ms, times [119.8, 140.6, 298.7, 152.5, 123.0], basis: process, `tests/checks/utils/outside-paths.test.ts`, "the paths a step changed that its brief does not name lets a token of two segments cover the same two segments under any folder"
- 119.6 ms, times [119.6, 121.3, 125.7, 246.9, 129.6], basis: process, `tests/checks/utils/outside-paths.test.ts`, "the paths a step changed that its brief does not name prints nothing for a file under a folder entry that ends with a slash"
- 119.2 ms, times [119.2, 176.4, 121.9, 132.5, 119.4], basis: process, `tests/checks/utils/outside-paths.test.ts`, "the paths a step changed that its brief does not name prints a path holding a space or a non-ASCII letter as it is"
- 118.7 ms, times [119.2, 118.7, 119.1, 121.8, 494.3], basis: process, `tests/checks/utils/outside-paths.test.ts`, "the paths a step changed that its brief does not name prints a changed file the section does not name"
- 113.3 ms, times [113.3, 520.3, 125.6, 126.1, 326.9], basis: process, `tests/checks/utils/outside-paths.test.ts`, "the paths a step changed that its brief does not name reads only the backticked tokens of the section, and only up to the next heading"
- 113.0 ms, times [113.3, 115.3, 114.5, 116.3, 113.0], basis: process, `tests/checks/utils/outside-paths.test.ts`, "the paths a step changed that its brief does not name prints a deleted file the section does not name"
- 111.2 ms, times [111.2, 112.7, 117.8, 115.2, 311.9], basis: process, `tests/checks/utils/outside-paths.test.ts`, "the paths a step changed that its brief does not name reads a line range after a token as the whole file"
- 111.0 ms, times [111.0, 116.3, 139.3, 113.0, 122.9], basis: process, `tests/checks/utils/outside-paths.test.ts`, "the paths a step changed that its brief does not name prints an untracked file the section does not name, and not an ignored one"
- 92.7 ms, times [236.7, 92.7, 102.2, 95.5, 293.1], basis: process, `tests/checks/utils/outside-paths.test.ts`, "the report that cannot compare exits 2 with a sentence for a base git does not know"
- 80.9 ms, times [80.9, 89.1, 84.5, 296.4, 88.2], basis: process, `tests/checks/utils/outside-paths.test.ts`, "the report that cannot compare exits 2 with a sentence for a brief with no such section"
- 77.5 ms, times [80.5, 77.5, 80.0, 84.3, 322.0], basis: process, `tests/checks/utils/outside-paths.test.ts`, "the report that cannot compare exits 2 with a sentence for a brief that cannot be read"
- 0.8 ms, times [0.8, 0.8, 0.8, 0.8, 0.8], basis: NONE, `tests/data/demo-hub.test.ts`, "the demo hub validates with no findings"
- 0.1 ms, times [0.1, 0.1, 0.1, 0.1, 0.1], basis: NONE, `tests/data/demo-hub.test.ts`, "the demo hub joins each joint-work entry to the person it names"
- 10.1 ms, times [14.2, 10.3, 10.7, 10.7, 10.1], basis: process, `tests/data/sources/personal.test.ts`, "the file kinds that are never read is named for a named pipe, and is not opened"
- 280.3 ms, times [280.3, 330.6, 284.3, 354.7, 318.2], basis: minimum 280.3 ms, `tests/routes/docs/docs.test.ts`, "a document of the hub answers 404 for a missing document while the sentence file does not parse"
- 105.9 ms, times [112.2, 109.9, 114.8, 106.2, 105.9], basis: minimum 105.9 ms, `tests/routes/docs/side-project-docs.test.ts`, "the document endpoint over a side project answers 404 for the slug of a side project when no portfolio was published"
- 200.7 ms, times [229.2, 200.7, 210.7, 202.1, 204.2], basis: minimum 200.7 ms, `tests/routes/edit/audit-mute.test.ts`, "the audit mute write does not know a body whose signature or flag is of the wrong shape"
- 735.1 ms, times [955.0, 766.7, 735.1, 1019.6, 1012.5], basis: minimum 735.1 ms, `tests/routes/edit/config-key.test.ts`, "taking a setting back answers gone once the key has left the file or the file no longer parses"
- 478.0 ms, times [549.5, 535.6, 529.7, 697.8, 478.0], basis: minimum 478.0 ms, `tests/routes/edit/config-key.test.ts`, "taking a setting back puts the file back byte for byte and logs the undo above the write"
- 473.5 ms, times [486.4, 506.9, 496.7, 473.5, 483.7], basis: minimum 473.5 ms, `tests/routes/edit/config-key.test.ts`, "taking a setting back is refused by the same readers, with their sentence, when it would put a refused value back"
- 458.0 ms, times [458.0, 471.3, 536.8, 547.1, 564.9], basis: minimum 458.0 ms, `tests/routes/edit/config-key.test.ts`, "taking a setting back answers moved when the file has been edited since, and leaves it alone"
- 421.2 ms, times [465.5, 421.2, 473.7, 855.5, 713.5], basis: minimum 421.2 ms, `tests/routes/edit/config-key.test.ts`, "several settings written lands two writes made at once, none lost to the other"
- 305.8 ms, times [330.6, 322.1, 605.5, 307.5, 305.8], basis: minimum 305.8 ms, `tests/routes/edit/config-key.test.ts`, "a file the route cannot read or write answers unwritable for a read-only file, and leaves it and its mode as they were"
- 289.0 ms, times [549.7, 289.0, 683.7, 733.5, 318.1], basis: minimum 289.0 ms, `tests/routes/edit/config-key.test.ts`, "a setting written through the route answers the reason of a refusal with a 200, and writes and records nothing"
- 286.5 ms, times [340.0, 286.5, 379.0, 375.7, 376.9], basis: minimum 286.5 ms, `tests/routes/edit/config-key.test.ts`, "a setting written through the route answers what changed, writes the file and records the change as a setting"
- 200.3 ms, times [276.2, 200.3, 309.1, 287.4, 281.0], basis: minimum 200.3 ms, `tests/routes/edit/config-key.test.ts`, "the change log without its bound stops the target before any writer runs, so the file stays as it is"
- 200.1 ms, times [200.1, 315.4, 832.5, 310.7, 266.5], basis: minimum 200.1 ms, `tests/routes/edit/config-key.test.ts`, "a setting written through the route writes nothing and records nothing for the value the file already holds"
- 187.2 ms, times [282.9, 256.2, 187.2, 277.2, 417.5], basis: minimum 187.2 ms, `tests/routes/edit/config-key.test.ts`, "taking a setting back answers gone for a record naming a file the catalog does not track"
- 140.3 ms, times [313.1, 307.0, 285.3, 140.3, 245.3], basis: minimum 140.3 ms, `tests/routes/edit/config-key.test.ts`, "a file the route cannot read or write answers unwritable for a file that is not there, and records nothing"
- 448.2 ms, times [460.5, 572.5, 557.9, 518.9, 448.2], basis: minimum 448.2 ms, `tests/routes/edit/config-value.test.ts`, "taking a list back answers moved once the key was written again, and leaves the file alone"
- 375.3 ms, times [508.5, 520.3, 520.3, 375.3, 553.4], basis: minimum 375.3 ms, `tests/routes/edit/config-value.test.ts`, "taking a list back puts the file back byte for byte and logs the undo above the write"
- 294.4 ms, times [294.4, 324.0, 375.1, 356.8, 406.9], basis: minimum 294.4 ms, `tests/routes/edit/config-value.test.ts`, "a list written through the route answers 400 for a body missing the base, which is not a write, where the same body with it is"
- 281.3 ms, times [397.8, 286.3, 377.4, 281.3, 379.9], basis: minimum 281.3 ms, `tests/routes/edit/config-value.test.ts`, "a list written through the route answers what changed, writes the file and records the change as a setting"
- 261.6 ms, times [261.6, 402.1, 389.5, 397.8, 435.3], basis: minimum 261.6 ms, `tests/routes/edit/config-value.test.ts`, "several lists written refuses the second of two writes of one key made at once with the same base"
- 251.9 ms, times [275.5, 291.7, 251.9, 410.9, 613.9], basis: minimum 251.9 ms, `tests/routes/edit/config-value.test.ts`, "taking a list back answers gone once the file no longer parses"
- 240.7 ms, times [261.2, 240.7, 266.7, 273.0, 488.2], basis: minimum 240.7 ms, `tests/routes/edit/config-value.test.ts`, "a list written through the route answers the reason of a refusal with a 200, and writes and records nothing"
- 110.5 ms, times [111.7, 111.4, 115.6, 110.5, 507.4], basis: minimum 110.5 ms, `tests/routes/edit/roots.test.ts`, "the roots write records the add and the remove, and the undo of each puts the list back"
- 221.5 ms, times [394.0, 221.6, 233.2, 224.0, 221.5], basis: minimum 221.5 ms, `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood gives a follow-up back whichever shape the file held it in, after the editor cleared it"
- 144.2 ms, times [619.1, 145.8, 144.2, 365.9, 152.0], basis: minimum 144.2 ms, `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood gives two neighbouring fields back exactly when the upper one is undone first"
- 144.1 ms, times [157.6, 307.0, 144.1, 356.0, 266.7], basis: minimum 144.1 ms, `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood finds the place again after a line above it was rewritten"
- 139.3 ms, times [150.6, 232.2, 327.3, 139.3, 152.2], basis: minimum 139.3 ms, `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood gives two fields of one write back in either order of the undos"
- 132.9 ms, times [138.8, 133.8, 136.0, 132.9, 260.2], basis: minimum 132.9 ms, `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood gives the shape back when the note was written with its date, whichever shape the note had"
- 130.7 ms, times [135.2, 138.2, 329.5, 137.8, 130.7], basis: minimum 130.7 ms, `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood gives a bare or one-list follow-up back as the text the file held, after an edit of it"
- 124.8 ms, times [124.8, 132.3, 133.8, 134.0, 297.8], basis: minimum 124.8 ms, `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood finds the place again after the same write changed a field above it"
- 117.5 ms, times [118.5, 117.5, 277.8, 285.3, 128.1], basis: minimum 117.5 ms, `tests/routes/edit/undo/undo-removed.test.ts`, "the offset and the text of a removed record puts the lines back for a whole non-negative offset, however large"
- 640.0 ms, times [692.2, 640.0, 685.9, 703.1, 689.5], basis: minimum 640.0 ms, `tests/routes/edit/undo/undo-replaced.test.ts`, "a config-value write of an aligned family, undone gives the undo of the undo back byte for byte as well"
- 466.7 ms, times [524.7, 541.4, 509.1, 641.1, 466.7], basis: minimum 466.7 ms, `tests/routes/edit/undo/undo-replaced.test.ts`, "an undo with no text to put back refuses an undo when the value at the key changed since"
- 444.3 ms, times [497.4, 821.5, 562.0, 558.3, 444.3], basis: minimum 444.3 ms, `tests/routes/edit/undo/undo-replaced.test.ts`, "a config-value write of an aligned family, undone gives the file back byte for byte, as written"
- 423.2 ms, times [525.6, 499.8, 516.0, 532.9, 423.2], basis: minimum 423.2 ms, `tests/routes/edit/undo/undo-replaced.test.ts`, "a config-value write of an aligned family, undone gives the file back byte for byte, with CRLF line ends"
- 415.9 ms, times [591.0, 415.9, 480.2, 532.5, 701.7], basis: minimum 415.9 ms, `tests/routes/edit/undo/undo-replaced.test.ts`, "an undo with no text to put back goes through the value write for a record without the text"
- 423.1 ms, times [487.9, 489.2, 423.1, 462.7, 465.9], basis: minimum 423.1 ms, `tests/routes/edit/undo/undo.test.ts`, "taking back a change whose file cannot be written answers unwritable for a setting whose file has turned read-only"
- 155.5 ms, times [155.5, 156.2, 159.7, 167.5, 241.5], basis: minimum 155.5 ms, `tests/routes/edit/undo/undo.test.ts`, "taking back a change whose file cannot be written answers unwritable for a deck and a rail list whose file can no longer be read"
- 139.8 ms, times [162.2, 148.2, 155.5, 139.8, 145.6], basis: minimum 139.8 ms, `tests/routes/edit/undo/undo.test.ts`, "taking a change back puts the deck's two lists back to what the save before them left"
- 109.1 ms, times [224.1, 124.0, 109.1, 110.7, 118.8], basis: minimum 109.1 ms, `tests/routes/edit/undo/undo.test.ts`, "taking back a change whose file cannot be written answers unwritable for a deck whose file has turned read-only"
- 344.8 ms, times [356.5, 360.2, 344.8, 345.5, 345.0], basis: minimum 344.8 ms, `tests/routes/edit/write.test.ts`, "the deck write does not know a body whose two lists are not lists of words"
- 277.3 ms, times [289.8, 396.4, 279.6, 277.3, 294.2], basis: minimum 277.3 ms, `tests/routes/edit/write.test.ts`, "the deck write refuses an empty selection, a key it does not know and a repeated key"
- 261.4 ms, times [266.7, 397.5, 261.4, 265.4, 289.5], basis: minimum 261.4 ms, `tests/routes/edit/write.test.ts`, "the deck write refuses an order that is not a permutation of the catalog"
- 183.7 ms, times [184.3, 185.0, 183.7, 394.4, 481.9], basis: minimum 183.7 ms, `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes requires a fresh non-empty id for new venues"
- 110.3 ms, times [110.6, 122.6, 114.3, 110.3, 112.0], basis: minimum 110.3 ms, `tests/routes/files/fs.test.ts`, "the fs route, the reader's own bookmarks and notes answers the bookmarks a write left in the file, with their schema"
- 19.9 ms, times [21.1, 25.9, 21.1, 26.0, 19.9], basis: process, `tests/routes/files/fs.test.ts`, "the fs route, reading answers the entries of the folder a root and a path name"
- 16.3 ms, times [17.2, 16.7, 18.1, 17.0, 16.3], basis: process, `tests/routes/files/fs.test.ts`, "the fs route, reading answers the config folder of the engine under the engine root, and nothing above it"
- 13.5 ms, times [14.5, 219.6, 13.9, 13.5, 13.6], basis: process, `tests/routes/files/fs.test.ts`, "the fs route, reading names a saved root the configuration reserves, and does not serve it"
- 585.4 ms, times [626.1, 644.6, 585.4, 601.6, 605.7], basis: minimum 585.4 ms, `tests/routes/files/history.test.ts`, "the copy a save keeps does not count a copy of kind delete among the 50"
- 578.3 ms, times [651.8, 616.0, 590.9, 598.2, 578.3], basis: minimum 578.3 ms, `tests/routes/files/history.test.ts`, "the copy a save keeps keeps the newest 50 copies of kind save and removes the older ones"
- 68.9 ms, times [460.6, 318.9, 68.9, 70.6, 423.6], basis: minimum 282.2 ms over five runs of the file before the test carried a tag (times [385.8, 308.3, 282.2, 297.5, 287.6]); the call that rebuilds the index writes through `writeTextAtomic`, which fsyncs (`src/lib/server/core/json.ts:78-86`), and that call alone took 21.5 to 617.4 ms in 8 timed runs, so the test takes between about 70 and 640 ms with the state of the disk; in five later runs of the slow tier it took [460.6, 318.9, 68.9, 70.6, 423.6], `tests/routes/files/history.test.ts`, "the copy a save keeps builds the index of delete copies again from the folders when it is gone"
- 74.6 ms, times [80.2, 74.6, 75.5, 76.7, 75.2], basis: process, `tests/routes/files/open-program.test.ts`, "a file handed to the application its extension names opens a file of every extension the checked-in map names, with that application"
- 17.7 ms, times [243.8, 20.4, 17.7, 18.5, 19.5], basis: process, `tests/routes/files/open-program.test.ts`, "a file handed to the application its extension names refuses a file whose FinderInfo carries the alias flag, and opens one whose flags do not"
- 9.0 ms, times [9.6, 10.1, 9.0, 10.9, 9.3], basis: process, `tests/routes/files/open-program.test.ts`, "a file handed to the application its extension names opens a file that starts with book but has no mark after it"
- 8.0 ms, times [10.9, 9.8, 8.0, 11.8, 8.8], basis: process, `tests/routes/files/open-program.test.ts`, "what macOS open is run with and the floor under it refuses a file with an execute bit, a bookmark head, an alias flag or no bundle id"
- 7.7 ms, times [11.5, 8.1, 7.7, 8.7, 8.3], basis: process, `tests/routes/files/open-program.test.ts`, "a file handed to the application its extension names reads a file with no FinderInfo as carrying none, and one with the flag as flagged"
- 7.4 ms, times [13.2, 11.7, 7.4, 9.7, 7.6], basis: process, `tests/routes/files/open-program.test.ts`, "a file handed to the application its extension names reads the map it is handed at the request: one naming .txt opens a .txt the checked-in map refuses"
- 7.2 ms, times [8.6, 7.7, 7.5, 7.7, 7.2], basis: process, `tests/routes/files/open-program.test.ts`, "a file handed to the application its extension names opens a listed extension written in mixed case"
- 7.2 ms, times [7.4, 8.2, 8.0, 7.2, 8.2], basis: process, `tests/routes/files/open-program.test.ts`, "a path that is neither a regular file nor a folder refuses a FIFO inside the root in either form without calling the opener"
- 4.8 ms, times [8.3, 4.8, 5.1, 5.0, 5.1], basis: process, `tests/routes/files/open-program.test.ts`, "a file handed to the application its extension names opens a file under a root when an earlier root in the list is gone"
- 4.6 ms, times [5.0, 4.9, 5.1, 4.6, 4.7], basis: process, `tests/routes/files/open-program.test.ts`, "what macOS open is run with and the floor under it takes a real folder and a real listed file with a bundle id"
- 22.9 ms, times [22.9, 23.4, 25.5, 22.9, 24.0], basis: process, `tests/routes/files/open.test.ts`, "the open endpoint over a file opens a file by its root and its path under that root, once, at its real path"
- 19.4 ms, times [25.2, 183.3, 21.3, 19.4, 25.5], basis: process, `tests/routes/files/open.test.ts`, "the open endpoint over a file reads open.program_ext from the configuration on disk at every request"
- 12.3 ms, times [12.3, 13.4, 13.0, 12.7, 12.6], basis: process, `tests/routes/files/open.test.ts`, "the open endpoint over a file opens a file under a root the saved workspace adds, through the roots the file browser serves"
- 9.1 ms, times [12.4, 9.1, 9.8, 9.6, 11.0], basis: process, `tests/routes/files/open.test.ts`, "the open endpoint over a file opens a file by a hub-relative path and by an absolute one in the form without a root"
- 6.1 ms, times [7.1, 7.3, 7.9, 6.1, 7.5], basis: process, `tests/routes/files/open.test.ts`, "the open client posts a file by its root and path to the open endpoint with the token"
- 6.0 ms, times [6.0, 6.3, 6.2, 6.7, 7.2], basis: process, `tests/routes/files/open.test.ts`, "the open endpoint over a file opens a file under a workspace root by that root's key"
- 6.0 ms, times [6.3, 6.4, 6.1, 6.0, 6.7], basis: process, `tests/routes/files/open.test.ts`, "the open endpoint over a file opens a file of the engine root, a reserved key the file browser serves"
- 5.8 ms, times [5.9, 6.6, 5.8, 5.8, 6.4], basis: process, `tests/routes/files/open.test.ts`, "the open endpoint over a file says a path could not be opened when the opener fails"
- 135.8 ms, times [152.7, 182.8, 135.8, 150.6, 152.4], basis: minimum 135.8 ms, `tests/routes/git/changes.test.ts`, "the change log endpoint answers the page before the moment `before` names"
- 837.1 ms, times [839.9, 1150.4, 856.6, 837.1, 866.0], basis: minimum 837.1 ms, `tests/routes/git/git.test.ts`, "the Source Control actions refuses each asking action unconfirmed, and takes it confirmed with its fields"
- 482.8 ms, times [484.9, 742.1, 521.7, 493.3, 482.8], basis: minimum 482.8 ms, `tests/routes/git/git.test.ts`, "the Source Control actions takes each plain action with no confirm"
- 333.3 ms, times [337.2, 511.6, 334.5, 333.3, 339.4], basis: minimum 333.3 ms, `tests/routes/git/git.test.ts`, "a body of the wrong shape refuses a body with no action, an action it does not know and every body that is no map"
- 58.4 ms, times [64.0, 91.1, 58.6, 63.2, 58.4], basis: process, `tests/routes/git/git.test.ts`, "the reads on demand answers a refused read with its reason, and reads a page from 0 when skip is not a number"
- 452.4 ms, times [452.4, 457.7, 688.0, 463.3, 690.9], basis: process, `tests/routes/git/refs.test.ts`, "the reads head=, compare=, refs= and workspace= answers the text HEAD holds, missing and binary"
- 380.8 ms, times [383.7, 395.8, 381.5, 380.8, 382.5], basis: process, `tests/routes/git/refs.test.ts`, "the actions on commits and branches answers a branch git calls unmerged with the code not-merged, and deletes it on Delete Anyway"
- 332.9 ms, times [337.4, 497.2, 614.5, 453.7, 332.9], basis: process, `tests/routes/git/refs.test.ts`, "the reads head=, compare=, refs= and workspace= refuses a root no workspace names for each of the three reads"
- 314.9 ms, times [346.6, 330.5, 392.6, 314.9, 343.5], basis: process, `tests/routes/git/refs.test.ts`, "the actions on commits and branches cherry-picks a confirmed commit and deletes a confirmed merged branch"
- 305.1 ms, times [324.3, 305.1, 314.4, 540.6, 509.1], basis: process, `tests/routes/git/refs.test.ts`, "the reads head=, compare=, refs= and workspace= adds the base of the checked-out branch to the first page of the graph"
- 303.3 ms, times [627.7, 331.8, 585.2, 338.9, 303.3], basis: process, `tests/routes/git/refs.test.ts`, "the actions on commits and branches detaches HEAD at a confirmed hash"
- 293.2 ms, times [454.9, 430.5, 308.5, 293.2, 313.6], basis: process, `tests/routes/git/refs.test.ts`, "the actions on commits and branches makes a branch and a tag at the start point the body names"
- 284.1 ms, times [323.2, 316.9, 422.1, 430.2, 284.1], basis: process, `tests/routes/git/refs.test.ts`, "the reads head=, compare=, refs= and workspace= answers the files of a compare and one file two sides"
- 270.2 ms, times [283.0, 290.8, 270.2, 278.5, 276.1], basis: process, `tests/routes/git/refs.test.ts`, "the reads head=, compare=, refs= and workspace= answers the main worktree file against this worktree file for workspace="
- 153.2 ms, times [177.8, 153.2, 157.6, 155.1, 159.7], basis: process, `tests/routes/git/refs.test.ts`, "the reads head=, compare=, refs= and workspace= lists the refs a picker offers"
- 143.3 ms, times [143.3, 279.9, 156.6, 150.1, 144.7], basis: process, `tests/routes/git/refs.test.ts`, "the actions on commits and branches answers the checked-out branch with no code"
- 177.8 ms, times [184.8, 424.5, 194.4, 190.8, 177.8], basis: process, `tests/routes/git/untracked.test.ts`, "trashUntracked refuses a request the page did not confirm"
- 153.2 ms, times [177.3, 207.3, 171.9, 174.9, 153.2], basis: process, `tests/routes/git/untracked.test.ts`, "trashUntracked refuses a tracked path and a guarded file through the route"
- 144.9 ms, times [279.5, 144.9, 147.8, 147.6, 425.1], basis: process, `tests/routes/git/untracked.test.ts`, "trashUntracked moves a confirmed untracked file to the Trash"
- 128.3 ms, times [128.3, 135.4, 262.5, 130.8, 139.9], basis: process, `tests/routes/git/untracked.test.ts`, "trashUntracked waits behind the write chain it is given"
- 121.5 ms, times [128.6, 134.6, 558.7, 121.5, 133.9], basis: process, `tests/routes/git/untracked.test.ts`, "ignore appends the path without a confirm and answers the file it wrote"
- 119.6 ms, times [122.3, 359.9, 119.6, 120.1, 341.3], basis: process, `tests/routes/git/untracked.test.ts`, "trashUntracked refuses to run without a guard over the machine files"
- 258.6 ms, times [264.6, 262.3, 260.0, 259.9, 258.6], basis: minimum 258.6 ms, `tests/routes/machine/commands.test.ts`, "POST /api/commands saves a line that writes a placeholder inside quotes, after a backslash or in a comment"
- 248.1 ms, times [256.0, 255.3, 254.4, 252.8, 248.1], basis: minimum 248.1 ms, `tests/routes/machine/commands.test.ts`, "POST /api/commands keeps every save of requests in flight together, in the order they came"
- 173.3 ms, times [185.5, 173.3, 351.6, 183.9, 183.0], basis: minimum 173.3 ms, `tests/routes/machine/commands.test.ts`, "POST /api/commands replaces a saved command of the same name and removes one"
- 195.8 ms, times [370.9, 203.9, 205.8, 195.8, 220.8], basis: minimum 195.8 ms, `tests/routes/replace/ops-replace.test.ts`, "a request that is no replace refuses empty items, empty hits, a file named twice and a hit named twice as not-an-action"
- 123.1 ms, times [134.3, 125.6, 123.1, 153.6, 124.6], basis: process, timer, `tests/routes/replace/ops-replace.test.ts`, "what a replace records records the files done before a refusal, and records nothing when the first is refused"
- 116.2 ms, times [121.0, 134.0, 116.4, 116.6, 116.2], basis: process, timer, `tests/routes/replace/ops-replace.test.ts`, "what a replace writes replaces the second of two matches on one line and leaves the first"
- 102.5 ms, times [103.0, 206.1, 105.0, 102.5, 309.5], basis: process, timer, `tests/routes/replace/ops-replace.test.ts`, "what a replace writes reads $1 and \U of a regular expression from the groups ripgrep reports"
- 87.6 ms, times [100.1, 99.7, 87.6, 345.3, 112.8], basis: process, timer, `tests/routes/replace/ops-replace.test.ts`, "what a replace writes counts the place of a match in UTF-16 units on a line with multibyte letters"
- 86.6 ms, times [93.0, 86.6, 248.2, 90.2, 91.8], basis: process, timer, `tests/routes/replace/ops-replace.test.ts`, "what a replace writes replaces every match a request names, in several files"
- 84.5 ms, times [85.4, 88.2, 84.5, 97.5, 85.5], basis: process, timer, `tests/routes/replace/ops-replace.test.ts`, "what a replace records appends one files record naming each file, its kept copy and the file as it is"
- 79.0 ms, times [83.8, 80.7, 89.1, 89.2, 79.0], basis: process, timer, `tests/routes/replace/ops-replace.test.ts`, "what stops a replace refuses `changed` when the line changed since the run, keeps the files before it and writes none after"
- 74.7 ms, times [74.7, 82.2, 77.1, 84.3, 86.6], basis: process, timer, `tests/routes/replace/ops-replace.test.ts`, "what a replace writes replaces a match longer than a hit row is wide, from the whole text the page keeps"
- 61.3 ms, times [66.1, 61.4, 65.7, 61.6, 61.3], basis: process, timer, `tests/routes/replace/ops-replace.test.ts`, "what stops a replace refuses `too_large` for a file over what the history keeps, and for a result over it"
- 54.7 ms, times [57.4, 59.0, 65.8, 55.6, 54.7], basis: process, timer, `tests/routes/replace/ops-replace.test.ts`, "what stops a replace refuses a pattern ripgrep rejects as `search-failed`, and a target with no timeout the same"
- 54.1 ms, times [66.7, 56.2, 54.1, 65.0, 55.3], basis: process, timer, `tests/routes/replace/ops-replace.test.ts`, "what stops a replace refuses `changed` when the text at the place is no longer the text that was found"
- 73.5 ms, times [117.2, 77.6, 77.3, 79.5, 73.5], basis: process, socket, timer, `tests/routes/replace/preview.test.ts`, "the preview request previews 2000 hits in one file through the request the pane forms, which an address of the hits could not carry"
- 67.5 ms, times [72.7, 70.0, 67.5, 267.7, 68.0], basis: process, timer, `tests/routes/replace/preview.test.ts`, "the preview of a replace in one file holds the file as it is on the left and the file with the named matches replaced on the right"
- 59.7 ms, times [66.8, 70.1, 59.7, 95.1, 61.4], basis: process, timer, `tests/routes/replace/preview.test.ts`, "the preview of a replace in one file leaves a named match that is no longer in the file unreplaced instead of refusing the preview"
- 57.9 ms, times [61.4, 69.4, 60.4, 61.3, 57.9], basis: process, timer, `tests/routes/replace/preview.test.ts`, "the preview of a replace in one file applies the groups, the case and the line ends the write would"
- 56.5 ms, times [183.1, 224.2, 56.5, 59.7, 56.5], basis: process, timer, `tests/routes/replace/preview.test.ts`, "the preview of a replace in one file leaves a match it was not named for unreplaced, which is how a dismissed hit stays"
- 52.6 ms, times [53.4, 55.4, 52.6, 64.1, 54.1], basis: socket, timer, `tests/routes/replace/preview.test.ts`, "the preview request refuses a preview posted without the write token and reads nothing"
- 49.1 ms, times [51.7, 50.6, 49.7, 50.2, 49.1], basis: socket, timer, `tests/routes/replace/preview.test.ts`, "the preview request refuses a preview whose hit is no line and place"
- 193.8 ms, times [193.8, 352.9, 197.9, 264.9, 202.3], basis: process, timer, `tests/routes/replace/replace-undo.test.ts`, "taking a replace back writes each file back from its copy and records the undo as a replace that can be taken back"
- 175.7 ms, times [175.8, 183.7, 311.2, 191.5, 175.7], basis: process, timer, `tests/routes/replace/replace-undo.test.ts`, "taking a replace back says `gone` for a file that is no longer there and `copy-gone` for a copy the history lost"
- 156.4 ms, times [170.4, 303.5, 156.4, 172.8, 486.8], basis: process, timer, `tests/routes/replace/replace-undo.test.ts`, "taking a replace back writes the replaced text back when the undo is taken back"
- 89.8 ms, times [381.7, 97.1, 100.9, 106.1, 89.8], basis: process, timer, `tests/routes/replace/replace-undo.test.ts`, "taking a replace back lists the copy a replace kept under the kind `replace` in the file's history"
- 88.8 ms, times [88.8, 305.9, 93.8, 274.7, 89.7], basis: process, timer, `tests/routes/replace/replace-undo.test.ts`, "taking a replace back refuses `moved` after a later edit of one file, and writes neither file"
- 297.8 ms, times [612.1, 340.4, 298.6, 444.8, 297.8], basis: process, `tests/routes/sessions/latex.test.ts`, "every main parameter is checked before a file is read or a program started refuses a name starting with a dash even when a main file has that name"
- 170.6 ms, times [360.1, 170.8, 407.8, 170.6, 371.5], basis: process, `tests/routes/sessions/latex.test.ts`, "GET /api/latex word count answers the number the program printed, run in the folder with the words as arguments"
- 156.8 ms, times [200.4, 158.3, 156.8, 159.7, 157.1], basis: process, `tests/routes/sessions/latex.test.ts`, "POST /api/latex format runs badness with its arguments, the text on standard input"
- 151.2 ms, times [151.2, 163.3, 163.0, 160.9, 157.7], basis: process, `tests/routes/sessions/latex.test.ts`, "POST /api/latex format runs tex-fmt with its arguments, the text on standard input"
- 151.0 ms, times [167.2, 153.1, 182.8, 151.0, 157.3], basis: process, `tests/routes/sessions/latex.test.ts`, "POST /api/latex format runs latexindent with its arguments, the text on standard input"
- 147.4 ms, times [173.2, 147.4, 170.3, 156.3, 172.6], basis: process, `tests/routes/sessions/latex.test.ts`, "GET /api/latex word count answers 502 count-failed when the program reports a failure between its marks"
- 147.4 ms, times [166.1, 166.6, 150.1, 147.4, 222.7], basis: process, `tests/routes/sessions/latex.test.ts`, "POST /api/latex format runs the program its path key names instead of the one on PATH"
- 144.1 ms, times [167.4, 154.9, 144.1, 153.9, 154.9], basis: process, `tests/routes/sessions/latex.test.ts`, "POST /api/latex format answers 502 format-failed when the program exits 1, its standard error never shown"
- 112.9 ms, times [220.2, 114.0, 112.9, 116.1, 120.6], basis: process, `tests/routes/sessions/latex.test.ts`, "GET /api/latex word count does not read a digit in the main file name as the count"
- 103.1 ms, times [103.7, 103.1, 103.1, 103.1, 104.0], basis: process, `tests/routes/sessions/latex.test.ts`, "GET /api/latex word count answers 504 when the program runs past the time limit"
- 103.0 ms, times [103.0, 103.3, 103.1, 103.2, 103.2], basis: process, `tests/routes/sessions/latex.test.ts`, "POST /api/latex format answers 504 past the time limit"
- 2.4 ms, times [2.7, 2.5, 2.4, 2.7, 3.0], basis: process, `tests/routes/sessions/latex.test.ts`, "GET /api/latex word count answers 502 count-missing when the program is not found"
- 1.0 ms, times [1.2, 1.1, 1.2, 1.0, 1.0], basis: process, `tests/routes/sessions/latex.test.ts`, "POST /api/latex format a chosen formatter that is not found refuses latexindent-missing when the chosen program is not found"
- 0.6 ms, times [0.7, 0.6, 0.9, 0.7, 0.7], basis: process, `tests/routes/sessions/latex.test.ts`, "POST /api/latex format a chosen formatter that is not found refuses tex-fmt-missing when the chosen program is not found"
- 0.6 ms, times [0.8, 0.6, 0.7, 0.6, 0.6], basis: process, `tests/routes/sessions/latex.test.ts`, "POST /api/latex format a chosen formatter that is not found refuses badness-missing when the chosen program is not found"
- 159.3 ms, times [170.7, 249.4, 159.3, 172.8, 175.5], basis: process, `tests/routes/sessions/terminal-actions.test.ts`, "latexCommand quotes a main file name as one word, so a shell passes it to latexmk whole"
- 187.2 ms, times [190.3, 196.2, 187.2, 190.2, 233.1], basis: minimum 187.2 ms, `tests/routes/sessions/terminal-edit.test.ts`, "the restyle action refuses a colour outside the eight names, with no tmux command"

Slow tier summary: 171 tests timed; 2 with neither a cause nor a minimum of 100 ms.

## Repair round 1

NOT DONE in this round: none of the ten findings. The three items of the first line of this report that lie outside this step's paths are unchanged: `npm run test:checks` is red on the one staleness test for the two `allow-duplication.txt` entries of base lines 37 and 40, which the landing removes (on a scratch copy of the tree with the two lines removed, `tests/checks/tree/duplication.test.ts` printed `Tests  18 passed (18)`); `slideProject` stays exported; the sentences under 'Doc text' are not edited. A breach of `spec.md:32` is disclosed under the judgment calls of this report: three read-only git commands were run by mistake in this round; their output was discarded and they changed nothing.

| # | Finding | What changed | Command and result |
|---|---|---|---|
| 1 | Slow tags only on a cause or a minimum of 100 ms | The file tags of `audit-mute`, `file-undo` and `project-files`, the describe tags of `write.test.ts` and `rail.test.ts` and the per-test tags of `roots.test.ts` that the review measured are removed. The tests that meet the rule carry their own tag; the minima and causes of every tag site are in the Tags section (before list, after list, and the tests that left or joined the tier). The shared cold start is `test.beforeAll(warmConfig)` in ten files. The reasons of the file tags of `config-key`, `config-value` and `undo-replaced` state their measured minimum. | Counts in the six files:\ntests/routes/edit/audit-mute.test.ts: file tags 0, test or describe tags 1 / tests/routes/files/file-undo.test.ts: file tags 0, test or describe tags 0 / tests/routes/files/project-files.test.ts: file tags 0, test or describe tags 0 / tests/routes/edit/write.test.ts: file tags 0, test or describe tags 4 / tests/routes/edit/rail.test.ts: file tags 0, test or describe tags 0 / tests/routes/edit/roots.test.ts: file tags 0, test or describe tags 1 / Remaining tag lines of four of them: tests/routes/edit/write.test.ts:427:    it('requires a fresh non-empty id for new venues', { tags: ['slow'] }, async () => { / tests/routes/edit/write.test.ts:520:        { tags: ['slow'] }, / tests/routes/edit/write.test.ts:539:        { tags: ['slow'] }, / tests/routes/edit/write.test.ts:603:        { tags: ['slow'] }, / tests/routes/edit/roots.test.ts:186:        { tags: ['slow'] }, / tests/routes/edit/audit-mute.test.ts:229:        { tags: ['slow'] }, / File tags in `routes/edit`, `routes/docs` and `data`: routes/edit/undo/undo-replaced.test.ts:10:// @module-tag slow: every case takes 410 ms or more to write and take back a value. / routes/edit/config-value.test.ts:10:// @module-tag slow: every case takes 240 ms or more to write a list through the route. / routes/edit/config-key.test.ts:9:// @module-tag slow: every case takes 140 ms or more to write a setting through the route. / routes/docs/side-project-docs.test.ts:4:// @module-tag slow: its one case takes 100 ms or more. / data/demo-hub.test.ts:8:// @module-tag slow: the configuration and the portfolio built at collection take 100 ms or more. / Cold and warm `loadConfig` in one process, five processes, ms: loadConfig calls in one process, ms: 85.5, 56.6, 49.2, 48.0\nloadConfig calls in one process, ms: 84.1, 56.2, 48.9, 49.1\nloadConfig calls in one process, ms: 83.0, 51.5, 45.5, 44.7\nloadConfig calls in one process, ms: 84.5, 56.3, 50.1, 47.9\nloadConfig calls in one process, ms: 83.1, 53.7, 48.6, 48.0 |
| 2 | `demo-hub` takes a file tag | `tests/data/demo-hub.test.ts:8` is `// @module-tag slow: ...` for the work done at collection. | `sed -n 8p tests/data/demo-hub.test.ts` printed `// @module-tag slow: the configuration and the portfolio built at collection take 100 ms or more.`; five runs of its two module-level calls printed totals of 107.5, 106.5, 139.3, 112.9, 109.1 ms, minimum 106.5 ms (lines in the Tags section). |
| 3 | Delete the `skip_permissions` case | The case is deleted; the wire stays held by the two cases that remain. | In the base copy `grep -n` prints `201:    it('carries tasks.skip_permissions on the wire, off in the checked-in configuration', () => {`; in the worktree `grep -c` prints `0` and `grep -n` of the two holders prints `95:    it('adds the skip flag and nothing else when tasks.skip_permissions is on', async () => { / 104:    it('reads a tasks.skip_permissions of any other shape, and a missing one, as off', async () => {`. |
| 4 | Delete `routes/shape.test.ts` | The file is deleted. No test, source file, script or document of the worktree cites it. The files of the main checkout that name it are ledgers and one comment of the case this round deletes (below). | `ls tests/routes/shape.test.ts` printed `ls: tests/routes/shape.test.ts: No such file or directory`; `grep -rn 'routes/shape' src tests utils DESIGN.md HELP.md README.md config demo` printed `nothing`. In the main checkout `grep -rn 'routes/shape' .` (counts per file): 1 ./.scratch/migration/agents/briefs/Q79b.md / 1 ./.scratch/migration/agents/briefs/T1e-round1.md / 1 ./.scratch/migration/agents/briefs/T1e.md / 1 ./.scratch/migration/agents/reviews/Q79b-report.md / 1 ./.scratch/migration/agents/reviews/Q87-refuter.md / 3 ./.scratch/migration/agents/reviews/R12a.md / 1 ./.scratch/migration/agents/reviews/T1e-refuter.md / 3 ./.scratch/migration/agents/reviews/T1e-report.md / 1 ./.scratch/migration/choices.md / 1 ./.scratch/migration/orchestrator-history.md / 1 ./.scratch/migration/plan.md / 1 ./tests/routes/sessions/terminal-actions.test.ts. The ledger files are the plan's record and `tests/routes/sessions/terminal-actions.test.ts:179` is the comment of the deleted case. |
| 5 | `checks/utils` open with `// Layer 4, test.` | The five script tests open with the label; their tags by cause are unchanged. | `head -n 1` of the five files printed: // Layer 4, test. The citation check ove / // Layer 4, test. The Claude status-line / // Layer 4, test. The split of a collabo / // Layer 4, test. The outside-paths repo / // Layer 4, test. The hub migration behi |
| 6 | Assertion edits, first runs, history words, unused exports | Four sections are added: 'Edits to existing assertions' (77 tests with a changed body from a `difflib` comparison of bodies, the five files named by the brief as `diff -U0` hunks, the allow list as `diff -U0`), 'First run of each new or changed test' (154 rows, each with its failing line on a scratch copy with the behaviour removed), 'History words in added comments and titles' (20 hits, each judged) and 'Unused exports' (the output of `sh utils/unused-exports.sh` against the base's). | The sections are in this report; the unused-exports comparison is `cmp` of the two outputs, which printed `identical`; the section text quotes the counts. |
| 7 | `size.test.ts` says it runs `utils/size-check.sh` | The head (`:10-11`) and the title (`:134`) say that this test is what runs the script and that the verification list runs no size command. | `sed -n 10,11p` and `grep -n` printed: // utils/size-allow.txt is read by this and by utils/size-check.sh, which holds the same rule in / // awk. The verification list runs no size command, so this test is what runs the script: its last / 134:    it('runs utils/size-check.sh, which only this test runs, and reports nothing over the tree as it stands', () => { |
| 8 | Name `detached.test.ts:6-7` | Named under 'Doc text' with its replacement and in the third item of the first line. | In the main checkout `sed -n 6,7p tests/server/git/refs/detached.test.ts` printed: // What this does NOT cover: the questions the page asks first, and the route's confirm / // (tests/routes/git/refs.test.ts).; the confirm is held by `tests/routes/git/git.test.ts:350`. |
| 9 | Holder `file:line` and the Folds appendix | The holders of the removals are cited at the lines of the worktree after the last change and, for T1c's files, at main's `tests/server` (the review's table: normalise 637, integrity 163, `config.test.ts` 411, changes 524, compare 95 and 105, config-value 241, fs 596; the review's compare line 105 is the second of two cases, the first at 95 holds the dash case). The Folds appendix is rewritten by hand: each old title is mapped to its row or rows, and tests that are not rows are left out. | `sed -n <line>p` of each cited file printed: data/snapshot/normalise.test.ts:637 it('survives JSON.stringify and JSON.parse unchanged', () => {\nchecks/config/integrity.test.ts:163 it('survives JSON.stringify and JSON.parse unchanged', () => {\nchecks/config/config.test.ts:411 expect(behaviorFindings(engine, loadConfig(engineDir()).config)).toEqual([]);\nmain server/core/changes.test.ts:524 it('reaches every row the file holds when the cap is below the page', async () => {\nmain server/core/git/compare.test.ts:95 it('refuses a from side that starts with a dash, running nothing and writing no file', () \nmain server/core/git/compare.test.ts:105 it('refuses a from side that names no commit and a to side that is not a hash', () => {\nmain server/edit/config-value.test.ts:241 it('refuses a key holding a list in a family of records, naming the key, and writes nothin\nmain server/files/fs.test.ts:596 it('refuses an id that would leave the folder, and writes nothing outside it', () => {. The appendix lists 89 tables and one list, 563 rows, 201 old titles mapped; a script checks that every old title exists in the base copy, every row exists in the final tree and every row passed (0 rows not passed). |
| 10 | Join the split line | The sentence is one line in the generated text of the report. | See the check after this table. |

Check of finding 10: the sentence 'writes a newline for \n in a CRLF file as CRLF' is on one line of this report; `grep -n 'a newline for' T1e-report.md | cut -c1-60` (run on the text above this line) prints line 615: replace/ops-replace.test.ts: deleted 'writes the replace tex.

