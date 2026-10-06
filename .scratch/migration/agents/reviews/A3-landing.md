# A3 landing

Position: roadmap entry oculus/migration (the cockpit-to-oculus migration), step A3 "scheduled runs", landed. Next: E4's landing, then O30b, Q123, Q124, D23, X3e and D45 prepared.

## Open items

- Z630 (2026-10-06, step Q123): the words of the new guarded entry G51, which are Axel's.

## The check of Steps 1

`ListAgents` listed no agent of A3 running.

## Not done

- The look did not see a listed schedule row, its runs, a held row or a refusal sentence: each needs a schedules file on Axel's machine, and a look leaves no write.

## What landed

Schedules as entries of `~/.oculus/schedules.yml`, run on cron patterns through `croner` and kept in the run record `~/.oculus/schedule.json` under a lock file, listed and edited in the Update tray's Schedules section (78 files, 6303 insertions, 1154 deletions).

## Fixes at landing

1. `watch.ts` `launch` checks `stopped()` on every path into the start (round 2 Behaviour 1).
2. The route commits `schedules.yml` only while it holds the text the change was planned from, else 409 `entry-changed` (Z626).
3. A record change that fails after the commit writes the planned-from text back, so 500 `record-unwritten` saved nothing (Z625).
4. HELP.md and DESIGN.md: a command entry is saved with Run unattended off (Z622); DESIGN.md's `record-unwritten` and `entry-unwritable` sentences corrected; `schedule-words.ts`'s head comment corrected.
5. `record.test.ts`'s lock case under a fake clock with a row through the route, listed under G31, whose sentence gains "or whose lock stays taken" (Z624).
6. Two lint findings in the landing's own code.

Conflicts with O30 in `boundaries.test.ts` and the diagrams resolved, both sides kept.

## Verification

In `.agents/worktrees/gate-A3` at main 8ed2d1f5a with the range and the fixes: `npm run diagrams` exit 0; `npm run test:landing`: ok ASCII gate, ok format:check, ok npm test (130.9 s), ok test:checks (159.9 s), ok lint (174.6 s), ok "npm run check, then npm run build, then npm run test:slow" (334.5 s), "every command passed". Main's staged code and the gate's: `cmp` equal.

## The look

On TEST, dark theme: the Update tray's Schedules section with Add schedule and "No schedules yet."; the Add schedule dialog with Name, Runs, Task, When and Run unattended; with Saved command chosen, "Choose a saved command." and no Run unattended box. Cancelled; `~/.oculus/schedules.yml` and `schedule.json` still absent.

## Agents

Build from the new brief a2764a62793cc286e (claude-sonnet-5-5): 271,977 tokens, 452 tool uses, 109.7 min; round 1 199,526 tokens, 94 tool uses, 22.3 min; round 2 100,732 tokens, 81 tool uses, 20.4 min. Its first report did not pass its bar (verify item 8). Reviewers a239b2d8b039c975e (268,520 tokens, 153 tool uses, 23.9 min), a1226d68c43be5990 (328,871 tokens, 61 tool uses, 11.7 min), ac84998d95f8fb970 (358,200 tokens, 80 tool uses, 15.1 min). Brief check a48d9494f333f3e40 (268,096 tokens, 87 tool uses, 13.9 min), closed by a42ad450094192df4 (213,493 tokens, 44 tool uses, 10.9 min). Diagnosis acb1bb1231865e0e6 (206,946 tokens, 91 tool uses, 96.4 min). The first build's agents are listed in the booking.
