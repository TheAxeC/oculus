# D15 round 1: the place sent at every close, copy and return

Rules: `agents/spec.md`, `agents/guarded.md`, the step's brief `agents/briefs/D15.md` and its cases ruling `agents/briefs/D15-cases.md`, which stay in force except where this file says otherwise. This round is built on the worktree `.agents/worktrees/D15` as round 0 left it. The review is `agents/reviews/D15-refuter.md`; read it whole before you change anything.

## What to change

1. **A report pending at dispose is sent (Spec 1, Standards 1).** Svelte removes a destroyed block's DOM before it runs its children's teardowns (`node_modules/svelte/src/internal/client/reactivity/effects.js`, `destroy_effect`: `remove_effect_dom` before `execute_effect_teardown`), so at `dispose` the box is detached and `#hasSize()` is false. PDF.js keeps `_location` while no page is visible (`update()` returns before `_updateLocation`). `#flush` sends `this.#away ?? this.#place()`, with no size guard, so a report pending at dispose, at the hide edge, at `pagehide` and before a missing file is sent with the place PDF.js holds. The head comments of `viewer.svelte.ts` (:23-24) and `File.svelte` (:66-68) then say what the code does; read them again after the change.

2. **A discrete change is reported once PDF.js has its new place, with no timer (Spec 2).** A change of page that does not come from a scroll (a page entry, Next, a link, a jump), of zoom, of a mode or of the side panel is reported on PDF.js's next `updateviewarea` after it, which PDF.js dispatches right after `_updateLocation` (`pdf_viewer.mjs`, `update()`), so the report carries the new offset. `SETTLE_MS` and its timer go. When no `updateviewarea` follows because the box has no size, the flush of item 1 sends it.

3. **The clash between ruling 3 and case 16, ruled (Spec 3).** Case 16 governs a scroll: a page change that comes from scrolling is part of the scroll and is held to the 500 ms throttle, as round 0 built it (`SCROLLING_MS`). Ruling 3's "reported at once" applies to every page change that does not come from a scroll (item 2). So that the throttle never makes a copy or a moved tab start at an old place, every operation that puts a tab in a window or copies it there sends the viewer's pending report first: `windowTab`, `windowPane`, `windowFloat` and `copyTabToWindow` (`state/workbench/layout/open/float/store.ts:43-53`), from every caller of each (`grep -rn "windowTab\|windowPane\|windowFloat\|copyTabToWindow" src`). The flush reaches the viewer through the tab frames store (`ui/tabs/tab-frames.svelte.ts`): `FrameSpec` gains an optional member that sends a frame's pending state, the PDF view's spec sets it to the viewer's flush, and the callers call it for each tab the operation moves or copies before calling the operation. The viewer's `#flush` becomes a public `flush()` for that.

4. **Return to Page after moving in the window shows the window's place (Behaviour 1).** While a tab is in a window, the main page keeps its frame and viewer hidden, holding `#away`; on Return to Page `open` runs with the document held and `#away` wins over the place the window wrote. `File.svelte` passes the tab's own record to `open` apart from the per-file fallback, and when `open` runs with a document held and the tab's own record is not the place this viewer last sent (`#sent`), the viewer goes to the record's place, which another page wrote. A rebuild in the same page, where the record is the place this viewer sent or one still pending, keeps the in-memory place. The per-file entry never moves a viewer that holds its document, so another tab of the same file does not pull this one. `docs/views.md:259` ("a tab keeps its own place across a reload, a window and Return to Page") is then true; read it again.

5. **The tab record read through the existing helper (Standards 2).** `readTabPlace` and `withTabPlace` read the record with `instanceMap` (`state/workbench/layout/instance.ts:36-38`) in place of their own `readAs(mapShape, ...)`, so a change to how a tab's state is read as a map reaches them.

6. **The report rewritten whole for the state after this round (Proof 1, 2 and Spec 4).** Its first line says what is not done, or "Everything in the brief is done" only if it is. Cases 3 and 23 are described as the code does them after this round (case 3: the main page keeps the frame of a tab in a window, `FrameLayer.svelte:45-53`, `model.ts:177-178`, and the window operation's flush writes the record; case 23: the old viewer's flush writes the old path's entry). The limits section states every way a copy or a closed tab can carry an old place after this round, or that there is none.

## Cases (first run on the round-0 tree in the worktree, by reading with the lines named, then after)

1. Scroll from page 5 to page 9 and close the tab within 500 ms; reopen from Files: page 9 (after), page 5 (round 0).
2. Set 200 percent and close within 100 ms; reopen: 200 percent.
3. Scroll to page 7 and choose Open in New Window at once, in a browser tab and in the app: the window shows page 7.
4. Scroll from page 5 to page 7 and choose Copy into New Window within 500 ms; set 150 percent and copy within 100 ms: the copy shows page 7, and 150 percent.
5. Open in New Window at page 7, move to page 12 in the window, choose Return to Page: the main page shows page 12.
6. Rebuild a PDF in the same page at page 4 with a report pending: it reloads at page 4, not at an older place.
7. Two tabs of one file at pages 3 and 8; reload the second's PDF by a rebuild: it stays at page 8.
8. Page entry 20 and Enter: one report, carrying page 20 and the offset PDF.js gives it.
9. Case 16 of the brief again: at most two reports a second while scrolling, counted by reading.
10. A rename (case 23) and a preview retarget (case 11) with a report pending: the old file's entry gets the place, the tab's record does not.

Each case is a reading quoted with its lines; the browser cases are looked at by the orchestrator on TEST at landing. No guarded entry covers this code, so the round adds no test.

## Paths this round writes

- `tools/oculus/src/lib/views/sources/file/pdf/viewer.svelte.ts`
- `tools/oculus/src/lib/views/sources/file/File.svelte`
- `tools/oculus/src/lib/state/sources/explorer/pdf-place.ts`
- `tools/oculus/src/lib/ui/tabs/tab-frames.svelte.ts`
- every caller of `windowTab`, `windowPane`, `windowFloat` and `copyTabToWindow` the grep in item 3 finds, each named in the report
- `tools/oculus/docs/views.md` line 259 and `tools/oculus/DESIGN.md` lines 169 and 533, only where this round makes a sentence false
- `tools/oculus/docs/diagrams/*`, as `npm run diagrams` rewrites them
- `tools/oculus/.scratch/migration/agents/reviews/D15-report.md`

## Verify before you report

The brief's "Verify before you report", every check, from `tools/oculus` in the worktree. The base `unused-exports.txt` is `.agents/worktrees/D15-base/unused-exports.txt`, and the ASCII gate runs over `src tests config` (`bin` does not exist). While working, run only the test files that cover what you change. After the round's last change, run the full verify list and quote its final lines in the report; a red line in a file you touched is fixed before hand-back; a failed command is rerun alone, then the full list once more. The report gives the number of full-list runs.

Rewrite the report whole for the state after this round. Copy the open items from the state file at the moment you write it. Every finding of the review above gets a line saying what changed for it, with the file and line.
