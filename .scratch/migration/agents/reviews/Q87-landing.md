# Q87 landing

Roadmap entry oculus/migration (the migration of oculus). Plan step Q87: the duplication check on jscpd. Next: Q82 (its review over round 1) and Q81 (its first review), then Q79b, which runs alone.

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

- None.

## NOT DONE

Nothing of the step. The step changes no view, so it has no look.

## The check before landing

The runner's agent listing showed no builder or reviewer of Q87 running: only Q82's builder and Q81's reviewer were listed.

## What landed

`tests/checks/tree/duplication.test.ts` now runs jscpd 5.3.3, which is a new devDependency. It calls the package's own launcher twice per group, once for `src/lib` and once for `tests`:

- The code run reads TypeScript, JavaScript and Svelte files. It keeps the clones that are neither CSS nor markup.
- The markup run reads every component as HTML, with its script and style blocks skipped. It keeps the markup clones.

In both runs, import statements are skipped and a clone whose two ends are in the same file is dropped. A clone's count is the number of lines both ends hold, which is the smaller of its two extents. Its mark is a hash of its tokens as the TypeScript scanner reads them.

`allow-duplication.txt` lists the 191 clones the tree already shares: 47 under `src` and 144 under `tests`. Before this step it held 642 (38 and 604). The import checks stay hand-written, as ruled in Z45 (a).

## What was found

- The first review found six false markup clones in the allow list. jscpd's markup format reads a component's script and style blocks as a few opaque tokens, so a markup clone could run through two blocks whose text differs. Round 1 split the check into the two runs above. The builder's first report therefore did not pass its bar.
- The round 1 review found that jscpd's Svelte format skips any component whose script and style blocks together hold fewer than fifty tokens, markup included. A markup copy between two such components would have passed the check.
  - Fixed at landing: the markup run reads `.svelte` files as HTML (`--format html --formats-exts html:svelte`).
  - A new case goes red with the markup run in the Svelte format (`Tests 1 failed | 17 passed (18)`) and passes with the fix (`Tests 18 passed (18)`).
  - Over the tree, the markup run gives the same 9 cross-file clones under `src/lib` and 0 under `tests` in either format, so the allow list is unchanged.
- The builder's report gave the wrong cause for the 16 components the markup run skips. They are skipped because their markup holds under fifty tokens (16 to 48 each), not because their scripts are short. None of them could hold a markup clone.
- The round 1 review also found three comments that were false. All three were fixed at landing:
  - The comment at `duplication.test.ts:442-443` was removed.
  - The head comment said a clone is always at least eight lines. The eight-line minimum holds in one of the two files only. It now says so, and says the count can be under eight when one file lays the same tokens on fewer lines.
  - One head comment line ran past the hundredth column, which `comment-width.test.ts` caught; it was rewrapped.
- Time of the check on main: 4.20 s, 4.28 s and 4.36 s over three runs. The builder and the round review measured the check before this step at 1.1 to 1.3 s once the files are cached.

## Verification on main

- `npm test` failed on one test, in a file the step does not change: `tests/server/git/git-ops.test.ts`, "routes each action to its own operation with its own fields" (`Test Files 1 failed | 352 passed (353)`, `Tests 1 failed | 5667 passed | 1 skipped (5669)`). `npx vitest run tests/server/git/git-ops.test.ts` alone gave `Tests 37 passed (37)`.
- `npm run check`: 0 errors, 0 warnings. `npm run build`, `npm run format:check` and `npm run lint` each exited 0. The ASCII grep found nothing.

## Usage

- Builder: 26 tool uses, 133k tokens, 6 min for the hand-back on the cases; 43 tool uses, 202k tokens, 14 min for the build; 43 tool uses, 285k tokens, 12 min for round 1.
- Reviewers: 167k tokens, 44 tool uses, 10 min for the first review; 194k tokens, 47 tool uses, 17 min for the round 1 review.
- Fixes at landing: four. The markup run's format, the false comment, the head comment on the eight-line minimum and the smaller extent, and the rewrapped comment line.

## Next

`/refute` Q82 over round 1, then its landing with the look on TEST. Then Q81's findings are ruled when its review returns.
