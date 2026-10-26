# Step O79 brief check (on main at 4fa918d3)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O79.md`. Read: the brief whole; `plan.md` line 3 (the ledger has no `## Goal` heading; its head says it executes `tools/oculus/DESIGN.md`), O79's step line (plan.md:820) and rulings 392, 397, 398, 404, 415, 416 (plan.md:2748-2790) with the original option texts of 415 and 416 (`git show 4090778a -- .scratch/migration/orchestrator-state.md`); `agents/spec.md` whole; `agents/guarded.md` G8, G13, G32, G56, G66, G67, G128, G131; the tree; the hub's `.oculus/data/`, `.oculus/config.yml`, `.oculus/bookmarks.yml` and `.oculus/workspaces/research-hub.yml` (read only, `local.yml` never opened).

## 1. Names

- `TITLE_FIELD`, `identityField`, `identityFieldOf`: `git grep -n "TITLE_FIELD\|identityField\b\|identityFieldOf" -- src tests docs config ':!config/local.yml' README.md`. Every hit is in the write list. No test names them.
- `KEYED_FIELDS`, `idField`, `REGISTRY_SHAPES`, `idRequired`: `git grep -n "KEYED_FIELDS\|idField\|REGISTRY_SHAPES\|idRequired" -- src tests docs config ':!config/local.yml' README.md`. Outside the paths: `src/lib/data/sources/collections.ts:20,107-108`, which reads only `REGISTRY_SHAPES[...].list`. That stays true.
- "the first field", the same rule written in code under other names: `git grep -nE "\[0\]\??\.field|schema\?*\.\[?0|\.at\(0\)\?*\.field|names\[0\]|first field|schema's first" -- src config docs ':!config/local.yml'` and `git grep -n "'title'" -- src/lib/data src/lib/server/edit src/lib/state/forms src/lib/state/boards/collection`. Hits outside the paths that the change makes false:
  - `src/lib/data/snapshot/normalise.ts:539` `const ident = schema?.[0]?.field ?? 'title';` and `:512` `function entry(raw: RawEntry, index: number, ident = 'title')`. This is a fourth copy of the identity rule. It feeds every Entry's `id` and `title`.
  - `src/lib/data/model/model-collections.ts:73` `entryTitleOf(fields, ident = 'title')`, which returns `title`, else `name`, else the identity field. `:82` `entryIdOf(fields, ident = 'title')` returns `id`, else `key`, else the identity, else the title. Both write the identity and the display as field names in code. The file is in the write list only "(`SchemaField`)".
  - `src/lib/views/shared/forms/entry/edit/page-file.ts:48` `field: page.schema.at(0)?.field ?? 'title'` and `:43` `page.collection === 'leads' ? 'leads' : 'radar'`.
  - `src/lib/data/snapshot/hubs/feeds.ts:24-28` `FEED_IDENTITY = { radar: 'title', leads: 'title', linkedin: 'file' }`, read by `src/lib/server/edit/feeds/feeds.ts:60-62` (`FEED_RULES`) and `:675-842`. Leads and radar are hub collections (registry `leads`, `radar`), so their identity stays written in code.
  - `src/lib/server/files/fs/bookmarks.ts:32-33` `BOOKMARK_IDENTITY = 'label'` ("the first field of the scaffold's schema"), and its `SCAFFOLD` (`:41-60`), a schema with no `primary_key`. Bookmarks are written through `collectionFile` and `identityField` (`collections.ts:38,139`). After the change every bookmark write is refused. The hub's own `~/workspace/research-hub/.oculus/bookmarks.yml` has a schema with no flag; it lies outside `.oculus/data/` and so outside item 4's hub rewrite.
  - `src/lib/state/client/writes.svelte.ts:435` doc comment of `reorderEntries`: "the file's own schema's first field".
  - `src/lib/data/helpers/files/yaml/collection-text.ts:279-280` `fields = schema.length > 0 ? schema : [{ field: 'title', type: 'text' }]; const first = fields[0].field;` (`stubFields`). The file is in the paths, but the brief names only `:30` and `:281`.
  - `src/lib/state/boards/collection/index.ts:589-597` `identityValue`, whose fallback is `entry.title`; its comment names "`id`, `key` and `title`". The file is in the paths but this line is not named.
  - Unrelated hits that stay true: `config/text/views/system/help.yml:7`, `src/lib/server/machine/hpc/submit.ts:284`, `src/lib/ui/forms/Prompt.svelte:4`.
- The manifest's identity in code: `git grep -n "NOT_WRITTEN\|writableField" -- src`. `src/lib/state/forms/schema.ts:77` `NOT_WRITTEN = ['id']` and `:85-87` `writableField`, read by `src/lib/views/boards/editor/Editor.svelte:57,112` and `schema.ts:456,491`. Item 3 flags `id` with `primary_key: true`, yet the manifest form's never-written field stays the literal `'id'` in `schema.ts`. The brief does not name it.
- A source word compared in code, now a collection key: `git grep -n "PEOPLE_SOURCE\|PEOPLE_OPTIONS\|picksPeople" -- src`.
  - `src/lib/state/forms/schema.ts:411-413` `picksPeople`: `from[0] === 'people'`.
  - `src/lib/views/system/workbench/editors/FieldControl.svelte:83` `PEOPLE_SOURCE = 'people'`, read at `:128-133`.
  - `src/lib/state/boards/collection/index.ts:175` `PEOPLE_OPTIONS = 'people'`, read by `kindOf` at `:197-200`.

  Once `foreign_key:` names a collection key, each of these is a collection key written in code. A hub whose people collection is keyed otherwise loses Add person and the person control. That breaks the brief's own Conventions ("No config word, hub key or collection key is written in code") and the step line's "no registry key ... written in `schema.ts`". `src/lib/state/forms/new-entry.ts:24` `NAME_FIELD = 'name'`, written by `addPerson` (`:219`), is the person's display field written in code. `resourceChoices` (`schema.ts:261-268`) picks the glyph by reading the resources registry; the brief does not say whether the glyph stays once `schema.ts` names no registry.
- `from` as a schema field's key: `git grep -nE "\.from\b|\bfrom:|'from'|\{ ?from\b" -- src` (filtered) and `grep -rnE "from: *\[ *'|from: *'|from: *\{ *field|\bfrom: [a-z]" tests`. Hits outside the paths:
  - `src/lib/server/edit/writes/manifest.ts:100-125` (`sourced`, `const { type, from } = read.data`). It reads the manifest schema's `from` to strip the hub prefix from record-naming values. After the rename this reader drops every field without a word. The file is not in premise 3 and not in the paths, and O80, in flight, writes it (O80 brief, Paths).
  - `src/lib/state/boards/collection/index.ts:197` `kindOf(field, type, from)`: the file is in the paths, the line is not named.
  - `tests/data/snapshot/normalise.test.ts:202` `{ field: 'category', type: 'select', from: 'vocab.venue_categories' }`: false after the change.
  - `docs/apps.md:410` says a `collections` schema line is `{ field, type, label?, required?, options?, from?, ... }`. That is the apps payload's public shape. If `SchemaField.from` is renamed (`model-collections.ts` is in the paths for `SchemaField`), apps reading `schema[].from` break and the guide is false. The brief neither names `docs/apps.md` nor says whether the app-visible key changes.
  - `src/lib/data/snapshot/schema/check.ts:256` (`x-from`, an internal annotation): stays true.
- Tests that use the changed names, outside the paths: `grep -rln "REGISTRY_SHAPES\|idField\|KEYED_FIELDS\|TITLE_FIELD\|identityField\|entryTitleOf\|entryIdOf\|FEED_IDENTITY\|recordChoices\|picksPeople\|askFields\|fixedFields\|identityValue\|identityFaults\|identityFindings" tests` printed:
  - `tests/state/forms/new-entry.test.ts:47-60` (describe 'askFields', with the row `'venues' ... ['name', 'id']`, which goes with `KEYED_FIELDS`).
  - `tests/state/forms/record-fields.test.ts:1-27` (`fixedFields(collection, schema)` rows with `'venues'`; the head comment describes the venue rename by `name`).

  Both are made false, and neither is in the paths. Under `guarded.md`, the second is G32's; describe 'askFields' is under no entry (`grep -c askFields guarded.md` prints 0).
- Schema fixtures with no flag: `grep -rlE "\{ field: [a-z_]+, type: |field: '[a-z_]+', type: '|- field: [a-z_]+$" tests`. It lists 43 files. Outside the paths: `tests/routes/edit/undo/undo.test.ts`, `tests/routes/edit/write-fixture.ts`, `tests/server/edit/writes-fixture.ts`, `tests/server/core/changes.test.ts`, `tests/server/edit/feeds.test.ts`, `tests/server/edit/literature.test.ts`, `tests/data/sources/collections.test.ts`, `tests/data/sources/registries.test.ts`, `tests/data/sources/career.test.ts`, `tests/data/snapshot/normalise.test.ts`, `tests/data/snapshot/relation-shapes.test.ts`, `tests/data/snapshot/resources.test.ts`, `tests/state/forms/entry-save.test.ts`, `form-draft.test.ts`, `page-entry.test.ts`, `record-values.test.ts`, `record-fields.test.ts`, `new-entry.test.ts`, `tests/views/shared/forms/entry-add.test.ts`, `tests/routes/sessions/compose.test.ts`, `tests/ui/html.dom.test.ts`. Item 1 says a schema with no flag is a finding and its writes are refused. So every write or identity read over these fixtures changes outcome. One example is `tests/data/sources/collections.test.ts:105,127` ("reads a title-keyed collection", `schema: []`). The brief's path list does not show this scope.
- The demo hub's settings: `tests/fixtures/hubs/demo/.oculus/config.yml` names its own `collections:` entries. Its `leads.yml` and `radar.yml` (and `career.yml`) have no `schema:` (a `python3 -I` read of each demo data file's keys). Under item 1 they need `primary_key: title` on their `collections:` entries, or the case 1 edit, remove and Add on leads and radar are refused. That file, and oculus's own `config/defaults/sources.yml` entries (`:50-51`, read where a hub names none), are outside the paths.
- `docs/templates.md` holds the templates that Make Folder a Hub and the Files view's make items write into a hub (`src/lib/data/sources/documents/templates.ts:1,22`, `src/lib/server/files/project/make.ts:22,260`). Item 5 treats it as prose to describe. Its schema blocks are scaffolds, and each needs `primary_key: true` and `display:` ranks, or every new hub opens with findings and refused writes.
- `.scratch/migration/agents/guarded.md` (the orchestrator's): G66's text ("a hub field whose `from` names a source") and G128's ("a `from` that names no registry, `projects` or vocab list") are made false. The brief does not say the orchestrator rewords them at landing.
- New keys `primary_key`, `foreign_key`, `display`: `grep -rn "\bdisplay:\|primary_key\|foreign_key" config tests/fixtures src --exclude=local.yml` and the same over the hub. The only hits are CSS `display:` lines and `latex.ts`'s `display: boolean`, so no collision with a configured key.
- `sourceChoices`, `recordChoices`, `fixedFields`, `selectChoices`: `git grep -n "fixedFields\|sourceChoices\|selectChoices\|choicesFor" -- src tests docs`. Outside the paths: `src/lib/state/client/selectors.svelte.ts:569` (`choicesFor`, signature kept, true) and `src/lib/views/shared/forms/NewIdeaForm.svelte:89` (`selectChoices`, true). No test calls any of them.

Findings:
- Four further copies of the identity rule are outside the brief: `normalise.ts:512,539`, `model-collections.ts:73-89`, `page-file.ts:43,48` and `FEED_IDENTITY` with `FEED_RULES`. The `collection-text.ts:279-280` copy is in a path file but not named.
- `NOT_WRITTEN = ['id']` (`schema.ts:77`) is not named.
- Three `'people'` collection-key comparisons are not named: `schema.ts:412`, workbench `FieldControl.svelte:83,132` and `collection/index.ts:175,199`. `NAME_FIELD` (`new-entry.ts:24`) and the resource glyph's registry lookup are not named either.
- The bookmarks scaffold and the hub's `.oculus/bookmarks.yml` are not named.
- `server/edit/writes/manifest.ts:115` is missing from premise 3 and the paths, and O80 writes the same file.
- These files are made false and are outside the paths: `docs/apps.md:410`, `tests/data/snapshot/normalise.test.ts:202`, `tests/state/forms/new-entry.test.ts`, `tests/state/forms/record-fields.test.ts`, about 20 further test files with flagless schema fixtures, the demo hub's `config.yml`, `config/defaults/sources.yml`, and the template schemas of `docs/templates.md` as scaffolds.
- The wording of G66 and G128 in `guarded.md` is made false.
- `normalise.ts`, `entry-add.ts` (`askFields` caller, `:107`), `docs/apps.md` and `writes/manifest.ts` are also on O80's path list. The shared-path judgement against O80 was made on a list that omits them.

## 2. The step line

- "a schema field flagged `primary_key: true` gives an entry's identity": item 1.
- "a file with no schema naming it on its `collections:` entry": item 1 (`primary_key: <field>`, described in `config/options/sources.yml`). The demo hub's and oculus's `collections:` entries for leads and radar, which need it, are not named (check 1).
- "`TITLE_FIELD` and 'the schema's first field' gone": item 1 names `TITLE_FIELD`, three `identityField` copies, `identityFieldOf`, `KEYED_FIELDS` and `idField`. Partial: the copies in check 1 (`normalise.ts:539`, `entryIdOf` and `entryTitleOf`, `page-file.ts:48`, `collection-text.ts:279-280`, `FEED_IDENTITY`, the bookmarks identity) have no requirement.
- "`from:` renamed `foreign_key:` once in every file that writes it, oculus's and the hub's": items 2, 3 and 4. Gaps:
  - Item 4 does not say that the hub's `research/data.yml:60` nested `{ field: from, type: tags, from: datasets, ... }` must become `foreign_key: data`. Item 3 says this for the manifest schema's datasets field, but item 4's rule is only "every `from:` ... becomes `foreign_key:`", which leaves `foreign_key: datasets`, a foreign key naming no collection.
  - Ruling 404 (a) lists "the options catalog" among the files. Decision 3 keeps the catalog's own `from:` and renames only the `manifest_fields` row. That reading is named as a decision, so it is no gap, but it rests on the orchestrator's reading of the ruling.
- "the code reading only `foreign_key:`": item 2. `server/edit/writes/manifest.ts:115` has no requirement (check 1).
- "a foreign key reaches any collection, stores the target's primary key and shows the target's first filled field by its `display:` rank": item 2.
- "no registry key or display field written in `schema.ts`": item 2 (`sourceChoices`). Partial: `picksPeople` (`schema.ts:411-413`, `'people'`) and `NOT_WRITTEN = ['id']` (`schema.ts:77`) stay in `schema.ts` with no requirement. So does the resource glyph's registry choice (`resourceChoices`, `:261`).
- "after O78": O78 is ticked on plan.md:818.
- Ruling 416's "the 47 venues and 20 projects of the hub with no `short` get one, written in the hub with O79's hub rewrite": item 4 gives it to the orchestrator at landing. It has no builder requirement, by design.

Findings:
- "the schema's first field gone" is served only partly, since the four further copies have no item.
- "no registry key ... written in `schema.ts`" is served only partly (`picksPeople`, `NOT_WRITTEN`).
- The hub's `data.yml` `from: datasets` has no item that turns it into `data`.

## 3. Premises

- P1, the identity field "written three times": the grep in check 1 printed the three named copies at the cited lines (`record-fields.ts:17-24`, `collections.ts:48-54`, `validate.ts:390-394`). Two differences:
  - "read by `identityFindings` (`:396` on)" is inexact. `identityFieldOf` is read by `checkEntryIdentity` at `validate.ts:445`, which passes it to `identityFindings` (`:405`).
  - `entries.ts:77` is a use of the refusal key `REFUSALS.identityField`, not a call of `identityField`.

  The premise is false in its count: the same rule is written again at `normalise.ts:539`, `collection-text.ts:279-280` and `page-file.ts:48`, with field-name defaults in `model-collections.ts:73-89` (`git grep` in check 1).
- P2: `collection-text.ts:30` `KEYED_FIELDS = { venues: 'id' }` and every listed reader matches (`:281`, `entries.ts:328,534`, `record-fields.ts:31`, `new-entry.ts:33`). `REGISTRY_SHAPES` is at `hub-names.ts:798-810` (doc from `:790`): venues `id`, the seven others `key`. Its readers match (`build.ts:113`, `lists.ts:164,167`, `validate.ts:440`, `registries.ts:97,102`).
- P3: `sourceChoices` is at `schema.ts:290-310` (the brief's 283-310 includes the end of `choicesFor`), with the words as stated and `resourceChoices` at `:261`. The two `recordChoices` callers are at `Literature.svelte:97` and `FieldControl.svelte:148`. The parenthetical `src/lib/views/system/workbench/editors/` fits only FieldControl; `Literature.svelte` is at `src/lib/views/feeds/literature/`. The paths list has it right. The other `from` readers match at the cited lines. Missing: `src/lib/server/edit/writes/manifest.ts:100-125` and `collection/index.ts:197`.
- P4: `git grep -cE "from: ?\[?(venues|people|...)"` printed manifest-schema.yml 15, deck-schema.yml 1, sources.yml 1, templates.md 31, manifest-fields.test.ts 7, reference-hub.ts 6, keys.test.ts 2, and 1 each for the five tests and the two demo files. All match.
  - The one hit in `config/options/sources.yml` is `:192` `from: people`, the catalog's own `from:` of the `self` option (premise 5). It is not `:53`: `sed -n 53p` holds no `from:`.
  - The hub's sources, from a `python3 -I` walk of every `schema:` with nested `fields:`, and `grep -rhoE "from: *[A-Za-z_.\[\], ]+" .oculus/data | sort | uniq -c`: `people` 16 (not 19), `projects` 6 (not 8), `organisations` 2, `datasets` 1 (`research/data.yml:60`, missing from the brief), `vocab.radar_buckets`, `vocab.data_access`, `vocab.venue_categories` and `vocab.venue_tiers` 1 each.
  - The file list (applications, education, events, funding, joint-work, tasks, literature, radar, people, data, venues) matches. The hub's `config.yml` and workspace file write no `from:`; grep printed nothing.
  - `tests/data/snapshot/references.test.ts` holds a second `from` (`:79`, the map form) that the source-word count misses. `tests/data/snapshot/normalise.test.ts:202` is missing.
- P5: `config/options/*.yml` `from:` lines (`grep -rn "^\s*from:" config/options`) name option lists (tiers, languages, collections, people, themes, ...). This matches.
- P6: the hub's `data.yml` entry `from:` lines are 343, 363, 398, 468, 482, 833, 1003, 1019, 1033, 1047, 1194; the brief names five of the eleven. `datasets.ts:88` reads `source.from`, which matches. Missing: the schema line that declares that data field (`data.yml:60`) carries `from: datasets`, which is a schema field's key and must become `foreign_key: data`.
- P7: the hub `python3 -I` output gives first `key` for applications, education, events, funding, joint-work, tasks, literature, organisations, people, domains, pillars, data, resources and statements; first `title` with no `key` for leads, radar and career; venues first `name`, with `id` present. This matches. `manifest-schema.yml:33` `id: { ..., type: readonly }` matches. `config/defaults/sources.yml:35-51` keys the datasets file `data` and the others by their registry word, which matches. Not stated: in the demo hub, `leads.yml`, `radar.yml` and `career.yml` have no `schema:`, and the demo hub's `config.yml` names its own `collections:`.
- P8: venues: 76 entries, 47 with no `short` (`python3 -I` over `venues.yml`), which matches. Projects: at the hub's HEAD, 114 tracked `project.yml`, 20 with no `short` (`git ls-files | grep project.yml$` with `git show HEAD:<f> | grep -q '^short:'`), which matches. The working tree also holds `side-projects/theaxec.github.io/.oculus/project.yml` (untracked, its own repository), giving 115 and 21. The workspace folders' own manifests (`.oculus/workspaces/research-hub.yml`) for cathedra, game-engine, ordo, scotoma, officium and youtube-downloader also have no `short`; only oculus's has one. That makes 27 portfolio projects shown with no short name.

Findings:
- P1 says the identity rule is written three times; it is written at least four more times (above).
- P3 omits `server/edit/writes/manifest.ts:115`.
- P4: the hub counts `people (19)` and `projects (8)` are 16 and 6, and the source `datasets` (`data.yml:60`) is missing. `config/options/sources.yml:53` holds no `from:`; the counted hit is `:192`, the catalog's own `from:`.
- P6 does not say that the field's schema line carries `from: datasets`.
- P7 does not state that the demo hub's leads, radar and career files carry no schema.
- P8 leaves out the seven workspace-repository manifests with no `short`.

## 4. Cases and checks

- Case 1: consistent with the rules file (a case-run program over a scratch copy of the demo hub). It will be red on the leads and radar writes unless the demo `config.yml` gains `primary_key:` (check 1). That file is outside the paths, and the case does not say so.
- Case 2: consistent.
- Cases 3 and 4: consistent. Their rows go under G56, whose text ("each rule a hub schema states gives its finding") covers rules about entries, not rules about the schema itself. The entry's wording needs extending at landing.
- Case 5: the `sourceChoices` half has no test home. `grep -rn "sourceChoices\|selectChoices\|choicesFor" tests` prints nothing, so the test the brief says to "find ... and quote" does not exist. G128's Test line names only `manifest-fields.test.ts`, and G128's guarantee is a hub's `manifest_fields` row, not the choices a field offers. No entry of `guarded.md` covers a field's choices (`grep -n "choices" guarded.md` gives only G119's theme rows). Under the rules file ("What every package obeys", the test paragraph), "A step that needs a new entry stops and asks Axel for it, and writes no test until he has ruled". The same holds for case 2 and for item 6's `sourceChoices` row.
- Cases 6, 7 and 8: consistent (G56). For case 8, the shape at `record.ts:315-391` is `additionalProperties: false` and `hub.ts:28,87` puts it on the file's `schema:` key, so a `from:` left after the rename is an undeclared key. That is a reading, not run.
- Case 9: consistent.
- Case 10: inconsistent with the item it tests. Item 6 asks for "a file whose primary key is not its first field (a venue by `id`, a lead by `title`)". In the hub, `leads.yml`'s first field is `title`; in the demo hub, `leads.yml` has no schema. A lead does not have that property, and a lead's writes go through the feed writer (`FEED_RULES`, `server/edit/feeds/feeds.ts:60-62`), which the brief does not change.
- Case 11: consistent.
- Case 12: inconsistent with the tree. On the Add form today a venue is asked for `name` and `id`, both typed (`askFields`, `new-entry.ts:31-38`; `tests/state/forms/new-entry.test.ts:50-55` row `['name', 'id']`). `fixedFields` serves the entry page (`page-entry.ts:171`), not the Add form. "id shown as the fixed field, as today" on Add is not today's behaviour, and the brief does not say what Add asks after the change.
- Case 13: consistent.
- Case 14: consistent. The G67 file is `tests/data/snapshot/rename.test.ts`, named on G67's Test line; the brief could name it instead of "find them with `grep -rn`".
- Case 15: the command `OCULUS_TEST_HUB=<scratch> npx vitest run tests/checks/config/config-folder.test.ts` checks the hub's document entries and its config files against their shapes (`config-folder.test.ts:595-620,788-797`). It does not check data-file findings. The real-hub data check is `tests/checks/config/integrity.test.ts` 'validates with no findings' (`:201`), which builds the snapshot and asserts `findings` is `[]`. It is one of the four files the rules file allows to read the real hub.
- Case 16: consistent.
- "Where you work": "The dev server, when a run needs one, on port 8798" invites what the rules file bans ("A builder runs no page"). No case needs a server.
- Verify 1: `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams && npm run test:quick` puts the PATH prefix on the first command only. Here `node --version` already prints v24.21.0, so it is harmless.
- Verify 5: `grep -rnE "^\s*-?\s*\{?\s*field:.*\bfrom:|^\s+from:"` misses a map-row `from:` of `manifest-schema.yml`. The second grep, `from: \(venues\|...\)`, misses a list `from: [people, projects]` (`manifest-schema.yml:57`). Run on main, the first grep printed only deck-schema `:31` and the two demo lines, and the second missed `:57`.
- Verify 6 printed nothing on main (run), so it is satisfiable.

Findings:
- Case 5's `sourceChoices` half, case 2 and item 6's `sourceChoices` row have no `guarded.md` entry and no existing test. The rules file sends that to Axel as a new entry.
- Cases 3, 4, 6, 7 and 8 rest on G56 text that does not cover schema-level rules.
- Case 10's lead is no file whose primary key differs from its first field, and its writes go through `FEED_RULES`, which the step leaves in code.
- Case 12 misstates the Add form today (name and id both asked).
- Case 15 names a test that does not read data-file findings; `integrity.test.ts` is the one that does.
- Verify 5's greps miss `from: [people, projects]` at `manifest-schema.yml:57`.
- The port-8798 dev-server line invites what the rules file bans.

## 5. The question

The goal: an entry's identity and a reference's target and display given by the schemas, with no field, registry or position written in code for them.

- Case 1: yes. It is a no-change regression check, and an unchanged tree passes it. The demo hub has no `short` on venues or in its schemas, so it exercises no rank.
- Case 2: yes. `sourceChoices` today hard-codes `['short', 'name']` for venues (`schema.ts:298`), so a venue with and without `short` passes on the unchanged tree. Only a target whose ranks differ from the hard-coded list would tell them apart: a venues schema ranking `name` 1, or the same registry under another collection key.
- Cases 3 and 4: no. The finding needs the flag read.
- Case 5: partly. "Offers the events' titles" would also pass under a hard-coded `title` fallback. A target ranked on a field other than `title` closes that.
- Cases 6, 7 and 8: no.
- Case 9: yes, a regression check (no goal content).
- Case 10: yes. A lead is addressed by `title` today through `FEED_IDENTITY`, and the hub's leads' first field is `title`, so the row passes with `FEED_IDENTITY` and "the first field" both still in code.
- Case 11: yes, if the row's collection is keyed `venues`. `KEYED_FIELDS` (or a kept `venues` lookup) passes it. A collection keyed otherwise (`journals`) with `primary_key: true` on `id` would not pass by a table.
- Case 12: yes, and it misstates today (check 4).
- Case 13: no.
- Case 14: no. A row written with `foreign_key: people` fails until the index reads the key.
- Case 15: yes. An empty rewrite gives no new finding too. It needs, beside the finding list, a check that the scratch hub's schemas hold no `from:` and that every schema has one `primary_key: true`. As written it also does not catch the bookmarks file (outside `.oculus/data/`, no data finding, only refused writes) or the leftover `foreign_key: datasets` (only if the finding list covers `data.yml`).
- Case 16: yes, a regression check.
- The step line's check (O79 has none of its own beyond the verify list): verify 4's grep (`TITLE_FIELD\|identityField\|...\|first field`) passes with `normalise.ts:539` (`schema?.[0]?.field ?? 'title'`), `page-file.ts:48`, `entryIdOf` and `entryTitleOf`, `FEED_IDENTITY`, `BOOKMARK_IDENTITY`, `NOT_WRITTEN` and `PEOPLE_OPTIONS` left in place, so yes.
- Item 1: yes. One function can be added and the named copies removed while Entries' ids and titles still come from `id`/`key`/`title`/`name` (`model-collections.ts`) and the first field (`normalise.ts:539`).
- Item 2: yes. `sourceChoices` can read ranks while `picksPeople`, `kindOf` and the workbench `PEOPLE_SOURCE` still compare `'people'`.
- Item 3: yes. `id` can carry `primary_key: true` while `NOT_WRITTEN = ['id']` decides the form.
- Item 4: yes. The listed lines can be complete for `.oculus/data/` while `data.yml:60` keeps a target naming no collection and `.oculus/bookmarks.yml` has no flag.
- Item 5: no for the named docs (grep-driven). Yes for `docs/templates.md` as a scaffold source: its prose can be rewritten with its template schemas left flagless.
- Item 6: the rows of cases 2, 10, 11 and 15 as above.

Findings: cases 2, 10, 11 and 15, verify 4 and items 1 to 4 can pass with identity or display still written in code. The reasons are above.

## 6. Implied inputs

- What the Add form asks for a venue once its primary key is `id`. Today it asks `name` and `id` (`askFields`, `new-entry.ts:31-38`). Missing. Expected result: stated, for example the primary key and the field ranked `display: 1`, else every field `required`, with the name not lost.
- Which schemas the "no primary key, a finding and writes refused" rule covers. In question: a sections-kind file (`career.yml`, `FileKind 'sections'`, `hub.ts:20`), oculus's `deck-schema.yml` and `cpp-schema.yml`, a nested `records` field's `fields:`, the bookmarks scaffold, and the manifest schema. Missing. Expected: entries-kind collection files only, with each other kind named and no finding. Item 4 flags `career` on `title` without saying why a one-map file has a primary key.
- `primary_key: <field>` on a `collections:` entry for a file that also has a schema flag, the same field or another. Missing. Expected: a finding naming both, or which wins.
- `primary_key:` naming a field the entries do not carry, or a non-text value. Missing. Expected: a G13 finding naming the entry and key.
- `primary_key: true` on a list or records field, or on a nested records field, or `primary_key: "yes"`. Missing. Expected: a finding; an identity cannot be a list (`entries.ts` refuses an Array identity at `entry-edit/entries.ts:76`).
- `foreign_key:` empty or `[]`, and one naming a collection whose file has no primary key. Missing. Expected: a finding (as `manifest_field_from_none` does for rows), and no choices.
- A hub collection keyed `projects`, or with a key beginning `vocab.`, colliding with the reserved targets (rules file: "Every id or key a step introduces is checked ... colliding with a configured or reserved key"). Missing. Expected: the Z1016-style finding, and which target wins.
- Two hubs in one workspace that key one registry differently (people as `people` in A and `persons` in B). `foreign_key: people` in A today offers B's people through the registry (`recordChoices` merges hubs, `schema.ts:216-240`), and G131 joins by registry, not key. Missing. Expected: stated, for example resolving each hub's collection by the registry the named collection carries, else only A's.
- The reference index's source vocabulary: schema `foreign_key:` values become collection keys (`data`), while the options catalog's own `from: people` (`sources.yml:192`, `catalog/schemas/references.ts:33`) keeps registry words. Missing. Expected: one source name per target in the index, so the `self` reference and a `foreign_key: people` value stay one definition (G66 rows 'the person the setting self ...'), and a rename (G67) refuses or edits both.
- Duplicate findings for an empty or shared venue `id` once identity and registry id are the same field. Today `checkEntryIdentity` skips a registry file whose identity equals `idField` (`validate.ts:436-447`), and `registries.ts:97-102` gives `entry_no_id`. Missing. Expected: one finding per empty key, not two.
- The card heading in the hub's Venues view, which changes from the name to `short` for the 29 venues with one (item 1's "the entry's display"). The Literature project picker's labels change from `title` to `short` (`Literature.svelte:97`). These are visible changes; case 1 runs on the demo hub, whose venues have no `short`. Missing. Expected: listed in the report's before and after for the look.
- Whether `SchemaField.from` is renamed in the apps payload (`docs/apps.md:410`). Missing. Expected: stated as a user-visible shape, kept or changed, with the guide rewritten.
- A new hub made from `docs/templates.md` (Make Folder a Hub). Missing. Expected: no finding, writes allowed, every template schema flagged.
- The bookmarks file, scaffold and the hub's `.oculus/bookmarks.yml`: add, rename and remove a bookmark after the change. Missing. Expected: allowed, `label` flagged.
- Leads and radar in the demo hub and in a hub with no schema there: their `collections:` entries' `primary_key:`. Missing. Expected: `primary_key: title` on the demo `config.yml` entries, and a decision on oculus's own `config/defaults/sources.yml:50-51`.
- The seven workspace-repository manifests with no `short` (check 3, P8). Ruling 416's wish covers "the 20 projects of the hub". Missing. Expected: the open question of whether the landing writes them (in other repositories) or they fall back to `title`.
- File sizes: `tests/server/edit/writes.test.ts` is 827 lines, `tests/checks/source/keys.test.ts` 849 and the workbench `FieldControl.svelte` 506 of 520 (`wc -l`). Rows added there pass the 880 and 520 bounds; the rules file covers the split, and the brief does not warn of it.

Findings: each item above marked Missing.

## 7. ADRs

- `ls -d docs/adr` printed "No such file or directory". `.agents/plan.yaml` names no `adr` key (`grep -n "adr" .agents/plan.yaml` matches only `rules:` and `standards:`, which name `.scratch/migration/agents/spec.md`). No record.

Findings: none.

## 8. Dictated text

- The report's first line "Everything in the brief is done": `grep -n '"' briefs/O79.md` finds it at `:144`. It holds (it is the rules file's own sentence).
- The key names `primary_key: true` (`:34`, `:54`), `primary_key: <field>` (`:34`, `:107`), `foreign_key: projects` (`:36`), `display: 1` and `display: 2` (`:36`, `:37`), and the heading "Hub rewrite" (`:15`, `:37`): `grep -n "primary_key: true\|foreign_key: projects\|display: 1\|primary_key: <field>" briefs/O79.md`. They hold: ASCII, and the names the rulings give (397 (a), 404 (a), 415 (b), 416 (b)).
- The brief dictates no sentence of a catalog, a doc or a comment word for word. `LC_ALL=C grep -n '[^ -~]' briefs/O79.md` printed nothing.

Findings: none.

## Declined to judge

- Whether ruling 404 (a)'s "the options catalog" means only the `manifest_fields` row (decision 3) or also the catalog's own `from:` of option lists. That is a reading of Axel's ruling, so it is his to confirm.
- Whether the resource glyph on a resource choice stays once `schema.ts` names no registry. It is a user-visible behaviour the ruling text does not settle.
- Whether `FEED_IDENTITY` and `FEED_RULES` (leads and radar) are inside O79 or a later step. Leads and radar are collections with registries, which suggests inside; the step line names only the schema and the `collections:` entry, and neither names the feed writer.
- Case 8's finding is judged by reading `record.ts:315-391` and `hub.ts:28,87`. The validation was not run.

Agent usage: a1f2ea95e545e0ba6, claude-opus-5-5, 286519 tokens, 102 tool uses, 15 min 30 s

## Closed

The brief was written again from main at 39b7b688 (O80 and O82 landed) against every finding above, with open item 425 ruled (a), 426 settled and 427 ruled (a). Each finding and the change that closes it:

- Section 1, the further copies of the identity rule (`normalise.ts:512,539`, `model-collections.ts:73-89`, `page-file.ts:43,48`, `FEED_IDENTITY` with `FEED_RULES`, `collection-text.ts:279-280`, `identityValue`): premise 1 names each, item 1 removes each, and the paths list holds each file.
- Section 1, `NOT_WRITTEN` (`schema.ts:79` on main): premise 1 and item 1 (it becomes the manifest schema's primary key field).
- Section 1, the `'people'` comparisons, `NAME_FIELD` and the resource glyph: premise 2a and item 2 (the target collection's registry word; `addPerson` writes the people schema's `display: 1` field; the glyph stays for a collection carrying the registry `resources`, decision 9).
- Section 1, the bookmarks scaffold and the hub's `.oculus/bookmarks.yml`: premise 4, item 1 (the `SCAFFOLD` flags `label`), item 4 (the hub file flagged), case 17.
- Section 1 and section 3 P3, `server/edit/writes/manifest.ts` (`sourced`): premise 3, item 2, the paths list (lines 95-130).
- Section 1, the files made false outside the paths (`docs/apps.md:410`, `normalise.test.ts:202`, `new-entry.test.ts`, `record-fields.test.ts`, the flagless test fixtures, the demo hub's `config.yml`, `config/defaults/sources.yml:50-51`, `docs/templates.md` as scaffolds): premises 2b, 4, 7 and 9, items 3 and 6, cases 12 and 18, the paths list.
- Section 1, G66 and G128 made false: item 6 says the orchestrator rewords G56, G66 and G128 at landing.
- Section 1, the shared paths with O80: O80 has landed; the brief is checked against main with O80 in it.
- Section 2, the hub's `research/data.yml:60` `from: datasets`: premise 6 and item 4 (`foreign_key: data`).
- Section 2, "no registry key ... in `schema.ts`" (`picksPeople`, `NOT_WRITTEN`, `resourceChoices`): item 2 and item 1.
- Section 3, P1 count, P4 hub counts and `sources.yml:192`, P6, P7: premises 1, 4, 5, 6 and 7 corrected; the counts rechecked on main at 39b7b688 (`git grep -c "from:"`), where `tests/checks/source/keys.test.ts`'s `from: vocab.<key>` check now lives in `tests/checks/source/catalog-file-keys.test.ts` (premise 4, item 6, paths).
- Section 3 P8 and section 6, the seven workspace-repository manifests with no `short`: Conventions says they are shown by `title`, ranked 2; ruling 416 names the hub's 47 venues and 20 tracked projects.
- Section 4, cases 2 and 5 and item 6's choices row with no guarded entry: ruling 425 (a), G132, `tests/state/forms/choices.test.ts`, cases 2, 5, 20 and 22.
- Section 4, G56's text covering schema-level rules: item 6 (the orchestrator extends G56 at landing).
- Section 4, case 10's lead: case 10 rewritten (a person keyed `key` and displayed by `name`; a lead written through the feed writer by its `collections:` entry's `primary_key:`, with `FEED_IDENTITY` keeping only `linkedin`).
- Section 4, case 12: premise 2b and case 12 state today's Add form (`name` and `id`), and item 1 says what it asks after.
- Section 4, case 15's test: case 15 names `tests/checks/config/integrity.test.ts` 'validates with no findings' and adds a case-run program over the scratch hub.
- Section 4, verify 5's greps: verify 5 greps `\bfrom:` over the schemas, the demo hub and the templates.
- Section 4, the port-8798 line: removed; "Where you work" names no server.
- Section 5, cases and items that could pass with the rule still in code: case 2 ranks `name` 1 and keys the venues registry as `journals`; case 11 keys `journals`; case 15 checks the scratch hub's keys; verify 4 greps every removed name, `NOT_WRITTEN` and `FEED_IDENTITY` among them.
- Section 6, the implied inputs: the Add form (item 1, case 12); the files the rule covers (item 1, decision 13); an entry's `primary_key:` beside a flag, a flag on a list or tags field, a flag not `true` (item 1, case 19); `foreign_key:` empty or naming a collection with no primary key (item 2, case 20); a collection keyed `projects` or `vocab.<x>` (item 2, case 21); two hubs keying one registry differently (item 2, case 22); one source name per target in the reference index (item 2); one finding for an empty venue `id` (item 1, case 23); the visible card and picker changes (the report's before and after); `SchemaField.from` in the apps payload (ruling 427 (a), item 2); a new hub from the templates (item 3, case 18); the bookmarks (case 17); leads and radar's `collections:` entries (item 3); file sizes (Conventions).
- Declined to judge, ruling 404's reading: settled by Axel at open item 426. The resource glyph: item 2 keeps it by the registry word. `FEED_IDENTITY` and `FEED_RULES`: inside O79, item 1.
