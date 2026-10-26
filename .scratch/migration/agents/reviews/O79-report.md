# O79 builder report: primary and foreign keys

NOT done: check 1 is not met. Items 1 to 6 and all 23 cases are built and pass, but the one verify-list run after the last change exited 1: every stage passed except the slow tier, where 'the portfolio of several hubs > holds every record of both hubs, each under the name of its hub's folder' (`tests/data/hubs/hub-portfolio.test.ts`) timed out at its 20 s limit. Run alone it passes in about 2.6 s in the worktree and 2.1 to 2.5 s on the base copy (check 1 below). A judgment: the parallel run's load caused the timeout, not the change. The list was not run a second time, since the brief allows one run after the last change.

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md:176-180`:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

- none.
```

## The ruling carried

`.scratch/migration/agents/briefs/O79-cases.md` rules five points, each built:

1. Option (a) for case 15: oculus's own `leads` and `radar` entries of `config/defaults/sources.yml` carry no `primary_key:` (`grep -n "primary_key" config/defaults/sources.yml` prints only the head comments at `:32` and `:34`, which say what the key does and that "The entries below carry none, since they describe no file"); the demo hub's entries carry `primary_key: title` (`tests/fixtures/hubs/demo/.oculus/config.yml:24-25`); the hub rewrite and `docs/templates.md`'s leads and radar schemas flag `title`. Item 1's "beside" rule stands whole (schema-rules row "an entry's primary_key beside the schema's flag", writes-collection row "refuses every write to a file with an entry's primary_key beside the schema's flag (G8)"). Case 15 passes as written, and the two added after-runs are below (case 15 and case 15b).
2. Case 18's data Add: `collectionText` (`src/lib/server/files/fs/collections.ts`) reads a file whose one key beside `schema:` holds nothing as an empty collection under that key; the comment says so. Case 18's after-run: `data | add {"key":"case-eighteen","name":"case-eighteen"} | found true | changed ["datasets"] | refused []` and `venues | add {"id":"case-eighteen","name":"case-eighteen"} | found true | changed ["entries"] | refused []`.
3. 18 `schema:` blocks of `docs/templates.md` carry the flag: `awk '/^schema:/{s=1;f=0;next} s&&/^[a-z]/{print f; s=0} s&&/primary_key: true/{f++}' docs/templates.md | sort | uniq -c` prints `1 0` (the career file) and `18 1`.
4. The readers outside the path list are changed and named in "Files with line counts", each with its reason.
5. `REGISTRY_SHAPES` is changed inside `hub-names.ts:795-815`; its `idField` column is gone.

### What the first run handed back: case 15

The rules, as the brief states them:

- Item 1: "A file with no schema names its primary key on its `collections:` entry as `primary_key: <field>`" and "An entry's `primary_key:` beside a schema flag, the same field or another, is a finding naming both, and the file's writes are refused." It also says "leads and radar are collections and take their primary key from their file".
- Item 3: "the demo hub's ... `config.yml` `collections:` entries for leads and radar (`:24-25`), whose files have no schema, carry `primary_key: title`; so do oculus's own `leads` and `radar` entries in `config/defaults/sources.yml:50-51`."
- Item 4 (the hub rewrite): "the primary key carries `primary_key: true` (`venues` on `id`; `leads` and `radar` on `title`; ...)".
- Case 15: "the hub with your rewrite applied in a scratch copy: `OCULUS_TEST_HUB=<scratch copy> npx vitest run tests/checks/config/integrity.test.ts` ('validates with no findings', `:201`) passes".

What the hub reads, run on the unchanged tree:

- The hub names no `collections:` list. `grep -n "collections\|^[a-z_]*:" ~/workspace/research-hub/.oculus/config.yml` prints only the comment line 3 and the top-level keys `scan`, `new_project_dir`, `portfolio_deck`, `audit`, `linkedin_dir`, `docs`, `lint`, `slurm`, `wallpaper`, `leads_fit`.
- So its `collections:` list is oculus's own. Case 15's program over the scratch copy of the hub prints `the collections list comes from: sources.yml`, and the entries it reads its feeds by are oculus's: `entry leads | file .oculus/data/academic/leads.yml | primary_key undefined` and `entry radar | file .oculus/data/literature/radar.yml | primary_key undefined` (undefined today; item 3 makes them `title`). In code, `portfolioConfigFrom` (`src/lib/data/index.ts:176`) reads `collectionFiles(merged.collections, ...)`, the merged list being oculus's when the hub sets none, and `feedFile` (`:189-192`) takes the leads and radar entries from it.
- The hub's leads and radar files carry schemas whose first field is `title`: `grep -n "^schema:" -A12` gives `.oculus/data/academic/leads.yml:54-55` `schema:` then `- { field: title, label: "Title", type: text, ... }`, and `.oculus/data/literature/radar.yml:14-15` `schema:` then `- { field: title, type: text, required: true, ... }`.

The result: with items 1, 3 and 4 built as written, the hub's `leads.yml` and `radar.yml` each hold a schema flag `primary_key: true` on `title` while the `collections:` entry the hub reads them by (oculus's own, `sources.yml:50-51`) carries `primary_key: title`. Item 1 makes each a finding naming both and refuses the file's writes, so the integrity case gives at least two findings and case 15 fails; the lead writes of the Position Leads view and the Lit Watch writes of the real hub are refused besides. No build of the three items as written passes case 15, and dropping any one of them is a departure from the brief, so the choice is the orchestrator's.

Options, each a reading of the brief that makes case 15 pass:

- (a) Oculus's own `leads` and `radar` entries of `config/defaults/sources.yml:50-51` carry no `primary_key:`; the demo hub's entries (`tests/fixtures/hubs/demo/.oculus/config.yml:24-25`), whose files have no schema, carry `primary_key: title` as item 3 says; the hub's and the templates' leads and radar schemas carry the flag as item 4 and item 3 say. A hub that names no list and holds a leads or radar file with no schema gets the finding of a file with no primary key. Pro: the primary key lives in the file's schema wherever the file has one, which is ruling 392's order ("for a file with no schema its `collections:` entry names it"); every rule of item 1 stands unchanged. Con: oculus's defaults no longer name a key for a schemaless feed file; a hub with such a file must add a schema or its own entry.
- (b) Oculus's entries keep `primary_key: title` and the hub rewrite leaves the hub's leads and radar schemas unflagged. Pro: a schemaless feed file of any hub keeps working with no entry of its own. Con: the hub's leads and radar are the only entries files whose key is not in their own schema, the templates' leads and radar scaffolds must then be unflagged too, and a hub that later lists its own entries loses the key with no warning beyond the finding.
- (c) The "beside" finding is given only when the entry is the hub's own and names another field than the flag. Pro: no file changes. Con: it narrows item 1's rule ("the same field or another") and adds a case to the reader that depends on where an entry came from (the lazy option, since it keeps the clash and hides it).

Recommended (a), a judgment: it keeps every rule of item 1 and every ruling's wording, and moves one default to the place ruling 392 gives a key for a file that has a schema.

## The cases' first run, on the unchanged tree (base a11f9f14, before any change)

Programs 1, 9, 10, 15 and 18 ran through `npx vitest run --config <scratchpad>/o79/vitest.config.mts --root <scratchpad>/o79 caseNN` from the worktree's root, after `npx svelte-kit sync` (which writes the git-ignored `.svelte-kit/` the worktree's `tsconfig.json` extends). Their sources and full outputs are in "The case-run programs". The other cases were read in the code; each names the lines read.

1. Run (case01). Every collection card heading, every entry page's title, fixed field and write id, the choices of every select, chips and tags field with a source or options of the project form and of each collection's form, the reference index's counts (`total | references 114 | definitions 44`) and an edit, a remove and an Add on the first entry of each of the 15 collections, all `found true` with no refusal. The leads and radar entries of the demo hub have no entry page today (`leads | demo:Postdoc, Robust ML | no page`): `feedPage` (`src/lib/state/forms/page-entry.ts:196`) answers null for a feed file with no schema.
2. Read. `sourceChoices` (`src/lib/state/forms/schema.ts:298`) gives the venues `recordChoices(entities?.venues, ['short', 'name'], root)`: a venue with `short` shows it, one without shows `name`, the value is `keyOf(id)`, the registry's `id`. No schema rank is read: a venues schema ranking `name` first still shows `short`. Case 1's run shows the demo venues by name, since none has a `short` (`venue | select | "venues" | iclr:ICLR::, ...`).
3. Read. A schema with no flag is today's every schema: `identityField` (`record-fields.ts:21-24`, `server/files/fs/collections.ts:51-54`, `validate.ts:390-394`) takes the first field, there is no finding, and writes are allowed (case 1's writes).
4. Read. `primary_key` is no key of `SCHEMA_FIELD` (`src/lib/data/snapshot/schema/record.ts:315-391`, `additionalProperties: false`), which the gate checks every data file's `schema:` block against through `frame()` (`schema/hub.ts:23-30`), so each flag is a `findings.schema.not_declared` finding on its key; `fieldOf` (`schema/field.ts:131-144`) does not read it, and writes still address the first field and are allowed.
5. Read. `foreign_key` is not read by `fieldOf` and is a `not_declared` finding in the schema block; the field offers no choices (`choicesFor`, `schema.ts:285`, returns its options alone for no `from`) and its value is no reference (`specs.ts:53-54`). The events file defines no key (`build.ts:110-114` defines only the eight registries; case 1 prints `academic/events.yml | references 0 | definitions 0`).
6. Read. `foreign_key: nowhere` gives the `not_declared` finding and no choices; today's `from: nowhere` gives `findings.schema.bad_from` (`record.ts:100-106`).
7. Read. `display` is not read anywhere and is a `not_declared` finding; choices are labelled by the fixed field lists of `sourceChoices` (`schema.ts:298-306`).
8. Read. `from: people` is today's form: no finding, the field offers the people (case 1: `joint-work | person | select | ["people"] | b-coauthor:B. Coauthor::, ...`).
9. Run (case09). The planted derived source reads as `retrieval: [{"kind":"derived","from":["synthgraph"],"script":"code/prep.py"}]`, the Data view's line is `Built from synthgraph by code/prep.py`, `findings on data.yml: 0`, and `synthgraph` is a reference with the sources `datasets`.
10. Run (case10) and read. A `primary_key: title` on the demo's leads entry is read with the entry (`"primary_key":"title"`) and gives no finding on the settings file (`findings on the hub's settings file: 0`); the feed writer addresses a lead by `FEED_RULES.leads.identity`, `"title"`, from `FEED_IDENTITY` (`src/lib/data/snapshot/hubs/feeds.ts:24-28`), never from the entry; `writeFeedField(leads, "Postdoc, Robust ML", status, declined)` gives `changed ["status"]`. Read for the test half: a collection with `primary_key: true` on `key` and `display: 1` on `name` today addresses its entries by the first field (`key` when it is first), and its card is headed by `entryTitleOf` (`model-collections.ts:73-75`: `title`, else `name`), so a person's card shows the name.
11. Read. A venue edit is addressed by the first field (`identityOf`, `collections.ts:148-155`) with the `id` guarded by `KEYED_FIELDS` (`writes/entries.ts:328`, `collection-text.ts:30`), which names the collection key `venues`: a collection keyed `journals` with the venues registry gets no `id` guard, and its entries are addressed by its first field.
12. Read. `askFields` (`new-entry.ts:31-38`) asks a venue `[identity, id]`, `['name', 'id']` for the hub's venues (first field `name`), and a person `[key]` alone; the required fields are not asked.
13. Read. `manifestField` is a `z.strictObject` (`src/lib/data/shapes/catalog-files/manifest.ts:26-44`), so a `manifest_fields` row with `foreign_key: people` is refused by `manifestFieldRow` and is the finding `findings.config.manifest_field_shape` with the row left out (`hub-layer.ts:463-471`); a row with `from: people` is taken and offers the people.
14. Read. A rename of a person key edits every value of a field whose `from` names `people` (`references/rename.ts`; G67's row 'a domain key, the domains registry entry and the domain of each manifest' covers the same path for domains). A field written `foreign_key: people` is no reference today and would not be edited.
15. Run (case15 and the integrity case). Over the scratch copy of the hub, not rewritten: `OCULUS_TEST_HUB=<scratchpad>/o79-hub npx vitest run tests/checks/config/integrity.test.ts --reporter=verbose` gives `Tests  14 passed (14)`, among them `the real hub > validates with no findings 4781ms`. The program prints `schema lines holding from: 29`, `primary keys: none` for every file, `foreign keys naming nothing: 0` (there is none), and the leads and radar entries read from oculus's `sources.yml`, as quoted above. The rewrite was not applied, since its leads and radar lines are what the contradiction is about.
16. Read. A manifest `venue:` naming a venue's `name` is the finding `findings.schema.no_key` with `x-from` `venues`, since the venues list holds the registry keys (`schema/lists.ts:63-74`, `registries.ts:97`); schema-rules' row 'a reference to a key that does not exist' is the same rule.
17. Read. A bookmark is addressed by `BOOKMARK_IDENTITY = 'label'` (`src/lib/server/files/fs/bookmarks.ts:33`) and by its schema's first field `label` (`collections.ts:51-54`); add, rename and remove are allowed.
18. Run (case18). The new hub's build gives five findings, all `scan | scan directory does not exist` for the five scan folders the hub does not have; every collection's Add is allowed but two: `venues | add {"name":"case-eighteen"} | ... | refused [{"field":"id","reason":"a new entry needs a non-empty id"}]` (the program gives the identity field and the required fields, and the venues template's `id` is not required), and `data | add | no file read`: `readCollection` answers null for the data template, whose list key `datasets:` holds no entry, since `collectionText` (`collections.ts:130-133`) takes an empty list key as one only when it is `entries:`.
19. Read. An entry's `primary_key:` is read with the entry and gives no finding (case 10's run); a flag on a tags field and `primary_key: "yes"` are `not_declared` findings of the schema block; writes are allowed.
20. Read. `foreign_key: []` is a `not_declared` finding and offers nothing; a target with no primary key does not exist as a notion today.
21. Read. A collection keyed `projects` is no finding (`readList`, `hub-names.ts:378-431`, gives `view_id` only for the six view ids of `REGISTRY_VIEWS`).
22. Read. `recordChoices` (`schema.ts:223-244`) offers the entities of the snapshot's `people` table, joined across hubs by the registry, whatever each hub keys its people collection; each is stored by its own hub's key.
23. Read. A venue with `id: ""` gives one finding, `findings.registries.entry_no_id` (`registries.ts:97-104`); `checkEntryIdentity` (`validate.ts:439-452`) checks the hub's venues by `name`, their first field, and no other rule sees the empty id. A venue with no `id` key also gives `findings.schema.required` where its schema marks `id` required, two findings.

### What the first run said that the after-run corrects

- Case 11's reading said a collection keyed `journals` carrying the venues registry "gets no `id` guard, and its entries are addressed by its first field". The new row 'edits a venue by its id when the hub keys the venues collection journals' passes on the unchanged tree (quoted below), so the unchanged tree already addressed that collection by `id`.
- The first run's "Readers of the identity the brief's write list leaves out" and "Found by case 18's run" are now built under rulings 4 and 2.

## DONE / NOT DONE

### Items

| Item | State | Proof |
| --- | --- | --- |
| 1, `primary_key: true` | DONE | `primaryKeyOf` (`src/lib/data/model/model-collections.ts`) is the one function; check 4's grep below holds no `TITLE_FIELD`, `identityField`, `KEYED_FIELDS`, `idField`, `BOOKMARK_IDENTITY` or `NAME_FIELD`; the G56 and G8 rows below |
| 2, `foreign_key:` and `display:` | DONE | check 5's greps below; the G132, G128, G66 and G56 rows below |
| 3, oculus's and the demo hub's schemas | DONE | ruling points 1 and 3 above; case 1's after-run |
| 4, the hub rewrite | DONE | section "Hub rewrite"; case 15 after-run |
| 5, docs and comments | DONE | check 8 below; check 6 prints nothing |
| 6, tests | DONE | the rows below, each run on the unchanged tree and after |

### The cases after the change

| Case | State | Proof |
| --- | --- | --- |
| 1 | DONE, two lines differ (see "wrong or impossible") | `diff case01.out.txt case01.after.txt`: the datasets choice line's source word `"datasets"` becomes `"data"` with the same five choices; definitions rise from 44 to 61 (statements 0 to 3, events 0 to 3, education 0 to 2, applications 0 to 2, joint-work 0 to 2, tasks 0 to 3, literature 0 to 2); references stay 114; every card heading, title, choice, edit, remove and Add line is the same |
| 2 | DONE | choices.test 'shows a venue by its short, one with no short by its name, and stores its id (G132)' and 'shows a venue by its name when the venues schema ranks name 1 (G132)' |
| 3 | DONE | schema-rules 'gives the findings of a schema that flags no primary key' (`findings.schema.key_none`); writes-collection 'refuses an edit, a reorder, an Add and a remove of a file with no primary key'; writes 'refuses an Add to a file whose schema flags no primary key (G8)' |
| 4 | DONE | schema-rules '... a schema that flags two' (`key_two`, 'key, title'); writes-collection 'refuses every write to a file with two flagged fields (G8)' |
| 5 | DONE | choices 'offers the events by their display and stores the key (G132)'; references "finds 'a select naming a collection that is no registry, an event by its key (G66)'" |
| 6 | DONE | schema-rules '... a foreign key naming nothing' (`bad_foreign_key`); choices 'offers nothing for a key that names no collection (G132)' |
| 7 | DONE | schema-rules '... a target of a foreign key whose schema ranks no field by display' (`display_none`), '... two fields of one display rank' (`display_twice`, 'title, note'), '... a display rank that is no whole number from 1' (`display_rank`, '0'); choices 'shows each entry by its primary key when the target schema ranks no field (G132)' |
| 8 | DONE | schema-rules '... a from: left on a schema field'; `fieldOf` (`schema/field.ts:145`) reads `foreign_key` alone, so the field carries no target and offers its own options only |
| 9 | DONE | case09 after-run with `O79_SOURCE_KEY='foreign_key: data'`: `findings on data.yml: 0`, `derived-from line: Built from synthgraph by code/prep.py`, `reference: synthgraph line 19 sources datasets`, the same as the first run |
| 10 | DONE | writes-collection 'edits and removes a person by key, whose display is the name'; normalise 'heads a collection entry by its display field and addresses it by its primary key (G8)'; case10 after-run: `the primary key the feed writer addresses a lead by, read from the file and its entry: "title"`, `changed ["status"]` |
| 11 | DONE | writes-collection 'addresses a venue by its id and writes the short name alone', 'renames a venue through its name and leaves its id', 'removes a venue by its id, the primary key that is not its first field', 'edits a venue by its id when the hub keys the venues collection journals' |
| 12 | DONE | new-entry 'asks the primary key of venues and their required name (G8)' (`['id', 'name']`), 'asks the primary key of a collection keyed by key (G8)'; case18 after-run: the people Add box asks `key, name` |
| 13 | DONE | manifest-fields 'adds a select whose foreign_key names the people, and words a row that writes from (G128)' |
| 14 | DONE | rename "edits 'a flow sequence, a block sequence and a double-quoted scalar'": the joint-work `person` field, `foreign_key: people` (`tests/data/snapshot/reference-hub.ts:119`), changes `"amir"` to `"amir-2"` |
| 15 | DONE | `OCULUS_TEST_HUB=<scratchpad>/o79-hub npx vitest run tests/checks/config/integrity.test.ts --testTimeout 0`: `Tests 14 passed (14)`, 'the real hub > validates with no findings 1884ms'; case15 after-run `schema lines holding from: 0`, `foreign keys naming nothing: 0`, one primary key per entries file; case15b: `findings on the leads file: 1`, the file's finding "the file has no schema and its collections entry names no primary_key, so no entry can be addressed and every write to one is refused" |
| 16 | DONE | schema-rules '... a reference naming a venue by its name rather than its id' |
| 17 | DONE | writes-collection 'adds, renames and removes a bookmark by its label, the primary key of its scaffold' |
| 18 | DONE, see "wrong or impossible" for the five scan findings | case18 after-run: `findings on a file under .oculus: 0`; all 17 collections take an Add with nothing refused (data changes `["datasets"]`; venues, the other 13, leads and radar change `["entries"]`) |
| 19 | DONE | schema-rules "... an entry's primary_key beside the schema's flag", '... a primary key on a tags field', '... a primary_key that is not true', '... a primary key on a field of a records field'; writes-collection 'refuses every write to a file with a flag on a tags field (G8)', '... a primary_key that is not true (G8)', "... an entry's primary_key beside the schema's flag (G8)" |
| 20 | DONE | schema-rules '... an empty foreign key', '... a foreign key naming a collection whose file has no primary key'; choices 'offers nothing for an empty list (G132)', 'offers nothing for a collection whose file has no primary key (G132)' |
| 21 | DONE | schema-rules 'gives a finding naming a collection keyed projects, whose key a foreign key reads as its own target' and the same for `vocab.x`; the manifests stay the target of `foreign_key: projects` (case 15's lines for `related`, `projects` and `project` each print "names a target") |
| 22 | DONE | choices 'offers the people of two hubs that key the people registry people and persons, each by its own key (G132)' |
| 23 | DONE | schema-rules 'gives one finding for a venue whose primary key is empty' |

### The new rows on the unchanged tree, then after

On the unchanged tree: the base copy `scratchpad/o79-base-run` (the base `src`, `config` and `utils`, this worktree's `tests`; `diff -rq <worktree>/tests <base-run>/tests` prints nothing), `npx vitest run <the 12 files> --testTimeout 60000`, the files `tests/state/forms/choices.test.ts`, `tests/data/sources/config/layers/manifest-fields.test.ts`, `tests/server/edit/writes.test.ts`, `tests/server/edit/writes-collection.test.ts`, `tests/state/forms/new-entry.test.ts`, `tests/state/forms/record-fields.test.ts`, `tests/data/snapshot/references.test.ts`, `tests/data/snapshot/schema-rules.test.ts`, `tests/data/snapshot/rename.test.ts`, `tests/state/forms/form-draft.test.ts`, `tests/server/edit/feeds.test.ts`, `tests/data/snapshot/normalise.test.ts`:

```
 Test Files  10 failed | 2 passed (12)
      Tests  48 failed | 164 passed (212)
```

The failing new rows, as printed (`FAIL` and `x` lines):

```
FAIL tests/data/snapshot/schema-rules.test.ts [ tests/data/snapshot/schema-rules.test.ts ]
AssertionError: the catalog holds findings.schema.key_none: expected undefined to be defined
FAIL tests/server/edit/feeds.test.ts [ tests/server/edit/feeds.test.ts ]
Error: Cannot find module '../../../src/lib/server/edit/feeds/radar.ts'
x renames a venue through its name and leaves its id
x refuses a cleared primary key and writes the other fields of the edit   -> expected [] to deeply equal [ 'short' ]
x refuses an edit, a reorder, an Add and a remove of a file with no primary key   -> text key not in config: server.entries.no_primary_key
x refuses every write to a file with two flagged fields (G8)
x refuses every write to a file with a flag on a tags field (G8)
x refuses every write to a file with a primary_key that is not true (G8)
x refuses every write to a file with an entry's primary_key beside the schema's flag (G8)
x shows a venue by its short, one with no short by its name, and stores its id (G132)   -> expected [] to deeply equal [ { id: 'jbi', label: 'JBI' }, ...(1) ]
x shows a venue by its name when the venues schema ranks name 1 (G132)
x offers the same venues when the hub keys the venues collection journals (G132)
x offers the events by their display and stores the key (G132)   -> expected [] to deeply equal [ { id: 'talk', ...(1) } ]
x shows each entry by its primary key when the target schema ranks no field (G132)   -> expected [] to deeply equal [ { id: 'talk', label: 'talk' } ]
x offers a vocabulary list's words by their labels and stores the word's key (G132)   -> expected undefined to deeply equal { id: 'nascent', ...(1) }
x offers the people of two hubs that key the people registry people and persons, each by its own key (G132)
x words a row whose foreign_key names no collection, projects or vocab list and leaves it out (G128)
x adds a select whose foreign_key names the people, and words a row that writes from (G128)
x holds a foreign_key to the vocab lists of the hub's own values, and words one that names nothing (G128)
x asks the primary key of a collection keyed by key (G8)
x asks the primary key of venues and their required name (G8)
x asks the key a file with no schema names (G8)   -> TypeError: (schema ?? []).find is not a function
x asks only the required fields of a file with no primary key (G8)   -> expected [ 'title' ] to deeply equal [ 'name' ]
x is written under the primary key and the display the schema flags (G8)
x finds 'a select naming a collection that is ...'   (and 16 further references rows whose fixtures now write foreign_key:)
x edits 'a flow sequence, a block sequence and...'   (and two further rename rows, same cause)
x is the key of a collection keyed by key
x is the id of venues, whose name is editable
x is nothing for a file with no primary key
x 'refuses a venue with an empty id'
x 'refuses an Add to a file whose schema...'   -> expected [ 'entries' ] to deeply equal []
x 'writes a venue from its name and its ...'
```

(The printed glyphs for a failing row and an arrow are written here as `x` and `->`.) New rows that pass on the unchanged tree, since they guard what it already did: choices 'offers nothing for ...' (3 rows), writes-collection 'removes a venue by its id, ...', 'edits and removes a person by key, ...', 'edits a venue by its id when the hub keys the venues collection journals', 'adds, renames and removes a bookmark by its label, ...', normalise 'heads a collection entry by its display field ...', form-draft 'does not count an edit of the field the manifest form flags as its primary key', rename's G67 venue row, and new-entry's addPerson row.

After the change, scoped runs in the worktree, each green: `npx vitest run tests/server/edit/writes-collection.test.ts --reporter=verbose` `Tests 20 passed (20)`; `npx vitest run tests/state/forms/choices.test.ts tests/server/edit/writes-collection.test.ts` `Tests 28 passed (28)`; `npx vitest run tests/checks/source/keys.test.ts tests/server/edit/writes-collection.test.ts tests/data/snapshot/schema-rules.test.ts tests/server/edit/feeds.test.ts --testTimeout 0` `Tests 87 passed (87)`; `npx vitest run tests/data/snapshot/normalise.test.ts` `Tests 5 passed (5)`; and the verify list below, which runs every changed test file.

### Checks 1 to 8

| Check | State | Output |
| --- | --- | --- |
| 1, the verify list | NOT MET: exit 1, one slow test timed out | see below |
| 2, the new rows on the unchanged tree and after | DONE | the section above |
| 3, unused exports | DONE, no new unused export | see below |
| 4, the identity grep | DONE, each hit named | see below |
| 5, the `from:` greps | DONE, each hit named | see below |
| 6, the history grep | DONE | prints nothing (`exit 1`) |
| 7, case 15 | DONE | case 15's row above |
| 8, the docs read | DONE, no departure found | see below |

Check 1, run once after the last change: `npm run diagrams && git status --porcelain | awk '{print $2}' | grep -v '^\.scratch/' | xargs npm run test:quick --` (every changed path but the ledger), its summary lines:

```
ok      ASCII gate (1.6 s)
ok      prettier (2.4 s): All matched files use Prettier code style!
ok      svelte-kit sync (3.2 s)
ok      eslint (19.1 s)
ok      svelte-check (79.1 s): 1793023673910 COMPLETED 544 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (217.0 s): Duration  199.06s (transform 142.73s, setup 0ms, import 373.53s, tests 364.76s, environment 3ms)
ok      vitest (280.4 s): Duration  263.65s (transform 254.65s, setup 0ms, import 573.46s, tests 355.35s, environment 77.20s)
FAILED  vitest slow (505.0 s)
 FAIL  |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > holds every record of both hubs, each under the name of its hub's folder
Error: Test timed out in 20000ms.
 Test Files  1 failed | 79 passed (80)
      Tests  1 failed | 715 passed | 220 skipped (936)
test:quick: 508.2 s; failed: vitest slow
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
```

The one failure is the 20 s time limit of the slow tier, in a run where the slow tests ran beside each other. Run alone, the case passes in the worktree and in the base copy at about the same time: `npx vitest run tests/data/hubs/hub-portfolio.test.ts --testTimeout 0 --reporter=verbose`, twice in each, the case's time: worktree `2619ms`, `2606ms`; base `2486ms`, `2115ms` (all 16 cases pass in each run). A judgment: the timeout is the load of the parallel run, not the change; a second run of the verify list at landing settles it. The list was not run a second time, since the brief asks for one run after the last change.

Check 3, `diff <(sh utils/unused-exports.sh 2>&1) .agents/worktrees/O79-base/unused-exports.txt`, every line but the base's two knip `ERROR` lines and its `knip stopped` line:

```
< Unused exports (229)
> Unused exports (230)
< src/lib/server/edit/feeds/feeds.ts: linkedinFrontMatter
> src/lib/server/edit/feeds/feeds.ts: feedFile, linkedinFrontMatter
< src/lib/server/edit/writes.ts: coerce, createIdea, ..., collectionFile, writeFollowup, ...
> src/lib/server/edit/writes.ts: coerce, createIdea, ..., collectionFile, identityField, writeFollowup, ...
< src/lib/server/files/fs/bookmarks.ts: bookmarkKind
< src/lib/server/files/fs/collections.ts: collectionFile
> src/lib/server/files/fs/bookmarks.ts: BOOKMARK_IDENTITY, bookmarkKind
> src/lib/server/files/fs/collections.ts: collectionFile, identityField
< src/lib/state/boards/collection/index.ts: STATUS_FIELD, emptyCollectionState, kindOf, hasStatusField, statusValues
> src/lib/state/boards/collection/index.ts: TITLE_FIELD, STATUS_FIELD, emptyCollectionState, PEOPLE_OPTIONS, kindOf, hasStatusField, statusValues
> src/lib/state/forms/schema.ts: NOT_WRITTEN
```

(The two `writes.ts` lines are shortened here; they differ only by `identityField`.) Every difference is a name the base listed that is gone; no line of the new list is new.

Check 4's hits, each kept:

- `src/lib/ui/forms/Prompt.svelte:4`, `src/lib/server/machine/hpc/submit.ts:284`, `config/text/views/system/help.yml:7`: "first field" in prose about a dialog's focus, a job id and a Settings card, no entry identity.
- `src/lib/state/forms/page-entry.ts:122`, `src/lib/state/forms/referrers.ts:143`: `registry === 'people'`, the registry word code may name (item 2).
- `src/lib/server/git/deposit/deposit.ts:450`, `src/lib/state/system/config/editors/draft.ts:595`, `tests/server/edit/feeds.test.ts:381-383`, `tests/routes/git/git.test.ts:137`: `refused[0].field`, `cards[0]?.fields`, `ran[0].fields`, the first refusal or card, no schema position.
- `src/lib/state/workbench/ui.svelte.ts:112-118`: a `WriteAnswer` constant of the workbench, not the `schema.ts` constant the brief removes (that one is gone).
- `src/lib/data/snapshot/hubs/feeds.ts:5,25,38`: `FEED_IDENTITY = { linkedin: 'file' }`, kept by the brief.
- `tests/server/edit/writes-collection.test.ts:114,285`, `tests/data/snapshot/rename.test.ts:124`: a comment and titles saying the venue's primary key is "not the first field".
- `tests/server/edit/writes-collection.test.ts:362`: `one.key === 'people'` picks the people entry of the test's own settings to add `primary_key: 'key'` to it.

Check 5's hits, each no schema field's key:

- `config/schemas/manifest-schema.yml:16`, `src/lib/data/snapshot/references/specs.ts:15`, `src/lib/data/snapshot/schema/lists.ts:164`: comments naming `foreign_key:` and the options catalog's `from: people`.
- `tests/fixtures/hubs/demo/.oculus/data/literature/literature.yml:18`, `docs/templates.md:1376`: "came from:" inside help text.
- `docs/templates.md:1010`: the data field `from: [my-raw-eeg]` of a dataset entry (premise 6).
- `config/options/sources.yml:195`: the options catalog's own `from: people` (premise 5).
- `tests/data/snapshot/schema-rules.test.ts:621`, `tests/data/sources/config/layers/manifest-fields.test.ts:117`: rows that test that a `from:` left on a schema field or a `manifest_fields` row is a finding.

Check 8: `git diff docs/templates.md docs/data-map.md docs/HELP.md docs/apps.md` read whole (99 lines added); each changed sentence is plain ASCII prose with no dash, quip, history or ruling id, and none departs from the rules file's prose rules.

## Files with line counts

`git status --porcelain` lists 137 paths; every one but the ledger's two (`agents/briefs/O79-cases.md`, which came with the ruling, and this report) is below, with `wc -l`. The rules file's bounds: `src/lib/data/model/index.ts` 879 (bound 880), `Collection.svelte` 520 (bound 520). `docs/templates.md` (1512 at the base, 1517 now) and the generated `docs/diagrams/writes.*` were over 880 before the step. Folders: `src/lib/server/edit/feeds/` 5 items, `tests/state/forms/` 8.

In the path list:

| File | Lines |
| --- | --- |
| `config/defaults/sources.yml` | 119 |
| `config/options/schemas/manifest-schema.yml` | 30 |
| `config/options/sources.yml` | 196 |
| `config/schemas/deck-schema.yml` | 32 |
| `config/schemas/manifest-schema.yml` | 101 |
| `config/text/findings.yml` | 471 |
| `config/text/server.yml` | 534 |
| `docs/apps.md` | 847 |
| `docs/data-map.md` | 267 |
| `docs/HELP.md` | 571 |
| `docs/templates.md` | 1517 |
| `src/lib/data/helpers/files/yaml/collection-text.ts` | 472 |
| `src/lib/data/helpers/hub-names.ts` | 874 |
| `src/lib/data/model/model-collections.ts` | 408 |
| `src/lib/data/snapshot/hubs/feeds.ts` | 72 |
| `src/lib/data/snapshot/hubs/references.ts` | 107 |
| `src/lib/data/snapshot/normalise.ts` | 668 |
| `src/lib/data/snapshot/references/build.ts` | 285 |
| `src/lib/data/snapshot/references/specs.ts` | 163 |
| `src/lib/data/snapshot/schema/field.ts` | 168 |
| `src/lib/data/snapshot/schema/lists.ts` | 253 |
| `src/lib/data/snapshot/schema/manifest.ts` | 182 |
| `src/lib/data/snapshot/schema/record.ts` | 444 |
| `src/lib/data/snapshot/validate.ts` | 557 |
| `src/lib/data/sources/config/merge/hub-layer.ts` | 621 |
| `src/lib/data/sources/documents/feeds.ts` | 174 |
| `src/lib/data/sources/registries.ts` | 155 |
| `src/lib/server/edit/entry-edit/entries.ts` | 391 |
| `src/lib/server/edit/feeds/feeds.ts` | 670 |
| `src/lib/server/edit/writes.ts` | 788 |
| `src/lib/server/edit/writes/entries.ts` | 599 |
| `src/lib/server/edit/writes/manifest.ts` | 742 |
| `src/lib/server/edit/yaml/why.ts` | 71 |
| `src/lib/server/files/fs/bookmarks.ts` | 149 |
| `src/lib/server/files/fs/collections.ts` | 166 |
| `src/lib/state/boards/collection/index.ts` | 759 |
| `src/lib/state/client/writes.svelte.ts` | 867 |
| `src/lib/state/forms/new-entry.ts` | 268 |
| `src/lib/state/forms/page-entry.ts` | 392 |
| `src/lib/state/forms/record-fields.ts` | 59 |
| `src/lib/state/forms/schema.ts` | 604 |
| `src/lib/views/boards/editor/Editor.svelte` | 324 |
| `src/lib/views/feeds/literature/Literature.svelte` | 326 |
| `src/lib/views/shared/forms/entry-file.ts` | 167 |
| `src/lib/views/shared/forms/entry/edit/FieldControl.svelte` | 357 |
| `src/lib/views/shared/forms/entry/edit/page-file.ts` | 60 |
| `src/lib/views/shared/forms/entry/entry-add.ts` | 247 |
| `src/lib/views/system/workbench/editors/FieldControl.svelte` | 509 |
| `tests/fixtures/hubs/demo/.oculus/config.yml` | 39 |
| `tests/fixtures/hubs/demo/.oculus/data/` (15 files: applications 21, education 20, events 45, funding 34, joint-work 35, tasks 34, literature 40, organisations 22, people 40, domains 17, pillars 15, data 44, resources 23, statements 31, venues 30) | as listed |
| `tests/checks/source/catalog-file-keys.test.ts` | 76 |
| `tests/data/hubs/hub-portfolio.test.ts` | 538 |
| `tests/data/snapshot/normalise.test.ts` | 349 |
| `tests/data/snapshot/reference-hub.ts` | 365 |
| `tests/data/snapshot/references.test.ts` | 622 |
| `tests/data/snapshot/rename.test.ts` | 467 |
| `tests/data/snapshot/schema-rules.test.ts` | 685 |
| `tests/data/sources/config/layers/manifest-fields.test.ts` | 166 |
| `tests/routes/hubs/hub-writes.test.ts` | 859 |
| `tests/server/edit/writes-collection.test.ts` | 407 |
| `tests/server/edit/writes.test.ts` | 861 |
| `tests/state/boards/board/board-rules.test.ts` | 865 |
| `tests/state/forms/choices.test.ts` (new) | 199 |
| `tests/state/forms/new-entry.test.ts` | 314 |
| `tests/state/forms/record-fields.test.ts` | 16 |

Outside the path list, each with the reason a change required it:

| File | Lines | Reason |
| --- | --- | --- |
| `src/lib/views/shared/forms/entry/card/EntryCard.svelte` | 356 | ruling 4: `identityValue(entry)` reads the entry's id (its primary key), no schema position |
| `src/lib/views/boards/collection/Collection.svelte` | 520 | ruling 4: the same for the cursor and the hub a write goes to; `identityFaults` and `fileOrder` by the primary key |
| `src/lib/data/snapshot/hubs/merge.ts` | 382 | ruling 4: `collectionOf` walks `foreign_key:` targets by registry |
| `src/lib/data/snapshot/schema/run.ts` | 573 | ruling 4: the primary-key and display findings |
| `src/lib/data/snapshot/schema/static.ts` | 91 | ruling 4: `namesList` reads `foreign_key` |
| `src/lib/data/shapes/catalog-files/manifest.ts` | 97 | ruling 4: the strict `manifestField` takes `primary_key`, `display`, `foreign_key` |
| `src/lib/data/index.ts` | 786 | passes the collections list to `readRegistries` (`registryKeys`) and to `listedFields`, which now need the primary key the entry names |
| `src/lib/data/model/index.ts` | 879 | exports `primaryKeyOf` and `displayFields`; `FromPicked` renamed `KeyPicked` |
| `src/lib/data/model/model-entities.ts` | 738 | `RawRegistry.primaryKey`; comments that said `id` in venues, `key` elsewhere |
| `src/lib/data/sources/collections.ts` | 218 | carries an entry's `primary_key:` into the collection's traits |
| `src/lib/server/edit/entry-edit/render.ts` | 48 | comment: a new entry's primary key on the `- ` line |
| `src/lib/server/edit/feeds/radar.ts` (new) | 229 | `addRadarEntry`, `removeRadarEntry` and `radarBucketKeys` moved out of `feeds.ts` (860 lines at the base, bound 880) by concern, so the feed file's primary-key reads fit; `feeds.ts` is 670 now |
| `src/lib/server/edit/feeds/feed-route.ts` | 181 | imports the radar writers from `radar.ts` |
| `src/lib/server/edit/feeds/literature.ts` | 293 | the Literature writer addresses a paper by the file's primary key, not a `KEY` constant, and refuses a file with none |
| `src/lib/server/edit/writes/subtasks.ts` | 339 | a host collection with no primary key has no entry to address |
| `src/lib/server/edit/writes/undo.ts` | 621 | undo of a feed entry and of a collection entry reads the primary key (`FEED_RULES` and `entryId` gone) |
| `src/lib/server/machine/runs/seeds/task-seed.ts` | 206 | a task's title from its display (`entryTitleOf`), not `entry.title` |
| `src/lib/state/client/context.ts`, `selectors.svelte.ts` | 854, 854 | `namesPeople` by the people registry; the project draft reads the manifest form's primary key (`NOT_WRITTEN` gone) |
| `src/lib/state/feeds/literature/radar.ts` | 48 | comment names `radar.ts` |
| `src/lib/state/sessions/source/draft-entry.ts` | 145 | an entry placed from a session draft goes under the file's primary key; the no-primary-key refusal's words |
| `src/lib/views/boards/entry/Entry.svelte`, `src/lib/views/shared/forms/registry/registry-file.svelte.ts` | 387, 109 | `identityFaults` by the primary key |
| `src/lib/views/boards/person/Person.svelte` | 426 | a joint-work row keyed by file and index, since an entry of a file with no primary key has an empty id |
| `src/lib/views/shared/card/feed/lead-apply.ts` | 80 | passes the leads file's primary key to `placeEntry` |
| `src/lib/views/shared/forms/entry/card/EntryFields.svelte`, `edit/EntryEditor.svelte`, `edit/EntryForm.svelte` | 291, 250, 136 | a field picks people by the target's registry (`namesPeople`), handed down as a prop |
| `config/text/views/boards/collection.yml` | 72 | `collection.no_primary_key`, the words `blockedBy` (`entry-file.ts:160`) and a session draft give a file with no primary key |
| `docs/diagrams/*.dot`, `*.svg` (12 files) | as listed above | regenerated by `npm run diagrams` |
| `tests/data/snapshot/relation-shapes.test.ts`, `resources.test.ts`, `tests/data/sources/collections.test.ts`, `registries.test.ts`, `manifests/manifests.test.ts`, `tests/routes/edit/write-fixture.ts`, `undo/undo.test.ts`, `tests/routes/sessions/compose.test.ts`, `tests/server/core/changes.test.ts`, `tests/server/edit/literature.test.ts`, `writes-fixture.ts`, `tests/state/forms/page-entry.test.ts`, `tests/ui/html.dom.test.ts` | 159, 100, 494, 184, 777, 547, 866, 398, 565, 192, 213, 261, 137 | premise 9: fixture schemas given the flag (and `display:` where a heading reads it) so each test keeps its outcome |
| `tests/server/edit/feeds.test.ts` | 456 | imports the radar writers from `radar.ts`; its radar fixtures are named by `primary_key: title` on the test's settings, since they have no schema |
| `tests/state/forms/form-draft.test.ts` | 321 | `projectDraftTarget` takes the manifest fields; a row for the primary key the project form does not count as an edit |

## Judgment calls the brief left open

- A cleared primary key in an edit is a per-field refusal (`server.entries.key_empty`) and the edit's other fields are written, as a field of the wrong type is; a taken value still refuses the whole write. At the base a cleared venue `id` refused the whole write. Row: 'refuses a cleared primary key and writes the other fields of the edit'.
- The reference index defines every entry of a keyed collection, so an event's key is a definition (case 5); case 1's definitions count rises from 44 to 61.
- `identityValue` (`src/lib/state/boards/collection/index.ts`) stays as a name and reads the entry's id, with no first field and no title fallback.
- A new entry is written with its primary key on the `- ` line (`renderEntry`): a venue Add writes `- id: newv` then `name: New V`, where the base wrote `name` first.
- The hub rewrite gives the bookmarks file's `label` `display: 1` beside `primary_key: true`, so a bookmark's heading is its label; the brief's display list names no bookmarks rank.
- The record of a venue name edit is keyed by the venue's `id` and carries no `was`, since the name is no longer the key.
- The radar fixtures of the feed and undo tests are given a schema flagging `title`, or a settings entry naming it, so they keep their writes.
- The reserved-key rows of schema-rules add the `projects` and `vocab.x` entries to oculus's merged collections, since the scratch hub reads oculus's list.
- The new writes-collection rows take 170 to 380 ms each (`--reporter=verbose` above) and are not tagged slow, as the file's existing cases of the same cost are not.

## Host- or user-visible changes

Each needs the hub rewrite applied (the orchestrator's, at landing) for the real hub to show it.

1. Venue headings and venue references (hub's Venues view, a project's Venue field, the Literature project picker of `Literature.svelte:97`). Before: a venue card is headed by its `name`; a venue choice shows `short`, else `name`, from a fixed field list. After: both show the filled field of the lowest `display:` rank, `short` (1) then `name` (2); the Literature picker shows a project by the project form's `display:` ranks (`projectDisplay`), `short` then `title`, where it showed `title`. To look: the Venues view with one venue that has a `short` and one that has none.
2. A file with no primary key, or two (any collection view, e.g. Tasks after removing the flag). Before: entries addressed by the first field, every write allowed. After: the controls of its cards are off, with the reason "Writes are off: {file} has no primary key, so no entry of it can be addressed; flag one field of its schema with primary_key: true" (`blockedBy`, `entry-file.ts:160`), the Audit view lists the finding, and an edit, Add, reorder or remove is refused with the sentence naming the file.
3. The Add box (any collection view's Add). Before: a venue asked `name, id`, a person `key` alone. After: the primary key and every required field in schema order: a person `key, name`, a task `key, title, status, lead`, a venue `name, id` (case 18's after-run lists each).
4. The entry page (any keyed collection, e.g. a Task's page). Before: only a venue's `id` was shown fixed. After: every collection's primary key is shown and never written.
5. Clearing the primary key in the entry editor (a Venue's page, empty the id and change `short`). Before: the whole write was refused. After: the id field is refused with its sentence and `short` is written.
6. The YAML editor's links and rename (F2) on a key of a keyed collection that is no registry (an event's `key` in `events.yml`). Before: no definition, nothing to rename. After: the key is a definition and a field `foreign_key: events` naming it is a reference. Not looked at on a page.
7. Audit view findings for a schema: a `from:` left on a field is the finding of a key no schema names; the new findings of items 1 and 2 (`key_none`, `key_two`, `key_beside`, `key_listed`, `key_not_true`, `key_nested`, `key_missing`, `bad_foreign_key`, `foreign_key_empty`, `foreign_key_unkeyed`, `display_none`, `display_rank`, `display_twice`, `reserved_key`).
8. Settings, a hub's `manifest_fields` row: it takes `foreign_key:`; a row with `from:` is a finding and left out.
9. Position Leads and Lit Watch of a hub that names no `collections:` list and whose leads or radar file has no schema: the finding of case 15b, and the lead and paper writes are refused. The real hub's files have schemas, flagged by the rewrite.
10. Literature view's save of a paper to a Literature file with no primary key: refused with the no-primary-key sentence.
11. A new hub from Make Folder a Hub: the Data view's Add works on the template's data file (before: no file read).
12. The apps payload: a schema line carries `foreign_key` in place of `from` (`docs/apps.md`, the `collections` row).

## Hub rewrite

`diff -r -x local.yml ~/workspace/research-hub/.oculus <scratchpad>/o79-hub/.oculus` after the rewrite was applied to the scratch copy by Edit. Each line is the hub's line before (`<`) and after (`>`), at the hub's line numbers. `.oculus/data/academic/career.yml` is unchanged (a sections file, no primary key). Case 15 over this copy is green (above). One comment the orchestrator may also change at landing: `.oculus/data/academic/leads.yml:5` reads "`title` is the identity", which the flag now states as the primary key.

### `.oculus/bookmarks.yml`
```
7c7
<   - { field: label, type: text, label: Label, required: true, help: "The name the bookmark is listed and found by." }
>   - { field: label, type: text, primary_key: true, display: 1, label: Label, required: true, help: "The name the bookmark is listed and found by." }
```

### `.oculus/data/academic/applications.yml`
```
7,8c7,8
<   - { field: key, type: text, required: true, help: "The application's short name, unique in this file; a write and Edit in File address the entry by it." }
<   - { field: title,   type: text,     required: true, help: "The name of the application." }
>   - { field: key, type: text, primary_key: true, required: true, help: "The application's short name, unique in this file; a write and Edit in File address the entry by it." }
>   - { field: title,   type: text,     display: 1, required: true, help: "The name of the application." }
17c17
<   - { field: related, type: tags,     from: projects, help: "Project ids" }
>   - { field: related, type: tags,     foreign_key: projects, help: "Project ids" }
19,21c19,21
<   - { field: lead,          type: tags,     from: people, required: true, help: "Who leads it." }
<   - { field: collaborators, type: tags,     from: people, help: "Who works on it with the lead." }
<   - { field: supervisors,   type: tags,     from: people, help: "Who supervises it." }
>   - { field: lead,          type: tags,     foreign_key: people, required: true, help: "Who leads it." }
>   - { field: collaborators, type: tags,     foreign_key: people, help: "Who works on it with the lead." }
>   - { field: supervisors,   type: tags,     foreign_key: people, help: "Who supervises it." }
```

### `.oculus/data/academic/education.yml`
```
7,8c7,8
<   - { field: key, type: text, required: true, help: "The entry's short name, unique in this file; a write and Edit in File address the entry by it." }
<   - { field: title,    type: text,     required: true, help: "The name of the course or programme." }
>   - { field: key, type: text, primary_key: true, required: true, help: "The entry's short name, unique in this file; a write and Edit in File address the entry by it." }
>   - { field: title,    type: text,     display: 1, required: true, help: "The name of the course or programme." }
17,20c17,20
<   - { field: related,  type: tags,     from: projects, help: "Project ids this relates to" }
<   - { field: lead,          type: tags,     from: people, required: true, help: "Who leads it." }
<   - { field: collaborators, type: tags,     from: people, help: "Who works on it with the lead." }
<   - { field: supervisors,   type: tags,     from: people, help: "Who supervises it." }
>   - { field: related,  type: tags,     foreign_key: projects, help: "Project ids this relates to" }
>   - { field: lead,          type: tags,     foreign_key: people, required: true, help: "Who leads it." }
>   - { field: collaborators, type: tags,     foreign_key: people, help: "Who works on it with the lead." }
>   - { field: supervisors,   type: tags,     foreign_key: people, help: "Who supervises it." }
```

### `.oculus/data/academic/events.yml`
```
7,8c7,8
<   - { field: key, type: text, required: true, help: "The event's short name, unique in this file; a write and Edit in File address the entry by it." }
<   - { field: title,    type: text,     required: true, help: "The name of the event." }
>   - { field: key, type: text, primary_key: true, required: true, help: "The event's short name, unique in this file; a write and Edit in File address the entry by it." }
>   - { field: title,    type: text,     display: 1, required: true, help: "The name of the event." }
18,21c18,21
<   - { field: related,  type: tags,     from: projects, help: "Project ids" }
<   - { field: lead,          type: tags,     from: people, required: true, help: "Who leads it." }
<   - { field: collaborators, type: tags,     from: people, help: "Who works on it with the lead." }
<   - { field: supervisors,   type: tags,     from: people, help: "Who supervises it." }
>   - { field: related,  type: tags,     foreign_key: projects, help: "Project ids" }
>   - { field: lead,          type: tags,     foreign_key: people, required: true, help: "Who leads it." }
>   - { field: collaborators, type: tags,     foreign_key: people, help: "Who works on it with the lead." }
>   - { field: supervisors,   type: tags,     foreign_key: people, help: "Who supervises it." }
```

### `.oculus/data/academic/funding.yml`
```
7,8c7,8
<   - { field: key,       type: text, required: true, help: "Cross-link anchor (the funding: tag on manifests)" }
<   - { field: title,     type: text,     required: true, help: "The name of the funding scheme or application." }
>   - { field: key,       type: text, primary_key: true, required: true, help: "Cross-link anchor (the funding: tag on manifests)" }
>   - { field: title,     type: text,     display: 1, required: true, help: "The name of the funding scheme or application." }
10c10
<   - { field: funder,    type: select,   from: organisations, help: "The organisation that funds the scheme, as a key of organisations.yml." }
>   - { field: funder,    type: select,   foreign_key: organisations, help: "The organisation that funds the scheme, as a key of organisations.yml." }
20,22c20,22
<   - { field: lead,          type: tags,     from: people, required: true, help: "Who leads it." }
<   - { field: collaborators, type: tags,     from: people, help: "Who works on it with the lead." }
<   - { field: supervisors,   type: tags,     from: people, help: "Who supervises it." }
>   - { field: lead,          type: tags,     foreign_key: people, required: true, help: "Who leads it." }
>   - { field: collaborators, type: tags,     foreign_key: people, help: "Who works on it with the lead." }
>   - { field: supervisors,   type: tags,     foreign_key: people, help: "Who supervises it." }
```

### `.oculus/data/academic/joint-work.yml`
```
9,11c9,11
<   - { field: key,    type: text,     help: "short slug for this piece of work" }
<   - { field: title,  type: text,     required: true, help: "what the work is, not who it is with" }
<   - { field: person, type: select,   from: people, required: true, help: "The person's key in .oculus/data/people/people.yml." }
>   - { field: key,    type: text,     primary_key: true, help: "short slug for this piece of work" }
>   - { field: title,  type: text,     display: 1, required: true, help: "what the work is, not who it is with" }
>   - { field: person, type: select,   foreign_key: people, required: true, help: "The person's key in .oculus/data/people/people.yml." }
```

### `.oculus/data/academic/leads.yml`
```
55c55
<   - { field: title, label: "Title", type: text, help: "The name of the position." }
>   - { field: title, label: "Title", type: text, primary_key: true, display: 1, help: "The name of the position." }
```

### `.oculus/data/academic/tasks.yml`
```
8,9c8,9
<   - { field: key, type: text, required: true, help: "The task's short name, unique in this file; a write and Edit in File address the entry by it." }
<   - { field: title,    type: text,     required: true, help: "What the task is." }
>   - { field: key, type: text, primary_key: true, required: true, help: "The task's short name, unique in this file; a write and Edit in File address the entry by it." }
>   - { field: title,    type: text,     display: 1, required: true, help: "What the task is." }
15,17c15,17
<   - { field: lead,          type: tags,     from: people, required: true, help: "Who leads it." }
<   - { field: collaborators, type: tags,     from: people, help: "Who works on it with the lead." }
<   - { field: supervisors,   type: tags,     from: people, help: "Who supervises it." }
>   - { field: lead,          type: tags,     foreign_key: people, required: true, help: "Who leads it." }
>   - { field: collaborators, type: tags,     foreign_key: people, help: "Who works on it with the lead." }
>   - { field: supervisors,   type: tags,     foreign_key: people, help: "Who supervises it." }
```

### `.oculus/data/literature/literature.yml`
```
8,9c8,9
<   - { field: key,      type: text,     required: true, label: "Citation key", help: "The paper's citation key: the first author's surname, the year and the first word of the title, with b, c and on added when the file holds it already." }
<   - { field: title,    type: text,     help: "The paper's title. A paper saved from an address alone has none, and its title is filled in on the entry's page." }
>   - { field: key,      type: text,     primary_key: true, required: true, label: "Citation key", help: "The paper's citation key: the first author's surname, the year and the first word of the title, with b, c and on added when the file holds it already." }
>   - { field: title,    type: text,     display: 1, help: "The paper's title. A paper saved from an address alone has none, and its title is filled in on the entry's page." }
17c17
<   - { field: projects, type: tags,     from: projects, filter: true, help: "The projects the paper is read or cited for." }
>   - { field: projects, type: tags,     foreign_key: projects, filter: true, help: "The projects the paper is read or cited for." }
```

### `.oculus/data/literature/radar.yml`
```
15c15
<   - { field: title, type: text, required: true, help: "The paper's title." }
>   - { field: title, type: text, primary_key: true, display: 1, required: true, help: "The paper's title." }
20,21c20,21
<   - { field: bucket, type: select, from: vocab.radar_buckets, required: true, help: "How the paper bears on the project: a pre-emption risk, a paper to cite or run as a baseline, an adjacent paper or an idea spark." }
<   - { field: project, type: select, from: projects, help: "The project the sweep found the paper for." }
>   - { field: bucket, type: select, foreign_key: vocab.radar_buckets, required: true, help: "How the paper bears on the project: a pre-emption risk, a paper to cite or run as a baseline, an adjacent paper or an idea spark." }
>   - { field: project, type: select, foreign_key: projects, help: "The project the sweep found the paper for." }
27c27
<   - { field: maps_to, type: text, from: projects, help: "For an idea spark, the project the spark applies to, or new-idea-candidate when it fits none." }
>   - { field: maps_to, type: text, foreign_key: projects, help: "For an idea spark, the project the spark applies to, or new-idea-candidate when it fits none." }
```

### `.oculus/data/people/organisations.yml`
```
7,8c7,8
<   - { field: key,     type: text,   required: true, label: "Organisation key", help: "The organisation's key, used by a person's affiliations and a funding scheme's funder." }
<   - { field: name,    type: text,   required: true, help: "The organisation's full name." }
>   - { field: key,     type: text,   primary_key: true, required: true, label: "Organisation key", help: "The organisation's key, used by a person's affiliations and a funding scheme's funder." }
>   - { field: name,    type: text,   display: 1, required: true, help: "The organisation's full name." }
```

### `.oculus/data/people/people.yml`
```
8,10c8,10
<   - { field: key,          type: text,     required: true, label: "Person key", help: "The person's key, used by a project's collaborators and by joint work." }
<   - { field: name,         type: text,     required: true, help: "The person's full name." }
<   - { field: affiliations, type: tags,     from: organisations, help: "The organisations the person belongs to, as keys of organisations.yml, the primary first." }
>   - { field: key,          type: text,     primary_key: true, required: true, label: "Person key", help: "The person's key, used by a project's collaborators and by joint work." }
>   - { field: name,         type: text,     display: 1, required: true, help: "The person's full name." }
>   - { field: affiliations, type: tags,     foreign_key: organisations, help: "The organisations the person belongs to, as keys of organisations.yml, the primary first." }
```

### `.oculus/data/pillars/domains.yml`
```
6,7c6,7
<   - { field: key,   type: text,     required: true, label: "Domain key", help: "The domain's key, used by a project's domain field." }
<   - { field: title, type: text,     required: true, help: "The domain's name." }
>   - { field: key,   type: text,     primary_key: true, required: true, label: "Domain key", help: "The domain's key, used by a project's domain field." }
>   - { field: title, type: text,     display: 1, required: true, help: "The domain's name." }
```

### `.oculus/data/pillars/pillars.yml`
```
29,30c29,30
<   - { field: key,     type: text,     required: true, label: "Pillar key", help: "The pillar's key, used by a project's pillar list." }
<   - { field: title,   type: text,     required: true, help: "The pillar's name." }
>   - { field: key,     type: text,     primary_key: true, required: true, label: "Pillar key", help: "The pillar's key, used by a project's pillar list." }
>   - { field: title,   type: text,     display: 1, required: true, help: "The pillar's name." }
```

### `.oculus/data/research/data.yml`
```
16,17c16,17
<   - { field: key,         type: text,     required: true, label: "Dataset key", help: "The dataset's key, used by a project's datasets list." }
<   - { field: name,        type: text,     required: true, help: "The dataset's full name." }
>   - { field: key,         type: text,     primary_key: true, required: true, label: "Dataset key", help: "The dataset's key, used by a project's datasets list." }
>   - { field: name,        type: text,     display: 1, required: true, help: "The dataset's full name." }
23c23
<   - { field: access,      type: select,   from: vocab.data_access, help: "How the data is obtained: open, behind a registration, credentialed (a data use agreement) or private." }
>   - { field: access,      type: select,   foreign_key: vocab.data_access, help: "How the data is obtained: open, behind a registration, credentialed (a data use agreement) or private." }
60c60
<       - { field: from,       type: tags,   from: datasets, when: { kind: derived }, required: { when: { kind: derived } }, help: "The datasets the set is built from." }
>       - { field: from,       type: tags,   foreign_key: data, when: { kind: derived }, required: { when: { kind: derived } }, help: "The datasets the set is built from." }
```

### `.oculus/data/research/resources.yml`
```
6,7c6,7
<   - { field: key,    type: text,     required: true, label: "Resource key", help: "The resource's key, used by a project's compute list." }
<   - { field: name,   type: text,     required: true, help: "The resource's name." }
>   - { field: key,    type: text,     primary_key: true, required: true, label: "Resource key", help: "The resource's key, used by a project's compute list." }
>   - { field: name,   type: text,     display: 1, required: true, help: "The resource's name." }
```

### `.oculus/data/research/statements.yml`
```
12,13c12,13
<   - { field: key, type: text, required: true, help: "The text block's short name, unique in this file; a write and Edit in File address the entry by it." }
<   - { field: title,     type: text,     required: true, help: "The name of the text block." }
>   - { field: key, type: text, primary_key: true, required: true, help: "The text block's short name, unique in this file; a write and Edit in File address the entry by it." }
>   - { field: title,     type: text,     display: 1, required: true, help: "The name of the text block." }
```

### `.oculus/data/research/venues.yml`
```
14,17c14,17
<   - { field: name,           type: text,     required: true, label: "Venue name", help: "The venue's full name." }
<   - { field: id,             type: text,     help: "The catalogue id that a project's venue names." }
<   - { field: short,          type: text,     label: "Short name", help: "The venue's short name or acronym." }
<   - { field: category,       type: select,   from: vocab.venue_categories, help: "The kind of venue: a journal, a conference, a thesis or a meeting." }
>   - { field: name,           type: text,     display: 2, required: true, label: "Venue name", help: "The venue's full name." }
>   - { field: id,             type: text,     primary_key: true, help: "The catalogue id that a project's venue names." }
>   - { field: short,          type: text,     display: 1, label: "Short name", help: "The venue's short name or acronym." }
>   - { field: category,       type: select,   foreign_key: vocab.venue_categories, help: "The kind of venue: a journal, a conference, a thesis or a meeting." }
20c20
<   - { field: tier,           type: select,   from: vocab.venue_tiers, help: "The prestige tier, curated by hand and not taken from the JIF." }
>   - { field: tier,           type: select,   foreign_key: vocab.venue_tiers, help: "The prestige tier, curated by hand and not taken from the JIF." }
```

## Anything in the brief that was wrong or impossible

- Case 1 asks that the reference index's count of definitions be the same before and after, and case 5 asks that an event's key be a reference to the event's entry in the index. The second needs every keyed collection's entries to be definitions, so the count rises from 44 to 61 (case 1's after-run) and only the references count (114) stays.
- Case 18 asks for no finding. The new hub from the templates gives five findings, all `scan | scan directory does not exist` for the five `projects/...` folders the template's `scan:` names and Make Folder a Hub does not create; `findings on a file under .oculus: 0`. The same five stood in the first run.
- Case 1's datasets choice line names its source `"data"` in place of `"datasets"`, since item 3 makes the manifest schema's datasets field name the collection key `data`; its choices are the same.
- Premise 2's line range and the 19 `schema:` blocks, both ruled (points 3 and 5).

## The case-run programs

All lie in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o79/`, beside the config they run under. Each writes its lines to `caseNN.out.txt` there and nothing else outside its own scratch folder, which it removes; the scratch copy of the hub for case 15 (`scratchpad/o79-hub`, made with `cp -cR` of every top-level entry but `.git` and `.oculus`, and of every entry of `.oculus` but `local.yml`; `find <copy> -name local.yml | wc -l` printed 0) was removed after the first run and made again for the after-run, where it stays. The sources below are the first run's; "The after-run programs" gives each change since.

### vitest.config.mts

```ts
import { svelte } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79/node_modules/@sveltejs/vite-plugin-svelte/src/index.js';
import { defineConfig } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79/node_modules/vitest/dist/config.js';
export default defineConfig({
    plugins: [svelte({ configFile: false })],
    server: { fs: { allow: ['/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79', '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o79'] } },
    test: { include: ['/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o79/**/*.case.ts'], environment: 'node', testTimeout: 120000 }
});
```

### case01.case.ts

```ts
// Case 1 of O79: oculus's own config over the demo fixture hub. Prints, for a scratch copy of the
// demo hub built as the watcher builds it: every collection card's heading, every entry page's
// title, fixed fields and write id, the choices of every select, chips and tags field with a source
// of the project form and of each collection's form, the reference index's counts, and an edit, a
// remove and an Add on the first entry of each collection, each on a fresh copy. Writes only under
// the scratchpad folder, removed at the end.
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { it } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79/node_modules/vitest/dist/index.js';

const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79';
const S = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o79';
const OUT = join(S, 'case01.out.txt');

it('case 1', async () => {
    const { engineDir, loadConfig } = await import(`${W}/src/lib/data/sources/config.ts`);
    const { portfolioConfigFrom } = await import(`${W}/src/lib/data/index.ts`);
    const { published, indexedOnce } = await import(`${W}/tests/data/hubs/hubs-fixture.ts`);
    const { createPages } = await import(`${W}/src/lib/state/forms/page-entry.ts`);
    const { createSettled } = await import(`${W}/src/lib/state/forms/settled.svelte.ts`);
    const { feedIdents } = await import(`${W}/src/lib/state/shared/page/idents.ts`);
    const { formFields, choicesFor } = await import(`${W}/src/lib/state/forms/schema.ts`);
    const { formFieldsOf } = await import(`${W}/src/lib/state/forms/record-fields.ts`);
    const { bareId } = await import(`${W}/src/lib/data/helpers/hub-names.ts`);
    const { writeEntry, removeEntry, createEntry } = await import(
        `${W}/src/lib/server/edit/writes.ts`
    );
    const { readCollection } = await import(`${W}/src/lib/server/files/fs/collections.ts`);

    const lines: string[] = [];
    const say = (line: string): void => void lines.push(line);
    const runs = mkdtempSync(join(S, 'runs-'));
    const DEMO = join(W, 'tests', 'fixtures', 'hubs', 'demo');
    let n = 0;
    const copy = (): string => {
        n += 1;
        const dir = join(runs, `demo${n}`);
        cpSync(DEMO, dir, { recursive: true });
        return dir;
    };
    try {
        const hub = copy();
        const folders = [{ name: 'demo', dir: hub }];
        const { snapshot, feeds } = published(folders, 'demo');
        const merged = loadConfig(engineDir(), { hub }).config;
        const config = portfolioConfigFrom(merged);
        const { setCatalog } = await import(`${W}/src/lib/state/shared/words/text.ts`);
        const { textCatalog } = await import(`${W}/src/lib/data/sources/config.ts`);
        setCatalog(textCatalog(merged));

        say('== card headings (EntryCard.svelte: entry.title, else entry.id)');
        const collections = Object.values(snapshot.entities.collections).sort((a, b) =>
            a.id < b.id ? -1 : 1
        );
        for (const one of collections) {
            for (const entry of one.entries) {
                say(`${one.id} | ${entry.id} | ${entry.title === '' ? entry.id : entry.title}`);
            }
        }

        say('== entry pages (title | fixed | writeId)');
        const pages = createPages(
            { snapshot: () => snapshot, feeds: () => feeds },
            createSettled(() => 0)
        );
        for (const one of collections) {
            for (const entry of one.entries) {
                const page = pages.pageOf(bareId(one), entry.id);
                say(
                    page === null
                        ? `${one.id} | ${entry.id} | no page`
                        : `${one.id} | ${entry.id} | ${page.title} | ${page.fixed.join(',')} | ${page.writeId}`
                );
            }
        }
        for (const kind of ['leads', 'radar'] as const) {
            const held = feeds?.[kind];
            if (held === undefined || held === null) {
                say(`${kind} | no feed`);
                continue;
            }
            const identOf = feedIdents(kind, held.entries);
            for (const entry of held.entries) {
                const ident = identOf(entry);
                const page = pages.pageOf(kind, ident);
                say(
                    page === null
                        ? `${kind} | ${ident} | no page`
                        : `${kind} | ${ident} | ${page.title} | ${page.fixed.join(',')} | ${page.writeId}`
                );
            }
        }

        const choices = (field: { from?: unknown; options?: unknown }): string =>
            choicesFor(field, snapshot, merged, 'demo')
                .map((one: { id: string; label: string; glyph?: string; hub?: string }) =>
                    [one.id, one.label, one.glyph ?? '', one.hub ?? ''].join(':')
                )
                .join(', ');
        say('== project form choices (field | type | from | choices id:label:glyph:hub)');
        for (const field of formFields(merged)) {
            if (!['select', 'chips', 'tags'].includes(field.type)) continue;
            if (field.from === undefined && field.options === undefined) continue;
            say(`${field.field} | ${field.type} | ${JSON.stringify(field.from)} | ${choices(field)}`);
        }
        say('== collection form choices (collection | field | type | from | choices)');
        for (const one of collections) {
            const fields = formFieldsOf(one.schema, one.entries.at(0)?.fields ?? {});
            for (const field of fields) {
                if (!['select', 'tags'].includes(field.type)) continue;
                if (field.from === undefined && field.options === undefined) continue;
                say(
                    `${one.id} | ${field.field} | ${field.type} | ${JSON.stringify(field.from)} | ${choices(field)}`
                );
            }
        }

        say('== reference index');
        const { references } = indexedOnce(folders, 'demo');
        let refs = 0;
        let defs = 0;
        for (const file of references.files) {
            refs += file.references.length;
            defs += file.definitions.length;
            say(
                `${file.file.root}/${file.file.path} | references ${file.references.length} | definitions ${file.definitions.length}`
            );
        }
        say(`total | references ${refs} | definitions ${defs}`);

        say('== writes on the first entry of each collection, each on a fresh copy');
        for (const entry of config.collections) {
            const key = entry.key;
            const read = (dir: string) => readCollection(dir, config, key);
            const first = read(hub);
            if (first === null) {
                say(`${key} | no file`);
                continue;
            }
            const schema = Array.isArray(first.schema) ? first.schema : [];
            const item = first.items.at(0);
            if (item === undefined) {
                say(`${key} | no entry`);
                continue;
            }
            const { entryId } = await import(`${W}/src/lib/server/files/fs/collections.ts`);
            const id = entryId(item, first.ident);
            const textField = schema.find(
                (one: { field: string; type: string }, at: number) =>
                    at > 0 && (one.type === 'text' || one.type === 'textarea') && one.field !== 'id'
            );
            const editDir = copy();
            const edit = writeEntry(editDir, config, key, id, {
                [textField?.field ?? 'note']: 'case one edit'
            });
            const after = readFileSync(join(editDir, entry.file), 'utf8');
            const before = readFileSync(join(hub, entry.file), 'utf8');
            const changedLines = after
                .split('\n')
                .filter((line, at) => line !== before.split('\n')[at]).length;
            say(
                `${key} | edit ${id} ${textField?.field ?? 'note'} | found ${edit.found} | id ${edit.id} | changed ${JSON.stringify(edit.changed)} | refused ${JSON.stringify(edit.refused)} | lines differing ${changedLines}`
            );
            const removeDir = copy();
            const removed = removeEntry(removeDir, config, key, id);
            say(
                `${key} | remove ${id} | found ${removed.found} | changed ${JSON.stringify(removed.changed)} | refused ${JSON.stringify(removed.refused)} | entries ${first.items.length} -> ${read(removeDir)?.items.length}`
            );
            const addDir = copy();
            const fields: Record<string, unknown> = { [first.ident]: 'case-one-new' };
            for (const one of schema as {
                field: string;
                type: string;
                required?: unknown;
                options?: unknown[];
            }[]) {
                if (one.required !== true || one.field in fields) continue;
                const option = one.options?.at(0);
                fields[one.field] =
                    option === undefined
                        ? one.type === 'tags'
                            ? []
                            : 'case-one-new'
                        : typeof option === 'string'
                          ? option
                          : (option as { key: string }).key;
            }
            const added = createEntry(addDir, config, key, fields);
            say(
                `${key} | add ${JSON.stringify(fields)} | found ${added.found} | changed ${JSON.stringify(added.changed)} | refused ${JSON.stringify(added.refused)} | entries ${first.items.length} -> ${read(addDir)?.items.length}`
            );
        }
    } finally {
        rmSync(runs, { recursive: true, force: true });
        writeFileSync(OUT, `${lines.join('\n')}\n`);
    }
});
```

Printed (`case01.out.txt`, run `Tests  1 passed (1)`):

```
== card headings (EntryCard.svelte: entry.title, else entry.id)
demo:applications | demo:assistant-professor-ml | Assistant Professor, ML
demo:applications | demo:postdoc-graph-learning | Postdoc, graph learning
demo:data | demo:synthgraph | Synthetic evolving-graph benchmark
demo:data | demo:stream-bench | Streaming anomaly benchmark
demo:data | demo:toy-embed | Toy embedding corpus
demo:data | demo:probe-logs | Node probe logs
demo:data | demo:node-traces | Node arrival traces
demo:domains | demo:method | Methods (domain-agnostic)
demo:domains | demo:graphs | Graph learning
demo:domains | demo:nlp | Language / representation
demo:education | demo:machine-learning-msc | Machine Learning (MSc)
demo:education | demo:supervised-msc-thesis-on-graph-transfer | Supervised: MSc thesis on graph transfer
demo:events | demo:streaming-anomaly-detection-at-scale | Streaming anomaly detection at scale
demo:events | demo:poster-robust-embeddings-under-shift | Poster: robust embeddings under shift
demo:events | demo:neurips-attending | NeurIPS (attending)
demo:funding | demo:ecf | Early-Career Fellowship
demo:funding | demo:open-data-infrastructure-grant | Open-Data Infrastructure Grant
demo:joint-work | demo:rivera-lab | Streaming systems, the anomaly-detection benchmark
demo:joint-work | demo:chen-graph | Graph learning, the transfer and bandits line
demo:literature | demo:example2024bandit | Bandit exploration over changing graphs
demo:literature | demo:coauthor2021sketching | Sketching tensors in a stream
demo:organisations | demo:northwood-university | Northwood University
demo:organisations | demo:meridian-institute | Meridian Institute
demo:people | demo:rivera-lab | Ana Rivera
demo:people | demo:chen-graph | Wei Chen
demo:people | demo:dana-example | Dr. Dana Example
demo:people | demo:b-coauthor | B. Coauthor
demo:people | demo:c-senior | C. Senior
demo:people | demo:b-colleague | B. Colleague
demo:pillars | demo:tensors | Structured tensor methods
demo:pillars | demo:graphs | Graph learning over evolving relational structure and streaming interaction data
demo:pillars | demo:repr | Representation learning
demo:resources | demo:utwente | Demo cluster
demo:resources | demo:laptop | Laptop
demo:statements | demo:short-bio-100-words | Short bio (100 words)
demo:statements | demo:data-availability-statement | Data availability statement
demo:statements | demo:funding-acknowledgment-example-grant | Funding acknowledgment (Example Grant)
demo:tasks | demo:review-2-papers-for-mlshift-workshop | Review 2 papers for MLShift Workshop
demo:tasks | demo:renew-compute-allocation | Renew compute allocation
demo:tasks | demo:update-the-lab-wiki-onboarding-page | Update the lab wiki onboarding page
demo:venues | demo:jmlr | Journal of Machine Learning Research
demo:venues | demo:tmlr | Transactions on Machine Learning Research
demo:venues | demo:neurips | NeurIPS
demo:venues | demo:iclr | ICLR
demo:venues | demo:kdd | ACM SIGKDD
== entry pages (title | fixed | writeId)
demo:applications | demo:assistant-professor-ml | Assistant Professor, ML | key | demo:assistant-professor-ml
demo:applications | demo:postdoc-graph-learning | Postdoc, graph learning | key | demo:postdoc-graph-learning
demo:data | demo:synthgraph | Synthetic evolving-graph benchmark | key | demo:synthgraph
demo:data | demo:stream-bench | Streaming anomaly benchmark | key | demo:stream-bench
demo:data | demo:toy-embed | Toy embedding corpus | key | demo:toy-embed
demo:data | demo:probe-logs | Node probe logs | key | demo:probe-logs
demo:data | demo:node-traces | Node arrival traces | key | demo:node-traces
demo:domains | demo:method | Methods (domain-agnostic) | key | demo:method
demo:domains | demo:graphs | Graph learning | key | demo:graphs
demo:domains | demo:nlp | Language / representation | key | demo:nlp
demo:education | demo:machine-learning-msc | Machine Learning (MSc) | key | demo:machine-learning-msc
demo:education | demo:supervised-msc-thesis-on-graph-transfer | Supervised: MSc thesis on graph transfer | key | demo:supervised-msc-thesis-on-graph-transfer
demo:events | demo:streaming-anomaly-detection-at-scale | Streaming anomaly detection at scale | key | demo:streaming-anomaly-detection-at-scale
demo:events | demo:poster-robust-embeddings-under-shift | Poster: robust embeddings under shift | key | demo:poster-robust-embeddings-under-shift
demo:events | demo:neurips-attending | NeurIPS (attending) | key | demo:neurips-attending
demo:funding | demo:ecf | Early-Career Fellowship | key | demo:ecf
demo:funding | demo:open-data-infrastructure-grant | Open-Data Infrastructure Grant | key | demo:open-data-infrastructure-grant
demo:joint-work | demo:rivera-lab | Streaming systems, the anomaly-detection benchmark | key | demo:rivera-lab
demo:joint-work | demo:chen-graph | Graph learning, the transfer and bandits line | key | demo:chen-graph
demo:literature | demo:example2024bandit | Bandit exploration over changing graphs | key | demo:example2024bandit
demo:literature | demo:coauthor2021sketching | Sketching tensors in a stream | key | demo:coauthor2021sketching
demo:organisations | demo:northwood-university | Northwood University | key | demo:northwood-university
demo:organisations | demo:meridian-institute | Meridian Institute | key | demo:meridian-institute
demo:people | demo:rivera-lab | Ana Rivera | key | demo:rivera-lab
demo:people | demo:chen-graph | Wei Chen | key | demo:chen-graph
demo:people | demo:dana-example | Dr. Dana Example | key | demo:dana-example
demo:people | demo:b-coauthor | B. Coauthor | key | demo:b-coauthor
demo:people | demo:c-senior | C. Senior | key | demo:c-senior
demo:people | demo:b-colleague | B. Colleague | key | demo:b-colleague
demo:pillars | demo:tensors | Structured tensor methods | key | demo:tensors
demo:pillars | demo:graphs | Graph learning over evolving relational structure and streaming interaction data | key | demo:graphs
demo:pillars | demo:repr | Representation learning | key | demo:repr
demo:resources | demo:utwente | Demo cluster | key | demo:utwente
demo:resources | demo:laptop | Laptop | key | demo:laptop
demo:statements | demo:short-bio-100-words | Short bio (100 words) | key | demo:short-bio-100-words
demo:statements | demo:data-availability-statement | Data availability statement | key | demo:data-availability-statement
demo:statements | demo:funding-acknowledgment-example-grant | Funding acknowledgment (Example Grant) | key | demo:funding-acknowledgment-example-grant
demo:tasks | demo:review-2-papers-for-mlshift-workshop | Review 2 papers for MLShift Workshop | key | demo:review-2-papers-for-mlshift-workshop
demo:tasks | demo:renew-compute-allocation | Renew compute allocation | key | demo:renew-compute-allocation
demo:tasks | demo:update-the-lab-wiki-onboarding-page | Update the lab wiki onboarding page | key | demo:update-the-lab-wiki-onboarding-page
demo:venues | demo:jmlr | Journal of Machine Learning Research | id | demo:jmlr
demo:venues | demo:tmlr | Transactions on Machine Learning Research | id | demo:tmlr
demo:venues | demo:neurips | NeurIPS | id | demo:neurips
demo:venues | demo:iclr | ICLR | id | demo:iclr
demo:venues | demo:kdd | ACM SIGKDD | id | demo:kdd
leads | demo:Assistant Professor, Machine Learning | no page
leads | demo:Lecturer in Data Science | no page
leads | demo:Postdoc, Robust ML | no page
leads | demo:Attention <script>alert(1)</script> <img src=x onerror=alert(2)> is all you need | no page
radar | demo:Fast streaming anomaly detection with adaptive thresholds | no page
radar | demo:Certified robustness for sentence embeddings under covariate shift | no page
radar | demo:Optimal transport for graph domain adaptation | no page
== project form choices (field | type | from | choices id:label:glyph:hub)
tier | select | "vocab.tiers" | research:Research::, personal:Personal::, software:Software::
stage | select | "vocab.stages" | nascent:nascent (concept)::, scoping:scoping (lit-check and framing)::, de-risking:de-risking (feasibility experiment)::, exploring:exploring::, in-prep:in preparation::, building:building::, submit-ready:submit-ready::, submitted:submitted / under review::, revision:major revision (back with the authors)::, published:published::, released:released::, failed:failed (no-go or disproved)::, stopped:stopped (dropped or abandoned)::
form | select | "vocab.forms" | journal:journal article::, conference:conference paper::, thesis:thesis::, abstract:extended abstract::, poster:poster::, tech-report:tech report (not peer-reviewed)::
status.chips | chips | "vocab.chips" | blocked:blocked (external)::, parked:parked (not being worked)::, results-in:results in, not written up::, admin-prep:admin/prep::, numbers-to-run:numbers still to run::, ai-tells:AI-writing tells::
venue | select | "venues" | iclr:ICLR::, jmlr:Journal of Machine Learning Research::, kdd:ACM SIGKDD::, neurips:NeurIPS::, tmlr:Transactions on Machine Learning Research::
domain | select | "domains" | graphs:Graph learning::, method:Methods (domain-agnostic)::, nlp:Language / representation::
pillars | chips | "pillars" | graphs:Graph learning over evolving relational structure and streaming interaction data::, repr:Representation learning::, tensors:Structured tensor methods::
funding | chips | "funding" | ecf:Early-Career Fellowship::, open-data-infrastructure-grant:Open-Data Infrastructure Grant::
lead | chips | "people" | b-coauthor:B. Coauthor::, b-colleague:B. Colleague::, c-senior:C. Senior::, chen-graph:Wei Chen::, dana-example:Dr. Dana Example::, rivera-lab:Ana Rivera::
collaborators | chips | "people" | b-coauthor:B. Coauthor::, b-colleague:B. Colleague::, c-senior:C. Senior::, chen-graph:Wei Chen::, dana-example:Dr. Dana Example::, rivera-lab:Ana Rivera::
supervisors | chips | "people" | b-coauthor:B. Coauthor::, b-colleague:B. Colleague::, c-senior:C. Senior::, chen-graph:Wei Chen::, dana-example:Dr. Dana Example::, rivera-lab:Ana Rivera::
related | chips | "projects" | bench-suite:bench-suite::, demo-toolkit:Demo-Toolkit::, early-benchmark:Early-Bench::, failed-quantization:Quant-NoGo::, graph-bandits:Graph-Bandits::, graph-transfer:Graph-Transfer::, online-clustering:Online-Cluster::, robust-embeddings:Robust-Emb::, sparse-attention:Sparse-Attn::, spectral-clustering-collab:Spectral Collab::, streaming-anomaly:Stream-Anomaly::, tensor-sketch:Sketched tensor decompositions for streaming data, online and out of core::, tensorkit-tensor-decomposition-toolkit:tensorkit - tensor decomposition toolkit::
datasets | chips | "datasets" | node-traces:Node arrival traces::, probe-logs:Node probe logs::, stream-bench:Streaming anomaly benchmark::, synthgraph:Synthetic evolving-graph benchmark::, toy-embed:Toy embedding corpus::
code_availability.status | select | undefined | none:none::, review-anon:review-anon::, deposited:deposited::
code_availability.visibility | select | undefined | public:public::, private:private::
repository.visibility | select | undefined | public:public::, private:private::
compute | chips | "resources" | laptop:Laptop:host:, utwente:Demo cluster:hpc:
== collection form choices (collection | field | type | from | choices)
demo:applications | status | select | undefined | in-prep:in-prep::, applied:applied::, rejected:rejected::, declined:declined::, withdrawn:withdrawn::
demo:data | access | select | undefined | open:open::, registration:registration::, credentialed:credentialed::, private:private::
demo:data | themes | tags | undefined | graphs:Graphs::, timeseries:Time series::
demo:education | status | select | undefined | ongoing:ongoing::, done:done::
demo:events | role | select | undefined | present:present::, attend:attend::
demo:events | status | select | undefined | upcoming:upcoming::, planned:planned::, completed:completed::, cancelled:cancelled::, not-attending:not-attending::
demo:funding | status | select | undefined | in-prep:in-prep::, planned:planned::, submitted:submitted::, awarded:awarded::, rejected:rejected::
demo:joint-work | person | select | ["people"] | b-coauthor:B. Coauthor::, b-colleague:B. Colleague::, c-senior:C. Senior::, chen-graph:Wei Chen::, dana-example:Dr. Dana Example::, rivera-lab:Ana Rivera::
demo:joint-work | status | select | undefined | exploring:exploring::, active:active::, completed:completed::
demo:literature | projects | tags | ["projects"] | bench-suite:bench-suite::, demo-toolkit:Demo-Toolkit::, early-benchmark:Early-Bench::, failed-quantization:Quant-NoGo::, graph-bandits:Graph-Bandits::, graph-transfer:Graph-Transfer::, online-clustering:Online-Cluster::, robust-embeddings:Robust-Emb::, sparse-attention:Sparse-Attn::, spectral-clustering-collab:Spectral Collab::, streaming-anomaly:Stream-Anomaly::, tensor-sketch:Sketched tensor decompositions for streaming data, online and out of core::, tensorkit-tensor-decomposition-toolkit:tensorkit - tensor decomposition toolkit::
demo:literature | source | select | undefined | search:search::, lit-watch:lit-watch::, hand:hand::
demo:organisations | kind | select | undefined | university:university::, hospital:hospital::, funder:funder::, company:company::, other:other::
demo:resources | kind | select | undefined | cluster:cluster::, machine:machine::, storage:storage::
demo:statements | status | select | undefined | draft:draft::, ready:ready::
demo:tasks | status | select | undefined | todo:todo::, doing:doing::, done:done::, dropped:dropped::
demo:venues | tier | select | undefined | flagship:flagship::, strong:strong::, specialist:specialist::
demo:venues | category | select | undefined | journal:journal::, conference:conference::
demo:venues | themes | tags | undefined | core-ml:Core ML::, graphs:Graphs::, systems:Systems::
== reference index
demo/.oculus/data/research/venues.yml | references 3 | definitions 8
demo/.oculus/data/research/data.yml | references 2 | definitions 7
demo/.oculus/data/pillars/pillars.yml | references 0 | definitions 3
demo/.oculus/data/pillars/domains.yml | references 0 | definitions 3
demo/.oculus/data/academic/funding.yml | references 0 | definitions 2
demo/.oculus/data/people/people.yml | references 0 | definitions 6
demo/.oculus/data/people/organisations.yml | references 0 | definitions 2
demo/.oculus/data/research/resources.yml | references 0 | definitions 2
demo/.oculus/data/research/statements.yml | references 0 | definitions 0
demo/.oculus/data/academic/events.yml | references 0 | definitions 0
demo/.oculus/data/academic/education.yml | references 0 | definitions 0
demo/.oculus/data/academic/applications.yml | references 0 | definitions 0
demo/.oculus/data/academic/joint-work.yml | references 2 | definitions 0
demo/.oculus/data/academic/tasks.yml | references 0 | definitions 0
demo/.oculus/data/literature/literature.yml | references 2 | definitions 0
demo/.oculus/data/academic/leads.yml | references 0 | definitions 0
demo/.oculus/data/literature/radar.yml | references 0 | definitions 0
demo/.oculus/data/academic/career.yml | references 0 | definitions 0
demo/projects/active/graph-bandits/project.yml | references 13 | definitions 1
demo/projects/active/graph-transfer/project.yml | references 11 | definitions 1
demo/projects/active/streaming-anomaly/project.yml | references 10 | definitions 1
demo/projects/archive/failed/failed-quantization/project.yml | references 5 | definitions 1
demo/projects/archive/published/early-benchmark/project.yml | references 8 | definitions 1
demo/projects/coauthor/spectral-clustering-collab/project.yml | references 10 | definitions 1
demo/projects/ideas/online-clustering/project.yml | references 6 | definitions 1
demo/projects/ideas/tensor-sketch/project.yml | references 6 | definitions 1
demo/projects/manuscripts/robust-embeddings/project.yml | references 10 | definitions 1
demo/projects/manuscripts/sparse-attention/project.yml | references 10 | definitions 1
demo/projects/software/bench-suite/project.yml | references 4 | definitions 0
demo/projects/software/demo-toolkit/project.yml | references 8 | definitions 1
demo/projects/software/tensorkit-tensor-decomposition-toolkit/project.yml | references 4 | definitions 0
demo/projects/active/graph-bandits/present/present.yml | references 0 | definitions 0
demo/deck/present.yml | references 0 | definitions 0
total | references 114 | definitions 44
== writes on the first entry of each collection, each on a fresh copy
data | edit synthgraph name | found true | id synthgraph | changed ["name"] | refused [] | lines differing 1
data | remove synthgraph | found true | changed ["datasets"] | refused [] | entries 5 -> 4
data | add {"key":"case-one-new","name":"case-one-new"} | found true | changed ["datasets"] | refused [] | entries 5 -> 6
venues | edit jmlr name | found true | id jmlr | changed ["name"] | refused [] | lines differing 1
venues | remove jmlr | found true | changed ["entries"] | refused [] | entries 5 -> 4
venues | add {"id":"case-one-new","name":"case-one-new"} | found true | changed ["entries"] | refused [] | entries 5 -> 6
pillars | edit tensors title | found true | id tensors | changed ["title"] | refused [] | lines differing 1
pillars | remove tensors | found true | changed ["entries"] | refused [] | entries 3 -> 2
pillars | add {"key":"case-one-new","title":"case-one-new"} | found true | changed ["entries"] | refused [] | entries 3 -> 4
domains | edit method title | found true | id method | changed ["title"] | refused [] | lines differing 1
domains | remove method | found true | changed ["entries"] | refused [] | entries 3 -> 2
domains | add {"key":"case-one-new","title":"case-one-new"} | found true | changed ["entries"] | refused [] | entries 3 -> 4
statements | edit short-bio-100-words title | found true | id short-bio-100-words | changed ["title"] | refused [] | lines differing 1
statements | remove short-bio-100-words | found true | changed ["entries"] | refused [] | entries 3 -> 2
statements | add {"key":"case-one-new","title":"case-one-new","status":"draft"} | found true | changed ["entries"] | refused [] | entries 3 -> 4
people | edit rivera-lab name | found true | id rivera-lab | changed ["name"] | refused [] | lines differing 1
people | remove rivera-lab | found true | changed ["entries"] | refused [] | entries 6 -> 5
people | add {"key":"case-one-new","name":"case-one-new"} | found true | changed ["entries"] | refused [] | entries 6 -> 7
organisations | edit northwood-university name | found true | id northwood-university | changed ["name"] | refused [] | lines differing 1
organisations | remove northwood-university | found true | changed ["entries"] | refused [] | entries 2 -> 1
organisations | add {"key":"case-one-new","name":"case-one-new","kind":"university"} | found true | changed ["entries"] | refused [] | entries 2 -> 3
resources | edit utwente name | found true | id utwente | changed ["name"] | refused [] | lines differing 1
resources | remove utwente | found true | changed ["entries"] | refused [] | entries 2 -> 1
resources | add {"key":"case-one-new","name":"case-one-new","kind":"cluster"} | found true | changed ["entries"] | refused [] | entries 2 -> 3
funding | edit ecf title | found true | id ecf | changed ["title"] | refused [] | lines differing 1
funding | remove ecf | found true | changed ["entries"] | refused [] | entries 2 -> 1
funding | add {"key":"case-one-new","title":"case-one-new","status":"in-prep"} | found true | changed ["entries"] | refused [] | entries 2 -> 3
events | edit streaming-anomaly-detection-at-scale title | found true | id streaming-anomaly-detection-at-scale | changed ["title"] | refused [] | lines differing 1
events | remove streaming-anomaly-detection-at-scale | found true | changed ["entries"] | refused [] | entries 3 -> 2
events | add {"key":"case-one-new","title":"case-one-new","role":"present","status":"upcoming"} | found true | changed ["entries"] | refused [] | entries 3 -> 4
education | edit machine-learning-msc title | found true | id machine-learning-msc | changed ["title"] | refused [] | lines differing 1
education | remove machine-learning-msc | found true | changed ["entries"] | refused [] | entries 2 -> 1
education | add {"key":"case-one-new","title":"case-one-new"} | found true | changed ["entries"] | refused [] | entries 2 -> 3
applications | edit assistant-professor-ml title | found true | id assistant-professor-ml | changed ["title"] | refused [] | lines differing 1
applications | remove assistant-professor-ml | found true | changed ["entries"] | refused [] | entries 2 -> 1
applications | add {"key":"case-one-new","title":"case-one-new"} | found true | changed ["entries"] | refused [] | entries 2 -> 3
joint-work | edit rivera-lab title | found true | id rivera-lab | changed ["title"] | refused [] | lines differing 1
joint-work | remove rivera-lab | found true | changed ["entries"] | refused [] | entries 2 -> 1
joint-work | add {"key":"case-one-new","title":"case-one-new","person":"case-one-new","status":"exploring"} | found true | changed ["entries"] | refused [] | entries 2 -> 3
tasks | edit review-2-papers-for-mlshift-workshop title | found true | id review-2-papers-for-mlshift-workshop | changed ["title"] | refused [] | lines differing 1
tasks | remove review-2-papers-for-mlshift-workshop | found true | changed ["entries"] | refused [] | entries 3 -> 2
tasks | add {"key":"case-one-new","title":"case-one-new","status":"todo"} | found true | changed ["entries"] | refused [] | entries 3 -> 4
literature | edit example2024bandit title | found true | id example2024bandit | changed ["title"] | refused [] | lines differing 1
literature | remove example2024bandit | found true | changed ["entries"] | refused [] | entries 2 -> 1
literature | add {"key":"case-one-new"} | found true | changed ["entries"] | refused [] | entries 2 -> 3
```

### case09.case.ts

```ts
// Case 9 of O79: a dataset entry whose `retrieval` source is `kind: derived` with the data field
// `from: [synthgraph]`, planted in a scratch copy of the demo hub with the hub's `retrieval` schema
// field (its nested `from` field naming the datasets as the hub's data.yml:60 does). Prints the
// dataset's retrieval as the snapshot reads it, the Data view's derived-from line, every finding on
// data.yml and the references the index finds in data.yml. Writes only under the scratchpad folder,
// removed at the end. SOURCE_KEY is the schema key the nested field names its source by.
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { it } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79/node_modules/vitest/dist/index.js';

const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79';
const S = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o79';
const OUT = join(S, 'case09.out.txt');
const SOURCE_KEY = process.env.O79_SOURCE_KEY ?? 'from: datasets';

it('case 9', async () => {
    const { engineDir, loadConfig, textCatalog } = await import(`${W}/src/lib/data/sources/config.ts`);
    const { published, indexedOnce } = await import(`${W}/tests/data/hubs/hubs-fixture.ts`);
    const { setCatalog } = await import(`${W}/src/lib/state/shared/words/text.ts`);
    const { statedWords } = await import(`${W}/src/lib/state/sources/registries/datasets.ts`);
    const lines: string[] = [];
    const say = (line: string): void => void lines.push(line);
    const runs = mkdtempSync(join(S, 'runs-'));
    try {
        const hub = join(runs, 'demo');
        cpSync(join(W, 'tests', 'fixtures', 'hubs', 'demo'), hub, { recursive: true });
        const file = join(hub, '.oculus', 'data', 'research', 'data.yml');
        const text = readFileSync(file, 'utf8')
            .replace(
                'datasets:\n',
                [
                    '  - field: retrieval',
                    '    type: records',
                    '    fields:',
                    '      - { field: kind, type: select, options: [url, derived], required: true }',
                    `      - { field: from, type: tags, ${SOURCE_KEY}, when: { kind: derived } }`,
                    '      - { field: script, type: text, when: { kind: derived } }',
                    'datasets:',
                    '  - key: synth-cache',
                    '    name: Synthetic graph caches (derived)',
                    '    retrieval:',
                    '      - kind: derived',
                    '        from: [synthgraph]',
                    '        script: code/prep.py',
                    ''
                ].join('\n')
            );
        writeFileSync(file, text);
        say(`== planted schema line: from, type tags, ${SOURCE_KEY}`);
        const folders = [{ name: 'demo', dir: hub }];
        const { snapshot } = published(folders, 'demo');
        setCatalog(textCatalog(loadConfig(engineDir(), { hub }).config));
        const dataset = snapshot.entities.datasets['demo:synth-cache'];
        say(`retrieval: ${JSON.stringify(dataset?.retrieval)}`);
        for (const source of dataset?.retrieval ?? []) say(`derived-from line: ${statedWords(source)}`);
        const found = snapshot.findings.filter((one: { file: string }) => one.file === file);
        say(`findings on data.yml: ${found.length}`);
        for (const one of found) say(`  ${one.key} | ${one.message}`);
        const { references } = indexedOnce(folders, 'demo');
        const scan = references.files.find((one: { file: { path: string } }) =>
            one.file.path.endsWith('research/data.yml')
        );
        for (const one of scan?.references ?? []) {
            say(`reference: ${one.value} line ${one.span.start.line} sources ${one.sources.join(',')}`);
        }
    } finally {
        rmSync(runs, { recursive: true, force: true });
        writeFileSync(OUT, `${lines.join('\n')}\n`);
    }
});
```

Printed (`Tests  1 passed (1)`):

```
== planted schema line: from, type tags, from: datasets
retrieval: [{"kind":"derived","from":["synthgraph"],"script":"code/prep.py"}]
derived-from line: Built from synthgraph by code/prep.py
findings on data.yml: 0
reference: synthgraph line 19 sources datasets
reference: graphs line 25 sources options:.oculus/data/research/data.yml#themes
reference: timeseries line 33 sources options:.oculus/data/research/data.yml#themes
```

### case10.case.ts

```ts
// Case 10 of O79, its program half: a scratch copy of the demo hub whose `collections:` entry of the
// leads carries `primary_key: title`, and its leads file no schema, as the demo hub's has none.
// Prints the config's findings on the hub's settings file, the field the feed writer addresses a
// lead by and where it reads it from, and a write of a lead's status through the feed writer, by
// the lead's title. Writes only under the scratchpad folder, removed at the end.
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { it } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79/node_modules/vitest/dist/index.js';

const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79';
const S = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o79';
const OUT = join(S, 'case10.out.txt');

it('case 10', async () => {
    const { engineDir, loadConfig } = await import(`${W}/src/lib/data/sources/config.ts`);
    const { portfolioConfigFrom } = await import(`${W}/src/lib/data/index.ts`);
    const feeds = await import(`${W}/src/lib/server/edit/feeds/feeds.ts`);
    const lines: string[] = [];
    const say = (line: string): void => void lines.push(line);
    const runs = mkdtempSync(join(S, 'runs-'));
    try {
        const hub = join(runs, 'demo');
        cpSync(join(W, 'tests', 'fixtures', 'hubs', 'demo'), hub, { recursive: true });
        const settings = join(hub, '.oculus', 'config.yml');
        const before = readFileSync(settings, 'utf8');
        const after = before.replace(
            '{ key: leads, file: ".oculus/data/academic/leads.yml", registry: leads,',
            '{ key: leads, file: ".oculus/data/academic/leads.yml", registry: leads, primary_key: title,'
        );
        say(`settings entry rewritten: ${after !== before}`);
        writeFileSync(settings, after);
        const loaded = loadConfig(engineDir(), { hub });
        const config = portfolioConfigFrom(loaded.config, loaded.from);
        const own = loaded.findings.filter((one: { file: string }) => one.file === settings);
        say(`findings on the hub's settings file: ${own.length}`);
        for (const one of own) say(`  ${one.key} | ${one.message}`);
        say(`the leads entry as read: ${JSON.stringify(
            (loaded.config.collections as { key: string }[]).find((one) => one.key === 'leads')
        )}`);
        say(`the field the feed writer addresses a lead by: ${JSON.stringify(feeds.FEED_RULES.leads)}`);
        const title = 'Postdoc, Robust ML';
        const out = feeds.writeFeedField(hub, config, 'leads', title, 'status', 'declined');
        say(`writeFeedField(leads, ${JSON.stringify(title)}, status, declined): found ${out.found} | changed ${JSON.stringify(out.changed)} | refused ${JSON.stringify(out.refused)}`);
        const written = readFileSync(join(hub, '.oculus', 'data', 'academic', 'leads.yml'), 'utf8');
        const at = written.indexOf(title);
        say(`the lead after the write: ${JSON.stringify(written.slice(at, at + 220))}`);
    } finally {
        rmSync(runs, { recursive: true, force: true });
        writeFileSync(OUT, `${lines.join('\n')}\n`);
    }
});
```

Printed (`Tests  1 passed (1)`):

```
settings entry rewritten: true
findings on the hub's settings file: 0
the leads entry as read: {"key":"leads","file":".oculus/data/academic/leads.yml","registry":"leads","primary_key":"title","ticker":{"category":"position"},"about":"files.make_collection_line_leads"}
the field the feed writer addresses a lead by: {"identity":"title","fields":["status"],"schema":true,"deletable":true}
writeFeedField(leads, "Postdoc, Robust ML", status, declined): found true | changed ["status"] | refused []
the lead after the write: "Postdoc, Robust ML\"\n    inst: \"Meridian Institute\"\n    country: \"NL\"\n    typ: \"postdoc\"\n    focus: \"robustness, distribution shift\"\n    fit: reach\n    status: declined\n    deadline: \"2026-05-01\"\n    url: \"https://example"
```

### case15.case.ts

```ts
// Case 15 of O79, its program half, over the scratch copy of the hub (O79_HUB, the folder
// scratchpad/o79-hub, which holds no local.yml). Prints, for every data file of `.oculus/data/` and
// for `.oculus/bookmarks.yml`: each schema line, at any depth, that holds a `from:` key; the fields
// flagged `primary_key: true`; each `foreign_key:` and whether it names a collection of the hub,
// `projects` or a vocabulary list. Prints also the `collections:` entries the hub reads its leads and
// radar by, and the file each entry comes from (the hub's settings file or oculus's sources.yml),
// with each entry's `primary_key:`. Reads only; writes its output under the scratchpad folder.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { globSync } from 'node:fs';
import { parse } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79/node_modules/yaml/dist/index.js';
import { it } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79/node_modules/vitest/dist/index.js';

const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79';
const S = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o79';
const HUB = process.env.O79_HUB ?? `${S}-hub`;
const OUT = join(S, 'case15.out.txt');

type Field = { field?: string; fields?: Field[]; [key: string]: unknown };

it('case 15', async () => {
    const { engineDir, loadConfig } = await import(`${W}/src/lib/data/sources/config.ts`);
    const lines: string[] = [];
    const say = (line: string): void => void lines.push(line);
    try {
        const loaded = loadConfig(engineDir(), { hub: HUB });
        const merged = loaded.config;
        const entries = (merged.collections ?? []) as Record<string, unknown>[];
        const keys = entries.map((one) => String(one.key));
        const vocab = (source: string): boolean => {
            if (!source.startsWith('vocab.')) return false;
            const [list, field] = source.slice('vocab.'.length).split('.');
            const held = merged[list];
            if (held === undefined) return false;
            if (field === undefined) return true;
            return Object.values(held as Record<string, unknown>).some(
                (row) => typeof row === 'object' && row !== null && (row as Record<string, unknown>)[field] === true
            );
        };
        say(`the collections list comes from: ${loaded.from.collections ?? '(none)'}`);
        for (const one of entries.filter((entry) => ['leads', 'radar'].includes(String(entry.registry)))) {
            say(`  entry ${String(one.key)} | file ${String(one.file)} | primary_key ${JSON.stringify(one.primary_key)}`);
        }
        const files = [
            ...globSync('.oculus/data/**/*.yml', { cwd: HUB }).sort(),
            '.oculus/bookmarks.yml'
        ];
        let froms = 0;
        let unnamed = 0;
        for (const path of files) {
            const data = parse(readFileSync(join(HUB, path), 'utf8')) as Record<string, unknown>;
            const schema = Array.isArray(data?.schema) ? (data.schema as Field[]) : null;
            if (schema === null) {
                say(`${path} | no schema`);
                continue;
            }
            const flagged: string[] = [];
            const walk = (fields: Field[], at: string): void => {
                for (const one of fields) {
                    const name = `${at}${String(one.field)}`;
                    if (Object.hasOwn(one, 'from')) {
                        froms += 1;
                        say(`${path} | from: on ${name} | ${JSON.stringify(one.from)}`);
                    }
                    if (one.primary_key === true) flagged.push(name);
                    if (Object.hasOwn(one, 'foreign_key')) {
                        const targets = [one.foreign_key].flat() as unknown[];
                        for (const target of targets) {
                            const word = typeof target === 'string' ? target : JSON.stringify(target);
                            const ok =
                                typeof target === 'string' &&
                                (target === 'projects' || keys.includes(target) || vocab(target));
                            if (!ok) unnamed += 1;
                            say(`${path} | foreign_key on ${name} | ${word} | ${ok ? 'names a target' : 'NAMES NOTHING'}`);
                        }
                    }
                    if (Array.isArray(one.fields)) walk(one.fields, `${name}.`);
                }
            };
            walk(schema, '');
            say(`${path} | primary keys: ${flagged.length === 0 ? 'none' : flagged.join(', ')}`);
        }
        say(`schema lines holding from: ${froms}`);
        say(`foreign keys naming nothing: ${unnamed}`);
    } finally {
        writeFileSync(OUT, `${lines.join('\n')}\n`);
    }
});
```

Printed (`Tests  1 passed (1)`), over the scratch copy as copied, no rewrite:

```
the collections list comes from: sources.yml
  entry leads | file .oculus/data/academic/leads.yml | primary_key undefined
  entry radar | file .oculus/data/literature/radar.yml | primary_key undefined
.oculus/data/academic/applications.yml | from: on related | "projects"
.oculus/data/academic/applications.yml | from: on lead | "people"
.oculus/data/academic/applications.yml | from: on collaborators | "people"
.oculus/data/academic/applications.yml | from: on supervisors | "people"
.oculus/data/academic/applications.yml | primary keys: none
.oculus/data/academic/career.yml | primary keys: none
.oculus/data/academic/education.yml | from: on related | "projects"
.oculus/data/academic/education.yml | from: on lead | "people"
.oculus/data/academic/education.yml | from: on collaborators | "people"
.oculus/data/academic/education.yml | from: on supervisors | "people"
.oculus/data/academic/education.yml | primary keys: none
.oculus/data/academic/events.yml | from: on related | "projects"
.oculus/data/academic/events.yml | from: on lead | "people"
.oculus/data/academic/events.yml | from: on collaborators | "people"
.oculus/data/academic/events.yml | from: on supervisors | "people"
.oculus/data/academic/events.yml | primary keys: none
.oculus/data/academic/funding.yml | from: on funder | "organisations"
.oculus/data/academic/funding.yml | from: on lead | "people"
.oculus/data/academic/funding.yml | from: on collaborators | "people"
.oculus/data/academic/funding.yml | from: on supervisors | "people"
.oculus/data/academic/funding.yml | primary keys: none
.oculus/data/academic/joint-work.yml | from: on person | "people"
.oculus/data/academic/joint-work.yml | primary keys: none
.oculus/data/academic/leads.yml | primary keys: none
.oculus/data/academic/tasks.yml | from: on lead | "people"
.oculus/data/academic/tasks.yml | from: on collaborators | "people"
.oculus/data/academic/tasks.yml | from: on supervisors | "people"
.oculus/data/academic/tasks.yml | primary keys: none
.oculus/data/literature/literature.yml | from: on projects | "projects"
.oculus/data/literature/literature.yml | primary keys: none
.oculus/data/literature/radar.yml | from: on bucket | "vocab.radar_buckets"
.oculus/data/literature/radar.yml | from: on project | "projects"
.oculus/data/literature/radar.yml | from: on maps_to | "projects"
.oculus/data/literature/radar.yml | primary keys: none
.oculus/data/people/organisations.yml | primary keys: none
.oculus/data/people/people.yml | from: on affiliations | "organisations"
.oculus/data/people/people.yml | primary keys: none
.oculus/data/pillars/domains.yml | primary keys: none
.oculus/data/pillars/pillars.yml | primary keys: none
.oculus/data/research/data.yml | from: on access | "vocab.data_access"
.oculus/data/research/data.yml | from: on retrieval.from | "datasets"
.oculus/data/research/data.yml | primary keys: none
.oculus/data/research/resources.yml | primary keys: none
.oculus/data/research/statements.yml | primary keys: none
.oculus/data/research/venues.yml | from: on category | "vocab.venue_categories"
.oculus/data/research/venues.yml | from: on tier | "vocab.venue_tiers"
.oculus/data/research/venues.yml | primary keys: none
.oculus/bookmarks.yml | primary keys: none
schema lines holding from: 29
foreign keys naming nothing: 0
```

The integrity file over the same copy, `OCULUS_TEST_HUB=<scratchpad>/o79-hub npx vitest run tests/checks/config/integrity.test.ts --reporter=verbose`, its lines filtered by `grep -E` on the pass, fail and skip glyphs and on `Test Files`, `Tests ` and `FAIL` (the pass glyph written here as <check>):

```
<check> |unit| tests/checks/config/integrity.test.ts > the demo hub > validates with no findings 493ms
<check> |unit| tests/checks/config/integrity.test.ts > the demo hub > holds exactly what a second count of the tree finds 11ms
<check> |unit| tests/checks/config/integrity.test.ts > the demo hub > survives JSON.stringify and JSON.parse unchanged 3ms
<check> |unit| tests/checks/config/integrity.test.ts > the demo hub > reads a deck out of every project that has a present/ folder, with no finding 4ms
<check> |unit| tests/checks/config/integrity.test.ts > the demo hub > reads an equation out of every slide that writes one, as LaTeX that typesets 8ms
<check> |unit| tests/checks/config/integrity.test.ts > the demo hub > reads the portfolio deck with every named deck found 5ms
<check> |unit| tests/checks/config/integrity.test.ts > the real hub > validates with no findings 4781ms
<check> |unit| tests/checks/config/integrity.test.ts > the real hub > holds exactly what a second count of the tree finds 483ms
<check> |unit| tests/checks/config/integrity.test.ts > the real hub > survives JSON.stringify and JSON.parse unchanged 16ms
<check> |unit| tests/checks/config/integrity.test.ts > the real hub > reads a deck out of every project that has a present/ folder, with no finding 156ms
<check> |unit| tests/checks/config/integrity.test.ts > the real hub > reads an equation out of every slide that writes one, as LaTeX that typesets 208ms
<check> |unit| tests/checks/config/integrity.test.ts > the real hub > reads the portfolio deck with every named deck found 22ms
<check> |unit| tests/checks/config/integrity.test.ts > the real hub > reads every project of the personal folder with no finding, each with the tier personal 1037ms
<check> |unit| tests/checks/config/integrity.test.ts > the count of written equations > agrees with the reader on several slides, a blank equation and a value that is not text 189ms
 Test Files  1 passed (1)
      Tests  14 passed (14)
```

### case18.case.ts

```ts
// Case 18 of O79: a new hub made from docs/templates.md as Make Folder a Hub makes one with every
// collection ticked (`.oculus/config.yml` from `hubConfigText`, each collection's data file from its
// template body at its path; no local.yml), in a scratch folder. Prints every finding of its build
// and an Add on each collection through createEntry, the identity field and the required fields
// given. Writes only under the scratchpad folder, removed at the end.
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { it } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79/node_modules/vitest/dist/index.js';

const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79';
const S = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o79';
const OUT = join(S, 'case18.out.txt');

it('case 18', async () => {
    const { engineDir, loadConfig } = await import(`${W}/src/lib/data/sources/config.ts`);
    const { portfolioConfigFrom } = await import(`${W}/src/lib/data/index.ts`);
    const { published } = await import(`${W}/tests/data/hubs/hubs-fixture.ts`);
    const { collectionTemplates, hubConfigText } = await import(
        `${W}/src/lib/data/sources/documents/templates.ts`
    );
    const { createEntry } = await import(`${W}/src/lib/server/edit/writes.ts`);
    const { readCollection } = await import(`${W}/src/lib/server/files/fs/collections.ts`);
    const lines: string[] = [];
    const say = (line: string): void => void lines.push(line);
    const runs = mkdtempSync(join(S, 'runs-'));
    try {
        const hub = join(runs, 'fresh');
        const page = readFileSync(join(W, 'docs', 'templates.md'), 'utf8');
        const chosen = collectionTemplates(page);
        say(`collections offered: ${chosen.map((one: { key: string }) => one.key).join(', ')}`);
        mkdirSync(join(hub, '.oculus'), { recursive: true });
        writeFileSync(join(hub, '.oculus', 'config.yml'), hubConfigText(page, chosen));
        for (const one of chosen as { file: string; body: string }[]) {
            mkdirSync(dirname(join(hub, one.file)), { recursive: true });
            writeFileSync(join(hub, one.file), one.body);
        }
        const { snapshot } = published([{ name: 'fresh', dir: hub }], 'fresh');
        say(`findings: ${snapshot.findings.length}`);
        for (const one of snapshot.findings) say(`  ${one.file.slice(hub.length)} | ${one.key} | ${one.message}`);
        const loaded = loadConfig(engineDir(), { hub });
        const config = portfolioConfigFrom(loaded.config, loaded.from);
        for (const entry of config.collections) {
            const held = readCollection(hub, config, entry.key);
            if (held === null) {
                say(`${entry.key} | add | no file read`);
                continue;
            }
            const schema = (Array.isArray(held.schema) ? held.schema : []) as {
                field: string;
                type: string;
                required?: unknown;
                options?: unknown[];
            }[];
            const fields: Record<string, unknown> = { [held.ident]: 'case-eighteen' };
            for (const one of schema) {
                if (one.required !== true || one.field in fields) continue;
                const option = one.options?.at(0);
                fields[one.field] =
                    option === undefined
                        ? 'case-eighteen'
                        : typeof option === 'string'
                          ? option
                          : (option as { key: string }).key;
            }
            const out = createEntry(hub, config, entry.key, fields);
            say(`${entry.key} | add ${JSON.stringify(fields)} | found ${out.found} | changed ${JSON.stringify(out.changed)} | refused ${JSON.stringify(out.refused)}`);
        }
    } finally {
        rmSync(runs, { recursive: true, force: true });
        writeFileSync(OUT, `${lines.join('\n')}\n`);
    }
});
```

Printed (`Tests  1 passed (1)`):

```
collections offered: data, venues, pillars, domains, statements, people, organisations, resources, funding, events, education, applications, joint-work, tasks, literature, leads, radar
findings: 5
  /projects/active | scan | scan directory does not exist
  /projects/archive | scan | scan directory does not exist
  /projects/coauthor | scan | scan directory does not exist
  /projects/ideas | scan | scan directory does not exist
  /projects/manuscripts | scan | scan directory does not exist
data | add | no file read
venues | add {"name":"case-eighteen"} | found true | changed [] | refused [{"field":"id","reason":"a new entry needs a non-empty id"}]
pillars | add {"key":"case-eighteen","title":"case-eighteen"} | found true | changed ["entries"] | refused []
domains | add {"key":"case-eighteen","title":"case-eighteen"} | found true | changed ["entries"] | refused []
statements | add {"key":"case-eighteen","title":"case-eighteen","status":"draft"} | found true | changed ["entries"] | refused []
people | add {"key":"case-eighteen","name":"case-eighteen"} | found true | changed ["entries"] | refused []
organisations | add {"key":"case-eighteen","name":"case-eighteen","kind":"university"} | found true | changed ["entries"] | refused []
resources | add {"key":"case-eighteen","name":"case-eighteen","kind":"cluster"} | found true | changed ["entries"] | refused []
funding | add {"key":"case-eighteen","title":"case-eighteen","status":"in-prep","lead":"case-eighteen"} | found true | changed ["entries"] | refused []
events | add {"key":"case-eighteen","title":"case-eighteen","role":"present","status":"upcoming","lead":"case-eighteen"} | found true | changed ["entries"] | refused []
education | add {"key":"case-eighteen","title":"case-eighteen","status":"planned","lead":"case-eighteen"} | found true | changed ["entries"] | refused []
applications | add {"key":"case-eighteen","title":"case-eighteen","status":"not-applied","lead":"case-eighteen"} | found true | changed ["entries"] | refused []
joint-work | add {"key":"case-eighteen","title":"case-eighteen","person":"case-eighteen","status":"exploring"} | found true | changed ["entries"] | refused []
tasks | add {"key":"case-eighteen","title":"case-eighteen","status":"todo","lead":"case-eighteen"} | found true | changed ["entries"] | refused []
literature | add {"key":"case-eighteen","title":"case-eighteen"} | found true | changed ["entries"] | refused []
```

### Other commands of the first run that wrote files

- `npx svelte-kit sync` in the worktree: wrote the git-ignored `.svelte-kit/`.
- `cp -cR` of the hub into `scratchpad/o79-hub` (APFS clones, the hub's files untouched) and `rm -rf` of that folder and of the scratchpad's vitest cache `scratchpad/o79/node_modules`.

## The after-run programs

The same programs, run from the worktree's root with `O79_OUT=caseNN.after.txt npx vitest run --config <scratchpad>/o79/vitest.config.mts --root <scratchpad>/o79 caseNN` (case 9 also with `O79_SOURCE_KEY='foreign_key: data'`), each writing its lines to `caseNN.after.txt`; case 15b writes `case15b.out.txt`. Every after-run, and the integrity case of case 15, ran again after the last change of the tree, and each output file's `md5` before and after that run is the same (cases 1, 9, 10) or its text is the one quoted below (cases 15, 15b, 18). Case 15 ran over a fresh `scratchpad/o79-hub` (`cp -cR` of the hub without `.git` and without `.oculus/local.yml`; `find <copy> -name local.yml | wc -l` prints `0`) with the rewrite of "Hub rewrite" applied there by Edit. Each program's change from the source printed above, as `diff <first-run source> <after-run source>`:

case01: the output file from `O79_OUT`; a field's source read as `foreign_key ?? from`; the id from `entryId` when the module still exports it, else `entryIdOf`:

```
13c13
< const OUT = join(S, 'case01.out.txt');
> const OUT = join(S, process.env.O79_OUT ?? 'case01.out.txt');
93a94,95
>         const sourceOf = (field: { from?: unknown; foreign_key?: unknown }): unknown =>
>             field.foreign_key ?? field.from;
103,104c105,106
<             if (field.from === undefined && field.options === undefined) continue;
<             say(`${field.field} | ${field.type} | ${JSON.stringify(field.from)} | ${choices(field)}`);
>             if (sourceOf(field) === undefined && field.options === undefined) continue;
>             say(`${field.field} | ${field.type} | ${JSON.stringify(sourceOf(field))} | ${choices(field)}`);
111c113
<                 if (field.from === undefined && field.options === undefined) continue;
>                 if (sourceOf(field) === undefined && field.options === undefined) continue;
113c115
<                     `${one.id} | ${field.field} | ${field.type} | ${JSON.stringify(field.from)} | ${choices(field)}`
>                     `${one.id} | ${field.field} | ${field.type} | ${JSON.stringify(sourceOf(field))} | ${choices(field)}`
146,147c148,153
<             const { entryId } = await import(`${W}/src/lib/server/files/fs/collections.ts`);
<             const id = entryId(item, first.ident);
>             const held = await import(`${W}/src/lib/server/files/fs/collections.ts`);
>             const model = await import(`${W}/src/lib/data/model/index.ts`);
>             const id =
>                 'entryId' in held
>                     ? held.entryId(item, first.ident)
>                     : model.entryIdOf(item, first.ident);
```

case09 and case15: the output file from `O79_OUT` only.

case10: the output file from `O79_OUT`; the planted `primary_key: title` skipped when the demo's entry carries it already; the field the writer addresses a lead by read from `readFeedFile(...).primary_key`:

```
26c26,28
<         const after = before.replace(
>         const carried = before.includes('registry: leads, primary_key: title');
>         say(`the demo hub's leads entry already carries primary_key: title: ${carried}`);
>         const after = carried ? before : before.replace(
40c42,46
<         say(`the field the feed writer addresses a lead by: ${JSON.stringify(feeds.FEED_RULES.leads)}`);
>         say(
>             'FEED_RULES' in feeds
>                 ? `the field the feed writer addresses a lead by: ${JSON.stringify(feeds.FEED_RULES.leads)}`
>                 : `the primary key the feed writer addresses a lead by, read from the file and its entry: ${JSON.stringify(feeds.readFeedFile(hub, config, 'leads')?.primary_key)}`
>         );
```

case18: the output file from `O79_OUT`; a file with no primary key skipped; the fields the Add box asks printed; the findings on files under `.oculus` counted; an Add on the leads and radar feeds:

```
53a54,62
>             if (held.ident === null) {
>                 say(`${entry.key} | add | the file has no primary key`);
>                 continue;
>             }
>             const forms = await import(`${W}/src/lib/state/forms/new-entry.ts`);
>             if ('askFields' in forms && forms.askFields.length === 2) {
>                 const asked = forms.askFields(held.schema, held.ident) as { field: string }[];
>                 say(`${entry.key} | the Add box asks ${asked.map((one) => one.field).join(', ')}`);
>             }
67a77,88
>         const inData = snapshot.findings.filter((one: { file: string }) =>
>             one.file.startsWith(join(hub, '.oculus'))
>         );
>         say(`findings on a file under .oculus: ${inData.length}`);
>         const feeds = await import(`${W}/src/lib/server/edit/feeds/feeds.ts`);
>         const radar = await import(`${W}/src/lib/server/edit/feeds/radar.ts`);
>         const lead = feeds.addLead(hub, config, { title: 'case-eighteen' });
>         say(`leads | add {"title":"case-eighteen"} | found ${lead.found} | changed ${JSON.stringify(lead.changed)} | refused ${JSON.stringify(lead.refused)} | id ${JSON.stringify(lead.id)}`);
>         const buckets = radar.radarBucketKeys(loaded.config) as string[];
>         const paper = { title: 'case-eighteen', bucket: buckets[0] };
>         const added = radar.addRadarEntry(hub, config, paper, buckets);
>         say(`radar | add ${JSON.stringify(paper)} | found ${added.found} | changed ${JSON.stringify(added.changed)} | refused ${JSON.stringify(added.refused)} | id ${JSON.stringify(added.id)}`);
```

### case15b.case.ts (new)

```ts
// Case 15's second extra run of O79: a hub that names no `collections:` list, so it reads oculus's
// own entries, whose leads file has no schema. Prints where its collections list comes from, the
// leads entry it reads, and every finding of its build on the leads file. Writes only under the
// scratchpad folder, removed at the end.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { it } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79/node_modules/vitest/dist/index.js';

const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O79';
const S = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o79';
const OUT = join(S, process.env.O79_OUT ?? 'case15b.out.txt');

it('case 15b', async () => {
    const { engineDir, loadConfig } = await import(`${W}/src/lib/data/sources/config.ts`);
    const { portfolioConfigFrom } = await import(`${W}/src/lib/data/index.ts`);
    const { buildOneHub } = await import(`${W}/tests/fixtures/hubs/hub-build.ts`);
    const lines: string[] = [];
    const say = (line: string): void => void lines.push(line);
    const runs = mkdtempSync(join(S, 'runs-'));
    try {
        const hub = join(runs, 'bare');
        mkdirSync(join(hub, '.oculus', 'data', 'academic'), { recursive: true });
        writeFileSync(join(hub, '.oculus', 'config.yml'), 'scan: []\n');
        const leads = join(hub, '.oculus', 'data', 'academic', 'leads.yml');
        writeFileSync(leads, 'entries:\n  - { title: A postdoc, status: open }\n');
        const loaded = loadConfig(engineDir(), { hub });
        say(`the collections list comes from: ${loaded.from.collections ?? '(none)'}`);
        const entry = (loaded.config.collections as Record<string, unknown>[]).find(
            (one) => one.registry === 'leads'
        );
        say(`the leads entry: ${JSON.stringify(entry)}`);
        const { snapshot } = buildOneHub(hub, portfolioConfigFrom(loaded.config, loaded.from));
        const found = snapshot.findings.filter((one: { file: string }) => one.file === leads);
        say(`findings on the leads file: ${found.length}`);
        for (const one of found) say(`  ${one.file.slice(hub.length)} | ${one.key} | ${one.message}`);
    } finally {
        rmSync(runs, { recursive: true, force: true });
        writeFileSync(OUT, `${lines.join('\n')}\n`);
    }
});
```

### What the after-runs printed

case01.after.txt differs from case01.out.txt in these lines only (`diff case01.out.txt case01.after.txt`):

```
113c113
< datasets | chips | "datasets" | node-traces:Node arrival traces::, probe-logs:Node probe logs::, stream-bench:Streaming anomaly benchmark::, synthgraph:Synthetic evolving-graph benchmark::, toy-embed:Toy embedding corpus::
> datasets | chips | "data" | node-traces:Node arrival traces::, probe-logs:Node probe logs::, stream-bench:Streaming anomaly benchmark::, synthgraph:Synthetic evolving-graph benchmark::, toy-embed:Toy embedding corpus::
146,152c146,152
< demo/.oculus/data/research/statements.yml | references 0 | definitions 0
< demo/.oculus/data/academic/events.yml | references 0 | definitions 0
< demo/.oculus/data/academic/education.yml | references 0 | definitions 0
< demo/.oculus/data/academic/applications.yml | references 0 | definitions 0
< demo/.oculus/data/academic/joint-work.yml | references 2 | definitions 0
< demo/.oculus/data/academic/tasks.yml | references 0 | definitions 0
< demo/.oculus/data/literature/literature.yml | references 2 | definitions 0
> demo/.oculus/data/research/statements.yml | references 0 | definitions 3
> demo/.oculus/data/academic/events.yml | references 0 | definitions 3
> demo/.oculus/data/academic/education.yml | references 0 | definitions 2
> demo/.oculus/data/academic/applications.yml | references 0 | definitions 2
> demo/.oculus/data/academic/joint-work.yml | references 2 | definitions 2
> demo/.oculus/data/academic/tasks.yml | references 0 | definitions 3
> demo/.oculus/data/literature/literature.yml | references 2 | definitions 2
171c171
< total | references 114 | definitions 44
> total | references 114 | definitions 61
```

case09.after.txt:

```
== planted schema line: from, type tags, foreign_key: data
retrieval: [{"kind":"derived","from":["synthgraph"],"script":"code/prep.py"}]
derived-from line: Built from synthgraph by code/prep.py
findings on data.yml: 0
reference: synthgraph line 19 sources datasets
reference: graphs line 25 sources options:.oculus/data/research/data.yml#themes
reference: timeseries line 33 sources options:.oculus/data/research/data.yml#themes
```

case10.after.txt:

```
the demo hub's leads entry already carries primary_key: title: true
settings entry rewritten: false
findings on the hub's settings file: 0
the leads entry as read: {"key":"leads","file":".oculus/data/academic/leads.yml","registry":"leads","primary_key":"title","ticker":{"category":"position"},"about":"files.make_collection_line_leads"}
the primary key the feed writer addresses a lead by, read from the file and its entry: "title"
writeFeedField(leads, "Postdoc, Robust ML", status, declined): found true | changed ["status"] | refused []
the lead after the write: "Postdoc, Robust ML\"\n    inst: \"Meridian Institute\"\n    country: \"NL\"\n    typ: \"postdoc\"\n    focus: \"robustness, distribution shift\"\n    fit: reach\n    status: declined\n    deadline: \"2026-05-01\"\n    url: \"https://example"
```

case15.after.txt:

```
the collections list comes from: sources.yml
  entry leads | file .oculus/data/academic/leads.yml | primary_key undefined
  entry radar | file .oculus/data/literature/radar.yml | primary_key undefined
.oculus/data/academic/applications.yml | foreign_key on related | projects | names a target
.oculus/data/academic/applications.yml | foreign_key on lead | people | names a target
.oculus/data/academic/applications.yml | foreign_key on collaborators | people | names a target
.oculus/data/academic/applications.yml | foreign_key on supervisors | people | names a target
.oculus/data/academic/applications.yml | primary keys: key
.oculus/data/academic/career.yml | primary keys: none
.oculus/data/academic/education.yml | foreign_key on related | projects | names a target
.oculus/data/academic/education.yml | foreign_key on lead | people | names a target
.oculus/data/academic/education.yml | foreign_key on collaborators | people | names a target
.oculus/data/academic/education.yml | foreign_key on supervisors | people | names a target
.oculus/data/academic/education.yml | primary keys: key
.oculus/data/academic/events.yml | foreign_key on related | projects | names a target
.oculus/data/academic/events.yml | foreign_key on lead | people | names a target
.oculus/data/academic/events.yml | foreign_key on collaborators | people | names a target
.oculus/data/academic/events.yml | foreign_key on supervisors | people | names a target
.oculus/data/academic/events.yml | primary keys: key
.oculus/data/academic/funding.yml | foreign_key on funder | organisations | names a target
.oculus/data/academic/funding.yml | foreign_key on lead | people | names a target
.oculus/data/academic/funding.yml | foreign_key on collaborators | people | names a target
.oculus/data/academic/funding.yml | foreign_key on supervisors | people | names a target
.oculus/data/academic/funding.yml | primary keys: key
.oculus/data/academic/joint-work.yml | foreign_key on person | people | names a target
.oculus/data/academic/joint-work.yml | primary keys: key
.oculus/data/academic/leads.yml | primary keys: title
.oculus/data/academic/tasks.yml | foreign_key on lead | people | names a target
.oculus/data/academic/tasks.yml | foreign_key on collaborators | people | names a target
.oculus/data/academic/tasks.yml | foreign_key on supervisors | people | names a target
.oculus/data/academic/tasks.yml | primary keys: key
.oculus/data/literature/literature.yml | foreign_key on projects | projects | names a target
.oculus/data/literature/literature.yml | primary keys: key
.oculus/data/literature/radar.yml | foreign_key on bucket | vocab.radar_buckets | names a target
.oculus/data/literature/radar.yml | foreign_key on project | projects | names a target
.oculus/data/literature/radar.yml | foreign_key on maps_to | projects | names a target
.oculus/data/literature/radar.yml | primary keys: title
.oculus/data/people/organisations.yml | primary keys: key
.oculus/data/people/people.yml | foreign_key on affiliations | organisations | names a target
.oculus/data/people/people.yml | primary keys: key
.oculus/data/pillars/domains.yml | primary keys: key
.oculus/data/pillars/pillars.yml | primary keys: key
.oculus/data/research/data.yml | foreign_key on access | vocab.data_access | names a target
.oculus/data/research/data.yml | foreign_key on retrieval.from | data | names a target
.oculus/data/research/data.yml | primary keys: key
.oculus/data/research/resources.yml | primary keys: key
.oculus/data/research/statements.yml | primary keys: key
.oculus/data/research/venues.yml | foreign_key on category | vocab.venue_categories | names a target
.oculus/data/research/venues.yml | foreign_key on tier | vocab.venue_tiers | names a target
.oculus/data/research/venues.yml | primary keys: id
.oculus/bookmarks.yml | primary keys: label
schema lines holding from: 0
foreign keys naming nothing: 0
```

case15b.out.txt:

```
the collections list comes from: sources.yml
the leads entry: {"key":"leads","file":".oculus/data/academic/leads.yml","registry":"leads","ticker":{"category":"position"},"about":"files.make_collection_line_leads"}
findings on the leads file: 1
  /.oculus/data/academic/leads.yml |  | the file has no schema and its collections entry names no primary_key, so no entry can be addressed and every write to one is refused
```

case18.after.txt:

```
collections offered: data, venues, pillars, domains, statements, people, organisations, resources, funding, events, education, applications, joint-work, tasks, literature, leads, radar
findings: 5
  /projects/active | scan | scan directory does not exist
  /projects/archive | scan | scan directory does not exist
  /projects/coauthor | scan | scan directory does not exist
  /projects/ideas | scan | scan directory does not exist
  /projects/manuscripts | scan | scan directory does not exist
data | the Add box asks key, name
data | add {"key":"case-eighteen","name":"case-eighteen"} | found true | changed ["datasets"] | refused []
venues | the Add box asks name, id
venues | add {"id":"case-eighteen","name":"case-eighteen"} | found true | changed ["entries"] | refused []
pillars | the Add box asks key, title
pillars | add {"key":"case-eighteen","title":"case-eighteen"} | found true | changed ["entries"] | refused []
domains | the Add box asks key, title
domains | add {"key":"case-eighteen","title":"case-eighteen"} | found true | changed ["entries"] | refused []
statements | the Add box asks key, title, status
statements | add {"key":"case-eighteen","title":"case-eighteen","status":"draft"} | found true | changed ["entries"] | refused []
people | the Add box asks key, name
people | add {"key":"case-eighteen","name":"case-eighteen"} | found true | changed ["entries"] | refused []
organisations | the Add box asks key, name, kind
organisations | add {"key":"case-eighteen","name":"case-eighteen","kind":"university"} | found true | changed ["entries"] | refused []
resources | the Add box asks key, name, kind
resources | add {"key":"case-eighteen","name":"case-eighteen","kind":"cluster"} | found true | changed ["entries"] | refused []
funding | the Add box asks key, title, status, lead
funding | add {"key":"case-eighteen","title":"case-eighteen","status":"in-prep","lead":"case-eighteen"} | found true | changed ["entries"] | refused []
events | the Add box asks key, title, role, status, lead
events | add {"key":"case-eighteen","title":"case-eighteen","role":"present","status":"upcoming","lead":"case-eighteen"} | found true | changed ["entries"] | refused []
education | the Add box asks key, title, status, lead
education | add {"key":"case-eighteen","title":"case-eighteen","status":"planned","lead":"case-eighteen"} | found true | changed ["entries"] | refused []
applications | the Add box asks key, title, status, lead
applications | add {"key":"case-eighteen","title":"case-eighteen","status":"not-applied","lead":"case-eighteen"} | found true | changed ["entries"] | refused []
joint-work | the Add box asks key, title, person, status
joint-work | add {"key":"case-eighteen","title":"case-eighteen","person":"case-eighteen","status":"exploring"} | found true | changed ["entries"] | refused []
tasks | the Add box asks key, title, status, lead
tasks | add {"key":"case-eighteen","title":"case-eighteen","status":"todo","lead":"case-eighteen"} | found true | changed ["entries"] | refused []
literature | the Add box asks key, title
literature | add {"key":"case-eighteen","title":"case-eighteen"} | found true | changed ["entries"] | refused []
findings on a file under .oculus: 0
leads | add {"title":"case-eighteen"} | found true | changed ["entries"] | refused [] | id "case-eighteen"
radar | add {"title":"case-eighteen","bucket":"preemption"} | found true | changed ["entries"] | refused [] | id "case-eighteen"
```

### Every program and file written, after the first run

- In the worktree, by Edit or Write: the 135 paths of "Files with line counts", and this report.
- `scratchpad/o79/case01.case.ts`, `case09.case.ts`, `case10.case.ts`, `case15.case.ts`, `case18.case.ts` (edited by Edit as above) and `case15b.case.ts` (new, by Write).
- `scratchpad/o79/case01.after.txt`, `case09.after.txt`, `case10.after.txt`, `case15.after.txt`, `case18.after.txt`, `case15b.out.txt`: each program's own output.
- `scratchpad/o79/run-a.txt`: a vitest run's output, written by a shell redirect while working (not a case-run program's output); `scratchpad/o79/testlist.txt`, a list of test paths, written by a shell redirect and deleted.
- `scratchpad/o79/node_modules/`: the vitest cache of the case runs.
- `scratchpad/o79/pretty-run.ts`: a copy of `src/lib/data/snapshot/schema/run.ts` (its head comment is that file's) taken to read prettier's output of it.
- `scratchpad/o79-hub/`: the scratch copy of the hub for case 15, with the rewrite applied by Edit; no `local.yml`.
- `scratchpad/o79-base-run/`: the base copy for the first runs of the new rows (`cp` of the base copy's `src`, `config` and `utils`, the worktree's `tests`, `docs`, `assets`, `.oculus`, `package.json`, `tsconfig.json`, `vite.config.ts`, and its own `.svelte-kit/` from `svelte-kit sync`; `node_modules` a symlink to the worktree's); `find <it> -name local.yml -not -path "*/node_modules/*" | wc -l` prints `0`. The changed test files were copied into it by `cp` before each run.
- `npm run diagrams` rewrote the 12 files under `docs/diagrams/`; `svelte-kit sync` the worktree's `.svelte-kit/`.

## Runs of the verify list and whole-suite commands

The verify list ran four times; no whole-suite command ran.

1. After the code was built: stopped by me during its vitest stage to add a test (its ASCII gate, prettier and svelte-kit sync had printed ok).
2. After that test: its paths reached `test:quick` as one argument (`test:quick: 1 changed file(s), from the given paths`, `0 test file(s)`), so it ran no test; svelte-check `0 ERRORS 0 WARNINGS`.
3. With every changed path given: eslint failed on four lines of `specs.ts`, `lists.ts`, `run.ts` and `entries.ts`, `tests/checks/source/keys.test.ts` failed on computed text keys in `radar.ts` and `run.ts`, and one writes-collection row timed out at 5 s; each was fixed, and rows were added for cases 4, 7, 10, 11, 17 and 19.
4. After the last change: quoted under check 1, every stage ok but the slow tier, where one case of `tests/data/hubs/hub-portfolio.test.ts` timed out at 20 s.

Test files run alone while working: scoped `npx vitest run tests/<file>` runs, all in the background or with a time limit; `tests/checks/config/integrity.test.ts` over the scratch hub for case 15.

## Repair round 1

Repair round 1: all five items of `O79-round-1.md` are built, and `npm run test:quick -- --base a11f9f14` passed every command after the last change (`test:quick: 293.6 s; every command passed`).

One decision is for the orchestrator. The snapshot's `Collection` and `FeedData` now carry `key_fault?`, the cause of a missing primary key. The card line runs in the page, and item 2 asks it to read the one computed cause, so the cause has to travel in the snapshot. That makes `key_fault?` part of the apps payload's `collections` record, and `docs/apps.md` documents it. The alternative is a card line that only points to the Audit finding, which item 2 rules out.

### Item 1: one primary-key rule

- `src/lib/data/model/model-collections.ts:83-135`: `primaryKeyOf` reads `KeyedField` (`field`, `type` and `primary_key` of a schema field), so the project form's `FormField` list goes through it unchanged.
- `src/lib/state/forms/schema.ts:113-119`: `writableField` returns `field !== primaryKeyOf(fields)`. `manifestKey` is gone. A flag on an unkeyed type gives no key in the project form, as it does in every other reader.
- Test: `tests/state/forms/form-draft.test.ts:119`, 'writes every field of a manifest form whose flag is on a tags field, as no reader keys by it'. It asserts:
  - `primaryKeyOf` gives null for a flag on `tags`;
  - `writableField` is true for both fields under that flag;
  - with the flag on a `text` field, the flagged field is not writable.

### Item 2: the refusal names its cause

**The cause, computed once.**
- `keyFaultOf` (`model-collections.ts:104-118`) gives `KeyFault` (`:91-96`), one of:
  - `none`;
  - `two` with `fields`;
  - `unkeyed` with `field` and `type`;
  - `beside` with `named` and `field`;
  - `missing`.
- `primaryKeyOf` (`:128-135`) is null exactly when `keyFaultOf` gives a cause, and it reads the cause from `keyFaultOf`, so the rule is written once.

**Every reader keys a file alike.**
- `keyedSchema` (`src/lib/data/snapshot/schema/field.ts:170-177`) reads a file's schema for its primary key:
  - undefined when the file has no `schema:`;
  - the fields when the schema reads;
  - `[]` when it does not read.
- Every reader of a file's primary key goes through it:
  - `normalise.ts:551-562`;
  - `validate.ts:441`;
  - `schema/lists.ts:195`;
  - `sources/registries.ts:106`;
  - `sources/documents/feeds.ts:88`;
  - `schema/run.ts:139`, and `:504` (`HubFileRead.keyed`, read by `references/build.ts:196`);
  - `server/files/fs/collections.ts:131-140`;
  - `server/edit/feeds/feeds.ts:125-138`;
  - `server/edit/feeds/literature.ts:110-118`.
- Without it, a file whose `schema:` did not read was keyed by its `collections:` entry's named key in the snapshot, but had no key in the server writers. The card's cause and the server's refusal could then disagree.

**The causes the refusals and the card read.**
- The server's `Collection.fault` is set at `server/files/fs/collections.ts:77,142`.
- `FeedRead.key_fault` is set at `server/edit/feeds/feeds.ts:138`.
- The snapshot's `Collection.key_fault` is set at `normalise.ts:562`.

**The words.**
- Five keys under `server.entries` in `config/text/server.yml:294-298`, lowercase with no full stop: `no_primary_key_none`, `_two`, `_unkeyed`, `_beside`, `_missing`.
- Five keys under `collection` in `config/text/views/boards/collection.yml:21-25`, in the "Writes are off: ..." form of their neighbours.
- `no_primary_key` is gone from both catalogs.

**The server refusals.**
- `noPrimaryKey` (`server/edit/writes/entries.ts:253-280`) gives the sentence of a cause.
- It is read by:
  - `unkeyed` (`entries.ts:243-246`);
  - the feeds' `unkeyed` (`feeds.ts:79-82`);
  - the Literature save (`literature.ts:154-155`).

**The card line and the placement refusal.**
- `noPrimaryKeyLine` (`src/lib/state/sessions/source/draft-entry.ts:82-95`) gives the line of a cause.
- It is read by:
  - `blockedBy` (`views/shared/forms/entry-file.ts:162`);
  - the refusal to place an entry (`draft-entry.ts:55-75`).
- `placeEntry` and `placeInFile` take the collection (`Keyed`, `draft-entry.ts:39`) where they took a primary key; `lead-apply.ts:69` passes `held`.
- `IdentityFault` gains `cause` (`state/boards/collection/index.ts:619-625`), and `identityFaults` takes it as a third argument (`:636-648`). The callers pass `key_fault`:
  - `Collection.svelte:133`;
  - `Entry.svelte:143-147`;
  - `page-file.ts:59`;
  - `registry-file.svelte.ts:69`.
- `KeyFault` reaches `state/` through `data/model/index.ts:41`.

**Tests.**
- `tests/server/edit/writes-collection.test.ts:368-414`, 'refuses every write to a file with %s, naming the cause (G8)'. Each row asserts its cause's own sentence: two flags gives `_two`, a flag on tags gives `_unkeyed`, `primary_key: "yes"` gives `_none`, an entry key beside the flag gives `_beside`, and no schema and no named key gives `_missing`, which is a new row.
- The other rows that refuse for a cause assert `_none`:
  - writes-collection, 'refuses an edit, a reorder, an Add and a remove of a file with no primary key';
  - `writes.test.ts:561`;
  - `feeds.test.ts:205-209`.
- `tests/data/snapshot/normalise.test.ts:263` checks the snapshot's `key_fault`: `missing` for a file with no schema, `two` with both fields, and none for venues.
- `tests/state/sessions/source/draft-entry.test.ts` (new, 78 lines) checks:
  - each cause's card line;
  - `identityFaults` carrying the cause;
  - `placeEntry` refusing with the cause's line, for each of the five causes.

**Docs.** `docs/HELP.md:274`, `docs/data-map.md:56` and `docs/apps.md:410` (the collections row) name the causes.

### Item 3: the Position Leads Add refusals in their group's style

- New key `server.feeds.entry_key_taken`, "An entry with this {0} is in the file already." (`config/text/server.yml:322`). It is read by:
  - the Leads Add (`feeds.ts:396`);
  - the put-back of a deleted feed entry (`feeds.ts:499`);
  - the Literature save (`literature.ts:203`).
- `server.entries.key_taken` stays with the entry writes (`entries.ts:583`).
- Test: `tests/server/edit/feeds.test.ts:194-202` asserts the refusal and its exact words.

### Item 4: a new entry in the schema's order

- `renderEntry` (`src/lib/server/edit/entry-edit/render.ts:15-26`) writes the fields in the schema's order, the first on the `- ` line. The primary key goes first only when the schema does not name it, as in a file with no schema.
- `tests/server/edit/writes.test.ts:567-574` expects the base's order again: `- name: New V` then `id: newv`. The row is now titled 'writes a venue from its name and its id, in the order its schema lists them'.

### Item 5: case 21 run

Each test puts a collection keyed `projects` beside a field with `foreign_key: projects`:

- `tests/data/snapshot/schema-rules.test.ts:675`, 'reads a foreign key naming projects as the manifests beside a collection keyed projects'.
  - The collection's file holds `alpha`, the id of a manifest, and `only-here`, which no manifest has.
  - The tasks entry's `related: [alpha, only-here]` gives one finding: `findings.schema.no_key` on `entries[0].related[1]` naming `projects`.
  - In the reference index, `alpha` resolves to `projects/active/alpha/project.yml` alone, and `only-here` resolves to nothing.
- `tests/state/forms/choices.test.ts:182`, 'offers the projects for a key naming projects, and nothing of a collection keyed projects (G132)': `choicesFor` offers `[{ id: 'alpha', label: 'Alpha' }]` and no entry of that collection.

### Host- or user-visible changes of this round

1. **Leads Add with an empty title.**
   - Before (base): "A lead needs a title."
   - After: "An entry needs a title." This is `server.feeds.entry_needs_key`, unchanged this round.
2. **Leads Add with a title already in the file.**
   - Before (base): "A lead with this title is in the file already."
   - After: "An entry with this title is in the file already."
3. **The Literature view's save of a paper whose key is in the file.** The base had no such refusal. It is now refused with "An entry with this key is in the file already."
4. **A refused write to a file with no primary key** names the cause and what takes it away. For example, a people file whose collections entry names `key` beside the schema's flag on `key` is refused with ".oculus/data/people/people.yml has no primary key, so no entry of it can be addressed: its collections entry names key beside the flag on key in its schema, and a file has only one; take the primary_key out of its collections entry".
5. **The card line of such a file**, and the refusal to place a lead's application in it, give the same cause in the "Writes are off: ..." form. For example: "Writes are off: people.yml has no primary key, as its schema flags role, a tags field, whose value names no one entry; flag a field that holds one value".
6. **A new entry's field order.** It is written in the schema's order. A venue Add on the hub's `venues.yml`, whose schema lists `name` before `id`, writes `- name:` first, as the base did.
7. **The apps payload.** The `collections` record carries `key_fault?`. This is the decision above.
8. **The project form with a manifest schema that flags a field of a list type** writes that field and the project's id like any other field, since the form has no primary key. Before, the form left the flagged field unwritten. No shipped schema flags such a field.

### Judgment calls

- **`keyedSchema` at every reader.** A file carrying a `schema:` that does not read now has no primary key in every reader, with the cause `none`. Without it, the snapshot readers keyed such a file by the named key while the server refused its writes. The schema run already reports such a schema as a finding.
- **`keyFindings` keeps its own walk.** `keyFindings` in `schema/run.ts` reads the raw schema rows: a `primary_key` that is not `true`, a flag in a records field, and the row paths a finding is placed at. `keyFaultOf` reads parsed fields. The two cannot share one walk.
- **The literature key and the feed put-back use the feeds key.** The Literature save's taken key and the feed put-back's taken key use `server.feeds.entry_key_taken`, the sentence-case group their neighbours (`server.literature`, `server.feeds`) are in. `server.entries.key_taken` would have put a lowercase sentence beside those neighbours.
- **`primary_key: "yes"` reads as no flag.** It gives the cause `none`, whose words say no field is flagged `primary_key: true`. The schema finding `key_not_true` names the value.

### Greps the rules file asks for

**History words.** Command: `git diff a11f9f14 -U0` over `src`, `tests`, `config` and `docs`, plus the untracked files, keeping the added comment and title lines, then `grep -i` for the rules file's words. It found 11 hits. Each one is about time within a run or the order of fields, not about history:

- `before: z.string()`: code.
- "goes back over what it left when the file still": the state of the file at an undo.
- "as it was before the write": the bytes before a write.
- "still names its entry": what a record names at undo.
- "the feed no longer": an entry gone at read time.
- "before it writes it": the order of a read and a write.
- "holds it still": the file at lookup time.
- "gone before it answers" and "discarded before it answers": the order of a control and an answer.
- "written before the `id`": field order.
- "still holds it there": the file at undo time.

**Reuse.** Command: `git grep -n -E "<name>" a11f9f14 -- src tests`, run for `keyFault`, `KeyFault`, `keyedSchema`, `noPrimaryKey`, `noPrimaryKeyLine` and `type Keyed\b`. Each prints nothing. A grep for `no primary key|noPrimary` finds only the primary-hub `noPrimary` of accounts and settings, which is a different concern.

**Unused exports.** Command: `diff <(sh utils/unused-exports.sh 2>&1) .agents/worktrees/O79-base/unused-exports.txt`, run after the last change. Its `<` lines are the same as under check 3: no new unused export.

### Runs this round

**Scoped runs while working.**
- `npx vitest run` over the 8 changed test files: `Tests 182 passed (182)`.
- `npx vitest run` over 23 related files: keys, catalog-file-keys, literature, references, rename, undo, hub-writes, manifest-fields, new-entry, page-entry, registries, collections, record-fields, relation-shapes, resources, compose, changes, html.dom, board-rules, manifests, entry-save, record-values and referrers. Result: `Tests 549 passed (549)`.
- `npx vitest run tests/checks/tree/boundaries.test.ts tests/state/sessions/source/draft-entry.test.ts`: `Tests 18 passed (18)`.
- `npx svelte-check`: `0 ERRORS 0 WARNINGS`.

**The verify list.** `npm run diagrams && npm run test:quick -- --base a11f9f14` ran twice.
1. The first run was red on one check: `tests/checks/tree/boundaries.test.ts`, with "state/boards/collection/index.ts imports data/model/model-collections" and "state/sessions/source/draft-entry.ts imports data/model/model-collections". The fix re-exports `KeyFault` from `data/model/index.ts:41` and imports it from there.
2. After that fix, which was the last change:

```
test:quick: 140 changed file(s), from git since a11f9f14
test:quick: 309 test file(s)
ok      ASCII gate (1.0 s)
ok      prettier (1.9 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.4 s)
ok      eslint (13.0 s)
ok      svelte-check (41.9 s): 1793028857535 COMPLETED 544 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (164.7 s)
ok      vitest (242.1 s)
ok      vitest slow (291.1 s)
test:quick: 293.6 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
```

### Files written this round

All files were written in the worktree by Edit or Write. `npm run diagrams` rewrote `docs/diagrams/channels.svg`, `writes.dot` and `writes.svg`. No file was written outside the worktree.

- **Code:**
  - `src/lib/data/model/model-collections.ts` (451 lines);
  - `src/lib/data/model/index.ts` (879);
  - `src/lib/state/forms/schema.ts`;
  - `src/lib/data/snapshot/schema/field.ts`;
  - `src/lib/data/snapshot/schema/run.ts` (573);
  - `src/lib/data/snapshot/references/build.ts`;
  - `src/lib/data/sources/registries.ts`;
  - `src/lib/data/snapshot/schema/lists.ts`;
  - `src/lib/data/sources/documents/feeds.ts`;
  - `src/lib/data/snapshot/validate.ts`;
  - `src/lib/data/snapshot/normalise.ts` (672);
  - `src/lib/server/files/fs/collections.ts`;
  - `src/lib/server/edit/writes/entries.ts` (641);
  - `src/lib/server/edit/feeds/feeds.ts` (675);
  - `src/lib/server/edit/feeds/literature.ts` (297);
  - `src/lib/server/edit/entry-edit/render.ts`;
  - `src/lib/state/sessions/source/draft-entry.ts` (169);
  - `src/lib/state/boards/collection/index.ts` (765);
  - `src/lib/views/shared/forms/entry-file.ts`;
  - `src/lib/views/shared/card/feed/lead-apply.ts`;
  - `src/lib/views/shared/forms/entry/edit/page-file.ts`;
  - `src/lib/views/shared/forms/registry/registry-file.svelte.ts`;
  - `src/lib/views/boards/collection/Collection.svelte` (520);
  - `src/lib/views/boards/entry/Entry.svelte` (391).
- **Catalogs:** `config/text/server.yml` and `config/text/views/boards/collection.yml`.
- **Docs:** `docs/HELP.md`, `docs/data-map.md` and `docs/apps.md`.
- **Tests:**
  - `tests/state/forms/form-draft.test.ts` (343);
  - `tests/state/sessions/source/draft-entry.test.ts` (new, 78; the folder holds 6 items);
  - `tests/state/forms/choices.test.ts` (211);
  - `tests/data/snapshot/normalise.test.ts` (370);
  - `tests/server/edit/writes-collection.test.ts` (414);
  - `tests/server/edit/writes.test.ts` (861);
  - `tests/server/edit/feeds.test.ts` (455);
  - `tests/data/snapshot/schema-rules.test.ts` (732).
- **This report.**
