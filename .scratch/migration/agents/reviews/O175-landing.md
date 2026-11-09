# O175 landing

Position: the oculus migration, step O175 (the portfolio Overview usable at 110 tiles) landed. Next: the reviews of O176 and O177.

Open items: none.

## Check of Steps 1

The builder a7f944bcd13b21980, the brief check aecd7b11c26c70e4a and the reviewers adb90dccc11ae0293 and a57800376f8d13f5b had ended before the landing; the runner's agent listing showed no agent of the step running.

## Not done

Nothing inside the brief.

## What landed

The whole range from base 266bf0c0e with the fixes at landing. The Overview makes one queue per Overview (`screen/layout-turns.ts`, a time budget of 8 ms per animation frame), every tile mounts and lays out its slide on that queue, and a tile that goes away leaves nothing on it.

Fixes at landing, five, each found at the look and inside the brief. (1) `screen/Framed.svelte`: a measure held while a layout waited was written after the layout and nothing measured again, which gave 107 false Too tall marks of 110; until the layout has run no measure goes to the store, and the finished layout has the Stage measure anew. (2) `arrange/Tile.svelte`: `contain: strict` in place of `contain: layout paint style`, since without size containment each forced layout laid out the whole page (86 `getBoundingClientRect` calls took 27.6 s; with it 1974 calls took 1454 ms). (3) `state/life/present.svelte.ts` and `arrange/Tile.svelte`: `tooTall` became `tallMark`, the mark's cell is looked up in a `$derived` of its own and read in another, since a reaction does not track a signal made while it runs (`node_modules/svelte/src/internal/client/runtime.js:561`), so a slide measured after its tile first read the cell showed no mark; opening a deck's Overview in a fresh pane shows the case. (4) `arrange/Overview.svelte`: `overflow-anchor: none`, since the browser's scroll anchor among arriving slides moved a scroll made while tiles arrive, from 500 to 452.5 px, about a second after the wheel. (5) `state/life/present.svelte.ts`: `tallFindings` writes one row per place in a source file, since a slide measured in its project's deck and in the portfolio deck was two Findings rows and counted twice.

## Unfixed, stated

The review's Spec finding stands as built: a waiting job asked again keeps its place, where decision 2 of the brief read that it goes to the back. The look's server log holds the browser's notice "ResizeObserver loop completed with undelivered notifications", which the console's errors do not show and which changes nothing drawn; whether the base gave it too is not verified.

## The look

On a scratch server from the step's worktree (8797), the hub path of a scratch HOME linked to the real hub for the portfolio deck and on the scratch hub for the too-tall slide, whose deck was restored afterwards.

- C7, 110 tiles of the portfolio deck, opened with the wheel turned at once: the last tile waited until 1933 ms, the long tasks were 118 ms and 53 ms, the scroll stayed at 500 px, and the wheel was answered in 43 ms. A reload with the Overview open: all 110 done about 4.3 s after load, 10 long tasks, the largest 315 ms at startup, layouts about 50 to 83 ms. A press on a tile while 19 waited was answered in 12 ms, went to 2 / 110 and closed the Overview.
- C8: 145 samples while tiles waited, no waiting tile with a mark. On the real deck 0 of 110 marked and 0 actually over. On a scratch deck the slide 589% over and a slide 2% over each carry the mark in the project's deck and in the portfolio deck, and the Findings view holds one row for each.
- C9, Light Modern with the Overview open: the tiles redrawn in the theme, 0 marks, the largest task 798 ms at the theme's global restyle, the others up to 294 ms, no console error. Dark Modern set back afterwards.
- C10: with 48 of 110 tiles arrived, choosing another deck takes the pane to that deck with the Overview closed, the first deck's tiles gone within about 300 ms; its Overview opened then drew its 2 tiles in about 130 ms. No console error.

## Verification

On main, with `TMPDIR` unset: `npm run diagrams && npm run docs:palette && npm run test:quick`.

```
test:quick: 11 changed file(s), from git since HEAD
test:quick: 19 test file(s)
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      ASCII gate (1.2 s)
ok      svelte-kit sync (2.7 s)
ok      svelte-check (12.3 s): 1794224810955 COMPLETED 591 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (12.6 s)
ok      vitest (33.4 s): Duration  20.52s (transform 34.81s, setup 0ms, import 60.09s, tests 2.53s, environment 456ms)
ok      vitest slow (40.4 s): Duration  27.30s (transform 13.70s, setup 0ms, import 18.46s, tests 8.70s, environment 0ms)
ok      vitest checks (59.0 s): Duration  45.92s (transform 15.75s, setup 0ms, import 34.48s, tests 107.86s, environment 3ms)
test:quick: 61.8 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
```

The plan has no bench list, so no A/B ran.

## Agents

Agents: brief check aecd7b11c26c70e4a, claude-opus-5-5, 155635 tokens, 19 tool uses, 370 s; builder a7f944bcd13b21980, claude-opus-5-5, 183581 tokens, 61 tool uses, 981 s, round 1 202999 tokens, 17 tool uses, 180 s; reviewer adb90dccc11ae0293, claude-opus-5-5, 177393 tokens, 29 tool uses, 1144 s; over round 1 a57800376f8d13f5b, claude-opus-5-5, 159360 tokens, 24 tool uses, 452 s.

The first report passed its bar. Five fixes at landing, named above.

## Next

`/refute migration O177` and `/refute migration O176`, then their repair rounds and landings.
