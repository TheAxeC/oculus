# D23c, repair round 1

The refuter's report is `agents/reviews/D23c-refuter.md`. Each finding below has its ruling; change nothing else. Run no git command, not even `git status` or `git sparse-checkout list`: spec.md forbids it. Work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D23c`. Your paths are the brief's and the cases ruling's, widened by this round where an item names a file. Do no breakage testing: never remove or revert code to watch a test fail. Take no focus, start no desktop app, start no agent, and never run `npm run test:landing`, `tests/tiers/landing.mjs` or `npm run test:slow`. A scratch oculus server of yours uses a port other than 8787 and 8790 and is stopped by its own pid before you report. Never open, print, grep or hash `tools/oculus/config/local.yml`; every grep over config uses `--exclude=local.yml`. Rewrite the report `tools/oculus/.scratch/migration/agents/reviews/D23c-report.md` (in the main checkout) whole for the state after this round, with a "Repair round 1" section that names each item below, what changed, and for a changed behaviour the test row or the run that covers it, with its result on the code before this round's change, taken in a scratch copy of the worktree as it stood before the round (made under `$TMPDIR` before your first edit and named in the report), never by removing code from the worktree.

The rulings this round applies are Z676 and Z678 (1) to (6) in `plan.md`.

## Spec

1. Spec 1, the Outline's focus (Z676). The `select` editor command takes an optional `focus` flag; with it, the editor takes the keyboard after the selection, as `goto` does (`made.focus()`). The Outline's press sets it (`Outline.svelte:211`); the clangd AST view does not, so it keeps its no-focus rule.
2. Spec 2, case 21 (Z678 (1)). The `word` command selects the word only when the column given lies inside the line; a column past the line's end, clamped, puts the caret at the end of the line with nothing selected, as case 21 says.
3. Spec 3. The report marks `src/lib/state/system/machine/lsp/references.ts`, `references.svelte.ts`, `src/lib/ui/controls/editor/commands.ts`, `types.ts` and `docs/diagrams/*` as outside the write list, each with its reason.

## Proof

4. Proof 1, case 12d (Z678 (2)). No code change: a token holds the file the server's path resolved to when it was minted, so a link retargeted afterwards still reads that same file and never another. The report states case 12d as built in those words, with a run of the case's own input (a token minted for a path through a link, the link then pointed elsewhere, the read giving the first file's text).

## Standards

5. Standards 1 (Z678 (3)). `Source.svelte`'s head comment gets back every sentence the step removed from it, as it stood at the base, corrected only where the step made it false; to stay at or under 520 lines, code moves out of `Source.svelte` into a module beside it under `views/sources/source/`, never a comment shortened or code compacted. The two clauses lost everywhere ("in the Repositories view's graph" for the blame press, "(the tab's Alt+Z choice among them)") stand again.
6. Standards 2. `Outline.svelte`'s head comment paragraph is rewrapped whole at 100 columns.
7. Standards 3. `relay.ts:7` and `:20` name `held/held.ts` and `held/watch.ts`.
8. Standards 4. `library/read.ts`'s head comment lists the checks in the order the code makes them (`too_large` before `binary`).
9. Standards 6. The report's history-word row runs the rules file's word list over the added comment lines and test titles, quotes the grep, and judges each hit.

## Behaviour

10. Behaviour 1 (Z678 (4)). An open that has no position (a document link press, a positionless open from Monaco, `hosts.ts:122-126` and `:138`) passes no column, so the tab opens at its line with nothing selected, as before the step; only an open that names a symbol's position passes its column.
11. Behaviour 2 (Z678 (5)). No code change: F4 and Shift+F4 select the location's word, the same as a References press. The report's before-and-after table states it.
12. Behaviour 3 (Z678 (6)). A go to definition or References location in a library file whose read is refused (`too_large`, `binary`) is kept, not dropped: it has no peek text, and opening it opens the library tab, which shows the refusal sentence (`library_too_large`, `library_binary`). F12 on such a symbol therefore opens the tab with its sentence. A run with a library file over the limit shows the location kept and the tab's refusal.
13. Behaviour 4. No code change: the report's before-and-after table states that Copy Path and Copy All on a library row copy the file's name with its line, since the page holds no machine path.

## Declined point, ruled

14. The dot-rule exception (Z678 (7)). The pyright interpreter-prefix exception (`rules.ts:69`) applies only to a prefix that is neither the home folder, nor the filesystem root, nor a folder that holds the home folder; for any of those, the prefix gives no exception and the dot rule refuses as everywhere else. A row in the library table: a probe reporting the home folder as `sys.prefix` leaves a path under `~/.ssh` refused.

## Verify before you report

Run the unit test files your change touches while you work, and `npm run test:quick` from `tools/oculus` once, after the round's last change; a failed command is rerun alone, then the full list once more. Quote each output and give the number of full-list runs. Also run `npm run diagrams`, the guarded tests (`npx vitest run tests/server/machine/lsp tests/state/sessions/source.test.ts tests/state/workbench/layout/saved/layout-saved.test.ts`), `sh utils/folder-check.sh`, `wc -l src/lib/views/sources/source/Source.svelte`, and the ASCII gate over the changed files. Your final message is the report's first line and its DONE / NOT DONE table.
