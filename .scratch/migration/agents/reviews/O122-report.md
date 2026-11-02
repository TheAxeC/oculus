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
| Focus on a Copy button, then scrolling away | Holds natively | `focus row 564 kept: true`, `focus gone, kept: false` | Tab to a Copy button, wheel away, wheel back: focus stayed, the row stayed drawn |
| Tab through a stretch past the margin | Holds natively. Needs stops from data | `next stop from 0: 1 back from 1: -1`; `moveFocus` at `turn-window.svelte.ts:379` | Tab forward and back past the margin: focus reaches each row holding a focusable, in order; past the last, Tab leaves the list |
| An open `details` and a sideways-scrolled code block | Holds. Scroll must be noted on scroll | `redrawn row: open true sideways 70` | Open one, scroll one sideways, scroll both out and back: as they were |
| A fragment link to a heading in an undrawn row | See P1: nothing today for a Markdown heading | `raw id row: 0`; `linked` at `TranscriptBody.svelte:358-369` | An answer with `<h2 id="x">` far away and a link `[go](#x)`: it scrolls there; in the same answer as now |
| The tab hidden with a turn arriving | Holds | `no height, scroll event: drawn 21 first 0 last 587`, `shorter list while hidden: drawn 6 first 494 last 499` | Hide the tab, let a turn arrive, show. At the foot: at the foot. In the middle: the same words |
| A session switched away and back, read per S2 | Foot holds; a press does not stand across a target change (S2) | Reading: `chosen` stays the tab's; `windowed.drop` at `:146` with the target; `after drop 34985` against `measured key 100 before 34749` shows a measured height dropped | Live and back, and another tab of the pane: a run's press stands. A tab that takes another session opens at the foot, and that session's foot is right |
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
| 3 Heights | DONE | `measureElement` at `turn-window.svelte.ts:208`; `style:zoom` at `TurnList.svelte:92`; `.turns` has no `gap` |
| 4 Dropping heights | DONE | `drop` at `TranscriptBody.svelte:146,231`; `measureDrawn` at `:165` |
| 5 One owner of `scrollTop` | DONE | `shouldAdjust...` false at `turn-window.svelte.ts:219`; `overflow-anchor: none` at `TranscriptBody.svelte:439`; `reader-place.ts` rewritten |
| 6 The foot, with S3 | DONE | `following` at `TranscriptBody.svelte:199,275,327-330,340,352`; `key-dom.ts:106` |
| 7 Older turns and a hidden tab | DONE | `readMargin` at `TranscriptBody.svelte:251`; case file lines on no height and a shorter list |
| 8 Selection, with S1 | DONE | the new test; case file `kept rows` |
| 9 A row that leaves the page | DONE | case file `kept rows`, `linked`, `tabbed` |
| 10 Menu, runs and keyboard | DONE by reading, PageUp, PageDown and Home UNVERIFIED (R1) | look |
| 11 Comments and pages | DONE | `docs/HELP.md:460`; head comments read as listed below |
| Seeing any case on a page | NOT DONE, the look's | a builder runs no page |

### Checks, as printed

1. `npm run test:quick`:

```
ok      prettier (3.0 s): All matched files use Prettier code style!
ok      ASCII gate (3.2 s)
ok      svelte-kit sync (5.8 s)
ok      eslint (14.1 s)
ok      svelte-check (14.1 s): 1793656927324 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (28.7 s): Duration  12.93s (transform 10.33s, setup 0ms, import 14.67s, tests 72ms, environment 0ms)
ok      vitest checks (48.1 s): Duration  31.99s (transform 13.48s, setup 0ms, import 27.14s, tests 45.59s, environment 2ms)
test:quick: 54.4 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

2. `LC_ALL=C grep -n '[^ -~]'` over every `.ts` and `.svelte` file of the transcript folder, `key-dom.ts`, `jump.ts`, `virtual.ts`, the new test, the four diagram files and `docs/HELP.md`: printed nothing, `non-ASCII grep exit 1`.

3. The new test at the base. The test file was copied to the scratchpad beside a link to the base copy's `src`, and run there, so nothing in the base copy or the worktree changed:

```
Error: Cannot find module '../../../../../src/lib/views/sessions/terminal/transcript/turn-window.svelte.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o122cases/base-run/tests/views/sessions/terminal/transcript/turn-window.test.ts
 Test Files  1 failed (1)
      Tests  no tests
```

After the change, `npx vitest run tests/views/sessions/terminal/transcript/turn-window.test.ts --reporter=verbose`:

```
turn-window > Transcript selection keeps its rows 1ms
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

4. `git diff --stat -- package.json package-lock.json config` printed nothing (`| wc -l` gives 0).

5. Standards read: the head comments of `reader-place.ts`, `TurnRun.svelte`, `TurnList.svelte`, `turn-window.svelte.ts`, `turn-rows.ts` and `TranscriptBody.svelte`, and the new bullet of `docs/HELP.md`, were read after the last change and say what is true of the code. `virtual.ts` line 1 no longer says explorer only. No departure from the standards pages is named.

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
| `src/lib/views/sessions/terminal/transcript/turn-window.svelte.ts` | 506 | new |
| `src/lib/views/sessions/terminal/transcript/TranscriptBody.svelte` | 458 | |
| `src/lib/views/sessions/terminal/transcript/turn-rows.ts` | 353 | |
| `src/lib/views/sessions/terminal/transcript/TurnList.svelte` | 260 | |
| `src/lib/views/sessions/terminal/transcript/reader-place.ts` | 180 | |
| `src/lib/views/sessions/terminal/transcript/TurnRun.svelte` | 162 | |
| `src/lib/shell/keys/key-dom.ts` | 109 | |
| `src/lib/views/shared/prose/jump.ts` | 134 | |
| `src/lib/ui/tree/list/virtual.ts` | 88 | comment only |
| `tests/views/sessions/terminal/transcript/turn-window.test.ts` | 56 | new |
| `docs/HELP.md` | 616 | one line added at 460 |
| `docs/diagrams/layer-views.dot` | 179 | by `npm run diagrams` |
| `docs/diagrams/layer-views.svg` | 809 | by `npm run diagrams` |
| `docs/diagrams/layers.dot` | 101 | by `npm run diagrams` |
| `docs/diagrams/layers.svg` | 556 | by `npm run diagrams` |
| `.scratch/migration/agents/reviews/O122-report.md` | | this report |

`diff -rq` of `src`, `tests`, `utils` and `config` (with `--exclude=local.yml`) against the base copy lists exactly the `src` and `tests` paths above. No path outside the write list changed. No existing test or assertion was edited; the one test file is new. Guarded entries: G149 is the new test, by title; `guarded.md:265` names `virtual.ts`, whose change is a comment, and `test:quick` ran the tests reaching it.

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
| A fragment link to a raw HTML `id` in a far row | Scrolls | Draws the row, then scrolls |

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

Four `npm run test:quick` runs. The first was red on `tests/checks/source/comment-width.test.ts` alone, whose rerun alone passed after the fix. The second, third and fourth passed: the third followed `runKey` and `runOpen` going local, and the fourth, quoted above, followed the last change, one comment line in `TranscriptBody.svelte`. The plan's whole verify list runs at landing. No script was written other than the case-run programs and the base run of the new test, which only print, and all of them were deleted before this report was handed in.

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

Output, on the built tree after the last change:

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
