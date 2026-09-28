# Q98 repair round 1 (sent 2026-09-28)

The round starts at the worktree commit `be867d83` (the step's work as you left it, committed by the orchestrator). The findings are those of `agents/reviews/Q98-refuter.md`. Every item below is a known change: nothing here asks you to find a cause, reproduce a fault or measure. You work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q98/tools/oculus` and nowhere else, run no git command of any kind in any checkout, and write under `.scratch/` only your report. The rules file and the brief still hold.

## Rulings on what stays

- The `cut` prop on `ToolButton` in place of the brief's RadarCard rules stays: the boundaries check makes the prop the right shape. The ellipsis is checked at the landing's look.
- The six paths beyond the brief's list stay, each necessary as the reviewer found.

## Change

1. `src/lib/server/sessions/record.ts:31`: the comment on the title length says "The prefix of the first prompt that becomes the fallback title", which a slash-command prompt makes false. Write "The length the fallback title is cut to."
2. `src/lib/ui/html.ts:3-4`: "the catalog's own text under config/text/ is oculus writing to itself and is drawn as it is" now reads false beside the paragraph on `codeSpans`. Say it is drawn without the sanitiser.
3. `src/lib/server/sessions/record.ts:213`: `slashCommand` has no reader outside `record.ts`; drop its `export`. The tests reach it through `title()` as they do now.

## Report corrections

4. The revert that turns the `codeSpans` merge red is the Markdown case of `tests/ui/html.test.ts:469-476` (`public (`a<b & c`) but *no* entry [x](y)`), not the `datasets` case, which lexes to no two neighbouring plain tokens. Correct that line.
5. Keep the line naming the `git log -1` you ran in the main checkout. No git command is run in this round.

## Tests

Run only `tests/server/sessions/stores/transcripts.test.ts`, `tests/ui/html.test.ts` and `tests/ui/display/code-text.test.ts` while working, then `npm run check`, `npm run format:check` and `npm run lint`. Do not run the full verify list: the orchestrator runs it on main at landing.

Rewrite the report at `.agents/worktrees/Q98/tools/oculus/.scratch/migration/agents/reviews/Q98-report.md` with these items, in the brief's shape.
