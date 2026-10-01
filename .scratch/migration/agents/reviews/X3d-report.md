NOT DONE: (1) the session panel's commit box (`ChangesRepo.svelte`) was not looked at in the browser: the scratch server shows no session for a transcript written into its own `~/.claude/projects` (the Sessions list reads "No sessions in the window."), so the Changes view of a session cannot be opened; the box is the same `CommitBox.svelte` the Repositories view draws and is covered by the unit cases only (case 26, `commit-box.test.ts`). (2) A renamed file in a group diff (Open Changes on a group head) is drawn as a new file, with no "R" and no old path, because a `GitEntry` carries no old path; open item B below needs Axel's ruling on the wire shape. Open item A (the light-theme colours of the Seti icons) is a premise of ruling 4 that does not hold; it is implemented as ruled and waits for Axel. Everything else in items 1 to 19 and cases 1 to 33 is done and verified by the commands below.

# X3d report: the Repositories view and the diff drawn and working as VS Code's Source Control

Worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/X3d`, oculus at `tools/oculus`. Node: `export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`.

## Open items of the state file (verbatim, `.scratch/migration/orchestrator-state.md`, section "Open items"; `grep -n "^## Open items"` finds the heading at line 130 of the worktree copy and line 134 of the main copy, and both read `- None.`)

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- None.

## Open items this step raises (each needs Axel's ruling)

**A. The Seti icon colours have a light set in VS Code (the premise of ruling 4 does not hold).** Ruling 4 says the Seti colours are the same in every theme "as VS Code's Seti colours are". `/Applications/Visual Studio Code.app/Contents/Resources/app/extensions/theme-seti/icons/vs-seti-icon-theme.json` has a `light` section (`python3` over the file: 238 `fileExtensions`, 98 `fileNames`, 82 `languageIds` entries in `light`), and its default file icon is `#d4d7d6` in the dark set and `#bfc2c1` in the light one. seti-ui itself (`styles/ui-variables.less`) has one set of values, which is what the tokens hold (`src/lib/themes/tokens.css:81-92`). Built as ruled, an icon is the same colour on the light and the dark panel. Contrast against the light panel (`#ffffff`) and the dark panel (`#121a2b`), computed from the token values with the WCAG formula (`python3` over `tokens.css`): `--seti-white` 1.45 on light; `--seti-yellow` (every `.json` file) 1.73 on light; `--seti-green` 2.13 on light; `--seti-ignore` 2.16 on dark; `--seti-grey` 2.43 on dark. Options: (1) keep it as ruled; the cheaper option, and the lazy one, since it leaves white, yellow and green icons faint on the light panel; (2) add a light value per colour name in the light themes, taking VS Code's `light` values, which is what VS Code draws and which copies hex values from VS Code's theme (the brief says none is copied); (3) derive a light-theme value per colour name from the Seti value in `themes/derive.ts` (as the `-txt` forms are minted), which keeps Seti's own hues, copies nothing and makes every icon at least 3:1 on every panel. Recommendation: (3).

**B. The old path of a renamed file in a group diff.** `GitEntry` (`src/lib/data/model/model-sessions.ts:323-330`) carries `path`, `status`, `added`, `deleted` and no old path, although `src/lib/server/core/git-parse.ts:339` reads the old path of an `R` or `C` line. A group diff reads one `fileDiffUrl(root, path, staged)` per path (the brief, item 8), and git shows the new path of a rename alone as a new file; the pane draws "four.ts" with no "R" and no old path (screenshots `X3d-shots/item17-diff-file-headers-*.png`). A commit's diff and a stash's diff draw the rename header (`DiffSides.oldPath`). The fix adds a field to the `git` channel's payload (a wire shape) and a rename-aware read in `server/git/git-routes.ts`, both outside the brief's path list, so it is Axel's to rule. Options: (1) add `from` to `GitEntry`, fill it in `git-parse.ts` and have the group read ask git for the pair (`-M` over both paths); (2) leave a group diff as it is. Recommendation: (1); (2) is the lazy option.

## The ruling on the cases (`agents/briefs/X3d-cases.md`), carried

1. `package.json` takes `.json`'s entry (glyph `json`, colour `yellow`). `tests/ui/display/file-icons.test.ts` uses `tsconfig.json` as the witness that a name's entry wins over its ending and `a.test.ts` as the witness that the longer ending wins, and has a `pom.xml` case.
2. `src/lib/ui/display/file-icons.ts:13-15` reads `seti-ui`'s `styles/components/icons/mapping.less`, `styles/_fonts/seti.less` and `styles/ui-variables.less` through `?raw`; line 16 also reads `styles/default-theme.less`, which holds the one alias `@seti-primary` that `ui-variables.less` does not (judgment call 3). The font is `seti-ui/styles/_fonts/seti/seti.woff` (`FileIcon.svelte:35`); `npm run build` emits it as `.svelte-kit/output/client/_app/immutable/assets/seti.Cd2SFYCl.woff`.
3. The glyph is drawn at `font-size: 150%` (`FileIcon.svelte:46`) in a box `calc(16px * var(--text-scale, 1))` wide (`FileIcon.svelte:44`).
4. One token per Seti colour name in `src/lib/themes/tokens.css:81-92`, the same in every theme; `FileIcon.svelte` draws `var(--seti-<name>)`. See open item A.
5. The order is the whole name, then the longest ending, then the longest name contained (a `partial` entry), then the default (`file-icons.ts:8-10`); the `pom.xml` case is in `file-icons.test.ts`.
6. `data-file-icon` (glyph name) and `data-colour` (colour name) stay on the drawn icon (`FileIcon.svelte`).

## The cases' first run, and the final run

Commands (from `tools/oculus`, `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`): each of the 23 test files that the first build changed or added, plus the ones written for cases 28, 31 and 32, run file by file with `npx vitest run <file> --reporter=json` in `X3d-base` (the unchanged tree) and in `X3d` (the tree as applied). The test files were copied into `X3d-base/tests` for this (no source file there changed). Cases 29 and 30 are looks in a browser, run against a dev server of each tree on port 8796 with `HOME` and `TMUX_TMPDIR` under a scratch folder, an `ssh` on `PATH` that exits 255 and a headless Chrome with a fresh profile; case 33 has no first run.

Totals: unchanged tree, 569 tests in the 19 files that load, 402 passed and 167 failed, and 4 files fail to load (their imports do not exist there: `change-tree.ts`, `FileIcon.svelte`, `CommitRow.svelte`, `changes/Changes.svelte`); tree as applied, 646 tests, 639 passed and 7 failed, and 1 file fails to load (`file-icons.test.ts`). The 7 failures on the tree as applied are the tests written for the new cases 28, 31 and 32, listed in the table.

Where a file fails to load on the unchanged tree only because of other cases in it, the cases of components the unchanged tree has were run in a copy of their own pointing at its sources (`X3d-base/tools/oculus/tests/narrow/graph-narrow.test.ts`, `toggle-narrow.test.ts`; 17 tests, 17 failed); those rows say "(narrow copy)". A row that says "fails to load" names the module the file cannot find.

Cases 15 (second half) and 25 are audits by the brief; every test whose name says "audits" tests a rule in the source text and is an audit. The 14 rows that pass on the unchanged tree test behaviour the change keeps.

| Case | Test (file, then the test) | Unchanged tree | Tree as applied |

Final column: `npx vitest run` over the same files on the final tree, run with `--reporter=json`: 291 tests, 291 passed, 0 failed (`/tmp/x3d-final.json`, `numTotalTests` 291, `numFailedTests` 0), plus `tests/ui/controls/editor/kit/badge.test.ts` (the theme badge row). Tests added after the first run (this step's later rounds) are not in the table: `view-state.test.ts` (`groupWaits`), `tree-mode.test.ts` (the folder of a commit's file), `change-tree.test.ts` (`dirOf`) and `file-icons.test.ts` (the whole file).

| Case | Test (file, then the test) | Unchanged tree (first run) | Final tree |
|---|---|---|---|
| 1 | `change-tree.test.ts`: the tree of a change group puts two files of one folder under it and the file at the root beside it | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' im | pass |
| 2 | `change-tree.test.ts`: the tree of a change group joins a chain of folders with one child each into one row and puts the file under it | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' im | pass |
| 3 | `change-tree.test.ts`: the tree of a change group keeps a folder that holds a folder and a file as its own row | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' im | pass |
| 3 | `badge.test.ts`: the badge of a Monaco-drawn surface is painted from the pair a tree row draws its count badge with, at 4.5:1 in every theme | FAIL: AssertionError: expected '--muted' to be '--line' // Object.is equality | pass |
| 3 | `tree.test.ts`: the look of a row, read from the source audits that draws the detail, the count and the end at the small size, as every tree view does | pass | pass |
| 4 | `change-tree.test.ts`: the tree of a change group keeps spaces in a folder name and a file name | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' im | pass |
| 5 | `change-tree.test.ts`: the tree of a change group gives no rows for no paths, and sorts by base letter with ties in code unit order | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' im | pass |
| 6 | `view-state.test.ts`: the mode of the view is the list for an absent or an unknown value and the tree only when it says tree | FAIL: AssertionError: expected undefined to be 'list' // Object.is equality | pass |
| 7 | `commit-action.test.ts`: the lines of the commit message field is one for an empty message and one for a long line that wraps | FAIL: TypeError: (0 , __vite_ssr_import_1__.messageRows) is not a function | pass |
| 7 | `commit-action.test.ts`: the lines of the commit message field is the line count up to ten, a trailing newline counting its empty line | FAIL: TypeError: (0 , __vite_ssr_import_1__.messageRows) is not a function | pass |
| 7 | `commit-box.test.ts`: the message field carries the line count of the message as its rows, one for an empty field | FAIL: AssertionError: expected '3' to be '1' // Object.is equality | pass |
| 7 | `commit-box.test.ts`: the message field under body.rice audits that draws the terminal form of a text area: a line at its left, no radius, no fill | FAIL: AssertionError: expected '' to contain 'border-left: 1px solid var(--line)' | pass |
| 7 | `commit-box.test.ts`: the message field under body.rice audits that leaves the mono font of the terminal form to the text area, whose bare rule keeps it | pass | pass |
| 7 | `commit-box.test.ts`: the message field under body.rice audits that draws it by the rules scope and never by a forced override | pass | pass |
| 8 | `commit-action.test.ts`: what the commit box button is is Commit while anything is staged, changed, untracked or unmerged | FAIL: TypeError: (0 , __vite_ssr_import_1__.actionButton) is not a function | pass |
| 8 | `commit-action.test.ts`: what the commit box button is is Commit while a merge or a rebase is in progress with nothing left to stage | FAIL: TypeError: (0 , __vite_ssr_import_1__.actionButton) is not a function | pass |
| 8 | `commit-action.test.ts`: what the commit box button is is Sync Changes with nothing to commit and a branch ahead of or behind its upstream | FAIL: TypeError: (0 , __vite_ssr_import_1__.actionButton) is not a function | pass |
| 8 | `commit-action.test.ts`: what the commit box button is is the disabled Commit button with nothing to commit and nothing to sync | FAIL: TypeError: (0 , __vite_ssr_import_1__.actionButton) is not a function | pass |
| 8 | `commit-action.test.ts`: what the commit box button is is Publish Branch with nothing to commit, no upstream and a remote to publish to | FAIL: TypeError: (0 , __vite_ssr_import_1__.actionButton) is not a function | pass |
| 8 | `commit-action.test.ts`: what the commit box button is is Publish Branch for a repository with no commit exactly when Publish Branch is offered | FAIL: TypeError: (0 , __vite_ssr_import_1__.actionButton) is not a function | pass |
| 8 | `commit-action.test.ts`: what the commit box button is is Commit before it is Sync or Publish | FAIL: TypeError: (0 , __vite_ssr_import_1__.actionButton) is not a function | pass |
| 9 | `commit-box.test.ts`: the message field says the chord and the branch it commits on | FAIL: AssertionError: expected '' to be 'Message (Ctrl+Enter to commit on "mai...' // Object.is equalit | pass |
| 9 | `commit-box.test.ts`: the message field says the chord alone when no branch is checked out | FAIL: AssertionError: expected '' to be 'Message (Ctrl+Enter to commit)' // Object.is equality | pass |
| 9 | `commit-box.test.ts`: the message field draws a branch name with markup characters in it as text | FAIL: AssertionError: expected '' to be 'Message (Ctrl+Enter to commit on "fea...' // Object.is equalit | pass |
| 9 | `tree-mode.test.ts`: a folder of a graph commit that closes over the row that holds the focus takes the focus itself | fails to load: Cannot find module '/src/lib/views/sources/repositories/changes/Changes.svelte' impor | pass |
| 10 | `graph.test.ts`: the lane geometry of a 22 pixel row puts lane n at 11 * (n + 1) and makes the row 11 * (max(lanes, 1) + 1) wide | FAIL: TypeError: (0 , __vite_ssr_import_1__.laneX) is not a function | pass |
| 11 | `graph.test.ts`: the lane geometry of a 22 pixel row draws a lane that passes as one vertical from the top of the row to its foot | FAIL: TypeError: (0 , __vite_ssr_import_1__.lanePaths) is not a function | pass |
| 11 | `graph.test.ts`: the lane geometry of a 22 pixel row draws a lane that ends in the commit from a column to its right as one arc and a run | FAIL: TypeError: (0 , __vite_ssr_import_1__.lanePaths) is not a function | pass |
| 11 | `graph.test.ts`: the lane geometry of a 22 pixel row draws a merge parent leaving the commit to the next column as one arc | FAIL: TypeError: (0 , __vite_ssr_import_1__.lanePaths) is not a function | pass |
| 11 | `graph.test.ts`: the lane geometry of a 22 pixel row holds no Bezier curve in any stroke of any row | FAIL: TypeError: (0 , __vite_ssr_import_1__.lanePaths) is not a function | pass |
| 12 | `graph.test.ts`: the circle of a commit is one circle of radius 5 for a commit | FAIL: TypeError: (0 , __vite_ssr_import_1__.commitCircles) is not a function | pass |
| 12 | `graph.test.ts`: the circle of a commit is radius 6 with an inner circle of radius 3 for a merge | FAIL: TypeError: (0 , __vite_ssr_import_1__.commitCircles) is not a function | pass |
| 12 | `graph.test.ts`: the circle of a commit is radius 7 with an inner circle of radius 2 for HEAD | FAIL: TypeError: (0 , __vite_ssr_import_1__.commitCircles) is not a function | pass |
| 12 | `graph.test.ts`: the circle of a commit is radius 7, radius 5 and a dashed ring of radius 5 for Incoming and Outgoing | FAIL: TypeError: (0 , __vite_ssr_import_1__.commitCircles) is not a function | pass |
| 12 | `graph.test.ts`: the circle of a commit takes HEAD before a merge when a commit is both | FAIL: TypeError: (0 , __vite_ssr_import_1__.commitKind) is not a function | pass |
| 13 | `change-rows.test.ts`: the name of a change row is struck through in the deleted tone for a deleted path | FAIL: AssertionError: expected 'data-entry="gone.txt"><!--[0--><!--[-...' to match /class="item[^"]*\bs | pass |
| 13 | `change-rows.test.ts`: the name of a change row is in the modified tone and not struck for a modified path | FAIL: AssertionError: expected '<span class="name svelte-dj5yz8">kept...' to contain '--c-scm-modified- | pass |
| 13 | `change-rows.test.ts`: the name of a change row is one row under the new path in the renamed tone and not struck for a renamed path | FAIL: AssertionError: expected '<span class="name svelte-dj5yz8">move...' to contain '--c-violet-txt' | pass |
| 14 | `change-rows.test.ts`: the controls of a change row are Open File, Discard and Stage on a changed row, in that order | FAIL: AssertionError: expected [ 'diff', 'Open File', 'stage', ...(1) ] to deeply equal [ 'Open File',  | pass |
| 14 | `change-rows.test.ts`: the controls of a change row are Open File and Unstage on a staged row | FAIL: AssertionError: expected [ 'diff', 'Open File', 'unstage' ] to deeply equal [ 'Open File', 'uns | pass |
| 14 | `change-rows.test.ts`: the controls of a change row are Open File and Stage on an untracked row | pass | pass |
| 14 | `change-rows.test.ts`: the controls of a change row include no Diff control on any row, since pressing the row opens the diff | FAIL: AssertionError: expected 'data-group="changes"><div class="sect...' not to contain 'aria-label="d | pass |
| 14 | `change-rows.test.ts`: the controls of a change row draw the icon each action has in every list of changes | FAIL: AssertionError: expected 'expand' to be 'stage' // Object.is equality | pass |
| 14 | `change-rows.test.ts`: the controls of a change row keep Open in Merge Editor and Mark Resolved on a conflicted row | pass | pass |
| 15 | `change-rows.test.ts`: the head of a change group carries a badge reading the number of its paths and an Open Changes control | FAIL: AssertionError: expected 'data-changes="staged"><!--[0--><!--[-...' to match /class="count[^"]*\b | pass |
| 15 | `change-rows.test.ts`: the head of a change group offers Open Changes then Unstage All on the staged group | FAIL: AssertionError: expected [ 'Unstage All Changes' ] to deeply equal [ 'Open Changes', ...(1) ] | pass |
| 15 | `change-rows.test.ts`: the head of a change group offers Open Changes, then Discard All and Stage All on the changed group | FAIL: AssertionError: expected [ 'Discard All Changes', ...(1) ] to deeply equal [ 'Open Changes', ...(2) | pass |
| 15 | `change-rows.test.ts`: the head of a change group offers Stage All and no Open Changes on the untracked group | pass | pass |
| 15 | `tree.test.ts`: the count of a row drawn as a badge audits that draws a count as plain text in the number font when the row is given no badge | pass | pass |
| 16 | `repo-row.test.ts`: the Branch control of a repository row reads the branch, and carries the whole name as its hover words | FAIL: AssertionError: expected undefined to match object { label: 'main', title: 'main', ...(1) } | pass |
| 16 | `repo-row.test.ts`: the Sync control of a repository row reads the behind count and then the ahead count, each with its arrow | FAIL: AssertionError: expected undefined to be defined | pass |
| 16 | `repo-row.test.ts`: the Sync control of a repository row holds no number and says in step when the branch is neither ahead nor behind | FAIL: AssertionError: expected undefined to match object { title: 'in step with the upstream' } | pass |
| 16 | `repo-row.test.ts`: the Sync control of a repository row names the distance in the hover words the branch line has said until now | FAIL: AssertionError: expected undefined to match object { title: '1 ahead / 2 behind' } | pass |
| 16 | `repo-row.test.ts`: the Sync control of a repository row is Publish Branch for a branch with no upstream and a remote to publish to | FAIL: AssertionError: expected undefined to match object { title: 'Publish Branch' } | pass |
| 16 | `repo-row.test.ts`: the Sync control of a repository row is not drawn with no upstream and no remote, with an upstream not answered, or on a detached HEAD | pass | pass |
| 16 | `repo-row.test.ts`: the Sync control of a repository row is not drawn for an upstream the state names but the listing has not | pass | pass |
| 16 | `repo-row.test.ts`: the Sync control of a repository row is drawn for neither a root that is no repository nor one whose read failed | pass | pass |
| 16 | `repo-row.test.ts`: the Sync control of a repository row asks the Sync question first, and runs the same store call on a yes only | FAIL: AssertionError: expected undefined to be 'Sync main with origin/main?' // Object.is equality | pass |
| 16 | `repo-row.test.ts`: the Sync control of a repository row calls nothing when the answer is no | FAIL: AssertionError: expected null not to be null | pass |
| 16 | `repo-row.test.ts`: the Sync control of a repository row asks the Publish Branch question for the first remote | FAIL: AssertionError: expected undefined to be 'Publish main to origin?' // Object.is equality | pass |
| 16 | `repo-row.test.ts`: the Sync control of a repository row is disabled with the busy words while a write runs on the repository | FAIL: AssertionError: expected undefined to match object { disabled: true, title: 'Working' } | pass |
| 16 | `repo-row.test.ts`: the repository below its row keeps the branch line and the path above the state row of a repository whose read failed | pass | pass |
| 17 | `repo-row.test.ts`: the Sync control of a repository row asks the Sync question first, and runs the same store call on a yes only | FAIL: AssertionError: expected undefined to be 'Sync main with origin/main?' // Object.is equality | pass |
| 17 | `repo-row.test.ts`: the Sync control of a repository row calls nothing when the answer is no | FAIL: AssertionError: expected null not to be null | pass |
| 17 | `commit-box.test.ts`: the action button in each of its states is disabled with the busy words in the sync and publish states while a write runs | FAIL: AssertionError: expected undefined to match object { disabled: true, title: 'Working' } | pass |
| 17 | `graph-row.test.ts`: the actions on the Graph head are disabled with the busy words while a write runs, Go to Current apart | FAIL: AssertionError: expected undefined to match object { disabled: true, title: 'Working' } (narrow copy) | pass |
| 17 | `tree-mode.test.ts`: the controls of a folder row are disabled with the busy words while a write runs on the repository | fails to load: Cannot find module '/src/lib/views/sources/repositories/changes/Changes.svelte' impor | pass |
| 18 | `repo-row.test.ts`: the repository below its row draws neither the branch line nor the path line for a readable repository | FAIL: AssertionError: expected '<!--[--><section class="pane svelte-b...' not to contain 'class="branch | pass |
| 19 | `tree-mode.test.ts`: the toggle between the list and the tree is View as Tree with its icon in list mode, which is where the view starts | FAIL: AssertionError: expected undefined to match object { Object (label, glyph) } (narrow copy) | pass |
| 19 | `tree-mode.test.ts`: the toggle between the list and the tree is drawn for a state with no repository to draw as well, since the mode is the view's | FAIL: AssertionError: expected undefined to match object { label: undefined } (narrow copy) | pass |
| 19 | `tree-mode.test.ts`: the toggle between the list and the tree is View as List with the list icon in tree mode | FAIL: AssertionError: expected undefined to match object { label: undefined, glyph: 'list' } (narrow copy) | pass |
| 19 | `tree-mode.test.ts`: the toggle between the list and the tree writes tree into the instance state when pressed in list mode, and list when pressed again | FAIL: AssertionError: expected undefined to be type of 'function' (narrow copy) | pass |
| 19 | `tree-mode.test.ts`: the toggle between the list and the tree is drawn before the menu of More Actions in the bar | FAIL: AssertionError: expected -1 to be greater than -1 (narrow copy) | pass |
| 19 | `tree-mode.test.ts`: the groups in tree mode draw the merge group as a list | fails to load: Cannot find module '/src/lib/views/sources/repositories/changes/Changes.svelte' impor | pass |
| 20 | `tree-mode.test.ts`: the controls of a folder row call stagePaths once with exactly the paths under a changed folder | fails to load: Cannot find module '/src/lib/views/sources/repositories/changes/Changes.svelte' impor | pass |
| 20 | `tree-mode.test.ts`: the controls of a folder row call unstagePaths once with exactly the paths under a staged folder | fails to load: Cannot find module '/src/lib/views/sources/repositories/changes/Changes.svelte' impor | pass |
| 20 | `tree-mode.test.ts`: the controls of a folder row ask first when a folder is discarded, naming how many paths, and call discardPaths once on a yes | fails to load: Cannot find module '/src/lib/views/sources/repositories/changes/Changes.svelte' impor | pass |
| 20 | `tree-mode.test.ts`: the controls of a folder row carry Stage and no Discard on an untracked folder | fails to load: Cannot find module '/src/lib/views/sources/repositories/changes/Changes.svelte' impor | pass |
| 20 | `tree-mode.test.ts`: the controls of a folder row are disabled with the busy words while a write runs on the repository | fails to load: Cannot find module '/src/lib/views/sources/repositories/changes/Changes.svelte' impor | pass |
| 20 | `change-tree.test.ts`: the ids of the folders of a change group tells one folder apart in two groups and in two repositories | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' im | pass |
| 20 | `change-tree.test.ts`: the ids of the folders of a change group never equals the id of a section, a group or the repositories head | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' im | pass |
| 20 | `change-tree.test.ts`: the ids of the folders of a change group gives a file at the root of the group no folder row and so no folder id | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' im | pass |
| 20 | `change-tree.test.ts`: the rows the keyboard reads in tree mode lists the folder row and the files under it, in the order they are drawn | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' im | pass |
| 20 | `change-tree.test.ts`: the rows the keyboard reads in tree mode leaves a row inside a closed folder out | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' im | pass |
| 20 | `change-tree.test.ts`: the rows the keyboard reads in tree mode lists no folder row in list mode, whatever the instance kept closed | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' im | pass |
| 20 | `change-tree.test.ts`: the rows the keyboard reads in tree mode keeps the merge group a list in tree mode | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' im | pass |
| 20 | `change-tree.test.ts`: the closed folders the instance keeps drops a folder id of the shown repository whose folder is in no group | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' im | pass |
| 20 | `tree-mode.test.ts`: the closed folders the instance keeps drop the id of a folder that is in none of the groups when the next closed section is written | fails to load: Cannot find module '/src/lib/views/sources/repositories/changes/Changes.svelte' impor | pass |
| 21 | `graph-row.test.ts`: a commit row draws one pill per ref and tag, the local branch first on the accent tint | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' impor | pass |
| 21 | `graph-row.test.ts`: a commit row draws the subject and then the author, and neither the short hash nor the time | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' impor | pass |
| 21 | `graph-row.test.ts`: a commit row puts the hash, the author, the date and the time in the hover words | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' impor | pass |
| 21 | `graph-row.test.ts`: a commit row draws the pills at the right of the row, before the row actions | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' impor | pass |
| 21 | `graph-row.test.ts`: a commit row cuts the name of a pill and keeps it whole in its hover words | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' impor | pass |
| 21 | `graph-row.test.ts`: a commit row is strong, with the circle of HEAD, when it is the commit HEAD points at | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' impor | pass |
| 21 | `graph-row.test.ts`: a commit row draws the circle of a merge when it is one and not HEAD | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' impor | pass |
| 21 | `graph-row.test.ts`: the rules of a commit row audits that draws a pill 10px round, on an 18px line of the button size, at the text scale | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' impor | pass |
| 21 | `graph-row.test.ts`: the rules of a commit row audits that draws the author at 0.9 of the row size, opacity 0.7 and half an em from the subject | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' impor | pass |
| 21 | `graph-row.test.ts`: the rules of a commit row audits that puts the accent tint on the local branch pill and the panel on the others | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' impor | pass |
| 21 | `graph-row.test.ts`: the ring of a circle audits that the lanes of a commit row sit in an element that sets the row's --row-bg at rest and under the pointer | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' impor | pass |
| 21 | `graph-row.test.ts`: the ring of a circle audits that the element holding the lanes of a commit row paints the pointer's background under them | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' impor | pass |
| 21 | `graph-row.test.ts`: the ring of a circle audits that the TreeItem of a commit row is given no selected state, so the accent tint has no row here | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' impor | pass |
| 21 | `graph-row.test.ts`: the ring of a circle audits that a row gives --row-bg its panel at rest, its chip under the pointer, its accent tint selected | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' impor | pass |
| 21 | `graph-row.test.ts`: the ring of a circle audits that the lanes of the Incoming and Outgoing rows sit in an element that sets the row's --row-bg at rest and under the poin | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' impor | pass |
| 21 | `graph-row.test.ts`: the ring of a circle audits that the element holding the lanes of a commit row paints the pointer's background under them | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' impor | pass |
| 21 | `graph-row.test.ts`: the ring of a circle audits that the TreeItem of the Incoming and Outgoing rows is given no selected state, so the accent tint has no row here | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' impor | pass |
| 22 | `diff-pane.test.ts`: the bar of the diff pane over a file of its own holds Open File, Previous Change, Next Change, Collapse Unchanged Regions and then the menu | FAIL: AssertionError: expected [ 'Previous Change', ...(2) ] to deeply equal [ Array(5) ] | pass |
| 22 | `diff-pane.test.ts`: the bar of the diff pane over a file of its own draws each control as a bare icon button with the icon of its action | FAIL: AssertionError: expected { label: 'Open File', ...(3) } to match object { Object (glyph, bare, .. | pass |
| 22 | `diff-pane.test.ts`: the bar of the diff pane over a file of its own draws Collapse Unchanged Regions pressed at the start and not pressed once shown | FAIL: AssertionError: expected undefined to match object { pressed: true } | pass |
| 22 | `diff-pane.test.ts`: the bar of the diff pane over a file of its own holds Inline View as an item that is checked in inline mode and not otherwise, then Refresh | FAIL: TypeError: Cannot read properties of undefined (reading 'items') | pass |
| 22 | `diff-pane.test.ts`: the bar of the diff pane over a file of its own keeps the side by side and inline buttons and the re-read button out of the bar | FAIL: AssertionError: expected '<!--[--><section class="pane svelte-b...' not to contain 'aria-label="S | pass |
| 22 | `diff-pane.test.ts`: the bar of the diff pane over a file of its own draws no Open File over the diff of a commit | pass | pass |
| 23 | `diff-pane.test.ts`: the header of a file of a diff draws one row holding the name and, muted after it, the folder | FAIL: AssertionError: expected '<!--[--><section class="file svelte-c...' to contain 'data-file-header= | pass |
| 23 | `diff-pane.test.ts`: the header of a file of a diff carries a chevron that folds the file, with its state, then Open File, in that order | FAIL: AssertionError: expected [] to deeply equal [ 'chevron', 'open_file' ] | pass |
| 23 | `diff-pane.test.ts`: the header of a file of a diff says the file is folded on its chevron when it is | FAIL: AssertionError: expected undefined to match object { expanded: false, title: undefined } | pass |
| 23 | `diff-pane.test.ts`: the header of a file of a diff presses the chevron through to the pane, which keeps the file folded | FAIL: TypeError: Cannot read properties of undefined (reading 'onclick') | pass |
| 23 | `diff-pane.test.ts`: the header of a file of a diff draws a one-file diff nothing may act on with its header and no chevron | FAIL: AssertionError: expected '<!--[--><section class="file svelte-c...' to contain 'data-file-header= | pass |
| 23 | `diff-pane.test.ts`: the header of a file of a diff carries the letter R and the old path for a rename | FAIL: AssertionError: expected '>' to contain '>R<' | pass |
| 23 | `diff-pane.test.ts`: the header of a file of a diff leaves out Open File for a diff that has no file on disk | FAIL: AssertionError: expected [] to deeply equal [ 'chevron' ] | pass |
| 23 | `diff-pane.test.ts`: the header of a file of a diff audits that stays at the top of the pane on the panel, and on the translucent surface under body.wall | FAIL: Error: ENOENT: no such file or directory, open 'src/lib/views/sources/repositories/diff/FileHea | pass |
| 23 | `diff-pane.test.ts`: a section whose file is folded leaves its header and removes its editor | FAIL: AssertionError: expected '<!--[--><section class="file svelte-c...' not to contain 'class="editor | pass |
| 23 | `diff-pane.test.ts`: a section whose file is folded folds a binary file over the sentence it draws today | FAIL: AssertionError: expected '<!--[--><section class="file svelte-c...' not to contain 'Binary file,  | pass |
| 23 | `diff-pane.test.ts`: a section whose file is folded names the header of a header-less diff as it did when it holds one file | pass | pass |
| 23 | `view-state.test.ts`: what a diff pane keeps of its files folds the unchanged runs and no file to start with | FAIL: AssertionError: expected { mode: 'side', views: {} } to deeply equal { mode: 'side', views: {}, | pass |
| 23 | `view-state.test.ts`: what a diff pane keeps of its files reads the unchanged choice and the folded files, and defaults anything it cannot read | FAIL: AssertionError: expected { mode: 'side', views: {} } to match object { unchanged: 'shown', ...(1) | pass |
| 23 | `view-state.test.ts`: what a diff pane keeps of its files drops a folded file that is not among the files of the diff | FAIL: AssertionError: expected undefined to deeply equal [ 'a' ] | pass |
| 23 | `view-state.test.ts`: what a diff pane keeps of its files folds a file that is open and opens one that is folded | FAIL: TypeError: (0 , __vite_ssr_import_1__.toggleFolded) is not a function | pass |
| 23 | `view-state.test.ts`: what a diff pane keeps of its files opens a folded file a step lands on and leaves the rest as they were | FAIL: TypeError: (0 , __vite_ssr_import_1__.unfolded) is not a function | pass |
| 23 | `view-state.test.ts`: a reveal asked of a diff section is done at once by a section whose editor is drawn and has reported its changes | FAIL: TypeError: (0 , __vite_ssr_import_2__.revealAsked) is not a function | pass |
| 23 | `view-state.test.ts`: a reveal asked of a diff section is kept by a folded or not yet drawn section, and done when its editor reports its changes | FAIL: TypeError: (0 , __vite_ssr_import_2__.revealAsked) is not a function | pass |
| 23 | `view-state.test.ts`: a reveal asked of a diff section is replaced by a later reveal asked before the editor reports | FAIL:  | pass |
| 23 | `view-state.test.ts`: a reveal asked of a diff section keeps nothing for a step whose hunk is not known yet, since the pane asks again once it is | FAIL: TypeError: (0 , __vite_ssr_import_2__.revealAsked) is not a function | pass |
| 23 | `view-state.test.ts`: a reveal asked of a diff section does nothing when the editor reports its changes and none is kept | FAIL: TypeError: (0 , __vite_ssr_import_2__.revealDue) is not a function | pass |
| 23 | `diff-pane.test.ts`: a section asked to reveal a change before its editor is back audits that asks the pure rule when a reveal comes and keeps what it returns | FAIL: AssertionError: expected 'export function reveal(hunk: number):...' to contain 'revealAsked(' | pass |
| 23 | `diff-pane.test.ts`: a section asked to reveal a change before its editor is back audits that asks the pure rule when a reveal comes and keeps what it returns | FAIL: AssertionError: expected 'function changed(next: LineChange[]):...' to contain 'revealDue(pending | pass |
| 24 | `view-state.test.ts`: the id of a diff over a change group holds the group and the root, so the staged and the changed group are two panes | FAIL: AssertionError: expected 'staged:/hub:' to contain 'group@staged' | pass |
| 24 | `view-state.test.ts`: the id of a diff over a change group tells the same group of two repositories apart | pass | pass |
| 24 | `view-state.test.ts`: the id of a diff over a change group is no id of a file, a stash or a worktree diff over the same empty path | FAIL: AssertionError: expected [ 'staged:/hub:', ...(2) ] to not include 'staged:/hub:' | pass |
| 24 | `view-state.test.ts`: the id of a diff over a change group allows no hunk action, as a stash does not | FAIL: AssertionError: expected true to be false // Object.is equality | pass |
| 25 | `tree.test.ts`: the look of a row, read from the source audits that draws a heading row in capitals, not small capitals, at weight 700 in the ink | FAIL: AssertionError: expected '.heading .main {\n        font-weight...' to contain 'text-transform: u | pass |
| 26 | `changes.test.ts`: the changes view draws Sync Changes and no Push button for a branch ahead of its upstream with nothing to commit | FAIL: AssertionError: expected '<!--[--><section class="pane svelte-b...' to include undefined | pass |
| 27 | `repo-row.test.ts`: the Branch control of a repository row cuts a branch name longer than the row and keeps it whole in the hover words | FAIL: AssertionError: expected undefined to match object { cut: true, ...(2) } | pass |
| 28 | `virtual.test.ts`: a window read again hands back the window the list holds when the virtualizer draws the same rows | FAIL: AssertionError: expected { rows: [ ...(30) ], after: 19250, ...(1) } to be { rows: [ ...(30) ], after: 19250, ...(1) } // Object.is equality | pass |
| 28 | `virtual.test.ts`: a window read again hands back a new window when the rows drawn move, or the heights around them change | pass (behaviour kept) | pass |
| 29 | browser: press the third commit row of the Graph of a scratch repository (`Merge branch feat`), then `Runtime.evaluate('1')`; then reload with that commit open | part 1: "HUNG, no answer within 1000 ms", the busiest renderer at 102.5% of a core; part 2, the reload with that commit open: the page answered at load in 2000 ms, then `Runtime.evaluate` timed out after 5000 ms while the Repositories view drew; RED | part 1: answers in 2 ms (light) and 0 ms (dark); part 2: answers in 0 ms (light) and 1 ms (dark), 2 file rows drawn (`final2.mjs`, output "light open commit answers 1 in 2 ms; file rows 2 / light after reload answers 1 in 0 ms; file rows 2 / dark open commit answers 1 in 0 ms; file rows 2 / dark after reload answers 1 in 1 ms; file rows 2") |
| 30 | browser, 16 combinations (Commit with an empty message, Commit with a two-line message, Sync Changes, Publish Branch; panes of 300 and 600 px; light and dark), row = `.commit` of `Repo.svelte`, padding 11 px left and 12 px right | as applied: the button is as wide as its words (Commit: right 460.2 at 600 and 156.2 at 296; Sync Changes 177.7 wide; Publish Branch 121.0 wide); screenshots `X3d-shots/case30-x3d-as-is-*.png` | all 16 give left 11, right 12 and a height of 26: `grep -c '"left":11,"right":12' final1.out` prints 16 and `grep -c '"h":26' final1.out` prints 16; Commit 252.61 + 24.39 wide at 300 px and 552.61 + 24.39 at 600 px, Sync Changes and Publish Branch 277 and 577 wide with no dropdown; screenshots `X3d-shots/item16-action-*` |
| 31 | `file-icons.test.ts`: the icon of a file name, the icon drawn before a name (5 tests) | fails to load: Cannot find module '../../../src/lib/ui/display/FileIcon.svelte' | pass |
| 31 | `change-rows.test.ts`: the icon of a change row is the icon of its file, drawn before its name | FAIL: AssertionError: expected 'data-entry="code/one.py">...' to contain 'data-file-icon="python"' | pass |
| 31 | `tree-mode.test.ts`: the icon of a file of a graph commit is drawn before the name of a file row and on no folder row | fails to load: Cannot find module '/src/lib/views/sources/repositories/changes/Changes.svelte' | pass |
| 31 | `diff-pane.test.ts`: the header of a file of a diff draws the icon of its file before the name | FAIL: AssertionError: expected '>' to contain 'data-file-icon="typescript"' | pass |
| 32 | `graph-row.test.ts`: the commits under Outgoing and Incoming draw the lanes and the circle of each of the two commits under Outgoing | FAIL (narrow copy): AssertionError: expected '' to contain '<svg class="lanes' | pass |
| 32 | `graph-row.test.ts`: the commits under Outgoing and Incoming draw the lanes and the circle of each of the two commits under Incoming | FAIL (narrow copy): AssertionError: expected '' to contain '<svg class="lanes' | pass |
| 32 | `graph-row.test.ts`: the commits under Outgoing and Incoming lay the lanes of each list out over that list alone | FAIL (narrow copy): AssertionError: expected '' to contain 'viewBox="0 0 22 22"' | pass |
| 33 | the builder's look (item 19) | not applicable on the unchanged tree | the table under "The look of item 19" below, one row per element and state, screenshots under `X3d-shots/` |

## DONE / NOT DONE

| Row | State | Command and result |
|---|---|---|
| Item 15, the Graph hang | DONE | case 28 passes (`tests/ui/tree/virtual.test.ts`); case 29 in the browser: the page answers 0 to 2 ms after the press and 0 to 1 ms after a reload with the commit open (`final2.out`) |
| Item 16, the action button spans the view | DONE | case 30: 16 of 16 combinations give left 11, right 12, height 26 (`final1.out`) |
| Item 17, Seti file icons | DONE except open item A | `tests/ui/display/file-icons.test.ts`; icons in `item17-*` and `merge-group-*` shots; the font is in the build output |
| Item 18, lanes under Incoming and Outgoing | DONE | case 32 (`graph-row.test.ts`); `item18-incoming-outgoing-lanes-*` |
| Item 19, the look | DONE except the session panel box | the table "The look of item 19" |
| Items 1 to 14 checked against the applied patch and finished | DONE except open item B and the session panel box | cases 1 to 27 pass; the look |
| Cases 1 to 33 | DONE | the table above |
| `npm run diagrams`, then `checks.sh` | DONE | see the verbatim lines below |
| Verify 3, the pixel list | DONE | the section "The pixel list" |
| Verify 4, the tests fail before the change and pass after | DONE | the first-run table |

`npm run diagrams` was run right before `checks.sh`; the lines `checks.sh` printed (`sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, exit 0):

```
$ npm test
$ npm run test:checks
$ npm run check
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

Test counts from the same run: `npm test` 366 files passed, 20 skipped, 5666 tests passed, 572 skipped; `npm run test:checks` 27 files passed, 2 skipped, 365 tests passed, 9 skipped. What the run does not cover: a style rule is read only by the audit tests, and the look is the browser pass below; the session panel's box is not in a browser (NOT DONE 1).

## The pixel list

`grep -rn "px" src/lib/views/sources/repositories src/lib/views/shared/changes/CommitBox.svelte` prints 57 lines. Item 1's rule: a size more than one rule reads is a token; a padding, radius or gap VS Code gives once for one element is a literal in that element's own rule. Each line, by file:

| File and lines | What they are | Rule of item 1 |
|---|---|---|
| `RepoList.svelte:232-233` | `gap: 1px` between a control's glyph and its count; `margin-left: 4px` before a control | literal in the control's own rule: VS Code gives each control 4 px on its left once |
| `Repositories.svelte:391-397` | `--tree-end-inset: 12px`, `--action-pad: 1px`, `--action-font: 16px`, and the comment | the view's own values for the tree row's end inset (12 px on a row, 6 px on a head, `tokens.css:171`) and for the icon controls' padding and size: one reader each, so literals on the `.repos` rule; no new token |
| `Repositories.svelte:401`, `Repo.svelte:264,276,314` | `gap: 6px` | the view's own gap between its blocks, one reader each |
| `Repo.svelte:268-270` | `padding: 0 12px 0 11px` on `.commit` | literal: the box and its button are 11 px in from the left and 12 px from the right, once, in VS Code |
| `merge/MergeSide.svelte:124,133,141-143`, `merge/Merge.svelte:273,284,298,304` | `2px`, `1px` borders, `4px` and `6px` gaps and paddings | not changed by this step: `diff` of the lines containing `px` between this tree and the unchanged tree prints nothing for both files; each is one element's own value |
| `changes/ChangeRow.svelte:200-201` | `gap: 4px`, `margin-left: 4px` of the row's controls | literal: VS Code gives 4 px before the controls once |
| `changes/ChangeRow.svelte:204-210` | the status letter's box, `width: calc(16px * ...)`, `margin-left: 5px` | literal: VS Code's decoration box is 16 px wide with 5 px before it, once |
| `graph/CommitRow.svelte:177-205` | the pill: `margin-left: 4px`, `padding: 0 4px`, `1px` border, `border-radius: 10px`, `line-height: calc(18px ...)`, the name's `max-width: calc(100px ...)` | literal: radius 10, line 18, 4 between pills and name cut at 100 are the pill's own values (item 1 names 10 px, 18 px, 100 px and 4 px as literals); the 12 px text is `--button-font` |
| `graph/Lanes.svelte:11`, `graph/CommitFiles.svelte:5` | `3 px` and `1 px` in comments | comments, not rules |
| `diff/DiffSection.svelte:163` | `rootMargin: '100% 0px'` of an IntersectionObserver | not a style rule |
| `diff/DiffSection.svelte:373,385-387`, `diff/Diff.svelte:506-529` | the hunk bars' and the pane's own margins, paddings, border and outline | not changed by this step except the removal of one line of `DiffSection.svelte` (`margin: 8px 0 2px`); one element's own value each |
| `diff/FileHeader.svelte:81` | `gap: 4px` between the chevron, icon, name and folder | literal: the header row's own gap |
| `CommitBox.svelte:228,236,254,266,272,285-290` | `gap: 4px`, the box's `1px` border, the separator's `1px` border, `padding: 3px 0 3px 6px`, the toolbar's `padding: 1px 3px 1px 1px`, the counts' `gap: 2px` and `margin-left: 4px` | literal: each is VS Code's value for that one element (the toolbar padding is item 1's `1px 3px 1px 1px` of the table; the radius is `--input-radius`) |

The full output of the grep is the 57 lines the table covers by file; `merge/` and `Diff.svelte` appear because they are inside the grep's path.

## The look of item 19

Server: `vite dev --port 8796 --strictPort` over this worktree with `HOME` and `TMUX_TMPDIR` under the builder's scratch folder and an `ssh` on `PATH` that exits 255; a headless Chrome with a fresh profile, driven over the DevTools protocol. Scratch repositories: `cathedra` (main with an upstream, 2 behind and 4 ahead, a merge commit, branch `feat`, tag `v1`, a stash of several files, staged `M`, `D` and `R` files, changed files, untracked files of `.ts`, `.svelte`, `.md`, `.py`, `.json`, `package.json` and an unknown type) and `game-engine` (57 commits ahead of an upstream set by `git update-ref` and `git branch --set-upstream-to`, then the upstream unset for Publish Branch, then a merge in progress with two conflicted files). No push of any kind and no remote host. The measures are `getComputedStyle` and `getBoundingClientRect` readings (`measure.mjs`, 525 px pane); the geometry and type readings of the 49 measured elements are identical in the light and the dark theme (a script comparing `measure-dark.txt` and `measure-light.txt` prints "geometry/type differences between themes: []"), so one drawn value serves both; the colour roles differ by theme and each screenshot is taken in both. Every screenshot was checked by its corner pixel to be of the theme named in its file name (36 of 36 matched; the two merge shots 2 of 2).

| Element and state | VS Code | Drawn | Screenshot (under `.scratch/migration/agents/reviews/X3d-shots/`) |
|---|---|---|---|
| Every row of the view | 22 px high, 13 px text | repository, group and change rows 22 px high, 13 px text (`repoRow`, `groupRow`, `changeRow`: `h` 22, `fs` 13px) | `item17-change-rows-list-{light,dark}.png` |
| Pane head (REPOSITORIES, CHANGES, GRAPH, STASHES, TAGS, BRANCHES, WORKTREES) | 22 px, 11 px, weight 700, uppercase, foreground colour, chevron left | head 22 px high; name 11px, weight 700, `text-transform: uppercase`, colour the ink (dark rgb(231, 236, 243)); chevron at the left | `item17-change-rows-list-*.png`, `item19-narrow-300px-*.png` |
| Head badge | 11 px, line-height 11 px, padding 3px 5px, radius 11, at least 18 x 18 | 18 x 18, 11px, line-height 11px, padding 3px 5px, radius 11px; 6 px from the head's right edge | `item17-change-rows-list-*.png` |
| Repository row | name weight 400; controls 4 px on the left, line 16 px; give way before the name; change count badge | name weight 400; branch and sync controls `ml` 4px, line-height 16px, boxes 20 px high (`repoBranch`, `repoSync`), the `...` 20.19 x 20; badge 18 x 18, 12 px from the right; at 300 px the branch name is cut ("m...") | `item17-change-rows-list-*.png`, `item19-narrow-300px-*.png` |
| Repository row, Publish control | cloud icon when no upstream | `publish` glyph shown for `game-engine` with no upstream | `item17-change-rows-list-*.png`, `item16-action-publish-600px-*.png` |
| Message box | 1 px border, radius 4, input background, 11 px left and 12 px right, 13 px text, one line when empty, tools at the right with padding 1px 3px 1px 1px | `box` x 11, right 12, radius 4px, border 1px solid, background the panel; `area` 13px; `tools` padding 1px 3px 1px 1px; 33 px high empty; a long placeholder does not wrap (`white-space: nowrap`, cut at 300 px) | `item17-change-rows-list-*.png`, `item19-narrow-300px-*.png`, `item16-action-commit-ready-*.png` |
| Action button, Commit (empty message and with a message), 300 and 600 px | padding 4px 8px, line 16, 12 px, radius 4, 1 px border; dropdown padding 0 4px behind a 1 px separator; 11 px from the left and 12 px from the right | `actMain` padding 4px 8px, line-height 16px, 12px, radius 4px 0 0 4px, border 1px; `actDrop` padding 0 4px, radius 0 4px 4px 0; left 11, right 12, height 26 in 8 of 8 combinations (4 states x 2 themes at 300) and 8 of 8 at 600 | `item16-action-commit-empty-{300px,600px}-{light,dark}.png`, `item16-action-commit-ready-*.png` |
| Action button, Sync Changes | sync icon, words, behind and ahead counts, no dropdown | "Sync Changes 1 57" (1 behind, 57 ahead), spans 11 to 12 px insets, height 26, no dropdown | `item16-action-sync-*.png` |
| Action button, Publish Branch | cloud icon, words, no dropdown | "Publish Branch", spans 11 to 12 px insets, height 26, no dropdown | `item16-action-publish-*.png` |
| Change group row | name normal weight; actions on hover; count badge at the right edge | name weight 400; badge 18 x 18, `3px 5px`, radius 11, 12 px from the right; Merge Changes keeps its error tone (judgment call 8) | `item17-change-rows-list-*.png`, `merge-group-*.png` |
| Change row, name and folder | name in status colour (struck through when deleted); folder 0.9 em, opacity 0.7, 0.5 em to the left | name colour rgb(228, 105, 11) for a modified file (dark), `line-through` on `d5.md`; folder 11.7px (0.9 x 13), opacity 0.7, `ml` 5.85px (0.5 em) | `item17-change-rows-list-*.png` |
| Change row, status letter | 90% size, weight 600, opacity 0.75, status colour, 5 px on its left | 11.7px, 600, 0.75, status colour, `ml` 5px, box 16 px wide | `item17-change-rows-list-*.png` |
| Change row, file icon | Seti glyph in a 16 px box, 150% | box 16 px wide, glyph 19.5px (150% of 13px), font `seti`, colour a `--seti-*` token | `item17-change-rows-list-*.png` |
| Change row, hover controls | Open File, Discard Changes, Stage Changes; each a 16 px icon with 2 px of padding (a 20 px box) | Open File, Discard, Stage in order; box 20 x 20 (`changeAct`), glyph 16 x 16 | `item17-change-row-hover-{light,dark}.png` |
| List and tree modes | toggle in the bar; tree folders compact `a/b/c`; a file row carries no folder | "View as Tree" and "View as List" toggle at the bar's right; folders `docs`, `src/lib`; file rows in the tree carry no folder | `item17-change-rows-tree-{light,dark}.png` |
| Merge Changes group | rows with Open in Merge Editor and Mark Resolved | 2 rows 22 px high, controls "Open in Merge Editor", "Open File", "Mark Resolved"; Commit disabled; the bar "A merge is in progress. 2 files are in conflict." with Abort | `merge-group-{light,dark}.png` |
| Graph lanes | svg 22 high, width `11 * (max(lanes, 1) + 1)`; circle radius 5 with a 2 px ring | `commitLanes` 22 x 22 for one lane; `commitCircle` "5/2" (radius 5, ring 2); the HEAD row's svg holds r 7 (ring 2) and r 2 (stroke 4); a merge commit's radius 6 and 3 is asserted by case 12 (`commitCircles`), not read in the browser | `item18-incoming-outgoing-lanes-*.png`, `item15-open-commit-files-*.png` |
| Incoming and Outgoing | circle radius 7, inner 5, dashed ring radius 5 (1 px, dashes 4 and 2); commits under each carry lanes | svg circles r 7 (stroke 2), r 5 (stroke 3) and r 5 (stroke 1, `stroke-dasharray` "4,2"), for both heads; the commits under each draw lanes | `item18-incoming-outgoing-lanes-*.png` |
| Graph row text | subject then author at 0.9 em, opacity 0.7; HEAD 600 | author 11.7px (0.9 x 13), opacity 0.7 (`commitAuthor`); the HEAD row is drawn bold in the shot and asserted by case 21 (not read with `getComputedStyle`) | `item18-incoming-outgoing-lanes-*.png` |
| Pills | radius 10, line 18, 12 px, 4 px between and before the first; name cut at 100 px | radius 10px, line-height 18px, 12px, `ml` 4px, padding 0 4px; the name `max-width` 100px and a long name measures 100 px wide (`pnames` 100, 100) | `item19-long-pills-{light,dark}.png` |
| Files of an open commit | lane verticals of every passing lane; 3 px on the open commit's lane; Seti icon; folder after the name | 3 px vertical beside the open commit's files, icon, name and folder ("m1.ts src/lib") | `item15-open-commit-files-*.png` |
| Load more | one row, 22 px, words centred in the link colour | row 22 px high, name centred (offset -1 px from the view centre), colour rgb(206, 122, 89) in dark and rgb(173, 85, 51) in light (`--accent-txt`) | `item19-load-more-{light,dark}.png` |
| Graph head actions | Go to Current, Fetch, Pull, Push (a remote branch) or Publish (none) | cathedra: Go to Current, Fetch, Pull, Push; game-engine without upstream: Go to Current, Fetch, Publish Branch (`m5.mjs`, `m4.mjs`) | `item19-graph-head-hover-*.png` |
| Diff bar of a group diff | icon buttons: Open File, Previous Change, Next Change, Collapse Unchanged Regions, `...` | Previous Change, Next Change, Collapse Unchanged Regions and `...` (no Open File: a group's files open from their headers) | `item17-diff-file-headers-{light,dark}.png` |
| File header of a diff of several files | a row per file: chevron, name, folder muted, Open File at the right; sticky at the top | 3 headers 22 px high, `position: sticky; top: 0`, background the panel (light rgb(255, 255, 255), dark rgb(18, 26, 43)), icon, name, folder, chevron, Open File; a rename shows no old path (open item B) | `item17-diff-file-headers-{light,dark}.png` |
| The hang (item 15) | not a visual element | `Runtime.evaluate('1')` answers within 2 ms after a press on a commit row and after a reload with it open, light and dark | `item15-open-commit-files-{light,dark}.png` |
| Narrow pane (300 px) | controls give way before the name; branch name cut | repository row branch cut, message placeholder cut, Commit button at 252.61 + 24.39 px | `item19-narrow-300px-{light,dark}.png` |

Not in a browser: the session panel's commit box (NOT DONE 1). Differences left with a reason: (a) a hover control box is 20 x 20 as VS Code's; VS Code hides a row's controls with `display: none` and oculus keeps their place and draws them transparent until the row is hovered (the tree row's design in `DESIGN.md`), so a row's text never moves on hover; (b) pills overflow the row at 300 px as VS Code's do not shrink either; (c) the group head badge is 6 px from the head's edge (the brief's item 3a) and the row badge 12 px (VS Code's `.monaco-tl-contents > div { padding-right: 12px }`).

## Files with line counts

`wc -l` over the brief's path list (the files of the applied patch, plus the files this step added or changed):

```
  183 config/catalogs/glyphs.yml
  182 config/catalogs/icons.yml
   80 config/text/views/sessions/changes.yml
  232 config/text/views/sources/repositories.yml
  418 DESIGN.md
  179 docs/diagrams/channels.dot
  947 docs/diagrams/channels.svg
  158 docs/diagrams/layer-state.dot
  770 docs/diagrams/layer-state.svg
  107 docs/diagrams/layer-ui.dot
  511 docs/diagrams/layer-ui.svg
  139 docs/diagrams/layer-views.dot
  624 docs/diagrams/layer-views.svg
   75 docs/diagrams/layers.dot
  407 docs/diagrams/layers.svg
  300 HELP.md
 5553 package-lock.json
   85 package.json
  161 src/lib/state/sources/repositories/change-tree.ts
  293 src/lib/state/sources/repositories/diff-hunks.ts
  194 src/lib/state/sources/repositories/graph-lanes.ts
  378 src/lib/state/sources/repositories/repositories.svelte.ts
  765 src/lib/state/sources/repositories/repositories.ts
  193 src/lib/themes/tokens.css
  525 src/lib/ui/controls/editor/kit/colours.ts
  506 src/lib/ui/controls/ToolButton.svelte
  124 src/lib/ui/display/file-icons.ts
   54 src/lib/ui/display/FileIcon.svelte
  170 src/lib/ui/forms/TextArea.svelte
  167 src/lib/ui/menu/Menu.svelte
  237 src/lib/ui/menu/MenuOpener.svelte
   88 src/lib/ui/tree/TreeActions.svelte
  537 src/lib/ui/tree/TreeItem.svelte
   94 src/lib/ui/tree/TreeSection.svelte
   86 src/lib/ui/tree/virtual.ts
  276 src/lib/ui/tree/VirtualRows.svelte
  253 src/lib/views/sessions/changes/Changes.svelte
  153 src/lib/views/sessions/changes/ChangesRepo.svelte
  244 src/lib/views/shared/changes/ChangeGroups.svelte
  293 src/lib/views/shared/changes/CommitBox.svelte
  217 src/lib/views/sources/repositories/changes/ChangeRow.svelte
  295 src/lib/views/sources/repositories/changes/Changes.svelte
  112 src/lib/views/sources/repositories/changes/FolderRow.svelte
  537 src/lib/views/sources/repositories/diff/Diff.svelte
  100 src/lib/views/sources/repositories/diff/DiffBar.svelte
  405 src/lib/views/sources/repositories/diff/DiffSection.svelte
  132 src/lib/views/sources/repositories/diff/FileHeader.svelte
  232 src/lib/views/sources/repositories/graph/CommitFiles.svelte
  210 src/lib/views/sources/repositories/graph/CommitRow.svelte
  454 src/lib/views/sources/repositories/graph/Graph.svelte
   75 src/lib/views/sources/repositories/graph/GraphHead.svelte
   93 src/lib/views/sources/repositories/graph/Lanes.svelte
  172 src/lib/views/sources/repositories/menus/change-menu.ts
  129 src/lib/views/sources/repositories/refs/Branches.svelte
   99 src/lib/views/sources/repositories/refs/Stashes.svelte
   83 src/lib/views/sources/repositories/refs/Tags.svelte
  322 src/lib/views/sources/repositories/Repo.svelte
  235 src/lib/views/sources/repositories/RepoList.svelte
  404 src/lib/views/sources/repositories/Repositories.svelte
  195 src/lib/views/sources/repositories/Worktrees.svelte
  471 tests/checks/source/keys.test.ts
  269 tests/state/sources/repositories/change-tree.test.ts
   98 tests/state/sources/repositories/commit-action.test.ts
  112 tests/state/sources/repositories/diff-view.test.ts
  193 tests/state/sources/repositories/graph.test.ts
  894 tests/state/sources/repositories/repositories.test.ts
  254 tests/state/sources/repositories/view-state.test.ts
   26 tests/ui/controls/editor/kit/badge.test.ts
  102 tests/ui/controls/tool-button.test.ts
   91 tests/ui/display/file-icons.test.ts
   81 tests/ui/forms/text-area.test.ts
   63 tests/ui/menu/menu-opener.test.ts
  440 tests/ui/tree/tree.test.ts
     163 tests/ui/tree/virtual.test.ts
  413 tests/views/sessions/changes.test.ts
  323 tests/views/sources/repositories/change-rows.test.ts
  302 tests/views/sources/repositories/commit-box.test.ts
  369 tests/views/sources/repositories/diff-pane.test.ts
  585 tests/views/sources/repositories/graph-row.test.ts
  197 tests/views/sources/repositories/harness.ts
   48 tests/views/sources/repositories/press-on-render.ts
  369 tests/views/sources/repositories/repo-row.test.ts
  756 tests/views/sources/repositories/repositories.test.ts
  513 tests/views/sources/repositories/tree-mode.test.ts
  371 tests/views/whole/type-scale.test.ts
   70 vite.config.ts
```

Paths outside the brief's list: `vite.config.ts` (mine: `test.css.include` for `seti-ui/*.less`, because vitest empties a stylesheet it does not process and `file-icons.ts` reads the `.less` files as text); `src/lib/ui/tree/TreeActions.svelte` (new, carried by the patch), `src/lib/ui/menu/Menu.svelte`, `src/lib/ui/controls/editor/kit/colours.ts`, `src/lib/state/sources/repositories/diff-hunks.ts` and `src/lib/views/sessions/changes/Changes.svelte` (changed by the patch: `Menu.svelte` passes `primary` to the opener, `colours.ts` repoints Monaco's badge colours, `diff-hunks.ts` holds `revealAsked` and `revealDue`, and the session `Changes.svelte` loses its Push button). The directories `.scratch/migration/agents/reviews/X3d-shots/` holds 44 screenshots.

## Judgment calls

1. `vite.config.ts` is edited (`test.css.include: [/seti-ui\/.*\.less/]`), a path outside the list: without it vitest returns an empty string for `mapping.less?raw` and every icon is the default.
2. The graph's `Graph.svelte` takes a `seed` prop `{ commits?, incoming?, outgoing? }`, as `CommitFiles.svelte` already takes a `seed` for its files, so a server render draws the rows (cases 21 and 32).
3. `file-icons.ts` reads a fourth seti-ui file, `default-theme.less`, for the alias `@seti-primary`; ruling 2 names three.
4. A commit's file rows, and the folder rows above them, get ids that carry the list the commit is drawn in (`in`, `out`, `log`), because one commit is in Outgoing and in the log and its files would otherwise get the same id twice. A press on a commit opens it in both lists, since the open commit is one hash.
5. A row's end inset is 12 px in the Repositories view (`--tree-end-inset` set on `.repos`) and 6 px on a section head and everywhere else (`tokens.css:171`). The brief's item 3a says "6 px from the row's right edge"; VS Code's rows have 12 px (`X3d-vscode-scm.css`, `.monaco-tl-contents > div { padding-right: 12px }`), its heads 6.
6. The git verbs on the controls are capitalised ("Push", "Stage", "Unstage", "Discard", "Suggest", "Create", "Switch to", "Merge back", "Remove", "Terminal here") in `config/text/views/sessions/changes.yml` and `config/text/views/sources/repositories.yml`; the lower-case words showed on tooltips in the view and in the status bar.
7. `TextArea.svelte` draws a growing box's placeholder on one line (`white-space: nowrap`, `overflow: hidden`), because a wrapped placeholder made the empty box two lines high; a browser draws no ellipsis in a textarea, so the placeholder is cut.
8. Merge Changes keeps its error tone on the group name (`Changes.svelte:244`, `tone={... 'error'}`), which VS Code does not draw; it is an oculus feature kept.
9. An open group diff waits for the `git` channel (`groupWaits`, `repositories.ts`), because a pane restored with the layout mounts before the channel has answered and read zero paths; it read again only on a later state and drew "Nothing to show for this one." The check that fails without it: reload with a group diff tab open; before the change the pane read "Nothing to show for this one.", after it three file headers are drawn.
10. A list-mode file row of an open commit says the file's folder after its name (`dirOf`), not the whole path.
11. Git commands: no git command was run in the worktree or in the main checkout by the work; two read-only `git status` commands were run in the worktree by mistake (one `git -C . status` in the first round and one `git status --short` while collecting this report), neither changing anything. All other git commands ran in the scratch repositories under the builder's own folder.
12. The scratch `X3d-base` worktree still holds copies of this worktree's test files in its `tests` folder (I put them there for the first run); its `src` is the unchanged tree. `tests/narrow/` was removed.

## User-visible changes (before and after)

| Where | Before | After |
|---|---|---|
| Section heads (every tree view) | small caps, muted | uppercase, weight 700, ink colour |
| Counts on heads and rows | plain number in mono | a pill badge (18 x 18, 11 px) |
| Repository rows | name, branch line, path line under it | name with the branch, sync and `...` controls and a change count at the right; no branch and path lines for a readable repository |
| Commit box | three-row text area, small buttons Suggest, Commit, dropdown | one-line box that grows to ten lines, Suggest inside it, one button across the view (Commit, Sync Changes or Publish Branch) with a dropdown |
| Change groups and rows | Diff, Open File, Stage, Discard controls; status letter in mono | file icon, name in status colour, folder, status letter; hover Open File, Discard, Stage (Unstage in the staged group); group heads with Open Changes, Stage All, Unstage All, Discard All |
| Changes | list only | list or tree, a toggle in the view's bar |
| Graph | Incoming and Outgoing commits without lanes; short hash and time on each row; refs in boxes | lanes under Incoming and Outgoing; refs as pills; the hash and time in the hover words; head actions Go to Current, Fetch, Pull, Push or Publish |
| Diff pane | bar with layout toggle, Previous, Next, refresh, Open File; path line above each file | icon buttons Open File, Previous, Next, Collapse Unchanged Regions and a `...` menu with Inline View and Refresh; a sticky header per file with icon, chevron and Open File; group diffs |
| Page on a pressed Graph commit | hung with the first build of this step | answers |
| Tooltips of git verbs | lower case ("push", "stage") | capitalised ("Push", "Stage") |

## The landing look (for the orchestrator on TEST, side by side with VS Code)

| Element | State a repository on TEST must be in | Where oculus sets each measure |
|---|---|---|
| Title bar and its actions | any repository; list and tree modes | toggle: `Repositories.svelte` (the `view_tree` and `list` glyphs, the words View as Tree and View as List); the head rule `TreeItem.svelte:526-535` (11 px via `--tree-heading-font`, weight 700, uppercase) |
| Repository row | a branch with an upstream, 2 behind and 4 ahead, a readable repository; also one with no upstream and a remote; a long branch name; a pane of 300 px | `RepoList.svelte:232-233` (gap 1 px, margin 4 px), `TreeActions.svelte:46-60` (4 px, 16 px line, 20 px boxes), `Repositories.svelte:391-397` (end inset 12 px, icon 16 px with 2 px) |
| Commit box, Commit state | something staged or changed; also one long line and several lines in a narrow pane | `CommitBox.svelte:236-237` (border 1 px, `--input-radius`), `:272` (toolbar padding), `:278-280` (the `.acts` grid), `ToolButton.svelte:359-370` (primary: 4px 8px, `--button-line`, `--button-font`, `--input-radius`), `MenuOpener.svelte:156` (dropdown 0 4px), `Repo.svelte:268-270` (11 px and 12 px), `TextArea.svelte` (`grow`, `field-sizing`) |
| Commit box, Sync Changes state | a clean tree, a branch with an upstream, ahead or behind | `repositories.ts` `actionButton()`; the same rules |
| Commit box, Publish Branch state | a clean tree, a branch with no upstream and a remote | `repositories.ts` `actionButton()`; the same rules |
| Change group and change row | staged, changed (with a deleted file and a renamed one) and untracked files of several types; a merge in progress for Merge Changes | badge `TreeItem.svelte:500-507` (size token `--tree-badge-size`, `3px 5px`, radius 11); row `ChangeRow.svelte:193-216` (folder 0.9 em and opacity 0.7, status letter 90%, weight 600, opacity 0.75, 16 px box, 5 px); icon `FileIcon.svelte:43-46`; colours `tokens.css:81-92` |
| Tree mode | files in several folders, a chain of single-child folders, a file at the root; close a folder while its file holds the focus | `change-tree.ts`; `Changes.svelte` and `FolderRow.svelte` |
| Graph lanes and a graph row with pills | a merge commit, a branch and a tag on one commit, a long branch name | `graph-lanes.ts:89,94,109,176` (laneX, laneWidth, lanePaths, commitCircles), `Lanes.svelte:58-76`; pills `CommitRow.svelte:177-205` |
| Incoming and Outgoing | a branch ahead of and behind its upstream | `GraphHead.svelte`, `Lanes.svelte` (dashed ring `stroke-dasharray` "4,2") |
| A commit open in the graph | press a commit that has files; also reload with it open | `CommitFiles.svelte`; the fix `virtual.ts` `rowWindow(virtualizer, held)` and `VirtualRows.svelte` |
| Diff bar | a file diff (Open File shown) and a commit diff (not shown) | `diff/DiffBar.svelte` |
| File header | a stash of several files, a rename in a commit, a group diff | `FileHeader.svelte:76-92` (22 px, sticky, panel, wall surface) |
| Load more | a branch with more commits than one page | `GraphHead.svelte` |

## Wrong or impossible in the brief, with evidence

1. Ruling 4 and the brief's "Oculus's own colours stay ... No hex value of VS Code's themes is copied" do not give a way to the light Seti set that VS Code draws: open item A.
2. Item 3a puts the badge "6 px from the row's right edge"; VS Code's rows end 12 px in (`X3d-vscode-scm.css`), and the 6 px belongs to the head. Built as 12 px on rows and 6 px on heads.
3. Item 8 reads each path of a group with `fileDiffUrl`; git draws a renamed path read alone as a new file, so item 12's "for a rename the status and the old path" cannot hold in a group diff without an old path on `GitEntry`: open item B.
4. Item 19 says the scratch server shows every state of the step; the session panel's Changes view needs a session record, and a transcript written into the scratch `~/.claude/projects` is read (it enters `transcript-cache.json`) but the Sessions list stays empty ("No sessions in the window."), so the session panel could not be opened.
5. Verify 1 says `npm run diagrams` runs "right before each run of the full list and at no other time"; the diagrams check fails after any change to an import until it is regenerated, so it was run right before each `checks.sh` run only.

## Next

Rule on open items A and B. The landing look on TEST is the orchestrator's check, from the table "The landing look".
