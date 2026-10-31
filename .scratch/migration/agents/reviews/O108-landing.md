# O108 landing

Position: roadmap entry "migration (cockpit to oculus)"; step O108, one desktop app, landed. Next: the second half of O109: the three archives rebuilt, the app started, `v1.0.0` replaced.

## Open items

None.

## The check of Steps 1

The builder a33cd40f409b38c5b and the reviewers a1bbebe0eb696ea45 and a85a27d09fd39ab43 had ended before the worktree was committed, by their completion notices.

## Not done

`signSteps` in its new form has not run in a real build; the rebuild runs it. `tests/server/desktop/start.test.ts` was not rerun with O108 and O109 together; the real app start after the rebuild checks that path.

## What landed

`npm run app:package`, `src/desktop/package.ts` and the `not_built` dialog are gone. `src/desktop/release-steps.ts` holds the steps of `npm run app:release`, and `signSteps` takes the platform. 8 files, +168 -285. G85 updated.

## Found

The first review raised S1, P1, St1, St2, B1 and B2, closed in `agents/reviews/O108-refuter.md`. The review over the round found nothing. No view changes, so no look. No A/B configured.

## Verification

`npm run diagrams && npm run docs:palette && npm run test:quick` in the gate worktree: `test:quick: 43.0 s; every command passed`. It does not cover the build or `start.test.ts`.

## Usage

Builder a33cd40f409b38c5b: 183950 tokens, 56 tool uses, 26.2 minutes; round 1 13 tool uses, 2.5 minutes. Reviewer a1bbebe0eb696ea45: 174612 tokens, 27 tool uses, 21.6 minutes. Reviewer over round 1 a85a27d09fd39ab43: 159344 tokens, 15 tool uses, 4.9 minutes. Brief check a0fc607785681fa26: 166795 tokens, 21 tool uses, 7.5 minutes. The first report needed one repair round; no fix at landing.
