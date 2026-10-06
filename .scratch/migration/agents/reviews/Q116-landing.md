# Q116 landing

Position: plan oculus/migration, step Q116 (the Status view's Lines of code gives the count of everything under `src/`) landed. In flight: X3c (the tab strip), its round 1 run's findings disposed at landing, waiting on its diagnosis (Z371); T1c (the sweep of `tests/server/`), its brief checked. Next: T1c's builder, then X3c's diagnosis and landing; T1b, T1d and T1e after X3c lands.

## Open items

- Z371 (X3c's diagnosis of an active tab left out of sight): the TEST tab is hidden behind other windows, so Chrome draws no frame and the strip's reveal on a change of width cannot be seen. Options: (a) Axel brings the Chrome window holding TEST to the front for about ten minutes; (b) the session raises the window itself at a moment Axel names; (c) X3c lands without it and the defect goes to X3e. Recommendation (a); (c) is the lazy option.
- Z314 (the owed look Q81): unchanged, waiting on Axel setting `tasks.skip_permissions` himself.

## NOT DONE

Nothing of Q116's brief.

## Check of the agents

Q116's builder `a5abb57454b9e1db7` and its reviewer `a1e45c47e28e50948` are not running: `ListAgents` listed one subagent of this session, the T1c brief check `af7aef34899a8427b`, and the peer session `ordo-01`.

## What landed

Q116, one commit on main (the commit that carries this file), from base 76148458, as `agents/briefs/Q116.md` says: `underSource` and `isUnderSource` in `src/lib/state/system/lines.svelte.ts` sum every row whose folder is `src` or starts with `src/`; `LineCounts.svelte` draws that sum as a `src/` row directly above the first row under `src`, in folder style with no languages, the total unchanged; the help sentence in `config/text/views/system/status.yml`; HELP.md's Status row; one table test of the sum and the updated rows of `tests/views/system/status.test.ts`; the four layer diagrams, whose `views/system` to `state` and `views` to `state` counts rise by one for the new value import.

## Fixes at landing

1. The diagrams conflicted with D25's counts on main (`land.sh` exit 2 in the worktree's cherry-pick); `npm run diagrams` over the merged source regenerated them (143 and 835 against main's 142 and 834).
2. Standards 1: the table's zero-file row and its empty-list input are cut, since the server never sends either (`agents/spec.md:57`); `npx vitest run tests/state/system/lines.test.ts`: 78 passed.

## What was found

The refuter's four findings are closed under "Closed" in `agents/reviews/Q116-refuter.md`: the diagram files land with the step (Spec 1, Proof 1), the test title edit stays (Spec 2), the unreachable rows are cut (Standards 1).

## Verification on main

`sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` from `tools/oculus`, after both fixes: `checks: 7 commands passed` (npm test 579 files, 14141 passed, 661 skipped; test:checks 31 files, 471 passed; check 3336 files 0 errors 0 warnings; build; format:check; lint; the ASCII gate), ending 16:22 at load average 4.07 6.76 6.20. No A/B: the block names no `bench:`.

## The look on TEST

- The Status view's Lines of code, opened by its tab in the left pane and the pane put back on Changes after: the `src/` row stands directly above `src`, folder style at weight 400, no languages under it, and reads 944 files; `git ls-files src | wc -l` on main prints 944. The total row is unchanged in kind.
- No write left behind: `~/.oculus/changes.jsonl` and `workspaces.json` checksums and the history count as before; `git diff --exit-code -- config` clean.

## Usage

Builder `a5abb57454b9e1db7`, claude-sonnet-5-5 at ordo-high: 141,310 tokens, 29 tool uses, 13.5 min, one full-list run. Reviewer `a1e45c47e28e50948`, claude-opus-5-5: 136,700 tokens, 32 tool uses, 13.0 min. Brief check, claude-opus-5-5: 141,851 tokens, 31 tool uses, 4.8 min. The first report passed its bar, two fixes at landing. Review branch: `review: earned` ran the reviewer, since Q116 touches the state layer.

## Next

T1c's builder; X3c's diagnosis (Z371) and landing; then T1b, T1d and T1e.
