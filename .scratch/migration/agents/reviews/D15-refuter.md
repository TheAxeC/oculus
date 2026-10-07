# Step D15 refuter report (on .agents/worktrees/D15, base 9d698263c)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number. A finding in code keeps its `file:line`. All `file:line` references are in the worktree's `tools/oculus/`.

## Verification (rerun by the reviewer)

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams
(exit 0; md5 over docs/diagrams/* was 0ba6d562b30d9af4829cbd1677bafcb5 before and after, so the run rewrote nothing)

$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md
$ npm run test:quick
test:quick: 15 changed file(s), from git since HEAD
test:quick: 15 test file(s), 10 essential
ok      ASCII gate (0.5 s)
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      svelte-kit sync (11.9 s)
ok      eslint (33.8 s)
ok      vitest (39.8 s): Duration  28.44s (transform 88.56s, setup 0ms, import 103.44s, tests 2.94s, environment 3ms)
ok      svelte-check (28.6 s): 1791378290569 COMPLETED 421 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 40.7 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
checks: 1 commands passed
exit 0

$ wc -l (Verify 3)
     129 src/lib/state/sources/explorer/pdf-place.ts
     799 src/lib/views/sources/file/pdf/viewer.svelte.ts
     222 src/lib/views/sources/file/pdf/side-panel.ts
     306 src/lib/views/sources/file/pdf/Controls.svelte
     465 src/lib/views/sources/file/File.svelte
     716 src/lib/state/workbench/ui.svelte.ts
$ sh utils/folder-check.sh            -> exit 0
$ sh utils/unused-exports.sh > $TMPDIR/d15-unused.txt; diff .agents/worktrees/D15-base/unused-exports.txt $TMPDIR/d15-unused.txt
-> diff exit 0 (371 lines each). The base list sits at .agents/worktrees/D15-base/unused-exports.txt, one folder above the path the brief gives.

$ LC_ALL=C perl -ne '...' $(find src tests config -type f ! -name local.yml)   (Verify 4; `bin` does not exist: "ls: bin: No such file or directory")
-> printed nothing, exit 0
$ LC_ALL=C grep -n '[^ -~]' over every touched file (DESIGN.md, docs/views.md, the six diagram files, the six source files, the report)
-> printed nothing, exit 1

$ grep -rn "pdf-place\|readPdfPlace\|withPdfPlace\|PDF_PLACES_ID" src   (Verify 6)
src/lib/state/workbench/ui.svelte.ts:6, pdf-place.ts:6,19,88,96,110,123, viewer.svelte.ts:52,57,616, side-panel.ts:15, Controls.svelte:20, File.svelte:64,92,93,95,98,265,273,274
-> the id string is defined once (pdf-place.ts:19) and PDF_PLACES_ID is used only in File.svelte

Commands the builder's report quotes, rerun:
$ npx vitest run tests/checks/tree --project unit --reporter=dot
 Test Files  3 passed (3)
      Tests  39 passed (39)
$ diff -rq against the base copy over src tests utils config docs, and DESIGN.md
-> the same 14 paths the report lists (pdf-place.ts new; ui.svelte.ts, File.svelte, Controls.svelte, side-panel.ts, viewer.svelte.ts, the six diagram files, docs/views.md, DESIGN.md)
$ ls tests/state/sources            -> repositories (the scratch file and its folder are gone)
$ grep -n "setInstanceState\|instanceState" <base>/src/lib/views/sources/file/File.svelte   -> nothing, exit 1
$ base viewer.svelte.ts:216-217      -> "open(url: string, key: string): void {" / "const keep = key === this.#key && this.#doc !== null ? this.#position() : null;"
$ pdf_viewer.mjs:9022, :8987, :164-165 -> the scrollPageIntoView and #setScale console.error lines, MIN_SCALE = 0.1, MAX_SCALE = 25.0, as quoted

The scratch vitest file (cases 9, 10, 19, 21, 24, 25) is deleted, and writing it again in the worktree is not allowed, so it cannot be rerun in the same form. Cases 9, 10, 19, 24 and 25 were rerun with a node script under $TMPDIR that imports pdf-place.ts directly (node 24 type stripping):
zoom "banana" "-2" "NaN" "0" "0.05" "30" "1e3" " 2" "Infinity" -> "auto"; "1.5" "25" "0.1" "page-actual" "auto" "page-fit" kept; number 2 -> "auto"
place string / array / null / undefined / page NaN / page 0 / page 2.5 / left NaN / top Infinity / no left -> null
modes unknown -> scroll "vertical", spread "none", sidebar ""; a whole place round-trips
readPdfPlaces({a:1}) -> []; bad entries dropped and first of a root and path kept -> [["hub","p1.pdf",1],["hub","p2.pdf",2]]; 60 entries -> 50
withPdfPlace on 50 + a 51st -> [50,"p51.pdf","p49.pdf"]; a re-read file -> [50,"p10.pdf",3,1]; same path in two roots -> two entries
Case 21's run imported createUi, which holds runes, so plain node cannot run it. It is judged by reading below.
```

## Verdicts

Items of the brief's "What to build":

- 1: holds. pdf-place.ts:18-129 holds the three unions, `PdfPlace`, `readPdfPlace`, `readPdfPlaces` and `withPdfPlace` with the rules the item and ruling 3's 0.1-25 bound give, and the rerun above reproduces them. viewer.svelte.ts:50-57, side-panel.ts:15 and Controls.svelte:20 import the unions from it, and nothing else imports them.
- 2: violated. A report that is pending when the viewer is torn down is never sent (Spec 1). A discrete change waits 100 ms where ruling 3 says it is reported at once (Spec 2). A page change that comes from scrolling is throttled to 500 ms where ruling 3 says it is reported at once (Spec 3). The rest holds by reading: throttling of the scroll offset (viewer.svelte.ts:663-677), the hold until `#applied` (:648-656, set at :586), the status and size guards, the hide flush (:641) and the pagehide flush (:254).
- 3: holds. `open(url, key, saved)` at :262-275. The in-memory place wins while a document is held (:267), and otherwise `saved` applies. `#initialised` (:567-587) applies the scroll mode, spread mode, zoom and side panel, and lands the place unless a reveal is pending. `#scrollTo` clamps a page beyond the count to the last page (:700-705). The head comment at :9-16 is rewritten.
- 4: holds by reading, and is to be seen at the look. A ResizeObserver on the box (:255) drives `#resized` (:634-647): the place is taken on loss of size and scrolled back to on return. FrameLayer.svelte:62-92 sets `display` on the frame root once per animation frame.
- 5: violated for Return to Page after the reader moved in the window (Behaviour 1). The rest holds. The tab record is written at File.svelte:277 through `withTabPlace`. The per-file list goes through `updateInstanceState` (:273-275), per ruling 1. The open order is tab record, then the file's entry, then none (:262-269). Ruling 2's guard is at :276. One report makes one `updateInstanceState` and one `setInstanceState`.
- 6: holds for what the item asks: docs/views.md:259, DESIGN.md:169 and :533, ui.svelte.ts:1-6 and :106-109 gained the facts. Two sentences the diff adds say what the code does not do (Standards 1 and Behaviour 1).

Cases of the brief's "Cases":

- 1 (reload): met by reading. The pagehide flush (:254) runs with the box attached and sized, so `#place()` is current and `keepPlace` writes the tab record. On load, `savedPlace` -> `open` -> `#initialised` applies page, offset, zoom, wrapped scrolling and the thumbnails panel. The look must reload TEST with page 5, a partway offset, 150 percent, thumbnails and wrapped scrolling, and see all of them come back.
- 2 (closed, reopened from Files): partial. It is met when the tab closes more than 500 ms after the last scroll and more than 100 ms after the last discrete change. For a close inside that window, the per-file entry holds the place reported before it (Spec 1). The look must scroll and close quickly, then reopen and compare.
- 3 (Open in New Window within 500 ms): not verifiable here. The main page keeps the frame of a tab that moved to a window, because FrameLayer.svelte:45-53 drops a frame only when `instanceView(id)` changes, and `holding` includes window floats (model.ts:177-178). So `dispose` does not run. The write comes from the hide flush at the next animation frame, or from the pending timer. In the app this is before the window boots. In a browser, the main tab goes to the background, which stops animation frames and clamps timers to about 1 s, so the window may read the record first. The look must take both paths: scroll to page 7, choose Open in New Window at once, check the window shows page 7, then choose Return to Page. The report's account of this path is wrong (Proof 1).
- 4 (Copy into New Window): partial. `copyTabToWindow` copies the record synchronously (float/store.ts:108-111). A zoom, mode or panel change made less than 100 ms before is missing from the copy (Spec 2). A page reached by scrolling less than 500 ms before is missing too (Spec 3). The report says only the offset can be old (Proof 2).
- 5 (Maximise then Restore): PDF part met by reading (item 4). Document-tab part not verifiable: no code of the step touches it, and the orchestrator's look at landing settles it.
- 6 (rebuilt PDF): met by reading. :267 keeps `#away`, or `#place()` once applied, or `#restore` while the document is still laid out.
- 7 (reload during a build, then the build): met by reading. A missing first load sets neither `#restore` nor `#applied` (:492-495, :509-513). The next `open` after the build passes `savedPlace()` read from unchanged records, and no report can come before `#applied`.
- 8 (saved page beyond the count): met by reading. :702-705 sets `currentPageNumber = pagesCount`, which avoids the console.error at pdf_viewer.mjs:9022.
- 9: met (rerun above). The "opens at auto with no PDF.js error" half is met by reading, since only names that pass `zoomOf` reach `currentScaleValue`.
- 10: met (rerun above).
- 11 (preview retarget): met by reading. The new key draws a new box. opening.ts:168/:254 clears the tab record in the same synchronous change. The old viewer's teardown cannot write the tab record because of :276, and in practice it writes nothing (Spec 1). b.pdf opens at its own entry or at the top.
- 12: met by reading. Two tab ids give two tab records, and `savedPlace` reads the tab's own first.
- 13: met by reading. A tab drawn hidden has `drawn` empty (File.svelte:150), so it mounts no viewer and writes nothing. A mounted viewer that is hidden is held off by `#changed` (:648).
- 14: met by reading. `#sendable` needs `status === 'ready'`, and the flush before a missing file (:509) sends the last good place.
- 15: met by reading. :580 skips `#land` while `#reveal` is set, and `#settle` draws the search.
- 16: not verifiable here. Reading gives at most one scroll report per 500 ms, with page changes from scrolling held to the same throttle (:592, :667). Each report makes two `setItem` calls of the whole ui blob. The orchestrator counts at landing.
- 17: met by reading. `readTabPlace(undefined)` and `readPdfPlaces(undefined)` give null and [], and `withTabPlace` keeps a record's other keys.
- 18: met by reading. `keepPlace` runs only from a viewer's `placed`, and only a PDF mounts a viewer.
- 19: met (rerun above).
- 20: met (rerun above, and `savedPlace` matches root and path).
- 21: met by reading. `updateInstanceState` (ui.svelte.ts:635-641) reads the stored record, drops only `id` from `synced`, and saves through `setInstanceState`. `mergedInstances` therefore lays this page's list over the stored one, and every other id goes through the merge unchanged. It cannot drop or bring back another record. After a failed `setItem`, `synced` lacks only `pdf-place`, so the next save writes this page's list again. That is what `setInstanceState` already does after a failed save.
- 22: met by reading. `savedHeld` catches `getItem` and `JSON.parse`, and `save` catches `setItem`.
- 23 (rename): met by reading for the tab record. `followTabs` (ops.svelte.ts:351-369) restates the tab without clearing its ui record, and the new box opens at that record. A report pending at the rename is lost (Spec 1). The report's statement that the old viewer's flush writes the old path's entry is not what the code does (Proof 1).
- 24, 25: met (rerun above).

## 1. Spec

1. viewer.svelte.ts:680-683, with the teardown order in FrameLayer.svelte:153-165 and svelte 5.57.1 `destroy_effect` (node_modules/svelte/src/internal/client/reactivity/effects.js:518-542). Quoted hunk: `#flush(): void { if (!this.#pending) return; this.#send(this.#away ?? (this.#hasSize() ? this.#place() : null)); }`.
   - What is wrong: item 2 asks that a pending report be sent at once when the viewer is disposed. `dispose` runs from the `{@attach}` teardown of the frame's block. Svelte removes a destroyed block's DOM before it runs the teardowns of its children (`remove_effect_dom` at :526, `execute_effect_teardown` at :542). So at `dispose` the box is detached, `#hasSize()` is false, and `#away` is null unless the box was hidden in an earlier frame. `#send(null)` then clears the pending report and sends nothing.
   - The guard is not needed there. `_location` keeps its value while the box has no size, because `update()` returns early with no visible page (pdf_viewer.mjs:9140-9146). `this.#away ?? this.#place()` would send the current place.
   - Failure scenario: the reader scrolls from page 5 to page 9 and presses Close within 500 ms, or sets 200 percent and closes within 100 ms. The per-file entry keeps page 5, or the old zoom, and reopening from Files opens there. The same loss applies to a preview retarget and a rename.
   - Verdict: item 2 violated; cases 2 and 23 partial.
2. viewer.svelte.ts:109-110 and :667. Quoted hunk: `const SETTLE_MS = 100;` and `const wait = settled ? SETTLE_MS : Math.max(0, REPORT_EVERY_MS - (now - this.#sentAt));`.
   - What is wrong: ruling 3 of D15-cases.md says a change of page, zoom, scroll mode, spread mode or side panel is "reported at once, unthrottled". The diff delays each such change by 100 ms. The report lists this as judgment call 1, so it is surfaced, but it departs from a ruling.
   - The reason given, that PDF.js has not yet updated its offset at the event, has an answer in PDF.js itself. `update()` dispatches `updateviewarea` with the new `_location` right after `_updateLocation` (pdf_viewer.mjs:9174-9178), so a discrete change can be reported at once with a current offset.
   - Failure scenario: a zoom change followed within 100 ms by Copy into New Window (by key), or by a close (with Spec 1). The copy, or the per-file entry, has the old zoom.
   - Verdict: item 2 violated; case 4 partial.
3. viewer.svelte.ts:589-593 and :113. Quoted hunk: `this.#changed(Date.now() - this.#scrolledAt > SCROLLING_MS);`.
   - What is wrong: ruling 3 lists a change of page among what is reported at once. Here a page change within 200 ms of a scroll event is held to the 500 ms throttle. This settles a clash between ruling 3 and case 16, which allows at most two reports a second. The builder settled the clash itself, as judgment call 2, rather than putting it to the orchestrator.
   - Failure scenario: the reader scrolls from page 5 to page 7, then copies the tab, or closes it (with Spec 1), within 500 ms. The copy, or the per-file entry, is at page 5 or 6.
   - Verdict: item 2 violated; case 4 partial. The clash between ruling 3 and case 16 is the orchestrator's to rule on.
4. The builder's report, first line: "Everything in the brief is done". What is wrong: item 2's dispose flush does not work (Spec 1), and two parts of ruling 3 are not followed (Spec 2 and 3). Failure scenario: the orchestrator reads the step as complete and books it with the dispose flush missing. Verdict: item 2.

## 2. Proof

1. D15-report.md, "The cases on the changed tree", case 3 ("The viewer's dispose flush ... and the hide flush ... send a pending report at once; the tab is still held by the layout, so the tab record is written") and case 23 ("The old viewer's flush sees `drawn` on the new path and writes only the old path's entry").
   - What is wrong: by reading, `dispose` never runs for case 3, because the main page keeps the frame of a tab in a window (FrameLayer.svelte:45-53, model.ts:177-178). For case 23, the old viewer's flush sends nothing, because its box is detached (Spec 1).
   - The decision that rests on this: whether case 3 can be called met without a look at the browser path.
   - Failure scenario: the orchestrator accepts case 3 on the dispose flush, and the browser path, where only a background-clamped timer writes the record, goes unlooked at.
   - Verdict: case 3 not verifiable; case 23 partial.
2. D15-report.md, "Limitations I know of": "A Copy into New Window can carry an offset within the page up to 500 ms old (ruling 3)".
   - What is wrong: the copy can also carry a page up to 500 ms old (Spec 3) and a zoom, mode or panel up to 100 ms old (Spec 2).
   - The decision that rests on this: the orchestrator's acceptance of ruling 3's limit as stated.
   - Failure scenario: the orchestrator accepts a limit narrower than the real one, and the landing look checks only the offset.
   - Verdict: case 4 partial.
3. The scratch run for case 21 cannot be rerun: the file is deleted, and plain node cannot load ui.svelte.ts's runes. No decision rests on its count, and case 21 is judged by reading above. The brief asked that file to import pdf-place.ts alone; it also imported `createUi`. That is harmless, since the file is gone.

## 3. Standards

1. viewer.svelte.ts:23-24 and File.svelte:66-68.
   - Quoted hunks: "A report still waiting goes out when the box loses its size, when the viewer is disposed and when the window's page is hidden" and "Its report reaches the file's entry whatever happens to the tab".
   - What is wrong: both comments say the code does something it does not do, against the rules file, "What every package obeys", on a sentence a change makes false. A report pending at dispose is dropped (Spec 1).
   - Failure scenario: a maintainer reads the head comment, trusts the dispose flush, and changes the close path assuming it.
   - Verdict: item 2.
2. pdf-place.ts:121-129.
   - Quoted hunk: `return { ...(readAs(mapShape, record) ?? {}), pdf: place };` and `const held = readAs(mapShape, record);`.
   - What is wrong: `instanceMap` in src/lib/state/workbench/layout/instance.ts:36-38 already reads a tab's saved state as a map, or as {} for any other value (`readOr(mapShape, state, {})`). The rules file, "The principles every package is judged on", asks for a grep for an existing helper before writing one, quoted in the report. The report quotes no such grep for the new helpers.
   - Failure scenario: a later change to how a tab record is read as a map, for example the `__proto__` handling, reaches `instanceMap` and misses `withTabPlace`.
   - Verdict: none (item 1 still holds).

## 4. Behaviour

1. viewer.svelte.ts:267 with File.svelte:310-316, and docs/views.md:259.
   - Quoted hunks: `const keep = held ? (this.#away ?? (this.#applied ? this.#place() : this.#restore)) : saved;` and the docs sentence "a tab keeps its own place across a reload, a window and Return to Page".
   - What is wrong: while a tab is in a window, the main page keeps its frame and viewer hidden, holding `#away` from the moment the tab left. On Return to Page the File view mounts again on that viewer, and `open` runs with the document held. The in-memory `#away` therefore wins, and the place the window wrote to the tab record is ignored.
   - After the scroll back, `#send` drops the report as equal to `#sent`, so the tab record keeps the window's place. The screen shows the old place, and the reader's next scroll writes it over the record.
   - The report states the opposite, in its "User-visible changes" section and in docs/views.md.
   - Failure scenario: the PDF at page 7 goes to Open in New Window, the reader moves to page 12 in the window, then chooses Return to Page. The main page shows page 7.
   - Verdict: item 5 violated. Case 3 as written, with no movement in the window, is still met by reading.

## Declined to judge

- The browser cases 1 to 8, 11 to 18 and 20 to 23, as they run. There is no browser suite, and no server may be started here. Each verdict above is a reading, and the orchestrator's look on TEST settles them. The checks that matter most are the quick close after a scroll (Spec 1), Open in New Window in a browser tab (case 3), Return to Page after moving in the window (Behaviour 1) and Maximise/Restore on a document tab (case 5).
- The cost of the writes while scrolling: up to two reports a second, each making two `setItem` calls of the whole `oculus.ui.v1` blob plus three reads and parses of it. Each write raises a `storage` event in every other open oculus page, and each of those pages replaces its instance records. Also, `#changed` reads `clientWidth` and `clientHeight` on every scroll event, which can force a layout while PDF.js renders. All of this is unmeasured, and a trace at the look or the count of case 16 settles it.
- Rebuild timing: a rebuild that arrives after `#initialised` and before PDF.js's first `update()` finds `_location` null, so `keep` is null and the PDF opens at the top. The window is too short to judge without a run.
- Two wrong premises in the brief, which are not defects of the diff. Verify 4 names `bin`, which does not exist. The base `unused-exports.txt` is at .agents/worktrees/D15-base/, not inside its tools/oculus/.
- The clash between ruling 3 (a page change reported at once) and case 16 (at most two reports a second). It is the orchestrator's ruling to make.

Usage: a2c8b12f9b29ab61c, claude-opus-5-5, 235,936 tokens, 64 tool uses, 13.6 min.
