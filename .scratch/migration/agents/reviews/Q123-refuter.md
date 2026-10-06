# Q123 refutation report

Reviewer of step Q123 (oculus/migration). Worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q123`, base a686df2ad. No file in the worktree or the ledger was changed. Scratch files (probe scripts, a scratch copy of the base) are only in my session scratchpad. Every tmux server I started was my own `tmux -L q123...` server, and each was killed: each probe printed `no server running on /private/tmp/tmux-502/q123...`.

**Main finding: B1, a behaviour defect that is visible on screen.** When a page attaches to a pane in its alternate screen, the editor's top row is drawn shifted right by the column of the shell's saved cursor. If the shifted row no longer fits the pane width, it wraps and the whole editor screen moves up one row. The code does what the brief's item 3 specified. The defect is in that specification. The fix is small and can be made at landing (details under Behaviour).

All checks I reran are green. The builder's quoted evidence reproduces.

## Verdicts on "What to build"

1. **The display-message answer: holds.**
   - `capture.ts:77-87` asks `#{cursor_x} #{cursor_y} #{pane_height} #{alternate_on} #{alternate_saved_x} #{alternate_saved_y} #{history_size}` and then the flags.
   - `modesAt` (`:111`), `screenAt` (`:130`) and `alternateAt` (`:153`) each read their fields by position.
   - An `alternate_on` that is a word or an empty field still gives the cursor and the modes (case 3 run below).
2. **The tmux calls and their order: holds.**
   - Default state: the order is `captureArgs`, then `cursorArgs`, with the same arguments as on the base. `#readPane` is at `channel.ts:658-667`.
   - Alternate state (`channel.ts:674-698`): history `-p -e -S -N -E -1` (skipped when the history size is 0), then `-p -e -q -a`, then `-p -e`, then Ruling B's second `#{alternate_on}` read.
   - The membership check (`channel.ts:625`) comes after the last read, including the read made again after a program left.
3. **The message for a pane in its alternate screen: holds as the brief specified it** (`capture.ts:192-203`). The bytes the brief specified carry defect B1.
4. **The size of `sessions.ts` and the folder split: holds under Ruling A.**
   - `wc -l`: `sessions.ts` 779, `channel.ts` 748, `capture.ts` 203.
   - `sh utils/folder-check.sh` exits 0. `pty/` holds 9 items and `start/` holds 3.
   - The moved files differ from the base only in their import lines (`diff` of each base file against `start/<file>`).
5. **G51's test: holds.** `channel.test.ts:241-259` has two rows with the brief's title, followed by `: $row`.
6. **G52's test: holds.** It has seven rows: the brief's six, with case 9 answering `"\n"` as Ruling B says, and Ruling B's race row.
7. **The fixture: holds.**
   - `answerWith` builds the answer from `cursorArgs(SESSION).at(-1)` (`:51-55`).
   - The captures are a function of the argument list (`:58`, `:286-294`).
   - The other tests keep `'0 0 1\n'` and `SCREEN`.
8. **The text the change touches: holds.** `DESIGN.md:375`, `HELP.md:147`, the `PANE_MODES` comment and the `#attach` comments are rewritten. The minor issues are S1 to S3.

## Verdicts on "Cases"

1. G51, modes set: **met.** Passes on the base source and after.
2. G51, no mode set: **met.** Passes on both.
3. Malformed answers: **met** (my run is below).
4. G52, alternate on with history: **met.** Fails on the base, passes after.
5. G52, no history: **met.** Fails on the base, passes after.
6. G52, no saved cursor: **met.** Fails on the base, passes after.
7. G52, alternate off: **met.** Passes on both.
8. G52, `alternate_on` unreadable: **met.** Passes on both.
9. G52, the editor gone before the `-q -a` capture: **met** under Ruling B (`"\n"`). Passes on both.
10. Captures on a real tmux server: **met.** My own probe reproduces every structural claim.
11. 'a socket that closed': **met.** Passes after the change, and in the base-source run.
12. Ruling B's race row: **met.** Fails on the base, passes after.

### Evidence

**Unchanged-source run.** I made a scratch copy in my scratchpad: the base's `src` and `tests`, the worktree's final `channel.test.ts` with only its import pointed at `sessions.ts`, and `cursorArgs(ID)`. The only differences from the worktree test were those two lines (shown by `diff`). `npx vitest run tests/server/machine/pty/channel.test.ts --reporter=verbose` gave:
- `Tests  4 failed | 8 passed (12)`.
- The rows that failed: 'alternate on, with history', 'alternate on, no history', 'alternate on, no saved cursor' and 'the editor gone after the alternate s…'.
- Each failed at `channel.test.ts:352:86`, for example `expected 'the pane as it stands\u001b[2;10H\u00…' to be 'history 1\r\nhistory 2\r\nhistory 3\r…'`.

This is identical to the report.

**After the change**, the same command in the worktree printed `Tests  12 passed (12)`.

**Case 3** (`node --experimental-strip-types -e` over `capture.ts`):
- Well-formed answer: `"\u001b[?2004h\u001b[?1h" "a\u001b[4;3H" null`.
- Missing flag: `"" "a\u001b[4;3H" null`. Extra flag: the same.
- History as a word, saved column as a word, an empty saved row, `alternate_on` `yes` or empty: `alternateAt` printed `null`, and the modes and the placement still read.
- A good alternate answer gave `{"height":6,"history":13,"saved":{"column":1,"row":5}}`.
- 4294967295 gave `"saved":null`.
- `holdsSavedScreen`: 6 lines `true`, `"\n"` `false`.
- The line that sends today's message is `channel.ts:631-634`.

**Case 10** (tmux 3.7c, my own server):
- With 1049 and history, the answer was `"4 1 6 1 0 5 16 ..."`. The history range was the shell's history, the `-q -a` capture was the shell's screen (no overlap with the history), and the plain capture was the editor's screen.
- With real `vim -u NONE -N` and no history: `"0 0 6 1 0 1 0 ..."`, and the history range answered `"\n"` (the alternate screen's top row).
- With 47 and 1047: `4294967295 4294967295`.
- After the program left: `-q -a` gave `"\n"` and `alternate_on` gave `"0\n"`.

**The written message.** I wrote the message into a fresh 40x6 pane of a second private tmux pane, standing in for the grid. For a saved column of 0:
- The editor was drawn full screen.
- After `\u001b[?1049l`, the shell's text was back and the cursor was at the shell's saved position (`0 5`, `0 1`, `8 1` for the three real-vim runs).

So Z621's behaviour holds when the saved column is 0.

## Checks rerun

All from the worktree's `tools/oculus`.

- `npm run test:quick -- --base a686df2ad`:
  - `ok prettier`, `ok ASCII gate`, `ok svelte-kit sync`, `ok eslint (69.3 s)`, `ok svelte-check (67.0 s): ... 0 ERRORS 0 WARNINGS`, `ok vitest (84.5 s)`.
  - `test:quick: 87.8 s (limit 45.0 s); every command passed`, `test:quick: over the time limit`. The load average was 18, and exit status is 0 when only the time limit is exceeded (`quick.mjs:282-285`).
- `npx vitest run tests/server/machine/pty tests/routes/sessions`: `Test Files  8 passed (8)`, `Tests  49 passed (49)`.
- `npx vitest run tests/checks/tree tests/checks/imports`:
  - Together, four tests in three files timed out at 5000 ms under load.
  - Each file run alone passed: `cycles.test.ts` 7 passed, `order.test.ts` 13 passed, `boundaries.test.ts` 11 passed.
  - This is load, so it is not counted (`spec.md:74`).
- The diagrams check, `diagrams.test.ts -t "are what the source gives now" --testTimeout=120000`: `1 passed`. The longer timeout was only for my run under load. I did not run `npm run diagrams`, because it writes files.
- Unused exports: `sh utils/unused-exports.sh` diffed against `Q123-base/unused-exports.txt`. The only changes are the `chat.ts` and `compose.ts` lines moving to `start/`. No line was added.
- The ASCII gate of `spec.md:97` printed nothing (exit 0). `LC_ALL=C grep -n '[^ -~]' DESIGN.md HELP.md` gives 0 hits.
- The moved-name grep (`pty/chat|pty/compose|pty/context|captureArgs|cursorArgs|PANE_MODES|screenAt|modesAt` over src, tests, utils, DESIGN.md, HELP.md, README.md) gives the same hits the report lists. A wider grep for `pty/(start/)?(chat|compose|context)` found every importer and comment carried.
- History-word grep over added lines: every hit (`again`, `no longer 1`, `before` used for an order) describes runtime state or an order of operations. None is history.

## Findings

### Spec
None. Every path outside the original write list is one of Ruling A's paths.

### Proof

**P1. G52's table pins B1's bytes** (`tests/server/machine/pty/channel.test.ts:262-276`, `:296-300`).
- The hunk: `alternate_saved_x: '1', ... expected: crlf(HISTORY + SHELL) + '\u001b[6;2H\u001b[?1049h' + PLACED_EDITOR + MODES`.
- The rows assert a message that, written into a grid, draws the editor's first row from column 2.
- Failure scenario: the test stays green over B1. When B1 is fixed, rows 1 to 3 change to expect `\u001b[?1049h\u001b[H`.

**P2. The report's first line is inaccurate** (`Q123-report.md:1`).
- The hunk: "One thing was not measured: the check run time."
- The run time was measured (171.6 s) and was over the 45 s limit. The line should say so.
- This is a wording issue in the report only. No decision rests on it.

### Standards

**S1. Comment lines over 100 columns** (`spec.md:43`).
- `capture.ts:2,3,5,9,10,12` (101 to 103 characters), `channel.ts:652` (101), `channel.test.ts:87` (102), measured with `awk 'length > 100'`.
- Prettier does not rewrap comments, so its check does not catch these.

**S2. A reason in `#alternateCaptures`' doc comment that does not hold** (`channel.ts:674`).
- The hunk: "read after the cursor so the cursor is the one of the screen read last".
- tmux reports the active screen's cursor whatever the read order. The order makes the cursor older than the alternate capture, which is the brief's "output between the reads" note.
- A reader is told a false reason for the order.

**S3. A fixture comment that describes only the default** (`channel.test.ts:71`).
- The hunk: `// The pane the one-line screen above is: one row high, the cursor at its start.` above `const cursor = options.answer ?? ONE_ROW;`.
- The cursor now comes from `options.answer` when one is given. `ONE_ROW` (`:41`) already says what the default is.

### Behaviour

**B1. The editor's top row is drawn shifted when the shell's cursor was not at column 1** (`capture.ts:202`).
- The hunk: `` return `${shell}\u001b[?1049h${program}${modesAt(answer)}`; ``
- The cause:
  - `\u001b[?1049h` saves the cursor and switches buffers, but does not move the cursor. In xterm.js 6.0.0, `InputHandler.ts:1959-1963` calls `saveCursor()` and then `activateAltBuffer`, and `BufferSet.ts:106-107` sets `this._alt.x = this._normal.x; this._alt.y = this._normal.y`.
  - So the alternate capture is written starting at the shell's saved cursor.
  - Writing exactly `pane_height` lines always ends with those lines on rows 1 to H. But the first line starts at the saved column, and it wraps when it is too long, which scrolls every row up by one.
- Reproduced with real vim (`printf 'prompt> '; vim -u NONE -N <file>` on a 40x6 pane, saved column 8). The message written into a fresh 40x6 pane of my private server showed `"        first line of the file\nsecond line..."`, while the pane itself showed `"first line of the file\nsecond line..."`.
- Synthetic captures with saved column 11 and a 35-character top row gave a top row of `"acters"`: the row wrapped and its start scrolled out.
- The same happens with no saved cursor (47 or 1047) when the shell's last row is not blank.
- The builder's own case-10 run measured a saved column of 11, and the brief check measured 1. So a non-zero column is common: a program entered from the middle of a prompt line, for example zsh's edit-command-line or a full-screen fzf widget.
- Failure scenario: the page reloads while `$EDITOR` is open from such a prompt. The editor's first row is drawn offset, or the whole screen is off by one row, until the editor redraws those rows. G52's "the program draws full screen" is not met.
- Fix: send `\u001b[H` right after `\u001b[?1049h`. `screenAt` then places the editor's cursor absolutely. Update G52 rows 1 to 3 and the item-3 wording in `DESIGN.md:375` to match. The second read of `alternate_on` (Ruling B) and the default state are unaffected.

None other found.
- The default state's calls, order and bytes are unchanged: the 'alternate off' row passes on both, and 'a socket that closed' passes.
- Ruling B's race is closed by the second `#{alternate_on}` read: `channel.ts:690` returns `LEFT`, and `:620-622` reads the pane again.
- A one-row pane, which `holdsSavedScreen` misreads, is caught by that second read.

## G51 and G52 tests, read

- **G51** (`:241-259`): the first row fails if the modes are dropped or written before the screen, because it asserts the exact bytes `PLACED + modes`. The second row fails if a sequence is sent for a flag at its reset value.
- **G52** (`:302-353`), each row checked against the behaviour it guards:
  - Rows 1 to 3 fail without the alternate path.
  - Row 2 fails if the history read is not skipped: the stub answers the editor's top row, as tmux does.
  - Row 3 fails without the 4294967295 check.
  - Rows 4 and 5 fail if the default message changes.
  - Row 6 fails without `holdsSavedScreen`: the flow would go on and send `\u001b[?1049h`.
  - Row 7 fails without the second read, or without the fresh capture (it expects `AFTER`, not `SCREEN`).
  - Not covered by any row: the `-q` flag in `savedScreenArgs`. The stub answers `-a` the same with or without `-q`.

## Declined to judge

- **xterm.js itself on screen.** I confirmed B1 by reading xterm.js 6.0.0's source and by using a tmux pane as the stand-in grid, not in a browser. The look on TEST settles it.
- **Background colour after the switch.** Whether a `-e` capture whose last line leaves a background colour active fills the cleared alternate buffer with that colour. My probe of it was refused by a safety check and not run. Today's attach message carries the same risk.
- **The report's one-row-pane and blank-ten-row-pane numbers.** Not rerun. No decision rests on them, because the code handles both outcomes.
- **G52's words.** These are Axel's. Z634 (a) is recorded at `plan.md:1381`, and G52 is in `guarded.md`.

## Usage

claude-opus-5-5, about 205,000 tokens, 57 tool uses. Minutes: not measured.
