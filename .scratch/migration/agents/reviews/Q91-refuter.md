# Step Q91 refuter report (on .agents/worktrees/Q91, base 2dbe1a72)

Everything below was rerun or read in this run. Four findings are worth fixing before landing: one write that drops comments (B1), two proofs that do not exercise their case (P1, P2), and two landing conflicts with D25 and X3c that the dispatch entries do not name (B4). The verify list is red on `npm test` only, for a timeout in a file the step does not touch; that file passes alone.

## Verification (rerun by the reviewer)

```
$ npm run build            (alone, first)          -> exit 0, "built in 9.94s"
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md   (from tools/oculus, once, 11:40-11:44, load avg 9.6-12.7)
$ npm test
 FAIL  |unit| tests/server/machine/commands/placeholders.test.ts > a selection run through a real shell > creates nothing, for each line, each selection and each shell
Error: Test timed out in 5000ms.
 Test Files  1 failed | 572 passed | 24 skipped (597)
      Tests  1 failed | 14028 passed | 640 skipped (14669)
checks: failed with exit 1: npm test

$ npx vitest run tests/server/machine/commands/placeholders.test.ts   -> Test Files 1 passed (1), Tests 9 passed (9)
$ git diff 2dbe1a72 --stat -- tests/server/machine vite.config.ts vitest.config.ts package.json   -> (empty)
$ git diff 2dbe1a72 | grep -n "testTimeout\|timeout:"   -> (empty): no timeout, threshold or test config raised in the diff
The remaining commands of the list, each run alone:
$ npm run test:checks      -> exit 0, Test Files 31 passed | 2 skipped (33), Tests 471 passed | 9 skipped (480)
$ npm run check            -> COMPLETED 3316 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build            -> exit 0
$ npm run format:check     -> All matched files use Prettier code style!  (exit 0)
$ npm run lint             -> exit 0
$ ! LC_ALL=C grep -rna '[^ -~]' src tests   -> exit 0 (no output)
spec.md's perl ASCII gate over src tests config (bin absent) -> no output

The builder's other timeout claims, each file alone:
$ npx vitest run tests/server/edit/config-key.test.ts      -> Tests 61 passed (61)
$ npx vitest run tests/server/git/refs/detached.test.ts    -> Tests 14 passed (14)
$ npx vitest run tests/server/machine/pty/task.test.ts     -> Tests 12 passed (12)
(the report's `npm test -- --testTimeout=120000` was not rerun; it is a command flag only, and the diff changes no config)

Brief gate 2:
$ grep -n "'followup.do'\|'priority'\|'waiting-on'\|'snooze'\|'subtasks'" src/lib/state/forms/schema.ts
66, 257, 260, 337, 339, 340 (none inside NOT_IN_MODEL, which is schema.ts:57-63 with the five fields)

Brief gate 3, first runs: the final tests run on my own unchanged-tree copy ($TMPDIR/q91base, src and config reversed with `git diff -R 2dbe1a72` plus patch, the new src files removed):
$ npx vitest run card-details, yaml-edit-followup, schema-modelled, multi-select, undo-removed
 Test Files 5 failed (5), Tests 41 failed | 48 passed (89). This matches the report's table: C3's bare-note write passes on the base, and the one-note list, the follow-up fields, Status, CodeText, glyphs, casing and focus tests fail there.

Behaviour removals, each on a scratch copy of the final tree ($TMPDIR/q91rev; baseline 24 files / 492 tests passed):
R15 forget's prefix clear removed      -> 4 failed (layout-close x3, card-tree.client "listing landing after the close")
R26 editor reads pending() again       -> 2 failed (editor.test.ts "say the summary, not saving...", editor-saving.client)
R9  one-note list branch disabled      -> 5 failed (yaml-edit-followup x4, undo-removed)
R23 active without the focus condition -> Tests 4 failed | 28 passed (32)
R14 files() asked with an empty box    -> 2 failed ("asks for no project files while the box is empty / only spaces")
R16 followTabs card records skipped    -> 2 failed (ops.test.ts)

Write probes (node, type stripping, over src/lib/server/edit/yaml-edit.ts setFields):
'followup:\n  - do: call Stephanie  # about the estimator\n    after: 2026-10-01\n' + {followup.after: 2026-12-01}
  -> 'followup:\n  do: call Stephanie\n  after: 2026-12-01\n', changed [followup.after], refused []
'followup:  # waiting on the reply\n  - call\n' -> 'followup:\n  do: call\n  after: 2026-12-01\n', refused []
'followup:\n  # a comment\n  - call\n'          -> comment gone, refused []
'followup:\n  - do: |\n      multi\n...'       -> refused "the edit did not verify; nothing was written"
'followup: "call"' + {followup.do: null}       -> refused "the key is not there"
```

## Verdicts

Items of the brief's "What to build":

- 1: violated, Behaviour B1. The editor maps all five modelled fields (schema.ts:253-261). `followupWritable`, `manifestPayload` and `refusedEdits` are in place, and a one-note list is written as a map (yaml-edit.ts:579-616), but that rewrite drops comments silently. B2 and B3 are low and do not decide the verdict.
- 2: holds. CardDetails.svelte:80-96 draws the notes through `dueFollowups` (ticker.ts:175, now exported) with `now` passed from ProjectCard.svelte:385. The card-details tests fail when the field is removed.
- 3: holds. CardDetails.svelte:60-62 uses the `field` snippet with `project.card.status`, and CodeText is on `field` and `listField`. type-scale drops `.statusline=fs-sm`.
- 4: holds, with the reporting gaps in Spec SP1 and SP2. The tree moved under `views/shared/explorer/` and `folderView` is exported from tab-roots.ts:63. The card record is `cardTreeKey`. The prefix clear is in context.ts:234, the `followTabs` restatement in ops.svelte.ts:318-321, Open in Program in row-menu.ts, and the Outside line in ProjectTree. `files()` is asked only while the box holds text (CardDocs.svelte:71).
- 5: holds. HELP.md and DESIGN.md were rewritten where they had become false, and the brief's grep shows no stale passage. Grepping the old paths over src, tests, config, HELP.md, DESIGN.md and the diagrams .dot files finds nothing. One head comment is defective (Standards S1).
- 6: holds. items.ts:121 carries `kind`, and `resourceGlyph` in schema.ts serves both the card tag and the Compute choices. The MultiSelect chip draws the glyph.
- 7: holds (MultiSelect.svelte:164-185; removal R23 is red).
- 8: holds (project.yml and collection.yml labels; card-details casing tests).
- 9: holds (Editor.svelte `saving` with `post()` in a `finally`; removal R26 is red).
- 10: holds (Band.svelte:285 and CareerPanel.svelte at 279, 305 and 312, read; the width is for the look).

Cases of the brief's "Cases":

- C1: met (schema-modelled "opens priority, waiting-on, snooze and the subtasks..."; editor.test.ts).
- C2: met.
- C3: met. The base copy passes the bare-note write; the display part fails there.
- C4: met ("leaves out a follow-up edit kept in the draft from before the second note"; manifest-draft test).
- C5: met.
- C6: met ("lists only the five fields...").
- C7: met. yaml-edit-followup "a list of one note" passes, and R9 makes it red. B1 is about comments, not the list shape.
- C8: met. undo-removed "gives a follow-up back whichever shape..." covers the file clear and the single History record; schema-modelled "clears the whole follow-up when its text is emptied" covers the payload.
- C9: partial, Proof P1. The waiting-on half never takes the bare word through normalise and never checks the validate.ts finding. The priority half is met.
- C10: met.
- C11: met (audit; a test of an absence).
- C12: met.
- C13: met.
- C14: met.
- C15: met (card-tree.test.ts "keeps a record for each card of a tab", "leaves the tab record of a project view as it was").
- C16: met (state/sources/explorer/view/card-tree.test.ts covers ids holding `:`, `#` and `/`, and the prefix case; card-tree.test.ts covers the wrong-shape record).
- C17: met (layout-close.test.ts; R15 is red).
- C18: met (card-tree.test.ts "says the folder is outside every root...").
- C19: met.
- C20: met (ops.test.ts; R16 is red).
- C21: met (R14 is red; the flat-list preserved part cannot run on the base, for the reason the report gives).
- C22: met (files-menu.test.ts; the card draws the same Tree and picks).
- C23: partial, Proof P2.
- C24: met (test:checks green; boundaries.test.ts is not in the diff, so no allow row was added).
- C25: met. Files.svelte and ProjectTree.svelte both call `createRootedTree`, and allow-duplication.txt has only the five renamed rows.
- C26: met.
- C27: met.
- C28: met (audit, by construction).
- C29: met.
- C30: met.
- C31: met.
- C32: met. R26 makes the non-audit editor.test.ts case red.
- C33: met (audit by reading, as the brief asks).
- C34: met.

## 1. Spec

- SP1, src/lib/views/shared/explorer/ (RootedTree.svelte 93 lines, rooted-tree.svelte.ts 211, ProjectTree.svelte 115, plus control/tab-actions.ts, control/bookmark-actions.ts and Outside.svelte moved from views/sources/files/). What is wrong: the brief's item 4 asks for "one component, `RootedTree.svelte`", and lists what moves as `tree/`, `Questions.svelte` and `opening.ts`. The builder split the wiring into a model module, a drawing component and a card wrapper, and moved three more files, but the report's "Judgment calls" names none of this. Only DESIGN.md describes it. The split is reasonable, and the wiring exists once. Failure scenario: the orchestrator reads the judgment-call list to decide what to reverse and never sees the three-file shape or the extra moves. These are exactly the files X3c's merge touches (B4). Verdict: none on its own; a missing decision in the report.
- SP2, report "Files" section: "Line counts are in `$SP/q91-linecounts.txt`". What is wrong: rules file, "Where you work", says the report's file table marks each path outside the write list, with the reason. Several changed files are outside the list: `server/edit/writes/manifest.ts` (`currentOf` now reads a bare or one-list note, a behaviour change of the undo record), the new `server/edit/writes/restore.ts`, `state/sources/explorer/follow.ts` (selection and anchor now follow in the Files view too), `state/forms/manifest-draft.ts`, `state/shared/stores/shapes.ts`, `state/sources/fs.ts`, and `state/shared/stores/shell.ts` (comment). None is marked, and the line counts are in the builder's scratchpad, not in the report the brief asks for. Failure scenario: the landing check of paths against the brief finds unexplained files, and the `currentOf` change in manifest.ts is easy to miss. Verdict: none.
- SP3, config/text/views/boards/editor.yml:8: "this project has several follow-up notes; edit them in its project.yml". What is wrong: item 1 asks for a sentence saying the notes "are edited on the Focus board or in the file". The Focus board's Done is dropped. Low. Verdict: none.
- SP4, card-tree.ts:18-20: `${tab}${CARD_TREE}${encodeURIComponent(project)}`. What is wrong: the saved key is `<tab>#files:<percent-encoded id>`, while the brief and DESIGN.md's new paragraph say `<tab instance id>#files:<project id>`. Encoding is a sound answer to C16, but it is a saved-record key shape (rules file, "No silent design decisions"), the report does not list it as a decision, and DESIGN.md does not say the id is encoded. Verdict: none.

## 2. Proof

- P1, tests/state/forms/schema-modelled.test.ts:81-86: `const values = fieldValues(project({ waitingOn: [] })); expect(values['waiting-on']).toEqual([]);`. What is wrong: C9 asks that `waiting-on: stephanie` written as a bare word open as the model reads it, with the finding validate.ts reports. The test builds a Project with `waitingOn: []` directly, so it never reads a manifest, never runs normalise and never checks the finding. Its failure on the base copy only shows that the mapping was missing. Failure scenario: if normalise read the bare word as `['stephanie']`, or validate.ts stopped reporting it, this test would stay green. Verdict: C9 partial.
- P2, tests/views/shared/explorer/card-tree.client.test.ts:144-192 (C23, both titled "audits that"). What is wrong: the rules file asks that each asynchronous path the step adds be exercised in flight, after close and superseded, and that each added behaviour quote a run with the behaviour removed. Neither C23 test has such a run, and the builder's 39-removal list has no entry for them. The "after close" test would also pass if something wrote into the cleared record on a path that changes the selection: the `selectPruned` effect writes only when the selection changes, and the test has none. Failure scenario: a later change that answers a late listing into the card record goes unnoticed. Verdict: C23 partial.
- P3, Q91-report.md, the cases table and the "Behaviour removed" section. These rest on `$SP/q91-rm.py` and JSON files in the builder's scratchpad, which I did not open. I reproduced six of the 39 removals (R9, R14, R15, R16, R23, R26; all red as claimed) and the first runs for five files (consistent). The rest is not verified. Verdict: none.

## 3. Standards

- S1, src/lib/views/shared/card/CardDocs.svelte:13-17: "matching files are listed flat, the way the finder always listed them ... (state/sources/explorer/view/ card-tree.ts)". What is wrong: rules file, "What every package obeys", bans wording that compares with an earlier state ("always has been"), and the path has a stray space ("view/ card-tree.ts") left by rewrapping. Failure scenario: a reader searching for `view/card-tree.ts` does not find the reference. Verdict: none (fix at landing).
- S2, src/lib/views/shared/explorer/ProjectTree.svelte:52-56: `item.project.folder.startsWith('/') ? item.project.folder : absoluteOf(hubRoot(), item.project.folder)`. What is wrong: rules file, "The principles every package is judged on", says to reuse an existing helper. `folderOf(project)` (state/client/selectors.svelte.ts:78) already gives a project's absolute folder from its manifest path, without going through `hubRoot()`. Failure scenario: a project whose `folder` is not hub-relative (`relative()` gives `../...` for a manifest outside the hub) yields an unnormalised path, `folderView` finds no root, and the card offers to add a wrong folder as a root. This is not reachable on the project boards today, since side projects show only on Personal. Verdict: none.
- S3, src/lib/server/edit/yaml-edit.ts: 880 lines, against `const LINES = 900` (tests/checks/tree/size.test.ts:28). The rules file says a file within 20 lines of its cap is split. 880 sits exactly on that margin. The builder already moved the restore helpers out to get there. Noted as borderline, with no verdict.

## 4. Behaviour

- B1, src/lib/server/edit/yaml-edit.ts:579-616 (`expandOneNote`): `entries.push([name, text.slice(range[0], range[1])])` ... `return spliced(text, lineStart(text, key[0]), end, lines.join('\n'));`. What is wrong: the one-note list is rewritten from the key's line to the item's end out of the copied scalar values alone. Every comment in that span is dropped: a comment after `followup:`, a comment line before the item, and a comment after a value. The write reports success, because the reparse check cannot see comments. That breaks the module's own contract ("Everything else is copied through untouched", yaml-edit.ts:3-6), and no test covers a comment. The report says the note "keeps its quoting" and says nothing about comments. Failure scenario: `followup:\n  - do: call Stephanie  # about the estimator\n    after: 2026-10-01` plus a new date in the editor becomes `followup:\n  do: call Stephanie\n  after: 2026-12-01` with `changed: ['followup.after']`. The hand-written comment is gone, and no removed text is recorded for an undo to bring it back. No manifest on main holds a list follow-up today (grep over `projects`/`side-projects` `project.yml`: two flow maps with trailing comments, one bare note), so the loss is latent. Fix: refuse when the replaced span holds a comment outside the copied values, or carry the comments over. Verdict: item 1 violated.
- B2, src/lib/state/forms/schema.ts:336-340 (`typed`), Editor.svelte `summary()` and `save()`. What is wrong: for a project with no note, a date typed into "Follow-up: not until" counts as "1 changed" and makes the tab's close ask for confirmation. Save posts nothing and says "nothing to save", and no line says why. The report states the choice (judgment 10) but not what the reader sees. Failure scenario: the reader sets only the date, presses Save, reads "nothing to save" while the bar still says "1 changed", and on closing is asked to discard an edit Save cannot save. A better shape is the date field read-only while the text is empty, or a catalog line saying a date needs a note. Verdict: none (low; the orchestrator's call).
- B3, tests/routes/edit/undo-removed.test.ts:100: `expect(manifestOf(into)).toContain('do: call');`. What is wrong: undoing an editor edit of `followup.do` on a bare note or a one-note list writes the old text back into the map shape. The file does not return to `followup: "call"` or `followup:\n  - call`, and the test asserts only `toContain`. The content is restored, and the base did worse (it read `before` as undefined, so an undo cleared the note). Neither the report nor HELP says that an edit plus its undo leaves the file in a new shape. Verdict: none (low).
- B4, landing, shared paths. These are the orchestrator's, not the builder's:
  - (a) D25's worktree adds `src/lib/views/shared/code/source-options.ts` (untracked there). Q91 empties `views/shared/code/` so that `views/shared/` stays at ten items with `explorer/` (brief decision 9). Whichever lands second gives `views/shared/` eleven items, and `utils/folder-check.sh` and the folder check go red. D25's dispatch entry does not name this folder. D25 also changes `state/client/context.ts` (lines 323-330 and 395-402, apart from Q91's line 234; a simple merge), which the entry does not name either.
  - (b) X3c changes `views/sources/files/tree/control/picks.svelte.ts` (imports and `openCompare`), a file Q91 moves to `views/shared/explorer/tree/control/` and edits at line 177. This file is missing from the Q91 entry's `shared_paths`. A rename-aware cherry-pick should carry the separate hunks over, but that is not verified.
  - (c) X3c removes `crumbs`, `crumbsOf`, `rowKey` and the Breadcrumb from Files.svelte. Q91 rewrote the same import block (Files.svelte:85-100) and destructures `selectRow` at Files.svelte:150, which only the Breadcrumb uses (:287). After both land, the import block conflicts and `selectRow` is unused, which lint fails.
  - Failure scenario: the second landing goes red on the folder check or on lint and needs a hand merge the entries call simple. Verdict: none on Q91's items.

## Declined to judge

- Everything the look settles: the card tree's scroll box (12 rows), the press, Enter, drag and the menu opening in a card, the glyph chips in the Compute field, the Focus wraps at 150% in a 140 px pane, Status at `fs-md`, and Open in Program on a `.docx` row. Only a look on screen can settle these.
- Whether a card writing a ui record on its first draw (one per open card per tab, kept until the tab closes) is acceptable for the size of the saved layout. This is a design question for the orchestrator. No measurement was taken.
- The 33 builder removals I did not reproduce (see P3).
- The cherry-pick behaviour in B4 (b). It needs a trial landing, which this review may not make.

Reviewer usage: tokens not measured by me (the harness records them); about 62 tool uses; about 40 minutes. Note for the orchestrator: besides `git diff` and `git status --short`, I ran `git show 2dbe1a72:<path>` (read-only) for eight moved files to compare them with their base copies. No file under the worktree or the ledger was changed. Scratch copies are in $TMPDIR/q91rev, $TMPDIR/q91base and $TMPDIR/q91probe.
