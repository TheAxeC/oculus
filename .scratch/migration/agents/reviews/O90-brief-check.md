# Brief check of O90 (the board bar's Waiting on filter)

I read the brief, plan.md (the O90 line at :849 and rulings 463, 464 and 476 at :2866, :2867 and :2879), spec.md in full, guarded.md entries G92 (:296-298) and G124 (:183-185), and the tree at 38481ec63 (`git log --oneline -3` prints `38481ec63 Land O91: joint work onto the people file` first). plan.md has no Goal section: `grep -n -i "goal" .scratch/migration/plan.md` finds no heading, only words inside other steps. I judged the goal as the prompt states it. Nothing was changed.

## Names

Command: `git grep -n "FACETS\|LINE_FACETS\|facetValues\|applyFilters\|BoardState\b\|BoardStats\|QuickFilters\|emptyBoardState\|parseBoardState\|deadlineWords" -- src tests docs utils config ':!config/local.yml'`, plus separate greps for `BoardItem`, `waitedOn\|waitingLabel\|WaitedOn`, `facet_tones`, `quick_deadline\|quick_stale\|board\.facet_`, and the sentences that list the toggles. Hits outside "Paths this step writes":

1. `src/lib/views/shared/card/project/CardLinks.svelte:13`, head comment: "a value that names neither is its key with no press". Item 2 makes this false, because such a value will be named as written. CardLinks.svelte is not on the write list. This is a defect of the change unless the path is added and the sentence rewritten.
2. `src/lib/views/shared/card/project/ProjectCard.svelte:126` computes `waitedOn(item.project.waitingOn, personNames(snapshot), snapshot.entities.projects)` itself. After item 1 the same join is also on `item.waiting`, so it is computed twice. Nothing breaks, but it goes against spec.md's "a parser, a fold or a rule exists once and is reused". The card should read `item.waiting`, which means adding ProjectCard.svelte to the paths.
3. `src/lib/views/boards/projects/Projects.svelte:62-63`, head comment: "line 1 draws the Hub group after Venue". This stays true only loosely, since Waiting on will sit between the two. It is outside the written range 160-192. A rewrite ("after Venue and Waiting on") is recommended.
4. `src/lib/views/boards/focus/lanes/Lanes.svelte:31,132` and `src/lib/state/boards/focus.ts:53,609` (the strip) read `waitedOn` and `waitingLabel`. Item 2 changes their words for a value that names neither a person nor a project (`"IRB: approval"` instead of `" approval"`). This is intended, not a break. `docs/HELP.md:296` already says such a value "is shown as written", so it stays true.
5. Another function also called `waitedOn`, a boolean predicate (`src/lib/state/client/selectors.svelte.ts:243,533,848`, `src/lib/state/client/context.ts:493`, `src/lib/state/forms/schema.ts:421-598`, `src/lib/views/boards/editor/Editor.svelte:84,102`). The step does not affect it. No path of the step imports both.
6. `src/lib/state/client/selectors.svelte.ts:85,202,383-384` (`BoardStats`, `stats`). These read the return type only, so nothing breaks.
7. `tests/state/boards/board/board-rules.test.ts:53,58,210,211,229,600,602` (`applyFilters`, `parseBoardState`). Nothing breaks: `quick` is optional, no fixture there carries `waiting-on`, and no test compares a whole `BoardState`.
8. `BoardItem` readers in views (BoardList, CardDocs, card.ts, CardAddresses, CardDetails, CardFacts, CardSessions, ProjectTree) and in `rail-badges.svelte.ts:28,129`. They only read, so nothing breaks. `git grep -n "haystack:" -- src tests` shows the only literals that build a `BoardItem` are `items.ts:170` (on the write list) and the cast fixture in `hub-facets.test.ts:38` (on the write list).
9. `facet_tones` at `hub-names.ts:730`, `catalog-files/vocab.ts:450`, `hub-keys.ts:31`, `merge/in-place.ts:92`, `tests/checks/config/config-folder.test.ts:235`, `docs/templates.md:251-253`, `docs/HELP.md:541`, `docs/data-map.md:112` and `config/options/catalogs/vocab.yml:277`. All are generic over keys, so nothing breaks.
10. `board.facet_funding|pillar|dataset` at `CardLinks.svelte:101,107,113`. Not affected.
11. `src/lib/state/boards/board/index.ts:9` (`FACETS`) is outside the range 50-80 but needs no change.
12. utils, README.md and docs/diagrams: no hits (`git grep ... -- utils README.md` printed nothing; `git grep -l "waiting\|FACETS\|filter-menu" -- docs/diagrams` printed nothing).
13. Comments inside the written files that list facets or quick filters, which item 6's explicit list does not name: the `facets.ts` head comment :6-9 (record values are "that record's key", which is not true of a value that names neither), the `facetLabel` doc :87-91, the inline comment in `orderValues` :146-148 ("a venue by its short name"), the `facetValues` doc in `state.ts` :30-34, and the field docs of `BoardState` and `BoardStats` (`presets.ts:205-207,225-236`). Item 6's general sentence covers some of these. Naming them would prevent a miss.

## The step line

Each part of the line at plan.md:849, and what in the brief serves it:
1. "gains a toggle 'waiting <n>' beside the deadline toggle": item 4 (the Chip after deadline, `waitingWords`), item 5 (`board.quick_waiting`), cases 1 and 17.
2. "with the count of the board's projects whose `waiting-on:` is not empty": item 4 (`BoardStats.waiting` in `stats()`), item 1, cases 1, 7 and 8. Case 8 reads "not empty" after trimming, which is a reasonable reading, and the case states it.
3. "keeping those projects while it is on": item 4 (`BoardState.waiting`, `QuickFilters.waiting`, `applyFilters`, `quick` in Projects.svelte), cases 2, 13 and 14.
4. "a group button 'Waiting on'": item 3 (FACETS, LINE_FACETS, `facetHeading`), item 5 (`board.facet_waiting`, the tone), cases 15 and 18.
5. "listing each person and project the board's projects wait on, each once": items 1, 2 and 3 (one value per key across hubs), cases 3, 7, 9 and 16.
6. "by name": item 3 (RECORDS and NAMED_RECORDS labels), item 2, cases 3, 6 and 16.
7. "keeping the projects that wait on any value picked": item 3 (`facetValues`, plus the facet loop already in `applyFilters`), cases 4 and 9.

No part of the line lacks a requirement. Item 2's change to `waitingLabel` (on the card, the strip and the lane card) goes beyond the line. Decision 6 states it, and HELP.md:296 already describes the behaviour it brings.

## Premises

I reran every command in "What is on the tree".

1. Premise 1: `grep -rn "waiting" src/lib/state/boards/board/` does not print nothing. It prints `src/lib/state/boards/board/new-project.ts:137:        waitingOn: [],`. The point the premise makes, that no facet reads `waiting-on:`, still holds.
2. Premise 3: `BoardItem` spans `presets.ts:117-185` (its doc at 117, the closing `};` at 185), not 117-181. `BoardState` spans 196-222, not 193-222; line 193 is the doc of `Facet`. The write range 117-280 still covers both.
3. Premise 8: "(a second hub's resolved value carries its prefix, `look-hub2:amir`)" implies the primary hub's values carry none. In fact every hub's records, the primary's included, have the id `<hub>:<key>`: `merge.ts:3-4` ("every record of every hub, the primary's included, has the internal id `<hub>:<key>`"), `hub-names.ts:11-13`, and `tests/data/sources/manifests/manifests.test.ts:443` (`waitingOn: ['hub:alpha']`). This matters for case 7 (see Cases and checks, finding 1).
4. Premise 13: `CardLinks.svelte:10-11` is the head comment. The code that sets the waiting tags red is at `:91` (`tone: 'red'`). The red colour is confirmed.
5. Premise 15: the synthetic `item()` is at `hub-facets.test.ts:20-40` (its doc at 17-19), not 19-38.
6. Premise 9: I did not run the scratchpad program, which is not available to me. Reading `hub-names.ts:70-78` (`addressOfId` cuts at the first colon) gives the same results the brief quotes.
7. Premises 2, 4, 5, 6, 7, 10, 11, 12 and 14 hold. Their line numbers match `cat -n` and `sed -n` of each file, for example `state.ts:35-71,80-100,133-145,148-159,181-183`, `facets.ts:49-71,74,123-160,153-154,250-305`, `filter-menu.ts:49,55-70,81-85,144-171,226-228`, `stats.ts:45`, `selectors.svelte.ts:383-385`, `items.ts:174-176`, `Projects.svelte:173-178,376-380` and `HELP.md:306-308`.

## Cases and checks

1. Case 7 gives a different result on a built snapshot. The merge resolves the value untrimmed: `merge.ts:155` is `resolve(['people','projects'], key, waiting) ?? key`, and `strings()` at `guards.ts:70-73` does not trim. So `[amir, ' amir ', '']` becomes `['<hub>:amir', ' amir ', '']`. `waitedOn` trims afterwards (`waiting.ts:45`), which gives two entries: `{id '<hub>:amir', person}` and `{id 'amir', none, label 'amir'}`. Under item 2 both have the facet value `amir`, so `facetValues` returns `['amir','amir']` and `countValues` (`facets.ts:107-115`) counts that one project twice. The expected "one row amir, count 1" holds only for synthetic items. Two changes are needed. The brief should say case 7 runs through a built snapshot. And either `facetValues` keeps each facet value once, or the merge trims before it resolves (`merge.ts:155`, a path to add). The merge fix also stops the card drawing two tags ("Maryam Amir Haeri" and "amir") for that project.
2. Case 5 cannot tell ordering by words from ordering by value. The keys `ann` and `zed` sort the same way as "Ann" and "Zed". It needs keys whose order differs from their names, for example key `a-zed` named "Zed" and key `b-ann` named "Ann", expecting Ann, then Zed.
3. Case 18 cannot be seen on localhost:8790. The workspace there holds one hub: of the folders in `research-hub/.oculus/workspaces/research-hub.yml`, only `~/workspace/research-hub` has `.oculus/config.yml` (a loop over those folders printed `hub: /Users/axelfaes/workspace/research-hub` and nothing else). So no Hub group is drawn, and Waiting on folds first, then Venue. The case should say that on 8790, or name a scratch workspace with two hubs for "Hub then Waiting on".
4. Item 7's claim "Each changed line run on the unchanged tree first (it fails there)" is false for the filter line. `applyFilters` loops over `FACETS` (`state.ts:92`), so on the unchanged tree `waiting: ['amir']` is ignored. Both items are kept and the test passes. spec.md asks for "its failing line on the unchanged tree", which the builder cannot then give. See The question, finding 1, for the fix.
5. Case 17 holds against the hub. `grep -rln "^waiting-on:" --include=project.yml .` in research-hub finds only `bt-operator-theory`, with `waiting-on: [amir-haeri, btfno]`. `btfno` has `short: BT-FNO`, and `amir-haeri` is named "Maryam Amir Haeri" in `.oculus/data/people/people.yml:21-22`. The toggle reads `waiting 1`. Both rows are at 1 and sort by their words, so BT-FNO comes first. The case does not state the order; I recommend adding it.
6. Cases 1, 2, 3, 4, 6, 8, 10, 11, 12, 13, 14, 15 and 16 give their expected results under the code as specified:
   - Case 11: `orderValues` reads the whole board's counts, so `btfno` keeps its place at 0.
   - Case 12: a picked value no project holds gets `facetLabel` with no record, which is the value itself.
   - Case 15: `namedTone('red')` gives `red`, since `c-red` is at `config/catalogs/vocab.yml:11`.
   - Case 10: `facets()` skips a facet with no values (`:302`).
7. No case contradicts the rules file. Only case 6 checks a place the step does not change (the card, the strip and the lane card), and only through `waitingLabel`, which the step does change. G124's code lists `presets.ts` and `items.ts`, so spec.md requires its test (`board-rules.test.ts`, `board-views.test.ts`) to run. The brief does not name it; `test:quick` reaches it through the imports.

## The question

For each check: could it pass without the goal being reached?

1. Item 7, the filter line: yes. Both items wait on `amir`, so a waiting filter that is ignored keeps the same two. Fix: add an item that waits on no one (or on someone else), which only the waiting filter removes, and expect the two hubs' projects alone.
2. Item 7, the rows line: no. It needs the facet, its key merging across hubs and its label.
3. Case 5: yes, as Cases and checks finding 2 explains.
4. Case 7 on synthetic items: yes. It passes while a real snapshot counts the project twice (Cases and checks, finding 1).
5. Cases 1-4, 6, 8-16: no. Each reads the function the goal rests on, with inputs that separate the outcomes.
6. Cases 17-19: no, for the bar as drawn. Case 18 cannot be run as written (Cases and checks, finding 3).
7. Items 1-5: no. Each is a part the goal needs, and cases 1-16 exercise them.
8. Item 6 (the comments and the help): it does not bear on the goal. It cannot make the goal pass on its own.
9. The verify list (`test:quick` and the rest): yes. It never draws the bar; only the look cases 17-19 prove the toggle and the button.
10. The step line has no check of its own beyond the cases.

## Implied inputs

1. A whitespace variant of a person or project key (`' amir '`) on a real snapshot. Not in the cases as built. Expected: one row and one tag, by name, the project counted once. This is a real cost: a doubled count, and a row labelled `amir` when the untrimmed value comes first. Cases and checks finding 1 gives the fix.
2. A value that names a project held only by another hub. Expected: one row by its key, labelled by that project's short name. Partly covered by case 16.
3. A key that two other hubs hold while its own hub holds none. The merge resolves it to none and keeps it as written, so it shares a row with the resolved key. Not in the cases. Low cost; the merge already reports it as a finding.
4. A project whose title and short are both empty. `waitingLabel` names it by its key (`waiting.ts:26`), so the row reads the key. Not in the cases. Low cost.
5. The track-record board. It is the same `Projects.svelte` with the same `FilterBar` (`Projects.svelte:46-48,147-151,376`), so it gets the toggle and the group. No case covers it. Recommended: one look line saying that tab draws both.
6. Saved states from before the change. A state with no `waiting` field gives `false`, as case 13's `{}` shows. A picked person who is no longer waited on is listed at 0 under the key (`amir-haeri`), not the name. This matches how venue and pillar behave, but no case states it.
7. A person and a project with the same key. Decision 1 makes them one row. No case states the label (the first item's words) or the count (the projects waiting on either).
8. A workspace with one hub. Waiting on is then the last button on line 1 and folds first. Missing from the cases; this is case 18's problem.
9. The diagrams. `npm run diagrams` runs before the list, and `docs/diagrams` is not on the write list. The new import in items.ts (`../waiting.ts`) stays inside `state/boards`, so I expect no change, but this is not verified.

## ADRs

`ls -d docs/adr` prints `ls: docs/adr: No such file or directory`. The configuration block in `.scratch/migration/orchestrator-state.md` (lines 5-23, read with `sed -n 1,31p`) has no `adr` key; the only line `grep -n "adr"` finds there is the one about the configuration block's verify list. This matches what the brief says.

## Dictated text

1. `grep -n "board.facet_waiting: Waiting on"` finds line 48. Holds.
2. `grep -n "board.quick_waiting: waiting {0}"` finds line 48. Holds. It is a plain YAML scalar like `quick_deadline: deadline {0}` at `projects.yml:62`.
3. `grep -n "only the projects waiting on someone or another project"` finds lines 48 and 100. ASCII and plain, but inaccurate. The toggle also keeps a project whose value names neither a person nor a project (case 6, `IRB: approval`), and the goal says "someone or something". The tip names less than the toggle keeps; "only the projects waiting on someone or something" would match.
4. `grep -n "waiting: red"` finds lines 48 and 98. Holds. In key order it goes between `venue` and `year` (`vocab.yml:236-237`).
5. `grep -n "expect(rows('waiting'))"` finds line 50. Holds, and it fails on the unchanged tree because `rows('waiting')` is undefined there.
6. `grep -n "waiting: \['amir'\]"` finds line 50. The text holds. The claim attached to it, that it fails on the unchanged tree, is false (Cases and checks, finding 4).
7. `grep -n "label={waitingWords(stats)}"` finds line 47, the Chip's attributes and `z.boolean().catch(false)`. Holds, written one attribute per line as the deadline Chip is.
8. `grep -n '"waiting 1"'` finds line 49, the HELP example. Holds.
9. `LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O90.md` prints nothing (exit 1), so the brief is ASCII throughout.

## Declined to judge

1. Premise 9's `npx tsx` program: it is in the session's scratchpad, which I cannot reach. I judged it by reading `hub-names.ts:70-78`.
2. Decision 1's claim that no key is both a person and a project in the research hub: not rechecked.
3. Whether validate reports a `waiting-on` value with spaces around it: not verified.
4. Whether `npm run diagrams` changes a file in `docs/diagrams`: not run, since this check runs nothing that writes.
5. Looks 17-19: not run; no page is opened in a brief check.

Usage: ac1a6cbad4e5cb3e9, claude-opus-5-5, 217625 tokens, 67 tool uses, 8 min 49 s

## Closed

- Names 1: `CardLinks.svelte` lines 1-20 added to the paths; item 2 has its head comment say a value that names neither is drawn as written with no press.
- Names 2: `ProjectCard.svelte` lines 45-130 added to the paths; item 1 has the card read `item.waiting` in place of its own `waitedOn` call.
- Names 3 and 13: item 6 names `Projects.svelte`'s head comment (`:62-63`), `facets.ts`'s head comment, `facetLabel` doc and `orderValues` comment, `state.ts`'s `facetValues` doc and the `BoardState` and `BoardStats` field docs; `Projects.svelte` lines 1-80 added to the paths.
- Names 4-12: no change; the brief check finds nothing they make false.
- Premises 1, 2, 4 and 5: the commands' outputs and line ranges corrected in "What is on the tree" 1, 3, 13 and 15.
- Premises 3 and Cases and checks 1 and Implied inputs 1: "What is on the tree" 8 says every hub's records carry `<hub>:<key>` and that the merge resolves the value untrimmed; item 2 has `merge.ts:155` trim each value before it resolves it (`merge.ts` lines 150-157 added to the paths); case 7 runs through a built snapshot and states the unchanged tree's two entries.
- Cases and checks 2 and The question 3: case 5 uses the keys `a-zed` (Zed) and `b-ann` (Ann).
- Cases and checks 3 and Implied inputs 8: case 18 is a workspace of one hub on 8790, Waiting on folding first, then Venue.
- Cases and checks 4 and The question 1: item 7's filter line runs over a third item waiting on `zed` alone, which only the waiting filter removes, so the line fails on the unchanged tree.
- Cases and checks 5 and Implied inputs 5: case 17 states the order (BT-FNO, then Maryam Amir Haeri) and that the track record's board draws the toggle and the group.
- Cases and checks 7: "Verify before you report" 3 runs G124's and G92's tests alone by name after the change.
- Implied inputs 6: case 12 states that a saved pick no project waits on any more is listed at 0 under its key.
- Implied inputs 2, 3, 4 and 7: no case added; a value of another hub's project is case 16, and the other three are findings or labels the existing rules already give, with no cost beyond a key shown as its words.
- Implied inputs 9: `docs/diagrams/` added to the paths for what `npm run diagrams` regenerates.
- Dictated text 3: the tip reads "only the projects waiting on someone or something" in item 5 and decision 5. Held: plain ASCII, one line, the words of the goal.
- Dictated text 4: no change; item 5 already says key order.
