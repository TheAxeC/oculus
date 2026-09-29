# Q86b, the cases ruled at the first run

The builder's first run, with item 1 built to the brief's letter, found two cases the brief's rules get wrong. Both fixes stay inside the step: they change two constants of the drag tick and one rule of it, nothing a reader sees but the drag coming to rest.

1. The push holds the gap limit. One push pass per frame lets a later pair push a node back into one it was just pushed off, and the pairs rest up to 0.70 units inside their limit (`project::p0` and `project::p36` at 19.63 against 19.99 after a 60 unit drag of `line::a`). Ruling: the push runs up to `PUSH_PASSES` (10, a named constant) passes per frame, the bounds clamp inside each pass, and it stops early at a pass that pushes nothing. The builder's probe over 15 drags (`line::a` to `line::d` and `project::p0`, each at 60, 200 and -200 units): the largest shortfall 0.0001. The case stands as written.

2. The drag comes to rest. At damping 0.88 and step 0.4 a spring is underdamped, a frame at the far end of a swing moves under `REST`, and `settle` stops mid-swing: a lone spring stops at 462.44 against its length 460, and on drags the cases did not hold the creep survives (`line::b` -200 moves 4.73 units on a second settle, `line::c` 200 reaches the frame cap and moves 8.25 units on a second). Ruling: `DEFAULT_PHYSICS.damping` is 0.6. The builder's probe with 10 passes: no drag of the 15 reaches the cap, the largest move of a second settle is under 0.01, the most frames 1127, and a lone spring stops at 460.37. The rest rule `moved < REST` stands.

3. The cases gain the probe's drags: "the creep ends" and "`settle` stops" run over the 15 drags above, not over `line::a` alone, each asserting that no settle reaches `MAX_FRAMES` and that a second settle moves no node more than 0.01; the case of a neighbour pulled to its recorded length runs through `settle` and expects the length within 0.5.

4. `pressHold` keeps the speeds the finished settle leaves, as built; the case of a press during a running settle passes with them kept.

The report's first-run section carries this ruling, and DESIGN.md's drag sentence names the passes and the damping.
