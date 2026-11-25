# Step O192 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O192, base 7b57cb7f5)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

Every command was run from the worktree root, in the foreground, at background priority (`taskpolicy -b nice -n 19`), vitest with `TMPDIR` and `GIT_CEILING_DIRECTORIES` set to `.agents/scratch`. The reviewer's `.agents/scratch/` folder (vitest's compile cache and the unused-exports listing) was removed after the runs: `ls .agents` prints `plan.yaml`. The rerun of `npm run diagrams` rewrote the six diagram files with the content they held: `git diff 7b57cb7f5 --stat -- docs/diagrams` printed the same `6 files changed, 8 insertions(+), 8 deletions(-)` before and after it, and `git status --short` lists the same paths.

```
$ npm run diagrams
> node utils/diagrams/diagrams.mjs
docs/diagrams/layers.dot ... (18 paths listed, layers through writes.svg)
diagrams exit=0
$ git diff 7b57cb7f5 --stat -- docs/diagrams
 docs/diagrams/layer-state.dot | 2 +-
 docs/diagrams/layer-state.svg | 2 +-
 docs/diagrams/layer-views.dot | 2 +-
 docs/diagrams/layer-views.svg | 2 +-
 docs/diagrams/layers.dot      | 4 ++--
 docs/diagrams/layers.svg      | 4 ++--
 6 files changed, 8 insertions(+), 8 deletions(-)

$ npx vitest run tests/state/boards/board/exclude.test.ts tests/state/boards/board/hub-facets.test.ts tests/state/boards/board/board-rules.test.ts tests/state/boards/board/board-views.test.ts tests/checks/source/keys.test.ts tests/checks/source/history.test.ts tests/checks/source/comment-width.test.ts tests/checks/tree/size.test.ts tests/checks/tree/boundaries.test.ts --maxWorkers 2 --testTimeout 0 --reporter dot
 Test Files  9 passed (9)
      Tests  183 passed (183)

$ npx prettier --check config/catalogs/glyphs.yml config/catalogs/icons.yml config/text/views/boards/projects.yml docs/HELP.md src/lib/state/boards/board/facets.ts src/lib/state/boards/board/filter-menu.ts src/lib/state/boards/board/index.ts src/lib/state/boards/board/presets.ts src/lib/state/boards/board/state.ts src/lib/state/boards/collection/bar.ts src/lib/state/boards/collection/index.ts src/lib/state/boards/structure/graph.ts src/lib/state/boards/structure/map-bar.ts src/lib/state/life/present.ts src/lib/ui/controls/Chip.svelte src/lib/views/boards/collection/Collection.svelte src/lib/views/shared/forms/bar/BoardBar.svelte src/lib/views/shared/forms/bar/FilterBar.svelte src/lib/views/shared/forms/bar/PickMenu.svelte src/lib/views/shared/forms/bar/SliceLine.svelte src/lib/views/structure/map/Map.svelte tests/state/boards/board/exclude.test.ts
Checking formatting...
All matched files use Prettier code style!
prettier exit=0
(A first form that passed the list through an unquoted zsh variable printed "[error] No files matching the pattern were found: ..." for the list as one word; that is the shell, not the files.)

$ npx eslint <the 18 changed .ts and .svelte files above>
eslint exit=0   (no output)

$ npm run check
1795636346821 COMPLETED 4688 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

$ printf '%s\0' <the 22 changed source, config, doc and test files, the 6 diagram files and the report> | xargs -0 env LC_ALL=C perl -ne 'print "$ARGV:$.\n" if /[^\x20-\x7E\n]/; close ARGV if eof'
ascii exit=0   (no output)

$ python3 -c "import yaml,sys;[yaml.safe_load(open(f)) for f in sys.argv[1:]]" config/catalogs/glyphs.yml config/catalogs/icons.yml config/text/views/boards/projects.yml
yaml exit=0

$ npx svelte-kit sync; sh utils/unused-exports.sh > .agents/scratch/unused-now.txt; diff /Users/axelfaes/workspace/oculus/.agents/worktrees/O192-unused-base.txt .agents/scratch/unused-now.txt
exit=0
diff exit=0
     336 .agents/scratch/unused-now.txt
     336 /Users/axelfaes/workspace/oculus/.agents/worktrees/O192-unused-base.txt

$ wc -l <changed source files>
     386 src/lib/state/boards/board/facets.ts
     477 src/lib/state/boards/board/filter-menu.ts
      90 src/lib/state/boards/board/index.ts
     734 src/lib/state/boards/board/presets.ts
     392 src/lib/state/boards/board/state.ts
     596 src/lib/state/boards/collection/bar.ts
     787 src/lib/state/boards/collection/index.ts
     430 src/lib/state/boards/structure/graph.ts
     273 src/lib/state/boards/structure/map-bar.ts
     804 src/lib/state/life/present.ts
     320 src/lib/ui/controls/Chip.svelte
     468 src/lib/views/boards/collection/Collection.svelte
     111 src/lib/views/shared/forms/bar/BoardBar.svelte
     238 src/lib/views/shared/forms/bar/FilterBar.svelte
     459 src/lib/views/shared/forms/bar/PickMenu.svelte
     285 src/lib/views/shared/forms/bar/SliceLine.svelte
     288 src/lib/views/structure/map/Map.svelte
     506 tests/state/boards/board/exclude.test.ts

Commands the builder's report quotes as evidence, rerun:

$ npx vitest run tests/state/boards/board/exclude.test.ts tests/state/boards/board/hub-facets.test.ts --maxWorkers 2 --testTimeout 0 --reporter verbose
 <check mark> |unit| tests/state/boards/board/hub-facets.test.ts > the group lists on a workspace of two hubs > lists a value both hubs name once, counted over both 6ms
 <check mark> |unit| tests/state/boards/board/hub-facets.test.ts > the group lists on a workspace of two hubs > keeps both hubs' projects under a filter on that value 1ms
 <check mark> |unit| tests/state/boards/board/hub-facets.test.ts > the group lists on a workspace of two hubs > counts that value over both hubs' projects another facet's value leaves 36ms
 Test Files  2 passed (2)
      Tests  39 passed (39)
$ git diff 7b57cb7f5 --stat -- tests/state/boards/board/hub-facets.test.ts
(no output: G92's test is unchanged)

$ cd .agents/worktrees && diff -rq --exclude=node_modules --exclude=.svelte-kit --exclude=.agents --exclude=.git O192-base migration-O192
(28 lines: the 27 modified paths of `git status --short`, "Only in migration-O192/tests/state/boards/board: exclude.test.ts", and "Only in migration-O192/.scratch/migration/agents/reviews: O192-report.md"; the same set as the report's files table)

$ grep -rn "withPicks" src tests docs README.md; grep -rn --exclude=local.yml "withPicks" config
grep exit=1   (no output)

$ grep -n "G151" .scratch/migration/agents/guarded.md   (main checkout)
411:- G151. A period is read as EDTF level 0 ...
451:- G151. An excluded filter value hides every project that carries it, ...

$ grep -n "article" config/catalogs/vocab.yml
83:  journal:     { label: "journal article", icon: journals }

$ ls docs/adr
ls: docs/adr: No such file or directory
```

The case-run program (`.agents/scratch/cases.case.ts` and `cases.config.ts`) was removed by the builder, as spec.md asks. Its quoted output for cases 1 to 22 was not rerun; every case the G151 tables hold was rerun through those tables (above), and the rest (cases 6, 9, 10's other units, 11, 14, 22's Map half) are judged below by reading the code.

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `facetKeeps` (`src/lib/state/boards/board/state.ts:105-112`) is the one rule; `applyFilters` (state.ts:137-138), `meets` (collection/bar.ts:243-253), `stageKeeps` (map-bar.ts:119-130, terminal rule kept: line 129 returns `lists.included.length > 0 || stage === undefined || !terminal(...)`) and `sliceKeepsCard` (bar.ts:549-550) all call it. A record with no value passes the exclude test (`values.some` over an empty list is false). The G151 rows pass.
- 2: holds. `applyFilters` takes `excluded` as a fifth optional argument and `InForce` an optional `excluded`; `hub-facets.test.ts` is unchanged and passes.
- 3: holds. `BoardState.excluded` (presets.ts:228-233), read by `readPicks` under the rules of `filters` and then `withoutExcluded` (state.ts:282-283); `CollectionState` and `MapState` read it with `z.record(...).catch({})` and `withoutExcluded` (collection/index.ts:164,181-183; graph.ts:387,424-426); `PresentBar` and `barFields` carry it (present.ts:91-94,129-132). No reader of an older form.
- 4: holds for every writer the brief lists (BoardBar, Collection, Map, SliceLine through `withPick`, `withExclude`, `withCategory`, `noPicks`; the Present bar through `barFields({ ...filter.held, ...next })`). A writer the brief does not list is left on the include-only form: Spec, finding 1.
- 5: holds. `facets`' `left` drops both of the facet's lists (facets.ts:303-316); `boardFilter` and `mapBar` pass `excluded` through `appliedFilters`; `leftBy` and the Map's Stage counts (`stageGroup(items, others, ...)`, `others` with `excluded`) follow.
- 6: holds. `FilterChoice.excluded` is set by `choicesOf`, `groupOf`, `stageGroup`, `sliceChoices` and `showGroup` (always `false`); `filterGroups` and `withGone` list both lists' values no project holds at 0; the `NONE`-only group is drawn while `NONE` is in either list (filter-menu.ts:217-223).
- 7: holds. `groupWords` (filter-menu.ts:325-336), `picksOf` counts both lists; SliceLine's `picking` and `foldedPicks` count both (SliceLine.svelte:111-113,131).
- 8: holds by reading; the DOM half is the look's. The minus `ToolButton` is drawn only under `{#if onexclude !== undefined}`; its click calls `event.stopPropagation()` before `onexclude` (PickMenu.svelte:133-137). Shift+Enter: `onkeydown={shiftEnter}` on `Command.Root` calls `preventDefault()`; bits-ui's root merges the caller's props first (`mergeProps(restProps, rootState.props)`, `node_modules/bits-ui/dist/bits/command/components/command.svelte:120`) and svelte-toolbelt's `composeHandlers` returns before the next handler once `e.defaultPrevented` is set (`node_modules/svelte-toolbelt/dist/utils/compose-handlers.js:11-12`), so bits-ui's Enter case (command.svelte.js:928-940, `item?.click()`) does not run. The item's `data-selected` attribute the CSS reads exists (`"data-selected": boolToEmptyStrOrUndef(this.isSelected)`, command.svelte.js:1200). The Map's Show menu passes no `onexclude` (Map.svelte:220). `onexclude` is required in FilterBar and SliceLine Props.
- 9: holds by reading, with the keyboard half not verifiable here (Declined to judge). `pressSlice` reads `event.altKey`; `Chip.svelte` gains `excluded`, `aria-pressed={excluded ? false : pressed}`, the red line and the struck words; SliceLine titles an excluded chip `Stop excluding <value>`; the category head passes `event.altKey` to `withCategory`; `onfilters` hands back both maps.
- 10: holds for the places the brief names (project boards, Present view by reading `parsePresentState` and `acts/filter.svelte.ts:191`, the Map with `excludedPillars` in `context` for both `buildGraph` and `showGroup`, a collection's own groups and Projects section, the No funding card). The record board's count buttons are not reached: Spec, finding 1. A Projects-section exclude also hides cards that hold no project: Behaviour, finding 1.
- 11: holds. glyphs.yml:72 `exclude: "-"`, icons.yml:71 `exclude: minus`, each beside `check`.
- 12: holds. The five keys, word for word, in the `board` block of projects.yml (lines 29-31 and 50-51), each read by a literal `t('board....')`; `keys.test.ts` passes.
- 13: holds for what the item lists: the two HELP.md bullets are the ruled text word for word, lines 372 and 417 are rewritten and stay true, and every head comment the item names is rewritten. Two head comments outside the item's list are made false: Standards, finding 1.
- 14: holds. `tests/state/boards/board/exclude.test.ts` holds one table per unit of G151's Code line, its titles free of history (`history.test.ts` passes; my grep of the file for the history words prints nothing); the report quotes the unchanged-tree run (31 failed, 5 passed of 36) with failure messages. The two rows that test the Role and Hub drop do not reach the wiring: Proof, finding 1.

Cases of the brief's "Cases":

- 1: met, G151 row "an include and an exclude of one facet keep what carries the one and not the other", rerun passing.
- 2: met, row "an exclude alone keeps every project not carrying it".
- 3: met, row "an exclude of the value for none keeps the projects with a value".
- 4: met, row "an exclude of one of several values hides a project carrying it among others".
- 5: met, the Role and Hub rows of the board table and the report's quoted `boardFilter` run (`case 5 named true: ["c8","c2"]`, `case 5 one hub: {"shown":["c8","c1"],"excluded":{"hub":["lab"]}}`); see Proof, finding 1.
- 6: met, by reading `facets` (facets.ts:296-316: `left(facet)` drops the facet's key from both maps) and the report's quoted run (`case 6 status: [["paused",1],["__none__",1]]`, `case 6 form: [["article",1],["chapter",1]]`); not rerun.
- 7: met, the three `parseBoardState` rows, rerun passing.
- 8: met, the press rows, rerun passing.
- 9: met, by reading `groupWords` (`single`, `more = picksOf(group) - (single ? 1 : 2)`) and the report's quoted run (`Situation: blocked, not paused +2`, `More 4`).
- 10: met, by reading `filterGroups`, `withGone`, `categoryGroup`, `projectGroups`, `stageGroup` and `sliceChoices`, the Map table's row "an excluded stage no project is at is listed at 0", the Hub row of the collection table, and the report's quoted run.
- 11: met, by reading `parsePresentState` (present.ts:143, `barFields(parseBoardState(value))`), `barFields`, `boardFilter` and SliceLine's Clear all (`onfilters(noPicks())`, which BoardBar writes through the Present `write`).
- 12: met, the collection table's five rows for it, rerun passing.
- 13: met, the Map stage table, rerun passing.
- 14: met, by reading `showGroup` (`drawnOf` builds the graph over `context`, which holds `excludedPillars`) and Map.svelte:126-145,220, and the report's quoted run (`["pillars",1,false]`).
- 15: met, the graph table's row "drops the pillar nodes of an excluded key of every hub".
- 16: met, row "a value saved in both lists of a facet hides the projects carrying it".
- 17: met, `hub-facets.test.ts` unchanged and passing, and row "an exclude of a value both hubs share hides the projects of both hubs".
- 18: met, the three category rows.
- 19: met, row "drops an excluded compute value no facet offers and a slice no board holds".
- 20: met, the `withExclude` rows for the press, and the reading of bits-ui and svelte-toolbelt under item 8 for the row press not running; the key itself is the look's.
- 21: met, row "a Hub exclude hides the entries of that hub and lists both hubs".
- 22: met, the collection rows through `parseCollectionState` for its half, and the reading of `parseMapState` (graph.ts:420-429) for the Map's.
- 23: not verifiable here; it is the look at landing (the views and states the brief's case names).

## 1. Spec

- `src/lib/state/boards/record-board.ts:267-279`: "export function pressedState(saved: unknown, slices: readonly string[]): Record<string, unknown> { return { ...(isMap(saved) ? saved : {}), search: '', filters: slices.length === 0 ? {} : { slice: [...slices] }, stale: false, ... }"; what is wrong: a press on a record page's count button sets the record board's whole filter state by spreading the saved state and resetting `filters`, the search and the toggles, and it now keeps a saved `excluded` map, since the change added that map to `BoardState` and no one resets it here. The brief's writer list under "What is on the tree" does not name this writer (a premise the reviewer's grep does not reproduce: `grep -rnE "\bfilters\s*:" src` finds `src/lib/state/boards/record-board.ts:271`), and spec.md's "What every package obeys" asks that after a change of shape every hit be carried or named; the report names neither. The fix is one line (`excluded: {}`) in a file outside the write list, which the report should have named before writing it; failure scenario: a person's record board is open, the reader excludes the slice `publications/journal` on line 2 (or Situation `paused`); back on the person's page they press "3 publications", whose slices include `publications/journal`; `pressedState` writes `filters: { slice: [..., 'publications/journal'] }` and keeps `excluded: { slice: ['publications/journal'] }`; `parseBoardState` reads the value saved in both lists as excluded (state.ts:282-283), so the board shows fewer projects than the button counted, none of that slice's; with `paused` excluded it hides the paused projects the button counted; verdict: item 10 holds for the places it names, and this is a project board it leaves on the include-only reset.
- `.agents/scratch/cases.case.ts` (removed), report section "The case program": "one inline `python3` program changed `.agents/scratch/cases.case.ts` ... The `python3 -c` textwrap commands of the build only printed rewrapped comment paragraphs"; what is wrong: the case-run program itself is the kind spec.md's "What every package obeys" allows; the inline `python3` program that edited it is a script under the same rule ("an inline `python3` ... that changes a file is a script, needs that approval"), and the brief says "No script is written for this step ... other than a script the step builds", with no Rulings line approving one; the printing `python3 -c` textwrap programs are other scripts the brief does not approve. The report names them, so nothing is hidden, and no file of the diff was touched by them; failure scenario: the case program's source as quoted is the reviewer's only copy, and an edit made outside Edit leaves no record of its exact change, so the reviewer reruns a reconstruction on the builder's word for that edit; verdict: none.

## 2. Proof

- `tests/state/boards/board/exclude.test.ts:133-151`: "excluded: appliedFilters({ role: ['lead'] }, false)" ... "excluded: appliedFilters({ hub: ['lab'] }, true, [])"; what is wrong: the two rows that hold "a saved Role or Hub exclude narrows nothing while its group is not drawn" call `appliedFilters` (unchanged code) in the test and hand its result to `applyFilters`, so the lines the step wrote for that guarantee, `const excluded = appliedFilters(held.excluded, named, hubs)` (`src/lib/state/boards/board/filter-menu.ts:294`) and `appliedFilters(input.excluded, input.named, input.hubs)` (`src/lib/state/boards/structure/map-bar.ts:177`), are held by no test; both rows pass on the unchanged tree (the report's first run marks them passed). The brief's case 5 wording names `appliedFilters`, and the report's quoted case run does reach `boardFilter`, so the case is met; the finding is that the kept test does not hold the wiring; failure scenario: a later edit writes `const excluded = held.excluded` in `boardFilter`; G151's tables stay green, and a Role exclude saved while a user was marked hides every Lead project once the user mark is removed, with no Role group drawn to take it out; verdict: none (case 5 met).

## 3. Standards

- `src/lib/state/boards/record-board.ts:21-24` and `:261-266`, `src/lib/views/shared/card/record/RecordCounts.svelte:9-13`: "A press sets the tab's whole board state (`pressedState`): the slices it picks, no search, no other facet or toggle ... so the board shows exactly the projects the button counts" and "each press setting the tab's whole board state so the board shows exactly the projects the button counts"; what is wrong: spec.md's "What every package obeys" (a sentence in a head comment the change makes false is a defect of the change) and the brief's item 13: with a saved `excluded` kept, these sentences are false; the report's head-comment table does not list either file; failure scenario: a maintainer reads that a press resets every facet and trusts the count button, and the board disagrees with it as Spec finding 1 shows; verdict: none (item 13's list does not name these files).
- Report, section "Judgment calls the brief left open": "`FilterPicks` for the pair of maps (the name `Picks` is taken by ...)"; what is wrong: spec.md's "The principles every package is judged on" asks that the grep for a new helper's or type's name be quoted, and "What every package obeys" asks that a key the step introduces (the saved `excluded` key of four states) be checked empty, duplicated and colliding with the report stating what the code does in each case; the report quotes neither; by reading, `excluded` collides with no key of `BoardState`, `CollectionState`, `MapState` or `PresentState`, and an empty or wrong-typed value reads as `{}`; failure scenario: none at run time; the reader of the report cannot see the check was made; verdict: none.
- `src/lib/views/shared/forms/bar/PickMenu.svelte:392-399`: ".unseen { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }"; what is wrong: the same visually hidden block is now in three components (`src/lib/ui/forms/choice/select/FieldSelect.svelte:101-108`, `src/lib/views/academic/present/parts/project/Facts.svelte` near line 201, and here), against spec.md's principle that a rule exists once and is reused; a judgment that a shared `ui/` primitive or class would serve; failure scenario: a change to how screen-reader-only text is hidden reaches two of the three copies; verdict: none.

## 4. Behaviour

- `src/lib/state/boards/collection/bar.ts:490-493`: "const picking = itemRules.some((rule) => hasPicks(lists(rule.id))); ... entryPasses(entry, but) && (!picking || stripOf(entry).some(narrows))"; what is wrong: on the base (`bar.ts:459`) `picking` was true only while a project group had an include; it is now true for an exclude alone, so an exclude in the Projects section hides every card whose strip holds no project at all, though such a card carries none of the excluded value; item 1's rule says a record with no value is never hidden by an exclude, and the report's before/after line ("hides a card whose strip it leaves empty") does not state this case; failure scenario: on the Funding view, with many schemes that name no project, the reader excludes Form `article` in the Projects section; every scheme with no project disappears from the page beside the ones whose strips held only articles; verdict: none (case 12 met as written); whether a card with no strip should stay while only excludes are in force is a decision for the orchestrator to put to Axel or to rule under item 1.
- `src/lib/views/shared/forms/bar/PickMenu.svelte:125-130` with `src/lib/views/structure/map/Map.svelte:220`: "if (event.key !== 'Enter' || !event.shiftKey || event.isComposing) return; event.preventDefault(); ... if (row !== undefined) onexclude?.(row[0], row[1]);"; what is wrong: in the Map's Show menu Shift+Enter toggled the keyboard's row before (bits-ui's Enter clicks the selected item with Shift held or not), and now does nothing; in every other list Shift+Enter was the row press and is now the "not" press. The brief asks for both, and the report states the second, but its Show menu line ("the same, with no minus button and no Shift+Enter exclude") does not give the before and after of the first; failure scenario: a reader who toggled Pillars with Shift+Enter sees nothing happen; verdict: none.

## Declined to judge

- Whether Alt+Enter and Alt+Space on a focused slice chip reach `pressSlice` with `altKey` set. No browser is run here. A judgment from reading: the HTML specification's synthetic click sets its modifier keys from the key input device, and Chromium copies them from the key event, so Alt+Enter is likely to work; on macOS, Option+Space reports a key other than a plain space (the no-break space), and whether Chromium then activates the button at all is not known from here. The look at landing settles it.
- Case 23 and every drawn property (the red row and chip in each theme, the hover and keyboard-row visibility of the minus button, the tooltip, focus after a click on the minus button, what a screen reader announces for an option holding a button): the look at landing settles them.
- Rerunning the removed case-run program: the reviewer changes no file and wrote no copy of it; the cases it alone covers were judged by reading, as named per case above.
- The duplicate id G151 in `.scratch/migration/agents/guarded.md` (lines 411 and 451, quoted above): a ledger file, the orchestrator's to renumber; the builder's report names it correctly.
- The other three items of the report's "Anything in the brief that was wrong or impossible" were checked and hold: item 14 and case 22 differ in how case 22 is checked and both forms were done; the first HELP bullet, as ruled, does not say that a click on an included value turns it off; `article` is not a word of the shipped vocab (`config/catalogs/vocab.yml:83`, quoted above).
- That the diagram files after the rerun are byte-identical to the builder's: `git diff --stat` and `git status --short` are unchanged; a byte comparison would need the builder's copies, which `git show` does not hold for uncommitted work.

Reviewer usage: a383043f4b1ec814a, claude-opus-5-5, 276208 tokens, 76 tool uses, 1119 s.
