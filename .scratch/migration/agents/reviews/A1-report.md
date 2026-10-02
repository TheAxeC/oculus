# A1 report: review with feedback (repair round 1)

NOT DONE: `checks.sh` was not run again after the last change, which is two added tests in `review-comment.test.ts` (the three allowed full runs were used; section 4 names what was run alone on the final tree). Nothing else inside the brief or the round file is left undone. Three things are not proved by a test, and the section "Not proved by a test" names them: the look of the comment box and its focus (Case 23 is the landing's, on the TEST page), a live change of the sessions payload under one mounted `DiffSection` (the unit suite renders a section once; `diff-pane.test.ts` proves a fresh render after the payload changes), and Monaco drawing the `+` and its right-click menu entry. The third and last `checks.sh` run ended `checks: 7 commands passed` (section 4).

## 1. The premise that did not reproduce

The brief's "What is on the tree" says `TerminalAnswer = { ok, id, error, terminal? }` is at "`state/sessions/pty-io.ts:72-90`". `ls /Users/axelfaes/workspace/research-hub/.agents/worktrees/A1/tools/oculus/src/lib/state/sessions/pty-io.ts` prints "No such file or directory". The file is `src/lib/state/sessions/terminal/pty-io.ts` (the type at `:18`, `postTerminal` at `:72`). `state/sessions` is above `state/sources` in the state folder order (`tests/checks/imports/order.ts`), so `review-comment.ts` in `state/sources` cannot import it; `SteerAnswer` (`review-comment.ts:82`) is the structural copy of the part of `TerminalAnswer` a send reads (`ok`, `error`).

## 2. Open items of the state file

Copied from `/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md`, section "Open items", at the moment of writing:

- Z251 (2026-10-02 09:40, all steps): fewer repair rounds. Axel asked whether the criteria for a round can be stricter so more steps land without one. Evidence: 12 of the last 13 landings had a round; each round's rulings (`agents/briefs/<step>-round1.md`) number 5 to 16, and every one of them holds rulings that change code or add a test. Options: (a) keep the round as ruled 2026-10-01 (`plan.md:773`); (b) land without a round when every first-review finding is small and inside the brief, as the refute dispositions already allow (none of the last 13 would have qualified, so it saves nothing); (c) `refute_after_repair: no` when the round stays inside its rulings, the orchestrator reading the delta in its place (saves about 185k to 270k tokens and 14 to 46 min per step; those runs found 4 to 9 findings that would then rest on the orchestrator's read; reverses part of the 2026-10-01 ruling); (d) fewer findings at the source: the overdue recurring-findings pass, its causes in three or more steps ending in a rule sentence in `agents/spec.md` or a sentence every brief carries. Recommendation: (d), with (a) kept until its effect shows; (b) and (c) are the lazy options, since they lower the bar and keep the cause. Axel, 2026-10-02: (d) taken through Z253; (a) stands meanwhile; Z251 is ruled after ten steps have landed under the new rules (count from the first landing after this line).

- Z263 (2026-10-02 12:40, a new step): the Files view's order and Collapse Folders. Axel asked for reorderable bookmarks and roots, and whether Collapse Folders leaving the roots open is intended. The tree: `collapseAll` (`views/sources/files/control/tab-actions.ts:94-101`) closes every folder and leaves each root's row open on purpose (its comment says so); VS Code's Collapse Folders in a multi-root workspace (`collapseAll`, `src/vs/workbench/contrib/files/browser/views/explorerView.ts:990-1007` on main, read with `curl`) closes every folder under the roots and leaves the roots open while any root has an open child, and a second press, with none open, closes the roots too. No drag reorders the roots, the folder bookmarks (Files section and rail menu), or the notes (`grep -rln drag src/lib/views/sources/files/sections` lists only Outline and Timeline, which drag a row out, not along). The rail, the terminals list, the collection entries, the focus lanes and the slides already reorder. No open step owns the Files view (X3a landed). Options: (a) a new step X3e: drag to reorder the roots (written to the workspace in force, `sources.yml` for the default one), the folder bookmarks (written to `~/.oculus/bookmarks.yml`, the rail menu following), the notes and the Files view's sections (VS Code drags its view sections), and a second Collapse Folders, with no folder under a root open, closing the roots, as VS Code's does. Pro: one step, every list of the Files view orderable as VS Code's. Con: a new step. (b) the roots and bookmarks only. Con: the notes and sections keep a fixed order. (c) nothing, the lazy option. Recommendation: (a).

## 3. What changed, per ruling

Paths are under `tools/oculus/` of the worktree. "Pre-round tree" is the tree as the first report left it, with the final tests run against it; "mutated" is the final tree with one line of the named behaviour taken out.

### 3.1 Ruling 1, the glyph margin (Spec 1, Behaviour 1)

- `src/lib/ui/controls/editor/gutter.ts:337-345`: `MONACO_GLYPH_MARGIN = true` (Monaco's default) and `glyphMarginFor(offering)`, which returns `offering || MONACO_GLYPH_MARGIN`. It is a pure function of `offering`, beside the option helpers `listedWithComment` (`:351`) and `commentActionsOn`.
- `DiffEditor.svelte:331` calls `updateOptions({ glyphMargin: glyphMarginFor(offering) })`; the effect no longer passes `offering` itself. The glyph margin is never set false.
- Test: `gutter.test.ts` "the glyph margin of a diff editor > stays on whether or not comments are offered, since Monaco draws it by default" asserts `glyphMarginFor(true)` and `glyphMarginFor(false)` are both true.
- Failing run, false case, mutated (`return offering;`): `tests/ui/controls/editor/gutter.test.ts:442:39`, the `glyphMarginFor(false)` expectation, 1 failed. Pre-round tree: "TypeError: glyphMarginFor is not a function" at `gutter.test.ts:442:16`. Passing run: 27 tests of `gutter.test.ts` pass (and 982 tests of the 19 files run together, section 4).
- The diffs that offer no comment keep the glyph margin they had: the Repositories view's file, commit, stash, worktree, compare and group diffs draw Monaco's default glyph margin as before. The diff editor's head comment (`DiffEditor.svelte:16-22`) and the effect comments (`:324`, `:342`) say so.

### 3.2 Ruling 2, the id collision (Z256)

- `src/lib/state/sources/repositories/repositories.ts:157-163`: `diffState` builds `${side}@${session}:${root}:${path}` for the file's own diff (`changed`, `staged`) opened for a non-empty session, and `${side}:${root}:${path}` otherwise. The doc comment above it (`:148-156`) is rewritten.
- `sideOf` (`repositories.ts:139-147`) does yield `@`: `compare@...` (`:141`), `group@...` (`:142`), `commit@...` (`:144`), `stash@...` (`:145`). It yields `changed` and `staged` with no `@` (`:146`), and the session goes only after those two names, so `changed@<session>:` and `staged@<session>:` are prefixes no other branch produces, and a no-session id has `:` where a session id has `@` after the same word. The tests below hold this.
- Tests, `tests/state/sources/repositories/view/diff-session.test.ts` (13 tests, all pass): the id differs from the no-session id (`:25`); two sessions and a staged diff (`:33`); determinism and an empty session (`:41`); a file `a.ts:s-1` with no session against `a.ts` for session `s-1` (`:47`); sessions named `changed`, `staged`, `/hub` and empty (`:55`); every kind of diff of one file has its own id (`:63`); no session in a commit, stash, worktree, compare or group id (`:79`); the saved-state and `openChange` tests use the new strings.
- Failing run on the pre-round tree (old form `changed:/hub:a.ts:s-1`), the collision test at `diff-session.test.ts:51:24`: `expected 'changed:/hub:a.ts:s-1' to be 'changed@s-1:/hub:a.ts'`; the file named `a.ts:s-1` has that same old id. Also failing there: `:29` "expected 'changed:/hub:src/a.ts:s-1' to be 'changed@s-1:/hub:src/a.ts'", `:38` staged, `:60` "expected 'changed:/hub:src/a.ts:changed' to be 'changed@changed:/hub:src/a.ts'", `:89` "expected 'commit@abc:/hub:src/a.ts:s-1' to be 'commit@abc:/hub:src/a.ts'", `:141` and `:154` (the `openChange` ids), and `naming.test.ts:252:33` "expected 'changed:hub:dir/b.md:s-1' to be 'changed@s-1:hub:dir/b.md'".
- Every reader and test of the old form is updated: `naming.test.ts:252` (`changed@s-1:hub:dir/b.md`), the saved-state fixture in `diff-session.test.ts` (`id: 'changed@s-1:/hub:src/a.ts'`), the `instance-state-sources.test.ts` rows (section 7). `grep -rnE "changed:|staged:" HELP.md DESIGN.md README.md src config --exclude=local.yml` finds no document or source text describing the old id.

### 3.3 Ruling 3, `diff-pane.test.ts:531`

- `tests/views/sources/repositories/diff-pane.test.ts:531-553`: after the payload holds `s-2` only and the section offers none, the payload is received again with `s-1` (`version: 2`) and the section is rendered again; the test asserts `editorProps().oncomment` is a function. Passing run: 38 tests of `diff-pane.test.ts` pass.
- The test passes on the pre-round tree too: it adds proof of the title's second half and no behaviour changed. A mutation that latches the offer off after the payload lost the session passes as well, because each `section()` call is a new mount (see "Not proved by a test").

### 3.4 Ruling 4, `changes.test.ts:411`

- `tests/views/sessions/changes.test.ts:415-441` spies `client.layout.openBeside` and `openView`, calls the row handler `onopen` of the recorded `ChangesRepo` for a changed row, a staged row, a merge row and an untracked row, and asserts the three tabs opened beside (`DIFF_VIEW` with `changed@live-one:/hub:manuscript/main.tex`, `DIFF_VIEW` with `staged@live-one:/hub:manuscript/main.tex`, `MERGE_VIEW` with `merge:/hub:both.txt`), that the untracked row opened no tab, and that its outcome is the sentence `repositories.open_unserved` for `notes/new.txt` (no root is served in this fixture, so the row's file-open path ends there).
- Failing runs: pre-round tree, `changes.test.ts:429:24` (`expected [ [ 'repositories-diff', ...(1) ], ...(2) ] to deeply equal ...`, the old ids). Mutated, the merge branch of `openChange` removed (`repositories.svelte.ts:364`): `:429:24` fails; the untracked branch removed (`:365`): `:429:24` fails; `Changes.svelte:204` without `record?.id`: `:429:24` fails. Passing run: 30 tests of `changes.test.ts` pass.

### 3.5 Ruling 5, `diff-session.test.ts:42`

- `diff-session.test.ts:25-31` asserts `own` is not `plain` (the session diff's id differs from the same file's no-session id), and `:63-77` asserts nine diffs of one file have nine ids. Mutated, with the session part taken out of the id (`const id = \`${side}:${place}\``): 7 of 13 fail, among them `:29:21` "Expected: "changed@s-1:/hub:src/a.ts" Received: "changed:/hub:src/a.ts"" and the nine-ids test at `:76:35`.

### 3.6 Ruling 6, case 17

- `gutter.ts:351-359`: `listedWithComment(listed, offering, label)` returns the palette's actions with Add Comment on Line when comments are offered and a label is given, and the chords alone otherwise. `DiffEditor.svelte:358` calls it inside the actions `$effect`; the second `onactions` call is gone.
- Tests, `gutter.test.ts` "is listed with the parent label while comments are offered, and not otherwise" (both values of `oncomment`). Pre-round tree: `gutter.test.ts:454:69` "expected [ [ true, '' ] ] to deeply equal [ [ 'Add Comment on Line', '' ] ]". Mutated, listing it always: `:457:73`; ignoring the label: `:458:60`.

### 3.7 Ruling 7, the right-click menu

- `gutter.ts:361-362` (`MENU_GROUP = 'navigation'`, `MENU_ORDER = 1`) and `:380-381`: `commentActionsOn` passes `contextMenuGroupId` and `contextMenuOrder` to `addAction`. Test: `gutter.test.ts` "is listed in the right-click menu of the line, in a group and at a place" reads both fields from the fake editor's recorded `addAction` calls. Pre-round tree: `gutter.test.ts:494:52` "expected undefined to be type of 'string'". Mutated without the group: `:494:52`; without the order: `:496:50`.
- `HELP.md:132` ("or Add Comment on Line in the line's menu") now describes a menu entry that exists, and stays as it is.

### 3.8 Ruling 8, the bars' regrow

No code change. `zones.ts` `regrow` (`:85-93`) serves every editor that takes bars. Its three tests (`zones.test.ts` "a bar whose height changes while it is shown") pass and fail with `regrow` removed (mutated, `return;` first in `regrow`: `zones.test.ts:341:30`). After-state rows:

| Bars of | Before | After |
|---|---|---|
| The diff editor (`DiffEditor.svelte:136-137`, hunk bars and the comment box) | A bar that grew (an error line under the box's text) covered the lines below it | Its view zone takes the bar's new height and is laid out again |
| The text editor `Editor.svelte:156`, as the merge editor's conflict bars use it (`MergeSide.svelte:109-110`) | A taller conflict bar overlapped lines | Its view zone grows with the bar |
| The source editor (`Source.svelte:415`) | It hands `Editor.svelte` no bars | Unchanged; the same `lineBars` regrow serves it if it ever does |

### 3.9 Ruling 9, Send while a send is in flight

- `comment-draft.svelte.ts:100`: `send` returns at once when `this.at === null || this.sending`. `sending` is no longer set false by a second call.
- Test: `comment-draft.client.test.ts` "sends once while a send is in flight" asserts a second send leaves `box.sending` true until the first settles, and the terminal was asked once. Pre-round tree: `:224:29` "expected false to be true". Mutated without the `this.sending` clause: `:224:29`.

### 3.10 Ruling 10, the focus on a move along one side

- `comment-draft.svelte.ts:48,74`: `opened = $state(0)`, raised by `open`. `DiffSection.svelte:302` passes `opened={box.opened}`; `CommentBox.svelte` takes `opened` (`:25`) and its root carries `{@attach (node: HTMLElement) => focusText(node, opened)}` (`:59`), where `focusText` (`:41`) focuses the text area in a microtask when `opened` is at least 1. The attachment reruns when `opened` changes.
- Test: `comment-draft.client.test.ts` "how often the box was asked to open > rises on each open, on a move along one side as on a move to the other side" (counts 1, 2, 3; close leaves 3). Pre-round tree: `:119:28` "expected undefined to be +0". Mutated without `this.opened += 1`: `:121:28`. `diff-pane.test.ts` hands `CommentBox` `opened: 1` in its `box()` props. The focus itself is the look's.

### 3.11 Ruling 11, the newer rule sentences

- Rewrapped: `zones.ts:1-14`, the head of `comment-draft.client.test.ts` and `CommentBox.svelte:24` to 100 columns; `npm run test:checks` passes, which includes `comment-width.test.ts`.
- `Diff.svelte` is 504 lines (cap 540, 36 under). The reads moved to `views/sources/repositories/diff/diff-read.ts` (new, 3-line import plus `readDiff(state, repo)` at `:28`, `GROUP_READS`, `answer`); `Diff.svelte:161` calls `readDiff(state, repo)`. The folder `diff/` holds 8 entries (cap 10).
- No history wording in test titles or comments: `grep -rniE "as before|always had|saved before|before the session existed" tests/state/sources/repositories/view/diff-session.test.ts tests/views/sessions/changes.test.ts` prints nothing. The titles at `changes.test.ts:411` and `diff-session.test.ts:67` and the comments at `diff-session.test.ts:1-3` and the saved-state describe state the behaviour only.
- `ReviewComment`, `Refusal`, `SteerAnswer`, `SendResult`, `SendGuard`, `CommentBarShape` (`review-comment.ts`) and `COMMENT_MARK`, `COMMENT_ACTION`, `TargetKinds`, `TargetAt`, `commentTarget`, `CommentSideEditor` (`gutter.ts`) are local. `grep -rn` over `src tests` finds none of them outside their own file. Exports kept: `SendDeps` (`review-comment.ts:85`, importer `comment-draft.svelte.ts:20`) and `DiffSide` (`review-comment.ts:17`, importer `comment-draft.svelte.ts:19`).
- `DiffSide` (`review-comment.ts:17`) copies `ui/controls/editor/types.ts:58` and `CommentBarShape` (`review-comment.ts:208`) copies `EditorBar` (`types.ts:65`). `review-comment.ts` is in `state/sources`; state imports no ui, so it cannot import either type, and the structural shapes are identical to the editor's, which `DiffSection.svelte` hands to `DiffEditor` as it is.
- `commentOutcome` keeps the raw `result.error` as the brief asked.

## 4. Verification

Full runs of the verify list: 3 of 3, each started after `npm run diagrams` (exit 0). The third is the one quoted below. After it, two tests were added to `review-comment.test.ts` ("one clipboard write at a time per box"); the file passes alone (35 tests) and `npm run format:check`, `npm run lint`, `npm run check` ("COMPLETED 3013 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS"), `npm run test:checks` ("Tests 445 passed | 9 skipped (454)") and the ASCII gate (no match) were each run alone on the final tree. `npm test` and `npm run build` were not run again after that test-only addition (a fourth full run is outside the limit of three). Three 5000 ms timeouts occurred in one full run in files this step does not change: `tests/server/edit/config-key.test.ts` ("refuses a key or a file the catalog has no entry for, the reserved names among them", "refuses a key that is absent, empty, null, an alias, anchored, tagged or a block scalar") and `tests/server/git/autofetch.test.ts` ("runs a pressed Fetch with the repository command as it is"). Run alone, `npx vitest run tests/server/edit/config-key.test.ts tests/server/git/autofetch.test.ts` printed "Test Files 2 passed (2)" and "Tests 98 passed (98)".

The files this round changes, run together (`npx vitest run` over `comment-draft.client`, `review-comment`, `diff-session`, `naming`, `gutter`, `zones`, `instance-state-sources`, `type-scale` and `tests/state/sources/repositories`): "Test Files 19 passed (19)", "Tests 982 passed (982)". `diff-pane.test.ts`: 38 passed. `changes.test.ts`: 30 passed.

`checks.sh` final run, ASCII written for the reporter's ellipsis:

```
$ npm test
 Test Files  453 passed | 23 skipped (476)
      Tests  11819 passed | 626 skipped (12445)
   Duration  172.65s (transform 40.10s, setup 0ms, import 413.69s, tests 216.95s, environment 367ms)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  445 passed | 9 skipped (454)
   Duration  55.69s (transform 22.23s, setup 0ms, import 78.64s, tests 106.14s, environment 8ms)
$ npm run check
1790937278202 COMPLETED 3013 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
  ... and 1 more
See https://rolldown.rs/reference/InputOptions.checks#plugintimings for more details.
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
> eslint .
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

| Row | State | Last line of its final run |
|---|---|---|
| 1 the session on the diff and its id (`DiffSubject.session`, `diffState`, `openChange`, `followedDiffTab`) | DONE | `diff-session.test.ts`, `naming.test.ts`, `changes.test.ts`, `instance-state-sources.test.ts` inside "Tests 11819 passed" of `npm test` |
| 2 `review-comment.ts` | DONE | `review-comment.test.ts` inside the same run |
| 3 the editor's affordance (`glyphMarginFor`, `listedWithComment`, right-click menu, second `lineBars()`, order, regrow) | DONE | `gutter.test.ts` 27 passed, `zones.test.ts` inside "Tests 11819 passed" |
| 4 the comment box (`CommentBox`, `opened`, one send at a time) | DONE | `comment-draft.client.test.ts` and `diff-pane.test.ts` inside "Tests 11819 passed" |
| 5 where it is offered | DONE | `diff-pane.test.ts` "the comment a section offers on a line of a session diff" |
| 6 sending and the notice | DONE | `review-comment.test.ts`, `comment-draft.client.test.ts` |
| 7 words and docs (`changes.yml`, `HELP.md:87,132`, `DESIGN.md:399`, `type-scale.test.ts:254`) | DONE | "Tests 445 passed | 9 skipped (454)" of `npm run test:checks` |
| `npm run check` | DONE | "COMPLETED 3013 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS" |
| `npm run build` | DONE | "See https://rolldown.rs/reference/InputOptions.checks#plugintimings for more details." (exit 0) |
| `npm run format:check` | DONE | "All matched files use Prettier code style!" |
| `npm run lint` | DONE | "> eslint ." (exit 0) |
| ASCII gate | DONE | `checks: 7 commands passed` |

Sizes (`wc -l`): `Diff.svelte` 504, `DiffSection.svelte` 479, `DiffEditor.svelte` 492, `CommentBox.svelte` 126, `gutter.ts` 390, `zones.ts` 175, `review-comment.ts` 236, `repositories.ts` 862 (cap 900), `diff-pane.test.ts` 675, `changes.test.ts` 512. Folders: `ui/controls/editor` 10, `state/sources/repositories` 10, `views/sources/repositories/diff` 8, `tests/state/sources/repositories/diff` 7, `tests/views/sources/repositories` 10 entries.

## 5. Each added behaviour taken out

One line of the final tree changed at a time, the file's test run; all fail on the named case.

| File | Taken out | Fails at |
|---|---|---|
| `gutter.ts` | `glyphMarginFor` returns `offering` | `gutter.test.ts:442:39` |
| `gutter.ts` | `contextMenuGroupId` / `contextMenuOrder` | `:494:52` / `:496:50` |
| `gutter.ts` | `listedWithComment` lists always / ignores the label | `:457:73` / `:458:60` |
| `gutter.ts` | press ignores `offered` / move ignores `offered` | `:402:25` / `:401:44` |
| `gutter.ts` | a line-number press asks for a comment | `:387:25` |
| `gutter.ts` | leave does not clear / dispose leaves the marks | `:350:44` / `:415:44` |
| `gutter.ts` | the action runs on line 1 | `:479:23` |
| `zones.ts` | one ordinal for every bar | `zones.test.ts:284:35` (2 tests) |
| `zones.ts` | no regrow | `zones.test.ts:341:30` |
| `review-comment.ts` | sides' paths swapped | `review-comment.test.ts:69:11` |
| `review-comment.ts` | no staged mark / no `./` before a command-like path | `:57:58` / `:133:54` |
| `review-comment.ts` | no long refusal / no control refusal | `:168:59` / `:159:44` |
| `review-comment.ts` | guard allows two sends / superseded answer handed back | `:266:5` / `:288:29` |
| `review-comment.ts` | comment bar order 0 / Ctrl+Enter only / clipboard throw not refused | `:356:68` / `:383:63` / `:244:22` |
| `comment-draft.svelte.ts` | no `sending` clause / `opened` never rises | `comment-draft.client.test.ts:224:29` / `:121:28` |
| `DiffSection.svelte` | gate ignores `actions` / gate ignores the payload | `diff-pane.test.ts:527:41` / `:538:41` |
| `repositories.svelte.ts`, `Changes.svelte` | merge branch, untracked branch, session argument | `changes.test.ts:429:24` (each) |
| `repositories.ts` | session left out of the id | `diff-session.test.ts`, 7 of 13 |

## 6. Head comments and documents touched

| Place | State |
|---|---|
| `gutter.ts` head (`:1-14`) | still true: the comment mark follows the pointer and a press asks for a comment |
| `gutter.ts` docs of `glyphMarginFor`, `MONACO_GLYPH_MARGIN`, `listedWithComment`, `commentActionsOn`, `MENU_GROUP` | rewritten (new or changed functions) |
| `DiffEditor.svelte` head (`:16-22`) and the two effect comments (`:324`, `:342`) | rewritten: the glyph margin stays drawn, the menu entry |
| `zones.ts` head (`:1-14`) | rewritten: reflowed to 100 columns, same content |
| `repositories.ts` doc of `diffState` (`:148-156`) | rewritten: the new id form |
| `review-comment.ts` head (`:1-12`) | still true |
| `comment-draft.svelte.ts` head (`:1-8`) | still true |
| `CommentBox.svelte` head (`:2-9`) and the `opened` prop comment (`:24`) | head still true (the text area takes the focus when the box opens); prop comment rewritten |
| `DiffSection.svelte` head (`:26-32`) | still true |
| `Diff.svelte` head | still true: the reads it names moved to `diff-read.ts`, whose head states them |
| `diff-read.ts` head | new |
| `comment-draft.client.test.ts` head (`:1-10`) | rewritten: reflowed |
| `HELP.md:132`, `HELP.md:87` | still true |
| `DESIGN.md:399` | still true (names the `+` in the glyph margin and Add Comment on Line) |

## 7. Edits to existing assertions, allow lists and predicates

| Place | Before | After |
|---|---|---|
| `instance-state-sources.test.ts:51,65,261,293` (`heldDiffFallback`, `heldDiffValid`, the stored-object rows) | no `session` key | `session: ''` (`:51`), `session: 's-1'` (`:65`, `:261`), `session: ''` (`:293`) |
| `instance-state-sources.test.ts:275` | the wrong-type row had no `session` | `session: 3` (a number reads as none) |
| `instance-state-sources.test.ts:316` | no case for the key | `'wrong session': { ...heldDiffValid, session: '' }` |
| `zones.test.ts:62` fake editor | `layoutZone: () => undefined` | `layoutZone: (id: string) => laidOut.push(id)`, with `laidOut` returned by the fake (`:29-30`, `:80`) |
| `changes.test.ts:46-49` | no mock of `ChangesRepo` | a file-wide `vi.mock` of `ChangesRepo.svelte` through `recorded(original)` from `press-on-render.ts`; `beforeEach` resets it (`:57`). The component still renders the real markup; the recorder keeps its props |
| `diff-pane.test.ts:62,536` | `fresh(ToolButton, Menu)` | `fresh(ToolButton, Menu, DiffEditor, TextArea, CommentBox)` |
| `diff-pane.test.ts:1-18` head | named no comment tests | names the comment tests and what they do not cover |
| `gutter.test.ts:1-6` head | named the marks, breakpoints and blame | adds the comment `+` and the action |
| `type-scale.test.ts:254` | no row for `CommentBox.svelte` | `'sources/repositories/diff/CommentBox.svelte': '.comment=fs-sm'` |

No file under `tests/checks/` is edited, so no allow list or predicate of the tree checks changed.

## 8. Asynchronous paths

The send is one function for both ways of sending: `sendOnce` (`review-comment.ts:172`) wraps `sendComment`, which types into the terminal or writes to the clipboard, under the box's `sendGuard`. The box (`comment-draft.svelte.ts`) runs it and cancels the guard on `close`, on a move to another line or side, and when the section goes.

| Path | In flight | After close | Superseded |
|---|---|---|---|
| The send into the terminal (the steer answer) | `comment-draft.client.test.ts` "sends once while a send is in flight"; `review-comment.test.ts` "does not steer a second time while the first is in flight" | `comment-draft.client.test.ts` "hands nothing back when the box was closed before the terminal answered" and "hands nothing back when the section went before the terminal answered"; `review-comment.test.ts` "hands back nothing for an answer that lands after the box was closed or moved" | `review-comment.test.ts` "keeps a send in flight counted until it lands even after the box was closed" and "lets a send that was superseded before it began run under the new box" |
| A steer that throws or rejects | `review-comment.test.ts` "fails with the message of a steer that throws instead of rejecting the send" | the same guard as the row above | the same guard as the row above |
| The write to the clipboard | `review-comment.test.ts` "writes once while the first write is in flight" | `review-comment.test.ts` "hands back nothing for a write that lands after the box was closed or moved" | the superseded tests of the first row run the same `sendOnce`; the clipboard has no test of its own for it |
| The five-second notice | `comment-draft.client.test.ts` "stays for NOTICE_MS and then goes" | no test closes the box inside the five seconds | not applicable: one notice per box |

## 9. Files outside the step's path list

| File | Why |
|---|---|
| `src/lib/data/model/model-sessions.ts`, `src/lib/data/model/index.ts` | `STEER_MAX` and `STEER_CONTROL`, which the server checks a steer against, are read by `review-comment.ts` from `data/model` (state may not import `lib/server`) |
| `src/lib/server/machine/pty/sessions.ts` | imports them from `data/model` so the server and the clipboard path refuse the same text |
| `src/lib/state/sources/explorer/follow.ts` | `followedDiffTab` carries the session when a file moves |
| `tests/views/whole/type-scale.test.ts` | the audit lists every view file; `CommentBox.svelte` has its row |
| `src/lib/views/sources/repositories/diff/diff-read.ts` (new) | `Diff.svelte` split to stay 36 lines under its cap |

## 10. Not proved by a test

- The look: the `+` on a hovered line, the box's placement and focus, the right-click menu entry, the bars' regrow in Monaco. Case 23 is the landing's, on the TEST page.
- A live change of the sessions payload under one mounted `DiffSection`: `diff-pane.test.ts` renders a section once per call, so "offers it again" is proved for a fresh render after the payload holds the session again. A latch inside one mounted section would not be caught by the unit suite.
- `diff-session.test.ts` "gives every kind of diff of one file..." fails with the session part taken out of the id (section 5) and passes on the old id form, so it is not the test of the collision; `:47-53` is.
