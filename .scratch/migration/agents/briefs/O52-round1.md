# O52 round 1: the folded career panel found by the browser's find, and the report's before and after

Rules: `agents/spec.md` and the step's brief `agents/briefs/O52.md`, which stay in force except where this file says otherwise. The refuter report is `agents/reviews/O52-refuter.md`; the findings below are its B2, S1 and B1, each with the ruling to carry out. Its P1 and S2 change nothing in the code and are not sent.

## What to build

1. **B2, the browser's find reaches the folded career panel.** `src/lib/views/boards/focus/career/CareerPanel.svelte:119` hides the folded body with `hidden={!unfolded}`. A closed `<details>`, which the body was before the step, is opened by the browser's find-in-page when a match lies inside it; content under plain `hidden` is not searched. Fold the body with `hidden="until-found"` while `unfolded` is false, and on the element's `beforematch` event set `unfolded` to true, so a find that matches text in the folded panel unfolds it and the fold control reads "Fold Career strategy" after. The body stays mounted while folded (C9 of the brief). Use the way Svelte 5 attaches an event the element types do not list (an attachment or an action), with no cast that hides a type error; `npm run check` stays clean. Check by reading Chromium's documentation of `hidden="until-found"` and `beforematch`, and quote the sentence the choice rests on in the report.
2. **S1, the comment at `src/lib/views/boards/focus/FoldHead.svelte:69-70`** is rewrapped as a paragraph at 100 columns, so no line inside the sentence ends short (`spec.md`'s comment rule).
3. **B1, the report's before and after** states the folded career box's height: 28 px before (1 + 26 + 1) and 32 px after (1 + 4 + 22 + 4 + 1), the same as the command center's folded box, so everything under the banner moves 4 px down while it is folded; unfolded the total is unchanged. Say these are by reading, not measured.

## Cases (first run on the round-0 tree in the worktree, then after)

1. C9 of the brief, read again: the folded body is in the document and hidden; after the change it carries `hidden="until-found"`.
2. The folded panel, a find of a word in the career text: before, the find matches nothing in the panel (by reading the attribute); after, the `beforematch` handler sets `unfolded`, and the panel is drawn unfolded. A test where `spec.md`'s test rule calls for one: a client test that dispatches `beforematch` on the body and expects the fold control's label to read "Fold Career strategy", seen failing on the round-0 tree first.
3. The fold control pressed while unfolded folds the panel again with `hidden="until-found"`.

## Paths this round writes

- `src/lib/views/boards/focus/career/CareerPanel.svelte`
- `src/lib/views/boards/focus/FoldHead.svelte` lines 69-70
- a test file under `tests/` for case 2, when one is written
- `.scratch/migration/agents/reviews/O52-report.md` (the report, a section "Repair round 1" appended)

## Verify before you report

From the worktree root, after the last change, once: `npm run test:quick`. The ASCII gate over the changed files as the brief gives it. The plan's whole verify list runs once, at landing on main.

## Report

Append "Repair round 1" to the report: per finding, what changed with the file and line, the case runs (the first run on the round-0 tree before the result), the verify lines quoted, and the before and after of B1 and B2.
