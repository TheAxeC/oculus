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

## Repair round 1, refuted

Run from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O122`, with the node 24.21.0 PATH.

```
1. npm run test:quick -- --base 4ffed7fbe
test:quick: 18 changed file(s), from git since 4ffed7fbe
test:quick: 11 test file(s)
ok      prettier (1.3 s): All matched files use Prettier code style!
ok      ASCII gate (1.4 s)
ok      svelte-kit sync (3.2 s)
ok      eslint (2.7 s)
ok      svelte-check (9.7 s): 1793659557936 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (23.5 s): Duration  11.96s (transform 9.76s, setup 0ms, import 13.46s, tests 70ms, environment 0ms)
ok      vitest checks (41.5 s): Duration  29.81s (transform 11.55s, setup 0ms, import 24.75s, tests 40.26s, environment 2ms)
test:quick: 44.9 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files

2. LC_ALL=C grep -n '[^ -~]' over the 15 changed paths (docs/HELP.md, the four diagram files, key-dom.ts,
   virtual.ts, the transcript files, jump.ts, turn-window.svelte.ts, the new test)
printed nothing; ascii exit 1

3. The new test. Base half: ls ../O122-base/src/lib/views/sessions/terminal/transcript/turn-window.svelte.ts
ls: ... No such file or directory (exit 1), so its import cannot resolve at the base.
After the change, through the project's script:
npm test -- tests/ui/tree/list/virtual-rows.client.test.ts tests/views/sessions/terminal/transcript/turn-window.test.ts --reporter=verbose
|client| tests/ui/tree/list/virtual-rows.client.test.ts > asks for no row past the end when a list of 20 shrinks to 3 inside an effect 10ms
|unit| tests/views/sessions/terminal/transcript/turn-window.test.ts > turn-window > Transcript selection keeps its rows 1ms
 Test Files  2 passed (2)
      Tests  2 passed (2)

4. git diff 4ffed7fbe --stat -- package.json package-lock.json config | wc -l
0

5. Standards read: findings below.

Commands the report quotes, rerun:

sh utils/unused-exports.sh, diff against ../O122-base/unused-exports.txt
1c1
< Unused exports (227)
---
> Unused exports (228)
216a217
> src/lib/views/sessions/terminal/transcript/turn-window.svelte.ts: BEFORE_LIST, AFTER_LIST, selectionRows

Round 1 program (Probe.svelte, round1.svelte.ts, vitest.config.mjs, cut byte for byte from the report's lines)
npm test -- --config <scratch>/round1/vitest.config.mjs
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
These lines equal the report's, all of them.

Built-step program (cases.svelte.ts), which the report says it did not run after the round
npm test -- --config <scratch>/built/vitest.config.mjs
Every line equals the report's except one:
report: focus gone, kept: false
rerun:  focus gone, kept: true
 Test Files  1 passed (1)
      Tests  4 passed (4)

node first-run-cases.mjs: every line equals the report's.

Greps of the report's sections, rerun:
grep -rnE "\brunOpen\b" src tests config docs README.md --exclude=local.yml: turn-rows.ts:114 and :327, as quoted.
grep -rnE "\brunKey\b" src/lib/views tests docs README.md config --exclude=local.yml: TranscriptBody.svelte:83, tab-session.svelte.ts:43, TurnRun.svelte:8, turn-rows.ts:20,64,113,300,313,322, as quoted.
grep -rn "TurnRun\b" src tests docs README.md --exclude-dir=diagrams: TurnList.svelte:20,40,126, as quoted.
grep -rnE "place\.(leave|land|clear)" src tests docs: TranscriptBody.svelte:257,342,370,373, as quoted.
grep -rln "Transcript" docs/*.md README.md: docs/HELP.md.
grep -n "scrollRegion\|scrollToFragment\|firstWindow" docs/*.md README.md: nothing.
History words over `git diff 4ffed7fbe -U0 -- src docs tests` plus the two new files, cut to comment lines and test titles: 19 hits, the same 19 phrases as the report's table.
grep -n experimental vite.config.ts: nothing (exit 1).
tick at node_modules/svelte/src/internal/client/runtime.js:515-527: await Promise.resolve() and then the flush, outside async mode, as the report says.
ALLOW_DATA_ATTR: false at src/lib/ui/html.ts:157, as quoted.
wc -l of every row of the report's Files table: equal to the table.

The round's one test:quick after the last change: the report's svelte-check stamp 1793659006809 reads 23:36:46 by `date -r`; the last source write is turn-window.svelte.ts at 23:36:06 (from the round's diff header). So the quoted run followed the last change.
```

How the delta was taken: `diff -q` over the 15 paths of `files.txt` shows four changed: `virtual.ts`, `TranscriptBody.svelte`, `reader-place.ts`, `turn-window.svelte.ts`. `git status --short` lists no path changed that `files.txt` does not list, other than the three orchestrator files under `.scratch` (`O122-cases.md`, `O122-round1.md`) and the report. The delta holds items 1 to 4 and nothing else.

Forms that differ from what the report quotes:

- `npx vitest run ...` was run as `npm test -- ...`, since this review was told to run vitest through the project's script only.
- That script passes `--tagsFilter '!slow'`, which a config with no tags refuses. My scratch copies of the two configs therefore carry one added key, `tags: [{ name: 'slow' }]`. No program, probe or product file was changed.
- `git diff -U0` and `git diff --stat` were run with the base named.

No process of mine is left (`pgrep` printed nothing), and my scratch folder is removed.

### Closure of the round

- B1, closed. `place.leave()` at `TranscriptBody.svelte:370`, `place.land(box, list, flat)` at `:373` ahead of `windowed.sync()` at `:374`, and `away` in `take` and `hold` (`reader-place.ts:138,164`). The rerun ends at the heading with `target top 0` through the flush, the scroll event and the later measures. The steps of the real `linked` match the probe's `jump` by reading, with `following = false` set first, so the real drawn effect takes the same branch. `Markdown.svelte` draws `{@html sanitise(doc.html, slots)}` in the template and `docOfHtml` is synchronous, so the heading is in the page after the tick. `land` always runs: `scrollToFragment` has no path that throws, so `away` cannot stay set. No check was removed.
- B2, closed. `measured` reads `scroller` outside `untrack` and returns while it is null (`turn-window.svelte.ts:463`), so the attachment runs again once the column is found. The each block is a render effect, so `configure` has set `count` before the attachment runs again. The rerun shows all 8 rows watched. It is a substitute for the swap at `VirtualRows.svelte:241`; the round named the result and cited that line as how it is reached, so this is within the round. `restore` also waits for the column, which loses nothing, since `looks` is empty at mount.
- B3, closed by the program with `document.hasFocus` stubbed; see "Declined to judge" for Chrome's real order. `if (next === null && !document.hasFocus()) return;` at `turn-window.svelte.ts:445`. A focusout inside a focused window still clears `focused` (rerun line `kept: false`).
- T1, closed. The comment at `virtual.ts:71-77` says the window holds no height after the first rows, that an explorer's list holds it itself (`VirtualRows.svelte`, the spacer `calc({rest} * var(--tree-row) ...)`), and that a Transcript holds none until its column is found (`turn-window.svelte.ts:260`). Each clause is true by reading.
- The report parts: the history grep with each hit judged, the changed-name greps, the touched comment list, the key and async tables with `showRow`, `moveFocus` and all three `tick().then` sites, the B4 row with its before, P2 corrected with a run, P3 corrected with the run and the statement that `test:quick` did not reach G65's test, and item 9's row quoting item 1's run. All present. P2's pair is sound: the sum before `drop` gained 2768 px, more than the seven drawn rows could add, so measured rows stood among the undrawn ones, and only a real `drop` returns the sum to 28563.

### Verdicts

Items of the brief's "What to build", for the whole diff since the base:

- 1 Flat rows: holds. `flatRows` at `turn-rows.ts:95-124`, keys as the item says. `TurnRun.svelte` draws one flat row, and its markup and CSS compared with the base by reading keep the look. Rerun line `failed run opens itself: ...`.
- 2 A windowed list: holds. `turn-window.svelte.ts`, made at `TranscriptBody.svelte:126`. `rowWindow`, `keptRange`, `offsetIn` imported. Spacers at `TurnList.svelte:85-87,135-137`. `virtual.ts` line 1 corrected.
- 3 Heights: holds. Value by `getBoundingClientRect` at `turn-window.svelte.ts:210`; zoom on each row at `TurnList.svelte:92`; `.turns` has no `gap`; lead from data; estimate once per key at `:194-198`; `data-index` written at every draw; rows drawn before the column is found measured and watched (B2 closed).
- 4 Dropping heights: holds. `drop` at `TranscriptBody.svelte:146,231`; `retakeZoom` measures at `:164-167`; rerun P2 lines.
- 5 One owner of `scrollTop`: holds. Core correction off at `turn-window.svelte.ts:219`; `overflow-anchor: none`; `take` and `hold` by key; comment corrected.
- 6 The foot, with ruling 3: holds. `following`, `footTop`, `TRUE_FOOT`; effect at `TranscriptBody.svelte:271-278`; `data-windowed` at `:388`; `key-dom.ts` `instant` for such a box, and `scrollRegion` has the one caller at `workbench-keys.svelte.ts:242`.
- 7 Older turns and a hidden tab: holds. `readMargin` in the draw effect, with `older` and `failed` among the draw's reads; the no-height path of `measureElement`; the `index < rows.length` filter; held window through `rowWindow`.
- 8 Selection, with ruling 1: holds. `selectionRows` and `caret` apart from it; the G149 test passes and is a real table over the function. Note that this test, with `run:` and missing-key rows, covers the item's list.
- 9 A row that leaves the page: holds. `details` and sideways scroll held by key; Tab by `moveFocus`; the fragment link ends at the heading (B1 closed).
- 10 Menu, runs and keyboard: holds by reading. `prose-menu.ts` is unchanged and a spacer lies inside `.turns`. PageUp, PageDown and Home are unverified, as ruling 4 allows.
- 11 Comments and pages: holds. `docs/HELP.md:460`; head comments read after the round; T1 closed.

Cases of the brief's "Cases", as the cases ruling replaces them. "By reading" means no fault found by reading. Each page-only case is also named under "Declined to judge".

- Any size, scrolled to the head (read with ruling 1): not verifiable, the count at the look settles it. Rerun `scrolled: drawn 20` and a failed run giving one row per call.
- 20000 turns: not verifiable, a trace of long tasks at the look settles it.
- Scrolling up slowly through unmeasured rows: not verifiable; reading gives `following` cleared at `TranscriptBody.svelte:329-330`, and hold by key. The look settles it.
- Dragging the bar fast to the head: not verifiable; rerun `spacer at the top: held rows []`. The look settles it.
- A read of older turns near the head: not verifiable; rerun `older read keeps keys`. The look settles it.
- An append much taller than the estimate: not verifiable; `following` path read. The look settles it.
- A result that opens a run, inside and outside the margin: not verifiable; hold by key read. The look settles it.
- A press on a run in view, then closed: met, `chosen` on the tab and rerun `pressed closed: -2 run:-1 1 2 3`.
- An image loading above the view: not verifiable, J4 rests on frame order. Rerun `image +100 then a scroll +20, take first: scrollTop 570`.
- A selection from a turn at the head to a turn 300 rows on: not verifiable for Copy; function tested, rerun `caret in row 2, scrolled away: drawn 21 last 573`. The look settles it.
- Cmd+A then Copy: not verifiable; the real ends Chrome reports settle it. Rerun `Cmd+A: drawn 2000 last 1999`, `cleared: drawn 20 last 573`.
- A right-click in the three places: met, by reading.
- Focus on a Copy button, then scrolling away: met by the program, `window lost focus, kept: true`; the real order in Chrome stays for the look.
- Tab through a stretch past the margin: not verifiable; read as right; the look settles it.
- An open `details` and a sideways-scrolled code block: met, by reading and rerun `redrawn row: open true sideways 70`.
- A fragment link to a heading in an undrawn row: met by the rerun over the real `turnWindow` and `readerPlace` on a fake layout, and by reading of `linked`. Same answer: as now, since `named` returns early and `jump` handles it. The look's fixture uses a raw HTML `id`, as ruling 5 says.
- The tab hidden with a turn arriving: not verifiable; rerun `no height, scroll event` and `shorter list while hidden`. The look settles it.
- A session switched, per ruling 2: not verifiable for the foot; the press stands by reading. The look settles it.
- A pane resized narrower: not verifiable; read as right. The look settles it.
- The text size changed: not verifiable; `scrollHeight` against the rows' sum at the look settles it.
- A wallpaper theme: met, `.spacer` paints nothing (`TurnList.svelte:151-153`).
- A session of one turn and of none, and a failed read of older turns: met, by reading.
- A transient `held.error`, then the list back: met, by reading. The window outlives the list, and `drop` runs only with the target or a replaced list.
- End, Jump to the last turn, `G`, `gg`: not verifiable; read as right. The look settles it.
- PageUp, PageDown, Home, a link in an answer: not verifiable, R1; the look presses each key.

### Findings

#### Spec

none

#### Proof

- P1. `O122-report.md`, section "Cases", row "Focus on a Copy button, then scrolling away", and the output block under "The built step": "`focus row 564 kept: true`, `focus gone, kept: false`".
  - What is wrong: the case row quotes that line as the built result, from a run the report itself says was "taken before repair round 1 and not run again in it". On the final tree the same program prints `focus gone, kept: true`. The cause is B3's own fix: the program dispatches a synthetic focusout with no focused element, jsdom's `hasFocus()` then returns false (`Document-impl.js:424`), and the code takes that for a window losing focus.
  - The behaviour is right, and the round's `focus left inside a focused window, kept: false` shows it. The line is stale. `spec.md`, "A report states the end state", says a figure from before the last change is taken again or removed. The report's sentence on what changed names only the `measured key 100` pair.
  - Decision resting on it: the orchestrator's read of whether a row leaves when focus leaves. The round's line answers that decision, so the fix is to drop the stale quote from the case row and to say why the line differs.
  - Failure scenario: the landing reader reruns the quoted program, gets `true` against the report's `false`, and takes it for a regression of the focus rule.
  - Verdict: none made partial.

#### Standards

- S1. `O122-report.md`, "Judgment calls" J2, J3, J4 and the case row "A read of older turns": "`reader-place.ts:154-157`", "`turn-window.svelte.ts:481-482`", "`reader-place.ts:117-123`", "`reader-place.ts:93-96`".
  - What is wrong: these four citations were not taken after the last change, against the spec.md rule that every `file:line` in the report is taken after it. `grep -n` on the snapshot gives `topIn` at 93, `settle` at 117 and the `kept === null` branch at 154. On the final tree they stand at 103, 129 and 166.
  - `sed -n 154,157p` on the final tree prints the `anchor = {` lines, and `sed -n 481,482p` prints the opening of `sync`'s doc comment, whose code is at `:485-493`.
  - No decision rests on them, and the fix is four numbers at landing.
  - Failure scenario: a reader checking J2 opens the cited lines and reads the anchor's literal, away from the branch J2 is about.
  - Verdict: none made partial.

#### Behaviour

none. The round adds no visible change beyond the row the report states: the column stays at the heading.

### Declined to judge

- The cases marked not verifiable above, on a real page: they need a browser, and the look at landing repeats them.
- Whether `document.hasFocus()` is false inside `focusout` on a real window blur in Chrome and in the Electron app: reading of the rule says yes, and only the page settles it. The report's look row says what to do: Tab to a Copy button, wheel away, switch app and back, read `document.activeElement`.
- Frame order for J4, and R1: a page settles these.
- Running the new test at the base: replaced by `ls` of the missing module, since the expected failure is that import. Running it means another ad hoc vitest over the base copy, and the project's script does not reach the scratch form the report used.
- Whether the diagrams are exactly what `npm run diagrams` writes: running it writes into the worktree. The round changed no import, and the landing list runs it.
- The count of full-list runs (five) and whether `npm run diagrams` preceded each: this comes from the builder's session. T2 takes no action, as the round says. The svelte-check stamp fixes only the last run's time.
- Whether every file edit went through Edit and Write, and that the case programs were deleted from the builder's scratch: not visible from the tree.
- A one-frame race, reader at the foot presses a link and an append arrives before the scroll event updates `stuck`: `stuck` is stale for that frame and `toFoot` would win. Seen by reading only, unmeasured, and a page settles how often it occurs. I raise no finding on it, because it needs an append inside one frame.
- Commit, branch and ignore facts: none needed beyond the three allowed git commands.

Reviewer usage: a33da2c31118fccb2, claude-opus-5-5, 257021 tokens, 34 tool uses, 10 min 33 s.

### Closed

- P1: closed at landing. The case row and the output block of `O122-report.md` state the final result and why the line differs from the run before the round.
- S1: closed at landing. The four citations in `O122-report.md` give the lines of the final tree.
