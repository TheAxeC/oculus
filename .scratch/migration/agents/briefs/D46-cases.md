# D46, the cases ruling (round 0)

The builder's first run handed back case 9 ("What to build" 3, last bullet). The orchestrator checked the hand-back against the tree: `tests/checks/imports/order.ts:59-70` places `state/sources` below `state/workbench` and `state/sessions`; `documentState` is at `state/workbench/layout/instance.ts:91` and `sourceTabState` at `state/sessions/source/draft.ts:235`; `draft.ts` imports only `state/sources`, `state/shared` and `data` (`grep -n "^import" draft.ts`), so `layout/instance.ts` importing it makes no cycle; `state/workbench` and `state/workbench/layout` hold 10 items each (`ls | wc -l`).

1. Case 9: option A. `tabForKind` moves into `src/lib/state/workbench/layout/instance.ts` beside `documentState`, exported through `layout/index.ts`. `views/shared/explorer/opening.ts`, `read-again.ts`, `tests/views/shared/explorer/opening.client.test.ts` and `opening-apps.test.ts` import it from there. The call that reads a path's kind and opens its tab goes on the `paletteSource` store (`state/workbench/palette-source.svelte.ts`): its `PaletteActions` gain `readFileKind` and `holds`, handed in by `state/client/context.ts` where `createPaletteSource` is built (line 575). `state/sources/explorer/file-type.ts` and `state/sources/explorer/ops.svelte.ts` leave the write list. Option C (a new place for `state/sources` in `order.ts`, or an exemption) is the lazy option and is refused: it loosens a check. Option B passes two builders through five call sites for no gain.

2. The paths the builder named are added to the write list: `src/lib/state/workbench/layout/instance.ts`, `src/lib/state/workbench/layout/index.ts`, `src/lib/state/workbench/palette-source.svelte.ts`, the two test files of item 1, `tests/data/sources/config/settings.test.ts` (the values table and the wrong-value cases for `search.max_names`), `tests/data/sources/config/wrong-settings.ts`, `tests/checks/config/config.test.ts` (only where it lists the `search` keys), and `docs/files-and-search.md` (the names request and `search.max_names`, in the section that holds `search.max_hits`).

3. Case 18's `.agents/plan.yaml` clause runs on a synthetic root under `$TMPDIR` holding `.agents/plan.yaml`, `.scratch/x.md`, a `.gitignore` and a `secrets/` folder, since the worktree's sparse checkout holds none of them; the report quotes that run and says why it ran there.

4. Ctrl+Shift+P off macOS stays in `gridKeys` as the brief says.

5. The 50 ms bound of "What to build" (brief line 73) is a requirement, for every keystroke: one word, several words, and the first query after the names arrive. The snapshots are prepared when the names answer arrives, never on the first keystroke. The two-snapshot form and narrowing from the previous query's matches are both inside the brief. A final probe that still misses 50 ms is handed back before the report with the query, the figure and what was tried, for a ruling; it is never written into the report as a limit.

## The second hand-back: the 50 ms bound over several words (Z754)

The builder's probe (`$TMPDIR/d46/fileperf2.probe.test.ts`, 100,000 names, load average 17) matched every one-word keystroke under 50 ms and missed it at the keystroke that starts a second word when the first word matches tens of thousands of names ("oculus p" 116 ms, "palette r" 58 ms), because fuzzysort scores every row the first word kept again for each keystroke of the next word.

6. Option B. The file mode's matching runs in a Web Worker, so no keystroke blocks typing or drawing, and the matching keeps fuzzysort's rule for several words as it is.
   - The worker is a module of its own built with Vite's `?worker` import, as `src/lib/ui/controls/editor/kit/workers.ts` builds Monaco's.
   - It receives the names answer once, when the answer arrives, and prepares the two snapshots there; the page thread prepares nothing.
   - Each keystroke posts the query with a number. The worker answers with that number and the rows (at most 200, the same `FileMatch` shape `fileList(...).matches` gives today). The page draws only the answer to the newest query and drops every older one.
   - While the newest query has no answer, the rows of the last answer stay on screen. Nothing new is drawn for the waiting state.
   - The worker is ended when the palette's file mode closes or a new names answer replaces it.
   - `fileList` keeps a synchronous form for the worker's own use and for the unit runs; the palette reaches it only through the worker.
   - The bound of brief line 73 now reads: over 100,000 names, a keystroke takes under 50 ms of the page's main thread. The match runs in the worker, and its rows are drawn on the first frame after the worker answers.
   - The probe quotes, for each keystroke of the queries it ran before ("rpls", "plan", "oculus plan", "palette rows", "oculus plan md", "raw pls", "src lib", "tools oculus migration", "src lib shell keys palette"):
     - the page thread's time, which must be under 50 ms;
     - the worker's matching time, quoted as measured, with the load average.
   - A unit run of the client store shows that an older answer arriving after a newer one is dropped.
   - The paths widen to the worker module (beside `palette.ts` in `src/lib/state/workbench/` only if that folder has room, else in `src/lib/state/workbench/palette/` or another folder with room), the store or component that holds the file mode's rows (`src/lib/shell/keys/rows/FileRows.svelte`, `src/lib/shell/keys/Palette.svelte` within its 520 lines), and `tests/routes/files/search.test.ts` (the `maxNames` and `hub` fields the route's options now need), which the builder already edited.
   - Not chosen:
     - A, the stock figures accepted as a ruling, is the lazy option: it keeps a requirement unmet.
     - C, the rarest word matched first, returns wrong rows when two words both match many names.
     - D, a new meaning for a query of several words, changes what a user's query finds.

## The F1 key and the history check (open item 28, ruled (a) by Axel)

`F1` is removed from `FAMILIES` in `tests/checks/source/history.test.ts` (line 41 at the base), so a comment or document line that names the F1 key passes the check; the file is added to the paths this step writes. The comments and documents keep naming the key as the brief requires (HELP's key row, `docs/window.md`, `editor-status.svelte.ts`). Quote `npx vitest run tests/checks/source/history.test.ts` passing after the change, and its failure on the step's tree before this change, with the lines it named. Then finish the step to its report.
