X3e brief recheck on main at c0a4af9c1

Nothing in the tree was changed. Main's source did not move while I worked: `git diff --quiet c0a4af9c HEAD -- tools/oculus/src tools/oculus/tests tools/oculus/config tools/oculus/HELP.md tools/oculus/DESIGN.md tools/oculus/docs` exited 0. The plan files did move: plan.md, queue.md, choices.md and the state file are being edited uncommitted, and the Z lines in plan.md shifted twice during the recheck. `git log --oneline 8411697e8..HEAD -- tools/oculus | wc -l` printed 135.

Most of the corrections in `agents/reviews/X3e-premise-recheck-2.md` (main e7dce01e) still hold. PR3 (a2901490) and D23c (c0a4af9c) moved these further: `Tree.svelte`, `place.ts`, `files-view.ts`, `bodies.ts`, `config-write.ts`, `writes.ts`, `writes.svelte.ts`, `context.ts`, `source.svelte.ts`, `Source.svelte`, `Outline.svelte`, `palette.ts`, `Palette.svelte`, `row-menu.ts`, `server.yml`, `files.yml`, `app.yml`, `source.yml`, `write-fixture.ts`, `undo.test.ts`, `changes.test.ts`, HELP.md and DESIGN.md. I got this from a loop of `git diff --quiet e7dce01e HEAD -- <file>` over the brief's files. Every number below was read on c0a4af9c1.

## 1. Premises and verdicts

### Base and rulings (brief :3-45)

- **:3, no ADR.** `ls docs/adr` fails. `grep -n "^adr" .agents/plan.yaml` prints nothing. `libraries: check` is at plan.yaml:15. Holds.
- **:45, :49, :97, :108, the base 8411697e8 and the dispatch check `git diff --quiet 8411697e8 <head>`.** False. `git diff --quiet 8411697e8 HEAD -- src config tests HELP.md DESIGN.md` exits 1, and `git diff --shortstat 8411697e8 HEAD -- ... docs` printed "612 files changed, 51349 insertions(+), 9402 deletions(-)".
  - These steps landed since 8411697e8 (`git log --oneline 8411697e8..HEAD -- src tests config HELP.md DESIGN.md`): D44 d7ff5fd3, O30 3cb170ea, A3 09509b5b, E4 10ac00c6, Q123 02ac124e, PR1 687cd1d5, E4g c86f10f2, O30b 4ce24363, Q124 abf4356c, PR2 548004bc, Q125 e7952e16, D23 797e1e5d, Q126 6561f82a, PR3 a2901490 and D23c c0a4af9c. Three non-step commits also landed: 8aa491ca, 61f25397 and 57c6ba7e.
- **:49, the list of files "unchanged since 863cdc7d0".** False for many. Since 8411697e8 these changed: `files-view.ts`, `place.ts`, `reveal.ts` is unchanged, `core/git/run.ts`, `core/git/files.ts`, `picker.ts`, `serve.ts`, `vite-plugin.ts`, `config/sources.yml`, `auth.ts`, `palette.ts`, `Palette.svelte`, `pane-view.ts`, `pty/routes.ts`, `commands/routes.ts` (moved), `real-hub.probe.ts`, `TabFace.svelte` and others (loop of `git diff --quiet 8411697e8 HEAD`).
- **:22, :39, :41, :239, :516, plan.md line numbers of Z440, Z524 and Z527 (1171, 1248, 1249).** False, and they keep moving. The first grep printed 1212, 1289 and 1290. A later `grep -nE "^- Z(440|524|527) " plan.md` printed 1214, 1291 and 1292.
- **:22, Z440, `sed -n 440,482p settings.ts`.** False. `PROBLEM_READERS` is :505-525 and `settingProblems` is :531-541 (`grep -n`).
- **:25, Z443, `settingReader` and `valueProblem` at :17 and :97.** False. The grep prints :18 (the import) and :98. `settingOf` is gone, which holds.
- **:34, Z490, `sed -n 10p section-state.ts`.** Prints `STARTS_CLOSED ... ['editors', 'timeline']`. Holds.
- **:38, Z519.**
  - `classifyFailure` at `parse.ts:703-730` holds.
  - `failureText` at `git-routes.ts:386-410` holds.
  - `running.ts` is 144 lines, not 139 (`wc -l`).
  - The `server.git` group is `config/text/server.yml:115-126`, not :85-96 (`grep -n "^        [a-z_]*:$"`).
- **:41, Z527, G42 at `agents/guarded.md:28-30`.** Holds. The Test line at :30 still names only the five osascript titles. There is no title for the desktop sheet that Z635 (plan.md, `- Z635 (2026-10-06): (a), G42 gains a sentence for the desktop app's folder sheet ...; X3e builds it`) and the X3e sub-bullet (`plan.md:201`) require. See Stops.
- **Missing ruling.** The rulings list has no Z635, though the plan line cites "(ruling Z635)".
- **:23, the three diagnosis records.** All three exist (`ls agents/reviews | grep X3e-diagnosis`). Holds.

### Files view: reorder and collapse (brief :53-63)

- **`dragging.svelte.ts`.** 135 lines, `draggable` :54, `over` :84, `dropped` :105, `DraggingDeps` :27-32. Holds. `tree/drag.ts` is 41 lines. Holds.
- **`Tree.svelte`.**
  - It is 385 lines, not 384. PR3 added one line at :313 (`title={row.editing === 'title'}`).
  - `createDragging` :203-208 holds.
  - `<ul class="rows">` :271 holds.
  - `<li` :281-293 holds.
  - The style block is :357-385, not :356-384 (`grep -n "<style\|</style>"`).
- **`FILE_DRAG` and `FOLDER_DRAG`.** They are `place.ts:175-181`, not :174-180. PR3 added `editing?: 'new' | 'rename' | 'title'` to `TreeRow`. `collapseRoot` is :162-166, not :161-165. `ls state/workbench/drag` fails, which holds.
- **`fixedRootKeys` and `fixedRootsOf` at `fs-transport.ts:87-133`.** :94 and :123. Holds.
- **`config/sources.yml` `roots:` :88, entries :89-94.** False. `roots:` is :92, the entries are :93-98, and `languages:` is :102, its comment at :101 (`grep -n "^roots:\|youtube-downloader\|^languages:"`).
- **`roots.ts`.** `writeRoots` :140, `addRootTo` :173, `removeRootFrom` :184, `rootsOf` :67, `rootsNow` :83, `kept` :129. Holds.
- **`RootsWrite` `bodies.ts:113-115` and `rootsShape` :288-291.** False. They are `RootsWrite` :149-151, `rootsShape` :371-374 and `rootsWrite` :524 (`grep -n`).
- **`config-write.ts:93-102`.** False. The dispatch is :89-97, the `roots.ts` import :26.
- **`fs.ts` (unchanged since 8411697e8).** `ACTIONS` :487-494, `fsBodyShape` :500-508, `textShape` :425, `chained(into.writes` :658. Holds.
- **`setItems` `list-edit.ts:113` and `listText` :73-84.** False. They are `setItems` :125 and `listText` :78-90.
- **`notes.ts`.** 125 lines, `noteFile` :51, `listNotes` :89. Holds.
  - `grep -rln "fs/notes\|listNotes\|saveNote" tests` prints nothing. Holds.
  - G31's lines are Code :72 and Test :73 (`grep -n "fs/notes.ts" agents/guarded.md`), not :63 and :64.
  - `tests/server/files` holds 8 (`git ls-tree`). Holds.
- **`refusal()` at `refusal.ts:11-24`.** Holds.
- **Bookmarks.**
  - `reorderEntries` is `writes.svelte.ts:343`, not :297.
  - `reorderCollection` is `entries.ts:299`, not :294.
  - `fileOrder` :417 and `movedOrder` :437 hold.
- **`Files.svelte`.** It is 324 lines, not 323. The parts are:
  - OpenEditors :232;
  - the note line :236-238;
  - Outside :240;
  - BookmarkForm :248;
  - the said line :264-266;
  - ShowPath :267;
  - Follow :275;
  - RootedTree :289;
  - Sections :297, with `onpatch` :302;
  - `headed` :138;
  - `onrefresh` :220 (`grep -n`).
- **`Sections.svelte`.** It is 153 lines, not 127. D23 added the sections `ast` and `memory` (`Sections.svelte:118-123`). The sections are Outline :117, Ast :118, MemoryUsage :119, Timeline :124 (its `onpatch` at :129), Bookmarks :131 and Notes :143.
- **Section heads.**
  - OpenEditors :148, Timeline :274 (TreeView :272), Bookmarks :72 and Notes :61 hold.
  - Outline is 255 lines (D23c), not 188. Its `<Section>` is :219 and its `TreeView` :217, not :160 and :158.
  - A new head, `sections/clangd/ClangdSection.svelte:45` (TreeView :39), draws `ast` and `memory`.
  - `grep -n onkey sections/*.svelte` prints nothing. Holds.
- **Unchanged files.** `Section.svelte` (68 lines), `TreeSection.svelte` (94), `section-state.ts` (30, `sectionOpen` :16, `sectionFlipped` :21, `sectionOpened` :28). Holds.
- **`files-view.ts`.** 249 lines; `FilesView` :62-103, shape :154-189, `filesViewOf` :192, empty :197-226, the timeline fields :97-102, :179-181, :222-224. Holds. PR3 added `'deck'` to `namingShape`.
- **`collapseAll` at `tab-actions.ts:96-103`.** Holds. `newItem` is :105-111. Holds.
- **Keys.** `ENTRIES` :40-57, Cmd+A `select-all` :54, no Cmd+Enter. Holds. `TreeView.svelte:7-9` and `tree-keys.ts:133` hold. `Changes.svelte` has no keymap or selection. Holds.

### Files view: following the disk (brief :67-71)

- **`fs.svelte.ts`.** 840 lines, unchanged.
  - `afterReceive` :396, `relistFolder` :445, `readListing` :467, `WORKSPACES` :161, `invalidate` :698-700, `refresh` :713, `createFileHistory` :592, `ops.svelte.ts:569`. Holds.
  - The head comment's :17-19 ("re-read by closing it and opening it") is false behaviour; C2 rewrites it.
  - Refresh is `Files.svelte:220`, not :219.
- **`FilesPayload` at `model-sessions.ts:672`.** Holds. The file is 876 lines, 4 under 880, and `data/model` holds 10.
- **The git watcher's publish `git.ts:233-237`.** False. `reread` is :239-255, the `files` publish :243, the `follow()` :241.
- **`mergeFiles` at `files-channel.ts:8-14`.** Holds.
- **`filesShape` at `payloads.ts:108-110`.** False. It is :112-114.
- **"Three followers read the payload's root".** False. There are seven (`grep -rn "'files'" src/lib/state`):
  - `docs.svelte.ts`: `filesMoved` :246-254, `holds` :152-158;
  - `commands.svelte.ts:322-332`;
  - `fs-history.ts:65-80`, with `pathUnder` at :76;
  - `latex.svelte.ts:356` and `filesMoved` :389, through `holds` at :382;
  - `state/sources/files.svelte.ts:85-89`;
  - `state/life/present.svelte.ts:74-79` (PR3 moved it from :84-89);
  - the apps: `apps/rules.ts:102-105` and `apps.svelte.ts:296`, :356.
- **`watch/git.ts`.** 511 lines, not 505. The parts are:
  - `IGNORED` :81-86, six names through `PLAIN_FOLDERS` and `APP_FOLDERS`;
  - `relevant` :125;
  - `subrepositories` :150-161;
  - `heard` :306;
  - `scan` :391;
  - `wanted` :401;
  - `follow` :425, with `statusFor` at :437;
  - the workspaces poll :485-488;
  - the watch callback :344-346, with `_event` dropped;
  - the one-deep head comment :27-32.
- **The watcher's build at `context.ts:362-367`.** False. `startGit` is :422-427, `make.watchGit` :423.
- **`fs.ts:482` answers 404 `missing`; `listingAnswer` `fs-transport.ts:280-293`.** Holds.

### Repositories and Changes (brief :75-83)

- **`openHead` at `repositories.svelte.ts:483-489`.** Holds.
- **`loadSourceDraft` :292-301, its lifetime check `:300`, `reloadSource` :360.** False since D23c. `loadSourceDraft` is now :343-373 and is no longer `async`. It reads through a shared `readOnce` (:416-437) whose lifetime check is :419, which D23c's `loadLibraryDraft` (:380-404) also uses. `reloadSource` is :461 and returns at once for a library draft (`LIBRARY_FILE`, :162). Nothing rereads a head or index draft: `grep -rn reloadSource src/lib/state` names only `ops.svelte.ts:289`. Holds.
- **`switchBranch` :390 and `switchDetached` :410, with `roots = allowedRoots(), signal?`.** Holds. The test file list (`grep -rln "server/git/git-\|server/git/deposit" tests`) holds. `detached.test.ts:24` holds.
- **`CommitBox.svelte:67-73`.** Holds.
- **The refusal literals.** `grep -rn "failed(\`[a-z]\|failed('[a-z]" src/lib/server | wc -l` printed 64, not 62. The 62 under `server/git` hold per file. The other two are `machine/lsp/process.ts` codes.
- **The `error:` literals.** `git-routes` :137, :259, :369, :432; `git-reads` :116, :120; `git-message` :68, :75; `deposit-routes` :106, :131, :169, :176, :200. Holds.
- **Multi-line `failed(` literals and helpers.** `git-write` :287, :552; `git-index` :251, :286; `git-refs` :77; `checkPaths` :211; `checkName` :760; `tagName` :105; `deposit.ts` `checkName` :759-764. Holds.
- **`git-write`'s runner :148-191 and stdin :189.** Holds. `git-message.ts:97` 'claude failed' holds.
- **`core/git/run.ts:164` and :168.** False. They are :167 and :171.
- **`files.ts` refusals `:78`, :79, :102, :116.** False. They are :96, :97, :120 and :134; D44 added `keptFiles`. `git-reads.ts:268` holds. `state.ts` :117, :146, :169, :195 hold.
- **`Repo.svelte:116` and :199; `changes.yml:72`.** Hold.
- **The no-test grep for read-path sentences.** Not rerun; the files are unchanged since e7dce01e.
- **`stoppedOn` at `git-index.ts:282-289`, its sentence :287.** Holds.
- **The conflict lines.** `merging` :124, `rebasing` :136, `cherry_picking` :236, `commit_unmerged` `changes.yml:32`, `Repo.svelte:133-135`, `CommitBox.svelte:78`. Holds.
- **`textCatalog` `config-value.ts:137` and `shapeOfRecord` `config-fit.ts:378`.** Holds.
- **`server.config_key` and `server.config_value` at `server.yml:19-71`.** False. `config_key` is :19-49 and `config_value` :80-101. Between them are PR3's `deck_edit` :50-68 and PR2's `deck_slides` :69-79. `local` is :20 and :81.
- **"The refusal sentences end with no full stop".** False for the file. `deck_edit.changed` and `deck_slides.order_changed` are two sentences ending in full stops (`git diff e7dce01e HEAD -- config/text/server.yml`).
- **`server.git` :85-96.** False. It is :115-126; its keys are unchanged.
- **The write token.**
  - `tokenedBody` is `auth.ts:97-112`, `RefusalShape` :86-90, the sentences :105 and :109, not :89-103, :78-82, :97 and :101.
  - `grep -rn "tokenedBody(" src/lib` prints 15 calls: 14 handlers plus `gatedBody`'s own at :122. With `gatedBody`'s 5 routes that is 19 routes, not 18.
  - 11 handlers answer the default sentence, not 9. The two added are `handleSchedules` (`machine/runs/schedules/routes.ts:249`) and `handleApprovePost` (`machine/apps/routes.ts:104`).
  - The moved sites are `writes.ts:315` (was :274); `pty/routes.ts:547` (was :576); `machine/runs/commands/routes.ts:90` (the folder moved from `machine/commands/`); `fs/ops.ts:682` (was :674); `fs/picker.ts:109` (was :97).
  - `configFor` is read at `pty/routes.ts` :258, :328, :432, :628; `CommandsOptions.configFor` at `runs/commands/routes.ts:34`; `ChatOptions` at `pty/start/chat.ts:29`; and `terminal/+server.ts:29`.
  - The assertions are `auth.test.ts:27`, `write.test.ts:27` and `git.test.ts:60`, not :61.
- **`changeGroups` :209 and the `ch_group_empty` readers `ChangeGroups.svelte:136` and `Changes.svelte:215`, `changes.yml:73`.** Holds.
- **Graph and menus.** `CommitRow` `pills` :77, `Graph.svelte:359` and :419, `RepoList.svelte:105`, `commitMenu` :81, `state.ts:205`. Holds.
- **`repositories.ts`.** It is 875 lines, not 870, so 5 under 880. `worktreeLabel` :490, `pickerRoots` :575, `WorktreeOpening` :852-857, `openWorktree` :865-875. The layout's `showInFiles` is `layout.svelte.ts:206`, not :213. `Worktrees.svelte:222` holds, and it has no `onenter`.
- **`ChangeGroups.svelte`.** 330 lines, :146, :300. `ChangesTouched.svelte:51`. Holds.

### Other (brief :87-95)

- **`commands()` at `palette.ts:276-292`, theme hint :280.** False. `commands()` is :306-331 and the theme hint :313. The commands with no hint are `crt` :314, `help` :325, `update` :326 and `folder` :329.
- **"`Palette.svelte` is 523 lines, over the 520 rule".** False. It is 508 (`wc -l`). `shell/keys` holds 10 (`git ls-files | cut | sort -u | wc -l`) and is full.
- **Ticker `button.name` :304-320 and `span.name.plain` :322, with no title.** Holds.
- **The dirty dot.** `OpenEditors.svelte:250-256` and `grep -rn "background: currentColor" src` (one hit, :255) hold. `spec.md:48` holds. `TabFace.svelte` `dirty_glyph` is :170, its block :168-172, not :165-169.
- **The folder panel's `picker.ts`, changed by O30.**
  - The numbers are `PickRun` :48, `PickRunner` :51, `PickerState` :63, `pickerState()` :66, `PickDeps` :71, `execFile` :82, `handlePick` :103-132, `busy` :117 and `done.code !== 0` :125.
  - `PickerState` is now `{ open: boolean; ask?: PickAsk }`, and `ask` is awaited at :120-123.
  - `picker_busy` is `files.yml:163` and `picker_failed` :164, not :150 and :151. `pickerLine` is `folders.ts:77-83`.
- **The breadcrumb row is gone (X3c).** Holds.
- **Tabs.** `Tab` at `tab-strip.ts:8-41`, with `file` :17. Holds.
  - "`PaneView.svelte:186-217` builds each tab, setting `file`" is false. `stripTab` (`shell/panes/strip/strip-tab.ts:30-60`, `file` at :42, `StripTabFacts` :22-28) builds the tab, called at `PaneView.svelte:183-185`.
  - `fileOfTab` is `pages.ts:370` and `shownFileOfTab` :390, not :369 and :389. `tabHint` is `pane-view.ts:472`, not :421-427.
- **Glyphs.** No `head` glyph (`grep -n "^ *head:"` prints nothing). `target.svg` exists. Holds.
- **Config readers.**
  - `settings.ts` is 541 lines, not 482. The parts are `settingEntry` :90-95, `settingReader` :98-174 (behavior.yml read at :91 and :102), `noRule` :51, `PROBLEM_READERS` :505-525 with `latexAutoBuild` last, and `settingProblems` :531-541.
  - `settingFindings` is `catalogs.ts:234-251`, its `behavior.yml` file :235. It now also takes `readEditorOptions` problems (:238-242).
  - `config-checks.ts:98` `READERS` holds.
  - In `context.ts`: `openSettings` :334, `latexFormatting` :335 and `settingFindings` :371, not :288-289 and :311. `portfolio.ts:532`.
  - `options.yml` is 1200 lines. The parts are `sources.yml:` :979 (PR2's `portfolio_deck` :980), `roots` :1104-1112 and `local.yml:` :1113. Counts: `heading:` 127, `min:` 32, `whole:` 19.
- **`app.palette` at `app.yml:17-29`.** False. It is :17-40, with `cmd_unknown` :21.

### H1 and H2 premises (brief :97-106)

- **`run.ts`, changed by D44.**
  - The head comment is :1-80, and the one-call-site paragraph is :74-76.
  - The parts are `spawnSync` import :82 and call :159, `show` :133-135, `readDiff` :138-140, `run` :148-182, the failure texts :167 and :171, and `MAX_OUTPUT` :91.
  - Other `spawnSync`: `registry.ts:66` and `codex.ts:387`. Holds.
- **The `run` input and env calls.** `files.ts:39` passes input, not :38. `compare.ts` :63 and :138 hold.
- **`state.ts` numbers.** Unchanged. Holds.
- **The watcher's `reread` :233-249, `touch` :265-277, `refresh` :493-495 (typed :184), `drop` :349-360, `closed` :218 and the `follow()` calls :457, :464, :481, :488.** False. They are:
  - `reread` :239-255, with `statusFor` :245;
  - `touch` :271-283, with `last` stamped :279;
  - `refresh` :499-501, typed :190 and documented :189;
  - `drop` :355;
  - `closed` :224;
  - `follow()` :463, :470, :487, :494;
  - the `config` check :468 and the subscribe :496.
- **The refresh callers.** `git-routes.ts:468`, :461-463, :198-199; git `+server.ts:23`; `autofetch.ts` :55, :194, :206, :212-222; `git.test.ts:41`. Holds. `context.ts:371` is false: it is :431. `context-fixture.ts:58` is false: it is :71.
- **The on-demand reads.** The `reads.ts` and `compare.ts` exports hold.
  - `files.ts` has `ignoredIn` :31, `trackedFiles` :51, `keptFiles` :64 (new, D44) and `fileLog` :90, not :30, :50 and :72.
  - `git-reads.ts`, `autofetch.ts:113`, `lines.ts:251` and the `fs.ts` lines hold. The `statusFor` callers in tests hold.
  - `deposit-git.ts` imports `GIT` at :34, not :33; :33 is `endWith`. `git-index.ts:21` and `git-write.ts:91` hold.
- **The `keptFiles` callers (Z554), not named.** They are `src/routes/api/(machine)/hpc/+server.ts:9` and :38 (passed as `kept`); `submit.ts:100` (the type `(code) => Read<string[]>`) and :215; `submit-world.ts:39`; `submit.test.ts:228`; `submit-files.test.ts:12` and :72.
- **`DESIGN.md:128`.** False. "Git" is :137 and "Watchers" :125. `search.ts:7` and `tmux.ts:3` hold.
- **The folder panel and the context.**
  - `context.ts:138-139`, :462 and :477-495 are false. The `folderPicker` doc is :175, the field :176, it is built at :581, and `close()` is :597-620, which also closes `followed` and `relay`.
  - `context.ts` is 877 lines, 3 under 880, and `server/root` holds 10.
  - `serve.ts` `close` is :45-49, not :43-47.
  - `vite-plugin.ts`'s platform is :54-60, not :49-57.
  - `app.d.ts:26-28` holds. The route's :9-10 holds.
  - `picker.test.ts` is 53 lines with one case. Holds.
  - The fixture's `folderPicker` is :126, not :98.

### Folder counts (brief :108)

`git ls-files <d> | ... | wc -l` printed:
- **Full (10):** `state/sources`, `server/files`, `server/git`, `ui/tree`, `ui/display`, `state/workbench`, `shell/panes`, `state/sessions`, `state/sessions/terminal`, `data/sources/config`; and now also `shell/keys`, `server/root`, `data/model`, `state/life`, `tests/routes/edit`, `server/edit/writes`, `server/edit/writes/config`, `state/client`, `config/text/views/sources`, `server/machine/hpc`.
- **No longer full:** `views/sources/source` is 8.
- **With room:**
  - acts 8;
  - repositories 9;
  - sections-state 8;
  - `state/system` 8;
  - `views/shared/explorer/tree` 9;
  - `server/core` 8;
  - `views/sources/files/sections` 9;
  - `server/files/fs` 8;
  - `views/shared/changes` 6;
  - `tests/server/files` 8;
  - `server/core/git` 7;
  - `server/root/watch` 8;
  - `tests/server/root` 2;
  - `shell/panes/strip` 7.

### Built on D42, and Z488 (brief :110-123)

- **Timeline.** 387 lines, `<Section>` :274, the wrapper :271, `TreeView` :272. Holds. The `more` snippet is :275-306, not :275-300.
- **`timeline-state` `followedTab` :21 and `followedFile` :29.** Holds.
- **`show-in-files.ts`.** It does not exist (`[ -e ]`). PR2 renamed it `state/workbench/layout/open/show.ts`: `showTimeline` type :22, implementation :81, `revealAsked` :58.
- **`reveal.ts:31-49` and :114-115; `ShowPath.svelte:104-108`.** Holds.
- **The Timeline wiring.** `files-view.ts` :97-102, :179-181, :222-224 hold. `Sections.svelte` hands the Timeline its props at :124-130, not :98-104. `Files.svelte` `onpatch` is :302, not :301.
- **`fs-history` follower :62-80.** It is :65-80, the match :76.
- **`ROW_OPEN_SIDE` `row-menu.ts:64` and :521.** False. It is :67, :321 and :575.

### What to build, cases, paths, read list and verify

- **A1.**
  - The `<li>` :281-293 and `<ul>` :271 hold. The style block is :357-385.
  - New on the tree (PR3): a pending naming row, `editing: 'title'` (`place.ts`), for a new presentation.
- **A2.**
  - The `config-write` dispatch is :89-97.
  - The unknown-body answer is `writes.ts:589`, not :524. Case 91's `writes.ts:510` is also :589.
  - `addRoot` :816-819 holds.
- **A5.**
  - `files-view.ts`'s type doc comment is :49-61, not :52-61.
  - `headed` is `Files.svelte:138`, not :137.
  - The section-placing head comment is `Files.svelte:15-19`, not :15-18, and names the clangd sections. The instance-state comment is :24-31, not :26-27.
  - `Sections.svelte`'s head comment is :2-6, not :2-5.
  - The Outline head is :219. The Timeline's controls are :275-306.
  - The section list lacks `ast` and `memory`.
- **C1.** The workspaces poll is :485-488, not :479.
- **C2 and C2's second paragraph.** "The three followers", `docs.svelte.ts:233-243` and :141-148, and `commands.svelte.ts:321-331` are false (see the follower list above). The commands files are `server/machine/runs/commands/files.ts:24-25` and `found.ts:1-9`.
- **C3.** "`PaneView.svelte:186-217` sets it" is false: `strip-tab.ts`. New on the tree (D23c): a library tab is a source tab with `root: ''` and a `library` address (`source.svelte.ts:190-196`).
- **C4.** `dismiss` is `glyphs.yml:35`, not :34.
- **D2.** The load effect is `Source.svelte:363-371` (`loadSourceDraft` at :370). The file is 520 lines, exactly the limit, not 528; its folder holds 8.
- **D5.**
  - The 11 handlers.
  - `auth.ts` :86-90, :105, :109.
  - `writes.ts`: `WriteTarget` :107, `config` :109, `target()` :249, `config:` :263.
  - `context.ts`: the watcher :422-427, `processesText` :532, `liveSettings` :520.
  - `git.ts` config :468 and subscribe :496.
  - `git.test.ts:60`.
- **D13.** `repositories.ts` is 875 lines.
- **D17.** `files.yml:163`.
- **E1.** The roots list is `sources.yml:92-98`. The `options.yml` roots entry is :1104-1112, before :1113. The readers are `settingReader` :98-174 and `settingEntry` :90-95. `catalogs.ts` is :234-251, its file :235. `PROBLEM_READERS` is :505-525. `context.ts` is :371 and `portfolio.ts` :532.
- **E2.** `context.ts:422-427`.
- **E3.** The head comment is `git.ts:27-32`.
- **F2.** `TabFace.svelte:168-172`.
- **F3.** `app.yml:17-40`, `palette.ts:313`; the 520 premise is false.
- **H1.6 and H1.8.**
  - `context-fixture.ts:71` and `context.ts:431`.
  - `run.ts`'s head comment is :1-80, its paragraph :74-76.
  - `GitWatcher.refresh`'s doc is :189.
  - `git.ts` :1-50, `git-routes` :198 and :464-467, and `autofetch.ts:54` hold.
- **H2.** `context.ts:597-620`, the doc :175. `picker.ts`'s head comment is :1-19, not :9-16.
- **Paths.**
  - `tools/oculus/src/lib/server/machine/commands/routes.ts` does not exist (`[ -e ]`). It moved to `machine/runs/commands/routes.ts`.
  - Every other full path exists, except the three new files: `reorder.ts`, `notes.test.ts` and `X3e-report.md`.
  - The `Source.svelte` and `Tree.svelte` ranges are as corrected above.
  - "`tests/server/machine/commands`" does not exist. It is `tests/server/machine/runs/commands`.
- **Read list.** These ranges moved:
  - Read 1 `Tree.svelte:357-385`.
  - Read 4 `bodies.ts:145-155`, `:368-376` and `:520-527`.
  - Read 6 `writes.svelte.ts:340-350`.
  - Read 7 `Outline.svelte:210-225`, `Timeline.svelte:255-310`, plus `clangd/ClangdSection.svelte`.
  - Read 9 `docs.svelte.ts:145-160` and `:240-260`, and `context.ts:325-375` and `:415-435`.
  - Read 11 `PaneView.svelte:175-190`, `pane-view.ts:465-490`, `pages.ts:365-395`, plus `strip/strip-tab.ts`.
  - Read 12 `source.svelte.ts:160-200` and `:340-480`, and `Source.svelte:355-375`.
  - Read 14 `repositories.ts:485-495`, `:570-595`, `:625-637` and `:845-875`.
  - Read 18 `palette.ts:300-335`.
  - Read 19 `catalogs.ts:225-252`, `options.yml:1095-1115` and `sources.yml:85-105`.
  - Read 27 `context.ts:170-180` and `:575-620`, `vite-plugin.ts:45-80`, `context-fixture.ts:60-130`.
- **Tests and verify 4.**
  - The `git.test.ts` sentence assertions are :60, :72 and :151, not :61, :73 and :208. D20's capitalised one is :88, not :125 and :145.
  - `untracked.test.ts:56`, `deposit.test.ts:74`, `git-write.test.ts:174-175`, `git-ops.test.ts` :188, :197, :278, :297, and `tests/server/git/deposit.test.ts:141` hold.
  - Verify 4 misses the guarded entries whose Code line names a write-list path (`grep -n "Code:.*<name>" agents/guarded.md`): G28 (`source.svelte.ts`, :51), G35 (`pty/routes.ts`, :60), G41 (git-write, git-routes, deposit-git, :87), G43 (`keptFiles`, `submit.ts`, :90), G44 (git-routes, git-index, :93), G6 (:23), and G1's `tests/routes/apps/approve.test.ts` and `tests/routes/machine/schedules.test.ts`.
  - The verify commands and test files the brief names exist (`[ -e ]` loop). `test:quick` limit 45 s holds (`tests/tiers/quick.mjs:38`).
- **Doc text and Read 21.** `HELP.md` is 160 lines.
  - :121, :122, :141 and :278 are not the Files, Repositories, Changes and `sources.yml` rows. :121 is the `help` row.
  - The rows are one-line links: Files :93, Repositories :94, Changes :114. There is no `sources.yml` row; it is `docs/configuration.md:22`.
  - The behaviour lives in:
    - `docs/views.md`: "## Files" :55, "## Repositories" :59, "## Changes" :149;
    - `docs/files-and-search.md`: :9, :15, :19, :23, :29, :33-35;
    - `docs/source-control.md`: :5, :13, :37, :49;
    - `docs/apps.md:214` and :325-327, and `DESIGN.md:372`, the `files` notice.
  - DESIGN.md: Watchers :125, Git :137.
- **"Shared with the steps in flight" (:530-561) and "Steps not in flight" (:563-568).** Obsolete.
  - A3, D44, O30 and E4 have landed.
  - `queue.md` says "In flight (0 of 6 slots): none".
  - D45, PR4 and D23b are being prepared. D45's brief names `settings.ts`, `context.ts`, `Source.svelte`, `options.yml`, `server.yml`, `app.yml`, `files.yml`, `palette.ts`, `pty/routes.ts`, `Outline.svelte`, `fs.svelte.ts`, `model-sessions.ts` and `latex.svelte.ts` (grep over `agents/briefs/D45.md`). PR4 names only `views.md`.
  - D28 and M6 wait for X3e.
- **Changes from the brief check.** Finding 5's Tree numbers (:266, :276-288, :351-379) are the brief-check-time values; today they are :271, :281-293 and :357-385. Finding 26's `Repo.svelte:130-132` is today :133-135, and `server.yml:24-54` is today :19-49 and :80-101.
- **Rulings after the recheck.**
  - Z553: D44 has landed (d7ff5fd3). `Source.svelte` is 520 lines, its folder 8, the effect :363-371; the "528 lines, 10 items" text is false.
  - Z554 holds, with the hpc route added.

## 2. Corrections for the brief

1. **:43, :45, :49.** Replace the base sentence with: "read on main at c0a4af9c1; the dispatch checks `git diff --quiet c0a4af9c1 <head> -- tools/oculus/src tools/oculus/config tools/oculus/tests tools/oculus/HELP.md tools/oculus/DESIGN.md tools/oculus/docs`". Replace the landed-steps paragraph with the 15 step commits listed under Base. Drop the "unchanged since 863cdc7d0" list, and :47's 6313da75c list.
2. **Rulings.** Cite Z440, Z524 and Z527 by id only and drop their plan.md line numbers. Add: "Z635 (a): G42 gains a sentence for the desktop app's folder sheet, which no code can close; X3e builds it with a case in `tests/server/files/picker.test.ts`". Z440's sed becomes `sed -n 497,541p`. Z443's numbers become :18 and :98. Z519's become `running.ts` (144 lines) and `server.yml:115-126`.
3. **Every line-number correction under section 1, as the replacement text for that premise.**
4. **:68 and C2.** Replace "Three followers ..." with: "Seven followers read the payload's `root`:
   - `docs.svelte.ts` `filesMoved` :246-254, through `holds` :152-158;
   - `commands.svelte.ts:322-332`, through `holds`;
   - `fs-history.ts:65-80`, through `pathUnder` :76;
   - `latex.svelte.ts:356` and `filesMoved` :389, through `holds` :382;
   - `state/sources/files.svelte.ts:85-89`, which marks every query;
   - `state/life/present.svelte.ts:74-79`, which marks every deck on `files`, `portfolio` or `config`;
   - the apps: `apps/rules.ts:102-105` and `apps.svelte.ts:296`, :356."

   C2's second paragraph and decision 32 follow the ruling in Stop 3.
5. **:92 and C3.** Replace with: "`stripTab` (`shell/panes/strip/strip-tab.ts:30-60`, `file` :42, `StripTabFacts` :22-28), called at `PaneView.svelte:183-185`, builds each tab". C3 then sets `gone` in `stripTab` through a new `StripTabFacts` member. Add `src/lib/shell/panes/strip/strip-tab.ts` to the paths. Add to C3: "a library tab (D23c: a source tab with `root: ''` and a `library` address) is never marked gone, and `gone(root, path)` answers false for the empty root".
6. **:75 and D2.** Replace with: "`loadSourceDraft` (`source.svelte.ts:343-373`) reads through `readOnce` (:416-437), whose lifetime check (:419) answers at once for any draft read in this lifetime; D23c's `loadLibraryDraft` (:380-404) uses it too; `reloadSource` (:461) skips a library draft; nothing reads a head or index draft again". D2's `reloadHead` leaves a library draft alone.
7. **:79 and D5, decision 26.** "eleven handlers ... 19 routes". Add `handleSchedules` (`machine/runs/schedules/routes.ts:249`, route `src/routes/api/(machine)/schedules/+server.ts`) and `handleApprovePost` (`machine/apps/routes.ts:104`, route `src/routes/api/(apps)/approve/+server.ts`). Add both to the paths, with their tests: `tests/routes/machine/schedules.test.ts`, `tests/routes/apps/approve.test.ts`, `tests/server/machine/runs/schedules/file.test.ts` and `record.test.ts`.
8. **Paths :442.** `machine/commands/routes.ts` becomes `machine/runs/commands/routes.ts`. Paths :509 `tests/server/machine/commands` becomes `tests/server/machine/runs/commands`.
9. **Z554 paths.** Add `src/lib/server/machine/hpc/submit.ts`, `src/routes/api/(machine)/hpc/+server.ts`, `tests/server/machine/hpc/submit-world.ts`, `submit.test.ts` and `submit-files.test.ts` (`kept` type `(code) => Read<string[]>` at `submit.ts:100`, called at :215).
10. **A5.** Add `src/lib/views/sources/files/sections/clangd/ClangdSection.svelte` to the paths (the head at :45), under Stop 2's ruling. Fix the head-comment ranges to `Files.svelte:15-19` and :24-31 and `Sections.svelte:2-6`.
11. **Sizes, a new item under Conventions.**
    - `server/root/context.ts` is 877 lines and `server/root` is full. H2 and E1/E2 take it over 880, so it is split by concern into an existing subfolder (`server/root/watch` holds 8, `process` 7).
    - `data/model/model-sessions.ts` is 876 lines and `data/model` is full. C1's `FilesPayload` doc and members take it over, so a whole section moves into an existing model file, with `index.ts` following. Add `src/lib/data/model/` to the paths.
    - `repositories.ts` is 875. `fs.svelte.ts` is 840 in the full `state/sources`.
    - The full-folder list at :685 drops `views/sources/source` and adds `shell/keys`, `server/root`, `data/model`, `state/life` and the others listed under Folder counts.
12. **A1 and A6.** Add: "a pending naming row (`editing` set, including PR3's `title` row of a new presentation) is no drop target and is not moved by Alt+Up or Alt+Down". Add that `reorderedKeys` is built on `movedOrder` (`collection.ts:437`), as PR3's `withMove` (`state/life/slides.ts:152`) is, so the duplication check sees one order rule.
13. **Verify 4.** Add G28 (its tests, among them `tests/state/sessions/source.test.ts`), G35 (`tests/routes/sessions/terminal.test.ts` and its named files), G41 (`tests/server/core/git-failure.test.ts`), G43 (`tests/server/machine/hpc/submit.test.ts` and `submit-files.test.ts`), G44, G6, and G1's `approve.test.ts` and `schedules.test.ts`.
14. **Doc text and Read 21.** Target the docs pages and lines listed in section 1. Change HELP.md rows :93, :94 and :114 only where their one line becomes false. Add `docs` to the grep after a change of name or shape, which `spec.md:66` omits.
15. **"Shared with the steps in flight".** Replace with: "None in flight (`queue.md`). D45 (being prepared) names `settings.ts`, `context.ts`, `Source.svelte`, `options.yml`, `server.yml`, `app.yml`, `files.yml`, `palette.ts`, `pty/routes.ts`, `Outline.svelte`, `fs.svelte.ts`, `model-sessions.ts` and `latex.svelte.ts`, judged at whichever is dispatched second. PR4 names `docs/views.md` (the Present section), which is simple. D28 and M6 land after X3e and build on its text."
16. **The O30 sentence (:567).** Drop it; O30 has landed, and its `ask` is on main (picker.ts:63, :120-123).
17. **Z553 (:773).** Replace with: "D44 landed at d7ff5fd3; `Source.svelte` is 520 lines (the limit), its folder 8, the load effect :363-371: D2 adds no line there without moving code out by concern."

## 3. Stops

None of these is ruled: the state file's open-items list reads "None", and `grep -n X3e choices.md` shows nothing after the earlier recheck.

1. **Z635 against H2 and H3.** H2 sets `PickerState` to `{ panel: AbortController | null }`, which drops O30's `ask` (picker.ts:63, :120-123). Nothing ends a waiting `state.ask()` when the connection closes. G42's Test line (`guarded.md:30`) has five titles and no sheet title. The brief must carry Z635's desktop half: H2's text with `ask` kept, raced against the controller, and a sixth row. The orchestrator writes the sixth title into G42 before dispatch. The proposed text is in X3e-premise-recheck-2.md section 4 and still holds on this head.
2. **A5 with D23's `ast` and `memory`.**
   - What A5 builds (a user-visible order):
     - (a) both are ids in the order, by default after `outline`, dragging through `ClangdSection.svelte:45`, and an absent section keeps its place;
     - (b) both are fixed below Outline. (b) is the lazy option.
   - Recommendation: (a).
3. **The four extra `files` followers (latex, project files, Present, apps) and C1's folder messages.**
   - (a) each takes the folder test;
   - (b) only the three named change, so each `node_modules` window rereads LaTeX state, project file lists and every deck.

   (b) is the lazy option. Recommendation: (a). PR3 has landed, so `present.svelte.ts` is no longer shared.
4. **The app contract of the `files` notice** (`docs/apps.md:214`, :325-327, `DESIGN.md:372`; `rules.ts:102-105`):
   - (a) apps receive `folders` and `workspaces`, and the docs say so;
   - (b) `rules.ts` strips them and drops `{ root: '', workspaces: true }` for apps.

   The lazy option is to pass them and leave the docs false. Recommendation: (a).
5. **F3's new file.** `shell/keys` is full (10) and `Palette.svelte` is 508 lines, so `PaletteCommands.svelte` cannot be made there, and F3's reason (over 520) is false. PR3 added view-offered commands to the palette (`viewItems`, `offered`, `openPaletteItem(client, item)`).
   - (a) descriptions in `palette.ts` and `PaletteRow.svelte` with no new file;
   - (b) a subfolder `shell/keys/palette/`.

   The lazy option is to compact `Palette.svelte` to fit. Recommendation: (a), with (b) if the file would pass 520.
6. **Decision 28's reason ("the file's own form").** It is false: `server.deck_edit.changed` and `server.deck_slides.order_changed` end with full stops.
   - (a) keep D5's no-full-stop form, its reason being `config_key` and `config_value`'s form;
   - (b) one form for the whole file, rewriting PR2's and PR3's lines.

   The lazy option is (a) with the old reason left. Recommendation: (a) with the reason rewritten.
7. **Z468's widening (plan.md:202) is not in the brief.** The C7 requirement of X3e-premise-recheck-2.md section 3 still holds on this head: `watch/git.ts` is unchanged since e7dce01e, `open` :317-353 skips a missing root and `follow` never reopens it. It covers roots outside the hub and a root whose folder is missing at its first watch.
   - (a) retry at each poll or config push;
   - (b) unwatched until the root list changes, which is the lazy option.

   Recommendation: (a), with recheck-2's eight look cases.
8. **The Doc text target.** The guides moved to `docs/`. Recommendation: the docs pages listed, with HELP.md rows changed only where false. The lazy option is HELP.md only, which leaves `docs/files-and-search.md` and `docs/source-control.md` false.

## 4. Already built

Nothing. These greps found none of the step's pieces on main:
- `grep -rn "order.json\|repository_scan_depth\|ROOT_DRAG\|SECTION_ORDER\|order-roots\|order-notes\|refused_roots_\|tab_deleted\|cmd_theme" src config --exclude=local.yml` printed nothing.
- `keys.ts` has no `open-side` or Alt+Arrow entry.
- `spawnSync` is still `run.ts:159`.
- `ch_group_empty` is still read at `ChangeGroups.svelte:136` and `Changes.svelte:215`.
- `background: currentColor` is still at `OpenEditors.svelte:255`.
- `Worktrees.svelte` has no `onenter`.
- `FilesPayload` is still `{ root; bookmarks? }`.
- Only `watch/git.ts:243` and `watch/bookmarks.ts:76` publish `files`. D23's `lsp/held/watch.ts` watches roots for language servers and publishes nothing on that channel.

Agent usage: claude-opus-5-5, about 64 tool uses (counted from this transcript), about 325,000 tokens (from the context counter, 15,000,000 to about 14,675,000), time not measured.

Agent: a5362788c15eea5c9, claude-opus-5-5, 345,597 tokens, 111 tool uses, 12.9 min.
