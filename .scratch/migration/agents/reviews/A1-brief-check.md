# A1 brief check

BRIEF CHECK OF STEP A1 (oculus/migration), main at 3dc0b879. Nothing was changed anywhere. config/local.yml was never opened. No URL fetched, no port touched, no server started. Everything below was read or run in /Users/axelfaes/workspace/research-hub, read-only.

Summary: 21 findings. The ones that most need a ruling or a brief edit are Names 1 and 2, Cases 2 to 6 and 9, The question 1, and Other 1.

## Names

Command used for each name: `git grep -n -- "<name>" -- tools/oculus ':!tools/oculus/config/local.yml' ':!tools/oculus/.scratch' ':!tools/oculus/docs/diagrams'`. Hits inside the brief's "Paths this step writes" are not listed.

1. `src/lib/state/sources/explorer/follow.ts:70-97` (`followedDiffTab`), called from `explorer/ops.svelte.ts:219` (`tab.view === DIFF_VIEW ? followedDiffTab(...)`).
   - What it does: it rebuilds the subject field by field (`root, path, staged, worktree, commit, stash, group, against, line`) and returns `diffState(subject, label)`.
   - The change makes it false: a session diff tab whose file is renamed or moved in the Files view loses `session`. The tab id changes and the `+` and the action vanish.
   - Not in the brief's paths. `tests/state/sources/explorer/naming.test.ts:238-260` uses `diffState` and `followedDiffTab`. X3a's brief names `state/sources/explorer/` (new modules), so follow.ts is a shared file.
   - Expected result to add as a case: a session diff tab followed to a new path keeps `session`, with id `...:<new path>:<session>`.
2. `tests/views/whole/type-scale.test.ts`.
   - Line 255-256 lists `sources/repositories/diff/Diff.svelte` and `DiffSection.svelte` (`'.file=fs-sm'`). Line 311 lists `DiffEditor.svelte` (`'.diff-editor=fs-sm'`).
   - The first test, `lists every view file in the audit`, compares every `.svelte` under `src/lib/views` with the keys of `VIEWS`. The new `CommentBox.svelte` fails it unless it is added. Any new `font-size` rule in DiffSection or DiffEditor changes those rows too.
   - Not in the brief's paths. Both X3a and D18 list this file in their paths.
3. Documents.
   - `HELP.md:182` is the paragraph that describes the diff pane (layouts, hunk bars, Alt+F5). It is not in A1's paths, and Q88c's range 171-213 covers it.
   - `HELP.md:89` is the key table row `Ctrl+Enter / Cmd+Enter | commit, in a commit box's message field`. A new Cmd+Enter and Escape in the comment box belongs in that table. Line 89 is in nobody's range.
   - `HELP.md:132` says "each row opening the same diff pane". After the change a Changes row opens its own tab, so "the same" is inexact. The brief's one-sentence addition does not correct it.
   - `DESIGN.md:399` says "the sessions' Changes rows open the same pane" and describes the diff pane. DESIGN.md is not in the paths and no step is given the edit.
4. `DiffEditor.svelte:12-14` head comment says the bars sit "above lines of the modified side". It becomes false when original-side bars exist. The file is in the paths, so this is a sentence for the builder to fix. The DiffSection head comment (lines 1-23) needs the same care.
5. Hits the change does not make false (checked):
   - `views/sources/files/tree/Tree.svelte:213` (`diffState`, compare) and `views/sources/repositories/Worktrees.svelte:33,45` (`DiffSubject` type) are unaffected.
   - `ChangeRow.svelte:73-74,112` and `menus/change-menu.ts:138,166` call `openChange` with three arguments and are unaffected.
   - `Editor.svelte:58,102,156` use `EditorBar` and `lineBars`. An optional `side` is meaningless there but harmless.
   - `config-folder.test.ts:234` names `views/sessions/changes.yml` and needs no change, since no text file is added.
6. `config/text/views/sessions/changes.yml` holds two groups, `git:` (line 3) and `sessions:` (line 53). Q88c's paths say "`config/text/` (the repositories, git and `ui.yml` files)". Q88c may write the same file as A1. The brief's last premise does not name it, and does not say which group A1's new keys join.
7. `tests/state/sources/repositories/view/repositories.test.ts` is 883 lines (`wc -l`). The existing `openChange` cases are at :730-733. The limit is 900, so an A1 case added there is likely to need a new file. The brief only says "under tests/state/sources/repositories/".

## The step line

Command: `grep -n "^- A1 " plan.md` prints line 465. Step 0 is line 466. The Rulings line "The queue (2026-09-28)" is plan.md:687; it only marks the queue as Axel's and adds nothing about A1.

Mapping of the plan's parts to the brief's items:
- "a comment on a line of a session's diff" is served by items 3 and 4.
- "from the Changes view" is served by item 1.
- "sent to that session as a prompt" is served by items 2 and 5.
- Step 0 "prefixed with its file and line" is item 2.
- Step 0 "typed into the session's oculus terminal when the session runs in one" is item 5, first branch.
- Step 0 "for any other session ... copied to the clipboard with a line saying so" is item 5, second branch, with the words of item 6.

Findings:
1. No part of the step line or Step 0 is without an item. The step line carries no check of its own. The only check is the brief's "Verify before you report".
2. Step 0 says "typed into". `steerTerminal` types and then presses Enter (sessions.ts:520-522). That matches the plan line's "sent as a prompt" and brief decision 2. It is consistent, but a reader of Step 0 alone could expect no Enter.
3. Items with no part of the plan line behind them, which are user-visible choices the brief does not record under "Decisions taken":
   - original-side commenting (decision 3 does record this one);
   - the palette action named "Add Comment on Line";
   - the key chords Cmd+Enter and Escape;
   - the "(before the change)" marker;
   - the five-second "Sent to" line.
   The hub rule is "No silent design decisions".
4. `queue.md:26` reads "A1 and A3 (review with feedback; scheduled runs, once D17 has landed)". D17 is in the queued list (`queue.md`, "Queued, in order") and has not landed. plan.md:465 gives A1 no "after". plan.md:469 gives A3 "after D17". The brief does not say whether the clause covers A1. A1 uses nothing of D17 that I can find. Whether A1 is blocked is the orchestrator's call, and the brief should state which reading was taken.

## Premises

Commands: `wc -l` on every file named, `sed -n` and `grep -n` on the lines quoted, `git ls-tree --name-only HEAD <dir>/ | wc -l` for folders.

Held as the brief says:
- Line counts: Changes.svelte 236, repositories.svelte.ts 385, repositories.ts 849, Diff.svelte 536, DiffSection.svelte 419, DiffEditor.svelte 398.
- `DiffSubject` 117-129; `diffState` 152-154, with id `${sideOf(subject)}:${root}:${path}`; `heldDiffShape` at 160; `DiffView` and `diffViewOf` 285-319.
- `openChange` type :105 and body :362-366; `openDiff` :222-224.
- `DiffEditor` `contextmenu: true` :143, `lineBars()` :118, `onactions` :175, `EditorBar` types.ts:58, `DiffCommand` and `DiffHandle` types.ts:61-64.
- `terminalOfSession` :634-642 and `steerTerminal` :603-605 in terminals.svelte.ts.
- sessions.ts: `steerArgs` :520-522, `STEER_MAX` :525.
- Clipboard writes at CopyValue.svelte:15 and text-menu.ts:104.
- HELP.md:132 is the `changes` row.
- Folder counts, all as stated: `state/sources/repositories` 9, `views/sources/repositories/diff` 5, `ui/controls/editor` 10, `tests/views/sources/repositories` 10, `tests/state/sources/repositories` 3, `tests/ui/controls/editor` 7. Also `config/text/views/sessions` 9, `tests/views/sessions` 10, `src/lib/views/sessions/changes` 3.
- ADR line: `ls docs/adr tools/oculus/docs/adr` prints "No such file or directory" for both.
- The verify block of orchestrator-state.md holds 7 commands, so "checks: 7 commands passed" is the right count. `~/.claude/skills/land/templates/checks.sh` exists.
- `grep -n "openChange\|DiffSubject\|diffState\|heldDiff" Q88c.md` prints nothing.
- Example paths of decision 1 exist: `registries/organisations.yml` and `projects/manuscripts/raw-pls/project.yml` both listed.

Wrong or imprecise:
1. Changes.svelte: the brief says "`sessionFor(instance.id)` (:39), whose `workspace` ... (:40-42)". The tree shows `const record = $derived(sessionFor(instance.id))` at :46, `workspace` at :47, `files` :48, `repo` :49, `shape` :50. Line 39 is the `selectors: { gitFor, sessionFor, touchers }` destructure. The :203-204 reference is right.
2. `SteerBox.svelte:33` for `foreign` is actually :34 (`grep -n foreign SteerBox.svelte` prints `34:`).
3. `selectors.svelte.ts:122` is the type line. The function is at :376.
4. "X3a, D18 and M3 write none of this step's paths" is not fully true. X3a's paths include `tests/views/sources/` and `tests/state/sources/` (the folders A1's tests go in). X3a and D18 both write `tests/views/whole/type-scale.test.ts`, which A1 also needs (Names 2). Q88c's own folder rule may split `tests/views/sources/repositories` (see Other steps), which would move `diff-pane.test.ts`.
5. "A terminal with `foreign: true` is not one oculus may type into": `terminalOfSession` already filters those out (`terminals.svelte.ts:636`: `terminals().filter((one) => one.foreign !== true)`). Case 4 is addressed under Cases.

## Cases and checks

1. Case 4 is unreachable through `terminalOfSession`, so a foreign terminal is never returned and a test for it exercises a dead branch. Either drop the case, or say that item 5's check `without foreign: true` is redundant.
2. The `+` collides with Monaco's own diff indicators.
   - `registrations.contribution.js:25-37` registers `linesDecorationsClassName: 'insert-sign ' + codicon add` on every added line and `'delete-sign ' + codicon remove` on every removed line.
   - `renderIndicators` defaults to true (`common/config/diffEditor.js:13`). `DiffEditor.svelte` build options (lines 128-148) do not set it.
   - Result: a permanent `+` is already in that column on added lines of the modified side, and a `-` on removed lines of the original side. The hover `+` would draw over the `-` in the same lane.
   - The brief does not say what to do, for example `renderIndicators: false` or hiding the sign class under the hover mark.
3. Capabilities in Monaco 0.57.0 (`node_modules/monaco-editor/package.json`):
   - `linesDecorationsClassName` exists: Monaco's own diff decorations use it; oculus uses it in `gutter.ts:65`.
   - `MouseTargetType.GUTTER_LINE_DECORATIONS = 4` exists: `standaloneEnums.js:725`, and `Editor.svelte:243-262` already maps a press with it.
   - `onMouseMove` (editor.api.d.ts:6130) and `onMouseLeave` (:6135) exist.
   - `lineBars()` is mountable on the original editor in source terms: `zones.ts` takes any `ICodeEditor`, and the diff editor aligns zones of both editors (`diffEditorViewZones.js:387-389`, `getAdditionalLineHeights` for original and modified). I did not run it.
   - Precedent for the gutter logic is `gutter.ts` with `gutter.test.ts`. That test file's head says it does not cover "Monaco drawing those decorations and reporting a press on them, which the look does".
4. `gutter.ts` is not in the brief's paths, and `ui/controls/editor` is full (10). If the hover-decoration and press-mapping logic is put in `DiffEditor.svelte` it can be tested by nothing. Add `src/lib/ui/controls/editor/gutter.ts` to the paths so it can be a pure function with a test.
5. "A `TextArea` with the focus": `ui/forms/TextArea.svelte` has no autofocus prop and exposes no element. The precedent is `Prompt.svelte:33` (`box?.querySelector('input')?.focus()`). The brief does not say how, and `TextArea.svelte` is not in the paths.
6. Escape: `shell/keys/workbench-keys.svelte.ts:130-139` restores the panes on an Escape that is not `defaultPrevented`. The box's keydown must `preventDefault` on Escape, or an Escape in the box also restores a maximised pane. Case 14 does not say so.
7. Cmd+Enter. The brief says "Cmd+Enter (Ctrl+Enter off macOS) sends".
   - The existing precedent `CommitBox.svelte:136-138` accepts `ctrlKey || metaKey` on every platform.
   - `CommentBox` is not an editor and does not know `loaded.mac`. How it learns the platform is not stated.
   - The key is user-visible, and the brief's decisions list omits it.
8. Existing `hunkBar` snippet. `DiffSection.svelte:254-257` does `{@const at = Number(id)}` and `hunks.at(at)`. The comment bar goes through the same `bar` snippet (`DiffEditor.svelte:341-343`). A non-numeric comment id gives `Number('comment')` = NaN, and `Array.prototype.at(NaN)` is `at(0)`, so the comment bar would draw hunk 0's bar. The snippet must branch on the id, and the brief does not say so.
9. Where the sending logic lives. Cases 3 to 8 and 18 are the behaviour. Item 5 puts it in the components. In this repository's unit setup components are only server-rendered, so those cases can be tested only if the logic is a function in a `.ts` module with `terminalOfSession`, `steerTerminal` and the clipboard injected. The brief names `review-comment.ts` only for `commentPrompt`. Without that requirement, cases 3 to 8 and 18 stay look-only.
10. Case 15 ("moves there, its text kept"). A bar on the other side is a different `LineBars` instance, so `CommentBox` is remounted. The text survives only if it lives in `DiffSection`, not in `CommentBox`. Within one side, `{@attach placed.above(one.after)}` is re-evaluated when `after` changes (LineBars.svelte:23). The brief does not say where the text is kept.
11. `onactions` is called once, in `build` (`DiffEditor.svelte:175`), and `Diff.svelte:476` overwrites `actions` with each section's list. Case 11 ("the `+` and the action go") and "without `oncomment` nothing is listed" need the list re-offered when `oncomment` appears or goes. A Monaco action must also be registered on each side with its label. The label comes from the catalog, so the primitive needs a prop for it (a ui primitive imports no state). The brief states none of this.
12. Answer shape. `TerminalAnswer` is `{ ok, id, error, terminal? }` and `postTerminal` never throws (`pty-io.ts:72-90`). In an environment without `fetch` it returns `{ ok:false, error:'' }`, and a non-2xx response with no error text gives `String(status)`. Case 5 says the box "shows the error"; with `error: ''` nothing would show. Add a case: failure with an empty error shows a fallback line.
13. The clipboard API can be absent. `navigator.clipboard` is undefined outside a secure context, so `writeText` throws a TypeError synchronously and does not reject. Case 6 covers only a rejection. `grid-actions.ts:85` and `CopyValue.svelte:13` guard the absent case.
14. Size margins (`utils/size-check.sh`, `tests/checks/tree/size.test.ts:28-29`; the allow list is empty):
   - Diff.svelte is 536 of 540. Only 4 lines of room for what item 4 asks of it.
   - repositories.ts is 849 of 900.
   - DiffSection is 419 and DiffEditor is 398, so both fit.
   - `state/sources/repositories` goes from 9 to 10 with `review-comment.ts`; the rule is "at most ten", so it passes but is full.
15. Words (item 6). The three lines of item 5 are the sent line, the outside-oculus line and the clipboard-refused line. "and the refusal line" then counts the third twice. `TextArea` requires a `label` prop, so one more key is needed. The empty-error fallback of finding 12 is another. The five-second display is a cadence constant. The spec says a value with a config key is read from config, so the brief should say whether it is a `behavior.yml` key or a code constant.
16. Monaco overlay widget with a textarea. `zones.ts` mounts an overlay widget `getPosition: () => null`. Every existing bar holds only buttons (merge editor, hunk bars). A textarea there is new, and I could not check whether Monaco's key service or its mouse handler takes the keys or the focus. Not verified; only the look can show it.
17. Gate. The brief gates the affordance on "the pane's state names a session that `sessionById` still holds". `DiffSubject` allows `session` on any subject, so a commit, stash, worktree, compare or group diff carrying it would get the `+`. The existing predicate for a file's own diff is `diffActs(held)` (`repositories.ts:220-229`). The brief does not say whether to combine them.
18. Verification checks.
   - Check 2 (`grep -rn "oncomment" ...`) prints lines; it shows where the name occurs, not that the prop is passed conditionally. `DiffEditor` has one caller (`DiffSection.svelte:333`).
   - Check 3 ("fails on the unchanged tree") for a test of the new module `review-comment.ts` fails as a missing import, which says nothing about behaviour.
19. Case 10 has the right ids by `diffState`. `stateId` (`instance.ts:132-142`) prefers `id` over `session`, so a `session` field on the state does not change how `openBeside` matches an open tab: the same id activates the existing tab and restates it, a different id opens a second tab.
20. Case 16 holds: the merge and untracked branches of `openChange` (:362-364) never take a session.
21. Case 17 holds with `z.string().catch('')`.
22. Optional alternative for the `+` mark: Monaco's own `codicon codicon-add` class is available without writing a glyph into a `.ts` or `.svelte` file. This is a suggestion for the builder, not a defect.

## The question

Goal: a comment on a line of a session's diff reaches that session as a prompt naming the file and line, typed into its oculus terminal or copied with a line saying so.

Can a Monaco gutter press be tested in this repository? No.
- `vite.config.ts:51-66` has two projects. `unit` runs in `environment: 'node'`, where a component renders to a string. `client` uses `tests/ui/frame/client-runtime.ts`, Svelte's client runtime with no DOM.
- `git grep -ln "jsdom\|happy-dom" -- package.json vite.config.ts tests` prints nothing. There is no jsdom.
- Monaco is not loaded in unit tests. `DiffEditor` renders its plain `<pre>` before load.
- What a test can do instead: a pure function over a mouse-target shape (`{ type, position.lineNumber }`) and a fake editor with `onMouseMove`, `onMouseLeave`, `onMouseDown`, `createDecorationsCollection`, as `zones.test.ts` does with its fake editor. It can check one decoration on the hovered line, clearing on leave, and `oncomment(side, line)` called once on type 4. It cannot check Monaco's real hit-testing, the drawing of the `+`, or the overlap in Cases 2.

Could each thing pass without the goal reached?
- Item 1 (session on the diff): yes. Ids and state plumbing can pass with no `+` working.
- Item 2 (`commentPrompt`): yes. A pure string function can pass with no UI.
- Item 3 (affordance): yes. Nothing in the unit setup runs the press. The look on TEST is the only proof.
- Item 4 (box): yes. Focus, Cmd+Enter, Escape and moving are DOM-only. A server render of CommentBox shows markup only.
- Item 5 (sending): cases 3 to 8 and 18 can be real tests only if the logic is extracted (Cases 9). Otherwise they pass with the logic wrong or absent, because nothing runs it.
- Item 6 (words, HELP): yes. Text passes with nothing working.
- Case 1 and case 2: the steer-text half can be tested; the hover, press and box half is look-only, so as written they can pass with the gutter dead.
- Cases 3, 5, 6, 7, 8, 18: testable if extracted, otherwise look-only.
- Case 4: tests nothing (Cases 1).
- Cases 9, 11 (the gate half), 16 and 17: testable. A recorder around `DiffEditor` (like `press-on-render.ts`) can read the `oncomment` prop. These prove the gate, not Monaco.
- Cases 10 and 17: real tests of ids and of the shape read.
- Cases 12, 13, 14, 15: DOM and Monaco only; look-only unless the pure helpers of Cases 4 and 9 are added (a key function like `promptKey` in `composer.ts:264-271`, a pure gate for inline).
- "Verify before you report" (7 commands, `checks: 7 commands passed`): yes. All seven can pass with the `+` never appearing, since no command runs Monaco.
- The end-to-end proof is the look on TEST with a session in a terminal that the look itself started, since the comment types a real prompt into a live terminal. The spec lets the look start its own terminals (Z57) but never touch others. The brief gives no such look recipe; its "before and after" section is what the look is read against.

## Implied inputs

Each is missing from "Cases". Expected result in brackets.

1. The diff re-reads while the box is open. A session is editing files, and `Diff.svelte:237-249` reads again on every `git` channel state; `files` is replaced when `sameFiles` is false and the model is `setValue`d. [The box stays with its text; the prompt names the line as drawn at Send; or the box closes. The brief must choose.]
2. A renamed file, original side. `DiffSection.svelte:340` has `originalPath` as `file.oldPath`. [Prompt uses `oldPath` for the "(before the change)" line; the brief says "the path as the diff shows it".]
3. A staged diff. The modified side is the index, not the worktree. [Prompt names the line of the staged version; whether it says "staged" is undecided.]
4. A deleted or added file. [Deleted: only original lines, prompt uses `oldPath`. Added: no original side.]
5. A path with a space or a colon: `my file.ts:12: x`, `a:b.ts:12: x`. [Unchanged, or the path quoted; undecided.]
6. A path starting with `!`, `#`, `@` or `/` (the agent's input box reads these as shell, memory, mention or command). Repo-relative paths never start with `/`. [Documented, or the prompt prefixed.]
7. A comment holding a control character, such as a pasted escape. The server refuses it (`sessions.ts:534-537`, 0x00-0x08, 0x0b-0x1f, 0x7f, so CR too). [Steer path: box stays with the error. Clipboard path: copied as typed; undecided whether to refuse.]
8. A second Send while the steer is in flight. SteerBox guards with `sending`. [Second press does nothing; otherwise the prompt is typed twice.]
9. The box closed, moved or its section destroyed while the steer is in flight, and the answer arrives after. [No state written to a gone component; "Sent to" decided.] The spec requires exercising "in flight, after close, superseded".
10. The terminal ends while the box is open. [Steer answer `ok:false` shows the error; or `terminalOfSession` is null at Send and the clipboard line says "runs outside oculus", which is wrong for a session whose terminal just ended.]
11. The session title is empty. `SessionRecord.title: string`; `SessionPicker.svelte:39` falls back to the id. [Fallback to the id.]
12. The session is waiting at a permission prompt, or has text half typed in its input. The prompt is typed and Enter pressed, which can answer the dialog. SteerBox has the same exposure. [Decision: same as SteerBox, or gated on session state.]
13. `session: ''`, non-string `session`, duplicated and colliding values. The spec requires "every id or key exercised empty, duplicated, and colliding". [Empty reads as none and adds no `:`; a number reads as `''`; two sessions give two ids.]
14. Layout switched to inline while an original-side box is open. [Box closes or moves to the modified side.]
15. Unchanged context lines are hoverable and commentable on both sides. On the original side an unchanged line's number differs from the file the agent has. [Decision: say "(before the change)" for an unchanged line, or map to the modified line.]
16. Unsaved text when the tab closes or the section is destroyed. [Dropped silently; or the brief says so.]
17. Two diff tabs for different files of one session, each with a box. [Independent; Send from one leaves the other.]
18. Group diff holding several files with `session` set: not reachable from the Changes view (the Changes rows open file diffs). [Each section uses its own file path; one box per section.]
19. A comment over the cap on the clipboard path. [No refusal there while the steer refuses over 100,000; stated difference.]
20. The comment bar and a hunk bar after the same line (a comment on the line before a hunk). Both zones use `ordinal: 0` (`zones.ts:30`). [Order undecided.]

## ADRs

1. `ls tools/oculus/docs/adr docs/adr` prints "No such file or directory" for both. `grep -n "adr" .agents/plan.yaml` prints nothing. Neither folder nor key exists. The brief's statement holds.

## Other steps and VS Code

1. Steps in flight (briefs read under `tools/oculus/.scratch/migration/agents/briefs/`):
   - Q88c: writes `repositories.ts` and `repositories.svelte.ts` (named), `HELP.md` 44, 113, 171-213, 222 (named, no clash with 132). Also writes `tests/views/sources/repositories/` and `tests/state/sources/`, and `config/text/` including the file holding the `git:` group (Names 6). Its rule "A folder at ten items is split ... `tests/views/sources/repositories` ... hold ten" can move `diff-pane.test.ts` before A1 lands. The brief does not name these. Q88c's diff was not seen.
   - X3a: `tests/views/sources/`, `tests/state/sources/`, `tests/views/whole/type-scale.test.ts`, `state/sources/explorer/` (follow.ts is there), HELP.md Files rows.
   - D18: `tests/views/whole/type-scale.test.ts`, HELP.md line 70 and a new row after 145.
   - M3: no overlap with A1's paths found; HELP.md 238 and 244 only.
2. VS Code claims (`+` on hover, Cmd+Enter submits, Escape cancels). I found no VS Code source or comment-widget text in the repository to check against (`git grep -n -i "comment widget"` over DESIGN.md, HELP.md and README.md prints nothing). From recall:
   - Cmd+Enter (Ctrl+Enter off macOS) submits in VS Code's comment editor.
   - The `+` appears in the gutter on hover of a commentable line.
   - Escape hides the widget and, as far as I remember, keeps a non-empty draft rather than discarding it. That differs from "cancels" if the brief means the text is dropped.
   These are not verified.

## Declined to judge

- Anything at runtime: whether the textarea inside a Monaco overlay widget receives focus, keys and mouse events as expected; whether a bar on the original editor aligns; how the `+` and Monaco's insert/delete signs look together. I started nothing and fetched nothing.
- VS Code's exact Escape and hover behaviour (no source available here).
- Whether Q88c's and X3a's merges with A1 are "simple": their diffs were not read.
- Whether to block A1 on D17 (Step-line 4): a ruling for the orchestrator.
- Look and feel of the box and the theme fit: only the look on TEST can show it.

Usage: claude-sonnet-5-5 (the transcript's message.model, read at 08:57), 269,064 tokens, 76 tool uses, 11.9 min.

# Closed

Each finding closed by a change to `agents/briefs/A1.md`, before the preparation commit:

- Names 1: item 1 carries `session` through `followedDiffTab`; `follow.ts` in the paths; case 13; the shared folder with X3a named in the last premise.
- Names 2: item 7 adds `CommentBox.svelte` and any new font size to `type-scale.test.ts`, in the paths.
- Names 3: item 7 corrects `HELP.md:132` ("its own diff tab"), adds the send key to `HELP.md:87` (the row is at 87, not 89) and corrects `DESIGN.md:399`; `HELP.md:182` stays Q88c's.
- Names 4: item 3 has the builder correct both head comments.
- Names 5: no change needed.
- Names 6: item 7 puts the keys in the `sessions:` group; the last premise names Q88c's `git:` group.
- Names 7: the paths put new state tests in a new file where `repositories.test.ts` (883 lines) has no room.
- Step line 1, 2: no change needed; item 6 states that Enter is pressed, as the Steer box does.
- Step line 3: Decision 5 records the action's name, the markers, the five seconds and the keys.
- Step line 4: Decision 8; `queue.md:26` now lists A1 and A3 on separate lines, A3 alone after D17.
- Premises 1, 2, 3: line numbers corrected (`:46-50`, `SteerBox.svelte:34`, `selectors.svelte.ts:376`).
- Premises 4: the last premise names X3a's, D18's and Q88c's shared test files and folders.
- Premises 5, Cases 1: the foreign-terminal case dropped; the premise says `terminalOfSession` already leaves those out.
- Cases 2: Decision 6, the `+` in the glyph margin, Monaco's signs kept in their lane.
- Cases 3, 4: item 3 puts the hover and target logic in `gutter.ts`, in the paths, tested over a fake editor; case 16.
- Cases 5: item 4 focuses the text area through its element, as `Prompt.svelte:33`.
- Cases 6: item 4, Escape with `preventDefault` and `stopPropagation`; case 23 checks the panes in the look.
- Cases 7: item 4 and Decision 5, Ctrl or Cmd with Enter on every platform, as `CommitBox.svelte`.
- Cases 8: item 4 and case 22, the bar snippet branches on the id `comment`.
- Cases 9: item 2, `commentRefusal` and `sendComment` in `review-comment.ts` with their dependencies passed in; cases 3 to 8 and 18, 19 are its tests.
- Cases 10: item 4 keeps the text in the section's state.
- Cases 11: item 3 calls `onactions` again when `oncomment` comes or goes, takes `commentLabel` as a prop and registers the action on each offered side; case 17.
- Cases 12: item 6 and case 5, "The terminal did not answer." for an empty error.
- Cases 13: item 6 passes a null clipboard when `navigator.clipboard` is absent; case 6.
- Cases 14: item 5 limits `Diff.svelte` to four added lines, the logic in `DiffSection.svelte` and `review-comment.ts`.
- Cases 15: item 7 lists every key; the five seconds is a code constant, Decision 5 and item 6 say why.
- Cases 16: case 23, the look on TEST in a terminal it starts itself; verify 3 lists what only the look shows.
- Cases 17: item 5 gates on `diffActs(held)` as well; case 14.
- Cases 18: verify 2 replaced by recorder tests of the gate; verify 3 names the missing-module first failure as such.
- Cases 19, 20, 21: no change needed.
- Cases 22: Decision 6 takes the glyph margin; the mark is the builder's choice within the conventions.
- The question: item 2 moves the send into functions that tests reach; case 23 is the end-to-end proof in the look.
- Implied inputs 1: item 4, the box stays after the same line and the prompt names it.
- Implied inputs 2, 4: item 2 uses the old path on the original side; an added file has no original side.
- Implied inputs 3: item 2's "(staged)" marker; case 1.
- Implied inputs 5, 6: item 2 writes `./` before a path starting with `!`, `#`, `@` or `/`, other paths unchanged; case 9.
- Implied inputs 7, 19: Decision 7 and `commentRefusal`, the same refusal on both paths; case 7.
- Implied inputs 8, 9: item 4; cases 18 and 19.
- Implied inputs 10: item 6's clipboard line is true for a terminal that ended.
- Implied inputs 11: item 4 and case 24.
- Implied inputs 12: item 6 states the same exposure as the Steer box.
- Implied inputs 13: item 1 and case 11.
- Implied inputs 14: item 4 closes an original-side box on the switch to inline, keeping its text.
- Implied inputs 15: the original side's line numbers are the old version's, which "(before the change)" says.
- Implied inputs 16: item 4, the text is dropped when the section goes.
- Implied inputs 17: one box per file section, independent.
- Implied inputs 18: item 5's gate excludes a group diff.
- Implied inputs 20: item 3 orders the comment bar below a hunk bar; case 21.
- ADRs: no change needed.
- Other steps 1: the last premise names each shared file and folder.
- Other steps 2: Escape keeps the draft (item 4), as VS Code keeps one; not verified against VS Code's source here.

