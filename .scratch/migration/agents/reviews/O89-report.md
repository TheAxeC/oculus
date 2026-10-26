# O89 report: one record card and one way to add a dated line

Everything in the brief is done. Nothing was looked at in a browser (no server was started); every case below is checked by reading the diff and by the runs quoted, and each names the look on landing as its proof.

## Open items of the state file

`sed -n 184,199p .scratch/migration/orchestrator-state.md` on the main checkout prints the heading "## Open items (only what Axel must rule on; ...)" followed directly by its standing paragraph and then "## Closed items". The section holds no entry: 461 and 462 are in the closed log ("461 and 462 (2026-10-26): ruled by Axel, 461 (b) ... and 462 (a) ..."). This step raises no new open item.

## The cases' first run (unchanged tree at 1da23d50b)

1. Project card: the Add run is Subtask then Follow-up (`card-menu.ts:33`); no Deadline row, no deadline form. Not met.
2. Funding entry: the status is an InPlace pick (`EntryCard.svelte:283-284`); no "..." and no right-click menu. Not met.
3. Entry of a file with no schema: `status:<word>` buttons in the strip (`entry-actions.ts:103-113`); no Add. Partly met.
4. Tasks entry: Add Subtask and Add Follow-up appear only while none exist (`entry-actions.ts:134-155`); no Deadline. Not met.
5. Venue deadline: an InPlace box (`VenueCard.svelte:274-279`). Not met.
6. Lead: Applied, Decline, Reopen and del are buttons on the meta row (`LeadCard.svelte:184-247`); no Page, no menu. Not met.
7. Lit Watch paper: its projects are ToolButtons (`RadarCard.svelte:206-223`); controls on the meta row; Save to Literature in a body row. Not met.
8. LinkedIn: Mark posted and Edit in a footer (`PostCard.svelte:75-92`). Not met.
9. Inbox thread: controls on the meta row (`InboxCard.svelte:172-216`); no menu, no Add. Not met.
10. Literature hit: the actions in a body row (`LiteratureCard.svelte:135-172`). Not met.
11. Pillars: the line cards' foot is CrossLinks (`RegistryCard.svelte:88`), Orphans' foot is CrossLinks (met); Archival draws Chips and buttons (not met); none has "..." (met).
12. No funding: its projects are ToolButtons. Not met.
13. and 14. LineForm is one row with aria-labels only, no heading, no rule; Save is disabled while the text is empty. Not met.
15. to 17. Quick add offers a follow-up and a deadline only, one project dropdown, a follow-up with no date (`QuickAdd.svelte:73`). Not met.
18. Entry, registry and feed cards disable their writes with `blocked`; the project card hands none (`ProjectCard.svelte:346-365`) and Quick add checks none (`QuickAdd.svelte:69-80`), which the brief keeps.
19. The entry page draws the InPlace controls. Not met.
20. Gallery has only plain, tone and pinned Card samples. Not met.
21. Reading: `allow-styling.ts` holds 10 HELD rows of the two cards (`grep -c` gives 20 lines, a line and a why each); the VenueCard row and the CrossLinks rows are present; every component is at or under 520 lines (Collection.svelte exactly 520).
22. `grep -ln RecordCard` over the 14 files lists DatasetCard, DomainCard and LineCard (the old registry helper's names); `grep -ln "ContextMenu\|<Menu"` lists ProjectCard and LeadCard. Not met.
23. The table of base controls per kind is compiled below under "Case 23".
24. The lead's deadline is text on the meta row with no edit. Not met.
25. A text `followup:`: the base offers Add Follow-up (no notes are read); the server refuses the write; the answer is said through `answerWords`.
26. `showActions` gives `files:` and `workbench:` per path, in the strip. Partly met.
27. Quick add names no hub; the lead's Applied is a Menu of hubs. Partly met.
28. and 29. Not met.
30. Only ProjectCard has a ContextMenu and a "..." opener.
31. Not met.
32. Met trivially: no Add run exists.
33. The subtask and follow-up forms open independently; a late answer is still said. Not met.

No case conflicts with the brief's rules, so the first run held no stop.

## The cases after the change (by reading; the look on landing is each one's proof)

1. `ProjectCard.svelte` hands `dated` with `target`, `deadline.held/type: 'date'/write: writeManifest(id, { deadline })`; `record-menu.ts` orders Add as Follow-up, Subtask, Deadline; the form's heading comes from `DatedForm.svelte` ("New deadline" for an empty `held`, else "Change deadline"). Look: Projects board, a project with and one without `deadline:`.
2. `EntryCard.svelte`: the status is a Chip in `meta`; `statusAction(choices)` puts the schema's options in the Status submenu, the one in force `checked`; a pick runs `setStatus` (`writeEntry(collection, id, { status })`). Look: Funding, right-click a card.
3. A file with no schema: `entryActions` puts the lifecycle statuses in the Status submenu; `entryDated` returns undefined for `schema === undefined`, so no Add run. Look: a collection whose file has no `schema:`.
4. `entryDated` gives `target` always and `deadline` only where the schema has a `deadline` field. Look: Tasks (three rows), People (two).
5. `EntryFields.svelte` and `VenueCard.svelte` draw a deadline as a Tag with `project.card.deadline_glyph`; the venue's Add run Deadline writes through `writeEntry`. Look: Venues, a venue with a deadline.
6. `LeadCard.svelte`: strip `['applied', 'page']`; Status submenu holds Applied (a submenu `applied:<hub>` with more than one hub), Decline, Reopen; Delete asks through Confirm. Look: Position Leads.
7. `RadarCard.svelte`: `projects={links}` is the foot strip; strip `[dismissed ? 'restore' : 'dismiss', 'page']`; Idea and Save to Literature in the run with no heading; projects the strip groups under none are `project:<id>` rows of the Open run. Look: Lit Watch.
8. `PostCard.svelte`: strip `['posted', 'edit']`, no footer. Look: LinkedIn, an idea.
9. `InboxCard.svelte`: strip `['draft', triaged ? 'restore' : 'triaged', 'archive']`, the draft editor in `blocks`, `dated={{ pick: thread.subject, projects }}` opens `RecordPick.svelte` with "What" holding the subject. Look: Inbox, a thread.
10. `LiteratureCard.svelte`: the PDF link, Copy BibTeX, Add to Lit Watch and Save to Literature on the meta row; Abstract stays in `blocks`. Look: Literature search with results.
11. `LineCard.svelte` and `DomainCard.svelte` hand `projects`; `ArchivalCard.svelte` hands `groups={strip}` built by `stageGroup`; `OrphansCard.svelte` hands `projects`; none hands actions, so none draws "...". Look: Pillars.
12. `NoFundingCard.svelte` hands `projects={unfunded}`. Look: Funding, No funding pressed.
13. and 14. `DatedForm.svelte`: a rule, the heading, `Field` labels "What" and "Not before" or "Deadline"; Save disabled while the text is empty. Look: a project card, Add > Follow-up, then Subtask.
15. to 17. `RecordPick.svelte`: kinds Project then each collection with a schema (a deadline only those with a `deadline` field); a subtask with its deadline, a follow-up with `after`. Look: Focus, Quick add.
18. `RecordCard.svelte`: every Add row `disabled: blocked !== ''` with the blocked words as its title; Save of `DatedForm` disabled with `blocked`; Status rows disabled while blocked on the entry, lead and radar cards. Look: a collection file with unsaved text in a source tab.
19. `Entry.svelte` draws `EntryCard`, which holds no InPlace. Look: an entry page.
20. `Gallery.svelte` draws a RecordCard sample with strip `['page', 'edit']`, a menu with an Add run (disabled with `gallery.record_blocked`) and a foot of sample projects. Look: Gallery.
21. The styling check: `allow-styling.ts` has no EntryCard, ProjectCard or VenueCard row; the CrossLinks rows cite its lines 160 and 166. Green in the run below; `wc -l` below.
22. `grep -l RecordCard` over the 14 files lists 14; `grep -ln "ContextMenu\|<Menu"` over them lists none (command and output in the table).
23. The table below.
24. `feedDated(client, 'leads', ...)` gives `deadline.type: 'text'` for the leads' `type: text` field, written through `writeFeedField`; an emptied box writes null. Look: Position Leads, a lead with a deadline.
25. Follow-up is offered on an entry whose `followup:` is text; the server refuses and `answerWords` says it on the outcome line. Look: Funding entry with a text `followup:`.
26. `showActions` gives one `files:<path>` row (row words `collection.show_path_in_files`) per hub path and one `workbench:<path>` row per folder, placed in the Open run by their id prefix. Look: an entry with `link` and `folder`.
27. `RecordPick.svelte` names the hub after each record (`focus.qa_named`) while more than one hub is served; the lead's strip Applied is the `applied` action with `items`, which CardActions draws as a menu. Look: two hubs.
28. Two records with the same words carry their primary key (`focus.qa_named`); a kind with no record gives an empty dropdown and Save disabled with `focus.qa_no_record`. Look: Quick add over such collections.
29. On the project page `details` hands the dated lines to `CardDetails`' right column; the deadline form writes `deadline: null` for an emptied box. Look: a project page.
30. `RecordCard.svelte` wraps the card in `ContextMenu own` whenever the card has an action, and draws the "..." `Menu` after the strip. Look: Tab and Shift+F10 on a card.
31. `RecordPick.svelte` hands `text=''` for a thread with no subject; Save stays disabled until text is typed (`DatedForm`). Look: such a thread.
32. `feedDated` returns undefined when the feed's file has no schema. Look: a scout file with no schema.
33. `RecordCard.svelte` holds one `adding` kind; a second pick replaces it; `DatedForm` drops an answer that arrives after it is unmounted or `record` changed. Look: open Follow-up then pick Subtask.

## DONE / NOT DONE

| Item | State | Command |
|---|---|---|
| test:quick | DONE | `npm run test:quick -- --base 1da23d50b` |
| unused exports | DONE | `sh utils/unused-exports.sh`, diffed with the base file |
| grep 3 | DONE | the brief's grep, prints nothing |
| sizes | DONE | `wc -l`, largest component 437 |
| case 22 | DONE | `grep -l` / `grep -ln` over the 14 files |
| ASCII, history words | DONE | `perl` gate and `grep` over added lines |
| HELP.md | DONE | read, lines 281-302 and 330 |

`npm run test:quick -- --base 1da23d50b` ran three times; the two earlier runs were each followed by a change (two exported types made local after the unused-exports comparison, the two new HELP bullets split into sub-bullets), and the run quoted here is the one after the last change, run after `npm run format` (exit 0) and `npm run diagrams` (exit 0):

```
test:quick: 57 changed file(s), from git since 1da23d50b
test:quick: 7 test file(s)
        tests/server/machine/runs/recover/sources.test.ts: named for a changed file
        tests/checks/tree/boundaries.test.ts: imports at depth 1
        tests/state/shared/hubs.test.ts: imports at depth 1
        tests/state/client/created-ids.test.ts: imports at depth 2
        tests/state/client/held-unsaved.test.ts: imports at depth 2
        tests/state/forms/new-entry.test.ts: imports at depth 2
        tests/views/shared/forms/entry-add.test.ts: imports at depth 2
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      ASCII gate (1.3 s)
ok      svelte-kit sync (8.6 s)
ok      vitest (17.0 s): Duration  7.97s (transform 22.36s, setup 0ms, import 26.68s, tests 182ms, environment 1ms)
ok      vitest checks (18.6 s): Duration  9.58s (transform 941ms, setup 0ms, import 3.74s, tests 5.00s, environment 0ms)
ok      eslint (25.9 s)
ok      svelte-check (29.2 s): 1793041658657 COMPLETED 546 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 38.4 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
exit 0
```

The quick tier picks 7 test files, so the tree checks (styling, size, folder items, duplication, comment width, history) ran only as `tests/checks/tree/boundaries.test.ts`. After the last change I ran the wider set: `npx vitest run tests/checks/tree tests/checks/imports tests/checks/source tests/checks/config tests/views tests/state/boards --testTimeout=120000` gives "Test Files 2 failed | 35 passed (37)", "Tests 3 failed | 438 passed | 9 skipped (450)". The three failures name only files this step leaves unchanged (`git diff --quiet 1da23d50b -- <file>` exits 0 for each), so they are red on the base too:

- `comment-width.test.ts`: 13 lines in `hub-names.ts`, `model-collections.ts` (2), `collections.ts`, `vocab.ts`, `career.ts`, `focus.ts`, `focus/filter.ts`, `LaneCard.svelte`, `Projects.svelte`, `GroupHead.svelte`, `Venues.svelte`, `options-schema.test.ts`.
- `duplication.test.ts` (src/lib): "src/lib/views/shared/card/heads/FoldHead.svelte:46 and src/lib/views/shared/card/heads/GroupHead.svelte:39 hold the same 9 lines (e6d44435b958)".
- `duplication.test.ts` (tests): "tests/data/sources/config/layers/language.test.ts:160 and tests/server/root/process/config-cache.test.ts:269 hold the same 9 lines (e246b55c4e52)".

`history.test.ts` and `catalog-file-keys.test.ts` pass with `--testTimeout=120000` ("Tests 7 passed (7)"); with the default 5000 ms they time out on this machine while other agents run.

Unused exports: `sh utils/unused-exports.sh` then `diff .agents/worktrees/O89-base/unused-exports.txt <output>` prints nothing (exit 0). The step adds no line.

Grep 3: `grep -rn "forms/InPlace\|InPlace.svelte\|card-menu\|record-card.svelte\|createRecordCard" src tests docs config --exclude=local.yml` prints nothing (exit 1).

Case 22: `grep -l RecordCard <the 14 files> | wc -l` prints 14; `grep -ln "ContextMenu\|<Menu" <the 14 files>` prints nothing.

ASCII gate over every changed and added file: `perl -ne 'print ... if /[^\x00-\x7F]/'` prints nothing. History words (`before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands`) over the added lines: the hits left are "the question before a delete", "the part before a colon", the label "Not before" and the HELP sentence "the date before which", each describing behaviour, none naming a past state.

## Files with line counts (`wc -l`)

Added: `views/shared/card/record/RecordCard.svelte` 342, `record/record-menu.ts` 185, `record/CardActions.svelte` 218 (moved), `views/shared/forms/dated/DatedForm.svelte` 150, `forms/dated/RecordPick.svelte` 211, `forms/registry/registry-card.svelte.ts` 106 (moved from `record-card.svelte.ts`), `card/feed/literature-save.svelte.ts` 133.

Changed: `state/boards/structure/cross-links.ts` 212, `state/shared/page/hubs.ts` 75, `ui/frame/Card.svelte` 288, `boards/collection/NoFundingCard.svelte` 55, `boards/focus/QuickAdd.svelte` 92, `feeds/inbox/Inbox.svelte` 297, `feeds/inbox/InboxCard.svelte` 374, `feeds/linkedin/PostCard.svelte` 130, `feeds/literature/LiteratureCard.svelte` 279, `shared/card/card.ts` 231, `card/feed/LeadCard.svelte` 400, `card/feed/RadarCard.svelte` 386, `card/feed/SaveToLiterature.svelte` 128, `card/feed/literature-card.ts` 61, `card/project/CardLinks.svelte` 267, `card/project/ProjectCard.svelte` 437, `forms/dated/Followups.svelte` 241, `LineForm.svelte` 62, `ListHead.svelte` 100, `Subtasks.svelte` 317, `forms/entry/card/EntryCard.svelte` 326, `EntryFields.svelte` 251, `forms/entry/entry-actions.ts` 286, `forms/entry/task-card.ts` 41, `shared/links/CrossLinks.svelte` 177, `sources/data/DatasetCard.svelte` 235, `sources/venues/VenueCard.svelte` 298, `structure/domains/DomainCard.svelte` 101, `structure/pillars/ArchivalCard.svelte` 77, `LineCard.svelte` 190, `OrphansCard.svelte` 54, `system/gallery/Gallery.svelte` 425, `tests/checks/tree/allow-styling.ts` 55, `config/defaults/sources.yml` 119, `config/text/views/boards/collection.yml` 79, `focus.yml` 164, `project.yml` 189, `config/text/views/system/gallery.yml` 44, `docs/HELP.md` 584, and `docs/diagrams/*` as `npm run diagrams` wrote them.

Deleted: `views/shared/card/CardActions.svelte` (moved), `card/project/card-menu.ts`, `forms/InPlace.svelte`, `forms/registry/RegistryCard.svelte`, `forms/registry/record-card.svelte.ts` (moved).

Folder items: `views/shared/card` 10, `card/record` 3, `card/feed` 7, `forms/dated` 6 (`ls | wc -l`).

## Judgment calls

- `RegistryCard.svelte` is deleted. Case 22 needs the domain and pillar line cards to draw `RecordCard.svelte` themselves, so its logic moved into `registry-card.svelte.ts` (`createRegistryCard`), which each of the four registry cards calls.
- The record card owns the foot strip and the question before a delete. `RecordCard.svelte` takes `projects` (grouped with `groupProjects`, as every strip groups) or `groups` (a kind that groups its own: project, entry, Archival), draws `CrossLinks` when a group exists, then the kind's `foot`; and takes `deleting: { collection, id, onclose }`, drawing `DeleteAsk` under the card. `CrossLinks.svelte` now takes `groups` only, since its one caller hands groups. Without this, the four registry cards repeated 9 to 14 lines of the same markup (the duplication check named three pairs).
- Registry and entry cards list their subtasks and follow-ups on the card; the lead and Lit Watch cards draw only the add forms (`feedDated`), as the project card does on a board; their pages list the lines.
- The lead and Lit Watch Add target is `{ id: feedEntryId(entry), collection: registryKey(kind, root) }`; the schema is the feed file's schema of the entry's hub.
- Entry statuses carry `checked`; the feed transitions (Applied, Decline, Reopen, Dismiss, Restore, Mark posted, Triaged, Restore) are actions, not states, and carry none.
- The Lit Watch Status rows are disabled while the radar file is blocked (on the base only Delete was).
- A Lit Watch paper's projects that the strip drops (a stage in no group) become `project:<id>` rows of the Open run, so none is lost. The project card's related projects the strip leaves out stay on its Related line.
- The posting, the paper, the PDF, the provider page and the dataset Source are Open-run rows; the body links of the dataset, the lead and the paper are kept.
- Quick add's kind words come from `REGISTRY_VIEWS`, re-exported through `state/shared/page/hubs.ts`.
- `PROJECT = ':project'` as the Project kind id cannot meet a collection key, since a key holds no colon.
- The deadline form's Save is disabled while the box holds the record's deadline.
- The Gallery sample's actions do nothing and its Add run is disabled with `gallery.record_blocked`.
- `DatedKind` lives in `record-menu.ts` beside `RecordDated`, so `RecordCard`, `DatedForm`, `RecordPick` and `QuickAdd` share one type; a type exported from a Svelte module script reaches eslint as an error type.
- The two new HELP bullets are split into sub-bullets, following the standards' "short bullets"; the existing single-view bullets they sit beside are left in their own form.

## Visible changes per kind (view, then the state the look puts it in)

- **Pillars, line card.** Before: head and menu of `RegistryCard`, Edit in File and Delete in its row, the strip at the foot. After: the record card head, strip Page, "..." and right-click menu with Page, the Add run, Edit in File and Delete; the strip at the foot as before. State: any line.
- **Pillars, Archival.** Before: stage Chips, one open at a time, each listing its projects as buttons. After: the foot strip with one group per stage, headed by the stage's words and glyph with its count, opening to its projects; no "...". State: a hub with dead-stage projects.
- **Pillars, Orphans.** Before and after: the strip at its foot; now drawn by the record card. State: a project with no pillar.
- **Domains.** Before: as the line card. After: as the line card. State: any domain.
- **Projects, project card.** Before: Add run Subtask, Follow-up; related projects on the Related line. After: Add run Follow-up, Subtask, Deadline; the related projects in the foot strip, the Related line holding only those the strip does not draw. State: a project with `related:`.
- **Project page.** After: Deadline opens its form in the right column with Subtasks and Follow-ups. State: a project page.
- **Collections, entry card.** Before: InPlace status, deadline and date; Add Subtask and Add Follow-up while none exist; status buttons for a file with no schema; a Named by line. After: status Chip; deadline Tag; date as words; the Status submenu; the Add run always; strip Workbench and Page; the related projects in the foot strip. State: Funding, Tasks, a file with no schema.
- **Venues.** Before: InPlace deadline, Show in Files and the venue's own rows, a users line. After: deadline Tag, strip Page, Show in Files as an Open row, the Add run with Deadline, users in the foot strip, the concentration ring from `Card`'s `ring`. State: a venue with a deadline and users.
- **Data.** Before: Recover, Edit in File and Delete in the registry row. After: strip Page, Source in the Open run, Recover in the run with no heading. State: a downloadable set.
- **Position Leads.** Before: Applied, Decline, Reopen and del on the meta row. After: strip Applied and Page; the Status submenu; Delete (asks) last; the Add run with Deadline in a text box. State: an open lead.
- **Lit Watch.** Before: project buttons, Restore or Idea and Dismiss, Delete and Save to Literature on the card. After: strip Dismiss or Restore and Page; projects in the foot strip; the Status submenu; Idea, Save to Literature, Delete in the menu; the Add run. State: a paper naming projects.
- **LinkedIn.** Before: Mark posted and Edit in a footer. After: both in the strip and the menu. State: an idea post.
- **Inbox.** Before: Draft, Open at provider, Archive, Triaged or Restore on the meta row. After: strip Draft reply, Triaged or Restore, Archive; the provider in the Open run; Add Follow-up and Subtask opening the kind and record dropdowns. State: a thread with a subject.
- **Literature search.** Before: Abstract, PDF, Copy BibTeX, Add to Lit Watch, Save to Literature in a body row. After: the four on the meta row, always visible, and in the menu; Abstract in the body. State: results with a PDF.
- **Focus, Quick add.** Before: + follow-up and + deadline with one project dropdown. After: + follow-up, + subtask, + deadline with Kind and Record dropdowns and the labelled form. State: Focus.
- **Gallery.** After: a record card sample. State: Gallery.

## Anything in the brief that was wrong or impossible

- The brief's path list keeps `views/shared/forms/registry/RegistryCard.svelte` as a file the step writes, while case 22 needs `DomainCard.svelte` and `LineCard.svelte` to draw `RecordCard.svelte` themselves; the file is deleted (judgment calls).
- The tree checks `comment-width.test.ts` and `duplication.test.ts` fail on the base, in files outside this step's paths (DONE table). They are a different concern from this step and are left for the orchestrator.
- `allow-styling.ts` cites `CardDocs.svelte:162` for a rule that sits at line 199 (`grep -n ":global" src/lib/views/shared/card/CardDocs.svelte`), on the base too; outside this step.

## Case 23: every base control and where it is now

| Kind | Base control | Now |
|---|---|---|
| project | Ask, Workbench, Open page | strip and menu |
| project | Folder, Show in Files, Presentation | Open run |
| project | Add Subtask, Add Follow-up | Add run, with Deadline |
| project | Edit Manifest, Pin, Copy Context, Deposit, Clone or Cloned in | run with no heading |
| entry | status InPlace | Status submenu, Chip in meta |
| entry | deadline and date InPlace | Add run Deadline; Tag and words |
| entry | `status:<word>` buttons | Status submenu |
| entry | Pin, Edit in File, Delete | run with no heading |
| entry | Add Subtask, Add Follow-up | Add run |
| entry | Show in Files, Workbench per path | Open run; own Workbench in strip |
| entry | `extra` (Start Agent) | run with no heading |
| venue | deadline InPlace | Tag; Add run Deadline |
| venue | Show in Files | Open run |
| venue | site, call, contact, JIF links | meta row, unchanged |
| venue | Edit in File, Delete | run with no heading |
| dataset | Recover | run with no heading |
| dataset | source link | body link and Open run |
| dataset | Edit in File, Delete | run with no heading |
| domain, line | Edit in File, Delete | run with no heading |
| lead | Applied (Menu of hubs) | strip and Status submenu |
| lead | Decline, Reopen | Status submenu |
| lead | del (Confirm) | Delete, asks first |
| lead | posting link | body link and Open run |
| Lit Watch | Restore, Dismiss | strip and Status submenu |
| Lit Watch | Idea | run with no heading |
| Lit Watch | Delete (DeleteAsk) | run with no heading, asks |
| Lit Watch | project buttons | foot strip; `project:<id>` rows |
| Lit Watch | Save to Literature | run with no heading |
| Lit Watch | paper link | body link and Open run |
| LinkedIn | Mark posted, Edit | strip and menu |
| inbox | Draft | strip and menu |
| inbox | Open at provider | Open run |
| inbox | Archive (Confirm) | strip and menu, asks |
| inbox | Triaged, Restore | strip and Status submenu |
| inbox | Save draft, Send | draft editor in body |
| hit | PDF, Copy BibTeX, Add to Lit Watch, Save | meta row and menu |
| hit | Abstract | body |
| Archival | stage Chips and project buttons | foot strip groups |
| Orphans | strip | foot strip |
| No funding | project buttons | foot strip |

## Head comments, doc comments and docs touched

Rewritten: the head comments of `cross-links.ts`, `Card.svelte`, `NoFundingCard.svelte`, `QuickAdd.svelte`, `InboxCard.svelte`, `PostCard.svelte`, `LiteratureCard.svelte`, `card.ts`, `LeadCard.svelte`, `RadarCard.svelte`, `SaveToLiterature.svelte`, `CardLinks.svelte`, `ProjectCard.svelte`, `Followups.svelte`, `LineForm.svelte`, `ListHead.svelte`, `Subtasks.svelte`, `EntryCard.svelte`, `EntryFields.svelte`, `entry-actions.ts`, `CrossLinks.svelte`, `DatasetCard.svelte`, `VenueCard.svelte`, `DomainCard.svelte`, `ArchivalCard.svelte`, `LineCard.svelte`, `OrphansCard.svelte`, `Gallery.svelte`, `CardActions.svelte`; new head comments on `RecordCard.svelte`, `record-menu.ts`, `DatedForm.svelte`, `RecordPick.svelte`, `registry-card.svelte.ts`, `literature-save.svelte.ts`. Still true: `Inbox.svelte`, `hubs.ts`, `literature-card.ts`, `task-card.ts`, `allow-styling.ts`. Docs rewritten: `docs/HELP.md` lines 281 (fields), 283-288 (the Add run), 294 (Quick add, in the Focus bullet), 296 (project card), 297-302 (record card), 330 (Position Leads); `config/defaults/sources.yml:34` ("an entry's card menu also sets its status and its deadline and adds a subtask or a follow-up to it"). `grep -rn "InPlace\|card-menu\|RegistryCard\|record-card\|collection\.related\|qa_save\|qa_cancel" docs README.md` finds none.

## Edits to existing assertions and allow lists

`tests/checks/tree/allow-styling.ts`, `HELD`:

- Removed the five `views/shared/forms/entry/card/EntryCard.svelte` rows (`.slot > :global(.card > .bar)`, `.slot > :global(.card .title)` twice, `.slot > :global(.card)`, `.slot > :global(.card > .bar)` for `.card`), the five matching `views/shared/card/project/ProjectCard.svelte` rows, and the `views/sources/venues/VenueCard.svelte ... .slot.concentrated :global(.card)` row: those rules are gone, the frame asked of `Card.svelte` through `fill` and `ring`.
- The three CrossLinks rows keep their `line`; their `why` changes from `CrossLinks.svelte:148` to `:166` (`.member :global(.label)`) and from `:142` to `:160` (`.member :global(.tip), .member :global(.tool)`), the lines `grep -n ":global"` prints now.

No test assertion was changed.

## Ids and keys added

Catalog keys (each read by `t('<key>')` in src at least once, counted with `grep -rn "'<key>'" src`; each full dotted path defined once): `focus.add_subtask`, `focus.qa_kind`, `focus.qa_named`, `focus.qa_no_record`, `focus.qa_record`; `project.action.change_deadline`, `deadline`, `deadline_tip`, `new_deadline`, `new_followup`, `new_subtask`, `not_before`, `what`; `project.card.open_record_page`, `open_record_page_tip`; `project.menu.deadline`, `record_label`, `record_page`, `set_status`, `status`, `status_glyph`; `collection.open_path_workbench`, `collection.show_path_in_files`; `gallery.card_record`, `gallery.record_blocked`. None is empty. Same leaf names under other parents (`project.action.add_subtask` beside `focus.add_subtask`, `project.action.set_status` beside `project.menu.set_status`) are distinct paths. Removed with no reader left: `focus.qa_cancel`, `focus.qa_save`, `collection.related` (`grep` of each in src and tests finds 0).

Action ids, unique within each card's list: `page`, `followup`, `subtask`, `deadline`, `status`, `applied`, `applied:<hub>`, `decline`, `reopen`, `posting`, `paper`, `project:<id>`, `dismiss`, `restore`, `idea`, `save`, `pdf`, `bibtex`, `litwatch` (one of two branches), `posted`, `edit`, `provider`, `triaged`, `draft`, `archive`, `source`, `recover`, `files:<path>`, `workbench:<path>`, `delete`. A path or hub suffix keeps the per-path rows apart. The Quick add kind id `:project` cannot equal a collection key.

## Files written beyond the brief's paths

- `views/shared/card/project/CardLinks.svelte`: the Related line takes the related projects the foot strip leaves out (brief decision 6).
- `views/feeds/inbox/Inbox.svelte` (a caller the brief names): hands `projects` (the live projects) to `InboxCard` for the thread's Add run.
- `views/shared/card/feed/SaveToLiterature.svelte` and the new `literature-save.svelte.ts`: Save to Literature is both a control on the search card's meta row and a menu row on both cards, from one shared state.
- `state/shared/page/hubs.ts`: re-exports `REGISTRY_VIEWS` for Quick add's kind words, so a view does not import `state/workbench` internals.
- `config/defaults/sources.yml:34`: its sentence said an entry's status, deadline and date change on its card, which this step makes false.
