# Step A1 refuter report (on .agents/worktrees/A1, base ce71ecf1)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The step is judged against `agents/spec.md` as it stood at ce71ecf1, read from the saved copy `scratchpad/spec-at-ce71ecf1.md`. Places where the newer rule sentences on main would also apply are listed separately, after the four headings.

## Verification (rerun by the reviewer)

```
$ sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md   (from .agents/worktrees/A1/tools/oculus, node v24.21.0; side-projects/ present: gpu-game-boy residual scripted-os)
$ npm test
 Test Files  453 passed | 23 skipped (476)
      Tests  11813 passed | 626 skipped (12439)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  445 passed | 9 skipped (454)
$ npm run check
1790931228911 COMPLETED 3012 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
(built; no error line)
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
(no output)
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
exit 0

The report's own evidence, rerun:
- ASCII gate in the rules file's "The ASCII gate" form, over src tests config (local.yml excluded) plus HELP.md and DESIGN.md: printed nothing (bin/ does not exist in this tree, so `find` warned about it).
- wc -l: Diff.svelte 537, DiffSection.svelte 478, DiffEditor.svelte 489, repositories.ts 857, diff-pane.test.ts 665. Same as the report.
- Folder counts (ls | wc -l): state/sources/repositories 10, views/sources/repositories/diff 7, ui/controls/editor 10, tests/state/sources/repositories/diff 7, tests/state/sources/repositories/view 5, tests/views/sources/repositories 10, tests/ui/controls/editor 7. All within ten.
- The step's 14 test files in the worktree (diff-pane, the diff/ folder, diff-session, gutter, zones, changes, naming, instance-state-sources, type-scale): Test Files 14 passed, Tests 872 passed.
- First runs on the unchanged tree, rerun in the builder's base copy (scratchpad/A1/base; base sources, the review-comment module absent). Its test files match the final ones except comment rewrapping and one helper refactor in diff-session.test.ts (`record`), which changes no assertion. Eight files: 25 failed tests plus two files that did not load. The failing lines match the report: "commentGutter is not a function" (6), "commentTarget is not a function", "listedWithComment is not a function", "commentActionsOn is not a function", zones "expected [ +0, +0 ] to deeply equal [ 1, +0 ]" and "reading 'notify'" (3), diff-session "expected 'changed:/hub:src/a.ts' to be 'changed:/hub:src/a.ts:s-1'" and "expected 2 to be 3", naming "to match object { path: 'dir/b.md', session: 's-1' }", changes "expected [ [ '/hub', 'changed', ...(1) ], ...(1) ] to deeply equal [ [ '/hub', 'changed', ...(2) ], ...(1) ]", type-scale "[ ...(208) ] to deeply equal [ ...(209) ]" and ENOENT, review-comment "Cannot find module ... review-comment.ts", comment-draft "Failed to resolve import ... review-comment.ts".
- instance-state-sources.test.ts on base: "Tests 34 failed | 312 passed (346)". Same as the report.
- The report's NOT DONE row ("checks.sh does not print checks: 7 commands passed") no longer holds: the list above is green now that side-projects/ is checked out.
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `repositories.ts:189` (`session?: string`), `:219` (`z.string().catch('')`), `:207-209` (the id gains `:${session}` only when non-empty); `repositories.svelte.ts:363-367`; `Changes.svelte:204` passes `record?.id`; `follow.ts:88` carries `session`. Proved by diff-session.test.ts, naming.test.ts, changes.test.ts and instance-state-sources.test.ts, each red on base and green now.
- 2: holds. `review-comment.ts` exports `commentPrompt`, `commentRefusal` and `sendComment` with the brief's results. The steer dependency is typed structurally as `SteerAnswer` (`:82`) in place of `TerminalAnswer`. That substitution is forced: `tests/checks/imports/order.ts` puts `state/sessions` above `state/sources`, so `state/sources` cannot import `state/sessions/terminal/pty-io.ts`. The refusal reads the shared `STEER_MAX` and `STEER_CONTROL`, now in `data/model/model-sessions.ts:266-274`, which the server's `steerTerminal` also reads.
- 3: violated, Spec 1 and Behaviour 1 (the glyph margin is switched off on every diff that offers no comment).
- 4: holds. `CommentBox.svelte`, `comment-draft.svelte.ts` (one box per section, `open` moves it keeping the text, `close` keeps it, `drop` clears it, the in-flight guard), and Escape with `preventDefault` and `stopPropagation` (`CommentBox.svelte:42-48`). Behaviour 4 (the focus on a move along the same side) and Behaviour 5 (the Send button re-enabled mid-flight) are findings against it that do not break the item's text.
- 5: holds. `DiffSection.svelte:173` `commentable = record !== null && actions !== 'read'`. `actions !== 'read'` is `diffActs(held) && held.path !== ''` through `Diff.svelte:149,334-336`. Diff.svelte gains one line (`:465`), 537 lines.
- 6: holds. `comment-draft.svelte.ts:96-124` together with `commentOutcome` (`review-comment.ts:197-205`), `NOTICE_MS = 5000`, and `browserCopy()` returning null without a clipboard.
- 7: violated, Standards 1 (`HELP.md:132` says the action is in "the line's menu", and Monaco's right-click menu does not list it). The 11 `sessions:` keys, `HELP.md:87`, `DESIGN.md:399` and the type-scale row are present.

Cases of the brief's "Cases":

- 1: met. review-comment.test.ts "names the file and the line...", "says staged...", "names the old path...".
- 2: met. "writes the five real cases of the decision as they are given".
- 3: met. "types the prompt into the terminal of the session, once, and copies nothing".
- 4: met. "copies the prompt, once, for a session with no oculus terminal and types nothing".
- 5: met. "fails with the error the terminal answered, or with the empty string"; commentOutcome gives "The terminal did not answer."; diff-pane "says what a refused or failed send said".
- 6: met. "is refused when there is no terminal and the clipboard is absent or rejects or throws".
- 7: met. The refusal tests, including `\u001b`, STEER_MAX+1, "a\nb" and "a\tb".
- 8: met. "keeps the inside of a two line comment whole".
- 9: met. The `./` prefix test (also `/x.ts`) and "leaves a path with a space or a colon as it is".
- 10: met. diff-pane "offers none for a diff opened from the Repositories view" reads the DiffEditor props; the palette half is `listedWithComment(chords, undefined)` in gutter.test.ts.
- 11: met. diff-session.test.ts id tests and "reads an empty session or one that is not a string as none".
- 12: met. diff-session "reads a state saved before the session existed as none"; instance-state-sources rows.
- 13: met. naming.test.ts "keeps a session's diff pane that session when its file moves".
- 14: met. diff-pane "offers none on a commit, stash, worktree, compare or group diff" (actions 'read' with session 's-1').
- 15: met, through the server render: no `oncomment` once the payload lacks the session (diff-pane). The box closing while it is open is proved by comment-draft.client.test.ts through `allowed`. That `DiffSection`'s `allowed` closure is the reactive one is proved by reading (`DiffSection.svelte:893-903` in the diff).
- 16: met. gutter.test.ts "the comment mark in the glyph margin of a diff" (seven cases).
- 17: partial, Proof 4. The listing is proved by `listedWithComment`. That `onactions` is called again when `oncomment` comes or goes is proved only by reading the `$effect` in `DiffEditor.svelte`.
- 18: met. "does not steer a second time while the first is in flight"; comment-draft "sends once while a send is in flight".
- 19: met. "hands back nothing for an answer that lands after the box was closed or moved"; comment-draft "hands nothing back when the box was closed / the section went".
- 20: met at store level. diff-session "opens the merge editor for a conflict and the file for an untracked path, whatever the session". changes.test.ts's title claims it too without exercising it (Proof 2).
- 21: met. zones.test.ts "orders a bar after the line by its order" (ordinals [1, 0]) and review-comment "is after the commented line of its side, ordered below a hunk bar".
- 22: met. diff-pane "draws the comment box for the bar with the id comment and a hunk bar for a numeric id".
- 23: not verifiable. It is the look on TEST at landing, in a terminal the look starts itself.
- 24: met. diff-pane "calls a session with no title by its id"; review-comment `commentTitle`.

## 1. Spec

- `src/lib/ui/controls/editor/DiffEditor.svelte:329`: `made.updateOptions({ glyphMargin: offering });`
  - What is wrong: item 3 says the editor "turns on the glyph margin of each side it offers" and that "without `oncomment` nothing of this is drawn". Monaco's `glyphMargin` defaults to true (`node_modules/monaco-editor/esm/vs/editor/common/config/editorOptions.js:3267`, `'glyphMargin', true`), and base never set it. So the modified side already had a glyph margin, and this line turns it off whenever no comment is offered.
  - Monaco forces the original side's glyph margin to `renderSideBySide` whatever the option (`diffEditorEditors.js:121`, `result.glyphMargin = this._options.renderSideBySide.get()`), so the line changes only the modified side. Item 3 asks for no such change.
  - Failure scenario: open any diff from the Repositories view, or any commit, stash, worktree, compare or group diff. The modified side's glyph margin column is gone, so its line numbers sit one glyph-margin width further left than before, and further left than the original side's.
  - Fix: leave the option alone (or set it to true) when not offering.
  - Verdict: item 3 violated.
- Brief, "What is on the tree": "`TerminalAnswer = { ok, id, error, terminal? }` ... (`state/sessions/pty-io.ts:72-90`)" and the item 2 signature `Promise<TerminalAnswer>`.
  - What is wrong: `ls src/lib/state/sessions/pty-io.ts` prints "No such file or directory"; the file is `state/sessions/terminal/pty-io.ts` (type at `:18`, `postTerminal` at `:72-92`). An import of it from `state/sources` is refused by the state folder order (`tests/checks/imports/order.ts`, `state/sessions` above `state/sources`).
  - The builder typed the dependency structurally, and `TerminalAnswer` satisfies it.
  - Failure scenario: a builder that follows the brief literally imports from a path that does not exist, and then trips the order check.
  - Verdict: none. The premise is wrong; the builder handled it.
- `src/lib/state/sources/repositories/repositories.ts:207-209`: ``id: session === '' ? place : `${place}:${session}` ``
  - What is wrong: the rules file's "What every package obeys" says every id a package introduces is exercised colliding. The collision exists and no test exercises it, which the report admits.
  - Failure scenario: a file named `a.ts:s-1` opened from the Repositories view gets the id `changed:/hub:a.ts:s-1`, the same as `a.ts` opened for session `s-1`. Opening one activates the other's tab.
  - With real session ids (UUIDs) the case is improbable. The format is the brief's (item 1), so a fix needs the orchestrator's ruling, for example a fixed-vocabulary prefix for the session part that no side token can produce.
  - Verdict: none.

## 2. Proof

- `tests/views/sources/repositories/diff-pane.test.ts:531`: `it('offers none once the payload no longer holds the session, and offers it again when it does', ...`
  - What is wrong: the test never makes the payload hold `s-1` again. Its last render carries only `s-2` and asserts `toBeUndefined()`. The second half of the title is asserted nowhere.
  - Failure scenario: a gate that never re-offers the comment after the session comes back would pass this test, and a reader of the title believes it is covered.
  - Verdict: none (case 15's own text is met).
- `tests/views/sessions/changes.test.ts:411`: `"opens a row's diff for the session the view shows, a merge row and an untracked row as before"`
  - What is wrong: the body calls `onopen` with `'changed'` and `'staged'` only. No merge or untracked row is exercised.
  - Failure scenario: Changes.svelte routing a merge row wrongly would still pass this test. Store-level coverage exists in diff-session.test.ts:131.
  - Verdict: case 20 is met through diff-session.test.ts; this title overclaims.
- `tests/state/sources/repositories/view/diff-session.test.ts:42`: "keeps the diffs of one file in a commit, a stash and a session apart"
  - What is wrong: it passes with the session part removed from `diffState`. The commit and stash ids differ from the plain `changed:` id anyway, so the set still holds three. The report names it an audit; it proves nothing and could be dropped or made to compare against the session-less id.
  - Failure scenario: a reader counts it as coverage of item 1.
  - Verdict: none.
- `src/lib/ui/controls/editor/DiffEditor.svelte` (the two new `$effect` blocks, diff lines 356-389).
  - What is wrong: the glyph margin toggle, the re-registration of Add Comment on Line, and the second `onactions` call when `oncomment` comes or goes are proved by no test. The report's section 7 says so.
  - Monaco cannot mount in the unit suite, so the effects themselves are look-only. But the glyph margin value per `offering` is a plain function of the prop and was left unchecked, which is how Spec 1 went unseen.
  - Failure scenario: Spec 1.
  - Verdict: case 17 partial.

## 3. Standards

- `HELP.md:132`: "in that tab a `+` beside a line (or Add Comment on Line in the line's menu) opens a comment box after it"
  - What is wrong: the rules file's "What every package obeys" says a sentence a change makes false is a defect of the change. `commentActionsOn` (`gutter.ts:600-621`) calls `addAction({ id, label, run })` with no `contextMenuGroupId`, and Monaco appends an action to the editor's context menu only when one is given (`standaloneCodeEditor.js:112-130`). Add Comment on Line is reachable from the oculus palette only.
  - Failure scenario: a reader right-clicks a line of a session's diff to find Add Comment on Line and it is not there.
  - Fix: either the sentence says "or Add Comment on Line in the palette", or the action is given a `contextMenuGroupId`. The second matches VS Code's Add Comment and Decision 5.
  - Verdict: item 7 violated.

## 4. Behaviour

- `src/lib/ui/controls/editor/DiffEditor.svelte:329` (Spec 1).
  - What is wrong: the report's section 6 row "A diff from the Repositories view, a commit, stash, worktree, compare or group diff | unchanged | unchanged" is false. The modified side of each of those diffs loses its glyph margin column, and the change is not stated anywhere in the report.
  - Failure scenario: the look on TEST compares against "unchanged" and either misses the narrower gutter or cannot account for it.
  - Verdict: item 3 violated.
- `src/lib/ui/controls/editor/zones.ts:80-94` (`regrow` through a `ResizeObserver` for every bar).
  - What is wrong: `lineBars()` is also used by `Editor.svelte`, the source and merge editors' bars. Every bar there now grows its view zone when its own height changes. Section 6 lists no change for those editors; section 5 mentions the regrow only for the comment box.
  - Failure scenario: a conflict bar that wraps to two lines on a narrow merge editor now pushes the lines below it down where it used to overlap them. The look reader is not told to expect it.
  - Verdict: none.
- `src/lib/views/sources/repositories/diff/comment-draft.svelte.ts:112-116`: `this.sending = true; ... const result = await sendOnce(...); this.sending = false; if (result === null) return;`
  - What is wrong: a second Ctrl/Cmd+Enter while a send is in flight runs `send()` again. `sendOnce` returns null at once because the guard is held, and that call sets `sending` back to false while the first send is still out. `CommentBox.svelte:39-45` calls `onsend` on the key whatever `sending` is.
  - Failure scenario: press Cmd+Enter twice on a slow terminal. The Send button turns pressable again mid-flight. Nothing is sent twice, since the guard holds, but the box shows a state that is not true.
  - Fix: reset `sending` only for the call that began the send (when `begin()` gave a token), or check `this.sending` first in `send`.
  - Verdict: none (item 4's "Send does nothing" holds).
- `src/lib/views/sources/repositories/diff/CommentBox.svelte:35-37,52`: `{@attach focusText}` on the box's root.
  - What is wrong: the focus is taken once, when the CommentBox mounts. A second `+` on another line of the same side keeps the `comment` item of the keyed `{#each}` in `LineBars.svelte`, so only the outer `placed.above(...)` attachment re-runs and the box is not remounted. The press on Monaco's gutter leaves the focus in the editor, and the text area does not get it back.
  - A move to the other side remounts the box, since it changes LineBars lists, and does focus it.
  - Failure scenario: open the box on modified line 3, press the `+` on modified line 9. The box moves, but typing goes to Monaco rather than the box.
  - This is a reading of Svelte's keyed each and attachment semantics; the look on TEST should confirm it.
  - Verdict: none.

## Where the newer spec sentences on main would also apply

- Comment rewrap at 100 columns: `zones.ts:1-4` (the line "// and hands over" ends mid-sentence); `comment-draft.client.test.ts:8-10`.
- A file within 20 lines of its cap is split: `Diff.svelte` is 537 against 540.
- An error from the engine or a library is mapped to a catalog line: `review-comment.ts:203` shows `result.error` raw (the brief asked for that).
- History wording in test titles and comments: `changes.test.ts:411` "as before", `diff-session.test.ts:67` "as before", `:123` and head `:3` "always had".
- Every edit to an existing assertion, allow list or predicate listed with its before and after: `instance-state-sources.test.ts` table rows, `zones.test.ts` fake `layoutZone`, and the file-wide `vi.mock` of `ChangesRepo` in `changes.test.ts`. The report names the files only.
- A quoted run per added behaviour with that behaviour removed: given for the diff-pane gates and the comment-draft effects; absent for gutter.ts, zones.ts and review-comment.ts.
- The head comment and doc paragraph re-read list ("still true" or "rewritten"), and the list of asynchronous paths with a test name for in flight, after close and superseded: both absent from the report.
- A premise that does not reproduce is quoted in the report's first section: the pty-io path is in section 8.
- Exports with no importer outside their file and tests: `review-comment.ts` `ReviewComment`, `SteerAnswer`, `SendResult`, `SendGuard`, `CommentBarShape`; `gutter.ts` `COMMENT_MARK`, `COMMENT_ACTION`, `TargetKinds`, `TargetAt`, `commentTarget`, `CommentSideEditor` (grep over src).
- Grep for an existing type before writing one: `DiffSide` (`review-comment.ts:17` against `types.ts:58`) and `CommentBarShape` (against `EditorBar`). The layer rule forces the copy, and the report does not say so.
- Visible includes any default a library brings: Monaco's default glyph margin (Behaviour 1).
- Each DONE row quotes the last line of its final run: the rows cite "npm test (third full run)" without the line.

## Declined to judge

- The builder's revert runs (gates taken out of `DiffSection.svelte`, effects taken out of `comment-draft.svelte.ts`): reproducing them means editing a copy of the source, and this review writes no file.
- The diff-pane first run with an empty `CommentBox.svelte`: the base copy holds no such file, and creating one is a write.
- Everything inside Monaco's DOM: the `+` drawn on hover, the press on the real gutter, whether Monaco's keybinding service on the editor container sees keys typed into the overlay text area before Svelte's delegated handler (Escape with the find widget open, Cmd+F), zone alignment on the original side, and the regrow in a browser. These need the look on TEST, and the brief forbids sending a prompt to any real session.
- The six 5000 ms timeouts of the builder's first run in `config-key.test.ts` and `undo.test.ts`: files the step does not change, and not counted, by the rules file's "Verify before you report". My full run had no timeout.
- The files changed outside "Paths this step writes" (`LineBars.svelte`, `data/model/model-sessions.ts` and `index.ts`, `server/machine/pty/sessions.ts`, `comment-draft.svelte.ts`, `instance-state-sources.test.ts`): each is needed by an item (order, the shared steer rule, the size split, the pane state table), and none is a change no item asks for. Accepting the widened list is the orchestrator's call at landing.
- Whether the builder ran any git command: not checkable from the diff.
- I wrote two scratch logs (`a1-checks.log`, `a1-tests.diff`) in this session's scratchpad, outside the project and the worktree. `git status --short` in the worktree printed the same 40 entries after the run as before.

Reviewer usage: about 282,000 tokens (from the remaining-token counter), 44 tool uses, minutes not measured.
