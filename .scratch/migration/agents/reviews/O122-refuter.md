# Review of O122

Worst finding: B1. A fragment link to a heading in an undrawn row scrolls there and is pulled straight back to where the reader stood, so the case is unmet.

## Verification lines

Run from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O122`.

1. `npm run test:quick`:

```
test:quick: 17 changed file(s), from git since HEAD
test:quick: 11 test file(s)
ok      prettier (1.9 s): All matched files use Prettier code style!
ok      ASCII gate (2.1 s)
ok      svelte-kit sync (4.2 s)
ok      eslint (3.7 s)
ok      svelte-check (14.4 s): 1793657293607 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (31.4 s): Duration  13.29s (transform 10.86s, setup 0ms, import 15.64s, tests 51ms, environment 1ms)
ok      vitest checks (50.0 s): Duration  31.68s (transform 14.20s, setup 0ms, import 29.78s, tests 41.91s, environment 2ms)
test:quick: 54.6 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

2. `LC_ALL=C grep -n '[^ -~]'` over `docs/HELP.md`, the four diagram files, `key-dom.ts`, `virtual.ts`, the transcript folder's `.svelte` and `.ts` files, `jump.ts` and the new test printed nothing: `ascii exit 1`.

3. The new test at the base, run from the scratchpad over a link to `.agents/worktrees/O122-base/src`:

```
Error: Cannot find module '../../../../../src/lib/views/sessions/terminal/transcript/turn-window.svelte.ts' imported from .../scratchpad/base-run/tests/views/sessions/terminal/transcript/turn-window.test.ts
 Test Files  1 failed (1)
      Tests  no tests
```

After the change, `npx vitest run tests/views/sessions/terminal/transcript/turn-window.test.ts --reporter=verbose`:

```
turn-window > Transcript selection keeps its rows 1ms
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

4. `git diff --stat -- package.json package-lock.json config | wc -l` printed 0, and `git diff 4ffed7fbe --stat -- package.json package-lock.json config | wc -l` printed 0.

5. Standards read: done by this review, findings below.

Commands the report quotes:

- `sh utils/unused-exports.sh` against `../O122-base/unused-exports.txt` gives the report's diff: 227 to 228, and the line `turn-window.svelte.ts: BEFORE_LIST, AFTER_LIST, selectionRows`.
- `first-run-cases.mjs`, rebuilt from the report's source, prints the report's lines.
- `cases.svelte.ts` with `vitest.config.mjs`, rebuilt from the report's source, prints the report's lines exactly, `Tests 4 passed (4)`. One line is misread: see P2.
- `npx vitest run tests/ui/tree/list/virtual-rows.client.test.ts` (run because of P3): `Tests 1 passed (1)`.

`git status --short` shows only the step's paths.

## Verdicts: What to build

| Item | Verdict | Evidence |
| --- | --- | --- |
| 1 Flat rows | holds | `flatRows` at `turn-rows.ts:95-124`. Keys as the item says. `TurnRun.svelte` draws one row; its look compared with the base by reading. |
| 2 Windowed list | holds | `turn-window.svelte.ts`, made in `TranscriptBody.svelte:126`. `rowWindow`, `keptRange`, `offsetIn` imported. Spacers at `TurnList.svelte:85-87,135-137`. |
| 3 Heights | violated (B2) | Rows drawn before the column is found are never measured or observed. The rest of the item holds: value by `getBoundingClientRect`, zoom on each row, no `gap`, lead from data, estimate once per key, `data-index` at every draw. |
| 4 Dropping heights | holds | `drop` at `TranscriptBody.svelte:146,231`; `retakeZoom` asks for the measure. Judged: an undrawn row keeping its last measured height (see below). |
| 5 One owner of `scrollTop` | holds | Core correction off at `turn-window.svelte.ts:219`; `overflow-anchor: none`; `take` and `hold` by key. J4 judged below. |
| 6 The foot, with ruling 3 | holds | `following`, `footTop`, `TRUE_FOOT`; effect at `TranscriptBody.svelte:271-278`; `key-dom.ts:106`. |
| 7 Older turns and a hidden tab | holds | `readMargin` in the draw effect; the no-height path of `measureElement`; the `index < rows.length` filter; held window through `rowWindow`. |
| 8 Selection, with ruling 1 | holds | `selectionRows`, `caret` apart from it, `focused` kept, `selectionchange` listener. |
| 9 A row that leaves the page | violated (B1) | Held `details` and sideways scroll, and Tab, hold by reading. The fragment link does not end at the heading. |
| 10 Menu, runs and keyboard | holds by reading | `prose-menu.ts` is unchanged and a spacer lies inside `.turns`. PageUp, PageDown and Home are unverified as ruling 4 allows; the look at landing settles them. |
| 11 Comments and pages | holds | `docs/HELP.md:460`; head comments read. One function comment is made false: T1. |

Judged points the brief asked for:

- **Undrawn row keeps its last measured height against item 4's "estimates":** no finding. Item 3 bars `measure()`, resetting undrawn rows would move every height and the bar, and the case itself says "old-width heights". The head comment of `turn-window.svelte.ts` states it.
- **`jump.ts` going past a bare export:** no finding. The id list did not exist as a value, so `rowOfId` could only reuse it by splitting it out. The alternative was a copy of it, and the report names the split.
- **J4 `settle`:** no false correction found by reading. Every write that moves the column either clears the anchor or updates `kept.scroll`, and `take` runs before the core's listener. Frame order stays for the look.
- **`virtual.ts` and `key-dom.ts` for other users:** code unchanged for the tree in `virtual.ts`. `scrollRegion` has one caller (`workbench-keys.svelte.ts:242`) passing an `HTMLElement`, and keeps `smooth` for a box with no `data-windowed`.
- **`rows` replaced by a shorter list:** the `index < rows.length` filter and `isIndexInRange` guard it.

## Verdicts: Cases

| Case | Verdict | Note |
| --- | --- | --- |
| Any size, at the head | not verifiable | The count at the look settles it. Case-run reproduced `drawn 20`. |
| 20000 turns | not verifiable | A trace of long tasks at the look settles it. |
| Slow scroll up, unmeasured rows | not verifiable | No defect found by reading. The look settles it. |
| Fast drag to the head | not verifiable | No defect found by reading. |
| Read of older turns near the head | not verifiable | No defect found by reading; anchor rows stay kept through the index shift. |
| Taller append | not verifiable | `following` path read. |
| Result opens a run above the view | not verifiable | Read as a hold by key. |
| Press in view, then closed | met | `chosen` lives on the tab; `flat pressed closed` line. |
| Image above while scrolling up | not verifiable | J4, frame order. |
| Selection, head to 300 rows on | not verifiable | Function tested; Copy needs a page. |
| Cmd+A then Copy | not verifiable | The real ends Chrome reports after Cmd+A settle it. The case-run assumes `documentElement` 0 to 2. |
| Right-click, three places | met | By reading. |
| Focus on Copy, scroll away | partial (B3) | Holds until the window loses focus. |
| Tab past the margin | not verifiable | Read as right; the look settles it. See B4 for entering the list. |
| `details` and sideways code | met | By reading: `{@html}` is a template block and the attachment an effect, and `SIDEWAYS` matches `Markdown.svelte:321,370`. |
| Fragment link to an undrawn row | unmet (B1) | Case-in-page half: as now. |
| Tab hidden, turn arrives | not verifiable | Read as right. |
| Session switched, per ruling 2 | not verifiable | The press stands by reading; the foot needs the look. |
| Pane narrower | not verifiable | Read as right. |
| Text size | not verifiable | `scrollHeight` against the rows' sum at the look settles it. |
| Wallpaper | met | `.spacer` paints nothing. |
| One turn, none, failed older | met | By reading. |
| Transient `held.error` | met | By reading; the window outlives the list. |
| End, Jump, `G`, `gg` | not verifiable | Read as right. |
| PageUp, PageDown, Home, a link | not verifiable | R1; the look presses each key. |

## Spec

**S1. The report leaves out four parts `agents/spec.md` requires.**

Place: `.scratch/migration/agents/reviews/O122-report.md`. Missing:

- The grep of added comment lines and test titles for the history words, each hit judged (`spec.md:44`).
- The grep of each changed name across `src`, `tests`, `config`, `docs` and `README.md` (`spec.md:72`). `runKey`, `runOpen` and `TurnRun`'s props are changed names.
- The list of every touched comment and doc paragraph as "still true" or "rewritten" (`spec.md:72`). The report has one sentence over six files.
- What the code does for each new key when empty, duplicated or colliding, and for each async path in flight, after close and superseded (`spec.md:73`). `showRow`, `moveFocus` and `tick().then(...)` are such paths.

Failure scenario: a defect of the async kind has no statement to be checked against. B1 is an async path superseded by a draw, and that section would have had to trace it.

My own grep of the history words over the added lines hit only "before" and "now"-free run-time uses (7 hits, each run-time), so no history defect stands. The report still owes the grep.

## Proof

**P1. Item 9 is DONE on evidence that does not reach the fragment link's result.**

Place: report line 40, `raw id row: 0`, `linked` at `TranscriptBody.svelte:358-369`.

That line shows `rowOfId` finds a row. Nothing in the report runs the sequence through `showRow` and a draw. B1 is what that run shows.

**P2. A case-run line is read backwards.**

Place: report line 42: "`after drop 34985` against `measured key 100 before 34749` shows a measured height dropped".

- 34749 is the value printed at `back:`, so `windowed.measured(box)` changed nothing. The core skipped it because `isScrolling` was true after the scroll event (`index.js` `measureElement`, `(!this.isScrolling || this.scrollState)`).
- 34985 - 34749 = 236 = 321 - 85, the row's measured height less its estimate (37 + 26 + 22).
- So the larger number is the height arriving, through `drop`'s `measureDrawn`. The pair shows no height dropped.

By reading, `drop` does clear the heights, so the behaviour stands and only its evidence fails. The S2 row needs a run that measures with no scroll event just before it.

**P3. The G65 claim does not reproduce.**

Place: report line 155: "`guarded.md:265` names `virtual.ts`, whose change is a comment, and `test:quick` ran the tests reaching it."

The 11 test files `test:quick` lists do not include `tests/ui/tree/list/virtual-rows.client.test.ts`, which is G65's test. Spec line 60 says a step touching an entry's code runs that entry's test. Run alone here it passes (`Tests 1 passed (1)`), so nothing is broken; the claim is wrong.

## Standards

**T1. A comment in a file the step changed is false for the new user.**

Place: `src/lib/ui/tree/list/virtual.ts:71-75`:

```
 * The window a list draws before it has found its scroll box, on the server and at the first
 * render in the page: the first rows, as many as two overscans. The rows after them are held by
 * the list at the row height its tokens give, since no row has been measured yet.
```

Line 1 now says the file serves a Transcript too. `firstWindow`'s `after` is 0 and the Transcript holds nothing after those rows, so the last sentence is true only of `VirtualRows.svelte`.

Failure scenario: a reader of the shared rule expects a held height the Transcript does not give, and that absence is the state B2 starts from.

**T2. Four runs of the list where spec line 26 allows two on this path.**

Place: report "Full-list runs". The spec allows a run, a fix, and one more run. The third and fourth followed changes made after a green run. Each was needed once the change was made, so this costs tokens only. Raised because line 26 calls such a run a finding.

## Behaviour

**B1. A fragment link to a heading in an undrawn row scrolls there and is pulled back.**

Place: `TranscriptBody.svelte:365-370`, with `turn-window.svelte.ts:371-376,488-492` and `reader-place.ts:154-157`:

```
following = false;
place.clear();
void windowed.showRow(key, () => {
    scrollToFragment(view, fragment);
    windowed.sync();
});
```

What is wrong:

1. `asked = key` changes the window, so the flush inside `tick()` runs the effect at `:271-278`.
2. That effect's `hold` finds no anchor and takes one at the reader's old place (`if (kept === null) { take(...) }`). This undoes `place.clear()`.
3. `act` writes `scrollTop`, and `sync` moves the window at once, before any scroll event can take a new place.
4. The next flush runs `hold` with the old anchor. `keptRows` keeps that row drawn, and `hold` moves the column back by the whole distance.

Failure scenario, run with a probe that mounts the real `turnWindow` and `readerPlace` with the body's `holdWords` and its drawn effect copied in, over a fake layout of 400 rows of 100 px, reader at 5000, target row 300 not drawn:

```
reader at 5000 target row drawn: false
scrollToFragment wrote 22097
after the flush that follows: scrollTop 5000 target row drawn: false
after the scroll event: scrollTop 5000
```

The reader presses the link and nothing visible happens. Tab does not hit this: `moveFocus` calls no `sync`, so the window stays put until the scroll event takes a new place.

**B2. Rows drawn before the column is found are never measured or watched.**

Place: `turn-window.svelte.ts:260` (`if (scroller === null) return firstWindow(rows.length);`) with `:456-461`.

- A child's attachment runs before `turnWindow`'s `$effect` sets `scroller`. `options.count` is then 0, and the core's `measureElement` returns at `isIndexInRange` before it observes the node.
- The keyed rows keep their elements and their stable attachment never runs again.
- `VirtualRows.svelte:241` avoids this by swapping `idle` for `measureAt` once the box is found.

Run, same probe:

```
held at mount: drawn 8 rows watched by the observer []
arrived after mount: drawn 8 rows watched by the observer ["0","1","2","3","4","5","6","7"]
```

Reachable when turns are already in the store at mount: a second tab on a session another tab shows (`showing` counts viewers).

Failure scenario: a short session of about ten long answers in that second tab.

- The core holds the estimates, so it thinks the list is far shorter than it is. It puts rows outside the window into spacers at estimated heights, which breaks "`scrollHeight` equals the rows' sum" for as long as they stand.
- An image loading in such a row reaches no observer, so `hold` does not run and words below it move.
- By reading, not run: in the same state `toFoot` at `:254-258` reads a `scrollHeight` of only the first-window rows, so `askOlder` asks for one read of older turns the reader did not near.

**B3. Focus in a kept row is lost when the window loses focus.**

Place: `turn-window.svelte.ts:440-447`:

```
const next = event.relatedTarget;
if (!(next instanceof Node) || !list.contains(next)) focused = null;
```

A window blur fires `focusout` with `relatedTarget` null while `document.activeElement` stays. `focused` becomes null, `keptRows` drops the row, and the row leaves the page.

Failure scenario: Tab to a Copy button, scroll away, switch to another app and back. The row is gone and focus falls to the body. Before the step, focus survived an app switch. This is by reading of the event order, and the look settles it: repeat that sequence and check `document.activeElement`.

**B4. A visible change named only as a judgment call, with no before and after.**

Place: report line 173, "Tab entering the list from outside lands on the first drawn row that holds a stop". It is missing from "Host- and user-visible changes".

Before, Tab from outside reached the first stop of the list. Now it reaches the first stop of the drawn rows, and Shift+Tab from the prompt box reaches the last drawn one instead of the list's last. Spec line 61 counts tab stops as visible. It needs a row in that table for the look to be read against.

## Declined to judge

- **The scroll sequences under a fake layout** (slow scroll up, drag, older read, image before a scroll): my extended probe did not reach any test body within 15 s. The notes file stayed empty, so the stall is in the harness and before the product code ran. Nothing from it is used, and those cases rest on reading.
- **Whether the diagrams are exactly what `npm run diagrams` writes:** running it writes into the worktree. The diff is three labels, 22 to 23, 92 to 93 and 1102 to 1103, which fits one new import of `views/shared` and one of `ui`.
- **The count of full-list runs and whether `npm run diagrams` preceded each:** this comes from the builder's session, not the tree. Taken from its report.
- **Chrome's real selection ends after Cmd+A, and frame order:** a page settles these.
- **Commit and branch facts:** none needed beyond the allowed commands.

Usage: a76c4d45596f25340, claude-opus-5-5, 318699 tokens, 45 tool uses, 23 min 14 s
