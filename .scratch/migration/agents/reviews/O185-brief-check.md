# Brief check of O185 (`.scratch/migration/agents/briefs/O185.md`, oculus main at bf75b131c)

## Names

1. `labTarget`. `git grep -n '\blabTarget\b'` finds it outside the write list at `tests/server/edit/config-key.test.ts:47,337,443,462,463,478,663`, `tests/server/edit/config-value.test.ts:36,452,471,483` and `tests/routes/edit/undo/hub-settings.test.ts:6,21,40`. Item 1 keeps the `LabTarget` shape, so none of these hits becomes false. The comments at `hub-settings.test.ts:6` and `config-key.test.ts:337` stay true. Only `config-key.test.ts:458` steps out of a hub with `'..'` (`git grep -n "'\.\.'" -- tests`). `grep -n 'dirname(\|tmpdir()\|basename('` over the three files finds nothing, so no caller depends on the hub's parent.
2. `targetOver`. Besides `write-fixture.ts:112,129`, `tests/server/core/changes.test.ts:31,88` imports it and calls `targetOver(dir, { overrides, bookmarks, changes }, keep)`. That file is outside the write list. Item 3 changes `targetOver`'s body, so this caller needs the signature and the `keep` argument kept. The brief does not name it. The `targetOver` at `tests/server/accounts/connect/git/routes.test.ts:74` is a separate local function and is not affected.
3. `configTarget`. It has callers in 10 test files outside the write list: `tests/routes/edit/apps/app-setting.test.ts:31,51`, `audit-mute.test.ts:6,18,24`, `routes/edit/config-key.test.ts:5,26,110-233`, `routes/edit/config-value.test.ts:5,20,41`, `rail.test.ts:7,25,39`, `undo/config-save.test.ts:7,24,89-246`, `undo/user-key.test.ts:7,20,34`, `routes/hubs/settings-secrets.test.ts:8,22,62-114` and `tests/state/workbench/options-pages.test.ts:43,74`. If item 1 is built inside `labTarget`, they are unaffected. If it is built by changing `target()` or `configTarget()`, they all go through it. Their comments ("fixture's hub (write-fixture.ts `configTarget`)") stay true either way.
4. `target`. 38 test files import `write-fixture.ts` (`git grep -ln write-fixture -- tests | wc -l`). Item 1 cannot put `target()`'s hub inside a private parent without either a new parameter on `target()` (its hub is fixed at `scratchDir('oculus-route-')`, `write-fixture.ts:75`) or `labTarget` building the hub itself through `targetOver`. The brief does not say which. The parameter would have to be optional so the 38 importers stay unchanged.
5. `warmConfig`. `grep -rn warmConfig tests` finds 17 calling test files: `deck-acts`, `deck-globs`, `app-store`, `clone-after`, `write`, `roots`, `hub-settings`, `deck-slides`, `folder-undo`, `user-key`, `app-gate`, `undo`, `hub-deck-writes`, `hub-routing`, `hub-undo`, `hub-writes`, `file-undo`, `project-files` and `ops-replace`, each with a `beforeAll`/`test.beforeAll(warmConfig)`. The brief's line 56 puts them in the write list only conditionally. The change does not make `warmConfig` a no-op (see The question 7), so these callers should stay.
6. `readConfigFile`. Its only callers are `merge.ts:177` and `options-folder.ts:119`, both in the write list. It also appears in the generated `docs/diagrams/writes.dot:839,1622` and `docs/diagrams/writes.svg:3390,5376`. `npm run diagrams` runs before every `test:quick` (`agents/spec.md:26`), so any change to the imports between the merge files (a new export used across files, a new file under `merge/`) rewrites those two diagram files. They are not in "Paths this step writes" (brief lines 51-57).
7. `loadConfig`, product callers. These are `src/desktop/windows/start-colours.ts:55,104`, `src/lib/server/edit/writes/config/config-place.ts:93` (`loadLayers`, which passes `instead` for every config write) and `:362`, `src/lib/server/machine/pty/channel.ts:255`, `src/lib/server/root/process/context/config-parse.ts:45,52` (the server's config cache, injected as `ContextDependencies['loadConfig']`, `dependencies.ts:66,107`), `src/lib/server/root/process/words.ts:18`, `src/lib/server/root/watch/portfolio/portfolio.ts:642` (every rebuild after a watcher event calls it directly, not through the cache) and `vite.config.ts:480`. None of them depends on the parse being redone, as long as item 2 gives each call fresh objects. The merge layers copy along a path when they write (`tree.ts:22-31` `setAt` spreads each map on the way; `workspace-layer.ts:351`). In-place mutation of a kept parse can therefore only come from callers, which item 2's "objects of its own" covers.
8. `loadConfig`, test callers. There are 325 calls in 179 test files (`git grep -n 'loadConfig(' -- tests | wc -l`). `tests/server/edit/config-value.test.ts:47-56` mocks `node:fs` and records every path `readFileSync` reads, so a case can say which files a refusal opened. Item 2 keeps the read on every call (brief decision 1), so that record is unchanged; keying the reuse by modification time would have broken it. No test mocks `yaml` (`git grep -n "vi.mock('yaml'"` finds nothing).
9. Comments that describe how config is read, outside the write list:
   - `src/lib/server/root/process/config-cache.ts:2-4` says "Reading and parsing every config file costs about 75 ms". A read-only node timing in the gate measured 222.6 to 376.8 ms, so the line is already wrong, and item 2 changes the cost again.
   - `config-cache.ts:9,22,38` say "parses again" and "a parse of the whole folder per hub". After item 2 only changed files are parsed.
   - `src/lib/data/index.ts:611-616` describes `HubSettings` as the parse the server keeps.

   Under `agents/spec.md:72` the builder must re-read these and list each as still true or rewritten. The brief does not name them, and `config-cache.ts` is not in the write list. Inside the write list, the head comments of `merge.ts:1-12` and `text.ts:1-8` and the doc comments of `loadConfig` (`merge.ts:124-146`) and `readConfigFile` (`text.ts:56-61`) describe a read and parse on every call.
10. Files under `merge/`, and the guarded entries the brief leaves out:
    - G130 (`guarded.md:204-206`) names `src/lib/data/sources/config/merge/text.ts` in its Code line. Its test is `tests/data/sources/config/layers/language.test.ts`, describe 'the display language'.
    - G13 (`guarded.md:255-257`) covers "the config readers under `src/lib/data/sources/config/`". Its tests include `tests/checks/config/config-folder.test.ts`, `tests/checks/config/config.test.ts` and `tests/data/sources/config/workspace-layer.test.ts`.
    - G61 (`guarded.md:273-275`) is the server's config cache. Its test `tests/server/root/process/config-cache.test.ts:115-129` writes `behavior.yml` from `one: 1` to `one: 2` and expects `{ one: 2 }` through the real `loadConfig`.

    The brief names only G126. `agents/spec.md:60` says "A step whose change touches an entry's code runs that entry's test", so G130 and G13 apply as well. G61's row is the existing test that case 5 asks the builder to look for.
11. `tests/fixtures/hubs/deposit-world.ts:69,75` (`depositTarget`) calls `loadConfig(engineDir())` on every zenodo row, through `zenodo-world.ts:122`, and on every row of `tests/server/git/deposit.test.ts:137` and `deposit-compare.test.ts:122`. This file is not in the write list. Item 3 does not reach it, and item 2 is the only part of the step that makes it cheaper.

## The step line

The O185 line is at `plan.md:1741`.

1. "the whole suite runs green" (the title). No item and no verify command checks this. A builder may not run the whole suite (`agents/spec.md:26`), and verify item 1 runs `npm run test:quick` alone. The only run that shows it is the release run under the ruling "Release v1.1.0 queue empty" (`plan.md:3740`). This part has no requirement in the brief.
2. "`config-key.test.ts`'s 11 rows ... assert that `<hub>/../x` does not exist while the primary hub of `labTarget` ... lies directly in the shared temp folder ... the hub is made inside a private parent folder of its own". This is item 1, with cases 1-3. Item 1 also moves the lab hub, which the line does not ask for and which does no harm.
3. "The rows of `app-store.test.ts` (2) and `zenodo.test.ts` (3) that time out at 5000 ms under `npm run test:landing` and pass alone". These are the premise at brief line 11 and the scope of item 4.
4. "have the cause of their time found by reading and ended". The cause is stated in brief lines 13-17, measured by a timing run and a CPU profile; it is ended by items 2 and 3. Nothing asks the builder to read for the cause, but the brief has already stated it, so nothing is missing.
5. "the limit unchanged". This is item 4 ("No timeout is raised, no row is tagged slow, and no `it.concurrent`, retry or sequence setting") and the Conventions line 86.
6. "Built by a builder agent (ruling Open item 753)". This is how the step is dispatched; it needs no item.

## Premises

Commands were run on main at bf75b131c unless the gate is named. The gate is at a5852eb8a and clean (`git status --short | wc -l` = 0).

1. Brief line 11, the whole-suite run ("test:landing: 834.5 s; failed: npm test, npm run test:slow"). I cannot rerun it (`npm run test:landing` is banned to me). `grep -rn 'test:landing: 834' .agents/ .scratch/migration/orchestrator-state.md` found no log of it. Not verified.
2. Brief line 11, "Run alone, those two files pass (66 rows)". This holds. In the gate, `env -u TMPDIR npx vitest run tests/server/edit/app-store.test.ts tests/routes/git/zenodo.test.ts --reporter=verbose` gave "Tests 66 passed (66)" and "Duration 38.44s".
3. Brief line 12, line numbers:
   - `config-key.test.ts:458` is the `existsSync(join(made.hub, '..', 'x'))` assertion. Holds.
   - `:374` is `root: '../x'`. Holds.
   - The describe is at `:441`, not 440. The brief's 440-459 starts on the closing `];` of `NAMED`. Minor.
   - `write-fixture.ts:566` `labTarget`, `:546` `configTarget`, `:74` `target`, `:75` `scratchDir('oculus-route-')`. Hold.
   - **Difference:** the lab hub's `scratchDir('oculus-lab-')` is at `write-fixture.ts:568`, not `:567` (`:567` is `const base = configTarget();`).
   - `scratch.ts:25-33` is `scratchDir` with `mkdtempSync(planned)`. Holds.
4. Brief line 12, "a stray `/tmp/x` exists". Holds: `ls -l /tmp/x` gives `-rw-r--r--@ 1 axelfaes wheel 12426 Nov 11 00:09 /tmp/x`.
5. Brief line 12, `grep -rln labTarget tests`. It lists `config-value.test.ts`, `config-key.test.ts`, `write-fixture.ts` and `undo/hub-settings.test.ts`, which matches the brief once the fixture itself is set aside. 11 rows is right (`awk 'NR>=341 && NR<=440' ... | grep -c '^        row:'` = 11).
6. **Brief line 11 leaves out a fact:** describe 'a write that names a hub' is tagged slow (`config-key.test.ts:441`, `{ tags: ['slow'] }`). It runs under `npm run test:slow` with `--testTimeout 20000` (`package.json:20`), not under `npm test`.
7. Brief line 13, the per-row times alone. Holds within run-to-run spread:

   | | Brief | My gate run |
   |---|---|---|
   | Range of every row | 0.48 to 1.38 s | 469 to 1216 ms |
   | 'a target that holds no apps' | 1375 ms | 1216 ms |
   | The five rows, in the brief's order | 622, 704, 1066, 560, 554 ms | 758, 641, 751, 528, 505 ms |

8. Brief line 14:
   - `write-fixture.ts:112` (`targetOver` call), `:135` and `:149` hold.
   - **Difference:** `app-store.test.ts:39` is `const data = ...`; `world()` calls `target()` at `app-store.test.ts:40`.
   - "the last row calls it twice" holds (`app-store.test.ts:295`, `writeAppStore(target(), world().app(...))`).
9. **Brief line 15 is incomplete.** `fixture()` at `zenodo-world.ts:109-141`, its load at `:121`, `withLab()` at `:147-156` and its load at `:153` all hold. But `fixture()` also calls `depositTarget` (`zenodo-world.ts:122`), which does a second full `loadConfig(engineDir())` per row (`tests/fixtures/hubs/deposit-world.ts:69`), and its `engineConfig` (`:75`) loads again when called. A `fixture()` row therefore does 2 loads and a `withLab()` row 3, not 1 and 2. `zenodo-world.ts:42` also loads once at import (`const TEXT = textCatalog(loadConfig(engineDir()).config)`), which with item 2 fills the kept parses before the first row.
10. Brief line 16, timing. A read-only `node --input-type=module -e` in the gate (it imports `loadConfig` and writes nothing) gave six calls of 376.8, 288.7, 264.9, 272.4, 254.1 and 222.6 ms, and a `structuredClone` of the result of 11.1 ms. This matches the brief's range.

    The split, over 3 rounds, by a second read-only node run that reads, parses and shape-checks each file the way `readConfigFile` does:

    | Part | ms |
    |---|---|
    | `readFileSync` | 26.7 to 38.1 |
    | `yaml` `parse` | 179.2 to 277.6 |
    | `readAs(keysShape)` | 0.5 to 0.7 |
    | `shapeIssues` | 9.7 to 11.6 |
    | `structuredClone` of all parses | 5.0 to 9.4 |

    This confirms that the YAML parse is most of the load.
11. **Brief line 16, file count differs.** `find config -name '*.yml' ! -name local.yml | wc -l` = 97 holds as a command. But `loadConfig` reads 98 files: the `! -name local.yml` test also drops `config/options/local.yml`, a tracked options file (`git ls-files config/options/local.yml`) that `readOptionsFolder` reads.
12. **Brief line 16, call lines differ.** `readConfigFile` is at `text.ts:62` (holds). It is called at `merge.ts:177` and `options-folder.ts:119`; `merge.ts:175-176` and `options-folder.ts:117-118` are the text closures.
13. **Brief line 17, range differs.** `loadConfig` spans `merge.ts:147-216`, not 147-212. `mergeHub` at `hub-layer.ts:572` holds.
14. Brief line 18, the quote of `agents/spec.md:60`, holds word for word. **But the tree defines slow more tightly:** `vite.config.ts:485-486` says "A test tagged slow starts a process, waits on a real timer, opens a socket or takes 100 ms or more in a run of its own". The 5 rows take 505 to 758 ms alone, so under the tree's own definition they do have a reason to be tagged, against "have no such reason to be".
15. Brief line 19, G126 at `guarded.md:192-194`, holds. **The brief leaves out** G130 (`guarded.md:205`, which names `merge/text.ts` itself), G13 (`guarded.md:256`, "the config readers under `src/lib/data/sources/config/`") and G61 (`guarded.md:274-275`). See Names 10.
16. Brief line 20, the ruling, holds: `plan.md:3738`, "Open item 753 (2026-11-11): (a) ... The lazy option was (b), `/tmp/x` removed by hand".
17. Brief line 5, "`ls docs/adr` fails", holds ("ls: docs/adr: No such file or directory", exit 1).
18. Brief line 26:
    - `grep -n 'loadConfig(' tests/routes/edit/write-fixture.ts` gives 121, 135, 148, 149, 317, 325, 326, 504 and 505. The brief's `:503-505` includes line 503, which holds only `ReturnType<typeof loadConfig>`. Minor.
    - "`grep -rn warmConfig tests` lists them" holds (Names 5).
19. Brief line 66, decision 2. `DEMO_HUB` is at `tests/fixtures/hubs/real-hub.ts:21` and `tests/fixtures/hubs/demo` exists. Holds. `git grep` finds no test that writes under `engineDir()/config`; `scratchEngine` copies it (`write-fixture.ts:525`).

## Cases and checks

1. Case 1 (brief line 31), verify items 2 and 4 (lines 93, 95), and line 38 all run vitest with `env -u TMPDIR`. `agents/spec.md:34` allows `TMPDIR` unset only for `npm run test:quick`. Every other program "runs with `TMPDIR` and `GIT_CEILING_DIRECTORIES` both set to" `.agents/scratch/`, and "nothing else you run writes there". The step needs `/tmp` to reproduce the `/tmp/x` rows, but `agents/spec.md:3` says "Nothing in a brief overrides anything here". The brief does not raise this as an exception, so it is a clash the orchestrator must rule on. Verify item 3 (line 94) sets neither variable.
2. Case 4 and line 45 allow a timing or a count of parses "with a scratch file under `.agents/scratch/`". Line 61 says "No script is written for this step ... Any other script needs the user's approval ... This brief's mention of a script is no approval". The two contradict each other. `agents/spec.md:66` allows a case-run program, with its source and output quoted, and needs no ruling, so line 61 is stricter than the rules file and contradicts line 45.
3. Case 5 tells the builder not to stop: "writes no test and says so in the report ... the orchestrator raises it". `agents/spec.md:60` says "A step that needs a new entry stops and asks Axel for it". The case also points the builder at G126's tests, which do not cover a re-read. The existing cover is G61's `tests/server/root/process/config-cache.test.ts:115-129`, "parses a config folder once for requests over it, and again once a file of it is written". It changes `behavior.yml` and asserts the new value through the real `loadConfig`. The case should name it.
4. Case 10 runs G126's tests only. `agents/spec.md:60` ("A step whose change touches an entry's code runs that entry's test") also requires G130's `tests/data/sources/config/layers/language.test.ts` (its Code line names `text.ts`, `guarded.md:205`) and G13's config-reader tests (`guarded.md:256-257`). G61's config-cache test exercises `loadConfig` too. `test:quick` runs the tests that import the changed files, which probably covers most of them, but the case list and verify item 3 under-name them.
5. Case 9 ("well under a second") follows `agents/spec.md:60`. The tree's own rule, `vite.config.ts:485-486`, tags as slow any test that takes 100 ms or more alone. If the 5 rows end at 150 to 300 ms they pass case 9 and still meet the tree's definition of slow, and item 4 forbids the tag. The two definitions clash; the brief names neither the clash nor which one wins.
6. Verify line 90 says each output is "piped through the filter the rules file names". `agents/spec.md` names no filter (`git grep -n filter -- .scratch/migration/agents/spec.md` finds nothing). Verify item 5 uses `LC_ALL=C grep -n '[^ -~]'`, which `agents/spec.md:103` says the perl ASCII gate replaces "wherever a brief or a check names it".
7. Verify item 1 omits `npm run diagrams`, which `agents/spec.md:26` requires right before each `test:quick`. Its output can rewrite `docs/diagrams/writes.dot` and `writes.svg` (Names 6), which are outside the write list.
8. No case asks the builder to check, quote or explain a place the step does not change, apart from reading other entries' tests for case 5, which is in scope. Case 3's files are unchanged but run through `labTarget`, which changes.
9. `agents/spec.md:88` ("No globals ... no module-level mutable state shared across module graphs, no process-wide bridge; a dependency is passed in ... This holds in test fixtures and helpers too"):
   - Item 2's "kept per process" in `text.ts` is module-level mutable state in product code. The tree keeps such state behind passed-in objects: `ServerContext.deckGlobs` (`src/lib/server/edit/writes.ts:157`), `ContextDependencies['loadConfig']` (`dependencies.ts:66`), the closure in `words.ts:15-21`. `git grep` for a module-level `new Map/Set` in `src` finds only read-only constants plus `src/lib/server/machine/runs/lint/writing/comment-worker.mjs:42`.
   - Item 3's "once per test file" in `write-fixture.ts` is the same kind of state if it is filled lazily.

   The brief does not say how either item fits this rule. Whether "shared across module graphs" exempts a per-module map is a reading the orchestrator should settle before dispatch. As written, the builder must either break the rule or stop.

## The question

1. Item 1 cannot pass without its part of the goal. With both hubs inside a private folder, `<hub>/..` is that folder, and `config-key.test.ts:458` no longer depends on what the shared temp folder holds. Line 374's refusal still proves that no write escaped next to the hub.
2. Item 2 can pass without the goal. Its own condition is reached once parses are reused, but whether that brings the rows under the limit depends on what is left of a load. On my measurement (Premises 10) about 70 to 75% of a load is YAML parsing. What remains is roughly 27 to 38 ms of reads, 10 ms of `shapeIssues`, 5 to 10 ms of copying the kept parses, plus the merge, the hub layer and the language layer, about 70 to 90 ms in all (judgment). It is enough for the goal only together with item 3, and only if the rows' other costs stay small.
3. Item 3 can pass while the zenodo rows keep a full engine load per row. It does not reach `depositTarget`'s `loadConfig(engineDir())` (`deposit-world.ts:69`), which runs on every zenodo row. Item 2 makes that load cheaper but not free.
4. Item 4 and case 9 can pass without the goal.
   - "A fraction of its time before" has no number, so 90% of today's time passes.
   - Both are measured alone. The goal is under the suite's full load. The observed slowdown of the 5 rows under load was at least 5.1 to 9.9 times (6169/622, 5642/704, 5465/1066, 5170/560, 5488/554; each is a lower bound, since the rows were cut off at the limit). A row that ends at 400 to 500 ms alone, which is "well under a second", can still reach 5000 ms under that load.
   - A bound tied to that factor (around 250 ms alone, or the tree's 100 ms in `vite.config.ts:486`) would make the check fail if the goal is not reached.
5. Cases 1 and 2 cannot pass without the 11 rows' goal: case 1 runs with `/tmp/x` present, and case 2 is a reading of the fixed path. Cases 3, 4, 5, 6, 7, 8 and 10 are correctness and regression checks and say nothing on the time goal. No case or check runs the suite under load, so the step's title goal (the whole suite green) cannot be shown inside the step; only the release run shows it.
6. Do items 2 and 3 bring the 5 rows under the limit under load? My judgment is that they very probably do. Bringing them under is likely; keeping a margin is not ensured.
   - app-store rows today spend about 500 ms of their 640 to 760 ms in the two loads of `targetOver`, which item 3 removes. About 100 to 250 ms is left alone.
   - zenodo rows spend 2 loads (`fixture`) or 3 (`withLab`) of 222 to 377 ms each, about 450 to 750 ms of a 500 to 750 ms row. With item 2 each load drops to about 70 to 90 ms, leaving about 150 to 300 ms alone.
   - At the observed 8 to 10 times slowdown, that is about 1.2 to 3 s, under 5000 ms.

   What would settle it: a timed alone run after the change, compared with a bound of around 250 ms.
7. Other costs in those rows:
   - **app-store:** each row runs `target()`'s `mkdtemp` and about nine file writes (`write-fixture.ts:74-112`), `routeSetup`'s app scan and host fixture (`apps-fixture.ts:139-174`), and `portfolioConfigFrom` on the per-row copy (a clone plus `portfolioConfigFrom` measured 15.3 to 33.4 ms in the gate). Item 3's copies cost about 11 ms each, and `careerRules` runs too.
   - **zenodo:** each row runs `depositTarget`'s per-row load (`deposit-world.ts:69`), `portfolioConfigFrom` 2 or 3 times (`zenodo-world.ts:123,154`, `deposit-world.ts:73`), the fflate zipping and deflating, the deposit's term scan over the code files, and the fake Zenodo calls.
   - **The first row of a file:** vitest isolates each test file's modules (`vite.config.ts` sets no `isolate`, and the default isolates), so "kept per process" means kept per test file, and the first load in a file pays the cold parse (376.8 ms in the gate). `warmConfig` (`write-fixture.ts:115-122`, "The first load of a process costs about twice a later one") moves that cost into a hook, so it is no no-op after items 2 and 3. Removing it with its 17 callers, which item 3 allows, would move the cold parse back into the first row of each of those files and work against the goal (judgment).
8. Brief decision 1 (keyed by text, read on every call) cannot return a stale value, and it keeps the read record that `config-value.test.ts:47-56` depends on. It leaves the size of the kept parses unbounded (Implied inputs 6).

## Implied inputs

1. A config file that does not parse on one call and parses on the next, or the reverse. This has happened (a torn write during an editor save, or a user fixing a file), and a wrong answer costs a stale finding or a dropped file's keys being served. It is missing from Cases: case 7 repeats the same broken text, and case 5 changes a valid value. Expected: the fixed text gives its keys and no `does_not_parse` finding, and a newly broken text gives the finding with the file's keys dropped (`droppedFile`, `merge.ts:111-122`).
2. An empty file. `readConfigFile` reads `parse(text()) ?? empty`, where `empty` is `{}` for `merge.ts:177` and `null` for `options-folder.ts:119`. If what is kept is the value after `?? empty`, keyed by text alone, an empty defaults file reads as no map (a spurious finding) or an empty options file reads as `{}` (a lost finding). Missing. Expected: an empty defaults file adds no key and no finding; an empty options file gives `not_a_map`, as today.
3. The same text in two files. This happens on every row of `configTarget` and `labTarget`: `scratchEngine` copies `config/` into a new temp folder per row (`write-fixture.ts:522-527`), and two fragments can also be identical. Anything kept besides the raw parse (the shape's issues, which depend on `name`; the findings, which name `file`) must not be reused across files. Missing. Expected: each file's findings name its own path and are judged by its own shape. If instead the key includes the absolute path, every scratch-engine row misses the kept parses and the config-key and config-value rows stay slow. The brief leaves this choice to the builder.
4. `instead` replacing a file's text, which every config write's check does (`config-place.ts:93`). Missing. Expected: after a call with `instead` for file F, a plain call returns F's text on disk, never the candidate's.
5. The workspace layer and the language layer over kept parses. The layers copy along a path (`tree.ts:28`), and the language layer writes into the per-call `text` map (`text.ts:155`), so on today's code no layer mutates a kept parse. Only case 8 (hubs) and case 6 (a caller) test isolation. Expected, for a guard: a `loadConfig` with a workspace laying `glyphs` or `agents`, followed by one without a workspace (what `configCache.defaults()` makes), returns oculus's own values.
6. Memory held by the kept parses. All parses together are about 1.4 MB as JSON (`JSON.stringify(config).length` = 1396832 in the gate), several MB as objects (judgment). Keyed by text with no eviction, the product server keeps one entry per distinct text it ever sees: every saved edit of a config file, and every `instead` candidate of every Settings write, for the life of the process. That costs memory in a long session. Missing. Expected: a bound, such as one kept parse per file name relative to `config/` replaced when the text changes, which also keeps scratch-engine reuse.
7. YAML aliases, including a looping alias. `text.ts:148` handles "a fragment whose aliases loop". Copying a kept parse with a JSON round trip, or a hand-written copy, would throw or recurse on a cycle, where `structuredClone` keeps cycles and shared references. No shipped file uses an anchor today (`grep -rlE '(^|[ :,-])&[A-Za-z]|: \*[A-Za-z_]|...' config --include=*.yml --exclude=local.yml` finds nothing), but a hub user can write one. Missing. Expected: the same finding as today and no crash.
8. The product server's own calls and watchers. `portfolio.ts:642` calls `loadConfig` directly on every watcher-driven rebuild. The config cache (`config-cache.ts`) calls it when a stamp changes (G61). Both read the text on every call, so a watched change is picked up. No case is needed beyond G61's existing test (Cases and checks 3), which the brief should name.
9. Concurrent calls. `loadConfig` is synchronous, so calls in one process do not interleave. The desktop process (`start-colours.ts`) and worker threads have their own module instances. No case is needed.
10. Vitest module isolation per file. The kept parses live per test file, not per process. Not a case; it bears on `warmConfig` (The question 7).
11. The hub settings file. It is parsed in `mergeHub` (`hub-layer.ts:585`) and the workspace file in `workspace-layer.ts:274`, neither through `readConfigFile`, so item 2 does not reuse them. Case 8 covers that each hub's keys stay its own. This is correct as the brief scopes it.
12. `tests/server/core/changes.test.ts:88` calling `targetOver` with `keep`, and `depositTarget`'s per-row load. These are callers whose behaviour item 3 changes or leaves out (Names 2 and 11). Expected: `changes.test.ts` passes before and after. It is not in the brief's cases.

## ADRs

none. `ls docs/adr` gives "No such file or directory" (exit 1), `grep -n -i adr .agents/plan.yaml` finds nothing (exit 1), and `find . -type d -iname '*adr*'` outside `node_modules` finds nothing.

## Dictated text

1. `grep -n 'Everything in the brief is done' .scratch/migration/agents/briefs/O185.md` gives line 103: "The first line: anything NOT done, or "Everything in the brief is done"." It is dictated for the report file `.scratch/migration/agents/reviews/O185-report.md`. It holds: these are the words of `agents/spec.md:84` (Report), in ASCII. No other line of the brief gives words for a file. "every command passed" (line 92) is an expected output, and `<tab>`/`<em dash>` (line 101) are a form for naming characters.

## Declined to judge

1. I did not rerun `config-key.test.ts` in the gate to see the 11 red rows. Its rows send `root: '../x'` next to `/tmp/x`, and I am never to touch that file. The premise is checked by reading `config-key.test.ts:374,458`, `write-fixture.ts:75` and `scratch.ts:25-33`, and by `ls -l /tmp/x`.
2. I did not check the whole-suite run of brief line 11 (834.5 s and the red rows). `npm run test:landing` is banned to me, and no log of it was found.
3. I did not rerun the brief's CPU profile. I used a read-only node timing split in the gate instead (Premises 10), which writes no file.
4. I did not check whether `tests/routes/edit/config-key.test.ts` or another config-write test also covers a re-read after a change. G61's row already covers it, and the rest is the builder's search under case 5.
5. I did not judge whether other files that timed out under load before (O159's booking at `plan.md` names `cpp.test.ts`, `website.test.ts`, `config-value.test.ts` and `choices.test.ts`) will time out at the release run. They are outside the step's paths, and only that run shows it.
6. The permitted timing run of the two files made and removed its own scratch folders under `/tmp` through `tests/fixtures/scratch.ts`. I created nothing there myself.

## Closed

Each finding is closed by a change to the brief; the brief's sections named are as rewritten.

1. Names 1, 3 and 4 (`labTarget`, `configTarget`, `target`): item 1 now says how the private parent is made (through `targetOver` and one shared writer of `target()`'s files, or an optional parameter of `target()` with its default unchanged), so `target()`'s 38 importers and `configTarget`'s callers are untouched.
2. Names 2 and Implied inputs 12 (`targetOver` in `changes.test.ts`): item 3 keeps the signature and `keep`; `changes.test.ts` is in case 3 and verify 2.
3. Names 5 and The question 7 (`warmConfig`): item 3 keeps `warmConfig` and its 17 callers unchanged; the conditional path line is gone.
4. Names 6, Cases and checks 7 (diagrams): verify 1 is `npm run diagrams && npm run test:quick`; `docs/diagrams/writes.dot` and `writes.svg` are on the path list.
5. Names 7 and 8 (callers, the read record): Decisions 1 and 2 keep the read on every call and leave every other product caller unchanged.
6. Names 9 and the comment at `config-cache.ts:2-4`: item 5 lists every comment to re-read, and `config-cache.ts` (head comment only) and `src/lib/data/index.ts` (the `HubSettings` doc only) are on the path list. With item 2 the server's reparse after a change touches only changed files, so the comment's cost and its "parses again" are inside the step.
7. Names 10, Cases and checks 4, Premises 15 (G130, G13, G61): "What is on the tree" names the four entries and their tests; verify 3 runs them all.
8. Names 11, Premises 9 and The question 3 (`depositTarget`'s load): item 3 covers `deposit-world.ts:69,75`, and the file is on the path list.
9. The step line 1 (whole suite green): the title's goal is shown only by the release run; item 4's bound is set from the slowdown under load, so the alone run can fail when the goal is not reached.
10. Premises 3, 6, 8, 9, 11, 12, 13 and 18: corrected in "What is on the tree" (`:568`, `:441` tagged slow, `app-store.test.ts:40`, 2 and 3 loads per zenodo row, 98 files with `config/options/local.yml`, `merge.ts:177` and `options-folder.ts:119`, `merge.ts:147-216`, `:504-505`).
11. Premises 1: not verifiable by the brief check; the log is not kept, and the release run reruns it.
12. Premises 14 and Cases and checks 5 (the 100 ms definition): "What is on the tree" quotes `vite.config.ts:485-486`; item 4 reports every row against 100 ms and Decision 5 says a row left above it is raised by the orchestrator, never tagged, under ruling 753.
13. Cases and checks 1 (TMPDIR): the `/tmp/x` reproduction now uses `TMPDIR` and `GIT_CEILING_DIRECTORIES` set to `.agents/scratch` with a file `.agents/scratch/x` there, so no `env -u TMPDIR` remains outside `npm run test:quick` (`agents/spec.md:34`).
14. Cases and checks 2 (the script paragraph): the brief allows one case-run program under `agents/spec.md:66` and no other script.
15. Cases and checks 3 (case 5): case 5 names G61's row `config-cache.test.ts:115-129` as the cover, and no longer tells the builder to skip stopping.
16. Cases and checks 6 (the filter): the filter wording is gone; verify 5 is the perl ASCII gate of `agents/spec.md:103`.
17. Cases and checks 9 (No globals): item 2 is redesigned. The kept parses are a value the caller passes in and gets back (`parses`), with no module-level state; the product caller is `contextConfig`'s closure, so the option has a production caller under `agents/spec.md:89`; the fixtures hold module constants computed at import, deep-frozen, cloned per row (precedent `zenodo-world.ts:42`, `apps-fixture.ts:25`).
18. The question 2, 4 and 6 (the bound): item 4 sets 300 ms alone per row, from the 5.1 to 9.9 times slowdown measured under load.
19. Implied inputs 1, 2, 3, 4, 5, 7: each is a case of the brief now (broken then fixed, empty files, the same text in two engines, `instead`, a mutated result and the workspace layer, aliases); item 2 keeps the raw parse before `?? empty`, keys by name relative to `config/` and text, never keeps an `instead` text, and copies with `structuredClone`.
20. Implied inputs 6 (memory): `parses` holds one entry per file of the folder now, so it is bounded by the folder.
21. Implied inputs 8 to 11: no case needed, as the report says; G61's row covers a watched change.
22. Dictated text 1: unchanged and true.

Usage: aa439017cc1038d36, claude-opus-5-5, 228691 tokens, 66 tool uses, 696 s.
