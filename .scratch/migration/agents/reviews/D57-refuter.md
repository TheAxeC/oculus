D57 refuter report

# Step D57 refuter report (on .agents/worktrees/D57, base 55d0ba416)

I found one finding, under Behaviour. Every item of "What to build" holds and every case is met. I changed nothing in the worktree: `git status --short` before and after the review lists the same 11 modified files plus the builder's report. My scratch tests lived only in the session scratchpad, in two copies of the tree (`scratchpad/base`, built from `.agents/worktrees/D57-base/tools/oculus`, and `scratchpad/after`, built from the worktree's `tools/oculus`). Both copies link the worktree's `node_modules` and leave out `config/local.yml`. No scratch file was ever placed in the worktree.

## Verification (rerun by the reviewer)

```
$ npm run diagrams            (from tools/oculus in the worktree; git status --short afterwards shows no new change)
$ npm run test:quick -- --base 55d0ba416
test:quick: 12 changed file(s), from git since 55d0ba416
test:quick: 17 test file(s), 10 essential
ok      prettier (10.9 s): All matched files use Prettier code style!
ok      ASCII gate (11.4 s)
ok      svelte-kit sync (27.8 s)
ok      eslint (44.0 s)
ok      vitest (54.8 s): Duration  36.81s (transform 112.52s, setup 0ms, import 130.94s, tests 4.71s, environment 219ms)
ok      svelte-check (39.4 s): 1791546133128 COMPLETED 441 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 67.9 s (limit 45.0 s); every command passed
test:quick: over the time limit

$ npx vitest run tests/state/workbench/layout/saved/layout-saved.test.ts tests/state/workbench/layout/saved/layout-unread.test.ts tests/state/client/terminal/terminal-close.test.ts
after the change (worktree):        Test Files  3 passed (3)   Tests  7 passed (7)
unchanged tree (scratchpad/base):   Test Files  3 passed (3)   Tests  7 passed (7)

$ sh utils/folder-check.sh                         -> folder-check exit=0
$ sh utils/unused-exports.sh | diff - <D57-base>/unused-exports.txt   -> diff exit=0 (364 lines in the base file)
$ wc -l: tree.ts 537, model.ts 309, nested.ts 239, workbench.ts 81, instances.ts 403, open/float/pages.ts 424, saved/saved.ts 705, layout.svelte.ts 823, navigation/registry.ts 224, docs/window.md 82, DESIGN.md 586; ls src/lib/state/workbench/layout | wc -l -> 10
$ LC_ALL=C perl -ne '<the spec's ASCII gate>' $(find src tests config -type f ! -name local.yml)   -> prints nothing, exit 0 (the tree has no bin folder: "ls: bin: No such file or directory")
$ LC_ALL=C grep -n '[^ -~]' docs/window.md DESIGN.md   -> prints nothing, exit 1

Commands the builder's report quotes, rerun:
$ diff -rq <D57-base>/tests tests                  -> prints nothing (the step adds, changes and deletes no test)
$ diff -rq <D57-base>/docs docs                    -> only docs/window.md differs (the regenerated diagrams equal the committed ones)
$ ls tests/state/workbench/layout                  -> armed-keep.client.test.ts layout-fixture.ts saved (the scratch file is gone)
$ grep -rln "closeInstance\|removeTab\|KeepRule\|closePane\|splitInstance\|openBeside\|openNextTo\|openAway\|windowTab\|floatTab\|moveInstanceToPage\|transferInstance\|resetPage" tests
  -> tests/state/client/terminal/terminal-close.test.ts, tests/views/shared/explorer/opening-apps.test.ts
$ npx vitest run <those two files>                 -> Test Files  2 passed (2)   Tests  13 passed (13)
$ grep -rn "keptPane" src                          -> tree.ts:178 (definition), tree.ts:194 (comment), tree.ts:203 (its one call), instances.ts:83 (comment): as the report says
History-word grep over the added .ts lines       -> the same three hits the report judges (model.ts "still goes in", saved.ts "is still the one the viewer left", registry.ts "before the registration goes"); no package id or date

My own additional runs:
$ npx vitest run tests/shell/panes/strip/tab-menu.test.ts tests/state/forms/manifest-draft.test.ts tests/state/sessions/source.test.ts tests/state/workbench/navigation/pages.test.ts tests/checks/config/config-folder.test.ts tests/checks/source/keys.test.ts
  -> Test Files  6 passed (6)   Tests  70 passed (70)
  (these are the store tests that close, split or float tabs and that test:quick does not select)
```

The builder's scratch file `d57-scratch.test.ts` is no longer on disk, so I could not rerun its command in the same form. I wrote three scratch files of my own: `r57-scratch.test.ts`, `r57-more.test.ts` and `r57-probe.test.ts`. They drive the store built through `createClientState` with `registerAll`. Rail pages come from `openRailPage` and the arrangements of `config/layout.yml`, and every pane is made by the product's own function. The files print and assert nothing that matters. I ran each with `npx vitest run tests/state/workbench/layout/<file> --silent=false --reporter=verbose` in both scratch copies. The lines it printed, unchanged tree then after the change:

```
C1 opened            row[(focus) | (project)]                      -> row[(focus) | (project;added)]
C1 closed            row[(focus) | (empty)]                        -> (focus)
C12 saved holds added: false                                       -> true
C12 closed after reload row[(focus) | (empty)]                     -> (focus)
C3 five closed       (empty)                                       -> row[(empty) | (empty)]
C3 file opened       (file)                                        -> row[(file) | (empty)]
C4 file closed       (empty)                                       -> row[(empty) | (empty)]
C6 A terminal closed row[(focus) | (empty;terminals)]              -> (focus)
C6 B arrangement terminal closed  ...col[(empty;terminals) | ...   -> same
C18 read             row[(projects,...) | (empty)]                 -> row[(projects,...) | (empty;added)]
C18 file closed      row[(projects,...) | (empty)]                 -> (projects,coauthor,archive,personal)
C21 page (focus) float (project); saved float pane added: undefined -> same
C13 returned         row[(focus) | (project)]                      -> row[(focus) | (project;added)]
C13 closed           row[(focus) | (empty)]                        -> (focus)
C23 adopted          (files,...) floats (hpc,usage)                -> row[(files,...) | (empty)] floats (hpc,usage)
M7 locked closed     row[(focus) | (empty;locked)]                 -> row[(focus) | (empty;added,locked)]
M27 unlocked         row[(focus) | (empty)]                        -> row[(focus) | (empty;added)]
M27 tab in and out   row[(focus) | (empty)]                        -> (focus)
M9 arrangement pane closed (project)                               -> (project;added)
M9 last tab closed   (empty)                                       -> (empty)
M16 maximised closed row[(focus) | (empty)] {"path":[1]}           -> (focus) null
M17 marked only tab moved row[(focus) | (empty)] || (status,project) -> (focus) || (status,project)
M20 windowTab marked row[(focus) | (empty)] floats 1               -> (focus) floats 1
M20 floatTab marked  row[(focus) | (empty)] floats 1               -> (focus) floats 1
M22 copy             row[(focus) | (project)] float (project)      -> row[(focus) | (project;added)] float (project)
M24 split bottom     col[(projects,...) | (coauthor)]              -> col[(projects,...) | (coauthor;added)]
M5 dragged back      (coauthor,projects,archive,personal)          -> same
M26 openNextTo settings closed (coauthor,projects,archive,personal) -> same, the pane was (settings;added) before the close
M25 float tab on edge -> row[(focus) | (project;added)] float gone true; M25 closed -> (focus)
P1 new page, file opened, its first tab closed: (file)             -> row[(empty) | (file;added)]
P2 Incoming, Calendar closed: (inbox,...)                          -> row[(inbox,...) | (empty)]
```

These runs give the same results as the builder's quoted runs for cases 1, 3, 4, 5, 6, 7, 9, 12, 13, 16, 17, 18, 20, 21, 22, 23, 24, 25, 26 and 27.

## Verdicts

Items of the brief's "What to build":

- 1: holds.
  - `added?: true` is on `Pane` at `model.ts:64` and is set only through `addedPane` (`model.ts:262`).
  - `addedPane` is used by `splitPane` (`tree.ts:395`), so every caller that splits through it gets the mark, by `returnFloat` (`pages.ts:404`) and by `withoutLeaves` (`nested.ts:175`).
  - `repane` carries the mark (`model.ts:254`), and `setLocked` spreads the pane. A collapse into the pane keeps it (M9 `(project;added)`).
  - `saved.ts:375` reads only `true`. `floatPane` (`pages.ts:236`) and `readFloat` (`saved.ts:609`) delete the mark, and `floatTab` and `copyTab` build float panes without it (`pages.ts:272`, `:296`).
  - Panes made from an arrangement, the root pane of a New page and the empty pane `removeNode` leaves at the root carry no mark (C3, P1, M9).
- 2: holds.
  - `keptPane` (`tree.ts:178-185`) removes an added pane unless it is locked, keeps every other page pane as a terminals or documents pane, and keeps a locked pane locked.
  - It no longer scans for other empty panes, so the cap of one empty pane is gone (C3, C4).
  - A float still goes through `leaveFloat`, which is unchanged. Close pane is unchanged.
  - `adoptFloats` now takes the rule (`pages.ts:128`, `:147`; C23).
- 3: holds.
  - `keptPane` has one call, in `removeTab`, and `removeTab` is the only path to it from `closeInstance`, `moveInstance`, `withoutTab`/`dropInstance`, `floatTab`/`windowTab`, `splitWith`, `carryToPage` and `adoptFloats`. Every page-side caller passes the store's rule through `keepFor`, `keep` or `keepRule`.
  - `KeepRule` is now `(view) => 'documents' | Keeps` (`tree.ts:170`), and the store's rule is `layout.svelte.ts:380`.
  - `openedRule` is still declared (`layout.svelte.ts:372`), set by `registerOpened` (`:818`) and read only by `createOpening` (`:385`) for landing. It has nothing to do with the removed keep rule, so no code reads a removed rule.
- 4: holds.
  - `docs/window.md:41` states the new rule and names every run-time source the brief lists. The two old sentences are gone.
  - `docs/window.md:15` names the five Explorer views.
  - `DESIGN.md:238` and the listed comments are rewritten, or still true as the report marks them; I re-read each one.
  - The text leaves out one category, a New page's first pane; see Behaviour 1.

Cases of the brief's "Cases":

- 1: met (C1).
- 2: met, by the report's run and by reading (an unmarked pane keeps `emptyPane()`), consistent with C4.
- 3: met (C3).
- 4: met (C4).
- 5: met (M24 and M5; the report's 5 B).
- 6: met (C6 A and B).
- 7: met (M7).
- 8: met (P1 first line and the report's case 8; `removeNode` of the root is unchanged).
- 9: met (M9).
- 10: met (C1 and M9 show the arrangement pane unmarked, holding its tab, after the collapse).
- 11: met, by the report's run and by reading. `pinTab`, `unpinTab`, `renameInstance` and the within-pane move all rebuild through `repane` (`tree.ts` lines 275, 291, 301, 327; `pinned.ts:28`, `:45`).
- 12: met (C12, and C23 for a layout saved without the mark).
- 13: met (C13).
- 14: met, by the report's run and by reading (`leaveFloat` at `pages.ts:319-331` is unchanged).
- 15: met, by the report's run and by reading (`arrangement.ts:43-50` makes unmarked panes).
- 16: met (M16).
- 17: met (M17; the report's 17 B).
- 18: met (C18).
- 19: met, by the report's run and by reading (`closePane` and `removeNode` are unchanged).
- 20: met (M20 windowTab and floatTab; the report's 20 B and C for the terminals pane).
- 21: met (C21; the report's saved-value lines).
- 22: met (M22).
- 23: met (C23).
- 24: met (M24 and the report's four edges).
- 25: met (M25; the report's 25 B).
- 26: met (M26; the report's 26 A to D).
- 27: met (M27).
- 28: met, by reading and by the guarded run.
  - The question's yes calls `closeInstance(id, deps.page())` at `close-question.svelte.ts:66`, and that goes through `keepFor` to `keptPane`.
  - `terminal-close.test.ts` passes on both trees.

## 1. Spec

none

## 2. Proof

none.

The builder's scratch command cannot be rerun in its own form because the file was removed as the brief requires. My own scratch runs above give the same outcomes for every case I reran. The test:quick timing (56.8 s in the report, 67.9 s in my run) is over its 45 s limit in both runs, every command passed in both, and no decision rests on the figure.

## 3. Standards

none

## 4. Behaviour

- 1. `src/lib/state/workbench/layout/tree.ts:180`, `if (!locked && (keep === undefined || pane.added === true)) return null;`, together with the report's section "Host- or user-visible changes, before and after".
  - What changes for the user: on a page made by New page, which includes TEST, the page the landing look runs on, the root pane now stays when its last tab closes beside an added pane.
    - Before, the root pane holds Status, a tool view, so it closed. Probe P1 on the unchanged tree: `(file)`.
    - After, it stays as an empty documents pane. P1 after the change: `row[(empty) | (file;added)]`.
  - This follows the brief: the root pane of a New page carries no mark, and an unmarked pane stays.
  - The report's before and after table leaves it out. Its only New page case (case 8) is the page's only pane.
  - `docs/window.md:41` sorts panes into "a pane the page's arrangement defines" and "a pane split off while the page is used". A New page has no arrangement, and its first pane was not split off, so a reader of the text cannot tell what happens to it.
  - Failure scenario:
    - At the look on TEST, the orchestrator opens a file (it lands in a new added pane) and closes the Status tab. An empty pane stays on the left. Nothing in the report predicts this, so it can be read as a defect of the step, or as the old cap rule failing.
    - A user on a New page sees the same empty pane, and the manual gives no rule for it.
  - Fix: add the row to the report's before and after, and add a clause to `docs/window.md:41` saying that the first pane of a page made by New page stays like an arrangement pane.
  - Verdict: no item or case is made violated. Item 4's text holds as the brief listed it, and the missing category is the gap this finding names.

## Declined to judge

- The new comment at `registry.ts:203`, "The tabs close before the registration goes.", states an order without a reason.
  - The keep rule no longer reads the registry, so the old reason is gone.
  - Whether the order still matters for some other cause (a frame in which the shell would draw a tab whose view is no longer registered) is not settled by reading `closeInstancesOfView` alone, and I did not trace the shell's render path.
- The page-only parts of the cases are the landing look's to check, and the brief assigns them there:
  - the drawn empty-pane text;
  - a real drag;
  - a reload of a real browser page;
  - the Focus page in Axel's own browser, where a pane split off before this step reads as an arrangement pane under ruling D57-1 (a).

Reviewer usage: agent id not known to the reviewer, served model claude-opus-5-5. Tokens, tool uses and minutes are not known to the reviewer; the orchestrator reads them from the completion notice.

## Repair round 1, refuted

Step D57, worktree `.agents/worktrees/D57`, base 55d0ba416, the round sent over the tree copied at `.agents/worktrees/D57-round0/tools/oculus`. I changed nothing in the worktree. `git status --short` gave the same list before and after `npm run diagrams`, and a shasum listing of `docs/` was identical before and after. My scratch copies and probe lived only under `$TMPDIR/d57r1` and are removed.

The round's delta, from `diff -rq --exclude=node_modules --exclude=.svelte-kit --exclude=local.yml D57-round0/tools/oculus D57/tools/oculus`, holds only two files: `docs/window.md` and `.scratch/migration/agents/reviews/D57-report.md`. The only change in `docs/window.md` is one added sentence on line 41, after "a tool view included.": "The first pane of a page made by New page stays the same way." No code, test or config file changed in the round.

```
$ npm run diagrams                      (from tools/oculus in the worktree)
  git status --short unchanged; docs/ shasums unchanged

$ npm run test:quick -- --base 55d0ba416
ok      prettier (15.0 s): All matched files use Prettier code style!
ok      ASCII gate (15.6 s)
ok      svelte-kit sync (42.5 s)
ok      eslint (63.5 s)
ok      vitest (73.7 s): Duration  44.96s (transform 129.75s, setup 0ms, import 154.92s, tests 5.14s, environment 569ms)
ok      svelte-check (56.6 s): 1791548773799 COMPLETED 441 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 99.8 s (limit 45.0 s); every command passed
test:quick: over the time limit
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them

$ npx vitest run tests/state/workbench/layout/saved/layout-saved.test.ts tests/state/workbench/layout/saved/layout-unread.test.ts tests/state/client/terminal/terminal-close.test.ts
  worktree:                          Test Files  3 passed (3)   Tests  7 passed (7)
  unchanged tree (copy of D57-base): Test Files  3 passed (3)   Tests  7 passed (7)

$ sh utils/folder-check.sh                                      -> folder-check exit=0
$ sh utils/unused-exports.sh | diff - <D57-base>/unused-exports.txt -> unused-exports diff exit=0 (364 lines in the base file)
$ wc -l: tree.ts 537, model.ts 309, nested.ts 239, workbench.ts 81, instances.ts 403, open/float/pages.ts 424, saved/saved.ts 705, layout.svelte.ts 823, navigation/registry.ts 224, docs/window.md 82, DESIGN.md 586; ls src/lib/state/workbench/layout | wc -l -> 10
$ LC_ALL=C perl -ne '<the rules file's ASCII gate>' $(find src tests config -type f ! -name local.yml) -> prints nothing, ascii gate exit=0 ("ls: bin: No such file or directory")
$ LC_ALL=C grep -n '[^ -~]' docs/window.md DESIGN.md           -> prints nothing, exit 1

Commands the round's report quotes as evidence, rerun:
$ diff -rq <D57-base>/tests tests        -> prints nothing, exit 0
$ ls tests/state/workbench/layout        -> armed-keep.client.test.ts layout-fixture.ts saved
$ diff -rq <D57-base>/docs docs          -> only docs/window.md differs
$ grep -rn "keptPane" src                -> instances.ts:83 (comment), tree.ts:178 (definition), tree.ts:194 (comment), tree.ts:203 (its one call)
$ grep -rln "closeInstance\|removeTab\|KeepRule\|closePane\|splitInstance\|openBeside\|openNextTo\|openAway\|windowTab\|floatTab\|moveInstanceToPage\|transferInstance\|resetPage" tests
  -> tests/state/client/terminal/terminal-close.test.ts, tests/views/shared/explorer/opening-apps.test.ts
$ npx vitest run <those two files>       -> Test Files  2 passed (2)   Tests  13 passed (13)
docs/window.md:41, read in place          -> holds "... a documents pane after any other tab, a tool view included. The first pane of a page made by New page stays the same way. A pane split off while the page is used closes with its last tab: ..."

My own probe, scratch copies of the worktree and of D57-base under $TMPDIR with the worktree's node_modules linked.
The store is built by createClientState + registerAll. Pages are made by layout.openPage (New page) and by closePage of every page.
$ npx vitest run tests/state/workbench/r57/r57-probe.test.ts --silent=false --reporter=verbose
  unchanged tree                              repaired tree
  P1 new page        (status)                 (status)
  P1 project opened  row[(status) | (project)] row[(status) | (project;added)]
  P1 status closed   (project)                row[(empty) | (project;added)]
  Q1 page "Page 1"   (status)                 (status)
  Q1 project opened  row[(status) | (project)] row[(status) | (project;added)]
  Q1 status closed   (project)                row[(empty) | (project;added)]
  (The probe asserts nothing. Vitest marks its two blocks failed with "expected any number of assertion, but got none", which is the config's assertion requirement and not a result.)
```

The builder's scratch command (`npx vitest run tests/state/workbench/layout/d57-scratch.test.ts ...`) cannot be rerun in the same form. The brief requires that file to be gone, and it is. The round changed no code, so the first refuter's runs of every case still apply to this tree.

My timing of test:quick (99.8 s) is not the report's (72.0 s). Both runs are over the 45 s limit and every command passed in both. No decision rests on the figure. I did not check the report's statement that the full list ran once in this round, and no decision rests on it.

### Verdicts

Items of the brief's "What to build", for the whole diff since the base:

- 1: holds.
  - `added?: true` is on `Pane` at `model.ts:64` and is set only through `addedPane` (`model.ts:262`).
  - The panes that get it: `splitPane` (`tree.ts:395`), `returnFloat` (`pages.ts:404`) and `withoutLeaves` (`nested.ts:175`).
  - `repane` carries it (`model.ts:254`), and `saved.ts:375` reads back only `true`.
  - `floatPane` (`pages.ts:236`) and `readFloat` (`saved.ts:609`) drop it from a float's pane.
  - A New page's root pane carries no mark: `newPage` at `model.ts:295` builds `defaultWorkbench()`, and probe P1 shows `(status)`.
- 2: holds.
  - `keptPane` (`tree.ts:178-185`) removes an added pane unless it is locked.
  - It keeps any other page pane, as a terminals pane or a documents pane.
  - It keeps a locked pane, locked.
  - The scan for other empty panes is gone.
  - `adoptFloats` takes the rule (`pages.ts:128`, `:147`).
- 3: holds.
  - `keptPane` has one call, at `tree.ts:203` in `removeTab`, per my `grep -rn "keptPane" src`.
  - `KeepRule` is `(view) => 'documents' | Keeps` (`tree.ts:170`).
  - The store's rule is at `layout.svelte.ts:380`.
- 4: holds.
  - `docs/window.md:41` states the rule and names each run-time source; the two old sentences are gone.
  - `docs/window.md:15` names the five Explorer views.
  - `DESIGN.md:238` and the listed comments are rewritten, per `git diff 55d0ba416`.
  - The round's sentence makes the text true for a New page's first pane; see the paragraph after the cases.
  - Behaviour 1 below names a page that the text still does not place.

Cases of the brief's "Cases" (the code is the round-0 code, per the `diff -rq` above, so the first refuter's runs stand; any case I reran is named):

- 1: met (first refuter C1; the code is unchanged in the round).
- 2: met (the report's run; reading: an unmarked pane keeps `emptyPane()`, `tree.ts:181`).
- 3: met (C3).
- 4: met (C4).
- 5: met (M24, M5; the report's 5 B).
- 6: met (C6 A and B).
- 7: met (M7).
- 8: met. The report's case 8 run, and reading: an unmarked root pane is kept by `keptPane`, and `removeNode` of the root returns `emptyPane()`. My P1 shows that a New page's root pane stays, empty, when its last tab closes beside an added pane.
- 9: met (M9).
- 10: met (C1, M9).
- 11: met (the report's run; reading: `repane` at `model.ts:254`).
- 12: met (C12; C23 for a layout without the mark).
- 13: met (C13).
- 14: met (the report's run; `leaveFloat` is unchanged).
- 15: met (the report's run; `arrangement.ts:43-50` makes unmarked panes).
- 16: met (M16).
- 17: met (M17; the report's 17 B).
- 18: met (C18).
- 19: met (the report's run; `closePane` and `removeNode` are unchanged).
- 20: met (M20; the report's 20 B and C).
- 21: met (C21; the report's saved-value lines).
- 22: met (M22).
- 23: met (C23).
- 24: met (M24; the report's four edges).
- 25: met (M25; the report's 25 B).
- 26: met (M26; the report's 26 A to D).
- 27: met (M27).
- 28: met. The guarded run passes on both trees (above), and the question's yes calls `closeInstance` through `keepFor` to `keptPane`.

**Is `docs/window.md:41` true of the code for a New page's first pane?** Yes.

- The New page button calls `openPage` (`layout.svelte.ts:494-495`), which calls `newPage(label)` (`model.ts:295`), whose pane carries no mark.
- "Stays the same way" points back to the sentence before it: the pane is left empty, a terminals pane after a Terminal tab and a documents pane after any other tab. `keptPane` (`tree.ts:180-182`) gives exactly that for an unmarked pane, and P1 shows it.
- "A pane split off while the page is used closes with its last tab", "A locked pane stays" and "A page keeps at least one pane" are all consistent with that pane.
- "The first pane" reads as the pane the page was made with. That pane can stop being the leftmost after a Split Left puts an added pane in front of it, and the sentence still holds for it.

**Closure checks.**

- Finding Behaviour 1 of the first run is closed by a change to the text and to the report's before and after table. No check was removed.
- The fix reaches nothing beyond the finding: the delta is the dictated sentence, word for word, plus the report.
- My P1 run reproduces the report's new row. Before: `(project)`, only the opened file's pane kept. After: `row[(empty) | (project;added)]`, the Status pane kept as an empty documents pane.

### 1. Spec

none

### 2. Proof

none

### 3. Standards

none

### 4. Behaviour

- `docs/window.md:41`, "The first pane of a page made by New page stays the same way.", read with `src/lib/state/workbench/layout.svelte.ts:534-535` (`if (left.length === 0) { savePages({ ...defaultPages(t('ui.page_default', 1)), floats: store.current.floats });`) and `:687-688` (`resetPages`, `pages.length === 0 ? { ...defaultPages(t('ui.page_default', 1)), floats }`).
  - What is wrong:
    - The page "Page 1" is made when the last page is closed, or when Reset all pages leaves no page. `defaultPages` builds it through the same `newPage(label)` (`model.ts:306-307`), so its first pane is unmarked and behaves exactly like a New page's.
    - My probe Q1 shows it. Before the change, the Status pane closed beside an opened project (`(project)`). After it, the Status pane stays as an empty documents pane (`row[(empty) | (project;added)]`).
    - Page 1 is not made by New page and has no arrangement. `docs/window.md:41` names the panes an arrangement defines, the first pane of a New page and the panes split off. A reader of the text cannot place Page 1's first pane.
    - The report's table of host- or user-visible changes has a row for New page (P1) and none for Page 1.
    - This is the same category as the first run's Behaviour 1. The round closed it for New page, as the dictated sentence asked, and Page 1 is left over.
  - Failure scenario: a user closes every page and is left on Page 1. The user opens a file, which splits off an added pane, and then closes the Status tab. An empty pane stays on the left. The manual's rule covers arrangement panes and a New page's first pane, so the user cannot tell whether this pane should have closed, and may read it as a defect.
  - Fix, small and inside item 4, for landing:
    - Widen the sentence, for example to "The first pane of a page made by New page, or of the Page 1 that closing the last page leaves, stays the same way."
    - Add a Page 1 row to the report's before and after table.
  - Verdict: no item or case is made violated. Item 4's text and case 8 hold as the brief wrote them.

### Declined to judge

- The first refuter's point on the comment at `registry.ts:203`, "The tabs close before the registration goes.", which states an order with no reason. The round brief did not send it, and the round did not touch the file. Whether the order matters for the shell's render path is not settled by reading `closeInstancesOfView` alone.
- The page-only parts of the cases (the drawn empty-pane text, a real drag, a reload of a real browser page, the Focus page in Axel's own browser). The brief assigns them to the look on landing.
- Whether "The first pane" will be read by some readers as the leftmost pane. That is a judgment on wording that Axel dictated word for word. In context it reads as the pane the page was made with.

Reviewer usage: agent id not known to the reviewer, served model claude-opus-5-5. Tokens, tool uses and minutes are not known to the reviewer; the orchestrator reads them from the completion notice.

## Closed

- First run, Behaviour 1 (a New page's first pane, not placed by `docs/window.md:41` and missing from the report's before and after): closed in repair round 1 by the sentence "The first pane of a page made by New page stays the same way." and the P1 row of the report, as the review over round 1 confirms.
- Round 1, Behaviour 1 (the Page 1 that closing the last page or Reset all pages leaves, not placed by the text): fixed at landing in the gate. `docs/window.md:41` now reads "The first pane of a page made by New page, or of the Page 1 that closing the last page or Reset all pages leaves, stays the same way." The before and after of probe Q1 goes into the booking and the landing report: on Page 1, a file opened beside the Status tab and the Status tab then closed kept only the file's pane before; after, the Status pane stays as an empty documents pane beside the file's pane.
- Declined to judge in both runs, the comment at `registry.ts:203` ("The tabs close before the registration goes."): read at landing. The keep rule at `layout.svelte.ts:379` reads only the view id and no longer the registry, so the order has no reason left, and the function's doc comment already says why the tabs close. Removed at landing as a comment that restated the code with no reason.
