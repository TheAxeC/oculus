# D42 report, repair round 1: a file's history as VS Code's Timeline, and the diff's hunk bar whole in a narrow pane

**NOT done / not proven.** All 8 items of `briefs/D42-round1.md` are done and the verify list is green, 2 full-list runs this round, both passed. Nothing was looked at live (no server, no browser), so every drawn result still waits for the orchestrator's look on TEST: cases 1 to 11, 16, 19 to 27, 32 to 36, 40, 41, 49 and 50, and in particular the keyboard focus staying on the Load more row (item 7). Four things are open or outside what this round could end:
1. The rename commit of a served root that is a sub-folder of its repository opens as the file created, not as the rename: `commitDiff` (`server/core/git/reads.ts:116-122`) lists the commit's files with `show --name-status` without `--relative`, so its `renamed` lookup compares top-relative paths with the root-relative path it is given. Every other row of such a root opens its change (run below). `reads.ts` is outside the brief's paths and the lookup is shared with the graph's commit files (`commitFiles` lists top-relative paths and passes them to `commitDiff`), so one flag in `commitDiff` would break those callers; it is a different concern and the same before and after this step.
2. `src/lib/state/sources/repositories/repositories.ts` is outside the brief's paths: `DiffSubject` gains `short` (item 3 needs a carrier for git's `%h`), its zod shape reads it with a `.catch('')`, and the shape's identity `transform` (18 lines copying each field) is replaced by `.transform((held): DiffState => held)` so the file stays at 867 lines, under the 880 line it was at.
3. The case 38 outcome changed with item 1: a `before` that is the oldest row now answers an empty page, `{ ok: true, commits: [], more: false }`, where the first-parent form was refused by git.
4. Whether any served repository other than the hub has merges was not checked (no git run there); the merge fix is proven on a scratch repository only.

No git command ran in the worktree or the repository this round; git ran only in scratch repositories under `$TMPDIR/d42-r1`.

## Open items of the state file (verbatim, `orchestrator-state.md:193-197`)

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

- None.
```

## First run of the 51 cases on the unchanged tree

Read from the base copy (`.agents/worktrees/D42-base/tools/oculus`) and the git outputs the brief quotes under "What is on the tree"; no case was run, no git command was run. No case was found that the brief's own rules get wrong, so the build went ahead.

| Case | Result on the unchanged tree |
| --- | --- |
| 1 | Fails: the commit row's detail is how long ago, no author, no email; the tooltip is `files.timeline_row_title` ("Compare {0} with the file now"). |
| 2 | Fails: `show` hands `inRepo.path` (today's path) to `openDiff`, so the commit that created the file at the old path prints 0 lines and the diff says "Nothing to show for this one." |
| 3 | Fails: the rename commit opens at the new path alone, so the old side is not paired; not the old-to-new change. |
| 4 | Fails: `c8d890799` at `atlas/` is empty (brief: 0 lines, 2158 at `analysis/`); `bd20762ec` opens at the current path, not as the rename alone. |
| 5 | Holds for the row and the binary note (`repositories.diff_binary`); the row has no author. |
| 6 | Holds: the path is passed as on disk under `GIT_LITERAL_PATHSPECS=1`; the header names it. |
| 7 | Fails: `FILE_LOG_ENTRIES = 50`, `-50`, no `more`, no Load more; 115 commits, 65 unreachable. |
| 8 | Fails: no paging, so the ordering of copies against older pages cannot arise; only 50 commits merged with every copy. |
| 9 | Fails: the commits key ends with `fileVersion`, which moves only on `fs.bump`; a commit made in the Repositories view shows only after `invalidate()` or a reload. |
| 10 | Fails: a source save marks `['fs','text',...]` only; the copies key is not marked, so no File Saved row until a reload. |
| 11 | Partly: the empty sentence `files.timeline_empty` holds; the File Saved row after the save fails as case 10. |
| 12 | Holds: `repoOfFile` answers null, `logged` is null, copies only, no failure line. |
| 13 | Holds: git lists nothing for an ignored path, an empty list, no failure line. |
| 14 | Holds: both roots resolve to the same repository path through `repoOfFile`, the same `log` arguments. |
| 15 | Partly: opens at today's path with `--diff-merges=first-parent`; right while the path never changed, empty after a rename. |
| 16 | Holds for the five rows and the three diffs (the path never changed); the rows have no author. |
| 17 | Fails: one row `files.timeline_failed` filled with git's stderr or `reasonOf(error)` replaces the lists. |
| 18 | Fails: `failureSentence` ends in `error ?? diff_failed`, which is git's text. |
| 19 | Fails: a press in the Files pane makes the Files tab `activeInstance`, `fileOfTab` is null, the section says `timeline_no_file`. |
| 20 | Holds, but also says it after any Files press (case 19). |
| 21 | Holds: `selected ?? fileOfTab(tab)`. |
| 22 | Fails: the file row menu has no Open Timeline. |
| 23 | Fails: the file tab menu has no Open Timeline. |
| 24 | Fails: no `showTimeline`. |
| 25 | Fails: no Pin. |
| 26 | Fails: no Refresh control. |
| 27 | Fails: no `...` menu, no Git History or Local History choice. |
| 28 | Holds: the keys carry the file, an answer for another file is not drawn. |
| 29 | Holds: `openDiff` activates the tab with the same identity. |
| 30 | Holds: `menuOf` offers Restore on a copy, nothing on a commit. |
| 31 | Holds: `GIT_LITERAL_PATHSPECS=1`. |
| 32 | Fails: `.hunk` children are `flex: none` in a nowrap row; Revert Block runs under the scrollbar and the overview ruler (`owed-looks.md:159`). |
| 33 | Fails: no compact state; the words always draw. |
| 34 | Fails: the selected-lines words draw in full and overflow. |
| 35 | Fails: Unstage Block overflows the same way. |
| 36 | Holds: wide enough for the words, no overflow. |
| 37 | Fails: `before` is not read, so a bad value is not refused. |
| 38 | Fails: `before` is ignored and the first page is answered. |
| 39 | Partly: 50 commits draw 50 rows and no Load more (holds); 51 commits are cut at 50 silently (fails). |
| 40 | Fails: no pages; the file-change half holds (case 28). |
| 41 | Fails: no Load more row. |
| 42 | Fails: no Git History choice. |
| 43 | Fails: `FilesView` has none of the three keys. |
| 44 | Fails: no pin. |
| 45 | Fails: no `showTimeline`. |
| 46 | Fails: no `showTimeline`. |
| 47 | Holds only because any Files press already loses the file (case 19). |
| 48 | Fails: the `files` message marks no copies read; only `invalidate()` does. |
| 49 | Fails: `.whole` is `flex: none` and nowrap and runs under the scrollbar. |
| 50 | Partly: `6b135ce55` opens at the current path and shows the file created; the three older rows open at the current path and print nothing. |
| 51 | Fails: no paging. |

## Round 1, item by item

**1. A page after a merge (Z474).** `fileLog` (`server/core/git/files.ts`) now reads `git log --follow --relative -z --name-status --diff-merges=first-parent` from HEAD in git's order: the first page with `-51`, a page after `before` with no count, finds the row whose hash starts with `before`, answers the 50 rows after it and `more` when a row past them exists. A `before` that is no hash is refused before git runs, one in no row of the log answers `that commit is not in the history`. The client passes the file's own path to every page (`Timeline.svelte` `loadMore`), no longer the cursor row's `from`. The shape `{ ok, commits, more }` and `before=<hash>` are unchanged. `run.ts` head, `git-reads.ts` route comment, `timeline-reads.ts` `logUrl`, `model-sessions.ts` `GitFileCommit`, `fs.svelte.ts`, `DESIGN.md:128` and `HELP.md` say it.
Run on a scratch repository (`$TMPDIR/d42-r1/merge`: 55 commits on `f.txt`, a side branch from the 15th with commit `s1` changing it, a `--no-ff` merge that edits the file, 49 commits after it), `fileLog` paged from `fileLog(root, 'f.txt')` with `before` the last row of the page before, against `git log --follow --diff-merges=first-parent -s --format=%H -- f.txt`:
```
== K=49 (page 1 ends on the merge)
page 1: 50 rows, more=true, first=0b3facc p49, last=47049f2 merge side
page 2: 50 rows, more=true, first=be9bb84 s1 side change f, last=8c3e81c c7
page 3: 6 rows, more=false, first=f438f4f c6, last=bd7f621 c1
git rows: 106 pages rows: 106 duplicates: 0 identical order: true
s1 side commit drawn 1 time(s) across the pages
== K=48 (page 1 ends on the side commit)
page 1: 50 rows, more=true, first=683dc62 p48, last=be9bb84 s1 side change f
git rows: 105 pages rows: 105 duplicates: 0 identical order: true
== K=47 (the boundary on c55, past the side commit)
git rows: 104 pages rows: 104 duplicates: 0 identical order: true
cursor not in the log: {"ok":false,"error":"that commit is not in the history"}
cursor not a hash: {"ok":false,"error":"that is not a commit"}
cursor = oldest row: {"ok":true,"value":{"commits":[],"more":false}}
```
The old form on the same repository with the merge as cursor, `git log --follow --diff-merges=first-parent -s --format=%s -51 <merge>^ -- f.txt | grep -c '^s1'`, prints `0`: the side commit was never drawn.

**2. The followed file.** `createFollow` and its per-instance `last` state are gone from `timeline-state.svelte.ts`. `followedFile(panes, focused, fileOf)` reads the layout: the tab shown in the pane the reader used last, then the tab shown in each other pane, then the tabs each pane showed before (`Pane.recent`, the one shown last first, that pane first). `Timeline.svelte` derives it from `panes(layout(page))` and `activeInstance(page)`; a Files tab shown for the first time after a reload follows the file tab its pane showed last. Not run in a browser; read against `model.ts:47-58` (`recent` is saved with the layout).

**3. The short hash.** `DiffSubject.short` carries git's `%h` from the Timeline row (`short: row.short` in `show`); `failureSentence` names `subject.short` and the `SHORT` constant is gone. A commit diff opened from elsewhere carries no `short` and keeps the server's own text as before.

**4. The fallbacks.** `NO_COMMITS` and `NO_COPIES` in `fs-history.ts` are `noCommits()` and `noCopies()`, built per call.

**5. The greps spec.md asks.**
- History words over the 796 added source and config lines (a diff of every changed file against the base copy, hunks filtered to `>` lines), matched with `previous|formerly|no longer|used to|revert|D4x|Zxxx|was |were |earlier|before this|legacy|now|new|old|originally|once|since the|bug|fix`: the hits are runtime wording (`was read from`, `was written` for a file event, `Revert Block` the button, `new IntersectionObserver`, `once the message arrives`); no plan id, no date, no earlier attempt. No test was added or changed, so no test title.
- Reuse before the new helpers, on the base copy: `sectionOpened` (no helper forces a section open; `sectionFlipped`, `section-state.ts:21`, toggles, and the ask must open); `GitFileCommit` (`GitGraphCommit`, `model-sessions.ts:430`, carries parents, refs, tags and the message and no email, committer date or path, so extending it would add fields the file log does not read); `createPages` (the graph pages by `skip` over `--topo-order` for a repository, `graphPageOf` in `state/sources/repositories/answers.ts:299`; a count cannot page a `--follow` walk, and the file log pages by a commit).
- Renamed names across `src tests config HELP.md DESIGN.md`: `commitsOf` has no hit; the copies and commits reads no longer carry `error` (no `.error` read of them remains: `grep -rn "saved?.error|logged?.error"` prints nothing); `fileVersion` is gone from the history keys and remains only in `fs.svelte.ts:279,367,795` and `views/sources/file/File.svelte:79,100,103`, the file bytes' own version, unrelated.

**6. A served root below its repository's top.** `fileLog` runs with `--relative`; `run.ts` carries it in the form list. Scratch repository `$TMPDIR/d42-r1/subrepo` (`sub/old.txt` changed, renamed to `sub/new.txt`, 60 more commits, root `subrepo/sub`).
Before (the form without `--relative`, from the root):
```
5138c6e third: rename|R074|sub/old.txt|sub/new.txt|
510dd40 second: change old|M|sub/old.txt|
commitDiff(root=sub, path=sub/old.txt): 0 sides, head lines
```
and the page request at `sub/old.txt` printed no row.
After (`node probe-sub.mjs subrepo/sub new.txt`):
```
first page: true 50 more true
last row of page 1: f85b71f n11 path=new.txt from=new.txt
page 2: true 4c80878 n10 ... | 5138c6e third: rename path=new.txt from=old.txt | 510dd40 second: change old path=old.txt from=old.txt | f8e3c54 first: add old path=old.txt from=old.txt more false
diff 510dd40 second: change old: old=sub/old.txt(18b) new=sub/old.txt(23b) head=4
diff f8e3c54 first: add old: old=sub/old.txt(0b) new=sub/old.txt(18b) head=5
diff 5138c6e third: rename: old=sub/new.txt(0b) new=sub/new.txt(31b) head=5   (open item 1 above)
```
The row before the rename opens a non-empty change and Load more lists the 13 older rows.

**7. Load more and the keyboard.** The row is one `TreeItem` with `id={MORE_ID}`, `{nav}` and `level={2}` whether a page is being read or not; while one is read its label is `files.timeline_reading`, its tone muted and it has no press, so the focus stays on the row and on the same place when the page lands. Read against `TreeItem.svelte` (the focus target is the treeitem box, which is the same element). Not run in a browser.

**8. Open Timeline releases a pin (Z475).** Kept: `revealSettled` writes `timelinePinned: null` for a timeline ask (`reveal.ts`); `HELP.md` says "it releases a pin and pins nothing".

## Verify list, 2 full-list runs this round; the last one

```
test:quick: 38 changed file(s), from git since HEAD
test:quick: 64 test file(s), 10 essential
ok      ASCII gate (0.5 s)
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      svelte-kit sync (1.7 s)
ok      svelte-check (12.9 s): 1791159522726 COMPLETED 356 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (21.1 s): Duration  18.38s (transform 51.03s, setup 0ms, import 65.70s, tests 7.03s, environment 61ms)
ok      eslint (28.2 s)
test:quick: 28.9 s (limit 45.0 s); every command passed
checks: 1 commands passed
```
`npm run diagrams` ran right before each run (exit 0). The first run printed the same lines with `test:quick: 57.4 s (limit 45.0 s); every command passed` and `test:quick: over the time limit`, under the load of other suites.
- Tree checks (`--testTimeout 0 --hookTimeout 0`, the `test:checks` setting): `Test Files 7 passed (7) / Tests 80 passed (80)`. Run under load with the default 5000 ms, some cases timed out; the rerun with the setting above is the one quoted.
- G28 `tests/shell/panes/strip/tab-menu.test.ts` alone: `Test Files 1 passed (1) / Tests 2 passed (2)`.
- ASCII gate over `src tests config` (`local.yml` excluded), `HELP.md`, `DESIGN.md`: prints nothing.
- `sh utils/unused-exports.sh` against `D42-base/unused-exports.txt`: no line added, `ShowInFiles` leaves the list.
- The verify-5 grep prints the same hits as the first report, with `files.ts` lines 19, 59, 90, 107, 108 for `FILE_LOG_ENTRIES`; no `timeline_failed`.
- No test written or changed: `diff -rq /Users/axelfaes/workspace/research-hub/tools/oculus/tests tests` printed nothing at the first report and no file under `tests/` was touched since.

## DONE / NOT DONE

| Item | State | Evidence |
| --- | --- | --- |
| Brief items 1 to 9 | DONE | the first report's table, unchanged except as round 1 above |
| Round 1 items 1 to 8 | DONE | the item sections above |
| Live look | NOT DONE | the orchestrator's look on TEST |
| Rename commit of a sub-folder root | NOT DONE, open item 1 above | `reads.ts:116-122` |

## Files changed in round 1 (line counts now)

`server/core/git/files.ts` 117; `run.ts` head; `server/git/git-reads.ts` comment; `data/model/model-sessions.ts` comment; `state/sources/explorer/sections/timeline-reads.ts` comment; `timeline-state.svelte.ts` 118; `state/sources/fs-history.ts` 162; `state/sources/fs.svelte.ts` comment; `state/sources/repositories/repositories.ts` 867 (outside the brief's paths, open item 2); `views/sources/files/sections/Timeline.svelte` 387; `views/sources/repositories/diff/compare-words.ts` 63; `HELP.md`; `DESIGN.md`. The other files of the first report are unchanged.

## Before and after (what the look reads against)

- Timeline commit row: before, subject with how long ago after it, tooltip "Compare {subject} with the file now"; after, subject, author muted beside it, how long ago at the right end, tooltip with author and email, date and time with how long ago, subject and short hash (and the author date when it differs from the commit date). Copy rows keep their words with how long ago at the right end.
- Press on a commit row: before, the diff at today's path; after, at the path the file had in that commit, tab label with that path's file name and the short hash.
- More than 50 commits: before, cut silently; after, a Load more row (press, Enter or scrolling it into view); while a page is read the row keeps its place and its focus and says `Reading...`.
- A save, a replace, a commit made elsewhere: before, no new row until a reload; after, the copy row and the commit row appear without a reload and the commits list returns to its first page.
- Pressing the Files pane, or showing the Files tab for the first time after a reload: before, the section lost the file; after, it keeps the file of the file tab the page showed last (`Pane.recent`).
- Head of the Timeline section: Pin, Refresh and a `...` menu with Git History and Local History, kept per Files tab.
- Open Timeline in the file row menu (after the compare items, before Cut) and in the file tab menu (after Show in Files).
- Failed reads: two catalog sentences, and `The change in commit {0} could not be read.` for a commit diff opened from the Timeline, {0} being git's own short form (`%h`).
- A served root that is a sub-folder of its repository: before, every commit row opened "Nothing to show for this one." and Load more listed nothing; after, rows and pages read root-relative paths and open their change.
- Hunk bar in a pane about 300 px wide: before, Revert Block under the scrollbar and "Revert Bl"; after, glyph buttons with their words as the tooltip, the head cut with an ellipsis, the `.whole` sentence cut with an ellipsis inside the bar and its words as the tooltip.
- State to put it in: TEST, the hub files and the scratch repository of the brief's cases; the diff pane near 297 px, then wider than the buttons' words need, then wider than 900 px.

## Still true or rewritten

Rewritten: `Timeline.svelte` head comment; `timeline.ts`, `timeline-reads.ts`, `fs-history.ts`, `files.ts` head and function comments; `show-in-files.ts`; `layout.svelte.ts` (`showTimeline` doc); `reveal.ts` (`revealAsked`, `revealSettled`); `files-view.ts` (`FilesView` doc and `RevealAsk`); `ShowPath.svelte` head comment; `row-menu.ts` `rowMenu` doc; `tab-menu.ts` head and `tabMenu` doc; `DiffSection.svelte` hunk paragraph; `compare-words.ts` head and `failureSentence` doc; `run.ts` head (form list and the `log --follow` paragraph); `Files.svelte` sections paragraph; `repositories.ts` `DiffSubject` doc; `HELP.md` Timeline paragraph, row-menu list, tab-menu list, `GET /api/git?log=` sentence and hunk-bar paragraph; `DESIGN.md` git forms paragraph, `FilesView` keys and the `reveal` ask.
Still true (read, unchanged): `HELP.md` bookmarks and notes failure sentences; `DESIGN.md:398` local history (copies unchanged); `DESIGN.md:409` (`latex.auto_build` after a Timeline restore); `DESIGN.md:431` (Sections owns the timeline and asks again); `section-state.ts` head (Timeline starts closed); `Sections.svelte` head.

