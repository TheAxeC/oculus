# Q77d landing

## Open items

None.

## NOT DONE

- `tests/server/git/git-ops.test.ts` is not under the brief's 12 s: 21.7 s in the whole suite on main, 19.1 to 20.3 s alone at load 4 to 13. Its setup is now about 160 ms per case (the review's timing); the rest is the cases' own git work, which the brief's change does not reach.

## What landed

Q77d, the slow unit tests made fast, one commit on main (the commit that carries this file):

- `tests/checks/bin/dispatch-note.test.ts`: the 150-round many-writers case is one deterministic case (a live holder, `takeLock` waits for it, the holder exits 0), red under `return true;` in `stale()`; the file-level ten-minute timeout is gone and only the launch recipe case carries 35 s, for its two bounded waits.
- `tests/server/git/git-ops.test.ts`: the remote and its clones built once and copied per case, each copy's clones pointed at its own remote.
- `tests/checks/diagrams/diagrams.test.ts` and `readable.test.ts`: one engine generation per file, made by the first case that reads it; `staleFiles(engine, drawn)` takes drawings already made.
- `tests/server/root/watch/portfolio.test.ts`: the watcher on a 20 ms debounce, `quiet()` steps of 100 ms, the negative waits 150 ms.
- `tests/server/root/dev-server.test.ts`: `started()` polls `/@vite/client` every 100 ms.
- Measured on main, the whole unit suite: `Duration  75.85s` at load 5.1, against 160.85 s on an idle machine before the step. The slowest files now (`--reporter=json`): git-ops 21.7 s, revert-check.test 19.8 s, diagrams 18.4 s, watch/git 13.9 s, core/git 10.8 s, dev-server 9.1 s; the slowest case is the diagrams changed-copy case, 10.8 s, which Q77e takes on.

## Found

- The brief's Part 4 premise was wrong: with the old poll of `/`, the style module's first answer was still raw without the style-first plugin (the review's run), so the case already asked for it before its component. The change to `/@vite/client` is a speed change only.
- The builder generated the engine drawings from a memo filled by the first case instead of the brief's `beforeAll`; the review showed one generation per file with it, and a single `-t` run of a case reading no drawing skips the generation. Kept.
- The builder's part 1 report text on the file-level timeout is out of date; the tree matches Part 3.
- `started()` no longer waits for the root page, and git-ops leaves its template folder to `sweepScratch`; neither changes what a case asserts.

## Fixed at landing

1. The comment on `started()` stated the wrong premise; it now says the client script answers about a second before the root page renders and no request needs the page.
2. The replay onto main met Q77c's converted directives in three places (`dispatch-note.test.ts`, `diagrams.test.ts`, `readable.test.ts`): resolved keeping Q77d's code and the new directive form, the new dispatch-note directive written in the new form; `node bin/migrations/revert-anchors.mjs --check` `0 directives converted in 0 files written, 0 refused`.
3. `tests/checks/tree/allow-duplication.txt` held the sessions and portfolio `quiet()` pair (`820f2f2c8974`), which the new step length made differ, and the duplication check failed on the stale entry; the entry is removed.

## Carried

- The portfolio negative checks' fixed `sleep(150)` can let a late rebuild pass unseen under heavy load: in Q72's list in `plan.md`.

## Verification on main

- `npm test -- --reporter=dot`: `Test Files  341 passed (341)` / `Tests  5348 passed (5348)` / `Duration  75.85s`.
- `npm run check`: `COMPLETED 1510 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`; build exit 0; `All matched files use Prettier code style!`; lint exit 0; the ASCII gate no output.
- `npm run test:browser`: `467 passed (8.4m)`.
- `node bin/revert-check.mjs tests/checks/bin/dispatch-note.test.ts tests/server/root/dev-server.test.ts tests/checks/diagrams/diagrams.test.ts`: `72 reverts, 0 unproven, 0 unchecked`.
- No look: the step changes tests and one test-tool argument, no view.

## Next

Q77a, Q77b and Q77e through /spec, then L7.
