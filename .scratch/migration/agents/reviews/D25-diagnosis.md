# Diagnosis: A1-1, the diff comment `+` in the inline layout

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. A diagnosis of the same step later is appended below under its own heading, which names its finding.

## Symptom

From `agents/reviews/owed-looks.md:104`, A1-1, built in D25 by Z289 and held out of D25's brief (Z328), to be diagnosed on TEST before D25 lands:

"in the inline layout the comment `+` is drawn in the original side's number column, left of the line numbers, and shows only after a right-click; hovering the line's margin shows nothing."

## Where the probes run

The defect is A1's, landed on main, so the probes ran on main's checkout (`ec78edc2`), which the dev server on 8790 serves to the TEST page (tab 812136282), each probe one edit undone after its run, and the page reloaded before each run. No path redirected under `$TMPDIR`: no probe touches the home folder, the installed skills or the pinned checkout.

The state: a tracked file with a change is needed for a diff, so one line `DIAG-a11c probe line for the inline diff look` was inserted at `tools/oculus/HELP.md:4` (backup and `shasum` `1dfdd236f9b2cd8ffc3ef0de2d9d2f926981edeb` first). In the Changes view, session "S2 status" (this orchestrating session, `be0ac0d7-...`) was picked, and the row `tools/oculus/HELP.md` of "The repository" opened with its Open Changes control: a diff tab whose id carries the session, so the comment is offered. More Actions, Inline View set the inline layout.

## Red command

A page script on TEST, run after a pointer hover on line 4's number of the modified side (page 255,165) and after a frame is drawn:

```js
const d=document.querySelector('.monaco-diff-editor');
const g=[...d.querySelectorAll('.oculus-comment-add')].filter(e=>e.getBoundingClientRect().width>0)[0];
// part 2: no element -> "RED: hover shows nothing"
// part 1: g.x < the right edge of line 4's number on the same row -> "RED: + left of the line numbers"
```

Runs, each after a hover away and back:

```
run 1: {"inline":true,"glyphX":207,"glyphEditor":"editor modified","nums":[{"cls":"line-numbers","x":224,"right":260,"text":"4"}],"part1":"RED: + left of the line numbers","part2":"green: + shown on hover"}
run 2: {"inline":true,"glyphX":207,"glyphEditor":"editor modified","nums":[{"cls":"line-numbers","x":224,"right":260,"text":"4"}],"part1":"RED: + left of the line numbers","part2":"green: + shown on hover"}
run 3: {"inline":true,"glyphX":207,"glyphEditor":"editor modified","nums":[{"cls":"line-numbers","x":224,"right":260,"text":"4"}],"part1":"RED: + left of the line numbers","part2":"green: + shown on hover"}
```

Part 2 came out both ways across reloads: after a reload with the diff already inline, the same script gave `{"inline":true,"glyph":null,"part1":"no glyph drawn","part2":"RED: hover shows nothing"}`, and after a right-click it gave run 1's result once and the no-glyph result once.

## No red command

Not applicable.

## Shrunk case

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| The side-by-side layout (the same diff, Inline View off) | the `+` sits in the glyph margin left of the modified numbers there too, beside the original side; A1's look accepted that placement | the inline layout kept, as the finding names it |
| The right-click before the hover | part 1 red without it; part 2 red or green without it, independent of the press | cut |
| A visible browser window | part 2 green whenever a frame was drawn (see Probes, rank 6) | cut: part 2 needs the hidden window |

The shrunk case: an inline diff tab of a file opened for a session, and a hover on a line's number.

## Hypotheses

Part 1:
1. If the mark is a glyph-margin decoration, and the glyph margin of Monaco's modified editor is its leftmost column, which the inline layout puts right after the original side's number column, then drawing the mark as a line-decorations decoration (the column between the line numbers and the text, where VS Code draws its comment `+`) moves it right of the numbers. Falsified by: the mark staying left of line 4's number.
2. If the inline modified editor's glyph margin has no width (`glyph-margin` measured 0 px), so the mark overflows into the column on its left, then opening that margin moves the mark into its own column, still left of the numbers. Falsified by: the mark's x unchanged.

Part 2:
3. If the session record is not held after a reload until a press, `commentable` is false and no `+` is offered. Falsified by: `commentable` true before any press.
4. If the section's `actions` value is `'read'` until the tab is activated by a press, no `+` is offered. Falsified by: `actions` unchanged by the press.
5. If the comment gutter is not attached, or attached before the editor exists and never again, no move reaches it. Falsified by: a move on line 4 logged by a listener the gutter's effect attached with comments offered.

The reply: none, no person present.

The second list, for part 2 after 3 to 5 were falsified:
6. If the TEST page is hidden while the look drives it, so the browser runs no animation frames, and Monaco draws a decoration only on its next animation frame, then the mark set by the hover is not in the DOM until something forces a frame (a screenshot, a press). Falsified by: frames counted while hidden, or the mark absent after a forced frame.

## Probes

| Hypothesis rank | The one change | The run | Result |
|---|---|---|---|
| 3 | `DiffSection.svelte`, after `const who = ...`: `$effect(() => console.log('DIAG-a11c', JSON.stringify({ session, record: record !== null, actions, commentable, mode, at: Date.now() })));` | after a reload, before any press: `{"session":"be0ac0d7-...","record":true,"actions":"lines","commentable":true,"mode":"inline",...}` (one transient `record:false` at load, then `true`) | falsified |
| 4 | the same log line | `actions` read `"lines"` in every line, before and after the press | falsified |
| 5 | `DiffEditor.svelte`'s comment gutter effect: `console.log('DIAG-a11c gutter effect', ...)` at its top, `console.log('DIAG-a11c move', e.target.type, e.target.position?.lineNumber)` on the modified editor's moves, `console.log('DIAG-a11c gutter dispose')` in its cleanup | `gutter effect {"kit":true,"diff":true,"layout":"inline","offering":true}`, then `move 3 4` on each hover (type 3, the line numbers, line 4), no dispose, and no `.oculus-comment-add` in the DOM | falsified |
| 6 | no code change: a page script counting `requestAnimationFrame` callbacks for 1 s after the hover | `["hidden", true, 0, [[207,153]]]`: `document.visibilityState` is `hidden`, 0 frames in 1 s; the mark was in the DOM at that read, drawn by the frame the preceding zoomed screenshot forced, and absent at the read before that screenshot | standing |
| 1 | `gutter.ts:318`: `{ glyphMarginClassName: COMMENT_MARK }` to `{ linesDecorationsClassName: COMMENT_MARK }`, the page reloaded, a hover, a zoomed screenshot to draw a frame | `{"inline":true,"g":[{"cls":"cldr oculus-comment-add","x":260,"y":153,"w":10}],"n":[{"ed":"editor original","x":171,"right":207},{"ed":"editor modified","x":224,"right":260,"y":153}]}`: the `+` right of line 4's number; without the change, x 207, left of it | standing |
| 2 | not run: rank 1 stood, and rank 2's change cannot move the mark right of the numbers, which the finding asks for | | not probed |

## Cause

Part 1, the place: the `+` is a glyph-margin decoration (`gutter.ts:318`, `glyphMarginClassName`). Monaco's glyph margin is the editor's leftmost column, and in the inline layout the modified editor sits right of the original side's number column, so the mark is drawn between the two number columns, left of the modified line numbers. Probe 1: as a line-decorations decoration the mark is drawn right of the modified line number (x 260 against the number's right edge 260), and as a glyph-margin decoration at x 207, left of it (number from x 224).

Part 2, hovering shows nothing: not a product defect. The TEST page is hidden while a look drives it (`document.visibilityState` `hidden`, 0 animation frames in 1 s), Monaco draws decorations on its next animation frame, and the mark the hover sets reaches the DOM only when a frame is forced: by the screenshot or the press of the look. Probe 6 shows the mark absent before a forced frame and present after it, with the comment gutter attached and receiving the moves (probe 5). In a visible window frames run and the hover draws the mark.

## Fix and test

Made at D25's landing on main, where A1-1 is built (Z289), as a fix at landing:

- `src/lib/ui/controls/editor/gutter.ts`: the comment mark drawn with `linesDecorationsClassName` in place of `glyphMarginClassName`; `commentTarget` reads a press on `GUTTER_LINE_DECORATIONS` as the press on the `+` (today only `GUTTER_GLYPH_MARGIN` is); the comments naming the glyph margin follow.
- `src/lib/ui/controls/editor/DiffEditor.svelte`: the `.oculus-comment-add` rule sized to the line-decorations column, and the comment above it.
- The test: the existing test of `commentGutter`, changed to require the line-decorations class and a press on the line-decorations target, run red on main before the fix and green after, both runs quoted in the landing's booking. The comment control is a control Axel relies on, so its failure costs something under the test rule.

The test and its runs are recorded at D25's landing.

No test reaches it: the frame timing of part 2 is the browser's, not oculus's; no test is written for it, since it is no defect.

## Cleanup

```
$ git grep -n "DIAG-a11c" -- . ':!.scratch'
(nothing; exit 1)
$ shasum HELP.md
1dfdd236f9b2cd8ffc3ef0de2d9d2f926981edeb  HELP.md
$ git diff --quiet -- <file>   (gutter.ts, DiffEditor.svelte, DiffSection.svelte)
clean, each
$ shasum ~/.oculus/changes.jsonl ~/.oculus/workspaces.json; ls ~/.oculus/history | wc -l
f3d06124a86d9ee069c53b242e0c13a288e5c584  changes.jsonl
1bf5d57ab5c0f497c3d0a5b066f822b9647f733e  workspaces.json
3
```

The checksums and the count equal the snapshot taken before the look. The HELP.md diff tab opened for the look was closed.
