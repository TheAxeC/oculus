# O46 report: stopped at the first run

NOT done: nothing of "What to build" is built. The first run of the cases is done, and one case of the brief's rules gives a wrong result (case 20 under decision 4, below). The builder stopped there, before any code change, as the brief's "Cases" section requires. No file of the tree is changed; this report is the only file written.

## Open items of the state file

Quoted from `orchestrator-state.md` lines 175-177 at the time of writing: the list holds no entry.

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

## The stop: case 20 and decision 4 against the writes item 3 routes into `settings:`

**The rule.** Item 3 sends every option that is no key of `HUB_LIST`, "lists and families included", to the `settings:` map of the open workspace file, and oculus's defaults file is never written. Decision 4 (ruling Z956) says how a list or family there is merged: a record list with `key:` "overrides oculus's entry by entry" by that field, a map family by its keys, and "A workspace cannot remove one of oculus's entries; it overrides it." No sentence says what order the merged list has. Case 20 checks it: `settings: { rail: [{ page: focus, label: F }] }` replaces only the rail entry with `page: focus`.

**What writes those lists today, and what each needs.**

- The rail's own write (`src/lib/server/edit/writes/config/lists/rail.ts:96`, reached from `config-write.ts:81-84`) writes the whole `rail:` list. Two shell actions use it: dragging a page button to a new place (`railMoved`, `src/lib/shell/rail/rail.ts:142-154`) and Hide in the button's right-click menu (`railHidden`, `rail.ts:156-159`), both from `src/lib/shell/rail/ActivityRail.svelte:92-117`.
- The Settings list and family editors edit a draft with `{ do: 'remove' }` and `{ do: 'move' }` (`src/lib/state/system/config/editors/draft.ts:65-66, 234-240`) and save the whole value through `config-value`. That covers every family with `fields` (the record lists `floats`, `themes`, `latex.recipes`, `latex.tools`, `focus.ticker_sources`, and the map families `nav_groups`, `editor.languages`, `boards`, `counts`, `usage_tiers`, `read_limits`, `open.program_ext`). G96's test 'is marked saved once the file holds the empty family, until it is edited' depends on a removal taking effect.

**The result the rule gives.** Under item 3 these writes land in `settings:`. Under decision 4 the merge then puts back every oculus entry the written list leaves out, and the order is undefined (if oculus's order is kept, a written order is ignored). So:

- Hide on the `focus` rail button writes `settings: { rail: [<every entry but focus>] }`; the merged `rail` still holds oculus's `focus` entry, and the button stays.
- A drag of a rail button writes the list in a new order; the merged rail keeps oculus's order, and the button goes back.
- Settings' Remove on a theme, a float, a LaTeX recipe or tool, a ticker source, a nav group or an editor language writes the family without it; the merged value still holds it, and the editor shows it again after the config push.
- G96's 'a family whose last entry is removed and saved' writes the empty family; the merged value is oculus's whole family.

Each of these is a working feature on the unchanged tree (rail write: `tests/routes/edit/rail.test.ts` 'writes the list in its order and keeps every other line of the file', in G8).

**Options, for the orchestrator's ruling.**

- (a) Keyed merge with the workspace list deciding order and membership. An entry the workspace list names overrides oculus's entry by its key; the merged list holds the workspace's entries in the workspace's order, then oculus's entries it does not name, in oculus's order; an entry written `{ <key field>: x, removed: true }` in a record list, or `x: null` in a map family, takes oculus's entry out. The rail write and the Settings editors write the list the reader sees in that form: every entry in the reader's order, and a `removed` entry for each oculus entry the reader took out. Pros: Axel's point 3 holds; Hide, drag, Remove and Move keep working; a hand-written override of one entry stays one line. Cons: `removed: true` and the `null` value are new words of the workspace file (a user-visible shape the brief does not name); every list write becomes a difference against oculus's value; the most code of the three.
- (b) A list or family in `settings:` replaces oculus's value whole. Pros: every editor and the rail work as they do; the least code. Cons: it reverses Axel's point 3 ("overrides oculus's list entry by entry by that key"), so automode cannot take it; a workspace must copy the whole rail to change one label.
- (c) Decision 4 as written, with the merged order taken from the workspace list for the entries it names, and the rail's Hide and Settings' Remove of an oculus entry refused with a sentence. Pros: no new word. Cons: two working features stop working (Hide on the rail, Remove in Settings for any shipped entry), and G96's case can no longer hold for a shipped family. This is the lazy option: it drops behaviour to keep the rule small.

Recommendation: (a), since it is the only option that keeps both Axel's point 3 and the features that write these lists.

## Paths the change needs outside "Paths this step writes"

Verify 6 asks that `grep -rn "catalogs/options.yml\|config/appearance.yml\|config/behavior.yml\|config/layout.yml\|config/present.yml\|config/sources.yml" src tests HELP.md DESIGN.md README.md docs` lists nothing that names the old place, and item 12 asks for every sentence the move makes false to be rewritten. On the unchanged tree 81 files outside the write list match that grep (the command and the list are below). Most hits are head comments and doc comments; these are code that reads or names a moved file:

- `src/lib/data/sources/collections.ts:68`: `engineDefaults` reads `join(configDir(engine), 'sources.yml')` itself.
- `src/lib/server/content/docs.ts:698-699`: `layoutFile` is `join(configDir(engine), 'layout.yml')`, used by the config checks and the undo.
- `src/lib/server/edit/writes.ts:334-335`: `behaviorFile` and `layoutFile` of the write target, which the audit mute write (`writes/config/lists/audit-mute.ts`, `audit_ignore` of behavior.yml) and the rail write write into; under item 3 both must write the workspace file's `settings:` instead.
- `src/lib/server/machine/apps/read/across/stored.ts:57, 93`: the findings of the apps' stored values are keyed `config/behavior.yml` and `config/appearance.yml`; `file_icons` moves from oculus's file to the workspace file under item 3, so the file such a finding names changes.

The command that lists the 81 files, run from `tools/oculus` on the unchanged tree:

```
grep -rln "config/appearance.yml\|config/behavior.yml\|config/layout.yml\|config/present.yml\|config/sources.yml\|catalogs/options.yml" src docs HELP.md DESIGN.md README.md | grep -v -E "^(src/lib/data/sources/config/|src/lib/data/shapes/catalog-files|src/lib/data/helpers/hub-names.ts|src/lib/data/snapshot/schema/|src/lib/server/edit/writes/|src/lib/server/files/workspace/|src/lib/server/files/fs/bookmarks.ts|src/lib/server/root/|src/routes/api/\(machine\)/|src/routes/\+page.svelte|src/routes/present/|src/routes/find/|src/lib/state/workbench/|src/lib/state/system/config/|src/lib/state/system/machine/debug/|src/lib/state/client/|src/lib/state/shared/stores/|src/lib/state/sources/explorer/pdf-place.ts|src/lib/views/system/workbench/|src/desktop/|HELP.md|DESIGN.md|README.md|docs/templates.md|docs/data-map.md)" | wc -l
81
```

They lie under `src/lib/ui/`, `src/lib/shell/`, `src/lib/server/content/`, `src/lib/server/edit/writes.ts`, `src/lib/server/machine/`, `src/lib/server/files/` (`open.ts`, `search/`, `project/`), `src/lib/server/git/`, `src/lib/state/` (`shared/words/appearance.ts`, `life/`, `feeds/`, `system/audit.svelte.ts`, `system/machine/usage/`, `boards/`, `sources/explorer/file-type.ts`), `src/lib/data/` (`index.ts`, `snapshot/normalise.ts`, `model/`, `accounts/`, `sources/registries.ts`, `sources/collections.ts`, `sources/documents/`, `prose/`, `helpers/`), `src/lib/views/` (outside `system/workbench/`), `src/lib/themes/` (11 stylesheets) and `src/routes/views.ts`. A ruling that widens the write list to them lets the step meet Verify 6.

## Notes from the first run that change the brief's premises

- The workspace file's schema is not built from the config: it is the static `workspaceFileShape` schema of `src/lib/server/root/watch/own-schemas.ts:24`, the same for every build. Item 3's last bullet (the `settings:` completion) makes it depend on the merged config, so it moves into the build's schemas. Its five keys (`folders`, `folders[].name`, `.path`, `.repository_scan_depth`, `primary`) carry no description today, and item 11 covers the workspace file's schema, so they get one in the step.
- `src/lib/data/sources/config/settings.ts` is 878 lines (`wc -l`); any line the step adds there passes 880, so it is split by concern in the step.
- `catalogOf` over the shipped config gives 177 entries and `optionPaths` 145 paths (case 15); the brief's "Of the 127 entries with a `default:`" counts entries with a default only.

## The cases' first run

The runs use scratch probes under `$TMPDIR/o46first/` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, `ROOT` the base copy `/Users/axelfaes/workspace/research-hub/.agents/worktrees/O46-base/tools/oculus` and `HUB` the worktree's hub folder `/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O46` (which holds no `local.yml`: `ls -la .oculus` lists `bookmarks.yml config.yml data memories tasks wallpaper workspaces`). The test runs are in the worktree, which is the unchanged tree. `walk.ts` loads `loadConfig(ROOT, { hub: HUB })`, builds `buildPortfolioWithSchemas(HUB, portfolioConfigFrom(config, from), 1, [], createChecker(), { dir: ROOT/config, held: [{ root: 'config', path: '' }] }, 'hub')`, and walks every schema text through `properties`, `additionalProperties`, `items`, `anyOf`, `allOf`, `oneOf` and the definitions, following `$ref`, counting each named property without a non-empty description (a `$ref` property counts as described when its definition is; the level of a record of user-chosen names is walked and not counted).

1. `node walk.ts -v`: `hub-config: top 9/20, all 18/76`, the keys `wallpaper slurm lint statuses statuses.*.label statuses.*.icon statuses.*.color career_host_status career_host_status.*.icon career_host_status.*.label career_host_status.*.color career_score_dims career_score_dims[].field career_score_dims[].badge career_score_dims[].label career_score_tones leads_fit app_settings`. `bookmarks`, `schedules` and `apps_dir` are no keys of it (they are `local.yml` keys: `config/local: top 1/23`).
2. Same run: `config/appearance: top 3/9, all 3/26` (`terminal wallpaper crt`); `config/behavior: top 20/26, all 21/156` (`focus focus.refresh_stale_days file_index slurm processes chat calendar mail editor latex lint writes notes changes files git search literature open apps app_settings`); `config/present: top 1/1, all 1/4` (`defaults`); `config/local: top 1/23, all 1/40` (`literature`). `node groupsof.ts` lists 25 groups (`appearance.yml: terminal wallpaper crt`, `layout.yml: (none)`, `sources.yml: (none)`, `present.yml: defaults`, `local.yml: literature`, behavior's 20); no `status_bar` group exists.
3. Same run: `catalogs/vocab: top 20/20, all 72/113`.
4. Same run: `catalogs/agents: top 1/1, all 12/12`, `catalogs/latex: all 19/19`, `catalogs/meta: all 3/3`, `catalogs/unimath: all 4/4`, `catalogs/glyphs: all 1/1`, `catalogs/icons: all 1/1`, `catalogs/file-nesting: all 1/1`, `catalogs/options: top 1/1, all 37/37`, `text: all 1/1`, `schemas/manifest-schema: all 10/10`. No `options/*.yml` exists (`ls config` prints `appearance.yml behavior.yml catalogs layout.yml present.yml schemas sources.yml text`).
5. Same run: `schemas/deck-schema: top 1/1, all 4/16` and `schemas/cpp-schema: top 1/1, all 4/16`, each `<key> <key>[].from.field <key>[].from.sources <key>[].required.when`.
6. Same run: every registry and collection file lacks `schema schema[].from.field schema[].from.sources schema[].required.when` and its list key (`entries`, `datasets` for `data`); funding, events, education, applications and joint-work lack `entries[].meta[].label` and `.value`; `bookmarks: top 2/5, all 8/23` with `entries[].label entries[].root entries[].path`; `manifest: top 5/38, all 5/59` (`status followup code_availability repository reproduced`); `repo-settings: top 0/1, all 33/41` (`languages.bash` to `languages.yaml`).
7. `node own.ts` prints the workspace file's schema: `{"type":"object","properties":{"folders":{...name, path, repository_scan_depth...},"primary":{"type":["string","null"]}},"additionalProperties":false}`, no `settings` key and no description on any key.
8. to 13. No options folder and no group reader exist on the unchanged tree. `node groups.ts` over a copy of the base config (`$TMPDIR/o46first/eng/config`) whose `catalogs/options.yml` ends with `groups: { slurm: 3 }`: `findings 1` / `config/catalogs/options.yml [groups] key groups is not a key this file takes`. The shipped tree describes no group (cases 1 and 2).
14. `node walk.ts` first line: `findings 0 top keys 89`. `npx vitest run tests/state/workbench/layout/saved/ tests/checks/config/templates.test.ts tests/checks/config/config-folder.test.ts tests/data/sources/config/catalog/options.test.ts --reporter=dot`: `Test Files  6 passed (6)` / `Tests  69 passed | 2 skipped (71)` (the two skips: "config-folder: the cases over a real hub skipped, since OCULUS_TEST_HUB is not set").
15. `node catalog.ts`: `appearance.yml: entries 19, optionPaths 18`, `behavior.yml: entries 106, optionPaths 106`, `layout.yml: entries 11, optionPaths 11`, `present.yml: entries 1, optionPaths 1`, `sources.yml: entries 11, optionPaths 9`, `local.yml: entries 29, optionPaths 0`, `entries 177, optionPaths 145`; `crt.default` is an entry, `theme`, `text_size`, `icons`, `brackets`, `monospace`, `wallpaper.show` and `status_bar.*` are not.
16. `node writes.ts` (scratch engine copy and a scratch hub with `.oculus/workspaces/w.yml`): `case 16 code_theme with a hub: {"changed":["appearance.yml:code_theme"],...,"file":".../eng/config/appearance.yml",...,"before":"tokens","after":"vscode-dark-2026"}`; hashes `eng/config/appearance.yml=81cea9a2` to `afe2bb0f`, `hub/.oculus/workspaces/w.yml=39e214f7` unchanged. The write lands in oculus's own file.
17. Same run: `case 17 wallpaper.image: {"changed":["appearance.yml:wallpaper.image"],...,"file":".../hub/.oculus/config.yml",...,"after":"x.png","created":[]}`; the file reads `wallpaper: { image: x.png }`.
18. Same run, no hub: `case 18 code_theme with no hub: {"changed":["appearance.yml:code_theme"],...,"before":"vscode-dark-2026","after":"dark-plus"}`; nothing is refused.
19. `node ws.ts` (a workspace file with `settings: { wallpaper: { image: x }, colour: red, code_theme: 3 }`, named by a scratch `workspace.json`): `findings [["settings","findings.workspace.unknown_key"]]`, `code_theme in force "tokens"`. One finding for the whole key; nothing of it is read.
20. Reading: `loadConfig` (`src/lib/data/sources/config/merge.ts:170-257`) takes `hub` and `instead` only; no layer applies a `settings:` key, so no override of `arrangements`, `rail` or `audit_ignore` exists.
21. Reading: Reset writes the catalog default (`src/lib/state/system/config/write.ts:129`, `reset: (row) => send(row, row.default)`); Modified is `control !== 'family' && !isEqual(value, entry.default)` (`src/lib/state/system/config/rows.ts:292`).
22. Reading: the text size, the theme and the status bar's Hide save into `localStorage` under `oculus.ui.v1` (`src/lib/state/workbench/ui.svelte.ts:53, 583-597`); another tab takes only the instance records and keeps its own appearance (`takeSavedInstances`, `ui.svelte.ts:574-581`), so a second page does not show the new value.
23. The run of case 14: `tests/state/workbench/layout/saved/layout-workspaces.test.ts`, which holds G102's describe 'two browser tabs that change the panes of one page within a second', passed.
24. The run of case 14: `layout-workspaces.test.ts` (G29) and `layout-unread.test.ts` (G31) passed.
25. Reading: the breakpoints and watches are saved under `oculus.debug.v1` (`src/lib/state/system/machine/debug/debug.ts:25, 111, 125`) and followed through the `storage` event (`debug.svelte.ts:261`).
26. `grep -rn "localStorage" src | wc -l`: `17`, in 11 files (`desktop-windows.svelte.ts`, `ui.svelte.ts`, `layout/saved/storage.ts`, `carry.ts`, `load.ts`, `pdf-place.ts`, `socket.svelte.ts`, `routes/present/print/+page.svelte`, `routes/+page.svelte`, `routes/present/show/+page.svelte`, `routes/find/+page.svelte`). `sessionStorage` is read in `terminal/viewport.ts:87-105`, `layout/saved/storage.ts:99-141`, `navigation/editor-status.svelte.ts:151-162`, `client/context.ts:529` and `routes/present/show/+page.svelte:104-113`: the four values the brief lists.
27. `node local.ts`: `readLocalText('bookmarks: /tmp/marks.yml\nschedules: /tmp/s.yml\napps_dir: /tmp/apps\n', '/tmp')` gives `problems []`; `perOculus('/hub', config)` gives `{"bookmarks":"/tmp/marks.yml","schedules":"/tmp/s.yml","appsDir":"/tmp/apps"}`.
28. The run of case 14: `tests/checks/config/templates.test.ts` passed; `sed -n 181p docs/templates.md` prints `# commit_message_account: work`, and the `local.yml` block holds `bookmarks`, `schedules` and `apps_dir` (`grep -n "^# bookmarks:\|^# schedules:\|^# apps_dir:" docs/templates.md`: lines 220-222).
29. `node walk.ts`: `schemas 43, keys without a description 364`, plus the 5 keys of the workspace file's schema (case 7), which the build's set does not hold.

## DONE / NOT DONE

| Deliverable | State | Proof |
| --- | --- | --- |
| First run of every case | DONE | the 29 rows above, each with its command and output |
| Items 1 to 12 of "What to build" | NOT DONE | stopped at the first run for the ruling on case 20 |
| Verify 1 to 9 | NOT DONE | no change to verify |
| Tests under the guarded entries | NOT DONE | none written; no test title added or renamed |
| The three `help:` lines of the bookmarks scaffold | NOT DONE | item 10 not built |

## Files

Changed: this report only. No file under `src`, `tests`, `config`, `docs` or the pages was changed, and no script was written in the repository; the probes are files under `$TMPDIR/o46first/`.
