# Q77e landing

## Open items

None.

## NOT DONE

Nothing of Q77e's brief.

## What landed

Q77e, the diagram generator parses each source file once, one commit on main (the commit that carries this file):

- `bin/diagrams/parsed.mjs`: `parseReader(cache)` keeps each file's imports and code under its path with the text they came from, and computes them again only for a different text.
- `generate(engine, cache)` passes one reader to every diagram; `staleFiles(engine, drawn, cache)` passes the cache on. One generation of the engine: 1.73 to 1.92 s at load about 9, where it took 6.4 to 7 s. `npm run diagrams` changes no drawing.
- `tests/checks/diagrams/diagrams.test.ts`'s changed-copy case asserts one cache entry and one call of each parser per source file, then exactly the two changed files again; its seven directives are red.

## Fixed at landing

1. The duplication check found the two parser wrappers written twice (`diagrams.test.ts` and `parsed.test.ts`); they now call one helper, `tests/checks/diagrams/counted.ts`.
2. The plan line named a content-hash cache; it now names the in-memory cache the brief decided.

## Found, not changed

- `readable.test.ts` passes a cache of its own to its one generation, which nothing reads again; the brief asked for it and it does no harm.
- Two sentences of the round report are wrong: `tree.ts` is new in the round, and no committed state held the generation case in `parsed.test.ts`.
- The round was finished by a continuation builder after an interrupt stopped the first one inside it.

## Verification on main

- `land.sh Q77e 15a88e95`: red at the unit suite on the duplication check (`Tests 1 failed | 5351 passed`); after the fix, by hand: `Test Files 342 passed (342)`, `Tests 5352 passed (5352)`; `npm run check` `COMPLETED 1514 FILES 0 ERRORS 0 WARNINGS`; build ok; `All matched files use Prettier code style!`; lint exit 0; the ASCII gate no output; size and folder checks exit 0; browser `467 passed (10.6m)`.
- `node bin/revert-check.mjs tests/checks/diagrams/diagrams.test.ts`: `56 reverts, 0 unproven, 0 unchecked`, 373.05 s; `parsed.test.ts`: `5 reverts, 0 unproven, 0 unchecked`.
- No look: Q77e changes tooling and tests, no view.
- Every agent of the step has ended: both builders and both reviewers returned their final message.

## Next

Q77a's review, then its landing; Q77b after it; then L7.
