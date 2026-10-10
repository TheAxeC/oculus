Everything in the brief is done.

## Open items

None (the state file's "Open items" section, `orchestrator-state.md:141-145`, reads "None.").

## The cases' first run

The first run of the 26 cases is the unchanged tree: the base copy `.agents/worktrees/D59-base/tools/oculus/` (byte-identical to main's `src`, `tests`, `config`, `assets` at the brief's base), and a scratch copy of the base with the new G61 test file (`$S/first/tools/oculus`, `$S` the session scratchpad) for the runs. No case was got wrong by the brief's rules; nothing was handed back.

G61's run on the unchanged tree (`$S/run-g61-first.txt`, `npx vitest run tests/server/root/config-cache.test.ts` in the scratch copy):

```
 x |unit| ... > parses again once a file of the hub's .oculus/config is written 11ms
   -> expected { one: 1, docs: [ { ...(3) } ] } to match object { docs: [ { path: 'a.md' }, ...(1) ] }
 x |unit| ... > reads the layer of the hub that local.yml names now 6ms
   -> expected { one: 1, docs: [ { ...(3) } ] } to match object { docs: [ { path: 'other.md' } ] }
 x |unit| ... > parses again once the hub's .oculus/config folder is made, and again once it is removed 4ms
   -> expected { one: 1 } to match object { docs: [ { path: 'a.md' } ] }
 Test Files  1 failed (1)
      Tests  3 failed | 6 passed (9)
```

After the change: `npx vitest run tests/server/root/config-cache.test.ts` prints `Test Files  1 passed (1)` and `Tests  9 passed (9)`.

| # | Check on the unchanged tree | First-run result | After the change |
|---|---|---|---|
| 1 | `$S/probe1.out` (the page-making function over this hub's `layout.yml`) | Help page reads `help: help \| doc:Apps guide \| memories`; the four hub documents give no tab | `$S/probe3.out`: `help: help \| doc:Research approach \| doc:Agent approach \| doc:HPC how-to \| doc:Data map \| doc:Apps guide \| memories` |
| 2 | G61 run above | engine folder only is stamped: the layer of the hub is not re-read (rows 4 and 6 fail) | 9 pass |
| 3 | `$S/probe1.out`, hub `focusdocs` with `group: focus`, `group: nopage` | `focus: focus`, no doc tab; no page changes | `$S/probe3.out`: `focus: focus \| doc:Focus note`; the entry naming no page adds no tab |
| 4 | G61 row "parses again once a file of the hub's .oculus/config is written" | FAIL (quoted above) | pass |
| 5 | G61 row "keeps its read when a file of the hub's .oculus outside config is written" | pass | pass |
| 6 | G61 row "reads the layer of the hub that local.yml names now" | FAIL (quoted above) | pass |
| 7 | G61 row "parses once for requests over a hub with no .oculus/config folder"; further outcomes of item 2: row "...folder is made, and again once it is removed" and row "keeps its read for a hub folder that does not exist" | pass; the made-or-removed row FAILS (quoted); the absent-hub row passes | all pass |
| 8 | read base `views/boards/personal/Personal.svelte:104-128` | `actions(card)` returns Files and Workbench only; no `ProjectCard`, no page | `Personal.svelte:147` draws `ProjectCard`; `ProjectCard.svelte:273` opens `openView('project', ...)`; `Editor.svelte` takes `manifestFields(project)` of `schema.ts` `sideFormFields` (the `side_project_schema` rows); write of `next` is the existing side write (G8: `write.test.ts` and `writes.test.ts` pass) |
| 9 | read base `Personal.svelte:190-197` | pin is drawn only; no Pin action | the shared card's Pin writes through `writeManifest` to the side id's own file (`state/boards/board/personal.ts` ordering unchanged) |
| 10 | read base `model-entities.ts` `SideProject` | no `deck`, no `docs`, no `folder` | `SideProject` has `folder`, `deck?`, `docs`; `tests/data/sources/personal.test.ts` 'names its deck when the folder holds present/present.yml, and its documents by presence' passes; `ProjectCard.svelte:204` draws Present from `deckOf`; `deposit={item.sideStatus === undefined}` hides Deposit |
| 11 | read base `palette.ts` and `CommandRows.svelte:77` | no side row; `:goto` looks in `entities.projects` only | `palette.ts` makes a row `project:<side id>` for each side project; `CommandRows.svelte:78` reads `held?.projects[argument] ?? held?.personal[argument]` |
| 12 | read base `Personal.svelte` | no mode, no switch | `Personal.svelte:123` `ModeSwitch`, mode in the instance state through `setInstanceState` (`personal.ts` `modeShape`), list rows of title, status, next and deadline |
| 13 | grep base `views/boards/focus` for fold/closed | none | `Focus.svelte:112-116` `folds`, `foldToggled`; `CommandCenter.svelte` and `Tasks.svelte` take `open` and `ontoggle` |
| 14 | read base `folder-opener.ts:69,80,111` | `label: name` and `label: folderName(folder)` on the Files and LaTeX tabs | `startOf` gives the two tabs no label; `saved/kept.ts:68` `withoutFolderLabels` and `saved.ts:589` drop a saved label equal to the folder name; layout-saved row 'takes the folder name off the Files and LaTeX tabs of a workbench page and a kept layout' passes |
| 15 | `ls assets` and `ls assets/memories \| wc -l` in the base | `app-icon.png app-icon.svg memories wallpaper`, 16 files; config dirs `tools/oculus/assets/...` | `ls ../../.oculus/memories \| wc -l` prints 16; `ls assets` prints `app-icon.png`, `app-icon.svg`; the shasum diff (3d) is equal except `wallpaper/README.md`; `appearance.yml` and `options.yml` name `.oculus/memories` and `.oculus/wallpaper` |
| 16 | `grep -rnE 'font-size: *[0-9.]+px' src \| wc -l` in the base; `grep -c 'body.rice' slide.css` | 3 hits; 0 rice rules in `slide.css`. The look's `RED: 292 texts` is the record's run 2; no browser here | 0 hits; 6 token lines in `body.rice`; one `body.rice .slide-frame` line; `contrast.test.ts` 40 pass. The red command at the look on landing is not run here (not verified) |
| 17 | read `docs/DATA-MAP.md` "A second hub" before the edit | no row on the layer keys, on `venues_file` in a second hub, or on `languages` | new "Config layer" row of "A second hub" (see "Hub text") |
| 18 | read base `normalise-parts/personal.ts:4-18` | a broken side manifest gives the record and one finding | unchanged; `projectOfSide` builds the project from the record, so the card, page and the finding show as for a research project |
| 19 | read base `hooks.ts` and `writes/hubs.ts` `routed()` | a second hub's side projects rekeyed by `ofHub`; no page, no editor | the shared card, page and editor take the side id; `write.test.ts` row "writes a second hub's side project in that hub's file and no other" passes on the unchanged tree and after |
| 20 | read base `ProjectCard.svelte` and `model-entities.ts` | no `repository` on a side project's record; Finder, files and documents used `folder` of a research project | `as-project.ts:53` sets `repository: {root, dir}`; `placeOf` gives `{root, path, dir}`; `showFolder` uses `openFolder(place.dir)` (`ProjectCard.svelte:296-301`); `api/docs` and `project-files` find side ids |
| 21 | `$S/probe1.out`, a saved Help page | Help, Apps guide, Memories | `$S/probe3.out` `legacy -> help \| doc:Research approach \| doc:Agent approach \| doc:HPC how-to \| doc:Data map \| doc:Apps guide \| memories`; `closed Data map, again -> same=true help \| doc:Research approach \| doc:Agent approach \| doc:HPC how-to \| doc:Apps guide \| memories` |
| 22 | read base `saved.ts` | saved labels kept | `saved.ts:589` and layout-saved row (case 14) |
| 23 | `$S/probe1.out` (twice), `$S/probe3.out` | no hub document tab | `twice same=true`; `sessions: session-list \| doc:Session note \| terminal ...` (after the first tab of the first leaf pane of a split) |
| 24 | read base `Project.svelte` | the view's empty line for an id that names nothing | unchanged: `projectOf` falls back to `projectOfSide`, then null; the empty line stays |
| 25 | read base `sources.ts` `wallpaperDir` and `fs.ts` | the list reads `wallpaper.dir` of the config, whose default named `tools/oculus/assets/wallpaper` | the key's value in `appearance.yml` and `options.yml` is `.oculus/wallpaper`; `sources.ts` and `fs.ts` needed no change |
| 26 | read `Band.svelte:73`, `CommandCenter.svelte:207` | they write `reveal`, `search`, `expiredOpen` to the instance of the opened view, not Focus's own | Focus keeps `closed` only (`state/boards/focus.ts:386`); `foldToggled` keeps every other key of the state; the state is the tab's instance state, so a move to another pane keeps it |

## DONE / NOT DONE

Every row below is DONE. Not run here, by the brief's own rule that a builder starts no server, browser or app: the red command of case 16 and the look at every page behaviour (cases 8 to 14, 16, 18 to 26); they are checked by reading and by the runs named, and the landing's look shows them. `npm run test:quick` counted 1 changed file from the paths given and chose 10 essential test files, so the rest of the verification list was run by hand.

| Check | Command | Output |
|---|---|---|
| 1 diagrams, formatting, types | `npm run format; npm run check; npm run diagrams` | `COMPLETED 3642 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`; diagrams rewritten: `layer-views.svg channels.dot channels.svg writes.dot writes.svg` |
| 1 test:quick | `npm run test:quick -- <the changed src and tests paths>` | `ok ASCII gate (0.5 s)`, `ok svelte-kit sync (1.7 s)`, `ok svelte-check (9.5 s): ... COMPLETED 458 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok vitest (11.5 s)`, `test:quick: 11.9 s (limit 45.0 s); every command passed` |
| whole non-check suite | `npm test` | `Test Files  143 passed \| 30 skipped (173)`, `Tests  1152 passed \| 244 skipped (1396)`, exit 0 |
| lint of every changed src and tests file | `eslint` over the list | `eslint exit 0` |
| 2 | `npx vitest run tests/server/root/config-cache.test.ts` | `Tests  9 passed (9)` |
| 3 | `npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/source/comment-width.test.ts tests/checks/tree/size.test.ts tests/checks/config/arrangements.test.ts` | `Test Files  4 passed (4)`, `Tests  36 passed (36)` |
| all checks | `npx vitest run tests/checks/<config,imports,look,source,tree,diagrams,utils> --testTimeout 0 --hookTimeout 0` | config 82, imports 29, look 40, source 32, tree 39, diagrams 46, utils 3 passed, each exit 0 |
| 3b | `LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' HELP.md DESIGN.md README.md docs/*.md ../../docs/DATA-MAP.md ../../.oculus/config/layout.yml ../../.oculus/wallpaper/README.md` | prints nothing; exit status 0 |
| 3c | `sh utils/folder-check.sh` | prints nothing; exit 0 |
| 3c | `sh utils/unused-exports.sh` against `D59-base/tools/oculus/unused-exports.txt` | 365 lines each; two lines are shorter: `index.ts: ... BoardMode ...` and `presets.ts: BoardMode, BoardColumn` lose `BoardMode`, which `ModeSwitch.svelte` and the two boards now import; no line added |
| 3d | `ls ../../.oculus/memories \| wc -l`; `ls assets` | `16`; `app-icon.png`, `app-icon.svg` |
| 3d | shasum of `memories/` and `wallpaper/` files against the base | 28 files each side; the only difference is `wallpaper/README.md` (reworded by hand, below) |
| 3e | `grep -rnE 'font-size: *[0-9.]+px' src` | prints nothing (exit 1) |
| 3e | `grep -nE -- '--(rail-badge-text\|status-text\|tree-font\|tree-heading-font\|tree-badge-font\|button-font):' src/lib/themes/themes.css` | lines 741 to 746, inside `body.rice {` (opens at 733, closes at 754) |
| 3e | `grep -n 'body.rice .slide-frame' src/lib/themes/slide.css` | `24:body.rice .slide-frame {` |
| 3e | `npx vitest run tests/checks/look/contrast.test.ts` | `Tests  40 passed (40)` |
| 4 | the new rows run in the scratch copy of the unchanged tree and in the worktree | below |
| history words | `grep -nEi '\b(previously\|formerly\|no longer\|used to\|originally\|legacy\|renamed\|moved (from\|to)\|reverted\|undone\|was (moved\|removed\|renamed\|added)\|(since\|after\|before) (the\|this) (change\|step\|move)\|D[0-9]{2}\|Z[0-9]{3})\b'` over every line the step added to `src`, `tests`, `config` | one hit, `src/hooks.server.ts: // file of the engine's config folder or of the hub's .oculus/config/ folder was added, removed`, which describes the files the cache watches, not a history |

Check 4, the rows of the step, on the unchanged `src` and after:

| Row | Unchanged tree | After |
|---|---|---|
| G61 rows 4, 6, made-or-removed | 3 fail (quoted above) | pass |
| G61 rows 5, 7 and absent hub | pass | pass |
| `layout-saved.test.ts` 'reads the paths of the documents a rail page was given, and none from a page without a rail' | `AssertionError: expected [ undefined, undefined, ...(2) ] to deeply equal [ [ 'x.md', 'y.md' ], undefined, ...(2) ]` | pass |
| `layout-saved.test.ts` 'takes the folder name off the Files and LaTeX tabs of a workbench page and a kept layout' | `AssertionError: expected [ { root: 'hub', ...(2) }, ...(3) ] to deeply equal [ { root: 'hub', ...(1) }, ...(3) ]` | pass |
| `personal.test.ts` 'reads the five fields' (expectation gains `folder` and `docs`) | `AssertionError: expected { id: 'side:slug', ...(7) } to deeply equal { id: 'side:slug', ...(9) }` | pass |
| `personal.test.ts` 'names its deck when the folder holds present/present.yml, and its documents by presence' | `AssertionError: expected undefined to be 'side-projects/deck/present'` | pass |
| `write.test.ts` "writes a second hub's side project in that hub's file and no other" | pass (the write already worked) | pass |

All of `$S/first-rows.out`'s runs: unchanged tree `Tests 4 failed | 14 passed (18)`; worktree `Tests  18 passed (18)`.

The tests that audit and do not prove: the `write.test.ts` row passes without the change, so it guards a behaviour the change preserves and proves nothing about the change. The `layout-saved` rows read the saved-page functions directly and fail on the unchanged tree.

## Files with line counts

`wc -l` of every changed or new file under `tools/oculus` (80 files; `assets/memories` and `assets/wallpaper` emptied and moved to `.oculus/`):

| File | Lines |
|---|---|
| config/appearance.yml | 97 |
| config/catalogs/options.yml | 1471 |
| config/layout.yml | 182 |
| config/text/app.yml | 258 |
| config/text/views/boards/editor.yml | 33 |
| config/text/views/boards/focus.yml | 138 |
| config/text/views/boards/personal.yml | 20 |
| src/lib/data/snapshot/normalise-parts/as-project.ts | 76 |
| src/lib/data/snapshot/normalise-parts/folder.ts | 19 |
| src/lib/state/workbench/layout/saved/docs.ts | 63 |
| src/lib/views/shared/card/ModeSwitch.svelte | 29 |
| src/lib/views/shared/card/project/CardAddresses.svelte | 56 |
| src/lib/views/shared/card/project/CardStatus.svelte | 51 |
| src/app.d.ts | 35 |
| src/hooks.server.ts | 109 |
| src/lib/data/model/model-entities.ts | 880 |
| src/lib/data/snapshot/normalise-parts/personal.ts | 285 |
| src/lib/data/snapshot/normalise.ts | 726 |
| src/lib/data/sources/manifests.ts | 380 |
| src/lib/server/content/docs.ts | 815 |
| src/lib/server/files/project-files.ts | 262 |
| src/lib/server/machine/pty/latex/latex.ts | 471 |
| src/lib/server/machine/pty/start/chat.ts | 133 |
| src/lib/server/root/context.ts | 872 |
| src/lib/server/root/process/config-cache.ts | 84 |
| src/lib/server/sessions/stores/hooks.ts | 258 |
| src/lib/shell/keys/rows/CommandRows.svelte | 119 |
| src/lib/shell/Workbench.svelte | 527 |
| src/lib/state/boards/board/personal.ts | 254 |
| src/lib/state/boards/board/presets.ts | 416 |
| src/lib/state/boards/focus.ts | 400 |
| src/lib/state/client/selectors.svelte.ts | 652 |
| src/lib/state/forms/schema.ts | 474 |
| src/lib/state/shared/page/hubs.ts | 8 |
| src/lib/state/workbench/layout.svelte.ts | 877 |
| src/lib/state/workbench/layout/index.ts | 157 |
| src/lib/state/workbench/layout/instance.ts | 249 |
| src/lib/state/workbench/layout/model.ts | 375 |
| src/lib/state/workbench/layout/open/float/folder-opener.ts | 127 |
| src/lib/state/workbench/layout/open/float/pages.ts | 669 |
| src/lib/state/workbench/layout/saved/kept.ts | 125 |
| src/lib/state/workbench/layout/saved/saved.ts | 758 |
| src/lib/state/workbench/navigation/arrangement.ts | 180 |
| src/lib/state/workbench/navigation/pages.ts | 654 |
| src/lib/state/workbench/navigation/rail.ts | 128 |
| src/lib/state/workbench/palette.ts | 581 |
| src/lib/themes/slide.css | 30 |
| src/lib/themes/themes.css | 783 |
| src/lib/themes/tokens.css | 276 |
| src/lib/views/academic/latex/tex-root.svelte.ts | 176 |
| src/lib/views/apps/frame/ApprovalPanel.svelte | 152 |
| src/lib/views/boards/editor/Editor.svelte | 352 |
| src/lib/views/boards/entry/Entry.svelte | 307 |
| src/lib/views/boards/focus/CommandCenter.svelte | 257 |
| src/lib/views/boards/focus/CommandCenterView.svelte | 313 |
| src/lib/views/boards/focus/Focus.svelte | 255 |
| src/lib/views/boards/focus/rows.ts | 420 |
| src/lib/views/boards/focus/Tasks.svelte | 158 |
| src/lib/views/boards/personal/Personal.svelte | 191 |
| src/lib/views/boards/project/Project.svelte | 207 |
| src/lib/views/boards/projects/Projects.svelte | 390 |
| src/lib/views/personal/memories/Memories.svelte | 442 |
| src/lib/views/shared/card/card.ts | 154 |
| src/lib/views/shared/card/CardDocs.svelte | 247 |
| src/lib/views/shared/card/ProjectCard.svelte | 520 |
| src/lib/views/sources/doc/Doc.svelte | 313 |
| src/lib/views/system/help/Help.svelte | 98 |
| src/routes/api/(docs)/docs/+server.ts | 21 |
| src/routes/api/(files)/project-files/+server.ts | 16 |
| src/routes/api/(sessions)/terminal/+server.ts | 50 |
| tests/checks/tree/allow-duplication.txt | 30 |
| tests/checks/tree/boundaries.test.ts | 772 |
| tests/data/sources/personal.test.ts | 125 |
| tests/routes/docs/memories.test.ts | 54 |
| tests/routes/edit/write-fixture.ts | 486 |
| tests/routes/edit/write.test.ts | 69 |
| tests/server/root/config-cache.test.ts | 177 |
| tests/server/root/context-fixture.ts | 193 |
| tests/state/boards/board/side-fixture.ts | 32 |
| tests/state/workbench/layout/saved/layout-saved.test.ts | 278 |

Outside `tools/oculus`: `HELP.md` 455, `DESIGN.md` 593, `docs/apps.md` 352 (in `tools/oculus`), `docs/DATA-MAP.md` 597, `.oculus/config/layout.yml` 12, `.oculus/wallpaper/README.md` 3. `docs/diagrams/` regenerated (18 files). `size` test passes; `model-entities.ts` is 880, `layout.svelte.ts` 877, `ProjectCard.svelte` at its component limit.

Files changed outside the brief's "Paths this step writes" list, each needed by item 3 or 1: `src/lib/data/snapshot/normalise-parts/{as-project,folder,personal}.ts`, `normalise.ts` (a side project becomes a project; the folder reader), `src/lib/server/content/docs.ts`, `src/lib/server/files/project-files.ts` and its route, `src/routes/api/(docs)/docs/+server.ts`, `src/routes/api/(sessions)/terminal/+server.ts`, `src/lib/server/machine/pty/{latex/latex.ts,start/chat.ts}` and `src/lib/views/academic/latex/tex-root.svelte.ts` (a side id reaches the terminal, chat and LaTeX roots), `src/lib/state/forms/schema.ts` (the side form), `src/lib/state/shared/page/hubs.ts` (re-exports `placeOf`), `src/lib/state/workbench/layout.svelte.ts`, `layout/index.ts`, `layout/instance.ts`, `layout/model.ts`, `layout/open/float/pages.ts`, `layout/saved/{saved,docs,kept}.ts`, `navigation/pages.ts`, `src/lib/shell/Workbench.svelte` (document tabs of a saved page and `Page.docs`), `src/lib/views/boards/entry/Entry.svelte`, `projects/Projects.svelte` (the shared `instanceChoice`, `ModeSwitch`), `tests/checks/tree/boundaries.test.ts`, `tests/checks/tree/allow-duplication.txt`, `tests/routes/edit/write-fixture.ts`, `tests/state/boards/board/side-fixture.ts`.

## Judgment calls

1. `tests/checks/tree/boundaries.test.ts`: `data/snapshot/normalise-parts/as-project` joins the state allowlist, with a comment paragraph, because `state/boards/board/personal.ts`, the selectors and the card build a project from a side record with the same function the snapshot uses (one project shape, one card).
2. `ModeSwitch.svelte` is a shared control of the Projects and Personal boards (the second copy of the Segment would have been a duplication finding); the callers pass a typed `setMode` function.
3. `instanceChoice` in `layout/instance.ts` is shared by `Project.svelte` and `Entry.svelte`, which held the same reader.
4. `SectionProps` in `views/boards/focus/rows.ts` is the one props type of the command center and the tasks section; their held duplication entry in `tests/checks/tree/allow-duplication.txt` is removed because the clone it held is now one place.
5. A workbench opened for a side project shows the project view first, not the manifest source.
6. The side editor's sections derive from the fields it shares with `manifest_schema`; the side-only `status` and `links` take a label through `sideLabel()` with literal keys and the previous field's section.
7. A side project's lines in the Focus ticker still open the manifest (unchanged).
8. `HUB_LIST` (`data/helpers/hub-names.ts`) holds more keys than the brief's list; `docs/DATA-MAP.md` names the actual ones.
9. Case 8 and 9's writes use the existing side write; the one new G8 row is the second hub's side project (the path `routed()` takes through `ofHub`).
10. New rows beyond G61 and G8: two rows of G29's unit (saved pages) and one row of G32's `personal` unit, because the behaviour is new in those units; they are named in "Doc text".
11. `docs/apps.md` lives in `tools/oculus/docs/`, `docs/DATA-MAP.md` at the worktree root; the brief's line numbers of `DATA-MAP.md` (72, 181-182, 226-236, 593) shifted as rows were added (file is 597 lines).

## User-visible changes

| Where | Before | After |
|---|---|---|
| Help page | Help, Apps guide, Memories | Help, Research approach, Agent approach, HPC how-to, Data map, Apps guide, Memories; a saved page gains the missing ones once; Reset makes the page with all |
| Config reads | the hub's layer was re-read only at a restart | a written, added or removed file of `<hub>/.oculus/config/` is read by the next request; the hub is read from `local.hub` at each read |
| Personal board | a card with Files and Workbench | the shared card (Pin, Copy context, Ask, Finder, Files, Workbench, expand, subtasks, Present, Edit manifest), a page, an editor, a cards/list switch, a palette row and `:goto`; no Deposit |
| Focus | Command center and Tasks always open | each folds; the state is kept in the tab and both start open |
| Workbench tabs | Files and LaTeX tabs labelled with the folder name | Files and LaTeX; a saved label equal to the folder name is dropped |
| Memories and wallpaper | `tools/oculus/assets/` | `.oculus/memories/` (16 pictures) and `.oculus/wallpaper/`; `assets/` holds the two app icons |
| Rice themes | 3 px font sizes in `src`, slide text unstepped | six size tokens and five stepped slide sizes under `body.rice`; ApprovalPanel uses tokens |

## Anything wrong or impossible in the brief

- The brief's 26 cases were checked on the base copy by reading and by the runs named; a first run of the look-only cases (8 to 14, 16, 18 to 26) needs a browser and a server, which the brief forbids a builder; their rows name the look on landing.
- Case 16's `RED: 292 texts` is the record's run; not reproduced here.
- The accidental command `git -C . status >/dev/null 2>&1` was run once: a breach of the no-git rule that read only and changed nothing.
- `npm run test:quick` counted 1 changed file from the 60-odd paths given and chose 10 essential test files, so it does not stand in for `npm test`, which was run whole.

## Doc text

Current G61 (`agents/guarded.md:179-181`, as `grep -n` prints it):

```
179:- G61. A configuration file written, added or removed is read by the next request that asks for the configuration, and one request keeps its one read for the rest of it.
180:  Code: the config cache of the server context (`src/lib/server/root/context.ts`, its type in `src/lib/server/root/process/server-context.ts`), read through `src/hooks.server.ts`.
181:  Test: `tests/server/root/config-cache.test.ts`, describe 'the config cache of the server context': 'parses a config folder once for requests over it, and again once a file of it is written', 'parses again for every request while an entry of the folder cannot be stat-ed', 'keeps the one read of a request for the rest of it, whatever is written meanwhile'; landed by M8.
```

New G61:

```
- G61. A configuration file of the engine's config folder or of the hub's `.oculus/config/` folder, written, added or removed, is read by the next request that asks for the configuration, and one request keeps its one read for the rest of it.
  Code: the config cache of the server context (`src/lib/server/root/context.ts`, `src/lib/server/root/process/config-cache.ts`, its type in `src/lib/server/root/process/server-context.ts`), read through `src/hooks.server.ts`.
  Test: `tests/server/root/config-cache.test.ts`, describe 'the config cache of the server context': 'parses a config folder once for requests over it, and again once a file of it is written', 'parses again for every request while an entry of the folder cannot be stat-ed', 'keeps the one read of a request for the rest of it, whatever is written meanwhile', "parses again once a file of the hub's .oculus/config is written", "keeps its read when a file of the hub's .oculus outside config is written", 'reads the layer of the hub that local.yml names now', 'parses once for requests over a hub with no .oculus/config folder', "parses again once the hub's .oculus/config folder is made, and again once it is removed", 'keeps its read for a hub folder that does not exist'.
```

G8 Test line, addition: `tests/routes/edit/write.test.ts`, "writes a second hub's side project in that hub's file and no other".

G29 Test line, addition: `tests/state/workbench/layout/saved/layout-saved.test.ts`, describe 'a saved rail page and a saved workbench page', 'reads the paths of the documents a rail page was given, and none from a page without a rail', 'takes the folder name off the Files and LaTeX tabs of a workbench page and a kept layout'.

G32 Test line, addition (personal): `tests/data/sources/personal.test.ts`, describe 'the folder of a side project', 'names its deck when the folder holds present/present.yml, and its documents by presence'.

## Hub text reworded by hand

`.oculus/config/layout.yml` line 3.
Before: `# This hub's layer of oculus's layout.yml: the documents of the hub that the view catalogue lists. The list replaces the engine's whole (tools/oculus/config/layout.yml).`
After: `# This hub's layer of oculus's layout.yml: the documents of the hub, which the view catalogue lists and the Help page holds as tabs. The list replaces the engine's whole (tools/oculus/config/layout.yml).`

`.oculus/config/layout.yml` line 7.
Before: `# Hub documents in the view catalogue: one entry inside its group, listed after the group's views, opening the `doc` view over api/docs. `path` is relative to the research hub, `group` is a key of `nav_groups`, which the engine's layout.yml (tools/oculus/config/layout.yml) defines, and `label` is the tab's words. A path with no file there draws the view's own missing line.`
After: `# Hub documents: one entry inside its group in the view catalogue, listed after the group's views, opening the `doc` view over api/docs, and a tab of the page its group names, placed after that page's first tab. `path` is relative to the research hub, `group` is a key of `nav_groups`, which the engine's layout.yml (tools/oculus/config/layout.yml) defines, and `label` is the tab's words. A path with no file there draws the view's own missing line.`

`.oculus/wallpaper/README.md`.
Before (second sentence): `` `config/appearance.yml` selects the directory and either a filename fragment or the configured pick rule.``
After: ``The key `wallpaper.dir` of `tools/oculus/config/appearance.yml` selects the directory and either a filename fragment or the configured pick rule.``

`docs/DATA-MAP.md`:
- Line 72 before: `... only Personal reads it.` After: `... and the Personal board, the project view, the editor and the palette read it.`
- Table rows at 181-182, readers column before `Personal`, after `Personal, Project, Editor, the palette`.
- The `layout.yml` row before: `the hub documents the Help group lists: ...; the Apps guide opens from the Help page without an entry`; after: `the hub documents of the Help page: Research approach, Agent approach, HPC how-to and Data map, each an entry with `group: help`; the Apps guide and Memories come from oculus's own list`.
- New paragraph after the config-layer table (line 237), in full:

  Each `docs` entry whose `group` is the key of a page of the rail becomes a document tab of that page, placed after the page's first tab in the order of the list, so the Help page reads Help, Research approach, Agent approach, HPC how-to, Data map, Apps guide and Memories. A page already saved gains the documents it has not been given before, and a tab the reader closed stays closed. The pictures of the photo wall are in `.oculus/memories/` and the backdrop's in `.oculus/wallpaper/`, the folders `memories.dir` and `wallpaper.dir` of `tools/oculus/config/appearance.yml` name.
- Line ~593 before: `beside notes/, schedules.yml, workspaces.json, apps/ and config/ (the hub's layer of the settings)`; after: `beside notes/, schedules.yml, workspaces.json, apps/, memories/ (the photo wall's pictures), wallpaper/ (the backdrop's pictures) and config/ (the hub's layer of the settings)`.
- New "Config layer" row in "A second hub" (line 581), in full:

  | Config layer | each hub's `.oculus/config/` layer is that hub's own, and every path in it is read from that hub's folder, so the first hub's `venues_file: registries/venues.yml` and a second hub's `venues_file: other-folder/venues.yml` each read their own file. A layer sets only the keys of the hub list: in `sources.yml`, `scan`, `portfolio_deck`, `venues_file`, `datasets_file`, `pillars_file`, `domains_file`, `people_file`, `organisations_file`, `resources_file`, `collections`, `leads_file`, `radar_file`, `publications_file`, `linkedin_dir`, `career_file` and `roots`; in `layout.yml`, `docs`; in `behavior.yml`, `slurm.resource` and `data_domains`; in `catalogs/vocab.yml`, `domains`, `venue_themes` and `data_themes`. A key outside the list, a file outside those four and a `local.yml` in the layer are findings that name the layer's file and are not applied. Every other key, `repository_scan_depth` and `languages` among them, is oculus's own and holds for every hub. Of the listed keys, a second hub's `roots`, `career_file`, `publications_file`, `linkedin_dir` and `portfolio_deck` are the ones the Settings row above says are not read |
