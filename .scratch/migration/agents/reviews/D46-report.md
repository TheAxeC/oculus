NOT DONE: the cases that need the running page (3 and 4 inside a real Monaco editor, 5's print dialog, 6's look, 21, 24 and the visual side of 7, 9 and 11) are not run here, because the launch rules forbid starting the app, a server or a browser; the file-matching worker is run as a real Node worker thread over 100,000 names and bundled by Vite, not as a browser Worker. Everything else in the brief, the three rulings and the extended paths is done.

# D46 report: the VS Code palette keys

## Open items of the state file (verbatim, `orchestrator-state.md` in the main checkout, read at the moment of writing)

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

The list holds no entry.

## The rulings this report carries

1. Cases ruling, items 1 to 5 (`agents/briefs/D46-cases.md`): case 9 option A, `tabForKind` in `state/workbench/layout/instance.ts` exported through `layout/index.ts`; `opening.ts`, `read-again.ts` and the two opening tests import it from there; the read-kind-and-open-tab call is `paletteSource.openFile`, with `readFileKind` and `holds` handed in by `context.ts`; `file-type.ts` and `ops.svelte.ts` are not written. Option C (loosening `order.ts`) is the lazy option and was refused. The write list was extended by the named paths. Case 18's `.agents/plan.yaml` clause ran on a synthetic root. Ctrl+Shift+P off macOS stays in `gridKeys`. The 50 ms bound holds for every keystroke.
2. Second section (Z754), option B: the file mode's matching runs in a web worker; the page thread prepares nothing, posts each query with a number, draws only the newest answer, keeps the last rows while the newest query waits, ends the worker on close or replacement; `fileList` keeps a synchronous form. The lazy options were A (accept the stock figures), and C and D changed what a query finds.
3. Third section (open item 28, ruled (a) by Axel): `F1` removed from `FAMILIES` in `tests/checks/source/history.test.ts`, the file added to the paths. Option C (reword the key name away) was the lazy option.

Disclosures:
- I ran one read-only `git status` early on, which the launch rules forbid. It changed nothing.
- `tests/routes/files/search.test.ts` is outside the first write list; its route options now require `maxNames` and `hub`, so it gained `maxNames: 100, hub: '/hub'`. The ruling added it to the paths.

## DONE / NOT DONE

All commands run from `tools/oculus` in the worktree; outputs as printed.

| Check | Result |
|---|---|
| `npm run diagrams && npm run test:quick` (once, after the last change) | `ok prettier (10.4 s): All matched files use Prettier code style!`, `ok ASCII gate (11.4 s)`, `ok svelte-kit sync (23.9 s)`, `ok eslint (48.7 s)`, `ok svelte-check (55.9 s): 1791558683348 COMPLETED 444 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok vitest (85.3 s): Duration  70.93s (transform 98.67s, setup 0ms, import 178.62s, tests 87.38s, environment 401ms)`, `test:quick: 96.0 s (limit 45.0 s); every command passed`, `test:quick: over the time limit` (load average 15 to 19 from the other worktrees). `npm run diagrams`: `exit 0`. |
| ASCII gate exit status | the gate is inside `test:quick` (`ok ASCII gate`); `LC_ALL=C grep -rln '[^ -~]'` over the new files prints nothing |
| `npx vitest run --testTimeout 0 --hookTimeout 0 tests/checks` | `Test Files  17 passed (17)`, `Tests  248 passed (248)` |
| `npx vitest run --testTimeout 0 --hookTimeout 0 tests/server/files/search.test.ts tests/routes/files/search.test.ts tests/checks/source/keys.test.ts tests/checks/tree/size.test.ts tests/checks/tree/boundaries.test.ts tests/checks/config/config-folder.test.ts tests/checks/source tests/checks/diagrams tests/checks/config` | `Test Files  13 passed (13)`, `Tests  178 passed (178)` |
| `npx vitest run tests/state/sources/search` | `Test Files  2 passed (2)`, `Tests  21 passed (21)` |
| `npx vitest run tests/server/files/search.test.ts tests/routes/files/search.test.ts tests/data/sources/config/settings.test.ts tests/views/shared/explorer` | `Test Files  6 passed (6)`, `Tests  98 passed (98)` |
| `npx vitest run tests/checks/source/history.test.ts` | before the F1 change: 2 failed, 1 passed; after: `Test Files  1 passed (1)`, `Tests  3 passed (3)` (lines named below) |
| `npm run check` | `COMPLETED 3572 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `sh utils/folder-check.sh` | exit 0 |
| `sh utils/unused-exports.sh` | 364 lines; the base's `unused-exports.txt` has 364. One line differs: `layout/index.ts` no longer lists `pageLeaves`, which `shownTrees` now uses |
| `wc -l` of the size list | `Palette.svelte` 516, `Workbench.svelte` 520, `workbench-keys.svelte.ts` 559, `server/files/search.ts` 637, `palette.ts` 556, `ops.svelte.ts` 680 (not written), `search.svelte.ts` 533, `context.ts` 858 |

The history check on the step's tree before the `FAMILIES` change named: `src/lib/shell/Workbench.svelte:278`, `src/lib/shell/keys/Palette.svelte:4`, `src/lib/state/workbench/navigation/editor-status.svelte.ts:15`, `src/lib/state/workbench/palette.ts:474` and `:478`, `src/lib/ui/controls/editor/chords.ts:3` and `:86`, `src/lib/views/sessions/terminal/grid/grid-keys.ts:2` (comments), and `HELP.md:81`, `docs/window.md:76` (documents). Each names the key F1.

Not run: `npm run test:landing` (the plan runs it at landing), the slow tests, the app's build.

## Terms

No glossary (`ls docs` holds no `glossary.md`).

## Cases, first run on the unchanged tree

Run by probe tests in `$TMPDIR/d46/` (outside the worktree) against the worktree before any change; outputs `$TMPDIR/d46/out/first-keys.txt`, `first-server.txt`, `first-perf.txt`.

| Case | First run |
|---|---|
| 1, 2, 4 | Cmd+Shift+P and F1 through `createWorkbenchKeys`: `log=[] defaultPrevented=false`. Nothing opens. |
| 3 | `freedKeys(mac) = [KeyK cmd, KeyK ctrl, F8, F8 shift]`: F1 is not freed, so Monaco's palette opens. |
| 5 | Cmd+P: `log=[] defaultPrevented=false`; the browser's print is not prevented. |
| 6 | `gridKeys` for F1, Cmd+P, Cmd+Shift+P, Ctrl+P (mac and non-mac): all answer `true` (xterm goes on with the key). |
| 7, 10, 11, 17 | No file mode on the tree. |
| 8 | Fuzzysort over the worktree's names: 4086 matches of `rpls`, 210 under `projects/manuscripts/raw-pls/`; the first folder-only match at rank 11 (no index, flat list). |
| 9 | `tabForKind` gives text source, html document, image file, pdf file, other file, missing source, image in an apps folder source. The brief's rule put the call in `state/sources/explorer/` where `order.ts` forbids the import: handed back, ruled option A. |
| 12 | Cmd+K `log=[openPalette("")]`; colon `log=[openPalette(":")]`. |
| 13, 23 | `?list=names` on the unchanged route is read as a search with no query: `400 {"error":"empty"}` for every `list` form; `?q=needle&root=elsewhere`: `400 {"error":"unknown_root"}`; no token: `403 {"error":"token"}`. |
| 14 | No names request; the search's argument vector is built from `SKIP_GLOBS` with no shell string. |
| 15 | `runRipgrep` with a reader that stops at line 10: `lines seen 10, outcome {"code":2,"stderr":"","timedOut":false,"stopped":true}`. |
| 16 | `runRipgrep` with a 1 ms timeout: `{"code":2,"stderr":"","timedOut":true,"stopped":false}`. |
| 18 | `rg --files --hidden` with `SKIP_GLOBS` and `!secrets` at the worktree root: 8977 paths; paths under `secrets/`: 0; `node_modules`: 0; `.git`: 0; `tools/oculus/.scratch/migration/plan.md` listed; `.agents/plan.yaml` not present in the sparse worktree; files over 2 MB listed: 112. |
| 19, 20, 21, 24 | No file mode; the page cases are for the look. |
| 22 | `tools/oculus/config/layout.yml` listed in the hub run and `layout.yml` in the engine run; 81 paths of the hub run lie inside the engine root. |
| 25 | Cmd+K with the key sheet open: `log=[]`; with a confirmation shown: `openPalette("")`. |

Cases the brief's rules got wrong: case 9 (above). Rule: the explorer store holds the call; result: `order.ts` refuses `state/sources` importing `state/workbench`; ruling: option A.

## Cases, run after the change

Probes `keys2`, `server2`, `palette2` (`$TMPDIR/d46/out/after-*.txt`), the unit tests and the checks above.

| Case | After the change |
|---|---|
| 1, 2, 4 | `showPalette(commands)`, `defaultPrevented=true` for Cmd+Shift+P (also with the editor's key reaching the window) and F1. |
| 3 | `freedKeys(mac)` and `(non-mac)` list `{"code":"F1"}`; the context-menu item runs `monaco.editor.registerCommand('editor.action.quickCommand', ...)` which fires `COMMAND_PALETTE_EVENT`, read by `Workbench.svelte:280`. Monaco itself is not run here. |
| 5 | Cmd+P: `showPalette(files)`, `defaultPrevented=true`. The print dialog is not reproduced here. |
| 6 | `gridKeys` answers `false` (xterm does not get the key) for F1, Cmd+P, Cmd+Shift+P on mac and F1, Ctrl+P, Ctrl+Shift+P off mac, and `true` for Ctrl+P on mac; non-mac Ctrl+P opens `showPalette(files)`, Ctrl+Shift+P `showPalette(commands)`. |
| 7 | `openFileEntries(trees, null)` gives `hub:img.png, hub:p.html, hub:x/a.ts, hub:README.md, engine:only.ts`; with `first=b2` the tab `b2` leads; `shownTrees` includes nested page leaves and floats, and the float's tree alone in a float window. |
| 8 | `rpls`: `raw_pls.py`, `rawpls.png`, `rawpls_method.png`, `eq_rawpls.png` first with the name letters marked; the first row whose name carries no matched letter is at rank 139 (`CLAUDE.md`, folder match). |
| 9 | Unit: `paletteSource.openFile` reads the kind, `tabForKind`, `openView(..., {preview:false})`, `keepPreview`, `askFocus`. `tests/views/shared/explorer` 98 passed with the group above. The opened tab and focus on a page are for the look. |
| 10, 11 | `modeOf`: `""` search/files, `":"` commands, `"#a"` symbols. Key handler: with the palette open in search, Cmd+Shift+P and F1 give `showPalette(commands)`, Cmd+P `showPalette(files)`; in files, Cmd+P closes, Cmd+Shift+P switches; in commands, Cmd+Shift+P and F1 close, Cmd+P switches; Cmd+K closes in every mode. |
| 12 | Cmd+K `openPalette("")`, colon `openPalette(":")`, unchanged. |
| 13, 23 | `list=names&root=elsewhere` and `root=` give `400 {"error":"unknown_root"}` with 0 processes started; `list=`, `list=names&list=names`, `list=other`, `list=Names` give `400 {"error":"list"}`; no token `403 {"error":"token"}`. The new G2 case is in the unit run. A request without `list` is a search: `tests/routes/files/search.test.ts` passes. |
| 14 | G7 argument vector: `["--files","--hidden","--glob","!node_modules","--glob","!.git","--glob","!.svelte-kit","--glob","!.svelte-kit-app","--glob","!/secrets","."]`. |
| 15 | `max_names` 5: `cut=true`, hub 5 and inner 0 (sum 5); exactly the 15 names there are: `cut=false`; the child is ended at the cap (`stopped`). |
| 16 | A 1 ms timeout over the worktree: `200 cut=false`, root `wt:0 paths error=timed_out`; the other roots are listed. |
| 17 | Unit (`file-matcher.client.test.ts`): the controller ends the matcher (and its worker) on close and on replacement, and the fake worker's later answers are not read; a second opening asks again. |
| 18 | Synthetic root (the worktree's sparse checkout holds no `.agents/` or `.scratch/` of the plan): `.scratch/x.md`, `.agents/plan.yaml`, `.gitignore`, `big.bin` listed; `ignored.txt`, `node_modules/m/i.js`, `.git/HEAD` and `secrets/token.txt` not listed (the root holds those files). |
| 19 | `layout.yml` lists `hub:tools/oculus/config/layout.yml` and `engine:layout.yml`, each with its root. |
| 20 | `+server.ts` folds `browserRoots` on each request (read, not run). |
| 21, 24 | For the look. The float window reads `shownTrees(..., {float})` (probe: `["float.ts"]`), and `FloatWindow` passes `onpalette`. |
| 22 | The probe lists `engine:layout.yml` and the hub's copy. |
| 25 | Key sheet open: Cmd+K and Cmd+Shift+P `log=[]`; a confirmation shown: Cmd+K `openPalette("")`, Cmd+Shift+P `showPalette(commands)`. |

## The 50 ms bound (option B)

Probe `$TMPDIR/d46/workerprobe.mjs`, output `$TMPDIR/d46/out/wp-final3.txt`. A real `worker_threads` Worker loads `file-match.ts`; 100,000 names (the worktree's 8,987 names repeated under `pkgN/`); every keystroke of each query awaited in turn; best of 3 repetitions. Page thread: the longest block of its event loop (`monitorEventLoopDelay`, 1 ms resolution), which includes receiving the answer, and the `postMessage` call. Worker: from message received to answer posted. Load average 16.9 at the start and 17.1 at the end. Node's messaging stands in for the browser's; no browser was run.

| Query | Page thread, longest block | `postMessage`, max | Worker, best of 3 | Worker, worst repetition |
|---|---|---|---|---|
| rpls | 9.9 ms | 0.02 ms | 9.0 ms | 30.8 ms |
| plan | 5.2 ms | 0.02 ms | 11.0 ms | 20.3 ms |
| oculus plan | 4.8 ms | 0.02 ms | 52.5 ms | 94.9 ms |
| palette rows | 5.3 ms | 0.08 ms | 57.9 ms | 68.8 ms |
| oculus plan md | 3.5 ms | 0.03 ms | 48.0 ms | 59.2 ms |
| raw pls | 2.2 ms | 0.01 ms | 26.1 ms | 31.9 ms |
| src lib | 5.5 ms | 0.02 ms | 30.1 ms | 41.5 ms |
| tools oculus migration | 6.8 ms | 0.05 ms | 53.3 ms | 54.5 ms |
| src lib shell keys palette | 3.6 ms | 0.02 ms | 33.0 ms | 46.0 ms |

- The page thread stays under 10 ms for every keystroke of every query. The ruled bound, under 50 ms of the page's main thread, holds.
- The worker's multi-word times at the keystroke that starts a new word (up to 58 ms best of 3, 95 ms worst repetition under this load) are in the worker; the rows are drawn on the first frame after the answer.
- The names message: its `postMessage` call took 17.6 ms on the page thread in this run and 30.5 and 37.1 ms in the two before it, once per opening. The first query after the names waited 529 ms for the worker to prepare 100,000 names (worker-side 454 ms) while the page kept running. For the hub's own 8,987 names the preparation is about a tenth of that.
- A burst of 14 keystrokes posted together was answered once (id 336).
- Vite bundles the worker: `file-match.worker-*.js` 53.30 kB, with no `svelte` or `zod` in it.

## Files and line counts

New: `src/lib/state/sources/search/file-match.ts` 159, `file-match.worker.ts` 14, `file-matcher.svelte.ts` 111; `src/lib/shell/keys/file-names.svelte.ts` 94; `src/lib/shell/keys/rows/FileRows.svelte` 84, `CommandRows.svelte` 118, `LineRows.svelte` 51; `src/lib/shell/commands/debug-key.ts` 21; `tests/state/sources/search/file-match.test.ts` 179, `file-matcher.client.test.ts` 241.
Changed (lines now): `config/behavior.yml` 315, `config/catalogs/options.yml` 1462, `config/text/app.yml` 258; `docs/files-and-search.md` 152, `docs/window.md` 84, `HELP.md` 190, `DESIGN.md` 586; `docs/diagrams/*` 14 files regenerated by `npm run diagrams`; `src/lib/data/helpers/search/query.ts` 323, `data/model/index.ts` 663, `data/model/model-search.ts` 233, `data/sources/config/settings.ts` 864; `server/files/search-routes.ts` 89, `server/files/search.ts` 637; `shell/keys/palette-modes.ts` 266, `Palette.svelte` 516, `PaletteRow.svelte` 163, `workbench-keys.svelte.ts` 559; `shell/Workbench.svelte` 520; `state/client/context.ts` 858; `state/shared/words/fuzzy.ts` 159; `state/sources/search/search.svelte.ts` 533, `search.ts` 333; `state/workbench/layout/index.ts` 140, `layout/instance.ts` 226, `navigation/editor-status.svelte.ts` 193, `palette-source.svelte.ts` 160, `palette.ts` 556; `ui/controls/editor/chords.ts` 147, `kit/load.ts` 491; `views/sessions/terminal/grid/grid-keys.ts` 37; `views/shared/explorer/opening.ts` 110; `views/sources/source/actions/read-again.ts` 48; `routes/api/(files)/search/+server.ts` 26; tests: `tests/checks/config/config.test.ts` 669, `tests/checks/source/history.test.ts` 186, `tests/data/sources/config/settings.test.ts` 763, `wrong-settings.ts` 84, `tests/routes/files/search.test.ts` 104, `tests/server/files/search.test.ts` 57, `tests/views/shared/explorer/opening-apps.test.ts` 187, `opening.client.test.ts` 93.

Folder counts (`ls | wc -l`): `state/sources/search` 10, `shell/keys` 10, `shell/keys/rows` 9, `shell/commands` 7.

## File table from `diff -rq` against the base

Output in `$TMPDIR/d46/out/diffrq.txt` (62 lines). Paths outside the brief's first write list and the reason:

| Path | Reason |
|---|---|
| `state/workbench/layout/instance.ts`, `layout/index.ts`, `palette-source.svelte.ts`, the two opening tests, `settings.test.ts`, `wrong-settings.ts`, `tests/checks/config/config.test.ts`, `docs/files-and-search.md`, `tests/routes/files/search.test.ts` | the cases ruling (items 1 and 2) |
| `tests/checks/source/history.test.ts` | the third ruling (`F1` out of `FAMILIES`) |
| `state/sources/search/file-match.ts`, `file-match.worker.ts`, `file-matcher.svelte.ts` | the worker, ruling 2: the folder has room (`state/workbench` holds 10 items); the shell may not import them, so the search store hands the matcher out and `palette.ts` re-exports the file types |
| `shell/keys/file-names.svelte.ts`, `rows/FileRows.svelte`, `CommandRows.svelte`, `LineRows.svelte`, `shell/commands/debug-key.ts` | code moved out of `Palette.svelte` and `Workbench.svelte` to keep both at or under 520 (brief item 7) |
| `state/sources/search/search.ts`, `search.svelte.ts` | the names answer's reader and the store calls `names` and `fileMatcher` |
| `data/model/index.ts`, `model-search.ts` | the names answer's type (the brief allows the file holding the search answer's type) |
| `state/shared/words/fuzzy.ts` | the index for repeated searches (brief: only if the weight needs it; it does, for 100,000 names) |
| `docs/diagrams/*` (14 files) | generated by `npm run diagrams`; the new imports changed the layer diagrams, and `tests/checks/diagrams` fails on stale ones |
| `tests/state/sources/search/*` | new tests of the matching and the page's end |

## Each paragraph and head comment the brief lists

| Place | State |
|---|---|
| `HELP.md:79-80` | rewritten: rows for Cmd+P and Cmd+Shift+P/F1 added beside Cmd-K and Cmd+T |
| `DESIGN.md:142` | rewritten: the names request, its reason, and the worker |
| `editor-status.svelte.ts:14-15` | rewritten: names F1 |
| `docs/window.md:72-80` | rewritten: Cmd-K sentence still true; a paragraph added for the new keys and the file mode |
| `config/text/app.yml:13` | rewritten: the key sheet lists the three keys; `:211` `search_tip` (now line 219) still true |
| `Palette.svelte` head comment | rewritten (file mode, worker) |
| `workbench-keys.svelte.ts` head | rewritten (palette key branch) |
| `keys.ts` (`appKey`) | still true |
| `chords.ts` head | rewritten (F1 freed, the context-menu command) |
| `search.ts`, `query.ts`, `search-routes.ts`, the search route | rewritten (names request) |
| `grid-keys.ts` head | rewritten (palette keys kept from the program) |
| `palette.ts` head | rewritten (file mode, worker) |
| `fuzzy.ts` head | rewritten (the index) |

## Every edited existing assertion

| File | Before | After |
|---|---|---|
| `tests/data/sources/config/settings.test.ts` | title `...and for a fraction of hits`; `read({ max_hits: bad, timeout_s: 4 })` to `{ maxHits: 300, timeoutS: 4 }`; `read({ max_hits: 9, timeout_s: bad })` to `{ maxHits: 9, timeoutS: 15 }`; `read({ max_hits: 10.5, timeout_s: 4 })` to `{ maxHits: 300, timeoutS: 4 }` | title `...and for a fraction of a count`; the same three calls with `max_names: 8` and `maxNames: 8` in the value; added `max_names: bad`, `max_names: 10.5` cases and the default `'search.max_names': 7000` in the values table |
| `tests/data/sources/config/wrong-settings.ts` | `search: { max_hits: 0, timeout_s: 0 }` | `search: { max_hits: 0, timeout_s: 0, max_names: 0 }` |
| `tests/checks/config/config.test.ts` | the `search` keys list without `max_names` | adds `'search.max_names'` |
| `tests/routes/files/search.test.ts` | route options without `maxNames`, `hub` | adds `maxNames: 100`, `hub: '/hub'` |
| `tests/views/shared/explorer/opening-apps.test.ts`, `opening.client.test.ts` | `tabForKind` imported from `views/shared/explorer/opening.ts` | imported from `state/workbench/layout/instance.ts` |
| `tests/checks/source/history.test.ts` | `FAMILIES` holds `'F1'` | the entry removed |
| `tests/server/files/search.test.ts` | head comment and import without `runNames` | adds `runNames` to the import, one new `it` (no existing assertion changed) |

## The failing line on the unchanged tree for every added or changed test

Run in a copy of the base under `$TMPDIR/d46/unchanged` with the worktree's `node_modules` and the new test files (`$TMPDIR/d46/out/unchanged-run.txt`).

- `tests/server/files/search.test.ts` > "refuses a names list for a root outside the served list before any process starts": `TypeError: runNames is not a function`.
- `tests/data/sources/config/settings.test.ts` > "answers the default for each value that is not above zero, and for a fraction of a count": `AssertionError: expected { value: { maxHits: 300, …(1) }, …(1) } to match object { value: { maxHits: 300, …(2) }, …(1) }` (`maxNames: 8` missing).
- `tests/checks/config/config.test.ts` > "words each wrong setting against behavior.yml...": `- "search.max_names"` missing from the received list.
- `tests/views/shared/explorer/opening.client.test.ts` (6 cases) and `opening-apps.test.ts` (5 cases): `TypeError: tabForKind is not a function`.
- `tests/state/sources/search/file-match.test.ts`: `Cannot find module '.../src/lib/state/sources/search/file-match.ts'`; `file-matcher.client.test.ts`: `Failed to resolve import ".../file-match.ts"`.
- `tests/routes/files/search.test.ts`: passes on both trees (the added options fields are ignored at run time on the base); it covers the unchanged behaviour of a request without `list`.
- `tests/checks/source/history.test.ts`: on the step's tree before the `FAMILIES` change, 2 failed (lines above); on the base it passes.
- Test judgment: the matcher test's older-answer case and the controller's end-on-replace case would pass only with the dropping and the ending in the code, by reading them. The `file-match.test.ts` ranking and cap cases read the real `fileList`. None is a breakage test.

## Grep after the move (`tabForKind`)

`grep -rn tabForKind src tests docs HELP.md DESIGN.md README.md config --exclude=local.yml` finds 18 lines: the definition in `layout/instance.ts:117`, the export in `layout/index.ts:137`, the users `palette-source.svelte.ts`, `views/shared/explorer/opening.ts`, `views/sources/source/actions/read-again.ts`, and the two opening tests. `DESIGN.md:419` names no import path. `Cmd-K` and `Ctrl+K` in `HELP.md`, `docs/window.md`, `config/text/app.yml` read as before.

## History-word grep over the added lines

`$TMPDIR/d46/added2.txt` (1734 added lines, new files in full), grepped for before, after, used to, no longer, still, previously, formerly, originally, earlier, reverted, instead of, was, were, now, until, again, already. The hits are order words in a mechanism ("before any process starts", "after the roots run", "an earlier key", "installs again", "a palette opened again asks again") and the test titles. None says when code was written or what it replaced.

## Judgment calls

- `root=all` is treated as every root, as the search does.
- The cap applies per root, then the roots are merged in order and cut to the cap; the order inside a root is ripgrep's.
- A root that timed out or failed keeps the names read so far and carries `error`.
- Nested page leaves and floats are included in the empty-query list of open files.
- The row's trail shows the root key only when more than one root holds files.
- The key letter is the typed `event.key`, not `event.code`, as Cmd+K's is.
- `FILE_THRESHOLD` 0.3 applies to queries of several words only (it removes scattered matches, and a threshold slowed single words).
- A file is opened with `keepPreview` and `askFocus`, no `landOn`.
- The list refusal word `list` is not added to `SearchRefusal`.
- The worker answers only the newest of the queries waiting together. The page still posts every keystroke with its number and draws only the newest answer.
- A worker that does not start or breaks becomes a refusal worded by the new catalog key `app.palette.files_matcher_failed`.
- `palette.ts` re-exports `fileValue`, `plainFile`, `FileEntry` and `FileMatch`, and the search store gains `fileMatcher`, because the shell's allow list in `boundaries.test.ts` is not widened.

## Host- and user-visible changes

| Change | Before | After |
|---|---|---|
| Cmd+Shift+P (Ctrl+Shift+P off macOS) and F1 | nothing; F1 opened Monaco's own palette in an editor | open the palette in its command mode, close it when it is open in that mode; F1 and Cmd+Shift+P reach the shell from editors and the terminal |
| Cmd+P (Ctrl+P off macOS) | the browser's print | opens the file mode: files by name across the served roots, 200 rows, the open file tabs with nothing typed |
| Editor right-click "Command Palette" | Monaco's palette | oculus's command mode |
| `GET /api/search?list=names[&root=]` | a search with no query (`400 empty`) | the names of the served roots; `config/behavior.yml` `search.max_names` 100000 |
| Key sheet and HELP | Cmd-K, Cmd+T | plus Cmd+P, Cmd+Shift+P, F1 |

## Anything wrong in the brief

- Item 3 put the read-kind-and-open-tab call on the `explorer` store in `state/sources/explorer/`, which `order.ts` forbids; ruled option A.
- The brief's list of paths omitted the files the 100,000-name bound, the worker and the history check needed; the rulings added them.
- The brief named `F1` in comments and documents and the history check forbids it; ruled (a).
- The brief's bound ("a keystroke is matched in under 50 ms") cannot hold on the page thread for several words at 100,000 names; ruling 2 moved the match to a worker and the bound to the page thread.
