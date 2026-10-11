# Step D67 brief check (on main at 0a5312e49)

Main has moved since the brief was read: `git log --oneline -4` prints `0a5312e49 Launch D63`, `e38d174ef Prepare D63`, `d0d203742 ...`. `git diff --stat d0d203742 HEAD` lists only six files under `tools/oculus/.scratch/migration/`, so the source the brief describes is the same.

## 1. Names

1. **`bookmarkAt` in `src/lib/state/sources/fs-transport.ts:171-173` is not on the write list, and the design breaks it.** The code is `entries.find((one) => one.fields.root === root && one.fields.path === path)`. The server builds `fields` as `{ ...held.data }` (`server/files/fs/bookmarks.ts:94`). Under Z816 a root's top is stored with no `path` line, so `fields.path` is `undefined` and `bookmarkAt(entries, 'st', '')` answers null. `bookmark(row)` (`bookmark-actions.ts:36`) then sends a second add instead of a remove. `createEntry` refuses that add, because the label is taken (`server/edit/writes/entries.ts:433-441`). The star stays drawn, since `markedKeys` does mark it, but it cannot be turned off; the same goes for the menu's Remove Bookmark, which goes through `deps.bookmark(row)` (`row-menu.ts:607`). Case 4's "a second press removes it" cannot pass on the brief's mechanism. Two fixes are possible: change `bookmarkAt`, which needs `fs-transport.ts` on the write list, or have the server reader `bookmark()` in `bookmarks.ts` give a missing `path` as `''`, which is on the list. The brief names neither. Other callers of `bookmarkAt`: `state/workbench/navigation/pages.ts:610,634` and `views/shared/links/BookmarkStar.svelte:37`. Both serve file tabs, never a root's top, so the change does not make them false.
2. **The root row's menu has no bookmark group at all.** `rowFacts` gives a depth-0 row the kind `'root'` (`row-menu.ts:239`). `rowMenu` adds the `bookmark` group only in the `facts.kind === 'file'` branch (lines 348-379) and the `'dir'` branch (lines 405-418). The root branch (lines 420-436) leaves it out. Changing the `bookmarked` fact at line 256 alone therefore does not make Add Bookmark appear. The premise names only line 256. The file is in the write list; the premise is incomplete (see check 3).
3. **`rail.ts:33` in `src/lib/shell/rail/` draws the hover title `${mark.root}/${mark.path}`.** For a root's top that reads `st/`, which is the trailing `/` that item 3 removes from the Bookmarks section. The write list allows `shell/rail/` "only if the rail draws the root's top other than as a folder", and that condition does not plainly cover this title.
4. **`refShape` / `namedRefShape` hits outside the step.** `state/life/present.ts:70` and `state/sources/explorer/view/files-view.ts:133` each declare their own local `refShape`. The change does not reach them.
5. **`bookmarkRows` / `openBookmark` in `tests/views/shared/explorer/opening-apps.test.ts:11-13,129-131,148`.** This is G49's test ('opens a file of an apps folder as source text, whichever opener asks', `agents/guarded.md:36`). The table has a 'Folder' row of kind `folder`, and a root's top takes that same branch. The change does not make it false, but the step must run this test (check 4).
6. **`markedKeys` (`views/shared/explorer/rooted-tree.svelte.ts:165`) and `bookmarkRows` (`routes/+page.svelte:254`).** These are the callers, and they work once the shapes change. `Tree.svelte:199,376` marks by `rowKey(row)`, which is `'st:'` for a root's row (`place.ts:113-115,147-149`). Not made false.
7. **`showInFiles` with an empty path.** It is already called that way by `state/sources/repositories/worktrees.ts:59` (`opening.showInFiles('', key)`). `resolveReveal` returns `found` at once for an empty path, because the loop over `parts` is empty (`state/sources/explorer/view/reveal.ts:70-88`). `RailFoot.svelte:55` calls `showInFiles(mark.path, mark.root, true)`. Not made false.
8. **Follow and move code.** `followBookmarks` (`state/sources/explorer/ops.svelte.ts:409-427`) skips an entry whose `path` is not a string, so a root's-top entry stored with no path line is skipped. `followed` (`state/sources/explorer/follow.ts:23`) also returns null for an empty `from.path`. Not made false, whichever fix item 1 takes.
9. **Sentences made false outside the write list.**
   - The hub's tracked `.oculus/bookmarks.yml:2` reads "# Each entry is a file under one of the roots the file browser serves." (`git ls-files .oculus/bookmarks.yml` lists it.) This is hub data. The builder may not write it; the orchestrator can fix it at landing when it adds the bookmark.
   - `views/sources/files/Files.svelte:42` ("bookmark is added by the star on a file"), `config/text/ui.yml:9` and `config/text/views/sources/files.yml:22` ("The star on a file adds one."). These were already incomplete for folders. The star on a root's row widens the gap.
   - `config/text/` is on the list. `Files.svelte` is not.
10. **Comments on the write list that become false.**
    - `bookmark-rows.ts:1-4, 39-41, 58-63, 94-98`
    - `bookmark-actions.ts:1-3, 29-33` ("its path under the root when another bookmark already carries that name")
    - `row-menu.ts:8, 126-129`
    - `Bookmarks.svelte:22`
    - `bookmarks.ts:50` (SCAFFOLD) and its doc at lines 97-100
    - `HELP.md:292`, including "(its path below the root when the name is already a label)"
    - `HELP.md:28` still holds.

## 2. The step line

`plan.md:770`, part by part:

1. "a bookmark may name a root's top (an empty path)": item 1.
2. "drawn in the Files view's Bookmarks and the rail's Bookmarks menu as the root's folder": item 3.
3. "opened as that folder in the Files view": item 3.
4. "starred from the root's row": item 2.
5. "at landing, after D63 has landed, the orchestrator adds the root `oculus-state` over `~/.oculus` to Axel's workspace beside `claude`": the orchestrator's work, stated in the brief's opening paragraph. No item, which is right. There is also no landing case or look for it (check 5).
   - Where it goes is not settled. `claude` sits in the hub's `.oculus/workspaces.json` default workspace (`python3 -I` read: `{'current': '', 'workspaces': [('', ['claude'])]}`). `HELP.md:285` says an added folder in the default workspace is written to `.oculus/config/sources.yml` `roots:`.
6. "and the bookmark `~/.oculus` (root `oculus-state`, the root's top) to the hub's `.oculus/bookmarks.yml`": the orchestrator's work. No item and no landing look, the same as part 5.
7. Rulings "~/.oculus bookmarked", Z806 and Z816: cited in the brief's rulings section.

No part of the step line is without a requirement, apart from the landing look that parts 5 and 6 lack.

## 3. Premises

1. Bookmark entry `{ label, root, path }`, SCAFFOLD at `bookmarks.ts:48-57`: holds. The array runs from line 48 to 58 (`.join('\n')` is on 58). The hub file has the same schema (`.oculus/bookmarks.yml:5-8`).
2. `refShape` and `namedRefShape` at `bookmark-rows.ts:12,15`, their callers, and "101 lines": holds (`cat -n`; `wc -l` prints 101).
3. `bookmarkKind` at `bookmarks.ts:101-112` with line 104: holds. `resolveRootPath` at `files.ts:117`: holds (line 117 is `export function resolveRootPath(`). An empty path resolves to the root's real dir (`resolve(dir, '')`, lines 125-145).
4. `renderEntry` at `render.ts:20-30`, line 30 skipping `''`: holds. The write path does reach it with `path: ''`: `createEntry` (`server/edit/writes/entries.ts:378-457`) does not refuse an empty value, since `typeRefusal` returns `''` for `''` (line 67).
5. Star condition at `FileRow.svelte:123`: holds. `row-menu.ts:256`: holds as quoted but is incomplete. The root's menu leaves out Add and Remove Bookmark because the root branch (`row-menu.ts:420-436`) has no `bookmark` group, whatever line 256 answers (check 1, item 2). `markLabel` at `bookmark-rows.ts:99`, answering the name: holds.
6. `Bookmarks.svelte` is 177 lines: holds. `whereOf` is at lines 86-89, with its doc comment on 85; the brief says 85-88. `openBookmark` at `opening.ts:94-110` and the `showInFiles(ref.path, ref.root, true)` call (line 98): hold.
7. `HELP.md:292` says "A star on a file or folder row": holds. The SCAFFOLD comment at `bookmarks.ts:50`: holds.
8. "`agents/guarded.md` has no entry for bookmarks ... finds only G31": the grep claim holds (`grep -n -i bookmark agents/guarded.md` prints only line 89). The conclusion is incomplete:
   - G49's test file `tests/views/shared/explorer/opening-apps.test.ts` (`guarded.md:36`) calls `bookmarkRows` and `openBookmark`. Both are functions this step changes.
   - spec.md:58 says "A step whose change touches an entry's code runs that entry's test". The brief should name this file.
   - `tests/views/shared/explorer/add-app.test.ts` (also G49) calls `rowFacts` and `rowMenu` on a root row. Adding the bookmark group to the root branch does not change what it asserts (it looks up Add as App by label, lines 52-53).
9. Missing premise: a root row's `name` is the root key. `tree-rows.ts:164` and `filter.ts:83` set `name: top?.name ?? root.key`. This bears on item 2 (check 4, item 3).
10. Missing premise: D63 is in flight with overlapping paths. D63 was launched at 0a5312e49 (`orchestrator-state.md:256`: "Next: close D67's brief check, its preparation and launch beside D63"). D63's write list (`agents/briefs/D63.md`, "Paths this step writes") includes:
    - all of `src/lib/views/shared/explorer/` "and its split": this covers `FileRow.svelte`, `row-menu.ts`, `bookmark-actions.ts` and `opening.ts`
    - all of `src/lib/shell/`
    - `config/text/`
    - `HELP.md`
    - `DESIGN.md`
    - `docs/diagrams/`

    The D67 brief records no `shared_paths:` judgment and does not say D63 may split these files.
11. "No ADR folder exists": holds (check 7).

## 4. Cases and checks

1. **Case 4 cannot pass on the brief's design.** The second press goes through `bookmarkAt` (`fs-transport.ts:171-173`), which never matches an entry stored with no `path` line (check 1, item 1). It sends a second add, which `createEntry` refuses as a taken label. The case also checks places the step does not change: `bookmarkAt`, `createEntry` and `renderEntry`. Running it also means wiring `client.fs.addBookmark` and `removeBookmark` to the server writer by hand, against a scratch file.
2. **Case 5 is consistent with `markLabel`'s code.** On the unchanged tree, `labels.includes('state')` is true, so it answers `row.path`, which is `''`. The brief says the same. After the change the item gives `st`. With `['state','st']` the label `st` is taken, and `createEntry` refuses with "an entry with that label is already in the file" (`entries.ts:433-441`). That matches "as for a file whose name and path are both taken".
3. **Case 5's first input is a row the tree never builds.** Its `name` ('state') differs from its root key ('st'). At a root's top the row's name is the root key (`tree-rows.ts:164`, `filter.ts:83`). In practice, item 2's fallback "the root key when another bookmark already carries that name" answers the same text that was found taken, so it always ends in a refusal. The brief should say that this is the intended result for a root whose key is already a label, or give a fallback that differs.
4. **Decision 1 contradicts item 2 and case 5.** Decision 1 says "the existing rule of `markLabel` applies to it unchanged". Item 2 and case 5 require `markLabel` to answer the root key where today it answers `''`, and that is a change to `markLabel`.
5. **Test rule, spec.md:57-58.** "No test is kept" is consistent only if no guarded entry's test applies. G49's `opening-apps.test.ts` exercises `bookmarkRows` and `openBookmark`, so the step must run it. `npm run test:quick` picks it up because it imports changed files, but the brief should name it. A root's top takes the existing `kind: 'folder'` row of that table, so no new row is needed.
6. **Report rule, spec.md:81.**
   - spec.md:81 requires a premise that does not reproduce to be quoted "in the report's first section, before any work that depends on it". The brief's report shape puts "Anything in the brief that was wrong or impossible" last.
   - The brief's shape leaves out spec.md:81's "every limitation, sharp edge or compromise you know of".
   - spec.md:81 has each DONE row quote "the last line of the final run that proves it". The brief has each row name "the case that shows it and its output". For [look] cases there is no output, and the spec's DOM rule (the row names the look) applies; the brief does not say so.
7. **Cases 7 and 8 check unchanged places.** Case 7 checks `rail.ts` `bookmarkChoices` (lines 30-35); case 8 checks file and folder bookmarks. Both are regression checks, which is consistent with the spec.

## 5. The question

The goal: Axel can bookmark a root's top (`~/.oculus` in practice) and open it from the Bookmarks section and the rail.

1. **Step line.** Yes, it could pass without the goal. Everything the builder does could pass with no root over `~/.oculus`. The goal is reached only by the orchestrator's landing additions, which wait on D63, and D63 is in flight now. No brief text names a look at landing on the real entry: label `~/.oculus`, root `oculus-state`, no path line. That look would check:
   - the Bookmarks row `~/.oculus` with detail `oculus-state`, drawn with the folder glyph
   - the rail item `~/.oculus`
   - a press in either selecting the `oculus-state` row
2. **Item 1.** Yes. The four functions can answer the case values while the tree's star cannot be removed again (`bookmarkAt`, check 1, item 1).
3. **Item 2.** No, as long as case 6's menu look is done: the root branch of `rowMenu` must change. But the toggle half needs case 4, which fails on the design.
4. **Item 3.** It could pass with no change to the rail at all. The rail already draws `kind: 'folder'` with the folder glyph (`rail.ts:34`). The `st/` hover (`rail.ts:33`) is not required to change.
5. **Item 4.** Yes. Words alone do not reach the goal.
6. **Cases 1, 2, 3, 5 and 8.** Yes. These are unit-level calls, and they pass whether the page does anything or not.
7. **Case 4.** No, provided it is run as written. It is the only run that exercises the toggle, and it will expose the `bookmarkAt` defect.
8. **Case 6.** Partly. It is the look closest to the goal, but it uses the synthetic root `st`, not `oculus-state` over `~/.oculus`.
9. **Case 7.** Yes. It concerns a missing root, not the goal.

## 6. Implied inputs

1. **A root whose key holds `/`.** Keys made by `rootKey` cannot hold one (`server/files/fs.ts:324-334` replaces such characters). A key written by hand in sources.yml is only `z.string().min(1)` (`server/edit/writes/config/roots.ts:89`). Expected: the Bookmarks detail shows the key as written. Low cost, not named.
2. **A bookmark of the hub root's top or the engine `config` root's top.** Not named. Expected:
   - kind `folder`
   - the label is the key (`hub` or the config key)
   - a press selects and opens that root's row
   - nothing under `config/local.yml` is read
3. **A root's-top bookmark dragged or reordered in the Bookmarks section.** The reorder works by id (label). Expected: the entry moves and still has no `path` line. Not named.
4. **Rename of a root's-top bookmark.** It goes through `writeEntry('bookmarks', id, { label })` (`fs.svelte.ts:813-816`). Expected: the label changes and no `path` line is added. Not named.
5. **Follow and move code when a root moves.** A root is never a move source, and `followed` returns null for an empty `from.path` (`follow.ts:23`). Expected: the entry is left as is. Not named; low cost.
6. **Two workspaces.** `bookmarkKind` sees only the fixed roots plus the current workspace's roots (`server/files/fs.ts:477-482`). Expected: in a workspace that does not serve the root, the entry is `missing`, struck through, and disabled in the rail. Case 7 covers removal from the workspace but does not name a switch of workspace.
7. **Reveal when the root row is collapsed or scrolled away.** Expected: `showInFiles('', root, true)` selects the root row, opens it and scrolls it into view. Case 6 says only "shows the root's row". Also not named: a Files tab rooted at a sub-folder (`showFolderInFiles`) has no `path: ''` row for the root, and the reveal goes to the page's main Files tab (`layout/open/show.ts:47-61`).
8. **An entry written by hand with `path: ""`.** It parses as `''`, so `bookmarkAt` matches it and its star toggles, while a starred root's top with no `path` line does not (check 1, item 1). Case 1 covers `bookmarkRows` for it. No case covers the toggle on both forms. Expected: both forms read and toggle the same way.
9. **A root whose key is already a bookmark label.** Expected per item 2: the refusal is said (check 4, item 3). Not stated as the intended result.
10. **The orchestrator's hand-written landing entry: label `~/.oculus`, root `oculus-state`, no path.** Expected:
    - read as a root's top of kind folder
    - its star shown on the `oculus-state` row
    - one press of that star removes the entry, which needs the `bookmarkAt` fix

    Not named.

## 7. ADRs

1. From the repository root, `ls tools/oculus/docs/adr` prints "ls: tools/oculus/docs/adr: No such file or directory" (exit 1).
2. `ls docs/adr` prints "ls: docs/adr: No such file or directory" (exit 1).

Neither ADR folder exists, as the brief says.

## 8. Dictated text

1. `grep -n '"' agents/briefs/D67.md` line 21 quotes "a file or folder row" and "Each entry is a file or a folder under one of the roots". Both are premises quoted from the tree (`HELP.md:292`, `bookmarks.ts:50`), not text to write. Holds.
2. Line 29 (`grep -n 'The words' agents/briefs/D67.md`) dictates the content "a star is on a file, a folder or a root's row" and "an entry is a file, a folder or a root's top". Holds: ASCII, no em dash, no negation-contrast, plain. "root's top" is existing HELP.md wording (`HELP.md:59`, "or the root's key for a root's top"). That same line also gives a precedent for showing the root alone, which is item 3's choice.
3. Line 113 dictates the report's first line, "Everything in the brief is done". This is spec.md:81's own text. Holds.
4. Line 33 quotes the ruling name "~/.oculus bookmarked". It is a citation, not text for a file. Holds.

## Declined to judge

1. Whether `~/.oculus` served as a Files root lets the Files view rename, delete or save machine state there. Examples: `approvals.json`, and saves under `~/.oculus/history`, which is itself the local history store (`HELP.md`, `history` key). This belongs to the orchestrator's landing root and to D63 (Z806), not to the builder's step. It is not verified.
2. Whether YAML reads the landing label `~/.oculus` as a string. Not run.
3. Which file holds "Axel's workspace" for the landing root: `.oculus/workspaces.json` default workspace or `sources.yml` `roots:`. Shown in check 2, part 5; left to the orchestrator.
4. Whether the existing draw and focus behaviour of the root row in FileRow fits a star once one is drawn. That needs the page, and is for the look on TEST.

Agent usage: a47181bc2fd7feaf6, claude-opus-5-5, 192,390 tokens, 86 tool uses, 9.0 min.

## Closed

Each finding is closed in `agents/briefs/D67.md` as listed.

1. `bookmarkAt` never matches an entry with no `path` line: "What is on the tree" states it; item 1 has the server's reader `bookmark()` give a missing `path` as `''`; decision 3; cases 2, 3 and 4 check the find, the read and the second press.
2. The root branch of `rowMenu` has no bookmark group: "What is on the tree" names `row-menu.ts:420-436`; item 2 adds the group there; read range 5 covers lines 400-440.
3. The rail hover reads `st/`: "What is on the tree" states it; item 3 gives the root alone; `shell/rail/rail.ts` is a path of its own; case 6 looks at the hover.
4. Sentences made false: `Files.svelte:40-44`, `config/text/ui.yml:9` and `config/text/views/sources/files.yml:22` are named in "What is on the tree" and item 4 and are paths; the hub's `.oculus/bookmarks.yml:2` is reworded by the orchestrator at landing, as the premise says.
5. G49's test exercises `bookmarkRows` and `openBookmark`: the premise names it; case 9 and verify 3 run it before and after, unchanged.
6. Case 5's input and decision 1: case 5 uses the root key as the row name; item 2 and decision 1 say `markLabel` changes to answer the root key and the taken label is refused and said.
7. The report shape: a false premise comes right after the first line; limitations and sharp edges have their own part; each [look] row names its look.
8. The overlap with D63: judged in the dispatch entry's `shared_paths`.
9. Implied inputs: the hub and configuration roots (case 10), rename and reorder (case 4), a workspace switch (case 11), a collapsed root and a sub-folder Files view (cases 6 and 3's item), a hand-written `path: ""` (case 3), a root key already a label (case 5), the landing entry (case 11).
10. The landing look of the real `~/.oculus` entry: case 11.

