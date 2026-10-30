Everything in the brief is done

The look of every page and editor below is not taken: a builder runs no page, so it is listed for the look. One sentence of the hub stays false until the orchestrator decides on it, because the hub patch may hold nothing but `section:`: see "Anything in the brief that was wrong or impossible", first row.

## Open items of the state file, verbatim

`awk '/^## Open items/{p=1;next} /^## /{p=0} p' .scratch/migration/orchestrator-state.md` prints one paragraph and no item:

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

## The cases' first run

Run on the unchanged tree, before any change. The cases are views and there is no browser suite, so each was read from the code, and where a pure module answers, `node case-run.mjs` printed the result (the program is gone; see "Scratch programs").

| # | Case | Checked by | First run |
| --- | --- | --- | --- |
| 1 | The project page and the project editor, before and after | reading `Project.svelte`, `Editor.svelte` | already as asked; the frame was cut out of it, nothing to change in its look |
| 2 | A venue's page | reading `Entry.svelte` | `EntryCard`, the editor on the page, `Referrers`, `EntryFolder`: the form was on the page |
| 3 | A venue's editor | `case-table.py` over the hub's schema | `research/venues.yml 20 rows; not in table: [] ; table only: [] ; has section key: 0` |
| 4 | An application's editor | `case-table.py` | `academic/applications.yml 15 rows; not in table: [] ; table only: [] ; has section key: 0` |
| 5 | A person's page | reading `Person.svelte` | self line, fact strip, link rows, folder, form |
| 6 | A lead's and a Lit Watch paper's page | reading `Entry.svelte`, `LeadCard`, `RadarCard` | feed card and form; `savePage` through `writeFeedField`; no Edit row |
| 7 | Career | reading `Career.svelte` | one `EntryEditor` |
| 8 | A career file with no schema | `careerShown` in `tests/data/sources/career.test.ts` | the `no_schema` line, already |
| 9 | Archival, Orphans and No funding | reading, `case-run.mjs` | `RecordCard`s with no `ontitle`; `views registered as listing, post: false false` |
| 10 | A LinkedIn idea | reading `PostCard.svelte`, `markPosted` | no `ontitle`; `markPosted` answers `changed:['file']`, no new name |
| 11 | A post whose file was removed | reading | no page exists |
| 12 | A schema row with no `section:` | `case-run.mjs` | `section read: [["a",null],["b",null],["c",null],["d",null],["e",null],["f",null]]` |
| 13 | A schema row naming a section the list does not hold | `case-run.mjs` | the same line: no section is read at all |
| 14 | An edit in an entry's editor tab, then a close | reading `form-draft.ts`, `registerUnsaved` | draft kind `page` and `registerUnsaved` cover any instance |
| 15 | An entry's editor while a source tab holds unsaved text | reading `EntryEditor.svelte` | `blockedBy` on Save |
| 16 | A save refused for one field | reading `EntryEditor.svelte` | refusals under the field |
| 17 | A save that changes a venue's `name` | reading `venues.yml:13` of the hub, `:3` of the fixture, `Entry.svelte` | the primary key is `id`; `Entry.svelte`'s `$effect` moves the page tab |
| 18 | An entry deleted while its editor tab is open | reading `pageDraftTarget` | `hasWords` answers the close |
| 19 | An entry whose identity has a fault | `case-run.mjs` | see the ruled case below |
| 20 | A person of a people file with no schema | reading `normalise.ts:626` (`withId`) | such a person exists only with a named key |
| 21 | The Orphans card with no orphans | reading | no `ontitle` |
| 22 | `section: ""`, and a section named `Other` | `case-run.mjs` | `section on the form: [["a","",null],["b","",null],["c","",null],["d","",null],["e","",null],["f","",[""]]]` |
| 23 | A hub collection keyed `listing` or `post` | `case-run.mjs` | `viewIdProblems: []` |
| 24 | Edit pressed from the page and from the card | reading `stateId` | it ignores the label, so one tab |
| 25 | A required field emptied | reading `EntryEditor.svelte` | the reminder, empty field |
| 26 | An entry of a file with no schema | reading `pageOf`, `recordActions` | `pageOf` null, `recordActions` `[]`, `entry.unknown` |
| 27 | Two hubs holding one key in one collection | reading `stateId` | JSON of `[collection, hub, key]` |
| 28 | An Add person from a field of an entry of a second hub | reading `addPerson` | `page.root` |

Fixture on the unchanged tree, by `case-table.py`: 15 schemas, `used_by` of `data.yml` not in the table, `leads` and `radar` print `NO SCHEMA`. Hub rows: applications 15, education 23, events 23, funding 28, tasks 10, leads 10, literature 13, radar 15, people 12, organisations 5, resources 6, statements 6, pillars 7, domains 5, data 11, venues 20, career 11.

### The case the brief's rules got wrong, with its ruling

Case: "An entry whose identity has a fault: Edit opens, and Save is off with the fault's words."

Rule: Edit opens the editor. Result on the unchanged tree, `case-run.mjs`:

```
entry id "lab:alpha" state {"collection":"venues","hub":"lab","key":"alpha","label":"x"} names "lab:alpha"
entry id "alpha" state {"collection":"venues","hub":"","key":"alpha","label":"x"} names "alpha"
entry id "lab:" state {"collection":"venues","hub":"lab","key":"","label":"x"} names ""
entry id "" state {"collection":"venues","hub":"","key":"","label":"x"} names ""
```

An entry with no key has no state to name it by, so the case could not hold for it.

The orchestrator's ruling (`.scratch/migration/agents/briefs/O104-cases.md`), carried as given: "Case 'An entry whose identity has a fault: Edit opens, and Save is off with the fault's words' is ruled by open item 598 (a): For a `shared` fault of a collection entry and an `unkeyed` feed entry, the case stands as written. For an entry with no key (an `empty` fault, or an entry of a file with a schema and no primary key), the Edit row is drawn disabled, its title the fault's words from `blockedBy`. Edit in File stays on, and it is where the key is written. `src/lib/views/feeds/leads/Leads.svelte` is added to the paths: it hands `LeadCard` the entry's ident through a new `id` prop, as `RadarCard` takes one. `case-run.mjs` and `case-table.py` in your scratchpad are scripts the brief did not approve. Write no further script, and name both in the report with what each computes."

### Scratch programs

- `case-run.mjs`, in the session scratchpad: printed, from the pure modules, what each schema row's `section` reads as and how it reaches a form field, the state and name of an entry with and without a key, whether `listing` and `post` are registered views, and what `viewIdProblems` answers for a collection keyed by them. It wrote nothing.
- `case-table.py`, in the session scratchpad: printed, for each of the 17 schema files under a given data folder, the rows not in the brief's table, the table's names not in the file, and how many rows hold a `section` key. It wrote nothing.
- Both were rerun after the ruling, unchanged. `ls` of both in the scratchpad now prints "No such file or directory".
- Two inline commands were run after the ruling, neither kept: `python3 -c` comparing each hub file with the patched copy with `section` taken off, and a `python3` heredoc comparing two knip lists by name.

### The cases after the change

Quoted run, `node case-run.mjs` on the changed tree:

```
entry id "lab:" state {"collection":"venues","hub":"lab","key":"","label":"x"} names ""
entry id "" state {"collection":"venues","hub":"","key":"","label":"x"} names ""
section read: [["a","Core"],["b",null],["c",null],["d",null],["e","Other"],["f","Core"]]
section on the form: [["a","Core",null],["b","",null],["c","",null],["d","",null],["e","Other",null],["f","Core",[""]]]
views registered as listing, post: true true
viewIdProblems: [["findings.collections.view_id",["listing"]],["findings.collections.view_id",["post"]]]
```

The hub patch applied to scratch copies, `case-table.py`: all 17 files print `not in table: [] ; table only: []` and `has section key:` equal to their row count (15, 23, 23, 28, 10, 10, 13, 15, 12, 5, 6, 6, 7, 5, 11, 20, 11).

The rest of the cases are views: read from the code and listed for the look below.

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| 1 Sections in the schema | DONE | `tests/data/sources/career.test.ts`, describe "a schema row's section" |
| 2 Section names and order | DONE | same describe, its table of orders; `config/schemas/manifest-schema.yml` |
| 3 Rows with no section | DONE | same describe; `formGroups` in `src/lib/state/forms/record-fields.ts` |
| 4 The page frame | DONE | `src/lib/views/shared/card/record/RecordPage.svelte`, read; `Project.svelte` is built on it |
| 5 The one editor | DONE | `git grep -n "EntryEditor" -- src docs tests` prints nothing, exit 1 |
| 6 Opening the editor | DONE | `editorAction`, `editorRows` read; look listed |
| 7 The entry page | DONE | `Entry.svelte`, `registry/RegistryPageCard.svelte` read; look listed |
| 8 The person page | DONE | `Person.svelte` read; look listed |
| 9 The Career page | DONE | `tests/data/sources/career.test.ts`, describe 'what the Career view draws' |
| 10 The project sets | DONE | `Listing.svelte` read; `views registered as listing, post: true true` |
| 11 The LinkedIn post | DONE | `Post.svelte` read; look listed |
| 12 The rest | DONE | no page added for inbox threads or search hits; Add unchanged |
| 13 The hub | DONE | `patch --dry-run` below; fixture and `docs/templates.md` by `case-table.py` and reading |
| 14 The words | DONE | `docs/HELP.md`, `docs/data-map.md`; "Doc text" below |

Verify list, 3 full runs. The first was red on real defects in the step (lint on a template expression, two tests matching fixture text, 14 comment lines one column over, module-level state in `career-view.ts`), fixed in the step. The second was green. The third is the run after the last change, a word of the fixture's help text:

```
test:quick: 103 changed file(s), from git since HEAD
test:quick: 137 test file(s)
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.9 s)
ok      svelte-kit sync (2.2 s)
ok      eslint (3.0 s)
ok      svelte-check (13.8 s): 1793382374734 COMPLETED 576 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (134.9 s): Duration  125.31s (transform 102.74s, setup 0ms, import 226.29s, tests 231.83s, environment 15.62s)
ok      vitest checks (143.8 s): Duration  134.10s (transform 59.57s, setup 0ms, import 156.34s, tests 344.17s, environment 4ms)
ok      vitest slow (143.9 s): Duration  134.37s (transform 30.95s, setup 0ms, import 146.57s, tests 358.00s, environment 6ms)
test:quick: 146.4 s; every command passed
```

What it does not cover, as it prints: "tests that reach no changed file within the import depth, other than the checks under tests/checks/source and tests/checks/tree, which run for any change under src, tests or utils; the build, the lint of unchanged files". No view of this step was run in a browser.

`git grep -n "EntryEditor" -- src docs tests`: prints nothing, `git grep exit 1`.

`patch --dry-run -p1 -d ~/workspace/research-hub < .scratch/migration/agents/reviews/O104-hub.patch`, exit 0, no failed hunk:

```
patching file '.oculus/data/academic/applications.yml'
patching file '.oculus/data/academic/education.yml'
patching file '.oculus/data/academic/events.yml'
patching file '.oculus/data/academic/funding.yml'
patching file '.oculus/data/academic/tasks.yml'
patching file '.oculus/data/academic/leads.yml'
patching file '.oculus/data/academic/career.yml'
patching file '.oculus/data/literature/literature.yml'
patching file '.oculus/data/literature/radar.yml'
patching file '.oculus/data/people/people.yml'
patching file '.oculus/data/people/organisations.yml'
patching file '.oculus/data/research/resources.yml'
patching file '.oculus/data/research/statements.yml'
patching file '.oculus/data/pillars/pillars.yml'
patching file '.oculus/data/pillars/domains.yml'
patching file '.oculus/data/research/data.yml'
patching file '.oculus/data/research/venues.yml'
```

Parsed with `yaml.safe_load`, each of the 17 patched copies equals the hub's file once `section` is taken off the rows (`equal without section: True` for all 17). Whether each row has the table's section was checked by reading as the patch was written; the orchestrator's check at landing loads each file.

The new and changed tests:

- `tests/data/sources/career.test.ts`, on the unchanged tree: `Tests  12 failed | 16 passed (28)`, the failures such as `AssertionError: expected undefined to be 'Core'`, `TypeError: formGroups is not a function`, `AssertionError: expected { state: 'editor', ...(1) } to deeply equal { state: 'no_schema' }`, `AssertionError: expected [] to deeply equal [ 'positions', 'degrees', ...(3) ]`. After the change: `Tests  28 passed (28)`.
- The tests' audit reading: each new row asserts a value the changed code computes (the section read, the group order, the card of a row); none would hold with its behaviour taken out, by reading.
- `tests/data/hubs/hub-portfolio.test.ts`: the two rows that plant a field in the fixture's text match that text, which now holds `section:`. The rows assert the same; they pass in `vitest slow` above and their edit was read.

Edits of existing assertions, the whole list, `git diff -U0` of the test files:

```
tests/data/sources/career.test.ts
-        expect(careerShown(null, pageFor(null))).toEqual({ state: 'none' });
-        expect(careerShown(bare, pageFor(bare))).toEqual({ state: 'no_schema' });
-        const shown = careerShown(held, pageFor(held));
-        const page = shown.state === 'editor' ? shown.page : null;
tests/data/hubs/hub-portfolio.test.ts
-    const note = '  - { field: note,      type: textarea }\n';
+    const note = '  - { field: note,      type: textarea, section: Content }\n';
-                'type: tags,     help: "Project ids"',
-                'type: tags,     foreign_key: projects, help: "Project ids"'
+                'type: tags,     section: Connections, help: "Project ids"',
+                'type: tags,     foreign_key: projects, section: Connections, help: "Project ids"'
```

The `career.test.ts` lines follow `careerShown`'s new arguments (no `page`, a name resolver) and its `cards` state. The `no_schema` and `none` expectations are unchanged. No timeout, threshold or predicate was loosened.

Other checks:

- Unused exports: `sh utils/unused-exports.sh`, filtered to every file the step changes or adds, prints nothing. A knip run over a base tree in the scratchpad gave a list that cannot be compared whole with the worktree's (its links resolve differently: 198 exports against 227), so the check is per changed file, not a whole-tree difference.
- Stale names: `grep -rnE 'EntryEditor|data-editor|views/feeds/linkedin/(PostCard|post-card)|views/sources/(venues/VenueCard|data/DatasetCard)|views/structure/(domains/DomainCard|pillars/(LineCard|OrphansCard|ArchivalCard))|views/boards/collection/NoFundingCard' src docs tests utils`: its only hits are the source editor's own `data-editor-widgets` and `data-editor-host`, a different thing.
- Comment words, over the added lines: hits judged, none is history. "still" in `field.ts`'s comment and `HELP.md` say what happens now; "no longer holds" in `Post.svelte` is a post the feed lacks; "before" in `record-menu.ts`, `Pillars.svelte`, `RecordCard` and `VenueCard` is order of action.
- Sizes: `Collection.svelte` 520, the largest Svelte file the step changes; `career-view.ts` 110; the other files over the spec's lines are not the step's: `wc -l` lists context.ts, fs.svelte.ts, repositories.ts, ui Editor.svelte, TreeItem.svelte, Tree.svelte, config.test.ts.
- Folders: `src/lib/views/shared/card/feed` 10, `src/lib/state/forms` 10, every other changed folder under 10 by `ls | wc -l`.
- Scratch left in the worktree: the only `.scratch` paths written are this report and `.scratch/migration/agents/reviews/O104-hub.patch`.

## The terms

There is no `docs/glossary.md`, so no term is added or changed there.

## The files with line counts

`diff -rq` of the worktree's src, tests, config and docs against the base copy, base lines to lines now. A is new, D is gone (a move is a D and an A).

```
M src/lib/data/model/model-collections.ts 527 -> 529
M src/lib/data/snapshot/normalise-parts/career.ts 78 -> 78
M src/lib/data/snapshot/schema/field.ts 178 -> 180
M src/lib/data/snapshot/schema/record.ts 457 -> 458
M src/lib/data/sources/documents/career.ts 28 -> 28
M src/lib/state/forms/career-view.ts 19 -> 110
M src/lib/state/forms/form-draft.ts 178 -> 179
M src/lib/state/forms/page-entry.ts 394 -> 394
M src/lib/state/forms/record-fields.ts 59 -> 90
M src/lib/state/forms/schema.ts 632 -> 627
M src/lib/state/shared/page/hubs.ts 75 -> 76
M src/lib/views/academic/career/Career.svelte 128 -> 221
A src/lib/views/academic/career/CareerCard.svelte 87
M src/lib/views/boards/collection/Collection.svelte 511 -> 520
D src/lib/views/boards/collection/NoFundingCard.svelte (58)
M src/lib/views/boards/editor/Editor.svelte 340 -> 336
A src/lib/views/boards/editor/editor-target.ts 219
M src/lib/views/boards/entry/Entry.svelte 396 -> 368
A src/lib/views/boards/listing/Listing.svelte 128
M src/lib/views/boards/person/Person.svelte 418 -> 308
M src/lib/views/boards/project/Project.svelte 242 -> 213
M src/lib/views/feeds/leads/Leads.svelte 316 -> 318
M src/lib/views/feeds/linkedin/Linkedin.svelte 358 -> 359
D src/lib/views/feeds/linkedin/PostCard.svelte (130)
D src/lib/views/feeds/linkedin/post-card.ts (18)
A src/lib/views/feeds/post/Post.svelte 93
M src/lib/views/shared/card/feed/LeadCard.svelte 418 -> 429
A src/lib/views/shared/card/feed/PostCard.svelte 142
M src/lib/views/shared/card/feed/RadarCard.svelte 387 -> 386
A src/lib/views/shared/card/feed/post-card.ts 38
M src/lib/views/shared/card/pane-fold.ts 53 -> 53
M src/lib/views/shared/card/record/CardGrid.svelte 53 -> 54
M src/lib/views/shared/card/record/RecordCard.svelte 361 -> 362
A src/lib/views/shared/card/record/RecordPage.svelte 75
M src/lib/views/shared/card/record/record-menu.ts 185 -> 201
A src/lib/views/shared/card/record/registry/VenueCard.svelte 372
A src/lib/views/shared/card/record/registry/LineCard.svelte 206
A src/lib/views/shared/card/record/registry/DatasetCard.svelte 275
A src/lib/views/shared/card/record/registry/DomainCard.svelte 122
A src/lib/views/shared/card/record/registry/RegistryPageCard.svelte 99
A src/lib/views/shared/card/record/sets/ArchivalCard.svelte 97
A src/lib/views/shared/card/record/sets/NoFundingCard.svelte 65
A src/lib/views/shared/card/record/sets/listing.ts 22
A src/lib/views/shared/card/record/sets/ProjectCards.svelte 77
A src/lib/views/shared/card/record/sets/OrphansCard.svelte 72
M src/lib/views/shared/forms/entry/Referrers.svelte 115 -> 115
M src/lib/views/shared/forms/entry/card/EntryCard.svelte 338 -> 359
D src/lib/views/shared/forms/entry/edit/EntryEditor.svelte (243)
M src/lib/views/shared/forms/entry/edit/EntryForm.svelte 122 -> 122
M src/lib/views/shared/forms/entry/edit/page-file.ts 60 -> 60
M src/lib/views/shared/forms/entry/entry-actions.ts 290 -> 319
M src/lib/views/shared/forms/registry/registry-card.svelte.ts 106 -> 117
M src/lib/views/sources/data/Data.svelte 142 -> 142
D src/lib/views/sources/data/DatasetCard.svelte (261)
D src/lib/views/sources/venues/VenueCard.svelte (367)
M src/lib/views/sources/venues/Venues.svelte 194 -> 194
D src/lib/views/structure/domains/DomainCard.svelte (109)
M src/lib/views/structure/domains/Domains.svelte 98 -> 98
D src/lib/views/structure/pillars/ArchivalCard.svelte (78)
D src/lib/views/structure/pillars/LineCard.svelte (203)
D src/lib/views/structure/pillars/OrphansCard.svelte (54)
M src/lib/views/structure/pillars/Pillars.svelte 178 -> 184
M tests/data/hubs/hub-portfolio.test.ts 553 -> 553
M tests/data/sources/career.test.ts 252 -> 412
M tests/fixtures/hubs/demo/.oculus/data/academic/applications.yml 21 -> 21
M tests/fixtures/hubs/demo/.oculus/data/academic/career.yml 170 -> 176
M tests/fixtures/hubs/demo/.oculus/data/academic/education.yml 20 -> 20
M tests/fixtures/hubs/demo/.oculus/data/academic/events.yml 44 -> 44
M tests/fixtures/hubs/demo/.oculus/data/academic/funding.yml 33 -> 33
M tests/fixtures/hubs/demo/.oculus/data/academic/tasks.yml 33 -> 33
M tests/fixtures/hubs/demo/.oculus/data/literature/literature.yml 39 -> 39
M tests/fixtures/hubs/demo/.oculus/data/people/organisations.yml 22 -> 22
M tests/fixtures/hubs/demo/.oculus/data/people/people.yml 55 -> 56
M tests/fixtures/hubs/demo/.oculus/data/pillars/domains.yml 17 -> 17
M tests/fixtures/hubs/demo/.oculus/data/pillars/pillars.yml 15 -> 15
M tests/fixtures/hubs/demo/.oculus/data/research/data.yml 44 -> 44
M tests/fixtures/hubs/demo/.oculus/data/research/resources.yml 23 -> 23
M tests/fixtures/hubs/demo/.oculus/data/research/statements.yml 30 -> 30
M tests/fixtures/hubs/demo/.oculus/data/research/venues.yml 30 -> 30
M config/schemas/manifest-schema.yml 127 -> 134
M config/text/palette-page.yml 38 -> 38
M config/text/views/academic/career.yml 28 -> 41
M config/text/views/boards/editor.yml 35 -> 39
M config/text/views/boards/entry.yml 28 -> 27
M config/text/views/boards/person.yml 32 -> 24
M config/text/views/boards/project.yml 189 -> 194
M config/text/views/feeds/linkedin.yml 34 -> 38
M docs/HELP.md 603 -> 604
M docs/data-map.md 300 -> 303
M docs/diagrams/channels.dot 340 -> 342
M docs/diagrams/channels.svg 1790 -> 1802
M docs/diagrams/layer-state.dot 173 -> 173
M docs/diagrams/layer-state.svg 855 -> 855
M docs/diagrams/layer-views.dot 184 -> 179
M docs/diagrams/layer-views.svg 832 -> 809
M docs/diagrams/layers.dot 101 -> 101
M docs/diagrams/layers.svg 556 -> 556
M docs/diagrams/writes.dot 1571 -> 1573
M docs/diagrams/writes.svg 5282 -> 5294
M docs/palette.md 204 -> 206
M docs/templates.md 1889 -> 1899
```

Paths outside the brief's list, each with its reason:

- `src/lib/state/shared/page/hubs.ts`: re-exports `hubId`, which `Career.svelte` needs for the id of the career file's editor, beside the other hub helpers it imports from there.
- `src/lib/views/academic/career/CareerCard.svelte`: the Career page's card, kept apart to hold `Career.svelte` to one screen of markup.
- `src/lib/views/shared/card/record/registry/RegistryPageCard.svelte`: chooses the registry card by `collection.registry`, so `Entry.svelte` draws one element and holds no per-kind reads.
- `src/lib/views/shared/card/record/sets/ProjectCards.svelte`, `sets/listing.ts`: the project cards of a person's section and of a set's page are one component; `listing.ts` opens the page for the two views that draw the set cards.
- `src/lib/views/feeds/leads/Leads.svelte`: added by the ruling.
- `tests/data/hubs/hub-portfolio.test.ts`: its two rows match the fixture's text, which item 13 changes.
- `docs/palette.md`: generated by `npm run docs:palette`, which the verify list runs.
- `src/lib/views/shared/card/pane-fold.ts`, `CardGrid.svelte`, `Referrers.svelte`: their head comments named the old pages; the sentences only.

## Judgment calls the brief left open

- `formGroups` draws the project's sections too, so one function orders every kind.
- The catalog words `editor.record_status`, `editor.record_title`, `editor.record_toolbar` name the editor's status bar, title and toolbar for any record.
- `Editor.svelte` carries `data-entry` for a non-project record where `Entry.svelte`'s form carried it.
- `careerShown` drops its `page` argument and takes `personName`, which titles a reference's card.
- Career, registry and set cards read the snapshot, so they lag a save until the watcher reports, as a project card does. The entry overlay of a page is not applied to `VenueCard` and its like.
- The tab label of the career editor is the file's `title`.
- New pages open as preview tabs through `openBeside`, as a project card's page does.
- `PostCard` with `page` leaves its snippet out, as the page draws the whole body.
- `LeadCard` computes its file and fault with `pageFile` and `pageFault`, as the page needs them for Edit.
- `GroupHead` carries a `count` on Career's and Listing's groups, none on the Person sections, matching what each list can read at a glance.
- A career strategy order row is labelled by its `when`, else by `career.order`.
- Career's `said` line stays its own `<p>` on a `Surface`, for its error colour.
- `career.hidden` reads "off the CV"; `views.listing` reads "Projects".
- The Person and Career panes lose their tint, since the frame has none.
- `person.*` fact words and `entry.editor` are removed as unused.
- `Collection.svelte` passes the No funding card its props as one `$derived` object, drawn in both modes, which holds the file to 520 lines.
- `career.yml`'s `title` help says "the title of the career file's editor page" in the hub and the fixture; it is still the title of that file, and the patch leaves it.

## Host- and user-visible changes, for the look

| View | State to put it in | Before | After |
| --- | --- | --- | --- |
| Project page and editor | any project; type in a subtask; refuse a field | as now | must not differ at all: same blocks, order, gaps, tint, toolbar, status bar; a typed edit keeps a preview tab; a refused field a line under the form; no reminder on Tier |
| Entry page, a venue | open a venue from the Venues view | form on the page | `VenueCard`, name as words, no Page action, long text whole, Referrers, folder blocks |
| Entry page, dataset, domain, line | open one | form | the card its view draws, opened out |
| Entry page, other collections | open an application | form | `EntryCard` with `more`, Referrers, folder |
| Entry page, lead and Lit Watch paper | open one | form | feed card; Edit in the strip |
| Editor, any record | Edit on a card, Edit on a page | no editor for entries | one tab beside the page, sections as the project's; pressed twice, one tab |
| Editor, venue | a venue | none | Core, Indexing, Content, Dates; 20 fields |
| Editor, application | an application | none | Core, Content, Connections, Dates |
| Editor, a hub row with no section | a schema row with no `section:` before the patch lands | none | under Other, last |
| Editor, an edit then a close | type, close the tab | no such tab | the close asks; a reload keeps the edit |
| Editor, source tab unsaved | unsaved text of the entry's file in a source tab | Save off on the page | Save off in the editor with the same words |
| Editor, field refused | a save the server refuses for one field | reason under the field on the page | the same in the editor |
| Editor, title changed | save a new venue `name` | page tab moved | editor and page tabs both move |
| Editor, entry deleted | delete the entry with its editor open | none | the `editor.unknown` line; the close asks while the draft holds words |
| Card menu, no key | an entry with an `empty` fault | no Edit row | Edit row disabled, its title the fault's words; Edit in File on |
| Card menu, shared key | an entry with a `shared` fault, an `unkeyed` feed entry | none | Edit opens, Save off with the fault's words |
| Person page | a person with projects, and yourself | self line, fact strip, link rows, form | card, Projects, Waiting on as closed project cards with clamped ELI5, folder; "this is me", its tip and hub chip in the toolbar beside Delete; no tint |
| Person, no schema | a people file with no schema | form-less | card and sections, no Edit |
| Career | the demo hub | one form | strategy card, then Positions, Degrees, Awards, References, Profiles as cards; a `hide: true` row's Tag; Edit and the toolbar open one editor with six sections; Write the website and its line stay; no tint |
| Career, no schema | a career file with no schema | the line | the line, no Edit |
| Pillars, Funding | the Orphans, Archival and No funding cards | title words | title opens a `listing` tab; opened twice, one tab; the strip stays |
| Listing, Archival | archived projects | none | one folded group per stage, in the order of `dead` |
| Listing, none | no orphans | none | `Empty` |
| LinkedIn | an idea's title | no page | a `post` tab, the body rendered; Mark posted moves the tab to the numbered file; Edit opens the text file |
| LinkedIn, gone | remove the post's file with the page open | none | the `Empty` line |
| Add person | a field of an entry of a second hub | lands in that hub | the same, from the editor |

## Anything in the brief that was wrong or impossible

- The literature schema's `title` help says "its title is filled in on the entry's page", false once the page holds no form. The brief says the hub patch holds `section:` and nothing else, so the hub's line stays false. The fixture's reads "its title is filled in in the entry's editor" (it is one of the fixture's own strings); `docs/templates.md` holds no such sentence, by `grep -n "entry's page" docs/templates.md`. The orchestrator can change the hub's line 8 of `.oculus/data/literature/literature.yml` the same way; it is a hub file, so I did not.
- "`agents/guarded.md`": the file is `.scratch/migration/agents/guarded.md`; `grep` on the other path prints nothing.
- "A person of a people file with no schema": such a person exists only with a named key (`withId`, `normalise.ts:626`), so the case holds for those.
- The case on an entry's fault: ruled, above.
- The brief's five entries: G139 and G140 name no moved file and no Career form, so they take no line; see below.

## Doc text

Lines of `.scratch/migration/agents/guarded.md`, as `grep -n` prints them. G139 (line 225) and G140 (line 228) need no change: neither names a file that moved or the Career view's forms, and G140's Code line names `src/lib/views/academic/career/Career.svelte`, which stays where it is.

G28, current:

```
83:- G28. An unsaved edit survives a tab switch, a reload and a change of its file on disk, and closing a tab, pane or page that holds one asks first: in the manifest editor, the file editor (Edit in File opens the file at the entry and puts no text), the entry editor and the career editor and the review comment box. A write sent from any view or from an app over a file a source tab of the page holds unsaved text of is refused before it is sent, and the text is kept. Under `editor.autosave` `on_focus_change`, or `after_delay` of 1000 ms or less, closing a file editor tab saves it in place of the question, and a save that is refused keeps the tab and asks. Closing a Terminal tab whose terminals run asks first, and a move, a split or a reload stops none of them. A page that detaches stops the delivery and leaves the tmux session running.
```

G28, replacement:

```
- G28. An unsaved edit survives a tab switch, a reload and a change of its file on disk, and closing a tab, pane or page that holds one asks first: in the record editor (a project, an entry of a collection or a feed, the career file), the file editor (Edit in File opens the file at the entry and puts no text) and the review comment box. A write sent from any view or from an app over a file a source tab of the page holds unsaved text of is refused before it is sent, and the text is kept. Under `editor.autosave` `on_focus_change`, or `after_delay` of 1000 ms or less, closing a file editor tab saves it in place of the question, and a save that is refused keeps the tab and asks. Closing a Terminal tab whose terminals run asks first, and a move, a split or a reload stops none of them. A page that detaches stops the delivery and leaves the tmux session running.
```

G137, current:

```
220:  Code: `src/lib/views/sources/venues/Browser.svelte`, `VenueCard.svelte` (Read from the browser), `src/lib/state/sources/registries/browser.ts`, `src/lib/server/content/literature/browser.ts`, `src/routes/api/(docs)/venue-browser/+server.ts`.
```

G137, replacement:

```
  Code: `src/lib/views/sources/venues/Browser.svelte`, `src/lib/views/shared/card/record/registry/VenueCard.svelte` (Read from the browser), `src/lib/state/sources/registries/browser.ts`, `src/lib/server/content/literature/browser.ts`, `src/routes/api/(docs)/venue-browser/+server.ts`.
```

G32, current:

```
276:- G32. What the hub shows is what its files say: each parser of the hub's files reads a well-formed file into the values the file holds (manifests, registries, collections, career, feeds, docs, present, the snapshot built from them), the career file's `positions`, `degrees`, `awards`, `references` and `profiles` read as the file holds them and drawn by the Career view's forms as record cards. A project is read from `project.yml` at its folder's top or `.oculus/project.yml`, the top one when both are there with a finding naming both, and a hub folder is never one; a folder whose repository's `origin` is another project's `repository.url` is that project's clone and no project, and a project's clones are the repositories whose `origin` is its `repository.url`, two of them a finding.
```

G32, replacement:

```
- G32. What the hub shows is what its files say: each parser of the hub's files reads a well-formed file into the values the file holds (manifests, registries, collections, career, feeds, docs, present, the snapshot built from them), the career file's `positions`, `degrees`, `awards`, `references` and `profiles` read as the file holds them and drawn by the Career view as record cards, one per row. A project is read from `project.yml` at its folder's top or `.oculus/project.yml`, the top one when both are there with a finding naming both, and a hub folder is never one; a folder whose repository's `origin` is another project's `repository.url` is that project's clone and no project, and a project's clones are the repositories whose `origin` is its `repository.url`, two of them a finding.
```

G32's Test line, line 278 (6801 bytes), changes in one clause, which the orchestrator replaces in place. This is the clause and not the whole line, since the rest is unchanged; a guarded entry's Code line already names `record-fields.ts`, so the new rows of the step go here.

Current clause of line 278:

```
the Career view (`src/lib/state/forms/career-view.ts` `careerShown`): describe 'what the Career view draws', 'draws the line saying the hub holds no career file when it holds none', 'draws the line saying the file has no schema when its schema is absent' and "draws every section of the file's schema in the schema's order, each in the form its field gives"; a person's links and names:
```

Replacement:

```
the Career view (`src/lib/state/forms/career-view.ts` `careerShown`): describe 'what the Career view draws', 'draws the line saying the hub holds no career file when it holds none', 'draws the line saying the file has no schema when its schema is absent', 'draws one card per row of each of the five groups, in their order', the rows 'draws $name' and "draws every section of the file's schema in the schema's order, each in the form its field gives"; a schema row's section: `tests/data/sources/career.test.ts`, describe "a schema row's section", every row; a person's links and names:
```
