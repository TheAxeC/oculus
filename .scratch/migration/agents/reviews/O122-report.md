# O122 report: a Transcript draws only what is in view

Everything in the brief is done, with two limits that stand until the look at landing: no case has been seen on a page, since a builder runs no page, and R1 (PageUp, PageDown and Home over unmeasured rows) is unverified, as ruling 4 of `O122-cases.md` says. J4 is listed for the look too.

## Open items of the state file, verbatim

The section "Open items" of `.scratch/migration/orchestrator-state.md` holds no entries (read with `sed -n 158,172p`: its heading and standing paragraph are followed by blank lines and "## Closed items").

## Rulings carried

`.scratch/migration/agents/briefs/O122-cases.md` replaced the brief where they differ. It is an untracked file in the worktree and is the orchestrator's; `git status --short` lists it.

1. S1, option (a). The function of item 8 stays as G149 says. The window also keeps the row holding a collapsed caret, beside the row holding the focus, computed apart from that function. The count case reads: at most the rows in view, plus the margin, plus the rows kept by a selection, a caret or the focus.
2. S2, option (a). The case reads: a switch to Live and back, and a switch to another tab of the pane, keep a run's press; a tab that takes another session opens at the foot, and its other session's foot is right. A target change in one tab empties the choices. `tab-session.svelte.ts` is not written.
3. S3, option (a). Item 6's first sentence is replaced by the flag `following`, set by `toFoot`, a first draw and a scroll reaching the true foot within 1 px, cleared by a scroll up from where `toFoot` put it and by a press on a run. A height change goes to the foot only while `following`, and otherwise `hold` runs. `stuck` with `SLACK` keeps deciding what an appended turn does.
4. R1, option (a). Built as ruled, named as unverified here.
5. P1. The fragment link is read for a heading with an `id` written as raw HTML.

## Cases: the first run and where the built step stands

"First run" is the reading of the unchanged tree handed back before the build. "Built" is what reading and the unit runs of the built tree reach; the quoted lines are in "Case-run programs" below. The last column is the proof at the look: the Transcript view on a scratch server, with the fixtures of the brief (960 turns, the same with a run of 500 calls, 20000 turns of mixed lengths).

| Case | First run on the unchanged tree | Built: run and result | Look: state, and what should be seen |
| --- | --- | --- | --- |
| Any size, scrolled to the head | Reading `TurnList.svelte:79`, `TurnRun.svelte:66`: every row in the page | Case file `window`: `at the head: drawn 14`, `scrolled: drawn 20 first 554 last 573`. `flat rows`: a failed run gives one row per call | All three fixtures, scroll head to foot, with the 500-call run open: `querySelectorAll('[data-row-key]')` at most the rows in view, plus the margin, plus the rows kept |
| 20000 turns | Reading `reader-place.ts:65-73`: a rect per row on each scroll; not measurable by reading | Not reachable by a unit run. `take` now walks only the drawn rows (`keyAtTop`) | 20000 turns, scroll through held turns: no long task over 100 ms, the count holds |
| Scrolling up slowly through unmeasured rows of mixed heights | Holds, no row unmeasured. The rules get it wrong from the foot (S3) | First-run part 2 gives the case behind S3; `following` covers it (`TranscriptBody.svelte:327-330`). Case file `reader place`: `row above measured +150: scrollTop 450` | Mixed heights, slow wheel up from the foot and from the middle: the row at the view's top stays within 1 px of where the scroll put it |
| Dragging the bar fast to the head | Holds. Needs the anchor dropped (J2) | `spacer at the top: held rows []` | Drag fast to the head: rows draw, older turns load, no jump on release, a later append does not go to the foot unless the reader is at it |
| A read of older turns near the head | Holds. Anchor must read the content's top (J5) | `older read keeps keys: -3 -2 run:-1 -1 0 1 2 3`; `topIn` reads `firstElementChild`, `reader-place.ts:93-96` | Reader near the head of a held list, the top row losing its head and the top run extended: words within 1 px after the measure |
| An append much taller than the estimate | Holds | Reading `TranscriptBody.svelte:273-275`: `following` calls `toFoot` on each height change; otherwise `hold` | Append a long turn. Reader at the foot: at the true foot. Reader above: nothing moves |
| A result that opens a run, inside and outside the margin | Holds; a 500-call run above the view needs the anchor kept (J3) | `failed run opens itself: ... press:run:-1:gap call:-1:none call:0:none`; `anchor row kept: drawn 21 first 0 last 587` | A failed result arrives for a run above the view, inside and outside the margin: the words stay |
| A press on a run in view, then closed | Holds | `pressed closed: -2 run:-1 1 2 3`; `pressRun` clears `following` (`:352`) | Press open, press closed, scroll out and back: the choice stands, and a press on the last run stays put |
| An image loading above the view while scrolling up | The browser anchors it today. J4 needed | `image +100 then a scroll +20, take first: scrollTop 570` (450 + 100 + 20). Frame order not verified | Slow image above the view, scroll up as it lands: no words move. J4 is proven here or not at all |
| A selection from the head to 300 rows on, by a drag and a shift-click | Drag holds; shift-click fails (S1) | Test `Transcript selection keeps its rows`; case file `kept rows`: `caret in row 2, scrolled away: drawn 21 last 573`, `row 2 kept: true` | Click in a turn at the head, scroll 300 rows, shift-click; and the same by a drag: Copy equals those turns' text and the selection stands while scrolling |
| Cmd+A then Copy | Browser's today, whole text. Ends read through a `Range` (J7) | `Cmd+A: drawn 2000 last 1999`; `cleared: drawn 20 last 573` | Cmd+A, Copy, paste: every held turn's text. Click to clear: drawn count back to the window |
| A right-click on selected text, on nothing, on a spacer | `prose-menu.ts:105-119`: a spacer acts as the gap does now | Reading: `.spacer` sits inside the `.turns` box the menu hears (`TurnList.svelte:83-86`), no change to `prose-menu.ts` | Right-click on each with a selection standing on the spacer: the same menu as now |
| Focus on a Copy button, then scrolling away | Holds natively | `focus row 564 kept: true`, `focus gone, kept: false`; round 1 program `B3`: `window lost focus, kept: true`, `focus left inside a focused window, kept: false` | Tab to a Copy button, wheel away, switch to another app and back, wheel back: `document.activeElement` is that button and the row stayed drawn |
| Tab through a stretch past the margin | Holds natively. Needs stops from data | `next stop from 0: 1 back from 1: -1`; `moveFocus` at `turn-window.svelte.ts:379` | Tab forward and back past the margin: focus reaches each row holding a focusable, in order; past the last, Tab leaves the list |
| An open `details` and a sideways-scrolled code block | Holds. Scroll must be noted on scroll | `redrawn row: open true sideways 70` | Open one, scroll one sideways, scroll both out and back: as they were |
| A fragment link to a heading in an undrawn row | See P1: nothing today for a Markdown heading | Round 1 program `B1`, over the real `turnWindow` and `readerPlace`: `reader at 5000 target row drawn: false`, `scrollToFragment wrote 22377`, `after the flush that follows: scrollTop 22491 target row drawn: true target top 0`, `after the scroll event: scrollTop 22491 target top 0`, `after the rows above it measure: scrollTop 22533 target top 0 drawn 16` | An answer with `<h2 id="x">` far away and a link `[go](#x)`: it scrolls there; in the same answer as now |
| The tab hidden with a turn arriving | Holds | `no height, scroll event: drawn 21 first 0 last 587`, `shorter list while hidden: drawn 6 first 494 last 499` | Hide the tab, let a turn arrive, show. At the foot: at the foot. In the middle: the same words |
| A session switched away and back, read per S2 | Foot holds; a press does not stand across a target change (S2) | Reading: `chosen` stays the tab's; `windowed.drop` at `:146` with the target; round 1 program `P2`, with no scroll event before the measure: `every estimate summed: 28563`, `rows measured at 321, no scroll event yet: drawn 7 list height 31331`, `dropped, drawn rows not measured again yet: drawn 13 list height 28563`, so the 2768 px the measures added are gone with `drop` | Live and back, and another tab of the pane: a run's press stands. A tab that takes another session opens at the foot, and that session's foot is right |
| A pane resized narrower | The browser anchors it today | Reading: the observer remeasures drawn rows, `hold` runs on each height change; `row above measured +150: scrollTop 450` | Narrow the pane mid-read: the words at the view's top stay, and scrolling on past old-width heights moves none |
| The text size changed | `retakeZoom` needs to ask for the measure | Reading: `retakeZoom` calls `measureDrawn` and `readMargin` (`:165-166`) | Change the size: `scrollHeight` matches the rows' sum within a pixel at a zoom other than 1 |
| A wallpaper theme | Spacers paint nothing | Reading: `.spacer` has `flex: none` and no background (`TurnList.svelte:151-153`) | A wallpaper theme, scrolled to the middle: no surface where a spacer stands |
| A session of one turn and of none, and a failed read of older turns | Unchanged | Reading: the `.older` line and the empty state are untouched; the head row's lead is `none` (`said:-2:none`) | Each state: as now, the failed read with its line and Try again |
| A transient `held.error`, then the list back | Heights stand; `stuck` returns the reader to the foot, today too | Reading: the window is made in `TranscriptBody.svelte`, so the unmounted list takes no heights with it | Force the error, clear it: heights stand, reader at the foot |
| End, Jump to the last turn, `G`, `gg` | `G` and `gg` smooth today | `key-dom.ts:106`: `instant` for `data-windowed`; `toFoot` sets `following` (`:340`) | Rows far from the estimate, each key: the true foot; `gg`: the head |
| PageUp, PageDown, Home, a link in an answer | Holds natively; R1 | Not reachable by reading or a unit run: UNVERIFIED (R1) | Over unmeasured rows press each key: it lands a page on, or the head. A key that falls short is fixed at landing. A link: as now |

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| 1 The flat rows | DONE | `flatRows`, `TurnRun.svelte` takes one row; case file `flat rows` |
| 2 A windowed list | DONE | `turn-window.svelte.ts`; case file `window` |
| 3 Heights | DONE | `measureElement` at `turn-window.svelte.ts:208`; `style:zoom` at `TurnList.svelte:92`; `.turns` has no `gap`; round 1 program `B2`: `held at mount: drawn 8 rows watched by the observer ["0","1","2","3","4","5","6","7"]` |
| 4 Dropping heights | DONE | `drop` at `TranscriptBody.svelte:146,231`; `measureDrawn` at `:165` |
| 5 One owner of `scrollTop` | DONE | `shouldAdjust...` false at `turn-window.svelte.ts:219`; `overflow-anchor: none` at `TranscriptBody.svelte:439`; `reader-place.ts` rewritten |
| 6 The foot, with S3 | DONE | `following` at `TranscriptBody.svelte:199,275,327-330,340,352`; `key-dom.ts:106` |
| 7 Older turns and a hidden tab | DONE | `readMargin` at `TranscriptBody.svelte:251`; case file lines on no height and a shorter list |
| 8 Selection, with S1 | DONE | the new test; case file `kept rows` |
| 9 A row that leaves the page | DONE | case file `kept rows`, `tabbed`; the fragment link by round 1 program `B1`: `scrollToFragment wrote 22377`, then `after the flush that follows: scrollTop 22491 target row drawn: true target top 0`, then `after the scroll event: scrollTop 22491 target top 0` |
| 10 Menu, runs and keyboard | DONE by reading, PageUp, PageDown and Home UNVERIFIED (R1) | look |
| 11 Comments and pages | DONE | `docs/HELP.md:460`; head comments read as listed below |
| Seeing any case on a page | NOT DONE, the look's | a builder runs no page |

### Checks, as printed

1. `npm run test:quick`:

```
ok      prettier (3.1 s): All matched files use Prettier code style!
ok      ASCII gate (3.6 s)
ok      svelte-kit sync (6.2 s)
ok      eslint (23.8 s)
ok      svelte-check (25.2 s): 1793659006809 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (45.2 s): Duration  17.36s (transform 13.33s, setup 0ms, import 19.94s, tests 63ms, environment 0ms)
ok      vitest checks (72.0 s): Duration  43.97s (transform 20.42s, setup 0ms, import 39.29s, tests 63.24s, environment 4ms)
test:quick: 78.5 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

2. `LC_ALL=C grep -n '[^ -~]'` over every `.ts` and `.svelte` file of the transcript folder, `key-dom.ts`, `jump.ts`, `virtual.ts`, the new test, the four diagram files and `docs/HELP.md`: printed nothing, `ascii exit 1`.

3. The new test at the base. The test file was copied to the scratchpad beside a link to the base copy's `src`, and run there, so nothing in the base copy or the worktree changed:

```
Error: Cannot find module '../../../../../src/lib/views/sessions/terminal/transcript/turn-window.svelte.ts' imported from .../scratchpad/o122round1/base-run/tests/views/sessions/terminal/transcript/turn-window.test.ts
 Test Files  1 failed (1)
      Tests  no tests
```

After the change, `npx vitest run tests/views/sessions/terminal/transcript/turn-window.test.ts --reporter=verbose`:

```
Test Files  1 passed (1)
      Tests  1 passed (1)
```

4. `git diff --stat -- package.json package-lock.json config` printed nothing (`| wc -l` gives 0).

5. Standards read: the head comments of `reader-place.ts`, `TurnRun.svelte`, `TurnList.svelte`, `turn-window.svelte.ts`, `turn-rows.ts` and `TranscriptBody.svelte`, and the new bullet of `docs/HELP.md`, were read after the last change and say what is true of the code. No departure from the standards pages is named.

### Exports, `sh utils/unused-exports.sh` against `O122-base/unused-exports.txt`

```
1c1
< Unused exports (227)
---
> Unused exports (228)
216a217
> src/lib/views/sessions/terminal/transcript/turn-window.svelte.ts: BEFORE_LIST, AFTER_LIST, selectionRows
```

That line stands, since each of the three is imported by the test G149 names, and the brief asks that test of a pure function in this file. `RowSelection` is imported the same way as a type. The exports `runKey` and `runOpen` of `turn-rows.ts`, which lost their importers in this step, are local.

### Reuse grep

`grep -rnE "flatRows|selectionRows|rowEstimate|nextStopRow|listReplaced|rowOfId|comparePoint|selectionchange|readerPlace\(|data-windowed" ../O122-base/src ../O122-base/tests` printed only the two `readerPlace` lines of the base (`reader-place.ts:57`, `TranscriptBody.svelte:146`), so no new helper had a twin.

`grep -rln "a\[href\]\|FOCUSABLE" src` names `ui/frame/quiet-focus.ts`, `ui/controls/editor/options.ts`, `shell/keys/key-dom.ts`, `views/academic/present/screen/keys.ts` and others. None of those selectors is exported in a form this view can reach and none includes `summary`, which an open `details` needs, so `turn-window.svelte.ts:142` holds a local `STOPS`.

`rowWindow`, `keptRange`, `offsetIn`, `firstWindow` and `OVERSCAN` are imported from `virtual.ts` (`turn-window.svelte.ts:44-51`), not copied.

## Terms

`docs/glossary.md` does not exist (first run: `grep: docs/glossary.md: No such file or directory`), so the diff adds or changes no glossary term.

## Files, with line counts by `wc -l`

| File | Lines | Note |
| --- | --- | --- |
| `src/lib/views/sessions/terminal/transcript/turn-window.svelte.ts` | 513 | new |
| `src/lib/views/sessions/terminal/transcript/TranscriptBody.svelte` | 463 | |
| `src/lib/views/sessions/terminal/transcript/turn-rows.ts` | 353 | |
| `src/lib/views/sessions/terminal/transcript/TurnList.svelte` | 260 | |
| `src/lib/views/sessions/terminal/transcript/reader-place.ts` | 200 | |
| `src/lib/views/sessions/terminal/transcript/TurnRun.svelte` | 162 | |
| `src/lib/shell/keys/key-dom.ts` | 109 | |
| `src/lib/views/shared/prose/jump.ts` | 134 | |
| `src/lib/ui/tree/list/virtual.ts` | 90 | comments only |
| `tests/views/sessions/terminal/transcript/turn-window.test.ts` | 56 | new |
| `docs/HELP.md` | 616 | one line added at 460 |
| `docs/diagrams/layer-views.dot` | 179 | by `npm run diagrams` |
| `docs/diagrams/layer-views.svg` | 809 | by `npm run diagrams` |
| `docs/diagrams/layers.dot` | 101 | by `npm run diagrams` |
| `docs/diagrams/layers.svg` | 556 | by `npm run diagrams` |
| `.scratch/migration/agents/reviews/O122-report.md` | | this report |

`diff -rq` of `src`, `tests`, `utils` and `config` (with `--exclude=local.yml`) against the base copy lists exactly the `src` and `tests` paths above. No path outside the write list changed. No existing test or assertion was edited; the one test file is new. Guarded entries: G149 is the new test, by title; `guarded.md:265` (G65) names `virtual.ts`, whose change is comments only. `test:quick` did not reach G65's test, `tests/ui/tree/list/virtual-rows.client.test.ts`; run alone, `npx vitest run tests/ui/tree/list/virtual-rows.client.test.ts` prints `Test Files  1 passed (1)`, `Tests  1 passed (1)`.

## Judgment calls

- J1. "take runs before a draw" means a draw of data. A height change only runs `hold`, since by then the rows have moved and a take would record the displacement.
- J2. "Nothing is taken" drops the anchor, since a stale anchor still drawn would pull the column back. The next `hold` takes one (`reader-place.ts:154-157`).
- J3. The anchor rows stay kept through a draw, and after `hold` writes, the core's public `scrollOffset` is set to `box.scrollTop` (`turn-window.svelte.ts:481-482`), so no blank frame waits for the scroll event.
- J4. `take` first puts right any drift beyond the scroll's own move (`settle`, `reader-place.ts:117-123`), which covers an image landing just before a scroll event. This rests on the browser's frame order and is listed for the look.
- J5. The anchor reads the top of the row's content under its padding, so a top row gaining padding moves no words.
- J6. A read from the start is detected in the view by `above` falling or the turn at index 0 differing (`listReplaced`), since the store has no generation and `transcript.svelte.ts` is not on the write list.
- J7. The ends use `Range.comparePoint` against the list. An end on a spacer or on `.turns` reads as the nearest drawn row, and two ends both before or both after the list give none.

Further calls the brief left open:

- `data-row-key` and `data-windowed` are the attribute names.
- The estimate's constants are in `turn-rows.ts`: lead 0, 10 and 37 px, line 22 px, head 26 px, 90 characters to a line.
- `rowOfId` matches the id as a string in a row's HTML.
- A link goes to the first drawn element carrying the id.
- Tab entering the list from outside lands on the first drawn row that holds a stop.
- A Copy control's "Copied" label resets when its row leaves the page, since that state is the control's own.
- `following` is not cleared by a scroll of 1 px or less.
- `retakeZoom` reaches the foot only through `following`.
- After a width or zoom change an undrawn row keeps the height it last had until it draws. Item 4 says "estimates"; I read that as "not yet true", because item 3 bars `measure()` and the case "scrolling on past old-width heights moves none" expects those heights to stand.
- `jump.ts` exports `named`, and a new `fragmentIds` split out of it, so that `rowOfId` tries the same ids. That is one split beyond a bare `export`, which the view needed rather than a copy of the id list.
- The Help bullet also says that Cmd+A draws every held turn and can take a moment, which item 8 and ruling 634 accept.

## Host- and user-visible changes

| What | Before | After |
| --- | --- | --- |
| The browser's Find in a Transcript | Reaches every held turn | Reaches only the turns drawn near the view; `docs/HELP.md:460` says so. For the report to the user |
| `G` and `gg` on a Transcript | Smooth scroll | Instant |
| Cmd+A on a very long session | Instant | Draws every held turn, a slow moment |
| A row far from the view | In the page | Out of the page; a Copy control's "Copied" label resets when it leaves |
| A press on the last run at the foot | Stays where the run opened | Same, through `following` |
| A fragment link to a raw HTML `id` in a far row | Scrolls | Draws the row, then scrolls, and the column stays at the heading |
| Transcript view, focus outside the list (the tab's bar, the prompt box), turns far past the view | Tab reaches the first stop of the whole list; Shift+Tab reaches the list's last stop | Tab reaches the first stop of the drawn rows; Shift+Tab reaches the last stop of the drawn rows. From inside the list, Tab walks on through rows not drawn |

## What was wrong in the brief

- Rule 8 with G149 against the shift-click case: S1, with the run under "Case-run programs", part 1. Ruled.
- The case on a session switch against `tab-session.svelte.ts:55-61`: S2. Ruled.
- Item 6 against a slow scroll up and a press on the last run: S3, with the run under part 2. Ruled.
- The fragment case against `marked`: `marked.parse('## Results\n\n[go](#results)\n', { async: false })` gives `"<h2>Results</h2>\n<p><a href=\"#results\">go</a></p>\n"`, so an agent's Markdown heading has no id: P1. Ruled.
- `docs/glossary.md` does not exist, which the brief's report shape assumes.

## Risks that stand

- R1 is unfixed and unverified. If Chrome animates PageUp, PageDown or Home, a `hold` that writes `scrollTop` during the animation stops it short. The look presses each key over unmeasured rows, and a short one is fixed at landing, by the column answering those keys at once as `G` does.
- J4 rests on frame order and is unseen.
- Find reaching only the drawn turns is accepted by the brief's decision 2 and is the one lasting loss.

## Full-list runs

Five `npm run test:quick` runs. The first was red on `tests/checks/source/comment-width.test.ts` alone, whose rerun alone passed after the fix. The second, third and fourth passed. The fifth, quoted above, passed and is repair round 1's one run after its last change. The plan's whole verify list runs at landing. No script was written other than the case-run programs and the base run of the new test, which only print, and all of them were deleted before this report was handed in.

## Repair round 1

`.scratch/migration/agents/briefs/O122-round1.md`. T2 takes no action, as that brief says.

| Item | State | Change | Proof |
| --- | --- | --- | --- |
| 1 B1 | DONE | `reader-place.ts` gains `leave` and `land`: from the press until the column has moved, `take` and `hold` do nothing. `linked` calls `leave`, and after `scrollToFragment` calls `land` and then `sync` | Program `B1` |
| 2 B2 | DONE | The attachment `measured` reads `scroller` and returns while it is null, so it runs again once the column is found. It reaches the same result as `VirtualRows.svelte:241` without a second attachment | Program `B2` |
| 3 B3 | DONE | `focusout` with no `relatedTarget` while `document.hasFocus()` is false keeps `focused` (`turn-window.svelte.ts`, `heard`) | Program `B3`. Real event order is for the look |
| 4 T1 | DONE | `firstWindow`'s comment in `virtual.ts` says what each user holds after the first rows | Read |
| 5 The report | DONE | The sections below, the B4 row, the corrections of P2 and P3, and item 9's row | This file |

### History words

`git diff -U0 -- src docs tests`, with the two new files, cut to comment lines and test titles, through `grep -nE "\b(before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands)\b"`: 19 hits.

| Hit | Judged |
| --- | --- |
| `TranscriptBody`: "heights before the new turns are drawn" | run-time order |
| `TurnList`: "spacer before a drawn row" | place on the page |
| `reader-place`: "before a draw of new data", "the place taken before it is dropped", "before anything measured it", "just before a scroll event", "before the column is written" | run-time order |
| `reader-place`: "with the column still where it was" | run-time state during a jump |
| `jump.ts`: "the heading-id prefix before it" | place in a string |
| `turn-window`: "stands before the list", "at or before it", "stand before and after it", "stands before or after it", "the height held before it" | place in the list |
| `turn-window`: "finds the virtualizer still running" | run-time state |
| `turn-window`: "A row drawn before the column is found" | run-time order |
| `turn-window`: "whose keys no longer name these turns" | run-time state after a target change or a read from the start; it compares no code |
| the test's table: "an end before the list", "wholly before the list" | place in the list |

None records history.

### Changed names

`grep -rnE "\brunOpen\b" src tests config docs README.md --exclude=local.yml`: `turn-rows.ts:114` and `:327`, both inside that file.

`grep -rnE "\brunKey\b" src/lib/views tests docs README.md config --exclude=local.yml`: `TranscriptBody.svelte:83`, `tab-session.svelte.ts:43`, `TurnRun.svelte:8`, `turn-rows.ts:20,64,113,300,313,322`. The comments name a function that stands, local to `turn-rows.ts`, and stay true. Other `runKey` hits under `src/lib/server` are unrelated functions of that name.

`TurnRun`'s props went from `calls`, `open`, `onpress` to `row`, `onpress`. `grep -rn "TurnRun\b" src tests docs README.md` outside `docs/diagrams`: `TurnList.svelte:20,40,126`, and `:126` is the one use, which passes `row`. `TurnList`'s props went from `rows`, `docOf`, `chosen`, `zoom`, `onpress`, `list` to `windowed`, `docOf`, `zoom`, `onpress`, `list`; the one use is `TranscriptBody.svelte:415`, and the comments in `Markdown.svelte:7` and `prose-menu.ts:3` name the file only.

`grep -rnE "place\.(leave|land|clear)" src tests docs`: `TranscriptBody.svelte:257,342,370,373`. No doc page or test names `runKey`, `runOpen`, `TurnRun` or `scrollRegion`; `grep -rln "Transcript" docs/*.md README.md` gives `docs/HELP.md` alone.

### Touched comments and doc paragraphs

| Place | State |
| --- | --- |
| `turn-rows.ts` head comment | rewritten |
| `turn-rows.ts` doc comments of `runKey`, `runOpen` | still true |
| `reader-place.ts` head comment and every doc comment | rewritten |
| `turn-window.svelte.ts` head comment and doc comments | new |
| `TranscriptBody.svelte` head comment | rewritten |
| `TranscriptBody.svelte` doc comments of `toFoot`, `pressRun`, `askOlder`, `scrolled` | still true |
| `TranscriptBody.svelte` doc comments of `linked`, `retakeZoom`, `holdWords` | rewritten or new |
| `TurnList.svelte` head comment and its props | rewritten |
| `TurnRun.svelte` head comment and its props | rewritten |
| `virtual.ts` line 1 paragraph, `firstWindow` | rewritten |
| `virtual.ts` doc comments of `rowWindow`, `keptRange`, `sameWindow`, `offsetIn` | still true |
| `key-dom.ts` doc comment of `scrollRegion` | rewritten |
| `jump.ts` doc comments of `fragmentIds`, `named` | rewritten |
| `jump.ts` doc comment of `scrollToFragment` | still true |
| `docs/HELP.md:458-459` | still true |
| `docs/HELP.md:460` | new |
| `docs/apps.md` | does not describe this behaviour (`grep -n "scrollRegion\|scrollToFragment\|firstWindow" docs/*.md README.md` printed nothing) |

### New keys

| Key | Empty | Duplicated | Colliding |
| --- | --- | --- | --- |
| A flat row's key, a turn's index as a string or `run:` with that index | Never: it comes from a number (`turn-rows.ts:115`) | Each index is one row, and a press has the prefix, so a press and its first call differ. A read from the start can reuse an index, and `drop` then empties everything held by key | Cannot equal `before` or `after`, which are neither a number nor prefixed. `places.get('')`, the read for no key, finds nothing |
| `BEFORE_LIST`, `AFTER_LIST` | Constants | Both ends the same give none (`:88`) | As above |
| `data-row-key` | A spacer has none, which `rowKey` reads as null | `rowBox` reads only the list's own children, so an inner element is never read | An answer's HTML cannot carry it: `ALLOW_DATA_ATTR: false` (`ui/html.ts:157`) |
| `data-windowed` | A boolean mark | One element per Transcript | `scrollRegion` reads it on the box handed to it; no other box sets it |
| A key of `looks`, `estimates`, `focused`, `asked` | `focused` is null for none; the others are row keys | One value per key | As a flat row's key; `drop` empties them |
| A fragment id | The match `^#(.+)$` needs one character and `fragmentIds` filters `''` | The first row in list order wins, as `named` takes the first element | The match is on `id="x"` or `id='x'` in a row's HTML, so an attribute whose name ends in `id` is a false hit. It draws that row, `scrollToFragment` finds nothing or the true heading, and `land` takes the place where the column stands, so nothing moves wrongly |

### Async paths

`tick()` here is `await Promise.resolve()` and then `flushSync()` (`svelte/src/internal/client/runtime.js:515-531`), since `vite.config.ts` turns on no async mode (`grep -n experimental vite.config.ts` printed nothing). No user event falls inside one, so a second press cannot interleave.

| Path | In flight | After close | Superseded |
| --- | --- | --- | --- |
| `showRow` with `linked` | `asked` keeps the row drawn. `leave` stops `take` and `hold` through the flush | `act` runs: `scrollToFragment` finds a box with no height or no row and writes nothing that shows, `land` takes nothing at no height, `sync` returns with `scroller` null | A draw in the same flush that sends the column to the foot is overtaken: `act` scrolls to the heading, and `land` takes there. Two presses: the later one's `act` runs last and wins |
| `moveFocus` | `asked` draws each row in turn until one takes the focus | `list` is null, so `row` is undefined and the loop runs out of rows, one tick each, and touches nothing | Two Tabs: the later focus wins, and each ends with `asked = null` |
| `tick().then(measureDrawn)` in `drop` | Reads the rows as drawn after the flush | `list` null returns | A second `drop` measures again, the same heights |
| `tick().then` in `retakeZoom` | As above, then `readMargin` | `measureDrawn` and `readMargin` both return with no column or list | A second zoom measures again at the new zoom |
| `tick().then(scrolled)` in `pressRun` | Reads the column after the press draws | `column` null returns | A second press reads the same column |

### Round 1 case-run program

Three files in one scratch folder, with a link `node_modules` to the worktree's, run from the worktree by `npx vitest run --config <folder>/vitest.config.mjs`. `Probe.svelte` copies `holdWords`, the drawn effect and the steps of `linked`, and mounts the real `turnWindow` and `readerPlace`. Each is gone from the scratchpad.

`vitest.config.mjs`:

```js
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const tree = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O122';
const require = createRequire(`${tree}/package.json`);
const { svelte } = await import(pathToFileURL(require.resolve('@sveltejs/vite-plugin-svelte')).href);
const here = new URL('.', import.meta.url).pathname;
export default {
    root: tree,
    cacheDir: `${here}cache`,
    plugins: [svelte({ configFile: false, compilerOptions: { runes: true } })],
    resolve: { alias: { $lib: `${tree}/src/lib`, vitest: `${tree}/node_modules/vitest/dist/index.js` }, conditions: ['browser'] },
    server: { fs: { strict: false } },
    test: { dir: here, include: ['round1.svelte.ts'], environment: 'jsdom', reporters: ['verbose'], testTimeout: 5000, server: { deps: { inline: [/svelte/] } } }
};
```

`Probe.svelte`:

```svelte
<script lang="ts">
    // The body's holdWords, its drawn effect and linked copied over the real window and place.
    let { flat, api, turnWindow, readerPlace } = $props();
    let column = $state();
    let list = $state();
    const place = readerPlace();
    const windowed = turnWindow({ column: () => column, list: () => list, rows: () => flat, anchored: place.rows });
    function holdWords(box) {
        place.hold(box, list, flat);
        windowed.sync();
    }
    $effect(() => {
        windowed.drawn;
        if (column) holdWords(column);
    });
    function scrolled() {
        place.take(column, list, flat);
    }
    function jump(key, write) {
        place.leave();
        return windowed.showRow(key, () => {
            write(column);
            place.land(column, list, flat);
            windowed.sync();
        });
    }
    api.get = () => ({ column, list, windowed, place, holdWords, jump, scrolled });
</script>

<div bind:this={column} data-column onscroll={scrolled}>
    <div bind:this={list} {@attach windowed.heard}>
        {#each windowed.drawn.rows as { row, index, gap } (row.key)}
            {#if gap > 0}<div data-spacer style:height="{gap}px"></div>{/if}
            <div data-row-key={row.key} data-index={index} {@attach windowed.measured}><button>{row.key}</button></div>
        {/each}
        {#if windowed.drawn.after > 0}<div data-spacer style:height="{windowed.drawn.after}px"></div>{/if}
    </div>
</div>
```

`round1.svelte.ts`:

```ts
// Case-run file of O122 round 1: prints what each sequence gives and asserts nothing.
import { flushSync, mount, tick, unmount } from 'svelte';
import { it } from 'vitest';
import Probe from './Probe.svelte';
const tree = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O122/src/lib/views/sessions/terminal/transcript/';
const { turnWindow } = await import(`${tree}turn-window.svelte.ts`);
const { readerPlace } = await import(`${tree}reader-place.ts`);
const { flatRows, groupTurns, rowEstimate } = await import(`${tree}turn-rows.ts`);

const said = (at: number) => ({ at: `2026-11-02T10:${String(at % 60).padStart(2, '0')}:00Z`, role: at % 2 ? 'assistant' : 'user', text: 'w', html: '<p>w</p>', cut: false, tool: null });
const rowsOf = (count: number) => flatRows(groupTurns(Array.from({ length: count }, (_, at) => said(at)), 0), new Map());

/** A layout in px: a row by its key's height, a spacer by its style, the column 600 high. */
const HEIGHT = { row: 100 };
function heightOf(node: HTMLElement): number {
    if (node.hasAttribute('data-spacer')) return parseFloat(node.style.height);
    if (node.hasAttribute('data-row-key')) return HEIGHT.row;
    return 0;
}
function topOf(node: HTMLElement): number {
    let top = 0;
    for (let at = node.previousElementSibling as HTMLElement | null; at; at = at.previousElementSibling as HTMLElement | null) top += heightOf(at);
    return top;
}
const observers: { heard: ResizeObserverCallback; nodes: Set<Element> }[] = [];
class Watcher {
    nodes = new Set<Element>();
    heard: ResizeObserverCallback;
    constructor(heard: ResizeObserverCallback) { this.heard = heard; observers.push(this); }
    observe(node: Element) { this.nodes.add(node); }
    unobserve(node: Element) { this.nodes.delete(node); }
    disconnect() { this.nodes.clear(); }
}
function fire(): void {
    for (const watcher of observers) {
        const entries = [...watcher.nodes].filter((node) => node.hasAttribute('data-row-key')).map((target) => ({ target })) as unknown as ResizeObserverEntry[];
        if (entries.length) watcher.heard(entries, watcher as unknown as ResizeObserver);
    }
}
const watched = () => observers.flatMap((watcher) => [...watcher.nodes]).filter((node) => node.hasAttribute('data-row-key')).map((node) => node.getAttribute('data-row-key'));

function install(): void {
    (window as any).ResizeObserver = Watcher;
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get() { return this.hasAttribute('data-column') ? 600 : 0; } });
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get() { return this.hasAttribute('data-column') ? 600 : 0; } });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get() { return 400; } });
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', { configurable: true, get() { const list = this.firstElementChild; return [...(list?.children ?? [])].reduce((sum: number, one) => sum + heightOf(one as HTMLElement), 0); } });
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
        if (this.hasAttribute('data-column')) return { top: 0, bottom: 600, height: 600 } as DOMRect;
        const column = this.closest('[data-column]') as HTMLElement;
        if (this.parentElement?.closest('[data-column]') === column && (this.hasAttribute('data-row-key') || this.hasAttribute('data-spacer'))) {
            const top = topOf(this) - column.scrollTop;
            return { top, bottom: top + heightOf(this), height: heightOf(this) } as DOMRect;
        }
        const row = this.closest('[data-row-key]') as HTMLElement | null;
        return row === null ? ({ top: 0, bottom: 0, height: 0 } as DOMRect) : row.getBoundingClientRect();
    };
}

function open(rows: readonly unknown[]) {
    const host = document.createElement('div');
    document.body.append(host);
    const api: { get?: () => any } = {};
    const made = mount(Probe, { target: host, props: { flat: rows, api, turnWindow, readerPlace } });
    flushSync();
    return { ...api.get!(), done: () => { unmount(made); host.remove(); } };
}

const hasRow = (list: Element, key: string) => list.querySelector(`[data-row-key="${key}"]`) !== null;

it('B2', async () => {
    install();
    const { windowed, done } = open(rowsOf(8));
    console.log('held at mount: drawn', windowed.drawn.rows.length, 'rows watched by the observer', JSON.stringify(watched().sort()));
    fire(); flushSync();
    console.log('measured: after', windowed.drawn.after, 'sum of drawn', windowed.drawn.rows.length * HEIGHT.row);
    done();
    observers.length = 0;
});

it('B1', async () => {
    install();
    const { column, list, windowed, jump, done } = open(rowsOf(400));
    fire(); flushSync();
    const settle = () => { for (let pass = 0; pass < 6; pass += 1) { fire(); flushSync(); } };
    settle();
    column.scrollTop = 5000; column.dispatchEvent(new Event('scroll')); flushSync();
    await new Promise((done) => setTimeout(done, 200));
    settle();
    column.scrollTop = 5000; column.dispatchEvent(new Event('scroll')); flushSync();
    await new Promise((done) => setTimeout(done, 200));
    settle();
    const key = rowsOf(400)[300].key;
    column.scrollTop = 5000; column.dispatchEvent(new Event('scroll')); flushSync();
    console.log('reader at', column.scrollTop, 'target row drawn:', hasRow(list, key));
    const landed = jump(key, (box: HTMLElement) => {
        const row = list.querySelector(`[data-row-key="${key}"]`) as HTMLElement;
        console.log('in the jump: target row drawn:', row !== null);
        const distance = row.getBoundingClientRect().top;
        box.scrollTop += distance;
        console.log('scrollToFragment wrote', box.scrollTop);
    });
    await landed;
    flushSync();
    console.log('after the flush that follows: scrollTop', column.scrollTop, 'target row drawn:', hasRow(list, key), 'target top', (list.querySelector(`[data-row-key="${key}"]`) as HTMLElement)?.getBoundingClientRect().top);
    column.dispatchEvent(new Event('scroll')); flushSync();
    console.log('after the scroll event: scrollTop', column.scrollTop, 'target top', (list.querySelector(`[data-row-key="${key}"]`) as HTMLElement)?.getBoundingClientRect().top);
    await new Promise((done) => setTimeout(done, 200));
    settle();
    const row = list.querySelector(`[data-row-key="${key}"]`) as HTMLElement;
    console.log('after the rows above it measure: scrollTop', column.scrollTop, 'target top', row?.getBoundingClientRect().top, 'drawn', windowed.drawn.rows.length);
    done();
    observers.length = 0;
});

it('B3', async () => {
    install();
    const { column, list, windowed, done } = open(rowsOf(400));
    for (let pass = 0; pass < 4; pass += 1) { fire(); flushSync(); }
    const button = list.querySelector('[data-row-key] button') as HTMLButtonElement;
    const key = button.parentElement!.getAttribute('data-row-key');
    button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    flushSync();
    column.scrollTop = 20000; column.dispatchEvent(new Event('scroll')); flushSync();
    const kept = () => windowed.drawn.rows.some((one: any) => one.row.key === key);
    console.log('focus in row', key, 'scrolled away, kept:', kept());
    const had = document.hasFocus;
    document.hasFocus = () => false;
    button.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    flushSync();
    column.scrollTop = 20500; column.dispatchEvent(new Event('scroll')); flushSync();
    console.log('window lost focus, kept:', kept());
    document.hasFocus = () => true;
    button.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    flushSync();
    column.scrollTop = 20900; column.dispatchEvent(new Event('scroll')); flushSync();
    console.log('focus left inside a focused window, kept:', kept());
    document.hasFocus = had;
    done();
    observers.length = 0;
});

it('P2', async () => {
    install();
    const rows = rowsOf(400);
    const { windowed, done } = open(rows);
    const held = () => windowed.drawn.after + windowed.drawn.rows.reduce((sum: number, one: any, at: number) => sum + one.gap + heights(at, one), 0);
    let heights = (_at: number, _one: any) => 321;
    HEIGHT.row = 321;
    for (let pass = 0; pass < 4; pass += 1) { fire(); flushSync(); }
    console.log('every estimate summed:', rows.reduce((sum: number, row: any) => sum + rowEstimate(row), 0));
    console.log('rows measured at 321, no scroll event yet: drawn', windowed.drawn.rows.length, 'list height', held());
    heights = (_at, one) => rowEstimate(one.row);
    windowed.drop(); flushSync();
    console.log('dropped, drawn rows not measured again yet: drawn', windowed.drawn.rows.length, 'list height', held());
    done();
    observers.length = 0;
});
```

Output, on the tree after the last change:

```
held at mount: drawn 8 rows watched by the observer ["0","1","2","3","4","5","6","7"]
measured: after 0 sum of drawn 800
reader at 5000 target row drawn: false
in the jump: target row drawn: true
scrollToFragment wrote 22377
after the flush that follows: scrollTop 22491 target row drawn: true target top 0
after the scroll event: scrollTop 22491 target top 0
after the rows above it measure: scrollTop 22533 target top 0 drawn 16
focus in row 0 scrolled away, kept: true
window lost focus, kept: true
focus left inside a focused window, kept: false
every estimate summed: 28563
rows measured at 321, no scroll event yet: drawn 7 list height 31331
dropped, drawn rows not measured again yet: drawn 13 list height 28563
 Test Files  1 passed (1)
      Tests  4 passed (4)
```

In `B1` the `scrollTop` moves from 22377 to 22533 while `target top` stays 0: the rows above the heading measure taller than their estimates, and `hold` moves the column by that much so the heading stays at the top of the view.

## Case-run programs

Run with `node <file>` from any folder, and `npx vitest run --config <config>` from the worktree, with `node` from the PATH the prompt gives. Each file lived in the scratchpad and is gone.

### First run, parts 1 and 2 (`first-run-cases.mjs`)

```js
import { createRequire } from 'node:module';
const root = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O122/';
const require = createRequire(`${root}package.json`);
const { JSDOM } = require('jsdom');
const { Virtualizer, observeElementOffset, observeElementRect, elementScroll } = await import(
    `${root}node_modules/@tanstack/virtual-core/dist/esm/index.js`
);

// Part 1: a caret in a row at the head, the row leaves the page, a shift-click 300 rows on.
{
    const { window } = new JSDOM('<div id="turns"></div>');
    const doc = window.document;
    const list = doc.getElementById('turns');
    const row = (key) => {
        const box = doc.createElement('div');
        box.dataset.row = key;
        box.textContent = `turn ${key} `;
        return box;
    };
    for (const key of [0, 1, 2]) list.append(row(key));
    const selection = window.getSelection();
    selection.collapse(list.children[1].firstChild, 3);
    console.log('caret: anchor in row', selection.anchorNode.parentElement.dataset.row);
    [...list.children].forEach((child) => child.remove());
    for (const key of [300, 301]) list.append(row(key));
    console.log(
        'row left the page: anchor node',
        selection.anchorNode.id ?? selection.anchorNode.nodeName,
        'offset',
        selection.anchorOffset,
        'collapsed',
        selection.isCollapsed
    );
    selection.extend(list.children[0].firstChild, 8);
    console.log('shift-click in row 300 copies:', JSON.stringify(selection.toString()));
}

// Part 2: at the foot, a slow scroll up inside the 40 px SLACK of TranscriptBody.svelte.
{
    const listeners = {};
    const box = {
        scrollTop: 0,
        offsetWidth: 600,
        offsetHeight: 600,
        ownerDocument: {
            defaultView: {
                ResizeObserver: class {
                    observe() {}
                    unobserve() {}
                    disconnect() {}
                },
                requestAnimationFrame: () => 0,
                cancelAnimationFrame: () => undefined,
                setTimeout: () => 0,
                clearTimeout: () => undefined,
                performance
            }
        },
        addEventListener: (name, heard) => {
            listeners[name] = heard;
        },
        removeEventListener: () => undefined,
        scrollTo: ({ top }) => {
            box.scrollTop = top;
        }
    };
    const virtualizer = new Virtualizer({
        count: 200,
        getScrollElement: () => box,
        estimateSize: () => 120,
        overscan: 5,
        observeElementRect,
        observeElementOffset,
        scrollToFn: elementScroll
    });
    virtualizer._didMount();
    virtualizer._willUpdate();
    const measured = new Set();
    for (let pass = 0; pass < 40; pass += 1) {
        for (const item of virtualizer.getVirtualItems()) {
            measured.add(item.index);
            virtualizer.resizeItem(item.index, 22);
        }
        box.scrollTop = virtualizer.getTotalSize() - 600;
        listeners.scroll();
    }
    const foot = box.scrollTop;
    console.log('at the foot: scrollTop', foot, 'rows measured', measured.size);
    for (const up of [5, 10, 15, 20, 25, 30, 35]) {
        box.scrollTop = foot - up;
        listeners.scroll();
        const fresh = virtualizer
            .getVirtualItems()
            .map((item) => item.index)
            .filter((index) => !measured.has(index));
        console.log(`up ${up} px: within SLACK ${up <= 40}, unmeasured rows drawn [${fresh}]`);
    }
}
```

Output, taken on the built tree (the program reads only `jsdom` and the core):

```
caret: anchor in row 1
row left the page: anchor node turns offset 0 collapsed true
shift-click in row 300 copies: "turn 300"
at the foot: scrollTop 19186 rows measured 43
up 5 px: within SLACK true, unmeasured rows drawn []
up 10 px: within SLACK true, unmeasured rows drawn []
up 15 px: within SLACK true, unmeasured rows drawn []
up 20 px: within SLACK true, unmeasured rows drawn [166]
up 25 px: within SLACK true, unmeasured rows drawn [166]
up 30 px: within SLACK true, unmeasured rows drawn [166]
up 35 px: within SLACK true, unmeasured rows drawn [166]
```

### The built step: `vitest.config.mjs`

```js
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const tree = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O122';
const require = createRequire(`${tree}/package.json`);
const { svelte } = await import(pathToFileURL(require.resolve('@sveltejs/vite-plugin-svelte')).href);
const here = new URL('.', import.meta.url).pathname;
export default {
    root: tree,
    cacheDir: `${here}cache`,
    plugins: [svelte({ configFile: false, compilerOptions: { runes: true } })],
    resolve: { alias: { $lib: `${tree}/src/lib`, vitest: `${tree}/node_modules/vitest/dist/index.js` }, conditions: ['browser'] },
    server: { fs: { strict: false } },
    test: { dir: here, include: ['cases.svelte.ts'], environment: 'jsdom', reporters: ['verbose'], server: { deps: { inline: [/svelte/] } } }
};
```

### The built step: `cases.svelte.ts`, beside that config

```ts
// Case-run file of O122: prints what each case gives and asserts nothing.
import { flushSync, tick } from 'svelte';
import { it } from 'vitest';
const tree = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O122/src/lib/views/sessions/terminal/transcript/';
const { turnWindow } = await import(`${tree}turn-window.svelte.ts`);
const { readerPlace } = await import(`${tree}reader-place.ts`);
const { flatRows, groupTurns, listReplaced, rowEstimate, nextStopRow, rowOfId } = await import(`${tree}turn-rows.ts`);

const said = (at: number, text = 'words', html = '<p>words</p>') => ({ at: `2026-11-02T10:${String(at % 60).padStart(2, '0')}:00Z`, role: at % 2 ? 'assistant' : 'user', text, html, cut: false, tool: null });
const call = (id: string, ok: boolean | null = true) => ({ at: '2026-11-02T10:00:00Z', role: 'tool', text: '', html: '', cut: false, tool: { id, name: 'Bash', summary: 's', ok } });

it('flat rows', () => {
    const turns = [said(0), call('a'), call('b', false), said(1), call('c'), said(2)];
    const flat = flatRows(groupTurns(turns, 2), new Map());
    console.log('failed run opens itself:', flat.map((r: any) => `${r.kind}:${r.key}:${r.lead}`).join(' '));
    const closed = flatRows(groupTurns(turns, 2), new Map([['a', 'closed']]));
    console.log('pressed closed:', closed.map((r: any) => r.key).join(' '));
    console.log('estimates:', flat.map((r: any) => rowEstimate(r)).join(' '));
    const older = [said(9), ...turns];
    console.log('older read keeps keys:', flatRows(groupTurns(older, 3), new Map()).map((r: any) => r.key).join(' '));
    console.log('next stop from 0:', nextStopRow(flat, 0, 1), 'back from 1:', nextStopRow(flat, 1, -1));
    console.log('raw id row:', rowOfId(flatRows(groupTurns([said(1, 'x', '<h2 id="x">X</h2>')], 0), new Map()), ['x']));
    console.log('replaced: append', listReplaced({ turns, above: 0 }, { turns: [...turns, said(3)], above: 0 }), 'older', listReplaced({ turns, above: 0 }, { turns: older, above: 1 }), 'above fell', listReplaced({ turns: older, above: 1 }, { turns, above: 0 }), 'other turn', listReplaced({ turns, above: 0 }, { turns: [said(7), ...turns.slice(1)], above: 0 }));
});

/** A column with a fake layout: rows of known heights, spacers from the list's style. */
function layout() {
    const column = document.createElement('div');
    const list = document.createElement('div');
    column.append(list);
    let height = 600;
    Object.defineProperty(column, 'offsetHeight', { get: () => height });
    Object.defineProperty(column, 'clientHeight', { get: () => height });
    Object.defineProperty(column, 'offsetWidth', { get: () => (height ? 400 : 0) });
    return { column, list, setHeight: (next: number) => (height = next) };
}

it('window', async () => {
    const { column, list, setHeight } = layout();
    let rows = $state.raw(flatRows(groupTurns(Array.from({ length: 2000 }, (_, at) => said(at)), 0), new Map()));
    let keep: string[] = [];
    let windowed: any;
    const stop = $effect.root(() => {
        windowed = turnWindow({ column: () => column, list: () => list, rows: () => rows, anchored: () => keep });
        $effect(() => { windowed.drawn; });
    });
    flushSync();
    const report = (name: string) => console.log(name, 'drawn', windowed.drawn.rows.length, 'first', windowed.drawn.rows[0]?.index, 'last', windowed.drawn.rows.at(-1)?.index, 'gap0', windowed.drawn.rows[0]?.gap, 'after', windowed.drawn.after);
    report('at the head:');
    column.scrollTop = 40000; column.dispatchEvent(new Event('scroll')); flushSync();
    report('scrolled:');
    windowed.sync(); flushSync();
    keep = ['0']; column.scrollTop = 41000; column.dispatchEvent(new Event('scroll')); flushSync();
    report('anchor row kept:'); keep = [];
    setHeight(0); column.dispatchEvent(new Event('scroll')); flushSync();
    report('no height, scroll event:');
    rows = rows.slice(0, 500); flushSync();
    report('shorter list while hidden:');
    setHeight(600); column.scrollTop = 0; column.dispatchEvent(new Event('scroll')); flushSync();
    report('back:');
    const box = document.createElement('div');
    list.append(box); box.setAttribute('data-row-key', '100'); box.setAttribute('data-index', '100');
    box.getBoundingClientRect = () => ({ height: 321, top: 0, bottom: 321 }) as DOMRect;
    windowed.measured(box); flushSync();
    console.log('measured key 100 before', windowed.drawn.after);
    windowed.drop(); flushSync(); await tick();
    console.log('after drop', windowed.drawn.after);
    stop();
});

/** A list of drawn rows at known heights over a column. */
function fakeList(rows: { key: string; height: number; spacer?: boolean }[], box: { scrollTop: number }) {
    const make = (row: (typeof rows)[number], at: number) => ({
        getAttribute: () => (row.spacer ? null : row.key),
        firstElementChild: null,
        getBoundingClientRect: () => {
            const top = rows.slice(0, at).reduce((sum, one) => sum + one.height, 0) - box.scrollTop;
            return { top, bottom: top + row.height };
        }
    });
    return { get children() { return rows.map(make); } } as unknown as Element;
}

it('reader place', () => {
    const box = { scrollTop: 300, clientHeight: 600, scrollHeight: 5000, getBoundingClientRect: () => ({ top: 0 }) } as unknown as Element & { scrollTop: number };
    const rows = [{ key: '0', height: 200 }, { key: '1', height: 200 }, { key: '2', height: 200 }, { key: '3', height: 200 }];
    const flat = rows.map(({ key }, at) => ({ key, at, kind: 'said' })) as any;
    const list = fakeList(rows, box);
    const place = readerPlace();
    place.take(box, list, flat);
    console.log('held rows', place.rows().join(','));
    rows[0].height = 350;
    place.hold(box, list, flat);
    console.log('row above measured +150: scrollTop', box.scrollTop);
    rows[0].height = 450;
    box.scrollTop += 20;
    place.take(box, list, flat);
    console.log('image +100 then a scroll +20, take first: scrollTop', box.scrollTop);
    const spacer = [{ key: 's', height: 4000, spacer: true }, { key: '9', height: 100 }];
    box.scrollTop = 1000;
    place.take(box, fakeList(spacer, box), flat);
    console.log('spacer at the top: held rows', JSON.stringify(place.rows()));
});

it('kept rows', async () => {
    const { column, list } = layout();
    document.body.append(column);
    const rows = flatRows(groupTurns(Array.from({ length: 2000 }, (_, at) => said(at, 'w', at === 1500 ? '<a href="x">l</a>' : '<p>w</p>')), 0), new Map());
    let windowed: any;
    const stop = $effect.root(() => {
        windowed = turnWindow({ column: () => column, list: () => list, rows: () => rows, anchored: () => [] });
        $effect(() => { windowed.drawn; });
    });
    flushSync();
    const undo = windowed.heard(list);
    const count = (name: string) => console.log(name, 'drawn', windowed.drawn.rows.length, 'last', windowed.drawn.rows.at(-1)?.index);
    const draw = () => {
        list.replaceChildren(...windowed.drawn.rows.map(({ row, index }: any) => {
            const box = document.createElement('div');
            box.setAttribute('data-row-key', row.key);
            box.setAttribute('data-index', String(index));
            box.textContent = row.key;
            if (index === 3) box.innerHTML = '<details><summary>s</summary>x</details><pre>c</pre>';
            return box;
        }));
    };
    const picked = () => { document.dispatchEvent(new Event('selectionchange')); flushSync(); };
    draw();
    const selection = document.getSelection()!;
    selection.collapse(list.children[2].firstChild, 0);
    picked();
    column.scrollTop = 40000; column.dispatchEvent(new Event('scroll')); flushSync();
    count('caret in row 2, scrolled away:');
    console.log('row 2 kept:', windowed.drawn.rows.some((r: any) => r.index === 2));
    selection.removeAllRanges(); picked();
    selection.setBaseAndExtent(document.documentElement, 0, document.documentElement, 2);
    picked();
    count('Cmd+A:');
    selection.removeAllRanges(); picked();
    count('cleared:');
    draw();
    const row = list.children[10];
    row.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    const key = row.getAttribute('data-row-key');
    flushSync();
    column.scrollTop = 0; column.dispatchEvent(new Event('scroll')); flushSync();
    console.log('focus row', key, 'kept:', windowed.drawn.rows.some((r: any) => r.row.key === key));
    row.dispatchEvent(new FocusEvent('focusout', { bubbles: true })); flushSync();
    console.log('focus gone, kept:', windowed.drawn.rows.some((r: any) => r.row.key === key));
    draw();
    const details = list.querySelector('details')!; details.open = true;
    details.dispatchEvent(new Event('toggle'));
    const pre = list.querySelector('pre')!; pre.scrollLeft = 70; pre.dispatchEvent(new Event('scroll'));
    const fresh = document.createElement('div');
    fresh.setAttribute('data-row-key', '3'); fresh.setAttribute('data-index', '3');
    fresh.innerHTML = '<details><summary>s</summary>x</details><pre>c</pre>';
    windowed.measured(fresh);
    console.log('redrawn row: open', fresh.querySelector('details')!.open, 'sideways', fresh.querySelector('pre')!.scrollLeft);
    undo(); stop(); column.remove();
    await tick();
});
```

Output, taken before repair round 1 and not run again in it. The two lines `measured key 100 before` and `after drop` show no height dropped: the first measure was skipped while the core read the column as scrolling, and the larger number is the height arriving. Program `P2` of round 1 is the run for that.

```
failed run opens itself: said:-2:none press:run:-1:gap call:-1:none call:0:none said:1:gap call:2:gap said:3:exchange
pressed closed: -2 run:-1 1 2 3
estimates: 48 32 22 22 58 32 85
older read keeps keys: -3 -2 run:-1 -1 0 1 2 3
next stop from 0: 1 back from 1: -1
raw id row: 0
replaced: append false older false above fell true other turn true
at the head: drawn 14 first 0 last 13 gap0 0 after 141999
scrolled: drawn 20 first 554 last 573 gap0 39574 after 101959
anchor row kept: drawn 21 first 0 last 587 gap0 0 after 100958
no height, scroll event: drawn 21 first 0 last 587 gap0 0 after 100958
shorter list while hidden: drawn 6 first 494 last 499 gap0 35284 after 0
back: drawn 14 first 0 last 13 gap0 0 after 34749
measured key 100 before 34749
after drop 34985
held rows 1,1
row above measured +150: scrollTop 450
image +100 then a scroll +20, take first: scrollTop 570
spacer at the top: held rows []
caret in row 2, scrolled away: drawn 21 last 573
row 2 kept: true
Cmd+A: drawn 2000 last 1999
cleared: drawn 20 last 573
focus row 564 kept: true
focus gone, kept: false
redrawn row: open true sideways 70
 Test Files  1 passed (1)
      Tests  4 passed (4)
```
