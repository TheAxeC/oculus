# O122, repair round 1

The review is `.scratch/migration/agents/reviews/O122-refuter.md` in the main ledger; its findings are quoted here by name. The brief and `O122-cases.md` still govern. Close each item below, and nothing else.

1. **B1, a fragment link pulled back.** `hold`'s `take` when no anchor stands undoes `place.clear()` during `showRow`. While a jump to a row is under way no anchor is taken and `hold` writes nothing. Once `scrollToFragment` has written `scrollTop`, the anchor is taken at the new place, before `sync` moves the window. The result: the column ends at the heading, the target row drawn, and a later measure holds the words there. Run this sequence as a case-run program over the real `turnWindow` and `readerPlace` and quote its lines: reader at 5000, target row 300 not drawn, then the flush, then the scroll event.

2. **B2, rows drawn before the column is found.** Every row drawn before `scroller` is set is measured and observed once it is set, as `VirtualRows.svelte:241` gets by swapping `idle` for `measureAt`. Run the probe's case and quote it: the observer watches the rows held at mount.

3. **B3, a window that loses focus.** A `focusout` with no `relatedTarget` while `document.hasFocus()` is false keeps `focused`, so the row stays drawn across an app switch.

4. **T1.** The comment at `virtual.ts:71-75` says what is true for both users of `firstWindow`.

5. **The report.** Add to `O122-report.md`: the grep of added comment lines and test titles for history words, each hit judged (`spec.md:44`); the grep of each changed name, `runKey`, `runOpen` and `TurnRun`'s props among them (`spec.md:72`); each touched comment and doc paragraph as still true or rewritten (`spec.md:72`); what the code does for each new key when empty, duplicated or colliding, and for each async path in flight, after close and superseded, `showRow`, `moveFocus` and each `tick().then` among them (`spec.md:73`). Add the B4 row to "Host- and user-visible changes": Tab from outside reaches the first drawn stop and Shift+Tab the last drawn one, with the before. Correct P2: a run that measures with no scroll event just before it, showing a measured height dropped. Correct P3: run `npx vitest run tests/ui/tree/list/virtual-rows.client.test.ts`, quote it and say `test:quick` did not reach it. Item 9's row quotes item 1's run.

No change to the code beyond items 1 to 4. T2 takes no action. Rerun the brief's checks once after the last change, and update the report at its path.
