# O49 builder report: the Open View submenu in the strip's and the empty pane's right-click menu

Everything in the brief is done, under the brief and the ruling file `agents/briefs/O49-cases.md`. The orchestrator should know about four points before landing:
- The verify list ran once, before a final edit that changed two comment lines in `src/lib/shell/panes/strip/open-view.svelte.ts` and nothing else. That file alone was checked again after the edit (see the table).
- The list reported going over its time limit, with every command passing.
- One line outside the write list, `docs/apps.md:263`, is named under "Outside the write list".
- The brief's line number for the "Eleven views" sentence is off by one.

## Open items of the state file, verbatim (copied from `orchestrator-state.md` lines 193-205 in the worktree)

- Open item 240 (2026-10-22): how the landing's check follows the standing demand "Only related tests at a landing". The `land` skill's `land.sh` runs the plan's verify list, `npm run test:quick`, on main; that list runs the essential list `tests/tiers/essential.txt`, tests related to no changed file, and leaves out the related tests under `tests/checks` and the ones tagged slow (`tests/tiers/quick.mjs:1-28`, `:203-205`, `:272`).
  - (a) `tests/tiers/quick.mjs` gains a related-only selection (no essential list; the related and changed tests under `tests/checks` and tagged slow included; no 45 s limit), and it becomes the verify list for builders, reviewers and the landing alike. Pro: one command, `land.sh` follows the demand unchanged, builders' runs get shorter too. Con: builders and reviewers lose the essential list as a wide net.
  - (b) The same selection, used at the landing only, `verify:` kept as it is for builders and reviewers. Pro: builders keep the essential net. Con: `land.sh` always runs `verify:`, so the landing replays the script's steps by hand with the other command, departing from the skill's script at every landing.
  - Recommendation: (a). The lazy option is to keep `npm run test:quick` at the landing as it is, which breaks the demand and is not offered. The change to `quick.mjs` lands at the first landing after the ruling.
- Open item 241 (2026-10-22): where the landing's tests run. Standing demand Z492 says the landing gate never runs in main's checkout but in `.agents/worktrees/gate`; the `land` skill's `land.sh` runs its check on main, and the landings of O58, O59 and O62 ran on main (plan.md, their bookings: "Verification on main").
  - (a) On main, as `land.sh` does; Z492 retired. Pro: the skill's own script, and related tests take seconds. Con: main's checkout is the one Axel's server on 8790 runs from, and the test run's `svelte-kit sync` rewrites its `.svelte-kit` types.
  - (b) In the gate worktree, as Z492 says, the staged change then copied to main. Pro: Axel's running server never sees a test run. Con: every landing applies the range twice and keeps the gate's `node_modules` current, outside `land.sh`.
  - Recommendation: (b), since it ends the cause Z492 was written for. (a) is the lazy option.

## The cases' first run, on the unchanged tree

Read on the base copy; no browser driven. A right-click on the strip's empty area reaches `tabMenu.read` (`PaneView.svelte:432` at the base), which answers `deps.stripItems()` for no tab (`strip/tab-menu-state.svelte.ts:82`). A right-click in an empty pane's body draws `PaneBody`'s `ContextMenu` with `items={stripItems}` (`PaneView.svelte:471`, `PaneBody.svelte:337`). `stripItems` is `stripMenu(...)` (`PaneView.svelte:255-269`), and its first group is `[Open File..., New Text File]` (`pane-view.ts:343-346` at the base). `config/text/ui.yml:75-87` held no `strip_open_view` key. A pick goes to `stripPick` (`PaneView.svelte:273-298`), and then to `pick` or to `stripPicked` (`pane-view.ts:435-461`); neither has a branch for an Open View id.

- C1 (strip of a pane with tabs): unmet. No Open View item and no submenu.
- C2 (empty pane body): unmet. The same `stripItems` with the same first group.
- C3 (Files opens as a new tab of P): unmet. There is no item to pick.
- C4 (Apps submenu): unmet. There is no submenu.
- C5 (Settings, hint "System"): unmet. No item and no hint.
- C6 (Usage in the docked float, hint "Floating pane"): unmet. No item.
- C7 (Live HPC held nowhere, opens in P): unmet. No item.
- C8 (a float's strip): unmet. A float's pane builds the same `stripMenu` with `float` set (`PaneView.svelte:260`), and the first group is unchanged.
- C9 (a locked pane): unmet. No item; `locked` changes only Lock or Unlock (`pane-view.ts:362-364`).
- C10 (no other item moves): holds on the base, which is its reference (`pane-view.ts:342-393`).
- C11 (an unlisted view is left out): unmet as a case, since there is no submenu.
- C12 to C17: unmet. No item and no pick.

Case the brief's rules got wrong: C13. Item 3's rule opened nothing only for `viewFor(view)` undefined. A disabled or unapproved app keeps its views registered with `listed: false` (`src/routes/views.ts:160`, `appActive` in `src/lib/data/helpers/files/apps/apps.ts:18-19`), so under that rule the view would have opened in P.

The ruling (`O49-cases.md`):
1. The pick opens nothing when `viewFor(view)` is undefined or the registration's `listed === false`, the test of `listedViews`.
2. A unique view held by an unnamed page has the hint `t('ui.page_default', at + 1)`; a hint is never empty.
3. Item 2 is built as written, and the Apps group includes each app's own entry (`registrationOfApp`); C4 is read with those entries in it.
4. A page is told from a float by whether the holder's id is among `pages()`.

First run of the cases the ruling changes, on the base: C13 unmet (no item); C14 with an unnamed inner page unmet (no item); C4 with the apps' own entries unmet (no submenu).

## Cases after the change

Each case is read through the changed code; the orchestrator looks at C1 to C11 on TEST.

- C1: met by reading. `PaneView.svelte:256` makes the module, and `:270` hands `viewOpener.item()` to `stripMenu`, which places it third in the first group (`pane-view.ts:347-351`). The submenu comes from `item()` (`open-view.svelte.ts:88-108`), `arrange(listedViews(views()), readGroups(configMap()))`. That gives one section per rail entry in the rail's order (`catalogue.ts:283-303`): Focus, Projects, Incoming, Sessions, Explorer, Academic Life, Pillars, Registries, Literature, Present, Apps, Help and System, as `config/defaults/layout.yml:10-22` lists them, then Float from `nav_groups` (`:26-27`). Each section is a submenu item with the group's label, `groupGlyph`, and its views in `arrange`'s order (`:94-103`). Every rail group holds at least one listed registration on the tree (`grep -rln "group: '...'" src/lib/views` with `listed: false` counted per file).
- C2: met by reading. `PaneBody` gets the same `stripItems` (`PaneView.svelte:477`) and its picks go to `stripPick` (`:478`), whose first line is `if (viewOpener.picked(id)) return;` (`:279`).
- C3: met by reading. `picked` (`open-view.svelte.ts:116-124`) finds `files` registered and listed. It is no unique view, so `heldHost` answers null (`opening.ts:411-413`), and `openInPane('files', undefined, page, path)` opens a new instance as the pane's active tab (`opening.ts:188-195`, `openInstance`), whatever other Files tab is open.
- C4: met by reading, with the ruling's reading. The Apps section lists what `arrange` gives under group `apps`: the Apps view, each app's own entry and each listed contributed view, in `order` (`views.ts:116-133`, `:147-166`). Each item carries `registrationLabel` (the view's `words`) and `registrationGlyph` (the app's `glyphName`). An item with a container subtitle carries it as `title` (`open-view.svelte.ts:79-83`, `registrationHeading`). A pick opens the view in P through `openInPane` (`:122`).
- C5: met by reading. Settings is unique (`Settings.svelte`, `unique: true`) in group `views`, listed under System. `holderWords` (`open-view.svelte.ts:61-69`) finds its holder through `heldHost`, which is `holderOf(view)?.host` (`opening.ts:411-413`). The holder is a page among `pages()`, so the hint is that page's label. A pick sees `heldHost` non-null and calls `openView('settings')` (`:121`), which shows it where it is held (`opening.ts`, `openInto` then `showHeld`); P gains no tab.
- C6: met by reading. Usage is unique and held by the shipped float (`layout.yml:222`). `holderOf` searches the floats after the drawn pages. The float's id is not among `pages()`, so the hint is `t('ui.float_label')`, "Floating pane" (`open-view.svelte.ts:66`). A pick calls `openView`, whose `showHeld` runs `activateFloated` for a non-page host.
- C7: met by reading. With no holder, `heldHost` is null: no hint, and the pick opens through `openInPane` in P.
- C8: met by reading. A float's pane has `page` set to the float's id (`PaneView.svelte:143-148`, `float` at `:169`). `openInPane` takes a float's id through `access.at(page)` (`opening.ts:188-190`).
- C9: met by reading. `openInPane` does not read `locked` (`grep -n "locked" src/lib/state/workbench/layout/open/opening.ts`: no line), and the item is offered whatever `locked` is (`pane-view.ts:347-351`).
- C10: met by reading. The only change to `stripMenu`'s body is the third entry of the first group (`pane-view.ts:350`, `facts.openView`); the other groups and their rules are as at the base (`diff` of `pane-view.ts` against the base: the head comment, the doc comment, the fact and that entry).
- C11: met by reading. `listedViews` drops `listed: false` (`catalogue.ts:381-383`) before `arrange` (`open-view.svelte.ts:91`). That covers the views opened only for something and an app's view while its app is not active (`views.ts:160`).
- C12: met by reading. `picked` reads `heldHost(view)` at the pick (`open-view.svelte.ts:121`) and never reads the drawn hint. Settings closed elsewhere before the pick gives `heldHost` null, so the view opens in P through `openInPane`, which makes the only instance. Live HPC opened elsewhere before the pick gives `heldHost` non-null, so `openView` shows it there and P gains no tab.
- C13: met by reading, under the ruling. `picked` returns at `:120` when `viewFor(view)` is undefined (an app removed) or `listedViews([registration])` is empty (an app disabled or its approval withdrawn, `listed: false`). Nothing opens.
- C14: met by reading. The inner page's pane has `page` set to the inner page (`PaneView.svelte:143-148`), so `openInPane` opens there. `heldView` finds an instance only in a host's own tree (`findView`), so the holder of a view held on the inner page is the inner page. The hint is its label, or `Page N` when it has none (`open-view.svelte.ts:67-68`, ruling 2).
- C15: met by reading. The hint is the holding page's label. A pick calls `openView`, which activates the held tab where it is (`showHeld`), so the pane gains no second tab.
- C16: met by reading. A float in a window of its own is in `floats`, not in `pages()`, so the hint is "Floating pane". A pick calls `openView`, and `showHeld` activates the tab in that float (`activateFloated`).
- C17: met by reading. Until the config message, `configMap()` is `{}` (`selectors.svelte.ts:228-230`), and `readGroups({})` gives `[]`: `readRail(undefined)` gives no entries (`rail.ts:117-118`), and `nav_groups` is not a map. `arrange` then puts every listed view in one section with `label: null`, which `item()` lists directly in the Open View submenu with no group heading (`open-view.svelte.ts:104-107`).

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| 1. Open View item, third in the first group, key `ui.strip_open_view: Open View` | DONE | `pane-view.ts:347-351`, `config/text/ui.yml:82` |
| 2. Submenu by `arrange` sections, loose views after, app headings as `title`, no docs | DONE | `open-view.svelte.ts:75-108` |
| 3. Pick decided at the pick: `openInPane` in this pane, nothing for an unheld or unlisted view | DONE | `open-view.svelte.ts:116-124` |
| 4. `heldHost` beside `heldInstance`, on the store; page label, `Page N` or "Floating pane" | DONE | `opening.ts:93-98`, `:411-413`, `:500`; `layout.svelte.ts:216-217`, `:830`; `open-view.svelte.ts:61-69` |
| 5. New module `strip/open-view.svelte.ts` with head comment and its own pick prefix | DONE | `open-view.svelte.ts:1-12`, `:31` |
| 6. Comments and HELP made true | DONE | listed under "Comments and pages" |
| 7. Diagrams regenerated | DONE | `npm run diagrams` printed the written files; `layer-shell.dot` 53 to 56, `layers.dot` 184 to 187 |
| Verify 1: `npm run format`, then `npm run diagrams && npm run test:quick` | DONE, once | quoted below |
| Verify 2: ASCII gate | DONE | printed nothing, exit 0 |
| Verify 3: sizes and folder | DONE | `wc -l`: PaneView.svelte 516, pane-view.ts 541, open-view.svelte.ts 127; `ls src/lib/shell/panes/strip \| wc -l`: 10 |
| Verify 4: unused exports | DONE | `diff` of the base's `unused-exports.txt` with `sh utils/unused-exports.sh` after the change printed nothing, exit 0 |
| Verify 5: history-word grep | DONE | no hit |
| Verify 7: keys | DONE | under "Keys" |

The verify list as printed (`npm run format` exit 0, then `npm run diagrams && npm run test:quick`):

```
test:quick: 14 changed file(s), from git since HEAD
test:quick: 24 test file(s), 7 essential
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.4 s)
ok      eslint (13.6 s)
ok      svelte-check (40.6 s): 1792683676602 COMPLETED 535 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (61.1 s): Duration  47.33s (transform 127.06s, setup 0ms, import 161.12s, tests 3.33s, environment 1.10s)
test:quick: 63.7 s (limit 45.0 s); every command passed
test:quick: over the time limit
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
```

After the list, two comment lines of `open-view.svelte.ts` were reworded (the doc comment of `picked` and the comment above `arrange`), and nothing else changed. That file was then checked on its own:
- `npx prettier --check src/lib/shell/panes/strip/open-view.svelte.ts` printed "All matched files use Prettier code style!".
- `npx eslint` on that file exited 0.
- The ASCII check exited 0 with no output.
- `awk 'length>100'` printed nothing.
- The history-word grep over its comment lines exited 1, with no hit.

The type check and the tests are unaffected by a comment.

ASCII gate (the brief's command over the eight files) printed nothing, exit 0.

History-word grep: the added and changed comment lines of the five changed source files, from `diff` against the base, and every comment line of `open-view.svelte.ts`, were grepped case-insensitively for before, used to, no longer, still, always has been, always had, as before, previously, the step adds and after this package lands. There was no hit (exit 1). No test title was added or changed.

Runs: the verify list ran 1 time. Whole-suite commands: none. Other test runs while building:
- `npx vitest run tests/checks/tree/boundaries.test.ts tests/shell/panes/strip/tab-menu.test.ts tests/state/workbench/layout/saved/layout-saved.test.ts tests/state/workbench/navigation/pages.test.ts` ran once.
- `npx vitest run tests/checks/tree/boundaries.test.ts` ran twice; its last run: "Tests 11 passed (11)".

That test file holds the shell's store rule (`SHELL_STORES`, `boundaries.test.ts:520`), which the module keeps by reading the config through `selectors.configMap`. No test was added or changed: no entry of `agents/guarded.md` covers the strip menu.

## Keys

- Pick prefix `open-view:` (`open-view.svelte.ts:31`).
  - Empty: a pick `open-view:` with no view id asks `viewFor('')`. The registry holds no such view, so nothing opens (`:119-120`).
  - Duplicated: each registration is in one section of `arrange` (`catalogue.ts:183-207`), and the registry is a map keyed by id (`registry.ts`, `viewFor` reads `registry.get`), so no view id is listed twice.
  - Colliding: `grep -rn "'open-view\|open-view:" src` outside the new file finds only the desktop app's command `open-view` (`menu-template.ts:231`, `menu-answer.ts:76`, `menu-commands.ts:37`). That id belongs to the window menu and never reaches `stripPick`, and no strip, pane or float id starts with `open-view:` (`pane-view.ts:29-207`). The two submenu triggers, `open-view-list` and `open-view-group:<n>`, do not start with `open-view:`. A trigger is never a pick (`menu-items.ts`, `items`), and if one did reach `stripPick`, no branch matches it and nothing runs.
- `ui.strip_open_view`.
  - Empty: an empty value would draw an item with no words. `t` answers the value as it is (`text.ts:49-56`, `:72-74`).
  - Duplicated: a second `strip_open_view:` in `ui.yml` makes the file fail to parse. `node -e "...parse('ui:\n  strip_open_view: Open View\n  strip_open_view: Other\n')..."` printed `YAMLParseError: Map keys must be unique at line 3, column 3:`. `merge/text.ts` reads the files with that `parse`.
  - Colliding: `grep -n "strip_" config/text/ui.yml` shows no other `strip_open_view` key. The desktop menu's own key is `desktop.menu.open_view` (`config/text/desktop.yml:58`), in another group.

## Files (from `diff -rq` against the base copy over src, tests, utils, config, docs; line counts base to now)

| File | Lines | In the write list |
| --- | --- | --- |
| `src/lib/shell/panes/strip/open-view.svelte.ts` | new, 127 | yes |
| `src/lib/shell/panes/pane-view.ts` | 536 to 541 | yes, lines 1-5 (now 1-6) and 296-394 |
| `src/lib/shell/panes/PaneView.svelte` | 510 to 516 | yes |
| `src/lib/ui/menu/menu-items.ts` | 176 to 179 | yes, line 24 (now 24-27) |
| `src/lib/state/workbench/layout/open/opening.ts` | 490 to 501 | yes, the `Opening` type, beside `holderOf`, the return |
| `src/lib/state/workbench/layout.svelte.ts` | 852 to 855 | yes, 213-216 and 826-828 |
| `config/text/ui.yml` | 149 to 150 | yes, 81-82 |
| `docs/HELP.md` | 546 to 547 | yes; the sentence is at line 65, see below |
| `docs/diagrams/layer-shell.dot`, `.svg` | 164 to 164 | yes, by `npm run diagrams` |
| `docs/diagrams/layers.dot`, `.svg` | 95 to 95 | yes, by `npm run diagrams` |

`strip/` holds 10 items, and `PaneView.svelte` stayed under 520 lines, so no file was split.

## Comments and pages that describe the changed behaviour

- `pane-view.ts:1-6` head comment: rewritten (the strip menu's picks are run here, except Open View's, which are in the new module).
- `pane-view.ts:296-309` doc comment of `stripMenu`: rewritten (Open View in the first group, on every pane).
- `PaneView.svelte:43-49` head comment: rewritten (Open View among the menu's items).
- `menu-items.ts:24-27`, `MenuItem.hint`: rewritten (the keys that run the choice or, for a view held elsewhere, where it is held).
- `opening.ts` head comment (lines 1-12): still true (it describes where a held unique view is looked for, which `heldHost` reads unchanged).
- `opening.ts`, `Opening.heldInstance` doc: still true.
- `docs/HELP.md` "Pages and the pane tree": line 65 rewritten ("Twelve views exist once: ... Status and Apps", matching `grep -rln "unique: true" src/lib/views`, twelve files); line 76 added (Open View: where, by rail page then Float, apps' views under Apps, a pick opens a new tab of that pane, a view held once names its page or Floating pane and the pick shows it there). The other bullets of the section (New Text File, Lock Group at line 70) are still true.
- `Catalogue.svelte` head comment: still true (the Views view's own behaviour is unchanged).

## Judgment calls the brief left open

- The fact `openView` of `stripMenu` is required (`pane-view.ts:323`), so a caller cannot build the strip menu without the item. `PaneView.svelte` is the only caller (`grep -rn "stripMenu(" src tests`).
- The module reads the merged config through `selectors.configMap` (`open-view.svelte.ts:53`), not through `entities.config`. The shell's store rule (`tests/checks/tree/boundaries.test.ts:520`, `SHELL_STORES`) lets a shell file read `selectors` and not `entities`. `configMap` answers `{}` before the first config message, which `readGroups` reads as no group, as it reads `undefined`.
- A group's submenu trigger id is numbered by the section's place (`open-view-group:<n>`), since a `Section` carries no group id. Triggers are never picks.
- The stripMenu item is rebuilt whenever `stripItems` is read (a Svelte `$derived`). The context menu reads it at the right-click (`ContextMenu.svelte:95`, `read`) or while drawn open. The submenu's hints follow the layout while the menu is open from the empty body, and the pick reads the state again either way.
- The pick re-checks listing with `listedViews([registration])`, so the pick and the menu share one test (ruling 1).

## Host- or user-visible changes, before and after, for the look on TEST

- The strip's right-click menu (right-click the empty part of the strip of a pane of TEST that holds tabs). Before: Open File..., New Text File, then a rule and the splits. After: Open File..., New Text File, Open View with a submenu arrow, then the rest unchanged. The Open View submenu shows one item per rail page in the rail's order, Focus to System, then Float, each with the group's glyph and a submenu of that group's views with their glyphs. Settings carries the muted hint "System" at its end, and Usage, Live HPC and Workbenches carry "Floating pane" while the docked float holds them. Hover an app's contributed view to see its container title.
- An empty pane (close every tab of a pane the arrangement keeps, then right-click its body): the same menu with Open View.
- A float's strip (right-click the empty strip part of the docked float): Open View is in the first group. Picking Files opens a Files tab in the float.
- A locked pane (Lock Group on a pane, then right-click its strip): Open View is present, and picking Files opens a tab in that pane.
- A pick of a unique view held elsewhere (Settings from a pane of TEST) shows the System page with Settings active, and the pane gains no tab.
- `docs/HELP.md`: the "Twelve views" sentence and the Open View bullet.

## Outside the write list

`docs/apps.md:263` reads "A view is listed in the Views catalogue under Apps." `spec.md` asks a step to write what an app builder meets into the Apps guide, and an app's view now also appears in Open View under Apps. The sentence is still true but no longer complete. A proposed addition for landing: "A view is listed in the Views catalogue under Apps, and in Open View (the strip's right-click menu) under Apps, with its container's title as its hover words." The file is not in the step's write list, so it was not edited.

## Anything in the brief that was wrong or impossible

- C13 under item 3's rule, ruled in `O49-cases.md` (above).
- The brief puts the "Eleven views" sentence at `docs/HELP.md` line 64 and Lock Group at line 72. In the base copy they are at lines 65 and 70 (`grep -n "Eleven views\|Lock Group (pane" migration-O49-base/docs/HELP.md`). The sentence the brief names was the one rewritten.
- The brief's item 4 names `isPage`, which `src/lib/state/workbench/layout/index.ts` does not export. Ruling 4 covers it.

## Repair round 1

Everything in `O49-round1.md` is done. One sentence of St3 follows the code where the round's wording would not be true; it is explained under St3.

### St1, the two comments rewrapped (words unchanged)

The fill is greedy at 100 columns. Before any change, the paragraphs of the round-0 tree were copied to the scratchpad and their columns were read with `awk '{print FNR": "length": "$0}'`.

- `src/lib/shell/panes/strip/open-view.svelte.ts:1-12`, the head comment.
  - Before: line 3 was 98 columns with "a" fitting after it, line 6 was 96 with "the", line 8 was 93 with "state", line 9 was 92 with "open,", and line 10 was 94 with "lives".
  - After, the paragraph reads:
    ```
    // Layer 3, shell. The Open View item of the right-click menu of a pane's strip and of an empty
    // pane's body, and what its picks do. Its submenu lists every listed view by the group the Views
    // view lists it under, through the same fold (state/workbench/navigation/catalogue.ts `arrange`): a
    // submenu per rail page in the rail's order, then the `nav_groups:` groups, then the views no group
    // holds with no heading. The views apps add are registrations like any other, so they are listed
    // under their group while their app acts. A pick opens the view as a new tab of the pane the menu
    // was opened on, and a unique view a page or float holds is shown where it is, as every opener
    // shows it; the item names that page or float as its hint. The menu is drawn from the state at the
    // right-click and another window may change the layout or the apps while it is open, so a pick
    // reads the registry and the holder again and never trusts what was drawn. It lives apart from
    // pane-view.ts so stripMenu stays a function of the facts it is handed, and it reads the client as
    // close-question.svelte.ts does.
    ```
- `src/lib/shell/panes/pane-view.ts:298-309`, the doc comment of `stripMenu`.
  - Before: line 302 was 96 columns with "the" fitting after it, and line 306 was 96 with "the".
  - After, lines 302-309 read:
    ```
     * Tab Bar and Editor Actions Position submenus, each marking the setting in force with a check, the
     * first place named Tab Bar, or Title Bar while the tab bar is not drawn, when the window's title
     * bar strip draws the actions (shell/titlebar/); Close, while the page holds more than one pane;
     * and New Terminal. The pane of a float (`float`, its place) has the float's items in place of the
     * splits and always offers Close, which closes the float. With the editor actions hidden the pane
     * menu's `...` button is not drawn, so the menu also holds the pane menu's items that it has none
     * of its own for (`paneItems`, the pane menu as the pane draws it), and Close is always offered, as
     * the pane menu offers it.
    ```
- Checks after the change:
  - `awk 'length > 100'` over the two files (and `PaneView.svelte`) printed nothing (exit 0).
  - A read of lines 297-309 of `pane-view.ts` printed `fits=no` for every line from 298 to 308; that is, each line's next word would pass 100 columns.
  - The same check over `open-view.svelte.ts:1-12` and `PaneView.svelte:43-49` printed no short line.

### St2, the head comment of `PaneView.svelte` (lines 43-49)

- Before (lines 44-45): `Open View (the views by rail page, opened in this pane, strip/open-view.svelte.ts)`. That says every view opens in this pane, while `open-view.svelte.ts:121` shows a held view where it is held.
- After (lines 44-46), the paragraph rewrapped whole at 100 columns: `Open View (the views by rail page, strip/open-view.svelte.ts: a view a page or float holds is shown where it is held, and any other view opens in this pane)`.
- Read against `picked` (`open-view.svelte.ts:116-124`): `heldHost(view) !== null` leads to `openView(view)`, and otherwise to `openInPane(view, undefined, page, path)`. The comment now says the same.
- `PaneView.svelte` is 517 lines (`wc -l`).

### St3, the Open View bullet of `docs/HELP.md` (line 76)

- Before: `lists every view by rail page, then Float, the views your apps add under Apps.` "Every view" is false, since `listedViews` leaves out `listed: false` (`catalogue.ts:381-383`, `open-view.svelte.ts:91`). The Float phrase also read as if Float were the apps' views.
- After: `Open View (right-click on a strip's empty part or in an empty pane) lists the views the Views catalogue lists, so not a view opened only for something (a project, an entry, a file) and not the view of an app that is not active. It has a section per rail page in the rail's order, among them Apps with each app and the views your apps add, then a Float section with the views of the floats.` The rest of the bullet is unchanged.
- Where this follows the code and not the round's word order: the round brief lists the sections as "by rail page, then the floats' section, then the views the apps add under Apps". On the tree, Apps is a rail page between Present and Help (`config/defaults/layout.yml:20`). `arrange` lists the rail groups in the rail's order and then the `nav_groups:` groups (`catalogue.ts:183-207`, `:283-303`), so Apps comes before Float. The bullet names Apps among the rail pages and Float last, as two separate sections. That is the order `item()` draws (`open-view.svelte.ts:88-108`).

### St4, the Apps guide (`docs/apps.md`, lines 87 and 263)

`sed -n '87p;263p' docs/apps.md`:
- Before:
  - `- Open an app from the Apps rail button, the Views catalogue, or `a` and its digit.`
  - `- A view is listed in the Views catalogue under Apps. The first time, an `activitybar` view docks on the left, ...`
- After:
  - `- Open an app from the Apps rail button, the Views catalogue, Open View (the strip's right-click menu, under Apps), or `a` and its digit.`
  - `- A view is listed in the Views catalogue under Apps, and in Open View (the strip's right-click menu) under Apps with its container's title as its hover words. The first time, an `activitybar` view docks on the left, ...`

The earlier section "Outside the write list" is settled by this change: both lines are now in the round's path list and both are written.

### P1, the verify list after the last change of this round

The last change of the round was the `docs/apps.md` line 263 edit; the report is not a checked file. After it: `npx prettier --check` over the five files of the round printed "All matched files use Prettier code style!". Then `npm run diagrams && npm run test:quick` ran once:

```
ok      prettier (0.5 s): All matched files use Prettier code style!
ok      ASCII gate (0.6 s)
ok      svelte-kit sync (2.2 s)
ok      svelte-check (9.8 s): 1792684696174 COMPLETED 535 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (9.9 s)
ok      vitest (33.4 s): Duration  22.85s (transform 51.59s, setup 0ms, import 75.74s, tests 2.16s, environment 784ms)
test:quick: 35.7 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
```

- The ASCII gate of `spec.md` over the five files of the round printed nothing (exit 0).
- The history-word grep over the lines of `PaneView.svelte` this round changed found no hit (exit 1). The other two comments keep their words.
- `diff -rq` against the base copy lists the round-0 files plus `docs/apps.md`.
- In this round, the verify list ran 1 time. No other test command and no whole-suite command ran.

### P2, a pick after the pane closed or the tree changed while the menu was open (by reading)

- **The pane closes.** Both menus are drawn inside the pane, so they unmount with it and no pick reaches a pane that is gone:
  - The strip's `ContextMenu` is at `PaneView.svelte:439`.
  - `PaneBody`'s menu is at `PaneView.svelte:471`, and `PaneBody.svelte:337`.
  - The list sits in `ContextMenu.Root` and `ContextMenu.Portal` inside that component (`ContextMenu.svelte:133-152`).
- **The tree changes.** The module reads the pane's place through getters, `page: () => page, path: () => path` (`PaneView.svelte:257`). A pick then reads the pane's current `page` and `path` props at the moment of the pick (`open-view.svelte.ts:122`, `deps.page()`, `deps.path()`), never the values when the menu opened.
- **The page or path no longer holds a pane at the pick.** `openInPane` answers `''` and opens nothing (`opening.ts:195-197`, `if (held === null || paneAt(access.layout(held.id), path) === null) return '';`).
- **A held unique view.** Its pick goes through `openView`, which does not depend on the pane at all.
