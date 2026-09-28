# Q99 landing

Roadmap entry oculus/migration (the oculus migration plan). Plan step Q99: the terminal and Pages defects from Axel's look on TEST. Next: Q100's landing, then `/spec` Q101.

## Open items

- None.

## Agents

TaskStop on the builder and both reviewers found none of them running; `ListAgents` listed only Q79d's builder and Q100's round reviewer.

## Not done

- A Claude session's click, scroll and paste were not looked at on TEST, since that starts a Claude session. The unit cases cover the bytes (`tests/server/machine/pty`, 82 passed).

## Landed

- Input to a pane as its bytes through `send-keys -H`, at most 996 bytes a command, no escape sequence or UTF-8 character cut; the steer and a shell's first command through the same builder.
- A tab showing a terminal that has ended closes, a following tab included; `sessions` leaves `terminals` out until tmux has answered.
- An attaching page gets the capture without the blank rows under the cursor, and the cursor where tmux has it.
- The Pages view's rows at the tree's size, controls on hover and focus; a row drag let go over its own row shows nothing.

## Fixes at landing

- `tests/routes/sessions/compose.test.ts`: two cases expected the old `-l` word; they expect the `-H` bytes now.
- `HELP.md` terminal row: a click, a scroll or a focus change in one write, a long paste in several, in order.
- `docs/diagrams`: merged with main and regenerated.

## Checks

- Verify on main: `Test Files 347 passed (347)`, `Tests 5553 passed (5553)`, `COMPLETED 1483 FILES 0 ERRORS`, `verify: 6 commands passed`.
- A steer at STEER_MAX of 3-byte characters: 303 tmux commands, 6566 ms on a scratch tmux server, under the 30 s write timeout.
- Look on TEST (vscode dark modern): the Pages rows; a click on a row shows the page; a shell started with `echo q99-look-é中` typed it whole and drew its prompt from the top; `exit` closed its tab.
