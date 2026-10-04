# D42 report: a file's history as VS Code's Timeline, and the diff's hunk bar whole in a narrow pane

**NOT done / not proven.** Every brief item 1 to 9 is built and the verify list is green (3 full-list runs, the last one passed). Nothing was looked at: I run no server and no browser, so none of the 51 cases is proven live, and cases 1 to 11, 16, 19 to 27, 32 to 36, 40, 41, 49 and 50 wait for the orchestrator's look on TEST. Three more things are unverified or limited, stated plainly:
1. The byte layout of `git log --follow -z --name-status --diff-merges=first-parent` between the format line and the status lines is taken from the brief's `od -c` probe (`\0  \n  R 0 7 9 \0`); I may not run git, so `parseFileLog` (`server/core/git/parse.ts`) is read against that probe and not run against git. It accepts either a NUL or a newline run after the format line (`rest.replace(/^[\0\n]+/, '')`). Not verified against real git output.
2. The Timeline's followed file (`createFollow`, `state/sources/explorer/sections/timeline-state.svelte.ts`) remembers the file tab that was active while the Files tab was mounted. A file tab that was last active before the Files tab was first shown on the page is not known to it, so with the Files tab in the same pane as the source tab and never shown before, the section says `files.timeline_no_file` until a file tab is activated or a file is selected. Not fixed in this step: it needs the last file tab to be recorded where the Files tab does not have to be mounted (the layout store), which is outside the brief's paths in design; I name it for the orchestrator to rule on.
3. A git root that is a sub-folder of its repository (a served root below the repository's top) would give `path` relative to the top for `log`; `repoOfFile` returns the deepest holding served root, which is the repository for every root the hub serves today. No numbered case covers a root of that shape; not verified.

One read-only `git diff HEAD --stat` ran in this session by mistake (the brief forbids git commands); it changed nothing.

## Open items of the state file (verbatim, `orchestrator-state.md:176-180`)

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

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

## DONE / NOT DONE

| Item | State | Evidence |
| --- | --- | --- |
| 1 Author, date, subject, path per commit | DONE | `fileLog` and `parseFileLog` (`server/core/git/files.ts`, `parse.ts`), `GitFileCommit` (`data/model/model-sessions.ts`), `timeline.ts`, `timeline-reads.ts`, `Timeline.svelte` (label subject, detail author, `end` how long ago, tooltip `files.timeline_commit_title`, press opens `row.path`). Live: not looked at. |
| 2 Pages of 50, Load more | DONE | `-51` and `<hash>^` in `fileLog`, `before` and `more` in `git-reads.ts`, `createPages` in `timeline-state.svelte.ts`, the `Load more` row with press, Enter and an IntersectionObserver in `Timeline.svelte`. Live: not looked at. |
| 3 Refresh keys | DONE | commits keyed by HEAD (branch and `log[0]`), copies marked by `files` messages (`fs-history.ts`). Live: not looked at. |
| 4 Followed file | DONE with limitation 2 above | `createFollow`. |
| 5 Open Timeline | DONE | `showTimeline` (`show-in-files.ts`, `layout.svelte.ts`), `RevealAsk.timeline`, `revealAsked`, `revealSettled`, `ShowPath.svelte`, `row-menu.ts`, `tab-menu.ts`, `tab-menu-state.svelte.ts`. |
| 6 Head controls | DONE | Pin, Refresh, `...` with Git History and Local History in `Timeline.svelte`; `timelinePinned`, `timelineGit`, `timelineLocal` in `files-view.ts` with `.catch` defaults. |
| 7 Failure sentences | DONE | `timeline_commits_failed`, `timeline_copies_failed` (`files.yml`), `diff_commit_failed` (`repositories.yml`) through `failureSentence` (`compare-words.ts`); `timeline_failed` is removed and has no reader. |
| 8 Hunk bar | DONE | `HunkBar.svelte` (new), `DiffSection.svelte` slimmed from 515 to 455 lines. Live: not looked at. |
| 9 Docs | DONE | `HELP.md` (Timeline paragraph and row menu, tab menu, `GET /api/git?log=`, hunk bar), `DESIGN.md` (git form, `FilesView` keys, `reveal` ask), head comments listed below. |
| No test written or changed | DONE | `diff -rq /Users/axelfaes/workspace/research-hub/tools/oculus/tests tests` prints nothing; `tests/shell/panes/strip/tab-menu.test.ts` ran: `Test Files 1 passed (1) / Tests 2 passed (2)`. |

Verify list, 3 full-list runs; the last one:

```
test:quick: 36 changed file(s), from git since HEAD
test:quick: 64 test file(s), 10 essential
ok      ASCII gate (0.6 s)
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.1 s)
ok      eslint (10.2 s)
ok      svelte-check (14.7 s): 1791156789152 COMPLETED 356 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (18.0 s): Duration  14.30s (transform 23.22s, setup 0ms, import 38.82s, tests 16.18s, environment 172ms)
test:quick: 18.7 s (limit 45.0 s); every command passed
checks: 1 commands passed
```

`npm run diagrams` ran right before each run (exit 0).

Brief verify items:
- 2, tree checks: `Test Files 7 passed (7) / Tests 80 passed (80)` (boundaries, size, duplication, config, keys, history, comment-width).
- 3, ASCII gate (the `perl` form of `spec.md:97` over `src tests config`, `local.yml` excluded; `bin/` does not exist): prints nothing.
- 4, `sh utils/unused-exports.sh` against `D42-base/unused-exports.txt`: no line added; one removed (`ShowInFiles` leaves the unused list of `state/workbench/layout/index.ts`, now used by `layout.svelte.ts`). `TAB_TIMELINE`, `ROW_TIMELINE` and `FollowTab` are not exported, so none is added.
- 5, the grep, each hit judged:
  - `tab-menu.ts:89`, `row-menu.ts:265`: `files.menu_timeline` readers (the two menus). Right.
  - `tab-menu-state.svelte.ts:116`, `layout.svelte.ts:217` and `:817`, `show-in-files.ts:20` and `:79`, `row-menu.ts:341`, `:361`, `:492`, `ShowPath.svelte:4` and `:8`: `showTimeline` declaration, exposure and callers. Right.
  - `files.ts:19`, `:58`, `:86`, `:100`, `:101`: `FILE_LOG_ENTRIES` is the page size and the `-51` count. Right.
  - `git-reads.ts:163`: the route comment names `before=`. Right.
  - `state/sessions/changes.svelte.ts:118`: `?before=` of the sessions changes route, unrelated.
  - `Timeline.svelte:168`: `timeline_row_title`, now used for copy rows only. Right. `Timeline.svelte:197` and `files.yml:209`: `timeline_commit_diff` reader and definition. `files.yml:110`, `:226`: definitions of `menu_timeline` and `timeline_row_title`.
  - `timeline_failed` has no hit anywhere: removed.
- 6: this step adds or changes no test.

## Files (line counts, base to now; `HELP.md` and `DESIGN.md` are not in the base copy, so only the new count)

`data/model/index.ts` 511 to 513; `data/model/model-sessions.ts` 802 to 820; `server/core/git/files.ts` 79 to 110; `parse.ts` 587 to 632; `run.ts` 238 to 241; `server/git/git-reads.ts` 270 to 278; `shell/panes/strip/tab-menu-state.svelte.ts` 132 to 135; `tab-menu.ts` 222 to 227; `state/sources/explorer/sections/section-state.ts` 25 to 30; `timeline-reads.ts` 52 to 73; `timeline-state.svelte.ts` new, 114; `timeline.ts` 48 to 72; `explorer/view/files-view.ts` 230 to 249; `reveal.ts` 120 to 134; `state/sources/fs-history.ts` 93 to 156; `fs.svelte.ts` 809 to 830; `workbench/layout/open/show-in-files.ts` 67 to 82; `workbench/layout.svelte.ts` 818 to 825; `views/shared/explorer/tree/ShowPath.svelte` 140 to 148; `tree/menu/row-menu.ts` 496 to 500; `views/sources/files/Files.svelte` 321 to 323; `sections/Sections.svelte` 110 to 127; `sections/Timeline.svelte` 194 to 389; `repositories/diff/DiffSection.svelte` 515 to 455; `HunkBar.svelte` new, 203; `compare-words.ts` 49 to 59; `config/text/views/sources/files.yml` 229 to 240; `repositories.yml` 276 to 277; `HELP.md` 348; `DESIGN.md` 435; `docs/diagrams/` rewritten by `npm run diagrams`. All sizes are under 880 (components under 520). `views/sources/repositories/diff/` holds 10 items, `state/sources/explorer/sections/` 6.

No file outside the brief's write list was written.

## Judgment calls (each reversible)

1. Open Timeline releases a pin (`revealSettled` writes `timelinePinned: null` for a timeline ask): with a pin held on file A, Open Timeline on B would otherwise change nothing visible. The brief says "pins nothing"; it does not pin, it only releases. Reverse by deleting `timelinePinned: null` in `reveal.ts`.
2. `HunkBar.svelte` takes the head text, the hunk's place `at`, its bar id and `onact(mode)`, not the hunk itself: it needs nothing else of the hunk, and `DiffSection` keeps `pickedIn` and `act`.
3. The bar draws compact while its width is under the width the buttons took with their words plus `ROOM = 96` px (the head's first characters, the padding and the gaps). The width taken is kept with the words it was taken for, so a changed label (a line count) is measured again before the bar decides.
4. The `.whole` sentence is wrapped in `ui/menu/Tooltip.svelte` for its tooltip rather than a `title` attribute.
5. A Timeline pin whose root leaves the workspace is dropped by an effect in `Timeline.svelte` once the workspaces have loaded without error.
6. `TAB_TIMELINE`, `ROW_TIMELINE` and `FollowTab` are file-local, so no unused export is added.
7. Failure lines are drawn beside the other list, not instead of it; a failed later page shows `timeline_commits_failed` in place of Load more and keeps the rows read.
8. Copies older than the last commit read are held back while commits remain (`timelineOf(copies, commits, more)`), as the brief says; with Git History unchecked every copy is drawn.

## Before and after (what the look reads against)

- Timeline commit row: before, subject with how long ago after it, tooltip "Compare {subject} with the file now"; after, subject, author muted beside it, how long ago at the right end, tooltip with author and email, date and time with how long ago, subject and short hash (and the author date when it differs from the commit date). Copy rows keep their words with how long ago at the right end.
- Press on a commit row: before, the diff at today's path; after, at the path the file had in that commit, tab label with that path's file name and the short hash.
- More than 50 commits: before, cut silently; after, a Load more row (press, Enter or scrolling it into view), `Reading...` while a page is read.
- A save, a replace, a commit made elsewhere: before, no new row until a reload; after, the copy row and the commit row appear without a reload and the commits list returns to its first page.
- Pressing the Files pane: before, the section lost the file; after, it keeps the last file tab's file.
- Head of the Timeline section: Pin, Refresh and a `...` menu with Git History and Local History, kept per Files tab.
- Open Timeline in the file row menu (after the compare items, before Cut) and in the file tab menu (after Show in Files).
- Failed reads: two catalog sentences, and `The change in commit {0} could not be read.` for a commit diff.
- Hunk bar in a pane about 300 px wide: before, Revert Block under the scrollbar and "Revert Bl"; after, glyph buttons with their words as the tooltip, the head cut with an ellipsis, the `.whole` sentence cut with an ellipsis inside the bar and its words as the tooltip.
- State to put it in: TEST, the hub files and the scratch repository of the brief's cases; the diff pane near 297 px, then wider than the buttons' words need, then wider than 900 px.

## Still true or rewritten

Rewritten: `Timeline.svelte` head comment; `timeline.ts`, `timeline-reads.ts`, `fs-history.ts`, `files.ts` head and function comments; `show-in-files.ts`; `layout.svelte.ts` (`showTimeline` doc); `reveal.ts` (`revealAsked`, `revealSettled`); `files-view.ts` (`FilesView` doc and `RevealAsk`); `ShowPath.svelte` head comment; `row-menu.ts` `rowMenu` doc; `tab-menu.ts` head and `tabMenu` doc; `DiffSection.svelte` hunk paragraph; `compare-words.ts` head and `failureSentence` doc; `run.ts` head (form list and the `log --follow` paragraph); `Files.svelte` sections paragraph; `HELP.md` Timeline paragraph, row-menu list, tab-menu list, `GET /api/git?log=` sentence and hunk-bar paragraph; `DESIGN.md` git forms paragraph, `FilesView` keys and the `reveal` ask.
Still true (read, unchanged): `HELP.md` bookmarks and notes failure sentences; `DESIGN.md:398` local history (copies unchanged); `DESIGN.md:409` (`latex.auto_build` after a Timeline restore); `DESIGN.md:431` (Sections owns the timeline and asks again); `section-state.ts` head (Timeline starts closed); `Sections.svelte` head.

## Anything wrong in the brief

- Item 8 says the bar takes "the hunk"; it needs only the head text, place and id (judgment call 2).
- The brief's "no git command" rule and `test:quick` reading changed files from git itself: the latter ran as `spec.md:25` allows.
- Nothing impossible. Item 4's order (pinned, selected, last file tab) leaves limitation 2 as stated at the top.
