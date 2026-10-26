# Step O89 refuter report (on .agents/worktrees/migration-O89, base 1da23d50b)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ npm run test:quick -- --base 1da23d50b        (worktree root)
test:quick: 58 changed file(s), from git since 1da23d50b
test:quick: 7 test file(s)
        tests/server/machine/runs/recover/sources.test.ts: named for a changed file
        tests/checks/tree/boundaries.test.ts: imports at depth 1
        tests/state/shared/hubs.test.ts: imports at depth 1
        tests/state/client/created-ids.test.ts: imports at depth 2
        tests/state/client/held-unsaved.test.ts: imports at depth 2
        tests/state/forms/new-entry.test.ts: imports at depth 2
        tests/views/shared/forms/entry-add.test.ts: imports at depth 2
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      ASCII gate (0.9 s)
ok      svelte-kit sync (2.8 s)
ok      eslint (2.3 s)
ok      svelte-check (9.3 s): 1793042101850 COMPLETED 546 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (11.4 s): Duration  3.16s (transform 6.04s, setup 0ms, import 10.87s, tests 187ms, environment 1ms)
ok      vitest checks (16.7 s): Duration  8.42s (transform 956ms, setup 0ms, import 4.75s, tests 3.50s, environment 0ms)
test:quick: 19.6 s; every command passed
EXIT 0
(58 against the report's 57: the untracked report file under .scratch is the extra path.)

$ sh utils/unused-exports.sh > <scratch>/o89-unused.txt; diff .agents/worktrees/O89-base/unused-exports.txt <scratch>/o89-unused.txt
diff exit 0 (no line added)

$ grep -rn "forms/InPlace\|InPlace.svelte\|card-menu\|record-card.svelte\|createRecordCard" src tests docs config --exclude=local.yml
grep exit 1 (prints nothing)

$ wc -l of every changed or added component (largest lines)
437 ProjectCard.svelte, 425 Gallery.svelte, 400 LeadCard.svelte, 386 RadarCard.svelte, 374 InboxCard.svelte, 342 record/RecordCard.svelte, 326 EntryCard.svelte, 317 Subtasks.svelte, 298 VenueCard.svelte, 297 Inbox.svelte, 288 Card.svelte, 279 LiteratureCard.svelte, 218 record/CardActions.svelte; every one at or under 520.

$ sh utils/folder-check.sh
EXIT 0

Case 22, over the 14 card files:
$ grep -ln "RecordCard" <14 files> | wc -l
14
$ grep -ln "ContextMenu\|<Menu" <14 files>
(nothing)

Rerun of the report's wider command:
$ npx vitest run tests/checks/tree tests/checks/imports tests/checks/source tests/checks/config tests/views tests/state/boards --testTimeout=120000
 FAIL  tests/checks/source/comment-width.test.ts > a comment line > ends by the hundredth column everywhere under src, tests and utils
 FAIL  tests/checks/tree/duplication.test.ts > a rule written twice > is not held anywhere under src/lib
 FAIL  tests/checks/tree/duplication.test.ts > a rule written twice > is not held anywhere under tests
 Test Files  2 failed | 35 passed (37)
      Tests  3 failed | 438 passed | 9 skipped (450)
(matches the report)

Whole-tree checks the quick list does not pick (size, styling, history, keys, comment width, duplication, imports, diagrams, config):
$ npx vitest run tests/checks/source tests/checks/tree tests/checks/imports tests/checks/diagrams tests/checks/config/config.test.ts tests/checks/config/config-folder.test.ts --testTimeout 0 --hookTimeout 0
 Test Files  3 failed | 12 passed (15)
      Tests  4 failed | 219 passed | 2 skipped (225)
 FAIL tests/checks/diagrams/palette.test.ts > the palette page > is what the palette gives now   (slow-tagged; diff is the view list "Track record" against "Projects, Supervision, Coauthor, Archive, Personal, Software"; no file of the step's diff is a palette or layout file)
 FAIL comment-width.test.ts: 13 lines, in hub-names.ts:142, model-collections.ts:374,375, collections.ts:4, vocab.ts:75, career.ts:58, focus.ts:533, focus/filter.ts:109, LaneCard.svelte:14, Projects.svelte:255, GroupHead.svelte:28, Venues.svelte:14, options-schema.test.ts:2
 FAIL duplication.test.ts (src/lib): FoldHead.svelte:46 and GroupHead.svelte:39
 FAIL duplication.test.ts (tests): language.test.ts:160 and config-cache.test.ts:269
$ git diff 1da23d50b --name-only | grep -E "<each of those files>"
exit 1 (none of them is in the step's diff, so O89 adds no line to either known failure; size.test.ts, boundaries.test.ts, history.test.ts, keys.test.ts, catalog-file-keys.test.ts pass)

$ LC_ALL=C perl ASCII gate (rules file form) over src tests config, docs/HELP.md and the report
prints nothing (exit 0)

$ grep -n ":global" src/lib/views/shared/card/CardDocs.svelte
199:    .doc.human :global(.tool) {        (reproduces the report's note on allow-styling.ts citing :162)
$ grep -n ":global" src/lib/views/shared/links/CrossLinks.svelte
160, 161, 166 (the updated HELD rows cite 160 and 166: reproduced)
$ grep -rn "InPlace\|card-menu\|RegistryCard\|record-card\|collection\.related\|qa_save\|qa_cancel" docs README.md
4 hits, all `layInPlace` in docs/diagrams/writes.dot and writes.svg (an unrelated identifier; the report says "finds none"; no decision rests on it)
$ wc -l (report's spot figures) cross-links.ts 212, card.ts 231, literature-save.svelte.ts 133, registry-card.svelte.ts 106, HELP.md 584, project.yml 189, allow-styling.ts 55, Collection.svelte 520; forms/dated 6 items, card/record 3 items: all reproduce.
History-word grep over added lines and new files: hits only "the question before a delete", "the part before a colon", "Not before", "the date before which": none names a past state.
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `record/RecordCard.svelte` draws the head (RootChip, `meta`, strip via `stripActions(every, strip)`, the "..." `Menu`), `ContextMenu own` when the card has an action, the body in the brief's order (facts, lines, text, blocks or `details`, dated lines), the foot (`CrossLinks groups`), and the 14 card files draw it (case 22 greps). `record-card.svelte.ts` is `registry-card.svelte.ts` with `RegistryCardState`, `RegistryCardProps`, `RegistryCardTarget`, `createRegistryCard`; `entry-actions.ts:72` says "registry card"; `CardActions.svelte` is in `card/record/`, `views/shared/card` holds 10 items. `Card.svelte` takes `fill` and `ring`; the ProjectCard, EntryCard and VenueCard `HELD` rows are gone and none was added.
- 2: holds. `record-menu.ts` RUNS: open (page, folder, files, workbench, present, then `run: 'open'` actions), add (followup, subtask, deadline), status, rest (ask, edit, pin, copy, deposit, clone, cloned, own, then archive, delete); Add rows disabled with `blocked` as title (`RecordCard.svelte:163-195`); `entryDated`/`feedDated` return undefined for a file with no schema.
- 3: holds. `InPlace.svelte` deleted, grep 3 empty, keys.test.ts passes; strips per kind as listed (`strip=` props read in each file); Literature hit's four actions on its meta row; Gallery sample present. See Behaviour 1, 2 and 3 for unstated changes.
- 4: holds. `forms/dated/DatedForm.svelte`: rule (`border-top`), heading by kind, `Field` labels "What", "Not before", "Deadline"; Save disabled while empty, blocked or saving; answer dropped when not drawn or `record` changed (`DatedForm.svelte:83-93`); edit form stays `LineForm`.
- 5: holds. `QuickAdd.svelte` offers the three; `forms/dated/RecordPick.svelte` gives Kind then Record, Project first, collections with a schema (deadline field only for Deadline), entries by title sorted, `focus.qa_named` for shared words and for more than one hub, empty record list disables Save; shared with `InboxCard`. See Behaviour 1.
- 6: holds. Catalog keys in `project.yml`, `focus.yml` (lines 1-10 and 130-140), `gallery.yml`; the five words written exactly; HELP.md lines 281, 283-288, 294, 296-302 and 330 rewritten as the item says.

Cases of the brief's "Cases":

- 1: met, by reading `ProjectCard.svelte` (`dated.deadline` with `writeManifest`) and `DatedForm.svelte:71-75`; the look on Projects settles the drawing.
- 2: met, by reading `EntryCard.svelte:150-154,246-248` and `entry-actions.ts:111-123`; look on Funding.
- 3: met, by reading `entryActions` (`!addressable` branch) and `entryDated` (schema undefined returns undefined).
- 4: met, by reading `entryDated` (deadline only with a `deadline` field).
- 5: met, by reading `VenueCard.svelte:194` (Tag with deadline glyph) and `registry-card.svelte.ts:86-91`.
- 6: met, by reading `LeadCard.svelte:143-232` (`strip={['applied','page']}`, Status submenu, Delete through Confirm).
- 7: met, by reading `RadarCard.svelte` (`projects={links}`, strip dismiss or restore and page, Idea and Save in the rest run).
- 8: met, by reading `PostCard.svelte` (strip posted and edit, no footer).
- 9: met, by reading `InboxCard.svelte` (`dated={{ pick: thread.subject, projects }}`, `RecordCard.svelte:218-227`).
- 10: met, by reading `LiteratureCard.svelte:172-200` (four on the meta row) and the Abstract in blocks.
- 11: met, by reading `LineCard`, `DomainCard` (`projects`), `ArchivalCard` (`groups={strip}` from `stageGroup`), `OrphansCard`; Archival and Orphans hand no action, so no opener. Look on Pillars first.
- 12: met, by reading `NoFundingCard.svelte` (`projects={unfunded}`).
- 13: met, by reading `DatedForm.svelte`.
- 14: met, by reading `DatedForm.svelte`.
- 15: met, by reading `RecordPick.svelte:65-166`.
- 16: met, by reading `RecordPick.svelte:65-71`.
- 17: met, by reading `RecordPick.svelte:159-161` (`after: date`).
- 18: met, by reading `RecordCard.svelte:163-195`, `entry-actions.ts:117`, `DatedForm.svelte:118`; the parent Status row carries the blocked words as title and its items are disabled.
- 19: met, by reading `EntryCard.svelte` (no InPlace) as drawn by `Entry.svelte:295`.
- 20: met, by reading `Gallery.svelte` (RecordCard with strip, Status and Add runs, `projects={sampleProjects}`).
- 21: met, `allow-styling.ts` diff and the size and styling checks green in the rerun above.
- 22: met, the two greps above.
- 23: met, the report's "Case 23" table.
- 24: met, by reading `feedDated` (`type: 'text'` for the leads' text field, `writeFeedField(..., null)`) and the server's `writableFields`, which admits every schema field.
- 25: met, by reading `EntryCard` (`dated.target` always for a schema) and `Followups.svelte:120-128` (the refusal said).
- 26: met, by reading `showActions` (`files:<path>` and `workbench:<path>` rows with `row` words naming the path).
- 27: met, by reading `RecordPick.svelte:62,129-133` and `LeadCard.svelte:143-163` with `CardActions` drawing `items` as a Menu.
- 28: met, by reading `RecordPick.svelte:129-133,196`.
- 29: met, by reading `ProjectCard.svelte` `details` snippet and `RecordCard.svelte:256`.
- 30: met, by reading `RecordCard.svelte:304-308` (`ContextMenu own` around the card) and the opener in `meta`; the look settles Tab and Shift+F10.
- 31: met, by reading `DatedForm.svelte:81` with `text=''`.
- 32: met, by reading `feedDated` (schema undefined returns undefined).
- 33: met, by reading the single `adding` state in `RecordCard.svelte:151-158` and `DatedForm.svelte:65-93`.

## 1. Spec

none. The changes beyond the path list were each judged against an item: deleting `RegistryCard.svelte` is needed by item 1 ("each kind's card file draws its card through it and holds no head or menu of its own") and case 22; `RecordCard` drawing the foot strip is item 1's foot; `CrossLinks` taking `groups` only follows from its one caller handing groups and the rules file's unused-code rule; `RecordCard` drawing the delete question serves item 2 ("each that asks first still asking") for the five kinds that drew `DeleteAsk` themselves; `CardLinks.svelte` is item 1's "related projects, which leave the Related line"; `Inbox.svelte` is a caller the path list names; `SaveToLiterature.svelte` and `literature-save.svelte.ts` serve item 2 and 3's Save to Literature as a menu row; `state/shared/page/hubs.ts` serves item 5's kind words; `config/defaults/sources.yml:34` is a sentence item 3 made false.

## 2. Proof

- `.scratch/migration/agents/reviews/O89-report.md`, "Files written beyond the brief's paths": "`state/shared/page/hubs.ts`: re-exports `REGISTRY_VIEWS` for Quick add's kind words, so a view does not import `state/workbench` internals."; what is wrong: `REGISTRY_VIEWS` lives in `src/lib/data/helpers/hub-names.ts:133` (the data layer), and `RecordPick.svelte:30` imports `$lib/state/workbench/navigation/registry` directly anyway, so the stated reason does not reproduce; the re-export is justified by the layer rule that a view imports state and not data (`hubs.ts` head comment); the decision resting on it is the orchestrator's acceptance of a file outside the path list; failure scenario: the orchestrator accepts the out-of-list file on a reason that is false, and a later reader of the report concludes views may not import `state/workbench`, which the step's own `RecordPick.svelte` does. No verdict.

## 3. Standards

- `.scratch/migration/agents/reviews/O89-report.md`, DONE / NOT DONE: "`npm run test:quick -- --base 1da23d50b` ran three times; the two earlier runs were each followed by a change"; what is wrong: the rules file, "Token discipline", allows the list once after the last change and once more only after a red line in a changed file; two runs were made before the last change, and "a run of the list beyond what this paragraph allows, is a finding of the review"; failure scenario: with six steps in flight each extra full run of the list costs about 40 s of shared machine time (the report's own run took 38.4 s) and slows the other builders' runs. No verdict.

## 4. Behaviour

- `src/lib/views/shared/card/feed/SaveToLiterature.svelte:69-79`: "$effect(() => { ... literature.saved; untrack(() => { if (!landed) return; landed = false; if (!literature.saved) refocus = false; }); });"; what is wrong: on the base this effect read `held` (the Literature collections) and so ran on every change of them, ending the wait after one change; now it reads `literature.saved`, a boolean derived that only notifies when it flips, so a change of the collections that leaves the paper unmatched no longer ends the wait. The comments at :34-36 ("the next change of the collections either holds it ... or ends the wait for it") and :66-67 ("waits for the collections to hold the paper for one change of them only, so a paper the answer's entry does not match never takes the focus later") are now false. The report does not state this change; failure scenario: a reader presses Save to Literature on a search hit, the server writes an entry that `inLiterature` does not match to this hit, `landed` and `refocus` stay true; when the collections later hold a matching entry (another save, an edit of the file), In Literature takes the focus at that later moment if the focus is free, which the guard existed to prevent. Fix by exposing the collections read (`held`) from `literature-save.svelte.ts` and reading it in the effect. No verdict.
- `src/lib/views/shared/forms/dated/DatedForm.svelte:115-121`: "label={t('project.action.subtask_save')} ... label={t('project.action.subtask_cancel')}"; what is wrong: Quick add's buttons read "Save" and "Cancel" on the base (`focus.qa_save`, `focus.qa_cancel`, both removed); through `DatedForm` they now read "save" and "cancel" (`config/text/views/boards/project.yml:39,42`). The report's "Focus, Quick add" before and after does not state it; failure scenario: at the look on Focus the orchestrator sees lowercase buttons and cannot tell from the report whether that is intended. No verdict.
- `src/lib/views/structure/pillars/ArchivalCard.svelte:23-35` with `src/lib/state/boards/structure/cross-links.ts` `stageGroup`: "const members = [...projects].sort((a, b) => a.id.localeCompare(b.id))"; what is wrong: on the base one stage group was open at a time (pressing a second chip closed the first) and the members kept the snapshot's order; now each stage is an independent `CrossLinks` disclosure, several open at once, members sorted by project id. The report's Archival "After" states neither change; failure scenario: at the Pillars look, opened first by ruling 456, Axel sees two stages open together and a different member order with no line saying it is intended, and cannot judge it against the ruling. No verdict.
- `src/lib/views/shared/forms/registry/registry-card.svelte.ts:86-91`: "entryDated(client, collection, entry, schema, blocked, true)"; what is wrong: the venue, dataset, domain and pillar line cards now list the record's subtasks and follow-up notes in their body (`listed` true), which no registry card drew on the base. The report says it once under "Judgment calls" and the per-kind "Visible changes" for Pillars line card, Domains, Venues and Data give no before and after for it; failure scenario: at the look a venue with `subtasks:` shows a Subtasks block the reader of the report did not expect, and the look cannot be read against the report. No verdict.

## Declined to judge

- Every case a page shows (cases 1 to 20, 24 to 33): the drawing, focus, Tab and Shift+F10, right-click, menus and submenus, form layout, the Card `fill` and `ring` rendering and the venue's concentration ring, Archival's strip groups; these go to the landing look on TEST, Pillars first (ruling 456). Checked here by reading only.
- Whether a lead's and a Lit Watch paper's page show the lines the card's Add run writes: the report says "their pages list the lines"; `Entry.svelte:311-329` draws the feed card (form only) and then `EntryEditor`, and I did not read `EntryEditor` to see whether it lists `subtasks:` and `followup:`; a read of `EntryEditor` or the look on a lead page settles it.
- `tests/checks/diagrams/palette.test.ts` red in my run: a slow-tagged test over a page the step does not change; per the rules file, "Verify before you report", not counted against the step and not investigated.
- The report's open-items section, produced with `sed -n 184,199p .scratch/migration/orchestrator-state.md` on main at report time: the state file has since gained open item 467, so a rerun now would not reproduce the report's moment; not rerun.
- The generated `docs/diagrams/*.dot` and `*.svg` (six files): not sampled; they are regenerated at landing by `npm run diagrams`.
- Each new list item and sentence against the standards pages' list-item and sentence-length rules: not read item by item; the HELP.md bullets were read for truth against the code only.
- Whether an entry's and a venue's deadline Tag should carry the project card's countdown tone (`deadline()` in `card.ts`): the brief says "as the project card's `due`", and the diff draws the field's words with the deadline glyph and no tone; whether "as" means the form or also the tone is the orchestrator's reading of the brief.

Reviewer usage: a96110aabd9a11d96, claude-opus-5-5, 314122 tokens, 92 tool uses, 14 min 2 s.
