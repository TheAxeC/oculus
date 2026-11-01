# Brief check of O110, terminal text keeps its characters

Read on main at 35db337bb. `git log --oneline f63c790f5..HEAD` shows two commits (1b78b1c8f, 35db337bb). `git diff --stat f63c790f5 HEAD -- src tests docs config` prints nothing, so the brief's base still describes the tree.

Probes ran tmux on a private `-L` or `-S` socket only, and each server was killed. No file in the repository changed. The socket files were removed: `ls /tmp/o110c.*` printed no match.

Findings that need a change to the brief before dispatch, in order of weight:
- F1 under Cases and checks: the tests have no guarded entry, and the brief has no `guarded.md` line.
- F2 under Premises: the first attach reads through the control client, not `execFile`.
- F3 under Premises and The question: no `display-message` through the control client reads a title.
- F4 under The question: the verify list never reaches the changed code with a real tmux.
- F5 under The step line: the wrap of a box row has no case.
- F6 under Cases and checks: a raw 0xFF never reaches a reply.
- F7 under Premises: `%error` text reaches a log line, not the page.

## Names

Finding: none that a change makes false. The step renames nothing. It changes what `ControlReply.lines` holds.

Command: `git grep -n -E "latin1|createParser|ControlReply|double[- ]encod|mojibake" -- ':!config/local.yml' ':!.scratch' ':!docs/licenses' | grep -v "zenodo\|files/open.ts\|deck-acts"`

Output: 12 hits, all in `src/lib/server/machine/pty/tmux.ts` (lines 14, 208, 224, 238, 245, 279, 366) and `tests/server/machine/pty/tmux.test.ts` (lines 6, 8, 14, 16, 26). Both are on the write list. There are no hits outside "Paths this step writes".

Command: `git grep -n -i -E "control client|control mode|capture-pane" -- ':!config/local.yml' ':!.scratch' ':!src/lib/server/machine/pty' ':!tests/server/machine/pty'`

Output, three files, none made false:
- `src/lib/server/machine/usage/refresh.ts:101`, a capture that goes through `run`.
- `src/lib/server/root/process/shutdown.ts:5`.
- `tests/server/machine/runs/commands/commands-fixture.ts:52,59,113`.

Sentences on the write list that the brief does not name:
- `tmux.ts:12-15`, the head comment, says the stream is "decoded to a Buffer only once a whole line is in". After the change a reply line is decoded to text. The sentence is about `%output` but does not say so. The brief names only `ControlReply`'s doc comment, which says nothing of the encoding (`tmux.ts:207-213`).
- `tests/server/machine/pty/tmux.test.ts:1-2` says every case feeds "the bytes a `tmux -C attach-session` child printed on this machine". See F6.

Outside the write list: `.scratch/migration/agents/guarded.md` (see F1).

## The step line

| Part of the O110 line | Requirement in "What to build" |
| --- | --- |
| Decoded back to UTF-8 in `createParser` | The `tmux.ts` bullet (brief line 25) |
| Latin1 at 279, `control()` at 378, `channel.ts:788` | "What is on the tree" |
| Replay intact on selecting a terminal | Lead sentence and line 28 |
| On coming back from another rail | NONE by name. Line 28 says "after a reconnect" instead. |
| After a resize | Line 28 |
| A line of box characters no longer wraps, the input box Claude draws | NONE (F5) |
| Every other reply read through the control client is checked for the same fault | Line 28 asserts it follows. Nothing requires the list of replies to be made or reported, and the one example is wrong (F3). |

On the rail: the path is the same `#attach`, by reading. `pty-wire.ts` `socket.unsubscribe` leaves the sink in `#attached`, since `channel.ts:668-682` drops it only when the socket closes. The return therefore reads through the client that is still open. The brief should use the plan's words, so the look covers that state.

F5: Case 1 holds a U+2500 but says nothing of a full row. A builder runs no page (spec.md:65), so the case belongs in Cases with the look on landing as its proof, naming the view and state: a pane with a full-width U+2500 row, then a replay.

A measured stand-in is available without a page. In a 40-column pane holding a 40-character U+2500 row, the undecoded read does not contain the row and the decoded read does (the second probe under Premises).

## Premises

Command: `grep -n "toString('latin1')" src/lib/server/machine/pty/tmux.ts`, and the Read of `tmux.ts`, `channel.ts`, `capture.ts`.

| Brief line | Fact | Result |
| --- | --- | --- |
| 11 | `tmux.ts:279` latin1 | Holds: `279: held += chunk.toString('latin1');` |
| 12 | `block.lines.push(text)` as it stands | Holds, `tmux.ts:254` |
| 13 | `reply.lines.join('\n')` at 378, no decoding | Holds |
| 14 | `channel.ts:788` and `:774` | Holds |
| 15 | Bytes wrong on replay | Holds. Probe: line lengths by `run` `[9,49]`, by the control client `[15,135]`. What xterm draws for the C1 characters was not rechecked; no page was opened. |
| 15 | "The first attach, read by `execFile` with no control client open, is correct" | DOES NOT HOLD (F2) |
| 16 | `%error` text "reaches the page" | DOES NOT HOLD (F7) |
| 17 | `rest` read by no one | Holds. `channel.ts:236` tests `event.name`; `control(` has one caller, `channel.ts:232`. |
| 18 | `tmux.test.ts` has no reply with a byte above 127 | Holds, with stronger force: `cat -n` shows one case, `%output` only, and no reply at all. |
| 19 | `docs/adr` absent | Holds |
| 28 | "a `display-message` that reads a pane's title" | DOES NOT HOLD (F3) |

F2. `#attach` calls `this.#driver.attached(...)` at `channel.ts:752`, before the read at `:774`. `attached` calls `open(id)`, and `open` runs `clients.set(id, client)` synchronously (`channel.ts:253`). So `read` finds a client at `channel.ts:287` and waits for `ready()`. `run` is used only when that client failed.

Probe, a node program on stdin importing `tmuxDriver`, `captureArgs` and `run`, on a private `-S` socket. It printed, with `driver.attached([id])` then `driver.read(...)`, the order of `#attach`:

```
run line lengths [9,49]
first attach read line lengths [15,135] equal to run: false replied 1
```

So a page load's first attach onto a pane already holding such text is wrong too. The fix covers it. The premise misleads the look: its "before" state is not what the brief says, and a first attach must be in the after state.

F3. Command: `git grep -n -E "pane_title|pane_current_path" -- 'src/*'`. Output: one hit, `sessions.ts:122`, and it is `pane_current_path`, read by the list through `run`. No read through the control client asks for a title.

Every reply through the control client comes from `capture.ts`:
- `captureArgs` (:25)
- `historyArgs` (:35)
- `savedScreenArgs` (:44)
- `alternateScreenArgs` (:49)
- `alternateOnArgs` (:54)
- `cursorArgs` (:88)

Three of the four captures are the alternate-screen path, which line 28 does not name. The two `display-message` answers hold numbers and flags only.

F7. `read` rejections are caught at `capture.ts:268,272` and `:305`. They reach `console.error`, the screen falling back to what was read. The `%error` text reaches the server log. The page never sees it.

Probe of tmux's bytes, on a private `-L` socket through `tmux -u -C attach-session | od -c`:

- A reply carries raw UTF-8 bytes, not escapes: `342 217 272` for U+23FA, `303 251`, `342 224 200`, `360 237 230 200`.
- An `%error` line carries raw bytes too: `can't find pane: nosuch 303 251`.

This confirms the design. Decoding the reply is sufficient: `decoded + final newline equals run: true`, and `undecoded holds the row: false | decoded holds the row: true`.

The missing final newline is an existing difference between the two paths, which `screenAt` handles (`capture.ts:145`). The brief needs no line on it, but a builder comparing the two paths will meet it.

## Cases and checks

F1, the rules file's test rule. spec.md:60: "A test exists only as the test of one entry of `agents/guarded.md`, and `agents/guarded.md` names it there by file and title ... A step that needs a new entry stops and asks Axel for it, and writes no test until he has ruled." Tests of the standing demands (Z354) say the same.

The brief labels five cases "A test", names no entry, and has no guarded line. Recent briefs carry one, for instance O108.md:71 and O109.md:50 ("`.scratch/migration/agents/guarded.md` is the orchestrator's at landing: ...").

Command: `grep -n "tmux.ts\|tmux\.test\|createParser\|control client\|pane-screen\|channel\.test" .scratch/migration/agents/guarded.md`. The relevant hits:
- G35 names `tmux.ts` with one test, 'keeps two panes apart while their output interleaves'. G35's guarantee is that an operation acts only on the terminal it names, which is not this behaviour.
- G90 ("sent the terminal's screen as tmux holds it", guarded.md:314-316) fits the guarantee. Its Code line names `capture.ts`, `channel.ts` and client files, not `createParser`.

The new tests therefore need G90 widened or a new entry, which is an open item through automode (precedent: rulings 545, 547 in `plan.md`), and a line in the brief. As written, a builder following the rules file must stop.

The same rule asks for one test per unit, as a table, with one row per input that gives a different outcome. Five separately labelled tests on one parser do not say that. The brief should ask for one table.

F6. Case 6, "a pane that printed a raw 0xFF", cannot happen. The same probe typed byte 0xFF into `cat` on tmux 3.7c. Both `capture-pane` by `run` and the raw control reply give `ef bf bd` (`357 277 275` in `od`). tmux has replaced it before the reply is written.

No path was found that puts an invalid byte in a reply from a pane. "No throw" is what `Buffer.toString` does for any input. The case as written also forces bytes no child printed into a file whose head comment (`tmux.test.ts:1-2`) says every case holds recorded bytes.

Recording is available for cases 1 to 4; the bytes above are that recording. The brief's Conventions line says only that new bytes go through a helper. It should either require recorded bytes or say the head comment is rewritten.

Other points:
- Case 3 (`%error`): consistent with the rules, but it guards a log line (F7). No non-ASCII `%error` from oculus's own reads was found, since the session name comes from `sessionName(id)`.
- Case 5 (ASCII reply) says "Covered by the case above and the existing test". The existing test holds no reply. Case 4 says "between replies" without stating their text. As written, no check holds an ASCII reply; stating that case 4's replies are ASCII would close it.
- Verify item 1 names `channel.test.ts` and `pane-screen.test.ts`, which the step does not change and which do not reach the changed code (F4).
- Verify item 4 uses the `grep` form. spec.md:103 replaces it with the perl gate, so this is covered by the rule and is not a conflict.
- Report item "The terms: each term of `docs/glossary.md`": `ls docs/glossary.md` prints "No such file or directory". 41 lines across the briefs name it. The builder can only say so.
- Brief line 32 holds one non-ASCII character (e-acute), from `LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O110.md`; `plan.md:3` says the folder is ASCII apart from its checkmark.

## The question

Case 1 (reply with the four characters): cannot pass without the decode. It fails on the unchanged tree. It could pass with the goal unmet only if tmux wrote otherwise than assumed, which the probe rules out.

Case 2 (split across chunks): cannot pass without the decode, and it catches a decode at `feed`.

Case 3 (`%error`): passes once case 1 does, since both use the same line. It adds no reach to the goal.

Case 4 (`%output` preserved): the guard against changing line 279. It passes on the unchanged tree by design.

Case 5 (ASCII): has no check at present.

Case 6 (invalid bytes): passes by Node's behaviour for any implementation, and says nothing of the goal (F6).

F4. Verify item 1 can pass without the goal.
- `channel.test.ts` uses a fake driver whose `read` calls `this.run` (`channel.test.ts:91-95`).
- `pane-screen.test.ts` reads through `run`: `const read = (args) => run(args, options)`.
- `sessions.test.ts`, the one test with a real `control(` (line 78), checks `%output` and reads its screen through `scrollback`, which is `run` (`sessions.ts:796`).

So no check on the step's line sends a real capture through a real control client.

Spec.md:66 allows a case-run program that writes nothing into the diff. The probe above is that check: `client.read(captureArgs) + '\n'` equal to `run(captureArgs)`. It prints false on the unchanged tree and would print true after the change. I recommend it as a case, since it is the only check that reaches the goal at the server's edge.

What to build, the `tmux.ts` bullet: holds, given the parser tests. Decoding at `block.lines.push` comes after the `%end`/`%error` test at `tmux.ts:244`, so protocol lines are unaffected.

What to build, line 28 ("every caller follows"): true by the read, but no item makes a builder check it, so it could stand unchecked. Listing the six argument builders fixes that.

The look: the brief names no state. Live output has always been correct, so a look at a pane typing glyphs passes on the unfixed tree. "Every host- or user-visible change with its before and after" must name replays: a reload, a return from another rail and a resize, each on a pane already holding box characters. The bottom box of a `claude` session should be seen after one of these.

## Implied inputs

Other readers of a control-client reply. Command: `grep -rn -E "\.control\(|[^a-zA-Z]control\(|driver\.read|driver\.command|\.command\(" src bin` (the listed hits), plus `git grep -n "scrollback(" -- 'src/*'`.

- `client.command` has one caller, `channel.ts:295`, inside the driver's `read`.
- `driver.read` has one caller, `channel.ts:774`, the `read` passed to `paneScreen`.
- Every reply ends in `capture.ts`. None of it decodes or re-encodes: `grep -n "Buffer\|latin1\|toString\|decode\|encode"` over `capture.ts` gives no hit.
- The one encoder is `channel.ts:788`, correct once the text is real text, and already correct for the `run` path.

All are right after the change. `trimEnd`, `trim`, `split('\n')` and `/\r?\n/` in `capture.ts` act on the ASCII `display-message` answers or on line ends, so no result moves. In particular no `\s` or `trim` runs over a capture, where U+00A0 would differ between the two forms.

`scrollback` (`sessions.ts:790`) has no caller in `src` beyond its own definition, and it uses `run`.

Inputs the brief does not state:

- A character cut across chunks, or `\r`: held in latin1 and stripped before decoding, so safe. Expected: whole text. Covered by case 2.
- The attach's own first reply block: dropped at `tmux.ts:370`, so unaffected.
- A pane line that begins `%end ` or `%error `: `tmux.ts:244` ends the block there. This is a different fault in the same reply text, and nothing in this step touches it. It is not the fault the step line names. Expected today: a truncated replay and later replies misread. Whether it has happened is not verified. Under the Brief check scope rule it is not added to this step; the orchestrator decides whether to book it.
- `-e` escape sequences in a capture: same bytes on the same path. The ASCII `ESC` is not altered by the decode.

## ADRs

Command: `ls docs/adr`. Output: `ls: docs/adr: No such file or directory`. None.

## Dictated text

The brief dictates no text. It dictates no comment, no title and no line of a file; brief line 25 says what the doc comment should say, in no fixed words.

## Declined to judge

- Whether to widen G90 or open a new entry (F1): the orchestrator's, through automode.
- Whether the "first attach is correct" sighting was of a pane with an empty screen, whose text came by `%output`. The code and the probe show the read path; what was on screen then is not recoverable.
- What xterm.js draws for U+0080 to U+009F. No page was opened.
- Whether the `%end ` line fault is worth a booking.

Usage: a75405609a06b36d0, claude-opus-5-5, 175851 tokens, 20 tool uses, 347.7 s

## Closed

- F1: open item 615 (automode) widens G90 to `createParser`; the brief asks for one table test and carries the guarded line.
- F2: the premise rewritten; a first attach reads through the control client too.
- F3: the display-message example removed; the six argument builders named, and the report confirms each.
- F4: verify item 1 narrowed to the changed test file; a case-run program against a real tmux added.
- F5: the box row is a row of that program and a state of the look.
- F6: the 0xFF case removed; rows use recorded bytes.
- F7: the premise rewritten: the text reaches the server log.
- Rail and step line: the step's words used; the states of the look named.
- The e-acute in the brief: written as an escape.
- A pane line that begins `%end `: outside the step, raised to Axel in the report.
