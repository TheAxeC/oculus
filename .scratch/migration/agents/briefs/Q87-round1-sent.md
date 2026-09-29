# Q87 repair round 1 (sent 2026-09-29)

The round starts at the worktree commit `66772ee6` (the step's work as you left it, committed by the orchestrator). The findings are those of `agents/reviews/Q87-refuter.md`. Every item below is a known change: nothing here asks you to find a cause, reproduce a fault or measure until a condition holds. You work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q87/tools/oculus` and nowhere else, run no git command of any kind in any checkout, start no tmux session on the default server, run no browser test and write under `.scratch/` only your report. The rules file, the brief and the cases ruling still hold.

## The cause, checked by the orchestrator

jscpd's `html` format reads a component's `<script>` and `<style>` bodies as a few opaque tokens, so an `html` clone can run through a whole script or style block whose text differs between the two files. Over `src/lib` at `66772ee6`, 15 cross-file `html` clones are reported with the ruled flags, and 6 of them have a fragment holding `<script` or `<style` (ActivityRail/Pages, ActivityRail/PagesReset, CommandCenterView/Tasks, Data/Domains, Catalogue/Pages, Catalogue/Settings). Run again with `--ignore-pattern` holding the import pattern plus `(?s)<style[^>]*>.*?</style>` and `(?s)<script[^>]*>.*?</script>`, the same tree gives 9 cross-file `html` clones, exactly the 9 without a block, with the same spans. That pattern also drops every TypeScript clone inside a component's script, since tokens overlapping a match are skipped in every format, so it cannot replace the first run.

## Change

1. The check runs jscpd twice per group, both through the launcher as ruled. The first run keeps the flags as they are now and keeps its clones whose format is neither `css` nor `html`. The second run adds `(?s)<style[^>]*>.*?</style>` and `(?s)<script[^>]*>.*?</script>` to `--ignore-pattern`, and keeps its clones whose format is `html`. Same-file clones are dropped from both, as now. Both report folders are under the test's scratch directory and removed after.
2. The count in the output line and in the allow list reason is the number of lines both ends hold: the smaller of the two extents' line counts (`end - start + 1` of each). The head comments of `duplication.test.ts` and `allow-duplication.txt` say so, and say that a component's script and style blocks are never part of a markup clone.
3. `allow-duplication.txt` is regenerated from the new runs. The six entries above go, and any entry the new runs give takes their place.
4. Cases, each quoted with its failure when the change it guards is undone, then put back:
   - Two `.svelte` files with the same 11 markup lines of 50 or more tokens, and scripts and styles that differ, report one clone of 11 lines starting at the first markup line, and nothing that starts at line 1.
   - Two `.svelte` files whose script blocks differ in one value and whose markup is short and different report nothing (the Catalogue/Settings shape).
   - Two `.svelte` files sharing a 12-line function in their scripts still report it as a TypeScript clone.
   - Two files whose clone extents differ in length name the smaller count.

## Report corrections

5. The cases' first run: for the three tests with no first run on the unchanged tree ("passes one file holding the same function twice", "keeps the mark when a comment line is added inside the clone in the first file", "names a copy in the script of two components") and for case 9, give the result each gives against the check as it was at the base. The base check is `tests/checks/tree/duplication.test.ts` in the main checkout, `/Users/axelfaes/workspace/research-hub/tools/oculus/`; read it there and run a copy of it with the cases added in your own scratch folder, never in the main checkout.
6. Under the visible changes, with before and after: the time of the check (before about 5.6 s, after what your run gives, both from one machine); that an edit inside a component's script or style no longer moves a markup clone; that an install with `--omit=optional`, or a platform with no prebuilt jscpd binary, fails the check with jscpd's message.
7. The held entries after the regeneration by group, beside 641 (38 under `src`, 604 under `tests`) before.
8. The report's first section is the open items as the main checkout's `tools/oculus/.scratch/migration/orchestrator-state.md` lists them when you finish.

## Tests

Run only `tests/checks/tree/duplication.test.ts` while working, then `npm run check`, `npm run format:check` and `npm run lint`. Do not run the full verify list: the orchestrator runs it on main at landing.

Rewrite the report at `.agents/worktrees/Q87/tools/oculus/.scratch/migration/agents/reviews/Q87-report.md` with these items, in the brief's shape.
