# Q86b report: the Map's drag after neato's placement, the pointer through the letterbox, labels off the nodes

Everything in the brief is done, with the ruling of `agents/briefs/Q86b-cases.md` applied.

## Open items of the main checkout's state file, verbatim

> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.
>
> None.

## The cases' first run, and the ruling

First run on the unchanged source, every case written as a test first (`npx vitest run tests/state/boards/structure/graph.test.ts tests/state/boards/structure/layout.test.ts tests/views/structure/map-labels.test.ts tests/views/structure/map-pointer.test.ts`): `Test Files 3 failed | 1 passed (4)`, `Tests 21 failed | 42 passed (63)`.

| Case | First run |
|---|---|
| press with no move (`line::a`, `project::p0`) | red: `settle is not a function` |
| drag of a node joined to nothing | red: `settle is not a function` |
| circles apart after 60, 200, -200 of `line::a` | red: `settle is not a function` |
| close pair kept at its distance | red: `settle is not a function` |
| the creep ends | red: `settle is not a function` |
| `settle` stops | red: `settle is not a function` |
| press during a running settle | red: `Cannot read properties of undefined (reading 'movers')` |
| empty node set | red: `settle is not a function` |
| one node | red: `settle is not a function` |
| two nodes coincident at the press | red: `settle is not a function` |
| apart at the press, coincident in a frame | red: `Cannot read properties of undefined (reading 'movers')` |
| `toBox`, `toGraph` | red: `Cannot find module '../../../src/lib/views/structure/map/pointer.ts'` |
| label over another project's circle | red: `expected [ 'p1', 'p2' ] to deeply equal [ 'p2' ]` |
| label over a pillar's or a collaborator's square | red: `expected [ 'p1', 's' ] to deeply equal [ 's' ]` |
| collaborator's label over a project's circle | red: `expected [ 'c', 'p' ] to deeply equal [ 'p' ]` |
| pillar's label over another pillar's square | red: `expected [ 'a', 'b' ] to deeply equal [ 'b' ]` |
| label over its own node only | green (the old rule reads no node) |
| pillar label placed before a project label | red: `expected [ 'p' ] to deeply equal [ 'l' ]` |
| two overlapping pillar labels | green (the old rule walks the graph order too) |
| leading label, pillar label over it | green (the old rule gives the same answer) |
| zero-width label on an edge, inside a label, inside a circle | red: `expected [ 'a', 'b', 'd' ] to deeply equal [ 'a', 'b', 'c', 'd' ]` |
| the grep of `repulse|collide|center|cool|DRAG_PHYSICS` | red: 20 lines printed |

The `toBox` and `toGraph` expectations were checked by hand before the run (1410 by 595: scale 0.875, picture left 332.5, 202 / 0.875 = 230.857; 600 by 1000: top 296). The first run on the unchanged tree found no case wrong. Built to the brief's letter, item 1 then gave two cases a wrong result, handed back with the evidence:

1. The gap limit. Rule: one push pass per frame. Result: `60: project::p0 and project::p36: expected 19.6288 to be >= 19.99`, largest shortfall 0.70 over 15 drags, still there after 3000 more frames. Ruling: the push runs up to `PUSH_PASSES` (10) passes per frame, the bounds clamp inside each pass, stopping at a pass that pushes nothing; the case stands.
2. The rest. Rule: damping 0.88 with `moved < REST`. Result: an underdamped spring stops at the end of a swing; a lone spring stopped at 462.44 against 460, `line::b` -200 moved 4.73 on a second settle, `line::c` 200 reached the frame cap. Ruling: `DEFAULT_PHYSICS.damping` is 0.6, the rest rule stands; "the creep ends" and "`settle` stops" run over 15 drags (`line::a` to `line::d` and `project::p0`, each at 60, 200 and -200), each asserting no settle reaches `MAX_FRAMES` and a second settle moves no node more than 0.01; the neighbour-to-its-length case runs through `settle` within 0.5.
3. `pressHold` keeps the speeds the finished settle leaves (ruled as built).

The largest move of each second settle, per drag (the creep case's printed line, `npx vitest run tests/state/boards/structure/graph.test.ts --reporter=verbose`):

```
line::a 60: 859 frames, then 0.0099617603957446
line::a 200: 646 frames, then 0.00992054749176044
line::a -200: 467 frames, then 0.009826353421778723
line::b 60: 1033 frames, then 0.00995752239619105
line::b 200: 601 frames, then 0.009895390766708333
line::b -200: 522 frames, then 0.009925092812481153
line::c 60: 1127 frames, then 0.009969598152283161
line::c 200: 557 frames, then 0.009737294939354789
line::c -200: 667 frames, then 0.009882685113103138
line::d 60: 625 frames, then 0.00995053975984948
line::d 200: 496 frames, then 0.009934712364933854
line::d -200: 608 frames, then 0.009935501366978529
project::p0 60: 22 frames, then 0.008018101437899598
project::p0 200: 27 frames, then 0.008103009672321724
project::p0 -200: 28 frames, then 0.006518661912081971
```

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1. The drag physics (`graph.ts`) | DONE | `graph.test.ts` `Tests 35 passed (35)`; the reverts R1 to R16 below |
| 2. The drag loop (`Graph.svelte`) | DONE | `npm run check` 0 errors; no new `$effect`, so `map.test.ts` is untouched and passes (`tests/views/structure` in `npm test`); DOM behaviour is for the look |
| 3. The pointer mapping (`pointer.ts`) | DONE | `map-pointer.test.ts` `Tests 5 passed (5)`; reverts P1 to P5 |
| 4. The labels (`labels.ts`) | DONE | `map-labels.test.ts` `Tests 17 passed (17)`; reverts L1a to L9b |
| 5. Tests | DONE | every case above is a test; the fixture in `map-fixture.ts`, imported by `layout.test.ts` and `graph.test.ts` |
| 6. Documents and comments | DONE | `DESIGN.md:291`, `HELP.md:103`, the head comments and docstrings; the grep below |
| The plan's verify list | DONE | `checks.sh` output below, `checks: 6 commands passed` |
| The cases' grep and the perl ASCII gate | DONE | both print nothing |
| `bash bin/folder-check.sh`, `npm run diagrams` | DONE | both exit 0 |
| Each test's revert, red | DONE | the table below |

The plan's verify list, `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md </dev/null`, run from the worktree's `tools/oculus`, exit 0; its lines:

```
$ npm test
 Test Files  366 passed (366)
      Tests  5811 passed | 1 skipped (5812)
$ npm run check
1790697553569 COMPLETED 2113 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 6 commands passed
```

An earlier run of the same list, at load average 12.8, failed eight cases by timeout in four files the step does not change (`tests/checks/imports/order.test.ts`, `tests/checks/source/keys.test.ts`, `tests/server/core/git-reads.test.ts`, `tests/server/git/git-ops.test.ts`); alone each passed (13, 8, 17 and 37 of each). The run quoted above is the last one, at load average 4.9.

The other gates, from `tools/oculus`:

```
$ bash bin/folder-check.sh            -> exit 0
$ npm run diagrams                    -> exit 0
$ grep -nwE "repulse|collide|center|cool|DRAG_PHYSICS" src/lib/state/boards/structure/graph.ts src/lib/views/structure/map/Graph.svelte tests/state/boards/structure/graph.test.ts
                                      -> prints nothing, exit 1
$ LC_ALL=C perl -ne '...' $(find src tests bin config -type f ! -name local.yml)
                                      -> prints nothing, exit 0
```

The grep of the changed names across `src`, `tests`, `DESIGN.md`, `HELP.md`, `README.md` and `config` (`grep -rn -e DRAG_PHYSICS -e reheat -e alpha -e "\bcool\b" -e repulse ...` and `grep -rn -e shownLabels -e holdFor -e dragTick -e DragHold -e "physics(" ...`): no hit of a removed name; every `shownLabels` call passes nodes; the six `allow-audits.txt` reasons naming `shownLabels(boxes, ...)` now name the three-argument call; `tests/views/structure/map.test.ts:367` keeps `params: { repulse: 1 }` as the brief says, and passes.

### Reverts, each run against its own case and restored

Each revert is a text replacement in one source file, run as `npx vitest run <test file> -t <case>` from `tools/oculus`, the file restored after it. The last run of all of them was on the tree after repair round 2; the sources were restored and `npx vitest run tests/state/boards/structure/graph.test.ts tests/views/structure` gave `Tests 102 passed (102)`.

| Case (as `-t` matches it) | Revert: the change undone | Red |
|---|---|---|
| moves only the movers of a drag | every node moves: `const moves = (node: PointNode): boolean => hold.movers.has(node.id);` to `const moves = (node: PointNode): boolean => node.id !== '' \|\| hold.movers.has(node.id);` | `expected [ 895.03056, 340 ] to deeply equal [ 900, 340 ]` |
| leaves a picture at rest | the push ignores the distance at the press: `const limit = Math.min(room, hold.apart.get(pairKey(a.id, b.id)) ?? room);` to `const limit = room;` | `expected { nodes: [ ...(5) ], ...(1) } to deeply equal { nodes: [ ...(5) ], moved: +0 }` |
| pulls a neighbour joined only | damping 0.88: `damping: 0.6,` to `damping: 0.88,` | `expected 462.4369833893811 to be close to 460, received difference is 2.436983389381112, but expected 0.5` |
| rests an edge with no recorded length | an unrecorded edge rests at 0: `?? params.linkLength;` to `?? 0;` | `expected 579.1936 to be 580 // Object.is equality` |
| answers the nodes an edge joins | neighbours by source only: `if (edge.target === id && edge.source !== id) found.add(edge.source);` deleted | `expected [ 'b' ] to deeply equal [ 'b', 'c' ]` |
| moves nothing on a press | the centre pull put back: `node.vx *= params.damping;` to `node.vx = (node.vx + (500 - node.x) * 0.012) * params.damping;` | `expected [ { id: 'line::a', ...(9) }, ...(43) ] to deeply equal [ { id: 'line::a', ...(9) }, ...(43) ]` |
| joined to nothing | every node takes the push: `if (!hold.movers.has(a.id)) continue;` to `if (a.id === '') continue;` | `expected [ { id: 'line::a', ...(9) }, ...(43) ] to deeply equal [ { id: 'line::a', ...(9) }, ...(43) ]` |
| keeps every circle | one push pass: `export const PUSH_PASSES = 10;` to `export const PUSH_PASSES = 1;` | `60: project::p0 and project::p36: expected 19.97040426885461 to be greater than or equal to 19.99` |
| settles every drag at rest | damping 0.88: `damping: 0.6,` to `damping: 0.88,` | `project::p0 200: expected 0.21677345232697948 to be less than or equal to 0.01` |
| stops a settle at rest | damping 0.88: `damping: 0.6,` to `damping: 0.88,` | `project::p0 200: expected 0.03263085048421701 to be less than 0.01` |
| finishes a running settle | pressHold does not finish the running settle: `running === null ? nodes : settle(nodes, edges, withoutMover(running, id)).nodes` to `nodes` | `expected 3.863896710070812 to be less than 0.01` |
| finishes a running settle | the running hold passed to settle unchanged: `settle(nodes, edges, withoutMover(running, id))` to `settle(nodes, edges, running)` | `expected 0.05640865116428925 to be less than 0.01` |
| pressed node where the press caught it | the running hold passed to settle unchanged: `settle(nodes, edges, withoutMover(running, id))` to `settle(nodes, edges, running)` | `expected [ 510.37015875936675, 340 ] to deeply equal [ 555.5502771335535, 340 ]` |
| keeps a close pair | the push ignores the distance at the press: `const limit = Math.min(room, hold.apart.get(pairKey(a.id, b.id)) ?? room);` to `const limit = room;` | `expected [ { id: 'held', ...(10) }, ...(2) ] to deeply equal [ { id: 'held', ...(10) }, ...(2) ]` |
| keeps a close pair | the push removed: `const pushed = push(next, hold, params);` to `const pushed = false;` | `expected 5.365076809659399 to be greater than or equal to 9.99` |
| edge of the box | the clamp once after all passes (in `graph.ts`, the lines of the push or the pass loop that do it) | `expected 16 to be greater than or equal to 19.99` |
| speed into a contact | the speed into a contact kept (in `graph.ts`, the lines of the push or the pass loop that do it) | `expected 59.124301578897054 to be less than or equal to 0` |
| settles an empty node set | settle runs to the frame cap: `if (tick.moved < REST) break;` deleted | `expected 2000 to be less than or equal to 1` |
| ends a press and a drag of one node | settle runs to the frame cap: `if (tick.moved < REST) break;` deleted | `expected 2000 to be less than or equal to 1` |
| moves neither of two nodes coincident | the spring loses its zero-length guard: `if (distance === 0) continue;` deleted | `expected [ { id: 'held', ...(10) }, ...(1) ] to deeply equal [ { id: 'held', ...(10) }, ...(1) ]` |
| parts two nodes apart | no x direction for a coincident pair: `const ux = distance === 0 ? 1 : dx / distance;` to `const ux = dx / distance;` | `expected false to be true // Object.is equality` |
| another project circle | no node check: `if (nodes.some((node) => node.id !== box.id && coversNode(box, node))) continue;` deleted | `expected [ 'p1', 'p2' ] to deeply equal [ 'p2' ]` |
| another project circle | a project read as its square: `if (node.kind !== 'project') {` to `if (node.kind !== 'none') {` | `expected [ 'p2' ] to deeply equal [ 'p1', 'p2' ]` |
| pillar's square or a collaborator's | every node read as a circle: `if (node.kind !== 'project') {` to `if (node.kind === 'none') {` | `expected [ 'p1', 's' ] to deeply equal [ 's' ]` |
| collaborator's label over | no node check: `if (nodes.some((node) => node.id !== box.id && coversNode(box, node))) continue;` deleted | `expected [ 'c', 'p' ] to deeply equal [ 'p' ]` |
| over another pillar's square | no node check: `if (nodes.some((node) => node.id !== box.id && coversNode(box, node))) continue;` deleted | `expected [ 'a', 'b' ] to deeply equal [ 'b' ]` |
| over its own node alone | the own node counted: `nodes.some((node) => node.id !== box.id && coversNode(box, node))` to `nodes.some((node) => coversNode(box, node))` | `expected [ 'q' ] to deeply equal [ 'p', 'q' ]` |
| placed before a project label | graph order only: `...boxes.filter((box) => pillars.has(box.id)),` deleted | `expected [ 'p' ] to deeply equal [ 'l' ]` |
| first in the graph order | pillars sorted by id: `...boxes.filter((box) => pillars.has(box.id)),` to `...boxes.filter((box) => pillars.has(box.id)).sort((a, b) => a.id.localeCompare(b.id)),` | `expected [ 'a' ] to deeply equal [ 'b' ]` |
| leading label is drawn over a node | leading labels checked against nodes: `if (!first.includes(box.id)) continue;` to `if (!first.includes(box.id) \|\| nodes.some((node) => node.id !== box.id && coversNode(box, node))) continue;` | `expected [ 'l', 'q' ] to deeply equal [ 'p', 'q' ]` |
| label of no width | zero width checked like any width: `if (!empty(box)) {` to `if (!empty(box) \|\| empty(box)) {` | `expected [ 'a', 'b', 'e', 'f' ] to deeply equal [ 'a', 'b', 'c', 'd', 'e', 'f' ]` |
| label of no width | a kept zero-width label covers: `kept.some((other) => !empty(other) && overlaps(box, other))` to `kept.some((other) => overlaps(box, other))` | `expected [ 'a', 'b', 'c', 'd', 'e' ] to deeply equal [ 'a', 'b', 'c', 'd', 'e', 'f' ]` |
| wide pane | the stretched mapping: `return { x: (client.x - left) / scale, y: (client.y - top) / scale };` to `return { x: ((client.x - rect.left) / rect.width) * 1000, y: ((client.y - rect.top) / rect.height) * 680 };` | `expected 143.2624113475178 to be close to 230.86, received difference is 87.59758865248222, but expected 0.005` |
| picture size maps one to one | the two ratios crossed: `const scale = Math.min(rect.width / DEFAULT_BOUNDS.width, rect.height / DEFAULT_BOUNDS.height);` to `const scale = Math.min(rect.width / DEFAULT_BOUNDS.height, rect.height / DEFAULT_BOUNDS.width);` | `expected { x: -54.41176470588235, ...(1) } to deeply equal { x: 123, y: 456 }` |
| tall pane | no vertical centring: `const top = rect.top + (rect.height - DEFAULT_BOUNDS.height * scale) / 2;` to `const top = rect.top;` | `expected 493.33333333333337 to be close to +0, received difference is 493.33333333333337, but expected 5e-10` |
| no size | no zero-size guard: `if (!(scale > 0)) return { x: 0, y: 0 };` deleted | `expected { x: Infinity, y: Infinity } to deeply equal { x: +0, y: +0 }` |
| pan comes off first | zoom before pan: `return { x: (box.x - pan.x) / zoom, y: (box.y - pan.y) / zoom };` to `return { x: box.x / zoom - pan.x, y: box.y / zoom - pan.y };` | `expected { x: 150, y: 120 } to deeply equal { x: 200, y: 145 }` |
| keeps the offset | the grab offset ignored: `return { x: at.x + grab.x, y: at.y + grab.y };` to `return { x: at.x, y: at.y };` | `expected { x: 503, y: 342 } to deeply equal { x: 500, y: 340 }` |
| quarter pixel | no pixel guard: `return Math.hypot(at.x - last.x, at.y - last.y) >= DRAG_PIXEL;` to `return Math.hypot(at.x - last.x, at.y - last.y) >= 0;` | `expected 300 to be +0 // Object.is equality` |
| one pixel away | no pixel guard: `return Math.hypot(at.x - last.x, at.y - last.y) >= DRAG_PIXEL;` to `return Math.hypot(at.x - last.x, at.y - last.y) >= 0;` | `expected true to be false // Object.is equality` |
| nearest project within | no reach past the radius: `if (held <= node.radius + LINK_REACH && held < distance) {` to `if (held <= node.radius && held < distance) {` | `expected undefined to be 'nearer' // Object.is equality` |

The seven unchanged-name cases of `map-labels.test.ts` only gained the third argument `[]`; they are audits on `allow-audits.txt` and assert what they asserted before.

## Files, with line counts (`wc -l`)

- `src/lib/state/boards/structure/graph.ts` 714
- `src/lib/views/structure/map/Graph.svelte` 539
- `src/lib/views/structure/map/labels.ts` 114
- `src/lib/views/structure/map/pointer.ts` 35 (new)
- `tests/state/boards/structure/graph.test.ts` 686
- `tests/state/boards/structure/map-fixture.ts` 57 (new)
- `tests/state/boards/structure/layout.test.ts` 212 (lines 1-45 only: `node()` and `edge()` now imported)
- `tests/views/structure/map-labels.test.ts` 166
- `tests/views/structure/map-pointer.test.ts` 46 (new)
- `tests/checks/tree/allow-audits.txt` 122 (six reasons in lines 67-73)
- `DESIGN.md` line 291, `HELP.md` line 103
- `docs/diagrams/` rewritten by `npm run diagrams`; whether their contents changed is not verified (no git command is run here)

`tests/views/structure/map.test.ts` is not written: no `$effect` was added.

## Judgment calls the brief left open (each reversible)

1. `apart` keys are `pairKey(a, b)`, the JSON list of the two ids sorted, exported from `graph.ts`, so no two pairs share a key whatever characters an id holds.
2. The push visits only pairs holding a mover, each once, and builds a pair's key only once the pair is inside its room (the limit is never more than that). This keeps the dense-graph cases at about 1.1 to 1.3 s each (`--reporter=verbose` timings); the order the pairs are pushed in is by index as before.
3. `Graph.svelte`'s press assigns `placed` from `pressHold` only when a settle was running, so a click on a map not yet dragged keeps drawing from neato's placement.
4. A kept label of zero width also covers nothing (the brief's "overlaps nothing, against labels and nodes alike" read both ways); the zero-width case gained a measured label after an unmeasured one inside it.
5. The existing cases 'moves only the movers of a drag', 'leaves a picture at rest', 'pulls a neighbour ... to its recorded length' and 'rests an edge with no recorded length' are kept on the new signature rather than deleted; the neighbours half of the old fields case is its own case, 'answers the nodes an edge joins to a node'.
6. The lone-node case also drops `project::alone` onto `line::a` and asserts nothing else moves; the case at 60 units alone was green under a revert where every node is a mover, so the drop is what makes it a proof.
7. `LabelNode.kind` is `'project' | 'line' | 'collaborator'`, the three kinds `GraphNode` has.
8. `Graph.svelte`'s `WIDTH` and `HEIGHT` constants are gone (the viewBox reads `DEFAULT_BOUNDS`), to keep the component under 540 lines.
9. The creep case prints each drag's frames and second-settle move with `console.log`, which is where the numbers above come from.

## User-visible changes, before and after (for the look on TEST)

- **A drag in a wide pane** (the Map pane wider than 1000:680, e.g. 1410 by 595): before, a 202 px drag of Neural Signal Processing & BCI left it about 100 px right of the start and a press jumped the node sideways; after, the node stays under the pointer through the drag and the press does not jump it.
- **A drag near other circles**: before, a neighbour could end on top of another circle; after, each neighbour stops at its two radii plus 4 from every other node, or at its distance at the press when neato placed it closer. The dragged node itself may still sit over a node that is not its neighbour.
- **A second pointer move at the same place**: before, each reheat moved the neighbours further (the creep); after, a drag settles at the springs' balance and a later move at the same place moves nothing visible (under 0.01 units per the table above). A drag of a pillar settles over up to 1127 frames, about 19 s at 60 fps; how visible the slow tail is on screen is not verified.
- **The wheel zoom and the pan in a wide pane**: before, the zoom anchor and the pan were off by the letterbox band in x; after, the zoom holds the point under the pointer and the pan follows it.
- **Which labels show in the dense middle**: before, labels were drawn across circles and the central pillar squares carried no label; after, the pillars' labels show first, and no label is drawn over a circle or a square other than its own node's until hovered or focused. Edges are not checked, as the brief decides.

## Wrong or impossible in the brief

The two cases ruled in `Q86b-cases.md` (the single push pass and damping 0.88 with the rest rule), with the evidence above. Nothing else.

## Limitations and sharp edges

- The settle is slow in its tail: 467 to 1127 frames for a pillar drag and 22 to 28 for a project (the table above). How that looks at 60 fps is for the look.
- A second settle always runs at least one frame, and that frame is under `REST` by the stop rule whenever the first settle ended at rest; the second-settle assertion fails only when the first stopped early, which the damping revert shows it does (4.77).
- Each frame costs up to `PUSH_PASSES` passes over the movers against every node; on the page the cost per frame is not measured.
- The bounds clamp runs after each push pass, so a mover pushed toward the edge stays inside the box at the price of the gap against a node near the edge; no case reached that on the fixture (the gap case passes over three drags; the 15-drag probe before the ruling showed a largest shortfall of 0.0001).
- `docs/diagrams/` files were rewritten by `npm run diagrams`; whether their content differs from main is not verified here.
- The comments over 100 columns in five files were rewrapped by a script over each paragraph that held a long line; `tests/checks/source/comment-width.test.ts` passes.

## Repair round 1

Every ruling of `briefs/Q86b-round1-sent.md` is done.

| Ruling | What changed | Check |
|---|---|---|
| 1. The snap on the first move (Behaviour 1) | At the press `nodeDown` stores `grab`, the node's centre less the pointer in graph units (`toGraph` of the press point, against the node's position after `pressHold`). Each move and the drop (`pointerup`, not `pointercancel`) put the node at the pointer plus `grab`, through the new pure `dragTarget(at, grab, node)` in `pointer.ts` and `dragTo()` in `Graph.svelte`. | `map-pointer.test.ts` 'audits that the node keeps the offset it was grabbed at, with no jump at the first move'; red with the offset ignored: `expected { x: 503, y: 342 } to be null` |
| 2a. No reheat at the same place (Standards 1) | `dragTarget` answers null when the target equals the dragged node's current position. `dragTo` then places nothing and starts no loop, so a repeated pointer event at the same place moves nothing. | 'audits that a pointer event at the place the node already stands moves nothing'; red with the guard removed: `expected { x: 600, y: 300 } to be null` |
| 2b. The sentences (Standards 1) | `DESIGN.md:291` and the `settle` docstring now say: a drag comes to rest at the springs' balance; a pointer event where the dragged node already stands does not start a settle; a settle started again at the same pointer moves each node less than `REST` in its first frame and stops there. `DESIGN.md:291` and `Graph.svelte`'s head comment also name the grab offset. | `grep -n "moves nothing further" DESIGN.md src/lib/state/boards/structure/graph.ts`: no hit |
| 3. The clamp inside each pass (Proof 2) | New case 'keeps a mover pushed at the edge of the box inside it on every pass of the push': movers `left` at `bounds.pad` and `right` 12 units to its right, radii 8, no fixed node. After `physics`, `left.x` is `bounds.pad` and the pair is at least 20 - 0.01 apart. | Red with the clamp moved to once after all passes: `expected 16 to be greater than or equal to 19.99` |
| 4. The close pair's drag half (Proof 3) | 'keeps a close pair at its distance at the press' drags `held` 5 units toward `other` (right), which pulls `mover` into `other`. | Red with the push removed: `expected 5.365076809659399 to be greater than or equal to 9.99` |
| 5. The frame cap (Proof 1) | No change. The cap in `settle` (`while (frames < MAX_FRAMES)`) and in the page loop (`frames < MAX_FRAMES` in `step()`) is an audit: read, not proven by a test. No input found reaches it, and none was hunted for. | Read, `graph.ts` `settle`, `Graph.svelte` `step()` |
| 6. The scratch folder (Spec 1) | `.scratch-builder/` is removed from the worktree root. | `ls -a` of the worktree root after removal (below) |

Also in this round:
- **`nearestProject` moved** from `Graph.svelte` into `pointer.ts` as `nearestProject(nodes, at, except)`, with its reach as the named constant `LINK_REACH` (12, the same value). This keeps `Graph.svelte` under 540 lines after `dragTo` and `grab`, at 536.
- **New case for the link pointer:** 'audits that the nearest project within its radius and the reach is taken'. It is red with the reach removed: `expected undefined to be 'nearer'`.
- **`backgroundDown`:** now one line shorter.
- **Scratch output:** logs from this round were written to the session scratchpad, outside the worktree.

**Correction to the before and after above:** the first bullet should read that the node stays under the pointer at the point it was grabbed. It no longer jumps at the press or at the first move past 3 units; the unrepaired build still snapped its centre to the pointer by up to its radius. The third bullet should read that a pointer event at the same place moves nothing and starts no settle.

**Before and after for the look:**
- Before: in any pane, pressing a node off its centre and moving past 3 px snaps its centre to the pointer.
- After: the node moves by exactly the pointer's movement, the grab point staying under the pointer.

**Verify list** (`PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md </dev/null`, from the worktree's `tools/oculus`, exit 0):

```
$ npm test
 Test Files  366 passed (366)
      Tests  5815 passed | 1 skipped (5816)
$ npm run check
1790699887164 COMPLETED 2113 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 6 commands passed
```

**Other gates:**
- `bash bin/folder-check.sh` exit 0.
- `npm run diagrams` exit 0, and `npx prettier --check .` exit 0 after it.
- The brief's `grep -nwE "repulse|collide|center|cool|DRAG_PHYSICS" ...` prints nothing.
- The perl ASCII gate prints nothing.
- After the round's reverts were restored: `npx vitest run tests/state/boards/structure/graph.test.ts tests/views/structure` `Tests 99 passed (99)`.

**Files this round (`wc -l`):**
- `src/lib/views/structure/map/Graph.svelte` 536
- `src/lib/views/structure/map/pointer.ts` 66
- `src/lib/state/boards/structure/graph.ts` 715
- `tests/state/boards/structure/graph.test.ts` 703
- `tests/views/structure/map-pointer.test.ts` 100
- `DESIGN.md` line 291

**Limitations of this round:**
- **The drop:** it reads the `pointerup` event's position. A `pointercancel` leaves the node where the last move put it, since a cancelled pointer's coordinates are not a drop point.
- **The same-place guard:** it compares exact positions. A pointer that jitters by a fraction of a unit still starts a settle, and that settle moves each node less than `REST` in its first frame and stops there.
- **The page:** the grab offset and the guard are seen on the page only at the look.

## Repair round 2

Every item of `briefs/Q86b-round2-sent.md` is done, under Axel's ruling Z54.

| Item | What changed | Check |
|---|---|---|
| 1. The jump at the press | `pressHold` finishes the running settle under `withoutMover(running, id)`: a copy of the running hold whose `movers` leave out the pressed node, every other field kept. The pressed node stays where the press caught it, and the last drag's other movers end at rest. `Graph.svelte` takes the grab offset from the pressed node as drawn, which `pressHold` no longer moves. | New case 'holds a pressed node where the press caught it while the last settle finishes': the pressed node's `x` and `y` equal its input exactly, the other mover equals `settle` under the reduced hold, and the new hold is `holdFor` of the result. Red with `running` passed unchanged to `settle`: `expected [ 510.37015875936675, 340 ] to deeply equal [ 555.5502771335535, 340 ]` |
| 2. Speed into a contact | `push()` takes the speed into the contact out of each mover it moves: `inA < 0` for `a`, `inB > 0` for `b` when `b` is a mover, as the brief gives them. The `physics` and `push` docstrings say it. | New case "takes out a mover's speed into a contact, so neither presses on after the push": two movers 10 apart (limit 20), each with speed toward the other. After `physics`, each one's speed along the line toward the other is zero or points away. Red with the speed kept: `expected 59.124301578897054 to be less than or equal to 0` |
| 3. A sub-pixel pointer starts no settle | Round 1's same-position guard is gone: `dragTarget(at, grab)` now only adds the grab offset. The new pure `movedEnough(last, at)` in `pointer.ts` answers whether two screen points are at least `DRAG_PIXEL` (1) apart. `Graph.svelte` keeps `lastScreen`, the screen point of the last event that placed the dragged node, set at the press. `dragTo(event)` places the node and starts the loop only when `movedEnough(lastScreen, screen)`, then keeps that point. The drop at `pointerup` goes through the same guard. | 'audits that 300 pointer events within a quarter pixel of the press place nothing': red with the guard removed, `expected 300 to be +0`. 'audits that an event one pixel away places the node, and one 0.99 pixel away does not': red with the guard removed, `expected true to be false` |
| 4. The documents | `DESIGN.md:291` now says: the loop stops at the first frame in which no node moves `REST` or more, or at `MAX_FRAMES`, which can be short of the springs' balance; a pointer event less than one screen pixel from the last one that placed the dragged node places nothing and starts no settle, so nothing moves while the pointer rests or trembles; a press while the last drag settles finishes it for every node but the pressed one, which stays where the press caught it; the push takes out a pushed neighbour's speed into the contact. The same corrections are in the `settle`, `pressHold` and drag-constants docstrings of `graph.ts`, `Graph.svelte`'s head comment, and `pointer.ts`'s head comment and `dragTarget` docstring. The sentence about a restarted settle moving less than `REST` in its first frame is deleted everywhere. | `grep -rn -e "balance" -e "same pointer" -e "already stands" -e "same place" -e "comes to rest" -e "finishes that settle" DESIGN.md HELP.md src/lib/views/structure/map src/lib/state/boards/structure`: the remaining hits say "short of the springs' balance" and the `pressHold` rule. `HELP.md:103` is about labels and needed no change |
| 5. The report | The revert table under "DONE / NOT DONE" is replaced. Each row now gives the case, the change undone as code, and the red, all 41 rerun on the tree after this round. No row names `reverts.py`. | `grep -n "reverts.py" Q86b-report.md`: no hit |

**The existing press-during-settle case, carried into the Z54 rule:** 'finishes a running settle at a press, and takes the new hold from where it ended' presses `project::p0`, which is a mover of the running `line::a` hold. The case now asserts that one more `dragTick` under the running hold without the pressed node moves less than `REST`; under the whole running hold the held node would move by rule. Red with `pressHold` not finishing the settle: `expected 3.863896710070812 to be less than 0.01`. Red with `running` passed unchanged: `expected 0.05640865116428925 to be less than 0.01`.

**Before and after for the look on TEST:**
- **Item 1:** before, pressing a node the last drag was still settling made it leap away from under the pointer (up to 60 units a second after the drop) and drag at that distance. After, the pressed node no longer jumps: it stays under the pointer where it was grabbed, and the last drag's other neighbours finish their settle at the press.
- **Item 2:** before, a neighbour held against another node kept pressing into it and slid along it on every settle. After, the push takes that speed out, so a neighbour in contact does not keep sliding along it.
- **Item 3:** before, a pointer resting on a dragged node, trembling by under a pixel, restarted the settle on every event, and the neighbours crept (45 units over 300 events in the reviewer's probe). After, the neighbours no longer move under a still or sub-pixel pointer: an event under one screen pixel from the last one that placed the node does nothing.
- **Settle stop:** a settle can stop short of the springs' balance (`DESIGN.md:291` says so).

**Verify list** (`PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md </dev/null` from the worktree's `tools/oculus`, at load average 11.6, exit 1):

```
$ npm test
 FAIL  tests/checks/tree/audits.test.ts > a case that never draws anything > catches a case that asserts over source text alone
 FAIL  tests/checks/tree/scratch.test.ts > a scratch directory > is swept by every file under tests that takes one
 FAIL  tests/server/edit/writes.test.ts > writing one subtask line > snoozes and deletes a line of a collection entry
 Test Files  3 failed | 363 passed (366)
      Tests  3 failed | 5815 passed | 1 skipped (5819)
checks: failed with exit 1: npm test
```

**The three `npm test` failures:**
- Each is `Error: Test timed out in 5000ms.`, in a file this step does not change.
- Alone, each passes: `tests/checks/tree/audits.test.ts` `Tests 11 passed (11)`, `tests/checks/tree/scratch.test.ts` `Tests 17 passed (17)`, `tests/server/edit/writes.test.ts` `Tests 28 passed (28)`.

**The five commands after it, run one by one:**
- `npm run check`: `COMPLETED 2113 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, exit 0.
- `npm run build`: exit 0.
- `npm run format:check`: `All matched files use Prettier code style!`.
- `npm run lint`: exit 0.
- `! LC_ALL=C grep -rna '[^ -~]' src tests`: exit 0.

**Other gates:**
- `bash bin/folder-check.sh`: exit 0.
- `npm run diagrams`: exit 0, and `npx prettier --check .` exit 0 after it.
- The brief's `grep -nwE "repulse|collide|center|cool|DRAG_PHYSICS" ...`: prints nothing.
- The perl ASCII gate: prints nothing.
- After every revert was restored: `npx vitest run tests/state/boards/structure/graph.test.ts tests/views/structure`, `Tests 102 passed (102)`.
- `ls -a` of the worktree root holds nothing of mine: `.git .gitignore AGENTS.md applications CLAUDE.md CONTEXT.md education feeds funding network projects README.md registries skills-lock.json tasks tools`. The round's logs and revert script are in the session scratchpad.

**Second-settle numbers after this round** (the creep case's printed line): every drag's second settle moves under 0.01. The frame counts moved with the speed change:

| Drag | Frames | Largest second-settle move |
|---|---|---|
| `line::a` 60 | 859 | 0.00996 |
| `line::a` 200 | 646 | 0.00992 |
| `line::a` -200 | 656 | 0.00995 |
| `line::b` 60 | 1033 | 0.00996 |
| `line::b` 200 | 635 | 0.00994 |
| `line::b` -200 | 640 | 0.00995 |
| `line::c` 60 | 1127 | 0.00997 |
| `line::c` 200 | 596 | 0.00968 |
| `line::c` -200 | 714 | 0.00990 |
| `line::d` 60 | 539 | 0.00995 |
| `line::d` 200 | 496 | 0.00993 |
| `line::d` -200 | 598 | 0.00994 |
| `project::p0` 60 | 22 | 0.00802 |
| `project::p0` 200 | 27 | 0.00810 |
| `project::p0` -200 | 28 | 0.00652 |

**Files this round (`wc -l`):**
- `src/lib/state/boards/structure/graph.ts` 734
- `src/lib/views/structure/map/Graph.svelte` 539, under 540
- `src/lib/views/structure/map/pointer.ts` 75
- `tests/state/boards/structure/graph.test.ts` 739
- `tests/views/structure/map-pointer.test.ts` 112
- `DESIGN.md` line 291
- this report

**Limitations:**
- **The pixel guard:** it compares screen points, so at a high zoom a one-pixel step is a small graph step, and each such step starts a settle as a real move.
- **The pressed node's speed:** a pressed node that was a mover keeps its speed in its record. It is no mover of its own drag, so `physics` zeroes it on the first frame.
- **Not measured on this tree:** the reviewer's wobble probe (seed 2, `line::a` 200, 300 events of 0.25 unit). The brief's figure of 4.96 units for item 2 alone comes from the coordinator's measurement, not from a run here. In the page such events are stopped by item 3's guard before they reach the tick.
- **The page:** the press, the drag and the tremble are seen only at the look on TEST.
