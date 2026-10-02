# A1 report: review with feedback

NOT DONE: `sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md` does not print `checks: 7 commands passed` from this worktree. Its second command, `npm run test:checks`, fails on one case that no file of this step can fix: `tests/checks/config/integrity.test.ts` "reads every side project of the hub with no finding" expects at least 3 folders under `side-projects/` and the worktree root has none (`ls /Users/axelfaes/workspace/research-hub/.agents/worktrees/A1/side-projects` prints "No such file or directory"; the main checkout holds `gpu-game-boy`, `residual`, `scripted-os`, each with a `project.yml`). The script stops at the first red command, so the five commands after it ran each alone and all exit 0 (section 3). Everything else in the brief is done. The three full runs of the brief are used. Case 23 (the look on TEST) is the landing's.

## 1. Open items of the state file

The state file at `/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md`, read at the time of this report, holds:

- Z251 (2026-10-02 09:40, all steps): fewer repair rounds. Axel asked whether the criteria for a round can be stricter so more steps land without one. Evidence: 12 of the last 13 landings had a round; each round's rulings (`agents/briefs/<step>-round1.md`) number 5 to 16, and every one of them holds rulings that change code or add a test. Options: (a) keep the round as ruled 2026-10-01 (`plan.md:773`); (b) land without a round when every first-review finding is small and inside the brief, as the refute dispositions already allow (none of the last 13 would have qualified, so it saves nothing); (c) `refute_after_repair: no` when the round stays inside its rulings, the orchestrator reading the delta in its place (saves about 185k to 270k tokens and 14 to 46 min per step; those runs found 4 to 9 findings that would then rest on the orchestrator's read; reverses part of the 2026-10-01 ruling); (d) fewer findings at the source: the overdue recurring-findings pass, its causes in three or more steps ending in a rule sentence in `agents/spec.md` or a sentence every brief carries. Recommendation: (d), with (a) kept until its effect shows; (b) and (c) are the lazy options, since they lower the bar and keep the cause.

## Time per step (Axel asked 2026-09-27 for how it evolves with Q77; measured from each builder's transcript: each tool call from call to result, each background wait from the builder stopping to the run waking it)

## 2. The cases' first run

The first run on the unchanged tree, before any change: 7 test files, 32 failed, 102 passed of 134 (`vitest run` of the seven files). The tests changed after that run, so the failing assertions below come from every test in its final form, run on a copy of the tree (`/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/A1/base`) whose 17 changed source and document files were replaced by main's copies and whose three new source files were absent; for `diff-pane.test.ts`, which cannot load without `CommentBox.svelte`, the copy held an empty `CommentBox.svelte`. No case's rule was wrong; none was handed back.

| Case | Result on the unchanged tree |
|---|---|
| 1 prompt shapes, 2 the five real cases, 8 two-line comment, 9 command-looking paths | `review-comment.test.ts` does not load: "Cannot find module '../../../../../src/lib/state/sources/repositories/review-comment.ts'" (missing module) |
| 3, 4, 5, 6 the send, 7 the refusal, 18 second Send in flight, 19 answer after the box closed | same missing module; the box's own flow (18, 19) is also in `comment-draft.client.test.ts`, which fails with "Failed to resolve import ../../../../../src/lib/state/sources/repositories/review-comment.ts" |
| 10 no `oncomment` from the Repositories view | `diff-pane.test.ts` "offers none for a diff opened from the Repositories view": passes (the tree has no comment affordance); the palette half is `gutter.test.ts` "is listed with the parent label while comments are offered, and not otherwise": "listedWithComment is not a function" |
| 11 two tabs, two sessions, `session: ''` or a number | `diff-session.test.ts` "adds the session to the id...": "expected 'changed:/hub:src/a.ts' to be 'changed:/hub:src/a.ts:s-1'"; "gives two sessions two ids...": "expected 2 to be 3"; "reads an empty session or one that is not a string as none": "expected undefined to be ''" |
| 12 a state saved before this step | `diff-session.test.ts` "reads a state saved before the session existed as none": "expected undefined to be ''"; `instance-state-sources.test.ts` heldDiff: 34 of its cases fail on the missing `session` key (for example "answers valid": "expected { Object (id, label, ...) } to strictly equal { id: 'i', label: 'l', ...(10) }") |
| 13 followed to a renamed file | `naming.test.ts` "keeps a session's diff pane that session when its file moves, and the id carries both": "expected { root: 'hub', path: 'dir/b.md', ...(9) } to match object { path: 'dir/b.md', session: 's-1' }" |
| 14 commit, stash, worktree, compare, group with a session | `diff-pane.test.ts` "offers none on a commit, stash, worktree, compare or group diff": passes (nothing is offered at all) |
| 15 session leaves the payload | `diff-pane.test.ts` "offers none once the payload no longer holds the session, and offers it again when it does": "expected undefined to be type of 'function'" |
| 16 gutter helpers over a fake editor | `gutter.test.ts`, seven cases: "commentGutter is not a function" (six) and "commentTarget is not a function" |
| 17 `onactions` with and without `oncomment` | `gutter.test.ts` "listedWithComment is not a function" and "commentActionsOn is not a function" |
| 20 merge row and untracked row | `diff-session.test.ts` "opens the merge editor for a conflict and the file for an untracked path, whatever the session": passes; `changes.test.ts` "opens a row's diff for the session the view shows, a merge row and an untracked row as before": "expected [ [ '/hub', 'changed', ...(1) ], ...(1) ] to deeply equal [ [ '/hub', 'changed', ...(2) ], ...(1) ]" |
| 21 comment bar below a hunk bar | `zones.test.ts` "orders a bar after the line by its order": "expected [ +0, +0 ] to deeply equal [ 1, +0 ]"; "keeps the order when the model is replaced": "expected [ +0 ] to deeply equal [ 1 ]"; three cases of the regrow of a bar whose height changes: "Cannot read properties of undefined (reading 'notify')" |
| 22 the bar snippet | `diff-pane.test.ts` "draws the comment box for the bar with the id comment and a hunk bar for a numeric id": "expected [] to have a length of 1 but got +0" |
| 23 the look on TEST | the landing's; not run here |
| 24 empty session title | `diff-pane.test.ts` "calls a session with no title by its id in the head of the box": "expected undefined to match object { title: 's-1' }"; `review-comment.test.ts` (`commentTitle`) as the missing module |

Also failing on the unchanged tree, as the tests of the other items: `diff-pane.test.ts` "the comment box" (five cases: "expected '<!--[--><!--]-->' to contain 'Comment to The live one'", "Cannot read properties of undefined (reading 'oninput')", "reading 'onkeydown'", "expected undefined to be type of 'function'", "expected '<!--[--><!--]-->' to contain 'The terminal did not answer.'"), `diff-pane.test.ts` "offers it, under the words of the catalog, on a file own diff opened for a session the payload holds" ("expected undefined to be type of 'function'"), and `type-scale.test.ts` ("lists every view file in the audit": "expected [ ...(208) ] to deeply equal [ ...(209) ]" and "sets every local role in sources/repositories/diff/CommentBox.svelte": "ENOENT").

Tests that pass on the unchanged tree and after:
- Preservation of behaviour: `diff-session.test.ts` "adds nothing for an empty session" and "opens the merge editor for a conflict and the file for an untracked path, whatever the session"; `diff-pane.test.ts` "offers none for a diff opened from the Repositories view" and "offers none on a commit, stash, worktree, compare or group diff". The last two are proved to fail without their gate: with `actions !== 'read'` taken out of `commentable` in `DiffSection.svelte`, only "offers none on a commit..." fails; with `record !== null` taken out, "offers none for a diff opened from the Repositories view" and "offers none once the payload no longer holds the session" fail.
- Audit (it would pass with the behaviour taken out): `diff-session.test.ts` "keeps the diffs of one file in a commit, a stash and a session apart".
- `comment-draft.client.test.ts` is proved by taking the code out of `comment-draft.svelte.ts`, one at a time, and running the file: without the `allowed` effect "closes, keeping the text, when its side stops being offered" fails ("expected { side: 'original', line: 2 } to be null"); without the teardown effect "hands nothing back when the section went before the terminal answered" fails ("expected 'Sent to The live one.' to be ''"); without the timer in the notice effect "stays for NOTICE_MS and then goes" fails; without `guard.cancel()` in `close` "hands nothing back when the box was closed before the terminal answered" fails.

## 3. DONE / NOT DONE

| Row | State | Command or place that proves it |
|---|---|---|
| 1 the session on the diff (`DiffSubject.session`, `heldDiffShape`, `diffState` id, `openChange(root, group, path, session?)`, `Changes.svelte` passes `record?.id`, `followedDiffTab` carries it) | DONE | `diff-session.test.ts`, `naming.test.ts`, `changes.test.ts`, `instance-state-sources.test.ts` pass in `npm test` (third full run) |
| 2 `review-comment.ts` (`commentPrompt`, `commentRefusal`, `sendComment`, with `sendGuard`, `sendOnce`, `commentOutcome`, `commentBars`, `commentKey`, `pathOfSide`, `browserCopy`) | DONE | `review-comment.test.ts` in `npm test` |
| 3 the editor's affordance (`oncomment`, `commentLabel`, glyph margin, hover `+`, press, Add Comment on Line through `onactions`, second `lineBars()` on the original editor, `EditorBar.side` and `order`, regrow of a taller bar) | DONE | `gutter.test.ts`, `zones.test.ts`; the look is not proved (section 7) |
| 4 the comment box (`CommentBox.svelte`, one per section, draft kept on move, Escape and re-read, Cancel drops, focus, Ctrl or Cmd+Enter, inline layout closes an original-side box keeping the text) | DONE | `diff-pane.test.ts` "the comment box", `comment-draft.client.test.ts` |
| 5 where it is offered (session held by `sessionById` and `actions !== 'read'`, which is `!diffActs(held) \|\| held.path === ''` of `Diff.svelte`; `Diff.svelte` passes `session={held.session}`, one line, 537 lines) | DONE | `diff-pane.test.ts` cases 10, 14, 15 read the props the section hands `DiffEditor` |
| 6 sending (refusal, `sent`, `copied`, `failed`, `refused`, five-second notice) | DONE | `review-comment.test.ts`, `comment-draft.client.test.ts` |
| 7 words and docs (`changes.yml` `sessions:` keys, `HELP.md` lines 87 and 132, `DESIGN.md` line 399, `type-scale.test.ts` row) | DONE | `npm test` (third run) and `npm run test:checks` pass on every file except the one named above |
| `checks.sh` prints `checks: 7 commands passed` | NOT DONE | third run below: stops at `npm run test:checks`, one failure, environment |
| `npm run check` | DONE | exit 0, "COMPLETED 3012 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS" |
| `npm run build` | DONE | exit 0 |
| `npm run format:check` | DONE | exit 0, "All matched files use Prettier code style!" |
| `npm run lint` | DONE | exit 0, no output |
| `! LC_ALL=C grep -rna '[^ -~]' src tests` | DONE | exit 0, no output |

Full runs of `checks.sh`: 3 of 3, each started after `npm run diagrams`. `npm test` passed in the second and third (453 files passed, 11813 tests passed). The first run's `npm test` stopped on six 5000 ms timeouts in files this step does not change (`tests/server/edit/config-key.test.ts` five cases, `tests/routes/edit/undo.test.ts` "answers unwritable for a setting whose file has turned read-only"); run alone with `npx vitest run tests/server/edit/config-key.test.ts tests/routes/edit/undo.test.ts tests/state/shared/instance-state-sources.test.ts` they pass (3 files, 436 of 436).

The third run, verbatim except that the reporter's box-drawing characters are written as `-` and `>`, its cross as `x` and its ellipsis as `...`:

```
$ npm test

> oculus@0.0.1 test
> vitest run --tagsFilter '!slow' --exclude 'tests/checks/**'


 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/A1/tools/oculus


 Test Files  453 passed | 23 skipped (476)
      Tests  11813 passed | 626 skipped (12439)
   Start at  10:22:33
   Duration  174.42s (transform 40.64s, setup 0ms, import 414.98s, tests 222.13s, environment 181ms)

$ npm run test:checks

> oculus@0.0.1 test:checks
> vitest run tests/checks --tagsFilter '!slow' --testTimeout 0 --hookTimeout 0


 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/A1/tools/oculus

 > |unit| tests/checks/config/integrity.test.ts (12 tests | 1 failed) 322ms
     x reads every side project of the hub with no finding, each as a card of the personal map 3ms

------- Failed Tests 1 -------

 FAIL  |unit| tests/checks/config/integrity.test.ts > the real hub > reads every side project of the hub with no finding, each as a card of the personal map
AssertionError: expected 0 to be greater than or equal to 3
 > tests/checks/config/integrity.test.ts:172:32
    170|             .map((file) => file.split('/')[0])
    171|             .sort();
    172|         expect(folders.length).toBeGreaterThanOrEqual(3);
       |                                ^
    173|         const personal = snapshot?.entities.personal ?? {};
    174|         expect(Object.keys(personal).sort()).toEqual(folders.map((fold...

------------------------[1/1]-


 Test Files  1 failed | 28 passed | 2 skipped (31)
      Tests  1 failed | 444 passed | 9 skipped (454)
   Start at  10:25:30
   Duration  49.19s (transform 21.70s, setup 0ms, import 73.42s, tests 89.29s, environment 7ms)

checks: failed with exit 1: npm run test:checks
exit 1
```

The other five commands of the verify list, each run alone with its own exit status (the script does not reach them):

```
$ npm run check
exit 0
> svelte-kit sync && svelte-check --tsconfig ./tsconfig.json
1790929626257 START "/Users/axelfaes/workspace/research-hub/.agents/worktrees/A1/tools/oculus"
1790929626267 COMPLETED 3012 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
exit 0
$ npm run format:check
exit 0
> prettier --check .
Checking formatting...
All matched files use Prettier code style!
$ npm run lint
exit 0
> oculus@0.0.1 lint
> eslint .
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
exit 0
```

The ASCII gate over `src tests config` (the brief's `perl` form, `config/local.yml` excluded), `HELP.md`, `DESIGN.md` and `README.md` printed nothing. Sizes: no file past 900 lines (largest of mine `repositories.ts` 857), `DiffSection.svelte` 478, `DiffEditor.svelte` 489, `Diff.svelte` 537 (limit 540), `CommentBox.svelte` 119; folders: `views/sources/repositories/diff` 7 entries, `ui/controls/editor` 10, `state/sources/repositories` 10, `tests/state/sources/repositories/diff` 7.

## 4. Files with line counts

| Lines | File |
|---|---|
| 236 | src/lib/state/sources/repositories/review-comment.ts (new) |
| 857 | src/lib/state/sources/repositories/repositories.ts |
| 389 | src/lib/state/sources/repositories/repositories.svelte.ts |
| 134 | src/lib/state/sources/explorer/follow.ts |
| 236 | src/lib/views/sessions/changes/Changes.svelte |
| 537 | src/lib/views/sources/repositories/diff/Diff.svelte |
| 478 | src/lib/views/sources/repositories/diff/DiffSection.svelte |
| 119 | src/lib/views/sources/repositories/diff/CommentBox.svelte (new) |
| 125 | src/lib/views/sources/repositories/diff/comment-draft.svelte.ts (new) |
| 489 | src/lib/ui/controls/editor/DiffEditor.svelte |
| 38 | src/lib/ui/controls/editor/LineBars.svelte |
| 71 | src/lib/ui/controls/editor/types.ts |
| 176 | src/lib/ui/controls/editor/zones.ts |
| 368 | src/lib/ui/controls/editor/gutter.ts |
| 686 | src/lib/data/model/model-sessions.ts |
| 495 | src/lib/data/model/index.ts |
| 544 | src/lib/server/machine/pty/sessions.ts |
| 90 | config/text/views/sessions/changes.yml |
| 304 | HELP.md |
| 429 | DESIGN.md |
| 417 | tests/state/sources/repositories/diff/review-comment.test.ts (new) |
| 261 | tests/state/sources/repositories/diff/comment-draft.client.test.ts (new) |
| 11 | tests/state/sources/repositories/diff/rooted.svelte.ts (new) |
| 147 | tests/state/sources/repositories/view/diff-session.test.ts (new) |
| 294 | tests/state/sources/explorer/naming.test.ts |
| 567 | tests/state/shared/instance-state-sources.test.ts |
| 461 | tests/ui/controls/editor/gutter.test.ts |
| 367 | tests/ui/controls/editor/zones.test.ts |
| 665 | tests/views/sources/repositories/diff-pane.test.ts |
| 496 | tests/views/sessions/changes.test.ts |
| 391 | tests/views/whole/type-scale.test.ts |
| 8 files | docs/diagrams/layer-server, layer-state, layer-views, layers (`.dot` and `.svg`), as `npm run diagrams` writes them |

## 5. Judgment calls the brief left open

- The draft and the send flow live in `views/sources/repositories/diff/comment-draft.svelte.ts` (class `CommentDraft`, created by the section), because the section with them was 560 lines against the 540 limit. The section keeps `commentable`, `who` and the markup.
- Cancel drops the text; Escape keeps it (the brief names only Escape). Send clears it only after `sent` or `copied`.
- A blank comment makes the empty prompt (`commentPrompt` returns `''`), which `commentRefusal` answers `empty`; nothing happens and no line is shown.
- `pathOfSide(file, side)` gives the old path for the original side and falls back to the other path when one is empty (a created or deleted file).
- `commentBars(bars, at)` adds `{ id: 'comment', after, side, order: 1 }` to the hunk bars; the comment bar sits below a hunk bar after the same line.
- The `+` is a CSS-drawn mark in the accent colour (`.oculus-comment-add::before` in `DiffEditor.svelte`), since no glyph of `glyphs.yml` is a plain plus drawn in a gutter and the brief allows it.
- The shared steer rule: `STEER_MAX` and `STEER_CONTROL` moved to `data/model/model-sessions.ts` and are exported from `data/model/index.ts`; the server's `steerTerminal` and the client's `commentRefusal` read the same two values. The server's own `STEER_MAX` export is removed.
- `SteerAnswer = { ok: boolean; error: string }` in `review-comment.ts` types the steer dependency structurally; `TerminalAnswer` satisfies it.
- A bar taller or shorter after it is shown regrows its view zone through one `ResizeObserver` per bar in `zones.ts` (guarded by `typeof ResizeObserver`), since a three-row text area is taller than a hunk bar and Monaco does not re-measure a zone by itself.
- In the inline layout the palette's `perform` goes to the modified editor, since the original editor has no visible side there.
- The text area takes the focus in a microtask after the bar is attached (`queueMicrotask` then `focus({ preventScroll: true })`), because the bar is placed in the editor after the box is created.
- The line saying where a comment went is a `<p role="status" data-comment-notice>` above the editor in the section, for `NOTICE_MS = 5000` (a constant in `review-comment.ts`).
- The id of a session's diff is `<place>:<session>`. A file whose path is literally `a.ts:s-1` opened without a session has the same id as `a.ts` opened for session `s-1`. Not fixed: the brief fixes the id format, and a path with a colon followed by a session id does not occur; no test asserts the collision.
- `Diff.svelte` adds one line, not four.

## 6. User-visible changes, before and after

| Where | Before | After |
|---|---|---|
| A row in a session's Changes view | opens the same diff tab as the Repositories view (id `changed:/hub:src/a.ts`) | opens the session's own tab beside it (id `changed:/hub:src/a.ts:<session id>`); a merge row and an untracked row open the merge editor and the file as before |
| A file's diff opened for a session still in the sessions payload | no gutter mark | the glyph margin shows a `+` on the hovered line (both sides side by side, the modified side inline); a press opens a comment box under that line |
| Palette and editor actions of that diff | no comment action | "Add Comment on Line" on the caret line of the side holding the focus (the modified side when neither does); listed only while the session is held |
| The comment box | none | head "Comment to <session title>" (the id when the title is empty), a three-row text area focused on open, Send and Cancel; Ctrl+Enter or Cmd+Enter sends; Escape closes keeping the text; a second `+` moves the box keeping the text |
| Send | none | the prompt `<path>:<line>: <text>` (`<path>:<line> (before the change): <text>` on the original side, `(staged)` on the modified side of a staged diff) is typed into the session's oculus terminal and Enter pressed, and the box says "Sent to <title>." for five seconds; with no oculus terminal it is copied to the clipboard and the line reads "<title> has no oculus terminal now. The comment is on the clipboard."; a terminal that fails keeps the box and shows its error, or "The terminal did not answer."; a refused clipboard shows "The clipboard refused the copy."; a control character or more than 100000 characters is refused with its sentence |
| A diff from the Repositories view, a commit, stash, worktree, compare or group diff | unchanged | unchanged: no `oncomment`, no `+`, no action |
| `HELP.md` line 87 and line 132, `DESIGN.md` line 399 | the Changes row opens "the same diff pane" | the rows open "its own diff tab for the session" and the `+`, Add Comment on Line and the send are described; the Ctrl+Enter row adds "send, in a diff's comment box" |

## 7. Not proved by a test (only the look can show)

- The `+` showing on a hovered line and the press on the real gutter in Monaco.
- The focus and the keys inside Monaco's overlay for a text area in a view zone; the Escape that must not restore a maximised pane.
- The alignment of a bar on the original side, and the zone regrow in a browser (`zones.test.ts` drives a stubbed `ResizeObserver`).
- `DiffSection.svelte`'s `allowed` closure (`commentable && !(mode === 'inline' && side === 'original')`) is read, not run: `comment-draft.client.test.ts` proves the box closes when its `allowed` says no, not what `DiffSection` answers.
- `Diff.svelte` passing `session={held.session}` to the section: the server rendering of the pane draws no sections, so the line is proved by reading; cases 11 to 13 prove the state reaches `held.session`.
- `DiffEditor.svelte`'s effects: re-registering the action and calling `onactions` again when `oncomment` comes or goes, and re-running `commentGutter` on a layout change.
- The modified-side fallback of Add Comment on Line when neither side has the focus.

## 8. Wrong or impossible in the brief

- "Read: `state/sessions/terminal/pty-io.ts`" and `sendComment`'s `steer: (id, text) => Promise<TerminalAnswer>`: `review-comment.ts` is in `state/sources`, and `tests/checks/imports/order.test.ts` "holds the state folders" refuses an import of `state/sessions/terminal/pty-io.ts` from it ("state/sources/repositories/review-comment.ts:14 imports state/sessions/terminal/pty-io.ts (state/sessions, above state/sources)"). The module types the dependency structurally (`SteerAnswer`) instead; `TerminalAnswer` satisfies it.
- "`Diff.svelte` adds at most four lines": one line was needed.
- The brief's paths omit four source files and one test file the step needs; table below.

## 9. Source files outside "Paths this step writes"

| File | Item that needed it |
|---|---|
| src/lib/ui/controls/editor/LineBars.svelte | 3: passes the bar's `order` to `placed.above(after, order)` |
| src/lib/data/model/model-sessions.ts, src/lib/data/model/index.ts | 2: `STEER_MAX` and `STEER_CONTROL` in one place for client and server, so the clipboard path refuses what the terminal path refuses |
| src/lib/server/machine/pty/sessions.ts | 2: `steerTerminal` reads the shared constants |
| src/lib/views/sources/repositories/diff/comment-draft.svelte.ts (new) | 4 and 6: the draft and the send, out of `DiffSection.svelte` to keep it under 540 |
| tests/state/shared/instance-state-sources.test.ts | 1: its table of `heldDiff` answers lists every key of the pane state, so it lists `session` |
