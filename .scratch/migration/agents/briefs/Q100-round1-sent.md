# Q100 repair round 1 (sent 2026-09-28)

The round starts at the worktree commit `d5a94e03` (the step's work as you left it, committed by the orchestrator). The findings are those of `agents/reviews/Q100-refuter.md`. Every item below is a known change: nothing here asks you to find a cause, reproduce a fault or measure. You work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q100/tools/oculus` and nowhere else, run no git command of any kind in any checkout (read-only ones included), start no tmux session on the default server, run no browser test and write under `.scratch/` only your report. Never open, print or grep `config/local.yml` in any checkout. The rules file and the brief still hold.

## Change

1. `tests/views/whole/tinted.test.ts` `namesStrip`: a `:global(...)` holding a selector list is read as that list. After every `:global(...)` is read through, the selector is split at its commas, and it names only strips when every part ends with a strip. So `:global(body.wall) .grid :global(.rows, .ec-header)` counts as a surface of the view's own, as `:global(.ec-header, .rows)` already does.
   - Case: a view that asks for the tint whose only wall rule has the selector `:global(body.wall) .grid :global(.rows, .ec-header)` is `extra`.
   - Case: the same with `:global(body.wall) .grid :global(.ec-header, .ec-list .ec-day-head)` keeps `{ missing: [], extra: [] }`. With `selectors()` replaced by `list.split(',').map((one) => one.trim())` this case turns red, so the depth tracking has a test; quote that failure.
2. The strip rule is narrowed to the strips that stay in place.
   - `STRIPS` names `.ec-header` and `.ec-list .ec-day-head` (the list view's date heading, with the list as its context), and its comment says why each is one: the time grid's and the day grid's header is sticky, the list view's date heading is sticky, and the day heading inside a grid's header is not sticky itself.
   - A strip counts only in a component whose script imports `@event-calendar/core`, the library that draws those classes; in any other component a rule naming `.ec-header` is a surface of the view's own.
   - Case: `:global(body.wall) .grid :global(.ec-time-grid .ec-day-head)` is `extra`.
   - Case: `:global(body.wall) .cards .ec-header` in a component that does not import the library is `extra`; the same rule in a synthetic component that imports it keeps `{ missing: [], extra: [] }`.
   - The file's head comment and `STRIPS`'s comment say both conditions in one sentence each.
3. `DESIGN.md:216`, the sentence this step added: it also names a table's sticky header row (`ui/display/Table.svelte`, whose `th` carries the same mix under `body.wall`), since that is the other strip over rows of the same box that keeps the pane's mix.

## Report corrections

4. Under the user-visible changes, with the before and after: the time grid's all-day row, which sits inside the sticky header and now carries the pane's mix with it (before transparent with the blur, the rows readable through; after the mix); and the month view's weekday row, which does not scroll and now carries the mix, one step darker than the pane's tint (before transparent with the blur over the tint; after the mix over the tint), matching the `background-color: var(--panel)` it already has without a wallpaper.
5. The report's first section is the open items as the main checkout's `tools/oculus/.scratch/migration/orchestrator-state.md` lists them when you finish.
6. For each new or changed case, quote its failure with the change it guards undone, then put the file back.

## Tests

Run only the test files you change while working, then the verify list once at the end: `sh ~/.claude/skills/land/templates/verify.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md </dev/null` from `tools/oculus` in the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, and quote the lines it prints. A failure that is only a timeout under load and passes when its file runs alone is named as such and not fixed.

Rewrite the report at `.agents/worktrees/Q100/tools/oculus/.scratch/migration/agents/reviews/Q100-report.md` with these items, in the brief's shape.
