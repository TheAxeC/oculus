# D15, round 0: the cases ruling

The builder's first run found two places where the brief's rules give a wrong result, and three smaller points. Each is ruled here; the brief stands where this file does not change it.

1. Case 21, two pages writing the per-file list. Ruled (a): the ui store gains `updateInstanceState(id, change)`, which reads the record as saved in storage at the moment of the write, applies `change` to it, keeps it in memory and saves it; `File.svelte` writes the `pdf-place` list through it. `src/lib/state/workbench/ui.svelte.ts` is in the paths whole for this function and its `UiStore` type member, besides lines 1-4 and 105. No guarded entry covers the ui store, so no test is added; the report quotes the code and says that two processes writing in the same instant can still race, since storage has no lock. Option (b), the interval stated as a limit, was the lazy option.
2. Cases 11, 23 and a closed tab: the dispose flush writing after the clear. Ruled as the builder proposes: the hook is bound in `mount` to the tab id and the file the viewer was mounted for, and writes the tab record only while the layout still holds that tab and `drawn` still names that file; the per-file record is written regardless. The tab record still names no file.
3. The smaller points:
   - A null PDF.js `_location` reports nothing, and `open` keeps no position from it.
   - `readPdfPlace` reads a number zoom outside PDF.js's bounds, 0.1 to 25, as `auto`, as an unknown value is.
   - Case 4: a change of page, zoom, scroll mode, spread mode or side panel is reported at once, unthrottled; only the offset within a page while scrolling is throttled at 500 ms. A Copy into New Window then carries every discrete change, and the report states that the offset within the page can be up to 500 ms old in the copy, since `float/store.ts` cannot ask the viewer to flush.
