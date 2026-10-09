Everything in the brief is done.

## Open items of the state file (copied from `orchestrator-state.md`, "Open items")

- Open item 33 (2026-10-09, the queue): Q72, the architecture re-read, is queued to wait for D49, D55 and D56, an order the orchestrator set and Axel has not ruled; Axel unpaused Q72. Options: (a), recommended: keep the wait, so the re-read covers the code D49, D55 and D56 change before O33 opens the repository; (b) start Q72 now, which leaves those three steps' code unread by it. R2 stays before Q72, in the order `queue.md` gives.

## What this report does not cover

- Electron was never started (spec: a builder runs no page). The code of `src/desktop/main.ts` and `src/desktop/app.ts` is shown by `svelte-check` (0 errors), by reading, and by the `machineFacts`/`machineLacks` runs for the environments; the dialogs themselves are seen at the look on landing (section "Host- and user-visible changes"). G48's test (`tests/server/desktop/start.test.ts`, slow, starts Electron) is not run by me; it runs at landing in `npm run test:slow`.
- `npm test`, `npm run test:landing` and `utils/scratch-count.sh` are not run, as the brief says.
- `npm run test:quick` finished in 51.4 s with the 27 paths I gave it (limit 45.0 s; every command passed). I gave it every changed source and test path, so more dependent tests than a default run were selected.

## Rulings that applied (R2-cases.md)

- A. No flag `--port` exists on the built server. Every run that listens used a scratch engine whose `config/local.yml` carries `port: 8811`, or `--default-port 8811` for an engine with no `local.yml`. 8811 was free before and after every run (`lsof -iTCP:8811 -sTCP:LISTEN` printed nothing).
- B. `src/lib/data/places/` holds `engine-dir.ts` and `hub-address.ts` (moved from `src/lib/data/hub-address.ts`, content unchanged: `diff` of the two files prints nothing). `src/lib/data/` is back at ten items (`sh utils/folder-check.sh` exit 0).

## The cases' first run, by the earlier builder (copied from its file; not rerun)

One run of that builder bound for port 8790 (a scratch engine `local.yml` with no `port:` key) and was refused: `oculus: port 8790 is in use`, exit 1. Its table, on the unchanged tree:

| Case | Command or reading | Result as printed |
|---|---|---|
| 1 (Node versions) | `node src/lib/server/root/process/start/first-run.ts` | The module does not exist: `node:internal/modules/cjs/loader ... throw err` |
| 2 (no hidden lockfile) | same; also the rule on `$TMPDIR/r2/nonm` (src, config, package files, no `node_modules`) | No module. By the rule: no `node_modules/.package-lock.json`, so one lack, as the brief says |
| 3 (one entry missing or at another version) | same; the rule probe `$TMPDIR/r2/probe/rule.mjs` | No module. The rule gives `wanted N missing M differ D`; counts verified on the worktree under case 5 |
| 4 (optional entries only) | same; the rule counts `optional` entries apart | No module. The rule excludes `optional: true`; the worktree has `optional 132` and 0 missing |
| 5 (worktree as installed) | `node $TMPDIR/r2/probe/rule.mjs $PWD` (Decisions 2 rule) | `wanted 543 missing 0 differ 0 optional 132`. Holds: no lack. The lockfile has 0 `link`/`inBundle`/`extraneous` entries, and 0 non-optional entries with `os`/`cpu` |
| 6 (no `node_modules`) | `node src/server.ts --default-port 8811` over `$TMPDIR/r2/nonm` | Node's own error, exit 1: `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'zod' imported from .../src/lib/data/snapshot/normalise.ts`, as the brief states. With `--port 8811` it is `oculus: unknown argument: --port` (Finding A). No port opened (`lsof -iTCP:8811 -sTCP:LISTEN` prints nothing) |
| 7 (no `build/handler.js`) | `node src/server.ts --engine $TMPDIR/r2/scratch-engine --default-port 8811` before the build | `oculus: the server handler .../build/handler.js could not be loaded: Cannot find module '.../build/handler.js' imported from .../src/server.ts`, exit 1: Node's text, no `npm run build`. With `--handler $TMPDIR/r2/nothere.js`: `oculus: .../nothere.js is no file, so there is no handler to load`, exit 1 (the `args.ts` refusal as the brief says) |
| 8 (hub missing / a file / default) | scratch engine `local.yml` `hub: $TMPDIR/r2/nothere`, `port: 8811`; then `hub: $TMPDIR/r2/hubfile`; after `npm run build` | Both start and listen: `oculus on http://127.0.0.1:8811 over hub .../r2/nothere` and `.../r2/hubfile`. No lack today, as the brief premises. Default-hub case: `localDefaults` gives `resolve(engine,'..','..')` (`local.ts:201`), as the brief says; `hub: ~/x` becomes `<engine>/~/x` (`local.ts:462`) |
| 9 (PATH holds none of the 4 programs) | `PATH=/var/empty`, `--engine` scratch, port 8811 in `local.yml` | Starts silently: `hpc publish: unreachable`, `calendar publish: unconfigured`, `mail publish: unconfigured`, `oculus on http://127.0.0.1:8811 over hub ...`; I ended the process myself (`end-status=0`) |
| 10 (`claude_bin`) | Reading `git-message.ts:18` and `:93-96` | `CLAUDE = 'claude'` is the literal and `execFile(CLAUDE, ...)` runs it; `claude_bin` is never consulted for the commit message. `suggestFor` (`git-routes.ts:298`) passes `messageModel(config)` only. Held as the brief says |
| 11 (git only at `/usr/bin/git`, `xcode-select -p` failing) | module absent | Not runnable on the unchanged tree |
| 12 (everything present) | `npm run build` (exit 0, 35 s), then the scratch engine with `hub` and `port: 8811`, port 8811 free before and after | Today's start output: `hpc publish: unreachable` / `calendar publish: unconfigured` / `mail publish: unconfigured` / `oculus on http://127.0.0.1:8811 over hub .../r2/hub`. That is the baseline. Ended by the run itself; `lsof` prints nothing afterwards |
| 13 (`npm run predev` / `preapp` / `prepreview`) | over `$TMPDIR/r2/nonm` | `npm error Missing script: "predev"` (and `"preapp"`, `"prepreview"`), exit 1 each |
| 14 (`npm ci --dry-run`, scratch copy of `package.json`, `package-lock.json`) | Node 23.11.0 (npm 10.9.2) and Node 24.21.0 (npm 11.19.0) | Neither refuses (no `engines` yet): "added 675 packages" under Node 23 and "added 557 packages" under Node 24, exit 0 |
| 15 (app with a missing package; hub missing) | Reading `main.ts:6-7`, `app.ts:18-19` | `main.ts` imports `config.ts` (via `DEFAULT_PORT`) and `app.ts` statically, so a missing package ends in Node's error. `app.ts:307-334` has no hub or program check, as the brief says |
| 16 (packaged app, login-shell PATH) | Reading `app.ts:312-318` and `:319` | The server gets `{ ...process.env, ...login }`. There is no check yet, so the shape of case 16 is to be shown through `machineLacks` with two environments |
| 17 (two optional lacks, slow login shell) | Reading `app.ts:319-334` | Only the `env_slow` sheet exists (`Continue` / `Quit`, `window: first.win`) |

## DONE / NOT DONE

Every command ran from `tools/oculus` in the worktree with `HOME` under `$TMPDIR` and Node 24.21.0 first on PATH.

| Row | Proof | Result as printed |
|---|---|---|
| Item 1, `engineDir` loadable without packages | `src/lib/data/places/engine-dir.ts` imports `node:fs`, `node:path`, `node:url` only; `config.ts:15` is `export { engineDir } from '../places/engine-dir.ts';` | `npm run test:quick`: `ok svelte-check ... 0 ERRORS 0 WARNINGS` |
| Item 2, `first-run.ts` with `installLacks`, `machineFacts`, `machineLacks`, run as a program | cases 1 to 5, 8 to 13 below; `args.ts` and `port.ts` moved to `start/` with only `port.ts:8`'s relative import changed (`diff` against the base copy) | see cases |
| Item 3, `src/server.ts` | cases 6, 7, 8, 9, 12 | see cases |
| Item 4, the three `pre*` scripts | case 13 | exit 1 each |
| Item 5, `main.ts` and `app.ts` | cases 15 to 17 by reading and by `machineFacts`/`machineLacks` | see cases |
| Item 6, `engines`, lockfile root entry, `.npmrc` | case 14; `diff` of the lockfile against the main checkout's copy prints only the four added lines of `"engines": { "node": ">=24", "npm": ">=11" }` in `packages[""]` | see case 14 |
| Item 7, commit messages run `claude_bin` | case 10c; `git-message.ts:58,87,96`, `git-routes.ts:195,305,312,451`, `src/routes/api/(git)/git/+server.ts:22` | `10c suggestMessage outcome: {"ok":true,"output":"stub message","error":""}` |
| Item 8, text and pages | catalog keys read by `tests/checks/source/keys.test.ts` (passes); `README.md` lines 5, 11, 13; `DESIGN.md:511`; `docs/configuration.md:37` | `npx vitest run tests/checks/source tests/checks/tree tests/checks/imports tests/checks/diagrams --testTimeout 0 --hookTimeout 0`: `Test Files 11 passed (11)`, `Tests 146 passed (146)` |
| Verify 1, `npm run diagrams` then `npm run test:quick` | both run after the last code change | `test:quick: 51.4 s (limit 45.0 s); every command passed`, `ok ASCII gate (0.6 s)`, `ok svelte-check (35.3 s): 1791578586689 COMPLETED 451 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok eslint (37.7 s)`, `ok vitest (50.9 s)`, `ok prettier (0.8 s)` |
| Verify 2, vitest set | `npx vitest run tests/server/root/first-run.test.ts tests/checks/source/keys.test.ts tests/checks/tree tests/routes/git/git.test.ts tests/routes/git/untracked.test.ts --reporter=dot` (run before the last refactor) and the `tests/checks` run above after it | `Test Files 7 passed (7) Tests 63 passed (63)`; after the last change `Test Files 11 passed (11)`, and `tests/server/root/first-run.test.ts` inside `test:quick`'s vitest passed |
| Verify 3, folder check, sizes, unused exports | `sh utils/folder-check.sh; echo $?` | `0`; largest changed file `src/lib/state/boards/collection.ts` 776 lines (only its import line changed); `first-run.ts` 236; no changed `.svelte` file. Unused exports below |
| Verify 4, G73's test on the unchanged tree and after | on a scratch copy of the base tree (`R2-base` plus the test file) | before: `Error: Cannot find module '../../../src/lib/data/places/engine-dir.ts' imported from .../tests/server/root/first-run.test.ts` and `Test Files 1 failed (1) Tests no tests`; after: `Test Files 1 passed (1) Tests 10 passed (10)` |
| ASCII gate (spec's perl form over `src tests config`) | `LC_ALL=C perl -ne '...' $(find src tests config -type f ! -name local.yml)` (`bin` does not exist in this tree, so it is left out) | prints nothing; `LC_ALL=C grep -c '[^ -~]'` over `README.md DESIGN.md docs/configuration.md package.json .npmrc` prints `0` for each |

### The cases

All case runs below were made over scratch copies under `$TMPDIR` (a copy of `src`, `config` without `local.yml`, `package.json`, `package-lock.json`, `.npmrc`), after the last code change. `full` has `node_modules` and `build` linked to the worktree's; `nonm` has neither.

1. Version rule, test rows 'Node 24.21.0 is no lack', 'Node 22.12.0 is one lack naming Node 24 and nvm install 24', 'the pre-release 25.0.0-nightly20260101abc is read by its major 25'. `npx vitest run tests/server/root/first-run.test.ts`: `Tests 10 passed (10)`.
2. Row 'no node_modules/.package-lock.json is one lack naming npm ci and the checkout': passes. Run: `cd nonm; npm run predev` prints `oculus: The packages are not installed in /private/var/folders/.../r2b/nonm. Run npm ci in /private/var/folders/.../r2b/nonm.`
3. Rows 'a hidden lockfile missing one required entry is one lack naming the count 1' and 'a hidden lockfile with one entry at another version is one lack naming the count 1': pass (the sentence holds `version: 1)`).
4. Row 'a hidden lockfile lacking only the optional entries is no lack': passes.
5. `node r2b-tools/c5.mjs` (prints `installLacks('<worktree>/tools/oculus', '24.21.0')`): `[]`.
6. `cd nonm; node src/server.ts --default-port 8811`: `oculus: The packages are not installed in /private/var/folders/7r/.../T/r2b/nonm. Run npm ci in /private/var/folders/7r/.../T/r2b/nonm.`, `exit=1`; no Node "Cannot find package" text; `lsof -iTCP:8811 -sTCP:LISTEN` prints nothing before and after.
7. `cd full` (no `build/`): `oculus: the server handler .../r2b/full/build/handler.js does not exist; run npm run build in .../r2b/full to make it`, `exit=1`. With `--handler .../r2b/nothere.js`: `oculus: /var/folders/.../r2b/nothere.js is no file, so there is no handler to load`, `exit=1` (the `args.ts` refusal).
8. Rows 'a hub that is no folder is one lack naming the path and the local.yml key', 'a hub that is a file ...' and 'no local.yml and the default hub two folders above the engine is no lack': pass. Run with `local.yml` `hub: .../r2b/nothere` and `hub: .../r2b/hubfile`, `port: 8811`: `oculus: .../r2b/nothere is not a folder, so there is no research hub to read. Set hub in /private/var/folders/.../r2b/full/config/local.yml to the folder of the research hub.`, `exit=1`, and the same with `hubfile`; the handler (present as `build/`) was not loaded. No `local.yml`: `node src/lib/server/root/process/start/first-run.ts` prints nothing, `exit=0`.
9. `node runserver.mjs full /var/empty` (PATH holds nothing; a harness that starts `node src/server.ts` with that PATH and ends it after `oculus on`): four lines on standard error, then the start goes on:
   - `oculus: git was not found, so Source Control and History do not work. Run xcode-select --install.`
   - `oculus: tmux was not found, so the terminals and their sessions do not work. Run brew install tmux.`
   - `oculus: perl was not found, so the line counts of the Status view do not work. Perl comes with the macOS Command Line Tools; run xcode-select --install.`
   - `oculus: claude was not found, so the chat terminals, the worktree agents, the usage refresh, the schedules and tasks, and the suggested commit messages do not work. Install the Claude CLI from https://code.claude.com/docs/en/setup, or set claude_bin in .../r2b/full/config/local.yml to its path.`
   - then `out: oculus on http://127.0.0.1:8811 over hub .../r2b/hub`, `exit code=0 signal=null endedByRun=true`; 8811 free afterwards. (The other `err:` lines in that run are config and watcher notes of the empty scratch hub and `HOME`.)
10. `claude_bin` (run through `machineLacks` with an environment whose PATH holds `git`, `tmux` and `perl` stubs): `10a claude_bin absolute path outside PATH: []`; `10b claude_bin name not on PATH: [["claude",false]]` with the sentence `claude-elsewhere was not found, so the chat terminals, ... do not work. Install the Claude CLI from https://code.claude.com/docs/en/setup, or set claude_bin in .../config/local.yml to its path.` `10c`: `suggestMessage(..., claudeBin = <recording stub outside PATH>, { diff: stub })` returned `{"ok":true,"output":"stub message","error":""}`; the stub recorded the arguments `-p write a message` and the diff `diff --git a b` on standard input.
11. `machineLacks` with `platform: 'darwin'`, `PATH=/usr/bin` (`/usr/bin/git` exists here), injected runner returning 1: the runner was called with `xcode-select -p`, and the lacks of kind `git` are `[["git",false]]` with `git is the macOS stub at /usr/bin/git and the Command Line Tools are not installed, so Source Control and History do not work. Run xcode-select --install.` With the runner returning 0: `[]`.
12. Everything present: `cd full; node src/lib/server/root/process/start/first-run.ts` prints nothing, `exit=0`; `npm run predev` over `full` exits 0. `npm run build` ran in the worktree first (`build exit=0`). The start output of `node src/server.ts` over the scratch engine (hub `.../r2b/hub`, `port: 8811`), changed tree against a copy of the base tree with the same `local.yml`, `HOME` and `build/` (engine paths normalised): `IDENTICAL to base start output`, 22 lines, ending `out: hpc publish: unreachable`, `out: calendar publish: unconfigured`, `out: mail publish: unconfigured`, `out: oculus on http://127.0.0.1:8811 over hub .../r2b/hub`. 8811 free before and after.
13. `cd nonm; npm run predev`, `npm run preapp`, `npm run prepreview`: each prints `oculus: The packages are not installed in /private/var/folders/.../r2b/nonm. Run npm ci in /private/var/folders/.../r2b/nonm.` and exits 1. Vite and Electron are not started (the `pre*` hook is what ran; the main script is not reached).
14. `npm ci --dry-run` in a scratch copy of `package.json`, `package-lock.json` and `.npmrc`: under Node 23.11.0 (npm 10.9.2): `npm error code EBADENGINE`, `npm error notsup Required: {"node":">=24","npm":">=11"}`, `npm error notsup Actual:   {"npm":"10.9.2","node":"v23.11.0"}`, `exit=1`. Under Node 24.21.0: `added 557 packages in 350ms`, `exit=0`.
15. By reading. `src/desktop/main.ts:14-18` imports `electron`, `data/places/engine-dir.ts`, `start/first-run.ts` (imports `node:` modules and `core/program.ts`, which imports `node:` modules only: `program.ts:18-20`; the catalog-reader type import is erased), `dialogs.ts` (imports `electron`) and `output.ts` (no imports). `main.ts:20-29`: with a packages lack, `app.whenReady()` then one `say` dialog with the single button `Quit`, then `app.exit(1)`; `config.ts` and `app.ts` are loaded only in the `else` branch (`main.ts:30-31`). With the hub folder missing, `app.ts:322-328`: `machineLacks(await machineFacts(args.engine, options.defaultPort, env), t)`, and a required lack is one `say` dialog (`desktop.dialog.lack_refused`, button `desktop.dialog.quit`), then `app.exit(1)`, before `await startServer(env)` at `app.ts:330`.
16. `machineLacks` with the two environments (`r2b-tools/c16.mjs`): `app own environment (git, perl; no tmux): ["tmux"]` and `environment the server gets, { ...appEnv, ...loginEnv } (login PATH holds tmux): []`. `app.ts` hands `machineFacts` (`:322`) the same `env` that it hands `startServer` (`:330`).
17. By reading. `app.ts:335-355`: `notices` holds `desktop.dialog.env_slow` when the login shell was slow and `desktop.dialog.lacks` (the optional lack sentences) when any, joined with a blank line; one `showDialog` sheet on the first window with `Continue` and `Quit` (`cancel: 0`), and `pressed === 1` calls `app.quit()`.

### Unused exports (`sh utils/unused-exports.sh`, base copy's `unused-exports.txt`)

```
< Unused exports (245)                                     > Unused exports (246)
< src/lib/server/git/git-message.ts: CLAUDE, TIMEOUT_MS    > src/lib/server/git/git-message.ts: TIMEOUT_MS
                                                           > src/lib/server/root/process/start/first-run.ts: installLacks, reportLacks
```

- `CLAUDE` is gone (the literal is replaced by `claudeBin`).
- `installLacks` and `reportLacks` are the one added line. Both are imported by `src/server.ts:23,25` and `installLacks` also by the G73 test. knip does not read `src/server.ts` as an entry (the base list shows the same for `createServerContext`, `serverMover` and `parentOf`, whose only importer is `src/server.ts`), so they are kept.
- `Run`, `MachineFacts` and `lackLine` are not exported (no importer outside the file). `machineFacts` and `machineLacks` have importers in `app.ts` and `server.ts` and are not listed.

## Files changed (`diff -rq` against `.agents/worktrees/R2-base/tools/oculus`, line counts after my last change)

| Path | Lines | In the write list |
|---|---|---|
| `src/lib/server/root/process/start/first-run.ts` (new) | 236 | yes |
| `src/lib/server/root/process/start/args.ts` (moved from `process/args.ts`, content identical) | 112 | yes |
| `src/lib/server/root/process/start/port.ts` (moved, `:8` import path only) | 22 | yes |
| `src/lib/data/places/engine-dir.ts` (new) | 27 | yes (item 1, ruling B) |
| `src/lib/data/places/hub-address.ts` (moved from `src/lib/data/hub-address.ts`, identical) | 59 | yes (ruling B) |
| `src/lib/data/sources/config.ts` | 90 | yes |
| `src/lib/server/content/audit/projects.ts`, `src/lib/server/machine/runs/lint/readers.ts`, `src/lib/state/boards/collection.ts`, `src/lib/state/system/apps/methods.ts`, `src/lib/state/system/machine/lint/lint-model.ts` (the import path of `hub-address` only) | 567, 365, 776, 323, 15 | yes (ruling B) |
| `src/desktop/main.ts` | 33 | yes |
| `src/desktop/app.ts` | 353 | yes |
| `src/desktop/dialogs.ts` (head comment only) | 38 | outside the list: the comment said every word is a catalog word, which `main.ts`'s dialog makes false |
| `src/desktop/decide/args.ts` (import path only) | 40 | yes |
| `src/server.ts` | 146 | yes |
| `src/lib/server/git/git-message.ts` | 114 | yes |
| `src/lib/server/git/git-routes.ts` (the `claudeBin` option and its pass-through) | 488 | yes ("its caller") |
| `src/routes/api/(git)/git/+server.ts` (passes `server.local.claudeBin`) | 42 | yes ("its caller") |
| `package.json`, `package-lock.json`, `.npmrc` (new) | 126, 9313, 1 | yes |
| `config/text/server.yml`, `config/text/desktop.yml` | 313, 65 | yes |
| `README.md` | 48 | yes (lines 5, 11, 13) |
| `DESIGN.md` (`:509` path, new bullet `:511`) | 589 | yes |
| `docs/configuration.md` (`:37`, the `claude_bin` sentence) | 69 | outside the list: the sentence listed only three users of `claude_bin`; a doc sentence the change makes false is the change's defect |
| `docs/diagrams/layer-data.{dot,svg}`, `layer-server.{dot,svg}`, `layers.{dot,svg}` (`npm run diagrams`) | n/a | yes |
| `tests/server/root/first-run.test.ts` (new) | 170 | yes |
| `tests/checks/tree/boundaries.test.ts`, `tests/checks/imports/order.ts` (the data layer's folder list) | 764, 205 | outside the list: the new folder `data/places` has to be placed in the layer order |
| `tests/routes/git/git.test.ts`, `tests/routes/git/untracked.test.ts` (one added fixture line `claudeBin: 'claude',`) | 156, 61 | yes ("the commit-message test") |

### Edits to existing assertions, allow lists and predicates (from `diff` against the base copy)

| File and line | Before | After |
|---|---|---|
| `tests/checks/imports/order.ts:45` | (absent) | `'data/places',` between `'data/prose',` and `'data/model'` in the `data` row |
| `tests/checks/tree/boundaries.test.ts:264` | `'data/hub-address',` | `'data/places/hub-address',` |
| `tests/checks/tree/boundaries.test.ts:32-99` (comment) | `data/hub-address` | `data/places/hub-address`, paragraph rewrapped at 100 columns; a word-by-word comparison of the file's comment text against the base prints one difference, `` `data/hub-address`, `` to `` `data/places/hub-address`, `` |
| `tests/routes/git/git.test.ts:36`, `tests/routes/git/untracked.test.ts:33` | (absent) | `claudeBin: 'claude',` in the options object the route is built with |

No threshold, tolerance or predicate is loosened.

## Tests added or changed: failing line on the unchanged tree

- `tests/server/root/first-run.test.ts` (new): on the base tree plus this file, `Error: Cannot find module '../../../src/lib/data/places/engine-dir.ts' imported from .../tests/server/root/first-run.test.ts` and `Tests no tests`.
- `tests/checks/imports/order.ts`, `tests/checks/tree/boundaries.test.ts`, `tests/routes/git/git.test.ts` and `untracked.test.ts` change an allow list, a path and a fixture field; no assertion is added or changed.

G73's test: ten rows of one table, each `it.each` title below (file `tests/server/root/first-run.test.ts`, describe 'the first-run check refuses a start for a required lack'):

1. 'Node 24.21.0 is no lack'
2. 'Node 22.12.0 is one lack naming Node 24 and nvm install 24'
3. 'the pre-release 25.0.0-nightly20260101abc is read by its major 25'
4. 'no node_modules/.package-lock.json is one lack naming npm ci and the checkout'
5. 'a hidden lockfile missing one required entry is one lack naming the count 1'
6. 'a hidden lockfile with one entry at another version is one lack naming the count 1'
7. 'a hidden lockfile lacking only the optional entries is no lack'
8. 'a hub that is no folder is one lack naming the path and the local.yml key'
9. 'a hub that is a file is one lack naming the path and the local.yml key'
10. 'no local.yml and the default hub two folders above the engine is no lack'

Each row asserts the kinds of the lacks, that every lack is required, and that the sentences hold the named texts. The test uses `plantScratch` and `plantFile` of `tests/fixtures/scratch.ts` (every write checked to stay inside the temporary directory) and reads the real text catalog of the checkout (`wordsOf(engineDir())`), which makes the first hub row take about 450 ms; the file runs in 1.6 s.

## Reuse greps (spec: grep before writing a helper, type or schema)

- `grep -rn "Words\b" src/lib/server/root/process/words.ts`: `Words` is the catalog reader type; `first-run.ts` imports it as a type (erased at run time) in place of declaring a second one.
- `onPath`/`programPath` of `server/core/program.ts` are reused as the lookup (`first-run.ts` calls `programPath`, which `onPath` wraps, because the sentence for git compares the found path with `/usr/bin/git`).
- `src/desktop/dialogs.ts`'s `say` is reused for the dialog of `main.ts`; `output.ts`'s `dropClosed` for its log line.
- `engineDir`: `grep -rn "engineDir" src` shows `src/server.ts`, `src/desktop/app.ts` and `config.ts`'s re-export unchanged for other importers; only `server.ts` and `main.ts` import `places/engine-dir.ts` directly, the others keep `config.ts`.

## Comment grep (spec: history words in comment lines and test titles added or changed)

Command: the added lines of each changed file against the base, and all lines of the new files, filtered to comment lines and test titles, searched for `before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands` and for package ids (`[A-Z][0-9]{1,3}[a-z]?`). Hits, each judged:

- `server.ts` head and body comments, `main.ts` head comment, `dialogs.ts:5`, `config.ts` re-export doc, `engine-dir.ts` head comment, `first-run.ts` head comment and the doc of `main`: all use "before" for the order of events in one run (a check runs before packages load, before a window shows). None compares with an earlier state of the code. Kept.
- `tests/checks/tree/boundaries.test.ts` hits are the unchanged words of a paragraph I rewrapped ("before it sends", "before it writes"); the word comparison above shows only the path changed. Kept.
- No package id and no other history word in any added line or test title.

## Judgment calls the brief left open (each reversible)

1. `engineDir`'s module: `src/lib/data/places/engine-dir.ts`, from ruling B (`hub-address.ts` joins it). `data/places` is a new row in the `data` layer order of `tests/checks/imports/order.ts`, before `data/model`.
2. The second part is two exported functions: `machineFacts(engine, defaultPort, env)` reads the engine's local values (loading `port.ts` and `config.ts` with `import()`), and `machineLacks(facts, t)` decides. The two callers (`server.ts`, `app.ts`) and the program all call both. This lets cases 10, 11 and 16 give `machineLacks` an injected runner, platform and environment, and keeps every export with a production importer.
3. Catalog keys (`config/text/server.yml` `server.start.*`: `fix_brew`, `fix_claude`, `fix_install`, `fix_perl_xcode`, `fix_xcode`, `handler_not_built`, `lack_hub`, `lack_program`, `lack_stub`, `needs_claude`, `needs_git`, `needs_perl`, `needs_tmux`; `config/text/desktop.yml` `desktop.dialog.lack_refused`, `lacks`). `desktop.dialog.lack_refused` has the text of `desktop.dialog.args_refused` (`oculus did not start: {0}`); two keys because one names a refused command line and the other a missing requirement. The dialog of `main.ts` is the literal `oculus did not start: ...` with the literal button `Quit` (Decisions 3).
4. The Claude CLI's fix names `https://code.claude.com/docs/en/setup` and the `claude_bin` key. `https://docs.claude.com/en/docs/claude-code/setup` answers `301 Moved Permanently` to this address (WebFetch), and the target page describes installing Claude Code.
5. `fix_install` ("Install {0} with your package manager.") is the fix for a missing program off macOS; Linux fixes proper are O33's, as Decisions 6 says.
6. The first part of a start prints only the required lack(s) of that part; the second part prints optional and required lacks together before exiting 1, so a missing hub and a missing tmux are both said.
7. `server.ts` says `handler_not_built` only for the default handler (`parsed.handler === undefined`); a `--handler` file that exists and fails to load keeps `server.start.handler_failed`.
8. `docs/configuration.md:37` and `src/desktop/dialogs.ts:3-5` were edited because the change made a sentence in each false (outside the write list, reason in the file table).

## Host- and user-visible changes, before and after

- `node src/server.ts` over a checkout with no `node_modules`. Before: `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'zod' imported from .../src/lib/data/snapshot/normalise.ts`, exit 1. After: `oculus: The packages are not installed in <checkout>. Run npm ci in <checkout>.`, exit 1, no port opened.
- `node src/server.ts` with no `build/handler.js`. Before: `oculus: the server handler .../build/handler.js could not be loaded: Cannot find module '.../build/handler.js' imported from .../src/server.ts`. After: `oculus: the server handler .../build/handler.js does not exist; run npm run build in <checkout> to make it`.
- `node src/server.ts` with `hub` naming no folder or a file. Before: starts and listens over that path. After: `oculus: <path> is not a folder, so there is no research hub to read. Set hub in <engine>/config/local.yml to the folder of the research hub.`, exit 1.
- A missing `git`, `tmux`, `perl` or `claude_bin` program. Before: silent. After: one `oculus: ...` line each on standard error (text in case 9), the start goes on; start output with everything present is identical to the base (case 12).
- `npm run dev`, `npm run app`, `npm run preview` now run `predev`, `preapp`, `prepreview` first (`> oculus@0.0.1 predev`, `> node src/lib/server/root/process/start/first-run.ts`); with packages missing the hook prints the packages line and exits 1 (case 13). With everything present the hook prints nothing. A missing optional program is printed by the hook on every dev or preview start.
- `npm ci` under Node 23: before it installed; after `EBADENGINE`, exit 1 (case 14). `.npmrc` holds `engine-strict=true`, which also makes `npm install` refuse an older Node or npm.
- The app (seen at the look on landing; Electron not started here): on `npm run app` in a checkout without packages, one dialog `oculus did not start: The packages are not installed in <checkout>. Run npm ci in <checkout>.` with the single button Quit, exit 1. With a hub folder that does not exist: one dialog `oculus did not start: <path> is not a folder, ...` with Quit before the server starts, exit 1. With a program missing, after the window opens, one sheet on the first window: `oculus started without these, so the parts that need them do not work:` and one sentence per program, buttons Continue and Quit; with a slow login shell the `env_slow` sentence comes first in the same sheet, separated by a blank line. State to put it in for the look: a checkout whose PATH lacks `tmux` (start the app from a terminal with `PATH=/usr/bin:/bin`), then the same app with `hub:` in a scratch engine's `local.yml` naming a missing folder.

## Anything in the brief that was wrong or impossible

- `--port 8811` (cases 6, 7, 9, 12 and the paragraph above "Cases") is not a flag; ruling A applied (see above).
- "A new subfolder of `src/lib/data/` is allowed" could not pass the folder rule (`src/lib/data/` held ten items); ruling B applied.
- Item 2 says `first-run.ts` imports only `node:` modules, `server/core/program.ts` and the `engineDir` module; it also has `import type { Words } from '../words.ts'`, which node's type stripping erases, so no package is loaded by it (stated in the file's head comment).

## Limitations and sharp edges

- Not verified: any dialog or sheet on screen, and that Electron accepts the `await import()` at the top level of `main.ts` (G48's slow test starts Electron and runs at landing). `main.ts` uses a top-level `await` only on `import()` of two modules and never awaits `app.whenReady()` (the ES-module main in which an `await` on ready never returns).
- The Node version is not checked in the app (Electron's own Node), as the brief says; the app's install check is the packages lack only.
- On a Node that cannot run a `.ts` file (below 22.18 or 23.6), `node src/server.ts` and the `pre*` hooks end in Node's own error; the install-time `engines` check is what reaches that reader (case 14). With `ignore-scripts=true` npm skips the `pre*` hooks; the built server and the app still check.
- In the app, when no window exists after the server starts (`windows.lastMain()` is null), the sheet is not shown; this is the existing behaviour for the `env_slow` sheet, and the forked server also prints the optional lack lines to the app's output.
- The hidden lockfile is compared by version only, not by `resolved` or `integrity`; a package replaced by another build of the same version reads as installed.
- `tests/routes/git/untracked.test.ts` is tagged slow (the quick list says so); I ran it alone in the vitest set above and it passed.

## Doc text (for the orchestrator to write at landing)

G73's lines for `agents/guarded.md`:

- Code: `src/lib/server/root/process/start/first-run.ts`.
- Test: `tests/server/root/first-run.test.ts`, the ten titles listed above under "G73's test".

`docs/window.md`: no sentence is made false. `grep -n -i "dialog" docs/window.md` finds the sentences about the server ending on its own (`When the server ends on its own, a dialog quotes why and offers Restart...`), the schedule dialog and the tooltip rule, all still true; the line that describes the app starting the server (`docs/window.md:7`, `it starts the server itself`) is still true. No replacement line is given.
