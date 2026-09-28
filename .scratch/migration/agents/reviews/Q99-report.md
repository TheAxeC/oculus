# Q99 report

Everything in the brief and in the round 0 ruling (`briefs/Q99-cases.md`) is built. Not done: the verify script did not end with `verify: 6 commands passed`. Its `npm test` went RED on two 5 s timeouts, both in test files this step does not touch (`tests/checks/imports/order.test.ts` and `tests/server/core/git.test.ts`). The script stops at the first red, so the other commands of the list were run by hand, each read by its own exit, and each passed (the verification section below). Two things went beyond the brief's text: a premise found wrong (one `send-keys -H` carries at most 996 bytes, not 4096) and one widening of the paths (three server files outside the brief's list). Both are set out below as decisions the orchestrator may reverse.

## Open items of the state file (verbatim, from the main checkout's `orchestrator-state.md`, lines 118-122)

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- None.

## The rulings this report carries (round 0, `briefs/Q99-cases.md`)

1. Screen on attach: the whole capture without its final newline, CR LF kept, then `ESC[<cursor_y+1>;<cursor_x+1>H`. The cursor lands on tmux's row only when the page's grid and tmux's pane are the same height, which holds once the page's resize has reached tmux.
2. When the selected terminal ends, only following tabs with no identity of their own close (`followsSelection(state)` and no identity). A composer tab stays, and the selection is still cleared.
3. A failed `list-sessions` keeps the last list. The one exception is tmux saying `no server running on`, or `error connecting to ... (No such file or directory)`, which gives the empty list.
4. The brief's byte-for-byte case stays as an order check. The one-read case is the proof of item 1; it is skipped with a printed reason where `python3` is absent (`tests/server/machine/pty/channel.test.ts`, the `PYTHON` probe).
5. The Pages row calling `switchPage` when pressed cannot be run without a DOM. The test checks that the row renders its press, and the press itself is seen at the landing look.

## First run of the cases (unchanged tree, before any code change)

Command: `npx vitest run <file>` per file, from the worktree's `tools/oculus`.

| Case | Test | First run |
|---|---|---|
| inputChunks cases (mouse report, `ls -la\r`, 5000 `a`, e-acute at the cut, CSI at the cut, OSC to BEL, plus SS3, `ESC \`, `ESC x`, a sequence longer than a piece, empty) | tmux.test.ts "the input pieces" | red, `inputChunks is not a function` (9 cases) |
| `ls -la\r` runs in a real scratch `sh`; the dash line through the new path | sessions.test.ts | red, `inputChunks is not a function` |
| sendBytesArgs('t1', ESC[I) | sessions.test.ts | red, `sendBytesArgs is not a function` |
| steerArgs and interruptTerminal unchanged | sessions.test.ts | green |
| Channel input byte for byte into a raw pane | channel.test.ts | green on the unchanged tree (ruling 4) |
| A mouse report in one read(2) | channel.test.ts | red: `['1b', '5b3c303b32303b31344d']` |
| Channel input as one `send-keys -H` | channel.test.ts | red, old two-command split |
| Ended ids (4 brief cases and a dedupe case) | terminals.test.ts | red, `endedTerminals is not a function` |
| Tabs closing: pinned on a hidden page, following plus selection cleared, first message | terminal-tabs.test.ts | red |
| Tabs staying: still listed, started here and not yet listed, message with no list | terminal-tabs.test.ts | green (nothing closed on the unchanged tree) |
| Composer tab stays | terminal-tabs.test.ts | red on the selection clear |
| screenAt, cursorArgs, attach cases | sessions.test.ts, channel.test.ts | red |
| History case `8 20 24` | sessions.test.ts | red; the brief's rule would have kept it red (ruling 1) |
| Pages rows | pages.test.ts | red, all six |

## What to build

| Item | State | Where | Proof |
|---|---|---|---|
| 1. Input sent as its bytes | DONE | `tmux.ts` `inputChunks`, `INPUT_MOST` (the old key map removed); `sessions.ts` `sendBytesArgs`; `channel.ts` `#input` | `npx vitest run tests/server/machine/pty` gives 6 files and 77 tests passed, the real-tmux cases included. `grep -rn "splitKeys\|keyName" src tests` prints nothing (exit 1). |
| 2. A tab closes when its terminal ends | DONE | `terminals.svelte.ts` `endedTerminals`, `createTerminals(…, workbench)`, `closeEnded`; `context.ts` wiring; `channel.ts` `refresh` and `noServer`; the payload carries no list before the first read (see decision B) | `npx vitest run tests/state/client tests/state/sessions tests/server/machine/pty tests/server/root/watch/sessions.test.ts` all pass. |
| 3. A new shell's prompt where tmux has its cursor | DONE, per ruling 1 | `sessions.ts` `cursorArgs`, `screenAt`; `channel.ts` `#attach` | The sessions.test.ts screenAt cases and the channel.test.ts attach cases pass. |
| 4. Pages view as list rows | DONE | `Pages.svelte` rewritten on `TreeView` and `TreeItem`; `workbench.pages_current` and `workbench.pages_open` removed from `config/text/views/system/workbench.yml` | pages.test.ts 7 passed. `grep -n "font-size\|<li" src/lib/views/system/workbench/Pages.svelte` prints nothing (exit 1). |
| 5. Docs | DONE | DESIGN.md (the pty bridge bullet, the Pages bullet, the page-drag sentence); HELP.md (the Pages paragraph, the drag line, the `terminal` row) | `npm run diagrams` exit 0; `tests/checks/diagrams` 67 passed. |

## Verification

The verify script, run from the worktree's `tools/oculus` (`PATH=... sh .../verify.sh .../orchestrator-state.md </dev/null`):

```
RED: npm test
exit status: 1
 FAIL  tests/checks/imports/order.test.ts > the folder order of each layer > holds the state folders
Error: Test timed out in 5000ms.
 FAIL  tests/server/core/git.test.ts > the log, the branches and the worktrees > cuts every list it publishes at the cap
Error: Test timed out in 5000ms.
 Test Files  2 failed | 343 passed (345)
      Tests  2 failed | 5500 passed (5502)
```

- `tests/server/core/git.test.ts` is a timeout in a file this step does not touch.
- `tests/checks/imports/order.test.ts` is also a timeout, in a file this step does not touch. It checks the import order this step's wiring must hold, so it was run alone once: `npx vitest run tests/checks/imports/order.test.ts` exit 0, 13 passed.

The remaining commands of the list, run by hand after the last change, each read by its own exit:
- `npm run check`: 0, `COMPLETED 1476 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npm run build`: 0.
- `npm run format:check`: 0, `All matched files use Prettier code style!`.
- `npm run lint`: 0.
- `LC_ALL=C grep -rna --exclude=glyphs.yml '[^ -~]' src tests bin config`: one line, `config/present.yml:255`, `Linköping`. That is a real name under config, which the gate allows, and the file is not touched here.
- The spec's perl ASCII gate prints nothing.
- `find src tests config bin -type f | xargs wc -l | sort -rn | head -3`: largest file 898 lines, `tests/server/machine/usage/usage.test.ts`.
- `npm run diagrams`: 0.

## Files, lines before and after

"Before" is given where it was measured with `wc -l` before the change; "not measured" where it was not.

| File | Before | After |
|---|---|---|
| src/lib/server/machine/pty/tmux.ts | 363 | 374 |
| src/lib/server/machine/pty/sessions.ts | 456 | 489 |
| src/lib/server/machine/pty/channel.ts | 494 | 533 |
| src/lib/state/sessions/terminals.svelte.ts | 540 | 630 |
| src/lib/state/client/context.ts | not measured | 323 |
| src/lib/views/system/workbench/Pages.svelte | 356 | 369 |
| src/lib/data/model/model-sessions.ts (outside the brief's paths, decision B) | not measured | 619 |
| src/lib/server/sessions/index.ts (outside, B) | not measured | 61 |
| src/lib/server/root/watch/sessions.ts (outside, B) | not measured | 302 |
| config/text/views/system/workbench.yml | 58 | 56 |
| tests/server/machine/pty/tmux.test.ts | 163 | 173 |
| tests/server/machine/pty/sessions.test.ts | 241 | 404 |
| tests/server/machine/pty/channel.test.ts | 363 | 669 |
| tests/state/sessions/terminals.test.ts | 397 | 421 |
| tests/state/client/terminal-tabs.test.ts (new) | 0 | 139 |
| tests/views/system/workbench/pages.test.ts | not measured | 127 |
| tests/server/root/watch/sessions.test.ts (outside, B) | not measured | 492 |

DESIGN.md, HELP.md and the files under `docs/diagrams/` also changed.

## Decisions the brief did not cover (each reversible)

A. **The piece size is 996 bytes, not 4096 (premise found wrong).** The brief's 4096 came from a probe through a control client. The channel's driver runs each command through tmux's command-line client (`run` in `tmux.ts`, `execFile`). There, `send-keys -H` with 1000 hex words failed with `command too long`. A bisection on a private `-L` server found that 996 bytes after `send-keys -t <session> -H` go through and 997 fail, for a one-letter and for an `oculus-a1b2c3-claude` session name alike: about 1000 words per command.
   - `INPUT_MOST = 996`, with that reason in its comment.
   - The brief's 4096 cases are kept, with `most` passed explicitly, and each is also checked at the real limit.
   - A real-tmux case asserts that 996 bytes go through and 997 are refused with `command too long`. It turns red if tmux's limit changes.
   - The alternative was sending through the control client, which would lift the limit. That is a larger change the brief did not name.

B. **The `sessions` payload carries no terminal list until tmux has answered once (path list widened).** Item 2 and brief decision 3 close pinned tabs whenever a first message, or a later one, lacks a terminal. But `Terminals` started with an empty list, and the sessions watcher publishes at construction. So a page reconnecting right after a server restart, or a first `list-sessions` that timed out, would have closed every Terminal tab while the terminals ran on.
   - `Terminals.list()` now returns null until the first list is read.
   - `TerminalSource.list()` in `server/root/watch/sessions.ts` is typed `Terminal[] | null`.
   - `sessions()` in `server/sessions/index.ts` leaves `terminals` out on null.
   - `SessionsPayload.terminals` in `data/model/model-sessions.ts` became optional.
   - The page's existing rule, that a message with no list ends nothing, covers the gap.
   - This is a wire-format change: the field can be absent. Tests: channel.test.ts ("is null until tmux answers, and an empty first answer is a list"; "stays null when the first list fails for a reason other than no server") and the watcher test (`'terminals' in latest(...)` false while the source has no list).

C. **Which ids count as held** at the first message: the pinned terminals of every page's Terminal tabs plus the selected terminal.

D. **Store wiring.** The terminals store is handed `tabs`, `pinned` (`pinnedTerminal`), `identity` (`stateId`), `close` and `selected`/`select` by `context.ts`. `stateId` is injected rather than imported, because `state/sessions` may not import from `state/workbench` (tests/checks/imports/order.test.ts).

E. **Order of the two reads at attach.** The cursor is read after the capture, so output landing between the two moves the cursor over rows the capture holds rather than past rows it lacks. A cursor read that fails is logged with its reason. A cursor that does not parse, or whose row is outside the pane, gives the capture unchanged and one console line.

F. **Pages drag.** The drag is started by `pointerdown` on a wrapper `div role="none"` around each `TreeItem`, since TreeItem has no pointer prop and is outside the paths. A press inside the row's controls or its rename box (marked `data-page-control`) starts no drag. The rename box is the row's `field`, and while it shows, the row has no press, because TreeItem draws its `field` only on a row without `onclick`.

G. **The unsaved mark** is a `Tooltip` around a `span role="img"` with the catalog words as its accessible name, holding the `ui.dirty_glyph` Glyph.

## Which code change's undoing turns each new test red

- **The input pieces cases (tmux.test.ts):** the cut rules in `inputChunks`: the `openAt` sequence state, the `continues` check, the fallback.
- **One read (channel.test.ts):** `#input` sending `inputChunks` pieces through `sendBytesArgs`. Going back to split keys gives `['1b', ...]`, as the first run showed.
- **Input as one `send-keys -H` (channel.test.ts):** the same `#input` change.
- **The 996/997 case (sessions.test.ts):** the value of `INPUT_MOST`. At 4096 the channel's 10000-byte case fails with `command too long`.
- **sendBytesArgs:** the hex mapping.
- **screenAt cases and the attach cases:** `screenAt` and `#attach`'s use of it.
- **List kept on failure / emptied on no server:** the `noServer` branch in `refresh`.
- **Null list:** `#terminals` starting null and the `#took` first-list rule.
- **Ended ids:** `endedTerminals`.
- **Tabs closing (terminal-tabs.test.ts):** the `afterReceive` hook and `closeEnded` in `createTerminals`, and the wiring in `context.ts`.
- **Composer stays:** the `identity(...) === null` condition.
- **Pages rows:** the TreeView/TreeItem markup of `Pages.svelte`.
- **The byte-for-byte case** turns red on neither undoing (ruling 4); it checks order.

## Limitations and sharp edges

- The cursor lands right only when the page's grid and tmux's pane are the same height (ruling 1). Before the page's resize reaches tmux, the row can be off.
- A following Terminal tab whose selection is a session, and which shows the terminal that session runs in, is not closed when that terminal ends, because the selection names a session. Not verified on screen.
- A `sessions` message that arrives before the page's layout is loaded is heard as the first message against no tabs. A tab restored after it is then not closed at the first message, only when a later message stops listing its terminal, which, for a terminal that has already ended, never happens.
- The one-read case needs `python3` in the scratch pane (here a pyenv shim). It is skipped with a printed line where `python3` does not run.
- The real-tmux cases each start a private server under a scratch directory (`-S <tmp>/server.sock`) and kill it in `afterAll`.
- The brief's case of the mouse report says 12 bytes; `ESC[<0;20;14M` is 11 bytes, and the tests assert 11.

## Before and after on screen (for the landing look)

- **A Claude terminal, click, scroll and paste.** Before: a click sent `ESC` as its own `send-keys` and then the rest as typed text, which Claude reads as Escape (its turn stops) followed by typed text. After: the mouse report, the wheel report and a bracketed paste each reach Claude in one write. Expected: a click does not stop a running turn, and no `[<0;..M` text appears in the prompt.
- **`exit` in a shell tab on the page on screen.** Before: the tab stayed open on an empty grid. After: the tab closes. If it was the tab following the selection, the selection is cleared too, and New opens a fresh tab.
- **`exit` in a shell pinned in a tab on another page.** Before: the tab stayed. After: switching to that page shows the tab gone.
- **A new shell's first prompt.** Before: the prompt was drawn at the grid's bottom after the blank rows. After: the prompt is on row 1 (or wherever tmux has the cursor), with blank rows under it.
- **Pages view at rest.** Rows at the explorer's size. The page on screen is bold with a check. A rail page shows `rail: <key>` muted after its name. A page with unsaved text shows the dot at the row's end. No "shown" tag and no Show button.
- **Pages view under the pointer.** The row gets the hover surface, and Rename, Reset (rail pages only) and Close appear at the right. A press on the row shows the page. A press held and dragged past the threshold carries the page to a pane edge.
- **Pages view with a row focused.** The controls show while the focus is inside the row, and Tab from the row reaches them. The arrow keys move between rows. Enter shows the page.
