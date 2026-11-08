# O170, round 0: the ruling on item 6's candidates

Ruled by the orchestrator from the builder's first run (`agents/reviews/O170-report.md`, "The case the brief's rules get wrong"). The fix stays inside item 6 and changes no public shape or established decision. Option (a) of the report is taken. Option (b) would move the figures of slides the step line does not name, so it is the worse option; neither option is the lazy one.

The first bullet of item 6 now reads, word for word:

   - the candidates: `side` as `placeOf` places it, when every figure's box is at least its `least`; with text, and only when `side` as `placeOf` places it misses a `least`, `side` forced under the text (`wide`), when it has room of its own and every box is at least its `least`; and `stacked`, which has no neighbour beside it and takes no `least`;

The rest of item 6 stands. A figure with no `least` meets it, so a slide with no caption or explanation has no forced candidate and chooses between `side` as `placeOf` places it and `stacked` as it does on the unchanged tree. `slide-layout.ts`'s head comment states the rule as this bullet gives it.

The cases stand as written under this bullet. Two are added, each proved by the quoted Node run of the module that proves C9 to C13, and the row C12 of the first run is the unchanged tree's answer to both:

- C27. `layOut` with the inputs of C12 and no `least`: `side`, `shape` `tall`, each box 0.3492 wide, the unchanged tree's answer.
- C28. `layOut` with the inputs of C12 and each `least` 0.3: `side`, `shape` `tall`, each box 0.3492 wide, the unchanged tree's answer.

On the builder's other points:

- C4: the reading in the first run is accepted. "A search never asks it" is the case of a listing that answered. After a failed listing, item 3 applies, and the route answers `no-key` without asking the outside source.
- C24: the brief has no such case, and the report needs no row for it.

The final report carries this ruling, with the cases' results under it, and the first run as it was handed back.
