# O185 report: the whole suite runs green

NOT done in full: verify check 4 ("the 5 rows at most 300 ms after") does not hold in every run. In every quiet per-file run the 5 rows took 39 to 150 ms, but in the last two runs of the brief's two-file command three of them took more than 300 ms (442, 360 and 430 ms, then 827, 484 and 875 ms), and one loaded zenodo-alone run had the Recover row at 899 ms. Every other item of the brief is done.

## Open items of the state file

The list under "## Open items" in `.scratch/migration/orchestrator-state.md` (lines 188 to 199) holds no entry: `sed -n 188,200p .scratch/migration/orchestrator-state.md | cat -vet` printed the heading, eight empty lines and the closing paragraph "An entry leaves this list for the closed log the moment Axel rules on it. ..."

## Premises that did not reproduce, and paths outside the write list

1. **`tests/fixtures/engine-load.ts` cannot be created.** `ls tests/fixtures | wc -l` printed `10`, the most a folder may hold (`agents/spec.md:49`, `utils/folder-check.sh`). The module is at `tests/fixtures/hubs/engine-load.ts`: that folder held 9 (`ls tests/fixtures/hubs | wc -l` printed `9`) and it holds the hub fixtures this module serves (`real-hub.ts` with `DEMO_HUB`, `deposit-world.ts`, `zenodo-world.ts`). `sh utils/folder-check.sh` after the change: exit 0. The orchestrator may move it.
2. **Two files outside the write list had to change**, because `loadConfig`'s result now carries `parses` and `svelte-check` refused two places that build the result type by hand:
   - `src/lib/server/root/watch/portfolio/portfolio.ts:664`: "Property 'parses' is missing in type '{ config...; findings...; from... }'". The rebuild now keeps the whole result (`const loaded = loadConfig(paths.engine, layers)`) and hands it to `configPayload`, rather than rebuilding `{ config, findings, from }`. The call itself is unchanged (decision 2). The file stays at 879 lines.
   - `tests/server/root/process/config-cache.test.ts:269,270,299,300` (svelte-check reported the errors at 269, 270, 305 and 306): four fake loaders for `createConfigCache` now return `parses: {}` as well. No assertion changed (table below).
3. **Case "config-value.test.ts and undo/hub-settings.test.ts ... every row passes before"** did not hold in every run on the unchanged tree. Of three runs of the three files together, the first had 1 failed row and the third had 6 failed rows, all "Test timed out in 5000ms", for example `config-value.test.ts > a list written into the workspace file > adds the list under settings, then rewrites it in place, and leaves the defaults file 6299ms`. The second run passed 45 of 45. Run alone, each file passed (24 of 24 and 3 of 3), with rows at 0.4 to 3.8 s at load average 15. These rows spend their time in the product's own config loads on scratch engines (`config-place.ts:93`, `config-checks.ts`), which decision 2 leaves unchanged. I read this as the machine's load, not a rule of the brief that is wrong, so I did not stop. After the change, check 2 passed 81 of 81 in its one run.
4. **`docs/diagrams/writes.dot` and `writes.svg` are unchanged**: `npm run diagrams` rewrote nothing (`git status --short` lists neither). The edges they draw name the same imports (`readConfigFile`, `mergeText`, `worded`).

## The cases' first run (unchanged tree), and after

The case-run program for the `loadConfig` cases is `.agents/scratch/cases.mjs`, with `.agents/scratch/yaml-count.mjs` counting `yaml`'s `parse` calls made from `merge/text.ts` or `merge/merge.ts`. Both are quoted at the end and both are deleted. Before the change, `parses` is ignored: each "with parses" call there is the same call with no `parses`, which is the only first run such a case can have (cases 1, 2 and 4 to 11 below).

| Case | Check | First run, unchanged tree | After the change |
| --- | --- | --- | --- |
| config-key 'a write that names a hub', 11 rows, with `x` in TMPDIR | `touch .agents/scratch/x`; `TMPDIR=GIT_CEILING_DIRECTORIES=$PWD/.agents/scratch npx vitest run tests/server/edit/config-key.test.ts -t 'a write that names a hub'` | `Tests  11 failed \| 2 passed \| 23 skipped (36)`, each at `tests/server/edit/config-key.test.ts:458:55` "expected true to be false" | `Tests  13 passed \| 23 skipped (36)`, all 11 rows pass, and `ls .agents/scratch/x` still listed the file |
| The same rows with no `x` | the same command after `rm .agents/scratch/x` | `Tests  13 passed \| 23 skipped (36)` | check 2 below (all rows pass with `x` present) |
| config-value, undo/hub-settings, core/changes | `npx vitest run` of the three files | runs of 1 failed / 44 passed, 45 passed, 6 failed / 39 passed (timeouts, see premise 3) | check 2: `Tests  81 passed (81)` |
| 1. Unchanged folder, second call with the first's `parses` | case-run 1 | `firstParsed 98, secondParsed 98, secondEqualsFirst true, secondEqualsPlain true` | `keptEntries 98, firstParsed 98, secondParsed 0, secondEqualsFirst true, secondEqualsPlain true` |
| 2. A file's text changed between calls | case-run 2, and G61's row | `parsed 98, value 2, equalsPlain true`; G61 row passed in 27 ms | `parsed 1, value 2, equalsPlain true`; G61 row passed in 26 ms |
| 3. Broken then fixed, fixed then broken | case-run 3 | fixed: `brokenDropped true, fixedHasKey true, fixedFileFindings 0, fixedEqualsPlain true`; broken: `againDropped true, againHasKey false, againFileFindings 1, againEqualsPlain true` | the same values |
| 4. Empty defaults and options files, twice | case-run 4 | defaults `[]` both times; options `["is not a map of keys"]` both times; `secondEqualsPlain true` | the same |
| 5. Same text in two scratch engines | case-run 5 | `findings 35, secondParsed 99, namesFirst false, findingsNameSecond true, equalsPlain true` | `secondParsed 0`, the rest the same |
| 6. `instead` then a plain call with its `parses` | case-run 6 | `candidateSeen 1, plainAfter null, equalsPlain true` | the same |
| 7. Mutated result; workspace glyphs and agents then none | case-run 7 | `feedRegistries [], refresh "(r)", equalsPlain true`; workspace `W`/`W`, after `(r)`/`Claude`, `equalsPlain true` | the same |
| 8. Frozen `parses` | case-run 8 | `threw null, equalsPlain true` | the same |
| 9. YAML alias, twice | case-run 9 | `threw null, value {"k":1}, equalsFirst true, equalsPlain true` | the same |
| 10. Two hubs, each with the engine `parses` | case-run 10 | `parsed [98,98], values ["one","two"], from [".oculus/config.yml",".oculus/config.yml"], equalsPlain [true,true]` | `parsed [0,0]`, the rest the same |
| The 5 rows, alone | `npx vitest run <file> --reporter=verbose` | see the timing table (two-file run at load 12: 621 to 1868 ms) | app-store 54 and 42 ms; zenodo 134, 89 and 69 ms in the quiet run (more in item 4) |
| Guarded tests of G126, G130, G13, G61 | check 3 | `Test Files  7 passed (7)`, `Tests  135 passed \| 2 skipped (137)` | the same; the 2 skipped are `config-folder.test.ts` rows "(skipped: OCULUS_TEST_HUB is not set)" |

## DONE / NOT DONE

| Item | State | Proof (command and its last line) |
| --- | --- | --- |
| 1. `labTarget`'s two hubs in one private folder | DONE | Check 2 with `.agents/scratch/x` present: `Tests  81 passed (81)`; the 11 rows alone with `x`: `Tests  13 passed \| 23 skipped (36)`. Line 458 unchanged (`git diff tests/server/edit/config-key.test.ts` prints nothing). |
| 2. `loadConfig` takes and returns `parses`; `contextConfig` passes them | DONE | Case-run cases 1 to 10 above; check 3: `Tests  135 passed \| 2 skipped (137)` |
| 3. Fixtures load the two fixed configs once per test file | DONE | `grep -n 'loadConfig(' tests/routes/edit/write-fixture.ts` lists only `:517` (a load over another hub, with `engineParses()`); `deposit-world.ts` no longer imports `loadConfig`; `zenodo-world.ts:122,154` pass `engineParses()` |
| 4. The 5 rows at most 300 ms alone | NOT DONE in full | Quiet per-file runs: all 5 at 39 to 150 ms. Loaded runs: above 300 ms (see first line and item 4 below) |
| 5. Comments | DONE | List below |
| Check 1 `npm run diagrams && npm run test:quick` (TMPDIR unset), run once | DONE | `test:quick: 266.6 s; every command passed` |
| Check 2 four files, `x` present | DONE | `Test Files  4 passed (4)`, `Tests  81 passed (81)` |
| Check 3 guarded tests | DONE | `Test Files  7 passed (7)`, `Tests  135 passed \| 2 skipped (137)` |
| Check 4 timing, before and after | NOT DONE in full | Last runs: `Tests  66 passed (66)`, but rows at 442, 360 and 430 ms (and 827, 484, 875 ms in the next run) |
| Check 5 ASCII gate | DONE | printed nothing; `ascii exit=0` (find wrote `bfs: error: bin: No such file or directory.` to stderr: there is no `bin` folder). `LC_ALL=C grep -n '[^ -~]'` over the 11 touched files: no output, `grep exit=1` |
| Check 6 `sh utils/unused-exports.sh` | DONE | `diff` against `O185-base/unused-exports.txt`: no output, `diff exit=0`; 334 lines both. The step adds no line. |

Full-list runs: 1. Whole-suite commands: none.

### test:quick, its closing lines

```
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      ASCII gate (0.9 s)
ok      svelte-kit sync (2.9 s)
ok      eslint (12.9 s)
ok      svelte-check (46.4 s): 1794393415837 COMPLETED 592 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (170.2 s): Duration  151.40s (transform 82.41s, setup 0ms, import 182.07s, tests 303.78s, environment 6ms)
ok      vitest (215.0 s): Duration  198.30s (transform 200.99s, setup 0ms, import 379.83s, tests 362.55s, environment 8.08s)
ok      vitest slow (263.6 s): Duration  247.00s (transform 38.40s, setup 0ms, import 222.81s, tests 751.36s, environment 16ms)
test:quick: 266.6 s; every command passed
```

## Item 4: the row times

Columns: before = the brief's two-file command on the unchanged tree (load average 11.95); after = the same command after the change (load 7.82); alone after = each file run alone, app-store at load about 7.6 and zenodo in its quieter run (load 7.32). Durations: before `Duration  61.42s`; after `Duration  16.80s`; app-store alone `Duration  4.44s`; zenodo alone `Duration  7.63s`.

The 5 rows the brief names:

| Row | Before | After, two files | Alone after |
| --- | --- | --- | --- |
| app-store: a host update of undefined, which deletes the key and keeps the rest | 1294 | 442 | 54 |
| app-store: a host update over a store file that holds 5, ... | 1116 | 360 | 42 |
| zenodo: is not sent by the Recover route when another hub of the workspace reads it from the row | 1868 | 430 | 134 |
| zenodo: sends Publish with the creators of the team, ... | 759 | 91 | 89 |
| zenodo: refuses a DOI with no Zenodo status ... own authors and restricted files ... | 621 | 75 | 69 |

Every run of these rows after the change (ms): app-store host undefined 682, 358, 62, 75, 442, 827 in two-file runs and 55, 63, 54 alone; holds 5: 527, 300, 41, 52, 360, 484 in two-file runs and 40, 39, 42 alone; Recover: 496, 484, 166, 200, 430, 875 in two-file runs and 577, 135, 899, 150, 134 alone; Publish: 96, 94, 99, 101, 91, 95 in two-file runs and 390, 99, 89 alone (one alone run cut the line); restricted: 71, 81, 217, 70, 75, 152 in two-file runs and 104, 73, 66, 326, 69 alone. Load averages ran from 4.4 to 10.4 across these runs.

Every row, before / after (two files) / alone after, ms:

| Row | Before | After | Alone |
| --- | --- | --- | --- |
| app-store: a file over the limit, which holds no value to compare, so the write goes ahead | 1501 | 221 | 40 |
| app-store: a file that does not parse, which holds no value to compare, so the write goes ahead | 1841 | 190 | 35 |
| app-store: a host update of one key, which keeps the other keys, and is recorded | 1610 | 474 | 62 |
| app-store: a host update of undefined, which deletes the key and keeps the rest | 1294 | 442 | 54 |
| app-store: a host update over a store file that holds 5, which leaves a map holding the one key | 1116 | 360 | 42 |
| app-store: a host update over the limit, answered too_large with the store as it was, and an empty key refused | 1192 | 272 | 39 |
| app-store: a root app store inside the root, and a machine app store inside the data folder | 1817 | 484 | 48 |
| app-store: a store folder that is a link out of the base, refused outside with nothing written | 2072 | 356 | 44 |
| app-store: a store that changed, which tells the apps watcher, and one that did not | 1020 | 202 | 43 |
| app-store: a target that holds no apps, answered unwritable | 4662 | 276 | 56 |
| app-store: a value equal to the file with its keys in another order, which writes and records nothing | 1140 | 241 | 37 |
| app-store: a value over the limit, refused too_large with no file made | 815 | 174 | 34 |
| app-store: a write through the endpoint, recorded with the sizes and kept in the undo folder | 949 | 298 | 61 |
| app-store: one record naming the app, the field store, byte sizes and both values | 901 | 257 | 39 |
| app-store: the first write, which makes the folder and the file private to the machine | 1036 | 193 | 52 |
| zenodo: Publish: deletes nothing and writes nothing when the publish answers 502 and neither the draft nor the record reads | 960 | 72 | 84 |
| zenodo: Publish: deletes nothing and writes nothing when the publish gets no answer and neither the draft nor the record reads | 751 | 71 | 97 |
| zenodo: Publish: deletes the draft and writes nothing when Cancel ends the upload | 671 | 70 | 85 |
| zenodo: Publish: deletes the draft and writes nothing when the publish answers 502 and the draft is not published | 775 | 71 | 92 |
| zenodo: Publish: deletes the draft and writes nothing when the publish gets no answer and the draft is not published | 635 | 70 | 102 (100+) |
| zenodo: Publish: keeps the DOI written when the share link answers 502 | 712 | 84 | 100 (100+) |
| zenodo: Publish: keeps the DOI written when the share link gets no answer | 868 | 79 | 81 |
| zenodo: Publish: leaves Publish of a DOI with no Zenodo status a new version of the record | 806 | 89 | 91 |
| zenodo: Publish: makes a new version of a published record for Publish over zenodo_status deposited | 876 | 85 | 96 |
| zenodo: Publish: makes a new version of a review copy whose DOI has zenodo_status empty | 862 | 98 | 127 (100+) |
| zenodo: Publish: makes a new version of a review copy whose DOI has zenodo_status none | 676 | 90 | 98 |
| zenodo: Publish: makes a new version of a review record, keeping its DOI, with a share link when review_link is empty | 669 | 86 | 87 |
| zenodo: Publish: makes no share link for a new version of a review record whose review_link is set | 842 | 75 | 83 |
| zenodo: Publish: names the draft when Zenodo refuses to delete it | 730 | 69 | 78 |
| zenodo: Publish: refuses a DOI with no Zenodo status of a record with Anonymous among two creators, with no call after the read | 631 | 71 | 73 |
| zenodo: Publish: refuses a DOI with no Zenodo status of a record with Anonymous and open files, with no call after the read | 608 | 73 | 76 |
| zenodo: Publish: refuses a DOI with no Zenodo status of a record with its own authors and open files, with no call after the read | 627 | 94 | 76 |
| zenodo: Publish: refuses a DOI with no Zenodo status of a record with its own authors and restricted files, with no call after the read | 621 | 75 | 69 |
| zenodo: Publish: refuses a version DOI, naming the concept DOI, before any draft | 619 | 68 | 77 |
| zenodo: Publish: refuses For review of a published deposit, naming its DOI, before any request | 722 | 65 | 78 |
| zenodo: Publish: sends Publish with the creators of the team, their family names, the funding, the real files and public access, and writes the DOI | 759 | 91 | 89 |
| zenodo: Publish: still writes the DOI and the share link when Cancel comes after the publish was sent | 680 | 81 | 95 |
| zenodo: Publish: writes nothing and names the page when the read after the publish answers 502 | 710 | 70 | 80 |
| zenodo: Publish: writes nothing and names the page when the read after the publish gets no answer | 947 | 74 | 81 |
| zenodo: Publish: writes the DOI and deletes nothing when the publish answers 502 after Zenodo published | 767 | 90 | 123 (100+) |
| zenodo: Publish: writes the DOI and deletes nothing when the publish gets no answer after Zenodo published | 733 | 82 | 103 (100+) |
| zenodo: Publish: writes the published status of a new version with no read after its publish | 661 | 89 | 95 |
| zenodo: the hub a press reads > answers the token's readiness of the GET from the project's own hub | 1088 | 116 | 112 (100+) |
| zenodo: the hub a press reads > reaches the address of the project's own hub alone for a project of a second hub | 857 | 129 | 143 (100+) |
| zenodo: For review > matches a term holding pattern characters as its letters | 880 | 503 | 87 |
| zenodo: For review > refuses a binary file holding a term, naming it, before any request | 1418 | 99 | 80 |
| zenodo: For review > refuses a file of a compressed form it cannot read, naming it | 1143 | 650 | 67 |
| zenodo: For review > refuses a finding of the deposit scan, naming the file, before any request | 1015 | 847 | 68 |
| zenodo: For review > refuses a Latin-1 file holding a term in its one-byte form, naming it | 1710 | 1172 | 69 |
| zenodo: For review > refuses a PDF whose deflated stream holds a term, naming it | 1161 | 805 | 71 |
| zenodo: For review > refuses a row with an empty term, naming the row, before any request | 913 | 532 | 66 |
| zenodo: For review > refuses a Word file whose deflated part holds a term, naming it | 1547 | 1044 | 74 |
| zenodo: For review > refuses two paths that become one, naming both, before any request | 2180 | 452 | 71 |
| zenodo: For review > replaces a term in the name of a folder | 2022 | 452 | 81 |
| zenodo: For review > replaces a term in the repository's name, which names the zip | 1397 | 846 | 83 |
| zenodo: For review > replaces a term written in any case | 1013 | 131 | 81 |
| zenodo: For review > replaces the longer of two terms first, the longer listed first | 853 | 531 | 81 |
| zenodo: For review > replaces the longer of two terms first, the shorter listed first | 1135 | 413 | 83 |
| zenodo: For review > sends one anonymised zip, an Anonymous creator, restricted files and a share link, and writes the DOI, the link and the Zenodo status | 2089 | 140 | 141 (100+) |
| zenodo: For review > sends the title and the description with the terms replaced | 1369 | 111 | 84 |
| zenodo: the Zenodo token > goes as Bearer in the Authorization header to the deposit address alone | 1869 | 336 | 81 |
| zenodo: the Zenodo token > is in no answer, log line or History record of a For review that wrote the manifest | 2975 | 482 | 82 |
| zenodo: the Zenodo token > is in no answer, log line or sentence when the upload is refused, and the draft is deleted | 1255 | 519 | 70 |
| zenodo: the Zenodo token > is not sent by the Recover route when another hub of the workspace reads it from the row | 1868 | 430 | 134 (100+) |
| zenodo: the Zenodo token > is not sent by the Recover route, whose Recover row names auth on its downloads row | 1752 | 275 | 76 |
| zenodo: the Zenodo token > keeps the shipped auth and time limit under a hub that lays only the address | 987 | 425 | 320 (100+) |

Where the time of the rows marked 100+ alone goes:

- Every zenodo row makes `fixture()`, which runs one `loadConfig(engineDir(), { hub, parses: engineParses() })` (`zenodo-world.ts:122`). The case-run program's case 11 measured a load with the engine's `parses` at 42 to 64 ms (median 44) in one run and 78 to 85 ms (median 79) in the next, against 204 to 288 ms and 207 to 265 ms with no `parses`. What remains of a load is reading the 98 files, the shape check, the clone of each kept parse and the merge layers. The brief requires all of these on every call. This load is the floor of 65 to 100 ms that every zenodo row shows alone.
- The rows that call `withLab` (Recover when another hub reads it, 134 ms; reaches the address of the project's own hub, 143 ms; answers the token's readiness, 112 ms) make two such loads (`zenodo-world.ts:122` and `:154`).
- 'keeps the shipped auth and time limit ...' (320 ms) calls `loadConfig(engineDir())` itself, with no `parses`, at `tests/routes/git/zenodo.test.ts:428`. That test file is outside the write list, so the line is unchanged. Changing it to `engineConfigCopy()` would remove the full load.
- 'sends one anonymised zip ...' (141 ms) is the file's first row and builds the first zip. The Publish rows at 100 to 127 ms are within 30 ms of their neighbours at 70 to 98 ms. I read that spread as noise from the machine's load, not verified.
- The app-store rows take 34 to 63 ms in every alone run, and up to 827 ms in the runs beside zenodo. Their own code path is two or three `updateHostStore` calls, each an fsynced atomic write (`src/lib/server/core/json.ts:160`, `writeFileAtomic.sync`) plus a change-log record. My judgment is that the excess in the two-file runs is disk and CPU contention with the zenodo worker and the other suites on this machine (load 4.4 to 10.4). No run isolated it, so this is not verified.

## Files changed

| Path | Lines now | +/- (`git diff --numstat`) | In the write list |
| --- | --- | --- | --- |
| `src/lib/data/sources/config/merge/merge.ts` | 340 | +74 -11 | yes |
| `src/lib/data/sources/config/merge/options-folder.ts` | 143 | +6 -11 | yes |
| `src/lib/data/sources/config/merge/text.ts` | 224 | +17 -9 | yes |
| `src/lib/server/root/process/config-cache.ts` | 260 | +4 -2 (head comment only) | yes |
| `src/lib/server/root/process/context/config-parse.ts` | 94 | +16 -7 | yes |
| `tests/routes/edit/write-fixture.ts` | 618 | +47 -26 | yes |
| `tests/fixtures/hubs/zenodo-world.ts` | 309 | +4 -3 | yes |
| `tests/fixtures/hubs/deposit-world.ts` | 84 | +4 -3 | yes |
| `tests/fixtures/hubs/engine-load.ts` (new) | 41 | +41 | no: the brief named `tests/fixtures/engine-load.ts`, whose folder is full (premise 1) |
| `src/lib/server/root/watch/portfolio/portfolio.ts` | 879 | +3 -3 | no: type error (premise 2) |
| `tests/server/root/process/config-cache.test.ts` | 347 | +4 -4 | no: type error (premise 2) |
| `src/lib/data/index.ts` | unchanged | | the `HubSettings` doc is still true |
| `docs/diagrams/writes.dot`, `writes.svg` | unchanged | | `npm run diagrams` changed nothing |

Edits to existing test lines (`git diff tests/server/root/process/config-cache.test.ts`). None of them is an assertion, an allow list or a predicate:

| Line | Before | After |
| --- | --- | --- |
| 269 | `load: () => ({ config: { one: 1 }, findings: [finding], from: {} }),` | `load: () => ({ config: { one: 1 }, findings: [finding], from: {}, parses: {} }),` |
| 270 | `loadHub: () => ({ config: {}, findings: [], from: {} }),` | `loadHub: () => ({ config: {}, findings: [], from: {}, parses: {} }),` |
| 299 | `const load = vi.fn(() => ({ config: { one: 2 }, findings: [], from: {} }));` | `... from: {}, parses: {} }));` |
| 300 | `const loadHub = vi.fn(() => ({ config: { one: 3 }, findings: [], from: {} }));` | `... from: {}, parses: {} }));` |

Tests added or changed: none added. In the changed test file the change is the type-required field above. Those rows passed on the unchanged tree and their assertions are unchanged, so there is no failing line to quote.

## What was built

- `loadConfig` (`merge.ts`) takes `opts.parses` and returns `parses`. A per-call `ParseKeep { given, kept }` and `configSource(dir, name, instead, keep)` give each file a `ConfigSource { file, text, parse }`. The text is read from disk on every call; a parse is reused when `given[name].text` equals that text and made anew otherwise; either way the entry is stored in `kept` and the merge gets `structuredClone(entry.parsed)`. A file named by `instead` is parsed from the candidate text and never stored: the given entry for that name, if any, is carried. A throw from the read or the parse stores nothing. `readConfigFile` (`text.ts`) now takes the source and still applies `?? empty`, the map check and the shape check on every call. `readOptionsFolder` takes `sourceOf` in place of `instead`.
- `contextConfig` (`config-parse.ts`) holds `let parses` in its closure. `load` and `loadHub` both go through `parsed(options)`, which hands it in and keeps the result's.
- `tests/fixtures/hubs/engine-load.ts` computes `loadConfig(engineDir())` and `loadConfig(engineDir(), { hub: DEMO_HUB, parses })` at import and deep-freezes both. It exports `engineConfigCopy()`, `demoConfigCopy()` (a `structuredClone` of the config) and `engineParses()`. `write-fixture.ts` (`targetOver`, `warmConfig`, `deckTarget`, `insideHubTarget`), `deposit-world.ts` and `zenodo-world.ts` use them.
- `target(parent?)` and `configTarget(engine, settings, parent?)` take an optional parent; the defaults are unchanged. `labTarget` makes `scratchDir('oculus-lab-')` and puts the primary at `<it>/hub` and the lab at `<it>/lab` through `folderIn`, which asserts the path is inside before `mkdirSync`.

## Comments re-read (item 5 and `agents/spec.md:72`)

| Comment | State |
| --- | --- |
| `merge.ts` head comment | rewritten (paragraph on `parses` added) |
| `loadConfig` doc | rewritten (paragraph on `parses` added) |
| `ConfigOptions` doc | rewritten (`parses` described); the orphaned earlier doc block above it, which described only three options, removed |
| `text.ts` head comment | rewritten (where the text and parse come from) |
| `readConfigFile` doc | rewritten |
| `options-folder.ts` head comment | still true |
| `readOptionsFolder` doc | rewritten (`sourceOf`) |
| `config-cache.ts:2-4` | rewritten: "about 75 ms" became "200 to 290 ms" (case-run 11, no `parses`: 204 to 288 ms, then 207 to 265 ms), and the paragraph says the parse again reparses only the files whose text changed |
| `config-cache.ts:9`, `:22`, `:38` | still true |
| `config-parse.ts` head comment | rewritten (each load handed the last one's parses) |
| `HubSettings` doc (`src/lib/data/index.ts:611-616`) | still true |
| `write-fixture.ts` head comment | still true |
| `warmConfig` doc | rewritten |
| `configTarget` and `labTarget` docs | rewritten; `target` and `folderIn` docs new |
| `deposit-world.ts`, `zenodo-world.ts` head comments | still true |
| docs and README | `grep -rn 'loadConfig\|config cache\|parses every\|reparse' docs README.md` (excluding diagrams): no output |

The grep over changed names (`grep -rn '75 ms\|readConfigFile\|readOptionsFolder(\|warmConfig\b' src tests config docs README.md`) finds only the call sites updated here, the 20 test files that register `warmConfig` (unchanged, as the brief asks) and two `<title>` lines in `docs/diagrams/writes.svg` that name `readConfigFile`, which is still the name.

History-word grep over the added lines (`git diff -U0` plus the new file, `grep -i -E "before|used to|no longer|still|..."`): two hits, both about order inside the code and not about history: "asserted to be inside it before it is made" (`folderIn`) and "that load made before its first case" (`warmConfig`).

Grep before writing helpers: `grep -rn 'deepFreeze\|function freeze\|Object.freeze' src tests` found no deep-freeze helper (only shallow `Object.freeze` in `src/lib/ui/html/html.ts` and the app runner's constants), so `engine-load.ts` has its own `deepFreeze`.

## Judgment calls the brief left open (each reversible)

1. `engine-load.ts` is in `tests/fixtures/hubs/` (premise 1).
2. `configSource` and the `parses` types live in `merge.ts`, not `text.ts`. `text.ts` imports no `node:fs` and is imported by eleven modules outside `merge/`. I kept it free of disk reads. I did not check whether any of those modules reaches the client.
3. `ConfigParses` is not exported. `config-parse.ts` names it as `ReturnType<typeof loadConfig>['parses']`, so no export was added.
4. `portfolio.ts` hands `configPayload` the whole `loadConfig` result, and its unused `findings` binding is gone.
5. `warmConfig` is kept with its 17 callers, as the brief asks. Its body now takes a copy, because `engine-load.ts` loads at import (which `write-fixture.ts` triggers), so the hook no longer does a load of its own. Removing it would mean editing its callers (20 files register it), which are outside the write list.
6. The demo-hub load in `engine-load.ts` is made with the engine's `parses`. The case-run program (case 10) shows a hub load with `parses` equals one without.
7. The fixture copies only `config`, never the whole load, since every caller reads `.config`.
8. A newly parsed file keeps the raw parse and the merge receives a clone, so a first load pays one `structuredClone` per file. Its cost was not measured apart from the whole load.

## Visible changes

None in the product's views or files. The server answers the same `config`, `findings` and `from` (case-run program, `equalsPlain true` in every case). A parse after a config write is faster: 42 to 85 ms against 204 to 288 ms, measured by case-run 11 on `loadConfig` alone, not through the server. No look is owed.

## Limitations and sharp edges

- The server keeps the raw parses of every config file in `contextConfig`'s closure as well as the cached merged results. The extra memory is not measured.
- The rebuild's `loadConfig` (`portfolio.ts:642`) and the config writes (`config-place.ts:93,362`, `config-checks.ts`) still parse the whole folder on every call, as decision 2 asks. The config-value and undo/hub-settings rows that go through them take 0.4 to 3.8 s alone under load and timed out on the unchanged tree under parallel load (premise 3). They passed in the one run after the change. The step does not shorten them.
- Item 4's 300 ms bound holds only in quiet runs (see the first line).
- `zenodo.test.ts:428` makes a full load of its own (320 ms row). It is outside the write list and unchanged.
- `labTarget`'s two hub folders are now named `hub` and `lab` inside one `oculus-lab-*` folder, where before they were two separate scratch folders. No caller depends on the parent: `grep -n 'dirname(\|tmpdir()\|basename('` over the three caller files was checked by the brief, and all their rows pass in check 2.

## Case-run program, source and output

`.agents/scratch/yaml-count.mjs`:

```js
// Case-run helper: the yaml module as merge/text.ts sees it, with a count of `parse` calls.
import * as real from 'yaml';
export * from 'yaml';
export const count = { n: 0 };
export function parse(...args) {
    count.n++;
    return real.parse(...args);
}
```

`.agents/scratch/cases.mjs`, run from the worktree root as `TMPDIR=GIT_CEILING_DIRECTORIES=$PWD/.agents/scratch node .agents/scratch/cases.mjs`:

```js
import { registerHooks } from 'node:module';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const root = resolve('.');
const scratch = join(root, '.agents', 'scratch');
const wrapper = pathToFileURL(join(scratch, 'yaml-count.mjs')).href;
registerHooks({
    resolve(specifier, context, next) {
        const parent = context.parentURL ?? '';
        const own = parent.endsWith('/merge/text.ts') || parent.endsWith('/merge/merge.ts');
        if (specifier === 'yaml' && own) {
            return { url: wrapper, shortCircuit: true };
        }
        return next(specifier, context);
    }
});
const { count } = await import(wrapper);
const { loadConfig, droppedFile } = await import(
    pathToFileURL(join(root, 'src/lib/data/sources/config/merge/merge.ts')).href
);

const E = root;
const load = (engine, opts = {}) => {
    const before = count.n;
    const read = loadConfig(engine, opts);
    return { read, parsed: count.n - before };
};
const core = (r) => ({ config: r.config, findings: r.findings, from: r.from });
const same = (a, b) => isDeepStrictEqual(core(a), core(b));
const engineCopy = () => {
    const dir = mkdtempSync(join(scratch, 'engine-'));
    cpSync(join(E, 'config'), join(dir, 'config'), { recursive: true });
    return dir;
};
const deepFreeze = (value) => {
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
        Object.freeze(value);
        for (const one of Object.values(value)) deepFreeze(one);
    }
    return value;
};
const say = (name, result) => console.log(`${name}: ${JSON.stringify(result)}`);

// 1. Nothing changed between two calls.
{
    const a = load(E);
    const b = load(E, { parses: a.read.parses });
    const c = load(E);
    say('1 unchanged', {
        parsesReturned: a.read.parses !== undefined,
        keptEntries: a.read.parses === undefined ? 0 : Object.keys(a.read.parses).length,
        firstParsed: a.parsed,
        secondParsed: b.parsed,
        secondEqualsFirst: same(b.read, a.read),
        secondEqualsPlain: same(b.read, c.read)
    });
}

// 2. A file's text changes between two calls.
{
    const S = engineCopy();
    const file = join(S, 'config/defaults/behavior.yml');
    const a = load(S);
    writeFileSync(file, `${readFileSync(file, 'utf8')}zz_case_key: 2\n`);
    const b = load(S, { parses: a.read.parses });
    const plain = load(S);
    say('2 changed text', {
        parsed: b.parsed,
        value: b.read.config.zz_case_key,
        equalsPlain: same(b.read, plain.read)
    });
}

// 3. A file broken then fixed, and fixed then broken.
{
    const S = engineCopy();
    const file = join(S, 'config/defaults/behavior.yml');
    const good = readFileSync(file, 'utf8');
    const firstKey = Object.keys(loadConfig(E).config).find(
        (key) => loadConfig(E).from[key] === 'behavior.yml'
    );
    writeFileSync(file, 'stages: [\n');
    const broken = load(S);
    writeFileSync(file, good);
    const fixed = load(S, { parses: broken.read.parses });
    const fixedPlain = load(S);
    writeFileSync(file, 'stages: [\n');
    const again = load(S, { parses: fixed.read.parses });
    const againPlain = load(S);
    const doesNotParse = (r) => r.findings.filter((f) => f.file === file && f.key === '').length;
    say('3 broken then fixed', {
        key: firstKey,
        brokenDropped: droppedFile(broken.read.findings, 'behavior.yml'),
        fixedHasKey: firstKey in fixed.read.config,
        fixedFileFindings: doesNotParse(fixed.read),
        fixedEqualsPlain: same(fixed.read, fixedPlain.read)
    });
    say('3 fixed then broken', {
        againDropped: droppedFile(again.read.findings, 'behavior.yml'),
        againHasKey: firstKey in again.read.config,
        againFileFindings: doesNotParse(again.read),
        againEqualsPlain: same(again.read, againPlain.read)
    });
}

// 4. An empty defaults file and an empty options file, each read twice.
{
    const S = engineCopy();
    const defaults = join(S, 'config/defaults/zz-empty.yml');
    const options = join(S, 'config/options/zz-empty.yml');
    writeFileSync(defaults, '');
    writeFileSync(options, '');
    const a = load(S);
    const b = load(S, { parses: a.read.parses });
    const plain = load(S);
    const of = (r, file) => r.findings.filter((f) => f.file === file).map((f) => f.message);
    say('4 empty files', {
        firstDefaults: of(a.read, defaults),
        secondDefaults: of(b.read, defaults),
        firstOptions: of(a.read, options),
        secondOptions: of(b.read, options),
        secondEqualsPlain: same(b.read, plain.read)
    });
}

// 5. The same text in two engines.
{
    const S4 = engineCopy();
    const S5 = engineCopy();
    for (const S of [S4, S5]) {
        cpSync(join(S, 'config/defaults/behavior.yml'), join(S, 'config/defaults/zz-dup.yml'));
    }
    const a = load(S4);
    const b = load(S5, { parses: a.read.parses });
    const plain = load(S5);
    say('5 two engines', {
        findings: b.read.findings.length,
        secondParsed: b.parsed,
        namesFirst: JSON.stringify(core(b.read)).includes(S4),
        findingsNameSecond: b.read.findings.every((f) => f.file.startsWith(S5)),
        equalsPlain: same(b.read, plain.read)
    });
}

// 6. A call with `instead`, its parses passed to a plain call.
{
    const S = engineCopy();
    const text = `${readFileSync(join(S, 'config/defaults/behavior.yml'), 'utf8')}zz_candidate: 1\n`;
    const a = load(S, { instead: { name: 'defaults/behavior.yml', text, layer: 'engine' } });
    const b = load(S, { parses: a.read.parses });
    const plain = load(S);
    say('6 instead', {
        candidateSeen: a.read.config.zz_candidate,
        plainAfter: b.read.config.zz_candidate ?? null,
        equalsPlain: same(b.read, plain.read)
    });
}

// 7. A caller mutates a result; a workspace lays glyphs and agents.
{
    const a = load(E);
    a.read.config.feed_registries = ['leads', 'radar'];
    a.read.config.glyphs.refresh = 'MUT';
    a.read.config.options['behavior.yml'] = {};
    const b = load(E, { parses: a.read.parses });
    const plain = load(E);
    say('7 mutated result', {
        feedRegistries: b.read.config.feed_registries,
        refresh: b.read.config.glyphs.refresh,
        equalsPlain: same(b.read, plain.read)
    });
    const workspace = {
        file: join(scratch, 'ws.yml'),
        text: 'folders: []\nsettings:\n  glyphs: { refresh: "W" }\n  agents: { claude: { label: W } }\n'
    };
    const w = load(E, { workspace });
    const after = load(E, { parses: w.read.parses });
    say('7 workspace then none', {
        workspaceRefresh: w.read.config.glyphs.refresh,
        workspaceClaude: w.read.config.agents.claude.label,
        afterRefresh: after.read.config.glyphs.refresh,
        afterClaude: after.read.config.agents.claude.label,
        equalsPlain: same(after.read, plain.read)
    });
}

// 8. A frozen parses passed in.
{
    const a = load(E);
    const frozen = deepFreeze(a.read.parses);
    let threw = null;
    let b;
    try {
        b = load(E, { parses: frozen });
    } catch (error) {
        threw = String(error);
    }
    say('8 frozen', { threw, equalsPlain: b !== undefined && same(b.read, load(E).read) });
}

// 9. A YAML alias, read twice.
{
    const S = engineCopy();
    writeFileSync(
        join(S, 'config/defaults/zz-alias.yml'),
        'zz_alias_a: &x { k: 1 }\nzz_alias_b: *x\n'
    );
    let threw = null;
    let a;
    let b;
    try {
        a = load(S);
        b = load(S, { parses: a.read.parses });
    } catch (error) {
        threw = String(error);
    }
    const plain = load(S);
    say('9 alias', {
        threw,
        value: b?.read.config.zz_alias_b,
        equalsFirst: b !== undefined && same(b.read, a.read),
        equalsPlain: b !== undefined && same(b.read, plain.read)
    });
}

// 10. Two hubs, each with the engine parses.
{
    const hubs = ['one', 'two'].map((word) => {
        const dir = mkdtempSync(join(scratch, `hub-${word}-`));
        mkdirSync(join(dir, '.oculus'), { recursive: true });
        writeFileSync(join(dir, '.oculus', 'config.yml'), `wallpaper_dir: ${word}\n`);
        return dir;
    });
    const e = load(E);
    const [r1, r2] = hubs.map((hub) => load(E, { hub, parses: e.read.parses }));
    const [p1, p2] = hubs.map((hub) => load(E, { hub }));
    say('10 two hubs', {
        parsed: [r1.parsed, r2.parsed],
        values: [r1.read.config.wallpaper_dir, r2.read.config.wallpaper_dir],
        from: [r1.read.from.wallpaper_dir, r2.read.from.wallpaper_dir],
        equalsPlain: [same(r1.read, p1.read), same(r2.read, p2.read)]
    });
}

// 11. Timing: a load with no parses, and one with the parses of a load of the same folder.
{
    const kept = loadConfig(E).parses;
    const time = (opts) => {
        const runs = [];
        for (let i = 0; i < 7; i++) {
            const start = performance.now();
            loadConfig(E, opts);
            runs.push(performance.now() - start);
        }
        runs.sort((x, y) => x - y);
        return `${runs[0].toFixed(0)} to ${runs[6].toFixed(0)} ms, median ${runs[3].toFixed(0)}`;
    };
    say('11 timing', { noParses: time({}), withParses: time({ parses: kept }) });
}
```

On the unchanged tree the hook matched `merge/text.ts` alone (the first version of the program, identical except that the `resolve` hook tested `context.parentURL?.endsWith('/merge/text.ts')`), since `parse` was imported there. Output on the unchanged tree:

```
1 unchanged: {"parsesReturned":false,"keptEntries":0,"firstParsed":98,"secondParsed":98,"secondEqualsFirst":true,"secondEqualsPlain":true}
2 changed text: {"parsed":98,"value":2,"equalsPlain":true}
3 broken then fixed: {"key":"read_limits","brokenDropped":true,"fixedHasKey":true,"fixedFileFindings":0,"fixedEqualsPlain":true}
3 fixed then broken: {"againDropped":true,"againHasKey":false,"againFileFindings":1,"againEqualsPlain":true}
4 empty files: {"firstDefaults":[],"secondDefaults":[],"firstOptions":["is not a map of keys"],"secondOptions":["is not a map of keys"],"secondEqualsPlain":true}
5 two engines: {"findings":35,"secondParsed":99,"namesFirst":false,"findingsNameSecond":true,"equalsPlain":true}
6 instead: {"candidateSeen":1,"plainAfter":null,"equalsPlain":true}
7 mutated result: {"feedRegistries":[],"refresh":"(r)","equalsPlain":true}
7 workspace then none: {"workspaceRefresh":"W","workspaceClaude":"W","afterRefresh":"(r)","afterClaude":"Claude","equalsPlain":true}
8 frozen: {"threw":null,"equalsPlain":true}
9 alias: {"threw":null,"value":{"k":1},"equalsFirst":true,"equalsPlain":true}
10 two hubs: {"parsed":[98,98],"values":["one","two"],"from":[".oculus/config.yml",".oculus/config.yml"],"equalsPlain":[true,true]}
11 timing: {"noParses":"309 to 540 ms, median 354","withParses":"272 to 379 ms, median 316"}
```

Output after the last change:

```
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
11 timing: {"noParses":"207 to 265 ms, median 230","withParses":"78 to 85 ms, median 79"}
```

`.agents/scratch` (the program, its copies and `x`) was removed with `rm -rf .agents/scratch`; `ls -a .agents` then listed only `plan.yaml`. Nothing is left running.
