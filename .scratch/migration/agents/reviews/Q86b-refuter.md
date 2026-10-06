# Step Q86b refuter report (on .agents/worktrees/Q86b, base 7444dd36)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number. A finding in code keeps its file:line.

## Verification (rerun by the reviewer)

```
$ (tools/oculus in the worktree) PATH=...v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md </dev/null   (exit 0, log in scratch q86b-refute/checks.log)
$ npm test
 Test Files  366 passed (366)
      Tests  5811 passed | 1 skipped (5812)
$ npm run check
1790698929181 COMPLETED 2113 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 6 commands passed

$ bash bin/folder-check.sh                      -> exit 0
$ LC_ALL=C perl -ne '...' $(find src tests bin config -type f ! -name local.yml)   -> prints nothing, exit 0
$ grep -nwE "repulse|collide|center|cool|DRAG_PHYSICS" graph.ts Graph.svelte graph.test.ts   -> prints nothing, exit 1
$ npm run diagrams (on a copy in scratch)       -> exit 0; diff -r of docs/diagrams against the worktree: identical
$ grep -rn -e DRAG_PHYSICS -e reheat -e "\balpha\b" -e "\bcool\b" -e repulse -e collide -e "centre pull" src tests DESIGN.md HELP.md README.md config   -> no hit of a removed name (only unrelated "alpha"/"collide" words elsewhere)

The new tests against the base sources (graph.ts and labels.ts reverse-patched on the copy, new tests kept):
 Test Files  2 failed (2);  Tests  21 failed | 31 passed (52); the six label cases the report marks red are red. Consistent with the report's first-run table.

Reverts rerun on the copy (each restored after), npx vitest run <file>:
 settle's rest break removed           -> 4 failed | 31 passed (settles every drag..., stops a settle..., empty set, one node)
 settle's cap raised to 10*MAX_FRAMES  -> 35 passed (35)   GREEN
 PUSH_PASSES = 1                       -> 1 failed: "60: project::p0 and project::p36: expected 19.925216179593132 to be >= 19.99"
 clamp moved to once after all passes  -> 35 passed (35)   GREEN
 pressHold not finishing the settle    -> 1 failed: "expected 3.863896710070812 to be less than 0.01"
 apart ignored (limit = room)          -> 3 failed (at rest, close pair, coincident at press)
 push removed                          -> 4 failed
 pillar ordering removed (labels.ts)   -> 1 failed: "expected [ 'p' ] to deeply equal [ 'l' ]"
 node rule removed                     -> 4 failed
 zero-width-first check removed        -> 1 failed: "expected [ 'a', 'b', 'e', 'f' ] to deeply equal [...six]"
 project circle read as its square     -> 1 failed: "expected [ 'p2' ] to deeply equal [ 'p1', 'p2' ]"
 toBox zero-size guard removed         -> 1 failed: "expected { x: Infinity, y: Infinity } to deeply equal { x: +0, y: +0 }"

Probe on the copy (placeGraph seed 1, 25 drags: line::a..d and project::p0 at 60, 200, -200, 400, -400):
 no settle reached MAX_FRAMES (most frames 1512, line::b 400); worst gap shortfall against min(ra+rb+4, apart) 0.00059 (line::b 400, project::p0/project::p36); no overlap of two circles other than the dragged one.
 repeated settles at the same pointer, largest cumulative move: after 1..5 settles about 0.010, 0.020, 0.030, 0.040, 0.050 for every pillar drag; after 100 settles 0.36 to 0.92 units (line::c 60: 0.9230); project::p0 0.014 to 0.063.
```

## Verdicts

Items of the brief's "What to build":

- 1 (drag physics): holds. graph.ts:66-90 (`Physics` with `gap`, `DEFAULT_PHYSICS` damping 0.6 per the ruling, DRAG_STEP, REST, MAX_FRAMES, PUSH_PASSES), physics at :454, push at :507, holdFor with `apart` at :555, dragTick `{ nodes, moved }`, settle `{ nodes, frames }`, pressHold at :616. The push loop holds the limit at the stated tolerance on every drag probed (worst shortfall 0.00059 < 0.01). Proof gaps under Proof 1 and 2.
- 2 (drag loop, Graph.svelte): holds by reading. alpha, reheat and cooling gone; `step()` continues only while `next.moved >= REST && frames < MAX_FRAMES` (Graph.svelte:207), so the page loop stops at MAX_FRAMES; `run()` starts a loop only when none runs; `nodeDown` cancels the pending frame and takes positions and hold from `pressHold` with the running hold (:218-223). No new `$effect`, so map.test.ts is untouched. 539 lines, under 540. The page loop and the press are DOM behaviour, seen at the look.
- 3 (pointer mapping): holds. pointer.ts `toBox` (with `!(scale > 0)` answering (0, 0), NaN included) and `toGraph`; `viewport()` is `toBox`, `local()` is `toGraph` of it; the drag, link pointer, pan and wheel all go through them (Graph.svelte:171-177, 211, 226-236, 280).
- 4 (labels): holds. labels.ts `shownLabels(boxes, first, nodes)`: leading labels kept first, then pillars in graph order, then the rest; zero-width checked first against labels and nodes; a project a circle (nearest-point test), a pillar or collaborator a square; own node skipped. Matches Graph.svelte's circle/rect drawing (:390-406).
- 5 (tests): holds. The fixture lives in tests/state/boards/structure/map-fixture.ts; layout.test.ts imports `edge, node` from it (its copies removed); graph.test.ts imports `denseGraph, node` and places it with `createGraphviz().ready()` in a `beforeAll`. No copy. New label and pointer cases are named "audits ..."; allow-audits.txt gained no entry (six reasons updated to the three-argument call). Proof gaps under Proof 1 and 2.
- 6 (documents and comments): violated in one sentence, Standards 1. Otherwise DESIGN.md:291, HELP.md:103, Graph.svelte's head comment, the graph.ts docstrings and labels.ts's head comment match the code. No history in any added comment (grep of the added lines for no longer / formerly / used to / previous / instead of: no hit).

Cases of the brief's "Cases" (judged against Q86b-cases.md where it rules):

- Press with no move (line::a, project::p0): met, 'moves nothing on a press that does not move'.
- Drag of a node joined to nothing: met, 'moves no other node on a drag of a node joined to nothing', with the drop onto line::a.
- Circles apart after 60, 200, -200 of line::a, gap limit with 0.01 tolerance: met, 'keeps every circle but the dragged one off the others...'; red under PUSH_PASSES = 1; the probe over 25 drags stays within 0.00059.
- Close pair kept at its distance: met, 'keeps a close pair at its distance at the press'; the press half is red under the apart revert. The drag half cannot fail (Proof 3).
- The creep ends (ruled: 15 drags, second settle at most 0.01, no cap reached): met as ruled; the drift that remains is Standards 1.
- settle stops (ruled over 15 drags): met, 'stops a settle at rest, before the frame cap'; red with the rest break removed.
- Press during a running settle: met, 'finishes a running settle at a press...'; red with pressHold not settling.
- Empty node set: met. One node: met. Coincident at the press: met. Apart at the press, coincident in a frame: met.
- toBox cases (wide, 1:1, tall 600 by 1000, no size): met, map-pointer.test.ts, each red under its revert. toGraph zoom 2 pan (100, 50): met.
- Labels with nodes (six sub-cases): met, red under the node-rule and circle-as-square reverts.
- Labels order (three sub-cases): met; pillar ordering red under its revert.
- Zero-width label on an edge, inside a label, inside a circle: met.
- The grep: met, prints nothing.
- For the look (drag and press in a letterboxed pane, wheel anchor and pan, dense-middle labels): not verifiable here; settled by the look on TEST.

## 1. Spec

- .agents/worktrees/Q86b/.scratch-builder/ (untracked, repo root of the worktree): `?? .scratch-builder/` holding backup/graph.ts, backup/labels.ts, backup/pointer.ts, checks.txt (81 KB), drag.ts, graph.ts, kept.ts, labels-cases.ts, physics.ts, pointer.ts, reverts.py, reverts.txt, first-run.txt; what is wrong: a folder outside the brief's "Paths this step writes" ("The step writes these paths and nothing else"), not ignored by git; failure scenario: `/land` step 3 runs `git add -A` of the whole worktree with only the ledger root left out, so these scratch copies of source files and a Python script are committed onto main with the step unless the folder is removed before the wip commit; verdict: none (outside every item), a landing fix.

## 2. Proof

- src/lib/state/boards/structure/graph.ts:600: "while (frames < MAX_FRAMES) {"; what is wrong: no test reaches the frame cap, so settle's cap is an audit, not a proof; the revert to `10 * MAX_FRAMES` leaves graph.test.ts at 35 passed (35). My one attempt at an input that reaches the cap (a mover squeezed between two fixed nodes) rested in 2 frames, since the push undoes the spring each frame and `moved` reads 0. The report's revert table names no revert for the cap (its "settle runs to the frame cap" rows are the rest-break revert). The page loop's cap (Graph.svelte:207) is read and correct but equally untested, being DOM. Failure scenario: a later change that drops the cap from settle stays green, and any input that never rests would then hang `pressHold` inside a pointerdown handler; verdict: none (item 1 holds by reading), brief item 5's "a test that no revert turns red is an audit ... and the report says which it is" not said for the cap.
- graph.ts:492-497 (the clamp inside each push pass, cases ruling 1): "for (const node of next) { if (!moves(node)) continue; node.x = Math.max(bounds.pad, ...". What is wrong: moving the clamp to run once after all passes leaves graph.test.ts at 35 passed (35), so the ruled placement of the clamp is unproven. The report does state that no case reaches the box edge. Failure scenario: a later change that moves the clamp out of the loop stays green; near the edge a mover can then be clamped back inside a neighbour after the last pass. Verdict: none.
- tests/state/boards/structure/graph.test.ts, 'keeps a close pair at its distance at the press', the drag half: "const after = dragOf(nodes, edges, 'held', -5).nodes; expect(Math.hypot(after[1].x - after[2].x, ...)).toBeGreaterThanOrEqual(10 - 0.01)". What is wrong: dragging `held` left pulls `mover` away from `other`, so the assertion holds whatever the push does; it stays green with the push removed entirely. Only the press half of the case turns red, under the apart revert. Failure scenario: a reader of the revert table takes the whole case as proof that a drag keeps a close pair at its press distance; a drag toward `other` is what would prove it. Verdict: none (the case as written is met).

## 3. Standards

- DESIGN.md:291: "so a drag comes to rest at the springs' balance and a later pointer move at the same place moves nothing further". The same claim appears in the settle docstring (graph.ts:590-593, "a second settle at the same pointer finds them there and moves nothing further") and in the report's before/after. What is wrong: the rest rule stops a settle while the movers are still approaching balance. Each reheat at the same pointer runs at least one more frame and moves them by just under REST. My probe measured about 0.010 per settle, adding up to 0.05 after five settles and 0.36 to 0.92 units after 100 on the pillar drags. The builder's own limitation note ("that frame is under REST by the stop rule") says the second-settle assertion is close to a restatement of the rest rule. The rule broken is spec.md's "What every package obeys": a sentence the change makes false is a defect of the change. The original brief case (five settles, 0.5 total) holds, at 0.05. Failure scenario: a reader of DESIGN.md takes the creep as gone. In fact a slow drift of about 0.01 unit per reheat remains, sub-pixel over a normal drag. The fix is the sentence ("moves under REST per reheat"), or a rest rule that also requires near-zero speed. Verdict: item 6 violated.

## 4. Behaviour

- The report's "User-visible changes", first bullet: "after, the node stays under the pointer through the drag and the press does not jump it". What is wrong: pointerMove (Graph.svelte:240-245) still puts the dragged node's centre at the pointer once the drag passes the 3-unit threshold. With the corrected mapping the node therefore snaps once by the grab offset inside the node, up to its radius (8 to 16 units). The 34 px sideways jump from the old mapping is gone. Failure scenario: at the look on TEST a small snap on the first move past 3 units is read as a defect of the step, or it passes unremarked because the report said there is no jump. Verdict: none.

## Declined to judge

- The look items (a drag and a press in a letterboxed pane, the wheel anchor and the pan, which labels show in the dense middle, the visible length of a pillar drag's tail of up to about 1500 frames): these need the running page on TEST, which the review may not open.
- The cost of `pressHold`'s synchronous settle inside pointerdown, and of up to PUSH_PASSES passes per frame on the real portfolio: not measured. The test timings suggest tens of milliseconds per settle on the 44-node fixture.
- The first-run table's graph.ts rows beyond the count: I reproduced the 21 failures and the label rows on the base sources, but not each error message of the graph rows.
- The earlier load-average timeouts the report mentions in four unchanged files: not rerun, per spec.md's rule on test files the step does not change. My run of the list was green.

Reviewer usage: 38 tool uses, 193k tokens, 12 min (from the completion notice). One read-only `git -C . status` ran inside a compound command beside the permitted `git diff 7444dd36` and `git status --short`; it changed nothing. Copies, probes and logs are only in scratchpad/q86b-refute/.
## Repair round 1, refuted

A fresh reviewer over the round (from the worktree after round 1, against the whole diff since base 7444dd36). Its probes and logs: the session scratchpad `q86b-refute-r1/` (`tail.log`, `jitter.log`, `p3.log`, `press.log`, `balance.log`, `checks.log`).

I sent my review of Q86b's repair round 1. It finds two problems: new sentences in the docs are false, and the creep that ruling Z49 asked to end is still there.

**Checks.** The verify list stopped at `npm test`: `Tests  1 failed | 5814 passed | 1 skipped (5816)`. The one failure is in `tests/server/machine/pty/sessions.test.ts`, a file the step does not change. Run alone it passes, `Tests  19 passed (19)`. The five commands after it each pass when run one by one; `npm run check` gives `COMPLETED 2113 FILES 0 ERRORS 0 WARNINGS`. `bin/folder-check.sh`, the ASCII gate and the grep of removed names are clean. `npm run diagrams` on a copy gives files identical to the worktree's.

**The round's claims.** I reran every revert the round names, on a copy, and each gives the red the report quotes: the grab offset ignored, the same-place guard removed, the link reach removed, the clamp moved after the push passes, and the push removed. `.scratch-builder/` is gone from the worktree.

**Findings:**
1. **The docs claim the drag comes to rest at the springs' balance; it does not.** This is in `DESIGN.md:291` and the `settle` docstring at `graph.ts:590-593`. The stop rule fires while the nodes are still sliding slowly. If the frames are left to run on, the nodes move up to 66 more units. On seed 1, 20 of 21 drags stop more than 0.1 unit short of that end point.
2. **The other new sentence is also false.** It says a settle started again at the same pointer moves each node less than `REST` (0.01) in its first frame and stops there. For seed 1, `project::p3` dragged -200, the second restart's first frame moved 0.015 and it ran 8 frames.
3. **The creep survives.** The same-place guard stops only a pointer event at exactly the same position. A drag held with a pointer wobbling 0.25 unit (under one pixel) restarts the settle each time. After 300 events, about 5 seconds, the neighbours had moved 45 units (seed 2, `line::a` dragged 200). The ruled test only checks one restart over 15 drags at seed 1, so it cannot see this. The fix the first review suggested, stopping only when the speeds are also near zero, would end it. I rated the creep case partial.
4. **"No jump at the press" is false in one case.** Pressing a node that the last drag is still settling first finishes that settle (`pressHold`, as the brief requires). The node leaps away from under the pointer: 60 units at one second after the drop. It then drags at that distance for the rest of the drag. The brief's settle-at-press rule and this round's no-jump rule conflict, and that needs your ruling. The report's before-and-after does not mention it, so the look on TEST would not check for it.
5. **Minor.** Moving `nearestProject` and `LINK_REACH` into `pointer.ts` went beyond the six rulings, to keep `Graph.svelte` under 540 lines. Its behaviour is unchanged and it has its own test. The report's old revert table still names `reverts.py`, which this round deleted.

**Verdicts.** Brief items 1 to 5 hold; item 6 (documents and comments) is violated by findings 1, 2 and 4. Every case is met except the creep case (partial) and the on-screen items, which only the look on TEST can check.


Usage: 31 tool uses, 178k tokens, 14.5 min.

## Repair round 2, refuted

A fresh reviewer over round 2 (the worktree after the round, against the whole diff since base 7444dd36). Its probes and logs: the session scratchpad `q86b-refute-r2/` (`checks.log`, `probe.log`, `tail2.log`, `contact.log`).

Q86b repair round 2 refutation (worktree .agents/worktrees/Q86b, base 7444dd36). I changed no file in the worktree, the main checkout or the ledger. `git status --short` shows the same 17 entries as before the review. Probes, copies and logs are only in scratchpad/q86b-refute-r2/.

## Verification lines, verbatim

From the worktree's tools/oculus, at load average 8.50: `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md </dev/null`, exit 0, log at q86b-refute-r2/checks.log:
```
$ npm test
 Test Files  366 passed (366)
      Tests  5818 passed | 1 skipped (5819)
$ npm run check
1790703286531 COMPLETED 2113 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 6 commands passed
```
No test failed, so no one-file rerun was needed.

On my copy (q86b-refute-r2/oc):
- `bash bin/folder-check.sh`: exit 0.
- `npm run diagrams`: exit 0. `diff -r docs/diagrams <worktree>/docs/diagrams` finds the two identical.
- The perl ASCII gate prints nothing (exit 0).
- `grep -nwE "repulse|collide|center|cool|DRAG_PHYSICS"` over graph.ts, Graph.svelte and graph.test.ts prints nothing (exit 1).

### The round's reverts, rerun on the copy

Each is a `perl` replacement, then `npx vitest run <file>`, then the file restored. Every one gives the red the report quotes.
- `settle(nodes, edges, withoutMover(running, id))` changed to `settle(nodes, edges, running)` gives 2 failed:
  - `expected 0.05640865116428925 to be less than 0.01`
  - `expected [ 510.37015875936675, 340 ] to deeply equal [ 555.5502771335535, 340 ]`
  - Both match the report.
- pressHold not finishing the settle (to `nodes`) gives 2 failed: `expected 3.863896710070812 to be less than 0.01`, which matches, and the new case's `r` row, which is also red.
- `if (inA < 0)` changed to `if (false)` gives 1 failed: `expected 59.124301578897054 to be less than or equal to 0`, which matches. The `inB` half alone gives the same red, so each half is proven separately.
- `>= DRAG_PIXEL` changed to `>= 0` gives 2 failed: `expected 300 to be +0` and `expected true to be false`, which match. `> 0` gives the same.

## Probes (item 3 of the task)

All from q86b-refute-r2/probe.log, tail2.log and contact.log, run by vitest on the copy.

**Wobble through physics alone.** The round-1 probe unchanged: seed 2, `line::a` dragged 200, a settle after each event, the node placed at +0.25 and +0 units in turn. Largest move of any neighbour from the stop:
- after 300 events: 2.842 (it was 45.482 before this round);
- after 600 events: 4.955.

The brief's figure "4.96" is the 600-event value, not the 300-event one.

**The same wobble as the page sees it.** Pane 1410 by 595, so 0.25 unit is 0.219 px. `movedEnough` is applied to screen points, starting from the last point that placed the node. Result: 0 settles started in 300 events, and the largest move of any node is 0.0000. Ruling Z54's creep under a still or sub-pixel pointer is closed.

**The press jump.** A press on each of the 14 movers of a running `line::a` 200 settle, at 10, 60, 120 and 300 frames after the drop, seeds 1 and 2:
- The pressed node moved 0 in every run, with x and y exactly equal to their input. Closed.
- Other nodes jump at the press by up to 113.82 (seed 1) and 160.00 (seed 2) at 10 frames, and 61.92 or 107.87 at 60 frames. That is the ruled finish of the last settle.
- `pressHold` takes 129 ms, synchronously inside pointerdown, on the 44-node fixture (tail2.log).

**The slow slide after a settle stops.** Frames run on after `settle` stopped:
- seed 1 `line::c` 200: nodes move 54.35 by frame 20000. Motion ends only at frame 57294, 67.03 units from the stop (`project::p26`).
- seed 2 `line::a` 200: 48.14. In 1312 later frames the move per frame rises back above REST.
- seed 1 `line::a` 60: 3.41.
- `project::p0` 200: 0.037.

contact.log shows what the slide is. `project::p26` sits at gap 0.0000 on its limit against `project::p10`, and slides along that contact from (568.52, 79.19) to (627.78, 48.00) while the gap stays 0.0000.

A pointer stepping 1.2 px back and forth (each step a real move, so each one placed) resumes the slide: 5.9 units after 10 events and 48.1 after 60. It then holds at 48.4, which is the stopping point measured above; it does not grow past it.

What the documents say: `DESIGN.md:291` and the `settle` docstring (graph.ts:608-611) now say the stop "can be short of the springs' balance". That is true, but the documents give no size, and the shortfall is up to 67 units (about 59 px in the 1410 by 595 pane). They no longer claim the nodes rest at balance.

## Verdicts, the whole diff since the base

Items of "What to build":
1. Drag physics: holds.
2. Drag loop: holds by reading. `nodeDown`, `dragTo` and `pointerUp` at Graph.svelte:200-289; 539 lines; no new `$effect`.
3. Pointer mapping: holds.
4. Labels: holds.
5. Tests: holds. The Graph.svelte wiring of `movedEnough` and `lastScreen` is DOM behaviour: no test turns red if it is removed, and it is seen at the look.
6. Documents and comments: violated, by the one sentence in Standards 1 below (a small landing fix). Everything else matches the code.

Cases:
- Press with no move: met.
- Drag of a node joined to nothing: met.
- Circles apart after 60, 200 and -200: met.
- Close pair kept at its distance: met.
- The creep ends: met, as the cases ruling words it, and the page guard stops sub-pixel restarts. The slide that remains on a real move is Behaviour 1.
- `settle` stops: met.
- Press during a running settle: met, as Z54 rules it; red under both reverts.
- Empty set, one node, coincident at press, apart then coincident: met.
- The `toBox` and `toGraph` cases: met.
- Labels with nodes, labels order, zero-width label: met.
- The grep: met.
- The look items: not verifiable here.

## 1. Spec
None.

## 2. Proof
None new.

The page wiring of the pixel guard is an audit, seen only at the look: Graph.svelte:265, `if (!movedEnough(lastScreen, screen)) return;`, and :216, `lastScreen = {...}`. The report says so under Limitations.

## 3. Standards

1. **DESIGN.md:291** says: "A pointer event less than one screen pixel (`DRAG_PIXEL`) from the last one that placed the dragged node ... places nothing and starts no settle ..., so nothing moves while the pointer rests or trembles." Graph.svelte:14-15 says the same.
   - What is wrong: a settle started by the last real move keeps running while the pointer rests. That lasts up to 1127 frames on the fixture, about 19 s, and on seed 2 `line::a` 200 the tail moves up to 48 units. The neighbours therefore do move while the pointer rests.
   - Failure scenario: a reader of DESIGN takes the neighbours to be still once the pointer stops. At the look, a pillar's neighbours visibly keep sliding for seconds after the pointer comes to rest.
   - The wording comes from the round's own brief. A landing fix: "starts no new settle; one already running goes on to its stop".
2. **graph.ts:82-83** (whole diff): "rather than until a cooling budget runs out".
   - What is wrong: this names a mechanism that no longer exists in the tree, which is history in a comment (spec.md "No history in code or comments").
   - Failure scenario: a reader looks for the cooling budget and finds none.
   - A landing fix.

## 4. Behaviour

1. **The report's "Repair round 2", Before and after, Item 2**: "After, the push takes that speed out, so a neighbour in contact does not keep sliding along it."
   - What is wrong: only the speed into the contact is removed. The part along the contact stays, so a node on its limit still slides along it. `project::p26` on `project::p10` at gap 0.0000 slides 67 units over about 57,000 frames after a seed 1 `line::c` 200 settle.
   - The page stops that slide at the first frame under REST, 67 units short. Every later real pointer move of 1 px or more resumes it (48 units within 60 alternating 1.2 px events on seed 2). DESIGN.md:291 itself only claims that the speed into the contact is removed, which is true.
   - Failure scenario: at the look, a pillar is dragged, rests, then is nudged by a pixel or two. A neighbour slides tens of pixels along another circle on that nudge, while the report told the look that no neighbour keeps sliding along a contact.
   - This is inside Z54's ruled design (option (a) was ruled, not a rest rule on speed). The report sentence is false, and the behaviour is worth watching at the look.

## Declined to judge

- The look items: a drag and a press in a letterboxed pane, the wheel anchor and the pan, which labels show in the dense middle, the pixel guard as wired on the page, the length of the slow tail on screen, and whether the 129 ms synchronous `pressHold` inside pointerdown is felt. These need the running page on TEST.
- The cost of `pressHold` on the real portfolio (more nodes than the fixture): not measured.

## Usage
About 25 tool uses, 19:30 to 19:46 by the machine clock. Token count not measured.
Usage: 32 tool uses, 198k tokens, 15 min.

## Closed

- Round 2, Standards 1 (`DESIGN.md:291` and `Graph.svelte:14-15` say nothing moves while the pointer rests, though a settle already running goes on to its stop): fixed at landing, the sentences say that a sub-pixel event starts no new settle and one already running goes on to its stop.
- Round 2, Standards 2 (`graph.ts:82-83` names the cooling budget that no longer exists): fixed at landing, the clause removed.
- Round 2, Behaviour 1 (a node on its push limit still slides along the contact, and each real pointer move of a pixel or more resumes the slide, 46.38 units of a neighbour over 60 alternating 1.2-unit events on seed 2 `line::a` 200): raised to Axel as open item Z58 with the orchestrator's measurement of a fix; the report's false sentence is not landed code.
- Round 1's findings: closed by round 2 (the press jump and the creep under a still or sub-pixel pointer, per Z54), as this review's verdicts state.
