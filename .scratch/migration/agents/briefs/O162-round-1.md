# O162, repair round 1

The review (`agents/reviews/O162-refuter.md`) found nothing. This round carries one addition Axel ruled after the brief was written (open item 706 (a), `plan.md` Rulings): Help's keys table names every key that moves a deck. `agents/spec.md:72` allows this line of `docs/HELP.md`, since Axel ruled it into this step. Nothing else changes.

1. **The deck keys in Help.** In `docs/HELP.md`, the row `| Space / Shift+Space | next / previous slide |` (line 200 at the base) is replaced by these two rows, word for word, after the row `| F / P / O | in Present: full screen / presenter screen / overview |`:

```
| Right / Left, Page Down / Page Up, Space / Shift+Space | in Present: next / previous slide |
| Home / End | in Present: first / last slide |
```

   They are what `moveOf` (`src/lib/views/academic/present/screen/keys.ts:74-91`) does: Right, Page Down and Space one slide on; Left, Page Up and Shift+Space one back; Home the first slide, End the last. No other line of `docs/HELP.md` changes.

Paths this round writes: `docs/HELP.md` (the one row replaced by two), `.scratch/migration/agents/reviews/O162-report.md` (the round's section).

Verify before you report, from the worktree's root:

1. `git diff 8a423feb3 -- docs/HELP.md` shows only this hunk and the step's earlier hunks, quoted.
2. The ASCII gate of the rules file over `docs/HELP.md` prints nothing.
3. `npm run test:quick`, once, after the change; it prints `every command passed`.

Append to the report a section "Repair round 1" with the DONE / NOT DONE row for item 1 and the checks' output as printed.
