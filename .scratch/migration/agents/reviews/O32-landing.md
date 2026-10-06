# O32 landing

## Open items, verbatim from the state file

None.

Booked list: 1, carried for O32 itself: O32's launch recipes in the Ordo plan skills, blocked by the plan another session is running in the Ordo repository; Axel hands the change to that session.

## NOT DONE

- The Ordo side: `/plan`'s key list and templates and plan-orchestration's two shell recipes do not carry `launch_note:` yet. Until they do, no recipe writes a launch note; the hub's `.agents/plan.yaml` carries the key.
- A reused pid whose `ps` fails on some scans and not others flips its row between running and done and republishes each time; it needs both a reused pid and a failing `ps`, and is not changed.

## What landed

O32, cherry-picked from `.agents/worktrees/O32` at base `6d87499f` onto main by `tools/oculus/.scratch/migration/land.sh O32 6d87499f --no-browser` (+710 -86 over 10 files before the landing fixes; the browser suite was run by hand once port 8792 was free, since L3's builder shared it).

- `bin/dispatch-note.mjs start --pid <n>` records the builder's process id and its start time as `ps` prints it under `LC_ALL=C TZ=UTC`; a pid signal 0 does not find is refused, and a live one whose `ps` fails is recorded with an empty start.
- A launch with a pid and no end stamp reads running while that process runs with that start time and done once it does not; a record without a pid reads as before. The sessions watcher's 15 s re-check carries each launched agent's status, so the change reaches the page within one re-check. One `ps` per scan serves the registry and the builders, and only launches started inside the scan's window are asked about.
- The registry's `ps` runs under the C locale, so its start-time check holds under any locale.
- `.agents/plan.yaml` carries `launch_note: "node tools/oculus/bin/dispatch-note.mjs"`, run from the repository root.
- DESIGN.md and HELP.md carry the record's fields, the rules and the command.

## What was found

The first review found launch lines that could not run in the recipes' detached form, a live pid refused when `ps` failed, an unproven branch, a race case whose revert went green by chance, a builder's exit reaching the page up to five minutes late, two `ps` calls per scan, a time-zone mismatch reading a live builder done, and Doc text quoting elided lines; the repair round closed each. The run over the round found the wrapper's pid recorded instead of the builder's, a case that relied on node's folder holding no `ps`, a function kept only for tests, the HELP text missing an exception, and every unstamped record of the note asked about on every scan; each is closed at this landing. Every finding is under the Closed heading of `agents/reviews/O32-refuter.md`.

## Verified on main

```
npm test -- --reporter=dot          Test Files 284 passed (284); Tests 4573 passed (4573)
npm run check                       COMPLETED 1311 FILES 0 ERRORS 0 WARNINGS
npm run build                       exit 0
npm run format:check                All matched files use Prettier code style!
npm run lint                        exit 0
the ASCII gate                      prints nothing
sh bin/size-check.sh                exit 0
sh bin/folder-check.sh              exit 0
npm run test:browser                316 passed, 1 failed: unsaved-forms.spec.ts:342, a save-timeout
                                    case O32 does not touch, run while L3's builder loaded the machine;
                                    alone, 3 passed of 3
node bin/revert-check.mjs           over the six changed test files: 0 unproven after the landing's
                                    directives were repointed (dispatches.test.ts 20 reverts, the
                                    watcher and writer files 25 reverts)
```

## The look, on the TEST page

The dev server on 8790 was restarted with its dependency cache cleared, since the session watcher it starts changed. A `sleep 300` was launched through the recipe's wrapper with this session as its parent. The Agents view, with this session picked, drew `launched codex gpt-5.6-sol TEST look two for O32 running` above the subagents. The wrapper was killed with the builder left alive: 27 s later the row still read running. The builder was then killed at 16:09:16: by 16:09:22 the row read done, and the record's `endedAt` stayed empty. The note file did not exist before the look and was removed after it. Seen in the same view and not O32's: the native subagents' rows show durations of 1 s to 11 s for agents that ran for many minutes, which Q35's "Agents with true durations" covers.

## What is next

L3's report, its review and its landing.
