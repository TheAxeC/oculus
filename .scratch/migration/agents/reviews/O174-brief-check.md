# Brief check of O174, on main at 437a7adfe

Summary: all eight arithmetic cases agree with item 1, and most premises hold. The brief should go back for five defects before dispatch:
- Item 2's px value makes item 4's text-size promise false and brings a plain-text regression (Implied inputs 1).
- An image that loads after the measurement is never re-measured (Implied inputs 2).
- A note opening with a tall display formula has no case and can come out blank (Cases, finding 1).
- `.katex`'s own box is probably shorter than the drawn formula, so the box list misses tall inline formulas (not verified on a page; Implied inputs 3).
- C9 leaves `pre`, `img`, inline formulas and text size unlooked.

Also wrong in the brief: item 3's purpose clause is false, and the report part "The terms" names a file that does not exist.

## Names

Commands (repository at head, `.scratch` excluded):
`git grep -n "<pattern>" -- ':!.scratch' ':!config/local.yml'` for each of `\.text\.cut`, `Clamp\b`, `card-layout`, `clamp-lines`, `whole lines`, plus `CLAMP_LINES`, `overflowsClamp`, `clampControl`, `measureGate`, `Show more`, `field-gap`.

Write list: `Clamp.svelte`, `card-layout.ts`, the report.

| Name | Hit outside the write list | Made false by the change? |
|---|---|---|
| `.text.cut` | none (only Clamp.svelte:100) | n/a |
| `--clamp-lines` | none (only Clamp.svelte:70, :102) | n/a |
| `Clamp.svelte` / `Clamp` | CardBrief.svelte:3 (comment), :12, :42, :44 | No |
| | EntryFields.svelte:41 (comment), :48, :213, :215 | No |
| | FieldMarkdown.svelte:13 (comment) | No; see below |
| `card-layout` | CardActions.svelte:50, :64 (measureGate only) | No |
| `CLAMP_LINES`, `overflowsClamp`, `clampControl` | none | n/a |
| `measureGate` | CardActions.svelte:50, :64, :106 | No |
| `--field-gap` | FieldMarkdown.svelte:12, :68 | No |
| `Show more` | config/text/views/boards/project.yml:128 (label); Cards.svelte:33, :38, :146, :158 (another control) | No |
| "whole lines" | FieldMarkdown.svelte:13-14; EntryFields.svelte:404 (a row of chips); 21 other files on other subjects (`git grep -n -c 'whole lines' -- src \| wc -l` printed 23 files in all, counting Clamp.svelte and EntryFields.svelte) | No |

- FieldMarkdown.svelte:13-14 reads "so the cut falls on whole / lines". After the change the cut falls on whole lines or blocks, and turning the gap off still serves that. The sentence is narrower than the new behaviour but true, as the brief says at :15.
- `git grep -n -i clamp -- docs config README.md` shows only two config help lines with an unrelated "clamped". No docs page describes this cut.
- Finding: the FieldMarkdown sentence is split across a line break, so `git grep 'whole lines'` does not find it. `git grep -n -P 'whole$' -- src/lib/views/shared/card` finds it at :13. Verify item 4's grep of `whole lines` therefore cannot reach the one sentence outside the write list that the brief itself names.

## The step line

Line: `grep -n '^- O174' .scratch/migration/plan.md` printed :1712.

| Part of the step line | Requirement that serves it |
|---|---|
| `.text.cut` cuts at the calc, so a display formula or table row is sliced | Item 3, item 2 (`.katex-display`, `tr`) |
| A task note with `$$...$$` and one with a wide table, both themes | C9 |
| The cut ends at the bottom of the last line or block that fits whole inside four lines | Items 1 and 2, C2, C3, C4, C6, but see the mismatch below |
| Plain lines and lists cut exactly as now (O172's C4, C5) | Item 1 (C1), C9 |
| A first block taller than the cut keeps today's cut height | Item 1's last sentence, C5 |
| Built by a builder agent | The brief as a whole |

No part lacks a requirement. One part is served by a different rule:
- The line says "the bottom of the last line or block that fits". Item 1 says "the largest height ... that falls inside no box".
- The two differ whenever empty space lies between boxes. Example: `0-19,19-38,38-57,70-110`, clamp 76. Item 1 gives 70; the step line gives 57.
- When the clamp itself falls in a gap, as in `...,57-70,80-100`, item 1 gives 76 and the step line gives 70.
- This has real inputs: `katex.css:1209-1213` gives `.katex-display` `margin: 1em 0`, and neither `FieldMarkdown.svelte` nor `--field-gap` resets it.
- The result is a blank strip above Show more, never a slice. The goal is met, but the brief should either state this reading or change item 1 to the step line's.

## Premises

| Brief | Command | Result |
|---|---|---|
| :11 `.text.cut` at :100, measure :43-50, three triggers, attributes not observed | `cat -n Clamp.svelte` | Holds (:100-104, :43-50, :51, :54-57) |
| :12 CLAMP_LINES :10, overflowsClamp :19, clampControl :29, measureGate below, head :1-7 | `cat -n card-layout.ts`; measureGate grep | Holds (measureGate at :74) |
| :13 two callers | `git grep -n 'Clamp\b'` | Holds |
| :14 "FieldMarkdown.svelte or plain words" | Same grep; both callers read at CardBrief:42-44, EntryFields:213-215 | Partly false: both callers pass only FieldMarkdown; no plain-words caller exists. Harmless. |
| :14 HTML holds p, ul, ol, li, pre, table, blockquote, img, KaTeX | `sed -n 82,126p src/lib/ui/html/html.ts` | Those are kept, but the list is incomplete. ALLOWED_TAGS also has h1-h6, hr, details, summary, div, input, small, sub, sup. |
| :14 KaTeX replaces the source after first draw, seen by the MutationObserver | card-math.svelte.ts:14-31, FieldMarkdown.svelte:55, Clamp:56-57 | Holds |
| :15 FieldMarkdown:12-14 | `cat -n` | Holds |
| :16 no test names them | `git grep -n -E 'overflowsClamp\|CLAMP_LINES\|Clamp' -- tests` | Holds (printed nothing, rc 1) |
| :17 seen at the look of O172 | `grep -n -i 'sliced\|strip' .scratch/migration/agents/reviews/O172-landing.md` | Holds (:51) |
| :18 no ADR folder | `ls docs/adr` | Holds: "No such file or directory" |
| :19 steps in flight, no shared paths | `sed -n '/Paths this step writes/,/^## /p'` on O151.md and O173.md; `grep -n Project.svelte` on O151 briefs | Holds; Project.svelte comes from O151-round2.md:19 |

Other premises the brief relies on:
- Item 3's purpose clause is false. It says the fallback exists "so a server rendering, or a first frame before any measurement, cuts as today". Clamp.svelte:33 and :69 show `.cut` is applied only when `long` is true, and only `measure` sets `long`. Clamp.svelte:11-12 says a server rendering measures nothing. So neither a server rendering nor a first frame is cut today. Item 2 sets the property in the same `measure` that sets `long`, so the fallback is never reached.
- Report part "The terms" names `docs/glossary.md`. `ls docs/glossary.md` prints "No such file or directory", and `grep -n -i glossary .agents/plan.yaml` prints nothing.
- Verify item 3 names `.agents/worktrees/O174-base/unused-exports.txt`. `ls` shows it missing. That is expected at this point, because `/spec` creates the worktree after this check. The file exists for O173-base.

## Cases and checks

Each expected answer worked out from item 1, by a `node -e` one-liner with no file written (`x = clamp; while a box has top < x < bottom, x = its top; x <= 0 gives clamp`):
```
C1 expected 76 rule 76 same
C2 expected 57 rule 57 same
C3 expected 38 rule 38 same
C4 expected 70 rule 70 same
C5 expected 76 rule 76 same
C6 expected 64 rule 64 same
C7 expected 76 rule 76 same
C8 expected 57 rule 57 same
```

Findings:
1. The wording "to less than one box's height" is undefined, and no case tests it. C3 shows it cannot mean any box (38 is less than the 52 px header row). The same one-liner on `13-200`, a display formula first with its 1em margin, gives 13. A builder who checks only for nothing passes C5 and cuts such a note to a blank 13 px. The step line wants 76.
2. Item 1's "inside" must be strict for C1 and C7 to hold. The brief never says so, though the cases settle it.

Against the rules file:
- C1 to C8 are consistent with spec.md:66, whose quoting of the program's source the brief leaves to the rules file.
- C9 is consistent with spec.md:61 and :65.
- No kept test is consistent with spec.md:60.
- "The first run of every case" includes C9, which a builder cannot run (spec.md:65). The brief says only that C1 to C8 have no function. C9's first run is left to reading, unstated.
- Item 2's "sets the answer as a custom property on the box" conflicts with spec.md:89 ("a reader-visible behaviour is state, not a DOM side effect") if done with `node.style.setProperty`. The brief should say the value is `$state` written through the `style=` expression at Clamp.svelte:70, as `long` is state.

Asks outside the step's changes:
- No case asks the builder to check, quote or explain a place it does not change; C9 goes to the look.
- Verify item 4 does ask this: `whole lines` hits in about 21 unrelated files and `Show more` in Cards.svelte, "each hit judged true or corrected". "Corrected" would reach paths outside the write list.
- The report's "open items of the state file" and "The terms" need files outside the Read list (spec.md:8 says "only those").

## The question

Goal: a cut long field shows no sliced line or block above Show more, and plain text and lists are cut as now.

- C1 to C8: yes. They run arithmetic on invented boxes, so all pass with item 2 collecting wrong boxes. C5 also passes with the blank-field defect above.
- C6 in particular: yes. It passes while a tall inline formula is sliced on a page (Implied inputs 3).
- C9: yes. It holds only a display formula, a table, plain lines, a list, and one narrow width. It can pass with a `pre`, an `img` or a tall inline formula sliced, or with a stale cut after a text size change.
- The step line's check: yes. The line names a display formula and a table only, and is otherwise judged by the same look.
- Item 1's check (C1 to C8): yes, as above.
- Item 2's check (only C9): yes. No case exercises `pre`, `img` or `.katex`.
- Item 3's check (only C9): yes. Plain cuts look right at text size 1 while the text-size defect stands, and the fallback clause cannot be observed.
- Item 4's check: there is none except a narrower width in C9. Text size, edit and "does not run without end" go unchecked, so yes.
- Item 5's check: no. The diff shows whether `overflowsClamp`, `clampControl` and the callers changed.
- Item 6's check: it bears only on comments, so yes for the goal, which is proper for it. Its grep has the wrap gap under Names.
- Verify item 1 (`test:quick`): yes. No test reaches these files' behaviour; it proves types, lint and format only.

## Implied inputs

1. **A text size change on a cut box, missing, and a defect in item 2 as written.**
   - `--fs-md` is `calc(13px * var(--text-scale))` (tokens.css:168), set at appearance.svelte.ts:109.
   - Today the em-based `max-height` grows, the box resizes, and the ResizeObserver runs `measure`.
   - With a px value the box stays at its old height, so the ResizeObserver does not fire (read from Clamp:51-57; not verified on a page). The MutationObserver does not fire either.
   - At scale 1.5 a plain text is left at 76 px of 28.5 px lines, a sliced line.
   - That contradicts item 4 and "plain text cut as now".
   - Expected: at any text size a plain text shows four whole lines. An answer written in em, or a ResizeObserver on the text's content, would give that.
2. **An image that loads after the measurement, missing.** `img` is in ALLOWED_TAGS and is a box in item 2. A load changes neither the capped box nor the DOM tree, and Clamp has no `load` listener. For two lines, an unloaded image, then six lines, the cut stays where the zero-height image left it and slices the image. Expected: the cut is measured again when the image loads.
3. **A tall inline formula on a page, missing from C9.**
   - `.katex` is inline (`katex.css:143-149`, no display), and its height comes from its own font and `line-height: 1.2`.
   - The drawn height comes from the inline-block `.katex-base` and `.katex-strut` inside it (`katex.css:177-186`).
   - An inline element's bounding box does not include taller inline-block children. That is my judgment from the CSS, not verified on a page. A look at landing would settle it.
   - If so, the `.katex` box is too short and C6's geometry never reaches the function, while item 2 forbids measuring "their parts".
   - Expected: a note with `$\sum_i^n \frac{a}{b}$` crossing the fourth line shows no sliced formula.
4. **A first box that starts below 0, missing.** `13-200`, clamp 76: expected 76 (Cases, finding 1).
5. **Space before a crossing box, missing.** `0-19,19-38,38-57,70-110`, clamp 76: 70 by item 1, 57 by the step line. Needs a stated answer.
6. **A cut box scrolled by focus, missing.** Tab to a link in the clipped part scrolls an `overflow: hidden` box. Boxes "measured from the top of the text" must then add `scrollTop`, or the cut is off by that amount. Expected: the same answer as unscrolled.
7. **No boxes at all, missing.** Expected 76 (the rule gives 76; a `Math.max` form would not). Low cost.
8. **Fonts or the monospace option changing the wrap of a cut box, missing.** The box height stays capped and nothing re-measures, so a formula that moved keeps the old cut. Lower cost than items 1 and 2, since plain lines stay right.
9. **Covered or harmless:** out-of-order and overlapping boxes (C8), boxes ending on the clamp (C7), a zero-height box (never strictly contains the clamp), a text gone short (not cut, so a leftover value is unused), and `hr` (a thin rule).

Item 4's re-measure, read through Clamp:43-57 and the callers:
- The value does not feed the layout it reads. `overflow: hidden` does not change the text's layout, the MutationObserver watches no attributes, and the style attribute's expression is constant. A round therefore ends after at most two or three firings, as long as the width holds.
- One path can run without end: a scrollbar taking layout width.
  - `scrollbar.css:12-15` sets thin bars on every box, and `git grep scrollbar-gutter -- src` prints nothing.
  - The sequence is: a cut changes height; a pane's bar appears; the card narrows; the text rewraps; a formula crosses the clamp; the cut changes the other way; the bar goes; and so on.
  - It needs a classic (not overlay) scrollbar and content straddling the pane's height.
  - It is new with this step, because today's cut height does not depend on wrapping.
  - Item 4 demands an end to it but gives no mechanism and no check.

## ADRs

`docs/adr` does not exist (`ls docs/adr`: "No such file or directory"). No record is touched.

## Dictated text

The brief dictates no sentence for a file. `grep -n 'calc(var(--clamp-lines)' .scratch/migration/agents/briefs/O174.md` finds one code expression given exactly, at :25 (and :11 as a quote of the tree): `calc(var(--clamp-lines) * 1.45em)`. It holds: it is on the tree at Clamp.svelte:102 and is ASCII. Item 6 says what the comments must say without giving words, so it is not dictated. `LC_ALL=C grep -n '[^ -~]'` over the brief printed nothing.

## Declined to judge

- Whether a blank strip of a display formula's margin above Show more is acceptable. That is a look or a ruling, reported above as the difference between item 1 and the step line.
- How `tr` rectangles treat the half of a collapsed border (`border-collapse: collapse`, FieldMarkdown table rule). Only a page shows whether the last row loses its bottom line.
- The behaviour of browser geometry and the ResizeObserver on a page. I ran no page; the two claims that depend on it are marked not verified where they appear.

Usage: adbccfd2456711e7e, claude-opus-5-5, 149974 tokens, 15 tool uses, 7.0 min
