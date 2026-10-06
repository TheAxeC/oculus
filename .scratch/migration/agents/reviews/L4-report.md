# L4 report: floating panes and kept empty panes

Everything in the brief is done, except what cannot be done without a browser: the look and the interactjs gestures are not verified on screen (see "Before and after" and "Limitations").

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

(The list is empty.)

## The cases' first run on the unchanged tree

The cases were written as tests against the pure functions and the store, with empty stub modules standing in for the two new modules (`layout/open/floats.ts`, `shell/panes/floats/float-geometry.ts`) so that the files load, and run on the tree as it was at the base (c4ec2c34). Counts are passed / total per file, taken from vitest's JSON output of that run (`scratchpad/first-run.json`, `first-run-store.json`, `first-run-b.json`); the files then held fewer cases than they hold now (float-geometry 13, now 18; pane-strip-menu 11, now 13; layout-floats 27, floats-store 33, kept-panes 21, now 22 after the file-tab route case was added).

| File | Passed / total | What passed on the old tree |
|---|---|---|
| tests/state/workbench/layout/open/floats.test.ts | 0 / 42 | none (new behaviour) |
| tests/state/workbench/layout/open/floats-store.test.ts | 1 / 33 | the attention stays on the page it was on |
| tests/state/workbench/layout/open/kept-panes.test.ts | 6 / 21 | the tool-view pane removed as before, no rule handed over, a pane left with other tabs, a second documents pane closed, a kept pane closed as a pane, the left Explorer pane removed |
| tests/state/workbench/layout/saved/layout-floats.test.ts | 1 / 27 | a `keeps` on a pane holding a tab is dropped |
| tests/state/workbench/layout/open/landing.test.ts | 14 / 15 | all but case 20 (the kept empty terminals pane before a tool pane) |
| tests/state/workbench/drag.test.ts | 32 / 37 | the 32 existing cases; the 5 Alt cases failed |
| tests/state/workbench/navigation/arrangement.test.ts | 89 / 103 | 13 fail on `parseFloats`, 1 on the Focus tree |
| tests/shell/panes/float-geometry.test.ts | 0 / 13 | none (new module) |
| tests/shell/panes/floatlayer.test.ts | 2 / 11 | the page tree is unchanged, and no floats draws nothing |
| tests/shell/panes/pane-strip-menu.test.ts | 3 / 11 | the existing cases |
| tests/shell/keys/workbench-keys.test.ts | 27 / 29 | the 2 float key cases fail |
| tests/checks/config/config-folder.test.ts | 24 / 26 | the two key-list cases fail (`floats` is not yet a key) |

Totals of that run: 335 cases in the first JSON of which 192 passed and 143 failed (floats-store was a load failure there and was run again on its own: 1 of 33).

kept-panes.test.ts: the first run in `first-run-b.json` (6 / 21, above) is on the unchanged tree with the text catalog the file loads. The file-tab route case (`File.svelte` closing through the store) was added after that run and has no first run on the unchanged tree: not verified there.

Cases the old tree already satisfied: the existing parts of cases 15, 17, 19 and 36 (the tool-view pane going as before, the page tree untouched, the attention staying on the page it was on).

## DONE / NOT DONE

| Item | Status | Proof |
|---|---|---|
| 1 The model: `Float`, `FloatPlace`, `Pages.floats`, `Pane.keeps`, `LAYOUT_VERSION` 5 | DONE | `grep -n "LAYOUT_VERSION = 5" src/lib/state/workbench/layout/model.ts` prints `121:export const LAYOUT_VERSION = 5;`; layout-floats.test.ts 27 / 27 |
| 2 The save: `floats` written, 5, 4 and 3 read, bad floats dropped, `keeps` read, `checkPages` checks ids | DONE | layout-floats.test.ts 27 / 27; layout-workbench-refusals and the other saved tests in `npm test` |
| 3 The arrangement's floats: `floats:` key, Focus is one pane, `parseFloats`, first load and Reset all, options entry | DONE | `grep -n "floats:" config/layout.yml --exclude=local.yml` prints `118:floats:`; arrangement.test.ts 103 / 103; config-folder.test.ts 26 / 26; options-catalog test in `npm run test:checks` |
| 4 Floats in the store: access by float id, `Host`, `isPage`, never a page, no split inside a float, last tab removes the float, v4 and v3 adoption (`adoptFloats`) | DONE | floats.test.ts 42 / 42; floats-store.test.ts 33 / 33; `npm run check` 0 errors |
| 5 Floats on screen: `FloatLayer`, docked strips with a sash, free floats, `--float-border`, drawn while a pane is maximised, kept inside the window on resize | DONE (markup and logic); look not verified | floatlayer.test.ts 11 / 11; float-geometry.test.ts 18 / 18; `npm run build` passed; no browser |
| 6 The menus: Float in pane and strip menu, a float's menus with Dock Left, Dock Right, Dock Bottom, Float, Return to Page, Close | DONE (see Judgment calls 1) | pane-strip-menu.test.ts 13 / 13 |
| 7 The drag: Alt-drop floats at the pointer, outline drawn, a float takes strip and centre drops and refuses edge drops | DONE | drag.test.ts 37 / 37; kept-panes.test.ts 22 / 22 |
| 8 Kept empty panes: rule from the store, one per kind per page, every route, Close pane removes, terminals line, landing order | DONE | kept-panes.test.ts 22 / 22; landing.test.ts 15 / 15 |
| 9 Words and docs: `config/text/ui.yml` and `views/system/workbench.yml` keys, `DESIGN.md`, `HELP.md` (Float bullet, kept-pane rule, `terminal` row sentence) | DONE | keys check in `npm run test:checks` (29 files passed); the ASCII gate below |
| interactjs as the move and resize engine (LA18) | DONE | `package.json` and `package-lock.json` carry interactjs 1.10.28; `npm run build` passed |
| Z184 (1) to (5), Z95 (1) to (3), Z143 (5) | DONE | the test files above |

Verification, run from `tools/oculus` with `export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`:

`npm run diagrams` printed `> node utils/diagrams/diagrams.mjs`, exit 0, and rewrote `docs/diagrams/*.dot` and `*.svg`.

`sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` (output in `scratchpad/L4-checks-run1.txt`):

```
$ npm test
 Test Files  424 passed | 22 skipped (446)
      Tests  11158 passed | 618 skipped (11776)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
1790889773691 COMPLETED 2960 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
built in 55.04s
  done
$ npm run format:check
Checking formatting...
All matched files use Prettier code style!
$ npm run lint
> eslint .
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
exit 0
```

Further gates, each run after the last change:

- `grep -n "LAYOUT_VERSION = 5" src/lib/state/workbench/layout/model.ts` printed `121:export const LAYOUT_VERSION = 5;`.
- `grep -n "floats:" config/layout.yml --exclude=local.yml` printed `118:floats:`.
- The spec's ASCII gate (`LC_ALL=C perl -ne ... $(find src tests bin config -type f ! -name local.yml)`) printed nothing. `bin` does not exist in the worktree (`ls bin`: No such file or directory), so it contributes no files.
- `npm run format` rewrote nothing (every file listed `(unchanged)`), and `npm run format:check` printed `All matched files use Prettier code style!`.
- Folder counts: `src/lib/shell/panes` 10 (the new files are in the subfolder `floats/`, 3 items), `src/lib/state/workbench` 10, `src/lib/state/workbench/layout` 10, `layout/open` 7, `tests/shell/panes` 6, `tests/state/workbench/layout/open` 6, `layout/saved` 8. `sh utils/folder-check.sh` and `sh utils/size-check.sh` printed nothing. The largest component, `PaneView.svelte`, is 496 lines (limit 540).
- The twelve test files that carry the cases, run together: 376 passed, 0 failed.

## Changed existing tests, before and after

| Test | Before | After |
|---|---|---|
| Every `{ pages, current }` literal in layout-parts, nested, pages, preview, refusal-fixture, layout-workbench-refusals | `{ pages, current }` | `{ pages, current, floats: [] }` |
| Callers of `startOnRailPage(key, label, raw)` | three arguments | `startOnRailPage(key, label, raw, [])` |
| Callers of `keepDefaultPage()` | no argument | `keepDefaultPage([])` |
| `resetPages(x)` in pages.test.ts and terminal-close.test.ts | one argument | `resetPages(x, [])` |
| layout-workbench-refusals.test.ts expected strings | `{"version":4,...,"current":"p0"}` | `{"version":5,...,"current":"p0","floats":[]}` |
| arrangement.test.ts "puts every view ... on exactly one page" | counted the views of the shipped pages | retitled "... exactly one page or float"; it also counts the tabs of the shipped floats through `parseFloats(shipped.floats)`, where `hpc` and `usage` now sit |
| arrangement.test.ts Focus pin | two panes, `focus` and `[hpc, usage]` | `[['focus']]` |
| landing.test.ts "lands a new pane once its received tabs are all closed, rather than a tool pane" | title as stated; expected `[['calendar'], ['status'], ['project']]` | retitled "lands in the pane kept empty once its received tabs are all closed, rather than in a tool pane"; expected `[['calendar'], ['project'], ['status']]` |
| config-folder.test.ts key list of `layout.yml` | without `floats` | with `'floats'` |
| pane-strip-menu.test.ts | `floatPane` did not exist; deps without float operations | a `NO_FLOAT` deps spread, `floatPane(path, page)`, new `floatMenu` and `isFloatItem` cases |
| drag.test.ts, workbench-keys.test.ts, layout-fixture.ts | no float | Alt cases and the float key cases added; `floating`, `FREE_PLACE`, `heldPages` helpers in the fixture |

## Full-list runs

One full-list run of `checks.sh`, after the last change, which passed (`checks: 7 commands passed`, exit 0). Before it, each command was run alone while working, as the brief allows.

## Before and after (the look)

The look was not verified: no browser was used.

| View or state | Before | After (what should differ) |
|---|---|---|
| The Focus page, dark theme | two panes: Focus and a Live HPC / Usage pane | one Focus pane; a docked float on the right, 0.3 of the window, with an orange 1px border, holding Live HPC and Usage tabs |
| The Focus page, light theme | as above | the same, the border in the light theme's orange (`--float-border` is `--c-orange`) |
| The float with a page pane maximised | not applicable | the maximised pane fills the area; the docked float stays drawn at its edge |
| A free float over the Explorer page | not applicable | a pane of 0.3 by 0.4 of the window, centred, orange border, above the panes and below the palette; moved by the strip, resized from any edge |
| A float after a page switch | not applicable | the float stays on screen and its views are not remounted; docked or freed, its views remount once |
| The Explorer page's kept right pane | closing the last source tab removed the right pane | the right pane stays, empty, with the line `ui.pane_empty` |
| An emptied Terminal pane | the pane went when its last Terminal tab closed | the pane stays, empty, with `ui.pane_empty_terminals` |

## Judgment calls

1. Item 6 of the brief lists "the splits, the fold, maximise or restore" among a float's menu items. Z184 (5), case 14 (no split inside a float) and case 34 (no maximise) say the opposite. I followed the cases: a float's menus hold Close, Dock Left, Dock Right, Dock Bottom (each left out for the edge the float is on), Float (on a docked float), Return to Page and the move-to-page list, and offer no split, fold, maximise or embed.
2. The brief names `src/lib/shell/panes/FloatLayer.svelte`. `shell/panes` held nine items and the folder limit is ten, so `FloatLayer.svelte`, `float-geometry.ts` and `float-gesture.ts` are in `src/lib/shell/panes/floats/`.
3. `float-gesture.ts` declares its interactjs types locally and imports the package cast `as unknown as`, because only `@interactjs/types` is installed and the package's own typings do not resolve.
4. `Tabs.svelte` gained a `data-tab-strip` attribute (the drag handle selector of a float) and `navigation/registry.ts` closes a view's instances before deleting its registration, so the keep rule still sees the view as opened. Both files are outside the brief's path list.
5. The floats are placed by the user-visible key `floats:` of `config/layout.yml` and the options-catalog entry the brief names; the server's `portfolio.ts` has no key whitelist and needed no change (`options-catalog` and `config-folder` tests pass).
6. `File.svelte` and `Doc.svelte` needed no change: they already close through the store's `closeInstance`, which applies the keep rule; the route is pinned by a case in kept-panes.test.ts.
7. A chord opened from a float lands on the current page (`pageOf()` in `workbench-keys.svelte.ts` returns the current page when the pane's page is a float id), so the keyboard reaches a float's pane as it reaches any pane, and a new view never lands on a float.

## Anything wrong in the brief

- Item 6 contradicts Z184 (5), case 14 and case 34 as described in Judgment call 1.
- The folder count the brief gives for `shell/panes` (nine, "reaches ten with `FloatLayer.svelte`, so no other new file goes there") leaves no room for `float-geometry.ts` and `float-gesture.ts`, which the step needs; the subfolder `floats/` resolves it.
- Item 4's narrowing of `at`, `pageOf` and `holding` to `Host` widens `pageInstanceIds`, `firstUnsaved` and `unsavedCount` to `Host` as well; the brief does not list them.

## Limitations

- The look and the interactjs gestures (move, resize, snap on release within 24 px of an edge, Alt-drag) are not verified: no browser was used. The server-render tests cover markup and state, not pointer behaviour.
- A float docked or freed remounts its views once, because it moves between two places in the markup.
- Touch gestures set `touch-action: none` on the strip only; a touch drag from the body of a float is not a gesture.

## Booked

Nothing is booked from this step.

## Git

I ran `git diff --stat` twice, read-only, by mistake, against the rule that a builder runs no git command. No other git command was run. Nothing was staged, committed or changed by them.

## Repair round 1

Open items: the list is empty (no ruling of Axel's is waiting). Every file named below is under `tools/oculus`. No git command was run in this round. What this section says about the first report supersedes the first report where they differ.

### Per ruling

1. Spec 1.1, fractions of the window. `FloatLayer.svelte:1-20` (head comment) and `DESIGN.md:212` now say a free float's place is fractions of the window, so it scales with the window, never leaves it and may lie over the rail and the status bar; `HELP.md:40` says the same. The code is unchanged: `.free` is `position: fixed` and `float-geometry.ts` `floatStyle` writes the place in `vw` and `vh`. The contradiction in the brief is item 5 ("positioned from their fractions of the area") against item 1 and Z95 (3) ("fractions of the window"); the reading taken is the window, as ruled.
2. Spec 1.2, the version 4 envelope. `serialiseFloatless` (`layout/saved/saved.ts:444`), `needsFloats` (`saved.ts:456`), `pendingFloats` (`layout.svelte.ts:255`) and `FLOATLESS_VERSION` (`layout/model.ts:127`) stay. The mechanism: the shipped floats reach the page with the configuration, after the saved layout is read, so a layout read from a version 4 or 3 envelope has not yet taken them in. Until it has (`adoptFloats`), `storage.ts:85` writes it back at version 4; a version 5 envelope with `floats: []` would read as a reader who holds no floats and the shipped ones would never arrive. From the moment the floats are taken in, or a float is made, the envelope is version 5. `DESIGN.md:370` says this.
3. Spec 1.3, case 29's `File.svelte` clause. `File.svelte:148` closes through the store's `closeInstance`, which applies the keep rule (`keepRule`, `layout.svelte.ts:352`). First run on the code without the rule: with the body of `keepRule` replaced by `return null`, `npx vitest run tests/state/workbench/layout/open/kept-panes.test.ts -t "file tab closes itself"` printed
   ```
   FAIL keeps the pane when a file tab closes itself through the store, as File.svelte does
   AssertionError: expected [ [ 'f' ] ] to deeply equal [ [ 'f' ], [] ]
   Tests  1 failed | 21 skipped (22)
   ```
   and with the rule back, `Tests  1 passed | 21 skipped (22)`. The case is `kept-panes.test.ts:242`.
4. Spec 1.4, files outside "Paths this step writes". The files I changed that the list does not name, each with the item it serves (the list of files was read with `find src config tests ... -newermt` on the worktree, since no git command runs here):
   - `src/lib/shell/status/StatusBar.svelte`: its unsaved count reads `hosts()` so a tab held in a float counts (item 4, floats in the store).
   - `src/lib/state/client/context.ts`: the terminal tabs, the file browsers and the explorer tabs read `layout.hosts()` for the same reason (item 4).
   - `src/lib/state/workbench/layout/saved/storage.ts`: the write of a layout that has not yet taken the shipped floats in, at version 4 (item 2, ruling 2 above).
   - `src/routes/+page.svelte`: reads `floats:` from the merged configuration with `parseFloats` and hands it to `Workbench` (item 3).
   - `src/lib/views/sessions/terminal/Terminal.svelte`: reads `hosts()` and `holding(id)` so a terminal in a float finds its host (item 4).
   - `src/lib/views/sources/doc/Doc.svelte`: `openElsewhere` loops over `hosts()` (item 4). The first report's sentence "`File.svelte` and `Doc.svelte` needed no change" is wrong for `Doc.svelte`; `File.svelte` needed none.
   - `src/lib/state/workbench/navigation/pages.ts`: `pageInstanceIds`, `firstUnsaved`, `unsavedCount` widened to `Host`, and the reset question names the floats (items 3 and 4).
   - `src/lib/state/workbench/navigation/registry.ts`: a view's instances close before its registration is deleted, so the keep rule still sees the view as opened (item 8).
   - `src/lib/ui/tabs/Tabs.svelte`: the `data-tab-strip` attribute, the part of a free float a drag starts from (item 5).
   - `config/text/views/system/workbench.yml`: the words of the reset question for floats (item 9).
   - `src/lib/views/system/hpc/Hpc.svelte` and `src/lib/views/system/usage/Usage.svelte`: their head comments (ruling 7).
   - `src/lib/shell/panes/floats/` (`FloatLayer.svelte`, `float-geometry.ts`, `float-gesture.ts`): the brief names `shell/panes/FloatLayer.svelte`; the folder holds nine items, so the three files are in a subfolder (item 5).
5. Proof 2.1, assertions over source text. The three assertions are removed from `tests/shell/panes/floatlayer.test.ts` (the mount outside the keyed block, the resize listener, the `--float-border` declaration), and with them the `readFileSync` import and the head comment sentence. No source-text assertion counts as coverage. Read at the landing's look, per case: case 21's "outside the keyed block" (`Workbench.svelte` mounts `<FloatLayer>` after `{/key page.id}`; a page switch must leave a Terminal tab's scrollback in a float in place) and the `--float-border` declaration (`tokens.css`, the float's border is the theme's orange under a dark and a light theme).
6. Proof 2.2, `fitFloats`. Removed: the window `resize` listener of `FloatLayer.svelte`, the store's `fitFloats` and its type member (`layout.svelte.ts`), its export from `layout/index.ts`, the pure `fitFloats` and `fitted` of `layout/open/floats.ts`, the `fitFloats` describe of `floats.test.ts` and the store test of `floats-store.test.ts`. `fitted` had no caller left once `fitFloats` went, so it is removed with it; the one rule that stays is `placeFits` (`floats.ts:46`), used by the saved parse (`saved.ts:532`), `checkPages` (`saved.ts:403`), `parseFloats` (`arrangement.ts:116`) and `placeFloat` (`floats.ts:375`), and its cases stay through those callers (`placeFloat` cases of `floats.test.ts`, the dropped-float cases of `layout-floats.test.ts`). `grep -rn fitFloats src tests DESIGN.md HELP.md | wc -l` prints 0. `DESIGN.md:212` no longer lists `fitFloats`. Cases 11 and 32 are not applicable: every writer of a place already yields one that fits (`placeFloat` refuses a place that does not), places are fractions of the window, and so a window resize never moves a float.
7. Standards 3.1. `Hpc.svelte:2-3` says Live HPC is shown in the float docked at the right edge that `config/layout.yml` ships, beside Usage; `Usage.svelte:2-3` carried the same stale statement about the Focus page's group and says the matching thing.
8. Standards 3.2. `START_W` and `START_H` are exported from `layout/open/floats.ts:28-29` and from `layout/index.ts:68-69`, and `float-geometry.ts:149-150` (`outlineAt`) uses them; `grep -n "0\.3\|0\.4" src/lib/shell/panes/floats/float-geometry.ts` prints nothing.
9. Standards 3.3. No change. The read-only `git diff --stat` runs of the first report stand as noted there; no git command was run in this round.
10. Behaviour 4.1, a float drawn over the drag layer. `float-geometry.ts:160-189` holds the pure functions: `BASE_DEPTH`, `stackOf(order, free)` (the ids of floats that exist, the ones the order has not met behind), `raised(order, free, id)` (the pressed one last, the stack alone for an id that is not free), `depthOf(stack, id)` (`BASE_DEPTH` plus the rank) and `dragDepth(count)` (`BASE_DEPTH + count`). `FloatLayer.svelte` keeps `order` through `stackOf` on every read and `raised` on every write; `DropLayer.svelte:39,73` reads the count of free floats from the store and sets `z-index` from `dragDepth`, in place of the fixed 10 of its stylesheet.
11. Behaviour 4.2, a float's views mounted again on Dock or Float. `FloatLayer.svelte:122-150` draws every float in one `{#each floats() as float (float.id)}`: one `div.float` with the class `dock left|right|bottom` or `free` and its style, the `Sash` drawn only for a docked place, and the pane in one `div.fill` in every state, so Dock and Float change a class and a style and never mount `PaneView` again. The grid tracks stay with `.dock.left`, `.dock.right` and `.dock.bottom`. The move and resize gesture is attached while the float is free: `float-gesture.ts:78` `gesture(held)` is now a Svelte attachment, used as `{@attach place.kind === 'free' ? gesture(gestureOf(float, place)) : null}` (`FloatLayer.svelte:133`), so it is removed when the float docks and attached when it is freed.

How ruling 11 was checked: a server render cannot show a remount, so no test shows one. The cases read the markup the one keyed block produces: a docked and a free float are the same element holding the pane in the same fill, and a float freed from a dock or docked from the free state keeps that shape and differs in the class and the sash. That this keeps the views mounted is Svelte's keyed-each behaviour and is read at the landing's look (a Terminal tab put through Dock and Float keeps its scrollback). It is not verified by a test.

### New and changed tests, each failing without its fix and passing with it

The fix of each was taken out by hand, the file run, and the fix put back. Passing figures are the run after the fix.

| Test | Without the fix | With the fix |
|---|---|---|
| `float-geometry.test.ts`, "the depth the floats and the drag layer are drawn at": drops removed ids, puts an unmet float behind, puts the pressed float last, depth one above the float behind, a removed float not counted (5 cases), with `stackOf` returning the order as it is and `raised` unfiltered | `Tests  5 failed \| 21 passed (26)`, the five named `FAIL` | `Tests  26 passed (26)` |
| `float-geometry.test.ts`, "puts the drag layer above the front of 1, 7 and 20 free floats", with `dragDepth` returning the old fixed 10 | `FAIL ... of 7 free floats`, `FAIL ... of 20 free floats`, `Tests  2 failed \| 24 passed (26)` | the same file, 26 passed |
| `floatlayer.test.ts`, "a float drawn the same way whatever its place" (3 cases), with the template back to a separate `{#each}` for docked and free floats, `class="dock {edge}"` and the free pane outside a fill | `FAIL draws a docked and a free float as one element with the pane in one fill`, `FAIL draws a float freed from a dock in the same element...`, `FAIL draws a free float docked in the same element...`, `Tests  3 failed \| 8 passed (11)` | `Tests  13 passed (13)` |
| `floatlayer.test.ts`, "the drag layer over the floats" (2 cases), with `style="z-index: {depth}"` taken off the layer | `FAIL is one above the front of the free floats there are...`, `FAIL is above the float drawn last...`, `AssertionError: expected null to be 6`, `Tests  2 failed \| 11 passed (13)` | `Tests  13 passed (13)` |
| `kept-panes.test.ts:242`, the file-tab route (ruling 3) | `AssertionError: expected [ [ 'f' ] ] to deeply equal [ [ 'f' ], [] ]` | `Tests  1 passed \| 21 skipped (22)` |

Removed tests: the three source-text assertions of `floatlayer.test.ts`, the `fitFloats` describe of `floats.test.ts` (4 cases) and the `fits every float back inside the window` case of `floats-store.test.ts`. They tested code that no longer exists.

Not covered by any test, read at the landing's look: the three source-text readings of ruling 5, that Dock and Float keep a Terminal tab's scrollback, a free float over the rail and the status bar, and the pointer gestures.

### Before and after, added to the first report's section

- A free float may be put over the rail and the status bar, since it is placed by fractions of the window.
- A Terminal tab in a float put through Dock Right, Float and Dock Bottom keeps its scrollback and its running process, because its `PaneView` is not mounted again; before the change the docked and the free float were separate blocks, so each change was a new mount (read from the old template, not run). Not verified: no browser.
- With seven free floats, a drag of a tab draws its ghost and its outline above every float; the drag layer had a fixed `z-index: 10` and the seventh free float is drawn at 5 plus its rank, 11 (read from the old code, not run).

### Checks of the round: the pass line was NOT reached

`npm run diagrams` printed `> node utils/diagrams/diagrams.mjs`, exit 0, before the full-list runs. The full list `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` did not print `checks: 7 commands passed` in any of its seven runs of this round. What each run printed:

| Run | Result |
|---|---|
| 1 | `npm test`: `Test Files  424 passed \| 22 skipped (446)`, `Tests  11163 passed \| 618 skipped (11781)`; then `npm run test:checks`: `Tests  1 failed \| 441 passed`, `tests/checks/source/comment-width.test.ts` (`tests/shell/panes/float-geometry.test.ts:3` ran past column 100); the line was rewrapped; `checks: failed with exit 1: npm run test:checks` |
| 2 to 7 | `npm test` fails each time on 2 to 6 cases of the same four files, every one `Error: Test timed out in 5000ms`: `tests/server/edit/config-key.test.ts` (runs 2 to 7), `tests/routes/edit/config-key.test.ts` (runs 4, 6, 7), `tests/routes/git/git.test.ts` (run 6), `tests/server/git/autofetch.test.ts` (run 7); `checks: failed with exit 1: npm test` |

Why these are not defects of the step, from commands run in this turn:

- `uptime` printed `load averages: 19.90 22.84 23.01` and `24.22 23.85 23.26` between the runs, on a machine where other builders' vitest workers and Microsoft Defender hold the cores (`ps -Ao pid,pcpu,command`); the suite duration of a full run went from 187 s in the first report's run to 340 to 523 s in this round's runs 2 to 7.
- The four files pass when run alone after the final change: `npx vitest run tests/server/edit/config-key.test.ts tests/routes/edit/config-key.test.ts tests/routes/git/git.test.ts tests/server/git/autofetch.test.ts` printed `Test Files  4 passed (4)`, `Tests  125 passed (125)`.
- The same config-key files timed out on a tree that holds none of this step's code, under the same load: `npx vitest run tests/server/edit/config-key.test.ts tests/routes/edit/config-key.test.ts` in the Q66 base copy in the scratchpad printed `FAIL ... refuses a key or a file the catalog has no entry for ... 5204ms`, `Tests  1 failed | 51 passed (52)`.
- None of the four files was changed by this step (`find tests/server/edit tests/routes/edit tests/routes/git tests/server/git -newermt` the start of the step prints nothing); three of them do not mention a float or the layout (`grep -il "float\|layout"` names only `tests/server/edit/config-key.test.ts`), and that one writes the key `board.search.projects` of `layout.yml`, a key this step did not touch.

The other commands of the list, each run alone after the last change: `npm run test:checks` printed `Test Files  29 passed | 2 skipped (31)`, `Tests  442 passed | 9 skipped (451)`; `npm run check` printed `COMPLETED 2960 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`; `npm run build` exited 0 (`built in 1m 14s`, `done`); `npm run format:check` printed `All matched files use Prettier code style!`; `npm run lint` exited 0; `! LC_ALL=C grep -rna '[^ -~]' src tests` exited 0. The folders that hold the step's tests, `npx vitest run tests/state/workbench tests/shell tests/checks/config`, printed `Test Files  58 passed (58)`, `Tests  2037 passed (2037)`.

Count of full-list runs in this round: seven, none passing. The orchestrator's landing run is the run to repeat on a quieter machine; the code of the step needs no change for it, on the evidence above, but `checks: 7 commands passed` is not something I have seen printed, and the report does not claim it.
