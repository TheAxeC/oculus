# O47 refuter report

Usage: a8e4668c92b2067ad, ordo-high, claude-opus-5-5, 264,363 tokens, 86 tool uses, 9.3 min. By reading only.

O47 refuter report (by reading only; no test, check or build run)

VERDICTS

(1) Subtask line edit, `subtask` write takes `do` and `deadline` (ruling 198): holds. src/lib/server/edit/writes/bodies.ts:296 adds `'do', 'deadline'` to the action enum. src/lib/server/edit/writes/subtasks.ts:126-127 routes both to setSubtask with `value?.trim() ?? null`. setSubtask refuses an emptied `do` (entry-edit/subtasks.ts, `clears && field === LABEL` -> subtaskNoDo). Subtasks.svelte adds an Edit control, an edit form and save(). The formatting defect at writes/subtasks.ts:127 is under Standards S1.

(2) `followup:` as a list with `followup` / `followup-add` writes, Done removes one note, Quick Add appends, card edits, form fields removed, hub's six values rewritten (ruling 197): violated in part.
- Done in the diff: the write kinds, the undo, History, the app gate, Followups.svelte on both cards, Quick Add through addFollowup, and the form fields removed (manifest-schema.yml:62 is now `type: keymap`, which FieldControl.svelte:119 draws read-only).
- Not done: the hub rewrite. `grep -rn -A3 "^ *followup:"` over the hub still shows six single-string values: funding.yml:45, education.yml:33, applications.yml:38 (`""`) and :57, hccnet-fl/project.yml:19, linfoot-estimator/project.yml:29. The report books this for landing.
- The reader does not do what the ruling and the report say; see B2 and P1.

(3) Memories and wallpapers searched recursively (ruling O47 recursive): holds for the listing. images.ts `walk` recurses, skips dot names and does not enter folder links. The path check it brings in opens a way out of the folder; see B1.

(4) Focus lines (ruling O47 Focus lines) and the documents: the code holds, the documents part is violated.
- Code: ticker.ts:227 gives the funding deadline line `entry: FUNDING`. Lines 306-309 and 319 give conference calls `entry: VENUES`. Lines 350-358 and 368-369 let the follow-ups of a `live_subtasks` entry through. The funding follow-up line carries `entry` and a target. vocab.yml:146 has `ongoing` as terminal with live_subtasks, and the hub's education entry 0 has `status: ongoing`. Both view ids exist in config/defaults/layout.yml:111 and :129.
- Documents: HELP.md and DESIGN.md are not updated, and two DESIGN.md sentences are now false (S6). The O47 line says "landed after O39 part D". `git log --oneline -5 main` shows only "Dispatch O39 part D" (ad63b0b0) and later bookings, and HELP.md and DESIGN.md are still at the repository root (`ls docs`), so O39 part D has not landed.

(5) Layout of open item 199 (ruling 199): holds by reading for what the diff touches. Tree.svelte gets a `.head` top line, the 6 px top margin is removed from Bookmarks and Notes, and Pane gains `flush`, passed by Source and Terminal. Timeline.svelte is not changed; whether the Timeline/Bookmarks lines and heights are right is for the look. `flush` leaves the Source view's locked-file line with no inset at all (B3).

SPEC

S-a. Item (2): the hub's six `followup:` values are not rewritten (grep above). Until they are, five follow-ups (the sixth is the empty `applications.yml:38`) disappear from the Focus board and the cards with no finding (B2), because `followups()` (normalise-parts/plans.ts) and `entryFollowups` (collection.ts) read a string through `keyedRowsShape`, which has no string branch (shapes.ts:226-231). Failure: land the oculus diff before the hub edit and "Send reminder to Maarten" (funding.yml:45) is gone from Focus.

S-b. Item (4): docs/HELP.md and docs/DESIGN.md are not updated, and O39 part D, which the step is to land after, has not landed (evidence under verdict 4). HELP.md gets no bullet for the card's Follow-ups block, the subtask Edit, Quick Add appending, Focus funding and venue lines opening their views, or pictures in subfolders. spec.md requires a step to write "what a user does into HELP.md as short bullets".

S-c. A user-visible decision no ruling names: the reader accepts a map of notes (`keyedRowsShape` map branch; model-entities.ts:313-315 "or its own key in a map of notes"). Ruling 197 says a list. This choice is what makes the single-map form read as two notes (B2).

S-d. A user-visible decision not reported: Followups.svelte draws the "not until" Tag for any `note.after`, past dates included (B5).

PROOF

P1. The report's sentence "a bare string or a single `{ do, after }` map is no longer read" is half false.
- A single map `followup: { do: x, after: 2026-11-01 }` passes `keyedRowsShape`'s map branch as rows `['do','x']` and `['after','2026-11-01']`.
- Each string row passes `noteShape`'s string branch (plans.ts:12), so the project carries two notes, "x" and "2026-11-01".
- collection.ts `entryFollowups` does the same (`readAs(stringShape, item)`).

P2. Test results quoted from before later edits. The pass counts in "Not done" (108, 18, 10, 2 passed, svelte-check 0 errors) were taken before the layout changes, the doc changes and the comment edits. spec.md says such a figure is taken again or removed. The report says plainly that they were not re-run.

P3. Reached by reading, without a run: the verify list would not be green (S1, S2). The report states no format or lint run, so it does not claim green.

P4. The scratch-run claim in item 3 ("404 for ... a path through a looping link") does not cover a link to a folder outside the wall. By reading, stream serves such a path (B1). Whether the loop tested was a self-loop (ELOOP, 404) or a link to `.` (which `statSync` follows to a file, 200) is not said.

P5. The report has no "before and after" section naming each view, the state to put it in and what should differ, which spec.md requires as what the look on landing is read against. It also lacks the DONE / NOT DONE table, the history-word grep, the `utils/unused-exports.sh` comparison and the rename grep. guarded.md line 72 still names 'ticks and reopens a line of a manifest', which the diff renamed (writes.test.ts), and line 212 still names the deleted followup-values.test.ts. Both are booked "at landing" in the report.

P6. No test covers the new path check `isFilePath` or the reader's keyed shapes beyond one list case (normalise.test.ts). Under spec.md that needs a guarded.md entry, so this is not a defect of the step. It leaves the security-relevant check of item 3 resting on the unreproducible scratch run.

STANDARDS

S1. Not prettier-formatted (printWidth 100, .prettierrc):
- src/lib/server/edit/writes/subtasks.ts:127 is a 106-column code line: `? setSubtask(host.source, host.range, key, { [action]: value?.trim() ?? null }, config.text)`.
- tests/routes/edit/undo/undo.test.ts:367 is 101 columns: `body: { kind: 'followup-add', target: { id: REPOSITORY_ID }, fields: { do: 'call Ann' } }`.
- src/lib/state/boards/ticker.ts:490-491 has two blank lines where `followupsOf` was removed.
- src/lib/views/shared/forms/Followups.svelte:184 is 101 columns with two elements on one line: `<span class="mark"><Glyph name={t('project.action.add_followup_glyph')} /></span>`.
Failure: the format check of the verify list or landing list is red.

S2. Unused bindings:
- src/lib/views/boards/editor/Editor.svelte:63 still destructures `fs: { primary, roots }`, whose only use (`fileUnder(project.file, roots(), primary())`) was deleted. Lint fails on unused variables.
- src/lib/views/shared/forms/entry-file.ts:104 `openAtKey` now has no importer in src or tests (`grep -rn openAtKey src tests` shows only its definition).
- The `link` prop chain (EntryForm.svelte `link={link?.(field)}` into Field) has no caller left: EntryEditor does not pass it, and Editor.svelte no longer does.
- writes.ts:217 re-exports `FollowupAction`, which nothing imports from writes.ts.

S3. Orphaned refusals. `REFUSALS.commentInValue` and `REFUSALS.noteNotText` (why.ts:16, :44) and their catalog lines `server.edit.comment_in_value` and `note_not_text` (server.yml:244, :272) had their only uses in the removed yaml-edit.ts code. `git grep` at ad63b0b0 shows yaml-edit.ts:468 and :536 as the only uses; the worktree grep shows none. Dead keys, contrary to "every catalog key has a reader".

S4. A tolerance whose reason is gone. src/lib/data/snapshot/schema/manifest.ts:45 `CONTAINER_TYPES = ['object', 'string', 'array', 'null']` existed so that `followup` could be a string or a list. No dotted group needs it now, so `status: "text"` passes the generated schema with no finding. The head comment line 5-6 ("Such a map may also be written as one line of text") states that leftover as design.

S5. Comments edited but not rewrapped as a paragraph at 100 columns:
- manifest.ts:6 (155 columns).
- entry-edit/lines.ts:36 (110), :42 (101), :46 (101).
- writes.ts:23 (115).
- writes/subtasks.ts:133 (104), :246 (101).
- writes/undo.ts:200 (110).
- shapes.ts:213 (104).
- writes.svelte.ts:376 (103).
- model-entities.ts:386 (101).
- Editor.svelte:35 (101).
- History.svelte:147 (106).
- EntryCard.svelte:28 (164), and :5-6, where "notes. The collection" is a short line inside a sentence.
- ProjectCard.svelte:15, a short line "one of the controls. The card is a positioned box whose content may".
- changes.ts:118, a short line "The text a write replaced: on the record of a `config-value` write, on".
- images.ts:11-12, a short line ending "...to go missing." with the paragraph continuing on the next line.

S6. Sentences the change makes false:
- src/lib/server/core/changes.ts:76-81 (`ReplacedText` doc) still says "a manifest write that wrote a bare note or a list of one note as the map it stands for". That path is removed.
- DESIGN.md:250 says the wallpaper value is "a hub name and a file name joined by a slash". It is now a file path.
- DESIGN.md:648 says a Memories picture "is served as `<hub name>/<file name>`". It is now a path, and the wall reads folders under it.
- Tree.svelte:485-486 says the `.head` line is for "The workspace header", but Notes.svelte's header goes through the same wrapper and gets the line too.

S7. Duplication.
- collection.ts `entryFollowups` is a second parser of the `followup:` shape beside data/snapshot/normalise-parts/plans.ts `followups`: same keyed rows, same string-or-map note, same empty-note drop, with different text coercion (`textOf` against `optionalTextShape`). spec.md: "a parser ... exists once and is reused".
- Followups.svelte (275 lines) repeats Subtasks.svelte's said/edit/save/add logic, its form markup and its row styles nearly line for line. Only the server side was made generic (`LineBlock`).

S8. Naming. entry-edit/subtasks.ts:87 renames a local to `name_` to avoid shadowing the new `name` parameter.

BEHAVIOUR

B1. The new path check lets a request leave the photo wall through a folder link.
- Before the step, `stream` took only `isName` (no `/`), so no folder link inside the wall could be crossed.
- Now `isFilePath` takes `link/x.jpg`, and `inside()` (server/core/paths.ts:20-24) compares resolved paths without following links.
- memories.ts `serve` checks no listing membership (wallpaper's `named` does: `images(...).includes(file)`), and `statSync` follows the link.
- Failure: with `.oculus/memories/ext -> /Users/axelfaes`, `GET /api/memories?file=<hub>/ext/Downloads/scan.png` streams that file. Any .jpg, .jpeg, .png or .webp under the link target is served, though `images()` never lists it.
- The images.ts head comment ("the chosen file is resolved and refused if it is not inside the folder") reads as if this were covered. The report does not mention it.

B2. Older shapes of `followup:` show wrongly or vanish, with no finding.
- A string `followup: "text"` reads as no note, and `writtenFields` (schema/hub.ts) gives `followup` the type `raw`, so the audit says nothing. After the step the note is silently absent from the cards and Focus. spec.md's no-migration rule asks such data to show as unknown or as a finding.
- A single map `{ do, after }` (the shape the old Quick Add wrote through `followup.do`) shows as two Focus lines, "Title - x" and "Title - 2026-11-01".
- Done on the first line runs `deleteSubtask` on map key `do` and leaves `followup:\n  after: 2026-11-01`, which then shows as a note whose text is a date.
- Edit on either line is refused with "the subtask is not a one-line flow map".

B3. `flush` takes away spacing that some Source and Terminal states need.
- LockedCode.svelte `.locked` has `margin: 0` and no padding. The line saying why a file is read-only, too long or a HEAD version now touches the pane's top and left edges (before, 10 px / 12 px).
- An error in Source is `Empty` with `.empty.error { padding: 0.4em }` only.
- The Terminal start form (TerminalStart `.start` has no padding) sits 4 px from the top and 6 px from the left, inside `.terminal`'s 4px 6px 6px (before, 14 px / 18 px).
- None of this is in the report's item 5.

B4. Unstated: the Notes section's head gains a top line. Notes.svelte renders its head through Tree.svelte's `header`, now wrapped in `.head { border-top }`. The report names only the workspace header.

B5. Follow-up dates now show differently. The card's follow-up rows draw "not until <date>" for every note with `after`, including dates already past (Followups.svelte, `{#if note.after}`). Before, CardDetails drew it only for notes `dueFollowups` held back. Failure: a note with `after: 2026-10-01` on 2026-10-21 reads "not until 2026-10-01" while it is due on Focus.

B6. Unstated: a Memories tile's label, title and alt text now carry the folder path ("sub/deeper/c.webp", Memories.svelte:240-253). The wall's order is now by path code units (images.ts `found.sort()`), so a subfolder's pictures sort among the top-level ones by their folder name.

B7. Follow-up refusals use the subtask wording, shown to the user: "there is no subtask {0}" (stale key after another note was removed), "the subtask is not a one-line flow map", "a subtask with no do line is not a subtask" (server.yml:268, :280, :281). Focus's follow-up Done is titled "mark done" (rows.ts actionsFor) while the card's is "done; takes the note out".

B8. Cost not stated. Every Memories listing walks the whole folder tree and reads each file's head. Every wallpaper thumbnail request (`serveImage` -> `named` -> `images(held.wallpaper)`) walks the wallpaper tree again, with no depth or count limit. A wall folder holding a large photo library makes each thumbnail cost a full walk.

DECLINED TO JUDGE

- Whether the Timeline/Bookmarks lines and heights and the Editors-to-Files line now look right, and whether 0 px suits the editor and terminal. Settled by the look on TEST on the Files view (Open Editors, workspace, Notes, Timeline, Bookmarks expanded) and on a Source tab and a Terminal tab.
- Whether prettier, eslint, svelte-check and the unit tests pass. S1 and S2 predict red by reading. Settled by a run of `npm run test:quick`, which was not available.
- Whether the YAML reader gives an unquoted `after: 2026-11-01` as a string or a Date. If a Date, the single-map case in B2 shows one note instead of two, but Done on it still deletes the `do:` line. Settled by reading the yaml parse options of the snapshot reader, or by a run.
- What the landing rewrite of `applications.yml:38` (`followup: ""`) should become. An empty string holds no note to put in a list. Settled by the orchestrator's edit at landing.
- Whether the funding scheme's id resolves through `readCollection(hub, config, 'funding')` and `identityOf` for the new follow-up Done on Focus. The existing funding writes use the same route (rows.ts:160), which suggests it does. Settled by the look: Done on the FWO line on TEST.
