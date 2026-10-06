# Q90 landing

## Open items

None.

## NOT DONE

Nothing of Q90's brief.

## What landed

Q90, the Audit reads a link that is a web address as an address, one commit on main (the commit that carries this file):

- `src/lib/data/hub-address.ts` holds `ADDRESSED`, `HOSTED` and `isHubPath()`, the one rule telling a path of the hub from a web address; `src/lib/state/boards/collection.ts` imports it and re-exports `isHubPath`, and `tests/checks/tree/boundaries.test.ts` registers the module in the state row.
- `src/lib/server/content/audit/projects.ts` reports `link path missing` only for a trimmed link `isHubPath()` calls a hub path, inside the hub, with nothing on disk.
- Over the hub on main the scan returns 1 finding (the ISLES 2024 `%VERIFY` marker) where it returned 64; no `link path missing` is left. Link shapes no longer looked for on disk: a scheme (`https:`, `mailto:`), a leading slash, a `www.` value, a host with a path; and a path above the hub.

## Fixed at landing

1. The review's F1: `npm run diagrams` regenerated `docs/diagrams/layers`, `layer-server` and `layer-state` (`.dot` and `.svg`) for the new import edges; `npx vitest run tests/checks/diagrams` passes.
2. The review's edge note: the Audit trims the link as the card does and never reads a path outside the hub; two entries added to the case (a padded path, a path above the hub) and two directives, each red under its revert.

## Verification on main

- `land.sh Q90 26f7d178`, exit 0, 13 min 8 s: `Test Files  341 passed (341)` / `Tests  5348 passed (5348)` / `Duration  136.86s`; `COMPLETED 1510 FILES 0 ERRORS 0 WARNINGS`; `All matched files use Prettier code style!`; the browser suite `467 passed (8.5m)`.
- In the worktree after the landing fixes: `npx vitest run tests/server/content/audit.test.ts tests/checks/diagrams tests/checks/tree/boundaries.test.ts` `122 passed`; `node bin/revert-check.mjs tests/server/content/audit.test.ts` `3 reverts, 0 unproven, 47 unchecked` (the 47 are cases carrying no directive).
- The audit scan over the hub on main (`auditFindings` called as `portfolio.ts:325` calls it): 1 finding, `link path missing: 0`.
- The look was owed, since the Audit view draws the scan's rows. It was taken 2026-09-28 on the TEST page of Axel's Chrome on 8790: the Audit view lists one open item, the ISLES 2024 `%VERIFY` marker under data, and no `link path missing` row. Nothing found.

## Next

Q77d (in its review), then Q77a, Q77b and Q77e, then L7.
