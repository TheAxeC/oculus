# O166 landing

Position: roadmap entry "migration" (the oculus migration plan); step O166, the record pages made one design, landed; next: the landing of O161 (cheaper cards), then O165 (the guides redesigned).

## Open items

None.

## Check of the landing's step 1

`ListAgents` listed one subagent, a242c8c8c4aa11ec0 (O151's builder); none of O166's agents (builder ae67fca9ae879a854, brief check af52cf6c33a07ae89, reviewers a3498add57a00290f and a8ce87366f2e26d24) was running.

## NOT DONE

Nothing of the step. A LinkedIn post was not looked at: the hub copy behind the scratch server holds no LinkedIn folder.

## What landed

Every record page draws its card, then the row of count buttons (one per category that holds a project with a slice, the total, and "<n> waiting on <name>" for a person), then its blocks under small labels with no section bars. A button opens the record's board "Projects of <name>" with that category's slices picked; the total opens it with none. On the page the card's fields stand in two columns, one in a narrow pane. "Referred to by" is replaced by a "Named by" tag line, and a resource's `slurm.resource` tag opens Settings at that row in the primary hub's scope. 61 paths, 2631 insertions and 1708 deletions.

## Fixes at landing

- Review over round 1, Finding 1 (Ruling 1 of the cases ruling, one count per record everywhere): the strips of the Pillars, Domains and Venues cards keep the dead-ends group (`RecordCard.svelte` `archival`, passed by `LineCard.svelte`, `DomainCard.svelte` and `VenueCard.svelte`). The strips of an entry's and a person's card keep it too (`crossLinks` and `roleLinks` in `src/lib/state/boards/structure/cross-links.ts`): the look showed the MSc supervision 2024-2025 card with 5 of the 6 projects its page counts.
- Review over round 1, Finding 2: `namedProjects` names a project its `related:` lists twice once, so the card's strip, the page's row and the board count it once.
- The head and doc comments of those files rewritten; `docs/palette.md` regenerated (the view `record_board`, the first review's S1).
- The dispositions of every finding are under "Closed" in `agents/reviews/O166-refuter.md`.
- `docs/HELP.md` sentences this step makes false (`:271` twice, `:272`, `:305`, `:359`, from the builder's report) are carried by O165, which rewrites the guides and lands after this step (its dispatch entry, `carries:`).

## Verification

In the gate worktree at main's head 7d902b85e: `npm run diagrams && npm run docs:palette && npm run test:quick` (`.agents/worktrees/gate-O166.log`, `gate-O166-2.log`). The last run: prettier, ASCII gate, svelte-kit sync, eslint, svelte-check ("588 FILES 0 ERRORS 0 WARNINGS") and vitest slow ok. vitest failed on `tests/data/hubs/workspace-projects.test.ts` ("Test timed out in 5000ms"), a file the step does not change, which passes alone (5 of 5). vitest checks failed on `comment-width.test.ts` at `cross-links.ts:181`, a line of the landing's fix, rewrapped; after it `comment-width`, `history` and `workspace-projects` pass (13 of 13). On main: the same range and the gate's files, `cmp` of the staged diffs SAME. Not covered: tests that reach no changed file within the import depth, the build, the lint of unchanged files. No test imports `cross-links.ts` or `record-board.ts`; the counts were checked at the look.

## The look

On 8797 over the hub copy, after the fixes:

- Pillars view: tensor "47 projects", strip 9, 11, 14, 6, 2 and 5 dead-ends; federated 23, its strip summing to 23. The tensor pillar's page in two columns, row "9 in review ... 5 dead-ends 47 projects"; its dead-ends button opens "Projects of Interpretable Structured-Tensor Methods", "5 of 47 shown".
- Domains view: every card's strip sums to its count. Venues view drawn with its strips.
- Person page (Maryam Amir Haeri): row of 12 projects and "1 waiting on Maryam Amir Haeri"; "6 in review" opens a board "6 of 12 shown"; the waiting board opens as a second tab with BT-Op-Theory.
- Organisation page (University of Twente): "Named by" four people, no "Referred to by", row summing to 99.
- Resource page (UTwente HPC): "The setting slurm.resource" opens Settings in the Hub scope at Slurm: Resource unfolded; the rail's Settings choice then opens the Workspace scope at Rail and pages.
- RAW-PLS project page: row "2 projects", Documents and Sessions under small labels.
- An entry whose link names a hub folder (a scratch README put in the hub copy and removed after): Documents, Files and Sessions under small labels.
- A funding scheme's page (ZonMw AI-HCC) in two columns in a wide pane and one in a narrow one; its Funding card and the MSc supervision Education card count what their pages count (8 and 6).
- Career, a lead's page, a Lit Watch card and the Archival card drawn as before; no console error.

## Agents

Brief check af52cf6c33a07ae89: 267934 tokens, 87 tool uses, 13.2 min. Builder ae67fca9ae879a854: round 0 hand-back 290096 tokens, 56 tool uses, 8.1 min; build under the cases ruling 264771 tokens, 471 tool uses, 88.5 min; round 1 315313 tokens, 45 tool uses, 8.6 min. Reviewer a3498add57a00290f: 334161 tokens, 116 tool uses, 19.4 min. Reviewer over round 1 a8ce87366f2e26d24: 200549 tokens, 48 tool uses, 8.0 min. All claude-opus-5-5. The builder's first report did not pass its bar (one repair round).
