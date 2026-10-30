# Step O104 brief check (on main at 29fe4a2d4)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `/Users/axelfaes/workspace/oculus/.scratch/migration/agents/briefs/O104.md`. Paths below are relative to `/Users/axelfaes/workspace/oculus`. `git rev-parse HEAD` printed 29fe4a2d422b45fdcc38d4d95b2e6a49a3d1cb9a. Nothing was written. "FOR AXEL" marks a finding whose fix widens the step's paths or adds a requirement or a case.

The findings that stop the step as written:
- 1.1: `section:` is refused by the schema of a schema, in a file outside the paths.
- 3.1: `state/forms` is full, so `editor-target.ts` cannot go there.
- 1.5: the new Edit row needs `record-menu.ts`, which is outside the paths.
- 1.6: the new catalog file needs `config-folder.test.ts`, which is outside the paths.
- 4.1: one case states a false fact about the tree.

## 1. Names

- `section` as a key of a schema row: `git grep -n 'SCHEMA_BLOCK\|SCHEMA_DEFINITIONS\|SCHEMA_FIELD' -- src tests docs`, then a read of `src/lib/data/snapshot/schema/record.ts:361-445`.
  - `src/lib/data/snapshot/schema/record.ts:445` is `additionalProperties: false` on `SCHEMA_FIELD`, and its head comment lines 11-13 say a schema field written with a key no field takes "is a finding of the schema of a schema".
  - `hub.ts:28,87` and `engine.ts:69` use it. `record.ts` is not in the paths. The change makes the reader accept a key the schema of a schema refuses.
- `section` in the words: `sed -n 1083,1099p docs/templates.md` shows "A schema line takes these keys:" with no `section`. The file is in the paths, but item 1 names only `docs/data-map.md`'s table, whose rows sit around `docs/data-map.md:261`.
- `EntryEditor`: `git grep -n EntryEditor -- src`, and the same over `tests docs config`. Hits: `career-view.ts:4`, `Career.svelte:20,37,98`, `Entry.svelte:23,57,355`, `Person.svelte:55,332`. All are in the paths; no hit outside them.
- The forms leaving the pages, stale words outside the paths: `git grep -n -i 'career view\|person page\|the page of a collection entry\|entry editor\|career editor\|entry pages\|its editor\|page holds' -- src config/text ':!config/local.yml'`, plus reads of the head comments. Each one below is false after the change:
  - `src/lib/views/shared/forms/entry/edit/EntryForm.svelte:5-6`: "the editor of an entry, a person and the career file draws one run for the whole schema".
  - `src/lib/state/forms/form-draft.ts:3-4`: "the page of a collection entry or a feed entry, the person page and the Career view are forms".
  - `src/lib/views/shared/forms/entry/edit/page-file.ts:1`: "view helper of the entry page, the person page and the Career view".
  - `src/lib/data/snapshot/normalise-parts/career.ts:3`: "which the Career view's editor edits".
  - `src/lib/data/sources/documents/career.ts:1`: "the one document the Career view edits".
  - `config/text/palette-page.yml:25`, user-facing: "adds the task and opens its page in its editor".
- Hits that stay true: `src/lib/server/edit/writes/bodies.ts:66,109` ("the entry editor", "the career editor"), `config/text/views/shared/entry-form.yml:1`, `config/text/views/shared/folder-files.yml:2`.
- `VenueCard`, `DatasetCard`, `DomainCard`, `LineCard`, `ArchivalCard`, `OrphansCard`, `NoFundingCard`, `PostCard`, `post-card`: `git grep -n "<name>" -- src tests docs config README.md .scratch/migration/agents/guarded.md`.
  - All src hits are in the paths.
  - One hit is outside: `.scratch/migration/agents/guarded.md:220`, G137's Code line, names `src/lib/views/sources/venues/Browser.svelte`, `VenueCard.svelte`. The move makes it false, and item 14 lists G28, G32, G139 and G140 only.
- The action id `edit`: `sed -n 60,175p src/lib/views/shared/card/record/record-menu.ts`, and `entry-actions.ts`.
  - `edit` is already Edit in File on every entry and registry card (`entry-actions.ts`, `editAction`).
  - `pickAction` runs the first action of an id, and `stripActions` takes the first. So item 6's Edit row needs a new id.
  - A new id is placed by `RUNS` in `record-menu.ts`; without a change there it falls after `cloned`, in another place than the project card's row.
  - `record-menu.ts`'s head comment ("Edit Manifest or Edit in File") goes false. The file is not in the paths.
- The new catalog file `config/text/views/boards/listing.yml`: `grep -n CATALOG_FILES tests/checks/config/config-folder.test.ts`. Line 291 is the list and line 409 is `expect(names).toEqual(CATALOG_FILES)`, an exact list. The test imports no moved file, so "the tests that import a moved file" does not cover it.
- Generated diagrams: `git show --stat --format=%s 29fe4a2d4 -- docs/diagrams` shows 10 changed files there on the last landing, whose brief also omitted them; `docs/diagrams/layer-views.dot` carries import counts per folder. Verify 1 runs `npm run diagrams`, so the step changes `docs/diagrams/`, which is not in the paths ("The step writes these paths and nothing else").
- Tests the brief asks to change: "a row is added to its table test" for G32 (`.scratch/migration/agents/guarded.md:277` names `src/lib/data/snapshot/` and `record-fields.ts`), but no test path of G32 is in the paths.
- `manifest_schema.sections`: `git grep -n 'manifest_schema\b\|\.sections\b' -- src tests bin utils docs README.md`. `src/lib/data/sources/config/merge/hub-layer.ts:389,456` also reads it and holds a hub's `manifest_fields` rows to it. The new names mean a hub row with `section: Strategy` stops being a finding and draws in the project form. No sentence goes false, but the behaviour of a config key changes and the brief does not say so. "eight groups": only `config/schemas/manifest-schema.yml:7`, in the paths.
- `editor.none` and `editor.unknown`: `grep -n 'unknown\|  none' config/text/views/boards/editor.yml`. Lines 15 and 32 say "No project chosen. Open the editor from a project card." and "The snapshot holds no project with the id {0}." The file is in the paths, but no item changes them, and both go false for an entry's editor tab.

Findings:
1. FOR AXEL, stops the step: `src/lib/data/snapshot/schema/record.ts` must gain `section` or every row of the hub patch is a finding of the schema of a schema. The step cannot reach its goal without this path. The same record's `$ref` for `fields:` makes a nested `section:` accepted while item 1 says a nested row has none, so the key must be allowed at the top level only, or the rule dropped.
2. `docs/templates.md`'s key list needs a `section` line. In the paths; item 1 or 14 should say so.
3. FOR AXEL: six stale sentences outside the paths: `EntryForm.svelte:5-6`, `form-draft.ts:3-4`, `page-file.ts:1`, `normalise-parts/career.ts:3`, `sources/documents/career.ts:1`, `config/text/palette-page.yml:25`. The rules file makes each a defect of the change.
4. `guarded.md:220` (G137) is missing from item 14's list.
5. FOR AXEL: `src/lib/views/shared/card/record/record-menu.ts` is needed for the Edit row.
6. FOR AXEL: `tests/checks/config/config-folder.test.ts` is needed for `listing.yml`. Item 14's allow-list rule then applies.
7. FOR AXEL: `docs/diagrams/` is regenerated by Verify 1 and not in the paths.
8. FOR AXEL: the G32 test file is not in the paths, and neither are `tests/data/sources/career.test.ts`, `tests/state/forms/form-draft.test.ts`, `tests/state/forms/page-entry.test.ts` and `tests/state/forms/entry-save.test.ts`, should any change.
9. `editor.none` and `editor.unknown` need words for every record.
10. The widening of `manifest_fields` sections is unstated; it should be a decision of the brief.

## 2. The step line

- "the project page and the project editor, exactly as they look and behave now, become the one page frame and the one editor, and the project uses them too": items 4, 5. Partly: see the findings.
- "The person page, the entry page (...) and the Career view are rebuilt on them": items 7, 8, 9.
- "on each page the record's card opened out at the top, then its sections, and no form on the page": items 4, 7, 8, 9.
- "each record edited in the editor tab": items 5, 6.
- "The person page draws its projects and Waiting on as project cards": item 8.
- "Career is a page (...)" and "its file is edited in the editor with the sections Strategy, Positions, Degrees, Awards, References and Profiles": items 9, 13.
- "The Archival, Orphans and No funding cards open a page in the frame with their projects as cards, and no editor": item 10.
- "A LinkedIn post opens a page in the frame with the post rendered, its Edit opening the text file": item 11.
- "Inbox threads and search results keep no page": item 12.
- "Every collection schema gets real editor sections (`section:` on its rows)": items 1, 2, 13.
- "their names drafted by the orchestrator and approved by Axel before the build": ruling 594, `plan.md:3354`, the names only.
- "Built once O101 has landed": `grep -n '^- \(<check mark>\|\[.\]\) O10[0-9]' .scratch/migration/plan.md` (the first character of the pattern is the <check mark> glyph) shows `- [x] O101`, line 1194.

Findings:
1. "exactly as they behave now" for the project page: `Project.svelte` line `<div class="project" ... oninput={typed}>` keeps a preview tab when the reader types (`keepPreview`). Item 4 lists the Pane, column, Surface, font rule, snippets and data attributes, and no input handler. A frame built to that list loses the behaviour.
2. "exactly as they behave now" for the project editor: item 5 says everything of `EntryEditor` "comes across" and names no kind. The project editor today has no block on Save, shows a refusal as a line under the form (`editor.refused`), and has no required reminder although Tier and Stage are `required: true`. The brief does not say these stay as they are for a project. Taken as written, a builder changes the project editor.
3. "the names approved": `git grep -n 'cv_section, cv_rank' -- .scratch ':!.scratch/migration/agents/briefs/O104.md'` printed nothing, and `orchestrator-state.md:174` says only "as drafted". The field-to-section table the brief calls "the table Axel approved" and "the table of open item 594" is on the tree only in this brief. Ruling 594 records names, not placements.

## 3. Premises

- `ls docs/adr`: "No such file or directory", exit 1. Matches.
- `wc -l`: Project.svelte 242, Editor.svelte 340. Matches. `ProjectCard.svelte:187` is `openBeside('editor', recordField(item.id))`. Matches.
- `git grep -n EntryEditor -- src`: `Person.svelte:332`, `Entry.svelte:355`, `Career.svelte:98`. Matches. `git grep -n EntryEditor -- tests` printed nothing. Matches.
- `EntryEditor.svelte` read whole: `blockedBy`, refusals under a field, `empty`, the feed partial save. Matches.
- `PageEntry` and `formFieldOf`: `section: ''` at `record-fields.ts:40`. Matches.
- `SchemaField` at `model-collections.ts:209`, no `section`; `field.ts` keeps only its named keys. Matches.
- `manifest-schema.yml:31` `sections:`, eight names; `git grep -n manifestSections -- src tests`: only reader `Editor.svelte:110`. Matches, but the brief omits the two other readers of the map: `hub-layer.ts:389` and `schema.ts:154`.
- 17 hub files: `yaml.safe_load` over `~/workspace/research-hub/.oculus/data/**/*.yml` gave the same 17. The table holds every field of every file, none missing, none extra, none doubled. `venues` has 20 fields. Matches.
- `ls -d ~/workspace/*/.oculus/data`: research-hub only. Matches.
- Fixture and templates "hold schemas too": `git grep -ln '^ *- { field: '` printed the fixture's files and `docs/templates.md`, and also `config/schemas/cpp-schema.yml`, `deck-schema.yml` and test files. A load of the fixture gave 15 of the 17 with `schema:`; `leads.yml` and `radar.yml` have none. Differs: see the findings.
- `git diff -- .oculus/data/academic/applications.yml | grep -c 'field:'` in the hub printed 0; `--stat` 3 insertions, 2 deletions. Matches.
- People cards and `pageView`: `page-entry.ts:118-127`; `Person.svelte` read. Matches.
- Registry cards through `registry-card.svelte.ts`: imports read in all four. `Entry.svelte` draws `EntryCard`; LeadCard and RadarCard with `page` at about line 325. Matches.
- `Pillars.svelte:151,158`, `Collection.svelte:451,505`, no `ontitle` on the three cards. Matches.
- `PostCard` has no `ontitle`; `LinkedinEntry.body`; `blockMarkdown` at `src/lib/ui/html.ts:485`; `openLinkedinSource` in `post-card.ts`. Matches.
- `tests/checks/tree/boundaries.test.ts:28-36`. Matches.
- Folder counts by `ls | wc -l`: 10, 10, 4, 8, 8, 5. Matches. The brief omits `ls src/lib/state/forms | wc -l`, which printed 10.
- `stateId` at `instance.ts:285-299`; `entryPageState`. Matches. `{ id: 'career' }` cannot collide with a project's editor state, which holds `hub` and `key`.
- Tests naming the changed code: `git grep -ln 'form-draft\|page-entry' -- tests` printed 8 files: the brief's three, and `tests/state/forms/entry-save.test.ts`, `tests/state/client/created-ids.test.ts`, `tests/data/helpers/hub-names.test.ts`, `tests/data/hubs/hub-portfolio.test.ts`, `tests/checks/tree/layer-rows.ts`. Differs.
- `award` correction: `funding` table row has it. Matches the hub. "The table of open item 594" could not be read: see section 2.

Findings:
1. FOR AXEL, stops the step: `src/lib/state/forms` holds 10 items, so `src/lib/state/forms/editor-target.ts` makes 11 and breaks the rule of ten items in a folder. The rules file then asks for a split, and the importers of the moved files widen the paths.
2. The fixture hub has no `schema:` in `leads.yml` and `radar.yml`.
3. The test list is incomplete by five files.

## 4. Cases and checks

- Project page and editor before and after: consistent.
- A venue's page; venue's editor; application's editor: consistent, and the sections match the table.
- A person's page: consistent.
- A lead's and a Lit Watch paper's page, a save through `feed-field`: consistent. The write path is unchanged code; the case checks that `savePage` still reaches it.
- Career; career with no schema: consistent. "Write the website unchanged" asks about a place the step does not change.
- Archival, Orphans, No funding; LinkedIn idea; removed post: consistent.
- Schema row with no `section:`, row naming an unlisted section: consistent. Drawing a row under Other is not older-form code under the rules file's No migration rule, since `section:` is an optional key and the field stays visible.
- Close over an edit, reload; unsaved source text; refused field; required field; two hubs; Add person: consistent.
- Save that changes an entry's key: see finding 2.
- Entry of a file with no schema: see finding 1.
- Inbox thread and Literature search hit: asks about places the step does not change.

Findings:
1. "An entry of a file with no schema: its card has Edit in File and no Edit row, and its page draws no error." This is false twice on the tree.
   - `entry-actions.ts`, `entryActions`: "A file with no schema has no identity to write by, so its cards carry the file's lifecycle statuses and no pin, Edit in File or Delete"; `recordActions` returns `[]` for an undefined schema.
   - `page-entry.ts:303-310`: `pageOf` returns null with no schema, so `Entry.svelte` draws `entry.unknown`, while `Collection.svelte:485` hands `onpage` unconditionally.
   - Either the case is rewritten to what the code does, or building it is a new requirement (FOR AXEL).
2. "A save that changes an entry's key: the editor tab and the page tab both move to the new key." No Save can do this. `pagePayload` skips `page.fixed`, which holds the primary key; a file with no primary key takes no write; and `python3` over the hub's `leads.yml` and `radar.yml` shows `title` flagged `primary_key` in both, so `title` is fixed there too. The case is read and passes with nothing exercised. The reachable input is a save that changes the title of an entry whose title is not its key (a venue's `name`), which moves the tab's label.
3. Places the step does not change, as check 4 asks to name: the inbox thread and search hit case; "Write the website unchanged".

## 5. The question

The goal: one page frame and one editor, the project's, for every record, looking and behaving exactly as the project page and project editor do now.

- Project page and editor before and after: yes. It names blocks, order, gaps, tint, toolbar and status bar, nothing of behaviour; see 2.1 and 2.2.
- Venue's page and venue's editor: yes for the look, since both are read and looked at. Passes with the card's long text clamped unless the look catches it. No for the sections.
- Application's editor: no.
- Person's page: yes. Project cards with no `onmore` draw the ELI5 whole (`ProjectCard.svelte` Props: "a card given none draws the ELI5 whole with no control"), which differs from "closed as a board draws them" (`Projects.svelte:307-308`). Same for item 10.
- Lead and Lit Watch page: no.
- Career: no. Career with no schema: no.
- Sets: yes. "opened twice, one tab" passes with an empty page for zero projects; see section 6.
- LinkedIn idea: yes. It passes after a Mark posted that leaves the page on a gone file; see section 6. Removed post: no.
- Row with no section; row with an unlisted section: no.
- Close and reload, unsaved source text, refused field, required field, two hubs, Add person: no.
- Save that changes a key: yes, it cannot be exercised (4.2).
- No-schema entry: yes, it reads as passed or wrong with nothing built (4.1).
- Inbox and search: yes, the step does not touch them, so they prove nothing about the goal.
- The check on the step's line (the plan line carries no command): yes. Verify is the only check.
- Verify 1, `npm run test:quick`: yes. No test draws a view, and whether the demo fixture's `section:` turns a test red over `record.ts` is not verified. The landing patch to the real hub comes after it.
- Verify 2, `git grep -n "EntryEditor"`: yes. It proves the file is gone, not that its behaviour came across.
- Verify 3, `grep -c "section:"`: yes. One row per file passes it. The dry run proves the patch applies, not that each row carries the table's section or that every row has one.
- Verify 4 and 5: yes. They judge tests and sentences, not the goal.
- Items 1, 2, 3: no for the reader, once a row is added under G32 (the test path is missing, 1.8). Yes for the schema of a schema (1.1), which no check names.
- Items 4 to 12: yes. Each is checked by reading and by the look on landing only, as the rules file allows for views. The look is the one gate on "exactly". Item 5's behaviours rest on cases read from code.
- Item 13: yes, as Verify 3.
- Item 14: yes. Nothing checks it beyond the rules file's grep.

Findings:
1. Verify 3 can pass with rows unmapped. A row-for-row count of `field:` against `section:` in each file, a fact a command computes, closes it, and the report can quote it.
2. Case 1 needs behaviour: the keep of a preview tab, Save, Revert, a refused field as a line, no reminder, folds kept.
3. Person and set pages need a stated answer on the ELI5 clamp.
4. Cases 4.1 and 4.2 can pass with nothing exercised.

## 6. Implied inputs

- Mark posted from the post's page: missing. `PostCard` keeps `posted` in its strip and the file goes from `xx-*.md` to a numbered name (`isLinkedinIdea`, `LinkedinPostWrite`), so the key in the tab's state names a gone file and the page shows "gone from the feed" for a post that exists. Expected: the tab moves to the numbered file, as `Entry.svelte`'s `$effect` moves a page.
- An entry deleted while its editor tab is open: missing, and new with this step, since the form used to go with the page. Expected: the Empty line in words that fit an entry, the close asking while the draft has words (`draftDirty` with `values === null`).
- A file with no primary key or an identity fault: missing. Only unsaved text is a case; `blockedBy` also takes `fault`. Expected: the Edit row opens, Save is off with the fault's words.
- A person of a people file with no schema (`join.person` set, `page` null): missing. Today the page draws. Expected: the card, the sections, no Edit, no `entry.unknown`.
- The Orphans card with no orphans: missing. It is drawn with `pillars.no_orphans`, and item 10 gives it `ontitle`. Expected: a page with an `Empty` line, or no `ontitle`. A set emptied while its page is open: the same.
- Saved Entry, Person and Career tabs holding a `draft` at landing: missing. No form draws it, and `draftDirty` still asks at close. The rules file bars migration code. Expected: stated by the session; the edit stays unseen until the close discards it.
- `section: ""`, and a schema section named `Other`: missing. The rules file asks for empty and colliding keys. Expected: an empty text reads as no section; a section named Other joins the one group, not two groups with one fold key.
- A hub collection keyed `listing` or `post`, the new view ids: missing. Rules file: every id is checked against reserved keys. Expected: the finding `viewIdProblems` gives (`src/routes/views.ts:198`); not verified that it covers these.
- Edit pressed twice, from the page and from the card: missing. Expected: one editor tab, by `stateId`.
- A section-less template row: `followup` in five templates of `docs/templates.md` (Funding, Talks & Events, Education & Service, Applications, Tasks) and `used_by` in the fixture's `data.yml` have no row in the table. Missing from "the same mapping". Expected: a stated section, or Other by item 3 as a choice.
- A schema row with no `section:`; a row naming an unlisted section; two hubs one key; a post removed; a career file with no schema: listed.

Findings: each line above marked missing.

## 7. ADRs

- `ls docs/adr`: "No such file or directory". `grep -n adr .agents/plan.yaml .scratch/migration/orchestrator-state.md` printed no adr key in those lines. No record.

Findings: none.

## 8. Dictated text

- `Other`, the catalog word: `grep -n '`editor.other`' .scratch/migration/agents/briefs/O104.md` finds line 39. Holds. It is ASCII, in the group `editor`'s one file, and has a reader.
- The ordered list "Core, Indexing, Content, Connections, Dates, Recovery, "Deposit & compute", Outcome, "Overrides (rare)", Website, Strategy, Positions, Degrees, Awards, References, Profiles": `grep -n 'Core, Indexing, Content' .scratch/migration/agents/briefs/O104.md` finds line 37. Holds; every name is in ruling 594 or already in the file.
- The table's section words: `grep -n '^| ' .scratch/migration/agents/briefs/O104.md`. Holds for the words; each is a name of the list above.
- The comment at `manifest-schema.yml:7` "is corrected": no words given, so not dictated.
- The ids `listing`, `post`, `listing:<set>`, `archival`, `orphans`, `no_funding`: identifiers, line of items 10 and 11. Holds; see section 6 for the collision check.

Findings: none.

## Declined to judge

- `plan.md` has no Goal heading (`grep -n '^## ' .scratch/migration/plan.md` shows Steps, Could run in parallel, Rulings, Agents, Blocked). I used the goal the prompt states.
- The look itself: no page was opened, by the task's bar on ports and the rules.
- Whether the rules file's "You never edit anything under `.scratch/`" conflicts with the two `.scratch` paths in the write list: O101 and O102 carry the same form. It is the session's call.
- Decisions 3 to 6 of the brief are user-visible shapes listed as reversible. Whether each needs Axel before the build is his or the session's.
- Whether item 11 should draw through `views/shared/prose/RenderedMarkdown.svelte`, which takes `text` and carries the document styles, in place of a direct `blockMarkdown`: I raise it as a question of reuse. `blockMarkdown` already sanitises, but alone it carries no document styles. The builder's reuse grep should settle it.
- Whether a fixture row with `section:` turns a test red before `record.ts` is changed: not run, since this is a read-only check.

Agent usage: a566ce9e7d193844e, claude-opus-5-5, 296680 tokens, 40 tool uses, 13.2 minutes.

## Closed (the session's change to the brief for every finding above, and each dictated line added after the check, made before the preparation commit)

- 1.1: `record.ts` added to the paths; item 1 lets the key through `SCHEMA_FIELD` and reads it at the top level only. Internal widening, ruling 374 (a).
- 1.2: item 1 names the key list of `docs/templates.md`.
- 1.3: item 14 lists the six sentences; their files added to the paths.
- 1.4: G137 added to item 14.
- 1.5: `record-menu.ts` added to the paths; item 6 gives the row its own id. Internal widening.
- 1.6: no catalog file is added; the words join the `project` and `linkedin` groups, so `config-folder.test.ts` is not changed.
- 1.7: `docs/diagrams/` added to the paths.
- 1.8: the test files added to the paths.
- 1.9: item 5 words `editor.none` and `editor.unknown` for any record.
- 1.10: item 2 and decision 8.
- 2.1: item 4 carries the preview-tab keep.
- 2.2: item 5 and decision 9 keep the project's editor as it is.
- 2.3: "What is on the tree" says where the table stands.
- 3.1: the helper goes to `views/boards/editor/editor-target.ts`, so `state/forms` stays at ten.
- 3.2: item 13 says 15 fixture schemas.
- 3.3: the premise lists the eight files.
- 4.1: the case rewritten to what the code does.
- 4.2: the case rewritten to a venue's `name`.
- 4.3: the inbox case and "Write the website unchanged" removed.
- 5.1: Verify 3 leaves the row-by-row check to the orchestrator at landing.
- 5.2: the first case names the behaviour.
- 5.3: items 8 and 10 state the clamp.
- 5.4: as 4.1 and 4.2.
- Section 6: each missing input is a case and a requirement of items 2, 3, 5, 6, 8, 10, 11, 13; each serves a part of the step's line, so the step is not widened. The saved draft is decision 10.
- Declined, `RenderedMarkdown`: item 11 uses it.
- Dictated line added after the check: "Other" for a section so named reuses the word already checked; no new text is dictated.
