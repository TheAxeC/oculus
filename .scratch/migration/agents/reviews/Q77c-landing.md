# Q77c landing

## Open items

None.

## NOT DONE

Nothing of Q77c's brief.

## What landed

Q77c, a revert directive names its target line by the line's text, one commit on main (the commit that carries this file):

- `bin/revert-check.mjs` reads `// revert: <path> "<the line's trimmed text>" [+n] [.. "<last line's text>" [+n]] => <replacement>`: the text is a JSON string matched by equality against the target's trimmed lines, `+n` counts down from the nearest unique line where the target's own text repeats, and a range names both ends. A text matching no line or several, an offset past the end, a text that is not a JSON string, and the old numbered form are each unproven with the reason.
- `bin/migrations/revert-anchors.mjs` converts numbered directives, proving each new anchor names the line the old number named; its run over the tree printed `1742 directives converted in 235 files written, 0 refused`.
- Every directive of the tree is in the new form.

## Fixed at landing

1. The review's Proof 1: a new case for a quoted text that is not a JSON string, red under its revert.
2. The review's Proof 2: two new converter cases, one for a target outside the tree, lines past the end and a line with no unique line above, one for `--root` without a folder, each red under its revert.
3. The review's Standards 1: the head comment no longer says a `=>` is written with a JSON escape.

## Found, not changed

- A line that starts like a directive but does not parse is not reported (the review's Behaviour note); the numbered form behaved the same, and such a line leaves its case `unchecked`.

## Verification on main

- `land.sh Q77c b1770828`, exit 0, 926.78 s: `Test Files  341 passed (341)` / `Tests  5344 passed (5344)`; `npm run check` `COMPLETED 1509 FILES 0 ERRORS 0 WARNINGS`; `All matched files use Prettier code style!`; the browser suite `467 passed (10.3m)`.
- After the landing fixes: `npx vitest run tests/checks/bin/revert-check.test.ts tests/checks/bin/revert-anchors.test.ts tests/checks/source/comment-width.test.ts` `39 passed`; `node bin/revert-check.mjs tests/checks/bin/revert-check.test.ts tests/checks/bin/revert-anchors.test.ts` `39 reverts, 0 unproven, 0 unchecked`; `node bin/migrations/revert-anchors.mjs --check` `0 directives converted in 0 files written, 0 refused`; `npm run check` 0 errors; lint exit 0; Prettier clean; ASCII gate no output; size and folder checks exit 0.
- The review resolved all 1742 converted directives against the target files at the base: 0 mismatches.
- No look: Q77c changes tooling and test comments, no view.

## Next

Q77d (in flight; at its landing Q77c's converter reruns over its changed test files), then Q77a, Q77b and Q77e, then L7.
