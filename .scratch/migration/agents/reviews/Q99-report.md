# Q99 report

Everything in the brief, in the round 0 ruling (`briefs/Q99-cases.md`) and in repair round 1 (`briefs/Q99-round1-sent.md`) is done. As round 1 directs, the full verify list was not run this round; the orchestrator runs it on main at landing. The changed test files, `tests/checks`, `npm run check`, `npm run format:check`, `npm run lint` and `npm run diagrams` were run after the last change and each exited 0 (Verification below).

## Open items of the state file (verbatim, from the main checkout's `orchestrator-state.md`, lines 118-122, read at finish)

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- None.

## The rulings this report carries (round 0, `briefs/Q99-cases.md`)

1. Screen on attach: the whole capture without its final newline, CR LF kept, then `ESC[<cursor_y+1>;<cursor_x+1>H`. The cursor lands on tmux's row only when the page's grid and tmux's pane are the same height, which holds once the page's resize has reached tmux.
2. When the selected terminal ends, only following tabs with no identity of their own close (`followsSelection(state)` and no identity). A composer tab stays, and the selection is still cleared.
3. A failed `list-sessions` keeps the last list. The one exception is tmux saying `no server running on`, or `error connecting to ... (No such file or directory)`, which gives the empty list.
4. The brief's byte-for-byte case stays as an order check. The one-read case is the proof of item 1; it is skipped with a printed reason where `python3` is absent (`tests/server/machine/pty/channel.test.ts`, the `PYTHON` probe).
5. The Pages row calling `switchPage` when pressed cannot be run without a DOM. The test checks that the row renders its press, and the press itself is seen at the landing look.

## Repair round 1

| Item | State | Where | Proof |
|---|---|---|---|
| 1. A following tab over a selected Claude/Codex session closes when its terminal ends; the session selection is kept | DONE | `terminals.svelte.ts`: `following(records)` (line 324) resolves `followed` = {terminal, from} after each message (line 385); the next message hands it to `endedTerminals` as held and to `closeEnded(ended, shown)` (line 344), which closes following tabs with no identity when the selection is still `shown.from`, and clears the selection only when it is a terminal id. `context.ts:182` passes the raw `selection.selected`. | terminals.test.ts describe "a following tab over a selected session whose terminal ended" (line 430): "closes the tab and keeps the selection", "closes nothing when the selection moved to another session between the two messages", "closes the tab and clears a terminal selection, as before". |
| 2. `first`/`heard` set only by a message whose `terminals` is an array | DONE | `terminals.svelte.ts:366-368`: the `Array.isArray` return comes before `first`/`heard` | terminals.test.ts "is not the first message, so the first list that lacks a pinned terminal closes its tab" (line 493). |
| 3. The injected `identity` removed | DONE | `TerminalTabs` has no `identity` field; `closeEnded` calls the module's `identity()` (line 192, used at line 355); `context.ts` no longer imports `stateId` | `grep -rn "identity:" tests/state src/lib/state/client` prints nothing. terminal-tabs.test.ts 7 cases pass. |
| 4. Paste claim made true | DONE | DESIGN.md:264 and the `#input` comment in `channel.ts:489-491`: a mouse or focus report reaches the program in one write; a paste over INPUT_MOST bytes arrives in several writes, in order, its markers each whole | Read in the files. |
| 5. Watcher comment exact | DONE | `server/root/watch/sessions.ts:96-101` says `terminals` is absent when the option is absent and while the source has read no list. The code at line 162 was made to match: `options.terminals === undefined ? null : options.terminals.list()` (before, a missing source gave `[]`, a list) | watch/sessions.test.ts "carries no terminal list when it was given no terminal source" (line 478). |
| 6. A Pages row drag released over the same row does not show the page | DONE | `views/system/workbench/row-press.ts` (new, 35 lines) `rowPresses(show)`, the rule of `Catalogue.svelte` `dragged()`; `Pages.svelte:115` creates it, `press()` calls `rowClick.down` (line 190), the row's `onclick` calls `rowClick.click` (line 286). DESIGN.md:268 and HELP.md:40 say it. | pages.test.ts describe "a row press and its click": three cases (named "audits that ..." per `tests/checks/tree/audits.test.ts`, since they render nothing). |
| 7. The steer typed as `-H` pieces through the shared builder, then Enter | DONE | `sessions.ts:440` `sendBytesArgs`, `:450` `inputArgs` (used by the channel's `#input` and by the steer), `:471` `steerArgs`; DESIGN.md steer sentence | sessions.test.ts "types a steer of any length it accepts in commands tmux takes, a line break as its byte" (line 363: `ceil(20000 / INPUT_MOST)` commands, each at most INPUT_MOST words, `'0a'` at 9999, then Enter) and the real-tmux "types a 20000-character steer into a pane whole, then Enter" (line 306). |
| 8. pty test count | DONE | | `npx vitest run tests/server/machine/pty`: `Test Files 6 passed (6)`, `Tests 82 passed (82)`. |
| 9. Reader-visible changes | DONE | section below | |
| 10. Open items first | DONE | section above | |
| 11. Undo quotes | DONE | section below | |

## Each new or changed round 1 case with the change it guards undone

Each file was put back after the run (`cmp` against the saved copy printed nothing and exited 0 for `row-press.ts`; `grep -c "workbench.select(null)" src/lib/state/sessions/terminals.svelte.ts` printed 1 after the terminals undos).

| Undone change | Failing case | Failure quoted |
|---|---|---|
| `followed = following(...)` replaced by `followed = null` | terminals.test "closes the tab and keeps the selection" | `expected true to be false` |
| The `selected() !== shown.from` check removed | terminals.test "closes nothing when the selection moved to another session between the two messages" | `expected false to be true` |
| `workbench.select(null)` removed | terminals.test "closes the tab and clears a terminal selection, as before" | `expected 'e1e1e1-claude' to be null` |
| `first`/`heard` set before the list check | terminals.test "is not the first message, so the first list that lacks a pinned terminal closes its tab" | `expected true to be false` |
| The `identity(...) === null` condition removed | terminal-tabs.test "keeps a composer the reader is filling in when the selected terminal ends" | `expected false to be true` |
| The watcher's `=== undefined ? null` removed | watch/sessions.test "carries no terminal list when it was given no terminal source" | `expected true to be false` |
| `if (distance >= THRESHOLD) return;` removed in `row-press.ts` | pages.test "audits that a drag past the threshold released over the same row does not show the page" | `AssertionError: expected [ 'p1' ] to deeply equal []` |
| ` && event.detail > 0` removed | pages.test "audits that a click the keyboard made shows the page, wherever the last press was" | `AssertionError: expected [] to deeply equal [ 'p1' ]` |
| `show(id)` removed | pages.test "audits that a press and a click with no move show the page once" (and the keyboard case) | `AssertionError: expected [] to deeply equal [ 'p1' ]` |
| `steerArgs` back to one `send-keys -l` word | real "types a 20000-character steer into a pane whole, then Enter"; "steers with the text as bytes, then Enter, and interrupts with Escape"; the 20000 args case | `Error: command too long`; an args length mismatch; `expected ... to have a length of 21 but got 1` |

## First run of the cases (unchanged tree, before any code change, phase 1)

Command: `npx vitest run <file>` per file, from the worktree's `tools/oculus`.

| Case | Test | First run |
|---|---|---|
| inputChunks cases (mouse report, `ls -la\r`, 5000 `a`, e-acute at the cut, CSI at the cut, OSC to BEL, plus SS3, `ESC \`, `ESC x`, a sequence longer than a piece, empty) | tmux.test.ts "the input pieces" | red, `inputChunks is not a function` (9 cases) |
| `ls -la\r` runs in a real scratch `sh`; the dash line through the new path | sessions.test.ts | red, `inputChunks is not a function` |
| sendBytesArgs('t1', ESC[I) | sessions.test.ts | red, `sendBytesArgs is not a function` |
| Channel input byte for byte into a raw pane | channel.test.ts | green on the unchanged tree (ruling 4) |
| A mouse report in one read(2) | channel.test.ts | red: `['1b', '5b3c303b32303b31344d']` |
| Channel input as one `send-keys -H` | channel.test.ts | red, old two-command split |
| Ended ids (4 brief cases and a dedupe case) | terminals.test.ts | red, `endedTerminals is not a function` |
| Tabs closing: pinned on a hidden page, following plus selection cleared, first message | terminal-tabs.test.ts | red |
| Tabs staying: still listed, started here and not yet listed, message with no list | terminal-tabs.test.ts | green (nothing closed on the unchanged tree) |
| Composer tab stays | terminal-tabs.test.ts | red on the selection clear |
| screenAt, cursorArgs, attach cases | sessions.test.ts, channel.test.ts | red |
| Pages rows | pages.test.ts | red, all six |

## What to build (the brief)

| Item | State | Where | Proof |
|---|---|---|---|
| 1. Input sent as its bytes | DONE | `tmux.ts` `inputChunks`, `INPUT_MOST` (the old key map removed); `sessions.ts` `sendBytesArgs`, `inputArgs`; `channel.ts` `#input` | pty folder 82 passed, the real-tmux cases included. |
| 2. A tab closes when its terminal ends | DONE | `terminals.svelte.ts` `endedTerminals`, `createTerminals(..., workbench)`, `closeEnded`; `context.ts` wiring; `channel.ts` `refresh` and `noServer`; the payload carries no list before the first read (decision B) | terminals.test.ts, terminal-tabs.test.ts, watch/sessions.test.ts pass. |
| 3. A new shell's prompt where tmux has its cursor | DONE, per ruling 1 | `sessions.ts` `cursorArgs`, `screenAt`; `channel.ts` `#attach` | sessions.test.ts screenAt cases and channel.test.ts attach cases pass. |
| 4. Pages view as list rows | DONE | `Pages.svelte` on `TreeView`/`TreeItem`; `row-press.ts`; `workbench.pages_current` and `workbench.pages_open` removed from `config/text/views/system/workbench.yml` | pages.test.ts 10 passed. |
| 5. Docs | DONE | DESIGN.md (pty bridge bullet, steer sentence, Pages bullet); HELP.md (Pages paragraph, drag line, `terminal` row) | `npm run diagrams` exit 0; `tests/checks` 334 passed after the last docs change. |

## Verification (round 1, after the last change, from the worktree's `tools/oculus`, `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, stdin `</dev/null`)

- `npx vitest run tests/server/machine/pty tests/state/sessions/terminals.test.ts tests/state/client/terminal-tabs.test.ts tests/views/system/workbench/pages.test.ts tests/server/root/watch/sessions.test.ts tests/checks`: exit 0, `Test Files 38 passed (38)`, `Tests 477 passed (477)`.
- `npx vitest run tests/server/machine/pty`: `Test Files 6 passed (6)`, `Tests 82 passed (82)`.
- `npm run check`: exit 0, `COMPLETED 1477 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npm run format:check`: exit 0, `All matched files use Prettier code style!` (rerun after the last docs change, same line).
- `npm run lint`: exit 0.
- `npm run diagrams`: exit 0.
- `npx vitest run tests/checks` after the last docs change: `Test Files 28 passed (28)`, `Tests 334 passed (334)`.
- `LC_ALL=C grep -c '[^ -~]'` over every touched file: 0 in each.

What this does not cover: the full verify list (`npm test` over the whole tree, `npm run build`), which round 1 leaves to the orchestrator at landing. Its last run by this step (phase 2) went RED on two 5 s timeouts in files this step does not touch (`tests/checks/imports/order.test.ts`, `tests/server/core/git.test.ts`); `order.test.ts` has since passed inside the `tests/checks` runs above. No browser test was run, by the brief's rule.

## Files, lines after round 1 (`wc -l`)

| File | Lines |
|---|---|
| src/lib/server/machine/pty/tmux.ts | 374 |
| src/lib/server/machine/pty/sessions.ts | 499 |
| src/lib/server/machine/pty/channel.ts | 526 |
| src/lib/state/sessions/terminals.svelte.ts | 664 |
| src/lib/state/client/context.ts | 322 |
| src/lib/views/system/workbench/Pages.svelte | 377 |
| src/lib/views/system/workbench/row-press.ts (new) | 35 |
| src/lib/data/model/model-sessions.ts (decision B) | 619 |
| src/lib/server/sessions/index.ts (decision B) | 61 |
| src/lib/server/root/watch/sessions.ts (decision B, item 5) | 303 |
| config/text/views/system/workbench.yml | 56 |
| DESIGN.md | 320 |
| HELP.md | 294 |
| tests/server/machine/pty/tmux.test.ts | 173 |
| tests/server/machine/pty/sessions.test.ts | 451 |
| tests/server/machine/pty/channel.test.ts | 669 |
| tests/state/sessions/terminals.test.ts | 508 |
| tests/state/client/terminal-tabs.test.ts (new) | 139 |
| tests/views/system/workbench/pages.test.ts | 158 |
| tests/server/root/watch/sessions.test.ts | 501 |

The files under `docs/diagrams/` were regenerated by `npm run diagrams`.

## Decisions the brief did not cover (each reversible)

A. **The piece size is 996 bytes, not 4096 (premise found wrong).** The channel's driver runs each command through tmux's command-line client (`run` in `tmux.ts`). There, `send-keys -H` with 1000 hex words fails with `command too long`; on a private `-L` server 996 bytes after `send-keys -t <session> -H` go through and 997 fail. `INPUT_MOST = 996` carries that reason in its comment; a real-tmux case asserts 996 through and 997 refused, so it turns red if tmux's limit changes. The brief's 4096 cases are kept with `most` passed explicitly. Sending through the control client would lift the limit; that is a larger change no brief names.

B. **The `sessions` payload carries no terminal list until tmux has answered once (path list widened; wire format).** `Terminals.list()` returns null until the first list is read; `TerminalSource.list()` is `Terminal[] | null`; `sessions()` leaves `terminals` out on null; `SessionsPayload.terminals` is optional. Without it a page reconnecting after a server restart, or a first `list-sessions` that timed out, would have closed every Terminal tab while the terminals ran on. Round 1 item 5 extended the same absence to a watcher given no terminal source.

C. **Which ids count as held** at the first message: the pinned terminals of every page's Terminal tabs plus the terminal the selection shows (`followed`, round 1 item 1).

D. **Store wiring.** `context.ts` hands the terminals store `tabs`, `pinned` (`pinnedTerminal`), `close`, and `selected`/`select` (the raw selection). The store reads a tab's identity with its own `identity()`.

E. **Order of the two reads at attach.** The cursor is read after the capture. A cursor read that fails is logged with its reason; a cursor that does not parse, or whose row is outside the pane, gives the capture unchanged and one console line.

F. **Pages press and drag.** The drag starts on `pointerdown` on a wrapper `div role="none"` around each `TreeItem`; a press inside the controls or the rename box (`data-page-control`) starts no drag. The rule telling a row's click from a drag's release lives in `views/system/workbench/row-press.ts`, a view partial beside the view as `views/system/history/rows.ts` is, so lint can type it where the view's module script cannot be typed from a test. Its three cases are named "audits that ...", the name `tests/checks/tree/audits.test.ts` requires of a case under `tests/views` that renders nothing.

G. **The unsaved mark** is a `Tooltip` around a `span role="img"` with the catalog words as its accessible name, holding the `ui.dirty_glyph` Glyph.

## Reader-visible changes

- **Large input to a terminal.** Before: a literal run over about 16.3 KB was refused by tmux, and the input was lost. After: any size arrives in `send-keys -H` commands of at most 996 bytes, in order; 100000 characters through a private tmux took 1323 ms, measured by a node script against a private server (about 1.3 s per 100 KB).
- **The steer.** Before: the text was one `send-keys -l` word, which tmux refused over about 16.3 KB (`command too long`). After: any steer up to STEER_MAX arrives as `-H` pieces, a line break typed as its byte, then Enter.
- **The Pages drag.** Before: a row dragged past the threshold and let go over itself showed that page. After: it shows nothing; a press and a click with no move, and Enter on a focused row, still show the page.
- **The following tab over a session.** Before: a following Terminal tab showing the terminal of a selected Claude or Codex session stayed open over an ended terminal. After: it closes when that terminal ends, and the session stays selected, so the Transcript and the other views still show it. If the selection moved between the two messages, nothing closes.

## Limitations and sharp edges

- The cursor lands right only when the page's grid and tmux's pane are the same height (ruling 1).
- `followed` is resolved from the selected session's record in the last `sessions` message. A session selected whose record the payload lacks, or that has no terminal there, follows no terminal, so nothing closes for it.
- A `sessions` message that arrives before the page's layout is loaded is heard as the first message against no tabs. A tab restored after it is closed only when a later message stops listing its terminal, which for a terminal that already ended never happens.
- The one-read case needs `python3` in the scratch pane; it is skipped with a printed line where `python3` does not run.
- The real-tmux cases each start a private server under a scratch directory (`-S <tmp>/server.sock`) and kill it in `afterAll`.
- The brief's mouse report of 12 bytes is 11 (`ESC[<0;20;14M`); the tests assert 11.

## Before and after on screen (for the landing look)

- **A Claude terminal, click, scroll and paste.** Before: a click sent `ESC` alone and then the rest as typed text, which Claude reads as Escape. After: a mouse report, a wheel report and a bracketed paste reach Claude intact. Expected: a click does not stop a running turn, and no `[<0;..M` text appears in the prompt.
- **`exit` in a shell tab on the page on screen.** The tab closes; if it was following a selected terminal, the selection is cleared.
- **`exit` in a shell pinned in a tab on another page.** Switching to that page shows the tab gone.
- **A Claude session selected, its terminal ended.** The following Terminal tab closes; the session stays selected.
- **A new shell's first prompt.** On row 1 (or where tmux has the cursor), blank rows under it.
- **Pages view.** Rows at the explorer's size; the page on screen bold with a check; `rail: <key>` after a rail page's name; the unsaved dot at the row's end; Rename, Reset (rail pages) and Close under the pointer or focus. A press shows the page; a drag past the threshold carries the page to a pane edge, and let go over the row itself shows nothing.
