# Q86c report: the Map's whole force simulation on d3-force, started from neato's placement

Everything in the brief is done.

## Open items of the state file, verbatim

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

None.

## First run of the cases on the unchanged tree

The cases were written as tests (`tests/state/boards/structure/forces.test.ts`, the audits in `tests/views/structure/map.test.ts`) and run before any source change or install: `npx vitest run --reporter=verbose tests/state/boards/structure/forces.test.ts tests/views/structure/map.test.ts tests/views/structure/map-pointer.test.ts tests/state/boards/structure/graph.test.ts tests/state/boards/structure/layout.test.ts`.

- Cases 1-15: red. `FAIL tests/state/boards/structure/forces.test.ts ... Error: Cannot find module '../../../../src/lib/state/boards/structure/forces.ts'`.
- Case 16: all three audits red (`nodeDown` holds no `press(`, `pointerUp` holds no `release(`, and no effect registers `on('tick'`).
- Case 17: green. Every case of `map-pointer.test.ts` and `graph.test.ts` passed.
- Totals: `Test Files  2 failed | 3 passed (5)`, `Tests  3 failed | 81 passed (84)`.

No case turned out to be one the brief's rules get wrong. Case 6 is met with `FORCES` exactly as the brief sets it (below), so there was no hand-back.

## DONE / NOT DONE

| Item | State | Command and output |
| --- | --- | --- |
| 1. forces.ts | DONE | `npx vitest run tests/state/boards/structure/forces.test.ts`: `Tests  15 passed (15)` |
| 2. graph.ts drag code gone, `LINK_LENGTH` | DONE | verify item 2 grep prints nothing |
| 3. layout.ts `mapPlacement` `{ nodes, failure, forces }` | DONE | layout.test.ts mapPlacement case green (run below) |
| 4. Graph.svelte on the settled simulation | DONE | four audits in map.test.ts green; behaviour is for the look |
| 5. pointer.ts:53 | DONE | reads "moves the held node nowhere" |
| 6. d3-force 3.0.0, @types/d3-force 3.0.10 | DONE | `grep -n "d3" package.json`: `"@types/d3-force": "3.0.10"`, `"d3-force": "3.0.0"`; the lock adds only `@types/d3-force`, `d3-dispatch`, `d3-force`, `d3-quadtree`, `d3-timer` (diff of `node_modules/` keys against main's lock) |
| 7. Tests | DONE | `npx vitest run tests/state/boards/structure tests/views/structure/map.test.ts tests/views/structure/map-pointer.test.ts ...size, comment-width, negatives, duplication checks`: the touched files green; last run of each named below |
| 8. DESIGN.md:291 | DONE | rewritten; names `LINK_LENGTH` |
| 9. README.md:13 | DONE | adds `@viz-js/viz` (MIT) and `d3-force` (ISC) |
| 10. docs/diagrams | DONE | `npm run diagrams` on the final tree |
| Verify 1, checks.sh | DONE | below; the one red line is a timeout in a file the step does not change, green alone |
| Verify 2, grep of removed names | DONE | prints nothing |
| Verify 3, `grep -n "from 'd3-force'" forces.ts` | DONE | `23:} from 'd3-force';` |
| Verify 4, reverts named | DONE | below |

Verify 1, the last run of `sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md` from tools/oculus, verbatim:

```
$ npm test
 FAIL  tests/checks/tree/scratch.test.ts > a scratch directory > is the only way a test file makes one
Error: Test timed out in 5000ms.
 Test Files  1 failed | 375 passed (376)
      Tests  1 failed | 5911 passed | 1 skipped (5913)
checks: failed with exit 1: npm test
```

The failure is a timeout in `tests/checks/tree/scratch.test.ts`, a file this step does not change; `npx vitest run tests/checks/tree/scratch.test.ts` alone: `Tests  17 passed (17)`.

Reverts, each applied as a temporary edit, run on its own case, then restored (the file compared equal to the original afterwards):

- Case 2: the collision force never added. Red: `expected [ ...(45) ] to deeply equal []`.
- Case 3: the charge force never added. Red: 45 pairs within 20 units.
- Case 5: every node that is not a neighbour of `line::d` fixed at the press. Red: `expected [ 'line::a', 'line::b', ...(28) ] to deeply equal []`.
- Case 13: the edges handed to forceLink without copying. Red: the edges gain an `index` and their ends become objects.
- The `placementKey` case (layout.test.ts): a key of node ids alone. Red.

Cases 1, 4, 6-12, 14 and 15 name no revert. Case 6's measurement with `dragTo` fixing the point alone is given below. The five map.test.ts cases whose names start "audits that" read Graph.svelte's source text and are audits, not coverage.

## Files, with line counts (`wc -l`; main in brackets)

- `src/lib/state/boards/structure/forces.ts`: 194 (new)
- `src/lib/state/boards/structure/graph.ts`: 466 (733)
- `src/lib/state/boards/structure/layout.ts`: 272 (237)
- `src/lib/views/structure/map/Graph.svelte`: 538 (539)
- `src/lib/views/structure/map/pointer.ts`: 75 (75, the comment at 53)
- `tests/state/boards/structure/forces.test.ts`: 290 (new)
- `tests/state/boards/structure/graph.test.ts`: 380 (739)
- `tests/state/boards/structure/layout.test.ts`: 252 (212)
- `tests/views/structure/map.test.ts`: 569 (506)
- `tests/checks/tree/allow-duplication.txt`: 197 (197, one line changed; outside the brief's paths, see below)
- `package.json`, `package-lock.json`, `DESIGN.md` line 291, `README.md` line 13, `docs/diagrams/`

## FORCES changes

None. `FORCES` is `{ charge: -120, chargeMax: 300, gap: 4, collideStrength: 1, collideIterations: 2, center: 0.02, dragHeat: 0.3 }`, as the brief set it. Measured with it (logged by the tests):

- Case 5: the least room between the held pillar and any circle over the drag is 24.31 units.
- Case 6: the least room to the dragged node with no edge is -0.93, an overlap of 0.93 against the 2 allowed.

## Settle times (decision 5)

These come from a scratch vitest file run under `npx vitest run --config .../Q86c-build/timing.config.mjs`. Each figure is the median of 5 runs after one warm-up, on this machine while other suites ran, so the numbers are noisy.

- Dense graph, 44 nodes and 61 edges: settle 24.0 ms; neato plus settle 28.5 ms.
- The portfolio's size, 94 projects (`find projects -name project.yml | wc -l` gives 94) and 3 pillars, 97 nodes and 144 edges: settle 61.1 ms; neato plus settle 76.8 ms.
- The same with 60 collaborators, 157 nodes: settle 126.0 ms; neato plus settle 161.7 ms.
- 406 nodes and 613 edges: settle 545.7 ms; neato plus settle 747.7 ms.

The settle runs synchronously in a `$derived` when the placement key changes. At the real portfolio's size the page blocks for about 60 to 160 ms per change.

## Before and after, for the look on TEST

- **First draw:** before, the Map drew neato's placement as neato gave it. After, it draws that placement run to rest under the forces, so circles sit at least 4 units apart (case 1) and the picture is pulled toward the centre.
- **Drag of a pillar into the dense middle:** before, only the pillar's direct neighbours moved and every other node stayed put. After, every node moves (case 5), the projects in the way are pushed aside, and the rest of the map follows.
- **Drag of a project with no edge across the map:** before, nothing else moved. After, the circles it passes are pushed out of its way.
- **Release:** before, the dragged node stayed where it was dropped. After, it is freed and takes part again, so it may drift a little while the map cools (decision 3).
- **Click on a node:** it opens the node with nothing moved. The press fixes the node, and `release()` frees it again on the click branch.
- **Toggling link mode after a drag:** the dragged picture stays (see decision 2 below).

## Decisions the brief did not cover (each reversible)

1. `dragTo()` of forces.ts sets the node's `x`, `y` (and zeroes `vx`, `vy`) as well as `fx`, `fy`. d3 moves a fixed node to `fx` only at the end of a tick, after the collision has run against its old position. With `fx`/`fy` alone, case 6 fails: `step 15: expected -3.333168548442785 to be greater than or equal to -2`.
2. `placementKey(graph, seed)` and `drawnAt(nodes, at)` in layout.ts, each with a case in layout.test.ts. Map.svelte:48-80 builds a new `graph` object whenever the pane's instance state, the config or the portfolio changes (`held.enabled` is a new array on every parse). Keyed on the graph object, `chosen` would re-settle on a link-mode toggle or any hub push and throw away a dragged picture. `chosen` is now `$derived(placedFor(shape, viz))`, where `shape` is the key string (seed, node ids and radii, edge ids and ends) and `placedFor` reads the graph untracked. `positions` draws each node's current words from `graph` at the simulation's place (`drawnAt`). The Svelte reactivity is covered only by the source audit; the look confirms it.
3. `dragTo()` takes an optional `params = FORCES` for `dragHeat`, since the brief's signature has no parameter set.
4. `forceNodes(simulation)` in forces.ts answers copies of the nodes. The view's tick listener and `settleForces` share it.
5. `tests/checks/tree/allow-duplication.txt:161`, outside the brief's paths. The mark of the listed clone between `graph.test.ts` and `tests/views/boards/editor.test.ts` hashes tokens of the function that follows `snapshot()`, which was `point()`, removed by item 7. No order of the remaining code keeps the old mark. The line now reads `... 0c756ea91199 the same 16 lines at 92 and 110, to fold into one place`, as the check reported it. The alternative is to fold the fixture, which touches other files.
6. The `nodeDown` audit carries a comment giving the reason for its absence assertion, as `tests/checks/tree/negatives.test.ts` requires.

## Limitations and anything in the brief found wrong

- The settle blocks the page synchronously: 545.7 ms at about 400 nodes. That is not fixed and is within decision 5 as ruled.
- d3's timer keeps ticking at `alphaTarget` 0.3 while the pointer is held still during a drag. Nodes come to rest under that heat, but the timer runs until the release. This is d3's standard drag.
- A new portfolio version that changes an edge (for example, a related link written from link mode) changes the key, so the map is placed again from neato and a dragged picture is replaced.
- `tests/state/boards/structure/map-fixture.ts` was not changed. Its head comment still speaks of "the drag tests", which now live in forces.test.ts, so it still holds.
- The brief is right in every premise I checked (line ranges, names, d3 behaviour).
