# Q88c report

**NOT done, stated first.**

1. `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` was not made to print `checks: 7 commands passed` in one invocation. Its one run (the third full-list run) passed `npm test` (458 files passed, 11738 tests passed) and stopped at `npm run test:checks` on `tests/server/core/git/git.test.ts` being 901 lines. That file is now 899 lines, and I then ran the other commands of the verify list one by one, each green (outputs below); a fourth checks.sh run would be a fourth full-list run, past the cap of three, so the orchestrator's landing run is the one that prints the line.
2. `grep -rn -- "--force" src/lib/server/git` does not print nothing: it prints `src/lib/server/git/deposit-git.ts:257:    return pushCmd(at, ['--force', 'origin', 'HEAD:main']);`, the deposit snapshot push that `tests/server/git/deposit.test.ts:633` holds to one occurrence. No Q88c form carries it; `git-write.ts`, `git-index.ts`, `git-refs.ts`, `git-reads.ts`, `git-routes.ts`, `git-remote.ts` and `git-message.ts` hold none (the line above is the only hit of the directory). The brief's expected output is wrong about this file.
3. The look section below is not verified in a browser. I have no browser; each row says what the tests that render it show.
4. Delete Branch is built with `-d` only, as Z241 below says.

Everything else in the brief is done; the table says how each row is shown.

## Open items

- **Z241 (2026-10-02 07:10, Q88c): Delete Branch on a branch git calls not fully merged.** VS Code runs `git branch -d`, and when git refuses because the branch is not fully merged it asks "The branch '{0}' is not fully merged. Delete anyway?" and runs `git branch -D`. Oculus's `DESIGN.md:128` says "no form carries `--force`", the `git-write.ts` comment on push says "Nothing is ever forced", and `tests/server/git/git-write.test.ts:571-575` asserts no file of `server/git` contains `--force`. `-D` is `--delete --force`, so VS Code's retry meets that rule. Q88c is built with `-d` only: an unmerged branch is refused with git's reason and kept.
  - (a) Keep `-d` only. Pro: the no-force rule stands as written; nothing that holds commits no other branch holds is deleted from a button. Con: VS Code's "Delete anyway?" path is absent; an unmerged branch is deleted at a terminal.
  - (b) Add VS Code's retry: after git's "not fully merged" refusal, VS Code's question, then `git branch -D <name>`, listed in `CONFIRMED`; `DESIGN.md:128` amended to "no form carries `--force` except `branch -D` after its question", and the gate's test keeps refusing the `--force` spelling. Pro: VS Code parity; the commits stay reachable through the reflog for git's expiry period. Con: a rule written for every write gets one exception.
  - Recommendation: (b), since the parity ruling asks for every capability VS Code has, the question stands between the reader and the loss, and the exception is one named form under its own confirmation. It would be added to Q88c in a repair round or at landing, with no new step.

## The cases' first run on the unchanged tree

Command: `npx vitest run $(cat files.txt) --reporter=json`, run before any source change, over the 43 test files of the plan step that exist or were written for it. Result: 34 files failed and 9 passed; 189 tests failed and 557 passed (746). A row marked LOADFAIL is a file that does not load on the unchanged tree because the module or export it imports does not exist; it counts among the 34 failed files. Per file:

```
FAIL tests/routes/page.test.ts failed=3 passed=11
     1x AssertionError: Target cannot be null or undefined.
     1x AssertionError: expected '<script lang="ts">\n    // The page r...' to contain 'from \'$lib/shell/context-guard\
     1x AssertionError: expected '\n        connect([\n            \'po...' to contain 'document.removeEventListener(\'c
LOADFAIL tests/shell/context-guard.test.ts failed=0 passed=0 FILE-ERROR: Cannot find module '../../src/lib/shell/context-guard.ts' imported from tests/shell/context-guard.test.ts
FAIL tests/checks/config/config-folder.test.ts failed=2 passed=24
     1x AssertionError: expected [ 'agents', 'arch_color', ...(95) ] to deeply equal [ 'agents', 'arch_color', ...(97) ]
     1x AssertionError: expected [ 'code_theme', 'crt', ...(4) ] to deeply equal [ 'code_theme', 'crt', ...(6) ]
FAIL tests/routes/git/refs.test.ts failed=12 passed=2
     1x AssertionError: trashUntracked: expected [ Array(33) ] to include 'trashUntracked'
     1x AssertionError: trashUntracked: expected [ 'commit', 'push', 'pull', ...(16) ] to include 'trashUntracked'
     1x AssertionError: expected { Object (error) } to deeply equal { Object (error) }
     5x AssertionError: expected 400 to be 200 // Object.is equality
     1x AssertionError: expected 'b0d51b98415a882942f9bc3cd4ae87fd44641...' to be '758a587139a30cb4291ca9f97f9c76378a5e1
     1x AssertionError: {"action":"createBranch","name":"ok","start":"-x","confirm":true}: expected 200 to be 400 // O
     1x AssertionError: expected { status: 400, ...(1) } to deeply equal { status: 200, ...(1) }
     1x AssertionError: expected undefined to be 'origin/main' // Object.is equality
FAIL tests/routes/git/untracked.test.ts failed=4 passed=4
     1x AssertionError: expected { Object (error) } to deeply equal { Object (error) }
     3x AssertionError: expected 400 to be 200 // Object.is equality
FAIL tests/shell/panes/pane-strip-menu.test.ts failed=9 passed=9
     1x AssertionError: expected [ '@ui.strip_open_file', ...(7) ] to deeply equal [ '@ui.strip_open_file', ...(11) ]
     1x AssertionError: expected [ '@ui.strip_open_file', ...(1) ] to deeply equal [ '@ui.strip_open_file', ...(5) ]
     1x AssertionError: expected [ '@ui.strip_open_file', ...(7) ] to include '@ui.strip_unlock'
     1x AssertionError: expected undefined to deeply equal [ ...(3) ]
     1x AssertionError: expected [ null, 'top', 'bottom', 'left', ...(3) ] to deeply equal [ null, null, 'top', 'bottom'
     1x AssertionError: expected [] to deeply equal [ 'note:p:1', 'lock:p:1:true', ...(6) ]
     1x TypeError: (0 , __vite_ssr_import_1__.newNoteOpener) is not a function
     2x AssertionError: expected [ '@ui.strip_open_file', ...(6) ] to deeply equal [ '@ui.strip_open_file', ...(9) ]
FAIL tests/state/sessions/source.test.ts failed=4 passed=48
     1x TypeError: (0 , __vite_ssr_import_1__.headTabState) is not a function
     2x TypeError: (0 , __vite_ssr_import_1__.loadHeadFile) is not a function
     1x AssertionError: expected { Object (readIn, text, ...) } to match object { text: 'old\n', saved: 'old\n', ...(2) 
PASS tests/state/workbench/rail-badges.test.ts failed=0 passed=103
FAIL tests/ui/menu/menu-words.test.ts failed=2 passed=1
     2x TypeError: t is not a function
LOADFAIL tests/server/core/git/compare.test.ts failed=0 passed=0 FILE-ERROR: Cannot find module '../../../../src/lib/server/core/git/git-compare.ts' imported from tests/server/core/git/compare.test.ts
LOADFAIL tests/server/core/git/git-parse.test.ts failed=0 passed=0 FILE-ERROR: Cannot find module '../../../../src/lib/server/core/git/git-parse.ts' imported from tests/server/core/git/git-parse.test.ts
LOADFAIL tests/server/core/git/git-reads.test.ts failed=0 passed=0 FILE-ERROR: Cannot find module '../../../../src/lib/server/core/git/git.ts' imported from tests/server/core/git/git-reads.test.ts
LOADFAIL tests/server/core/git/git-ssh.test.ts failed=0 passed=0 FILE-ERROR: Cannot find module '../../../../src/lib/server/core/git/git.ts' imported from tests/server/core/git/git-ssh.test.ts
LOADFAIL tests/server/core/git/git.test.ts failed=0 passed=0 FILE-ERROR: Cannot find module '/src/lib/server/core/git/git.ts' imported from tests/server/core/git/git.test.ts
LOADFAIL tests/server/core/git/head.test.ts failed=0 passed=0 FILE-ERROR: Cannot find module '../../../../src/lib/server/core/git/git-compare.ts' imported from tests/server/core/git/head.test.ts
LOADFAIL tests/server/core/git/held.test.ts failed=0 passed=0 FILE-ERROR: Cannot find module '../../../../src/lib/server/core/git/git.ts' imported from tests/server/core/git/held.test.ts
LOADFAIL tests/server/git/refs/cherry-pick.test.ts failed=0 passed=0 FILE-ERROR: Cannot find module '../../../../src/lib/server/core/git/git.ts' imported from tests/server/git/refs/cherry-pick.test.ts
FAIL tests/server/git/refs/delete-branch.test.ts failed=7 passed=0
     7x TypeError: (0 , __vite_ssr_import_2__.deleteBranch) is not a function
FAIL tests/server/git/refs/detached.test.ts failed=11 passed=3
     5x TypeError: (0 , __vite_ssr_import_1__.switchDetached) is not a function
     1x AssertionError: expected '315a64d47a1fe52330c2534a8f2dcbaaafa1b...' to be 'b50ed49565cac469ff87238f695575a6977f9
     2x AssertionError: -x: expected true to be false // Object.is equality
     1x AssertionError: expected true to be false // Object.is equality
     1x AssertionError: expected '29d0428da193e71afe069c3e8bbec8a80328a...' to be '513249ab98b65e6ac8cbad78baef04c594197
     1x AssertionError: expected 'f482b0122e32c6360e74c2327d98e06e77615...' to be '7241a2ef2340ca4f95a29d804a4ecd48269d9
PASS tests/server/git/refs/identity.test.ts failed=0 passed=3
FAIL tests/server/git/untracked/ignore.test.ts failed=12 passed=0
     12x TypeError: (0 , __vite_ssr_import_3__.addToGitignore) is not a function
FAIL tests/server/git/untracked/trash.test.ts failed=12 passed=0
     12x TypeError: (0 , __vite_ssr_import_3__.trashUntracked) is not a function
PASS tests/shell/panes/floats/float-geometry.test.ts failed=0 passed=27
PASS tests/shell/panes/floats/floatlayer.test.ts failed=0 passed=13
FAIL tests/shell/panes/strip/strip-render.test.ts failed=5 passed=3
     1x AssertionError: expected 3 to be 1 // Object.is equality
     1x AssertionError: expected 3 to be +0 // Object.is equality
     1x AssertionError: expected '<!--[--><div class="workbench svelte-...' not to contain 'aria-label="Split tab to the
     2x Error: text key not in the text catalog (config/text/): ui.strip_unlock
LOADFAIL tests/shell/panes/strip/strip-shape.test.ts failed=0 passed=0 FILE-ERROR: Cannot find module '../../../../src/lib/shell/panes/strip/strip-shape.ts' imported from tests/shell/panes/strip/strip-shape.test.ts
FAIL tests/state/shared/words/appearance.test.ts failed=21 passed=121
     13x TypeError: (0 , __vite_ssr_import_3__.showTabs) is not a function
     8x TypeError: (0 , __vite_ssr_import_3__.editorActions) is not a function
FAIL tests/views/sources/repositories/diff-pane.test.ts failed=1 passed=27
     1x AssertionError: expected '<script module lang="ts">\n    // Lay...' to contain 'latestRead('
FAIL tests/views/sources/repositories/repositories.test.ts failed=1 passed=43
     1x AssertionError: expected 1 to be 2 // Object.is equality
FAIL tests/state/sources/repositories/capabilities/repositories-badge.test.ts failed=7 passed=1
     1x AssertionError: expected '' to be '7' // Object.is equality
     3x AssertionError: expected '' to be '2' // Object.is equality
     1x AssertionError: expected '' to be '250' // Object.is equality
     1x AssertionError: expected '' to be '5' // Object.is equality
     1x AssertionError: expected 'Repositories ' to contain '3'
LOADFAIL tests/state/sources/repositories/capabilities/store-actions.test.ts failed=0 passed=0 FILE-ERROR: Cannot find module '../../../../../src/lib/state/sources/repositories/compare.ts' imported from tests/state/sources/repositories/capabilities/store-actions.test.ts
FAIL tests/state/sources/repositories/capabilities/view-state.test.ts failed=10 passed=0
     1x AssertionError: expected undefined to deeply equal []
     2x TypeError: (0 , __vite_ssr_import_1__.visibleRoots) is not a function
     1x TypeError: (0 , __vite_ssr_import_1__.closeRepository) is not a function
     2x TypeError: (0 , __vite_ssr_import_1__.closeOthers) is not a function
     1x TypeError: (0 , __vite_ssr_import_1__.preparedMessage) is not a function
     3x TypeError: (0 , __vite_ssr_import_1__.cutGroups) is not a function
PASS tests/server/root/watch/git/git-events.test.ts failed=0 passed=6
PASS tests/server/root/watch/git/git-workspaces.test.ts failed=0 passed=10
PASS tests/server/root/watch/git/git.test.ts failed=0 passed=23
FAIL tests/server/root/watch/git/scan.test.ts failed=2 passed=2
     2x AssertionError: expected [ ...(2) ] to deeply equal [ ...(3) ]
FAIL tests/state/workbench/layout/open/locked.test.ts failed=24 passed=2
     3x TypeError: (0 , __vite_ssr_import_2__.setLocked) is not a function
     3x AssertionError: expected { kind: 'pane', path: [ 1 ] } to deeply equal { kind: 'pane', path: [ 2 ] }
     1x AssertionError: expected { kind: 'pane', path: [ +0 ] } to deeply equal { kind: 'pane', path: [ 1 ] }
     1x AssertionError: expected { kind: 'pane', path: [ 1 ] } to deeply equal { kind: 'split', path: [ 1 ] }
     1x AssertionError: expected { kind: 'pane', path: [ 1 ] } to deeply equal { kind: 'split', path: [ +0 ] }
     1x TypeError: (0 , __vite_ssr_import_1__.renameInstance) is not a function
     4x AssertionError: expected [] to deeply equal [ '0' ]
     2x AssertionError: expected [ [ 'c' ] ] to deeply equal [ [], [ 'c' ] ]
     1x AssertionError: expected [ [ 'f' ], [] ] to deeply equal [ [ 'f' ], [], [] ]
     1x AssertionError: expected [ undefined, 'terminals' ] to deeply equal [ undefined, 'terminals', 'terminals' ]
     1x AssertionError: expected [ [ 'a', 'c' ] ] to deeply equal [ [], [ 'c', 'a' ] ]
     5x Error: text key not in the text catalog (config/text/): ui.page_default
PASS tests/state/sources/repositories/view/commit-action.test.ts failed=0 passed=11
FAIL tests/state/workbench/layout/saved/layout-locked.test.ts failed=3 passed=2
     1x AssertionError: expected { ...(3) } to deeply equal { ...(3) }
     1x AssertionError: expected { kind: 'pane', tabs: [], active: '' } to deeply equal { kind: 'pane', tabs: [], ...(2)
     1x AssertionError: expected { kind: 'pane', tabs: [], ...(2) } to deeply equal { kind: 'pane', tabs: [], ...(3) }
FAIL tests/views/sources/repositories/changes/change-rows.test.ts failed=3 passed=18
     1x AssertionError: expected [ 'Open File', 'Stage' ] to deeply equal [ 'Open File', 'Discard', 'Stage' ]
     1x AssertionError: expected [ 'Stage All Untracked' ] to deeply equal [ undefined, 'Stage All Untracked' ]
     1x AssertionError: expected undefined to be 'note_back' // Object.is equality
FAIL tests/views/sources/repositories/changes/trash-and-cuts.test.ts failed=9 passed=3
     3x TypeError: Cannot read properties of undefined (reading 'replace')
     1x AssertionError: expected undefined to be 'Too many changes were detected. Only ...' // Object.is equality
     1x AssertionError: expected '<!--[--><!--[-1--><!--]--> <div class...' to include undefined
     1x AssertionError: expected 3 to be 2 // Object.is equality
     1x AssertionError: expected '<!--[--><section class="pane svelte-b...' to contain 'data-root="/other"'
     1x AssertionError: expected '<!--[--><section class="pane svelte-b...' to contain 'aria-label="undefined"'
     1x AssertionError: expected '<!--[--><section class="pane svelte-b...' to include undefined
PASS tests/views/sources/repositories/changes/tree-mode.test.ts failed=0 passed=30
FAIL tests/views/sources/repositories/menus/repositories-menu.test.ts failed=25 passed=7
     1x AssertionError: expected [ ...(5) ] to deeply equal [ ...(7) ]
     1x AssertionError: expected [ ...(3) ] to deeply equal [ ...(4) ]
     1x AssertionError: expected [ false, false, true, false, true ] to deeply equal [ false, false, false, true, ...(3)
     1x AssertionError: expected '@repositories.menu_reveal' to be '@repositories.menu_compare_workspace' // Object.is
     1x AssertionError: expected [ 'openChange:/r,changed,a.ts', ...(3) ] to deeply equal [ 'openChange:/r,changed,a.ts'
     1x AssertionError: expected [] to deeply equal [ Array(1) ]
     1x TypeError: (0 , __vite_ssr_import_1__.askTrash) is not a function
     1x AssertionError: expected [] to deeply equal [ 'ignore:/r,dir/' ]
     1x AssertionError: expected [ '@repositories.menu_stage' ] to deeply equal [ '@repositories.menu_stage', ...(2) ]
     1x AssertionError: expected [ Array(1) ] to deeply equal [ Array(1) ]
     1x AssertionError: expected [ '@git.stage_all_untracked' ] to deeply equal [ '@git.stage_all_untracked', ...(1) ]
     1x AssertionError: expected [ ...(3) ] to deeply equal [ ...(8) ]
     1x AssertionError: expected [] to deeply equal [ '@repositories.menu_compare_with' ]
     1x AssertionError: expected [ ...(3) ] to deeply equal [ ...(6) ]
     1x AssertionError: expected [ { kind: 'open' }, ...(2) ] to deeply equal [ { kind: 'open' }, ...(9) ]
     1x AssertionError: expected 'none' to be 'remote' // Object.is equality
     1x AssertionError: expected { kind: 'checkout', ...(1) } to deeply equal { kind: 'detach-ref', ...(1) }
     1x TypeError: (0 , __vite_ssr_import_2__.askBranchDelete) is not a function
     3x TypeError: t is not a function
     1x AssertionError: expected [ '@repositories.menu_terminal', ...(1) ] to deeply equal [ '@repositories.menu_termina
     3x TypeError: (0 , __vite_ssr_import_3__.closedChoices) is not a function

```

## DONE / NOT DONE

Every row names the command run in this turn; the output is the vitest summary lines it printed.

| # | status | what | command | output |
|---|---|---|---|---|
| 1 | DONE | Server `trashUntracked` (src/lib/server/git/git-index.ts:286) behind the confirm; store action; changed-file menu, folder menu, Untracked head 'Discard All Untracked Changes' and an inline Discard control on the row; VS Code's question strings, button 'Move to Trash'. | `npx vitest run tests/server/git/untracked/trash.test.ts tests/routes/git/untracked.test.ts tests/views/sources/repositories/changes/trash-and-cuts.test.ts tests/views/sources/repositories/changes/change-rows.test.ts` | Test Files  4 passed (4) / Tests  53 passed (53) |
| 2 | DONE | `addToGitignore` (git-index.ts:332) appends one line per path, atomic, refuses a link or a folder as `.gitignore`; store `ignore` then opens `.gitignore` in a source tab; changed-file and folder menus. | `npx vitest run tests/server/git/untracked/ignore.test.ts tests/state/sources/repositories/capabilities/store-actions.test.ts` | Test Files  2 passed (2) / Tests  30 passed (30) |
| 3 | DONE | `head=` read, read-only source tab `<file> (HEAD)` / `<file> (Index)` (state/sources/repositories/file-git.ts:43 headTabState); the item Open File (HEAD) is on Changes and Staged rows: a Staged row opens the file at HEAD, a Changes row the file in the index; none on an Untracked row. | `npx vitest run tests/server/core/git/head.test.ts tests/state/sessions/source.test.ts tests/views/sources/repositories/menus/repositories-menu.test.ts` | Test Files  3 passed (3) / Tests  93 passed (93) |
| 4 | DONE | `workspace=` read (both sides from disk, each held inside its own worktree), a diff pane over it, and the menu item on a linked worktree only. | `npx vitest run tests/server/core/git/compare.test.ts tests/views/sources/repositories/diff-pane.test.ts` | Test Files  2 passed (2) / Tests  50 passed (50) |
| 5 | DONE | `closed: string[]` in `RepositoriesView`; Close Repository, Close Other Repositories, Reopen Closed Repositories (quick pick: title 'Reopen Closed Repositories', placeholder 'Pick a repository to reopen', 'All Repositories' after a separator when more than one is closed); 'all closed' empty state. | `npx vitest run tests/state/sources/repositories/capabilities/view-state.test.ts tests/views/sources/repositories/repositories.test.ts` | Test Files  2 passed (2) / Tests  54 passed (54) |
| 6 | DONE | Open Worktree and Open Worktree in New Window on a worktree row; the folder is added as a workspace root and shown in Files; the new-window form also opens the page address; a refusal is one muted row. | `npx vitest run tests/state/sources/repositories/capabilities/store-actions.test.ts` | Test Files  1 passed (1) / Tests  18 passed (18) |
| 7 | DONE | `switchDetached` (git-write.ts:372, `git switch --detach`, refused on a dirty tree); Checkout (Detached) on a graph commit and on a remote branch name. | `npx vitest run tests/server/git/refs/detached.test.ts tests/routes/git/refs.test.ts tests/views/sources/repositories/graph/graph-picks.test.ts` | Test Files  3 passed (3) / Tests  36 passed (36) |
| 8 | DONE | Create Branch and Create Tag from a commit with an optional start point (graph/graph-picks.ts `namePrompt`); the server takes `start` for `createBranch` and `createTag`. | `npx vitest run tests/server/git/refs/detached.test.ts tests/views/sources/repositories/graph/graph-picks.test.ts` | Test Files  2 passed (2) / Tests  22 passed (22) |
| 9 | DONE | `cherryPickIn` (git-write.ts:637); 'Cherry-picking' banner with Abort and no Continue; commit box prefilled from git's prepared message; Abort runs `cherry-pick --abort`; an empty pick is aborted and answered 'The changes are already present in the current branch.' | `npx vitest run tests/server/git/refs/cherry-pick.test.ts tests/state/sources/repositories/view/commit-action.test.ts` | Test Files  2 passed (2) / Tests  17 passed (17) |
| 10 | DONE | Compare with Remote, Compare with Merge Base (base on the first graph page), Compare with... (quick pick over `refs=`, placeholder 'Select a reference to compare with'), each opening a compare diff pane. | `npx vitest run tests/server/core/git/compare.test.ts tests/views/sources/repositories/graph-row.test.ts` | Test Files  2 passed (2) / Tests  57 passed (57) |
| 11 | DONE | `deleteBranch` (git-refs.ts:152) runs `git branch -d` only; not offered for the checked-out branch; no `-D` (Z241 open). | `npx vitest run tests/server/git/refs/delete-branch.test.ts` | Test Files  1 passed (1) / Tests  7 passed (7) |
| 12 | DONE | `Pane.locked` (state/workbench/layout/model.ts:49), `setLocked` (layout/tree.ts:333), saved format, Lock Group / Unlock Group in the strip menu, lock glyph at the strip's right end; a locked pane is skipped by where a new view opens; a tab opened from its own strip or dropped on it still goes in. | `npx vitest run tests/state/workbench/layout/open/locked.test.ts tests/state/workbench/layout/saved/layout-locked.test.ts tests/shell/panes/strip/strip-render.test.ts` | Test Files  3 passed (3) / Tests  39 passed (39) |
| 13 | DONE | New Text File in the strip menu; `newNoteOpener` (state/workbench/layout/open/new-note.ts) opens a fresh scratch Note in that pane. | `npx vitest run tests/shell/panes/pane-strip-menu.test.ts` | Test Files  1 passed (1) / Tests  18 passed (18) |
| 14 | DONE | `show_tabs: multiple|single|none` and `editor_actions: strip|hidden` in config/appearance.yml:76-78, options entries (config/catalogs/options.yml:92,98), `VOCAB_KEYS` (data/sources/config/catalogs.ts:34-35), Tab Bar and Editor Actions Position submenus; the pick is written to appearance.yml through `ui.setPaneStrip`. | `npx vitest run tests/state/shared/words/appearance.test.ts tests/state/shared/words/tones.test.ts tests/state/workbench/ui.test.ts tests/checks/config/config-folder.test.ts` | Test Files  4 passed (4) / Tests  307 passed (307) |
| 15 | DONE | `shouldCancel(event)` (shell/context-guard.ts:16) and one document `contextmenu` listener (routes/+page.svelte:196). | `npx vitest run tests/shell/context-guard.test.ts tests/routes/page.test.ts` | Test Files  2 passed (2) / Tests  22 passed (22) |
| 16 | DONE | `commitWith` passes `user.useConfigOnly` through `GIT_CONFIG_COUNT` / `GIT_CONFIG_KEY_0` (git-write.ts:632). | `npx vitest run tests/server/git/refs/identity.test.ts` | Test Files  1 passed (1) / Tests  3 passed (3) |
| 17 | DONE | `GitState.held` keeps the pre-cut counts; `statusLists` keeps the pre-cut count in it; `cutGroups(git)` (repositories.ts:610) names the cut groups; the warning row is drawn in the Repositories view and in `ChangeGroups.svelte`. | `npx vitest run tests/server/core/git/held.test.ts tests/state/sources/repositories/capabilities/view-state.test.ts` | Test Files  2 passed (2) / Tests  15 passed (15) |
| 18 | DONE | `repositoriesBadge()` (state/workbench/rail-badges.svelte.ts:190) sums held merge + staged + changes + untracked over `gitRoots()`; registered as the Repositories view's badge (Repositories.svelte:13). | `npx vitest run tests/state/sources/repositories/capabilities/repositories-badge.test.ts tests/state/workbench/rail-badges.test.ts` | Test Files  2 passed (2) / Tests  111 passed (111) |
| 19 | DONE | `wanted()` in server/root/watch/git.ts scans each root one folder deep (skips links and `node_modules`); also runs on a workspaces-file change. | `npx vitest run tests/server/root/watch/git/scan.test.ts tests/server/root/watch/git/git.test.ts` | Test Files  2 passed (2) / Tests  27 passed (27) |
| 20 | DONE | `server/core/git.ts` and `git-parse.ts` moved to `server/core/git/`, with `git-compare.ts` and `git-run.ts` beside them; `server/core` holds 9 items. | see below | `ls src/lib/server/core | wc -l` printed `9`; `wc -l` printed git-compare.ts 394, git-parse.ts 586, git-run.ts 86, git.ts 837, deposit.ts 828, git-write.ts 799, deposit-git.ts 317, git-index.ts 392; the largest file of tests/server/core/git is git.test.ts at 899; `PaneView.svelte` 489, `Diff.svelte` 519, `Graph.svelte` 536. |
| 21 | DONE | Catalog keys in config/text/views/sources/repositories.yml, config/text/views/sessions/changes.yml and config/text/ui.yml; `HELP.md` sections 'Untracked files, ignoring and earlier versions', 'Repositories, closing and opening worktrees' and 'What oculus fixes'; `DESIGN.md:128` rewritten and a 'Fixed git choices' paragraph at :129; 'no form carries `--force`' kept. | see below | `grep -n "no form carries" DESIGN.md` prints line 128; `grep -n "Fixed git choices" DESIGN.md` prints line 129; `grep -n "What oculus fixes" HELP.md` prints lines 187 and 213; the rename greps below print nothing. |

The greps and counts of the verify list, run in this turn:

```
$ grep -c "useConfigOnly" src/lib/server/git/git-write.ts
3
$ grep -rn -- "--force" src/lib/server/git
src/lib/server/git/deposit-git.ts:257:    return pushCmd(at, ['--force', 'origin', 'HEAD:main']);
$ wc -l src/lib/server/core/git/*.ts src/lib/server/git/*.ts
     394 src/lib/server/core/git/git-compare.ts
     586 src/lib/server/core/git/git-parse.ts
      86 src/lib/server/core/git/git-run.ts
     837 src/lib/server/core/git/git.ts
     317 src/lib/server/git/deposit-git.ts
     218 src/lib/server/git/deposit-routes.ts
     828 src/lib/server/git/deposit.ts
     392 src/lib/server/git/git-index.ts
     108 src/lib/server/git/git-message.ts
     265 src/lib/server/git/git-reads.ts
     165 src/lib/server/git/git-refs.ts
      96 src/lib/server/git/git-remote.ts
     381 src/lib/server/git/git-routes.ts
     799 src/lib/server/git/git-write.ts
    5472 total
$ wc -l src/lib/shell/panes/PaneView.svelte src/lib/views/sources/repositories/diff/Diff.svelte src/lib/views/sources/repositories/graph/Graph.svelte tests/server/core/git/git.test.ts
     489 src/lib/shell/panes/PaneView.svelte
     519 src/lib/views/sources/repositories/diff/Diff.svelte
     536 src/lib/views/sources/repositories/graph/Graph.svelte
     899 tests/server/core/git/git.test.ts
    2443 total
$ ls src/lib/server/core | wc -l
       9
$ ASCII gate over src tests config (perl, bin is absent in this worktree)
(no output)
$ ! LC_ALL=C grep -rna "[^ -~]" src tests ; echo $?
0
$ grep -rnE "core/git\.ts|core/git-parse|repositories/Worktrees|repositories/pick" src tests config HELP.md DESIGN.md README.md docs utils --exclude=local.yml --exclude-dir=diagrams
(no output)
```

The other commands of the verify list, run one by one after the last source edit, each in this turn:

```
$ npm run test:checks            Test Files  29 passed | 2 skipped (31)   Tests  444 passed | 9 skipped (453)
$ npm run check                  COMPLETED 3015 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run lint                   exit=0, no output
$ npm run build                  exit=0
$ npm run format:check           All matched files use Prettier code style!
$ npm run diagrams               run before test:checks; docs/diagrams is current
$ npx vitest run tests/server/core/git/git.test.ts tests/server/core/git/held.test.ts   (alone)  passed
```

`npm test` in full: Test Files 458 passed | 22 skipped (480), Tests 11738 passed | 621 skipped (12359), from the third full-list run (inside checks.sh). After it the only source-tree edits were the comment rewraps in `tests/server/core/git/git.test.ts` that brought it from 901 to 899 lines; that file passes alone (43 passed) and in test:checks nothing reads it.

A 48-file batch run of the step's test files, taken for the table above, timed out three heavy git cases (two in `tests/server/core/git/git.test.ts`, one in `held.test.ts`); both files pass when run alone and passed in the full run. I did not diagnose the timeouts further. They build 250 files or branches by real git processes, so a loaded machine can run them past vitest's limit.

## Every test file the step added or changed

Before is the run on the unchanged tree (LOADFAIL = the file does not load there); after is the run in this turn. The 48 rows are the 43 files of the first run plus five written or changed after that list was fixed: `graph/graph-picks.test.ts` (new, covers `graph-picks.ts`, which was split out of `Graph.svelte` to keep it under 540 lines), `state/workbench/ui.test.ts` (the `setPaneStrip` cases), `views/sources/repositories/graph-row.test.ts`, `state/shared/instance-state-sources.test.ts` and `state/shared/words/tones.test.ts` (fixtures and counts that follow a changed shape). Those five were not run on the unchanged tree; the tree they would run against is not available to me without a git command.

| test file | on the unchanged tree | after |
|---|---|---|
| tests/checks/config/config-folder.test.ts | 2 failed / 24 passed | 26 passed / 0 failed |
| tests/routes/git/refs.test.ts | 12 failed / 2 passed | 14 passed / 0 failed |
| tests/routes/git/untracked.test.ts | 4 failed / 4 passed | 8 passed / 0 failed |
| tests/routes/page.test.ts | 3 failed / 11 passed | 14 passed / 0 failed |
| tests/server/core/git/compare.test.ts | file does not load | 22 passed / 0 failed |
| tests/server/core/git/git-parse.test.ts | file does not load | 8 passed / 0 failed |
| tests/server/core/git/git-reads.test.ts | file does not load | 35 passed / 0 failed |
| tests/server/core/git/git-ssh.test.ts | file does not load | 5 passed / 0 failed |
| tests/server/core/git/git.test.ts | file does not load | 43 passed / 0 failed |
| tests/server/core/git/head.test.ts | file does not load | 9 passed / 0 failed |
| tests/server/core/git/held.test.ts | file does not load | 5 passed / 0 failed |
| tests/server/git/refs/cherry-pick.test.ts | file does not load | 6 passed / 0 failed |
| tests/server/git/refs/delete-branch.test.ts | 7 failed / 0 passed | 7 passed / 0 failed |
| tests/server/git/refs/detached.test.ts | 11 failed / 3 passed | 14 passed / 0 failed |
| tests/server/git/refs/identity.test.ts | 0 failed / 3 passed | 3 passed / 0 failed |
| tests/server/git/untracked/ignore.test.ts | 12 failed / 0 passed | 12 passed / 0 failed |
| tests/server/git/untracked/trash.test.ts | 12 failed / 0 passed | 12 passed / 0 failed |
| tests/server/root/watch/git/git-events.test.ts | 0 failed / 6 passed | 6 passed / 0 failed |
| tests/server/root/watch/git/git-workspaces.test.ts | 0 failed / 10 passed | 10 passed / 0 failed |
| tests/server/root/watch/git/git.test.ts | 0 failed / 23 passed | 23 passed / 0 failed |
| tests/server/root/watch/git/scan.test.ts | 2 failed / 2 passed | 4 passed / 0 failed |
| tests/shell/context-guard.test.ts | file does not load | 8 passed / 0 failed |
| tests/shell/panes/floats/float-geometry.test.ts | 0 failed / 27 passed | 27 passed / 0 failed |
| tests/shell/panes/floats/floatlayer.test.ts | 0 failed / 13 passed | 13 passed / 0 failed |
| tests/shell/panes/pane-strip-menu.test.ts | 9 failed / 9 passed | 18 passed / 0 failed |
| tests/shell/panes/strip/strip-render.test.ts | 5 failed / 3 passed | 8 passed / 0 failed |
| tests/shell/panes/strip/strip-shape.test.ts | file does not load | 11 passed / 0 failed |
| tests/state/sessions/source.test.ts | 4 failed / 48 passed | 52 passed / 0 failed |
| tests/state/shared/instance-state-sources.test.ts | new file or added after the first run, so it has no first run | 354 passed / 0 failed |
| tests/state/shared/words/appearance.test.ts | 21 failed / 121 passed | 142 passed / 0 failed |
| tests/state/shared/words/tones.test.ts | new file or added after the first run, so it has no first run | 99 passed / 0 failed |
| tests/state/sources/repositories/capabilities/repositories-badge.test.ts | 7 failed / 1 passed | 8 passed / 0 failed |
| tests/state/sources/repositories/capabilities/store-actions.test.ts | file does not load | 18 passed / 0 failed |
| tests/state/sources/repositories/capabilities/view-state.test.ts | 10 failed / 0 passed | 10 passed / 0 failed |
| tests/state/sources/repositories/view/commit-action.test.ts | 0 failed / 11 passed | 11 passed / 0 failed |
| tests/state/workbench/layout/open/locked.test.ts | 24 failed / 2 passed | 26 passed / 0 failed |
| tests/state/workbench/layout/saved/layout-locked.test.ts | 3 failed / 2 passed | 5 passed / 0 failed |
| tests/state/workbench/rail-badges.test.ts | 0 failed / 103 passed | 103 passed / 0 failed |
| tests/state/workbench/ui.test.ts | new file or added after the first run, so it has no first run | 40 passed / 0 failed |
| tests/ui/menu/menu-words.test.ts | 2 failed / 1 passed | 3 passed / 0 failed |
| tests/views/sources/repositories/changes/change-rows.test.ts | 3 failed / 18 passed | 21 passed / 0 failed |
| tests/views/sources/repositories/changes/trash-and-cuts.test.ts | 9 failed / 3 passed | 12 passed / 0 failed |
| tests/views/sources/repositories/changes/tree-mode.test.ts | 0 failed / 30 passed | 30 passed / 0 failed |
| tests/views/sources/repositories/diff-pane.test.ts | 1 failed / 27 passed | 28 passed / 0 failed |
| tests/views/sources/repositories/graph-row.test.ts | new file or added after the first run, so it has no first run | 35 passed / 0 failed |
| tests/views/sources/repositories/graph/graph-picks.test.ts | new file or added after the first run, so it has no first run | 8 passed / 0 failed |
| tests/views/sources/repositories/menus/repositories-menu.test.ts | 25 failed / 7 passed | 32 passed / 0 failed |
| tests/views/sources/repositories/repositories.test.ts | 1 failed / 43 passed | 44 passed / 0 failed |

Existing tests whose expectations changed, with the old and the new expectation:

| test | before | after |
|---|---|---|
| tests/views/sources/repositories/graph-row.test.ts | `row()` props had no `compare` or `ongraph`; `FACTS` had no `remotes` | props carry `compare` and `ongraph`; `FACTS` has `remotes: []` |
| tests/state/sources/repositories/view/repositories.test.ts | two expected view objects without `closed` | both carry `closed: []` |
| tests/state/sources/repositories/capabilities/view-state.test.ts | `closed: ['/b', 4]` read back as `closed: ['/b', 4]` | reads back as `['/b']` (the string survivors, as `collapsed` does) |
| tests/views/sources/repositories/changes/trash-and-cuts.test.ts | counted `data-entry=` rows (203); VirtualRows draws 13 under SSR | counts `data-cut=` rows (1) and checks the untracked group has none |
| tests/state/shared/instance-state-sources.test.ts | held-diff fixtures without `compare` and `workspace`; no `closed` | fixtures carry both; the repositories block reads `closed` |
| tests/ui/theme/wall.test.ts | no QuickPick entries | SOLID entries for `QuickPick.svelte .row.now` and `.row:hover` |
| tests/views/whole/type-scale.test.ts | `Worktrees.svelte` under `repositories/`; no QuickPick, no `.cut` | key moved to `refs/`; `ChangeGroups` has `.cut=fs-sm`; `ui/forms/choice/QuickPick.svelte` has `.heading=fs-xs | .row=fs-md` |
| tests/state/shared/words/tones.test.ts | the appearance key list without the two strip keys | thirteen keys, with `editor_actions` and `show_tabs` added |
| tests/shell/panes/pane-strip-menu.test.ts | `newNoteOpener` imported from `pane-view.ts` | imported from `state/workbench/layout/index.ts` |
| tests/state/sessions/source.test.ts | `headTabState` imported from `sessions/source.svelte.ts` | imported from `state/sources/repositories/file-git.ts` |
| tests/routes/git/refs.test.ts and untracked.test.ts | each built its own POST request | both use `tests/routes/git/request.ts` (`gitPost`) |
| tests/state/sources/repositories/capabilities/store-actions.test.ts and view/repositories.test.ts | each built its own layout recorder | both use `tests/state/sources/repositories/layout-recorder.ts` |
| tests/checks/tree/boundaries.test.ts | FROZEN list without the two new appearance names | adds `appearance.ts:tabBar` and `appearance.ts:actionsAt`, the same kind of entry as the existing `crt` and `codeTheme` |
| tests/views/sources/repositories/changes/trash-and-cuts.test.ts, menus/repositories-menu.test.ts | twelve absences asserted with no reason above them (`tests/checks/tree/negatives.test.ts` failed) | each has a reason comment |
| tests/shell/context-guard.test.ts, tests/server/git/refs/repo.ts, tests/routes/git/refs.test.ts | lint errors (`delete`, a cast) | `Reflect.deleteProperty`, `as unknown`; lint exits 0 |

Every new case carries a `// Revert:` line naming the change that makes it fail, or sits in a group whose first case does.

## Folder splits and moves

Each split keeps its folder at ten items or fewer.

- `src/lib/server/core/git.ts` and `git-parse.ts` moved to `src/lib/server/core/git/`, with the new `git-compare.ts` and `git-run.ts`; `server/core` holds 9 items; the rename greps above print nothing.
- `src/lib/shell/panes/` into `strip/` (PaneStrip.svelte, strip-shape.ts) and `leaf/` (FoldedPane.svelte, PageLeaf.svelte).
- `src/lib/views/sources/repositories/Worktrees.svelte` to `refs/Worktrees.svelte`, since `repositories/` held ten items.
- `QuickPick.svelte` and `quick-pick.ts` are in `src/lib/ui/forms/choice/`, not under `views/.../pick/`: a partial under `views/` that declares a wall surface is refused by `tests/views/whole/tinted.test.ts`.
- `src/lib/views/sources/repositories/graph/graph-picks.ts` split from `Graph.svelte`, which was 588 lines against the 540 line cap and is now 536.
- `src/lib/views/sources/repositories/diff/diff-reads.ts` split from `Diff.svelte` (now 519 lines).
- The key rows (`repositoryKeyRows`) moved from `state/sources/repositories/repositories.ts` to `change-tree.ts`.
- `src/lib/state/workbench/layout/open/new-note.ts` added and exported from `layout/index.ts`, because the shell may not import `state/life`.
- Tests: `tests/views/sources/repositories/{changes,menus,graph}`, `tests/shell/panes/{floats,strip}`, `tests/server/core/git/`, `tests/server/root/watch/git/`.

## Full-list runs

Three full runs of `npm test` (the third inside checks.sh). Run 1: one file, `tests/server/git/autofetch.test.ts`, timed out and passed on its own re-run. Run 2: one file failed, `tests/state/shared/words/tones.test.ts` (its key count), fixed and passing alone. Run 3: 458 files passed. Besides those, `npm run test:checks` was run five times, one of them inside checks.sh; the last of the five came after the final edit and is the green one printed above. Single files and groups of files were run on their own for the rows of the table.

## Beyond the path list and design points

- `git-run.ts` is an added file in `server/core/git/`; `cat-file` and `ls-files --stage` were added to the read forms (seventeen subcommands; `tests/server/core/git/compare-gate.test.ts` allows nine in `git-compare.ts` and `git-run.ts`).
- `Ask.confirm` (`views/shared/ask.ts`, `AskConfirm.svelte`) and `views/sessions/changes/ChangesRepo.svelte` are outside the brief's path list: the Trash button needs a confirm label, and the session Changes panel draws `ChangeGroups`, which takes the held counts.
- `BadgeSelectors` in `rail-badges.svelte.ts` gained `gitRoots` and `gitFor`; the selectors store satisfies it structurally.
- `ui.setPaneStrip` (`state/workbench/ui.svelte.ts`) writes the two strip settings through the writes store, which the client context hands to `createUi`; the shell may not read the writes store itself.
- With `editor_actions: hidden` the pane menu is still reachable by right click on the strip or an empty pane, but Maximise, Fold and the page items live only in the `...` menu, so they are not reachable until the setting is changed back; Split Right is the button that also goes.
- A float cannot be locked; Lock Group is offered on a pane of a page only.
- `sequenceOf` in the server reads `CHERRY_PICK_HEAD` with `existsSync`.
- The git scan also runs when the workspaces file changes.
- `ignore` is chained with the Files view's write chain like the Trash action.
- The session Changes panel's untracked rows have no Discard control; only the Repositories view has one.
- One `git --version` was run once in an earlier part of the work; it names no repository and changed nothing.
- Z241: Delete Branch refuses an unmerged branch and keeps it, with git's reason.

## Before and after, the look

Not verified in a browser: I have no browser, so none of the rows below was looked at on a screen. "After" is what the item lists or components draw, read from the tests that render or list them; "before" is given only where the first run on the unchanged tree shows it, and says "not recorded" otherwise.

| item | before | after | shown by |
|---|---|---|---|
| Untracked row menu | not recorded | Open File, Stage Changes, Discard Changes, Add to .gitignore, Reveal in Explorer View | `repositories-menu.test.ts` |
| Untracked row inline controls | Open File, Stage | Open File, Discard (glyph `note_back`, tooltip 'Move this untracked file to the Trash'), Stage | `change-rows.test.ts`, `trash-and-cuts.test.ts` |
| Untracked folder row menu | Stage Changes only | Stage Changes, Discard Changes, Add to .gitignore | `repositories-menu.test.ts` |
| Untracked head | Stage All Untracked | Discard All Untracked Changes, then Stage All Untracked; the control is absent on an empty group | `repositories-menu.test.ts`, `trash-and-cuts.test.ts` |
| Trash question | none | "Are you sure you want to DELETE the following untracked file: 'x'?" (several: "Are you sure you want to DELETE the N untracked files?"), detail "You can restore this file from the Trash." (plural "these files"), button "Move to Trash" | `trash-and-cuts.test.ts` |
| Changes row menu | 5 items | Open Changes, Open File (HEAD), Open File, Stage Changes, Discard Changes, Add to .gitignore, Reveal in Explorer View; on a linked worktree Compare with Workspace last, after a rule | `repositories-menu.test.ts` |
| Staged row menu | not recorded | Open Changes, Open File (HEAD), Open File, Unstage Changes, Reveal in Explorer View | `repositories-menu.test.ts` |
| HEAD / Index tab | none | read-only source tab titled `<file> (HEAD)` for a Staged row or `<file> (Index)` for a Changes row, with the locked line | `source.test.ts`, `head.test.ts` |
| Compare with Workspace | none | diff pane of the main worktree's file against the linked worktree's, titled `<file> (Workspace)` | `compare.test.ts`, `diff-pane.test.ts` |
| Graph commit menu | not recorded | Open Changes, Copy Commit ID, Copy Commit Message, Checkout, Checkout (Detached), Create Branch..., Create Tag..., Delete Tag where tags exist, Cherry Pick, then Compare with Remote (upstream set), Compare with Merge Base (base known) and Compare with... | `repositories-menu.test.ts`, `graph-row.test.ts` |
| Compare diff tab | none | one diff pane over the files between the two refs, each file read when shown | `diff-pane.test.ts` |
| Cherry-pick banner | none | "Cherry-picking. N files are in conflict." with Abort and no Continue; Abort asks "Abort the cherry pick in progress?" | `trash-and-cuts.test.ts` |
| Branch name menu on the graph | not recorded | Checkout and Delete Branch for a local branch that is not checked out; none for the checked-out one | `repositories-menu.test.ts` |
| Remote branch name menu | no menu | Checkout (Detached) | `repositories-menu.test.ts` |
| Repository row menu | 2 items | adds Close Repository, and Close Other Repositories while more than one is listed | `repositories-menu.test.ts` |
| Reopen quick pick | none | titled Reopen Closed Repositories, placeholder "Pick a repository to reopen", one row per closed repository and "All Repositories" after a separator when more than one is closed | `repositories-menu.test.ts` lists the choices; the pick itself needs a DOM |
| Worktree row menu | not recorded | adds Open Worktree and Open Worktree in New Window | `repositories-menu.test.ts` |
| Strip menu on a page pane | 8 items | Open File..., New Text File, four splits, Float, Lock Group, Tab Bar and Editor Actions Position submenus, Close, New Terminal (12 items; Close is shown when the page has more than one pane) | `pane-strip-menu.test.ts` |
| Strip menu on an empty pane | 2 items | Open File..., New Text File, Lock Group, Tab Bar, Editor Actions Position, New Terminal | `pane-strip-menu.test.ts` |
| Locked pane | no lock | a lock glyph at the strip's right end, and Unlock Group in the menu | `strip-render.test.ts`, `pane-strip-menu.test.ts` |
| New Text File | none | a fresh scratch Note tab opened in that pane | `pane-strip-menu.test.ts` |
| `show_tabs` single / none | every tab drawn | single draws the active tab alone, none draws no tab and keeps a title row with the pane's actions | `strip-render.test.ts` |
| `editor_actions` hidden | not recorded | the split button and the menu opener are not drawn; a right click on the strip or an empty pane still opens the menu | `strip-render.test.ts` |
| Settings Appearance rows | none | Tab Bar and Editor Actions Position rows with choice controls (multiple / single / none, strip / hidden) | `config-folder.test.ts`, `tones.test.ts` |
| Rail badge | none on Repositories | the summed held count of merge, staged, changes and untracked over every repository | `repositories-badge.test.ts`, `rail-badges.test.ts` |
| Cut-list warning | none | a muted row "Too many changes were detected. Only the first 200 changes will be shown below." under a cut group in the Repositories view, and the same line in the session Changes panel | `trash-and-cuts.test.ts` |
| Scanned repository | only listed roots | a repository one folder below a root is also listed | `scan.test.ts` |
| Right click on a blank area | no page-wide handler | the browser's menu is cancelled | `context-guard.test.ts`, `routes/page.test.ts` |
| Right click in a Settings input, Monaco, the terminal | no page-wide handler | the control keeps its own menu (input, textarea, contenteditable, `.monaco-editor`, `[data-terminal]`) | `context-guard.test.ts` |
