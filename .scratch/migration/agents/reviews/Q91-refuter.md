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


## Repair round 1, refuted (Q91, on .agents/worktrees/Q91, base 2dbe1a72, delta against the scratchpad's q91-round1-start/)

**Summary.** The verify list is red on `npm test` only. The failure is one timeout in `tests/server/machine/commands/placeholders.test.ts`, a file the step does not touch, and that file passes when run alone. The other six commands pass when run one at a time.

- **Rulings:** eleven of the twelve hold. Ruling 3 is partial: an undo puts the note's own text back only when the rewritten lines sit at the exact recorded offset. Any later edit above the note (for example the title) makes the undo write the map instead, even though the file still holds those lines. DESIGN.md and HELP.md say the opposite.
- **Other findings:** all low, and each can be fixed at landing.
- **The four things the brief asked me to check:**
  - Ruling 1 (comments carried over): each placement and the refusal is correct, and each one's test is red when comment collection is removed.
  - The `replaced` field on the change record: it has three readers. The probe above shows where it falls short.
  - The S3 split, and the row removed from `allow-duplication.txt`: the row was removed because the duplicated code is gone, not to make the check pass.
  - The date's read-only state (ruling 2): it is correct.

### Verification (rerun by the reviewer)

```
$ npm run build            (alone, first, from tools/oculus)   -> exit 0, "✓ built in 15.65s"
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md   (from tools/oculus, once, 13:01:47-13:07:03, load averages 17.56 13.60 14.55)
$ npm test
 ❯ |unit| tests/server/machine/commands/placeholders.test.ts (9 tests | 1 failed) 10760ms
     × creates nothing, for each line, each selection and each shell 7825ms
 FAIL  |unit| tests/server/machine/commands/placeholders.test.ts > a selection run through a real shell > creates nothing, for each line, each selection and each shell
Error: Test timed out in 5000ms.
 Test Files  1 failed | 572 passed | 24 skipped (597)
      Tests  1 failed | 14045 passed | 640 skipped (14686)
checks: failed with exit 1: npm test

$ npx vitest run tests/server/machine/commands/placeholders.test.ts   -> Test Files 1 passed (1), Tests 9 passed (9)
$ git diff 2dbe1a72 --stat -- tests/server/machine vite.config.ts vitest.config.ts package.json   -> (empty)
The remaining commands of the list, each run once alone:
$ npm run test:checks      -> exit 0, Test Files 31 passed | 2 skipped (33), Tests 471 passed | 9 skipped (480)
$ npm run check            -> exit 0, COMPLETED 3318 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build            -> exit 0
$ npm run format:check     -> All matched files use Prettier code style!
$ npm run lint             -> exit 0
$ ! LC_ALL=C grep -rna '[^ -~]' src tests   -> exit 0, no output
spec.md perl ASCII gate over src tests config (local.yml excluded) -> no output

The round report's evidence, rerun:
$ wc -l (every path of the round's file table)   -> every count matches the table (yaml-edit.ts 862, yaml-values.ts 172, yaml-ranges.ts 77, lines.ts 345, manifest.ts 486, restore.ts 134, undo.ts 391, changes.ts 316, schema.ts 383, manifest-draft.ts 133, Editor.svelte 348, ProjectTree.svelte 105, the six test files 450/190/281/191/376/244, DESIGN.md 434, HELP.md 342)
$ ls src/lib/server/edit/entry-edit | wc -l   -> 8 ;  ls src/lib/server/edit | wc -l   -> 10 ;  size.test.ts:28 LINES = 900
$ git diff 2dbe1a72 --name-status (non-test paths)   -> every path outside "Paths this step writes" is marked in the round's file table
Brief gate 2, from the worktree root:
$ grep -n "'followup.do'\|'priority'\|'waiting-on'\|'snooze'\|'subtasks'" tools/oculus/src/lib/state/forms/schema.ts   -> 66, 88, 279, 282, 359, 361 (as the report says; none inside NOT_IN_MODEL)

First runs: the final tests copied onto scratchpad rv-base/ (the round-start tree, node_modules linked):
$ npx vitest run tests/server/edit/yaml/yaml-edit-followup.test.ts tests/routes/edit/undo-removed.test.ts   -> Tests 10 failed | 49 passed (59)
   (the eight the report lists, plus "keeps the comments of a bare note..." and "gives a one-note list holding a map back as the list, comments included", which the report says have no first run)
$ npx vitest run schema-modelled, manifest-draft, editor/editor, card-tree.client   -> Tests 5 failed | 64 passed (69), the five the report lists; card-tree.client all pass (preserved)

Removal runs, each on scratchpad rv-rm/ (a copy of the final tree), one at a time, undone after each; the baseline of the four files is Tests 85 passed (85):
 expandNote collects no comments (const comments: Comment[] = [])   -> yaml-edit-followup Tests 7 failed | 9 passed (16)   (matches)
 setFields records no replaced (if (false) {)                       -> undo-removed Tests 3 failed | 40 passed (43)        (matches)
 normalise reads a bare waiting-on word as a list                   -> schema-modelled 1 failed | 18 passed, "expected [ 'stephanie' ] to deeply equal []"  (matches)
 validate.ts SHAPES row for waiting-on removed                      -> schema-modelled 1 failed, "expected [] to deeply equal [ { …(3) } ]"  (my own; the finding half is also guarded)
 ProjectTree seed effect without untrack                            -> card-tree.client 2 failed | 5 passed, at :162 and :213  (matches)
   same removal, the new test's out.answer(...) taken out           -> still 2 failed, at :162 and :213 (see Proof P-R1-2)
 rooted-tree selectPruned removed (const next = now)                -> 1 failed | 6 passed  (matches)
 rooted-tree selection effect writes always (|| true)               -> every test fails at 6.3 s to 8.3 s (six × lines in the first 20 lines of output)  (matches)

Probes (node type stripping over setFields / insertReplaced in the scratch copies):
 'followup: "Register for FLTA 2026"  # ask' + {followup.after}, then {title} in a later save, then insertReplaced(...)
   -> refused "the file no longer holds the lines the write left", though text.includes(span.left) is true (Behaviour B-R1-1)
 dash comment, comment line after the item, multi-line flow map and flow list, two comment lines, a cleared key with a comment, a folded value with a header comment (refused "a comment inside the value cannot be kept; edit the file by hand"), and a two-field write: each comment carried over as the ruling says.
 Round start against final, bare note 'followup:  # waiting\n  call' + {followup.after}: round start drops the comment, final keeps it.
```

### Rulings of the round

1. **B1, comments carried over: done.**
   - `commentsIn`, `placeComments` and `expandNote` are at `yaml-edit.ts:361-523`.
   - Each placement holds in the tests and in my probes, and so does the refusal (the folded-value probe is refused). All seven tests are red with comment collection removed.
   - Applying the same code to the bare-note path is justified. At round start that path dropped a comment after `followup:`, and moved a comment from the value to the `after` line (probe above). Ruling 3 also needs that path's replaced text.
2. **B2, the date needs a note: done.**
   - `dateNeedsNote` is at `schema.ts:80-90`, and `writableField(project, field, edits)` reads it.
   - `manifestDirty` (`manifest-draft.ts:127`) and `manifestPayload` (`schema.ts:357`) both use that rule. `Editor.svelte:173-175` draws `editor.followup_needs_note`.
   - The four tests are red on the round-start tree.
3. **B3, byte-for-byte undo: partial (Behaviour B-R1-1).**
   - For a one-field write that is undone before anything above the note changes, the whole file comes back exactly (`toBe`), for a bare note and for a one-note list. Three tests are red with `replaced` removed.
   - `replaced` is `{ offset, left, text }` (`changes.ts:69-76`). Three places read it:
     - `replacedShape` in `writes/manifest.ts:207-211` (malformed means none);
     - `insertReplaced` in `writes/restore.ts:107-134`;
     - the pass-through in `undo.ts:270`.
   - `keptSpan` (`yaml-edit.ts:739-744`) drops or moves the span when a later field of the same write splices it.
4. **SP1: done.** The round's judgment call 1 names the three-way split and the three extra moves, each with its reason.
5. **SP2: done.** The file table marks every outside path and gives the reason. I checked it against `git diff --name-status`, and every line count matches `wc -l`.
6. **SP3: done.** `editor.yml:9` now reads "edit them on the Focus board or in its project.yml".
7. **SP4: done.**
   - `DESIGN.md:421` reads "the project id percent-encoded".
   - The round's judgment call 3 lists the key shape.
8. **P1: done.** The test reads the manifest text through `buildPortfolio`. It is red when normalise is removed, and also red when the validate row is removed (my run).
9. **P2: done, with Proof P-R1-2.** Every C23 test has a removal run that I reproduced. The added test is titled as an audit, which `tests/checks/tree/audits.test.ts` requires for these cases.
10. **S1: done.** `CardDocs.svelte:14-16`.
11. **S2: done.** `ProjectTree.svelte:46` is `folderOf(item.project)`.
12. **S3: done.**
    - `yaml-edit.ts` is 862 lines against a cap of 900.
    - The split produced two files, each with one concern: `entry-edit/yaml-values.ts` (172 lines) and `entry-edit/yaml-ranges.ts` (77 lines).
    - The `allow-duplication.txt` row `lines.ts / yaml-edit.ts 22e246596d51` was removed because the duplicated code is gone, not to make the check pass:
      - `grep -rn "endOffset" src` finds nothing;
      - `valueEnd` exists once, at `yaml-ranges.ts:46`;
      - `duplication.test.ts:599-606` fails on a stale row.
    - Where the files sit is Standards S-R1-1.

### Verdicts for the whole diff since the base

**How these were reached.** Items 2, 3, 6, 7, 8, 9 and 10 have no source change in the round. Their files are not in the `diff -rq` of the round-start copy against the worktree. Their verdicts rest on two things: the tests the first review named, which pass in my `npm test` run (572 files passed), and the first review's reading, which I treat as a lead. I did not re-read those diffs in full.

**Items of the brief's "What to build":**

- 1: violated, Behaviour B-R1-1.
  - The modelled fields, `followupWritable`, the payload rule and the date rule hold.
  - The one-note list is written as a map and carries its comments over.
  - The emptied note clears the group.
  - The undo shape (ruling 3) holds only at the recorded offset.
- 2: holds. card-details tests pass, and the round did not touch them.
- 3: holds. Same evidence as 2.
- 4: holds.
  - The round changed only `ProjectTree.svelte:46` (`folderOf`) and the `CardDocs` comment.
  - card-tree, ops, layout-close and card-docs all pass in my run.
  - The C23 removals are reproduced (above).
- 5: holds, with Standards S-R1-2 (comment wording) and the doc sentence in B-R1-1.
- 6: holds. Untouched.
- 7: holds. Untouched.
- 8: holds. Untouched.
- 9: holds. Untouched.
- 10: holds. Untouched; the wrap width is for the look.

**Cases of the brief's "Cases":**

- C1: met.
- C2: met.
- C3: met.
- C4: met.
- C5: met, as ruling 2 amends it.
  - Both fields open empty.
  - The text is writable.
  - The date is read-only with `followup_needs_note` until the text is typed.
  - The tests are in `schema-modelled.test.ts` and `editor.test.ts`, red on the round-start tree.
- C6: met.
- C7: met. The test is red under the R1 removal, and comments are now kept.
- C8: met.
- C9: met. The waiting-on half now goes through the reader, normalise and validate, and both removals are red.
- C10 to C22: met. Unchanged by the round; tests pass.
- C23: met. The removal runs are reproduced; see Proof P-R1-2 for what the added test distinguishes.
- C24: met.
  - `test:checks` is green.
  - `boundaries.test.ts` is not in the diff.
- C25: met.
  - `allow-duplication.txt` loses one row, for a clone that is now gone.
  - It renames five rows to the moved editor test.
  - It adds no row.
- C26 to C34: met. Unchanged by the round; tests pass.

### Findings

**Spec: none.**

**Proof**

- **P-R1-1, the report's "First runs" section.** Two tests of added behaviour are given no first run:
  - "Three tests were added after the source change and have no first run on the unchanged tree."
  - What is wrong: `agents/spec.md` asks for each new test's failing line on the unchanged tree. My run on the round-start copy shows two of the three are red there, as required: "keeps the comments of a bare note: after the key, before it and after its text" and "gives a one-note list holding a map back as the list, comments included". The third is an audit and passes there.
  - Failure scenario: the landing reads the report and finds two behaviour tests with no proof that they can fail.
  - Closure: my run above supplies it; nothing to change in code.
  - Verdict: none.
- **P-R1-2, `tests/views/shared/explorer/card-tree.client.test.ts:204-215`** ("audits that a listing landing after the close writes nothing, though it would change the selection"). The test's comment says: "Red when the seed effect of ProjectTree.svelte reads the record with tracking, and when the selection effect of rooted-tree.svelte.ts writes whether or not the selection changed."
  - What is wrong:
    - Neither quoted red isolates the late listing.
    - With the seed effect tracked, the test is still red at `:213` when `out.answer(...)` is taken out: my variant run, 2 failed at `:162` and `:213`.
    - The `|| true` removal fails every test of the file by an effect loop.
    - After the close the record is empty, so the late listing has no selection left to change. The selection effect (`rooted-tree.svelte.ts:159-163`) reads it from the record.
  - The test stays a valid audit against a future write on the listing path, and it is titled as one. The report's ruling 9 row ("it is red when the seed effect reads the record with tracking") reads as if that red came from the listing path.
  - Failure scenario: the orchestrator takes the row as proof that the late listing path was exercised; it was not.
  - Verdict: none.

**Standards**

- **S-R1-1, `src/lib/server/edit/entry-edit/yaml-values.ts` and `yaml-ranges.ts`.**
  - `yaml-edit.ts:43-54` imports `from './entry-edit/yaml-values.ts'` and `'./entry-edit/yaml-ranges.ts'`.
  - What is wrong: `agents/spec.md` ("What every package obeys", folder rule) says a folder at its limit is split into folders named for what they hold, and a new file goes where its concern already lives.
    - `yaml-values.ts` is the write vocabulary of every YAML write: `FieldValue` is imported by `writes/manifest.ts`, `writes/restore.ts`, `writes/entries.ts`, `feeds.ts` and `yaml-edit.ts`.
    - It now sits in the entry writers' folder, so the manifest writer imports its core from `entry-edit/`.
    - The round's judgment call 2 argues the placement: `lines.ts` held copies of the range helpers.
    - The alternative that meets the rule: a `server/edit/yaml/` folder holding `yaml-edit.ts` with its two parts, with `server/edit/` staying at ten items.
  - Failure scenario: a reader looking for the manifest write's value rules looks in `server/edit/` and finds them under `entry-edit/`.
  - Low. A placement call for the orchestrator.
  - Verdict: none.
- **S-R1-2, path split across comment lines.** Two places:
  - `src/lib/views/shared/explorer/ProjectTree.svelte:6-7`: "(state/sources/explorer/view/" then "// card-tree.ts)";
  - `src/lib/state/shared/stores/shell.ts:3-4`: "(views/shared/explorer/" then "// tree/menu/row-menu.ts)".
  - What is wrong: this is the same pattern ruling 10 (S1) fixed in `CardDocs.svelte`. The path is broken at the wrap, so `grep view/card-tree.ts` and `grep explorer/tree/menu/row-menu.ts` miss these references.
  - Failure scenario: a later move of `card-tree.ts` or `row-menu.ts` greps for the path, misses these two head comments, and leaves them false.
  - Fix at landing: rewrap so each path sits on one line.
  - Verdict: none.
- **S-R1-3, `tests/routes/edit/undo-removed.test.ts:122`.** Test title: "gives the shape back when the note was written with its date, whichever field is undone".
  - What is wrong: the test writes and undoes only `followup.after`. Its loop runs over the two note shapes, not over fields.
  - Failure scenario: a reader takes the undo of `followup.do` after a date-only write as covered.
  - Fix at landing: retitle to "whichever shape the note had".
  - Verdict: none.

**Behaviour**

- **B-R1-1, `src/lib/server/edit/writes/restore.ts:123-126`.** The code:
  ```ts
  const end = replaced.offset + replaced.left.length;
  if (source.slice(replaced.offset, end) !== replaced.left) {
      return refusal('the file no longer holds the lines the write left');
  }
  ```
  - What is wrong: ruling 3 says the undo puts the replaced text back "when the file still holds what the write left". The code needs those lines at the exact recorded offset.
  - Any later edit that changes the length of text above the note breaks it: a later save of `title`, `status.line` or `latest`, or an undo of such a record. After any of these, `putBackNote` gets a refusal and falls through to the value write, which leaves the map shape.
  - Probe: `id: a\ntitle: Alpha\nfollowup: "Register for FLTA 2026"  # ask\nnext: go\n`. Set `followup.after`, then in a second save set `title: Alpha, renamed`. `insertReplaced` with the recorded span is then refused, though `two.text.includes(span.left)` is `true`.
  - Three sentences say the opposite: `DESIGN.md:143`, `DESIGN.md:388` and `HELP.md:296` all say the note returns in its own shape "while the file still holds them". The restore.ts head comment ("at the recorded index") is accurate. The existing fallback test covers only an edit inside the span.
  - Failure scenario: on hccnet-fl, the user sets the follow-up date, then edits the status line, then undoes the date in History. The file ends as `followup:\n  do: "Register for FLTA 2026"  # ask` instead of `followup: "Register for FLTA 2026"  # ask`, against the docs.
  - Fix, landing-sized: find `left` in the source rather than requiring the offset. Take the occurrence nearest the recorded offset, refusing when there is none, as `placesOf` does for removed text. Add one `undo-removed` test with a title edit between the write and the undo.
  - Verdict: ruling 3 partial; item 1 violated.
- **B-R1-2, the round's report section.** It has no before/after table for the round's visible changes.
  - What is wrong: `agents/spec.md` says the report's before-and-after section is what the look is read against. The round changes three things a reader sees:
    - the editor date of a project with no note becomes read-only, with "a date needs a note; type the text of the follow-up first";
    - the several-notes sentence gains "on the Focus board or";
    - a bare note's comment after the text now stays on the `do` line, where at round start it moved to the `after` line (my probe).
  - Only DONE rows describe these. The first report's table (`Q91-report.md:222`) does not include them.
  - Failure scenario: the look at landing opens the glassbox and hccnet-fl editors without the no-note state on its list, and the read-only date goes unseen.
  - Verdict: none.

**Unreachable, not a finding.** The round dropped the `typed` condition in `manifestPayload`. Run alone, it now posts `followup.do: "  "` for a project with no note (probe on both trees: `{}` at round start, `{"followup.do":"  "}` now). The editor never hands it such a field: `editDiffers` (`manifest-draft.ts:26-28`) trims, so blank text is never dirty.

### Declined to judge

- **What only a look on screen settles.** The read-only date box and its line in the editor, the several-notes sentence on screen, and every look item of the brief. Reason: these need TEST.
- **Whether `replaced` should be renamed `before`/`after` at landing.** Reason: it is already the orchestrator's landing note (state file, Q91 `landing_notes`). The delta still carries `{ offset, left, text }`.
- **A bare note that is not text (`followup: 5`).** Expanding it drops the 5 in silence, at round start and now (probe: "followup:\n  after: 2026-12-01"). Reason: the round did not introduce it. I did not run it on the base 2dbe1a72, so whether the step introduced it is not verified.
- **The first review's B4 landing conflicts with X3c and D25.** Reason: they are landing work, outside a read and a rerun.
- **Tokens.** Reason: the harness records them, not me.

Reviewer usage: tokens not measured by me (the harness records them); about 45 tool uses; about 30 minutes (12:57 to 13:27 by `date`). Beyond `git diff 2dbe1a72` and `git status --short`, I ran no git command. No file under the worktree or the ledger was changed. The build wrote only its ignored output. Scratch copies are in the session scratchpad: `rv-base/`, `rv-rm/` and `rv-probe*.mts`.

## Closed

The findings of the run over round 1 are never sent to the builder (the round is spent); each is closed at landing on main:
- B-R1-1, the undo of a rewritten note after an edit above it: `insertReplaced` (`writes/restore.ts`) takes the lines the write left at their occurrence nearest the recorded offset (`nearestOf`) and refuses only when the file no longer holds them; the head comment says so. New test in `undo-removed.test.ts`, "gives a bare note back as the text the file held after a later write above it" (a title write between the date write and its undo): red with the exact-offset check (`expected 'id: alpha\ntype: manuscript\ntitle: A...' to be ...`), green with the fix. DESIGN.md:143 and :388 and HELP.md:296 ("while the file still holds them") are true now.
- The `ReplacedText` clash with D25 (landing note): the fields are `{ offset, before, after }`, `before` the text the write replaced and `after` the lines it left, in `changes.ts`, `manifest.ts`'s `replacedShape`, `yaml-edit.ts` and `restore.ts`.
- S-R1-1: `yaml-edit.ts`, `yaml-values.ts` and `yaml-ranges.ts` moved to `server/edit/yaml/`; `server/edit/` keeps ten items and `entry-edit/` six; every import, the head comments, `utils/migrations/rename-program-to-pillar.ts` and DESIGN.md:409 follow.
- S-R1-2: the two head comments rewrapped so `state/sources/explorer/view/card-tree.ts` and `views/shared/explorer/tree/menu/row-menu.ts` each sit on one line.
- S-R1-3: retitled "gives the shape back when the note was written with its date, whichever shape the note had".
- P-R1-2: the test "audits that a listing landing after the close writes nothing, though it would change the selection" is deleted under the test rule (Z354), since it does not isolate the late listing.
- P-R1-1: closed by the reviewer's own first runs; nothing to change.
- B-R1-2: the three visible changes of the round (the read-only date of a project with no note and its line, the several-notes sentence, a bare note's comment kept on the `do` line) are on the look's list.
- The test rule (Z354, Z355): the tests Q91 added were read against it, and those that test markup the look covers, labels and glyphs, stylesheet text, duplicates of logic tests or audits that guard nothing were deleted: `overflow-wrap.test.ts` and `multi-select.test.ts` whole, and cases in `card-details.test.ts`, `card-tree.test.ts` (views and state), `card-tree.client.test.ts`, `editor-saving.client.test.ts`, `schema-modelled.test.ts`, `editor.test.ts`, `files-menu.test.ts`, `ops.test.ts` and `ui.test.ts`; 576 lines removed. Tests of writes, undo, keys, records and the follow-up rules stay.
- Z350: `tests/server/machine/commands/placeholders.test.ts` and `tests/server/machine/pty/task.test.ts`, each seen timing out in two or more full runs, take the slow tag.
- Unreachable (`manifestPayload` with blank text): no change, since the editor never posts blank text.
- The bare note that is not text (`followup: 5`), which the reviewer declined: setting a key under it dropped the value, a loss the step's expansion of a bare note brings. Fixed at landing: such a note refuses the write with "the note is not text; edit the file by hand" and the file stays as it was; an empty `followup:` still takes the key. New test in `yaml-edit-followup.test.ts`, "is refused, the file as it was, when it holds a value that is not text": red before the fix (`expected [ 'followup.after' ] to deeply equal []`), green after.
- The look on TEST (Z296's Focus view in a narrow pane): the awaiting strip's tags (`views/boards/focus/Focus.svelte`, `.seg`) held a long venue name on one line, so the strip crossed its border and the Focus pane scrolled sideways. Fixed at landing: `.seg` takes `min-width: 0` and `max-width: 100%`, and the strip's tags take the Tag primitive's new `wrap` prop (`ui/controls/Tag.svelte`, `.tag.wrap`, `overflow-wrap: anywhere`), so a long name wraps inside the strip; the primitive owns the rule, as `tests/checks/tree/boundaries.test.ts`'s "lets no view or shell component style a primitive own class" requires. On TEST after the fix the pane's `scrollWidth` 277 equals its `clientWidth` 277, and the JMIR and NWO tags wrap. No test: the look covers markup and stylesheet text (Z354).
