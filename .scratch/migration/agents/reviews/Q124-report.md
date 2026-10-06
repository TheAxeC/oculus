# Q124 report: every tree check runs under `npm run test:checks` with no time limit, and vitest runs started together no longer write a shared deps cache

Everything in the brief is done, with two findings the orchestrator should read first: (1) a different race that the rounds showed and the brief does not cover (`svelte-check` reads `.svelte-kit/types` while a vitest start rewrites it, section "Findings outside the brief"), unfixed; (2) one premise of the brief about `results.json` does not hold (section "Premises that did not hold").

## Open items of the state file, verbatim

- Z634 (2026-10-06), Q123, the words of a new guarded entry G52. Q123's brief check found that G51's words guard input reaching the program, while the alternate-screen test guards what the page shows (Z621): an editor drawn full screen after an attach, and the shell's text and cursor back when it exits. Guarded entries carry Axel's words, so the choice is his. (a) A new entry G52, recommended, proposed as: "G52. A page that attaches to a terminal pane whose program is in its alternate screen is given the shell's text in the grid's normal buffer and the program's screen in its alternate buffer, so the program draws full screen and leaving it shows the shell's text again with the cursor where the shell left it." Code: the pane's attach under `src/lib/server/machine/pty/`. Test: written by Q123. For: the behaviour Z621 asked for is guarded by a test whose failure costs a lost shell screen. Against: one more entry. (b) Widen G51's words to cover the alternate screen. For: one entry for the attach. Against: G51 then guards two different promises. (c) No guarded test; the behaviour is checked by a quoted run and the look only. Against: nothing stops a later change from dropping it; the lazy option. Q123 is built under (a); its landing waits for the ruling.

## The slow-tagged files under `tests/checks`

Command (run before the first change): `grep -rln "@module-tag slow\|tags: \['slow'\]" tests/checks` printed one file.

- `tests/checks/utils/claude-usage.test.ts` (tag at `:3`, "every case runs the command, which starts sh and python3"). Its three cases run `utils/claude-usage.sh` through `spawnSync('sh', ...)`, which starts python3: one case runs it three times (malformed input keeps the target, valid input replaces it), the other two once each (the complete status line, and the absent parts). It is the test of G27 (`agents/guarded.md:144`). After the change it runs under `npm run test:checks` with no limit; in the full `test:checks` run its three cases took 1078 ms, 350 ms and 340 ms (`c3.txt` lines 90, 93, 98 of the verbose run).

No other file under `tests/checks` carries the tag.

## The cases' first run, on the unchanged tree

Method: a driver script in my scratchpad (`rounds.mjs`) starts the pair at the same moment from `tools/oculus` of the worktree, each as its own process group, after resetting `node_modules/.vite` (empty: `rm -rf node_modules/.vite`; stale: `rm -rf` then `cp -cR /Users/axelfaes/workspace/research-hub/tools/oculus/node_modules/.vite node_modules/.vite`, read only on main). A run on the unchanged tree was stopped by the driver once the default reporter printed its first summary or failure line, which with the non-TTY reporter is at the end of the run; no run was stopped while it started. One round is one start of the pair (two commands). The driver's log keeps the first 200 characters of the first line that names ENOTEMPTY, ENOENT, EEXIST, EBUSY, EPERM, JSON, `results.json` or `deps___vitest`, so the ENOTEMPTY lines below end at that cut.

### Case 1, first run: `npm test` beside `npm run test:checks`, 5 rounds per starting state

- Empty cache, rounds 1, 2, 3, 5: both commands started. Round 4: `npm test` started; `npm run test:checks` exit 1, first error line `Error: ENOTEMPTY: directory not empty, rename '/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q124/tools/oculus/node_modules/.vite/vitest/0df9eea0bad5a55395db9ec290dfcf4a883d5d3e/deps___` (cut by the driver at 200 characters).
- Stale cache, rounds 1, 2, 5: both started. Round 3: `npm test` started; `npm run test:checks` exit 1, first error line `Error: ENOTEMPTY: directory not empty, rename '/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q124/tools/oculus/node_modules/.vite/vitest/0df9eea0bad5a55395db9ec290dfcf4a883d5d3e/deps___` (same cut). Round 4: both started; the driver stopped them at their first failed test line (`tests/server/machine/apps/manifest.test.ts` "a folder of 501 files" and `diagrams.test.ts` "are named stale, every one at once..." after 61659 ms, which is the 60_000 limit of the case), not on the cache.

### Case 1, first run: `npm run test:quick -- tests/tiers/run.mjs` beside `npm test`, 5 rounds per starting state

- Empty cache, rounds 1, 3, 4, 5: both started (quick exit 0). Round 2: quick started (exit 0); `npm test` started and was stopped by the driver at its first failed test line (`tests/routes/apps/approve.test.ts` timeout), not on the cache.
- Stale cache, rounds 1 to 5: both started, quick exit 0 each time.

Tally (from `grep -c 'first=.*\(ENOTEMPTY\|ENOENT\|EEXIST\)'` over the four case-1 logs): 2 cache failures in 20 pair starts, both in `npm run test:checks` of the `npm test` / `npm run test:checks` pair; 0 in the quick pair. The failure case 1 asks for reproduced in the first 5 rounds, so the count stayed at 5 and the stop rule did not apply. No case the brief's rules get wrong appeared in the first run.

### Case 7, first run: the four files on the unchanged tree

Command: `npx vitest run tests/checks/diagrams/diagrams.test.ts tests/checks/source/history.test.ts tests/checks/source/comment-width.test.ts tests/checks/utils/claude-usage.test.ts --testTimeout 0 --hookTimeout 0 --reporter=verbose`. Result: `Test Files  4 passed (4)`, `Tests  53 passed (53)`. The nine cases passed there (`c7-base.txt`):

- `diagrams.test.ts > the committed diagrams > are what the source gives now, each file byte for byte` 23341 ms
- `... > the committed diagrams > are named stale, every one at once, when an import and a publish are added` 21369 ms
- `... > where the words of an arrow land > reads a label node by the box Graphviz drew for it, the two halves through it its own` 5 ms
- `... > where the words of an arrow land > are clear of every other arrow in every drawing the source gives` 11 ms
- `... > the rendered drawing > has no colour of its own and nothing opaque behind it` 5 ms
- `... > the rendered drawing > carries the functions a write edge calls in the edge title, with no link around it` 5 ms
- `history.test.ts > no history in code > names no package id, date or session in any comment` 3987 ms
- `comment-width.test.ts > a comment line > ends by the hundredth column everywhere under src, tests and utils` 3956 ms
- `claude-usage.test.ts > claude-usage.sh > preserves an existing target on malformed stdin and replaces it on valid stdin` 1710 ms

Removing a limit preserves behaviour, so none of the nine has a failing line on the unchanged tree. The step adds no test and changes no assertion.

## DONE / NOT DONE

| Row | Command and output | State |
| --- | --- | --- |
| Nine per-case limits removed with their comments | `grep -rnE "\}, [0-9_]+\);\|timeout: *[0-9]\|\{ *timeout\|setConfig\|testTimeout\|hookTimeout" tests/checks` prints nothing (exit 1) | DONE |
| `test:checks` runs every tree check; `test:slow` excludes them | `grep -n '"test:checks"\|"test:slow"' package.json` prints `14:        "test:checks": "vitest run tests/checks --testTimeout 0 --hookTimeout 0",` and `18:        "test:slow": "vitest run --tagsFilter slow --exclude 'tests/checks/**' --testTimeout 20000",` | DONE |
| Case 1 on the unchanged tree | 2 ENOTEMPTY starts of 20 pair starts, quoted above | DONE |
| Case 2 after the change | 40 starts of the `npm test` / `npm run test:checks` pair and 20 starts of the quick / `npm test` pair; 0 cache errors, quoted below | DONE |
| Case 3, `npm run test:checks` | `NO_COLOR=1 npm run test:checks -- --reporter=verbose` exit 0, ` Test Files  16 passed (16)`, `      Tests  230 passed (230)`, `   Duration  47.96s`; the nine cases are lines 40, 53, 90, 123, 197, 236, 238, 239, 240 of the verbose output | DONE |
| Case 4 greps | quoted in the first two rows | DONE |
| Case 5, `npm test` | `Test Files  103 passed \| 17 skipped (120)`, `Tests  608 passed \| 72 skipped (680)`, exit 0 | DONE |
| Case 5, `npm run test:quick` | `test:quick: 22.2 s (limit 45.0 s); every command passed` (second run; the first run after the change took 82.2 s, over the limit, with cold eslint, svelte-check and module caches, and passed) | DONE |
| Case 6, ignored cache folder | The mechanism adds no folder; `ls node_modules/.vite/vitest/*` after all rounds lists only `_svelte_metadata.json` (and `results.json` in the root project's folder); `.gitignore:1` is `node_modules/` | DONE |
| Case 7 after the change | same command as above: `Test Files  4 passed (4)`, `Tests  53 passed (53)`, exit 0; the nine cases pass (`c7-after.txt` lines 4, 7, 8, 12, 13, 52, 54, 55, 56) | DONE |
| Comments and documents true | listed under "Comments and documents re-read" | DONE |
| `sh utils/unused-exports.sh` | `diff unused-before.txt unused-after.txt` differs only in the before run's `ERROR: Error loading vite.config.ts (File './.svelte-kit/tsconfig.json' not found.)`, its `ERROR: Please fix ...` line and `knip stopped with status 2` (the fresh worktree had no `.svelte-kit` yet); the 381 export lines are identical, so the step adds none | DONE |
| ASCII gate | the spec's `LC_ALL=C perl -ne ...` over `src tests bin config` prints nothing, exit 0; `LC_ALL=C grep -n '[^ -~]'` over the ten changed files prints nothing | DONE |
| History words and package ids in added comment lines | `diff <base> <file> \| grep '^>' \| grep -inE "before\|used to\|no longer\|still\|always\|as before\|previously\|the step adds\|after this\|Q[0-9]+\|[A-Z][0-9]{2}[a-z]?\b\|20[0-9]{2}"` over `landing.mjs`, `quick.mjs`, `vite.config.ts`, `README.md`, `HELP.md` prints nothing | DONE |
| Case-1 failure not reproduced as a test | no test added; no guarded entry asks for one | DONE |
| Race on `.svelte-kit/types` between a vitest start and `svelte-check` | observed in 1 of 10 runs of `test:quick` beside `npm test` after the change, 0 of 10 before; not fixed | NOT DONE (outside the brief, see below) |

### Case 2 rounds, after the change

Driver runs went to the end of every command (no early stop). Logs: `c2-*.log`, `c2b-*.log`.

- `npm test` beside `npm run test:checks`, empty cache, 10 rounds (5 + 5): every start printed "started" (no cache error); all 20 starts exit 0.
- Same pair, stale cache, 10 rounds (5 + 5): every start "started"; 18 of 20 exit 0. `npm test` exit 1 in `c2-tests-stale` round 1 (the failing test name was not captured in that run) and in `c2b-tests-stale` round 2, where `tests/routes/edit/roots.test.ts > appends the folder as an entry under a key made from its name, keeping every other line` and `tests/server/edit/config-value.test.ts > refuses local.yml before any file is read` each failed with `Error: Test timed out in 5000ms.` Not the cache.
- `npm run test:quick -- tests/tiers/run.mjs` beside `npm test`, empty cache, 5 rounds: every start "started"; `npm test` exit 0 five times; quick exit 0 four times and exit 1 once (round 3, `FAILED  svelte-check`, five errors `Cannot find module './$types'` in `src/routes/+page.svelte`, `+page.server.ts`, `+page.ts`; see "Findings outside the brief").
- Same pair, stale cache, 5 rounds: every start "started"; quick exit 0 five times; `npm test` exit 1 once (round 2: `tests/server/machine/schedules/watch.test.ts > starts a schedule once per due time`, `tests/server/machine/apps/manifest.test.ts > a folder of 501 files, and one of more than 20 MB` and `tests/routes/edit/undo/undo.test.ts > taking a change back > takes an added Lit Watch entry out again` each `Error: Test timed out in 5000ms.`; those are test-of-their-own timeouts under load, the same kind the unchanged tree showed in case 1).
- Total after the change: `grep -c 'first=.*\(ENOTEMPTY\|ENOENT\|EEXIST\)'` over `c2-*.log` and `c2b-*.log` prints 0 for every file (60 starts). Case 1 ended on 5 rounds per state; after the change I ran 10 rounds per state for the `npm test` pair and 5 for the quick pair.
- `ls node_modules/.vite/vitest/*` after the rounds: three folders, each holding `_svelte_metadata.json`, one also `results.json`; no `deps___vitest__` and no `_temp_` folder.

## The mechanism that ends the race

Versions: vitest 4.1.11 (`node_modules/vitest/package.json:4`), vite 8.3.0 (`node_modules/vite/package.json:3`), @sveltejs/vite-plugin-svelte 7.3.0 (`package.json:3`).

Cause, read from the source:

- Vitest puts each project's cache at `<cacheDir>/vitest/<sha1 of the project name>` (`vitest/dist/chunks/cli-api.CnMVyzaz.js:608` and `:10092`), so `npm test`, `npm run test:checks` and `test:quick` all use the folders of the projects `unit` and `client`.
- Vitest gives its own Vite environment the name `__vitest__` (`cli-api.CnMVyzaz.js:10380`), and its `configEnvironment` hook returns at once for that name (`:10235`), so the environment keeps the `optimizeDeps` the user's plugins gave it.
- The Svelte plugin gives every server environment `optimizeDeps.include = [...SVELTE_IMPORTS]` (`@sveltejs/vite-plugin-svelte/src/plugins/setup-optimizer.js:34-52`), so Vite builds an optimized-deps folder for `__vitest__` named `<cacheDir>/deps` + `_` + `__vitest__` (`vite/dist/node/chunks/node.js:28182-28192`, matching the observed `deps___vitest__`).
- Vite builds it in a folder `deps___vitest___temp_<hash of pid, time, random>` (`node.js:28185-28187`) and commits it with `fs.renameSync(depsCacheDir, temporaryPath)` then `fs.renameSync(processingCacheDir, depsCacheDir)` (`node.js:27971`, `:27974`). The second rename fails with `ENOTEMPTY` when another process has just put its own `deps___vitest__` in place, which is the error of the two landing runs and of rounds 4 and 3 of case 1.
- A stale cloned cache (`getConfigHash` hashes the config's `root`, `node.js:28401`) makes every first start remove the folder and rebuild it (`node.js:27883-27884`), which widens the window.

Fix, in `vite.config.ts` (the plugin `noVitestDepsCache`): a `configEnvironment` hook ordered `post`, so it runs after the Svelte plugin's hook, that for the environment named `__vitest__` sets `optimizeDeps.noDiscovery = true` and `optimizeDeps.include = []`. Vite treats that pair as optimizer disabled (`isDepOptimizationDisabled`, `node.js:27803-27804`) and creates no optimizer for the environment (`node.js:36341`), so nothing is built, renamed or left behind. Vite applies the hook's mutation to the environment's options (`runConfigEnvironmentHook`, `node.js:37538-37551`). `package.json` is untouched for this part: the mechanism is in the config, so `npm test`, `npm run test:checks`, `npm run test:quick`, `npm run test:slow` and a person's own `npx vitest` get it alike.

How it meets each constraint of item 2:

- The dev server's cache is untouched: the hook returns for every name except `__vitest__`, an environment the dev server does not have. Proof: a script that calls vite's `resolveConfig` for `serve` prints `cacheDir ./node_modules/.vite`, `client noDiscovery false include 18` and `ssr noDiscovery true include 20`, with no `__vitest__` environment; the top-level `cacheDir` is not set in `vite.config.ts`.
- The results cache (`results.json`) needs no mechanism: it is written whole with one `writeFile` (`cli-api.CnMVyzaz.js:591`) and its reader is called inside `try { await this.cache.results.readFromCache(); } catch {}` (`:13214-13216`), so a torn or missing file never fails a start; it is only an ordering hint for the sequencer (`coverage.DM_a_rWm.js:61-62`). This differs from the brief's premise (see below). Over the 60 starts after the change no round failed on it.
- `npm run test:quick` beside `npm test` is covered: the 10 rounds above, 0 cache errors. Its module cache `node_modules/.experimental-vitest-cache` is written with a temporary file and a rename (`cli-api.CnMVyzaz.js:825-843`), so a reader sees whole files.
- A cache left by a killed run: no `deps___vitest__` and no `_temp_` folder is ever created now. The driver stopped runs with SIGTERM by process group in case 1; after the final rounds `ls node_modules/.vite/vitest/*` shows no `_temp_` folder. The folders an older run left (`deps___vitest__`, a `_temp_` folder) are no longer read; Vite removes `_temp_` folders older than a day (`node.js:28473-28490`).
- Per-process folders: none are used, so nothing piles up and nothing is cleared.
- The change holds wherever the runs start: it is in `vite.config.ts`, read by every vitest start in `landing.mjs`, in `quick.mjs` and in a person's shell. Cases 1 and 2 start the pair from a shell, not from `landing.mjs`.
- Not a retry, a sleep, a stagger, a serial order, an environment variable or a hidden error: no start is delayed or repeated and nothing is caught.

Behaviour of the tests under the change: `npm test` (`608 passed | 72 skipped`) and `npm run test:checks` (`230 passed`) pass with the optimizer off for `__vitest__`; the unit count before the change on the same tree was not taken, so a count comparison is not made.

## Comments and documents re-read

| File and place | State |
| --- | --- |
| `vite.config.ts:1-6` head comment | rewritten (says how vitest runs share `node_modules/.vite` and what the config does) |
| `vite.config.ts` `noVitestDepsCache` doc comment | new, says what it does and why |
| `vite.config.ts:57-63` comment on the tag | rewritten (npm test leaves tagged tests out, `test:slow` runs them, `tests/checks` runs by `test:checks`) |
| `vite.config.ts` tag description | rewritten: `Left out of npm test; npm run test:slow runs it, except under tests/checks.` |
| `tests/tiers/landing.mjs:9-14` and the list paragraph | rewritten (how the three vitest runs share or do not share the cache; the tree checks include the slow-tagged ones) |
| `tests/tiers/quick.mjs:1-27` head comment | rewritten at the "kept on disk" bullet (where the module cache is and why a parallel `npm test` reads whole files); the rest still true |
| `tests/tiers/quick.mjs:122` (`isUnitTest`) | still true |
| `tests/tiers/quick.mjs:127` (`isSlow`) | rewritten ("which npm test leaves out and test:slow runs") |
| `tests/tiers/quick.mjs:251-254` | the line printed for a changed file the run leaves out now names `npm run test:checks` for a tree check and `npm run test:slow` for a slow unit file instead of "test:checks or test:slow" |
| `tests/tiers/run.mjs` | still true (no comment names the cache; file unchanged) |
| `README.md:17` | rewritten (`test:checks` runs every tree check, the slow-tagged ones included; `test:slow` runs the slow tests outside `tests/checks`) |
| `HELP.md:371` (`npm test`) | still true |
| `HELP.md:372-373` | rewritten, same wording as `README.md:17` |
| `DESIGN.md:354` | still true |
| `tests/tiers/essential.txt:9` | still true |

## Files changed (`diff -rq` against the base copy, then `wc -l`)

| Path | Lines before to after | In the write list |
| --- | --- | --- |
| `tests/checks/diagrams/diagrams.test.ts` | 856 to 856 | yes |
| `tests/checks/source/history.test.ts` | 170 to 169 | yes |
| `tests/checks/source/comment-width.test.ts` | 84 to 79 | yes |
| `tests/checks/utils/claude-usage.test.ts` | 85 to 80 | yes |
| `tests/tiers/landing.mjs` | 54 to 61 | yes |
| `tests/tiers/quick.mjs` | 285 to 287 | yes |
| `package.json` | scripts `test:checks`, `test:slow` only | yes |
| `vite.config.ts` | 72 to 104 | yes |
| `README.md` | line 17 only | yes |
| `HELP.md` | lines 372-373 only | yes |

`tests/tiers/run.mjs`, `.gitignore` and the other write-list paths are unchanged. Edits to existing tests, one row per changed line (no assertion, allow list or predicate changed):

| File:line (base) | Before | After |
| --- | --- | --- |
| `diagrams.test.ts:85, :111, :826` | `}, 60_000);` | `});` |
| `diagrams.test.ts:809, :838, :855` | `}, 30_000);` | `});` |
| `history.test.ts:128` | comment "Every file under the four roots is parsed, which takes longer than a case's default limit." | removed |
| `history.test.ts:129` | `it('names no package id, date or session in any comment', { timeout: 30000 }, () => {` | `it('names no package id, date or session in any comment', () => {` |
| `comment-width.test.ts:55` | comment "Every file under the three roots is parsed, which takes longer than a case's default limit." | removed |
| `comment-width.test.ts:56-58, :70` | `it(` over three lines with `{ timeout: 30000 },` and the callback indented one level deeper | `it('ends by the hundredth column ...', () => {` on one line, body re-indented by Prettier |
| `claude-usage.test.ts:16` | comment "Three sh + python3 spawns; under a loaded full run they pass 5 s, so the case gets 20 s." | removed |
| `claude-usage.test.ts:17-19, :41-44` | `it(` over three lines with `{ timeout: 20000 },` | `it('preserves an existing target ...', () => {` on one line, body re-indented by Prettier |

The `@module-tag slow` at `claude-usage.test.ts:3` stays.

## Judgment calls

1. The slow-tagged tree check joins `npm run test:checks` by dropping its `--tagsFilter '!slow'` (the brief's decision), and `test:slow` gains `--exclude 'tests/checks/**'`. The rewritten tag description says "except under tests/checks"; if the orchestrator wants the original sentence, it is one line in `vite.config.ts`.
2. I kept the results cache (no `test.cache: false`), because the reader is guarded and the file is only an ordering hint; `cache: false` would also stop vitest from running the failed and the longest files first, which `test:quick`'s 45 s limit and the landing's wall time both gain from. Reversible: add `cache: false` to the `test` block.
3. The mechanism is a plugin inside `vite.config.ts`, not a separate file, since it is eleven lines and `vite.config.ts` is 104 lines. Reversible: move it to `src/lib/server/root/`.
4. `quick.mjs:251-254` now names the command that runs a left-out file. This is a visible wording change of one line `npm run test:quick` prints, from "run by npm run test:checks or test:slow" to "run by npm run test:checks" or "run by npm run test:slow".
5. The brief says the step runs `npm run test:quick` with its lines quoted: given the first run after the change took 82.2 s (limit 45 s: cold eslint, svelte-check and module caches after `vite.config.ts` changed), I quoted the second, warm run (22.2 s) as the pass and name the first.

## Premises that did not hold

- The brief says the results cache "is parsed with no guard at the next start (`:546-550`)". The function is unguarded, but its one caller wraps it in `try { await this.cache.results.readFromCache(); } catch {}` (`vitest/dist/chunks/cli-api.CnMVyzaz.js:13214-13216`), so a torn `results.json` cannot fail a start. Evidence: that source and 60 starts after the change with 0 results-cache errors; the unchanged tree showed 0 `results.json` errors in 40 starts.
- The brief says the ninth limit sits in a file `test:checks` leaves out; true before the change, and the change moves that file into `test:checks` as the brief decides.
- `spec.md:56` is false after this step (the orchestrator rewrites it at landing, as the brief says).

## Findings outside the brief

- Race between a vitest start and `svelte-check`: every vitest start of this config runs SvelteKit's `sync.all` (`@sveltejs/kit/src/exports/vite/index.js:449` / `:744`), which rewrites `.svelte-kit/types/**/$types.d.ts` with `fs.writeFileSync` (`core/sync/write_types/index.js:359`) and, for routes that no longer exist, removes files (`:52`, `:369`). `svelte-check` reading a `$types.d.ts` while that write truncates it reports `Cannot find module './$types'`. Observed once, in 10 runs of quick beside `npm test` after the change: `c2-quick-empty` round 3, `FAILED  svelte-check`, five errors in `src/routes/+page.svelte`, `+page.server.ts` and `+page.ts` (full output kept in the scratchpad `c2-quick-empty-npm_run_test_quick-*.out`); 0 of 10 quick-pair starts on the unchanged tree. It can reach the landing's `npm run check` (lane 3) and `npm run test:quick` whenever a vitest run starts beside them. It is a different folder (`.svelte-kit`) and a different reader from the deps cache the brief names, and the writer is SvelteKit's own plugin, so I did not change it; the fix would be a change to when SvelteKit's sync runs (not an option of vitest or vite that I found), and a retry or a stagger is excluded by the brief. Unfixed and unmeasured beyond the one observation: the orchestrator rules on whether it becomes a step.
- Under simultaneous load `npm test` shows 5000 ms test timeouts in files of its own (`manifest.test.ts`, `undo.test.ts`, `watch.test.ts`, `approve.test.ts`, `roots.test.ts`, `config-value.test.ts`), both before and after the change; the step does not touch them and I did not investigate them.
- `npm run diagrams` was run once before the verify list as the spec says; the committed diagrams already matched (the case `are what the source gives now, each file byte for byte` passed before it ran), so it rewrote identical bytes.

## Host- or user-visible changes

| What | Before | After |
| --- | --- | --- |
| `npm run test:checks` | leaves tests tagged slow out; the nine per-case limits cut a case that takes longer (`diagrams.test.ts` "are named stale, every one at once..." failed at 61659 ms under load in case 1) | runs all 16 tree-check files including `claude-usage.test.ts`, with no per-case limit |
| `npm run test:slow` | also selects slow-tagged files under `tests/checks` (one: `claude-usage.test.ts`, under a 20 s limit) | excludes `tests/checks/**` |
| `node_modules/.vite/vitest/<hash>/deps___vitest__` | built by every vitest start | not built; existing ones are no longer read |
| `npm run test:quick` line for a changed left-out file | "changed, run by npm run test:checks or test:slow" | "changed, run by npm run test:checks" (tree check) or "run by npm run test:slow" (slow unit file) |

## Standards pages and prose

`.agents/plan.yaml:8` has `standards: []`, so there are no standards pages to read the new sentences against; I read them against `spec.md` and the hub's prose rules (plain, ASCII, no em dash, no quip, no history words). The longest new sentences are the `landing.mjs` comment sentence beginning "They share no folder that two of them write" (about 50 words) and the `noVitestDepsCache` doc comment's first sentence (about 40 words); each carries a cause and its effect and I left them in one sentence each rather than split them into fragments.
