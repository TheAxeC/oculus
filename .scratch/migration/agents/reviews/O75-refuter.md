# Step O75 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75, base e0687c50)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ npm run diagrams && npm run test:quick -- --base e0687c50      (exit 0)
test:quick: 40 changed file(s), from git since e0687c50
test:quick: 19 test file(s)
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.6 s)
ok      eslint (3.3 s)
ok      svelte-check (14.3 s): 1792931645247 COMPLETED 539 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (36.2 s): Duration  24.55s (transform 28.24s, setup 0ms, import 49.17s, tests 23.87s, environment 434ms)
ok      vitest slow (37.6 s): Duration  25.92s (transform 7.24s, setup 0ms, import 19.98s, tests 5.74s, environment 0ms)
ok      vitest checks (71.8 s): Duration  59.85s (transform 19.49s, setup 0ms, import 63.01s, tests 36.86s, environment 1ms)
test:quick: 74.5 s; every command passed
(git status --short afterwards: the same six docs/diagrams files modified as before the run, no new path)

$ npx vitest run tests/state/boards/board/board-rules.test.ts tests/state/boards/board/hub-facets.test.ts
 Test Files  2 passed (2)
      Tests  85 passed (85)

$ git show e0687c50:src/lib/state/boards/board/index.ts | grep -c sliceGroups
0      (the base exports no sliceGroups, consistent with the quoted "TypeError: sliceGroups is not a function")

$ sh utils/unused-exports.sh  vs  .agents/worktrees/O75-base/unused-exports.txt
125,126c125,126  filter-menu.ts and index.ts lose filtersInForce
232c232          Unused exported types (111) -> (109)
283,285c283      FilterChoice, Facet, presets.ts BoardColumn leave the list
(identical to the diff the report quotes; no line added)

$ grep -rn --exclude=local.yml --exclude-dir=diagrams -- "<name>" src tests docs config README.md
"Filter menu", "stage facet", "category facet", "Expand all", "expand_all", "board.collapse", "totals line",
"statistics strip", "board statistics", "Authors column", "Authors cell", "Status column", "cell: authors",
"cell: status", "cell: focus", "submit_ready", "submitReady", "STATS_VENUES", "filterChips", "filterLabel",
"InForceChip", "filtersInForce", "Stats.svelte", "facet_category", "facet_stage", "stat_", "Board totals": nothing
"filter menu": Settings Header.svelte:3, session-list.ts:95, SessionList.svelte:21 and :213 (their own menus),
               tests/state/boards/board/hub-facets.test.ts:1 and :43
"Focus column": config/defaults/behavior.yml:71, docs/HELP.md:513, config/text/views/system/workbench.yml:15 (the Focus board's columns)

$ npx vitest run tests/checks/look/contrast.test.ts        (Chip.svelte changed; the quick tier did not select it)
 Test Files  1 passed (1)
      Tests  56 passed (56)

$ sh utils/folder-check.sh            exit 0
$ ASCII gate of the rules file over src tests config, and LC_ALL=C grep -n '[^ -~]' docs/HELP.md O75-report.md: nothing printed
$ history-word grep over the added lines and the four new files: only "before any filter", "before them", "before the next",
  "before it is first drawn", "Before the first snapshot", "is still the board saying" (rewrapped base sentence),
  "any more" (HELP, of data): none is history; no step id, no ruling id
$ grep -rn "submit_ready\|cell:" ~/workspace/research-hub/.oculus --exclude=local.yml      nothing printed

Case runs the report quotes, rerun by the reviewer as one `npx tsx -e` of the builder's after.test.ts calls (same inputs,
absolute imports; tsx cannot compile `$state` in generation.svelte.ts, so `$state`, `$derived`, `$effect` were defined as
identity stand-ins before a dynamic import; the functions run are pure):
c2 keys: ["slice","form","status","year","funding","compute","reproduced","code","sessions"]
c2 status: [["blocked","blocked (external)",1,null],["parked","parked (not being worked)",1,null]]
c2 form: [["journal","journal article",1,null],["conference","conference paper",1,null],["poster","poster",1,null]]
c2 card chips a: ["journal","blocked"]
c3 slices: [["in-review","sky",[["in-review/submitted","submitted / under review","sky"]]],["in-flight","green",[["in-flight/de-risking","de-risking","green"]]],["publications","rose",[["publications/journal","journal article","rose"]]]]
c4 kept: ["b","a"]
c4 counts under year: [["in-review/submitted","submitted / under review",1,"sky"],["idea/nascent","nascent",1,"violet"],["publications/journal","journal article",0,"rose"]]
c6 filters: {}
c7 stats: {"projects":16,"blocked":2,"dated":3,"warnAt":4,"venues":[]}
c7 words: ["deadline 3","16 projects","5 of 16 shown","1 project","2 blocked"]
c8 none: ["","deadline 0"]
c9 mixed: [[{"id":"v1","short":"BSPC","count":5}],"BSPC: 5 live projects, the warning is 4"]
c9 archive: [[],""]
c17: ["boards.ws.columns[0].cell must be one of title, stage, venue, lane, next, with, domain, pillar, funding; it is not read"]
c17 shipped: []
c18: [["v1","JA",2,null],["v3","A Journal",1,null],["v2","B Journal",1,null]]
c19: [["idea",""],["title","next"],"absent"]
c20 role offered: false
c20 kept: ["b","a"]
c20 domain: {"id":"domain","heading":"Domain","tone":"teal","items":[{"id":"gone","label":"gone","count":0,"active":true,"tone":"teal"}]}
c22 tags: [{"id":"pl","label":"Blue line","color":"#2563eb"},{"id":"pn","label":"Plain"}]
c22 choices: [{"id":"pl","label":"Blue line","count":1,"active":true,"tone":"blue"},{"id":"pn","label":"Plain","count":1,"active":false,"tone":"cyan"}]
cols: [["title",true],["stage",true],["venue",true],["lane",true],["next",true],["with",true],["domain",false],["pillar",false],["funding",false]]
cols hide venue: ["title","stage","lane","next","with"]
cols back: "absent"
(every line equals the report's quoted output)

Read checks: src/lib/ui/display/table/Table.svelte:103-106 `th { position: sticky; top: 0; z-index: 1; ... }` unconditional, :131-144 the `.stays` rules all under `body.wall`; src/lib/data/shapes/catalog-files/vocab.ts:78 `const stageWord = z.strictObject({`; the state file's "Open items" section holds no entry (matches the report).
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `FACETS` in the brief's order (presets.ts:261-276); `facetValues` form, venue (`keyOf(item.venue.id)`), status = `item.project.chips` (state.ts:35-58); Form and Venue headings, "Situation" (filter-menu.ts:53-67, projects.yml); stage and category saved filters dropped by the `FACETS` test alone (rerun c6: `{}`); c2 and c18 reruns.
- 2: holds. `sliceGroups`, `sliceWord`, `sliceValue` in facets.ts:162-225, `BoardItem.slice` filled in items.ts:127,153, slice facet counted in `facets` (facets.ts:263-277), `parseBoardState` given the board's slice values (Projects.svelte:122-129, state.ts:189-190); reruns c3, c4, c6; G124 'a saved slice filter' passes.
- 3: holds. FilterBar.svelte:140-203: search, stale, "deadline n", Mine only under `{#if named}` disabled with `board.mine_all` while `mine` is false, group buttons in `LINE_FACETS` order, More with the folded groups first and their badge and mark (:191-201); folding by `fit()` (:101-121); role applied only while named (`appliedFilters`, state.ts:105-112, rerun c20). Needs Chip's new `disabled` (Spec 1).
- 4: holds. PickMenu.svelte: bits-ui Popover holding Command, `shouldFilter={false}` with a words-only filter (:53-61), a pick through `onSelect` with the popover left open, headings for More (:137-156), the Venue bar from `share` (:97-99, filter-menu.ts:126), FloatingList and MenuOpener from ui/menu.
- 5: holds. Stats.svelte deleted with every `stat_*` key and `board.stats`; `stats()` reshaped to `projects`, `blocked`, `dated`, `warnAt` and live-only venues (stats.ts:71-106); `submit_ready` gone from vocab.yml, vocab.ts, options (grep: nothing); `humanSize`, `disseminated`, `waitingLine` still exported (index.ts); reruns c7, c8, c9.
- 6: violated, Spec 5 (a slice not picked is not drawn in an outline of its colour). The fills hold: a picked slice chip is `pressed` and so filled (Chip.svelte `solid`), a picked list value is a filled pill (PickMenu.svelte:234-239), facet tones by literal keys (filter-menu.ts:73-87), pillar `color` filled in items.ts:122-128 (rerun c22).
- 7: holds. SliceLine.svelte: category label in small capitals in its hue as a RowButton picking or clearing all its slices (:144-152, :168-173), slices as Chips "words count" (:176-182), fold into "+n" PickMenu headed by category (:187-196, `sliceChoices`), "16 projects" / "5 of 16 shown" and Clear all while any value is picked (:197-202); no in-force chip line (Projects.svelte has none).
- 8: holds. FoldHead moved to views/shared/card/ with optional `glyph`, `tone`, `count`; the three Focus users import it from there; Projects.svelte:375-392 heads each section with it, sticky `.heading` on `--panel` (:406-412); `folded` read as words and not passed in `lists` (state.ts:149,179, Projects.svelte:165; rerun c19); grid board draws one section (:371-373); `bulk()`, `board.expand_all`, `board.collapse` gone (grep).
- 9: holds. BoardList.svelte: one Table per section under the same headings, header row inside an `overflow: hidden` box so it does not stick (:113-123), the nine cells (:80-98), one-line cut cells with the whole text in the tip (:101-111, :128-135), minimum widths 160/200/90 dropped from the right (:46-75); Columns Menu with `checked` choices in list mode (Projects.svelte:308-326); `columns` read against `LIST_CELLS` (state.ts:180-181); reruns c19 and cols.
- 10: holds. config/defaults/layout.yml gives every board title/stage/venue/lane/next/with with each board's own first heading; options/layout.yml offers the nine cells; the `boards:` comment and the `columns` and `cards` help rewritten; rerun c17.
- 11: violated, Standards 2 (hub-facets.test.ts still names "the filter menu" of the Projects board) and Standards 3 (a sentence added to the header bullet that is no header fact). The 13 listed lines and HELP 289-295 are rewritten and true (grep above).
- 12: holds. board-rules.test.ts:493-505 the new row; hub-facets fixture gains `venue: null` and `chips: []` only; 85 passed after; the first failure is quoted ("TypeError: sliceGroups is not a function"), not rerun (Declined to judge).

Cases of the brief's "Cases":

- 1: not verifiable. Reading: FilterBar.svelte line 1 in the stated order, fold into More by `fit()`; SliceLine.svelte line 2 with "+n". The look must see at a 532 px and a 1400 px pane two bar lines, line 1 never wrapping, line 2 ending in "+n" at 532 px.
- 2: met, rerun c2 (Situation lists blocked and parked, no form; Form lists journal article, conference paper, poster).
- 3: met, rerun c3 ("submitted / under review", "journal article", "de-risking").
- 4: met, rerun c4 (both kept; slice counts under year 2026 taken over what year leaves: journal 0).
- 5: not verifiable. Reading: `pickCategory` (SliceLine.svelte:144-152) picks every slice, or takes them all out when all are picked. The look must see a press on "publications" filling every publications slice and a second press clearing them.
- 6: met, G124 'a saved slice filter' (first part) and rerun c6 (`{}`) for the second.
- 7: met, rerun c7 for the counts; reading Projects.svelte:148 `strip = boardStats(items)` (items before any filter) and :345-346 `shown={shown.length}`, `total={strip.projects}`; the look must see "deadline 3" unchanged under a filter.
- 8: met, rerun c7/c8 ("2 blocked", "" with none); the look must see the badge red beside Situation.
- 9: met, rerun c9 (BSPC warns with the stated tip, the archive board warns on none).
- 10: not verifiable. Reading: FilterBar.svelte:164-172. The look must see, with `self` named on a board where every project is the user's, Mine only greyed and unpressable with the tip "Every project here is yours", and no Mine only without `self`.
- 11: not verifiable. Reading: picked domain, year (slate) and slice fills as item 6 holds; publications slice tone rose (rerun c3). The look must see each fill in its hue; it must also judge Spec 5.
- 12: not verifiable. Reading: PickMenu.svelte:53-61 filters by words, `share` bars, `onSelect` leaves the list open. The look must see "bs" in the Venue list keep only matching venues, a bar per venue, and the list open after a pick.
- 13: not verifiable. Reading: FoldHead in cards and list mode, `folded` saved through `write`, sticky `.heading`. The look must see a fold in both modes, the fold kept after a reload, and the heading held at the pane's top while its cards scroll under it.
- 14: met, reading Projects.svelte:274-328 (New project where offered, Cards, List, Full titles, Columns in list mode; no Expand all or Collapse).
- 15: not verifiable. Reading: BoardList.svelte:61-75 gives Project, Stage, Venue, Lane at a body near 508 px (430 px) and all six at 1400 px; `.list` clips. The look must see those columns at 532 px and 1400 px, no sideways scroll, one-line rows, a cut Next whole in its tip, and Venue hidden by the Columns menu after a reload.
- 16: met, the two-file run (85 passed); the category row replaced by the slice row.
- 17: met, rerun c17.
- 18: met, rerun c18.
- 19: met, rerun c19.
- 20: met, rerun c20 (no `self`: role group absent, both kept; a picked gone domain listed at 0 and active) and reading filter-menu.ts:146-163 for the button.
- 21: met by reading (vocab.ts:78 `z.strictObject`, the flag line gone) and the builder's quoted run, which the reviewer could not rerun (Declined to judge).
- 22: met for the first part, rerun c22; the second part (the picked value filled in blue on screen) is the look's.

## 1. Spec

- 1. `src/lib/ui/controls/Chip.svelte:44-48, :116, :201-208`: `disabled?: boolean;` ... `{disabled}` ... `.chip.pressable:disabled { opacity: 0.5; cursor: default; }`; what is wrong: a path outside the brief's "Paths this step writes" ("The step writes these paths and nothing else"). Judgment: item 3 needs it (Mine only drawn disabled with a tip; Chip had no disabled state, and the rules file requires a `ui/` primitive); it copies ToolButton's disabled rule (ToolButton.svelte:205-208) and changes nothing for an enabled chip (`:hover:not(:disabled)`); contrast check passes (56 passed). The report names it, as the rules file's "Where you work" asks. Recommend accepting it at landing as a recorded widening. failure scenario: none in code; a landing that checks the diff against the path list alone would reject a needed change. verdict: none.
- 2. `src/lib/data/shapes/catalog-files/vocab.ts:240-242`: "The word the category is named by, which a board's slice filter and its folded sections store."; what is wrong: a line outside the three lines the paths name. Judgment: the base text "which a board filter stores" became false (no filter stores a category key), so item 11's own rule ("every other sentence that names a removed thing ... made true") asks for it; ruling "Brief check scope" binds a brief check, not a builder. Accept at landing. failure scenario: left at the base wording, Settings' help for a category key would tell a reader a board filter stores it. verdict: none.
- 3. `src/lib/state/boards/board/items.ts:22, :121, :153`: `import { sliceValue, sliceWord } from './facets.ts';` ... `slice: sliceValue(category?.key ?? '', sliceWord(category, project)),`; what is wrong: lines beyond the two the paths name for items.ts (report judgment 1). Judgment: item 2 needs the category row (its `forms:` block) to name a project's slice, which `facetValues` does not hold, so carrying `slice` on the item is a fair shape. Accept at landing. verdict: none.
- 4. Unapproved scripts. The report's last line: "Edits were made with the Edit and Write tools and, for a few mechanical substitutions, inline `python3`, `perl` and `sed` commands". What is wrong: the brief ("No script is written for this step, by the builder or by the session that runs it inline ... Any other script needs the user's approval ... quoted from a line of `plan.md`'s Rulings") and the rules file's "What every package obeys" (a case-run program is the only script allowed without approval) forbid them, and no line of `plan.md`'s Rulings approves one. The report names neither the commands nor the files nor the lines they changed, so the reviewer cannot tell which hunks they produced. Judgment: an inline `python3`/`perl` program and a `sed -i` substitution are scripts run inline under the skill's Spec heading. Under the skill's "Finding dispositions", this is not closed by naming it nor fixed at landing; it goes to Axel as an open item, and nothing the scripts produced is used until he rules (in practice: the builder's list of each command and the files it touched, so the orchestrator can read those hunks). failure scenario: a substitution that also hit an unintended occurrence (a word inside another identifier or a comment) lands unseen, since the reviewer reads the diff without knowing which lines were machine-made. verdict: none.
- 5. `src/lib/views/boards/projects/SliceLine.svelte:176-182` with `src/lib/ui/controls/Chip.svelte:137, :165-167`: `border: 1px solid var(--line);` ... `.chip.toned { color: var(--tone-txt, var(--muted-txt)); }`; what is wrong: item 6 says "A value not picked is drawn with its colour as ... an outline (a slice)"; a toned, unpressed Chip draws its outline in `--line` (grey) and only its words in the hue. failure scenario: on line 2 every unpicked slice shows a grey border with coloured words, so the slices of one category do not read as outlined in their stage's colour as the ruling's design describes; the look decides how far that matters. verdict: item 6 violated.
- 6. Brief, "What is on the tree": "`Table` draws its header row sticky (`stays`, `Table.svelte:27`)"; what is wrong: the premise does not reproduce. `Table.svelte:103-106` makes every `th` sticky unconditionally, and `stays` only sets wallpaper backgrounds (`:131-144`). The report's claim ("the header row is sticky on every table; `stays` changes only the wallpaper backgrounds") holds, and BoardList.svelte handles it correctly (`.list { overflow: hidden }` gives the sticky header a box that never scrolls, so it scrolls with its rows, Z1006). The prop's own doc comment at `Table.svelte:21-27` ("Whether the header row stays over the rows while they scroll under it") is false on the base tree too; it is not this diff's defect and is outside its paths. failure scenario: the next brief that trusts the premise or that doc comment hands `stays={false}` expecting a scrolling header and gets a sticky one. verdict: none.

## 2. Proof

- 1. Report, "The cases' first run" and "The cases after the change": "Run through a scratch case file (source kept at `/private/tmp/claude-502/.../scratchpad/caserun/before.test.ts`), copied into `tests/state/boards/board/o75-caserun.test.ts` for the run and removed right after"; what is wrong: the rules file's "What every package obeys" asks a case-run program to have "its source and its output quoted in the report, so the reviewer can run it again", and its file to live "in the scratchpad or the base copy"; the report quotes only the output and a path in a session scratchpad, and the file was written into the worktree's `tests/` for each run. The reviewer reached the source only because it shares that scratchpad, and every quoted output reproduced. failure scenario: a reviewer or an orchestrator in another session, without that scratchpad, cannot rerun any of the 14 case runs the cases rest on. verdict: none.

## 3. Standards

- 1. Report, "Runs of the verify list and whole-suite commands": "`npx vitest run --project unit --dir <the scratchpad folder>` ... ran the unit project's test files of the tree instead ... for about two and a half minutes until I stopped it"; what is wrong: the rules file's "Token discipline" counts `npx vitest run` with no file named as a whole-suite command and makes it a finding of the review. Its result was not used; no code follows from it. failure scenario: several suites share this machine, so a stray whole unit run competes with the landing gates and other steps' runs. verdict: none.
- 2. `tests/state/boards/board/hub-facets.test.ts:1` and `:43`: "The Projects board's filter menu on a workspace of two hubs" ... `describe('the filter menu on a workspace of two hubs', () => {`; what is wrong: the step removes the Filter menu (HELP no longer names it), so the head comment and the describe title name a removed thing, which item 11 asks to be made true; the head comment's "The items are synthetic and hold only what the facets read" is also short of the new `slice` field the slice facet reads (the fixture items carry none, so `facetValues(item, 'slice')` gives `[undefined]`, harmless only because `categories: []` draws no slice). The builder kept them (judgment 20) because G92's Test line in `agents/guarded.md` names the describe and the brief limits this file to its fixture; the judgment that "filter menu" is a fair generic name does not hold for a board whose controls are now group buttons and a slice line. Fix at landing, with the G124 rewrite: retitle the describe and the head comment (for example 'the group lists on a workspace of two hubs') and G92's Test line in the same commit, and give the fixture `slice: ''`. failure scenario: a reader of G92 or of this test looks for a "filter menu" on the Projects board and finds none, and a later step grepping "filter menu" as a removed name gets a hit that looks like a missed sentence. verdict: item 11 violated.
- 3. `docs/HELP.md:295`: "A card opens and closes in place by its own control."; what is wrong: the sentence is true on this tree, but it sits in "The board's header" bullet and describes a control that is not in the header; no item asks for it (item 8's "a card still opens and closes in place" is an instruction to the builder, and item 11's list ends with "the header without Expand all and Collapse"); line 288 already speaks of "An opened card". O77 makes it false ("a card no longer opens in place"), so it adds a sentence O77 must find. Fix at landing: drop it. failure scenario: a reader looking for how to open a card reads the header bullet and is sent to a "control" the bullet does not name; after O77, if missed, HELP states a behaviour that is gone. verdict: item 11 violated.
- 4. `config/text/views/boards/projects.yml:27-46` (`facet_code_tone: cyan`, `facet_form_tone: pink`, ... thirteen keys); what is wrong (judgment, against the brief's own decision 8): a facet's colour is not a word, and this file is a words catalog, whose values a display-language app's file and the workspace's `settings: { text: }` lay over key by key (`src/lib/data/sources/config/merge/language.ts`, head comment); nothing checks that the value names a tone. The tree's place for tone names is `config/catalogs/vocab.yml` (`focus_lane_tones: { funding: gold, jobs: grey-d, teaching: teal }`, line 191). The builder followed the brief; the glyph names already in text catalogs (239 `_glyph:` keys) carry the same exposure. Disposition is the orchestrator's: keep decision 8 or move the thirteen tones beside `focus_lane_tones` (a vocab key is a user-visible shape, so that move is Axel's). failure scenario: a language pack that translates the file whole writes `facet_form_tone: roze`; `var(--c-roze)` is undefined and every Form dot and fill is drawn with no colour, with no finding. verdict: none.
- 5. `src/lib/views/boards/projects/FilterBar.svelte:74-137` and `src/lib/views/boards/projects/SliceLine.svelte:77-141`: two copies of the fold-to-an-opener run (`gapOf`, `widths`, `runWidth`, `measure` over `fit()`, `clipped`, the `watchToolbar` effect, the `.slot.clipped` CSS); what is wrong: the rules file's principles ("a parser, a fold or a rule exists once and is reused"). Small and readable as is; a shared helper beside `ui/frame/toolbar/fit.ts` would hold it once. failure scenario: a fix to the measuring (a rounding of widths, a gap read) made in one bar line and not the other leaves one line wrapping or clipping at a width where the other does not. verdict: none.

## 4. Behaviour

- 1. `src/lib/state/boards/board/facets.ts:73-74, :92-103` (`NAMED_RECORDS` adds venue, pillar, funding, dataset); what is wrong: a pillar value in its group list now reads the pillar's title ("Blue line") where the base read its key ("pl"); judgment 4 states it, but "What the look on landing should see" does not name it. failure scenario: the look compares the More list's Pillar section with the base and reads a changed label as a regression, or misses checking it.
- 2. `config/defaults/layout.yml:243-298`: Supervision, Coauthor, Archive and Software lose their Domain, Pillar and Funding columns and gain Stage, Lane, Next and With; what is wrong: item 10 asks for it, but the report's before/after names only the Projects board's old columns. failure scenario: the look checks only Projects and never sees the other five boards' lists.
- 3. `src/lib/views/boards/projects/BoardList.svelte:114`: `<Table {columns} {rows} rowKey="id" sortable {cell} />` once per section; what is wrong: a press on a column heading now sorts only that section's table, where the base list sorted the whole list; the report does not state it. failure scenario: a reader sorts by Venue in list mode and expects one sorted list, and gets each section sorted on its own with headers to press per section.

## Declined to judge

- The new G124 row's failure on the unchanged tree: not rerun; it needs the new test file in the base copy, and the reviewer writes no file. The base exports no `sliceGroups` (grep count 0), consistent with the quoted TypeError.
- Case 21's run: not rerun; it needs a hub file planted on disk. Judged by reading `vocab.ts:78`.
- Which hunks the inline `python3`, `perl` and `sed` commands produced (Spec 4): only the builder's list of the commands settles it.
- Whether the tip of the disabled Mine only Chip shows on hover: the Tooltip wraps a disabled button, as ToolButton's disabled buttons are wrapped; a DOM settles it, at the look.
- Cases 1, 5, 10 to 13, 15 and the second part of 22, and Spec 5's visual weight: the look on landing, as each verdict says.
- G124's text and Code line rewrite and G92's Test line: ledger lines the orchestrator writes at landing.
- Whether the facet tones stay in the words catalog (Standards 4): the brief's decision 8, the orchestrator's to keep or reverse, and Axel's if it becomes a vocab key.
- The report's folder count "src/lib/views/boards/projects 7" against `ls` showing six files: the deleted tracked `Stats.svelte` explains it under `git ls-files -co`, which the reviewer does not run; no decision rests on it.

Reviewer usage: a77378f8667072b40, claude-opus-5-5, 305807 tokens, 70 tool uses, 14 min 40 s.

## Repair round <n>, refuted (one section per run after a round, when the configuration block says refute_after_repair: yes)

```
<each verification command rerun over the repaired tree, and its summary line, verbatim>
<each command the round's report quotes as evidence, and what it printed>
```

### Verdicts

- <n>, and <the case>: the verdicts again for the whole diff since the base, in the form of "Verdicts" above.

### Findings

- <file:line, or page and section>: "<the quoted hunk>"; what is wrong: <the closure claimed and what the rerun or the read showed, or what is there against what the brief or the standard asks>; under the heading it belongs to (spec, proof, standards, behaviour); failure scenario: <the input or state and the wrong result it gives, or the reader and what the text leads them to do wrong>; verdict: <the item or case it makes violated, partial or unmet, when there is one>. Or: none.

### Declined to judge

- <a point the reviewer did not check, or declined because it is the user's call or outside what a read and a rerun can settle>, <the reason>. Or: nothing.

Reviewer usage: <the session fills this from the completion notice: agent id, served model, tokens, tool uses, minutes>.

## Closed (the orchestrator's disposition of every finding above, appended before /land)

- <finding>: closed in the round, <file:line, or page and section, and the check that shows it>; or fixed at landing, <what and where>; or raised to the user as an open item, <the item as the state file holds it>.

---

Notes for the orchestrator, on the points the brief asked me to judge (each is also a finding or a verdict above):

- Inline `python3`/`perl`/`sed` (Spec 4): a finding of an unapproved script. Under the skill it goes to Axel as an open item and is not fixed at landing; the report does not say which files or lines it touched.
- The `npx vitest run --project unit --dir ...` run (Standards 1): a whole-suite command under the rules file's "Token discipline". It was disclosed and its result was not used.
- Chip.svelte, vocab.ts:241 and the extra `items.ts` lines (Spec 1 to 3): each is outside the path list, each is needed by an item, and each is named in the report as the rules file asks. I recommend accepting all three at landing.
- Facet tones in projects.yml (Standards 4): this is the brief's decision 8. My judgment is that `vocab.yml` beside `focus_lane_tones` is the better place, because a language file can override a text catalog.
- The HELP sentence "A card opens and closes in place by its own control." (Standards 3): true now, but it is in the wrong bullet and O77 will make it false. Drop it at landing.
- G92's Test line and the kept describe title (Standards 2): the title and the head comment name the removed Filter menu. Retitle the describe, the head comment and G92's Test line together at landing, and add `slice: ''` to the fixture.
- Table sticky (Spec 6): the report's claim holds and the brief's premise is wrong. `Table.svelte`'s own `stays` doc comment is wrong on the base tree too.

Files: the diff is in /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75 (35 tracked files, 1224 insertions and 906 deletions, plus 4 new files). The builder's report is at /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O75/.scratch/migration/agents/reviews/O75-report.md. Its case-run sources are at /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/caserun/after.test.ts and before.test.ts. My verify log is at /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o75-quick.log.