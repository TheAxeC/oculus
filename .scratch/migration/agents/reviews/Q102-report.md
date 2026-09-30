# Q102 report: the terminal working as VS Code's terminal

## Not done

- Not verified against a real tmux: the trailing-`;` escape in `tmuxValue` (a title ending in `;`). The unit test uses a tmux double that models the separator rule as documented; no real tmux was run. This is the one item of the brief that rests on documentation rather than a run.
- Not verified on screen: the look of the new dropdown, the row scroll, the rename field, the icon dialog and the close dialogs. Only the server-render tests and the checks below ran. The look pass belongs to the orchestrator.
- Everything else in the brief's 11 build items is built and covered by the tests listed below.

## Open items (verbatim from orchestrator-state.md)

- none.

## First run on the unchanged tree (recorded before any code changed)

99 new or changed cases: 70 failed, 29 passed. `terminal-style.test.ts` failed to load (its imports did not exist). The 29 that passed on the old code:

| Group | Count | Why it passed |
| --- | --- | --- |
| Pure rules in `pages.test.ts` (`closeAsk`, `closeOnce`, `resetAfterAsking` and the like) including "asks no busy question when none is busy" | 19 | The rule is new but its degenerate case matches the old behaviour |
| Refusal cases in `terminal-edit.test.ts` | 5 | The old server refuses an unknown action, which is what the case expects |
| Regression cases in `terminal-close.test.ts` (moves, splits, reload keep their terminals) | 5 | Nothing ended terminals before, so nothing was ended on a move |

This table is carried from the run made before the build; it was not re-run in the final turn.

## DONE / NOT DONE

| # | Item | Status | Proof |
| --- | --- | --- | --- |
| 1 | New starts at once in the tab's folder; strip item, `n` key and Sessions New | DONE | `tests/state/client/terminal-start.test.ts` (16 cases) |
| 2 | Kinds dropdown beside New | DONE | `terminal-menu.test.ts`, `terminal.test.ts` |
| 3 | Split starts at once, bar Split button, said refusal | DONE | `terminal-start.test.ts` cases 11-15 |
| 4 | Row of any number of terminals, 80 px minimum, `readTab` reads old shapes | DONE | `tests/state/sessions/terminal/terminal-row.test.ts` (16 cases), `terminal-tabs.test.ts` |
| 5 | Rename (menus, double-click, `rename` action, 80/81, control characters) | DONE | `terminal-edit.test.ts`, `terminal-style.test.ts` |
| 6 | Change Icon, Change Color, `restyle` | DONE | same |
| 7 | Clear (xterm plus tmux `clear-history`) | DONE | `terminal-edit.test.ts` 12, `terminal-style.test.ts` 9-10 |
| 8 | Copy as HTML with `@xterm/addon-serialize` 0.14.0 | DONE | `terminal-style.test.ts` 11-14 |
| 9 | Closing a tab, pane or page, or a reset, ends the tab's running terminals | DONE | `tests/state/client/terminal-close.test.ts` (18 cases) |
| 10 | Asking first (`GET /api/terminal?busy=`), one question, no second press in flight | DONE | `terminal-edit.test.ts` 16-20, `pages.test.ts`, `terminal-close.test.ts` |
| 11 | Docs and words | DONE | `grep -rn "stops nothing\|keep running\|keeps running\|leaves its terminals running" src DESIGN.md HELP.md` prints nothing (exit 1) |

Final run, `npm run diagrams` (exit 0) and then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` (exit 0):

```
$ npm test
 Test Files  342 passed | 19 skipped (361)
      Tests  5221 passed | 557 skipped (5778)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  360 passed | 9 skipped (369)
$ npm run check
1790730578069 COMPLETED 2354 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
built in 5.73s / built in 11.34s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

`sh utils/folder-check.sh` and `sh utils/size-check.sh` both exit 0. The ASCII scan over `src tests config` prints nothing.

## Reverts, run red once

Each new or changed test names its revert in a `// Revert:` comment. Each was applied to the source alone, the named test run, and the source restored. Result lines below are test name, then the failing assertion.

Row model (`terminal-row.test.ts`): a row capped at two, widths under 80, a lift to 80, a drag past 80, a row wider than the pane, order, a terminal outside the row, unsplit shares, unsplit to one, renormalising, the shown neighbour, the old `beside`/`share` shape, a row of one, a foreign entry, an empty row and `tabFolder` all fail with their revert (for example `expected 75 to be greater than or equal to 80`, `expected 40 to be 80`, `expected 0.75 to be close to 1`, `expected '/x' to be '/y'`).

Server (`terminal-edit.test.ts`), 20 of 20 red, for example:
- dropped rename: `expected 400 to be 200`
- empty title sent as a value instead of an unset: `expected [ [ 'set-option', '-t', ... ] ] to deeply equal [ [ 'set-option', '-u', '-t', ... ] ]`
- trailing `;`: `expected null to be 'build;'`
- `-F` expansion: `expected '%1' to be '#{pane_id}'`
- 64-id limit: `expected 200 to be 400`
- failed read not asking: `expected [ { id: 'a1a1a1-shell', ... } ] to deeply equal [ { id: 'a1a1a1-shell', ... } ]`

Start (`terminal-start.test.ts`), 16 of 16 red, for example: composer instead of a start `expected [] to deeply equal [ { kind: 'shell', cwd: '/x' } ]`; one start for all `Test timed out in 5000ms`; start answered after its tab closed `expected [ { action: 'stop', ... } ] to deeply equal [ ..., ... ]`; no hub fallback `expected [ { kind: 'shell', cwd: '' } ] to deeply equal [ { kind: 'shell', cwd: '/hub' } ]`.

Close (`terminal-close.test.ts`): closeInstance `expected [] to deeply equal [ 'a1a1a1-shell', 'b2b2b2-shell' ]`; closePane, closePage, resetPage, resetPages the same shape; move, split, reload and `closeInstancesOfView` `expected [ 'a1a1a1-shell' ] to deeply equal []`; a terminal the payload does not list `expected [ 'a1a1a1-shell', 'd4d4d4-shell' ] to deeply equal [ 'a1a1a1-shell' ]`; a tab closed before the first sessions payload `expected [] to deeply equal [ 'a1a1a1-shell' ]`; a terminal that ended during the read `expected [ 'a1a1a1-shell', 'b2b2b2-shell' ] to deeply equal [ 'a1a1a1-shell' ]`.

Style (`terminal-style.test.ts`), 14 of 14 red, for example: row title `expected 'vim' to be 'build'`; colour token `expected ... to contain 'var(--c-red)'`; Copy as HTML offered without a selection `expected [ 'copy-html', 'paste', ... ] to not include 'copy-html'`.

Close question (`pages.test.ts`), 12 of 12 red:
- single saved tab acts at once: `expected { ...(2) } to be null`
- busy names the program: `expected 'build may be running a program; ...' to contain 'npm'`
- unread program worded: `expected 'build is running .' to contain 'build may be running a program; ...'`
- unsaved question kept: `expected null to deeply equal { ...(2) }`
- text first: `expected 'build is running npm.' to contain 'notes.md'`
- many-tabs question kept: `expected null to deeply equal { ...(2) }`
- `closeOnce` one read: `Test timed out in 5000ms`
- `closeOnce` key freed after an answer: `expected 3 to be 4`
- `closeOnce` key freed after a rejection: `expected +0 to be 1`
- reset asks once, not per tab: `expected [ ...(3) ] to have a length of 2 but got 3`
- reset acts on a no: `expected 1 to be +0`
- reset asks nothing when none is busy: `expected [ ...(2) ] to have a length of 1 but got 2`

No revert of the order alone turns red for `closeEnded` restating the tab before closing it, because the store's `running` filter also drops an ended terminal. That case is named `audits that closes its tab as before and tries to stop nothing` in `terminal-close.test.ts`. The find-key cases in `terminal.test.ts` that never render are named `audits that ...`.

## Files (line counts after the change)

New: `src/lib/server/machine/pty/edit.ts` 153, `src/lib/state/sessions/terminal/pty-bytes.ts` 85, `src/lib/state/sessions/terminal/pty-io.ts` 85, `src/lib/ui/forms/choice/GlyphDialog.svelte` 64, `src/lib/views/sessions/terminal/RenameField.svelte` 63, `src/lib/views/sessions/terminal/grid/grid-actions.ts`, tests `terminal-edit.test.ts` 420, `terminal-close.test.ts` 336, `terminal-start.test.ts` 359, `terminal-tabs-fixture.ts` 37, `terminal-row.test.ts` 211, `terminal-style.test.ts` 230.

Changed (largest): `terminals.svelte.ts` 876, `terminal-list.ts` 548, `Terminal.svelte` 529, `TerminalList.svelte` 538, `PaneView.svelte` 540, `terminal-tabs.ts` 426, `ui.svelte.ts` 451, `pages.ts` 312, `Pages.svelte` 391, `routes.ts` 556, `sessions.ts` 524, `model-sessions.ts` 658. Also changed: `pane-view.ts`, `ActivityRail.svelte`, `PagesReset.svelte`, `layout.svelte.ts`, `instances.ts`, `opening.ts`, `composer.ts`, `Composer.svelte`, `TerminalRows.svelte`, `TerminalTitle.svelte`, `folds.ts`, `context.ts`, `DESIGN.md`, `HELP.md`, `README.md`, `package.json`, the lock, `config/text/app.yml`, `terminal.yml`, `ui.yml`, and the test files and fixtures that gained `title`, `icon` and `color` on a terminal. Full list: `git status --short` in the worktree (74 entries including regenerated `docs/diagrams`).

## Judgment calls the brief left open

- `tabFolder` walks the shown terminal, then the tab's other terminals, until one has a known folder.
- Split on a terminal that is not in the row makes the row `[that terminal, the new one]`.
- `showingRow` focuses the pressed terminal of the row and keeps the row.
- The strip's New Terminal in a pane with no tab opens an empty Terminal tab first, then starts in it.
- Rename prefills the displayed title; losing focus cancels; Enter saves.
- A row's Clear on a grid that is not mounted clears only the server history.
- The Sessions list row shows the title only, without icon or colour.
- `busyOf` sends at most 64 ids per request and chunks larger sets.
- The icon dialog is a primitive `ui/forms/choice/GlyphDialog.svelte`, since a view-level dialog made `Terminal.svelte` a non-bare view in the tint check.
- `splitState` and `splitRecord` keep their names although Split no longer opens a composer; New with a prompt still uses them.
- A close dialog shows one sentence: the question, a space, then the detail.
- `running(id)` in the terminals store is true before the first sessions payload, so a tab closed early still ends its terminals.

## User-visible changes, before and after

- New Terminal: before, a Terminal tab showing the composer (kind Claude, folder "hub") that started nothing until Start. After, a shell starts at once in the tab's folder; the dropdown beside New offers Shell, Claude, Codex, a rule and "With a Prompt...", and the composer opens only for the last.
- Split: before, opened a composer in the right half and had no bar control. After, it starts a terminal of the same kind and folder at once, and the bar has a Split button.
- Row: before, at most two terminals side by side. After, any number, 80 px minimum each, scrolling sideways.
- Rename, Change Icon, Change Color, Clear, Copy as HTML: none existed. All are in the row and grid menus; Copy as HTML appears only with a selection.
- Closing a tab, pane or page, or resetting a page: before, terminals kept running. After, running terminals end, after one question that names unsaved text first and then each busy terminal with its program.

## Brief errors and impossibilities

- The brief's Split text ("splitState opens a composer") is out of date for the new Split; the comments now say so.
- The `;` escape is documented tmux behaviour, not measured here (see Not done).
- Read-only git commands (`git diff --stat`, `git log`, `git status`) were run early in the work; no other git command was run.

## Repair round 1

### Not done

- Item 10, part two is NOT DONE as worded, because it clashes with a tree rule. The four find-key and link cases in `tests/views/sessions/terminal.test.ts` (`takes VS Code keys in the bar`, `opens from the grid on Cmd+F on macOS`, `moves and closes from the grid while the bar is open`, `never opens a file, a script or an address`) carry the name `audits that ...` again. With the plain names, `tests/checks/tree/audits.test.ts` fails: those four cases never render, and the check requires every non-rendering case under `tests/views` to be named an audit. Their names were plain in the base tree only because that file declared identifiers named `open` and `close` that the check counts as render helpers (`renderNames` of the base file has `open` and `close`, mine does not); the rewrite of the Split composer cases removed them. Restoring the names without those identifiers gave `npm run test:checks` red: `tests/views/sessions/terminal.test.ts :: takes VS Code keys in the bar: Enter goes up, Shift+Enter down, Escape closes` and the other three. Options: (a) keep the four names as they are (current, all checks green); (b) move the four cases to a file outside `tests/views` (for example `tests/state/sessions/terminal/terminal-keys.test.ts`) where they can carry plain names. Recommendation: (b) if the plain names matter; (a) is the cheaper of the two.
- The first run per case is not recorded per case (see item 11 below).
- The Open items list of `orchestrator-state.md` is still: none.

### Ledger

| # | Item | Status | Proof |
| --- | --- | --- | --- |
| 1 | Strip tab of a Terminal tab wears the shown terminal's icon and colour | DONE | `stripMark` (`src/lib/shell/panes/pane-view.ts`), `tabMark`/`tabMarkOf` (`src/lib/state/sessions/terminal/terminal-marks.ts`), store `tabMark` (`terminals.svelte.ts`), `Tab.tint` drawn by `TabFace.svelte`; tests in `tests/shell/panes/strip-mark.test.ts`, `tests/state/sessions/terminal/terminal-marks.test.ts`, `tests/state/client/terminal-tabs.test.ts` (describe "the strip mark the store gives a tab"), `tests/ui/primitives.test.ts` |
| 2 | Pane target is the pane's ACTIVE Terminal tab, else a new tab | DONE | `paneTab` in `src/lib/state/client/context.ts` returns the active tab only; test "opens a new Terminal tab in that pane and leaves the Terminal tab behind unchanged" in `terminal-start.test.ts` |
| 3 | Eight colour names declared once | DONE | `TERMINAL_COLORS` and `TerminalColor` in `src/lib/data/model/model-sessions.ts`, re-exported by `src/lib/data/model/index.ts`, imported by `server/machine/pty/edit.ts` and `terminal-marks.ts`; `COLOR_TOKENS` is `Record<TerminalColor, string>`; the equality audit is deleted; `sessions.ts` no longer declares the list |
| 4 | Row widths leave the handles out | DONE | `rowWidths(shares, pane, handles)` and `resizedShares(..., handles)` in `terminal-tabs.ts`; `Terminal.svelte` passes `(row.length - 1) * SASH_PX`; test "leaves the pixels of the handles between the terminals out of the widths" in `terminal-row.test.ts` |
| 5 | Clear empties the screen and the history | DONE | `clearTerminal` in `edit.ts` runs `send-keys -R -t <session>` then `clear-history -t <session>`; test "resets that terminal's screen and then clears its history, and nothing else" in `terminal-edit.test.ts`; DESIGN.md Rename/Clear sentence and the Clear row of `vscode-parity.md` say so; HELP.md's Clear text names no history behaviour and is unchanged |
| 6 | Composer start recorded in `started` | DONE | `composeTerminal` in `terminals.svelte.ts` records the answered terminal; test "is ended when its tab closes before any sessions message lists it" in `terminal-start.test.ts` |
| 7 | Empty hub root refuses on the bar | DONE | `portfolioHeard` on the workbench, `hubReady`/`releaseHubWaiters`/`startInTab` in `terminals.svelte.ts`, catalog key `sessions.terminal_no_folder` ("No folder to start the terminal in") in `config/text/views/sessions/terminal.yml`; test "says a refusal on the bar and posts nothing, for a press made before and after" |
| 8 | `busy` required in `resetAfterAsking` | DONE | `src/lib/state/workbench/navigation/pages.ts` has no default; the two test callers in `tests/state/workbench/layout/pages.test.ts` pass it; a caller that omits it is a type error (`npm run check`: 0 errors). No runtime test: the guarantee is the type |
| 9 | `TerminalList.svelte` comments describe a row of any number | DONE | head comment, the `Split`, `Unsplit`, `Join` sentences and the `current` prop comment rewritten; `grep -rn "half\|halves" src/lib/views/sessions src/lib/state/sessions` prints nothing |
| 10 | Test names | PARTLY DONE | The five style cases (`empties the grid...`, `writes the serialised selection...`, `says a failure when the clipboard refuses`, `says a failure when there is no ClipboardItem...`, `is offered on the grid menu only while...`) are ordinary tests. A test outside `tests/views` cannot be flagged by the audit rule, so they moved to `tests/state/sessions/terminal/grid-actions.test.ts` (they assert over pure functions and never render). The four find-key/link cases: see Not done |
| 11 | Report corrections | DONE, first run per case NOT RECORDED | below |

### Red once, round 1

Each revert was applied to the source alone, the named test run with `-t`, and the source restored. Result, test, failing assertion:

```
strip-mark: draws the icon and the colour token of the mark            expected { glyph: 'terminal_glyph' } to deeply equal { glyph: 'refresh', tint: '--c-red' }
strip-mark: keeps the view glyph when the mark names a colour only     expected { glyph: '', tint: '--c-red' } to deeply equal { glyph: 'terminal_glyph', ... }
strip-mark: keeps the view glyph ... for a tab with no mark            expected { glyph: 'refresh', tint: undefined } to deeply equal { glyph: 'file_glyph' }
terminal-marks: icon and the colour token of a terminal that has both  expected { glyph: 'refresh' } to deeply equal { glyph: 'refresh', token: '--c-red' }
terminal-marks: no glyph and no token for a terminal with neither      expected { glyph: 'terminal_shell' } to deeply equal {}
terminal-marks: no glyph for an icon the vocabulary does not hold      expected { glyph: 'no_such_glyph' } to deeply equal {}
terminal-marks: empty for a tab that shows no terminal                 expected { token: '--c-red' } to deeply equal {}
terminal-marks: given to a Terminal tab and to no other view           expected { glyph: 'refresh', token: '--c-red' } to deeply equal {}
terminal-marks: maps the eight names to their tokens                   expected '--c-yellow' to be '--c-gold'
client store: mark of the terminal the tab shows                       expected { glyph: 'refresh', token: '--c-red' } to deeply equal {}
client store: unlisted terminal                                        expected { glyph: 'refresh', token: '--c-red' } to deeply equal {}
client store: no terminal shown                                        expected { token: '--c-red' } to deeply equal {}
client store: another view                                             expected { glyph: 'refresh', token: '--c-red' } to deeply equal {}
primitives: draws a tab glyph in the token its tab names               expected '<div class="tab svelte-vtu1v5 current...' to contain 'style="color: var(--c-red)"'
2 pane active tab only (terminal-start)                                expected [ 'a1a1a1-shell', '000001-shell' ] to deeply equal [ 'a1a1a1-shell' ]
4 handles (terminal-row)                                               expected 900 to be close to 894, received difference is 6, but expected 5e-7
5 clear (terminal-edit)                                                expected [ [ 'clear-history', '-t', ... ] ] to deeply equal [ ...(2) ]
6 composer start (terminal-start)                                      expected [ 'a1a1a1-shell' ] to deeply equal [ 'a1a1a1-shell', 'f0f0f0-shell' ]
7 empty hub, wait forever (terminal-start)                             Error: Test timed out in 5000ms.
7 empty hub, no sentence (terminal-start)                              expected '' to be 'No folder to start the terminal in'
grid-actions: clear grid then history                                  expected [ 'history a1a1a1-shell' ] to deeply equal [ 'grid', 'history a1a1a1-shell' ]
grid-actions: server refusal                                           expected '' to be 'not listed' // Object.is equality
grid-actions: text/html and text/plain                                 expected [ 'text/html' ] to deeply equal [ 'text/html', 'text/plain' ]
grid-actions: clipboard refuses                                        expected '' not to be '' // Object.is equality
grid-actions: no ClipboardItem or clipboard                            expected 2 to be +0 // Object.is equality
grid-actions: menu offers Copy as HTML only over a selection           expected [ 'copy', 'copy-html', 'paste', ... ] to not include 'copy-html'
```

Item 3 has no runtime test; its proof is a type error. With `white: '--ink'` deleted from `COLOR_TOKENS`, `npx svelte-check --threshold error` printed `ERROR "src/lib/state/sessions/terminal/terminal-marks.ts" 13:7 "Property 'white' is missing in type ... but required in type 'Record<"black" | ...'"`, and printed 0 errors with it restored. Item 8 is likewise a type. Item 9 is comments.

### Checks

`npm run diagrams` exited 0, then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` exited 0:

```
$ npm test
 Test Files  345 passed | 19 skipped (364)
      Tests  5237 passed | 557 skipped (5794)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  360 passed | 9 skipped (369)
$ npm run check
1790756172975 COMPLETED 2358 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
built in 3.69s / built in 9.14s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

`sh utils/folder-check.sh` and `sh utils/size-check.sh` exit 0; the ASCII scan over `src tests config` prints nothing; the Z40 grep prints nothing. `PaneView.svelte` is 540 lines and `terminals.svelte.ts` 892.

### Item 11: report corrections

- Paths outside the brief's list, and why: `src/lib/ui/forms/choice/GlyphDialog.svelte` (the icon picker is a `ui` primitive; a view-level dialog made `Terminal.svelte` a non-bare view for the tint check), `src/lib/state/workbench/layout/open/opening.ts` (new `openInPane`, which the strip's New Terminal needs to open a tab in a given pane), `tests/ui/frame/floating-bar.test.ts` (its source path for `FindBar.svelte` moved to `terminal/grid/FindBar.svelte`, because the terminal folder held ten items and the grid files moved into a `grid/` folder), `tests/views/whole/type-scale.test.ts` (the moved grid paths, `RenameField.svelte`, and `GlyphDialog.svelte` in the pass-through list). Also outside the list and new in this round: `src/lib/state/sessions/terminal/terminal-marks.ts`, `src/lib/data/model/index.ts` and `model-sessions.ts` (the colour tuple), `src/lib/ui/tabs/tab-strip.ts` and `TabFace.svelte` (the tint), `tests/shell/panes/strip-mark.test.ts`, `tests/state/sessions/terminal/terminal-marks.test.ts`, `tests/state/sessions/terminal/grid-actions.test.ts`.
- Narrowed predicate: `tests/ui/menu/menu-words.test.ts:120-124` asserted that the submenu labels of a terminal row menu equal `[TERMINAL]`. The row menu now also holds the Change Icon and Change Color submenus, whose labels are stand-in words starting with `@`; the assertion filters those out (`.filter((label) => !label.startsWith('@'))`) and so checks only that Join Terminals lists the terminal by its own name. It no longer proves that no other submenu exists.
- Brief premise: the brief placed the strip's New Terminal wiring in `Workbench.svelte`; it was wired from `PaneView.svelte:96` (`terminals: { newTerminalIn }`), through `stripPicked` in `pane-view.ts`.
- Case 23, the trailing `;`: settled by the reviewer's tmux probe (the argument `build\;` reads back as `build;`). It leaves the Not done list of the first report; no tmux was run by me.
- First run per case: I did not record the first run per case. What was recorded before the build is the total (70 of 99 failed, 29 passed; `terminal-style.test.ts` failed to load) and the grouping of the 29 passes (19 pure-rule cases in `pages.test.ts`, 5 refusal cases in `terminal-edit.test.ts`, 5 regression cases in `terminal-close.test.ts`). A per-case table cannot be produced now without the unchanged tree, and the per-case results of the 40 cases are therefore not given.

### Before and after, user-visible

| Change | Before | After |
| --- | --- | --- |
| `n` key and the Sessions view's New | The composer opened in the page's Terminal tab with the hub root as its folder | The composer opens in the page's Terminal tab with that tab's folder (the shown terminal's folder, else the first terminal's, else the hub root) |
| Bar title's glyph | The bar title drew the terminal's name only, with a bell mark while it rang | It draws the terminal's mark first: its icon (else its kind's glyph) in its colour |
| Sessions row showing a set title | The row showed the terminal's name | It shows the title the reader gave it, else the name |
| Strip's New Terminal | Started in the page's active Terminal tab, wherever the menu was opened | Starts a shell at once in the pane it was picked on: that pane's active Terminal tab, else a new Terminal tab opened in that pane |
| Close question's words | A close of one tab asked only about unsaved text; terminals kept running | One question, in the words "End the programs still running in these terminals?" for busy terminals, "{0} is running {1}." per busy terminal, "{0} may be running a program; it could not be read." when the program is unknown, and "Unsaved changes in {0}." first when text is unsaved; a tab holding nothing unsaved and nothing busy closes at once |
| Press on a row's terminal | Showed that terminal alone in the tab, and the tab's label was the terminal's name | A terminal of the row the tab draws becomes the focused one and the row stays; any other terminal is shown alone. The tab's label follows the shown terminal's title, else its name |
