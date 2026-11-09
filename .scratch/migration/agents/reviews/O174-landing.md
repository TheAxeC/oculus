# O174 landing

Position: the oculus migration, step O174 (a cut long field shows no sliced block) landed. Next: O173's landing, then O151's review over round 2.

Open items: none.

## Check of Steps 1

The builder ad7049ea982f2311d, the brief check adbccfd2456711e7e and the reviewers a257a7ef987bda9ae and a0e1476e76fe926b1 had ended before the landing; the runner's agent listing showed O151's builder and O173's reviewer running, neither of this step.

## Not done

Nothing inside the brief.

## What landed

The whole range from base abe602359 (the builder's work and repair round 1, one wip commit a40ec9661) with the fix at landing, 2 paths, `src/lib/views/shared/card/card-layout.ts` and `src/lib/views/shared/card/text/Clamp.svelte`.

- `.text.cut` ends at a measured height: the bottom of the last line or block that fits whole inside the four lines (`clampCutHeight`).
- Lines, display formulas, the pieces of an inline formula, code blocks, table rows and images each give a box (`drawnBoxes`).
- The resize observer watches a wrapper around the contents, so a width change, a text size change and an image that loads all move the cut.
- A text in which no box fits whole keeps the cut at four lines.

Fix at landing: both comments of `Clamp.svelte` say "except where no box fits whole", the condition the code computes (the finding of the run over round 1, closed under the Closed heading of `agents/reviews/O174-refuter.md`).

## Unfixed, stated

No guard against a page scrollbar that appears and goes as the cut changes the page's height (the brief's decision 3). It needs a classic scrollbar and a formula on the wrap boundary, and it would show as a flicker. Not seen on a page.

## The look

On a scratch server from the gate (8797), on a scratch copy of the hub, Tasks cards at 284 px over a wallpaper, in the light theme and in Dark Modern, each note written for the look and removed afterwards.

- A display formula crossing the fourth line: three lines above Show more, cut 56.11 px, nothing of the formula shown.
- A note opening with a formula taller than the cut: cut at four lines (75.4 px), the formula sliced there, as the step's line asks.
- A wide table: the intro line and the whole header row, cut 64.03 px, the row's bottom border drawn.
- A code block: the two lines above it, cut 37.27 px.
- A tall inline formula on the fourth line: the whole line shown, cut 75.4 px, its `.katex-base` box ending at 76.4 px.
- Eight plain lines and a ten-item list: four whole lines or items, cut 75.4 px.
- An image set to load after the first measurement: the cut went from 75.4 px to 37.27 px when it loaded.
- Show more and Show less on the display formula note: 183.82 px open, 56.11 px cut again.
- A text size of 1.5: the plain note and the list 113.1 px, four lines of 28.275 px, the display formula note 84.68 px, the table 92.32 px; back at 1 the first values returned.
- A card narrowed to 138 px: the display formula note went to 75.4 px, four whole lines above the formula.
- Project cards' ELI5 at 301 px: four whole lines, cut 75.4 px.

## Verification

In the gate, with `TMPDIR` unset: `npm run diagrams && npm run docs:palette && npm run test:quick`.

```
ok      prettier (1.7 s): All matched files use Prettier code style!
ok      ASCII gate (1.8 s)
ok      svelte-kit sync (3.8 s)
ok      eslint (14.5 s)
ok      svelte-check (14.9 s): 1794182996233 COMPLETED 591 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (60.1 s): Duration  43.66s (transform 16.28s, setup 0ms, import 34.68s, tests 68.94s, environment 3ms)
test:quick: 64.2 s; every command passed
```

`cmp` of the staged diffs of the gate and main printed nothing, exit 0. The plan has no bench list, so no A/B ran.

## Agents

Brief check adbccfd2456711e7e, claude-opus-5-5, 149974 tokens, 15 tool uses, 7.0 min. Builder ad7049ea982f2311d, claude-opus-5-5, 144856 tokens, 32 tool uses, 10.6 min; round 1 166920 tokens, 16 tool uses, 2.6 min. Reviewer a257a7ef987bda9ae, claude-opus-5-5, 164479 tokens, 14 tool uses, 9.6 min. Over round 1 a0e1476e76fe926b1, claude-opus-5-5, 130236 tokens, 15 tool uses, 4.0 min.

The first report passed its bar. One fix at landing, named above.

## Next

O173's landing with its look, then O151's review over round 2.
