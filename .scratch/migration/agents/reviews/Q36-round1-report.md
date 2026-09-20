# Q36 repair round 1 report

NOT DONE: repeated machine-cost measurements reuse `probe-pid`, so a retry can read a stale dead PID. The landing fix must remove the prior file before each probe and prove repeated measurements.

| Item | State | Evidence |
| --- | --- | --- |
| Repair rulings 1-6 | DONE | `npx vitest run tests/server/hpc/ssh.test.ts --reporter=dot` passed 13 of 13 without added load; the refuter's full suite passed 259 files and 4,377 tests. |
| Loaded proof | NOT DONE | The refuter's five runs with 16 busy loops passed 4 of 5; the red run reported `too loaded to prove the kill: 268ms over the grace`. |
| Revert proof | DONE | `node bin/revert-check.mjs tests/server/hpc/ssh.test.ts` reported 10 reverts, 0 unproven, and 3 unchanged cases unchecked. |
| Static gates | DONE | `npm run check` reported 0 errors and 0 warnings; build, format, lint, ASCII and size gates passed. |
| Source scope | DONE | `git diff 2ddd4a8b -- src/lib/server/hpc/ssh.ts` printed nothing. |

Changed file: `tests/server/hpc/ssh.test.ts`, 440 lines.
