Everything in the brief is done. The cases' page-only aspects (a pane drawn on screen, a drag, a reload of the real page) are left to the orchestrator's look at landing and are named in the table; the unit-level runs of all 28 cases are quoted below.

## Open items of the state file (copied from the main checkout's `tools/oculus/.scratch/migration/orchestrator-state.md` when this report was written)

## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
None.

## The cases: first run on the unchanged tree, and the run after the change

Command, both runs: `npx vitest run tests/state/workbench/layout/d57-scratch.test.ts --silent=false --reporter=verbose`, a scratch file that prints each case and asserts nothing (37 test blocks: the 28 cases, a read-back block for saved values of the mark, a block for a stale id, and the opened-view variants of case 24). The first run was made in `scratchpad/base-run`, a copy of `.agents/worktrees/D57-base/tools/oculus` with the worktree's `node_modules` linked and the tool's config files (`vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `.prettierrc`) copied in; the base `src` there has no `addedPane`. The after run was made in the worktree. Every pane is made by the product's own function: rail pages by `openRailPage` from the arrangements read out of `config/layout.yml`, run-time panes by `openView`, `openBeside`, `openNextTo`, `openAway`, `splitInstance`, `transferInstance`, `returnFloat`, `floatPane`, `floatTab`, `windowTab`, `copyTabToWindow`, `adoptFloats` and `loadLayout` of a saved envelope; the lock is `setLocked` through `layout.change`, as the pane menu's Lock Group calls it. A pane prints as `(tabs;flags)`, `row[... | ...]` and `col[...]` for splits. The suffix on a line is the scratch file's comparison with the end state the brief states for that case, printed as the run printed it.

The first run found no case that the brief's rules get wrong: every case's stated end state is reachable under the rules, so nothing was handed back before the change.

First run, unchanged tree (`Tests  37 passed (37)`):

```
CASE 1 start: (focus)
CASE 1 project opened: row[(focus) | (project)]
CASE 1 project closed: row[(focus) | (empty)]  [after expects (focus)]
CASE 2 file opened: row[(files,repositories,search,latex,problems) | (file)]
CASE 2 file closed: row[(files,repositories,search,latex,problems) | (empty)]  [= after]
CASE 3 closed files: row[(repositories,search,latex,problems) | (empty)]
CASE 3 closed repositories: row[(search,latex,problems) | (empty)]
CASE 3 closed search: row[(latex,problems) | (empty)]
CASE 3 closed latex: row[(problems) | (empty)]
CASE 3 closed problems: (empty)
CASE 3 all five closed: (empty)  [after expects row[(empty) | (empty)]]
CASE 3 next file opened: (file)  [after expects row[(file) | (empty)]]
CASE 4 tools closed: (empty)
CASE 4 file opened in right pane: (file)
CASE 4 file closed: (empty)  [after expects row[(empty) | (empty)]]
CASE 5 A split right: row[(projects,archive,personal) | (coauthor)]
CASE 5 A dragged back onto first pane: (coauthor,projects,archive,personal)  [= after]
CASE 5 B file in right pane: row[(files,repositories,search,latex,problems) | (file)]
CASE 5 B file dragged to bottom edge of left pane: row[col[(files,repositories,search,latex,problems) | (file)] | (empty)]  [after expects row[col[(files,repositories,search,latex,problems) | (file;added)] | (empty)]]
CASE 6 A marked terminal pane: row[(focus) | (terminal)]
CASE 6 A terminal closed: row[(focus) | (empty;terminals)]  [after expects (focus)]
CASE 6 B arrangement terminal closed: row[row[(session-list) | col[(empty;terminals) | (transcript,timeline)]] | (session-detail,changes,agents,files)]
CASE 7 locked: row[(focus) | (project;locked)]
CASE 7 closed: row[(focus) | (empty;locked)]  [after expects row[(focus) | (empty;added,locked)]]
CASE 8 new page: (status)
CASE 8 its only tab closed: (empty)  [= after]
CASE 8 file opened: row[(status) | (file)]
CASE 8 file closed: row[(status) | (empty)]  [after expects (status)]
CASE 9 arrangement pane closed: (project)
CASE 9 last tab closed: (empty)  [= after]
CASE 10 split: row[(focus) | (project)]
CASE 10 marked pane removed: row[(focus) | (empty)]  [after expects (focus)]
CASE 11 two projects: row[(focus) | (project,project)]
CASE 11 first pinned: row[(focus) | (project,project)]
CASE 11 second moved to front: row[(focus) | (project,project)]
CASE 11 first closed: row[(focus) | (project)]
CASE 11 second closed: row[(focus) | (empty)]  [after expects (focus)]
CASE 11 renamed: row[(focus) | (project)]
CASE 11 renamed tab closed: row[(focus) | (empty)]  [after expects (focus)]
CASE 12 saved page: row[(focus) | (project)]
CASE 12 read back: true row[(focus) | (project)]
CASE 12 closed after reload: row[(focus) | (empty)]  [after expects (focus)]
CASE 12 layout saved without a mark: row[(projects) | (projects)]
CASE 12 its first pane emptied: (projects)  [after expects row[(empty) | (projects)]]
CASE 13 floated left pane: (empty) floats=(files,repositories,search,latex,problems)
CASE 13 returned: row[(empty) | (files,repositories,search,latex,problems)]
CASE 13 its five tabs closed: (empty)  [= after]
CASE 14 floated tab: row[(focus) | (empty)] floats=1
CASE 14 float tab closed: row[(focus) | (empty)] floats=0  [after expects (focus) floats=0]
CASE 15 after reset: (focus)  [= after]
CASE 16 maximised: row[(focus) | (project)] focus={"path":[1]}
CASE 16 closed: row[(focus) | (empty)] focus={"path":[1]}  [after expects (focus) focus=null]
CASE 17 A marked only tab moved: row[(focus) | (empty)] || other (status,project)  [after expects (focus) || other (status,project)]
CASE 17 B arrangement only tab moved: row[(files,repositories,search,latex,problems) | (empty)] || other (status,file)  [= after]
CASE 18 read: row[(projects) | (empty)]
CASE 18 file opened: row[(projects) | (file)]
CASE 18 file closed: row[(projects) | (empty)]  [after expects (projects)]
CASE 19 right arrangement pane closed: (files,repositories,search,latex,problems)  [= after]
CASE 20 A windowTab of marked only tab: row[(focus) | (empty)] floats=1  [after expects (focus) floats=1]
CASE 20 B windowTab of arrangement terminal: row[row[(session-list) | col[(empty;terminals) | (transcript,timeline)]] | (session-detail,changes,agents,files)] floats=1
CASE 20 C floatTab of arrangement terminal: row[row[(session-list) | col[(empty;terminals) | (transcript,timeline)]] | (session-detail,changes,agents,files)]
CASE 20 D floatTab of marked only tab: row[(focus) | (empty)] floats=1  [after expects (focus) floats=1]
CASE 21 float pane: (focus) float=(project)  [= after]
CASE 21 saved float pane has added: false  [= after]
CASE 21 returned: row[(focus) | (project)]
CASE 21 only pane floated: (empty) float=(focus)  [= after]
CASE 22 copied: before=row[(focus) | (project)] after=row[(focus) | (project)] float=(project)
CASE 23 adopted: (projects) floats=1  [after expects row[(empty) | (projects)] floats=1]
CASE 24 split right: row[(projects,archive,personal) | (coauthor)]
CASE 24 split right, new pane's tab closed: (projects,archive,personal)  [= after]
CASE 24 split bottom: col[(projects,archive,personal) | (coauthor)]
CASE 24 split bottom, new pane's tab closed: (projects,archive,personal)  [= after]
CASE 24 split top: col[(coauthor) | (projects,archive,personal)]
CASE 24 split top, new pane's tab closed: (projects,archive,personal)  [= after]
CASE 24 split left: row[(coauthor) | (projects,archive,personal)]
CASE 24 split left, new pane's tab closed: (projects,archive,personal)  [= after]
CASE 25 A float tab dropped on edge: row[(focus) | (project) | (empty)] floats=0
CASE 25 A its tab closed: row[(focus) | (empty)]  [after expects (focus)]
CASE 25 B other page tab dropped on edge: row[(focus) | (project)] || other row[(status) | (empty)]
CASE 25 B its tab closed: row[(focus) | (empty)]  [after expects (focus)]
CASE 26 A openNextTo project: row[(focus) | (project)]
CASE 26 A closed: row[(focus) | (empty)]  [after expects (focus)]
CASE 26 B openNextTo tool view: row[(focus) | (settings)]
CASE 26 B closed: (focus)  [= after]
CASE 26 C openAway project: row[(focus) | (project)]
CASE 26 C closed: row[(focus) | (empty)]  [after expects (focus)]
CASE 26 D openAway tool view: row[(focus) | (settings)]
CASE 26 D closed: (focus)  [= after]
CASE 27 locked emptied: row[(focus) | (empty;locked)]
CASE 27 unlocked: row[(focus) | (empty)]  [after expects row[(focus) | (empty;added)]]
CASE 27 tab landed: row[(focus) | (project)]
CASE 27 tab closed: row[(focus) | (empty)]  [after expects (focus)]
CASE 21 saved added=true: read=true row[(projects) | (projects)] floats=(projects)
CASE 21 saved added=false: read=true row[(projects) | (projects)] floats=(projects)
CASE 21 saved added="yes": read=true row[(projects) | (projects)] floats=(projects)
CASE 21 saved added=1: read=true row[(projects) | (projects)] floats=(projects)
CASE 21 saved added=null: read=true row[(projects) | (projects)] floats=(projects)
CASE 0 stale id after close: pages unchanged: true  [= after]
CASE 24 opened views in one pane: (status,project,project)
CASE 24 opened view split right: row[(status,project) | (project)]
CASE 24 opened view split right, new pane's tab closed: row[(status,project) | (empty)]  [after expects (status,project)]
CASE 24 opened views in one pane: (status,project,project)
CASE 24 opened view split bottom: col[(status,project) | (project)]
CASE 24 opened view split bottom, new pane's tab closed: col[(status,project) | (empty)]  [after expects (status,project)]
CASE 24 opened views in one pane: (status,project,project)
CASE 24 opened view split top: col[(project) | (status,project)]
CASE 24 opened view split top, new pane's tab closed: col[(empty) | (status,project)]  [after expects (status,project)]
CASE 24 opened views in one pane: (status,project,project)
CASE 24 opened view split left: row[(project) | (status,project)]
CASE 24 opened view split left, new pane's tab closed: row[(empty) | (status,project)]  [after expects (status,project)]
```

After the change (`Tests  37 passed (37)`):

```
CASE 1 start: (focus)
CASE 1 project opened: row[(focus) | (project;added)]
CASE 1 project closed: (focus)  [= after]
CASE 2 file opened: row[(files,repositories,search,latex,problems) | (file)]
CASE 2 file closed: row[(files,repositories,search,latex,problems) | (empty)]  [= after]
CASE 3 closed files: row[(repositories,search,latex,problems) | (empty)]
CASE 3 closed repositories: row[(search,latex,problems) | (empty)]
CASE 3 closed search: row[(latex,problems) | (empty)]
CASE 3 closed latex: row[(problems) | (empty)]
CASE 3 closed problems: row[(empty) | (empty)]
CASE 3 all five closed: row[(empty) | (empty)]  [= after]
CASE 3 next file opened: row[(file) | (empty)]  [= after]
CASE 4 tools closed: row[(empty) | (empty)]
CASE 4 file opened in right pane: row[(empty) | (file)]
CASE 4 file closed: row[(empty) | (empty)]  [= after]
CASE 5 A split right: row[(projects,archive,personal) | (coauthor;added)]
CASE 5 A dragged back onto first pane: (coauthor,projects,archive,personal)  [= after]
CASE 5 B file in right pane: row[(files,repositories,search,latex,problems) | (file)]
CASE 5 B file dragged to bottom edge of left pane: row[col[(files,repositories,search,latex,problems) | (file;added)] | (empty)]  [= after]
CASE 6 A marked terminal pane: row[(focus) | (terminal;added)]
CASE 6 A terminal closed: (focus)  [= after]
CASE 6 B arrangement terminal closed: row[row[(session-list) | col[(empty;terminals) | (transcript,timeline)]] | (session-detail,changes,agents,files)]
CASE 7 locked: row[(focus) | (project;added,locked)]
CASE 7 closed: row[(focus) | (empty;added,locked)]  [= after]
CASE 8 new page: (status)
CASE 8 its only tab closed: (empty)  [= after]
CASE 8 file opened: row[(status) | (file;added)]
CASE 8 file closed: (status)  [= after]
CASE 9 arrangement pane closed: (project;added)
CASE 9 last tab closed: (empty)  [= after]
CASE 10 split: row[(focus) | (project;added)]
CASE 10 marked pane removed: (focus)  [= after]
CASE 11 two projects: row[(focus) | (project,project;added)]
CASE 11 first pinned: row[(focus) | (project,project;added)]
CASE 11 second moved to front: row[(focus) | (project,project;added)]
CASE 11 first closed: row[(focus) | (project;added)]
CASE 11 second closed: (focus)  [= after]
CASE 11 renamed: row[(focus) | (project;added)]
CASE 11 renamed tab closed: (focus)  [= after]
CASE 12 saved page: row[(focus) | (project;added)]
CASE 12 read back: true row[(focus) | (project;added)]
CASE 12 closed after reload: (focus)  [= after]
CASE 12 layout saved without a mark: row[(projects) | (projects)]
CASE 12 its first pane emptied: row[(empty) | (projects)]  [= after]
CASE 13 floated left pane: (empty) floats=(files,repositories,search,latex,problems)
CASE 13 returned: row[(empty) | (files,repositories,search,latex,problems;added)]
CASE 13 its five tabs closed: (empty)  [= after]
CASE 14 floated tab: (focus) floats=1
CASE 14 float tab closed: (focus) floats=0  [= after]
CASE 15 after reset: (focus)  [= after]
CASE 16 maximised: row[(focus) | (project;added)] focus={"path":[1]}
CASE 16 closed: (focus) focus=null  [= after]
CASE 17 A marked only tab moved: (focus) || other (status,project)  [= after]
CASE 17 B arrangement only tab moved: row[(files,repositories,search,latex,problems) | (empty)] || other (status,file)  [= after]
CASE 18 read: row[(projects) | (empty;added)]
CASE 18 file opened: row[(projects) | (file;added)]
CASE 18 file closed: (projects)  [= after]
CASE 19 right arrangement pane closed: (files,repositories,search,latex,problems)  [= after]
CASE 20 A windowTab of marked only tab: (focus) floats=1  [= after]
CASE 20 B windowTab of arrangement terminal: row[row[(session-list) | col[(empty;terminals) | (transcript,timeline)]] | (session-detail,changes,agents,files)] floats=1
CASE 20 C floatTab of arrangement terminal: row[row[(session-list) | col[(empty;terminals) | (transcript,timeline)]] | (session-detail,changes,agents,files)]
CASE 20 D floatTab of marked only tab: (focus) floats=1  [= after]
CASE 21 float pane: (focus) float=(project)  [= after]
CASE 21 saved float pane has added: false  [= after]
CASE 21 returned: row[(focus) | (project;added)]
CASE 21 only pane floated: (empty) float=(focus)  [= after]
CASE 22 copied: before=row[(focus) | (project;added)] after=row[(focus) | (project;added)] float=(project)
CASE 23 adopted: row[(empty) | (projects)] floats=1  [= after]
CASE 24 split right: row[(projects,archive,personal) | (coauthor;added)]
CASE 24 split right, new pane's tab closed: (projects,archive,personal)  [= after]
CASE 24 split bottom: col[(projects,archive,personal) | (coauthor;added)]
CASE 24 split bottom, new pane's tab closed: (projects,archive,personal)  [= after]
CASE 24 split top: col[(coauthor;added) | (projects,archive,personal)]
CASE 24 split top, new pane's tab closed: (projects,archive,personal)  [= after]
CASE 24 split left: row[(coauthor;added) | (projects,archive,personal)]
CASE 24 split left, new pane's tab closed: (projects,archive,personal)  [= after]
CASE 25 A float tab dropped on edge: row[(focus) | (project;added)] floats=0
CASE 25 A its tab closed: (focus)  [= after]
CASE 25 B other page tab dropped on edge: row[(focus) | (project;added)] || other (status)
CASE 25 B its tab closed: (focus)  [= after]
CASE 26 A openNextTo project: row[(focus) | (project;added)]
CASE 26 A closed: (focus)  [= after]
CASE 26 B openNextTo tool view: row[(focus) | (settings;added)]
CASE 26 B closed: (focus)  [= after]
CASE 26 C openAway project: row[(focus) | (project;added)]
CASE 26 C closed: (focus)  [= after]
CASE 26 D openAway tool view: row[(focus) | (settings;added)]
CASE 26 D closed: (focus)  [= after]
CASE 27 locked emptied: row[(focus) | (empty;added,locked)]
CASE 27 unlocked: row[(focus) | (empty;added)]  [= after]
CASE 27 tab landed: row[(focus) | (project;added)]
CASE 27 tab closed: (focus)  [= after]
CASE 21 saved added=true: read=true row[(projects;added) | (projects)] floats=(projects)
CASE 21 saved added=false: read=true row[(projects) | (projects)] floats=(projects)
CASE 21 saved added="yes": read=true row[(projects) | (projects)] floats=(projects)
CASE 21 saved added=1: read=true row[(projects) | (projects)] floats=(projects)
CASE 21 saved added=null: read=true row[(projects) | (projects)] floats=(projects)
CASE 0 stale id after close: pages unchanged: true  [= after]
CASE 24 opened views in one pane: (status,project,project)
CASE 24 opened view split right: row[(status,project) | (project;added)]
CASE 24 opened view split right, new pane's tab closed: (status,project)  [= after]
CASE 24 opened views in one pane: (status,project,project)
CASE 24 opened view split bottom: col[(status,project) | (project;added)]
CASE 24 opened view split bottom, new pane's tab closed: (status,project)  [= after]
CASE 24 opened views in one pane: (status,project,project)
CASE 24 opened view split top: col[(project;added) | (status,project)]
CASE 24 opened view split top, new pane's tab closed: (status,project)  [= after]
CASE 24 opened views in one pane: (status,project,project)
CASE 24 opened view split left: row[(project;added) | (status,project)]
CASE 24 opened view split left, new pane's tab closed: (status,project)  [= after]
```

What each case's two runs show, and what only the page shows:

| Case | First run | After | Left to the look |
| --- | --- | --- | --- |
| 1 | pane stays, `row[(focus) | (empty)]` | `(focus)` | Focus page from its arrangement, a project opened from a deadline row, then closed |
| 2 | `row[(files,...) | (empty)]` | same, documents pane | Explorer page |
| 3 | pane removed, `(empty)` | `row[(empty) | (empty)]`; the next file lands in the left one, the first empty documents pane in tree order | Explorer page |
| 4 | `(empty)` | `row[(empty) | (empty)]` | Explorer page |
| 5 | A: marked pane removed on the way back (a tool view), B: no mark, right pane stays | A: `(coauthor;added)` made and removed; B: `(file;added)` made, right pane stays `(empty)` | TEST: a drag to the right edge and back |
| 6 | A: marked pane stays `(empty;terminals)`; B: `(empty;terminals)` | A: `(focus)`; B: `(empty;terminals)` | none |
| 7 | `(empty;locked)` | `(empty;added,locked)` | none |
| 8 | only tab: `(empty)`; added pane: `row[(status) | (empty)]` | only tab: `(empty)`; added pane: `(status)` | none |
| 9 | `(empty)` | `(empty)` | none |
| 10 | `row[(focus) | (empty)]` | `(focus)`, the arrangement pane unmarked and holding its tab | none |
| 11 | mark absent; pane stays | `;added` after pin, move to front, second tab joined, first closed and rename; `(focus)` after the last close | none |
| 12 | read back unmarked, closing leaves `(empty)`; unmarked layout `(projects)` after emptying | `(project;added)` read back, closing gives `(focus)`; unmarked layout `row[(empty) | (projects)]` | TEST: a reload of the real page |
| 13 | returned pane unmarked | `;added`; five closes give `(empty)` | TEST: Return to Page |
| 14 | `row[(focus) | (empty)] floats=1`, then `floats=0` | `(focus) floats=1`, then `floats=0` | none |
| 15 | `(focus)` | `(focus)` | none |
| 16 | `focus={"path":[1]}` kept on the empty pane | `(focus) focus=null` | none |
| 17 | A: source pane left empty; B: left empty | A: `(focus)`; B: left empty | none |
| 18 | empty pane unmarked, stays after the file closes | `(empty;added)`, removed after the file closes | none |
| 19 | `(files,...)` | same | none |
| 20 | A and D: `row[(focus) | (empty)]`; B and C `(empty;terminals)` | A and D: `(focus)`; B and C `(empty;terminals)` | none |
| 21 | float pane unmarked, return unmarked | float pane unmarked in memory and in the saved text; a saved float pane with `added: true` reads without it; returned pane `;added`; only pane floated gives `(empty)` | none |
| 22 | source untouched, float `(project)` | same, source `(project;added)` | none |
| 23 | `(projects)` | `row[(empty) | (projects)] floats=1` | none |
| 24 | tool-view panes removed; opened-view panes stay `(empty)` | new pane `;added` on all four edges, removed with its last tab, tool view and opened view alike | none |
| 25 | `row[(focus) | (empty)]` left behind | `(focus)` after the float's or the other page's tab closes | none |
| 26 | opened view: `row[(focus) | (empty)]` left behind; tool view removed | `(focus)` for openNextTo and openAway, opened view and tool view | Views catalogue |
| 27 | unlocked pane unmarked, stays after the tab closes | `(empty;added)` unlocked, tab lands, tab closes: `(focus)` | none |
| 28 | read, see below | read, see below | an unsaved-text close on a pane's last tab |

Case 28, by reading: the unsaved-text question's yes calls `closeInstance(id, deps.page())` (`src/lib/shell/panes/strip/close-question.svelte.ts:66`), which is the store's `closeInstance` (`instances.ts`), which passes `keepFor(holder)` to `removeInstance` (the tree's `closeInstance`) and so reaches `keptPane`. `tests/state/client/terminal/terminal-close.test.ts` passes on the unchanged tree and after the change (the guarded runs below).

The stale-id block: after a tab was closed, `transferInstance`, `splitInstance`, `moveInstanceToPage`, `closeInstance` and `floatTab` called with its id left the pages unchanged (`CASE 0 stale id after close: pages unchanged: true`). In code: `transferInstance` returns when `access.holding(id)` is null (`instances.ts:343`), `splitInstance` likewise (`instances.ts:364`), `moveInstanceToPage` likewise (`instances.ts:244`), and `carryToPage` returns when the tab is no longer in the source host (`instances.ts:262`), so a close that lands while a drag of the same tab is in flight, and a move whose source pane is already gone, change nothing; the tree functions return the layout they were given for a missing tab (`tree.ts` `closeInstance`, `moveInstance` at `found === null`).

## DONE / NOT DONE

| Item | Status | Command and output |
| --- | --- | --- |
| What to build 1, the mark `added` on run-time panes | DONE | cases 1, 5 to 8, 10 to 13, 18, 21, 24 to 26 above; `model.ts:64` (`added?: true`), `model.ts:262-264` (`addedPane`), `tree.ts` `splitPane`, `open/float/pages.ts` `returnFloat`, `nested.ts` `withoutLeaves`, `model.ts:254` (`repane` carries it), `saved.ts:375` (read), `pages.ts:236` and `saved.ts:609` (a float's pane carries none) |
| What to build 2, the rule | DONE | `tree.ts:178-185` `keptPane`; cases 1 to 27 above |
| What to build 3, one function reached by every caller | DONE | `grep -rn "keptPane" src` prints the definition `tree.ts:178`, its one call `tree.ts:203` in `removeTab`, and the comments `tree.ts:194` and `instances.ts:83`; `floatTab`, `windowTab`, `moveInstance` and `adoptFloats` reach it through `removeTab` (cases 20, 17, 23) |
| What to build 4, the text | DONE | `docs/window.md` lines 15 and 41 and `DESIGN.md:238` rewritten; the other comments listed below |
| Verify 1, `npm run diagrams && npm run test:quick` | DONE | `test:quick: 56.8 s (limit 45.0 s); every command passed`; lines below |
| Verify 2, G29, G31, G28 | DONE | unchanged tree: `Test Files  3 passed (3)`, `Tests  7 passed (7)`; after: `Test Files  3 passed (3)`, `Tests  7 passed (7)` (`npx vitest run tests/state/workbench/layout/saved/layout-saved.test.ts tests/state/workbench/layout/saved/layout-unread.test.ts tests/state/client/terminal/terminal-close.test.ts`) |
| Verify 3, scratch runs | DONE | quoted above; `ls tests/state/workbench/layout` prints `armed-keep.client.test.ts layout-fixture.ts saved`, so the scratch file is gone |
| Verify 4, new or changed tests | DONE | the step adds, changes and deletes no test; `diff -rq .agents/worktrees/D57-base/tools/oculus/tests tests` prints nothing. No test of the suite asserted the rule as it was: `grep -rln "closeInstance\|removeTab\|KeepRule\|closePane\|splitInstance\|openBeside\|openNextTo\|openAway\|windowTab\|floatTab\|moveInstanceToPage\|transferInstance\|resetPage" tests` prints `tests/state/client/terminal/terminal-close.test.ts` and `tests/views/shared/explorer/opening-apps.test.ts`, and both pass after the change (`Test Files  2 passed (2)`, `Tests  13 passed (13)`) |
| Verify 5, prose read against `agents/spec.md` | DONE | see "Prose" below |
| Verify 6, `sh utils/folder-check.sh`, `wc -l`, unused exports | DONE | `folder-check exit=0`; `sh utils/unused-exports.sh \| diff - .agents/worktrees/D57-base/tools/oculus/unused-exports.txt` prints nothing (364 lines each); the step added no line, and `addedPane` has importers in `tree.ts`, `nested.ts` and `open/float/pages.ts` |
| ASCII gate | DONE | `LC_ALL=C perl -ne '...' $(find src tests config -type f ! -name local.yml)` printed nothing, `ascii gate exit=0` (the spec's command lists `bin`, which this tree does not have, so `bin` is left out of the `find`); `LC_ALL=C grep -n '[^ -~]' docs/window.md DESIGN.md` printed nothing |
| Page-only looks | NOT RUN, by rule | cases 1 to 4 on a scratch oculus with rail pages made from their arrangements; cases 5, 12 and 13 on TEST; see the before and after section |

The last full list, `npm run diagrams && npm run test:quick`, printed:

```
test:quick: 11 changed file(s), from git since HEAD
test:quick: 17 test file(s), 10 essential
ok      ASCII gate (1.0 s)
ok      prettier (2.4 s): All matched files use Prettier code style!
ok      svelte-kit sync (3.1 s)
ok      svelte-check (41.9 s): 1791545567234 COMPLETED 441 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (47.8 s): Duration  40.86s (transform 101.24s, setup 0ms, import 141.47s, tests 7.22s, environment 269ms)
ok      eslint (55.7 s)
test:quick: 56.8 s (limit 45.0 s); every command passed
test:quick: over the time limit
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
```

The full list ran 2 times; the lines above are the second run, which followed the last change. It took 56.8 s against its 45 s limit while other suites were running on this machine; every command passed. `diff -rq .agents/worktrees/D57-base/tools/oculus/docs docs` prints only `window.md`, so the regenerated diagrams equal the committed ones.

History-word grep over the lines the step added, `grep -inE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|\b[A-Z][0-9]{1,3}[a-z]?\b|20[0-9]{2}"` over the added lines of every changed file (made from `diff` against the base copy): three hits in comments, judged: `model.ts` "dragged onto it still goes in" is the `locked` sentence reflowed, it states what a lock allows and compares with no earlier state; `saved.ts` "is still the one the viewer left" is a reflowed sentence about the arrangement and compares with no earlier state; `registry.ts` "The tabs close before the registration goes" gives an order. The hits in `docs/window.md` are in sentences the step did not write ("shown before it"); the sentences it wrote contain none of the words. No package id or date was added.

## Terms

No glossary (`ls tools/oculus/docs` lists apps.md, configuration.md, debugging.md, diagrams, files-and-search.md, source-control.md, terminals.md, views.md, window.md).

## Files changed (`diff -rq .agents/worktrees/D57-base/tools/oculus/{src,docs,config,tests} and DESIGN.md`), line counts base to now

| File | Lines |
| --- | --- |
| `tools/oculus/src/lib/state/workbench/layout/tree.ts` | 541 to 537 |
| `tools/oculus/src/lib/state/workbench/layout/model.ts` | 295 to 309 |
| `tools/oculus/src/lib/state/workbench/layout/nested.ts` | 236 to 239 |
| `tools/oculus/src/lib/state/workbench/layout/open/float/pages.ts` | 422 to 424 |
| `tools/oculus/src/lib/state/workbench/layout/saved/saved.ts` | 700 to 705 |
| `tools/oculus/src/lib/state/workbench/layout/workbench.ts` | 80 to 81 |
| `tools/oculus/src/lib/state/workbench/layout/instances.ts` | 403 to 403 (comment only) |
| `tools/oculus/src/lib/state/workbench/layout.svelte.ts` | 825 to 823 |
| `tools/oculus/src/lib/state/workbench/navigation/registry.ts` | 225 to 224 (comment only) |
| `tools/oculus/docs/window.md` | 82 to 82 |
| `tools/oculus/DESIGN.md` | 586 to 586 |

Every changed path is in the brief's write list. The write list's `layout/index.ts`, `open/float/store.ts`, `open/landing.ts` and `config/layout.yml` line 44 are unchanged: `KeepRule` keeps its export, `createFloatOps` takes the same `KeepRule`, and the two comments are still true. The report file is the last path. All source files are under 880 lines (the largest, `layout.svelte.ts`, has 823) and `layout/` holds the same 10 items.

## Paragraphs and head comments the brief lists

| Place | Status |
| --- | --- |
| `docs/window.md:41` | rewritten |
| `docs/window.md:15` | rewritten (Explorer named with its five views) |
| `DESIGN.md:238` | rewritten |
| `tree.ts` comments of `KeepRule` and `keptPane` | rewritten; `removeTab` and `splitPane` comments updated |
| `tree.ts` comment of `closePane` | rewritten ("whatever the rule would keep of it") |
| `model.ts` comment of `repane` | rewritten (carries the mark) |
| `model.ts` comments of `Keeps` and `Pane` | `Keeps` still true; `Pane` rewritten (`added`) |
| `saved.ts` head comment | rewritten (`added`, floats); the comment at the refused page leaf rewritten ("empty added pane") |
| `workbench.ts` comment of `splitWith` | rewritten |
| `nested.ts` comments of `withoutLeaves` and `settlePageLeaves` | rewritten |
| `registry.ts:203-204` | rewritten |
| `instances.ts:83-84` | rewritten |
| `layout.svelte.ts:374-378` | rewritten |
| `open/landing.ts:30-35` and `config/layout.yml:44` | still true (they describe where an opened view lands and what `view: []` is; neither mentions what closes a pane) |
| `open/float/pages.ts` comments of `adoptFloats`, `floatPane`, `returnFloat` | rewritten |
| `docs/window.md:50` (a float disappears when its last tab goes) and `:54` (a locked pane keeps its place) | still true |

## Prose

The new `docs/window.md:41` text is one paragraph line as the file is written; it states the rule in six sentences. It lists the ways a pane is split off in one sentence because the brief asks for each of them to be named; the list is the sentence's only long part. `DESIGN.md:238` names `keptPane`, `added` and `KeepRule` and the three places that set the mark. The `registry.ts` comment gives the order and no reason, since the reason it had is gone. No sentence uses a negation-contrast, an em dash, a group of three padded to three or a history word.

## Judgment calls the brief left open (each reversible)

1. `KeepRule` is now `(view: ViewId) => 'documents' | Keeps`: the rule names the kind an emptied pane is left as and no longer says whether it stays. An absent rule means a host that is not a page (a float), whose pane is removed unless locked; `adoptFloats` takes the rule as a required argument.
2. `addedPane(pane)` in `model.ts` is the one place the mark is set; `splitPane`, `returnFloat` and `withoutLeaves` use it. `repane` carries the mark, and `floatPane` and the saved reader delete it from a float's pane with `delete pane.added` on an object they have just built.
3. A saved value of `added` that is not `true` (`false`, `"yes"`, `1`, `null`) reads as absent; the layout still reads (the `CASE 21 saved added=...` lines).
4. A terminals pane that is added and locked keeps all three: `keeps: 'terminals'`, `locked` and `added`.
5. `keptPane` takes the pane instead of the layout and a path, so it no longer scans the tree for other empty panes; `panes` is no longer imported in `tree.ts`.
6. Case 8 closes the New page's only tab (its Status tab) for the first part, since a page made by New page is one pane holding Status (`defaultWorkbench`); the second part opens a file there, which lands in a new added pane.

## Host- or user-visible changes, before and after, for the look on TEST and on a scratch oculus

| View and state | Before | After |
| --- | --- | --- |
| Focus page, made from its arrangement: open a project from a deadline row, close its tab | the pane the project opened in stays, empty | the pane is gone; the page is one pane holding Focus |
| Explorer page: close Files, Repositories, Search, TeX and Problems | the left pane is removed after the fifth | the left pane stays, an empty documents pane; the next file opens in it |
| Explorer page: empty both panes | only one empty pane stays | both stay |
| TEST: drag a tab to a pane's right edge, then back onto the first pane | the tab's pane stays if the view was opened for something | the new pane closes with its last tab |
| TEST: a pane split off, then Reload | the pane closes or stays by the view's kind | the pane is still split off, and closes with its last tab |
| TEST: Float a pane, then Return to Page, then close its tabs | the returned pane stays if its last tab was an opened view | the returned pane closes with its last tab |
| Sessions page: close the Terminal tab of the arrangement's pane | an empty terminals pane | the same |
| A browser holding a layout saved before this step | panes close by the view's kind | every pane reads as defined by the arrangement and stays when emptied; a pane split off before the step stays too until Close pane removes it once (decision 1) |

## Limitations and sharp edges I know of

1. A pane split off before this step reads as one the arrangement defined and stays when emptied, until Close pane removes it (ruled in decision 1).
2. After a split collapses into an added pane that is then the page's root, closing its last tab leaves the page one unmarked empty pane (case 9, as the brief states).
3. The rule for a pane of a page and the rule for a float are separate: a float whose last tab goes is removed by `writeHost`, not by `keptPane`.
4. The list ran over its time limit (56.8 s of 45 s) on a machine running other suites; no command failed.
5. Page-only behaviour (drag, reload of the real page, Return to Page drawn, the empty pane's text) is not verified here; the rows above name the look for each.

## Wrong or impossible in the brief

Nothing found. The spec's ASCII command lists `bin`, which this tree does not hold; the gate ran over `src`, `tests` and `config`.
