# Step Q86 refuter report (reviewer a8593cf041460a438, on .agents/worktrees/Q86, base fd4a8f3d)

## Verification

`checks.sh` from the worktree's tools/oculus: `npm test` gives `Test Files  1 failed | 351 passed (352)`, `Tests  1 failed | 5609 passed | 1 skipped (5611)`, `checks: failed with exit 1: npm test`; the one failure is `tests/checks/tree/scratch.test.ts:239` (`expect(existsSync(join(dir, '..', 'out.txt'))).toBe(false)`), which fails alone too (`Tests  1 failed | 9 passed (10)`) on `$TMPDIR/out.txt`, a file the step does not write. Run one by one after it, each exit 0: `npm run check` (`COMPLETED 1491 FILES 0 ERRORS 0 WARNINGS`), `npm run build`, `npm run format:check`, `npm run lint`, `! LC_ALL=C grep -rna '[^ -~]' src tests`. The two greps of the cases ruling item 4 print nothing; `grep -rl viz-js build/server` prints nothing (the client loads it by a dynamic import of a 1356054-byte chunk, 484070 gzipped). `npm run diagrams` not rerun. `grep -rn "seededRandom\|\bRng\b" src tests bin` prints nothing; the spec's ASCII gate prints nothing; `bash bin/folder-check.sh` exit 0; `Graph.svelte` 522 lines; no file over 1000 lines. `layout.test.ts` 11 passed; `client-state.test.ts` 5 passed; `git-ops.test.ts` 37 passed; the six map, layout, graph, client-state, boundaries and size files 81 passed.

## 1. Spec

1. `src/lib/state/boards/structure/layout.ts:107-116`: each node is written under its index `n<at>` where brief item 1 names "each node's id"; a substitute for the named shape, stated as a judgment call in the report and in `DESIGN.md:290`, and the odd-id case holds under it.
2. The case "Pressing re-tune writes `start` with the seed one above" is checked only through `nextStart()` (`graph.test.ts:348`, `map.test.ts:345-360`); `Map.svelte:95-97` `retune` is covered by no test (a revert to `write({ start: undefined })` leaves every test green, by reading), while the report's DONE row 5 presents it as proven.
3. The cases ruling item 3 says `seededRandom` is at `graph.ts:410`; on main it is at `:408`.

## 2. Proof

1. The report (`:114`, `:154`) says `npm run diagrams` changed no file; `git status --short` shows `layer-state`, `layer-views` and `layers` `.dot` and `.svg` changed (edge counts for the new imports, which are right).
2. `layout.test.ts:113-118` (one node, and an empty graph): the report's revert (the fit without the box terms) does not turn it red, by reading (a single node has span 0; an empty graph returns early); it is an audit.
3. The other reverts of the report were judged by reading and hold; the two rows the report marks as audits are audits.

## 3. Standards

1. `layout.ts:96-97` "every edge undirected at the length the drag tick pulls a link to, so a drag keeps the picture's spacing" is false whenever the fit scale is not 1: `placeGraph` scales every distance by `min(1.5, 904/spanX, 584/spanY)` (about 0.64 on the test graph, less on the hub), while `physics` pulls a link back to 107 px. The report's judgment call repeats it.
2. `tests/state/client/client-state.test.ts:13` `'graphviz',` is outside the path lists; it is a direct consequence of the ruled `ClientState.graphviz` key (`STORES` lists every key of the type).

## 4. Behaviour

1. The first drag reflows the whole map: `pointerMove` reheats to alpha 0.4 over every node under `DEFAULT_PHYSICS`, and neato's picture is not the tick's rest state (scaled edge lengths, repulsion 9200, the centre pull), so every node moves for several hundred frames. Before the step the picture on screen was the tick's own settled output, so a drag disturbed it locally. The report says only "Dragging a node still pulls its neighbours" and that the reflow happens "as it did before the step", which is not the before.
2. The failure line has no before and after in the report and no way to provoke it at the look.
3. The server render and the first paint draw no node until the chunk loads, on every page load; before, the server render drew the placed nodes. The report states the after only.

## Not checked

The builder's reverts by run; `npm run diagrams` by rerun; `@viz-js/viz` in a browser; placement time on the hub's graph; how far a drag moves the real picture.

Reviewer usage: 28 tool uses, 166k tokens, 11 min (from the completion notice). The reviewer wrote five log files to `$TMPDIR` and removed them in the same run.

## Repair round 1, refuted (reviewer abae33b8a8a765dfa, round delta `git diff 6051e84f`)

### Verification

`checks.sh`: `Test Files  1 failed | 351 passed (352)`, `Tests  1 failed | 5611 passed | 1 skipped (5613)`, `checks: failed with exit 1: npm test`; the one failure is `tests/checks/tree/scratch.test.ts` (open item Z48), which fails alone too (`Tests  1 failed | 9 passed (10)`). Then each exit 0: `npm run check` (`COMPLETED 1491 FILES 0 ERRORS 0 WARNINGS`), `npm run build`, `npm run format:check`, `npm run lint`, the ASCII grep. The two greps of the cases ruling item 4 and `grep -rl viz-js build/server` print nothing. The step's four test files: `Tests  62 passed (62)`. `Graph.svelte` 531 lines.

A drag probe (a scratch script importing the worktree's `layout.ts` and `graph.ts`; a 44-node graph, neato seed 1, the loop of `Graph.svelte` `step` from alpha 0.4 to 0.03 with `dragPhysics(scale)` and `neighbours()`): scale 0.799; 9 pairs closer than the tick's collision separation; no node outside the movers moves; without movers 44 of 44 move. A press on `line::a` with no displacement moves its neighbours up to 52.9 px, from 91 to 117 px as placed to 99 to 159 px, against a drawn link length of 85; on `project::p0` up to 14.1 px.

### 1. Spec

1. `graph.ts:515-523` `dragPhysics`: `center: 0` is within round item 1; `repulse * scale ** 3` and `collide * scale` go beyond it, and on the probe they do not make the drag more local (52.9 px with them, 45.7 px with the link length alone).

### 2. Proof

1. `graph.test.ts:314-328` "moves only the movers of a drag" has no pair within the collision separation, so the collision guard (`graph.ts:453-460`) is an audit.
2. Reverting `repulse * scale ** 3` or `collide * scale` leaves every test green, by reading; the report neither claims nor marks them as audits.
3. The report's after ("only the dragged node's direct neighbours move, toward the drawn link length from it") is not reproduced: on the probe they move away from it.

### 3. Standards

1. `graph.ts:510-514` ("so a neighbour settles at the picture's own spacing") and `layout.ts:97-99` ("so a dragged node's neighbours keep the picture's spacing") are false under the parameters `dragPhysics` returns.

### 4. Behaviour

1. A press on a node, even a click with a little pointer jitter, jolts its neighbours outward: `pointerMove` (`Graph.svelte:227-239`) reheats to alpha 0.4 on any move while a node is held, under the 3 px threshold too, and the neighbours are pushed by every node's repulsion and by the collision push, which alpha does not scale. The report does not state it.

### Not checked

The drag in a browser; the hub's own graph; whether blocking the Graphviz chunk shows the failure line at the look; `npm run diagrams` by rerun; the builder's reverts by run.

Reviewer usage: 30 tool uses, 154k tokens, 7 min (from the completion notice).
