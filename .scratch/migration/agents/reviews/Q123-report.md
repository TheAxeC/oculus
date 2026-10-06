Everything in the brief and in both rulings is done. One thing was not measured: the check run time. `npm run test:quick` printed "test:quick: 171.6 s (limit 45.0 s); every command passed" on a machine where other suites were running.

## Open items of the state file, verbatim

- Z634 (2026-10-06), Q123, the words of a new guarded entry G52. Q123's brief check found that G51's words guard input reaching the program, while the alternate-screen test guards what the page shows (Z621): an editor drawn full screen after an attach, and the shell's text and cursor back when it exits. Guarded entries carry Axel's words, so the choice is his. (a) A new entry G52, recommended, proposed as: "G52. A page that attaches to a terminal pane whose program is in its alternate screen is given the shell's text in the grid's normal buffer and the program's screen in its alternate buffer, so the program draws full screen and leaving it shows the shell's text again with the cursor where the shell left it." Code: the pane's attach under `src/lib/server/machine/pty/`. Test: written by Q123. For: the behaviour Z621 asked for is guarded by a test whose failure costs a lost shell screen. Against: one more entry. (b) Widen G51's words to cover the alternate screen. For: one entry for the attach. Against: G51 then guards two different promises. (c) No guarded test; the behaviour is checked by a quoted run and the look only. Against: nothing stops a later change from dropping it; the lazy option. Q123 is built under (a); its landing waits for the ruling.

## The rulings carried

- Ruling A (the split): `src/lib/server/machine/pty/start/` holds `chat.ts`, `compose.ts` and `context.ts`, moved with only their import paths changed (one more `../`, and `./sessions.ts`, `./shell-word.ts`, `./refusal.ts` now `../sessions.ts`, `../shell-word.ts`, `../refusal.ts`); `src/lib/server/machine/pty/capture.ts` holds the argument builders, `PANE_MODES`, `cursorArgs`, the readers and the types. `scrollback` stays in `sessions.ts` and imports `captureArgs`.
- Ruling B (the editor that left): a `-q -a` capture of fewer lines than `#{pane_height}` means the program left (`holdsSavedScreen`, `capture.ts`); the G52 row for it answers `"\n"`. `#{alternate_on}` is read once more after the alternate capture (`alternateOnArgs`), and a program that left by either test gives the normal attach message built from a fresh capture and a fresh cursor read (`#attach`, `channel.ts`). The default state (alternate off) makes the calls and the message of the brief, in the brief's order.

## The cases' first run (unchanged `src`)

The first run on the unchanged `src` of the final test file: a scratch copy in the session scratchpad (`scratchpad/base-run`: this worktree's `tools/oculus` without `src`, `.scratch` and `docs`, the base's `src` beside it, `node_modules` linked), the test file's `capture.ts` import pointed at the base's `sessions.ts` and `cursorArgs(SESSION)` read `cursorArgs(ID)` (the base builder takes the id). `npx vitest run tests/server/machine/pty/channel.test.ts --reporter=verbose` there printed `Test Files  1 failed (1)` and `Tests  4 failed | 8 passed (12)`. The failing line is the same `expect` for each row, `tests/server/machine/pty/channel.test.ts:352:86` in that copy:

- G52 alternate on with history: `AssertionError: expected 'the pane as it stands\u001b[2;10H\u00...' to be 'history 1\r\nhistory 2\r\nhistory 3\r...'`.
- G52 alternate on, no history: `expected 'the pane as it stands\u001b[2;10H\u00...' to be 'shell 1\r\nshell 2\r\nshell 3\r\nshel...'`.
- G52 alternate on, no saved cursor: `expected 'the pane as it stands\u001b[2;10H\u00...' to be 'history 1\r\nhistory 2\r\nhistory 3\r...'`.
- G52 the editor gone after the alternate screen was read (the race row of Ruling B): `expected 'the pane as it stands\u001b[2;10H\u00...' to be 'the shell after the editor\u001b[2;10...'`. The base sends the first capture, which the editor had in it, where the fix sends the fresh capture.

Per case:

1. G51, modes set: passes on the unchanged `src` (`ok ... 'bracketed paste, application cursor k...'`) and after.
2. G51, no mode set: passes on the unchanged `src` and after.
3. Malformed answers: first run on the unchanged `src` (`node --experimental-strip-types -e`, in the previous hand-back): a missing flag gave modes `""` and screen `"a\u001b[4;3H"`; an extra flag gave the same. After the change, `capture.ts`, the same line: well-formed `"\u001b[?2004h\u001b[?1h"` and `"a\u001b[4;3H"`; a missing flag `""` and `"a\u001b[4;3H"`; an extra flag `""` and `"a\u001b[4;3H"`; for a history that is not a whole number, a saved column that is not, an empty saved row, `alternate_on` a word and `alternate_on` empty: `alternateAt` printed `null`, `modesAt` `"\u001b[?2004h\u001b[?1h"` and `screenAt` `"a\u001b[4;3H"`, so the message is today's one. The well-formed alternate answer gave `{"height":6,"history":13,"saved":{"column":1,"row":5}}`. The line of `#attach` that sends today's message when `alternateAt` is null is `channel.ts:632-634` (`alternate !== null && captured !== null ? alternateScreenAt(...) : placed.replace(...) + modesAt(cursor)`).
4. G52, alternate on with history: fails on the unchanged `src`, passes after.
5. G52, alternate on with no history: fails on the unchanged `src`, passes after.
6. G52, alternate on with no saved cursor: fails on the unchanged `src`, passes after.
7. G52, alternate off: passes on both.
8. G52, `alternate_on` unreadable: passes on both.
9. G52, the editor gone before the `-q -a` capture: the row answers `"\n"` (tmux 3.7c's form); passes on both, since the base sends today's message and so does the change.
10. G52, the editor gone after the alternate screen was read (Ruling B's added row): fails on the unchanged `src` as quoted above, passes after.
11. The captures on a private tmux server, `tmux -V` printed `tmux 3.7c`, a 40x6 pane, run with the builders of `capture.ts`, killed afterwards (`list-sessions` printed `no server running on /private/tmp/tmux-502/q123b79731`). Fields in the order cursor_x cursor_y pane_height alternate_on saved_x saved_y history_size and the flags:
    - 1049 with history: `"3 0 6 1 11 5 15 0 1 0 1 0 0 0 0 0 1 1\n"`; history `"hist 1\n" ... "hist 15\n"`; saved normal screen `"hist 16\nhist 17\nhist 18\nhist 19\nhist 20\n$ vim a.txt\n"`; alternate screen `"editor row 1\neditor row 2\n\n\n\n\n"`; `alternateAt` gave `{"height":6,"history":15,"saved":{"column":11,"row":5}}`, `holdsSavedScreen` true, `inAlternateScreen("1\n")` true.
    - 1049 with no history: `"3 0 6 1 11 2 0 0 1 0 1 0 0 0 0 0 1 1\n"`; the history range answers `"editor row 1\n"` (the alternate screen's top row); saved `"shell one\nshell two\n$ vim a.txt\n\n\n\n"`; `holdsSavedScreen` true.
    - 47 and 1047 with history: `"3 0 6 1 4294967295 4294967295 15 ..."`, `alternateAt` gave `saved: null`, the captures as for 1049.
    - After the editor left: `"11 5 6 0 11 5 15 ..."`, saved `"\n"`, `alternateAt` null, `alternate_on` read alone `"0\n"`, `inAlternateScreen` false.
    - A blank normal screen with the editor in its alternate screen on a 10-row pane answers ten newlines and `holdsSavedScreen` printed true; after the editor left, 10, 1 and 3 rows each answered `"\n"` and `holdsSavedScreen` printed false, true, false. The 1-row pane reads as a held screen by the line count, and the re-read of `#{alternate_on}` after the alternate capture catches it.
    The history capture is the shell's history, the saved normal screen the shell's screen and the plain capture the editor's screen, as the brief states.
12. 'a socket that closed': passes on the unchanged `src` and after (`ok ... a socket that closed > stops the delivery and leaves the tmux session alone`).

## DONE / NOT DONE

| Item | Proof | Last line |
|---|---|---|
| 1 display-message answer, readers | `npx vitest run tests/server/machine/pty/channel.test.ts --reporter=verbose` | `Tests  12 passed (12)` |
| 2 tmux calls and order, both states | same run; the call order is `#attach` and `#alternateCaptures` in `channel.ts:598-700` | same |
| 3 message for the alternate screen | same run, rows 1 to 3 of G52 | same |
| 4 size of `sessions.ts`, folder split | `wc -l`: `sessions.ts` 779, `channel.ts` 748, `capture.ts` 203; `sh utils/folder-check.sh; echo $?` printed `0`; `npx vitest run tests/checks/tree tests/checks/imports` printed `Test Files  6 passed (6)` and `Tests  68 passed (68)` | `0` |
| 5 G51 test, two rows | same vitest run | `Tests  12 passed (12)` |
| 6 G52 test, seven rows | same vitest run | same |
| 7 fixture from `cursorArgs(SESSION).at(-1)` | `answerWith` in `channel.test.ts`; same run | same |
| 8 DESIGN.md:375, HELP.md:147, comments | `diff` against the base copy (below) | not applicable |
| `npm run test:quick` | quoted below | `test:quick: 171.6 s (limit 45.0 s); every command passed` |
| `npm run diagrams` | `diff -rq docs/diagrams /Users/axelfaes/workspace/research-hub/tools/oculus/docs/diagrams; echo $?` printed `0` | `0` |
| unused exports | below | |
| ASCII gate of `spec.md:97` | below | |
| history grep | below | |

`npm run test:quick` lines: `ok      prettier (3.2 s): All matched files use Prettier code style!`, `ok      ASCII gate (3.4 s)`, `ok      svelte-kit sync (98.8 s)`, `ok      svelte-check (45.4 s): 1791274581506 COMPLETED 390 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok      eslint (163.9 s)`, `ok      vitest (167.2 s): Duration  68.51s (transform 131.88s, setup 0ms, import 200.27s, tests 61.94s, environment 399ms)`, `test:quick: 171.6 s (limit 45.0 s); every command passed`, `test:quick: over the time limit`. The time limit message is the run time of a machine with other suites running (`npm run test:checks` and `npm run dev` of others were in `pgrep`); the commands themselves passed.

Unused exports, `sh utils/unused-exports.sh` against the base's `unused-exports.txt` (`diff`): the only differences are the two moved files, `< src/lib/server/machine/pty/chat.ts: chatIndexPath, chatCommand` and `< src/lib/server/machine/pty/compose.ts: AGENTS_FILE, ACCOUNT_ENV, defaultAccountDir, IMAGES_MAX, accountChoices, accountFor` becoming the same lines under `src/lib/server/machine/pty/start/`. The step added no line: every export of `capture.ts` has an importer in `channel.ts`, `sessions.ts` or the test.

ASCII gate: the perl command of `spec.md:97` printed nothing; its `find` reports `bfs: error: bin: No such file or directory.` because this worktree has no `bin` folder, and the command's exit status is 0. `LC_ALL=C grep -n '[^ -~]' DESIGN.md HELP.md` printed nothing in the two changed documents' added text (no hit at all).

History grep over the comment lines and test titles the step added or changed, for before, used to, no longer, still, always has been, always had, as before, previously, the step adds, after this package lands, again, now and a date or package id: hits judged. `capture.ts:12` and `:189` "shows the shell's text again" is the behaviour G52 words; `:50` and `:90` "before" is an order of operations; `channel.ts` "is read again" and "no longer 1" describe the re-read and a state; `channel.test.ts` "last one again" describes repeating an answer and the row title 'the editor gone before the saved screen was read' names a read order. None compares with an earlier state.

## G51's Test line and G52's Test line

- G51: `Test: tests/server/machine/pty/channel.test.ts, 'gives an attaching page the modes the pane's program set, after the screen'`.
- G52: `Test: tests/server/machine/pty/channel.test.ts, 'gives an attaching page a pane's shell text, then the alternate buffer with the editor's screen'`.

## Files (`diff -rq` against the base copy, over `src`, `tests`, `utils`, `config`, plus `DESIGN.md` and `HELP.md`)

| Path | Lines | Reason |
|---|---|---|
| `src/lib/server/machine/pty/capture.ts` | 203, new | Ruling A |
| `src/lib/server/machine/pty/channel.ts` | 748 (base 678) | write list |
| `src/lib/server/machine/pty/sessions.ts` | 779 (base 852) | write list |
| `src/lib/server/machine/pty/start/chat.ts` | 119 | moved from `pty/chat.ts`, Ruling A |
| `src/lib/server/machine/pty/start/compose.ts` | 277 | moved from `pty/compose.ts`, Ruling A |
| `src/lib/server/machine/pty/start/context.ts` | 50 | moved from `pty/context.ts`, Ruling A |
| `src/lib/server/machine/pty/routes.ts` | 656 | imports `./start/chat.ts` and `./start/compose.ts`, Ruling A |
| `src/routes/api/(sessions)/agents/+server.ts` | | import and comment, Ruling A |
| `src/lib/data/helpers/finding-text.ts` | | comment path, Ruling A |
| `src/lib/state/sessions/terminal/pty/pty-subscribe.ts` | | comment path, Ruling A |
| `tests/routes/sessions/terminal-actions.test.ts` | | import path, Ruling A |
| `tests/server/machine/pty/channel.test.ts` | 355 (base 183) | write list |
| `DESIGN.md` (line 375), `HELP.md` (line 147) | | write list |

`docs/diagrams/` is unchanged by `npm run diagrams` (the diff against the main checkout's copy printed nothing). The grep `grep -rn "pty/chat\|pty/compose\|pty/context\|captureArgs\|cursorArgs\|PANE_MODES\|screenAt\|modesAt" src tests utils DESIGN.md HELP.md README.md` prints, outside `capture.ts`: `channel.ts:41,42,46,48,622,634,659,665`, `sessions.ts:28,721`, `pty-subscribe.ts:4`, `channel.test.ts:13,47,52` and `DESIGN.md:375`; each is carried. `ls src/lib/server/machine/pty | wc -l` is 9 and `start/` holds 3.

Edits to existing assertions, allow lists and predicates: none. The `diff` of `channel.test.ts` against the base shows the new import, the fixture (`driver()` takes `{ answer, captures, alternateAfter }`; `'0 0 1\n'` and `SCREEN` stay the defaults) and the added `describe`; the three old tests are unchanged.

## Text that describes the attach

- `DESIGN.md:375`: rewritten (the file name of `screenAt` and the alternate-screen shape and its two fallbacks).
- `HELP.md:147`: rewritten (a clause on the editor drawn full screen and the shell's text back).
- `pty-subscribe.ts:1-6`: path rewritten to `capture.ts`, the sentence is still true.
- The comment over `PANE_MODES` (`capture.ts`): rewritten, it names an editor in its normal or its alternate screen.
- `#attach`'s doc comment and its comments (`channel.ts`): rewritten; `#readPane` and `#alternateCaptures` carry their own.
- Doc comments of `cursorArgs`, `modesAt`, `screenAt`: rewritten; `alternateAt`, `alternateScreenAt`, `holdsSavedScreen`, `inAlternateScreen` and the four argument builders are new.
- Head comments: `capture.ts` has its layer head comment; `chat.ts`, `compose.ts` and `context.ts` keep theirs.

## Judgment calls (reversible)

- The builders in `capture.ts` take the tmux session's name, not the terminal id: `sessions.ts` imports `capture.ts` for `scrollback`, and `capture.ts` importing `sessionName` from `sessions.ts` would be an import cycle that `tests/checks/imports/cycles.test.ts` refuses. `captureArgs` and `historyArgs` take `lines` with no default for the same reason; `SCROLLBACK_LINES` stays in `sessions.ts`.
- A program that left is read again from a fresh capture and cursor in both cases (the saved screen too short, and `#{alternate_on}` 0 after), not only the one Ruling B names. The case 9 row's bytes are the same either way, since its stub answers the same capture twice.
- `screenAt` reads the first three fields and ignores the rest; it used to refuse an answer whose tail held anything but `0` or `1` fields. `modesAt` requires the three whole numbers and exactly eleven `0`/`1` flags after the seven leading fields.
- `alternateAt` treats either saved field equal to 4294967295 as no saved cursor, and returns null when the height does not read as a whole number.
- An error in one of the alternate reads logs `pty: no alternate screen for <id>, the whole capture is sent` and sends today's message from the first capture.
- `edit.ts:114-118` keeps its own `#{alternate_on}` read, as the brief says; `alternateOnArgs` is the attach's.

## Limitations

- A program that leaves after the last `#{alternate_on}` read and before the message is sent is not detected. The window is the one tmux calls after the final read; the program's own `\u001b[?1049l` reaches the page as a chunk after the message.
- The message is built from reads made at different moments, as the default state's is. The brief's "output between the reads" cases stand: a write by the editor between the cursor read and the alternate capture can leave the placed cursor on the row it left, and the editor's next write places its own.
- The default state makes no new call; the alternate state adds the saved-screen read, the alternate capture, the `#{alternate_on}` re-read and, with history, the history read. Not measured for time.
- `test:quick` took 171.6 s against its 45 s limit while other suites ran on the machine.

## Before and after (the look at landing)

On TEST, in Axel's Chrome on his running server: a Terminal tab with a shell whose history fills more than the grid, `vim` opened in it, then the page reloaded. Before: vim's screen sits under the shell's history in the grid's normal buffer and scrolls with it. After: vim is drawn full screen over the whole grid. Then `:q`. After: the shell's text is back, with the prompt on the row the shell left it and the cursor after the prompt. A shell with no editor open, reloaded, looks as before (the message is the same bytes in the default state).

## Anything in the brief that was wrong

- Case 9's premise, an empty `-q -a` answer once the program left, is wrong on tmux 3.7c, which answers `"\n"`; Ruling B replaced it.
- Item 4's premise held: `sessions.ts` passed 880 with the additions, so Ruling A applies.
- The brief's wording that the unchanged `src` has the race row fail: the base fails it only because the row expects the fresh capture; the base never sends `\u001b[?1049h`, so an assertion on that alone passes on the base.
