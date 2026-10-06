# Q77b landing

## Open items

None. Booked list: 4 entries (Q72, Q79, O33, O32), unchanged by this step.

## NOT DONE

Nothing of Q77b's brief.

## What landed

Q77b, revert-check proves only the directives a change adds or changes, one commit on main (the commit that carries this file):

- `node bin/revert-check/revert-check.mjs --base <dir> <files>` leaves out a directive whose case (the whole `it(`/`test(` statement with its leading comments, found by the TypeScript parse), whose test file's text outside its cases and whose target are the same text in the base folder. It prints `unchanged <file> :: <case> (revert ...)` and ends the summary with `, <n> unchanged`.
- Under `--base` a case with no directive is listed `unchecked` only when it is new or changed.
- Proven as without a base: a refused directive, a directive whose line lies outside the case the parse finds, a file with a syntax error (`ts.transpileModule` diagnostics), and a name two cases share.
- `--base` given twice, naming no folder, or naming the tree checked: the usage and exit 2.
- Without `--base` the output is as before but for the usage line; `bin/revert-check/base.mjs` loads only under the flag.
- Not seen by the rule, and stated in the head comment: a change to a module the case imports other than its target.
- Over `tests/checks/bin/revert-check.test.ts` on the builder's worktree: 17.73 s with `--base` against 229.62 s without, at load 2.5 to 7.

## Fixed at landing

1. `bin/revert-check/base.mjs:63`, a comment line at 109 columns (the round review's finding, and the red line of `land.sh`).

## Found, not changed

- The brief's first Case expected every directive of `revert-check.test.ts` unchanged; 3 name `revert-check.mjs`, which the step changes, so 39 unchanged and 3 red is the correct result.
- The brief forbade the builder the whole unit suite and the build, which the rules file asks for; both ran on main here.

## Verification on main

- `land.sh Q77b fcbcfc0e`: red at the unit suite on the comment-width check (`Tests 1 failed | 5379 passed`), fixed at landing.
- After the fix: unit `Test Files 343 passed (343)`, `Tests 5380 passed (5380)`; `npm run check` `0 ERRORS 0 WARNINGS`; build exit 0; Prettier clean; lint exit 0; ASCII no output; size and folder checks exit 0; browser `467 passed (8.2m)`; `$TMPDIR/oculus-*` holds only the pre-existing `oculus-revert-vwIMNl`.
- revert-check: the round reviewer's run `17 reverts, 0 unproven, 0 unchecked` over `revert-base.test.ts`; not rerun at landing, since the cherry-pick applied with no conflict and the landing fix is a comment.
- No look: Q77b changes tooling and tests, no view.
- Every agent of the step has ended: the builder and both reviewers returned their final message.

## Next

L7, alone.
