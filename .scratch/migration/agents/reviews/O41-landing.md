# O41 landing

Position: oculus migration, step O41 (motion for the actions the reader waits on, the rail's number as the sum of its page's counts, and the clone finding that counts worktrees), landed; next: O40's repair round 1, its review and its landing, then O38, then O39.

## Open items

- 136 (2026-10-18): File > Open in Browser in the app's menu, and the other menu items the app needs. Decisions: where it lands (a step of its own after O40, recommended, or folded into O40's repair round, the lazy option since it widens O40 past its part); what it opens (the app server's main page at `/`, recommended, or the address of the window it is pressed in); which further menu items go in; no new item takes a key the page or an app holds.
- 137 (2026-10-18, this landing's look): the Source Control view's moving line is drawn at the top of `Repo.svelte` (lines 252-258), right under the Repositories list, so with two repositories it lies 5 px under the second row's own line and reads as that row's. Options: (a) keep it; (b) draw it under the view's title bar, where VS Code draws its progress; (c) draw no view line while the list is shown. Recommendation: (b). The lazy option is (a).

## Not done

- Not looked at, each for the reason in `agents/reviews/owed-looks.md` "Cannot be taken on this hub": clone (case 21, the folder panel), Submit Job (case 18, the real cluster), an update task and Run now (case 20, an agent started from a page), and every motion under the system's reduce-motion setting (a system setting the session does not change).
- Case 16's "a send refused changes nothing" was seen as the busy root's sync button drawn disabled; a send through another control on a busy root was not tried.

## The check of Steps 1

The builder a3b197066c39c6c82 and the reviewers aaf31f5ef12ea8dc2 and a3da982beb8e425df had ended before the landing began; the one agent running during the landing was O40's reviewer a03ea6cee5f5d717c, which has since ended.

## What landed

From base cc0a63390: 71 files under `tools/oculus` (+2,316 -1,349, `git diff --cached --shortstat`), as the booking in `plan.md` under O41 states: the store keeping the action in flight per root and the words for it, the moving lines on the Source Control view, the repository's row, the Search results and the Literature results, the turning glyphs of the status bar's sync and Publish items, the Usage refresh, the update tray and Run now, the clone notice; the rail's number as the sum of its page's rail parts with their hover words and the most urgent tone; tab counts for Findings, the Session list and Processes; clones counted by the git folder they share.

## What was found, and the fixes at landing

The review over round 1 (`agents/reviews/O41-refuter.md`, "Repair round 1, refuted" and Closed):

- Finding 1, the apps store's hosts left with no caller: fixed, the processes store reads the apps store's hosts, so the Processes count includes running and starting app hosts.
- Finding 2, Publish with several remotes stays a Menu: ruled, the waiting Menu is drawn as the turning `sync` button and keeps the focus; seen at the look.
- Finding 3, the Session list's marks during a write and after a failed one: fixed, a mark is held while its write is in flight and a failed write drops it.
- Findings 4 and 5: no change; the reviewer's own runs stand.
- Finding 6, RepoItems' head comment: fixed.
- First run, Standards 4: G13 and G32's paths in `agents/guarded.md` fixed.
- Declined point, a host that is starting: a host the view draws with Stop counts.

From the look: the Literature search's line said "Searching ..." (`config/text/views/feeds/literature.yml:59`, the wording of D38's step, now drawn as the line's label); fixed to "Searching...", in the gate and on main.

## Verification

- In the gate `.agents/worktrees/gate`, `npm run diagrams && npm run test:landing`: npm test 2,353 passed and test:slow 531 passed except one "[vitest-pool-runner]: Timeout waiting for worker to respond" for `tests/ui/html.dom.test.ts`, under the load of O40's reviewer's tests; `npx vitest run tests/ui/html.dom.test.ts` then 8 of 8 passed, and the file holds no slow test. ASCII gate, format:check, check, lint, test:checks and build ok.
- After the text fix: `npx prettier --check` on the file passed, `npm run test:checks` 298 passed and 8 skipped.
- `cmp` of the gate's `git diff HEAD -- tools/oculus` and main's `git diff --cached -- tools/oculus ':!tools/oculus/.scratch'`: identical, 6,463 lines each.

## The look

On TEST at localhost:8790 (the page made with New page and renamed TEST):

- Rail: Projects 25 green, hover "Projects, key 2 (Projects 20, Coauthor 2, Personal 3)"; Incoming 2 red, "Incoming, key 3 (Inbox 2)"; Explorer 77 in the accent, "Explorer, key 5 (Repositories 77)"; Academic Life 6 green, "Academic Life, key 6 (Funding 3, Education & Service 1, Applications 2)"; System 1 in the accent, "System (Audit 1)", Processes giving nothing.
- Counts: the Processes tab and catalogue row 3 with three rows listed; Findings none with no findings; Audit 1; the Session list's catalogue row none; the board tabs keep their own numbers (Projects 53).
- Search: "function" over every root drew the moving line labelled "Searching..." until the 500 hits answered. Literature search: "block term tensor decomposition" drew the line until 77 papers answered.
- Usage: Refresh on the gmail card turned its glyph, one glyph only, and stopped at the answer.

On a scratch oculus on 8796 served from the gate, with a scratch home, a hub copied from the test fixture, two repositories with bare remotes and 15 s hooks:

- Commit: "Committing..." line on the row and on the view, the busy words line, until the commit landed.
- Push from the status bar's sync item: the `sync` glyph turned with the counts kept, hover "Pushing..."; with the Repositories tab closed and a file of the repository active, it kept turning until the answer.
- Publish to one of two remotes: one dimmed turning `sync` button holding the focus, "Publishing the branch...", the counts back after the answer.
- A sync started from the Repositories view on `repo` while a file opened through the `repo-sub` root was active: the status bar turned.
- `repo` pushing and `repo2` syncing at once: each row's own line and words; the busy `repo`'s sync button disabled.
- Stage: no line.
- The scratch server and its tabs are stopped and closed; Axel's server and tabs were not touched, and the TEST page holds the Search, Literature search and Repositories tabs the look opened.

## Agents

- Builder a3b197066c39c6c82, claude-opus-5-5: 113,596 tokens, 281 tool uses, 49.4 min; round 1: 323,151 tokens, 112 tool uses, 24.8 min. Its first report did not pass its bar (the first review's findings went to round 1).
- Brief check a5ee76e018077f142, claude-opus-5-5: 254,121 tokens, 97 tool uses, 16.1 min.
- Reviewer aaf31f5ef12ea8dc2, claude-opus-5-5: 337,168 tokens, 86 tool uses, 18.4 min.
- Reviewer over round 1 a3da982beb8e425df, claude-opus-5-5: 271,818 tokens, 79 tool uses, 17.4 min.

## Next

O40's repair round 1 with rulings 133 to 135 (a) and its review's findings, the review over the round, /land O40 with its looks; then O38, then O39.
