# Q35 cases ruling (round 0)

Case 8 of the brief gives 0.078125 for `fit(100, 50)`. The rule of item 5 is `fit(w, h) = min(w / 1280, h / 720)`, which gives `50 / 720` (0.06944...) for 100 by 50; 0.078125 is the width ratio alone. The rule stands and the expected value is corrected.

Ruling: (a). Case 8 reads: 1920 by 720 gives 1; 1280 by 1440 gives 1; 640 by 360 gives 0.5; 100 by 50 gives `50 / 720`; 0 by 0, -5 by 10 and NaN give 0. The test compares with `toBeCloseTo(50 / 720, 12)` for that value. Not chosen: (b) the input changed to fit the old value, which tests the width ratio twice and never a height-bound frame; a test that accepts either value, the lazy option.

Everything else of the first run stands as reported. Continue from the edits already in the worktree: rerun every case of the first run on them once the source is complete, then build the rest of the brief (`fit` in `state/life/present.ts`, `Present.svelte`, `Slide.svelte`, `parts/`, `jump.ts`, the docs, `type-scale.test.ts`, `allow-audits.txt` line 11) and run the verify list as `agents/spec.md` says.
