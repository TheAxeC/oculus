# Step O96 brief check (on main at 69c52091b)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O96.md`. A page this report cites is named with its section, never with a line number; a line of code or a hit of a grep keeps its `file:line`.

Read in full: the brief (untracked in the main checkout, 143 lines), `plan.md`'s head paragraph (the plan has no section headed Goal; `grep -n -i "^#.*goal" .scratch/migration/plan.md` prints nothing, so the goal used below is the head paragraph plus rulings 492 and 493, which the step delivers), the step's line `plan.md:881`, rulings 489 to 509 (`sed -n 2920,2942p`), `agents/spec.md`, `agents/guarded.md` (searched), and on the tree: `cross-links.ts`, `CrossLinks.svelte`, `categories.ts`, `bar.ts`, `FilterBar.svelte`, `PickMenu.svelte` to line 140, `Collection.svelte` lines 1-200 and 340-440, `EntryCard.svelte` 1-30 and 170-240, `Disclosure.svelte`, the head of `GroupHead.svelte`, `facets.ts` 95-352, `state.ts` 35-85, `items.ts` 150-240, `map-bar.ts` 1-40, `NoFundingCard.svelte`, `docs/HELP.md` 277, 293, 296, 301, 305. The main checkout has `docs/data-map.md` and the state file modified and not committed (`git diff --stat`); every premise below was read from the committed text where they differ.

## 1. Names

Commands: `git grep -n "groupProjects\|CrossGroup\|crossLinks\|roleLinks\|stageGroup\|groupOf\b" -- ':!config/local.yml'`; `git grep -n "groupKey\|unfundedBy\|NoFundingCard" -- src tests`; `git grep -n "xlink" -- ':!config/local.yml' ':!.scratch'`; `git grep -n -i "in flight, \(done\|ideas\)\|in-flight, done\|done and ideas\|ideas and done\|three groups\|grouped as in flight\|cross-link group\|xlink\b" -- src docs config README.md tests ':!config/local.yml' ':!docs/diagrams'`; `git grep -n -i "cross-link\|crosslink\|project strip\|the strip" -- docs README.md config src/lib/data ':!config/local.yml' ':!docs/diagrams'`; `git grep -n "in-flight'\|'ideas'\|data-project-group\|project-group\|cross-links\|CrossLinks\|collection/bar\|collectionBar" -- tests src ':!src/lib/state/boards/structure/cross-links.ts'`; `git grep -n "projects={\|groups={" -- src/lib/views`; `git grep -n "archival" -- src/lib/data/shapes/catalog-files/vocab.ts config/options/catalogs/vocab.yml`.

- `groupProjects`: src hits `cross-links.ts:94,118,138,158,184`, `RadarCard.svelte:47,122`, `ProjectCard.svelte:51,123`, `RecordCard.svelte:65,161`, all in the paths. Other hits are under `.scratch/` (old briefs and reviews), records, not made false in a way that matters. No test names it.
- `CrossGroup` and its `type` values: `cross-links.ts:24-31,165,259-261`, `CrossLinks.svelte:18,30,54,63`, `RecordCard.svelte:66,114`, all in the paths. `ArchivalCard.svelte:14,26` uses `stageGroup` (type `stage`), outside the paths, stays true while `stage` is kept.
- `groupKey`: `cross-links.ts:34`, `CrossLinks.svelte:16,75-91`, in the paths (it keys on `type`, so a category group needs its key in it).
- `FlagGroup`, the private `groupOf`: only `cross-links.ts`. `bar.ts:159` has its own `groupOf`, unrelated.
- `data-project-group`, `data-project-kind`: only `CrossLinks.svelte:76,94`; no test reads them.
- `project.helper.xlink_*`: `config/text/views/boards/project.yml:162-168` and `CrossLinks.svelte:56-67`, both in the paths. `xmlns:xlink` in `docs/diagrams/*.svg:2` and `utils/diagrams/diagrams.mjs:92,124` are the SVG namespace, unrelated, and not matched by verify 3's `xlink_`.
- `collectionBar`, `BarInput`, the filters' group ids: `Collection.svelte:41,90,160`, `collection/index.ts:102,113-116`, in the paths; `src/lib/state/boards/board/filter-menu.ts:7` (outside) stays true.
- `FilterBar`/`PickMenu` importers outside the paths: `Projects.svelte:103`, `Map.svelte:44-45,205`, `SliceLine.svelte:31`; they stay true only if any new prop is optional.
- Doc sentence `docs/HELP.md:296` "grouped as in flight, ideas and done": in the paths.

Hits outside the paths that the change makes false:
- `config/catalogs/vocab.yml:53` (`idea`: "the idea group: the cross-link group of ideas, ..."): false, `idea` no longer makes a strip group.
- `config/catalogs/vocab.yml:55` (`terminal`: "the cross-link group of done projects"): false.
- `config/catalogs/vocab.yml:90` (`blocked`: "which flags the cross-link group of in-flight projects it is in"): false, the warning moves to any group (decision 2).
- `config/catalogs/vocab.yml:56` (`dead`: "the cross-link groups leave a project at such a stage out"): true only while the hub's `dead-ends` row carries `archival: true`; the rule becomes the row's flag, not the stage's number.
- `config/options/catalogs/vocab.yml:29` (help of `idea`: "the cross-link group of ideas"): false.
- `src/lib/data/shapes/catalog-files/vocab.ts:148` (idea), `:154` (terminal), `:201` (blocked): false; `:162` (dead) as `vocab.yml:56`.
- `src/lib/views/shared/card/project/CardLinks.svelte:24-26` ("a project at a stage the strip groups under none, which opens its project tab"): false, the strip leaves out by the `archival` row, and a project in no row is now drawn ("other").

Hits outside the paths made incomplete (they list who reads the `archival` flag and omit the strip): `config/catalogs/vocab.yml:264`, `src/lib/data/shapes/catalog-files/vocab.ts:330`, `config/options/catalogs/vocab.yml:347`.

Findings:
- F1.1. The paths lack `config/catalogs/vocab.yml` (lines 53, 55, 56, 90, 264), `config/options/catalogs/vocab.yml` (lines 29, 347), `src/lib/data/shapes/catalog-files/vocab.ts` (lines 148, 154, 162, 201, 330) and `src/lib/views/shared/card/project/CardLinks.svelte` (lines 24-26), each holding a sentence the change makes false or incomplete; item 3 names none of them. Under the rules file ("A sentence in a document or a head comment that the change makes false is a defect of the change") the step cannot be done without them.

## 2. The step line

`plan.md:881` against "What to build":
- "the collection views whose cards draw a project strip get a Projects section in More on O92's bar": item 2, first sentence.
- "(Category, Stage, Form, Tier, Role, Pillar)": item 2, the six groups in order.
- "a pick narrowing each card's strip and its counts": item 2, third bullet ("its group counts and the person card's per-role strips").
- "a card whose strip is left empty hidden": item 2, third bullet.
- "the strip draws one group per row of `categories:` (...), in that order": item 1.
- "dead-ends left out": item 1, generalised to every row carrying `archival: true`.
- "in place of the three groups by the stage's flag": item 1 and its second bullet (the `xlink_*` words removed).
- "(ruling 492) (ruling 493) (ruling 497)": rulings at `plan.md:2924,2925,2929`.

Every part has a requirement. The brief adds one group the line and ruling 493 do not name, "other" (decision 1), booked as a reversible decision.

Findings: none.

## 3. Premises

Each rerun:
- Step line and rulings: `sed -n 881p` and `grep -n "Open item 49[237] "` give `2924`, `2925`, `2929`, each ending "(the user)."; the quoted line matches `plan.md:881`. Holds.
- `wc -l`: `cross-links.ts` 268, `CrossLinks.svelte` 198, `EntryCard.svelte` 334, `RecordCard.svelte` 360, `bar.ts` 300, `Collection.svelte` 469. Holds. (`ProjectCard.svelte` 429, `collection/index.ts` 659, `FilterBar.svelte` 201, `PickMenu.svelte` 287, not stated in the brief.)
- `groupProjects` "`:184-224`": the function is `cross-links.ts:184-220`. `groupOf` "`:173-180`": it is `:168-174`. `warn` "`:212-222`": `:212-218`. `CrossGroup` "`:23-31`": `:24-31`. `stageGroup` "`:43-55`": `:43-56`. Line numbers drift; the content quoted holds.
- Callers: `cross-links.ts:118`, `:158`; `EntryCard.svelte:186-189`; `RecordCard.svelte:160-162`; `ProjectCard.svelte:121-131` (the call is `:122-132`); `RadarCard.svelte:119-126`. Holds.
- `CrossLinks.svelte` `label`/`glyph` "`:53-69`": `:53-68`; `project.yml:162-168`; `grep -rn "xlink_" src` hits only `CrossLinks.svelte:56-67`. Holds.
- `config/catalogs/vocab.yml:265-272`: `grep -n "^categories:\|key: dead-ends"` gives 265 and 272. Holds. `categoryOf`, `categoriesBy` in `categories.ts:87,99`. Holds. Board's sections: `cardSections` is `src/lib/state/boards/board/facets.ts:340`, read by `Projects.svelte:206`, heading drawn by `GroupHead` at `Projects.svelte:440-446` with `toneOf(section.color)`. Holds.
- `collectionBar` "`:194-288`": it is `bar.ts:189-290`; `line` at `:279` holds; `keeps` "`:276`" is `:275`. `FilterBar.svelte` "`:94`" and "`:166-175`": `moreGroups` is `:95`, the More `PickMenu` is `:157-168`. Drift.
- `facetValues` `state.ts:41-81`: holds. `boardItemFor` `items.ts:194`: holds. "`facetLabel` and `orderValues` (`facets.ts:108-188`)": `facetLabel` is `facets.ts:106`, `orderValues` `:139`, and `orderValues` is not exported (`function orderValues(`, no `export`; `grep -n "orderValues" src/lib/state/boards/board/index.ts` prints nothing). `facetValues` has no `stage` and no `category` case (`state.ts:41-81`), so "Category" and "Stage" are not read by `facetValues` on a board; a board reads `item.category` and the stage through the slices.
- `docs/HELP.md:296` quote holds. `:301` says the per-role strips and the Archival card's groups, not the three groups. `:277` describes a collection's bar. Holds.
- `ls -d docs/adr`: "No such file or directory". Holds.
- Verify list: `git show HEAD:.scratch/migration/orchestrator-state.md | sed -n 6,7p` gives `verify:` with `- npm run test:quick`; `.agents/plan.yaml:4` names the state file. Holds.

Buildability on the tree:
- `CrossLinks.svelte` colouring a heading by the row's colour: the group head is `ui/tree/Disclosure.svelte`, whose props are `count`, `label`, `expanded`, `onclick` (`Disclosure.svelte:7-14`) and whose colour is fixed (`color: var(--muted-txt, var(--muted))`, `:36`). `GroupHead.svelte` (what a board's section heading is) is a sticky pane strip with a fold control (its head comment), unfit for a card's foot. So the builder must add a tone to `src/lib/ui/tree/Disclosure.svelte` (outside the paths, also used by `History.svelte:300`) or reach into the primitive from `CrossLinks.svelte` with a `:global` rule. `toneOf` (`src/lib/state/shared/words/tones.ts:198`) is reachable from a view, so the tone itself is no layer problem.
- `FilterBar`/`PickMenu` drawing a heading "Projects" over six groups: More gets the groups `line` does not name as one flat list (`FilterBar.svelte:83,95,159-166`) and `PickMenu` heads each group by its own `heading` (`headed`). A heading over several groups needs a new notion of section: either a field of `FilterGroup` (`src/lib/state/boards/board/filter-menu.ts`, outside the paths) or a new optional prop of `FilterBar` and `PickMenu` (inside the paths). The second is buildable; the brief names neither.
- `collectionBar` reaching each entry's strip projects and the facet readers: `bar.ts` (state) importing `state/boards/structure/cross-links.ts` and `state/boards/board/` is state to state, allowed by the rules file's layers; no cycle (`collection/index.ts` imports neither, `grep -n "^import" src/lib/state/boards/collection/index.ts`). But `BarInput` holds no projects, people, per-entry collection, snapshot or preset, and `boardItemFor` needs a `Snapshot` and a `BoardPreset`; the brief names no preset. `mapPreset` (`presets.ts:589`) and the Map's bar (`src/lib/state/boards/structure/map-bar.ts`) already build board facets over a preset that takes every project, with `facets` and `filterGroups`, and a Stage group (`map-bar.ts:126`, private) in the `FilterGroup` shape; the brief points at neither. Reusing `orderValues` or map-bar's `stageGroup` needs an export from `facets.ts` (code of G92) or `map-bar.ts`, both outside the paths.

Findings:
- F3.1. Line numbers drift in the brief's premises: `groupProjects` (`:184-220`), `groupOf` (`:168-174`), `warn` (`:212-218`), `CrossGroup` (`:24-31`), `collectionBar` (`:189-290`), `keeps` (`:275`), `FilterBar` (`:95`, `:157-168`), `facets.ts` (`:106-184`).
- F3.2. "labels and orders them by `facetLabel` and `orderValues`": `orderValues` is private to `facets.ts`; reaching it needs `facets.ts` in the paths (and then G92's test, `tests/state/boards/board/hub-facets.test.ts`, runs), or `facets()`/`filterGroups` over a preset. "each value read and labelled as the project boards read and label it" has no board reader for Category and Stage (`facetValues` has neither case).
- F3.3. The category colour on the strip's heading needs `src/lib/ui/tree/Disclosure.svelte` (a tone prop) or a `:global` override; neither is in the brief or its paths.
- F3.4. The brief names no preset for the bar's project items and does not point at `map-bar.ts`/`mapPreset`/`filterGroups`, which already do this work (the rules file's DRY principle: "a parser, a fold or a rule exists once and is reused").
- F3.5. The brief does not name the worktree, the base copy, `unused-exports.txt` or the node `PATH`, which `O91.md:11-12,185,190` and `O92.md:11-12,224,229` name and the rules file relies on ("The brief names a base copy"; the unused-exports base "which the brief names").

## 4. Cases and checks

- Case 1: consistent with the shipped rows (`submitted` in in-review by words, `exploring` live, `nascent` idea, `published`+`journal` publications, `stopped` `dead: 2` into `dead-ends`, archival). Holds.
- Cases 2 to 7, 9 to 11, 13, 14: consistent with items 1 and 2 and the decisions.
- Case 12: "listed at 0, still unpickable" contradicts item 2 ("listed at 0, as an entry group lists one") and `bar.ts:12-13`/`:176-186` ("listed at 0 after the values held, so it can be taken out"): "unpickable" reads as "cannot be picked"; the existing rule is that it can be taken out.
- Case 8 and case 9's "hidden" and case 13 are view-level; at the unit level `collectionBar`'s output and `keeps` show them.
- No case asks to check, quote or explain a place the step does not change: case 7 (Archival card) and case 14 (entry page) test changed code (`CrossLinks.svelte`, `EntryCard.svelte`, `Collection.svelte`) through unchanged callers.
- The test rule: no entry of `guarded.md` names any path the step writes (`for p in cross-links CrossLinks RecordCard ProjectCard RadarCard EntryCard collection/bar.ts collection/index.ts boards/collection/Collection FilterBar PickMenu text/views/boards/project.yml text/views/boards/collection.yml HELP.md docs/diagrams; do grep -c -- "$p" guarded.md; done` gives 0 for each), so "the step writes no test" applies the rule correctly. If the builder must change `facets.ts` (F3.2), G92's test runs; G124's code is `src/lib/state/boards/board/` and `categories.ts`, which the step reads only.
- The case run: the brief's "Every case is a run the report quotes: a scratch server from the worktree on a free port other than 8787 and 8790, ..., with a screenshot or the drawn strip's text for each case" and verify 5 "Each case run on the scratch server, quoted" contradict the rules file's "What every package obeys": "A builder runs no page: it starts no scratch oculus for a browser and drives no headless browser, whatever a brief says", with a case-run program allowed instead.
- Sizes: the brief's Conventions ("the size limit of 880 lines for a source file") and verify 4 ("each at or under 880") give one limit; the rules file sets 520 for a Svelte component. `Collection.svelte` is at 469, `ProjectCard.svelte` 429, `RecordCard.svelte` 360.
- The verify list leaves out `sh utils/unused-exports.sh` and the history-word grep over the comments the step changes, both required by the rules file.

Findings:
- F4.1. Case 12 "still unpickable" contradicts item 2 and the bar's rule; it should say the value can be taken out.
- F4.2. The scratch server and screenshot of the case paragraph and verify 5 contradict the rules file's ban on a builder running a page; per "Read first" the builder must stop on it.
- F4.3. Verify 4 and Conventions hold `.svelte` files to 880; the rules file's limit for a component is 520.
- F4.4. The verify list lacks `sh utils/unused-exports.sh` compared with a named base, and the history-word grep.

## 5. The question

The goal the step delivers: rulings 492 and 493 (strip grouped by `categories:` rows, archival left out; a Projects section in a collection's More that narrows strips and hides emptied cards).

- The step line carries no check of its own; its check is the brief's cases. Could pass without the goal: no, if every case is run at the unit level with its output quoted (cases 1 to 7 by `groupProjects`/`crossLinks`/`roleLinks` output, 8 to 13 by `collectionBar` output); yes for what only the view shows (the heading's colour, the "Projects" heading in More), which only the look at landing proves, and the brief names no look state per case.
- Verify 1 (`npm run diagrams && npm run test:quick`): yes; no test covers the strip or the bar's project groups.
- Verify 2 (ASCII): yes; it checks characters.
- Verify 3 (`grep -rn "in-flight'\|'ideas'\|'done'"` and `grep -rn "xlink_"` print nothing): yes; removing the literals and the words proves nothing about grouping by rows.
- Verify 4 (sizes): yes.
- Verify 5 (cases on a scratch server): as the first bullet, and the method is banned (F4.2).
- Verify 6 (sentences read): yes; the sentences outside the paths (F1.1) are not in item 3's list, so the reading passes with them still false.
- Item 1 check (cases 1 to 7): no for the grouping at the unit level; yes for the colour of the heading (look only).
- Item 2 check (cases 8 to 13): no for groups, counts and hiding through `collectionBar`; yes for the "Projects" heading over the six groups (look only).
- Item 3 check (verify 6 and reading): yes, as above.

Findings:
- F5.1. Verify 3 can pass with the strip still grouped by anything; the proof of item 1 rests on quoted case-run output, which the brief should require per case (input and printed groups), and the look state for the colour and the More heading should be named.
- F5.2. Verify 6 can pass with `vocab.yml`, `vocab.ts`, the options help and `CardLinks.svelte` still false (F1.1).

## 6. Implied inputs

Missing from "Cases", each with the expected result the brief's own rules give or leave open:
- A strip holding a project of another hub whose `categories:` differ (another order, a key with another label or colour, a row the entry's hub lacks): item 1 files each project under its own hub's rows but gives "the list's order" without saying whose list; case 3 covers only an entry of the reordering hub. Expected result undecided: one group per key in the entry's hub's order, with another hub's extra keys after it, or the union of every hub's rows as `BoardPreset.categories` (`presets.ts:61-65`) does. A decision is needed.
- A hub whose `categories:` has no archival row: its `stopped`/`failed` projects are in no row and are drawn under "other" (decision 1). Expected: under "other"; worth a case since ruling 493 says dead-ends are left out.
- A row with no `color`: the heading drawn in no colour, as a board draws it (`Projects.svelte:445`).
- A project with no stage, or a stage no row holds: today left out (`cross-links.ts:173`), after the change under "other". Expected: under "other".
- A project in two strips of one person (lead and collaborator): drawn in both strips, counted once in the Projects counts (item 2's distinct-project rule).
- Whether the Category group lists "other" for projects in no row: unstated; a Category pick otherwise hides every "other" project with no way to pick them.
- A pick saved while a project group is not drawn (a Role pick then the self unmarked, or a pick in a view whose entries later draw no strip): by the bar's own rule (`bar.ts:204-205`) it must narrow nothing; case 11 only says the group is not drawn.
- The group ids the picks are saved under in the tab's state: a key of a saved record, which the rules file counts as a user-visible shape; the brief names none, and line 1's Role group already uses `role` (`bar.ts:37`), so a project Role group under `role` collides.
- The entry groups' counts and the status slices' counts under a project pick (an entry hidden by it): the bar's rule counts over what every other group leaves; unstated for the new groups.
- List mode: no strip is drawn in `EntryList`; whether the section is offered and whether a pick hides rows there is unstated. Expected by item 2's text: the section is offered (entries draw strips as cards) and rows are hidden; a case is needed.
- The No funding card (`NoFundingCard.svelte:33-40`, a record card whose strip is `groupProjects` of `unfunded`): its strip is regrouped by item 1; under a project pick, whether its strip narrows, whether it hides when emptied, and what its count tag and the No funding slice count say is unstated. Outside the paths.
- The record cards whose strips `groupProjects` regroups that no case names: Venues (`Venues.svelte:154`), Data (`Data.svelte:112`), Domains (`Domains.svelte:76`), a pillar line and the Orphans card (`Pillars.svelte:138,154`), a dated record's projects (`RecordCard.svelte:237`), the Gallery (`Gallery.svelte:291`). Expected: grouped by row; the look at landing needs at least one named.
- A project card whose related projects are all archival: the strip draws nothing and the Related line holds them (`ProjectCard.svelte` `unlisted`, `CardLinks.svelte:24-26`).
- A pick of a value that `PickMenu`'s search hides: the pick stays in force, as for every group; no case needed.
- The Pillars view's Archival card: covered by case 7.
- The strip's group glyph: the `xlink_*_glyph` words go and rows carry no glyph, so each category head loses its glyph while the Archival card's stage heads keep theirs; a visible change the brief does not state.

Findings:
- F6.1. Cross-hub ordering and merging of category groups is undecided (decision needed).
- F6.2. The No funding card under a project pick is undecided, and `NoFundingCard.svelte` is not in the paths.
- F6.3. The saved group ids are not named and the Role id may collide with line 1's.
- F6.4. Missing cases: no archival row; a row with no colour; a project with no stage; a project in two strips of one person; "other" in the Category group; a saved pick while its group is not drawn; entry-group counts under a project pick; list mode; a related strip left empty; one non-collection record card (Venues or Pillars).
- F6.5. The loss of the per-group glyph is a visible change not stated in "What to build" or the decisions.

## 7. ADRs

`ls -d docs/adr` answers "ls: docs/adr: No such file or directory" (exit 1). There is no ADR. `ls docs/glossary.md` answers "No such file or directory".

Findings: none.

## 8. Dictated text

- "Projects", the section heading: `grep -n '"Projects"' .scratch/migration/agents/briefs/O96.md` (lines 27, 42, 90). Holds.
- "other", the last group: `grep -n '"other"' .scratch/migration/agents/briefs/O96.md` (lines 15, 24, 36, 88). Holds (it is `board.section_other`, `config/text/views/boards/projects.yml:75`).
- The group headings Category, Stage, Form, Tier, Role, Pillar: `grep -n 'Category (the rows' .scratch/migration/agents/briefs/O96.md` (line 27). Holds. Form, Tier, Role and Pillar exist as `board.facet_form`, `facet_tier`, `facet_pillar` (`projects.yml:30,37,33`) and `roles.facet`; Category has no catalog word and Stage only `map.stage` (`map-bar.ts:154`), so they are new words.
- Case 12's "still unpickable" is case text, not file text; see F4.1.
- `LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O96.md` prints nothing (exit 1): the brief is ASCII.
- HELP.md lines 277, 296, 301 and the head comments are given as what they must say, without words: not dictated.

Findings: none.

## Declined to judge

- Whether an app localization outside the repository defines a `project.helper.xlink_*` key, which G130 would then report once the keys are removed: no such file is in the repository and the hub was not read.
- Whether every category colour of the shipped rows maps to a palette tone through `toneOf` (so a heading is not drawn in the unknown tone): the palette was not read.
- The report path `.scratch/migration/agents/reviews/O96-report.md` against the rules file's "You never edit anything under `.scratch/`": sibling briefs write it in the worktree's copy of the ledger with that clause, which O96 omits; left to the orchestrator's convention.

Agent usage: ad36c99e52ba380ff, claude-opus-5-5, 234840 tokens, 61 tool uses, 8 min 47 s.