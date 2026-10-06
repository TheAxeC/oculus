# Q79b landing

Roadmap entry oculus/migration (the migration of oculus). Plan step Q79b: the test half of section D. Next: `/land` D13a, whose round review is in.

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

- None.

## NOT DONE

Nothing of the step. It changes tests only, so it has no look.

## The check before landing

The runner's agent listing showed no builder or reviewer of Q79b running; only Q88's builder and D13a's round reviewer were running.

## What landed

Every test file that makes a scratch directory takes `it` and `test` from `tests/fixtures/scratch.ts`, whose file fixture sweeps what the file made; no file registers `afterAll(sweepScratch)`. The tmpdir assertions the helper already guarantees are gone. The folder walkers run on `tests/checks/walk.ts` and the comment strippers on `tests/checks/source/code.ts`. 131 files, 1694 lines added and 1450 removed (`git diff --cached --stat` after the cherry-pick), before the fixes at landing.

The worktree's replay onto main conflicted in two files, since Q96 had moved `tests/ui/colours.test.ts` and `wall.test.ts` into `tests/ui/theme/`:
- `colours.test.ts` and `wall.test.ts` take Q79b's imports one level deeper;
- `allow-duplication.txt` holds the two entries the merged files need (`236bf4cb5b88`, `d644d24e5242`, named by `duplication.test.ts`) in place of main's four.

## What was found, and the fixes at landing

The review over round 1 (`agents/reviews/Q79b-refuter.md`, "Repair round 1, refuted") found these, each fixed on main (the Closed heading of that file):
- `tests/routes/sessions/terminal-fixture.ts` held eight exported `let` bindings set by `makeTaskConfig()`. It now returns a `TaskConfig` object, `engineWith` and `options` take the root and the engine as arguments, and the three importers keep the answer in a file-local `task`.
- A `test.afterAll` that throws skipped the file's sweep, since vitest runs the fixture's teardown in the same `try` as the afterAll hooks. The fixture's `test.afterAll` now sweeps before the hook's error goes on (`sweepingOnError`). `scratch.test.ts`'s real-run case plants such a file: green with the wrapper, red without it, the two directories left.
- A failed `test.beforeAll` in `pty/channel.test.ts` or `pty/sessions.test.ts` would have run `tmux -S '' kill-server`. Both teardowns now return while the socket is unset.
- `bookmarks.test.ts`'s head comment named an assertion the step removed; it now says what holds.
- Two comments the fixes wrote were past column 100, and were rewrapped.

`tests/views/personal/calendar.test.ts`'s `styleOf` now reads to the first `</style>` where it read to the end of the file; the component holds one style block, and its two audits pass.

## Verification on main

`checks.sh` ran once on main with Q79b staged, before the fixes at landing: `Test Files 1 failed | 358 passed (359)`, `Tests 1 failed | 5744 passed | 1 skipped (5746)`, the one failure `comment-width.test.ts` over the two comments the fixes wrote (`checks: failed with exit 1: npm test`). After rewrapping them:

```
$ npx vitest run tests/checks/source/comment-width.test.ts
 Test Files  1 passed (1)
$ npm run check
COMPLETED 2053 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build            exit 0
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint             exit 0
$ ! LC_ALL=C grep -rna '[^ -~]' src tests     exit 0
```

The route and pty files the fixes changed: `npx vitest run tests/routes/sessions tests/server/machine/pty/sessions.test.ts tests/server/machine/pty/channel.test.ts` gives `Test Files 8 passed (8)`, `Tests 104 passed (104)`. `scratch.test.ts`: `Tests 17 passed (17)`.

Lint on main also named two errors in `MenuList.svelte`, from the look fix of `c3ecfb4e`; that fix is its own commit, `92a910dc`.

## Usage

- Builder: 36 tool uses, 187k tokens, 8 min (the cases hand-back); 196 tool uses, 141k tokens, 74 min (the build); 190 tool uses, 156k tokens, 64 min (round 1).
- Reviewers: 280k tokens, 84 tool uses, 25 min (first review); 261k tokens, 76 tool uses, 21 min (round 1).
- First report passed its bar: no. Fixes at landing: six, and the merge of two files.

## Next

`/land` D13a. Q88 is building on its cases ruling. The freed slot takes the next queued step through `/spec`.
