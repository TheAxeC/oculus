# O146 landing

Position: the cockpit-to-oculus migration, step O146 (a deck's frame size and the slide findings); next is O147 (the Present view's filter bar), with O152 (the Venue tag's tier icon) able to run beside it.

## Open items, verbatim

None.

## The check of Steps 1

`ListAgents` listed no subagent of this session, only four peer sessions; the builder a3a5cf9fbc5f20011, the brief check and both reviewers had finished.

## NOT DONE

Nothing of the step.

## What landed

The whole range from base 8c3da2a2f (the wip commit 9e034fd6f: the builder's first run and repair round 1), 84 paths counted without renames, with these fixes at landing:

- One measure per slide while two versions of a deck are drawn (the review over round 1, Spec S1, option (b)). The Present store keeps the deck each pane draws (`drawing(pane, deck)` in `src/lib/state/life/present.svelte.ts`), and a slide's measure leaves the store only when neither the saved deck's answer nor any drawn deck holds the slide (`prune`, `holds`). `src/lib/views/academic/present/acts/live.svelte.ts` is `createDrawn`, which hands the store the deck its pane draws; `Present.svelte` draws that deck. Option (c), keeping the ruling, was the lazy option.
- A slide that moves inside its file is measured again (Behaviour B1): the `drawing` text of `screen/Framed.svelte` holds the slide's source path and line.
- The head comment of `src/lib/themes/slide.css` rewrapped (Standards St1).
- The reading column, from the look: in a 1024 frame it measured 894 px, not 896 px, since `.reading` is `width: 100%` inside the frame's content box and the frame is `border-box` with a 1 px border; the `calc` term of round 1's `min()` never bound. `--slide-reading` is `1040px` as on the base, `--slide-width` (set in `screen/Stage.svelte` and `routes/present/print/+page.svelte`) and `--slide-pad`, read by nothing else, are removed, and the head comments of `slide.css` and `Slide.svelte` state the column as drawn.
- `agents/guarded.md` G13 names the moved settings tests.
- The Stage's measure, from the look: with the forty-item slide first in a 1024 by 768 deck, the pane, which draws the key hint, measured 911 px and the tile 912 px, since the Stage took the rounded `scrollHeight` (1753 of 1753.375) less the hint's rounded `offsetHeight` (76 of 75.59). `screen/Stage.svelte` now takes both heights unrounded in the frame's own px and rounds the difference once; the head comment no longer says it sets the width the reading column is made from.

## What was found

- The review over round 1: Spec S1, Behaviour B1 and Standards St1, closed by the fixes above; Proof P1 and P2 are lines of the builder's report, whose facts the booking states (the measure reruns through `drawing`, the column is 1040 px at 1280, and the grep of `O146-report.md:427` prints the one spread inside `pageFindings`, `status.ts:497`).
- Premise corrections of the brief: `Slide.svelte` is `src/lib/views/academic/present/Slide.svelte`; verify item 2 runs the folder `tests/data/sources/config/settings`; the ASCII gate names a `bin/` folder that does not exist.
- The 16 portfolio slides marked too tall are the hub's own content; O151 cuts them.

## Verification

In the gate worktree at main's head b70a0ad14, `npm run diagrams && npm run docs:palette && npm run test:quick`:

- Before the Stage fix, at a load average of up to 18 from other sessions: three tests timed out (`tests/data/hubs/workspace-projects.test.ts`, `tests/routes/git/zenodo.test.ts`, `tests/routes/machine/cpp.test.ts`, each `Test timed out in 5000ms`), no assertion failing; the three files alone: `Test Files 3 passed (3)`, `Tests 61 passed (61)`.
- After the Stage fix: `ok prettier`, `ok ASCII gate`, `ok svelte-kit sync`, `ok eslint`, `ok svelte-check (15.2 s): ... COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok vitest checks (202.0 s)`, `ok vitest (276.7 s)`, `ok vitest slow (504.8 s)`, `test:quick: 508.9 s; every command passed`.
- Not covered: tests that reach no changed file within the import depth, the build, the lint of unchanged files. No test covers the Stage's measure; the look checked it.

On main the same range cherry-picked and the fixes copied; `git diff --cached --no-renames b70a0ad14` equals the gate's under `cmp`. A/B: none, `bench: []`. The verify list unchanged.

## The look

On a scratch server on 8797 from the gate, with the scratch hub:

- The portfolio deck's Overview: 22 tiles at 1280 by 720, the reading column 1040 px, 16 Too tall marks; a tooltip reads "slide too tall: Liver-cancer prognosis from a patient's whole MRI history runs 996 px past its frame of 1280 by 720 px", and the Findings view lists 16 such rows.
- The ECG-AF (FAIR) deck with `deck.frame` 1024 by 768: the pane, three Overview tiles and the presenter screen at 1024 by 768, the column 894 px. Its forty-item slide is marked Too tall, "runs 912 px past its frame of 1024 by 768 px" (content 1678 px in 766), and the Findings count rose from 164 to 165. The presenter screen measures the slide it moves to.
- With that slide first, the pane with its key hint and the tile both give 912 px, before and after the Overview is closed and opened again.
- The Settings view's section `Slides`: the Width (1280) and Height (720) controls with their help lines.
- A deck's `present.yml` in the editor: the hover on `frame` shows its help line from the deck schema; the completion under `deck:` offers no schema key while `title` and `frame` are both set. The new line typed for it was undone and the tab closed clean.
- The console holds no error. The scratch deck was restored and equals its backup; the server is stopped, 8797 free.

## Agents

- Builder a3a5cf9fbc5f20011 (claude-opus-5-5): first run 113217 tokens by the final notice (328084 by the notice at the hand-back), 488 tool uses, 70 min 0 s; round 1 217810 tokens, 93 tool uses, 25 min 16 s.
- Brief check ab81b2ba12033c208 (claude-opus-5-5, 236854 tokens, 102 tool uses, 13 min 29 s).
- Reviewer afd5d153ef1fe296b (claude-opus-5-5, 282804 tokens, 84 tool uses, 24 min 25 s).
- Reviewer over round 1 a2d2a3b6eaecb28b4 (claude-opus-5-5, 227871 tokens, 67 tool uses, 18 min 28 s).

The builder's first report did not pass its bar (one repair round). No diagnosis record.

## Next

O147, the Present view's filter bar, through `/spec`; O152 may run beside it.
