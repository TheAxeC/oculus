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
