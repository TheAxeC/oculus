# D72 report: collection entries as records of their own

Everything in the brief is built. Three results in the worktree are not clean and are quoted under "Anything wrong": `npm run test:quick` took 50.0 s against its 45.0 s limit (every command in it passed), two tests of `npm run test:checks` fail because the worktree has no hub settings folder, and `tsc` prints three `CardAction` lines that `svelte-check` does not report. No browser was started (the brief forbids it), so every UI case is checked by reading and by the unit and route tests, and each is listed under "Look on landing".

## Open items

Open item 82 (an editable venue name, `id` read-only) is built: `plan.md` Rulings, "Open item 82". No other open item is raised by this step.

## The cases' first run

The first run of the server cases was a scratch test in a copy of the unchanged tree (`$SP/d72-builder/first-run-server.txt`, run with `npx vitest run tests/server/edit/d72-first.test.ts`, "Tests 2 passed"; each `CASE` text in the second column is its printed line). The cases that need a view, a client module, the palette or a new write kind were read on the unchanged tree: `grep -rn -- ":task-add\|cmd_task_add" src config` prints nothing there, no `kind: 'career'` exists in `src`, and no client code sends `delete-entry` or `new-entry` from a card or a page. No case needed a ruling: no rule of the brief gave a wrong result.

| Case | First run on the unchanged tree | Checked now by |
|---|---|---|
| Funding entry with no `link` | read: `Entry.svelte` draws only entries whose `link` names a folder, so the title opens nothing | `tests/state/forms/page-entry.test.ts` "finds a collection entry with the values, the fixed fields and the peers"; look on landing |
| Funding entry whose `link` names a folder | read: the folder blocks exist, no editor | look on landing (editor above the three folder blocks) |
| Editor of an events entry (`meta`) | `CASE events meta`: the write adds the row and changes `["meta"]` alone | `writes-collection.test.ts` "adds one row of a metalist and writes that field alone", `entry-save.test.ts` "posts the fields whose payload differs, in the schema order" |
| Editor of a dataset (`retrieval`) | `CASE data retrieval`: `method` written as a map, `notes` kept, `changed ["retrieval"]` | `writes-collection.test.ts` "changes one sub-field of a nested map and keeps the folded text, the comments and the rest", "keeps the lines of a sub-field untouched while another is replaced"; `record-values.test.ts` |
| Editor of a venue | `CASE venue short`: `found:false` (a venue is addressed by its `id`, not by its name) | `writes-collection.test.ts` "addresses a venue by its name and writes the short name alone" and "renames a venue through its name and leaves its id"; `entry-save.test.ts` "posts a venue name and never its id"; `record-fields.test.ts`. Run: `npx vitest run tests/state/forms tests/server/edit/writes-collection.test.ts --reporter=dot` -> "Test Files 8 passed, Tests 128 passed" |
| Edit typed and not saved, then a reload | read: no draft for entries | `form-draft.test.ts` "keeps an edit per instance and reports it unsaved while it differs", "reads the edits back out of the storage the ui store saved them to", "registers the client's own form draft with the close guard" |
| Select value not among the options | `CASE select bad`: `status: nonsense` written, `refused []` | `writes-collection.test.ts` "refuses a select value that is none of its options and leaves the file" |
| Add on Tasks with `review-x`; Add with a held key | `CASE add review-x` and `CASE add dup`: refused with "an entry with that title is already in the file" (the fixture's identity is `title`) | `writes-collection.test.ts` "writes the key and nothing else"; `new-entry.test.ts`; look on landing (the page of `review-x` with the `required` findings) |
| Add on a file whose `entries:` holds only comments | `CASE add comments only`: `found:false` | `writes-collection.test.ts` "writes under an `entries:` that holds only comments and keeps them"; `collections.test.ts` "reads an `entries:` that holds only comments as a collection with no entries" |
| Add with a key that begins with a hub's key and a colon | `CASE add hubkey`: written as `second:thing` | `writes-collection.test.ts` "refuses a key that begins with the key of a hub and a colon" |
| Add on a card list that shows a second hub's collection | read: Add opens the file, no write | `entry-add.ts` sends the primary hub (else the first); look on landing |
| Add on Venues, name and id; empty id | `CASE venue ok`: written; `CASE venue empty id`: refused "a new entry needs a non-empty id" | `writes-collection.test.ts` "asks a venue for its name and its id" |
| Add on Lit Watch | read: `radar-add` exists, no Add control in Lit Watch | `Radar.svelte` with `SourceToolbar`; look on landing |
| Add on Leads; a title the file holds | `CASE lead add dup`: refused "a lead with this title is in the file already" | `Leads.svelte` with `SourceToolbar`; look on landing |
| Delete of a pillar two projects name | read: no Delete on a pillar | `referrers.test.ts`; `Referrers.svelte`; `undo.test.ts`; look on landing |
| Delete of a statement no file names | read: no Delete | look on landing (question names no referrer) |
| An organisation's page lists people and funding schemes | read: no organisation page | `referrers.test.ts` "names for an organisation the people affiliated and the schemes it funds" |
| A resource's page lists the projects whose `compute` names it | read: no resource page | `referrers.test.ts` "names for a resource the projects that compute on it and the setting that names it" |
| Person page of a collaborator | read: the `person` view has no editor | `Person.svelte` draws `EntryEditor`; `page-entry.test.ts` "finds a collection entry ..."; look on landing |
| People, Organisations, Resources in References | `grep -n "organisations_file" config/sources.yml` prints line 47 only: the key exists, no collection | `config/sources.yml` (the three `collections:` keys in the engine's layer), `tests/data/snapshot/resources.test.ts` |
| Career panel's Edit | read: no Edit control on the panel | `writes.test.ts` "writes the changed section alone and records its before and after"; `undo.test.ts` "puts a career section back, each section on its own"; look on landing |
| The career editor (situation, host score column, eligibility caveat) | read: no `career` write kind | `writes.test.ts` "writes a renamed label and a changed sentence of the situation as one map", "changes a score column of a host and keeps the other hosts and columns", "changes the caveat of the eligibility map and keeps its rule", "refuses a value of the wrong type for a section and writes nothing", "answers not found for a hub with no career file"; `career.test.ts` |
| A source tab holding unsaved text of the file while the editor saves | read: the guard exists for the file editor only | `held-unsaved.test.ts` "posts a career save when the tab holds another file" and the entries rows |
| A lead's page, `fit` and `country` | `CASE feed field fit`: refused "the leads feed does not allow that field" | `feeds.test.ts` "writes the fields the feed file schema names and holds each to its type"; `entry-save.test.ts` "posts a feed entry one field at a time in its hub and refuses a field that is no single value"; `hub-writes.test.ts` |
| A feed entry of a second hub | `CASE feed field status`: the first hub's write works | `entry-save.test.ts` "deletes a feed entry with feed-delete in the hub that holds it"; `hub-writes.test.ts` |
| A feed file with two entries of one title | `CASE feed delete dup`: the delete is written (the first entry removed) | `feeds.test.ts` "refuses a write and a deletion of an entry whose title another entry shares" |
| A radar entry: Dismiss, Delete | `CASE radar field`: `dismissed` set; `CASE radar delete`: refused "the radar feed does not allow deletion" | `feeds.test.ts` "deletes leads and papers and refuses deletion of a LinkedIn idea"; `undo.test.ts` "puts a deleted Lit Watch entry back as it was recorded" |
| `:task-add Review the RAW-PLS rebuttal`, then again | read: no command | `new-entry.test.ts` "writes the task to the tasks collection and gives back its id and title", "keeps a clashing key inside 80 characters with its suffix" |
| `:task-add Cafe meeting` with U+00E9 | read: no command | `new-entry.test.ts` (input written as `\u00e9`) |
| `:task-add` with nothing or only spaces | read: no command | `new-entry.test.ts` (the empty-title row) |
| `:task-add` with U+65E5 U+672C | read: no command | `new-entry.test.ts` (input written as `\u65e5\u672c`, "says the refusal of the write") |
| `:task-add` with Shift+Enter | read: no command | `CommandRows.svelte`; look on landing |
| `:task-add` with no tasks collection | read: no command | `new-entry.test.ts` "is none when the primary hub holds no tasks collection" |
| `:task-add` with a 200-character title | read: no command | `new-entry.test.ts` "is cut to 80 characters with no trailing hyphen" |
| A pillar's page whose entry is deleted | read: no Delete | `page-entry.test.ts` "reads the saved values of the page now, and none for a page that is gone"; look on landing |
| Delete of a person a project's `waiting-on` names | read: no Delete | `referrers.test.ts` "names for a person the projects with them as collaborator or awaited, and the joint work" |
| Delete of the resource `slurm.resource` names | read: no Delete | `referrers.test.ts` "names for a resource the projects that compute on it and the setting that names it" |
| `npm run docs:palette` twice, page function, committed page check | read: no script (`grep -n "docs:palette" package.json` in the unchanged copy prints nothing) | `palette-page.test.ts` (six tests), `tests/checks/diagrams/palette.test.ts` "is what the palette gives now"; `npm run docs:palette` run twice, `sha1sum docs/palette.md` = 43c23e31879a97b551b5046d7d32034bd45cd4fb both times |
| A second hub's collection: pages and editors write that hub's file | read: no page or editor for such an entry; the `entry` write is the one the brief names | `page-entry.test.ts` "finds an entry of another hub by the id the merged portfolio gives it"; `hub-writes.test.ts` |
| A collection file with two entries of one identity | `CASE shared write`, `CASE shared add`, `CASE shared delete`: each refused "two entries share the key a, so a write cannot address one of them" | `writes-collection.test.ts` "refuses a write, an add and a delete with the shared-identity sentence and leaves the file" |

## New and changed tests on the unchanged tree

The new tests of behaviour the change adds were copied into the scratch copy of the unchanged tree (`npx vitest run` over each; output in `$SP/d72-builder/newtests-on-base.txt`). Failures there, in the form the tests have now:

- `career.test.ts`: "expected [] to deeply equal [ 'title', 'milestone', ...(8) ]".
- `collections.test.ts` and `registries.test.ts`: "expected [ { ...(3) } ] to deeply equal []".
- `undo.test.ts`: "expected 400 to be 200".
- `hub-writes.test.ts`: "a lead field the file schema names beyond its status: expected [] to deeply equal [ 'feeds/position-leads.yml' ]" and "a Lit Watch deletion: expected [] to deeply equal [ 'feeds/literature-radar.yml' ]".
- `feeds.test.ts`: "expected [] to deeply equal [ 'fit' ]", "expected [] to deeply equal [ 'entries' ]".
- `writes-collection.test.ts`: 6 failed | 10 passed.
- `writes.test.ts`: "TypeError: writeCareer is not a function" (6 tests); `held-unsaved.test.ts`: "w.writeCareer is not a function", "w.newEntry is not a function", "w.deleteEntry is not a function".
- `palette-page.test.ts`, `entry-save.test.ts`, `form-draft.test.ts`, `new-entry.test.ts`, `page-entry.test.ts`, `record-values.test.ts`, `referrers.test.ts`, `record-fields.test.ts`: "Cannot find module" (the modules are new). Example: "Cannot find module '../../../src/lib/state/forms/record-fields.ts' imported from .../d72-builder/base/tests/state/forms/record-fields.test.ts".

Tests that pass on the unchanged tree, and why:

- `tests/server/edit/writes-collection.test.ts` "renames a venue through its name and leaves its id" passes on the unchanged tree (`npx vitest run tests/server/edit/writes-collection.test.ts -t "renames a venue" --reporter=verbose` -> "Tests 1 passed | 15 skipped"), because `writeEntry` already renamed an identity through its `was` record. It is a test of behaviour the change keeps. The client half of the ruling (the `id` fixed and the `name` posted) is `record-fields.test.ts` and `entry-save.test.ts` "posts a venue name and never its id", which fail on the unchanged tree with "Cannot find module".
- `resources.test.ts` passes there: its seed needed a `schema:` block on the changed tree only, so it guards the read the change widens.
- `app-gate.test.ts`: the two `career` rows pass there because the unchanged gate refuses an unknown write kind; they guard that apps cannot send `career`.

## DONE / NOT DONE

All run from `tools/oculus` in the worktree.

| Check | Result |
|---|---|
| `npm run check` | "COMPLETED 3993 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS" |
| `npm run lint` | `> eslint .`, no error line |
| `npm run format:check` | "All matched files use Prettier code style!" |
| `npm test` | "Test Files  216 passed \| 50 skipped (266)", "Tests  2179 passed \| 450 skipped (2629)" |
| `npm run test:checks` | "Tests  2 failed \| 265 passed (267)", the two failures are named under "Anything wrong" |
| Slow tag: `npx vitest run tests/routes/edit/apps/app-gate.test.ts tests/routes/hubs/hub-writes.test.ts tests/routes/edit/undo/undo.test.ts --tagsFilter slow --testTimeout 20000` | "Test Files  3 passed (3)", "Tests  48 passed \| 35 skipped (83)" |
| `npm run test:quick` (once, after the last change) | exit 0; "ok ASCII gate (0.7 s)", "ok prettier (2.8 s)", "ok eslint (9.4 s)", "ok svelte-check (13.0 s): ... 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS", "ok vitest (49.4 s)", "test:quick: 50.0 s (limit 45.0 s); every command passed", "test:quick: over the time limit" |
| ASCII gate over `src tests config` (the rules file's perl command, `config/` allows U+00C3 pairs) | prints nothing, "ascii exit 0" |
| `sh utils/folder-check.sh` | exit 0 |
| `sh utils/size-check.sh` | exit 0 |
| `sh utils/unused-exports.sh` against the unchanged copy | 238 exports (base 242), 114 types (base 117). One printed line the base run does not print: `src/lib/state/boards/board/index.ts: FACETS, NONE, authorLine, bucketOf, venueText, facetValues, facetHeading, filtersInForce, valueLabel, emptyBoardState`, which is the base's line for that file without `slug` (the export is removed; the file uses the shared `slugOf`). All other differences are removals. |
| `npm run diagrams` | run; `docs/diagrams` regenerated and matching the tree |
| `npm run docs:palette` twice | second run leaves `docs/palette.md` unchanged (sha1 43c23e31879a97b551b5046d7d32034bd45cd4fb); ASCII only |
| Name search: `grep -rnE "addInFile\|manifestDraft\|manifest-draft\|feeds/idents\|parseManifestDraft\|ManifestDraft" src tests config docs utils HELP.md DESIGN.md README.md` | prints nothing |

NOT DONE: nothing in the brief. The plan's whole verify list runs at landing.

## Terms

`docs/glossary.md` does not exist in this repository, so no entry is added, changed or checked.

## Files with line counts

Added (34 files): `config/text/palette-page.yml` 37, `config/text/views/shared/entry-form.yml` 39, `src/lib/shell/keys/palette-page.ts` 159, `src/lib/state/forms/record-fields.ts` 68, `record-values.ts` 288, `entry-save.ts` 99, `referrers.ts` 127, `new-entry.ts` 106, `page-entry.ts` 237, `form-draft.ts` 160, `src/lib/state/shared/page/idents.ts` 70, `src/lib/server/edit/entry-edit/merge.ts` 428, `src/lib/views/boards/entry/EntryFolder.svelte` 139, `src/lib/views/boards/focus/career/CareerPanel.svelte` 384, `CareerHosts.svelte` 200, `src/lib/views/shared/forms/entry/AddAsk.svelte` 54, `DeleteAsk.svelte` 59, `Referrers.svelte` 103, `entry-add.ts` 99, `entry/edit/EntryEditor.svelte` 192, `LabelRows.svelte` 136, `FieldControl.svelte` 293, `EntryForm.svelte` 69, `page-file.ts` 61, `utils/diagrams/palette.mjs` 133, `docs/palette.md` 183; tests `tests/state/forms/record-fields.test.ts` 27, `entry-save.test.ts` 185, `referrers.test.ts` 129, `new-entry.test.ts` 175, `form-draft.test.ts` 149, `record-values.test.ts` 188, `page-entry.test.ts` 192, `tests/shell/keys/palette-page.test.ts` 78, `tests/checks/diagrams/palette.test.ts` 23.

Removed (4): `src/lib/state/forms/manifest-draft.ts`, `src/lib/state/feeds/idents.ts` (moved to `state/shared/page/idents.ts`), `src/lib/views/boards/focus/CareerPanel.svelte` (moved to `focus/career/`), `tests/state/forms/manifest-draft.test.ts` (replaced by `form-draft.test.ts`).

Changed (86 files under `config`, `src`, `tests`): the full list is `diff -rq --exclude=local.yml` of the unchanged copy against each folder. The largest are `src/lib/state/client/context.ts` 851, `tests/checks/tree/boundaries.test.ts` 828, `src/lib/state/client/writes.svelte.ts` 813, `src/lib/server/edit/writes.ts` 798, `src/lib/server/edit/feeds.ts` 734, `src/lib/state/workbench/palette.ts` 724, `src/lib/state/boards/collection.ts` 700; every file is at most 880 lines and the largest Svelte file (`EntryCard.svelte`) is 499. Docs changed: `HELP.md`, `DESIGN.md`, `README.md`, `docs/apps.md`, `docs/diagrams/*` (channels, layer-server, layer-shell, layer-state, layer-views, layers, writes, `.dot` and `.svg`), `package.json` (the `docs:palette` script), and the worktree's hub-level `docs/DATA-MAP.md`.

## Judgment calls the brief left open

- The writable fields of a feed are the fields of the feed file's `schema:` plus the base `fields` list; `feed-field` checks a value against the schema type.
- `slugOf` lives in `src/lib/data/helpers/guards.ts` (`data/helpers/` is full at its limit of tracked items, so no new file); the radar's local slug and the board's slug use it.
- `identityField` and `TITLE_FIELD` live in `state/forms/record-fields.ts` and are re-exported from `boards/collection.ts`.
- The form draft is stored under a `draft` key with kinds `project` and `page`; a draft saved in the older shape is simply unread.
- A `records` field has the shapes list, one, labels and named; an unnamed record key with a non-scalar value is kept verbatim.
- The server refuses a key that begins with a hub's key and a colon, with the catalog sentence `server.entries.hub_key`.
- A feed entry's page shows the editor only; people entries open the `person` view (`pageView`).
- `:task-add` catalog keys: `cmd_task_add` and `app.palette.task_add_{title,key,collection}`.
- `CareerPanel` moved to `views/boards/focus/career/` with `CareerHosts.svelte`, so `focus/` stays within its item limit.
- `DeleteAsk` is self-contained (it takes the referrers and the two callbacks); `page-file.ts` sits in `entry/edit/`.
- Add on Lit Watch and Leads is always shown in the toolbar (`SourceToolbar` takes a `label`; the Add control is first, the source button last); `AddAsk` takes `Ask | null`.
- The palette page registry has fixed shapes: editor commands by Monaco action id, `RemovedChord.command` marks the two command chords, pin items come from `pinItems`.
- `PersonJoin.waitingOn` carries the `waiting-on` referrers of a person; `SLIDE_ACTS` lists the slide commands for the page.
- The data readers read an empty list key as an empty list with no finding.
- A refused select inside a record field is reported under the record field's name (for example field `retrieval`, the reason names `method`).
- A new entry written into a comments-only `entries:` sits above the comments; an appended entry gets a blank line before it.
- A feed save refuses a non-scalar field with `entry_form.feed_scalar`.
- `addInFile` is removed (Add writes `new-entry`, `lead-add` or `radar-add` through the shared `entry-add.ts`); the shell row of `boundaries.test.ts` gained `state/forms/new-entry` and `state/forms/page-entry`, with a comment paragraph.
- `recordActions` in `entry-actions.ts` serves the Registry, Venue and Dataset cards.
- A venue's `name` is editable and its `id` read-only through `fixedFields(collection, schema)` (Open item 82); other collections fix their first schema field.
- Non-ASCII test inputs in `new-entry.test.ts` are written as `\u00e9` and `\u65e5\u672c` escapes.
- Existing assertions edited, each with the before and after: `tests/server/edit/feeds.test.ts` the lead status write `'closed'` became `'applied'` (the lead status options come from the file schema), and "deletes leads and refuses deletion from the other feeds" became "deletes leads and papers and refuses deletion of a LinkedIn idea" (radar Delete is allowed); `tests/data/snapshot/resources.test.ts` seed gained a `schema:` block; `tests/checks/config/config-folder.test.ts` catalog list gained `palette-page.yml` and `views/shared/entry-form.yml`; `tests/routes/edit/write-fixture.ts` leads schema gained a `fit` textarea; `tests/checks/source/keys.test.ts` gained a computed-prefix row for `Entry.svelte`; `tests/checks/tree/boundaries.test.ts` gained the two shell-row entries.

## Host- and user-visible changes

| Place | Before | After |
|---|---|---|
| Title of a registry, venue, dataset, pillar, domain, lead or paper card | no page (only collection cards with a folder `link` had one) | opens the entry's page: the card, the editor over the fields of the file's `schema:`, the referrers, and the folder blocks only when `link` names a folder |
| Add on a card list, Venues, Data, Pillars, Domains, Leads, Lit Watch | opened the file in a source tab | asks the key (venue: name and id; lead: title; paper: title, address, bucket), writes the entry and opens its page |
| Delete on a card or a page | none (leads only) | asks first, names the referrers, writes `delete-entry` or `feed-delete`; undoable from History |
| References group | Statements and the other registries | People, Organisations, Resources follow Statements, each a card list |
| Person page | `person` view without editor | same view with the editor |
| Organisation and resource pages | none | list the people and funding schemes that name an organisation; the projects whose `compute` names a resource |
| Career panel | no edit | Edit control opens the editor over the sections; Save writes the changed sections through the `career` write, undoable |
| Lead fields | `status` only | every field of the feed file's schema but the title |
| Lit Watch | Dismiss only | Add, Delete (undoable) and the editor; Dismiss unchanged |
| Venue editor | not offered | `id` read-only, `name` editable; saving a changed `name` renames the venue and every project's `venue_id` stays |
| Palette | no `:task-add` | `:task-add <title>` writes a task (status todo, slug key), notice with Open; Shift+Enter opens its page |
| `docs/palette.md` | none | generated by `npm run docs:palette`; HELP.md links it; a landing check compares the committed page with a fresh generation |

## Look on landing

Each is a UI-only case no test here draws.

- Funding entry with no `link` (view Funding, a card with no folder): the title opens a page with the card, the editor and the projects naming it, no documents, files or sessions block. With a folder `link`: the editor above the three folder blocks.
- Venues: a venue's page shows `id` greyed and `name` editable; editing `short` and Save writes `short` alone; renaming `name` keeps the `id`.
- Add on Tasks with `review-x`: the page of `review-x` opens with the `required` findings of `title` and `status`; a held key shows the refusal sentence in the box and writes nothing.
- Add on a card list that shows a second hub's collection: the entry lands in the primary hub's file.
- Delete of a pillar two projects name (Pillars, card Delete): the question names both projects; yes removes it; History lists it; Undo restores it; the two projects show `no_key` findings until changed. A statement no file names: the question names no referrer.
- A pillar's page whose entry is deleted from its own toolbar says the entry is gone; Undo in History brings it back and the page shows it.
- Delete of a person a project's `waiting-on` names, and of the resource `slurm.resource` names: the question names the project and the setting.
- Organisation and resource pages list their referrers; a collaborator tag on a project opens the person page with its editor.
- Focus, Career strategy panel: Edit opens the editor; changing `milestone` and Save writes only `milestone`; the History row undoes it.
- Lead page: change `fit` and `country`, Save: two History rows; the status control on the card still works. Radar: Dismiss sets `dismissed`; Delete asks and removes the entry; Undo restores it.
- Palette: `:task-add Review the RAW-PLS rebuttal` shows the notice with Open; empty or only spaces shows "a title is needed"; the two CJK characters show the no-key sentence; Shift+Enter opens the page.
- A source tab holding unsaved text of `registries/career.yml` while the career editor saves: Save is refused before it is sent and the edit stays.
- Typed and not saved, then a reload: the edit is in the editor; closing the tab asks first.

## Doc re-read list

Re-read against the final code, still true: head comments of `entry-add.ts`, `AddAsk.svelte`, `DeleteAsk.svelte`, `Referrers.svelte`, `page-entry.ts`, `new-entry.ts`, `palette-page.ts`, `merge.ts`, `config/text/palette-page.yml`. Rewritten: head comments of `record-fields.ts` (venue `id` fixed, `name` editable), `entry-actions.ts` (registry cards and `recordActions`), `config/sources.yml` comment at line 53; `DESIGN.md` bullet "Every collection entry has a page and an editor"; `HELP.md` editor bullet (venue `id` read-only, `name` editable); `HELP.md` Add and Delete bullets; `README.md` line for `docs/palette.md`; `docs/apps.md` rows for the write kinds and the radar Delete; the worktree-root `docs/DATA-MAP.md` rows for People, Organisations, Resources, the entry page paragraph and the radar `dismissed` sentence.

## Anything wrong

1. `test:quick` is over its limit. Command: `npm run test:quick`. Output: "ok vitest (49.4 s): Duration  41.59s ...", "test:quick: 50.0 s (limit 45.0 s); every command passed", "test:quick: over the time limit". An earlier run of the same command was 41.2 s, within the limit; the time depends on the load of the machine, and the changed-file selection reaches 266 test files through the new modules. Every command in it passed.
2. Two tests of `npm run test:checks` fail in the worktree because they read the hub's settings folder (`.oculus/config`), which the worktree does not hold. Output: "FAIL |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > names a group of its own and a path under the hub for every document" and "FAIL |unit| tests/checks/config/integrity.test.ts > the real hub > validates with no findings", then "Tests  2 failed | 265 passed (267)". They need the hub's `sources.yml` with the three new `collections:` lines under "Doc text"; the first run of `integrity.test.ts` printed findings about the domain and data-theme vocabulary of the hub's layer. Not verified here: the result of both once the hub layer is in place.
3. `npx tsc --noEmit -p .` prints three lines, "src/lib/views/shared/card/card.ts(12,15)", "src/lib/views/shared/forms/entry/entry-actions.ts(20,15)" and "src/lib/views/shared/forms/entry/task-card.ts(12,15)": "error TS2614: Module '"*.svelte"' has no exported member 'CardAction'". `card.ts` carries the same import in the unchanged copy; `svelte-check` (which reads `.svelte` types) reports 0 errors, so the lines are `tsc` not reading `.svelte` exports.
4. Git slips: I ran read-only `git -C . status` twice and `git -C . mv` once with no arguments (it failed); none changed anything. `sh utils/folder-check.sh` and `npm run test:quick` (which reads "changed files, from git since HEAD") run git internally.

## Doc text

The hub's `.oculus/config/sources.yml` collections list, after the `statements` line (line 64), three lines:

```
  - { key: people,         file: "registries/people.yml" }
  - { key: organisations,  file: "registries/organisations.yml" }
  - { key: resources,      file: "registries/resources.yml" }
```

Its comment at line 58, as `grep -n` prints it from the main checkout:

```
58:# Collection views: one card list per key, from one YAML file each, except the keys data, venues, pillars and domains, whose views are Data, Venues, Pillars and Domains and not a card list. The schema is the file's own `schema:` block, and the links between files are in docs/DATA-MAP.md. An entry is added and edited in the file, which Add and Edit in File open, and its status, deadline and date are changed on its card.
```

Replacement, the engine's `config/sources.yml:53` sentence for the same place:

```
# Collection views: one card list per key, from one YAML file each, except the keys data, venues, pillars and domains, whose views are Data, Venues, Pillars and Domains and not a card list. The schema is the file's own `schema:` block, and the links between files are in docs/DATA-MAP.md. Every entry has a page with an editor built from the schema, where it is edited and deleted, Add asks the new entry's name and opens that page, and an entry's status, deadline and date are also changed on its card. Edit in File opens the file at the entry.
```

`funding/funding.yml:1`, as `grep -n` prints it (first sentences; the rest of the line, from "NOTE:", stays):

```
1:# Funding: the applications pipeline + the funded programs I contribute to. Collection schema: the `schema:` block below. An entry is added and edited in the file, which Add and Edit in File open, and its status, deadline and date are changed on its card. NOTE: my one granted personal grant is the 2018 FWO PhD Fellowship (finger-decoding); ...
```

Replace "An entry is added and edited in the file, which Add and Edit in File open, and its status, deadline and date are changed on its card." with "Every entry has a page with an editor built from the schema, Add asks the key and opens that page, Edit in File opens the file at the entry, and an entry's status, deadline and date are also changed on its card."

`network/events.yml:1`, as `grep -n` prints it (the end of the line):

```
1:# Talks & Events: one calendar of conference appearances, symposia, visits, and pitches. ... Mark past ones status: completed. Schema: the `schema:` block below (an entry is added and edited in the file, which Add and Edit in File open).
```

Replace "(an entry is added and edited in the file, which Add and Edit in File open)" with "(every entry has a page with an editor built from the schema, Add asks the key and opens that page, and Edit in File opens the file at the entry)".
