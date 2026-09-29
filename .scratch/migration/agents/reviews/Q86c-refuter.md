# Step Q86c refuter report (on .agents/worktrees/Q86c, base 194792bc)

Reviewer: an Opus agent (model `claude-opus-5-5`, read from its transcript), 33 tool uses, 169k tokens, 9.7 min, from its completion notice. Nothing in the worktree, the main checkout or the ledger was changed by it.

## 1. Verification lines, verbatim

The step's verify list, from tools/oculus in the worktree: `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`

```
$ npm test
   x starts, lists, feeds, resizes, captures and stops a terminal 10123ms
 FAIL  tests/server/machine/pty/sessions.test.ts > starts, lists, feeds, resizes, captures and stops a terminal
Error: timed out waiting for the typed line to come back as output
 Test Files  1 failed | 375 passed (376)
      Tests  1 failed | 5911 passed | 1 skipped (5913)
checks: failed with exit 1: npm test
```

- Red line: `tests/server/machine/pty/sessions.test.ts` is a file the step does not change. Run alone once (`npx vitest run tests/server/machine/pty/sessions.test.ts`), it passed: `Test Files  1 passed (1)`, `Tests  19 passed (19)`. The machine's load average was 6.24 at the time.
- checks.sh stops at its first red command, so the rest of the list was run one command at a time, each through `bash -o pipefail -c`:
  - `$ npm run check`: `COMPLETED 2133 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, exit 0
  - `$ npm run build`: exit 0
  - `$ npm run format:check`: `All matched files use Prettier code style!`, exit 0
  - `$ npm run lint`: exit 0
  - `$ ! LC_ALL=C grep -rna '[^ -~]' src tests`: exit 0
- These four results are the first evidence that check, build, format:check and lint pass on the final code.

The brief's other verify items:
- Item 2: `grep -rn 'dragTick\|pressHold\|holdFor\|PUSH_PASSES\|DRAG_STEP\|DEFAULT_PHYSICS\|edgeLengths' src tests config DESIGN.md HELP.md README.md docs` printed nothing (rc=1).
- Item 3: `grep -n "from 'd3-force'" src/lib/state/boards/structure/forces.ts` printed `23:} from 'd3-force';`.

Commands the builder's report quotes, rerun:
- `npx vitest run --reporter=verbose tests/state/boards/structure/forces.test.ts tests/views/structure/map.test.ts tests/views/structure/map-pointer.test.ts tests/state/boards/structure/graph.test.ts tests/state/boards/structure/layout.test.ts` printed `the least room to the held pillar over the drag: 24.31`, `the least room to the lone node over the drag: -0.93`, `Test Files  5 passed (5)`, `Tests  83 passed (83)`. The two measurements match the report.
- `npx vitest run tests/checks/tree/scratch.test.ts` gave `Tests  17 passed (17)`, matching the report.
- `grep -n d3 package.json` gave `23: "@types/d3-force": "3.0.10"` and `52: "d3-force": "3.0.0"`.
- `git diff 194792bc -- package-lock.json` adds exactly `node_modules/@types/d3-force`, `d3-dispatch`, `d3-force`, `d3-quadtree`, `d3-timer`, and removes none. This matches the report.
- Settle times (decision 5): the report's `timing.config.mjs` is not on disk. As an approximation, an inline `node --input-type=module` script ran d3-force with the same forces and clamp from random starts, not neato's. Medians of 5 runs: 44 nodes 22.6 ms, 97 nodes 58.2 ms, 157 nodes 102.3 ms, 406 nodes 374.2 ms, each 300 ticks. The report gives 24.0, 61.1, 126.0 and 545.7 ms. Same order of magnitude; the report ran under heavier load.

## 2. Verdicts

What to build:
1. forces.ts: holds. `FORCES` is as the brief sets it, and `createForces` copies both the nodes and the edges. Every link's distance is its length from neato, and no link strength is set. A parameter at 0 leaves its force out: charge, collide (strength or iterations) and centre. `clampToBox`, `advance`, `settleForces` (loops while `alpha() >= alphaMin()` and answers copies), `press`, `dragTo` and `release` are as asked. Unknown ids are guarded. The head comment carries no history. Addition: `dragTo` also sets `x`, `y`, `vx` and `vy` (builder's decision 1, reported with the measurement that motivated it); not reproduced, see Declined.
2. graph.ts: holds. Lines 60-88 and 419-656 are gone, `LINK_LENGTH = 107` is in, and the head comment no longer names physics (diff lines 78-90, 127-128).
3. layout.ts: holds. `graphDot` reads `LINK_LENGTH`, and `mapPlacement` answers `{ nodes, failure, forces }` with null forces before the load and on a failure. It also adds `placementKey` and `drawnAt`, which no item asks for (Spec 1).
4. Graph.svelte: holds, with the addition in Spec 1. The effect on `chosen.forces` sets `placed = null`, registers the tick listener (`clampToBox`, then `forceNodes`) and, in its cleanup, calls `stop()` and `on('tick', null)`. `nodeDown` calls `press` only; the view's `dragTo` calls `holdAt` and `restart()`. `pointerUp` releases after every branch where `drag !== null`. `run`, `step`, `frame`, `frames`, `hold` and their imports are gone.
5. pointer.ts:53: holds ("moves the held node nowhere").
6. package.json and package-lock.json: holds (evidence above).
7. Tests: holds for the listed changes. `graph.test.ts:270` uses the literal `{ linkLength: 107 }`; `layout.test.ts` asserts the settled nodes, `failure: null` and a simulation; `map.test.ts`'s `placed()` settles. Verify item 4 (every new test names its revert) is not met (Proof 1).
8. DESIGN.md:291: holds. It carries every clause the brief lists, names `LINK_LENGTH`, and adds the `placementKey` sentence.
9. README.md:13: holds.
10. docs/diagrams: holds. The two `.dot` counts change (34 to 35, 584 to 585), and the diagram checks inside `npm test` passed.

Cases:
1. Met (forces.test.ts:96).
2. Met (forces.test.ts:226); its revert is named and sound.
3. Met (forces.test.ts:234); its revert is named and sound.
4. Met (forces.test.ts:104).
5. Met (forces.test.ts:114). Least room 24.31, reproduced. The "moved more than 0" check is made at rest after the release, which is one reading of the brief's sentence.
6. Met (forces.test.ts:151). Least room -0.93 against the -2 allowed, reproduced, with no change to `FORCES`.
7. Met (forces.test.ts:181).
8. Met (forces.test.ts:191).
9. Met (forces.test.ts:249).
10. Met (forces.test.ts:253).
11. Met (forces.test.ts:260).
12. Met (forces.test.ts:267).
13. Met (forces.test.ts:206); its revert is named and sound.
14. Met (forces.test.ts:279).
15. Partial (Proof 2): the load-failure branch is tested, the placement-refusal branch is not.
16. Met, as source audits (map.test.ts:543-568), each with "audit" in its name.
17. Met: map-pointer.test.ts and graph.test.ts are green in the five-file run.

## 3. Findings

### Spec

1. Two functions and a reactivity mechanism that no item asks for: `placementKey()` and `drawnAt()` in layout.ts (diff 456-488), and the `shape`/`placedFor`/`untrack` derivation in Graph.svelte:80-90. Hunk: `const shape = $derived(placementKey(graph, seed)); const chosen = $derived(placedFor(shape, viz)); function placedFor(_key, answer) { return untrack(() => mapPlacement(answer, graph, seed)); }`. Item 4 asked for `chosen` derived from `mapPlacement(viz, graph, seed)`, with the simulation stopped on a new node set, a new seed or a closed pane. The builder's premise holds: Map.svelte builds `graph` again whenever instance state changes (lines 48-88, `held = $derived(parseMapState(...))` then `graph = $derived(filterGraph(base, kept))`), so under the brief's form a link-mode toggle or any hub push would re-settle the map and throw away a dragged picture. It is reported as decision 2, documented in DESIGN.md:291, with two tests plus one audit. It is still a user-visible shape the brief did not name: which changes keep a dragged picture and which reset it. Failure scenario, if not accepted: a reader who toggles link mode after a drag would, under the brief's form, see the map snap back to the settled neato placement.
2. `tests/checks/tree/allow-duplication.txt:161` is changed, outside the brief's path list. Hunk: `-... 65ac42560898 the same 15 lines at 98 and 110` / `+... 0c756ea91199 the same 16 lines at 92 and 110`. This re-keys an existing exemption and adds none; the report names it (decision 5). Failure scenario: an unlisted path lands without the orchestrator's check against the brief's list. The duplicated block between graph.test.ts and editor.test.ts also grew from 15 to 16 lines under that allowance.
3. Against the brief, not the builder: the ledger's Z58 closure (plan.md:491, orchestrator-state.md:151) says Q86c carries "the slide case as its test". Z60 (orchestrator-state.md:149) says Z58's friction goes, and the brief has no slide case. Failure scenario: Z58's closure line reads as done by Q86c when no case in Q86c tests a slide along a contact.

### Proof

1. Verify item 4 is not met, although the report's table marks it "Verify 4, reverts named | DONE". The report itself says "Cases 1, 4, 6-12, 14 and 15 name no revert". Those tests (forces.test.ts:96, 104, 151, 181, 191, 214, 249, 253, 260, 267, 279) carry no revert comment, and none is named as an audit. Several have an obvious revert that turns them red: press ticking or restarting (case 4); release not clearing `fx` (case 7); no guard for an unknown id (case 8); clampToBox not zeroing the outward speed (case 14). Failure scenario: a reader of the suite cannot tell which of these tests guards behaviour and which is an audit, and the DONE row claims otherwise.
2. Case 15, "null forces ... on a failure": only a Graphviz load failure is asserted (forces.test.ts:221, layout.test.ts:185). The placement-refusal branch, `if ('error' in placed) return { nodes: [], failure: placed.error, forces: null };` (layout.ts, diff line 473), is exercised by no test (`grep -n "mapPlacement(" tests -r` shows only the null and load-string inputs). Failure scenario: a change that builds forces over an empty placement on an engine refusal stays green.
3. The report's row "Verify 1, checks.sh | DONE" quotes an output that ends `checks: failed with exit 1: npm test`. checks.sh stops at the first red command, so check, build, format:check and lint never ran on the final code, and the report does not say so. Closed by this review's run: all four exit 0 (section 1).
4. The report's before/after section says the first draw leaves circles "at least 4 units apart (case 1)". Case 1 checks `gap - 0.5`, which is 3.5 (forces.test.ts:50). Failure scenario: the orchestrator at the look expects a 4-unit gap everywhere and reads a pair at 3.6 as a defect.

### Standards

None. Checks run: line counts (forces.ts 194, Graph.svelte 538, layout.ts 272, forces.test.ts 290, map.test.ts 569); folders (`src/lib/state/boards/structure` 4 items, `tests/state/boards/structure` 5); the ASCII greps and the added doc lines are clean; no history in any head comment; forces.ts imports nothing from `views/`; audits carry "audit" in their names and `allow-audits.txt` is untouched; lint, format and svelte-check are green.

### Behaviour

1. A user-visible change is not stated with a before and after for the look. A related link written from link mode changes an edge, so `placementKey` changes, and the whole Map is placed again from neato and settled, which replaces a dragged picture. Before Q86c, `placed` was never reset, so the drawn positions survived that write. The report lists this only under Limitations. Failure scenario: at the look on TEST, the orchestrator drags nodes, turns on link mode and links two projects; the whole map jumps to a new layout, and nothing in the report says whether that is intended.
2. The settle runs synchronously in a `$derived` on every key change. Reproduced: about 58 ms at 97 nodes and 374 ms at 406 nodes (inline approximation, section 1). This is within decision 5 as the brief set it; recorded because a link write in link mode (Behaviour 1) now also pays it.

## 4. Declined to judge

- The revert claims for cases 2, 3, 5 and 13 and for the placementKey case, and decision 1's measurement (step 15, -3.33 with `fx`/`fy` alone): checking them needs a temporary source edit, which this review may not make. Each revert was read against the code and is plausible.
- The first run on the unchanged tree ("Cases 1-15 red, module not found; three audits red; 84 tests"): reproducing it needs the base tree with the new tests, which requires an edit.
- The Svelte reactivity in the browser (the tick listener, cleanup on a key change, the untracked graph read): for the look on TEST.
- The exact settle times on neato's placement: the builder's timing config is not on disk.

## 5. Usage

33 tool uses, 169k tokens, 9.7 min (completion notice). Most of the time went to the one full verify run (npm test, 96.6 s) and the four follow-up commands.
