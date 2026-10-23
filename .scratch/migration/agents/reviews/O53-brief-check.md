# Brief check of O53 (people relative to the user), main at 29dc034d plus the uncommitted brief

## 1. Names

Commands: `grep -rn --exclude=local.yml -E "(\.lead\b|\blead\?|\blead:|['\"]lead['\"])" src config tests README.md`, `grep -rn --exclude=local.yml -E "\bauthors\b|authorLine|authorsShape|\bAuthors\b" src config tests README.md DESIGN.md`, `grep -rn --exclude=local.yml -E "collaborators" src config tests README.md docs`, `grep -rn --exclude=local.yml -E "authorLine|ownerFor|ownerName|chat_owner_fallback|authorsShape|project\.card\.collaborators|map\.collaborators|no_projects" src config tests docs README.md`, `grep -rn -iE "\bowner('s)?\b" src config docs README.md --exclude=local.yml | grep -iE "hub|self|person|people|user|chat|research"`. There is no `DESIGN.md` at the oculus root (`ls DESIGN.md`: "No such file or directory").

These hits are outside "Paths this step writes":

- 1.1 `src/lib/state/boards/board/index.ts:12` re-exports `authorLine`. Item 3 renames that function, so this export breaks. The file is not in the list.
- 1.2 `src/lib/server/sessions/stores/hooks.ts:150-162`: `ownerName`, with the doc comment "payload marks `self: true`: the hub's owner". Item 6 ("No code or text calls that person the hub's owner") makes this false. The write list names "chat.ts and its caller that passes the name". That caller is `src/routes/api/(sessions)/terminal/+server.ts:21` (`ownerFor: () => ownerName(server.hub)`). `hooks.ts`, which makes the name, is not named.
- 1.3 Two catalog lines would contradict item 6 and ruling 209. Neither is in the list.
  - `config/defaults/sources.yml:76`: "...and the portfolio chat names them as the hub's owner."
  - `config/options/sources.yml:121` (the help of the `self` row) has the same words.
- 1.4 `config/options/sources.yml:108`: "The hub's owner writes the shipped folder" (the `apps_dir` help). This is not about the `self` person, so the change does not make it false. It still names a hub owner, which ruling 209 removes.
- 1.5 `tests/routes/sessions/terminal-actions.test.ts:548,579,586,591` is G120's test. It uses `ownerFor:` and `chat_owner_fallback`, and asserts `'research hub of its owner (oculus)'` and `.not.toContain('its owner')`. Item 6 makes these false. The file is not in the list, whose test clause covers only files that write `lead:` as text, `authors:` or the person key `owner`.
- 1.6 `tests/fixtures/entities-fixture.ts:36`: `fixtureProject` builds every field and has no `lead`. Once `lead` is a required `Id[]` (item 1), the fixture needs `lead: []`. It is not in the list.
- 1.7 Model doc comments outside the given ranges become false once a lead joins the person relation:
  - `src/lib/data/model/model-entities.ts:769`: "the entity a manifest's `collaborators:` ... name".
  - `model-entities.ts:801`: "Projects whose `collaborators:` name this person".
  - `src/lib/data/model/index.ts:197`: "A project and a person its `collaborators:` names".
  - The list gives `model-entities.ts` lines 340-420 only and does not name `index.ts`. `person.ts:81` reads `person.projectIds`, so item 4's Person page needs these fields to carry leads.
- 1.8 `src/lib/data/snapshot/normalise.ts:604` (`const owner = selfKey(merged)`) feeds the `owner` parameter that item 6 renames. It is outside the ranges 230-290 and 355-385.
- 1.9 `src/lib/views/shared/card/card.ts:79`: `if (kind === 'collaborators') return 'person'`. If item 4's team tags get a new group key, this breaks. It is not in the list.
- 1.10 Catalog lines not among the three named in the `config/text/` path:
  - `config/text/views/boards/person.yml:31` (`no_projects: No project names this person in its collaborators:`) becomes false under item 4.
  - `config/text/views/structure/map.yml:8` (`collaborators: + collaborators`) becomes false once the Map draws leads.
  - `config/text/views/boards/project.yml:48` (`project.card.collaborators`) is left with no reader once `CardLinks.svelte` draws a new key.
- 1.11 `docs/data-map.md:117-130`: the foreign-key list under `project.yml:` lists `collaborators` but not `lead`. Once `lead` is `from: people` the list is incomplete. Item 8 asks only to make existing sentences true, so it does not require adding the line.
- 1.12 Covered by the path clauses but not named, so a builder may miss them:
  - `tests/data/snapshot/normalise.test.ts:74,75,123,260,261` write `lead: 'Faes'`, `authors:` and the expected `lead: 'Faes'`. This is G32's 'fills a project from the manifest keys of the same meaning'. "Rewritten by the same rule" is undefined here, because this fixture's registry holds no person for `Faes`.
  - `tests/state/forms/form-draft.test.ts:41,141-164` has `authors` in a `Partial<Project>` literal and as a draft field name.
  - `tests/data/snapshot/references.test.ts:565,595,600` writes `self: owner`.
- 1.13 Hits that stay true:
  - `ProjectCard.svelte:21` ("the authors are names and stay words"; outside the 380-390 range).
  - `MultiSelect.svelte:7` (in the list).
  - `config/defaults/layout.yml:231,245,261,276,293` and `config/options/layout.yml:141`, the cell name `authors`.
  - The literature, radar and feeds `authors` hits.
  - `tests/fixtures/hubs/demo/.oculus/data/academic/joint-work.yml:3`.

## 2. The step line

The plan line (`plan.md:683`) and the rulings, each mapped to what the brief requires:

- "a project's `lead:` is a list of person keys" (205): item 1. "Several for co-first authors" is in item 1's help text and C3.
- "the hub's free-text values rewritten once" (205): the demo hub is item 7. **The real hub has no requirement in "What to build".** It appears only as a premise ("for the landing rewrite (read only, not this step's)"). Nothing says who maps the 20 distinct `lead:` texts to keys, or what becomes of a lead nobody in the registry holds ("Calvo Merino", "Sun", "Pirmani" and others). Nothing covers the co-first text `lead: Axel Faes & Jakob Nolte (co-first)`.
- "the views show a project's team ... without the workspace's `self`" (205, "Owner and self"): items 3 and 4, C2 and C16.
- "the portfolio chat names the person `self` names" (209): item 6 and C14.
- "no hub carries an owner key" (209): item 6 ("No owner key is added anywhere") plus the premise grep.
- 251, "person keys only; `authors:` leaves the schema": items 1, 2, 7 and C6.
- 251, "card's authors line and Authors column ... the lead first": item 3, C1 and C3.
- 251, "Add person <typed name> when the typed name matches nobody": item 5 and C7-C10, C18. C8 ("riv" offers Ana Rivera and "Add person riv") reads "matches nobody" as "no exact match". That reading is a decision, and "Decisions taken in this brief" does not list it.
- 251, "a paper's author list stays in its manuscript and on the website": no requirement, which fits since there is nothing to build.
- 254 (a) is summarised in the premises. The summary drops two parts of the ruling: "for each removed list the place its paper's author list is kept named" and "a list kept nowhere else shown to Axel before removal".
- 207 and 209's "Mine only" part belong to O55. The brief rightly carries none of them.
- `spec.md` requires "A step writes what a user does into `docs/HELP.md` as short bullets". Item 8 asks only to make existing sentences true, so no requirement adds a HELP bullet for Add person or for the team line without `self`. This is a rules-file requirement, so adding it does not widen the step.

## 3. Premises

Commands and results:

- `ls docs/adr`: "No such file or directory" (holds).
- `grep -n standards .scratch/migration/orchestrator-state.md`: `standards: [.scratch/migration/agents/spec.md]` (holds).
- `sed -n 30,60p config/schemas/manifest-schema.yml`: lines 38, 39 and 57 match.
- `model-entities.ts:354,356,416`, `normalise.ts:235,255,256,285`, `links.ts:72,162`, `merge.ts:147`, `validate.ts:104-111`, `referrers.ts:80`, `presets.ts:369-381`, `items.ts:76,134,136`, `ProjectCard.svelte:385-388`, `Projects.svelte:222`, `CardLinks.svelte:36,73-75`, `collection.ts:755-762`, `person.ts:3,25`, `Person.svelte:19`, `graph.ts:141-150`, `schema.ts:336-337,357`, `sources.yml:76-77`, `normalise.ts:360-381`, `validate.ts:299-315`, `chat.ts:28-32,114-115` and `server.yml:57-58`: all match.
- `layout.yml` cells at 231, 245, 261, 276, 293 and `options/layout.yml:141`: match.
- `MultiSelect.svelte` 255 lines, `FieldControl.svelte` 300, workbench `FieldControl.svelte` 379 (`wc -l`): match.
- `new-entry.ts:52-121`: match.
- Demo fixtures (`grep -rn -E "^(lead|authors|collaborators):" tests/fixtures/hubs/demo/projects`): eleven `lead:` lines, ten `A. Example` and one `B. Colleague`, and `collaborators: [rivera-lab]` (holds).
- Demo people registry: `rivera-lab`, `chen-graph`, `owner` (holds).
- `grep -n -E "^owner" ~/workspace/research-hub/.oculus/config.yml tests/fixtures/hubs/demo/.oculus/config.yml`: prints nothing, exit 1 (holds).

Premises that do not reproduce:

- 3.1 Hub count. From `~/workspace/research-hub`, `grep -rh --include=project.yml -E "^lead:" projects side-projects | sort | uniq -c` shows:
  - `"Faes"` 55, `Axel Faes` 16, `"Calvo Merino"` 3, and 20 other lines (17 distinct values). The brief says "84 manifests ... and 10 others".
  - `grep -rl ... "^lead:" | wc -l` prints 94.
  - `^authors:` gives 62 (holds).
- 3.2 The owner grep. The brief says `grep -rn -iE "\bowner\b" src config` "shows only window owners, file owners and the names above". It also shows:
  - `src/lib/server/sessions/stores/hooks.ts:151` ("the hub's owner", in `ownerName`);
  - `config/defaults/sources.yml:76` and `config/options/sources.yml:121` ("names them as the hub's owner");
  - `config/options/sources.yml:108` ("The hub's owner writes the shipped folder").
- 3.3 "`referrers.ts:80` ... which guards the person's deletion" is wrong.
  - `referrersOf` is read by `src/lib/views/shared/forms/entry/DeleteAsk.svelte:37`. That component only names the referrers in the Confirm detail (`t('entry_form.delete_used', ...)`) and deletes on yes (`remove()`).
  - The head comment says the references "stay in the files that hold them and show as findings".
  - `grep -rn "referrersOf" src` finds no refusal anywhere.
- 3.4 Guarded entries. The brief names G56, G64 and G120. These entries also name code this step changes:
  - G32: `src/lib/data/snapshot/`, `src/lib/data/model/`, `referrers.ts`, `schema.ts` (`fieldValues`). Its tests include `normalise.test.ts` 'fills a project from the manifest keys of the same meaning' and `referrers.test.ts` describe 'referrersOf'.
  - G8: `new-entry.test.ts` describe 'addTask'.
  - G66 and G67, the reference index and rename. These are derived from schema `from:` (`src/lib/data/snapshot/references/specs.ts:42-58`), so `lead` becomes a reference that a rename of a person key rewrites.
  - G15: `src/lib/data/snapshot/`.
  - Command: an awk over `guarded.md` Code lines.
- 3.5 O61's overlap. O61's write list (`sed -n '/## Paths this step writes/,/^## /p' .scratch/migration/agents/briefs/O61.md`) also holds paths O53 writes, which the premise does not name:
  - `presets.ts`, `collection.ts`, `structure/graph.ts`, `Projects.svelte`, `Controls.svelte`, `card.ts`, `new-entry.ts`, the whole `validate.ts`, and `config/text/`.
  - The state file's O53 block has no `shared_paths:` (`sed -n 56,58p orchestrator-state.md`).
- 3.6 The base copy `.agents/worktrees/migration-O53-base/` does not exist yet (`ls -d .agents/worktrees/migration-O53*`: no match). The brief says `/spec` makes it before the launch, so this is a precondition for the launch, not an error.

## 4. Cases and checks

- 4.1 C13 contradicts the code. Deleting a person is never refused (see 3.3). With correct code, the delete question names spectral-clustering-collab and the delete goes through on yes. As written, C13 either fails, or pushes the builder into a refusal that no ruling asks for, which would widen the step.
- 4.2 C10 against item 5:
  - Item 5 offers Add person in "every other schema field `from: people`", and decision 6 says "every field whose options come from `people`".
  - `waiting-on` is `from: [people, projects]` (`manifest-schema.yml:58`), yet C10 says it gets no Add choice. The brief does not settle this.
  - The joint-work `person` field is `type: select, from: people` (`tests/fixtures/hubs/demo/.oculus/data/academic/joint-work.yml:11`, and the same in the hub). Decision 6 covers it, but only `MultiSelect.svelte` is given the extra choice, and the select control `src/lib/ui/forms/choice/Select.svelte` is not in the write list. Narrowing item 5 to the chips fields keeps the paths. Covering select fields means adding `Select.svelte`, which widens the step's paths.
- 4.3 C18's "Add person Ana Rivera cannot arise" is false in one state. `MultiSelect.svelte:80-88` (`filtered`) removes already chosen values from the choices. With Ana Rivera already picked, typing "Ana Rivera" matches no choice, so the brief's rule offers Add and would write a duplicate `ana-rivera`.
- 4.4 Item 1 and C4 disagree.
  - Item 1 says `lead: Faes` gets "G64's one type finding ... and the reference finding". C4 says one type finding, and item 9's G64 row asserts exactly one finding (`relation-shapes.test.ts:62-76`, `toEqual([[field, sentence]])`).
  - My reading of `schema/check.ts`: a string at a list type fails ajv's `type` keyword before any item enum. That is a judgment, not run.
- 4.5 Item 9's key-maker table test has no entry in `guarded.md`. `spec.md` says "A test exists only as the test of one entry ... A builder writes no other test ... A step that needs a new entry stops and asks Axel".
  - `grep -n -o "[^;]*new-entry.test[^;]*" guarded.md` gives only "`:task-add`, `tests/state/forms/new-entry.test.ts`, describe 'addTask', every row" (G8).
  - The existing describe 'the task a title makes' is named under no entry.
  - The brief says the orchestrator names rows only in G56 and G64. The other new tests fit existing entries: the referrers row goes in describe 'referrersOf' "every row" (G32), and the G56 row goes in the existing table 'gives the one finding of a key no schema declares for $name' (`schema-rules.test.ts:189-228`).
- 4.6 The rules file says "A builder runs no page". C1, C2, C7, C8, C10 and C16 are drawn or pressed. "The first run of every case above on the unchanged tree" can only be a reading for them. The brief allows that ("or, for what is drawn, by reading the code path"), so this holds.
- 4.7 Cases that make the builder check a place the step does not change:
  - C5's reference finding comes from `schema/check.ts`, which is unchanged.
  - C9's routing ends in the server's `new-entry` write (`src/lib/server/edit/writes.ts:613`), which is unchanged.
  - C13 reads `DeleteAsk.svelte`, which is unchanged.
  - C14 with `self` set reads `hooks.ts` `ownerName`, which is not in the list.

## 5. The question

Each case, check and item, asked whether it could pass without the goal being reached:

- C1: yes. With `self` empty it does not test leaving out the user; it only tests names and order.
- C2: no for the line, the tags and the Map. It does not cover the search haystack, where item 4 does not say whether `self` is left out.
- C3, C15, C17, C19: no. Each checks one rule of the team line.
- C4: yes. A grep for a text reader passes even if the form still writes a non-key (see 6.f).
- C5, C6: no.
- C7: yes. It passes if the person lands in the wrong hub; C9 covers that. It also passes if the form's `lead` value carries hub ids (6.f).
- C8: no as written. Its "riv" row fixes a reading of "matches nobody" that is not booked as a decision.
- C9, C10, C11, C12: no. C10 is ambiguous (4.2).
- C13: it cannot pass on correct code (4.1).
- C14: no for the chat words. It passes while `hooks.ts` and the two `sources.yml` lines still say "owner".
- C16: no.
- C18: yes. It passes while the already-chosen state still creates duplicates (4.3).
- Verify 6: yes. It greps only `src/lib/data`, `src/lib/state/boards`, `src/lib/state/forms`, card, boards and `config/schemas`, so `tests/fixtures/entities-fixture.ts` and `form-draft.test.ts` are not reached. The type check catches those.
- Verify 7: yes. It greps `src/lib/server/machine/pty`, `src/lib/data/snapshot`, `config/text/server.yml` and the demo `.oculus`. It misses `src/lib/server/sessions/stores/hooks.ts:151`, `config/defaults/sources.yml:76`, `config/options/sources.yml:121` and `tests/routes/sessions/terminal-actions.test.ts:579,591`, so item 6 can pass with owner wording left.
- Items 1-2: yes. Nothing requires the form value `lead: project.lead.map(keyOf)`.
- Item 3: no.
- Item 4: yes. The Person page passes only if `Person.projectIds` holds leads, and the docs saying so are outside the paths (1.7).
- Item 5: yes. The refusal must be shown "where the field says its errors", which is `EntryForm.svelte`'s `notesOf` (`EntryForm.svelte:47-56`). `FieldControl.svelte` has neither the record's hub nor a write (props at `:41-48`). The handler and the hub must come through `EntryForm.svelte`, `src/lib/views/boards/editor/Editor.svelte` and `EntryEditor.svelte`, none of which is in the list.
- Item 6: yes (see Verify 7).
- Item 7: no.
- Item 8: yes. A HELP bullet is not required, and `data-map.md` lacks `lead` (1.11).
- Item 9: no for its rows. The key-maker test lacks an entry (4.5).

## 6. Implied inputs

- a. Empty lists, `lead: []` and no collaborators, give no line. A manifest with no `lead:` reads as `[]`; 19 of the hub's 113 have none, by the 3.1 counts. No case covers this, but the cost is low.
- b. A key in two hubs: C19 covers resolution. Not covered: a second hub that holds a person under the `self` key. Each hub's `person()` gets `selfKey(merged)` (`normalise.ts:604-605`), so that person may also carry `self: true` and be dropped from the line (not verified). Expected: only the person the primary hub's registry holds under that key is the user. Missing; the cost is a different person hidden.
- c. A person with no name: C17.
- d. The deleted person: C13 states the wrong result. Expected: the question names the referring project, the delete proceeds, and `lead: [b-colleague]` becomes a reference finding.
- e. Typed names (missing):
  - A name already chosen in the field offers Add and creates a duplicate (4.3). Expected: no Add.
  - The same name in another case ("ana rivera"): is that a match?
  - A name with no ASCII letter (Chinese or Greek) offers no Add, so such a person cannot be added from the picker. This is a user-visible limit, not listed among the decisions.
  - YAML-special characters ("O'Brien: Jr", "#"): expected to be written quoted and read back. Low cost, given the write re-parses.
  - The 80-character cut `TASK_KEY_MAX` (`new-entry.ts:19`): does it apply to person keys?
- f. The form's save path for `lead` (missing). Choices are bare keys (`schema.ts:206-228`, `recordChoices`), and `collaborators` is mapped with `keyOf` (`schema.ts:357`). If `lead` is not mapped the same way, the field shows hub ids as unknown chips, and a save could write `hub:dana-example`. Expected: opening a primary or lab project's form and saving another field leaves `lead:` byte-identical. The cost is corrupted manifests.
- g. Other readers. None beyond those named reads `lead`, `authors` or `collaborators` (greps in section 1). Not named: the export in `board/index.ts`, `card.ts:79` and `hooks.ts` `ownerName`.
- h. Asynchronous Add (missing). `spec.md` requires every asynchronous path to be stated, and none is: the picker or form closed while the write is in flight; a second Add before the first answers (duplicate `-2`); a form draft discarded after Add, which leaves the new person in the registry. That last one is a user-visible outcome no decision names.
- i. The chip before the snapshot holds the new person shows the key, because `wordsOf` falls back to the id (`MultiSelect.svelte:101-103`). Low cost.
- j. Which fields get Add: `waiting-on` and select fields (4.2).
- k. The landing rewrite of the hub: lead texts naming no registry person, and the co-first text (2, 3.1). This is the landing's work, but nothing in the brief carries it.
- l. Renaming a person key now also rewrites `lead:` (G67, by schema derivation). There is no case. Low cost, since the existing rename tests run under G67.

## 7. ADRs

There is no ADR folder (`ls docs/adr`: "No such file or directory"), so no ADR applies.

## 8. Dictated text

- `grep -n -F 'its label "Lead"' .scratch/migration/agents/briefs/O53.md` gives 28. "Lead": holds.
- `grep -n -F '"Add person <typed text>"'` gives 32. "Add person <typed text>": holds. As a catalog line it becomes `Add person {0}`.
- `grep -n -F 'its words "its user"'` gives 33 and 98. "its user": holds. The instruction then reads "research hub of its user (oculus)".
- `grep -n -F 'the user of a workspace that names them'` gives 34. "the user of a workspace that names them `self`": holds. Wrapping is a separate matter. The people.yml head comment is hard-wrapped now. `spec.md` says "One line per paragraph or bullet in any Markdown or YAML you edit", while the brief's Conventions say "a comment edited is rewrapped as a whole paragraph at 100 columns". For a YAML comment the two rules give different results; the brief should name one.
- `grep -n -F 'name "Dr. Dana Example"'` gives 34. `dana-example`, "Dr. Dana Example": holds.
- `grep -n -F 'b-coauthor\` (B. Coauthor)'` gives 34. `b-coauthor` (B. Coauthor), `c-senior` (C. Senior), `b-colleague` (B. Colleague): holds.
- Line 34 also holds `lead: [dana-example]` and `lead: [b-colleague]`: holds.
- `grep -n -F "the row 'a bare lead'"` gives 36. 'a bare lead': holds.
- `grep -n -F 'gives \`jane-doe\`'` gives 36. The key rows `jane-doe`, `stephanie-van-den-berg`, `jane-doe-2`: hold. The e acute must be written as `<latin small letter e with acute>` in the test source, as `new-entry.test.ts` does with 'Caf<latin small letter e with acute>'. The ASCII gate exempts only `config/` and `tests/fixtures/`.
- `grep -n -F '\`lead?\` becomes \`lead\`'` gives 35. `lead`, with `authors?` removed: holds.

## Declined to judge

- Whether `lead: Faes` gives a reference finding as well as the type finding. I judged it from reading `schema/check.ts` and ajv's keyword order, without a run.
- Whether a second hub's build receives the workspace `self`, and so marks a person `self: true` (6.b). I traced `selfKey(merged)` only to `normalise.ts:604`.
- Decision 4's claim that "the key can be changed on the person's page". I did not trace whether the Person page's entry editor renames references. F2 does (`docs/HELP.md:391`).
- Whether merging O61 and O53 is simple. That is the orchestrator's call under `shared_paths`.
- Whether `npm run test:quick` fails on the orphan catalog key of 1.10. Not run, since the brief check runs no suite.
- The real hub's contents beyond the two grep counts. `config/local.yml` was not opened.


## Closed

Every finding corrects the brief inside the step's line (rulings 205, 209, 251, 254 and spec.md), so each is closed in `agents/briefs/O53.md`; none is raised as an open item.

- 1.1, 1.6, 1.7, 1.8, 1.9: the files and ranges are added to "Paths this step writes" and named under "What is on the tree"; items 1, 3, 4 and 7 say what each must hold.
- 1.2, 1.3, 1.5, 3.2: item 6 names `hooks.ts` `ownerName`, its caller in `src/routes/api/(sessions)/terminal/+server.ts`, the two `sources.yml` lines and G120's test; the paths are added; Verify 7 and C14 reach them.
- 1.4: no change. `config/options/sources.yml:108` names who installs apps, not the `self` person; item 6 says it stays.
- 1.10: items 4 name `no_projects`, the Map's `collaborators` word and the removal of `project.card.collaborators` once nothing reads it.
- 1.11 and the HELP bullet of 2: item 8 adds `lead` to `docs/data-map.md`'s foreign keys and asks for the HELP.md bullets spec.md requires.
- 1.12: item 7 names each test file and gives the G32 fixture's rewrite (`lead: ['someone']`, the person its registry holds).
- 2, the hub's `lead:` texts: the premise states the landing rewrite of rulings 205 and 254, a lead no registry person holds shown to Axel with the diff; the builder does none of it. The two dropped parts of 254 (a) are restored in the premise.
- 2, C8's reading of "matches nobody": booked as decision 9.
- 3.1: the counts corrected (94 manifests).
- 3.3 and 4.1: the premise says `referrersOf` only names the referrers in the delete question; C13 rewritten to the delete going through.
- 3.4: G32, G8, G15, G66 and G67 named; item 9's rows go under G32, G56 and G64.
- 3.5: O61's and O56's shared files named; `shared_paths` written in the state file.
- 3.6: no change; `/spec` makes the base copy before the launch.
- 4.2 and 6.j: item 5 covers `from: people` alone, `MultiSelect.svelte` and `Select.svelte` (the joint-work `person`); `waiting-on` keeps its free text; C10 says both.
- 4.3: item 5 and C18 compare against every person of the registry, those chosen included.
- 4.4: item 1 and C4 say one type finding, the builder's first run settling it.
- 4.5: the key-maker table is dropped. The server refuses a key the registry holds (`src/lib/server/edit/writes/entries.ts:557-561`), so a wrong key loses nothing and the test rule keeps no test; C18 is a quoted run. The referrers and G56 rows go in existing tables of G32 and G56.
- 4.6: no change.
- 4.7: C13 rewritten; C14's place is now in the paths; C5 and C9 check what the schema line and the client's hub choice change.
- 5, Items 1-2 and 6.f: item 1 asks for `lead: project.lead.map(keyOf)`; C20 added.
- 5, Item 5: the handler's path through `Editor.svelte`, `EntryEditor.svelte` and `EntryForm.svelte` is in item 5 and the paths.
- 6.a: C21 added. 6.b: decision 13. 6.e: decisions 9 and 10, `TASK_KEY_MAX` in item 5. 6.h: item 5 states the write in flight and a form closed after Add. 6.i: decision 11. 6.l: G67 named.
- 8: the Conventions name one rule per kind of text (a code comment rewrapped at 100 columns; a YAML comment one line). The e acute row went with the key-maker table.

Usage: a778b73d30beb0302, claude-opus-5-5, 254814 tokens, 101 tool uses, 11 min 49 s
