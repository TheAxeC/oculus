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
