# Q97 repair round 1 (sent 2026-09-28)

The round starts at the worktree commit `4da494a5` (the step's work as you left it, committed by the orchestrator). The findings are those of `agents/reviews/Q97-refuter.md`. Every item below is a known change: nothing here asks you to find a cause, reproduce a fault or measure. You work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q97/tools/oculus` and nowhere else, run no git command, and write under `.scratch/` only your report. The rules file and the brief still hold.

## Change

1. **The Views view's heading test can fail.** `tests/views/system/workbench/catalogue.test.ts:51-58` compares the drawn headings with the constant `SHIPPED_RAIL_LABELS`, so it stays green with the Help rail entry removed (the view orders headings by `nav_groups`). Compare the drawn headings with the loaded config's `rail` labels, `(config.rail as { label: string }[]).map((entry) => entry.label)`, as `tests/state/workbench/navigation/catalogue.test.ts:260` does, and keep the check that Help sits right after System. It must fail with the Help rail line removed from `config/layout.yml` and pass with it.

## Report corrections

2. **The cases' first run.** Give it: in a scratch copy of `tools/oculus` outside the repository (never in the worktree), put the base's `config/layout.yml` (the orchestrator puts it at `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/Q97-base-layout.yml`) and run the eight test files of the brief; quote which cases fail. Then undo each change as the report's case table names it (the Help rail line, `info` back to two panes, the `help` arrangement removed, the glyph changed) and quote the result, the Views view test from item 1 included. Delete the scratch copy after. The first line of the report says everything is done only when it is.
3. **The key sheet's before and after.** Under the user-visible changes, `config/text/app.yml:12`: before "h1-h5 | open the manual, the Memories wall or a hub document, the Help group", after "... the Help page's group".

## Tests

Run only the test files the brief names while working. Do not run the full verify list: the orchestrator runs it on main at landing. Report the eight test files' result, `npm run check`, `npm run format:check` and `npm run lint`.

Rewrite the report at `.agents/worktrees/Q97/tools/oculus/.scratch/migration/agents/reviews/Q97-report.md` with these items, in the brief's shape.
