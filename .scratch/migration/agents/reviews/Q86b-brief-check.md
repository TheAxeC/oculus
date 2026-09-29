# Q86b brief check

Findings: 18

1. Cases, line 35 (the taller box). The expected top offset is wrong. For a 600 by 1000 box: scale = min(600/1000, 1000/680) = 0.6, the picture is 408 high, and its top is at (1000 - 408) / 2 = 296, not 160. Evidence: `python3` over the brief's own formula gives `m(0,296,0,0,600,1000) -> (0.0, 0.0)` and `m(0,160,...) -> (0.0, -226.67)`. Correction: "(0, 296 + top) maps to (0, 0)". The box should also be placed at left 0 so that x = 0 holds.

2. Cases, lines 28, 30, 31, 32, 33, and premises lines 11-12. The 44-node graph the cases run on is not defined anywhere the builder can read. `line::a`, `project::p0`, "14 movers" and "neato's 10.3 px pair" all depend on it. `tests/state/boards/structure/layout.test.ts:44-64` (GRAPH) has 8 nodes and no `project::p0`. `grep -rl "project::p0"` outside node_modules finds only `.scratch` files. Those files describe two different 44-node graphs: `Q86-report.md:79,86` has 59 edges and 12 movers for `line::a`, and `Q86-refuter.md:74` has 62 edges and 14 movers. Correction: write the fixture into the brief exactly (node ids, kinds, radii or degrees, edges), say which test file it lives in and that it is placed with `createGraphviz().ready()` in a `beforeAll`, and give the drag's axis and units (x, graph units). A fixture helper copied from `layout.test.ts`'s `node()` and `edge()` would be a jscpd clone. `tests/checks/tree/allow-duplication.txt` is not in the paths, so the brief should say to import or share the helpers rather than copy them.

3. Cases, line 30 (0 pairs under the gap limit). This asserts more than the probe measured. `plan.md:259` records only that the drags leave "no two circles overlapping". Nobody checked `min(ra + rb + 4, apart)`. The push also puts a pair exactly at the limit, so the distance measured afterwards can be the limit minus a rounding error. A mover pushed off one node can also land inside another node's limit later in the same frame. Correction: give the case a stated tolerance (for example `REST`, 0.01 px), and note that the no-overlap result is the probed one and the gap-limit result is not.

4. What to build item 1 (the push) against case line 41 (coincident nodes). The two contradict each other. Two nodes coincident at the press have `apart` = 0, so their limit is `min(ra + rb + 4, 0)` = 0 and `distance < 0` never holds. They are never pushed, so "separated along x" cannot happen for them. Correction: specify the case as two nodes apart at the press that become coincident during the drag (the hold taken from other positions), expecting separation along x with finite positions. Add a second case for nodes coincident at the press: nothing moves and no NaN appears.

5. What to build items 1 and 2 (the clamp order and the page loop). The tick runs "the bounds clamp, then the push", so the push can leave a mover outside `[pad, width - pad]`. The next frame clamps it back and the two can alternate. A mover squeezed between two fixed nodes closer together than its two limits can also be pushed back and forth indefinitely. `settle` stops at 2000 frames, but item 2's `step()` asks for the next frame "while moved >= REST" with no frame cap, so the page would run `requestAnimationFrame` forever. Correction: clamp after the push, and have the page loop stop at the same named frame cap as `settle`.

6. What to build item 1 (`settle`) against case line 33. `settle` "returns the nodes", but the case asserts "comes to rest in fewer than 2000 frames", and the frame count is not observable from the return value. Correction: `settle` returns `{ nodes, frames }`, or the case counts `dragTick` calls itself and the brief says so.

7. Cases, lines 34 and 36. Neither is a unit case as written. Line 34 (a press during a running settle) is `nodeDown` behaviour in `Graph.svelte`. Line 36 asserts over `local`, which item 3 keeps in `Graph.svelte`. The unit suite renders to a string, and spec.md says "A behaviour that needs a DOM (a press ...) is seen at the look". Correction: put the pan and zoom undo into `pointer.ts` as a second pure function, so case 36 is a test. For case 34, either give it a pure helper in `graph.ts` or name it a look item.

8. What to build item 5 (`allow-audits.txt` "for every renamed case title"). This conflicts with the audit check. `tests/checks/tree/audits.test.ts:204` skips a case only when `one.name.startsWith('audits')`. The list's header (`allow-audits.txt` lines 6-7) says "nothing is added, since a new case of that shape carries the word in its own name". Every new or renamed case in `map-labels.test.ts` and every case of the new `tests/views/structure/map-pointer.test.ts` draws nothing. Each must therefore be named "audits ...", and a renamed case's old entry removed. Correction: say exactly that. Add no entry to the list.

9. Premise line 13, item 4 ("A label of no width (not measured) overlaps nothing, as today") and case line 39. The premise is wrong. `labelBox(node, UNMEASURED)` is a point. `overlaps()` at `labels.ts:48-50` counts a point strictly inside a measured label box as overlapping: `python3` over the predicate gives `point inside measured box overlaps: True True`. The existing test (`map-labels.test.ts:61-64`) covers only a point on a box's edge. Under item 4's node rule, a point inside another node's circle or square would also count. Correction: state the rule explicitly (a box of zero width overlaps nothing, checked first). Extend case 39 to a point strictly inside a measured label and one inside another node's circle.

10. What to build item 3 and Cases (the pointer mapping in a hidden pane). Today `Graph.svelte:170-171,178-179` guards with `Math.max(1, rect.width)`. Item 3's `scale = min(rect.width / WIDTH, rect.height / HEIGHT)` is 0 for a pane at no size (a hidden tab), so the division gives Infinity or NaN in pan and zoom. Correction: keep a guard and add the case "a box of no size".

11. Paths this step writes, lines 51 and 58. `layout.ts` lines 95-100 and `tests/views/structure/map.test.ts` are listed, but no item of "What to build" changes them. `layout.ts:96-99` stays true under the new tick. `map.test.ts:367` is to be kept, according to case line 42. Correction: drop both paths, or state the change each one gets. Item 5 is also narrower than the work: every `physics` and `dragTick` call in `graph.test.ts` changes signature (lines 299, 312, 324, 350, 358, 370, 372 and 383). The path covers the whole file, so this is wording only.

12. Decision 2 against the step text. `plan.md:257` says Q86b "keeps a label off every circle", and the look's findings (`plan.md:257-258`) name labels crossing "circles and edges". Decision 2 lets pillar labels sit over circles and does not check edges at all. It is disclosed, but it is a user-visible choice that departs from the step line. Correction: raise it, or amend the plan line before dispatch.

13. Cases, line 31 (the close pair is not pushed apart). As written, this case cannot fail: both nodes of the pair are non-movers, and the tick never moves a non-mover. Correction: name the pair in the fixture, and assert that a press, or a drag, of a node whose movers include one of the pair does not push them apart.

14. Cases, line 32 (the creep ends). The probe's figures (`plan.md:259`: `line::a` 200 px: 138.20, 138.20, 138.53) show the third reheat moving 0.33 px after the second moved nothing. A bound of 0.5 px per reheat over two reheats does not show that the movement stops. Correction: assert over more reheats (for example five), with a cumulative bound, or have the builder report the per-reheat moves.

15. Premise line 7 (line numbers). The `physics` docstring is at 413-421, not 412-420. `physics` ends at 501, `holdFor` at 526, `dragTick` at 536 and `edgeLengths` at 549. Correction: fix the numbers.

16. Conventions. The ASCII gate is given as `LC_ALL=C grep -rna '[^ -~]' src tests`. spec.md's last section says the perl form over `src tests bin config` replaces the `grep '[^ -~]'` form wherever a brief or a check names it. Correction: quote the perl form.

17. Decision 1. LA10's trial is "neato or fdp" (`plan.md:254`, `library-audit.md:128`), but the decision addresses only `d3-force`. Its evidence is also the orchestrator's look, which `plan.md:255` records as cut short and `plan.md:258` as finished later. Correction: add one clause on fdp, and cite `plan.md:258`.

18. Cases: inputs the code implies that the list misses: an empty node set (`settle` of `[]`); a collaborator's label as the subject of the node rule; a pillar label next to a square node; the wheel-zoom anchor and the pan in a letterboxed pane (`Graph.svelte` `wheel` and `backgroundDown`), as look items; and the measuring-effect audit at `map.test.ts:501`, whose regex takes the first `$effect(() => {` block of `Graph.svelte`, so a new `$effect` added above it would break it.

Checked and holds: the premises' content on `graph.ts`, the callers, `Graph.svelte`'s functions, the pointer formula and the TEST observations, the sum of alpha (46.25), `labels.ts`, the test line numbers, `DESIGN.md:291` and `HELP.md:103`, case 35's other numbers, case 42's grep hits, the folder counts, the verify commands, the brief's ASCII and prose, and Decisions 3 to 5 against the rulings. `Graph.svelte:84` holds a `DragHold` literal that item 2 must extend with `apart`.

Usage: 50 tool uses, 182k tokens, 8 min (from the completion notice).

# Closed

Each finding is closed in the brief as rewritten before the preparation commit:
1. The taller box: 600 by 1000 at (0, 0), (0, 296) maps to (0, 0).
2. The fixture is written into the brief, in a new shared test module the two test files import.
3. The gap-limit case carries a tolerance of 0.01 px; the probed result is named.
4. Coincident at the press: nothing moves, no NaN; coincident during the drag: separated along x.
5. The clamp runs after the push; the page loop stops at `MAX_FRAMES` too.
6. `settle` returns `{ nodes, frames }`.
7. `local` is a pure function in `pointer.ts`; the press during a settle goes through a pure `pressHold` in `graph.ts`.
8. New and renamed cases of `map-labels.test.ts` and `map-pointer.test.ts` are named "audits ..."; a renamed case's old entry leaves `allow-audits.txt`; nothing is added.
9. The zero-width rule is stated and checked first; case extended.
10. A box of no size answers the point at the origin of the box, no NaN; case added.
11. `layout.ts` and `map.test.ts` dropped from the paths; the `graph.test.ts` call sites named.
12. Decision 2 follows the step line: every label, a pillar's included, is kept off every node but its own; edges are not checked, as the step line names circles only.
13. The close pair is named in the fixture and a mover of the pair is asserted not pushed.
14. Five reheats, cumulative bound, per-reheat moves reported.
15. Line numbers corrected.
16. The perl ASCII gate quoted.
17. fdp named, `plan.md:258` cited.
18. The missing inputs added as cases or look items; the measuring-effect regex warned.
