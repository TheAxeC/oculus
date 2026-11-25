# O192 brief check

## Names

Command: `grep -rnwE '<name>' src tests docs utils README.md config --exclude=local.yml`, run once per name, then narrowed with `grep -vE` to drop the brief's "Paths this step writes". The full lists are in `/Users/axelfaes/.claude/projects/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/tool-results/bp1dkn1te.txt`. Hits outside the write list:

- `applyFilters` and `facets`: `tests/state/boards/board/hub-facets.test.ts:15,62` (`applyFilters([...ITEMS, other], filters, '')`) and `:49,80` (`facets(items, PRESET, false, { filters: { funding: ['zonmw'] }, search: '' })`). The change does not make these false. It does need them to keep compiling and passing unchanged (case 17 and G92), so `applyFilters` must still accept three arguments and `InForce` (`facets.ts:256`) must take `excluded` as optional. The brief does not state this.
- `withPick`: `src/lib/state/system/config/scopes/scope.ts:89` and `ScopeBar.svelte:26,132`. This is a different function with the same name and is unaffected.
- `groupWords`: `src/lib/views/shared/explorer/tree/make/make-words.ts:10` and `MakeGroup.svelte:11,21`. A different function, unaffected.
- `meets(`: `src/lib/views/academic/present/screen/layout/slide-layout.ts:251,266,269`. A different function, unaffected.
- `picksOf`: `src/lib/server/machine/pty/start/compose.ts:221,249`. A different function, unaffected.
- `onpick` / `ontoggle`: about 75 and 60 files use these as generic prop names of other components (for example `ui/menu/Menu.svelte`, `ui/tree/TreeView.svelte:65`). They are unaffected.
- `PickMenu` callers outside FilterBar and SliceLine: `src/lib/views/structure/map/Map.svelte:205`, `<PickMenu label={t('map.show')} groups={[show]} onpick={toggleShow} />`. This is the Map's Show group (Projects, Pillars, Team, Connected only). Map.svelte is in the write list, but item 7 ("every `PickMenu` caller pass the 'not' press") would put a "not" button on toggles that are not filter values. The brief must say whether the Show group gets one (finding N1).
- `stageKeeps`, `filterGraph`, `FilterChoice`, `moreWords`, `onfilters`, `barFields`, `PresentBar`, `withPicks`: no hit outside the write list.
- `PresentBar` is the type `Pick<BoardState, 'search' | ... | 'filters'>` at `present.ts:90-93`, not at 127-130 (that is `barFields`). It needs `'excluded'` added. The file is in the write list.
- `filters` in the saved states: `grep -rn "filters: {\|{ filters\|filters\[" src` found no other writer of a saved board, collection or Map filter. `excluded`: `grep -rnw excluded src tests config docs utils` found no collision with the new key. `onexclude`: no hit.
- Glyph `check`: `TreeItem.svelte:162`, `MenuList.svelte:76`, `CommitBox.svelte:215`, `InboxCard.svelte:254`, `Merge.svelte:143`, `Branches.svelte:144`, `Worktrees.svelte:241`, `RefactorPreview.svelte:90`. Unaffected, since `check` is not changed.
- Text keys `board.group_picked`, `group_picked_more`, `more_count`, `slices_more_picked`: only `filter-menu.ts:307,308,314` and `SliceLine.svelte:184`, all in the write list. `grep -rn "group_not\|group_both\|exclude_stop\|board.exclude" config src` finds nothing, so the four new keys collide with nothing.
- `src/lib/ui/controls/Chip.svelte` (not in the write list, finding N2). SliceLine draws line 2 through `Chip` (`SliceLine.svelte:158-165`). Chip has no struck or excluded prop: its Props at `Chip.svelte:26-63` are label, tone, glyph, filled, outlined, onclick, pressed, title, disabled, onremove and removeLabel. It is an inline control, so a line-through set on a wrapper does not reach its words. Item 8 ("an excluded chip is drawn struck through in red") therefore needs either a Chip change or a `:global` rule from SliceLine. Chip's `pressed` also drives `aria-pressed`, and the brief does not say what an excluded chip reports.
- Names the step must change that the brief does not list: `withGone` and `categoryGroup` (`collection/bar.ts:283-308,404-413`) list a picked value no record holds at 0 for the collection's Category, Role and field groups, so item 5's "list an excluded value no project holds at 0" runs through `withGone` and not `groupOf`. `foldedPicks` (`SliceLine.svelte:104`, the "+5, 1 picked" words) is an "is anything picked" count that item 6 does not name. All are in files of the write list.

## The step line

There is no `## Goal` section in `.scratch/migration/plan.md`: `grep -n '^## ' .scratch/migration/plan.md` prints only `5:## Steps, in execution order`, `1790:## Could run in parallel`, `1803:## Rulings`, `3801:## Agents` and `4839:## Blocked, and by what`. The goal used below is the one in my brief.

How each requirement maps to the brief, step line first (`plan.md:1760`):
- Every choice can be excluded as well as included: items 3, 7 and 8.
- A project carrying an excluded value is hidden: items 1 and 9.
- Exclude wins within a facet: item 1.
- The values for none can be excluded: items 1 and 5.
- The counts: item 4. The saved filter state: item 2.
- Every bar through `filterGroups`/`applyFilters` (project boards, Present, Map, collection Projects section): items 5 and 9.
- The docs that state how a pick filters: item 12 (HELP 372 and 417). The tests that state how a pick filters: item 13.

Ruling "Exclude in the board filters" (`plan.md:3798`):
- A click keeps including, and a second action on the row excludes: item 7.
- Drawn struck through or in red: items 7 and 8.
- The Cardiology example: case 1, as an analogue.
- Excluding No venue: item 1 and case 3.

Ruling 783 (`plan.md:3799`):
- (1)(a): a "not" button at the row's end, shown on hover and on the keyboard's row; a click excludes and a second click clears; a row click includes; Shift+Enter excludes; Alt-click excludes a slice chip. Items 7 and 8.
- (2)(a): struck through on a red chip with a minus: items 7 and 10. `not <value>` in the group button: items 6 and 11. An excluded slice chip struck through in red: item 8.
- (3)(a): every choice through `PickMenu` and the line-2 slices; the project boards, Present, the Map with the pillar node taken off, the collection Projects section and its own groups; the quick toggles left as they are. Items 7 and 9.

Every requirement has a part. Parts with no requirement behind them:
- S1. Item 12's new bullet under "Project boards". The step line asks that the docs which state how a pick filters follow. The Project boards section (`docs/HELP.md:114-127`, read) states nothing about the bar, so this is an addition. spec.md:72 forbids adding to HELP.md except where the brief's purpose is to write it or Axel ruled the line in. HELP 372 and 417 are covered by the step line; the new bullet is not. It is also not dictated word for word.
- S2. Item 3's "Clear on one group" press. No such control exists. `grep -rn "withPicks\|clear" src/lib/views/shared/forms/bar Collection.svelte Map.svelte Projects.svelte` shows the only `withPicks` caller is `SliceLine.svelte:133` (`pickCategory`), and the only Clear is Clear all (`SliceLine.svelte:197-199`). A helper for it has no caller, which breaks the YAGNI rule and the unused-exports check of spec.md:89.
- S3. Item 13's new test file: see Cases (C1). The step line says tests follow; it rules no new guarded entry.
- S4. Item 7's accessible names and tips (`Exclude <value>`, `Stop excluding <value>`), and "always on an excluded row". Neither ruling names them, and neither is in the brief's "Decisions taken" list (decisions 1 to 4). "Always on an excluded row" follows from "a second click clears". The words are a user-visible choice and belong in the decisions list.
- S5. Item 8's "a second Alt-click clears it, an Alt-click on an included chip excludes it". This is derived from item 3's "not" press and is not ruled. It is not listed as a decision.
- S6. Paths with no item that changes them: `src/lib/views/boards/projects/Projects.svelte` (it hands `write` to BoardBar, `Projects.svelte:236,368`, and nothing in the brief needs a change there) and `tests/state/boards/board/board-rules.test.ts` (no item says what changes in it).

## Premises

Commands: `git diff --stat 152af2547 HEAD -- src config docs tests` (prints nothing, which holds); `ls -d .agents/worktrees/migration-O192 .agents/worktrees/O192-base .agents/worktrees/O192-unused-base.txt`; `grep -n` for each named function; `sed -n` and `wc -l` over each named range.

Do not hold:
- P1. The worktree, the base copy and the unused-exports list do not exist yet. `ls` printed `No such file or directory` for all three, and `git worktree list | grep O192` is empty. They are expected from /spec after this check.
- P2. "`filterGroups` and `choicesOf` (`filter-menu.ts:144-197`)". Actually `choicesOf` is 159-178 and `filterGroups` is 193-221; 144 is inside `valueLabel`. `boardFilter` is 252-287, not 252-285.
- P3. "`facets` (`facets.ts:160-215`) ... `left` ... `without`, `facets.ts:139-142,173-176`". `grep -n "export function facets\|function without\|const left" facets.ts` prints `259:function without`, `279:export function facets(` and `292: const left`. Lines 136-215 are `orderValues`, the Slice types, `sliceWord` and `sliceValue`. Read list item 2 (`facets.ts:136-215`) therefore misses `facets()` and `InForce` (`:256`) altogether.
- P4. "`sliceKeepsCard`, `bar.ts:500-501`". Actually 516-517 (`const sliceKeepsCard =` at 516). Lines 499-502 are the status slices.
- P5. "`PresentBar` (`src/lib/state/life/present.ts:127-130`, `barFields`...)". The type is at `present.ts:90-93`; 127-130 is `barFields`.
- P6. "`projectGroups` (`bar.ts:316-365`)". It ends at 360. `picksOf` is at 295-297, not 296. `FilterChoice` ends at 62. These are minor.
- P7. Brief line 5 is broken: "Then, in full: `.scratch/migration/agents/spec.md` is the one standards page the configuration lists, and no ADR touches this step." It names nothing to read in full.

Hold:
- `applyFilters` at 101 (head comment from 97), with `selected.some(...)` at 117.
- `boardStateShape` at 171-183; `parseBoardState` at 193-226; `withPicks` at 233; `withPick` at 246; `index.ts:82-83`.
- The exclude grep prints only `focus-lanes.ts:265`.
- `presets.ts:228`; `collection/index.ts:160-166` and `NO_FUNDING` at 656; `mapStateShape` at 379-393.
- `BoardBar.svelte:91,102`; `Collection.svelte:270,382`; `Map.svelte:117-121,141-142,233`; `SliceLine.svelte:132-134,164,188,199`.
- `filter.svelte.ts:107`; `mapBar` at 160-179; `stageGroup` at 128-157; `stageKeeps` at 111-120; `meets` at 229-240; `picking` at 459; `groupOf` at 386-401; `sliceChoices` at 322.
- `filterGraph` at 275-297, which is not exported (`function filterGraph`), so case 15 goes through `buildGraph` as it says.
- `groupWords` at 303-309; `projects.yml:47-48` (`group_picked: '{0}: {1}'`, `group_picked_more: '{0} +{1}'`).
- PickMenu: 343 lines, rows at 113-134, `Glyph name="check"` at 125. FilterBar: 229 lines, 147 and 186. SliceLine: 253 lines.
- `glyphs.yml:71` `check: "+"`; `icons.yml:70` `check: check`; the minus grep gives only `collapse: minus-circle` and `unstage: minus`.
- `docs/HELP.md:372` and `:417` quoted correctly; 114-127 has no filter-bar text.
- `board-rules.test.ts` is 825 lines (`applyFilters` at 198-199 and 217, `parseBoardState` at 748). `hub-facets.test.ts` has three tests at 48, 56 and 66, which G92 names (`guarded.md:323-325`).
- All the sizes quoted match `wc -l`. `ls docs/adr`: no folder. `standards: [.scratch/migration/agents/spec.md]` (`orchestrator-state.md:11`).

Also checked: decision 4's tokens. `--c-red` is at `src/lib/themes/tokens.css:31`; `--on-c-red` and `--c-red-txt` are derived (`derive.ts:244-246,319`); the tab strip draws a problem in `--c-red-txt` (`TabFace.svelte:383,406`). This holds.

## Cases and checks

- C1 (the test rule). spec.md:60 says "A test exists only as the test of one entry of `agents/guarded.md` ... A builder writes no other test ... A step that needs a new entry stops and asks Axel for it, and writes no test until he has ruled". `guarded.md:3` says "A new entry needs Axel's yes". Item 13 asks the builder to write `exclude.test.ts`, holding cases 1-8, 10, 12, 13, 15, 16 and 17, with no entry named or ruled. G92 covers `facets`, `facetValues` and `applyFilters` only for the two-hub guarantee. G124's Code line does not name `state.ts`, `collection/bar.ts`, `map-bar.ts` or `graph.ts`. `grep -n "O192\|exclude" orchestrator-state.md` shows only open item 783, with no entry asked for. Earlier steps took this to Axel as an open item (`plan.md:3625`, open item 652; `plan.md:3703`, open item 721). Every test case is therefore inconsistent with spec.md until Axel rules on a new entry. The entry rule also wants "one test per unit ... written as a table", but the brief puts one file across six units (state.ts, facets.ts, filter-menu.ts, collection/bar.ts, map-bar.ts, graph.ts). Case 17's second half (an exclude of the shared hub value) is G92's guarantee, whose Test line names `hub-facets.test.ts`, yet it is placed in the new file.
- C2. Case 8 contradicts item 3. Item 3: "a pick of a category's slices ...: the facet's include list is set and its exclude list emptied". Case 8: "a category pick sets the include list and removes those values from the exclude list". All slices share one facet (`slice`), so item 3's form would also clear excluded slices of other categories. Under the brief's own row rule, case 8's form is the consistent one.
- C3. Case 8's "Clear on one group empties both lists of that facet only" tests a press no control in the tree makes (S2).
- C4. Case 17's first half ("G92's three tests pass unchanged") holds only if `applyFilters(items, filters, '')` and `facets(..., { filters, search: '' })` still compile. This is a constraint on the new signatures that the brief should state.
- Expected results checked against item 1 and against O191's `NONE` values: cases 1, 2 (D carries `NONE`, so it is kept), 3, 4 (no pillar is `NONE`, so it is kept), 5, 6, 7, 9, 10, 12, 13, 16. All are right under the brief's own rule.
- No case asks for a check of a place the step does not change.
- The brief dictates no test titles, so the history-word rule has nothing to read. Item 13 and verify 5 require each test to run first on the unchanged tree; for the press helpers and `excluded: true` that run fails only on a missing export.

## The question

The question for each item: could it pass without the goal being reached (on every bar that draws filter choices, a value can be excluded as the rulings say)?

- Cases 1-7 and 16: yes. They check only the state rule and the parse, so they pass with no press on any bar wired to exclude.
- Case 8: yes. The helpers can exist while BoardBar, Collection, Map and SliceLine still write through `withPick` alone. Nothing but the look ties the writers to them, and item 7 does not say `onexclude` is a required prop of FilterBar and SliceLine, which is what would make `npm run check` catch a caller left out.
- Case 9: yes, it checks words only.
- Case 10: yes, it checks only `filterGroups`. Nothing checks `excluded: true` from `groupOf`/`withGone`, `projectGroups`, `stageGroup` or `sliceChoices`, so the collection's own groups, the Map's Stage group and the folded slices could draw no excluded row.
- Case 11: partly. It reads the state; it does not check that the Present bar's `write` (`filter.svelte.ts:191`) carries `excluded` from a press.
- Case 12: yes for the presses. It checks the collection rule, not the Collection.svelte writers or the collection's counts (item 4).
- Case 13: yes for the Stage group's row state, since `stageGroup`'s `excluded` flag is not checked.
- Cases 14 and 15: yes for the Show group's counts (item 9 "showGroup counts by the same context"), which no case checks.
- Case 17: yes, it checks the rule only.
- Case 18: yes. It names no views, so one look on a project board can pass while the Map, a collection's own groups, its Projects section, the Present view and the folded slices are unwired. Shift+Enter can also pass while broken. bits-ui's Command clicks the selected item on any Enter, Shift or not (`node_modules/bits-ui/dist/bits/command/command.svelte.js:928-940`, `case kbd.ENTER: ... item?.click()`), so a Shift+Enter handler that does not stop that runs both presses. On an off row, include then exclude ends at excluded and the look sees the expected result; the fault shows only on an excluded row (it stays excluded) or with the other order.
- Step line: no gap of its own beyond the cases.
- Item 1: no.
- Item 2: no for the parse. Writers could still drop `excluded`; only the look shows that.
- Item 3: yes, as for case 8.
- Item 4: yes for the collection and Map Stage counts, which no case checks.
- Item 5: yes, as for case 10.
- Item 6: yes for `foldedPicks` and the collection's `picking`/`sliceKeepsCard`, which it does not name. Case 12 reaches `picking` indirectly.
- Item 7: yes, for the Shift+Enter and click-bubbling double press described under case 18. A click on a button inside a `Command.Item` bubbles to the item's own click, which selects it.
- Item 8: yes. Chip cannot draw strike-through without a change (N2), and a keyboard reader has no way to exclude a line-2 chip.
- Item 9: yes, through cases 12-15 as above.
- Items 10 and 11: no. The orphan-key and glyph tests make them read.
- Item 12: judged by reading; S1 applies.
- Item 13: C1.

## Implied inputs

Each input below is missing from "Cases"; the expected result follows each one.
1. An exclude on a facet whose group is not drawn: a Hub exclude on a one-hub workspace (board and Map through `appliedFilters`; collection, where `hubRule` is absent at `bar.ts:435`), and a Role exclude with no user marked on a collection or the Map (case 5 covers the board only). Expected: it narrows nothing, and the saved exclude is kept so it applies once the group is drawn.
2. A saved exclude of a compute value no facet offers, and of a slice no board holds. Expected: `parseBoardState` drops it from `excluded`, as item 2 says.
3. The Present view's Clear all (`SliceLine.svelte:199` through `BoardBar.svelte:102` and `filter.svelte.ts:191`). Expected: the pane saves `filters: {}` and `excluded: {}` and its kept list widens.
4. The collection Hub group with several hubs. Expected: excluding a hub hides that hub's entries and lists that row excluded. `groupOf` is used without `withGone` (`bar.ts:480`), so every hub stays listed.
5. Shift+Enter against bits-ui's Enter handling (above). Expected: only the "not" press runs, never the include.
6. Shift+Enter on an excluded row. The brief does not say whether it clears it or leaves it excluded; by item 3's "not" press it would clear it.
7. The Map's Show group: whether its rows get a "not" button (N1). Expected (my judgment): none, since its rows are node kinds and not filter values. Also its Pillars and Projects counts under an excluded pillar. Expected: the pillar nodes drawn without those of the excluded key, and the projects without those in it.
8. A press on a category head of line 2 when some of its slices are excluded. Expected (case 8's form): every slice of the category included, those values taken out of the exclude list, other categories' excludes kept. Alt-click on a category head is unspecified.
9. The folded slices' words "+<n>, <k> picked" (`SliceLine.svelte:104,184`) when a folded slice is excluded. Expected: k counts it, as More's count does.
10. A collection card with an empty strip under an exclude-only Projects-section pick. Today's rule hides it (`bar.ts:462`, `!picking || stripOf(entry).some(narrows)`). The expected result is unstated; by HELP 372 ("hides a card whose strip it leaves empty") it is hidden.
11. The No funding card under an exclude of another status slice. Expected: kept (`slicePicks` include empty), with its count over the projects left.
12. `parseMapState` and `parseCollectionState` with `excluded: 5`, and with a value in both lists. Expected: `excluded` reads as `{}` with `filters` kept; a value in both lists reads as excluded. Cases 7 and 16 cover the board only.
13. The accessible state of an excluded row and an excluded chip. A button inside a `Command.Item` (role option, whose children are presentational) may not expose its name `Exclude <value>`. Chip's `pressed` gives `aria-pressed`, and an excluded chip's value is unstated.
14. Keyboard exclude of a line-2 slice chip that is not folded (Alt with Enter or Space). Unstated.
15. The Map's Stage group listing an excluded stage no project is at. Expected: at 0, after the held stages, marked excluded (item 5).

## ADRs

`ls docs/adr` prints `ls: docs/adr: No such file or directory` (rc=1). `ls docs` lists apps.md, data-map.md, decks.md, diagrams, HELP.md, licenses, palette.md, templates.md and third-party.md. There are no ADRs.

## Dictated text

- `grep -n "group_not: 'not {0}'" O192.md` finds line 46. `group_not: 'not {0}'`: holds (ASCII, plain, the wording fixed by ruling 783 (2)(a)).
- Line 46, `group_both: '{0}, {1}'`: holds. It yields the ruled example `Situation: blocked, not paused`.
- Line 46, `exclude: 'Exclude {0}'`: holds against CLAUDE.md "Writing" and spec.md:51. It is a user-visible word that neither ruling names and that is missing from "Decisions taken" (CLAUDE.md "Working on the code", "No silent design decisions"; spec.md:18).
- Line 46, `exclude_stop: 'Stop excluding {0}'`: the same as `exclude`, holds with the same note.
- Line 45, `exclude` in `glyphs.yml` (ASCII `"-"`, beside `check`): holds. `"-"` is printable ASCII as `glyphs.yml`'s head requires, and repeated values exist already (`unstage: "-"` at :63).
- Line 45, `icons.yml` (`minus`): holds. `minus` is a lucide icon already used (`unstage: minus`, `icons.yml:62`).
- Line 41, the button words `Situation: blocked`, `Situation: not blocked`, `Situation: blocked, not paused`, `Situation: blocked, not paused +1`: hold. They are ASCII, consistent with `Form: journal article +1`, and the first three are ruled.
- Line 42, the accessible names `Exclude <value>` and `Stop excluding <value>`: hold for prose. The same note as `exclude` applies. The brief also never says what the "not" button itself draws (a glyph or the word "not"); if it draws the word, no key is dictated for it (spec.md:51, every user-facing string through `t()`).
- Item 12's HELP bullet is described, not dictated, so its words cannot be read here. Adding it breaks spec.md:72 unless Axel rules the line in (S1).

## Declined to judge

- Whether a not-button inside a bits-ui `Command.Item` is announced by screen readers. Reading the ARIA rule says option children are presentational; only a run in a browser would settle it.
- Whether `npm run check` type-checks `tests/` (`tsconfig.json`'s include list was not read). This decides whether a signature change that breaks `hub-facets.test.ts` shows up before the test run.
- Whether Alt-click reaches a Chip the same way in the desktop app on macOS. Not run.

Usage: acfbfad14ab71fdbb, claude-opus-5-5, 232771 tokens, 71 tool uses, 742 s.

## Closed

- C1 (tests need a guarded entry), S1 (a new HELP line), S4 (the "not" button's words), N1 (the Map's Show menu) and the keyboard of line 2's chips (Implied inputs 14, S5, Implied 8): raised to Axel as open item 784; the brief was taken back to main's copy (none) at the stop.
- P1 to P7, N2 (Chip.svelte needs an excluded state), S2 (no Clear-one-group control: the press is dropped), S6, C2 (a category pick takes only its own values out of the exclude list), C3, C4 (`applyFilters` and `facets`'s `InForce` keep their present call forms, `excluded` optional), the question's gaps and Implied inputs 1 to 4, 6, 7, 9 to 13 and 15: closed in the brief when /spec is run again after the ruling, each named there under this heading.

### Closed in the brief after rulings 784

- C1: G151 booked in `agents/guarded.md` (784 (1) (a)); item 14 names its tables. S1: item 13 dictates the two bullets of 784 (2) (a). S4: item 8 and decision 6 under 784 (3) (a). N1: item 8, `onexclude` optional in PickMenu and the Show menu passes none (784 (4) (a)); case 14. Chip keyboard and category head: items 4 and 9 under 784 (5) (a); cases 18 and 23.
- P1: the tree line says /spec makes the worktree and base copies after the commit. P2 to P6: the line numbers corrected (`choicesOf` 159-178, `filterGroups` 193-221, `boardFilter` 252-287, `facets` 279, `InForce` 256, `without` 259, `left` 292, `sliceKeepsCard` 516-517, `PresentBar` 90-93, `projectGroups` 316-360, `picksOf` 295-297, `FilterChoice` 45-62), read list item 2 now `facets.ts:250-340`. P7: line 5 rewritten.
- N2: `Chip.svelte` added to the paths with an `excluded` prop (item 9). S2/C3: the Clear-one-group press dropped (item 4). C2: a category pick takes only its own values out of the exclude list (item 4, case 18). C4: item 2 keeps the call forms of `applyFilters` and `facets`. S5: decision 5. S6: `Projects.svelte` and `board-rules.test.ts` removed from the paths. Names: `withGone`, `categoryGroup`, `foldedPicks`, `PresentBar` named in items 3, 6 and 7.
- The question: `onexclude` required in FilterBar and SliceLine so `npm run check` finds a bar left out (item 8); Shift+Enter stops bits-ui's Enter (item 8, case 20); the click on the not button stopped before the item (item 8); cases 10, 11, 13, 14 and 23 widened to the collection groups, the Stage group, the folded slices, the Present writes, the Show counts and every view.
- Implied inputs 1 (case 5), 2 (case 19), 3 (case 11), 4 (case 21), 5 and 6 (case 20), 7 (case 14), 8 (case 18), 9 (item 7, case 23), 10 (case 12), 11 (case 12), 12 (case 22), 13 (decision 6), 14 (item 9), 15 (case 13).
- Dictated text added after the check, held line by line against CLAUDE.md "Writing" and spec.md: `excluded_state: excluded` (item 12) holds; the two HELP bullets of item 13 hold (ASCII, no dash standing in for an em dash, one line each, the wording ruled in 784 (2) (a)); `exclude: "-"` and `exclude: minus` (item 11) hold.
