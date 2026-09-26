Everything in the brief is done.

Open items at dispatch: S2 (where the composer's choices live), X3a (file icons, nesting, local history), X3c (pinned tabs, wrapped tabs); none touches X3b.

All work is in /Users/axelfaes/workspace/research-hub/.agents/worktrees/X3b/tools/oculus. No git command was run on the worktree.

## Checks

| # | Check | Result (quoted output) |
|---|---|---|
| 1 | `npx vitest run --reporter=dot` | `Test Files 319 passed (319)` and `Tests 5029 passed (5029)`, on two runs in a row after the last edit |
| 2 | `npm run check` | `COMPLETED 1438 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 3 | `npm run build` | `build=0` (exit code, measured with pipefail) |
| 4 | `npm run format:check` | `All matched files use Prettier code style!` |
| 5 | `npm run lint` | `lint=0` |
| 6 | ASCII perl gate | `0` lines |
| 7 | `sh bin/size-check.sh` / `sh bin/folder-check.sh` | `size=0` / `folder=0` |
| 8 | `npm run diagrams` twice | both exit 0; the shasum of `docs/diagrams/*` is identical after the second run |
| 9 | `npx playwright test`, whole suite | `397 passed (6.4m)`, `exit=0` |
| 10 | `node bin/revert-check.mjs` | unit, over all 29 changed or new unit test files: `276 reverts, 0 unproven` (the run before the last edits). Git files: `41 reverts, 0 unproven`, then `5 reverts, 0 unproven` for git-write.test.ts. After the last edits: repositories view test `37 reverts, 0 unproven, 0 unchecked`, git-reads test `14 reverts, 0 unproven, 0 unchecked`, `tests/browser/scm/diff.spec.ts` `6 reverts, 0 unproven, 0 unchecked`. Browser: see the note under the table |
| 11 | `ls -d $TMPDIR/oculus-* \| wc -l` | `0` |

The browser revert-check needs the note. Other builders' Playwright runs take port 8792 in the middle of a run, and when they do, cases come back as "the case did not run" (the log shows `EADDRINUSE 127.0.0.1:8792`). I reran it until every directive in the 13 changed browser specs had been proven red on an idle port.

Four rail directives never got a clean run through revert-check: `tokens.css:90`, `tokens.css:93`, `on-body.ts:14` and `RailEditor.svelte:67`. I proved those by hand. For each one, the script copies the tree to the scratchpad, applies the revert, builds, and runs the case. All four came back `failed`, meaning red (`scratchpad/rail-manual.sh`). No single run of the whole browser file list came out at 0 unproven.

The unchecked cases left in the changed files all exist unchanged in the main checkout. Every new or changed case has a directive; I checked this by comparing case names against the main checkout.

## Per item: proof (file:line and its revert)

Each line below is a case that revert-check or the manual run showed red.

1. **Repositories list**
   - `RepoList.svelte:71` and `:84` (views test "lists every root in the Repositories section", "says on each row its branch...").
   - `tests/browser/sources/repositories.spec.ts` "lists every root..." with `repo-shape.ts:18 => delete`.
2. **Commit box (Commit, Amend, Commit and Push, Commit and Sync), shared with ChangesRepo**
   - `repositories.svelte.ts:238` "commits, amends, and commits then pushes or syncs".
   - `ChangesRepo.svelte:106` "draws the one commit box the Repositories view draws".
   - Amend: `git-write.ts:250 => delete`, `:245 => if (false) {`.
3. **Hunk and line actions, and section heads**
   - Patches: `diff-patch.ts:51` and `:52`.
   - Apply: `git-index.ts:39 => unstage: ['--cached'],`, `:40 => revert: []`, and `git-write.ts:559` (drops `--recount`).
   - Heads: `repositories.svelte.ts:281` and `ChangeGroups.svelte:78`.
   - Browser: `Diff.svelte:215 => return;` and `DiffFile.svelte:159`.
4. **Pull, fetch, sync, publish**
   - `git-remote.ts:34`, `:52`, `:36`, `:33`, `:81` and `:31`, and `git-write.ts:579` (prune) and `:574` (the repository's own pull config).
   - Status bar: `RepoItems.svelte:75`, `:81` and `:92` (browser), `:54` and `:135` (unit).
5. **Diff**
   - Word marks: `diff-words.ts:112` and `:129`.
   - Folds: `diff-rows.ts:181` and `:206`.
   - Layouts: `Diff.svelte:246 => pressed={false}`.
   - Open File: `Diff.svelte:272`.
   - Alt+F5 and Shift+Alt+F5: `Diff.svelte:194 => return;` and `:196 => go(at + 1);`.
   - Sessions rows: `ChangeGroups.svelte:64`.
6. **Merge**
   - Merge editor: `merge-regions.ts:110`, `:141`, `:167` and `:216`.
   - Complete Merge: `Merge.svelte:130` (browser) and `:140`.
   - Abort: `git-index.ts:175`. Server side: `git-write.ts:518` and `git-index.ts:154` and `:146`.
7. **Stash**
   - `git-refs.ts:33`, `:65`, `:80` and `:82`.
   - `Stashes.svelte:51`.
   - Browser: `Repositories.svelte:202 => delete`.
8. **Tags**
   - `git-refs.ts:88` (name check) and `:108` (annotated tag).
   - `git-remote.ts:95` (Push Tags).
   - `Tags.svelte:46`.
   - Browser: `Repositories.svelte:218 => delete`.
9. **Graph**
   - Lanes: `graph-lanes.ts:61`, `:68` and `:40`.
   - Page and Load More: `git.ts:260`.
   - Incoming: `git.ts:261` and `Graph.svelte:222 => {#if false}`.
   - Subjects: `Graph.svelte:152 => label={one.short}`.
10. **Blame**
    - `file-git.ts:110` (Not Committed Yet) and `:148`.
    - Toggle: `Source.svelte:340` (browser).
    - Status item: `SourceItems.svelte:117`.
    - Opening in the graph: `repositories.svelte.ts:347`.
11. **Gutter marks**
    - `file-git.ts:127`.
    - Opening the diff: `Gutter.svelte:90` (browser).

## Changes made since the last check run
- **Alt+F5 test and defect.** No test covered Alt+F5, so I added "moves to the next change by Alt+F5 and back by Shift+Alt+F5" to `tests/browser/scm/diff.spec.ts`. It found a defect: the diff pane marked the last change as current as soon as it opened, because `at` starts at -1 and `changes.at(-1)` is the last element. The fix is `Diff.svelte:174`, `const shownAt = $derived(at >= 0 ? changes.at(at) : undefined);`, used at `:322`. The check that fails without the fix is that case under `revert: Diff.svelte:174 => const shownAt = $derived(changes.at(at));` (red).
- **Git test directives.** I added revert directives to the 41 new cases in `git-ops.test.ts`, `routes/git/git.test.ts` and `git-write.test.ts`.
- **Gate cases now hold when run alone.** The gate cases that assert on everything the file ran now run a write of their own first, so they pass when run alone:
  - `git-ops.test.ts`: a sync, reverted by `git-write.ts:569`, which adds `--force` to the push.
  - `git-write.test.ts`: a stage, reverted by `git-write.ts:550`.
- **Weak routes test removed.** I removed the routes case "carries the amend with the commit". It only checked that the mocked runner received the field. The real mapping, `git-routes.ts:189`, is now proven inside the endpoint case of `git-ops.test.ts`.
- **Graph test timeout.** The graph-page case in `git-reads.test.ts` timed out under load because it made 51 commits, one process each. It now makes them in one `git fast-import` run.
- **Directives moved by my token, glyph and icon insertions.** These pointed at the wrong line after my insertions; I re-pointed them, and each was proven red afterwards:
  - `rail.spec.ts:150` and `:699`
  - `bar.spec.ts:23`
  - `show-in-files.spec.ts:88`
  - `status-bar.test.ts:273`
  - `config-folder.test.ts:494` and `:519`
  - `duplication.test.ts:266`

## Command lists (tests/server/git/allowed.ts)
- **Writes:** add, apply, branch, check-ref-format, commit, diff, fetch, merge, merge-base, pull, push, rebase, remote, restore, rev-parse, stash, status, switch, tag, worktree. Each has one call site in `git-write.ts`, and no form carries `--force`. The gates in `git-write.test.ts` and `git-ops.test.ts` check every vector the suite ran.
- **Reads:** DESIGN.md:128 lists every read form, including log pages, blame, `diff -U0`, the stash diff, `show :1/2/3:`, the commit files, the tags and the stashes.

## Files (line counts, from `wc -l`)
- **New server modules:** `git-index.ts` 194, `git-reads.ts` 154, `git-refs.ts` 121, `git-remote.ts` 96.
- **Changed server modules:** `git-write.ts` 699, `git-routes.ts` 291.
- **State (`state/sources/repositories/`):** `repositories.ts` 465, `repositories.svelte.ts` 351, `diff-rows.ts` 284, `merge-regions.ts` 224, `file-git.ts` 152, `diff-words.ts` 132, `diff-patch.ts` 76, `graph-lanes.ts` 75.
- **Views, diff and graph:** `Diff.svelte` 388, `DiffFile.svelte` 381, `Graph.svelte` 308, `Lanes.svelte` 71, `CommitFiles.svelte` 87.
- **Views, merge and refs:** `Merge.svelte` 242, `MergeSide.svelte` 177, `Stashes.svelte` 98, `Tags.svelte` 83.
- **Views, Repositories:** `Repositories.svelte` 335, `Repo.svelte` 279, `RepoList.svelte` 107.
- **Other views:** `CommitBox.svelte` 179, `Gutter.svelte` 194, `Source.svelte` 421.
- **Status bar:** `RepoItems.svelte` 172, `SourceItems.svelte` 193.
- **Shared controls:** `Prompt.svelte` 173, `AskConfirm.svelte` 36.
- **Tests:**
  - `tests/browser/scm/`: diff 133, history 93, merge 67, refs 66, scm.ts 102.
  - Server: `git-ops.test.ts` 675, `git-reads.test.ts` 273.
  - State and views: repositories state test 864, repositories views test 708.

Every file is under 900 lines and every component under 540 (size-check exit 0).

## Paths outside the brief
- `data/model/index.ts`, `model-sessions.ts`
- `state/client/context.ts`
- `state/sessions/source.svelte.ts`
- `state/workbench/navigation/status.ts`, `editor-status.svelte.ts`
- `shell/status/SourceItems.svelte`, `status-items.ts`
- `ui/forms/Prompt.svelte`, `prompt.ts`, `TextArea.svelte`
- `views/shared/AskConfirm.svelte`, `ask.ts`
- `views/boards/deposit/Deposit.svelte`
- `views/system/status/Status.svelte` (import path only)
- `routes/+page.svelte`
- `config/text/views/sources/source.yml`
- `themes/tokens.css`, and `themes.css` (the seven `--c-scm-*` tokens in all 16 colour themes)
- `tests/server/root/watch/repos.ts`
- `tests/checks/tree/allow-duplication.txt` (7 entries removed, because the duplications they allowed are gone)
- the re-pointed directives listed above

## Judgment calls
- The Editor draws its line numbers through Gutter.
- The status bar sync item runs the sync itself rather than opening Repositories.
- Blame is of the saved file.
- A changed word is filled with the hue and drawn in its on-colour; the `-bg` tint is 20% of the hue.
- Prompt moved to `ui/forms`.
- A deletion at the end of the file draws its wedge at the foot.
- Pull uses the repository's own configuration, so git refuses a pull of a divergent branch that has no pull config.
- The graph skips its read for a repository with no commit.
- The diff pane starts with no change current until Alt+F5 or Next Change moves to one.

## Before and after, visible
- **Repositories view.** Before: a list of changed files and branches. After: VS Code's Source Control layout:
  - a Repositories list;
  - the commit box with its four ways;
  - Merge Changes, Staged, Changes and Untracked, each with head actions;
  - Graph, Stashes, Tags, Branches and Worktrees;
  - the `...` menu with the remote, stash and tag actions.
- **Diff.** Before: a single inline pane. After: side-by-side or inline, with word marks, folds, change navigation, Open File, and hunk and line actions.
- **Source tab.** New gutter marks, a Blame toggle, and a blame status item.
- **Status bar.** Publish Branch, and a sync that pulls and then pushes.

## Problems I know of
- Browser revert-check results are unreliable while other builders use port 8792. Cases that the port clash stops from running are reported as unproven. This comes from the shared port, not from these changes.
- One earlier full vitest run had a single timeout (the graph-page case). That is now fixed, and the following runs were clean.

## Wrong in the brief
Nothing found.
