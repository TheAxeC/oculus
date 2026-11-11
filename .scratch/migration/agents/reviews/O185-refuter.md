# Step O185 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O185, base 746518eba)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

**Summary:** check 4 of the brief is red when run as the brief words it. Spec finding 1 says this is a wrong premise in the brief, not a defect in the code. Every other check and every case reproduces. One row the report already names, `tests/routes/git/zenodo.test.ts:428`, is above the 300 ms bound alone. The orchestrator decides on that row (Spec finding 2).

Load: before every vitest or svelte-check run I ran `ps -Ao command | grep -E 'vitest|svelte-check' | grep -v grep`. It printed nothing each time, so no other suite was running. Load averages (from `uptime`):
- Check 4: 2.86 before, 5.44 after.
- The per-file runs: 5.39 to 5.80.
- Check 1: 6.44 before, 12.33 after.
- The case-run program: 8.88.

The rules file names no output filter, so the vitest lines below were cut to their summary and row lines with `grep -E`.

## Verification (rerun by the reviewer)

```
Check 1, from the worktree root, TMPDIR unset: env -u TMPDIR -u GIT_CEILING_DIRECTORIES sh -c 'npm run diagrams && npm run test:quick -- --base 746518eba'
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.2 s)
ok      eslint (2.3 s)
ok      svelte-check (9.5 s): 1794394633493 COMPLETED 592 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (134.6 s): Duration  120.95s (transform 69.47s, setup 0ms, import 150.55s, tests 235.71s, environment 5ms)
ok      vitest (151.3 s): Duration  139.04s (transform 69.23s, setup 0ms, import 210.22s, tests 319.80s, environment 5.46s)
ok      vitest slow (211.4 s): Duration  199.14s (transform 22.31s, setup 0ms, import 131.93s, tests 654.27s, environment 13ms)
test:quick: 213.8 s; every command passed
(git status --short afterwards: the same 12 lines as before; npm run diagrams changed nothing)

Check 2, TMPDIR=GIT_CEILING_DIRECTORIES=$PWD/.agents/scratch, after touch .agents/scratch/x:
npx vitest run tests/server/edit/config-key.test.ts tests/server/edit/config-value.test.ts tests/routes/edit/undo/hub-settings.test.ts tests/server/core/changes.test.ts
 Test Files  4 passed (4)
      Tests  81 passed (81)
   Duration  35.00s (transform 4.47s, setup 0ms, import 11.92s, tests 57.55s, environment 1ms)
-rw-r--r--@ 1 axelfaes  wheel  0 Nov 11 11:54 .agents/scratch/x

The 11 rows with no x (rm .agents/scratch/x first): npx vitest run tests/server/edit/config-key.test.ts -t 'a write that names a hub'
 Test Files  1 passed (1)
      Tests  13 passed | 23 skipped (36)

Check 3: npx vitest run tests/data/sources/config/layers/hub-vocab.test.ts tests/data/sources/config/layers/catalogs.test.ts tests/data/sources/config/layers/language.test.ts tests/checks/config/config-folder.test.ts tests/checks/config/config.test.ts tests/data/sources/config/workspace-layer.test.ts tests/server/root/process/config-cache.test.ts
 Test Files  7 passed (7)
      Tests  135 passed | 2 skipped (137)
   Duration  27.14s (transform 22.14s, setup 0ms, import 36.62s, tests 43.80s, environment 1ms)
G61's row alone (-t 'parses a config folder once' --reporter=verbose):
 <check mark> |unit| tests/server/root/process/config-cache.test.ts > the config cache of the server context > parses a config folder once for requests over it, and again once a file of it is written 23ms
      Tests  1 passed | 13 skipped (14)

Check 4, the brief's two-file command (after the change only):
npx vitest run tests/server/edit/app-store.test.ts tests/routes/git/zenodo.test.ts --reporter=verbose
 Test Files  2 passed (2)
      Tests  66 passed (66)
   Duration  19.97s (transform 4.97s, setup 0ms, import 10.17s, tests 24.78s, environment 0ms)
 the 5 rows: app-store 'a host update of undefined, ...' 542ms; app-store 'a host update over a store file that holds 5, ...' 319ms; zenodo 'is not sent by the Recover route when another hub of the workspace reads it from the row' 422ms; zenodo 'sends Publish with the creators of the team, ...' 121ms; zenodo 'refuses a DOI with no Zenodo status of a record with its own authors and restricted files, ...' 90ms
 other rows in the same run: app-store 132 to 643 ms; zenodo For review rows 185 to 1201 ms; 'keeps the shipped auth and time limit under a hub that lays only the address' 472ms

Check 4, each file alone (item 4's own wording, npx vitest run <file> --reporter=verbose):
app-store: 'a host update of undefined, ...' 55ms; '... holds 5, ...' 41ms
 Test Files  1 passed (1)
      Tests  15 passed (15)
   Duration  4.71s (transform 1.84s, setup 0ms, import 3.76s, tests 838ms, environment 0ms)
zenodo: Recover row 122ms; 'sends Publish ...' 98ms; '... own authors and restricted files ...' 74ms
 rows at 100 ms or more in this run: 'sends one anonymised zip, ...' 148ms; 'refuses a finding of the deposit scan, ...' 115ms; 'refuses a Latin-1 file ...' 138ms; 'refuses a Word file ...' 128ms; Recover row 122ms; 'keeps the shipped auth and time limit under a hub that lays only the address' 357ms; 'reaches the address of the project's own hub alone ...' 176ms; 'answers the token's readiness ...' 139ms; 'writes the DOI and deletes nothing when the publish answers 502 after Zenodo published' 122ms
 Test Files  1 passed (1)
      Tests  51 passed (51)
   Duration  7.98s (transform 1.45s, setup 0ms, import 2.77s, tests 5.07s, environment 0ms)

Check 5, the ASCII gate of the rules file, from the worktree root:
bfs: error: bin: No such file or directory.
ascii exit=0   (nothing printed on stdout)

Check 6: sh utils/unused-exports.sh > .agents/scratch/unused.txt; diff ../O185-base/unused-exports.txt .agents/scratch/unused.txt
exit=0
334 lines, 334 lines in the base's output
diff exit=0   (the step adds no line)

sh utils/folder-check.sh: folder exit=0; ls tests/fixtures | wc -l: 10; ls tests/fixtures/hubs | wc -l: 10

The case-run program, rebuilt byte for byte from the report's quoted source (the helper yaml-count.mjs compared with diff: same), run as the report says: TMPDIR=GIT_CEILING_DIRECTORIES=$PWD/.agents/scratch node .agents/scratch/cases.mjs
1 unchanged: {"parsesReturned":true,"keptEntries":98,"firstParsed":98,"secondParsed":0,"secondEqualsFirst":true,"secondEqualsPlain":true}
2 changed text: {"parsed":1,"value":2,"equalsPlain":true}
3 broken then fixed: {"key":"read_limits","brokenDropped":true,"fixedHasKey":true,"fixedFileFindings":0,"fixedEqualsPlain":true}
3 fixed then broken: {"againDropped":true,"againHasKey":false,"againFileFindings":1,"againEqualsPlain":true}
4 empty files: {"firstDefaults":[],"secondDefaults":[],"firstOptions":["is not a map of keys"],"secondOptions":["is not a map of keys"],"secondEqualsPlain":true}
5 two engines: {"findings":35,"secondParsed":0,"namesFirst":false,"findingsNameSecond":true,"equalsPlain":true}
6 instead: {"candidateSeen":1,"plainAfter":null,"equalsPlain":true}
7 mutated result: {"feedRegistries":[],"refresh":"(r)","equalsPlain":true}
7 workspace then none: {"workspaceRefresh":"W","workspaceClaude":"W","afterRefresh":"(r)","afterClaude":"Claude","equalsPlain":true}
8 frozen: {"threw":null,"equalsPlain":true}
9 alias: {"threw":null,"value":{"k":1},"equalsFirst":true,"equalsPlain":true}
10 two hubs: {"parsed":[0,0],"values":["one","two"],"from":[".oculus/config.yml",".oculus/config.yml"],"equalsPlain":[true,true]}
11 timing: {"noParses":"218 to 284 ms, median 256","withParses":"33 to 93 ms, median 34"}

The history-word grep over the added lines and the new file: two hits, the same as the report's ("asserted to be inside it before it is made", "that load made before its first case"). Neither is about history.
```

Removed before this report:
- `.agents/scratch`, with `rm -rf .agents/scratch`. `ls -a .agents` then printed `.`, `..`, `plan.yaml`.
- No vitest or svelte-check process was left running (count 0).

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds.
  - `labTarget` (`tests/routes/edit/write-fixture.ts:585-601`) makes `scratchDir('oculus-lab-')` and puts the primary hub at `<pair>/hub` (through `configTarget(scratchEngine(), '', pair)` and `target(parent)`) and the lab hub at `<pair>/lab` (`folderIn`).
  - `target()` and `configTarget()` keep their defaults.
  - Line 458 is unchanged.
  - Check 2 passes with `x` present: 81 of 81.
- 2: holds.
  - `configSource` (`merge.ts:117-139`) reads every file on every call. It reuses a kept parse only when the text is equal, and hands the merge a `structuredClone`.
  - A file that `instead` replaces keeps the entry that was handed in.
  - A parse that throws is not kept.
  - `?? empty` and the shape check run in `readConfigFile` on every call (`text.ts:71-93`).
  - `contextConfig` keeps `let parses` inside its own closure (`config-parse.ts:49-54`) and passes it on both `load` and `loadHub`. Nothing is kept at module level.
  - `ConfigParses` is not exported.
  - Cases 1 to 10 of the case-run program reproduce.
- 3: holds.
  - `grep -n 'loadConfig(' tests/routes/edit/write-fixture.ts` lists only `:517`, which is a load over another hub with `engineParses()`.
  - `deposit-world.ts` uses `engineConfigCopy`.
  - `zenodo-world.ts:43,122,154` use the engine copy and `engineParses()`.
  - `engine-load.ts` deep-freezes both loads and hands out clones.
  - The signature of `targetOver` and its `keep` argument are unchanged.
  - The module path differs from the brief. The folder check makes this necessary; see the Spec heading, where it is named and not raised as a finding.
- 4: holds on the item's own wording. Each of the 5 rows takes at most 300 ms with its file run alone: 55, 41, 122, 98 and 74 ms in my run.
  - The report gives every row's time before and after.
  - It marks the rows at 100 ms or more alone and gives their causes.
  - No timeout, tag or concurrency setting was added.
  - Check 4 as the brief words it (the two-file command) is red: Spec finding 1.
  - The rows still at 100 ms or more alone: Spec finding 2 and Proof finding 1.
- 5: holds.
  - The `config-cache.ts` head comment is rewritten and nothing else in that file changed.
  - Its "200 to 290 ms" matches my case-11 run with no `parses`: 218 to 284 ms.
  - The `merge.ts` and `text.ts` head comments and the docs of `loadConfig`, `readConfigFile` and `ConfigOptions` are rewritten.
  - The `HubSettings` doc (`src/lib/data/index.ts:611-616`) is still true by my reading.

Cases of the brief's "Cases":

- 11 rows of 'a write that names a hub' with `x` in the temporary folder: met.
  - After the change: 81 of 81 pass with `.agents/scratch/x` present.
  - Before the change: by reading the base, the base `labTarget` (`git show 746518eba:tests/routes/edit/write-fixture.ts`) takes `configTarget()`, which takes `target()`, which takes `scratchDir('oculus-route-')`. So `<hub>/..` is the temporary folder itself. The report quotes the failing run, 11 failed at `:458:55`.
- The same rows with no `x`: met. 13 passed, 23 skipped.
- `config-value.test.ts`, `undo/hub-settings.test.ts` and `changes.test.ts`: met after the change (check 2). For the unchanged tree I take the report's timeouts on its word; see "Declined to judge".
- Unchanged folder, second call with the first call's `parses`: met. Case 1: `secondParsed 0`, and the result is equal to both the first call and a plain call.
- A file whose text changed: met. Case 2 gives `parsed 1, value 2`, and G61's row passes in 23 ms.
- A file broken then fixed, and fixed then broken: met (case 3).
- Empty defaults and options files: met (case 4).
- The same text in two scratch engines: met (case 5).
- `instead`, then a plain call: met (case 6).
- A mutated result, and a workspace then none: met (case 7).
- A frozen `parses`: met (case 8).
- A YAML alias: met (case 9).
- Two hubs, each with the engine's `parses`: met (case 10).
- The 5 rows alone: met, at 55, 41, 122, 98 and 74 ms. Run beside each other they are not: Spec finding 1.
- The guarded tests of G126, G130, G13 and G61: met after the change (check 3). For the unchanged tree I take the report's `135 passed | 2 skipped` on its word.

## 1. Spec

**Finding 1: check 4 is red as the brief words it, because one of the brief's premises does not hold.**
- Place: the brief, "Verify before you report" check 4 and Decision 5; `tests/server/edit/app-store.test.ts:258-280`.
- Quoted: "`npx vitest run tests/server/edit/app-store.test.ts tests/routes/git/zenodo.test.ts --reporter=verbose`, before and after: ... the 5 rows at most 300 ms after", and "(at the 5 to 10 times slowdown measured under the whole suite, that stays under 5000 ms)".
- What is wrong:
  - In that command, with no other vitest running, three of the 5 rows took more than 300 ms: 542, 319 and 422 ms. The report's own last runs showed the same (442/360/430 and 827/484/875 ms).
  - Item 4's 300 ms bound rests on the 5 to 10 times slowdown measured before the step. That ratio does not carry over after the change. The two app-store rows take 55 and 41 ms alone but 542 and 319 ms beside one other test file, about ten times, with only one other worker.
  - Before the change the same two-file run gave about twice the alone time (report: 1294 against 622).
  - So what the app-store rows spend their time on is no longer the config load, and it scales with contention far more than the brief assumed.
  - The step does not show that these rows stay under 5000 ms under the whole suite. The report says this plainly and marks check 4 "NOT done in full".
  - This is a premise of the brief found wrong, not a defect in the code: the code meets item 4's own per-file wording.
- Decision resting on it: whether O185 ends the red whole suite that ruling "Open item 753" asked for and that ruling "Release v1.1.0 queue empty" waits on.
- Failure scenario: the release run of the whole suite puts the two app-store rows beside many workers. At the ratio seen here with one worker, 55 ms becomes 550 ms; with many, it may rise toward the 5000 ms limit. The suite can be red again, with the step booked as having ended it.
- Verdict: no item is violated. Check 4 of the verification list is red.

**Finding 2: the row at `tests/routes/git/zenodo.test.ts:428` is above the 300 ms bound alone, and its fix is one line outside the write list.**
- Place: `tests/routes/git/zenodo.test.ts:428`.
- Quoted: `const shipped = loadConfig(engineDir()).config.deposit as { zenodo: object };`
- What is wrong:
  - The row 'keeps the shipped auth and time limit under a hub that lays only the address' takes 357 ms alone in my run (320 ms in the report) and 472 ms in the two-file run. That is the slowest zenodo row alone, and above the 300 ms bound the brief sets for the five.
  - The report's cause is right by reading: line 428 makes a full load with no `parses`, 218 to 284 ms by case 11.
  - The fix is `engineConfigCopy()` from `tests/fixtures/hubs/engine-load.ts`, one line in a file outside the write list. The builder named it and left it unchanged.
  - Decision 5 hands such a row to the orchestrator. The rules' lazy-option clause treats the path list as a choice to widen rather than book.
- Failure scenario: under the whole suite's load this row is the zenodo row nearest the 5000 ms limit, and it is the one row whose excess comes from the very cause this step ends.
- Verdict: no item is violated. The orchestrator raises the row under Decision 5.

**Paths outside the write list (no finding).** The report names all three, and each is sound:
- `tests/fixtures/hubs/engine-load.ts` in place of `tests/fixtures/engine-load.ts`. `tests/fixtures` holds 10 items, and `utils/folder-check.sh` exits 0 with the file in `hubs/`, which now also holds 10.
- `src/lib/server/root/watch/portfolio/portfolio.ts:642-664`. It passes the whole `loaded` result to `configPayload`, whose `read: LoadedConfig` now needs `parses`.
  - The call to `loadConfig` itself is unchanged.
  - The file stays at 879 lines.
  - `configPayload` (`payload.ts:76`) destructures only `config`, `findings` and `from`, so no `parses` reaches the wire.
  - `configSeed` (`config-seed.ts:63`) also builds its payload from `config` and `findings` only.
- `tests/server/root/process/config-cache.test.ts:269-270,299-300`: `parses: {}` added to four fake loaders. No assertion changed.

## 2. Proof

**Finding 1: the set of rows at 100 ms or more alone does not reproduce from run to run.**
- Place: the report, "Item 4: the row times", the "Alone" column.
- Quoted: "zenodo: For review > refuses a finding of the deposit scan, naming the file, before any request | 1015 | 847 | 68", and "zenodo: Publish: makes a new version of a review copy whose DOI has zenodo_status empty | 862 | 98 | 127 (100+)".
- What is wrong:
  - My run of zenodo alone put three For review rows at or above 100 ms that the report lists at 68 to 74 ms: 'refuses a finding of the deposit scan' 115 ms, 'Latin-1' 138 ms and 'Word' 128 ms.
  - Four rows the report marks 100+ (zenodo_status empty, 'no answer after Zenodo published', 'share link answers 502', 'no answer ... draft is not published') printed under 100 ms in mine.
  - All of them sit on the same floor: one `loadConfig` with `parses` per row, 33 to 93 ms by my case 11, plus the row's own work. So which rows cross 100 ms depends on the load at the time.
  - The rows over 100 ms in both runs: the first row ('sends one anonymised zip'), the Recover row, 'reaches the address ...', 'answers the token's readiness ...', 'writes the DOI and deletes nothing when the publish answers 502 after Zenodo published', and the row of Spec finding 2.
- Decision resting on it: which rows the orchestrator raises under Decision 5.
- Failure scenario: the orchestrator raises a list of rows that the next run does not reproduce, and misses rows of the same cause.
- Verdict: no item is violated. Item 4's marking holds for the report's own run.

## 3. Standards

none

## 4. Behaviour

none. The one host-visible change the report states, with its before and after: the server's parse again after a write, and for each other hub, costs 42 to 85 ms against 204 to 288 ms. My case 11 gives 33 to 93 ms against 218 to 284 ms. Nothing changes on the wire or in a view: `configPayload` and `configSeed` do not carry `parses`, and `+page.server.ts:66-90` uses only `read.config` and `read.from`.

## Declined to judge

- The first runs on the unchanged tree. These are:
  - the case-run program;
  - the 11 rows with `x`;
  - the "before" column of check 4;
  - the timeouts of `config-value.test.ts` and `undo/hub-settings.test.ts`;
  - check 3 before the change.

  Rerunning them needs a vitest run in the orchestrator's base copy, which would write vitest caches into it, and this review changes nothing. The 11-row failure was checked by reading the base `labTarget` instead.
- Why the app-store rows run about ten times slower beside zenodo than alone. Reading `world()` and `updateHostStore`, the time goes to fsynced atomic writes and a change-log record, but a read does not settle it. Settling it takes a run of app-store alone beside a CPU-only load, and another beside a write-heavy load.
- Whether the whole suite now runs green. The whole-suite commands are banned for a reviewer, and this settles at the release run.
- The server memory the kept parses take in `contextConfig`'s closure. Not measured; the report says so.
- `warmConfig` (`write-fixture.ts:133-135`) now only makes a copy and throws it away, in the `beforeAll` of 17 test files. The brief kept it and its callers unchanged, so whether to remove it is the orchestrator's call.

Reviewer usage: a16114f25d691c13c, claude-opus-5-5, 223948 tokens, 64 tool uses, 954 s.

## Closed

- Spec 1 (check 4 red as the brief words it): closed, not reproduced. The orchestrator ran the brief's two-file command three times with no other vitest or svelte-check running (`ps -Ao command | grep -E 'vitest|svelte-check'` printed nothing; load averages 5.02 to 5.39): the 5 rows took 55, 65, 55 ms (app-store host update of undefined), 43, 45, 43 ms (holds 5), 138, 134, 122 ms (Recover), 93, 92, 103 ms (Publish) and 79, 73, 78 ms (restricted files), each under 300 ms. The app-store rows alone beside 4 `yes` processes took 79 and 56 ms, and beside a loop of 1 MB fsynced writes 58 and 42 ms, so neither CPU nor disk contention alone gives the tenfold times of the builder's and the reviewer's runs; those runs were made while the machine carried other work. The whole suite, run once at the release with nothing else running, is the check the ruling "Release v1.1.0 queue empty" names.
- Spec 2 (`tests/routes/git/zenodo.test.ts:428`, 297 to 357 ms alone): fixed at landing. The line takes the shipped `deposit` from `engineConfigCopy()` (`tests/fixtures/hubs/engine-load.ts`) in place of a full `loadConfig(engineDir())`, the same cause item 3 ends in the fixtures; the path list is widened to that file.
- Proof 1 (the rows at 100 ms or more alone vary from run to run): closed under Decision 5 by the orchestrator. Every zenodo row makes one load under its own hub's settings in `fixture()` (`zenodo-world.ts:122`), two for the `withLab` rows (`:154`); with the engine's `parses` that load costs 33 to 93 ms (case 11), the floor the brief sets, since item 2 keeps the read of each file and the shape check on every call. Which rows cross 100 ms on that floor depends on the machine's load; none is near the 5000 ms limit. No row is tagged and no limit changed.
- Declined to judge, `warmConfig`: kept with its callers, as the brief's item 3 says.
