# O41 round 1: the findings of the review

Rules: `agents/spec.md`, `agents/guarded.md` and the step's brief `agents/briefs/O41.md`, which stay in force except where this file says otherwise. The review is `agents/reviews/O41-refuter.md`. Work in the same worktree, `.agents/worktrees/migration-O41`, on the tree as you left it. Run no git command that changes state, no page, server, Electron app or browser, no breakage testing of any kind, and no diagnosis of any kind (no /diagnose, no diagnosis agent, never suggested). Append your round report to your report at `tools/oculus/.scratch/migration/agents/reviews/O41-report.md` in the worktree, under the heading `## Round 1`, with the cases' and checks' lines quoted.

## What to change

1. **The Processes count holds the app hosts that run (review Spec 1).** The Processes tab's count is every program the view lists as running: the process rows its table draws, as `count` in `src/lib/state/system/machine/processes/processes.svelte.ts` counts them now (a pane process only when it has a pid, the group's other processes, the matched ones), plus each app host the view lists above the table whose state is running (the rows `AppHosts.svelte` draws from `apps.hosts()`, which `Processes.svelte:63-65` hands it). An app host whose row says it ended, or that the view does not list, is not counted. Read the apps store from the processes store or add it to `BadgeClient` (`registry.ts`), whichever keeps one place that counts; the tab and the view must read the same rows. Rewrite the store's head comment, the `count` doc comment and the `Processes.svelte` registration comment to say so. Quote a run over a fake payload with two running app hosts and no terminal (count 2) and with one terminal process plus two running app hosts (count 3).
2. **The tone clause made false (review Standards 1).** At `DESIGN.md:338`, `src/lib/state/workbench/navigation/registry.ts:154` and `src/lib/state/workbench/rail-badges/rail-badges.svelte.ts:38`, the part's tone is described as the tone the view's tab badge has: an urgency tone (`red`, `amber`, `green`) where the view or `nav_live`'s `tone:` sets one, else the hue of the statuses it counts, as the Funding count's violet. No sentence says the tone is present only when the count means "act". Grep `railPart`, `RailPart` and `means "act"` across `DESIGN.md`, `HELP.md`, `docs/` and `src/` and fix every sentence the same way.
3. **HELP.md's Clone bullet (review Standards 2).** Add to the Clone bullet at `HELP.md:496` this sentence, word for word: `While a clone runs, its Clone control turns its glyph and a notice with a moving line says "Cloning <name>..."; clearing the notice does not stop the clone.` Before writing it, check each clause against `clone.svelte.ts`, `ProjectCard.svelte` and `CardActions.svelte`, and quote the lines that make each clause true; a clause the code does not make true is left out and named in the round report.
4. **The board cells by config, not by label (review Standards 5).** `RAIL_CELLS` in `src/lib/views/boards/projects/Projects.svelte` names cells by their `label:` values in `config/layout.yml`. Change it so that no `label:` value of `tab_rollup` is written in code: Coauthor and Personal give the rail the count of the FIRST bucket of their `tab_rollup` list (the bucket of cards in work, first in both lists), and Projects gives the count of its `active` type, the key `tab_split` names. `boardPart` takes what it needs to find that cell (the cell's place in the list for a rollup board, the type key for Projects) and its doc comment says so. Quote a run that goes through the registrations themselves, the `railPart` hook of each of the three board registrations called with a client built over a fake snapshot and the repository's real `config/layout.yml`, printing each part's count and tone, then the same with Coauthor's first bucket relabelled in the fake config (the count must stay).
5. **Publish stays focusable while it runs (review Behaviour 2).** In `src/lib/shell/status/RepoItems.svelte`, the Publish button drawn while a publish runs takes no press but keeps its place in the tab order and the focus: use `ToolButton`'s `waiting` (drawn disabled, kept focusable, as Submit Job's control does) in place of `inert`. The head comment says so.
6. **The Session list and its count agree after an archive lands (review Behaviour 3).** In `src/lib/views/sessions/session-list/SessionList.svelte`, the list's own override of a row's archived state (`archivedNow`) holds only until the channel's `hidden` for that row equals it: once the sessions channel gives the row the archived state the press set, the override for that row is dropped, so a later change of `hidden` from another place is drawn, and the list's archived rows are the channel's again. The same holds for the pin override that shares that code (`topNow`) if it has the same lifetime; read it and say. Between the press and the channel's answer the list draws the press and the count still reads the channel; state that in the `sessionInputCount` doc comment. Quote the lines that drop the override and say how you checked it by reading.
7. **The report's missing parts (review Standards 3 and Behaviour 1, and Proof 1 and 2).** In the round report:
   - the grep of the added comment lines and test titles of the whole step for the history words, with each hit judged;
   - the grep for each new helper's or type's name before it was written (`gitFolderOf`, `repositoryStandIns`, `listedClones`, `RailPart`, `RailView`, `RailBadge`, `railBadge`, `RunningAction`, `repositoryRoots`, `collectionRailPart`), with what it found;
   - the grep of every changed or removed name (`firstBadge`, `submit.busy`, `submitting`, `state.busy`, `applicationsBadge`, `repositoriesBadge`, `collectionBadge`, the old `Repo.svelte` path, `tests/data/sources/manifests.test.ts`) across `src`, `tests`, `config`, `docs`, `HELP.md`, `DESIGN.md` and `README.md`, with each hit fixed or said to be right;
   - each paragraph of `DESIGN.md`, `HELP.md` and `docs/` on a behaviour the step changes, listed as still true or rewritten;
   - the edits to existing assertions of `tests/state/sources/clone.test.ts`, before and after per changed line;
   - what the code does for each new key when it is empty, duplicated or colliding (`acting` keyed by root, `starting` keyed by the row, `pressed` keyed by the account label);
   - what each new asynchronous path does in flight, after close and when superseded (a second Usage press on one account, the Schedule list closed while `runNow` awaits, the clone notice when the page reloads, a second Submit press while one plans);
   - the Views catalogue: the new badges of Findings, the Session list and Processes are drawn there too; state it before and after;
   - the right place of the Session list's archived predicate (`SessionList.svelte:147-149`, `archivedNow[row.id] ?? row.hidden`), in place of the line the first report gave;
   - that cases 1 to 3, 5, 8 and 10 were run with each view's part written by hand, and which of them item 4's run through the registrations now covers.

## Not in this round

The paths of `agents/guarded.md` (G13 and G32 after the test split) are ledger text; the orchestrator writes them at landing. Leave `agents/` untouched apart from your report.

## Verify before you report

From `tools/oculus` in the worktree, each must print what it printed in your first report or better:
- `npm run test:quick` passes every command.
- `npx vitest run tests/data/sources/manifests/manifests.test.ts tests/data/sources/manifests/clones.test.ts tests/state/sources/clone.test.ts` passes (74 tests or more).
- `sh utils/unused-exports.sh` diffed with `/Users/axelfaes/workspace/research-hub/.agents/worktrees/O41-base/unused-exports.txt` adds no line.
- The spec's ASCII gate over every file the step changes prints nothing.
- `wc -l` of every touched `.ts` and `.svelte` file: no source file over 880 lines, no component over 520.
- Cases 1 to 10 of the brief rerun after the change, and the runs items 1 and 4 ask for.

## Paths this round writes

Every path of the brief's list, plus:
- `tools/oculus/src/lib/state/system/machine/processes/processes.svelte.ts`
- `tools/oculus/src/lib/views/system/machine/processes/Processes.svelte`
- `tools/oculus/src/lib/state/workbench/navigation/registry.ts`
- `tools/oculus/src/lib/state/workbench/rail-badges/rail-badges.svelte.ts`
- `tools/oculus/src/lib/views/boards/projects/Projects.svelte`
- `tools/oculus/src/lib/shell/status/RepoItems.svelte`
- `tools/oculus/src/lib/views/sessions/session-list/SessionList.svelte`
- `tools/oculus/DESIGN.md`, `tools/oculus/HELP.md`, and any `docs/` page item 2 finds
- `tools/oculus/.scratch/migration/agents/reviews/O41-report.md` (the round report, appended)
