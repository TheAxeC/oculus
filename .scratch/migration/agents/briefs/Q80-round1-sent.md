# Q80 repair round 1 (sent 2026-09-28)

The round starts at the worktree commit `56f1749d` (the step's work as you left it, committed by the orchestrator). The findings are those of `agents/reviews/Q80-refuter.md`. Every item below is a known change: nothing here asks you to find a cause, reproduce a fault or measure. You work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q80/tools/oculus` and nowhere else, run no git command of any kind in any checkout, and write under `.scratch/` only your report. The rules file and the brief still hold.

## Rulings on what stays

- `--skip-uniqueness` stays: without it cloc drops a byte-identical tracked file, and every tracked path must be counted.
- `grouped()` and `app.thousands_separator` stay; the paths beyond the brief's list stay, each necessary as the reviewer found.
- `trackedFiles` stays on git.ts's one call site, as the brief says.
- One count per page store stays; the server keeps no module state, as the brief says.

## Change

1. The perl-missing failure (brief item 3). `LinesOptions` (`lines.ts:91`) gains `perl?: string`, passed to `spawn` in place of `PERL`. Case: `perl` naming a binary that does not exist answers `{ error }` with a sentence naming perl and cloc.
2. The store's missing cases (`tests/state/system/lines.test.ts`): a non-ok answer with no `error` field says `status.lines_bad_status`; an answer failing `readCount` on `total` and on `counted` says `lines_bad_total` and `lines_bad_counted`; a rejected fetch says its sentence.
3. A body that is not JSON (`lines.svelte.ts:127`): the body is parsed in its own `try`, and a failure holds `t('status.lines_bad_status', response.status)`, so no engine message reaches the reader. Case: a 500 answering HTML shows that sentence.
4. A failed Count again after a good count keeps the last table on screen with the error sentence above it, in place of clearing it (`lines.svelte.ts:130-144`). Case: a good count, then a failed one, draws both the table and the sentence.
5. An aborted request (`src/routes/api/(machine)/lines/+server.ts` and `countLines`): the route passes `request.signal`, and an abort kills the cloc child and answers nothing further. Case: an abort while the child runs leaves no child running (the injected spawn records the kill).
6. The tests that stay green with their change reverted:
   - `tests/server/machine/lines.test.ts:152`: assert `exited with code 1`; `:164`: assert `stopped by` (or the timeout sentence as written); `:143`: assert the sentence starts `git could not list the tracked files`.
   - `tests/state/system/lines.test.ts:46`: assert `asked` is `[]` right after the first `store.lines()` and before `settle()`, so the deferred fetch is proved.
   - `tests/views/system/status.test.ts:681`: stub `location` with an origin so Hooks draws, and assert the lines title comes before `status.hooks_title`.
7. `grouped()` (`format.ts:49`): drop the NaN and Infinity branch and its test; the store refuses a non-integer before it reaches the view.

## Report corrections

8. Say that the brief's "same-origin check the other machine GETs make" names no GET on the tree (the two machine routes are POSTs behind the write token), that there are two `sameOrigin` functions (`server/core/auth.ts:38`, which refuses a request with neither header, and `server/content/images.ts:298`, which admits it), and that `auth.ts`'s was taken as the stricter.
9. Name, as a limitation, `spawnSync`'s 1 MiB output cap on `ls-files` (about 80 KB on oculus's own tree).
10. State each before and after the report left out: the Status view over a folder that is not a git checkout, and on a machine without perl (the red sentence with Count again); and a failed Count again after a good one (item 4's behaviour).
11. For each new or tightened case, quote its failure with the change it guards undone, then put the file back.

## Tests

Run only the test files you change while working, then `npm run check`, `npm run format:check` and `npm run lint`. Do not run the full verify list: the orchestrator runs it on main at landing.

Rewrite the report at `.agents/worktrees/Q80/tools/oculus/.scratch/migration/agents/reviews/Q80-report.md` with these items, in the brief's shape, its first section the open items as the main checkout's `tools/oculus/.scratch/migration/orchestrator-state.md` lists them when you finish.
