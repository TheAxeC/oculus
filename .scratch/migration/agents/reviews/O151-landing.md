# O151 landing

Position: the oculus migration, step O151 (a deck for every research project) landed in oculus. Next: Axel reads the slides, once the decks are committed in the hub on his word.

Open items: none.

## Check of Steps 1

The builder a69da2be8a76365d5, the brief check a423faa7257a10eea and the reviewers a6f5f05ec3e63f0f2, a79e0d6fd9a360f28 and a6bfcba59bb3a80aa had ended before the landing; the runner's agent listing showed none of them.

## Not done

- The hub's 132 `present/` paths and 11 `README.md` records are uncommitted in the hub worktree `.agents/worktrees/migration-O151`; the commit waits on Axel's word. The worktree and its snapshot `migration-O151-round-2` stay until it.
- The audit row `{ file: present/present.yml, tiers: { words: [research] } }` is uncommitted in the hub's `.oculus/config.yml`; the commit waits on Axel's word.
- No deck draws a figure: 27 panels on 19 decks are undrawn, the files stay in their folders. Decks holding an equation: 13, against 43 in the round 2 snapshot. Second slides of 10 decks carry the equation and their first slides do not. Axel reads the slides and rules what changes.
- The portfolio deck's Overview (110 tiles) froze the page for more than five minutes, so its tiles were not seen drawn.

## What landed

The four oculus files of O151, +53 -35: the facts strip's two sizes as fractions of the slide (`src/lib/themes/slide.css`, `parts/project/Facts.svelte`), the right-hand column drawn only while it holds something (`parts/project/Project.svelte`), and the comment in `Slide.svelte`. Main's staged change equalled the gate's under `cmp`. Landed as built by Axel's ruling on open item 735.

Fixes at landing, in the hub worktree: the review's Spec 3 and Spec 6, on ward-bttr-crosssubject, fermat, hcc-modality-poster, extended-bttr-note and bttn-incident-af, each shortened until its slide fits. The lines are in the booking under O151 in `plan.md`. Whether the builder's first report passed its bar: no.

## The look

On a scratch server from the gate over the hub worktree, in Chrome, under Dark Modern and Light Modern. Seen: the fermat slide with no right column, text across the whole width; the ward and bttn second slides, equation in the right column; hcc-modality-poster; the portfolio's first slide (1 of 110). Measured: 95 decks, 108 tiles, 0 marked Too tall, the five decks changed at landing re-measured after the last edit. Facts strip per 1280 of frame, value and label: 12 and 10; 18 and 15 at text size 1.5; 8.4 and 7 at 0.7; 19.2 and 16 at 1.6; 11 and 9 under `body.rice`. The portfolio Overview froze the page, as above.

## Verification

`npm run diagrams && npm run docs:palette && npm run test:quick` in the gate: verify-exit=0, "test:quick: 63.5 s; every command passed" (`.agents/worktrees/gate-O151.log`). No A/B: `bench: []`.

## Agents

Builder a69da2be8a76365d5: first run 152174 tokens, 27 tool uses, 6.7 min; build 353934, 1300, 161.4 min; round 1 320238, 675, 68.3 min; round 2 337137, 740, 107.2 min. Brief check a423faa7257a10eea: 217403, 73, 12.6 min. Reviewers: a6f5f05ec3e63f0f2: 206748, 180, 23.1 min; over round 1 a79e0d6fd9a360f28: 353095, 142, 21.8 min; over round 2 a6bfcba59bb3a80aa: 379076, 54, 15.1 min.

## Next

The hub commit of the decks and of the audit row, each on Axel's word; then Axel reads the slides.
