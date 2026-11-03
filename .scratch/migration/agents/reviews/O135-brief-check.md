# Brief check of O135

Brief check of O135 (`.scratch/migration/agents/briefs/O135.md`), read against main at f8e23dcc3 in /Users/axelfaes/workspace/oculus. I changed nothing in the repository. The only files I wrote are scratch files under /private/tmp/o135-check.

The findings that block the brief as written:
- Finding A1: the brief names no worktree and no base copy.
- Finding W1: a layer boundary refuses the imports items 1 and 2 imply.
- Finding W2: the shell cannot import the action id from a view.
- Finding P1: `tests/views/sources/source/SaveKeyHost.svelte` is missing from the paths.
- Finding W8: a new partial cannot go directly into `src/lib/views/sources/source/`.
- Finding C-run: the case-run cannot import `tabActions`, `tabMenu` or `isNoteFile` under `npx tsx`.
- Finding W5: item 5 must pass `forceMoveMarkers: true`.

## Header and "Read first" (brief lines 1-7)

A1. The brief names no worktree and no base copy.
- Place: the header and "What is on the tree".
- Evidence:
  - spec.md:32-33 says "In the git worktree the brief names" and "The brief names a base copy".
  - orchestrator-state.md:143 says every brief names `.agents/worktrees/<step>-base/` and `unused-exports.txt` under "What is on the tree".
  - O136.md:20 has that line.
  - O135.md names neither. Verify item 4 uses `../O135-base/unused-exports.txt` without ever introducing it.
  - `ls .agents/worktrees/O135-base/unused-exports.txt` prints "No such file or directory" (it is made at /spec).
- Change: add the worktree path (`.agents/worktrees/migration-O135`, by the O136 pattern) and the base-copy line in the form of O136.md:20.

## What is on the tree

T1. Bullet 1 holds at the base.
- `git show f8e23dcc3:.scratch/migration/plan.md | grep -n "Open item 650\|^- O135 "` prints 1651 and 3490.
- In the working tree, ruling 650 is at 3491 (`grep -n` on the file), because of uncommitted ledger edits. The brief says "at f8e23dcc3", so this is fine.

T2. Bullet 2 (`isNoteFile`): the line numbers hold (note-hooks.ts:28-34, :37-43; note-names.ts:126 and :134; context.ts:406), but "noteWait (:37-43) is its one exported user" is wrong.
- Evidence: `grep -rn "isNoteFile\|noteWait" src tests` shows a second caller, `pageNotes`'s `removed` at note-hooks.ts:84. `pageNotes` is exported (note-hooks.ts:54).
- Also, `isNote` excludes `order.json` (note-names.ts:135), which the bullet does not mention.
- The head comment note-hooks.ts:1-8 says the module answers "whether a source tab's file is a note ... which the autosave reads". The step makes that incomplete, and the brief does not list the comment.
- Change: say "its users are `noteWait` (:42) and `pageNotes`'s `removed` (:84), both in note-hooks.ts". List note-hooks.ts:1-8 as a head comment to rewrite. (Item 3 and the paths depend on this; see W3 and P3.)

T3. Bullet 3 holds, with two corrections.
- note-links.ts:275-277: `scanNote` is declared at 275, and its two lines are at 276-277.
- G150 is at `.scratch/migration/agents/guarded.md:441-443`. The entry's first line is 441, and the brief says 442-443.
- Change: write 441-443.

T4. Bullet 4 reproduces.
- I ran `node /private/tmp/o135-check/cases.mts` (`FRONT_MATTER` from front-matter.ts with `withoutMark` and the CR/CRLF replace, which is `scanNote`'s reading):

```
C1 none | C2 "---\ntags: [a]\n---\n" | C3 "---\ntags: [a]\n...\n" | C4 "---\t\ntags: []\n---\n" | C6 none | C7 none | C8 "---\ntags: []\n---\n" | C9 none | C9after "---\ntags: []\n---\n" | C11 "---\ntags: [a]\n---\n" | C7after "---\ntags: []\n---\n" | scan C2 tags [{"tag":"a","line":1}]
```

- `od -c` shows that books.md opens with `# Books` and session.md opens with `\n`.

T5. Bullet 5: the content holds, but several line ranges are off by one or two.
- `tabActions` runs 58-93 (doc comment at 57).
- `TabActionDeps` runs 31-55.
- `SourceFacts` runs 31-68 (the brief says 30-66).
- `own.run()` is at ask-perform.ts:120-122 (the brief says 122-123; line 123 is the `commit` branch).
- The quoted head comment holds at tab-asks.svelte.ts:10, and `actions: listed` holds at :149.
- palette-open.ts:74 holds.
- Change: correct the ranges.

T6. Bullet 6 holds.
- `wc -l` gives 520. tab-shown.ts:62 and :76 hold. Lines 315-385, 386-398, 400 and 309 hold.
- The brief does not list Source.svelte's head comment at lines 40-42, which enumerates the palette's tab actions and which the step makes incomplete.
- Change: list it. (The folder count is in W8.)

T7. Bullet 7 holds: commands.ts:127-151 (`insert` 127-145, `replace` 146-151), types.ts:93-110 and :113. The insert passes `forceMoveMarkers: true` at commands.ts:140, which matters for item 5 (see W5).

T8. Bullet 8: the content holds, but two references are wrong.
- `read` runs 73-125 (not 73-122). `tabMenu` runs 104-182. `pick` runs 159-231.
- "G16 (agents/guarded.md:85) holds tests/shell/panes/strip/tab-menu.test.ts for the closes" is wrong. guarded.md:85 is the Test line of G28 (entry at :83). G16 is at guarded.md:412: "The import graph keeps the layer boundaries. Test: `tests/checks/tree/boundaries.test.ts`".
- `statusOf` at editor-status.svelte.ts:115 is the store type's member; it holds.
- Change: G28 for the tab-menu closes, and G16 named as the boundaries entry (see W1).

T9. Bullet 9 holds: source.yml:96, :101; ui.yml:103.

T10. Bullet 10 holds: HELP.md:394 `### Notes`, :412 the next heading, :406 the front-matter bullet. The templates text runs 885-893: the sentence "Copy this head" is at 885, and 886 is blank.

T11. Bullet 11 holds. O136.md:68-75 names paths disjoint from O135's, except docs/HELP.md (line 570) and the diagrams.
- The state file's dispatch block has O136 at `landing: cherry-picking`, so main may move before the O135 worktree is cut.
- Lines 394-411 sit above 570, so nothing shifts.

T12. Premises the brief lacks, each needed by an item:
- (a) the views row of `tests/checks/tree/layer-rows.ts:285-295` admits `data/prose/markdown/front-matter` (:290) and not `note-links`;
- (b) the shell row (:252-284) admits `state/workbench/navigation/**` (:268) and no `views/**`;
- (c) `src/lib/views/sources/source/` holds ten items;
- (d) `tests/views/sources/source/SaveKeyHost.svelte` builds `SourceFacts` and `SourceDoes` in full and is type-checked (`.svelte-kit/tsconfig.json` includes `../tests/**/*.svelte`);
- (e) the source draft never carries a byte-order mark. fs-transport.ts:506 decodes with `new TextDecoder()`, which strips it, and the save restores it (server/files/source/source.ts:240-241). So C11 is a case of the reading function, never of a tab's text.

## What to build

W1. Items 1, 2 and 4: the layer rules refuse the imports the items imply.
- Item 1 puts the reading in note-links.ts and item 2 puts the constant "beside" it. But Source.svelte (views) may import only `data/prose/markdown/front-matter` (layer-rows.ts:290), and `boundaries.test.ts` (G16) would refuse an import of note-links.
- Option (a), which I recommend: put the reading function and the constant in front-matter.ts. `scanNote` calls the function. front-matter.ts's head comment (:22-24) and the layer-rows.ts comment at :228-233 ("the module holds that pattern and the count of a header's lines") are then rewritten, which widens the step to `tests/checks/tree/layer-rows.ts` lines 228-233.
- Option (b): the view reaches both through a state module (note-hooks.ts), with no re-export of a constant.
- Option (c), adding note-links to the views row, widens an allow list and is the weaker option.
- Change: choose one in the brief, name the module, and amend item 1's "note-links.ts exports". This widens the step.

W2. Item 6: the shell cannot import the action id from ask-perform.ts.
- The shell row has no `views/**`. Writing the literal `'oculus.addFrontMatter'` in both places duplicates it.
- `SAVE_ACTION` and `REVERT_ACTION` show the pattern: editor-status.svelte.ts:101 and :104, read by shell/window/source-keys.ts:9 and menu-answer.ts:23.
- Change: item 4 or 6 exports the id beside them, and the paths gain `src/lib/state/workbench/navigation/editor-status.svelte.ts`. This widens the step.

W3. Item 3: "its one other caller changes with it" is wrong.
- `isNoteFile` has two callers, note-hooks.ts:42 and :84, and both are in the same file.
- A rename of `isNoteFile` never reaches autosave.svelte.ts: its `noteWait(id)` at :191 is a local function. It never reaches context.ts:406 either, which calls `noteWait`.
- Change: "its callers in note-hooks.ts (:42, :84) change with it".

W4. Item 4: "one boolean the tab derives" needs to be specific to hold in Svelte 5.
- I checked svelte 5.57.1: `derived()` sets `equals` (deriveds.js:85), and `equals` is `value === this.v` (equality.js:4-5). `update_derived` bumps the write version only when `!derived.equals(value)` (deriveds.js:393-394). So `own` (tab-asks.svelte.ts:104) re-runs only when the boolean flips, provided the `facts` getter returns a `$derived` variable.
- A getter that computes over `draft.text` itself would make `own` track the text and re-run at each keystroke.
- The derived should also test `editing` and the note test before it reads the text. Otherwise every source tab, notes or not, copies its whole text through `.replace(/\r\n?/g, '\n')` at each keystroke.
- Change: "a `$derived` boolean declared in Source.svelte or a partial, `editing && <note> && !<header>` in that order, which a getter of `facts` returns".

W5. Item 5: "the caret and the selections stay on the text they were on" holds only with `forceMoveMarkers: true`.
- Monaco 0.57.0 `executeEdits` with no end state gives a null state computer (codeEditorWidget.js:946-947). The cursor then recovers from its tracked range (cursor.js:212-214), which has the stickiness AlwaysGrowsWhenTypingAtEdges (oneCursor.js:35).
- In `nodeAcceptEdit` (intervalTree.js:247, :267-273), without force-move, a start marker at the insertion point stays put.
- For a caret at 1,1, `readSelectionFromMarkers` collapses the grown range to its end (oneCursor.js:45-47), so the caret moves to line 4 column 1 on the old line 1.
- A selection that starts at 1,1 (Select All, or a word selected on line 1) instead grows to cover the inserted header. With `forceMoveMarkers: true` (ForceMove, intervalTree.js:233-234) the start moves past the header too.
- On Undo, `resultingSelection` restores the earlier selection while the editor has focus (cursor.js:206-208).
- Change: item 5 says each edit passes `forceMoveMarkers: true`, as commands.ts:140 does. Add a look case for a selection from 1,1 (see Cases).

W6. Item 2: the CRLF requirement needs no code of the step.
- Monaco normalises an inserted text's line ends to the buffer's (pieceTreeTextBuffer.js:194-200: `validText = op.text.replace(/\r\n|\r|\n/g, bufferEOL)` when they differ). Source.svelte:67-68 keeps a CRLF file in CRLF.
- Change: "the constant is written with LF; Monaco writes it in the model's line ending (pieceTreeTextBuffer.js:194-200), so no code picks the ending". C9 is then a look case.

W7. Item 5 leaves focus unspecified.
- The `insert` branch calls `made.focus()` (commands.ts:128), and `replace` does not.
- Focus counts as visible under spec.md:61, and a pick from the tab menu leaves the focus on the menu's owner.
- Change: state whether the editor takes the keyboard after the run.

W8. Item 8: the partial cannot go directly into `src/lib/views/sources/source/`.
- `git ls-files src/lib/views/sources/source | awk -F/ ...` counts 10 items. An 11th fails `utils/folder-check.sh` (spec.md:49).
- `status/` holds 8 items and `save/` holds 9.
- Change: "into a partial under one of its subfolders (status/ has room for two)", and amend the path entry.

W9. Head comments the step makes incomplete that items 1-6 do not name:
- Source.svelte:40-42 (the palette's list);
- note-hooks.ts:1-8;
- front-matter.ts:1-24, or note-links.ts:1-16, wherever the reading goes;
- layer-rows.ts:228-233 under option (a) of W1.
- Change: name them (spec.md:72).

W10. spec.md:74 ("a write that edits a file's text re-parses its own result") is not addressed.
- My judgment is that it does not apply: the edit is an editor edit, like typing, saved later through the normal save. C8 is the re-read in any case.
- Change: one sentence saying so.

## Cases

C-run. The method "a case-run program ... run with `npx tsx`" over `tabActions` and `tabMenu` does not run on this tree.
- Evidence: `npx tsx /private/tmp/o135-check/run.ts`, importing ask-perform.ts and tab-menu.ts, fails with:

```
ReferenceError: $state is not defined
    at .../src/lib/state/shared/words/generation.svelte.ts:23:38
    at ... src/lib/state/shared/words/text.ts:13:34
```

- Both reach text.ts. note-hooks.ts fails the same way under `node`.
- `tsx` is not in package.json (`grep -n '"tsx"' package.json` prints nothing), so `npx` fetches it into `~/.npm/_npx`.
- What does run under plain `node`: front-matter.ts, text-edits.ts and note-links.ts (my run in T4).
- Change: either run the case-run through vitest's Svelte compile with a config in the scratch folder (not verified here), or limit the case-run to the data functions (items 1 and 2) and the decision function, if that lives in a module free of runes. The wiring of items 3, 4 and 6 would then be proved at the look. The brief chooses.

C2 to C8 and C10 to C11 give the expected results under the brief's own rules (my run in T4 for the header reading; tab-shown.ts:62 for C10).

Corrections and missing inputs:
- C1: "After the run" names no caret position. Add: the caret at line 1 column 1 is on line 4 column 1 after the run (the look).
- Missing: a selection that starts at 1,1 (Select All) stays on the old text after the run (the look). It fails without `forceMoveMarkers` (W5).
- C5 misses the input that tells the hub check apart: `.oculus/notes/plan.md` in a non-hub root (`one.hub` absent, note-hooks.ts:32). `README.md` in a non-hub root already fails on `inNotes`. A wrong answer here offers the command on a repository's own notes folder.
- C9 can only be the look (W6). The case list's "case-run over items 1, 2 and 4" cannot show it.
- C11: the reading gives a header, so the command is not offered. But a tab's text never starts with a byte-order mark (T12 (e)). Say that C11 checks the reading function alone.
- Missing: a tab once shown and now hidden behind another tab of its pane is offered the menu item (D2).

## Paths this step writes

P1. `tests/views/sources/source/SaveKeyHost.svelte` is missing.
- It builds `facts` and `does` with every field (lines 41-80). A new required field of `SourceFacts` or `SourceDoes` fails `svelte-check`, which `npm run test:quick` runs over `tests/**/*.svelte` (`.svelte-kit/tsconfig.json` include).
- This is G107's fixture (guarded.md:364-367).
- Change: add it, and name G107's test `tests/views/sources/source/save-key.client.test.ts` in verify item 1.

P2. Missing: `src/lib/state/workbench/navigation/editor-status.svelte.ts` (W2), and `tests/checks/tree/layer-rows.ts` lines 228-233 under W1 option (a). Both widen the step.

P3. Listed but not needed: `src/lib/state/sessions/source/autosave.svelte.ts` and `src/lib/state/client/context.ts` line 406. No rename of `isNoteFile` reaches either (W3). Change: remove them, unless `noteWait` itself is renamed.

P4. The partial entry must name a subfolder (W8).

P5. The brief writes the report to `.scratch/migration/agents/reviews/O135-report.md`, while spec.md:36 says a builder never edits under `.scratch/`. O136.md:75 does the same, so this is an established practice. I name the clash only.

## Decisions taken in this brief

D1. No finding. The reading is the note scan's; this is internal and reversible.

D2. Its stated reason is wrong.
- "A tab hidden behind another in its pane ... is offered none" does not hold for a tab shown before:
  - TabView.svelte:2-3 says a tab's view is "kept mounted while the tab is open and hidden while another tab of the pane is shown".
  - PaneBody.svelte:125-126 keeps every tab seen since the page loaded.
  - source-status.svelte.ts:37-44 publishes until unmount.
- So the menu offers the item on a hidden, once-shown tab, and not on a tab not yet shown since the page loaded.
- Change: reword the decision to that, and add the case (see Cases). Which tabs get the item is user-visible, so I judge it should be stated correctly in the brief.

D3. The labels and their placement are wording. Action ids are internal: `grep -rn "oculus.previewSide\|oculus.toggleRendered\|oculus\.blame'" src config docs` finds no reader outside ask-perform.ts, and no keybinding file names one. No finding.

D4. No finding. The insert is the right mechanism given W5.

D5. A judgment I accept, with one correction to its reason. A wrong offer, on a note that has a header, puts a second, empty header above the first. The note's tags then read as none until one Undo, because the old header becomes body. Text is kept, so "loses no work" holds, but "breaks no file" understates it. Change: say that.

## Libraries checked

None. Nothing replaces code the step writes: the fixed text, Monaco's own `executeEdits`, and the shared pattern of G150.

## Verify before you report

V1. Item 1's two test files exist and run under vitest.
- `grep -rln` over the changed paths finds `tests/views/sources/source/save-key.client.test.ts` and SaveKeyHost.svelte (through `tab-asks`), `tests/ui/controls/editor/reach-text.test.ts` (`editor/commands`), `tests/data/prose/markdown/front-matter.test.ts` (it imports `scanNote` at :19), `tests/shell/panes/strip/tab-menu.test.ts` and `tests/checks/tree/layer-rows.ts`.
- Name G107's test explicitly (P1).

V2. `npm run diagrams` and `npm run test:quick` are scripts of package.json (:17). Not run.

V3. The brief's plain perl form, run over every file on the paths list plus SaveKeyHost.svelte, prints nothing at the base (exit 0). It lacks the rules file's `config/` exception for accented letters (spec.md:103), which matters only if a config file gains one. Use the rules file's form.

V4. It depends on the base copy, which is not yet made (A1).

V5. It holds as written (`wc -l` gives 520 at the base).

V6. Fine as text. Decision 5 means no test is added.

V7. No finding.

## Declined to judge

- I ran no full test list, `svelte-check` or `npm run diagrams`: the brief check changes nothing and the rules ration whole runs.
- I did not try a vitest config for the case-run, because it needs a config file outside the scratch-only remit of a read.
- I did not trace the palette's ordering of tab actions in command mode beyond palette.ts:403-423 (fuzzy rank), so the order in D3 is not verified as drawn.
- I did not check how Monaco sets a model's line ending for a text with no line end or with mixed line ends, which bears on C9 only for such texts.
- I did not open a page; the look is the orchestrator's.

Usage: a283b3d0c29ce5214, claude-opus-5-5, 229441 tokens, 92 tool uses, 12 min 31 s

## Closed

Each finding was read against main and closed in the brief, which was rewritten on main at cf81d99d0; no finding widens the step beyond its line: each widening is internal (a module that holds the reading, a file that holds the id, a fixture and a comment the change reaches) and changes nothing a user sees, so it is taken in automode and booked in `choices.md`.

- A1: the worktree and the base copy named under "What is on the tree".
- T2, T3, T5, T8, T10: the line ranges corrected; G28 named for the tab menu's closes and G16 for the layer rows.
- T12: the layer rows, the folder count, `SaveKeyHost.svelte` and the decoded text without a byte-order mark added as premises.
- W1: option (a), the reading and the inserted text in `front-matter.ts`, `layer-rows.ts` lines 228-236 among the paths.
- W2: the action id exported from `editor-status.svelte.ts` beside `SAVE_ACTION`, which joins the paths.
- W3 and P3: the callers in note-hooks.ts named; `autosave.svelte.ts` and `context.ts` left out of the paths.
- W4: item 4 names a `$derived` boolean returned by a getter, tested `editing`, then the note, then the header.
- W5: item 5 passes `forceMoveMarkers: true`; C1 names the caret after the run; C12 added for a selection from 1,1.
- W6: item 2's constant written with LF, Monaco giving the model's ending; C9 a look case.
- W7: the editor takes the keyboard after the run (decision 5).
- W8 and P4: the partial goes under `status/`; `utils/folder-check.sh` joins verify item 5.
- W9: the head comments of note-hooks.ts, front-matter.ts, `layer-rows.ts` and Source.svelte's palette list named.
- W10: item 5 says why the re-parse rule does not apply.
- C-run: the case-run covers the data functions under `node`; the offer, the menu, the edit and the caret go to the look, with the code path by `file:line` in the report.
- C5: a notes folder in a root that is no hub added; C11 says it checks the reading alone; C13 added for a hidden tab.
- D2 (now decision 3): reworded to what the tab menu offers on a hidden tab.
- D5 (now decision 6): its reason corrected.
- P1: `SaveKeyHost.svelte` among the paths, G107's test in verify item 1.
- P5: the report path is the plan's established practice; no change.
- V1, V3: verify item 1 names the test files; item 3 uses the rules file's form.
