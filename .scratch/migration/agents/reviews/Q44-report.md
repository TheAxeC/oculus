# Step Q44 builder report

Everything in the brief is done. Two files outside the paths in decision 3 were edited, and one wrong sentence in the Sessions view was left alone because it is outside those paths. All three are listed under "Outside decision 3's paths" below.

## DONE / NOT DONE (all commands run from `tools/oculus` in the q44 worktree, on the final tree)

| Item | State | Command and output |
|---|---|---|
| 1. `rev-parse --git-dir` decides repository or not; `GitState.repository: boolean` | DONE | `npx vitest run tests/server/git.test.ts`: "does not take a plain directory" (repository false, error set), "comes back empty for a path that does not exist" (repository false) |
| 2. No-commit repository reads its branch through `symbolic-ref --short HEAD`, with no error, an empty log, no ahead or behind, and its untracked and staged files | DONE | "reads a repository with no commit in it, its branch and its files, as no error": `git init`, one untracked and one staged file; checks branch `work`, error null, untracked `loose.txt`, staged `staged.txt` A, log [], branches [], 0/0, upstream false |
| 3. Picker lists every `repository: true`; a failed read keeps its place and draws one error row instead of the sections; the shown repository is kept | DONE | state test "offers a repository with no commit yet and one whose read failed, and keeps showing it"; view test "draws a repository whose read failed as its error row and no section" |
| 4. The `upstream` comment and "error means not a repository" sentences in my paths | DONE | `model-sessions.ts` comments on `upstream`, `repository` and `error`; `git.ts` `statusFor` doc; `repositories.ts` `repositoryRoots` and `shownRoot` docs; `Repositories.svelte` head comment |
| Server test over a repository whose status fails | DONE | "keeps a repository whose status cannot be read a repository, with the reason" writes garbage to `.git/index`, so `git status` really fails ("index file smaller than expected"). A timeout of 0 could not be used: `milliseconds()` turns 0 back into the default. |
| Browser: a scratch `git init` root is in the picker and can be switched to | DONE | new test "lists a repository with no commit yet and switches to it" |
| `npx vitest run --reporter=dot` | DONE | `Test Files 241 passed (241)`, `Tests 4055 passed (4055)` |
| `npm run check` | DONE | `COMPLETED 1194 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run build` | DONE | `built in 8.36s`, exit 0 |
| `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| `npm run lint` | DONE | `eslint .` printed no problem |
| ASCII gate (the perl command in the brief) | DONE | printed nothing |
| `npm run build` then `npx playwright test tests/browser/repositories.spec.ts` | DONE | `7 passed (16.8s)`. Port 8792 was held by another run, so a loop waited until it was free and retried; no lock or pid was touched. |

## Reverts run (each applied, the named test run, then the file restored and compared with `cmp`)
- R1, drop the `symbolic-ref --short HEAD` read: the server test failed with `expected 'ambiguous argument 'HEAD': unknown ...' to be null`. The browser test, after a rebuild, failed at `section.getByText('start')`: the repository is still in the picker but is drawn as its error row. I rebuilt after restoring and reran all 7 tests green.
- R2, `repository: true` when `--git-dir` fails: "does not take a plain directory" failed with `expected true to be false`.
- R3, `return empty(reason)` when status fails: "keeps a repository whose status cannot be read" failed with `expected false to be true`.
- R4, `repositoryRoots` filtering on `error === null`: the new state test failed with `expected [ '/hub', '/fresh' ] to deeply equal [ '/hub', '/fresh', '/broken' ]`. The same revert makes the view test fail (`to contain 'data-root="/other"'`).
- R5, draw `Repo` whenever `held` is set: the view test failed with `expected +0 to be 1`.
- R6, `['symbolic-ref', 'HEAD']` instead of the reading form: both source gates failed, "holds only the read-only commands..." (literal missing) and "ran nothing but those commands" (`symbolic-ref HEAD: expected [[ 'symbolic-ref', '--short', ...]] to deep equally contain [ 'symbolic-ref', 'HEAD' ]`).
- R7, picker fed by `gitRoots()` unfiltered: "offers only the roots git reads as repositories" failed.
- R8, drop the `--git-dir` read: both count tests in `tests/server/watch/git.test.ts` failed with `expected 7 to be 8`.
- R9, `repositoryRoots` returns `roots` whole: "offers the roots git reads as repositories and no other" failed.

## Outside decision 3's paths (for the orchestrator to check)
1. **`tests/server/watch/git.test.ts`, edited.** One read of an ordinary repository now runs 8 git commands instead of 7, because `rev-parse --git-dir` is added. The two exact counts went from 7 to 8, with their comments and revert lines (R8). This is not a loosened threshold; the count is still exact. Every read of every root costs one more git process.
2. **`tests/sessions-fixture.ts`, edited.** It gains `repository: true`, which the required field needs for `npm run check` to pass. `tests/views/sessions.test.ts` still builds `git({ error: 'not a git repository' })`, which now carries `repository: true`. The sessions view does not read the field, so no assertion changes, but that fixture no longer describes a real non-repository. I left it because it did not break.
3. **Not fixed, out of paths: the Sessions view's Changes panel.** `src/lib/views/sessions/Changes.svelte:206-209` draws `sessions.ch_norepo` ("This workspace is not a git repository.", `config/text/views/changes.yml:47`) whenever `error` is set. So a repository whose read failed is still called "not a git repository" there. `Changes.svelte:70` also skips the branch fetch on any error. The fix is to test `repository` and give a failed read its own wording. Separately, a repository with no commit now shows the full repository panel in Sessions instead of "not a git repository", because its state has no error.

## Decisions for the orchestrator (reversible)
- Catalog key `repositories.error: 'git could not read this repository: {0}'`, where `{0}` is git's short reason.
- The error row is `ui/TreeItem` with `tone="error"`, the style the explorer's own failed-read rows use (`files.notes_failed`). The brief's "muted error row" has no single tone that matches it.
- The row is wrapped in `<div data-root={shown} data-repo-failed>`, so `[data-view="repositories"] [data-root]` still names the shown root.
- If the branch read fails (both `rev-parse --abbrev-ref HEAD` and `symbolic-ref`), the state keeps `repository: true`, takes the rev-parse reason as `error`, and skips the other reads.
- The server gate is tighter: `rev-parse` may only run as `--git-dir` or `--abbrev-ref HEAD`, `symbolic-ref` only as `--short HEAD`, and `worktree` only as `list --porcelain`. This is checked both in the source and against every argument vector recorded. `symbolic-ref HEAD <ref>` would move HEAD, which is why that one is pinned.
- I removed a view test for a no-commit repository that I had drafted: no revert could turn it red. The server and browser tests cover that case.

## Limitations
- If `rev-parse --git-dir` itself times out (a slow mount), the state is `repository: false` with "git timed out". The picker then drops that repository and the view moves to another one for that read. Only failures after the repository check keep the view where it is. Not covered by a test.
- A root inside a repository (a subfolder) answers `--git-dir` and counts as a repository. The old `rev-parse --abbrev-ref HEAD` check behaved the same way.

## Visible changes, before and after
- A repository with no commit yet. Before: `rev-parse --abbrev-ref HEAD` fails, so the state has an error and the picker leaves the repository out (the old server test expected `error` to be truthy). After: it is listed under its folder name and shows its branch line (branch `start` in the browser test), `loose.txt` under Changes, and "No commit has been made here yet." under Commits.
- A repository whose read fails. Before: it is dropped from the picker, and the view moves to the first other repository (the R4 view failure shows `/hub` drawn instead of `/other`). After: it stays in the picker under its name and the view stays on it. The sections are replaced by one error-hue row, "git could not read this repository: index file smaller than expected".
- A folder that is not a repository: unchanged, still not in the picker.

## Doc text (not edited, per decision 2)
HELP.md, line 140. After its first sentence, insert:
"A repository with no commit yet is listed like any other, with its branch and its files. A repository git could not read this time stays in the picker and shows git's reason as one line in place of its sections, and the view stays on it."

DESIGN.md, line 165. Replace the opening up to "and a test asserts both." with:
"**Git.** Exactly nine read-only commands (`rev-parse --git-dir`, `rev-parse --abbrev-ref HEAD`, `symbolic-ref --short HEAD`, `rev-list --left-right --count`, `status --porcelain=v1 -z`, `diff --numstat -z`, `log -<n> --format=`, `branch --format=`, `worktree list --porcelain`), one subprocess call site, a five-second timeout, list arguments only. No writing subcommand appears in the module, `worktree` is pinned to its listing and `symbolic-ref` to the read of HEAD, and a test asserts both."

DESIGN.md, line 318 (the Repositories view entry). After "through a picker over the roots that are git repositories", add:
"(`GitState.repository`, read by `rev-parse --git-dir`; a repository with no commit yet reads its branch by `symbolic-ref --short HEAD` and is no error, and a repository whose read failed stays in the picker and draws its `error` as one row in place of the sections)"

## Files changed (diff +/-, lines now)
- `src/lib/server/git.ts`: +38/-12, 367
- `src/lib/data/model-sessions.ts`: +14/-4, 478
- `src/lib/state/repositories.ts`: +7/-5, 220
- `src/lib/views/Repositories.svelte`: +13/-4, 211
- `config/text/views/repositories.yml`: +1, 53
- `tests/server/git.test.ts`: +87/-11, 522
- `tests/server/watch/git.test.ts`: +7/-5, 710
- `tests/sessions-fixture.ts`: +1, 126
- `tests/state/repositories.test.ts`: +19/-2, 458
- `tests/views/repositories.test.ts`: +29/-6, 391
- `tests/browser/repositories.spec.ts`: +49, 301

Numbers are from `git diff --numstat` and `wc -l` before the last comment-only edits to `tests/server/watch/git.test.ts` and `tests/browser/repositories.spec.ts`; for those two files they may be off by a line or two.

Grep for the changed names across src, tests, config, HELP.md, DESIGN.md and README.md: `grep -rn "rev-parse\|symbolic-ref" ...` finds `rev-parse` and `symbolic-ref` in `git-write.ts` and `deposit-git.ts`, which are other modules with their own call sites and unaffected, plus DESIGN.md:165, covered by the doc text above. `grep -rn "repositories\.error\|\.repository\b\|repository: (true|false)"` finds only the files listed here. The watch/git.ts comments about "the empty shape statusFor gives a directory that is not a repository" (lines 126, 204, 218) are still true.


Everything in the brief and in the repair round is done. What the round leaves open is booked for later, not missed: the Sessions view's Changes panel (ruling 5) and the six `oculus-repositories-fresh-*` folders earlier runs left in `$TMPDIR` (ruling 6 left older leaks alone).

## DONE / NOT DONE (first round; every command rerun on the final tree, from `tools/oculus` in the q44 worktree)

| Item | State | Proof |
|---|---|---|
| 1. `rev-parse --git-dir` decides; `GitState.repository` | DONE | `tests/server/git.test.ts`: "does not take a plain directory", "comes back empty for a path that does not exist" |
| 2. A repository with no commit reads through `symbolic-ref --short HEAD` | DONE | "reads a repository with no commit in it, its branch and its files, as no error" |
| 3. Picker over `repository: true`; failed read shows an error row; view stays on it | DONE | state "offers a repository with no commit yet and one whose read failed, and keeps showing it"; view "draws a repository whose read failed as its error row and no section" |
| 4. Comments follow the new field | DONE | `model-sessions.ts` (`upstream`, `repository`, `error`), `git.ts`, `repositories.ts`, `Repositories.svelte`, `Repo.svelte` |
| Browser: a no-commit root is listed and can be switched to | DONE | "lists a repository with no commit yet and switches to it" |
| `npx vitest run --reporter=dot` | DONE | `Test Files 241 passed (241)`, `Tests 4060 passed (4060)` |
| `npx vitest run tests/views/sessions.test.ts tests/server/watch/git.test.ts` | DONE | `Test Files 2 passed (2)`, `Tests 80 passed (80)` |
| `npm run check` | DONE | `COMPLETED 1194 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run build` | DONE | `build-exit=0` (`built in 5.26s` on the separate run) |
| `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| `npm run lint` | DONE | `eslint .` printed no problem |
| ASCII gate (the perl command) | DONE | printed nothing |
| `npm run build` then `npx playwright test tests/browser/repositories.spec.ts` | DONE | `7 passed (17.4s)`. A loop waited for port 8792 to come free; no lock was touched. |

## Repair round

| Ruling | State | Proof |
|---|---|---|
| 1. A check that does not answer keeps `repository: true` | DONE | See below |
| 2. `tone="error"` kept | DONE | View case asserts `class="item...error`; Doc text below says so |
| 3. Branch line and path stay above the error row when a branch is named | DONE | See below |
| 4. Failed branch read keeps `repository: true` | DONE | See below |
| 5. Sessions fixtures carry `repository: false`; panel booked for later | DONE | `tests/views/sessions.test.ts:194` and `:588` now read `git({ branch: '', repository: false, error: 'not a git repository' })`. That file passes: 80 tests with the watch file. The panel is not built here. |
| 6. The new browser case removes its folder | DONE | See below |
| 7. `branch` pinned at run time; comments and titles say what the gate holds | DONE | See below |
| 8. Branches line and New branch control on a no-commit repository | DONE | See below |
| 9. Doc text updated | DONE | Section below |

**Ruling 1.**
- `Outcome` gains `answered`. It is false when node returns an `error` (a timeout, a spawn failure) or when there is no exit status (killed by a signal).
- `state()` (`git.ts`) returns `empty()`, which has `repository: false`, only when `--git-dir` failed and git answered. Otherwise it returns `repository: true` with the error set.
- Server case "keeps a root whose repository check did not answer, and the view on it": the recorder in the test's `node:child_process` mock answers the `--git-dir` vector as ETIMEDOUT and then as ENOENT. Both a repository and a plain folder come back `repository: true`, error `git timed out` / `spawnSync git ENOENT`. `repositoryRoots` keeps both and `shownRoot` stays on the repository. Once git answers again, the folder is `repository: false`.
- State case "offers a root whose repository check did not answer, and keeps showing it".

**Ruling 3.**
- The error row moved into `views/repositories/Repo.svelte`. `{#if git.branch !== ''}` draws the branch line and the path. `{#if git.error !== null}` draws the row in place of the `TreeView`.
- `Repositories.svelte` draws `Repo` again for any held state.
- View case "keeps the branch line and the path above the error row while the state names a branch": with branch `work` both lines come before `data-repo-failed`; with branch `''` neither is drawn.

**Ruling 4.** Server case "keeps a repository git names no branch for a repository, with the reason" writes `ref: refs/heads/../bad` to `.git/HEAD`, a real repository where both HEAD reads fail. It checks `repository: true`, error set, branch `''`.

**Ruling 6.**
- The case body is wrapped in `try { ... } finally { rmSync(fresh, { recursive: true, force: true }) }`.
- `ls -d $TMPDIR/oculus-repositories-fresh-* | wc -l` gave 6 before the green run, 6 after it, and 6 after the red revert run. Those six are from earlier runs; this case adds none, even when it fails.

**Ruling 7.**
- `PINNED` covers `branch: [['branch', BRANCH_FORMAT]]`, the two `rev-parse` vectors, `symbolic-ref --short HEAD` and `worktree list --porcelain`.
- `PINNED_SOURCE` checks each call is written as that list literal in the source.
- The run-time gate checks every recorded pinned vector against `PINNED`.
- Rewritten: the head comment (`tests/server/git.test.ts:8-14`), the `PINNED` doc comment, and both gate titles ("the pinned four as their exact vectors" / "as their vectors").
- `git.ts`'s head comment now says `branch`, `worktree` and `symbolic-ref` run only as the vectors written there.
- `model-sessions.ts` `repository` doc names all three false cases: not a directory (or missing); git answered `--git-dir` with "no repository"; the read threw before git answered, which is the `statusFor` catch. Everything else is true.

**Ruling 8.**
- `state/repositories.ts` `noCommitYet(git)`: no error, a branch named, not detached, and an empty branch listing.
- `Branches.svelte`: the empty line reads `repositories.branches_unborn` ("{0} has no commit yet, and git lists a branch only from its first commit."); otherwise it reads `branches_empty` as before.
- The New branch create `ToolButton` gets `disabled={busy || unborn}` and the title `repositories.branch_new_unborn` ("A new branch starts from a commit, and this repository has none yet.").
- New worktree is unchanged.
- View case "says a repository with no commit has no branch to list, and offers no branch to make" also checks that a repository with commits keeps the control live and has no such title.

### Reverts run
Each revert was applied, the named test run, the file restored, and all 14 files compared with `cmp` against a copy. No file differed.
- **RA** (`if (!gitDir.ok)`, answered ignored): "keeps a root whose repository check did not answer" failed with `ETIMEDOUT .../repo: expected false to be true`.
- **RB** (`repositoryRoots` on `error === null`): state case failed with `expected [ '/hub' ] to deeply equal [ '/hub', '/slow' ]`.
- **RC** (branch line only when `error === null`): view case failed with `...to contain 'branch'`.
- **RD** (`found.repository = false` when both HEAD reads fail): server case failed with `expected false to be true`.
- **RE1** (`disabled={busy}`): view case failed with `...to contain 'disabled'`.
- **RE2** (the empty line always `branches_empty`): view case failed with `...to contain 'start has no commit yet...'`.
- **RF** (`['branch', '--list', BRANCH_FORMAT]`): both gates failed, on the source literal and on `branch --list --format=...: expected [[ 'branch', ...(1) ]] to deep equally contain [ 'branch', '--list', ...(1) ]`.
- First-round reverts rerun on the repaired code, all red:
  - R1: `expected 'ambiguous argument 'HEAD'...' to be null`.
  - R2: `expected true to be false`.
  - R3: `expected false to be true`.
  - R4: `[ '/hub', '/fresh' ]` vs `[..., '/broken']`.
  - R5, never the error row (now in `Repo.svelte`): `expected +0 to be 1`.
  - R6, `['symbolic-ref', 'HEAD']`: 3 failed, including the run-time gate `symbolic-ref HEAD: expected [[ 'symbolic-ref', '--short', ...]] to deep equally contain [ 'symbolic-ref', 'HEAD' ]`.
  - R7, unfiltered picker: failed.
  - R8, no `--git-dir` read: both watch counts `expected 7 to be 8`.
  - R9, `return roots`: failed.
- Browser, R1 rebuilt: "lists a repository with no commit yet and switches to it" failed at `getByText('start')` (`element(s) not found`). After restoring (`cmp` restored) and rebuilding, all 7 passed.
- Ruling 5 has no revert: it changes two fixtures so they describe a non-repository, and no assertion depends on the field.

## Decisions for the orchestrator (reversible)
- Two catalog keys added: `repositories.branches_unborn` and `repositories.branch_new_unborn`, wording as above.
- `noCommitYet` works from the existing fields, with no new `GitState` field (decision 1). If the branch listing read itself fails on a repository with commits, it looks the same and gets the no-commit wording and a disabled control. Not covered by a test.
- A process killed by a signal (no exit status, no node error) also counts as not answered.
- The `statusFor` catch (an exception inside `state()`) still returns `repository: false`. I found no input that reaches it: a path node refuses is caught by `directory()` first. `model-sessions.ts` names this case.
- A git binary that cannot start makes every existing root `repository: true` with the ENOENT reason, so the picker lists every root, plain folders included, each with its error row. This follows ruling 1.

## Limitations
- The Sessions view's Changes panel (`sessions/Changes.svelte:70`, `:206-209`, `config/text/views/changes.yml:47`) still calls any read failure "not a git repository" and skips its branch fetch. Booked for a later step under ruling 5.
- Every read of a root costs one more git process: 8 per repository read instead of 7 (watch test).

## Doc text (not edited, per decision 2)
**HELP.md, line 140.** Insert after its first sentence:
"A repository with no commit yet is listed like any other, with its branch and its files; its Branches section says the branch has no commit yet, and New branch is disabled until the first commit, since a branch starts from one. A repository git could not read this time, or whose check did not answer in time, stays in the picker and the view stays on it: the branch line and the path stay while git named the branch, and git's reason is one line in the error colour in place of the sections."

**DESIGN.md, line 165.** Replace the text up to "and a test asserts both." with:
"**Git.** Exactly nine read-only command forms over eight subcommands (`rev-parse --git-dir`, `rev-parse --abbrev-ref HEAD`, `symbolic-ref --short HEAD`, `rev-list --left-right --count`, `status --porcelain=v1 -z`, `diff --numstat -z`, `log -<n> --format=`, `branch --format=`, `worktree list --porcelain`), one subprocess call site, a five-second timeout, list arguments only. No writing subcommand appears in the module; `branch`, `symbolic-ref` and `worktree`, which have writing forms, and `rev-parse` are held to those exact vectors in the source and in every command the suite ran, and a test asserts both."

**DESIGN.md, line 318 (the Repositories view entry).** After "through a picker over the roots that are git repositories", insert:
"(`GitState.repository`, false only when the root is not a directory or git ran `rev-parse --git-dir` to its end and answered that it is no repository, so a check that timed out or never started keeps the root; a repository with no commit yet reads its branch by `symbolic-ref --short HEAD` with no error, says so in its Branches section and disables New branch; a repository whose read failed stays in the picker and the view stays on it, drawing its `error` as one row in the explorer's row style and the error hue, as the Files view's failed reads are drawn, in place of the sections, below the branch line and the path whenever the state names a branch)"

## Files changed (git diff --numstat, then wc -l, on the final tree)
- `config/text/views/repositories.yml`: +3/-0, 55
- `src/lib/data/model-sessions.ts`: +17/-4, 481
- `src/lib/server/git.ts`: +60/-18, 383
- `src/lib/state/repositories.ts`: +17/-5, 230
- `src/lib/views/Repositories.svelte`: +8/-3, 207
- `src/lib/views/repositories/Branches.svelte`: +13/-2, 112
- `src/lib/views/repositories/Repo.svelte`: +92/-79, 235 (mostly the `TreeView` indented one level inside `{:else}`)
- `tests/browser/repositories.spec.ts`: +56/-1, 307
- `tests/server/git.test.ts`: +168/-13, 601
- `tests/server/watch/git.test.ts`: +7/-5, 710
- `tests/sessions-fixture.ts`: +1/-0, 126
- `tests/state/repositories.test.ts`: +31/-2, 470
- `tests/views/repositories.test.ts`: +79/-6, 441
- `tests/views/sessions.test.ts`: +2/-2, 944

`tests/server/git.test.ts` now imports `state/repositories.ts` for the view-keeping part of the ruling 1 case; `tests/boundaries.test.ts` passes in the full suite. `git status --short` shows these 14 files and nothing else.
