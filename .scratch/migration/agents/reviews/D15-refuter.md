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

## Repair round 1, refuted

Step D15, the place a PDF is read at kept across reloads, windows and reopening. Worktree `.agents/worktrees/D15`, base 9d698263c. All `file:line` references are in the worktree's `tools/oculus/`.

Summary: the verify list is green, and every finding of the first report is closed for the case it named. Three new defects remain in code, and none of them makes a check red:

- **Side panel report never goes out.** Showing or hiding the side panel makes a report that waits for a view update which has already happened, so it stays unsent until some later event.
- **Return to Page writes the old place first** (in the app). The main page scrolls to the old place and writes it into both records before the window's place lands.
- **Two window paths do not flush.** A drop onto another app window, and a move out of a window, can carry an old place.

There is also one behaviour change the report does not state (two main pages sharing a tab). All four are small and inside the brief.

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams
diagrams exit 0
(md5 over docs/diagrams/* was 2dc4357a0339af6bf95e4d61892c645a before and after: nothing rewritten)

$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md
$ npm run test:quick
test:quick: 18 changed file(s), from git since HEAD
test:quick: 16 test file(s), 10 essential
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.3 s)
ok      eslint (2.2 s)
ok      svelte-check (7.0 s): 1791380233335 COMPLETED 421 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (12.9 s): Duration  9.02s (transform 20.63s, setup 0ms, import 30.54s, tests 2.89s, environment 10ms)
test:quick: 13.7 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
checks: 1 commands passed
exit 0

$ wc -l (Verify 3)
     129 src/lib/state/sources/explorer/pdf-place.ts
     832 src/lib/views/sources/file/pdf/viewer.svelte.ts
     222 src/lib/views/sources/file/pdf/side-panel.ts
     306 src/lib/views/sources/file/pdf/Controls.svelte
     485 src/lib/views/sources/file/File.svelte
     716 src/lib/state/workbench/ui.svelte.ts
     240 src/lib/ui/tabs/tab-frames.svelte.ts
     137 src/lib/state/workbench/layout/open/float/store.ts
     489 src/lib/shell/Workbench.svelte
$ sh utils/folder-check.sh                 -> folder-check exit 0
$ sh utils/unused-exports.sh > $TMPDIR/d15r1-unused.txt; diff .agents/worktrees/D15-base/unused-exports.txt $TMPDIR/d15r1-unused.txt
-> unused diff exit 0; 371 lines

$ LC_ALL=C perl -ne '...' $(find src tests config -type f ! -name local.yml)    (Verify 4)
-> perl gate exit 0, printed nothing
$ LC_ALL=C grep -n '[^ -~]' over DESIGN.md, docs/views.md, the three .dot files, the nine changed source files and the report
-> grep exit 1, printed nothing

$ grep -rn "pdf-place\|readPdfPlace\|withPdfPlace\|PDF_PLACES_ID\|FilePlace\|readTabPlace\|withTabPlace" src   (Verify 6)
-> the id string defined once (pdf-place.ts:20 `export const PDF_PLACES_ID = 'pdf-place';`); PDF_PLACES_ID used only in File.svelte (:97, :277, :290); readPdfPlace used by viewer.svelte.ts:636 and pdf-place.ts; the unions imported by side-panel.ts:15, Controls.svelte:20, viewer.svelte.ts:56-61

Commands the report quotes, rerun:
$ npx vitest run tests/checks/tree --project unit --reporter=dot
 Test Files  3 passed (3)
      Tests  39 passed (39)
$ grep -n "SETTLE\|#due" src/lib/views/sources/file/pdf/viewer.svelte.ts   -> nothing, exit 1
$ grep -n "mapShape" src/lib/state/sources/explorer/pdf-place.ts          -> nothing, exit 1
$ diff -rq D15-base/tools/oculus/{src,tests,utils,config,docs} against the worktree, and DESIGN.md
-> the 16 paths the report lists (Workbench.svelte, pdf-place.ts only in the worktree, float/store.ts, ui.svelte.ts, tab-frames.svelte.ts, File.svelte, Controls.svelte, side-panel.ts, viewer.svelte.ts, six diagram files, docs/views.md, DESIGN.md)
$ sed -n '/^## Open items/,/^## Booked/p' orchestrator-state.md (main checkout and worktree)
-> the two rule paragraphs and no entry, as the report says
$ line numbers the report cites (grep -n): SCROLLING_MS :114, pagehide :255, keep = own :281, dispose :303, updateviewarea :472, missing flush :529, #paged :609, #position :619, readPdfPlace({ :636, #resized :655, #changed :684, #located :700, flush :709, #send :715; store.ts settle() :106,:110,:114,:118, settleBeforeWindow :130; tab-frames.svelte.ts flush :74, :158, :166-167; Workbench.svelte :85; File.svelte flush :234, ownPlace :265, savedPlace :274, keepPlace :284, holding(tab) :293, setInstanceState(tab :295, viewer.open( :331; ui.svelte.ts updateInstanceState :198, :631 -> all as the report gives them
$ added comment lines over 100 columns (awk over `git diff 9d698263c -U0` added lines) -> none
$ cases 9, 10, 19, 24, 25 and the tab-record helpers, rerun with a node script under $TMPDIR/d15r1 importing pdf-place.ts (node 24 type stripping):
zoom auto auto auto auto auto auto auto auto auto 1.5 25 0.1 page-actual auto auto   ("banana" "-2" "NaN" "0" "0.05" "30" "1e3" " 2" "Infinity" -> auto; "1.5" "25" "0.1" "page-actual" "auto" kept; number 2 -> auto)
null cases: string, array, null, undefined, page NaN, page 0, left NaN, top Infinity -> all null
modes {"page":5,"left":10,"top":700,"scaleValue":"1.5","scroll":"vertical","spread":"none","sidebar":""}
list not array []
dedup [["hub","a.pdf",1],["two","a.pdf",3]]
sixty 50
51st 50 p99.pdf p48.pdf
again 50 p10.pdf 1
tab 5 null 1 ["pdf"]
```

The state file's verify note says a reviewer adds `-- --base <base>`. `checks.sh` takes only the state file and refused the extra arguments ("checks: usage: sh <the land skill folder>/templates/checks.sh <state file>"), so the run above is the form the brief names.

### Closures of the first report's findings

- **Spec 1 (a report pending at dispose was dropped): closed.**
  - The fix: `viewer.svelte.ts:709-712`, `flush(): void { if (!this.#pending) return; this.#send(this.#away ?? this.#place()); }`, and `dispose()` at :303-305 calls `this.flush();` before `this.#disposed = true;`.
  - The size guard was the defect, so removing it is the fix the round brief asked for, not a check taken away. PDF.js's `update()` returns before `_updateLocation` while no page is visible (`pdf_viewer.mjs`, `update()`: `if (numVisiblePages === 0) { return; }`), so `_location` survives a detached box. `#position()` still returns null for a null `_location` (:619-630), so nothing is sent before PDF.js has a place.
- **Spec 2 (a discrete change waited 100 ms): closed for page, zoom, scroll mode and spread mode.**
  - `SETTLE_MS` is gone (grep above). `#changed(true)` sets `this.#awaiting = true` (:684-697), and the listener `eventBus.on('updateviewarea', () => this.#located(), { signal });` (:472) flushes.
  - For the scroll and spread modes, PDF.js's setters dispatch the mode event and then call `this.update()` (`_updateScrollMode` and `_updateSpreadMode` end in `this.update();`), so the report goes out with the new offset.
  - For the side panel the round made it worse: see Spec 1 below.
- **Spec 3 (ruling 3 against case 16): closed as the round brief rules.** `#paged` keeps `this.#changed(Date.now() - this.#scrolledAt > SCROLLING_MS);` (:612), and `settle();` opens `windowPane`, `windowTab`, `windowFloat` and `copyTabToWindow` (`store.ts:106`, :110, :114, :118). The route departs from the brief (judged below).
- **Spec 4 (first line): closed.** The report's first paragraph names the departure on item 3 and says that no case was run in a browser.
- **Proof 1 (cases 3 and 23 described wrongly): closed for those two cases.** Case 3 is now described through the window operation's flush, and case 23 through the old viewer's dispose flush writing the old path's entry. The new case 5 reading leaves out the resize scroll to the old place (Spec 2 below).
- **Proof 2 (limit too narrow): closed.** The Limits section now lists the offset one view update old, the rename, another page's tab, a page lost without `pagehide`, a full storage, a write race and a hidden tab. Its scope is a copy and a closed tab. The paths that move a tab without one of the four operations are outside that scope (Spec 3 below).
- **Proof 3 (scratch run of case 21 not rerunnable): closed.** No decision rests on it, and case 21 is judged by reading.
- **Standards 1 (head comments false): closed for dispose.** `viewer.svelte.ts:24-26` ("A report still waiting is sent by `flush` with the place PDF.js holds ... when the viewer is disposed (its box is already detached then)") and `File.svelte:66-68` are now true. The new sentence at :21-23 ("... or of the panel is reported on PDF.js's next `updateviewarea`") is false for the panel (Standards 1 below).
- **Standards 2 (own map reader): closed.** `pdf-place.ts:123` `return readPdfPlace(instanceMap(record).pdf);` and :128 `return { ...instanceMap(record), pdf: place };`, with `instanceMap` imported at :17. `mapShape` no longer appears in the file.
- **Behaviour 1 (Return to Page ignored the window's place): closed in the end state, with an interim defect.** `open` takes `own` (:266-271), and :278-283 reads `} else if (own !== null && !this.#pending && !sameAs(own, this.#sent)) { keep = own; this.#sent = own; }`. `File.svelte:331-336` passes `untrack(() => ownPlace())`. In the app, the main page first scrolls to the old place and writes it into both records before the load lands the window's place (Spec 2 below).

### Item 3: the builder's departure

The round brief had each caller flush the tabs it moves. The builder instead calls `settle()` inside the four operations. `settle` is registered by `$effect(() => client.layout.settleBeforeWindow(() => frames.flush()));` (`Workbench.svelte:85`).

- **No module-level mutable state: kept.**
  - `let settle: () => void = () => undefined;` (`store.ts:69`) is local to `createFloatOps`, so there is one per layout store.
  - The registration returns its own stop (:130-135), guarded so a later registrant is not cleared.
  - It is a dependency passed in after construction, in the shape of a subscription. That fits the rules file's "a dependency is passed in", since the frames store is made by the Workbench after the client.
- **Layering: kept.** `store.ts` imports nothing from `ui/` or `shell/`. `shell/Workbench.svelte` may import state and ui. `tests/checks/tree` passes (39 tests, rerun above).
- **Coverage of the paths into a window: complete.** By grep, every path in the app and the browser that puts a tab in a window or copies it there ends in one of the four operations:
  - `tab-menu-state.svelte.ts:171` (Move to New Window) and :175 (Copy into New Window);
  - `PaneView.svelte:259-260` (window pane, window float);
  - `drag.svelte.ts:207` (a drop outside that no window takes);
  - `float/browser.ts:58` `openInWindow`, which serves the file tab's menu (`File.svelte:381`), the Files row menu (`row-menu.ts:564`), the TeX view (`Latex.svelte:157`) and the tab menu's `openPdfWindow` (`tab-menu-state.svelte.ts:149`).

  This covers more than the route the brief named, which would have needed a function injected into two state-layer callers.
- **Paths that bypass the operations.** Two kinds of window path go through none of the four (Spec 3 below):
  - a tab dropped onto another app window that takes it (`drag.svelte.ts:206` -> host `DROP_OUTSIDE` -> the target page's `drag.receive`, `desktop-windows.svelte.ts:31-35`);
  - every path out of a window: Return to Page (`returnFloat`, `pane-view.ts:441`), Restore (`freeFloat`, `pane-view.ts:440`, `desktop-windows.svelte.ts:78`).
- **Write list.** The two extra paths (`store.ts`, `Workbench.svelte`) are named in the report with the reason. The departure is reported as judgment call 1, so it is not silent.
- **The view check added in `keepPlace` (`File.svelte:293`, `if (holding(tab) === null || instanceView(tab) !== view) return;`): sound and needed.**
  - Without it, once the dispose flush works, this sequence corrupts another view's record: a preview tab is retargeted to a text file, the source view takes the same tab id, and `opening.ts:168` clears the record. The old viewer's dispose then runs while the destroyed File component's `drawn` still names the old file, and it would write `pdf` into the source view's record through `withTabPlace`.
  - The check is stricter than ruling 2 and serves its purpose. It is stated in the head comment (`File.svelte:70-72`) and in the report (judgment call 2). It is not a fix that reaches beyond the finding.

### Verdicts: items of the brief's "What to build"

- **1: holds.** `pdf-place.ts:20-129` has the unions, `PdfPlace`, `readPdfPlace`, `readPdfPlaces` and `withPdfPlace` with ruling 3's bound of 0.1 to 25, and the rerun above reproduces each rule. The unions are imported only from there.
- **2: violated for the side panel (Spec 1).** The rest holds by reading:
  - the scroll throttle (:684-697);
  - the hold until `#applied` (:605, :684-687);
  - the status and size guards;
  - the flush at hide (:655-668), at `pagehide` (:255), at dispose (:303-305) and before a missing file (:529);
  - discrete changes on `updateviewarea` (:472, :700-702).
- **3: holds.** `open(url, key, saved, own)` (:266-297): the saved place applies when no document is held. A page beyond the count goes to the last page (`#scrollTo`), and a pending reveal wins (:600-601).
- **4: holds by reading.** `#resized` (:655-668) takes the place on the loss of size and scrolls back when the size returns. It is to be seen at the look.
- **5: holds in the end state.** The two records (`File.svelte:284-296`), the open order (:274-281) and Return to Page all hold. The Return to Page path has an interim write of the old place (Spec 2), and two window paths are not flushed (Spec 3).
- **6: holds,** except one clause of `DESIGN.md:533` that the side panel makes false (Standards 1). `docs/views.md:259`, `DESIGN.md:169` and `ui.svelte.ts:1-6` and :106-109 are true.

### Verdicts: cases of the brief's "Cases"

Each verdict is by reading unless it says rerun. For every browser case, the orchestrator's look on TEST is the run.

- **1 (reload): met by reading.** The pagehide flush writes the tab record (:255), and `#initialised` restores page, offset, zoom, modes and panel (:587-606). Look: page 5, partway down, 150 percent, thumbnails, wrapped; reload; all five come back.
- **2 (closed, reopened from Files): met by reading.** The dispose flush (:303) writes the file's entry, and `savedPlace` (:274-281) reads it. Look: scroll, close at once, reopen from Files; same page and zoom.
- **3 (Open in New Window within 500 ms): met by reading.** `windowTab` -> `settle()` -> `frames.flush()` -> `keepPlace` writes the tab record synchronously in the press, before `floatTabIn` and before the browser tab or the app window opens. Return to Page lands at page 7: `own` equals `#sent`, so the last branch keeps `#away`. Look: scroll to page 7, Open in New Window at once, in a browser tab and in the app; the window shows page 7; then Return to Page shows page 7.
- **4 (Copy into New Window): met by reading.** `settle()` at `store.ts:118` runs before the record is copied at :123-126, and each copy then writes its own tab id. Look: scroll and copy within 500 ms, zoom and copy at once; the copy matches; then each moves on its own.
- **5 (Maximise, Restore):** PDF part met by reading (item 4); document-tab part not verifiable here, since no code of the step touches it. Look: page 4 partway, Maximise pane, Restore panes; same page and offset; a document tab's frame does not load again.
- **6 (rebuilt PDF): met by reading.** `own` equals `#sent`, or a report is pending, so `keep = this.#away ?? (this.#applied ? this.#place() : this.#restore)` (:285). Look: rebuild at page 4; it stays.
- **7 (reload during a build): met by reading.** A missing load flushes and drops, `!held` takes `saved`, and nothing is reported before `#applied`. Look: Clean, reload, build; the saved place, never page 1.
- **8 (page beyond count): met by reading.** `#scrollTo` sets `currentPageNumber = pagesCount`. Look: the last page, no console error.
- **9: met (rerun).**
- **10: met (rerun).**
- **11 (preview retarget): met by reading.** `opening.ts:168` and :254 clear the record; the old viewer's flush writes only the old file's entry, because `drawn` names the new file (:294). Look: `b.pdf` opens at its own place or the top.
- **12 (two tabs, two rail pages, reload): met by reading.** Two tab ids, two records. Look: pages 2 and 9 survive a reload.
- **13 (hidden tab on reload): met by reading.** `drawn` is empty while hidden, and `#changed` returns while `#away` is set or the box has no size (:685). Look: shown at its saved place.
- **14 (missing or invalid): met by reading.** `#sendable` needs `ready`, and the flush before `missing` (:529) sends only the last good place.
- **15 (forward search): met by reading.** :600-601 skips `#land` while `#reveal` is set. Look: the search's place wins.
- **16 (report rate): not verifiable here.** By reading, a scroll gives at most one report per 500 ms, and each report is one `updateInstanceState` plus one `setInstanceState`. The orchestrator counts at landing.
- **17: met by reading.** `readTabPlace(undefined)` gives null and `readPdfPlaces(undefined)` gives [] (rerun covers the helpers).
- **18: met by reading.** Only a PDF mounts a viewer.
- **19: met (rerun).**
- **20: met (rerun, and `savedPlace` matches root and path).**
- **21: met by reading.** `updateInstanceState` (`ui.svelte.ts:631-636`) reads storage at the write.
- **22: met by reading.** `save` catches `setItem` and `store.current` is still updated (`ui.svelte.ts:528-542`).
- **23 (rename): met by reading, with the 500 ms limit the report states.** Look: rename an open PDF; the tab keeps its place.
- **24, 25: met (rerun).**

### Verdicts: cases of the round brief

- **1 (scroll 5 to 9, close within 500 ms): met by reading.** The dispose flush sends `#place()`. Look: reopen from Files at page 9.
- **2 (200 percent, close within 100 ms): met by reading.** `#place()` reads `viewer.currentScaleValue`, which the setter updates synchronously. Look: reopen at 200 percent.
- **3 (page 7, Open in New Window at once, browser and app): met by reading.** The write happens in the press. Look: both paths show page 7.
- **4 (copy within 500 ms; 150 percent and copy within 100 ms): met by reading.** Look: the copy shows page 7, and 150 percent.
- **5 (window, move to page 12, Return to Page): partial.**
  - In the app, the main page first scrolls to page 7 and writes page 7 into the tab record and the file's entry, then shows page 12 when the load ends (Spec 2).
  - A Return within 500 ms of the last scroll in the window lands at the place the window wrote last (Spec 3).
  - Look: in the app, move to page 12 by scrolling, wait a second, Return to Page. Watch for a flash of page 7, and read `oculus.ui.v1` right after for a page-7 write. Repeat with Return at once after a scroll.
- **6 (rebuild at page 4 with a report pending): met by reading.** `#pending` blocks the `own` branch, and :285 keeps the in-memory place.
- **7 (two tabs at 3 and 8, rebuild): met by reading.** Each tab's `own` equals its `#sent`.
- **8 (page entry 20): met by reading.** `pagechanging` comes before the scroll PDF.js makes for it, so it is discrete. The next `updateviewarea` flushes, and the scroll's timer later finds the same place and `sameAs` drops it.
- **9 (case 16 by reading): met by reading.** At most one scroll report per 500 ms, plus one per discrete change.
- **10 (rename and retarget with a report pending): met by reading.** The old file's entry gets the place, and the tab record does not (:293-294).

### 1. Spec

1. **`viewer.svelte.ts:364-374`: the side panel report misses the view update its own change made.**
   - Quoted hunk:
     ```ts
     showSide(kind: SidePanelKind): void {
         this.#setSide(this.sidebar === kind ? '' : kind);
         this.#changed(true);
     }
     #setSide(kind: SidePanelKind): void {
         this.sidebar = kind;
         this.#side.show(kind);
         this.#viewer?.update();
     }
     ```
   - What is wrong:
     - `#setSide` calls `update()`, which dispatches `updateviewarea` synchronously while `#awaiting` is still false, so `#located` sends nothing.
     - `#changed(true)` then sets `#pending` and `#awaiting` and waits for a later `updateviewarea`. Nothing produces one: PDF.js's container ResizeObserver only sets a CSS variable (`#resizeObserverCallback`), and the viewer's own observer watches `#box`, whose size the panel does not change.
     - So the panel change goes out only at the next scroll, zoom or page change, or at a flush (hide, dispose, `pagehide`, a window operation).
     - Round 0 sent it after its 100 ms timer, so the round's change for Spec 2 made this worse.
     - Round item 2 asks that a side-panel change be reported on the next `updateviewarea` after it, and that update is the one dispatched inside `#setSide`.
     - `setScroll` and `setSpread` (:346-357) call `#changed(true)` again after PDF.js's setter has already flushed. That leaves a stale pending report whose later send `sameAs` drops. It is harmless, but it also blocks the `own` branch of `open` (:278) until the next flush.
   - Failure scenario: the reader opens the thumbnails panel and, without scrolling, chooses Open in New Tab for the same PDF from Files, or another oculus page opens it. The new tab reads the file's entry and opens without the panel. Likewise, an app drag of the tab onto another window (Spec 3) carries the old panel.
   - Fix at landing: call `#changed(true)` before `#setSide` in `showSide` (and drop the second call in `setScroll` and `setSpread`).
   - Verdict: brief item 2 violated (side panel).

2. **`viewer.svelte.ts:278-283` with :655-668: Return to Page scrolls to the old place and writes it.**
   - Quoted hunk: `} else if (own !== null && !this.#pending && !sameAs(own, this.#sent)) { keep = own; this.#sent = own; }` and in `#resized`: `const place = this.#away; this.#away = null; if (place !== null) this.#scrollTo(place);`.
   - What is wrong: the `own` branch leaves `#away` (page 7, taken when the tab left) set until `#load` succeeds (`this.#away = null;` at :516). On Return to Page the File effect calls `open` first. The frame layer's next animation frame then shows the box, and `#resized` scrolls the old document to page 7. That scroll calls `#changed(false)`.
   - Because `#sentAt` dates from the window operation, `wait = Math.max(0, REPORT_EVERY_MS - (Date.now() - this.#sentAt))` (:692) is 0. The report therefore sends page 7, which differs from `#sent` (page 12), and `keepPlace` writes page 7 into the tab record and the file's entry. When the load ends, `#initialised` lands page 12, and page 12 is written again about 500 ms later.
   - In a browser the main tab is in the background, so its animation frames pause until it is shown, by which time `#initialised` has set `#away = own`. The defect is therefore the app's.
   - The report's reading of round case 5 leaves the resize scroll out.
   - Failure scenario: in the app, open a PDF in a new window at page 7, move to page 12 there, then Return to Page. The main window shows page 7, then jumps to page 12. A close or a Copy into New Window in that interval carries page 7.
   - Fix at landing: set `this.#away = null` (or `= own`) in the `own` branch.
   - Verdict: round case 5 partial.

3. **Window paths outside the four operations do not flush.**
   - Places:
     - out of a window: `pane-view.ts:440-441` (`deps.freeFloat(pane.page)`, `deps.returnFloat(pane.page)`) and `desktop-windows.svelte.ts:78` (`layout.freeFloat(float);` before `bridge.closeSelf();`);
     - onto another app window: `drag.svelte.ts:206` (`void desktop.bridge.dropOutside({ tab: id, at: point }).then((taken) => { if (!taken) layout.windowTab(...) })`).
   - Quoted hunk: `returnFloat`, `freeFloat` and `dockFloat` in `store.ts:96-102` call no `settle()`.
   - What is wrong:
     - Return to Page and Restore, run in the window's page, save the layout before that page's pending report is written. The report goes out only at the window page's hide edge or `pagehide`, so the main page may already have read the tab record.
     - A drop that another app window takes moves the tab through the target page's `drag.receive`, and the source never flushes. The target mounts the File and reads the record before the source's hide edge writes.
     - The report's judgment call 1 ("every caller, present and future, is covered") holds for the four operations, which are not every window path.
   - Failure scenario: scroll in the window from page 11 to page 12 and choose Return to Page within 500 ms; the main page opens at page 11. Or toggle the panel (Spec 1) and drag the tab onto another app window; the panel change is lost.
   - Fix at landing: `settle()` in `returnFloat`, `freeFloat` and `dockFloat`, and in the drag's `outside` before `dropOutside`.
   - Verdict: round case 5 partial (a Return within 500 ms).

### 2. Proof

None. Every count, path and line number the report quotes reproduced (see the verification block).

### 3. Standards

1. **`DESIGN.md:533` and `viewer.svelte.ts:21-23`: a sentence the diff makes false.**
   - Quoted hunks: "on PDF.js's next view update for any other change", and "A change of page that is no scroll (a page entry, Next, a link), of zoom, of a mode or of the panel is reported on PDF.js's next `updateviewarea`".
   - What is wrong: both are false for the side panel (Spec 1). The rules file ("What every package obeys") treats a sentence a change makes false as a defect.
   - Failure scenario: a maintainer trusts the comment and builds on a panel report that never comes.
   - Verdict: brief item 6 (clause), with brief item 2.
2. **The report's "Verify 7" history-word grep used its own list (`round`, `previous`, `no longer`, `used to`, `formerly`, `reverted`, `earlier`, `D15`, `bug`).**
   - What is wrong: the rules file ("What every package obeys") names 'before' and 'still' among the words to grep, and asks for each hit to be judged.
   - My grep of the added comment lines for the rules file's words gives 11 hits:
     - `store.ts:55`, `tab-frames.svelte.ts:71-72`, `File.svelte:72-75` and `viewer.svelte.ts:13`, :19-20, :285, :623-624, :111: 'before' (an order in time) and 'still' (a present state);
     - `ui.svelte.ts:629`: 'still' in "can still overwrite one another".

     None of the 11 is history, so nothing in the code is wrong; the defect is in the report's grep.
   - Failure scenario: a later reviewer takes the report's empty grep as covering the rules file's list.
   - Verdict: none.
3. **`pdf-place.ts:49`: `export type FilePlace` has no importer outside its own file.**
   - Quoted hunk: `export type FilePlace = { root: string; path: string; place: PdfPlace };` (grep above: used only at pdf-place.ts:97, :100, :112, :116).
   - What is wrong: the rules file ("The principles every package is judged on") asks that an export with no importer outside its file be removed or made local. knip does not list it, because it appears in exported signatures.
   - Failure scenario: none that costs anything; the export widens the module's surface for no caller.
   - Verdict: none.

### 4. Behaviour

1. **`viewer.svelte.ts:278-283` with `File.svelte:331-336`: two main pages sharing one arrangement now pull each other's place.**
   - Quoted hunk: the `own` branch above.
   - What is wrong:
     - Several main pages may share one arrangement (`float/browser.ts:12-13`), so both hold the same tab ids and write the same tab record, and each page's ui store takes the other's records on its `storage` event (`takeSavedInstances`, `ui.svelte.ts:519-526`).
     - The File effect calls `open` on every mount, and the panes are drawn again on a layout change or a page switch (`FrameLayer.svelte:4-8`). Page B's viewer therefore finds `own` (page A's last place) not equal to its `#sent` and jumps there.
     - Before this round, B kept its own place until a reload. This follows the round brief's rule literally ("the viewer goes to the record's place, which another page wrote").
     - The report's "User-visible changes" does not state it, with or without a before and after.
   - Failure scenario: two browser tabs of oculus show the same PDF tab, one at page 3 and one at page 20. Switching rail pages away and back, or splitting a pane, in the first tab moves its PDF to page 20.
   - Verdict: none. The orchestrator decides whether this is wanted. Option (a): keep it and state it. Option (b): limit the `own` branch to a tab returning from a window, for instance by also requiring that `#away` was taken while the tab was in a float with a window place. Option (a) is the lazy one if the jump is unwanted.

### Declined to judge

- The browser and app behaviour of every case. There is no browser suite, and no server or app may be started here, so the TEST look settles them; the look notes are with each case above. The ones that matter most:
  - Return to Page in the app (Spec 2);
  - a panel toggle followed by Open in New Tab (Spec 1);
  - a document tab under Maximise and Restore.
- PDF.js's event order inside `#setScale`, whether `update()` follows `scalechanging` synchronously. It was not read; the dispose and window flushes cover a zoom either way.
- The cost of the writes while scrolling: two `setItem` calls of the whole `oculus.ui.v1` and three parses per report, a `storage` event in every other page, and `clientWidth` and `clientHeight` read on each scroll event. A trace at the look settles it.
- A full storage combined with another page's `storage` event can revert this page's in-memory tab record to the stored one (`takeSavedInstances`), after which a redraw jumps the viewer to it (the `own` branch). It needs a full `localStorage` and two pages; it was not followed further.

Usage: ac424975e24dda3ea, claude-opus-5-5, 247,512 tokens, 60 tool uses, 13.0 min.
