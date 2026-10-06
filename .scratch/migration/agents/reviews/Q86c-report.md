# Q86c report: the Map's whole force simulation on d3-force, started from neato's placement

Everything in the brief and in repair round 1 is done.

## Open items of the state file, verbatim

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z69, Q102's Copy as HTML: a library or hand code (raised 2026-09-30 at `/spec` Q102, by the library check `libraries: check` requires). Copy as HTML turns the terminal's buffer, its colours and styles cell by cell, into HTML on the clipboard. xterm's own `@xterm/addon-serialize` does exactly that (`serializeAsHTML()`), and it is what VS Code's Copy as HTML calls. Facts (`npm view`): 0.14.0, MIT, maintained by the xterm.js team (tyriar), released 2025-12-22 in the same wave as the `@xterm/xterm` 6.0.0 oculus runs and the addon-search 0.16 and addon-fit 0.11 it already has; it would replace a hand-written walk over xterm's buffer cells and their attributes; nothing else of Q102 would use it. No ruling names it (`grep -i serialize plan.md` finds none; Q83's ruling covers the search, web-links and unicode11 addons only). The options: (a) `@xterm/addon-serialize` 0.14.0 for Copy as HTML; (b) hand code over xterm's buffer API. Recommendation: (a): it is the addon VS Code uses for this item, from the maintainers of the terminal oculus already runs, and hand code would reimplement its colour and style mapping and carry its own defects; (b) is the lazy option only in the sense of skipping the question, it costs more to write and to prove. Q102 is blocked until the ruling; nothing else is.

## First run of the cases on the unchanged tree

The cases were written as tests and run before any source change or install, with `npx vitest run --reporter=verbose tests/state/boards/structure/forces.test.ts tests/views/structure/map.test.ts tests/views/structure/map-pointer.test.ts tests/state/boards/structure/graph.test.ts tests/state/boards/structure/layout.test.ts`:

- Cases 1-15 were red: `Error: Cannot find module '../../../../src/lib/state/boards/structure/forces.ts'`.
- The three audits of case 16 were red.
- Case 17 was green.
- Totals: `Test Files  2 failed | 3 passed (5)`, `Tests  3 failed | 81 passed (84)`.

No case turned out to be one the brief's rules get wrong. Case 6 is met with `FORCES` unchanged.

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| 1-10 of What to build | DONE | full verify list below; greps below |
| Round 1, item 1: every new test names its revert | DONE | reverts below, each run red; one test renamed an audit |
| Round 1, item 2: placement-refusal case | DONE | `layout.test.ts:195`, its revert red below |
| Round 1, item 3: this report | DONE | this file |
| Verify 1: checks.sh on the final code | DONE | output below |
| Verify 2: grep of the removed names | DONE | prints nothing, rc=1 |
| Verify 3: `grep -n "from 'd3-force'" src/lib/state/boards/structure/forces.ts` | DONE | `23:} from 'd3-force';` |
| Verify 4: each new test names its revert | DONE | below |

Every command of the list ran on the final code. Before the run, `npm run diagrams` exited 0. Then `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` ran from tools/oculus in the worktree, printing:

```
$ npm test
 Test Files  376 passed (376)
      Tests  5913 passed | 1 skipped (5914)
$ npm run check
1790721196443 COMPLETED 2133 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 6 commands passed
```

## Reverts, each with its red line

For each revert, the change was made in the source, the named test file run with `npx vitest run <file>`, and the source put back; a comparison with the original confirmed the file matched it again. Line numbers are those of the final test files. The comment above each test names its revert.

- **`forces.test.ts:96`, settles every node finite, inside the box and apart.**
  - Revert: `advance()` ticks without `clampToBox()`.
  - Red: `forces.test.ts:101:31` `expect(inside(nodes)).toBe(true);` gave `AssertionError: expected false to be true`.
- **`:105`, a press moves no node and leaves alpha.**
  - Revert: `press()` calls `simulation.tick()`.
  - Red: `:112:43` `expect(where(simulation.nodes())).toEqual(before);` gave `AssertionError: expected Map{ 'line::a' => { ...(2) }, ...(43) } to deeply equal Map{ ... }`.
- **`:116`, a drag of a pillar into the dense middle.**
  - Revert: `press()` also fixes every node that is not a neighbour of the held one (a neighbour-only drag).
  - Red: `forces.test.ts:150:44` `expect(still.map((one) => one.id)).toEqual([]);` gave `AssertionError: expected [ 'line::a', 'line::b', ...(28) ] to deeply equal []`.
- **`:153`, a node with no edge dragged across the map.**
  - Revert: `dragTo()` sets the fixed point alone.
  - Red: `:178:43` `expect(least, \`step ${step}\`).toBeGreaterThanOrEqual(-2);` gave `AssertionError: step 15: expected -3.333168548442785 to be greater than or equal to -2`.
- **`:185`, a release after a press with no move.**
  - Revert: `release()` leaves `fx` and `fy` set.
  - Red: `:192:27` `expect(freed?.fx).toBeNull();` gave `AssertionError: expected 441.13576826215194 to be null`.
- **`:196`, an unknown id.**
  - Revert: `press()` has no guard for an id it does not find.
  - Red: `:206:16` `}).not.toThrow();` gave `AssertionError: expected [Function] to not throw an error but 'TypeError: Cannot read properties of ...' was thrown`.
- **`:212`, the edges it was given are unchanged.**
  - Revert: `createForces()` hands the edges to forceLink without copying (`links.push(edge as ForceLink)`).
  - Red: `forces.test.ts:217:76` `expect(graph.edges.every((one) => typeof one.source === 'string')).toBe(true);` gave `AssertionError: expected false to be true`. The same revert also turns `:135`, `:178` and `:225` red, because the shared fixture's edges are rewritten for the tests after it.
- **`:220`, mapPlacement over a loaded Graphviz.**
  - Revert: `mapPlacement()` answers neato's nodes unsettled.
    - Red: `:225:30` `expect(answer.nodes).toEqual(settleForces(createForces(placed, graph.edges)));`.
  - Revert: `settleForces()` runs no tick.
    - Red: `:227:40` `expect(answer.forces?.alpha()).toBeLessThan(answer.forces?.alphaMin() ?? 0);` gave `AssertionError: expected 1 to be less than 0.001`.
- **`:234`, the collision alone.**
  - Revert: `createForces()` never adds the collision force.
  - Red: `forces.test.ts:239:44` `expect(crowded(nodes, FORCES.gap)).toEqual([]);` gave `AssertionError: expected [ ...(45) ] to deeply equal []`. Case 6 at `:178` is red with it (step 15: -3.14).
  - The revert "`settleForces()` runs no tick" also turns it red at `:239:44`.
- **`:242`, the charge alone.**
  - Revert: `createForces()` never adds the charge force.
  - Red: `forces.test.ts:254:22` gave `AssertionError: expected [ Array(45) ] to deeply equal []`. Case 6 at `:178` is red with it (step 25: -2.17).
  - The no-tick revert also turns it red at `:254:22`.
- **`:257`, audits that settles an empty node set to no node.**
  - No change to the step's code turns it red, so it is named as an audit.
- **`:261`, one node.**
  - Revert: `settleForces()` runs no tick, so the node stays at (20, 900).
  - Red: `:266:31` `expect(inside(nodes)).toBe(true);` gave `AssertionError: expected false to be true`.
- **`:269`, five nodes on one point.**
  - Revert: `settleForces()` runs no tick.
  - Red: `:274:44` `expect(crowded(nodes, FORCES.gap)).toEqual([]);` gave `AssertionError: expected [ ...(10) ] to deeply equal []`.
- **`:277`, an edge whose target is not held.**
  - Revert: every edge is linked, the missing end included.
  - Red: `:284:28` `const simulation = createForces(nodes, edges);` gave `TypeError: Cannot read properties of undefined (reading 'x')`.
- **`:290`, clampToBox.**
  - Revert: `clampToBox()` moves the node back but keeps its speed.
  - Red: `:299:24` `expect(out.vx).toBe(0);` gave `AssertionError: expected -5 to be +0`.
- **`layout.test.ts:195`, a placement the engine refuses** (new in this round).
  - Revert: forces built over the refused placement's empty node set, `createForces([], graph.edges)` in place of `null`.
  - Red: `layout.test.ts:205:50` `expect(mapPlacement(refusing, GRAPH, 1)).toEqual({` gave `AssertionError: expected { nodes: [], ...(2) } to deeply equal { nodes: [], ...(2) }`.
  - The same branch serves a failed load, so `layout.test.ts:185:68` went red with it.
- **`layout.test.ts:212`, drawnAt.**
  - Revert: `drawnAt()` draws the placed copy as it is, `[{ ...point, vx: 0, vy: 0 }]`.
  - Red: `layout.test.ts:216:36` `expect(drawnAt(now, held)).toEqual([{ ...now[0], x: 10, y: 20, vx: 0, vy: 0 }]);` gave `AssertionError: expected [ { id: 'a', entityId: 'a', ...(8) } ] to deeply equal [ ... ]`.
- **`layout.test.ts:220`, placementKey.**
  - Revert: `placementKey()` keys on the seed and the node ids alone.
  - Red: `layout.test.ts:230:65` `expect(placementKey({ ...GRAPH, nodes: grown }, 1)).not.toBe(key);` gave `AssertionError: expected '[1,["line::a","line::b","project::p1"...' not to be '[1,["line::a", ...'`.
- **`tests/views/structure/map.test.ts:543-568`:** the five cases named "audits that" read Graph.svelte's source. They are audits.

The revert commands are in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/Q86c-build/reverts.py` and `extra.py`. Every revert was run on the final test files; the outputs are in `reverts-2.log` and `reverts-3.log` in the same folder. The source is put back after each revert and compared with the original. After the last revert, `npx vitest run tests/state/boards/structure/forces.test.ts tests/state/boards/structure/layout.test.ts` printed `Tests  29 passed (29)`.

## Files, with line counts (`wc -l`; base de977c87 in brackets)

- `src/lib/state/boards/structure/forces.ts`: 194 (new)
- `src/lib/state/boards/structure/graph.ts`: 466 (733)
- `src/lib/state/boards/structure/layout.ts`: 272 (237)
- `src/lib/views/structure/map/Graph.svelte`: 538 (539)
- `src/lib/views/structure/map/pointer.ts`: 75 (75, the comment at line 53)
- `tests/state/boards/structure/forces.test.ts`: 302 (new)
- `tests/state/boards/structure/graph.test.ts`: 380 (739)
- `tests/state/boards/structure/layout.test.ts`: 266 (212)
- `tests/views/structure/map.test.ts`: 569 (506)
- `tests/checks/tree/allow-duplication.txt`: 197 (197, line 161 re-keyed)
- `package.json`: 67
- `package-lock.json`
- `DESIGN.md` line 291 and `README.md` line 13
- `docs/diagrams/`

## FORCES changes

None. `FORCES` is `{ charge: -120, chargeMax: 300, gap: 4, collideStrength: 1, collideIterations: 2, center: 0.02, dragHeat: 0.3 }`, as the brief set it. The first round's verbose run of `forces.test.ts` measured, and the review reproduced:

- case 5: the least room between the held pillar and any circle is 24.31;
- case 6: the least room to the dragged node with no edge is -0.93, against the -2 allowed.

## Settle times (decision 5)

These were measured in the first round with a scratch vitest configuration that is no longer on disk. Each figure is the median of 5 runs under load:

- dense graph, 44 nodes: 24.0 ms;
- the portfolio's 94 projects and 3 pillars, 97 nodes: 61.1 ms;
- the same with 60 collaborators, 157 nodes: 126.0 ms;
- 406 nodes: 545.7 ms.

The review measured 22.6, 58.2, 102.3 and 374.2 ms with an inline d3-force script from random starts. The settle runs synchronously when the placement key changes.

## Before and after, for the look on TEST

- **First draw.** Before, the Map drew neato's placement as neato gave it. After, it draws that placement run to rest under the forces. Every pair of circles is at least 3.5 units apart past their two radii (case 1 checks `gap - 0.5`, `forces.test.ts:50`), and the picture is pulled toward the centre.
- **A pillar dragged into the dense middle.** Before, only its direct neighbours moved. After, every node moves (case 5), the projects in the way are pushed aside, and the rest of the map follows.
- **A project with no edge dragged across the map.** Before, nothing else moved. After, the circles it passes are pushed out of its way.
- **Release.** Before, the dropped node stayed where it was dropped. After, it is freed and takes part in the simulation again, so it may drift while the map cools (decision 3).
- **Click on a node.** It opens the node with nothing moved.
- **A link written from link mode.** Before Q86c, the drawn positions stayed. Graph.svelte at base de977c87 declares `placed` at line 79 and writes it only at lines 195, 212 and 269, never back to null, so a dragged picture survived the write. After, the new related edge changes `placementKey()` (`layout.test.ts:231-232`: an added edge gives another key). The whole Map is placed again from neato and settled, and a dragged picture is replaced by the new placement.
- **Toggling link mode, or a hub push that changes no node or edge.** The key is unchanged, so the simulation and a dragged picture stay.

## Decisions the brief did not cover (each reversible)

1. `dragTo()` sets the node's `x` and `y`, and zeroes `vx` and `vy`, as well as `fx` and `fy`. With `fx` and `fy` alone, case 6 goes red at step 15 with -3.33 (revert above).
2. `placementKey()` and `drawnAt()` in layout.ts, and the `shape`/`placedFor`/`untrack` derivation in Graph.svelte. A graph rebuilt with the same nodes and edges keeps the simulation and a dragged picture. The reactivity itself is covered by a source audit only.
3. `dragTo()` takes an optional `params = FORCES` for `dragHeat`.
4. `forceNodes()` in forces.ts answers copies of the nodes.
5. `tests/checks/tree/allow-duplication.txt:161`, outside the brief's paths, is re-keyed to the new mark `0c756ea91199`, "the same 16 lines at 92 and 110". The old mark hashed the removed `point()`.

## Limitations

- The settle blocks the page synchronously: 545.7 ms at about 400 nodes (first-round measurement). This is within decision 5.
- While the pointer is held still during a drag, d3's timer keeps running at `alphaTarget` 0.3 until the release.
- A link written from link mode places the Map again from neato and replaces a dragged picture (above).
