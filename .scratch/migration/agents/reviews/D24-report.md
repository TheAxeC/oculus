# D24 report: the Personal board

**Not done as one run:** `checks.sh` never printed `checks: <n> commands passed` in any of its three runs. Run 1 and run 2 stopped in `npm test` on 5000 ms timeouts of files this step does not touch (run 1: `tests/routes/git/git.test.ts`, `tests/server/edit/feeds.test.ts`, `tests/server/root/hooks-server.test.ts`, `tests/routes/edit/undo-removed.test.ts`, `tests/server/edit/config-key.test.ts`; run 2: `tests/routes/edit/config-key.test.ts`, `tests/routes/git/git.test.ts`, `tests/server/edit/config-key.test.ts`, `tests/server/git/autofetch.test.ts`), the machine being loaded by other agents' runs; each of those files passes alone (`npx vitest run` over the five of run 1: 5 files, 147 tests passed). Run 3 passed `npm test` (430 files passed, 23 skipped; 11302 tests passed, 625 skipped) and stopped in `npm run test:checks` on one 30000 ms timeout of `tests/checks/source/comment-width.test.ts`, which passes alone (2 tests). The six commands of the list were then run one by one on the final tree: `npm run test:checks` exit 0 (29 files passed, 2 skipped; 443 tests passed, 9 skipped), `npm run check` exit 0 (`COMPLETED 2971 FILES 0 ERRORS 0 WARNINGS`), `npm run build` exit 0 (run before the last one-line test edit, which build does not read), `npm run format:check` exit 0, `npm run lint` exit 0, `! LC_ALL=C grep -rna '[^ -~]' src tests` exit 0. After run 3, one test file changed (`tests/checks/config/config-folder.test.ts`, the glyph assertion now prints `key: icon`); it passes (26 tests), and `test:checks`, `check`, `format:check`, `lint` and the ASCII gate were run again after it.

**One limit:** a root directory deleted as a whole sends the watcher no event on this platform (the test that removed a whole root got none), so its card leaves at the next rebuild for any other cause: a change in the hub, a `.oculus` folder removed, or a change of the workspaces file. Removing a root's `.oculus` folder, or its manifest, rebuilds at once (`roots.test.ts`, the case "watches a .oculus folder again that was removed and made again"). This was not fixed by polling the root directories; booking it is the orchestrator's call.

**A rule of the brief was crossed twice:** two shell lines of mine contained a read-only `git diff` (`git diff --stat ... >/dev/null` and `$(git diff --name-only ...)`), output discarded, nothing changed by either. `utils/folder-check.sh` and `checks.sh` run git themselves; those are the brief's own commands.

Number of full-list runs (`checks.sh`): 3. Number of `npm run diagrams` runs: 2 (the second after the last source change; it produced the 10 changed files listed below).

## Open items (the state file's "Open items" section, lines 169-183)

None. `sed -n 169,183p tools/oculus/.scratch/migration/orchestrator-state.md` prints the heading `## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)`, one paragraph saying that an entry leaves the list when Axel rules and that what a review or a look found and no brief covered is booked as its own step in `plan.md`, and blank lines. No entry.

## The cases on the unchanged tree

The base is the copy of the tree at the brief's start, `.../scratchpad/base/tools/oculus`, with `src/` and `config/` unchanged and `tests/` replaced by the final test files (`rsync -a --delete <worktree>/tests/ <base>/tests/`). Command: `npx vitest run` over the files that carry the cases. Result: `Test Files 17 failed | 8 passed | 1 skipped (26)`, `Tests 34 failed | 970 passed | 10 skipped (1014)`. Three files fail at import because the module they test does not exist there (`personal.test.ts` under `tests/data/sources/`, `tests/state/boards/board/` and `tests/views/boards/`: "0 test"), so every case in them fails on the base.

| Case | Test (file: name) | On the base |
|---|---|---|
| 1 three hub side projects, three cards | data/sources/personal: "gives three cards for three folders, each id side:<slug>, none a research project"; checks/config/integrity: "reads every side project of the hub with no finding" | fails at import; integrity is skipped on the base (no hub data in the copy), and with `src/` unchanged in this worktree it failed on the counts test and the side-projects test |
| 2 `x` side, `y` idea on every research surface and on Personal | data/sources/personal: "is on no board, no lane and no audit scan, and the idea beside it is on all of them"; server/machine/pty/context: "lists the research projects and no side project"; views/boards/personal: "draws a card for a side project of a research slug" | fails (import; pty context fails; views file fails at import) |
| 3 deposit, subtask write, manifest write, undo lookup, docs route, project-files route refuse the slug | routes/git/deposit: "holds the manuscript and not the side project", "answers 404 to a POST and a GET that name the side project's slug"; server/edit/writes: "is not found by the manifest write under its slug", "is not found by the subtask writes under its slug", "is not a manifest the undo of a change record looks up"; routes/docs/docs: "answers 404 for the slug of a side project when no portfolio was published"; routes/files/project-files: "answers 404 for the slug of a side project and still answers for a research project" | all 7 fail |
| 4 a root with `status: running`, card `root:<key>`, green | data/sources/personal: "gives a card root:<key> for a root whose manifest says running"; views/boards/personal: "draws the status chip in the tone of the status, with its words" | fails at import |
| 5 a root without `.oculus/` gives no card, no finding | data/sources/personal: "gives nothing, and no finding, for a root without .oculus" and "...for a .oculus that is a file or holds no project.yml" | fails at import |
| 6 shared real directory, hub under another key, symlink | data/sources/personal: "reads one directory once, under the first key", "reads a root that links to another root once, under the first key", "draws nothing for the hub itself under another key, even with a manifest of its own" | fails at import |
| 7 a missing root | data/sources/personal: "gives nothing, no finding and no throw for a root that is not on this machine" | fails at import |
| 8 bad status values, `unknown`, sorted last | data/sources/personal: "reads a status of the vocabulary exactly"; state/boards/board/personal: "sorts by the vocabulary order, then title, with unknown last", "draws a status the vocabulary no longer holds as unknown" | fails at import |
| 9 title fallbacks with a finding | data/sources/personal: "falls back to the root key for a root without a title", "is the same reading for both sources: the repository takes the key as its fallback title" | fails at import |
| 10 keys `venue`, `type`, `id` | data/sources/personal: "names key %s once, with no research finding" (three cases) | fails at import |
| 11 unparseable, empty, list, 70 KiB, directory, symlink, pipe | data/sources/personal, group "the file kinds that are never read" (6 tests) | fails at import |
| 12 links | data/sources/personal: "keeps the links that are texts and names the rest", "draws a link list of one text without a finding"; views/boards/personal: "draws only an address as a link, and every other entry as text", "draws a file address as text" | fails at import |
| 13 `eli5: '<b>x</b>'` drawn as text | views/boards/personal: "shows eli5 markup as its characters" | fails at import |
| 14 `personal_no_manifest`; no folder, no finding | data/sources/personal: "names a folder with no project.yml and draws no card for it", "costs nothing when the hub has no side-projects folder" | fails at import |
| 15 watcher: manifest written, edited, removed | server/root/watch/portfolio/roots: "rebuilds on a manifest written into a .oculus folder that was there, and on its removal", "...that was not there", "rebuilds for the manifest of the .oculus folder and not for another yml beside it", "watches a .oculus folder again that was removed and made again"; names: "names the manifest of a root in its .oculus folder and nothing else of the root", "names the .oculus folder of every root once, however many keys reach one directory" | all fail (roots.test.ts 8 of 8, names.test.ts 2) |
| 16 workspaces-file change rebuilds at the next poll | roots: "reads the roots again at the next tick after the workspaces file changed", "reads the roots once per change of the workspaces file, not once per tick", "drops the hub and engine keys the browser roots carry, and reads the rest"; server/root/context: "builds and closes each process-owned object once and carries its token" | all fail |
| 17 roots change during a rebuild; close during a rebuild | roots: "lets the newest roots win when the file was written while a rebuild was running"; portfolio: "publishes and opens nothing after a close that came during a rebuild" | both fail |
| 18 side slug equal to a research id | data/sources/personal: "keeps a side project that has the slug of a research project, each in its own kind" | fails at import |
| 19 status toggle and search | state/boards/board/personal: "searches title, eli5 and next, whatever the case", "hides the cards of a status that is toggled off", "applies the search and the toggles together"; views/boards/personal: "hides the cards of a status that is toggled off", "searches title, eli5 and next in any case", "draws one toggle per status of the vocabulary, in its order, pressed until pressed off" | fail at import |
| 20 an icon not in `glyphs.yml` fails the glyph test naming it | checks/config/config-folder: "uses glyph names for every configured icon" | fails on the base (no `side_project_status`). Shown with the key present: with `icon: snooze` replaced by `icon: nonesuch_glyph` in the base copy's `vocab.yml`, the test prints `expected [ 'parked: nonesuch_glyph' ] to deeply equal []`; with the real config it passes (26 tests) |
| 21 the empty board shows the catalog sentence | views/boards/personal: "says that no side project has a manifest yet, where one goes and that a repository is read once it is a Files root", "says the search found nothing when cards exist and none match" | fails at import |
| 22 a saved Projects page keeps three tabs; Reset gives four | state/workbench/navigation/arrangement: "keeps its three tabs when its button is pressed", "shows four tabs once the pages are reset from the shipped arrangement" | the first passes on the base (existing behaviour, kept as a guard); the second fails |
| 23 a root path with a space | data/sources/personal: "draws a root whose path holds a space, with the key and the directory as given"; views/boards/personal: "draws a card for a repository whose path holds a space" | fails at import |
| 24 the six drafts parse with zero findings | data/sources/personal: "are read by the reader as one card each, with no finding" | fails at import |

Other tests that fail on the base because of what they list: `registry.test.ts` (2), `catalogue.test.ts` (1), `arrangement.test.ts` (2 more), `config-folder.test.ts` (5 more), `type-scale.test.ts` (2).

## DONE / NOT DONE

| Brief item | State | Proof |
|---|---|---|
| 1 scan rule `side-projects`, tier id, `Tier` | DONE | `config/sources.yml` rule after `projects/ideas`; `Tier` in `src/lib/data/model/model-entities.ts`; `config-folder.test.ts` "names the six research tiers and the side-projects folder..." passes |
| 2 `readManifests` and `folderOf` skip the tier; a test per caller | DONE | `isSideTier` in `src/lib/data/sources/manifests.ts`, used by `readManifests` and `src/lib/server/content/docs.ts`; tests in case 3 pass |
| 3 `readPersonal`, `normalise-personal.ts`, `state/boards/board/personal.ts` | DONE | `npx vitest run tests/data/sources/personal.test.ts`: 51 tests passed |
| 4 `RawPortfolio.personal`, `Entities.personal`, `ENTITY_KINDS`, literals | DONE | `npm run check`: 0 errors (it listed 34 missing literals before they were added); `integrity.test.ts` counts the side tier into `personal` (`derived counts {"projects":94,"personal":3,...}`) |
| 5 `buildPortfolio(..., roots = [])`, `WatchPaths.roots` and `workspacesFile`, `context.ts` | DONE | `tests/server/root/context.test.ts` passes; `ContextDependencies.watchPortfolio` is now `typeof watchPortfolio` |
| 6 watcher over the roots | DONE except the limit above | `npx vitest run tests/server/root/watch/portfolio`: 52 passed over names (11), portfolio (33), roots (8) |
| 7 `SideProject`, 8 `personal_*` finding keys | DONE | `config/text/findings.yml`; `tests/checks/source/keys.test.ts` passes |
| 8 `side_project_status` | DONE | `config/catalogs/vocab.yml`; `sideStatuses` test "are the keys of side_project_status in the vocabulary order..." |
| 9 the view, group, order, label, glyph, badge, text file, `layout.yml` fourth tab | DONE | `registry.test.ts`, `catalogue.test.ts`, `arrangement.test.ts` pass |
| 10 board behaviour | DONE | `tests/views/boards/personal.test.ts`: 20 passed; `type-scale.test.ts` and `chips.test.ts` pass |
| 11 four roots | DONE | `config/sources.yml`; `config-folder.test.ts` "names roots that are on this machine" passes (all four exist here) |
| 12 six manifest drafts | DONE | section "The six manifests" |
| 13 docs | DONE | `HELP.md` row `personal`, vocab row, data-source paragraph; `DESIGN.md` entity list, `Snapshot` sketch, one bullet; `options.yml` `scan` text; `npm run diagrams` exit 0 |
| YAML parse | DONE | `python3 -c "import yaml,sys; ..." config/sources.yml config/catalogs/vocab.yml config/layout.yml config/text/views/boards/personal.yml config/text/findings.yml` printed nothing, exit 0 |
| `sh utils/folder-check.sh` | DONE | exit 0, no output |
| ASCII gate | DONE | the perl command of `spec.md` over `src tests config` printed nothing (there is no `bin/` in the worktree); `LC_ALL=C grep -n '[^ -~]'` over `HELP.md`, `DESIGN.md` and `Personal.svelte` printed nothing |
| Each new test fails on the unchanged tree | DONE | section above |
| `checks.sh` as one passing run | NOT DONE | first paragraph |

## Files (line counts)

Created: `src/lib/views/boards/personal/Personal.svelte` 234; `src/lib/state/boards/board/personal.ts` 158; `src/lib/state/shared/words/status-rows.ts` 46; `src/lib/data/snapshot/normalise-personal.ts` 168; `config/text/views/boards/personal.yml` 18; `tests/data/sources/personal.test.ts` 712; `tests/state/boards/board/personal.test.ts` 246; `tests/state/boards/board/side-fixture.ts` 29; `tests/views/boards/personal.test.ts` 263; `tests/server/root/watch/portfolio/names.test.ts` 195; `tests/server/root/watch/portfolio/roots.test.ts` 261; `tests/server/root/watch/portfolio/start.ts` 69.

Changed: `config/sources.yml` 135; `config/catalogs/vocab.yml` 293; `config/catalogs/options.yml` 623; `config/layout.yml` 181; `config/text/findings.yml` 118; `config/text/app.yml` 67; `src/lib/data/index.ts` 282; `src/lib/data/model/index.ts` 495; `src/lib/data/model/model-entities.ts` 718; `src/lib/data/snapshot/normalise.ts` 778; `src/lib/data/snapshot/validate.ts` 851; `src/lib/data/sources/manifests.ts` 409; `src/lib/server/content/docs.ts` 559; `src/lib/server/root/context.ts` 463; `src/lib/server/root/watch/portfolio.ts` 571; `src/lib/state/boards/career.ts` 84; `src/lib/state/client/selectors.svelte.ts` 535; `src/lib/state/workbench/navigation/registry.ts` 204; `src/lib/state/workbench/rail-badges.svelte.ts` 272; `HELP.md` 303; `DESIGN.md` 420; `docs/diagrams/` layer-data, layer-server, layer-state, layer-views and layers (`.dot` and `.svg`, 10 files).

Tests changed only to add `personal: {}` or `personal: []` (25 files, from the `npm run check` error list): `build-timing`, `normalise`, `validate-shapes`, `validate`, `career` under `tests/data`; `rail-badges-fixture`, `person`, `project-context`, `board-fixture`, `board-software`, `focus-lanes`, `focus`, `graph`, `feeds`, `schema` under `tests/state`; `editor`, `focus-fixture`, `person`, `project`, `projects`, `collection-fixture`, `sessions`, `data`, `venues`, `lines-fixture` under `tests/views`.

Tests changed for behaviour: `tests/routes/git/deposit.test.ts`, `tests/routes/docs/docs.test.ts`, `tests/routes/files/project-files.test.ts`, `tests/server/edit/writes.test.ts`, `tests/server/machine/pty/context.test.ts`, `tests/server/root/context.test.ts`, `tests/server/content/audit.test.ts` (a path in a comment), `tests/checks/config/integrity.test.ts`, `tests/checks/config/config-folder.test.ts`, `tests/state/workbench/navigation/{registry,catalogue,arrangement}.test.ts`, `tests/views/whole/type-scale.test.ts`, `tests/checks/tree/allow-duplication.txt`.

`tests/server/root/watch/portfolio.test.ts` moved to `tests/server/root/watch/portfolio/portfolio.test.ts` (763 lines; it was 877 before this step), with `names.test.ts` (the pure `relevant`, `namedByConfig`, `watchedDirectories` cases), `roots.test.ts` and the shared `start.ts` beside it. The folder `tests/server/root/watch` held ten items, and the size check holds a test file to 900 lines.

## Judgment calls

- `PersonalRoot {key, dir}` is defined in the data layer, because `boundaries.test.ts` forbids data importing server. The server's `Root` is structurally the same. The drop of the keys `hub` and `engine` is in `personalRoots` (`src/lib/server/root/watch/portfolio.ts`), not in `readPersonal` as the brief said; `readPersonal` itself expands `~`, reads one card per real directory and per key, and skips the hub's own real path.
- The view's saved state is `{search, hidden, more}`, one field more than the brief's two: `more` holds the ids of the cards whose explanation is drawn whole, because `Clamp.svelte` needs its open state kept by the caller.
- The status chip and the toggles take their tone from `item.tone`, which `tests/views/whole/chips.test.ts` accepts; a call to `statusTone()` would look the status up in the research legend, which does not hold the side statuses.
- `src/lib/state/shared/words/status-rows.ts` is new: `hostStatuses` of `career.ts` and `sideStatuses` both read their vocabulary through `statusRows`, because the duplication check found the two readers identical. The career output is unchanged (its tests passed in run 3).
- `Vocabulary.sideStatuses` is optional; when the config holds no vocabulary no status is checked. A `null` field of a manifest counts as absent.
- `watchPortfolio`'s rebuild now opens the watched directories before it reads, and checks `isClosed()` after each publish; `isClosed` is a function because a subscriber to a publish can call `close()`, which the narrowing of the variable cannot see.
- The status of each of the six drafts is my reading of its README, listed below; the statuses are yours to correct.
- `config/text/app.yml` and `HELP.md` line 62 read `p1-p4` for the Projects group's keys (they read `p1-p3`), since `tests/views/system/help.test.ts` holds the key sheet to the group's size.
- `tests/checks/tree/allow-duplication.txt` has four entries re-marked. Adding `personal: {}` to the fixtures changed the text of four clones that were already listed, so their marks changed: `board-fixture.ts` with `board-software.test.ts` (`e1b4618dc67d` to `7ee68a422869`, 11 to 12 lines), `board-fixture.ts` with `projects.test.ts` (`c26568076f63` to `71ef45c2b6bd`, 12 to 13 lines, second file at 151), `board-software.test.ts` with `project.test.ts` (`f59911af5b21` to `3fc3a1ea4098`, 17 to 18 lines), `schema.test.ts` with `editor.test.ts` (`3893b3df7b0a` to `cb51a505d1b1`, 12 to 13 lines, at 82 and 86). No entry was added and no clone is allowed that was not already.
- `build-timing.test.ts` (slow, not in `npm test`) times out at the default 5000 ms on the unchanged copy as well as here (`buildPortfolio 200x` took 4842.5 ms there and 4953.1 ms here, `readManifests 200x` 572 and 475 ms on a second pair of runs); it is red on both and I did not change its timeout.
- `src/lib/server/root/context.ts` is also touched by D35; my two hunks are the `watchPortfolio` type in `ContextDependencies` and the `roots`/`workspacesFile` pair in the `make.watchPortfolio` call with `workspacesFile` hoisted above it.
- Slow tests that `npm test` leaves out and that I ran alone: `tests/server/root/watch/portfolio/` (52 tests), `tests/server/edit/writes.test.ts`, `tests/server/git/deposit.test.ts`, `tests/routes/edit/write.test.ts`, `tests/routes/docs/docs.test.ts`, `tests/shell/workbench.test.ts`, `tests/state/client/socket-timing.test.ts`, `tests/ui/theme/colours.test.ts`, `tests/server/core/paths.test.ts` and `tests/views/whole/chips.test.ts` all passed; `tests/data/snapshot/build-timing.test.ts` is the red one above.
- `tests/views/boards/personal.test.ts` does not cover a press: no title is pressed and no Show in Files is pressed (no DOM in this suite). What they point at is `manifestTarget` and `folderTarget` in `tests/state/boards/board/personal.test.ts`.

## User-visible changes, before and after

- Projects page: three tabs (Projects, Coauthor, Archive), now four with Personal after Archive, its badge the number of cards, reached by `p4`. A saved Projects page keeps its three tabs; Reset gives four.
- `side-projects/<slug>/project.yml` folders: before, no board read them; now each is a card on Personal and is read by no research board, lane, audit, chat context, write or deposit.
- Four more roots in `sources.yml` (`ordo`, `scotoma`, `officium`, `youtube-downloader`, each `~/workspace/<name>`): they join the Files view and the roots the git channel lists, as the existing roots do, and each gets a card once it holds `.oculus/project.yml`.
- Findings: eight new `personal_*` messages under `findings.manifests`.

## Grep of the added names

`grep -rlw --exclude=local.yml <name> src tests config HELP.md DESIGN.md README.md`: `readPersonal` in `src/lib/data/index.ts`, `src/lib/data/sources/manifests.ts`, `tests/data/sources/personal.test.ts`, `DESIGN.md`; `isSideTier` in `src/lib/server/content/docs.ts`, `src/lib/data/sources/manifests.ts`; `SIDE_TIER` in `manifests.ts`, `tests/checks/config/integrity.test.ts`; `personalRoots` in `src/lib/server/root/watch/portfolio.ts` only (called there, tested through the watcher); `sideStatuses` in `src/lib/state/boards/board/personal.ts`, `src/lib/state/client/selectors.svelte.ts`, `src/lib/data/index.ts`, `src/lib/data/snapshot/{validate,normalise}.ts`, `src/lib/data/model/index.ts`, `Personal.svelte`, `integrity.test.ts`, `tests/state/boards/board/personal.test.ts`; `sideCards` in `personal.ts`, `selectors.svelte.ts`, `Personal.svelte`, `tests/state/boards/board/personal.test.ts`; `personalBadge` in `src/lib/state/workbench/rail-badges.svelte.ts`, `src/lib/state/workbench/navigation/registry.ts`, `Personal.svelte`; `statusRows` in `status-rows.ts`, `personal.ts`, `career.ts`; `side_project_status` in 11 source and test files, `config/catalogs/vocab.yml` and `DESIGN.md`; `workspacesFile` in `context.ts`, `watch/portfolio.ts`, `watch/git.ts` and five test files. `README.md` names none of them. `tests/data/real-hub.probe.ts` iterates `ENTITY_KINDS`, which now holds `personal`, and needs no change.

## The six manifests

Each draft is for `~/workspace/<repo>/.oculus/project.yml`. None exists yet (`ls -d ~/workspace/<repo>/.oculus` answers "No such file or directory" for all six). The reader's run over all six is `npx vitest run tests/data/sources/personal.test.ts -t "are read by the reader as one card each"`: `the six drafted manifests > are read by the reader as one card each, with no finding`, 1 passed; it plants the six drafts in a temporary directory, reads them through `readPersonal`, `personalFindings` and `buildPortfolio`, and finds six cards `root:<key>` and no finding. The orchestrator adds `!.oculus/project.yml` to `~/workspace/youtube-downloader/.gitignore` (line 4 is `*.yml`) at landing.

### `~/workspace/cathedra/.oculus/project.yml`

```yaml
title: "Cathedra"
status: running
eli5: "A simulation core for games built in C++: a Lisp-like scripting language called rite, an entity-component system called curia, and a coordinator called monastery that runs many scripts over one shared world. Scripts can be reloaded while the game runs and the things already on screen keep going."
next: ""
links: []
```

Reader's run: card `root:cathedra`, status `running`, no finding. `README.md` line 1 `# Cathedra`; line 3 "A simulation core for games: a scripting language, an ECS, and a multi-VM coordinator, built from scratch in C++ ..."; the three libraries at lines 5-7 (rite, curia, monastery) and "hot reload that reaches the *running* world". Status `running`: lines 130-154 list only "Possible future extensions", one of them "Attempted, blocked upstream" and one "not scheduled, because there is no consumer", and the build and test commands at lines 156-170 are in use. `next` is empty: the README names no next action, only possible future extensions.

### `~/workspace/game-engine/.oculus/project.yml`

```yaml
title: "Missal"
status: building
eli5: "Missal, a C++20 game engine whose simulation is a scripting language: the engine handles the window, the graphics card, the files on disk and the frame loop, and the language handles everything that happens in the game world. It runs on desktop and in the browser."
next: ""
links: []
```

Reader's run: card `root:game-engine`, `building`, no finding. `README.md` line 1 `# Missal`; line 3 "A C++20 game engine built from first principles, whose simulation core is a **language**."; line 5 "missal is the host around them: the window, the GPU, the assets on disk, th..."; line 9 `> **Status: in progress.**`, and lines 11-14 "Not built: audio, networking, physics, animation, UI, a 3D renderer, the editor, and save/load. `docs/roadmap/` is the live map, by system." Status `building` rests on line 9. `next` is empty: the README lists what is not built and points to `docs/roadmap/` (the folder holds `core`, `engine`, `execution-order.md`) but names no next action.

### `~/workspace/ordo/.oculus/project.yml`

```yaml
title: "Ordo"
status: running
eli5: "A set of agent skills for Claude Code that turn a multi-step change into a plan: each step gets a written brief, is built in its own git worktree, is reviewed by a fresh reviewer, and reaches the main branch only after its checks pass."
next: ""
links: []
```

Reader's run: card `root:ordo`, `running`, no finding. `README.md` line 1 `# Ordo`; line 3 "Ordo is a set of agent skills for Claude Code that run a multi-step change as a plan."; line 5 "Each step of the plan gets a brief, its written specification, and is built in its own git worktree. A fresh reviewer that changes nothing reviews the step. The step is cherry-picked onto `main` only after its checks pass there." Status `running`: line 176 `utils/pin.sh v1.1.0      # the worktree ~/.local/share/ordo-stable at v1.1.0 ...`, a tagged release in use, and the install and landing sections (lines 71-188). `next` is empty: the README names no next action.

### `~/workspace/scotoma/.oculus/project.yml`

```yaml
title: "scotoma"
status: building
eli5: "A first person horror crawler for the Super Nintendo, built as a ROM that runs in an accurate emulator and on a flash cart. You walk a dark forest on a Mode 7 ground plane, in a game styled after Basilisk."
next: "Step 9 of the order of work: place the hooded figure at the fire, in the keep and at the end, remembering the earlier meetings through an SRAM flag, with his three encounters written as one arc."
links: []
```

Reader's run: card `root:scotoma`, `building`, no finding. `README.md` line 1 `# scotoma`; line 3 "A first person horror crawler for the Super Nintendo. A real one: the deliverable is an `.sfc` ROM that runs in any accurate emulator and on real hardware from a flash cart."; line 5 names Basilisk as the inspiration; line 7 "Steps 1 through 8 of the plan below are done: ..." (status `building`). `next` rests on line 70 of the "Order of work" section (line 56): "9. The wanderer's thread: the hooded figure drawn once (done) placed at the fire, in the keep, and at the end, remembering the earlier meetings through an SRAM flag, with his three encounters written as one arc in our own words." Step 9 is the first step not marked done.

### `~/workspace/officium/.oculus/project.yml`

```yaml
title: "Officium"
status: running
eli5: "A local reader for studying structured documents. It keeps the whole document on screen and highlights the spoken passages and actions of the role you choose, and it also handles ordered study material of text, prompts and question-and-answer pairs."
next: ""
links: []
```

Reader's run: card `root:officium`, `running`, no finding. `README.md` line 1 `# Officium`; line 3 "Officium is a local reader for studying structured documents. It keeps the complete document visible while indexing and highlighting the spoken passages and assigned actions of a selected role. It also supports ordered study material made from explanatory text, prompts, and question-and-answer pairs."; sections `## Run` (line 9), `## Desktop application` (line 20) and `## Verify` (line 266, with `npm test`, `npm run test:browser`, `npm run check`, `npm run lint`) describe a working application. Status `running` rests on those sections; the README states no development status. `next` is empty: the README names no next action (a search of the file for "next", "planned" and "todo" found none).

### `~/workspace/youtube-downloader/.oculus/project.yml`

```yaml
title: "yt-downloader"
status: running
eli5: "A script that downloads and tracks YouTube playlists and channels with yt-dlp from a data file. It keeps a per-playlist archive so nothing is fetched twice, and watched playlists queue new videos for review instead of downloading them."
next: ""
links: []
```

Reader's run: card `root:youtube-downloader`, `running`, no finding. `README.md` line 1 `# yt-downloader`; line 3 "From a given data file, download and track YouTube playlists and channels with `yt-dlp`."; line 5 "...keeps a per-playlist archive so nothing is fetched twice, reports stats, and supports a "watch + triage" flow where new videos in flagged playlists are queued for review instead of being downloaded automatically." Status `running` rests on the install section (lines 7-19) and the PO-token section (line 21, "required"), which describe use of a working script; tree fact: `ls ~/workspace/youtube-downloader` lists `ytdlp.py`, `requirements.txt`, `data.yml`, `stats.yml`. `next` is empty: the README names no next action. Tree fact for landing: `sed -n 4p ~/workspace/youtube-downloader/.gitignore` prints `*.yml`.

# Repair round 1

**Not done:** nothing of the eight rulings is left undone. One limit: the whole-root-removal test was run on macOS only; whether `fs.watch` on a parent folder reports a child's removal the same way on Linux is not verified. The list run at the end printed `checks: 7 commands passed` (run 2 of at most three; command lines below).

No git command was run this round. Ruling 8 changes nothing: the drafts stand as drafted, the files outside the path list are named at landing (the round-0 report lists them, and this round adds only the test files below), and the two read-only `git diff` lines of the first run stay noted in the report above.

## Ruling 1: one place for the roots' filtering

Changed:
- `src/lib/server/root/watch/portfolio.ts:246` `personalRoots(listed, hub, engineConfig)` is the one place that drops the `hub` and `engine` keys, expands `~` with `expandHome` of `server/files/files.ts`, drops a root whose real path is the hub's, the engine config folder's (`configDir(paths.engine)`, the `engineConfig` the watcher holds) or an earlier root's, and drops a second root with a key already seen. The call is at `portfolio.ts:475`. The head comment of `WatchPaths.roots` (`portfolio.ts:72`) says where the filtering is.
- `src/lib/data/sources/manifests.ts:348` `rootPersonal(roots, catalog, personal, findings)` reads the roots it is given, in order; its copies of `expandHome`, `realDir` and the real-path set, and the `homedir` and `realpathSync` imports, are gone. Doc comments updated in `manifests.ts:340`, `src/lib/data/index.ts` (`buildPortfolio`) and `src/lib/data/model/model-entities.ts` (`PersonalRoot`). `DESIGN.md:405` names `personalRoots` as the place.
- Moved: the data tests "reads one directory once", "reads a root that links to another root once", "draws nothing for the hub itself under another key" and "expands a leading ~" are now in `tests/server/root/watch/portfolio/personal-roots.test.ts` (new, 7 tests, in `npm test`), over `personalRoots`. In `tests/data/sources/personal.test.ts:347` the new "reads every root it is given, in order, and filters none" asserts the reader's side.

Failing before the change (the tree as it was at the start of the round):
```
personal-roots.test.ts:52  expected [ { key: 'again', ... }, ... ] to deeply equal [ { key: 'tool', ... } ]   (hub by key and by link)
personal-roots.test.ts:69  expected [ { key: 'cfg', ... }, ... ] to deeply equal [ { key: 'tool', ... } ]     (engine config folder)
personal-roots.test.ts:138 expected [ { key: 'tool', ... }, ... ] to deeply equal [ { key: 'tool', ... } ]     (a second root with a seen key)
```
Watcher-level case `roots.test.ts:171` "draws no card for a root under another key that is the engine config folder", with the engine identity taken out of `personalRoots`: `AssertionError: expected [ 'root:cfg' ] to deeply equal []`. The data case with the pre-round reader put back: `personal.test.ts:353:56 AssertionError: expected [ Array(1) ] to deeply equal [ { kind: 'root', ... }, { ... } ]`.

Passing after: `npx vitest run tests/data/sources/personal.test.ts tests/server/root/watch/portfolio/personal-roots.test.ts` printed `Test Files 2 passed (2)  Tests 55 passed (55)`; the portfolio folder with `tests/server/edit/writes.test.ts` and `tests/routes/docs` printed `Test Files 10 passed (10)  Tests 174 passed (174)`.

## Ruling 2: the words

- `HELP.md:104` (the `personal` row) now names the four statuses (`running`, `building`, `idea`, `parked`), says a side project is on no other board, lane or audit, and says a repository is read once it is a Files root, added with **Add Folder to Workspace...** in the Files view or under `roots:` in `sources.yml`.
- `config/text/views/boards/personal.yml:4` names the control **Add Folder to Workspace...**, as `config/text/views/sources/files.yml:50` words it.
- Test: `tests/views/boards/personal.test.ts:259` asserts the empty sentence contains `catalog['files.menu_add_root']`. Failing with the old sentence: `personal.test.ts:256:26 AssertionError: expected 'No side project has a manifest yet. A...' to contain 'Add Folder to Workspace...'`. Passing after: `Tests 1 passed | 19 skipped (20)`.
- The HELP row is read text; no script checks it.

## Ruling 3: the Focus lanes

- New `tests/state/boards/focus/focus-side-project.test.ts`: a hub with a research project and a side project that both carry `focus: run`, built by `buildPortfolio`, then `laneItems(portfolioProjects(snapshot), lanes(MERGED))`; the side project is on no lane and the research project is on `run`.
- Failing with the side tier read as a research tier (the `isSideTier` skip of `readManifests` taken out):
```
focus-side-project.test.ts:34:48  AssertionError: expected [ 'x', 'y' ] to deeply equal [ 'y' ]
```
- Passing as built: `Test Files 1 passed (1)  Tests 1 passed (1)`.

## Ruling 4: the cases the list runs

- The three write cases (manifest write, subtask writes, undo lookup) moved from `tests/server/edit/writes.test.ts` (slow) to `tests/routes/edit/side-project-writes.test.ts` (new, 3 tests, no slow tag; `tests/routes/edit` holds 8 items). The docs case moved from `tests/routes/docs/docs.test.ts` (slow) to `tests/routes/docs/side-project-docs.test.ts` (new, 1 test; the folder holds 5). The watcher cases stay in `roots.test.ts` and `portfolio.test.ts`, which are slow.
- Failing with the `isSideTier` skip taken out of `readManifests` (`manifests.ts`) and of `folderOf` (`docs.ts`):
```
side-project-docs.test.ts:56:33   AssertionError: expected 200 to be 404
side-project-writes.test.ts:47:21 AssertionError: expected { found: true, ... } to deeply equal { found: false, changed: [], ... }
side-project-writes.test.ts:54:73 AssertionError: expected { found: true, ... } to deeply equal { found: false, changed: [], ... }
side-project-writes.test.ts:61:59 AssertionError: expected { Object (found, value) } to deeply equal { found: false, value: null }
```
- Passing as built: `Test Files 2 passed (2)  Tests 4 passed (4)`, and both files are inside `npm test` (434 passed files in the list run below).

## Ruling 5: the first run, quoted

The base copy is `.../scratchpad/base/tools/oculus` with the final `tests/` synced in (`rsync -a --delete`) and `src/` and `config/` as at the start of the step. One failing line per new test file of the step:

| New file | Fails on the base | Failing line |
|---|---|---|
| `tests/data/sources/personal.test.ts` | at import | `Error: Cannot find module '../../../src/lib/data/snapshot/normalise-personal.ts'` at `personal.test.ts:26:1`, `Tests no tests` |
| `tests/state/boards/board/personal.test.ts` | at import | `Error: Cannot find module '../../../../src/lib/state/boards/board/personal.ts'` at `:18:1`, `Tests no tests` |
| `tests/views/boards/personal.test.ts` | at import | `Error: Cannot find module '../../../src/lib/views/boards/personal/Personal.svelte'` at `:14:1`, `Tests no tests` |
| `tests/server/root/watch/portfolio/names.test.ts` | by assertion (2) | `names.test.ts:100:66 expected false to be true`; `names.test.ts:187:70 expected [] to deeply equal [ '/work/other/.oculus', ... ]` |
| `tests/server/root/watch/portfolio/personal-roots.test.ts` | by call (7) | `TypeError: personalRoots is not a function` at `personal-roots.test.ts:26:13` |
| `tests/server/root/watch/portfolio/roots.test.ts` | by assertion (10) | `roots.test.ts:54:42 expected [] to deeply equal [ 'root:tool' ]` |
| `tests/server/root/watch/portfolio/portfolio.test.ts` | by assertion (1 of 33) | `portfolio.test.ts:759:48 expected 2 to be 1` |
| `tests/routes/edit/side-project-writes.test.ts` | by assertion (3) | `side-project-writes.test.ts:47:21 expected { found: true, ... } to deeply equal { found: false, changed: [], ... }` |
| `tests/routes/docs/side-project-docs.test.ts` | by assertion (1) | `side-project-docs.test.ts:56:33 expected 200 to be 404` |
| `tests/state/boards/focus/focus-side-project.test.ts` | by throw (1) | `TypeError: Cannot convert undefined or null to object` at `focus-side-project.test.ts:31:23` (the base snapshot has no `personal`) |

The three files that fail at import are the data, state and view `personal.test.ts`. `tests/server/root/watch/portfolio/start.ts` and `tests/state/boards/board/side-fixture.ts` are helpers with no cases.

## Ruling 6: view tests that check what their titles say

- `tests/views/boards/personal.test.ts:115` "draws a card for a side project of a research slug, and none for a research project": the snapshot is `badgeSnapshot()` with research projects in it, one of them with the id `alpha`, so the board drawing a research project shows as a card. Failing with `sideCards` in `selectors.svelte.ts` also reading `entities.projects`: `personal.test.ts:117:31 AssertionError: expected [ 'active', 'alpha', ... ] to deeply equal [ 'side:alpha' ]`. Passing as built: `Tests 20 passed (20)`.
- The folder named like an object key (`tests/data/sources/personal.test.ts:193`) is renamed "audits that a folder named like an object key is an ordinary id": every id carries the `side:` prefix, so the case cannot fail on a code change that stays correct. The badge case carries the name "audits that the badge counts no cards before the first snapshot".

## Ruling 7: a deleted repository

- `src/lib/server/root/watch/portfolio.ts:295` `rootParents`, `portfolio.ts:413` `openRootParent`, `portfolio.ts:439` `watchRootParents`, called at `portfolio.ts:524` after `personalRoots` in every rebuild: while a root is listed, a flat watch on the root's parent folder, filtered on the root's own name, queues a rebuild; the handle is closed when the root leaves the list (`watchRootParents`) and at `close()` (`portfolio.ts:623`). A parent that is gone takes its handle with it, and a missing parent is tried again at the next rebuild.
- Tests in `tests/server/root/watch/portfolio/roots.test.ts` (slow): `:174` "drops the card of a root whose whole directory is removed" (`rmSync(dir, { recursive: true })`, then a new portfolio message without `root:tool`); `:193` the same with a second root listed first; `:218` "stops hearing a root once it leaves the list of roots".
- Failing without the parent watch (the tree before this change), the test alone, ten runs:
```
roots.test.ts:189:53  AssertionError: expected 1 to be greater than 1      (10 of 10 runs, each "Tests 1 failed | 10 skipped (11)")
```
- Failing with the handle left open when the root leaves the list: `roots.test.ts:249:36 AssertionError: expected 8 to be 6`.
- Passing after, the whole-removal test alone, ten runs (`npx vitest run tests/server/root/watch/portfolio/roots.test.ts -t "whole directory is removed"`): `Tests 1 passed | 11 skipped (12)` ten times.

## Checks

`sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md`, from `tools/oculus` of the worktree, full runs: 2. Lines printed by the last:
```
$ npm test            Test Files  434 passed | 23 skipped (457)   Tests  11311 passed | 625 skipped (11936)
$ npm run test:checks Test Files  29 passed | 2 skipped (31)      Tests  443 passed | 9 skipped (452)
$ npm run check       COMPLETED 2975 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```
After the list: the slow files this round touches, run alone, `npx vitest run tests/server/root/watch/portfolio tests/server/edit/writes.test.ts tests/routes/docs`: `Test Files 10 passed (10)  Tests 174 passed (174)`. `sh utils/folder-check.sh` exit 0. `npm run diagrams` leaves `docs/diagrams/` byte-identical (the md5 of all `.dot` and `.svg` files is the same before and after). ASCII scan of `src tests HELP.md DESIGN.md config/text/views/boards/personal.yml`: no output.

Files changed this round: `src/lib/server/root/watch/portfolio.ts` (627 lines), `src/lib/data/sources/manifests.ts` (386), `src/lib/data/index.ts`, `src/lib/data/model/model-entities.ts`, `HELP.md`, `DESIGN.md`, `config/text/views/boards/personal.yml`, `tests/data/sources/personal.test.ts`, `tests/views/boards/personal.test.ts`, `tests/server/root/watch/portfolio/roots.test.ts` (355), `tests/server/edit/writes.test.ts`, `tests/routes/docs/docs.test.ts`; new: `tests/server/root/watch/portfolio/personal-roots.test.ts` (140), `tests/routes/edit/side-project-writes.test.ts`, `tests/routes/docs/side-project-docs.test.ts`, `tests/state/boards/focus/focus-side-project.test.ts`.

The "One limit" paragraph at the top of this report (a root deleted as a whole sends no event) is replaced by ruling 7: the root's parent folder is watched, and a root removed whole drops its card at the next rebuild.
