# O167 builder report: the shell's controls hold one behaviour

NOT done: item 13 (C13, Cmd+S with the focus on a setting's More actions button). The case-run programs found no cause: in every code a program reaches (Gear.svelte with its real Menu, MenuOpener, Tooltip and bits-ui trigger; one Settings row's Item with the scopes, writer and tab save Settings.svelte gives it; the real createWorkbenchKeys, sourceKeys and the desktop menu's answerMenu), Cmd+S from More actions writes the staged change and says "Saved into local.yml." exactly as from the field. No code is changed for item 13. What a program cannot reach is the real browser's focus and menu handling and the Electron accelerator, so the proof is the look at landing named in the C13 row below. Verification 1 is met by the run after round 1's last change (`test:quick: 136.4 s; every command passed`, quoted under "Round 1"); the first build's runs are kept below as they printed.

## Open items of the state file

None.

## Paths written outside the brief's list and the round-0 rulings

Each was needed by a fix inside the step; none changes a user-visible shape beyond the items.

- `src/lib/state/client/context.ts`: item 11. `settingsUnsaved` now reads the tab's refused fields, so its one caller passes `ui` and the id (`settingsUnsaved(layout.instanceView(id), ui, id, entities.config()?.config)`) and the comment above it says a refused text is not counted. Item 6 (round 1, ruling 1, which puts context.ts on the path list): `entities.afterReceive(settled.heard)` after `createSettled`, and the comment above it says a removal ends at the first snapshot kept without it. 880 lines.
- `src/lib/state/system/config/messages.ts`: item 10, `oneStop`, the one place a worded sentence loses a doubled final stop.
- `src/lib/views/system/workbench/settings/said.ts` and `src/lib/views/system/workbench/settings/other-rows/WallpaperPicker.svelte`: item 10, every Settings message is worded through `oneStop`, `settings_wallpaper_failed` included.
- `src/lib/ui/forms/NumberInput.svelte`: item 10, the box takes the refusal a caller hands it as `invalid` when the box itself refuses nothing.
- `src/lib/state/sources/fs-history.ts` moved to `src/lib/state/sources/fs-parts/history.ts`, and its importer `src/lib/state/sources/explorer/sections/timeline-state.svelte.ts`: item 6. `src/lib/state/sources/` holds 10 items on the base (`ls | wc -l` prints 10), the folder limit, so the new bookmark file could not sit there as the brief names it; `fs-parts/` holds `bookmarks.svelte.ts` (the brief's `bookmarks.svelte.ts`) and the moved history file, and the folder still holds 10 items. `agents/guarded.md:363` still names `src/lib/state/sources/fs-history.ts` ("`copies` and the `files` listener in `src/lib/state/sources/fs-history.ts`"); the ledger is not this builder's to edit, so that line needs the new path `src/lib/state/sources/fs-parts/history.ts` at landing.
- `src/lib/ui/frame/Card.svelte` moved to `src/lib/ui/frame/card/Card.svelte`, with the new `src/lib/ui/frame/card/card-room.ts`: item 14. The room the controls take is handed to the card through a Svelte context; a value exported from a component's `<script module>` is not resolved by eslint's typed parser (the first full-list run failed on it in CardActions.svelte), so the context lives in a `.ts` file beside the card, as `src/lib/ui/menu/tip-ids.ts` does for the tips. `ui/frame/` holds 10 items, so the card and its context share a folder. The importers changed to the new path: `src/lib/views/shared/card/record/RecordCard.svelte`, `src/lib/views/academic/present/arrange/Tile.svelte`, `src/lib/views/system/status/Gallery.svelte`, `src/lib/views/system/machine/usage/Usage.svelte`; comments naming the old path changed in `src/lib/views/system/status/Status.svelte`, `src/lib/views/academic/career/CareerCard.svelte` and `src/lib/views/boards/focus/lanes/LaneCard.svelte` (`grep -rn --exclude=local.yml "frame/Card" config tests src utils docs | grep -v "frame/card/"` prints nothing).
- `src/lib/state/workbench/layout.svelte.ts` lines 225-226 and 848: item 15. The layout store's type gains `measurePane: Opening['measurePane']` with its doc line, and the store hands out `opening.measurePane`, so `PaneView.svelte` can tell the store each pane's width (`paneWidth` of `pane-view.ts`). The widths are kept in `opening.ts:580` under `paneKey(host, path)` (`:583`), the id of the page (or float) the pane is drawn in and the pane's path in its layout tree, since a pane has no id of its own (`model.ts:62-72`, the `Pane` type: `kind`, `tabs`, `active`, `recent`, `keeps`, `locked`, `rowHidden`, `added`, `documents`); round-0 ruling 6 said the widths are kept by pane id.
- `src/lib/views/system/workbench/settings/scopes/ScopeBar.svelte` lines 3-10, outside the 130-230 range: the head comment says Save and Save All draw their words and the "Saved into" line holds its room (item 9). O169's lines 55-70 are untouched.
- `src/lib/views/academic/present/Bar.svelte` lines 1-10 and 75, beside line 113 and ruling 7's lines 26-60: the head comment says when the counter is drawn, the toolbar's buttons are disabled through `slideless` (line 75 onward), and one comment line of 101 columns is rewrapped.
- `tests/state/sources/settings-readers.test.ts`: the expected `settings_origin_none` sentence gains its full stop (item 10).
- `tests/state/client/created-ids.test.ts`: its `Settle` stub gains `removed`, which `Settle` now requires (item 6).
- `tests/server/files/nested-names.test.ts` (on the list) is tagged `// @module-tag slow: every row starts git and ripgrep.`: with three rows it timed out at 5000 ms in the first full-list run (364 ms alone), and the vite config's rule is that a test that starts a process is tagged slow.

Every command of the step that changed a file by a program is listed under "Round 1", ruling 8.

## The cases' first run (unchanged tree)

- C1 (reading): `open-view.svelte.ts:99` draws `groupGlyph(section)`, which takes `group_glyph` (`catalogue.ts:263-267`, `:289`): Focus `focus`, Pillars `book`, Registries `venue_dist`, Present `conference`, Help `page`, System `settings` (`layout.yml:10-21`). As the brief says.
- C2 (reading): `Person.svelte:211-219` draws `pressed`/`active` from `isSelf` (`:167`, the portfolio's flag); until the portfolio arrives the button is unpressed and enabled, and `ToolButton.svelte:207-209` draws the hover border. `setSelf` (`ui.svelte.ts:485-488`) returns nothing, so Person.svelte never learns of a refusal (ruling 2).
- C3 (reading): `StatusBar.svelte:420-423` `row-reverse`; the right group's DOM order is Bell, unsaved, sessions, AppItems right, SourceItems, so Tab walks right to left. No code scrolls a focused item into view. As the brief says; SourceItems, LanguageItems and AppItems are written reversed too (ruling 3).
- C4 (reading): `project.yml:193` `listing: Projects`; `docs/palette.md:26` `| Projects | listing |`. As the brief says.
- C5 (reading): `FocusFilter.svelte:157-160` gives the focus back with a plain `focus()`; `PickMenu.svelte:137` has no `onCloseAutoFocus`, so bits-ui focuses the trigger plainly; after a keyboard Escape the trigger matches `:focus-visible` and `Tooltip.svelte:186-194` opens the tip. `focus.yml:100` begins in lower case with no stop. As the brief says.
- C6 (reading): `writes.svelte.ts:408-410` only sends; `fs.svelte.ts:823-827` invalidates on success; `schedule.svelte.ts:705-706` posts and `send` touches no row. The rows stay until the next read. The collection's rows are built in `Collection.svelte:144-160` and `:217-222`, not in `boards/collection/index.ts` (ruling 1).
- C7 (test rows, `npx vitest run tests/server/files/nested-names.test.ts`): row 2 fails:

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
- C10 (test rows, `npx vitest run tests/state/system/settings/row-writer.test.ts`): 'names the reasons of a refused Save with no full stop of their own' fails:

```
-     "The theme is not listed; The file is locked",
+     "The theme is not listed.; The file is locked",
```

  Reading: no field carries `aria-invalid` for a row's message.
- C11 (reading): `typed.ts:130-132` counts every typed record, refused or empty. As the brief says.
- C12 (test rows, same command): the rows of a key the file does not hold fail for text, long, path and number:

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
| 6 Removed rows leave | DONE | Collection: `settled.svelte.ts` `remove`/`removed`/`heard` (by hub, collection and id through `entryKey`), held until a snapshot without the entry arrives and not held when the snapshot already lacks it (round 1, ruling 1), `deleteEntry` records it on success, `Collection.svelte` leaves those entries out (ruling 1). Bookmark: `fs-parts/bookmarks.svelte.ts` drops the row from the held list on success before the read. Schedule: `schedule.svelte.ts` `removals` leave the row out until a schedules payload without the entry arrives, decided as the payload arrives (round 1, ruling 1) | Reading; look: delete a collection entry, remove a bookmark, delete a schedule: each row goes as the answer comes; a refused delete keeps the row; two hubs with the same collection and id: only the written hub's row goes |
| 7 Quick open and ignored folders | DONE | `search.ts` `unignored` asks `ignoredIn` (git check-ignore) about each folder between a nested repository and the repository holding it, drops the repository and those inside it, with the server's credentials passed through `search-routes.ts` and `+server.ts` (ruling 4) | `npx vitest run tests/server/files/nested-names.test.ts`: passes (in the scoped run `Test Files  10 passed (10)`, `Tests  143 passed (143)`); its failing run on the unchanged tree is quoted under C7 |
| 8 Settings search width | DONE | `Header.svelte` `.found` wraps, `.field { flex: 1 1 12em; min-width: 12em }`, the count goes under the field when both do not fit | Reading of the CSS; look: a Settings pane 360 px wide at text sizes 1 and 1.5: field at least 12em, count under it |
| 9 Save and Save All | DONE | `compact` removed from both, so each draws its label beside the glyph; `<p class="said">` always drawn with `min-height: 1lh` | Reading; look: Save and Save All draw their words ("[Save]", "[Save All]" under brackets); the bar's height and the first row's top equal with and without "Saved into" at both text sizes |
| 10 Refused value marks its field | DONE | Control.svelte hands the worded refusal as `invalid` to FieldControl, which hands it to every input (FieldControl split into `InlineItems.svelte`, ruling 5); TextArea and SuggestInput take `invalid` (`aria-invalid`, title, the field's red border); every Settings message of the brief's list ends with a stop, `oneStop` keeps one stop, `write.ts` strips the server's reasons of theirs | `npx vitest run tests/state/system/settings/row-writer.test.ts`: `Tests  13 passed (13)`; `grep -nE '^\s+settings_[a-z_]+: ' config/text/views/system/workbench.yml \| grep -vE "[.?!]['\"]?$"` prints 43 lines, quoted under "Round 1", ruling 7: labels, headings, tips and the eight `settings_origin_*` fragments item 10 says keep no stop; none of item 10's messages is among them; look: "abc" in a range field marks it and says a sentence with one stop; Escape and the held value typed back remove both |
| 11 Unsaved counts agree | DONE | The Settings tab's refused fields are runtime state of `ui.svelte.ts` (`refusedFields`, `markRefused`, never in a saved record: `grep -n refused src/lib/state/system/config/typed.ts` shows no key in the typed record), set by Control.svelte on a refusal and dropped at the next keystroke; `settingsTyped` skips refused and empty text | Reading; look: a refused value typed: no tab dot, no Settings tab in the status bar count, header "No unsaved change"; a valid typed value not sent: the dot |
| 12 Emptying a row with no key | DONE | `commitValue(spec, input, lists, held, own)` answers `{ write: false, unset: true }` for empty text when `own` is false and the option takes no empty value (`!emptyIsValue(spec)`, round 1, ruling 2); `write.ts` drops any held change and the message | The row-writer run of round 1, `Tests  13 passed (13)` with the four `empty:` rows; the failing runs are quoted under C12 and under "Round 1", ruling 2 |
| 13 Cmd+S on More actions | NOT DONE | No cause found by the case-run programs below; no code changed | Look at landing: in the browser and in the desktop app, stage a change in a Settings row, Shift+Tab to that row's More actions, press Cmd+S, and also pick File > Save in the desktop app: the change is written and "Saved into {0}." is said |
| 14 Card actions and the title | DONE | CardActions measures its width (plus the clipped edge and the row's gap) each time it is laid out over the title and tells the card through `cardRoom`; controls that lie over the title are laid out unseen at rest (`visibility: var(--card-at-rest-seen)`, round 1, ruling 3), so the room is told from the card's first draw; the card pads its title by `--card-room` on hover devices, reset on every card; sharing the chips' line it tells none | Reading of the CSS; look: a Career card with a long title, before any hover and at the first hover: the title's words do not rewrap and the card keeps its height; a LinkedIn card and a card with more buttons, long titles: no word under a button; under `hover: none` as before the step |
| 15 Panes halving | DONE | Each pane measures its width (`pane-view.ts` `paneWidth`, a ResizeObserver, attached in `PaneView.svelte`) into `opening.ts` `widths` (never saved, dropped when the pane goes, ruling 6); `landingFor` takes a `PaneRoom`: a split that leaves a half under 320 px times the text size lands as a tab of a pane neither locked nor the asker, the reader's or else the widest | Reading; look: a page of three panes, a record pressed from the narrowest: no split under the width, the record opens as a tab elsewhere; a page of one pane: splits; a float: as before the step |
| 16 Rice "# " | DONE | `Empty.svelte` `.empty:not(.error):not(.glyphed)::before` | Reading of the CSS; look under rice, brackets on and off: Live HPC's error box draws no "# ", an empty state with a glyph none, one with no glyph "# " |
| 17 Present in a narrow pane | DONE | `Pane.svelte` `max-height: var(--viewbar-max, 50%)`; only `Present.svelte` sets `--viewbar-max="33.33%"` | Reading; look: Present in a 420 px pane at text size 1.5 with the bars wrapped: bars at most a third, the slide in the rest; another view's bar keeps 50% |
| 18 Find form | DONE | `present.yml` labels capitalised (Find, Title and Tag tones already were); RuleForm scrolls its top and, as the focus moves, a control's label into view by the least distance (`uncover`, `unhidden`, `scrollIntoView({ block: 'nearest' })`), each part with `scroll-margin-top` from GroupHead's `--group-strip` and `--group-strip-gap` (round 1, ruling 5) | `grep -nE "field_(discover\|find)" config/text/views/academic/present.yml`; look: open Edit Rule from a strip standing over the body, and Tab through the form: no label under the strip |
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
5. `wc -l` of every changed file is in the file table below: the largest source files are `context.ts` 880, `writes.svelte.ts` 877, `layout.svelte.ts` 873, `fs.svelte.ts` 849 (base 898, now under 880), all within 880; the largest components `PaneView.svelte` 519 and `ToolButton.svelte` 519, within 520. `sh utils/folder-check.sh` exits 0.
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
| src/lib/state/client/context.ts | 880 |
| src/lib/state/client/writes.svelte.ts | 877 |
| src/lib/state/forms/page-entry.ts | 532 |
| src/lib/state/forms/settled.svelte.ts | 174 |
| src/lib/state/sources/explorer/sections/timeline-state.svelte.ts | 101 |
| src/lib/state/sources/fs-history.ts | moved to fs-parts/history.ts |
| src/lib/state/sources/fs-parts/bookmarks.svelte.ts (new) | 109 |
| src/lib/state/sources/fs-parts/history.ts | 165 |
| src/lib/state/sources/fs.svelte.ts | 849 |
| src/lib/state/system/config/editors/fields.ts | 786 |
| src/lib/state/system/config/editors/origins.ts | 135 |
| src/lib/state/system/config/messages.ts | 81 |
| src/lib/state/system/config/scopes/write.ts | 167 |
| src/lib/state/system/config/typed.ts | 168 |
| src/lib/state/system/machine/schedules/schedule.svelte.ts | 818 |
| src/lib/state/workbench/layout.svelte.ts | 873 |
| src/lib/state/workbench/layout/open/landing.ts | 126 |
| src/lib/state/workbench/layout/open/opening.ts | 603 |
| src/lib/state/workbench/navigation/rail.ts | 158 |
| src/lib/state/workbench/ui.svelte.ts | 604 |
| src/lib/ui/controls/heads/GroupHead.svelte | 277 |
| src/lib/ui/controls/ToolButton.svelte | 519 |
| src/lib/ui/forms/choice/SuggestInput.svelte | 207 |
| src/lib/ui/forms/NumberInput.svelte | 92 |
| src/lib/ui/forms/TextArea.svelte | 157 |
| src/lib/ui/frame/Card.svelte | moved to frame/card/Card.svelte |
| src/lib/ui/frame/card/Card.svelte | 364 |
| src/lib/ui/frame/card/card-room.ts (new) | 25 |
| src/lib/ui/frame/Empty.svelte | 134 |
| src/lib/ui/frame/Pane.svelte | 262 |
| src/lib/views/academic/career/CareerCard.svelte | 94 |
| src/lib/views/academic/present/arrange/RuleForm.svelte | 195 |
| src/lib/views/academic/present/arrange/Tile.svelte | 184 |
| src/lib/views/academic/present/Bar.svelte | 151 |
| src/lib/views/academic/present/Present.svelte | 473 |
| src/lib/views/boards/collection/Collection.svelte | 456 |
| src/lib/views/boards/focus/FocusFilter.svelte | 313 |
| src/lib/views/boards/focus/lanes/LaneCard.svelte | 353 |
| src/lib/views/boards/person/Person.svelte | 309 |
| src/lib/views/shared/card/record/CardActions.svelte | 397 |
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
| tests/state/forms/page-entry.test.ts | 461 |
| tests/state/system/schedule-lines.test.ts | 134 |
| tests/state/sources/settings-readers.test.ts | 147 |
| tests/state/system/settings/row-writer.test.ts | 285 |

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

- Item 6, collection rows: a removal is held until a snapshot without the entry arrives, or until the record is added again by a later write (round 1, ruling 1). `Collection.svelte` reads it through `client.pages.removed`, so the settled store's key stays private. Whether the snapshot holds the entry is asked through the snapshot source `createPages` already has (`page-entry.ts`), and `context.ts` only calls `settled.heard` after each kept message, since `context.ts` stands at the 880-line limit.
- Item 6, schedules: a removal is matched by name, and by position for an entry with no name, only in the payload it was removed from; it ends when a payload without the entry arrives, and a save under the same name by this window ends it too.
- Item 7: a check that does not run (git missing, a timeout) answers that nothing is ignored, so the repository is listed by its own run; a repository inside one that is dropped is dropped too; without credentials the check runs git with no sign-in, which `check-ignore` needs none of.
- Item 10: `oneStop` turns a final ".." into "." and leaves an ellipsis; the number box keeps its own range message beside the box, and a refusal it does not make itself is handed in as `invalid`.
- Item 11: a refused field is named by `JSON.stringify([file, key, hub])`; a keystroke drops the mark unless the number box refuses the new text as it is typed; the marks of a tab go when its instance state is cleared.
- Item 14: controls that lie over the title are laid out unseen at rest (`visibility: hidden` through `--card-at-rest-seen`), so they take no press, no focus and no room in the flow, and are measured at the card's first draw; the cost is one measure per such card at its first draw. `--card-room` is reset on every card so a card inside another keeps only its own controls' room.
- Item 15: the rule applies to every page of two or more panes where the split would leave a half under the width, not only to pages of three panes (the brief's case); among the panes neither locked nor the asker, the reader's pane takes the record, else the widest, and an unmeasured pane counts as widest and as fitting.
- Item 18: of the two ways ruling 5 of round 1 allows, RuleForm uses `scroll-margin-top` on the form and every part in it with `scrollIntoView({ block: 'nearest', inline: 'nearest' })`; GroupHead publishes the strip's gap as `--group-strip-gap` (8 px) and its strip's margin reads it.
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
| Emptying a row with no key: number | "Enter a number" said | nothing written, nothing said |
| Emptying a row with no key: path, file, folder with no `empty:` | the path message said | nothing written, nothing said |
| Emptying a row with no key: text, long | an empty value held as a change | nothing written, nothing said |
| Emptying a row with no key: scalar | as the option's rule answered empty text (`fields.ts:746-752` on the base) | nothing written, nothing said |
| Emptying a row with no key: choice, glyph, hue, colour with no `empty:` | nothing written, nothing said, a held change kept | nothing written, nothing said, a held change and its message dropped |
| Emptying a row with or without the key: choice, path, file, folder with `empty:` | `''` written | `''` written, as before |
| Card titles on hover devices | words under the action buttons | title ends before the buttons from the first draw; it does not move at the first hover |
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

## Round 1

Everything in the round is done. Item 13 is not in this round; its row above stays NOT DONE as it was.

The sections above are brought to the end state of this round where a ruling names them (rulings 2, 6 and 7) and where a round-1 change made a sentence untrue (items 6, 12, 14 and 18 in the DONE table, the judgment calls, the user-visible changes, the file table, the first line).

### Ruling 1: a removed record is forgotten when the snapshot no longer holds it

- `src/lib/state/forms/settled.svelte.ts`: the store's removal is `{ seq, shows }` (`:81`, `:87`). `remove(key, seq, shows)` (`:158-163`) holds it only when `shows()` says the current snapshot still holds the entry, so a removal answered after a snapshot without the entry holds nothing; `removed` (`:165-167`) reads the map; `heard()` (`:169-171`) drops each removal whose entry the snapshot no longer holds. `BUILDS_KEPT` decides held values only; no removal reads it. A re-add by a later write still ends a removal (`:119-120`). The head comment (`:17-22`) says this.
- `src/lib/state/forms/page-entry.ts:487-492`: `removed(collection, id, seq)` hands the store a `shows` that asks the snapshot source `createPages` already has whether it holds the entry (`find(snapshot, collection, [id]) !== null`). The doc comments of `Settle.removed` and `Pages.removed` say the entry is left out until a snapshot without it arrives.
- `src/lib/state/client/context.ts:180`: `entities.afterReceive(settled.heard);`, so each kept message tells the store; the comment at `:170-171` says a removal ends at the first snapshot kept without it. The file has 880 lines.
- `src/lib/state/system/machine/schedules/schedule.svelte.ts`: a removal is `{ at, name, seen }` (`:337`); `holds(one, now)` (`:440-443`) and `takes(one, row)` (`:446-448`); `standing()` (`:451-454`) and `none()` only read; `entities.afterReceive` (`:464-468`) ends each removal whose entry the arriving schedules payload no longer holds, as the payload arrives; `removed(row, seen)` (`:475-478`) holds a removal only when the last payload still holds the entry; `remove` (`:774-778`) takes `seen` before the delete is sent. `savedAgain` stays for a save by this window.

The new rows, run on the step's tree before the change (`npx vitest run tests/state/forms/page-entry.test.ts tests/state/system/schedule-lines.test.ts tests/state/system/settings/row-writer.test.ts`, the run that also holds ruling 2's rows):

```
     x is left out only until a snapshot without it: 'a delete answered before the snapshot...' 2ms
     x is left out only until a snapshot without it: 'a delete answered after the snapshot ...' 0ms
     x is left out only until a snapshot without it: 'an entry put back by another hand in ...' 0ms
     x 'saved again by another hand after the...' 3ms
     x 'a delete answered after the read with...' 1ms
     x holds nothing and says nothing for a key the file does not hold, unless the empty text is a value of its option, and answers by its control for one it holds 6ms
 FAIL  |unit| tests/state/forms/page-entry.test.ts > an entry of a collection a write removed > is left out only until a snapshot without it: 'a delete answered before the snapshot...'
 FAIL  |unit| tests/state/forms/page-entry.test.ts > an entry of a collection a write removed > is left out only until a snapshot without it: 'a delete answered after the snapshot ...'
 FAIL  |unit| tests/state/forms/page-entry.test.ts > an entry of a collection a write removed > is left out only until a snapshot without it: 'an entry put back by another hand in ...'
TypeError: settled.heard is not a function
 > tests/state/forms/page-entry.test.ts:455:25
 FAIL  |unit| tests/state/system/schedule-lines.test.ts > a schedule a delete took > 'saved again by another hand after the...'
AssertionError: expected [ [ 'two' ] ] to deeply equal [ [ 'one', 'two' ] ]
 > tests/state/system/schedule-lines.test.ts:132:22
 FAIL  |unit| tests/state/system/schedule-lines.test.ts > a schedule a delete took > 'a delete answered after the read with...'
AssertionError: expected [ [ 'two' ], [ 'two' ] ] to deeply equal [ [ 'two' ], [ 'one', 'two' ] ]
 > tests/state/system/schedule-lines.test.ts:132:22
 Test Files  3 failed (3)
      Tests  6 failed | 46 passed (52)
```

(vitest prints the cross as `<multiplication x>`, the arrow as `<heavy right-pointing angle quotation mark>` and the cut-off as `<horizontal ellipsis>`; they are written `x`, `>` and `...` here.) The schedule row 'it is left out from the answer, through a read that still holds it, until a read without it' passed on the step's tree: the first build already ended that removal at a read without the entry, though inside `rows()`. The page-entry rows stop at `settled.heard`, which the step's tree does not have.

After the change (`npx vitest run tests/state/forms/page-entry.test.ts tests/state/system/schedule-lines.test.ts tests/state/system/settings/row-writer.test.ts --reporter verbose`, filtered to the new rows):

```
 <check mark> |unit| tests/state/forms/page-entry.test.ts > an entry of a collection a write removed > is left out only until a snapshot without it: 'a delete answered before the snapshot...' 0ms
 <check mark> |unit| tests/state/forms/page-entry.test.ts > an entry of a collection a write removed > is left out only until a snapshot without it: 'a delete answered after the snapshot ...' 0ms
 <check mark> |unit| tests/state/forms/page-entry.test.ts > an entry of a collection a write removed > is left out only until a snapshot without it: 'an entry put back by another hand in ...' 0ms
 <check mark> |unit| tests/state/system/schedule-lines.test.ts > a schedule a delete took > 'it is left out from the answer, throu...' 1ms
 <check mark> |unit| tests/state/system/schedule-lines.test.ts > a schedule a delete took > 'saved again by another hand after the...' 0ms
 <check mark> |unit| tests/state/system/schedule-lines.test.ts > a schedule a delete took > 'a delete answered after the read with...' 0ms
 <check mark> |unit| tests/state/system/settings/row-writer.test.ts > a Settings row whose box is emptied > holds nothing and says nothing for a key the file does not hold, unless the empty text is a value of its option, and answers by its control for one it holds 1ms
 Test Files  3 passed (3)
      Tests  52 passed (52)
```

The rows: page-entry `tests/state/forms/page-entry.test.ts:420-461`, each step a delete of `hub:a` answered with success or a snapshot of the keys given, and after each whether the Tasks list leaves `hub:a` out: a delete answered before the snapshot without the entry (`[true, true, true, false, false]` over delete, `[a, b]`, `[a, b]`, `[b]`, `[b]`), a delete answered after it (`[false, false, false]`), an entry put back by another hand in the next snapshot (`[true, false, false]` over delete, `[b]`, `[a, b]`). Schedules `tests/state/system/schedule-lines.test.ts`, describe 'a schedule a delete took' (`:79-134`), the delete's answer a promise the row resolves at its `answer` step and each payload received through the real `createEntities`: removed, then a payload still holding it, then a payload without it (`[['two'], ['two'], ['two']]`); saved again under the name by another hand after the payload without it, with no read between (`[['one', 'two']]`); a delete answered after the payload without it (`[['two'], ['one', 'two']]`).

### Ruling 2: emptying a row whose option takes the empty value

- `src/lib/state/system/config/editors/fields.ts:745`: `if (!own && input.trim() === '' && !emptyIsValue(spec)) return { write: false, unset: true };`. The doc comment (`:720-732`) says an option with `empty:` takes the empty text as a value, written as for a row that holds the key.
- `src/lib/state/system/config/scopes/write.ts`: the head comment says the same of the writer.
- `tests/state/system/settings/row-writer.test.ts:146-180`: the C12 table gains four rows, a choice and a path whose entry carries `empty:`, with `own` false and true, each holding `{ value: '' }` and saying nothing; `controlRow` is given `{ empty }`.
- Item 12's before/after rows under "User-visible changes" name number; path, file and folder with no `empty:`; text and long; scalar; choice, glyph, hue and colour with no `empty:`; and choice, path, file and folder with `empty:`.

Before the change, in the run quoted under ruling 1, the row-writer row fails; its diff (`npx vitest run tests/state/system/settings/row-writer.test.ts`):

```
- Expected
+ Received

@@ -70,13 +70,11 @@
      "said": null,
    },
    {
      "control": "choice",
      "empty": true,
-     "held": {
-       "value": "",
-     },
+     "held": undefined,
      "own": false,
      "said": null,
    },
    {
      "control": "choice",
@@ -88,13 +86,11 @@
      "said": null,
    },
    {
      "control": "path",
      "empty": true,
-     "held": {
-       "value": "",
-     },
+     "held": undefined,
      "own": false,
      "said": null,
    },
```

After: the same file prints `Test Files  1 passed (1)`, `Tests  13 passed (13)`.

### Ruling 3: the card title does not move under the pointer

- `src/lib/ui/frame/card/Card.svelte`: `.card` sets `--card-at-rest-seen: hidden` (`:165`), and the rules that reveal the controls set it `initial` (`:185`, and `:191` under `hover: none`). The style comment (`:151-162`) and the head comment (`:23-27`) say a control lying over the card is laid out unseen at rest, so it tells the room from the first draw.
- `src/lib/views/shared/card/record/CardActions.svelte`: `alone` (`:92`) is whether the element is alone in its row, set in `measure` (`:156`) and before the first layout (`:260`, `:271`); `class:lying={over || alone}` (`:293`); under `hover: hover`, `.actions.lying { display: flex; visibility: var(--card-at-rest-seen, visible); }` (`:388-391`). Lying over the card the element is laid out at rest, unseen, takes no press and no focus, and `lay` (`:200-208`) tells the card its width at the card's first draw. The head comments (`:16-26`, `:43-47`, `:49-56`), the doc of `lay` and of `drawnOnce` say this.
- Check: svelte-check and eslint in the test:quick run below. A layout is drawn only in a page, so the proof is the look at landing: a Career card with a long title, seen at rest before any hover and then at the first hover: the title's words keep their lines and the card keeps its height; Tab into the card reaches its controls.

### Ruling 4: the shared fallbacks

- `src/lib/state/workbench/layout/open/landing.ts:29-32`: `const ANY_ROOM: Readonly<PaneRoom> = Object.freeze({ ... })`.
- `src/lib/state/workbench/ui.svelte.ts:524-526`: `refusedFields` returns `refused.get(id) ?? new Set<string>()`; the shared empty set is gone.
- Check: reading; svelte-check in the run below.

### Ruling 5: the rule form reads no other component's markup

- `src/lib/views/academic/present/arrange/RuleForm.svelte`: `uncover` (`:80-82`) is `part?.scrollIntoView({ block: 'nearest', inline: 'nearest' })`; `unhidden` (`:89-101`) scrolls the form's own top (`<span class="top" data-rule-top>`, `:119`) and, on focus, a list's caption, the Find label's top or the control; `.rule, .rule :global(*)` take `scroll-margin-top: calc(var(--group-strip, 0px) + var(--group-strip-gap, 0px))` (`:168-171`). No query of `section` or `h3` and no 8 px remain (`grep -n "section\|h3\|8px" src/lib/views/academic/present/arrange/RuleForm.svelte` prints nothing). The head comment (`:14-19`) says this.
- `src/lib/ui/controls/heads/GroupHead.svelte`: `.group` publishes `--group-strip-gap: 8px` (`:206`) and the strip's margin reads it (`:232`); the head comment (`:23-31`) names `--group-strip` and `--group-strip-gap` and their readers, the Settings list (`views/system/workbench/settings/List.svelte`) and the rule form.
- Check: the look at landing: open Edit Rule from a strip standing over the body, then Tab through the form: each label stands under the strip with the strip's gap.

### Ruling 6: the paths and the key of the widths

"Paths written outside the brief's list and the round-0 rulings" now names `src/lib/state/workbench/layout.svelte.ts` lines 225-226 and 848, and says the widths are kept under the id of the page (or float) and the pane's path, since a pane has no id (`model.ts:62-72`), where round-0 ruling 6 said pane id.

### Ruling 7: the report's claims are the runs' output

Item 10's catalog grep, `grep -nE '^\s+settings_[a-z_]+: ' config/text/views/system/workbench.yml | grep -vE "[.?!]['\"]?$"`, prints 43 lines (the ruling says 44; this run prints 43):

```
9:        settings_glyph: sliders
190:        settings_clear: Clear search
191:        settings_contents: Settings contents
192:        settings_copy_id: Copy Setting ID
195:        settings_default: 'Default: {0}'
196:        settings_default_empty: 'Default: empty'
197:        settings_default_item_one: 'Default: 1 item'
198:        settings_default_items: 'Default: {0} items'
206:        settings_wallpaper_label: Wallpaper images
207:        settings_wallpaper_none: None
208:        settings_wallpaper_random: Random
211:        settings_fields: 'Each entry has:'
212:        settings_filter: Filter settings
213:        settings_filter_modified: 'Modified'
214:        settings_found: '{0} Settings Found'
215:        settings_found_none: No Settings Found
216:        settings_found_one: 1 Setting Found
217:        settings_gear: More actions
218:        settings_heading_appearance: Appearance
219:        settings_heading_boards: Boards and audit
220:        settings_heading_calendar: Calendar and mail
221:        settings_heading_apps: Apps
222:        settings_heading_cluster: Cluster
223:        settings_heading_editor: Editor
224:        settings_heading_machine: This machine
225:        settings_heading_presentation: Presentation
226:        settings_heading_rail: Rail and pages
227:        settings_heading_sessions: Sessions and usage
228:        settings_heading_sources: Project sources
229:        settings_heading_terminal: Terminal
230:        settings_heading_unheaded: Without a heading
236:        settings_origin_tip: 'Show the Repository scope of {0}, where its languages are set'
265:        settings_origin_field: 'not a field of a language record'
266:        settings_origin_key: 'not a key the file reads; only languages is read'
267:        settings_origin_language: 'not one of the languages that have colours'
268:        settings_origin_map: 'not a map'
270:        settings_origin_not_a_map: 'languages is not a map of language name to its record'
271:        settings_origin_repeat: 'a name an earlier row already took'
272:        settings_origin_unnamed: 'a row with no name'
275:        settings_origin_value: 'outside the values the field takes'
283:        settings_reset: Reset Setting
284:        settings_search: Search settings
289:        settings_where: 'Entry {0}, {1}:'
```

They are labels, headings, tips and the eight fragments `settings_origin_field`, `_key`, `_language`, `_map`, `_not_a_map`, `_repeat`, `_unnamed`, `_value`, which item 10 says keep no stop of their own. None of item 10's messages (`settings_failed`, `settings_wallpaper_failed`, `settings_list_failed`, `settings_hub_failed`, `settings_origin_also`, `settings_origin_none`, `settings_refused`, `settings_unparsed`, `settings_unreadable`) is among them. Item 10's row says this.

The passing runs on the unchanged tree that the first build's report stated without output (C10's row 'is said until it is withdrawn', C7's nested-names rows 1 and 3, C12's rows with a key held) are removed from C7, C10 and C12: the base copy has no `node_modules`, and this round writes nothing outside the worktree, so they were not run.

### Ruling 8: the commands of this step that changed a file by a program

First build:

- `sed -i '' "s/        return isSelf ? t('person.self_held_tip'/        return pressedSelf ? t('person.self_held_tip'/" src/lib/views/boards/person/Person.svelte`: line 200 of `src/lib/views/boards/person/Person.svelte`.
- `npm run format` (`prettier --write .`), first run: it printed as rewritten `src/lib/shell/status/AppItems.svelte`, `src/lib/ui/forms/choice/SuggestInput.svelte`, `src/lib/views/academic/present/arrange/RuleForm.svelte`, `src/lib/views/boards/focus/FocusFilter.svelte`, `src/lib/views/boards/person/Person.svelte`, `src/lib/views/system/workbench/editors/InlineItems.svelte`, `tests/state/system/settings/row-writer.test.ts`.
- `npm run format`, second run, with its output sent to `/dev/null`: `git status --short | wc -l` printed 81 before and after it, so it changed the status of no file; whether it rewrote a file already changed is not known from its output (not verified).
- `npm run diagrams` and `npm run docs:palette` (the brief's verify step): `docs/diagrams/layer-server`, `layer-shell`, `layer-state`, `layer-views` and `layers`, each `.dot` and `.svg`, and `docs/palette.md`.
- Shell redirects and copies into the session scratchpad, outside the worktree: `cp -R tests/server/files/nested-names.test.ts tests/state/system/settings/row-writer.test.ts <scratchpad>/`, `cp SourceItems.svelte LanguageItems.svelte <scratchpad>/`, `cp src/lib/shell/status/StatusBar.svelte <scratchpad>/` (twice), `head -285 LanguageItems.svelte > <scratchpad>/li_head.txt`; in `<scratchpad>/o167-c13/`: `git status --short > st-before.txt`, `npm run test:quick > quick1.txt` to `quick4.txt` with `echo "exit $?" >> quickN.txt`, `npm run check > check.txt`, `sh utils/unused-exports.sh > unused.txt`, and the case-run programs' `fs.writeFileSync` of `out.txt` and `out-b.txt`; `cat > /tmp/claude-502-hdr.txt` with an empty body, removed by `rm` in the same command. The folder `o167-c13` was removed with `rm -r` before the first report, and the six copies (`nested-names.test.ts`, `row-writer.test.ts`, `SourceItems.svelte`, `LanguageItems.svelte`, `StatusBar.svelte`, `li_head.txt`, each identical to the base copy's file, `diff -q` printing nothing) were removed with `rm` in this round; `ls` of each now prints "No such file or directory".
- Commands that wrote nothing: two `python3 - <<'EOF'` with empty bodies, `python3 -c "print(...)"`, `cat > /dev/null` and `cat >> /dev/null` with empty bodies, `tee /dev/null`.
- Moves with `mkdir` and `mv`: `src/lib/state/sources/fs-parts/` (`fs-history.ts` to `fs-parts/history.ts`, `bookmarks.svelte.ts` into it) and `src/lib/ui/frame/card/` (`Card.svelte` into it).
- `svelte-kit sync` and `svelte-check`, run by `npm run check` and test:quick, write the generated `.svelte-kit/` folder, which git ignores.

This round: every edit with the Edit and Write tools. `npx prettier --write` over the round's files printed no rewritten file (its output filtered by `grep -v unchanged` printed nothing). `npm run diagrams` and `npm run docs:palette` ran as the verify list asks; `git status --short docs` lists the same ten diagram files as modified. Read-only `python3 -I` programs over this builder's transcript changed no file.

The worktree's `.scratch/migration/agents/guarded.md` and `spec.md` show as modified and `briefs/O167-cases.md` and `briefs/O167-round1.md` as untracked; `diff -q` of `guarded.md` and `spec.md` against the main checkout's prints nothing, so they are the orchestrator's copies of the ledger, not edits of this builder.

### Cases run again

- C6, by reading the code above and by ruling 1's rows: a deleted collection entry and a deleted schedule leave the rows from the answer until a snapshot or payload without them arrives, and an entry put back or saved again by another hand after that shows.
- C12, by ruling 2's rows: the row-writer run above.
- C14, by reading `Card.svelte` and `CardActions.svelte` as under ruling 3; the look at landing named there.
- C18, by reading `RuleForm.svelte` and `GroupHead.svelte` as under ruling 5; the look at landing named there.
- Every other case keeps its first-build result; none was run again.

### Verify, after the round's last change

`npm run diagrams` and `npm run docs:palette` print the files they write, ending:

```
docs/diagrams/writes.dot
docs/diagrams/writes.svg
> node utils/diagrams/palette.mjs

docs/palette.md
```

`npm run test:quick`:

```
test:quick: 89 changed file(s), from git since HEAD
test:quick: 89 test file(s)
ok      prettier (2.4 s): All matched files use Prettier code style!
ok      ASCII gate (2.9 s)
ok      svelte-kit sync (4.1 s)
ok      eslint (18.8 s)
ok      svelte-check (22.7 s): 1794100155143 COMPLETED 590 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (95.2 s): Duration  75.47s (transform 87.02s, setup 0ms, import 212.19s, tests 58.27s, environment 5.37s)
ok      vitest checks (124.5 s): Duration  104.74s (transform 58.91s, setup 0ms, import 107.19s, tests 276.72s, environment 5ms)
ok      vitest slow (132.2 s): Duration  112.58s (transform 45.56s, setup 0ms, import 88.79s, tests 271.56s, environment 3ms)
test:quick: 136.4 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
```

It does not cover tests that reach no changed file within its import depth; the plan's whole verify list runs at landing.

The ASCII gate over every changed file, `(git diff --name-only --diff-filter=d; git ls-files --others --exclude-standard) | grep -v '^\.scratch' | grep -vE '\.svg$' | tr '\n' '\0' | xargs -0 perl -ne 'print "$ARGV:$.: $_" if /[^\x00-\x7F]/; close ARGV if eof'`, prints nothing (exit 0).

`sh utils/unused-exports.sh 2>&1 | diff ../O167-base/unused-exports.txt -` prints nothing (exit 0): no line added.

`node utils/outside-paths.mjs .scratch/migration/agents/briefs/O167.md 2d28fe2ac` prints 51 paths (exit 0). Each is the brief's, a round-0 ruling's, this round's, or one named under "Paths written outside":

- the ledger copies `.scratch/migration/agents/briefs/O167-cases.md`, `briefs/O167-round1.md`, `guarded.md`, `spec.md`: the orchestrator's, see ruling 8;
- `docs/diagrams/layer-server`, `layer-shell`, `layer-state`, `layer-views`, `layers` (`.dot`, `.svg`): the brief's "the generated diagrams `docs/diagrams/*.dot` and `*.svg`", a list line the script does not read as an entry;
- round-0 rulings: `src/lib/server/files/search/search-routes.ts`, `src/routes/api/(files)/search/+server.ts` (ruling 4); `src/lib/shell/status/AppItems.svelte`, `LanguageItems.svelte`, `SourceItems.svelte` (ruling 3); `src/lib/state/client/context.ts`, `src/lib/state/forms/page-entry.ts`, `src/lib/views/boards/collection/Collection.svelte` (ruling 1); `src/lib/views/system/workbench/editors/FieldControl.svelte`, its new second component `InlineItems.svelte`, `src/lib/ui/forms/TextArea.svelte`, `src/lib/ui/forms/choice/SuggestInput.svelte` (ruling 5); `src/lib/state/workbench/ui.svelte.ts` (ruling 2, and item 11's refused fields under ruling 8); `src/lib/shell/panes/PaneView.svelte`, `src/lib/shell/panes/pane-view.ts`, `src/lib/state/workbench/layout.svelte.ts` (ruling 6, the pane component and the layout store's construction it asks the report to name);
- this round: `context.ts`, `ui.svelte.ts`, `src/lib/ui/frame/card/Card.svelte`, `tests/state/forms/page-entry.test.ts`, `tests/state/system/schedule-lines.test.ts`;
- the accepted moves (ruling 6 of this round): `src/lib/state/sources/fs-history.ts`, `fs-parts/history.ts`, `fs-parts/bookmarks.svelte.ts`, `explorer/sections/timeline-state.svelte.ts`; `src/lib/ui/frame/card/card-room.ts` and the Card importers and comments `CareerCard.svelte`, `Tile.svelte`, `LaneCard.svelte`, `RecordCard.svelte`, `Usage.svelte`, `Gallery.svelte`, `Status.svelte`;
- named under "Paths written outside" (item 10, item 6): `src/lib/state/system/config/messages.ts`, `src/lib/views/system/workbench/settings/said.ts`, `other-rows/WallpaperPicker.svelte`, `src/lib/ui/forms/NumberInput.svelte`, `tests/state/client/created-ids.test.ts`, `tests/state/sources/settings-readers.test.ts`.

### Files this round changed, with line counts

`wc -l`:

| File | Lines |
| --- | --- |
| src/lib/state/client/context.ts | 880 |
| src/lib/state/forms/settled.svelte.ts | 174 |
| src/lib/state/forms/page-entry.ts | 532 |
| src/lib/state/system/machine/schedules/schedule.svelte.ts | 818 |
| src/lib/state/system/config/editors/fields.ts | 786 |
| src/lib/state/system/config/scopes/write.ts | 167 |
| src/lib/ui/frame/card/Card.svelte | 364 |
| src/lib/views/shared/card/record/CardActions.svelte | 397 |
| src/lib/state/workbench/layout/open/landing.ts | 126 |
| src/lib/state/workbench/ui.svelte.ts | 604 |
| src/lib/views/academic/present/arrange/RuleForm.svelte | 195 |
| src/lib/ui/controls/heads/GroupHead.svelte | 277 |
| tests/state/forms/page-entry.test.ts | 461 |
| tests/state/system/schedule-lines.test.ts | 134 |
| tests/state/system/settings/row-writer.test.ts | 285 |
| docs/diagrams (the ten files above) | generated |

Each source file is within 880 lines and each component within 520.

### Judgment calls of this round

- Ruling 1: whether the snapshot holds a removed entry is asked through the snapshot source `createPages` already has, and `context.ts` gains only the `afterReceive(settled.heard)` line, since `context.ts` stands at the 880-line limit.
- Ruling 3: every card whose controls lie over its title now lays them out unseen and measures them at its first draw, one measure per such card.
- Ruling 5: of the two ways the ruling allows, the rule form uses `scroll-margin-top` with `scrollIntoView({ block: 'nearest' })`, so no scroll distance is computed in the form.
