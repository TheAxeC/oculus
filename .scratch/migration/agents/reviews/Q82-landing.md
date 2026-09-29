# Q82 landing

Roadmap entry oculus/migration (the migration of oculus). Plan step Q82: the explorer tree on zag's tree-view, with the long lists virtualized. Next: Q81 (the review over its round 1, then its landing with both looks), then Q79b, which runs alone.

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

- None.

## NOT DONE

The look was not taken. At landing, the browser tab showed Axel's Focus page, and a look is taken only on TEST. The look will be taken on TEST together with Q81's (`owed_look` in Q81's dispatch entry). It covers:
- in the Files tree, the Repositories changes and the Graph;
- the keys, the `a` type-ahead, Cmd+A, and Cmd+Enter on a row;
- Tab to a stop that has scrolled away, and the focus kept through a wheel scroll;
- the Graph's Left and Right, and its open commit;
- the gaps, the first ten rows and the indent guides.

## The check before landing

The runner's agent listing showed no builder or reviewer of Q82 running. Q82's round reviewer was listed as completed, and only Q81's builder was running.

## What landed

`ui/tree/TreeView.svelte` now runs `@zag-js/tree-view` through `@zag-js/svelte`, over the collection that `ui/tree/tree-keys.ts` builds from the caller's rows.
- A lowercase `a` is sent to the tree as a type-ahead letter.
- A letter typed with Cmd or Ctrl held is left to the browser.

Three lists have no cap on their rows: the Files tree, the Repositories changed files and the commit graph. They now draw only the rows in view, through `ui/tree/VirtualRows.svelte` on `@tanstack/virtual-core`.
- Three rows stay drawn when scrolled out of view: the row at the tree's stop, the row the focus is in, and the graph's open commit.
- Until a list has found its scroll box, it draws its first ten rows and holds the height of the rest.

The Graph hands its open commit's files as rows under the commit. Left from a file goes to its commit, and Right on an open commit steps into its first file.

The changes to `package.json` and `package-lock.json` merged with Q87's automatically, and `npm install` left both files unchanged.

## What was found

- **The first review.** The builder's first report did not pass its bar. The review found:
  - the `a` key was swallowed by zag's key map;
  - Tab could skip a windowed tree;
  - the focus was lost when its row scrolled out of view;
  - Cmd+A was taken by the tree;
  - the open commit's files were read again at each remount;
  - the first run of the cases gave 15 failed and 82 passed, where the report said 12 and 85.

  Round 1 closed each of them.
- **The round 1 review.** It found two failing checks, a missing test and a lost key. All four were fixed at landing:
  - `files.test.ts` was 928 lines, over the 900-line limit. The long-tree audit moved to `tests/views/sources/files/tree-window.test.ts`, and `files.test.ts` is now 886 lines.
  - Two new absence assertions had no reason. A reason now stands directly above each.
  - The row holding the stop had no test. `TreeHarness.svelte` now writes the kept rows on a hidden line, and a new case fails with `kept: () => []` or with the stop falling back to the last row.
  - Cmd+Enter and Ctrl+Enter on a row with no button did nothing, because the round withheld every key pressed with a modifier. Only a character with a modifier is withheld now. A new case covers it, and `DESIGN.md:309` says "a letter".
- **Browser-only behaviour.** The kept rows other than the stop, the Graph's `keep`, the type-ahead send and the text-scale factor of the first spacer run only in a browser. The owed look covers them.

## Verification on main

`checks: 6 commands passed`: `Test Files 355 passed (355)`, `Tests 5692 passed | 1 skipped (5693)`, `npm run check` with 0 errors and 0 warnings, and the build, format, lint and ASCII checks all passing.

## Usage

- **Builder:** 97 tool uses, 339k tokens and 30 min for the build; 55 tool uses, 167k tokens and 27 min for round 1.
- **Reviewers:** 246k tokens, 72 tool uses and 17 min for the first review; 199k tokens, 47 tool uses and 13 min for the round 1 review.
- **Fixes at landing:** four, the test file split, the two reasons, the kept-stop case and Cmd+Enter.

## Next

Q81's round review, then Q81's landing with both looks on TEST. Then Q79b, which runs alone.
