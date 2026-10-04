NOT done: (1) `npm run test:checks` is red on one test, `tests/checks/tree/duplication.test.ts` 'holds the lists to clones that are still shared, so a repaired copy takes its entry with it', because two entries of `tests/checks/tree/allow-duplication.txt` that this sweep ended (original line 37, `calendar-config.test.ts` against `tests/server/accounts/calendar/poll.test.ts`, and original line 40, `routes/docs/memories.test.ts` against `tests/server/content/images.test.ts`) lie outside the lines this step may remove, so `checks.sh` stops at `npm run test:checks` and cannot print `checks: 7 commands passed`; the brief asks for removals only on lines 26-29, 31-36, 38 and 47 and for `npm run test:checks` green, and the two cannot both hold; on a scratch copy of the tree with those two lines removed `tests/checks/tree/duplication.test.ts` passes 18 of 18. (2) `export function slideProject` in `tests/routes/edit/write-fixture.ts` has no importer and is still exported: without `export` the clone it makes with `tests/server/core/changes.test.ts` changes its mark, the entry on original line 42 (outside this step's lines) goes stale and a new clone `84838e85ca2b` is reported, so the export stays until that entry is replaced at landing. (3) Sentences outside this step's paths that the sweep made false, and one `src/` export left with no importer (`CONFIRMED` in `src/lib/server/git/git-routes.ts:139`), are listed under Doc text and are not edited. Everything else in the brief is done.

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
- `checks/tree/size.test.ts:133`: runs `utils/size-check.sh` over the tree and asserts it prints nothing, and asserts over the script's text. Verdict held: the run is kept and retitled 'reports nothing from utils/size-check.sh, the awk of the verification list, over the tree as it stands'; the assertion `expect(command).toContain('size-allow.txt')` and the read of the script text are removed; the head comment's sentence on the verify list (`:10-11`) now names `utils/size-check.sh` and the case that runs it.
- `checks/source/retired.test.ts:28`: fails when `HELP.md`, `DESIGN.md` or `README.md` names the retired Config view or card. Verdict: kept and retitled 'name no Config view, no Config card and no local.yml card'; it holds `spec.md:66` (a sentence a change makes false is a defect) for one retired screen only, through a phrase list. Named under the judgment calls for Axel.
- `checks/source/add-forms.test.ts:60` and `:65`: a check that no view draws a second add form, and its parse case. Verdict held: kept and retitled without 'audits'. It guards DESIGN.md 'Unsaved form input is instance state', which holds only while a view draws one add form per collection.
- `checks/tree/audits.test.ts` and `checks/tree/allow-audits.txt`: untouched. `cmp` of both against the base copy prints nothing.
- `data/snapshot/build-timing.test.ts`: prints times and asserts only what it fed. Verdict held: deleted.
- `data/real-hub.probe.ts`: kept unchanged and never run (`cmp` against the base copy prints nothing).
- `routes/git/untracked.test.ts:134`: the 100 ms `setTimeout` wait is replaced by a `setImmediate` loop that waits until `writes.chain` is replaced; the assertion that `trash` was not called is unchanged. The case fails when `ordered` in `src/lib/server/git/git-routes.ts` calls the work without the chain (run on a scratch copy of the tree with that one change: `1 failed | 5 passed (6)`). The file is tagged by cause: every case runs git in a scratch repository.
- A helper of `tests/fixtures/` that one file imports, such as `real-hub.ts`: `real-hub.ts` and every other helper but two are byte-identical to the base copy (`diff -rq` lists only `scratch.ts`, which lost the `export` of `sweepingOnError`, and `sessions-fixture.ts`, which lost the unused `gitPayload` and gained its label).
- A deletion that makes an entry of `allow-duplication.txt` stale: the entries on original lines 26, 28, 29, 34, 35, 36 and 47 are removed (`diff` of the file against the base copy prints exactly those seven lines). Original lines 37 and 40 are stale and outside the permitted lines; they are the two the red test names. The entry on original line 42 is kept live as item (2) of the first line says.
- A fold of several cases into a table: 73 tables are new in the four folders; each lists its rows with their full titles under 'Folds' below, every row passed in `npx vitest run tests/routes tests/data tests/checks --testTimeout 0 --hookTimeout 0 --reporter=json` (2350 tests, 2349 passed, the one failure being the staleness test above).

Cases where the brief's own rules are wrong or cannot be met:

- Rule: 'a deletion that makes an entry of `allow-duplication.txt` stale: on lines 26-29, 31-36, 38 or 47 the entry removed, on line 30 or 37-46 named in the report; `npm run test:checks` green'. Result: the sweep ends the clones of original lines 37 and 40, so `npm run test:checks` is red on the staleness test until they are removed, and an edit of those lines is outside this step's paths. Ruling needed from the orchestrator at landing: remove those two lines (the order of landing decides which step writes them) and replace or remove line 42 as item (2) says. The lazy option would be to widen the allow list or loosen the staleness test; neither was done.
- Rule: item 4 and Decision 7 on an awaited `vi.waitFor`. Result: `grep -rn waitFor tests/routes tests/data tests/checks tests/fixtures` prints nothing, so the rule has nothing to apply to; the remaining waits found by `grep -rn 'setTimeout\|sleep'` are the `sleep 5` stubs of `routes/sessions/latex.test.ts` (their cases are tagged slow by cause), a zero-delay yield at `tests/fixtures/client.ts:80` and the armed timers named in the judgment calls.
- Rule: item 5 says the tree checks of `tests/checks/` are never tagged and are swept only on their planted-fixture cases. `tests/checks/utils/` holds tests of scripts under `utils/` (cited-lines, claude-usage, migrate-joint-work, outside-paths, rename-pillar), not checks that read the tree; Decision 1 applies to them, so four of the five are tagged by cause, and they carry the label 'Layer 4, tree check.' by the literal reading of item 7.
- Rule: item 7 gives one label for every file of `tests/checks/`. `tests/checks/config/config.test.ts` holds unit tests of the config readers (`loadLocal`, `checkLocal`, `loadConfig`, `behaviorFindings`) besides its checks over the shipped files; it carries 'Layer 4, tree check.' by the same reading.

## DONE / NOT DONE

The verify list ran twice in full through `checks.sh`; both runs stop at the first failing command. The five commands after `npm run test:checks` were then run once each by hand on the final tree. Full-list runs: 2.

| Row | Status | Command and result |
|---|---|---|
| Verify list with `npm run diagrams` first | NOT DONE (red at `npm run test:checks`) | `npm run diagrams` printed `diagrams exit 0`; `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` printed `checks: failed with exit 1: npm run test:checks`, exit 1. The output is quoted below. |
| `npm test` | DONE | `Test Files  587 passed \| 36 skipped (623)`, `Tests  14232 passed \| 839 skipped (15071)`, from the `checks.sh` run. |
| `npm run test:checks` | NOT DONE, one red | `Test Files  1 failed \| 29 passed \| 2 skipped (32)`, `Tests  1 failed \| 412 passed \| 33 skipped (446)`; the one failure is the staleness test named in the first line. |
| `npm run check` | DONE | `svelte-check` printed `COMPLETED 3370 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`; `exit 0`. |
| `npm run build` | DONE | `exit 0` (run by hand after `checks.sh` stopped). |
| `npm run format:check` | DONE | `All matched files use Prettier code style!`, `exit 0`. |
| `npm run lint` | DONE | `eslint .`, `exit 0`. |
| `! LC_ALL=C grep -rna '[^ -~]' src tests` | DONE | `exit 0` (no non-ASCII byte). |
| Check 2: each slow-tagged file alone with `--tagsFilter slow` | DONE | 33 files, five runs each, `numFailedTests` 0 in all 165 JSON reports; `npx vitest run tests/routes tests/data --tagsFilter slow`: `Tests  306 passed \| 1598 skipped (1904)`; `npx vitest run tests/checks --tagsFilter slow --testTimeout 0 --hookTimeout 0`: `Tests  33 passed \| 413 skipped (446)`. |
| Check 3: no quick test with a cause of Decision 1, none at 100 ms or more | DONE | A probe (a vitest setup file that counts `child_process` calls, `setTimeout` and `setInterval` of 1 ms or more, and `net` `listen` and `connect` per test) run over `tests/routes tests/data tests/checks/utils --tagsFilter '!slow'`: `Tests  1619 passed \| 339 skipped (1958)`, four records, all in `routes/files/search.test.ts` (an armed guard timer that nothing awaits), no spawn and no socket. The largest quick minimum over five runs is 97.1 ms (list in the appendix). |
| Check 4: audits and page greps | DONE | `grep -rn "it(['\"\`]audits" tests/routes tests/data tests/checks` prints `tests/checks/tree/audits.test.ts:272:` (the planted string) alone; `grep -n "readFileSync\|?raw" tests/routes/page.test.ts` prints nothing. |
| Check 5: every fold's table passes | DONE | 73 new tables, 0 rows not passed (the title-to-row lists are under 'Folds'). |
| Check 6: paths of deleted files | DONE | `grep -rn "options-walk\|build-timing" src tests utils DESIGN.md HELP.md README.md config demo --exclude=local.yml` prints nothing. |
| Check 7: the six holders of T1c | DONE | see below. |
| `prettier --check` and `eslint` on the four folders | DONE | `All matched files use Prettier code style!`; `npx eslint tests/routes tests/data tests/checks tests/fixtures` exit 0. |
| Head labels | DONE | every changed `.ts` file of the four folders opens with `// Layer 2, route tests.`, `// Layer 1, data tests.`, `// Layer 4, tree check.` or `// Layer 4, test helper.` (a script over the changed files found no other first line; the five helpers inside `routes` and `data` carry 'Layer 4, test helper.'). |
| `npm run diagrams` | DONE | exit 0; `diff -rq` of the main checkout's `tools/oculus/docs` against the worktree's `docs` prints nothing, so the regenerated diagrams are byte-identical. |
| Files outside the paths | DONE | `diff -rq` of the base copy's `src`, `utils` and `tests` against the worktree prints differences only inside the four folders. |

The six holders of T1c (check 7, `grep -n` on the final tree):

- `tests/data/helpers/files/nesting.test.ts:122`: `it('says each dropped pattern in the sentence of its kind, on its own key', () => {`
- `tests/data/helpers/guards.test.ts`: 'is the string, and writes a number or a boolean out' is the first six rows of the table `writes %s out as its text or the fallback` (`:106-120`: 'a string', 'the empty string', 'a number', 'zero, whatever the fallback', 'true', 'false'), the same six expectations.
- `tests/data/sources/config/languages.test.ts`: 'reports nothing for the checked-in map' is deleted; its behaviour (no drops for the checked-in file) is held by `tests/data/helpers/files/languages.test.ts:22`, 'names every language the code window registers and no other, and drops nothing', which asserts `expect(drops).toEqual([])` over the same file.
- `tests/data/sources/config/local.test.ts:136`: `])('answers %j with the sentence it would throw', (text, expected) => {`
- `tests/data/sources/config/settings.test.ts:64`: `it('reads the days at both ends of the window and the cadences at both ends of theirs', () => {`
- `tests/routes/sessions/terminal-edit.test.ts:365`: `it('reads them as title, icon and color, empty when the line carries none', () => {`

Output of `checks.sh` on the final tree, verbatim apart from the reporter's glyphs, written here in ASCII (the lines of `npm test`'s vitest run before its summary are the `RUN` line and `fatal: Needed a single revision`, printed by a test of another folder):

```
$ npm test

> oculus@0.0.1 test
> vitest run --tagsFilter '!slow' --exclude 'tests/checks/**'


 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/T1e/tools/oculus

fatal: Needed a single revision

 Test Files  587 passed | 36 skipped (623)
      Tests  14232 passed | 839 skipped (15071)
   Start at  05:02:40
   Duration  168.82s (transform 48.51s, setup 0ms, import 400.32s, tests 216.59s, environment 222ms)

$ npm run test:checks

> oculus@0.0.1 test:checks
> vitest run tests/checks --tagsFilter '!slow' --testTimeout 0 --hookTimeout 0


 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/T1e/tools/oculus

 > |unit| tests/checks/tree/duplication.test.ts (18 tests | 1 failed) 4536ms
     x holds the lists to clones that are still shared, so a repaired copy takes its entry with it 664ms

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
      Tests  1 failed | 412 passed | 33 skipped (446)
   Start at  05:05:32
   Duration  36.12s (transform 10.15s, setup 0ms, import 40.88s, tests 81.49s, environment 6ms)

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
| checks/utils | 5 | 5 | 5 | 5 | 910 | 868 |
| data | 4 | 4 | 3 | 3 | 557 | 435 |
| data/accounts | 1 | 1 | 1 | 1 | 57 | 77 |
| data/helpers | 7 | 7 | 7 | 7 | 1344 | 1302 |
| data/helpers/files | 5 | 5 | 5 | 5 | 667 | 577 |
| data/prose | 3 | 3 | 2 | 2 | 607 | 598 |
| data/snapshot | 5 | 4 | 5 | 4 | 2620 | 2324 |
| data/sources | 9 | 9 | 9 | 9 | 3030 | 2764 |
| data/sources/config | 8 | 8 | 8 | 8 | 1613 | 1421 |
| data/sources/config/catalog | 2 | 2 | 2 | 2 | 118 | 126 |
| fixtures | 10 | 10 | 0 | 0 | 731 | 727 |
| routes | 3 | 3 | 3 | 3 | 295 | 187 |
| routes/docs | 5 | 5 | 5 | 5 | 1227 | 1139 |
| routes/edit | 8 | 8 | 7 | 7 | 2472 | 2255 |
| routes/edit/undo | 3 | 3 | 3 | 3 | 1249 | 1237 |
| routes/files | 10 | 10 | 9 | 9 | 3371 | 3308 |
| routes/git | 6 | 6 | 5 | 5 | 1495 | 1314 |
| routes/machine | 3 | 3 | 3 | 3 | 535 | 533 |
| routes/replace | 4 | 4 | 3 | 3 | 827 | 776 |
| routes/sessions | 8 | 8 | 7 | 7 | 2964 | 2887 |
| total | 150 | 148 | 120 | 118 | 37212 | 34641 |

Tests in the four folders: 2285 before in 120 test files, 2350 after in 118 test files (`npx vitest run ... --reporter=json`, `numTotalTests`). The count rises although tests were deleted because each row of a new table is one test. No file is at 880 lines or more: the largest are `checks/diagrams/diagrams.test.ts` (856) and `data/snapshot/normalise.test.ts` (851); `routes/edit/write.test.ts` went from 891 to 783 lines.

## Timings

Commands: `npx vitest run tests/routes tests/data --tagsFilter '!slow'` and `npx vitest run tests/checks --tagsFilter '!slow' --testTimeout 0 --hookTimeout 0` (the body of `npm run test:checks`), each with `--reporter=dot`. The machine ran other sessions' work throughout, so every figure carries the load average (1, 5, 15 minutes) read just before it.

- Before any change, unchanged tree in the worktree, load 13 to 14: routes and data `real 71.36 s` (vitest `Duration 56.32s`, 83 files passed 4 skipped, 1677 passed 128 skipped); checks `real 51.19 s` (31 files passed 2 skipped, 471 passed 9 skipped).
- Back to back, base copy then worktree, same minute, two rounds. `Test Files` and `Tests` are the vitest summary lines.

```
== base_rd_1 load 11.76 11.17 11.10
base_rd_1 real 91.33 s exit 0
 Test Files  83 passed | 4 skipped (87)
      Tests  1675 passed | 128 skipped (1803)
   Duration  84.07s (transform 39.96s, setup 0ms, import 121.34s, tests 129.42s, environment 21ms)
== after_rd_1 load 13.54 12.15 11.50
after_rd_1 real 38.45 s exit 0
 Test Files  72 passed | 14 skipped (86)
      Tests  1598 passed | 306 skipped (1904)
   Duration  34.35s (transform 18.48s, setup 0ms, import 82.44s, tests 15.87s, environment 20ms)
== base_chk_1 load 11.65 11.90 11.44
base_chk_1 real 45.55 s exit 0
 Test Files  31 passed | 2 skipped (33)
      Tests  460 passed | 20 skipped (480)
   Duration  42.05s (transform 14.35s, setup 0ms, import 49.35s, tests 90.25s, environment 7ms)
== after_chk_1 load 10.86 11.73 11.41
after_chk_1 real 48.33 s exit 1
 Test Files  2 failed | 28 passed | 2 skipped (32)
      Tests  3 failed | 410 passed | 33 skipped (446)
   Duration  44.55s (transform 15.21s, setup 0ms, import 50.97s, tests 95.23s, environment 6ms)
== base_rd_2 load 11.13 11.85 11.48
base_rd_2 real 40.02 s exit 0
 Test Files  83 passed | 4 skipped (87)
      Tests  1675 passed | 128 skipped (1803)
   Duration  37.06s (transform 11.20s, setup 0ms, import 59.75s, tests 71.53s, environment 18ms)
== after_rd_2 load 11.70 11.95 11.53
after_rd_2 real 25.13 s exit 0
 Test Files  72 passed | 14 skipped (86)
      Tests  1598 passed | 306 skipped (1904)
   Duration  21.99s (transform 9.58s, setup 0ms, import 54.71s, tests 10.74s, environment 17ms)
== base_chk_2 load 11.72 11.93 11.54
base_chk_2 real 44.58 s exit 0
 Test Files  31 passed | 2 skipped (33)
      Tests  460 passed | 20 skipped (480)
   Duration  41.90s (transform 15.12s, setup 0ms, import 49.52s, tests 89.77s, environment 7ms)
== after_chk_2 load 9.47 11.34 11.34
after_chk_2 real 43.92 s exit 1
 Test Files  2 failed | 28 passed | 2 skipped (32)
      Tests  3 failed | 410 passed | 33 skipped (446)
   Duration  40.92s (transform 15.09s, setup 0ms, import 49.83s, tests 83.06s, environment 6ms)
```

The 'after' rows of `tests/checks` (`after_chk_1`, `after_chk_2`) ran before the last fixes and show three red tests then (the staleness test, a new clone and a comment of 101 columns); the final run of `npm run test:checks` inside `checks.sh` shows one (`Duration  36.12s`, load at the start of that script `6.10 8.27 9.53`). The quick tier of routes and data runs 1598 tests and skips 306 after the sweep, against 1675 run and 128 skipped before: the skipped (slow) count rose by 178 because of Decision 1 and the cold-start remedy, and new table rows count as tests.

## Tags

Decision 1 as applied: a test is slow by cause (a real process, a real timer of 1 ms or more, a socket, also through imported code) or when its minimum over at least five runs of its own file is 100 ms or more. The first test of a file that loads the engine configuration pays for the first load: in `routes/files/project-files.test.ts` the first case of a run took 101 to 244 ms and the later cases 52 to 58 ms over five runs, and in other files the later route cases sit at 85 to 100 ms each. Tagging single tests one by one moved the cold-start cost onto the next test of the file, so the minima flipped across the line from file to file; where a file's route cases sit within about 15 ms of the line, the file or the describe takes the tag (item 3: 'or the file takes the file tag'). The quick tests that need no configuration (the body readers of `write.test.ts`, the reader cases of `rail.test.ts` and `roots.test.ts`) stay in `npm test`.

| File | Tag form |
|---|---|
| `checks/utils/cited-lines.test.ts` | 2 test or describe tag(s) |
| `checks/utils/claude-usage.test.ts` | file tag: every case runs the command, which starts sh and python3. |
| `checks/utils/migrate-joint-work.test.ts` | file tag: every case runs the migration, which is a node process. |
| `checks/utils/outside-paths.test.ts` | 2 test or describe tag(s) |
| `data/sources/personal.test.ts` | 1 test or describe tag(s) |
| `routes/docs/docs.test.ts` | 1 test or describe tag(s) |
| `routes/docs/side-project-docs.test.ts` | file tag: its one case takes 100 ms or more. |
| `routes/edit/audit-mute.test.ts` | file tag: every case takes 85 ms or more to load the configuration. |
| `routes/edit/config-key.test.ts` | file tag: every case takes 85 ms or more to load the configuration. |
| `routes/edit/config-value.test.ts` | file tag: every case takes 100 ms or more to load the configuration. |
| `routes/edit/rail.test.ts` | 1 test or describe tag(s) |
| `routes/edit/roots.test.ts` | 9 test or describe tag(s) |
| `routes/edit/undo/undo-removed.test.ts` | file tag: every case takes 99 ms or more to load the configuration. |
| `routes/edit/undo/undo-replaced.test.ts` | file tag: every case takes 100 ms or more to load the configuration. |
| `routes/edit/undo/undo.test.ts` | file tag: every case takes 100 ms or more to load the configuration. |
| `routes/edit/write.test.ts` | 3 test or describe tag(s) |
| `routes/files/file-undo.test.ts` | file tag: every case takes 90 ms or more, and the first of a run 150 ms or more. |
| `routes/files/fs.test.ts` | 4 test or describe tag(s) |
| `routes/files/history.test.ts` | 3 test or describe tag(s) |
| `routes/files/open-program.test.ts` | 10 test or describe tag(s) |
| `routes/files/open.test.ts` | 8 test or describe tag(s) |
| `routes/files/project-files.test.ts` | file tag: the first case of a run takes 100 ms or more to load the configuration. |
| `routes/git/changes.test.ts` | 1 test or describe tag(s) |
| `routes/git/git.test.ts` | 4 test or describe tag(s) |
| `routes/git/refs.test.ts` | file tag: every case runs git in a scratch repository. |
| `routes/git/untracked.test.ts` | file tag: every case runs git in a scratch repository. |
| `routes/machine/commands.test.ts` | 3 test or describe tag(s) |
| `routes/replace/ops-replace.test.ts` | file tag: most cases run ripgrep; the others take 85 ms or more to load the config. |
| `routes/replace/preview.test.ts` | file tag: most cases run ripgrep or a real HTTP server; the others take 98 ms or more. |
| `routes/replace/replace-undo.test.ts` | file tag: every case runs ripgrep through the replace it undoes. |
| `routes/sessions/latex.test.ts` | 11 test or describe tag(s) |
| `routes/sessions/terminal-actions.test.ts` | 1 test or describe tag(s) |
| `routes/sessions/terminal-edit.test.ts` | 1 test or describe tag(s) |

Describes carrying a tag: `routes/edit/write.test.ts` (the write endpoint, the kinds the write endpoint takes, the deck write: each takes 85 ms or more to load the configuration), `routes/edit/rail.test.ts` (the rail write), `routes/sessions/latex.test.ts` (a chosen formatter that is not found: starts the real program lookup), `checks/utils/cited-lines.test.ts` (the citation check: each case starts node) and `checks/utils/outside-paths.test.ts` (two describes that start git and node). Tests carrying a tag are listed in the time appendix.

## Removals, folds, retitles and tags, file by file

One row per file of the four folders (150 in the base copy, 148 now). 'Tests' is the count before and after from the JSON runs; a file with no test (a helper) shows no count. The narrative for each changed file follows the table, in the order the sweep read them.

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
| `checks/utils/rename-pillar.test.ts` | changed | 7 to 11 |  |
| `checks/walk.test.ts` | read, unchanged | 1 to 1 |  |
| `checks/walk.ts` | read, unchanged |  |  |
| `data/accounts/connect.test.ts` | changed | 4 to 14 |  |
| `data/demo-hub.test.ts` | changed | 8 to 2 |  |
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
| `routes/edit/audit-mute.test.ts` | changed | 10 to 12 | file tag: every case takes 85 ms or more to load the configuration. |
| `routes/edit/config-key.test.ts` | changed | 14 to 12 | file tag: every case takes 85 ms or more to load the configuration. |
| `routes/edit/config-value.test.ts` | changed | 12 to 7 | file tag: every case takes 100 ms or more to load the configuration. |
| `routes/edit/rail.test.ts` | changed | 10 to 9 | 1 test or describe tag(s) |
| `routes/edit/roots.test.ts` | changed | 11 to 11 | 9 test or describe tag(s) |
| `routes/edit/side-project-writes.test.ts` | changed | 3 to 3 |  |
| `routes/edit/undo/undo-removed.test.ts` | changed | 44 to 43 | file tag: every case takes 99 ms or more to load the configuration. |
| `routes/edit/undo/undo-replaced.test.ts` | changed | 5 to 5 | file tag: every case takes 100 ms or more to load the configuration. |
| `routes/edit/undo/undo.test.ts` | changed | 36 to 35 | file tag: every case takes 100 ms or more to load the configuration. |
| `routes/edit/write-fixture.ts` | changed |  |  |
| `routes/edit/write.test.ts` | changed | 82 to 63 | 3 test or describe tag(s) |
| `routes/files/file-undo.test.ts` | changed | 20 to 20 | file tag: every case takes 90 ms or more, and the first of a run 150 ms or more. |
| `routes/files/file.test.ts` | changed | 25 to 51 |  |
| `routes/files/fs.test.ts` | changed | 19 to 17 | 4 test or describe tag(s) |
| `routes/files/history.test.ts` | changed | 21 to 21 | 3 test or describe tag(s) |
| `routes/files/open-fixture.ts` | changed |  |  |
| `routes/files/open-program.test.ts` | changed | 30 to 29 | 10 test or describe tag(s) |
| `routes/files/open.test.ts` | changed | 26 to 24 | 8 test or describe tag(s) |
| `routes/files/project-files.test.ts` | changed | 5 to 4 | file tag: the first case of a run takes 100 ms or more to load the configuration. |
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
| `routes/replace/ops-replace.test.ts` | changed | 22 to 18 | file tag: most cases run ripgrep; the others take 85 ms or more to load the config. |
| `routes/replace/preview.test.ts` | changed | 9 to 8 | file tag: most cases run ripgrep or a real HTTP server; the others take 98 ms or more. |
| `routes/replace/replace-fixture.ts` | read, unchanged |  |  |
| `routes/replace/replace-undo.test.ts` | changed | 5 to 5 | file tag: every case runs ripgrep through the replace it undoes. |
| `routes/sessions/compose.test.ts` | changed | 11 to 11 |  |
| `routes/sessions/hook.test.ts` | changed | 4 to 3 |  |
| `routes/sessions/latex.test.ts` | changed | 59 to 49 | 11 test or describe tag(s) |
| `routes/sessions/terminal-actions.test.ts` | changed | 36 to 35 | 1 test or describe tag(s) |
| `routes/sessions/terminal-edit.test.ts` | changed | 21 to 21 | 1 test or describe tag(s) |
| `routes/sessions/terminal-fixture.ts` | changed |  |  |
| `routes/sessions/terminal.test.ts` | changed | 17 to 17 |  |
| `routes/sessions/transcript.test.ts` | changed | 9 to 9 |  |
| `routes/shape.test.ts` | changed | 2 to 2 |  |

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
- deleted: 'has a word of its own in the History view' (catalog string), 'refuses a list in a family of records and a record in a key/value family' (tests/server/edit/config-value.test.ts:354-441 hold the refusals; the wire is held by 'answers the reason of a refusal with a 200'), 'lands two writes of different keys made at once' (config-key 'lands two writes made at once' same queue), the 2 unwritable cases (same settled() branch in config-write.ts:39-41 as config-key's 2)
### routes/edit/rail.test.ts (edited): folded 'refuses a page named twice' + 'refuses a page no arrangement holds, and an empty one' + 'refuses a glyph the vocabulary does not hold' -> 4 rows (400 {error:'invalid'}, file unchanged); deleted 2 unwritable cases (settled() branch config-write.ts:39-41, held by config-key.test.ts unwritable x2)
### routes/edit/roots.test.ts: read, kept whole, label. side-project-writes: read, kept whole (3), label
### routes/edit/audit-mute.test.ts: folded 'refuses a signature that is not twelve hex' (loop of 3) + 'refuses a file whose shape the line edit cannot keep' -> 4 rows; label
Mostly routes/edit (config copy+loadConfig per write), undo, replace, files/file-undo, git/refs, latex.
### routes/edit/undo/undo-removed.test.ts: retitled 'audits that the value is written, as a map, ...' -> 'writes the value, as a map, ...' and 'audits that the value is written instead ...' -> 'writes the value instead ...'; deleted 'writes the value for an offset that is fractional or negative, or text that is empty' (4 inputs, each a row of the `malformed` table in 'a record without usable removed lines'); label
### routes/edit/undo/undo.test.ts: deleted 'answers unwritable for a setting whose file can no longer be read' (same throw path through the endpoint as 'whose file has turned read-only' for config-key; deck+rail unreadable kept: separate read-catch branches deck.ts:104, rail.ts:93); label
### routes/edit/undo/undo-replaced.test.ts: read, kept whole, label 'Layer 4, route test.' -> 'Layer 2, route tests.'
### routes/edit/write.test.ts: deleted 'refuses a request with a stale token' + 'refuses a request that carries no token' (tokenedBody held by tests/server/core/auth.test.ts:50-83; the wire kept by 'refuses a request with no token'), 'refuses a session write with no token', 'refuses a pin with no token', the 11 per-kind `refuses a <kind> body with no token` cases (same tokenedBody branch before dispatch, writes.ts:274), 'refuses a session write that names no id or no field' (sessionWrite parser held by 'reads a session body into the keys it names'), 'pins a session to an area through the route, and unpins it' + 'renames a session through the route, and clears the name' (tests/server/sessions/overrides.test.ts:83,100 hold them; wire held by 'carries a dismissal, a pin and a title in one body'), 'answers 400 for a body that is not a write, whatever it is missing' (config-key; MALFORMED row config-key + configKeyWrite parser tests); retitled describe 'the kinds the write endpoint learned in P1' (package id) -> 'the kinds the write endpoint takes'; head comment lost 'curl in the package's verification' clause; label. audit-mute head lost the stale 'thousand-line limit' sentence.
### routes/files/fs.test.ts: deleted 'answers 404 for a path outside the root and for a root nothing names' (tests/server/files/fs.test.ts:186 holds; 404 wire kept by the engine-root test's `path=..` 404), 'refuses a note id that would leave the folder, and writes nothing' (server fs.test.ts:667 holds); label
### routes/files/search.test.ts: deleted 'runs every root when the query names none' (server search.test.ts:114,146), 'says the answer was cut when the run reached the cap' (server :301), 'names a root whose search failed while another answered' (server :376), 'refuses a pattern past the bound with 400' (tests/data/helpers/search.test.ts:147), 'refuses a root outside the served list with 400 and starts nothing' (server :174, data search.test.ts:152; the refused wire is kept by the empty-pattern case); label
### routes/files/project-files.test.ts: deleted 'answers 200 with no rows for a project whose folder holds nothing listed' (same success branch as 'answers the rows'; server project-files.test.ts:117); head lost curl clause; label
### routes/files/file.test.ts (edited): folded 5 typeOf tests ('names the type of every extension a manual is made of', 'names every extension of the manual table as it did', 'names the types a manual may carry beyond that table', 'serves TypeScript as bytes...', 'falls back to bytes...') -> one 28-row table 'names %s as %s'; folded 'has nothing for a file that is not there' / 'a directory, and nothing for the root itself' / 'a path that climbs out of the root' / 'a symbolic link pointing out of the root' / 'a root nobody configured, and none for a root that is not there' -> 9 rows + 'still serves the file beside a link' (the second half of the symlink case); deleted 'serves the stylesheet the page asks for beside it' (typeOf row a/b/manual.css + same serve branch as the html case), 'is the config folder of the engine and nothing above it' (engineRoot pass-through; 404 for ../local.yml in 'serves a file of the engine config folder'), 'reports an entry that is not a pair of strings and a key two entries share' (subset of 'words each entry by the first part of it that fails'); kept 'is the same key on the client, which cannot import the server module' (the client's ENGINE_ROOT equals the server's, two separate definitions that place.ts:20 cites); folded 'reports one that is not a list' + 'reports roots that are a map as not a list' -> 2 rows; head curl clause removed; label
history.test.ts: label only; sole holder of keepCopy/forgetCopy/handleHistory logic (no tests/server/files history test), all 17 kept
file-undo.test.ts: label only; sole holder of file-undo.ts logic, all 20 kept
open-program.test.ts: deleted 'still opens a .docx whose mode carries no execute bit' (same outcome as the every-extension case: files written 0644); label
open.test.ts: deleted 'requires a path' (folded {} into the path-missing table), 'refuses a file without the write token' (tokenedBody held by tests/server/core/auth.test.ts:50-83; wire kept by 'requires the write token'); folded the two client refusal tests into 2 rows; label.
source.test.ts: sole holder of handleSource; all 22 kept; removed the temporary[]/afterEach rm (scratch sweeps); label. open-fixture.ts: label 'Layer 4, test helper.'
git/untracked.test.ts: deleted 2 'refuses a request with no token' (held by routes/git/git.test.ts 'refuses a request with no token' on /api/git, auth.test.ts); replaced the 100 ms setTimeout in 'waits behind the write chain' with a setImmediate loop until writes.chain is replaced (the case fails when `ordered` calls the work without the chain); label.
git/changes.test.ts: deleted 'answers the page size it used, and every row of a log capped below it' (tests/server/core/changes.test.ts:507 holds readChanges cap<page; handleChanges only forwards before); label;
git/git.test.ts: deleted 'refuses a worktree action on a root it was not given' (same root check before dispatch as 'refuses a root it was not given'), 'answers a refusal from the worktree write with its own reason' (same branch as 'answers a refusal from git with its own reason'), 'answers the branch listing when it is asked for no diff' (handleGitBranches forwards to handleGitGet; the branch listing describe holds it); folded 'refuses each of them unconfirmed...' of the three worktree actions into the ASKING table (3 rows); head lost curl clause; label
git/deposit.test.ts: deleted "answers 404 to a POST and a GET that name the side project's slug" (same 404 branch as the two 404 cases; knownIds held by 'holds the manuscript and not the side project'); head lost curl clause; label. git/request.ts: gitPost sends a text body as it is (git.test.ts uses it now; its own copy of HOST/URL_/request removed); label
git/refs.test.ts: deleted 'names the five new actions' + 'lists the five ... among the confirmed' (assert constants ACTIONS/CONFIRMED; the behaviour is held by the ASKING table and the action tests), 'refuses each without the token and each unconfirmed' (token held by git.test.ts; unconfirmed folded as 4 rows cherryPick/checkoutDetached/deleteBranch/deleteBranchAnyway into git.test.ts ASKING), 'refuses a name or a start point that starts with a dash' (tests/server/git/refs/{delete-branch:94,detached:61,99,138,cherry-pick:73}), 'refuses a from side that could be taken for an option' (tests/server/core/git/compare.test.ts:97,109); head rewritten; label
machine/hpc.test.ts: deleted 'refreshes while there is no host' (subsumed by 'refreshes without reading the host': where throws if read); label + blank line after head. lines.test.ts: label only
machine/commands.test.ts: deleted 'saves again a name that only the saved list holds' (the replace test saves the name twice and asserts the file); folded the two 'refuses a saved name that ... holds' tests into 2 rows; head label 'Layer 2, server test.' -> 'Layer 2, route tests.' and rewrapped
replace/replace-undo.test.ts: label; all 5 kept. replace/replace-fixture.ts: read, kept (all exports imported). replace/preview.test.ts: deleted 'shows another replace text in a second preview of the same file' (each preview is independent; 'holds the file' covers the same path with another replacement); label
replace/ops-replace.test.ts: deleted 'writes the replace text of a literal search as typed' (tests/data/helpers/replace.test.ts:208), 'deletes the match when the replace text is empty' (:213), 'writes the case of the match when Preserve Case is on' (data replace.test.ts it.each 164-200; preview test 'applies the groups, the case and the line ends' holds the flag through splicesFor, which the write shares), 'writes a newline for 
 in a CRLF file as CRLF' (data :219; endsWithCrlf in splicesFor shared and held by the preview test); quick: denied, protected, marker, binary/missing/outside, the 3 not-an-action/bad-query; label
sessions/hook.test.ts: folded 'accepts 20 requests ... 21st with 429' + 'answers 200 for a request with the 20th call' into one test asserting the 20 statuses 200 and the 21st 429; label. sessions/transcript.test.ts: read, kept whole, label
sessions/compose.test.ts: read, kept whole; label
sessions/terminal.test.ts: folded the 3 recover refusals (unknown dataset, shell-bearing key, dash-prefixed key) into 3 rows with their exact reason (the shell-bearing row now asserts its reason too); label. terminal-fixture.ts: label Layer 4, test helper
sessions/terminal-edit.test.ts: read, kept whole; label
Edits to existing assertions (for the report): terminal.test.ts recover row 'mimic; touch nope' now also asserts reason 'key is not a dataset in the current portfolio'; open.test.ts client refusal rows both assert answer.error (the unknown-root row did not before); hook.test.ts the 20 accepted statuses are asserted in the 429 test (was a separate test); untracked.test.ts wait mechanism setImmediate loop on writes.chain instead of 100 ms
sessions/terminal-actions.test.ts: deleted 'is wired to that reader by the route module, not to the context snapshot' (asserts the text of src/routes/api/(sessions)/terminal/+server.ts; spec.md:61); label; head says which case starts a process. terminal-fixture.ts: HERE_FILE export removed (its one importer was the deleted test). KEPT as a judgment call for Axel: 'carries tasks.skip_permissions on the wire, off in the checked-in configuration' (asserts a shipped default, a constant; guards a dangerous default shipping on)
sessions/latex.test.ts: deleted 'refuses a request naming no project or root' (row 'no project or root' of the word table), 'refuses an id the snapshot does not hold' (folded as row), the status-only 404 table (4 rows) and 400 table (4 rows) (every row but one is a row of 'every refusal is a word', which asserts status and word; 'neither with a path' added as a row), 'refuses a file that is missing and a file outside the root' (2 rows added to the word table with their words missing/outside), 'refuses an outline and a count asked together' (row of the word table), 'answers the text the program printed from the text it was given on standard input' (the tex-fmt row of 'runs %s with its arguments'), 'answers 502 with the missing word of the chosen program when it is not found' (the tex-fmt row of 'refuses %s-missing'); label
routes/page.test.ts: deleted 10 source-text cases (9 titled audits: 'audits that the page carries files beside the other channels...', 'audits that the page carries every channel it reads', 'audits that the collections are registered in one effect...', 'audits that a push is followed only when it carries a real collections list...', 'audits that the first frame is left to the untracked call...', 'audits that the write token the load handed on is installed...', 'audits that one contextmenu listener is added...', 'audits that the browser menu is cancelled through shouldCancel...', 'audits that the listener is taken away when the page goes', and 'takes what the previous address carried before it reads its saved workbench' at :106), plus the effects() helper, ROUTES and the readFileSync imports; kept: page load, server load, 3 pushedCollections; head rewritten. config-seed.test.ts: read, kept whole (3), label. shape.test.ts: read, kept whole (2): reads route source text (spec.md:61) but enforces a structure rule written only in its own head: named for Axel
tests/data/file-ops.test.ts: label "Layer 1, data tests."; deleted the constants test (TEXT_LIMIT, MAX_UPLOAD_BYTES); name-verdict cases folded into tables (made 10 rows, refused 17 rows), copy-name table 10 rows, stemLength table 4 rows; 137 -> 120 lines; 43 tests.
tests/data/demo-hub.test.ts: label; deleted 6 tests (project id list, software tier, eight registry counts, resource kinds, twelve collection keys, JSON round trip held by normalise.test.ts:658 and integrity.test.ts:185); join test trimmed to jointWorkPerson (normalise.test.ts:574-585 holds personIds); 2 kept.
tests/data/accounts/connect.test.ts: label; 4 tests (multi-expect) become 2 tables (7 + 7 rows).
tests/data/helpers/editor.test.ts: label; deleted the checked-in-config constant test (paint_limit_kb 20480; the real config is validated by catalogs.ts:188 findings in the integrity check); the null test and sizes table merged into one 10-row table that also checks requirePaintLimit; throws test 2-row table. 53 -> ~35 lines.
tests/data/helpers/dates.test.ts: label; ago 4 tests -> one 15-row table; localDate 1 test -> 3 rows.
tests/data/helpers/finding-text.test.ts: label; 5 multi-expect tests -> 4 tables (fillPlaceholders 5 rows, findingText present 4 rows, absent 4 rows).
tests/data/helpers/guards.test.ts: label; 21 multi-expect tests -> tables (isMap 9, str 9, text 7, strings 9, fields 5+1, scalar 13, item 4, numericSetting 4, sameInOrder 7; byKey 2 kept); head count "fifteen modules" checked below.
tests/data/helpers/guards.test.ts head: "fifteen modules" replaced (106 src files import guards.ts, checked with grep -rl "helpers/guards" src | wc -l).
tests/data/helpers/editor-options.test.ts: label; deleted 'the tracked configuration draws no finding' (held by tests/checks/config/config.test.ts:636); 3 pairs of cases folded into tables (languages not a map 2 rows, record shapes 3 rows, repo languages not a map 2 rows); 72 tests.
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
tests/checks/tree/size.test.ts: label 'Layer 4, tree check.'; head sentence on the verification list corrected (names utils/size-check.sh and the case that runs it); the awk case retitled 'reports nothing from utils/size-check.sh, the awk of the verification list, over the tree as it stands' and loses its assertion over the script's text (expect(command).toContain('size-allow.txt')) and the read of the script text; the unused exports parseAllow and findOversize are no longer exported (nothing imports them).

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
Deleted: loadLocal 'falls back to the defaults when there is no file' (local.test 'answers the defaults'), 'takes both keys from the file' ('reads each key it holds'), 'resolves a relative hub against the engine directory rather than the config folder' (hub: ../hub row), 'refuses a port that is not an integer' (port rows), 'takes the two session paths when the machine names them' (path-key table; sessions_* go through the same filledAt loop, local.ts:316), 'takes the Claude binary used by update-task terminals' (claude_bin in 'reads each key'), 'refuses a session path that is not a path' (path rows), 'takes usage accounts and expands home-relative config folders' (accounts in 'reads each key'), 'refuses an account with an unknown tool' (row), 'refuses colliding Claude labels %s and %s' (it.each 2 rows; row 'A b' vs 'a-b'); checkLocal 'names the file and the rule for every value the reader would throw over' (all 19 bodies are rows or same-branch path keys), 'gives a body that is not YAML by one line, and takes the name it is asked for' ('gives the first line of a parse error', 'names the file it is given'), 'is the rule loadLocal reads by, so an accepted body is read and a refused one throws' (both sides are rows); configDir 'is the config folder of the engine it is given' (join pass-through); loadConfig 'audit: reports code_theme defined in two files like any other key' (an audit by its own comment: same branch as 'reports a top-level key two files define').
Kept test reduced: checkLocal 'accepts a body the reader would read, and says nothing about an unknown key' -> 'says nothing, and prints nothing, about an unknown key' (the accepted-body rows are in local.test.ts 'answers null for the readable text'). Edits to existing assertions: 'names a sentence file that does not parse...' lost `expect(textCatalog(config)['app.chat']).toBe('Chat')` (catalog string) and its comment is corrected; 'accepts distinct Claude labels...' lost the try/finally rmSync (scratch fixture sweeps). describe 'configDir' renamed 'the config folder of an engine' (configDir import removed, its remaining cases use engineRoot, rootsFile, layoutFile and loadConfig).

### checks/config/integrity.test.ts
Read in full. Real-hub gate kept: 'validates with no findings', 'holds exactly what a second count of the tree finds', side projects, JSON round trip, front-matter slide floor, equations vs second count, deck order resolves, planted count of written equations.
Deleted (4): 'reads the config with no findings' (same call and assertion as config-folder.test.ts 'merges without a finding, so no key is defined in two files'), 'names the nine lanes and the holding backlog as what a focus may be' (pins config.vocab.lanes), 'reads the covert-theory slide with its diagram panel and its equation' (pins one project of the hub; diagram panels are held by data/sources/present.test.ts:98, equations by 'reads an equation out of every slide that writes one'), 'prints every link, url and folder value of the hub whose first segment is host-shaped' (its own comment: "A report, not a check"; asserts only that the walk found a value; spec.md item 1: a measurement that asserts nothing a user relies on). The PATH_KEYS constant and the collection.ts imports went with it. Label 'Layer 4, tree check.' added to the head.

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
Label added. Deleted 'reads the catalog out of the real config directory' (pins app.title 'oculus'), 'holds a dedicated glyph with a stand-in for the three appearance toggles' (pins crt/wallpaper/icons; the all-stand-ins ASCII rule is config-folder.test.ts:416). glyph/bracketedGlyph/lookup cases now use a synthetic STAND_INS map instead of the shipped glyphs.yml values (no pin on shipped values); glyphCatalog import removed.

### checks/source/html-sites.test.ts
Label added. Un-exported htmlSites, introTags, isTrusted, attributeOf, isTrustedArgument, looseTrustedIntros, unfilteredSites. Folded isTrustedArgument (3 true rows + 3 false rows) and isTrusted (3 true + 2 false rows) assertion lists into four it.each tables. Real-tree checks (>=34 sites, >=3 trusted Intros, reason length) are kept unchanged (tree check rules; not planted cases).
### checks/source/keys.test.ts
Label added. Un-exported calls, computedFindingKeys, findingLiterals. Planted cases (findingLiterals, calls) are distinct functions: both kept.

### checks/utils (tests of scripts under utils/; labelled "Layer 4, tree check." per brief item 7)
- cited-lines.test.ts: label; made[]/afterEach removed (scratchDir sweeps); readArgs cases quick. Folds: 4 MISSING cases (past end+missing file / blank line / three bad ranges / punctuation) into one it.each of 4 rows 'calls %s MISSING and fails' (old titles: 'calls a line past the end, and a file the tree has not, MISSING and fails'; 'calls a citation that lands on a blank line MISSING'; 'refuses a range that runs backwards, one wider than a screenful, and a number below one'; 'calls a citation landing on a line of punctuation MISSING'); readArgs 6 rows (old: 'reads the root and the report, the last --root winning' 4 assertions; 'names no report for a line that does not read' 2 readArgs assertions + spawn kept as 'prints the usage for a line that does not read'). Head states tagging rule (Decision 3).
- claude-usage.test.ts: label; made[]/afterEach removed.
- migrate-joint-work.test.ts: label; made[]/afterEach removed.
- outside-paths.test.ts: label; made[]/afterEach removed; head states the rule. Deleted 'takes the tokens of a bullet outside its parentheses and none inside them' (Z363: held lower by 'leaves a folder named in prose out of the list...' on entriesOf) and 'takes no folder named in a parenthesis, a clause or a paragraph...' (Z363: the next case 'prints the state/sources/search files...' fails whenever one of those folders is an entry).
- rename-pillar.test.ts: label; 'is the one the reader reports a manifest under the old key for' now asserts RENAMED_FIELDS[from] === to (the relation) instead of pinning both constants' values; rootsOf 5 assertions folded into it.each of 5 rows.
### checks/source/ remaining: history.test.ts read whole, kept (3), head unchanged.


Tags of the files above are in the Tags table; `routes/edit/write.test.ts`, `rail.test.ts` and `roots.test.ts` keep their quick reader cases and tag the request cases (describes in `write.test.ts` and `rail.test.ts`, per test in `roots.test.ts`), and `routes/files/project-files.test.ts` takes the file tag for its cold start.

## Folds

Each fold's old case titles are in the narrative above, against the new table's title template; below, each new table of the sweep (a template that is not in the base copy of its file), its row count and the title of every row as the verbose run prints it. Every row passed.

#### tests/checks/config/options-catalog.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- accepts an empty list as a family and as a list
- names an `options` that is a list
- names a catalog with no `options` key
- names a catalog that holds one key path twice, which the parser refuses

  table: names %s as missing or not a map of config file names | 3 rows, 3 passed
    - a catalog that is not the shape the types say names an `options` that is a list as missing or not a map of config file names
    - a catalog that is not the shape the types say names a catalog with no `options` key as missing or not a map of config file names
    - a catalog that is not the shape the types say names a catalog that holds one key path twice, which the parser refuses as missing or not a map of config file names

#### tests/checks/imports/augments.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- is named for a block that adds to a module of a folder above its own
- is named for a block that fills an empty interface a module below declares
- is named for a reference directive to a module of the tree
- is named for a reference directive with preserve before its path
- is named for a reference directive with resolution-mode before its path

  table: is named for %s | 6 rows, 6 passed
    - augmentation of a module of the tree is named for a block that adds to a module of a folder above its own
    - augmentation of a module of the tree is named for a block that fills an empty interface a module below declares
    - augmentation of a module of the tree is named for a block across layers, in a component as in a module
    - augmentation of a module of the tree is named for a reference directive to a module of the tree, written either way
    - augmentation of a module of the tree is named for a reference directive with preserve before its path
    - augmentation of a module of the tree is named for a reference directive with resolution-mode before its path

#### tests/checks/imports/order.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- holds the data folders
- holds the server folders
- holds the state folders
- holds the ui folders
- holds the shell folders
- holds the views folders

  table: holds the %s folders | 6 rows, 6 passed
    - the folder order of each layer holds the data folders
    - the folder order of each layer holds the server folders
    - the folder order of each layer holds the state folders
    - the folder order of each layer holds the ui folders
    - the folder order of each layer holds the shell folders
    - the folder order of each layer holds the views folders

#### tests/checks/source/html-sites.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- refuses an Intro marked trusted over words that interpolate a value
- judges a trusted prop set to an expression by its words rather than skipping the site

  table: takes %s as the catalog own words | 3 rows, 3 passed
    - every {@html} site takes a catalog key as the catalog own words
    - every {@html} site takes a catalog key through inline Markdown as the catalog own words
    - every {@html} site takes a catalog key with literal arguments as the catalog own words

#### tests/checks/source/html-sites.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- refuses an Intro marked trusted over words that interpolate a value
- judges a trusted prop set to an expression by its words rather than skipping the site

  table: refuses an Intro marked trusted over %s | 3 rows, 3 passed
    - every {@html} site refuses an Intro marked trusted over a value among the arguments
    - every {@html} site refuses an Intro marked trusted over two catalog lines joined
    - every {@html} site refuses an Intro marked trusted over a value in place of a key

#### tests/checks/source/html-sites.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- refuses an Intro marked trusted over words that interpolate a value
- judges a trusted prop set to an expression by its words rather than skipping the site

  table: judges %s by its words rather than skipping the site | 3 rows, 3 passed
    - every {@html} site judges the bare attribute by its words rather than skipping the site
    - every {@html} site judges the attribute set to true by its words rather than skipping the site
    - every {@html} site judges the attribute set to a variable by its words rather than skipping the site

#### tests/checks/source/html-sites.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- refuses an Intro marked trusted over words that interpolate a value
- judges a trusted prop set to an expression by its words rather than skipping the site

  table: does not read %s as trusted | 2 rows, 2 passed
    - every {@html} site does not read no attribute as trusted
    - every {@html} site does not read an attribute that only ends in the word as trusted

#### tests/checks/utils/cited-lines.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- calls a line past the end, and a file the tree has not, MISSING and fails
- calls a citation that lands on a blank line MISSING
- refuses a range that runs backwards, one wider than a screenful, and a number below one
- calls a citation landing on a line of punctuation MISSING
- reads the root and the report, the last --root winning
- names no report for a line that does not read, so the usage is printed

  table: calls %s MISSING and fails | 4 rows, 4 passed
    - the citation check calls a line past the end and a file the tree has not MISSING and fails
    - the citation check calls a line after the last MISSING and fails
    - the citation check calls a range that is too wide, one that runs backwards and a number below one MISSING and fails
    - the citation check calls a line of punctuation MISSING and fails

#### tests/checks/utils/cited-lines.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- calls a line past the end, and a file the tree has not, MISSING and fails
- calls a citation that lands on a blank line MISSING
- refuses a range that runs backwards, one wider than a screenful, and a number below one
- calls a citation landing on a line of punctuation MISSING
- reads the root and the report, the last --root winning
- names no report for a line that does not read, so the usage is printed

  table: reads %s | 8 rows, 8 passed
    - the citation check reads a list of lines, and prints each one once
    - the citation check calls a citation that climbs out of the tree MISSING, and reads nothing there
    - the command line reads the root and the report
    - the command line reads the last --root winning
    - the command line reads a report alone
    - the command line reads no arguments
    - the command line reads a --root with no value, as no report
    - the command line reads an unknown flag, as no report

#### tests/checks/utils/rename-pillar.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- is every root it names, null for none and for a flag, and a word after -- as a root

  table: is %s | 7 rows, 7 passed
    - the rename the script carries is the one the reader reports a manifest under the old key for
    - the migration over a fixture hub writes nothing on a second run, so the script is idempotent
    - the command line is every root it names
    - the command line is null for none
    - the command line is null for a flag before a root
    - the command line is null for a short flag
    - the command line is a word after -- as a root

#### tests/data/file-ops.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- makes the folders between and drops an empty segment, as case 2 creates them
- takes a segment of 255 characters of any width and trims the tabs at the ends of the name
- refuses an empty name, whitespace and a name of tabs
- refuses a leading slash of either kind
- refuses a `.` or `..` segment wherever it sits, so no segment walks out
- refuses a NUL, a segment of only whitespace and a segment of 256 characters
- adds `copy`, then `copy 2`, then `copy 3`, keeping the extension
- names a folder, a file with no extension and a dotfile
- keeps a name that is free
- counts on from a copy that is copied
- stops before the extension, and takes the whole of a dotfile and of a name without one
- holds the sizes the page and the server check against

  table: makes %s as the segments it names | 10 rows, 10 passed
    - the names that are made makes folders between as the segments it names
    - the names that are made makes a backslash as a slash as the segments it names
    - the names that are made makes an empty segment dropped as the segments it names
    - the names that are made makes a trailing slash as the segments it names
    - the names that are made makes a trailing backslash as the segments it names
    - the names that are made makes 255 characters as the segments it names
    - the names that are made makes 128 two-byte characters as the segments it names
    - the names that are made makes 100 wide characters as the segments it names
    - the names that are made makes 255 wide characters as the segments it names
    - the names that are made makes tabs trimmed at the ends as the segments it names

#### tests/data/file-ops.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- makes the folders between and drops an empty segment, as case 2 creates them
- takes a segment of 255 characters of any width and trims the tabs at the ends of the name
- refuses an empty name, whitespace and a name of tabs
- refuses a leading slash of either kind
- refuses a `.` or `..` segment wherever it sits, so no segment walks out
- refuses a NUL, a segment of only whitespace and a segment of 256 characters
- adds `copy`, then `copy 2`, then `copy 3`, keeping the extension
- names a folder, a file with no extension and a dotfile
- keeps a name that is free
- counts on from a copy that is copied
- stops before the extension, and takes the whole of a dotfile and of a name without one
- holds the sizes the page and the server check against

  table: refuses %s as %s | 16 rows, 16 passed
    - the names that are refused refuses whitespace as   
    - the names that are refused refuses a name of tabs as 	
    - the names that are refused refuses a slash alone as /
    - the names that are refused refuses a leading slash as /a
    - the names that are refused refuses a leading backslash as \a
    - the names that are refused refuses a dot as .
    - the names that are refused refuses a double dot as ..
    - the names that are refused refuses a double dot first as ../x
    - the names that are refused refuses double dots between as a/../../b
    - the names that are refused refuses a dot between as a/./b
    - the names that are refused refuses a double dot between backslashes as a\..\b
    - the names that are refused refuses a NUL as a b
    - the names that are refused refuses a segment of only whitespace as a/ /b
    - the names that are refused refuses 256 characters as aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
    - the names that are refused refuses 256 two-byte characters as \u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9\u00e9
    - the names that are refused refuses 256 wide characters as \u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5\u65e5

#### tests/data/file-ops.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- makes the folders between and drops an empty segment, as case 2 creates them
- takes a segment of 255 characters of any width and trims the tabs at the ends of the name
- refuses an empty name, whitespace and a name of tabs
- refuses a leading slash of either kind
- refuses a `.` or `..` segment wherever it sits, so no segment walks out
- refuses a NUL, a segment of only whitespace and a segment of 256 characters
- adds `copy`, then `copy 2`, then `copy 3`, keeping the extension
- names a folder, a file with no extension and a dotfile
- keeps a name that is free
- counts on from a copy that is copied
- stops before the extension, and takes the whole of a dotfile and of a name without one
- holds the sizes the page and the server check against

  table: takes %s as %s | 10 rows, 10 passed
    - the name a copy takes takes a free name kept as a.md
    - the name a copy takes takes copy as report.md
    - the name a copy takes takes copy 2 as report.md
    - the name a copy takes takes the next free number as report.md
    - the name a copy takes takes a folder as notes
    - the name a copy takes takes a file with no extension as notes
    - the name a copy takes takes a dotfile as .env
    - the name a copy takes takes a folder with a dot as v1.2
    - the name a copy takes takes a copy copied as report copy.md
    - the name a copy takes takes a numbered copy copied as report copy 7.md

#### tests/data/file-ops.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- makes the folders between and drops an empty segment, as case 2 creates them
- takes a segment of 255 characters of any width and trims the tabs at the ends of the name
- refuses an empty name, whitespace and a name of tabs
- refuses a leading slash of either kind
- refuses a `.` or `..` segment wherever it sits, so no segment walks out
- refuses a NUL, a segment of only whitespace and a segment of 256 characters
- adds `copy`, then `copy 2`, then `copy 3`, keeping the extension
- names a folder, a file with no extension and a dotfile
- keeps a name that is free
- counts on from a copy that is copied
- stops before the extension, and takes the whole of a dotfile and of a name without one
- holds the sizes the page and the server check against

  table: %s of %s | 6 rows, 6 passed
    - the names that are refused refuses a name of tabs as 	
    - the names that are refused refuses a segment of only whitespace as a/ /b
    - the part of a name a rename selects stops before the extension of report.md
    - the part of a name a rename selects stops before the last extension of a.tar.gz
    - the part of a name a rename selects takes the whole of a dotfile of .env
    - the part of a name a rename selects takes the whole of a name without an extension of notes

#### tests/data/helpers/dates.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- is now under a minute, then the largest unit that fits
- stops at the largest unit it is asked for
- is now for a clock up to a minute ahead, and nothing further ahead
- is nothing for a stamp it cannot read
- writes the local day of a Date and of a timestamp alike

  table: writes the local day of %s | 3 rows, 3 passed
    - localDate writes the local day of a Date late in the day
    - localDate writes the local day of a timestamp late in the day
    - localDate writes the local day of a Date just after midnight

#### tests/data/helpers/editor-options.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- the tracked configuration
- draws no finding of the new keys
- draws no finding
- is a finding when it is not a map
- names a field the record does not have, and a record that is not a map
- does not read a languages that is not a map

  table: is a finding when it is %s | 2 rows, 2 passed
    - editor.languages is a finding when it is a list
    - editor.languages is a finding when it is text

#### tests/data/helpers/editor-options.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- the tracked configuration
- draws no finding of the new keys
- draws no finding
- is a finding when it is not a map
- names a field the record does not have, and a record that is not a map
- does not read a languages that is not a map

  table: names %s | 17 rows, 17 passed
    - a global key outside its words or range reads tab_size: 0 as its default and names the key
    - a global key outside its words or range reads tab_size: 9 as its default and names the key
    - a global key outside its words or range reads tab_size: 2.5 as its default and names the key
    - a global key outside its words or range reads tab_size: -1 as its default and names the key
    - a global key outside its words or range reads tab_size: "4" as its default and names the key
    - a global key outside its words or range reads insert_spaces: "yes" as its default and names the key
    - a global key outside its words or range reads insert_spaces: 1 as its default and names the key
    - a global key outside its words or range reads word_wrap: true as its default and names the key
    - a global key outside its words or range reads word_wrap: "sideways" as its default and names the key
    - a global key outside its words or range reads minimap: "no" as its default and names the key
    - a global key outside its words or range reads render_whitespace: "everything" as its default and names the key
    - a global key outside its words or range reads sticky_scroll: 0 as its default and names the key
    - editor.languages names a language the editor does not know, matched as written, and reads the rest
    - editor.languages names a field the record does not have
    - editor.languages names a record that is a list
    - editor.languages names a record that is a number
    - editor.languages names a reserved language and never merges it

#### tests/data/helpers/editor-options.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- the tracked configuration
- draws no finding of the new keys
- draws no finding
- is a finding when it is not a map
- names a field the record does not have, and a record that is not a map
- does not read a languages that is not a map

  table: does not read a languages that is %s | 2 rows, 2 passed
    - a repository s .oculus/settings.yml does not read a languages that is a list
    - a repository s .oculus/settings.yml does not read a languages that is text

#### tests/data/helpers/editor.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- is the checked-in configuration's own kilobytes, in bytes
- is null for a block that is missing, of the wrong shape, or not a size
- throws naming the key when it is required and the configuration has no usable one
- the source editor cap over sizes of every kind
- reads %j as %j

  table: reads %s as %j bytes | 10 rows, 10 passed
    - the source editor cap reads a missing block as {} bytes
    - the source editor cap reads a block that is text as {"editor":"on"} bytes
    - the source editor cap reads a block that is a list as {"editor":[]} bytes
    - the source editor cap reads an empty block as {"editor":{}} bytes
    - the source editor cap reads a size in text as {"editor":{"paint_limit_kb":"5"}} bytes
    - the source editor cap reads a size of zero as {"editor":{"paint_limit_kb":0}} bytes
    - the source editor cap reads a negative size as {"editor":{"paint_limit_kb":-1}} bytes
    - the source editor cap reads a size that is not a number as {"editor":{"paint_limit_kb":null}} bytes
    - the source editor cap reads an infinite size as {"editor":{"paint_limit_kb":null}} bytes
    - the source editor cap reads a size with a fraction as {"editor":{"paint_limit_kb":2.5}} bytes

#### tests/data/helpers/editor.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- is the checked-in configuration's own kilobytes, in bytes
- is null for a block that is missing, of the wrong shape, or not a size
- throws naming the key when it is required and the configuration has no usable one
- the source editor cap over sizes of every kind
- reads %j as %j

  table: throws naming the key when it is required and there is %s | 2 rows, 2 passed
    - the source editor cap throws naming the key when it is required and there is a missing block
    - the source editor cap throws naming the key when it is required and there is a size of zero

#### tests/data/helpers/files/opens-in-program.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- names none for a double extension, a type off the map, a name with no extension and a dotfile
- names none for a key an object inherits, and none under an empty map
- reads the extensions lowercased, and null for a missing or mistyped map
- tells a bundle id by its shape
- is required at server start, naming the key when it is missing or mistyped
- the extension map read from a configuration of the wrong shape
- answers null for %j
- answers the extensions lowercased, and an empty map for an empty one

  table: names none of the checked-in applications for %s | 10 rows, 10 passed
    - the application a name opens in names none of the checked-in applications for report.docx.command
    - the application a name opens in names none of the checked-in applications for bundle.zip
    - the application a name opens in names none of the checked-in applications for meeting.ics
    - the application a name opens in names none of the checked-in applications for person.vcf
    - the application a name opens in names none of the checked-in applications for screen.vncloc
    - the application a name opens in names none of the checked-in applications for profile.mobileconfig
    - the application a name opens in names none of the checked-in applications for flow.shortcut
    - the application a name opens in names none of the checked-in applications for draft.odt
    - the application a name opens in names none of the checked-in applications for reproduce
    - the application a name opens in names none of the checked-in applications for .docx

#### tests/data/helpers/files/opens-in-program.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- names none for a double extension, a type off the map, a name with no extension and a dotfile
- names none for a key an object inherits, and none under an empty map
- reads the extensions lowercased, and null for a missing or mistyped map
- tells a bundle id by its shape
- is required at server start, naming the key when it is missing or mistyped
- the extension map read from a configuration of the wrong shape
- answers null for %j
- answers the extensions lowercased, and an empty map for an empty one

  table: reads %s | 15 rows, 15 passed
    - the application a name opens in reads a key an object inherits
    - the application a name opens in reads the key __proto__
    - the application a name opens in reads an empty map
    - the application a name opens in reads an upper-case extension
    - the extension map read from a configuration reads a missing block
    - the extension map read from a configuration reads a block that is a list
    - the extension map read from a configuration reads a map that is a list
    - the extension map read from a configuration reads an extension without a dot
    - the extension map read from a configuration reads a double extension
    - the extension map read from a configuration reads a value that is no bundle id
    - the extension map read from a configuration reads a value that is a number
    - the extension map read from a configuration reads a valid extension beside one without a dot
    - the extension map read from a configuration reads the key __proto__
    - the extension map read from a configuration reads extensions in capitals
    - the extension map read from a configuration reads an empty map

#### tests/data/helpers/files/opens-in-program.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- names none for a double extension, a type off the map, a name with no extension and a dotfile
- names none for a key an object inherits, and none under an empty map
- reads the extensions lowercased, and null for a missing or mistyped map
- tells a bundle id by its shape
- is required at server start, naming the key when it is missing or mistyped
- the extension map read from a configuration of the wrong shape
- answers null for %j
- answers the extensions lowercased, and an empty map for an empty one

  table: tells %s by its shape | 6 rows, 6 passed
    - the map in the configuration tells a bundle id of an application by its shape
    - the map in the configuration tells a bundle id with a capital word by its shape
    - the map in the configuration tells a name with no dots by its shape
    - the map in the configuration tells an option for the open command by its shape
    - the map in the configuration tells an empty segment by its shape
    - the map in the configuration tells an id followed by a path by its shape

#### tests/data/helpers/files/paths.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- is the last non-empty segment
- drops the trailing slashes and keeps the root
- joins by one slash, the root folder and a trailing slash included
- is the folder itself for an empty path
- is the path below the folder, or empty for the folder itself
- is null outside the folder, a sibling sharing the prefix included
- is null for every target when the folder is empty
- holds everything absolute under the root folder
- picks the item whose folder holds the target most deeply

  table: names %s by its last non-empty segment | 4 rows, 4 passed
    - nameOf names a folder with a trailing slash by its last non-empty segment
    - nameOf names a bare name by its last non-empty segment
    - nameOf names an empty path by its last non-empty segment
    - nameOf names an absolute path by its last non-empty segment

#### tests/data/helpers/files/paths.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- is the last non-empty segment
- drops the trailing slashes and keeps the root
- joins by one slash, the root folder and a trailing slash included
- is the folder itself for an empty path
- is the path below the folder, or empty for the folder itself
- is null outside the folder, a sibling sharing the prefix included
- is null for every target when the folder is empty
- holds everything absolute under the root folder
- picks the item whose folder holds the target most deeply

  table: drops %s and keeps the root | 4 rows, 4 passed
    - trimSlash drops one trailing slash and keeps the root
    - trimSlash drops two trailing slashes and keeps the root
    - trimSlash drops none and keeps the root
    - trimSlash drops the root and keeps the root

#### tests/data/helpers/files/paths.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- is the last non-empty segment
- drops the trailing slashes and keeps the root
- joins by one slash, the root folder and a trailing slash included
- is the folder itself for an empty path
- is the path below the folder, or empty for the folder itself
- is null outside the folder, a sibling sharing the prefix included
- is null for every target when the folder is empty
- holds everything absolute under the root folder
- picks the item whose folder holds the target most deeply

  table: joins by one slash for %s | 6 rows, 6 passed
    - joinPath joins by one slash for the root folder
    - joinPath joins by one slash for a folder with a trailing slash
    - joinPath joins by one slash for a folder with a nested path
    - joinPath joins by one slash for an empty path
    - joinPath joins by one slash for an empty path under a trailing slash
    - joinPath joins by one slash for an empty path under the root folder

#### tests/data/helpers/files/paths.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- is the last non-empty segment
- drops the trailing slashes and keeps the root
- joins by one slash, the root folder and a trailing slash included
- is the folder itself for an empty path
- is the path below the folder, or empty for the folder itself
- is null outside the folder, a sibling sharing the prefix included
- is null for every target when the folder is empty
- holds everything absolute under the root folder
- picks the item whose folder holds the target most deeply

  table: reads %s as its path below the folder or null | 10 rows, 10 passed
    - pathUnder reads a target below the folder as its path below the folder or null
    - pathUnder reads the folder itself as its path below the folder or null
    - pathUnder reads the folder with a trailing slash as its path below the folder or null
    - pathUnder reads a sibling sharing the prefix as its path below the folder or null
    - pathUnder reads a target above the folder as its path below the folder or null
    - pathUnder reads a target when the folder is empty as its path below the folder or null
    - pathUnder reads the root when the folder is empty as its path below the folder or null
    - pathUnder reads an empty target when the folder is empty as its path below the folder or null
    - pathUnder reads a target below the root folder as its path below the folder or null
    - pathUnder reads the root folder itself as its path below the folder or null

#### tests/data/helpers/files/paths.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- is the last non-empty segment
- drops the trailing slashes and keeps the root
- joins by one slash, the root folder and a trailing slash included
- is the folder itself for an empty path
- is the path below the folder, or empty for the folder itself
- is null outside the folder, a sibling sharing the prefix included
- is null for every target when the folder is empty
- holds everything absolute under the root folder
- picks the item whose folder holds the target most deeply

  table: picks %s for the folder that holds the target most deeply | 2 rows, 2 passed
    - deepestHolding picks the deeper folder for the folder that holds the target most deeply
    - deepestHolding picks the shallower folder for the folder that holds the target most deeply

#### tests/data/helpers/files/text-kind.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- reads plain text, an empty file and accented letters as text
- reads a file opening with a byte order mark as text
- reads a file with a zero byte anywhere in the window as not text
- reads the heads of the archives a research tree holds as not text
- refuses bytes that are not UTF-8, however few of them there are
- the sniff over the cases of one rule
- reads UTF-8 as text and a byte no UTF-8 holds as not
- tells a window cut inside a character from a file that ends inside one
- reads a NUL byte as not text

  table: reads %s as text | 5 rows, 5 passed
    - whether bytes are text reads an empty file as text
    - whether bytes are text reads plain text as text
    - whether bytes are text reads accented letters as text
    - whether bytes are text reads a tab and a return as text
    - whether bytes are text reads a file opening with a byte order mark as text

#### tests/data/helpers/files/text-kind.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- reads plain text, an empty file and accented letters as text
- reads a file opening with a byte order mark as text
- reads a file with a zero byte anywhere in the window as not text
- reads the heads of the archives a research tree holds as not text
- refuses bytes that are not UTF-8, however few of them there are
- the sniff over the cases of one rule
- reads UTF-8 as text and a byte no UTF-8 holds as not
- tells a window cut inside a character from a file that ends inside one
- reads a NUL byte as not text

  table: reads %s as not text | 12 rows, 12 passed
    - whether bytes are text reads a zero byte in the middle of the window as not text
    - whether bytes are text reads a single zero byte as not text
    - whether bytes are text reads the head of a PNG as not text
    - whether bytes are text reads the head of a ZIP, which a .npz is as not text
    - whether bytes are text reads the head of a gzip file as not text
    - whether bytes are text reads a lone continuation byte as not text
    - whether bytes are text reads a lead byte with nothing after it as not text
    - whether bytes are text reads an overlong encoding of a character with a shorter form as not text
    - whether bytes are text reads an overlong three-byte encoding as not text
    - whether bytes are text reads a surrogate half as not text
    - whether bytes are text reads a value past the last code point as not text
    - whether bytes are text reads a byte no UTF-8 holds as not text

#### tests/data/helpers/finding-text.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- puts each argument at its position, as often as the template names it
- leaves a placeholder with no argument as it is written
- reads an argument that is the empty string as an argument
- answers the catalog sentence with its arguments in place
- answers the key followed by its arguments when the catalog lacks the key, and never throws

  table: fills %s | 5 rows, 5 passed
    - fillPlaceholders fills each argument at its position, as often as the template names it
    - fillPlaceholders fills a number
    - fillPlaceholders fills a placeholder with no argument
    - fillPlaceholders fills a word or nothing in braces
    - fillPlaceholders fills an argument that is the empty string

#### tests/data/helpers/finding-text.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- puts each argument at its position, as often as the template names it
- leaves a placeholder with no argument as it is written
- reads an argument that is the empty string as an argument
- answers the catalog sentence with its arguments in place
- answers the key followed by its arguments when the catalog lacks the key, and never throws

  table: answers the catalog sentence for %s with the arguments in place | 4 rows, 4 passed
    - findingText answers the catalog sentence for two arguments with the arguments in place
    - findingText answers the catalog sentence for an argument named twice with the arguments in place
    - findingText answers the catalog sentence for no argument with the arguments in place
    - findingText answers the catalog sentence for a missing argument with the arguments in place

#### tests/data/helpers/finding-text.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- puts each argument at its position, as often as the template names it
- leaves a placeholder with no argument as it is written
- reads an argument that is the empty string as an argument
- answers the catalog sentence with its arguments in place
- answers the key followed by its arguments when the catalog lacks the key, and never throws

  table: answers the key followed by its arguments for %s, a key the catalog lacks, and never throws | 4 rows, 4 passed
    - findingText answers the key followed by its arguments for one argument, a key the catalog lacks, and never throws
    - findingText answers the key followed by its arguments for three arguments, one a number, a key the catalog lacks, and never throws
    - findingText answers the key followed by its arguments for no argument, a key the catalog lacks, and never throws
    - findingText answers the key followed by its arguments for a name inherited from Object, a key the catalog lacks, and never throws

#### tests/data/helpers/guards.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- holds for a map, empty or not
- does not hold for null, a list, or anything not an object
- is the value when it is a string, the empty string included
- is undefined for a number, a boolean, null, a list and a map
- is the string, and the fallback for everything else
- takes the fallback the caller names
- keeps the string items of a list, in order
- drops the items of a list that are not strings
- has nothing for a value that is not a list
- is an empty map for null, a list, a string and everything else
- is the string, and writes a number or a boolean out
- is the fallback for null, undefined, a map and a list
- is the value under a key the record holds
- is the item at a position the list holds
- is undefined past the end and for a negative position, which is no item from the end
- is a finite number the config holds, and null for one it lacks or one that is not finite
- holds for equal values, nested maps and lists included
- fails for a map whose keys come in another order, at any depth
- fails for values that differ

  table: answers %s with %s | 14 rows, 14 passed
    - isMap answers an empty map with {}
    - isMap answers a map with { a: 1 }
    - isMap answers null with null
    - isMap answers a list of maps with [object Object]
    - isMap answers undefined with undefined
    - isMap answers a number with 2026
    - isMap answers a string with a
    - isMap answers a boolean with true
    - sameInOrder answers equal nested maps and lists with { a: [ 1, { b: 2, c: 3 } ], d: null }
    - sameInOrder answers a map with its keys in another order with { a: 1, b: 2 }
    - sameInOrder answers a nested map with its keys in another order with { k: { a: 1, b: 2 } }
    - sameInOrder answers a map in a list with its keys in another order with [object Object]
    - sameInOrder answers maps with a different value with { a: 1 }
    - sameInOrder answers lists in another order with 1,2

#### tests/data/helpers/guards.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- holds for a map, empty or not
- does not hold for null, a list, or anything not an object
- is the value when it is a string, the empty string included
- is undefined for a number, a boolean, null, a list and a map
- is the string, and the fallback for everything else
- takes the fallback the caller names
- keeps the string items of a list, in order
- drops the items of a list that are not strings
- has nothing for a value that is not a list
- is an empty map for null, a list, a string and everything else
- is the string, and writes a number or a boolean out
- is the fallback for null, undefined, a map and a list
- is the value under a key the record holds
- is the item at a position the list holds
- is undefined past the end and for a negative position, which is no item from the end
- is a finite number the config holds, and null for one it lacks or one that is not finite
- holds for equal values, nested maps and lists included
- fails for a map whose keys come in another order, at any depth
- fails for values that differ

  table: reads %s as the string or nothing | 9 rows, 9 passed
    - str reads a string as the string or nothing
    - str reads the empty string as the string or nothing
    - str reads a string with spaces, untrimmed as the string or nothing
    - str reads a number as the string or nothing
    - str reads a boolean as the string or nothing
    - str reads null as the string or nothing
    - str reads undefined as the string or nothing
    - str reads a list as the string or nothing
    - str reads a map as the string or nothing

#### tests/data/helpers/guards.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- holds for a map, empty or not
- does not hold for null, a list, or anything not an object
- is the value when it is a string, the empty string included
- is undefined for a number, a boolean, null, a list and a map
- is the string, and the fallback for everything else
- takes the fallback the caller names
- keeps the string items of a list, in order
- drops the items of a list that are not strings
- has nothing for a value that is not a list
- is an empty map for null, a list, a string and everything else
- is the string, and writes a number or a boolean out
- is the fallback for null, undefined, a map and a list
- is the value under a key the record holds
- is the item at a position the list holds
- is undefined past the end and for a negative position, which is no item from the end
- is a finite number the config holds, and null for one it lacks or one that is not finite
- holds for equal values, nested maps and lists included
- fails for a map whose keys come in another order, at any depth
- fails for values that differ

  table: reads %s as the string or the fallback | 7 rows, 7 passed
    - text reads a string as the string or the fallback
    - text reads the empty string, which is a string as the string or the fallback
    - text reads null as the string or the fallback
    - text reads a number as the string or the fallback
    - text reads a list as the string or the fallback
    - text reads null with a fallback named as the string or the fallback
    - text reads a number with a fallback named as the string or the fallback

#### tests/data/helpers/guards.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- holds for a map, empty or not
- does not hold for null, a list, or anything not an object
- is the value when it is a string, the empty string included
- is undefined for a number, a boolean, null, a list and a map
- is the string, and the fallback for everything else
- takes the fallback the caller names
- keeps the string items of a list, in order
- drops the items of a list that are not strings
- has nothing for a value that is not a list
- is an empty map for null, a list, a string and everything else
- is the string, and writes a number or a boolean out
- is the fallback for null, undefined, a map and a list
- is the value under a key the record holds
- is the item at a position the list holds
- is undefined past the end and for a negative position, which is no item from the end
- is a finite number the config holds, and null for one it lacks or one that is not finite
- holds for equal values, nested maps and lists included
- fails for a map whose keys come in another order, at any depth
- fails for values that differ

  table: keeps %s | 9 rows, 9 passed
    - strings keeps the string items in order
    - strings keeps an empty list
    - strings keeps an empty string item
    - strings keeps items that are not strings
    - strings keeps null
    - strings keeps undefined
    - strings keeps a string
    - strings keeps a number
    - strings keeps a map

#### tests/data/helpers/guards.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- holds for a map, empty or not
- does not hold for null, a list, or anything not an object
- is the value when it is a string, the empty string included
- is undefined for a number, a boolean, null, a list and a map
- is the string, and the fallback for everything else
- takes the fallback the caller names
- keeps the string items of a list, in order
- drops the items of a list that are not strings
- has nothing for a value that is not a list
- is an empty map for null, a list, a string and everything else
- is the string, and writes a number or a boolean out
- is the fallback for null, undefined, a map and a list
- is the value under a key the record holds
- is the item at a position the list holds
- is undefined past the end and for a negative position, which is no item from the end
- is a finite number the config holds, and null for one it lacks or one that is not finite
- holds for equal values, nested maps and lists included
- fails for a map whose keys come in another order, at any depth
- fails for values that differ

  table: is an empty map for %s | 5 rows, 5 passed
    - fields is an empty map for null
    - fields is an empty map for undefined
    - fields is an empty map for a list
    - fields is an empty map for a string
    - fields is an empty map for a number

#### tests/data/helpers/guards.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- holds for a map, empty or not
- does not hold for null, a list, or anything not an object
- is the value when it is a string, the empty string included
- is undefined for a number, a boolean, null, a list and a map
- is the string, and the fallback for everything else
- takes the fallback the caller names
- keeps the string items of a list, in order
- drops the items of a list that are not strings
- has nothing for a value that is not a list
- is an empty map for null, a list, a string and everything else
- is the string, and writes a number or a boolean out
- is the fallback for null, undefined, a map and a list
- is the value under a key the record holds
- is the item at a position the list holds
- is undefined past the end and for a negative position, which is no item from the end
- is a finite number the config holds, and null for one it lacks or one that is not finite
- holds for equal values, nested maps and lists included
- fails for a map whose keys come in another order, at any depth
- fails for values that differ

  table: writes %s out as its text or the fallback | 13 rows, 13 passed
    - scalar writes a string out as its text or the fallback
    - scalar writes the empty string out as its text or the fallback
    - scalar writes a number out as its text or the fallback
    - scalar writes zero, whatever the fallback out as its text or the fallback
    - scalar writes true out as its text or the fallback
    - scalar writes false out as its text or the fallback
    - scalar writes null out as its text or the fallback
    - scalar writes undefined out as its text or the fallback
    - scalar writes a map out as its text or the fallback
    - scalar writes a list out as its text or the fallback
    - scalar writes null with a fallback named out as its text or the fallback
    - scalar writes a map with a fallback named out as its text or the fallback
    - scalar writes a list with a fallback named out as its text or the fallback

#### tests/data/helpers/guards.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- holds for a map, empty or not
- does not hold for null, a list, or anything not an object
- is the value when it is a string, the empty string included
- is undefined for a number, a boolean, null, a list and a map
- is the string, and the fallback for everything else
- takes the fallback the caller names
- keeps the string items of a list, in order
- drops the items of a list that are not strings
- has nothing for a value that is not a list
- is an empty map for null, a list, a string and everything else
- is the string, and writes a number or a boolean out
- is the fallback for null, undefined, a map and a list
- is the value under a key the record holds
- is the item at a position the list holds
- is undefined past the end and for a negative position, which is no item from the end
- is a finite number the config holds, and null for one it lacks or one that is not finite
- holds for equal values, nested maps and lists included
- fails for a map whose keys come in another order, at any depth
- fails for values that differ

  table: reads %s of a list of two | 4 rows, 4 passed
    - item reads the first position of a list of two
    - item reads the last position of a list of two
    - item reads a position past the end of a list of two
    - item reads a negative position, which counts from nowhere of a list of two

#### tests/data/helpers/guards.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- holds for a map, empty or not
- does not hold for null, a list, or anything not an object
- is the value when it is a string, the empty string included
- is undefined for a number, a boolean, null, a list and a map
- is the string, and the fallback for everything else
- takes the fallback the caller names
- keeps the string items of a list, in order
- drops the items of a list that are not strings
- has nothing for a value that is not a list
- is an empty map for null, a list, a string and everything else
- is the string, and writes a number or a boolean out
- is the fallback for null, undefined, a map and a list
- is the value under a key the record holds
- is the item at a position the list holds
- is undefined past the end and for a negative position, which is no item from the end
- is a finite number the config holds, and null for one it lacks or one that is not finite
- holds for equal values, nested maps and lists included
- fails for a map whose keys come in another order, at any depth
- fails for values that differ

  table: reads %s as the number or null | 4 rows, 4 passed
    - numericSetting reads a finite number as the number or null
    - numericSetting reads a missing key as the number or null
    - numericSetting reads a number written as text as the number or null
    - numericSetting reads a number that is not finite as the number or null

#### tests/data/helpers/replace.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- does not count an escaped bracket, a class, a nested class or a non-capturing group
- refuses a replacement that is not what the template makes
- are the four private-use characters from U+E000
- reads a named group as $<name> only when the pattern has one
- reads a number past the group count as one digit and the rest as typed
- reads $0 as the match and $& with a group reference beside it
- turns \\n, \\t and \\\\ into a newline, a tab and one backslash
- writes an empty replace text as the empty text
- reads a group the match did not take as the empty text
- leaves the run and its $N as typed for a group with no text
- keeps the characters past the operations of a group
- writes the replace text as typed, a backslash and a $1 included
- deletes the match for an empty replace text

  table: counts %s as the groups it holds | 5 rows, 5 passed
    - the group template counts an escaped bracket and a class as the groups it holds
    - the group template counts a nested class as the groups it holds
    - the group template counts a class that starts with a bracket as the groups it holds
    - the group template counts a non-capturing group and a flag group as the groups it holds
    - the group template counts a group after an escaped backslash as the groups it holds

#### tests/data/helpers/replace.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- does not count an escaped bracket, a class, a nested class or a non-capturing group
- refuses a replacement that is not what the template makes
- are the four private-use characters from U+E000
- reads a named group as $<name> only when the pattern has one
- reads a number past the group count as one digit and the rest as typed
- reads $0 as the match and $& with a group reference beside it
- turns \\n, \\t and \\\\ into a newline, a tab and one backslash
- writes an empty replace text as the empty text
- reads a group the match did not take as the empty text
- leaves the run and its $N as typed for a group with no text
- keeps the characters past the operations of a group
- writes the replace text as typed, a backslash and a $1 included
- deletes the match for an empty replace text

  table: refuses %s, which is not what the template makes | 2 rows, 2 passed
    - the groups split back out of ripgrep replacement refuses plain text, which is not what the template makes
    - the groups split back out of ripgrep replacement refuses a replacement missing groups, which is not what the template makes

#### tests/data/helpers/replace.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- does not count an escaped bracket, a class, a nested class or a non-capturing group
- refuses a replacement that is not what the template makes
- are the four private-use characters from U+E000
- reads a named group as $<name> only when the pattern has one
- reads a number past the group count as one digit and the rest as typed
- reads $0 as the match and $& with a group reference beside it
- turns \\n, \\t and \\\\ into a newline, a tab and one backslash
- writes an empty replace text as the empty text
- reads a group the match did not take as the empty text
- leaves the run and its $N as typed for a group with no text
- keeps the characters past the operations of a group
- writes the replace text as typed, a backslash and a $1 included
- deletes the match for an empty replace text

  table: finds %s in a text | 5 rows, 5 passed
    - the markers finds U+E000 in a text
    - the markers finds U+E001 in a text
    - the markers finds U+E002 in a text
    - the markers finds U+E003 in a text
    - the markers finds the next private-use character in a text

#### tests/data/helpers/replace.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- does not count an escaped bracket, a class, a nested class or a non-capturing group
- refuses a replacement that is not what the template makes
- are the four private-use characters from U+E000
- reads a named group as $<name> only when the pattern has one
- reads a number past the group count as one digit and the rest as typed
- reads $0 as the match and $& with a group reference beside it
- turns \\n, \\t and \\\\ into a newline, a tab and one backslash
- writes an empty replace text as the empty text
- reads a group the match did not take as the empty text
- leaves the run and its $N as typed for a group with no text
- keeps the characters past the operations of a group
- writes the replace text as typed, a backslash and a $1 included
- deletes the match for an empty replace text

  table: reads %s | 19 rows, 19 passed
    - the groups split back out of ripgrep replacement reads each group by number and by name, group 0 being the match
    - the groups split back out of ripgrep replacement reads an empty group as the empty text
    - a regular expression replace reads a named group the pattern has
    - a regular expression replace reads a named group the pattern lacks
    - a regular expression replace reads a name that is not a group
    - a regular expression replace reads $12 over two groups
    - a regular expression replace reads $23 over two groups
    - a regular expression replace reads $3 over one group
    - a regular expression replace reads $0 as the match
    - a regular expression replace reads $& beside a group reference
    - a regular expression replace reads a backslash n as a newline
    - a regular expression replace reads two backslashes as one
    - a regular expression replace reads a backslash t as a tab
    - a regular expression replace reads a backslash x as typed
    - a regular expression replace reads a trailing backslash as typed
    - a regular expression replace reads an empty replace text
    - a regular expression replace reads a group the match did not take
    - the case operations reads a group with no text
    - the case operations reads two operations over one group

#### tests/data/helpers/replace.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- does not count an escaped bracket, a class, a nested class or a non-capturing group
- refuses a replacement that is not what the template makes
- are the four private-use characters from U+E000
- reads a named group as $<name> only when the pattern has one
- reads a number past the group count as one digit and the rest as typed
- reads $0 as the match and $& with a group reference beside it
- turns \\n, \\t and \\\\ into a newline, a tab and one backslash
- writes an empty replace text as the empty text
- reads a group the match did not take as the empty text
- leaves the run and its $N as typed for a group with no text
- keeps the characters past the operations of a group
- writes the replace text as typed, a backslash and a $1 included
- deletes the match for an empty replace text

  table: writes %s as typed | 3 rows, 3 passed
    - a replace of text searched as text writes a backslash and a $1 as typed
    - a replace of text searched as text writes a $& and a $$ as typed
    - a replace of text searched as text writes an empty replace text as typed

#### tests/data/helpers/search.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- adds the word boundary for word, and keeps the pattern one argument
- matches the pattern case for case
- drops the fixed-strings flag for regex, and keeps it for every other combination
- passes a pattern that opens with a dash as the pattern it is
- the per-file count
- asks for one match past the cap, so a file cut short sends a record with no room
- refuses an empty query and one that is only spaces
- refuses a query longer than the bound and allows one exactly at it
- refuses a root the list does not hold, and allows every root it does
- drops the leading dot-slash ripgrep prints against the directory it was given
- takes the cap for a max that is absent, zero or beyond it
- holds the cap between one and the configured number
- reads max_hits and answers zero for a configuration that has not arrived
- opens a fresh query on the whole root
- refuses a folder that climbs out or is absolute, and any folder with every root
- the hit cap read from a configuration of the wrong shape

  table: sets the flags of %s | 4 rows, 4 passed
    - the argument list sets the flags of word
    - the argument list sets the flags of case
    - the argument list sets the flags of regex
    - the argument list sets the flags of word and case without regex

#### tests/data/helpers/search.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- adds the word boundary for word, and keeps the pattern one argument
- matches the pattern case for case
- drops the fixed-strings flag for regex, and keeps it for every other combination
- passes a pattern that opens with a dash as the pattern it is
- the per-file count
- asks for one match past the cap, so a file cut short sends a record with no room
- refuses an empty query and one that is only spaces
- refuses a query longer than the bound and allows one exactly at it
- refuses a root the list does not hold, and allows every root it does
- drops the leading dot-slash ripgrep prints against the directory it was given
- takes the cap for a max that is absent, zero or beyond it
- holds the cap between one and the configured number
- reads max_hits and answers zero for a configuration that has not arrived
- opens a fresh query on the whole root
- refuses a folder that climbs out or is absolute, and any folder with every root
- the hit cap read from a configuration of the wrong shape

  table: answers %s with %s | 16 rows, 16 passed
    - what is refused answers an empty query with { q: '' }
    - what is refused answers a query of only spaces with { q: '   ' }
    - what is refused answers a query longer than the bound with { q: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' }
    - what is refused answers a query exactly at the bound with { q: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' }
    - what is refused answers a root the list does not hold with { root: 'elsewhere' }
    - what is refused answers a root the list holds with { root: 'hub' }
    - what is refused answers every root with { root: 'all' }
    - what is refused answers a folder that climbs out with { under: '../x', root: 'hub' }
    - what is refused answers a folder that climbs from inside with { under: 'a/../../x', root: 'hub' }
    - what is refused answers a folder that is two dots with { under: '..', root: 'hub' }
    - what is refused answers an absolute folder with { under: '/etc', root: 'hub' }
    - what is refused answers a folder written with a backslash with { under: '\etc', root: 'hub' }
    - what is refused answers a folder with every root with { under: 'src', root: 'all' }
    - what is refused answers no folder with every root with { under: '', root: 'all' }
    - what is refused answers a folder inside a root with { under: 'src/lib', root: 'hub' }
    - the folder a search is scoped to answers a plan with the refusal for a folder that climbs out

#### tests/data/helpers/search.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- adds the word boundary for word, and keeps the pattern one argument
- matches the pattern case for case
- drops the fixed-strings flag for regex, and keeps it for every other combination
- passes a pattern that opens with a dash as the pattern it is
- the per-file count
- asks for one match past the cap, so a file cut short sends a record with no room
- refuses an empty query and one that is only spaces
- refuses a query longer than the bound and allows one exactly at it
- refuses a root the list does not hold, and allows every root it does
- drops the leading dot-slash ripgrep prints against the directory it was given
- takes the cap for a max that is absent, zero or beyond it
- holds the cap between one and the configured number
- reads max_hits and answers zero for a configuration that has not arrived
- opens a fresh query on the whole root
- refuses a folder that climbs out or is absolute, and any folder with every root
- the hit cap read from a configuration of the wrong shape

  table: drops %s | 2 rows, 2 passed
    - the path a hit carries drops the leading dot-slash ripgrep prints against the directory it was given
    - the path a hit carries drops a path with none

#### tests/data/helpers/search.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- adds the word boundary for word, and keeps the pattern one argument
- matches the pattern case for case
- drops the fixed-strings flag for regex, and keeps it for every other combination
- passes a pattern that opens with a dash as the pattern it is
- the per-file count
- asks for one match past the cap, so a file cut short sends a record with no room
- refuses an empty query and one that is only spaces
- refuses a query longer than the bound and allows one exactly at it
- refuses a root the list does not hold, and allows every root it does
- drops the leading dot-slash ripgrep prints against the directory it was given
- takes the cap for a max that is absent, zero or beyond it
- holds the cap between one and the configured number
- reads max_hits and answers zero for a configuration that has not arrived
- opens a fresh query on the whole root
- refuses a folder that climbs out or is absolute, and any folder with every root
- the hit cap read from a configuration of the wrong shape

  table: takes the cap for a max that is %s | 4 rows, 4 passed
    - the parameters takes the cap for a max that is absent
    - the parameters takes the cap for a max that is zero
    - the parameters takes the cap for a max that is beyond it
    - the parameters takes the cap for a max that is inside it

#### tests/data/helpers/search.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- adds the word boundary for word, and keeps the pattern one argument
- matches the pattern case for case
- drops the fixed-strings flag for regex, and keeps it for every other combination
- passes a pattern that opens with a dash as the pattern it is
- the per-file count
- asks for one match past the cap, so a file cut short sends a record with no room
- refuses an empty query and one that is only spaces
- refuses a query longer than the bound and allows one exactly at it
- refuses a root the list does not hold, and allows every root it does
- drops the leading dot-slash ripgrep prints against the directory it was given
- takes the cap for a max that is absent, zero or beyond it
- holds the cap between one and the configured number
- reads max_hits and answers zero for a configuration that has not arrived
- opens a fresh query on the whole root
- refuses a folder that climbs out or is absolute, and any folder with every root
- the hit cap read from a configuration of the wrong shape

  table: holds the cap between one and the configured number for %s | 2 rows, 2 passed
    - the parameters holds the cap between one and the configured number for not a number
    - the parameters holds the cap between one and the configured number for a fraction

#### tests/data/prose/latex.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- reads the sections of a text the parser refuses by a line scan and says it refused
- reads both sections around a line the parser refuses
- reads no includes from a text the parser refuses

  table: reads the sections of a text the parser refuses by a line scan: %s | 3 rows, 3 passed
    - readTex sections reads the sections of a text the parser refuses by a line scan: a title whose brace never closes
    - readTex sections reads the sections of a text the parser refuses by a line scan: a stray dollar sign
    - readTex sections reads the sections of a text the parser refuses by a line scan: an include, which the line scan does not read

#### tests/data/sources/config/merge.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- skips an own __proto__ key at every level
- skips an own __proto__ key holding text
- skips an own __proto__ key holding text or a number below the top
- answers the map it was given when the __proto__ key holds text

  table: skips an own __proto__ key %s | 5 rows, 5 passed
    - flattenText skips an own __proto__ key at the top, holding a map
    - flattenText skips an own __proto__ key below the top, holding a map
    - flattenText skips an own __proto__ key at the top, holding text
    - flattenText skips an own __proto__ key below the top, holding text
    - flattenText skips an own __proto__ key below the top, holding a number

#### tests/data/sources/present.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- reads a value ending in an image suffix, trimmed and in any case, as an image name
- reads anything else as LaTeX
- reads equation: %s as no equation
- reports an entry with no kind, an unknown kind, and a ref that is missing

  table: reads %j, a value ending in an image suffix, as an image name | 7 rows, 7 passed
    - equationIsImage reads "eq_one.png", a value ending in an image suffix, as an image name
    - equationIsImage reads "EQ_ONE.PNG", a value ending in an image suffix, as an image name
    - equationIsImage reads " eq_one.png ", a value ending in an image suffix, as an image name
    - equationIsImage reads "a.jpg", a value ending in an image suffix, as an image name
    - equationIsImage reads "a.jpeg", a value ending in an image suffix, as an image name
    - equationIsImage reads "a.svg", a value ending in an image suffix, as an image name
    - equationIsImage reads "a.webp", a value ending in an image suffix, as an image name

#### tests/data/sources/present.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- reads a value ending in an image suffix, trimmed and in any case, as an image name
- reads anything else as LaTeX
- reads equation: %s as no equation
- reports an entry with no kind, an unknown kind, and a ref that is missing

  table: reads %j as LaTeX | 5 rows, 5 passed
    - equationIsImage reads "\\min_{x} f(x)" as LaTeX
    - equationIsImage reads "x \\text{png}" as LaTeX
    - equationIsImage reads "a.png + b" as LaTeX
    - equationIsImage reads "" as LaTeX
    - equationIsImage reads "  " as LaTeX

#### tests/routes/docs/docs.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- answers 404 for an id the reader does not know
- answers 404 for an id that is a path rather than a folder name
- draws a figure beside a README through the file route
- draws a figure beside it through the file route, under the hub root
- leaves a figure source that climbs out of the hub as the author wrote it
- resolves a figure beside a document in a folder, whatever it climbs on the way
- leaves an address the browser resolves itself alone
- a figure's address in a project's README
- draws a relative source as the file route address, with its alt and its title
- keeps an address the browser resolves itself
- keeps a source that climbs out of the root as the author wrote it
- escapes a quote and an ampersand in the alternative text

  table: answers 404 for %s | 7 rows, 7 passed
    - the document endpoint answers 404 for an id the reader does not know
    - the document endpoint answers 404 for an id that is a path rather than a folder name
    - the document endpoint answers 404 for a name outside the list, a path of its own included
    - the document endpoint answers 404 for a document the project does not have
    - a document of the hub answers 404 for a path that climbs out of the hub
    - a document of the hub answers 404 for a file that is not Markdown, and for one that is not there
    - a document of the hub answers 404 for a missing document while the sentence file does not parse

#### tests/routes/docs/docs.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- answers 404 for an id the reader does not know
- answers 404 for an id that is a path rather than a folder name
- draws a figure beside a README through the file route
- draws a figure beside it through the file route, under the hub root
- leaves a figure source that climbs out of the hub as the author wrote it
- resolves a figure beside a document in a folder, whatever it climbs on the way
- leaves an address the browser resolves itself alone
- a figure's address in a project's README
- draws a relative source as the file route address, with its alt and its title
- keeps an address the browser resolves itself
- keeps a source that climbs out of the root as the author wrote it
- escapes a quote and an ampersand in the alternative text

  table: %s | 33 rows, 33 passed
    - the document endpoint renders a README as HTML
    - the document endpoint gives back the frontmatter block, and renders what follows it
    - the document endpoint serves a document inside the project, not only the ones at its root
    - the document endpoint answers 404 for an id the reader does not know
    - the document endpoint answers 404 for an id that is a path rather than a folder name
    - the document endpoint serves a project's PRESENT.md as its narrative, the front matter split off
    - the document endpoint answers 404 for a name outside the list, a path of its own included
    - the document endpoint answers 404 for a document the project does not have
    - the document endpoint reads the folder from the portfolio the request carries, and no manifest at all
    - the document endpoint finds the folder under a nested scan rule when no portfolio was published
    - the document endpoint refuses a project document reached through a link out of the hub
    - a document of the hub renders the Markdown the path names
    - a document of the hub answers 404 for a path that climbs out of the hub
    - a document of the hub refuses a document the hub reaches only through a link out of it
    - a document of the hub answers 404 for a file that is not Markdown, and for one that is not there
    - a document of the hub answers 404 for a missing document while the sentence file does not parse
    - a re-read of an unchanged file answers with a tag of the process, the size and the modification time, and the file
    - a re-read of an unchanged file answers 304 with no body to a request holding the current tag
    - a re-read of an unchanged file renders again for a tag an earlier server process answered with, the file unchanged
    - a re-read of an unchanged file renders again once the file changed under the tag the page holds
    - a re-read of an unchanged file answers 304 for the manual and a project document the same way
    - a re-read of an unchanged file never answers 304 for a file that is not there, whatever tag is sent
    - the manual is the HELP.md of the engine directory, rendered
    - the manual takes no path, so a path beside it changes nothing
    - a figure's address in a document a relative source in a project README is addressed through the file route
    - a figure's address in a document a source that climbs inside the hub is resolved against the document folder
    - a figure's address in a document keeps an address the browser resolves itself as the author wrote it
    - a figure's address in a document keeps a source that climbs out of the root as the author wrote it
    - the manual's parts cuts the manual at a paragraph holding one diagram and nothing else
    - the manual's parts keeps an image of another address, and a diagram inside a sentence, in the prose
    - the manual's parts reads an alternative text holding an ampersand and a quote as written
    - the manual's parts lists every heading in a table of contents written before a diagram
    - the manual's parts carries no parts on the answer of any other document

#### tests/routes/docs/docs.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- answers 404 for an id the reader does not know
- answers 404 for an id that is a path rather than a folder name
- draws a figure beside a README through the file route
- draws a figure beside it through the file route, under the hub root
- leaves a figure source that climbs out of the hub as the author wrote it
- resolves a figure beside a document in a folder, whatever it climbs on the way
- leaves an address the browser resolves itself alone
- a figure's address in a project's README
- draws a relative source as the file route address, with its alt and its title
- keeps an address the browser resolves itself
- keeps a source that climbs out of the root as the author wrote it
- escapes a quote and an ampersand in the alternative text

  table: keeps %s as the author wrote it | 2 rows, 2 passed
    - a figure's address in a document keeps an address the browser resolves itself as the author wrote it
    - a figure's address in a document keeps a source that climbs out of the root as the author wrote it

#### tests/routes/docs/memories.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- refuses a name that carries a separator or leaves the folder
- refuses a name that is not a picture and one that is not there
- is a name and its data, and nothing else is one
- writes a real PNG and a real JPEG under their own extensions
- refuses bytes that are not the format the extension names, and writes nothing
- refuses a picture larger than the wall takes, and writes nothing
- refuses an empty body of data
- takes a PNG only under .png and a JPEG only under .jpg or .jpeg
- takes nothing under an extension it has no marks for, and nothing too short
- the request the server accepts
- leaves room for the picture base64-encoded inside its JSON wrapper
- is told to the built handler before the handler is loaded
- an upload body of the wrong shape
- answers the name and the data and drops every other key
- refuses a name that is not text

  table: answers 404 for %s | 6 rows, 6 passed
    - one picture served answers 404 for a name that leaves the folder
    - one picture served answers 404 for a name with a separator
    - one picture served answers 404 for an absolute path
    - one picture served answers 404 for a hidden file
    - one picture served answers 404 for a name that is not a picture
    - one picture served answers 404 for a name that is not there

#### tests/routes/docs/memories.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- refuses a name that carries a separator or leaves the folder
- refuses a name that is not a picture and one that is not there
- is a name and its data, and nothing else is one
- writes a real PNG and a real JPEG under their own extensions
- refuses bytes that are not the format the extension names, and writes nothing
- refuses a picture larger than the wall takes, and writes nothing
- refuses an empty body of data
- takes a PNG only under .png and a JPEG only under .jpg or .jpeg
- takes nothing under an extension it has no marks for, and nothing too short
- the request the server accepts
- leaves room for the picture base64-encoded inside its JSON wrapper
- is told to the built handler before the handler is loaded
- an upload body of the wrong shape
- answers the name and the data and drops every other key
- refuses a name that is not text

  table: is none for %s | 4 rows, 4 passed
    - the body of an upload is none for no data
    - the body of an upload is none for no name
    - the body of an upload is none for a bare string
    - the body of an upload is none for a name that is not text

#### tests/routes/docs/memories.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- refuses a name that carries a separator or leaves the folder
- refuses a name that is not a picture and one that is not there
- is a name and its data, and nothing else is one
- writes a real PNG and a real JPEG under their own extensions
- refuses bytes that are not the format the extension names, and writes nothing
- refuses a picture larger than the wall takes, and writes nothing
- refuses an empty body of data
- takes a PNG only under .png and a JPEG only under .jpg or .jpeg
- takes nothing under an extension it has no marks for, and nothing too short
- the request the server accepts
- leaves room for the picture base64-encoded inside its JSON wrapper
- is told to the built handler before the handler is loaded
- an upload body of the wrong shape
- answers the name and the data and drops every other key
- refuses a name that is not text

  table: refuses %s, and writes nothing | 8 rows, 8 passed
    - one picture added refuses an extension the wall does not write, and writes nothing
    - one picture added refuses text under a PNG name, and writes nothing
    - one picture added refuses text under a JPEG name, and writes nothing
    - one picture added refuses a PNG under a JPEG name, and writes nothing
    - one picture added refuses a JPEG under a PNG name, and writes nothing
    - one picture added refuses a picture larger than the wall takes, and writes nothing
    - one picture added refuses an empty body of data, and writes nothing
    - the endpoint of an upload refuses a request without the token, and writes nothing

#### tests/routes/docs/memories.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- refuses a name that carries a separator or leaves the folder
- refuses a name that is not a picture and one that is not there
- is a name and its data, and nothing else is one
- writes a real PNG and a real JPEG under their own extensions
- refuses bytes that are not the format the extension names, and writes nothing
- refuses a picture larger than the wall takes, and writes nothing
- refuses an empty body of data
- takes a PNG only under .png and a JPEG only under .jpg or .jpeg
- takes nothing under an extension it has no marks for, and nothing too short
- the request the server accepts
- leaves room for the picture base64-encoded inside its JSON wrapper
- is told to the built handler before the handler is loaded
- an upload body of the wrong shape
- answers the name and the data and drops every other key
- refuses a name that is not text

  table: %s | 39 rows, 39 passed
    - the picture list answers the picture extensions in name order, each with its size, and nothing else
    - the picture list answers an empty list for a folder that is not configured
    - one picture served streams the named file with its own type and a private cache header
    - one picture served answers 404 for a name that leaves the folder
    - one picture served answers 404 for a name with a separator
    - one picture served answers 404 for an absolute path
    - one picture served answers 404 for a hidden file
    - one picture served answers 404 for a name that is not a picture
    - one picture served answers 404 for a name that is not there
    - one picture served answers 404 when no folder is configured
    - the body of an upload is a name and its data, and every other key is dropped
    - the body of an upload is none for no data
    - the body of an upload is none for no name
    - the body of an upload is none for a bare string
    - the body of an upload is none for a name that is not text
    - one picture added writes the file under the folder and nowhere else
    - one picture added takes the data: prefix a browser FileReader writes
    - one picture added reduces a name that carries a path to its own last segment
    - one picture added refuses an extension the wall does not write, and writes nothing
    - one picture added refuses text under a PNG name, and writes nothing
    - one picture added refuses text under a JPEG name, and writes nothing
    - one picture added refuses a PNG under a JPEG name, and writes nothing
    - one picture added refuses a JPEG under a PNG name, and writes nothing
    - one picture added refuses a picture larger than the wall takes, and writes nothing
    - one picture added refuses an empty body of data, and writes nothing
    - one picture added refuses a name already on the wall, and leaves that picture as it was
    - the endpoint of an upload writes the picture and says which name it wrote
    - the endpoint of an upload refuses a request without the token, and writes nothing
    - the endpoint of an upload refuses a body that is not a picture, and one with no folder to write into
    - the first bytes against the extension takes a PNG under .png
    - the first bytes against the extension takes a JPEG under .jpg
    - the first bytes against the extension takes a JPEG under .jpeg
    - the first bytes against the extension refuses a JPEG under .png
    - the first bytes against the extension refuses a PNG under .jpg
    - the first bytes against the extension refuses a PNG under .webp, which has no marks
    - the first bytes against the extension refuses two bytes under .png, which is too short
    - the first bytes against the extension refuses no bytes under .png
    - the configured folder resolves the configured directory under the hub
    - the configured folder is null when the key is absent, and when the directory leaves the hub

#### tests/routes/docs/wallpaper.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- serves the chosen image with its own type and a private cache header
- names the type by the extension
- answers 404 with no image, no folder and no configuration
- answers 404 to a file that would leave the folder
- returns null when dir is absent
- the configured settings of the wrong shape
- serves nothing for a dir that is empty or not text, and for a block that is a list

  table: serves %s with its own type and a private cache header | 3 rows, 3 passed
    - the response serves a-first with its own type and a private cache header
    - the response serves b-second with its own type and a private cache header
    - the response serves c-third with its own type and a private cache header

#### tests/routes/docs/wallpaper.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- serves the chosen image with its own type and a private cache header
- names the type by the extension
- answers 404 with no image, no folder and no configuration
- answers 404 to a file that would leave the folder
- returns null when dir is absent
- the configured settings of the wrong shape
- serves nothing for a dir that is empty or not text, and for a block that is a list

  table: answers 404 for %s | 4 rows, 4 passed
    - the response answers 404 for no picture in the folder
    - the response answers 404 for a folder that is not there
    - the response answers 404 for no configuration
    - the response answers 404 for a file that would leave the folder

#### tests/routes/docs/wallpaper.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- serves the chosen image with its own type and a private cache header
- names the type by the extension
- answers 404 with no image, no folder and no configuration
- answers 404 to a file that would leave the folder
- returns null when dir is absent
- the configured settings of the wrong shape
- serves nothing for a dir that is empty or not text, and for a block that is a list

  table: serves nothing for %s | 4 rows, 4 passed
    - the configured settings serves nothing for no dir
    - the configured settings serves nothing for a dir that is empty
    - the configured settings serves nothing for a dir that is not text
    - the configured settings serves nothing for a block that is a list

#### tests/routes/edit/audit-mute.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- refuses a signature that is not twelve hex characters, and the file is byte-identical
- refuses a file whose shape the line edit cannot keep, and the file is byte-identical

  table: refuses %s, and the file is byte-identical | 4 rows, 4 passed
    - the audit mute write refuses a signature that is not hex, and the file is byte-identical
    - the audit mute write refuses a signature in capitals, and the file is byte-identical
    - the audit mute write refuses a signature of thirteen characters, and the file is byte-identical
    - the audit mute write refuses a file whose shape the line edit cannot keep, and the file is byte-identical

#### tests/routes/edit/rail.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- refuses a page named twice and leaves the file as it was
- refuses a page no arrangement of the file holds, and an empty one
- refuses a glyph the vocabulary does not hold
- answers unwritable for a file that is not there, and writes nothing
- answers unwritable for a read-only file, and leaves it and its mode as they were

  table: refuses %s and leaves the file as it was | 4 rows, 4 passed
    - the rail write refuses a page named twice and leaves the file as it was
    - the rail write refuses a page no arrangement of the file holds and leaves the file as it was
    - the rail write refuses an empty page and leaves the file as it was
    - the rail write refuses a glyph the vocabulary does not hold and leaves the file as it was

#### tests/routes/files/file.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- names the type of every extension a manual is made of, text with its charset
- names every extension of the manual table as it did
- names the types a manual may carry beyond that table, a text one with its charset
- serves TypeScript as bytes, which a type table reads as video
- falls back to bytes for a name it does not know, a bare dotfile and no extension
- serves the stylesheet the page asks for beside it
- has nothing for a file that is not there
- has nothing for a directory, and nothing for the root itself
- has nothing for a path that climbs out of the root
- has nothing for a symbolic link pointing out of the root
- has nothing for a root nobody configured, and none for a root that is not there
- is the config folder of the engine and nothing above it
- reports an entry that is not a pair of strings and a key two entries share
- has nothing to say about a config with no roots, and reports one that is not a list
- reports roots that are a map as not a list, and keeps no root

  table: names %s as %s | 28 rows, 28 passed
    - the type a name is served as names a.html as text/html; charset=utf-8
    - the type a name is served as names MANUAL.HTML as text/html; charset=utf-8
    - the type a name is served as names a/b/manual.css as text/css; charset=utf-8
    - the type a name is served as names a.js as text/javascript; charset=utf-8
    - the type a name is served as names module.mjs as text/javascript; charset=utf-8
    - the type a name is served as names a.png as image/png
    - the type a name is served as names a.jpg as image/jpeg
    - the type a name is served as names a.jpeg as image/jpeg
    - the type a name is served as names a.gif as image/gif
    - the type a name is served as names a.svg as image/svg+xml
    - the type a name is served as names a.webp as image/webp
    - the type a name is served as names photo.avif as image/avif
    - the type a name is served as names favicon.ico as image/vnd.microsoft.icon
    - the type a name is served as names a.woff as font/woff
    - the type a name is served as names a.woff2 as font/woff2
    - the type a name is served as names a.json as application/json; charset=utf-8
    - the type a name is served as names a.txt as text/plain; charset=utf-8
    - the type a name is served as names a.md as text/markdown; charset=utf-8
    - the type a name is served as names rows.csv as text/csv; charset=utf-8
    - the type a name is served as names a.pdf as application/pdf
    - the type a name is served as names engine.wasm as application/wasm
    - the type a name is served as names archive.tar.gz as application/gzip
    - the type a name is served as names main.ts as application/octet-stream
    - the type a name is served as names main.mts as application/octet-stream
    - the type a name is served as names main.cts as application/octet-stream
    - the type a name is served as names .png as application/octet-stream
    - the type a name is served as names LICENSE as application/octet-stream
    - the type a name is served as names thing.nosuchext as application/octet-stream

#### tests/routes/files/file.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- names the type of every extension a manual is made of, text with its charset
- names every extension of the manual table as it did
- names the types a manual may carry beyond that table, a text one with its charset
- serves TypeScript as bytes, which a type table reads as video
- falls back to bytes for a name it does not know, a bare dotfile and no extension
- serves the stylesheet the page asks for beside it
- has nothing for a file that is not there
- has nothing for a directory, and nothing for the root itself
- has nothing for a path that climbs out of the root
- has nothing for a symbolic link pointing out of the root
- has nothing for a root nobody configured, and none for a root that is not there
- is the config folder of the engine and nothing above it
- reports an entry that is not a pair of strings and a key two entries share
- has nothing to say about a config with no roots, and reports one that is not a list
- reports roots that are a map as not a list, and keeps no root

  table: has nothing for %s | 9 rows, 9 passed
    - serving a file under a root has nothing for a file that is not there
    - serving a file under a root has nothing for a directory
    - serving a file under a root has nothing for the root itself
    - serving a file under a root has nothing for a path that climbs out of the root
    - serving a file under a root has nothing for a path that climbs after descending
    - serving a file under a root has nothing for an absolute path
    - serving a file under a root has nothing for a symbolic link pointing out of the root
    - serving a file under a root has nothing for a root nobody configured
    - serving a file under a root has nothing for a root that is not there

#### tests/routes/files/file.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- names the type of every extension a manual is made of, text with its charset
- names every extension of the manual table as it did
- names the types a manual may carry beyond that table, a text one with its charset
- serves TypeScript as bytes, which a type table reads as video
- falls back to bytes for a name it does not know, a bare dotfile and no extension
- serves the stylesheet the page asks for beside it
- has nothing for a file that is not there
- has nothing for a directory, and nothing for the root itself
- has nothing for a path that climbs out of the root
- has nothing for a symbolic link pointing out of the root
- has nothing for a root nobody configured, and none for a root that is not there
- is the config folder of the engine and nothing above it
- reports an entry that is not a pair of strings and a key two entries share
- has nothing to say about a config with no roots, and reports one that is not a list
- reports roots that are a map as not a list, and keeps no root

  table: reports roots that are %s as not a list, and keeps no root | 2 rows, 2 passed
    - the roots of the configuration reports roots that are text as not a list, and keeps no root
    - the roots of the configuration reports roots that are a map as not a list, and keeps no root

#### tests/routes/files/open.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- requires a path
- refuses a path that is not a string, with or without a root
- refuses a file without the write token and never calls the opener
- reports an unknown root's refusal once without a token refresh or retry
- reports an outside-root refusal once without a token refresh or retry

  table: reports the refusal of %s once, without a token refresh or a retry | 2 rows, 2 passed
    - the open client reports the refusal of an unknown root once, without a token refresh or a retry
    - the open client reports the refusal of a path outside every root once, without a token refresh or a retry

#### tests/routes/machine/commands.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- refuses a saved name that the repository file already holds, writing nothing
- refuses a saved name that a command found in the repository holds, writing nothing
- saves again a name that only the saved list holds

  table: refuses a saved name that %s, writing nothing | 2 rows, 2 passed
    - POST /api/commands refuses a saved name that the repository file already holds, writing nothing
    - POST /api/commands refuses a saved name that a command found in the repository holds, writing nothing

#### tests/routes/sessions/terminal.test.ts
Titles of the base file that are no longer in it (deleted, folded into a table or retitled):

- refuses an unknown dataset without starting a terminal
- refuses a shell-bearing key absent from the snapshot
- refuses a dash-prefixed key even when the snapshot holds it

  table: refuses %s without starting a terminal | 3 rows, 3 passed
    - POST /api/terminal, the recover action refuses a dataset the portfolio does not hold without starting a terminal
    - POST /api/terminal, the recover action refuses a key that carries a shell command without starting a terminal
    - POST /api/terminal, the recover action refuses a dash-prefixed key the portfolio holds without starting a terminal
73 new tables


## Doc text

Sentences outside this step's paths that the sweep makes false, as `grep -n` prints them, with the replacement for the orchestrator to apply at landing.

- `tests/shell/context-guard.test.ts:4-5` (the sentence names the deleted source cases of `routes/page.test.ts`): `grep -n "page.test.ts" tests/shell/context-guard.test.ts` prints `5:// tests/routes/page.test.ts.`, and line 4 reads `// yes everywhere else, a blank area included. The listener that calls it is read as source in`. Replace line 4 with `// yes everywhere else, a blank area included.` and delete line 5.
- `demo/README.md:5` (`tests/data/demo-hub.test.ts` no longer asserts counts): `5:`tests/data/demo-hub.test.ts` builds the portfolio over this folder and asserts zero findings and the counts it holds, so a value that oculus's reader rejects is caught by `npm test`.` Replace `asserts zero findings and the counts it holds` with `asserts zero findings`.
- `src/lib/server/git/git-routes.ts:139` (`spec.md:83`, an export left with no importer: `tests/routes/git/refs.test.ts` was its only importer; a script over `src`, `tests` and `utils` that resolves every import lists `CONFIRMED` of this file as the only export newly without an importer): `139:export const CONFIRMED = [`. Replace with `const CONFIRMED = [`; its use at `:369` is in the same file. `src/lib/server/git/deposit-routes.ts:52` `export const CONFIRMED = [...]` also has no importer, and had none in the base copy (the same script on the base copy lists it), so it is not a result of this sweep.
- `tests/server/core/git/head.test.ts:5` names `tests/routes/git/head.test.ts`, a file that exists neither in the base copy (`ls` of its `tests/routes/git` lists changes, deposit, git, refs, request, untracked) nor now; the sweep did not cause it and it lies in T1c's folder.
- The slow tier's wording (`vite.config.ts:31-35`, `README.md:15`, `HELP.md:344` and `:346`, `agents/spec.md:56`): `T1c-report.md:181-184` proposes the rewrite, which names a test, a describe and a file form and the causes (process, real timer, socket, 100 ms). The tagging here follows that rewrite, with one addition the rewrite does not state: a file or describe is also tagged when a configuration-loading case sits within about 15 ms of the line and its first case pays a cold start (item 3's 'or the file takes the file tag'). The orchestrator may add that clause to the same sentence.
- Checked and still true after the sweep, by `grep -n` or `sed -n` on the final tree: `HELP.md:308` (names `tests/checks/imports/cycles.test.ts` and `order.ts`, both present); `config/catalogs/vocab.yml:153` (the lane-distance check still runs under every theme); `config/catalogs/options.yml:3`; `utils/size-allow.txt:3` (names `tests/checks/tree/size.test.ts`, present); `agents/spec.md:37` (the four real-hub readers all exist, `integrity.test.ts` still reads the real hub); `agents/spec.md:53` (`boundaries.test.ts` present); `src/hooks.server.ts:79` (names `tests/checks/source/keys.test.ts`, present); the nine comments in `utils/diagrams/` and `utils/folder-check.sh:8`, `utils/size-check.sh:9` name files that still exist; a script that reads every `tests/(routes|data|checks|fixtures)/...` path out of `src`, `tests`, `utils`, `demo`, `config`, `DESIGN.md`, `HELP.md` and `README.md` (181 references) finds exactly one that does not exist, the one above.
- Comments that name a deleted test: `grep -rn` of the deleted titles (script over 497 title lines) matched 19 titles in other places; each is either a case of the same title that still exists in another file or a sentence that names no test, and none is a comment that names a deleted case, apart from the two above.

## Helpers of other sweeps left unused

A script over `tests`, `src` and `utils` that resolves every import to its file lists the exports no file imports. After the sweep it lists six in `tests/checks/tree/audits.test.ts` (`Audit`, `cases`, `everyCase`, `findAudits`, `readAudits`, `renderNames`), a file this step may not change (T1d's sweep carries it); and `type ClientState` of `tests/fixtures/client.ts`, which `tests/ui/primitives.test.ts` imports inline (`type ClientState` inside the braces), so it is used. No helper of the seven folders of other sweeps became unused through this sweep.

## Checks found to guard nothing

None. Every tree check kept guards a written rule: comment width, history, size, duplication, boundaries, negatives, scratch, keys, retired, add-forms, html-sites, cycles, augments, order, options-catalog, config-folder, integrity, contrast, lane-distance, diagrams. `retired.test.ts` and `add-forms.test.ts` guard `spec.md:66` and DESIGN.md's 'Unsaved form input is instance state'; they are kept and named under the judgment calls.

## Judgment calls the brief left open

- `routes/shape.test.ts` reads route source text (`spec.md:61`) but enforces a structure rule written only in its own head; kept whole (2 cases), named for Axel's ruling.
- `routes/sessions/terminal-actions.test.ts` 'carries tasks.skip_permissions on the wire, off in the checked-in configuration' asserts a shipped default, a constant; kept because it guards a dangerous default shipping on.
- `data/snapshot/normalise.test.ts` 'takes the version from the caller' and 'carries the findings it was given' copy an argument to the output; kept because nothing else asserts that the version and the findings reach the wire.
- `checks/config/config.test.ts` carries 'Layer 4, tree check.' though five of its describes are reader unit tests.
- `checks/utils/*` are tests of scripts and not tree checks; tagged by cause under Decision 1, labelled 'Layer 4, tree check.' by the literal reading of item 7.
- `checks/source/retired.test.ts` enforces `spec.md:66` for one retired screen only, through a phrase list over three documents; kept.
- `checks/look/lane-distance.test.ts` 'pairs the headers that touch in the layout the view draws' models the Focus layout; its lane-name list and counts come from the shipped config; kept. The light-theme pin table of 22 pairs and the 0.01 reference case were deleted as pins of derived colours.
- `checks/diagrams/parsed.test.ts` cache-count tests are kept: they are the lowest-level holder of the parse reader.
- `checks/config/config-folder.test.ts` lost the assertions that pin shipped values (lists, labels, chord letters, paths); the assertions that state a consistency rule over the shipped config stayed (a key in one file, a reference that resolves, an entry that is valid).
- `checks/config/options-walk.test.ts` is deleted; two cases the holder `data/sources/config/catalog/options.test.ts` lacked ('returns a path once for each key that gives it' and 'is not misled by a reserved name of objects as an entry or as a key') moved into it.
- `routes/files/search.test.ts`: four cases arm a guard `setTimeout` that no test awaits (probe records), so they are quick; if a later change awaits it, the case is slow by cause.
- `routes/files/file.test.ts` keeps 'is the same key on the client, which cannot import the server module': the client's `ENGINE_ROOT` and the server's are two definitions that `src/lib/state/sources/explorer/view/place.ts:20` says agree, so the case is a relation between independent values and not a constant pin.
- `checks/utils/rename-pillar.test.ts` 'is the one the reader reports a manifest under the old key for' keeps its relation assertion and now asserts `RENAMED_FIELDS[from]` is `to` instead of pinning both constants' values.
- The cold-start file tags and describe tags (see Tags) put cases below 100 ms into the slow tier; their minima are in the time appendix (for example `audit-mute.test.ts` 86.4 ms, `config-key.test.ts` 88.4 ms, `ops-replace.test.ts` 88.1 ms, `project-files.test.ts` 52.1 ms for its later cases). The alternative, tagging only tests at or above 100 ms, left the quick tier with a first test per file that paid 100 to 165 ms (the first loop of timing runs showed it flip across the line from run to run).
- The two 99 ms rows of one table in `routes/edit/undo/undo-removed.test.ts` share the file's tag, since a table cannot carry a per-row tag.
- Counts of lines and files use every file of a folder, which gives 37,212 lines in the base copy against the brief's 36,967 for the `.ts` files alone.
- One `git -C . status` was run early in the work by mistake; its output was discarded and it changed nothing. No other git command was run.

## Edits to existing assertions

Assertions lost or changed in kept tests (the deleted kinds, a pinned shipped value, a label, source text):

- `routes/sessions/terminal.test.ts` recover row 'mimic; touch nope' now also asserts the reason 'key is not a dataset in the current portfolio'.
- `routes/files/open.test.ts` both client refusal rows assert `answer.error` (the unknown-root row did not before).
- `routes/sessions/hook.test.ts` the 20 accepted statuses are asserted in the 429 test (they were a separate test).
- `routes/git/untracked.test.ts` waits on `writes.chain` through a `setImmediate` loop instead of 100 ms.
- `data/sources/agents-catalog.test.ts` 'seeds the composer with both agents, their pickers and no finding' is now 'reads with no finding': it lost the assertions of the agent names, picker keys and the cache file name.
- `data/sources/config/settings.test.ts` 'refuses the shipped configuration whose behavior.yml was saved unparseable, as the merge reports it' lost its last statement group (the shipped processes list).
- `checks/config/config-folder.test.ts`: 'reads one catalog file per owner...' lost four catalog-string assertions; the roots test lost its key-list pin and is retitled 'reads the roots of sources.yml without a finding'; 'names a group of its own and a path under the hub for every document' lost its three-path list; 'keys every catalogue group by the rail page...' lost two group labels; 'gives every group a chord and a glyph...' lost the eleven-letter chord list; 'reads each file on its own...' lost its `CATALOG_FILES` loop.
- `checks/config/config.test.ts`: 'names a sentence file that does not parse...' lost its `textCatalog(config)['app.chat']` assertion; 'accepts distinct Claude labels...' lost its `try/finally rmSync`.
- `checks/source/text.test.ts`: the glyph, bracketedGlyph and lookup cases now read a synthetic stand-in map and not the shipped `glyphs.yml`; 'reads the catalog out of the real config directory' and the three-toggle stand-in case were deleted.
- `data/sources/docs.test.ts` 'gives each document its path, present or not' (was 'reports every name in the fixed order...') lost the two constant assertions.
- `checks/tree/size.test.ts`: the awk case lost its assertion over the script's text.
- `checks/tree/boundaries.test.ts` and `duplication.test.ts` each lost the two `isReason('x')` assertions of 'holds every entry of both lists to a reason' (held by the `explains()` cases of `negatives.test.ts`).
- `checks/utils/rename-pillar.test.ts`: see the judgment calls.
- `data/demo-hub.test.ts` 'joins each joint-work entry to the person it names' now asserts `jointWorkPerson` only (`personIds` is held by `normalise.test.ts:574-585`).
- Many kept tests became table rows without changing an expectation; the title-to-row lists are under 'Folds' and the old titles in the narrative.

## Appendix: times

### Slowest quick test of each timed file (minimum of five runs)

One line per file of `tests/routes`, `tests/data` and `tests/checks/utils` run with `--tagsFilter !slow`, five runs each: the quick test with the largest minimum, its five times in run order, and the 1-minute load average at the start of that file's five runs (low to high).

- `tests/checks/utils/cited-lines.test.ts`: 1.3 ms, times [1.3, 1.4, 1.3, 1.4, 1.6], "the command line reads the root and the report", load 5.52 to 9.85
- `tests/checks/utils/outside-paths.test.ts`: 1.3 ms, times [1.3, 1.4, 1.6, 1.3, 1.4], "the bullets that name entries takes every token of a bullet that does not start with one, and a token that holds parentheses", load 5.29 to 9.86
- `tests/checks/utils/rename-pillar.test.ts`: 1.6 ms, times [4.1, 2.3, 1.6, 1.6, 3.1], "the migration over a fixture hub writes nothing on a second run, so the script is idempotent", load 5.29 to 10.11
- `tests/data/accounts/connect.test.ts`: 0.7 ms, times [1.8, 0.7, 0.7, 0.7, 0.9], "a new account takes an unknown provider as mail", load 5.35 to 10.51
- `tests/data/demo-hub.test.ts`: 0.8 ms, times [0.8, 0.9, 0.8, 0.8, 0.9], "the demo hub validates with no findings", load 5.35 to 10.51
- `tests/data/file-ops.test.ts`: 1.0 ms, times [1.2, 1.0, 1.0, 1.0, 1.1], "the names that are made makes folders between as the segments it names", load 5.16 to 10.87
- `tests/data/helpers/dates.test.ts`: 0.8 ms, times [0.9, 0.8, 0.8, 0.9, 0.9], "ago reads 30 seconds as the count and unit it names", load 5.16 to 10.64
- `tests/data/helpers/editor-options.test.ts`: 1.2 ms, times [2.1, 1.2, 2.5, 2.7, 2.5], "editor.languages lists each problem in the Findings view naming its key", load 4.99 to 10.64
- `tests/data/helpers/editor.test.ts`: 0.8 ms, times [0.9, 0.8, 0.8, 0.8, 0.9], "the source editor cap reads a missing block as {} bytes", load 4.99 to 11.39
- `tests/data/helpers/files/languages.test.ts`: 1.2 ms, times [1.3, 1.3, 1.2, 1.2, 1.3], "the tracked map names every language the code window registers and no other, and drops nothing", load 5.15 to 11.51
- `tests/data/helpers/files/nesting.test.ts`: 67.1 ms, times [76.4, 67.1, 75.2, 77.1, 72.9], "the findings says nothing for the shipped patterns", load 5.15 to 11.39
- `tests/data/helpers/files/opens-in-program.test.ts`: 1.0 ms, times [1.0, 1.0, 1.0, 1.0, 1.1], "the application a name opens in names the checked-in application for every listed extension, under a folder and in any case", load 5.21 to 11.39
- `tests/data/helpers/files/paths.test.ts`: 0.7 ms, times [0.9, 0.7, 0.7, 0.8, 0.9], "nameOf names a folder with a trailing slash by its last non-empty segment", load 5.2 to 11.6
- `tests/data/helpers/files/text-kind.test.ts`: 0.7 ms, times [0.7, 0.7, 0.7, 0.7, 1.1], "whether bytes are text reads an empty file as text", load 5.2 to 11.39
- `tests/data/helpers/finding-text.test.ts`: 0.7 ms, times [0.7, 0.7, 0.7, 0.9, 0.9], "fillPlaceholders fills each argument at its position, as often as the template names it", load 5.2 to 11.39
- `tests/data/helpers/guards.test.ts`: 0.6 ms, times [0.8, 0.7, 0.6, 0.7, 1.6], "isMap answers an empty map with {}", load 5.18 to 11.52
- `tests/data/helpers/replace.test.ts`: 0.7 ms, times [0.8, 0.8, 0.7, 0.8, 0.8], "the group template writes every group of the pattern, number 0 and each name, between private-use markers", load 5.18 to 11.52
- `tests/data/helpers/search.test.ts`: 1.0 ms, times [1.0, 1.0, 1.0, 1.0, 1.0], "the argument list reads the pattern as text, ignoring case, when no option is on", load 5.09 to 11.32
- `tests/data/portfolio-config.test.ts`: 10.0 ms, times [12.0, 12.7, 10.2, 10.0, 22.2], "portfolioConfigFrom reads a deck that still holds equations_dir without error and gives the key no effect", load 5.09 to 11.85
- `tests/data/prose/latex.test.ts`: 3.2 ms, times [3.2, 3.2, 5.5, 3.2, 3.2], "readTex sections reads the headings of three real files the parser refuses: 20, 18 and 21", load 5.24 to 11.95
- `tests/data/prose/markdown.test.ts`: 4.7 ms, times [5.3, 4.7, 4.8, 4.9, 5.7], "the code of a document paints a fenced block of a language the highlighter knows", load 5.24 to 11.95
- `tests/data/snapshot/normalise.test.ts`: 1.3 ms, times [1.6, 1.5, 1.4, 1.3, 2.6], "normalise, staleness carries each present document mtime and leaves an absent one without", load 5.22 to 12.19
- `tests/data/snapshot/resources.test.ts`: 13.2 ms, times [18.6, 15.3, 13.2, 13.7, 17.4], "the resources registry holds the three seed entries with their kinds and no finding", load 5.22 to 12.49
- `tests/data/snapshot/validate-shapes.test.ts`: 2.5 ms, times [4.1, 2.5, 5.2, 2.6, 4.2], "validate over fields of the wrong shape reports a key a project.yml carries that the schema does not name, after readManifests", load 5.36 to 12.61
- `tests/data/snapshot/validate.test.ts`: 2.2 ms, times [2.2, 2.2, 2.2, 2.2, 2.9], "validate reports nothing on a manifest that is entirely in order", load 5.57 to 12.61
- `tests/data/sources/agents-catalog.test.ts`: 7.0 ms, times [7.0, 7.6, 7.4, 7.3, 10.3], "the shipped agents catalog reads with no finding", load 5.57 to 12.16
- `tests/data/sources/career.test.ts`: 5.3 ms, times [5.5, 5.4, 5.3, 5.7, 6.1], "reading the career file parses it as the map it is, with no key renamed", load 5.69 to 12.15
- `tests/data/sources/collections.test.ts`: 9.9 ms, times [14.4, 16.9, 14.6, 9.9, 32.8], "readCollections reads the data registry from its datasets list and keeps its metadata", load 5.69 to 10.53
- `tests/data/sources/config/calendar-config.test.ts`: 6.4 ms, times [9.7, 8.2, 8.0, 6.4, 9.2], "the calendars rows of the machine own file reads one row per account, in the order the file names them", load 5.7 to 10.53
- `tests/data/sources/config/catalog/agents.test.ts`: 1.5 ms, times [1.6, 1.6, 1.5, 1.6, 1.5], "cacheModels lists no model for 3", load 5.48 to 10.25
- `tests/data/sources/config/catalog/options.test.ts`: 1.2 ms, times [1.3, 1.3, 1.3, 1.2, 1.3], "catalogOf answers an empty catalog for {}", load 5.48 to 9.83
- `tests/data/sources/config/catalogs.test.ts`: 96.0 ms, times [105.8, 96.0, 101.1, 96.7, 114.8], "themeFindings reports a code theme that is a number or null", load 5.36 to 9.83
- `tests/data/sources/config/languages.test.ts`: 85.0 ms, times [92.3, 91.4, 100.6, 85.0, 96.3], "languageFindings reports nothing for a config without the key", load 5.36 to 11.41
- `tests/data/sources/config/local.test.ts`: 5.7 ms, times [7.2, 6.7, 11.7, 5.7, 11.2], "a path key of local.yml keeps calendar_dir without ~/ as absolute or under the engine folder", load 5.33 to 11.41
- `tests/data/sources/config/mail-config.test.ts`: 6.0 ms, times [7.6, 7.6, 6.2, 6.0, 9.5], "the mail rows of the machine own file reads one row per account, in the order the file names them", load 5.3 to 11.9
- `tests/data/sources/config/merge.test.ts`: 7.3 ms, times [7.3, 8.5, 209.4, 7.5, 10.4], "loadConfig merges the files in name order, a later file winning, and names the key read twice", load 5.3 to 11.9
- `tests/data/sources/config/rail.test.ts`: 0.7 ms, times [0.7, 0.7, 0.7, 0.7, 0.9], "railRows answers null for "x"", load 5.12 to 11.51
- `tests/data/sources/config/settings.test.ts`: 84.2 ms, times [89.1, 86.6, 93.0, 84.2, 103.6], "processesSettings refuses the shipped configuration whose behavior.yml was saved unparseable, as the merge reports it", load 5.12 to 11.31
- `tests/data/sources/docs.test.ts`: 2.8 ms, times [7.2, 5.3, 2.8, 3.0, 5.7], "readDoc over a frontmatter block of the wrong shape reads a block holding "- one\n- two\n" as one finding", load 5.27 to 11.31
- `tests/data/sources/feeds.test.ts`: 1.9 ms, times [4.1, 1.9, 2.0, 2.3, 9.6], "readFeeds over feed files of the wrong shape reads a meta that is a list and an entries that is a map as empty", load 5.27 to 11.36
- `tests/data/sources/manifests.test.ts`: 23.4 ms, times [163.7, 23.4, 26.0, 142.7, 37.6], "readManifests keeps a ghost folder id while removing its filing prefix from the title", load 5.09 to 11.25
- `tests/data/sources/personal.test.ts`: 12.3 ms, times [15.5, 12.7, 12.3, 12.6, 20.1], "a side project on the research surfaces is on no board, no lane and no audit scan, and the idea beside it is on all of them", load 4.92 to 11.47
- `tests/data/sources/present.test.ts`: 6.0 ms, times [6.3, 6.0, 6.1, 6.4, 9.5], "readPresent reads the front matter into one slide under the project id", load 4.92 to 11.72
- `tests/data/sources/registries.test.ts`: 12.4 ms, times [28.3, 12.4, 19.4, 14.1, 18.0], "readRegistries reads entries with their provenance and returns the other keys as meta", load 5.33 to 11.72
- `tests/routes/config-seed.test.ts`: 1.0 ms, times [1.0, 1.0, 1.0, 1.0, 1.2], "the server's seed is at least as new as the held push when that push is another configuration, and carries the read", load 5.14 to 11.66
- `tests/routes/docs/diagrams.test.ts`: 12.5 ms, times [17.3, 12.5, 13.3, 13.6, 27.4], "the diagram route serves a diagram of the folder as an SVG image that loads and runs nothing", load 5.14 to 12.01
- `tests/routes/docs/docs.test.ts`: 20.6 ms, times [24.2, 24.2, 23.3, 20.6, 31.3], "the document endpoint renders a README as HTML", load 5.13 to 12.65
- `tests/routes/docs/memories.test.ts`: 17.2 ms, times [17.2, 28.8, 19.1, 26.7, 18.9], "the picture list answers the picture extensions in name order, each with its size, and nothing else", load 5.13 to 12.65
- `tests/routes/docs/wallpaper.test.ts`: 13.1 ms, times [16.5, 13.9, 13.1, 162.9, 17.5], "the response serves a-first with its own type and a private cache header", load 5.2 to 12.5
- `tests/routes/edit/rail.test.ts`: 2.1 ms, times [2.3, 2.1, 2.1, 2.1, 2.3], "the rail body reader reads no write in a body whose rows are not three strings", load 7.59 to 8.06
- `tests/routes/edit/roots.test.ts`: 1.5 ms, times [1.5, 1.5, 1.6, 1.5, 1.5], "the roots write reads no write in a body that is not an add of a dir or a remove of a key", load 7.1 to 9.94
- `tests/routes/edit/side-project-writes.test.ts`: 97.1 ms, times [101.9, 98.7, 97.1, 109.7, 134.3], "a side project is not found by the manifest write under its slug", load 5.79 to 12.57
- `tests/routes/edit/write.test.ts`: 2.0 ms, times [2.3, 2.1, 2.8, 2.0, 2.1], "the config-key body is read as the file, the key and the value, whatever the value is", load 10.56 to 11.84
- `tests/routes/files/file.test.ts`: 13.0 ms, times [15.8, 13.4, 14.0, 13.0, 16.6], "serving a file under a root serves an html file with its type and a private cache header", load 6.27 to 11.68
- `tests/routes/files/fs.test.ts`: 15.1 ms, times [16.6, 15.1, 15.7, 24.6, 16.5], "the fs route, writing keeps both changes when two adds are in flight at once", load 6.27 to 11.63
- `tests/routes/files/history.test.ts`: 48.6 ms, times [57.3, 51.3, 48.6, 62.1, 52.8], "restoring a copy writes the copy back, and the history gains the text it replaced", load 6.24 to 11.63
- `tests/routes/files/open-program.test.ts`: 19.3 ms, times [19.6, 19.3, 21.3, 20.0, 19.3], "a file handed to the application its extension names refuses a double extension and every type the map names no application for, in either form", load 6.24 to 12.46
- `tests/routes/files/open.test.ts`: 14.5 ms, times [16.2, 21.1, 14.5, 14.7, 15.6], "the open endpoint requires the write token", load 6.3 to 12.46
- `tests/routes/files/search.test.ts`: 10.2 ms, times [16.5, 10.5, 11.6, 13.8, 10.2], "the gates refuses a request without the write token", load 6.35 to 9.82
- `tests/routes/files/source.test.ts`: 11.3 ms, times [11.3, 11.4, 12.4, 12.2, 12.1], "POST /api/source requires the current write token", load 6.35 to 9.82
- `tests/routes/git/changes.test.ts`: 19.5 ms, times [23.6, 30.9, 19.5, 25.8, 28.6], "the change log endpoint answers the newest page first, with the page size it used", load 6.81 to 10.64
- `tests/routes/git/deposit.test.ts`: 14.2 ms, times [16.3, 49.5, 16.9, 14.2, 16.8], "the ids a deposit may name, over a hub whose scan carries the side-projects tier holds the manuscript and not the side project", load 6.81 to 10.51
- `tests/routes/git/git.test.ts`: 96.1 ms, times [96.1, 103.8, 96.1, 103.6, 107.9], "the git endpoint refuses a request with no token", load 6.66 to 10.23
- `tests/routes/machine/commands.test.ts`: 96.2 ms, times [96.2, 96.9, 105.7, 113.3, 100.1], "POST /api/commands saves a command for the repository, private, and logs the change", load 6.4 to 9.9
- `tests/routes/machine/hpc.test.ts`: 3.5 ms, times [3.8, 3.5, 3.5, 3.6, 3.5], "HPC route returns 400 for a bad body or id", load 6.21 to 9.9
- `tests/routes/machine/lines.test.ts`: 11.6 ms, times [12.0, 12.2, 11.6, 16.9, 18.3], "the line count route answers with the count", load 5.87 to 9.34
- `tests/routes/page.test.ts`: 2.1 ms, times [2.7, 2.1, 2.2, 3.0, 2.7], "the page load installs the catalogs the server shipped and raises the generation once", load 5.87 to 9.24
- `tests/routes/sessions/compose.test.ts`: 9.0 ms, times [9.8, 9.8, 15.4, 9.0, 16.9], "POST /api/terminal, the compose action starts the agent with its picks and the prompt as one argument, in the workspace", load 5.92 to 13.48
- `tests/routes/sessions/hook.test.ts`: 5.6 ms, times [5.6, 6.1, 6.3, 6.4, 6.3], "POST /api/hook answers 200 with ok for the hook's post", load 6.01 to 15.74
- `tests/routes/sessions/latex.test.ts`: 12.7 ms, times [12.7, 97.7, 12.9, 19.0, 13.3], "GET /api/latex for a project answers one row per main file, with the folder and the errors of the last build", load 5.85 to 15.12
- `tests/routes/sessions/terminal-actions.test.ts`: 48.2 ms, times [50.7, 48.2, 48.9, 55.9, 51.0], "POST /api/terminal, the task action carries tasks.skip_permissions on the wire, off in the checked-in configuration", load 5.78 to 15.59
- `tests/routes/sessions/terminal-edit.test.ts`: 93.1 ms, times [93.1, 97.3, 110.0, 106.3, 194.4], "the restyle action unsets the option for an empty value, and touches only the option it was given", load 5.78 to 15.15
- `tests/routes/sessions/terminal.test.ts`: 4.7 ms, times [5.3, 4.7, 5.4, 6.3, 6.3], "GET /api/terminal after a write lists a terminal immediately after POST starts it", load 5.72 to 14.81
- `tests/routes/sessions/transcript.test.ts`: 7.6 ms, times [10.4, 10.1, 7.6, 9.0, 18.4], "GET /api/transcript answers the turns of the session the payload holds", load 5.66 to 14.35
- `tests/routes/shape.test.ts`: 7.2 ms, times [16.0, 7.2, 10.5, 12.3, 19.5], "the API route modules hold nothing but route modules: no handler parked in a file beside one", load 5.52 to 14.06

### Quick tests whose minimum is 80 ms or more

- 97.1 ms, times [101.9, 98.7, 97.1, 109.7, 134.3], `tests/routes/edit/side-project-writes.test.ts`, "a side project is not found by the manifest write under its slug"
- 96.2 ms, times [96.2, 96.9, 105.7, 113.3, 100.1], `tests/routes/machine/commands.test.ts`, "POST /api/commands saves a command for the repository, private, and logs the change"
- 96.1 ms, times [96.1, 103.8, 96.1, 103.6, 107.9], `tests/routes/git/git.test.ts`, "the git endpoint refuses a request with no token"
- 96.0 ms, times [105.8, 96.0, 101.1, 96.7, 114.8], `tests/data/sources/config/catalogs.test.ts`, "themeFindings reports a code theme that is a number or null"
- 93.1 ms, times [93.1, 97.3, 110.0, 106.3, 194.4], `tests/routes/sessions/terminal-edit.test.ts`, "the restyle action unsets the option for an empty value, and touches only the option it was given"
- 90.2 ms, times [90.8, 90.2, 97.3, 106.5, 192.5], `tests/routes/sessions/terminal-edit.test.ts`, "the restyle action sets @oculus_icon for a glyph of the vocabulary and refuses one that is not there"
- 87.9 ms, times [97.5, 88.8, 87.9, 94.0, 97.2], `tests/routes/git/git.test.ts`, "the git endpoint refuses an action it does not know, and a body that is not JSON"
- 85.0 ms, times [92.3, 91.4, 100.6, 85.0, 96.3], `tests/data/sources/config/languages.test.ts`, "languageFindings reports nothing for a config without the key"
- 84.2 ms, times [89.1, 86.6, 93.0, 84.2, 103.6], `tests/data/sources/config/settings.test.ts`, "processesSettings refuses the shipped configuration whose behavior.yml was saved unparseable, as the merge reports it"
- 83.2 ms, times [92.3, 162.0, 83.2, 90.9, 135.5], `tests/data/sources/config/catalogs.test.ts`, "iconFindings reports nothing for a glyphs key that is a list"

Quick tier summary: 1618 tests timed, the largest minimum is 97.1 ms, 10 tests have a minimum of 80 ms or more, none has 100 ms or more.

### Every slow test: times of its five runs in the slow tier

Each slow file was run alone with `--tagsFilter slow`, five runs. A line gives the minimum, the five times in run order, the file and the test title. The reason a file or describe is tagged is in the tag table above; a test tagged by cause is not subject to the 100 ms rule.

- 33.3 ms, times [34.4, 64.2, 33.3, 36.4, 33.5], `tests/checks/utils/cited-lines.test.ts`, "the citation check reads a list of lines, and prints each one once"
- 32.2 ms, times [37.5, 43.5, 33.1, 37.6, 32.2], `tests/checks/utils/cited-lines.test.ts`, "the citation check prints the line the tree holds at every citation"
- 31.3 ms, times [31.6, 57.1, 33.4, 33.1, 31.3], `tests/checks/utils/cited-lines.test.ts`, "the citation check calls a range that is too wide, one that runs backwards and a number below one MISSING and fails"
- 31.0 ms, times [32.1, 81.3, 38.6, 33.6, 31.0], `tests/checks/utils/cited-lines.test.ts`, "the citation check calls a line past the end and a file the tree has not MISSING and fails"
- 30.2 ms, times [30.2, 42.8, 37.1, 33.2, 30.9], `tests/checks/utils/cited-lines.test.ts`, "the citation check calls a citation that climbs out of the tree MISSING, and reads nothing there"
- 29.9 ms, times [230.5, 44.0, 34.3, 46.5, 29.9], `tests/checks/utils/cited-lines.test.ts`, "the citation check calls a line of punctuation MISSING and fails"
- 29.8 ms, times [30.4, 45.3, 31.3, 31.7, 29.8], `tests/checks/utils/cited-lines.test.ts`, "the citation check calls a line after the last MISSING and fails"
- 28.5 ms, times [32.8, 41.5, 31.9, 33.7, 28.5], `tests/checks/utils/cited-lines.test.ts`, "the citation check refuses a report the tree does not hold"
- 26.5 ms, times [26.5, 32.6, 31.2, 34.1, 29.1], `tests/checks/utils/cited-lines.test.ts`, "the command line prints the usage for a line that does not read"
- 780.3 ms, times [780.3, 1217.7, 848.1, 1644.6, 975.5], `tests/checks/utils/claude-usage.test.ts`, "claude-usage.sh preserves an existing target on malformed stdin and replaces it on valid stdin"
- 284.1 ms, times [288.4, 583.6, 284.1, 390.6, 285.6], `tests/checks/utils/claude-usage.test.ts`, "claude-usage.sh writes the input unchanged under the account and prints the complete status"
- 270.3 ms, times [274.2, 379.4, 290.4, 333.2, 270.3], `tests/checks/utils/claude-usage.test.ts`, "claude-usage.sh leaves absent status parts out"
- 190.1 ms, times [190.1, 284.2, 329.4, 428.3, 203.9], `tests/checks/utils/migrate-joint-work.test.ts`, "migrate-joint-work.mjs reads the owner flags, and refuses a flag it does not know or one with nothing after it"
- 130.6 ms, times [130.6, 223.6, 288.0, 218.0, 164.4], `tests/checks/utils/migrate-joint-work.test.ts`, "migrate-joint-work.mjs gives a person every organisation their Institution row names, the first one primary"
- 122.1 ms, times [589.8, 209.5, 250.5, 193.4, 122.1], `tests/checks/utils/migrate-joint-work.test.ts`, "migrate-joint-work.mjs carries the Institution rows of a handed-in file onto people the registry already holds"
- 57.7 ms, times [73.4, 77.2, 57.7, 69.3, 270.7], `tests/checks/utils/migrate-joint-work.test.ts`, "migrate-joint-work.mjs writes a note holding a line break, a colon and a quote so it reads back unchanged"
- 52.8 ms, times [61.8, 101.6, 52.8, 77.1, 78.6], `tests/checks/utils/migrate-joint-work.test.ts`, "migrate-joint-work.mjs writes a list inside an entry on one line with no padding inside its brackets, a tag plain"
- 46.3 ms, times [46.9, 52.4, 53.7, 76.3, 46.3], `tests/checks/utils/migrate-joint-work.test.ts`, "migrate-joint-work.mjs refuses a --from file that is not there, writing nothing"
- 196.9 ms, times [313.9, 304.1, 196.9, 235.4, 428.4], `tests/checks/utils/outside-paths.test.ts`, "the paths a step changed that its brief does not name prints nothing for a changed file the section names"
- 160.8 ms, times [350.3, 230.1, 160.8, 236.7, 285.6], `tests/checks/utils/outside-paths.test.ts`, "the paths a step changed that its brief does not name prints a changed file the section does not name"
- 155.2 ms, times [239.3, 216.8, 808.1, 252.0, 155.2], `tests/checks/utils/outside-paths.test.ts`, "the paths a step changed that its brief does not name lets a token of two segments cover the same two segments under any folder"
- 147.9 ms, times [355.0, 170.6, 340.0, 178.5, 147.9], `tests/checks/utils/outside-paths.test.ts`, "the paths a step changed that its brief does not name prints a path holding a space or a non-ASCII letter as it is"
- 144.5 ms, times [328.7, 197.2, 154.4, 221.3, 144.5], `tests/checks/utils/outside-paths.test.ts`, "the paths a step changed that its brief does not name lets a token of one segment cover only the path equal to it"
- 141.2 ms, times [141.2, 227.8, 168.3, 191.6, 196.8], `tests/checks/utils/outside-paths.test.ts`, "the paths a step changed that its brief does not name prints the old and the new path of a rename when neither is named"
- 140.4 ms, times [140.4, 242.6, 289.5, 202.7, 155.1], `tests/checks/utils/outside-paths.test.ts`, "the paths a step changed that its brief does not name covers tools/oculus/<token> by a token written relative to tools/oculus"
- 133.5 ms, times [133.5, 207.7, 294.6, 213.8, 146.0], `tests/checks/utils/outside-paths.test.ts`, "the paths a step changed that its brief does not name reads only the backticked tokens of the section, and only up to the next heading"
- 132.8 ms, times [132.8, 237.1, 309.1, 226.8, 267.2], `tests/checks/utils/outside-paths.test.ts`, "the paths a step changed that its brief does not name reads a line range after a token as the whole file"
- 130.4 ms, times [258.9, 196.6, 130.4, 203.4, 143.8], `tests/checks/utils/outside-paths.test.ts`, "the paths a step changed that its brief does not name prints an untracked file the section does not name, and not an ignored one"
- 128.0 ms, times [128.0, 215.4, 373.6, 196.7, 134.6], `tests/checks/utils/outside-paths.test.ts`, "the paths a step changed that its brief does not name prints a deleted file the section does not name"
- 126.3 ms, times [126.3, 450.9, 141.6, 204.7, 412.2], `tests/checks/utils/outside-paths.test.ts`, "the paths a step changed that its brief does not name prints nothing for a file under a folder entry that ends with a slash"
- 102.9 ms, times [102.9, 143.8, 107.2, 137.7, 279.3], `tests/checks/utils/outside-paths.test.ts`, "the report that cannot compare exits 2 with a sentence for a base git does not know"
- 87.5 ms, times [87.5, 136.8, 89.3, 129.6, 346.5], `tests/checks/utils/outside-paths.test.ts`, "the report that cannot compare exits 2 with a sentence for a brief with no such section"
- 86.5 ms, times [218.6, 120.1, 86.5, 122.1, 100.9], `tests/checks/utils/outside-paths.test.ts`, "the report that cannot compare exits 2 with a sentence for a brief that cannot be read"
- 9.5 ms, times [18.2, 14.7, 11.0, 18.6, 9.5], `tests/data/sources/personal.test.ts`, "the file kinds that are never read is named for a named pipe, and is not opened"
- 133.6 ms, times [323.6, 212.0, 255.9, 185.5, 133.6], `tests/routes/docs/docs.test.ts`, "a document of the hub answers 404 for a missing document while the sentence file does not parse"
- 112.2 ms, times [112.2, 145.9, 120.8, 302.9, 116.5], `tests/routes/docs/side-project-docs.test.ts`, "the document endpoint over a side project answers 404 for the slug of a side project when no portfolio was published"
- 365.5 ms, times [386.0, 395.9, 365.5, 526.4, 438.7], `tests/routes/edit/audit-mute.test.ts`, "the audit mute write does not know a body whose signature or flag is of the wrong shape"
- 156.4 ms, times [173.7, 156.4, 170.4, 308.8, 221.9], `tests/routes/edit/audit-mute.test.ts`, "the audit mute write parks one signature and keeps every other byte of the file"
- 115.7 ms, times [133.2, 115.7, 116.8, 208.4, 142.3], `tests/routes/edit/audit-mute.test.ts`, "the audit mute write keeps a line of the list that is not a signature, and mutes nothing by it"
- 104.3 ms, times [104.3, 119.0, 108.0, 192.2, 123.7], `tests/routes/edit/audit-mute.test.ts`, "the audit mute write parks a signature at most once"
- 103.8 ms, times [114.5, 104.3, 104.2, 185.4, 103.8], `tests/routes/edit/audit-mute.test.ts`, "the audit mute write writes nothing when a signature that is not parked is brought back"
- 103.4 ms, times [103.7, 113.9, 103.4, 200.0, 120.1], `tests/routes/edit/audit-mute.test.ts`, "the audit mute write brings one back, leaving the others where they were"
- 95.0 ms, times [105.0, 114.8, 95.0, 200.1, 108.2], `tests/routes/edit/audit-mute.test.ts`, "the audit mute write adds the key to a file that does not hold it yet"
- 90.2 ms, times [91.9, 90.2, 103.2, 217.1, 127.8], `tests/routes/edit/audit-mute.test.ts`, "the audit mute write refuses a signature of thirteen characters, and the file is byte-identical"
- 88.6 ms, times [91.6, 140.0, 88.6, 163.9, 125.9], `tests/routes/edit/audit-mute.test.ts`, "the audit mute write refuses a file whose shape the line edit cannot keep, and the file is byte-identical"
- 88.4 ms, times [99.8, 88.4, 91.6, 164.1, 119.2], `tests/routes/edit/audit-mute.test.ts`, "the audit mute write refuses a signature that is not hex, and the file is byte-identical"
- 87.0 ms, times [95.0, 87.0, 105.5, 135.0, 186.0], `tests/routes/edit/audit-mute.test.ts`, "the audit mute write refuses a signature in capitals, and the file is byte-identical"
- 86.4 ms, times [94.7, 107.9, 86.4, 194.4, 109.2], `tests/routes/edit/audit-mute.test.ts`, "the audit mute write refuses a behavior file that is not there, and says which refusal it was"
- 823.4 ms, times [823.4, 1120.0, 1087.7, 1003.6, 998.3], `tests/routes/edit/config-key.test.ts`, "taking a setting back answers gone once the key has left the file or the file no longer parses"
- 500.2 ms, times [500.2, 503.1, 516.8, 766.5, 624.2], `tests/routes/edit/config-key.test.ts`, "taking a setting back is refused by the same readers, with their sentence, when it would put a refused value back"
- 475.4 ms, times [475.4, 563.4, 507.4, 758.4, 711.3], `tests/routes/edit/config-key.test.ts`, "taking a setting back puts the file back byte for byte and logs the undo above the write"
- 460.4 ms, times [549.0, 460.4, 510.8, 903.7, 899.7], `tests/routes/edit/config-key.test.ts`, "taking a setting back answers moved when the file has been edited since, and leaves it alone"
- 432.5 ms, times [432.5, 640.2, 641.9, 807.2, 625.5], `tests/routes/edit/config-key.test.ts`, "several settings written lands two writes made at once, none lost to the other"
- 349.0 ms, times [349.0, 417.7, 355.8, 736.8, 420.2], `tests/routes/edit/config-key.test.ts`, "a setting written through the route answers what changed, writes the file and records the change as a setting"
- 313.7 ms, times [577.0, 362.0, 313.7, 625.3, 577.8], `tests/routes/edit/config-key.test.ts`, "a file the route cannot read or write answers unwritable for a read-only file, and leaves it and its mode as they were"
- 257.9 ms, times [286.5, 257.9, 302.9, 328.5, 318.9], `tests/routes/edit/config-key.test.ts`, "a setting written through the route writes nothing and records nothing for the value the file already holds"
- 256.5 ms, times [256.5, 352.3, 335.4, 337.1, 617.3], `tests/routes/edit/config-key.test.ts`, "a setting written through the route answers the reason of a refusal with a 200, and writes and records nothing"
- 242.9 ms, times [261.7, 514.2, 242.9, 332.1, 422.1], `tests/routes/edit/config-key.test.ts`, "taking a setting back answers gone for a record naming a file the catalog does not track"
- 185.3 ms, times [185.3, 308.7, 294.0, 402.1, 321.0], `tests/routes/edit/config-key.test.ts`, "a file the route cannot read or write answers unwritable for a file that is not there, and records nothing"
- 88.4 ms, times [88.4, 287.2, 291.0, 313.9, 463.6], `tests/routes/edit/config-key.test.ts`, "the change log without its bound stops the target before any writer runs, so the file stays as it is"
- 565.9 ms, times [623.5, 622.4, 569.5, 645.8, 565.9], `tests/routes/edit/config-value.test.ts`, "taking a list back answers moved once the key was written again, and leaves the file alone"
- 519.1 ms, times [544.1, 716.6, 625.5, 601.5, 519.1], `tests/routes/edit/config-value.test.ts`, "taking a list back puts the file back byte for byte and logs the undo above the write"
- 379.1 ms, times [379.1, 451.7, 569.5, 483.5, 465.4], `tests/routes/edit/config-value.test.ts`, "a list written through the route answers what changed, writes the file and records the change as a setting"
- 359.2 ms, times [359.2, 538.9, 424.8, 522.3, 422.2], `tests/routes/edit/config-value.test.ts`, "several lists written refuses the second of two writes of one key made at once with the same base"
- 331.1 ms, times [331.1, 499.2, 387.5, 609.0, 458.7], `tests/routes/edit/config-value.test.ts`, "taking a list back answers gone once the file no longer parses"
- 275.1 ms, times [275.1, 361.6, 386.6, 422.1, 336.4], `tests/routes/edit/config-value.test.ts`, "a list written through the route answers 400 for a body missing the base, which is not a write, where the same body with it is"
- 237.8 ms, times [270.6, 309.0, 237.8, 359.7, 434.0], `tests/routes/edit/config-value.test.ts`, "a list written through the route answers the reason of a refusal with a 200, and writes and records nothing"
- 168.5 ms, times [168.5, 175.2, 173.9, 172.2, 175.7], `tests/routes/edit/rail.test.ts`, "the rail write writes the list in its order and keeps every other line of the file"
- 112.9 ms, times [114.4, 116.2, 116.8, 151.3, 112.9], `tests/routes/edit/rail.test.ts`, "the rail write records the change, and the undo puts the list back through the same writer"
- 112.2 ms, times [116.1, 121.8, 116.4, 159.8, 112.2], `tests/routes/edit/rail.test.ts`, "the rail write refuses the undo once the list has been edited since"
- 99.9 ms, times [107.2, 106.8, 104.1, 99.9, 108.1], `tests/routes/edit/rail.test.ts`, "the rail write refuses an empty page and leaves the file as it was"
- 98.8 ms, times [104.3, 98.8, 100.4, 130.0, 100.7], `tests/routes/edit/rail.test.ts`, "the rail write refuses a page no arrangement of the file holds and leaves the file as it was"
- 97.3 ms, times [105.8, 100.2, 107.0, 97.3, 104.8], `tests/routes/edit/rail.test.ts`, "the rail write refuses a page named twice and leaves the file as it was"
- 96.2 ms, times [99.6, 99.5, 97.5, 98.6, 96.2], `tests/routes/edit/rail.test.ts`, "the rail write writes nothing and records nothing for the list the file already holds"
- 92.9 ms, times [102.1, 97.6, 99.7, 92.9, 99.0], `tests/routes/edit/rail.test.ts`, "the rail write refuses a glyph the vocabulary does not hold and leaves the file as it was"
- 175.6 ms, times [175.6, 205.0, 213.7, 227.4, 256.4], `tests/routes/edit/roots.test.ts`, "the roots write appends the folder as an entry under a key made from its name, keeping every other line"
- 148.4 ms, times [148.4, 182.4, 200.1, 191.1, 186.8], `tests/routes/edit/roots.test.ts`, "the roots write refuses the undo of an add once the list was changed since"
- 139.7 ms, times [139.7, 207.6, 186.4, 194.7, 186.8], `tests/routes/edit/roots.test.ts`, "the roots write records the add and the remove, and the undo of each puts the list back"
- 134.4 ms, times [134.4, 147.8, 161.2, 167.8, 208.3], `tests/routes/edit/roots.test.ts`, "the roots write refuses a folder already listed, one that is not there, a file and a relative path"
- 125.6 ms, times [125.6, 160.5, 170.3, 193.7, 221.4], `tests/routes/edit/roots.test.ts`, "the roots write files a second folder of the same name under another key"
- 121.1 ms, times [121.1, 168.7, 186.1, 167.3, 180.2], `tests/routes/edit/roots.test.ts`, "the roots write never files a folder under the hub key or the engine key"
- 106.0 ms, times [106.0, 108.1, 181.5, 164.2, 175.0], `tests/routes/edit/roots.test.ts`, "the roots write removes an entry by its key and keeps every other line"
- 96.6 ms, times [96.6, 112.4, 146.2, 156.3, 137.2], `tests/routes/edit/roots.test.ts`, "the roots write answers unwritable when the target holds no sources file"
- 94.9 ms, times [94.9, 125.1, 136.3, 145.1, 130.7], `tests/routes/edit/roots.test.ts`, "the roots write offers no removal of the hub or the engine config folder, or of a key not listed"
- 326.0 ms, times [338.5, 547.1, 326.0, 383.0, 377.2], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood gives a follow-up back whichever shape the file held it in, after the editor cleared it"
- 284.0 ms, times [367.0, 408.0, 291.3, 308.5, 284.0], `tests/routes/edit/undo/undo-removed.test.ts`, "the offset and the text of a removed record puts the lines back for a whole non-negative offset, however large"
- 255.2 ms, times [493.3, 349.2, 255.2, 345.3, 289.8], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood gives two neighbouring fields back exactly when the upper one is undone first"
- 253.5 ms, times [253.5, 394.1, 266.9, 312.5, 277.9], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood gives two fields of one write back in either order of the undos"
- 238.4 ms, times [282.7, 415.0, 238.4, 321.1, 242.7], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood finds the place again after a line above it was rewritten"
- 228.1 ms, times [243.4, 348.9, 228.1, 287.3, 347.9], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood gives the shape back when the note was written with its date, whichever shape the note had"
- 220.9 ms, times [236.7, 365.9, 220.9, 239.9, 299.8], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood gives a bare or one-list follow-up back as the text the file held, after an edit of it"
- 215.0 ms, times [282.9, 424.1, 215.0, 294.2, 263.2], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood finds the place again after the same write changed a field above it"
- 177.2 ms, times [184.4, 232.3, 177.2, 218.1, 204.5], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood gives a title back with its quotes and its comment"
- 139.1 ms, times [357.1, 360.8, 171.9, 177.6, 139.1], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood puts the removal back again when the undo itself is undone"
- 126.0 ms, times [250.7, 166.1, 137.0, 126.0, 138.9], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood writes the value, as a map, for the undo of one field of a two-field write on a bare note"
- 125.9 ms, times [125.9, 213.6, 374.5, 171.8, 307.6], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood gives a bare note back as the text the file held after a later write above it"
- 122.5 ms, times [122.5, 240.9, 132.4, 191.5, 171.5], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood puts the lines at the nearest line start when the line that followed was edited"
- 120.7 ms, times [120.7, 285.0, 147.5, 139.2, 505.9], `tests/routes/edit/undo/undo-removed.test.ts`, "what a change record keeps of a removed field keeps the removed lines, their place and the line after them"
- 118.8 ms, times [118.8, 312.4, 130.7, 143.4, 139.3], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood gives a status line back as the only child of its map"
- 118.7 ms, times [118.7, 169.9, 138.1, 153.6, 129.5], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood gives a last line without a line break back without one"
- 117.7 ms, times [178.5, 176.7, 117.7, 175.8, 178.3], `tests/routes/edit/undo/undo-removed.test.ts`, "a record without usable removed lines refuses a record of a field no write may set, whatever removed says"
- 117.5 ms, times [120.8, 171.4, 117.5, 149.7, 132.9], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood gives a file with CRLF line ends back byte for byte"
- 115.6 ms, times [154.1, 242.2, 115.6, 141.9, 242.7], `tests/routes/edit/undo/undo-removed.test.ts`, "a record without usable removed lines writes the value, not the lines, when removed is a fractional offset"
- 114.6 ms, times [122.0, 178.1, 114.6, 132.3, 291.2], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood gives a block list back in the block style"
- 114.6 ms, times [114.6, 268.3, 138.3, 156.1, 127.7], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood puts the lines before the occurrence of the following line nearest where they stood"
- 112.1 ms, times [112.1, 244.4, 117.0, 164.7, 132.4], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood refuses to write over a field edited since, whatever the record keeps"
- 111.9 ms, times [111.9, 181.7, 127.9, 257.6, 135.0], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood gives a title with a letter outside ASCII back"
- 110.9 ms, times [110.9, 184.2, 113.7, 182.1, 143.1], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood writes the value instead when the file no longer holds what the expanding write left"
- 110.6 ms, times [126.5, 234.3, 110.6, 143.9, 288.8], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood gives a group cleared whole back"
- 110.1 ms, times [119.8, 219.0, 110.1, 119.1, 168.3], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood gives a one-note list holding a map back as the list, comments included"
- 109.6 ms, times [109.6, 307.9, 262.7, 149.5, 127.8], `tests/routes/edit/undo/undo-removed.test.ts`, "what a change record keeps of a removed field keeps nothing for the undo of a removal"
- 108.9 ms, times [108.9, 221.2, 121.9, 148.4, 195.5], `tests/routes/edit/undo/undo-removed.test.ts`, "what a change record keeps of a removed field keeps nothing for a write that changed a value or added a line"
- 108.6 ms, times [139.4, 171.8, 108.6, 153.7, 122.0], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood writes the value into the map that has come back when no place keeps one status"
- 108.3 ms, times [118.5, 335.6, 108.3, 146.1, 177.4], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood keeps a key added at the end of the file since"
- 107.8 ms, times [107.8, 150.9, 292.8, 142.5, 127.3], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood gives a key of a flow map back inside its line"
- 106.7 ms, times [106.7, 198.1, 109.9, 156.0, 126.1], `tests/routes/edit/undo/undo-removed.test.ts`, "a record without usable removed lines writes the value, not the lines, when removed is no next"
- 105.5 ms, times [105.5, 154.7, 113.7, 154.4, 125.3], `tests/routes/edit/undo/undo-removed.test.ts`, "a record without usable removed lines writes the value, not the lines, when removed is a string"
- 104.6 ms, times [108.2, 209.1, 104.6, 141.7, 118.1], `tests/routes/edit/undo/undo-removed.test.ts`, "taking a removed field back where it stood finds the place again when the record stood past the end of the file"
- 104.4 ms, times [104.4, 278.7, 124.5, 141.8, 125.5], `tests/routes/edit/undo/undo-removed.test.ts`, "a record without usable removed lines writes the value, not the lines, when removed is a negative offset"
- 103.5 ms, times [103.5, 264.7, 251.2, 191.1, 122.2], `tests/routes/edit/undo/undo-removed.test.ts`, "a record without usable removed lines writes the value, not the lines, when removed is empty text"
- 103.4 ms, times [103.4, 732.8, 491.9, 151.8, 207.2], `tests/routes/edit/undo/undo-removed.test.ts`, "a record without usable removed lines appends the value when the record has no removed lines"
- 103.2 ms, times [103.2, 205.3, 106.8, 138.5, 122.7], `tests/routes/edit/undo/undo-removed.test.ts`, "a record without usable removed lines writes the value, not the lines, when removed is text that is a number"
- 101.1 ms, times [101.7, 208.5, 101.1, 170.8, 131.3], `tests/routes/edit/undo/undo-removed.test.ts`, "a record without usable removed lines writes the value, not the lines, when removed is an offset written as text"
- 100.9 ms, times [100.9, 249.8, 106.2, 129.4, 120.6], `tests/routes/edit/undo/undo-removed.test.ts`, "a record without usable removed lines writes the value, not the lines, when removed is a list"
- 99.5 ms, times [103.1, 290.4, 99.5, 144.4, 121.3], `tests/routes/edit/undo/undo-removed.test.ts`, "a record without usable removed lines writes the value, not the lines, when removed is null"
- 99.5 ms, times [108.0, 157.5, 99.5, 152.8, 131.6], `tests/routes/edit/undo/undo-removed.test.ts`, "a record without usable removed lines writes the value, not the lines, when removed is a next that is a number"
- 99.5 ms, times [106.3, 162.3, 99.5, 148.7, 155.3], `tests/routes/edit/undo/undo-removed.test.ts`, "a record without usable removed lines refuses a group with no removed lines, or lines that fit nowhere"
- 623.8 ms, times [652.5, 729.9, 919.5, 899.9, 623.8], `tests/routes/edit/undo/undo-replaced.test.ts`, "a config-value write of an aligned family, undone gives the undo of the undo back byte for byte as well"
- 555.2 ms, times [555.2, 749.1, 810.1, 934.6, 585.3], `tests/routes/edit/undo/undo-replaced.test.ts`, "a config-value write of an aligned family, undone gives the file back byte for byte, as written"
- 492.5 ms, times [544.3, 492.5, 646.2, 695.4, 562.4], `tests/routes/edit/undo/undo-replaced.test.ts`, "an undo with no text to put back goes through the value write for a record without the text"
- 467.2 ms, times [516.9, 526.8, 624.9, 780.6, 467.2], `tests/routes/edit/undo/undo-replaced.test.ts`, "a config-value write of an aligned family, undone gives the file back byte for byte, with CRLF line ends"
- 440.4 ms, times [629.0, 440.4, 622.4, 731.7, 798.6], `tests/routes/edit/undo/undo-replaced.test.ts`, "an undo with no text to put back refuses an undo when the value at the key changed since"
- 454.2 ms, times [569.9, 493.7, 454.2, 643.9, 516.8], `tests/routes/edit/undo/undo.test.ts`, "taking back a change whose file cannot be written answers unwritable for a setting whose file has turned read-only"
- 219.1 ms, times [271.5, 234.4, 219.1, 309.8, 257.6], `tests/routes/edit/undo/undo.test.ts`, "taking a change back writes a manifest field back, logs the undo, and undoes the undo"
- 218.3 ms, times [251.0, 244.9, 218.3, 319.0, 232.3], `tests/routes/edit/undo/undo.test.ts`, "taking back a change whose file cannot be written answers unwritable for a deck and a rail list whose file can no longer be read"
- 149.9 ms, times [149.9, 188.7, 163.2, 226.7, 167.3], `tests/routes/edit/undo/undo.test.ts`, "taking a change back puts a collection entry field and a feed field back"
- 146.5 ms, times [268.2, 152.2, 146.5, 282.9, 288.0], `tests/routes/edit/undo/undo.test.ts`, "taking a change back puts a dismissed session back, and takes a dismissal back"
- 143.3 ms, times [207.5, 163.6, 180.2, 221.4, 143.3], `tests/routes/edit/undo/undo.test.ts`, "taking a change back takes a created entry out again and puts a deleted one back"
- 138.6 ms, times [138.6, 299.9, 150.5, 253.5, 148.2], `tests/routes/edit/undo/undo.test.ts`, "taking a change back puts a career host and a subtask line back"
- 138.6 ms, times [180.4, 184.1, 138.6, 357.2, 139.0], `tests/routes/edit/undo/undo.test.ts`, "taking a change back takes an added lead out again, and puts a deleted one back as it was recorded"
- 135.4 ms, times [141.0, 166.3, 135.4, 174.7, 167.8], `tests/routes/edit/undo/undo.test.ts`, "taking a change back puts a session override back"
- 129.8 ms, times [137.0, 135.9, 129.8, 204.0, 136.1], `tests/routes/edit/undo/undo.test.ts`, "taking a manifest write back exactly puts the link back when the undo itself is undone"
- 129.3 ms, times [139.6, 174.5, 129.3, 172.0, 161.4], `tests/routes/edit/undo/undo.test.ts`, "taking a manifest write back exactly gives a number back as a number"
- 128.9 ms, times [128.9, 158.6, 265.3, 196.6, 135.3], `tests/routes/edit/undo/undo.test.ts`, "taking a change back records a dismissed lead as a status write and reopens it on the undo"
- 128.7 ms, times [151.1, 150.2, 128.7, 178.5, 275.4], `tests/routes/edit/undo/undo.test.ts`, "taking a change back puts a collection order back"
- 127.2 ms, times [362.1, 145.9, 127.2, 215.5, 137.4], `tests/routes/edit/undo/undo.test.ts`, "taking a change back refuses with `moved` when the field has changed since, and leaves the file alone"
- 126.8 ms, times [132.1, 126.8, 128.2, 177.3, 157.4], `tests/routes/edit/undo/undo.test.ts`, "taking back a change whose file cannot be written answers unwritable for a deck whose file has turned read-only"
- 126.4 ms, times [136.7, 126.5, 126.4, 174.1, 154.9], `tests/routes/edit/undo/undo.test.ts`, "taking a manifest write back exactly gives a list back with the spaces its items held"
- 125.4 ms, times [152.9, 225.9, 125.4, 183.4, 145.2], `tests/routes/edit/undo/undo.test.ts`, "taking a manifest write back exactly gives `related: []` back after a link wrote a project into it"
- 125.3 ms, times [131.4, 160.6, 125.3, 211.2, 151.0], `tests/routes/edit/undo/undo.test.ts`, "taking a change back puts the deck's two lists back to what the save before them left"
- 123.3 ms, times [123.3, 159.2, 131.0, 225.8, 130.8], `tests/routes/edit/undo/undo.test.ts`, "taking a manifest write back exactly gives a checkbox back as the word the file held, not as true"
- 122.6 ms, times [148.7, 147.7, 122.6, 175.6, 125.0], `tests/routes/edit/undo/undo.test.ts`, "taking a change back puts a deleted collection entry back as it was recorded"
- 122.1 ms, times [122.1, 150.7, 129.2, 196.0, 132.8], `tests/routes/edit/undo/undo.test.ts`, "taking a change back puts a subtask line back as it was"
- 119.2 ms, times [135.0, 120.0, 119.2, 181.0, 141.2], `tests/routes/edit/undo/undo.test.ts`, "taking a manifest write back exactly gives an empty title back as an empty title"
- 117.9 ms, times [130.0, 152.8, 122.6, 152.2, 117.9], `tests/routes/edit/undo/undo.test.ts`, "taking back a change whose file cannot be written answers unwritable for a rail list whose file has turned read-only"
- 117.8 ms, times [117.8, 193.7, 130.0, 166.0, 130.6], `tests/routes/edit/undo/undo.test.ts`, "taking a manifest write back exactly gives `pin: false` back after it was ticked"
- 117.6 ms, times [158.8, 117.6, 129.1, 180.8, 131.7], `tests/routes/edit/undo/undo.test.ts`, "taking a manifest write back exactly takes a list field out again when the file did not hold it"
- 115.7 ms, times [145.6, 120.2, 115.7, 175.3, 147.9], `tests/routes/edit/undo/undo.test.ts`, "taking a manifest write back exactly gives a title back with the spaces the file held around it"
- 115.1 ms, times [115.1, 181.5, 124.3, 160.8, 123.0], `tests/routes/edit/undo/undo.test.ts`, "taking a manifest write back exactly refuses a record that names a read-only field or a map field"
- 114.1 ms, times [128.4, 261.2, 114.1, 171.6, 174.4], `tests/routes/edit/undo/undo.test.ts`, "taking a manifest write back exactly answers `moved` when the list the record left has been edited since"
- 113.2 ms, times [138.5, 141.9, 113.2, 185.2, 128.5], `tests/routes/edit/undo/undo.test.ts`, "taking a change back answers `refused` for an undo whose writer wrote nothing, and says nothing happened"
- 111.0 ms, times [133.4, 116.6, 111.0, 162.0, 128.5], `tests/routes/edit/undo/undo.test.ts`, "taking a change back answers `nothing` for a write that cannot be taken back"
- 108.7 ms, times [108.7, 120.9, 108.7, 148.8, 117.1], `tests/routes/edit/undo/undo.test.ts`, "taking a manifest write back exactly refuses a record that names a field the schema does not name"
- 108.0 ms, times [177.4, 132.6, 108.0, 174.9, 120.9], `tests/routes/edit/undo/undo.test.ts`, "taking a change back answers `gone` when what the write addressed is no longer in the hub"
- 107.8 ms, times [113.6, 125.8, 109.4, 164.6, 107.8], `tests/routes/edit/undo/undo.test.ts`, "taking a manifest write back exactly still reads an empty control of a form write as clearing the field"
- 105.3 ms, times [120.5, 110.7, 105.3, 148.9, 107.0], `tests/routes/edit/undo/undo.test.ts`, "taking a change back writes no change log at all when the target names none"
- 100.0 ms, times [132.9, 105.7, 100.0, 132.8, 104.4], `tests/routes/edit/undo/undo.test.ts`, "taking a change back answers `unknown` for a moment the log does not hold"
- 385.7 ms, times [429.1, 468.7, 388.9, 385.7, 495.9], `tests/routes/edit/write.test.ts`, "the deck write does not know a body whose two lists are not lists of words"
- 318.8 ms, times [318.8, 501.5, 332.5, 363.3, 429.7], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes requires a fresh non-empty id for new venues"
- 304.6 ms, times [308.8, 425.5, 304.6, 320.2, 395.5], `tests/routes/edit/write.test.ts`, "the deck write refuses an empty selection, a key it does not know and a repeated key"
- 285.5 ms, times [323.3, 433.7, 301.7, 285.5, 372.6], `tests/routes/edit/write.test.ts`, "the deck write refuses an order that is not a permutation of the catalog"
- 193.3 ms, times [295.7, 324.8, 224.2, 193.3, 274.2], `tests/routes/edit/write.test.ts`, "the write endpoint adds and promotes LinkedIn files through the two write kinds"
- 137.2 ms, times [229.5, 167.3, 182.3, 137.2, 183.6], `tests/routes/edit/write.test.ts`, "the write endpoint pins a session to the top of its group through the route, and takes it off"
- 127.6 ms, times [162.0, 159.9, 127.6, 160.7, 136.7], `tests/routes/edit/write.test.ts`, "the write endpoint carries a refusal back with the fields it did write"
- 126.0 ms, times [161.6, 192.6, 192.5, 126.0, 146.1], `tests/routes/edit/write.test.ts`, "the write endpoint answers 404 for an id the hub does not hold"
- 125.7 ms, times [193.2, 233.5, 179.8, 125.7, 181.8], `tests/routes/edit/write.test.ts`, "the write endpoint writes a feed field and deletes an allowed feed entry"
- 123.2 ms, times [185.5, 207.6, 294.9, 123.2, 149.8], `tests/routes/edit/write.test.ts`, "the write endpoint dismisses a session, and brings it back, in the overrides file"
- 120.9 ms, times [189.9, 186.7, 189.5, 120.9, 177.6], `tests/routes/edit/write.test.ts`, "the write endpoint refuses a request with no token"
- 120.1 ms, times [184.9, 153.4, 150.8, 120.1, 173.7], `tests/routes/edit/write.test.ts`, "the write endpoint carries a dismissal, a pin and a title in one body"
- 117.0 ms, times [189.1, 154.1, 117.0, 120.8, 151.8], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 200 for a good entry body"
- 116.5 ms, times [135.0, 184.5, 116.5, 141.3, 246.0], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 400 for a malformed config-key body"
- 116.4 ms, times [182.0, 235.2, 193.1, 116.4, 166.8], `tests/routes/edit/write.test.ts`, "the write endpoint adds a lead with defaults and refuses one without a title"
- 115.6 ms, times [115.6, 165.5, 123.2, 119.6, 180.4], `tests/routes/edit/write.test.ts`, "the deck write writes both lists into the deck file and keeps every other byte of it"
- 114.8 ms, times [176.5, 159.8, 114.8, 166.0, 135.7], `tests/routes/edit/write.test.ts`, "the write endpoint refuses an area that is not absolute as a refusal, not an error"
- 112.4 ms, times [165.4, 181.2, 190.7, 112.4, 160.7], `tests/routes/edit/write.test.ts`, "the write endpoint writes the field and says what changed"
- 109.5 ms, times [128.2, 188.6, 120.8, 109.5, 231.3], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes carries flat raw maps through entry and new-entry writes"
- 109.5 ms, times [115.0, 140.1, 109.5, 135.5, 154.2], `tests/routes/edit/write.test.ts`, "the deck write saves the selection in the order the reader left the deck in"
- 109.0 ms, times [211.3, 181.2, 109.0, 131.8, 155.1], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 200 for a good host body"
- 108.8 ms, times [131.9, 152.4, 117.8, 108.8, 176.2], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes carries metalists through entry and new-entry writes"
- 108.7 ms, times [145.2, 152.5, 116.4, 108.7, 207.8], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 200 for a good new-idea body"
- 107.4 ms, times [139.9, 154.4, 123.3, 107.4, 154.3], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 200 for a good new-entry body"
- 107.3 ms, times [199.2, 181.9, 107.3, 128.2, 161.5], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 200 for a good subtask body"
- 106.3 ms, times [153.1, 175.3, 168.7, 106.3, 240.4], `tests/routes/edit/write.test.ts`, "the write endpoint refuses a body that is not JSON, and one that is not a manifest write"
- 105.7 ms, times [119.9, 129.1, 106.8, 105.7, 145.0], `tests/routes/edit/write.test.ts`, "the deck write writes nothing when the file already holds exactly those two lists"
- 105.6 ms, times [186.5, 202.9, 105.6, 118.6, 154.6], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 200 for a good subtask-add body"
- 102.7 ms, times [122.3, 149.8, 107.3, 102.7, 137.2], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 200 for a good reorder body"
- 102.1 ms, times [102.2, 152.8, 102.1, 104.7, 175.4], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 400 for a malformed linkedin-post body"
- 102.0 ms, times [135.9, 139.9, 107.3, 102.0, 191.9], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 400 for a malformed entry body"
- 101.6 ms, times [255.5, 148.1, 131.8, 101.6, 155.6], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 200 for a good lead-add body"
- 101.5 ms, times [122.1, 141.0, 105.2, 101.5, 139.5], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 200 for a good delete-entry body"
- 101.5 ms, times [108.0, 133.4, 107.5, 101.5, 273.5], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 200 for a good linkedin-idea body"
- 101.3 ms, times [150.8, 136.9, 101.3, 105.3, 141.3], `tests/routes/edit/write.test.ts`, "the deck write saves a selection naming an archived project, and the file holds it"
- 100.5 ms, times [107.5, 157.2, 100.8, 100.5, 147.0], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 400 for a malformed subtask body"
- 98.8 ms, times [155.5, 139.5, 105.4, 98.8, 177.7], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 400 for a malformed host body"
- 98.3 ms, times [100.9, 141.4, 107.8, 98.3, 162.1], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 200 for a good linkedin-post body"
- 97.3 ms, times [97.7, 145.5, 102.6, 97.3, 154.1], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 404 for an entry, a collection and a host the hub does not hold"
- 96.5 ms, times [103.9, 147.0, 108.8, 96.5, 158.5], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes carries a refusal back for a status outside the career vocabulary"
- 95.9 ms, times [99.1, 132.5, 95.9, 97.8, 186.4], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 400 for a malformed subtask-add body"
- 95.7 ms, times [99.3, 130.8, 100.3, 95.7, 159.7], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 400 for a malformed new-entry body"
- 95.7 ms, times [101.2, 129.5, 113.1, 95.7, 154.6], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 400 for a malformed linkedin-idea body"
- 95.7 ms, times [110.3, 144.3, 103.6, 95.7, 213.1], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 404 for a subtask on a project the hub does not hold"
- 93.9 ms, times [95.1, 169.3, 96.5, 93.9, 208.7], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 400 for a malformed new-idea body"
- 93.5 ms, times [95.5, 125.8, 113.0, 93.5, 168.0], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 400 for a malformed reorder body"
- 93.2 ms, times [97.7, 126.4, 110.4, 93.2, 229.2], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 400 for a malformed delete-entry body"
- 92.9 ms, times [101.3, 147.8, 114.9, 92.9, 198.1], `tests/routes/edit/write.test.ts`, "the kinds the write endpoint takes answers 400 for a malformed lead-add body"
- 90.3 ms, times [115.8, 132.2, 98.7, 90.3, 124.7], `tests/routes/edit/write.test.ts`, "the deck write refuses a deck file whose map the line edit cannot keep, and writes nothing"
- 89.8 ms, times [115.4, 121.8, 96.8, 89.8, 123.2], `tests/routes/edit/write.test.ts`, "the deck write refuses a deck file that is not there, and says which refusal it was"
- 202.6 ms, times [202.6, 228.2, 208.2, 234.2, 238.7], `tests/routes/files/file-undo.test.ts`, "taking a trash back refuses the undo of a delete whose copy was pruned, and writes nothing"
- 177.2 ms, times [280.7, 277.4, 194.9, 237.7, 177.2], `tests/routes/files/file-undo.test.ts`, "what an operation records appends one files record for a create, with the path stamped after"
- 162.8 ms, times [213.1, 225.0, 182.5, 164.0, 162.8], `tests/routes/files/file-undo.test.ts`, "what an operation records keeps the content of a trashed file of 1 KB, and none of a folder or a file over 5 MB"
- 144.5 ms, times [182.5, 185.7, 205.7, 181.9, 144.5], `tests/routes/files/file-undo.test.ts`, "taking a trash back brings a folder back empty"
- 142.8 ms, times [235.7, 186.5, 177.8, 186.0, 142.8], `tests/routes/files/file-undo.test.ts`, "taking a trash back writes a 1 KB file back with its text"
- 142.3 ms, times [196.4, 228.1, 149.6, 235.3, 142.3], `tests/routes/files/file-undo.test.ts`, "taking a create back moves the file to the Trash while it is unchanged, and records the reverse"
- 140.2 ms, times [178.2, 196.2, 148.2, 165.4, 140.2], `tests/routes/files/file-undo.test.ts`, "what an operation records records the items a list did before the one it stopped at"
- 136.9 ms, times [307.2, 211.2, 165.7, 252.3, 136.9], `tests/routes/files/file-undo.test.ts`, "what an operation records records a rename with both paths, and a paste move and a paste copy by their mode"
- 131.0 ms, times [169.3, 131.0, 150.3, 160.3, 151.0], `tests/routes/files/file-undo.test.ts`, "taking a trash back says it cannot for a file over 5 MB"
- 127.6 ms, times [208.4, 175.2, 201.1, 192.2, 127.6], `tests/routes/files/file-undo.test.ts`, "taking a trash back refuses while the name is taken"
- 126.0 ms, times [170.3, 127.4, 143.3, 142.1, 126.0], `tests/routes/files/file-undo.test.ts`, "what an undo is held to answers unwritable for a target built without file roots"
- 118.1 ms, times [151.9, 154.6, 143.1, 298.7, 118.1], `tests/routes/files/file-undo.test.ts`, "taking a create back says gone once the file is not there"
- 117.5 ms, times [170.5, 167.8, 149.8, 238.6, 117.5], `tests/routes/files/file-undo.test.ts`, "taking a rename back moves the file back to its old name"
- 113.1 ms, times [156.9, 162.1, 130.5, 162.8, 113.1], `tests/routes/files/file-undo.test.ts`, "taking a rename back refuses while the old name is taken"
- 112.8 ms, times [181.5, 176.0, 151.2, 184.0, 112.8], `tests/routes/files/file-undo.test.ts`, "what an operation records records an upload"
- 110.8 ms, times [266.9, 169.1, 110.8, 157.3, 126.9], `tests/routes/files/file-undo.test.ts`, "what an undo is held to never trashes the machine own config/local.yml, even when a record names it"
- 108.4 ms, times [163.4, 165.9, 149.2, 205.5, 108.4], `tests/routes/files/file-undo.test.ts`, "taking a rename back takes a move back to the folder it came from"
- 106.5 ms, times [181.6, 146.2, 195.7, 389.4, 106.5], `tests/routes/files/file-undo.test.ts`, "what an undo is held to touches nothing outside the served roots, whatever a record in the log names"
- 106.0 ms, times [152.0, 153.5, 131.6, 161.5, 106.0], `tests/routes/files/file-undo.test.ts`, "taking a create back refuses once the file was written to, and moves nothing"
- 98.9 ms, times [136.6, 225.6, 159.0, 152.8, 98.9], `tests/routes/files/file-undo.test.ts`, "what an operation records records nothing for an operation that was refused or changed nothing"
- 126.4 ms, times [194.1, 151.1, 216.1, 184.5, 126.4], `tests/routes/files/fs.test.ts`, "the fs route, the reader's own bookmarks and notes answers the bookmarks a write left in the file, with their schema"
- 27.3 ms, times [31.4, 30.6, 33.9, 37.8, 27.3], `tests/routes/files/fs.test.ts`, "the fs route, reading answers the entries of the folder a root and a path name"
- 23.9 ms, times [25.2, 23.9, 34.7, 32.0, 26.0], `tests/routes/files/fs.test.ts`, "the fs route, reading answers the config folder of the engine under the engine root, and nothing above it"
- 20.6 ms, times [91.8, 25.5, 61.4, 64.0, 20.6], `tests/routes/files/fs.test.ts`, "the fs route, reading names a saved root the configuration reserves, and does not serve it"
- 639.9 ms, times [837.7, 1035.7, 919.2, 1455.9, 639.9], `tests/routes/files/history.test.ts`, "the copy a save keeps keeps the newest 50 copies of kind save and removes the older ones"
- 627.9 ms, times [830.8, 952.3, 915.2, 1203.4, 627.9], `tests/routes/files/history.test.ts`, "the copy a save keeps does not count a copy of kind delete among the 50"
- 130.6 ms, times [322.0, 130.6, 445.3, 437.6, 289.1], `tests/routes/files/history.test.ts`, "the copy a save keeps builds the index of delete copies again from the folders when it is gone"
- 91.4 ms, times [168.2, 128.0, 123.5, 1227.7, 91.4], `tests/routes/files/open-program.test.ts`, "a file handed to the application its extension names opens a file of every extension the checked-in map names, with that application"
- 20.9 ms, times [32.1, 34.0, 257.2, 31.1, 20.9], `tests/routes/files/open-program.test.ts`, "a file handed to the application its extension names refuses a file whose FinderInfo carries the alias flag, and opens one whose flags do not"
- 12.2 ms, times [17.3, 19.9, 28.8, 21.0, 12.2], `tests/routes/files/open-program.test.ts`, "what macOS open is run with and the floor under it refuses a file with an execute bit, a bookmark head, an alias flag or no bundle id"
- 10.7 ms, times [24.3, 22.1, 20.1, 14.0, 10.7], `tests/routes/files/open-program.test.ts`, "a path that is neither a regular file nor a folder refuses a FIFO inside the root in either form without calling the opener"
- 10.3 ms, times [31.1, 22.7, 43.3, 12.0, 10.3], `tests/routes/files/open-program.test.ts`, "a file handed to the application its extension names reads the map it is handed at the request: one naming .txt opens a .txt the checked-in map refuses"
- 9.8 ms, times [17.9, 14.9, 21.4, 16.4, 9.8], `tests/routes/files/open-program.test.ts`, "a file handed to the application its extension names opens a file that starts with book but has no mark after it"
- 9.3 ms, times [18.3, 16.9, 21.5, 13.7, 9.3], `tests/routes/files/open-program.test.ts`, "a file handed to the application its extension names reads a file with no FinderInfo as carrying none, and one with the flag as flagged"
- 8.3 ms, times [234.3, 14.8, 20.5, 22.2, 8.3], `tests/routes/files/open-program.test.ts`, "a file handed to the application its extension names opens a listed extension written in mixed case"
- 5.6 ms, times [14.1, 10.8, 16.7, 6.9, 5.6], `tests/routes/files/open-program.test.ts`, "a file handed to the application its extension names opens a file under a root when an earlier root in the list is gone"
- 5.0 ms, times [10.5, 20.3, 16.6, 9.0, 5.0], `tests/routes/files/open-program.test.ts`, "what macOS open is run with and the floor under it takes a real folder and a real listed file with a bundle id"
- 23.1 ms, times [27.5, 24.8, 23.1, 28.4, 24.2], `tests/routes/files/open.test.ts`, "the open endpoint over a file opens a file by its root and its path under that root, once, at its real path"
- 22.7 ms, times [35.6, 48.9, 22.7, 46.2, 27.2], `tests/routes/files/open.test.ts`, "the open endpoint over a file reads open.program_ext from the configuration on disk at every request"
- 12.8 ms, times [130.1, 20.5, 12.8, 23.6, 13.7], `tests/routes/files/open.test.ts`, "the open endpoint over a file opens a file under a root the saved workspace adds, through the roots the file browser serves"
- 9.3 ms, times [253.9, 148.0, 9.3, 13.3, 12.5], `tests/routes/files/open.test.ts`, "the open endpoint over a file opens a file by a hub-relative path and by an absolute one in the form without a root"
- 6.5 ms, times [7.5, 7.1, 6.5, 9.6, 9.2], `tests/routes/files/open.test.ts`, "the open client posts a file by its root and path to the open endpoint with the token"
- 6.2 ms, times [7.6, 8.8, 6.2, 9.0, 6.8], `tests/routes/files/open.test.ts`, "the open endpoint over a file opens a file of the engine root, a reserved key the file browser serves"
- 6.1 ms, times [8.7, 7.5, 6.1, 12.0, 8.2], `tests/routes/files/open.test.ts`, "the open endpoint over a file opens a file under a workspace root by that root's key"
- 5.6 ms, times [7.9, 23.1, 5.6, 8.5, 5.7], `tests/routes/files/open.test.ts`, "the open endpoint over a file says a path could not be opened when the opener fails"
- 99.2 ms, times [139.1, 137.5, 138.9, 133.0, 99.2], `tests/routes/files/project-files.test.ts`, "the project-files route answers 400 when the request names no project"
- 64.5 ms, times [119.1, 86.1, 84.2, 83.5, 64.5], `tests/routes/files/project-files.test.ts`, "the project-files route answers 404 for the slug of a side project and still answers for a research project"
- 55.3 ms, times [99.3, 98.3, 96.4, 86.8, 55.3], `tests/routes/files/project-files.test.ts`, "the project-files route answers 404 for an id the hub does not hold"
- 52.1 ms, times [112.6, 85.4, 81.9, 88.7, 52.1], `tests/routes/files/project-files.test.ts`, "the project-files route answers the rows of the project it names"
- 144.5 ms, times [390.8, 144.5, 155.9, 374.6, 224.8], `tests/routes/git/changes.test.ts`, "the change log endpoint answers the page before the moment `before` names"
- 847.2 ms, times [1302.7, 847.2, 982.2, 1288.3, 1214.4], `tests/routes/git/git.test.ts`, "the Source Control actions refuses each asking action unconfirmed, and takes it confirmed with its fields"
- 472.1 ms, times [684.1, 472.1, 502.0, 765.2, 688.2], `tests/routes/git/git.test.ts`, "the Source Control actions takes each plain action with no confirm"
- 338.6 ms, times [478.9, 338.6, 354.4, 507.4, 379.0], `tests/routes/git/git.test.ts`, "a body of the wrong shape refuses a body with no action, an action it does not know and every body that is no map"
- 65.8 ms, times [105.8, 74.4, 66.9, 83.8, 65.8], `tests/routes/git/git.test.ts`, "the reads on demand answers a refused read with its reason, and reads a page from 0 when skip is not a number"
- 460.0 ms, times [747.7, 460.0, 618.3, 741.8, 593.5], `tests/routes/git/refs.test.ts`, "the reads head=, compare=, refs= and workspace= answers the text HEAD holds, missing and binary"
- 389.7 ms, times [811.7, 399.9, 389.7, 683.9, 461.1], `tests/routes/git/refs.test.ts`, "the actions on commits and branches answers a branch git calls unmerged with the code not-merged, and deletes it on Delete Anyway"
- 344.4 ms, times [526.6, 380.1, 344.4, 560.9, 375.8], `tests/routes/git/refs.test.ts`, "the reads head=, compare=, refs= and workspace= refuses a root no workspace names for each of the three reads"
- 340.9 ms, times [760.6, 368.2, 340.9, 425.9, 539.1], `tests/routes/git/refs.test.ts`, "the actions on commits and branches makes a branch and a tag at the start point the body names"
- 326.1 ms, times [513.0, 326.1, 474.9, 554.1, 414.2], `tests/routes/git/refs.test.ts`, "the reads head=, compare=, refs= and workspace= adds the base of the checked-out branch to the first page of the graph"
- 323.4 ms, times [612.0, 323.4, 330.9, 565.2, 896.4], `tests/routes/git/refs.test.ts`, "the actions on commits and branches cherry-picks a confirmed commit and deletes a confirmed merged branch"
- 316.9 ms, times [552.9, 316.9, 361.8, 360.5, 392.8], `tests/routes/git/refs.test.ts`, "the actions on commits and branches detaches HEAD at a confirmed hash"
- 287.0 ms, times [462.8, 287.0, 288.5, 471.3, 360.3], `tests/routes/git/refs.test.ts`, "the reads head=, compare=, refs= and workspace= answers the files of a compare and one file two sides"
- 267.7 ms, times [455.4, 267.7, 291.7, 452.2, 431.7], `tests/routes/git/refs.test.ts`, "the reads head=, compare=, refs= and workspace= answers the main worktree file against this worktree file for workspace="
- 173.0 ms, times [262.5, 173.0, 186.8, 246.0, 194.2], `tests/routes/git/refs.test.ts`, "the reads head=, compare=, refs= and workspace= lists the refs a picker offers"
- 149.1 ms, times [320.5, 158.1, 149.1, 256.1, 178.9], `tests/routes/git/refs.test.ts`, "the actions on commits and branches answers the checked-out branch with no code"
- 256.7 ms, times [373.3, 325.7, 371.6, 281.1, 256.7], `tests/routes/git/untracked.test.ts`, "trashUntracked moves a confirmed untracked file to the Trash"
- 202.5 ms, times [400.2, 432.1, 202.5, 301.3, 629.4], `tests/routes/git/untracked.test.ts`, "trashUntracked refuses a request the page did not confirm"
- 180.7 ms, times [470.7, 181.4, 180.7, 263.7, 212.0], `tests/routes/git/untracked.test.ts`, "trashUntracked refuses a tracked path and a guarded file through the route"
- 140.0 ms, times [219.3, 160.9, 140.0, 164.4, 159.7], `tests/routes/git/untracked.test.ts`, "ignore appends the path without a confirm and answers the file it wrote"
- 130.9 ms, times [288.3, 158.6, 130.9, 143.2, 224.4], `tests/routes/git/untracked.test.ts`, "trashUntracked waits behind the write chain it is given"
- 125.7 ms, times [275.9, 134.9, 125.7, 188.0, 157.5], `tests/routes/git/untracked.test.ts`, "trashUntracked refuses to run without a guard over the machine files"
- 229.2 ms, times [337.3, 254.1, 338.0, 269.4, 229.2], `tests/routes/machine/commands.test.ts`, "POST /api/commands keeps every save of requests in flight together, in the order they came"
- 225.6 ms, times [350.0, 225.6, 253.9, 278.7, 237.3], `tests/routes/machine/commands.test.ts`, "POST /api/commands saves a line that writes a placeholder inside quotes, after a backslash or in a comment"
- 184.6 ms, times [270.8, 186.9, 184.6, 212.0, 187.3], `tests/routes/machine/commands.test.ts`, "POST /api/commands replaces a saved command of the same name and removes one"
- 373.6 ms, times [616.5, 405.1, 412.9, 505.5, 373.6], `tests/routes/replace/ops-replace.test.ts`, "a request that is no replace refuses empty items, empty hits, a file named twice and a hit named twice as not-an-action"
- 214.2 ms, times [409.1, 228.9, 214.2, 304.2, 246.7], `tests/routes/replace/ops-replace.test.ts`, "what a replace records records the files done before a refusal, and records nothing when the first is refused"
- 200.7 ms, times [314.7, 325.6, 300.2, 328.6, 200.7], `tests/routes/replace/ops-replace.test.ts`, "what a replace writes replaces the second of two matches on one line and leaves the first"
- 146.2 ms, times [249.6, 182.0, 146.2, 246.1, 162.7], `tests/routes/replace/ops-replace.test.ts`, "what a replace writes reads $1 and \U of a regular expression from the groups ripgrep reports"
- 144.0 ms, times [232.2, 179.7, 144.0, 231.5, 161.0], `tests/routes/replace/ops-replace.test.ts`, "what a replace writes counts the place of a match in UTF-16 units on a line with multibyte letters"
- 138.0 ms, times [223.9, 160.4, 146.8, 284.9, 138.0], `tests/routes/replace/ops-replace.test.ts`, "what a replace writes replaces every match a request names, in several files"
- 132.2 ms, times [216.3, 192.9, 135.5, 175.1, 132.2], `tests/routes/replace/ops-replace.test.ts`, "what a replace records appends one files record naming each file, its kept copy and the file as it is"
- 130.2 ms, times [177.1, 136.1, 130.4, 437.3, 130.2], `tests/routes/replace/ops-replace.test.ts`, "what a replace writes replaces a match longer than a hit row is wide, from the whole text the page keeps"
- 121.5 ms, times [176.2, 334.6, 123.4, 137.8, 121.5], `tests/routes/replace/ops-replace.test.ts`, "what stops a replace refuses `changed` when the line changed since the run, keeps the files before it and writes none after"
- 107.9 ms, times [179.5, 169.6, 110.3, 125.0, 107.9], `tests/routes/replace/ops-replace.test.ts`, "what stops a replace refuses `too_large` for a file over what the history keeps, and for a result over it"
- 100.3 ms, times [159.1, 131.1, 100.3, 123.6, 104.5], `tests/routes/replace/ops-replace.test.ts`, "what stops a replace refuses `changed` when the text at the place is no longer the text that was found"
- 97.7 ms, times [150.2, 136.5, 97.7, 116.5, 104.1], `tests/routes/replace/ops-replace.test.ts`, "what stops a replace refuses a pattern ripgrep rejects as `search-failed`, and a target with no timeout the same"
- 94.4 ms, times [128.2, 106.0, 94.5, 112.2, 94.4], `tests/routes/replace/ops-replace.test.ts`, "what stops a replace refuses `marker` for a file holding a private-use marker, and for a replace text holding one"
- 93.2 ms, times [136.1, 123.2, 93.2, 111.8, 152.2], `tests/routes/replace/ops-replace.test.ts`, "what stops a replace refuses `binary`, `missing` and `outside` by file"
- 91.9 ms, times [140.9, 142.7, 91.9, 152.0, 98.0], `tests/routes/replace/ops-replace.test.ts`, "what stops a replace refuses `protected` for the machine's local file of the engine root, which it never opens"
- 91.3 ms, times [151.6, 104.8, 91.3, 114.1, 93.5], `tests/routes/replace/ops-replace.test.ts`, "what stops a replace refuses `denied` for a file its mode locks, and writes nothing"
- 90.8 ms, times [168.3, 99.5, 90.8, 129.2, 95.2], `tests/routes/replace/ops-replace.test.ts`, "a request that is no replace refuses an empty pattern as bad-query"
- 88.1 ms, times [132.0, 98.2, 88.1, 116.8, 94.7], `tests/routes/replace/ops-replace.test.ts`, "a request that is no replace refuses a body that is no operation at all as not-an-action"
- 161.0 ms, times [367.2, 168.2, 182.0, 242.2, 161.0], `tests/routes/replace/preview.test.ts`, "the preview of a replace in one file holds the file as it is on the left and the file with the named matches replaced on the right"
- 123.3 ms, times [140.4, 127.2, 143.4, 158.7, 123.3], `tests/routes/replace/preview.test.ts`, "the preview request previews 2000 hits in one file through the request the pane forms, which an address of the hits could not carry"
- 113.1 ms, times [286.1, 158.6, 113.1, 127.5, 113.9], `tests/routes/replace/preview.test.ts`, "the preview of a replace in one file leaves a named match that is no longer in the file unreplaced instead of refusing the preview"
- 110.8 ms, times [123.1, 122.3, 116.8, 131.2, 110.8], `tests/routes/replace/preview.test.ts`, "the preview of a replace in one file leaves a match it was not named for unreplaced, which is how a dismissed hit stays"
- 107.0 ms, times [114.5, 107.0, 118.2, 124.2, 108.3], `tests/routes/replace/preview.test.ts`, "the preview of a replace in one file applies the groups, the case and the line ends the write would"
- 102.9 ms, times [103.0, 103.8, 124.6, 144.9, 102.9], `tests/routes/replace/preview.test.ts`, "the preview request refuses a preview posted without the write token and reads nothing"
- 101.2 ms, times [124.5, 101.2, 108.5, 124.8, 117.6], `tests/routes/replace/preview.test.ts`, "the preview request refuses a preview whose hit is no line and place"
- 98.9 ms, times [102.8, 100.3, 98.9, 112.8, 100.6], `tests/routes/replace/preview.test.ts`, "the preview of a replace in one file refuses with the word of the check: binary, missing, outside, protected and bad-query"
- 278.7 ms, times [316.7, 286.5, 292.7, 346.2, 278.7], `tests/routes/replace/replace-undo.test.ts`, "taking a replace back writes each file back from its copy and records the undo as a replace that can be taken back"
- 271.6 ms, times [470.3, 308.1, 281.2, 316.9, 271.6], `tests/routes/replace/replace-undo.test.ts`, "taking a replace back says `gone` for a file that is no longer there and `copy-gone` for a copy the history lost"
- 218.0 ms, times [250.2, 372.1, 218.0, 262.3, 288.7], `tests/routes/replace/replace-undo.test.ts`, "taking a replace back writes the replaced text back when the undo is taken back"
- 132.6 ms, times [369.9, 145.3, 183.1, 189.1, 132.6], `tests/routes/replace/replace-undo.test.ts`, "taking a replace back refuses `moved` after a later edit of one file, and writes neither file"
- 130.9 ms, times [212.0, 143.5, 130.9, 164.1, 146.8], `tests/routes/replace/replace-undo.test.ts`, "taking a replace back lists the copy a replace kept under the kind `replace` in the file's history"
- 173.4 ms, times [316.0, 173.4, 247.5, 452.2, 286.7], `tests/routes/sessions/latex.test.ts`, "every main parameter is checked before a file is read or a program started refuses a name starting with a dash even when a main file has that name"
- 148.8 ms, times [148.8, 151.7, 152.8, 164.0, 157.3], `tests/routes/sessions/latex.test.ts`, "GET /api/latex word count answers the number the program printed, run in the folder with the words as arguments"
- 118.9 ms, times [122.8, 119.3, 130.3, 160.3, 118.9], `tests/routes/sessions/latex.test.ts`, "GET /api/latex word count does not read a digit in the main file name as the count"
- 113.0 ms, times [150.8, 113.0, 156.9, 127.1, 144.5], `tests/routes/sessions/latex.test.ts`, "POST /api/latex format runs badness with its arguments, the text on standard input"
- 111.5 ms, times [151.6, 111.5, 164.1, 117.1, 155.3], `tests/routes/sessions/latex.test.ts`, "POST /api/latex format runs latexindent with its arguments, the text on standard input"
- 110.8 ms, times [153.8, 110.8, 149.7, 147.8, 149.5], `tests/routes/sessions/latex.test.ts`, "POST /api/latex format runs tex-fmt with its arguments, the text on standard input"
- 109.7 ms, times [151.6, 109.7, 152.5, 114.5, 160.7], `tests/routes/sessions/latex.test.ts`, "GET /api/latex word count answers 502 count-failed when the program reports a failure between its marks"
- 109.6 ms, times [340.6, 109.6, 158.6, 118.5, 147.9], `tests/routes/sessions/latex.test.ts`, "POST /api/latex format runs the program its path key names instead of the one on PATH"
- 107.8 ms, times [159.0, 107.8, 153.5, 117.6, 151.6], `tests/routes/sessions/latex.test.ts`, "POST /api/latex format answers 502 format-failed when the program exits 1, its standard error never shown"
- 101.2 ms, times [102.0, 103.2, 102.5, 103.3, 101.2], `tests/routes/sessions/latex.test.ts`, "GET /api/latex word count answers 504 when the program runs past the time limit"
- 101.0 ms, times [103.3, 101.0, 102.0, 102.5, 103.1], `tests/routes/sessions/latex.test.ts`, "POST /api/latex format answers 504 past the time limit"
- 2.4 ms, times [2.7, 2.5, 2.5, 4.8, 2.4], `tests/routes/sessions/latex.test.ts`, "GET /api/latex word count answers 502 count-missing when the program is not found"
- 1.0 ms, times [2.2, 1.1, 2.7, 1.2, 1.0], `tests/routes/sessions/latex.test.ts`, "POST /api/latex format a chosen formatter that is not found refuses latexindent-missing when the chosen program is not found"
- 0.6 ms, times [2.4, 0.7, 3.0, 1.1, 0.6], `tests/routes/sessions/latex.test.ts`, "POST /api/latex format a chosen formatter that is not found refuses tex-fmt-missing when the chosen program is not found"
- 0.6 ms, times [1.9, 0.6, 3.1, 0.9, 0.7], `tests/routes/sessions/latex.test.ts`, "POST /api/latex format a chosen formatter that is not found refuses badness-missing when the chosen program is not found"
- 162.3 ms, times [184.3, 168.5, 169.6, 166.8, 162.3], `tests/routes/sessions/terminal-actions.test.ts`, "latexCommand quotes a main file name as one word, so a shell passes it to latexmk whole"
- 207.5 ms, times [447.2, 207.5, 255.4, 208.2, 219.5], `tests/routes/sessions/terminal-edit.test.ts`, "the restyle action refuses a colour outside the eight names, with no tmux command"

Load average (1 minute) at the start of each slow-tier run: 7.59 to 19.74; quick-tier runs: 4.92 to 15.74.
