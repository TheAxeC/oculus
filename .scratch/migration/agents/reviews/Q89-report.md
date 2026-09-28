# Q89 report: the Terminal view as VS Code terminal panel (after repair round 2)

Every item of the brief, of round 1 and of round 2 is done. One behaviour has no automated case: the pointer press on a row that moves focus to the grid needs a DOM, which the unit suite does not have; it is checked by `npm run check` and `npm run lint` only, and needs the look on TEST. The full verify list was not run this round, as the rulings say.

## Open items of the state file (verbatim from the main checkout's `tools/oculus/.scratch/migration/orchestrator-state.md`, read at the end of the round)

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

None.

## Round 2: each item

| Item | State | Where | Proof |
|---|---|---|---|
| 1. Z39 (a): Split in the row's own folder | DONE | `ComposerRecord.split` (`src/lib/state/sessions/composer.ts:35`), read by `composerOf` as a non-empty string (`:77`); `splitRecord` (`:85`), `offeredPlaces` (`:93`), `composerWorkspace` (`:99`); `Composer.svelte:77-83` offers `offeredPlaces(...)` and starts in `composerWorkspace(...)`; Split writes `splitRecord(folder, row.kind)` (`TerminalList.svelte:100-105`); `placeOf` and its audit are gone; the Split tooltip and `HELP.md:123` unchanged | five cases in `tests/state/sessions/composer.test.ts` ("a composer opened by Split") and one view case in `tests/views/sessions/terminal.test.ts` pass |
| 2. Delete and Backspace made safe | DONE | `rowKey(key, shift, repeat)` returns null for a repeated Delete or Backspace (`terminal-list.ts:86`), called with `event.repeat` (`TerminalList.svelte:138`); `armKept` (`terminal-list.ts:97`) clears the arm when the stop moves (`TerminalList.svelte:150`); `onfocusout={left}` on the list (`:187`, `left` at `:114`) clears it when `relatedTarget` is outside the list; a pointer press on a row (`pressed`, `:108`, `event.detail > 0`) calls `onshown`, and `Terminal.svelte` `pointed` (`:284`) focuses the grid shown now or sets `focusing`, which the grid effect honours on mounting (`:324-325`) | "audits a held key: an auto-repeated Delete or Backspace kills nothing" and "audits the arm of Kill: kept only while its row is the stop and focus is in the list" pass; the pointer focus has no case (see the top) |
| 3. Controls' CSS comment | DONE | `TerminalList.svelte:335-336`: "drawn clear, and drawn while the pointer or the keyboard's stop is on the row, so the armed Kill shows while a Delete or Backspace waits for its second press" | read |
| 4. `rowKey` doc comment | DONE | `terminal-list.ts:79-85`: the VS Code clause is gone; "these keys are the keyboard's way to Split and Kill, which the list keeps out of the focus order" | read |
| 5. `terminal-list.ts` line count | DONE | `wc -l` prints 151 now (the round 1 file printed 144; the round 1 report's 143 was wrong) | table below |
| 6. Each new case's failure with its change undone | DONE | below | |
| 7. Before and after of Split outside every place and of a held Backspace | DONE | below | |

Other changes in the round:
- `Terminal.svelte` stays at 540 lines, the component limit, with the new focus lines: `togglePanePin` is written with an `else if` instead of two blocks, and the grid's dragover handler moved to `fileOver` in `terminal-list.ts:114`. Behaviour of both is unchanged.
- The new import of `FILE_DRAG` in `terminal-list.ts` changes two counts in the layer diagrams (`views/sessions` to `state`: 71 to 72; `views` to `state`: 568 to 569); `npm run diagrams` regenerated `docs/diagrams/layers.*` and `docs/diagrams/layer-views.*`, and `tests/checks/diagrams/diagrams.test.ts` passes.
- `Composer.svelte`'s head comment says a Split tab starts in its terminal's folder, offered first when no place holds it; `TerminalList.svelte`'s head comment says the arm rule, the pointer's hand-off to the grid and where Split starts.
- Step paths added by the rulings: `src/lib/state/client/context.ts` and `tests/state/sessions/composer.test.ts`. `src/lib/state/sessions/composer.ts` and `Composer.svelte` are also changed by item 1.

## Before and after (round 2)

- Split of a terminal outside every place (a shell in `/hub/projects/foo/code` with places `/hub` and `/hub/tools`). Before: the composer beside opened with the workspace `/hub`, the deepest place holding the folder, and a terminal in `/tmp` opened at the hub. After: the composer offers `/hub/projects/foo/code`, `/hub`, `/hub/tools` in that order and starts in `/hub/projects/foo/code`; a terminal in `/hub/tools` gives today's places with `/hub/tools` chosen; a composer not opened by Split offers exactly today's places.
- A held Backspace (or Delete) on a row. Before: the first press armed Kill and the keyboard's auto-repeat was the second press, so holding the key killed the terminal after the repeat delay (about half a second). After: repeats ask nothing, so a held key only arms; the arm is cleared when the stop moves to another row or focus leaves the list, so a second press kills only the row the first armed while the list still has focus.
- A pointer press on a row. Before: the row was shown and focus stayed on the row. After: the row is shown and the keyboard goes to its grid (at once when the row is the terminal shown, on mounting otherwise); Enter on a row still leaves focus in the list.

## Each new case's failure (round 2)

### First run, on the round 1 code (`npx vitest run tests/views/sessions/terminal.test.ts tests/state/sessions/composer.test.ts`: 8 failed, 35 passed)

- "records the terminal's own folder as the folder it was split from and starts there": `TypeError: splitRecord is not a function`.
- "reads the split folder as a string, and drops an empty or malformed one": `AssertionError: expected undefined to be '/w/x' // Object.is equality`.
- "offers a split folder no place holds first, by its path, and starts in it": `TypeError: splitRecord is not a function`.
- "offers the places as they are when the split folder is one of them, with it chosen": `TypeError: splitRecord is not a function`.
- "offers the places as they are to a composer no Split opened": `TypeError: offeredPlaces is not a function`.
- "starts in the split terminal's own folder, though no place of the composer holds it": `AssertionError: expected 'data-picker="workspace"><div class="m...' to contain '>code<'`.
- "audits a held key: an auto-repeated Delete or Backspace kills nothing": `AssertionError: expected 'kill' to be null // Object.is equality`.
- "audits the arm of Kill: kept only while its row is the stop and focus is in the list": `TypeError: armKept is not a function`.

### With the change each guards undone, on the finished code

Each was run alone with `npx vitest run <file> -t '<name>'` with one change undone, and the file was then put back byte for byte (the script asserted it). Every run printed `Tests  1 failed` and the failure below. After the runs, both files pass: `Test Files  2 passed (2)`, `Tests  43 passed (43)`.

- "records the terminal's own folder ..." (`splitRecord` writes no `split`): `AssertionError: expected { ...(4) } to deeply equal { ...(5) }`.
- "reads the split folder as a string ..." (the `record.split` line taken out of `composerOf`): `AssertionError: expected undefined to be '/w/x' // Object.is equality`.
- "offers a split folder no place holds first ..." (`offeredPlaces` returns the places alone): `AssertionError: expected [ '/hub', '/hub/tools' ] to deeply equal [ '/hub/projects/foo/code', ...(2) ]`.
- "offers the places as they are when the split folder is one of them ..." (`offeredPlaces` prepends the split folder even when a place equals it): `AssertionError: expected [ '/hub/tools', '/hub', '/hub/tools' ] to deeply equal [ '/hub', '/hub/tools' ]`.
- "offers the places as they are to a composer no Split opened" (`offeredPlaces` reads the record's workspace when there is no split folder): `AssertionError: expected [ '/elsewhere', '/hub', '/hub/tools' ] to deeply equal [ '/hub', '/hub/tools' ]`.
- "starts in the split terminal's own folder ..." (`Composer.svelte` offers its places without `offeredPlaces`): `AssertionError: expected 'data-picker="workspace"><div class="m...' to contain '>code<'`.
- "audits a held key ..." (`rowKey` returns `'kill'` for a repeat): `AssertionError: expected 'kill' to be null // Object.is equality`.
- "audits the arm of Kill ..." (`armKept` returns `armed !== ''`): `AssertionError: expected true to be false // Object.is equality`.

## Checks, run at the end of round 2

- `npx vitest run tests/views/sessions tests/state/sessions tests/checks tests/views/whole tests/ui/wall.test.ts tests/ui/colours.test.ts tests/state/workbench/layout`: `Test Files  60 passed (60)`, `Tests  1146 passed (1146)`.
- `npm run check`: `COMPLETED 1431 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npm run format:check`: `All matched files use Prettier code style!`.
- `npm run lint`: exit 0, no output after `eslint .`.
- The spec's perl ASCII gate over `src tests bin config` printed 0 lines; `LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md` printed 0 lines.
- The full verify list was not run in this round, as the rulings say.

## Round 1: each ruling item (line numbers as of round 2)

| Item | State | Where | Proof |
|---|---|---|---|
| 1. The list is one keyboard stop; Delete or Backspace kills, Shift+Enter splits | DONE | the Split and Kill controls carry `tabindex={-1}`; `keys()` (now `TerminalList.svelte:136`) asks `rowKey` (now `terminal-list.ts:86`) and calls `show`, `split` or `kill`; head comment `TerminalList.svelte:11-15` corrected; `terminal_split_tip` and `terminal_kill_tip` name the keys; `HELP.md:123` names them | "is one stop of the focus order: the row at the stop, and none of its controls" and "audits the keys a row answers: Delete and Backspace kill, Shift+Enter splits" pass |
| 2. A composer tab with one terminal lists it | DONE | `listDrawn` in `terminal-list.ts`, used in `Terminal.svelte` for `listed`; `HELP.md:123` says both cases | "draws the one terminal there is as a row while the tab shows the composer", "draws no list under the composer when no terminal runs", "audits when the list is drawn: two terminals, or one under the composer" pass |
| 3. `parseLayout` keeps only registered view ids | DONE | `parseLayout(value, label, known)` at `saved/saved.ts:279`, `viewStates` at `:328` (drops the empty key and any id `known` refuses; no rule given keeps nothing); `registerViews` on the layout store (`layout.svelte.ts:166`, `:674`), passed to `parseLayout` in `loadLayout`; wired in `src/lib/state/client/context.ts:255` as `registry.viewFor(view) !== undefined` | "keeps a saved value only under a registered view id, dropping an empty or unknown key" and "reads back only what the registry of the client holds after a reload" pass (`tests/state/workbench/layout/pages.test.ts`) |
| 4. `storedOrder` duplicate case | DONE | `terminal.test.ts`, the stored-order audit: `storedOrder({ order: ['a', 'a'] })` equals `['a']` | passes |
| 5. Kill counted per row | DONE | "offers Split and Kill on every row, ..." counts `aria-label="Split"` and `aria-label="Kill"` once in each row's slice | passes |
| 6. `DESIGN.md:271` | DONE | "except the Terminal view"; the sentence also names the one row under the composer | read |
| 7. `layout.svelte.ts:7-9` head comment | DONE | re-wrapped to the file's width | `tests/checks/source/comment-width.test.ts` passes |
| 8. Each case's own failure quoted | DONE | below | |
| 9. The `git rev-parse` line | kept | "Limitations" | |

`context.ts` is a path outside the brief's list: the layout does not import the registry, so the registry's rule is handed to the layout store where the client is wired, beside the existing `registerOpened` call.

## Each new case's failure

### Round 1 cases, on the code before this round (`npx vitest run tests/views/sessions/terminal.test.ts`)

- "is one stop of the focus order: the row at the stop, and none of its controls": `AssertionError: expected [ ...(4) ] to have a length of 2 but got 4` (three `tabindex="0"` in the list: the row, its Split and its Kill).
- "draws the one terminal there is as a row while the tab shows the composer": `AssertionError: expected [] to deeply equal [ 'd4e5f6-shell' ]`.
- "audits the keys a row answers: Delete and Backspace kill, Shift+Enter splits": `TypeError: rowKey is not a function`.
- "draws no list under the composer when no terminal runs": passed on the code before the round; it guards that a composer with no terminal draws no list. With `listDrawn` changed to `count >= 2 || composer`: `AssertionError: expected '<!--[--><section class="pane svelte-b...' not to contain 'data-terminal-list'`.
- "audits when the list is drawn: two terminals, or one under the composer": with `listDrawn` not exported: `TypeError: listDrawn is not a function`. With the rule undone to `count >= 2`, the composer-with-one case fails: `AssertionError: expected [] to deeply equal [ 'd4e5f6-shell' ]`.
- Duplicate stored order (item 4): passed on the code before the round, since `storedOrder` already used `new Set`. With `new Set` removed from `storedOrder`: `AssertionError: expected [ 'a', 'a' ] to deeply equal [ 'a' ]`.
- Kill per row (item 5): passed on the code before the round, since every row has Kill. With Kill drawn on the first row only: `AssertionError: expected [ Array(1) ] to have a length of 2 but got 1`.
- "keeps a saved value only under a registered view id, dropping an empty or unknown key": with the round's filter undone (every key kept): `AssertionError: expected { '': { order: [ 'a' ] }, ...(2) } to deeply equal { terminal: { x: 1 } }`.
- "reads back only what the registry of the client holds after a reload": with the `registerViews` line removed from `context.ts`: `AssertionError: expected undefined to deeply equal { order: [ 'x' ] }`.

### The step's four `pages.test.ts` cases and four `folds.test.ts` cases, each with the step's change to its function undone

Each was run alone with `npx vitest run <file> -t '<name>'`, with the undone change in place, and the file was then put back byte for byte (the script asserted it).

- "is saved with the pages and read back after a reload" (`pageViewState`/`setPageViewState` taken out of the store): `TypeError: first.setPageViewState is not a function`.
- "is shared by the tabs of one view on the page and read by no other view" (same): `TypeError: store.setPageViewState is not a function`.
- "is kept by no page for an instance no page holds" (same): `TypeError: store.setPageViewState is not a function`.
- "reads a saved value that is not a map as nothing kept" (the `page.views` read taken out of `parseLayout`): `AssertionError: expected undefined to deeply equal { terminal: { order: [ 'z' ] } }`.
- "titles an agent terminal by its agent and describes it by the session running in it" (`terminalChoices` put back to its old `label` model): `AssertionError: expected { id: 'ended-one', ...(2) } to match object { id: 'ended-one', ...(4) }`.
- "describes an agent terminal no session is found in by its own name, else its id" (same): `AssertionError: expected { id: 'd4e5f6-claude', ...(2) } to match object { id: 'd4e5f6-claude', ...(1) }`.
- "titles a shell by its running command and describes it by its folder" (same): `AssertionError: expected [ { id: 'a1b2c3-shell', ...(2) } ] to deeply equal [ { id: 'a1b2c3-shell', ...(5) } ]`.
- "titles a shell tmux reports no command for "shell"" (same): `AssertionError: expected undefined to be 'shell' // Object.is equality`.

### The step's first run on the unchanged tree (from the first round, unchanged)

Every case failed except two, which the brief states as unchanged behaviour: "is drawn under an agent terminal" and "stays disabled with its sentence for an agent session running outside oculus". The quotes: shell steer box `expected '<!--[--><section class="pane svelte-b...' not to contain 'data-steer'`; one terminal `expected '' to be 'vim'`; two rows `expected '<!--[--><section ...' to contain 'data-terminal-list'`; shell titled "shell" (view) `expected '' to be undefined`; foreign row `expected [] to deeply equal [ 'a1b2c3-claude', 'd4e5f6-shell' ]`; stored order (view) `TypeError: client.layout.setPageViewState is not a function`; Split and Kill `expected 0 to be greater than or equal to 2`; the pure-function audits `Cannot find module '../../../src/lib/views/sessions/terminal/terminal-list.ts'`.

## What to build (the brief), item by item

| Item | State | Where |
|---|---|---|
| 1. Message box only under an agent | DONE | `Terminal.svelte` `agent` and `{#if agent}<SteerBox {terminal} />`; the "selected elsewhere" branch unchanged |
| 2. TerminalList replaces TerminalPicker | DONE | `TerminalPicker.svelte` deleted; `TerminalList.svelte`; rows from `terminalChoices` (`folds.ts`); one keyboard stop with Enter, Shift+Enter, Delete and Backspace; Split and Kill on hover; bell mark for 1000 ms |
| 3. One terminal: title on the bar | DONE | `TerminalTitle.svelte`, drawn while the tab shows its only terminal; a composer tab lists the one terminal instead (ruling 2) |
| 4. Multi-line paste question | DONE | `holdPastes`, `pasteLines`, `Confirm` in `Terminal.svelte` |
| 5. File drop types a quoted path | DONE | `droppedOnGrid`, `shellQuote` |
| 6. Reorder kept in the page's layout state | DONE | `Page.views`, read back only under a registered view id; `orderedRows`, `movedOrder`, `storedOrder`, `withOrder` |
| 7. Words and docs | DONE | `terminal.yml` (11 keys of the step, two tips naming the keys), `session-list.yml` picker words removed; `HELP.md:123`, `DESIGN.md:208`, `:271`, `:272` |

`grep -rn "pick_terminal\|TerminalPicker\|Pick a terminal\|picks among the terminals" src tests config HELP.md DESIGN.md README.md` printed nothing in the first round; this round changed none of those names.

## Files, lines before and after

Before is `wc -l` of the same path in the main checkout; after is `wc -l` in the worktree, both run at the end of round 2.

| File | Before | After |
|---|---|---|
| src/lib/views/sessions/terminal/Terminal.svelte | 411 | 540 |
| src/lib/views/sessions/terminal/TerminalPicker.svelte | 62 | deleted |
| src/lib/views/sessions/terminal/TerminalList.svelte | new | 358 |
| src/lib/views/sessions/terminal/TerminalTitle.svelte | new | 61 |
| src/lib/views/sessions/terminal/terminal-list.ts | new | 151 |
| src/lib/views/sessions/terminal/Composer.svelte | 418 | 423 |
| src/lib/state/sessions/composer.ts | 259 | 292 |
| src/lib/state/sessions/folds.ts | 272 | 303 |
| src/lib/state/workbench/layout.svelte.ts | 638 | 680 |
| src/lib/state/workbench/layout/model.ts | 157 | 168 |
| src/lib/state/workbench/layout/saved/saved.ts | 425 | 445 |
| src/lib/state/client/context.ts | 293 | 295 |
| config/text/views/sessions/terminal.yml | 20 | 31 |
| config/text/views/sessions/session-list.yml | 70 | 68 |
| tests/state/sessions/folds.test.ts | 288 | 374 |
| tests/state/sessions/composer.test.ts | 323 | 367 |
| tests/views/sessions/terminal.test.ts | new | 340 |
| tests/views/sessions/sessions.test.ts | 638 | 639 |
| tests/views/whole/type-scale.test.ts | 345 | 345 (two entries changed) |
| tests/state/workbench/layout/pages.test.ts | 611 | 708 |
| tests/ui/wall.test.ts | 204 | 206 |
| HELP.md | 294 | 294 (line 123 rewritten) |
| DESIGN.md | 320 | 320 (lines 208, 271, 272 rewritten) |
| docs/diagrams/layers, layer-state, layer-views (.dot and .svg) | | regenerated by `npm run diagrams` |

## Judgment calls (each reversible)

1. The split folder is kept in the tab's composer record for as long as the tab holds the composer, so picking another place and coming back still finds it offered.
2. `offeredPlaces` adds the split folder only when no place equals it; a place that holds it as a parent does not stop it being added, per the ruling's first case.
3. A pointer press is told from a key's click by `event.detail > 0`; Space on the row's button (which `rowKey` does not answer) clicks with `detail` 0 and so shows the row without moving focus, like Enter.
4. The grid focus for a row that is not yet shown is a pending id read when that terminal's grid mounts, and cleared on every mount so a later mount of the same terminal does not take focus.
5. `parseLayout` takes the rule as a third argument whose default keeps no view state, and the layout store keeps nothing until `registerViews` is called; `registerViews` is a second registration hook beside `registerOpened`, so the layout store does not import the registry.
6. Shift+Enter is the Split key; Delete and Backspace both arm and then kill, as the Kill control does. The list under a composer tab with one terminal is drawn only when the tab shows the composer, not the "selected elsewhere" sentence.
7. From the first round, unchanged: `Page.views` keyed by view id with `{ order: string[] }` under `terminal`; the whole drawn order written on a drop; start order by `created` as an ISO string; agent rows described by the session title, else the terminal's name; shell description the last folder segment; `pasteLines` counting a trailing line break as closing the last line; the bell mark also beside the bar title; the dropped path typed through `sendInput`; list width 180 px.

## Limitations

- The pointer press that hands focus to the grid, the paste question, the file drop, the drag, the bell, hover, the keys and the arm clearing on focus leaving the list need a DOM; the unit suite asserts the pure functions they call (`rowKey`, `armKept`, `pasteLines`, `shellQuote`, `movedOrder`, `listDrawn`), and the look on TEST checks them on screen.
- `Terminal.svelte` is at 540 lines, the component limit; the next line added to it needs a split.
- A drop while the socket is closed types nothing, as typing at the grid does.
- The first round ran one read-only `git rev-parse` in the worktree, against the brief's rule; no git state was changed. No git command was run in rounds 1 and 2.

## Before and after, for the look (page TEST)

- One terminal, tab showing it: the bar shows its title and folder, no list.
- One terminal, tab on the composer (New terminal): a one-row list on the right; press the row to show it here, and the keyboard goes to its grid.
- Two or more terminals: the list on the right; the row this tab shows is marked; hover shows Split and Kill.
- Keyboard: Tab reaches the list once (the current row), then leaves it; the arrow keys move between rows; Enter shows, Shift+Enter splits, Delete or Backspace pressed twice kills; holding the key kills nothing; moving the stop or tabbing out disarms.
- Split of a shell that has moved (`cd`) to a folder no workspace names: the composer beside lists that folder first and starts there.
- Steer box: under a Claude or Codex terminal only; a shell's grid fills the height.
- Paste of three lines into a grid: the question "Paste 3 lines into the terminal?"; one line pastes at once.
- Drop a file from Files on the grid: its quoted path and a space are typed, no Enter.
- Drag a row: it moves; after a reload the order is kept.
