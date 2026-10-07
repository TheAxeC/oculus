X3e premise recheck on main at 8bd2070c

Main's head is d5d7f727b. It is Axel's Z699 fix, one commit after 8bd2070c. `git diff --stat 8bd2070c HEAD -- tools/oculus/src tools/oculus/tests tools/oculus/config tools/oculus/docs tools/oculus/HELP.md tools/oculus/DESIGN.md` printed one file, `src/lib/views/sources/file/pdf/viewer.svelte.ts | 13`, and that file is on no X3e path. So every line number below holds at both commits. Paths are under `tools/oculus/` unless they start with `.scratch`.

The working copy of `plan.md` has two uncommitted lines above the rulings. `git diff -U0 -- plan.md` shows hunks at :246 and :533. So every ruling line in the working file is the HEAD line plus 2. Below, a ruling line is given as "working file / HEAD".

What is not done, and must be done before dispatch:

(a) The brief has not been corrected since the S5-to-D20 recheck. `grep -c "Z684\|Z635\|ClangdSection\|c0a4af9c" X3e.md` printed 0. `git log -1 -- agents/briefs/X3e.md` printed ef4fb22b3, which predates Z684 (`git log -1 -S Z684 -- plan.md` printed f8e546158). So neither recheck 3's corrections nor Z684's eight choices are in the brief.

(b) G42's Test line still names five titles and no sixth title for the desktop sheet (`sed -n 30p agents/guarded.md`). Z684 (1) requires the sixth title to be written into `agents/guarded.md` before dispatch.

(c) The section "Shared with the steps in flight" (brief :530-568) describes A3, D44, D45, O30 and E4 as in flight or queued. All five have landed (`git log --oneline --grep "^Land A3\|^Land D44\|^Land O30\|^Land E4"` printed 09509b5b6, d7ff5fd3d, 3cb170eae, 10ac00c69; `queue.md` lists D45 as landed at 0753a5e7).

## 1. Every premise checked

The brief's line numbers come from `grep -n` on `agents/briefs/X3e.md` (774 lines).

Base and plan line
- :3, ADR. Holds. `ls docs/adr` fails, and `.agents/plan.yaml:15` holds `    libraries: check` with no `adr:` key.
- :7, X3e at `plan.md:196`. Holds: `grep -n "^- X3e " plan.md` printed 196.
- :43, :47, :49 and :97 say "read on main at 8411697e8". Moved. Corrected text: "read on main at 8bd2070c, after S5, X3f, D38, D20, D23, D23c, PR3, PR4, D23b and D45". The dispatch check becomes `git diff --quiet 8bd2070c <head> -- tools/oculus/src tools/oculus/config tools/oculus/tests tools/oculus/HELP.md tools/oculus/DESIGN.md tools/oculus/docs`. Between the earlier report's base and now, `git log --oneline c0a4af9c..HEAD -- tools/oculus/src tools/oculus/tests tools/oculus/config tools/oculus/HELP.md tools/oculus/DESIGN.md tools/oculus/docs` printed d5d7f727b, 0753a5e76, 639820b91 and eede45985.

Ruling lines (brief :11-41)
- `grep -nE "^- Z(...) " plan.md` printed these lines (working file / HEAD):

| Ruling | Line |
|---|---|
| Z311 | 1090/1088 |
| Z358 | 1140/1138 |
| Z359 | 1141/1139 |
| Z438 | 1221/1219 |
| Z439 | 1222/1220 |
| Z440 | 1223/1221 |
| Z441 | 1224/1222 |
| Z442 | 1225/1223 |
| Z451 | 1233/1231 |
| Z452 | 1234/1232 |
| Z443 | 1235/1233 |
| Z468 to Z471 | 1251-1254/1249-1252 |
| Z488 to Z490 | 1271-1273/1269-1271 |
| Z494 | 1277/1275 |
| Z505 | 1287/1285 |
| Z508 | 1289/1287 |
| Z524 | 1300/1298 |
| Z527 | 1301/1299 |
| Z552 to Z554 | 1325-1327/1323-1325 |
| Z519 | 1342/1340 |
| Z525 | 1344/1342 |
| Z635 | 1418/1416 |
| Z684 | 1466/1464 |

- :19, :25, :26 and :239-240 cite these lines wrongly. Corrected text: Z440 "`plan.md:1223`" (the brief has 1171), Z524 "`plan.md:1300`" (the brief has 1248), Z527 "`plan.md:1301`" (the brief has 1249). The same holds for `plan.md:1248-1249` at :516.
- :25, Z519. Partly moved.
  - Holds: `classifyFailure` at `parse.ts:703` and `failureText` at `git-routes.ts:386`, from `grep -n`.
  - Moved: `running.ts` is 144 lines (`wc -l`), not 139. The `server.git` group is at `config/text/server.yml:115-126`, not :85-96 (`sed -n 115,128p`).
- After :41, add Z635 (a) and Z684 (1) to (8) as rulings, verbatim from `plan.md:1418` and `:1466`. Z684 overrides decisions 18, 24, 28 and 32 and items A5, C2, F3 and H2 where they differ.

Files view, reorder (brief :53-63)
- :53, the drag. Mostly holds.
  - Holds: `dragging.svelte.ts` is 135 lines, with `draggable` :54, `over` :84, `dropped` :105 and `DraggingDeps` :27-32. `drag.ts` is 41 lines.
  - Moved: `Tree.svelte` is 385 lines, not 384, and its style block is :357-385, not :356-384. `createDragging` :203-208, `<ul class="rows">` :271 and `<li` :281-293 hold.
- :54, which roots may move. Moved.
  - `fs-transport.ts` now has the `fixedRootKeys` doc at :89, the function at :95, `configuredRootKeys` at :110, and `fixedRootsOf` with its doc at :119-135. The brief's range :87-133 becomes :89-135.
  - `config/sources.yml` has `roots:` at :92 and the entries at :93-98, not :88 and :89-94 (`sed -n 92,101p config/sources.yml`).
- :55, the roots write. Moved.
  - `roots.ts` holds: `writeRoots` :140, `addRootTo` :173, `removeRootFrom` :184.
  - `RootsWrite` is `bodies.ts:149-151`, not :113-115, and `rootsShape` is :371-374, not :288-291.
  - `config-write.ts` dispatches at :89-97, not :93-102.
- :56, `POST /api/fs`. Holds: `ACTIONS` :487, `fsBodyShape` :500, `textShape` :425, `chained` :658.
- :57. Moved: `listText` is `list-edit.ts:78`, not :73-84, and `setItems` is :125, not :113.
- :58, notes.
  - Holds: `notes.ts` is 125 lines.
  - Moved: G31 is `agents/guarded.md:74-76`, not :63-64. Its Code line now also names `src/lib/server/machine/lsp/choices.ts` (`sed -n 75p agents/guarded.md`).
  - `tests/server/files` holds 8 items, so the new test makes 9.
- :59, `refusal.ts:11-24`. Holds.
- :60, bookmarks. Moved.
  - `reorderEntries` is `writes.svelte.ts:343`, not :297.
  - `reorderCollection` is `entries.ts:299`, not :294.
  - `fileOrder` is `collection.ts:414`, not :417, and `movedOrder` is :434, not :437 (D45 moved the lines with its `fileBytesUrl` change).
- :61, sections. Moved.
  - Corrected text: "`Files.svelte` (324 lines) draws OpenEditors (:232), the note line (:236-238), Outside (:240), BookmarkForm (:248), the said line (:264-266), ShowPath (:267), Follow (:275), RootedTree (:289), then `Sections` (:297, `onpatch` :302)."
  - "`Sections.svelte` (153 lines) draws Outline (:117), Ast (:118), MemoryUsage (:119-123), Timeline (:124-130), Bookmarks (:131-142) and Notes (:143-153)."
  - "Each section draws its own head: `OpenEditors.svelte:148`, `Outline.svelte:219` (TreeView :217), `Timeline.svelte:275` (TreeView :273), `Bookmarks.svelte:72`, `Notes.svelte:61`, and the clangd sections through `sections/clangd/ClangdSection.svelte:45` (TreeView :39)."
  - Source: `grep -n "<Section\|<TreeView"` and `wc -l`. D23 (797e1e5dc) added the AST and Memory Usage sections; `git log --oneline -1 -- Sections.svelte` printed 797e1e5dc. They draw only once asked (`{#if answer !== null}`, `Ast.svelte:52` and `MemoryUsage.svelte:76`).
  - `views/sources/files/sections` holds 9 items, not 8.
- :62, collapse. Holds: `collapseAll` is `tab-actions.ts:95-103`. Moved: `collapseRoot` is `place.ts:162`, not :161.
- :63, keys. Holds: `ENTRIES` is `keys.ts:40-57` with Cmd+A at :54, and the TreeView and tree-keys lines hold.

Files view, following the disk (brief :67-70)
- :67, `fs.svelte.ts`. Holds. It is 840 lines, with afterReceive :396, relistFolder :445, readListing :467, invalidate :698, refresh :713, and the head comment :12-19.
- :68, the `files` channel. Moved.
  - `FilesPayload` is at `model-sessions.ts:510`, with its doc at :502-509, not :672. D45 moved the terminal types to `model-processes.ts`, and `model-sessions.ts` is 714 lines.
  - The publish is `watch/git.ts:243`, inside `reread` :239-255.
  - `filesShape` is `payloads.ts:112-114`, not :108-110. D45 added a `jump` shape after `appsShape`.
  - `mergeFiles` at :8-14 holds.
- :69, the git watcher. Moved.
  - Corrected text: "`server/root/watch/git.ts` (511 lines): `IGNORED` :81, `relevant` :125, `subrepositories` :150-161, `reread` :239-255, `touch` :271, `heard` :306, the watch callback with `_event` :344, `scan` :391, `wanted` :401, `follow` :425-453 (its `statusFor` :437), the workspaces poll :485. The head comment states the one-deep rule at :27-31."
  - Source: `grep -n "const [a-z]* = ("` and `awk` for the function ends.
- :70, construction. Moved: `make.watchGit` is `context.ts:425`, in `startGit` :424-429, not :363. `listingAnswer` is `fs-transport.ts:266-284`, not :280-293. The 404 at `fs.ts:482` holds.

Repositories and Changes (brief :72-82)
- :72, source drafts. Moved.
  - `openHead` :483 holds.
  - Corrected text: "`loadSourceDraft` (`state/sessions/source.svelte.ts:344`) reads through `readOnce` (:418), which returns at once for a draft read in this lifetime (:420, `held.readIn === LIFETIME && held.file === file`); `reloadSource` is :462, called by `ops.svelte.ts:295` and `Present.svelte:175`."
- :73. Holds: `switchBranch` :390 and `switchDetached` :410.
- :74, `CommitBox.svelte:67-73`. Holds. The file is `views/shared/changes/CommitBox.svelte`.
- :75, the 62 literals. Holds. `grep -rn "failed(\`[a-z]\|failed('[a-z]" src/lib/server | cut -d: -f1 | sort | uniq -c` printed deposit 20, git-index 19, git-write 13, git-refs 4, git-remote 4, git-routes 1 and deposit-git 1. It also printed `machine/lsp/held/process.ts` 2, which is outside D5's scope. The `git-routes.ts` literals :137, :259, :369 and :432 hold.
- :76, the write token. Moved.
  - Corrected text: "`tokenedBody` (`server/core/auth.ts:97`) answers 403 with `shape.words?.token ?? 'the write token is missing or stale'` (:105) and 400 with `... 'the body is not JSON'` (:109); `RefusalShape` is :86-90; `gatedBody` is :118, calling `tokenedBody` at :122."
  - "There are 14 handler call sites (writes.ts:315, apps/routes.ts:104, runs/schedules/routes.ts:249, runs/commands/routes.ts:90, open.ts:347, fs.ts:646, source.ts:150, deposit-routes.ts:191, picker.ts:109, git-routes.ts:421, memories.ts:164, content/latex/endpoint.ts:579, pty/routes.ts:404, fs/ops.ts:717). `gatedBody` serves 5 routes, so 19 routes in all."
  - Source: `grep -rn "tokenedBody(\|gatedBody(" src/lib src/routes`.
  - The three file routes are `fs.ts:646`, `fs/ops.ts:717` and `fs/picker.ts:109`.
- :77, empty groups. Holds: `changeGroups` :209, `Changes.svelte:213-216`, `ChangeGroups.svelte:136`, `changes.yml:73`.
- :78, the graph. Holds: `CommitRow.svelte:77`, `Graph.svelte:359` and :419, `RepoList.svelte:103-106`, `commitMenu` at `graph-menu.ts:81`.
- :79, worktrees. Moved.
  - `worktreeLabel` is `repositories.ts:490-493`, not :485-488.
  - `pickerRoots` is :575-577, not :570-572.
  - `WorktreeOpening` is :852-857, not :847-852.
  - `openWorktree` is :865-875, not :860-870.
  - `repositories.ts` is 875 lines, not 870.
  - `Worktrees.svelte:222` holds.
- :80-82. Holds: `ChangeGroups.svelte` is 330 lines with `.pa` at :146 and :300, and `ChangesTouched.svelte:51` holds.

Other (brief :85-93)
- :85, the palette. Moved.
  - Corrected text: "`commands()` (`state/workbench/palette.ts:316-340`) holds literal hints and no description, and spreads `choiceCommands(served)` (:306-313), whose names and hints come from `LSP_CHOICES` (`data/prose/lsp-servers.ts:193-197`: `interpreter` `<path>`, `compile-database` `<name>`, `svelte-config` with no hint). `shell/keys/Palette.svelte` is 520 lines, at the limit; command rows are drawn at :436-440. `shell/keys` holds 8 items."
- :86, Ticker. Holds: :304-320 and :322.
- :87, the dirty dot. Moved: `.dirty` is `OpenEditors.svelte:250-257`, not :250-256. TabFace's dirty glyph is :168-172, not :165-169.
- :88, the folder panel. Moved.
  - Corrected text: "`picker.ts` answers `busy` at :117 and reads the exit status at :125 (`done.code !== 0`). Since O30 (3cb170eae) `PickerState` is `{ open: boolean; ask?: PickAsk }` (:63). In the desktop app, `handlePick` awaits `state.ask()` (:120-121), which `src/server.ts:72` sets to `askParentToPick(parent)` (`server/root/process/parent.ts:96`). `pickerLine` is `folders.ts:77`. `files.picker_busy` is `files.yml:164` and `picker_failed` is :165."
- :89, the breadcrumb. Holds: `grep -c "Breadcrumb\|crumbsOf" Files.svelte` printed 0, and `tab-crumbs.ts` exists.
- :90, tabs. Moved.
  - Corrected text: "`PaneView.svelte:185` builds each tab through `stripTab` (`shell/panes/strip/strip-tab.ts:30`, facts type :22), which sets `file` from `shownFileOfTab` at :42. `fileOfTab` is `pages.ts:371` and `shownFileOfTab` :391. `tabHint` is `pane-view.ts:472`."
- :91, glyphs. Holds: no `head` glyph exists. Note that lucide `target` is already the icon of the `focus` glyph (`icons.yml:87`), and ASCII `@` is already `circle_filled` (`glyphs.yml:144`). See section 5.
- :92, config readers. Moved.
  - Corrected text: "`settings.ts` is 770 lines; `settingEntry` :105-111, `settingReader` :114 (`behavior.yml` at :118), `heldAt` :87-103; `PROBLEM_READERS` is :734-752 with `latexBuild` last (`latexAutoBuild` is now an inner reader at :513, called from `latexBuild` :700); `settingProblems` is :760-770."
- :93, the palette group. Holds: `app.palette` starts at `app.yml:17`, `cmd_unknown` is :21, and the group now runs to :77 (`grep -n "^        [a-z_]*:" app.yml` printed :17 and :78). The theme hint is `palette.ts:327`, not :280.

Git reads and the folder panel (brief :97-106)
- :97. The base text moves as at :43. `reads.ts` exports hold.
- :99, run.ts. Moved.
  - `run` is `run.ts:148-182` and `spawnSync` is at :159 (import :82).
  - `show` is :133 and `readDiff` :138.
  - 'git timed out' is :167 and 'git failed' :171.
  - Others: `registry.ts:66` and `codex.ts:387` hold.
- :100. Holds: `files.ts:39` and `compare.ts:63` and :138.
- :101, the state read. Partly moved.
  - Holds in `state.ts`: `statusFor` :95, `state` :112, `checkedOut` :183, `upstream` :325, `log` :204, `refs` :220, `stashes` :235, `remotes` :241, `worktrees` :283, status :165, numstat :172.
  - Moved in `watch/git.ts`: corrected to "`reread` (`root/watch/git.ts:239-255`, `statusFor` at :245, publish at :243, the rescan's `follow()` at :241) and `follow` (:425-453, `statusFor` at :437)".
- :102, refresh. Holds: `git-routes.ts:468` (finally :461, type :199) and `autofetch.ts:55` and :206.
- :103. Holds: the export lines of `reads.ts`, `compare.ts` and `files.ts` all match `grep -n "^export"`.
- :104. Holds: `git-write.ts` run :148 and stdin :189.
- :105. Moved: the Git paragraph is `DESIGN.md:137`, not :128. `search.ts:7` and `tmux.ts:3` hold.
- :106, the folder panel. Moved.
  - Corrected text: "`osascript` runner `picker.ts:81-91` (`execFile` :82); `PickRun` `{ code, out }` :48; `PickRunner` :51; `PickAsk` :57; `PickerState` `{ open; ask? }` :63; `pickerState()` :66; `PickDeps` :71-74; `handlePick` :103-135; the head comment :1-20. `ServerContext.folderPicker` is `context.ts:177-178`, built at :583; `close()` is :599-623."
- :108, folder counts. Moved. Corrected text from the `git ls-files` loop:
  - At 10: `state/sources`, `server/files`, `server/git`, `server/root`, `ui/tree`, `ui/display`, `state/workbench`, `shell/panes`, `state/sessions`, `state/sessions/terminal`, `data/sources/config`, `data/model`, `state/life`, `tests/routes/edit`, `state/client`.
  - At 9: `views/sources/source`, `state/sources/repositories`, `views/shared/explorer/tree`, `views/sources/files/sections`, `server/files/fs`.
  - At 8: `state/sources/explorer/acts`, `state/sources/explorer/sections`, `state/system/apps`, `server/core`, `shell/keys`, `tests/server/files`, `root/watch`.
  - Also: `tests/server/root` 2, `state/sessions/latex` 5.

Built on D42 (brief :112-118)
- :112. Moved.
  - `Timeline.svelte` is 388 lines (D23b added a line). The wrapper is :272, `TreeView` :273, `<Section>` :275 and the `more` snippet :276-307.
  - `followedFile` :29 holds.
- :113. Moved.
  - `show-in-files.ts` does not exist (`ls src/lib/state/workbench/layout/open/`). Corrected text: "`state/workbench/layout/open/show.ts` (`showTimeline` type :23, `revealAsked` :62, implementation :102)".
  - `reveal.ts:114` holds. The `ShowPath.svelte` query is at :106.
- :116. Moved: `Sections.svelte` hands the Timeline `view` and `onpatch` at :124-130, not :98-104. `Files.svelte` hands `onpatch` at :302, not :301. `files-view.ts` holds.
- :117. Moved: the follower is `fs-history.ts:65-80`, with `pathUnder` at :76.
- :118. Moved: the `<Section>` is at `Timeline.svelte:275`. The default order, by Z684 (2), is `editors, files, outline, ast, memory, timeline, bookmarks, notes`.
- :122, `ROW_OPEN_SIDE`. Moved: `row-menu.ts:67`, :308 and :549 (`grep -rn ROW_OPEN_SIDE src/lib`).

What to build
- :129, A1. Moved: the style block is :357-385.
- :130, A2. Moved: `config-write.ts:89-97`.
- :133, A5. Moved by Z684 (2). Corrected text:
  - "Every section head drags: Open Editors (`editors`), the tree (`files`), Outline, AST (`ast`) and Memory Usage (`memory`) through `ClangdSection.svelte:45`, Timeline, Bookmarks and Notes."
  - "`SECTION_ORDER` is `editors, files, outline, ast, memory, timeline, bookmarks, notes`."
  - "A section that is not drawn (AST or Memory Usage before it is asked, the tree's head in a following tab) keeps its place in the order."
- :145, C2. Moved by Z684 (3), together with :147 ("The three followers"). Corrected text:
  - "Every follower of the `files` channel takes C1's folder test:
    - `docs.svelte.ts` (`holds` :152, afterReceive :181, `concerns` :238-243, `filesMoved` :246-254);
    - `commands.svelte.ts:322-332`;
    - `fs-history.ts:65-80`;
    - the LaTeX store (`state/sessions/latex/latex.svelte.ts`: afterReceive :205-209, `concerns` :226-231, `filesMoved` :238-250, which calls `builds.filesMoved` at `latex/builds.ts:586-593`);
    - `state/sources/files.svelte.ts:85-89`;
    - `state/life/present.svelte.ts:181-186`;
    - the apps filter `state/system/apps/rules.ts:102-105` with `apps.svelte.ts:296` and :356.
  - `refresh(key, version)` is `fs.svelte.ts:713`.
  - The commands files are `server/machine/runs/commands/files.ts:24-25` and `found.ts:1-3`; the brief's `server/machine/commands/` path does not exist (`ls`).
- :148, C3. Moved: `Tab` gains `gone`, set in `strip-tab.ts` (`stripTab` :30), not `PaneView.svelte:186-217`.
- :149, C4. Moved: `dismiss` is `glyphs.yml:35`, not :34.
- :156, D2. Moved by Z553. The effect now lives in `views/sources/source/save/tab-draft.svelte.ts:33-41`, which calls `deps.load(id, root, path, stage)`; D23b added that file (`git log --diff-filter=A` printed 639820b91). `Source.svelte` passes `load: loadSourceDraft` at :198-211 and is 517 lines. Corrected text: "`reloadHead` is passed as a new dependency of `createTabDraft` and called from its effect when the git signature moves; `Source.svelte` passes it (3 lines of room)."
- :159-160, D5. Moved.
  - The refusal sentences of `server.yml` no longer all end without a full stop. PR3's `deck_edit` (:50) and `deck_slides` (:69) end with one (`awk 'NR>=50 && NR<=79 && /[.]["'"'"']?$/'` printed three lines). Corrected text by Z684 (6): "as the groups `config_key` (:19-49) and `config_value` (:80-101) end".
  - The `git` group is :115-126.
  - `git-routes.ts:188-189` is the `config` option of `GitOptions`, which holds.
- :161. Moved by the same count: "the 14 routes that answer the sentence and `gatedBody`'s" in place of "the nine routes". The routes added since are the LaTeX endpoint (:579) and memories (:164); see :76.
- :163, the singulars. Holds: `Repo.svelte:133` and `CommitBox.svelte:78`.
- :178, D13. Moved: `repositories.ts` is 875 lines, not 870.
- :182, D17. Moved: `files.yml:164`, and the panel functions are `ops.svelte.ts` `pick` :590, `addFolders` :595 and `openFolder` :611.
- :186, E1. Moved: the depth goes after the `roots:` list (`sources.yml:92-98`), with its entry after `roots` (`options.yml:1190-1198`) and before `local.yml:` (:1199). `settingFindings` is `catalogs.ts:243-258`, with file `behavior.yml` at :244.
- :188, E2. Moved: the watcher's options are at `context.ts:424-429`.
- :189, E3. Holds: the head comment is :27-31.
- :194, F2. Moved: TabFace is :168-172.
- :195, F3. Moved by Z684 (5). Corrected text:
  - "The descriptions and hints are read in `palette.ts` and drawn by `PaletteRow.svelte` with no new file; a subfolder `shell/keys/palette/` is made only if a file would pass its limit (`Palette.svelte` is 520)."
  - "The commands with no hint key are `crt`, `help`, `update`, `folder` and `svelte-config`; `interpreter` and `compile-database` take `cmd_interpreter_hint` and `cmd_compile_database_hint`."
  - "The theme hint is at `palette.ts:327`."
- :205-219, H1. Moved lines.
  - `run.ts` :164 and :168 become :167 and :171.
  - The head paragraph :71-73 becomes :74-76 (`grep -n "call site" run.ts` printed :74).
  - `GitWatcher.refresh`'s doc is `watch/git.ts:189-190`, not :184.
  - `autofetch.ts:113` and `lines.ts:251` hold.
- :211, H1.4. Moved by Z554. Add the callers of `keptFiles`: `server/machine/hpc/submit.ts` (type :100, call :215), `src/routes/api/(machine)/hpc/+server.ts:9` and :38, `tests/server/machine/hpc/submit-world.ts:39` and `submit-files.test.ts:72` (`grep -rn keptFiles src tests`).
- :221-234, H2. Moved by Z684 (1) and O30. Corrected text:
  - "`PickerState` is `{ panel: AbortController | null; ask?: PickAsk }`, keeping O30's `ask`."
  - "In the desktop app `handlePick` stops waiting on `ask()` when the connection closes or the controller aborts, answers `failed` to the gone connection, and clears `panel` in `finally`. The next press asks the parent again, and a late answer of the old sheet resolves a promise nobody reads, so it adds no folder. The host already answers `cancelled` when its page goes (`src/desktop/windows/pick.ts:4-5`)."
  - "The route at `+server.ts:9-10` passes `platform?.req.socket` (`app.d.ts:26-27` declares `Platform.req`)."
  - "The head comment is `picker.ts:1-20`."
  - "G42 gains a sixth test row for the desktop sheet."
- :239-240. Moved: `plan.md:1300` and :1301, and `guarded.md:28-30` holds.

Cases (brief :251-419)
- :363, case 91. Moved: the route's unknown-body answer is `writes.ts:589`, not :510.
- Cases 1 to 6 hold: `ordo`, `cathedra` and the other roots are listed at `sources.yml:93-98`.
- Section 6 adds the new cases 128 to 141.

Paths (brief :420-528)
- :426. Moved: `context.ts` is 879 lines and `server/root` holds 10, so this step must split it. See section 5, choice I1.
- :442, `server/machine/commands/routes.ts`. Moved: corrected text "`server/machine/runs/commands/routes.ts`". The listed path does not exist (`ls`).
- :444. Moved: `FilesPayload` is at :510.
- :446. Moved: `settingFindings` is `catalogs.ts:243-258`.
- :450. Moved: `filesShape` is at :112-114.
- :455. Moved: `ops.svelte.ts` :584-625 (`pick` :590, `addFolders` :595, `openFolder` :611).
- :457. Moved: `fs-history.ts:65-80`.
- :458. Moved: `docs.svelte.ts` :152-158 and :238-254, and `commands.svelte.ts` :322-332.
- :466. Moved by Z684 (2). Add `views/sources/files/sections/clangd/ClangdSection.svelte` (the head's drag props and `onkey`).
- :467. Moved: the style block is :357-385.
- :479, Source. Moved. Corrected text: "`views/sources/source/save/tab-draft.svelte.ts` (the `reloadHead` dependency and its call, D2) and `Source.svelte` (the dependency passed at :198-211 only; 517 lines)".
- :481. Moved by C3: add `shell/panes/strip/strip-tab.ts`.
- :484. Moved by Z684 (5): drop `PaletteCommands.svelte` (new). F3 also takes `data/prose/lsp-servers.ts` when the choice hints move to the catalog (section 5, I3).
- :513. Moved: `context-fixture.ts` `git.refresh` is at :71, not :58.
- Paths to add, each with the ruling that brings it:

| Path | Ruling |
|---|---|
| `state/sessions/latex/latex.svelte.ts` and `latex/builds.ts` | Z684 (3) |
| `state/sources/files.svelte.ts` | Z684 (3) |
| `state/life/present.svelte.ts` | Z684 (3) |
| `state/system/apps/rules.ts` and `apps.svelte.ts` | Z684 (3), (4) |
| `server/machine/hpc/submit.ts` | Z554 |
| `src/routes/api/(machine)/hpc/+server.ts` | Z554 |
| `tests/server/machine/hpc/submit-world.ts` and `submit-files.test.ts` | Z554 (the calls awaited) |
| `docs/apps.md`, `docs/files-and-search.md`, `docs/source-control.md`, `docs/views.md`, `docs/configuration.md`, `HELP.md`, `DESIGN.md` | Z684 (8); see :526 |

- :526. Moved. "A3 and D44 write them beside this step" is false, since both landed. Corrected text: "`HELP.md`, `DESIGN.md` and the `docs/` pages are in this step's paths (Z684 (8)): the user's guide text goes to the `docs/` page that describes the behaviour, and `HELP.md`'s one-line rows change only where false."
- :526 also cites G31 at `guarded.md:63-64`. Moved: corrected text "G31 at :74-76, G42 at :28-30".

Shared with steps (brief :530-568)
- The whole section is moved. Replace it with section 3 of this report: none in flight; D11, D15, M8, D43 and D33 being prepared; D28, M6, M7 and D41 queued after X3e (`queue.md`).

Decisions (brief :570-614)
- :588, decision 18. Moved by Z684 (2): "All eight sections move".
- :594, decision 24. Moved by Z684 (5): "No new file; `Palette.svelte` is at 520".
- :598, decision 28. Moved by Z684 (6): the reason names `config_key` and `config_value`.
- :602, decision 32. Moved by Z684 (3): every follower.
- :603-611, decisions 34 to 41. Hold.

Libraries (brief :616-625)
- :620. Moved: `svelte-dnd-action` is 0.9.80, modified 2026-10-05, not 0.9.79 of 2026-08-21. See section 4.

Read list (brief :627-656)
- Moved line numbers:
  - Read 1: `Tree.svelte:357-385`.
  - Read 2: `fs-transport.ts:85-140`.
  - Read 4: `bodies.ts:140-155` and :365-380.
  - Read 6: `collection.ts:405-450` and `writes.svelte.ts:335-350`.
  - Read 7: `Outline.svelte:210-230`, `Timeline.svelte:255-310`, and add `sections/clangd/ClangdSection.svelte` whole.
  - Read 9: `model-sessions.ts:500-512`, `payloads.ts:100-150`, `docs.svelte.ts:145-260`, `commands.svelte.ts:318-335`, `context.ts:320-345` and :415-440. Add `state/sessions/latex/latex.svelte.ts:195-255`, `latex/builds.ts:535-595`, `present.svelte.ts:175-190`, `state/sources/files.svelte.ts:80-92`, `state/system/apps/rules.ts:90-110`.
  - Read 11: `pane-view.ts:465-480` and `strip-tab.ts` whole.
  - Read 12: `source.svelte.ts:340-470`, plus `save/tab-draft.svelte.ts` whole and `Source.svelte:190-215`.
  - Read 14: `repositories.ts:485-495`, :570-580 and :845-875.
  - Read 18: `palette.ts:300-342`.
  - Read 19: `catalogs.ts:235-260` and `options.yml:1185-1200`.
- Read 21. Moved. Corrected text: "`HELP.md:40` (the tree keys row, whose 'so Cmd+A still selects all' D16 makes false), :106, :107 and :128 (the Files, Repositories and Changes rows); `docs/configuration.md:23` (the `sources.yml` row); `DESIGN.md:125` (Watchers), :137 (Git) and :372 (the apps' `files` notice); `docs/apps.md:325-327`; `docs/files-and-search.md:11-35`; `docs/source-control.md:7`".
- Read 27. Moved. Corrected text: "`context.ts:170-230` and :575-625, `server/root/process/parent.ts:90-125`, `src/server.ts:60-75`, `src/desktop/windows/pick.ts` whole".

Tests and conventions (brief :657-690)
- :670. Moved: the token assertion is `git.test.ts:60`, not :61, and the other two hold.
- :673. Holds: `printing` is at :42-45.
- :674. Moved: the fixture's `refresh` is :71.
- :675. Moved by Z684 (1): "the six rows of G42", the sixth being the desktop sheet row.
- :684. Moved. Corrected text: "`repositories.ts` (875) splits as D13 says; `context.ts` (879) is split by concern (section 5, I1); `Palette.svelte` (520) takes no line that passes it".
- :685. Moved: corrected counts as in :108. `shell/keys` holds 8 and `views/sources/files/sections` 9.
- :690. Moved. The delete harness calls `listShown` without await (`X3e-diagnosis-delete.md:955`), so after H1.4 its `own` time measures only the start of the promise. See section 5, I5.

Verify (brief :692-718)
- :699, verify 4. Moved. Add these entries whose Code lines name write-list paths (`sed -n` of `guarded.md`):

| Entry | Path it names | Test files to run |
|---|---|---|
| G41 | `git-write.ts`, `deposit-git.ts`, `git-routes.ts` | `tests/server/core/git-failure.test.ts` |
| G43 | `files.ts` `keptFiles`, `submit.ts` | `tests/server/machine/hpc/submit.test.ts`, `submit-files.test.ts` |
| G44 | `git-index.ts`, `git-routes.ts` | already listed |
| G28 | `source.svelte.ts` | `tests/state/sessions/source.test.ts`, `tests/shell/panes/strip/tab-menu.test.ts` |
| G35 | `pty/routes.ts` | `tests/routes/sessions/compose.test.ts`, `terminal-actions.test.ts`, `terminal-edit.test.ts` |
| G50 | `state/system/apps/` | `tests/state/system/apps/store-cache.test.ts` |
| G2 | the `fs` and `open` routes | `tests/server/files/ops.test.ts`, `tests/routes/files/file.test.ts` |
| G42 | `picker.ts` and its route | `tests/server/files/picker.test.ts`, already listed |

- :704-716, verify 12. Holds as written, except the `$F/red2.mjs` line (see I5).

Report (brief :719-734)
- :733, Doc text. Moved by Z684 (8). Corrected text: "for each paragraph of `docs/*.md`, `HELP.md` and `DESIGN.md` this step makes false, the current line and its replacement: `HELP.md:40`, :106, :107, :128; `docs/files-and-search.md:11`, :17, :31, :35; `docs/source-control.md:7`; `docs/views.md` Files, Repositories and Changes; `docs/configuration.md:23`; `docs/apps.md:327`; `DESIGN.md:125`, :137, :372".

Rulings after the recheck (brief :768-774)
- :773, Z553. Moved. D44 landed without moving the effect; D23b later moved it to `save/tab-draft.svelte.ts` (`git log --diff-filter=A`), so D2 goes there.
- :774, Z554. Holds. It needs the extra callers named at :211.

## 2. What the landings since c0a4af9c changed

`git log --oneline c0a4af9c..HEAD -- tools/oculus/src tools/oculus/tests tools/oculus/config tools/oculus/HELP.md tools/oculus/DESIGN.md tools/oculus/docs` printed d5d7f727b, 0753a5e76 (D45), 639820b91 (D23b) and eede45985 (PR4). Per X3e path, `git log --format=%h c0a4af9c..HEAD -- <path>` gives:

PR4 (eede45985)
- `state/life/present.svelte.ts`, +274/-17. Its `files` follower moved to :181-186 and marks `[KIND]` 'wait' on any files, portfolio or config message.
- `HELP.md` 2, `DESIGN.md` 4, `docs/views.md` +2.
- `Present.svelte:175` now calls `reloadSource`.

D23b (639820b91)
- `Palette.svelte`, 58 lines changed. It is now 520, and the rows moved to `shell/keys/rows/`.
- `palette.ts`, 29 lines changed: `choiceCommands` and `svelte-config`.
- `source.svelte.ts` 22 and `Source.svelte` 47 lines changed; the load effect moved to the new `save/tab-draft.svelte.ts`.
- `ops.svelte.ts` 18 and `fs-transport.ts` 17 lines changed.
- `server/files/fs/ops.ts` +35, the `lsp-edit` operation; the token site moved to :717. `server/files/fs` gained `lsp-edit.ts` (9 items).
- `Timeline.svelte` +1: `timeline_lsp_edited`.
- `app.yml` +37, from `config_*` and `symbol_*` in `app.palette`.
- `glyphs.yml` and `icons.yml` +2 each: `svelte_config`, `hierarchy_swap`.
- `files.yml` +1, `source.yml` +21.
- `tests/routes/replace/replace-fixture.ts` +41.
- `HELP.md` 5, `DESIGN.md` 14, `docs/files-and-search.md` 2, `docs/views.md` 2.
- G31's Code line gained `lsp/choices.ts`. G13 gained `lsp/clangd/cpp-file.ts`.

D45 (0753a5e76)
- `settings.ts` +245, with `latexBuild` and others. `PROBLEM_READERS` is now :734-752.
- `catalogs.ts` +11. `config-checks.ts` +2: `latexEditingFindings` joins FINDERS.
- `context.ts` +6/-2. Hunks: `@@ -331,8 +333,7 @@` "`for (const read of [openSettings, latexFormatting, latexBuild]) read(config);`" and `@@ -370,6 +371,7 @@` "`...latexEditingFindings(engine, config),`". The file is now 879 lines.
- `model-sessions.ts` -166: the terminal types moved to `model-processes.ts`, and `FilesPayload` is at :510.
- `payloads.ts` +11: `@@ -117,6 +117,14 @@ const jumpShape ...` and `jump: jumpShape`.
- `channels.ts` +17: `Hub.send`.
- `content/latex/endpoint.ts`, +374: the token site is :579 and the file is 593 lines.
- `pty/routes.ts` -159: the token site is :404.
- The `(sessions)/latex/+server.ts` route, 8 lines changed.
- `fs-transport.ts` 16 lines changed: `fileBytesUrl` re-exported, `listingAnswer` now :266-284.
- `collection.ts` 7: `fileOrder` :414, `movedOrder` :434.
- `row-menu.ts` 95: `ROW_OPEN_SIDE` :308 and :549.
- `show.ts` 30, `layout.svelte.ts`, `pages.ts`, and `commands.svelte.ts` 4 (comment).
- `Source.svelte` 78.
- `ToolButton.svelte`: gained `turning` and `current`.
- `options.yml` +92: roots at :1190-1198, `local.yml:` :1199.
- `sources.yml` +1/-1: `@@ -107,7 +107,7 @@` latex gains `.rnw, .jnw, .pnw`.
- `glyphs.yml` and `icons.yml` +25 each: `latex_*` and `pdf_*`.
- `app.yml` 2 and `files.yml` 5.
- `tests/data/sources/config/settings.test.ts` +125 and `tests/routes/sessions/latex.test.ts` 6.
- `docs/configuration.md` +1, so the `sources.yml` row is :23. `docs/views.md` +24, `docs/files-and-search.md` 2, `HELP.md` 13, `DESIGN.md` 14.
- The LaTeX `files` follower is now `state/sessions/latex/latex.svelte.ts:205-250` plus `builds.filesMoved` (`builds.ts:586-593`). `latex.auto_build: on_file_change` polls dependencies on each `files` message that concerns a followed main (`builds.ts:540-568`).

`git diff --quiet c0a4af9c HEAD -- <the git, core, files, fs, watch, repositories, changes, views, tests-of-files-and-git paths>` exited 1. The `--stat` showed the only changes there were `core/channels.ts`, `files/fs/history.ts`, `files/fs/lsp-edit.ts`, `files/fs/ops.ts`, `files/fs/replace.ts` and `ui/tabs/tab-frames.svelte.ts`. So recheck 3's numbers for `run.ts`, `state.ts`, `files.ts`, `watch/git.ts`, `picker.ts`, `git-*.ts` and the Repositories and Changes views carry over unchanged.

## 3. Paths this step writes

Queued or prepared steps that write the same path come from their briefs (`D11.md`, `D28.md`, `M6.md`) or, where there is no brief, from their plan lines (M8, D33, M7, D41, D43, D15, D36, D39, D40). "None" means no brief or plan line names the path.

Server

| Path | New? | Also written by |
|---|---|---|
| `server/root/watch/git.ts` | no | D28 (only if its cause is proved there) |
| `server/root/watch/autofetch.ts` | no | none |
| `server/root/context.ts` (879, must split) | no | D11, D28, M6 |
| a split-out module of `context.ts`, in `root/watch` (8) or `root/process` (7) | new | none |
| `server/files/files-channel.ts` | no | none |
| `server/files/fs.ts` | no | M6 |
| `server/files/fs/picker.ts` | no | none |
| `src/routes/api/(files)/folders/pick/+server.ts` | no | none |
| `server/machine/lines.ts` | no | none |
| `server/files/fs/notes.ts` | no | none |
| `server/files/open.ts` | no | none |
| `server/files/source.ts` | no | D28 |
| `server/edit/writes.ts` | no | M6 |
| `edit/writes/config/roots.ts`, `config-write.ts`, `config-checks.ts` | no | none |
| `edit/writes/bodies.ts` | no | M6 |
| `server/git/*` (ten files) | no | none |
| `server/core/git/run.ts` | no | D28 (conditional) |
| `server/core/git/compare.ts`, `files.ts`, `reads.ts`, `state.ts` | no | none |
| `server/core/auth.ts` | no | none |
| `content/latex/endpoint.ts`, `content/memories.ts` | no | D43 likely, not verified (no brief) |
| `machine/runs/commands/routes.ts` | no | none |
| `machine/pty/routes.ts` | no | none |
| `machine/hpc/submit.ts` and `src/routes/api/(machine)/hpc/+server.ts` | no | none |
| the four route files of :443 | no | none |

Data and state

| Path | New? | Also written by |
|---|---|---|
| `data/model/model-sessions.ts` | no | D11 (model index and processes) |
| `data/sources/config/settings.ts`, `catalogs.ts` | no | D43 and M8 likely, not verified (no brief) |
| `data/prose/lsp-servers.ts` (if I3 (a)) | no | D43 and M8 (`servers.ts`, Z682 (8)), not verified |
| `state/client/payloads.ts` | no | D11 |
| `state/sources/fs.svelte.ts` | no | M6 |
| `state/sources/fs-transport.ts` | no | M6 |
| `state/sources/explorer/acts/reorder.ts` | new | none |
| `acts/keys.ts`, `refusal.ts`, `folders.ts` | no | none |
| `explorer/ops.svelte.ts` | no | M7 (ops, plan line) |
| `explorer/view/files-view.ts` | no | M6 |
| `explorer/view/place.ts`, `reveal.ts` | no | none |
| `state/sources/fs-history.ts` | no | none |
| `state/system/docs.svelte.ts` | no | none |
| `state/sessions/terminal/commands.svelte.ts` | no | D11 |
| `state/sessions/latex/latex.svelte.ts`, `builds.ts` | no | D43 likely, not verified |
| `state/sources/files.svelte.ts`, `state/life/present.svelte.ts` | no | none |
| `state/system/apps/rules.ts`, `apps.svelte.ts` | no | none |
| `state/sources/repositories/repositories.ts` | no | D28 |
| `repositories/worktrees.ts` (only past 880) | new | none |
| `change-tree.ts`, `repositories.svelte.ts` | no | none |
| `state/sessions/source.svelte.ts` | no | D28, M6 |
| `state/workbench/palette.ts` | no | none |

Views and UI

| Path | New? | Also written by |
|---|---|---|
| `Files.svelte`, `Sections.svelte`, `Bookmarks.svelte` | no | M6 |
| `Section.svelte`, `Notes.svelte`, `OpenEditors.svelte`, `Outline.svelte`, `Timeline.svelte`, `clangd/ClangdSection.svelte` | no | none |
| `explorer/tree/Tree.svelte` | no | D33 (row problem decorations, plan line) |
| `tree/control/dragging.svelte.ts`, `keyed.ts` | no | M7 and D41 (a Files drag or move, plan lines) |
| `ShowPath.svelte`, `RootedTree.svelte`, `tab-actions.ts` | no | none |
| `ChangeGroups.svelte`, `CommitBox.svelte`, `ChangesTouched.svelte` | no | none |
| `RepoList.svelte`, `Repositories.svelte`, `Repo.svelte`, `Changes.svelte`, `CommitRow.svelte`, `Graph.svelte`, `graph-menu.ts`, `Worktrees.svelte` | no | none |
| `save/tab-draft.svelte.ts` | no | none |
| `Source.svelte` | no | D11, D28, M6 |
| `ui/tree/TreeView.svelte`, `tree-keys.ts`, `TreeSection.svelte` | no | none |
| `ui/tabs/tab-strip.ts` | no | none |
| `TabFace.svelte` | no | D28 (the deleted mark, `ui.tab_deleted`) |
| `shell/panes/strip/strip-tab.ts` | no | none |
| `PaneView.svelte` | no | D28 |
| `pane-view.ts` | no | none |
| `Ticker.svelte` | no | none |
| `Palette.svelte`, `PaletteRow.svelte` | no | none |

Config

| Path | New? | Also written by |
|---|---|---|
| `config/sources.yml` | no | M6 |
| `config/catalogs/options.yml` | no | D11, D28, M8 |
| `glyphs.yml`, `icons.yml` | no | D11 |
| `config/text/server.yml` | no | D11 |
| `app.yml` | no | D11 |
| `ui.yml` | no | D28 |
| `files.yml` | no | M6 |
| `repositories.yml` | no | none |
| `source.yml` | no | D28 |
| `changes.yml` | no | none |

Tests: the test files of brief :496-518 plus `submit-world.ts` and `submit-files.test.ts`.
- `tests/server/files/notes.test.ts` is new.
- M6 also writes `undo.test.ts`.
- `boundaries.test.ts` is M6's, not X3e's.

Docs

| Path | New? | Also written by |
|---|---|---|
| `HELP.md`, `DESIGN.md` | no | D11, D28, M6 |
| `docs/apps.md`, `docs/files-and-search.md`, `docs/source-control.md`, `docs/views.md`, `docs/configuration.md` | no | none named |
| `docs/diagrams/` | no | every step |

D15, D36, D39 and D40 name none of these paths in their plan lines. D15's brief is its plan line alone (7 lines).

The merges that are not simple:
- `context.ts` with D11. Both add to a file at 879 lines, so the step that lands second rebases onto the first one's split.
- `options.yml` and `glyphs.yml` with D11 and M8, if the rows land next to each other.
- `Tree.svelte` with D33.

## 4. Libraries

Data from `npm view <name> version license maintainers time.modified engines peerDependencies --json`, with node v24.21.0. "Already in tree" comes from `npm ls`.

| Package | Version | Licence | Maintainer | Last release | Fits | Already in tree |
|---|---|---|---|---|---|---|
| svelte-dnd-action | 0.9.80 | MIT | isaac_hagoel | 2026-10-05 | peer svelte ^5 | no |
| @thisux/sveltednd | 0.8.0 | MIT | sanjusivalingam | 2026-09-01 | peer svelte ^5 | no |
| sortablejs | 1.15.7 | MIT | rubaxa, owenm | 2026-02-11 | no peer | no |
| @atlaskit/pragmatic-drag-and-drop | 4.0.0 | Apache-2.0 | atlassian | 2026-09-24 | no peer | no |
| @atlaskit/pragmatic-drag-and-drop-hitbox | 3.0.0 | Apache-2.0 | atlassian | 2026-09-24 | no peer | no |
| p-queue | 9.3.3 | MIT | sindresorhus | 2026-07-22 | node >=20 | no |
| p-limit | 7.3.3 | MIT | sindresorhus | 2026-09-18 | node >=20 | 3.1.0, transitive |
| execa | 10.1.0 | MIT | sindresorhus, ehmicky | 2026-10-06 | node >=22 | 2.1.0, transitive |
| fdir | 6.5.0 | MIT | thecodrr | 2025-08-14 | peer picomatch | 6.5.0, transitive |
| chokidar | 5.0.0 | MIT | paulmillr | 2026-05-21 | node >=20.19 | 4.0.3, transitive |

What each would replace:
- **Drag (A1-A7).** svelte-dnd-action, sveltednd and sortablejs own the list's order or the DOM nodes, which the virtualized, keyed tree cannot share. The brief's reasons hold, and the library audit (`agents/reviews/library-audit-C.md:85-92`) recommends keeping the hand-built drag.
  - pragmatic-drag-and-drop with its hitbox package would cover the before and after rule (`closestEdge`), but only by replacing the tree's whole drag.
  - Hand-written: `dropPlace` and `reorderedKeys`.
- **The per-root queue (H1.5).** p-queue and p-limit bound concurrency, but neither merges the later asks into one waiting read. That merging is what H1.5 needs, so the queue stays hand-written (about 20 lines).
- **The async runner (H1.1).** execa would replace `execFile` in `run`. `library-audit-F.md:104-112` recommends keeping `node:child_process`, since the git gate mocks `execFile`. Hand-written: `run` on `execFile`, as `git-write.ts:148` already is.
- **The depth scan (E2).** fdir's `withMaxDepth` and `exclude` would cover the walk. It is in the tree at 6.5.0 as a transitive package, with one maintainer, last released 2025-08-14. The hand walk at depth 3 or less is about 20 lines. Adding fdir as a direct dependency is Axel's call ("Libraries: the orchestrator checks, Axel decides", `orchestrator-state.md:62`).
- **Watching (C1).** chokidar would replace the `fs.watch` handles. `library-audit-F.md`, section 4, recommends keeping them, because the stale-event filter and the throttle stay either way.

No change to the brief's conclusion that nothing is adopted, apart from fdir, which is open for Axel (section 5, U3).

## 5. Choices

User-visible

U1. The `head` glyph's lucide icon (D9, Z439). lucide `target` is already the `focus` glyph's icon (`icons.yml:87`), and ASCII `@` is `circle_filled` (`glyphs.yml:144`).
- (a) Keep Z439 as ruled. Pro: VS Code's graph marks HEAD with its `target` codicon. Con: two meanings share one icon in the lucide set.
- (b) A distinct lucide icon (`git-commit-horizontal`). Pro: no collision. Con: differs from VS Code.
- Recommend (a). Z439 is a ruling, the collision is in different views, and the VS Code match is the stated standard. Neither option is lazier than the other.

U2. What an empty `folders: []` in a `files` notice means. It is part of the apps' wire format (Z684 (4)), and nothing names it.
- (a) It concerns nothing. The watcher never publishes it, and `docs/apps.md` says `folders`, when present, is never empty.
- (b) It reads as the whole root.
- Recommend (a), because it reads literally and the publisher never sends it. (b) hides a publisher's defect.

U3. fdir for E2's walk.
- (a) Hand-written walk. Pro: no direct dependency for about 20 lines. Con: the code is kept up by hand.
- (b) fdir 6.5.0 as a direct dependency. Pro: less code. Con: one maintainer, last released 2025-08-14.
- Recommend (a). The lazy option here is neither: both build the walk.

Internal

I1. The split of `context.ts` (879 lines; `server/root` is full at 10). Recommend moving the git watcher's start and its config wiring (`startGit` :424-429 with the autofetch wiring) into a module under `root/watch/` (8 items), the module that owns the watcher. A new `root/context/` folder would change every importer of `$lib/server/root/context`.

I2. The desktop sheet's cancel. Recommend racing `state.ask()` against the controller's abort inside `handlePick`, with `parent.ts` unchanged. The host already answers `cancelled` when its page goes (`pick.ts:4-5`), so the waiting entry in `parent.ts:98` is cleared. The sixth G42 row tests this with a fake `ask`.

I3. The palette hints of the choice commands. Recommend moving them to `app.palette.cmd_<name>_hint` and dropping the `hint` member of `LSP_CHOICES` (`lsp-servers.ts:186-197`), whose only reader is `choiceCommands` (`palette.ts:310`; `grep -rn "\.hint" src/lib`). Keeping literal UI text in `data/prose` is the lazy option.

I4. The LaTeX build follower's folder test. A followed main is concerned when a named folder holds the main or any file in its dependency list (`entry.times`, `builds.ts:555`), since `\input` and `.bib` files may sit in other folders. The held folder states are concerned when their own folder is named.

I5. The delete harness. The orchestrator writes `$F/red2.mjs` with `await listShown(...)` at the record's line 955. `await` of a plain value runs the same on the base, so `own` keeps its meaning on both trees. The rest stays as quoted.

I6. The section order with `ast` and `memory` hidden. Recommend that `filesViewOf` keeps their ids in `sections`, and that the drop arithmetic counts only the drawn heads.

## 6. Cases

Must pass:

128. A saved order `[editors, files, outline, timeline, bookmarks, notes]` (no `ast`, `memory`) draws the default with `ast` and `memory` after `outline`.

129. Drag the Memory Usage head (shown after Show memory usage) above Outline. The order is saved with `memory` first among the three. A tab with no C file draws neither clangd section, and the others keep their order.

130. Alt+Down on a focused AST head moves it one place (onkey on `ClangdSection`'s TreeView).

131. With `latex.auto_build: on_file_change` and a main whose `.bib` lies in a sibling folder, a save of the `.bib` from outside oculus gives one `{ root, folders: ['refs'] }` message, and the build runs once.

132. `npm install` under a root with a LaTeX main followed: the `IGNORED` folder messages start no dependency poll, Present's and the project file list's queries are not marked, and the open `node_modules` listing relists.

133. An app subscribed to `files` receives `{ root, folders }` for its own root only (`rules.ts:102-105`), and `docs/apps.md` states the shape.

134. Desktop app: Add Folder, then the page reloads while the sheet is open. The request stops waiting, the next press opens a sheet, and the old sheet's answer adds no folder. This is the sixth G42 row, with a fake `ask` that never answers until told.

135. The palette shows `:svelte-config` with a description and no hint, and `:interpreter <path>` and `:compile-database <name>` with descriptions.

136. Cmd+A in the Files tree selects every row and no page text, and `HELP.md:40` no longer says Cmd+A selects all.

137. A head tab of `README.md` re-reads after a commit, through `tab-draft.svelte.ts`'s new dependency. A working tab is untouched.

138. The token refusal of `POST /api/latex` and `POST /api/memories` answers the catalog sentence (two of the 14 handler sites).

139. Submit from a `.slurm` file still lists the kept files after `keptFiles` is async (G43's two test files pass).

Must refuse:

140. A `files` message whose `folders` is `[1]` or `"x"` fails `filesShape`, as a malformed `root` does (C0).

141. A sixth G42 row that would pass without the fix is not accepted. It is judged by reading it, with no breakage run.

Implied inputs and their expected results:
- `folders` holding `''`: the root's top folder is relisted.
- `folders` with 65 names: the publisher sends `{ root }`, and the whole root is marked.
- `{ workspaces: true }` with no root: `WORKSPACES` and the bookmarks are marked, and no listing changes.
- `folders: []`: concerns nothing (U2 (a)).
- `sections` containing `ast` twice: kept once.
- `repository_scan_depth: 3` on the hub: the `.agents/worktrees/*` checkouts are listed (decision 22).

## Declined to judge

- Whether Electron shows a second sheet on a window whose first sheet is still open. No desktop run was made here, and the host code (`pick.ts`) was read only at its head comment. A run of the app on TEST settles it.
- The cost of the messages C1 adds for `IGNORED` folders, which now reach Present, the project file lists and LaTeX followers. Nothing was measured. A timed `npm install` under a root on TEST settles it.
- D43, M8, D33, M7 and D41's regions in the shared files. They have no brief, and their plan lines name only areas. Their own rechecks running now settle it.
- D11's exact regions in `context.ts` and `options.yml`. I read its path list, not its line ranges against this head.
- Whether `platform.req.socket` is set under `vite dev` as under the node server. `app.d.ts:26-27` declares it, and the panel record's harness ran it, but I did not run it at this head.
