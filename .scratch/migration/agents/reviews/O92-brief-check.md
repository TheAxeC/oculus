# Step O92 brief check (on main at c72f0fcb9)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `.scratch/migration/agents/briefs/O92.md` (`/Users/axelfaes/workspace/oculus/.scratch/migration/agents/briefs/O92.md`). Head checked with `cd ~/workspace/oculus && git rev-parse --short HEAD`, which printed `c72f0fcb9`, the commit the brief was written at.

## 1. Names

The grep below covers every name the step changes. It runs over src, tests, docs, config, utils and guarded.md, and leaves out the files in "Paths this step writes":
`grep -rn "FilterBar\|SliceLine\|PickMenu\|FieldFilters\|HubChips\|Hub chips\|Controls\.svelte\|CollectionState\|parseCollectionState\|MapState\|parseMapState\|fieldFilters\|keptByHub\|FILTER_CHIPS_MOST\|changedPicks\|PromptRequest\|PromptField\|askFields\|collectionAsk\|stage chips\|'map\.\|'collection\.(...)'" src tests docs config utils .scratch/migration/agents/guarded.md --exclude=local.yml --exclude-dir=diagrams | grep -v "<paths>"`

I also ran a separate grep per name and per text key. The hits outside the paths:

- `src/lib/views/structure/map/Legend.svelte:4` `// control; the filters are the bar's (Controls.svelte).` and `:11` `/** The stages of the projects the graph draws, in the order of the bar's stage chips. */`. The step makes both false: item 6 deletes `Controls.svelte` and removes the stage chips. Legend.svelte is not in the paths. Item 7 still requires "every head comment and doc comment that names the old bar, state fields or controls" to say the new ones.
- `src/lib/state/shared/lists/lists.ts:2` `// over by: the Focus filter's checklists, a collection's Hub chips, the theme toggles of the Data`. The step makes it false: item 4 deletes HubChips.svelte, its only reader of `toggled` for this use. Not in the paths.
- `docs/HELP.md:305` (the Boards, categories and roles paragraph). It says "A collection whose `schema:` declares `lead`, `collaborators` or `supervisors` draws the Mine only toggle, the Role facet ..." and "a collection's bar draws after them the Hub chips, one per hub with its name and its count of entries, all pressed at the start; an unpressed chip hides that hub's entries". Item 4 makes this false. The paths list gives HELP.md "lines 273-280 and 306-313", which leaves out line 305.
- `tests/state/forms/new-entry.test.ts:56-65`, describe 'askFields'. It tests `askFields`, whose lines 22-37 the step writes, and it is not in the paths. Its rows use schemas with no people fields, so they stay true. But if the people fields are added inside `askFields`, this is where its row belongs. G8's Test line names this file's describe 'addTask' only (`sed -n 72p .scratch/migration/agents/guarded.md`).
- `tests/views/shared/forms/entry-add.test.ts:83,106,118,124,132,163,167,184` call `submit([...])` with one argument. This file is in the paths. If `Ask.submit` becomes `(values, picked) => ...` with `picked` required, all eight lines fail the type check. Item 2 does not say whether `picked` is optional. Changing these lines would change existing test lines.
- `config/text/views/boards/collection.yml` loses the only reader of `collection.hub_facet` and `collection.hub_tip` (HubChips.svelte:41,45), `collection.range_from`, `collection.range_to` and `collection.filter_picked` (FieldFilters.svelte:80,89,48), and `collection.filters` (Collection.svelte:368). The command was a `grep -rn "'<key>'" src` per key. Item 6 has map.yml's dropped words removed, but item 7 only adds keys to collection.yml and never says to remove these. The rules file's "The principles every package is judged on" says every catalog key has a reader. The same requirement asks for new keys "in key order", but collection.yml is not in key order today: `no_funding` sits at :37 after `person_glyph` :36, `open_venue` at :52 after `unpin` :51, and `range_from`..`filter_picked` at :53-55 (`grep -n "^        [a-z_]*:" config/text/views/boards/collection.yml`).
- `config/text/views/structure/map.yml`, `empty_filtered: Nothing is left under these filters. Press a filter again, or all, to widen them.`. Its only reader is Map.svelte:192. The file is in the paths, but no requirement names this line. It becomes false: the "all" buttons go with Controls.svelte, and Clear all replaces them. Premise 15's list of words the Map drops also leaves out `map.filters` (Controls.svelte:60) and `map.line_glyph` (Controls.svelte:86), whose only readers are in Controls.svelte. Item 6's "the words the Map no longer draws are removed" covers them.
- `src/lib/data/shapes/boards/roles.ts:190` `/** The Role facet over every entry, each row of roles: with its count; [] when not drawn. */`. This is not false if bar.ts hands `entryRoles` the entries the other filters leave, because the comment describes the entries handed in. It becomes false only if `entryRoles` itself changes, and roles.ts is not in the paths.
- `src/lib/views/shared/forms/registry/registry-file.svelte.ts:24,103` (collectionAsk). Still true: it only builds the `Ask`, and `grep -rn "\.submit(" src` shows AddAsk.svelte:50 as the only caller of `submit`.
- PromptRequest users: `Linkedin.svelte:47,122`, `Repositories.svelte:79,157`, `graph-picks.ts:7,80`, `tab-save.svelte.ts:8,27`, `repositories/graph/Graph.svelte:57,164`, `untitled-save.ts:6,25`, `Bookmarks.svelte:36,74`. Not made false: they implement `act` with one parameter, which still fits a two-parameter type. The only caller of `act` is Prompt.svelte:37 (`grep -rn "\.act(" src tests`).
- Other hits that stay true: `src/lib/views/academic/present/parts/Project.svelte:2` ("stage chips" of a slide, unrelated); `src/lib/views/shared/graph/Graph.svelte:84` and `src/lib/views/structure/map/edge-write.ts:19` (`map.layout_failed` and `map.edge_failed`, kept); `NoFundingCard.svelte:35` (`collection.no_funding`, kept).
- No hit in utils, config (outside the two catalogs), README.md or guarded.md for any moved or deleted file name: `grep -rn "FilterBar\|SliceLine\|PickMenu\|FieldFilters\|HubChips\|map/Controls\|Controls.svelte" utils config tests README.md .scratch/migration/agents/guarded.md docs/*.md --exclude=local.yml` printed nothing once the pdf and header Controls were filtered out (exit 1).
- The CollectionState and MapState field readers: `grep -rn "held\.\(hidden\|picked\|range\|roles\|hubs\|statuses\|collaborators\|enabled\|stages\|lines\)\b" src tests`. Every hit outside Collection.svelte and Map.svelte belongs to an unrelated `held`. `grep -rln "CollectionState\|parseCollectionState" src tests` names only `src/lib/state/boards/collection/index.ts` and `Collection.svelte`. The graph functions (`buildGraph`, `filterGraph`, `presentFilter`, `stageFilters`, `lineFilters`, `archiveStatuses`, `parseMapState`) have no reader outside graph.ts and Map.svelte. The only `toggleFilter` hit is a local function of Projects.svelte.

Findings:
- Legend.svelte:4 and :11 are made false and the file is missing from the paths.
- lists.ts:2 is made false and the file is missing from the paths.
- HELP.md:305 is made false and the line is outside the HELP.md ranges.
- `map.empty_filtered` is made false and no requirement names it.
- Six collection.yml keys lose their reader and no requirement removes them. "In key order" cannot be read off a file that is not in key order.
- The eight one-argument `submit` calls in entry-add.test.ts fail the type check if `picked` is a required parameter, and the brief does not say which it is.

## 2. The step line

- "a collection's Add asks its fields: the schema's required fields and `lead`, `supervisors` and `collaborators`, each by its type": item 2.
- "a `select` as a pick of its options": item 2, first sub-bullet.
- "a `foreign_key` field as a pick of the registry's entries": item 2, first and second sub-bullets, for `select` and `tags`. Item 2's third sub-bullet then says "a `text` field with a `foreign_key` (as radar's `maps_to`) stays a typed line". That departs from the words of the step line and ruling 471 (a), which make a `foreign_key` field a pick of the registry's entries whatever its type. The departure is not listed under "Decisions taken in this brief".
- "a `tags` field with `foreign_key` as a multi-pick that `PromptField` gains": items 1 and 2.
- "`lead` starting at the user": item 2, last sub-bullet.
- "the collection bar becomes the board's two lines (line 1 the search, Mine only and one group button per facet with More; line 2 the status values as slices with counts, the shown count and Clear all ...)": items 3 and 4.
- "the board partials and `PickMenu` moved to a shared folder": item 3.
- "the collection toolbar gets the board's Cards and List switch and Columns menu, a list of entries by the schema's fields": item 5.
- "the Map's bar as the board's (ruling 486): line 1 the search, Mine only and one group button per facet the boards have (Form, Situation, Role, Year, Domain, Venue, Pillar, Hub) with More": item 6, Line 1.
- "a Stage group in place of the stage and archived chips": item 6, the Stage bullet.
- "a Show group of the kinds of node the map draws (projects, pillars, team), each a toggle, with Connected only": item 6, Line 1 and The graph.
- "line 2 the slices with counts, the shown count and Clear all, drawn by the shared bar partials": item 6, Line 2, and item 3.

Findings: item 2 makes a `text` field with `foreign_key` a typed line, against the step line's and ruling 471 (a)'s words "a `foreign_key` field as a pick of the registry's entries". The brief does not raise this as a decision. Every other part has a requirement.

## 3. Premises

- 1, the prompt: `cat -n src/lib/ui/forms/prompt.ts` and `cat -n src/lib/ui/forms/Prompt.svelte` show PromptField at :10-17, `act: (values: string[]) => void` at :25, `values` at :27, `unanswered` at :30-32, and Select/TextInput at :52-67. Matches.
- 2, the Add: `cat -n` of entry-add.ts, AddAsk.svelte and new-entry.ts, plus `grep -rn "collectionAsk" src`. `Ask` is at :42-50, `askFields` is called at :113, the free text line at :123, `hubAsk` at :85-95, the body at :127, `askFields` is defined at new-entry.ts:29-37, and AddAsk has :20, :56 and :33-36. All match. The grep prints `src/lib/views/boards/collection/Collection.svelte:242:` and :58 (the import) and `registry-file.svelte.ts:103`. **The brief says `Collection.svelte:244`; the tree has :242.**
- 3, the real schemas: not rerun (it reads the research hub); see "Declined to judge". Its last sentence is in this repository: `sed -n 1,20p tests/fixtures/hubs/demo/.oculus/data/academic/tasks.yml` shows `status` as `type: select, options: [todo, doing, done, dropped], required: true` at :8. Matches.
- 4, choices: `Choice` is at schema.ts:97, `selectChoices` at :273, `choicesFor` at :340-353 and `picksPeople` at :507 (`grep -n "export function selectChoices\|export function choicesFor\|export function picksPeople\|export type Choice" src/lib/state/forms/schema.ts`). `fieldChoices` is at selectors.svelte.ts:581-588, `namesPeople` at :590-592, and `formFieldsOf` at record-fields.ts:54-59. Matches.
- 5, MultiSelect: its props are `values`, `label`, `choices`, `onchange`, `search`, `remove`, `removeGlyph`, `free?`, `none`, `more`, `extra?`. FieldControl.svelte:197-208 draws tags and chips with it, using `free={field.type === 'tags'}` and `extra={addChoice}`. editor.yml has `more_choices` at :13 and `no_choices` at :14. Matches.
- 6, the user: `selfPeople` is at selectors.svelte.ts:373-375, and `selfNamed` and `newProjectPerson` are at :812-819. Matches.
- 7, the collection view: `cat -n Collection.svelte` gives 493 lines. The bar is at :367-425 and the toolbar at :347-365; `ls` of the folder lists 6 items; `wc -l` gives FieldFilters 115 and HubChips 60. Matches.
- 8, the collection state: `grep -n` places CollectionState at :101-125, applyCollectionFilters at :459, keptByHub at :483, fieldFilters at :560, NO_FUNDING at :599, statusFacets at :704, and the file has 747 lines. `grep -rln "CollectionState\|parseCollectionState" src tests` names index.ts and Collection.svelte; `grep -rn "statuses" src/lib | grep -v collection/index.ts` names no writer of the collection state. Matches. One difference: the brief says "No test reads these functions" right after naming `entryRoles`. `grep -rln "...entryRoles..." tests` prints `tests/state/boards/board/board-rules.test.ts`, which calls `entryRoles` at :832, :849 and :859 (G124's 'the roles of a collection'). The collection/index.ts functions themselves have no test reader.
- 9, the board's bar: FilterBar has 211 lines, SliceLine 230 and PickMenu 284, and the props are as the brief says. The grep the brief names prints `views/boards/focus/FocusFilter.svelte:5` and `:14`. Matches.
- 10, the bar data: FilterChoice is at :31-44, FilterGroup at :47, LINE_FACETS at :50 and shownWords at :263-266; listCells and pickCell run :294-329. **filterGroups runs :146-173 (the brief says :146-176).** In state.ts, facetValues is at :39 (with its doc from :31) and answers `[]` by default. **applyFilters runs :85-110 with its doc (the brief says :81-101).** It reads only `FACETS`, which holds no `stage` (`sed -n 279,300p presets.ts`). Facet and FacetValue are at presets.ts:198-201. The meaning matches.
- 11, the board view: the derived values are as stated, `items` is at :156, `shown` at :193 and the Columns `Menu` at :356. Matches.
- 12, presets: `presetFor` is at :510 with its comment at :503-509, `recordPreset` at :547-579 and `board(preset)` at selectors.svelte.ts:364-367. `BoardRule` is at takes.ts:25-39 and includes `record`. Matches.
- 13, the Map: `wc -l` gives Map 217, Controls 164 and graph.ts 506, and the Controls description matches. **buildGraph runs :110-222 (the brief says :110-245; :224-247 is `measure`).** filterGraph runs :265-288. **MapState runs :442-457 (the brief says :442-460).** parseMapState runs :494-506 and GraphKind is at :30. `ls tests/state/boards` prints `board` and `map-forces.test.ts`. The meaning matches.
- 14, tree rules: `git ls-files <dir>` counts give views/shared 10, state/boards 10, state/boards/board 10, views/shared/forms 9, state/boards/collection 2, state/boards/structure 6, views/structure/map 5 and views/boards/projects 6. Matches.
- 15, words: `cat map.yml` and the key grep of collection.yml. Matches the brief's list, which does not mention `map.filters` and `map.line_glyph` (see 1).
- 16, help: `grep -n "" docs/HELP.md | sed -n 268,316p`. :275 covers Add, :277 `filter: true`, :306-310 the board, and :313 the Map, which today says nothing of a bar. Matches.
- 17, tests: `grep -n "entry-add.test\|G124\|G132" guarded.md` gives no entry-add.test hit, G124 at :183 and G132 at :207. The head comment cites G8. **The stub `clientOf` runs :33-57 (the brief says :33-60).**

Findings: the differences are Collection.svelte:244 vs :242, filterGroups :146-176 vs :146-173, applyFilters :81-101 vs :85-110, buildGraph :110-245 vs :110-222, MapState :442-460 vs :442-457, the stub :33-60 vs :33-57, and "No test reads these functions" vs `entryRoles` being read by board-rules.test.ts:832-859. None changes what the premise says the code does.

## 4. Cases and checks

- Cases 1-7: consistent with the rules file's case-run program ("What every package obeys"). But they are also "the entry-add test lines", and item 8 adds test lines to `tests/views/shared/forms/entry-add.test.ts` plus two new files, `tests/state/boards/collection-bar.test.ts` and `tests/state/boards/map-filter.test.ts`. The rules file's "What every package obeys" says: "A test exists only as the test of one entry of `agents/guarded.md` ... A builder writes no other test ... A step that needs a new entry stops and asks Axel for it, and writes no test until he has ruled". `grep -n "entry-add\|collection-bar\|map-filter\|map-forces\|structure/graph" guarded.md` names no entry for any of the three files, and the brief names none either.
- Case 3: the yes being off "until one is picked" is Prompt.svelte's derived state. A case-run program or a test over `collectionAsk` cannot see it, and no look case (26) checks it. "What every package obeys" says such behaviour is seen at the look.
- Cases 8-25: consistent; run over pure modules.
- Cases 16 and 25: consistent with "No migration code". They check that the generic field-by-field reader yields the defaults, and ask for no code that reads the old fields.
- Cases 26-31: consistent; they are looks on landing, with the view and what should be seen.
- No case asks the builder to check, quote or explain a place the step does not change.

Findings:
- Item 8 and the test half of cases 1-7 ask for tests outside any guarded.md entry, against "What every package obeys". The session has to book entries, or rule, before the build.
- Case 3's yes-off part has no runnable check and no look.

## 5. The question

The goal is the three rulings built as ruled.

- Case 1: no. It fails on the unchanged tree, and passes only with the typed asks and the user picked.
- Case 2: no. The body shape is the ruled result.
- Case 3: yes. The run can check `required: true` and `picked: []` on the field while Prompt.svelte:30-32 still tests `values[at] === ''`. A multi-pick's `value` is `''`, so the yes would stay off for good even with `lead: ['axel']` picked. No case or look checks that the yes turns on.
- Case 4: no.
- Case 5: no.
- Case 6: no.
- Case 7: no for the asks. It does not check what is written when another hub is picked (see 6).
- Cases 8-15: no; each checks counts and kept entries.
- Case 16: no.
- Case 17: no; look 29 covers the drawing.
- Cases 18-25: no.
- Case 26: yes, partly. It looks at the asks but not at the yes turning on with Lead holding the user, so a box that can never be answered passes it.
- Cases 27-31: no.
- The step line's check (`npm run test:quick` and the looks): no beyond the items below.
- Item 1: yes. As for case 3, nothing checks that a required multi-pick enables the yes.
- Item 2: yes. "`AddAsk.svelte` ... keeps the picks as it keeps the typed values on a refusal" has no case or look.
- Item 3: no. Verify 5, look 31 and the type check cover it.
- Item 4: yes for the help. HELP.md:305 can stay false: verify 5 greps `FieldFilters\|HubChips`, not "Hub chips", and the line is outside the paths.
- Item 5: no for the list itself. List mode with the palette's reveal has no check (see 6).
- Item 6: yes. Legend.svelte:4 "(Controls.svelte)" passes verify 5, whose pattern is `map/Controls`. The Map's `mine` default has no case.
- Item 7: yes. `map.empty_filtered`'s words "or all" stay false with every check green.
- Item 8: no, apart from the guarded.md conflict in 4.

Findings: case 3, case 26 and item 1 (the yes of a required multi-pick); item 2 (picks kept on a refusal); item 4 and item 7 (HELP.md:305 and `map.empty_filtered`); item 6 (Legend.svelte's comment, which verify 5's pattern misses).

## 6. Implied inputs

This is a code step. Each input below is missing from "Cases":

1. A required multi-pick with a pick made. Prompt.svelte:30-32 reads `values[at] === ''`. Expected: the yes is on with `lead: ['axel']` and off with `lead: []`.
2. A refused Add with picks. AddAsk.svelte:20 and :56 keep `typed` as strings only. Expected: the box comes back with the refusal and the same picks.
3. `Ask.submit`'s second parameter, required or optional. The eight one-argument calls in entry-add.test.ts (listed in 1) depend on it. Expected: stated; if they change, they go in the report's table of changed existing lines.
4. Events: `role` (required select) and `link` (`required: { when: { role: present } }`). `askFields` asks only `required === true` (new-entry.ts:34), so `link` is not asked. An Add at `present` then writes an entry that the schema check reports (`findings.schema.required_when`, check.ts:229). Expected: unstated (ask `link` or not).
5. Two hubs: the box opens on hub A and hub B is picked in it. The people keys come from A's choices but are written to B's file. There a key resolves in B first (`recordChoices` comment, schema.ts), possibly to another person. Decision 5's reason ("never starts with a key that would resolve to another person") conflicts with what Decision 4 allows. Expected: unstated.
6. A required people field whose `foreign_key` resolves to no collection in the hub the box opens on, for example `lead` in a hub with no people collection. `choicesFor` gives `[]` (schema.ts:340-353, `targetChoices`), so the multi-pick has no choices, the yes never turns on, and no Add is possible. Expected: unstated (for example, fall back to a typed line).
7. Whether the Add's multi-picks take `free` text or offer Add person, as the entry editor's tags do (FieldControl.svelte:197-208). Item 1 adds `PromptField.free` but no requirement sets it, which leaves a property with no user ("The principles every package is judged on", YAGNI). Expected: stated.
8. The Map's Mine only default. `emptyBoardState` sets `mine: true` (state.ts). On the Map that would hide, at open, every project led by someone else that names people, which the Map draws today. Expected: unstated.
9. The Map's shown count with nothing picked. The default stage rule hides terminal projects. Expected: unstated whether line 2 reads "<n> projects" or "<k> of <n> shown", and which total counts.
10. The Show list drawn by an unchanged PickMenu. PickMenu.svelte:95-96 always draws a dot in the item's tone and a count. The brief does not give the count or tone of Projects, Pillars, Team and Connected only, nor the Show button's words: `groupWords` would read "Show: Projects +1" at the defaults. Expected: stated.
11. A collection in List mode asked to reveal an entry by the palette (`revealState`, page-entry.ts:105-110; `Reveal` wraps only cards, Collection.svelte:438-442), or moved with the keyboard (`cardMoveRequested`, Collection.svelte:329-334). There is no card in list mode. Expected: unstated.
12. A collection with no status field (People, Venues). Expected: line 2 holds no slice group, only the count; there is no case.
13. Two hubs each holding a pillar of the same key. Pillar facet values are keys (`ids(item.pillars)`, state.ts), while line nodes carry full ids (graph.ts:200-207). Expected: unstated which pillar nodes are drawn after a pick.
14. The collection's `line` prop (the group ids line 1 draws; the rest go to More). FilterBar needs it, and item 4 does not give it. Expected: stated.
15. A hub whose `roles:` rows name fields other than `lead`, `supervisors` and `collaborators`. The Add asks the three literal names, as ruled, while Mine only reads `roleFields(rolesOf(config))`. Expected: unstated; low cost.

Findings: all fifteen are missing. Of these, 1, 3, 5, 6, 8 and 11 cost something when wrong: an Add that cannot be answered, a type check that fails, a wrong person written, an Add that is impossible in a hub, a changed default Map picture, or a palette jump that does nothing.

## 7. ADRs

- `cd ~/workspace/oculus && ls -d docs/adr` printed `ls: docs/adr: No such file or directory`, and `grep -n "adr" .agents/plan.yaml` printed nothing (exit 1). There is no record, which matches the brief's opening paragraph.

Findings: none.

## 8. Dictated text

- The words of the shown count, `"<n> entries" or "<k> of <n> shown"`, and the key names `collection.count`, `collection.count_one`, `collection.count_shown`: `grep -n "collection.count_shown" .scratch/migration/agents/briefs/O92.md` (line 65). Holds.
- The Map's words "Show", "Projects", "Pillars", "Team", "Connected only" and "Stage": `grep -n 'headed Show' ...O92.md` (line 69) and `grep -n 'the Stage heading' ...O92.md` (line 74). Holds.
- The state keys `{ search, filters: Record<string, string[]>, mine, mode, columns?, more, reveal? }`: `grep -n "filters: Record<string, string\[\]>, mine, mode, columns" ...O92.md` (line 61). Holds.
- The state keys `{ search, filters: Record<string, string[]>, mine, show: { projects, pillars, team }, connected, linkMode, start? }`: `grep -n "show: { projects, pillars, team }" ...O92.md` (line 68). Holds.
- The group ids `role`, `hub` and `field:<field>`: `grep -n "field:<field>" ...O92.md` (line 63). Holds.
- `PromptField.picked?: string[]`, `free?: boolean` and `PromptRequest.pickWords?`: `grep -n "picked?: string\[\]" ...O92.md` (line 47). Holds.
- `LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O92.md` printed nothing.

Findings: none.

## Declined to judge

- Item 3 of "What is on the tree" (the real schemas read with `yaml.safe_load` in the research hub), and with it the field order cases 1 and 2 assume for `collaborators` and `supervisors`: the brief says the session read it there, and I was told not to read the research hub.
- Whether `src/lib/views/shared/forms/bar/` is the right home for a filter bar (Decision 1): it is the brief's documented decision and within the folder limit. The folder would hold 9 + 1 = 10 (`git ls-files src/lib/views/shared/forms`).
- The size limits are a forecast, not a measurement: Collection.svelte is at 493 of 520 and loses about 95 lines of chips and handlers while gaining the bar, the mode buttons, the Columns menu and EntryList. My judgment is that it can stay at or under 520 if the logic sits in bar.ts. graph.ts (506), collection/index.ts (747), presets.ts (625), filter-menu.ts (329), Projects.svelte (455, which takes the board's toggles snippet) and Prompt.svelte (158) all have room.
- The folder limit holds for every path named: views/shared/forms 9+1, state/boards/collection 2+1, state/boards/structure 6+1, views/structure/map 5-1, views/boards/projects 6-3, views/boards/collection 6-2+1, tests/state/boards 2+2. state/boards/board is full at 10 and the brief adds no file there.

## Closed (each finding by the change to the brief that closes it)

- 1, Legend.svelte:4 and :11: premise 18 names them; item 6 has the comments name the bar and its Stage group; the paths gain `Legend.svelte` lines 1-15; verify 5 greps `Controls.svelte` and `stage chips`.
- 1, lists.ts:2: premise 18 names it; item 8 has it name the readers of `toggled`; the paths gain `lists.ts` lines 1-5; verify 5 greps `Hub chips`.
- 1, HELP.md:305: premise 16 names it; item 8 has `:305` say what the collection's bar holds; the paths widen HELP.md to lines 273-280 and 305-313.
- 1, `map.empty_filtered`: premise 15 names it; item 6 dictates its new words; verify 5 greps `or all, to widen`.
- 1, `map.filters` and `map.line_glyph`: premise 15 names them; item 6 removes them by name.
- 1, the six collection.yml keys: premise 15 names their readers; item 4 removes the keys left with no reader.
- 1, "in key order": premise 15 states the file has no key order; item 8 and decision 26 place the new keys at the end of the block, alphabetical among themselves.
- 1, the eight one-argument `submit` calls: item 2 makes `picked` optional, so those lines stay; premise 17 lists them.
- 1, new-entry.test.ts:56-65: premise 17 names it; verify 3 runs it by name after the change.
- 2, a `text` field with `foreign_key`: item 2 makes a `foreign_key` field of any other type a single pick, as ruling 471 (a) says; decision 14; case 37.
- 3, line numbers: premises 2, 10, 13 and 17 corrected to `Collection.svelte:242`, `filterGroups` :146-173, `applyFilters` :85-110, `buildGraph` :110-222, `MapState` :442-457 and the stub :33-57.
- 3, "No test reads these functions": premise 8 says no test reads the functions of `collection/index.ts` and that G124's board-rules.test.ts:832-859 reads `entryRoles`.
- 4, tests outside any guarded entry: item 9 is held on open item 498, which Axel rules before the dispatch; the bar and Map tests are dropped from the recommended option and the two new test files from the paths.
- 4 and 5, case 3, case 26 and item 1, the yes of a required multi-pick: item 1 makes it the pure function `answered` of `prompt.ts`, which `Prompt.svelte` reads in place of `unanswered`; case 3 and case 32 run it; look 26 checks the yes turning on with Lead holding the user and off without.
- 5 and 6.2, picks kept on a refusal: item 2 has `AddAsk.svelte`'s kept state gain the picks; decision 18; case 33.
- 5, item 4 and item 7 (HELP.md:305, `map.empty_filtered`): closed above.
- 5 and 6, item 6 (Legend.svelte's comment, which verify 5 missed): closed above.
- 6.1: case 32. 6.3: closed above. 6.4: item 2 asks a conditionally required field as optional of its type; decision 16; case 36. 6.5: item 2 returns the Add of the hub answered when it is not the hub the box opened on; decision 4 rewritten; case 34. 6.6: item 2 makes a pick with no choices a typed line; decision 15; case 35. 6.7: item 1 drops `free`, no Add person; decision 17. 6.8: item 6 sets `mine` false at first; decision 19; case 39. 6.9: item 6 states the shown count and its total; case 40. 6.10: item 6 states the Show button's words, its items' counts and tone; case 41. 6.11: item 5 states the reveal in list mode and the keyboard move in cards mode only; decision 21. 6.12: item 4 states no slice group without a status field; decision 22; case 38. 6.13: item 6 draws every hub's pillar of the picked key; decision 20; case 42. 6.14: item 4 gives the collection's `line`; decision 23. 6.15: item 2 names the literal fields; decision 24.

Added after the check, from ruling 491 (b), which Axel gave after the brief was written: item 7 (the Tier facet), premise 19, cases 43-45, the Tier group in item 6 and cases 30 and 31, decision 25, the paths `presets.ts` lines 275-300, `state.ts` lines 30-80, `facets.ts`, `vocab.yml` lines 222-240 and `projects.yml` lines 26-40, and G92's test in verify 3. The check did not read these.

Agent usage: a6eefc8dc6b4ef0cb, claude-opus-5-5, 285982 tokens, 78 tool uses, 10 min 45 s.
