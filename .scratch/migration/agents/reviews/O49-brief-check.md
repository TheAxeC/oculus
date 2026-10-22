# Brief check: O49

Brief check of O49 (`.scratch/migration/agents/briefs/O49.md`, on disk), read against main at f4247cac64f6925c7c9af8bc543116fd801ded86 (`git log -1 --format=%H`). Nothing was written.

Note on the inputs: `.scratch/migration/plan.md` has no Goal section. `grep -n -i "goal" .scratch/migration/plan.md` gives only lines 320 and 1078, and neither is a goal of this plan. For check 5 I used the goal the prompt gives: an Open View submenu as rulings 202 and Open View unique describe it.

## Names

Commands:
- `git grep -n "stripMenu" -- ':!config/local.yml' ':!.scratch'`
- `git grep -n "stripPicked" ...`
- `git grep -n "PaneView" ...`
- `git grep -n "New Text File\|Open File\.\.\.\|editor group menu\|strip's menu\|strip menu" -- src docs README.md config ':!config/local.yml'`
- `grep -rn "strip_open_view\|Open View\|open_view" src config docs README.md tests`
- `grep -rn "hint:" src/lib`

Hits outside "Paths this step writes":

1. `stripMenu`: PaneView.svelte:44, 59 and 256, and pane-view.ts:309. All are inside the write list, so there is no hit outside it.
2. `stripPicked`, pane-view.ts:265: "Whether an item of a pane menu is one of the float items, which run through stripPicked." This is outside the range 296-394. The change does not make it false, because float items still go through `stripPicked`.
3. `stripPicked`, pane-view.ts:435 (the definition) and :434 ("Run a pick from the strip's menu over the pane's active tab, its path and its page."). Outside the range. Not false, since Open View picks are only "a pick", not every pick.
4. **pane-view.ts:1-5, the head comment: "...and the right-click menu of a pane's strip and of an empty pane's body, VS Code's editor group menu, with what each of its picks runs".** This is outside the write range (296-394). Under item 5 the Open View picks run in `strip/open-view.svelte.ts`, not in pane-view.ts, so "what each of its picks runs" becomes false. Fixing it widens the write list by lines 1-5 of pane-view.ts.
5. **src/lib/ui/menu/menu-items.ts:23, `MenuItem.hint`: "The keys that run the choice, drawn muted at its end, as VS Code's menus write them."** This is not in the write list. Every `hint` on a `MenuItem` in the tree today is a key hint (`grep -rn "hint:" src/lib`: chords.ts:135 and :150, suggest.ts:94, strip.ts:77, and row-menu.ts and picks.svelte.ts give "key hints"). Item 4 puts a page label or "Floating pane" in `hint`, so this doc comment becomes false. spec.md:70 calls that "a defect of the change". Fixing it widens the paths.
6. `PaneView`: FloatLayer.svelte:7, 17, 32 and 152; FloatWindow.svelte:7, 16 and 51; FoldedPane.svelte:5; PageArea.svelte:3, 21, 52 and 70; PageLeaf.svelte:17, 82 and 108; StripSaid.svelte:2; tests/views/sources/ActionsHost.svelte:2; bar-actions.test.ts:3. None becomes false. If item 5's split happens, StripSaid's "shell partial of PaneView.svelte" still holds.
7. "open-view" and "Open View": src/desktop/windows/menu-template.ts:231 (`run('open-view', t('desktop.menu.open_view'))`), src/lib/shell/window/menu-answer.ts:76 (`'open-view': (page) => page.colon('tab')`), src/lib/data/helpers/keys/oculus/menu-commands.ts:37, and config/text/desktop.yml:58 (`open_view: Open View...`). The change makes none of them false. The desktop View menu already has "Open View...", which opens the palette's tab mode. After the step, two menu items share those words and do different things. The ruling dictates the words, so this is for awareness only. The new file name `open-view.svelte.ts` also shares the token `open-view` with that command id.
8. `ui.strip_open_view`: no hit. The HELP.md subject "Open View": no hit in `docs/`.
9. Other descriptions of the strip menu outside the write list stay true: tab-menu-state.svelte.ts:3, 41-44 and 164; PaneBody.svelte:84 and 335; PaneStrip.svelte:31; FloatLayer.svelte:54; FloatWindow.svelte:22; PageArea.svelte:35; config/defaults/appearance.yml:206; pane-view.ts:169-175 and 402-403. Each describes a part, or a pick going back to the pane, and none claims a complete list of items.
10. Adjacent, not made false by the step: docs/HELP.md:64 says "Eleven views exist once: Settings, Focus, Usage, Live HPC, Audit, Findings, History, Processes, Pages, Workbenches and Status". `grep -rln "unique: true" src/lib/views` gives 12 files, Apps.svelte (id `apps`, `unique: true`) among them. The new bullet sits nine lines below and is about unique views. This is outside the step and is reported for the session.

## The step line

Commands: `grep -n '^- O49 ' .scratch/migration/plan.md` (line 668); `grep -n "Open item 202\|Open View unique" .scratch/migration/plan.md` (lines 2404 and 2405).

Mapping of each part of the line to "What to build":
- "an "Open View" submenu": item 1.
- "grouped by rail page": item 2.
- "in the tab strip's and the empty pane's right-click menus": item 1, with the premise that the two are one `stripMenu`, and C1/C2.
- "opening the picked view as a tab in that pane": item 3.
- "the views apps add included": item 2 and C4.
- "a unique view open elsewhere is listed with its holder's page as the hint": item 4 and Decision 5.
- "and the pick goes to it there": item 4.
- Ruling 202 (b), any right-click inside a view: rejected by the ruling and not built. (c), the empty pane only: superseded, since both menus are built.
- Ruling Open View unique (b), moving the view into the pane: item 4 leaves the pane as it is. (c) greyed and (d) hidden: item 4 lists the view enabled.

Findings:
1. No part of the line is without a requirement.
2. Item 2 builds more than "grouped by rail page", and Decisions does not list it. Item 2 takes every section of `arrange(... readGroups(config) ...)`. That includes Float, which `readGroups` reads from `nav_groups:` (`config/defaults/layout.yml:26-27`) and which is no rail page, and the trailing section with `label: null`. Decision 3 covers the label-null section; nothing covers Float. spec.md:18 asks for a departure from a ruling to be reported as a decision.
3. "Tab strip's right-click menu" is read as the strip's empty area only, and a right-click on a tab keeps the tab's own menu (premise at line 12, C10). That reading is stated as a premise, not as a decision.

## Premises

1. Head is f4247cac: holds (`git log -1 --format=%H`).
2. `ls docs/adr` gives "No such file or directory": holds. `standards: [.scratch/migration/agents/spec.md]` is at orchestrator-state.md:11 and .agents/plan.yaml:6.
3. `grep -n "stripItems\|stripPick" src/lib/shell/panes/PaneView.svelte src/lib/shell/panes/strip/tab-menu-state.svelte.ts` gives PaneView 61, 255, 273, 278, 327, 328, 373, 471 and 472, and tab-menu-state 42, 44, 82 (`if (at < 0) return deps.stripItems();`) and 164. This holds, with small range slips: `stripItems` is lines 254-269 (the brief says 255-271; 271 is `const openText`), `stripPick` is 273-298 (brief: 273-296), and `stripPicked` in pane-view.ts is 435-461 (brief: 435-460). `stripMenu` 309-394 and its doc comment 296-308 are exact (`grep -n "^export function stripMenu..."`). `wc -l` gives pane-view.ts 536.
4. `sed -n 105,215p src/lib/ui/menu/MenuList.svelte | grep -n MenuList` gives "101: <MenuList": holds. The hint is drawn at MenuList.svelte:108-109.
5. Catalogue.svelte: `grep -n` gives 108 `readGroups(merged)`, 111 `listedViews(views())` and 112 `arrange(listed, groups, docs)`. Holds (the brief says 106-112). Catalogue.svelte is 409 lines.
6. catalogue.ts: `grep -n "^export function ..."` gives arrange 183, groupGlyph 263, readGroups 283 and listedViews 381. Holds. layout.yml:26-27 holds.
7. registry.ts: unique at 122, registrationLabel 173, registrationGlyph 186 and views() 289. Holds. The brief says an app's view is registered "through `registerView`". The registrations are actually built in src/routes/views.ts (`registrationOfApp` :117-133 and `registrationOfView` :147-166, group `'apps'`). `registrationOfView` sets `listed: row !== undefined && appActive(row)` and a `heading`/`headingKey` (the container's title). The brief does not mention either.
8. opening.ts: openInPane 188-195, heldInstance 399-402 and showHeld from 423 (the brief says "from line 420"; the doc comment starts at 416). layout.svelte.ts:820-821 is `openView: ... revealed(placed.openView(...))`. instance.ts findInstance 302-312 and panes 277-291. model.ts Page 131-139 and the Float comment at 185-189. All hold.
9. `grep -n "strip_\|float_label" config/text/ui.yml` gives 31 `float_label: Floating pane`, 81 `strip_open_file: Open File...`, and no `strip_open_view`. Holds. FloatLayer.svelte:135 uses `ui.float_label`: holds.
10. `wc -l` gives PaneView.svelte 510 and pane-view.ts 536. `ls src/lib/shell/panes | wc -l` gives 10 and `ls src/lib/shell/panes/strip | wc -l` gives 9. Holds.
11. **Differs.** `grep -n "pane-view\|stripMenu\|catalogue.ts\|opening.ts" .scratch/migration/agents/guarded.md` gives one hit at **line 105**, not 82. Line 105 is "Code: `src/lib/state/workbench/layout/open/armed-keep.svelte.ts`, `openRow` in `src/lib/views/shared/explorer/opening.ts`, ..." and matches on "opening.ts". It is not the close question's tests. The conclusion (no entry covers the strip menu) still holds. `grep -rln "stripMenu\|stripPicked" tests` gives nothing (exit 1): holds. Also `grep -rln "PaneView\|panes/pane-view" tests` gives only tests/checks/imports/graph.ts and the two sources test files, none of which mounts PaneView.
12. HELP.md lines 72 and 75: hold (`sed -n 60,80p docs/HELP.md`).
13. **Differs.** "No step in flight writes these paths". The brief's grep `grep -ln "config/text/ui.yml\|pane-view\|PaneView\|shell/panes/strip" O50* O62* O52*` gives nothing (exit 1), but the pattern leaves out `docs/HELP.md`. O50.md's "Paths this step writes" includes "`docs/HELP.md` lines 280-314" (`awk '/^## Paths this step writes/...' O50.md`). O49 writes docs/HELP.md 75-76. The ranges are disjoint, but the file is shared and `shared_paths:` must name it.
14. **Differs (consequence of the verify list).** O50, O52 and O62 list `docs/diagrams/` and run `npm run diagrams && npm run test:quick` (O52.md:63 and :105, O50.md:111 and :155, O62.md:24 and :102). O49's write list has no `docs/diagrams/`, and its verify item 1 has no `npm run diagrams`. `docs/diagrams/layer-shell.dot` counts the imports per folder ("folder shell/panes to layer state" [label="53"]), and `grep -rn "navigation/catalogue" src/lib/shell/panes` gives no hit today. A new module under shell/panes that imports catalogue.ts very likely changes that count; this is a judgment, settled by running `npm run diagrams` in the worktree. The orchestrator-state dispatch block at :41 and :71 shares `docs/diagrams/` among the other steps in flight.
15. Decision 3's grep, `grep -rhoE "^\s+group: '[^']+'" src/lib | sort | uniq -c`, does not reach every registration. It misses src/routes/views.ts (group `'apps'` and `''`) and the Collection factory (`COLLECTION_PLACES[id] ?? { group: 'registries', ... }`, Collection.svelte:14). The places those give are academic, literature and registries (`grep -A25 COLLECTION_PLACES left-out.ts`), and the `''` group belongs to the two `listed: false` registrations (views.ts:169-185). So the conclusion "that section is empty" holds for the shipped tree. An app view always names `apps`.
16. The base copy `.agents/worktrees/migration-O49-base` does not exist yet (`ls`: No such file or directory). This matches the brief, which says it is made at preparation.

## Cases and checks

1. Verify item 1 does not follow spec.md:26. spec.md requires "`npm run diagrams` runs right before each run of the list". The brief says only `npm run format`, then `npm run test:quick`. It also drops "that file rerun alone" and the count of whole-suite commands. See Premises 14.
2. Verify item 5 does not follow spec.md:44. The spec's word list adds 'the step adds' and 'after this package lands'; the brief's list stops at 'previously'.
3. The brief does not say what spec.md:71 asks the report to state for the new pick-id prefix and for the key `ui.strip_open_view` (empty, duplicated, colliding with a reserved key), or for a pick made after the menu's facts changed. spec.md binds the step anyway, but the Report section does not ask for it.
4. Cases that ask the builder to check places the step does not change:
   - C10: "the pane menu (`...`) is unchanged" (`paneMenu`, pane-view.ts:140-165, outside 296-394) and "the tab's own right-click menu is unchanged" (`strip/tab-menu.ts` and `tab-menu-state.svelte.ts`, not written).
   - C1: "as the Views view lists them" (Catalogue.svelte, not written).
   - C11: "as the Views view does not list it" (Catalogue.svelte).
   - C4: "under the group the Views view lists it under".
   Each is a read-only comparison.
5. No other case conflicts with spec.md. The checking by reading and the look on landing match spec.md:64-65. "No case becomes a test" matches spec.md:59 (the guarded entry search, Premises 11).

## The question

1. C1: it can pass without the goal only on a reading of the code. It is taken on screen at landing and names the 14 groups, so it discriminates.
2. C2: it can pass by reading, since `PaneBody` gets `items={stripItems}` (PaneView.svelte:471). It is taken on screen.
3. C3: no. It names a view that is open elsewhere and asks for a new tab in P, which tells `openInPane` apart from `openView`.
4. C4: yes. It names no app. If TEST has no app that contributes a view, the case passes with nothing to see. It needs a named app present on TEST, or the app's own view (views.ts `registrationOfApp`, group `apps`).
5. C5: no. It names the view, the holder, the hint and "P gains no tab".
6. C6: no. It names Usage in the docked float (layout.yml:222).
7. C7: yes. It names no view. On the shipped layout the unique views are placed by the arrangements and floats, so the look must first close one, and the case does not say which. Otherwise it passes with nothing to see.
8. C8 and C9: no. Each names the pane kind and the result. `openInPane` does not read `locked` (`grep -rn "locked" opening.ts tree.ts`: only tree.ts), so C9 holds once item 3 holds.
9. C10: no; it is a reading against the base.
10. C11: no for a `listed: false` registration of a view. It does not name an app view that is unlisted because its app is not active (views.ts:159), which is the likelier instance of `listed: false` among app views.
11. Verify item 1: yes. The list can pass while the committed diagrams no longer match the source (Premises 14).
12. Verify items 2-4: no. Each is a fact a command computes.
13. Verify item 5: yes. It can pass with "the step adds" in a comment (Cases and checks 2).
14. Item 1: no.
15. Item 2: partly. It can pass with Float listed as if it were a rail page (The step line 2). Contributed app views lose the container subtitle the Views view draws (Catalogue.svelte head comment: "A view an app contributes is listed under the title of its container"). Two views with the same name in Apps would then read the same.
16. Item 3: yes. It says to use `openInPane` for "a view that is not a unique view held by a page or float" but not when that is decided. The strip menu is a snapshot taken at right-click (`tab-menu-state.svelte.ts:82` returns `deps.stripItems()` into the open menu). A unique view opened elsewhere after the menu was drawn (every browser tab and app window shares the layout, HELP.md:62) and then picked from the stale item would get a second instance through `openInPane`. `openInPane` makes "a new instance of a view ... whatever the page already holds" (opening.ts:79-82). The goal, "the pick goes to it there", is then not reached.
17. Item 4: yes, in two ways. (a) The same pick-time gap as item 3, in the other direction: a view held at drawing time and closed before the pick goes to `openView`, which opens it where views land rather than in P. (b) The holder's page is found by a second search over `pages()` with `findInstance`. `heldInstance` uses `holderOf`, which searches the pages drawn on screen first, then the floats, then the other pages (opening.ts:388-397), through `heldView` (float/pages.ts:172-181, exported, with `hostsOf`/`isPage` in layout/index.ts). For one view held twice, the hint and the pick can name different holders. spec.md:87 ("a fold exists once and is reused") points at `heldView(hostsOf(...), view)`, which the brief does not name.
18. Item 5: no.
19. Item 6: yes. It can pass while pane-view.ts:1-5 and menu-items.ts:23 stay false (Names 4 and 5).

## Implied inputs

Each item below gives the input and the expected result; where it says missing from Cases, there is no case for it.

1. The hold state changes between the right-click and the pick (another window or browser tab opens or closes a unique view while the menu is open). Expected: the pick asks `heldInstance(view)` again at pick time. A held view goes to `openView`; a view no longer held opens in P through `openInPane`. A second instance of a unique view is never made. Missing from Cases. The wrong answer breaks the "held once" rule (registry.ts:117-121).
2. A registration is removed while the menu is open (an app disabled or removed, a collection key dropped). Expected: the pick opens nothing when `viewFor(view)` is undefined. Missing. The wrong answer leaves a tab whose view the registry lacks, drawn as "the tab says so and the body is empty" (PaneView.svelte:5-7).
3. The pane is on a page drawn inside another page (PageLeaf.svelte:82 passes `page={of}`). Expected: the view opens in that inner page's pane at `path`. Missing. A wrong `page` (the outer page) opens in a wrong pane or nowhere (`openInPane` returns '' for a pane the page lacks).
4. A unique view is held on a page drawn inside another page. Expected: the hint is the inner page's label (the page whose own tree holds it), and the pick shows it through `showHeld`'s hops (opening.ts:423-432). Missing.
5. A unique view is held by the very pane the menu is on, or by its page. Expected: the hint names that page, the pick activates the tab where it is, and P gains no second tab. Missing; low cost.
6. Two app views with the same `words` in the Apps group, from different containers or apps. The Views view tells them apart by the container subtitle (views.ts:163-164). Expected: not settled by either ruling, so it is a user-visible decision (spec.md:18). Missing from Cases and from Decisions.
7. An app view that is unlisted because its app is not active (views.ts:159). Expected: not listed. C11 covers it in principle but names a view "opened only for something"; add the app case to C11's reading.
8. A unique view held in a float placed in a desktop window. Expected: the hint is "Floating pane" and the pick activates it in that window (`activateFloated`). Missing; low cost.
9. The config is not loaded yet (`readGroups(undefined)` returns [], catalogue.ts:284). Expected: every listed view in one flat section with no heading, as the Views view would draw it. Missing; low cost.
10. Several floats each holding a unique view: every hint reads "Floating pane". This is Decision 5's consequence; no case needed.
11. Two pages with the same label, so the hint is ambiguous. The ruling only asks for the page to be named; low cost; no case needed.
12. A registry group with no listed view: `arrange` leaves it out (catalogue.ts:197). No case needed.

## ADRs

1. `ls docs/adr` gives "No such file or directory". `grep -n "adr" .agents/plan.yaml` gives nothing (exit 1). `git ls-files | grep -E '(^|/)[0-9]{4}-[^/]*\.md$'` gives nothing. No ADR exists, so none is touched.

## Dictated text

1. `grep -n 'with the value \`Open View\`' .scratch/migration/agents/briefs/O49.md` gives line 30: the key `strip_open_view` in `config/text/ui.yml`, after `strip_open_file`, with the value `Open View`. Holds: ASCII, one line, the group `ui:` where it already is (ui.yml:3), the alphabetical run of `strip_*` keys (ui.yml:75-87) kept, and its reader is `stripMenu`.
2. `grep -n '"Everything in the brief is done"' ...` gives line 124, the report's first line. Holds (spec.md:82).
3. `LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O49.md` gives nothing, so the brief is ASCII.
4. The HELP.md bullet (item 6) and the new module's head comment (item 5) give requirements, not words, so they are not dictated.

## Declined to judge

1. Whether `npm run diagrams` actually changes `docs/diagrams/` for this step. Running it writes files, which this check may not do. The count edges and the missing catalogue import make a change likely; that is a judgment.
2. Whether a collection view whose key no hub lists can be registered and listed, and so be opened by Open View into a tab that `leftOutTabs` hides (PaneView.svelte:160). `pushedCollections` (views.ts:60-63) filters by hubs, but I did not trace `workspaceCollectionKeys` to the end.
3. Whether every rail group in C1 has a listed view on Axel's TEST hub at the moment of the look. The shipped registrations give each of the 13 groups and `float` at least one view (`grep -rhoE "^\s+group: '[^']+'" src/lib | sort | uniq -c` plus the Collection places), and the hub's `.oculus/config.yml` has no `rail:` or `nav_groups:` (`grep -n "^rail:\|^nav_groups:\|^docs:"`: only `36:docs:`). I did not check the `listed` flag of every one.
4. The cost of re-deriving the Open View tree in every pane's `$derived` `stripItems` on each layout change. Not measured.

Usage: ab729638069c01a99, claude-opus-5-5, 215648 tokens, 83 tool uses, 9 min 38 s


## Closed

- Names 1-3, 6, 8, 9: no change; nothing made false.
- Names 4: the head comment of `pane-view.ts` (lines 1-5) added to item 6 and to the write list.
- Names 5: the doc comment of `MenuItem.hint` (`menu-items.ts:24`) added to item 6 and to the write list; the premise names it.
- Names 7: the desktop View menu's "Open View..." named as a premise; the ruling gives the new item its words, so both stay.
- Names 10: `docs/HELP.md:64` ("Eleven views exist once") added to item 6 and to the write list, since the step's bullet sits in that section and is about those views.
- The step line 1: none.
- The step line 2: Decisions 7 (Float listed after the rail pages) added, and item 2 names the groups.
- The step line 3: Decisions 8 (the strip's empty area; a tab keeps its own menu) added.
- Premises 3, 5, 8: the line ranges corrected (`PaneView.svelte:254-269`, `273-298`, `pane-view.ts:435-461`, `Catalogue.svelte:108-112`, `showHeld` from line 423).
- Premises 7: the premise rewritten to `registrationOfView` in `src/routes/views.ts:147-166` with `listed` and `heading`; read list item 8 added.
- Premises 11: corrected to line 105 and what it names.
- Premises 13: the shared `docs/HELP.md` with O50 (lines 280-314 against 64 and 75-76) named; `shared_paths` names it in the dispatch entry.
- Premises 14: `docs/diagrams/` added to the write list, item 7 added, and `npm run diagrams` put before the list in Verify 1.
- Premises 15: no change; the conclusion holds.
- Premises 16: no change; the base copy is made at preparation.
- Cases and checks 1: Verify 1 rewritten to `spec.md`'s form (diagrams, one-file rerun, the count of whole-suite runs).
- Cases and checks 2: Verify 5's word list completed.
- Cases and checks 3: Verify 7 added (empty, duplicated, colliding prefix and key); the stale pick is item 3's requirement and C12.
- Cases and checks 4: C1, C4, C10 and C11 rewritten to state the expected result without a comparison with places the step does not change.
- The question 4: C4 names the Apps view and the installed apps' views.
- The question 7: C7 names Live HPC.
- The question 10: C11 names an app's view whose app is not active.
- The question 11 and 13: closed by Cases and checks 1 and 2.
- The question 15: Decisions 9 (container title as hover words) added to item 2.
- The question 16 and 17 (a): item 3 decides the hold at the pick; C12 added.
- The question 17 (b): item 4 takes the holder from `holderOf` through a function beside `heldInstance`, so the hint and the pick name one holder; `opening.ts` and `layout.svelte.ts` ranges added to the write list.
- The question 19: closed by Names 4 and 5.
- Implied inputs 1: C12. 2: item 3 and C13. 3: item 3 and C14. 4: C14. 5: item 4 and C15. 6: Decisions 9. 7: C11. 8: C16. 9: C17. 10-12: no case needed, as the check says.
- Dictated text: holds; no line rewritten or added.
- The paths compared again after these changes with the briefs of O50, O52 and O62: `docs/HELP.md` with O50 (disjoint ranges) and `docs/diagrams/` (regenerated at each landing) are shared, simple to merge; no other path is shared.
