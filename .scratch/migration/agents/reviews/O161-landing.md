# O161 landing

Position: roadmap entry "migration" (the oculus migration plan); step O161, cheaper cards, landed; next: O165 (the guides redesigned), its /writing findings and Axel's approval, and O151 (a deck for every research project) when its builder hands back.

## Open items

None.

## Check of the landing's step 1

`ListAgents` listed one subagent, a242c8c8c4aa11ec0 (O151's builder); none of O161's agents (builder a336874264e7be26f, brief check ac24ce86435cfa7fd, reviewers a43610d99c434bb8e and a96cb64bab02b38fc) was running.

## NOT DONE

Nothing of the step. Not looked at: the app's own find bar and a real Cmd+F, which cannot be driven from here (the browser's find was checked through `window.find`); the menu key, since the key sent from here opens no menu on either server; the `flushSync` path from an effect, for which the review found no caller.

## What landed

Every card stays built and in the page. A card's page is found through the client's read memo without rebuilding the feed's identities; a card's context menu and tooltip are built on the first event their trigger answers; a text's markdown and an icon's filter are made once per page through the page's `HtmlMemo`, provided at the four route roots; the rows of `categories:` are read once per set of words for every card's strip. 50 paths, 808 insertions and 246 deletions.

## Merge and fixes at landing

- The merge with O166: `groupProjects(projects, config, wordsOf, archival = false, reads)`, RadarCard passing `false`; O166's snippets in `DatasetCard`, `LineCard` and `VenueCard` take the memo; O166's removal of `ontitle` kept; `EntryFields.svelte` keeps both imports; the diagrams taken from main and regenerated. `page-entry.ts` merged with O164 without a conflict.
- The review over round 1: Spec 1, Spec 2 and Proof 1 fixed in `agents/reviews/O161-report.md` (the open items, the threat paragraph's evidence, the three places that mount outside a route root). Dispositions under "Closed" in `agents/reviews/O161-refuter.md`.
- Prettier over `RadarCard.svelte`, the line the merge changed.
- Under ruling 715 (a) nothing the three unapproved scripts produced is used; the profile and the look stand for them.

## Verification

In the gate worktree at main's head 6038e7fdc: `npm run diagrams && npm run docs:palette && npm run test:quick` (`.agents/worktrees/gate-O161.log`): ASCII gate, svelte-kit sync, eslint, svelte-check ("589 FILES 0 ERRORS 0 WARNINGS"), vitest, vitest checks and vitest slow ok; prettier failed on `RadarCard.svelte`, then written with `prettier --write`, after which `prettier --check` over the staged files passes. On main: the same range and the gate's files, `cmp` of the staged diffs SAME. Not covered: tests that reach no changed file within the import depth, the build, the lint of unchanged files.

## The profile

On 8797 (this step) against 8798 (main's head), both over the hub copy, reloads taken in turn:

| View | Main's head | This step |
|---|---|---|
| Lit Watch, 678 cards in the page | 8637, 8735 ms | 4595, 3791 ms |
| Lit Watch, longest main-thread task | 5944, 6249 ms | 1342, 1229 ms |
| Projects board, 96 cards in the page | 2791, 2554, 2227, 2445 ms | 4994, 2013, 1951, 2027 ms |
| Projects board, longest task | 1470, 905, 780, 955 ms | 1232, 742, 708, 695 ms |

The step's first Projects reload followed the server's dependency re-optimisation.

## The look

- Lit Watch: 678 cards with the same joined text on both (hash f4bfaa77, 373397 characters); no menu or tooltip trigger built before use with the step (0 against 696 menus and 2095 tooltips).
- The browser's find: 247 matches of "learning" and 263 of "tensor" on both, in the same order.
- Menus: right-click, Shift+F10, Escape (focus to the body after a right-click, back to the card after Shift+F10) and a second card's menu replacing the first give the same items in the same order at the same place on both.
- Tooltips on hover and on keyboard focus the same; the card keys and Enter opening the page under the cursor the same.
- A paper added to the hub copy's `radar.yml` appeared at the top on both with no card drawn twice; its menu's Page opened its own page, and InfoAtlas's menu its own. Its relevance and why changed in the file showed on its card and its open page. The file was restored (`cmp` with the saved copy).
- The Projects board (96 cards, hash a07e5a6), the Archive board, Position Leads, Inbox and LinkedIn draw the same text on both; a project card's and a lead card's menus hold the same items. No console error.

## Agents

Brief check ac24ce86435cfa7fd: 184834 tokens, 49 tool uses, 10.4 min. Builder a336874264e7be26f: first run 198509 tokens, 52 tool uses, 11.4 min; round 0 build 265181 tokens, 325 tool uses, 106.7 min; the clash ruling 258775 tokens, 249 tool uses, 48.8 min; the redo 112573 tokens, 104 tool uses, 18.1 min; round 1 195430 tokens, 47 tool uses, 12.5 min. Reviewer a43610d99c434bb8e: 312868 tokens, 89 tool uses, 18.7 min. Reviewer over round 1 a96cb64bab02b38fc: 246209 tokens, 51 tool uses, 14.5 min. All claude-opus-5-5. The builder's first report did not pass its bar (one repair round).
