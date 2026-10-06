# Brief check: Q123

The brief `agents/briefs/Q123.md`, on main at a564e4e29. The checker changed no file in the repository and ran no git command that changes state. It made two private tmux servers (`tmux -L q123check-<pid> -f /dev/null`) and killed both; `tmux -L <name> list-sessions` prints "no server running" for each, and their two empty socket files remain in `/private/tmp/tmux-502/`.

`plan.md` has no Goal section; the goal was taken from the step line and Z621.

## Names

Command: `grep -rn -E "cursorArgs|captureArgs|modesAt|screenAt|PANE_MODES|scrollback\(" tools/oculus --exclude-dir=node_modules --exclude-dir=.scratch ...`, plus `grep -rn "display-message\|alternate_on\|'capture-pane'" src tests` and `grep -rln "new Terminals\|Terminals(" src tests`.

1. `DESIGN.md:375` ("A page that attaches is given the pane's whole capture followed by a move to tmux's own cursor (`screenAt` ...) and by the modes ...") becomes false for a pane in its alternate screen, and DESIGN.md is not in the write list.
2. `HELP.md:147`, the terminal row, stays true but does not state the new visible behaviour.
3. `src/lib/state/sessions/terminal/pty/pty-subscribe.ts:1-6` stays true. None of 1 to 3 is listed under "What is on the tree", which the standing demand at `orchestrator-state.md:113` asks for.
4. `tests/server/machine/pty/channel.test.ts:137-141` ('a socket that closed') asserts the tmux call order `['list-sessions','capture-pane','display-message']`; it keeps passing only if the attach keeps that order when `alternate_on` is absent or 0. The brief does not fix the order of the tmux calls in either state.
5. `modesAt` requires exactly `PANE_MODES.length` flags (`sessions.ts:774`), so adding `alternate_on` means `modesAt` must change; the brief should say so. Fixtures answering `display-message`: `channel.test.ts:51` (`'0 0 1'`) and `tests/server/root/context-fixture.ts:25` (`''`); both take the default path.
6. `edit.ts:114-118` (`clearTerminal`) reads `#{alternate_on}` with its own `display-message` (`terminal-edit.test.ts:99-106`); the code will then have two readers of it.
7. `sessions.test.ts:102` calls `scrollback()`, built on `captureArgs` (`sessions.ts:719-726`); it holds while `captureArgs` keeps its shape.
8. `#attach` is reached only through `subscribed` (`socket.ts:114`); `outputArgs`, `captureTask` and `refresh.ts:100` are untouched.
9. Page side: `TerminalGrid.svelte:357-360` resets the grid on version 0; `pty-wire.ts:66`; `commands.svelte.ts:591-593` (`note`) will also read the alternate capture's text, harmlessly.
10. D23 also writes `channel.ts` and `channel.test.ts` (`briefs/D23.md:445, 500`), replacing `subscribed`'s token parameters with `canWrite`; Q123's new tests would call `subscribed` with the old signature, and the step that lands second rewrites them.
11. `sessions.ts` is 852 lines (`wc -l`) against the 880 limit; the additions may need a split into a file the write list does not name.

## The step line

`grep -n "^- Q123" plan.md` prints 639; Z620 at :1363, Z621 at :1364, Z630 at :1370.

1. "a terminal pane attached as its program left it": items 1-3, except the shell's cursor (The question 3, Implied inputs 1).
2. "the guarded entry G51": written at `guarded.md:101-103`. Covered.
3. "its test for the modes": item 1. Covered.
4. "the alternate screen given in the grid's alternate buffer": item 2. Covered.
5. "with the normal buffer's text kept": item 2 and Decision 3; its placement is not covered.
6. Z620: item 1 under G51; Decision 1 puts a second test under the same entry, beyond Axel's words.
7. Z630 says "title", singular; the brief names two.
8. Z621: item 2, except "shows the shell's text again" with the shell's cursor where tmux has it.

## Premises

1. `#attach`: `grep -n "async #attach" channel.ts` prints 579; the doc comment is at 574-578; the order holds (capture :594, cursor :602, `screenAt` :607, CR LF and `modesAt` :616, version 0 :620).
2. `sessions.ts`: `captureArgs` :700, `PANE_MODES` :738-750 with eleven entries, `cursorArgs` :756, `modesAt` :771, `screenAt` :788. Holds.
3. `grep -rn alternate_on src` prints only `edit.ts:115`. Holds.
4. `channel.test.ts`'s `driver()` spans :40-82; `grep -rn "2004\|modesAt" tests` exits 1; only the last describe of `sessions.test.ts` is tagged slow (`:47`).
5. G51 at `guarded.md:101-103`. Holds.
6. The brief names no worktree, no base copy and no `unused-exports.txt` (`spec.md:31-32`, `:83`).
7. "the filter the rules file names": `grep -n -i "filter\|pipe" agents/spec.md` prints nothing.
8. The brief calls `agents/guarded.md` "the configuration's `standards` list"; `orchestrator-state.md:12` lists only `agents/spec.md`, `.agents/plan.yaml:8` `standards: []`.

## Cases and checks

1. Decision 1 (the alternate-screen test under G51) does not fit G51's words: G51 guards input reaching the program, the test guards Z621's display. Keys go to the pty whichever buffer the grid shows; the one input effect of the buffer is xterm.js turning the wheel into arrow keys in a buffer without scrollback (`node_modules/@xterm/xterm/src/browser/CoreBrowserTerminal.ts:814-818`). Z620 and Z630 make the entry's words Axel's, and `spec.md:57` says a step needing a new entry stops and asks Axel. Options: (a) widen G51's words; (b) a new entry for Z621; (c) leave it as the brief has it.
2. Two `it`s under one entry for one unit break the test rule (`spec.md:57`, `guarded.md:3`: one test per unit, a table where a unit has several outcomes).
3. Case 2 is checked by a run that cannot exercise it: the other tests answer `'0 0 1'`, where `modesAt` returns `''` because the flag count does not match, not because the flags are at reset.
4. Case 1's "passes on the unchanged tree" conflicts with case 3: after the change the realistic answer has twelve fields. One way: build the fixture answer from `cursorArgs(ID).at(-1)` by replacing each `#{name}` with its value.
5. Case 6's pass on the unchanged tree cannot be observed: it is the second assertion of the `it` whose first (case 4) fails there.
6. Item 3's "two different captures" does not fit tmux: with the alternate screen on, the normal screen with its history needs two captures, the history alone and `-a`.
7. Cases 3, 5 and 7 by quoted runs is allowed; case 3's command works on main: `node --experimental-strip-types -e "import('./src/lib/server/machine/pty/sessions.ts')..."` printed `"\u001b[?2004h\u001b[?1h" "a\u001b[1;1H"`.
8. No case asks the builder to check a place the step does not change.
9. The visible change needs the look at landing (`spec.md:58`); the brief does not name its state (vim open, a reload, `:q`, then the shell's text and the prompt's row).

## The question

Read: `TerminalGrid.svelte:354-369` (`term.reset()` at :358 before `term.write`), `pty-wire.ts:66`, and xterm.js 6: `common/InputHandler.ts:1959-1967` and `:2187-2196`, `common/buffer/BufferSet.ts:38-48`, `:78-112`, `common/CoreTerminal.ts:244-250`. The reset makes a fresh normal buffer active; `ESC[?1049h` saves the cursor and activates the alternate buffer, leaving the normal one; on `ESC[?1049l` the normal buffer returns and `restoreCursor` runs. The cursor restored is where writing the normal capture ended, not where tmux has the shell's cursor.

1. Case 1: cannot pass without its part of the goal, apart from the fixture shape (Cases 4).
2. Case 2: passes without being exercised (Cases 3).
3. Case 4: could pass without the goal: (a) the recording driver answers whatever captures the test chooses, so real-tmux correctness rests on case 5's run; (b) the dictated order ends the normal capture with CR LF before the switch, which scrolls the grid one row and saves the cursor at column 0 of the row below; tmux has the shell's cursor at `#{alternate_saved_x}`, `#{alternate_saved_y}` (`sx=1 sy=5` on a 6-row pane), so after the editor exits the shell continues from a different row; a byte-for-byte test of that sequence would encode a defect (`spec.md:16`, `:59`); (c) the alternate capture's line breaks are not stated.
4. Case 5: checks the captures on real tmux only for a pane with history, and not the grid after the editor exits.
5. Case 6: a real check, apart from its position (Cases 5).
6. Case 7: cannot pass without its fallback.
7. Verify item 2 inherits the gaps of cases 1 and 4.
8. Nothing checks the page after the editor exits; only the look at landing can.

tmux 3.7c (`tmux -V`), a 40x6 pane, 8 echo lines, then `printf 'X\033[?1049h\033[HALT-ROW-1\r\nALT-ROW-2'; sleep 30`:

- `alt=1 sx=1 sy=5 cx=9 cy=1 h=6 hist=13`.
- `capture-pane -p -e -S -2000` (today's `captureArgs`) gives the history followed by the alternate rows.
- `capture-pane -p -a` gives the six saved normal rows; `-a -S -2000` gives the same (`-a` ignores `-S`).
- `capture-pane -p -S -2000 -E -1` gives the history only, joining `-a`'s first row without a gap.
- `capture-pane -p` gives the alternate screen alone.

## Implied inputs

1. The shell's cursor after the editor exits: place the normal capture at `#{alternate_saved_y}+1;#{alternate_saved_x}+1` with its final newline dropped, before `ESC[?1049h`, reading the two `alternate_saved` fields in the same `display-message`.
2. An editor using 47 or 1047: `alt=1 sx=4294967295 sy=4294967295` for both; expected the same message with `ESC[?1049h`, with 4294967295 read as no saved cursor and a fallback.
3. A pane with no history: with `hist=0`, `capture-pane -p -e -S -2000 -E -1` printed `ALT\n`, the alternate screen's top row; expected no history capture when `#{history_size}` is 0.
4. The editor exits between `display-message` and the `-a` capture: `capture-pane -p -a` printed "no alternate screen", exit 1; `-q -a` printed an empty line, exit 0; expected the default message.
5. `this.#lines` (`channel.ts:338`) bounds the history capture.
6. A reconnect in the alternate screen rebuilds both buffers as a first attach; no case needed, the report may say so.
7. A resize between the captures: `screenAt` places by the old height; the editor redraws on SIGWINCH.
8. A socket that closes during the extra captures: the membership check (`channel.ts:605`) comes after the last capture.
9. Output between the reads: the order of the reads decides which rows can be stale (`channel.ts:599-600`).

## ADRs

`ls tools/oculus/docs/adr` fails; `find . -maxdepth 4 -type d -iname "adr*" -not -path "*/node_modules/*"` prints nothing; `grep -n "adr" .agents/plan.yaml` exits 1. None.

## Dictated text

1. `describe('a page that attaches', ...)` (`grep -n` prints 27): holds.
2. 'gives an attaching page the modes the pane's program set, after the screen' (27): holds.
3. 'gives a pane in its alternate screen the shell's text, then the alternate buffer with the editor's screen' (35): breaks "a test title that says the behaviour" (`spec.md:42`); suggested 'gives an attaching page a pane's shell text, then the alternate buffer with the editor's screen'.
4. The sequence "the normal capture with CR LF line breaks, then `ESC [ ? 1049 h` ..., then the alternate capture placed at the cursor by `screenAt`, then `modesAt`" (31, also 35, 43, 75): breaks `spec.md:16` and `:59` once pinned byte for byte (The question 3), and leaves the alternate capture's line breaks unstated.
5. `LC_ALL=C grep -n '[^ -~]' briefs/Q123.md` exits 1.

## Declined to judge

1. How visible the cursor misplacement is after a real vim exit in oculus; the look at landing settles it.
2. Whether macOS vim's exit sequence under oculus's TERM is 1049 or 47/1047.
3. How simply D23 and Q123 merge in `channel.ts` and `channel.test.ts`.
4. Which of G51's options is better beyond the rule reading; the words are Axel's.

Usage: aa96e2257854c7ff2, claude-opus-5-5, 181,338 tokens, 47 tool uses, 9.0 min.

## Closed

Every finding is closed by a change to `agents/briefs/Q123.md`, under the orchestrator's rulings 1 to 11. Line numbers written into the brief were checked on main at 5896cf9b1 with `grep -n` and `sed -n`; `git diff --stat a564e4e29 HEAD -- tools/oculus/src tools/oculus/tests tools/oculus/DESIGN.md tools/oculus/HELP.md tools/oculus/utils` prints nothing. One number moved from the report: the membership check is `channel.ts:606` (`grep -n "has(sink)) return" channel.ts` prints 606), and the brief carries 606. `LC_ALL=C grep -n '[^ -~]' briefs/Q123.md` exits 1.

### Names

1. DESIGN.md:375: joins the write list as `tools/oculus/DESIGN.md:375`; item 8 says what the attach sends in both states; listed under "What is on the tree".
2. HELP.md:147: joins the write list as `tools/oculus/HELP.md:147`; item 8 gives the clause on an editor drawn full screen after an attach and the shell's text back on exit.
3. The describing text unlisted: "What is on the tree" lists DESIGN.md:375, HELP.md:147, `pty-subscribe.ts:1-6`, the comment over `PANE_MODES` and the comments in `#attach`, each to be marked still true or rewritten; the Report section asks for that list.
4. The tmux call order: item 2 fixes the order in the default state (`list-sessions`, `capture-pane`, `display-message`, `channel.test.ts:137-141`) and in the alternate state; case 11 runs 'a socket that closed' before and after.
5. `modesAt` must change: item 1 says `modesAt` and `screenAt` change to read their parts of the longer answer, each field by its position; `context-fixture.ts:24` (the report's :25 is :24, `sed -n 20,30p`) is named as answering `''`.
6. Two readers of `alternate_on`: "What is on the tree" names `edit.ts:114-118` as a second reader, unchanged.
7. `scrollback` over `captureArgs`: "What is on the tree" names `scrollback` and `sessions.test.ts:102`; `captureArgs` keeps its shape.
8. `#attach` reached only through `subscribed`: added to the attach's bullet with `socket.ts:114`.
9. The page side: the page bullet names `pty-wire.ts:66`, `TerminalGrid.svelte:358` and `note` in `commands.svelte.ts:591-594`, unchanged; `TerminalGrid.svelte:354-369` joins the read list.
10. D23: a new "Shared paths" section says D23 replaces `subscribed`'s token parameters with `canWrite`, the step that lands second rewrites the other's calls, and the orchestrator judges the merge at D23's /spec.
11. `sessions.ts` at 852: item 4 carries ruling 6 (a split into `src/lib/server/machine/pty/capture.ts` past 880, comments not shortened). The ruling's path does not fit the folder rule: `git ls-files src/lib/server/machine/pty` lists ten items and `spec.md:46` refuses an eleventh. Item 4 therefore has the builder measure first and, past 880, stop before moving any file and hand back the count with a proposed folder split, which the orchestrator rules into the write list. Raised to the orchestrator in the hand-back.

### The step line

1. The shell's cursor: item 3 places the normal capture at `alternate_saved_y+1;alternate_saved_x+1`.
2. G51: unchanged, covered.
3. The test for the modes: item 5, covered.
4. The alternate buffer: items 2 and 3.
5. The placement of the normal buffer's text: item 3, with its final newline dropped and the saved cursor placed.
6. Z620 and a second test under G51: the alternate-screen test moves to a proposed G52 (Decision 1, the open item).
7. Z630's "title": one title per entry, G51's and G52's, each its own `it.each`.
8. Z621's "shows the shell's text again": item 3 and the G52 words, with the cursor where the shell left it.

### Premises

1. `#attach`'s lines: the brief carries `:579-629`, its doc comment `:574-578`, capture `:594`, cursor `:602`, membership `:606`, `screenAt` `:607`, CR LF and `modesAt` `:616`, version 0 `:621`.
2. `sessions.ts` lines: held, plus `:728-737` for the comment and `:774`, `:789` for the readers' shape checks.
3. `alternate_on` only in `edit.ts`: held.
4. `driver()` at `:40-82` (doc comment `:39`); only the last describe of `sessions.test.ts` is slow (`:47`): both written.
5. G51 lines: held.
6. Worktree, base copy and `unused-exports.txt`: a paragraph after the read-first paragraph names `.agents/worktrees/Q123`, `.agents/worktrees/Q123-base/tools/oculus/` with the `git archive` command of ruling 10, and `.agents/worktrees/Q123-base/unused-exports.txt`; Verify item 5 compares it.
7. "the filter the rules file names": removed from Verify.
8. `guarded.md` as the standards list: the read-first paragraph names `agents/spec.md` as the one standards page (`orchestrator-state.md:12`) and `agents/guarded.md` as the guarded entries; Verify item 7 reads the new text against `spec.md:20` and `:42`.

### Cases and checks

1. Decision 1: rewritten with options (a) widen G51's words, (b) a new G52, recommended, (c) no guarded test, the lazy option; the proposed G52 words are under "Open item for the orchestrator to book"; the builder writes the test under them and the step lands once Axel has ruled.
2. Two `it`s for one unit: one `it.each` per entry (items 5 and 6).
3. Case 2 not exercised: the no-mode row answers every flag at its reset value through the fixture of item 7, so `modesAt` reads all eleven flags.
4. The fixture's shape: item 7 builds the answer from `cursorArgs(ID).at(-1)` by replacing each `#{name}`, so it fits both trees; `driver()` takes the answer and the captures; the other tests keep `'0 0 1'`.
5. Case 6's pass not observable: alternate off is its own row (case 7), quoted on the unchanged tree.
6. Two different captures: item 2 names three alternate-state captures (history, `-q -a`, alternate), the history skipped at `history_size` 0.
7. Cases by quoted runs: case 3 keeps a quoted `node` run; case 10 is the real-tmux run.
8. No change needed; nothing to close.
9. The look's state: a section "The look at landing" names vim open over a shell with history on TEST, the page reloaded, `:q`, then the shell's text and the prompt's row.

### The question

1. Case 1's fixture: closed by Cases and checks 4.
2. Case 2: closed by Cases and checks 3.
3. Case 4: (a) the recording driver's answers rest on case 10's real-tmux run, extended to a pane with no history and to editors using 47 and 1047; (b) the encoded defect is gone: item 3 drops the final newline and places the cursor at the saved cursor before `\u001b[?1049h`; (c) the alternate capture's line breaks are CR LF, stated in item 3.
4. Case 5's coverage: case 10 adds the pane with no history, 47 and 1047, and `-q -a` after exit; the grid after exit is the look at landing.
5. Case 6's position: its own row.
6. Case 7: now G52's unreadable row (case 8).
7. Verify item 2: rewritten row by row.
8. The page after exit: the look at landing.

### Implied inputs

1. The shell's cursor: item 3, reading `#{alternate_saved_x}` and `#{alternate_saved_y}` in the same `display-message` (item 1).
2. 47 or 1047: 4294967295 means no placement (item 3); a G52 row covers it (case 6) and case 10 runs it on tmux.
3. No history: the history capture is skipped at `history_size` 0 (item 2); a G52 row (case 5), whose driver answers a history capture with the alternate top row as tmux does.
4. The editor gone before `-a`: `-q -a`, an empty answer sends today's message (item 2); a G52 row (case 9).
5. `this.#lines` bounds the history: item 2 names it.
6. A reconnect: stated with its expected result, no case.
7. A resize between captures: stated with its expected result, no case.
8. A socket closing during the extra captures: item 2 puts the membership check after the last capture.
9. Output between reads: item 2 fixes the order; the expected result in each state is stated, no case.

### ADRs

None to close.

### Dictated text

1. `describe('a page that attaches', ...)`: kept; holds.
2. G51's title 'gives an attaching page the modes the pane's program set, after the screen': kept; holds.
3. G52's title 'gives an attaching page a pane's shell text, then the alternate buffer with the editor's screen': written; holds.
4. The message order: rewritten in item 3 with the history, the saved normal screen, the final newline dropped, the saved cursor placed, `\u001b[?1049h`, the alternate capture placed by `screenAt` with CR LF line breaks, then `modesAt`; it no longer encodes the misplaced cursor of The question 3 (b), so its byte-for-byte rows hold against `spec.md:16` and `:59`.
5. ASCII: `LC_ALL=C grep -n '[^ -~]' briefs/Q123.md` exits 1.

Dictated lines held against `agents/spec.md` (`:20` prose: plain, ASCII, no em dash, no 'not X but Y'; `:42` history words in titles; `:57` the test rule): the brief's title line, holds; G51's test title, holds; G52's test title, holds; the G52 words, holds; the message order of item 3, holds; Decision 1, holds. One departure from `spec.md:57` follows ruling 1: that line has a step needing a new entry write no test until Axel has ruled, and the brief has the builder write G52's test under the proposed words, with the landing waiting on his ruling.

### Declined to judge

1. The cursor's visibility after a real vim exit: the look at landing names the state.
2. 1049 or 47/1047 on macOS vim: case 10 runs both forms on tmux and G52 has a row for each.
3. The D23 merge: "Shared paths" leaves it to the orchestrator at D23's /spec.
4. G51's options: Decision 1 carries the options and the recommendation; the words are Axel's.

One G52 row goes beyond ruling 2's list: "alternate on, no saved cursor", since 4294967295 gives a different message (ruling 4) and `spec.md:57` asks for one row per input that gives a different outcome. The orchestrator may strike it.

The capture arguments with `-e` were run on a private tmux server (`tmux -L q123close-<pid> -f /dev/null`, tmux 3.7c), killed after (`list-sessions` printed "no server running"): `display-message` gave `1 1 5 6 9 1 6` (alternate_on, saved x, saved y, history_size, cursor x, cursor y, height); `-S -2000 -E -1` gave the history alone, `-q -a` the six saved normal rows, and `-p -e` the alternate rows.

Closed in the brief by a8ea7076e2eefc9f5 (claude-opus-5-5; 146,933 tokens, 29 tool uses, 6.8 min), read whole by the orchestrator. Its points for the orchestrator are ruled (automode): item 4 stands as written (the builder measures `sessions.ts` and hands back a folder split only if it passes 880 lines); the sixth G52 row (no saved cursor) stays, as `spec.md:57` asks a row per different outcome; the test written under the proposed G52 words before Axel rules them follows the orchestrator's ruling, with the landing waiting on Z634.
