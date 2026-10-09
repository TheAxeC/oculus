Everything in the brief and in the six items of repair round 1 is done. Nothing is left undone inside R2; what is not covered is listed in the next section.

## Open items of the state file (copied from `orchestrator-state.md`, "Open items")

- Open item 33 (2026-10-09, the queue): Q72, the architecture re-read, is queued to wait for D49, D55 and D56, an order the orchestrator set and Axel has not ruled; Axel unpaused Q72. Options: (a), recommended: keep the wait, so the re-read covers the code D49, D55 and D56 change before O33 opens the repository; (b) start Q72 now, which leaves those three steps' code unread by it. R2 stays before Q72, in the order `queue.md` gives.

## What this report does not cover

- Electron was never started (spec: a builder runs no page). The code of `src/desktop/main.ts` and `src/desktop/app.ts` is shown by `svelte-check` (0 errors), by reading, and by the `machineFacts`/`machineLacks` runs for the environments; the dialogs themselves are seen at the look on landing (section "Host- and user-visible changes"). G48's test (`tests/server/desktop/start.test.ts`, slow, starts Electron) is not run by me; it runs at landing in `npm run test:slow`.
- `npm ci --dry-run` under Node 24.14.0 and Node 25.0.0 is not run: only Node 23.11.0 and 24.21.0 are installed here. Their result is read from the range `^24.15.0 || >=26.0.0` and from the G73 rows for those versions, which ran.
- `npm test`, `npm run test:landing` and `utils/scratch-count.sh` are not run, as the brief says.
- `npm run test:quick` finished in 50.5 s with the 32 paths I gave it (limit 45.0 s; every command passed). I gave it every changed source, test, config and document path, so more dependent tests than a default run were selected, and the machine was running another builder at the same time.
- The row 'a hub whose folder cannot be read ...' uses `chmod 000`, which a process running as root ignores; it needs the ordinary user the suite runs as.

## Repair round 1: the six items

Every run below was made after the last change, from `tools/oculus` in the worktree, with `HOME=$TMPDIR/r2c-home` and Node 24.21.0 first on PATH. Scratch copies are under `$TMPDIR/r2b` (`full` has `node_modules` and `build` linked, `nonm` has neither, `nob` has `node_modules` and no `build`, `basecopy` is the base tree). Port 8811 was free before and after (`lsof -iTCP:8811 -sTCP:LISTEN` printed nothing).

### Item 1: the supported Node range is `^24.15.0 || >=26.0.0`

- Changed: `package.json` `engines.node`; `package-lock.json` `packages[""].engines.node` (the same text; `engines.npm` is `>=11` in both); `.npmrc` keeps `engine-strict=true`. `src/lib/server/root/process/start/first-run.ts:30-40` holds the constants `NODE_LINE = 24`, `NODE_LINE_MINOR = 15`, `NODE_NEXT_MAJOR = 26` and a doc comment saying why: the range is the oldest Node every installed package accepts (`write-file-atomic` 8.0.0 declares `^22.22.2 || ^24.15.0 || >=26.0.0`), and `engine-strict` applies a dependency's `engines` as well. `nodeLacks` in the same file builds the sentence from the constants: `Node <version> is not supported: oculus needs Node 24.15 or later on the 24 line, or Node 26 or later. Install it with: nvm install 24`. `README.md:5` and `DESIGN.md:511` state the range.
- G73 rows added (in `tests/server/root/first-run.test.ts`): 'Node 24.14.0 is one lack naming the range and nvm install 24' (lack), 'Node 25.0.0 is one lack naming the range and nvm install 24' (lack), 'Node 24.15.0 is no lack' (none), 'Node 26.0.0 is no lack' (none).
- Before, on the tree as it stood (`npx vitest run tests/server/root/first-run.test.ts`): `Tests  3 failed | 12 passed (15)`. The Node rows failed as follows; the two "none" rows passed already on the old rule, as a "none" row does:
  - `x 'Node 24.14.0 is one lack naming the r...'` with `expected [] to deeply equal [ 'node' ]`
  - `x 'Node 25.0.0 is one lack naming the ra...'` with `expected [] to deeply equal [ 'node' ]`
- After: `Tests 15 passed (15)`.
- Existing assertion changed: the row 'the pre-release 25.0.0-nightly20260101abc is read by its major 25' (no lack) is now 'the pre-release 26.0.0-nightly20260101abc is read by its major 26' (no lack), because 25 is a lack now; the row still asserts that the pre-release suffix is ignored.
- `npm ci --dry-run` in a scratch copy of `package.json`, `package-lock.json` and `.npmrc`: under Node 23.11.0 (npm 10.9.2) `npm error code EBADENGINE`, `npm error notsup Required: {"node":"^24.15.0 || >=26.0.0","npm":">=11"}`, `npm error notsup Actual:   {"npm":"10.9.2","node":"v23.11.0"}`, exit 1. Under Node 24.21.0 it lists the packages it would add, exit 0.

### Item 2: an unreadable hub is the hub lack, with the error code

- Changed: `first-run.ts` `folderProblem` (about line 128): `statSync` runs in a `try`; `ENOENT` and `ENOTDIR` answer the empty text (no folder), any other error code is answered as the code, and nothing throws. `machineLacks` says `server.start.lack_hub` for the empty text and the new `server.start.lack_hub_unreadable` (`config/text/server.yml`) with the code otherwise: `<hub> cannot be read (<code>), so there is no research hub to read. Allow oculus to read it, or set hub in <local.yml> to the folder of the research hub.` The sentence is required, so the start ends with exit 1.
- G73 row added: 'a hub whose folder cannot be read is one lack naming the path and EACCES'. It plants a scratch folder `locked`, sets its mode to 000, asks for `locked/hub`, and restores mode 755 in a `finally`.
- Before: `x 'a hub whose folder cannot be read is ...'` with `EACCES: permission denied, stat '/var/folders/7r/.../T/oculus-first-run-PqXNY4/locked/hub'` (a thrown error with a stack). After: the row passes (`Tests 15 passed (15)`).
- `hub: /var/root/hub`, `port: 8811` in a scratch engine's `local.yml`, `node src/server.ts --engine <scratch engine>`: `oculus: /var/root/hub cannot be read (EACCES), so there is no research hub to read. Allow oculus to read it, or set hub in .../r2b/engroot/config/local.yml to the folder of the research hub.`, `exit=1`; no stack. A hub that does not exist still gives `... is not a folder, so there is no research hub to read. ...`, `exit=1` (case 8 below).

### Item 3: `preapp` runs only the install part

- Changed: `package.json` `preapp` is `node src/lib/server/root/process/start/first-run.ts --install`; `predev` and `prepreview` are unchanged (`node src/lib/server/root/process/start/first-run.ts`). `first-run.ts` `main` (about line 238) reads `--install`: it asks `installLacks` (Node and packages), reports them, and returns 0 before the config reader or the hub is touched. The doc comment of `main` says why: npm hands a script's arguments (`--engine`) to the script and not to its `pre` hook, and the app checks the hub and the programs over its own engine. `README.md:5` and `DESIGN.md:511` say it.
- Before: `preapp` ran the whole program like `predev`, so a hub named in `local.yml` that was missing ended `npm run app` before the app, which checks the hub over its own engine, could look at it. The same command line is `npm run predev` over `full` with `hub` naming a missing folder: `oculus: .../r2b/nothere is not a folder, so there is no research hub to read. ...`, `exit=1`.
- After, case 13 over `nonm` (no `node_modules`), each hook:
  - `npm run predev`, `npm run preapp` (the echoed command ends in `first-run.ts --install`) and `npm run prepreview` each print `oculus: The packages are not installed in /private/var/folders/.../r2b/nonm. Run npm ci in /private/var/folders/.../r2b/nonm.` and exit 1.
- After, over `full` with `local.yml` `hub: .../r2b/nothere`, `port: 8811`:
  - `node src/lib/server/root/process/start/first-run.ts --install` prints nothing, `exit=0`.
  - `npm run preapp` prints only the npm command echo, `exit=0`.
  - `node src/lib/server/root/process/start/first-run.ts` and `npm run predev` print the hub lack, `exit=1`.

### Item 4: the `claude_bin` help names every use

- Changed: `config/catalogs/options.yml:1417` (the `claude_bin` help): `The Claude command line that the chat terminals, the worktree agents, the usage refresh, the update tasks, the prompts of schedules and the suggested commit messages are started with, an absolute path or a name resolved on PATH. Without it the name is claude. A change is read again at once.` It lists the six uses of `docs/configuration.md:37`.
- Other sentences that list what `claude_bin` runs, found by `grep -rn --exclude=local.yml -iE "usage refresh|worktree agents|chat terminals|commit messages|update tasks" config/catalogs config/text` and `grep -rn --exclude=local.yml -i claude_bin config/catalogs config/text`: `config/text/server.yml:302` (`server.start.needs_claude`, the list inside the optional-lack sentence) said `the chat terminals, the worktree agents, the usage refresh, the schedules and tasks, and the suggested commit messages`. It now reads `the chat terminals, the worktree agents, the usage refresh, the update tasks, the prompts of schedules and the suggested commit messages`. `config/text/server.yml:292` (`fix_claude`) names the key, not a list. No other hit lists the uses. `README.md:13` and `docs/configuration.md:37` carry the same six uses and are unchanged.

### Item 5: `README.md:5`

- `README.md:5` holds two sentences this step added, and no more: `npm ci refuses a Node outside ^24.15.0 || >=26.0.0 (Node 24.15 or later on the 24 line, or Node 26 or later, which every installed package accepts) before it installs anything.` and `Each start (...) first checks the Node version ..., that the installed packages are the ones package-lock.json lists, the hub folder and the programs ..., and says what is missing with its fix; ...` (the second ends with the parenthetical about `npm run app`, which runs the Node and package part before Electron starts). The other sentences of the paragraph (`Install once, with Node 24 and npm 11 ...`, the Perl sentence) are the ones the paragraph had.

### Item 6: this report, with the counts taken after the last change (below).

## Rulings that applied (R2-cases.md)

- A. No flag `--port` exists on the built server. Every run that listens used a scratch engine whose `config/local.yml` carries `port: 8811`, or `--default-port 8811` for an engine with no `local.yml`. 8811 was free before and after every run.
- B. `src/lib/data/places/` holds `engine-dir.ts` and `hub-address.ts` (moved from `src/lib/data/hub-address.ts`, content unchanged: `diff` of the two files prints nothing). `src/lib/data/` is back at ten items (`sh utils/folder-check.sh`, exit 0).

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

| Row | Proof | Result as printed |
|---|---|---|
| Item 1 of the brief, `engineDir` loadable without packages | `src/lib/data/places/engine-dir.ts` imports `node:fs`, `node:path`, `node:url` only; `config.ts:15` is `export { engineDir } from '../places/engine-dir.ts';` | `npm run test:quick`: `ok svelte-check ... 0 ERRORS 0 WARNINGS` |
| Item 2, `first-run.ts` with `installLacks`, `machineFacts`, `machineLacks`, run as a program | cases 1 to 5, 8 to 13 below; `args.ts` and `port.ts` moved to `start/` with only `port.ts:8`'s relative import changed (`diff` against the base copy) | see cases |
| Item 3, `src/server.ts` | cases 6, 7, 8, 9, 12 | see cases |
| Item 4, the three `pre*` scripts | case 13; repair item 3 | exit 1 each over `nonm` |
| Item 5, `main.ts` and `app.ts` | cases 15 to 17 by reading and by `machineFacts`/`machineLacks` | see cases |
| Item 6, `engines`, lockfile root entry, `.npmrc` | case 14; repair item 1 | `EBADENGINE` under Node 23.11.0, no refusal under 24.21.0 |
| Item 7, commit messages run `claude_bin` | case 10c; `git-message.ts`, `git-routes.ts`, `src/routes/api/(git)/git/+server.ts:22` | `10c suggestMessage outcome: {"ok":true,"output":"stub message","error":""}` |
| Item 8, text and pages | catalog keys read by `tests/checks/source/keys.test.ts`; `README.md` lines 5, 11, 13; `DESIGN.md:509,511`; `docs/configuration.md:37` | `npx vitest run tests/checks --testTimeout 0 --hookTimeout 0`: `Test Files 17 passed (17)`, `Tests 264 passed | 1 skipped (265)` |
| Repair items 1 to 5 | the sections above | as quoted there |
| Verify 1, `npm run diagrams` then `npm run test:quick` | `npm run test:quick -- <the 32 changed paths>` after the last change | `ok ASCII gate (0.4 s)`, `ok prettier (0.7 s): All matched files use Prettier code style!`, `ok eslint (27.5 s)`, `ok svelte-check (31.8 s): 1791582953217 COMPLETED 451 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok vitest (50.1 s)`, `test:quick: 50.5 s (limit 45.0 s); every command passed` |
| Verify 2, vitest set in full | `npx vitest run tests/server/root/first-run.test.ts tests/checks/source/keys.test.ts tests/checks/tree tests/routes/git/git.test.ts tests/routes/git/untracked.test.ts --testTimeout 0 --hookTimeout 0` | `Test Files  7 passed (7)`, `Tests  68 passed (68)` |
| All tree checks | `npx vitest run tests/checks --testTimeout 0 --hookTimeout 0` | `Test Files  17 passed (17)`, `Tests  264 passed | 1 skipped (265)` |
| Verify 3, folder check, sizes, unused exports | `sh utils/folder-check.sh; echo $?` | `0`; sizes in the file table; unused exports below |
| Verify 4, G73's test on the unchanged tree and after | on a scratch copy of the base tree (`R2-base` plus the test file) for the first assignment; on the tree as it stood for the round | base: `Error: Cannot find module '../../../src/lib/data/places/engine-dir.ts' imported from .../tests/server/root/first-run.test.ts`, `Tests no tests`; round: `Tests  3 failed | 12 passed (15)`; after: `Tests 15 passed (15)` |
| ASCII gate (spec's perl form over `src tests config`) | `LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print ...' $(find src tests config -type f ! -name local.yml)` (`bin` does not exist in this tree) | prints nothing; `LC_ALL=C grep -c '[^ -~]'` over `README.md DESIGN.md docs/configuration.md package.json .npmrc` prints `0` for each |

### The cases

Server cases ran over scratch copies re-synced from the worktree after the last change, case 9 after the `server.yml:302` edit of repair item 4.

1. Version rule, test rows 'Node 24.21.0 is no lack', 'Node 22.12.0 ...', 'Node 24.14.0 ...', 'Node 25.0.0 ...', 'Node 24.15.0 is no lack', 'Node 26.0.0 is no lack', 'the pre-release 26.0.0-nightly20260101abc is read by its major 26'. `npx vitest run tests/server/root/first-run.test.ts`: `Tests 15 passed (15)`.
2. Row 'no node_modules/.package-lock.json is one lack naming npm ci and the checkout': passes. `cd nonm; npm run predev` prints the packages line (item 3).
3. Rows 'a hidden lockfile missing one required entry ...' and 'a hidden lockfile with one entry at another version ...': pass (the sentence holds `version: 1)`).
4. Row 'a hidden lockfile lacking only the optional entries is no lack': passes.
5. `node r2b-tools/c5.mjs` (prints `installLacks('<worktree>/tools/oculus', '24.21.0')`): `[]`.
6. `cd nonm; node src/server.ts --default-port 8811`: `oculus: The packages are not installed in /private/var/folders/.../r2b/nonm. Run npm ci in /private/var/folders/.../r2b/nonm.`, `exit=1`; no Node "Cannot find package" text.
7. `cd nob` (`node_modules` linked, no `build/`): `oculus: the server handler .../r2b/nob/build/handler.js does not exist; run npm run build in .../r2b/nob to make it`, `exit=1`. With `--handler .../r2b/nothere.js`: `oculus: /var/folders/.../r2b/nothere.js is no file, so there is no handler to load`, `exit=1` (the `args.ts` refusal).
8. Rows 'a hub that is no folder ...', 'a hub that is a file ...', 'a hub whose folder cannot be read ...' and 'no local.yml and the default hub two folders above the engine is no lack': pass. Run over `full` with `local.yml` `hub: .../r2b/nothere` and `hub: .../r2b/hubfile`, `port: 8811`, `node src/server.ts`: `oculus: .../r2b/nothere is not a folder, so there is no research hub to read. Set hub in /private/var/folders/.../r2b/full/config/local.yml to the folder of the research hub.`, `exit=1`, and the same with `hubfile`; the handler was not loaded. No `local.yml`: `node src/lib/server/root/process/start/first-run.ts` prints nothing, `exit=0`.
9. `node runserver.mjs full /var/empty` (PATH holds nothing; a harness that starts `node src/server.ts` with that PATH and ends it after `oculus on`): four lines on standard error, then the start goes on:
   - `oculus: git was not found, so Source Control and History do not work. Run xcode-select --install.`
   - `oculus: tmux was not found, so the terminals and their sessions do not work. Run brew install tmux.`
   - `oculus: perl was not found, so the line counts of the Status view do not work. Perl comes with the macOS Command Line Tools; run xcode-select --install.`
   - `oculus: claude was not found, so the chat terminals, the worktree agents, the usage refresh, the update tasks, the prompts of schedules and the suggested commit messages do not work. Install the Claude CLI from https://code.claude.com/docs/en/setup, or set claude_bin in .../r2b/full/config/local.yml to its path.`
   - then `out: oculus on http://127.0.0.1:8811 over hub .../r2b/hub`, `exit code=0 signal=null endedByRun=true`.
10. `claude_bin`, through `machineLacks` with an environment whose PATH holds no Claude: `10a claude_bin absolute path outside PATH: []`; `10b claude_bin name not on PATH: [["claude",false]]`. `10c`: `suggestMessage(..., claudeBin = <recording stub outside PATH>, { diff: stub })` returned `{"ok":true,"output":"stub message","error":""}`.
11. `machineLacks` with `platform: 'darwin'`, `PATH=/usr/bin`, injected runner returning 1: the runner was called with `xcode-select -p`, and the lacks of kind `git` are `[["git",false]]` with `git is the macOS stub at /usr/bin/git and the Command Line Tools are not installed, so Source Control and History do not work. Run xcode-select --install.` With the runner returning 0: `[]`.
12. Everything present: `cd full; node src/lib/server/root/process/start/first-run.ts` prints nothing, `exit=0`; `npm run predev` over `full` exits 0. The start output of `node src/server.ts` over `full` (hub `.../r2b/hub`, `port: 8811`) against `basecopy` (the base tree with the same `local.yml`, `HOME` and `build/`), engine paths normalised with `sed`: `diff` prints nothing, 22 lines in each, ending `out: hpc publish: unreachable`, `out: calendar publish: unconfigured`, `out: mail publish: unconfigured`, `out: oculus on http://127.0.0.1:8811 over hub .../r2b/hub`.
13. The three hooks over `nonm`: repair item 3.
14. `npm ci --dry-run`: repair item 1.
15. By reading. `src/desktop/main.ts:14-18` imports `electron`, `data/places/engine-dir.ts`, `start/first-run.ts` (imports `node:` modules and `core/program.ts`, which imports `node:` modules only; the catalog-reader type import is erased), `dialogs.ts` and `output.ts`. With a packages lack, `app.whenReady()` then one `say` dialog with the single button `Quit`, then `app.exit(1)`; `config.ts` and `app.ts` are loaded only otherwise. With the hub folder missing or unreadable, `app.ts:322-328`: `machineLacks(await machineFacts(args.engine, options.defaultPort, env), t)`, and a required lack is one `say` dialog (`desktop.dialog.lack_refused`, button `desktop.dialog.quit`), then `app.exit(1)`, before `await startServer(env)` at `app.ts:330`.
16. `machineLacks` with the two environments (`r2b-tools/c16.mjs`): `app own environment (git, perl; no tmux): ["tmux"]` and `environment the server gets, { ...appEnv, ...loginEnv } (login PATH holds tmux): []`.
17. By reading. `app.ts:335-355`: `notices` holds `desktop.dialog.env_slow` when the login shell was slow and `desktop.dialog.lacks` (the optional lack sentences) when any, joined with a blank line; one `showDialog` sheet on the first window with `Continue` and `Quit`, and `pressed === 1` calls `app.quit()`.

### Unused exports (`sh utils/unused-exports.sh` against the base copy's `unused-exports.txt`)

```
< Unused exports (246)                                     > Unused exports (245)
< src/lib/server/git/git-message.ts: TIMEOUT_MS            > src/lib/server/git/git-message.ts: CLAUDE, TIMEOUT_MS
< src/lib/server/root/process/start/first-run.ts: installLacks, reportLacks
```

- `CLAUDE` is gone from the list (the literal is replaced by the `claudeBin` parameter).
- `installLacks` and `reportLacks` are the one added line, and the count is 246 against 245. Both are imported by `src/server.ts:23,26` and `installLacks` also by the G73 test. knip does not read `src/server.ts` as an entry (the base list shows the same for `parentOf` and `askParentToPick` of `process/parent.ts`, whose importer is `src/server.ts`), so they are kept. The total is one over the base; no other line was added.
- `Run`, `MachineFacts` and `lackLine` are not exported. `machineFacts` and `machineLacks` have importers in `app.ts` and `server.ts` and are not listed.

## Files changed (`diff -rq` against `.agents/worktrees/R2-base/tools/oculus`, line counts after the last change, taken with `wc -l`)

| Path | Lines | In the write list |
|---|---|---|
| `src/lib/server/root/process/start/first-run.ts` (new) | 259 | yes |
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
| `config/text/server.yml`, `config/text/desktop.yml` | 314, 65 | yes |
| `config/catalogs/options.yml` (`claude_bin` help, line 1417) | unchanged count | outside the list: the help listed fewer uses than `docs/configuration.md:37` |
| `README.md` | 48 | yes (lines 5, 11, 13) |
| `DESIGN.md` (`:509` path, bullet `:511`) | 589 | yes |
| `docs/configuration.md` (`:37`, the `claude_bin` sentence) | 69 | outside the list: the sentence listed only three users of `claude_bin`; a doc sentence the change makes false is the change's defect |
| `docs/diagrams/layer-data.{dot,svg}`, `layer-server.{dot,svg}`, `layers.{dot,svg}` (`npm run diagrams`, run again after the last change) | n/a | yes |
| `tests/server/root/first-run.test.ts` (new) | 207 | yes |
| `tests/checks/tree/boundaries.test.ts`, `tests/checks/imports/order.ts` (the data layer's folder list) | 764, 205 | outside the list: the new folder `data/places` has to be placed in the layer order |
| `tests/routes/git/git.test.ts`, `tests/routes/git/untracked.test.ts` (one added fixture line `claudeBin: 'claude',`) | 156, 61 | yes ("the commit-message test") |

The largest file in the table is `src/lib/state/boards/collection.ts` at 776 lines (only its import line changed), under the 880 limit.

### Edits to existing assertions, allow lists and predicates (from `diff` against the base copy and the round)

| File and line | Before | After |
|---|---|---|
| `tests/server/root/first-run.test.ts:128` | row 'the pre-release 25.0.0-nightly20260101abc is read by its major 25', no lack | row 'the pre-release 26.0.0-nightly20260101abc is read by its major 26', no lack (25 is a lack now) |
| `tests/checks/imports/order.ts:45` | (absent) | `'data/places',` between `'data/prose',` and `'data/model'` in the `data` row |
| `tests/checks/tree/boundaries.test.ts:264` | `'data/hub-address',` | `'data/places/hub-address',` |
| `tests/checks/tree/boundaries.test.ts:32-99` (comment) | `data/hub-address` | `data/places/hub-address`, paragraph rewrapped at 100 columns; the file's comment text against the base differs only in that path |
| `tests/routes/git/git.test.ts:36`, `tests/routes/git/untracked.test.ts:33` | (absent) | `claudeBin: 'claude',` in the options object the route is built with |

No threshold, tolerance or predicate is loosened.

## Tests added or changed: failing line on the unchanged tree

- `tests/server/root/first-run.test.ts` (new): on the base tree plus this file, `Error: Cannot find module '../../../src/lib/data/places/engine-dir.ts' imported from .../tests/server/root/first-run.test.ts`, `Tests no tests`. For the round: `Tests  3 failed | 12 passed (15)` on the tree as it stood, lines quoted under repair items 1 and 2.
- `tests/checks/imports/order.ts`, `tests/checks/tree/boundaries.test.ts`, `tests/routes/git/git.test.ts` and `untracked.test.ts` change an allow list, a path and a fixture field; no assertion is added or changed.

G73's test: fifteen rows of one table (file `tests/server/root/first-run.test.ts`, describe 'the first-run check refuses a start for a required lack'):

1. 'Node 24.21.0 is no lack'
2. 'Node 22.12.0 is one lack naming Node 24 and nvm install 24'
3. 'Node 24.14.0 is one lack naming the range and nvm install 24'
4. 'Node 25.0.0 is one lack naming the range and nvm install 24'
5. 'Node 24.15.0 is no lack'
6. 'Node 26.0.0 is no lack'
7. 'the pre-release 26.0.0-nightly20260101abc is read by its major 26'
8. 'no node_modules/.package-lock.json is one lack naming npm ci and the checkout'
9. 'a hidden lockfile missing one required entry is one lack naming the count 1'
10. 'a hidden lockfile with one entry at another version is one lack naming the count 1'
11. 'a hidden lockfile lacking only the optional entries is no lack'
12. 'a hub that is no folder is one lack naming the path and the local.yml key'
13. 'a hub that is a file is one lack naming the path and the local.yml key'
14. 'a hub whose folder cannot be read is one lack naming the path and EACCES'
15. 'no local.yml and the default hub two folders above the engine is no lack'

Each row asserts the kinds of the lacks, that every lack is required, and that the sentences hold the named texts. The test uses `plantScratch` and `plantFile` of `tests/fixtures/scratch.ts` (every write checked to stay inside the temporary directory) and reads the real text catalog of the checkout (`wordsOf(engineDir())`).

## Reuse greps (spec: grep before writing a helper, type or schema)

- `Words` is the catalog reader type of `process/words.ts`; `first-run.ts` imports it as a type (erased at run time) in place of declaring a second one.
- `programPath` of `server/core/program.ts` is reused as the lookup, because the sentence for git compares the found path with `/usr/bin/git`.
- `src/desktop/dialogs.ts`'s `say` is reused for the dialog of `main.ts`; `output.ts`'s `dropClosed` for its log line.
- `engineDir`: only `server.ts` and `main.ts` import `places/engine-dir.ts` directly; the other importers keep `config.ts`.

## Comment grep (spec: history words in comment lines and test titles added or changed)

`grep -nE "before|used to|no longer|still|previously|as before" src/lib/server/root/process/start/first-run.ts tests/server/root/first-run.test.ts` finds `before` at `first-run.ts:1, 7, 8, 232`, each the order of events in one run (a check runs before packages load, before oculus starts). None compares with an earlier state of the code. No package id and no other history word in any added line or test title. All comment lines of the changed files end by column 100 (`tests/checks/source/comment-width.test.ts` passes inside `tests/checks`).

## Judgment calls the brief left open (each reversible)

1. `engineDir`'s module: `src/lib/data/places/engine-dir.ts`, from ruling B. `data/places` is a new row in the `data` layer order of `tests/checks/imports/order.ts`, before `data/model`.
2. The second part is two exported functions: `machineFacts(engine, defaultPort, env)` reads the engine's local values (loading `port.ts` and `config.ts` with `import()`), and `machineLacks(facts, t)` decides. The callers (`server.ts`, `app.ts`) and the program call both. This lets cases 10, 11 and 16 give `machineLacks` an injected runner, platform and environment.
3. Catalog keys: `config/text/server.yml` `server.start.*` are `fix_brew`, `fix_claude`, `fix_install`, `fix_perl_xcode`, `fix_xcode`, `handler_not_built`, `lack_hub`, `lack_hub_unreadable`, `lack_program`, `lack_stub`, `needs_claude`, `needs_git`, `needs_perl`, `needs_tmux`; `config/text/desktop.yml` `desktop.dialog.lack_refused`, `lacks`. `desktop.dialog.lack_refused` has the text of `desktop.dialog.args_refused` (`oculus did not start: {0}`); two keys because one names a refused command line and the other a missing requirement. The dialog of `main.ts` is the literal `oculus did not start: ...` with the literal button `Quit` (Decisions 3).
4. The Claude CLI's fix names `https://code.claude.com/docs/en/setup` and the `claude_bin` key. `https://docs.claude.com/en/docs/claude-code/setup` answers `301 Moved Permanently` to this address.
5. `fix_install` ("Install {0} with your package manager.") is the fix for a missing program off macOS; Linux fixes proper are O33's, as Decisions 6 says.
6. The first part of a start prints only the required lack(s) of that part; the second part prints optional and required lacks together before exiting 1, so a missing hub and a missing tmux are both said.
7. `server.ts` says `handler_not_built` only for the default handler (`parsed.handler === undefined`); a `--handler` file that exists and fails to load keeps `server.start.handler_failed`.
8. `docs/configuration.md:37` and `src/desktop/dialogs.ts:3-5` were edited because the change made a sentence in each false (outside the write list, reason in the file table).
9. The supported Node range is the intersection with what the installed packages accept, so a Node the code itself would run on (22.18 and later, 23.6 and later) is refused at `npm ci` and at start. The alternative, a wider `engines` range, makes `npm ci` fail on `write-file-atomic` 8.0.0 under `engine-strict`.

## Host- and user-visible changes, before and after

- `node src/server.ts` over a checkout with no `node_modules`. Before: `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'zod' imported from .../src/lib/data/snapshot/normalise.ts`, exit 1. After: `oculus: The packages are not installed in <checkout>. Run npm ci in <checkout>.`, exit 1, no port opened.
- `node src/server.ts` with no `build/handler.js`. Before: `oculus: the server handler .../build/handler.js could not be loaded: Cannot find module ...`. After: `oculus: the server handler .../build/handler.js does not exist; run npm run build in <checkout> to make it`.
- `node src/server.ts` with `hub` naming no folder or a file. Before: starts and listens over that path. After: `oculus: <path> is not a folder, so there is no research hub to read. Set hub in <engine>/config/local.yml to the folder of the research hub.`, exit 1. With a hub the process may not read: `oculus: <path> cannot be read (EACCES), so there is no research hub to read. Allow oculus to read it, or set hub in <engine>/config/local.yml to the folder of the research hub.`, exit 1.
- A missing `git`, `tmux`, `perl` or `claude_bin` program. Before: silent. After: one `oculus: ...` line each on standard error (text in case 9), the start goes on; start output with everything present is identical to the base (case 12).
- `npm run dev` and `npm run preview` now run `predev` and `prepreview` first (`> node src/lib/server/root/process/start/first-run.ts`); `npm run app` runs `preapp` (`... first-run.ts --install`, Node and packages only). With packages missing a hook prints the packages line and exits 1. With everything present a hook prints nothing; `predev` and `prepreview` print a missing optional program on every start.
- `npm ci` under a Node outside `^24.15.0 || >=26.0.0`: before it installed; after `EBADENGINE`, exit 1. `.npmrc` holds `engine-strict=true`, which also makes `npm install` refuse an unsupported Node or npm.
- The app (seen at the look on landing; Electron not started here): on `npm run app` in a checkout without packages, one dialog `oculus did not start: The packages are not installed in <checkout>. Run npm ci in <checkout>.` with the single button Quit, exit 1. With a hub folder that does not exist or cannot be read: one dialog `oculus did not start: <path> ...` with Quit before the server starts, exit 1. With a program missing, after the window opens, one sheet on the first window: `oculus started without these, so the parts that need them do not work:` and one sentence per program, buttons Continue and Quit; with a slow login shell the `env_slow` sentence comes first in the same sheet, separated by a blank line. State for the look: a checkout whose PATH lacks `tmux` (start the app from a terminal with `PATH=/usr/bin:/bin`), then the same app with `hub:` in a scratch engine's `local.yml` naming a missing folder.

## Anything in the brief that was wrong or impossible

- `--port 8811` (cases 6, 7, 9, 12) is not a flag; ruling A applied.
- "A new subfolder of `src/lib/data/` is allowed" could not pass the folder rule (`src/lib/data/` held ten items); ruling B applied.
- Item 2 says `first-run.ts` imports only `node:` modules, `server/core/program.ts` and the `engineDir` module; it also has `import type { Words } from '../words.ts'`, which node's type stripping erases, so no package is loaded by it (stated in the file's head comment).

## Limitations and sharp edges

- Not verified: any dialog or sheet on screen, and that Electron accepts the `await import()` at the top level of `main.ts` (G48's slow test starts Electron and runs at landing).
- The Node version is not checked in the app (Electron's own Node); the app's install check is the packages lack only.
- On a Node that cannot run a `.ts` file (below 22.18 or 23.6), `node src/server.ts` and the `pre*` hooks end in Node's own error; the install-time `engines` check is what reaches that reader. With `ignore-scripts=true` npm skips the `pre*` hooks; the built server and the app still check.
- In the app, when no window exists after the server starts (`windows.lastMain()` is null), the sheet is not shown; this is the existing behaviour for the `env_slow` sheet, and the forked server also prints the optional lack lines to the app's output.
- The hidden lockfile is compared by version only, not by `resolved` or `integrity`; a package replaced by another build of the same version reads as installed.
- `tests/routes/git/untracked.test.ts` is tagged slow; it is in the verify 2 set above and passed.
- `npm run test:quick` is over its 45 s limit (50.5 s) with the 32 explicit paths while another builder ran on the machine.

## Doc text (for the orchestrator to write at landing)

G73's lines for `agents/guarded.md`:

- Code: `src/lib/server/root/process/start/first-run.ts`.
- Test: `tests/server/root/first-run.test.ts`, the fifteen titles listed above under "G73's test".

`docs/window.md`: no sentence is made false (`grep -n -i "dialog" docs/window.md` finds the sentences about the server ending on its own, the schedule dialog and the tooltip rule, all still true; `docs/window.md:7` `it starts the server itself` is still true). No replacement line is given.
