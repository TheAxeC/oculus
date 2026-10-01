# Q109, repair round 1

The refuter's report is `agents/reviews/Q109-refuter.md`. Each finding below has its ruling; change nothing else. Run no git command of any kind (spec.md, "Where you work"). Work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q109`. Your paths are the brief's, widened by this round where a ruling names a file. Rewrite your report `tools/oculus/.scratch/migration/agents/reviews/Q109-report.md` for the whole step after the round, with a "Repair round 1" section that names each finding below, what changed, and, for a change of behaviour, the test that fails without the change (quoted from a run on the code before this round's change, in the test's final form). Run the unit test files your change touches while you work and the verify list once at the end; no browser test and no revert directive.

## Proof

1. Proof 1, `tests/server/root/watch/probe.ts`, `holdsQuietAndMaxWait`: rename the test `keeps the maximum wait of the module when the quiet is 0` to what it asserts, `runs one rebuild for each event when the quiet is 0`.
2. Proof 2: the report sorts every test named "audits that ..." in the step into audits and proofs, one line each, as verify 5 asks. `audits that no option change resizes the grid` is an audit (an `OptionsTarget` has no `resize`); the report says the fact that the config effect sends no resize rests on the reading of `TerminalGrid.svelte:438-444`.
3. Proof 3, the FROZEN exemption: fold `terminalFont` and the four terminal options into one module binding in `src/lib/state/shared/words/appearance.ts` (for example `let terminal: { fontPx: number | null } & TerminalOptions`), written only by `setAppearance`, so `tests/checks/tree/boundaries.test.ts` keeps one entry for it in place of `terminalFont` and `terminalSettings`. The readers of the font and of the options read from that binding; their exports keep their names and shapes.
4. Proof 4, the first-run quotation: the report's first-run section names each case's own tests (case 5's `posts the grid size again when it changed while the resize was out ...` among them) and quotes the failure line of each from your first run on the unchanged tree.

## Standards

5. Standards 1, `DESIGN.md:361`: replace the clause "as they are because the page asks for the channel only after its resize answered, or after `RESIZE_WAIT` (2 s) with no answer" with "as they are once the page's resize has answered; after `RESIZE_WAIT` (2 s) with no answer the channel is asked for anyway, and the first lines can land at the old height".
6. Standards 2, `config/catalogs/options.yml`, `terminal.copy_on_selection`: "false copies only through Copy." becomes "false copies only when asked: Copy, Copy as HTML or the copy key."
7. The opening of `DESIGN.md:116`, the line this step rewrites, says every watcher debounces; the git watcher throttles (`server/root/watch/git.ts:232`). Make the sentence true: the debounce clause says it holds for the five watchers this step changed (usage, bookmarks, portfolio, local, sessions), and the git sentence after it says the git watcher throttles per root instead (`git.ts:231-234`).

## Behaviour

8. Behaviour 1, `src/lib/server/machine/usage/watch.ts:98-109`: under steady writes a rebuild is chained every `USAGE_MAX_WAIT`, and a fold slower than that grows the chain without bound. Coalesce: while a build runs, at most one further build waits; a refresh that arrives while one already waits joins it (returns the same promise) and adds nothing. `closed` and the existing tests keep their meaning. A test with a fold that takes longer than `USAGE_MAX_WAIT` (a deferred the test resolves) and events every 100 ms for several `USAGE_MAX_WAIT`: at most one build waits at any time, and the last event's data is published once the fold resolves. Update the file's head comment and the `DESIGN.md:116` clause on rebuilds still running to say so. The report's before and after for the usage channel states the queue: before, no rebuild until the writes stopped; after, one at least every `USAGE_MAX_WAIT`, never more than one waiting.

## Verify before you report

From the worktree's `tools/oculus`: `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams`, then `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, `checks: 7 commands passed`, its lines quoted; and the brief's verify items 3 to 5.
