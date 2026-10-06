# X3d, repair round 1

The refuter's report is `agents/reviews/X3d-refuter.md` (the review of X3d as prepared again on base 2c7a6ea4). Each finding below has its ruling; change nothing else. Run no git command, not even `git status`: spec.md:32 forbids it (St1). Work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/X3d`. Your paths are the brief's, widened by this round where a ruling names a file. Rewrite your report `tools/oculus/.scratch/migration/agents/reviews/X3d-report.md` for the whole step after the round, with a "Repair round 1" section that names each finding below, what changed, and the test that fails without the change (quoted from a run on the code before this round's change, in the test's final form).

## Spec

1. S1, the Seti matching order (`src/lib/ui/display/file-icons.ts:114-124`). Follow ruling 5: the whole name first, then the longest ending, then the default, with no "contained name" step. Every match is case-insensitive (the name and the table's keys lower-cased), as VS Code's keys are. Entries of seti-ui's `mapping.less` that the module now treats as partial (`mix`, `license`, `todo` and the others) are whole names. Expected: `remix.zzz` and `admixture.zzz` default; `LICENSE-MIT`, `TODOS` and `REBUILD` default; `mypom.xml` xml; `README.MD` and `Readme.md` the same icon as `readme.md`; `Foo.TS` typescript. The head comment (`:8-11`) says the order the code applies. Tests for each of these names.
2. S2, the badge colours. Keep the view's badge pair `--line` / `--on-line` (badge.test.ts's 4.5:1 contrast) and record it in the report as a judgment call with its before (`--muted` / `--c-on`, the brief's) and after and the contrast figures. Undo the change to `src/lib/ui/controls/editor/kit/colours.ts:375-386`: no item asks for Monaco's badges, and it recolours every editor in the app.
3. S3, the pruning of `collapsed`. `showBranches` in `Repositories.svelte` writes through `prunedCollapsed`, so every write of `collapsed` drops the dead ids (case 20). A commit's folder ids are dropped when that commit is not expanded in the Graph; if commit folder ids are never written to `collapsed`, say so in the report with the line that shows it and leave them. A test that a dead id is dropped by the Branch control's write, and one for the commit folder ids (or the quoted line).
4. S4, the diff header's wall surface (`diff/FileHeader.svelte:91-94`). Use the pane's own surface, the `color-mix(in srgb, var(--chip) ...)` of `Diff.svelte:522-525`, through one shared declaration or token so the two cannot drift apart.
5. S5, item 19 and case 33: take the look of the session panel's commit box. Point the scratch server's account at a temporary folder holding one minimal session (a registry file and a transcript, built from the shapes the session tests' fixtures use), open the Sessions view's Changes panel on a repository with a change, and screenshot it in a dark and a light theme into `agents/reviews/X3d-shots/`: the commit box, Sync Changes and no Push.
6. S6, Suggest's tooltip (`CommitBox.svelte:160-168`): its words (`git.suggest`), as item 7 says.
7. S7, `.agents/worktrees/X3d-base`: put the final form of every new or changed test there for the first runs this round asks for (Proof 2); write nothing else there. The orchestrator removes that copy at landing.
8. Z139 (1), ruled in automode: a rename in a group diff draws "R" and its old path. `GitEntry` (`src/lib/data/model/model-sessions.ts:323-330`) gains `from`, the old path of a rename or copy; the server's status read (`src/lib/server/core/git.ts` and `git-parse.ts:339-341`, which already reads `from` for an R or C line) fills it, with rename detection on; the group diff's header draws "R" and the old path as the commit diff does. Your paths widen to those files and their tests. Tests: a staged rename gives `from` and the header draws it; a plain change has no `from`.

## Proof

9. P1, `tests/ui/display/file-icons.test.ts`. Make each test fail under the revert it names: `:79-83` gets a name the two orders tell apart (`mypom.xml`: xml under the longest ending, maven under the last match); `:47-50` gets a path whose folder part alone matches an icon (`App.svelte/notes` reads default, not svelte); `:85-90` drops the line that compares `fileIcon('a.ts')` with itself and asserts what each input gives. A test that can only be an audit carries "audit" in its name (verify 4).
10. P2, first runs. Quote a failure on the unchanged tree (X3d-base, the test in its final form) for each of: `tool-button.test.ts`, `text-area.test.ts`, `menu-opener.test.ts`, `commit-action.test.ts` (the detached-head and `checkedOutBranch` tests), `view-state.test.ts` (`groupWaits`), `change-tree.test.ts` (`dirOf`), `tree-mode.test.ts:427-467`, `diff-pane.test.ts:354-367`, the later tests of `file-icons.test.ts`, and the final forms of `change-rows` and `diff-pane`. A test of preserved behaviour gets its passing runs before and after instead, said as such.
11. P3, `tests/views/sources/repositories/press-on-render.ts:13`: no module-scope `let`. Hand the predicate to each case through the mock's own factory per test (for example `vi.doMock` inside the case, or a value the component receives), so nothing is shared between cases.
12. P4, cases 29 and 30 and judgment call 9: run them again and keep the raw output under `agents/reviews/X3d-shots/` (text files beside the screenshots), quoting the counts in the report from those files, nothing under `/tmp`.

## Standards

13. St2, `DESIGN.md:389`: the sentence says what the Changes panel draws after the change (commit and branch controls, Sync Changes, no Push).
14. St3, `DESIGN.md:405`: the line cited is the one `grep -n` gives after your last change, or the citation names the rule without a line.
15. St4, `HELP.md:112`: a readable repository row draws its controls always; the sentence says which rows show them on hover or focus and which always.
16. St5: rename the three tests so their names say what they check, with no "until now", "today" or "as before".
17. St6: `file-icons.ts:8-11` and `file-icons.test.ts:1-4` say the order the code applies (ruling 1 above); DESIGN.md's TreeActions sentence gives the real measures (the 1 px pad and the control's 1 px border).
18. St7: the 16 px icon box is one token that `FileIcon.svelte:44`, `ChangeRow.svelte:208` and `Repositories.svelte`'s `--action-font` read.

## Behaviour

19. B1, an untracked folder (`newdir/`, from `--untracked-files=normal`): it is one change row named `newdir` with the folder icon and no child row, its type-ahead name `newdir`, opening it as a folder row of an untracked file does; `changeTree` gives no file row with an empty name. A test over `changeTree([{ path: 'newdir/' }])` and one over the row.
20. B2: graph pills and count badges draw in the UI font with `font-variant-numeric: tabular-nums`, as VS Code's; the change row's status letter keeps its mono. The screenshots of item 18 taken again.
21. B8: Refresh in `Diff.svelte` is disabled while a read is in flight, as before; a test.
22. B10: the header of a deleted file in a staged-group diff offers no Open File (the file is not on disk); a test.
23. B3, B4, B5, B6 and B7: each stated in the report's user-visible changes with its before and after (the capitalised verbs on word buttons and the status bar's confirm verbs; the session panel's row and group glyphs; the 16 px icons in 20 px boxes; the badge pair, now the view's only, after ruling 2; commit file rows showing the folder and the Seti icon with the status letter mono).

## Verify before you report

From the worktree's `tools/oculus`: `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams`, then `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, `checks: 7 commands passed`, its lines quoted; and the brief's verify items 3 to 5.
