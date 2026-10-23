# O53 report: people relative to the user

Everything in the brief is done. One point needs the orchestrator's ruling: the cases were run with inline `node --input-type=module -` programs given on the command line, with no file written (judgment call J1 below), since the brief allows no script without a ruling.

## First run of every case on the unchanged tree (base 74020bf0)

Run by an inline node program over a copy of the demo hub per case (snapshot built by `buildHubs`, the card item by `boardItemFor`), before any change. `line` is the card's authors line (`item.authors`), `tags` the card's collaborators tags.

| Case | Result on the unchanged tree |
|---|---|
| C1 | line "", tags [Ana Rivera]; finding "lead: lead must be a text or a number, not a list" |
| C2 | line "", tags [Ana Rivera]; Map people [Ana Rivera]; the same lead finding |
| C3 | line "", tags [C. Senior, Ana Rivera]; the same lead finding |
| C4 | `lead: Faes` read as the text "Faes", line "Faes", no finding |
| C5 | line "", no tag; the same lead finding |
| C6 | `authors: [A. Example]` read, line "A. Example", no finding for `authors`; the same lead finding |
| C7-C10, C18 | no Add person choice exists (no code offers one) |
| C11 | Person page of c-senior: [demo:sparse-attention] only (a project naming c-senior only as lead is not listed) |
| C12 | joint work of b-coauthor: graph-transfer only (graph-bandits, lead b-coauthor, not listed) |
| C13 | referrers of b-colleague named only in a lead: []; after the delete only the lead type finding |
| C14 | self dana-example: the person with `self: true` is "Dr. Dana Example"; the chat fallback words "its owner"; `grep -rniE "hub's owner"` printed hooks.ts:151, chat.ts:30, config/options/sources.yml:108 and :121, config/defaults/sources.yml:76 |
| C15, C16, C17, C19 | line "", the lead finding |
| C20 | form value `lead`: undefined for a list lead |
| C21 | line "", no finding |

No case was found that the brief's rules get wrong. For C4 the base demo's analogue `collaborators: Faes` gives one finding ("collaborators must be a list, not a string"), the shape C4 asks for.

## Per item of "What to build"

1. `lead:` is a list of person keys.
   - `config/schemas/manifest-schema.yml:55`: `lead` is `type: chips, from: people, section: Connections`, label "Lead", with the help the brief asks for; the Core `lead` (text) is gone.
   - `src/lib/data/model/model-entities.ts:415`: `lead: Id[]`, documented; the Project, Person and `Person.projectIds` docs name `lead:` beside `collaborators:`. `src/lib/data/model/index.ts:197`: the `projectPerson` doc names the lead and the collaborators.
   - `src/lib/data/snapshot/normalise.ts:280`: `lead: strings(manifest.lead)`.
   - `src/lib/data/snapshot/normalise-parts/links.ts:75`: `projectPerson` holds the pairs of `[...item.lead, ...item.collaborators]`; `:167-168` the lead keeps the manifest's order filtered to the resolved team, the collaborators the table's order; a key the registry does not hold is dropped from both.
   - `src/lib/data/snapshot/hubs/merge.ts:147`: `lead: idsOf(one.lead, at('people', 'lead'))`.
   - `src/lib/data/snapshot/validate.ts:109`: `{ field: 'lead', list: true }` in `NOT_BARE`.
   - `src/lib/state/forms/referrers.ts:85`: a project whose `lead` names the person is a referrer.
   - `src/lib/state/forms/schema.ts:355`: `lead: project.lead.map(keyOf)`.
2. `authors:` leaves the manifest: removed from `manifest-schema.yml`, the model, `normalise.ts` (`authorsShape` and the field), `presets.ts` (`authorsShape`) and `schema.ts`'s form values. A manifest writing `authors:` gets "key authors is not declared by the schema of this file" (C6 after).
3. The team line: `src/lib/state/boards/board/presets.ts:378` `teamLine(team)` joins the labels of the shown team; `BoardItem.team` (`:101`) and `teamLine` (`:109`) replace `collaborators` and `authors`. `src/lib/state/boards/board/index.ts:18` re-exports `teamLine`. The new `src/lib/state/boards/board/team.ts` holds `teamOf` (lead then collaborators, each once), `selfIds` and `shownTeam` (the team without the person whose `self` is true). `items.ts:115` builds the tags from `shownTeam` with registry names, the key where the name is empty. `ProjectCard.svelte:386-389` draws the line only when it is not empty (its class is `team`); `Projects.svelte:225` fills the `authors` cell with it.
4. The readers of the team: listed in the next section.
5. The person picker:
   - `src/lib/state/forms/new-entry.ts:47` `freeKey` (the key from the words as a task's, cut at `TASK_KEY_MAX`, `-2`, `-3` while taken), `:58` `takenKeys`, shared with `taskFields`; `:152` `personToAdd` (the trimmed text when it gives a key and is the name or key of no person, compared without case; else ''); `:179` `addPerson` (the `new-entry` write of the people collection of the given hub, `{ key, name }`, the new key or the sentence to say).
   - `src/lib/state/forms/schema.ts:394` `picksPeople` (from is `people` alone, no literal options), `:403` `withPicked` (a select takes the key, a list appends it once).
   - `src/lib/ui/forms/choice/MultiSelect.svelte:57,90` and `Select.svelte:41` take an optional `extra` choice from the caller; `Select` draws a text box for the typed name when `extra` is given (161 lines). Neither knows of people.
   - `src/lib/views/shared/forms/entry/edit/FieldControl.svelte:60,74` (`onadd`, `addChoice`), `EntryForm.svelte:37,54` (`addPerson`, refusals drawn by `notesOf`), `Editor.svelte` (the project's hub, `rootOf(project)`) and `EntryEditor.svelte:115-117,194` (the entry's hub, else the primary).
   - `src/lib/views/system/workbench/editors/FieldControl.svelte:115-146`: the Settings `self` row offers Add person too, writing to the primary hub.
   - Catalog: `config/text/views/boards/editor.yml:4-7` (`add_person`, `add_person_collection`, `add_person_key`, `add_person_name`).
6. The portfolio chat: `src/lib/server/machine/pty/start/chat.ts:33` `userFor`, `:115` `const user = options.userFor?.() ?? words(catalog, 'server.chat.chat_user_fallback')`; `config/text/server.yml:60` `chat_user_fallback: its user` (the `chat_owner_fallback` key is gone); `src/lib/server/sessions/stores/hooks.ts:154` `selfName`; `src/routes/api/(sessions)/terminal/+server.ts:21` `userFor: () => selfName(server.hub)`; `normalise.ts:366` `person(entry, user)` with `:600` `const user = selfKey(merged)`; `validate.ts` `checkSelf`'s comment names "which person is the user"; `config/defaults/sources.yml:76` and `config/options/sources.yml:121` say "names them as its user". `config/options/sources.yml:108` is unchanged.
7. Fixtures and tests: the rows are in the section after next.
8. Documents:
   - `docs/HELP.md:275`: an Add person bullet under "Entries and their editor"; `:288`: a "A project's team" bullet (the team line, the Team tags and the Authors column without the person `self` names, no line for a team of only you, the Map toggle, the search).
   - `docs/data-map.md:124`: `lead: [people key]` before `collaborators`.
   - `docs/templates.md`: the project template's Core `lead: ""` and `authors: []` lines are gone; `:511` `# lead: []` in Connections.
   - `docs/apps.md:375`: `lead` beside `collaborators`, no `lead?`, no `authors?`; `:387` says `projectPerson` pairs a project with each person of its `lead` and its `collaborators`; `:389` lists `lead` among the fields holding resolved ids.
   - `docs/diagrams/`: `npm run diagrams` changed `layer-ui`, `layer-views` and `layers` (dot and svg each), 10 lines, import counts only.
9. Tests: G64 row 'a bare lead' and a new `it` for `lead: Faes` (J2); G56 row "a manifest's authors"; G32 referrers row 'a person a project names only as its lead'. Each ran on the unchanged tree first and failed:
   - 'a bare lead': `AssertionError: expected [] to deeply equal [ [ 'lead', ...(1) ] ]`
   - the `lead: Faes` test: the same message
   - "a manifest's authors": `expected [] to deeply equal [ [ 'authors', ...(1) ] ]`
   - the referrers row: `expected [] to deeply equal [ 'project:sketch' ]`

Size rule split: `src/lib/data/model/model-entities.ts` reached 883 lines with item 1, and `src/lib/data/model/index.ts` was 883 at base. The Recover wire shapes (`RecoverChecksum` to `RecoverLive`, what GET /api/recover answers and the `recover` channel pushes) moved to the new `src/lib/data/model/machine/model-recover.ts` (137 lines), re-exported from `index.ts:525` by `export type * from './machine/model-recover.ts'` in place of 13 names; `RecoverSource` stays with `Dataset`. model-entities.ts is now 747 lines, index.ts 872. `src/lib/data/model/` holds 10 items, `machine/` 5.

## Readers item 4 reaches, and what each reads now

| Reader | Reads now |
|---|---|
| `state/boards/board/items.ts:115,156` | card tags and line: `shownTeam`; search haystack: the whole `teamOf`, `self` included |
| `views/shared/card/project/CardLinks.svelte:40,76-79,116` | the kind `team`, label `project.card.team`, glyph `team_glyph`, tags `item.team`; a tag opens the Person view |
| `views/shared/card/card.ts:79` | `kind === 'team'` gives the group `person` |
| `state/boards/collection.ts:762` | a joint work's projects: `teamOf(project).includes(person)` |
| `state/boards/person.ts` (via `Person.projectIds`, filled from `projectPerson`) and `views/boards/person/Person.svelte` | projects whose lead or collaborators name the person; head comments and the `no_projects` text name the team |
| `state/boards/structure/graph.ts:148-159` | the Map's people option: a node and an edge per person of `shownTeam` |
| `views/structure/map/Controls.svelte` | the toggle label `map.collaborators` reads "+ team"; the head comment names the team. `Map.svelte` is unchanged: it passes the saved key `collaborators` through |
| `state/forms/referrers.ts:85` | lead, collaborators, waiting-on |
| `state/forms/schema.ts:355` | the form's `lead` value |
| `views/boards/projects/Projects.svelte:225` | the `authors` cell: `item.teamLine` |

`grep -rnE "collaborators|'lead'|\"lead\"" src --include='*.ts' --include='*.svelte'` lists no other reader of a project's team.

## Fixture and test rows changed (from `diff -u` against migration-O53-base)

| File | Old | New |
|---|---|---|
| tests/data/snapshot/normalise.test.ts (alpha) | `lead: 'Faes'`, `authors: ['Faes', 'Someone']` | `lead: ['someone']` |
| tests/data/snapshot/normalise.test.ts (beta) | `authors: 'Faes and others'` | (line removed) |
| tests/data/snapshot/normalise.test.ts (expected) | `lead: 'Faes'`, `authors: ['Faes', 'Someone']` | `lead: ['someone']` |
| tests/data/snapshot/references.test.ts:565 | `'  self: owner'` | `'  self: dana-example'` |
| tests/data/snapshot/references.test.ts:595, :600 | `named: ['owner']` | `named: ['dana-example']` |
| tests/fixtures/entities-fixture.ts | (no lead) | `lead: []` |
| tests/routes/sessions/terminal-actions.test.ts | `CHAT_CATALOG['server.chat.chat_owner_fallback']` | `CHAT_CATALOG['server.chat.chat_user_fallback']` |
| same | `toContain('research hub of its owner (oculus)')` | `toContain('research hub of its user (oculus)')` |
| same | `ownerFor: () => 'John Smith'` | `userFor: () => 'John Smith'` |
| same | `.not.toContain('its owner')` | `.not.toContain('its user')` |
| tests/state/forms/form-draft.test.ts:41 | `authors: ['Faes'],` | `lead: [],` |
| same, editDraft rows | field `'authors'`, `['Faes', 'Another']` / `['Faes']` | field `'lead'`, `['faes', 'another']` / `['faes']` |
| same, expected values and the saved draft | `authors: [...]`, `edits: { authors: ['Faes'] }` | `lead: [...]`, `edits: { lead: ['faes'] }` |
| tests/data/snapshot/relation-shapes.test.ts | - | row 'a bare lead'; the `lead: Faes` it |
| tests/data/snapshot/schema-rules.test.ts | - | row "a manifest's authors" |
| tests/state/forms/referrers.test.ts | - | project `sketch` with `lead: ['lena']` and its row |

Demo manifests (`tests/fixtures/hubs/demo/projects/**/project.yml`):

| Manifest | Old | New |
|---|---|---|
| graph-bandits, graph-transfer, demo-toolkit | `lead: A. Example`, `authors: [A. Example, B. Coauthor]` | `lead: [dana-example]`, `collaborators: [b-coauthor]` |
| sparse-attention, early-benchmark | `lead: A. Example`, `authors: [A. Example, C. Senior]` | `lead: [dana-example]`, `collaborators: [c-senior]` |
| spectral-clustering-collab | `lead: B. Colleague`, `authors: [B. Colleague, A. Example]` | `lead: [b-colleague]`, `collaborators: [dana-example]` |
| streaming-anomaly | `lead: A. Example`, `authors: [A. Example]` | `lead: [dana-example]` (its `collaborators: [rivera-lab]` kept) |
| failed-quantization, online-clustering, tensor-sketch, robust-embeddings | `lead: A. Example`, `authors: [A. Example]` | `lead: [dana-example]` |

Demo people.yml: the head comment is one line naming `lead:`, `collaborators:`, `waiting-on:` and "the user of a workspace that names them `self`"; key `owner` became `dana-example`; added `b-coauthor` (B. Coauthor), `c-senior` (C. Senior), `b-colleague` (B. Colleague), each with a `role:` line (J6).

`grep -rnE "self: *\"?owner|key: \"?owner\b|'owner'" tests` prints nothing.

## Cases after the change, beside the first run

Run by the same inline program over the changed demo hub (`line` is `item.teamLine`, `tags` `item.team`), plus calls of `personToAdd`, `addPerson` (with a recording write), `picksPeople` and `selfName`.

| Case | Before | After |
|---|---|---|
| C1 | line "", lead finding | line "Dr. Dana Example, Ana Rivera", no finding |
| C2 | line "", Map [Ana Rivera] | line "Ana Rivera", tags [Ana Rivera], Map people [B. Coauthor, C. Senior, Ana Rivera] (no Dana Example) |
| C3 | line "" | "B. Coauthor, C. Senior, Ana Rivera" |
| C4 | line "Faes", no finding | lead [], line "", one finding "lead: lead must be a list, not a string" |
| C5 | lead finding | lead [], line "", "lead[0] is nobody-here, which is not a key of people" |
| C6 | line "A. Example" | line "Dr. Dana Example, Ana Rivera", finding "key authors is not declared by the schema of this file" |
| C7 | no Add | `personToAdd('Jane Doe')` gives "Jane Doe"; `addPerson` writes `{ key: jane-doe, name: Jane Doe }` to people of `demo` and answers `jane-doe`; `withPicked` appends it; Save posts only the edits (`Editor.svelte:20-22,116,125`), so `lead: [jane-doe]` is written |
| C8 | no Add | "Ana Rivera" '', "riv" "riv", "ana rivera" '', "???" '', "rivera-lab" '' (matches are drawn by the existing filter; the Add follows them) |
| C9 | no Add | `addPerson('Jane Doe', ..., 'lab')` writes with root `lab` |
| C10 | no Add | manifest fields offering Add: [lead, collaborators]; `waiting-on` (`tags`, from people and projects) and `tags` false; joint-work `person` (`select, from: people`) true |
| C11 | [sparse-attention] | [early-benchmark, sparse-attention, tensor-sketch] (tensor-sketch named only by `lead: [c-senior]`) |
| C12 | [graph-transfer] | [demo-toolkit, graph-bandits, graph-transfer] (graph-bandits named only by `lead: [b-coauthor]`) |
| C13 | referrers [] | referrers [project:demo:spectral-clustering-collab]; after the delete lead [], "lead[0] is b-colleague, which is not a key of people" |
| C14 | "its owner" | `selfName` gives "Dr. Dana Example" with `self: dana-example` and null with `self` empty, so the instruction takes "its user" (G120 asserts 'research hub of its user (oculus)'); `grep -rniE "hub's owner" src config --exclude=local.yml` prints only `config/options/sources.yml:108` |
| C15 | line "" | "Ana Rivera" once |
| C16 | line "" | line "", tags [] |
| C17 | line "" | "noname" |
| C18 | no Add | Add not offered for "Ana Rivera"; with `jane-doe` held by "Someone Else" the write is `{ key: jane-doe-2, name: Jane Doe }` |
| C19 | lead finding | lead [lab:rivera-lab], line "Ana Rivera of lab" |
| C20 | formLead undefined | primary and lab project: formLead ["dana-example"], equal to the manifest's keys, so an unedited lead is not in the posted edits |
| C21 | line "" | lead [], line "", no finding |

C1, C2, C7, C8 and C10 on screen are the orchestrator's at landing; no page was run here.

## Verify lines, from the run after the last change

1. While working only covering files ran, among them: `npx vitest run` over relation-shapes, schema-rules, referrers, normalise, form-draft, references, terminal-actions, new-entry, rename, hub-portfolio, manifests, hub-writes, map-forces, board items, hub-facets, collections, boards (17 files, 288 tests, all passing; hub-portfolio and hub-writes timed out at 5 s under the parallel load and passed alone: 16 and 41 tests), and cycles, order, boundaries (passed alone: 7, 13, 11).
2. `npm run format` (no file outside the step changed), then `npm run diagrams && npm run test:quick`, exit 0:
   ```
   test:quick: 71 changed file(s), from git since HEAD
   test:quick: 281 test file(s)
   ok      ASCII gate (9.1 s)
   ok      svelte-kit sync (9.1 s)
   ok      prettier (9.2 s): All matched files use Prettier code style!
   ok      svelte-check (134.2 s): ... 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
   ok      eslint (185.4 s)
   ok      vitest checks (232.8 s)
   ok      vitest (282.8 s)
   ok      vitest slow (313.3 s)
   test:quick: 324.0 s; every command passed
   test:quick: not covered: tests that reach no changed file within the import depth,
               the build, the lint of unchanged files
   ```
   The list ran to completion twice: before and after the size-rule split of the model files, which the size check of verify 4 required. One earlier start was stopped by the pause. No whole-suite command ran (`npm test`, `test:landing`, `test:checks`, `test:slow` never).
3. ASCII gate over the 68 changed files other than the 3 svg files: prints nothing.
4. Sizes: no `src` file over 880, no component over 520 (`model/index.ts` 872, `model-entities.ts` 747, `machine/model-recover.ts` 137, workbench `FieldControl.svelte` 441, shared `FieldControl.svelte` 343, `MultiSelect.svelte` 282, `Select.svelte` 161, `new-entry.ts` 202, `team.ts` 32). Folders: `state/boards/board` 10, `data/model` 10, `data/model/machine` 5.
5. `sh utils/unused-exports.sh` against the base file: one changed line, line 126, `authorLine` replaced by `teamLine` in `src/lib/state/boards/board/index.ts`. The brief's item 3 asks for the re-export to follow the name, so the line is the base's line renamed; `teamLine` itself is read by `items.ts`.
6. `grep -rnE "\bauthors\b" ...` prints: `model-entities.ts:410` and `manifest-schema.yml:55` ("several for co-first authors", the lead's help); `model-search.ts:179` (a literature search hit); `RadarCard.svelte:7,104` (a Lit Watch paper); `FieldFilters.svelte:6` (the authors of a list of papers); `Projects.svelte:225` (the cell name `authors`). `grep -rnE "^(authors:|lead: [^\[])" tests/fixtures/hubs/demo` prints nothing.
7. `grep -rniE "owner" ...` prints the transcript stamps' owner (`stamps.ts:20,77`), a catalog file's owner (`normalise.ts:90`), a schema file's owner (`references/specs.ts:42-83`) and `config/options/sources.yml:108`; none other names a hub's owner.
8. The test rows are the table above.
9. The added comment lines and test titles grepped for `no longer|used to|was text|formerly|previously|now|renamed|migrat`: three hits, none history. `person.ts` "a person renamed in the registry is renamed on every surface" (a rename the user makes), and `MultiSelect.svelte`/`Select.svelte` "The caller's choice for what is typed now" (the present text of the box).

## Judgment calls

- J1. The cases were run by inline `node --input-type=module -` programs on the command line, with no file written. The brief allows no script without a ruling; this is the orchestrator's to accept or to rule against.
- J2. The `lead: Faes` row of item 9 is a separate `it` in `relation-shapes.test.ts`, not a row of the table: the type finding needs a people file that reads, and the table's planted hubs have none (with no people file a text value gives no finding).
- J3. `projectPerson` carries the lead pairs too; no new relation key. The lead keeps the manifest's order (its first person is the first author); collaborators keep the table's order.
- J4. Add person is also offered in the Settings `self` row (`workbench/editors/FieldControl.svelte`), writing to the primary hub, by decision 6 (every field whose options are people).
- J5. `Select.svelte` gains a text box for the typed name, since a select has no filter box to type into.
- J6. The new demo people carry `role:` lines written for them: b-coauthor "co-author (graph transfer, bandits and the toolkit)", c-senior "senior co-author (sparse attention, the early benchmark)", b-colleague "lead of the spectral clustering collaboration".
- J7. The Map's saved state key `collaborators` and the toggle's text key `map.collaborators` are kept (the key is saved per Map instance; its words read "+ team"). The graph's internal node kind `collaborator` is kept.
- J8. A Revert while an Add is in flight still picks the returned key into the field when the field is still drawn.
- J9. The card's authors line class is `team`, and the catalog key `project.card.author_glyph` is kept as the glyph of that line.
- J10. The size rule split moved the Recover wire shapes to `src/lib/data/model/machine/model-recover.ts`, a path the brief's list allows as "a file a split for the size rule makes". It touches `index.ts` and `model-entities.ts` on lines O61 may also write; the two re-export lines are the merge point.

Nothing in the brief was found wrong or impossible.


# Repair round 1

Every ruling of `agents/briefs/O53-round1.md` is DONE. Nothing is handed back.

Ruling 262 (a) replaces the round brief's ban on case-run programs. The case programs' sources and outputs are quoted at the end of this section, and J1 above is answered by that ruling.

## Rulings

1. DONE. `config/text/views/boards/person.yml:1` is now one line:
   ```
   -# Oculus text owned by the person view, the tab one human opens as. The view is opened from a
   -# person of a project card's team, a joint-work entry, the Map's node and a card of the People view, so its words
   -# name what the reader came from: the organisation, the joint work, the projects, the projects
   -# waiting on the person, a student's supervision folder and the editor of the registry entry.
   +# Oculus text owned by the person view, the tab one human opens as. The view is opened from a person of a project card's team, a joint-work entry, the Map's node and a card of the People view, so its words name what the reader came from: the organisation, the joint work, the projects, the projects waiting on the person, a student's supervision folder and the editor of the registry entry.
   ```
   Check: `sed -n 1,5p config/text/views/boards/person.yml` shows the comment on line 1 and `text:` on line 2. The ASCII gate passed in test:quick.
2. DONE. `src/lib/state/boards/board/index.ts`: the line `    teamLine,` is removed from the export list. `items.ts:21` imports `teamLine` from `./presets.ts`. Check: `sh utils/unused-exports.sh` (exit 0) compared with `migration-O53-base/unused-exports.txt` differs on line 126 only, where the base's `authorLine` is gone and no name is added:
   ```
   < src/lib/state/boards/board/index.ts: FACETS, NONE, authorLine, bucketOf, venueText, facetValues, facetHeading, filtersInForce, valueLabel, emptyBoardState
   > src/lib/state/boards/board/index.ts: FACETS, NONE, bucketOf, venueText, facetValues, facetHeading, filtersInForce, valueLabel, emptyBoardState
   ```
   No new line.
3. DONE.
   - `src/lib/views/shared/forms/entry/card/EntryFields.svelte:109`:
     - `/** One person as their own tab, the tab a collaborator tag on a project card opens. */`
     - becomes `/** One person as their own tab, the tab a person of a project card's team opens. */`
   - `src/lib/state/client/selectors.svelte.ts:443-446`:
     - "which projects name a funding scheme, a collaborator or an entry's `related:` id, which of them no scheme covers, and what each of them says about its own code."
     - becomes "which projects name a funding scheme or an entry's `related:` id, whose team holds a joint work's person, which of them no scheme covers, and what each of them says about its own code."
   - The grep `grep -rniE "collaborator" src docs` (.ts, .svelte, .md) found three more false comments. Each paragraph was rewrapped whole:
     - `src/lib/state/boards/structure/graph.ts:253-256`: "a line or a collaborator whose projects have all gone" becomes "a line or a person of a team whose projects have all gone". The node of the kind `collaborator` is any person of a team, the lead included.
     - `src/lib/views/shared/graph/Nodes.svelte:4-10`: "a square for a pillar or a collaborator" becomes "a square for a pillar or a person of a project's team". The paragraph's hard break after "The layer" went with the rewrap.
     - `src/lib/views/shared/graph/labels.ts:6-7`: "a pillar or a collaborator its square" becomes "a pillar or a person of a team its square".
   - The other hits are true and stay:
     - the `collaborators:` key and its readers;
     - `graph.ts:26`, which names the node kind `collaborator`;
     - `model-entities.ts:413` ("with the collaborators'");
     - the Map's saved `collaborators` option and its props;
     - `Graph.svelte` and `Nodes.svelte` CSS class names;
     - `docs` lines naming `collaborators:`.
   - `grep -rni "collaborator tag" src docs config --exclude=local.yml` prints nothing (exit 1).
4. DONE.
   - `src/lib/state/forms/new-entry.ts`: the line `    if (key === '') return { key: '', said: t('editor.add_person_key') };` is removed from `addPerson`. Its doc now says "`name` is the words `personToAdd` offered, which give a key" and "A hub with no people collection and a refusal of the write come back as the sentence to say".
   - `config/text/views/boards/editor.yml`: `add_person_key: 'The name gives no key: it needs a letter from A to Z or a digit.'` is removed.
   - Check: `grep -rn "add_person_key" src config tests docs` prints nothing. svelte-check, eslint and vitest checks are ok in test:quick.
5. DONE. A Revert or a Discard while an Add person write is out leaves the field as the Revert left it, and the person stays in the registry.
   - How the code knows the form was reverted: each editor that owns a Revert counts its Reverts, and the Add reads the count when the write is sent and again when it answers. A different count means a Revert came in between, and the answer is taken as no key and no sentence, so nothing is picked and no note is drawn.
   - The rule is one function, `unlessReverted(add, reverts)` in `src/lib/state/forms/new-entry.ts`:
     ```ts
     export function unlessReverted(
         add: (name: string) => Promise<PersonAdded>,
         reverts: () => number
     ): (name: string) => Promise<PersonAdded> {
         return async (name) => {
             const sent = reverts();
             const done = await add(name);
             return reverts() === sent ? done : { key: '', said: '' };
         };
     }
     ```
   - Its callers:
     - `src/lib/views/boards/editor/Editor.svelte`: `let reverts = 0;`, `revert()` does `reverts += 1;`, and `addTo(hub)` returns `unlessReverted((name) => addPerson(name, collectionsOfKey(PEOPLE), home, newEntry), () => reverts)`.
     - `src/lib/views/shared/forms/entry/edit/EntryEditor.svelte`: the same counter in `revert()`, and `newPerson` is `unlessReverted(...)`.
     - `src/lib/views/system/workbench/editors/Editor.svelte`: `let discards = $state(0)`, `discard()` does `discards += 1`, and `{discards}` is passed to `Cards.svelte`. Cards takes `discards?: number` and passes it to its nested Cards and to `FieldControl.svelte`.
     - The workbench `FieldControl.svelte` takes `discards = 0` and wraps its `addPerson` in `unlessReverted(..., () => discards)`. Its pick is now `else if (done.key !== '' && drawn)`, so an answer with no key picks nothing. A Settings row (`settings/Control.svelte`) writes a pick at once, has no draft and passes no `discards`.
   - A close of the form unmounts the field: the existing `drawn` flag of both FieldControl files (set false in the `$effect` teardown) keeps the answer from picking.
   - The head comments of `Editor.svelte`, `EntryEditor.svelte` and the workbench `FieldControl.svelte` say this.
   - Check: the case run R5 below. Reading: shared `FieldControl.svelte:86` picks only on `key !== '' && drawn`, and `EntryForm.svelte` records a note only when `said !== ''`.
6. DONE. "Before and after" gains the Person tab's empty sentence (`config/text/views/boards/person.yml:8`, key `person.nobody`, line 11 before ruling 1 joined the head comment):
   - before: "This tab was opened for nobody. Press a collaborator tag on a project card to open a person."
   - after: "This tab was opened for nobody. Press a person of the team on a project card to open a person."
7. DONE. Verify 9 again, with spec.md's whole history list ('before', 'used to', 'no longer', 'still', 'always has been', 'always had', 'as before', 'previously', 'the step adds', 'after this package lands'), plus package ids (`[OQD]` and digits) and dates.
   - Scope: every added comment line and test title of the step. That is the `diff` of each of the 65 files differing from the base copy, plus the new files `team.ts` and `model-recover.ts`. Twelve hits, none history; each names a moment inside one run, not an earlier state of the code:
     - `referrers.ts:5` "the question that asks before a delete": the order of a delete's question and the delete.
     - `MultiSelect.svelte` and `Select.svelte` "the box is emptied before it runs": the order inside one choice.
     - shared `FieldControl.svelte` "a field gone before it answers", "still drawn" (twice): the field at the time the write answers.
     - workbench `FieldControl.svelte` "a control gone before it answers", "discarded before it answers", "still drawn": the same.
     - `machine/model-recover.ts` "still needs", "the reading before", "null before one": moved text unchanged, about bytes still to fetch, the previous reading of a run and the state before the first answer.
   - No package id and no date.
8. DONE. After this round's last change: `npm run format`, then `npm run diagrams && npm run test:quick` ran once:
   ```
   test:quick: 80 changed file(s), from git since HEAD
   test:quick: 281 test file(s)
   ok      prettier (14.2 s): All matched files use Prettier code style!
   ok      ASCII gate (14.3 s)
   ok      svelte-kit sync (60.3 s)
   ok      svelte-check (155.4 s): ... 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
   ok      eslint (191.2 s)
   ok      vitest checks (244.5 s)
   FAILED  vitest (289.9 s)
    Test Files  2 failed | 210 passed | 60 skipped (272)
         Tests  2 failed | 2429 passed | 640 skipped (3071)
   ok      vitest slow (346.0 s)
   test:quick: 409.0 s; failed: vitest
   ```
   - The two red lines are timeouts at 5000 ms in files this step does not change:
     - `tests/server/edit/app-store.test.ts` "the first write, which makes the folder and the file private to the machine";
     - `tests/state/sources/clone-after.test.ts` "adds the folder to the workspace and keeps the others".
   - Each was rerun alone and passed: `npx vitest run tests/server/edit/app-store.test.ts` 15 passed; `npx vitest run tests/state/sources/clone-after.test.ts` 11 passed.
   - The list ran once in this round. No whole-suite command ran.
   - `npm run diagrams` leaves `docs/diagrams/` at the same 6 files, 10 lines (`git diff --stat -- docs/diagrams`).
   - Sizes after the round: workbench `FieldControl.svelte` 449, `Cards.svelte` 399, workbench `Editor.svelte` 242, `EntryEditor.svelte` 242, `boards/editor/Editor.svelte` 321, `new-entry.ts` 218, `Nodes.svelte` 129. All are under their limits.

## Each case, with what checks it

| Case | Checked by |
|---|---|
| C1 | case run (after: "Dr. Dana Example, Ana Rivera"); reading `team.ts:14`, `items.ts`, `presets.ts:378` |
| C2 | case run (line "Ana Rivera", Map without Dana Example); reading `team.ts:18-32`, `graph.ts:149` |
| C3 | case run ("B. Coauthor, C. Senior, Ana Rivera") |
| C4 | test: `relation-shapes.test.ts`, the `lead: Faes` it; case run |
| C5 | case run (reference finding, no name) |
| C6 | test: `schema-rules.test.ts` row "a manifest's authors"; case run |
| C7 | case run (`personToAdd`, `addPerson` write to demo, key `jane-doe`); reading `withPicked` (`schema.ts:403`), `Editor.svelte` posts only edits |
| C8 | case run (offers for "Jane Doe", "Ana Rivera", "riv", "ana rivera", "???", "rivera-lab") |
| C9 | case run (`addPerson(..., 'lab')` writes with root `lab`) |
| C10 | case run C10 (manifest fields offering Add: lead, collaborators; joint-work person true) |
| C11 | case run (tensor-sketch listed by its lead) |
| C12 | case run (graph-bandits listed by its lead) |
| C13 | test: `referrers.test.ts` row 'a person a project names only as its lead'; case run (referrer, then the reference finding) |
| C14 | test: `terminal-actions.test.ts` (G120) "research hub of its user (oculus)" and the `userFor` row; case run (`selfName`); grep `hub's owner` |
| C15 | case run ("Ana Rivera" once) |
| C16 | case run (line "", no tags) |
| C17 | case run ("noname") |
| C18 | case run (no Add for Ana Rivera; `jane-doe-2`) |
| C19 | case run ("Ana Rivera of lab": the lab registry's entry is named "Ana Rivera of lab" by the program's planted lab people file, so `personNames` gives that name) |
| C20 | case run (formLead ["dana-example"]); reading `Editor.svelte:20-22` (Save posts the map of edits) |
| C21 | case run (lead [], line "") |
| Ruling 5 | case run R5 |

The case runs' "after" outputs come from the run before this round's changes. This round changed no code path those cases print: `addPerson` lost a branch no caller reaches (a key from `personToAdd`'s words is never empty); the added `unlessReverted` wraps it; and the other edits are comments, a catalog line and the export list.

## Case-run programs and their output (ruling 262 (a))

Each program prints only and writes nothing into the step's diff. Each copies the demo hub into the scratchpad per case.

- The first run was taken from the worktree before any change, with `BASE` a copy of the base demo hub. To run it again, `cd` into `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O53-base` in place of the first `cd`, and set `BASE` to that folder's `tests/fixtures/hubs/demo`. `S` is any scratch folder.
- The after run reads the worktree's own demo hub.

### First run (on the unchanged tree)

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O53 && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && export S=/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o53 && export BASE=$S/base/demo && node --input-type=module - <<'EOF' 2>&1 | tee $S/first-run.txt
globalThis.$state = (v) => v; globalThis.$derived = (v) => v; globalThis.$effect = () => {};
const { cpSync, rmSync, writeFileSync, readFileSync, mkdirSync } = await import('node:fs');
const { join } = await import('node:path');
const { engineDir, loadConfig } = await import('./src/lib/data/sources/config.ts');
const { portfolioConfigFrom, readOtherHub } = await import('./src/lib/data/index.ts');
const { buildHubs } = await import('./src/lib/server/root/watch/build.ts');
const { createChecker } = await import('./src/lib/data/snapshot/schema/check.ts');
const { presetFor } = await import('./src/lib/state/boards/board/presets.ts');
const { boardItemFor } = await import('./src/lib/state/boards/board/items.ts');
const { personJoin } = await import('./src/lib/state/boards/person.ts');
const { crossLinks } = await import('./src/lib/state/boards/collection.ts');
const { buildGraph } = await import('./src/lib/state/boards/structure/graph.ts');
const { referrersOf } = await import('./src/lib/state/forms/referrers.ts');
const { fieldValues } = await import('./src/lib/state/forms/schema.ts');
const S = process.env.S, BASE = process.env.BASE;
const PEOPLE = (extra = '', drop = '') => readFileSync(join(BASE, '.oculus/data/people/people.yml'), 'utf8').split('\nentries:\n')[0] + '\nentries:\n' + [
  '  - { key: rivera-lab, name: Ana Rivera }', '  - { key: chen-graph, name: Wei Chen }',
  '  - { key: dana-example, name: Dr. Dana Example }', '  - { key: b-coauthor, name: B. Coauthor }',
  '  - { key: c-senior, name: C. Senior }', '  - { key: b-colleague, name: B. Colleague }', extra
].filter((l) => l !== '' && !(drop !== '' && l.includes(`key: ${drop},`))).join('\n') + '\n';
function manifest(dir, id, lines) {
  const file = join(dir, 'projects', id);
  const text = readFileSync(file, 'utf8').split('\n').filter((l) => !/^(lead|authors|collaborators):/.test(l));
  writeFileSync(file, [...text.filter((l) => l !== ''), ...lines, ''].join('\n'));
}
const SA = 'active/streaming-anomaly/project.yml';
function run(name, { self = '', edits = [], extra = '', drop = '', lab = null, joint = '' }) {
  const root = join(S, 'run', name); rmSync(root, { recursive: true, force: true });
  const demo = join(root, 'demo'); cpSync(BASE, demo, { recursive: true });
  writeFileSync(join(demo, '.oculus/data/people/people.yml'), PEOPLE(extra, drop));
  if (joint !== '') writeFileSync(join(demo, '.oculus/data/academic/joint-work.yml'), readFileSync(join(BASE, '.oculus/data/academic/joint-work.yml'), 'utf8') + joint);
  for (const [id, lines] of edits) manifest(demo, id, lines);
  const loaded = loadConfig(engineDir(), { hub: demo });
  const merged = { ...loaded.config, self };
  const portfolio = portfolioConfigFrom(merged, loaded.from);
  const others = [];
  if (lab !== null) {
    const dir = join(root, 'lab');
    mkdirSync(join(dir, '.oculus/data/people'), { recursive: true });
    mkdirSync(join(dir, 'projects/active/lab-proj'), { recursive: true });
    cpSync(join(BASE, '.oculus/config.yml'), join(dir, '.oculus/config.yml'));
    writeFileSync(join(dir, '.oculus/data/people/people.yml'), PEOPLE().split('\nentries:\n')[0] + '\nentries:\n  - { key: rivera-lab, name: Ana Rivera of lab }\n');
    writeFileSync(join(dir, 'projects/active/lab-proj/project.yml'), `id: lab-proj\ntier: projects\ntype: active\ntitle: Lab project\n${lab}\n`);
    others.push(readOtherHub({ key: 'lab', dir }, loadConfig(engineDir(), { hub: dir })));
  }
  const built = buildHubs({ primary: { key: 'demo', dir: demo, portfolio, workspace: null }, others, config: portfolio, order: ['demo', 'lab'] }, 0, createChecker(), null);
  return { snapshot: built.snapshot, merged };
}
function show(name, opts, id = 'demo:streaming-anomaly', more = () => ({})) {
  const { snapshot, merged } = run(name, opts);
  const p = snapshot.entities.projects[id];
  const item = boardItemFor(snapshot, p, presetFor('projects', merged));
  const findings = snapshot.findings.filter((f) => f.file.endsWith(id.split(':')[1] + '/project.yml')).map((f) => `${f.key}: ${f.message}`);
  const people = item.team ?? item.collaborators;
  console.log(JSON.stringify({ case: name, lead: p.lead, authors: p.authors, line: item.authors, tags: people.map((t) => t.label), findings, ...more(snapshot, merged, p) }));
}
const graph = (s, m) => ({ mapPeople: buildGraph(s, m, { collaborators: true }).nodes.filter((n) => n.kind === 'collaborator').map((n) => n.label) });
show('C1', { edits: [[SA, ['lead: [dana-example]', 'collaborators: [rivera-lab]']]] });
show('C2', { self: 'dana-example', edits: [[SA, ['lead: [dana-example]', 'collaborators: [rivera-lab]']]] }, undefined, graph);
show('C3', { edits: [[SA, ['lead: [b-coauthor, c-senior]', 'collaborators: [c-senior, rivera-lab]']]] });
show('C4', { edits: [[SA, ['lead: Faes']]] });
show('C5', { edits: [[SA, ['lead: [nobody-here]']]] });
show('C6', { edits: [[SA, ['authors: [A. Example]', 'lead: [dana-example]', 'collaborators: [rivera-lab]']]] });
show('C11', { edits: [['manuscripts/sparse-attention/project.yml', ['lead: [dana-example]', 'collaborators: [c-senior]']], ['ideas/tensor-sketch/project.yml', ['lead: [c-senior]']]] }, undefined, (s) => ({ personPage: personJoin(s, 'demo:c-senior').projects.map((x) => x.id) }));
show('C12', { joint: '\n  - key: "b-work"\n    title: "Work with B"\n    person: "b-coauthor"\n    status: "active"\n', edits: [['active/graph-transfer/project.yml', ['lead: [dana-example]', 'collaborators: [b-coauthor]']], ['active/graph-bandits/project.yml', ['lead: [b-coauthor]']]] }, undefined, (s, m) => {
  const entry = Object.values(s.entities.collections).find((c) => c.id.endsWith('joint-work')).entries.find((e) => e.id.endsWith('b-work'));
  return { jointWork: crossLinks(entry, 'joint-work', Object.values(s.entities.projects), Object.values(s.entities.people), m) };
});
show('C13', { edits: [['coauthor/spectral-clustering-collab/project.yml', ['lead: [b-colleague]']]] }, 'demo:spectral-clustering-collab', (s, m) => ({ referrers: referrersOf(s, m, 'people', 'demo:b-colleague').map((r) => `${r.kind}:${r.id}`) }));
show('C13-after-delete', { drop: 'b-colleague', edits: [['coauthor/spectral-clustering-collab/project.yml', ['lead: [b-colleague]']]] }, 'demo:spectral-clustering-collab');
show('C14-self', { self: 'dana-example' }, undefined, (s) => ({ selfPeople: Object.values(s.entities.people).filter((x) => x.self === true).map((x) => x.name) }));
show('C15', { edits: [[SA, ['lead: [rivera-lab]', 'collaborators: [rivera-lab]']]] });
show('C16', { self: 'dana-example', edits: [[SA, ['lead: [dana-example]']]] });
show('C17', { extra: "  - { key: noname, name: '' }", edits: [[SA, ['lead: [noname]']]] });
show('C19', { lab: 'lead: [rivera-lab]' }, 'lab:lab-proj');
show('C20-primary', { edits: [[SA, ['lead: [dana-example]']]] }, undefined, (s, m, p) => ({ formLead: fieldValues(p, () => false).lead }));
show('C20-lab', { lab: 'lead: [dana-example]' }, 'lab:lab-proj', (s, m, p) => ({ formLead: fieldValues(p, () => false).lead }));
show('C21', { edits: [[SA, []]] });
EOF
```

Output:

```
{"case":"C1","line":"","tags":["Ana Rivera"],"findings":["lead: lead must be a text or a number, not a list"]}
{"case":"C2","line":"","tags":["Ana Rivera"],"findings":["lead: lead must be a text or a number, not a list"],"mapPeople":["Ana Rivera"]}
{"case":"C3","line":"","tags":["C. Senior","Ana Rivera"],"findings":["lead: lead must be a text or a number, not a list"]}
{"case":"C4","lead":"Faes","line":"Faes","tags":[],"findings":[]}
{"case":"C5","line":"","tags":[],"findings":["lead: lead must be a text or a number, not a list"]}
{"case":"C6","authors":["A. Example"],"line":"A. Example","tags":["Ana Rivera"],"findings":["lead: lead must be a text or a number, not a list"]}
{"case":"C11","lead":"A. Example","authors":["A. Example"],"line":"A. Example","tags":["Ana Rivera"],"findings":[],"personPage":["demo:sparse-attention"]}
{"case":"C12","lead":"A. Example","authors":["A. Example"],"line":"A. Example","tags":["Ana Rivera"],"findings":[],"jointWork":[{"type":"work","count":1,"members":[{"id":"demo:graph-transfer","label":"Graph-Transfer","type":"active"}],"warn":false}]}
{"case":"C13","line":"","tags":[],"findings":["lead: lead must be a text or a number, not a list"],"referrers":[]}
{"case":"C13-after-delete","line":"","tags":[],"findings":["lead: lead must be a text or a number, not a list"]}
{"case":"C14-self","lead":"A. Example","authors":["A. Example"],"line":"A. Example","tags":["Ana Rivera"],"findings":[],"selfPeople":["Dr. Dana Example"]}
{"case":"C15","line":"","tags":["Ana Rivera"],"findings":["lead: lead must be a text or a number, not a list"]}
{"case":"C16","line":"","tags":[],"findings":["lead: lead must be a text or a number, not a list"]}
{"case":"C17","line":"","tags":[],"findings":["lead: lead must be a text or a number, not a list"]}
{"case":"C19","line":"","tags":[],"findings":["lead: lead must be a text or a number, not a list"]}
{"case":"C20-primary","line":"","tags":[],"findings":["lead: lead must be a text or a number, not a list"]}
{"case":"C20-lab","line":"","tags":[],"findings":["lead: lead must be a text or a number, not a list"]}
{"case":"C21","line":"","tags":[],"findings":[]}
```

### After run (on the changed tree)

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O53 && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && export S=/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o53 && export BASE=$PWD/tests/fixtures/hubs/demo && node --input-type=module - <<'EOF' 2>&1 | tee $S/after-run.txt
globalThis.$state = (v) => v; globalThis.$derived = (v) => v; globalThis.$effect = () => {};
const { cpSync, rmSync, writeFileSync, readFileSync, mkdirSync } = await import('node:fs');
const { join } = await import('node:path');
const yaml = (await import('yaml')).default;
const { engineDir, loadConfig } = await import('./src/lib/data/sources/config.ts');
const { portfolioConfigFrom, readOtherHub } = await import('./src/lib/data/index.ts');
const { buildHubs } = await import('./src/lib/server/root/watch/build.ts');
const { createChecker } = await import('./src/lib/data/snapshot/schema/check.ts');
const { presetFor } = await import('./src/lib/state/boards/board/presets.ts');
const { boardItemFor } = await import('./src/lib/state/boards/board/items.ts');
const { personJoin } = await import('./src/lib/state/boards/person.ts');
const { crossLinks } = await import('./src/lib/state/boards/collection.ts');
const { buildGraph } = await import('./src/lib/state/boards/structure/graph.ts');
const { referrersOf } = await import('./src/lib/state/forms/referrers.ts');
const { fieldValues, picksPeople } = await import('./src/lib/state/forms/schema.ts');
const { personToAdd, addPerson } = await import('./src/lib/state/forms/new-entry.ts');
const { selfName } = await import('./src/lib/server/sessions/stores/hooks.ts');
const { keyOf } = await import('./src/lib/data/helpers/hub-names.ts');
const S = process.env.S, BASE = process.env.BASE;
const PEOPLE = (extra = '', drop = '') => readFileSync(join(BASE, '.oculus/data/people/people.yml'), 'utf8').split('\nentries:\n')[0] + '\nentries:\n' + [
  '  - { key: rivera-lab, name: Ana Rivera }', '  - { key: chen-graph, name: Wei Chen }',
  '  - { key: dana-example, name: Dr. Dana Example }', '  - { key: b-coauthor, name: B. Coauthor }',
  '  - { key: c-senior, name: C. Senior }', '  - { key: b-colleague, name: B. Colleague }', extra
].filter((l) => l !== '' && !(drop !== '' && l.includes(`key: ${drop},`))).join('\n') + '\n';
function manifest(dir, id, lines) {
  const file = join(dir, 'projects', id);
  const text = readFileSync(file, 'utf8').split('\n').filter((l) => !/^(lead|authors|collaborators):/.test(l));
  writeFileSync(file, [...text.filter((l) => l !== ''), ...lines, ''].join('\n'));
}
const SA = 'active/streaming-anomaly/project.yml';
function run(name, { self = '', edits = [], extra = '', drop = '', lab = null, joint = '' }) {
  const root = join(S, 'run2', name); rmSync(root, { recursive: true, force: true });
  const demo = join(root, 'demo'); cpSync(BASE, demo, { recursive: true });
  writeFileSync(join(demo, '.oculus/data/people/people.yml'), PEOPLE(extra, drop));
  if (joint !== '') writeFileSync(join(demo, '.oculus/data/academic/joint-work.yml'), readFileSync(join(BASE, '.oculus/data/academic/joint-work.yml'), 'utf8') + joint);
  for (const [id, lines] of edits) manifest(demo, id, lines);
  const loaded = loadConfig(engineDir(), { hub: demo });
  const merged = { ...loaded.config, self };
  const portfolio = portfolioConfigFrom(merged, loaded.from);
  const others = [];
  if (lab !== null) {
    const dir = join(root, 'lab');
    mkdirSync(join(dir, '.oculus/data/people'), { recursive: true });
    mkdirSync(join(dir, 'projects/active/lab-proj'), { recursive: true });
    cpSync(join(BASE, '.oculus/config.yml'), join(dir, '.oculus/config.yml'));
    writeFileSync(join(dir, '.oculus/data/people/people.yml'), PEOPLE().split('\nentries:\n')[0] + '\nentries:\n  - { key: rivera-lab, name: Ana Rivera of lab }\n');
    writeFileSync(join(dir, 'projects/active/lab-proj/project.yml'), `id: lab-proj\ntier: projects\ntype: active\ntitle: Lab project\n${lab}\n`);
    others.push(readOtherHub({ key: 'lab', dir }, loadConfig(engineDir(), { hub: dir })));
  }
  const built = buildHubs({ primary: { key: 'demo', dir: demo, portfolio, workspace: null }, others, config: portfolio, order: ['demo', 'lab'] }, 0, createChecker(), null);
  return { snapshot: built.snapshot, merged };
}
function show(name, opts, id = 'demo:streaming-anomaly', more = () => ({})) {
  const { snapshot, merged } = run(name, opts);
  const p = snapshot.entities.projects[id];
  const item = boardItemFor(snapshot, p, presetFor('projects', merged));
  const findings = snapshot.findings.filter((f) => f.file.endsWith(id.split(':')[1] + '/project.yml')).map((f) => `${f.key}: ${f.message}`);
  console.log(JSON.stringify({ case: name, lead: p.lead, line: item.teamLine, tags: item.team.map((t) => t.label), findings, ...more(snapshot, merged, p) }));
}
const graph = (s, m) => ({ mapPeople: buildGraph(s, m, { collaborators: true }).nodes.filter((n) => n.kind === 'collaborator').map((n) => n.label) });
const peopleColl = (s) => Object.values(s.entities.collections).filter((c) => keyOf(c.id) === 'people');
const choices = (s) => Object.values(s.entities.people).map((p) => ({ id: keyOf(p.id), label: p.name }));
const writes = [];
const write = async (collection, fields, root) => { writes.push({ collection, fields, root }); return { ok: true, id: `${root}:${fields.key}`, refused: [] }; };
show('C1', { edits: [[SA, ['lead: [dana-example]', 'collaborators: [rivera-lab]']]] });
show('C2', { self: 'dana-example', edits: [[SA, ['lead: [dana-example]', 'collaborators: [rivera-lab]']]] }, undefined, graph);
show('C3', { edits: [[SA, ['lead: [b-coauthor, c-senior]', 'collaborators: [c-senior, rivera-lab]']]] });
show('C4', { edits: [[SA, ['lead: Faes']]] });
show('C5', { edits: [[SA, ['lead: [nobody-here]']]] });
show('C6', { edits: [[SA, ['authors: [A. Example]', 'lead: [dana-example]', 'collaborators: [rivera-lab]']]] });
show('C7-C8-C18', { extra: '  - { key: jane-doe, name: Someone Else }' }, undefined, (s) => {
  const people = choices(s);
  const offer = Object.fromEntries(['Jane Doe', 'Ana Rivera', 'riv', 'ana rivera', '???', 'rivera-lab'].map((typed) => [typed, personToAdd(typed, people)]));
  return { offer };
});
{
  const { snapshot } = run('C7-write', { extra: '  - { key: jane-doe, name: Someone Else }' });
  const added = await addPerson('Jane Doe', peopleColl(snapshot), 'demo', write);
  const { snapshot: s2 } = run('C7-free', {});
  const added2 = await addPerson('  Jane Doe ', peopleColl(s2), 'demo', write);
  const { snapshot: s3 } = run('C9', { lab: 'lead: [rivera-lab]' });
  const added3 = await addPerson('Jane Doe', peopleColl(s3), 'lab', write);
  console.log(JSON.stringify({ case: 'C7-C9-C18-add', jane_taken: added, jane_free: added2, lab: added3, writes }));
}
{
  const schema = yaml.parse(readFileSync('config/schemas/manifest-schema.yml', 'utf8'));
  const fields = Object.entries(schema.fields ?? schema).filter(([, v]) => v && typeof v === 'object' && 'type' in v);
  const offered = fields.filter(([, v]) => picksPeople({ from: v.from, options: v.options })).map(([k]) => k);
  const jw = yaml.parse(readFileSync(join(BASE, '.oculus/data/academic/joint-work.yml'), 'utf8'));
  const person = (jw.schema ?? []).find((f) => f.field === 'person');
  const waiting = fields.find(([k]) => k === 'waiting-on')?.[1];
  console.log(JSON.stringify({ case: 'C10', manifestFieldsOfferingAdd: offered, waitingOn: waiting, waitingOnOffers: waiting ? picksPeople({ from: waiting.from, options: waiting.options }) : null, jointWorkPerson: person, jointWorkPersonOffers: person ? picksPeople(person) : null }));
}
show('C11', { edits: [['ideas/tensor-sketch/project.yml', ['lead: [c-senior]']]] }, undefined, (s) => ({ personPage: personJoin(s, 'demo:c-senior').projects.map((x) => x.id) }));
show('C12', { joint: '\n  - key: "b-work"\n    title: "Work with B"\n    person: "b-coauthor"\n    status: "active"\n', edits: [['active/graph-bandits/project.yml', ['lead: [b-coauthor]']]] }, undefined, (s, m) => {
  const entry = Object.values(s.entities.collections).find((c) => c.id.endsWith('joint-work')).entries.find((e) => e.id.endsWith('b-work'));
  return { jointWork: crossLinks(entry, 'joint-work', Object.values(s.entities.projects), Object.values(s.entities.people), m).flatMap((g) => g.members.map((x) => x.id)) };
});
show('C13', {}, 'demo:spectral-clustering-collab', (s, m) => ({ referrers: referrersOf(s, m, 'people', 'demo:b-colleague').map((r) => `${r.kind}:${r.id}`) }));
show('C13-after-delete', { drop: 'b-colleague' }, 'demo:spectral-clustering-collab');
for (const self of ['dana-example', '']) {
  const { snapshot } = run(`C14-${self || 'empty'}`, { self });
  const hub = { latest: () => ({ payload: snapshot }), publish: () => 0 };
  console.log(JSON.stringify({ case: `C14-self-${self || 'empty'}`, selfName: selfName(hub) }));
}
show('C15', { edits: [[SA, ['lead: [rivera-lab]', 'collaborators: [rivera-lab]']]] });
show('C16', { self: 'dana-example', edits: [[SA, ['lead: [dana-example]']]] });
show('C17', { extra: "  - { key: noname, name: '' }", edits: [[SA, ['lead: [noname]']]] });
show('C19', { lab: 'lead: [rivera-lab]' }, 'lab:lab-proj', (s, m, p) => ({ leadIds: p.lead }));
show('C20-primary', { edits: [[SA, ['lead: [dana-example]']]] }, undefined, (s, m, p) => ({ formLead: fieldValues(p, () => false).lead }));
show('C20-lab', { lab: 'lead: [dana-example]' }, 'lab:lab-proj', (s, m, p) => ({ formLead: fieldValues(p, () => false).lead, leadIds: p.lead }));
show('C21', { edits: [[SA, []]] });
EOF
```

Output:

```
{"case":"C1","lead":["demo:dana-example"],"line":"Dr. Dana Example, Ana Rivera","tags":["Dr. Dana Example","Ana Rivera"],"findings":[]}
{"case":"C2","lead":["demo:dana-example"],"line":"Ana Rivera","tags":["Ana Rivera"],"findings":[],"mapPeople":["B. Coauthor","C. Senior","Ana Rivera"]}
{"case":"C3","lead":["demo:b-coauthor","demo:c-senior"],"line":"B. Coauthor, C. Senior, Ana Rivera","tags":["B. Coauthor","C. Senior","Ana Rivera"],"findings":[]}
{"case":"C4","lead":[],"line":"","tags":[],"findings":["lead: lead must be a list, not a string"]}
{"case":"C5","lead":[],"line":"","tags":[],"findings":["lead[0]: lead[0] is nobody-here, which is not a key of people"]}
{"case":"C6","lead":["demo:dana-example"],"line":"Dr. Dana Example, Ana Rivera","tags":["Dr. Dana Example","Ana Rivera"],"findings":["authors: key authors is not declared by the schema of this file"]}
{"case":"C7-C8-C18","lead":["demo:dana-example"],"line":"Dr. Dana Example, Ana Rivera","tags":["Dr. Dana Example","Ana Rivera"],"findings":[],"offer":{"Jane Doe":"Jane Doe","Ana Rivera":"","riv":"riv","ana rivera":"","???":"","rivera-lab":""}}
{"case":"C7-C9-C18-add","jane_taken":{"key":"jane-doe-2","said":""},"jane_free":{"key":"jane-doe","said":""},"lab":{"key":"jane-doe","said":""},"writes":[{"collection":"people","fields":{"key":"jane-doe-2","name":"Jane Doe"},"root":"demo"},{"collection":"people","fields":{"key":"jane-doe","name":"Jane Doe"},"root":"demo"},{"collection":"people","fields":{"key":"jane-doe","name":"Jane Doe"},"root":"lab"}]}
{"case":"C10","manifestFieldsOfferingAdd":[],"waitingOnOffers":null,"jointWorkPerson":{"field":"person","type":"select","from":"people","required":true,"help":"The person's key in the people registry."},"jointWorkPersonOffers":true}
{"case":"C11","lead":["demo:dana-example"],"line":"Dr. Dana Example, Ana Rivera","tags":["Dr. Dana Example","Ana Rivera"],"findings":[],"personPage":["demo:early-benchmark","demo:sparse-attention","demo:tensor-sketch"]}
{"case":"C12","lead":["demo:dana-example"],"line":"Dr. Dana Example, Ana Rivera","tags":["Dr. Dana Example","Ana Rivera"],"findings":[],"jointWork":["demo:demo-toolkit","demo:graph-bandits","demo:graph-transfer"]}
{"case":"C13","lead":["demo:b-colleague"],"line":"B. Colleague, Dr. Dana Example","tags":["B. Colleague","Dr. Dana Example"],"findings":[],"referrers":["project:demo:spectral-clustering-collab"]}
{"case":"C13-after-delete","lead":[],"line":"Dr. Dana Example","tags":["Dr. Dana Example"],"findings":["lead[0]: lead[0] is b-colleague, which is not a key of people"]}
{"case":"C14-self-dana-example","selfName":"Dr. Dana Example"}
{"case":"C14-self-empty","selfName":null}
{"case":"C15","lead":["demo:rivera-lab"],"line":"Ana Rivera","tags":["Ana Rivera"],"findings":[]}
{"case":"C16","lead":["demo:dana-example"],"line":"","tags":[],"findings":[]}
{"case":"C17","lead":["demo:noname"],"line":"noname","tags":["noname"],"findings":[]}
{"case":"C19","lead":["lab:rivera-lab"],"line":"Ana Rivera of lab","tags":["Ana Rivera of lab"],"findings":[],"leadIds":["lab:rivera-lab"]}
{"case":"C20-primary","lead":["demo:dana-example"],"line":"Dr. Dana Example","tags":["Dr. Dana Example"],"findings":[],"formLead":["dana-example"]}
{"case":"C20-lab","lead":["demo:dana-example"],"line":"Dr. Dana Example","tags":["Dr. Dana Example"],"findings":[],"formLead":["dana-example"],"leadIds":["demo:dana-example"]}
{"case":"C21","lead":[],"line":"","tags":[],"findings":[]}
```

### C10 run

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O53 && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && node --input-type=module - <<'EOF'
globalThis.$state = (v) => v; globalThis.$derived = (v) => v; globalThis.$effect = () => {};
const yaml = (await import('yaml')).default;
const { readFileSync } = await import('node:fs');
const { picksPeople } = await import('./src/lib/state/forms/schema.ts');
const s = yaml.parse(readFileSync('config/schemas/manifest-schema.yml', 'utf8')).manifest_schema;
const fields = Object.entries(s.fields);
console.log(JSON.stringify({ case: 'C10', offersAdd: fields.filter(([, v]) => picksPeople({ from: v.from, options: v.options })).map(([k]) => k), fromPeopleAtAll: fields.filter(([, v]) => [].concat(v.from ?? []).includes('people')).map(([k, v]) => `${k}:${v.type}`), tags: picksPeople({ from: s.fields.tags.from, options: s.fields.tags.options }) }));
EOF
```

Output:

```
{"case":"C10","offersAdd":["lead","collaborators"],"fromPeopleAtAll":["lead:chips","collaborators:chips","waiting-on:tags"],"tags":false}
```

### R5 run (ruling 5)

```
cd /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O53 && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && node --input-type=module - <<'EOF'
globalThis.$state = (v) => v; globalThis.$derived = (v) => v; globalThis.$effect = () => {};
const { unlessReverted, personToAdd } = await import('./src/lib/state/forms/new-entry.ts');
let reverts = 0;
const add = (revertWhileOut) => async (name) => {
  if (revertWhileOut) reverts += 1;
  return { key: name.toLowerCase().replace(/ /g, '-'), said: '' };
};
const kept = await unlessReverted(add(false), () => reverts)('Jane Doe');
const reverted = await unlessReverted(add(true), () => reverts)('Jane Doe');
const refused = await unlessReverted(async () => ({ key: '', said: 'refused' }), () => reverts)('Jane Doe');
console.log(JSON.stringify({ case: 'R5', noRevert: kept, revertWhileOut: reverted, refusedNoRevert: refused, keylessOffered: personToAdd('???', []) }));
EOF
```

Output:

```
{"case":"R5","noRevert":{"key":"jane-doe","said":""},"revertWhileOut":{"key":"","said":""},"refusedNoRevert":{"key":"","said":"refused"},"keylessOffered":""}
```
