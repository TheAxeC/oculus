# M8, cases ruling (round 0)

The builder's first run handed back case 10 and verify items 1 and 3: on the unchanged tree G14 (`tests/checks/config/integrity.test.ts`) failed two tests, because `config/sources.yml:24` names `portfolio_deck: deck` and the worktree's sparse checkout held no `deck/` folder.

Ruling (Z717): the worktree's paths gain `deck` (and the hub's `docs`, which M8 writes), and the base copy `.agents/worktrees/M8-base` gains `deck/`. On the worktree as it now is, `npx vitest run tests/checks/config/integrity.test.ts` from `tools/oculus` prints `Test Files  1 passed (1)` and `Tests  8 passed (8)`. Case 10 and verify item 3 stand as the brief words them: G14 gives zero findings on the worktree's hub. Rerun the deck-dependent first runs (case 10 and the scratch `buildPortfolio` baseline) and go on with the build; every other requirement of the brief is unchanged.
