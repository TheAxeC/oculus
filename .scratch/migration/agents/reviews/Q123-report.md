NOT DONE, handed back before the finish: (1) `sessions.ts` is 940 lines against the limit of 880 (`wc -l`), so the brief's item 4 requires this hand-back with a folder split, and no file was moved; (2) the brief's rule for "the editor left between the reads" (an empty `-q -a` answer, case 9) is wrong on tmux 3.7c, which answers `"\n"`. The DESIGN.md:375 and HELP.md:147 edits, the comment rewrites, `npm run test:quick`, the unused-exports comparison, the ASCII gate and the history grep are not done, because the two rulings below decide where the code lives and how the gone state is read.

## Open items of the state file, verbatim

- Z634 (2026-10-06), Q123, the words of a new guarded entry G52. Q123's brief check found that G51's words guard input reaching the program, while the alternate-screen test guards what the page shows (Z621): an editor drawn full screen after an attach, and the shell's text and cursor back when it exits. Guarded entries carry Axel's words, so the choice is his. (a) A new entry G52, recommended, proposed as: "G52. A page that attaches to a terminal pane whose program is in its alternate screen is given the shell's text in the grid's normal buffer and the program's screen in its alternate buffer, so the program draws full screen and leaving it shows the shell's text again with the cursor where the shell left it." Code: the pane's attach under `src/lib/server/machine/pty/`. Test: written by Q123. For: the behaviour Z621 asked for is guarded by a test whose failure costs a lost shell screen. Against: one more entry. (b) Widen G51's words to cover the alternate screen. For: one entry for the attach. Against: G51 then guards two different promises. (c) No guarded test; the behaviour is checked by a quoted run and the look only. Against: nothing stops a later change from dropping it; the lazy option. Q123 is built under (a); its landing waits for the ruling.

## The two rulings this hand-back needs

### Ruling A: the size of `sessions.ts` (brief item 4)

`wc -l src/lib/server/machine/pty/sessions.ts src/lib/server/machine/pty/channel.ts` prints 940 and 720. The base was 852. The 88 added lines are: three argument builders beside `captureArgs` (about 22 lines with their doc comments), the longer `cursorArgs` and its doc comment, `fieldsOf` and `isWhole`, the reworked `modesAt` and `screenAt`, `alternateAt` with the `AlternateScreen` type, `alternateScreenAt` with the `AlternateCaptures` type. The code is formatted by prettier and no comment is shortened.

The folder `src/lib/server/machine/pty/` holds ten items (`ls src/lib/server/machine/pty | wc -l` printed 10), so `capture.ts` cannot join it. Proposed split, a move of files and importers the write list does not name:

- New folder `src/lib/server/machine/pty/start/` holding `chat.ts`, `compose.ts` and `context.ts`: what a start runs (the chat start and its portfolio context, the composer's argument vector). Importers found by `grep -rn "from '\./\(chat\|compose\|context\)\.ts'\|pty/\(chat\|compose\|context\)\.ts" src tests`: `routes.ts:34` (chat), `routes.ts:51` (compose), `chat.ts:14` (context, stays relative inside the folder), `tests/routes/sessions/terminal-actions.test.ts:21` (chat); the comments `src/lib/data/helpers/finding-text.ts:5` and `src/routes/api/(sessions)/agents/+server.ts:2` name the paths. The folder then holds seven files plus `start/` (8 items).
- New file `src/lib/server/machine/pty/capture.ts` (9 items) taking from `sessions.ts` what reads and shapes the pane's screen: `captureArgs`, the three new argument builders, `PANE_MODES` with its comment, `cursorArgs`, `fieldsOf`, `isWhole`, `modesAt`, `screenAt`, `alternateAt`, `alternateScreenAt` and the two types. `scrollback` stays in `sessions.ts` and imports `captureArgs`; `SCROLLBACK_LINES` (the default of `captureArgs`) moves with it or is passed in, which the split decides. `channel.ts` and `DESIGN.md:375` change their imports and file names.
- The lazy options: shortening comments, compacting code, or moving `alternateAt` and `alternateScreenAt` into `channel.ts` (`channel.ts` has the room, 720 lines) while the field order they read stays in `sessions.ts`'s `cursorArgs`. The last splits one format between two files, so it is not recommended.

### Ruling B: case 9's rule, "an empty `-q -a` answer means the editor left"

Run on tmux 3.7c on a private server (script in the session scratchpad, `tmux -L q123c... -f /dev/null`, killed after; `list-sessions` afterwards printed `no server running`). After the editor left (`\u001b[?1049l`) `capture-pane -p -e -q -a` answers `"\n"`, and with a normal screen that is entirely blank while the editor is in its alternate screen it answers `pane_height` newlines:

```
height=10 left=0 alternate_on=1 -q -a -> "\n\n\n\n\n\n\n\n\n\n"
height=10 left=1 alternate_on=0 -q -a -> "\n"
height=1  left=1 alternate_on=0 -q -a -> "\n"
height=3  left=1 alternate_on=0 -q -a -> "\n"
```

The code in the worktree implements the brief's rule (`saved === ''` in `#alternateCaptures`, `channel.ts`), which on tmux 3.7c never fires: an editor that left between the reads would be sent as a shell text of one blank line plus the shell's screen in the alternate buffer. The test row for case 9 answers `''` as the brief says, so it passes and does not exercise tmux's real answer. Options:

1. The saved screen counts as gone when it has fewer lines than `#{pane_height}` (a gone answer has one line; a real saved screen has `pane_height` lines, blank ones included). Correct for every height but 1, where a gone answer and a blank saved screen are the same text and the result is a blank shell row plus the alternate buffer. Recommended; the test row then answers `"\n"` on a 6-row pane.
2. Gone when the answer is blank (`trim() === ''`). Misreads a real blank normal screen (`clear; vim`, a common start) as gone, so such an editor is sent as plain text in the normal buffer, which is today's behaviour.
3. Read `#{alternate_on}` once more after the `-a` capture. Adds a call the brief's order does not have and still leaves the gap between that read and the alternate capture.

The lazy option is 2 (a blank-trim test, cheapest, wrong for `clear; vim`) or keeping the rule as the brief states it (a check that never fires).

## The cases' first run

The first runs were made on the unchanged `src` with the two tests written first (`tests/server/machine/pty/channel.test.ts`, the `describe('a page that attaches', ...)`), `npx vitest run tests/server/machine/pty/channel.test.ts --reporter=verbose`, last lines `Test Files  1 failed (1)` and `Tests  3 failed | 8 passed (11)`:

1. G51, modes set: passes (`ok ... after the screen: 'bracketed paste, application cursor k...'`).
2. G51, no mode set: passes (`ok ... after the screen: 'no mode set'`).
3. Malformed answers, `node --experimental-strip-types -e "import('./src/lib/server/machine/pty/sessions.ts')..."`, on the unchanged tree: well-formed answer `"\u001b[?2004h\u001b[?1h"` and `"a\u001b[4;3H"`; a missing flag gave modes `""` and screen `"a\u001b[4;3H"`; one extra flag gave `""` and `"a\u001b[4;3H"`. The reader of the alternate fields does not exist on the unchanged tree, so the third part (alternate_on 1 with a history that is not a whole number) was not run there. Not re-run after the change: not verified.
4. G52, alternate on with history: fails on the unchanged tree. The failing line is `tests/server/machine/pty/channel.test.ts:336:70`, `AssertionError: expected 'the pane as it stands\u001b[2;10H\u00...' to be 'shell 1\r\nshell 2...'` (quoted from the failure of rows 5 and 6 below; this row failed at the same `expect` in the same `it.each` body, its own message was cut off in the run's output).
5. G52, alternate on with no history: fails at `channel.test.ts:336:70`, `expected 'the pane as it stands\u001b[2;10H\u00...' to be 'shell 1\r\nshel...'`.
6. G52, alternate on with no saved cursor: fails at `channel.test.ts:336:70`, `expected 'the pane as it stands\u001b[2;10H\u00...' to be 'history 1\r\nhistory 2\r\nhistory 3\r...'`.
7. G52, alternate off: passes (`ok ... 'alternate off'`).
8. G52, `alternate_on` unreadable: passes (`ok ... 'alternate_on unreadable'`).
9. G52, the editor gone before the `-a` capture: passes on the unchanged tree. The brief's rule is wrong for this case on tmux 3.7c (Ruling B).
10. Real private tmux server, `tmux -V` printed `tmux 3.7c`, a 40x6 pane. Run with the new argument builders from the worktree's `sessions.ts` (the unchanged tree has no builders for them), fields in the order cursor_x cursor_y pane_height alternate_on saved_x saved_y history_size and the eleven flags:
    - 1049 with history: `"3 0 6 1 11 5 15 0 1 0 1 0 0 0 0 0 1 1\n"`; history `"hist 1\n" ... "hist 15\n"`; saved normal screen `"hist 16\nhist 17\nhist 18\nhist 19\nhist 20\n$ vim a.txt\n"`; alternate screen `"editor row 1\neditor row 2\n\n\n\n\n"`.
    - 1049 with no history: `"3 0 6 1 11 2 0 0 1 0 1 0 0 0 0 0 1 1\n"`; the history range answers `"editor row 1\n"` (the alternate screen's top row, as the brief says); saved `"shell one\nshell two\n$ vim a.txt\n\n\n\n"`.
    - 47 and 1047 with history: `"3 0 6 1 4294967295 4294967295 15 ..."`, history, saved and alternate screens as for 1049.
    - After the editor left: `"11 5 6 0 11 5 15 ..."` (alternate_on 0), history the same 15 lines, saved `"\n"` (not `''`), the plain capture is the shell's own screen.
    The saved screen is the shell's screen, the history range is the shell's history, the plain capture is the editor's screen, as the brief states, except the empty answer.
11. 'a socket that closed': passes on the unchanged tree (`ok a socket that closed > stops the delivery and leaves the tmux session alone`).

After the change in the worktree (code as the brief states it, `saved === ''`): `npx vitest run tests/server/machine/pty/channel.test.ts --reporter=verbose` printed `Test Files  1 passed (1)` and `Tests  11 passed (11)`. That run does not exercise tmux's real answer for case 9.

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1 display-message answer, `modesAt`, `screenAt`, `alternateAt` | built, doc comments of those four written | `channel.test.ts` 11 passed |
| 2 tmux calls and order | built in `channel.ts` `#attach` and `#alternateCaptures`; the gone rule needs Ruling B | 11 passed; 'a socket that closed' passes |
| 3 message for the alternate screen | built (`alternateScreenAt`) | rows 1 to 3 of G52 pass |
| 4 size of `sessions.ts` | NOT DONE, 940 lines | `wc -l` prints 940 |
| 5 G51 test | done | two rows pass |
| 6 G52 test | six rows written; row 6 answers `''` and needs Ruling B | six rows pass |
| 7 fixture from `cursorArgs(ID).at(-1)` | done (`answerWith`, `driver({ answer, captures })`) | same run |
| 8 DESIGN.md:375, HELP.md:147, comments over `PANE_MODES` and in `#attach` | NOT DONE (`#attach`'s doc and inline comments are rewritten for the alternate screen; DESIGN.md, HELP.md and the `PANE_MODES` comment are not touched) | not verified |
| `npm run test:quick`, unused-exports, ASCII gate, history grep, `folder-check.sh` | NOT DONE | not run |

## G51 and G52 test lines

- G51: `Test: tests/server/machine/pty/channel.test.ts, 'gives an attaching page the modes the pane's program set, after the screen'`.
- G52: `Test: tests/server/machine/pty/channel.test.ts, 'gives an attaching page a pane's shell text, then the alternate buffer with the editor's screen'`.

## Files (`diff -rq` against the base copy, over `src` and `tests`)

- `src/lib/server/machine/pty/channel.ts`, 720 lines (base 678).
- `src/lib/server/machine/pty/sessions.ts`, 940 lines (base 852).
- `tests/server/machine/pty/channel.test.ts`, 339 lines (base 183).

All three are on the write list. No other path changed.

## Judgment calls (reversible)

- `screenAt` reads the first three fields and ignores the rest; it used to refuse an answer whose tail held anything but `0` or `1` fields. `modesAt` still requires exactly the eleven `0`/`1` flags after the seven leading fields.
- `alternateAt` treats either saved field equal to 4294967295 as no saved cursor.
- An error in one of the three alternate reads is logged (`pty: no alternate screen for <id>, the whole capture is sent`) and sends today's message.
- The test fixture's `driver()` takes `{ answer, captures }`; the other tests keep `'0 0 1\n'` and `SCREEN`.

## Limitations known

- If the editor leaves after the `-q -a` read and before the alternate capture, the plain capture is the shell's own screen and the page is given the shell's text twice with its grid left in the alternate buffer; the editor's `\u001b[?1049l` is not in the attach message. Not fixed, not measured.
- A 1-row pane whose editor left reads as a blank saved screen under Ruling B option 1.

## Text that describes the attach (still true or rewritten)

- `channel.ts` `#attach` doc comment and the cursor comment: rewritten.
- Doc comments of `cursorArgs`, `modesAt`, `screenAt`: rewritten.
- `DESIGN.md:375`, `HELP.md:147`, the comment over `PANE_MODES`, `pty-subscribe.ts:1-6`: not re-read after the change; `pty-subscribe.ts:1-6` names `screenAt` of `sessions.ts`, which changes with Ruling A.

## Anything in the brief that was wrong

- Item 4's premise held (940 > 880), so the hand-back is the brief's own path.
- Case 9 and item 2's "an empty answer means the editor left between the reads": wrong on tmux 3.7c, see Ruling B.
