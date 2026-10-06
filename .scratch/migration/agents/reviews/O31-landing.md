# O31 landing

## Open items, verbatim from the state file

- O31's launch note from the plan skills (raised 2026-09-23 at O31's landing). The brief planned to change the plan-orchestration skill's launch recipes at landing to call oculus's `bin/dispatch-note.mjs`, but the plan skills name no project ("It carries no project name and no vendor name; those are in `.agents/plan.yaml`"), so they cannot call an oculus path: two rules clash. Options: (a) an optional key in `.agents/plan.yaml`, `launch_note:`, holding the command that records a launch (here `node tools/oculus/bin/dispatch-note.mjs`), which the launch recipes run at start, when the transcript is known and at the end, and skip when the key is empty; (b) leave the recipes as they are, so only a launcher that calls the script by hand records its builder. Recommended (a): it is the plan skills' own way to carry a project specific, and a Codex worker launched by the loop is the case the note exists for. (b) is the lazy option. Tonight's builders are Claude agents of this session, which the Agents view already draws, so nothing waits on it tonight.
- O31, a launched builder whose launcher dies before `end` (raised 2026-09-23 by O31's review, `agents/reviews/O31-refuter.md`, Spec 3). When the builder's own transcript is known, its row follows that session's own liveness, which the repair round builds. When no transcript was ever recorded, nothing in the ruled record says whether the builder still runs, so its row reads `running` for good. Options: (a) add the builder's process id to the record (`--pid` on `start`, checked the way `sessions/registry.ts` checks a registry pid), so a launch with no transcript is known dead once its process is; (b) leave the record as ruled, and a launch with no transcript and no `end` reads `running` until someone ends it. Recommended (a): the row otherwise tells the reader something false, and a pid is the one fact that answers it; it is one optional field and the writer already runs where the launcher knows the child's pid. (b) is the lazy option. O31 lands without it either way; (a) would be a small step of its own. Found at O31's landing: (a) also closes the one case the landing's rule leaves, a Codex launcher with a Codex builder, whose rows read done once both rollouts have been silent for two minutes.

Booked list: none.

## NOT DONE

The plan skill's launch recipes do not write the note yet: that waits on the first open item. Everything in the brief itself is done.

## What landed

O31, cherry-picked from `.agents/worktrees/O31` at base `cee6d57e` onto main by `tools/oculus/.scratch/migration/land.sh O31 cee6d57e` (+2,069 -175 over 24 files before the landing fixes).

- The three session stores read one folder per account of their tool from `local.yml`'s `accounts`, each real folder once, so a symlinked account lists nothing twice; the watcher watches each.
- `bin/dispatch-note.mjs` writes `~/.oculus/dispatches.json`: `start` prints an id, `transcript <id> <path>` and `end <id>` complete the record. Every write takes a lock, a dead lock is cleared only under a second lock that re-checks it, a lock older than any write holds one is stale whatever its pid, a waiter's lock is stamped fresh when it takes it, and a killed writer's leftovers are swept.
- The sessions layer joins each record to its launcher's session, and the Agents view draws it as a launched row with its harness, model and label, newest first with the subagents, opening the builder's transcript when the scan holds it. Without an end stamp a row reads running while its launcher's session is live, and follows its builder's session once the launcher's is not.

## What was found

The first review found the lock losing records with several writers at once (24 writers, 150 rounds: records lost in 3 rounds with no stale lock and 8 with one, every writer exiting 0), a reused pid jamming every write, a launched row reading running for good, and a builder transcript folded into the session list outside its window; the repair round closed each, and the 24-writer, 150-round case now loses nothing. The run over the round found three more, closed at this landing: a Codex builder inside a long command read done while it ran (fixed by trusting the missing end stamp while the launcher lives), a waiter that waited past the wait took a lock already stale by age (fixed by stamping the lock when it is taken), and the re-check under the second lock was proven by no case (a deterministic case now proves it). Every finding is under the Closed heading of `agents/reviews/O31-refuter.md`.

One more, not O31's: under the load of a browser run beside it, the revert tool's own signal case left a copy behind, because a leftover vitest process writes its compile cache into the copy after it was removed. It passes alone; its cause is fixed in the commit after this one.

## Verified on main

```
npx vitest run --reporter=dot       Test Files 278 passed (278); Tests 4488 passed (4488)
npm run check                       COMPLETED 1291 FILES 0 ERRORS 0 WARNINGS
npm run build                       exit 0
npm run format:check                All matched files use Prettier code style!
npm run lint                        exit 0
the ASCII gate                      prints nothing
sh bin/size-check.sh                exit 0
sh bin/folder-check.sh              exit 0
npm run test:browser                293 passed (8.8m)
node bin/revert-check.mjs           tests/checks/bin/dispatch-note.test.ts and
                                    tests/server/sessions/stores/dispatches.test.ts:
                                    22 reverts, 0 unproven, the one unchecked a named audit
ls -d $TMPDIR/oculus-* | wc -l      7015 before and after
```

## The look, on the TEST page

The dev server on 8790 was restarted with its dependency cache cleared, since the watcher it builds at start is what reads the accounts. The Sessions view lists four live sessions, this one busy among them, where the second account's sessions read Ended before. With one launch record written for the look under this session (`launched codex gpt-5.6-sol TEST look for O31`), the Agents view draws it on top as `running`, the subagents under it newest first; the record was then ended and the file removed, since it did not exist before.

## What is next

Q65's repair round, then its landing, then L3.
