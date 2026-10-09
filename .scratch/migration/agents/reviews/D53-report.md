Everything the brief and the round-1 rulings ask is done, and each finding of the refuter's report is closed: Spec 1 and Behaviour 1 by ruling 1 (a unique view held by a page drawn in a page leaf now has its leaf shown in every page between the page on screen and the holder), Standards 1 by ruling 2, Standards 2 and Behaviour 2 by ruling 3, Standards 3 by ruling 4. Not verified by me, because only the page shows it: cases 1, 3, 10, 11, 12 and 21 as the reader sees them (the brief leaves them to the landing look on a scratch oculus whose rail pages are made from their arrangements); the component parts of cases 6, 9, 10, 20, 21 and 22 (`Catalogue.svelte`, `ActivityRail.svelte`) are checked by reading them and by scratch runs that make the same store calls, not by clicking. G54's own test (`tests/checks/config/arrangements.test.ts`) is under `tests/checks`, which `test:quick` does not run and I did not run; it runs at landing under `npm run test:landing`, and `config/layout.yml` is not among the changed files.

# D53 report: unique views, after repair round 1

## Open items of the state file

`tools/oculus/.scratch/migration/orchestrator-state.md` in the main checkout, section "Open items" (`sed -n 226,230p`, read for the first report; not re-read in this round): the section holds its heading and the sentence "An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own." It lists no open item.

## Repair round 1: the rulings and what was done

1. A holder page drawn in a page leaf. `showHeld` (`src/lib/state/workbench/layout/open/opening.ts`) now walks the page leaves from the page on screen down to the holder page (`leavesTo`, a local function that follows `pageLeaves` of each page on the way) and, for each page on the way, calls `showLeaf(page, leafPath)`, which restores a maximised pane that does not hold the leaf (`shownAt`, `restore`) and expands a folded child holding it (`expandTo`), before the holder page's own restore, expand and activate. This holds for every page between the page on screen and the holder when leaves nest. No existing function returns the chain of leaves (`grep -rn "pageLeaves(" src/lib`, below), so it is a new local function and `nested.ts` is untouched.
2. `docs/window.md` line 35: the sentence on the views that are not unique now reads "Files, Search, Terminal and the session views are not unique: several pages and floats may hold one at once, and opening one on a page that already holds it activates it there."; the sentence on a hidden pane ends "also when the page that holds it is drawn in a page leaf of the page on screen", which is true after ruling 1. I also added to line 35 that the floats Reset all pages makes take a unique view they name in the same way, and to the `DESIGN.md` bullet (line 481) that a hiding maximised pane or folded child is undone in the holder page and in each page between.
3. What Reset all moves: `reset_all_tip` (`config/text/views/system/workbench.yml:106`) reads "Pages of your own keep their tabs, except a unique view a rail page or a shipped float names, which moves to the page or float made from it."; the head comment of `PagesReset.svelte` and `docs/window.md` line 33 say the same ("an arrangement or a float of `config/layout.yml` names moves to the page or float made from it"), in the words of the `resetPages` comment (`layout.svelte.ts:223-226`). Every other sentence is as it was.
4. The parameters no caller leaves out: `floatsFrom`'s `settle` is required and its `undefined` branch is gone (`open/float/pages.ts:124`, `:133`); `createOpening` and `createAway` take `unique` with no default. The callers, `grep -rn "floatsFrom(\|createOpening(\|createAway(" src tests`:

```
src/lib/state/workbench/layout/open/away.ts:42:export function createAway(
src/lib/state/workbench/layout/open/opening.ts:118:export function createOpening(
src/lib/state/workbench/layout/open/float/pages.ts:124:function floatsFrom(specs: FloatSpec[], settle: (pane: Pane) => Layout): Float[] {
src/lib/state/workbench/layout/open/float/pages.ts:248:    return { pages: [made], current: made.id, floats: floatsFrom(shipped, claims.settle) };
src/lib/state/workbench/layout/open/float/pages.ts:257:    const floats = floatsFrom(shipped, claims.settle);
src/lib/state/workbench/layout/open/float/pages.ts:310:    const floats = floatsFrom(shipped, claims.settle);
src/lib/state/workbench/layout.svelte.ts:419:    const opening = createOpening(
src/lib/state/workbench/layout.svelte.ts:432:    const away = createAway(
```

`grep -rn "createOpening\|createAway\|floatsFrom" tests` prints no line, so no test calls either factory. `createOpening`'s `opened` parameter keeps its default `() => false`, which is the base's own (`opening.ts` of the base copy, line 60).

## The cases, first run on the unchanged tree

Command, run from a copy of the base (`$TMPDIR/d53-unchanged`: the base `src`, `tests`, `utils` and `config` plus the worktree's root files, `node_modules` linked), so no change of the step is in it: `cd $TMPDIR/d53-unchanged && npx vitest run --config $TMPDIR/d53-scratch-unchanged/vitest.config.mts --reporter=default | grep -E "^CASE|FAIL|Tests |rror"`. The scratch files are `$TMPDIR/d53-scratch/{harness,cases.test,extra.test,probes.test}.ts` and `vitest.config.mts`; they drive `createClientState` with stand-in registrations (the ten with `unique: true`, which the unchanged tree ignores), `fakeStorage`, `serialiseLayout` and `client.drag`; case 17 builds the menu with `tabMenu` and `copyable: layout.copiesToWindow(id)` and a stub desktop. Every case has one test, titled by its number; X1 to X5 are five checks of my own for builds the cases do not name (a reset that takes a view out of a float, Reset all with a kept page, Reset all with a removed page, a rail page made while a float holds a view, two saved copies read back). The first run of the cases and X1 to X5 was taken before any change and is unaffected by this round, since the unchanged tree is the base.

"AS EXPECTED" means the tree produces the result the brief states for that case; "DIFFERS" means it does not. On the unchanged tree the cases that need the new behaviour differ, and the cases whose stated result is today's behaviour (2, 6 rail, 7, 8, 10 not held, 11 not held, 13 not held, 15, 17 browser, 18, 24, X3) are as expected. No case is one the brief's rules get wrong, so there is no ruling to carry.

```
CASE X1: DIFFERS | sys(screen)=row([*settings#new account-setup#new], col([*catalogue#new pages#new processes#new], [*status#new findings#new audit#new history#new gallery#new])) ; float fl=[*status#stf]
CASE X2: DIFFERS | own(screen)=[*files#f1 status#st] ; sys=row([*settings#new account-setup#new], col([*catalogue#new pages#new processes#new], [*status#new findings#new audit#new history#new gallery#new])) ; float new=[*hpc#new usage#new]
CASE X3: AS EXPECTED | own(screen)=[*files#f1] ; float new=[*hpc#new usage#new]
CASE X4: DIFFERS | p=[*files#f1] ; 44443a2f-fc52-4704-8000-0862fd2aed5e(screen)=[*usage#new search#new] ; float fl=[*usage#us]
CASE X5: DIFFERS | a(screen)=[files#f1 *status#new] ; b=[*status#s2] ; c=[*status#s3]
CASE 1: DIFFERS | page1(screen)=[files#f1 *status#new] ; sys=[*catalogue#cat status#st]
CASE 2: AS EXPECTED | page1(screen)=[*files#f1] ; float fl=[hpc#hp *usage#us]
CASE 3: DIFFERS | page1(screen)=[files#f1 *usage#new] ; page2=[usage#us *files#f2] ; float fl=[*hpc#hp]
CASE 4: DIFFERS | page1(screen)=row([files#f1 *history#new], <page page2>) ; page2=[history#hi *findings#fi]
CASE 5: DIFFERS | page1(screen)(max 0)=row([files#a1 *findings#new search#a2], [*projects#b1 findings#fi])
CASE 6 rail: AS EXPECTED | page1=[*files#f1] ; sys(screen)=[*settings#se catalogue#cat] ; state of se={"reveal":"rail"}
CASE 6 language: DIFFERS | id=52b7a37a-311a-460b-960d-431bf6888dc2 page1(screen)=[files#f1 *settings#new] ; sys=[settings#se *catalogue#cat]
CASE 7: AS EXPECTED | page1(screen)=[files#f1 *processes#new] ; sys=[*catalogue#cat]
CASE 8: AS EXPECTED | page1(screen)=row([projects#x1 files#new search#new *terminal#new], [*project#new]) ; page2=[*files#f2 search#s2 terminal#t2 project#pr] ; counts={"projects":1,"files":2,"search":2,"terminal":2,"project":2}
CASE 9 beside: DIFFERS | id=f50661b4-6c69-4954-9e29-28538e5d1736 sys(screen)=row([*catalogue#cat], [*pages#new], [*files#x1]) ; page2=[*pages#pg]
CASE 9 here: DIFFERS | id=b7a76539-92b8-4e30-beed-158dc0bf54ab sys(screen)=row([*catalogue#cat], [files#x1 *pages#new]) ; page2=[*pages#pg]
CASE 10 held: DIFFERS | page1(screen)=[files#f1 *status#new] ; sys=[*catalogue#cat status#hld]
CASE 10 not held: AS EXPECTED | page1(screen)=[files#f1 *processes#new] ; sys=[*catalogue#cat]
CASE 11 held: DIFFERS | page1=[*files#f1] ; sys=[*status#st] ; b4c196d5-a89d-4335-84eb-5ac1d7d56454(screen)=[*status#new]
CASE 11 not held: AS EXPECTED | page1=[*files#f1] ; 571a7615-1302-413f-92f5-a12808c77089(screen)=[*status#new]
CASE 12: DIFFERS | page1(screen)=[*files#f1 status#st] ; sys=row([*settings#new account-setup#new], col([*catalogue#new pages#new processes#new], [*status#new findings#new audit#new history#new gallery#new]))
CASE 13 held: DIFFERS | own(screen)=[*files#f1 usage#us] ; sys=row([*settings#new account-setup#new], col([*catalogue#new pages#new processes#new], [*status#new findings#new audit#new history#new gallery#new])) ; float new=[*hpc#new usage#new]
CASE 13 not held: AS EXPECTED | own(screen)=[*files#f1] ; sys=row([*settings#new account-setup#new], col([*catalogue#new pages#new processes#new], [*status#new findings#new audit#new history#new gallery#new])) ; float new=[*hpc#new usage#new]
CASE 14: DIFFERS | page1=[*files#f1 focus#fo] ; 33aa4f23-3ae4-4888-9e60-28ebd607af98(screen)=[*focus#new]
CASE 15 fresh: AS EXPECTED | 392306a2-8197-4bb0-bf11-0ea85a58245c(screen)=[*focus#new] ; float new=[*hpc#new usage#new]
CASE 15 keepDefault: AS EXPECTED | 7b7d78d1-b5ad-401d-b156-8b89c76bf0df(screen)=[*status#new] ; float new=[*hpc#new usage#new]
CASE 16: DIFFERS | 87e35976-b23d-422b-8d38-52669b759efe(screen)=[*status#new] ; float fl=[*status#stf]
CASE 17: DIFFERS | copiesToWindow(se)=true menu(settings)=move/copy copiesToWindow(f1)=true menu(files)=move/copy
CASE 17 browser: AS EXPECTED | browser menu offers move=false copy=false
CASE 18: AS EXPECTED | loaded=2 page1(screen)=[files#f1 *status#st1] ; sys=[*status#st2]
CASE 19: DIFFERS | page1(screen)=[files#f1 *status#new status#st]
CASE 20: DIFFERS | page1=[*files#f1] ; page2=[settings#se *files#f2] ; a131509d-8736-4ef2-bd42-971149ab4db9(screen)=row([*settings#new account-setup#new], col([*catalogue#new pages#new processes#new], [*status#new findings#new audit#new history#new gallery#new]))
CASE 21 click: DIFFERS | page1(screen)=[files#f1 *findings#new] ; sys=[*catalogue#cat findings#fi] previous=sys
CASE 21 shift: DIFFERS | page1(screen)=row([*files#f1], [*findings#new]) ; sys=[*catalogue#cat findings#fi]
CASE 22: DIFFERS | sys(screen)=row([*catalogue#cat], [files#x1 *pages#new]) ; page2=[*pages#pg]
CASE 23: DIFFERS | page1=[*files#f1] ; sys(screen)=[status#st *catalogue#cat] ; float fl=[hpc#hp *status#new usage#us]
CASE 24: AS EXPECTED | page1(screen)=[*files#f1] ; float new=[*hpc#new usage#us]
CASE 25: DIFFERS | page1=[*files#f1] ; 492f8ce7-4866-4291-b1fd-19cbace06183(screen)=[*status#new status#new] (arrangement parses: true)
      Tests  30 passed (30)
```

## Probes A to E, on the round-0 copy and after the change

Probes A and B are the reviewer's: a page leaf under a maximised pane (A) and one in a folded child (B). C, D and E are mine: C nests two leaves, each page on the way hiding the next (page1 maximised over a leaf of page2, page2 folded over a leaf of page3, page3 holding History); D has nothing hiding the leaf and checks that the page on screen is not rewritten (`JSON.stringify` of its workbench before and after is equal); E has the holder page itself maximised on another pane. They are in `$TMPDIR/d53-scratch/probes.test.ts`, on the round-0 copy through `$TMPDIR/d53-scratch-round0` (paths rewritten to `$TMPDIR/d53-round0`, a copy of `.agents/worktrees/D53-round0/tools/oculus` with `node_modules` linked). Command in each tree: `npx vitest run --config <config> --reporter=default probes | grep -E "^CASE|FAIL|Tests |rror"`.

Round-0 copy:

```
CASE PROBE A: DIFFERS | id=hi page1: focus={"path":[0]} folded=[] | page1(screen)(max 0)=row([*files#f1], <page page2>) ; page2=[*history#hi findings#fi]
CASE PROBE B: DIFFERS | id=hi page1: focus=null folded=[1] | page1(screen)=row([*files#f1], <page page2>) ; page2=[*history#hi findings#fi]
CASE PROBE C: DIFFERS | id=hi page1: focus={"path":[0]} folded=[] ; page2: focus={"path":[0]} folded=[1] | page1(screen)(max 0)=row([*files#f1], <page page2>) ; page2(max 0)=row([*files#f2], <page page3>) ; page3=[*history#hi findings#fi]
CASE PROBE D: AS EXPECTED | id=hi unchanged=true
CASE PROBE E: AS EXPECTED | id=hi page1: focus=null folded=[] ; page2: focus=null folded=[]
      Tests  5 passed (5)
```

After the change:

```
CASE PROBE A: AS EXPECTED | id=hi page1: focus=null folded=[] | page1(screen)=row([*files#f1], <page page2>) ; page2=[*history#hi findings#fi]
CASE PROBE B: AS EXPECTED | id=hi page1: focus=null folded=[] | page1(screen)=row([*files#f1], <page page2>) ; page2=[*history#hi findings#fi]
CASE PROBE C: AS EXPECTED | id=hi page1: focus=null folded=[] ; page2: focus=null folded=[] | page1(screen)=row([*files#f1], <page page2>) ; page2=row([*files#f2], <page page3>) ; page3=[*history#hi findings#fi]
CASE PROBE D: AS EXPECTED | id=hi unchanged=true
CASE PROBE E: AS EXPECTED | id=hi page1: focus=null folded=[] ; page2: focus=null folded=[]
      Tests  5 passed (5)
```

## Every case and X1 to X5 again

Round-0 copy, `cd $TMPDIR/d53-round0 && npx vitest run --config $TMPDIR/d53-scratch-round0/vitest.config.mts --reporter=default | grep -E "^CASE|FAIL|Tests |rror"`: `grep -c "AS EXPECTED"` prints 40 and `grep -c DIFFERS` prints 3 (the three are probes A, B and C); Tests 35 passed (35). The 38 lines of the 25 cases and X1 to X5 are as expected there, as they were in round 0.

After the change, worktree, `npx vitest run --config $TMPDIR/d53-scratch/vitest.config.mts --reporter=default | grep -E "^CASE|FAIL|Tests |rror"`: `grep -c "AS EXPECTED"` prints 43 and `grep -c DIFFERS` prints 0. The 25 cases print 33 lines because cases 6, 9, 10, 11, 13, 15, 17 and 21 print two each; X1 to X5 add five and probes A to E add five.

```
CASE PROBE A: AS EXPECTED | id=hi page1: focus=null folded=[] | page1(screen)=row([*files#f1], <page page2>) ; page2=[*history#hi findings#fi]
CASE PROBE B: AS EXPECTED | id=hi page1: focus=null folded=[] | page1(screen)=row([*files#f1], <page page2>) ; page2=[*history#hi findings#fi]
CASE PROBE C: AS EXPECTED | id=hi page1: focus=null folded=[] ; page2: focus=null folded=[] | page1(screen)=row([*files#f1], <page page2>) ; page2=row([*files#f2], <page page3>) ; page3=[*history#hi findings#fi]
CASE PROBE D: AS EXPECTED | id=hi unchanged=true
CASE PROBE E: AS EXPECTED | id=hi page1: focus=null folded=[] ; page2: focus=null folded=[]
CASE X1: AS EXPECTED | sys(screen)=row([*settings#new account-setup#new], col([*catalogue#new pages#new processes#new], [*status#stf findings#new audit#new history#new gallery#new]))
CASE X2: AS EXPECTED | own(screen)=[*files#f1] ; sys=row([*settings#new account-setup#new], col([*catalogue#new pages#new processes#new], [*status#st findings#new audit#new history#new gallery#new])) ; float new=[*hpc#new usage#new]
CASE X3: AS EXPECTED | own(screen)=[*files#f1] ; float new=[*hpc#new usage#new]
CASE X4: AS EXPECTED | p=[*files#f1] ; cfacaee8-fda8-45fb-a8c2-72751d29e6c9(screen)=[*usage#us search#new]
CASE X5: AS EXPECTED | a=[*files#f1] ; b(screen)=[*status#s2] ; c=[*status#s3]
CASE 1: AS EXPECTED | page1=[*files#f1] ; sys(screen)=[catalogue#cat *status#st]
CASE 2: AS EXPECTED | page1(screen)=[*files#f1] ; float fl=[hpc#hp *usage#us]
CASE 3: AS EXPECTED | page1=[*files#f1] ; page2(screen)=[*usage#us files#f2] ; float fl=[*hpc#hp]
CASE 4: AS EXPECTED | page1(screen)=row([*files#f1], <page page2>) ; page2=[*history#hi findings#fi]
CASE 5: AS EXPECTED | page1(screen)=row([*files#a1 search#a2], [projects#b1 *findings#fi])
CASE 6 rail: AS EXPECTED | page1=[*files#f1] ; sys(screen)=[*settings#se catalogue#cat] ; state of se={"reveal":"rail"}
CASE 6 language: AS EXPECTED | id=se page1=[*files#f1] ; sys(screen)=[*settings#se catalogue#cat]
CASE 7: AS EXPECTED | page1(screen)=[files#f1 *processes#new] ; sys=[*catalogue#cat]
CASE 8: AS EXPECTED | page1(screen)=row([projects#x1 files#new search#new *terminal#new], [*project#new]) ; page2=[*files#f2 search#s2 terminal#t2 project#pr] ; counts={"projects":1,"files":2,"search":2,"terminal":2,"project":2}
CASE 9 beside: AS EXPECTED | id=pg sys=row([*catalogue#cat], [*files#x1]) ; page2(screen)=[*pages#pg]
CASE 9 here: AS EXPECTED | id=pg sys=row([*catalogue#cat], [*files#x1]) ; page2(screen)=[*pages#pg]
CASE 10 held: AS EXPECTED | page1(screen)=[files#f1 *status#hld] ; sys=[*catalogue#cat]
CASE 10 not held: AS EXPECTED | page1(screen)=[files#f1 *processes#new] ; sys=[*catalogue#cat]
CASE 11 held: AS EXPECTED | page1=[*files#f1] ; sys=[*status#st] ; 2b46a9eb-2051-4e65-a449-307ab93b9c81(screen)=[]
CASE 11 not held: AS EXPECTED | page1=[*files#f1] ; 03a4a611-fcf2-459c-bd7b-cf9185c2093d(screen)=[*status#new]
CASE 12: AS EXPECTED | page1(screen)=[*files#f1] ; sys=row([*settings#new account-setup#new], col([*catalogue#new pages#new processes#new], [*status#st findings#new audit#new history#new gallery#new]))
CASE 13 held: AS EXPECTED | own(screen)=[*files#f1] ; sys=row([*settings#new account-setup#new], col([*catalogue#new pages#new processes#new], [*status#new findings#new audit#new history#new gallery#new])) ; float new=[*hpc#new usage#us]
CASE 13 not held: AS EXPECTED | own(screen)=[*files#f1] ; sys=row([*settings#new account-setup#new], col([*catalogue#new pages#new processes#new], [*status#new findings#new audit#new history#new gallery#new])) ; float new=[*hpc#new usage#new]
CASE 14: AS EXPECTED | page1=[*files#f1] ; cc5a9690-be3f-4284-8980-3e25b263c377(screen)=[*focus#fo]
CASE 15 fresh: AS EXPECTED | 9dcea214-3e09-43b8-9491-802d9da74cce(screen)=[*focus#new] ; float new=[*hpc#new usage#new]
CASE 15 keepDefault: AS EXPECTED | 62715c18-a7ae-4065-913b-1a539ceff851(screen)=[*status#new] ; float new=[*hpc#new usage#new]
CASE 16: AS EXPECTED | 9502654c-8fd5-4f2a-98bf-952fad1c6bbd(screen)=[] ; float fl=[*status#stf]
CASE 17: AS EXPECTED | copiesToWindow(se)=false menu(settings)=move/no-copy copiesToWindow(f1)=true menu(files)=move/copy
CASE 17 browser: AS EXPECTED | browser menu offers move=false copy=false
CASE 18: AS EXPECTED | loaded=2 page1(screen)=[files#f1 *status#st1] ; sys=[*status#st2]
CASE 19: AS EXPECTED | page1(screen)=[files#f1 *status#st]
CASE 20: AS EXPECTED | page1=[*files#f1] ; page2(screen)=[*settings#se files#f2]
CASE 21 click: AS EXPECTED | page1=[*files#f1] ; sys(screen)=[catalogue#cat *findings#fi] previous=page1
CASE 21 shift: AS EXPECTED | page1=[*files#f1] ; sys(screen)=[catalogue#cat *findings#fi]
CASE 22: AS EXPECTED | sys(screen)=row([*catalogue#cat], [files#x1 *pages#pg]) ; page2=[]
CASE 23: AS EXPECTED | page1=[*files#f1] ; sys(screen)=[*status#st catalogue#cat] ; float fl=[*hpc#hp usage#us]
CASE 24: AS EXPECTED | page1(screen)=[*files#f1] ; float new=[*hpc#new usage#us]
CASE 25: AS EXPECTED | page1=[*files#f1] ; c0b5954b-5e6b-454f-8269-1bf01f76c110(screen)=[*status#new] (arrangement parses: true)
      Tests  35 passed (35)
```

## DONE / NOT DONE

Each check below was run from `tools/oculus` in the worktree after the last change of the round. Output is as printed.

| # | Check | State |
|---|-------|-------|
| 1 | `npm run diagrams && npm run test:quick` | DONE, both exit 0; `test:quick` printed "over the time limit" (68.0 s against 45.0 s) |
| 2 | `npx vitest run` over the 12 paths of verify 2 | DONE, 14 files and 122 tests pass after the change and on the unchanged tree |
| 3 | scratch runs of the cases, unchanged tree, round-0 copy and after | DONE, quoted above |
| 4 | tests the step changes | DONE, none: the step changes no test and adds none |
| 5 | new sentences read against `agents/spec.md` | DONE, see "Prose" below |
| 6 | `sh utils/folder-check.sh`, `wc -l`, `sh utils/unused-exports.sh` | DONE |
| 7 | reuse greps and importer greps | DONE |
| 8 | ASCII gate | DONE, prints nothing, exit 0 |
| 9 | `npx prettier --check` and `npx eslint` over the 24 changed files | DONE, both exit 0 |

### 1. diagrams and test:quick

Command: `npm run diagrams; echo "diagrams exit $?"; npm run test:quick | tail -16; echo "quick exit $?"`. `diagrams exit 0`. `diff -rq <round-0 copy>/docs/diagrams docs/diagrams` prints nothing (exit 0), so the diagrams the worktree's source makes are the ones the round-0 copy holds. `diff -rq` of `docs/diagrams` against the main checkout lists ten files (channels, layer-state, layer-views, layers, writes, each `.dot` and `.svg`); for example `layers.dot` differs in the edge counts "views to state" (main 1080, worktree 1064) and "views to ui" (main 877, worktree 869). The cause is not verified; the diagrams are regenerated at landing on main.

```
        tests/state/workbench/navigation/pages.test.ts: imports at depth 1
        tests/views/sources/bar-actions.test.ts: imports at depth 1
        tests/state/forms/manifest-draft.test.ts: imports at depth 2
        tests/state/sessions/source.test.ts: imports at depth 2
        tests/views/shared/explorer/opening-apps.test.ts: imports at depth 2
        tests/views/shared/explorer/opening.client.test.ts: imports at depth 2
ok      ASCII gate (1.7 s)
ok      prettier (3.6 s): All matched files use Prettier code style!
ok      svelte-kit sync (13.7 s)
ok      vitest (56.7 s): Duration  37.27s (transform 100.19s, setup 0ms, import 118.13s, tests 4.57s, environment 759ms)
ok      eslint (58.2 s)
ok      svelte-check (54.1 s): 1791566442940 COMPLETED 444 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 68.0 s (limit 45.0 s); every command passed
test:quick: over the time limit
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
quick exit 0
```

The time limit of 45.0 s is exceeded on this machine: the final run took 68.0 s and the refuter's 54.0 s; every command in it passed. The load on the machine during either run was not measured.

### 2. verify 2

Command (`cat $TMPDIR/d53-v2cmd.txt`): `npx vitest run tests/state/workbench/layout tests/data/helpers/hub-names.test.ts tests/server/machine/pty/channel.test.ts tests/shell/panes/strip/tab-menu.test.ts tests/state/client/held-unsaved.test.ts tests/state/client/terminal/terminal-close.test.ts tests/state/forms/manifest-draft.test.ts tests/state/sessions/autosave.client.test.ts tests/state/sessions/source-disk.client.test.ts tests/state/sessions/source.test.ts tests/state/sources/repositories/diff/comment-draft.client.test.ts tests/state/workbench/navigation/pages.test.ts`.

On the unchanged tree (`cd $TMPDIR/d53-unchanged`):

```

 RUN  v4.1.11 /private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/d53-unchanged


 Test Files  14 passed (14)
      Tests  122 passed (122)
   Start at  18:32:13
   Duration  37.92s (transform 62.16s, setup 0ms, import 142.39s, tests 755ms, environment 133ms)
```

After the change (the worktree):

```


 Test Files  14 passed (14)
      Tests  122 passed (122)
   Start at  19:20:53
   Duration  20.59s (transform 22.82s, setup 0ms, import 76.55s, tests 602ms, environment 188ms)
```

### 4. changed tests

Command: `for d in src tests utils config; do diff -rq $B/$d $d --exclude=local.yml; done` lists 24 changed files, none under `tests/`; the changed files are those of the file table below. No test is obsolete and none is deleted.

### 6. folder-check, line counts, unused exports

`sh utils/folder-check.sh; echo "folder-check exit $?"` prints `folder-check exit 0`. `ls src/lib/state/workbench/layout | wc -l` prints 10 and `ls src/lib/state/workbench/layout/open | wc -l` prints 10, so no folder took a file.

Command: `sh utils/unused-exports.sh > out; wc -l < out` prints 364, and the base `unused-exports.txt` has 364 lines (`wc -l`). `diff unused-exports.txt out` at the base prints:

```
202c202
< src/lib/state/workbench/layout/nested.ts: containsPage, embeddable, drawnBy
---
> src/lib/state/workbench/layout/nested.ts: containsPage, embeddable
```

The step adds no line to the list. It removes `drawnBy` from the `nested.ts` entry because `opening.ts` now uses it. `floatsFrom`, which no file outside `pages.ts` calls, is not exported. `leavesTo` and `showLeaf` are local to `opening.ts`.

### 7. reuse and importer greps

Reuse, before the new `leavesTo` and `showLeaf` (`grep -rn "export function pageLeaves\|export function expandTo\|export function restore\|export function focusedPane\|export function showsPage\|export function drawnBy" src/lib`, then `grep -rn "pageLeaves(" src/lib`): `showsPage` and `drawnBy` (`nested.ts:25`, `:78`) answer which pages a page reaches and not the leaf to take at each step, so they do not give the chain; `pageLeaves` (`tree.ts:61`), `expandTo` (`tree.ts:498`), `restore` and `focusedPane` (`workbench.ts:78`, `:17`) are what the two new functions call.

```
reuse: grep -rn 'function pageLeaves\|function expandTo\|function restore\|function focusedPane\|showsPage\|drawnBy' src/lib (definitions)
src/lib/server/edit/feeds.ts:597:export function restoreFeedEntry(
src/lib/server/edit/writes/subtasks.ts:130:export function restoreSubtask(
src/lib/server/files/fs/history.ts:311:export function restoreCopy(history: string, real: string, id: string, path: string): boolean {
src/lib/server/git/git-write.ts:609:export function restore(root: string, paths: string[], staged: boolean): Promise<Outcome> {
src/lib/state/workbench/layout/workbench.ts:17:export function focusedPane(workbench: Workbench): Focus | null {
src/lib/state/workbench/layout/workbench.ts:78:export function restore(workbench: Workbench): Workbench {
src/lib/state/workbench/layout/nested.ts:25:export function showsPage(held: readonly Page[], id: string, wanted: string): boolean {
src/lib/state/workbench/layout/nested.ts:78:export function drawnBy(held: readonly Page[], id: string): Set<string> {
src/lib/state/workbench/layout/tree.ts:61:export function pageLeaves(layout: Layout): { path: number[]; page: string }[] {
src/lib/state/workbench/layout/tree.ts:498:export function expandTo(layout: Layout, path: number[]): Layout {

grep -rn "leaf.page ===\|walk(leaf.page)\|pageLeaves(" src/lib (other walkers over page leaves)
src/lib/state/workbench/layout/nested.ts:32:        return pageLeaves(page.workbench.root).some(
src/lib/state/workbench/layout/nested.ts:85:        for (const leaf of pageLeaves(page.workbench.root)) walk(leaf.page);
src/lib/state/workbench/layout/nested.ts:107:    for (const leaf of pageLeaves(root)) {
src/lib/state/workbench/layout/nested.ts:203:        const leaf = pageLeaves(tree).find((one) => one.page === id);
src/lib/state/workbench/layout/tree.ts:61:export function pageLeaves(layout: Layout): { path: number[]; page: string }[] {
src/lib/state/workbench/layout/open/opening.ts:103:        for (const leaf of pageLeaves(page.workbench.root)) {
```

The round-0 reuse greps stand for the builders (`findView`, `hostsOf`, `drawnBy`, `renameInstance`, `restate`, `closeInstance`, `dropInstance`, `clearPage` are defined once, in `layout/model.ts`, `instance.ts`, `nested.ts`, `tree.ts` and `open/float/pages.ts`, and the builders call them); `grep -rn "heldView\|holdsView\|holderOf"` over the base `src/lib` counts 0 lines.

Importers of each new export (`grep -rn "\bNAME\b" src tests`, comments excluded; lines cut at 150 characters):

```
== heldView
src/lib/state/workbench/layout/open/opening.ts:37:import { heldView, type UniqueRule } from './float/pages.ts';
src/lib/state/workbench/layout/open/opening.ts:353:        const found = heldView([...shown, ...floats.map(floatHost), ...apart], view);
src/lib/state/workbench/layout/open/float/pages.ts:153:export function heldView(
src/lib/state/workbench/layout/open/float/pages.ts:196:            const found = heldView(hosts, tab.view);
src/lib/state/workbench/layout/open/float/pages.ts:216:        if (builds.unique(tab.view) && heldView(hostsOf(held), tab.view) !== null) {
== withoutHeld
src/lib/state/workbench/layout.svelte.ts:58:    withoutHeld,
src/lib/state/workbench/layout.svelte.ts:543:        addPage(withoutHeld(store.current, newPage(label), builds));
src/lib/state/workbench/layout/index.ts:78:    withoutHeld,
src/lib/state/workbench/layout/open/float/pages.ts:213:export function withoutHeld(held: Pages, page: Page, builds: Builds): Page {
src/lib/state/workbench/layout/open/float/pages.ts:227:    return { ...made, pages: made.pages.map((page) => withoutHeld(bare, page, builds)), floats 
== defaultBeside
src/lib/state/workbench/layout.svelte.ts:37:    defaultBeside,
src/lib/state/workbench/layout.svelte.ts:584:            savePages(defaultBeside(t('ui.page_default', 1), store.current.floats, builds));
src/lib/state/workbench/layout/index.ts:71:    defaultBeside,
src/lib/state/workbench/layout/open/float/pages.ts:224:export function defaultBeside(label: string, floats: Float[], builds: Builds): Pages {
src/lib/state/workbench/layout/open/float/pages.ts:316:            ? defaultBeside(label, floats, builds)
== withPage
src/lib/state/workbench/layout.svelte.ts:59:    withPage,
src/lib/state/workbench/layout.svelte.ts:487:        savePages(withPage(store.current, newPage(label, next, key), builds));
src/lib/state/workbench/layout/index.ts:77:    withPage,
src/lib/state/workbench/layout/open/float/pages.ts:234:export function withPage(held: Pages, page: Page, builds: Builds): Pages {
== startedOn
src/lib/state/workbench/layout.svelte.ts:55:    startedOn,
src/lib/state/workbench/layout.svelte.ts:507:        savePages(startedOn(store.current, newPage(label, next, key), shipped, builds));
src/lib/state/workbench/layout/index.ts:76:    startedOn,
src/lib/state/workbench/layout/open/float/pages.ts:245:export function startedOn(held: Pages, page: Page, shipped: FloatSpec[], builds: Builds): Pages
== keptDefault
src/lib/state/workbench/layout.svelte.ts:45:    keptDefault,
src/lib/state/workbench/layout.svelte.ts:517:        if (shipped.length > 0) savePages(keptDefault(store.current, shipped, builds));
src/lib/state/workbench/layout/index.ts:72:    keptDefault,
src/lib/state/workbench/layout/open/float/pages.ts:255:export function keptDefault(held: Pages, shipped: FloatSpec[], builds: Builds): Pages {
== rebuiltPage
src/lib/state/workbench/layout.svelte.ts:50:    rebuiltPage,
src/lib/state/workbench/layout.svelte.ts:699:        savePages(rebuiltPage(store.current, id, source.label, next, builds));
src/lib/state/workbench/layout/index.ts:74:    rebuiltPage,
src/lib/state/workbench/layout/open/float/pages.ts:265:export function rebuiltPage(
== resetAll
src/lib/state/workbench/layout.svelte.ts:51:    resetAll,
src/lib/state/workbench/layout.svelte.ts:730:        const next = resetAll(held, plan, arranged, shipped, t('ui.page_default', 1), builds);
src/lib/state/workbench/layout/index.ts:75:    resetAll,
src/lib/state/workbench/layout/open/float/pages.ts:292:export function resetAll(
== heldUnique
src/lib/shell/rail/ActivityRail.svelte:53:        layout: { currentPage, heldUnique, openRailPage, openView, pages: allPages, resetPage },
src/lib/shell/rail/ActivityRail.svelte:169:        if (holder !== undefined && heldUnique(SETTINGS_VIEW) === null) {
src/lib/state/workbench/layout.svelte.ts:197:        heldUnique: (view: ViewId) => string | null;
src/lib/state/workbench/layout.svelte.ts:853:        heldUnique: opening.heldUnique,
src/lib/state/workbench/drag.svelte.ts:195:            layout.heldUnique(view) ??
src/lib/state/workbench/drag.svelte.ts:199:            const held = layout.heldUnique(view);
src/lib/state/workbench/layout/open/opening.ts:76:    heldUnique: (view: ViewId) => string | null;
src/lib/state/workbench/layout/open/opening.ts:357:    function heldUnique(view: ViewId): string | null {
src/lib/state/workbench/layout/open/opening.ts:446:    return { openView, openBeside, openInPane, heldUnique };
src/lib/views/system/workbench/Catalogue.svelte:71:            heldUnique,
src/lib/views/system/workbench/Catalogue.svelte:108:        if (heldUnique(view) !== null) return;
== moveAway
src/lib/state/workbench/layout/open/away.ts:37:    moveAway: (id: string, page: string, avoid: string) => void;
src/lib/state/workbench/layout/open/away.ts:105:    function moveAway(id: string, page: string, avoid: string): void {
src/lib/state/workbench/layout/open/away.ts:121:    return { openAway, openNextTo, moveAway, paneHolds };
src/lib/state/workbench/layout.svelte.ts:195:        moveAway: (id: string, page: string, avoid: string) => void;
src/lib/state/workbench/layout.svelte.ts:852:        moveAway: away.moveAway,
src/lib/state/workbench/drag.svelte.ts:202:            else layout.moveAway(held, at, avoid);
== registerUnique
src/lib/state/workbench/layout.svelte.ts:211:        registerUnique: (rule: UniqueRule) => void;
src/lib/state/workbench/layout.svelte.ts:869:        registerUnique: (rule) => {
src/lib/state/client/context.ts:765:    layout.registerUnique((view) => registry.viewFor(view)?.unique === true);
== types Arranged, Builds, UniqueRule
src/lib/state/workbench/layout.svelte.ts:62:    type Arranged,
src/lib/state/workbench/layout.svelte.ts:63:    type Builds,
src/lib/state/workbench/layout.svelte.ts:84:    type UniqueRule,
src/lib/state/workbench/layout.svelte.ts:211:        registerUnique: (rule: UniqueRule) => void;
src/lib/state/workbench/layout.svelte.ts:404:    let uniqueRule: UniqueRule = () => false;
src/lib/state/workbench/layout.svelte.ts:415:    const builds: Builds = { unique: (view) => uniqueRule(view), keep: keepRule };
src/lib/state/workbench/layout.svelte.ts:722:        const arranged = new Map<string, Arranged>();
src/lib/state/workbench/layout/index.ts:81:export type { Arranged, Builds, UniqueRule } from './open/float/pages.ts';
== leavesTo, showLeaf
src/lib/state/workbench/layout/open/opening.ts:92:function leavesTo(
src/lib/state/workbench/layout/open/opening.ts:365:    function showLeaf(page: string, path: number[]): void {
src/lib/state/workbench/layout/open/opening.ts:385:            for (const hop of leavesTo(access.held().pages, screen, host.id)) {
src/lib/state/workbench/layout/open/opening.ts:386:                showLeaf(hop.page, hop.path);
```

### 8. ASCII gate

Command, the form of `agents/spec.md:99` without `bin`, which this tree does not have (`ls -d bin` prints "No such file or directory"): `LC_ALL=C perl -ne 'my $l = $_; $l =~ s/\xC3[\x80-\xBF]//g if $ARGV =~ m{^config/}; print "$ARGV:$.:$_" if $l =~ /[^\x20-\x7E\n]/; close ARGV if eof' $(find src tests config -type f ! -name local.yml); echo "ascii gate exit $?"`. The same perl over `docs/window.md` and `DESIGN.md` prints nothing (exit 0). `test:quick` ran its own ASCII gate: "ok      ASCII gate (1.7 s)".

```
ascii gate exit 0
```

### 9. prettier and eslint over the 24 changed files

Command: `cat changed-files | xargs npx prettier --check; echo "prettier exit $?"; grep -E "\.(ts|svelte)$" changed-files | xargs npx eslint; echo "eslint exit $?"`, where changed-files is the output of `for d in src tests utils config; do diff -rq $B/$d $d --exclude=local.yml; done`.

```
Checking formatting...
All matched files use Prettier code style!
prettier exit 0
eslint exit 0
```

### 5. Prose

Each added or changed sentence of `docs/window.md`, `DESIGN.md`, the comments and `reset_all_tip` was read against `agents/spec.md` (line 20 and the comment rules). The grep over the added lines for history words (`previously|formerly|used to|no longer|reverted|originally|legacy|session|package|bug`) finds only "an earlier tree settled by the same claims" in the `Claims` comment of `open/float/pages.ts`, which says an earlier tree of the same build, not an earlier version of the code, and "when it was removed" in the `resetAll` comment, which says what happens to the page on screen when Reset all removes it. The only departure from the short-sentence form is the new paragraph of `docs/window.md` (line 35) and the new bullet of `DESIGN.md` (line 481): each is one line of several sentences, as the paragraph and bullet beside it are (`docs/window.md` 33 and `DESIGN.md` 480), because the file keeps one paragraph or bullet to one line and each carries a rule with its order of search and its exceptions. The comments I edited were rewrapped at 100 columns.

## Terms

No glossary (`ls docs` lists apps.md, configuration.md, debugging.md, diagrams, files-and-search.md, source-control.md, terminals.md, views.md, window.md and no glossary.md).

## The files, with line counts

Command: `for d in src tests utils config; do diff -rq $B/$d $d --exclude=local.yml; done` (24 files; none under `tests` or `utils`), then `xargs wc -l`. `docs/window.md` (84 lines) and `DESIGN.md` (587 lines) are not in the base copy; they differ from the main checkout (`diff $M/docs/window.md docs/window.md`, `diff $M/DESIGN.md DESIGN.md`) by the lines named here.

| File | Lines | Change |
|------|-------|--------|
| `src/lib/state/workbench/navigation/registry.ts` | 229 | the `unique` field and its comment |
| `src/lib/views/system/status/Status.svelte` | 117 | `unique: true` in `registration` |
| `src/lib/views/system/audit/Audit.svelte` | 339 | `unique: true` in `registration` |
| `src/lib/views/system/workbench/Pages.svelte` | 395 | `unique: true` in `registration` |
| `src/lib/views/system/workbench/Settings.svelte` | 343 | `unique: true` in `registration` |
| `src/lib/views/system/findings/Findings.svelte` | 98 | `unique: true` in `registration` |
| `src/lib/views/system/machine/processes/Processes.svelte` | 106 | `unique: true` in `registration` |
| `src/lib/views/system/machine/usage/Usage.svelte` | 365 | `unique: true` in `registration` |
| `src/lib/views/system/machine/hpc/Hpc.svelte` | 130 | `unique: true` in `registration` |
| `src/lib/views/system/history/History.svelte` | 397 | `unique: true` in `registration` |
| `src/lib/views/boards/focus/Focus.svelte` | 231 | `unique: true` in `registration` |
| `src/lib/state/workbench/layout/open/opening.ts` | 447 | held-instance search and showing, `leavesTo`, `showLeaf`, `heldUnique`; `unique` required |
| `src/lib/state/workbench/layout/open/away.ts` | 122 | guard in `openNextTo`, `moveAway`; `unique` required |
| `src/lib/state/workbench/layout/open/float/pages.ts` | 626 | the pure builders: `heldView`, `withPage`, `startedOn`, `keptDefault`, `rebuiltPage`, `resetAll`, `withoutHeld`, `defaultBeside`; `floatsFrom` takes `settle` required |
| `src/lib/state/workbench/layout/index.ts` | 146 | exports of the builders and types |
| `src/lib/state/workbench/layout/model.ts` | 309 | the `MAIN_VIEW` comment |
| `src/lib/state/workbench/layout.svelte.ts` | 875 | the rule, the builds call the pure builders, `copiesToWindow` guard, `registerUnique`, `heldUnique`, `moveAway` |
| `src/lib/state/client/context.ts` | 859 | the `registerUnique` call |
| `src/lib/state/workbench/drag.svelte.ts` | 488 | catalogue drop of a held unique view |
| `src/lib/shell/rail/ActivityRail.svelte` | 363 | `openSettings` goes to a held Settings |
| `src/lib/shell/panes/strip/tab-menu.ts` | 304 | two doc comments (outside the list, see below) |
| `src/lib/views/system/workbench/Catalogue.svelte` | 309 | `showTarget`, `open`, comments |
| `src/lib/views/system/workbench/PagesReset.svelte` | 116 | head comment |
| `config/text/views/system/workbench.yml` | 210 | `reset_all_tip` |
| `docs/window.md` | 84 | lines 21, 33, 35 (new paragraph), 56 (was 54) |
| `DESIGN.md` | 587 | new bullet at 481 |

Files outside the write list, each with why:

- `src/lib/shell/panes/strip/tab-menu.ts`: the `tabMenu` doc and the `copyable` doc said every tab but a Terminal tab is copyable, which the change makes false.
- `docs/window.md` line 33: "leaving the pages you made yourself alone" is false once a build moves a unique view into a rebuilt page or float, so the clause reads "leaving the pages you made yourself as they are, except that a unique view an arrangement or a float of `config/layout.yml` names moves to the page or float made from it".
- `src/lib/views/system/workbench/Catalogue.svelte`: the head comment described a click as opening on the target page; it now says a held unique view is shown where it is held (the listed range 95-119 covers `showTarget` and `open` only).
- `src/lib/shell/rail/ActivityRail.svelte` line 53: `heldUnique` is added to the destructure of `layout` (the listed range is lines 160-170).
- `src/lib/state/workbench/drag.svelte.ts` and `layout/index.ts`: both listed; the `DragSink` doc comments and the export lines are what the type checker sent me to.
- `src/lib/state/workbench/layout/open/float/pages.ts` holds the pure builders instead of `tree.ts` or `instance.ts`: the builders call `floatsFrom` and `dropInstance` of `pages.ts`, and `pages.ts` imports `tree.ts` and `instance.ts`, so a builder in either named file would import in a cycle.

## Each paragraph and head comment of "What is on the tree"

| Item | State |
|------|-------|
| No ADR | still true |
| Base copy at `.agents/worktrees/D53-base/tools/oculus/` | still true |
| The ten registrations | rewritten: each now says `unique: true` (`grep -n "unique: true"` over the ten files prints one line in each) |
| The registration type, `registry.ts:76-123` | rewritten: `unique?: boolean` with its comment |
| `openInto` order and the second-instance behaviour | rewritten: a unique view is looked for over the page on screen and what it draws, the floats, then the other pages, before the existing steps |
| `findView` with a `null` identity | still true; the unique search omits the identity |
| Maximised pane | still true for an ordinary view; for a unique view `showHeld` restores a maximised pane that is not the holder, in the holder page and in each page leading to a drawn holder |
| `createOpening(access, attention, keepPreview, opened)` | rewritten: a fifth parameter `unique`, required |
| The other openers (status bar, notice, link, command center, Submit Job, desktop menu, language settings) | still true: all go through `openView` |
| `openSettings` | rewritten: it opens the rail page first only when no page or float holds Settings |
| The Views catalogue paragraph `docs/window.md:21` | rewritten, every sentence |
| `openNextTo` and `openAway` | rewritten: a unique view held elsewhere is shown there, `moveAway` places a dropped one |
| The catalogue drop of `drag.svelte.ts` | rewritten: a held unique view moves, the page dropped on stays |
| Copy into New Window and `copiesToWindow` | rewritten: false for a unique view, also refused in `copyTabToWindow` |
| `openRailPage`, `startOnRailPage`, `keepDefaultPage`, `resetPage`, `resetPages`, `openPage`, `closePage` | rewritten: each builds through `withPage`, `startedOn`, `keptDefault`, `rebuiltPage`, `resetAll`, `withoutHeld` or `defaultBeside` |
| `adoptFloats` | still true, unchanged |
| The arrangements of `config/layout.yml`, G54 | still true: `config/layout.yml` is not among the changed files, and a rail page holds what its arrangement names |
| `drawnBy` and the page leaf | still true; `drawnBy` is now used |
| 10 items in `layout/` and `layout/open/` | still true (`ls | wc -l`: 10 and 10) |
| `docs/window.md:54` | rewritten (now line 56): "a Terminal tab and the tab of a unique view offer no copy" |
| `layout/model.ts:142` | rewritten: "The view a fresh page starts on, when no page or float holds it." |
| Head comment of `opening.ts`, comments of `openView`, `openBeside`, `openOpened` | rewritten |
| Head comment and `openNextTo` comments of `away.ts` | rewritten |
| `Registration` comments of `registry.ts` | rewritten for the new field; the others still true |
| `ActivityRail.svelte` `openSettings` comment | rewritten |
| `Catalogue.svelte` `showTarget` and `open` comments | rewritten |
| `PagesReset.svelte` head comment, `reset_all_tip` | rewritten (round 1: a shipped float is named too) |
| `DESIGN.md:480` | still true; a new bullet follows it at 481 |
| `docs/window.md` 31-37, the Pages section | rewritten at line 33, new paragraph at line 35 |
| No guarded entry covers opening; G28 | still true; G28's tests are in verify 2 |

## Judgment calls the brief left open

Each is reversible.

1. The pure builders are in `open/float/pages.ts`, not in `tree.ts` or `instance.ts` (the import cycle above). `layout.svelte.ts` is capped at 880 lines and the builders do not fit in it (875 lines with them outside), and a new file in `layout/` is refused by the 10-item rule. `pages.ts` is 626 lines.
2. A moved instance enters its new place as `{ id, view, state }`: its `pinned` and `preview` flags are not carried, since the arrangement decides the pane and a pin follows the place the tab lands in (`tree.ts:355`, "a drop decides the pin").
3. `keepDefaultPage`: when a shipped float names a unique view the default page also holds, the float takes the instance (the default page is left with an empty pane) rather than the default page leaving its copy out and the float making a new one. What the reader sees is the same; only the instance id differs. Checked by reading `keepDefaultPage` (`layout.svelte.ts`) and `keptDefault` (`pages.ts:255`), and by the reviewer's probe C, not by a scratch case of mine: case 15 names no unique view in both the default page and a shipped float.
4. `copyTabToWindow` returns null for a unique view at the store (`layout.svelte.ts:824`), beside the menu not offering the item, so a caller other than the menu cannot make a copy.
5. `moveAway` calls `uncover` only when the moved instance was in the catalogue's pane, so the catalogue's pane goes on showing the catalogue.
6. The catalogue drop reads `layout.heldUnique(view)` (the id the search finds) and `layout.moveAway` for the catalogue's own pane; a held view is never opened by the drop.
7. `heldUnique` and `moveAway` are members of the layout store (the sink and `Catalogue.svelte` call them).
8. `adoptFloats` stays as it is (item 4).
9. The search order of item 3 applies to a page asked for by id and to a float as the host as well (cases 4 and 23).
10. The docs and comments named above under "Files outside the write list" were made true rather than left false.
11. Round 1: `showLeaf` applies a page only when its focus or root changes (`base !== bench || root !== bench.root`), so a leaf nothing hides does not rewrite the page on screen (probe D).

## Visible changes, before and after

1. Opening one of the ten views while another page holds it: before, a second copy opened on the page on screen; after, the page that holds it is shown with the tab active (cases 1, 3, 20, 23). A copy on a page drawn in a leaf is activated in the leaf and the page on screen stays (case 4). A float is activated as before (case 2).
2. A unique view held in a page leaf under a maximised pane or a folded child (probes A, B and C): before this round, the tab was activated inside the leaf and nothing showed it (the page on screen kept its maximised pane or folded child, and the reader saw nothing happen); after, the maximised pane is restored and the folded child expanded in each page between the page on screen and the holder, and the tab shows. Where nothing hides the leaf the page on screen is left as it is (probe D).
3. The Views catalogue: a click or shift-click on a held unique view goes straight to it, with no page shown on the way; Open on this page and Open beside on this page show it where it is held and move nothing; a drop moves the one instance to the pane dropped on and the page stays on screen; a drop on the catalogue's own pane moves it to the other pane (cases 9, 10, 21, 22).
4. The Settings rail entry shows the Settings a page or float holds; it makes the System page only when none holds one (cases 6 and 20).
5. First press of a rail button, Reset, Reset all pages and the first start of a browser: a view the arrangement names, held elsewhere, moves into the page made from it (cases 12, 13, 14, 15, 25). New page and the page left by closing the last page are one empty pane when a page or float holds Status (cases 11 and 16).
6. Reset all pages moving a unique view out of a page of the reader's own into the shipped float that names it (Usage and Live HPC; case 13 held, where Usage leaves the page `own` and the float holds it): before D53, the tab stayed on the reader's page and the float gained a second Usage; after, the one Usage is in the float and the reader's page no longer has it. `reset_all_tip`, the `PagesReset.svelte` comment and `docs/window.md` line 33 now say so.
7. Copy into New Window is not offered on a tab of a unique view, in the app (case 17).
8. `reset_all_tip` and `docs/window.md` lines 21, 33, 35 and 56 and the `DESIGN.md` bullet describe the rules above.

Remaining room: `layout.svelte.ts` is 875 lines against the limit of 880 (`wc -l`), so the next step that adds to it has to move code out of it first; `layout/` and `layout/open/` are at 10 items, so that code goes into an existing file.

## Anything in the brief that was wrong or impossible

- Verify 1 says `npm run test:quick` finishes within 45 s; the tool's own last line is "test:quick: 68.0 s (limit 45.0 s)" and "over the time limit", with every command passing.
- The ASCII gate command in `agents/spec.md:99` names `bin`, which does not exist in this tree; the gate was run without it.
- Item 4 names `tree.ts` or `instance.ts` for the pure functions; they are in `pages.ts` (judgment call 1).
- Item 9 does not name the clause of `docs/window.md` line 33 that the change makes false, nor the two doc comments of `tab-menu.ts`, and its dictated wording for `reset_all_tip` and the `PagesReset.svelte` comment left out the shipped floats (ruling 3 of round 1 replaces it); all are rewritten.
- Case 11 and case 16 print `(screen)=[]` on the page left: the stated result, one empty pane.
