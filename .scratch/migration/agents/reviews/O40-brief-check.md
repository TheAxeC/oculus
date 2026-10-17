# Step O40 brief check (on main at fe3d10f73)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O40.md`. A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A line of code or a hit of a grep keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## 1. Names

- `undid_new_entry` (item 23): `grep -rn "undid_new_entry" src tests config docs HELP.md DESIGN.md README.md` printed `src/lib/views/system/history/History.svelte:150` and `config/text/views/system/history.yml:74`, both inside the write paths. No hit outside the paths. Inside the paths, the head comment `History.svelte:39-40` ("The row an undo writes is labelled by what the undo did: an entry put back for a delete, an entry removed for an add") no longer matches the new words.
- `.reveal` on the value pills (item 13): `History.svelte:42-44` head comment ("A row's undo control and the pills that open its values are drawn while the pointer is over the row") becomes false. It is inside the paths.
- `onsaid` (item 7): `grep -n "onsaid" LiteratureCard.svelte RadarCard.svelte` printed `LiteratureCard.svelte:88,90,98,171,179` and `RadarCard.svelte:106,235,243,250`. Copy BibTeX, "no radar", AddForm and DeleteAsk all answer through `onsaid`. Only `LiteratureCard.svelte:171` and `RadarCard.svelte:235` pass it to SaveToLiterature. The brief's "`onsaid` goes from SaveToLiterature.svelte, LiteratureCard.svelte and RadarCard.svelte" would break those other answers if read literally. The reference diff `$S/o40/e/fix39.diff` removes only the two passes and SaveToLiterature's own prop.
- `joinPath` (item 18): `grep -rln "joinPath(" src tests` printed 18 files under `src` (inside the paths) and `tests/server/machine/apps/tools/decorations.test.ts` and `scm.test.ts`. Both test hits are `oculus.Uri.joinPath`, a different function (`uri.mjs:95`), so no hit outside the paths is made false.
- `homeNaming` (item 10): `grep -rn homeNaming src tests` printed `feed-route.ts:21,116` and `hubs.ts:177`, all inside the paths. The doc comment `hubs.ts:173-176` becomes false; it is inside the paths.
- The change record's `removed` and `replaced` (items 15 and 16, the reference `fix58-entries.diff` uses `removed`): their doc comments at `src/lib/server/core/changes.ts:110-121` say "and on no other record", which becomes false. They are inside the paths. `DESIGN.md:159` ("A `config-value` record carries the replaced text so the undo returns the file byte for byte") becomes incomplete. DESIGN.md is outside the paths.
- The close question (item 24): `grep -rn "tab_close_dirty\|closeAsk(\|askAndClose(" src` printed three callers the brief does not name: `src/lib/shell/panes/PaneView.svelte:379`, `src/lib/shell/panes/strip/tab-menu-state.svelte.ts:140` (Close Others, Close All) and `src/lib/views/sources/files/control/editor-closing.ts:35` (the Files view's close of open editors). Each is inside the paths but missing from the item's list. `config/text/ui.yml:95` `tab_close_dirty: Close this tab and lose its unsaved changes?` becomes false once Save is offered. `grep -rn "No closes nothing" tests` printed `tests/shell/panes/strip/tab-menu.test.ts:117` and `tests/shell/panes/strip/app-editor-close.test.ts:105`. The first title is named in `.scratch/migration/agents/guarded.md:82` (G28), which is outside the paths. HELP.md:66 ("Closing that tab, its pane or its page asks first.") is outside the paths and gets no bullet for Save or Don't Save.
- HELP.md, DESIGN.md and README.md: "Paths this step writes" names `tools/oculus/docs/` and none of these three. `agents/spec.md` ("What every package obeys", the grep and doc rule) says the step writes what a user does into HELP.md and a decision into DESIGN.md.

Findings:
- Item 7's sentence about `onsaid` is wrong as written: removing the prop from LiteratureCard and RadarCard breaks five other answers.
- Item 24 leaves out three callers of the close question (`PaneView.svelte:379`, `tab-menu-state.svelte.ts:140`, `editor-closing.ts:35`). It also leaves out the question's words, `ui.yml:95`, which become false.
- `guarded.md:82` names a test title that item 24 is likely to change, and it is outside the paths (the orchestrator's file).
- HELP.md:66 and DESIGN.md:159 are outside the write paths, though the rules file asks the step to write HELP.md and DESIGN.md.

## 2. The step line

- "each open row of `agents/reviews/O37-defects.md`": `awk '/^## Open/{f=1;next} /^## Count/{f=0} f && /^[0-9]+\./' agents/reviews/O37-defects.md | cut -d. -f1` printed 45 rows: 14 15 21 24 26 27 30 33 34 35 36 38 39 40 41 42 43 44 45 46 49 50 51 53 55 58 59 61 62 66 68 69 70 71 72 73 74 75 76 80 81 82 83 84 85. Items 1 to 26 cover 14, 15, 21, 26, 35, 38, 39, 40, 41, 44, 45, 51, 53, 55, 58, 59, 61, 62, 66, 68, 72, 74, 80, 81, 82 and 85. Items 27 to 43 cover 27, 30, 33, 34, 36, 42, 43, 46, 49, 50, 69, 70, 71, 73, 75, 76 and 84. Rows 24 and 83 are named as needing no change. Every row has an item or a no-change line.
- "fixed": items 1 to 43, each with "Must hold".
- "and its look taken again": no requirement. Verify 5 asks for the builder's own run on a scratch app. The rules file ("What every package obeys", the look rule) makes the look the orchestrator's, on TEST at landing. The brief does not tell the report to name, for each row, its look record, the state to put the view in and what should be seen, so that the look can be taken again.

Findings: "its look taken again" has no requirement that serves it.

## 3. Premises

- "read on main at 9a623bfe0": `git log -5 --format='%h %s'` printed head `fe3d10f73 Ban diagnosis in the hub's working rules`. `git diff --stat 9a623bfe0 fe3d10f73` printed only `CLAUDE.md | 2 +-` (the hub's), so no premise moved. The commit named is stale.
- "43 rows, of which rows 24 and 83 need no change ..., so 41 rows are built here": the awk above printed 45 rows. With 24 and 83 needing no change, 43 rows are built, which matches the brief's 43 items. Does not match.
- Look records: every record the rows name exists. A loop over the 35 records printed no MISSING.
- Size limits (`wc -l`): `viewer.svelte.ts` 880 matches and `PaneView.svelte` 517 matches. `layout.svelte.ts` is 890, already past 880, and `utils/size-allow.txt` lists no file. Under the rules file any change to it must split it, whether or not it grows; the brief only says "a change that makes any of them grow". `src/desktop/windows/windows.ts` is 516, but it is a `.ts` source file whose limit is 880, not a component. Files the items change that are at the limit and not named: `src/lib/state/sources/repositories/repositories.ts` 888 (item 2 cites its line 672), `src/lib/server/machine/pty/channel.ts` 878 (item 22 changes it), `src/lib/shell/keys/Palette.svelte` 519 (items 19 and 38), `src/lib/ui/controls/editor/Editor.svelte` 519 (items 4 and 32 may touch it), `src/lib/state/sessions/latex/builds.ts` 850 (item 18).
- ADRs: `ls tools/oculus/docs/adr` printed "no such file or directory". `find . -type d -name adr` printed nothing, and `.agents/plan.yaml` has no `adr` key. The brief says the folder was "read on main". There is no such folder, so there is no record.
- Reference files: a loop over every reference path printed "exists" for each.
- Items 1 to 20 and 22 to 28, 29, 30, 32, 35 and 39: each file and line the item cites was read and holds (item 1 `Merge.svelte:98-103`, `selectors.svelte.ts:610`; item 3 `tab-asks.svelte.ts:139`, `sourceOnScreen` at `editor-status.svelte.ts:167`; item 4 `Merge.svelte:242`; item 5 `PaneView.svelte:425-426`; item 6 `CloneAsk.svelte:29,40,55`; item 11 `search.svelte.ts:212-224`, `toggleMode` 227-232; item 12 `Entry.svelte:177`; item 13 `History.svelte:269,291`; items 15 and 16 `undo.ts:553-558`; item 19 `FileRows.svelte:51`; item 20 `layout.svelte.ts:773`; item 24 `Confirm.svelte:64`, `ui.svelte.ts:199` `saveTab: (id: string) => boolean`, which reports only whether a save was registered; item 25 `StatusBar.svelte:98`; item 26 no `acceptFirstMouse` in src or tests; item 27 `menu.ts:80-84`; item 28 `forces.ts:399`; item 29 `opening.ts:82`; item 30 `row-ops.ts:235`; item 32 `editor/commands.ts:62`; item 35 the hub's `.oculus/config.yml:47`). Item 21: not verified (behaviour).
- Item 43: `src/lib/ui/controls/editor/load.ts` does not exist. `grep -rn MonacoEnvironment src` printed `src/lib/ui/controls/editor/kit/load.ts:311` (block 311-313). Does not match.

Findings:
- The row count "43 rows ... 41 rows are built": the command prints 45 rows, and 43 are built.
- The size list leaves out `repositories.ts` 888, `channel.ts` 878, `Palette.svelte` 519, `Editor.svelte` 519 and `builds.ts` 850; it counts `windows.ts` (516) as near a 520 limit, though its limit is 880; it describes `layout.svelte.ts` (890) as near the limit and ties its split to growth.
- The ADR folder `tools/oculus/docs/adr` does not exist.
- Item 43's path: the code is at `src/lib/ui/controls/editor/kit/load.ts:311-313`.
- The base commit 9a623bfe0 is no longer main's head (fe3d10f73). Nothing the brief names changed.

## 4. Cases and checks

Findings:
- Builder page runs clash with the rules file. "Where you run the app", the symptom items 27 to 43, the cases' first run and Verify 5 all have the builder start a scratch desktop app and drive it over the DevTools protocol. The rules file says "A builder runs no page: it starts no scratch oculus for a browser and drives no headless browser, whatever a brief says", and a behaviour that needs a DOM "is seen at the look on landing" (Z720, `plan.md:1763`). The state file's standing demands add that a builder never reruns a case that starts the app. Open items 130 and 131 do not lift Z720.
- New guarded entries clash with the rules file. The brief says a test needing a new entry is proposed in the report and the orchestrator adds it at landing; the rules file says "A step that needs a new entry stops and asks Axel for it, and writes no test until he has ruled."
- Wrong item numbers in Cases: "item 14 with the conflict resolved behind the tab" means item 1; "item 44's scratch hub" means item 10.
- Item 26's case cannot be run as the brief allows: it needs a press on an inactive window, the brief forbids taking focus, and ruling 128 grants a real pointer drag only to the session.
- Guarded entries not named: items 15 and 16 G9; item 14 G96; item 24 G28; item 29 G37; item 33 G93; item 41 G90; item 37 G42; item 26 G47; items 21 and 39 G65 if `VirtualRows` changes.
- Verify 2 uses the superseded `LC_ALL=C grep -n '[^ -~]'` form; the rules file's ASCII gate paragraph gives the perl form.
- No base copy named, nor the base `unused-exports` output, which the rules file requires.
- No DESIGN.md sections named, which the rules file ("Read first" 1) requires.

## 5. The question

- Item 2's case can pass with the defect still there: if the page hears the abort before the merge of `side2`, the field is emptied and the side2 message goes into an empty field on the unchanged tree. The case does not say that the second message arrives with no empty message in between.
- Item 26's check, a `pointerdown` recorded on the page, can pass without the fix: a press sent over the DevTools protocol does not go through macOS's first-mouse handling. Reasoned, not verified by a run.
- Item 27's check can pass without the defect being fixed: Cmd+A sent with `commands: ['selectAll']` bypasses the Edit menu. Reasoned, not verified by a run.
- Items 38 and 40 can pass on a smaller hub: the look hub is gone and the scratch hub `$S/o40/run/a/hub` holds 30 files; the brief does not state the hub's size.
- Verify 5 cannot stand for the step line's "its look taken again".
- Every other item's "Must hold" names a behaviour the defect breaks.

Findings: items 2, 26, 27, 38 and 40, and Verify 5 against "its look taken again", as above.

## 6. Implied inputs

Findings, each missing from "Cases", with the expected result:
- Item 3: the indentation commands (`SourceItems.svelte:58,66,72`) while the indentation is unknown: left out or disabled, nothing reads a null `indent`.
- Item 9: a picture taller than `PICTURE_MAX_HEIGHT`, and a pane narrower than 458 px: the aspect ratio kept, and what a narrow pane does stated.
- Item 12: the entry page's own save whose answer lands before the push: the saved line stays.
- Item 17: a root whose listing the store does not hold yet, and a settings file created after the listing: read once the listing names it.
- Item 18: a file staged but never committed, and a file outside any repository: no blame request, no failing request.
- Item 19: `:tab` for a view that exists once, from a popped-out window: it goes to wherever that view is.
- Item 20: the other tab's operation names a node the first removed: stated, never applied to another node.
- Item 24: a close that also ends a running terminal (`pages.ts:164-169`); an untitled tab or one with no registered save; `editor.autosave` `on_focus_change` (G28); the Reset all pages question at `pages.ts:374`, the Files view close of open editors and an app's custom editor: each stated.
- Item 25: the last source tab closed while a view tab of another group is active: its items go.
- Item 28: the fixture for a project with links named.
- Item 30: a paste of several items: which one is selected.
- Item 33: a root that leaves and is added back: its tabs read it again.
- Item 35: a hub config naming a radar file that is not there: stated.

## 7. ADRs

- `tools/oculus/docs/adr` does not exist and `.agents/plan.yaml` names no `adr` key. No record.

Findings: the brief says the folder was "read on main". Otherwise none.

## 8. Dictated text

- `undid_new_entry: add undone` (`grep -n "add undone"` prints 47 and 105): holds.
- "Save, Don't Save and Cancel, the keyboard on Save" (`grep -n "Don't Save"` prints 48 and 106): the words hold, and `config/text/app.yml:8` holds `dont_save: Don't Save` for reuse. The brief does not dictate the question's own words (`ui.yml:95` becomes false) or the button order (`Confirm.svelte:89-99` draws Cancel, then `others`, then the confirm); both are visible shapes left to the builder.
- `acceptFirstMouse: true` (`grep -n acceptFirstMouse` prints 50): holds.
- `level="palette"` (prints 30): holds; `Confirm.svelte:46` takes `'palette'`.
- The `onsaid` sentence (line 31): breaks "Verify before asserting"; the two cards use `onsaid` for five other answers.
- `LC_ALL=C grep -n '[^ -~]'` (line 125): breaks the ASCII gate paragraph.

Findings: line 31, line 125, and lines 48 and 106 leaving the question's words and the button order undictated.

## Declined to judge

- Whether open item 131 lifts Z720 for this step, so that the builder may run a page. Axel's ruling; the text of 131 does not say so.
- Whether handing the builder output of the stopped diagnosis agents fits rulings 130 (b) and 131.
- Whether the reference diffs are correct.
- Item 21's premise (the viewport keeps its scroll while the selection resets): not verified.

Agent usage: a720dd5aa206b347e, claude-opus-5-5, 238,481 tokens, 81 tool uses, 12.3 min.

## Closed

Each finding with the change to `agents/briefs/O40.md` that closes it.

- Names, `onsaid`: item 7 now removes only `SaveToLiterature.svelte`'s prop and the passes at `LiteratureCard.svelte:171` and `RadarCard.svelte:235`, the cards' other `onsaid` answers kept.
- Names, item 24's callers and words: item 24 lists `PaneView.svelte:379`, `tab-menu-state.svelte.ts:140`, `editor-closing.ts:35` and `pages.ts:374` with the others, and `ui.tab_close_dirty` gets new words (decision 2, Z932).
- Names, `guarded.md:82`: "Paths this step writes" says a changed title of a guarded test is given in the report with its old and new text, and the orchestrator changes the entry at landing.
- Names, HELP.md and DESIGN.md: both are in the paths; item 15 names `changes.ts:110-121` and `DESIGN.md:159`, item 24 names HELP.md:66, items 10, 13 and 23 name their head comments.
- The step line, "its look taken again": the report gives, per item, the look record to take again, the state and what must be seen; Cases says the look on landing takes each row's record again.
- Premises: the base is fe3d10f73; the row count reads 45 rows, 43 built; the size list holds every file at or past the limit, `layout.svelte.ts` split in this step, `windows.ts` dropped; the brief says the repository holds no ADR folder; item 43 names `kit/load.ts:311-313`.
- Cases and checks, page runs (Z720): the section "Where you run the app" is gone; the builder runs no page, server, app or browser; items 27 to 43 are found by reading and unit-level runs, and the page behaviour goes to the look on landing.
- Cases and checks, new guarded entries: a case that would need a new entry gets no test and is named in the report with the entry text, for the orchestrator to bring to Axel, as the rules file says.
- Cases and checks, item numbers: the cases are written per item with the right numbers.
- Cases and checks, item 26: its case is G47's window-options test; the press on an inactive window is the session's look with the real pointer (ruling 128 (b)).
- Cases and checks, guarded entries: "What is on the tree" names G9, G28, G37, G42, G47, G65, G90, G93 and G96, and Verify 4 runs their tests.
- Cases and checks, Verify 2: the ASCII gate of `agents/spec.md` in its perl form.
- Cases and checks, base copy: `.agents/worktrees/O40-base/tools/oculus` and its `unused-exports.txt` are named, and Verify 5 compares against it.
- Cases and checks, DESIGN.md: the opening names the sections every item is measured against.
- The question, item 2: the case says the second message replaces the first with no empty message in between.
- The question, items 26 and 27: item 26's press goes to the session's pointer look; item 27 asks for the box's own key handling to be read and the result seen at the look in the desktop app and a browser.
- The question, items 38 and 40: both are measured at the look on the look record's hub size; the builder quotes unit-level timings before and after.
- The question, Verify 5: removed; the look on landing is the proof.
- Implied inputs: items 3, 9, 12, 17, 18, 19, 20, 24, 25, 28, 30 and 33 state each input with its result in "Must hold"; item 35 states the missing file.
- Dictated text: line 31 rewritten (item 7 above); the grep form replaced (Verify 2); decision 2 dictates the question's words and the order Don't Save, Cancel, Save (Z932).
- Declined to judge, Z720 and 131: 131 does not lift Z720, and the brief keeps Z720.
- Declined to judge, the stopped agents' files: the brief names no reference diff; every item's fix is written in the brief's own words.
