# Q86 repair round 1 (sent 2026-09-29 from worktree commit 6051e84f)

Read `agents/reviews/Q86-refuter.md` in the main checkout in full, then do each item below. Every rule of the brief, the cases ruling and the spec still holds: work only in your worktree, no git command, no browser test, no tmux on the default server, no `// revert:` lines. Run only the test files you change while working, then the verify list once at the end, as the cases ruling item 5 says, and rewrite the report at the brief's path in full.

## Code

1. **A drag disturbs the picture locally (Behaviour 1, Standards 1).** Brief item 2 keeps the drag tick so that "a dragged node pulls its neighbours", and today a drag moves the settled picture only locally. With neato's picture, which is not the tick's rest state, the first drag moves every node. Change the drag so it does what the brief says:
   - while a node is dragged, only that node's direct neighbours (the nodes an edge joins to it) move; every other node stays where it is, whether neato placed it or an earlier drag moved it;
   - the tick's link length is the drawn one: `DEFAULT_PHYSICS.linkLength` times the scale the placement fitted the picture by, so a neighbour settles at the picture's own spacing. `placeGraph` answers that scale beside the nodes, and `mapPlacement` passes it to the view;
   - `physics` keeps one tick for the whole graph, taking the set of nodes that may move (in place of the single `fixed` id, the dragged node being held as today), so the rule is one function in `graph.ts`, tested there.
   Tests: a tick with a node held and a set of movers moves no node outside the set, and moves a mover joined to the held node toward it; a neighbour at the drawn link length from the held node, with no other force on it, is left where it is. Each names the revert that turns it red.
2. **The comment and the judgment call (Standards 1).** `layout.ts:96-97` and the report's judgment call say what is true after item 1: neato lays edges out at the tick's link length, the picture is scaled to fit the box, and the drag tick runs at the drawn length.

## Report

3. **Re-tune (Spec 2).** The press itself (`Map.svelte` `retune`) is an audit, seen at the look; `nextStart` is the proof. Say so in DONE row 5 and in the revert table.
4. **The diagrams (Proof 1).** `npm run diagrams` changed `layer-state`, `layer-views` and `layers` `.dot` and `.svg` (the edge counts of the new imports). Say so at `:114` and `:154`.
5. **One node and an empty graph (Proof 2).** The case is an audit: no revert of the fit turns it red. Say so, or name a revert that does and show it red.
6. **The node's index (Spec 1).** Ruled: each node is written under its index, as built; the odd-id case holds under it. The report carries this ruling.
7. **Before and after (Behaviour 1, 2 and 3).** State each with its before:
   - the drag, as item 1 leaves it, against the base's drag over a settled picture;
   - the failure line: before, no failure path; after, one status line "The map could not be laid out: <reason>" above an empty drawing, and a way to see it at the look if there is one without a code change, else "not provokable at the look";
   - the first paint: before, the server render drew the placed nodes; after, every page load draws no node until the Graphviz chunk (1356054 bytes, 484070 gzipped) has loaded.
8. **The path outside the lists (Standards 2).** Ruled: the `'graphviz'` line of `tests/state/client/client-state.test.ts` stays, as a direct consequence of the ruled key. The report lists the file.

The cases ruling's `graph.ts:410` for `seededRandom` is `:408` on main (Spec 3); nothing changes for it.
