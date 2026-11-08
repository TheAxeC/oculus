# O171 landing

Position: the oculus migration, step O171 (the slide frame a 16:9 shape with no pixel size) landed. Next: /spec O170 and /spec O172, then O151's repair round 2.

Open items: none.

## Check of Steps 1

The builder aaf1e8ca5b7205734 and the reviewers aba64b2bce2589a15 and a8a448d5253a312b8 had ended before the landing; the runner's agent listing shows no subagent running.

## Not done

Nothing.

## What landed

The whole range from base 00adcfa54 (the builder's work under the round-0 rulings and repair round 1, one wip commit 2f34aaf9a) with the fixes at landing, 62 paths counted without renames, 3887 insertions and 4069 deletions.

- The setting `defaults.frame` and the deck key `deck.frame` are gone. A slide has the shape 16:9 alone and every size inside it is a fraction of its width.
- Stage draws the frame at the largest 16:9 box its room holds, with no transform.
- The too-tall measure and its finding are fractions of the frame's height.
- The PDF prints on 960 by 540 pt.
- Slides are drawn in Helvetica with Arial as fallback (open item 731 (a)); a monospace rice theme keeps its font.

Fixes at landing:

- `.dnode` in `Panel.svelte` draws its line as an inset shadow (Spec 1 of the run over round 1).
- A Markdown `<hr>` has no height and its line is a shadow; a task list's checkbox follows the type of its line (Behaviour 1).
- The print route's `.frame` sets `print-color-adjust: exact`, so a tab print keeps a slide's lines (the round's hand-back).
- The head comment of `slide.css` names a shadow, an outline or a rule (Standards 1).
- The report's line on the hand-back rule (Proof 1), and G13's line in `agents/guarded.md`.
- Spec 2 stands as a judgment: Table's dotted `::before` under rice keeps rice's dotted row line and takes no room.

## The look

On scratch servers from the gate (8797) and from the base (8798), and a scratch desktop app for the PDF, on a scratch copy of the hub.

- C1: no text Slides, Width or Height in the Settings view.
- C2: a deck with `frame: { width: 1000, height: 1000 }` is drawn 16:9 with no frame finding; the Problems view says "Property frame is not allowed." at line 3.
- C3: `defaults.frame` in the workspace file gives the finding "defaults.frame is not an option; it is not applied".
- C4: on the Helvetica tree a too-tall slide overruns 62.40% at 558 wide and 63.11% at 1200 wide, 5 of 292 element heights differing by more than 0.25% of the width. Factors and verdicts of the slides walked agree with the Overview.
- C5: the portfolio deck, which holds the 25 project decks, before and after: the same 16 slides too tall (2 to 14, 16, 17, 26) and the same factors, before on the base, after on the system font and after on Helvetica.
- C6: the finding reads "slide too tall: <title> runs past its frame by <n>% of the frame's height".
- C8: `pdfinfo`: 28 pages, 960 x 540 pts on each (the 27 slides and the look's test slide); two pages viewed, each whole on its page, the rule, the checkbox and the table's lines drawn.
- C9: the audience window asks for `popup,width=756,height=425`.
- C10: under rice the title is 51.7 px per factor 1 at a 1280 wide frame; a chip's text is 7.5 px at the factor 0.75, 10 px at the factor 1. A monospace rice body draws the slide in `ui-monospace`.
- C11, C13: the presenter's rooms at 180 by 300 and 900 by 240 and a pane of 558 by 583 draw the largest 16:9 box, centred.
- C12: at text size 1.5 the title goes from 70 to 105 px.
- C15: a resize from 558 to 1200 wide on Helvetica writes the slide's style 0 times.
- Lines inside a slide: the frame, a table, the `<hr>` and the checkbox as above. Scrolling a too-tall slide lets content cover the frame's inset line where it crosses; a slide that fits does not scroll.

## Verification on the gate, at main's head with the range and every fix staged

```
npm run diagrams && npm run docs:palette && npm run test:quick
ok      prettier (0.8 s)
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.4 s)
ok      svelte-check (9.7 s): 590 FILES 0 ERRORS 0 WARNINGS
ok      eslint (9.9 s)
ok      vitest checks (146.2 s)
ok      vitest (203.7 s)
ok      vitest slow (354.2 s)
test:quick: 357.0 s; every command passed
```

Not covered by that run: tests that reach no changed file within the import depth, the build, the lint of unchanged files. `git diff --cached --binary` of main and the gate compare equal under `cmp`. No bench: the configuration's `bench:` is empty.

## Agents

- Builder aaf1e8ca5b7205734, claude-opus-5-5: first run 253320 tokens, 58 tool uses, 10.9 min; build 288085 tokens, 393 tool uses, 66.2 min; repair round 1 146773 tokens, 88 tool uses, 18.1 min.
- Brief check a8c7afd700e04bb47, claude-opus-5-5: 221013 tokens, 66 tool uses, 10.5 min.
- Reviewer aba64b2bce2589a15, claude-opus-5-5: 305201 tokens, 39 tool uses, 20.6 min.
- Reviewer over round 1 a8a448d5253a312b8, claude-opus-5-5: 227400 tokens, 33 tool uses, 13.7 min.

The builder's first report did not pass its bar: it went through one repair round. Fixes at landing: seven, listed above, the slide font among them by ruling.

## Next

/spec O170, correcting its `frame: { width: 400 }` case, and /spec O172; then O151's repair round 2.
