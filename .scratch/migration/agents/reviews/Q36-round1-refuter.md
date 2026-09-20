NOT DONE: Q36 repair round 1 is not ready to land.

The refutation found one material defect: `provenKill` retries with a stale `probe-pid`, so later attempts can use false machine-cost measurements. Five of five reproductions confirmed this. Loaded testing passed 4 of 5 runs.

Other results:

- Full suite: 259 files, 4,377 tests passed.
- Check: 0 errors, 0 warnings.
- Build, formatting, lint, ASCII, and size checks passed.
- Revert checker: 10 red reverts, 0 unproven, 3 unchanged cases unchecked.
- `src/lib/server/hpc/ssh.ts` is unchanged from `2ddd4a8b`.
- Final `git status --short` lists only `tests/server/hpc/ssh.test.ts`.

Report: [q36-review-cli-final.md](/private/tmp/q36-review-cli-final.md)