# O159 landing

Position: roadmap entry "migration" (the oculus migration plan); step O159, one folder search per hub, landed; next: O151 prepared and built, then the landings of O166 and O161.

## Open items

None.

## Check of the landing's step 1

`ListAgents` listed no agent of O159 (only O151's brief check was running): the builder a1fc9c46cf69b0c9f and the reviewers acce973629dd121c5, a864d9923908a74ce and ab49ab10318c7d20f had ended.

## NOT DONE

Nothing.

## What landed

One store of folder-glob matches per server (`src/lib/data/sources/documents/folder-globs.ts`, `ServerContext.deckGlobs`), read by the snapshot build, the deck route and the deck writes, so the portfolio deck's `projects/**/present` walks a hub once. The drop rule (`src/lib/server/root/watch/portfolio/glob-drop.ts`) drops a key at a folder made, moved or removed under its fixed folder; `glob-watch.ts` watches a key no recursive watch of the watcher covers; a project folder made, moved or removed under a scan folder, or a filing folder holding projects moved in, rebuilds the snapshot. 45 paths, 1820 insertions and 175 deletions.

## Fixes at landing

- Review over round 1, Spec 1: a filing folder holding projects, moved into a scan folder, rebuilt nothing. `movedFolder` now answers a folder inside a snapshot project with no rebuild and any other folder by `holdsProject` (`src/lib/data/sources/manifests.ts`). Two rows in `tests/server/root/watch/glob-drop.test.ts`, one failing first (`expected true to be false`); one case in `tests/server/root/watch/deck-folders.test.ts`, failing first (`Test timed out in 15000ms`). After the fix: 27 of 27 and 11 of 11 pass.
- Review over round 1, Standards 2: the comments of `audited.ts` (`NEVER`) and `glob-drop.ts` (`GlobEvent`) rewrapped whole at 100 columns; the head comments of `glob-drop.ts` and `portfolio.ts` state the rule as built.
- `agents/guarded.md` G32 names the store, the drop rule, the watch, the deck writes and the four test files.
- The dispositions of every finding are under "Closed" in `agents/reviews/O159-refuter.md`.

## Verification

In the gate worktree at main's head f38735e37 (`.agents/worktrees/gate-O159.log`): `npm run diagrams && npm run docs:palette && npm run test:quick`. prettier, ASCII gate, svelte-kit sync, eslint, svelte-check ("585 FILES 0 ERRORS 0 WARNINGS") and vitest checks ok; five tests failed on `Test timed out`, and their five files alone passed ("Test Files 5 passed (5)", "Tests 110 passed (110)"). On main: the same range and the gate's files, `cmp` of the staged diffs SAME. Not covered: tests that reach no changed file within the import depth, the build, the lint of unchanged files.

Item 9, over the research hub: a fresh store per read mean 1157.4 ms (sd 188.0 ms); one warm store mean 18.4 ms (sd 3.1 ms).

## The look

On 8797 (the gate's code, the server restarted for the server change): the portfolio deck draws 27 of 27 slides, "25 projects"; "submitted / under review" gives "11 of 25 shown" and 13 slides; Clear all gives 27 slides and "25 projects" back; no console error.

## Agents

Builder a1fc9c46cf69b0c9f (claude-opus-5-5): build 301370 tokens, 330 tool uses, 91.5 min; round 1 229668 tokens, 143 tool uses, 37.2 min. Brief check a1e03b87281fab689: 250038 tokens, 80 tool uses, 13.5 min. Reviewer acce973629dd121c5 (discarded): 262813 tokens, 60 tool uses, 17.4 min. Reviewer a864d9923908a74ce: 268862 tokens, 59 tool uses, 15.6 min. Reviewer over round 1 ab49ab10318c7d20f: 252595 tokens, 62 tool uses, 16.4 min. The builder's first report did not pass its bar (one repair round).
