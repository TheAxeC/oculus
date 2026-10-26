Everything in the brief is done.

The look cases are not checked by a look, since this step starts no app or page; they rest on reading the markup and on the runs quoted, and the look is on landing. They are cases 1, 6, 16 and 23, and the look parts of 2, 3, 7, 12, 14, 17, 18, 27 and 29.

# O81 report

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md:191-195`:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

- none.
```

## The cases the brief's rules get wrong (for a ruling before any code changes)

### 1. Cases 18 and 26 under item 6's rule for the record board

The rule (item 6): "Its preset is made by a pure function beside `presetFor` from the role and the merged config and words: the rule takes the role and nothing else, its sections are the record rows only, and its projects are the board's projects whose category is a record row ... Its New project answer comes from G124's rule unchanged ... the record take is read by `offersNewProject` the way it is read by the board's items, with no exception written for the record board." Item 6 also asks: "While no `self` is named, it draws no project and the board's empty message".

What the code reads: the board's items are `boardItems` (`src/lib/state/boards/board/items.ts:213-223`), which keep a project when `boardTakes(preset.rule, project, context)` holds (`items.ts:221`); the board's New project answer is the selector's `offersOfNewProjects(preset.rule, context, hub)` (`src/lib/state/client/selectors.svelte.ts:799-804`), which builds the new project and asks `boardTakes(rule, project, ...)` (`src/lib/state/boards/board/new-project.ts:122`). Both read `preset.rule` and nothing else of the preset. A `BoardRule` holds `tiers`, `roles`, `stages`, `chips`, `forms`, `hub` and `match` (`src/lib/data/shapes/boards/takes.ts:20-28`), and `boardTakes` applies `roles` only while a `self` is named (`takes.ts:136-139`, head comment `takes.ts:5-6`: "`role:` is applied only when the workspace names a `self`").

The result, on the unchanged tree (case-run program below, its output lines):

```
case 18 offersNewProject(rule taking lead only): true
case 26 projects of a rule taking lead, with no self: 115
```

So a preset whose rule "takes the role and nothing else" offers New project (case 18 says it draws none) and, with no `self`, takes 115 of the scratch hub's projects (case 26 says no project). The cases hold only when the record take is inside the `BoardRule` and read by `boardTakes`, which is a change to `src/lib/data/shapes/boards/takes.ts`, the Code line of G124 and outside the step's "Paths this step writes", and which contradicts "the rule takes the role and nothing else".

Options:

- A (recommended): `BoardRule` gains one field, `record: string[] | null`, the keys of the record rows of `categories:`. `boardRuleOf` gives `null` for every row of `boards:` (no key of `boards:` reads it, so no config key is added and no board of `boards:` changes). The record preset sets `roles: [<role>]`, `record: <the union's record row keys>` and every other field `null`. `boardTakes`, when `record` is set, takes a project only when its category (`categoryOf` under its own hub's words, as `trackRecord` reads it, `career.ts:80-84`) is one of those keys and its role for the user (`projectRole` over the user's ids, as `trackRecord` reads it) is one of `roles`; with no `self` no project has a role, so none is taken. `items.ts` and `new-project.ts` stay unchanged, so New project is answered by G124's rule unchanged: the new project at the `new_idea` stage is in the `idea` row, no record row, and is not taken. `takes.ts` joins the write list (its type, `boardRuleOf`, `boardTakes` and its head comment); G124's text needs no change, since the record key is no key a `boards:` row names.
- B: the record board's projects filtered after `boardItems` in the view or the selector, and New project hidden by a check of the view id. This is the exception item 6 forbids, and the board's items and its New project answer would read the record take two ways. It is the lazy option: it costs less now and leaves the record take outside the one rule every board is read by.

### 2. Case 28 under premise 13

The rule (premise 13 and case 28): "A collection view of a key a module view holds is left out with its finding too (`views.ts:155-163`)"; case 28: "A `collections:` entry keyed with the record view's id: the collection view is left out with its existing finding, the record view unchanged."

What the code does: `registerCollections` (`src/routes/views.ts:162-164`) drops an entry whose key is a module view's id by `given.views.filter((entry) => !builtIn.has(entry.key))`, with no finding. The only finding on a collection's key, `findings.collections.view_id` (`config/text/findings.yml:21`, raised at `src/lib/data/helpers/hub-names.ts:415-421`), is given only for the id of a registry's view (`takesRegistryView`, `hub-names.ts:151-153`, over `REGISTRY_VIEWS` at `:130-137`: data, venues, pillars, domains, leads, radar).

The result, on the unchanged tree (`case28.case.ts` below):

```
case 28 collectionListFindings of an entry keyed debug: []
case 28 collectionListFindings of an entry keyed track_record: []
case 28 collectionListFindings of an entry keyed venues: ["config.yml | collections[0].key | the key venues is the id of one of oculus's own views; the collection gets no card-list view"]
```

So no existing finding names a `collections:` entry keyed with a module view's id (`debug` today, `track_record` after the step); such an entry is left out silently.

Options:

- A (recommended): a finding for a `collections:` entry whose key a module view's id holds, given where the entry is left out (`registerCollections`, through `registry.refuse` as `registerBoards` gives `findings.config.boards_view`), with a new finding word in `config/text/findings.yml`. It is a user-visible sentence the brief does not name, so its words are the orchestrator's to approve; it ends the silent drop for every module id, `track_record` among them. Paths outside the write list: `src/routes/views.ts:146-175` (`registerCollections`) and `config/text/findings.yml`. One fact to settle with it: `registerBoards` already calls `registry.refuse(given.findings)` (`views.ts:122`); the registry's `refuse` (`src/lib/state/workbench/navigation/registry.ts:308`) would be read for whether a second caller replaces the first one's findings.
- B: case 28 holds with no finding: the collection view is left out silently, as every module id is today, and the record view is unchanged; the case's words "with its existing finding" are dropped. It is the lazy option: it costs nothing and leaves a reader who names a collection after a built-in view with no word saying why it has no card list.

### 3. A visible consequence to rule with item 4 (no stop by itself)

Case 13 asks that the venue form offer journal, conference, thesis and meeting. Once `venue_categories` holds rows, the form's choices read each row's `label` (`src/lib/state/forms/schema.ts:174-178`, `choiceShape`), so the select will draw "Journals", "Conferences", "Theses" and "Meetings" (the section words) where it draws "journal", "conference", "thesis", "meeting" today (first run: `case 13 choicesFor: [{"id":"journal","label":"journal"},...]`); the value written stays the key. Options: keep it (the row's label is what every keyed list offers, as `venue_tiers` does), or give the rows a second word for the form. Recommendation: keep it, since a second word is a new field the ruling did not name; the look on landing then checks the venue form.

## The cases' first run, on the unchanged tree (base 335db1c9, no change made)

Every run line below is from `before.case.ts` (output `before.out`) unless it names `case28.case.ts`; the source of both is under "The case-run programs".

1. Board section heading. Read: `src/lib/views/boards/projects/Projects.svelte:379-388` draws `<div class="heading"><FoldHead title=... name=... open={!folded.has(section.key)} ontoggle=... tone=... count={section.items.length} /></div>`; `FoldHead.svelte:65-67` draws the count as `<Chip label={String(count)} {tone} />`, the title in bold (`:98-105`). The fold is kept in the board state's `folded` (`Projects.svelte:209-216`). Today the count is a badge, not plain text at `--fs-sm`. The look on landing.
2. Focus clusters. Run: `case 2/3 foldOpen({"closed":["cluster:now"]}, career): true`, `command: true`, `tasks: true`, `cluster:now: false`, `cluster:parked: true`, `band: true`; `case 2 foldToggled({}, cluster:now): {"closed":["cluster:now"]}`. The fold functions answer any string, but nothing calls them with a cluster key: `Lanes.svelte:238-247` heads each cluster with `<summary>` in a `<details class="cluster" ... open>` (`:253`, `:266`), no count, no memory, and `Focus.svelte:310-318` hands `Lanes` no fold.
3. The band. Run: `case 3 foldToggled({}, band): {"closed":["band"]}`; read: `Band.svelte:130-133` `<details class="cluster" open><summary><Surface inline>{t('focus.cards_group')}</Surface></summary>`, no count, no memory; `Focus.svelte:304` hands `Band` no fold.
4. A saved `{ closed: ['career'] }`. Run: `case 4 foldOpen({"closed":["career"]}, career): false`, `command: true`, `tasks: true`, `cluster:now: true`, `lane:idea: true`, `band: true`.
5. A hub cluster keyed `career`. Run: `case 5 exports of focus.ts naming a fold: ["foldOpen","foldToggled"]`: no function makes a grouping's fold key today; a cluster keyed `career` has no fold of its own.
6. Find-in-page in a folded cluster. Read: the clusters are native `<details>` (`Lanes.svelte:253`, `:266`), which the browser opens on a find-in-page match; no `hidden="until-found"` or `beforematch` there (`grep -n "until-found\|beforematch"` over `Lanes.svelte` and `Band.svelte` prints nothing; `CareerPanel.svelte:207-208` holds the pair). The look on landing.
7. Venues on the scratch hub. Run: `case 7 hub venues by category: {"conference":27,"journal":46,"thesis":2,"meeting":1}`; `case 7 venuesByCategory: {"journals":46,"conferences":27}`; `case 7 hub venue_categories: ["journal","conference","thesis","meeting"]`. Theses and Meetings are drawn nowhere.
8. A `workshop` venue and one with no category. Run: `case 8 venuesByCategory: {"journals":["j1"],"conferences":[]}`: `w1` and `n1` are in no section.
9. A hub's rows `[ { key: conference, label: Conferences, ribbon: true }, { key: journal, label: Journals } ]`. Run: `case 9 findings: ["/scratch/lab/.oculus/config.yml | venue_categories.0 | venue_categories.0 must be a text","/scratch/lab/.oculus/config.yml | venue_categories.1 | venue_categories.1 must be a text"]`; `case 9 config.venue_categories: [{"key":"conference","label":"Conferences","ribbon":true},{"key":"journal","label":"Journals"}]`; `case 9 vocabKeys: ["conference","journal"]`. The Venues view reads no config today (`venuesByCategory` writes the two words in code, `venues.ts:181-186`).
10. A bare word `[journal]`. Run: `case 10 findings: []`; `case 10 config.venue_categories: ["journal"]`; `case 10 vocabKeys: ["journal"]`.
11. A row with no label, and `ribbon: yes`. Run: `case 11 no label findings: ["/scratch/lab/.oculus/config.yml | venue_categories.0 | venue_categories.0 must be a text"]`; `case 11 ribbon yes findings: ["/scratch/lab/.oculus/config.yml | venue_categories.0 | venue_categories.0 must be a text"]` (today every row is refused as no text, the field not named).
12. Venues state. Run: `case 12 parseVenuesState({ journalsOpen: false }): {"search":"","off":[],"journalsOpen":false,"conferencesOpen":true}`; `case 12 parseVenuesState({ folded: [thesis] }): {"search":"","off":[],"journalsOpen":true,"conferencesOpen":true}` (no `folded` today).
13. The venue form's category options. Run: `case 13 choicesFor: [{"id":"journal","label":"journal"},{"id":"conference","label":"conference"},{"id":"thesis","label":"thesis"},{"id":"meeting","label":"meeting"}]`.
14. The track record on the scratch hub with `self: axel-faes`. Run: `case 14 self ids: ["axel-faes"]`; `case 14 trackRecord: {"roles":[{"key":"lead","label":"Lead","lines":[{"key":"in-review","label":"in review","count":9},{"key":"in-flight","label":"in flight","count":16},{"key":"publications","label":"publications","count":10},{"key":"other-outputs","label":"other outputs","count":9}]},{"key":"supervisor","label":"Supervisor","lines":[{"key":"in-review","label":"in review","count":4},{"key":"in-flight","label":"in flight","count":0},{"key":"publications","label":"publications","count":0},{"key":"other-outputs","label":"other outputs","count":0}]},{"key":"collaborator","label":"Collaborator","lines":[{"key":"in-review","label":"in review","count":1},{"key":"in-flight","label":"in flight","count":2},{"key":"publications","label":"publications","count":6},{"key":"other-outputs","label":"other outputs","count":6}]}],"funding":1}`; `case 14 record-board functions of presets.ts: []` (no record preset or board today).
15. A project led by the user in no record row. Run: `case 15 a nascent project of the hub: {"id":"asthma-geo-tensor","stage":"nascent","lead":["axel-faes"]}`; at `nascent` it is in the `idea` row, which carries no `record: true` (`config/catalogs/vocab.yml` `categories`), so `trackRecord` counts it in no line. No record board exists to hold it.
16. Second press on the Lead row. Read: today a role row opens `openView(target.view)` (`CareerPanel.svelte:166`) with the board `roleBoard` gives, so Lead opens the Projects board: `case 21/22 targets: {"career:role:lead":{"kind":"view","view":"projects"},...}`. The look on landing.
17. Search and facets on a record board. Read: a board's writes go to the UI instance-state map (`Projects.svelte:174-176`, `setInstanceState(instance.id, storedState(...))`), the opener's state to the layout's `instance.state` (premise 14). No record board exists today. The look on landing.
18. No New project, no counts, not listed. Run: `case 18/19/20 registry view track_record: null` (no record view today); `case 18 offersNewProject(rule taking lead only): true` (see "The cases the brief's rules get wrong", 1).
19. A `boards:` row keyed `track_record`. Run: `case 19 pageBoards(boards: { track_record }): {"views":["track_record"],"findings":[]}`: today the board is registered and no finding is given.
20. Two pushes. Run: `case 20 after a push holding track_record: "track_record"`; `case 20 after a push without it: null`.
21. A role no board takes. Run: `case 21/22 rows: [{"id":"career:role:lead","plain":false},{"id":"career:role:ghost","plain":true},{"id":"career:funding","plain":false}]`: the role `ghost` is a plain row that opens nothing.
22. Funding obtained. Run: `case 21/22 targets: {"career:role:lead":{"kind":"view","view":"projects"},"career:funding":{"kind":"view","view":"funding"}}`.
23. Career, Command center, Tasks headings. Read: `grep -rn "FoldHead" src` gives `CareerPanel.svelte:46,196`, `CommandCenterView.svelte:18,200`, `Tasks.svelte:18,87`, `Projects.svelte:53,75,380`. The look on landing.
24. Two hubs naming `journal`. Run: `case 24 unionWords: [{"key":"journal","label":"Journals"},{"key":"journal","label":"Journal papers","ribbon":true}]` (two rows today).
25. A list naming `journal` twice and a row with key `''`. Run: `case 25 findings: [... venue_categories.0 must be a text, ... venue_categories.1 must be a text, ... venue_categories.2 must be a text]`; `case 25 vocabKeys: ["journal","journal",""]`.
26. No `self`. Run: `case 26 trackRecord with no self: null`; `case 26 projects of a rule taking lead, with no self: 115` (see "The cases the brief's rules get wrong", 1).
27. A record tab with no `id`. No record view exists today (`case 18/19/20 registry view track_record: null`). The look on landing.
28. A `collections:` entry keyed `track_record`. Run: `case 28 collection view track_record registered: "track_record"` (today the collection view is registered under that id); `case28.case.ts`: no finding for `debug` or `track_record`, `findings.collections.view_id` for `venues` only (see "The cases the brief's rules get wrong", 2).
29. Settings on `venue_categories`. Run: `case 29 options entry: [["catalogs/vocab.yml",{"help":"The categories a venue's category takes, in the order the Venues view offers them. A hub's list replaces oculus's whole.","control":"list","default":["journal","conference","thesis","meeting"],"section":"Vocabulary","heading":"boards"}]]`; the write of four rows through `writeConfigValue` into my own copy of the scratch hub's settings: `case 29 write outcome: {"changed":[],"refused":[{"field":"catalogs/vocab.yml:venue_categories","reason":"venue_categories.0 must be a text"}]}`; read back: `case 29 read back venue_categories: ["journal","conference","thesis","meeting"]`, `case 29 read back findings naming venue_categories: []`.

The two tests the step changes, run on the unchanged tree:

- `npx vitest run tests/data/sources/config/layers/hub-vocab.test.ts -t "replaces the lists whose order is their meaning whole" --reporter=verbose`: `replaces the lists whose order is their meaning whole 205ms`, `Tests  1 passed | 15 skipped (16)`. The row passes with the bare word.
- `npx vitest run tests/state/boards/board/board-rules.test.ts -t "New project on a board" --reporter=verbose`: 17 rows of the describe pass, `Tests  17 passed | 84 skipped (101)`. The record board's row cannot run on the base: no record preset exists (`case 14 record-board functions of presets.ts: []`).

## The cases ruling, as built

`briefs/O81-cases.md` ruled on the three points above. All three are built.

1. The record take is in `BoardRule.record`. `takes.ts` `boardTakes` takes a project only when its category is a record row and the user's role on it is the board's role, and takes none with no `self`. `items.ts` and `new-project.ts` are unchanged, and `boardRuleOf` gives `null`.
2. Case 28 gets `findings.collections.view_id` with no new word (judgment call 1).
3. The venue form reads each row's label (case 13).

## DONE / NOT DONE

Every case after the change is from `after.case.ts`; its full output is under "The case-run programs". The look cases rest on reading the markup, since this step starts no app or page.

| Item or case | State | Proof |
| --- | --- | --- |
| First run of every case on the unchanged tree | DONE | the section above |
| Item 1, `GroupHead` | DONE | `src/lib/views/shared/card/heads/GroupHead.svelte`. Its markup: a bare `ToolButton` named "Fold <name>"/"Unfold <name>" with the collapse or expand glyph, then the optional `Glyph`, the label at `--fs-md` in `var(--c-<tone>-txt)` or `--muted-txt`, and the count at `--fs-sm`. It holds no state. Its head comment names its users and says `FoldHead` heads a box |
| Item 2, board sections | DONE | `Projects.svelte` draws `GroupHead` with the category's label, tone and count, and "other" with `board.section_other`; the heading stays sticky and `folded` is kept |
| Item 3, Focus groups | DONE | `Lanes.svelte` and `Band.svelte` use `GroupHead`, `groupFold`, `hidden="until-found"` and `onbeforematch`; `grep -rn "<details\|<summary" src/lib/views/boards/focus` prints nothing |
| Item 4, `venue_categories` rows | DONE | `hub-vocab.test.ts` 16 passed; cases 9, 10, 11, 25 and 29 below |
| Item 5, Venues sections | DONE | cases 7, 8, 9, 12 and 24 below; grep 5 prints nothing |
| Item 6, record board | DONE | cases 14 to 22, 26 and 27 below; `board-rules.test.ts` New project describe 20 passed |
| Item 7, false sentences rewritten | DONE | the name grep under "Greps" |
| Item 8, unused exports | DONE | `sh utils/unused-exports.sh \| diff .agents/worktrees/O81-base/unused-exports.txt -`: `diff exit 0` |
| Item 9, doc text | DONE | "Doc text" below |
| Case 1, board headings | DONE by reading; the look is on landing | `Projects.svelte` markup as item 2 |
| Case 2, clusters | DONE | `foldOpen({"closed":["cluster:now"]}, cluster:now): false`; `cluster:parked`, `cluster:incubate`, `lane:idea`, `band`, `career`, `command` and `tasks` are true; `foldToggled({}, cluster:now): {"closed":["cluster:now"]}` |
| Case 3, band | DONE | `foldToggled({ closed: [cluster:now] }, band): {"closed":["cluster:now","band"]}` |
| Case 4, `{ closed: ['career'] }` | DONE | `career: false`; every cluster key, `lane:idea` and `band` true |
| Case 5, a hub cluster keyed `career` | DONE | `groupFold(cluster, career): "cluster:career"`; folding it leaves the banner open (`true`), and folding the banner leaves it open (`true`) |
| Case 6, find-in-page | DONE by reading; the look is on landing | `Lanes.svelte` and `Band.svelte` draw the folded content with `hidden={open ? false : 'until-found'}` and `onbeforematch={unfold}`, as `CareerPanel.svelte` does |
| Case 7, hub venues | DONE | `["journal: Journals 46","conference: Conferences 27 ribbon","thesis: Theses 2","meeting: Meetings 1"]` |
| Case 8, workshop and no category | DONE | `[["journal",["j1"]],["meeting",["m1"]],["",["w1","n1"]]]` |
| Case 9 | DONE | no finding; `["conference: Conferences 1 ribbon","journal: Journals 1","(other): Other 3"]` |
| Case 10, bare word | DONE | `venue_categories.0 must be a map` on `/scratch/lab/.oculus/config.yml`; `["(other): Other 5"]`; form options `[{"id":"journal","label":"journal"}]` |
| Case 11 | DONE | `venue_categories.0.label must be a text`; `venue_categories.0.ribbon must be true or false` |
| Case 12, Venues state | DONE | `parseVenuesState({ folded: [thesis] })` gives `folded: ["thesis"]`; `{ journalsOpen: false }` gives `folded: []` |
| Case 13, form options | DONE | `[{"id":"journal","label":"Journals"},{"id":"conference","label":"Conferences"},{"id":"thesis","label":"Theses"},{"id":"meeting","label":"Meetings"}]` |
| Case 14, row and board counts | DONE | lead, supervisor and collaborator: each row's lines equal the board's sections, line for line (lead `in-review 9, in-flight 16, publications 10, other-outputs 9` both ways); the title is `"Lead: track record"` |
| Case 15, idea led by the user | DONE | `asthma-geo-tensor` (nascent) is not on the Lead record board: `false` |
| Case 16, second press | DONE by run; the look is on landing | `openView('track_record', { id: 'lead', ... })` twice gives the same instance, and Supervisor gives another: `[true,true]` |
| Case 17, search, facet, role kept | DONE | counts `[44,26,5,44]` (all, search `tensor`, one slice, cleared); the tab's state after two board writes is `{"id":"lead","label":"Lead: track record"}` |
| Case 18, no New project, no counts, not listed | DONE | registration `listed: false`, `group: ""`, no `badge`, no `countPart`; `offersNewProject` is false for lead, supervisor, collaborator and other |
| Case 19, `boards:` key `track_record` | DONE | `views: ["projects"]`, with the finding `boards.track_record` ("the board track_record has the key of a view oculus's modules or a collection register; the board is not registered") |
| Case 20, two pushes | DONE | the record view is unchanged after both pushes: `{"id":"track_record","label":"views.track_record","group":"","listed":false}` |
| Cases 21 and 22, career rows | DONE | `career:role:ghost` opens `track_record` with `{"id":"ghost","label":"Ghost: track record"}`; `career:funding` opens `funding`; no plain row |
| Case 23, Career, Command center, Tasks | DONE by reading; the look is on landing | `grep -rln "FoldHead" src` lists `CareerPanel.svelte`, `CommandCenterView.svelte`, `Tasks.svelte` and `GroupHead.svelte` (its comment); only their import path changed |
| Case 24, two hubs naming `journal` | DONE | the union `[{"key":"journal","label":"Journals"}]`; one section `["journal","Journals",false,["a","b"]]` |
| Case 25 | DONE | `venue_categories.2.key is not a value this key takes`; one Journals section, then Other |
| Case 26, no `self`, and a gone role | DONE | `trackRecord` null; Lead record board 0; role `gone` 0; message `"No entries match."` |
| Case 27, no role | DONE | 0 projects; the message "This tab was opened for no role. Press a role of the Career banner's Track record to open its projects." |
| Case 28, `collections:` keys of module views | DONE | `collectionRefusals` gives `findings.collections.view_id` for `debug` (`collections[0].key`) and `track_record` (`collections[1].key`) on the hub's `config.yml`; the data side's `venues` finding (`collections[2].key`) is unchanged; `registry.refused()` lists both beside the board finding, and keeps them after a push with no left-out board; the record view is unchanged |
| Case 29, Settings | DONE by run; the look on the TEST page is on landing | the options entry has `fields` key, label and ribbon (a toggle); the write gives `changed: ["catalogs/vocab.yml:venue_categories"]`, and the read back has the three rows and no finding |
| Verify 1, `npm run diagrams && npm run test:quick -- --base 335db1c9` | DONE | third run, after the last change: `ok ASCII gate`, `ok prettier: All matched files use Prettier code style!`, `ok svelte-kit sync`, `ok eslint`, `ok svelte-check: ... 545 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok vitest checks`, `ok vitest`, `ok vitest slow`, `test:quick: 204.5 s; every command passed`, `verify exit 0`. It does not cover, in its own words: "tests that reach no changed file within the import depth, the build, the lint of unchanged files" |
| Verify 2, the named test files | DONE | `hub-vocab.test.ts`: `Tests  16 passed (16)`; `config-folder.test.ts`: `Tests  28 passed \| 2 skipped (30)`; `board-rules.test.ts`: `Tests  104 passed (104)`, and its New project describe `Tests  20 passed \| 84 skipped (104)`. The record rows cannot run on the base copy, which has no `recordPreset` (first run) |
| Verify 3, the case-run programs | DONE | before and after, under "The case-run programs" |
| Verify 4, unused exports | DONE | `diff exit 0` |
| Verify 5, category words in Venues code | DONE | prints nothing (`exit 1`) |
| Verify 6, removed names | DONE | three hits, all `cards_group`, which item 3 keeps as the band's heading words: `Band.svelte:159`, `:160` and `config/text/views/boards/focus.yml:7` |
| Verify 7, `FoldHead` | DONE | `GroupHead.svelte`, `CommandCenterView.svelte`, `Tasks.svelte`, `CareerPanel.svelte` |
| Verify 8, `<details>` in Focus | DONE | prints nothing (`exit 1`) |
| Verify 9, history words | DONE | prints nothing (`exit 1`) |
| Verify 10, ASCII | DONE | the spec's perl gate over `src tests config` prints nothing (`bin` does not exist in the tree: `bfs: error: bin: No such file or directory.`); `LC_ALL=C grep -n '[^ -~]'` over this report prints nothing |
| Verify 11, sizes | DONE | "Files" below |

## Files

The tree after the change, from `git status --short` and `wc -l` in the worktree. Every component is at or under 520 lines and every other source file at or under 880.

| File | Lines | In the brief's paths? |
| --- | --- | --- |
| `config/catalogs/vocab.yml` | 290 | yes |
| `config/options/catalogs/vocab.yml` | 383 | yes |
| `config/text/views/boards/projects.yml` | 103 | yes (also holds `views.track_record` and its glyph word) |
| `config/text/views/sources/venues.yml` | 38 | yes |
| `src/lib/data/helpers/hub-names.ts` | 877 | ruling 2; `readList`'s signature at `:384` is outside the ruled lines 125-165 and 400-430, since the reader takes the view ids |
| `src/lib/data/index.ts` | 782 | no: `hubVocabOf` fills `HubVocab.list`, `listFileOf` gives the file (case 28) |
| `src/lib/data/model/index.ts` | 837 | no: `HubVocab` gains `list` (case 28), and the hub vocabulary types moved out for the size rule |
| `src/lib/data/model/model-collections.ts` | 396 | no: it takes `HubVocab`, `ListedCollection` and `HubVocabs` (size rule) |
| `src/lib/data/shapes/boards/takes.ts` | 182 | ruling 1 |
| `src/lib/data/shapes/catalog-files/vocab.ts` | 504 | yes |
| `src/lib/data/shapes/vocab-keys.ts` | 332 | yes |
| `src/lib/data/sources/collections.ts` | 214 | no: `collectionListFindings` calls the shared `listFindings` (case 28) |
| `src/lib/state/boards/board/index.ts` | 81 | yes |
| `src/lib/state/boards/board/presets.ts` | 612 | yes |
| `src/lib/state/boards/career.ts` | 109 | yes |
| `src/lib/state/boards/focus.ts` | 710 | yes (`FoldKey` and `groupFold`) |
| `src/lib/state/sources/registries/venues.ts` | 231 | yes |
| `src/lib/state/workbench/navigation/registry.ts` | 326 | ruling 2 |
| `src/lib/views/boards/focus/Band.svelte` | 334 | yes |
| `src/lib/views/boards/focus/CommandCenterView.svelte` | 317 | no: the `FoldHead` import path (heads folder) |
| `src/lib/views/boards/focus/Focus.svelte` | 389 | yes |
| `src/lib/views/boards/focus/Tasks.svelte` | 157 | no: the `FoldHead` import path (heads folder) |
| `src/lib/views/boards/focus/career/CareerPanel.svelte` | 248 | yes |
| `src/lib/views/boards/focus/career/career-rows.ts` | 270 | yes |
| `src/lib/views/boards/focus/lanes/Lanes.svelte` | 395 | yes |
| `src/lib/views/boards/projects/Projects.svelte` | 480 | yes |
| `src/lib/views/shared/card/heads/FoldHead.svelte` | 123 | moved from `card/` with `mv`; its head comment rewritten |
| `src/lib/views/shared/card/heads/GroupHead.svelte` | 89 | new, in `heads/` for the folder rule |
| `src/lib/views/sources/venues/Venues.svelte` | 203 | yes |
| `src/routes/+page.svelte` | 361 | no: raises the collections refusals (case 28) |
| `src/routes/+page.ts` | 42 | no: hands `hubs` to `+page.svelte` for the first frame (case 28) |
| `src/routes/views.ts` | 348 | yes, and ruling 2 |
| `tests/checks/source/keys.test.ts` | 840 | no: the computed-key allow entry follows the `findingText` call to `hub-names.ts` |
| `tests/data/helpers/hub-names.test.ts` | 390 | no: its `HubVocab` fixture needs the required `list` |
| `tests/data/sources/config/layers/hub-vocab.test.ts` | 347 | yes |
| `tests/state/boards/board/board-rules.test.ts` | 825 | yes; its shared fixtures moved out for the size rule |
| `tests/state/boards/board/board-fixture.ts` | 75 | new: the fixtures moved from `board-rules.test.ts` (size rule) |
| `docs/diagrams/*.dot`, `*.svg` (8 files) | generated | written by `npm run diagrams` |
| `.scratch/migration/agents/reviews/O81-report.md` | this report | yes |

The size rule applies to tests too (`tests/checks/tree/size.test.ts` measures `src`, `tests` and `utils`). The base sizes were `src/lib/data/model/index.ts` 879 and `tests/state/boards/board/board-rules.test.ts` 865 (`wc -l` in `.agents/worktrees/O81-base`).

No script was written but the case-run programs. Every edit to a tree file was made with Edit and Write, and the two headings were moved with `mv`. Prettier was run with `npx prettier --write <the changed files>`; it is the formatter the verify list runs.

Written under the scratchpad by the first run (`/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o81-cases/`):

- `caserun.config.mts`: the vitest config of the case-run programs (the worktree's vite config with one node project whose files are this folder's `*.case.ts`).
- `before.case.ts`, `case28.case.ts`: the case-run programs.
- `before.out`, `case28.out`: their output, by shell redirect.
- `hub-vocab-before.out`, `board-rules-before.out`: the output of the two test runs above, by shell redirect.
- `hub29/`: case 29's own copy of the scratch hub's `.oculus/config.yml` and `.oculus/data/` (no `local.yml` in it: `find ... -name local.yml | wc -l` printed 0), made with `cp`; the write into it was refused, so nothing was written there; the folder is removed (`rm -rf`) and is not there now.

Written under the scratchpad after the change: `after.case.ts`, run with its output read from the terminal. Its `hub28/` and `hub29/` folders are removed at its end (`ls` of the folder after the run: `after.case.ts before.case.ts before.out board-rules-before.out case28.case.ts case28.out caserun.config.mts hub-vocab-before.out`).

## Judgment calls the brief left open

1. Where case 28's finding is raised (ruling 2). The server cannot know the module view ids (they are the static `registration` exports of the Svelte modules, which `moduleViewIds` reads on the page), so the finding is raised on the page, by the reader that already words `findings.collections.view_id`:
   - `src/lib/data/helpers/hub-names.ts:384` `readList(value, words?, views?)`: with `views` given, an entry with a card list whose key `views` holds is a problem with the existing word (`:430`), beside the existing registry-view branch. `viewIdProblems(value, views)` (`hub-names.ts:443`) returns those, and `listFindings(problems, file, catalog)` (`hub-names.ts:451`) turns problems into findings; `collectionListFindings` (`src/lib/data/sources/collections.ts`) now calls `listFindings` too, so the words are made in one place.
   - Each hub's vocabulary carries its `collections:` list as written and the file it was read from (`HubVocab.list`, `src/lib/data/model/model-collections.ts`; filled by `hubVocabOf` with `listFileOf`, `src/lib/data/index.ts`).
   - `collectionRefusals(hubs, catalog)` (`src/routes/views.ts:194`) runs `viewIdProblems` over each hub's list with `moduleViewIds()` (no second list of ids), keeps the keys the hub lists, and gives the findings on the hub's file at the entry's place. The registry-view branch is not repeated there, since the server already gives that one.
   - `src/routes/+page.svelte:125` and `:169` call `client.registry.refuse('collections', ...)` on the first frame and on every push that changes the collections, beside `registerCollections`.
   - Constraint (a): `registry.refuse(source, found)` (`src/lib/state/workbench/navigation/registry.ts:312`) keeps the findings per source, and `refused()` lists every source's; `registerBoards` refuses under `'boards'` (`views.ts:124`), the page under `'collections'`, so neither replaces the other (case 28's run: the board finding is listed beside the two collection findings, and a push with no left-out board keeps the collection findings).
   - Constraint (b): the only list of ids is `moduleViewIds()`.
2. The record board's columns, labels and search are those of the first `boards:` row whose id is not `track_record` (`drawnBy` in `presets.ts`), so the record board draws its cards as the user's first board does. Its sections are the union's record rows and its roles the union's roles.
3. `GroupHead.svelte` and `FoldHead.svelte` are in a new folder `src/lib/views/shared/card/heads/`, since `views/shared/card/` held ten items and a new file there would make eleven (the folder rule). Every import and comment path is updated.
4. In Focus and Venues, `GroupHead` is drawn inside a `Surface`, so its words are read off a surface over a wallpaper as the `<summary>` was; the board's heading keeps its own sticky surface.
5. The New project describe of `board-rules.test.ts` gains three rows (two `it.each` rows that no role's track record board offers New project, with and without `self`, and one that a role's track record board takes no project while no `self` is named), as ruling 1 asks.
6. The size rule, 880 lines for a source file, tests included (`tests/checks/tree/size.test.ts` measures `src`, `tests` and `utils`):
   - `src/lib/data/model/index.ts` was 879 at the base. The `list` field took it past 880, so the hub vocabulary types (`HubVocab`, `ListedCollection`, `HubVocabs`) moved with their doc comments to `model-collections.ts`, which holds the vocabulary and collection-entry types, and the facade re-exports them, so no importer changes. `src/lib/data/model/` holds ten items, so a new file there was not an option.
   - `tests/state/boards/board/board-rules.test.ts` was 865 at the base. The ruled rows took it to 885, so its shared fixtures (the config and catalog, `SELF`, `MINE`, `NOBODY`, `CASES`, `project`, `snapshotOf`, `withBoards`) moved unchanged, each now exported, to a new `tests/state/boards/board/board-fixture.ts`. Every describe stays in `board-rules.test.ts`, so G124's Test line in `guarded.md` stays true.

## Visible changes, for the look on landing

1. Projects (any board with sections, Cards mode).
   - Before: each section heading is `FoldHead`: the title in bold and the count as a badge.
   - After: `GroupHead`: the chevron, then the category's label in its colour at `--fs-md`, then the count as plain text at `--fs-sm`. The "other" section is last, the heading stays sticky, and a fold is kept on reload.
2. Focus, lanes.
   - Before: Now, Parked and Incubation are `<details>` with a `<summary>`, with no count and no fold memory.
   - After: each cluster is headed by `GroupHead` with its glyph, words and card count, in the muted colour; the Idea lane's section is headed by the lane's label in its colour with its count. Folding writes `cluster:<key>` or `lane:<key>` into the tab's `closed`, and a reload keeps it. A folded group stays findable by find-in-page, and a match unfolds it.
3. Focus, band.
   - Before: a `<details>` "Funding | positions | teaching" with no count.
   - After: `GroupHead` with the card count; it folds under `band`, and the fold is kept.
4. Venues (Registries).
   - Before: two sections, Journals and Conferences, with the ribbon over Conferences; Theses and Meetings were drawn nowhere.
   - After: one section per `venue_categories` row in order (Journals 46, Conferences 27 with the ribbon, Theses 2, Meetings 1 on the hub), then Other for unnamed categories. Each is headed by `GroupHead` with its count, and a fold is kept in the tab's `folded`.
5. The venue form's Category select.
   - Before: journal, conference, thesis, meeting.
   - After: Journals, Conferences, Theses, Meetings; the value written stays the key.
6. Settings, Vocabulary, `venue_categories`.
   - Before: a list of words.
   - After: rows with a key and label text field and a Ribbon toggle.
7. The Career banner, Track record.
   - Before: a role row opens the first board that takes the role; a role no board takes is a plain row.
   - After: every role row opens a tab "<Role>: track record" (for example "Lead: track record") drawing exactly the counted projects, one section per record row. It has no New project, no tab or rail count, and is not in the view catalogue. A second press on the same role activates the open tab, and with no `self` it draws the board's empty message. Funding obtained still opens Funding.
8. Findings.
   - Before: a `collections:` entry keyed `debug` or `track_record` was dropped silently.
   - After: it is listed with `findings.collections.view_id` on the hub's `config.yml` at the entry's place, beside any board finding.
9. The `config` channel's payload (the page's `ConfigPayload.hubs`, read by any app on the channel).
   - Before: each entry of `hubs.lists` is `{ domains, venue_themes, data_themes, collections, words }`.
   - After: each entry of `hubs.lists` is `{ domains, venue_themes, data_themes, collections, list, words }`. `list` is `{ file, value }`: the hub's `collections:` list as written and the file it was read from. For example, `list: { file: "<hub>/.oculus/config.yml", value: [ { key: debug, file: notes/debug.yml }, ... ] }`.

## What was wrong or impossible in the brief

1. Item 1 places `GroupHead.svelte` in `src/lib/views/shared/card/`, which already held ten items (`ls` of the folder at the base: `card-layout.ts card.ts CardActions.svelte CardDocs.svelte Clamp.svelte feed FoldHead.svelte project Reveal.svelte RootChip.svelte`). Both headings went into `card/heads/` (judgment call 3).
2. Case 28 (premise 13), handed back in the first run and ruled. The page lacked each hub's raw `collections:` list and its file, which the finding needs, so `HubVocab` gained `list` (judgment call 1).
3. The size rule needed two files outside the paths: `model-collections.ts` and the new `board-fixture.ts` (judgment call 6).

## Doc text

Not applied; the orchestrator applies these at landing. Each item quotes the current line as `grep -n <pattern> <file>` prints it, then the whole line that replaces it. A replacement line keeps every word of the current line except the sentences it names.

1. `docs/HELP.md:287`, the **Focus.** note: two sentences change. The cluster-heading sentence gains the count, the lane colour and the folds. The Track record sentence says that a role row opens the role's track record board.
   Current:
   ```
   287:- **Focus.** One page, top to bottom, of the sections `sections` under `focus:` in `config/defaults/behavior.yml` lists, in its order: oculus's list is the Career banner (`career`), the command center (`command_center`), the tasks (`tasks`), the quick add (`quick_add`), the Awaiting box (`awaiting`), the Funding | positions | teaching band (`band`) and the lanes (`lanes`, with the message of a board with no project). A section the list leaves out is not drawn; a word that is no section and a section listed twice are findings, and the rest is drawn once each; a value that is no list is a finding and oculus's list is drawn. The line saying what a write answered is drawn after the quick add, or at the top of the board when the list leaves the quick add out. The lanes are grouped by the clusters of `focus_clusters` in `vocab.yml`, in its order, each lane in the cluster its row of `focus_lanes` names: a `columns` cluster draws its lanes side by side under a heading of its `label` and `glyph` words (Now, Parked and Incubation in oculus's list), muted when its row says `muted: true`; a `full_width` cluster draws each of its lanes as a section of its own under the lane's label (the Idea lane). A cluster with `sort: title` orders its cards by title, the others by deadline, then title, and the Awaiting box counts the projects on the lanes of the clusters with `awaiting: true`. A lane naming no cluster, or one no readable row has, is a finding and is not drawn. The Filter action in the header opens a list that stays open while you pick: Mine only, on at the start, which keeps what names you in `lead:`, `collaborators:` or `supervisors:` and what names no one; Role, the roles that have a field, all ticked, where unticking a role hides what you hold that role on; Tier, the words of `tiers:`, all ticked, which applies to projects only; and Hub, one row per hub, all ticked, drawn only while the workspace has more than one hub. Mine only and Role are drawn only while a person has `self: true`. Whether Mine only is offered is read on the whole page, with every role, tier and hub ticked: when it would hide nothing there it is drawn disabled, its tip saying everything here is yours, and is not applied; when it would hide something it applies together with the rest of the choice. The filter applies to the command center, the tasks, the Awaiting box, the band and the lanes. A calendar line, a lead, a refresh nudge and the Career banner are never hidden, and a collection entry is filtered by role only when its file's `schema:` declares `lead`, `collaborators` or `supervisors`. The Filter button is drawn pressed while the filter hides something, each section that hides rows says how many on its heading ("3 hidden"), and a lane the filter empties keeps its heading and its count. The tab keeps the choice, so a reload or a move of the tab keeps it. Each lane's heading draws its glyph, the `icon` of its row of `focus_lanes:`, and the Focus glyph for a row naming none or a name the glyph catalog lacks. A project sits on the lane its `stage:` gives: Run exploring, Push in-prep and submit-ready, Revise revision, Review submitted, Scope scoping, De-risk de-risking, Build building, and the Idea lane nascent, which takes a project of any tier. A project whose `status.chips` carry `blocked` or `parked` sits on Blocked or Backburner whatever its stage, and on Blocked when it carries both, unless its stage is done. A released, published, failed or stopped project sits on no lane, and one carrying `blocked` or `parked` is an audit finding naming the chip. A card draws its name alone on its first line, with its deadline and its menu, and under it its tags, each a glyph and its words with a tip naming its kind ("Stage: Submitted"), as a project board card draws its facts. The tags are every status mark its lane does not already say: its stage, unless the lane lists that stage alone, in the stage's colour, its form and its chips but the lane's own chip, each in its word's colour and a chip carrying `blocked` in red, each word once; then your role on the project, only while a person has `self: true`, and its tier, each unless its row of `roles:` or `tiers:` carries `unmarked: true` (oculus sets it on Lead and on `research`, and a hub may set it on any number of roles and tiers, or none); and the venue's short name, or its name when it has none, at a stage that carries `placed`, with the venue's whole name in the tip. Every tag is drawn, the tags wrapping onto further lines when the card is narrow, and a long venue name is cut with an ellipsis. Under the tags a card says whom it waits on, the people and projects its `waiting-on:` names, or Blocked while a chip carries `blocked`; a submitted project's review is said only in the Awaiting box. Dropping a card on a lane, or picking the lane in the card's menu, writes what the lane's `move_writes` in `focus_lanes` names: onto a lane of chips (Blocked, Backburner) its `chip`, when the card carries none of the lane's chips, with the chips of the other lanes of chips taken off and the stage kept; onto a lane of stages its `stage` when the lane does not hold the card's stage, with `blocked` and `parked` taken off. Oculus's lanes write Run exploring, Push in-prep, Revise revision, Review submitted, Blocked `blocked`, Backburner `parked`, Scope scoping, De-risk de-risking, Build building and Idea nascent. A lane without `move_writes` takes no move, and a `move_writes` naming a word the lane does not list, both fields or the field of the other kind of lane is a finding naming the lane. The card's menu offers only the lanes it may go to, so a done project has no Blocked or Backburner lane. A move that changes both the stage and the chips is two changes, and one Undo takes back one of them. A project whose stage is in flight or an idea and that no lane takes, which happens only when a hub's `focus_lanes:` leaves its stage out, is named in the command center's Needs attention group, with a link that opens it. Deadlines, due follow-ups and open subtasks are lines of the ticker. Done on a follow-up line takes that note out of its list, and the quick add appends a note to the list of the project it names. A funding scheme's deadline and follow-up lines open the Funding view, a conference call opens the Venues view, and an entry whose status keeps its lines live (`live_subtasks`) shows its follow-ups as it shows its subtasks. A dated deadline stays while it lies inside `deadline_horizon_days` of `focus:` and until the project's stage carries `deadline_met` (`submitted`). A band card whose status has met or closed its deadline, a status carrying `deadline_met` (`submitted`) or `closes_deadline` in its hub's words, shows no countdown. A task line has an `agent` button that opens the composer with the task. The Awaiting box has one row per kind that has something (Waiting on, Under review, Applications, Grants, Blocked), and a name waited on more than once carries its count, as in "BSPC (2)". The Career banner, headed Career, is open on a new Focus tab and folds like the command center, and a reload or a move of the tab keeps it folded or open; a find-in-page match inside the folded banner unfolds it. Its rows stand in the command center's box and two columns, in groups in this order, each drawn only when it has a row: Next, the milestone, with its day and the days left to it as the tail, the day followed by words such as "in 23 days" or "3 days ago", red once the day has passed and amber within 14 days of it; Goal; Situation, one row per fact with its value as the tail; Order of work, one row per task with its note after it and its date as the tail, and the order's own note under the rows; Track record, one row per role with the count of each record row of `categories:` it has projects in as the tail, as in "3 in review, 2 in flight", then Funding obtained. A press on a Next, Goal, Situation or Order of work row opens the career file at that entry's line, and when the file does not hold the entry the board's outcome line says so. Under the pointer such a row carries Edit, which opens the banner's editor at that section, and, for each web address its words hold, an Open link button named by the address's host, which opens the address in a new browser tab. Edit in the heading row opens the editor over the whole career file, unfolding the banner first when it is folded, and Close editor closes it; a career file with no `schema:` has no editor and no Edit. A Track record role row opens the first board of `boards:` that takes the role, so Lead opens Projects, Supervisor Supervision and Collaborator Coauthor, and Funding obtained opens the Funding view; these rows carry no button. The track record counts the projects of every hub whose lead, supervisors or collaborators name you (the workspace setting `self`), in the record rows of `categories:` (in review, in flight, publications, other outputs), never summed. Funding obtained counts the funding entries you lead whose status is obtained (awarded, granted), drawn only when at least one is. With no `self`, or with no project in a record row and no obtained funding, the track record is not drawn. A hub with no career file has no banner.
   ```
   Replacement:
   ```
   - **Focus.** One page, top to bottom, of the sections `sections` under `focus:` in `config/defaults/behavior.yml` lists, in its order: oculus's list is the Career banner (`career`), the command center (`command_center`), the tasks (`tasks`), the quick add (`quick_add`), the Awaiting box (`awaiting`), the Funding | positions | teaching band (`band`) and the lanes (`lanes`, with the message of a board with no project). A section the list leaves out is not drawn; a word that is no section and a section listed twice are findings, and the rest is drawn once each; a value that is no list is a finding and oculus's list is drawn. The line saying what a write answered is drawn after the quick add, or at the top of the board when the list leaves the quick add out. The lanes are grouped by the clusters of `focus_clusters` in `vocab.yml`, in its order, each lane in the cluster its row of `focus_lanes` names: a `columns` cluster draws its lanes side by side under a heading of its `glyph` and `label` words with the count of the cards on its lanes (Now, Parked and Incubation in oculus's list), its lanes muted when its row says `muted: true`; a `full_width` cluster draws each of its lanes as a section of its own under the lane's label in the lane's colour with the lane's count (the Idea lane). Each cluster, each such lane section and the Funding | positions | teaching band, headed by its count, folds by the control before its heading, and the tab remembers it, so a reload or a move of the tab keeps it folded; a find-in-page match inside a folded one unfolds it. A cluster with `sort: title` orders its cards by title, the others by deadline, then title, and the Awaiting box counts the projects on the lanes of the clusters with `awaiting: true`. A lane naming no cluster, or one no readable row has, is a finding and is not drawn. The Filter action in the header opens a list that stays open while you pick: Mine only, on at the start, which keeps what names you in `lead:`, `collaborators:` or `supervisors:` and what names no one; Role, the roles that have a field, all ticked, where unticking a role hides what you hold that role on; Tier, the words of `tiers:`, all ticked, which applies to projects only; and Hub, one row per hub, all ticked, drawn only while the workspace has more than one hub. Mine only and Role are drawn only while a person has `self: true`. Whether Mine only is offered is read on the whole page, with every role, tier and hub ticked: when it would hide nothing there it is drawn disabled, its tip saying everything here is yours, and is not applied; when it would hide something it applies together with the rest of the choice. The filter applies to the command center, the tasks, the Awaiting box, the band and the lanes. A calendar line, a lead, a refresh nudge and the Career banner are never hidden, and a collection entry is filtered by role only when its file's `schema:` declares `lead`, `collaborators` or `supervisors`. The Filter button is drawn pressed while the filter hides something, each section that hides rows says how many on its heading ("3 hidden"), and a lane the filter empties keeps its heading and its count. The tab keeps the choice, so a reload or a move of the tab keeps it. Each lane's heading draws its glyph, the `icon` of its row of `focus_lanes:`, and the Focus glyph for a row naming none or a name the glyph catalog lacks. A project sits on the lane its `stage:` gives: Run exploring, Push in-prep and submit-ready, Revise revision, Review submitted, Scope scoping, De-risk de-risking, Build building, and the Idea lane nascent, which takes a project of any tier. A project whose `status.chips` carry `blocked` or `parked` sits on Blocked or Backburner whatever its stage, and on Blocked when it carries both, unless its stage is done. A released, published, failed or stopped project sits on no lane, and one carrying `blocked` or `parked` is an audit finding naming the chip. A card draws its name alone on its first line, with its deadline and its menu, and under it its tags, each a glyph and its words with a tip naming its kind ("Stage: Submitted"), as a project board card draws its facts. The tags are every status mark its lane does not already say: its stage, unless the lane lists that stage alone, in the stage's colour, its form and its chips but the lane's own chip, each in its word's colour and a chip carrying `blocked` in red, each word once; then your role on the project, only while a person has `self: true`, and its tier, each unless its row of `roles:` or `tiers:` carries `unmarked: true` (oculus sets it on Lead and on `research`, and a hub may set it on any number of roles and tiers, or none); and the venue's short name, or its name when it has none, at a stage that carries `placed`, with the venue's whole name in the tip. Every tag is drawn, the tags wrapping onto further lines when the card is narrow, and a long venue name is cut with an ellipsis. Under the tags a card says whom it waits on, the people and projects its `waiting-on:` names, or Blocked while a chip carries `blocked`; a submitted project's review is said only in the Awaiting box. Dropping a card on a lane, or picking the lane in the card's menu, writes what the lane's `move_writes` in `focus_lanes` names: onto a lane of chips (Blocked, Backburner) its `chip`, when the card carries none of the lane's chips, with the chips of the other lanes of chips taken off and the stage kept; onto a lane of stages its `stage` when the lane does not hold the card's stage, with `blocked` and `parked` taken off. Oculus's lanes write Run exploring, Push in-prep, Revise revision, Review submitted, Blocked `blocked`, Backburner `parked`, Scope scoping, De-risk de-risking, Build building and Idea nascent. A lane without `move_writes` takes no move, and a `move_writes` naming a word the lane does not list, both fields or the field of the other kind of lane is a finding naming the lane. The card's menu offers only the lanes it may go to, so a done project has no Blocked or Backburner lane. A move that changes both the stage and the chips is two changes, and one Undo takes back one of them. A project whose stage is in flight or an idea and that no lane takes, which happens only when a hub's `focus_lanes:` leaves its stage out, is named in the command center's Needs attention group, with a link that opens it. Deadlines, due follow-ups and open subtasks are lines of the ticker. Done on a follow-up line takes that note out of its list, and the quick add appends a note to the list of the project it names. A funding scheme's deadline and follow-up lines open the Funding view, a conference call opens the Venues view, and an entry whose status keeps its lines live (`live_subtasks`) shows its follow-ups as it shows its subtasks. A dated deadline stays while it lies inside `deadline_horizon_days` of `focus:` and until the project's stage carries `deadline_met` (`submitted`). A band card whose status has met or closed its deadline, a status carrying `deadline_met` (`submitted`) or `closes_deadline` in its hub's words, shows no countdown. A task line has an `agent` button that opens the composer with the task. The Awaiting box has one row per kind that has something (Waiting on, Under review, Applications, Grants, Blocked), and a name waited on more than once carries its count, as in "BSPC (2)". The Career banner, headed Career, is open on a new Focus tab and folds like the command center, and a reload or a move of the tab keeps it folded or open; a find-in-page match inside the folded banner unfolds it. Its rows stand in the command center's box and two columns, in groups in this order, each drawn only when it has a row: Next, the milestone, with its day and the days left to it as the tail, the day followed by words such as "in 23 days" or "3 days ago", red once the day has passed and amber within 14 days of it; Goal; Situation, one row per fact with its value as the tail; Order of work, one row per task with its note after it and its date as the tail, and the order's own note under the rows; Track record, one row per role with the count of each record row of `categories:` it has projects in as the tail, as in "3 in review, 2 in flight", then Funding obtained. A press on a Next, Goal, Situation or Order of work row opens the career file at that entry's line, and when the file does not hold the entry the board's outcome line says so. Under the pointer such a row carries Edit, which opens the banner's editor at that section, and, for each web address its words hold, an Open link button named by the address's host, which opens the address in a new browser tab. Edit in the heading row opens the editor over the whole career file, unfolding the banner first when it is folded, and Close editor closes it; a career file with no `schema:` has no editor and no Edit. A Track record role row opens a tab of its own, named for the role ("Lead: track record"), drawing as board cards exactly the projects the row counts, one section per record row of `categories:` that holds one, each with the count the row shows; a second press on the same role brings that tab forward. The tab offers no New project, has no count on the tab or the rail and is not in the view catalogue; with no `self` it draws no project. Funding obtained opens the Funding view; these rows carry no button. The track record counts the projects of every hub whose lead, supervisors or collaborators name you (the workspace setting `self`), in the record rows of `categories:` (in review, in flight, publications, other outputs), never summed. Funding obtained counts the funding entries you lead whose status is obtained (awarded, granted), drawn only when at least one is. With no `self`, or with no project in a record row and no obtained funding, the track record is not drawn. A hub with no career file has no banner.
   ```
2. `docs/HELP.md:292`, the **Boards, categories and roles.** note: the board-heading sentence names the fold control at the head of the heading.
   Current:
   ```
   292:- **Boards, categories and roles.** A project shows on every board of `boards` in `config/defaults/layout.yml` whose keys it meets (its `tier`, your `role` on it, its `stages`, `chips` and `forms`, its `hub` and any `match` field), and opens from elsewhere on the first of them. Each key of `boards` is a view of its own, listed in that order in the group of the rail entry carrying `project_boards: true` (Projects in oculus's rail), its tab named and drawn by the text-catalog words its `label` and `glyph` name by their dotted keys (`views.projects` and `views.projects_glyph` for Projects). A board naming no `label` or `glyph`, or a word the catalog lacks, is a finding naming the board and the field, and the board is drawn with its key in place of a label and the glyph `views.board_glyph` names. A key that is the id of another view or the key of a collection is a finding naming the board, and that board is not listed. A board added in Settings appears in its group as the page runs, and a board taken out leaves the rail, the catalogue and its open tabs. Your role on a project is the first row of `roles` in `vocab.yml` whose field holds the person with `self: true`: Lead (`lead:`), Supervisor (`supervisors:`), Collaborator (`collaborators:`), and Other for a project that names people but not you. A project's category is the first row of `categories` in `vocab.yml` that holds it: in review, in flight, idea, publications, other outputs, released, dead-ends. Every row names its `color`; a row naming none is a finding and is drawn with no colour. The cards and the list draw one section per category the board holds, in that order, each under a heading with the category's label in its colour and its count, the projects in no category under "other" last; a press on a heading's fold control folds its section, the board remembers the folded sections, and a heading stays at the top of the pane while its section scrolls under it. A board's `cards: grid` draws one section with no heading instead. The slices of the bar's second line split the same categories by stage, or by form for publications and other outputs. While a person has `self: true`, each board draws the Role group, which counts the cards under each role, and a Lead badge on a card you lead, and a project board draws the Mine only toggle, on by default, which keeps the projects naming you in `lead:`, `collaborators:` or `supervisors:` and those naming no one; on a board where every project is kept by it, it is drawn disabled, its tip saying every project here is yours, and is not applied. A collection whose `schema:` declares `lead`, `collaborators` or `supervisors` draws the Mine only toggle, the Role facet and the Lead badge over its entries. While the workspace has more than one hub, a collection's bar draws after them the Hub chips, one per hub with its name and its count of entries, all pressed at the start; an unpressed chip hides that hub's entries, and the tab keeps the choice. With one hub no chip is drawn and a choice kept earlier hides nothing. A project no board takes, a manifest without `lead:` and a project with a `tier` that is no word of `tiers` are findings.
   ```
   Replacement:
   ```
   - **Boards, categories and roles.** A project shows on every board of `boards` in `config/defaults/layout.yml` whose keys it meets (its `tier`, your `role` on it, its `stages`, `chips` and `forms`, its `hub` and any `match` field), and opens from elsewhere on the first of them. Each key of `boards` is a view of its own, listed in that order in the group of the rail entry carrying `project_boards: true` (Projects in oculus's rail), its tab named and drawn by the text-catalog words its `label` and `glyph` name by their dotted keys (`views.projects` and `views.projects_glyph` for Projects). A board naming no `label` or `glyph`, or a word the catalog lacks, is a finding naming the board and the field, and the board is drawn with its key in place of a label and the glyph `views.board_glyph` names. A key that is the id of another view or the key of a collection is a finding naming the board, and that board is not listed. A board added in Settings appears in its group as the page runs, and a board taken out leaves the rail, the catalogue and its open tabs. Your role on a project is the first row of `roles` in `vocab.yml` whose field holds the person with `self: true`: Lead (`lead:`), Supervisor (`supervisors:`), Collaborator (`collaborators:`), and Other for a project that names people but not you. A project's category is the first row of `categories` in `vocab.yml` that holds it: in review, in flight, idea, publications, other outputs, released, dead-ends. Every row names its `color`; a row naming none is a finding and is drawn with no colour. The cards and the list draw one section per category the board holds, in that order, each under a heading of the fold control, the category's label in its colour and its count, the projects in no category under "other" last; a press on a heading's fold control folds its section, the board remembers the folded sections, and a heading stays at the top of the pane while its section scrolls under it. A board's `cards: grid` draws one section with no heading instead. The slices of the bar's second line split the same categories by stage, or by form for publications and other outputs. While a person has `self: true`, each board draws the Role group, which counts the cards under each role, and a Lead badge on a card you lead, and a project board draws the Mine only toggle, on by default, which keeps the projects naming you in `lead:`, `collaborators:` or `supervisors:` and those naming no one; on a board where every project is kept by it, it is drawn disabled, its tip saying every project here is yours, and is not applied. A collection whose `schema:` declares `lead`, `collaborators` or `supervisors` draws the Mine only toggle, the Role facet and the Lead badge over its entries. While the workspace has more than one hub, a collection's bar draws after them the Hub chips, one per hub with its name and its count of entries, all pressed at the start; an unpressed chip hides that hub's entries, and the tab keeps the choice. With one hub no chip is drawn and a choice kept earlier hides nothing. A project no board takes, a manifest without `lead:` and a project with a `tier` that is no word of `tiers` are findings.
   ```
3. `docs/HELP.md`, a new top-level bullet for the Venues view, inserted between the last sub-bullet of the **Data.** bullet and the **Present.** bullet. Its neighbours, as `grep -n` prints them:
   ```
   311:  - The log under the plan lists every request, command and result with its time. On the cluster the download runs on the login node and Live HPC's Login node section lists it; Verify and Unpack there are sbatch jobs.
   312:- **Present.** A deck is a folder with a `present.yml` and Markdown slides (several per file, split by `---`). The deck menu opens the portfolio deck (`portfolio_deck`), a project's `present/` deck, or one opened from Files. Right-click a slide to edit, add, duplicate or delete it; History undoes each. A dropped image is copied into the deck. Export to PDF writes `<name>.pdf` in the deck's folder (in the app; the print dialog in a browser). Notes come from the slide's `notes:` key.
   ```
   The new line, after line 311 and before line 312:
   ```
   - **Venues.** The venues are drawn in one section per row of `venue_categories` in `vocab.yml`, in its order, each headed by the row's `label` and its count, then an Other section for the venues whose category no row names; a section with no venue is not drawn. A row with `ribbon: true` draws the month ribbon of its venues' deadlines and meetings over its cards (oculus sets it on Conferences). A press on a heading's fold control folds its section, and the tab keeps it folded; a folded section draws no cards and no ribbon. With several hubs the rows are the union of every hub's, each key once with the first hub's row.
   ```
4. `docs/data-map.md:117`.
   Current:
   ```
   117:venue_categories:         # the categories of venues, in order (whole)
   ```
   Replacement:
   ```
   venue_categories:         # the categories of venues, rows { key, label, ribbon? }, in order (whole)
   ```
5. `docs/templates.md:335-338`, the comment above the key and its example.
   Current:
   ```
   335:# The categories a venue's category takes, in the order the Venues view offers them.
   336:# venue_categories: []
   337:#   example:
   338:#   venue_categories: [journal, conference, workshop]
   ```
   Replacement (lines 335-338 become these nine lines):
   ```
   # The categories a venue's category takes, in order: `key` the word a venue's category writes,
   # `label` the heading of its section of the Venues view and its word in the venue form, and
   # `ribbon: true` the month ribbon over that section.
   # venue_categories: []
   #   example:
   #   venue_categories:
   #     - { key: journal, label: Journals }
   #     - { key: conference, label: Conferences, ribbon: true }
   #     - { key: workshop, label: Workshops, ribbon: true }
   ```
6. `docs/apps.md:423`, the `config` channel's row. Every field it names is checked against `HubVocab` (`src/lib/data/model/model-collections.ts:217-224`: `domains`, `venue_themes`, `data_themes`, `collections`, `list`, `words`).
   Current:
   ```
   423:| `config` | `{ config, hubs: { primary, lists }, text, icons, host: { name, address }, findings }`; `lists` holds each hub's `{ domains, venue_themes, data_themes }`, built from its domains registry and the `themes` options of its venues and data registries |
   ```
   Replacement:
   ```
   | `config` | `{ config, hubs: { primary, lists }, text, icons, host: { name, address }, findings }`; `lists` holds each hub's `{ domains, venue_themes, data_themes, collections, list, words }`: `domains`, `venue_themes` and `data_themes` built from its domains registry and the `themes` options of its venues and data registries, `collections` the entries the hub lists, `list` its `collections:` list as written with the file it was read from, and `words` its merged vocabulary |
   ```
7. `.scratch/migration/agents/guarded.md`: nothing to change. G124's Test line names `board-rules.test.ts` and its describes, which all stay in that file.

## The case-run programs

### `caserun.config.mts`

```ts
// Case-run config of O81: the worktree's own vite config with its three test projects replaced by
// one node project whose only files are the case-run files of this folder. Each case prints and
// asserts nothing, so requireAssertions is off.
import base from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/vite.config.ts';

const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81';
const S =
    '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o81-cases';

type Made = Record<string, unknown> & { test: Record<string, unknown> };

export default async (env: { mode: string; command: string }) => {
    const made = (await (base as unknown as (one: unknown) => Promise<Made> | Made)(env)) as Made;
    const { projects: _projects, ...test } = made.test;
    return {
        ...made,
        root: W,
        test: {
            ...test,
            name: 'caserun',
            environment: 'node',
            testTimeout: 120000,
            expect: { requireAssertions: false },
            include: [`${S}/*.case.ts`]
        }
    };
};
```

### `before.case.ts`

The file is at the path above, unchanged since its run; its cases, in order: the fold calls of cases 2 to 5 (`focus.foldOpen`, `focus.foldToggled`, the exports of `focus.ts` matching `/fold|group/i`); case 7 over the scratch hub built by `buildOneHub(HUB, portfolioConfigFrom(loadConfig(engineDir(), { hub: HUB, workspace: { file, text: 'folders: []\nsettings:\n  self: axel-faes\n' } }).config))`, the workspace given as text so no workspace file is read; case 8 over three synthetic venues; cases 9, 10, 11 and 25 through `withHub` of `layers-fixture.ts` with `findingLines`, the merged value and `vocabKeys`; case 12 over `parseVenuesState`; case 13 over `choicesFor({ field: 'category', type: 'select', from: 'vocab.venue_categories' }, null, OCULUS, '')`; cases 14 and 15 over `trackRecord` and `selfIds` of that snapshot; case 18 over `offersNewProject` of the Projects preset's rule with `roles: ['lead']` and every other field null, user `me`; cases 19, 20 and 28 over `createClientState`, `registerAll`, `registerCollections`, `pageBoards` and `registerBoards`; cases 21 and 22 over `careerRows` with `boardOf: (role) => career.roleBoard(OCULUS, role, () => true)` and the roles `lead` and `ghost`; case 24 over `unionWords`; case 26 over the scratch hub built with `folders: []` and no `self`, `trackRecord` and `boardItems` with the rule of case 18; case 29 over `catalogOf(OCULUS)` and `writeConfigValue(ENGINE, 'catalogs/vocab.yml', 'venue_categories', <four rows>, <value in force>, { hub: <hub29> })`, then `loadLayers` to read back. The full text:

```ts
// Case-run of O81's cases on the unchanged tree, run from the scratchpad over the worktree by
// absolute paths: prints each case's result, asserts nothing, writes nothing.
import { it } from 'vitest';
import type {
    Project,
    Snapshot,
    Venue
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/data/model/index.ts';
import { portfolioConfigFrom } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/data/index.ts';
import {
    engineDir,
    loadConfig,
    textCatalog,
    unplacedGroup
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/data/sources/config.ts';
import { catalogOf } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/data/sources/config/catalog/options.ts';
import { unionWords, vocabKeys } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/data/shapes/vocab-keys.ts';
import { collectionViews } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/data/snapshot/normalise.ts';
import * as focus from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/boards/focus.ts';
import * as career from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/boards/career.ts';
import * as presets from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/boards/board/presets.ts';
import { boardItems, takeContextOf } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/boards/board/items.ts';
import { offersNewProject } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/boards/board/new-project.ts';
import { selfIds } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/boards/board/team.ts';
import * as venues from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/sources/registries/venues.ts';
import { choicesFor } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/forms/schema.ts';
import { setCatalog } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/shared/words/text.ts';
import { setVocab, vocabOf } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/shared/words/tones.ts';
import { careerRows } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/views/boards/focus/career/career-rows.ts';
import {
    pageBoards,
    registerAll,
    registerBoards,
    registerCollections
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/routes/views.ts';
import { createClientState } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/tests/fixtures/client.ts';
import { fixtureProject } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/tests/fixtures/entities-fixture.ts';
import { writeConfigValue } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/server/edit/writes/config/config-value.ts';
import { loadLayers } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/server/edit/writes/config/config-place.ts';
import { buildOneHub } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/tests/fixtures/hubs/hub-build.ts';
import {
    findingLines,
    withHub
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/tests/data/sources/config/layers/layers-fixture.ts';

const HUB =
    '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o81-hub';
/** Case 29's own copy of the scratch hub's settings, the one place the run writes. */
const HUB29 =
    '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o81-cases/hub29';
const ENGINE = engineDir();
const OCULUS = loadConfig(ENGINE).config;
setCatalog(textCatalog(OCULUS));
setVocab({ primary: null, lists: {}, order: [], own: OCULUS });

const say = (name: string, value: unknown): void => console.log(`${name}: ${JSON.stringify(value)}`);

/** The scratch hub read with its workspace's `self`, given as text so no workspace file is read. */
function scratchHub(self: boolean): { config: Record<string, unknown>; snapshot: Snapshot } {
    const read = loadConfig(ENGINE, {
        hub: HUB,
        workspace: {
            file: `${HUB}/.oculus/workspaces/research-hub.yml`,
            text: self ? 'folders: []\nsettings:\n  self: axel-faes\n' : 'folders: []\n'
        }
    });
    const snapshot = buildOneHub(HUB, portfolioConfigFrom(read.config)).snapshot;
    return { config: read.config, snapshot };
}

function venue(id: string, category: string | undefined): Venue {
    return { id, name: id, themes: [], ...(category === undefined ? {} : { category }) } as Venue;
}

it('O81 first run', () => {
    // Cases 2 to 5: the Focus folds.
    const saved = { closed: ['cluster:now'] };
    for (const key of ['career', 'command', 'tasks', 'cluster:now', 'cluster:parked', 'band']) {
        say(`case 2/3 foldOpen(${JSON.stringify(saved)}, ${key})`, focus.foldOpen(saved, key as never));
    }
    say('case 2 foldToggled({}, cluster:now)', focus.foldToggled({}, 'cluster:now' as never));
    say('case 3 foldToggled({}, band)', focus.foldToggled({}, 'band' as never));
    const old = { closed: ['career'] };
    for (const key of ['career', 'command', 'tasks', 'cluster:now', 'lane:idea', 'band']) {
        say(`case 4 foldOpen(${JSON.stringify(old)}, ${key})`, focus.foldOpen(old, key as never));
    }
    say(
        'case 5 exports of focus.ts naming a fold',
        Object.keys(focus).filter((name) => /fold|group/i.test(name))
    );

    // Case 7: the scratch hub's venues by the section function.
    const withSelf = scratchHub(true);
    const hubVenues = Object.values(withSelf.snapshot.entities.venues);
    const counts: Record<string, number> = {};
    for (const one of hubVenues) counts[one.category ?? '(none)'] = (counts[one.category ?? '(none)'] ?? 0) + 1;
    say('case 7 hub venues by category', counts);
    const split = venues.venuesByCategory(hubVenues);
    say('case 7 venuesByCategory', { journals: split.journals.length, conferences: split.conferences.length });
    say('case 7 hub venue_categories', withSelf.config.venue_categories);

    // Case 8: a workshop venue and one with no category.
    const odd = [venue('j1', 'journal'), venue('w1', 'workshop'), venue('n1', undefined)];
    const oddSplit = venues.venuesByCategory(odd);
    say('case 8 venuesByCategory', {
        journals: oddSplit.journals.map((one) => one.id),
        conferences: oddSplit.conferences.map((one) => one.id)
    });

    // Cases 9, 10, 11, 25: a hub's venue_categories through the merge.
    const hubs: [string, string][] = [
        ['case 9', 'venue_categories: [ { key: conference, label: Conferences, ribbon: true }, { key: journal, label: Journals } ]'],
        ['case 10', 'venue_categories: [journal]'],
        ['case 11 no label', 'venue_categories: [ { key: journal } ]'],
        ['case 11 ribbon yes', 'venue_categories: [ { key: journal, label: Journals, ribbon: yes } ]'],
        ['case 25', "venue_categories: [ { key: journal, label: Journals }, { key: journal, label: Again }, { key: '', label: Empty } ]"]
    ];
    for (const [name, text] of hubs) {
        const read = withHub(`${text}\n`);
        say(`${name} findings`, findingLines(read.findings));
        say(`${name} config.venue_categories`, read.config.venue_categories);
        say(`${name} vocabKeys`, vocabKeys(read.config.venue_categories));
    }

    // Case 12: a saved Venues state.
    say('case 12 parseVenuesState({ journalsOpen: false })', venues.parseVenuesState({ journalsOpen: false }));
    say('case 12 parseVenuesState({ folded: [thesis] })', venues.parseVenuesState({ folded: ['thesis'] }));

    // Case 13: the venue form's category options.
    const field = { field: 'category', type: 'select', from: 'vocab.venue_categories' } as never;
    say('case 13 choicesFor', choicesFor(field, null, OCULUS, ''));

    // Cases 14, 15: the track record on the scratch hub.
    const record = career.trackRecord(withSelf.snapshot, withSelf.config);
    say('case 14 self ids', [...selfIds(withSelf.snapshot)]);
    say('case 14 trackRecord', record);
    say('case 14 record-board functions of presets.ts', Object.keys(presets).filter((name) => /record/i.test(name)));
    const sample = Object.values(withSelf.snapshot.entities.projects).find((one) => one.stage === 'nascent' && one.lead.length > 0);
    say('case 15 a nascent project of the hub', sample === undefined ? null : { id: sample.id, stage: sample.stage, lead: sample.lead });

    // Case 18: G124's rule over a rule that takes the role lead and nothing else.
    const rolePreset = presets.presetFor('projects', OCULUS, () => OCULUS);
    const leadOnly = { ...rolePreset.rule, tiers: null, roles: ['lead'], stages: null, chips: null, forms: null, hub: null, match: null };
    const context = takeContextOf(rolePreset, new Set(['me']));
    say('case 18 offersNewProject(rule taking lead only)', offersNewProject(leadOnly, context));

    // Cases 19, 20, 28: the registry.
    const client = createClientState();
    registerAll(client.registry);
    const collections = collectionViews(OCULUS, unplacedGroup(OCULUS));
    registerCollections(client.registry, collections);
    say('case 18/19/20 registry view track_record', client.registry.viewFor('track_record') ?? null);
    const source = { boards: { track_record: { label: 'views.board_glyph', role: 'lead' } }, group: 'projects', file: 'layout.yml' };
    const taken = pageBoards(source, textCatalog(OCULUS), collections);
    say('case 19 pageBoards(boards: { track_record })', { views: taken.views.map((one) => one.id), findings: taken.findings });
    registerBoards(client.registry, taken);
    say('case 20 after a push holding track_record', client.registry.viewFor('track_record')?.id ?? null);
    registerBoards(client.registry, pageBoards({ ...source, boards: { projects: { role: 'lead' } } }, textCatalog(OCULUS), collections));
    say('case 20 after a push without it', client.registry.viewFor('track_record')?.id ?? null);
    const withCollection = collectionViews(
        { ...OCULUS, collections: [...((OCULUS.collections as unknown[]) ?? []), { key: 'track_record', file: 'x.yml', label: 'X' }] },
        unplacedGroup(OCULUS)
    );
    const second = createClientState();
    registerAll(second.registry);
    registerCollections(second.registry, withCollection);
    say('case 28 collection view track_record registered', second.registry.viewFor('track_record')?.id ?? null);

    // Cases 21, 22: the career rows.
    const base = { title: 'c', situation: [], order: [], sections: {} };
    const rows = careerRows({
        career: base,
        now: Date.parse('2026-10-26'),
        record: {
            roles: [
                { key: 'lead', label: 'Lead', lines: [{ key: 'in-review', label: 'in review', count: 1 }] },
                { key: 'ghost', label: 'Ghost', lines: [{ key: 'in-review', label: 'in review', count: 1 }] }
            ],
            funding: 2
        },
        editable: false,
        boardOf: (role) => career.roleBoard(OCULUS, role, () => true),
        funding: 'funding'
    });
    say('case 21/22 targets', rows.targets);
    say('case 21/22 rows', rows.groups.flatMap((group) => group.rows.map((row) => ({ id: row.id, plain: row.plain ?? false }))));

    // Case 24: the union of two hubs naming journal.
    const union = unionWords([
        { venue_categories: [{ key: 'journal', label: 'Journals' }] },
        { venue_categories: [{ key: 'journal', label: 'Journal papers', ribbon: true }] }
    ]);
    say('case 24 unionWords', union.venue_categories);

    // Case 26: no self.
    const noSelf = scratchHub(false);
    say('case 26 trackRecord with no self', career.trackRecord(noSelf.snapshot, noSelf.config));
    say('case 26 projects of a rule taking lead, with no self', boardItems(noSelf.snapshot, { ...rolePreset, rule: leadOnly }, () => 'none').length);

    // Case 29: the options catalog over the key.
    const entries = catalogOf(OCULUS);
    const found = Object.entries(entries).flatMap(([file, keys]) =>
        Object.hasOwn(keys, 'venue_categories') ? [[file, keys.venue_categories]] : []
    );
    say('case 29 options entry', found);
    const rowsValue = [
        { key: 'journal', label: 'Journals' },
        { key: 'conference', label: 'Conferences', ribbon: true },
        { key: 'thesis', label: 'Theses' },
        { key: 'meeting', label: 'Meetings' }
    ];
    const layers = { hub: HUB29 };
    const before = loadLayers(ENGINE, layers).config.venue_categories;
    const outcome = writeConfigValue(ENGINE, 'catalogs/vocab.yml', 'venue_categories', rowsValue, before, layers);
    say('case 29 write outcome', { changed: outcome.changed, refused: outcome.refused });
    const back = loadLayers(ENGINE, layers);
    say('case 29 read back venue_categories', back.config.venue_categories);
    say('case 29 read back findings naming venue_categories', findingLines(back.findings).filter((one) => one.includes('venue_categories')));

    // Case 28: what a `collections:` entry keyed with a module view's id gives.
    const debug = withHub('collections:\n  - { key: debug, file: notes/x.yml }\n');
    say('case 28 findings of a collections entry keyed debug', findingLines(debug.findings));
    void ({} as Project);
});
```

What it printed (`before.out`, the `case` lines and the summary; the program's last case 28 line reads the merge's findings only, which do not hold the reader of `view_id`, so case 28 rests on `case28.case.ts`):

```
case 2/3 foldOpen({"closed":["cluster:now"]}, career): true
case 2/3 foldOpen({"closed":["cluster:now"]}, command): true
case 2/3 foldOpen({"closed":["cluster:now"]}, tasks): true
case 2/3 foldOpen({"closed":["cluster:now"]}, cluster:now): false
case 2/3 foldOpen({"closed":["cluster:now"]}, cluster:parked): true
case 2/3 foldOpen({"closed":["cluster:now"]}, band): true
case 2 foldToggled({}, cluster:now): {"closed":["cluster:now"]}
case 3 foldToggled({}, band): {"closed":["band"]}
case 4 foldOpen({"closed":["career"]}, career): false
case 4 foldOpen({"closed":["career"]}, command): true
case 4 foldOpen({"closed":["career"]}, tasks): true
case 4 foldOpen({"closed":["career"]}, cluster:now): true
case 4 foldOpen({"closed":["career"]}, lane:idea): true
case 4 foldOpen({"closed":["career"]}, band): true
case 5 exports of focus.ts naming a fold: ["foldOpen","foldToggled"]
case 7 hub venues by category: {"conference":27,"journal":46,"thesis":2,"meeting":1}
case 7 venuesByCategory: {"journals":46,"conferences":27}
case 7 hub venue_categories: ["journal","conference","thesis","meeting"]
case 8 venuesByCategory: {"journals":["j1"],"conferences":[]}
case 9 findings: ["/scratch/lab/.oculus/config.yml | venue_categories.0 | venue_categories.0 must be a text","/scratch/lab/.oculus/config.yml | venue_categories.1 | venue_categories.1 must be a text"]
case 9 config.venue_categories: [{"key":"conference","label":"Conferences","ribbon":true},{"key":"journal","label":"Journals"}]
case 9 vocabKeys: ["conference","journal"]
case 10 findings: []
case 10 config.venue_categories: ["journal"]
case 10 vocabKeys: ["journal"]
case 11 no label findings: ["/scratch/lab/.oculus/config.yml | venue_categories.0 | venue_categories.0 must be a text"]
case 11 no label config.venue_categories: [{"key":"journal"}]
case 11 no label vocabKeys: ["journal"]
case 11 ribbon yes findings: ["/scratch/lab/.oculus/config.yml | venue_categories.0 | venue_categories.0 must be a text"]
case 11 ribbon yes config.venue_categories: [{"key":"journal","label":"Journals","ribbon":"yes"}]
case 11 ribbon yes vocabKeys: ["journal"]
case 25 findings: ["/scratch/lab/.oculus/config.yml | venue_categories.0 | venue_categories.0 must be a text","/scratch/lab/.oculus/config.yml | venue_categories.1 | venue_categories.1 must be a text","/scratch/lab/.oculus/config.yml | venue_categories.2 | venue_categories.2 must be a text"]
case 25 config.venue_categories: [{"key":"journal","label":"Journals"},{"key":"journal","label":"Again"},{"key":"","label":"Empty"}]
case 25 vocabKeys: ["journal","journal",""]
case 12 parseVenuesState({ journalsOpen: false }): {"search":"","off":[],"journalsOpen":false,"conferencesOpen":true}
case 12 parseVenuesState({ folded: [thesis] }): {"search":"","off":[],"journalsOpen":true,"conferencesOpen":true}
case 13 choicesFor: [{"id":"journal","label":"journal"},{"id":"conference","label":"conference"},{"id":"thesis","label":"thesis"},{"id":"meeting","label":"meeting"}]
case 14 self ids: ["axel-faes"]
case 14 trackRecord: (quoted whole under case 14 above)
case 14 record-board functions of presets.ts: []
case 15 a nascent project of the hub: {"id":"asthma-geo-tensor","stage":"nascent","lead":["axel-faes"]}
case 18 offersNewProject(rule taking lead only): true
case 18/19/20 registry view track_record: null
case 19 pageBoards(boards: { track_record }): {"views":["track_record"],"findings":[]}
case 20 after a push holding track_record: "track_record"
case 20 after a push without it: null
case 28 collection view track_record registered: "track_record"
case 21/22 targets: {"career:role:lead":{"kind":"view","view":"projects"},"career:funding":{"kind":"view","view":"funding"}}
case 21/22 rows: [{"id":"career:role:lead","plain":false},{"id":"career:role:ghost","plain":true},{"id":"career:funding","plain":false}]
case 24 unionWords: [{"key":"journal","label":"Journals"},{"key":"journal","label":"Journal papers","ribbon":true}]
case 26 trackRecord with no self: null
case 26 projects of a rule taking lead, with no self: 115
case 29 options entry: [["catalogs/vocab.yml",{"help":"The categories a venue's category takes, in the order the Venues view offers them. A hub's list replaces oculus's whole.","control":"list","default":["journal","conference","thesis","meeting"],"section":"Vocabulary","heading":"boards"}]]
case 29 write outcome: {"changed":[],"refused":[{"field":"catalogs/vocab.yml:venue_categories","reason":"venue_categories.0 must be a text"}]}
case 29 read back venue_categories: ["journal","conference","thesis","meeting"]
case 29 read back findings naming venue_categories: []
case 28 findings of a collections entry keyed debug: []
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

### `case28.case.ts`

```ts
// Case-run of O81's case 28 on the unchanged tree: the findings of a `collections:` list
// (collectionListFindings, the reader of findings.collections.view_id) holding an entry keyed with
// the id of a module's view (`debug`, Debug.svelte's) and, beside it, one keyed with a registry's
// view (`venues`). Prints, asserts nothing, writes nothing.
import { it } from 'vitest';
import {
    engineDir,
    loadConfig,
    textCatalog
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/data/sources/config.ts';
import {
    collectionListFindings,
    listWords
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/data/sources/collections.ts';
import { findingLines } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/tests/data/sources/config/layers/layers-fixture.ts';

it('O81 case 28 first run', () => {
    const config = loadConfig(engineDir()).config;
    for (const key of ['debug', 'track_record', 'venues']) {
        const list = [{ key, file: 'notes/x.yml' }];
        const found = collectionListFindings(list, listWords(config), 'config.yml', textCatalog(config));
        console.log(`case 28 collectionListFindings of an entry keyed ${key}: ${JSON.stringify(findingLines(found))}`);
    }
});
```

What it printed (`case28.out`):

```
case 28 collectionListFindings of an entry keyed debug: []
case 28 collectionListFindings of an entry keyed track_record: []
case 28 collectionListFindings of an entry keyed venues: ["config.yml | collections[0].key | the key venues is the id of one of oculus's own views; the collection gets no card-list view"]
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

Both programs ran with `npx vitest run --config <scratch>/o81-cases/caserun.config.mts --disableConsoleIntercept [<file>]` from the worktree's root, `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`.

### `after.case.ts` (the cases after the change)

At `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o81-cases/after.case.ts`. It prints and asserts nothing. It writes only two hub folders of its own under the scratchpad, `hub28/.oculus/config.yml` (case 28's `collections:` list, written by the program) and `hub29/.oculus/config.yml` (a copy of the scratch hub's settings file alone, so no `local.yml` is in it; case 29's write goes there), and removes both at its end (`ls` of the folder after the run lists neither). It reads the orchestrator's scratch hub `o81-hub` and never writes into it. Run from the worktree's root:

`npx vitest run --config <scratch>/o81-cases/caserun.config.mts --disableConsoleIntercept <scratch>/o81-cases/after.case.ts`

```ts
// Case-run of O81's cases after the change, run from the scratchpad over the worktree by absolute
// paths: prints each case's result and asserts nothing. It writes only its own two hub copies under
// this folder (case 28's list, case 29's settings), and removes them at the end.
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { it } from 'vitest';
import type {
    HubVocabs,
    Snapshot,
    Venue
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/data/model/index.ts';
import {
    hubVocabOf,
    portfolioConfigFrom
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/data/index.ts';
import {
    engineDir,
    loadConfig,
    textCatalog,
    unplacedGroup
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/data/sources/config.ts';
import {
    collectionListFindings,
    listWords
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/data/sources/collections.ts';
import { catalogOf } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/data/sources/config/catalog/options.ts';
import { unionWords, vocabKeys } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/data/shapes/vocab-keys.ts';
import { collectionViews } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/data/snapshot/normalise.ts';
import { rolesOf } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/data/shapes/boards/roles.ts';
import * as focus from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/boards/focus.ts';
import * as career from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/boards/career.ts';
import {
    RECORD_VIEW,
    applyFilters,
    boardItems,
    cardSections,
    recordPreset,
    takeContextOf
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/boards/board/index.ts';
import { offersNewProject } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/boards/board/new-project.ts';
import { selfIds } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/boards/board/team.ts';
import * as venues from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/sources/registries/venues.ts';
import { choicesFor } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/forms/schema.ts';
import { setCatalog, t } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/shared/words/text.ts';
import { setVocab } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/shared/words/tones.ts';
import {
    findView,
    storedState
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/workbench/layout/instance.ts';
import { careerRows } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/views/boards/focus/career/career-rows.ts';
import {
    collectionRefusals,
    pageBoards,
    registerAll,
    registerBoards,
    registerCollections
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/routes/views.ts';
import { createClientState } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/tests/fixtures/client.ts';
import { writeConfigValue } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/server/edit/writes/config/config-value.ts';
import { loadLayers } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/server/edit/writes/config/config-place.ts';
import { buildOneHub } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/tests/fixtures/hubs/hub-build.ts';
import {
    findingLines,
    withHub
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/tests/data/sources/config/layers/layers-fixture.ts';

const S =
    '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad';
const HUB = `${S}/o81-hub`;
const HUB28 = `${S}/o81-cases/hub28`;
const HUB29 = `${S}/o81-cases/hub29`;
const ENGINE = engineDir();
const OCULUS = loadConfig(ENGINE).config;
const CATALOG = textCatalog(OCULUS);
setCatalog(CATALOG);
setVocab({ primary: null, lists: {}, order: [], own: OCULUS });

const say = (name: string, value: unknown): void => console.log(`${name}: ${JSON.stringify(value)}`);

/** The scratch hub read with its workspace's `self`, given as text so no workspace file is read. */
function scratchHub(self: boolean): { config: Record<string, unknown>; snapshot: Snapshot } {
    const read = loadConfig(ENGINE, {
        hub: HUB,
        workspace: {
            file: `${HUB}/.oculus/workspaces/research-hub.yml`,
            text: self ? 'folders: []\nsettings:\n  self: axel-faes\n' : 'folders: []\n'
        }
    });
    const snapshot = buildOneHub(HUB, portfolioConfigFrom(read.config)).snapshot;
    return { config: read.config, snapshot };
}

function venue(id: string, category: string | undefined): Venue {
    return { id, name: id, themes: [], ...(category === undefined ? {} : { category }) } as Venue;
}

/** The sections as `<key or other>: <label> <count> ribbon?`. */
function shown(sections: venues.VenueSection[]): string[] {
    return sections.map(
        (one) =>
            `${one.key === '' ? '(other)' : one.key}: ${one.key === '' ? t('venues.section_other') : one.label} ${one.venues.length}${one.ribbon ? ' ribbon' : ''}`
    );
}

it('O81 after the change', () => {
    // Cases 2 to 5: the Focus folds, every key made by the one exported function.
    const now = focus.groupFold('cluster', 'now');
    const saved = { closed: [now] };
    const keys = [
        'career',
        'command',
        'tasks',
        now,
        focus.groupFold('cluster', 'parked'),
        focus.groupFold('cluster', 'incubate'),
        focus.groupFold('lane', 'idea'),
        focus.groupFold('band')
    ] as focus.FoldKey[];
    say('case 2/3 keys', keys);
    for (const key of keys) say(`case 2 foldOpen(${JSON.stringify(saved)}, ${key})`, focus.foldOpen(saved, key));
    say('case 2 foldToggled({}, cluster:now)', focus.foldToggled({}, now));
    say('case 3 foldToggled({ closed: [cluster:now] }, band)', focus.foldToggled(saved, focus.groupFold('band')));
    const old = { closed: ['career'] };
    for (const key of keys) say(`case 4 foldOpen(${JSON.stringify(old)}, ${key})`, focus.foldOpen(old, key));
    const hubCareer = focus.groupFold('cluster', 'career');
    say('case 5 groupFold(cluster, career)', hubCareer);
    const folded = focus.foldToggled({}, hubCareer);
    say('case 5 fold the hub cluster career, then career banner open?', focus.foldOpen(folded, 'career'));
    const banner = focus.foldToggled({}, 'career');
    say('case 5 fold the banner, then cluster:career open?', focus.foldOpen(banner, hubCareer));

    // Case 7: the scratch hub's venues by the section function.
    const withSelf = scratchHub(true);
    const hubVenues = Object.values(withSelf.snapshot.entities.venues);
    say('case 7 venueSections', shown(venues.venueSections(hubVenues, withSelf.config)));

    // Case 8: a workshop venue and one with no category.
    const odd = [venue('j1', 'journal'), venue('m1', 'meeting'), venue('w1', 'workshop'), venue('n1', undefined)];
    say(
        'case 8 venueSections',
        venues.venueSections(odd, OCULUS).map((one) => [one.key, one.venues.map((v) => v.id)])
    );

    // Cases 9, 10, 11, 25: a hub's venue_categories through the merge.
    const mixed = [
        venue('j1', 'journal'),
        venue('c1', 'conference'),
        venue('t1', 'thesis'),
        venue('t2', 'thesis'),
        venue('m1', 'meeting')
    ];
    const hubs: [string, string][] = [
        ['case 9', 'venue_categories: [ { key: conference, label: Conferences, ribbon: true }, { key: journal, label: Journals } ]'],
        ['case 10', 'venue_categories: [journal]'],
        ['case 11 no label', 'venue_categories: [ { key: journal } ]'],
        ['case 11 ribbon yes', 'venue_categories: [ { key: journal, label: Journals, ribbon: yes } ]'],
        ['case 25', "venue_categories: [ { key: journal, label: Journals }, { key: journal, label: Again }, { key: '', label: Empty } ]"]
    ];
    const field = { field: 'category', type: 'select', from: 'vocab.venue_categories' } as never;
    for (const [name, text] of hubs) {
        const read = withHub(`${text}\n`);
        say(`${name} findings`, findingLines(read.findings));
        say(`${name} sections`, shown(venues.venueSections(mixed, read.config)));
        say(`${name} vocabKeys`, vocabKeys(read.config.venue_categories));
        say(`${name} venue form options`, choicesFor(field, null, read.config, ''));
    }

    // Case 12: a saved Venues state.
    say('case 12 parseVenuesState({ folded: [thesis] })', venues.parseVenuesState({ folded: ['thesis'] }));
    say('case 12 parseVenuesState({ journalsOpen: false })', venues.parseVenuesState({ journalsOpen: false }));

    // Case 13: the venue form's category options from oculus's rows.
    say('case 13 choicesFor', choicesFor(field, null, OCULUS, ''));

    // Cases 14, 15: the track record and the record boards on the scratch hub.
    const wordsOf = () => withSelf.config;
    const record = career.trackRecord(withSelf.snapshot, withSelf.config, wordsOf);
    say('case 14 self ids', [...selfIds(withSelf.snapshot)]);
    for (const role of record?.roles ?? []) {
        const preset = recordPreset(role.key, withSelf.config, wordsOf);
        const sections = cardSections(boardItems(withSelf.snapshot, preset), preset);
        say(`case 14 ${role.key} row`, role.lines.filter((line) => line.count > 0).map((line) => `${line.key} ${line.count}`));
        say(`case 14 ${role.key} board`, sections.map((one) => `${one.key || '(other)'} ${one.items.length}`));
    }
    const lead = boardItems(withSelf.snapshot, recordPreset('lead', withSelf.config, wordsOf)).map((one) => one.id);
    const idea = Object.values(withSelf.snapshot.entities.projects).find(
        (one) => one.stage === 'nascent' && one.lead.includes([...selfIds(withSelf.snapshot)][0])
    );
    say('case 15 a nascent project the user leads', idea === undefined ? null : { id: idea.id, stage: idea.stage });
    say('case 15 on the Lead record board', idea === undefined ? null : lead.includes(idea.id));

    // Case 17: a search and a facet narrow the role's projects, clearing gives the counted set back.
    const leadPreset = recordPreset('lead', withSelf.config, wordsOf);
    const leadItems = boardItems(withSelf.snapshot, leadPreset);
    const searched = applyFilters(leadItems, {}, 'tensor');
    const slice = leadItems[0]?.slice ?? '';
    const faceted = applyFilters(leadItems, { slice: [slice] }, '');
    say('case 17 counts: all / search tensor / one slice / cleared', [
        leadItems.length,
        searched.length,
        faceted.length,
        applyFilters(leadItems, {}, '').length
    ]);
    const client = createClientState();
    registerAll(client.registry);
    const opened = client.layout.openView(RECORD_VIEW, { id: 'lead', label: 'Lead: track record' });
    client.ui.setInstanceState(opened, storedState({ mode: 'list', search: 'tensor', filters: { slice: [slice] } }));
    client.ui.setInstanceState(opened, storedState({ mode: 'cards', search: '', filters: {} }));
    const tab = findView(client.layout.layout(), RECORD_VIEW, 'lead');
    say('case 17 the tab state after two board writes', tab?.state ?? null);
    const again = client.layout.openView(RECORD_VIEW, { id: 'lead', label: 'Lead: track record' });
    const other = client.layout.openView(RECORD_VIEW, { id: 'supervisor', label: 'Supervisor: track record' });
    say('case 16 second Lead press activates the same tab / Supervisor opens another', [again === opened, other !== opened]);

    // Case 18: the registration and G124's answer.
    const registration = client.registry.viewFor(RECORD_VIEW);
    say('case 18 registration', {
        id: registration?.id,
        label: registration?.label,
        glyph: registration?.glyph,
        group: registration?.group,
        listed: registration?.listed,
        badge: registration?.badge !== undefined,
        countPart: registration?.countPart !== undefined
    });
    say(
        'case 18 offersNewProject per role, with self',
        rolesOf(OCULUS).map((role) => {
            const preset = recordPreset(role.key, withSelf.config, wordsOf);
            return [role.key, offersNewProject(preset.rule, takeContextOf(preset, selfIds(withSelf.snapshot)))];
        })
    );

    // Cases 19, 20: a boards: key of the record view's id, and two pushes.
    const collections = collectionViews(OCULUS, unplacedGroup(OCULUS));
    registerCollections(client.registry, collections);
    const source = { boards: { track_record: { role: 'lead' }, projects: { role: 'lead' } }, group: 'projects', file: 'layout.yml' };
    const taken = pageBoards(source, CATALOG, collections);
    say('case 19 pageBoards(boards: { track_record, projects })', { views: taken.views.map((one) => one.id), findings: taken.findings });
    registerBoards(client.registry, taken);
    const held = (one: typeof client.registry) => {
        const found = one.viewFor(RECORD_VIEW);
        return found === undefined ? null : { id: found.id, label: found.label, group: found.group, listed: found.listed };
    };
    say('case 20 the record view after the first push', held(client.registry));
    registerBoards(client.registry, pageBoards({ ...source, boards: { coauthor: { role: 'other' } } }, CATALOG, collections));
    say('case 20 the record view after a second push of other boards', held(client.registry));

    // Cases 21, 22: the career rows.
    const rows = careerRows({
        career: { title: 'c', situation: [], order: [], sections: {} } as never,
        now: Date.parse('2026-10-26'),
        record: {
            roles: [
                { key: 'lead', label: 'Lead', lines: [{ key: 'in-review', label: 'in review', count: 1 }] },
                { key: 'ghost', label: 'Ghost', lines: [{ key: 'in-review', label: 'in review', count: 1 }] }
            ],
            funding: 2
        },
        editable: false,
        funding: 'funding'
    });
    say('case 21/22 targets', rows.targets);
    say('case 21/22 plain rows', rows.groups.flatMap((group) => group.rows.filter((row) => row.plain === true).map((row) => row.id)));

    // Case 24: two hubs both naming journal.
    const union = unionWords([
        { venue_categories: [{ key: 'journal', label: 'Journals' }] },
        { venue_categories: [{ key: 'journal', label: 'Journal papers', ribbon: true }] }
    ]);
    say('case 24 unionWords', union.venue_categories);
    const both = [{ ...venue('a', 'journal'), root: 'hub' }, { ...venue('b', 'journal'), root: 'lab' }] as Venue[];
    say('case 24 sections', venues.venueSections(both, union).map((one) => [one.key, one.label, one.ribbon, one.venues.map((v) => v.id)]));

    // Cases 26, 27: no self, a role roles: no longer holds, no role.
    const noSelf = scratchHub(false);
    const noSelfWords = () => noSelf.config;
    say('case 26 trackRecord with no self', career.trackRecord(noSelf.snapshot, noSelf.config, noSelfWords));
    say('case 26 Lead record board with no self', boardItems(noSelf.snapshot, recordPreset('lead', noSelf.config, noSelfWords)).length);
    say('case 26 record board of a role roles: does not hold, with self', boardItems(withSelf.snapshot, recordPreset('gone', withSelf.config, wordsOf)).length);
    say('case 26 the empty message', t('board.empty'));
    say('case 27 record board with no role', boardItems(withSelf.snapshot, recordPreset(null, withSelf.config, wordsOf)).length);
    say('case 27 the message', t('board.record_no_role'));
    say('case 14 the title word', t('board.record_title', 'Lead'));

    // Case 28: collections entries keyed with module view ids, through a hub of this run's own.
    mkdirSync(`${HUB28}/.oculus`, { recursive: true });
    writeFileSync(
        `${HUB28}/.oculus/config.yml`,
        [
            'collections:',
            '  - { key: debug, file: notes/debug.yml }',
            '  - { key: track_record, file: notes/record.yml }',
            '  - { key: venues, file: notes/venues.yml }',
            '  - { key: reading, file: notes/reading.yml }',
            ''
        ].join('\n')
    );
    const read28 = loadConfig(ENGINE, { hub: HUB28 });
    const vocab28 = hubVocabOf(HUB28, portfolioConfigFrom(read28.config, read28.from));
    const hubs28: HubVocabs = { primary: 'hub28', lists: { hub28: vocab28 }, order: ['hub28'], own: OCULUS, ownCollections: [] };
    say('case 28 data-side findings of the list (unchanged reader)', collectionListFindings(read28.config.collections, listWords(read28.config), vocab28.list.file, CATALOG));
    const refused = collectionRefusals(hubs28, CATALOG);
    say('case 28 collectionRefusals', refused);
    const page = createClientState();
    registerAll(page.registry);
    page.registry.refuse('collections', refused);
    registerBoards(page.registry, pageBoards(source, CATALOG, collections));
    say('case 28 registry.refused() after the boards registered', page.registry.refused());
    registerBoards(page.registry, pageBoards({ ...source, boards: { coauthor: { role: 'other' } } }, CATALOG, collections));
    say('case 28 registry.refused() after a push with no left-out board', page.registry.refused());
    say('case 28 the record view after both sources refused', held(page.registry));

    // Case 29: the options catalog over the key, and a write to this run's own copy of the hub.
    const found = Object.entries(catalogOf(OCULUS)).flatMap(([file, entries]) =>
        Object.hasOwn(entries, 'venue_categories') ? [[file, entries.venue_categories]] : []
    );
    say('case 29 options entry', found);
    mkdirSync(`${HUB29}/.oculus`, { recursive: true });
    cpSync(`${HUB}/.oculus/config.yml`, `${HUB29}/.oculus/config.yml`);
    const rowsValue = [
        { key: 'journal', label: 'Journals' },
        { key: 'conference', label: 'Conferences', ribbon: true },
        { key: 'workshop', label: 'Workshops', ribbon: true }
    ];
    const layers = { hub: HUB29 };
    const before = loadLayers(ENGINE, layers).config.venue_categories;
    const outcome = writeConfigValue(ENGINE, 'catalogs/vocab.yml', 'venue_categories', rowsValue, before, layers);
    say('case 29 write outcome', { changed: outcome.changed, refused: outcome.refused });
    const back = loadLayers(ENGINE, layers);
    say('case 29 read back venue_categories', back.config.venue_categories);
    say('case 29 read back findings', findingLines(back.findings));

    rmSync(HUB28, { recursive: true, force: true });
    rmSync(HUB29, { recursive: true, force: true });
});
```

What it printed, from the terminal (no redirect):

```
 RUN  v4.1.11 /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81
case 2/3 keys: ["career","command","tasks","cluster:now","cluster:parked","cluster:incubate","lane:idea","band"]
case 2 foldOpen({"closed":["cluster:now"]}, career): true
case 2 foldOpen({"closed":["cluster:now"]}, command): true
case 2 foldOpen({"closed":["cluster:now"]}, tasks): true
case 2 foldOpen({"closed":["cluster:now"]}, cluster:now): false
case 2 foldOpen({"closed":["cluster:now"]}, cluster:parked): true
case 2 foldOpen({"closed":["cluster:now"]}, cluster:incubate): true
case 2 foldOpen({"closed":["cluster:now"]}, lane:idea): true
case 2 foldOpen({"closed":["cluster:now"]}, band): true
case 2 foldToggled({}, cluster:now): {"closed":["cluster:now"]}
case 3 foldToggled({ closed: [cluster:now] }, band): {"closed":["cluster:now","band"]}
case 4 foldOpen({"closed":["career"]}, career): false
case 4 foldOpen({"closed":["career"]}, command): true
case 4 foldOpen({"closed":["career"]}, tasks): true
case 4 foldOpen({"closed":["career"]}, cluster:now): true
case 4 foldOpen({"closed":["career"]}, cluster:parked): true
case 4 foldOpen({"closed":["career"]}, cluster:incubate): true
case 4 foldOpen({"closed":["career"]}, lane:idea): true
case 4 foldOpen({"closed":["career"]}, band): true
case 5 groupFold(cluster, career): "cluster:career"
case 5 fold the hub cluster career, then career banner open?: true
case 5 fold the banner, then cluster:career open?: true
case 7 venueSections: ["journal: Journals 46","conference: Conferences 27 ribbon","thesis: Theses 2","meeting: Meetings 1"]
case 8 venueSections: [["journal",["j1"]],["meeting",["m1"]],["",["w1","n1"]]]
case 9 findings: []
case 9 sections: ["conference: Conferences 1 ribbon","journal: Journals 1","(other): Other 3"]
case 9 vocabKeys: ["conference","journal"]
case 9 venue form options: [{"id":"conference","label":"Conferences"},{"id":"journal","label":"Journals"}]
case 10 findings: ["/scratch/lab/.oculus/config.yml | venue_categories.0 | venue_categories.0 must be a map"]
case 10 sections: ["(other): Other 5"]
case 10 vocabKeys: ["journal"]
case 10 venue form options: [{"id":"journal","label":"journal"}]
case 11 no label findings: ["/scratch/lab/.oculus/config.yml | venue_categories.0.label | venue_categories.0.label must be a text"]
case 11 no label sections: ["journal: journal 1","(other): Other 4"]
case 11 no label vocabKeys: ["journal"]
case 11 no label venue form options: [{"id":"journal","label":"journal"}]
case 11 ribbon yes findings: ["/scratch/lab/.oculus/config.yml | venue_categories.0.ribbon | venue_categories.0.ribbon must be true or false"]
case 11 ribbon yes sections: ["journal: Journals 1","(other): Other 4"]
case 11 ribbon yes vocabKeys: ["journal"]
case 11 ribbon yes venue form options: [{"id":"journal","label":"Journals"}]
case 25 findings: ["/scratch/lab/.oculus/config.yml | venue_categories.2.key | venue_categories.2.key is not a value this key takes"]
case 25 sections: ["journal: Journals 1","(other): Other 4"]
case 25 vocabKeys: ["journal","journal",""]
case 25 venue form options: [{"id":"journal","label":"Journals"},{"id":"journal","label":"Again"},{"id":"","label":"Empty"}]
case 12 parseVenuesState({ folded: [thesis] }): {"search":"","off":[],"folded":["thesis"]}
case 12 parseVenuesState({ journalsOpen: false }): {"search":"","off":[],"folded":[]}
case 13 choicesFor: [{"id":"journal","label":"Journals"},{"id":"conference","label":"Conferences"},{"id":"thesis","label":"Theses"},{"id":"meeting","label":"Meetings"}]
case 14 self ids: ["axel-faes"]
case 14 lead row: ["in-review 9","in-flight 16","publications 10","other-outputs 9"]
case 14 lead board: ["in-review 9","in-flight 16","publications 10","other-outputs 9"]
case 14 supervisor row: ["in-review 4"]
case 14 supervisor board: ["in-review 4"]
case 14 collaborator row: ["in-review 1","in-flight 2","publications 6","other-outputs 6"]
case 14 collaborator board: ["in-review 1","in-flight 2","publications 6","other-outputs 6"]
case 15 a nascent project the user leads: {"id":"asthma-geo-tensor","stage":"nascent"}
case 15 on the Lead record board: false
case 17 counts: all / search tensor / one slice / cleared: [44,26,5,44]
case 17 the tab state after two board writes: {"id":"lead","label":"Lead: track record"}
case 16 second Lead press activates the same tab / Supervisor opens another: [true,true]
case 18 registration: {"id":"track_record","label":"views.track_record","glyph":"views.track_record_glyph","group":"","listed":false,"badge":false,"countPart":false}
case 18 offersNewProject per role, with self: [["lead",false],["supervisor",false],["collaborator",false],["other",false]]
case 19 pageBoards(boards: { track_record, projects }): {"views":["projects"],"findings":[{"file":"layout.yml","key":"boards.track_record","message":"the board track_record has the key of a view oculus's modules or a collection register; the board is not registered"}]}
case 20 the record view after the first push: {"id":"track_record","label":"views.track_record","group":"","listed":false}
case 20 the record view after a second push of other boards: {"id":"track_record","label":"views.track_record","group":"","listed":false}
case 21/22 targets: {"career:role:lead":{"kind":"view","view":"track_record","state":{"id":"lead","label":"Lead: track record"}},"career:role:ghost":{"kind":"view","view":"track_record","state":{"id":"ghost","label":"Ghost: track record"}},"career:funding":{"kind":"view","view":"funding"}}
case 21/22 plain rows: []
case 24 unionWords: [{"key":"journal","label":"Journals"}]
case 24 sections: [["journal","Journals",false,["a","b"]]]
case 26 trackRecord with no self: null
case 26 Lead record board with no self: 0
case 26 record board of a role roles: does not hold, with self: 0
case 26 the empty message: "No entries match."
case 27 record board with no role: 0
case 27 the message: "This tab was opened for no role. Press a role of the Career banner's Track record to open its projects."
case 14 the title word: "Lead: track record"
case 28 data-side findings of the list (unchanged reader): [{"file":"/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o81-cases/hub28/.oculus/config.yml","key":"collections[2].key","message":"the key venues is the id of one of oculus's own views; the collection gets no card-list view"}]
case 28 collectionRefusals: [{"file":"/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o81-cases/hub28/.oculus/config.yml","key":"collections[0].key","message":"the key debug is the id of one of oculus's own views; the collection gets no card-list view"},{"file":"/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o81-cases/hub28/.oculus/config.yml","key":"collections[1].key","message":"the key track_record is the id of one of oculus's own views; the collection gets no card-list view"}]
case 28 registry.refused() after the boards registered: [{"file":"/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o81-cases/hub28/.oculus/config.yml","key":"collections[0].key","message":"the key debug is the id of one of oculus's own views; the collection gets no card-list view"},{"file":"/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o81-cases/hub28/.oculus/config.yml","key":"collections[1].key","message":"the key track_record is the id of one of oculus's own views; the collection gets no card-list view"},{"file":"layout.yml","key":"boards.track_record","message":"the board track_record has the key of a view oculus's modules or a collection register; the board is not registered"}]
case 28 registry.refused() after a push with no left-out board: [{"file":"/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o81-cases/hub28/.oculus/config.yml","key":"collections[0].key","message":"the key debug is the id of one of oculus's own views; the collection gets no card-list view"},{"file":"/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o81-cases/hub28/.oculus/config.yml","key":"collections[1].key","message":"the key track_record is the id of one of oculus's own views; the collection gets no card-list view"}]
case 28 the record view after both sources refused: {"id":"track_record","label":"views.track_record","group":"","listed":false}
case 29 options entry: [["catalogs/vocab.yml",{"help":"The categories a venue's category takes, in the order the venue form offers them and the Venues view draws a section for each. A venue whose category no row names is drawn under Other. A hub's list replaces oculus's whole.","fields":{"key":{"help":"the word a venue's category writes","control":"text"},"label":{"help":"the words the category's section of the Venues view is headed by","control":"text"},"ribbon":{"help":"on draws the month ribbon of the venues' deadlines and meetings over the category's section","control":"toggle"}},"default":[{"key":"journal","label":"Journals"},{"key":"conference","label":"Conferences","ribbon":true},{"key":"thesis","label":"Theses"},{"key":"meeting","label":"Meetings"}],"section":"Vocabulary","heading":"boards"}]]
case 29 write outcome: {"changed":["catalogs/vocab.yml:venue_categories"],"refused":[]}
case 29 read back venue_categories: [{"key":"journal","label":"Journals"},{"key":"conference","label":"Conferences","ribbon":true},{"key":"workshop","label":"Workshops","ribbon":true}]
case 29 read back findings: []
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

A run after the last change of the tree prints the same lines: `diff` of a fresh run's output (blank, `Start at` and `Duration` lines dropped) against the block above gives `diff exit 0`.

## Runs of the verify list and whole-suite commands

The verify list's check (`npm run diagrams && npm run test:quick -- --base 335db1c9`) ran three times.

1. The first run passed (`test:quick: 352.8 s; every command passed`, `verify exit 0`). After it, the size count showed `src/lib/data/model/index.ts` at 882 and `board-rules.test.ts` at 885, so both were split (judgment call 6).
2. The second run, after the last change of the tree, ran while the after-change case-run program ran beside it. It failed on time-outs only (`Test timed out in 5000ms` / `20000ms`, and `Timeout waiting for worker to respond` for `tests/ui/html.dom.test.ts`): `vitest` had `Tests 4 failed | 2769 passed`, `vitest slow` had `Tests 11 failed | 680 passed`, and the result was `failed: vitest, vitest slow`. The files that timed out were `hub-portfolio.test.ts`, `workspace-projects.test.ts`, `language.test.ts`, `rail.test.ts`, `file-undo.test.ts`, `hub-routing.test.ts` and `html.dom.test.ts`. Run alone by name, all seven pass: `Test Files  7 passed (7)`, `Tests  57 passed (57)`.
3. The third run, with nothing else of mine running and no change since the second, passed. The table quotes it. No whole-suite command ran: no `npm test`, `npm run test:checks`, `npm run test:landing`, `npm run test:slow`, or `npx vitest run` with no file named.

Test files run by name after the change: `hub-vocab.test.ts`, `board-rules.test.ts`, `config-folder.test.ts`, `keys.test.ts` and `hub-names.test.ts` together (`Test Files  5 passed (5)`, `Tests  193 passed | 2 skipped (195)`). Then `hub-vocab.test.ts`, `config-folder.test.ts` and `board-rules.test.ts` one by one, as in the table, and `board-rules.test.ts` once more after its fixtures moved (`Tests  104 passed (104)`). On the unchanged tree, the first run ran `hub-vocab.test.ts` (one row) and `board-rules.test.ts` (the New project describe).

## Greps, and the asynchronous paths

- The name grep. These names were removed or moved: `roleBoard`, `boardOf`, `venuesByCategory`, `journalsOpen`, `conferencesOpen`, `venues.journals`, `venues.conferences`, `boardsGroup` (re-export), `FoldHead`'s path, and the hub vocabulary types' file. Verify grep 6 is in the table. `grep -rn "card/FoldHead\|card/GroupHead\|shared/card/heads" src tests docs utils config --exclude=local.yml` gives only the new `heads/` paths in imports and comments, each true (`Projects.svelte:72,94`, `CommandCenterView.svelte:18`, `CareerPanel.svelte:6,47`, `Tasks.svelte:18`, `Band.svelte:16,22`, `Lanes.svelte:9,29`, `Venues.svelte:18,33`). `grep -rn "FoldHead\|GroupHead\|HubVocab\|ListedCollection\|venuesByCategory\|roleBoard" docs --include='*.md'` prints nothing.
  - Head comments rewritten, each read against its code: `FoldHead.svelte`, `GroupHead.svelte`, `Projects.svelte`, `Lanes.svelte`, `Band.svelte`, `Focus.svelte`, `Venues.svelte`, `venues.ts`, `career.ts`, `career-rows.ts`, `CareerPanel.svelte`, `takes.ts`, `presets.ts`, `model-collections.ts`, `board-rules.test.ts` and `keys.test.ts` (the `COMPUTED_FINDING_KEYS` comment).
  - The docs' sentences are under "Doc text".
- The history grep over the added lines (`git diff 335db1c9 -- src config tests` and the two new files, `+` lines, case-insensitive): `no longer\|used to\|previously\|formerly\|was \|were \|replaced\|replaces\|instead of\|in place of\|anymore\|any more\|\bnow\b\|\bold\b\|legacy\|ruling\|\bO[0-9][0-9]\b\|\bZ[0-9]\{3,4\}\|\bstep\b\|revert\|earlier`. Every hit is a present-tense description or a variable:
  - "was read from" (the file a list is read from; `index.ts`, `model-collections.ts` and `views.ts` comments);
  - "This tab was opened for no role" (the case 27 word);
  - "that was obtained" (`career.ts`, obtained funding);
  - "the order the sources were first refused" (`registry.ts`);
  - "never replaces a built-in view" (`views.ts`);
  - the prop `now` (`Band.svelte`, `Lanes.svelte`);
  - "this page was built from" (`+page.svelte`).

  No hit is history. The brief's grep 9 prints nothing.
- The reuse grep before each new helper or type, on the base copy (`grep -rln <name> src tests` in `.agents/worktrees/O81-base`):
  - `listFindings`, `viewIdProblems`, `listFileOf`, `groupFold`, `venueSections`, `recordPreset`, `wordsReader`, `collectionRefusals` and `board-fixture` have no hit.
  - `drawnBy` hits `src/lib/state/workbench/layout/nested.ts:78`, an exported function over pages, unrelated; the one in `presets.ts:482` is local to its module.
  - `GroupHead` hits only `DropdownMenu.GroupHeading`, `Command.GroupHeading` and the like.
  - The key call `findings.collections.view_id` is worded once, at `hub-names.ts:420` on the base, so the new branch reuses that reader and its word instead of adding one.
  - The venue row shape reuses `rowsShape` (`src/lib/data/shapes/shapes.ts:179`), with 77 calls in the base's `src`.
- Asynchronous paths: none is added or changed. `collectionRefusals`, `registry.refuse`, `registerBoards`, `registerCollections`, `recordPreset`, `venueSections` and the fold functions are synchronous. The push handler in `+page.svelte` calls them inside `untrack`, in the same synchronous block as `registerCollections`, so a superseding push replaces the `'collections'` refusals with its own, and a closed page holds nothing. `openView` is synchronous.

# Repair round 1

Everything in the round is done.

One check result to read first. The verify list ran once, after the round's last change. It was red on time-outs only, in six files the step does not change: eleven tests timed out in five files, and one file (`tests/ui/html.dom.test.ts`) had its worker time out at start. `git status --short` over the six files prints nothing, and `git diff 335db1c9 --stat` over them prints nothing. Run alone by name, all six pass. The machine was under load: `uptime` during the reruns gave `load averages: 8.97 16.28 16.21`. Following the round brief, the list was not run again for them. The run and the reruns are under "Checks".

## Items

| Item | What changed | File and line | Check |
| --- | --- | --- | --- |
| 1, Doc text quotes whole lines and places | The report's "Doc text" section is rewritten. Each item quotes the current line as `grep -n` prints it, then the whole replacement line. The Venues bullet is placed between `docs/HELP.md:311` (the last sub-bullet of **Data.**) and `:312` (**Present.**), both quoted | this report, "Doc text" (above, and whole below) | Each quoted current line was looked up with `grep -Fxq` of `grep -n "" <file> \| sed -n "<n>p"` in this report: `docs/HELP.md:287 match`, `:292 match`, `:311 match`, `:312 match`, `docs/data-map.md:117 match`, `docs/templates.md:335`, `:336`, `:337`, `:338 match`, `docs/apps.md:423 match`. A word diff (`diff` of the two lines split one word per line) of each replacement against its current line: for `:292` the one hunk is `with` to `of the fold control,`; for `:287` the hunks fall in two regions, words 172-210 (the cluster-heading sentences and the fold sentence added after them) and words 1544-1563 (the Track record role-row sentence) |
| 2, one type for the words reader | The local `type VocabOf` is removed. `wordsReader`, `presetFor` and `recordPreset` take `WordsOf` from `vocab-keys.ts`, as `career.ts:19,72` does | `src/lib/state/boards/board/presets.ts:20` (import), `:463` (`wordsReader(vocab: WordsOf)`), `:497` (`presetFor`), `:534` (`recordPreset`) | `grep -n "VocabOf\|WordsOf" presets.ts` gives only `:20`, `:463`, `:497`, `:534`, all `WordsOf`; prettier `All matched files use Prettier code style!`; eslint clean; svelte-check `0 ERRORS` in the verify run; `board-rules.test.ts` `Tests  104 passed (104)` |
| 3, the edits to existing assertions and allow lists | The table below | `tests/checks/source/keys.test.ts:168`, `tests/data/sources/config/layers/hub-vocab.test.ts:194`, `:206-208` | `git diff 335db1c9 -- tests`: these are the only changed lines of an existing assertion, allow list or predicate. `board-rules.test.ts` only adds assertions (the three new rows) and moves fixtures. `hub-names.test.ts` adds one fixture field (`list: { file: '', value: collections }`, `:278`), which is input to an unchanged assertion |
| 4, `list` on the `config` channel | `HubVocab` keeps `list`. "Doc text" item 6 gives the `docs/apps.md:423` row and its replacement, each field checked against `HubVocab` (`model-collections.ts:217-224`). "Visible changes" item 9 gives the payload before and after | this report, "Doc text" item 6 and "Visible changes" item 9 | `grep -n "export type HubVocab = {" -A 8 src/lib/data/model/model-collections.ts` lists `domains`, `venue_themes`, `data_themes`, `collections`, `list`, `words`. `ConfigPayload.hubs: HubVocabs` is at `model/index.ts:272`, and `hubVocabOf` fills `list` at `data/index.ts:666` |

## The edits to existing assertions, allow lists and predicates

| File:line | Before | After |
| --- | --- | --- |
| `tests/checks/source/keys.test.ts:168` (allow list `COMPUTED_FINDING_KEYS`) | `{ file: 'lib/data/sources/collections.ts', key: 'one.word' }` | `{ file: 'lib/data/helpers/hub-names.ts', key: 'one.word' }` |
| `tests/data/sources/config/layers/hub-vocab.test.ts:194` (the input row the assertion reads) | `'venue_categories: [journal]',` | `'venue_categories: [ { key: journal, label: Journals, ribbon: true } ]',` |
| `tests/data/sources/config/layers/hub-vocab.test.ts:206` (assertion; one line before, three after) | `expect(read.config.venue_categories).toEqual(['journal']);` | `expect(read.config.venue_categories).toEqual([` / `{ key: 'journal', label: 'Journals', ribbon: true }` / `]);` (`:206-208`) |

Why each one changed:

- The allow-list entry follows the computed `findingText` call, which moved from `collections.ts` into `listFindings` in `hub-names.ts`. It is the same exemption for the same call.
- The hub-vocab row and its expectation are item 4's: `venue_categories` is now rows.

## Doc text (the rewritten section, whole)

Not applied; the orchestrator applies these at landing. Each item quotes the current line as `grep -n <pattern> <file>` prints it, then the whole line that replaces it. A replacement line keeps every word of the current line except the sentences it names.

1. `docs/HELP.md:287`, the **Focus.** note: two sentences change. The cluster-heading sentence gains the count, the lane colour and the folds. The Track record sentence says that a role row opens the role's track record board.
   Current:
   ```
   287:- **Focus.** One page, top to bottom, of the sections `sections` under `focus:` in `config/defaults/behavior.yml` lists, in its order: oculus's list is the Career banner (`career`), the command center (`command_center`), the tasks (`tasks`), the quick add (`quick_add`), the Awaiting box (`awaiting`), the Funding | positions | teaching band (`band`) and the lanes (`lanes`, with the message of a board with no project). A section the list leaves out is not drawn; a word that is no section and a section listed twice are findings, and the rest is drawn once each; a value that is no list is a finding and oculus's list is drawn. The line saying what a write answered is drawn after the quick add, or at the top of the board when the list leaves the quick add out. The lanes are grouped by the clusters of `focus_clusters` in `vocab.yml`, in its order, each lane in the cluster its row of `focus_lanes` names: a `columns` cluster draws its lanes side by side under a heading of its `label` and `glyph` words (Now, Parked and Incubation in oculus's list), muted when its row says `muted: true`; a `full_width` cluster draws each of its lanes as a section of its own under the lane's label (the Idea lane). A cluster with `sort: title` orders its cards by title, the others by deadline, then title, and the Awaiting box counts the projects on the lanes of the clusters with `awaiting: true`. A lane naming no cluster, or one no readable row has, is a finding and is not drawn. The Filter action in the header opens a list that stays open while you pick: Mine only, on at the start, which keeps what names you in `lead:`, `collaborators:` or `supervisors:` and what names no one; Role, the roles that have a field, all ticked, where unticking a role hides what you hold that role on; Tier, the words of `tiers:`, all ticked, which applies to projects only; and Hub, one row per hub, all ticked, drawn only while the workspace has more than one hub. Mine only and Role are drawn only while a person has `self: true`. Whether Mine only is offered is read on the whole page, with every role, tier and hub ticked: when it would hide nothing there it is drawn disabled, its tip saying everything here is yours, and is not applied; when it would hide something it applies together with the rest of the choice. The filter applies to the command center, the tasks, the Awaiting box, the band and the lanes. A calendar line, a lead, a refresh nudge and the Career banner are never hidden, and a collection entry is filtered by role only when its file's `schema:` declares `lead`, `collaborators` or `supervisors`. The Filter button is drawn pressed while the filter hides something, each section that hides rows says how many on its heading ("3 hidden"), and a lane the filter empties keeps its heading and its count. The tab keeps the choice, so a reload or a move of the tab keeps it. Each lane's heading draws its glyph, the `icon` of its row of `focus_lanes:`, and the Focus glyph for a row naming none or a name the glyph catalog lacks. A project sits on the lane its `stage:` gives: Run exploring, Push in-prep and submit-ready, Revise revision, Review submitted, Scope scoping, De-risk de-risking, Build building, and the Idea lane nascent, which takes a project of any tier. A project whose `status.chips` carry `blocked` or `parked` sits on Blocked or Backburner whatever its stage, and on Blocked when it carries both, unless its stage is done. A released, published, failed or stopped project sits on no lane, and one carrying `blocked` or `parked` is an audit finding naming the chip. A card draws its name alone on its first line, with its deadline and its menu, and under it its tags, each a glyph and its words with a tip naming its kind ("Stage: Submitted"), as a project board card draws its facts. The tags are every status mark its lane does not already say: its stage, unless the lane lists that stage alone, in the stage's colour, its form and its chips but the lane's own chip, each in its word's colour and a chip carrying `blocked` in red, each word once; then your role on the project, only while a person has `self: true`, and its tier, each unless its row of `roles:` or `tiers:` carries `unmarked: true` (oculus sets it on Lead and on `research`, and a hub may set it on any number of roles and tiers, or none); and the venue's short name, or its name when it has none, at a stage that carries `placed`, with the venue's whole name in the tip. Every tag is drawn, the tags wrapping onto further lines when the card is narrow, and a long venue name is cut with an ellipsis. Under the tags a card says whom it waits on, the people and projects its `waiting-on:` names, or Blocked while a chip carries `blocked`; a submitted project's review is said only in the Awaiting box. Dropping a card on a lane, or picking the lane in the card's menu, writes what the lane's `move_writes` in `focus_lanes` names: onto a lane of chips (Blocked, Backburner) its `chip`, when the card carries none of the lane's chips, with the chips of the other lanes of chips taken off and the stage kept; onto a lane of stages its `stage` when the lane does not hold the card's stage, with `blocked` and `parked` taken off. Oculus's lanes write Run exploring, Push in-prep, Revise revision, Review submitted, Blocked `blocked`, Backburner `parked`, Scope scoping, De-risk de-risking, Build building and Idea nascent. A lane without `move_writes` takes no move, and a `move_writes` naming a word the lane does not list, both fields or the field of the other kind of lane is a finding naming the lane. The card's menu offers only the lanes it may go to, so a done project has no Blocked or Backburner lane. A move that changes both the stage and the chips is two changes, and one Undo takes back one of them. A project whose stage is in flight or an idea and that no lane takes, which happens only when a hub's `focus_lanes:` leaves its stage out, is named in the command center's Needs attention group, with a link that opens it. Deadlines, due follow-ups and open subtasks are lines of the ticker. Done on a follow-up line takes that note out of its list, and the quick add appends a note to the list of the project it names. A funding scheme's deadline and follow-up lines open the Funding view, a conference call opens the Venues view, and an entry whose status keeps its lines live (`live_subtasks`) shows its follow-ups as it shows its subtasks. A dated deadline stays while it lies inside `deadline_horizon_days` of `focus:` and until the project's stage carries `deadline_met` (`submitted`). A band card whose status has met or closed its deadline, a status carrying `deadline_met` (`submitted`) or `closes_deadline` in its hub's words, shows no countdown. A task line has an `agent` button that opens the composer with the task. The Awaiting box has one row per kind that has something (Waiting on, Under review, Applications, Grants, Blocked), and a name waited on more than once carries its count, as in "BSPC (2)". The Career banner, headed Career, is open on a new Focus tab and folds like the command center, and a reload or a move of the tab keeps it folded or open; a find-in-page match inside the folded banner unfolds it. Its rows stand in the command center's box and two columns, in groups in this order, each drawn only when it has a row: Next, the milestone, with its day and the days left to it as the tail, the day followed by words such as "in 23 days" or "3 days ago", red once the day has passed and amber within 14 days of it; Goal; Situation, one row per fact with its value as the tail; Order of work, one row per task with its note after it and its date as the tail, and the order's own note under the rows; Track record, one row per role with the count of each record row of `categories:` it has projects in as the tail, as in "3 in review, 2 in flight", then Funding obtained. A press on a Next, Goal, Situation or Order of work row opens the career file at that entry's line, and when the file does not hold the entry the board's outcome line says so. Under the pointer such a row carries Edit, which opens the banner's editor at that section, and, for each web address its words hold, an Open link button named by the address's host, which opens the address in a new browser tab. Edit in the heading row opens the editor over the whole career file, unfolding the banner first when it is folded, and Close editor closes it; a career file with no `schema:` has no editor and no Edit. A Track record role row opens the first board of `boards:` that takes the role, so Lead opens Projects, Supervisor Supervision and Collaborator Coauthor, and Funding obtained opens the Funding view; these rows carry no button. The track record counts the projects of every hub whose lead, supervisors or collaborators name you (the workspace setting `self`), in the record rows of `categories:` (in review, in flight, publications, other outputs), never summed. Funding obtained counts the funding entries you lead whose status is obtained (awarded, granted), drawn only when at least one is. With no `self`, or with no project in a record row and no obtained funding, the track record is not drawn. A hub with no career file has no banner.
   ```
   Replacement:
   ```
   - **Focus.** One page, top to bottom, of the sections `sections` under `focus:` in `config/defaults/behavior.yml` lists, in its order: oculus's list is the Career banner (`career`), the command center (`command_center`), the tasks (`tasks`), the quick add (`quick_add`), the Awaiting box (`awaiting`), the Funding | positions | teaching band (`band`) and the lanes (`lanes`, with the message of a board with no project). A section the list leaves out is not drawn; a word that is no section and a section listed twice are findings, and the rest is drawn once each; a value that is no list is a finding and oculus's list is drawn. The line saying what a write answered is drawn after the quick add, or at the top of the board when the list leaves the quick add out. The lanes are grouped by the clusters of `focus_clusters` in `vocab.yml`, in its order, each lane in the cluster its row of `focus_lanes` names: a `columns` cluster draws its lanes side by side under a heading of its `glyph` and `label` words with the count of the cards on its lanes (Now, Parked and Incubation in oculus's list), its lanes muted when its row says `muted: true`; a `full_width` cluster draws each of its lanes as a section of its own under the lane's label in the lane's colour with the lane's count (the Idea lane). Each cluster, each such lane section and the Funding | positions | teaching band, headed by its count, folds by the control before its heading, and the tab remembers it, so a reload or a move of the tab keeps it folded; a find-in-page match inside a folded one unfolds it. A cluster with `sort: title` orders its cards by title, the others by deadline, then title, and the Awaiting box counts the projects on the lanes of the clusters with `awaiting: true`. A lane naming no cluster, or one no readable row has, is a finding and is not drawn. The Filter action in the header opens a list that stays open while you pick: Mine only, on at the start, which keeps what names you in `lead:`, `collaborators:` or `supervisors:` and what names no one; Role, the roles that have a field, all ticked, where unticking a role hides what you hold that role on; Tier, the words of `tiers:`, all ticked, which applies to projects only; and Hub, one row per hub, all ticked, drawn only while the workspace has more than one hub. Mine only and Role are drawn only while a person has `self: true`. Whether Mine only is offered is read on the whole page, with every role, tier and hub ticked: when it would hide nothing there it is drawn disabled, its tip saying everything here is yours, and is not applied; when it would hide something it applies together with the rest of the choice. The filter applies to the command center, the tasks, the Awaiting box, the band and the lanes. A calendar line, a lead, a refresh nudge and the Career banner are never hidden, and a collection entry is filtered by role only when its file's `schema:` declares `lead`, `collaborators` or `supervisors`. The Filter button is drawn pressed while the filter hides something, each section that hides rows says how many on its heading ("3 hidden"), and a lane the filter empties keeps its heading and its count. The tab keeps the choice, so a reload or a move of the tab keeps it. Each lane's heading draws its glyph, the `icon` of its row of `focus_lanes:`, and the Focus glyph for a row naming none or a name the glyph catalog lacks. A project sits on the lane its `stage:` gives: Run exploring, Push in-prep and submit-ready, Revise revision, Review submitted, Scope scoping, De-risk de-risking, Build building, and the Idea lane nascent, which takes a project of any tier. A project whose `status.chips` carry `blocked` or `parked` sits on Blocked or Backburner whatever its stage, and on Blocked when it carries both, unless its stage is done. A released, published, failed or stopped project sits on no lane, and one carrying `blocked` or `parked` is an audit finding naming the chip. A card draws its name alone on its first line, with its deadline and its menu, and under it its tags, each a glyph and its words with a tip naming its kind ("Stage: Submitted"), as a project board card draws its facts. The tags are every status mark its lane does not already say: its stage, unless the lane lists that stage alone, in the stage's colour, its form and its chips but the lane's own chip, each in its word's colour and a chip carrying `blocked` in red, each word once; then your role on the project, only while a person has `self: true`, and its tier, each unless its row of `roles:` or `tiers:` carries `unmarked: true` (oculus sets it on Lead and on `research`, and a hub may set it on any number of roles and tiers, or none); and the venue's short name, or its name when it has none, at a stage that carries `placed`, with the venue's whole name in the tip. Every tag is drawn, the tags wrapping onto further lines when the card is narrow, and a long venue name is cut with an ellipsis. Under the tags a card says whom it waits on, the people and projects its `waiting-on:` names, or Blocked while a chip carries `blocked`; a submitted project's review is said only in the Awaiting box. Dropping a card on a lane, or picking the lane in the card's menu, writes what the lane's `move_writes` in `focus_lanes` names: onto a lane of chips (Blocked, Backburner) its `chip`, when the card carries none of the lane's chips, with the chips of the other lanes of chips taken off and the stage kept; onto a lane of stages its `stage` when the lane does not hold the card's stage, with `blocked` and `parked` taken off. Oculus's lanes write Run exploring, Push in-prep, Revise revision, Review submitted, Blocked `blocked`, Backburner `parked`, Scope scoping, De-risk de-risking, Build building and Idea nascent. A lane without `move_writes` takes no move, and a `move_writes` naming a word the lane does not list, both fields or the field of the other kind of lane is a finding naming the lane. The card's menu offers only the lanes it may go to, so a done project has no Blocked or Backburner lane. A move that changes both the stage and the chips is two changes, and one Undo takes back one of them. A project whose stage is in flight or an idea and that no lane takes, which happens only when a hub's `focus_lanes:` leaves its stage out, is named in the command center's Needs attention group, with a link that opens it. Deadlines, due follow-ups and open subtasks are lines of the ticker. Done on a follow-up line takes that note out of its list, and the quick add appends a note to the list of the project it names. A funding scheme's deadline and follow-up lines open the Funding view, a conference call opens the Venues view, and an entry whose status keeps its lines live (`live_subtasks`) shows its follow-ups as it shows its subtasks. A dated deadline stays while it lies inside `deadline_horizon_days` of `focus:` and until the project's stage carries `deadline_met` (`submitted`). A band card whose status has met or closed its deadline, a status carrying `deadline_met` (`submitted`) or `closes_deadline` in its hub's words, shows no countdown. A task line has an `agent` button that opens the composer with the task. The Awaiting box has one row per kind that has something (Waiting on, Under review, Applications, Grants, Blocked), and a name waited on more than once carries its count, as in "BSPC (2)". The Career banner, headed Career, is open on a new Focus tab and folds like the command center, and a reload or a move of the tab keeps it folded or open; a find-in-page match inside the folded banner unfolds it. Its rows stand in the command center's box and two columns, in groups in this order, each drawn only when it has a row: Next, the milestone, with its day and the days left to it as the tail, the day followed by words such as "in 23 days" or "3 days ago", red once the day has passed and amber within 14 days of it; Goal; Situation, one row per fact with its value as the tail; Order of work, one row per task with its note after it and its date as the tail, and the order's own note under the rows; Track record, one row per role with the count of each record row of `categories:` it has projects in as the tail, as in "3 in review, 2 in flight", then Funding obtained. A press on a Next, Goal, Situation or Order of work row opens the career file at that entry's line, and when the file does not hold the entry the board's outcome line says so. Under the pointer such a row carries Edit, which opens the banner's editor at that section, and, for each web address its words hold, an Open link button named by the address's host, which opens the address in a new browser tab. Edit in the heading row opens the editor over the whole career file, unfolding the banner first when it is folded, and Close editor closes it; a career file with no `schema:` has no editor and no Edit. A Track record role row opens a tab of its own, named for the role ("Lead: track record"), drawing as board cards exactly the projects the row counts, one section per record row of `categories:` that holds one, each with the count the row shows; a second press on the same role brings that tab forward. The tab offers no New project, has no count on the tab or the rail and is not in the view catalogue; with no `self` it draws no project. Funding obtained opens the Funding view; these rows carry no button. The track record counts the projects of every hub whose lead, supervisors or collaborators name you (the workspace setting `self`), in the record rows of `categories:` (in review, in flight, publications, other outputs), never summed. Funding obtained counts the funding entries you lead whose status is obtained (awarded, granted), drawn only when at least one is. With no `self`, or with no project in a record row and no obtained funding, the track record is not drawn. A hub with no career file has no banner.
   ```
2. `docs/HELP.md:292`, the **Boards, categories and roles.** note: the board-heading sentence names the fold control at the head of the heading.
   Current:
   ```
   292:- **Boards, categories and roles.** A project shows on every board of `boards` in `config/defaults/layout.yml` whose keys it meets (its `tier`, your `role` on it, its `stages`, `chips` and `forms`, its `hub` and any `match` field), and opens from elsewhere on the first of them. Each key of `boards` is a view of its own, listed in that order in the group of the rail entry carrying `project_boards: true` (Projects in oculus's rail), its tab named and drawn by the text-catalog words its `label` and `glyph` name by their dotted keys (`views.projects` and `views.projects_glyph` for Projects). A board naming no `label` or `glyph`, or a word the catalog lacks, is a finding naming the board and the field, and the board is drawn with its key in place of a label and the glyph `views.board_glyph` names. A key that is the id of another view or the key of a collection is a finding naming the board, and that board is not listed. A board added in Settings appears in its group as the page runs, and a board taken out leaves the rail, the catalogue and its open tabs. Your role on a project is the first row of `roles` in `vocab.yml` whose field holds the person with `self: true`: Lead (`lead:`), Supervisor (`supervisors:`), Collaborator (`collaborators:`), and Other for a project that names people but not you. A project's category is the first row of `categories` in `vocab.yml` that holds it: in review, in flight, idea, publications, other outputs, released, dead-ends. Every row names its `color`; a row naming none is a finding and is drawn with no colour. The cards and the list draw one section per category the board holds, in that order, each under a heading with the category's label in its colour and its count, the projects in no category under "other" last; a press on a heading's fold control folds its section, the board remembers the folded sections, and a heading stays at the top of the pane while its section scrolls under it. A board's `cards: grid` draws one section with no heading instead. The slices of the bar's second line split the same categories by stage, or by form for publications and other outputs. While a person has `self: true`, each board draws the Role group, which counts the cards under each role, and a Lead badge on a card you lead, and a project board draws the Mine only toggle, on by default, which keeps the projects naming you in `lead:`, `collaborators:` or `supervisors:` and those naming no one; on a board where every project is kept by it, it is drawn disabled, its tip saying every project here is yours, and is not applied. A collection whose `schema:` declares `lead`, `collaborators` or `supervisors` draws the Mine only toggle, the Role facet and the Lead badge over its entries. While the workspace has more than one hub, a collection's bar draws after them the Hub chips, one per hub with its name and its count of entries, all pressed at the start; an unpressed chip hides that hub's entries, and the tab keeps the choice. With one hub no chip is drawn and a choice kept earlier hides nothing. A project no board takes, a manifest without `lead:` and a project with a `tier` that is no word of `tiers` are findings.
   ```
   Replacement:
   ```
   - **Boards, categories and roles.** A project shows on every board of `boards` in `config/defaults/layout.yml` whose keys it meets (its `tier`, your `role` on it, its `stages`, `chips` and `forms`, its `hub` and any `match` field), and opens from elsewhere on the first of them. Each key of `boards` is a view of its own, listed in that order in the group of the rail entry carrying `project_boards: true` (Projects in oculus's rail), its tab named and drawn by the text-catalog words its `label` and `glyph` name by their dotted keys (`views.projects` and `views.projects_glyph` for Projects). A board naming no `label` or `glyph`, or a word the catalog lacks, is a finding naming the board and the field, and the board is drawn with its key in place of a label and the glyph `views.board_glyph` names. A key that is the id of another view or the key of a collection is a finding naming the board, and that board is not listed. A board added in Settings appears in its group as the page runs, and a board taken out leaves the rail, the catalogue and its open tabs. Your role on a project is the first row of `roles` in `vocab.yml` whose field holds the person with `self: true`: Lead (`lead:`), Supervisor (`supervisors:`), Collaborator (`collaborators:`), and Other for a project that names people but not you. A project's category is the first row of `categories` in `vocab.yml` that holds it: in review, in flight, idea, publications, other outputs, released, dead-ends. Every row names its `color`; a row naming none is a finding and is drawn with no colour. The cards and the list draw one section per category the board holds, in that order, each under a heading of the fold control, the category's label in its colour and its count, the projects in no category under "other" last; a press on a heading's fold control folds its section, the board remembers the folded sections, and a heading stays at the top of the pane while its section scrolls under it. A board's `cards: grid` draws one section with no heading instead. The slices of the bar's second line split the same categories by stage, or by form for publications and other outputs. While a person has `self: true`, each board draws the Role group, which counts the cards under each role, and a Lead badge on a card you lead, and a project board draws the Mine only toggle, on by default, which keeps the projects naming you in `lead:`, `collaborators:` or `supervisors:` and those naming no one; on a board where every project is kept by it, it is drawn disabled, its tip saying every project here is yours, and is not applied. A collection whose `schema:` declares `lead`, `collaborators` or `supervisors` draws the Mine only toggle, the Role facet and the Lead badge over its entries. While the workspace has more than one hub, a collection's bar draws after them the Hub chips, one per hub with its name and its count of entries, all pressed at the start; an unpressed chip hides that hub's entries, and the tab keeps the choice. With one hub no chip is drawn and a choice kept earlier hides nothing. A project no board takes, a manifest without `lead:` and a project with a `tier` that is no word of `tiers` are findings.
   ```
3. `docs/HELP.md`, a new top-level bullet for the Venues view, inserted between the last sub-bullet of the **Data.** bullet and the **Present.** bullet. Its neighbours, as `grep -n` prints them:
   ```
   311:  - The log under the plan lists every request, command and result with its time. On the cluster the download runs on the login node and Live HPC's Login node section lists it; Verify and Unpack there are sbatch jobs.
   312:- **Present.** A deck is a folder with a `present.yml` and Markdown slides (several per file, split by `---`). The deck menu opens the portfolio deck (`portfolio_deck`), a project's `present/` deck, or one opened from Files. Right-click a slide to edit, add, duplicate or delete it; History undoes each. A dropped image is copied into the deck. Export to PDF writes `<name>.pdf` in the deck's folder (in the app; the print dialog in a browser). Notes come from the slide's `notes:` key.
   ```
   The new line, after line 311 and before line 312:
   ```
   - **Venues.** The venues are drawn in one section per row of `venue_categories` in `vocab.yml`, in its order, each headed by the row's `label` and its count, then an Other section for the venues whose category no row names; a section with no venue is not drawn. A row with `ribbon: true` draws the month ribbon of its venues' deadlines and meetings over its cards (oculus sets it on Conferences). A press on a heading's fold control folds its section, and the tab keeps it folded; a folded section draws no cards and no ribbon. With several hubs the rows are the union of every hub's, each key once with the first hub's row.
   ```
4. `docs/data-map.md:117`.
   Current:
   ```
   117:venue_categories:         # the categories of venues, in order (whole)
   ```
   Replacement:
   ```
   venue_categories:         # the categories of venues, rows { key, label, ribbon? }, in order (whole)
   ```
5. `docs/templates.md:335-338`, the comment above the key and its example.
   Current:
   ```
   335:# The categories a venue's category takes, in the order the Venues view offers them.
   336:# venue_categories: []
   337:#   example:
   338:#   venue_categories: [journal, conference, workshop]
   ```
   Replacement (lines 335-338 become these nine lines):
   ```
   # The categories a venue's category takes, in order: `key` the word a venue's category writes,
   # `label` the heading of its section of the Venues view and its word in the venue form, and
   # `ribbon: true` the month ribbon over that section.
   # venue_categories: []
   #   example:
   #   venue_categories:
   #     - { key: journal, label: Journals }
   #     - { key: conference, label: Conferences, ribbon: true }
   #     - { key: workshop, label: Workshops, ribbon: true }
   ```
6. `docs/apps.md:423`, the `config` channel's row. Every field it names is checked against `HubVocab` (`src/lib/data/model/model-collections.ts:217-224`: `domains`, `venue_themes`, `data_themes`, `collections`, `list`, `words`).
   Current:
   ```
   423:| `config` | `{ config, hubs: { primary, lists }, text, icons, host: { name, address }, findings }`; `lists` holds each hub's `{ domains, venue_themes, data_themes }`, built from its domains registry and the `themes` options of its venues and data registries |
   ```
   Replacement:
   ```
   | `config` | `{ config, hubs: { primary, lists }, text, icons, host: { name, address }, findings }`; `lists` holds each hub's `{ domains, venue_themes, data_themes, collections, list, words }`: `domains`, `venue_themes` and `data_themes` built from its domains registry and the `themes` options of its venues and data registries, `collections` the entries the hub lists, `list` its `collections:` list as written with the file it was read from, and `words` its merged vocabulary |
   ```
7. `.scratch/migration/agents/guarded.md`: nothing to change. G124's Test line names `board-rules.test.ts` and its describes, which all stay in that file.

## Checks, after the round's last change

1. `npm run diagrams && npm run test:quick -- --base 335db1c9`, run once. Its summary lines, as printed (the FAIL lines it printed between them are listed after the block):
   ```
   test:quick: 49 changed file(s), from git since 335db1c9
   test:quick: 299 test file(s)
   ok      prettier (18.9 s): All matched files use Prettier code style!
   ok      ASCII gate (21.8 s)
   ok      svelte-kit sync (64.4 s)
   ok      eslint (67.8 s)
   ok      svelte-check (164.2 s): 1793022614283 COMPLETED 545 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
   ok      vitest checks (442.1 s): Duration  399.25s (transform 367.42s, setup 0ms, import 922.50s, tests 578.07s, environment 5ms)
   FAILED  vitest (535.7 s)
   FAILED  vitest slow (581.1 s)
   test:quick: 649.0 s; failed: vitest, vitest slow
   test:quick: not covered: tests that reach no changed file within the import depth,
               the build, the lint of unchanged files
   verify exit 1
   ```
   - The counts, from the run's full output: `vitest` `Test Files  3 failed | 224 passed | 61 skipped (288)`, `Tests  4 failed | 2769 passed | 691 skipped (3464)`; `vitest slow` `Test Files  2 failed | 74 passed (76)`, `Tests  7 failed | 684 passed | 217 skipped (908)`.
   - Every red line is a time-out. The full output holds `Error: Test timed out in 20000ms` seven times and `Error: Test timed out in 5000ms` three times (the two `app-store.test.ts` rows are printed above one shared error), and one unhandled error: `[vitest-pool]: Failed to start forks worker for test files .../tests/ui/html.dom.test.ts`, caused by `[vitest-pool-runner]: Timeout waiting for worker to respond`.
   - The red lines are in six files the step does not change (`git status --short` and `git diff 335db1c9 --stat` over them print nothing):
     - `tests/routes/hubs/hub-routing.test.ts` (C14 row);
     - `tests/routes/hubs/make.test.ts` (G9 row);
     - `tests/server/edit/app-store.test.ts` (two rows);
     - `tests/data/hubs/hub-portfolio.test.ts` (six rows);
     - `tests/routes/edit/config-key.test.ts` (one row);
     - `tests/ui/html.dom.test.ts` (the worker that did not start).
   - Rerun alone by name:
     - The five files with failed rows, in one `npx vitest run`: `Test Files  1 failed | 4 passed (5)`, `Tests  1 failed | 83 passed (84)`. The one failure was `config-key.test.ts`, again `Test timed out in 5000ms`. `uptime` then gave `load averages: 8.97 16.28 16.21`.
     - `npx vitest run tests/routes/edit/config-key.test.ts`: `Test Files  1 passed (1)`, `Tests  11 passed (11)`.
     - `npx vitest run tests/ui/html.dom.test.ts`: `Test Files  1 passed (1)`, `Tests  8 passed (8)`.
   - So each of the six files passes run alone.
2. `npx vitest run tests/state/boards/board/board-rules.test.ts`: `Test Files  1 passed (1)`, `Tests  104 passed (104)`.
3. Check 4, `sh utils/unused-exports.sh | diff /Users/axelfaes/workspace/oculus/.agents/worktrees/O81-base/unused-exports.txt -`: `diff exit 0`.
4. Check 9, `grep -rn 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO8[0-9]\b' src config docs tests --exclude=local.yml`: prints nothing (`exit 1`).
5. Check 10:
   - The spec's perl gate over `find src tests config -type f ! -name local.yml` prints nothing (`exit 0`).
   - `LC_ALL=C grep -n '[^ -~]'` over this report prints nothing.
6. Check 11: `presets.ts`, the one file this round changes, is 609 lines. The largest changed files are `hub-names.ts` 877, `keys.test.ts` 840, `model/index.ts` 837 and `board-rules.test.ts` 825, all at or under 880. The largest component is `Projects.svelte` at 480.
