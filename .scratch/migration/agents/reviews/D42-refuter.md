# Step D42 refuter report (on .agents/worktrees/D42, base 81c779ac2)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

```
$ sh ~/.claude/skills/land/templates/checks.sh .../migration/orchestrator-state.md   (from tools/oculus in the worktree; tail)
ok      prettier (10.2 s): All matched files use Prettier code style!
ok      ASCII gate (10.8 s)
ok      svelte-kit sync (25.1 s)
ok      eslint (70.0 s)
ok      vitest (71.1 s): Duration  55.64s (transform 160.32s, setup 0ms, import 199.74s, tests 19.48s, environment 105ms)
ok      svelte-check (66.3 s): 1791157541887 COMPLETED 356 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 91.9 s (limit 45.0 s); every command passed
test:quick: over the time limit
checks: 1 commands passed
(the time is over the 45 s limit on this run under the load of several suites at once; the builder's run printed 18.7 s)

$ npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/tree/size.test.ts tests/checks/tree/duplication.test.ts tests/checks/config/config.test.ts tests/checks/source/keys.test.ts tests/checks/source/history.test.ts tests/checks/source/comment-width.test.ts
 Test Files  7 passed (7)
      Tests  80 passed (80)

$ npx vitest run tests/shell/panes/strip/tab-menu.test.ts      (G28, imports tab-menu-state.svelte.ts)
 Test Files  1 passed (1)
      Tests  2 passed (2)

$ LC_ALL=C perl ... (spec.md's ASCII gate) over src tests config (local.yml excluded), HELP.md, DESIGN.md, D42-report.md
(prints nothing; exit 0)

$ sh utils/unused-exports.sh, diffed with .agents/worktrees/D42-base/unused-exports.txt
361c361
< src/lib/state/workbench/layout/index.ts: Keeps, PageLeaf, Split, Refusal, LayoutStorage, Attention, Beside, ShowInFiles
---
> src/lib/state/workbench/layout/index.ts: Keeps, PageLeaf, Split, Refusal, LayoutStorage, Attention, Beside
(matches the report: no line added, ShowInFiles leaves the list)

$ grep -rn --exclude=local.yml "timeline_failed\|timeline_row_title\|timeline_commit_diff\|FILE_LOG_ENTRIES\|showTimeline\|menu_timeline\|before=" src config
(the same hits the report lists: tab-menu-state.svelte.ts:116, tab-menu.ts:89, files.ts:19/58/86/100/101, git-reads.ts:163, changes.svelte.ts:118 (unrelated), show-in-files.ts:20/79, layout.svelte.ts:217/817, ShowPath.svelte:4/8, row-menu.ts:265/341/361/492, Timeline.svelte:168/197, files.yml:110/209/226; no timeline_failed)

$ git status --short (worktree): 34 modified paths under tools/oculus, untracked HunkBar.svelte, timeline-state.svelte.ts, D42-report.md; no path under tests/.

Probe of parseFileLog against real git 2.49.0 output, scratch repository $TMPDIR/d42-refute/repo (sub/old.txt renamed to sub/new.txt with an edit, a side branch merged, "sub/with space.txt", a name with an accented letter and a tab, renamed). node imports parse.ts from the worktree and runs
git log --follow -z --name-status --diff-merges=first-parent FILE_LOG_FORMAT -51 [<before>^] -- <path>  (GIT_LITERAL_PATHSPECS=1):

od -c of the raw output: each record "036 <hash> 037 ... 037 <cI> \0 \n M \0 sub/new.txt \0 036 ...", the rename "\0 \n R 0 9 7 \0 sub/old.txt \0 sub/new.txt \0".

$ node probe.mjs repo sub/new.txt
eb6a9d9 "fifth: after merge" path="sub/new.txt" from="sub/new.txt" Probe probe@example.com 2026-10-05T01:47:33+02:00
79f87cd "Merge side into main" path="sub/new.txt" from="sub/new.txt" ...
228ec4a "side: change new.txt" path="sub/new.txt" from="sub/new.txt" ...
0d6e65a "third: rename old to new" path="sub/new.txt" from="sub/old.txt" ...
6af55e4 "second: change old.txt" path="sub/old.txt" from="sub/old.txt" ...
71cebce "first: add old.txt" path="sub/old.txt" from="sub/old.txt" ... 2026-01-01T10:00:00+01:00
$ node probe.mjs repo "sub/with space.txt"
eb6a9d9 "fifth: after merge" path="sub/with space.txt" ...
71cebce "first: add old.txt" path="sub/with space.txt" ...
$ node probe.mjs repo "renamed <e-acute>.txt"
43b420d "rename accented" path="renamed <e-acute>.txt" from="Lozano_Jim<e-acute>nez tab\there.txt" Jos<e-acute> ...
0e2b9ac "accented and tab" path="Lozano_Jim<e-acute>nez tab\there.txt" ...
$ node probe.mjs repo sub/old.txt 0d6e65a        (page after the rename, at its from)
6af55e4 ..., 71cebce ...
$ node probe.mjs repo sub/old.txt 71cebce        (root commit as cursor)
git refused: fatal: bad revision '71cebce^'
A merge whose first-parent diff does not touch the file (side2 changed other.txt only): git does not list it, so the parser's no-status branch is not reached.

$ node probe.mjs repo sub/new.txt 79f87cd        (page after the merge)
0d6e65a ..., 6af55e4 ..., 71cebce ...           (228ec4a, listed on the first page after the merge, is missing)

$ node probe.mjs repo/sub new.txt                (served root = the sub-folder sub/)
eb6a9d9 ... path="sub/new.txt" ... (every path relative to the repository's top)
$ git -C repo/sub show --format= --no-color --no-ext-diff -M --diff-merges=first-parent 6af55e4 -- sub/old.txt | wc -l
       0
$ (same) -- old.txt | wc -l
       9
$ node probe.mjs repo/sub sub/old.txt 0d6e65a | wc -l
       0
$ git -C repo/sub log --follow --relative -z --name-status --diff-merges=first-parent --format='%x1e%h %s' -51 -- new.txt
#...M|new.txt|...#0d6e65a third: rename old to new|R097|old.txt|new.txt|...   (root-relative paths, rename kept)
```

## Verdicts

Items of the brief's "What to build":

- 1: violated for a served root that is a sub-folder of its repository (Behaviour 1): the commit row opens the change at a path relative to the repository's top, which the diff read from that root does not find. Holds for every other root: the parser reads real output correctly (probe above: rename, merge, space, accented letter, tab).
- 2: violated for a history with merges (Spec 1): the page after a merge or after a side-branch commit loses commits. Holds for a linear history (cursor probe after the rename and the root-commit refusal above; `files.ts:69-110`, `git-reads.ts:259-264`, `timeline-state.svelte.ts:71-113`).
- 3: holds by reading: commits keyed by branch and `log[0]` (`Timeline.svelte:109-124`, `fs-history.ts:954-963`); copies marked by the `files` message of their root and on a version gap (`fs-history.ts:899-914`).
- 4: violated (Spec 2): the followed file exists only while the Timeline component is mounted.
- 5: holds by reading (`show-in-files.ts`, `reveal.ts:800-815`, `ShowPath.svelte:101-111`, `row-menu.ts:265`, `tab-menu.ts:89`).
- 6: holds by reading (`Timeline.svelte:246-268`, `files-view.ts` shape with `.catch` defaults); Open Timeline releasing a pin is the builder's reported judgment call 1, under "Declined to judge".
- 7: partial (Standards 1): the commit diff's failure line names a 7-character prefix, which is not the commit's short hash in this repository.
- 8: holds by reading (`HunkBar.svelte`, ResizeObserver, `compact`, `.whole` inside `ui/menu/Tooltip.svelte`'s `min-width: 0` wrapper); the drawn result is the look's.
- 9: holds: HELP.md:44, :120, :211, DESIGN.md:128 and :422, `run.ts` head and every listed head comment rewritten (word diff read).

Cases of the brief's "Cases":

- 1: not verifiable here; the reading gives the row and tooltip (`Timeline.svelte:167-181`, `:338-362`); the look settles it.
- 2: met by reading: `row.path` is the old path (probe), `commitDiff` reads it there.
- 3: met by reading: `commitDiff` pairs the rename's `from` with the new path (`reads.ts:118-121`).
- 4: met by reading, as case 3.
- 5: not verifiable here; the look settles it.
- 6: met by reading and the probe's accented/tab name.
- 7: not verifiable here; the reading gives Load more, Reading... and one request (`pages.next` returns while loading).
- 8: met by reading (`timeline.ts`, the `oldest` filter).
- 9: met by reading (the HEAD key; later pages dropped by the key).
- 10: met by reading (the git watcher publishes `files` for a write under the hub root; the copies key is marked).
- 11: met by reading.
- 12: met by reading (`repoOfFile` null, `logged` null).
- 13: met by reading.
- 14: met by reading: the engine root is left out of the git channel (`server/files/roots.ts`, `repositoryRoots`), so the file maps to the hub repository.
- 15: met by reading for the row's diff; git does not list a merge whose first-parent diff misses the file (probe). The paging loss is Spec 1.
- 16: met by reading.
- 17: met by reading (`Timeline.svelte:312-321`, no engine text).
- 18: partial, Standards 1.
- 19: met by reading once the Files tab has been mounted; see Spec 2 for a Files tab not yet shown.
- 20: met by reading.
- 21: met by reading.
- 22: met by reading; the scroll is the look's.
- 23: met by reading.
- 24: met by reading (`rowStores.showTimeline`).
- 25: met by reading.
- 26: met by reading.
- 27: met by reading.
- 28: met by reading.
- 29: met by reading.
- 30: met by reading.
- 31: met by reading.
- 32 to 36: not verifiable here; the look settles them.
- 37: met by reading (`HASH` check before git, 400).
- 38: met by reading and probe (root commit refused).
- 39: met by reading (`-51`, slice 50).
- 40: met by reading.
- 41: partial, Behaviour 2 (the page loads, the keyboard focus is lost).
- 42: met by reading.
- 43: met by reading.
- 44: met by reading.
- 45: met by reading.
- 46: met by reading.
- 47: met by reading.
- 48: met by reading.
- 49: not verifiable here; the look settles it.
- 50: met by reading.
- 51: met by reading.

## 1. Spec

- 1. `files.ts:86-88` and `Timeline.svelte:229-234`: "`-${FILE_LOG_ENTRIES + 1}`, ...(before === undefined ? [] : [`${before}^`])" with `commitPage(repository.root, last.from, last.hash)`. What is wrong: the brief's premise "A cursor pages correctly" was probed on the hub, which has no merge; `<hash>^` walks the first parent only, so the page after a merge leaves out the commits that reached the file through the merge's second parent, and a page boundary on a side-branch commit leaves out main-line commits listed after it. Failure scenario: probe above, a file whose 50th row is the merge `79f87cd`: Load more lists `0d6e65a`, `6af55e4`, `71cebce` and `228ec4a` (the side commit that changed the file) is never drawn. The hub has no merge today; whether another served repository (cathedra, ordo, the others in `config/sources.yml`) has merges is not verified, since I run no git there. The shape was ruled (Z434), so this is a premise found wrong for the orchestrator to raise; verdict: item 2 violated.
- 2. `timeline-state.svelte.ts:34-49` and `Timeline.svelte:74-84`: "`let last = $state('')` ... `note(): ... if (tab !== null && deps.fileOf(tab) !== null) last = tab.id;`", built per Timeline instance and fed by an effect. What is wrong: item 4 asks for the file of the file tab activated last on the page while it is open, as state; this records it only while the Files tab's view is mounted. `PaneBody.svelte` mounts a tab's view only once shown (`kept`, `:71-76`), so a Files tab not yet shown since the page loaded knows no file. The report's reason that the fix needs the layout store outside the paths is wrong: `Pane.recent` (`state/workbench/layout/model.ts:47-58`, "the ids of the other tabs the pane showed, the one shown last first", saved with the layout) already holds the order, and the Timeline already reads `panes(layout(page))`. Failure scenario: TEST's one-pane layout (Files tab and source tabs in one pane, as the brief's decision 1 describes), page reloaded with source tab A shown, the reader presses the Files tab: the Timeline says "The active editor cannot provide timeline information." instead of A's history, exactly the moment item 4 exists for. Verdict: item 4 violated.

## 2. Proof

- none. The builder's unverified point 1 (the byte layout) is now verified by the probe above: `parseFileLog` reads real output correctly for a rename, a merge, a space, an accented letter and a tab, and its no-status branch is unreachable in practice.

## 3. Standards

- 1. `compare-words.ts:15-16` and `:39-41`: "`const SHORT = 7;` ... `t('repositories.diff_commit_failed', (subject.commit ?? '').slice(0, SHORT))`". What is wrong: item 7 asks for the commit's short hash; git abbreviates this repository's hashes to 9 characters (the brief's `f6403f406`, `4c7cf9154`), and the length is a constant guessed beside git's own `%h`. Failure scenario: case 18, the tab labelled `DiffEditor.svelte (f6403f406)` says "The change in commit f6403f4 could not be read.", two names for one commit on one tab. Verdict: item 7 partial, case 18 partial.
- 2. `fs-history.ts:869-871`: "`const NO_COMMITS: FileCommits = { commits: [], more: false, failed: false, loading: true };`" (and `NO_COPIES`), rewritten by the step and handed to every caller as `data ?? NO_COMMITS`. What is wrong: spec.md, "The principles every package is judged on": "a shared fallback object handed to callers is frozen or built per call"; the step built `noPages()` per call in its new module and left these two shared. Failure scenario: a later caller that pushes into `commits` of the fallback changes the answer every other file's Timeline draws while its read is in flight. No current caller mutates it (read).
- 3. `agents/reviews/D42-report.md`: the report quotes no grep of the added comment lines for the history words, no reuse grep before the new helpers and types (`sectionOpened`, `GitFileCommit`, `createPages`), and no grep of the renamed names (`commitsOf` to `pageOf`, `error` to `failed`, `fileVersion` out of the history keys), each of which spec.md, "What every package obeys" and "The principles every package is judged on", requires in the report. My own greps find no stale hit and no history wording (only runtime uses of "before"/"no longer"), so the code is not wrong; the reader of the report cannot see it. Failure scenario: the orchestrator lands on the report's word for checks it did not show.
- 4. The report's opening section: "One read-only `git diff HEAD --stat` ran in this session". spec.md, "Where you work": the builder never runs a git command. It changed nothing on the tree.

## 4. Behaviour

- 1. `files.ts:78-90` with `parse.ts:298-301` and `Timeline.svelte:189-197`: the rows' `path` and `from` come from `--name-status`, which git writes relative to the repository's top, while `fileLog` and `commitDiff` run from the served root (`git -C <root>`). What a user sees: for a served root that is a sub-folder of its repository, every commit row opens "Nothing to show for this one." and Load more lists nothing; before the step, the row opened its change for every commit after the last rename, since `inRepo.path` was handed to the diff. The report states it as an unverified limit with no before and after. Reachability: Add Folder to Workspace accepts a folder inside another root (`folderToAdd`, `server/files/fs.ts:542-559`, refuses only the same folder), and every added root is on the git channel (`repositoryRoots`), where `rev-parse --git-dir` succeeds inside the parent repository, so `repoOfFile` picks it as the deepest holder. Failure scenario: probe above, root `repo/sub`, row `6af55e4` at `sub/old.txt`: the diff read prints 0 lines (9 at `old.txt`), and the page after `0d6e65a` prints 0 rows. `--relative` on the same log form gives root-relative paths and keeps the rename (probe), a change inside `files.ts` and `run.ts`'s form list, both in the write list. Verdict: item 1 violated.
- 2. `Timeline.svelte:370-384`: "`{#if later.loading}` `<TreeItem label={t('files.timeline_reading')} tone="muted" />` `{:else}` `<TreeItem ... id={MORE_ID} {nav} level={2} ... />`", while `keyRows` (`:144`) keeps `MORE_ID`. What a user sees: Enter on the focused Load more row swaps the focused element for one with no id and no `level`, so the keyboard focus drops to the page and the Reading... row is drawn at another indent; nothing gives the focus back when the row returns. The report does not state it. Failure scenario: case 41, a keyboard reader presses Enter on Load more and the next arrow key moves nothing in the Timeline. Read from the code; not seen. Verdict: case 41 partial.

## Declined to judge

- Every drawn result (cases 1, 5, 7, 22, 32 to 36, 49, the hunk bar's compact switch at `ROOM = 96`, the Timeline head's scroll), since no browser or server may be used here; the look on TEST settles them.
- Open Timeline releasing a pin (`reveal.ts:800-801`, the builder's judgment call 1, stated in HELP.md): a user-visible choice no ruling names; the orchestrator's or Axel's call.
- Whether any served repository other than the hub has merges (Spec 1's reach): settled by `git log --merges -1` in each, which this review may not run.
- The builder's three limits, judged: (1) the git layout is not a finding, verified by the probe; (2) the followed file lost when the Files tab was never shown is Spec 2; (3) the sub-folder root is Behaviour 1.
- Scratch files remain at `$TMPDIR/d42-refute` (the probe repository and `probe.mjs`); nothing in the repository or the worktree was changed.

Reviewer usage: ordo-high on claude-opus-5-5 (a6b4415611d2a417e), 258,282 tokens, 81 tool uses, 13.0 min.
