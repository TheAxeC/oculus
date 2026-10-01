# Brief check of Q88c

Brief: `tools/oculus/.scratch/migration/agents/briefs/Q88c.md`. Checked against `plan.md:287-295` and the Rulings Z52, Z55, Z70, Z83, Z150, Z152, Z162, Z172 and Z175, against `agents/spec.md`, `agents/reviews/vscode-parity.md:234-268`, the tree at main 70f7dc54, and VS Code's git extension (`/Applications/Visual Studio Code.app/Contents/Resources/app/extensions/git/dist/main.js` and `package.json`). Nothing was written and no state-changing git command was run. Every finding below was read from the file and line named; I did not run the test suite or checks.sh.

The brief is not ready to dispatch. Section 6 holds blocking items: a gate collision, a cherry-pick state the code cannot hold, a folder-limit breach, an unspecified identity guard for trash, and missing paths. Section 5 holds false VS Code claims in Decisions 1 and 2 and a set of user-visible choices that no ruling covers.

## 1. Names

**Docs that become false and are outside the brief's paths**
- `DESIGN.md:128` is the Git paragraph. It lists the write subcommands and says "no form carries `--force`". The step adds `cherry-pick`, `-c user.useConfigOnly=true`, `switch --detach`, `branch -d` and `-D`, new read forms, and the repository scan. The brief's DESIGN paths are 355 and 390-413 only.
- `HELP.md:43` (strip right-click menu text) becomes false when the strip menu gains Lock Group and the Tab Bar submenu. It is outside the brief's HELP paths 112 and 170-212. L4 also owns `HELP.md:27-45`, so this hunk needs an ordering rule with L4.
- `HELP.md:221` (the `appearance.yml` row) becomes false when two keys are added. It is outside the brief's HELP paths.

**Tests that pin what the step changes and are outside the brief's test paths and outside case 21's folder list**
- `tests/ui/menu/menu-words.test.ts` calls `stripMenu({holdsTab:true,panes:2}, words)`, `changeMenu`, `commitMenu`, `worktreeMenu` and `repoRowMenu`. It breaks on any new item or changed signature.
- `tests/checks/config/config-folder.test.ts:108` pins `'appearance.yml': ['themes','wallpaper','memories','crt','code_theme','terminal']` exactly. Adding `show_tabs` and `editor_actions` fails it.
- `tests/checks/config/config.test.ts:739` and `tests/state/shared/words/tones.test.ts:211` cover `VOCAB_KEYS`.
- `tests/fixtures/sessions-fixture.ts` builds `GitState` literals. It must change if `GitState` gains a required field (the held counts of item 17).

**Source files the step must touch and the brief's "Paths this step writes" does not list**
- `data/sources/config/catalogs.ts:23-35` (`VOCAB_KEYS`). Without the two new keys the client never receives `show_tabs` or `editor_actions`, so Z70 does nothing in the page.
- `state/workbench/layout/tree.ts`. Its pane literals at :170, 178, 209, 225, 235, 254, 277 and 296 rebuild `{kind:'pane', tabs, active}` and drop `locked` on the next activate, open, move or close. Also `open/preview.ts:39,51`, `navigation/arrangement.ts:42`, `layout.svelte.ts:69`, `model.ts:111,131`, `saved.ts:301`, and the pane setter that sets and clears the lock (`layout/index.ts`, `layout.svelte.ts`, `workbench.ts`).
- Badge wiring: `state/client/context.ts:311`, `state/client/selectors.svelte.ts`, `state/workbench/navigation/registry.ts:33-50` (the `BadgeClient.railBadges` Pick union). `createRailBadges` takes `(entities, feeds, hpc, calendar, inbox, audit, selectors)` and has no git input today.
- `src/routes/api/(git)/git/+server.ts` and `GitOptions` (`git-routes.ts:147-160`), for the trash call. The route builds config, rootsFor and refresh only. It has no engine, `local` or trash.
- `views/shared/changes/CommitBox.svelte`, if cherry-pick uses git's prepared message (`CommitBox.svelte:68` prefills only for `merging`).
- `views/shared/changes/ChangeGroups.svelte` and `views/sessions/changes/ChangesRepo.svelte`, if "Showing 200 of n" applies to the sessions panel.
- `views/sources/source/Source.svelte` and `state/sessions/source.svelte.ts`, for the Open File (HEAD) tab.

**Line references in the brief that differ from the tree**
- The brief cites the git-routes operation table as ":133-164". It is `git-routes.ts:231-264`. (:133-164 is the end of `CONFIRMED` and the start of `GitOptions`.)
- The brief cites `handleGitGet` as ending at :190. It ends at `git-reads.ts:196`.
- The brief cites the read-form list in `server/core/git.ts` as ":40-60". The forms are listed at :11-39.

## 2. The step line

Every part of the plan line maps to a brief item:

| Plan-line part | Brief item |
|---|---|
| Discard untracked | 1 |
| .gitignore | 2 |
| Open File (HEAD) | 3 |
| Compare with Workspace | 4 |
| Close Repository and Others | 5 |
| Open worktree | 6 |
| Checkout (Detached) | 7 |
| Branch and tag from a commit | 8 |
| Cherry Pick | 9 |
| Compare with Remote, Merge Base, with... | 10 |
| Delete Branch | 11 |
| Lock Group | 12 |
| New Text File | 13 |
| Tab Bar and Editor Actions settings | 14 |
| Page-wide handler | 15 |
| Z172 | 16, 17, 20 |
| Z175 | 18, 19 |

**Gaps against the plan line and the inventory**
- The inventory row (`vscode-parity.md:234-268`) names "Discard All (Tracked, Untracked) Changes". VS Code has `git.cleanAllUntracked` on the Untracked group head and an inline `git.clean` on untracked rows (checked in `package.json`). The brief builds only a discard of selected untracked paths. `change-menu.ts` has `groupMenu('untracked')` with only Stage All Untracked, and its head comment says each item is one "the row's or the head's own controls already offer". So the untracked group has no Discard item or control to extend, and the brief does not say whether the head and row controls are built.
- `Q88.md:57` and `:148` assign Checkout (Detached) of a remote branch name's own pill menu to this step ("its detached checkout is Q88b's" was carried forward). `graph-menu.ts` `refKind` returns 'none' for a remote branch. Item 7 covers only the commit menu, so that carried obligation is unmet.
- VS Code offers Open Worktree in Current Window and in New Window. The brief builds one and neither builds nor declares out the other.
- Beyond the line: reopening a closed repository. Item 5 closes a repository and the brief restores all of them at once (see section 5). VS Code's `git.reopenClosedRepositories` is a picker. Without a reopen, Close is irreversible in the page.

## 3. Premises

Commands were `grep -n`, `wc -l` and `sed -n` over the files named.

| Brief premise | Printed | Match |
|---|---|---|
| `git-write.ts` is 723 lines with `discard` :212, `commit` :237, `createBranch` :315, `switchBranch` :329, `createWorktree` :437, `removeWorktree` :456, `merge` :494, `stoppedOn` :534 | 723 lines; each function at the line named | yes |
| `git-refs.ts` 135 lines, `createTag` :111, `deleteTag` :126 | same | yes |
| `git-routes.ts` 320 lines, `ACTIONS` :57-91, `CONFIRMED` :117-137 | same | yes |
| operation table at :133-164 | `OPERATIONS` at :231-264 | NO |
| `handleGitGet` :141-190 | :141-196 | NO |
| `server/core/git.ts` 898 lines, `MAX_ENTRIES=200` :126, `commitDiff` :322, `sidesOf` :399, `mergeBase` :458, `capped` :666 | same | yes |
| forms listed at :40-60 | listed at :11-39 | NO |
| `server/core` holds 10 items | 10 | yes (see section 6, folder limit) |
| file limit 900 lines at `size.test.ts:28` | `:28` | yes |
| `PaneView.svelte` 449 lines | 449 | yes |
| `oncontextmenu` appears twice in `src` | twice | yes |
| `pickerRoots` at `repositories.ts:483` | :483 | yes |
| `rail-badges.svelte.ts` has the Audit badge at :11 | :11 | yes |
| `ops.ts` trash call at :275 | `sendToTrash` :273, `scope.trash` call :275 | yes |
| no `cherryPick`, `deleteBranch` or `checkoutDetached` in the tree | none found | yes |
| Create Branch and Create Tag take no start point | `createBranch` :315 and `createTag` :111 take a name only | yes |
| No ADR records | `ls docs/adr` and `ls ../../docs/adr` print "No such file or directory"; `../../.agents/plan.yaml` has no `adr` key | yes |

Three premises are false, all in line references. Each is cheap to correct; a builder who trusts them lands in unrelated code.

## 4. Cases and checks

Against `spec.md` and the standards, in brief-case order.

- **Case 16 (commit with `user.useConfigOnly`).** It needs isolation from global and system git config (`GIT_CONFIG_GLOBAL=/dev/null` and `GIT_CONFIG_SYSTEM=/dev/null`, or a scratch HOME). Otherwise the machine's identity masks the refusal, and the case passes without exercising item 16.
- **Case 15 (page-wide handler).** It cannot be tested without a DOM, and the suite has none for this. The case needs the handler written as a pure function of the event target (editable field, Monaco, terminal, blank page), tested directly, with the registration seen only at the look. As written, a stub test passes whether or not the browser menu is suppressed.
- **Case 12 (Lock Group).** It lacks the cases where the lock is lost: lock survives activate, open, move and split (the `tree.ts` literals), a saved layout round trip (`readPane` at `saved.ts:257`, `LAYOUT_VERSION`), and the last tab of a locked pane closed. VS Code keeps a locked group when it empties. L4 adds `keeps?: 'terminals'` to the same `Pane` type, the same literals and the same `landingFor`, so the interplay with L4's kept empty pane needs a stated rule.
- **Cases 9 and 10 ("a commit of another branch").** In the graph (`Graph.svelte`) that is only an incoming commit (`HEAD..@{upstream}`); the rest is HEAD history. The cases test a population that is nearly empty. State which commits the graph offers Cherry Pick on, or widen to every commit as VS Code does.
- **Case 18 (3 and 4 changed files giving 7).** It can pass with the cut list lengths instead of the held counts, because `statusLists` (`git-parse.ts:282-315`) cuts each of four lists at 200 in silence (`list.length = Math.min(...)`). It also does not settle whether a file in two groups counts once or twice (VS Code's `countBadge: all` counts it twice).
- **Item 3, "binary or missing".** No rule is stated. `isBinaryFile` already exists; the brief should say to reuse it (a parser or rule exists once).
- **Async cases missing for the new reads, the scan and the trash:** in flight, after close, superseded by a later request.
- **"Before and after" list.** It omits the page-wide handler (blank page, Settings input, Monaco, terminal), the Open File (HEAD) tab, Compare with Workspace, the compare diff tabs, a cherry-pick conflict state, Close and Reopen Repository, Open Worktree, the Delete Branch questions, New Text File, the scan, the Settings Appearance rows, and the Tab Bar submenu. Those are the things a reader sees change.

## 5. The question

The brief's Decisions and several items take user-visible choices. Where VS Code is the stated reference I compared against its source.

**Decisions that rest on a false VS Code claim**
- **Decision 1 (Trash dialog).** The brief's wording is not VS Code's. With `git.discardUntrackedChangesToTrash` true (the macOS default) the dialog asks "Are you sure you want to DELETE the following untracked file: '{0}'?" with the detail "You can restore this file from the Trash." and the button "Move to Trash". The "FOREVER LOST" text appears only when the setting is false. A plural form exists for several files. Use VS Code's strings, including the plural, or the brief must say it deviates.
- **Decision 2 (.gitignore).** "As VS Code's `git.ignore` writes it" is false. VS Code writes the relative path with `\` converted to `/`, escapes `[`, writes no leading `/` and no trailing `/`, and appends without deduplicating. It offers the command on workingTree and untracked resources only. If oculus anchors with `/` or deduplicates, that is oculus's own choice and the brief needs to call it one.

**Behaviours that differ from VS Code with no ruling**
- **Open File (HEAD) for the Changes group.** VS Code's `openHEADFile` opens `leftUri`: HEAD for an index change, the index version for a working-tree change, and a warning for untracked. The brief reads HEAD for Changes and covers Staged and Changes only. Whether "(HEAD)" means HEAD or the index is Axel's call.
- **Reopen restores all closed repositories at once.** VS Code shows a picker titled "Reopen Closed Repositories...". `git.closeOtherRepositories` shows only when more than one repository is open. The brief does not state the condition.
- **Compare with Merge Base.** The brief uses `merge-base(commit, upstream)`. VS Code compares the base branch tip (from `branch.X.vscode-merge-base` config, else the reflog) with the commit. The two give different answers.
- **Compare with Remote.** VS Code runs `diff remoteRef commit`. The brief should state its direction.
- **Cherry Pick restricted to commits not on the current branch.** VS Code offers it on every history item, uses `git cherry-pick <id>`, and aborts on an empty pick. The restriction is the brief's own.
- **Delete Branch.** VS Code uses `-d`, then a "not fully merged. Delete anyway?" modal that retries with `-D`. The brief's `-D` path collides with `DESIGN.md:128` ("no form carries `--force`") and the `git-write.ts` head comment (:9-33, "Nothing is ever forced"). Whether `-D` is a rule clash is Axel's to rule (see Declined to judge). The brief does not name it as a clash.
- **Open Worktree** in Current Window and New Window both exist in VS Code (see section 2).
- **`git.countBadge`** counts merge + index + working-tree resource states, plus untracked when `untrackedChanges` is separate. A file in two groups counts twice. The brief says 3 and 4 give 7 but does not say which rule makes it so.

**Wire and saved shapes the brief uses and no ruling names**
- `RepositoriesView.closed` (view state; `RepositoriesView` is `{root, collapsed, commit, mode, reveal}` today).
- New `DiffState` fields for a from/to compare (`DiffState` holds `staged, worktree, commit, stash, group, against, line` today).
- The Open File (HEAD) source-tab state.
- POST body fields for a start point and for `force` (`gitBodyShape` fields: paths, patch, group, message, amend, remote, name, path, branch, content, ref, mode).
- The `GitState` held-count field(s) (`model-sessions.ts:504`).
- `locked` on `Pane` and its saved form, and `LAYOUT_VERSION` (L4 also bumps it to 5).
- The wording "Showing 200 of {n}", which is not VS Code's, while item 20 says VS Code English.
- The `show_tabs` and `editor_actions` values in `appearance.yml` and `options.yml` (section, control).
- Z172's reasons for the fixed choices are not supplied to the builder.

Each of these is listed here so Axel can rule on them or confirm they are internal. Filter: any that survives as user-visible needs a ruling before dispatch.

## 6. Implied inputs

**Blocking**

1. **Gate collision (item 16).** `commitWith` is `run(root, ['commit', ...args], TIMEOUT_MS)` at `git-write.ts:579-581`. Putting `-c user.useConfigOnly=true` before `commit` breaks two gates in `tests/server/git/git-write.test.ts`: the regex `/\brun\(\s*root\s*,\s*\[\s*'([a-z-]+)'/g` captures `-c` as the subcommand, and the final gate checks `args[2]` against `ALLOWED` in `tests/server/git/allowed.ts`. The brief does not say how the gates change without loosening them. (`-c` placement is a change to the gate's reading of argv, which must be decided, not patched in the test.) The same file asserts the source never contains `--force`, which `-D` does not trip but item 11 must not build a force flag that does.
2. **Cherry-pick state.** `GitSequence = 'merging' | 'rebasing' | ''` (`model-sessions.ts:374`). `sequenceOf` (`core/git.ts:707`) detects only `MERGE_HEAD` and the rebase folders. `abortMerge` in `git-index.ts` handles merge and rebase through `inProgress`. A conflicted cherry-pick therefore shows as no sequence and has no abort. Unplanned and unnamed in the brief: the new `GitSequence` value, the banner words (`Repo.svelte:167-174`), the CommitBox prefill (`CommitBox.svelte:68`), the commit action at `repositories.ts:811` (which treats a non-empty `git.sequence` as 'commit'), the empty-cherry-pick case, and `cherry-pick` in `tests/server/git/allowed.ts` plus exactly one call site in `git-write.ts`. The brief names only `stoppedOn` and `git cherry-pick --abort`.
3. **Folder limit.** `server/core` holds 10 items and `utils/folder-check.sh` counts subfolders; a new subfolder makes 11. `server/git` also holds 10 files, `views/sources/repositories` 10, `state/workbench` 10, `state/workbench/layout` 10, `shell/panes` 9 (L4's FloatLayer reaches 10). The brief's Conventions list names only four source folders and no test folders; `tests/server/core`, `tests/server/root/watch`, `tests/views/sources/repositories`, `tests/state/sources/repositories` and `tests/state/workbench` are at ten as well. Any new file there needs a split that moves existing files, and the brief must say which.
4. **File size.** `git-write.ts` is 723 lines against a 900-line gate (`size.test.ts:28`). About 190 added lines for cherry-pick, detached switch, delete branch and start points reach it. Private call sites (`branch` :672, `switchTo` :642) would have to be exported for `git-refs.ts`. `PaneView.svelte` is 449 against 540 for a component, and L4 uses 91 of the remaining lines.
5. **`trashUntracked` has no identity guard in the git route.** `protectedFiles(target: OpsTarget)` in `server/files/fs/ops.ts` builds the guard from the engine root and `target.local`, neither of which `src/routes/api/(git)/git/+server.ts` has. Also missing: an injectable trash for tests, the write chain `opsWrites`, handling of paths inside a collapsed untracked folder (`status --untracked-files=normal` returns `dir/`) versus `untrackedIn`, and the plural question.
6. **Missing paths** (section 1) include `catalogs.ts`, the layout tree files and the badge wiring. A builder who stays inside the listed paths cannot finish items 12, 14 and 18.

**Other implied inputs**
- **`.gitignore` write.** `spec.md` requires a write that edits text to re-parse its result. The brief omits this, glob-character escaping (`*`, `?`, `[`, a leading `#` or `!`, a trailing space), and serialisation of concurrent edits to one `.gitignore`.
- **Argument injection.** The compare read takes `from` and `to` refs. `git diff --output=<file>` writes a file, so refs need a leading-dash refusal, commit validation and `--end-of-options`. Start points for `createBranch` and `createTag` need the same hash validation. Pathspec magic and globs in compare's `path` are not covered; case 20 covers only `head`. A directory path given to `head` returns a tree listing and must be refused. (`show --no-textconv <rev>:<path>` already exists in `version()` in `core/git.ts` and should be reused.)
- **Compare with Workspace.** The mechanism is unspecified. Q88b's compare is `GET /api/ops` through `compareUrl` in `data/file-ops.ts`, which takes served-root keys; session workspaces and git roots may not be served roots. The brief suggests `rev-parse --git-common-dir`, which is fragile (bare repository, separate git dir) and unnecessary: `GitState.worktrees[0]` is the main worktree. The main worktree path must be checked with `permitted`, `pathInside` and a realpath check.
- **Item 18 badge.** It needs a `BadgeSelectors` or git store dependency and the held counts of item 17 (lists are capped per group). The page button takes the first non-empty badge of the page's views (`RailPages.svelte:55-65`). Whether closed repositories (per-tab state) are excluded is unstated.
- **Item 19 scan.** It is cached from `readRoots`, but `follow()` runs on every sessions push; a repository created later is not found until a config change. Each found subfolder gets a recursive watcher (`root/watch/git.ts` `wanted()` :344-350, `open()` watches `<root>/.git` and the root recursively) and is named on the `files` channel. Autofetch applies to the scanned repositories. The brief does not say how "a root that is a repository" is decided, and VS Code ignores `node_modules` (`repositoryScanIgnoredFolders`).
- **New Text File (item 13).** A note file is made by its first keystroke (`Note.svelte`; `openView('note', {id: noteId(new Date()), fresh: true})` at `Sections.svelte:91`). The brief does not say whether New Text File reuses that or writes an empty file.
- **Missing implied cases:** Close Other only with more than one repository open; Delete Branch force behaviour; the Reopen picker contents.

**Overlap with briefs in flight** (paths from their "Paths this step writes")
- **L4:** `model.ts`, `tree.ts`, `access.ts`, `instances.ts`, `workbench.ts`, `index.ts`, `landing.ts`, `saved.ts`, `layout.svelte.ts`, `PaneView.svelte`, `pane-view.ts`, `ui.yml`, `HELP.md` 27-45 and 127, `DESIGN.md` 210 and 358-365. Heavy overlap with item 12 (Lock Group, `Pane`, `landingFor`, `readPane`, `LAYOUT_VERSION`) and item 15. Q88c should not dispatch before L4 lands, or the brief must say which lands first and who rebases.
- **Q85d:** rewrites readers in `views` including Graph and Merge, plus `state/sources/repositories/answers.ts` (new), `layout/instance.ts` and `index.ts`. Overlaps items 7-11 (graph menu, compare) and 12.
- **U4:** `CommitBox` (item 1 only), `MenuOpener`, `DESIGN.md` 369/404/408, `HELP.md` 100. Overlaps `DESIGN.md` 390-413 hunks and any CommitBox change from cherry-pick.
- **D35:** `options.yml` descriptions 124-262, `HELP.md` 216/236, `config-key.ts`, `context.ts`. Q88c adds to `options.yml` at about lines 12-91, which does not overlap, but `context.ts` overlaps the badge wiring.
- **D27:** `options.yml` `languages` entry, `HELP.md` 230, `Source.svelte`. Overlaps the Open File (HEAD) tab in `Source.svelte`.

## 7. ADRs

None found. `ls docs/adr` and `ls ../../docs/adr` both print "No such file or directory", and `../../.agents/plan.yaml` has no `adr` key. The brief's statement that there are no ADRs holds.

## Declined to judge

- Whether `-D` in Delete Branch is a clash with `DESIGN.md:128` ("no form carries `--force`") and the `git-write.ts` comment "Nothing is ever forced". That is Axel's ruling; the two ways are to keep `-d` only (VS Code's "Delete anyway?" path is then absent) or to amend the rule to allow `-D` after a confirm.
- The look on screen: the Tab Bar submenu, the Settings rows, the "Showing 200 of {n}" line, the badge.
- Real VS Code runtime behaviour beyond what its `main.js` and `package.json` say.
- Timing and load of the repository scan and the compare reads.
- Which fix to choose for the HEAD-only graph against the cherry-pick reachability (restrict to incoming commits, or widen the graph, or offer Cherry Pick on every visible commit).

Usage, from the completion notice: claude-sonnet-5-5 (agent a5ef36663a256e394), 78,134 tokens, 94 tool uses, 15.0 min.
