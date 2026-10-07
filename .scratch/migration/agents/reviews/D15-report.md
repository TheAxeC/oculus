# D15 report: the place a PDF is read at, kept across reloads, windows and reopening

Everything in the brief is done, with the ruling of `agents/briefs/D15-cases.md` applied. Two things are stated, not hidden: the browser cases (1 to 8, 11 to 18, 20 to 23) are proven by reading the code path and wait for the orchestrator's look on TEST at landing, since there is no browser suite; and one run of `tests/checks/tree` printed 1 failed of 39 while other suites ran on the machine, a failure I did not identify (three reruns of the same command printed 39 passed).

## Open items (state file, "Open items" section, verbatim)

"## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)"

"An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own."

The section holds no entries after those two lines; the next section is "Booked, no ruling needed".

## The ruling carried (`agents/briefs/D15-cases.md`)

1. Case 21, ruled (a): the ui store has `updateInstanceState(id, change)`, and `File.svelte` writes the `pdf-place` list through it. Code, `src/lib/state/workbench/ui.svelte.ts:624-637`:

```ts
function updateInstanceState(id: string, change: (held: unknown) => unknown): void {
    const saved = backing === null ? null : savedHeld(backing);
    const held =
        saved !== null && id in saved.instances ? saved.instances[id] : instanceState(id);
    synced = Object.fromEntries(Object.entries(synced).filter(([key]) => key !== id));
    setInstanceState(id, change(held));
}
```

It reads the record as the storage holds it at the write, applies `change`, keeps the result in memory and saves it through `setInstanceState`. Dropping the id from `synced` makes `mergedInstances` treat the record as this tab's own change, so the saved record is replaced by the changed one. Two processes that write in the same instant can still race, since the storage has no lock: each reads, changes and writes, and the later write replaces the earlier. No test was added (no guarded entry covers the ui store); the scratch run below exercises the function.

2. Cases 11, 23 and a closed tab: the hook is bound in `mount` to the tab id and the file the viewer was mounted for (`File.svelte:286-291`), and `keepPlace` (`File.svelte:272-278`) writes the per-file entry always and the tab record only while `holding(tab) !== null` and `drawn` still names that file. The tab record names no file.

3. The smaller points:
   - A null PDF.js `_location` reports nothing: `#position()` returns null (`viewer.svelte.ts`, `#position`), `#place()` returns null, `#send(null)` sends nothing, and `open` keeps no position from it.
   - `readPdfPlace` reads a number zoom outside 0.1 to 25 as `auto`.
   - Case 4: a change of page by a jump, zoom, scroll mode, spread mode or side panel is reported once PDF.js has settled, not throttled; only the offset while the reader scrolls is throttled at 500 ms. A Copy into New Window can carry an offset within the page up to 500 ms old, since `float/store.ts` cannot ask the viewer to flush. See "Judgment calls" for how a discrete change is timed.

## First run of every case on the unchanged tree (taken before any change)

The tree was unchanged against the base copy when these were taken (`diff -rq` printed nothing). Browser cases are readings of the code path; no server was started.

1. Fails. A reload makes a new `PdfViewer`; `open` (`viewer.svelte.ts:216-217`) keeps a place only when `key === #key && #doc !== null`, and the first call has `#key === ''`. Page 1, `auto`, vertical, no spread, no panel. `grep -n "setInstanceState\|instanceState" File.svelte` printed nothing, so nothing was saved.
2. Fails. Same reason; no per-file record existed.
3. Fails. Nothing saved, so the window's viewer opens at page 1.
4. Fails. `float/store.ts:108-111` copies the tab's ui record, which held no place.
5. PDF tab fails. FrameLayer sets `display: none` (`FrameLayer.svelte:81`) and `block` (:89) on the frame root, the scroll offset resets, and no code restored it (the orchestrator's look: 394 to 10). The document-tab part is not in this step's code and is left to the landing look.
6. Holds. `open` :217 keeps page, `_location` left and top and `currentScaleValue` in `#restore` (:430), applied by `#initialised` (:498-511).
7. Fails. With `#doc` null `keep` is null (:217), so the later build opens at page 1. Nothing was written, so nothing could be overwritten.
8. Fails with an error. A rebuilt shorter PDF with the old page passes `#scrollTo(keep)` a page beyond the count; PDF.js logs `scrollPageIntoView: "N" is not a valid pageNumber parameter` (`pdf_viewer.mjs:9022`) and does not scroll.
9. Not runnable: `grep -rn "pdf-place\|readPdfPlace\|withPdfPlace" src tests docs DESIGN.md` printed nothing, and the scratch file failed on import: `Error: Cannot find module '../../../../src/lib/state/sources/explorer/pdf-place.ts'`. A zoom of "banana" given to PDF.js logs `#setScale: "banana" is an unknown zoom value` (`pdf_viewer.mjs:8987`).
10. Not runnable, as 9.
11. Holds. The retarget clears the record (`opening.ts:168`, `:254`) and the new key draws a new box at the top. Under the brief's rules alone it failed whenever a report was pending (ruling 2 above).
12. Fails. Both tabs reopen at page 1.
13. Fails. A hidden tab draws no address (`File.svelte` gate, :133) and writes nothing, but no record existed to open at.
14. Holds, since nothing was written.
15. Holds. `#reveal` is drawn by `#settle` at the end of `#initialised` (:510) and no saved place competed with it.
16. Not countable; no reports existed.
17. Holds. Nothing read `pdf` or `pdf-place`.
18. Holds. `File.svelte` wrote no record.
19. Not runnable, as 9.
20. Fails. No per-file record existed.
21. Not applicable (no record); under the brief's rule it failed in the interval before a `storage` event (ruling 1 above).
22. Not applicable (no write); `save` catches the `setItem` throw (`ui.svelte.ts` `save`, the `catch` after `backing.setItem`), so it holds with writes.
23. Fails. Rename calls `layout.restateInstance` (`ops.svelte.ts`, `followTabs`), the key changes, a new box opens at page 1 and the place is lost.
24. Not runnable, as 9.
25. Not runnable, as 9.

## The cases on the changed tree

Cases 9, 10, 19, 24, 25 and 21 ran in the scratch file (run below). The others are readings of the changed code; each names where. All of them are looked at by the orchestrator on TEST at landing.

1. `File.svelte:312-316` calls `viewer.open(src, key, untrack(() => savedPlace()))`; `savedPlace` (:262-270) reads the tab's record first. `#initialised` (`viewer.svelte.ts`) sets `scroll`, `spread`, the zoom (`keep?.scaleValue`), the side panel (`#setSide(keep.sidebar)`) and lands the place (`#land(keep)`, then `#scrollTo`). The viewer reports place changes through `placed` (`File.svelte:290`), and the tab record is written by `keepPlace` (:277).
2. A closed tab's record is cleared (`instances.ts:234`); `keepPlace` wrote the per-file entry at each report (:273-275), and `savedPlace` falls back to it (:265-269) for the new tab.
3. The viewer's dispose flush (`viewer.svelte.ts`, `dispose` calls `#flush()` first) and the hide flush (`#resized`) send a pending report at once; the tab is still held by the layout, so the tab record is written (`keepPlace` :276). The window's page reads it through its ui store at load.
4. `copyTabToWindow` copies the tab's ui record (`float/store.ts:108-111`), which holds `pdf`. Each copy then writes its own record, bound to its own tab id. The offset within the page in the copy can be up to 500 ms old.
5. `#resized` (`viewer.svelte.ts`) takes the place when the box loses its size (`#away = #place()`) and scrolls back to it when the box has a size again (`#scrollTo(place)`). FrameLayer's `display: none` and `block` (`FrameLayer.svelte:81`, `:89`) change the box's size, which a `ResizeObserver` on the box reports. A document tab's frame is not in this step's code.
6. `open` with the same key and a document held keeps `#away ?? #place()` (or `#restore` while the new document is still being laid out).
7. A first load that fails leaves `#restore` unset (`#load` sets it only after the document is read) and `#applied` false, so nothing is reported; the later `open` with a document absent opens at `saved`, which `File.svelte` re-reads (untracked) from the unchanged records. A report needs `#applied`, which `#initialised` sets after `#land(keep)`.
8. `#scrollTo` clamps: a page beyond `viewer.pagesCount` sets `currentPageNumber` to the last page and returns, so PDF.js logs no error.
11. `File.svelte:276`: a viewer mounted for a.pdf, torn down after `drawn` moved to b.pdf, writes only a.pdf's per-file entry. `opening.ts:168`/`:254` clears the tab record, and `savedPlace` for b.pdf falls to b.pdf's own entry or none.
12. Two tabs have two ids, so two tab records (`savedPlace` :263); the per-file entry is the fallback only.
13. A hidden tab draws no address and so mounts no viewer. A mounted viewer whose box loses its size reports nothing (`#changed` returns while `!#hasSize()`), flushing once at the hide edge.
14. `#sendable()` needs `status === 'ready'` and `#applied`; a missing, invalid or unreadable file sets neither, and `#flush` before `#shown('missing')` sends the last good place first.
15. `#initialised`: `if (keep !== null && this.#reveal === null) this.#land(keep)`, and `#settle()` draws the reveal last.
16. `#changed(false)` sets one timer at `max(0, 500 - since last send)`, so a scroll sends at most once in 500 ms, and a page change within 200 ms of a scroll event (`SCROLLING_MS`) is held to the same throttle. Counted by the orchestrator at landing. Each report calls `updateInstanceState` once and `setInstanceState` once.
17. `savedPlace` reads `readTabPlace(undefined)` (null) and `readPdfPlaces(undefined)` (the empty list); no other view's record is read or written.
18. `keepPlace` runs only from a viewer's `placed`, and a viewer exists only for a PDF (`frame` is null otherwise, `File.svelte`).
20. `withPdfPlace` and `savedPlace` match on root and path both.
21. The scratch run below (`updateInstanceState` with a second store that had heard no `storage` event).
22. `save` catches a refused `setItem`; `updateInstanceState` calls `setInstanceState`, which calls `save`.
23. A rename restates the instance (`ops.svelte.ts` `followTabs`, `layout.restateInstance`), keeps its id and its tab record; the new box's viewer opens at the tab record. The old viewer's flush sees `drawn` on the new path and writes only the old path's entry.

## The scratch test (written, run, quoted, deleted)

File: `tests/state/sources/explorer/pdf-place.scratch.test.ts`, imports `pdf-place.ts` (and, for case 21, `createUi` from `ui.svelte.ts` with a two-method storage object). Run: `npx vitest run tests/state/sources/explorer/pdf-place.scratch.test.ts --project unit --reporter=verbose`, exit 0. Its output (the file path column trimmed):

```
  ok case 9, a saved zoom that is no zoom > reads "banana" as auto
  ok ... reads "-2", "NaN", "", "0", "Infinity", "1e999", "0x10", " 2", "30", "0.05", "1e9" as auto
  ok case 9 > reads a number type as auto and keeps the presets and a positive number
  ok case 9 > reads an unknown mode or panel as its default
  ok case 10 > reads a string, an array, null, undefined, page NaN, page 0, page 2.5, left NaN, top Infinity as null
  ok case 10 > reads a whole place back as it was written
  ok case 19, a 51st PDF read > keeps 50 entries and drops the oldest
  ok case 24 > reads a value that is not an array as the empty list
  ok case 24 > drops bad entries and keeps the first of a root and path
  ok case 24 > keeps 50 of 60
  ok case 25 > moves its entry to the front and holds it once
  ok case 25 > keeps a path of another root as its own entry
  ok case 21, two pages writing the per-file list > keeps the entry a page wrote before the other heard its storage event 661ms

 Test Files  1 passed (1)
      Tests  31 passed (31)
```

Before the module existed the file failed on import (first run, case 9). The file and the folder `tests/state/sources/explorer` are deleted: `ls tests/state/sources` prints `repositories`. The step adds and changes no test, and edits no existing assertion, allow list or predicate.

## Lines that read and write the records (cases 2, 11, 17, 20, 21)

`src/lib/views/sources/file/File.svelte`:

```ts
262    function savedPlace(): PdfPlace | null {
263        const own = readTabPlace(instanceState(instance.id));
264        if (own !== null) return own;
265        const entry = readPdfPlaces(instanceState(PDF_PLACES_ID)).find(
266            (one) => one.root === drawn.root && one.path === drawn.path
267        );
268        return entry?.place ?? null;
269    }
272    function keepPlace(tab: string, file: { root: string; path: string }, place: PdfPlace): void {
273        updateInstanceState(PDF_PLACES_ID, (held) =>
274            withPdfPlace(readPdfPlaces(held), file.root, file.path, place)
275        );
276        if (holding(tab) === null || drawn.root !== file.root || drawn.path !== file.path) return;
277        setInstanceState(tab, withTabPlace(instanceState(tab), place));
278    }
290            placed: (place) => keepPlace(tab, file, place),
312        viewer.open(src, key, untrack(() => savedPlace()));   (written over four lines by prettier)
```

## DONE / NOT DONE

| Item | Command | Result |
|---|---|---|
| Item 1, types and reader | `src/lib/state/sources/explorer/pdf-place.ts` (129 lines); scratch run above | DONE, 31 passed |
| Item 2, `placed` hook | `viewer.svelte.ts` (`#changed`, `#send`, `#flush`, `#resized`) | DONE, behaviour at landing look |
| Item 3, saved place to `open` | `viewer.svelte.ts` `open(url, key, saved)` | DONE |
| Item 4, place kept while hidden | `viewer.svelte.ts` `#resized`, `#land`, `#away` | DONE, behaviour at landing look |
| Item 5, the two records | `File.svelte:262-278`, `:290`, `:312-316`; `ui.svelte.ts:631` | DONE |
| Item 6, documents | `docs/views.md:259`, `DESIGN.md:169` and `:533`, `ui.svelte.ts:1-6` and `:106-110` | DONE |
| Verify 1 | `npm run diagrams` (exit 0), then `sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md` | DONE, output below |
| Verify 3 | `wc -l`; `sh utils/folder-check.sh`; `sh utils/unused-exports.sh` | DONE, output below |
| Verify 4 | the `perl` ASCII gate over `src tests config` (`bin` does not exist in this tree) | DONE, printed nothing |
| Verify 6 | `grep -rn "pdf-place\|readPdfPlace\|withPdfPlace" src` | DONE, output below |
| Verify 7 | head comments quoted below | DONE |
| Verify 8 | sentences read against the standard | DONE, below |

Verify 1, last lines of the final run (exit 0):

```
$ npm run test:quick
test:quick: 14 changed file(s), from git since HEAD
test:quick: 15 test file(s), 10 essential
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.7 s)
ok      svelte-check (9.4 s): 1791377704931 COMPLETED 421 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (11.4 s)
ok      vitest (16.1 s): Duration  11.13s (transform 26.04s, setup 0ms, import 37.12s, tests 3.32s, environment 3ms)
test:quick: 17.3 s (limit 45.0 s); every command passed
checks: 1 commands passed
```

Verify 3:

```
     129 src/lib/state/sources/explorer/pdf-place.ts
     799 src/lib/views/sources/file/pdf/viewer.svelte.ts
     222 src/lib/views/sources/file/pdf/side-panel.ts
     306 src/lib/views/sources/file/pdf/Controls.svelte
     465 src/lib/views/sources/file/File.svelte
     716 src/lib/state/workbench/ui.svelte.ts
folder-check exit 0
unused-exports: diff against the base's unused-exports.txt prints nothing
```

Sources are under 880, `File.svelte` and `Controls.svelte` under 520. `ls src/lib/state/sources/explorer | wc -l` is now 9.

Also run after the last change: `npx vitest run tests/checks/tree --project unit --reporter=dot` printed `Tests  39 passed (39)` three times. One earlier run of the same command, taken while other suites ran, printed `1 failed | 38 passed`; I did not identify the failing test, and the three reruns were green.

Verify 6:

```
src/lib/state/workbench/ui.svelte.ts:6:// it has shown under `pdf-place` (state/sources/explorer/pdf-place.ts).
src/lib/state/sources/explorer/pdf-place.ts:19:export const PDF_PLACES_ID = 'pdf-place';
src/lib/views/sources/file/File.svelte:64:    // pdf-place.ts), written as the viewer reports it: ...
```

plus the import and call lines of `readPdfPlace`, `readPdfPlaces` and `withPdfPlace` in `File.svelte` (the id `PDF_PLACES_ID` is used only there), `pdf-place.ts` and `viewer.svelte.ts:52,616` (`readPdfPlace`, which the viewer uses to shape the place it reports). The record's id string is defined once, at `pdf-place.ts:19`; the two other hits of the text `pdf-place` are comments and import paths. Brief item 6 named `File.svelte` and `pdf-place.ts` only; `viewer.svelte.ts` also imports `readPdfPlace` (see Judgment calls).

Verify 7, head comments as they read now: `viewer.svelte.ts:9-30` is the paragraph quoted at the top of that file ("`open(url, key, saved)` loads a document ... since a hidden box loses its scroll offset."). `ui.svelte.ts:1-6`: "... one blob of state per view instance, keyed by the instance id the layout gives it. Two instances of the same view therefore remember different things. A view may also keep a record under a fixed id of its own that no instance has, as the file view keeps the places of the PDFs it has shown under `pdf-place` (state/sources/explorer/pdf-place.ts)." And `ui.svelte.ts:106-109`: "One entry per view instance, by instance id, and one for each fixed id a view keeps a record under. The shape of the value is the view's own."

Verify 8: the sentences in `docs/views.md:259` and `DESIGN.md:169`, `:533` each state one fact; the `DESIGN.md:533` sentence is long, as the line it extends is. Re-read of the other documents that describe the behaviour: `HELP.md` (`grep -n -i pdf HELP.md` lists only keys; what a user does is unchanged) still true; `docs/views.md:239` still true; `File.svelte` head comment rewritten (lines 62-70 added); `viewer.svelte.ts` head comment rewritten; `ui.svelte.ts` head comment extended and the save-merge paragraph still true; `side-panel.ts` and `Controls.svelte` head comments still true.

History-word grep over the lines added or changed in comments (`before`, `used to`, `no longer`, `still`, `always has`, `always had`, `as before`, `previously`, `the step adds`, `after this`): hits are `viewer.svelte.ts` "the old document still behind it" (original sentence, rewrapped), "Nothing is reported before the place a load restores is applied" and "A report still waiting" (state, not history), "waits before it is reported" (an order within the code), "A document still being laid out" (state); `File.svelte` "the layout still holds the tab", "the tab still shows that file" (a condition the code checks); `ui.svelte.ts` "can still overwrite one another" (states the limit). None compares with an earlier state. No comment names a package id or a date. Comment lines over 100 columns in the added code: none (awk check over the changed files; the one 148-column line at `ui.svelte.ts:645` is the existing eslint directive).

Grep after changing names (`SidePanelKind`, `ScrollName`, `SpreadName`) over `src config docs HELP.md DESIGN.md README.md tests`: the only importers are `viewer.svelte.ts`, `side-panel.ts`, `Controls.svelte` and `pdf-place.ts`, each from `pdf-place`.

## Files changed (`diff -rq` against the base copy, after the last change)

```
Only in src/lib/state/sources/explorer: pdf-place.ts
src/lib/state/workbench/ui.svelte.ts
src/lib/views/sources/file/File.svelte
src/lib/views/sources/file/pdf/Controls.svelte
src/lib/views/sources/file/pdf/side-panel.ts
src/lib/views/sources/file/pdf/viewer.svelte.ts
docs/diagrams/layer-state.dot  layer-state.svg  layer-views.dot  layer-views.svg  layers.dot  layers.svg
docs/views.md
DESIGN.md
```

Line counts are in Verify 3. Every path is in the brief's list; the diagram edits are what `npm run diagrams` rewrites (edge counts, e.g. `layers.dot` "views to state" 983 to its new count). `ui.svelte.ts` changed beyond lines 1-4 and 105 as ruling 1 allows: the head comment, the `instances` field comment (:106-109), the `UiStore` member `updateInstanceState` (:198) with its comment, the function (:624-637) and its entry in the returned object.

## Judgment calls the brief and the ruling left open (each reversible)

1. A change that is not a scroll (zoom, scroll mode, spread mode, side panel, a page jump) is sent 100 ms after the change (`SETTLE_MS`), not synchronously. At the event PDF.js has not yet updated its offset (`pagechanging` is dispatched before `_updateLocation`, `pdf_viewer.mjs:9174`; a jump's scroll is applied after the dispatch), so a report made at once would carry the previous offset. This is not a throttle: each such change is its own report.
2. Case 16 and the ruling meet at the page change a scroll causes: scrolling through pages would otherwise report once per page crossed, more than twice a second. A `pagechanging` that arrives within 200 ms of a scroll event (`SCROLLING_MS`) is held to the 500 ms throttle; one that does not (a page entry, Next, a link) is sent as a settled change.
3. `viewer.svelte.ts` imports `readPdfPlace` and builds the reported place through it, so a place the viewer reports is one the reader accepts (a NaN page or an out-of-bounds zoom is never sent).
4. `reload()` (Retry) opens at the last place the viewer reported, else the last `saved` it was handed, so a first load that failed and is retried opens at the saved place, not the top. Two private fields (`#sent`, `#saved`).
5. A report equal to the one before it is not sent (`#send` compares the two as JSON), so a scroll event that changed nothing writes nothing.
6. `open` with the same key while the new document is still being laid out keeps `#restore` (the place the load is about to apply), not the position of the reset view.
7. A page beyond the document's count opens (and `back` returns to) the top of the last page (`currentPageNumber = pagesCount`), not an offset from the old page.
8. The zoom factor must be plain decimal digits (`/^\d+(\.\d+)?$/`) inside 0.1 to 25; `"1e3"`, `"0x10"`, `" 2"` read as `auto`. The viewer writes factors in that form.
9. `updateInstanceState` drops the id from `synced` before saving (see ruling 1), so the changed record replaces the saved one even when this tab's copy already read the same.
10. The viewer reports nothing until `#applied`, a field set at the end of `#initialised`; a place restored while the box has no size is held in `#away` and scrolled to when the box has one.
11. `File.svelte` reads the saved place with `untrack`, so a report's write does not reopen the document.

## User-visible changes, before and after (the look on TEST at landing)

- A PDF tab reloaded: before, page 1 at the zoom `auto`, vertical scroll, no side panel; after, the page, the offset in it, the zoom, the scroll and spread modes and the side panel it was left at.
- A PDF opened from Files after its tab was closed (or in a new tab, window or Copy into New Window): before, page 1; after, the file's last place (the last 50 files), a copy at the original's place.
- Maximise pane then Restore panes on a PDF tab at page 4: before, the offset reset to the top of the first pages (394 to 10 on the orchestrator's look); after, page 4 at the same offset. A document tab's frame under Maximise is the orchestrator's look at landing; no code of this step touches it.
- A rebuilt PDF shorter than the page read: before, a PDF.js console error and the view not moving; after, the last page, no error.
- A forward search that opens a PDF with a saved place shows the search's place. Nothing else a reader sees changes: the controls, strings and keys are as they were, no catalog key was added.

## Things in the brief that were wrong or impossible, with the evidence

- Brief item 5 and case 21: "written over the list the store holds at the moment of the write" cannot keep an entry another page wrote before the `storage` event arrived (`instanceState` returns the in-memory copy, `ui.svelte.ts:325`; `mergedInstances` writes a changed record whole). Ruled (a) and built.
- Brief item 2 (flush at dispose) with item 5 (a tab record that names no file) wrote a closed tab's record and an earlier file's place into a retargeted tab. Ruled and built (ruling 2).
- Brief item 4 and the head comment: PDF.js's `_location.top` is measured up from the page bottom, so the former `top: 0` fallback meant the bottom of the page; a null `_location` now yields no place (ruling 3).
- Verify 4's gate lists `bin`, which does not exist in this tree (`bfs: error: bin: No such file or directory`); the gate was run over `src tests config`.

## Limitations I know of

- Two pages writing the per-file list in the same instant can still lose one entry (no lock on `localStorage`); the window is the read-modify-write inside `updateInstanceState`, microseconds, not the earlier interval.
- A Copy into New Window can carry an offset within the page up to 500 ms old (ruling 3).
- Nothing about the browser behaviour (cases 1 to 8, 11 to 18, 20 to 23, and Maximise or Restore under a document tab) was run here; the `ResizeObserver` path of item 4 is proven by reading `FrameLayer.svelte:62-92` (`place()` writes `display` once per animation frame, so each change reaches the observer in its own frame) and `pdf_viewer.mjs` (`update()` returns before `_updateLocation` when no page is visible, so `_location` holds while the box is hidden), not by a run.
- `tests/checks` other than `tree` were not run by me (the landing list runs them).
