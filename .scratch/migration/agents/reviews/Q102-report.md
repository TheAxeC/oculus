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
