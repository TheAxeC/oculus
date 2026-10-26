# Step O89 brief check (on main at cf86cc3d0)

This is the brief-check agent's report on `agents/briefs/O89.md`. All reads were made on `~/workspace/oculus` main at cf86cc3d0 (`git log --oneline -3` shows `cf86cc3d0 Stop O88 at its brief check on open item 461` at the head). The hub, `config/local.yml` and every `.oculus/local.yml` were not read. `plan.md` has no section headed Goal; its head paragraph says it is the execution ledger for `tools/oculus/DESIGN.md`. The goal used below is O89's line: one record card for every kind ruling 456 names, and one way to add a dated line.

## 1. Names

- `card-menu`: `grep -rn "card-menu" src tests docs config utils README.md --exclude=local.yml` gives only `ProjectCard.svelte:19,51,155`. That file is in the paths, so no hit is outside them.
- `CardActions`: `grep -rn "CardActions" src tests docs config utils README.md --exclude=local.yml`. Outside the named paths:
  - `src/lib/views/shared/card/feed/literature-card.ts:13: import type { CardAction } from '../CardActions.svelte';`
  - `src/lib/views/shared/forms/entry/task-card.ts:13: import type { CardAction } from '../../card/CardActions.svelte';`
  - Both break when the file moves. The brief's catch-all line "every importer of `CardActions.svelte` and `card-menu.ts`, each named in the report" covers them, but neither is named. Every other importer (ProjectCard, RegistryCard, EntryCard, VenueCard, DatasetCard) is in the paths, and so is `card.ts:24`, a comment.
- `menuRuns`, `pickAction`, `stripActions`, `ProjectAction`: the same grep finds hits only in `card-menu.ts` and `ProjectCard.svelte`, both in the paths.
- `entryActions`: hits only in `entry-actions.ts:102` and `EntryCard.svelte:39,199`, both in the paths. `showActions` also hits in `ui/tree/*`, `views/shared/explorer/*` and debug views, but those are a different prop of the same name and the change does not make them false.
- `InPlace`: `grep -rn "InPlace" src tests docs config utils README.md --exclude=local.yml`. Hits outside the paths are unrelated names, and the change does not make them false:
  - `src/lib/state/sources/explorer/ops.svelte.ts:368,376,380,384` (`writeInPlace`)
  - `src/lib/data/sources/config/merge/in-place.ts:38-307` (type `InPlace`, `layInPlace`, `mapInPlaceOverride` and others)
  - `src/lib/data/sources/config/merge/workspace-layer.ts:35,102`, `hub-layer.ts:29,32,55,68,207,239`, `data/sources/config/catalog/schemas/engine.ts:33,140`
  - `docs/diagrams/writes.dot:764,1351`, `docs/diagrams/writes.svg:2883,4629`
  - These hits make the brief's verify item 3 impossible to pass (section 4).
- `LineForm`: outside the paths, `isLineForm` in `state/sources/explorer/view/forms.ts:15`, `files-view.ts:13,227` and `views/sources/files/Files.svelte:92,265`. It is an unrelated name and is not made false.
- `ListHead`, `formOnly`, `CrossGroup`: hits only in the paths (`dated/*`, `ProjectCard.svelte`, `cross-links.ts`, `CrossLinks.svelte`).
- `QuickAdd`: `Focus.svelte:28` (head comment), `:56` and `:279`. The paths list only line 279 of `Focus.svelte`. The comment at :28 stays true if the file keeps its name.
- `RecordCard` / record card (the new name): `grep -rn -i "record card\|RecordCard\|record-card\|record-menu" src tests docs config utils README.md --exclude=local.yml`.
  - `src/lib/views/shared/forms/registry/record-card.svelte.ts:29: export type RecordCard = {`, plus `createRecordCard`, `RecordCardProps` and `RecordCardTarget`. These are imported by `DatasetCard.svelte:21-23`, `DomainCard.svelte:6`, `LineCard.svelte:12` and `RegistryCard.svelte:14`.
  - `src/lib/state/system/config/editors/draft.ts:108: /** The fields of a record card: ...` uses "record card" for a card in the Settings editors.
  - `entry-actions.ts:62: /** What the Edit in File control of a record card is made from. */`.
  - The new component `RecordCard.svelte` shares its name with the existing type `RecordCard`. DatasetCard, DomainCard and LineCard will import from both modules, and "record card" would then name two different things.
- Words: `collection.related` ("Named by", `config/text/views/boards/collection.yml:40`). Its only readers are `EntryFields.svelte:220` and `VenueCard.svelte:261` (`grep -rn "'collection.related'" src` prints 2 lines). Both lose the line, so the key becomes an orphan, and `collection.yml` is not in the paths.
- Docs: `docs/HELP.md:318` ("When more than one hub holds Applications, `applied` is a menu of those hubs") lies outside "docs/HELP.md lines 270-300". After the step, Applied is a strip control and a Status submenu, so the sentence's "a menu" goes stale.

Findings:
- `RecordCard.svelte` collides with the exported type `RecordCard` of `views/shared/forms/registry/record-card.svelte.ts:29` and with its `createRecordCard` and `RecordCardProps`. The brief neither renames the registry helper nor picks another name.
- `collection.related` is left without a reader, and `config/text/views/boards/collection.yml` is not in the paths.
- `docs/HELP.md:318` is outside the HELP range the paths allow, and its "`applied` is a menu" changes.
- `literature-card.ts` and `task-card.ts` fall only under the catch-all line and are not named.

## 2. The step line

- "every card that is a record or a list of projects (project, entry, venue, dataset, domain, pillar line, lead, Lit Watch paper, LinkedIn post, inbox thread, Literature search hit, Archival, Orphans and No funding)": item 1, first paragraph.
- "has the project card's head and its '...' and right-click menu": item 1, The head and The menu.
- "each kind adding its own actions": item 2 (the kind's own openers and actions) and item 3 (the strip of each kind, none lost).
- "the menu's Add group holds Follow-up, Subtask and Deadline": item 2, Add.
- "Deadline on a project and on an entry whose collection has a deadline field": item 2, Add.
- "the add form has a line above it, a heading ('New follow-up', 'New subtask') and visible labels 'What', 'Not before' or 'Deadline'": item 4. The brief writes "a rule above it".
- "an entry's fields are edited on its page or through the menu, not in the list": item 3, first bullet.
- "Quick add on Focus picks the kind of record and then the record in two dropdowns and opens that same form for a follow-up with its date, a subtask with its deadline, or a deadline": item 5.
- Ruling 450 (a): item 5. Ruling 451 (a): item 2, Add. Ruling 452 (a): item 3, first bullet. Ruling 453 (a): item 4. Ruling 454 (a): items 1 and 3.
- Ruling 455 (a) is scheduling (O88 and O89 built side by side, 446 into O87). No requirement is needed.
- Ruling 456 (a2):
  - The kinds: item 1.
  - "the kinds with no hub record take the same head, body order and menu holding only the actions they have": item 1, The menu ("A kind with no action has no opener").
  - "the thread's menu with the Add group": item 2 and decision 2.
  - "the hit keeping its four actions on its meta row": item 3.
  - "the project strip ... is the foot of every kind that lists projects, Archival's stage chips and No funding's buttons drawn as it": item 1, The foot.
  - "Gallery shows the record card among its samples": item 3, last bullet.
  - "the Focus lane card and band items, the Slides tiles and the Usage cards stay outside": no requirement. The paths do leave those files out.
  - "the look at O89's landing opens Pillars first": the Report part ("Pillars first").

Findings:
- Ruling 456's exclusions (Focus lane card and band items, Slides tiles, Usage cards) have no sentence in "What to build". The paths keep them out, so this is a missing statement, not missing work.
- Ruling 456 says the hit keeps its four actions on its meta row. On the tree they sit in a row of the body (`LiteratureCard.svelte:135-167`, `<div class="row">` after the meta snippet closes at :114-134). Item 3 ("staying visible on its meta row") and case 10 ("stay visible on its meta row") describe a move as if it were no change.
- Decision 6 keeps the project card's related projects as a labelled line in the body, while the entry's related projects go to the foot. Ruling 456 makes the strip "the foot of every kind that lists projects", and ruling 454 asks for "the same ... body order for every kind". The brief flags decision 6 as reversible, but it departs from the letter of both rulings and is not raised as an open item.

## 3. Premises

- ProjectCard 505 lines, card-menu 69: `wc -l` prints 505 and 69. Matches.
- ProjectCard structure: `grep -n` shows ContextMenu `own` at :368-372, RootChip :384, stage Chip, domain Tag, `due` Tag :396-401, stale :403-417, `CardActions actions={stripActions(actions)}` :418, Menu `compact` `placement="down"` `align="right"` :420-428, then CardFacts :434, CommandBar :437, CardLinks :439, CardSessions :440, CardBrief :441, CardAddresses :442, CardDetails/Subtasks/Followups :443-455 with `formOnly={!page}` :353,:364. Matches.
- card-menu RUNS and ICONS: `cat card-menu.ts` shows `open` [page, folder, files, workbench, present], `add` [subtask, followup], `rest` [ask, edit, pin, copy, deposit, clone, cloned], and ICONS [ask, workbench, page]. Matches.
- EntryCard 356 lines, InPlace at :284, CardActions from entryActions: `wc -l` prints 356, and `grep -n` shows `InPlace field="status"` at :284 and `CardActions {actions}` at :289. Matches.
- entry-actions.ts "220 lines": `wc -l` prints 205. Differs.
- EntryFields 291 lines, InPlace at :208, "CrossLinks {groups}, line 216" under the label "Related": `wc -l` prints 291 and InPlace is at :208. But `grep -n` shows `<span class="label">{t('collection.related')}</span>` at :220 and `<CrossLinks {groups} />` at :221, and the key reads "Named by" (`collection.yml:40`). The line number and the label words differ.
- `VenueCard.svelte:277` InPlace: `grep -n` prints `277: <InPlace field="deadline" ...`. Matches.
- No other InPlace user: `grep -rn InPlace src` shows that the only importers of `views/shared/forms/InPlace.svelte` are EntryCard, EntryFields and VenueCard. Matches (the other hits are unrelated names).
- The kinds' line counts (339, 224, 70, 155, 358, 325, 117, 342, 221, 120, 47, 70): `wc -l` prints the same numbers. Matches.
- The kinds' controls, from `grep -n` over each file:
  - LeadCard: Menu for Applied :187, Applied/Decline/Reopen/delete ToolButtons :201-242.
  - RadarCard: Restore, Idea, Dismiss, Delete :147-175; projects as ToolButtons :208-210; SaveToLiterature :235; NewIdeaForm :243.
  - PostCard: footer :75-85.
  - InboxCard: meta row :173-215.
  - LiteratureCard: body row :135-167.
  - ArchivalCard: Chips with `shown` and ToolButtons.
  - OrphansCard: `CrossLinks {projects}` :37.
  - NoFundingCard: ToolButtons.
  - RegistryCard: CardActions :84, `CrossLinks {projects}` :88.
  - All match.
- Callers: importers of each card, grepped one by one, give Projects, Project, Collection, Entry, Leads, Bucket, Radar, Venues, Data, Domains, Pillars, Linkedin, Inbox and Literature. Matches.
- CrossLinks and CrossGroup: `cross-links.ts:22-27` has `type: 'in-flight' | 'ideas' | 'done'`. The glyph keys are `project.helper.xlink_*_glyph` (`project.yml:145-151`). Matches.
- ListHead 92 lines, LineForm 62, labels as accessible names only: `wc -l` prints 92 and 62. `TextInput.svelte:98` and `DateInput.svelte:56` put `label` on `aria-label`, and `Field.svelte:26` draws `<span class="name">{label}</span>`. Matches.
- Words at `project.yml:21-35`: `grep -n` gives `21: followup_after: not before`, `33: subtask_deadline: deadline`, `34: subtask_do: what to do`. Matches.
- Writes: `grep -n` in `writes.svelte.ts` gives writeManifest :267, writeEntry :313, addSubtask :342, addFollowup :376 (both take `target: SubtaskTarget`), and `subtaskHost` at `subtasks.ts:53`. Matches.
- Deadline collections in the main hub: not checked against the hub (forbidden).
  - `docs/templates.md` has `field: deadline` under venues :910, funding :1154, events :1198, joint-work :1240, education :1264, applications :1308, tasks :1341 and leads :1414. That is the same eight collections the brief lists.
  - The fixtures (`grep -rln "field: deadline" tests`) have tasks, events, funding and joint-work.
  - The leads template declares it `type: text` ("Deadline as posted."), which the brief does not say.
- `sources.yml:51-52` leads and radar: `sed -n 45,56p` shows `51: key: leads`, `52: key: radar`. Matches.
- QuickAdd 150 lines, keys at `focus.yml:4-5,135-138`, `Focus.svelte:279`: `wc -l` prints 150. `sed` shows add_deadline :4, add_followup :5, qa_cancel :135, qa_project :136, qa_save :137, quick_add :138. `Focus.svelte:279: <QuickAdd projects={live} ...`. Save calls `addFollowup({ id: project }, { do: value.trim() })` with no date (:72-73). Matches.
- menu-items `checked` and `items`: `grep -n` gives `34: checked?: boolean;` and `55: items?: MenuItem[];`. Matches.
- allow-styling HELD rows of the two cards at lines 24-77: `grep -n` shows EntryCard rows at :24-41 and ProjectCard rows at :60-77. Matches. The same file also holds VenueCard's row at :96-97 and CrossLinks rows at :44-53 (section 4 and the paths below).
- Folder counts: `ls | wc -l` prints `views/shared/card` 10, `views/shared` 10, `views/shared/forms` 10, `views/boards/focus` 10, `ui/frame` 10, `ui/menu` 10, `views/shared/card/project` 8, `dated` 4, `registry` 5. Matches. Also `views/shared/links` 10 and `ui/forms` 10.
- Size rule: `size.test.ts:29-30` has `LINES = 900`, `COMPONENT = 540`, as spec.md "What every package obeys" says. Matches.
- Gallery sample Cards at :193-219: `sed -n 190,222p` shows Cards `plain`, `tone` and `pinned` at :193-219. Matches.
- HELP.md lines 281, 282, 288, 290: `sed -n 270,300p` gives 281 "A card's status, deadline and date change on the card...", 282 the Subtasks/Follow-ups block, 288 Focus with "the quick add appends a note to the list of the project it names", 290 the project card's strip and menu. Matches.
- guarded.md names no card: `grep -c` gives 0 for ProjectCard, EntryCard, card-menu, CardActions, QuickAdd, LineForm, ListHead, InPlace, cross-links, CrossLinks, entry-actions and Gallery. The hits for "dated" (:72) and "writes.svelte" (:81) are other entries. Matches.
- bits-ui: `package.json:83: "bits-ui": "2.19.3"`. Matches.

Findings:
- `entry-actions.ts` is 205 lines, not 220.
- EntryFields' cross-links are at :221 (label :220), not :216, and their label reads "Named by" (`collection.related`), not "Related". Item 1, The foot ("which leave the 'Related' line of `EntryFields`") and decision 6 use the wrong word.
- The brief's list of collections with a `deadline` field omits that the leads schema declares it `type: text` (`docs/templates.md:1414`).
- Item 4's "Save is disabled ... while the file cannot be written, as now" is false for two forms:
  - The project card hands its Subtasks and Followups no `blocked` (`ProjectCard.svelte:346-365`). Its `blocked` const (:136, `isBlocked(item.project, words)`) is the project's BLOCKED status, not words about an unwritable file.
  - Quick add has no blocked check at all (`QuickAdd.svelte:69-80`).
  - The brief's "the card's `blocked` words" also has no source on the project card, and the name collides with that const.

## 4. Cases and checks

- Cases 1-17, 19 and 20 are each checked by reading, with the look as their proof. That is consistent with spec.md "Where you work" and "What every package obeys" (builder runs no page; DOM behaviour seen at the look), and with guarded.md's head ("Views have no entry").
- Case 11 names counts ("6 in flight", "5 done", "8 ideas") that only the hub's data gives. The builder reads neither the hub nor a page, so the first run cannot establish them. That is consistent only if the row names the look.
- Case 19 ("its editor still edits every field") checks `EntryEditor`, which the step does not change (not in the paths).
- Case 21 runs `npm run test:quick` as its check. The brief's line 111 makes "the first run of every case above on the unchanged tree" the builder's first task, which would run the list once before any change. spec.md "Token discipline" allows `npm run test:quick` once, after the last change, and says "a run of the list beyond what this paragraph allows is a finding of the review."
- Verify item 3, `grep -rn "InPlace\|card-menu" src tests docs config`, "prints nothing" cannot hold.
  - It hits the unrelated `InPlace` type and `layInPlace` in `src/lib/data/sources/config/merge/in-place.ts:38-307`, `writeInPlace` in `ops.svelte.ts:368-384`, and `docs/diagrams/writes.dot:764,1351` and `writes.svg:2883,4629`.
  - It also greps `config` without `--exclude=local.yml`.
  - A builder could rename unrelated code to make it pass.
- Verify item 4 and case 21's size clause: `Collection.svelte` is in the paths and already at 520 lines (`wc -l` prints 520). Any added line forces a split into a file the paths do not name.

Findings:
- Case 21 together with line 111 asks for a `test:quick` run on the unchanged tree, which breaks spec.md "Token discipline". The first run of case 21 should be a reading: the HELD rows present, `wc -l`.
- Verify item 3 cannot print nothing, as the hits above show, and its grep over `config` lacks `--exclude=local.yml`.
- Case 19 asks the builder to check `EntryEditor`, a place the step does not change.
- Case 11's counts come from the hub, which neither the builder's reading nor a fixture shows.

## 5. The question

The goal for this step is one record card for every kind ruling 456 names, and one way to add a dated line.

- Case 1: yes. It passes if ProjectCard gains a Deadline row and keeps its own head code. No case shows that the head is drawn by one component.
- Case 2: yes for the one-component goal (an EntryCard with its own copied menu passes). No for the entry's own behaviour.
- Case 3: no for its behaviour. It does not test one component.
- Case 4: yes. A Deadline row that opens nothing, or writes the wrong field, passes, since the case only lists the rows.
- Case 5: no. It checks the tag and the change.
- Case 6: yes in part. Applied in the strip with several hubs is unchecked, since the strip draws buttons (`CardActions`) and the menu of hubs is in the Status submenu.
- Cases 7, 8 and 10: no for their kinds.
- Case 9: yes in part. A thread with no subject, and the write to the picked record, are unchecked.
- Cases 11 and 12: no for the foot. Neither checks the menu of the line card.
- Case 13: no.
- Case 14: yes in part. It names the words, not the write with its deadline.
- Case 15: no.
- Case 16: yes. It checks the dropdown, not that Deadline writes `writeManifest` or `writeEntry`, and not that an emptied date clears.
- Case 17: no.
- Case 18: yes. It names no kind, so it passes on an entry card while the project card's and Quick add's forms stay writable (section 3).
- Case 19: no.
- Case 20: no.
- Case 21: yes. It holds no view test, so it is green with any view behaviour.
- The step line's check (the verify list): yes. `test:quick` and `wc -l` are green whatever the cards draw, and verify item 3 is red whatever is built.
- Item 1 (one component): yes. Every case passes if each of the 14 card files keeps its own copy of the head and menu. No check states that each kind's card file draws `RecordCard.svelte`, which a grep of the 14 files computes.
- Item 2 (runs): yes in part. The order of Open and the no-heading run, and prefixed ids such as `files:<path>` and `workbench:<path>` (`entry-actions.ts:186,200`), are covered by no case.
- Item 3 ("Every control a card has on the base is in its menu or its strip ... none is lost"): yes. No case lists the base controls of each kind, so a lost control would pass. Examples: dataset Recover, entry Start Agent and Copy BibTeX extras, Show in Files per path, venue and registry Edit in File and Delete, Open at provider, LinkedIn Edit on a posted post.
- Item 4: yes in part. "An emptied date clears it" and "Change deadline" holding the record's date have no case.
- Item 5: yes in part. Several hubs (`{0} ({1})`), Deadline on a collection entry, and the record dropdown resetting the date box have no case.
- Item 6 (words and docs): yes. No case or check reads `docs/HELP.md` 281/282/288/290 or the new paragraph.

Findings:
- No case or check states that the 14 kinds are drawn by one component (item 1). Every case passes with per-kind copies.
- No case inventories each kind's base controls against the menu and strip (item 3, "none is lost").
- Case 18 names no kind, and the project card and Quick add are where the blocked state is new.
- Case 16 does not check the Deadline write or the clearing.
- Case 4 checks only the list of rows.
- Case 6 leaves Applied in the strip with several hubs unchecked.
- The verify list cannot fail on view behaviour, and its item 3 cannot pass.

## 6. Implied inputs

- A lead's deadline is free text (`docs/templates.md:1414`, `type: text`, "Deadline as posted.") while the Deadline form is a date box. Missing. Expected: Deadline offered only on a collection whose `deadline` field is `type: date`, or the form keeping the text. A date box over "rolling" either cannot show it or overwrites it.
- An entry whose `followup:` is a text: the funding, events and joint-work templates declare `followup` `type: text`, "A standing reminder." (`docs/templates.md:1161,1204,1241`), and HELP.md:282 calls a non-list `followup:` a finding. Follow-up on it is missing. Expected: the refusal said on the outcome line and nothing written, or the row disabled with why.
- An entry with several hub paths (`link`, `url`, `folder`), which gives several `files:<path>` and `workbench:<path>` actions (`entry-actions.ts:180-204`). Missing. Expected: every one in the Open run, and the strip's single Workbench naming which folder.
- A workspace with several hubs:
  - Quick add's record names `{0} ({1})`: no case.
  - The lead's Applied in the strip while more than one hub holds Applications (`LeadCard.svelte:187` is a Menu now): no case.
  - A collection whose schema has `deadline` in one hub and not another, for Quick add's Deadline kinds: no case.
  - All missing.
- Two entries of one collection with the same display title, and an entry with no display value: rows that cannot be told apart in Quick add's record dropdown. Missing. Expected: a distinguishing suffix, or the primary key.
- A collection with no `label:`: `config/defaults/sources.yml:36-39,51-52` (data, venues, pillars, domains, leads, radar) carry none, and item 5 lists kinds "by its view's label". Missing. Expected: the words the kind dropdown shows for each.
- A collection with no entries, picked in Quick add or in the thread's form. Missing. Expected: an empty record dropdown and Save disabled.
- A project whose manifest has unsaved text in a source tab, and a Quick add record whose file has unsaved text. Missing: case 18 names no kind, and on the base both forms are writable (section 3). Expected: every Add and Status row, and the form's Save, disabled with the blocked words.
- The Deadline form with its date emptied. Missing. Expected: the `deadline` field removed (`writeManifest`/`writeEntry` with an empty value), said on the outcome line.
- Deadline picked from the menu on the project page (`Project.svelte`, where CardDetails holds Subtasks and Followups in two columns). Missing. Expected: where the deadline form draws on the page.
- A keyboard user: the context-menu key or Shift+F10 on a control of the card, and Tab to the "..." opener. Missing (item 1 states it, but no case puts it to the look).
- A thread with no subject. Missing. Expected: "What" empty and Save disabled until text is typed.
- A kind with no action (Archival, Orphans, No funding), right-clicked. Case 11 covers only the absent opener. Missing. Expected: which menu a right-click opens there.
- A lead or a Lit Watch paper in a file a scout wrote with no schema (`sources.yml:32`). Case 3 covers only the entry card. Missing. Expected: Add run present only when the file names a key.
- One add form open when another row of the Add run is picked, and a save in flight when Quick add's record changes or the card closes. spec.md "The principles every package is judged on" and "What every package obeys" ask the report to state each asynchronous path. Missing. Expected: one form at a time, and a late answer dropped.

Findings: each item above is missing from "Cases". The first two (the text-typed lead deadline and the text-typed `followup`) are the ones whose wrong answer overwrites or refuses data; the blocked-state item is the one whose base behaviour the brief misstates.

## 7. ADRs

- `ls -d docs/adr` prints `ls: docs/adr: No such file or directory`. `grep -n "adr" .agents/plan.yaml` and the same grep of `orchestrator-state.md` print nothing. No record.

Findings: none.

## 8. Dictated text

- "New follow-up": `grep -n -F '"New follow-up"' .scratch/migration/agents/briefs/O89.md` finds lines 64, 82 and 101. Holds: ASCII, sentence case, the step line's own words.
- "New subtask": the same grep finds lines 65, 82 and 102. Holds.
- "What": the same grep finds lines 64, 65, 82, 97, 101, 102 and 179. Holds.
- "Not before": the same grep finds lines 64, 82 and 101. Holds.
- "Deadline": the same grep finds lines 65, 66, 82 and 102. Holds.
- "New deadline": the same grep finds lines 66, 89 and 181. Holds.
- "Change deadline": the same grep finds lines 66, 89 and 181. Holds.
- `{0} ({1})`: `grep -n -F '{0} ({1})'` finds line 75. Holds (ASCII, a placeholder pattern, a new key under `focus.*`).
- The brief as a whole: `LC_ALL=C grep -n '[^ -~]'` prints nothing.

Findings: none.

## Also: the paths list against the tree

- `config/text/views/boards/collection.yml` is missing. `collection.related` loses its only two readers (section 1).
- A file under `views/shared/` for the kind-and-record picker is missing. Decision 2 has `InboxCard` (in `views/feeds/inbox`) open Quick add's form, but `tests/checks/tree/boundaries.test.ts:358-366` lets nothing under one view import another view's partials (`views/boards/focus/**`). The picker must live under `views/shared/`. The paths allow only "one new file for the add form or the deadline form" in `dated/`, and `views/boards/focus` is at 10 items.
- `tests/checks/tree/allow-styling.ts` is limited to "the `HELD` rows of the two cards removed". It also holds VenueCard's row (:96-97, `.slot.concentrated :global(.card)` at `VenueCard.svelte:283`) and CrossLinks' rows (:44-53, `CrossLinks.svelte:142,148`).
  - If VenueCard's rule goes, the test 'holds the styling lists to rules the tree still has' (`boundaries.test.ts:852-858`) fails until its row is removed.
  - Their `why` line numbers go stale as both files change.
- `Collection.svelte` is at 520 lines (`wc -l` prints 520) and in the paths. A split file for it is not in the paths.
- `views/shared/card/feed/literature-card.ts` and `views/shared/forms/entry/task-card.ts` (importers of `CardActions.svelte`) are covered only by the catch-all line.
- These callers of the cards are named under "What is on the tree" but not in the paths: `Projects.svelte`, `Project.svelte`, `Venues.svelte`, `Data.svelte`, `Domains.svelte`, `Leads.svelte`, `Radar.svelte`, `Bucket.svelte`, `Linkedin.svelte`, `Inbox.svelte`, `Literature.svelte`. Whether any must change depends on whether the record card reads its data from client state. `Inbox.svelte` would have to hand the thread the records unless the picker reads them itself, and `Project.svelte` is where the page's Deadline form draws. Not settled by a read. The brief's "A file the work needs beyond them is named in the report with why" covers them.
- `docs/HELP.md:318` is outside "lines 270-300" (section 1).
- Folder sizes:
  - `views/shared/card` stays at 10: minus `CardActions.svelte`, plus `record/`.
  - `views/shared/forms` goes to 9 (InPlace deleted). `dated` 4 and `registry` 5 have room.
  - `views/boards/focus`, `views/shared/links`, `ui/frame`, `ui/menu` and `ui/forms` are at 10, and the brief adds no file to any of them.
  - The new `record/` folder holds at most 4 items.
  - Holds.

## Declined to judge

- The main hub's list of collections with a `deadline` field, and case 11's counts: they come from the hub's data, which this agent may not read. The templates agree with the brief's eight collections.
- Whether the 11 callers outside the paths must change: it depends on a design choice (props or client state) that the brief leaves to the builder.
- Overlap with O88, ruled to be built side by side: O88 has no brief on main (`ls .scratch/migration/agents/briefs/` lists no O88.md). O86's paths (`focus.yml` lines 85-90) do not overlap O89's ranges of the same file, but O89's added keys shift lines below them. Merge simplicity is the orchestrator's judgment.
- Decision 6 against rulings 454 and 456 (section 2): whether the project card's related projects count as "a list of projects" is Axel's call.

Agent usage: a17b47d782ada96fb, claude-opus-5-5, 241420 tokens, 78 tool uses, 11 min 1 s.

## Closed

Each finding is closed by a change to `agents/briefs/O89.md` before the preparation commit; none needs a ruling.

- Names, `RecordCard` collides with the registry helper: item 1 renames `record-card.svelte.ts` to `registry-card.svelte.ts` and its four names to `RegistryCardState`, `RegistryCardProps`, `RegistryCardTarget` and `createRegistryCard`, with `entry-actions.ts:62` saying "registry card"; decision 1 says why; the paths name the move.
- Names, `collection.related` left without a reader: item 1's foot takes the key out when no reader is left; `config/text/views/boards/collection.yml` is in the paths.
- Names, `docs/HELP.md:318`: premise added, item 6 says what line 318 becomes, the paths hold lines 315-320.
- Names, `literature-card.ts` and `task-card.ts`: named in the paths.
- Step line, the exclusions of ruling 456: item 1 says the Focus lane card and band items, the Slides tiles and the Usage cards stay outside.
- Step line, the hit's actions sit in the body: premise corrected (body row 135-167), item 3 and case 10 say they move to the meta row.
- Step line, decision 6: rewritten to follow ruling 456's letter; the project card's related projects move to the foot strip, and item 1's foot lists the project.
- Premises, `entry-actions.ts` 205 lines, `EntryFields` 220-221 and "Named by": corrected.
- Premises, the leads' text deadline: premise added; item 4's deadline form takes a text box for a field not of `type: date`, as `InPlace` did; case 24.
- Premises, `blocked` on the project card and Quick add: premise added; items 2 and 4 keep `blocked` on the cards that have it and add none to the project card or Quick add, as on the base.
- Cases, case 21 and the run on the unchanged tree: its first run is a reading.
- Cases, verify item 3: the grep names only the step's names (`forms/InPlace`, `InPlace.svelte`, `card-menu`, `record-card.svelte`, `createRecordCard`) and excludes `local.yml`.
- Cases, case 19's editor clause: removed.
- Cases, case 11's counts from the hub: reworded to the strip as on the base.
- The question, one component: case 22 (a grep of the 14 card files). None lost: case 23 (a per-kind table in the report) and item 3's list of the controls named. Case 18's kinds: items 2 and 4 say which cards carry `blocked`. Cases 16, 4 and 6: cases 24, 27 and 29 cover the Deadline write, the clearing and Applied with two hubs.
- Implied inputs: cases 24 to 33 (text deadline, text `followup`, several hub paths, several hubs, same titles and no entries, the project page, the keyboard, a thread with no subject, a file with no schema, one form at a time and a late answer); item 5 says the kind words of a collection with no `label:`, the primary key for an entry with no display value and for two entries with the same words.
- Paths, the shared picker: item 5 puts the kind and record dropdowns under `views/shared/forms/dated/`, in the paths.
- Paths, `allow-styling.ts` rows of `VenueCard` and `CrossLinks`: item 1 and the paths cover them.
- Paths, `Collection.svelte` at 520 lines: one new file of `views/boards/collection/` (6 items) is in the paths.
- Paths, the card callers: each named in the paths line with "named in the report with why".
