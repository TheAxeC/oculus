# Q77a landing

## Open items

None.

## NOT DONE

Nothing of Q77a's brief.

## What landed

Q77a, revert-check proves a unit directive in memory, one commit on main (the commit that carries this file):

- revert-check is `bin/revert-check/`: the entry `revert-check.mjs`, `directives.mjs` (reading and resolving directives), `copy.mjs` (the copy path), `memory.mjs` (the in-memory path). The command is `node bin/revert-check/revert-check.mjs`.
- A unit directive is tried first in one Vitest instance over one copy of the tree made for the run, the reverted line served in memory; it is red only when the case fails with the revert and passes without. Every other outcome, and every browser directive, takes the copy path unchanged. The output is word for word the copy path's.
- Each in-memory run starts with an empty temporary directory; a run after which the run's folder changed (a path added or removed, or a mode, size or time changed) has the folder emptied and the copy and the instance made again.
- `diagrams.test.ts`: 96 to 103 s against 264 to 323 s on the copy path. `dispatch-note.test.ts`, whose cases read from disk or run a process: no gain.

## Fixed at landing

1. The owner's permissions given back before every removal of the run's folders, so a folder a case left locked no longer ends the in-memory path for the rest of the run or stays behind.
2. Vitest's temporary directory moved beside the run's folder, so a case reaching up from its temporary directory writes where the listing reads.
3. Two writer cases: a write beside the copy, and a folder left locked (with its own temporary directory, which the sweep removes).
4. The head comment says what the code guarantees.
5. A directive shifted by fix 1 (`"await restart();" +2`).
6. Three comment lines over 100 columns.

## Found, not changed

- Two premises of the brief were wrong: the config-folder test path, and the case count of `revert-check.test.ts` (30, not 58).
- The leak found after round 1 came from the orchestrator's brief (one case temporary directory for the run) and round text (a listing of size and mtime only).
- The file split into `bin/revert-check/` was made in round 2 on a 900-line limit the briefs stated and the orchestrator never checked; Axel kept round 2.
- One browser test (`repositories.spec.ts:127`, making a worktree) failed in the full run and passed on a rerun of its file; not reproduced.

## Verification on main

- `land.sh Q77a c420b8b2 --no-browser`: red at the unit suite on the comment-width check (three lines), fixed at landing.
- After the fixes: unit `Test Files 342 passed (342)`, `Tests 5363 passed (5363)`; after the last test change `tests/checks/bin` and the comment-width check `90 passed`; `npm run check` `0 ERRORS 0 WARNINGS`; build ok; Prettier clean; lint exit 0; ASCII no output; size and folder checks exit 0.
- `node bin/revert-check/revert-check.mjs tests/checks/bin/revert-check.test.ts`: `42 reverts, 0 unproven, 0 unchecked`; `revert-anchors.test.ts` 2 red; `node bin/migrations/revert-anchors.mjs --check`: `0 directives converted in 0 files written, 0 refused`; no new oculus-revert folder left in the temporary directory.
- Browser: `466 passed`, 1 failed (above), its file rerun `11 passed`.
- No look: Q77a changes tooling and tests, no view.
- Every agent of the step has ended: both builders and the three reviewers returned their final message.

## Next

Q77b (revert-check `--base`), then L7.
