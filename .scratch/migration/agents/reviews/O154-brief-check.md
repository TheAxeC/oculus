# Brief check: O154

## Names

1. `src/lib/views/shared/forms/bar/FilterBar.svelte` is not in the write list, and the step makes its head comment false. `grep -rn "Present view\|Present pane" docs src/lib/state/boards src/lib/views/shared README.md config/text` prints `src/lib/views/shared/forms/bar/FilterBar.svelte:4:    // (views/structure/map/Map.svelte) and the Present view's filter`. Lines 2-16 name `views/academic/present/Bar.svelte` as a caller and say "the Present view gives neither, so its line is the group buttons alone" (`:9-10`). After the step the Present view draws the bar through the new shared component, with search and Mine only, so both statements are false. None of the greps in item 7 (`Filtered`, `Pillar and Form`, `FILTER_GROUPS`, `keptKeys`, `projectFilter`) finds this text.
2. `src/lib/state/boards/structure/map-bar.ts` is not in the write list, and the brief says it "does not change" (premise line 18). The same grep prints `map-bar.ts:16:// (state/boards/collection/bar.ts) and of the Present view's filter (state/life/present.ts),` and `map-bar.ts:40:/** The facet key the Stage group's picks are stored under, the Present view's filter's too. */`. The step makes both false. The step also takes away the only importer of `STAGE_FACET` outside its own file: `grep -rn "STAGE_FACET\|map-bar" src tests` lists only `present.ts:31,125,130` outside `map-bar.ts`, and `Map.svelte:63-69` imports `MAP_LINE, PILLAR_FACET, SHOW_CONNECTED, mapBar, showGroup`. So `sh utils/unused-exports.sh` will show a new line for `STAGE_FACET`, and making it local means editing `map-bar.ts`.
3. `docs/templates.md:1914` is not in the write list, and the step makes it false: "The Present view's filter of a deck's project decks (Stage, Status, Tier, Pillar and Form) is the view's own: its picks are kept with the pane and write nothing to this file." The general clause of item 7 does reach it through the grep `Pillar and Form`, but the brief does not name it.
4. `src/lib/views/shared/forms/bar/SliceLine.svelte:2-4` is not in the write list. Its head comment names `views/boards/projects/Projects.svelte` as the component that draws it. After the step, the new shared component draws it for Projects.svelte and for the Present view, so the list of callers is false.
5. `src/lib/views/academic/present/acts/presentation.svelte.ts` is not in the write list. The step makes its behaviour wrong unless `PresentState` carries the bar fields. Line 68 is `show: (key) => setInstanceState(id, { ...parsePresentState(instanceState(id)), slide: key })`, and `setInstanceState` replaces the whole record (`src/lib/state/workbench/ui.svelte.ts:491-493`, `deps.state.changeViews({ [id]: state }, [])`). `Present.svelte:216-218` writes `{ ...held, ...changes }` with `held = parsePresentState(...)` in the same way. Item 3 says where the fields are saved but does not say that `PresentState`/`parsePresentState` hold them. If they do not, a slide move from the presenter screen, the Overview toggle or the facts toggle erases search, toggles, Mine only and picks.
6. The other names hit nothing outside the write list that the step makes false. `grep -rn --exclude=local.yml -E "FILTER_FACETS|FILTER_GROUPS|FILTER_LAYOUT|filtersOf|pickedIn|filterGroupsOf|keptKeys|deckTally|DeckFilters|ProjectLayout|FilterLine|projectFilter|projectKeeps|\bfiltering\(" src tests config docs README.md bin utils`, with the write-list files removed, lists only unrelated names: `filtersOf` in `providers.mjs:39,508`, `state/feeds/literature/merge.ts:282`, `Literature.svelte:63,130` and `tests/server/machine/apps/tools/workspace.test.ts:396,399`; `filtering` in `rooted-tree.svelte.ts:240` and `tab-actions.ts:70,116`; `pickedIn` in `DiffSection.svelte:340,359,388`. None is affected. The texts: `grep -rn --exclude=local.yml -E "present\.filter|filter_clear|filtered_one|present\.filtered|'filtered'" src tests config` hits outside the write list only `SliceLine.svelte:198` and `config/text/views/boards/projects.yml:43` (`board.filter_clear`, the board's own text, unaffected). The anchor `#the-filter` is linked only from `docs/decks.md:131` (`grep -rn "the-filter" docs README.md src config`), so renaming the heading means editing line 131, which is outside the write list's `docs/decks.md lines 375-380`. `ProjectLayout` stays used inside `collection/bar.ts` (`sectionLayout` `:111`, `collectionBar` `:491`, `:565`); only its export loses its outside importer.

## The step line

7. Each part of the O154 line (`plan.md:1694`) is served by the brief:
   - "the Present view draws exactly the project board's filter, the same bar with the same groups, toggles, slices line, counts, Clear all, rules and state shape": items 1, 2, 3.
   - "the search, the stale, deadline and waiting toggles, Mine only, Role, the line groups of LINE_FACETS and More, the slices": item 2.
   - "over the projects whose decks the deck's groups hold": item 4.
   - "O147's own filter groups (...) and everything in which the Present view's filter differs from the board's are removed": item 6.
   - "the places a pick narrows (the Overview, the screen, the presenter screen, the audience window, the PDF)": item 5.
   - "the picks kept with the pane and no file written stay": item 3 (last sentence) and C9.
   - "docs/decks.md 'The filter' and docs/HELP.md say so": item 7.
   - "built by a builder agent": the brief's frame (worktree, builder report).
   - No part of the line is left without a requirement.
8. "State shape" is narrowed by item 3 to six fields of `BoardState` (`search`, `stale`, `dated`, `waiting`, `mine`, `filters`). It leaves out `mode`, `more`, `labels`, `folded` and `columns` (`presets.ts:216-243`). My judgment is that those fields govern the cards, which the Present view does not draw, so the subset is defensible. But no listed decision says the shape is a subset, and decision 2 covers only where the fields are placed.

## Premises

9. Line ranges in `Projects.svelte` (487 lines, confirmed):
   - The chain is at `:189-224`, but `boardStats(items)` is at `:235`, outside `sed -n 186,229p` (`grep -n "boardStats" ...` prints `235:    const strip = $derived(boardStats(items));`).
   - `write` is at `:251-253`, not `:244-246` (`251:    function write(next: Partial<BoardState>): void {`, `252:        setInstanceState(instance.id, storedState({ ...held, ...next }, ['more']));`).
   - The snippets are `toggles` `:376-398` and `bar` `:400-430`; line 374 is the end of the `tools` snippet.
   - The filter part of the head comment is `:60-71`; line 73 starts "Every card is drawn closed".
   - `hubs` at `:173` holds.
10. Line ranges in `Bar.svelte` (158 lines, confirmed): the head comment is `:2-11` (brief `:2-10`); the "Filtered" line and Clear are `:112-119` (brief `:113-119`); `FilterBar` is `:123-130` (brief `:122-129`). The described content holds (no search, toggles, Mine only, badges or slices line).
11. `state.ts`: `emptyBoardState` is at `:147-159` (brief `:146-160`, which includes the doc line). `parseBoardState` `:185-215`, `offersMine` `:142-144` and `mine: true` hold. `BoardState` is at `presets.ts:216-243` (brief `:216-242`). `LINE_FACETS` at `filter-menu.ts:53` and `mapPreset` at `presets.ts:646` hold, with a rule of nulls and `...drawnBy({})` giving `search: ''`.
12. `present.ts` (812 lines): every line given holds (`grep -n` output: `119`, `125`, `128-134`, `137`, `91-104`, `114`, `153`, `159`, `167`, `174`, `183`, `200`, `210`, `221`, `244`, `478`, head comment `13-18`). `collection/bar.ts:373-397` and head comment `:31-34` hold. `grep -rn "projectFilter\|projectKeeps" src tests | cut -d: -f1 | sort -u` lists only `bar.ts` and `present.ts`.
13. Present wiring: `filter.svelte.ts` (172 lines) and `Present.svelte` (461 lines) hold at `:143-149`, `:167`, `:189`, `:227`, `:350` and head comment `:31-34`.
14. The texts (`present.yml:86-90`), the docs (`decks.md:375-380`, `:131`; `HELP.md:331`), `groups.ts:10-15` and `keptMembers` `:216-219`, the test `present.test.ts:236` and `Keep` at `present.svelte.ts:72` all hold.
15. Tests: `grep -rln "parsePresentState\|leftDeck\|keptKeys" tests` prints nothing (rc=1). G124 is at `guarded.md:186` and G92 at `:320`. The describes `board-rules.test.ts:175` and `:737` hold. `grep -rln "parseBoardState\|offersMine\|sliceGroups(" src/lib/views src/lib/state` lists Projects.svelte, Map.svelte, state.ts, facets.ts, presets.ts, index.ts, map-bar.ts, collection/bar.ts and present.ts; outside the board folder's own definitions, the callers are as stated. But see finding 2: map-bar.ts does change.
16. The brief has no premise for a fact that decides item 1: putting the new function in `state.ts` creates a runtime import cycle.
    - `facets.ts:49` is `import { applyFilters, facetValues } from './state.ts';`.
    - `filter-menu.ts:19` imports `./facets.ts`.
    - The function of item 1 needs `facets` and `sliceGroups` (`facets.ts:275`, `:217`) and `filterGroups` (`filter-menu.ts:152`).
    - So `state.ts` would import `facets.ts`, which imports `state.ts`. `tests/checks/imports/cycles.test.ts` 'holds no cycle' refuses that, and it runs in `test:quick`.
    - The folder `src/lib/state/boards/board/` already holds 10 tracked items (`git ls-files src/lib/state/boards/board | wc -l` prints `10`), so a new file there breaks the ten-item rule (`spec.md:49`).
    - The one cycle-free home among the existing files is `filter-menu.ts` (334 lines; it imports presets and facets, and `state.ts` imports neither). It is not in the write list. As written, item 1 is impossible.
17. `boardStats` is the client selector `boardStats` of `src/lib/state/client/selectors.svelte.ts:383` (from `useState()`), not a function of `state/boards/board/`. Item 2 hands the bar "the board stats of the same items", so the Present view must call that selector over the members. The brief does not name it.

## Cases and checks

18. Decision 6 and verify item 2 against `spec.md:60` ("A step whose change touches an entry's code runs that entry's test"). G92's Code line names `facetValues` and `applyFilters` in `state.ts`, which item 1 changes. G92's test file `tests/state/boards/board/hub-facets.test.ts` is missing from verify item 2. (`test:quick` may reach it through imports; the brief's own list does not name it.)
19. C7 does not match the code. `shownWords` (`filter-menu.ts:271-274`) reads "<n> of <m> shown" only while n < m. With every member shown it reads "<m> projects" or "1 project" (`config/text/views/boards/projects.yml:23-25`). The case names only the first form.
20. C10 asks the builder to read places the step does not change: `acts/presentation.svelte.ts` (the link's `keep`), `acts/export.ts` (`answerPrint`) and the print and audience routes. All are outside the write list. Because of finding 5, `presentation.svelte.ts` may in fact need a change.
21. C14 is checked "by the G124 tests". No G124 test renders `Projects.svelte` or calls the new function of item 1; they test the units it composes.
22. No case breaks a rule. C2 and C12 ask for case-run programs, which `spec.md:66` allows. C12 needs no code that carries the old form, so it agrees with `spec.md:43`.

## The question

23. C1, C3, C4, C5, C6, C8 and C11 cannot pass without the goal for the part each covers, since each is judged at the look against the board.
24. C2 can pass without the goal. "The function of item 1 given the same items gives the same answer" holds for any pure function. It does not show that the Present view calls it with the same preset rule, `selfNamed()`, `hubList(roots(), primary())`, `staleLag()` and the raw instance state that Projects.svelte uses. The check that would fail is a reading of the two call sites side by side.
25. C7 can pass or fail on a deck where every member is shown, because it names only one of the two forms of `shownWords` (finding 19).
26. C9 can pass without the goal. `leftDeck` and a page reload are checked, but a slide move from the presenter screen (`presentation.svelte.ts:68`) and the pane's own writes (`Present.svelte:216-218`, `screen/box.ts:29`) are not, and each erases the bar fields if `PresentState` does not hold them.
27. C10 can pass with `keep` and `keepFor` both `undefined` for good (equal lists, nothing printed or sent). It can also pass while `keepFor`, for a pane that is not drawn, has lost the members the pane's own `keep` read: `filter.svelte.ts:117-120` calls `asking(pane, null, undefined)` on teardown, and `present.svelte.ts:470-480` then forgets every narrowed answer, keeping only the whole deck's (`keepKey(null)`), which may never have been read.
28. C13 can pass trivially. Item 4 limits the members to `deck.hub`, so the Hub group drawn "by the board's rule" lists at most one value, and the case gives no expected value.
29. C14 can pass on the G124 tests with the board's bar changed (finding 21); only the look shows it.
30. C15 can pass without item 6 done. It does not search for `DeckFilters`, `filtering`, `pickedIn`, `filtersOf`, `FilterLine`, `STAGE_FACET` in `present.ts`, `Filtered` or `Pillar and Form`. It cannot find the keys in `present.yml:86-90`, which are written `filter:` and so on under the group and not as `present.filter`. And it leaves out the false sentences in FilterBar.svelte, map-bar.ts and templates.md (findings 1-3).
31. Item 1 cannot pass as written (finding 16). If the builder moves the function elsewhere, it passes only with the call-site reading of finding 24.
32. Item 2 can pass with the shared component in place while the Present view leaves out props (toggles, `onmine`, badges). Only the look or a reading of the Present call guards it.
33. Item 3 can pass while the fields are lost on every write that goes through `parsePresentState` (finding 5).
34. Item 4 can pass without saying what happens to a member that matches no board item of `mapPreset`, and to a deck in a group of project decks that is no project's deck. Under any narrowed list the server drops both (`groups.ts:216-219`), and under `null` it keeps both, so the shown count and the deck drawn disagree (finding 37).
35. Item 5 can pass with `keepFor` answering a different list than the pane's `keep` while the pane is not drawn (finding 27). It also does not name `keepFor`'s value while the members are unknown.
36. Item 6 and item 7 can pass with the sentences of findings 1-4 left as they are, since none of the item 7 greps finds FilterBar.svelte:9, map-bar.ts:16/40 or SliceLine.svelte:2-4. The step line itself names no check beyond "say so", and its goal is not reached while those comments say the Present view draws group buttons alone.

## Implied inputs

37. A group of project decks holding a member that matches no board item of `mapPreset` for `deck.hub` (a project whose manifest the snapshot lacks, or a deck in `slides:` that is no project's deck). Expected result, to be stated: it is not counted in `m`. Under any narrowing it is dropped by the server rule. With the bar showing every item (`null`) it is drawn. The count and the deck disagree in that state, and the brief should say which wins.
38. Mine only on (the default) with no member the user's and none naming no one, or a pick no member carries. The kept list is `[]`. Expected: every group of project decks is empty, the shown count reads "0 of m shown", the pane goes to the first slide if the filter took it out, and nothing throws. `keepKey([])` is `"[]"`, which differs from the whole deck's `''` (`present.svelte.ts:251-253`).
39. A slide move from the presenter screen, the Overview toggle and the Project facts toggle on a pane whose bar holds a search and picks. Expected: the bar fields survive each write (finding 5).
40. A pane presenting while its tab is not drawn, with the audience window asking for the kept list (`present.svelte.ts:630-632`, `:648`). Expected: `keepFor` gives the list the pane's `keep` gave, from an answer the store still holds. The brief does not say where the members come from once `asking` has dropped the narrowed answer.
41. The print page and the audience window asking `keepFor` for a pane on a deck whose answer is not loaded. Expected: `undefined`, never `null`. Export then waits and ends with `present.print_unanswered` after 5 s (`present.yml:128`, `HELP.md:331`). The audience window gets no `keep` message (`present.svelte.ts:632` posts only when the list is not undefined) and its frame falls back through `?? null` at `:662`.
42. A pane opened on a deck while `portfolio()` is null (the snapshot not yet read), with the default Mine only. Expected: the pane shows its loading state and asks under no list (`Keep` undefined), as `filter.svelte.ts:87` does for picks. Since Mine only is on by default, every saved state can narrow, so this happens on every open. The brief should say that this wait is accepted.
43. Typing in the search box: each keystroke that changes the shown set is a new kept list and a new server read. Expected: the pane goes on drawing the last answer, a superseded read is never drawn over a later one, and `asking` drops the answers no pane reads under (`spec.md:73`, superseded asynchronous paths).
44. The letters `O`, `F`, `P`, Space and the arrows typed in the search box. Expected: they go into the field and do not move the deck or open the Overview. The bar sits in the `Pane` `bar` snippet, outside the key box (`Present.svelte:353-363`), and the brief does not state this.
45. A member deck added or removed by a push of `present.yml` while a narrowed list is held. Expected: the members are read again from the new answer, the kept list is computed again, the shown count follows, and the slide-on-screen rule of item 5 applies.
46. Two Present panes on the same deck with different controls. Expected: each pane has its own kept list and answer, and the print page asks the exporting pane only.
47. A pane whose saved state predates the step and holds no `mine` key. Expected: Mine only reads as on (`state.ts:171`, `.catch(true)`), so a deck O147 drew whole now opens narrowed. Decision 3 accepts this; C12 does not include a state without `mine`.
48. The Awaiting box's tab (`AWAITING_VIEW`, `awaitingPreset`) through the new function. Expected: the same bar, counts and cards as on the base, its Mine only starting as the Filter's. C14 names the tab, but only for the look.

## ADRs

49. `test -d docs/adr || echo "no docs/adr"` prints `no docs/adr`. `grep -n "adr" .agents/plan.yaml` prints nothing. No ADR applies.

## Dictated text

50. None. `grep -n '"' .scratch/migration/agents/briefs/O154.md` shows quoted strings only for existing texts ("<n> of <m> shown" in C7, which is `board.count_shown`), the report's lines and the ruling's name. Item 7 states what the docs must say, not their words.

## Declined to judge

51. Whether the six-field subset of `BoardState` meets "state shape" in Axel's sense (finding 8). That reading is the orchestrator's or Axel's.
52. Whether the summary and grid slides, legends and `{{<group>.count}}` narrow the same way under the new kept list. The server path (`groups.ts`, `read.ts:396`) is unchanged and I did not trace it further.
53. Whether `idOf`, `category: null` and `named` in `ProjectLayout` are used only by the Present layout, which would make them removable under item 6. I did not read `sectionLayout` (`collection/bar.ts:111`) in full.
54. The base copy `.agents/worktrees/O154-base` and the worktree `.agents/worktrees/migration-O154` do not exist yet (`ls .agents/worktrees/`). I did not check verify item 6's base file for that reason.

Usage: ab1987cb1fbaa184b, claude-opus-5-5, 220,919 tokens, 68 tool uses, 12.6 min.

## Closed

Each finding is closed by a change to `agents/briefs/O154.md`:

- 1, 2, 3, 4, 36: item 7 names the head comments of `FilterBar.svelte`, `SliceLine.svelte` and `map-bar.ts` (`:16`, `:40`), and `docs/templates.md:1914`; item 6 makes `STAGE_FACET` local to `map-bar.ts` when no other file imports it; the four files are in the write list; the premise on `map-bar.ts` is corrected.
- 5, 26, 33, 39: item 3 says `PresentState` and `parsePresentState` hold the bar fields, so every write through them keeps them; `acts/presentation.svelte.ts` and `screen/box.ts` are in the write list where they need a change; case C16 added.
- 6: the heading "The filter" is kept, so `decks.md:131` needs no change (item 7).
- 8, 51: decision 2 says the saved shape is the board's bar fields, the card fields (`mode`, `more`, `labels`, `folded`, `columns`) left out since the Present view draws no cards.
- 9, 10, 11: the line ranges corrected.
- 16, 31: item 1 places the function in `filter-menu.ts`, the one cycle-free file of the folder, which is in the write list; the folder gets no new file; the premise is added.
- 17: item 2 names the `boardStats` selector of `state/client/selectors.svelte.ts`.
- 18: verify item 2 adds `tests/state/boards/board/hub-facets.test.ts`.
- 19, 25: C7 gives both forms of `shownWords`.
- 20: C10 is a behaviour case; the files it reaches are read, and changed and added to the report where the behaviour needs it.
- 21, 24, 29, 32: C2 and C14 add the side-by-side reading of the two call sites (every argument and prop the same); case added.
- 27, 35, 40, 41: item 5 says `keepFor` gives the pane's own list whether the pane is drawn or not, from members the Present store keeps for a pane while it presents or exports, and `undefined` (asks nothing, never `null`) while they are unknown; cases C17, C18.
- 28: C13 states the expected Hub group.
- 30: C15's grep widened, the `present.yml` keys read by name.
- 34, 37: item 4 states the rule: the bar runs over and counts the members matched to a board item, as a board counts projects; the kept list is `null` while the bar keeps every matched member, so a deck that is no project's is drawn whenever nothing narrows, and dropped by the server's rule under any narrowing, as on the base; case C19.
- 38: case C20.
- 42: item 5 accepts the loading state while the snapshot or the members are not read.
- 43: case C21.
- 44: case C22.
- 45, 46, 47, 48: cases C23 to C26.
- 52, 53, 54: no change: the server path is unchanged and its test is run (verify item 2); item 6 already keeps `ProjectLayout` where the collection's bar uses it; the base copy is made at Steps 7.
