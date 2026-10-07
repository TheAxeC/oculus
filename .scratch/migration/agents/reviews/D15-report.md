# D15 report (after repair round 1): the place a PDF is read at, kept across reloads, windows and reopening

Item 3 is built by a different route than the brief names: the flush is called inside the four window operations (`float/store.ts`) and not at each of their callers, so it needed two paths the brief's list does not name (`float/store.ts`, `shell/Workbench.svelte`); the reason and what it covers are under Judgment calls. Items 1, 2, 4, 5 and 6 are done as written. Nothing was run in a browser (no browser or server may be started here): every case below is a reading of the code with its lines, and the look on TEST at landing settles the browser behaviour, above all Open in New Window in a browser tab, Return to Page after moving in the window, a quick close after a scroll, and Maximise then Restore on a document tab.

## Open items (state file, "Open items" section, as it reads now)

Read with `sed -n '/^## Open items/,/^## Booked/p' tools/oculus/.scratch/migration/orchestrator-state.md`: the section holds its two rule paragraphs and no entry, so there is no open item for Axel to rule on.

## Findings of `agents/reviews/D15-refuter.md` and what changed for each

All lines are in `tools/oculus/` of the worktree.

- Spec 1 (a report pending at dispose was dropped): `viewer.svelte.ts:709-712`, `flush()` sends `this.#away ?? this.#place()` with no size guard; `dispose` (:303-305) calls it before it sets `#disposed`; the hide edge (:655-668), `pagehide` (:255) and the missing file (:529) call it the same way. PDF.js keeps `_location` while no page is visible (`pdf_viewer.mjs:9144-9146`, `update()` returns first), so a detached box still answers its place.
- Spec 2 (a discrete change waited 100 ms): `SETTLE_MS` and its timer are gone (`grep -n "SETTLE\|#due" viewer.svelte.ts` prints nothing). `#changed(true)` (:684-697) sets `#awaiting`; the `updateviewarea` listener (:472) calls `#located` (:700-702), which flushes, so the report carries the offset PDF.js has just computed (`pdf_viewer.mjs:9175-9178`, dispatched after `_updateLocation`). With no `updateviewarea` (box without size) the flush of Spec 1 sends it.
- Spec 3 (ruling 3 against case 16): a page change that comes of a scroll stays under the 500 ms throttle (`#paged`, :609-613, `SCROLLING_MS` at :114), as the round brief rules. A tab put in a window or copied there is flushed first: `float/store.ts:106,110,114,118` call `settle()` in `windowPane`, `windowTab`, `windowFloat` and `copyTabToWindow`; `settle` is the tab frames store's `flush` (`ui/tabs/tab-frames.svelte.ts:166-168`), registered by `shell/Workbench.svelte:85` through `settleBeforeWindow` (`float/store.ts:130-135`), which calls each frame spec's new `flush` member (`tab-frames.svelte.ts:74`, kept across a redraw at :158), set by `File.svelte:234` to `viewer.flush()`.
- Spec 4 (the first line said everything was done): this report's first paragraph.
- Proof 1 (cases 3 and 23 described wrongly): described as the code does them in the cases below (case 3: no dispose, the window operation's flush writes the record; case 23: the old viewer's dispose flush writes the old path's entry and not the tab's record).
- Proof 2 (the copy limit was too narrow): Limits below states every way a copy or a closed tab carries an old place after this round.
- Proof 3 (the scratch run of case 21 cannot be rerun): no decision rests on it; case 21 is described by reading in the ruling section below.
- Standards 1 (head comments false): `viewer.svelte.ts:1-30` and `File.svelte:62-77` rewritten; quoted under Verify 7.
- Standards 2 (own map reader): `pdf-place.ts:123` and `:128` read the record through `instanceMap` (`state/workbench/layout/instance.ts:36-38`), imported at `pdf-place.ts:17`; `mapShape` is no longer imported there.
- Behaviour 1 (Return to Page ignored the window's place): `File.svelte:265-267` (`ownPlace`) and `:334-335` pass the tab's own record to `open` apart from the per-file fallback; `viewer.svelte.ts:266-297`: with a document held and a record that is not the place the viewer sent (`#sent`) and no report pending, the viewer goes to the record (:278-283); a rebuild in the same page keeps its in-memory place (:284-287); the file's entry (`saved`) never moves a viewer that holds its document. `docs/views.md:259` ("a tab keeps its own place across a reload, a window and Return to Page") is true by this.

## The ruling carried (`agents/briefs/D15-cases.md`)

1. Case 21, ruled (a): the ui store has `updateInstanceState(id, change)` (`state/workbench/ui.svelte.ts:631`, member at :198); `File.svelte:290` writes the `pdf-place` list through it. It reads the record as the storage holds it at the write, applies `change`, drops the id from `synced` and saves through `setInstanceState`, so an entry another page wrote before the `storage` event is kept. Two pages that write in the same instant can still race: the storage has no lock.
2. Cases 11, 23 and a closed tab: the hook is bound in `mount` (`File.svelte:299-316`) to the tab id, its view and the file the viewer was mounted for. `keepPlace` (`File.svelte:284-296`) writes the per-file entry always, and the tab record only while the layout holds the tab (`holding`), the tab still shows the same view (`instanceView`) and `drawn` still names that file.
3. A null PDF.js `_location` reports nothing (`#position` returns null, `viewer.svelte.ts:619-630`); a number zoom outside 0.1 to 25 reads as `auto` (`pdf-place.ts`, `readPdfPlace`); a page change, zoom, scroll mode, spread mode or side panel change is reported on PDF.js's next view update, not on a timer; only the offset while scrolling, and a page change that comes of the scroll, is throttled at 500 ms.

## First run of the ten round-1 cases on the round-0 tree (readings, taken before any change of this round)

Round-0 lines are those of the tree this round started from, as `agents/reviews/D15-refuter.md` cites them; the files have changed since, so they are not the lines of the tree now.

1. Scroll 5 to 9, close within 500 ms, reopen from Files: fails (page 5). The scroll sets a 500 ms timer (`viewer.svelte.ts:663-677`); `dispose` calls `#flush` (:285), which sent `this.#away ?? (this.#hasSize() ? this.#place() : null)` (:680-683); the box is already detached at that point (Svelte removes a block's DOM before it runs the children's teardowns, `svelte/src/internal/client/reactivity/effects.js:526` then `:542`), so `#send(null)` cleared the pending report and sent nothing.
2. 200 percent, close within 100 ms: fails. `#changed(true)` waited `SETTLE_MS = 100` (:109-110, :667), and the dispose flush dropped it as in case 1.
3. Scroll to page 7 and Open in New Window at once: fails in a browser tab, holds in the app. `windowTab` did not flush; the main page keeps the frame of a tab in a window (`FrameLayer.svelte:45-53`, `model.ts:177-178`), so `dispose` never runs; the record was written by the hide flush at the next animation frame (:641) or by the timer. A background browser tab stops animation frames and clamps timers to about 1 s, so the window could read the record first.
4. Scroll 5 to 7 then Copy into New Window within 500 ms, and 150 percent then copy within 100 ms: fails. `copyTabToWindow` copies the record synchronously (`float/store.ts:108-111`) and did not flush, so the copy had page 5 or 6 (a page change from scrolling is held to the throttle, :589-593) and the old zoom (100 ms settle).
5. Open in New Window at page 7, move to page 12, Return to Page: fails (page 7). `open` with the document held took `this.#away ?? ...` (:267) and `#away` holds page 7 from the moment the tab left; the record the window wrote (page 12) was never read.
6. Rebuild in the same page at page 4 with a report pending: holds. `open` keeps `#away`, else `#place()` once applied, else `#restore` (:267), so it reloads at page 4.
7. Two tabs of one file at pages 3 and 8, rebuild the second's PDF: holds. The held branch (:267) ignores `saved`.
8. Page entry 20 and Enter: holds, one report 100 ms late. `#paged` (:589-593) with no scroll within 200 ms calls `#changed(true)`, one timer of `SETTLE_MS`, then `#send` of the place PDF.js holds by then.
9. Case 16 again: holds. `#changed(false)` keeps one timer at `max(0, 500 - since the last send)` (:663-677), so a scroll sends at most once in 500 ms; a discrete change adds one report of its own.
10. Rename (case 23) and preview retarget (case 11) with a report pending: fails. The old viewer's dispose flush sent nothing (case 1), so the old file's entry did not get the place; the tab record was not written either (the guard at `File.svelte:276` held).

## The ten round-1 cases after this round (readings with the lines of the tree now)

1. Scroll 5 to 9 and close within 500 ms: the scroll listener (`viewer.svelte.ts:248-253`) calls `#changed(false)` (:684-697), which sets `#pending` and one timer. The close drops the frame, `dispose` (:303) calls `flush()` (:709) before it sets `#disposed`, `#send` (:715) passes `#sendable()` and calls `placed`, and `keepPlace` (`File.svelte:284-296`) writes the file's entry with page 9; the tab record is cleared by the close (`layout/instances.ts:234`) and `holding(tab)` is null, so it is not written. Reopening from Files: `savedPlace` (`File.svelte:274`) finds no tab record and takes the file's entry: page 9.
2. 200 percent and close within 100 ms: `scalechanging` (:464-470) sets `scaleValue` and calls `#changed(true)`; if `updateviewarea` (:472) comes first the report goes out at once, else `dispose` flushes `#place()`, whose `scaleValue` is `viewer.currentScaleValue` (:619-630), set synchronously by the zoom setter. Reopen: 200 percent.
3. Scroll to page 7 and Open in New Window at once: every caller reaches `layout.windowTab` (`tab-menu-state.svelte.ts:171`, `drag.svelte.ts:207`, `float/browser.ts:58`), which runs `settle()` (`float/store.ts:110`) and so `frames.flush()` (`Workbench.svelte:85`) and the File frame's `flush` (`File.svelte:234`): `viewer.flush()` calls `placed`, `keepPlace` writes the file entry and, since the tab is still held and shows this view and file, the tab record (`File.svelte:293-295`) through `setInstanceState`, which saves to `localStorage` synchronously (`ui.svelte.ts:620-622`, `:528-537`). Only then does `floatTabIn` change the layout and the window start. The main page keeps the frame (`FrameLayer.svelte:45-53`, `model.ts:177-178`), so no `dispose` runs and none is needed. The write happens in the click, so it is the same in a browser tab and in the app: the window reads page 7.
4. Scroll 5 to 7 then Copy into New Window within 500 ms, and 150 percent then copy within 100 ms: `copyTabToWindow` runs `settle()` first (`float/store.ts:118`), the flush writes the tab record with page 7 (the throttled scroll report is pending and is sent), or with the 150 percent scale (`scaleValue` is current, :619-630), and then the record is copied (`float/store.ts:123-127`). The copy shows page 7 and 150 percent. The offset inside a page after a zoom change is the one PDF.js held at the last view update; see Limits.
5. Open in New Window at page 7, move to page 12 in the window, Return to Page: the main viewer holds `#away` (page 7, :660) with no report pending. On Return to Page the File view calls `open(src, key, saved, own)` (`File.svelte:331-336`) with the document held and `own` = the window's record (page 12), which is not `#sent` (page 7, the report the window operation flushed): the branch at `viewer.svelte.ts:278-283` takes `keep = own`, `#load` (:507-520) clears `#away` at :516 and `#initialised` (:587) lands page 12. The main page shows page 12.
6. Rebuild in the same page at page 4 with a report pending: `#pending` is true, so the branch at :278 is not taken even when the record is older; the last branch (:284-287) keeps `#away ?? #place()`, page 4.
7. Two tabs of one file at pages 3 and 8, rebuild the second's PDF: the second viewer holds its document, its `own` is its own record (page 8, equal to `#sent`), so the last branch keeps its in-memory page 8; the first tab's record and the file's entry are not read for a held document.
8. Page entry 20 and Enter: `pagechanging` (:457) calls `#paged` (:609-613); with no scroll within 200 ms it calls `#changed(true)`, which waits for `updateviewarea` (:472), whose `#located` flushes: one `placed` call with page 20 and the offset in `_location` (`pdf_viewer.mjs:9174-9178`). The scroll event the jump causes calls `#changed(false)`; its timer would send a second report only when the place differs from `#sent` (`#send`, :719-722). Read, not run: PDF.js's scroll handler is registered when `PDFViewer` is constructed after this viewer's (`pdf_viewer.mjs:8056`, `viewer.svelte.ts:443`), so `#scrolledAt` is set before `pagechanging` of a scroll.
9. Case 16 again: while scrolling, `#changed(false)` keeps one timer (:690-696), `#located` sends only when `#awaiting` (set by a discrete change alone), and a page change within 200 ms of a scroll event is `#changed(false)` (:609-613), so a scroll sends at most once in 500 ms plus one report per discrete change. Counted by reading only; the orchestrator counts at landing.
10. Rename (case 23) and preview retarget (case 11) with a report pending: the old viewer's `dispose` flush sends the place; `keepPlace` writes the old path's entry (`File.svelte:290-292`). For a retarget `clearInstanceState` ran (`layout/open/opening.ts:168` and `:254`) and `drawn` or the view moved on, so the tab record is not written (`File.svelte:293-294`). For a rename the tab record is kept (`followTabs`, `explorer/ops.svelte.ts:351-369`) and `drawn` names the new path, so the old viewer's flush does not write it either; the new box opens at the tab's record, which holds the last place reported before the rename (Limits).

The other cases of the brief that this round touches are read the same way: case 13 (a hidden tab) is unchanged (`#changed` returns while `#away` is set or the box has no size, :685); case 14 sends the last good place before `#shown('missing')` (:529); case 15 (a forward search) is unchanged (`#initialised` skips `#land` while `#reveal` is set, :587-607).

## Lines that read and write the records

`src/lib/views/sources/file/File.svelte`:

```ts
function ownPlace(): PdfPlace | null {                           // :265
    return readTabPlace(instanceState(instance.id));
}
function savedPlace(): PdfPlace | null { ... }                   // :274, own record, else the file's entry
function keepPlace(tab, view, file, place): void {               // :284
    updateInstanceState(PDF_PLACES_ID, (held) => withPdfPlace(readPdfPlaces(held), file.root, file.path, place));
    if (holding(tab) === null || instanceView(tab) !== view) return;      // :293
    if (drawn.root !== file.root || drawn.path !== file.path) return;
    setInstanceState(tab, withTabPlace(instanceState(tab), place));       // :295
}
viewer.open(src, key, untrack(() => savedPlace()), untrack(() => ownPlace()));   // :331-336
```

## Files changed (`diff -rq` against the base copy, after the last change)

```
src/lib/shell/Workbench.svelte
Only in src/lib/state/sources/explorer: pdf-place.ts
src/lib/state/workbench/layout/open/float/store.ts
src/lib/state/workbench/ui.svelte.ts
src/lib/ui/tabs/tab-frames.svelte.ts
src/lib/views/sources/file/File.svelte
src/lib/views/sources/file/pdf/Controls.svelte
src/lib/views/sources/file/pdf/side-panel.ts
src/lib/views/sources/file/pdf/viewer.svelte.ts
docs/diagrams/layer-state.dot  layer-state.svg  layer-views.dot  layer-views.svg  layers.dot  layers.svg
docs/views.md
DESIGN.md
```

Line counts (Verify 3, below): `viewer.svelte.ts` 832, `File.svelte` 485, `tab-frames.svelte.ts` 240, `store.ts` 137, `Workbench.svelte` 489, `pdf-place.ts` 129, `ui.svelte.ts` 716, `side-panel.ts` 222, `Controls.svelte` 306. The two paths the round brief does not list are `float/store.ts` and `shell/Workbench.svelte`. The diagram files are what `npm run diagrams` rewrites. `DESIGN.md:533` gained the sentence on when a pending report is sent; `docs/views.md:259` and `DESIGN.md:169` read true as they stand (re-read). No test was added, changed or removed.

## DONE / NOT DONE

| Item | Command or place | Result |
|---|---|---|
| 1, flush with no size guard | `viewer.svelte.ts:709-712`, `:303-305` | DONE |
| 2, discrete change on `updateviewarea`, no timer | `viewer.svelte.ts:472`, `:684-702`; `grep -n "SETTLE\|#due" viewer.svelte.ts` prints nothing | DONE |
| 3, flush before every window operation | `float/store.ts:106-118`, `Workbench.svelte:85`, `tab-frames.svelte.ts:74,166`, `File.svelte:234` | DONE, by a different route than the brief (below) |
| 3, scroll page change under the throttle | `viewer.svelte.ts:609-613` | DONE |
| 4, Return to Page shows the window's place | `viewer.svelte.ts:266-297`, `File.svelte:265,331-336` | DONE, behaviour at the landing look |
| 5, `instanceMap` | `pdf-place.ts:17,123,128` | DONE |
| 6, report | this file | DONE |
| Browser behaviour of the cases | none run | NOT DONE here, a landing look |
| Verify list | below | DONE, 6 full-list runs, the last one quoted |

## Judgment calls (each reversible)

1. Item 3's route. The brief has each caller call the flush before the operation. The grep `grep -rn "windowTab\|windowPane\|windowFloat\|copyTabToWindow" src` finds `tab-menu-state.svelte.ts:171,175`, `PaneView.svelte:259-260` with `pane-view.ts:413-438`, `drag.svelte.ts:207` and `float/browser.ts:58`; the last two are in the state layer, which cannot import `ui/tabs`, so each would need a function injected, and a caller added later would miss the flush. The flush is called inside the four operations instead (`float/store.ts`), through a function the workbench registers (`settleBeforeWindow`, wired at `Workbench.svelte:85` to the tab frames store's `flush`), so every caller, present and future, is covered by one call per operation. The lazy option would have been to flush at only the shell callers; the chosen route ends the cause. The frame store route the brief names is kept: `FrameSpec.flush`, `TabFrames.flush`. The store flushes every frame's viewer, not only the moved tabs; a viewer with nothing pending sends nothing.
2. `keepPlace` also checks that the tab still shows the same view (`instanceView(tab)`, `File.svelte:293`). With the flush now live at dispose, a tab retargeted to another view keeps its id and its record, and the old viewer's `drawn` still names the old file; without the view check the old place would be written into that other view's record.
3. `open` takes a fourth parameter, `own`, kept apart from `saved` (`viewer.svelte.ts:266-271`), and `#sent` is set when `open` runs without a held document (:275-277) so a record equal to what the viewer opened at counts as sent.
4. `viewer.svelte.ts` imports `readPdfPlace` and shapes the reported place through it (:636), so a NaN page or a zoom outside 0.1 to 25 is never sent; `reload()` (Retry) opens at the last place reported, else the last `saved` (:298-300); a report equal to the last one is not sent (`sameAs`, end of file); a page beyond the count opens at the last page (`#scrollTo`, :726); the zoom factor must be plain decimal digits inside 0.1 to 25.
5. `updateInstanceState` drops the id from `synced` before saving, so the changed record replaces the saved one even when this tab's copy reads the same.

## User-visible changes, before and after (the look on TEST at landing)

- A PDF tab reloaded: the page, the offset in it, the zoom, the scroll and spread modes and the side panel it was left at, in place of page 1 at `auto`.
- A PDF reopened from Files after its tab closed, including a close within 500 ms of a scroll or within a view update of a zoom change: the file's last place (the last 50 files), in place of page 1.
- Open in New Window, Copy into New Window and every other window operation: the window or copy starts at the place the viewer is at, including a scroll within the last 500 ms and a zoom change.
- Return to Page after moving in the window: the main page shows the window's place.
- Maximise pane then Restore panes on a PDF tab keeps its page and offset (before: the offset reset, 394 to 10 on the orchestrator's look). A document tab's frame under Maximise is the orchestrator's look at landing; no code of this step touches it.
- A rebuilt PDF shorter than the page read shows the last page, with no PDF.js console error.
- A forward search that opens a PDF with a saved place shows the search's place. Controls, strings and keys are as they were, and no catalog key was added.

## Limits: every way a copy or a closed tab carries an old place after this round

- A rename of a PDF with a scroll report pending (up to 500 ms): the old path's entry gets the place, and the renamed tab keeps its record (it names no file), so the tab opens at the place last written to its record, up to 500 ms of scrolling old. A retarget must not write the tab's record (case 11), and the viewer cannot tell a rename from a retarget, so this stays.
- A window operation, a copy or a close between a discrete change and PDF.js's next `updateviewarea`: the report carries the new page, zoom and modes (`currentPageNumber` and `currentScaleValue` are set at once) but the offset PDF.js held at its last view update, which can be one update old.
- A tab that another browser page shows: `frames.flush()` reaches the viewers of the page that runs the operation only. A tab shown in a window of its own and copied or moved by the main page keeps whatever that window last reported (up to 500 ms of scrolling old).
- A page that goes without `pagehide` (a killed process, a discarded mobile tab): a report pending then is lost, up to 500 ms of scrolling.
- A refused or full `localStorage`: `save` keeps the record as last saved (`ui.svelte.ts:538`), so a copy carries that one.
- Two pages writing the per-file list in the same instant can lose one entry; the window is the read-modify-write inside `updateInstanceState`, not an interval.
- A tab whose box is hidden reports nothing while hidden (`#changed` returns while `#away` is set), and the hide edge sends what was pending, so a copy of a hidden tab carries the place it had when it was hidden.
- A copy or a close carries no other old place: every operation in `float/store.ts` that puts a tab in a window or copies it there flushes first, and a closed tab's viewer is disposed with a flush.

## Verify list, last run

Run as a script under the session scratchpad (`d15r1/verify.sh`, output `verify.out`), from `tools/oculus` of the worktree, after the last change of the round. Six runs of the full list were made in the round; this is the last, and the files did not change after it.

```
1 diagrams exit 0                      (npm run diagrams)
2 checks.sh exit 0
ok      ASCII gate (0.5 s)
ok      svelte-kit sync (1.8 s)
ok      eslint (6.7 s)
ok      svelte-check (6.2 s): 1791379902824 COMPLETED 421 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (11.6 s): Duration  8.39s (transform 19.87s, setup 0ms, import 28.20s, tests 2.52s, environment 3ms)
test:quick: 12.2 s (limit 45.0 s); every command passed
checks: 1 commands passed
3 wc -l   129 pdf-place.ts, 832 viewer.svelte.ts, 485 File.svelte, 240 tab-frames.svelte.ts, 137 store.ts, 489 Workbench.svelte, 716 ui.svelte.ts, 222 side-panel.ts, 306 Controls.svelte
4 folder-check exit 0
5 unused-exports diff against .agents/worktrees/D15-base/unused-exports.txt: exit 0 (371 lines each)
6 perl ASCII gate over src tests config: exit 0, printed nothing
7 LC_ALL=C grep -n '[^ -~]' over DESIGN.md, docs/views.md and the three diagram .dot files: exit 1, printed nothing
8 comment lines over 100 columns in the touched files: only src/lib/state/workbench/ui.svelte.ts:645 (148 columns), the eslint directive that is in the base copy at line 619
npx vitest run tests/checks/tree --project unit --reporter=dot: Test Files  3 passed (3), Tests  39 passed (39)
```

Verify 6 (`grep -rn "pdf-place\|readPdfPlace\|withPdfPlace\|PDF_PLACES_ID" src`): the id string is defined once (`pdf-place.ts:20`); `PDF_PLACES_ID` is used only in `File.svelte`; `readPdfPlace` is used by `viewer.svelte.ts` and `readTabPlace`; `side-panel.ts:15` and `Controls.svelte:20` import the unions from `pdf-place`.

Verify 7, head comments as they read now: `viewer.svelte.ts:9-30` is the paragraph quoted in the file ("`open(url, key, saved, own)` loads a document ... since a hidden box loses its scroll offset."); `File.svelte:62-77` is the paragraph on the two records and the flush ("The place a PDF is read at is kept in two records of the ui store ... so the record that is carried is current."); `ui.svelte.ts:1-6` and `:106-109` are unchanged by this round. The history-word grep over the comment lines added or changed against the base (`round`, `previous`, `no longer`, `used to`, `formerly`, `reverted`, `earlier`, `D15`, `bug`) prints nothing.

What the green result does not cover: tests outside the quick selection and `tests/checks` other than `tree` (the landing list runs them), the browser behaviour of every case, and PDF.js's event order, which is read from `pdf_viewer.mjs` and not run.
