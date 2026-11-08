# O151 round 2: one slide per deck, every slide fits, on main's frame

Rules: `agents/spec.md`, the step's brief `agents/briefs/O151.md`, its round-0 rulings `agents/briefs/O151-cases.md` and `agents/briefs/O151-round1.md`, which stay in force except where this file says otherwise. This round is the exception ruled in `plan.md` Rulings, "Open item 730".

## Where you work

- **The oculus worktree is now `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O151-2`**, at oculus main's head 3d5b3da7d. The worktree `.agents/worktrees/migration-O151` is no longer yours: you neither read nor write it. Your report continues in the new worktree's copy of the ledger, `.scratch/migration/agents/reviews/O151-report.md`.
- **The hub worktree stays** `/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O151`.
- You write nothing outside these two worktrees. Backups, logs, programs, the scratch server's home and the browser's profile live in `.agents/scratch/` inside the oculus worktree, with `TMPDIR` and `GIT_CEILING_DIRECTORIES` both set to it, and are removed before the report; the verify list's `npm run test:quick` runs with `TMPDIR` unset.
- You may read, and never write, the project sources listed under "Up to date" in the live hub checkout `/Users/axelfaes/workspace/research-hub`, and nothing else of that checkout.

## The patch as applied

Main changed the slide's files since your first base: every size in a slide is now a fraction of the frame's width (`cqw`). Your oculus changes are applied to main's head with `git apply --3way` and all four files stand with conflict markers:

- `src/lib/themes/slide.css` (two conflicts)
- `src/lib/views/academic/present/Slide.svelte` (one)
- `src/lib/views/academic/present/parts/project/Facts.svelte` (two)
- `src/lib/views/academic/present/parts/project/Project.svelte` (two)

Finish them from the markers, keeping main's side wherever it states the frame and adding what O151 changes on it:

1. **The facts strip's two sizes are fractions of the slide.** `.slide-frame` holds `--slide-design-facts: 0.9375cqw` and `--slide-design-facts-label: 0.78125cqw` (12 and 10 px of a 1280 frame), and `body.rice .slide-frame` holds `0.859375cqw` and `0.703125cqw` (11 and 9 of 1280), with `--slide-fs-facts` and `--slide-fs-facts-label` as in your first change (times `--text-scale`, the factor 1). `Facts.svelte` is set in them as in your first change. Comments state the sizes as fractions of the frame's width, no px size of a slide.
2. **The column fix stays.** `Project.svelte` draws the right-hand column only while it holds the equation, a diagram or the name of a missing figure (`{#if right}`), with the head comment and the `.cols` comment that say so.
3. `Slide.svelte`'s comment about the strip is true of the frame as it now is. Nothing else in that file changes.

No marker is left in any file.

## Rulings (`plan.md` Rulings, "Open item 730")

1. **One slide per deck.** A second slide is rare. It is kept only where one slide truly cannot work, and the report names each deck that keeps one with why. Today 95 decks hold 145 slides. A fact the one slide has no room for is not dropped silently: item 2 of the brief still holds, so a fact that cannot stand on one slide is the reason for a second slide, named in the report.
2. **A second slide looks like the first:** the same layout, the same headline form, the same parts.
3. **Every slide fits.** Start from the 99 slides of `agents/reviews/O151-fit.md`. No slide of any deck is marked "Too tall" on the frame of main's head.
4. **Slides made from the material only.** The source rule of `O151-round1.md` binds every line: no interpretation, no critique, no verdict, no own arithmetic and no framing the sources do not give.
5. **Every deck is checked again against all 17 issues of the first build**, and the report says so per deck: critiques of a paper; statements the sources do not give; another project's result used as a bar; numbers from a file the sources do not name; a student project's work framed as Axel's; claims no source makes; a disagreement between paper versions not listed; chart values read off a picture; a fault of a paper put on a slide instead of in the private README; a fact dropped, overstated or added; repeated headings and lines across decks; text from another project's materials; banned prose patterns; unreported changes; programs the brief does not approve; slides too tall; the empty right-hand column on slides with no figure or equation.
6. **Up to date and proper.** Every number and every framing is the project's current one. The hub worktree was made before these projects' sources changed; for them the live hub checkout is the source: `projects/active/linfoot-estimator`, `projects/manuscripts/clinical-hccnet`, `projects/manuscripts/btfno`, `projects/manuscripts/bt-operator-theory`, `projects/ideas/ecg-af-fair`, each read for the files item 1 of the brief names, and `projects/archive/published/2026/dongho-ecg-clustering`.
7. **Kept as they stand:** the fixes of round 1, the fixes made at landing in the hub worktree (a review's findings R1-S1 to R1-S6, R1-P1 and R1-T1), and the private README records. No deck takes anything from a private section.
8. **Every changed line is reported,** before and after, with its source.

## The fit: your own scratch server

Ruling 730 has you draw every deck and fix until none is too tall, before you report. This overrides the brief's "The builder starts no server and opens no page", for this one purpose.

- The server runs from the oculus worktree, so it is main's head with your changes: `HOME=<oculus worktree>/.agents/scratch/home PATH=<oculus worktree>/.agents/scratch/fakessh:/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH TMUX_TMPDIR=/private/tmp/claude-502/lt npx vite dev --port 8796 --strictPort --host 127.0.0.1`, run in the background. The home and the fake ssh are in place under `.agents/scratch/`, and the home's hub is your hub worktree.
- You open the page in your own headless Chrome, `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome --headless=new --remote-debugging-port=9340 --user-data-dir=<oculus worktree>/.agents/scratch/chrome`, and drive it over its debugging port. You never use the user's Chrome, and never touch ports 8787 or 8790. You stop both processes, by the pid you started, before the report.
- One program is approved by ruling 730, in `.agents/scratch/`, and removed before the report. It computes one thing: for every slide of every deck, drawn in the Present view's Overview, whether its tile holds the mark "Too tall" and by how much the content passes the frame (`.tile.pressable`, its `.slide-frame`'s `scrollHeight` against its `clientHeight`). No other program is approved. Reading a slide is done by reading.
- The server is started before the first fix, so the report has a first measurement beside the 99 of `O151-fit.md`.

## Paths this round writes

In the oculus worktree: the four files above, and the report. In the hub worktree: each `present/` folder of the brief's list, whole. No `README.md` changes in this round, and a deck never takes a fix from one.

## Verify before you report

The brief's "Verify before you report" list, run after this round's last change, with `npm run test:quick` run with `TMPDIR` unset and these changes:

- Item 3 compares with `.agents/worktrees/O151-2-base/unused-exports.txt`, in the oculus main checkout's `.agents/worktrees`.
- Item 4 uses the base 3d5b3da7d for the oculus side.
- The final measurement, over every deck, printed by the approved program after the last change: 0 too tall.

The report appends a "Round 2" section to `O151-report.md`: per ruling what was done; the first and the final measurement; each deck that keeps a second slide with why; per deck the check of the 17 issues; every changed line before and after with its source; the verify lines.
