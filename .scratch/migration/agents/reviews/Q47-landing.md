# Landing report: Q47

## Open items at this landing

- The steps a review booked rather than a brief (kept here because the skill books a finding beyond a brief in this list, and plan.md alone is not read in a report): Q49 a ticker row's hidden buttons take no room; Q50 a web address in a path field is not a hub path; Q51 `state/layout.svelte.ts` split; Q52 one branch-state sentence for the two git views, with the `data-repo` spelling; Q53 the accent line across nested pages and a folded pane; Q54 `ui/Tabs.svelte` split; Q55 the pane menu behind the pane body under the rice themes; Q56 the Files view retries a failed read; Q57 a workspace that is gone is not "not a git repository". Each is a fix of delivered work and needs no ruling; they are worked in queue order.
- The Files view keeps a failed read on screen after the cause is gone (seen 2026-09-17 22:25 on the TEST page while looking at Q43): the bookmarks section read "The bookmarks could not be read: Failed to fetch" while `GET /api/fs?bookmarks=1` answered 200, and only a reload cleared it; nothing retries the read and no control offers to. The same shape as the `no-roots` line D22 fixed at its landing. A fix of delivered work, no ruling needed: booked as Q56, after Q48.
- A Focus ticker row's name cut mid-word (seen 2026-09-17 22:22 on the TEST page while looking at Q41): on the Funding and Teaching rows of Axel's own board a row's name is cut with no ellipsis ("FWO Senior Postdo", "Bioinformatics (3740) - Coordin"), which is the hidden buttons holding their width. Already booked as Q49; recorded here as seen in the page.
- The recurring-findings pass the skill asks for at a pause (raised 2026-09-16 23:37): not done for the trial set's nine review reports; to run before the next dispatch. Ruled 2026-09-17 09:44, Axel: at the next pause; this one was a trial.

## NOT DONE

Nothing of the step itself. What the landing did not close is named in the note below and booked as its own step.

## What landed

- Q47 landed 2026-09-17 22:40 from worktree `q47` at b03f22d0 by `land.sh --no-browser`, one review (nine rulings), one repair round, the run over the round (seven findings, three closed at landing, two booked as Q57 and into Q52, two recorded). Fixes at landing, in the worktree before the cherry-pick: `repo-shape.ts`'s three comments say five shapes, not four; the new browser spec's `afterEach` empties its session store instead of removing the folder, since the session watcher does not always see a directory removed and remade, which is what made its second case intermittently red (`--repeat-each=3`: 6 passed). Booked rather than fixed: a workspace the reader deleted reads "not a git repository" while the Repositories view draws git's reason, which needs the state to say which of the two a root is (Q57); the `data-repo-failed` spelling in `Repo.svelte` (added to Q52). Recorded: `shape === 'reading'` and `repo === null` cannot disagree, so ruling 5's closure has no check; `tests/browser/git.ts` commits under one author for both specs. On main: `npm test` 250 files 4,243 tests (the `hpc/ssh` budget case rerun alone under load, 5 of 5), `check` 1,221 files 0 errors 0 warnings, build, `format:check`, `lint`, the ASCII gate, the changes YAML parsed; `npx playwright test` on main after the commit, 241 passed (5.5m). The look was taken on the TEST page of Axel's Chrome at 22:45 over this session's own workspace: the panel draws the touched files, then the repository with its branch line (`main`, 98 ahead, push), the new-branch form and the staged group with its unstage controls. The four sentence states are not reachable on his own data and were read in the served build by `tests/browser/changes.spec.ts` instead.

## Where the proof is

- The step's brief: `agents/briefs/Q47.md`.
- Its review and the run over its repair round, with what was closed at landing: `agents/reviews/Q47-refuter.md`.
- The builder's report and its repair round: `agents/reviews/Q47-report.md`.
- The commands and their outputs are quoted in the note above.
