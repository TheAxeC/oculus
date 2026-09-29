# Q86 repair round 2 (sent 2026-09-29 from worktree commit 7bc5e1ad)

This is the round the cap allows beyond `repair_rounds` when an acceptance item of the brief is unbuilt and the fix is too large for landing. Brief item 2 ("dragging keeps pulling its neighbours as today") and round 1 item 1 ("a neighbour settles at the picture's own spacing") are unbuilt: the round's review (`agents/reviews/Q86-refuter.md`, "Repair round 1, refuted", in the main checkout) measured a press with no displacement moving a pillar's neighbours up to 52.9 px outward, from 91 to 117 px as placed to 99 to 159 px. Read that section in full, then do each item below. Every rule of the brief, the cases ruling, round 1 and the spec still holds: only your worktree, no git command, no browser test, no tmux on the default server, no `// revert:` lines, the verify list once at the end as the cases ruling item 5 says, and the report rewritten in full.

The cause is that the tick pushes a neighbour with forces the placed picture is not at rest under: every node's repulsion, the collision push, and springs whose rest length is one number for every edge, while neato's edges have many lengths. The fix is that each edge rests at its own length.

## Code

1. **Each edge rests at the length it has when the press begins.** When a node is pressed for a drag, the Map records the length of every edge at that moment. While the drag runs, `physics` pulls each edge toward its recorded length, in place of one `linkLength` for every edge. `physics` takes these lengths as one more optional argument, a map from edge id to length; without it every edge rests at `params.linkLength`, as now.
2. **Only the springs move a neighbour.** The drag tick runs with no repulsion, no collision push and no centre pull, so the placed picture is at rest under it: a press that does not move the pointer moves nothing, and a drag moves each neighbour after the dragged node, held back by its other edges at their recorded lengths. `dragPhysics(scale)` goes; a constant `DRAG_PHYSICS` in `graph.ts` (the defaults with `repulse`, `collide` and `center` at 0) takes its place.
3. **No reheat before the pointer has moved.** `pointerMove` starts the tick only once the move threshold is passed (`moved` true), so a click on a node never runs the tick.
4. **What goes.** `placeGraph` no longer answers a `scale`, and `Placed` and `mapPlacement` drop it, since nothing reads it once item 1 is built. `neighbours()` stays: the movers are still the dragged node's direct neighbours.

## Tests

5. In `graph.test.ts`, each naming the revert that turns it red and each seen red:
   - a tick under `DRAG_PHYSICS` with the lengths recorded from the nodes as they stand moves no node (a picture at rest stays at rest), on a graph whose edges have different lengths and some pairs closer than the default collision separation;
   - the dragged node moved by some distance, a neighbour joined only to it follows toward its recorded length from it;
   - an edge with no recorded length rests at `params.linkLength` (the fallback);
   - the collision guard: with movers and two non-movers inside the collision separation of each other under the default parameters, neither moves (this closes the audit the review named).
6. The tests of `dragPhysics` and of the placement's `scale` go with them.

## Report

7. The comments of `graph.ts` (`physics`, the drag constant), `layout.ts:96-99` and the head comment of `Graph.svelte` say what is true after items 1 to 4: neato lays edges out at the tick's link length, the picture is scaled to fit, and a drag pulls the dragged node's neighbours toward the lengths their edges had when the press began. `DESIGN.md:290` the same, if it names the drag's parameters.
8. The report states the drag's before and after again: before the step, a drag moved a settled picture locally; after round 1, a press moved a pillar's neighbours up to 52.9 px outward (the review's probe); after this round, a press that does not move moves nothing, and a drag moves the dragged node's neighbours after it at their own lengths. It gives the result of running the review's probe setup again (the same kind of 44-node graph, a press with no displacement, then a 60 px drag) with the numbers, from a scratch script in your own scratch folder, not in the tree.
