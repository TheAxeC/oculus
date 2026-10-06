# Q123: rulings on the builder's hand-back (round 0)

Ruled by the orchestrator (automode), 2026-10-06, on the hand-back in `agents/reviews/Q123-report.md`. Each ruling stays inside the step's part.

## Ruling A: the size of `sessions.ts`

`sessions.ts` is 940 lines after the additions (`wc -l`), past the 880 limit, and `src/lib/server/machine/pty/` holds 10 items (`ls | wc -l`), so the brief's item 4 applies. The split the builder proposed is ruled as written:

- A new folder `src/lib/server/machine/pty/start/` holds `chat.ts`, `compose.ts` and `context.ts`, moved unchanged apart from their import paths.
- A new file `src/lib/server/machine/pty/capture.ts` holds the screen readers and argument builders taken out of `sessions.ts`: `captureArgs`, the three new argument builders, `PANE_MODES` with its comment, `cursorArgs`, `fieldsOf`, `isWhole`, `modesAt`, `screenAt`, `alternateAt` and `alternateScreenAt`, with their types. `scrollback` stays in `sessions.ts`.
- Every importer and every comment or document that names a moved file or symbol by path is carried: `routes.ts:34` and `:51`, the moved `chat.ts:14`, `channel.ts`, `tests/routes/sessions/terminal-actions.test.ts:21`, `tests/server/machine/pty/sessions.test.ts` where it imports a moved symbol, the comments at `finding-text.ts:5`, `src/routes/api/(machine)/agents/+server.ts:2` and `pty-subscribe.ts:4`, `DESIGN.md:375`, and any other hit of `grep -rn "pty/chat\|pty/compose\|pty/context\|captureArgs\|cursorArgs\|PANE_MODES\|screenAt\|modesAt" src tests utils DESIGN.md HELP.md`, each listed in the report.
- Each file keeps its layer head comment; `capture.ts` gets one that says what it holds. `pty/start/` holds 3 items and `pty/` 9 after the move (`sh utils/folder-check.sh` exits 0). `npm run diagrams` is run, and `docs/diagrams/` changes only by what the move redraws.
- These paths join the write list. Comments are not shortened and code is not compacted to fit.

## Ruling B: an editor that left between the reads (case 9)

On tmux 3.7c, `capture-pane -p -e -q -a` answers `"\n"` once the program has left its alternate screen, and a normal screen left entirely blank answers `#{pane_height}` lines, so the brief's `saved === ''` never fires on real tmux. Ruled:

1. The `-q -a` answer means the program has left when it holds fewer lines than `#{pane_height}` (the builder's option 1). The case 9 row of G52's table answers `"\n"`, the form tmux 3.7c gives, quoted from the builder's case 10 run.
2. The race the builder named (the program leaves after the `-q -a` read and before the alternate capture, and the page gets the shell's text twice with its grid left in the alternate buffer) is closed too: when the first read said alternate on, `#{alternate_on}` is read once more after the alternate capture, and when it reads 0 the page gets the normal attach message, built from a fresh capture as the default state builds it. In the default state (alternate off) the calls and their order stay as the brief gives them. A row of G52's table covers this case, its stub answering alternate on, then the captures, then alternate off, and the row asserts the page is given no `\u001b[?1049h`. The row is run on the unchanged `src` first, and its failure quoted.
3. Option 2 (gone when the answer is blank) is the lazy option: it misreads `clear; vim` as gone.

The builder then finishes every item the hand-back left: DESIGN.md:375, HELP.md:147, the `PANE_MODES` comment, `npm run test:quick`, the unused-exports comparison, the ASCII gate, the history grep and the report, as the brief's "Verify before you report" says.
