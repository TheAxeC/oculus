# Q68 landing

## Open items, verbatim from the state file

None.

Booked list: 3, carried for O32 (its skill half, in the installed plan skills), Q69 (what earlier landings left, and the check of seven landed steps against their briefs) and Q70 (watchers under file-event load).

## NOT DONE

- The cause of three `tests/server/watch/git.test.ts` cases that failed 4 of 5 runs for the first reviewer while fseventsd ran at 100% CPU is not found: no run since has failed them (58 runs across the builder and the round's reviewer), and the watcher code they run is unchanged by this step. Booked as Q70.

## What landed

Q68, cherry-picked from `.agents/worktrees/Q68` at base `f7c93a6b` by `tools/oculus/.scratch/migration/land.sh Q68 f7c93a6b <runs> --no-browser` (+513 -162 over 5 files), then three fixes at landing (+4 -3 over 2 files), the browser suite run by hand.

- The git watcher polls the saved workspaces file every 500 ms on its own clock instead of watching its folder. A folder `fs.watch` on darwin loses a write made while its FSEvents stream registers; under file churn the old watcher lost the added root in 2 of 10 and 3 of 10 runs, the new one in 0 of 20 (the builder's reproduction, confirmed by the reviewer's own).
- A watcher closed during a tick schedules no next one.
- The workspaces cases are in `tests/server/watch/git-workspaces.test.ts`, their helpers in `tests/server/watch/repos.ts`.
- A root added in the page now shows at the next tick, up to half a second, where it showed on the file event before; the server stats the file every 500 ms.

## What was found

The first review found three other watcher cases failing under a saturated fseventsd, the signature's branches without cases, `signature` exported with no reader, and a head comment made unclear; the repair round closed each except the cause of the three cases, and found a real defect of its own (the tick after close). The run over the round found the unreadable-stat case's polling claim without a revert, the new file's head without its layer, and the orchestrator's wrong correction of the mail poller's line (it is `poll.ts:304`); the first two are fixed at landing, the third is a record. The mail poller's same folder watch and the three cases are Q70. Every finding is under the Closed heading of `agents/reviews/Q68-refuter.md`.

## Verified on main

```
npx vitest run --reporter=dot       Test Files 293 passed (293); Tests 4657 passed (4657)
npm run check                       COMPLETED 1341 FILES 0 ERRORS 0 WARNINGS
npm run build                       exit 0
npm run format:check                All matched files use Prettier code style!
npm run lint                        exit 0
LC_ALL=C grep -rna '[^ -~]' src tests | wc -l    0
sh bin/size-check.sh                exit 0
sh bin/folder-check.sh              exit 0
npx playwright test                 354 passed (8.0m)
node bin/revert-check.mjs tests/server/watch/git-workspaces.test.ts    11 reverts, 0 unproven, 0 unchecked
ListAgents                          none of Q68's builder or reviewers listed
```

## The look

None: Q68 changes no view, the shell or any drawn surface; the Repositories view draws the same, a root added through the page arriving up to half a second later.

## What is next

L6: its review is running; then its repair round, the run over it, and its landing with the look on TEST under every theme it changes.
