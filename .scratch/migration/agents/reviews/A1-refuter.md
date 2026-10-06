# Step A1 refuter report (on .agents/worktrees/A1, base 3c4f40b2)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The step is judged against `agents/spec.md` as it stood at 3c4f40b2, read from the saved copy `scratchpad/spec-at-3c4f40b2.md`. Places where the newer rule sentences on main would also apply are listed separately, after the four headings.

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

## Repair round 1, refuted

The verify list is green on the final tree: `checks: 7 commands passed`. All eleven rulings are closed. Over the whole diff every item holds, and every case is met except case 23, the look, which is not verifiable here. Three new findings, all small, none with a verdict: two in Standards, one in Behaviour.

```
$ sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md
  (from .agents/worktrees/A1/tools/oculus, node v24.21.0, run 13:46:50 to 13:57:14; output filtered to summary lines)
$ npm test
 Test Files  453 passed | 23 skipped (476)
      Tests  11821 passed | 626 skipped (12447)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  445 passed | 9 skipped (454)
$ npm run check
1790942026406 COMPLETED 3013 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
(built; the last lines are the chunk-size note and the server output list)
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
exit 0
```

`git status --short` printed 41 entries before and after the run.

**The report's evidence, rerun:**
- The round's test files together (comment-draft.client, review-comment, diff-session, naming, gutter, zones, instance-state-sources, type-scale, tests/state/sources/repositories): "Test Files 19 passed (19)", "Tests 985 passed (985)". The report says 982. No decision rests on the count, and the pass reproduces.
- `diff-pane.test.ts`: 38 passed. `changes.test.ts`: 30 passed. `gutter.test.ts`: 27 passed. `review-comment.test.ts`: 35 passed. `diff-session.test.ts`: 13 passed. All as the report says.
- `npx vitest run tests/server/edit/config-key.test.ts tests/server/git/autofetch.test.ts`: "Test Files 2 passed (2)", "Tests 98 passed (98)", as the report says.
- `ls src/lib/state/sessions/pty-io.ts`: "No such file or directory". `src/lib/state/sessions/terminal/pty-io.ts` exists.
- `grep -rniE "as before|always had|saved before|before the session existed"` over `diff-session.test.ts` and `changes.test.ts`: prints nothing, exit 1.
- A grep for the old id form in quotes (`'changed:`, `` `changed: ``, `"staged:` and the like) over src, tests, config, HELP, DESIGN and README, `local.yml` excluded:
  - Hits are only no-session ids in tests (`naming.test.ts:255`, `diff-session.test.ts:28,50,122,170`, `repositories.test.ts:672`, `diff-pane.test.ts:76`).
  - No source code parses a diff id.
- Exports: each of `ReviewComment`, `SteerAnswer`, `SendResult`, `SendGuard`, `CommentBarShape`, `COMMENT_MARK`, `COMMENT_ACTION`, `TargetKinds`, `TargetAt`, `commentTarget` and `CommentSideEditor` is found only in its own file (`grep -rlw` over src and tests).
  - `Refusal` also names unrelated local types in `server/edit` and the layout.
  - Every remaining new export has a src importer outside its file, except `sendComment`. The brief's item 2 names `sendComment` as an export.
- The ASCII gate in the rules file's form, over src, tests, config (`local.yml` excluded), HELP.md and DESIGN.md: prints nothing.
- Line counts (`wc -l`): Diff.svelte 504, DiffSection.svelte 479, DiffEditor.svelte 492, CommentBox.svelte 126, gutter.ts 390, zones.ts 175, review-comment.ts 236, repositories.ts 862, diff-pane.test.ts 675, changes.test.ts 512. All as the report says.
- Folder counts (`ls | wc -l`): state/sources/repositories 10, views/sources/repositories/diff 8, ui/controls/editor 10, tests/state/sources/repositories/diff 7, view 5, tests/views/sources/repositories 10, tests/ui/controls/editor 7.
- `MergeSide.svelte:109` passes `{bars}`. `Source.svelte` passes none. The report's three regrow rows hold.

### The three points you asked me to judge

**1. The full verify list after the builder's last change.**
- The builder's last change was two tests in `review-comment.test.ts:329,339`, made at or before 12:49 (the report's modification time).
- My full run of the list, from 13:46 to 13:57 on that tree, ends `checks: 7 commands passed` and exits 0.
- `npm test` counts 11821 tests, the report's 11819 plus those two.
- The report's NOT DONE line is settled: the list is green. The counts its DONE rows quote ("inside Tests 11819 passed") are two tests short; 11821 is the current figure.

**2. Ruling 2's id form.** `sideOf` (`repositories.ts:139-147`) returns one of these, and `diffState` (`:157-164`) prefixes it to `:<root>:<path>`:

```ts
`compare@${against.root}:${against.path}`   // :141
`group@${group}`                            // :142
'worktree'                                  // :143
`commit@${commit}`                          // :144
`stash@${stash}`                            // :145
subject.staged ? 'staged' : 'changed'       // :146
```

`diffState` adds `@<session>` only when the side is `changed` or `staged` and the session is non-empty (`:160-162`).
- **Against the other kinds:** no collision.
  - Each id begins with a fixed word that contains no `@` or `:`. The word runs to the first `@` or `:`.
  - The words are distinct strings: `changed@` and `commit@` differ at character 2, and `staged@` and `stash@` differ at character 4.
  - So `changed@<session>:` and `staged@<session>:` cannot equal any compare, group, commit, stash or worktree id, whatever the session, root or path.
- **Against a no-session own diff:** no collision. After `changed` or `staged` comes `:` in one and `@` in the other.
- **On main:** X3a added `save@<save>` at `sideOf` line 142. It differs from `staged@` at character 2, so the argument holds after the hand merge at landing.
- **The one theoretical overlap** is between two session ids, and only if a session id contains `:`.
  - Example: session `a:hub`, root `x`, path `p`, against session `a`, root `hub`, path `x:p`.
  - Session ids are transcript file basenames (`transcripts.ts:136`, `codex.ts:50-53`), which are UUIDs in practice.
  - The no-session form had the same property before this step, between root and path.
  - Not a finding of the step.
- The comment at `repositories.ts:150-156` ("the session sits in a position no path can reach") is true.

**3. `repositories.ts` at 862 lines.**
- The rules file says "One source file under 1000 lines ... A file within 20 lines of its cap is split".
- The tree checks a `.ts` file at 900 (`tests/checks/tree/size.test.ts` `LINES = 900`, `utils/size-check.sh` `$1 > 900`). Round 1 used that check's line as "its cap" when it judged Diff.svelte against 540.
- On that reading 862 is 38 under the cap. On the rules file's 1000 it is 138 under. Neither is within 20 lines. Not a finding.
- The step adds 13 lines (849 to 862, `git diff 3c4f40b2 --numstat`: 21 added, 8 removed). Main's copy is 857 after X3a, so the hand-merged file should come to about 870, 30 under 900. Measure it again at landing.

### Rulings

1. **Glyph margin: closed.**
   - `DiffEditor.svelte:331` sets `glyphMarginFor(offering)`, and `gutter.ts:343` returns `offering || MONACO_GLYPH_MARGIN`, which is always true. Nothing sets the margin false.
   - Monaco forces only the original side's margin (`diffEditorEditors.js:121`).
   - Tested at `gutter.test.ts:440-444`. The mutated run is not reproduced.
2. **Id form (Z256): closed.** See point 2 above.
   - The collision test is at `diff-session.test.ts:47-53`, and the readers and fixtures follow the new form.
   - The round's instruction "check that `sideOf` never yields `@`" did not reproduce: `sideOf` does yield `@`. The builder said so in section 3.2 with the lines. See Standards finding 1.
3. **`diff-pane.test.ts:531`: closed.** The test makes the payload hold `s-1` again (`version: 2`) and asserts `oncomment` is a function.
4. **`changes.test.ts:411`: closed.**
   - The test presses changed, staged, merge and untracked rows and asserts the opened ids and `MERGE_VIEW`.
   - For the untracked row it asserts no tab and the `open_unserved` sentence, which shows `openFile` ran.
5. **`diff-session.test.ts`: closed.** `:25-31` asserts that `own` is not `plain`, so it fails with the session part taken out of the id.
6. **Case 17: closed.**
   - `listedWithComment` (`gutter.ts:351`) is tested for both values.
   - The actions effect (`DiffEditor.svelte:345-360`) reads `offering`, and the `build` call to `onactions` is gone.
7. **Right-click menu: closed.**
   - `gutter.ts:378-379` passes `contextMenuGroupId` and `contextMenuOrder`, tested at `gutter.test.ts:488-497`.
   - Whether Monaco draws the entry is for the look.
8. **Bars' regrow: closed.** It is a report-only ruling, and the three rows are present and match the tree.
9. **Send while a send is in flight: closed.**
   - `comment-draft.svelte.ts:100` returns while `this.sending` is true.
   - The test is `comment-draft.client.test.ts` "sends once while a send is in flight".
10. **Focus on a move along one side: closed.**
    - `opened` (`comment-draft.svelte.ts:48,74`) is passed in `DiffSection.svelte:302`.
    - The attachment at `CommentBox.svelte:59` reads `opened` inside its call, so it reruns when `opened` changes.
    - The focus itself is for the look.
11. **Newer rule sentences: closed.**
    - Rewraps: `test:checks` is green.
    - Diff.svelte is 504.
    - History greps print nothing.
    - Edited assertions: section 7 matches `git diff 3c4f40b2` of `instance-state-sources.test.ts`, `zones.test.ts`, `diff-pane.test.ts`, `gutter.test.ts` and `type-scale.test.ts`.
    - Mutation table, head-comment list and asynchronous-path table are present.
    - The exports are local.
    - `DiffSide` and `CommentBarShape` are explained.
    - The pty-io premise is in section 1.
    - The DONE rows quote last lines, two tests short of the final tree, as point 1 says.

In the 35 changed files I found no check removed in place of a fix. One fix reaches beyond its finding: the `Diff.svelte` split moved the reads into `diff-read.ts` (`readDiff`, `GROUP_READS`, `answer`). That is the split ruling 11 asked for, and the moved code is unchanged except that `repo` is now passed as an argument.

### Verdicts, whole diff since 3c4f40b2

**Items:**
- 1: holds.
  - `repositories.ts:130,157-164,183,197,215`; `repositories.svelte.ts:363-369`; `Changes.svelte:204`; `follow.ts:88`.
  - Proved by diff-session, naming and changes tests.
- 2: holds. `review-comment.ts` exports `commentPrompt`, `commentRefusal` and `sendComment`. The refusal reads `STEER_MAX` and `STEER_CONTROL` from `data/model`.
- 3: holds.
  - Glyph margin fixed (ruling 1); menu entry (ruling 7).
  - Second `lineBars` and `order` at `DiffEditor.svelte:137,189-194`, `zones.ts:156`.
  - Head comments rewritten.
- 4: holds. `CommentBox.svelte`; `comment-draft.svelte.ts` (move keeps text, Escape keeps text, the in-flight guard, `opened`).
- 5: holds. `DiffSection.svelte:173` `record !== null && actions !== 'read'`.
- 6: holds. `comment-draft.svelte.ts:99-127`, `commentOutcome`, `NOTICE_MS`, `browserCopy`.
- 7: holds. The 11 `sessions:` keys, `HELP.md:87,132`, `DESIGN.md:399`, `type-scale.test.ts:254`. HELP.md:132's "in the line's menu" is backed by `contextMenuGroupId`.

**Cases:**
- 1 to 9: met, by the review-comment.test.ts cases the first run named.
- 10: met. diff-pane "offers none for a diff opened from the Repositories view"; `listedWithComment(chords, false, ...)`.
- 11: met. diff-session id tests, including `:47` (a file named `a.ts:s-1`) and `:55` (sessions named `changed`, `staged`, `/hub` and empty).
- 12: met. diff-session "reads a state with no session key as none"; instance-state-sources rows.
- 13: met. `naming.test.ts:248`.
- 14: met. diff-pane, `actions: 'read'`.
- 15: met. diff-pane `:531`, which now covers the session coming back, on a fresh render.
- 16: met. gutter.test.ts comment-mark cases.
- 17: met as ruling 6 defines it. That the effect reruns on an `oncomment` change is shown only by reading the code; Monaco does not mount in the unit suite.
- 18: met. comment-draft "sends once while a send is in flight"; review-comment `:266`, `:329`.
- 19: met. comment-draft "hands nothing back when the box was closed / the section went"; review-comment `:280`, `:339`.
- 20: met. changes.test.ts `:415-441` and diff-session `:173`.
- 21: met. zones.test.ts order case; review-comment `:391`.
- 22: met. diff-pane bar-snippet case.
- 23: not verifiable here. It is settled by the look on TEST at landing, in a terminal the look starts itself.
- 24: met. diff-pane title case; `commentTitle`.

### Findings

**Standards 1. Report section 1 and section 3.2: "`sideOf` (`repositories.ts:139-147`) does yield `@`".**
- What is wrong: the round's ruling asked the builder to confirm that `sideOf` never yields `@`. That premise did not reproduce. The rules file's "Report" section requires a premise that does not reproduce to be quoted in the report's first section, with the command that disproves it. The builder put it in section 3.2 with line numbers and no command.
- Failure scenario: someone reading section 1 for wrong premises sees only pty-io. They miss that one of the round's own instructions was false, though Z256's id form is still sound (point 2).
- Verdict: none.

**Standards 2. `src/lib/views/sources/repositories/diff/diff-read.ts:28`: `export async function readDiff(state: DiffState, repo: Git | null)`.**
- What is wrong: `src/lib/server/core/git.ts:800` already has a module-local `function readDiff(root, args, timeout)` that does something different.
- The rules file's "The principles every package is judged on" requires a grep of `src` and `tests` for a new helper's name, quoted in the report. The report quotes none for `readDiff`.
- No reuse was possible. The defect is two unrelated functions under one name.
- Failure scenario: a reader runs `grep -rn readDiff src` and lands in the server's git reader, which has nothing to do with the diff pane's fetch.
- Verdict: none. Fixable at landing by renaming one of the two, for example `readPaneDiff`.

**Behaviour 1. `src/lib/ui/controls/editor/DiffEditor.svelte:375-376`: `const side = mode === 'inline' ? made.getModifiedEditor() : (focused ?? made.getModifiedEditor());`.**
- What is wrong: in the inline layout every palette action of a diff now runs on the modified editor. Before, it ran on the editor that last had the focus. This holds for every diff, not only session diffs. The report's before-and-after section does not state it.
- It serves item 3: in inline only the modified side carries Add Comment on Line.
- Failure scenario: in a Repositories diff, click into the original side in side-by-side, switch to Inline View, then run a palette action such as Find. Before, it ran on the hidden original editor and showed nothing. Now it opens on the visible modified side. The landing look is not told to expect a change.
- Verdict: none.

### Declined to judge

- **How the delta was taken.** No tree state was recorded when the round was sent at 12:05. The delta is the 35 files modified after the round's rulings file, as listed in `scratchpad/a1-round1-files.txt`. I read each through `git diff 3c4f40b2 -- <file>`, against the whole diff since the base. So a line of those files changed in the first build cannot be told apart from one changed in the round.
- **The builder's mutated runs and its pre-round failing runs** (sections 3 and 5). Reproducing them means editing a copy of the source, and this review writes no file. No pre-round copy of the tree was available to me.
- **Everything inside Monaco's DOM and the browser:**
  - the `+` on hover, the press on the real glyph margin, and the right-click entry being drawn;
  - the focus after a move along one side, given that Monaco may refocus its own text area after the mousedown;
  - Escape and Ctrl/Cmd+Enter inside the overlay;
  - the regrow, and the alignment of bars on the original side.

  These need the look on TEST.
- **Whether `glyphMarginFor`, which always returns true, is the right shape.** It is the orchestrator's ruling 1 as written. The builder followed it.
- **The six diagram files in the delta list that `git status` does not show as modified** (`channels`, `layer-data`, `layer-shell`, `layer-ui`, `writes`). They were rewritten with the same content. `test:checks` is green.
- **Whether the builder ran any git command.** It cannot be seen from the diff.

Reviewer usage: about 250,000 tokens (from the remaining-token counter), 41 tool uses, about 22 minutes. Served model: claude-opus-5-5.


## Closed

- Repair round 1, Standards 1 (a premise of the round that did not reproduce, reported outside section 1): closed at landing; the booking states that `sideOf` does yield `@` and that the id form of Z256 holds regardless, as the review's point 2 shows.
- Repair round 1, Standards 2 (`readDiff` in `views/sources/repositories/diff/diff-read.ts` shares its name with `server/core/git.ts`'s local `readDiff`): fixed at landing on main, the pane's function renamed `readPaneDiff` with its callers.
- Repair round 1, Behaviour 1 (in the inline layout a diff's palette actions run on the modified editor): closed at landing; stated in the booking with its before and after, and looked at on TEST.
