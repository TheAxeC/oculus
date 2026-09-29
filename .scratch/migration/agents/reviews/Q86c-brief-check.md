Brief check of Q86c (tools/oculus/.scratch/migration/agents/briefs/Q86c.md) against main. Main moved from 30da78fc to 914a1b9b during the check. `git diff 30da78fc HEAD --stat -- tools/oculus/src tools/oculus/tests` prints nothing. The only change is the test-run rule in agents/spec.md, and it agrees with the brief's verify item 1.

I changed nothing in the repository. My scratch files are under .../scratchpad/Q86c-check/: the d3-force 3.0.0 source from `npm pack`, and probe.mjs, probe2.mjs and big.mjs. The probe is my own build of the brief's design (my box force, my LCG), run with node over the real neato placement from the repository's @viz-js/viz 3.30.0. Its numbers describe that probe, not the builder's future code.

Six defects change what the builder builds; the brief should be fixed before dispatch:
- **Wrong test files:** two test files the step breaks are not in "Paths this step writes".
- **Edges mutated:** `forceLink` rewrites the edges it is given.
- **View simulation:** it is built hot and from the wrong edge lengths.
- **Case 6:** it cannot fail.
- **Case 5:** it fails with the brief's own parameters.
- **Named reverts:** two of the reverts the brief names do not turn their cases red.

## Names

Command: `grep -rn --exclude-dir=node_modules ... -E 'DEFAULT_PHYSICS|\bPhysics\b|DRAG_STEP|\bREST\b|MAX_FRAMES|PUSH_PASSES|DragHold|pairKey|\bphysics\b|neighbours|holdFor|dragTick|\bsettle\b|pressHold|edgeLengths|LINK_LENGTH|forces\.ts|createForces|settleForces|DRAG_PHYSICS' src tests DESIGN.md HELP.md README.md docs bin config`. The unrelated hits (the generic `settle` promise resolvers in Toast.svelte, search.ts, the git modules and the poll tests, and `neighbours` in SplitView and FoldedPane) are dropped. The relevant hits outside graph.ts and graph.test.ts:

- `src/lib/state/boards/structure/layout.ts:15,97,98,107`, `src/lib/views/structure/map/Graph.svelte:10-16,38-42,92,194,197,211` and `DESIGN.md:291`. All three are in the brief's paths and covered by items 2, 3, 4 and 7.
- `src/lib/views/structure/map/pointer.ts:53`: "A pointer that rests or trembles by less than a pixel places nothing and so starts no settle." There is no settle after the change. **pointer.ts is not in the brief's paths**, so this head comment stays out of date. Add pointer.ts to the paths, for that comment only.
- `tests/state/boards/structure/map-fixture.ts:3`: "a drag of a pillar moves many neighbours past each other". It is still roughly true. The file is in the paths only conditionally, and its head comment talks of "the drag tests".
- `tests/state/boards/structure/graph.test.ts:391` (`parseMapState({ tuned: { key: 'k', params: { ...DEFAULT_PHYSICS } } })`) is inside the case at 385, **outside the removed ranges 309-383 and 500-739**. Verify item 2 greps `tests` for `DEFAULT_PHYSICS`, so this line has to change, and the brief does not say so. It could become a literal params object.
- `graph.test.ts:124` (`point()`) and `:148` (`edge()`) are helpers used only by the removed cases, and imports 6-37 (`DragHold`, `PointNode`, `GraphEdge`, `Viz`, `beforeAll`, `createGraphviz`, `placeGraph`, `denseGraph`) also go. The brief only says "loses the cases". Unused leftovers would fail lint or the check.
- **Tests that the step breaks, outside the paths** (`grep -rn "mapPlacement\|placeGraph" src tests`):
  - `tests/state/boards/structure/layout.test.ts:186-189` asserts `mapPlacement(viz, GRAPH, 1)` equals `{ ...placeGraph(viz, GRAPH, 1), failure: null }`. Item 3 makes mapPlacement answer the settled picture, so this goes red.
  - `tests/views/structure/map.test.ts:132-136,317,320,351,361,380` compare the drawn circles with `placeGraph(...)` positions. The view draws `chosen.nodes` from mapPlacement, now settled, so these go red too.
  - Verify item 4 (`npx vitest run tests/state/boards/structure tests/views/structure`) would fail. Both files must be added to the paths, with what they assert instead (for example `settleForces(createForces(placeGraph(...).nodes, ...))`).
- `README.md:13` lists "The runtime dependencies, with their licences". d3-force (ISC) becomes one and is not in the paths. The line already omits `@viz-js/viz`, which is not this step's defect.
- `docs/diagrams/layer-views.dot:35` carries the import count "34" from views/structure to state. Item 8 regenerates it.
- LINK_LENGTH, forces.ts, createForces and settleForces have no hits. DRAG_PHYSICS has none (the brief is right).

## The step line

Plan line 276, mapped to the brief's "What to build":
- "the whole force simulation on d3-force (forceLink at each edge's length, forceManyBody, forceCollide, forceX/forceY toward the centre) over every node": item 1.
- "started from neato's placement and run to rest once before the first draw": items 1 and 3. The view part, item 4, contradicts this; see Premises, point 3.
- "a press moves nothing": items 1 (`press`) and 4.
- "a drag pushes and pulls every node as the Map did before Q86": items 1 (`dragTo`, `release`) and 4.
- "the hand-written physics, push, settle, DRAG_PHYSICS, Z58's friction and the neighbour-only drag go": item 2. Z58's friction is the speed removal in `push()` (graph.ts:531-545), which goes with push.
- "the look on TEST drags a node into the dense middle and a node with no edge across the map": this is the orchestrator's look at landing. No item names it. The Report section asks for before and after in general, but does not name these two looks as the state to put the view in, which the rules file requires ("names the view, the state to put it in and what should differ"). Cases 4 and 5 mirror them only as unit tests.
- Rulings: Z60 (a) (plan.md:488) matches. Z58 (a) (plan.md:490) is superseded by Z60 (plan.md:278), and the brief rightly drops the slide case.
- plan.md has no "Goal" section (`grep -n "^#" plan.md` gives only the title, Packages, Could run in parallel, Rulings and Blocked). I judged the goal from line 276.

## Premises

Commands: `wc -l`, `grep -n` of the declarations, and `sed -n` of the ranges.
- Line counts match: graph.ts 733, Graph.svelte 539, layout.ts 237, graph.test.ts 739.
- graph.ts: the drag code is at 60-88 (the `Physics` doc starts at 60; `PointNode` at 58 and `Bounds` at 59 stay), and 419-656 (clone at 419, edgeLengths ending at 656). The list of names matches. The head comment is lines 1-7. Correct.
- Graph.svelte: imports at 36-46; step() at 192-198. **nodeDown is 200-218**, not 200-221. pointerUp is 275-283. placed is at 79. Head comment 9-16. Correct otherwise.
- **layout.ts line numbers are wrong:**
  - `DEFAULT_PHYSICS.linkLength` is read at **line 107**, not 105. graphDot starts at 101.
  - The comment is at 97-98 (97 names DEFAULT_PHYSICS, 98 names edgeLengths).
  - **mapPlacement is at 201-209**, not 175-186; 175-181 is the node map inside placeGraph.
- pointer.ts: dragTarget, DRAG_PIXEL and movedEnough are at 39-57. Correct.
- graph.test.ts: the drag cases are 309-383 (the `neighbours` case at 379 is inside). The 500-739 range also holds the helpers at, moveX, dragOf, largestMove, finite and DRAGGED. Correct. But see Names for line 391 and for the helpers at 124 and 148.
- DESIGN.md:291 content matches.
- `grep -n d3 package.json` prints nothing, and node_modules/d3-force is absent. Correct.
- The brief's grep over src and tests lists, within the Map, graph.ts, layout.ts, Graph.svelte and graph.test.ts. Correct as stated. It does not show that layout.test.ts and map.test.ts depend on mapPlacement's output.
- Pre-Q86 constants: `git show 27e7e27f^:.../graph.ts` shows repulse 9200, collide 31, center 0.012, damping 0.88, cool 0.992, and a box clamp at graph.ts:536-541 on `node.x + node.vx * alpha`, applied after integration. Consistent with the brief.
- **Libraries checked, one wrong date:** `npm view d3-force time --json` shows 3.0.0 was published 2021-06-05T19:11:01Z. 2022-06-14 is `time.modified`, a registry metadata date, not a release. License ISC, maintainers mbostock and recifs, dependencies d3-dispatch, d3-quadtree and d3-timer "1 - 3", type module, latest 3.0.0, @types/d3-force 3.0.10 exists: all correct.
- Folder limit: `git ls-files src/lib/state/boards/structure | wc -l` is 3 and the tests folder is 4, so adding forces.ts and forces.test.ts stays under 10.
- Premises that are wrong in the design itself:
  1. **Edges are mutated.** `forceLink` rewrites the link objects it is given: d3-force/src/link.js:60-61 does `link.source = find(nodeById, link.source)`, and it also sets `link.index`. My probe printed `edge.source after forceLink: object true`. Item 1 says only "forceLink over the edges whose two ends are both in nodes" and never says the edges must be copied. `graph.edges` passed straight in would have its `source` and `target` replaced by node objects. `edgeEnds()` (layout.ts:220-221, `node.id === edge.source`) would then draw nothing, and `buildGraph`'s edges would be corrupted for every consumer.
  2. **The box force.** A d3 force runs before integration (simulation.js:46-57: forces, then `node.x += node.vx *= velocityDecay`). A "box" force that clamps `x` alone can be carried outside by the same tick's `vx`. The pre-Q86 code clamped after integration. The brief should say how: for example, clamp on `x + vx * (1 - velocityDecay)`, or set `vx` so the integrated position stays inside, or clamp in a step after `tick()`. Otherwise case 1's inside-the-box check depends on a detail the brief leaves open.
  3. **The view simulation is built hot and from the wrong lengths.** Item 4 builds the view's simulation with `createForces(chosen.nodes, ...)`, and `chosen.nodes` is already settled by item 3. That fresh simulation has alpha 1 (simulation.js:18) and link distances equal to the *settled* lengths, not neato's. Item 1's "the length neato gave it" and DESIGN item 7 ("the links at the lengths neato gave") are then false for the live simulation. In my probe, a press held still for 30 ticks at alphaTarget 0.3 moved nodes by up to:
     - 19.61 units in a view-style simulation (fresh, alpha 1, settled lengths);
     - 8.36 units with alpha set to 0 but settled lengths;
     - 1.76 units in the simulation that settled from neato's lengths.

     So the first drag would jolt the whole picture by up to about 20 units. The brief should keep neato's lengths for the live simulation (for example, mapPlacement also answers the neato placement, or `createForces` takes the lengths), and start it cold: `alpha` below `alphaMin`, or the settled simulation itself handed to the view.
  4. **`placed` is never reset.** Graph.svelte:79 declares `placed` and nothing ever sets it back to null (`grep -n "placed" Graph.svelte`: written only at 195, 212 and 269). Item 4 does not say the effect resets `placed` when it rebuilds. After a drag, a new node set or seed would keep drawing the old `placed` array.

## Cases and checks

Read against the rules file (a test must not assert a known defect, no loose threshold, a reader-visible behaviour is state, an audit is named as one):
- **Case 1:** "alpha() < alphaMin()" is true by the definition of `settleForces`'s loop, so it can never fail. The overlap threshold is ambiguous: "no two circles closer than their two radii (the gap may leave them up to 1 unit short of + 4, not closer than the radii)" does not say whether the test asserts `>= r1 + r2` or `>= r1 + r2 + 3`. With the radii alone, it is loose (see The question).
- **Case 6 is vacuous.** After the release, "ticks to rest" leaves `alpha < alphaMin`, so a second `settleForces` runs 0 ticks. The probe printed `case6 secondSettleTicks=0 maxMove=0.000` in every variant. It cannot fail. Reheated with `alpha(1)` it moved 40.1 units, so the property as meant does not hold without a definition. Either define the case with an explicit reheat and a bound that holds, or drop it.
- **Case 2 cannot fail on the revert it implies.** d3-force 3.0.0 already defaults to a fixed-seed LCG per simulation (src/lcg.js: `let s = 1`; simulation.js:26 `random = lcg()`). The probe's `noRandom` variant is `deterministic=true`. Case 2 does not test the seeded `randomSource`, and case 9's "same on a second run" also passes without it. The brief's reason for the hand-written LCG ("so the jiggle ... is the same on every run") holds without it. What the seed adds is only that the jiggle differs by seed.
- **Case 3 is only an audit of the view.** It holds by construction for the function, since `press` sets fx and fy and never ticks. That the view's `nodeDown` does not call `restart()` is not tested; the brief names only case 12 as an audit of the handler.
- **Cases 11 and 12 have no location, and allow-audits.txt forbids the entry the brief expects.** No test file for the Graph.svelte source audits is named; forces.test.ts is under tests/state. tests/checks/tree/allow-audits.txt:6 says "nothing is added, since a new case of that shape carries the word in its own name". The brief's path "allow-audits.txt (only ... if its rule requires the entry)" conflicts with that: the rule forbids the entry, and the case names must carry "audit".
- **Two named reverts do not turn their cases red** (verify item 5):
  - "The collision removed turns cases 1, 4 and 5 red": the probe's `noCollide` gave the same case 1 result as `full` (min gap over radii 20.58, all inside) and the same case 4 result (min gap 15.71 held, 11.90 at rest). With these parameters the charge keeps nodes apart and the collision never acts in cases 1 and 4.
  - "The charge removed turns case 4's whole-graph assertion red": the probe's `noCharge` had 21 of 30 non-neighbours moving more than 5 units (against 6 of 30 with the charge). The dense graph is connected (the p0, p3, p6 and p9 memberships join all four pillars), so the links alone carry the drag to non-neighbours.

  The builder would find these reverts do not bite, and the brief gives no fallback.
- **Case 5 fails as written.** With the brief's parameters the probe gave `worstGapToHeld=-4.00 atStep=15`: a 4-unit overlap with the held node. d3's `forceCollide` splits each correction by radii (collide.js:56-59), and the fixed node's share is thrown away (simulation.js:54-56 set `vx = 0` for fx nodes). A neighbour then gets only part of the correction, times the velocity decay, while the held node moves 10 units per tick. Decision 1 lets the builder change only `FORCES` values. The collision's strength (1) and iterations (2) are outside `FORCES`, so the builder may not be able to meet case 5 within the brief. Neither "stop and hand back" nor "change the iterations" is provided for; the first-run clause covers only cases "the brief's own rules get wrong", which fits.

  Case 5 also leaves the start open: the lone node sits where neato put it ((686, 91) in the probe), and the first step jumps it to (60, 340).
- **Case 13** replaces layout.test.ts:186-189, but that file is not in the paths (see Names).
- **Verify item 2** omits `README.md` and `docs` from its grep, though the rules file requires grepping `src, tests, config, HELP.md, DESIGN.md and README.md`. `config` is missing too.

## The question

Could each case, the step-line check and each item pass without the goal? The goal: the whole simulation back, projects pushing against each other, a drag pushing and pulling every node, and a press moving nothing.
- **Case 1: yes.** The alpha condition is true by construction. With the radii-only threshold it passes with no collision force (the probe: noCollide min gap 20.58) and would pass with neato's own placement (min gap 10.26). It shows the settle is sane, not that projects push against each other.
- **Case 2: yes.** d3's default LCG is deterministic without the brief's `randomSource`.
- **Case 3: yes, for the view.** The function case is true by construction. A view calling `restart()` at the press would pass it.
- **Case 4: partly.** "At least one non-neighbour moved more than 5" does separate the whole simulation from the old neighbour-only drag, which kept non-movers exactly still. But it passes with the charge removed (21 of 30), so it does not show that projects push against each other. The goal says "every node". The probe's smallest non-neighbour move was 0.120 with full forces, so an assertion that every node moved more than 0 is available and would separate it from any neighbour-only drag.
- **Case 5:** "the pushed nodes are not all where they were" passes from any whole-graph motion (44 of 44 moved more than 0.5 in every variant). The no-overlap part is the real check, and it fails today (see above).
- **Case 6: yes.** It is vacuous.
- **Cases 7-10: they do not bear on the goal.** They are edge cases, and fine.
- **Cases 11 and 12: yes.** They are audits over source and prove nothing about the running effect.
- **Case 13:** it shows the first draw is settled, not that the live simulation continues from it with neato's lengths.
- **Case 14:** unrelated to the goal.
- **Items 1-3: they could pass while the view is wrong.** The tests drive one simulation from neato's placement, while the view builds a second one from the settled nodes at alpha 1 (Premises, point 3). Every test passes while the view jolts about 20 units at the first drag and rests links at settled lengths.
- **Item 4:** only the look covers it.
- **The step-line look** is the only check of the view's behaviour, and the Report section does not name its two states explicitly.

## Implied inputs

Each with its expected result. "Missing" means it is not in Cases.
- **Pane closed mid-drag:** the effect's cleanup stops the timer, and no further writes to `placed`. Covered only as the case 11 audit, for a node-set change. The close itself is missing.
- **Node set or seed change (filter, re-tune, added project) while a drag is held:** the old simulation stops, a new one is built, `placed` is reset, and a later `pointermove` with `drag` still set to a node absent from the new simulation must not throw. `dragTo` and `release` need to handle an unknown id. **Missing:** the unknown-id behaviour of `dragTo` and `release`, and the `placed` reset.
- **Pointer cancel:** Graph.svelte:322 routes `onpointercancel` to `pointerUp`, which must call `release()`. The current code skips `dragTo` on cancel (line 278). Missing.
- **A click (press with no move, which opens the view):** the press fixed the node, so `release()` must run on that branch too, or the node stays pinned for good. The brief says only "pointerUp() calls release()". Missing.
- **Press while the last drag's cooling still runs:** the timer keeps ticking and other nodes keep moving after the press, while the pressed node stays put. The brief does not say whether that is acceptable under "a press moves nothing". Missing.
- **Pointer held still during a drag:** at alphaTarget 0.3 the timer runs on, and the nodes should come to rest. `movedEnough()` no longer bounds anything, since the timer ticks regardless. Missing.
- **Hidden tab:** d3-timer uses requestAnimationFrame when `window.requestAnimationFrame` exists (d3-timer timer.js:11), so the simulation pauses while hidden and resumes when shown. No case needed, but the brief does not say it.
- **A node set of hundreds:** mapPlacement runs `settleForces` synchronously inside a `$derived` on every change of graph or seed. In the probe (big.mjs), 400 nodes with 390 links took 300 ticks in 450 ms in node on this machine: the page blocks for about half a second per filter change. **Missing, and unmentioned.**
- **The d3 timer under vitest:** `forceSimulation` starts `timer(step)` in its constructor (simulation.js:24), which schedules setTimeout(17) and setInterval(poke, 1000) through d3-timer when there is no window. `.stop()` straight after makes them harmless, and the SSR render of Graph.svelte runs no `$effect`. A test that forgets `.stop()` would tick in the background.
- **Coincident nodes on the box edge, and all nodes on one point:** the jiggle parts them, and the box force keeps them inside. Case 9 covers two nodes. Many nodes on one point is missing.
- **An edge whose two ends are the same node:** `forceLink` accepts it; the length is 0, the distance 0, and the jiggle adds noise. Missing.
- **Duplicate edges between one pair:** both links act at the same length. Missing, and harmless.

## d3-force API

Checked with `npm view d3-force@3.0.0` and `npm pack d3-force@3.0.0`, reading the source in the scratch folder.
- **`simulation.randomSource` exists in 3.0.0** (simulation.js:113-115). Setting it re-initializes every force. The default is `lcg()` with the fixed seed `s = 1` (lcg.js), so a simulation is deterministic without it.
- **`forceLink` throws on a missing node id:** `throw new Error("node not found: " + nodeId)` (link.js:10), at initialize. The probe printed `missing end: node not found: gone`. It also **mutates** each link's `source`, `target` and `index` (link.js:59-61).
- **Ticks to `alpha < alphaMin` with the defaults: 300 from alpha 1.** alphaDecay = 1 - 0.001^(1/300). The loop computed in node gives 300 ticks, ending at alpha 0.0009999999999999966. From alpha 0.3 with the target at 0 it takes 248 ticks. The probe measured 218 ticks to rest after case 4's release, because alpha had only climbed to about 0.15 in 30 drag ticks.
- Other points:
  - `tick()` does not dispatch the "tick" event; only the timer's step does (simulation.js:30-37). So the view's `on('tick')` fires only after `restart()`.
  - `forceCollide` does not scale with alpha.
  - `forceManyBody` has theta^2 0.81 by default, and `distanceMax(300)` sets distanceMax^2 to 90000 (manyBody.js:108).
  - `velocityDecay` defaults to 0.6 kept per tick (`velocityDecay()` reads 0.4).

## Declined to judge

- Whether -120, 300, 0.02 and 0.3 give a picture Axel likes. That is for the look.
- Whether a node released after a drag should drift (decision 3), which is a user-visible choice the brief surfaces.
- Whether README.md:13's missing `@viz-js/viz` is in this step's scope.

## Usage

160602 tokens, 42 tool uses, 8 min (from its completion notice).

## Closed

- Names, pointer.ts:53: added to the paths (item 5).
- Names, graph.test.ts:391 and the helpers: item 7 rewrites 391 as a literal and removes `point()`, `edge()` and their imports.
- Names, layout.test.ts:186-189 and map.test.ts: added to the paths, with what they assert (item 7).
- Names, README.md:13: added (item 9), with `@viz-js/viz` too, since the line is the runtime dependency list the step changes.
- The step line, the look: the section "The look at landing" names both states.
- Premises, line numbers: layout.ts 97-98, 101, 107, 201-209 and nodeDown 200-218 corrected; the release date is 2021-06-05.
- Premises 1, edges mutated: `createForces` copies the edges (item 1); case 13 checks it.
- Premises 2, the box: `clampToBox` after every tick through `advance` and the view's tick listener (item 1); case 14.
- Premises 3, the view hot and at settled lengths: the view goes on with the settled simulation `mapPlacement` answers (items 3 and 4, decision 2); case 15.
- Premises 4, `placed` never reset: the effect sets `placed = null` (item 4); case 16.
- Case 1's vacuous alpha check and loose threshold: removed; "apart" defined as `r1 + r2 + gap - 0.5`.
- Case 2, determinism without the seeded source: the hand LCG dropped (decision 4) and the case dropped.
- Case 3 as a view audit: the press's no-restart rule is audit 16.
- Cases 11 and 12 location and allow-audits.txt: the audits go in map.test.ts with "audit" in the names; allow-audits.txt left out of the paths.
- The named reverts that did not bite: new cases 2 and 3 isolate the collision and the charge, each with its revert; case 5's revert is a neighbour-only drag, and it asserts every node moved.
- Case 5 (now 6) failing with the parameters: the collision's strength and iterations are in `FORCES` and may be tuned; the overlap bound with the held node is 2 units; the start is fixed at (60, 340); a hand-back if no value meets it.
- Case 6, vacuous: dropped.
- Verify item 2: greps config, README.md and docs too.
- Implied inputs: unknown id (case 8), click and cancel releasing (case 7, audit 16), press while cooling (decision 3), pane closed (audit 16), many nodes on one point (case 11), settle cost for many nodes (decision 5, measured in the report), stopped simulations in tests (Conventions). A self-loop edge is not built by `buildGraph` (related edges skip `target === project.id`, graph.ts:154), so it has no case.
