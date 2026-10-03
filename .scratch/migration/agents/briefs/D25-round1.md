# D25, repair round 1

The refuter's report is `agents/reviews/D25-refuter.md`. Each finding below has its ruling; change nothing else. Run no git command at all (`agents/spec.md`, "Where you work"). Work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D25`, product under `tools/oculus`. Keep every scratch copy in your own folder under the session scratchpad, never in a folder the orchestrator uses. Write the round's report as a section "Repair round 1" appended to `tools/oculus/.scratch/migration/agents/reviews/D25-report.md` in the worktree, and correct the first report's first line: the reviewer's run of the verify list printed `checks: 7 commands passed` (Proof 1).

## Spec

1. Spec 1, item 3: rewrite `Source.svelte`'s head comment (`:50` and the paragraph around it) so it states the indentation's whole order (the tab's choice, the file's own, the root's `.oculus/settings.yml`, `editor.languages`, the global keys), the word wrap and Alt+Z, and the Markdown and LaTeX symbols the tab adds.
2. Spec 2: the report's file table marks each path the reviewer lists as outside "Paths this step writes" with its reason; `source-gutter.svelte.ts` stands, with the reason that it keeps `Source.svelte` under its cap.
3. Spec 3: the four finding keys stand; the report names them as a departure from the brief's one key, with the reason.
4. Spec 4: `settings_origin_skipped` reads as the brief gives it: "Skipped in {0}: {1}: {2}".
5. Spec 5, case 2: case 2's input is the file of case 1 with `editor.languages: { python: { tab_size: 2 } }` and the global keys at their defaults, and it gives 2 spaces. Add that test, quoted failing on the unchanged tree. Keep the existing test of case 1's global keys with the Python record (a tab of width 2), titled as the field-by-field combination it checks.
6. The landing with Q91: Q91 moves `views/shared/code/Code.svelte` to `views/shared/prose/` and leaves `views/shared/code/` empty, so `views/shared/` keeps ten items with its new `explorer/`. Move `source-options.ts` to `views/shared/prose/source-options.ts` and update every import and every document that names its path; leave `Code.svelte` where it is.

## Proof

7. Proof 2, cases 17 and 35: the tests that pass with `replacedShape.safeParse` or the offset check removed are titled "audits that ...", and the report calls them audits.
8. Proof 3, case 16: a test that empties `read_limits` (written `{}`), saves it within a minute of the view's last read, and checks that the Settings draft ends; quote it failing on the unchanged tree.
9. Proof 4: the report lists each document and doc comment re-read with "still true" or "rewritten"; `LanguageRows.svelte`'s awaited association write gets a test that answers after the palette has closed and checks nothing is said or closed then; quote the renamed-name and helper greps with their output.
10. Proof 5: `wrap.test.ts:40` carries the empty list as one argument (`[[]]` in the table, or a row object), so a stored empty list is tested.

## Standards

11. Standards 1: rewrap the edited comment paragraph in `Palette.svelte` (`:16-30`) as a whole at 100 columns.
12. Standards 2: put back what was compacted in `Editor.svelte` (the head comment's clauses, `oncaret`, `flush`, the two effects) and make the room by moving code to `options.ts` or a new file with one concern, so the file ends more than 20 lines under its cap of 540.
13. Standards 3: split `DiffEditor.svelte` and `Diff.svelte` so each ends more than 20 lines under its cap, each part a file with one concern, named in the report with its line count.
14. Standards 4: reword "as before" in `putBackConfigValue`'s doc comment and `undo-replaced.test.ts:5` to say what happens now.
15. Standards 5: move `compare-header.client.test.ts`, `symbols.test.ts` and `source-options.test.ts` under `tests/views/`, beside the tests of the modules they test, keeping each folder within its count.

## Behaviour

16. Behaviour 2: the picker's "Configure ... language based settings" opens Settings as the rail does, `openView(SETTINGS_VIEW, { reveal: 'rail' }, <the current page's id>)` (`shell/rail/ActivityRail.svelte:168`), with a test that checks those arguments.
17. Behaviour 1: the report's before/after names, each with its view and state: Markdown tabs open wrapped; YAML files with no indented line get 2 spaces and Makefiles tabs; the folding of C, C++, Java, Dart, R and Rite files by braces; diffs taking the root's word wrap and rulers; files up to 20 MB coloured; the hunk header cut with an ellipsis.

## Verify before you report

Run the brief's verify list through `checks.sh` once, after your last change, from `tools/oculus` in the worktree, and quote its printed lines. A failure in a test file this round does not change, a timeout included, is that one file rerun alone with `npx vitest run <file>` and both runs quoted; the whole list is not run again for it. A failure in a file this round changed is fixed, that file rerun alone, then the list runs once more. Then the brief's verify 3 and 4 greps, `npm run diagrams` with only the regenerated files changed, and `wc -l` of every file named in rulings 12 and 13.
