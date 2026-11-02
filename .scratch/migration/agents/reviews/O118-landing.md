# O118 landing

Position: roadmap entry "migration (cockpit to oculus)"; step O118, a Transcript's older turns load as the reader scrolls to the top, landed. Next: O119, the Transcript's right-click, tool-call runs and the import cycle.

## Open items

None.

## The check of Steps 1

`ListAgents` lists no agent of O118 running.

## NOT DONE

Two Transcript tabs in one view at once were not pressed side by side; a hidden tab beside the shown one was. A real session of 4.4 GB was not opened; the read of a fixture was. The fix to the release of held turns was seen on a session with no terminal, not on a session with a live terminal.

## What landed

Older turns load as the reader nears the top. The server reads back from a byte offset, the client keeps the reader's words in place by row, and a failed read shows a line with Try again. The help page, the three new words and the diagrams changed with it. Fifteen paths.

## The look

Scratch server on port 8797, fixture of 960 turns.

| Case | Seen |
|---|---|
| Open | 200 rows, foot, no `before` read |
| Scroll to the top with reads held 300 ms | four reads, 960 turns, words moved at most 0.2 px |
| Failed read | one request, line and Try again, no loop on further scrolls; Try again gives 401 rows, line gone |
| Code block Copy | reads Copied, control stays in place |
| Pressed run with a read landing | pressed run stays open as it grows from 199 to 399 calls |
| Clicking another pane and back | list, 401 rows and scroll position unchanged, after the fix at landing |
| Turn appended far up | words moved 0 px |
| List too short for the pane | fills itself to the head |
| Pane made 300 px taller | one read, 201 to 402 rows |
| Hidden tab | column height 0, no `before` read with an append; shown again, its words and the appended turn are there |

No console errors.

## Verification

Gate: `test:quick: 71.3 s; every command passed`, `checks: 1 commands passed`. `git diff --cached` on main equals the gate's under `cmp`.

## Usage

Builder 326824 tokens, 122 tool uses, then 145178 tokens, 59 tool uses in round 1. Brief check 223649 tokens, 27 tool uses. Reviewer 242911 tokens, 21 tool uses. Reviewer over round 1 237725 tokens, 27 tool uses. The first report did not pass its bar; four fixes at landing, named in the booking.
