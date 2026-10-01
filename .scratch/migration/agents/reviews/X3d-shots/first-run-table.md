| File | Test | Unchanged tree (first run, test in final form) | Final tree |
|---|---|---|---|
| `git-parse.test.ts` | statusRecords reads a rename with its old path, an untracked path and a path with a space | pass | pass |
| `git-parse.test.ts` | statusRecords reads a copy and a rename in the worktree column with their old paths | pass | pass |
| `git-parse.test.ts` | statusRecords has no records for empty output | pass | pass |
| `git-parse.test.ts` | the change lists of a status sorts each record into its list, the line counts on the worktree side alone | pass | pass |
| `git-parse.test.ts` | the change lists of a status gives the entry of a rename or a copy its old path, and no other entry one | FAIL: AssertionError: expected [ [ 'new.txt', undefined ], …(2) ] to deeply equal [ [ 'new.txt', 'old.txt' ], …(2) ] | pass |
| `git-parse.test.ts` | the change lists of a status reads a binary file of numstat as no counts and a rename by its new path | pass | pass |
| `git-parse.test.ts` | git's attributes and reasons reads the five attributes in the order asked, and a missing line as unspecified | pass | pass |
| `git-parse.test.ts` | git's attributes and reasons cuts a reason to its first line and width, without git's fatal prefix | pass | pass |
| `git.test.ts` | the shape reports the branch of a clean repository and nothing else | pass | pass |
| `git.test.ts` | the shape puts staged, changed and untracked paths in their own lists | pass | pass |
| `git.test.ts` | the shape carries the line counts of a changed file | pass | pass |
| `git.test.ts` | the shape reports no line counts for a file in the index | pass | pass |
| `git.test.ts` | the shape reports null rather than a count for a binary file | pass | pass |
| `git.test.ts` | the shape keeps git's letter for a deleted file | pass | pass |
| `git.test.ts` | the shape reports the new path of a rename once | pass | pass |
| `git.test.ts` | the shape gives a staged rename its old path, with rename detection on whatever the config says | FAIL: AssertionError: expected { Object (path, status, ...) } to match object { status: 'R', from: 'kept.txt' } | pass |
| `git.test.ts` | the shape survives the NUL parsing with a path holding a space | pass | pass |
| `git.test.ts` | the shape lists one file that is both staged and changed in both lists | pass | pass |
| `git.test.ts` | the shape caps each list | pass | pass |
| `git.test.ts` | the shape counts the commits the upstream has not seen | pass | pass |
| `git.test.ts` | the shape says the branch tracks nothing, and says nothing is known before a read | pass | pass |
| `git.test.ts` | the shape says HEAD and detached when nothing is checked out | pass | pass |
| `git.test.ts` | the log, the branches and the worktrees carries the newest commits, newest first, capped at the constant | pass | pass |
| `git.test.ts` | the log, the branches and the worktrees reads a repository with no commit in it, its branch and its files, as no error | pass | pass |
| `git.test.ts` | the log, the branches and the worktrees lists every branch with its upstream and which one is checked out | pass | pass |
| `git.test.ts` | the log, the branches and the worktrees lists the checkout first and every worktree after it | pass | pass |
| `git.test.ts` | the log, the branches and the worktrees reads a detached worktree without a branch | pass | pass |
| `git.test.ts` | the log, the branches and the worktrees caps the branch list | pass | pass |
| `git.test.ts` | the log, the branches and the worktrees cuts every list it publishes at the cap | pass | pass |
| `git.test.ts` | the log, the branches and the worktrees says whether the repository keeps its worktrees folder out of its history | pass | pass |
| `git.test.ts` | failure does not take a plain directory for a repository | pass | pass |
| `git.test.ts` | failure comes back empty for a path that does not exist | pass | pass |
| `git.test.ts` | failure says which of a path that is not there and a folder that is no repository a root is | pass | pass |
| `git.test.ts` | failure keeps a repository whose config git cannot parse a repository, and says why | pass | pass |
| `git.test.ts` | failure says a path too long to be a name is not there | pass | pass |
| `git.test.ts` | failure keeps a path that is there but is no folder to enter, with git own reason | pass | pass |
| `git.test.ts` | failure says a root that went away between the two reads is not there, not that it is no repository | pass | pass |
| `git.test.ts` | failure keeps a repository whose status cannot be read a repository, with the reason | pass | pass |
| `git.test.ts` | failure keeps a repository git names no branch for a repository, with the reason | pass | pass |
| `git.test.ts` | failure keeps a root whose repository check timed out, and the view on it, and no root git cannot start | pass | pass |
| `git.test.ts` | failure yields nothing and raises nothing on rubbish input | pass | pass |
| `git.test.ts` | failure returns the empty shape every root returns | pass | pass |
| `git.test.ts` | failure falls back on a timeout of zero rather than failing every root | pass | pass |
| `git.test.ts` | the tracked files lists the tracked paths relative to the folder asked, untracked ones left out | pass | pass |
| `git.test.ts` | the tracked files refuses a folder that is no repository, saying why | pass | pass |
| `git.test.ts` | read only names the entries the repository ignores, and leaves it as it was | pass | pass |
| `git.test.ts` | read only leaves a repository exactly as it was | pass | pass |
| `git.test.ts` | read only names no writing subcommand in its source | pass | pass |
| `git.test.ts` | read only holds only the allowed subcommands at its call site, the pinned nine as their exact vectors | pass | pass |
| `git.test.ts` | read only ran every command without optional locks, so a read writes no index lock | pass | pass |
| `git.test.ts` | read only ran nothing but those commands over this file, the pinned nine as their vectors | pass | pass |
| `change-tree.test.ts` | the tree of a change group puts two files of one folder under it and the file at the root beside it | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' imported from /Users/axelfaes/work... | pass |
| `change-tree.test.ts` | the tree of a change group joins a chain of folders with one child each into one row and puts the file under it | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' imported from /Users/axelfaes/work... | pass |
| `change-tree.test.ts` | the tree of a change group keeps a folder that holds a folder and a file as its own row | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' imported from /Users/axelfaes/work... | pass |
| `change-tree.test.ts` | the tree of a change group keeps spaces in a folder name and a file name | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' imported from /Users/axelfaes/work... | pass |
| `change-tree.test.ts` | the tree of a change group gives no rows for no paths, and sorts by base letter with ties in code unit order | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' imported from /Users/axelfaes/work... | pass |
| `change-tree.test.ts` | the tree of a change group sorts the folders before the files, each by name | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' imported from /Users/axelfaes/work... | pass |
| `change-tree.test.ts` | the tree of a change group carries the whole folder path and every path under a folder on its row | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' imported from /Users/axelfaes/work... | pass |
| `change-tree.test.ts` | the tree of a change group draws the paths of this repository as the brief names them | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' imported from /Users/axelfaes/work... | pass |
| `change-tree.test.ts` | the folder a path sits in is the path without its last part, and empty for a path at the root | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' imported from /Users/axelfaes/work... | pass |
| `change-tree.test.ts` | the ids of the folders of a change group tells one folder apart in two groups and in two repositories | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' imported from /Users/axelfaes/work... | pass |
| `change-tree.test.ts` | the ids of the folders of a change group never equals the id of a section, a group or the repositories head | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' imported from /Users/axelfaes/work... | pass |
| `change-tree.test.ts` | the ids of the folders of a change group gives a file at the root of the group no folder row and so no folder id | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' imported from /Users/axelfaes/work... | pass |
| `change-tree.test.ts` | the rows the keyboard reads in tree mode lists the folder row and the files under it, in the order they are drawn | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' imported from /Users/axelfaes/work... | pass |
| `change-tree.test.ts` | the rows the keyboard reads in tree mode leaves a row inside a closed folder out | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' imported from /Users/axelfaes/work... | pass |
| `change-tree.test.ts` | the rows the keyboard reads in tree mode lists no folder row in list mode, whatever the instance kept closed | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' imported from /Users/axelfaes/work... | pass |
| `change-tree.test.ts` | the rows the keyboard reads in tree mode keeps the merge group a list in tree mode | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' imported from /Users/axelfaes/work... | pass |
| `change-tree.test.ts` | an untracked folder git lists as a whole is one file row named for the folder, and no row has an empty name | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' imported from /Users/axelfaes/work... | pass |
| `change-tree.test.ts` | an untracked folder git lists as a whole is named by its last part, and sits in the folder above it | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' imported from /Users/axelfaes/work... | pass |
| `change-tree.test.ts` | the closed folders the instance keeps drops a folder id of the shown repository whose folder is in no group | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' imported from /Users/axelfaes/work... | pass |
| `change-tree.test.ts` | the closed folders the instance keeps drops the folder ids of the commits of the repository other than the open one | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' imported from /Users/axelfaes/work... | pass |
| `change-tree.test.ts` | the closed folders the instance keeps answers whether a focused row is inside a folder that closes | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' imported from /Users/axelfaes/work... | pass |
| `change-tree.test.ts` | the closed folders the instance keeps answers it for the files of a graph commit by the prefix their ids begin with | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' imported from /Users/axelfaes/work... | pass |
| `change-tree.test.ts` | the closed folders the instance keeps hides the rows under a folder the reader closed, and only those | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' imported from /Users/axelfaes/work... | pass |
| `commit-action.test.ts` | the lines of the commit message field is one for an empty message and one for a long line that wraps | FAIL: TypeError: (0 , __vite_ssr_import_1__.messageRows) is not a function | pass |
| `commit-action.test.ts` | the lines of the commit message field is the line count up to ten, a trailing newline counting its empty line | FAIL: TypeError: (0 , __vite_ssr_import_1__.messageRows) is not a function | pass |
| `commit-action.test.ts` | what the commit box button is is Commit while anything is staged, changed, untracked or unmerged | FAIL: TypeError: (0 , __vite_ssr_import_1__.actionButton) is not a function | pass |
| `commit-action.test.ts` | what the commit box button is is Commit while a merge or a rebase is in progress with nothing left to stage | FAIL: TypeError: (0 , __vite_ssr_import_1__.actionButton) is not a function | pass |
| `commit-action.test.ts` | what the commit box button is is Sync Changes with nothing to commit and a branch ahead of or behind its upstream | FAIL: TypeError: (0 , __vite_ssr_import_1__.actionButton) is not a function | pass |
| `commit-action.test.ts` | what the commit box button is is the disabled Commit button with nothing to commit and nothing to sync | FAIL: TypeError: (0 , __vite_ssr_import_1__.actionButton) is not a function | pass |
| `commit-action.test.ts` | what the commit box button is is the disabled Commit button on a detached head, whatever the upstream state says | FAIL: TypeError: (0 , __vite_ssr_import_1__.actionButton) is not a function | pass |
| `commit-action.test.ts` | what the commit box button is is Publish Branch with nothing to commit, no upstream and a remote to publish to | FAIL: TypeError: (0 , __vite_ssr_import_1__.actionButton) is not a function | pass |
| `commit-action.test.ts` | what the commit box button is is Publish Branch for a repository with no commit exactly when Publish Branch is offered | FAIL: TypeError: (0 , __vite_ssr_import_1__.actionButton) is not a function | pass |
| `commit-action.test.ts` | what the commit box button is is Commit before it is Sync or Publish | FAIL: TypeError: (0 , __vite_ssr_import_1__.actionButton) is not a function | pass |
| `commit-action.test.ts` | the branch the commit box names is the checked-out branch, and none for a detached head or an unnamed one | FAIL: TypeError: (0 , __vite_ssr_import_1__.checkedOutBranch) is not a function | pass |
| `repositories.test.ts` | where a worktree goes puts one under the repository own worktrees folder, whatever the root ends with | pass | pass |
| `repositories.test.ts` | where a worktree goes takes a name that is one folder and refuses one that is not | pass | pass |
| `repositories.test.ts` | where a worktree goes takes a resolved path of one name under the folder and nothing else | pass | pass |
| `repositories.test.ts` | where a worktree goes shows a worktree under its own name, and a path elsewhere as it is | pass | pass |
| `repositories.test.ts` | where a worktree goes reads the .gitignore rule, past a comment and a missing slash | pass | pass |
| `repositories.test.ts` | the repository a view shows shows the repository it keeps while the channel carries it, and the first one otherwise | pass | pass |
| `repositories.test.ts` | the repository a view shows reads what the instance keeps, and a default for anything it cannot read | FAIL: AssertionError: expected { root: '/hub', …(2) } to deeply equal { root: '/hub', …(4) } | pass |
| `repositories.test.ts` | the repository a view shows reads a diff pane layout and its view state per file, side by side by default | FAIL: AssertionError: expected { mode: 'inline', views: {} } to deeply equal { mode: 'inline', views: {}, …(2) } | pass |
| `repositories.test.ts` | the repository a view shows keeps the files of a re-read that changed nothing, so the view state stays | pass | pass |
| `repositories.test.ts` | the repository a view shows offers every root the channel carries a state for, in the channel order | pass | pass |
| `repositories.test.ts` | the repository a view shows keeps showing a root the reader picked after its folder was deleted | pass | pass |
| `repositories.test.ts` | the repository a view shows offers a repository with no commit yet and one whose read failed, and keeps showing it | pass | pass |
| `repositories.test.ts` | the repository a view shows offers a root whose repository check did not answer, and keeps showing it | pass | pass |
| `repositories.test.ts` | the repository a view shows names a repository by its last folder, and by its last two where another shares it | pass | pass |
| `repositories.test.ts` | the rows of one repository leaves out an empty staged group and an empty merge group, and draws Merge Changes first | pass | pass |
| `repositories.test.ts` | the rows of one repository lists each head, and under an open one its groups and rows, for the keyboard | pass | pass |
| `repositories.test.ts` | the rows of one repository lists the Repositories section head and a row per repository under it while it is open | pass | pass |
| `repositories.test.ts` | the rows of one repository names each status letter by its word, each unmerged pair by its conflict, and any other as changed | pass | pass |
| `repositories.test.ts` | the rows of one repository colours a status letter in its Source Control hue, a conflict in its own, and an unknown one grey | pass | pass |
| `repositories.test.ts` | the writes store over the git endpoint posts each worktree action to the git endpoint with the page token | pass | pass |
| `repositories.test.ts` | the writes store over the git endpoint carries the endpoint's own refusal back to the view | pass | pass |
| `repositories.test.ts` | what a press leaves behind holds one root busy at a time and leaves every other root live | pass | pass |
| `repositories.test.ts` | what a press leaves behind pushes the branch behind the confirm and answers whether git did, as a switch does | pass | pass |
| `repositories.test.ts` | what a press leaves behind asks for a shell in the worktree it just made, and shows the terminal | pass | pass |
| `repositories.test.ts` | what a press leaves behind asks for a shell in a worktree that is already there | pass | pass |
| `repositories.test.ts` | what a press leaves behind starts no shell when the worktree was not made | pass | pass |
| `repositories.test.ts` | what a press leaves behind starts the shell through the one start-and-show path | pass | pass |
| `repositories.test.ts` | what a press leaves behind keeps the write sentence and says the terminal failure after it | pass | pass |
| `repositories.test.ts` | what a press leaves behind opens a diff in a pane of its own, keyed by what it is over | pass | pass |
| `repositories.test.ts` | what a press leaves behind carries the confirm on every write that can lose work, and on none of the others | FAIL: TypeError: store.stagePaths is not a function | pass |
| `repositories.test.ts` | what a press leaves behind commits, amends, and commits then pushes or syncs, and clears the message after | pass | pass |
| `repositories.test.ts` | what a press leaves behind keeps the message and pushes nothing when the commit is refused | pass | pass |
| `repositories.test.ts` | what a press leaves behind fills the message from what the suggest action answers | pass | pass |
| `repositories.test.ts` | what a press leaves behind sends a hunk or a line as a patch to stage, unstage or revert, and confirms only a revert | pass | pass |
| `repositories.test.ts` | what a press leaves behind acts on a whole group from its head, and confirms only Discard All Changes | pass | pass |
| `repositories.test.ts` | what a press leaves behind confirms the remote, merge, stash and tag writes that can lose work, and none of the rest | pass | pass |
| `repositories.test.ts` | what a press leaves behind opens a conflict in the merge editor, an untracked file in a source tab, and the rest as a diff | pass | pass |
| `repositories.test.ts` | what a press leaves behind opens a file at the line asked for, and says so when no served root holds it | pass | pass |
| `repositories.test.ts` | what a press leaves behind shows an untracked folder in the Files view and opens no source tab for it | FAIL: AssertionError: expected [ { view: 'source', …(2) } ] to deeply equal [] | pass |
| `repositories.test.ts` | what a press leaves behind opens a blamed commit in the graph of the Repositories view, the graph opened | FAIL: AssertionError: expected { root: '/hub', …(2) } to deeply equal { root: '/hub', …(4) } | pass |
| `repositories.test.ts` | what a branch and a diff pane offer offers Publish Branch only on a branch that tracks nothing and has a remote to go to | pass | pass |
| `repositories.test.ts` | what a branch and a diff pane offer names the upstream of the branch that is checked out | pass | pass |
| `repositories.test.ts` | what a branch and a diff pane offer lets a file diff act on its hunks, and not a commit, a stash or a worktree | pass | pass |
| `repositories.test.ts` | what a branch and a diff pane offer reads a commit diff and a stash diff from their own addresses | pass | pass |
| `repositories.test.ts` | the worktrees and workspaces a repository payload names are the worktrees other than the main checkout, and the workspaces counted | pass | pass |
| `repositories.test.ts` | what a repository state comes to is one of the six shapes, told apart by the facts the channel carries | pass | pass |
| `repositories.test.ts` | what a repository state comes to counts the conflicted, staged, changed and untracked files together | pass | pass |
| `repositories.test.ts` | what a repository state comes to names the branch the listing marks as checked out, and none without one | pass | pass |
| `view-state.test.ts` | the mode of the view is the list for an absent or an unknown value and the tree only when it says tree | FAIL: AssertionError: expected undefined to be 'list' // Object.is equality | pass |
| `view-state.test.ts` | the mode of the view keeps the request to open the Branches section only as that word | FAIL: AssertionError: expected undefined to be '' // Object.is equality | pass |
| `view-state.test.ts` | the id of a diff over a change group holds the group and the root, so the staged and the changed group are two panes | FAIL: AssertionError: expected 'staged:/hub:' to contain 'group@staged' | pass |
| `view-state.test.ts` | the id of a diff over a change group tells the same group of two repositories apart | pass | pass |
| `view-state.test.ts` | the id of a diff over a change group is no id of a file, a stash or a worktree diff over the same empty path | FAIL: AssertionError: expected [ 'staged:/hub:', …(2) ] to not include 'staged:/hub:' | pass |
| `view-state.test.ts` | the id of a diff over a change group allows no hunk action, as a stash does not | FAIL: AssertionError: expected true to be false // Object.is equality | pass |
| `view-state.test.ts` | the paths of a change group are the staged paths for the staged group and the changed ones for the changed group | FAIL: TypeError: (0 , __vite_ssr_import_1__.groupPaths) is not a function | pass |
| `view-state.test.ts` | the old path of a renamed file of a change group is the entry`s old path in its group, and the empty string for a plain change | FAIL: TypeError: (0 , __vite_ssr_import_1__.groupFrom) is not a function | pass |
| `view-state.test.ts` | a group diff before the git channel has answered waits while no repository is known and reads once any is, even one other than its own | FAIL: TypeError: (0 , __vite_ssr_import_1__.groupWaits) is not a function | pass |
| `view-state.test.ts` | the reads of a group diff answer in the order of the paths and run at most the limit at once | FAIL: TypeError: (0 , __vite_ssr_import_1__.readAll) is not a function | pass |
| `view-state.test.ts` | the reads of a group diff answer for no path, and for fewer paths than the limit | FAIL: TypeError: (0 , __vite_ssr_import_1__.readAll) is not a function | pass |
| `view-state.test.ts` | what a diff pane keeps of its files folds the unchanged runs and no file to start with | FAIL: AssertionError: expected { mode: 'side', views: {} } to deeply equal { mode: 'side', views: {}, …(2) } | pass |
| `view-state.test.ts` | what a diff pane keeps of its files reads the unchanged choice and the folded files, and defaults anything it cannot read | FAIL: AssertionError: expected { mode: 'side', views: {} } to match object { unchanged: 'shown', …(1) } | pass |
| `view-state.test.ts` | what a diff pane keeps of its files drops a folded file that is not among the files of the diff | FAIL: AssertionError: expected undefined to deeply equal [ 'a' ] | pass |
| `view-state.test.ts` | what a diff pane keeps of its files folds a file that is open and opens one that is folded | FAIL: TypeError: (0 , __vite_ssr_import_1__.toggleFolded) is not a function | pass |
| `view-state.test.ts` | what a diff pane keeps of its files opens a folded file a step lands on and leaves the rest as they were | FAIL: TypeError: (0 , __vite_ssr_import_1__.unfolded) is not a function | pass |
| `view-state.test.ts` | a reveal asked of a diff section is done at once by a section whose editor is drawn and has reported its changes | FAIL: TypeError: (0 , __vite_ssr_import_2__.revealAsked) is not a function | pass |
| `view-state.test.ts` | a reveal asked of a diff section is kept by a folded or not yet drawn section, and done when its editor reports its changes | FAIL: TypeError: (0 , __vite_ssr_import_2__.revealAsked) is not a function | pass |
| `view-state.test.ts` | a reveal asked of a diff section keeps each reveal asked before the editor reports as that reveal's own pending hunk | FAIL: TypeError: (0 , __vite_ssr_import_2__.revealAsked) is not a function | pass |
| `view-state.test.ts` | a reveal asked of a diff section keeps nothing for a step whose hunk is not known yet, since the pane asks again once it is | FAIL: TypeError: (0 , __vite_ssr_import_2__.revealAsked) is not a function | pass |
| `view-state.test.ts` | a reveal asked of a diff section does nothing when the editor reports its changes and none is kept | FAIL: TypeError: (0 , __vite_ssr_import_2__.revealDue) is not a function | pass |
| `view-state.test.ts` | the questions the sync, pull, push and publish controls share name the branch and its upstream, and what the write will do | FAIL: TypeError: (0 , __vite_ssr_import_1__.syncWords) is not a function | pass |
| `view-state.test.ts` | the questions the sync, pull, push and publish controls share name the remote a branch is published to | FAIL: TypeError: (0 , __vite_ssr_import_1__.publishWords) is not a function | pass |
| `badge.test.ts` | the badge of a tree row audit: is painted from --line and --on-line, which read at 4.5:1 in every theme | FAIL: AssertionError: expected '<script lang="ts">\n    // Layer 3, p…' to match /background: var\(--line\);\s*color: v…/ | pass |
| `badge.test.ts` | the badge of a Monaco-drawn surface keeps the editor kit colours, the muted fill and the text on a filled control | pass | pass |
| `tool-button.test.ts` | the primary look of a tool button draws the glyph and then the words, and carries the look as a class | FAIL: AssertionError: expected '<button type="button" class="tool sve…' to match /class="tool[^"]*\bprimary\b/ | pass |
| `tool-button.test.ts` | the primary look of a tool button is joined to a dropdown only when it is told so | FAIL: AssertionError: expected '<button type="button" class="tool sve…' to match /class="tool[^"]*\bjoined\b/ | pass |
| `tool-button.test.ts` | the primary look of a tool button is disabled with the reason as its words when it cannot be pressed | FAIL: AssertionError: expected '<button type="button" class="tool sve…' to match /class="tool[^"]*\bprimary\b/ | pass |
| `tool-button.test.ts` | the primary look of a tool button audits that sets VS Code button measures: 4px 8px, a 16px line, 12px words, the input radius | FAIL: AssertionError: expected '' to contain 'width: 100%' | pass |
| `tool-button.test.ts` | the primary look of a tool button audits that squares the right corners of a joined button and draws a 1px separator leaving 4px | FAIL: AssertionError: expected '' to match /border-radius:[^;]*0 0/ | pass |
| `file-icons.test.ts` | the icon of a file name takes the glyph and the colour the table gives a name, its default for one it does not know | fails to load: Cannot find module '../../../src/lib/ui/display/FileIcon.svelte' imported from /Users/axelfaes/workspace/research-hub... | pass |
| `file-icons.test.ts` | the icon of a file name takes the entry of a longer ending or of a name over the shorter ending that also matches | fails to load: Cannot find module '../../../src/lib/ui/display/FileIcon.svelte' imported from /Users/axelfaes/workspace/research-hub... | pass |
| `file-icons.test.ts` | the icon of a file name reads the name at the end of a path, and nothing of the folders before it | fails to load: Cannot find module '../../../src/lib/ui/display/FileIcon.svelte' imported from /Users/axelfaes/workspace/research-hub... | pass |
| `file-icons.test.ts` | the icon drawn before a name holds the glyph character, its glyph name and its colour name | fails to load: Cannot find module '../../../src/lib/ui/display/FileIcon.svelte' imported from /Users/axelfaes/workspace/research-hub... | pass |
| `file-icons.test.ts` | the icon drawn before a name audit: draws each colour of the table from a --seti token that holds seti-ui's own value | fails to load: Cannot find module '../../../src/lib/ui/display/FileIcon.svelte' imported from /Users/axelfaes/workspace/research-hub... | pass |
| `file-icons.test.ts` | the icon drawn before a name audit: gives the 16px icon box to the icon, the status letter and the row controls from one token | fails to load: Cannot find module '../../../src/lib/ui/display/FileIcon.svelte' imported from /Users/axelfaes/workspace/research-hub... | pass |
| `file-icons.test.ts` | the icon drawn before a name gives a name the longest ending that matches it, as VS Code reads its Seti theme | fails to load: Cannot find module '../../../src/lib/ui/display/FileIcon.svelte' imported from /Users/axelfaes/workspace/research-hub... | pass |
| `file-icons.test.ts` | the icon drawn before a name gives a name that only contains the text of an entry the default | fails to load: Cannot find module '../../../src/lib/ui/display/FileIcon.svelte' imported from /Users/axelfaes/workspace/research-hub... | pass |
| `file-icons.test.ts` | the icon drawn before a name gives a whole name the table lists as a partial entry its own icon | fails to load: Cannot find module '../../../src/lib/ui/display/FileIcon.svelte' imported from /Users/axelfaes/workspace/research-hub... | pass |
| `file-icons.test.ts` | the icon drawn before a name reads a name in lower case, the way VS Code keys its Seti theme | fails to load: Cannot find module '../../../src/lib/ui/display/FileIcon.svelte' imported from /Users/axelfaes/workspace/research-hub... | pass |
| `file-icons.test.ts` | the icon drawn before a name gives an empty name, and a path that ends in a slash, the default | fails to load: Cannot find module '../../../src/lib/ui/display/FileIcon.svelte' imported from /Users/axelfaes/workspace/research-hub... | pass |
| `text-area.test.ts` | a text area that grows with its text takes its rows from the caller, three by default, with no growth | pass | pass |
| `text-area.test.ts` | a text area that grows with its text holds its rows between the least and the most it may grow to | FAIL: AssertionError: expected '<textarea class="area svelte-vvoqyc" …' to contain 'rows="10"' | pass |
| `text-area.test.ts` | a text area that grows with its text carries the least and the most as the properties its rules size it with | FAIL: AssertionError: expected '<textarea class="area svelte-vvoqyc" …' to contain '--grow-min: 1' | pass |
| `text-area.test.ts` | a text area that grows with its text draws the tree text size when it is asked for, and the small one otherwise | FAIL: AssertionError: expected '<textarea class="area svelte-vvoqyc" …' to match /class="[^"]*\btree\b/ | pass |
| `text-area.test.ts` | a text area that grows with its text audits that sizes to its content between the least and the most, and scrolls past the most | FAIL: AssertionError: expected '' to contain 'field-sizing: content' | pass |
| `text-area.test.ts` | a text area that grows with its text audits that cuts a placeholder wider than the empty box rather than wrapping it | FAIL: AssertionError: expected '' to contain 'white-space: nowrap' | pass |
| `text-area.test.ts` | a text area that grows with its text audits that keeps the terminal form under body.rice | pass | pass |
| `menu-opener.test.ts` | the primary look of a menu opener is drawn only when the menu is asked for it | FAIL: AssertionError: expected '<button type="button" class="opener s…' to match /class="opener[^"]*\bprimary\b/ | pass |
| `menu-opener.test.ts` | the primary look of a menu opener keeps the words of the menu as its accessible name | pass | pass |
| `menu-opener.test.ts` | the primary look of a menu opener audits that sets the dropdown part measures: 0 4px, square left corners, the button colours | FAIL: AssertionError: expected '' to contain 'padding: 0 4px' | pass |
| `menu.test.ts` | a menu choice with a list of its own is a submenu trigger, and the menu draws no Back choice | pass | pass |
| `menu.test.ts` | a disabled menu item carries the disabled mark bits-ui gives it, and an enabled item carries none | FAIL: AssertionError: expected '<div id="bits-s2" tabindex="-1" role=…' to match /^<[a-z]+ [^>]*aria-disabled="true"/ | pass |
| `menu.test.ts` | a menu item draws its check, its dot, its glyph and its badge, hidden from its name | pass | pass |
| `tree.test.ts` | one explorer row is a treeitem with its level, its open state and its selection when it is in a tree | pass | pass |
| `tree.test.ts` | one explorer row takes the stop only when it is the tree stop | pass | pass |
| `tree.test.ts` | one explorer row keeps its controls out of the focus order until the focus is inside the row | pass | pass |
| `tree.test.ts` | one explorer row draws one indent guide per level and an arrow only on a row that opens | pass | pass |
| `tree.test.ts` | one explorer row draws a row with nothing to press as text | pass | pass |
| `tree.test.ts` | one explorer row draws the row in force as a bold name with a check, and not as a selection | pass | pass |
| `tree.test.ts` | one explorer row draws its count at the right edge, after the button and the controls | pass | pass |
| `tree.test.ts` | the count of a row drawn as a badge audits that draws a count as plain text in the number font when the row is given no badge | pass | pass |
| `tree.test.ts` | the count of a row drawn as a badge audits that draws a badge in the interface font with tabular figures and a plain count in the number font | FAIL: AssertionError: expected '' to contain 'font-family: var(--font-ui)' | pass |
| `tree.test.ts` | the count of a row drawn as a badge draws the count as a pill when the row is given the badge | FAIL: AssertionError: expected '<!--[--><div class="item svelte-dj5yz…' to match /class="count[^"]*\bbadge\b[^"]*"…/span> | pass |
| `tree.test.ts` | the count of a row drawn as a badge carries the words of the count as its hover words | FAIL: AssertionError: expected '<!--[--><div class="item svelte-dj5yz…' to match /class="count[^"]*"[^>]*title="3 chang…/ | pass |
| `tree.test.ts` | the count of a row drawn as a badge draws a section head with the badge it is given | FAIL: AssertionError: expected '<!--[--><div class="section svelte-1h…' to match /class="count[^"]*\bbadge\b[^"]*"…/span> | pass |
| `tree.test.ts` | the parts of a row beyond its name draws the end before the controls when the row is trailing, and after the count otherwise | FAIL: AssertionError: expected 685 to be less than 476 | pass |
| `tree.test.ts` | the parts of a row beyond its name draws a strong row with no check, and a row in force with its check | FAIL: AssertionError: expected '<div class="item svelte-dj5yz8">' to contain 'strong' | pass |
| `tree.test.ts` | the parts of a row beyond its name draws a struck row and the style of its name | FAIL: AssertionError: expected '<div class="item svelte-dj5yz8">' to contain 'struck' | pass |
| `tree.test.ts` | the parts of a row beyond its name lets the controls of a yielding row give way before the name | FAIL: AssertionError: expected '<!--[--><div class="item svelte-dj5yz…' to match /class="actions[^"]*\byielding\b/ | pass |
| `tree.test.ts` | the look of a row, read from the source audits that draws a heading row in capitals, not small capitals, at weight 700 in the ink | FAIL: AssertionError: expected '.heading .main {\n        font-weight…' to contain 'text-transform: uppercase' | pass |
| `tree.test.ts` | the look of a row, read from the source audits that draws the detail, the count and the end at the small size, as every tree view does | pass | pass |
| `tree.test.ts` | the look of a row, read from the source audits that sets its own background as `--row-bg` in each state, the values a graph row repeats for its lanes | FAIL: AssertionError: expected '<script lang="ts">\n    // Layer 3, p…' to contain '--row-bg: var(--panel)' | pass |
| `tree.test.ts` | a section of rows draws its head as a level-one treeitem always, and its group only while it is open | pass | pass |
| `tree.test.ts` | the tree is a tree named by its label | pass | pass |
| `tree.test.ts` | the tree draws each row as a treeitem at the level its parent gives it, whatever level the row was handed | pass | pass |
| `tree.test.ts` | the tree says a closed row is closed, and says nothing of a row that does not open | pass | pass |
| `tree.test.ts` | the tree gives exactly one row the stop: the current one while it is drawn, else the first | pass | pass |
| `tree.test.ts` | the tree keeps drawn the row holding the stop: the current one while it is drawn, else the first | pass | pass |
| `tree.test.ts` | the breadcrumb draws one control per segment in order, the last named as the current location | pass | pass |
| `virtual.test.ts` | the window of a long list draws rows 95 to 124 of 1,000 in a 440 px box at 2,200 px, and keeps the list 22,000 px tall | pass | pass |
| `virtual.test.ts` | the window of a long list measures the gaps from the list, not from the top of the scroll box it sits in | pass | pass |
| `virtual.test.ts` | the rows a list keeps drawn draws a kept row far above the window at its place, with the gaps around it | pass | pass |
| `virtual.test.ts` | the rows a list keeps drawn draws a kept row already inside the window once | pass | pass |
| `virtual.test.ts` | the rows a list keeps drawn ignores a kept index the list does not hold | pass | pass |
| `virtual.test.ts` | the window before the list has its scroll box draws the first two overscans of rows of a longer list | pass | pass |
| `virtual.test.ts` | the window before the list has its scroll box draws every row of a list shorter than that | pass | pass |
| `virtual.test.ts` | a window read again hands back the window the list holds when the virtualizer draws the same rows | FAIL: AssertionError: expected { rows: [ …(30) ], after: 19250, …(1) } to be { rows: [ …(30) ], after: 19250, …(1) } // Obj... | pass |
| `virtual.test.ts` | a window read again hands back a new window when the rows drawn move, or the heights around them change | pass | pass |
| `changes.test.ts` | the changes view offers pin and unpin in place | pass | pass |
| `changes.test.ts` | the changes view lists the files the session touched, relative to its workspace | pass | pass |
| `changes.test.ts` | the changes view marks a file another live session is holding open, and names it | pass | pass |
| `changes.test.ts` | the changes view draws the branch line and the three git groups with their letters | pass | pass |
| `changes.test.ts` | the changes view says a workspace folder that is not there is not there, and not that it is no repository | pass | pass |
| `changes.test.ts` | the changes view says a workspace is not a repository, with git own reason in the tooltip | pass | pass |
| `changes.test.ts` | the changes view says a repository whose read failed could not be read, with git own reason in the text | pass | pass |
| `changes.test.ts` | the changes view says git has not read a workspace the channel carries no state for yet | pass | pass |
| `changes.test.ts` | the changes view says a session with no workspace names no folder | pass | pass |
| `changes.test.ts` | the changes view draws a repository with no commit with its branch and its untracked file | FAIL: AssertionError: expected 1 to be +0 // Object.is equality | pass |
| `changes.test.ts` | the changes view says a branch is in step only when it has an upstream | pass | pass |
| `changes.test.ts` | the changes view draws a control on every row: unstage on a staged one, stage and discard on a changed one | pass | pass |
| `changes.test.ts` | the changes view marks a git row another live session is holding open | pass | pass |
| `changes.test.ts` | the changes view draws Sync Changes and no Push button for a branch ahead of its upstream with nothing to commit | FAIL: AssertionError: expected '<!--[--><section class="pane svelte-b…' to include undefined | pass |
| `changes.test.ts` | the changes view draws Publish Branch for a branch with no upstream and a remote when nothing is to commit | FAIL: AssertionError: expected '<!--[--><section class="pane svelte-b…' to contain 'Publish Branch' | pass |
| `changes.test.ts` | the changes view draws Commit for a branch with changes, whatever its upstream says | FAIL: AssertionError: expected 1 to be +0 // Object.is equality | pass |
| `changes.test.ts` | the changes view draws the commit box with its suggest and commit controls | pass | pass |
| `changes.test.ts` | the changes view draws on each group head what acts on the whole group, as the Repositories view does | pass | pass |
| `changes.test.ts` | the changes view offers on each row what opens it: the diff for a staged or changed path, the file for an untracked one | pass | pass |
| `changes.test.ts` | the changes view draws Merge Changes first while a merge left a path in conflict, its row opening the merge editor | pass | pass |
| `changes.test.ts` | the changes view draws the one commit box the Repositories view draws, with Commit and its list of ways | pass | pass |
| `changes.test.ts` | the changes view shows its empty state with nothing selected | pass | pass |
| `changes.test.ts` | the changes view draws the session control on its bar that its empty state names | pass | pass |
| `changes.test.ts` | the branch-state sentence both git views draw audits that names detached, the distance ahead, the distance behind, and both distances in order | pass | pass |
| `changes.test.ts` | the branch-state sentence both git views draw audits that says in step only for a branch the state gives an upstream | pass | pass |
| `change-rows.test.ts` | the name of a change row is struck through in the deleted tone for a deleted path | FAIL: AssertionError: expected 'data-entry="gone.txt"><!--[0--><!--[-…' to match /class="item[^"]*\bstruck\b/ | pass |
| `change-rows.test.ts` | the name of a change row is in the modified tone and not struck for a modified path | FAIL: AssertionError: expected '<span class="name svelte-dj5yz8">kept…' to contain '--c-scm-modified-txt' | pass |
| `change-rows.test.ts` | the name of a change row is one row under the new path in the renamed tone and not struck for a renamed path | FAIL: AssertionError: expected '<span class="name svelte-dj5yz8">move…' to contain '--c-violet-txt' | pass |
| `change-rows.test.ts` | the icon of a change row is the icon of its file, drawn before its name | FAIL: AssertionError: expected 'data-entry="code/one.py"><!--[0--><!-…' to contain 'data-file-icon="python"' | pass |
| `change-rows.test.ts` | the parts of a change row after its name keeps the folder and the line counts after the name, and draws the status letter last | pass | pass |
| `change-rows.test.ts` | the parts of a change row after its name audits that draws the letter at 90% of the tree font, weight 600, opacity 0.75, in the status colour and no mono font | FAIL: ENOENT: no such file or directory, open 'src/lib/views/sources/repositories/changes/ChangeRow.svelte' | pass |
| `change-rows.test.ts` | the parts of a change row after its name audits that draws the folder at 0.9 of the row size, opacity 0.7 and 0.5em from the name | FAIL: ENOENT: no such file or directory, open 'src/lib/views/sources/repositories/changes/ChangeRow.svelte' | pass |
| `change-rows.test.ts` | the icon controls of the rows of the view audits that draws a 16px icon with 2px round it, in this view only | FAIL: ENOENT: no such file or directory, open 'src/lib/ui/tree/TreeActions.svelte' | pass |
| `change-rows.test.ts` | the controls of a change row are Open File, Discard and Stage on a changed row, in that order | FAIL: AssertionError: expected [ 'diff', 'Open File', 'stage', …(1) ] to deeply equal [ 'Open File', 'discard', 'stage' ] | pass |
| `change-rows.test.ts` | the controls of a change row are Open File and Unstage on a staged row | FAIL: AssertionError: expected [ 'diff', 'Open File', 'unstage' ] to deeply equal [ 'Open File', 'unstage' ] | pass |
| `change-rows.test.ts` | the controls of a change row are Open File and Stage on an untracked row | pass | pass |
| `change-rows.test.ts` | the controls of a change row include no Diff control on any row, since pressing the row opens the diff | FAIL: AssertionError: expected 'data-group="changes"><div class="sect…' not to contain 'aria-label="diff"' | pass |
| `change-rows.test.ts` | the controls of a change row draw the icon each action has in every list of changes | FAIL: AssertionError: expected 'expand' to be 'stage' // Object.is equality | pass |
| `change-rows.test.ts` | the controls of a change row keep Open in Merge Editor and Mark Resolved on a conflicted row | pass | pass |
| `change-rows.test.ts` | the head of a change group carries a badge reading the number of its paths and an Open Changes control | FAIL: AssertionError: expected 'data-changes="staged"><!--[0--><!--[-…' to match /class="count[^"]*\bbadge\b[^"]*"…/span> | pass |
| `change-rows.test.ts` | the head of a change group offers Open Changes then Unstage All on the staged group | FAIL: AssertionError: expected [ 'Unstage All Changes' ] to deeply equal [ 'Open Changes', …(1) ] | pass |
| `change-rows.test.ts` | the head of a change group offers Open Changes, then Discard All and Stage All on the changed group | FAIL: AssertionError: expected [ 'Discard All Changes', …(1) ] to deeply equal [ 'Open Changes', …(2) ] | pass |
| `change-rows.test.ts` | the head of a change group offers Stage All and no Open Changes on the untracked group | pass | pass |
| `change-rows.test.ts` | the head of a change group draws the actions of a group with the icons of the same actions on a row | FAIL: AssertionError: expected 'expand' to be 'stage' // Object.is equality | pass |
| `change-rows.test.ts` | the head of a change group opens the diff pane over the paths of the staged group and then of the changed group | FAIL: AssertionError: expected [] to have a length of 2 but got +0 | pass |
| `change-rows.test.ts` | the heads that count draw the count of the Changes section and of every ref section as a badge | FAIL: AssertionError: expected 'data-group="changes"><div class="sect…' to match /class="count[^"]*\bbadge\b/ | pass |
| `commit-box.test.ts` | the message field says the chord and the branch it commits on | FAIL: AssertionError: expected '' to be 'Message (Ctrl+Enter to commit on "mai…' // Object.is equality | pass |
| `commit-box.test.ts` | the message field says the chord alone when no branch is checked out | FAIL: AssertionError: expected '' to be 'Message (Ctrl+Enter to commit)' // Object.is equality | pass |
| `commit-box.test.ts` | the message field draws a branch name with markup characters in it as text | FAIL: AssertionError: expected '' to be 'Message (Ctrl+Enter to commit on "fea…' // Object.is equality | pass |
| `commit-box.test.ts` | the message field carries the line count of the message as its rows, one for an empty field | FAIL: AssertionError: expected '3' to be '1' // Object.is equality | pass |
| `commit-box.test.ts` | the message field holds Suggest inside the box, as an icon button, between the field and the action button | FAIL: AssertionError: expected { label: 'suggest', …(4) } to match object { bare: true, compact: true, …(1) } | pass |
| `commit-box.test.ts` | the action button in each of its states is Commit with a check while anything is staged, with the dropdown of the other ways | FAIL: AssertionError: expected undefined to match object { label: 'commit', …(3) } | pass |
| `commit-box.test.ts` | the action button in each of its states is Commit disabled with the reason as its hover words where Commit is disabled | FAIL: AssertionError: expected undefined to match object { disabled: true, …(1) } | pass |
| `commit-box.test.ts` | the action button in each of its states draws neither muted sentence as a line, the reasons being the button hover words | FAIL: AssertionError: expected '<!--[--><div class="commit svelte-12s…' not to contain 'class="none' | pass |
| `commit-box.test.ts` | the action button in each of its states is the disabled Commit with nothing to commit and nothing to sync, saying why | FAIL: AssertionError: expected undefined to match object { label: 'commit', …(2) } | pass |
| `commit-box.test.ts` | the action button in each of its states is Sync Changes with the behind and ahead counts when the branch is ahead of its upstream | FAIL: AssertionError: expected undefined to match object { label: undefined, glyph: 'sync' } | pass |
| `commit-box.test.ts` | the action button in each of its states asks the Sync question first and runs the store call on a yes only | FAIL: AssertionError: expected undefined to be 'Sync main with origin/main?' // Object.is equality | pass |
| `commit-box.test.ts` | the action button in each of its states is Publish Branch with a cloud when there is nothing to commit and the branch has no upstream | FAIL: AssertionError: expected undefined to match object { label: 'Publish Branch', …(1) } | pass |
| `commit-box.test.ts` | the action button in each of its states asks the Publish question for the first remote | FAIL: AssertionError: expected undefined to be 'Publish main to origin?' // Object.is equality | pass |
| `commit-box.test.ts` | the action button in each of its states is disabled with the busy words in the sync and publish states while a write runs | FAIL: AssertionError: expected undefined to match object { disabled: true, title: 'Working' } | pass |
| `commit-box.test.ts` | the message field under body.rice audits that draws the terminal form of a text area: a line at its left, no radius, no fill | FAIL: AssertionError: expected '' to contain 'border-left: 1px solid var(--line)' | pass |
| `commit-box.test.ts` | the message field under body.rice audits that leaves the mono font of the terminal form to the text area, whose bare rule keeps it | pass | pass |
| `commit-box.test.ts` | the message field under body.rice audits that draws it by the rules scope and never by a forced override | pass | pass |
| `diff-pane.test.ts` | the bar of the diff pane over a file of its own holds Open File, Previous Change, Next Change, Collapse Unchanged Regions and then the menu | FAIL (narrow copy): AssertionError: expected [ 'Previous Change', …(2) ] to deeply equal [ Array(5) ] | pass |
| `diff-pane.test.ts` | the bar of the diff pane over a file of its own draws each control as a bare icon button with the icon of its action | FAIL (narrow copy): AssertionError: expected { label: 'Open File', …(3) } to match object { Object (glyph, bare, ...) } | pass |
| `diff-pane.test.ts` | the bar of the diff pane over a file of its own draws Collapse Unchanged Regions pressed at the start and not pressed once shown | FAIL (narrow copy): AssertionError: expected undefined to match object { pressed: true } | pass |
| `diff-pane.test.ts` | the bar of the diff pane over a file of its own holds Inline View as an item that is checked in inline mode and not otherwise, then Refresh | FAIL (narrow copy): TypeError: Cannot read properties of undefined (reading 'items') | pass |
| `diff-pane.test.ts` | the bar of the diff pane over a file of its own disables Refresh while a read of the diff is in flight, and offers it otherwise | FAIL (narrow copy): TypeError: component is not a function | pass |
| `diff-pane.test.ts` | the bar of the diff pane over a file of its own audits that the pane sets reading when a read starts and clears it when the read ends | FAIL (narrow copy): AssertionError: expected '<script module lang="ts">\n    // Lay…' to contain '{reading}' | pass |
| `diff-pane.test.ts` | the bar of the diff pane over a file of its own keeps the side by side and inline buttons and the re-read button out of the bar | FAIL (narrow copy): AssertionError: expected '<!--[--><section class="pane svelte-b…' not to contain 'aria-label="Side by Side"' | pass |
| `diff-pane.test.ts` | the bar of the diff pane over a file of its own draws no Open File over the diff of a commit | pass (narrow copy) | pass |
| `diff-pane.test.ts` | the header of a file of a diff draws one row holding the name and, muted after it, the folder | FAIL (narrow copy): AssertionError: expected '<!--[--><section class="file svelte-c…' to contain 'data-file-header="src/lib/a.ts"' | pass |
| `diff-pane.test.ts` | the header of a file of a diff draws the icon of its file before the name | FAIL (narrow copy): AssertionError: expected '>' to contain 'data-file-icon="typescript"' | pass |
| `diff-pane.test.ts` | the header of a file of a diff carries a chevron that folds the file, with its state, then Open File, in that order | FAIL (narrow copy): AssertionError: expected [] to deeply equal [ 'chevron', 'open_file' ] | pass |
| `diff-pane.test.ts` | the header of a file of a diff says the file is folded on its chevron when it is | FAIL (narrow copy): AssertionError: expected undefined to match object { expanded: false, title: undefined } | pass |
| `diff-pane.test.ts` | the header of a file of a diff presses the chevron through to the pane, which keeps the file folded | FAIL (narrow copy): TypeError: Cannot read properties of undefined (reading 'onclick') | pass |
| `diff-pane.test.ts` | the header of a file of a diff draws a one-file diff nothing may act on with its header and no chevron | FAIL (narrow copy): AssertionError: expected '<!--[--><section class="file svelte-c…' to contain 'data-file-header=' | pass |
| `diff-pane.test.ts` | the header of a file of a diff carries the letter R and the old path for a rename | FAIL (narrow copy): AssertionError: expected '>' to contain '>R<' | pass |
| `diff-pane.test.ts` | the header of a file of a diff carries the letter R and the old path of a rename the git state lists, for a file read alone | FAIL (narrow copy): AssertionError: expected '>' to contain '>R<' | pass |
| `diff-pane.test.ts` | the header of a file of a diff leaves out Open File for a deleted file of a diff whose files are on disk | FAIL (narrow copy): AssertionError: expected [] to deeply equal [ 'chevron' ] | pass |
| `diff-pane.test.ts` | the header of a file of a diff leaves out Open File for a diff that has no file on disk | FAIL (narrow copy): AssertionError: expected [] to deeply equal [ 'chevron' ] | pass |
| `diff-pane.test.ts` | the header of a file of a diff audits that stays at the top of the pane on the panel, and on the same surface as the pane under body.wall | FAIL (narrow copy): ENOENT: no such file or directory, open 'src/lib/views/sources/repositories/diff/FileHeader.svelte' | pass |
| `diff-pane.test.ts` | a section whose file is folded leaves its header and removes its editor | FAIL (narrow copy): AssertionError: expected '<!--[--><section class="file svelte-c…' not to contain 'class="editor' | pass |
| `diff-pane.test.ts` | a section whose file is folded folds a binary file over its sentence | FAIL (narrow copy): AssertionError: expected '<!--[--><section class="file svelte-c…' not to contain 'Binary file, no lines to show.' | pass |
| `diff-pane.test.ts` | a section whose file is folded draws no header row for a one-file diff that is not headed | pass (narrow copy) | pass |
| `diff-pane.test.ts` | a section asked to reveal a change before its editor is back audits that asks the pure rule when a reveal comes and keeps what it returns | FAIL (narrow copy): AssertionError: expected 'export function reveal(hunk: number):…' to contain 'revealAsked(' | pass |
| `diff-pane.test.ts` | a section asked to reveal a change before its editor is back audits that performs the kept reveal when its editor reports its changes | FAIL (narrow copy): AssertionError: expected 'function changed(next: LineChange[]):…' to contain 'revealDue(pending)' | pass |
| `diff-pane.test.ts` | the header row of a file in isolation draws a name and no folder for a file at the root | FAIL (narrow copy): Cannot find module '/src/lib/views/sources/repositories/diff/FileHeader.svelte' imported from /Users/axelfaes/workspa... | pass |
| `diff-pane.test.ts` | the header row of a file in isolation audits that the class the chevron carries when the file is open is no other rule's | FAIL (narrow copy): ENOENT: no such file or directory, open 'src/lib/views/sources/repositories/diff/FileHeader.svelte' | pass |
| `graph-row.test.ts` | a commit row draws one pill per ref and tag, the local branch first on the accent tint | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | a commit row draws the subject and then the author, and neither the short hash nor the time | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | a commit row puts the hash, the author, the date and the time in the hover words | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | a commit row draws the pills at the right of the row, before the row actions | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | a commit row cuts the name of a pill and keeps it whole in its hover words | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | a commit row is strong, with the circle of HEAD, when it is the commit HEAD points at | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | a commit row draws the circle of a merge when it is one and not HEAD | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the rules of a commit row audits that draws a pill 10px round, on an 18px line of the button size, at the text scale | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the rules of a commit row audits that draws a pill in the interface font with tabular figures | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the rules of a commit row audits that draws the author at 0.9 of the row size, opacity 0.7 and half an em from the subject | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the rules of a commit row audits that puts the accent tint on the local branch pill and the panel on the others | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the lanes of a row draw a viewBox of 22 rows high and 11 * (lanes + 1) wide, at the height of a row | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the lanes of a row draw the verticals of the lanes that pass beside the files of an open commit, 3px on the open lane | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the lanes of a row audits that draw a line 1px with round caps and a 2px ring in the colour of the row | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the ring of a circle audits that a row gives --row-bg its panel at rest, its chip under the pointer, its accent tint selected | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the ring of a circle audits that the lanes of a commit row sit in an element that sets the row's --row-bg at rest and under the pointer | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the ring of a circle audits that the element holding the lanes of a commit row paints the pointer's background under them | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the ring of a circle audits that the TreeItem of a commit row is given no selected state, so the accent tint has no row here | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the ring of a circle audits that the lanes of the Incoming and Outgoing rows sit in an element that sets the row's --row-bg at rest and under the pointer | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the ring of a circle audits that the element holding the lanes of the Incoming and Outgoing rows paints the pointer's background under them | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the ring of a circle audits that the TreeItem of the Incoming and Outgoing rows is given no selected state, so the accent tint has no row here | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the Incoming, Outgoing and Load More rows draw Incoming with a dashed circle in lane 0 in place of its glyph, and its count | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the Incoming, Outgoing and Load More rows draw Outgoing the same way | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the Incoming, Outgoing and Load More rows draw Load More as one centred row with no glyph, in the link colour | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the Incoming, Outgoing and Load More rows press through to the caller when Load More is pressed | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the actions on the Graph head are drawn while the section is open and not while it is closed | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the actions on the Graph head are Go to Current, Fetch, Pull and Push for a branch that has an upstream | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the actions on the Graph head are Go to Current, Fetch and Publish for a branch that has none and a remote to publish to | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the actions on the Graph head draw no Go to Current for a repository with no commit | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the actions on the Graph head draw the icons of the same actions elsewhere | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the actions on the Graph head ask what the menu asks before a pull and a push, and fetch at once | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the actions on the Graph head are disabled with the busy words while a write runs, Go to Current apart | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the commits under Outgoing and Incoming draw the lanes and the circle of each of the two commits under Outgoing | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the commits under Outgoing and Incoming draw the lanes and the circle of each of the two commits under Incoming | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `graph-row.test.ts` | the commits under Outgoing and Incoming lay the lanes of each list out over that list alone | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' imported from /Users/axelfaes/workspa... | pass |
| `repo-row.test.ts` | the Branch control of a repository row reads the branch, and carries the whole name as its hover words | FAIL (narrow copy): AssertionError: expected undefined to match object { label: 'main', title: 'main', …(1) } | pass |
| `repo-row.test.ts` | the Branch control of a repository row says detached in the words of the Changes panel for a detached HEAD | FAIL (narrow copy): AssertionError: expected undefined to match object { label: 'detached' } | pass |
| `repo-row.test.ts` | the Branch control of a repository row cuts a branch name longer than the row and keeps it whole in the hover words | FAIL (narrow copy): AssertionError: expected undefined to match object { cut: true, …(2) } | pass |
| `repo-row.test.ts` | the Branch control of a repository row audits that the row gives its controls way before the name and cuts the branch name | FAIL (narrow copy): ENOENT: no such file or directory, open 'src/lib/ui/tree/TreeActions.svelte' | pass |
| `repo-row.test.ts` | the Branch control of a repository row audits that puts 4px on the left of each control of the row and a 16px line in it | FAIL (narrow copy): ENOENT: no such file or directory, open 'src/lib/ui/tree/TreeActions.svelte' | pass |
| `repo-row.test.ts` | the Branch control of a repository row shows the repository of a row that is not the shown one, then asks it to open its Branches section | FAIL (narrow copy): AssertionError: expected undefined to be type of 'function' | pass |
| `repo-row.test.ts` | the Branch control of a repository row asks the shown repository to open its Branches section from its own row | FAIL (narrow copy): AssertionError: expected undefined to be type of 'function' | pass |
| `repo-row.test.ts` | the Branch control of a repository row keeps the open commit of the graph when the row is the shown repository | FAIL (narrow copy): AssertionError: expected undefined to be type of 'function' | pass |
| `repo-row.test.ts` | the Branch control of a repository row drops the folder ids that name a folder in no group when it writes the closed list | FAIL (narrow copy): TypeError: folderId is not a function | pass |
| `repo-row.test.ts` | the Branch control of a repository row drops the folder ids of a commit that is not the open one when it writes the closed list | FAIL (narrow copy): TypeError: folderId is not a function | pass |
| `repo-row.test.ts` | the Sync control of a repository row reads the behind count and then the ahead count, each with its arrow | FAIL (narrow copy): AssertionError: expected undefined to be defined | pass |
| `repo-row.test.ts` | the Sync control of a repository row holds no number and says in step when the branch is neither ahead nor behind | FAIL (narrow copy): AssertionError: expected undefined to match object { title: 'in step with the upstream' } | pass |
| `repo-row.test.ts` | the Sync control of a repository row names the distance in the hover words of the branch line | FAIL (narrow copy): AssertionError: expected undefined to match object { title: '1 ahead \| 2 behind' } | pass |
| `repo-row.test.ts` | the Sync control of a repository row is Publish Branch for a branch with no upstream and a remote to publish to | FAIL (narrow copy): AssertionError: expected undefined to match object { title: 'Publish Branch' } | pass |
| `repo-row.test.ts` | the Sync control of a repository row is not drawn with no upstream and no remote, with an upstream not answered, or on a detached HEAD | pass (narrow copy) | pass |
| `repo-row.test.ts` | the Sync control of a repository row is not drawn for an upstream the state names but the listing has not | pass (narrow copy) | pass |
| `repo-row.test.ts` | the Sync control of a repository row is drawn for neither a root that is no repository nor one whose read failed | pass (narrow copy) | pass |
| `repo-row.test.ts` | the Sync control of a repository row asks the Sync question first, and runs the same store call on a yes only | FAIL (narrow copy): AssertionError: expected undefined to be 'Sync main with origin/main?' // Object.is equality | pass |
| `repo-row.test.ts` | the Sync control of a repository row calls nothing when the answer is no | FAIL (narrow copy): AssertionError: expected null not to be null | pass |
| `repo-row.test.ts` | the Sync control of a repository row asks the Publish Branch question for the first remote | FAIL (narrow copy): AssertionError: expected undefined to be 'Publish main to origin?' // Object.is equality | pass |
| `repo-row.test.ts` | the Sync control of a repository row is disabled with the busy words while a write runs on the repository | FAIL (narrow copy): AssertionError: expected undefined to match object { disabled: true, title: 'Working' } | pass |
| `repo-row.test.ts` | the row of a repository carries the change count as a badge with the words of the count as its hover words | FAIL (narrow copy): AssertionError: expected { label: 'hub', id: 'repo:/hub', …(9) } to match object { count: 3, badge: true, …(1) } | pass |
| `repo-row.test.ts` | the row of a repository draws the ... menu of the row for a readable repository and for no other | FAIL (narrow copy): AssertionError: expected '"/hub"><!--[--><!--[--><!--[--><!--[0…' to contain 'aria-label="Row actions"' | pass |
| `repo-row.test.ts` | the row of a repository keeps the path of the root as its hover words | pass (narrow copy) | pass |
| `repo-row.test.ts` | the row of a repository draws the name at weight 400 and shows its controls always | FAIL (narrow copy): AssertionError: expected { label: 'hub', id: 'repo:/hub', …(9) } to match object { showActions: true, yielding: true } | pass |
| `repo-row.test.ts` | the row of a repository draws the words of a root that is gone, no repository or unread as they were, in a class of their own | FAIL (narrow copy): AssertionError: expected 'data-repo-row="/hub"><!--[--><!--[-->…' to contain 'class="shape' | pass |
| `repo-row.test.ts` | the repository below its row draws neither the branch line nor the path line for a readable repository | FAIL (narrow copy): AssertionError: expected '<!--[--><section class="pane svelte-b…' not to contain 'class="branch' | pass |
| `repo-row.test.ts` | the repository below its row keeps the branch line and the path above the state row of a repository whose read failed | pass (narrow copy) | pass |
| `tree-mode.test.ts` | the toggle between the list and the tree is View as Tree with its icon in list mode, which is where the view starts | FAIL (narrow copy): AssertionError: expected undefined to match object { Object (label, glyph) } | pass |
| `tree-mode.test.ts` | the toggle between the list and the tree is drawn for a state with no repository to draw as well, since the mode is the view's | FAIL (narrow copy): AssertionError: expected undefined to match object { label: undefined } | pass |
| `tree-mode.test.ts` | the toggle between the list and the tree is View as List with the list icon in tree mode | FAIL (narrow copy): AssertionError: expected undefined to match object { label: undefined, glyph: 'list' } | pass |
| `tree-mode.test.ts` | the toggle between the list and the tree writes tree into the instance state when pressed in list mode, and list when pressed again | FAIL (narrow copy): AssertionError: expected undefined to be type of 'function' | pass |
| `tree-mode.test.ts` | the toggle between the list and the tree is drawn before the menu of More Actions in the bar | FAIL (narrow copy): AssertionError: expected -1 to be greater than -1 | pass |
| `tree-mode.test.ts` | the groups in tree mode draw no folder row in list mode | pass (narrow copy) | pass |
| `tree-mode.test.ts` | the groups in tree mode draw a folder row for the folder of two paths, its files under it and the root files beside it | FAIL (narrow copy): AssertionError: expected 'data-group="changes"><div class="sect…' to contain 'data-folder="src"' | pass |
| `tree-mode.test.ts` | the groups in tree mode draw a file row with no folder after its name | FAIL (narrow copy): AssertionError: expected 'data-entry="src/a.ts"><!--[0--><!--[-…' not to contain 'class="folder' | pass |
| `tree-mode.test.ts` | the groups in tree mode draw the merge group as a list | pass (narrow copy) | pass |
| `tree-mode.test.ts` | the groups in tree mode draw no row inside a folder the instance keeps closed | FAIL (narrow copy): TypeError: folderId is not a function | pass |
| `tree-mode.test.ts` | the groups in tree mode keep the folder of another repository open when this repository closed the same folder | FAIL (narrow copy): TypeError: folderId is not a function | pass |
| `tree-mode.test.ts` | an untracked folder that git lists as a whole is one row named for the folder in the tree, with no row inside it | FAIL (narrow copy): AssertionError: expected { label: 'newdir', …(11) } to match object { label: 'newdir', glyph: 'folder' } | pass |
| `tree-mode.test.ts` | an untracked folder that git lists as a whole is named for the folder in the list too, with its parent folder said after the name | FAIL (narrow copy): AssertionError: expected { label: 'newdir', …(11) } to match object { label: 'newdir', glyph: 'folder' } | pass |
| `tree-mode.test.ts` | the controls of a folder row call stagePaths once with exactly the paths under a changed folder | FAIL (narrow copy): AssertionError: expected [] to deeply equal [ [ '/hub', …(1) ] ] | pass |
| `tree-mode.test.ts` | the controls of a folder row call unstagePaths once with exactly the paths under a staged folder | FAIL (narrow copy): AssertionError: expected [] to deeply equal [ [ '/hub', …(1) ] ] | pass |
| `tree-mode.test.ts` | the controls of a folder row ask first when a folder is discarded, naming how many paths, and call discardPaths once on a yes | FAIL (narrow copy): TypeError: Cannot read properties of undefined (reading 'replace') | pass |
| `tree-mode.test.ts` | the controls of a folder row carry Stage and no Discard on an untracked folder | FAIL (narrow copy): AssertionError: expected [ { …(6) }, …(14) ] to have a length of 2 but got 15 | pass |
| `tree-mode.test.ts` | the controls of a folder row are disabled with the busy words while a write runs on the repository | FAIL (narrow copy): AssertionError: expected { label: 'Unstage All Changes', …(5) } to match object { disabled: true, title: 'Working' } | pass |
| `tree-mode.test.ts` | the closed folders the instance keeps drop the id of a folder that is in none of the groups when the next closed section is written | FAIL (narrow copy): TypeError: folderId is not a function | pass |
| `tree-mode.test.ts` | a folder that closes over the row that holds the focus takes the focus itself | FAIL (narrow copy): TypeError: component is not a function | pass |
| `tree-mode.test.ts` | a folder that closes over the row that holds the focus leaves the focus alone when the focused row is elsewhere | FAIL (narrow copy): TypeError: component is not a function | pass |
| `tree-mode.test.ts` | a folder that closes over the row that holds the focus leaves the focus alone when the folder opens | FAIL (narrow copy): TypeError: folderId is not a function | pass |
| `tree-mode.test.ts` | a folder of a graph commit that closes over the row that holds the focus takes the focus itself | FAIL (narrow copy): AssertionError: expected '<!--[--><!--[1--><li role="none"><div…' to contain 'data-commit-file' | pass |
| `tree-mode.test.ts` | a folder of a graph commit that closes over the row that holds the focus leaves the focus alone when the focused row is elsewhere | FAIL (narrow copy): AssertionError: expected '<!--[--><!--[1--><li role="none"><div…' to contain 'data-commit-file' | pass |
| `tree-mode.test.ts` | a folder of a graph commit that closes over the row that holds the focus leaves the focus alone when the folder opens | FAIL (narrow copy): TypeError: folderId is not a function | pass |
| `tree-mode.test.ts` | the icon of a file of a graph commit is drawn before the name of a file row and on no folder row | FAIL (narrow copy): AssertionError: expected [] to have a length of 3 but got +0 | pass |
| `tree-mode.test.ts` | the folder of a file of a graph commit is said after the name in the list, and a file at the root says none | FAIL (narrow copy): AssertionError: expected [] to deeply equal [ 'src/lib', '' ] | pass |
| `tree-mode.test.ts` | the folder of a file of a graph commit is not said after the name in the tree | pass (narrow copy) | pass |
| `tree-mode.test.ts` | a commit drawn in two lists gives the rows and the folders of each list ids of their own | FAIL (narrow copy): AssertionError: expected '<!--[--><!--[1--><li role="none"><div…' to contain 'data-commit-file' | pass |
| `type-scale.test.ts` | the view type scale lists every view file in the audit | FAIL: AssertionError: expected [ …(186) ] to deeply equal [ …(192) ] | pass |
| `type-scale.test.ts` | the view type scale audits every local role in the section of Settings that resets the pages | pass | pass |
| `type-scale.test.ts` | the view type scale audits that every ui component is listed in the pass-through audit | FAIL: AssertionError: expected [ …(52) ] to deeply equal [ …(54) ] | pass |
| `type-scale.test.ts` | the view type scale sets every local role in boards/collection/Collection.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in system/config/Config.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/data/Data.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in boards/deposit/Deposit.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/doc/Doc.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/document/Document.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/file/File.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/files/Files.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/note/Note.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/files/sections/BookmarkForm.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/files/sections/Bookmarks.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/files/tree/Controls.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/files/tree/Failed.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/files/tree/Follow.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/files/sections/Notes.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/files/sections/RootForm.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/files/sections/Sections.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/files/sections/Section.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/files/tree/ShowPath.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/files/tree/Tree.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/files/sections/Workspaces.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in structure/domains/Domains.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in boards/editor/Editor.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in system/audit/Audit.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in system/findings/Findings.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in boards/focus/Focus.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in system/gallery/Gallery.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in system/help/Diagram.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in system/help/Help.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in system/history/History.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in personal/calendar/Calendar.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/accounts/AccountList.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/accounts/ConnectorHead.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in system/hpc/Hpc.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in system/usage/Usage.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in feeds/inbox/Inbox.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in feeds/leads/Leads.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in feeds/linkedin/Linkedin.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in structure/map/Map.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in personal/memories/Memories.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in boards/person/Person.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in academic/present/Present.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in structure/pillars/Pillars.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in boards/project/Project.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in boards/projects/Projects.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in feeds/radar/Radar.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/repositories/Repositories.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/search/Search.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/search/Query.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/search/Results.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in academic/slides/Slides.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/source/Source.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in system/status/Status.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in system/workbench/Appearance.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in system/workbench/Catalogue.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in system/workbench/Pages.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in system/workbench/RailEditor.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in system/workbench/Settings.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/venues/Venues.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in boards/collection/Coverage.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in boards/collection/Software.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in boards/collection/EntryCard.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/data/DatasetCard.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/data/Facets.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in structure/domains/DomainCard.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in boards/focus/Band.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in boards/focus/CareerPanel.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in boards/focus/CommandCenter.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in boards/focus/CommandCenterView.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in boards/focus/lanes/Lanes.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in boards/focus/lanes/LaneCard.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in boards/focus/lanes/LaneHead.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in boards/focus/QuickAdd.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in boards/focus/Tasks.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in system/hpc/Capacity.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in system/hpc/Head.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in system/hpc/Jobs.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in system/hpc/Log.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in system/hpc/Quota.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in system/hpc/Recent.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/accounts/AddAccount.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/accounts/NoAccounts.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/accounts/RemoveAccount.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in personal/account-setup/AccountSetup.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in personal/account-setup/CopyValue.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in personal/account-setup/GoogleSteps.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in personal/account-setup/HalfForm.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in personal/account-setup/MicrosoftSteps.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in feeds/inbox/InboxCard.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in feeds/leads/LeadCard.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in feeds/linkedin/PostCard.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in structure/map/Controls.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in structure/map/Graph.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in academic/present/parts/Closing.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in academic/present/parts/Dot.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in academic/present/parts/Equation.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in academic/present/parts/Framing.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in academic/present/parts/Ideas.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in academic/present/parts/Legend.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in academic/present/Overview.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in academic/present/Panel.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in academic/present/parts/Project.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in academic/present/Slide.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in academic/present/parts/Summary.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in academic/present/parts/Title.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in academic/present/parts/Words.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in structure/pillars/ArchivalCard.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in structure/pillars/LineCard.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in structure/pillars/OrphansCard.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in boards/project/Latex.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in boards/projects/NewIdea.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in boards/projects/Stats.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in feeds/radar/Bucket.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in feeds/radar/RadarCard.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in feeds/radar/RadarIntro.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/repositories/changes/Changes.svelte | FAIL: ENOENT: no such file or directory, open 'src/lib/views/sources/repositories/changes/Changes.svelte' | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/repositories/changes/ChangeRow.svelte | FAIL: ENOENT: no such file or directory, open 'src/lib/views/sources/repositories/changes/ChangeRow.svelte' | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/repositories/changes/FolderRow.svelte | FAIL: ENOENT: no such file or directory, open 'src/lib/views/sources/repositories/changes/FolderRow.svelte' | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/repositories/Repo.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/repositories/Worktrees.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sessions/agents/Agents.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sessions/changes/Changes.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sessions/changes/ChangesRepo.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sessions/changes/ChangesTouched.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sessions/session-detail/SessionDetail.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sessions/session-list/SessionList.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sessions/session-list/SessionWorkspace.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sessions/session-list/Customizations.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sessions/customization/CustomizationView.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sessions/terminal/Terminal.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sessions/terminal/grid/TerminalGrid.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sessions/terminal/grid/FindBar.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sessions/terminal/RenameField.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sessions/terminal/AttachPicker.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sessions/terminal/Composer.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sessions/terminal/TerminalList.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sessions/terminal/TerminalTitle.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sessions/session-list/TerminalRows.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sessions/timeline/Timeline.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sessions/transcript/Transcript.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/code/Code.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/changes/ChangeCounts.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/changes/ChangeGroups.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/links/BookmarkStar.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/card/Clamp.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/links/CrossLinks.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/card/CardActions.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/card/CardDetails.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/card/CardDocs.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/card/CardLinks.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/card/CardSessions.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/sessions/PickSession.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/sessions/SessionPicker.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/sessions/SteerBox.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/sessions/WorkspacePicker.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/forms/EntryForm.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/prose/Intro.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/prose/Markdown.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/forms/NewIdeaForm.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/card/ProjectCard.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/links/ProgramButton.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/card/Reveal.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/links/SourceButton.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/links/SourceToolbar.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/forms/RegistryHead.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/forms/Subtasks.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/source/Editor.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/source/Preview.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in system/status/Hooks.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in system/status/LineCounts.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/venues/Facets.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/venues/Ribbon.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/venues/VenueCard.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/AskConfirm.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in shared/changes/CommitBox.svelte | FAIL: AssertionError: expected '.none=fs-xs' to be '' // Object.is equality | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/repositories/RepoList.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/repositories/diff/DiffBar.svelte | FAIL: ENOENT: no such file or directory, open 'src/lib/views/sources/repositories/diff/DiffBar.svelte' | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/repositories/diff/Diff.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/repositories/diff/DiffSection.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/repositories/diff/FileHeader.svelte | FAIL: ENOENT: no such file or directory, open 'src/lib/views/sources/repositories/diff/FileHeader.svelte' | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/repositories/graph/CommitFiles.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/repositories/graph/CommitRow.svelte | FAIL: ENOENT: no such file or directory, open 'src/lib/views/sources/repositories/graph/CommitRow.svelte' | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/repositories/graph/GraphHead.svelte | FAIL: ENOENT: no such file or directory, open 'src/lib/views/sources/repositories/graph/GraphHead.svelte' | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/repositories/graph/Graph.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/repositories/graph/Lanes.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/repositories/merge/Merge.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/repositories/merge/MergeSide.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/repositories/refs/Branches.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/repositories/refs/Stashes.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/repositories/refs/Tags.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every local role in sources/source/Gutter.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/frame/Card.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/controls/Chip.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/controls/CloseQuestion.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/tree/Disclosure.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/views/shared/prose/Intro.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/display/Table.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/frame/Pane.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/display/Meter.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/frame/Toolbar.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/controls/ToolButton.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/frame/Empty.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/tabs/Tabs.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/tabs/TabFace.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/menu/ContextMenu.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/menu/Menu.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/menu/MenuList.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/menu/MenuOpener.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/controls/Confirm.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/display/CodeText.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/display/Glyph.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/display/FileIcon.svelte | FAIL: ENOENT: no such file or directory, open 'src/lib/ui/display/FileIcon.svelte' | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/controls/RowButton.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/controls/text/Search.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/controls/text/TextBoxMenu.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/controls/Segment.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/controls/Tag.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/controls/editor/DiffEditor.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/controls/editor/Editor.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/controls/editor/LineBars.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/display/Ticker.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/forms/Checkbox.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/forms/DateInput.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/forms/Field.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/forms/FileChooser.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/forms/choice/GlyphDialog.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/forms/choice/GlyphList.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/forms/choice/GlyphSelect.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/forms/choice/MultiSelect.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/forms/choice/Select.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/forms/Prompt.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/forms/TextArea.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/forms/TextInput.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/frame/FloatingList.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/frame/FloatingBar.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/frame/Modal.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/frame/Sash.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/menu/keys/KeySheet.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/menu/Tooltip.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/menu/TooltipGroup.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/tabs/Breadcrumb.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/tree/TreeActions.svelte | FAIL: ENOENT: no such file or directory, open 'src/lib/ui/tree/TreeActions.svelte' | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/tree/TreeItem.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/tree/TreeSection.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/tree/TreeView.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/ui/tree/VirtualRows.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/shell/rail/ActivityRail.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/shell/rail/RailFoot.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/shell/rail/RailPages.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/shell/status/StatusBar.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/shell/status/RepoItems.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/shell/status/SourceItems.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/shell/status/Bell.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/shell/status/NoticeCentre.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/shell/status/NoticeEntry.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/shell/status/Toast.svelte | pass | pass |
| `type-scale.test.ts` | the view type scale sets every pass-through role in src/lib/shell/Workbench.svelte | pass | pass |
| `diff-view.test.ts` | the keys of a diff keys a path git lists twice, as a type change is, by its place among its entries | pass | pass |
| `diff-view.test.ts` | the view states kept writes the view states said in one pause as one write | FAIL: AssertionError: expected [ { mode: 'inline', views: { …(2) } } ] to deeply equal [ { mode: 'inline', …(3) } ] | pass |
| `diff-view.test.ts` | the view states kept writes nothing once the tab has closed, whatever was pending or is said after | pass | pass |
| `diff-view.test.ts` | the view states kept keeps the last view states of a pane torn down while its tab stays open | FAIL: AssertionError: expected { Object (mode, views) } to deeply equal { mode: 'side', …(3) } | pass |
| `diff-view.test.ts` | what one diff pane is over names the file and the side, so two sides of one path are two panes | pass | pass |
| `diff-view.test.ts` | what one diff pane is over reads a file from the diff address and a worktree from its own | pass | pass |
| `diff-view.test.ts` | the state a diff pane holds reads each field of an instance state, and an empty pane from one it cannot read | FAIL: TypeError: (0 , __vite_ssr_import_1__.heldDiff) is not a function | pass |
