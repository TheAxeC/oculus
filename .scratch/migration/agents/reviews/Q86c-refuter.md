# Step Q86c refuter report (on .agents/worktrees/Q86c, base de977c87)

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
- `git diff de977c87 -- package-lock.json` adds exactly `node_modules/@types/d3-force`, `d3-dispatch`, `d3-force`, `d3-quadtree`, `d3-timer`, and removes none. This matches the report.
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

## Repair round 1, refuted

Q86c, on /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q86c, base de977c87. I changed nothing in the worktree, the main checkout or the ledger. `git status --short` lists the same 19 paths before and after my run. All reverts ran in a scratch copy at /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/Q86c-r1-refute/. That copy was made by rsync of tools/oculus without node_modules, .svelte-kit, build, .scratch and config/local.yml, and node_modules is a symlink to the worktree's. The script is reverts.py in that folder. It checks that each source file is back byte for byte after each revert.

```
$ npm run diagrams            (from tools/oculus in the worktree, 00:45)
... docs/diagrams/writes.svg  (last line; git status --short showed no new path after it)

$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md   (00:45 to 00:49, load average 6.98)
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 6 commands passed
```

I captured only the tail of the output, so the summary lines of `npm test` and `npm run check` in my run are not quoted. The list's final line, `checks: 6 commands passed`, means each of the six exited 0. No red line, so no file was run alone. The builder's report quotes `Test Files  376 passed (376)` and `Tests  5913 passed | 1 skipped (5914)`. That agrees with round 0's 5913 tests plus the one refusal case added, but I did not rerun it.

Brief verify items 2 and 3: the source is unchanged since the first review (the file line counts match its figures: forces.ts 194, layout.ts 272, Graph.svelte 538). Its results stand: item 2 printed nothing, and item 3 printed `23:} from 'd3-force';`. I did not rerun them this round.

Rerun of the builder's quoted evidence, in the scratch copy: `npx vitest run tests/state/boards/structure/forces.test.ts tests/state/boards/structure/layout.test.ts` printed `Test Files  2 passed (2)` and `Tests  29 passed (29)`, matching the report.

Reverts, each made in the scratch copy with only that test selected (`-t`):
- `press()` calls `simulation.tick()`: red, `forces.test.ts:112:43` `AssertionError: expected Map{ 'line::a' => ... } to deeply equal Map{ ... }`.
- `press()` calls `restart()` then `stop()`: green (`Tests 1 passed | 14 skipped`). See "Declined to judge".
- `release()` keeps `fx` and `fy`: red, `forces.test.ts:192:27` `AssertionError: expected 441.13576826215194 to be null`.
- `press()` without its guard for an unknown id: red, `forces.test.ts:206:16` `... but 'TypeError: Cannot read properties of ...' was thrown`.
- `release()` without its guard: red, `forces.test.ts:206:16` `"TypeError: Cannot set properties of undefined (setting 'fx')"`.
- `clampToBox()` keeping `vx` on the left edge: red, `forces.test.ts:299:24` `AssertionError: expected -5 to be +0`.
- `advance()` ticking without `clampToBox()`: red, `forces.test.ts:101:31` `AssertionError: expected false to be true`.
- `dragTo()` setting `fx` and `fy` alone: red, `forces.test.ts:178:43` `AssertionError: step 15: expected -3.333168548442785 to be greater than or equal to -2`. This reproduces the builder's decision 1 measurement, which the first review declined.
- `press()` also fixing every node that is not a neighbour (a neighbour-only drag): red, `forces.test.ts:150:44` `AssertionError: expected [ 'line::a', 'line::b', ...(28) ] to deeply equal []`.
- `mapPlacement()` building `createForces([], graph.edges)` on a refused placement: red, `layout.test.ts:205:50` `AssertionError: expected { nodes: [], ...(2) } to deeply equal { nodes: [], ...(2) }`.
- `mapPlacement()` answering `failure: null` on a refused placement: red, `layout.test.ts:205:50`.

Each red line matches the one the builder's report quotes for that revert.

### Verdicts

What to build, for the whole diff since the base:
1. forces.ts: holds. `FORCES` is as the brief sets it. `createForces` copies the nodes and the edges and skips an edge with a missing end, each link's distance is its neato length, and a force whose parameter is 0 is left out. `clampToBox`, `advance`, `settleForces`, `press`, `dragTo` and `release` are as asked, with the unknown-id guards (forces.ts:65-194). `forceNodes` and the extra `x`, `y`, `vx`, `vy` writes in `dragTo` are reported decisions; the second is now reproduced (above).
2. graph.ts: holds (diff: the drag code is gone, `LINK_LENGTH = 107` is in, the head comment is rewritten).
3. layout.ts: holds. `graphDot` reads `LINK_LENGTH`, and `mapPlacement` answers `{ nodes, failure, forces }`, with null forces before the load, on a load failure and on a placement refusal. The additions `placementKey` and `drawnAt` are the orchestrator's Spec 1.
4. Graph.svelte: holds, with Spec 1's addition as before.
5. pointer.ts:53: holds.
6. package.json and package-lock.json: holds (`d3-force` 3.0.0 and `@types/d3-force` 3.0.10 in the diff).
7. Tests: holds. Verify item 4 is now met: each test forces.test.ts adds names a revert in a `// Revert:` comment (14 such lines by `grep -c`), except the empty-set test, which is renamed as an audit. The refusal case is at layout.test.ts:198.
8. DESIGN.md:291: holds.
9. README.md:13: holds.
10. docs/diagrams: holds. `npm run diagrams` gave no new change, and the list is green.

Cases:
1. Met (forces.test.ts:96); its revert (no clamp) was run red.
2. Met (forces.test.ts:234).
3. Met (forces.test.ts:242).
4. Met (forces.test.ts:105); the tick revert was run red.
5. Met (forces.test.ts:116); the neighbour-only revert was run red.
6. Met (forces.test.ts:153); the fixed-point-only revert was run red, at -3.33.
7. Met (forces.test.ts:185); the revert that keeps `fx` was run red.
8. Met (forces.test.ts:196); the press and release guard reverts were each run red.
9. Met, as an audit (forces.test.ts:257).
10. Met (forces.test.ts:261).
11. Met (forces.test.ts:269).
12. Met (forces.test.ts:277).
13. Met (forces.test.ts:212).
14. Met (forces.test.ts:290); the revert that keeps the speed was run red.
15. Met. The load-failure branch is tested at layout.test.ts:183 and forces.test.ts:220, and the placement-refusal branch at layout.test.ts:198, which both of its reverts turn red. This closes the first review's Proof 2.
16. Met, as source audits (map.test.ts:542, 549, 556, 564), each with "audit" in its name.
17. Met: the full `npm test` inside the list is green.

### Findings

- Proof. `Q86c-report.md`, the DONE table and the Reverts section: "`layout.test.ts:195`, a placement the engine refuses". What is wrong: the case is at layout.test.ts:198 (`grep -n "^    it(" tests/state/boards/structure/layout.test.ts` prints `198: it("answers no node, the engine's reason and no simulation for a placement the engine refuses"`). The line of the red assertion quoted with it (205:50) is correct. No decision rests on the line. Failure scenario: the orchestrator following the table's pointer lands three lines early, inside the previous test. Verdict: none; fixable at landing.
- Proof. `Q86c-report.md`, the Reverts section: "`tests/views/structure/map.test.ts:543-568`: the five cases named "audits that" read Graph.svelte's source." What is wrong: that range holds four audits (the `grep` for `it('audits` lists 542, 549, 556 and 564). The fifth "audits that" test in the file, at 493, is older and outside the range. Failure scenario: a reader counting the step's view audits against case 16 looks for a fifth that does not exist. Verdict: none; fixable at landing.
- Standards. `tests/state/boards/structure/forces.test.ts:257`: `it('audits that settles an empty node set to no node', () => {`. What is wrong: the renamed test name is ungrammatical (the clause after "audits that" has no subject). The other audit names in the suite read as sentences ("audits that a press fixes the node ..."). The rules file's "Prose: plain" rule governs it. Failure scenario: a reader of the test list parses the name awkwardly; the audit convention itself is met. Verdict: none; a one-word fix at landing ("audits that it settles ..." or "audits that an empty node set settles to no node").

No finding under Spec or Behaviour. The round changed only what its brief asked:
- The src files are the same size as at the first review.
- forces.test.ts grew from 290 to 302 lines, and every shift in test line numbers matches an added comment line.
- The one new layout test and the rewritten report are the only other changes of the round.

No check was removed or loosened. The report now:
- says which commands ran on the final code;
- states 3.5 units for case 1;
- carries the link-mode before and after as its own entry, with the base line numbers of `placed` that the brief also cites.

Its open-items section matches the main state file's Open items list (Z69 only), verbatim.

### Declined to judge

- `press()` restarting the simulation: my revert (`restart()` then `stop()` inside `press()`) stays green. The case 4 test runs synchronously, and d3's timer never fires inside it, so a restart inside `press()` in forces.ts is caught by no test. A restart in the view's `nodeDown` is caught only by the source audit at map.test.ts:542. The round brief allowed "ticking or restarting", and the builder named ticking, which does go red, so this is not a finding against the round. Catching a restart needs an asynchronous test or the look on TEST.
- The `npm test` and `npm run check` summary lines of my verify run: I captured only the tail of the list's output. I did not rerun the list, since the brief allows one run; its final line `checks: 6 commands passed` is the evidence.
- Spec 1 to 3 of the first review (`placementKey`, `drawnAt` and the `untrack` derivation; the re-keyed `allow-duplication.txt:161`; the ledger's Z58 line): these are the orchestrator's by the round brief.
- The Svelte reactivity in a browser (the tick listener, the cleanup on a key change, the link-mode re-placement): this is for the look on TEST.

Reviewer usage: 17 tool uses; tokens not known to me; 00:44 to 00:51 CEST on 2026-09-30, about 7 minutes, of which about 4 minutes were the verify list.

Completion notice: 24 tool uses, 156k tokens, 7.4 min; model claude-opus-5-5 (read from its transcript).

### Closed

- The report's pointer `layout.test.ts:195`: the case is at `:198`; the booking and the landing report cite `:198`.
- The report's "five cases" at `map.test.ts:543-568`: four audits (542, 549, 556, 564); the booking and the landing report say four.
- The test name at `forces.test.ts:257`: renamed at landing to 'audits that an empty node set settles to no node'.
