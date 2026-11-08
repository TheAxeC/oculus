# O167 builder report: the shell's controls hold one behaviour

NOT done: item 13 (C13, Cmd+S with the focus on a setting's More actions button). The case-run programs found no cause: in every code a program reaches (Gear.svelte with its real Menu, MenuOpener, Tooltip and bits-ui trigger; one Settings row's Item with the scopes, writer and tab save Settings.svelte gives it; the real createWorkbenchKeys, sourceKeys and the desktop menu's answerMenu), Cmd+S from More actions writes the staged change and says "Saved into local.yml." exactly as from the field. No code is changed for item 13. What a program cannot reach is the real browser's focus and menu handling and the Electron accelerator, so the proof is the look at landing named in the C13 row below. Also not met: verification 1, `npm run test:quick` does not print "every command passed". The last of its four full-list runs ends `test:quick: 184.0 s; failed: vitest slow`, with two tests of `tests/data/hubs/hub-portfolio.test.ts` timed out at 20000 ms. The step does not change that file or any code it builds with (`diff -rq` shows nothing under `src/lib/data`); it is chosen because it imports `page-entry.ts` and `settled.svelte.ts` at depth 1. Alone, every one of its 16 tests passes in about 3 s, and the nine files of the slow tier run alone pass (`Tests  56 passed | 13 skipped (69)`). It times out only while the three vitest tiers run at once over the 89 test files this step's 83 changed files select. No time limit was raised.

## Open items of the state file

None.

## Paths written outside the brief's list and the round-0 rulings

Each was needed by a fix inside the step; none changes a user-visible shape beyond the items.

- `src/lib/state/client/context.ts`: item 11. `settingsUnsaved` now reads the tab's refused fields, so its one caller passes `ui` and the id (`settingsUnsaved(layout.instanceView(id), ui, id, entities.config()?.config)`) and the comment above it says a refused text is not counted. 879 lines, as on the base. Ruling 1 keeps context.ts unchanged for item 6, and item 6 does not touch it.
- `src/lib/state/system/config/messages.ts`: item 10, `oneStop`, the one place a worded sentence loses a doubled final stop.
- `src/lib/views/system/workbench/settings/said.ts` and `src/lib/views/system/workbench/settings/other-rows/WallpaperPicker.svelte`: item 10, every Settings message is worded through `oneStop`, `settings_wallpaper_failed` included.
- `src/lib/ui/forms/NumberInput.svelte`: item 10, the box takes the refusal a caller hands it as `invalid` when the box itself refuses nothing.
- `src/lib/state/sources/fs-history.ts` moved to `src/lib/state/sources/fs-parts/history.ts`, and its importer `src/lib/state/sources/explorer/sections/timeline-state.svelte.ts`: item 6. `src/lib/state/sources/` holds 10 items on the base (`ls | wc -l` prints 10), the folder limit, so the new bookmark file could not sit there as the brief names it; `fs-parts/` holds `bookmarks.svelte.ts` (the brief's `bookmarks.svelte.ts`) and the moved history file, and the folder still holds 10 items. `agents/guarded.md:363` still names `src/lib/state/sources/fs-history.ts` ("`copies` and the `files` listener in `src/lib/state/sources/fs-history.ts`"); the ledger is not this builder's to edit, so that line needs the new path `src/lib/state/sources/fs-parts/history.ts` at landing.
- `src/lib/ui/frame/Card.svelte` moved to `src/lib/ui/frame/card/Card.svelte`, with the new `src/lib/ui/frame/card/card-room.ts`: item 14. The room the controls take is handed to the card through a Svelte context; a value exported from a component's `<script module>` is not resolved by eslint's typed parser (the first full-list run failed on it in CardActions.svelte), so the context lives in a `.ts` file beside the card, as `src/lib/ui/menu/tip-ids.ts` does for the tips. `ui/frame/` holds 10 items, so the card and its context share a folder. The importers changed to the new path: `src/lib/views/shared/card/record/RecordCard.svelte`, `src/lib/views/academic/present/arrange/Tile.svelte`, `src/lib/views/system/status/Gallery.svelte`, `src/lib/views/system/machine/usage/Usage.svelte`; comments naming the old path changed in `src/lib/views/system/status/Status.svelte`, `src/lib/views/academic/career/CareerCard.svelte` and `src/lib/views/boards/focus/lanes/LaneCard.svelte` (`grep -rn --exclude=local.yml "frame/Card" config tests src utils docs | grep -v "frame/card/"` prints nothing).
- `src/lib/views/system/workbench/settings/scopes/ScopeBar.svelte` lines 3-10, outside the 130-230 range: the head comment says Save and Save All draw their words and the "Saved into" line holds its room (item 9). O169's lines 55-70 are untouched.
- `src/lib/views/academic/present/Bar.svelte` lines 1-10 and 75, beside line 113 and ruling 7's lines 26-60: the head comment says when the counter is drawn, the toolbar's buttons are disabled through `slideless` (line 75 onward), and one comment line of 101 columns is rewrapped.
- `tests/state/sources/settings-readers.test.ts`: the expected `settings_origin_none` sentence gains its full stop (item 10).
- `tests/state/client/created-ids.test.ts`: its `Settle` stub gains `removed`, which `Settle` now requires (item 6).
- `tests/server/files/nested-names.test.ts` (on the list) is tagged `// @module-tag slow: every row starts git and ripgrep.`: with three rows it timed out at 5000 ms in the first full-list run (364 ms alone), and the vite config's rule is that a test that starts a process is tagged slow.

One inline script changed a file, with no approval quoted from `plan.md`'s Rulings: `sed -i '' "s/        return isSelf ? t('person.self_held_tip'/        return pressedSelf ? t('person.self_held_tip'/" src/lib/views/boards/person/Person.svelte`, which changed that one line of `src/lib/views/boards/person/Person.svelte` (item 2's tip follows the pressed look). Every other edit was made with the Edit and Write tools, and the moves with `mv`.

## The cases' first run (unchanged tree)

- C1 (reading): `open-view.svelte.ts:99` draws `groupGlyph(section)`, which takes `group_glyph` (`catalogue.ts:263-267`, `:289`): Focus `focus`, Pillars `book`, Registries `venue_dist`, Present `conference`, Help `page`, System `settings` (`layout.yml:10-21`). As the brief says.
- C2 (reading): `Person.svelte:211-219` draws `pressed`/`active` from `isSelf` (`:167`, the portfolio's flag); until the portfolio arrives the button is unpressed and enabled, and `ToolButton.svelte:207-209` draws the hover border. `setSelf` (`ui.svelte.ts:485-488`) returns nothing, so Person.svelte never learns of a refusal (ruling 2).
- C3 (reading): `StatusBar.svelte:420-423` `row-reverse`; the right group's DOM order is Bell, unsaved, sessions, AppItems right, SourceItems, so Tab walks right to left. No code scrolls a focused item into view. As the brief says; SourceItems, LanguageItems and AppItems are written reversed too (ruling 3).
- C4 (reading): `project.yml:193` `listing: Projects`; `docs/palette.md:26` `| Projects | listing |`. As the brief says.
- C5 (reading): `FocusFilter.svelte:157-160` gives the focus back with a plain `focus()`; `PickMenu.svelte:137` has no `onCloseAutoFocus`, so bits-ui focuses the trigger plainly; after a keyboard Escape the trigger matches `:focus-visible` and `Tooltip.svelte:186-194` opens the tip. `focus.yml:100` begins in lower case with no stop. As the brief says.
- C6 (reading): `writes.svelte.ts:408-410` only sends; `fs.svelte.ts:823-827` invalidates on success; `schedule.svelte.ts:705-706` posts and `send` touches no row. The rows stay until the next read. The collection's rows are built in `Collection.svelte:144-160` and `:217-222`, not in `boards/collection/index.ts` (ruling 1).
- C7 (test rows, `npx vitest run tests/server/files/nested-names.test.ts`): rows 1 (`site/` in the exclude file) and 3 (`projects/p/` in the exclude file) give their expected listing; row 2 fails:

```
AssertionError: expected [ { ...(3) }, { ...(3) }, { ...(3) } ] to deeply equal [ { ...(3) }, { ...(3) }, { ...(3) } ]
     "inner": ".agents/worktrees/w",
     "listed": [
+       ".agents/worktrees/w/a.txt",
        ".gitignore",
        "a.md",
```

- C8 (reading): `Header.svelte` `.field { flex: 1 1 auto; min-width: 0 }` beside `.count { flex: 0 0 auto }`, the input `min-width: 0` (`field.css:13`): the field shrinks to nothing. As the brief says.
- C9 (reading): `ScopeBar.svelte:143-156` both `glyph="save"` and `compact`; "Saved into" in `{#if last !== null}` (`:158-160`), in the flow. As the brief says.
- C10 (test rows, `npx vitest run tests/state/system/settings/row-writer.test.ts`): 'is said until it is withdrawn: Escape, the held value typed back, or Reset' passes on the unchanged tree (`write.ts` already gives those outcomes); 'names the reasons of a refused Save with no full stop of their own' fails:

```
-     "The theme is not listed; The file is locked",
+     "The theme is not listed.; The file is locked",
```

  Reading: no field carries `aria-invalid` for a row's message.
- C11 (reading): `typed.ts:130-132` counts every typed record, refused or empty. As the brief says.
- C12 (test rows, same command): the rows of a key the file does not hold fail for text, long, path and number, and pass for choice; every row of a key the file holds passes:

```
      "control": "text",
-     "held": undefined,
+     "held": {
+       "value": "",
...
      "control": "path",
-     "said": null,
+     "said": {
+       "args": [],
+       "key": "workbench.settings_not_a_path",
...
      "control": "number",
-     "said": null,
+     "said": {
+       "args": [],
+       "key": "workbench.settings_empty",
```

- C13 (reading, then the case-run programs quoted under "C13" below): the reading of the key path end to end, window keydown (`Workbench.svelte:367`) to `keys` (`workbench-keys.svelte.ts:137-182`), `resolveKey` (`savesFile`, `resolve.ts:168-171`), `perform` (`:259-262`, `dialogShown` `:337-341`), `saveSource` (`source-keys.ts:28-33`), `ui.saveTab` (`close-hooks.ts:108-112`), `Settings.svelte:217-222` and each Control's save, finds no handler that prevents the key: bits-ui's trigger `onkeydown` prevents the default only for Space, Enter and ArrowDown (`node_modules/bits-ui/dist/bits/menu/menu.svelte.js:1449-1460`), bits-ui's tooltip prevents only its own auto-focus and outside presses (`tooltip.svelte.js:650-673`), `Menu.svelte:175` passes `onkeydown` only when a caller gives one and Gear.svelte gives none, `Tooltip.svelte:250` answers Escape only, `PaneBody.svelte:144, 225, 268` listen to keydown without preventing it, and the desktop menu's save (`menu-answer.ts:188`) runs the same `saveSource`.
- C14 (reading): `CardActions.svelte:332-339` lays `.actions.over` absolutely at the top right on hover devices; `Card.svelte:105-121` draws the title with no room kept. As the brief says.
- C15 (reading): `landing.ts:96` ends in `{ kind: 'split', path: away ?? reader }`, with `away` the asker's pane (`opening.ts:280`); each record opened from a row splits the asker's pane again. No state holds a pane's width (ruling 6).
- C16 (reading): `Empty.svelte:122-125` puts `# ` before every `.empty` under rice, the error box and a box with a glyph included. As the brief says.
- C17 (reading): `Pane.svelte:221` `max-height: 50%` for every view. As the brief says.
- C18 (reading): `present.yml:58-76` holds the lower-case labels the brief lists; `GroupHead.svelte:219-222` the sticky strip at `z-index: 2`. As the brief says.
- C19 (reading): `Present.svelte:171` `rows = deck?.slides ?? []` and `:332-333` `count={rows.length}`, so "0 / 0" while the deck loads. As the brief says; Bar.svelte's `count` is a number (ruling 7).

## DONE / NOT DONE

| Item | State | How it is built | Check and output |
| --- | --- | --- | --- |
| 1 Open View group glyphs | DONE | `open-view.svelte.ts` `groups()` maps each `readGroups` entry that is a rail page to the rail entry's `glyph` (`railPages`); `groupGlyph` and `Catalogue.svelte` unchanged; `layout.yml:8` says both | Reading; look: Open View on a pane's strip shows `compass`, `pillar`, `venue`, `poster`, `question`, `sliders` on the six group rows, and the Views view's headings keep `focus`, `book`, `venue_dist`, `conference`, `page`, `settings` |
| 2 "this is me" | DONE | `Person.svelte` `marking` from the press until `isSelf` or a refusal; `pressedSelf` draws pressed, active and the held tip; `setSelf` answers whether the write landed (ruling 2); `ToolButton.svelte` `.tool:not(.active):hover` and `.tool.bare:not(.active):hover` (519 lines) | Reading; look: press "this is me" on a person page and keep the pointer on it: pressed at once, no accent hover border; a refused write: unpressed, the writes store's reason |
| 3 Status bar Tab order | DONE | `row-reverse` removed; the right group, SourceItems, LanguageItems and AppItems written in drawn order (`drawn.reverse()` removed); `onfocusin={focused}` calls `scrollIntoView({ block: 'nearest', inline: 'nearest' })`; the four comments made true | Reading; look: Tab from the last left item walks the right group left to right, the bell last; in a narrow window a focused item scrolls into view; items stand where they stood |
| 4 "Project set" | DONE | `project.yml:193` `listing: Project set`; `Listing.svelte`'s fallback title is `t('views.listing')`, so it needs no change; `npm run docs:palette` writes `\| Project set \| listing \|` | `grep -n "Project set" docs/palette.md config/text/views/boards/project.yml`; look: the set view's tab with no set reads "Project set", a set opened from a card keeps its set's label |
| 5 Tips close with their menu | DONE | FocusFilter and PickMenu use `menuClosing` of `ui/menu/menu-items.ts` (Escape gives the focus back quietly, a press outside or Tab leaves it); `focus.yml:100` "Show only what the ticked roles, tiers, pillars and hubs hold." | Reading; look: Escape on the Focus filter's list and on "More 1": focus on the trigger, no tip; a press outside or Tab: no tip |
| 6 Removed rows leave | DONE | Collection: `settled.svelte.ts` `remove`/`removed` (by hub, collection and id through `entryKey`), forgotten after two builds or on a re-add, `deleteEntry` records it on success, `Collection.svelte` leaves those entries out (ruling 1). Bookmark: `fs-parts/bookmarks.svelte.ts` drops the row from the held list on success before the read. Schedule: `schedule.svelte.ts` `removals` leave the row out until a read no longer holds it; a save under the name stops it | Reading; look: delete a collection entry, remove a bookmark, delete a schedule: each row goes as the answer comes; a refused delete keeps the row; two hubs with the same collection and id: only the written hub's row goes |
| 7 Quick open and ignored folders | DONE | `search.ts` `unignored` asks `ignoredIn` (git check-ignore) about each folder between a nested repository and the repository holding it, drops the repository and those inside it, with the server's credentials passed through `search-routes.ts` and `+server.ts` (ruling 4) | `npx vitest run tests/server/files/nested-names.test.ts`: passes (in the scoped run `Test Files  10 passed (10)`, `Tests  143 passed (143)`); its failing run on the unchanged tree is quoted under C7 |
| 8 Settings search width | DONE | `Header.svelte` `.found` wraps, `.field { flex: 1 1 12em; min-width: 12em }`, the count goes under the field when both do not fit | Reading of the CSS; look: a Settings pane 360 px wide at text sizes 1 and 1.5: field at least 12em, count under it |
| 9 Save and Save All | DONE | `compact` removed from both, so each draws its label beside the glyph; `<p class="said">` always drawn with `min-height: 1lh` | Reading; look: Save and Save All draw their words ("[Save]", "[Save All]" under brackets); the bar's height and the first row's top equal with and without "Saved into" at both text sizes |
| 10 Refused value marks its field | DONE | Control.svelte hands the worded refusal as `invalid` to FieldControl, which hands it to every input (FieldControl split into `InlineItems.svelte`, ruling 5); TextArea and SuggestInput take `invalid` (`aria-invalid`, title, the field's red border); every Settings message of the brief's list ends with a stop, `oneStop` keeps one stop, `write.ts` strips the server's reasons of theirs | `npx vitest run tests/state/system/settings/row-writer.test.ts`: `Tests  13 passed (13)`; `grep -nE '^\s+settings_[a-z_]+: ' config/text/views/system/workbench.yml \| grep -vE "[.?!]['\"]?$"` prints only the `settings_origin_*` fragments; look: "abc" in a range field marks it and says a sentence with one stop; Escape and the held value typed back remove both |
| 11 Unsaved counts agree | DONE | The Settings tab's refused fields are runtime state of `ui.svelte.ts` (`refusedFields`, `markRefused`, never in a saved record: `grep -n refused src/lib/state/system/config/typed.ts` shows no key in the typed record), set by Control.svelte on a refusal and dropped at the next keystroke; `settingsTyped` skips refused and empty text | Reading; look: a refused value typed: no tab dot, no Settings tab in the status bar count, header "No unsaved change"; a valid typed value not sent: the dot |
| 12 Emptying a row with no key | DONE | `commitValue(spec, input, lists, held, own)` answers `{ write: false, unset: true }` for empty text when `own` is false; `write.ts` drops any held change and the message | Same row-writer run, `Tests  13 passed (13)`; its failing run on the unchanged tree is quoted under C12 |
| 13 Cmd+S on More actions | NOT DONE | No cause found by the case-run programs below; no code changed | Look at landing: in the browser and in the desktop app, stage a change in a Settings row, Shift+Tab to that row's More actions, press Cmd+S, and also pick File > Save in the desktop app: the change is written and "Saved into {0}." is said |
| 14 Card actions and the title | DONE | CardActions measures its width (plus the clipped edge and the row's gap) each time it is drawn over the title and tells the card through `cardRoom`; the card pads its title by `--card-room` on hover devices, reset on every card; sharing the chips' line it tells none | Reading of the CSS; look: a Career card, a LinkedIn card and a card with more buttons, long titles: no word under a button; under `hover: none` as before the step |
| 15 Panes halving | DONE | Each pane measures its width (`pane-view.ts` `paneWidth`, a ResizeObserver, attached in `PaneView.svelte`) into `opening.ts` `widths` (never saved, dropped when the pane goes, ruling 6); `landingFor` takes a `PaneRoom`: a split that leaves a half under 320 px times the text size lands as a tab of a pane neither locked nor the asker, the reader's or else the widest | Reading; look: a page of three panes, a record pressed from the narrowest: no split under the width, the record opens as a tab elsewhere; a page of one pane: splits; a float: as before the step |
| 16 Rice "# " | DONE | `Empty.svelte` `.empty:not(.error):not(.glyphed)::before` | Reading of the CSS; look under rice, brackets on and off: Live HPC's error box draws no "# ", an empty state with a glyph none, one with no glyph "# " |
| 17 Present in a narrow pane | DONE | `Pane.svelte` `max-height: var(--viewbar-max, 50%)`; only `Present.svelte` sets `--viewbar-max="33.33%"` | Reading; look: Present in a 420 px pane at text size 1.5 with the bars wrapped: bars at most a third, the slide in the rest; another view's bar keeps 50% |
| 18 Find form | DONE | `present.yml` labels capitalised (Find, Title and Tag tones already were); RuleForm scrolls the pane body so the strip covers no label when the form opens and when the focus moves to a control (`uncover`, `unhidden`); GroupHead unchanged | `grep -nE "field_(discover\|find)" config/text/views/academic/present.yml`; look: open Edit Rule from a strip standing over the body, and Tab through the form: no label under the strip |
| 19 Slide counter | DONE | `Bar.svelte` `count: number \| null`, the counter drawn only for a number, the buttons disabled while `slideless`; `Present.svelte` `counted` is null while no deck is drawn or the deck is missing or unreadable (ruling 7) | Reading; look: a deck loading: no counter; a loaded deck of no slide "0 / 0"; 4 slides on the first "1 / 4"; a failed deck: no counter; a switch while loading never shows the old count |

The checks of "Verify before you report":

1. `npm run diagrams` and `npm run docs:palette` ran after the last change; `npm run test:quick` ran four times as a full list, and none printed "every command passed".
   - Run 1: eslint failed on the module-script export of `Card.svelte` in CardActions.svelte (fixed by the move to `ui/frame/card/card-room.ts`). vitest failed on `nested-names.test.ts`, timed out at 5000 ms (fixed by the slow tag). vitest checks failed on six comment lines of 101 columns (rewrapped) and on module-level state `NONE_REFUSED` in `ui.svelte.ts` (moved into `createUi`). vitest slow failed on two `hub-portfolio.test.ts` timeouts.
   - Run 2: prettier, ASCII gate, eslint, svelte-check (`0 ERRORS 0 WARNINGS`), vitest and vitest checks ok; vitest slow failed on three `hub-portfolio.test.ts` timeouts at 20000 ms.
   - Run 3, after comment fixes: vitest failed on `tests/routes/hubs/hub-secrets.test.ts` 'is refused as outside by an lsp-edit and a writing-fix, which write nothing', timed out at 5000 ms (alone: `Tests  10 passed (10)`); vitest slow failed on six `hub-portfolio.test.ts` timeouts. A scoped vitest run of mine was running beside it.
   - Run 4, after the last change, with nothing else running:

```
ok      prettier (2.4 s): All matched files use Prettier code style!
ok      ASCII gate (2.6 s)
ok      svelte-kit sync (4.1 s)
ok      eslint (20.0 s)
ok      svelte-check (20.3 s): 1794093661869 COMPLETED 590 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (129.8 s): Duration  106.54s (transform 109.46s, setup 0ms, import 300.68s, tests 95.48s, environment 8.03s)
ok      vitest checks (171.2 s): Duration  147.76s (transform 90.67s, setup 0ms, import 149.72s, tests 405.08s, environment 4ms)
FAILED  vitest slow (179.6 s)
 FAIL  |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > resolves a reference of the second hub in the primary hub when the primary alone holds the key
 FAIL  |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > reads a field of a second-hub entry that names a record as the key its file holds (G32)
 Test Files  1 failed | 8 passed (9)
      Tests  2 failed | 54 passed | 13 skipped (69)
test:quick: 184.0 s; failed: vitest slow
```

   Both failures are `Error: Test timed out in 20000ms.`; `npx vitest run tests/data/hubs/hub-portfolio.test.ts --tagsFilter slow --testTimeout 20000 --reporter verbose` passes all 16, each about 3 s, and the slow tier's nine files run alone print `Test Files  9 passed (9)`.
2. The ASCII gate over every changed file (`(git diff --name-only --diff-filter=d; git ls-files --others --exclude-standard) | grep -v '^\.scratch' | grep -vE '\.svg$' | tr '\n' '\0' | xargs -0 perl -ne 'print "$ARGV:$.: $_" if /[^\x00-\x7F]/; close ARGV if eof'`) prints nothing; test:quick's own "ASCII gate" tier prints ok.
3. The rows the step adds: `npx vitest run tests/state/system/settings/row-writer.test.ts` prints `Tests  13 passed (13)`; `npx vitest run tests/server/files/nested-names.test.ts` prints `Test Files  1 passed (1)`, `Tests  1 passed (1)`. Their failing runs on the unchanged tree are quoted under C7, C10 and C12.
4. `sh utils/unused-exports.sh` compared with `.agents/worktrees/O167-base/unused-exports.txt`: `diff` prints nothing (exit 0), so the step adds no line.
5. `wc -l` of every changed file is in the file table below: the largest source files are `context.ts` 879, `writes.svelte.ts` 877, `layout.svelte.ts` 873, `fs.svelte.ts` 849 (base 898, now under 880), all within 880; the largest components `PaneView.svelte` 519 and `ToolButton.svelte` 519, within 520. `sh utils/folder-check.sh` exits 0.
6. The changed catalog sentences are one sentence each. `settings_origin_none` ("{0} has no {1}, or one that does not read as text, is longer than the file window reads or is a link out of the folder.") stays one long sentence: only its full stop is added, and it names the four reasons one file is not read. The history-word grep over the added comment lines (`git diff -U0 -- src tests config | grep -E '^\+' | grep -E '//|/\*|\*|<!--|#' | grep -nwiE "before|used to|no longer|still"`, and the same over the new files) prints only words of order or state ("drops its row ... before the bookmarks are read again", "the snapshot may still show it", "the file read again no longer holds it"); none names an earlier version of the code.

## Files with line counts

From `diff -rq` against the base copy over `src`, `tests` and `config` (`config` with `-x local.yml`), with `wc -l`:

| File | Lines |
| --- | --- |
| config/defaults/layout.yml | 334 |
| config/text/views/academic/present.yml | 152 |
| config/text/views/boards/focus.yml | 147 |
| config/text/views/boards/project.yml | 196 |
| config/text/views/system/workbench.yml | 305 |
| docs/palette.md | 202 |
| docs/diagrams/layer-server, layer-shell, layer-state, layer-views, layers (.dot and .svg) | generated |
| src/lib/server/files/search/search-routes.ts | 102 |
| src/lib/server/files/search/search.ts | 806 |
| src/lib/shell/panes/pane-view.ts | 673 |
| src/lib/shell/panes/PaneView.svelte | 519 |
| src/lib/shell/panes/strip/open-view.svelte.ts | 144 |
| src/lib/shell/status/AppItems.svelte | 61 |
| src/lib/shell/status/LanguageItems.svelte | 353 |
| src/lib/shell/status/SourceItems.svelte | 203 |
| src/lib/shell/status/StatusBar.svelte | 462 |
| src/lib/state/client/context.ts | 879 |
| src/lib/state/client/writes.svelte.ts | 877 |
| src/lib/state/forms/page-entry.ts | 525 |
| src/lib/state/forms/settled.svelte.ts | 171 |
| src/lib/state/sources/explorer/sections/timeline-state.svelte.ts | 101 |
| src/lib/state/sources/fs-history.ts | moved to fs-parts/history.ts |
| src/lib/state/sources/fs-parts/bookmarks.svelte.ts (new) | 109 |
| src/lib/state/sources/fs-parts/history.ts | 165 |
| src/lib/state/sources/fs.svelte.ts | 849 |
| src/lib/state/system/config/editors/fields.ts | 784 |
| src/lib/state/system/config/editors/origins.ts | 135 |
| src/lib/state/system/config/messages.ts | 81 |
| src/lib/state/system/config/scopes/write.ts | 166 |
| src/lib/state/system/config/typed.ts | 168 |
| src/lib/state/system/machine/schedules/schedule.svelte.ts | 802 |
| src/lib/state/workbench/layout.svelte.ts | 873 |
| src/lib/state/workbench/layout/open/landing.ts | 124 |
| src/lib/state/workbench/layout/open/opening.ts | 603 |
| src/lib/state/workbench/navigation/rail.ts | 158 |
| src/lib/state/workbench/ui.svelte.ts | 606 |
| src/lib/ui/controls/ToolButton.svelte | 519 |
| src/lib/ui/forms/choice/SuggestInput.svelte | 207 |
| src/lib/ui/forms/NumberInput.svelte | 92 |
| src/lib/ui/forms/TextArea.svelte | 157 |
| src/lib/ui/frame/Card.svelte | moved to frame/card/Card.svelte |
| src/lib/ui/frame/card/Card.svelte | 358 |
| src/lib/ui/frame/card/card-room.ts (new) | 25 |
| src/lib/ui/frame/Empty.svelte | 134 |
| src/lib/ui/frame/Pane.svelte | 262 |
| src/lib/views/academic/career/CareerCard.svelte | 94 |
| src/lib/views/academic/present/arrange/RuleForm.svelte | 184 |
| src/lib/views/academic/present/arrange/Tile.svelte | 184 |
| src/lib/views/academic/present/Bar.svelte | 151 |
| src/lib/views/academic/present/Present.svelte | 473 |
| src/lib/views/boards/collection/Collection.svelte | 456 |
| src/lib/views/boards/focus/FocusFilter.svelte | 313 |
| src/lib/views/boards/focus/lanes/LaneCard.svelte | 353 |
| src/lib/views/boards/person/Person.svelte | 309 |
| src/lib/views/shared/card/record/CardActions.svelte | 372 |
| src/lib/views/shared/card/record/RecordCard.svelte | 400 |
| src/lib/views/shared/forms/bar/PickMenu.svelte | 343 |
| src/lib/views/system/machine/usage/Usage.svelte | 416 |
| src/lib/views/system/status/Gallery.svelte | 425 |
| src/lib/views/system/status/Status.svelte | 179 |
| src/lib/views/system/workbench/editors/FieldControl.svelte | 475 |
| src/lib/views/system/workbench/editors/InlineItems.svelte (new) | 96 |
| src/lib/views/system/workbench/settings/Control.svelte | 165 |
| src/lib/views/system/workbench/settings/Header.svelte | 134 |
| src/lib/views/system/workbench/settings/other-rows/WallpaperPicker.svelte | 93 |
| src/lib/views/system/workbench/settings/said.ts | 35 |
| src/lib/views/system/workbench/settings/scopes/ScopeBar.svelte | 228 |
| src/routes/api/(files)/search/+server.ts | 26 |
| tests/server/files/nested-names.test.ts | 100 |
| tests/state/client/created-ids.test.ts | 113 |
| tests/state/sources/settings-readers.test.ts | 147 |
| tests/state/system/settings/row-writer.test.ts | 271 |

## C13: the case-run programs and their output

No cause was found. The programs ran from the worktree with `npx vitest run --config <scratch>/vitest.c13.mts --root . <file>`; their files lived in the scratchpad folder `o167-c13` and are deleted. They write nothing into the worktree. Their limit: jsdom moves no focus into an opened bits-ui menu and does not close it on Escape ("menus open 1" after Escape below), it draws no layout, and it runs no Electron; the real browser's focus handling and the desktop accelerator are what the look at landing checks.

Step 1 prints, for Cmd+S with the focus on a text box and on the More actions button of Gear.svelte (its real Menu, MenuOpener, Tooltip and bits-ui trigger), what a window keydown listener standing where Workbench.svelte's stands receives, and what `resolveKey` answers. Output:

```
gear button: <button type="button" class="opener svelte-p9zx7v compact bare" aria-label="More actions" id="bits-c1" aria-haspopup="menu" aria-expanded="false" data-state="closed" data-dropdown-menu-trigger=""><!--
focus on the text box: {"target":"INPUT","defaultPrevented":false,"action":{"kind":"save"}}
focus on More actions (active element BUTTON): {"target":"BUTTON","defaultPrevented":false,"action":{"kind":"save"}}
```

Step 2 mounts one Settings row's Item with the scopes, writer and tab save Settings.svelte gives it, in a real `createClientState` with a Settings tab, and the real `createWorkbenchKeys` with `sourceKeys`; a value is typed, then Cmd+S is pressed (or the desktop menu's save answered) with the focus in the box, on More actions, and after the menu was opened by pointer or Enter and closed with Escape. Output (the "window keydown" line comes from a second listener after the workbench keys handled the key, so `defaultPrevented true, action null` is the workbench's own prevention):

```
row: locale (text)
active tab the keys address: {"id":"settings-1","view":"settings","state":{}}
focus left in the box:
  box true, gear true
  before Cmd+S: active INPUT, staged []
  :focus-visible on the focused element: true; tooltips drawn: 0
  saveTab(settings-1) called
  window keydown: target INPUT, defaultPrevented true, action null
  sent [{"kind":"config-save","scope":"local","root":"hub","digest":"digest","changes":[{"file":"appearance.yml","key":"locale","value":"Typed Font"}]}]
  said {"key":"workbench.settings_scope_saved","args":["local.yml"]}
  staged after []
focus moved to More actions:
  box true, gear true
  before Cmd+S: active BUTTON, staged [{"file":"appearance.yml","key":"locale","value":"Typed Font"}]
  :focus-visible on the focused element: true; tooltips drawn: 1
  saveTab(settings-1) called
  window keydown: target BUTTON, defaultPrevented true, action null
  sent [{"kind":"config-save","scope":"local","root":"hub","digest":"digest","changes":[{"file":"appearance.yml","key":"locale","value":"Typed Font"}]}]
  said {"key":"workbench.settings_scope_saved","args":["local.yml"]}
  staged after []
focus moved to More actions, the desktop menu:
  box true, gear true
  before Cmd+S: active BUTTON, staged [{"file":"appearance.yml","key":"locale","value":"Typed Font"}]
  :focus-visible on the focused element: true; tooltips drawn: 1
  saveTab(settings-1) called
  the desktop menu's save answered: true
  sent [{"kind":"config-save","scope":"local","root":"hub","digest":"digest","changes":[{"file":"appearance.yml","key":"locale","value":"Typed Font"}]}]
  said {"key":"workbench.settings_scope_saved","args":["local.yml"]}
  staged after []
More actions opened with the pointer, closed with Escape:
  box true, gear true
  after the press: menus open 1, active BUTTON "More actions"
  window keydown: target BUTTON, defaultPrevented true, action null
  after Escape: menus open 1, active BUTTON "More actions"
  before Cmd+S: active BUTTON, staged [{"file":"appearance.yml","key":"locale","value":"Typed Font"}]
  :focus-visible on the focused element: true; tooltips drawn: 1
  saveTab(settings-1) called
  window keydown: target BUTTON, defaultPrevented true, action null
  sent [{"kind":"config-save","scope":"local","root":"hub","digest":"digest","changes":[{"file":"appearance.yml","key":"locale","value":"Typed Font"}]}]
  said {"key":"workbench.settings_scope_saved","args":["local.yml"]}
  staged after []
More actions opened with Enter, closed with Escape:
  box true, gear true
  window keydown: target BUTTON, defaultPrevented true, action null
  after Enter: menus open 1, active BUTTON "More actions"
  window keydown: target BUTTON, defaultPrevented true, action null
  after Escape: menus open 1, active BUTTON "More actions"
  before Cmd+S: active BUTTON, staged [{"file":"appearance.yml","key":"locale","value":"Typed Font"}]
  :focus-visible on the focused element: true; tooltips drawn: 1
  saveTab(settings-1) called
  window keydown: target BUTTON, defaultPrevented true, action null
  sent [{"kind":"config-save","scope":"local","root":"hub","digest":"digest","changes":[{"file":"appearance.yml","key":"locale","value":"Typed Font"}]}]
  said {"key":"workbench.settings_scope_saved","args":["local.yml"]}
  staged after []
row: appearance.yml text_size (number)
number: focus left in the box:
  box true, gear true
  before Cmd+S: active INPUT, staged []
  :focus-visible on the focused element: true; tooltips drawn: 0
  saveTab(settings-1) called
  window keydown: target INPUT, defaultPrevented true, action null
  sent [{"kind":"config-save","scope":"local","root":"hub","digest":"digest","changes":[{"file":"appearance.yml","key":"text_size","value":1.25}]}]
  said {"key":"workbench.settings_scope_saved","args":["local.yml"]}
  staged after []
number: focus moved to More actions:
  box true, gear true
  before Cmd+S: active BUTTON, staged [{"file":"appearance.yml","key":"text_size","value":1.25}]
  :focus-visible on the focused element: true; tooltips drawn: 1
  saveTab(settings-1) called
  window keydown: target BUTTON, defaultPrevented true, action null
  sent [{"kind":"config-save","scope":"local","root":"hub","digest":"digest","changes":[{"file":"appearance.yml","key":"text_size","value":1.25}]}]
  said {"key":"workbench.settings_scope_saved","args":["local.yml"]}
  staged after []
```

The sources follow. `vitest.c13.mts`:

```ts
// Scratch config for the O167 C13 case-run program: the worktree's own vite config, with one
// project, the client runtime's, whose files are the program in this folder.
import base from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O167/vite.config.ts';

const HERE = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o167-c13';
const WT = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O167';

export default async (env: { mode: string; command: string }) => {
    const made = await (base as unknown as (e: unknown) => Promise<Record<string, any>>)(env);
    const client = made.test.projects[2];
    made.test.projects = [
        {
            ...client,
            resolve: {
                ...client.resolve,
                alias: [
                    { find: /^svelte$/, replacement: `${WT}/node_modules/svelte/src/index-client.js` },
                    { find: /^jsdom$/, replacement: `${WT}/node_modules/jsdom/lib/api.js` }
                ]
            },
            test: { ...client.test, dir: HERE, include: [`${HERE}/**/*.client.test.ts`] }
        }
    ];
    made.test.dir = HERE;
    made.server = { ...made.server, fs: { allow: [WT, HERE] } };
    return made;
};
```

`Host.svelte`:

```svelte
<script lang="ts">
    // O167 C13 case-run program host: one Settings row's Item with the scopes, the writer and the
    // tab save a Settings view gives it (Settings.svelte:217-228), so the save key's tab saves run
    // as they do on the page.
    import Item from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O167/src/lib/views/system/workbench/settings/Item.svelte';
    import { provideScopes } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O167/src/lib/views/system/workbench/settings/scopes/context.ts';
    import { reactiveWriter } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O167/src/lib/views/system/workbench/settings/writer.svelte.ts';
    import { createEditorWriter } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O167/src/lib/state/system/config/editors/writer.ts';
    import { useState } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O167/src/lib/state/client/use.ts';

    let { row, id, scopes, lists } = $props();
    provideScopes(scopes);
    const { ui } = useState();
    $effect(() =>
        ui.registerTabSave(id, async () => {
            const saved = await scopes.save();
            return saved && scopes.changes.files().length === 0;
        })
    );
    const writer = reactiveWriter(scopes.stage, () => lists);
    const editors = createEditorWriter({
        stage: scopes.stage,
        changed: () => undefined,
        ended: () => undefined,
        held: () => undefined,
        stale: () => false,
        lists: () => lists
    });
</script>

<Item {row} {id} {writer} {editors} {lists} kept onrepo={() => undefined} />
```

`GroupHost.svelte`:

```svelte
<script lang="ts">
    // O167 C13 case-run program host: Host.svelte inside the page's one tooltip group, as the
    // page's layout draws every control.
    import TooltipGroup from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O167/src/lib/ui/menu/TooltipGroup.svelte';
    import Host from './Host.svelte';

    let props = $props();
</script>

<TooltipGroup>
    <Host {...props} />
</TooltipGroup>
```

`c13.client.test.ts` (step 1):

```ts
// O167 C13 case-run program, step 1: Cmd+S pressed with the focus on a setting's More actions
// button (Gear.svelte, mounted with its real Menu, MenuOpener, Tooltip and bits-ui trigger) and
// with the focus on a text box, in jsdom under Svelte's client runtime. For each it prints what a
// window keydown listener, standing where Workbench.svelte's <svelte:window onkeydown> stands,
// receives, and what resolveKey answers for that event.
import { JSDOM } from 'jsdom';
import { flushSync, mount, unmount } from 'svelte';
import { expect, it, vi } from 'vitest';

const WT = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O167';
const OUT =
    '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o167-c13/out.txt';

it('C13 step 1', async () => {
    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
        pretendToBeVisual: true,
        url: 'http://127.0.0.1/'
    });
    const w = dom.window as unknown as Record<string, unknown>;
    for (const name of [
        'window', 'document', 'navigator', 'Node', 'Element', 'HTMLElement', 'HTMLInputElement',
        'HTMLButtonElement', 'HTMLTextAreaElement', 'HTMLIFrameElement', 'SVGElement', 'Text',
        'Comment', 'DocumentFragment', 'Event', 'KeyboardEvent', 'FocusEvent', 'MouseEvent',
        'PointerEvent', 'CustomEvent', 'MutationObserver', 'getComputedStyle',
        'requestAnimationFrame', 'cancelAnimationFrame', 'HTMLTemplateElement', 'CSS'
    ]) {
        if (w[name] !== undefined) vi.stubGlobal(name, w[name]);
    }
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    if (w.PointerEvent === undefined) vi.stubGlobal('PointerEvent', w.MouseEvent);

    const config = await import(`${WT}/src/lib/data/sources/config.ts`);
    const text = await import(`${WT}/src/lib/state/shared/words/text.ts`);
    const loaded = config.loadConfig(config.engineDir()).config;
    text.setCatalog(config.textCatalog(loaded));
    text.setGlyphs(config.glyphCatalog(loaded));
    const { resolveKey, initialKeyState } = await import(
        `${WT}/src/lib/data/helpers/keys/oculus/resolve.ts`
    );
    const { typingIn } = await import(`${WT}/src/lib/shell/keys/workbench-keys.svelte.ts`);
    const Gear = (await import(`${WT}/src/lib/views/system/workbench/settings/Gear.svelte`))
        .default;
    const tips = await import(`${WT}/src/lib/ui/menu/tip-ids.ts`);

    const document = dom.window.document;
    const field = document.createElement('input');
    document.body.appendChild(field);
    const host = document.createElement('div');
    document.body.appendChild(host);
    const gear = mount(Gear, {
        target: host,
        context: new Map([[tips.TIP_KEY, tips.createTipIds()]]),
        props: { reset: true, copy: true, onreset: () => undefined, oncopy: () => undefined }
    });
    flushSync();

    const seen: Record<string, unknown>[] = [];
    dom.window.addEventListener('keydown', (event: KeyboardEvent) => {
        const result = resolveKey(
            event,
            [],
            {
                cursorActive: false,
                typing: typingIn(event.target),
                paletteOpen: false,
                trayOpen: false,
                confirmOpen: false,
                mac: true,
                app: false
            },
            initialKeyState(),
            Date.now()
        );
        seen.push({
            target: (event.target as Element).tagName,
            defaultPrevented: event.defaultPrevented,
            action: result.action
        });
    });

    function press(target: HTMLElement): void {
        target.focus();
        flushSync();
        const event = new dom.window.KeyboardEvent('keydown', {
            key: 's',
            code: 'KeyS',
            metaKey: true,
            bubbles: true,
            cancelable: true
        });
        target.dispatchEvent(event);
        flushSync();
    }

    const lines: string[] = [];
    const print = (line: string): void => void lines.push(line);
    const button = host.querySelector('button');
    print(`gear button: ${button?.outerHTML.slice(0, 200)}`);
    press(field);
    print(`focus on the text box: ${JSON.stringify(seen.at(-1) ?? 'nothing reached the window')}`);
    const before = seen.length;
    if (button !== null) press(button);
    print(
        `focus on More actions (active element ${document.activeElement?.tagName}): ${JSON.stringify(seen.length > before ? seen.at(-1) : 'nothing reached the window')}`
    );
    await unmount(gear);
    vi.unstubAllGlobals();
    const fs = await import('node:fs');
    fs.writeFileSync(OUT, lines.join('\n') + '\n');
    expect(true).toBe(true);
}, 240_000);
```

`c13b.client.test.ts` (step 2):

```ts
// O167 C13 case-run program, step 2: one Settings row's Item (Host.svelte beside it gives it the
// scopes, the writer and the tab save Settings.svelte gives it), in jsdom under Svelte's client
// runtime with a real client state. A value is typed in the row's box; then Cmd+S is pressed with
// the focus left in the box, and, on a fresh mount, after the focus moved to the row's More
// actions button. A window keydown listener stands where Workbench.svelte's stands: it resolves
// the key and, for a save, runs the client's saveTab for the tab, as source-keys.ts does. For each
// it prints what was sent and what the scope says.
import { JSDOM } from 'jsdom';
import { flushSync, mount, unmount } from 'svelte';
import { expect, it, vi } from 'vitest';

const WT = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O167';
const HERE =
    '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o167-c13';
const TAB = 'settings-1';

it('C13 step 2', async () => {
    const lines: string[] = [];
    const print = (line: string): void => void lines.push(line);
    const fs = await import('node:fs');
    try {
        await run(print);
    } catch (error) {
        print(`threw: ${(error as Error).stack ?? String(error)}`);
    }
    fs.writeFileSync(`${HERE}/out-b.txt`, lines.join('\n') + '\n');
    expect(true).toBe(true);
}, 240_000);

async function run(print: (line: string) => void): Promise<void> {
    vi.stubGlobal('fetch', () => Promise.resolve(new Response('{}', { status: 404 })));
    const { createClientState } = await import(`${WT}/src/lib/state/client/context.ts`);
    const client = createClientState();
    client.layout.apply({
        root: { kind: 'pane', tabs: [{ id: TAB, view: 'settings', state: {} }], active: TAB }
    });
    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
        pretendToBeVisual: true,
        url: 'http://127.0.0.1/'
    });
    const w = dom.window as unknown as Record<string, unknown>;
    for (const name of [
        'window', 'document', 'navigator', 'Node', 'Element', 'HTMLElement', 'HTMLInputElement',
        'HTMLButtonElement', 'HTMLTextAreaElement', 'HTMLIFrameElement', 'SVGElement', 'Text',
        'Comment', 'DocumentFragment', 'Event', 'KeyboardEvent', 'FocusEvent', 'MouseEvent',
        'InputEvent', 'CustomEvent', 'MutationObserver', 'getComputedStyle',
        'requestAnimationFrame', 'cancelAnimationFrame', 'HTMLTemplateElement', 'CSS'
    ]) {
        if (w[name] !== undefined) vi.stubGlobal(name, w[name]);
    }
    for (const name of Object.getOwnPropertyNames(dom.window)) {
        if (/^(HTML|SVG)\w*Element$/.test(name)) vi.stubGlobal(name, w[name]);
    }
    vi.stubGlobal('PointerEvent', w.PointerEvent ?? w.MouseEvent);
    const Observer = class { observe() {} unobserve() {} disconnect() {} };
    vi.stubGlobal('ResizeObserver', Observer);
    (dom.window as unknown as Record<string, unknown>).ResizeObserver = Observer;

    const config = await import(`${WT}/src/lib/data/sources/config.ts`);
    const text = await import(`${WT}/src/lib/state/shared/words/text.ts`);
    const loaded = config.loadConfig(config.engineDir()).config;
    text.setCatalog(config.textCatalog(loaded));
    text.setGlyphs(config.glyphCatalog(loaded));
    const { catalogOf } = await import(`${WT}/src/lib/data/sources/config/catalog/options.ts`);
    const { fileRows } = await import(`${WT}/src/lib/state/system/config/rows.ts`);
    const { listsOf } = await import(`${WT}/src/lib/state/system/config/editors/sources.ts`);
    const { createScopes } = await import(
        `${WT}/src/lib/views/system/workbench/settings/scopes/scopes.svelte.ts`
    );
    const { resolveKey, initialKeyState } = await import(
        `${WT}/src/lib/data/helpers/keys/oculus/resolve.ts`
    );
    const { typingIn } = await import(`${WT}/src/lib/shell/keys/workbench-keys.svelte.ts`);
    const { STATE_KEY } = await import(`${WT}/src/lib/state/client/use.ts`);
    const tips = await import(`${WT}/src/lib/ui/menu/tip-ids.ts`);
    const Host = (await import(`${HERE}/GroupHost.svelte`)).default;

    const shipped = catalogOf(loaded);
    const FILE = 'appearance.yml';
    const rows = fileRows(FILE, shipped[FILE], loaded, {
        workspace: {
            root: 'hub',
            path: '.oculus/workspaces/w.yml',
            text: { text: '', truncated: false, error: '', loading: false }
        }
    }).rows;
    let row = rows.find((one: { control: string }) => one.control === 'text');
    /** The first row of oculus's own files drawn with each control, for the later trials. */
    const firstOf = (control: string) => {
        for (const file of Object.keys(shipped)) {
            const found = fileRows(file, shipped[file], loaded, {
                workspace: {
                    root: 'hub',
                    path: '.oculus/workspaces/w.yml',
                    text: { text: '', truncated: false, error: '', loading: false }
                }
            }).rows.find(
                (one: { control: string; kind: string }) =>
                    one.control === control && one.kind === 'config'
            );
            if (found !== undefined) return found;
        }
        return undefined;
    };
    print(`row: ${row?.key} (${row?.control})`);
    const lists = listsOf({
        config: loaded,
        portfolio: null,
        views: [],
        tiers: null,
        themeClasses: [],
        codeThemeClasses: [],
        offers: { themes: [], icons: [] },
        folder: () => ({ state: 'ready', entries: [] })
    });

    const document = dom.window.document;
    const { createWorkbenchKeys } = await import(
        `${WT}/src/lib/shell/keys/workbench-keys.svelte.ts`
    );
    const { sourceKeys } = await import(`${WT}/src/lib/shell/window/source-keys.ts`);
    const { menuPage, answerMenu } = await import(`${WT}/src/lib/shell/window/menu-answer.ts`);
    const { effect_root } = await import(`${WT}/node_modules/svelte/src/internal/client/index.js`);
    const pageTab = () => client.layout.activeInstance();
    let keyboard: { keys: (event: KeyboardEvent) => void; paneFocused: (e: FocusEvent) => void; covered: () => boolean; act: (a: unknown) => void } | null = null;
    const stopKeys = effect_root(() => {
        keyboard = createWorkbenchKeys({
            drag: client.drag,
            layout: client.layout,
            history: { back: () => Promise.resolve(), forward: () => Promise.resolve() },
            ui: client.ui,
            navigation: () => ({ groups: [], chord: {} }),
            activeTab: pageTab,
            focus: () => null,
            paletteOpen: () => false,
            paletteMode: () => null,
            updateOpen: () => false,
            setPaletteOpen: () => undefined,
            setUpdateOpen: () => undefined,
            openDoc: () => undefined,
            composeIn: () => undefined,
            focusSearchBox: () => undefined,
            runDefault: () => undefined,
            debugging: () => false,
            ...sourceKeys(client, pageTab),
            debugKey: () => false,
            walkProblem: () => false,
            mac: true,
            app: false,
            railPage: () => false,
            openPalette: () => undefined,
            showPalette: () => undefined
        });
    });
    const savesBefore = client.ui.saveTab;
    let tabSaves = 0;
    client.ui.saveTab = (id: string) => {
        tabSaves += 1;
        print(`  saveTab(${id}) called`);
        return savesBefore(id);
    };
    dom.window.addEventListener('keydown', (event: KeyboardEvent) => keyboard?.keys(event));
    dom.window.addEventListener('focusin', (event: FocusEvent) => keyboard?.paneFocused(event));
    print(`active tab the keys address: ${JSON.stringify(pageTab())}`);
    void stopKeys;
    void tabSaves;
    void menuPage;
    void answerMenu;
    dom.window.addEventListener('keydown', (event: KeyboardEvent) => {
        const result = resolveKey(
            event,
            [],
            {
                cursorActive: false,
                typing: typingIn(event.target),
                paletteOpen: false,
                trayOpen: false,
                confirmOpen: false,
                mac: true,
                app: false
            },
            initialKeyState(),
            Date.now()
        );
        print(
            `  window keydown: target ${(event.target as Element).tagName}, defaultPrevented ${event.defaultPrevented}, action ${JSON.stringify(result.action)}`
        );
    });

    async function trial(
        name: string,
        before: (box: HTMLInputElement, gear: HTMLElement) => void,
        menu = false
    ) {
        print(`${name}:`);
        const sent: unknown[] = [];
        const scopes = createScopes({
            scope: () => ({ kind: 'local', hub: 'hub' }),
            ground: () => ({
                folders: [{ key: 'hub', dir: '/w/hub', hub: true }],
                primary: 'hub',
                workspaceFile: '.oculus/workspaces/w.yml'
            }),
            read: () => ({ name: 'local.yml', present: true, blocked: null, digest: 'digest' }),
            downloads: () => [],
            send: (body: unknown) => {
                sent.push(body);
                return Promise.resolve({ ok: true, changed: ['local.yml'], refused: [] });
            },
            saveWorkspace: () => Promise.resolve({ ok: true, changed: [], refused: [] })
        });
        const host = document.createElement('div');
        document.body.appendChild(host);
        const mounted = mount(Host, {
            target: host,
            context: new Map<unknown, unknown>([
                [STATE_KEY, client],
                [tips.TIP_KEY, tips.createTipIds()]
            ]),
            props: { row, id: TAB, scopes, lists }
        });
        flushSync();
        const box = host.querySelector('input, textarea') as HTMLInputElement | null;
        const gear = host.querySelector('.gear button');
        print(`  box ${box !== null}, gear ${gear !== null}`);
        if (box === null || gear === null) {
            await unmount(mounted);
            return;
        }
        box.focus();
        box.value = row.control === 'number' ? '1.25' : 'Typed Font';
        box.dispatchEvent(new dom.window.InputEvent('input', { bubbles: true }));
        flushSync();
        before(box, gear as HTMLElement);
        flushSync();
        print(
            `  before Cmd+S: active ${document.activeElement?.tagName}, staged ${JSON.stringify(scopes.changes.of(scopes.file()))}`
        );
        const target = document.activeElement as HTMLElement;
        let visible = 'n/a';
        try {
            visible = String(target.matches(':focus-visible'));
        } catch (error) {
            visible = `threw ${(error as Error).message}`;
        }
        print(
            `  :focus-visible on the focused element: ${visible}; tooltips drawn: ${document.querySelectorAll('[role="tooltip"]').length}`
        );
        if (menu) {
            const page = menuPage(client, {
                covered: () => keyboard?.covered() ?? false,
                act: (action: unknown) => keyboard?.act(action),
                openPalette: () => undefined,
                openUpdate: () => undefined,
                saveAll: () => undefined,
                tab: pageTab
            });
            print(`  the desktop menu's save answered: ${answerMenu(page, 'save')}`);
        } else {
            target.dispatchEvent(
                new dom.window.KeyboardEvent('keydown', {
                    key: 's',
                    code: 'KeyS',
                    metaKey: true,
                    bubbles: true,
                    cancelable: true
                })
            );
        }
        flushSync();
        await new Promise((done) => setTimeout(done, 20));
        flushSync();
        print(`  sent ${JSON.stringify(sent)}`);
        print(`  said ${JSON.stringify(scopes.said(scopes.file()))}`);
        print(`  staged after ${JSON.stringify(scopes.changes.of(scopes.file()))}`);
        await unmount(mounted);
        host.remove();
    }

    await trial('focus left in the box', () => undefined);
    await trial('focus moved to More actions', (_box, gear) => gear.focus());
    await trial('focus moved to More actions, the desktop menu', (_box, gear) => gear.focus(), true);
    const key = (target: Element | null, init: Record<string, unknown>): void => {
        target?.dispatchEvent(
            new dom.window.KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init })
        );
        flushSync();
    };
    const opened = (): string =>
        `menus open ${document.querySelectorAll('[role="menu"]').length}, active ${document.activeElement?.tagName}${document.activeElement?.getAttribute('aria-label') === null ? '' : ` "${document.activeElement?.getAttribute('aria-label')}"`}`;
    await trial('More actions opened with the pointer, closed with Escape', (_box, gear) => {
        gear.focus();
        flushSync();
        gear.dispatchEvent(
            new dom.window.PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, pointerType: 'mouse' })
        );
        flushSync();
        print(`  after the press: ${opened()}`);
        key(document.activeElement, { key: 'Escape', code: 'Escape' });
        print(`  after Escape: ${opened()}`);
    });
    await trial('More actions opened with Enter, closed with Escape', (_box, gear) => {
        gear.focus();
        flushSync();
        key(gear, { key: 'Enter', code: 'Enter' });
        print(`  after Enter: ${opened()}`);
        key(document.activeElement, { key: 'Escape', code: 'Escape' });
        print(`  after Escape: ${opened()}`);
    });
    for (const control of ['number']) {
        row = firstOf(control);
        print(`row: ${row?.file} ${row?.key} (${row?.control})`);
        if (row === undefined) continue;
        await trial(`${control}: focus left in the box`, () => undefined);
        await trial(`${control}: focus moved to More actions`, (_box, gear) => gear.focus());
    }
    stopKeys();
    vi.unstubAllGlobals();
}
```

## Judgment calls the brief left open

- Item 6, collection rows: a removal is held until the snapshot has moved two builds past the build it was made over (the same rule an added record waits by), or until the record is added again by a later write; it is not forgotten on the snapshot's absence, which would need `context.ts` (ruling 1 keeps it). `Collection.svelte` reads it through `client.pages.removed`, so the settled store's key stays private.
- Item 6, schedules: a removal is matched by name, and by position for an entry with no name, only in the rows it was removed from; a save under the same name ends it.
- Item 7: a check that does not run (git missing, a timeout) answers that nothing is ignored, so the repository is listed by its own run; a repository inside one that is dropped is dropped too; without credentials the check runs git with no sign-in, which `check-ignore` needs none of.
- Item 10: `oneStop` turns a final ".." into "." and leaves an ellipsis; the number box keeps its own range message beside the box, and a refusal it does not make itself is handed in as `invalid`.
- Item 11: a refused field is named by `JSON.stringify([file, key, hub])`; a keystroke drops the mark unless the number box refuses the new text as it is typed; the marks of a tab go when its instance state is cleared.
- Item 14: the card keeps the last room told while the controls are hidden, so the title does not move when the pointer comes; `--card-room` is reset on every card so a card inside another keeps only its own controls' room.
- Item 15: the rule applies to every page of two or more panes where the split would leave a half under the width, not only to pages of three panes (the brief's case); among the panes neither locked nor the asker, the reader's pane takes the record, else the widest, and an unmeasured pane counts as widest and as fitting.
- Item 18: RuleForm scrolls the pane's body itself, so GroupHead.svelte is unchanged.
- Item 19: the counter is null only while no deck is drawn or for a missing or unreadable deck; during a filter's re-read the last deck stays drawn, so its counter stays. Presenter.svelte is unchanged: it is drawn only with a deck and a row, so during a load or a switch it is not drawn.

## User-visible changes

| Where | Before | After |
| --- | --- | --- |
| Open View submenu group rows | `focus`, `book`, `venue_dist`, `conference`, `page`, `settings` | the rail's `compass`, `pillar`, `venue`, `poster`, `question`, `sliders` |
| "this is me" pressed | unpressed with the hover border until the portfolio arrives | pressed at once, no hover border on any active ToolButton |
| Status bar Tab | right group walked right to left | left to right; a focused item scrolls into view |
| Project-set view name | "Projects" | "Project set" (`docs/palette.md` too) |
| Escape on the Focus filter and "More 1" | tip opens over the bar | no tip; a press outside or Tab leaves the focus where it went |
| Deleted collection entry, removed bookmark, deleted schedule | row stays until the next read | row goes when the answer comes |
| Quick open | lists files of worktrees under an ignored `.agents/` | lists none of them |
| Settings search in a narrow pane | field shrinks to nothing | field at least 12em, count under it |
| Save, Save All | two identical icons | "Save" and "Save All" with their icons; "Saved into" line keeps its room |
| Refused Settings value | red line only | field also marked (`aria-invalid`, red border, message as title); messages end with one stop |
| Unsaved dot and count for a refused or empty value | dot and count shown | none |
| Emptying a row with no key | "Enter a number" or "not a path" for number and path; text and long held an empty value | nothing written, nothing said |
| Card titles on hover devices | words under the action buttons | title ends before the buttons |
| Record opened from a narrow pane | pane split again until text broke inside words | opens as a tab of another pane |
| Rice empty states and error boxes | "# " before every one | only before an empty state with no glyph |
| Present in a short pane | bars up to half the pane | bars up to a third |
| Find form | mixed-case labels; top labels under the sticky strip | capitalised labels; labels scrolled out from under the strip |
| Slide counter | "0 / 0" while loading | none while loading or after a failure |

## In the brief, wrong or impossible

- The premises the round-0 rulings settled (item 6's row builder, items 2, 3, 7, 10, 15, 19 paths, item 11's saved key) are carried by those rulings and built under them.
- `src/lib/state/sources/bookmarks.svelte.ts`: impossible at that path, since `src/lib/state/sources/` holds 10 items on the base (`ls ../O167-base/src/lib/state/sources | wc -l` prints 10); it is `src/lib/state/sources/fs-parts/bookmarks.svelte.ts`, see the paths section.
- `src/lib/ui/frame/Card.svelte`: the context item 14 needs cannot be exported from the component's module script under the repository's eslint (the first full-list run's eslint failure in CardActions.svelte), so the card moved to `src/lib/ui/frame/card/` beside `card-room.ts`.
- Item 13's reading names no cause, and the case-run programs reproduce no defect in any code they reach; see the first line.
