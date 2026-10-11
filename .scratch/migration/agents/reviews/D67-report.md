# D67 report: a bookmark of a root's top

Everything in the brief is done. The [look] cases 6, 7, 10 and 11 are not performed by the builder (the rules file forbids running a page); each is named with its look in the section "Every visible change". The builder wrote three comment or re-export lines in files outside the write list (`server/files/fs.ts`, `state/sources/fs-transport.ts`, `state/workbench/navigation/rail.ts`); each is named under "Files".

## False premise

None found. Every premise of "What is on the tree" was read in the worktree before the change and held (`bookmark()` spreading `held.data`, `refShape` and `namedRefShape` at `bookmark-rows.ts:12,15`, line 104 of `bookmarkKind`, `renderEntry` skipping `''`, `FileRow.svelte:123`, `row-menu.ts:256` and the root branch of `rowMenu`, `markLabel` answering `''` for a taken root key). The first run below reproduces the ones that predict a result.

## Open items of the state file (verbatim, `orchestrator-state.md` "Open items")

`None.`

## The cases' first run (unchanged tree, before any edit)

The page-side cases ran as a vitest file kept in the session scratchpad (config `vitest.d67.config.mjs`, probes `rows.probe.ts`, `server.probe.ts`, `views.probe.ts`), outside the worktree, run with `npx vitest run --config <scratchpad>/vitest.d67.config.mjs --root <worktree>/tools/oculus <probe>`. The server-side cases call `readBookmarks`, `bookmarkKind`, `createEntry`, `removeEntry`, `writeEntry` and `reorderCollection` over a scratch hub under the scratchpad (every scratch path asserted inside it before a write). `bookmark(row)` is the real `bookmarkActions(...).bookmark` over a fake client whose `addBookmark`, `removeBookmark` and `renameBookmark` call those server writers. No case's rule was wrong; every result below is the one the brief predicts for the unchanged tree.

1. `bookmarkRows([{ title: 'state', fields: { label: 'state', root: 'st', path: '' }, kind: 'folder' }])` printed `[]` (the brief's wanted row is absent). `{ root: '', path: '' }` printed `[]`, an entry with no `root` printed `[]`, `root: 'st'` with no `path` field printed `[]`.
2. `markedKeys([{ fields: { root: 'st', path: '' } }])` printed `["st:"]`. `bookmarkRef({ root: 'st', path: '' })` printed `{"root":"st","path":""}`. `bookmarkRef({ path: 'x' })` printed `null`. `bookmarkAt(entries, 'st', '')` over an entry holding `path: ''` printed that entry; over an entry with no `path` field printed `null`. `markedKeys` of an entry with no `path` field printed `[]`.
3. `readBookmarks` of a scratch file with `- label: state / root: st` and no `path` line printed fields `{"label":"state","root":"st"}` (no `path`); with `path: ""` written by hand `{"label":"state","root":"st","path":""}`. `bookmarkKind` for `st` served over an existing folder printed `"missing"`; `st` not served `"missing"`; `st` over a folder that is gone `"missing"`; `{ root: 'st', path: 'a.txt' }` over an existing file `"file"`.
4. `bookmark({ root: 'st', path: '', name: 'st' })` first press: the file gained `- label: st` with `root: st` and no `path` line. Second press: the entries read back were `[{"label":"st","root":"st"}]`, `bookmarkAt` found nothing, and the write was refused with the note `The bookmark was not written: a new entry needs a label`; the entry was still in the file. Rename `st` to `state` and the move of `state` above `other` both answered `{"refused":[],"found":true}` and the file kept no `path` line for `state`.
5. `markLabel({ root: 'st', path: '', name: 'st' }, [])` printed `"st"`; with `['st']` printed `""`. The press with `st` already a label said `The bookmark was not written: a new entry needs a label`.
6. [look], not run (landing).
7. [look], not run (landing).
8. Run on the unchanged tree: `bookmarkKind` for `st`/`a.txt` printed `"file"` and for a folder below a served root `"folder"`; G49's test (which calls `bookmarkRows` at line 148 and `openBookmark` at lines 129-131 on file, page and folder entries) passed. The rail menu choices and `openBookmark` calls for a file and a folder entry were first run after the change (below), not on the unchanged tree.
9. `npx vitest run tests/views/shared/explorer/opening-apps.test.ts --reporter=dot`: `Test Files  1 passed (1)`, `Tests  10 passed (10)`.
10. [look], not run (landing).
11. [look], not run (landing).

## The cases after the change

Same probes, same commands, after the last edit (the outputs equal the earlier after-run byte for byte, compared with `cmp`).

1. `bookmarkRows` over the root-top entry printed `[{"label":"state","root":"st","path":"","view":"files","kind":"folder"}]`; `{ root: '', path: '' }` `[]`; no `root` `[]`.
2. `markedKeys` `["st:"]`; `bookmarkRef({ root: 'st', path: '' })` `{"root":"st","path":""}`; `bookmarkRef({ path: 'x' })` `null`; `bookmarkAt(entries, 'st', '')` over the entry the server reads: the entry.
3. `readBookmarks` with no `path` line printed fields `{"path":"","label":"state","root":"st"}` and kind `folder`; with `path: ""` the same. `bookmarkKind`: `st` served over a folder `"folder"`, `st` not served `"missing"`, `st` over a folder that is gone `"missing"`, `st`/`a.txt` `"file"`.
4. First press wrote `- label: st` / `root: st` with no `path` line (file text quoted by the probe). Second press: `bookmarkAt` found the entry, `removeEntry` ran, the entries read back `[]`, the answers `[{"note":""},{"note":""}]`. Rename to `state` and the move above `other`: `state` has `label` and `root` only.
5. `markLabel({ root: 'st', path: '', name: 'st' }, [])` `"st"`; with `['st']` `"st"`. The press with `st` already a label said `The bookmark was not written: an entry with that label is already in the file`, and the file was left as it was.
8. `bookmarkRows` over a file, a folder, a root top and a root that is not served: `[{"label":"a file","root":"st","path":"a.txt","view":"file"},{"label":"a folder","root":"st","path":"sub","view":"files","kind":"folder"},{"label":"state","root":"st","path":"","view":"files","kind":"folder"},{"label":"gone","root":"xx","path":"","view":"files","kind":"missing"}]`. Rail choices `[id, label, title, glyph, disabled]`: `["mark:0","a file","st/a.txt",null,null]`, `["mark:1","a folder","st/sub","folder",null]`, `["mark:2","state","st","folder",null]`, `["mark:3","gone","The path is not on this machine any more",null,true]`. `bookmarkPicked` of `mark:2` returns the row, of `mark:3` returns `null`. `openBookmark` calls: file `openView('file', {root:'st', path:'a.txt', label:'a file'})`, folder `showInFiles('sub','st',true)`, root top `showInFiles('','st',true)`, root not served `showInFiles('','xx',true)`.
6 (menu part, run). `rowMenu(rowFacts(root row, ...))` for `{ root: 'st', path: '', name: 'st', depth: 0 }` lists `... Copy Path, Copy Relative Path, Add Bookmark, Remove Folder from Workspace` with `bookmarked` false and `... Remove Bookmark, Remove Folder from Workspace` with it true; the `..` row's menu has neither.
9. `npx vitest run tests/views/shared/explorer/opening-apps.test.ts --reporter=dot`: `Tests  10 passed (10)`; the test file is untouched (`diff -rq` of the base copy's `tests` and the worktree's `tests` prints nothing).

## DONE / NOT DONE

| Item | Case | Output |
| --- | --- | --- |
| 1. A bookmark of a root's top: server reader gives `path: ''`, `bookmarkKind` answers `folder`/`missing`, `bookmarkRows` keeps the entry, `markedKeys` and `bookmarkAt` find it, writer unchanged | 1, 2, 3, 4 | DONE. Quoted above. `fs-transport.ts` has no code change (its `bookmarkAt` comment is reworded). |
| 2. The star on a root's row and Add/Remove Bookmark in the root's menu; label is the root key, a taken root key is refused and said | 4, 5, 6 (menu part run, drawn star is [look]) | DONE for the code. The star is drawn when `row.up !== true` (`FileRow.svelte:123`); `bookmarked` is no longer null for a root (`row-menu.ts:253`); the root branch holds the `bookmark` group (`row-menu.ts:428`). The drawn star and a press are the landing look (cases 6 and 10). |
| 3. Drawn and opened as the root's folder: the root alone without `/` in the Bookmarks section and the rail hover; folder glyph; a press shows the root's row | 8, 6, 7 | DONE for the code (`bookmarkPlace`, `bookmark-rows.ts:102`, used at `Bookmarks.svelte:94` and `rail.ts:34`; `openBookmark` at `opening.ts:102`). The drawn rows, the press and the collapsed-root and sub-folder states are the landing look (cases 6, 7, 10, 11). |
| 4. The words | grep below | DONE: HELP.md line 292, the SCAFFOLD comment, `Files.svelte` head comment, `ui.yml:9`, `views/sources/files.yml:22`, and the other sentences listed under "Words". |

Checks of "Verify before you report", run from `tools/oculus` in the worktree after the last change (`npm run diagrams` immediately before the list):

1. `npm run test:quick`: `ok      ASCII gate (0.4 s)`, `ok      prettier (0.4 s): All matched files use Prettier code style!`, `ok      svelte-kit sync (1.6 s)`, `ok      eslint (6.1 s)`, `ok      svelte-check (17.3 s): 1791721474341 COMPLETED 464 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok      vitest (30.7 s): Duration  26.41s ...`, last line `test:quick: 31.2 s (limit 45.0 s); every command passed`. Not covered: tests outside the selection, `tests/checks`, slow tests, build, lint of unchanged files (the line `test:quick: not covered` says so).
2. `wc -l` of every changed file is in the table under "Files"; the largest source file is `fs.ts` at 714 (limit 880), the largest component `Bookmarks.svelte` at 183 (limit 520). `sh utils/folder-check.sh`: printed nothing, exit status 0.
3. `npx vitest run tests/views/shared/explorer/opening-apps.test.ts --reporter=dot`: `Test Files  1 passed (1)`, `Tests  10 passed (10)`.
4. `sh utils/unused-exports.sh` compared with `.agents/worktrees/D67-base/tools/oculus/unused-exports.txt` by `diff`: identical (361 lines in the base). The step added one export, `bookmarkPlace` (`bookmark-rows.ts:102`); it has importers outside its file (`Bookmarks.svelte:45`, `navigation/rail.ts:31`, which `rail.ts:9` imports), so it is not in the list.

ASCII: `LC_ALL=C grep -n '[^ -~]'` over every changed source, config and HELP.md file printed nothing; the ASCII gate inside `test:quick` is `ok`.

No test was added or changed (the brief says none is called for); the rules file's "failing line on the unchanged tree" line therefore has nothing to quote. `diff -rq` of the base copy's `tests` and the worktree's `tests` prints nothing.

## Files

`diff -rq` of the base copy (`assets config src tests utils`) against the worktree; line counts base to now. Paths outside the brief's write list are marked.

| Path | Lines |
| --- | --- |
| `config/text/ui.yml` | 139 to 139 |
| `config/text/views/sources/files.yml` | 291 to 291 |
| `src/lib/server/files/fs/bookmarks.ts` | 133 to 139 |
| `src/lib/server/files/fs.ts` (outside the list: head comment said a bookmark is a file under a root) | 713 to 714 |
| `src/lib/shell/rail/rail.ts` | 153 to 154 |
| `src/lib/state/sources/explorer/view/bookmark-rows.ts` | 101 to 114 |
| `src/lib/state/sources/fs-transport.ts` (outside the list: doc comment of `bookmarkAt` said "one file"; no code change) | 467 to 470 |
| `src/lib/state/workbench/navigation/rail.ts` (outside the list: one re-export of `bookmarkPlace`, because `shell/` may import `state/workbench/navigation/**` but not `state/sources/fs` per `tests/checks/tree/boundaries.test.ts`, `shell:` row) | 131 to 134 |
| `src/lib/views/shared/explorer/control/bookmark-actions.ts` | 59 to 60 |
| `src/lib/views/shared/explorer/opening.ts` | 110 to 115 |
| `src/lib/views/shared/explorer/tree/FileRow.svelte` | 213 to 213 |
| `src/lib/views/shared/explorer/tree/menu/row-menu.ts` | 632 to 631 |
| `src/lib/views/sources/files/Files.svelte` | 366 to 366 |
| `src/lib/views/sources/files/sections/Bookmarks.svelte` | 177 to 183 |
| `tools/oculus/HELP.md` (not in the base copy) | 466 now |
| `tools/oculus/docs/diagrams/*` | regenerated by `npm run diagrams`; the base copy holds no `docs`, so the builder has no diff of them; the orchestrator's diff shows what changed |
| `tools/oculus/.scratch/migration/agents/reviews/D67-report.md` | this file |

`DESIGN.md`: no sentence it holds is made false (its bookmark sentences at lines 126, 396 and 424 are about watchers, apps and apps folders); not edited. `tests/` and `utils/`: unchanged.

## Words (item 4) and the check of every name the diff changes

Names changed or added: `markLabel`, `namedRefShape`, `bookmarkRows`, `bookmarkKind`, `bookmark()` (server), `openBookmark`, `bookmarkChoices`, `rowFacts` field `bookmarked`, `bookmarkPlace`. Grep run after the last change: `grep -rn "markLabel\|namedRefShape\|bookmarkKind\|bookmarkPlace\|openBookmark\|bookmarkChoices\|bookmarkPicked" src tests config docs HELP.md DESIGN.md README.md` and `grep -rn -i "star on\|the star\b" src config docs HELP.md DESIGN.md README.md tests`. Every hit was read. Sentences that said a bookmark is a file or a folder or that the star is on a file, and what was done:

- `HELP.md:292`: rewritten (star on "a file, folder or root row", the root's label rule, the root's menu, a root bookmark is an entry with a `root` and no `path` line, drawn with the folder glyph and the root alone, opens the root's own row).
- `bookmarks.ts` SCAFFOLD comment: "Each entry is a file, a folder or the top of one of the roots the file browser serves."; its doc comment (path absent for a root's top).
- `Files.svelte` head comment, `ui.yml:9`, `views/sources/files.yml:22`: "a file, a folder or a root".
- `Bookmarks.svelte` head comment and the `whereShape` comment; `bookmark-rows.ts` head and every doc comment; `bookmark-actions.ts` head and the `bookmark` doc; `rail.ts` `bookmarkChoices` doc; `opening.ts` `openBookmark` doc and the `showInFiles` field doc; `row-menu.ts` head comment, the `bookmarked` field doc and the `rowMenu` doc (the folder paragraph now also names Add and Remove Bookmark, which it left out); `fs.ts` head comment; `fs-transport.ts` `bookmarkAt` doc.
- Judged still true and not edited: `RailFoot.svelte` head comment ("a folder is shown open in the Files view", a root's top is a folder), `HELP.md:28`, `docs/apps.md` (bookmark lines are about notices and closed writes), `fs.svelte.ts:122`, `fs-transport.ts:55` (`BookmarkEntry` doc: "what its path is under its root" holds for the empty path), `catalogs/options.yml:1407,1441`, `bookmark_missing_title` ("The path is not on this machine any more", used for a missing root too), `bookmark_open_title` ("Open {0}" takes the place text). The hub's `.oculus/bookmarks.yml:2` ("Each entry is a file under one of the roots") is outside the worktree's paths; the orchestrator rewords it at landing.

Comment history check: `diff` of the base copy against each changed file, added lines grepped for `before|used to|no longer|still|always|as before|previously|the step adds|after this|earlier|again`. Hits judged: `bookmark-actions.ts` "take the bookmark on it away again" (a pre-existing phrase of the same sentence, an action word and not a comparison with an earlier state). The hits "still one a bookmark may name" (`bookmarks.ts`) and "is still served" (`opening.ts`) were reworded away.

## Judgment calls (each reversible)

1. A shared helper `bookmarkPlace(root, path)` (`bookmark-rows.ts:102`) says `root` for an empty path and `root/path` otherwise; the Bookmarks section and the rail hover use it. The rail is in `shell/`, which may not import `state/sources/fs`, so the helper is re-exported from `state/workbench/navigation/rail.ts:31` beside the existing `Bookmark` type re-export. The alternative is a second copy of the one-line rule in `rail.ts`. Grep before writing: `grep -rn 'root}/\${' src` lists the `${root}/${path}` text in the lsp edit words, the replace and source-tab names, `files-named.ts:50` (a folder name for another purpose) and the two bookmark places (`Bookmarks.svelte:88`, `rail.ts:33`); none of the others describes a bookmark's place, so no existing helper was reused.
2. `openBookmark` (`opening.ts:102`) shows a root's top in the Files view for kind `missing` as well as `folder`. The alternative is the file view with an empty path. For a root that is not served the Files view says so on its message line (`reveal_no_root`), which the Bookmarks section's press reaches (the rail menu disables a missing row).
3. `bookmarkRows` gives view `files` to any entry with an empty path, whatever its kind (`bookmark-rows.ts:79`), so a root's top is never sent to the file view or the apps-folder test with an empty path.
4. The server reader defaults only a missing `path` key: `fields: { path: '', ...held.data }` (`bookmarks.ts:99`). A `path:` with no value (YAML null) or any non-text value stays as written and names nothing, as for any entry whose root or path is not a text.
5. `refShape` is unchanged: an entry with `root: ""` and a text path still yields a key and a ref; `namedRefShape` still requires a filled root, so such an entry has no rail row.
6. The head (depth 0) row of a tab rooted at a folder, of a followed session and of a project card's tree has kind `root` in `rowFacts` (`row-menu.ts:236`), so it now also gets Add/Remove Bookmark in its menu, for the folder it shows (label is the folder's name, as for any folder row). Its star was already drawn (its path is not empty).

## Every visible change (for the look at landing)

Put the Files view on the TEST page of a scratch oculus, default workspace, with the hub, the configuration root and one more served root.

- A root's row (the hub, `config`), hover: before, no star; after, the star (`FileRow.svelte:123`). Press it: the root's row shows the star filled, the Bookmarks section gains a row labelled with the root key, the folder glyph, the detail text the root key alone with no trailing `/`; a second press removes both. [look] case 6 and case 10.
- A root's row menu (right click): before, no bookmark item; after, Add Bookmark (Remove Bookmark when bookmarked) after Copy Relative Path and before Add/Remove Folder from Workspace (case 6, case 10). The head row of a tab rooted at a folder and of a project card's tree gains the same item.
- The rail's Bookmarks menu: a root bookmark row has the folder glyph and the hover text the root key alone (case 6). A press in the rail menu or in the Bookmarks section shows the root's row in the Files view, selected and open, with the root collapsed, with the Files view's other folders expanded and with a sub-folder selected (case 6). The ask goes to the page's unpinned Files tab (`findView(tree, 'files', null)`, `show.ts:49`); a Files tab rooted at a folder is a separate instance named by its root and path (`instance.ts:183-192`, `stateId`) and is not the one asked. Whether the brief's "the Files view shows a sub-folder" meant this tab with a sub-folder selected, or a rooted tab, is what the look decides; not verified.
- A bookmark whose root is not served (case 7, and case 11 after a switch to a workspace without `oculus-state`): the Bookmarks section row is muted and struck through (`Bookmarks.svelte`, `kind === 'missing'`), the rail row is dimmed and disabled with the hover "The path is not on this machine any more"; a press in the Bookmarks section leaves the Files view with the message line saying the root is not in the workspace.
- Empty state words: the rail menu's empty hover now reads "The star on a file, a folder or a root in the Files view adds one." and the Bookmarks section's empty row "No bookmark yet. The star on a file, a folder or a root adds one." (before: "... on a file ...").
- Case 11 at landing: the entry `label: ~/.oculus`, `root: oculus-state`, no `path` line; expected: the Bookmarks section draws `~/.oculus` with the folder glyph and the detail `oculus-state`; a press shows that root's row.

## Limitations and sharp edges

- The drawn star, the menu item, the Bookmarks and rail rows, the presses and the struck-through row are checked here by the unit-level runs above and by reading; they are not seen on a page (spec rule: a builder runs no page). Cases 6, 7, 10 and 11 are the proof.
- History undo of adding or removing a root's bookmark was read, not run: `undo.ts:508-518` removes a new entry by its identity and recreates a deleted one with `createEntry(... mapBeforeShape.parse(change.before) ...)`, where `before` is the entry as the file holds it (no `path` key). Not verified by a run.
- At landing, whether `oculus-state` is among the roots the bookmarks route stats (`fs.ts:479`: `into.fixed` plus the added roots of the saved workspace) depends on where the orchestrator adds the root; if it were absent the entry would read `missing`. Not verified; case 11 settles it.
- Overlap with D63: the diff touches `views/shared/explorer/` (`FileRow.svelte`, `row-menu.ts`, `bookmark-actions.ts`, `opening.ts`), `shell/rail/rail.ts` and `config/text/`, which D63's brief also lists; no merge was tried.
- `config/text/` unused-key and orphan checks are in `tests/checks`, not in `test:quick`; no catalog key was added or removed, only two values changed.

## Anything in the brief that was wrong or impossible

Nothing. The brief's item 2 needed the `bookmark` group added to the root branch of `rowMenu` as well as the fact at `row-menu.ts:253`, which the brief states; the brief's write list lacked `state/workbench/navigation/rail.ts`, `server/files/fs.ts` and `state/sources/fs-transport.ts`, each used only as stated under "Files".
