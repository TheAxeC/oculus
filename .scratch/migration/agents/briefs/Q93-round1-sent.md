# Q93 repair round 1 (sent 2026-09-28)

The round starts at the worktree commit `98100b22` (the step's work as the builder left it, committed by the orchestrator). The findings are those of `agents/reviews/Q93-refuter.md`. Every item below is a known change: nothing here asks you to find a cause, reproduce a fault or measure. You work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q93` and nowhere else, run no git command, and write nothing under `.scratch/`. The rules file (`tools/oculus/.scratch/migration/agents/spec.md`) and the brief (`agents/briefs/Q93.md`) still hold: no browser test and no `// revert:` line anywhere; one unit case per fix; ASCII only; a comment says what and why, never history.

## Change

1. **Head comments the strip made false.** Each of these says every case names the change that turns it red, which is no longer true. Delete that sentence and nothing else of the comment:
   - `tests/views/sources/repositories/repositories.test.ts:4`
   - `tests/state/sources/repositories/repositories.test.ts:109-110`
   - `tests/state/sources/fs.test.ts:544-546`
   - `tests/state/sources/explorer.test.ts:73`
   - `tests/views/sources/files/files.test.ts:8`
2. **Two browser-suite pointers broken across lines.** Rewrite each in the brief's decision 2 form ("needs a DOM and is not run here"):
   - `tests/state/sources/files.test.ts:6-7` ("...which is the browser / suite's.")
   - `tests/routes/page.test.ts:6-7` ("What it does on screen is the browser / suite's.")
3. **`.prettierignore:10-12`.** Drop "and the browser specs" so the sentence names only `tests/data/demo-hub.test.ts`.
4. **"Checked in a browser" phrases.** Rewrite each in the decision 2 form; your decision 4 is reversed, since no browser run exists any more:
   - `tests/shell/panes/splitview.test.ts:8`
   - `tests/shell/panes/paneview.test.ts:7`
   - `tests/shell/workbench.test.ts:10` and `:288-289`
   - `tests/ui/primitives.test.ts:7`
   - `tests/views/boards/focus.test.ts:9-10` and `:219`
   - `tests/views/boards/projects.test.ts:9` and `:588`
   - `tests/state/workbench/drag.test.ts:9`, which also loses "after this package lands"
5. **History comments.** `src/lib/server/machine/pty/channel.ts:371` and `src/lib/views/sessions/terminal/Terminal.svelte:301` mention "the first Chrome check". Keep what the code does and why; delete the history.
6. **`tests/checks/tree/allow-duplication.txt`.** 82 of the 663 reasons give "at X and Y" line numbers that the strip shifted (for example, the `tests/views/sessions/sessions.test.ts` side of several entries is 14 lines off). The file's header says the reason names where the first shared window sits. Set every reason's numbers to the lines where that window now starts in each file, for every entry whose files this step changed. Change no mark and add or remove no entry.
7. **The duplication check reads past a `/*` inside a `//` comment or a string.** In `tests/checks/tree/duplication.test.ts`, `meaningful()` (`:102-106`) opens a block comment at any `/*`, so a line like `// ending in /**` or `'ui/**'` hides the lines after it from the check. Replace `line.indexOf('/*')` with a scan that skips quoted strings (`'`, `"`, backquote, with backslash escapes) and returns -1 at a `//` outside a string. The orchestrator measured this change on a copy of your tree: `npx vitest run tests/checks/tree/duplication.test.ts` passes (1 file, 9 tests), so it surfaces no new duplicate. Add one unit case over `meaningful()`: a `//` comment holding `/*`, and a string holding `/**`, each followed by code lines, and those code lines are returned.
8. **Kept as you built them, no change:** the `demo/hpc` and `demo/sessions` deletion with its `demo/README.md` paragraph, the `tests/fixtures/scratch.ts` comment, and the `plantScratch` fold in `tests/ui/colours.test.ts`. The path list is widened to them.

## Report corrections

- The 80-case drop is explained: all of it is in the four deleted test files (`revert-check.test.ts` 41, `revert-base.test.ts` 17 plus its loop cases, `tests/browser/shell/layer.test.ts` 14, `revert-anchors.test.ts` 7); no kept file lost a case. Say so in the report.
- The lock file keeps 2 lines naming playwright: vitest's own optional peer entries. The brief's expected 0 was wrong.

## Verify, once, at the end of the round

While you work, run only the unit files your change touches. At the end, once, from `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q93/tools/oculus`:

```
sh /Users/axelfaes/.claude-work/skills/land/templates/verify.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md
```

It must end with `verify: 6 commands passed`. Quote the lines it prints. Also run `grep -rn -E '^[[:space:]]*// revert:' src tests bin` (prints nothing).

## Report

Return it as your final message. First line: anything NOT done, or "Everything in the round is done". Then one row per item above (DONE / NOT DONE, the file and line, the command that proves it), then the verify lines verbatim.
