# Step O53 refuter report (on .agents/worktrees/migration-O53, base 74020bf0)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
# Brief item 1 (only covering test files while working): not rerunnable after the fact; see Declined to judge.

# Brief item 2, run alone in the foreground over the 71 changed paths (git status --short less .scratch/),
# `npm run format` and `npm run diagrams` not run because they write:
npm run test:quick -- <the 71 changed paths>
  first run (output kept only by `| tail -40`):
    FAIL |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > holds every record of both hubs, each under the name of its hub's folder
    Error: Test timed out in 20000ms.
    FAIL |unit| tests/data/hubs/hub-portfolio.test.ts > a workspace of several hubs, every record under its hub and its key > finds the page of an entry of the one hub that holds it and writes that hub's file (C6)
    Error: Test timed out in 20000ms.
     Test Files  2 failed | 73 passed (75)
          Tests  2 failed | 621 passed | 211 skipped (834)
    test:quick: 616.3 s; failed: vitest slow
  hub-portfolio.test.ts rerun alone:
    npx vitest run tests/data/hubs/hub-portfolio.test.ts --tagsFilter slow --testTimeout 20000
      Tests  1 failed | 15 passed (16)   (which test failed was not captured)
    the same command with --reporter verbose:
      Test Files  1 passed (1)
           Tests  16 passed (16)   (each test 1.2 s to 2.1 s)
  second run of the list, whole output kept:
    test:quick: 71 changed file(s), from the given paths
    test:quick: 281 test file(s)
    ok      ASCII gate (0.5 s)
    ok      prettier (0.7 s): All matched files use Prettier code style!
    ok      svelte-kit sync (9.5 s)
    ok      eslint (46.1 s)
    ok      svelte-check (53.5 s): 1792749138121 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
    ok      vitest checks (111.0 s)
    ok      vitest (131.2 s)
    ok      vitest slow (174.0 s)
    test:quick: 183.5 s; every command passed

# Brief item 3, ASCII gate over the 71 changed files and the report:
LC_ALL=C perl -ne '...' <each changed file>      -> prints nothing

# Brief item 4, wc -l (limits 880, component 520) and folder counts:
model/index.ts 872, model-entities.ts 747, machine/model-recover.ts 137, board/team.ts 32, new-entry.ts 202,
presets.ts 400, items.ts 223, MultiSelect.svelte 282, Select.svelte 161, Editor.svelte 313, EntryEditor.svelte 231,
EntryForm.svelte 106, forms FieldControl.svelte 343, workbench FieldControl.svelte 441; no src file over its limit
(docs/templates.md 1314, a document, outside the size rule's source files);
ls: data/model/machine 5, data/model 10, state/boards/board 10

# Brief item 5:
sh utils/unused-exports.sh   (exit 0) ; diff against migration-O53-base/unused-exports.txt:
126c126
< src/lib/state/boards/board/index.ts: FACETS, NONE, authorLine, bucketOf, venueText, facetValues, facetHeading, filtersInForce, valueLabel, emptyBoardState
---
> src/lib/state/boards/board/index.ts: FACETS, NONE, bucketOf, teamLine, venueText, facetValues, facetHeading, filtersInForce, valueLabel, emptyBoardState

# Brief item 6:
grep -rnE "\bauthors\b" src/lib/data src/lib/state/boards src/lib/state/forms src/lib/views/shared/card src/lib/views/boards config/schemas
  src/lib/data/model/model-search.ts:179 (literature hit), model-entities.ts:410 ("co-first authors"),
  RadarCard.svelte:7,104 (radar paper), FieldFilters.svelte:6 (a list of papers), Projects.svelte:225 (cell name),
  manifest-schema.yml:55 ("co-first authors")
grep -rnE "^(authors:|lead: [^\[])" tests/fixtures/hubs/demo   -> prints nothing, exit 1

# Brief item 7:
grep -rniE "owner" src/lib/server/machine/pty src/lib/server/sessions src/lib/data/snapshot src/routes/api config/text/server.yml config/defaults/sources.yml config/options/sources.yml tests/fixtures/hubs/demo/.oculus tests/routes/sessions
  stamps.ts:20,77 (a sessions watch's owner), normalise.ts:90 (a catalog file's owner), references/specs.ts:42-83 (a schema file's owner),
  config/options/sources.yml:108 (apps_dir help); nothing else names a hub's owner

# Brief item 8: diff of each changed test file against migration-O53-base, assertion lines:
references.test.ts   named: ['owner'] -> named: ['dana-example'] (two rows)
relation-shapes.test.ts  two new expect lines (the new it)
terminal-actions.test.ts  toContain('research hub of its owner (oculus)') -> toContain('research hub of its user (oculus)');
                          not.toContain('its owner') -> not.toContain('its user')
normalise.test.ts  expected lead: 'Faes', authors: [...] -> lead: ['someone'];  form-draft.test.ts  authors -> lead rows
(matches the report's table)

# Brief item 9, the history word list of spec.md "What every package obeys" over added comment lines and test titles:
11 hits, all of a moment inside a run, none comparing with an earlier state of the code:
referrers.ts:3 "asks before a delete"; MultiSelect.svelte, Select.svelte "the box is emptied before it runs";
forms FieldControl.svelte "a field gone before it answers", "still drawn" (two); workbench FieldControl.svelte
"a control gone before it answers", "still drawn"; model-recover.ts "still needs", "the reading before", "null before one" (moved text)

# Commands the builder's report quotes, rerun:
grep -rniE "hub's owner" src config --exclude=local.yml
  config/options/sources.yml:108 only
grep -rnE "self: *\"?owner|key: \"?owner\b|'owner'" tests   -> prints nothing, exit 1
grep -rnE "collaborators|'lead'|\"lead\"" src --include='*.ts' --include='*.svelte'
  67 lines in 32 files; the project-team readers are the files the report's table lists; the rest are position leads,
  CSS classes and snippets named lead, and the Map's saved `collaborators` option
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `manifest-schema.yml:55` `lead: { label: "Lead", type: chips, from: people, section: Connections, ... }`; `model-entities.ts:415` `lead: Id[]`; `normalise.ts:280` `lead: strings(manifest.lead)` (`strings` returns [] for a non-array, `guards.ts:70-73`, so no code reads a text lead); `links.ts:75,166-168`; `merge.ts:147`; `validate.ts:109`; `referrers.ts:85`; `schema.ts:355`; doc comments at `model-entities.ts:637,669`, `index.ts:197`. J10: no item of "What to build" names `model-recover.ts`; the split is asked by spec.md's size rule ("A file the step changes that would pass 880 ... is split by concern in the step") and allowed by the brief's path line "a file a split for the size rule makes". It is needed: `git show 74020bf0:src/lib/data/model/model-entities.ts | wc -l` gives 878, the moved block is 136 lines, so item 1's edits without the split give 747 + 136 = 883; `index.ts` was 883 at base and is a file item 1 changes (`:197`). The moved block is one concern (the Recover wire shapes) and its text is unchanged apart from the head comment.
- 2: holds. `authors` gone from the schema, the model, `normalise.ts`, `presets.ts` and `schema.ts`; the G56 row passes in the second test:quick run.
- 3: holds. `presets.ts:378` `teamLine`, `team.ts` (`teamOf`, `selfIds`, `shownTeam`), `items.ts:145-158`, `ProjectCard.svelte:386-389`, `Projects.svelte:225`, `index.ts:18`. The kept re-export is Standards 2.
- 4: holds. `items.ts` (tags from `shownTeam`, haystack from `teamOf`), `CardLinks.svelte` (kind `team`, `project.card.team`; `project.card.collaborators` and `collaborator_glyph` removed), `card.ts:79`, `collection.ts:762`, `Person.projectIds` through `projectPerson` (`links.ts:75,184`), `graph.ts:148`, catalog lines `person.yml:31`, `map.yml:8`. Two comments outside the changed readers are left false: Standards 3.
- 5: holds. `new-entry.ts` `freeKey` shared with `taskFields`, `personToAdd`, `addPerson`; `schema.ts` `picksPeople`, `withPicked`; `MultiSelect.svelte` and `Select.svelte` take `extra` from the caller; the hub and the handler reach the field from `Editor.svelte:258` and `EntryEditor.svelte` through `EntryForm.svelte` and `FieldControl.svelte`; a refusal is drawn by `notesOf` (`EntryForm.svelte`); `adding` hides the choice while the write is out. The unreachable keyless branch is Standards 4.
- 6: holds. `chat.ts:33,115` `userFor`, `user`, `chat_user_fallback: its user` (`server.yml:60`); `hooks.ts` `selfName`; `+server.ts:21`; `normalise.ts:366,600`; `validate.ts` `checkSelf` comment; `sources.yml` lines; G120 test follows; `config/options/sources.yml:108` unchanged.
- 7: holds. Demo people `dana-example`, `b-coauthor`, `c-senior`, `b-colleague`, the people.yml head comment one line; eleven demo manifests as the item lists; `entities-fixture.ts` `lead: []`; `normalise.test.ts`, `form-draft.test.ts`, `references.test.ts` rewritten; my greps find no text `lead:`, project `authors:` or person key `owner` left in tests.
- 8: holds. `HELP.md:275,288`, `data-map.md:124`, `templates.md:511`, `apps.md:375,387,389`; `docs/diagrams/` changed in three dot/svg pairs (not regenerated by me, see Declined to judge).
- 9: holds. Row 'a bare lead' in 'gives one finding for $row'; the `lead: Faes` case as its own `it` (J2 is right: `validate.ts:120-135` reports a non-list only for `waiting-on` when the source did not read, so in the table's hubs, which have no people file, a text `lead` gives no finding); G56 row "a manifest's authors" in the named table; referrers row 'a person a project names only as its lead'. All pass in the second test:quick run.

Cases of the brief's "Cases" (each judged by a test or by this review's reading, never by the builder's inline programs, Spec 1):

- C1: met, reading: `links.ts:167` keeps the lead in manifest order, `team.ts:14` puts lead first, `items.ts:145-146` names each by `personNames` (`person.ts:38-43`), `presets.ts:378` joins with ", "; drawn by `ProjectCard.svelte:386-389` and `Projects.svelte:225`; on screen at the look.
- C2: met, reading: `selfIds` (`team.ts:18-21`) and `shownTeam` drop the person with `self: true` from the line, the tags (`items.ts:146`) and the Map (`graph.ts:148`).
- C3: met, reading: lead [b-coauthor, c-senior] kept in order (`links.ts:167`), collaborators [c-senior, rivera-lab] (`links.ts:168`, pairs deduplicated by `pairs`, `links.ts:17-27`), `teamOf` deduplicates, giving "B. Coauthor, C. Senior, Ana Rivera".
- C4: met, test: the new `it` in `relation-shapes.test.ts` expects `['lead', typeSentence('lead', 'list', TEXT)]` for `lead: Faes`, green; `strings('Faes')` is [].
- C5: met, reading: `lead` is `from: people`, so the schema's reference rule reports the key, and `links.ts:76` writes no pair for it, so no name is drawn.
- C6: met, test: the G56 row "a manifest's authors", green; no code reads `authors` (item 6 grep).
- C7: met, reading: `picksPeople` true for `lead`, `personToAdd` gives "Jane Doe", `addPerson` writes `{ key: 'jane-doe', name: 'Jane Doe' }` through `newEntry(PEOPLE, fields, rootOf(home))` with `home` the project's hub (`Editor.svelte:247-250`), `withPicked` appends the key, the save posts the draft edit; the drawn choice at the look.
- C8: met, reading: `new-entry.ts:152-161` compares lowercased key and name for equality ("Ana Rivera" and "ana rivera" give none, "riv" gives "riv") and `freeKey` of "???" is empty.
- C9: met, reading: `homeCollection(collections, 'lab')` returns lab's people collection or none (`new-entry.ts:63-69`), never the primary's.
- C10: met, reading: `picksPeople` (`schema.ts:394-397`) is false for a field with no `from` and for `[people, projects]`, true for the joint-work `select, from: people`, which `FieldControl.svelte` hands `extra` to `Select.svelte`.
- C11: met, reading: `Person.projectIds = sources(projectPerson, id)` (`links.ts:184`) and `projectPerson` holds the lead pairs (`links.ts:75`).
- C12: met, reading: `collection.ts:762` `teamOf(project).includes(person)`.
- C13: met, test and reading: the referrers row, green; `DeleteAsk.svelte` unchanged; afterwards the key is a schema reference finding as in C5.
- C14: met, test and grep: G120's rows assert "research hub of its user (oculus)" and "John Smith", green; `+server.ts:21` passes `selfName`; the `hub's owner` grep prints only `config/options/sources.yml:108`.
- C15: met, reading: `team.ts:14` `new Set`.
- C16: met, reading: `shownTeam` empty, `teamLine` '', `ProjectCard.svelte:386` draws no line, the cell is ''.
- C17: met, reading: `person.ts:41` gives the key for an empty name.
- C18: met, reading: `fieldChoices` returns every choice, chosen ones included (`selectors.svelte.ts:479-490`), so "Ana Rivera" offers no Add; `freeKey` loops to `jane-doe-2` (`new-entry.ts:45-53`). The run the brief asks for rests on the unapproved program (Spec 1).
- C19: met, reading: `merge.ts:147` resolves `lead` with `at('people', 'lead')`, own hub first, as `collaborators`.
- C20: met, reading: `schema.ts:355` gives `lead` as keys, so an unedited lead is no draft edit and the save posts only edits.
- C21: met, reading: `strings(undefined)` is [], `teamLine` '', no line.

## 1. Spec

- `.scratch/migration/agents/reviews/O53-report.md`, "First run of every case" and "Cases after the change": "Run by an inline node program over a copy of the demo hub per case (snapshot built by `buildHubs`, the card item by `boardItemFor`), before any change." and J1 "The cases were run by inline `node --input-type=module -` programs on the command line, with no file written."; what is wrong: these are scripts written for the step, run inline by the builder; the brief does not build them under "What to build" ("No script is written for this step, by the builder or by the session that runs it inline, other than a script the step builds under 'What to build'"), and no line of `plan.md`'s Rulings approves them (`awk 'NR>=1097' plan.md | grep -niE "script|inline|node program|first run"` finds approvals for other steps only); their text is not in the report, so no one can rerun them; failure scenario: the orchestrator lands the step on the "before" and "after" columns of every case and on C18's required run, all produced by programs nobody approved or can reproduce, and an error in one of them (for instance C19's "Ana Rivera of lab", a name `personNames` never forms, `person.ts:41`) is taken as a result; verdict: none of the cases is made unmet, since each is met above by a test or by this review's reading; under the skill's "Finding dispositions" this is raised to the user and nothing the programs produced is used until the user rules.

## 2. Proof

- `.scratch/migration/agents/reviews/O53-report.md`, "Verify lines" 9: "The added comment lines and test titles grepped for `no longer|used to|was text|formerly|previously|now|renamed|migrat`"; what is wrong: the brief's item 9 asks for "every word of the history list of `spec.md`'s 'What every package obeys'", which is 'before', 'used to', 'no longer', 'still', 'always has been', 'always had', 'as before', 'previously', 'the step adds', 'after this package lands'; the builder's grep omits 'before', 'still', 'always ha', 'as before', 'the step adds' and 'after this package lands', so its "three hits, none history" judges a different list; my grep with the spec's list gives 11 hits, all of a moment inside a run (Verification, item 9), so the outcome holds; failure scenario: a reader trusts "three hits" as the whole list, and a history comment using 'still' or 'before' would have passed unseen; verdict: none.

## 3. Standards

- `config/text/views/boards/person.yml:1-4`: "# person of a project card's team, a joint-work entry, the Map's node and a card of the People view, so its words" (line 2, 113 columns, between lines of 93 and 94); what is wrong: spec.md "What every package obeys": "One line per paragraph or bullet in any Markdown or YAML you edit. No hard wrapping.", and the brief's Conventions: "a YAML comment and a Markdown paragraph or bullet is one line"; the step edited this comment and left it as four hard-wrapped lines, one of them now longer than the rest; failure scenario: the next editor of the catalog reads a comment broken mid-sentence at uneven widths and rewraps or extends it in the same broken form; verdict: none (item 4 holds on the words).
- `src/lib/state/boards/board/index.ts:18`: "    teamLine,"; what is wrong: spec.md "The principles every package is judged on": an export "with no importer outside its own file and its tests is removed or made local"; `sh utils/unused-exports.sh` lists `teamLine` on `index.ts` (Verification, item 5), so the brief's item 5 check "no new line" fails on line 126; `items.ts` imports `teamLine` from `./presets.ts` and nothing imports it from the board index; the brief's item 3 wording ("the re-export ... follows its name") assumed a reader; failure scenario: the dead re-export stays in the knip list under a new name, and the next step reading the base list cannot tell it from an export it added; verdict: none (item 3's text is met).
- `src/lib/views/shared/forms/entry/card/EntryFields.svelte:109`: "/** One person as their own tab, the tab a collaborator tag on a project card opens. */" and `src/lib/state/client/selectors.svelte.ts:444`: "which projects name a funding scheme, a collaborator or an"; what is wrong: spec.md "What every package obeys": "After changing a name, a construct or a shape, grep it across `src` ... A sentence in a document or a head comment that the change makes false is a defect of the change"; the card has no collaborator tag now (`CardLinks.svelte` kind `team`), and a joint work's projects are joined by the team (`collection.ts:762`), so both comments are false; failure scenario: a maintainer looking for the collaborator tag that opens the Person tab, or for why a lead-only project shows under a joint work, follows these comments to a construct that no longer exists; verdict: none.
- `src/lib/state/forms/new-entry.ts:195`: "if (key === '') return { key: '', said: t('editor.add_person_key') };" with `config/text/views/boards/editor.yml:6` `add_person_key`; what is wrong: spec.md principles (YAGNI) and the refute skill's "code larger than its job": both callers reach `addPerson` only through `personToAdd`, which already returns '' for words with no key (`new-entry.ts:157`), so the branch and its catalog sentence cannot be reached, and an empty key would be refused by the server in any case; failure scenario: a maintainer keeps two copies of the keyless-name rule and a sentence no reader can see in step with each other; verdict: none.
- `.scratch/migration/agents/reviews/O53-report.md`, "Verify lines" 2: "The list ran to completion twice: before and after the size-rule split of the model files"; what is wrong: spec.md "Token discipline": "After your last change run the verify list, `npm run test:quick`, once", a second run allowed only after fixing a red line of the list; the first run was made before the last change (the split), and nothing in the list was red; failure scenario: one more ten-minute full list on a machine running six builders, which the rule exists to prevent; verdict: none.

## 4. Behaviour

- `config/text/views/boards/person.yml:11`: "nobody: This tab was opened for nobody. Press a person of the team on a project card to open a person."; what is wrong: the Person tab's empty-state sentence changed from "Press a collaborator tag on a project card to open a person." and the report states neither the change nor its before and after; failure scenario: the look on TEST checks the card, the line and the Map and never opens a bare Person tab, so the changed sentence is not read before booking; verdict: none.

## Declined to judge

- Brief verify item 1 (only covering test files ran while working), because it cannot be checked after the fact; the report's while-working `npx vitest run` list is not quoted as one command, and its files ran inside my test:quick runs.
- `npm run format` and `npm run diagrams` of brief item 2, because both write into the tree; whether `docs/diagrams/` matches the source is not verified by me.
- The first-run failures the report quotes for the four new test rows on the unchanged tree, because reproducing them means placing the rows in a base tree, which writes.
- The builder's inline `node --input-type=module -` programs (J1), not run, as instructed; their results are not used here.
- The cause of the first test:quick run's two 20 s timeouts in `tests/data/hubs/hub-portfolio.test.ts` (a test that reaches `merge.ts`), and of one uncaptured failure in my first alone rerun of that file; the next alone run passed 16 of 16 at about 2 s each and the second full list passed, which points at load from the other builders' suites, but a read and a rerun do not settle it.
- J8 (a Revert while an Add person write is out still picks the returned key into the field when it is drawn), because whether a discarded form should regain an edit is a user-visible choice for the orchestrator or the user; the brief only says the person stays in the registry.
- What is drawn for C1, C2, C7, C8 and C10, the Select text box of J5 and the Settings `self` row of J4, because a page is the orchestrator's look at landing.

Reviewer usage: a9541a55695dc8e97, claude-opus-5-5, 289165 tokens, 82 tool uses, 30 min 18 s.
