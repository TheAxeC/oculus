# Landing report: Q46

## Open items at this landing

- The steps a review booked rather than a brief (kept here because the skill books a finding beyond a brief in this list, and plan.md alone is not read in a report): Q49 a ticker row's hidden buttons take no room; Q50 a web address in a path field is not a hub path; Q51 `state/layout.svelte.ts` split; Q52 one branch-state sentence for the two git views, with the `data-repo` spelling; Q53 the accent line across nested pages and a folded pane; Q54 `ui/Tabs.svelte` split; Q55 the pane menu behind the pane body under the rice themes; Q56 the Files view retries a failed read; Q57 a workspace that is gone is not "not a git repository". Each is a fix of delivered work and needs no ruling; they are worked in queue order.
- The Files view keeps a failed read on screen after the cause is gone (seen 2026-09-17 22:25 on the TEST page while looking at Q43): the bookmarks section read "The bookmarks could not be read: Failed to fetch" while `GET /api/fs?bookmarks=1` answered 200, and only a reload cleared it; nothing retries the read and no control offers to. The same shape as the `no-roots` line D22 fixed at its landing. A fix of delivered work, no ruling needed: booked as Q56, after Q48.
- A Focus ticker row's name cut mid-word (seen 2026-09-17 22:22 on the TEST page while looking at Q41): on the Funding and Teaching rows of Axel's own board a row's name is cut with no ellipsis ("FWO Senior Postdo", "Bioinformatics (3740) - Coordin"), which is the hidden buttons holding their width. Already booked as Q49; recorded here as seen in the page.
- The recurring-findings pass the skill asks for at a pause (raised 2026-09-16 23:37): not done for the trial set's nine review reports; to run before the next dispatch. Ruled 2026-09-17 09:44, Axel: at the next pause; this one was a trial.

## NOT DONE

Nothing of the step itself. What the landing did not close is named in the note below and booked as its own step.

## What landed

- Q46 landed 2026-09-17 22:23 from worktree `q46` at ed1ae002 by `land.sh --no-browser`, one review (eight rulings), one repair round, the run over the round (five findings, four closed at landing, one recorded). Fixes at landing, in the worktree before the cherry-pick: the wall draws a failed read, which it never did (`config/text/views/memories.yml` gains `read_failed` and a sentence per reason word, `state/memories.ts` gains `readMessage`, `views/Memories.svelte` draws it in place of the empty-wall message; red with the empty message drawn whatever the error holds); the C8 marker exclusion gains its case (red with C8 allowed as a frame); the always-zero `tiff` local is gone; the three test files that left a scratch directory per run now remove what they make. The 512-chunk cap is recorded, not changed: a PNG whose `eXIf` sits past it reads unturned while Chrome turns it, and every real PNG on this machine puts it at chunk 2 or 3. On main: `npm test` 250 files 4,243 tests (the two `hpc/ssh` cases and `entry-edit` rerun alone under load, 5 of 5 and 52 of 52), `check` 1,218 files 0 errors 0 warnings, build, `format:check`, `lint`, the ASCII gate, `npx playwright test` on main 239 passed (5.4m). The look was taken on the TEST page of Axel's Chrome at 22:30: each tile takes its picture's shape, a tall document beside a wide photograph, with no bands.

## Where the proof is

- The step's brief: `agents/briefs/Q46.md`.
- Its review and the run over its repair round, with what was closed at landing: `agents/reviews/Q46-refuter.md`.
- The builder's report and its repair round: `agents/reviews/Q46-report.md`.
- The commands and their outputs are quoted in the note above.
