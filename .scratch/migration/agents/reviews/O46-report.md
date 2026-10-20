# O46 report

Everything in the brief and in every section of `agents/briefs/O46-cases.md` (Z962 included) is done. Two things wait on the landing and are not builder work: Verify 4 prints 3 keys (`entries[].label`, `.root`, `.path` of the hub's `.oculus/bookmarks.yml`) until the orchestrator writes the three `help:` lines below into that file, and with them it prints none; and the guarded titles listed below go into `agents/guarded.md`. One judgment call is for the orchestrator to rule on: `EntryCard.svelte` stays at 524 lines, unsplit (see "Judgment calls").

## Open items of the state file

Quoted from main's `orchestrator-state.md` lines 170-172 (`awk 'NR>=170 && NR<=193'`; lines 173-193 are empty): the list holds no entry.

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

## The ruling carried

Case 20 was ruled in `agents/briefs/O46-cases.md` (Z959), and the build follows it: a record list with `key:` in a workspace file's `settings:` overrides oculus's list entry by entry, in the workspace's order then oculus's other entries; `{ <key>: x, removed: true }` takes oculus's entry out; a map family is merged by key and `x: null` takes a key out; a list without `key:` replaces oculus's whole; the four findings of point 4 name the workspace file and the key; every write of such a value writes what the reader sees with a `removed: true` entry or a `null` key for each of oculus's entries taken out. The tests are `tests/data/sources/config/workspace-layer.test.ts` (8), the rail and Settings writes in `tests/server/edit/config-value.test.ts` and `tests/routes/edit/rail.test.ts`, and G96's case in `tests/state/system/settings/editor-saved.test.ts`.

## The cases' first run

The runs use scratch probes under `$TMPDIR/o46first/` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, `ROOT` the base copy `/Users/axelfaes/workspace/research-hub/.agents/worktrees/O46-base/tools/oculus` and `HUB` the worktree's hub folder `/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O46` (which holds no `local.yml`: `ls -la .oculus` lists `bookmarks.yml config.yml data memories tasks wallpaper workspaces`). `walk.ts` loads `loadConfig(ROOT, { hub: HUB })`, builds `buildPortfolioWithSchemas(HUB, portfolioConfigFrom(config, from), 1, [], createChecker(), { dir: ROOT/config, held: [{ root: 'config', path: '' }] }, 'hub')`, and walks every schema text through `properties`, `additionalProperties`, `items`, `anyOf`, `allOf`, `oneOf` and the definitions, following `$ref`, counting each named property without a non-empty description (a `$ref` property counts as described when its definition is; the level of a record of user-chosen names is walked and not counted).

1. `node walk.ts -v`: `hub-config: top 9/20, all 18/76`, the keys `wallpaper slurm lint statuses statuses.*.label statuses.*.icon statuses.*.color career_host_status career_host_status.*.icon career_host_status.*.label career_host_status.*.color career_score_dims career_score_dims[].field career_score_dims[].badge career_score_dims[].label career_score_tones leads_fit app_settings`. `bookmarks`, `schedules` and `apps_dir` are no keys of it (they are `local.yml` keys: `config/local: top 1/23`).
2. Same run: `config/appearance: top 3/9, all 3/26` (`terminal wallpaper crt`); `config/behavior: top 20/26, all 21/156` (`focus focus.refresh_stale_days file_index slurm processes chat calendar mail editor latex lint writes notes changes files git search literature open apps app_settings`); `config/present: top 1/1, all 1/4` (`defaults`); `config/local: top 1/23, all 1/40` (`literature`). `node groupsof.ts` lists 25 groups (`appearance.yml: terminal wallpaper crt`, `layout.yml: (none)`, `sources.yml: (none)`, `present.yml: defaults`, `local.yml: literature`, behavior's 20); no `status_bar` group exists.
3. Same run: `catalogs/vocab: top 20/20, all 72/113`.
4. Same run: `catalogs/agents: top 1/1, all 12/12`, `catalogs/latex: all 19/19`, `catalogs/meta: all 3/3`, `catalogs/unimath: all 4/4`, `catalogs/glyphs: all 1/1`, `catalogs/icons: all 1/1`, `catalogs/file-nesting: all 1/1`, `catalogs/options: top 1/1, all 37/37`, `text: all 1/1`, `schemas/manifest-schema: all 10/10`. No `options/*.yml` exists (`ls config` prints `appearance.yml behavior.yml catalogs layout.yml present.yml schemas sources.yml text`).
5. Same run: `schemas/deck-schema: top 1/1, all 4/16` and `schemas/cpp-schema: top 1/1, all 4/16`, each `<key> <key>[].from.field <key>[].from.sources <key>[].required.when`.
6. Same run: every registry and collection file lacks `schema schema[].from.field schema[].from.sources schema[].required.when` and its list key (`entries`, `datasets` for `data`); funding, events, education, applications and joint-work lack `entries[].meta[].label` and `.value`; `bookmarks: top 2/5, all 8/23` with `entries[].label entries[].root entries[].path`; `manifest: top 5/38, all 5/59` (`status followup code_availability repository reproduced`); `repo-settings: top 0/1, all 33/41` (`languages.bash` to `languages.yaml`).
7. `node own.ts` prints the workspace file's schema: `{"type":"object","properties":{"folders":{...name, path, repository_scan_depth...},"primary":{"type":["string","null"]}},"additionalProperties":false}`, no `settings` key and no description on any key.
8. to 13. No options folder and no group reader exist on the unchanged tree. `node groups.ts` over a copy of the base config (`$TMPDIR/o46first/eng/config`) whose `catalogs/options.yml` ends with `groups: { slurm: 3 }`: `findings 1` / `config/catalogs/options.yml [groups] key groups is not a key this file takes`. The shipped tree describes no group (cases 1 and 2). The tests: `tests/data/sources/config/catalog/options.test.ts`, describe 'the groups of an options file', on the base copy `1 passed | 12 failed` (table below).
14. `node walk.ts` first line: `findings 0 top keys 89`. `npx vitest run tests/state/workbench/layout/saved/ tests/checks/config/templates.test.ts tests/checks/config/config-folder.test.ts tests/data/sources/config/catalog/options.test.ts --reporter=dot`: `Test Files  6 passed (6)` / `Tests  69 passed | 2 skipped (71)` (the two skips: "config-folder: the cases over a real hub skipped, since OCULUS_TEST_HUB is not set").
15. `node catalog.ts`: `appearance.yml: entries 19, optionPaths 18`, `behavior.yml: entries 106, optionPaths 106`, `layout.yml: entries 11, optionPaths 11`, `present.yml: entries 1, optionPaths 1`, `sources.yml: entries 11, optionPaths 9`, `local.yml: entries 29, optionPaths 0`, `entries 177, optionPaths 145`; `crt.default` is an entry, `theme`, `text_size`, `icons`, `brackets`, `monospace`, `wallpaper.show` and `status_bar.*` are not.
16. `node writes.ts` (scratch engine copy and a scratch hub with `.oculus/workspaces/w.yml`): `case 16 code_theme with a hub: {"changed":["appearance.yml:code_theme"],...,"file":".../eng/config/appearance.yml",...,"before":"tokens","after":"vscode-dark-2026"}`; hashes `eng/config/appearance.yml=81cea9a2` to `afe2bb0f`, `hub/.oculus/workspaces/w.yml=39e214f7` unchanged. The write lands in oculus's own file.
17. Same run: `case 17 wallpaper.image: {"changed":["appearance.yml:wallpaper.image"],...,"file":".../hub/.oculus/config.yml",...,"after":"x.png","created":[]}`; the file reads `wallpaper: { image: x.png }`.
18. Same run, no hub: `case 18 code_theme with no hub: {"changed":["appearance.yml:code_theme"],...,"before":"vscode-dark-2026","after":"dark-plus"}`; nothing is refused.
19. `node ws.ts` (a workspace file with `settings: { wallpaper: { image: x }, colour: red, code_theme: 3 }`, named by a scratch `workspace.json`): `findings [["settings","findings.workspace.unknown_key"]]`, `code_theme in force "tokens"`. One finding for the whole key; nothing of it is read.
20. Reading: `loadConfig` (`src/lib/data/sources/config/merge.ts:170-257` on the base) takes `hub` and `instead` only; no layer applies a `settings:` key, so no override of `arrangements`, `rail` or `audit_ignore` exists. Ruled in `O46-cases.md` (above).
21. Reading: Reset writes the catalog default (`src/lib/state/system/config/write.ts:129` on the base, `reset: (row) => send(row, row.default)`); Modified is `control !== 'family' && !isEqual(value, entry.default)` (`src/lib/state/system/config/rows.ts:292` on the base).
22. Reading: the text size, the theme and the status bar's Hide save into `localStorage` under `oculus.ui.v1` (`src/lib/state/workbench/ui.svelte.ts:53, 583-597` on the base); another tab takes only the instance records and keeps its own appearance (`takeSavedInstances`, `ui.svelte.ts:574-581`), so a second page does not show the new value. The test `tests/state/workbench/options-pages.test.ts` fails at its import on the base copy (table below).
23. The run of case 14: `tests/state/workbench/layout/saved/layout-workspaces.test.ts`, which holds G102's describe 'two browser tabs that change the panes of one page within a second', passed on the unchanged tree. Rewritten over the server stand-in, the file fails at its import on the base copy (table below).
24. The run of case 14: `layout-workspaces.test.ts` (G29) and `layout-unread.test.ts` (G31) passed on the unchanged tree; rewritten, both fail at their import on the base copy (table below).
25. Reading: the breakpoints and watches are saved under `oculus.debug.v1` (`src/lib/state/system/machine/debug/debug.ts:25, 111, 125` on the base) and followed through the `storage` event (`debug.svelte.ts:261`). The test `tests/state/workbench/debug-record.test.ts` fails at its import on the base copy (table below).
26. `grep -rn "localStorage" src | wc -l` on the unchanged tree: `17`, in 11 files (`desktop-windows.svelte.ts`, `ui.svelte.ts`, `layout/saved/storage.ts`, `carry.ts`, `load.ts`, `pdf-place.ts`, `socket.svelte.ts`, `routes/present/print/+page.svelte`, `routes/+page.svelte`, `routes/present/show/+page.svelte`, `routes/find/+page.svelte`). `sessionStorage` is read in `terminal/viewport.ts:87-105`, `layout/saved/storage.ts:99-141`, `navigation/editor-status.svelte.ts:151-162`, `client/context.ts:529` and `routes/present/show/+page.svelte:104-113`: the four values the brief lists.
27. `node local.ts`: `readLocalText('bookmarks: /tmp/marks.yml\nschedules: /tmp/s.yml\napps_dir: /tmp/apps\n', '/tmp')` gives `problems []`; `perOculus('/hub', config)` gives `{"bookmarks":"/tmp/marks.yml","schedules":"/tmp/s.yml","appsDir":"/tmp/apps"}`. The test `tests/server/files/workspace/per-oculus.test.ts` on the base copy: `2 passed | 1 failed`.
28. The run of case 14: `tests/checks/config/templates.test.ts` passed on the unchanged tree; `sed -n 181p docs/templates.md` printed `# commit_message_account: work`, and the `local.yml` block held `bookmarks`, `schedules` and `apps_dir` (`grep -n "^# bookmarks:\|^# schedules:\|^# apps_dir:" docs/templates.md`: lines 220-222).
29. `node walk.ts`: `schemas 43, keys without a description 364`, plus the 5 keys of the workspace file's schema (case 7), which the build's set did not hold.

### Every new or changed test file on the base copy

`$TMPDIR/o46base` is the base copy's `src`, `config` and `utils` with the worktree's `tests` (`diff -rq` of the two `tests` folders prints nothing). Run from there: `npx vitest run $(cat $TMPDIR/o46probe/changed-tests-final.txt) --testTimeout 20000 --reporter=json`, summarised per file by a scratch probe (`$TMPDIR/o46probe/base-final.txt`): `total 683 passed 523 failed 158`, 94 failed suites.

| Test file | On the base copy |
| --- | --- |
| tests/data/run-chain.test.ts | load: Cannot find module `data/helpers/run/chain.ts` |
| tests/checks/config/arrangements.test.ts | 34 passed (describe title only) |
| tests/checks/config/config-folder.test.ts | 24 passed, 6 failed, 2 skipped |
| tests/checks/config/config.test.ts | 14 passed, 25 failed |
| tests/checks/config/templates.test.ts | load: ENOENT `docs/templates.md` (the base copy holds no docs; passed on the unchanged worktree, case 28) |
| tests/checks/tree/boundaries.test.ts | 10 passed, 1 failed |
| tests/data/helpers/hub-names.test.ts | 14 passed (follows the moved names) |
| tests/checks/source/keys.test.ts | 8 passed, 1 failed |
| tests/data/snapshot/references.test.ts | 29 passed, 4 failed |
| tests/data/snapshot/rename.test.ts | 25 passed (follows the moved files) |
| tests/routes/apps/app-fs.test.ts | 7 passed, 16 failed |
| tests/routes/apps/app-private.test.ts | 24 passed, 1 failed |
| tests/routes/edit/audit-mute.test.ts | load: Cannot find module `config-place.ts` |
| tests/routes/edit/config-key.test.ts | load: Cannot find module `config-place.ts` |
| tests/routes/edit/config-value.test.ts | 1 failed |
| tests/routes/edit/rail.test.ts | load: Cannot find module `config-place.ts` |
| tests/routes/files/file.test.ts | 5 passed (fixture follows the moved files) |
| tests/routes/files/history.test.ts | 1 passed, 1 failed |
| tests/routes/files/source.test.ts | 13 passed, 7 failed |
| tests/routes/machine/commands.test.ts | 4 passed, 11 failed |
| tests/routes/sessions/latex.test.ts | load: Cannot find module `settings/latex.ts` |
| tests/server/desktop/window-guard.test.ts | 11 passed (follows the removed save turn) |
| tests/server/edit/config-key.test.ts | 2 passed, 9 failed |
| tests/server/edit/config-value.test.ts | load: Cannot find module `config-place.ts` |
| tests/server/edit/deck-acts.test.ts | 7 passed (fixture follows the moved files) |
| tests/server/root/eslint-switch.test.ts | load: Cannot find module `settings/lint.ts` |
| tests/state/client/held-unsaved.test.ts | 11 passed, 5 failed |
| tests/state/forms/form-draft.test.ts | 15 passed, 1 failed |
| tests/state/workbench/count-row.test.ts | 1 passed (follows the moved files) |
| tests/state/workbench/debug-record.test.ts | load: Cannot find module `page-state/files.ts` |
| tests/state/workbench/options-pages.test.ts | load: Cannot find module `config-place.ts` |
| tests/views/shared/command-menu.test.ts | 2 passed, 1 failed |
| tests/views/shared/faded-lift.test.ts | 7 failed (`$TMPDIR/o46probe/first-faded.txt`); with its import of `Labels.svelte` the file now fails at load: Cannot find module `graph/Labels.svelte` |
| tests/data/helpers/files/nesting.test.ts | 1 passed (import path only) |
| tests/data/sources/config/boards.test.ts | 9 passed (follows the moved files) |
| tests/data/sources/config/counts.test.ts | 9 passed (follows the moved files) |
| tests/data/sources/config/languages.test.ts | 1 failed |
| tests/data/sources/config/rail.test.ts | 2 failed |
| tests/data/sources/config/settings.test.ts | load: Cannot find module `settings/latex.ts` |
| tests/data/sources/config/workspace-layer.test.ts | 8 failed |
| tests/routes/edit/apps/app-setting.test.ts | 10 passed, 2 failed |
| tests/server/files/workspace/per-oculus.test.ts | 2 passed, 1 failed |
| tests/server/machine/apps/watch-no-primary.test.ts | 2 passed (fixture follows the moved files) |
| tests/server/root/process/config-cache.test.ts | load: Cannot find module `settings/latex.ts` |
| tests/shell/panes/strip/app-editor-close.test.ts | 5 failed |
| tests/shell/panes/strip/tab-menu.test.ts | 7 failed |
| tests/state/client/terminal/terminal-close.test.ts | 3 failed |
| tests/state/sessions/source/source.test.ts | 27 passed (fixture follows the removed source) |
| tests/state/sessions/terminal/latex-fast-failure.test.ts | 1 passed (fixture only) |
| tests/state/system/apps/app-keys.test.ts | 71 passed (fixture only) |
| tests/state/system/apps/commands.test.ts | 8 passed (row word only) |
| tests/state/system/settings/editor-saved.test.ts | 4 failed |
| tests/state/system/settings/fold.test.ts | load: Cannot find module `config/view/fold.ts` |
| tests/state/system/settings/machine-section.test.ts | 4 failed |
| tests/state/system/settings/row-writer.test.ts | 7 failed |
| tests/state/workbench/layout/folder-opener.test.ts | 8 passed (fixture only) |
| tests/views/system/workbench/code-theme-choice.test.ts | 1 failed, `Error: no code_theme row` |
| tests/views/system/workbench/settings-fold.test.ts | load: Cannot find module `config/view/fold.ts` |
| tests/data/sources/config/catalog/options.test.ts | 1 passed, 12 failed |
| tests/data/sources/config/local/local.test.ts | 27 passed, 3 failed |
| tests/data/sources/config/local/machine.test.ts | 11 passed (moved file) |
| tests/data/sources/config/local/wrong-port-default.test.ts | 2 passed (moved file) |
| tests/server/machine/apps/manifest/manifest.test.ts | 67 passed, 1 failed |
| tests/server/machine/runs/commands/run.test.ts | load: Cannot find module `data/helpers/run/chain.ts` |
| tests/server/machine/runs/schedules/commands.test.ts | load: Cannot find module `settings/latex.ts`; at its first run (`first-schedules.txt`) `expected { word: 'command-missing', ...(1) } to be null` |
| tests/server/machine/runs/schedules/file.test.ts | 1 passed (fixture only) |
| tests/server/machine/runs/schedules/run.test.ts | load: Cannot find module `settings/latex.ts`; at its first run (`first-schedules.txt`) `expected { refused: 'command-unknown', ...(1) } to match object { terminal: { name: 'sync' } }` |
| tests/state/workbench/layout/saved/layout-saved.test.ts | 5 passed (fixture only) |
| tests/state/workbench/layout/saved/layout-unread.test.ts | load: Cannot find module `page-state/files.ts` |
| tests/state/workbench/layout/saved/layout-workspaces.test.ts | load: Cannot find module `page-state/files.ts` |

The first runs recorded when each test of the cases file was written, before the code: `first-workspace-layer.txt` `Tests 8 failed (8)`; `first-fold.txt` both files `Cannot find module .../config/view/fold.ts`; `first-faded.txt` `Failed Tests 7`; `first-z962b.txt` (`tests/routes/machine/commands.test.ts`, `command-menu.test.ts`, `run-chain.test.ts`) `Tests 12 failed | 6 passed (18)`; `first-schedules.txt` `Tests 4 failed | 1 passed (5)`.

After, on the worktree: `npx vitest run $(cat $TMPDIR/o46probe/changed-tests-final.txt) --testTimeout 20000` prints `Test Files  70 passed (70)` / `Tests  855 passed | 2 skipped (857)`.

## DONE / NOT DONE

| Check | State | Output |
| --- | --- | --- |
| Items 1 to 12 | DONE | the checks below |
| Every section of `O46-cases.md` (case 20, write list, premises, collapsible rows, Z960, Z961, Z962) | DONE | the tests above pass; Z960 is CSS read below |
| Verify 1, the list `npm run diagrams && npm run test:quick -- $(cat $TMPDIR/o46probe/changed-paths4.txt)` (437 paths; `tests/tiers/quick.mjs:21-23` says a builder gives its paths) | DONE, ran 6 times in all | last run, after the last change: `test:quick: 437 changed file(s), from the given paths` / `261 test file(s), 9 essential` / `ok ASCII gate (0.8 s)` / `ok svelte-kit sync (2.3 s)` / `ok prettier (4.4 s): All matched files use Prettier code style!` / `ok svelte-check (8.0 s): ... COMPLETED 528 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` / `ok eslint (9.2 s)` / `ok vitest (61.6 s)` / `test:quick: 63.9 s (limit 45.0 s); every command passed` / `test:quick: over the time limit`. Runs: 1 red from a stale svelte-check cache (cleared with `rm -rf .svelte-kit/.svelte-check`), then 5 green (97.5 s, 94.6 s, 91.9 s, 79.6 s, 63.9 s), every one over the 45 s limit |
| The tests the list leaves out | DONE | `npm run test:checks` (whole suite, run 3 times in all, last after the last change): `Test Files  19 passed (19)` / `Tests  326 passed | 9 skipped (335)`; the 13 changed slow tests (`npx vitest run $(cat $TMPDIR/o46probe/slow-changed.txt) --testTimeout 20000`): `Test Files  13 passed (13)` / `Tests  153 passed (153)` |
| Verify 2 `npx vitest run tests/data/sources/config/ tests/checks/config/ tests/server/edit/ tests/state/workbench/ tests/server/files/workspace/ --testTimeout 20000` | DONE | `Test Files  37 passed (37)` / `Tests  577 passed | 9 skipped (586)` |
| Verify 3 `npm run check` | DONE | `COMPLETED 4242 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| Verify 4, `ROOT=<worktree>/tools/oculus HUB=<worktree> node $TMPDIR/o46first/walk-after.ts -v` | DONE, 3 keys wait on the landing | before (base): `schemas 43, keys without a description 364`, plus the workspace file's 5; after: `findings 0 top keys 98` / `schemas 44, keys without a description 3`, the 3 being `bookmarks: top 0/5, all 3/23` `entries[].label entries[].root entries[].path`; over a scratch hub `$TMPDIR/o46probe/hub29` whose `.oculus/bookmarks.yml` holds the three lines below: `schemas 44, keys without a description 0` |
| Verify 5, the YAML parse | DONE | `python3 -c "import yaml,glob; [yaml.safe_load(open(f)) for f in glob.glob('config/**/*.yml', recursive=True) if not f.endswith('local.yml')]"` exits 0 (the `local.yml` filter is a departure, below) |
| Verify 6, the storage greps | DONE | `grep -rn "localStorage" src` prints nothing; `grep -rn "sessionStorage" src` prints only the four values case 26 allows: `state/sessions/terminal/viewport.ts` (terminal viewports), `state/workbench/layout/saved/storage.ts` (the tab's id), `state/workbench/navigation/editor-status.svelte.ts` and `state/client/context.ts:536` (the focused tab), `routes/present/show/+page.svelte` (the show's flags) |
| Verify 6, the old-path grep | DONE | one line: `tests/routes/hubs/hub-secrets.test.ts:89: 'plain/.oculus/config/sources.yml': 'scan: []\n',`, a hub's own `.oculus/config/` folder in a fixture, which names no file of oculus's `config/` |
| Verify 7 `sh utils/unused-exports.sh` against the base's `unused-exports.txt` | DONE | `Unused exports (230)` / `Unused exported types (112)` against the base's 234 / 112. Added: `rows.ts: WorkspaceText`, `ui.svelte.ts: OptionWrites`, `view/fold.ts: FOLD_AFTER`, each kept because a test imports it (`row-writer.test.ts`, `options-pages.test.ts`, `fold.test.ts`). Removed (13 lines): `browser.ts: BrowserControl, BrowserName, BROWSER_NAMES`, `editor-status.svelte.ts: FocusedSource`, `ui.svelte.ts: Chosen, UI_VERSION`, `config.ts` and `merge.ts: flattenText`, `config-checks.ts: optionText`, `lists/rail.ts: railLists`, `groups.ts: BROWSER_GROUP`, `carry.ts: CARRY_KEY, CARRY_MS` |
| Verify 8 `npm run diagrams`, then `git status --short docs/diagrams` | DONE | the 18 files `docs/diagrams/{layers,layer-data,layer-server,layer-state,layer-ui,layer-shell,layer-views,channels,writes}.{dot,svg}`, each ` M` |
| Verify 9, the prose read | DONE | the added prose lines (`$TMPDIR/o46probe/new-prose2.txt`, 2877 lines of comments, help lines and page sentences by `wc -l`) were read against the rules file and each departure rewritten; the lines written after that list (the head comments of `Labels.svelte`, `Graph.svelte`, `labels.ts`, `faded-lift.test.ts` and the comment of `Nodes.svelte:108-109`) were read the same way. No departure is left that the read found. Machine checks of what a script computes: the ASCII gate passes; no comment line of a changed `.ts` or `.svelte` file passes column 100 except the eslint directives with a `--` reason, which the base holds in the same form (223 on the base) and which the step did not add |
| Size and folder limits | DONE | no changed source file over 880 lines; Svelte over 520: `EntryCard.svelte` 524 (524 at the base, judgment call below); every folder holding a changed file has 10 items or fewer (`ls -A` count per folder, highest 10) |

## The three `help:` lines of the bookmarks scaffold

For the hub's `.oculus/bookmarks.yml`, as `src/lib/server/files/fs/bookmarks.ts` writes them:

```
  - { field: label, type: text, label: Label, required: true, help: "The name the bookmark is listed and found by." }
  - { field: root, type: select, label: Root, help: "The key of the root the file browser serves that the file or folder lies under." }
  - { field: path, type: text, label: Path, help: "The file or folder inside the root; left out, the bookmark is the root's top." }
```

## Test titles under guarded entries

Old title, then the title that takes its place; "added" for a new title. From `node $TMPDIR/o46probe/titles.mjs` (base against worktree) and `grep -nF` of each old title in `agents/guarded.md`.

| Entry | File | Change |
| --- | --- | --- |
| G1 | tests/routes/machine/commands.test.ts | 'refuses a request without the write token' unchanged |
| G8 | tests/server/edit/config-value.test.ts | 'refuses local.yml before any file is read' -> "refuses local.yml without reading the hub's .oculus/local.yml" |
| G8 | tests/server/edit/config-key.test.ts | "refuses the machine's own file without reading it" -> 'refuses the file name local.yml without reading or writing any file' (describe 'an option the catalog does not hold' -> "the machine's own file") |
| G8 | tests/server/edit/config-key.test.ts | describe 'one value written over its own bytes', 'replaces the value and keeps every other byte, the comment on its line included: $row' -> describe 'one value written at its place', "writes the option where it belongs and leaves oculus's defaults file as it was: $row"; its rows 'a key of the hub list, with a hub that holds no settings file' -> 'a key of the hub list lands in the hub settings file, which is made', 'a key of the hub list, with a hub whose settings file is the empty map' -> 'a key of the hub list lands in the hub settings file with the unsaved workspace' (the hub file is still `{}`); added 'refuses a key of the hub list with no primary hub, and writes nothing', 'adds a copy of the value in force for Edit in a file, though the value is unchanged' |
| G8 | tests/server/edit/config-key.test.ts, config-value.test.ts | "refuses a hub settings file that is a link to oculus's own config/local.yml, and writes nothing" removed: oculus's `config/` holds no machine file (the machine file is a hub's `.oculus/local.yml`, `src/lib/data/sources/config/local.ts:1`); added "refuses a workspace file that is a link to a hub's .oculus/local.yml, and writes nothing" |
| G8 | tests/server/edit/config-value.test.ts | describe 'a list written in place', 'adds one item, removes one and swaps two, and keeps every other line' -> describe 'a list written into the workspace file', 'adds the list under settings, then rewrites it in place, and leaves the defaults file'; 'refuses a base the file no longer holds, with the sentence that it changed since it was read' -> 'refuses a base the merge no longer gives, with the sentence that it changed since it was read'; added describe 'a keyed list or a family written as what the merge gives back' with 'writes the rail without a button as every entry then the removed one, and the merge has no button', 'keeps a rail drag in its new order after the merge', 'keeps a shipped theme removed by the Settings editor out of the merged list', 'writes a family without a key as every key then the removed key set to null', 'refuses a family without an entry another option needs, and writes nothing', and 'refuses a list with the unsaved workspace, with the no-workspace-file sentence' |
| G8 | tests/routes/edit/rail.test.ts | 'writes the list in its order and keeps every other line of the file' -> 'keeps a drag in its new order once the merge reads the workspace file again' and 'Hide on the focus button removes it, and the workspace file holds { page: focus, removed: true }'; "writes a button's group chord and group glyph, and refuses a chord that is no letter" -> "writes a button's group chord and refuses a chord that is no letter, writing nothing"; added 'is refused with the no-workspace-file sentence for the unsaved workspace' |
| G8 | tests/routes/edit/audit-mute.test.ts | 'parks one signature and keeps every other byte of the file' -> 'parks one signature in the workspace file, keeps its other bytes and leaves the defaults file' |
| G8 | tests/routes/edit/config-key.test.ts | "writes %s into oculus's own config/appearance.yml and no hub file" -> "writes %s into the workspace file and neither oculus's file nor the hub file"; added describe 'Reset of an option' with "takes code_theme out of the workspace file, so the value in force is oculus's again", 'takes a key of the hub list out of the hub settings file and leaves the empty map', 'writes nothing for an option the workspace file does not set' |
| G9 | tests/routes/edit/rail.test.ts | 'records the change, and the undo puts the list back through the same writer' -> 'records the change, and the undo puts the workspace file back byte for byte' |
| G9 | tests/routes/edit/config-value.test.ts | 'puts the file back byte for byte and logs the undo above the write' -> 'puts the workspace file back byte for byte and logs the undo above the write' (config-key.test.ts keeps its title) |
| G12 | tests/checks/config/config.test.ts (held whole) | 'leaves a local.yml in the config folder out of the merge, clashing key and all' -> 'reads a .yml file at the top of config/ as no defaults file'; 'says a retired key is not read and names the Run unattended choice, against behavior.yml: %s' -> '... against the file it was read from: %s' |
| G13 | tests/data/sources/config/local.test.ts, machine.test.ts, wrong-port-default.test.ts | moved to `tests/data/sources/config/local/` (the folder held 11 items with `workspace-layer.test.ts`); every title kept; G13's Test line names the old paths |
| G13 | tests/data/sources/config/catalog/options.test.ts | added describe 'the groups of an options file': 'reads every shipped options file with no finding and every group described', 'words %s once, naming the file and the group, and reads the rest', 'words a groups: that is no map once and describes no group of the file', 'words every group of a file with no groups: and describes none of them' |
| G13 (proposed) | tests/data/sources/config/workspace-layer.test.ts (new) | describe 'the workspace layer of loadConfig': 'applies an option the file sets and names the file as where it came from', "words a hub key, a key no option names and a value its option refuses, and keeps oculus's value", "takes the workspace's arrangement of one page and oculus's for every other page", 'replaces only the rail entry of its page, at the head of the rail', "takes oculus's rail entry out with removed: true", "takes oculus's key of a map family out with null and keeps the others", 'replaces a list without a key field whole', "words an entry it cannot apply, and oculus's entry stands" |
| G28 | tests/state/client/held-unsaved.test.ts | describe 'a rail reorder over a layout file a source tab holds unsaved text of' with 'sends the write when the config folder lies in the hub as a worktree config folder', 'sends the write when no workspace folder holds the config folder', 'refuses the write and posts nothing when the config folder is the hub own tools/oculus/config' -> describe 'a Settings write over a file a source tab holds unsaved text of' with 'refuses %s and posts nothing when the tab holds the open workspace file', 'sends a rail reorder when the tab holds another workspace file', 'sends a rail reorder when no workspace folder holds the open workspace file', "refuses a write of a key of the hub list when the tab holds the hub's settings file" |
| G28 | tests/state/forms/form-draft.test.ts | 'reads the edits back out of the storage the ui store saved them to' -> 'reads the edits back out of the view states the page state keeps' (not named by G28's line; the file is) |
| G29 | tests/state/workbench/layout/saved/layout-workspaces.test.ts | 'keeps an unreadable value of one workspace under that workspace unread key' -> 'keeps an unreadable value of one workspace as that workspace unread copy'; 'reads no key and writes none before it has come' -> 'reads no arrangement and saves none before it has come'; describe 'the storage event', 'is heard for the key of the open workspace and for no other' -> describe 'the state channel', 'is heard for the arrangement of the open workspace and for no other'; describe 'the turn of the desktop host', 'is asked for the key of the workspace a save is made under, from the envelope read there' -> describe 'the save turn of the server', 'admits a save made from the envelope it holds and answers another with the envelope held' |
| G31 | tests/routes/machine/commands.test.ts | 'refuses to write over a commands.json that is not the shape, leaving it' -> 'refuses a save over $title with its reason, leaving the file' (rows 'a file that is not YAML', 'a commands that is not a list', 'a top that is not a map') |
| G31 | tests/state/workbench/layout/saved/layout-unread.test.ts | 'is kept under the unread key when the next change writes the default' unchanged; 'leaves the unread key empty for a layout that reads and for none saved' -> 'leaves the unread copy empty for a layout that reads and for none saved'; 'shows the default pages for a workbench under the previous key and nothing under the layout key' removed (an arrangement has no storage key) |
| G49 | tests/routes/apps/app-private.test.ts (every row) | 'are the state folder, the hub secrets, the hub local.yml, the oculus config local.yml and each state file local.yml places elsewhere' -> "are the state folder, the hub secrets, the hub local.yml and each state file local.yml or the hub's config.yml places elsewhere" |
| G54 | tests/checks/config/arrangements.test.ts | describe 'the arrangements of config/layout.yml' -> 'the arrangements of config/defaults/layout.yml'; G54's text names `config/layout.yml` |
| G83 | tests/checks/config/templates.test.ts | 'shows every local.yml key of the options catalog in the local.yml template, and no other' -> 'shows every local.yml key of the options folder in the local.yml template, and no other' |
| G96 | tests/state/system/settings/editor-saved.test.ts | the named titles unchanged; added describe 'Reset on a family': 'sends the reset of a family the workspace file sets and shows the default', 'sends nothing for a family the workspace file does not set' |
| G102 | tests/state/workbench/layout/saved/layout-workspaces.test.ts | describe 'two browser tabs that change the panes of one page within a second' unchanged, its rows now over the server stand-in `tests/fixtures/state-server.ts` |

New files no entry names, for the orchestrator to place: `tests/data/run-chain.test.ts`, `tests/server/files/workspace/per-oculus.test.ts`, `tests/server/machine/runs/schedules/commands.test.ts`, `tests/state/system/settings/fold.test.ts`, `tests/state/system/settings/row-writer.test.ts` (rewritten: describes 'a Settings row over the layers' and 'Reset of a Settings row'), `tests/state/workbench/debug-record.test.ts` (case 25), `tests/state/workbench/options-pages.test.ts` (case 22), `tests/views/shared/command-menu.test.ts`, `tests/views/shared/faded-lift.test.ts` (Z961, with 'has its label lifted with it, and not otherwise' for the map's label), `tests/views/system/workbench/code-theme-choice.test.ts`, `tests/views/system/workbench/settings-fold.test.ts`.

## Files

Line counts by `wc -l`, every changed file grouped by folder (437 paths of `$TMPDIR/o46probe/changed-paths4.txt`, plus the pages):

- `./`: HELP.md 541, DESIGN.md 768, README.md 64
- `config/catalogs/`: glyphs.yml 281, icons.yml 280
- `config/defaults/`: appearance.yml 119, behavior.yml 304, layout.yml 335, present.yml 8, sources.yml 107
- `config/options/`: appearance.yml 179, behavior.yml 749, layout.yml 200, present.yml 20, sources.yml 112, and `local.yml` (listed by `ls config/options`, not counted, since no `local.yml` is read)
- `config/schemas/`: manifest-schema.yml 94
- `config/text/`: app.yml 315, findings.yml 375, server.yml 537, ui.yml 149
- `config/text/views/academic/`: present.yml 82, slides.yml 49
- `config/text/views/shared/`: commands.yml 53
- `config/text/views/sources/`: doc.yml 19, files.yml 339
- `config/text/views/system/`: audit.yml 75, history.yml 108, workbench.yml 257
- `docs/`: templates.md 1312, apps.md 816
- `src/desktop/`: app.ts 380, preload.cjs 53
- `src/desktop/decide/`: channels.ts 53
- `src/desktop/windows/`: bridge.ts 291, windows.ts 531
- `src/lib/data/`: index.ts 807
- `src/lib/data/accounts/`: chat.ts 14
- `src/lib/data/helpers/`: guards.ts 122, hub-names.ts 434
- `src/lib/data/helpers/files/`: languages.ts 191, opens-in-program.ts 48, paths.ts 162
- `src/lib/data/helpers/files/apps/`: apps.ts 307, settings.ts 79
- `src/lib/data/helpers/files/apps/tools/`: languages.ts 130
- `src/lib/data/helpers/files/yaml/`: yaml-items.ts 183
- `src/lib/data/helpers/keys/oculus/`: rail-letters.ts 40
- `src/lib/data/helpers/run/`: chain.ts 126, schedules.ts 233
- `src/lib/data/helpers/search/`: query.ts 375
- `src/lib/data/model/`: index.ts 862, model-entities.ts 875, model-sessions.ts 844
- `src/lib/data/model/machine/`: model-machine.ts 799, model-page-state.ts 92
- `src/lib/data/prose/`: languages.ts 162, latex.ts 599
- `src/lib/data/shapes/`: catalog-files.ts 81, catalog-words.ts 91
- `src/lib/data/shapes/catalog-files/`: agents.ts 78, common.ts 28, glyphs.ts 36, latex.ts 105, manifest.ts 66, meta.ts 34, options.ts 127, text.ts 25, vocab.ts 321
- `src/lib/data/snapshot/`: normalise.ts 772
- `src/lib/data/snapshot/references/`: build.ts 225
- `src/lib/data/snapshot/schema/`: hub.ts 85, manifest.ts 167, record.ts 379, run.ts 316, static.ts 80
- `src/lib/data/sources/`: collections.ts 192, config.ts 90, registries.ts 141
- `src/lib/data/sources/config/`: catalogs.ts 370, editor-options.ts 231, folder.ts 29, local.ts 664, rail.ts 224
- `src/lib/data/sources/config/catalog/`: agents.ts 313, latex-editing.ts 36, latex-tables.ts 162, nesting.ts 38, option-findings.ts 78, options.ts 603, schema-findings.ts 27
- `src/lib/data/sources/config/catalog/schemas/`: engine.ts 232, options.ts 308, references.ts 127, settings.ts 48
- `src/lib/data/sources/config/merge/`: hub-layer.ts 93, keyed.ts 149, merge.ts 225, options-folder.ts 112, text.ts 164, tree.ts 32, workspace-file.ts 57, workspace-layer.ts 282
- `src/lib/data/sources/config/sections/`: boards.ts 93, counts.ts 115, findings.ts 46, focus.ts 128, languages.ts 67, themes.ts 74
- `src/lib/data/sources/config/settings/`: connectors.ts 122, files.ts 135, latex.ts 277, lint.ts 53, machine.ts 100, problems.ts 67, reader.ts 181
- `src/lib/data/sources/documents/`: docs.ts 158
- `src/lib/server/content/`: docs.ts 850
- `src/lib/server/content/audit/`: rules.ts 371, scan.ts 65
- `src/lib/server/content/latex/`: endpoint.ts 621, recipes.ts 272
- `src/lib/server/edit/`: writes.ts 752
- `src/lib/server/edit/writes/`: bodies.ts 669, subtasks.ts 385, undo.ts 612
- `src/lib/server/edit/writes/apps/`: gate.ts 130
- `src/lib/server/edit/writes/config/`: app-setting.ts 201, config-checks.ts 516, config-key.ts 176, config-place.ts 252, config-reset.ts 223, config-value.ts 307, config-write.ts 138
- `src/lib/server/edit/writes/config/lists/`: audit-mute.ts 67, folders.ts 347, rail.ts 67
- `src/lib/server/files/`: open.ts 449
- `src/lib/server/files/fs/`: bookmarks.ts 142
- `src/lib/server/files/project/`: project-files.ts 260
- `src/lib/server/files/search/`: search-routes.ts 95, search.ts 738
- `src/lib/server/files/source/`: source-bytes.ts 91, source.ts 344
- `src/lib/server/files/workspace/`: actions.ts 153, folders.ts 294, follow.ts 130, machine-file.ts 62, open.ts 258, paths.ts 69, state.ts 116
- `src/lib/server/files/workspace/page-state/`: files.ts 103, routes.ts 91, writes.ts 210
- `src/lib/server/git/`: git-message.ts 156, git-routes.ts 482
- `src/lib/server/machine/apps/host/`: manager.ts 774
- `src/lib/server/machine/apps/reach/`: private.ts 63
- `src/lib/server/machine/apps/read/`: scan.ts 327
- `src/lib/server/machine/apps/read/across/`: languages.ts 95, stored.ts 104
- `src/lib/server/machine/apps/routes/`: document.ts 96, routes.ts 249
- `src/lib/server/machine/lsp/adapters/`: entry.ts 280
- `src/lib/server/machine/lsp/adapters/markdown/`: settings.ts 35
- `src/lib/server/machine/lsp/adapters/texlab/`: adapter.ts 79, settings.ts 52
- `src/lib/server/machine/lsp/relay/`: relay-apps.ts 353, relay-make.ts 122, relay-options.ts 65
- `src/lib/server/machine/pty/`: sessions.ts 857
- `src/lib/server/machine/pty/latex/`: approval.ts 225, latex.ts 486
- `src/lib/server/machine/runs/commands/`: chain.ts 41, files.ts 397, list.ts 50, routes.ts 259, run.ts 272, write.ts 337
- `src/lib/server/machine/runs/schedules/`: file.ts 578, record.ts 297, routes.ts 287, run.ts 89, watch.ts 849
- `src/lib/server/root/`: context.ts 815
- `src/lib/server/root/process/`: apps-hosts.ts 205, config-cache.ts 226
- `src/lib/server/root/process/context/`: findings.ts 57, machine-defaults.ts 64, rebuild.ts 113
- `src/lib/server/root/watch/`: apps.ts 496, autofetch.ts 250, bookmarks.ts 117, git.ts 878, local.ts 190, own-schemas.ts 35, portfolio.ts 838
- `src/lib/server/sessions/`: overrides.ts 217
- `src/lib/shell/commands/`: CommandForm.svelte 250
- `src/lib/shell/keys/lists/`: argument-list.svelte.ts 111
- `src/lib/shell/keys/rows/`: ArgumentRows.svelte 93, LanguageRows.svelte 116
- `src/lib/shell/panes/`: SplitView.svelte 207
- `src/lib/shell/panes/floats/`: FloatLayer.svelte 221
- `src/lib/shell/panes/strip/`: PaneStrip.svelte 306, strip-shape.ts 67
- `src/lib/shell/rail/`: ActivityRail.svelte 372, rail.ts 159
- `src/lib/shell/window/`: desktop-windows.svelte.ts 71
- `src/lib/state/boards/`: focus.ts 418, ticker.ts 605
- `src/lib/state/boards/board/`: presets.ts 401
- `src/lib/state/client/`: context.ts 871, selectors.svelte.ts 732, socket.svelte.ts 453, writes.svelte.ts 863
- `src/lib/state/client/shapes/`: client-state.ts 199, payloads.ts 298, write-answer.ts 63
- `src/lib/state/feeds/`: lead-application.ts 46
- `src/lib/state/feeds/literature/`: form.ts 130
- `src/lib/state/life/`: notes.ts 21
- `src/lib/state/sessions/latex/`: builds.ts 850, latex.svelte.ts 728, saves.ts 158
- `src/lib/state/sessions/source/`: draft.ts 408, source.svelte.ts 862, write-files.ts 234
- `src/lib/state/sessions/terminal/`: commands.svelte.ts 876, terminal-payloads.ts 105
- `src/lib/state/shared/stores/`: desktop.ts 139, page-state.svelte.ts 494, shapes.ts 491, token-post.ts 29
- `src/lib/state/shared/words/`: appearance.ts 608
- `src/lib/state/sources/explorer/`: file-type.ts 70, pdf-place.ts 155
- `src/lib/state/sources/explorer/acts/`: confirm.ts 22, writing-fix.ts 14
- `src/lib/state/sources/explorer/rows/`: tree-rows.ts 225
- `src/lib/state/system/`: audit.svelte.ts 60
- `src/lib/state/system/apps/`: apps.svelte.ts 875, commands.ts 57
- `src/lib/state/system/apps/frame/`: methods.ts 575
- `src/lib/state/system/config/`: config-files.ts 122, groups.ts 414, messages.ts 64, rows.ts 440, search.ts 92, typed.ts 97, write.ts 145
- `src/lib/state/system/config/editors/`: fields.ts 691, sources.ts 161, writer.ts 184
- `src/lib/state/system/config/view/`: fold.ts 115, gear.ts 18
- `src/lib/state/system/machine/debug/`: debug.svelte.ts 822, debug.ts 323
- `src/lib/state/system/machine/schedules/`: schedule-words.ts 92, schedule.svelte.ts 592
- `src/lib/state/system/machine/usage/`: usage.ts 84
- `src/lib/state/workbench/`: layout.svelte.ts 852, palette-source.svelte.ts 161, ui.svelte.ts 527
- `src/lib/state/workbench/layout/`: index.ts 146, model.ts 426
- `src/lib/state/workbench/layout/open/float/`: folder-opener.ts 168
- `src/lib/state/workbench/layout/saved/`: load.ts 152, rerun.ts 250, storage.ts 165
- `src/lib/state/workbench/navigation/`: arrangement.ts 223, catalogue.ts 383, editor-status.svelte.ts 312, editor-text.ts 153, notice-sources.ts 317, rail.ts 140, registry.ts 294, status.ts 604
- `src/lib/state/workbench/rail-badges/`: rail-badges.svelte.ts 390, rail-badges.ts 112
- `src/lib/themes/`: parse.ts 88, themes.css 107, tokens.css 325
- `src/lib/themes/rice/`: catppuccin.css 231, everforest.css 121, flexoki.css 121, gruvbox.css 112, kanagawa.css 180, phosphor.css 126, rosepine.css 183, singles.css 357, tokyo.css 239
- `src/lib/ui/controls/editor/kit/languages/`: grammars.ts 104
- `src/lib/ui/display/icon-theme/`: held.svelte.ts 101
- `src/lib/ui/frame/`: Surface.svelte 112
- `src/lib/ui/frame/sash/`: sash-size.ts 38, Sash.svelte 196
- `src/lib/ui/theme/`: app-theme.ts 181, theme.ts 156
- `src/lib/ui/tree/row/`: FoldLine.svelte 69
- `src/lib/views/boards/collection/`: Collection.svelte 506, rail-part.ts 22
- `src/lib/views/boards/focus/`: Focus.svelte 271, QuickAdd.svelte 150
- `src/lib/views/boards/projects/`: Projects.svelte 400
- `src/lib/views/feeds/inbox/`: Inbox.svelte 276
- `src/lib/views/sessions/session-detail/`: DetailsBody.svelte 422
- `src/lib/views/sessions/terminal/`: Terminal.svelte 517
- `src/lib/views/sessions/terminal/list/`: list-width.svelte.ts 117
- `src/lib/views/shared/card/`: CardDocs.svelte 247
- `src/lib/views/shared/card/feed/`: LeadCard.svelte 296
- `src/lib/views/shared/forms/entry/`: EntryCard.svelte 524, EntryLink.svelte 82
- `src/lib/views/shared/graph/`: Graph.svelte 443, Labels.svelte 137, labels.ts 202, Nodes.svelte 129
- `src/lib/views/shared/prose/`: Markdown.svelte 424
- `src/lib/views/shared/sessions/`: CommandBar.svelte 180, commands.ts 149
- `src/lib/views/sources/doc/`: Doc.svelte 320
- `src/lib/views/sources/repositories/merge/`: Merge.svelte 319
- `src/lib/views/sources/source/`: Editor.svelte 394
- `src/lib/views/structure/domains/`: DomainCard.svelte 69
- `src/lib/views/structure/pillars/`: ArchivalCard.svelte 119, LineCard.svelte 148
- `src/lib/views/system/audit/`: Audit.svelte 347
- `src/lib/views/system/machine/hpc/`: Hpc.svelte 141
- `src/lib/views/system/machine/usage/`: Usage.svelte 374
- `src/lib/views/system/workbench/`: RailEditor.svelte 333, Settings.svelte 404, Workbenches.svelte 372
- `src/lib/views/system/workbench/editors/`: Editor.svelte 237, FieldControl.svelte 379, Fold.svelte 81, writer.svelte.ts 43
- `src/lib/views/system/workbench/settings/`: Control.svelte 159, EditLink.svelte 101, Item.svelte 431, List.svelte 228, writer.svelte.ts 34
- `src/routes/`: +page.server.ts 78, +page.svelte 329, +page.ts 30, views.ts 247
- `src/routes/api/(files)/fs/`: +server.ts 59
- `src/routes/api/(files)/source/`: +server.ts 28
- `src/routes/api/(machine)/schedules/`: +server.ts 29
- `src/routes/api/(machine)/state/`: +server.ts 20
- `src/routes/api/commands/`: +server.ts 34
- `src/routes/find/`: +page.svelte 131
- `src/routes/present/print/`: +page.svelte 142
- `src/routes/present/show/`: +page.svelte 289
- `tests/checks/config/`: arrangements.test.ts 75, config-folder.test.ts 808, config.test.ts 735, templates.test.ts 84
- `tests/checks/source/`: keys.test.ts 713
- `tests/checks/tree/`: allow-duplication.txt 23, boundaries.test.ts 838
- `tests/data/`: run-chain.test.ts 47
- `tests/data/helpers/`: hub-names.test.ts 186
- `tests/data/helpers/files/`: nesting.test.ts 32
- `tests/data/snapshot/`: reference-hub.ts 289, references.test.ts 517, rename.test.ts 407
- `tests/data/sources/config/`: boards.test.ts 71, counts.test.ts 61, languages.test.ts 40, rail.test.ts 83, settings.test.ts 778, workspace-layer.test.ts 130, wrong-settings.ts 84
- `tests/data/sources/config/catalog/`: options.test.ts 242
- `tests/data/sources/config/local/`: local.test.ts 255, machine.test.ts 209, wrong-port-default.test.ts 36
- `tests/fixtures/`: client.ts 110, state-server.ts 135
- `tests/fixtures/hubs/`: deposit-world.ts 81, workspace.ts 133
- `tests/routes/apps/`: app-fs.test.ts 352, app-private.test.ts 255, apps-fixture.ts 183
- `tests/routes/edit/`: audit-mute.test.ts 46, config-key.test.ts 217, config-value.test.ts 62, rail.test.ts 128, write-fixture.ts 513
- `tests/routes/edit/apps/`: app-setting.test.ts 203
- `tests/routes/files/`: file.test.ts 99, history.test.ts 83, open-fixture.ts 53, source.test.ts 436
- `tests/routes/machine/`: commands.test.ts 249
- `tests/routes/sessions/`: latex.test.ts 95
- `tests/server/desktop/`: window-guard.test.ts 236
- `tests/server/edit/`: config-key.test.ts 348, config-value.test.ts 249, deck-acts.test.ts 376, writes-fixture.ts 205
- `tests/server/files/workspace/`: per-oculus.test.ts 51
- `tests/server/machine/apps/`: watch-no-primary.test.ts 78
- `tests/server/machine/apps/manifest/`: manifest-fixture.ts 144, manifest.test.ts 662
- `tests/server/machine/apps/world/`: hosts-world.ts 481, language-app.ts 368
- `tests/server/machine/lsp/`: lsp-fixture.ts 395
- `tests/server/machine/runs/commands/`: run.test.ts 167
- `tests/server/machine/runs/schedules/`: commands.test.ts 95, file.test.ts 82, run.test.ts 165, schedules-fixture.ts 161
- `tests/server/root/`: context-fixture.ts 228, eslint-switch.test.ts 90
- `tests/server/root/process/`: config-cache.test.ts 320
- `tests/shell/panes/strip/`: app-editor-close.test.ts 175, tab-menu.test.ts 227
- `tests/state/client/`: held-unsaved.test.ts 380
- `tests/state/client/terminal/`: terminal-close.test.ts 180
- `tests/state/forms/`: form-draft.test.ts 297
- `tests/state/sessions/source/`: source.test.ts 499
- `tests/state/sessions/terminal/`: latex-fast-failure.test.ts 69
- `tests/state/system/apps/`: app-keys.test.ts 345, commands.test.ts 97
- `tests/state/system/settings/`: editor-saved.test.ts 103, fold.test.ts 138, machine-section.test.ts 88, row-writer.test.ts 126
- `tests/state/workbench/`: count-row.test.ts 29, debug-record.test.ts 80, options-pages.test.ts 168
- `tests/state/workbench/layout/`: folder-opener.test.ts 120, layout-fixture.ts 119
- `tests/state/workbench/layout/saved/`: layout-saved.test.ts 149, layout-unread.test.ts 107, layout-workspaces.test.ts 303
- `tests/views/shared/`: command-menu.test.ts 71, faded-lift.test.ts 173
- `tests/views/system/workbench/`: code-theme-choice.test.ts 73, settings-fold.test.ts 107, workbench-fixture.ts 59
- `utils/migrations/`: convert-vscode-themes.ts 393

Removed (`diff -rq` against the base copy, "Only in" the base): `config/appearance.yml`, `behavior.yml`, `layout.yml`, `present.yml`, `sources.yml`, `config/catalogs/options.yml`; `src/desktop/decide/save-turn.ts`; `src/lib/data/sources/config/merge.ts` (now the `merge/` folder) and `settings.ts` (now the `settings/` folder); `src/lib/server/machine/runs/commands/resolve.ts` (now `data/helpers/run/chain.ts`) and `saved.ts`; `src/lib/state/shared/stores/storage-events.ts`; `src/lib/state/system/config/other-rows/browser.ts`; `src/lib/state/workbench/layout/saved/carry.ts`; `src/lib/ui/frame/Sash.svelte` and `sash-size.ts` (now `ui/frame/sash/`); `src/lib/views/system/workbench/code-theme-menu.ts`; `src/lib/views/system/workbench/settings/other-rows/BrowserControl.svelte`; `tests/data/sources/config/local.test.ts`, `machine.test.ts`, `wrong-port-default.test.ts` (now under `local/`); `tests/server/desktop/save-turn.test.ts`.

Changed outside the folders "Paths this step writes" and `O46-cases.md` name: `utils/migrations/convert-vscode-themes.ts`, whose `APPEARANCE_PATH` (line 55) read `config/appearance.yml` and now reads `config/defaults/appearance.yml`, with its head comment (lines 11-12); without the change the script reads a file that is no longer there. `docs/apps.md` lines 759 and 788 are in the widened write list (it is in the moved-path grep's 81 files) and are also O44's file, at other lines.

## Judgment calls

- `src/lib/views/shared/forms/entry/EntryCard.svelte` is 524 lines here, at the base and on main (`wc -l` of each). The step changes only its head comment (lines 27-33, the path `config/defaults/behavior.yml`), which keeps its line count. The spec's rule (`agents/spec.md:47`) splits a file the step's change would push past 520; this file was past it before the step, and the tree's size check allows it (it refuses 540, `tests/checks/tree/size.test.ts:30`). It is not split. The other option is to split it by concern in this step; that is a refactor of the entry card unrelated to the settings move, with no test that renders the card. Recommendation: leave it for a step that changes the card; the orchestrator rules.
- `src/lib/views/shared/graph/Graph.svelte` would have reached 532 lines with Z961's lift of the archived label, so the label layer is its own component, `Labels.svelte` (137 lines): the label elements, their measure, the hide rule's inputs and the label styles. Graph.svelte (443 lines) hands it the drawn nodes, the edge lines, the visible part and the hovered, focused and link ids, and calls its exported `measure()` where it measured before (`bind:this`, the pattern of `ui/forms/file/FileChooser.svelte:25`). No test renders Graph.svelte; `faded-lift.test.ts` renders `Labels.svelte` for the lift and reads its style block, and the look at landing is where the map's labels are seen placed, hidden on overlap, following a drag and measured again after a text size change.
- `src/lib/data/sources/config/settings.ts` (871 lines) is split by concern into `settings/connectors.ts`, `files.ts`, `latex.ts`, `lint.ts`, `machine.ts`, `problems.ts`, `reader.ts`; `merge.ts` into `merge/hub-layer.ts`, `keyed.ts`, `merge.ts`, `options-folder.ts`, `text.ts`, `tree.ts`, `workspace-file.ts`, `workspace-layer.ts`.
- The three `local.yml` reader tests moved to `tests/data/sources/config/local/`, since the folder would hold 11 items with `workspace-layer.test.ts`.
- `WorkspaceText` (the open workspace file's text, `rows.ts:147`), `OptionWrites` and `FOLD_AFTER` are exported only for their tests (Verify 7).
- The `code_theme` choice in Settings is grouped: From the theme first, then VS Code dark, VS Code light, Shiki dark, Shiki light (`settings.code_themes_*` keys), the groups built in `state/system/config/editors/sources.ts:95-98` with `views/system/workbench/code-theme-menu.ts` removed.
- Schedule... is offered on the plain entries of `.oculus/commands.yml` (those the form writes), with Edit and Delete; see "What was wrong in the brief".
- Z960's cases (edges of Quick add, Tasks, the awaiting box and Data's intro over a wallpaper) are layout measurements no test environment makes; the change is the CSS of `Surface.svelte` (`:global(body.wall) .surface:not(.inline, .fitted) { padding: 0 8px; }` and the layer's `inset: -4px 0`), with `QuickAdd.svelte` and `Focus.svelte` unchanged against main (`diff` prints nothing), and the edges are for the look at landing.

## Host- and user-visible changes

- Where a setting is written. Before: a change in Settings wrote oculus's own `config/<file>.yml` (case 16), and with no hub nothing was refused (case 18). After: an option that is no key of the hub list is written into the open workspace file's `settings:`, a key of the hub list into the primary hub's `.oculus/config.yml`, oculus's `config/defaults/` is never written, and with the unsaved workspace the write is refused with `server.config_key.no_workspace`: "No workspace file is open, so there is no file to keep this setting in; save the workspace to a file first". Reset removes the key from the file that holds it.
- The values that lived in one browser (`oculus.ui.v1`: theme, text size, status bar items, brackets, icons, monospace, wallpaper, CRT, terminal font, code theme) are options: the controls write them as above, and a second page shows the change after the config push (`options-pages.test.ts`). The Settings rows "this browser" and their texts (`workbench.settings_browser_*`, `settings_this_browser`) are gone.
- Settings' file headers: Open Settings File (`settings.open_settings_file`, opening the file that keeps the reader's values), Show Defaults (opening oculus's defaults file to read), and Save Workspace As... with the unsaved workspace, which also shows "This workspace is not saved to a file, so a change to these settings is refused until it is." Group titles: Look and theme, Behavior, Pages and arrangements, Decks, Project sources, This hub, This machine (`settings.title_*`, keys the base did not have).
- Collapsible rows: a row of more than five entries and every Fields list start folded under a line with a chevron, the title and "N entries" or "N fields"; the fold is kept in the tab's view state; a search inside a folded row unfolds it while the query is in the box.
- The rail: Hide on a button writes the rail with `{ page: <page>, removed: true }` into the workspace file; a drag keeps its order after the push. Settings' Remove on a shipped theme, float, LaTeX recipe or tool, ticker source or family key writes `removed: true` or `null` for it.
- Page state: before, in `localStorage` per browser; after, in `~/.oculus` in four files (`src/lib/server/files/workspace/page-state/files.ts:19-22`): `layouts.json` (each workspace's arrangement), `layout-writes.json` (the last 500 layout writes, `WRITES_KEPT`), `views.json` (each tab's view state) and `debug.json` (breakpoints, watches, chosen configurations, toolbar place), through the route `api/(machine)/state` and the `state` channel. A file that does not read is a finding (`workspace.page_state_unreadable`) and is never written over (`server.state.unreadable`). The desktop app's save turn is gone; the server holds the turn.
- Add Command...: before, saved to `~/.oculus/commands.json`; after, written into the repository's `.oculus/commands.yml` (made from its template when missing), the form listing the chain under "A press runs these lines in this order; Save approves them:". A plain entry's menu: Edit, Schedule..., Delete, Open File; a typed entry: Open File; a found command: Open File. New refusals `server.commands.unread`, `not-held`, `unwritable`, `no-template`, `write_failed`.
- New findings (`config/text/findings.yml`): `config.settings_*` (ten sentences on a workspace file's `settings:`), `options.key`, `options.groups`, `options.group_missing`, `options.group_unknown`, `schema.group_missing`, `schema.group_unknown`.
- Completion menu text, for a sample of keys (`node $TMPDIR/o46probe/sample.ts` over the built schemas): the workspace file's `settings.code_theme`: "How the editors colour code. tokens takes the syntax colours from the UI theme's own code tokens (a VS Code UI theme brings its own TextMate rules). ..."; `settings.rail`: "The rail's pages, one button per page, drawn in this order with the digits 1 to 9 showing the first nine. ... A workspace file's settings: overrides a button by its page, adds a button for a new page, and takes one of oculus's buttons out with { page: <page>, removed: true }; the buttons it names come first, in its order."; `primary`: "The name of the hub folder whose .oculus/config.yml, records and state are the workspace's own. Without it the workspace has no primary hub."; the hub's `bookmarks`: "Where the reader's own bookmarks live. ... This is a setting of the hub, read from the primary hub's .oculus/config.yml; a change is read again at once."; `config/appearance` `wallpaper`: "The picture behind the panels, whether it is drawn and under which themes, how far it is darkened and blurred, and how solid and how blurred the panels and popovers over it stay." Before, 364 keys of the build's schemas and the workspace file's 5 had no text (case 29).
- `bookmarks`, `schedules` and `apps_dir` are keys of the primary hub's `.oculus/config.yml` (`docs/templates.md:104-106`, the config.yml block); `local.yml`'s template shows `commit_message_account` (`docs/templates.md:188`).
- Faded cards (off-pillar and dormant line cards, the archival card, the dormant domain card, the expired lead, an archived map node with its label) show at full strength under the pointer and with the focus inside, eased over 120 ms and at once under reduced motion.
- Over a wallpaper, a block surface's layer lies inside its column and its content is padded 8 px each side.

## What was wrong in the brief

- Z962 point 4 says "Schedule... stays on every command". On the base, Schedule... is offered only on a command saved through the form (`O46-base .../views/shared/sessions/commands.ts:9` "A command saved through the form has Edit, Schedule... and Delete", and the item list at lines 72-75 under `command.source === 'saved'`). The build offers it on the plain entries of `.oculus/commands.yml`, the commands the form now writes (`views/shared/sessions/commands.ts:10-11, 74-77`).
- `DESIGN.md` line 247 on main (248 here) is inside O44's range 245-254 and names `file_icons` of `config/appearance.yml`, a moved path that item 12 rewrites; the step changes that one clause of the line (`the option file_icons (config/defaults/appearance.yml)`), so the landing merges it with O44's change of that range.
- `utils/migrations/convert-decks.mjs` names `config/present.yml` in its head comment and in the comment of its `DATA` constant (lines 2, 17, 42, 230, 241): it is the source the frozen `DATA` was copied from, the script reads no config file, and `utils/` is outside both the write list and Verify 6's grep, so it is unchanged.
- Verify 6's old-path grep cannot print nothing on a correct tree: `tests/routes/hubs/hub-secrets.test.ts:89` plants a hub's `.oculus/config/sources.yml`, a path inside a hub that the pattern `config/sources.yml` matches.
- Verify 5's command reads every `config/**/*.yml`, which includes `config/options/local.yml`, a file the launch forbids reading; it was run with that file filtered out.
- `convert-vscode-themes.ts` reads a moved file and is in no write path (above).

## Departures from the launch rules

- One edit of `src/lib/server/root/context.ts` (the import at line 48 and the call of `registerStateChannel` at line 209) was made by a python command; the file's other changes were made with the editing tool.
- One `ls` and two `grep` reads of the session's own transcript file under `~/.claude/projects/` were made while looking for earlier test runs; nothing was written there.
- `prettier --write` ran over changed files once.
- Two read-only `sed -n` prints were run (one is case 28's `sed -n 181p docs/templates.md`).
- Git: `git -C tools/oculus status` and one more `git status` besides Verify 8's; Verify 8's `git status --short docs/diagrams` was run from the worktree's `tools/oculus` folder, where the paths are relative.
- `rm -rf .svelte-kit/.svelte-check` cleared a stale svelte-check cache inside the worktree.
- Verify 5 ran with `local.yml` filtered out (above).
- Verify 2, the slow tests and the after-runs ran with `--testTimeout 20000`: their paths hold tests tagged slow (`tests/server/edit/config-key.test.ts`, `config-value.test.ts`, `deck-acts.test.ts` among the 13 of `slow-changed.txt`), which their own runner `test:slow` runs with `--testTimeout 20000` (`package.json`), and the tests under `tests/checks` run under `test:checks` with `--testTimeout 0`.
- The scratch base copy `$TMPDIR/o46base` takes the worktree's test files by `cp` for the first runs; nothing under the base copy `.agents/worktrees/O46-base` was written.
