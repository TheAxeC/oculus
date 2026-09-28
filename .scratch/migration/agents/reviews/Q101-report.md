Everything in the brief is built, but the verify list is not green: `checks.sh` stops at `npm test` with 3 failing tests, none of them in code this step changes (named under "Verify"); the five commands after it, run one by one, exit 0.

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- None.

## The cases' first run (unchanged tree, before any code change)

`Test Files  6 failed | 2 passed (8)`, `Tests  15 failed | 116 passed (131)`. Failing: the whole of `tests/state/sessions/terminal-tabs.test.ts` (module missing), the whole of `tests/state/client/terminal-tabs.test.ts` and `tests/shell/keys/workbench-keys.test.ts` (`showTerminal`, `moveTerminal`, `composeIn` missing), `composer.test.ts` "keeps the tab's other choices when a Split writes into a tab that holds a record", `repositories.test.ts` "asks for a shell in the worktree it just made, and shows the terminal" and "asks for a shell in a worktree that is already there", and in `tests/views/sessions/terminal.test.ts` the steer-box, one-terminal, list, split and tab-rows cases. The hand-back that followed produced the ruling at the end of this report.

## What was built

| Item | State | Where | Proved by |
|---|---|---|---|
| 1. A tab's own state | DONE | `src/lib/state/sessions/terminal/terminal-tabs.ts:28` (shape with `id`), `:107` readTab, `:134` ownerOf, `:146` withTerminal, `:168` withoutTerminal, `:190` reordered, `:203` splitWith, `:209` showingOne, `:224` splitAt, `:233` composingIn, `:243` withStarted, `:275` splitDrawn, `:284` pageTarget | `npx vitest run tests/state/sessions/terminal/terminal-tabs.test.ts` (part of `npm test` below) |
| 2. The store keeps ownership | DONE | `src/lib/state/sessions/terminals.svelte.ts:316` closeEnded, `:329` afterReceive, `:365` showTerminal, `:395` moveTerminal, `:419` composeIn; wiring `src/lib/state/client/context.ts:169-188`; `pinnedTerminal` gone from `selection.svelte.ts` | `tests/state/client/terminal-tabs.test.ts`; verify 2 grep prints nothing |
| 3. The Terminal view | DONE | `Terminal.svelte` (292 lines: body, split with `Sash`, bar without pin, row drop on the body), `TerminalGrid.svelte` (258 lines, new: xterm mount, pty, resize, bell, paste, file drop, theme and size), `TerminalList.svelte:109` show, `:115` split, `:168-204` drag and cross-tab move, `terminal-list.ts:22` ROW_DRAG, `:28` gridFontSize, `:42` tabRows | `tests/views/sessions/terminal.test.ts`, `tests/views/sessions/sessions.test.ts`; `wc -l src/lib/views/sessions/terminal/*.svelte` all under 600 |
| 4. Every start through `showTerminal` | DONE | `UpdateTray.svelte:92`, `:106`; `SessionDetail.svelte:206`; `DatasetCard.svelte:56`; `ProjectCard.svelte:273`; `Latex.svelte:90`; `SessionList.svelte:159`, `:170` (resume, fork), `:125` New, `:132` own pane; `TerminalRows.svelte:56`; `repositories.svelte.ts:222`; `workbench-keys.svelte.ts:176-182` (n key); `CardSessions.svelte:27-33` without `'terminal'` | client test "opens no second Terminal tab when the page has one", `repositories.test.ts:518`, `:533`, `workbench-keys.test.ts:381`, `:396` |
| 5. Docs | DONE | `DESIGN.md:266`, `:273` (tab ownership paragraph), `:208` (views example); `HELP.md:121`, `:123`, n-key row; head comments of every changed file; `docs/diagrams/*` regenerated | `npm run diagrams` exited 0 |

## Verify

1. `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md </dev/null`, run once at the end, exit 1. Every line it printed:

```
$ npm test

> oculus@0.0.1 test
> vitest run --tagsFilter '!slow'


 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q101/tools/oculus

 ❯ tests/views/whole/type-scale.test.ts (238 tests | 1 failed) 97ms
     × sets every local role in personal/calendar/Calendar.svelte 4ms
 ❯ tests/checks/source/comment-width.test.ts (2 tests | 1 failed) 681ms
     × ends by the hundredth column everywhere under src, tests and bin 680ms
warning: You appear to have cloned an empty repository.
Rebasing (1/1)error: could not apply e006604... Main
hint: Resolve all conflicts manually, mark them as resolved with
hint: "git add/rm <conflicted_files>", then run "git rebase --continue".
hint: You can instead skip this commit: run "git rebase --skip".
hint: To abort and get back to the state before "git rebase", run "git rebase --abort".
hint: Disable this message with "git config set advice.mergeConflict false"
Could not apply e006604... Main
Rebasing (1/1)error: could not apply 82ec3e1... Main
hint: Resolve all conflicts manually, mark them as resolved with
hint: "git add/rm <conflicted_files>", then run "git rebase --continue".
hint: You can instead skip this commit: run "git rebase --skip".
hint: To abort and get back to the state before "git rebase", run "git rebase --abort".
hint: Disable this message with "git config set advice.mergeConflict false"
Could not apply 82ec3e1... Main
 ❯ tests/server/core/git.test.ts (42 tests | 1 failed | 1 skipped) 32198ms
     × caps the branch list 6826ms
To /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-deposit-test-DtzAxD/remote/alpha-code.git
 * [new branch]      HEAD -> main
Rebasing (1/1)error: could not apply d1a61c4... Main
hint: Resolve all conflicts manually, mark them as resolved with
hint: "git add/rm <conflicted_files>", then run "git rebase --continue".
hint: You can instead skip this commit: run "git rebase --skip".
hint: To abort and get back to the state before "git rebase", run "git rebase --abort".
hint: Disable this message with "git config set advice.mergeConflict false"
Could not apply d1a61c4... Main

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 3 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/checks/source/comment-width.test.ts > a comment line > ends by the hundredth column everywhere under src, tests and bin
AssertionError: expected [ …(3) ] to deeply equal []

- Expected
+ Received

- []
+ [
+   "src/lib/views/personal/calendar/Calendar.svelte:355",
+   "tests/views/whole/tinted.test.ts:13",
+   "tests/views/whole/tinted.test.ts:44",
+ ]

 ❯ tests/checks/source/comment-width.test.ts:63:23
     61|             )
     62|         );
     63|         expect(found).toEqual([]);
       |                       ^
     64|     });
     65|

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/3]⎯

 FAIL  tests/server/core/git.test.ts > the log, the branches and the worktrees > caps the branch list
Error: Test timed out in 5000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ❯ tests/server/core/git.test.ts:449:5
    447|     });
    448|
    449|     it('caps the branch list', () => {
       |     ^
    450|         // The cap is the change lists', so one repository with a thou…
    451|         // the payload. Three past it is enough to see the cut. The br…

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/3]⎯

 FAIL  tests/views/whole/type-scale.test.ts > the view type scale > sets every local role in personal/calendar/Calendar.svelte
AssertionError: expected '.period=fs-md | footer=fs-sm | .grid …' to be '.period=fs-md | footer=fs-sm | .grid …' // Object.is equality

Expected: ".period=fs-md | footer=fs-sm | .grid :global(.ec)=fs-sm"
Received: ".period=fs-md | footer=fs-sm | .grid :global(.ec)=fs-sm | .grid :global(.ec-list .ec-event-title)=fs-sm | .grid :global(.ec-list .ec-event-title)=fs-sm"

 ❯ tests/views/whole/type-scale.test.ts:337:49
    335|     for (const [file, expected] of Object.entries(VIEWS)) {
    336|         it(`sets every local role in ${file}`, () => {
    337|             expect(typeRules(join(ROOT, file))).toBe(expected);
       |                                                 ^
    338|         });
    339|     }

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/3]⎯


 Test Files  3 failed | 345 passed (348)
      Tests  3 failed | 5599 passed | 1 skipped (5603)
   Start at  00:49:25
   Duration  98.95s (transform 17.36s, setup 0ms, import 94.60s, tests 267.68s, environment 75ms)

checks: failed with exit 1: npm test
```

The three failures, one line each:
- comment-width: the long lines are `Calendar.svelte:355` and `tinted.test.ts:13`, `:44`, files this step does not change (`diff -q` of each against the main checkout prints nothing).
- type-scale, Calendar entry: `Calendar.svelte` is identical to main's; this step's change to `type-scale.test.ts` touches only the Terminal lines (`diff` against main's copy prints only lines 190-191, `Terminal.svelte` and `TerminalGrid.svelte`).
- git.test.ts "caps the branch list": a timeout in a file this step does not change; `npx vitest run tests/server/core/git.test.ts` alone gives `Tests  42 passed (42)`.

Because `checks.sh` stops at the first failure, the other five commands of the list were run one by one from the same directory, each through `bash -o pipefail -c`: `npm run check` exit 0 (`COMPLETED 1486 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`), `npm run build` exit 0, `npm run format:check` exit 0 (`All matched files use Prettier code style!`), `npm run lint` exit 0, `! LC_ALL=C grep -rna '[^ -~]' src tests` exit 0.

2. `grep -rn "followsSelection\|composerTarget\|composerState\|pinnedTerminal\|storedOrder\|withOrder" src tests` prints nothing (exit 1).
3. `wc -l src/lib/views/sessions/terminal/*.svelte`: AttachPicker 152, Composer 423, Terminal 292, TerminalGrid 258, TerminalList 389, TerminalTitle 61.
4. `npm run diagrams` exited 0.
5. `bash bin/folder-check.sh` exits 0; `src/lib/state/sessions` holds 10 items.

## Files, line counts before and after

"Before" is the main checkout's copy (no git command may be run, so the base commit 3d4f9bd4 was not read; for `Terminal.svelte` 497 and `TerminalList.svelte` 367 the brief's own counts agree). Q79d shares `TerminalRows.svelte`, `DESIGN.md` and `docs/diagrams`.

| File | Before | After |
|---|---|---|
| src/lib/state/sessions/terminal/terminal-tabs.ts | new | 291 |
| src/lib/state/sessions/terminal/composer.ts (moved from state/sessions/composer.ts) | 297 | 310 |
| src/lib/state/sessions/terminals.svelte.ts | 664 | 708 |
| src/lib/state/client/context.ts | 322 | 330 |
| src/lib/state/workbench/selection.svelte.ts | 63 | 58 |
| src/lib/state/sources/repositories/repositories.svelte.ts | 359 | 362 |
| src/lib/shell/keys/workbench-keys.svelte.ts | 447 | 456 |
| src/lib/shell/rail/UpdateTray.svelte | 263 | 258 |
| src/lib/views/sessions/terminal/Terminal.svelte | 497 | 292 |
| src/lib/views/sessions/terminal/TerminalGrid.svelte | new | 258 |
| src/lib/views/sessions/terminal/TerminalList.svelte | 367 | 389 |
| src/lib/views/sessions/terminal/terminal-list.ts | 151 | 146 |
| src/lib/views/sessions/terminal/Composer.svelte | 423 | 423 |
| src/lib/views/sessions/session-list/SessionList.svelte | 325 | 321 |
| src/lib/views/sessions/session-list/TerminalRows.svelte | 192 | 204 |
| src/lib/views/sessions/session-list/Customizations.svelte | 247 | 247 |
| src/lib/views/sessions/session-detail/SessionDetail.svelte | 491 | 485 |
| src/lib/views/shared/card/CardSessions.svelte | 134 | 133 |
| src/lib/views/shared/card/ProjectCard.svelte | 476 | 475 |
| src/lib/views/shared/sessions/SteerBox.svelte | 171 | 171 |
| src/lib/views/sources/data/DatasetCard.svelte | 192 | 186 |
| src/lib/views/boards/project/Latex.svelte | 242 | 240 |
| config/text/views/sessions/composer.yml | 36 | 35 |
| config/text/views/sessions/terminal.yml | 31 | 31 |
| config/text/views/sessions/session-list.yml | 68 | 67 |
| DESIGN.md | 322 | 322 |
| HELP.md | 294 | 294 |
| docs/diagrams/* (rerun) | | |
| tests/state/sessions/terminal/terminal-tabs.test.ts | new | 278 |
| tests/state/sessions/terminal/composer.test.ts (moved) | 381 | 381 |
| tests/state/client/terminal-tabs.test.ts | 139 | 288 |
| tests/state/sessions/terminals.test.ts | 508 | 445 |
| tests/state/workbench/selection.test.ts | 59 | 51 |
| tests/shell/keys/workbench-keys.test.ts | 401 | 405 |
| tests/state/sources/repositories/repositories.test.ts | 816 | 824 |
| tests/views/sessions/terminal.test.ts | 399 | 456 |
| tests/views/sessions/sessions.test.ts | 639 | 621 |
| tests/views/whole/type-scale.test.ts | 347 | 348 |
| tests/checks/config/config-folder.test.ts (import line) | 681 | 681 |

Paths beyond the brief and the ruling's widening: `tests/views/sessions/sessions.test.ts` and `tests/views/whole/type-scale.test.ts` (tests of the changed views, whose Terminal cases and font-rule list changed with them), `config/text/views/sessions/session-list.yml` (`pin_glyph`, left unread by the pin control's removal) and `HELP.md`'s session-list row (its press now shows the terminal in its tab). `session-list.ts` and `tests/state/client/selectors.test.ts` needed no change.

## Judgment calls

- The tab's `id` (ruling 2) is part of `TerminalTabState`; `readTab` gives a state without one a fresh `crypto.randomUUID()`, so every reader gets an identity even from a saved state that predates it.
- `showTerminal(id, label?)` takes an optional label, used by the Repositories shell so the new tab is named after the package until the terminal's own name arrives, as the pinned tab was.
- The shell may import only `state/sessions/terminals`, not the `terminal/` subfolder (the boundaries test), so `terminals.svelte.ts` re-exports `TERMINAL_VIEW`, `composingIn`, `emptyTab`, `isTerminalId`, `pageTarget` and `readTab` for `workbench-keys.svelte.ts`.
- `splitState(folder, agent, held?)` keeps the accounts and picks of the tab's composer record and the rest of its state when Split writes into a tab that already holds a record; before, Split opened a new tab, so there was nothing to keep.
- The wiring's `restate(id, page, state)` ignores `page`, since `restateInstance` finds an instance by id across pages.
- New in an unsplit tab appends the started terminal at the end (ruling 3).
- A row dropped on another tab's body, when that tab draws no list, joins at the end (brief decision 7); a drop below the rows of a list also joins at the end.
- `withShare` keeps the share between 0.1 and 0.9 so neither half can be dragged away.
- A terminal selected in the rail but owned by no tab is still held from closing on the first `sessions` message, as a tab-owned one is, so a start that selects and then shows it is not read as ended.
- The start sites in components are covered by the store case (ruling 5): no view test file for UpdateTray, SessionDetail, DatasetCard, ProjectCard, Latex or SessionList's resume and fork had a source-read test before, so none was added; the client test "opens no second Terminal tab when the page has one, however many terminals start" and "hands a terminal no tab owns to the active Terminal tab..." carry their store half, and `repositories.test.ts:518`, `:533` the Repositories shell.

## Reader-visible changes (Sessions page, Terminal view; to look at on TEST)

- **Two Terminal tabs on one page, each with terminals of its own.** Before: every Terminal tab listed every terminal of the machine, in one page-wide order, and a tab either followed the rail selection or was pinned to one terminal. After: each tab lists only the terminals it owns, in its own order; a tab showing its only terminal names it on the bar; no pin control.
- **New in a tab.** Before: `new terminal` opened another Terminal tab with a composer. After: the composer shows in this tab (in the right half when the tab is split); the terminal it starts joins this tab at the end and is shown (in a split, it becomes the right half).
- **Split on a row.** Before: opened a second Terminal tab beside, with the composer in the row's folder. After: the same tab divides, the row's terminal on the left and the composer on the right in the row's folder and kind, with a handle between them (drag moves the share, double click resets it); what it starts becomes the right half; both rows are marked current; a press on a row outside the split shows it alone.
- **A row dragged to the other tab's list, and to a tab with one terminal.** Before: a row dropped only within its own list, reordering the page-wide order. After: dropped on the other tab's list it moves there at the drop mark and is shown; dropped on the body of a tab showing one terminal (no list drawn) it joins the end of that tab; the tab it left closes when it owns nothing more.
- **`exit` in the last terminal of a tab.** Before: the ended terminal's row left the machine-wide list and the store closed the tabs that showed it (the following-tab bookkeeping this step removes; the exact old closing rule was not re-read for this report). After: the row leaves the tab and the tab closes, on any page; with other terminals left, the next row is shown, else the previous.
- **Closing a tab, then pressing its terminal in the Sessions view.** Before: closing a pinned tab left the terminal running; pressing it selected it and a following tab showed it. After: closing leaves the terminals running and listed in the Sessions view; a press selects it and takes it into the Terminal tab of the page on screen (the active one of the focused pane, else the first, else a new one) and shows it.
- **An update task from the tray.** Before: selected the task's terminal and opened a Terminal tab when the page had none, which followed the selection. After: the terminal is taken into the page's Terminal tab (or a new one) and shown there; no second tab opens.
- **A reload with an old saved Terminal tab.** Before: `{ session, label }` was a pinned tab, `{ id }` a composer tab, anything else followed the selection. After: a pinned tab reads as a tab owning that terminal and showing it; a composer or following tab reads as a tab owning nothing, showing the composer.

## For each new or changed test, the code change whose undoing turns it red

- `tests/state/sessions/terminal/terminal-tabs.test.ts`: each case is red without its function in `terminal-tabs.ts`: reading old shapes (the `session` branch and the `terminals` filtering of `readTab`), the id case (`freshId` in `readTab`), ownership (`ownerOf`), leaving (`withoutTerminal`'s next-else-previous and split rules), joining (`withTerminal`'s clamp and de-duplication), `reordered`, `splitWith` and `showingOne`, `showingRow`'s split-keeping, `splitDrawn`, New and Split (`composingIn`, `splitAt`, `withStarted`'s insert-after-shown), the label (`withLabel`), and the page target (`pageTarget`).
- `tests/state/client/terminal-tabs.test.ts`: move cases red without `moveTerminal` (and its closing of the emptied tab); ended cases red without `closeEnded` taking ended ids out of every tab and clearing the selection, and without the `held` list in `afterReceive`; show cases red without `showTerminal`'s owner branch (page switch, activate, `showingRow`) and its `pageTab` fallback to the active, first, or a new tab; the close case red if closing a tab stopped its terminals or if `afterReceive` took unowned terminals into a tab; New cases red without `composeIn`.
- `tests/views/sessions/terminal.test.ts`: steer-box cases red without `TerminalGrid.svelte`'s `agent` condition and with the old follow-the-selection read; list cases red without `tabRows` filtering to `tab.terminals` and with the pin control back on the bar; split cases red without the `splitDrawn` branch of `Terminal.svelte` and the `current` pair; "draws the composer alone after New" red without `composingIn`'s unsplit branch; the Sessions-view case red with `'terminal'` or an ownership filter in the Sessions list; the tab-rows audit red without `tabRows`.
- `tests/views/sessions/sessions.test.ts`: the Terminal cases red with the pin control back, or with `readTab` reading an old `{ session }` or `{ id }` differently.
- `tests/state/sessions/terminal/composer.test.ts`, "keeps the tab's other choices when a Split writes into a tab that holds a record": red without the `held` argument of `splitState`.
- `tests/shell/keys/workbench-keys.test.ts`, the n-key cases: red without `newSession` using `pageTarget` and `composingIn` (and opening `emptyTab` when the page has none).
- `tests/state/sources/repositories/repositories.test.ts:518`, `:533`: red without `shellIn` calling `terminals.showTerminal(answer.id, label)`.
- `tests/state/sessions/terminals.test.ts`, `tests/state/workbench/selection.test.ts`: only removals (the following-tab and `pinnedTerminal` cases went with the code).
- `tests/views/whole/type-scale.test.ts`: red if `Terminal.svelte` gains a font rule or `TerminalGrid.svelte` one not listed.

## The ruling (Q101-cases.md, verbatim)

# Q101 cases ruling (round 0, 2026-09-29)

The builder handed back before any code change, with the cases' first run (`Test Files 6 failed | 2 passed (8)`, `Tests 15 failed | 116 passed (131)`) and three points the brief gets wrong. Each was checked on the tree: `ls src/lib/state/sessions | wc -l` gives 10 and `tests/state/sessions` holds 10 items before the new test; `stateId` (`state/workbench/layout/instance.ts:92`) is read by `openView` at `open/opening.ts:97-99` to activate an existing tab; `views/shared/card/CardSessions.svelte:27-34` lists `'terminal'` among the views that follow the selected session.

1. **The folder limit: (A).** `src/lib/state/sessions/terminal/` holds `composer.ts` (moved) and `terminal-tabs.ts` (new); `tests/state/sessions/terminal/` holds `composer.test.ts` (moved) and `terminal-tabs.test.ts`. The paths widen to the importers of `sessions/composer`: `views/shared/sessions/SteerBox.svelte`, `views/sessions/session-list/Customizations.svelte`, `views/sessions/terminal/Composer.svelte` and `tests/checks/config/config-folder.test.ts` (import lines only), plus `DESIGN.md`'s boundary lines or text naming `state/sessions/composer` if any, and `docs/diagrams`. The lazy option was (B), the pure rules folded into the store.
2. **The tab's identity: add `id: string`** to the state shape, a random UUID when a tab is opened; an old saved state keeps its own `id` when it has one, and one without gets a fresh one when read. `openView` then opens a new tab for each new state.
3. **New and Split: (a).** New in an unsplit tab sets `shown` to null and `composing`, so the composer shows alone, and what it starts joins at the end of the tab's order and is shown. New in a split tab keeps both halves with the composer in the right half; what it starts is inserted after `shown` and becomes `beside`. Split on a row is `shown` = that row with `composing`. The split is drawn when `shown !== null && (beside !== null || composing)`. The brief's "joins this tab after the shown one" for New in an unsplit tab is replaced by "joins at the end", as VS Code's New Terminal appends.
4. **`CardSessions.svelte` widens the path list:** `'terminal'` leaves `SESSION_VIEWS`, since the Terminal view no longer follows the selection; its test, if one reads the list, changes with it.
5. **The start sites in components** (the update tray, SessionList resume and fork, SessionDetail, DatasetCard, ProjectCard, Latex): their store half is tested in the client test as the builder describes; each component's call is checked by a source read in the view tests only where that file already has such a test, and otherwise named in the report as covered by the store case.

The report carries this ruling.
