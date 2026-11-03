# Brief check of O126, the Sessions tab's shape

Usage: a6698c519c0fa9d0a, claude-opus-5-5, 239318 tokens, 72 tool uses, 9 min 27 s.

Main is at 5cdf8d52e. The brief says 7df7bc6f0. `git diff --stat 7df7bc6f0 HEAD` touches only `.scratch/migration/agents/briefs/O125-cases.md`, `O125.md` and `orchestrator-state.md`, so every source premise is read on an unchanged tree. `.agents/worktrees/` holds `migration-O125` and `O125-base` only (`ls .agents/worktrees/`). O126's worktree and base copy do not exist yet.

## Names

Command: `git grep -n "<name>" -- src tests docs config README.md utils ':!config/local.yml'`, with hits inside `views/sources/repositories/changes/`, `views/shared/sessions/sections/` and `views/shared/changes/` filtered out. Hits outside the write list:

- N1. `src/lib/views/shared/card/pane-fold.ts:1-6` (head comment): "The folds of the groups (ui/controls/heads/GroupHead.svelte) of every view and partial ... the session list's groups ...". After item 2 the session list still folds through `usePaneFold`, but its groups are no longer GroupHead groups. The sentence becomes false, and the file is not in "Paths this step writes". Add `src/lib/views/shared/card/pane-fold.ts` (its head comment) to the write list and to item 2, next to `GroupHead.svelte:57-58`.
- N2. `.scratch/migration/agents/guarded.md:357`, G104 Code: "`changeMenu` in `src/lib/views/sources/repositories/menus/change-menu.ts`". Item 3 moves that file, so the guarded entry's Code line becomes false. The builder may not edit `.scratch/` (spec.md:36). The brief says no guarded entry names these files, which is wrong (see Premises). The landing has to rewrite G104's path, or the brief has to say who does.
- N3. `docs/HELP.md:295` (Groups): "A view that groups what it draws heads each group with one strip ... The strip stays at the top of the pane while its group scrolls under it". After the step the Sessions tab groups with tree rows that do not stick. The sentence was already loose (Repositories' groups are tree rows), but the step widens the gap. It is outside the write list (`docs/HELP.md lines 340-341`). Low; name it for the builder to read and judge.
- N4. `src/lib/state/shared/answers/terminal-words.ts:23,25` reads `sessions.resume_unknown` and `sessions.resume_live`. These two strings must stay in `session-detail.yml` whatever Details stops reading. Nothing breaks if the builder follows "nothing reads any more". It is worth one line in item 5.
- N5. `config/text/views/sessions/changes.yml:103` `ch_tree: Changes in the repository`. Its only reader is `ChangeGroups.svelte:315`. Deleting ChangeGroups orphans it, and `tests/checks/source/keys.test.ts:716-717` fails on an orphan key. `changes.yml` is in the write list, but item 4 does not say to remove it. Item 4's last bullet should name it.
- N6. `src/lib/state/sources/repositories/repositories.svelte.ts:186-190`: `openChange(root, group, path, session?)`, "as the tab of the session given when the row is a session's". The session calls it with `record.id` (`ChangesRepository.svelte:179-180`). `ChangeRow.svelte:121,169` calls it without a session. See the Question section (Q1); this is the largest finding.
- `tests/checks/source/keys.test.ts:444` and `tests/views/sources/repositories/open-version.test.ts:9` are named by the brief and in the write list.
- `src/lib/views/sessions/session-list/Customizations.svelte:8` names `SessionSection.svelte` ("one more section of the look the session's sections have"). It stays true if SessionSection keeps its look.
- `src/lib/views/sessions/session-detail/SessionDetail.svelte:18,24,79` and `SessionList.svelte:27,67,432` name `SessionSections.svelte`, which is not renamed. Still true.
- `FolderRow` also names unrelated types in `src/lib/shell/keys/palette-modes.ts:140`, `workspace-list.svelte.ts`, `WorkspaceRows.svelte` and `change-tree.ts:21`. These are different symbols and are unaffected.
- `picking` hits outside the folder are unrelated words, except `Repo.svelte:59` and `change-menu.ts:7`, both in the write list.
- `sec-h`, `ChangeGroups`, `change-actions`/`ChangeActions`, `DetailsBody`, `ChangesTouched`, `ChangesRepo`, `ChangesRepository`: no hit outside the write list. `ChangeActions` is also read by `ChangesRepo.svelte:15,36`, which is in the write list.
- `repositoryKeyRows`: only `change-tree.ts:5,277` and `Repo.svelte:15,63,130`, all in the write list. No test names it.
- `docs/` and `docs/diagrams/*.dot`: `git grep -l 'shared/changes\|repositories/changes\|sessions/sections' -- docs` prints nothing.

## The step line

`plan.md:1631`, mapped to "What to build":

- "a line across the pane between the session list and the first section": item 1.
- "every heading ... (the workspace groups, Terminals, Touched by this session, the repository, Merge, Staged, Changed and Untracked) a group row of the Repositories look that folds": items 2 and 4.
- S1. "with its count as a badge": items 2 and 4 for the workspace groups, Terminals, Touched and the four change groups. The repository has none. Item 4 bullet 2 gives the repository group row "(level 2, depth 1, folding)" with no count, and the step line lists "the repository" among the headings that carry a count badge. Either item 4 gives it a count (for example `changeCount(git)`, as Repositories' Changes head has), or the brief says why the step line's count does not apply to it.
- "its actions on hover": items 3 and 4 for the change groups. The list groups have no actions today, so there is nothing to carry.
- "its fold kept in the tab's state": item 2 (unchanged pane folds) and item 4 bullet 5.
- "the session's repository groups drawn by the Repositories view's own Changes partial and `ChangeGroups.svelte` deleted": items 3 and 4.
- "Details as one-line rows of the Files look under the group rows Session, Model and Usage, the context meter in its row": item 5.
- "Rename, Pin, Resume and Open the transcript as icon actions on the Details head": item 5.
- "nothing shown now dropped": the goal sentence, item 5 bullet 4 (facts with no value left out, decision 3) and bullet 6 (the outcome row).
- Items that no step-line part names: the list/tree mode control on the Changes head (item 4 bullet 4) and the selection and right-click menus (item 4 bullet 3). Both follow from "drawn by the Repositories view's own Changes partial", but the mode control is a new control on a section head. Decision 6 names its state, so it is not silent.

## Premises

Rerun on main 5cdf8d52e:

- P1. `SessionList.svelte` is 467 lines (`wc -l`). `<div class="list">` is 379-435 (`grep -n`: 379, 435). Small difference: the `.fold` rule and its comment are lines 447-453 (comment 447-448, `.fold {` 449, `scroll-padding-top` 452), where the brief says 445-451.
- P2. `SessionWorkspace.svelte`: GroupHead is lines 210-224 (brief: 210-222, which covers the attributes only). `TerminalRows.svelte`: 117-130 (brief: 117-125, attributes only). Both hold for what is cited. Session and terminal rows today are `level={3} depth={1}` (`SessionWorkspace.svelte:146-147,166-167`, `TerminalRows.svelte:66-67`).
- `session-list.ts` `listRows` is at line 62 <check mark>. `sessionRowItems` is 103-146 (brief: 104-140) <check mark> in substance. Rename, transcript and resume are there <check mark>, resume for ended sessions only.
- `Changes.svelte` is 359 lines. Props 75-102 <check mark>. TreeSection 205-287 inside the div at 204 <check mark>. The groupHead snippet is from 290 with TreeItem `level={2} depth={1}` at 295-296 <check mark>. ChangeRow is `level={3 + row.depth} depth={2 + row.depth}` at 272-273 <check mark>. Repo.svelte:317-327 <check mark>. `repositoryKeyRows` is 277-331 <check mark>.
- `ChangeRow` 319 <check mark>, `FolderRow` 123 <check mark>, `picking.ts` 116, `change-menu.ts` 302. The brief's `git grep -ln` prints the six src files plus `keys.test.ts` and `open-version.test.ts` <check mark>.
- `SessionSections.svelte:82-103` <check mark>. `ChangesTouched.svelte:41-43` <check mark>. `ChangesRepository.svelte:131-160` <check mark> (sec-h at 134, 139, 146, 153, 158). `ChangesRepo.svelte` 166, sec-h line 66 <check mark>. `ChangeGroups` 486 <check mark>. `change-actions.ts` 20 lines, line 2 <check mark>. `changes.yml:96,101` <check mark>.
- `SessionSection.svelte` 56 lines, key rows 42-45 <check mark>. `Section.svelte` Props 21-40 with `add` and `more` <check mark>.
- `DetailsBody.svelte` 421 <check mark>. The order of facts and controls holds (lines 195-325).
- Folder counts: `ls | wc -l` prints 10 and 7 <check mark>.
- `GroupHead.svelte:57-58` <check mark>.
- `docs/HELP.md:340,341` <check mark>. `README.md:16,25` <check mark>.
- `plan.yaml` `standards: [.scratch/migration/agents/spec.md]` <check mark>. `docs/glossary.md` does not exist <check mark> (`ls`).
- `CLAUDE_CODE_EFFORT_LEVEL`: unset in this agent's environment (`echo ${CLAUDE_CODE_EFFORT_LEVEL-unset}`). Not verified for the orchestrator's.
- P3. Wrong: "No test covers these components and `agents/guarded.md` names none". `guarded.md:356-358` (G104) names `changeMenu` in `src/lib/views/sources/repositories/menus/change-menu.ts`, with its test `open-version.test.ts`. The grep cited only searched `tests`, never `guarded.md`. The rest of the line holds: `git grep -ln 'session-list\|session-sections\|ChangeGroups' -- tests` prints only `tests/checks/config/config-folder.test.ts`.
- P4. Missing premise: `src/lib/ui/tree/TreeItem.svelte` is 540 lines (`wc -l`). That is already over spec.md:48's 520, and at `size.test.ts:30` `COMPONENT = 540`; the check refuses a count above it. The write list allows TreeItem "only if a row needs a part TreeItem lacks". Item 5's "the meter drawn inside the row" is the likely trigger. Any line added fails the size check, and spec.md:48 requires a split by concern for any change to it. The brief should say this and add the split's new file under `src/lib/ui/tree/` to the write list, or say which existing snippet (`end`, `detail`, `words`) holds the meter so TreeItem is not touched.
- P5. The brief does not mention that the session list's folds already live in the tab's `folded` key through `views/shared/card/pane-fold.ts` and `state/shared/page/folds.ts`. In the Sessions tab, that is the same instance state the sections keep `closed` in (`SessionList.svelte:432` passes `owner={instance.id}`). This bears on decision 5 (see Cases).

## Cases and checks

Against the rules file:

- K1. Clash, brief line 83 against spec.md:65. The brief says: "The builder may run a scratch server from its own worktree on a port other than 8787 and 8790 ... and look in a browser". spec.md:65 says: "A builder runs no page: it starts no scratch oculus for a browser and drives no headless browser, whatever a brief says." Line 83 must go; the look stays the landing's.
- K2. Verify 3 is a git command a builder may not run. `git grep -n 'ChangeGroups\|sec-h' -- src`, where spec.md:33 allows only `git status`, `git diff` and `git show`. Replace it with `grep -rn 'ChangeGroups\|sec-h' src`.
- K3. Verify 5 does not run as written. `utils/folder-check.sh` has mode `-rw-r--r--` (`ls -l`), so invoking it by path fails with permission denied. Other briefs write `sh utils/folder-check.sh` (`U3.md:155`, `X3e.md:748`).
- Verify 1, 2, 4 and 6 run as written. The node path exists (`ls -d`). `test:quick` and `diagrams` are in `package.json:17,23`. `spec.md:21` and `:45` are the prose and rewrap rules. None of the four test files in verify 2 is tagged slow (`grep -ln 'module-tag slow'` prints nothing).
- K4. C16 asks the builder to check places the step does not change. "Details, Changes, Timeline and Agents in the same new shapes". Nothing in "What to build" changes `TimelineTurns.svelte` or `AgentRows.svelte`. See the Question section.
- K5. C7 gives two expected results: "with no badge (or 0, as the Repositories view draws an empty group)". `TreeItem.svelte:245-246` draws the count whenever `count !== undefined`, so 0 is drawn as a badge when passed. Pick one.
- K6. C18 and decision 5 against spec.md:43. spec.md:43 says: "no code reads, carries, converts or tolerates an older form of stored data (a saved layout ...)". The brief frames the new fold key as "read leniently ... so a tab saved before the step loads with every group open", with C18 about "every tab saved before the step". An absent key read as no folds is the default a new tab also has, so no special code is needed. But the wording invites code written for an older layout. Recommend rewording both as "a tab state with no folds key draws every group row open", with no mention of tabs saved before the step.
- K7. Decisions 5 and 6 do not name their keys. Decision 5 says "under a key `session-sections.ts` names" and decision 6 says "kept per tab". spec.md:18 counts a key in a saved record under `~/.oculus` as a user-visible shape. The state file's standing demand (orchestrator-state.md:141) says: "Every brief that introduces a key or id names it and lists its empty, duplicated and colliding cases as acceptance items". The brief names neither key, gives neither key's empty, duplicate or colliding cases, and does not name the ids of the new group rows (Touched, the repository, Session, Model, Usage). Those must not collide with `head` (SessionSection's head id), `group:merge|staged|changed|untracked`, the `change:` and `file:` row ids, or `folderId` ids.
- K8. Decision 5 and the DRY rule (spec.md:89, "a parser, a fold or a rule exists once and is reused"). The tab already keeps group folds under `folded` through `pane-fold.ts` and `folds.ts`. In the Sessions tab, the list's group folds sit in that key of the same instance state. Decision 5 adds a second fold key and parser in `session-sections.ts` with no reason given for not reusing `folded`. Either reuse it (list keys are absolute paths, `list`, `terminals` and `''`) or give the reason in the decision.
- K9. The look list (brief line 83) opens C1, C2, C6, C8, C12 to C15 and C5. It leaves out C11 (tree mode), C16 (a Session tab) and C17 (rice). C16 is the only case for the Session tab, which the goal names.

## The question

The question for each item: could it pass without the goal being reached? The goal is one tree in the Files and Repositories look, every heading a group row, Details as one-line rows, and nothing shown or reachable lost.

- Q1. Item 3, item 4 bullet 3, C8: yes. The session's rows open a diff with the session's id (`ChangesRepository.svelte:179-180`, `openChange(workspace, kind, path, record.id)`). That makes the pane `changed@<session>:...` (`diff/subject.ts:93-105`). `DiffSection.svelte:32-37,204-206` offers the review comment to the session only on such a pane. `ChangeRow.svelte:121,169` calls `repositories.openChange(root, group, entry.path)` with no session. C8 checks Stage and the Cmd selection only. The step can pass every case while a press on a session's changed row opens the plain diff and the comment to the session is lost. Item 3 must give the shared part an optional session id that `ChangeRow` (its press, Enter and the menu's open items) passes to `openChange`, with a case: "a press on a changed row of the session's repository opens the diff for that session (its pane id carries the session) and offers the comment, as now".
- Q2. Goal and C16: yes, for Timeline. `TimelineTurns.svelte:138-146` heads each turn with a bold `<h4 class="turn-h">`, which is a heading in a Session tab and not a group row. The step line's list excludes it, and C16's "same new shapes" cannot fail for it. Either narrow the goal sentence of "What to build" to the step line's list, or raise widening Timeline as an open item. A brief check may not widen the step (orchestrator-state.md:48).
- Q3. Goal: yes, for Customizations. Its kind rows are `level={2} depth={0}` with a plain count (`Customizations.svelte:231-241`), unlike Repositories' group rows (depth 1, badge). The goal says "every heading inside them". The step line does not list Customizations, so the same narrowing or open item applies.
- Step line "with its count as a badge": yes, for the repository group row. See S1.
- Q4. Item 4 bullet 3 ("a selection by Cmd and Shift presses"): partly. Repositories' selection also has Shift+Up, Shift+Down and Cmd+A through `Repo.svelte:135-175` (`keymap`, `keyed`, `pressedRow`), which `picking.ts:1-7` lists. The brief moves `picking.ts` but leaves this logic in `Repo.svelte`. The session could get press selection only, or a copy of that logic, which is a DRY breach. State whether the keyboard selection is included and where the shared handling lives.
- Q5. Item 5 bullet 5 (Rename): partly. "the same field the list's double press opens: ... an empty title clears it". The list's own field ignores an empty title (`SessionList.svelte:307-308`, `if (next === '' || ...) return`). The two renames would then answer an empty title differently, which is user-visible. The brief also does not say what the Details field does when the focus leaves it (`NameField` `onleave`; the list's does nothing, `SessionWorkspace.svelte:157`).
- Q6. C12: yes, through TreeItem. C12 holds only if the meter fits TreeItem without a change. Otherwise the size rule forces a split the write list does not allow (see P4).
- C1 to C6, C9 to C11, C13 to C15, C17: no; each checks the visible result it names.
- C5 checks Repositories by reading and by the look. It cannot pass with a changed look once the look is taken.

## Implied inputs

Inputs not in "Cases" whose wrong answer would cost something:

- I1. A press on a changed or staged row of the session's repository. Expected: the diff opens for the session (its pane id carries the session) and offers the comment, as now.
- I2. The merge group in a session. Expected: the Merge Changes row in its error tone, rows with Open in Merge Editor, Open File and Mark Resolved (`ChangeRow.svelte:7-8,232-238`), no right-click menu, a list in tree mode too.
- I3. A session's repository whose list git cut at 200 (`GitState.held`). Expected: the cut warning row under that group, one step in from the group row. `Changes.svelte:233` hard-codes `depth={2}`, so the "base level and depth the caller gives" must reach it.
- I4. A session working in a linked worktree. Expected: its rows' menus offer Compare with Workspace (`Changes.svelte:112`, `linked`), as in Repositories.
- I5. Keyboard focus in the Changes section. Today the section's tree and ChangeGroups' own `TreeView` (`ChangeGroups.svelte:315`) are two Tab stops. Expected: one Tab stop for the whole section, the arrows walking Touched, the repository and the groups, and the branch menu, new-branch field and commit box reached by Tab and passed over by the arrows. This changes the tab stops, which spec.md:61 counts as visible.
- I6. The Customizations section. Expected: either stated as unchanged (kind rows at depth 0, plain count), or brought to group rows. Not decidable from the brief.
- I7. A Session tab with no session. Expected: unchanged, `PickSession` and no sections (`SessionDetail.svelte:73-76`), and no divider, since item 1 is in the Sessions tab only.
- I8. Pin on an unpinned session. Expected: "(scored)" is the marked choice.
- I9. The Details rename field losing the focus. Expected: name it (close with nothing written, or keep it open as the list does).
- I10. Details Rename in the Sessions tab while the list's rename field is open on the same session. Expected: one field closes, or the two do not fight over Escape. The list's Escape listener is on the document in capture phase (`SessionWorkspace.svelte:107-125`).
- I11. Fold ids in one tab state. Expected: the Details groups, Touched, the repository and the change groups keep distinct fold keys from the section ids in `closed` and from the list's `folded` keys. There is no case for a collision.

## ADRs

`ls docs/adr` prints "No such file or directory". There is no ADR folder.

## Dictated text

`grep -n 'Touched by this session\|The repository\|(scored)\|still running\|used / window\|Clear Title' .scratch/migration/agents/briefs/O126.md` finds lines 16, 18, 38, 39, 49, 51, 53, 66, 70, 74, 75 and 118. Against the catalogs:

- "Touched by this session" = `changes.yml:101` <check mark>.
- "The repository" = `changes.yml:96` <check mark>; "in normal case" holds, since the catalog value is already normal case and only the CSS made it capitals.
- "(scored)" = `session-detail.yml:30` <check mark>.
- "used / window" matches `context_num: '{0} / {1}'` (`session-detail.yml:13`) <check mark>.
- Clear Title = `session-detail.yml:11` <check mark>.
- Title = `rename_label`, `session-detail.yml:33` <check mark>.
- Line 18's "This session is still running..." shortens `resume_live` (`session-detail.yml:40`, "This session is still running. It can be resumed once it has ended."). It is a reference to the string, not text the builder writes.
- The new group names Session, Model and Usage are dictated, with no existing key. The Pin and Rename action words already exist: `sessions.pin_label: Pin` (`session-detail.yml:29`) and `sessions.rename: Rename` (`session-list.yml:54`). So "if not already there" means no new key for either.

## Declined to judge

- Brief line 18's claim that the Tokens and Prompt cache lines wrap at the pane's width ("seen on 8790 by the session on 2026-11-03"): I may not touch port 8790, and a builder runs no page.
- Whether a disabled `ToolButton` shows its tooltip (C15): `ToolButton.svelte:62,99` wraps the button in `Tooltip`, but only the look shows the pointer behaviour.
- What "the spacing the tree's sections keep between them" (item 1) is in pixels: it is a look question.
- The existence and contents of `.agents/worktrees/migration-O126`, `O126-base/` and `unused-exports.txt`: they are not created yet.
- How O125's edits to `docs/HELP.md:571` and `GroupHead.svelte` lines 15-20 and 211-222 shift O126's line numbers at landing: O125 is in flight, and its worktree is outside what I may read.

## Closed

The orchestrator closed every finding in the brief, on main at 5cdf8d52e:

- N1: `pane-fold.ts` lines 1-6 added to item 2 and to the write list.
- N2 and P3: the premise corrected; G104's Code line is rewritten to the moved path at landing (the builder does not write `.scratch/`), stated under "What is on the tree" and in item 3.
- N3: `docs/HELP.md:295` added to item 7 and to the write list, made true for the views whose groups are tree rows.
- N4: item 5 keeps `sessions.resume_unknown` and `sessions.resume_live`, read by `terminal-words.ts`.
- N5: item 4 removes `ch_tree` from `changes.yml`.
- N6, Q1 and I1: item 3 gives the shared part and `ChangeRow` an optional session id passed to `openChange` from the press, Enter and the menu's open items; case C19.
- S1: item 4 gives the repository's group row the count of its changed files as a badge, none while it is not readable (decision 8).
- P1, P2: the line numbers corrected.
- P4 and Q6: the meter is drawn in TreeItem's existing `end` snippet, so TreeItem and `item-props.ts` leave the write list; a row that needs a part TreeItem lacks is handed back.
- P5, K8 and K7: decision 5 rewritten: the group folds go in the tab's existing `folded` key through `usePaneFold`, under the ids item 4 names, each prefixed so no id meets a list fold key (an absolute path, `list`, `terminals`, `''`), a section id of `closed`, `head`, or a row id; decision 6 rewritten: `mode` and `picked`, the keys and values Repositories' tab state already has (`repositories.ts:382-403`); their empty, duplicated and colliding cases are C20 and C21.
- K1: the scratch-server sentence removed; the look stays the landing's.
- K2: verify 3 is `grep -rn`.
- K3: verify 5 is `sh utils/folder-check.sh`.
- K4, Q2, Q3 and I6: the goal sentence names the headings of the step line, Customizations' kinds and Details' groups; Customizations' kind rows become group rows (item 6, C27), since they are headings of the Sessions tab and the ruling covers every heading there; Timeline's turn headings stay as they are (decision 10: each is an entry of the session's log, not a heading over a group); C16 names Details and Changes and says Timeline and Agents are as before.
- K5: C7 says no badge.
- K6: decision 5 and C18 reworded without any older form.
- K9: the look list adds C11, C16, C17 and the new cases.
- Q4: item 4 includes the keyboard selection (Shift+Up, Shift+Down, Cmd+A); its handling moves from `Repo.svelte` into the shared folder, used by both views.
- Q5, I9 and I10: decision 9: both rename fields share one rule, an empty title clears it, the focus leaving keeps the field open, and opening one closes the other; C13 says so.
- I2, I3, I4, I5, I7, I8: cases C22 to C27.
