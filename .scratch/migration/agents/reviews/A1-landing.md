# A1 landing

oculus/migration, the oculus migration plan. Step A1 of 28 open at its landing: a comment on a line of a session's diff, sent to that session. Next: Q88c (the Source Control rows' and the pane strip's new right-click capabilities), its round review back, landing next; /spec S4 into the free slot.

## Open items

None for Axel from this step.

## Check before the landing

ListAgents at 14:10 listed four running agents, none of them A1's: the builders of D18, M3 and D32 and the reviewer of Q88c's round. A1's builder and both its reviewers had finished.

## NOT DONE

- The look did not press Send: it writes into a session's terminal or the clipboard. The inline layout and a light theme were not looked at.

## What landed

A file's own diff opened for a session carries the session in its id. The `+` in the glyph margin and Add Comment on Line open a comment box headed "Comment to <session>". Send types `<path>:<line>: <text>` into the session's oculus terminal, or copies it to the clipboard with a line saying so. Conflicts in `DESIGN.md`, `instance-state-sources.test.ts` and six diagram files were resolved with both sides kept and the diagrams regenerated.

Fixes at landing, 3:
- `readDiff` in `diff-read.ts` renamed `readPaneDiff`.
- The disproved round premise stated in the booking.
- `config-key.test.ts`'s eight-variant case split into eight cases, after it timed out twice on main under load.

## Verify on main

```
$ npm test
 Test Files  476 passed | 24 skipped (500)
      Tests  12194 passed | 637 skipped (12831)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  446 passed | 9 skipped (455)
$ npm run check
COMPLETED 3096 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

## The look

On TEST at localhost:8790, the Changes view with the session "S2 status":
- A staged file's diff was opened.
- Hovering the modified side's glyph margin shows the `+`.
- Pressing it opens the box "Comment to S2 status" under the line, with the filler on the original side, the text area focused, and Send and Cancel.
- Cancel closes the box.
- Right-clicking a line lists Add Comment on Line, Copy and Command Palette.

## Agents

- Builder a0a84b2fcd6bf4f22, claude-sonnet-5-5 at ordo-high:
  - to the report: 273,112 tokens, 192 tool uses, 80.8 min;
  - round 1: 231,617 tokens, 132 tool uses, 57.7 min.
- Reviewer a32324e09cd16a4a4, claude-opus-5-5: 290,561 tokens, 56 tool uses, 21.4 min.
- Reviewer over round 1, a17f61bdeec6c3560, claude-opus-5-5: 257,278 tokens, 67 tool uses, 19.8 min.
- Brief check: 269,064 tokens, 76 tool uses, 11.9 min.
- The first report did not pass its bar (12 findings). Fixes at landing: 3.
