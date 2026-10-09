# Step D53 refuter report (on .agents/worktrees/D53, base 82eaeace7)

A page this report cites is named with its section. A finding in code keeps its `file:line`, numbered as in the worktree.

## Verification (rerun by the reviewer)

```
$ cd .agents/worktrees/D53/tools/oculus && npm run diagrams; npm run test:quick -- --base 82eaeace7
diagrams exit 0
ok      prettier (11.7 s): All matched files use Prettier code style!
ok      ASCII gate (13.0 s)
ok      svelte-kit sync (19.0 s)
ok      eslint (11.4 s)
ok      vitest (39.6 s): Duration  31.48s (transform 88.72s, setup 0ms, import 104.37s, tests 3.46s, environment 441ms)
ok      svelte-check (33.4 s): 1791564806694 COMPLETED 444 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 54.0 s (limit 45.0 s); every command passed
test:quick: over the time limit
quick exit 0
(git status --short afterwards: same 26 modified files and the untracked report; the diagrams run changed nothing)

$ npx vitest run <the 12 paths of verify 2> --reporter=dot      (worktree)
 Test Files  14 passed (14)
      Tests  122 passed (122)
$ same, from $TMPDIR/d53-unchanged (diff -rq of src, tests, utils, config against .agents/worktrees/D53-base/tools/oculus: no difference, exit 0)
 Test Files  14 passed (14)
      Tests  122 passed (122)

$ npx vitest run --config $TMPDIR/d53-scratch/vitest.config.mts   (worktree; the builder's harness, read and rerun as is)
38 lines "AS EXPECTED", 0 "DIFFERS", Tests 30 passed (30); every line matches the report's "after the change" block apart from the random uuids
$ npx vitest run --config $TMPDIR/d53-scratch-unchanged/vitest.config.mts   (from $TMPDIR/d53-unchanged)
13 "AS EXPECTED", 25 "DIFFERS", Tests 30 passed (30); the same split per case as the report's first run

$ sh utils/folder-check.sh            -> folder-check exit 0
$ sh utils/unused-exports.sh | wc -l  -> 364 (base file: 364)
$ diff <base unused-exports.txt> <now>
202c202
< src/lib/state/workbench/layout/nested.ts: containsPage, embeddable, drawnBy
---
> src/lib/state/workbench/layout/nested.ts: containsPage, embeddable
$ git diff 82eaeace7 --name-only | xargs env LC_ALL=C grep -n '[^ -~]'   -> grep exit 1 (no non-ASCII)
$ wc -l: layout.svelte.ts 875, open/float/pages.ts 626, opening.ts 393, away.ts 122, drag.svelte.ts 488, Catalogue.svelte 309, ActivityRail.svelte 363, context.ts 859, tab-menu.ts 304
$ ls layout | wc -l, ls layout/open | wc -l -> 10, 10 (report's figure, reproduced by folder-check)
$ grep -rln "unique: true" src -> exactly the ten registration files

Reviewer's own probes ($TMPDIR/d53-refute/probe.test.ts, the builder's harness, worktree):
PROBE A: id=hi page1 focus={"path":[0]} | page1(screen)(max 0)=row([*files#f1], <page page2>) ; page2=[*history#hi findings#fi]
PROBE B: page1 folded=[1] | page1(screen)=row([*files#f1], <page page2>) ; page2=[*history#hi findings#fi]
PROBE C: ... after <id>(screen)=[] ; float new=[status#new *hpc#new usage#new] count status=1
PROBE D: holder=sys entry=...{"id":"st","view":"status","state":{"k":1}}...   (the pin is dropped, the state is kept)
PROBE E: holder s1=sys holder s2=null count=1
PROBE F: page1(screen)=row([*files#f1], [*status#hld]) ; sys=[*catalogue#cat] count=1
PROBE G: p=[*files#f1] ; <id>(screen)=[*usage#us] ; float fl=[*hpc#hp]
```

## Verdicts

Items of the brief's "What to build":

- 1: holds. The `unique?: boolean` field and its comment are at `registry.ts:102-107`. Only the ten registrations carry `unique: true` (grep). `registerComponent` spreads the whole registration (`registry.ts:199`), and `registrationOfApp` (`routes/views.ts:101-113`) sets no `unique`.
- 2: holds. The `registerUnique` call is at `context.ts:765`. `uniqueRule` reaches `createOpening`, `createAway` and `builds` (`layout.svelte.ts:404-446`).
- 3: violated, Spec 1 and Behaviour 1. The search order, the switch to another page, the float branch, restate and the maximise and fold handling all hold for a holder page the screen does not draw (cases 1, 3, 5, 6, 19, 20, 23 and X5). For a holder page drawn in a page leaf of the page on screen, the outer page's maximised pane and folded child are left as they are, so the tab is not shown (probes A and B).
- 4: holds. Cases 11 to 16, 24 and 25, X1 to X4, and probes C, E and G give the builds. `adoptFloats` is unchanged. `forgetTabs` in `resetPages` covers only rebuilt pages, removed pages and held floats, and moved instances come only from kept pages (`apart` in `resetAll`). That `resetPage` forgets only the old page's tabs is read at `layout.svelte.ts:699-700`.
  - Judgment call 3 is accepted: probe C shows the reader-visible result the brief states (the default page is an empty pane and the float holds Status).
  - Judgment call 2 is accepted: probe D shows the pin dropped and the state kept, consistent with `pinnedAt` (`tree.ts:355-362`, "a drop decides the pin"). The report states it.
  - The builders in `open/float/pages.ts` instead of `tree.ts` or `instance.ts` are accepted. They call `floatsFrom` and `dropInstance` of `pages.ts`, and `pages.ts` imports `tree.ts` and `instance.ts`, so either named file would import in a cycle. The report names the departure.
  - `layout.svelte.ts` at 875 lines is within the brief's 880.
- 5: holds. Case 17 runs through `layout.copiesToWindow`. `copyTabToWindow` refuses as well (`layout.svelte.ts:823-824`).
- 6: holds. Case 10 covers a centre drop, probe F an edge drop and case 22 a drop on the catalogue's own pane.
- 7: holds. Read at `Catalogue.svelte:107-128`, where `showTarget(view)` returns for a held unique view, and at `ActivityRail.svelte:166-174`. The harness copies of both give cases 6, 20 and 21.
- 8: holds. Nothing under `layout/saved/` changed, and case 18 and X5 keep two copies and open the first in item 3's order.
- 9: violated, Standards 1 and 2. Three sentences of the new or rewritten text are false.
- 10: holds. The sizes and folder counts are above, and `folder-check` exits 0.

Cases of the brief's "Cases". Cases 1, 3, 10, 11, 12 and 21 are judged on their store side; what the reader sees is left to the landing look.

- 1: met on the store side (CASE 1).
- 2: met (CASE 2).
- 3: met on the store side (CASE 3).
- 4: met as stated (CASE 4). The same case with the outer page maximised or folded fails; see Spec 1.
- 5: met (CASE 5).
- 6: met. "6 rail" checks the given state. "6 language" uses exactly the call `palette-source.svelte.ts:96` makes, `openView(SETTINGS_VIEW, undefined, currentPage().id)`, and that function puts the query on the id answered.
- 7: met (CASE 7).
- 8: met (CASE 8).
- 9: met (CASE 9, both items).
- 10: met on the store side (CASE 10, held and not held), through `client.drag`.
- 11: met on the store side (CASE 11, held and not held).
- 12: met on the store side (CASE 12, same id `st`).
- 13: met (CASE 13, held and not held).
- 14: met (CASE 14).
- 15: met (CASE 15, fresh and keepDefault).
- 16: met (CASE 16).
- 17: met (CASE 17, through `layout.copiesToWindow`, app and browser).
- 18: met (CASE 18).
- 19: met (CASE 19).
- 20: met (CASE 20).
- 21: met on the store side. The run goes through the harness's copy of the new `Catalogue.svelte` logic; the component click itself is the look's.
- 22: met (CASE 22).
- 23: met (CASE 23). The harness passes the float's id as the page. `openInto` (`opening.ts:146-154`) reaches the same branch when `attention.touched()` answers the float.
- 24: met (CASE 24).
- 25: met (CASE 25).

## 1. Spec

- `src/lib/state/workbench/layout/open/opening.ts:332-345`, `showHeld`:
  ```
  const base = shownAt(focusedPane(bench), at) ? bench : restore(bench);
  ...
  access.apply({ ...base, root: activate(expandTo(stated, at), instance.id) }, host.id);
  if (!holder.drawn) { ... }
  ```
  - What is wrong: `restore` and `expandTo` act only on the holder page's own workbench. When the holder is a page drawn in a page leaf of the page on screen (`holder.drawn` true), a maximised pane of the page on screen that is not the leaf stays maximised, and a folded child of the page on screen that holds the leaf stays folded. Item 3 asks for "A pane hidden in a folded child is expanded, and a maximised pane that is not the one holding it is restored first ... so the tab shows". The report's first line, "Everything in the brief is done", is therefore not true.
  - Failure scenario (probe A): Page 1 is `row([files], <page page2>)` with pane [0] maximised, and Page 2 holds History. The status bar or the catalogue opens History. The call answers `hi` and activates it inside the hidden leaf, Page 1 stays `(max 0)`, and the reader sees nothing happen. Probe B is the same with the page leaf folded (`folded=[1]` after the open). On the base, `openInto` opened a visible second History in the maximised pane (base `opening.ts`, `findIn` inside the focused pane, read).
  - Verdict: item 3 violated.

## 2. Proof

none.

The cases' first run is quoted for every case and reproduced by the reviewer. No test was added or changed. The verify 2 counts and the unused-exports diff reproduce. The report's 56.5 s for `test:quick` is 54.0 s here, and no decision rests on that figure.

## 3. Standards

- `tools/oculus/docs/window.md:35` (the new paragraph after Pages): "Files, Search, Terminal and the session views are not unique and open as many times as you ask." and "A pane hidden by a maximised pane or folded away is shown, so the tab is seen."
  - What is wrong: the first sentence is false. On a page that already holds Files, opening Files activates the existing tab (`openInto`, `findView`; the same doc's line 21 says "A view already open on that page is activated where it is rather than opened twice"). The second sentence is false for a holder page drawn in a leaf (Spec 1).
  - The rule broken: `agents/spec.md`, "What every package obeys", the rule that a sentence a change makes false is a defect.
  - Failure scenario: a reader presses Files twice on one page, expecting two tabs, and gets one. A reader with a maximised pane opens History held in a drawn page and is told the tab is shown.
  - Verdict: item 9 violated.
- `config/text/views/system/workbench.yml:106` (`reset_all_tip`): "Pages of your own keep their tabs, except a unique view a rail page names, which moves to that page."
  - The same omission is in `src/lib/views/system/workbench/PagesReset.svelte:8-10` ("except a unique view that a rail page's arrangement names, which moves to that page") and in `docs/window.md:33` ("except that a unique view an arrangement names moves to the page made from it").
  - What is wrong: Reset all also moves a unique view out of a page of the reader's own into a shipped float (case 13 held: Usage leaves `own` for the float). No rail page names Usage, so the three texts say that tab stays. The layout store's own `resetPages` comment (`layout.svelte.ts:223-226`) says "the page or float made from it", which is the true form.
  - The brief's item 9 dictated the wording for the tip and the head comment, so this is a gap in the brief's dictated text that the builder carried over. The rule broken is the same as above.
  - Failure scenario: a reader with Usage on their own page reads the tip, confirms Reset all, and finds Usage gone from that page and in the float.
  - Verdict: item 9 violated.
- `src/lib/state/workbench/layout/open/float/pages.ts:124` and `:133`:
  ```
  function floatsFrom(specs: FloatSpec[], settle?: (pane: Pane) => Layout): Float[]
  const settled = settle === undefined ? pane : settle(pane);
  ```
  - The same applies to the defaults `unique: UniqueRule = () => false` on `createOpening` (`opening.ts:89`) and `createAway` (`away.ts:48`).
  - What is wrong: all three callers of `floatsFrom` pass `claims.settle` (grep: lines 248, 257 and 310). The one caller of each factory passes the rule (`layout.svelte.ts:421-446`), and the brief check found no test calling either factory. So the optional parameter, its `undefined` branch and the two defaults have no caller.
  - The rule broken: `agents/spec.md`, "The principles every package is judged on", YAGNI, and refute's "code larger than its job".
  - Failure scenario: a maintainer reads the `settle === undefined` branch as a supported call shape and adds a `floatsFrom(specs)` call. That call builds shipped floats that copy a held unique view, which item 4 forbids. Low cost.

## 4. Behaviour

- `src/lib/state/workbench/layout/open/opening.ts:332-345`, the same hunk as Spec 1.
  - What is wrong: there is a host-visible change the report's "Visible changes" does not state. Opening a unique view held by a page that is drawn in a page leaf hidden by the outer page's maximised pane or folded child now shows nothing; before, a second instance opened visibly. Visible change 1 states only case 4's state, where nothing hides the leaf.
  - Failure scenario: probes A and B.
  - Verdict: item 3 violated, with Spec 1.
- Report, "Visible changes, before and after", item 4: "a view the arrangement names, held elsewhere, moves into the page made from it (cases 12, 13, ...)".
  - What is wrong: Reset all also moves Usage or HPC from a page of the reader's own into the shipped float. That is a change the reader sees on their own page, and the report states it only as a move into a page.
  - Failure scenario: the look at landing checks the rail pages after Reset all and does not check the reader's own page, which has lost its Usage tab.

## Declined to judge

- What the reader sees for cases 1, 3, 10, 11, 12 and 21 (a click, a drop and the page on screen in a browser): this is the landing look's, by the brief and the rules file.
- Whether `layout.svelte.ts` at 875 of 880 lines blocks D56: D56's brief is not written. The report names the risk, and the step itself complies.
- G54's own test (`tests/checks/config/arrangements.test.ts`): not run. One foreground attempt passed its 180 s limit with no output and was stopped; no process was left (`ps`). `config/layout.yml` and `parseArrangement` are unchanged (not in `git diff 82eaeace7 --name-only`), so the parse half of G54 is untouched by the diff. The "opens what its arrangement names" half is judged above from cases 12, 13, 14, 15 and 25 and probe G. It runs at landing under `npm run test:landing`.
- Whether Settings, which can hold form edits, loses unsaved text when a reset moves it: the moved instance keeps its id, so its ui state under that id is kept (`createClaims.settle` and `renameInstance`, read). Not run.

Reviewer usage: agent id and token count are not visible to me; about 60 tool uses; minutes not verified.

## Repair round 1, refuted

```
$ (scratch copy of the worktree's tools/oculus at $TMPDIR/d53r1rev/tree, node_modules linked) npm run diagrams
diagrams exit 0
$ diff -rq $TMPDIR/d53r1rev/tree/docs/diagrams .agents/worktrees/D53/tools/oculus/docs/diagrams   -> exit 0 (no difference; the worktree's diagrams are what its source makes)
$ diff -rq .agents/worktrees/D53-round0/tools/oculus/docs/diagrams docs/diagrams                    -> exit 0

$ cd .agents/worktrees/D53/tools/oculus && npm run test:quick -- --base 82eaeace7
ok      svelte-kit sync (4.1 s)
ok      prettier (4.1 s): All matched files use Prettier code style!
ok      ASCII gate (4.2 s)
ok      eslint (35.6 s)
ok      vitest (46.9 s): Duration  41.64s (transform 97.53s, setup 0ms, import 123.92s, tests 3.09s, environment 195ms)
ok      svelte-check (47.4 s): 1791567327222 COMPLETED 444 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 51.7 s (limit 45.0 s); every command passed
test:quick: over the time limit
quick exit 0
(git status --short afterwards: 27 lines, the 26 modified files and the untracked report, as before the run)

$ npx vitest run <the 12 paths of verify 2> --reporter=dot      (worktree)
 Test Files  14 passed (14)
      Tests  122 passed (122)
$ same, from $TMPDIR/d53-unchanged (diff -rq of src, tests, utils, config against .agents/worktrees/D53-base/tools/oculus: no output)
 Test Files  14 passed (14)
      Tests  122 passed (122)

$ diff -ru (excluding node_modules, .svelte-kit, .scratch, build, local.yml) D53-round0/tools/oculus D53/tools/oculus
7 files: DESIGN.md, config/text/views/system/workbench.yml, docs/window.md, layout/open/away.ts, layout/open/float/pages.ts, layout/open/opening.ts, views/system/workbench/PagesReset.svelte
$ diff -rq --exclude=... .agents/worktrees/D53-round0/tools/oculus $TMPDIR/d53-round0   -> exit 0 (the builder's round-0 copy is the read-only copy)

Reviewer's own copies of the builder's harness ($TMPDIR/d53r1rev/{round0,after,unch}, configs pointing include at those folders):
$ cd $TMPDIR/d53-round0 && npx vitest run --config $TMPDIR/d53r1rev/round0/vitest.config.mts --reporter=default | grep -E "^CASE|FAIL|Tests |rror"
CASE PROBE A: DIFFERS | id=hi page1: focus={"path":[0]} folded=[] | page1(screen)(max 0)=row([*files#f1], <page page2>) ; page2=[*history#hi findings#fi]
CASE PROBE B: DIFFERS | id=hi page1: focus=null folded=[1] | page1(screen)=row([*files#f1], <page page2>) ; page2=[*history#hi findings#fi]
CASE PROBE C: DIFFERS | id=hi page1: focus={"path":[0]} folded=[] ; page2: focus={"path":[0]} folded=[1] | ...
CASE PROBE D: AS EXPECTED | id=hi unchanged=true
CASE PROBE E: AS EXPECTED | id=hi page1: focus=null folded=[] ; page2: focus=null folded=[]
cases, X1 to X5 and probes A to E: 40 AS EXPECTED, 3 DIFFERS (A, B, C), as the report says
$ cd .agents/worktrees/D53/tools/oculus && npx vitest run --config $TMPDIR/d53r1rev/after/vitest.config.mts ...
CASE PROBE A: AS EXPECTED | id=hi page1: focus=null folded=[] | page1(screen)=row([*files#f1], <page page2>) ; page2=[*history#hi findings#fi]
CASE PROBE B: AS EXPECTED | id=hi page1: focus=null folded=[] | ...
CASE PROBE C: AS EXPECTED | id=hi page1: focus=null folded=[] ; page2: focus=null folded=[] | ...
43 AS EXPECTED, 0 DIFFERS; the 43 lines, sorted and with uuids masked, are identical to the report's "After the change" block (diff exit 0)
$ cd $TMPDIR/d53-unchanged && npx vitest run --config $TMPDIR/d53r1rev/unch/vitest.config.mts ...
Tests 30 passed (30); 13 AS EXPECTED, 25 DIFFERS; identical to the report's first-run block with uuids masked (diff exit 0)

Reviewer's probes ($TMPDIR/d53r1rev/*/reviewer.test.ts), round-0 copy then worktree:
R1 page1 (max 0) draws page2 and page3, page3 folded over a leaf of page4, page4 holds History:   DIFFERS -> AS EXPECTED (p1 focus=null, p3 folded=[], page2 untouched, page1 on screen)
R2 keyboard focus in a float (openView('history', undefined, 'fl')), holder in a leaf under a maximised pane: DIFFERS -> AS EXPECTED (p1 focus=null, float fl=[*hpc#hp], one History)
R3 leaf inside a folded inner split, outer pane maximised:   DIFFERS -> AS EXPECTED (p1 focus=null, inner folded=[])
R4 saved loop page1<->page2, holder page3:                   AS EXPECTED both (load replaces both loop leaves by empty panes: page1=row([*files#f1], []) ; page2=row([*files#f2], []); page3 shown)
R5 outer page maximised over the leaf and holder page maximised elsewhere: DIFFERS -> AS EXPECTED (p1=null p2=null)
R6 catalogue openAway and openNextTo of History held in a hidden leaf: DIFFERS -> AS EXPECTED (both answer hi, p1 focus=null, one History)
Text probes, worktree only:
T1 page1=row([files f1],[search s1]) maximised [1]; openView('files'):  files=2 | page1(screen)(max 1)=row([*files#f1], [search#s1 *files#new])
T2 page1=[files f1], float fl=[hpc]; openView('files', undefined, 'fl'): files=2 | page1(screen)=[*files#f1] ; float fl=[hpc#hp *files#new]
T3 own + sys (rail views), reader's float fl=[status#stf {k:1}]; resetPages(rail, shipped): status=1 | ... sys=row(..., [*status#new findings#new ...]) ; float new=[*hpc#new usage#new]

$ sh utils/folder-check.sh            -> folder-check exit 0
$ sh utils/unused-exports.sh | wc -l  -> 364 (base file: 364)
$ diff <base unused-exports.txt> <now>
202c202
< src/lib/state/workbench/layout/nested.ts: containsPage, embeddable, drawnBy
---
> src/lib/state/workbench/layout/nested.ts: containsPage, embeddable
$ ls layout | wc -l ; ls layout/open | wc -l   -> 10 ; 10
$ git diff 82eaeace7 --name-only | xargs wc -l (top): layout.svelte.ts 875, context.ts 859, pages.ts 626, DESIGN.md 587, drag.svelte.ts 488, opening.ts 447
$ git diff 82eaeace7 --name-only | xargs env LC_ALL=C grep -n '[^ -~]'   -> exit 1 (no non-ASCII)
$ (24 files of diff -rq against D53-base) xargs npx prettier --check -> "All matched files use Prettier code style!", exit 0; eslint over the .ts/.svelte among them -> exit 0
$ grep -rn "floatsFrom(\|createOpening(\|createAway(" src tests   -> the 8 lines the report quotes, verbatim
$ grep -rn "createOpening\|createAway\|floatsFrom" tests           -> exit 1 (no test calls them)
$ grep -rn "leaf.page ===\|walk(leaf.page)\|pageLeaves(" src/lib
  prints nested.ts:33 and opening.ts:104, :105 beside the six lines the report quotes; the report's block is a filtered copy. The decision it supports (no existing function returns the chain of leaves) holds by reading nested.ts: showsPage and drawnBy answer reachability only, withoutPage removes leaves.
$ grep -rn "\bleavesTo\b\|\bshowLeaf\b" src tests   -> opening.ts:92, :365, :385, :386 only (both local)
$ grep -n "git " D53-report.md -> no line; LC_ALL=C grep -n '[^ -~]' D53-report.md -> no line
State file "Open items" (orchestrator-state.md, main checkout, read now): heading and its one paragraph, no item; the report's copy matches it.
```

### Verdicts

Items of the brief's "What to build", over the whole diff since 82eaeace7:

- 1: holds. `unique?: boolean` with its comment on `Registration`; `grep -rln "unique: true" src` gives the ten registration files only (first run); the round did not touch it.
- 2: holds. `registerUnique` at `context.ts:765`; the rule reaches `createOpening`, `createAway` and the builds (`layout.svelte.ts:419-439`), now a required argument of both factories.
- 3: holds. Spec 1 of the first report is closed: probes A, B, C and the reviewer's R1, R2, R3, R5, R6 all show the hiding maximised pane restored and the folded child expanded in each page between the page on screen and the holder, with the page on screen kept and one instance; probe D shows a page nothing hides is not rewritten. Cases 1 to 6, 19, 20, 23 rerun met.
- 4: holds. Cases 11 to 16, 24, 25 and X1 to X4 rerun met; the round changed only `floatsFrom`'s signature, whose three callers pass `claims.settle`.
- 5: holds. Case 17 rerun met (`copiesToWindow(se)=false menu(settings)=move/no-copy`).
- 6: holds. Cases 10 and 22 rerun met.
- 7: holds. Cases 6, 20 and 21 rerun met through the harness copies of `Catalogue.svelte` and `ActivityRail.svelte`.
- 8: holds. Case 18 and X5 rerun met.
- 9: violated, Findings 1 and 2. The round's ruling 2 and ruling 3 texts and the leaf sentence are true to the code. However, a sentence on ordinary views, at line 35 and at line 21, is false while a pane is maximised. A second sentence, on what Reset all takes from a float, is also false.
- 10: holds. folder-check exit 0; every changed source file at or under 880 lines, every component at or under 520; `layout/` and `layout/open/` at 10 items.

Cases of the brief's "Cases": every case is met on the store side by the rerun above (the 38 case lines and X1 to X5 identical to the report). What the reader sees for 1, 3, 10, 11, 12 and 21 is the landing look's.

- 1: met (store side). 2: met. 3: met (store side). 4: met, and also with the outer page maximised or folded (probes A, B, C, R1 to R3). 5: met. 6: met (rail and language). 7: met. 8: met. 9: met (beside and here). 10: met (store side, held and not held). 11: met (store side). 12: met (store side, same id `st`). 13: met (held and not held). 14: met. 15: met (fresh and keepDefault). 16: met. 17: met (app and browser). 18: met. 19: met. 20: met. 21: met (store side, click and shift). 22: met. 23: met. 24: met. 25: met.

Closures claimed by the builder, checked for the three things the skill names:
- Ruling 1 (Spec 1, Behaviour 1): closed by a change to `showHeld` (`opening.ts:383-388`, `leavesTo` 92-111, `showLeaf` 365-370), not by removing a check. Every requirement of the ruling is met: the maximised pane is restored and the folded child expanded in the page on screen, and in each page between it and the holder when leaves nest (C, R1). Probes A and B are quoted on the round-0 copy and after, and reproduce. Every case and X1 to X5 were run again and reproduce. Nested leaves, sibling branches, a folded inner split, a float as the opener's host and the catalogue's openAway/openNextTo paths all reproduce (R1 to R3, R5, R6).
  - A cyclic leaf cannot reach `leavesTo` at run time: `settlePageLeaves` clears both leaves of a loop on load (R4 output, `saved.ts:569`), and `embedPage` refuses one (`embeddable`). `leavesTo`'s `seen` set still ends the walk, as `showsPage` does.
  - A holder drawn in a float cannot exist: a float holds one `Pane` (`model.ts:126`, `Float = { id; pane: Pane; place }`), `embedPage` refuses a float host because `embeddable` requires the host among the pages, and a saved float is read only as `kind: 'pane'` (`saved.ts:607-608`).
- Ruling 2 (Standards 1): the sentence is written in the words the ruling gave, and the leaf sentence is true after ruling 1. However, the ruling's own clause "opening one on a page that already holds it activates it there" is false under a maximised pane; see Finding 1.
- Ruling 3 (Standards 2, Behaviour 2): `reset_all_tip`, the `PagesReset.svelte` head comment and `docs/window.md:33` each changed in that clause only (delta read), and they match `resetAll` (`pages.ts:286-321`) and case 13 held.
  - The builder also added a floats clause to line 35, the same omission in the next sentence. It is not a fix beyond the finding, but it carries Finding 2.
- Ruling 4 (Standards 3): closed. `settle` is required and its branch is gone; `unique` has no default in either factory; the caller grep is quoted and reproduces. One default of the same kind is left; see Finding 3.
- Ruling 5: the report is rewritten whole. Visible changes 2 and 6 give the two required before-and-after entries, and no git command is named.

### Findings

- `tools/oculus/docs/window.md:35`: "Files, Search, Terminal and the session views are not unique: several pages and floats may hold one at once, and opening one on a page that already holds it activates it there." The same claim is at `docs/window.md:21`: "A view already open on that page is activated where it is rather than opened twice."
  - What is wrong: while another pane of the page is maximised, `openInto` looks only in the maximised pane (`opening.ts:201-207`, `findIn`, whose comment states the rule) and opens a second instance there. Probe T1 shows `page1(screen)(max 1)=row([*files#f1], [search#s1 *files#new])`, files=2. With the keyboard focus in a float, the same open makes a second Files in the float (T2).
  - Ruling 2 dictated the clause "as line 21 says". Brief item 9 asked that every sentence of line 21 be made true for an ordinary view. No sentence of `docs/window.md` states the maximised exception (`grep -o "[^.]*maximis[^.]*\."` over window.md, views.md, HELP.md).
  - Heading: standards (`agents/spec.md`, "What every package obeys": a sentence a change makes false is a defect of the change).
  - Failure scenario: a reader maximises the Search pane on a page whose other pane holds Files, presses the Files entry in the catalogue or its key, and gets a second Files tab in the maximised pane, where the guide told them the existing one would be activated.
  - Verdict: item 9 violated. The fix is small and inside the brief: one clause in each of the two sentences naming the maximised pane.
- `tools/oculus/docs/window.md:35`: "A page made from its arrangement (the first press of its rail button, Reset, Reset all pages) takes a unique view the arrangement names from the page or float that holds it, with its state, ... and the floats Reset all pages makes take a unique view they name in the same way".
  - What is wrong: `resetAll` takes a held unique view only from a kept page. Its `createClaims` `apart` set holds every rebuilt and removed page and every held float (`pages.ts:300-301`, `:195`), and its comment says "is moved in from a kept page". A unique view in a float the reader has, or in another rail page being rebuilt, is closed with that host, and a new instance with no state is made. Probe T3 shows the reader's floated `status#stf` (state `{k:1}`) replaced by `status#new` on the System page. Case 13 shows the System page's own `settings#se` replaced by `settings#new`.
  - The clause "from the page or float that holds it, with its state" is round-0 text. The round added "the floats Reset all pages makes take a unique view they name in the same way", and those floats never take from a float.
  - Heading: standards (same rule as above).
  - Failure scenario: a reader floats Status or Settings, runs Reset all pages expecting that tab and its state to move onto the System page as the guide says, and finds a fresh tab while the floated one is gone. The confirm asks about unsaved text first, so no draft is lost silently.
  - Verdict: item 9 violated. The fix is small and inside the brief: "from a page of your own" for Reset all pages, in the words of `resetAll`'s comment.
- `tools/oculus/src/lib/state/workbench/layout/open/opening.ts:122-123`:
  ```
      opened: (view: ViewId) => boolean = () => false,
      unique: UniqueRule
  ```
  - What is wrong: with `unique` now required after it, `opened`'s default applies only to a caller that passes `undefined` explicitly. The one caller passes a function (`layout.svelte.ts:423`), and no test calls `createOpening` (grep exit 1). This is the default ruling 4 removed from `unique`, left on the parameter before it. The default is the base's own (base `opening.ts:60`), but the round made it a defaulted parameter before a required one.
  - Heading: standards (`agents/spec.md`, "The principles every package is judged on", YAGNI; refute's "code larger than its job").
  - Failure scenario: a maintainer reads the default as a supported call shape and writes `createOpening(access, attention, keep)`. That no longer type-checks, so the default misleads at no runtime cost. Low cost. The fix at landing drops `= () => false`.
  - No verdict.

### Declined to judge

- What the reader sees for cases 1, 3, 10, 11, 12 and 21, and the clicks of `Catalogue.svelte` and `ActivityRail.svelte`: the landing look's, by the brief.
- G54's own test (`tests/checks/config/arrangements.test.ts`): not run. It is under `tests/checks`, which `test:quick` does not run, and it runs at landing under `npm run test:landing`. `config/layout.yml` is not in `git diff 82eaeace7 --name-only`.
- The wording of the fixes for Findings 1 and 2: the orchestrator's at landing.
- The `test:quick` time (51.7 s here, 68.0 s in the report, against a 45.0 s limit): every command passed and no decision of this step rests on the figure. The machine's load was not measured.

Reviewer usage: agent id and token count not visible to me; about 48 tool uses; minutes not verified.
