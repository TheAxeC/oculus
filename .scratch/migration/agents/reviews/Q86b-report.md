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

### Reverts, each run against its own case and restored (`python3 .scratch-builder/reverts.py` at the worktree root, `npx vitest run <file> -t <case>`)

| Test | Revert | Red |
|---|---|---|
| moves only the movers of a drag | every node moves | `expected [ 895.03056, 340 ] to deeply equal [ 900, 340 ]` |
| leaves a picture at rest under the drag tick | the push ignores the distance at the press | `expected { nodes: [ ...(5) ], ...(1) } to deeply equal { nodes: [ ...(5) ], moved: +0 }` |
| pulls a neighbour joined only to the dragged node | damping 0.88 | `expected 462.4369833893811 to be close to 460` |
| rests an edge with no recorded length | an unrecorded edge rests at 0 | `expected 579.1936 to be 580` |
| answers the nodes an edge joins to a node | neighbours by source only | `expected [ 'b' ] to deeply equal [ 'b', 'c' ]` |
| moves nothing on a press that does not move | the centre pull put back | `expected [ { id: 'line::a', ...(9) }, ...(43) ] to deeply equal [...]` |
| moves no other node on a drag of a node joined to nothing | every node takes the push (the push loop skips no node) | `expected [ { id: 'line::a', ...(9) }, ...(43) ] to deeply equal [...]` |
| keeps every circle but the dragged one off the others | `PUSH_PASSES = 1` | `60: project::p0 and project::p36: expected 19.925216179593132 to be >= 19.99` |
| settles every drag at rest, a second settle moves nothing more | damping 0.88 | `line::b -200: expected 4.767250159488997 to be <= 0.01` |
| stops a settle at rest, before the frame cap | damping 0.88 | `line::b -200: expected 0.022716757605797812 to be < 0.01` |
| finishes a running settle at a press | `pressHold` does not finish the running settle | `expected 3.863896710070812 to be less than 0.01` |
| keeps a close pair at its distance at the press | the push ignores the distance at the press | `expected [ { id: 'held', ...(10) }, ...(2) ] to deeply equal [...]` |
| settles an empty node set at once | settle runs to the frame cap | `expected 2000 to be less than or equal to 1` |
| ends a press and a drag of one node at once | settle runs to the frame cap | `expected 2000 to be less than or equal to 1` |
| moves neither of two nodes coincident at the press | the spring loses its zero-length guard | `expected [ { id: 'held', ...(10) }, ...(1) ] to deeply equal [...]` (NaN) |
| parts two nodes apart at the press that a frame finds coincident | no x direction for a coincident pair | `expected false to be true` (finite) |
| audits ... another project circle, and a project is a circle | no node check / a project as its square | `expected [ 'p1', 'p2' ] to deeply equal [ 'p2' ]` / `expected [ 'p2' ] to deeply equal [ 'p1', 'p2' ]` |
| audits ... a pillar's square or a collaborator's square | every node as a circle | `expected [ 'p1', 's' ] to deeply equal [ 's' ]` |
| audits ... a collaborator's label over a project's circle | no node check | `expected [ 'c', 'p' ] to deeply equal [ 'p' ]` |
| audits ... over another pillar's square | no node check | `expected [ 'a', 'b' ] to deeply equal [ 'b' ]` |
| audits ... over its own node alone is drawn | the own node counted | `expected [ 'q' ] to deeply equal [ 'p', 'q' ]` |
| audits ... a pillar's label is placed before a project label | graph order only | `expected [ 'p' ] to deeply equal [ 'l' ]` |
| audits ... of two pillar labels, the first in the graph order | pillars sorted by id | `expected [ 'a' ] to deeply equal [ 'b' ]` |
| audits ... a leading label is drawn over a node | leading labels checked against nodes | `expected [ 'l', 'q' ] to deeply equal [ 'p', 'q' ]` |
| audits ... a label of no width ... covers nothing | zero width checked / a kept zero-width label covers | `expected [ 'a', 'b', 'e', 'f' ] to deeply equal [...all six]` / `expected [ 'a', 'b', 'c', 'd', 'e' ] to deeply equal [...all six]` |
| audits ... a wide pane | the old stretched mapping | `expected 143.2624113475178 to be close to 230.86` |
| audits ... a pane of the picture size maps one to one | the two ratios crossed | `expected { x: -54.41176470588235, ...(1) } to deeply equal { x: 123, y: 456 }` |
| audits ... a tall pane | no vertical centring | `expected 493.33333333333337 to be close to +0` |
| audits ... a pane of no size | no zero-size guard | `expected { x: Infinity, y: Infinity } to deeply equal { x: +0, y: +0 }` |
| audits ... the pan comes off first | zoom before pan | `expected { x: 150, y: 120 } to deeply equal { x: 200, y: 145 }` |

After the reverts the sources are restored: `npx vitest run tests/state/boards/structure/graph.test.ts tests/views/structure` `Tests 95 passed (95)`. The seven unchanged-name cases of `map-labels.test.ts` only gained the third argument `[]`; they are audits on `allow-audits.txt` and assert what they asserted before.

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
