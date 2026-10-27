# O90 refuter report

Review of O90 (the board bar's Waiting on filter), worktree /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O90 at base 9f55cd701. I changed nothing in the worktree, the base copy or the ledger. My own logs are in the scratchpad /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/ (rev-verify.log, rev-cases-after.txt, rev-cases-base.txt, rev-unused.txt).

Summary: every verify check is green, and both runs of the case-run program reproduce the report byte for byte. Items 1-7 hold. Cases 1-16 are met; cases 17-19 need the look on landing. Nine findings, all small. None is a red check or an unbuilt item, so each can be fixed at landing: three doc and comment fixes (S1-S3), an unclear HELP sentence (S4), one sentence to add to the report (Sp1), and three changes to state in the landing report (B1-B3). S5 needs no code change.

## Verification

1. `npm run diagrams && npm run docs:palette && npm run test:quick -- --base 9f55cd701`, run from the worktree root. It ended with exit 0. Lines from rev-verify.log:
```
test:quick: 22 changed file(s), from git since 9f55cd701
test:quick: 25 test file(s)
ok      prettier (0.5 s): All matched files use Prettier code style!
ok      ASCII gate (0.6 s)
ok      svelte-kit sync (2.3 s)
ok      svelte-check (7.1 s): 1793092326401 COMPLETED 552 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (21.3 s)
ok      vitest (36.0 s): Duration  29.09s (transform 50.18s, setup 0ms, import 67.31s, tests 26.24s, environment 7ms)
ok      vitest checks (47.2 s): Duration  40.20s (transform 33.62s, setup 0ms, import 96.63s, tests 43.32s, environment 2ms)
test:quick: 49.7 s; every command passed
```
   - The run sees 22 changed files where the report says 21. The extra one is the untracked report file `.scratch/migration/agents/reviews/O90-report.md`.
   - Regenerating the diagrams and the palette left the docs diff unchanged: `git diff 9f55cd701 --stat -- docs` is the same before and after, and `git status --short` lists the same 21 modified files plus the report.

2. `wc -l` of the changed files. The largest source file is `presets.ts` at 625 lines and the largest component is `Projects.svelte` at 455. Every file is under the limits.
```
306 config/catalogs/vocab.yml | 106 config/text/views/boards/projects.yml | 394 merge.ts | 341 facets.ts | 329 filter-menu.ts | 82 index.ts | 244 items.ts | 625 presets.ts | 214 state.ts | 115 stats.ts | 67 waiting.ts | 211 FilterBar.svelte | 455 Projects.svelte | 252 CardLinks.svelte | 429 ProjectCard.svelte | 91 hub-facets.test.ts
```

3. The G92 and G124 tests alone:
   - `npx vitest run tests/state/boards/board/hub-facets.test.ts tests/state/boards/board/board-rules.test.ts tests/state/boards/board/board-views.test.ts --reporter=dot` printed `Test Files  3 passed (3)` and `Tests  116 passed (116)`.
   - The builder's four-file form, with `items.test.ts` added, printed `Test Files  4 passed (4)` and `Tests  118 passed (118)`. This matches the report.
   - `hub-facets.test.ts` with the verbose reporter: its three tests pass and it prints `Tests  3 passed (3)`.

4. `sh utils/unused-exports.sh > rev-unused.txt; diff .agents/worktrees/O90-base/unused-exports.txt rev-unused.txt` printed nothing (`diff exit 0`). The step adds no unused export.

5. `grep -rn 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO9[0-9]\b' src config docs tests --exclude=local.yml` printed nothing (exit 1).

6. ASCII checks:
   - The perl gate of spec.md over every file in `git diff 9f55cd701 --name-only`, the `.svg` files included, printed nothing (exit 0).
   - `LC_ALL=C grep -n '[^ -~]'` over the report printed nothing (exit 1).
   - `sh utils/folder-check.sh` printed nothing (exit 0).

7. I re-ran the commands the report quotes as evidence:
   - The scratchpad's `o90-cases.mts` is identical to the source quoted in the report (`diff` of the extracted block printed nothing).
   - `npx tsx o90-cases.mts <worktree> <scratch>` reproduces the report's "Last run" lines 459-475 exactly.
   - The same program on `.agents/worktrees/O90-base` reproduces the report's first-run lines 20-36 exactly.
   - The builder's literal first run (`o90-first-run.txt`) differs from that only in case 15, which lacks `{"venueTone":"amber"}`. This matches the report's account.
   - The program leaves no `o90-hub-*` folder behind.
   - `grep -n "personNames\|waitedOn" ProjectCard.svelte` printed nothing.
   - `grep -rn "facet_waiting\|quick_waiting" config src` printed 3 definitions (projects.yml:38, :67, :68) and 3 readers (filter-menu.ts:63, :237; FilterBar.svelte:144).
   - The history-word grep over the added lines has two hits. Both use "before" to mean "before any filter", not an earlier state of the code: HELP.md:308 and the stats.ts doc.
   - `git diff --numstat` matches the report's +/- column for every file.
   - The builder's `o90-verify.log` and `o90-unused.txt` match what the report quotes.

8. Tests outside the quick list that read `waitingOn`. I ran them because `merge.ts` changes the field for every project: `npx vitest run tests/state/forms/form-draft.test.ts tests/state/forms/referrers.test.ts tests/data/snapshot/rename.test.ts tests/data/snapshot/references.test.ts tests/data/snapshot/normalise.test.ts tests/data/snapshot/relation-shapes.test.ts tests/routes/hubs/hub-writes.test.ts tests/data/sources/manifests/manifests.test.ts --reporter=dot` printed `Test Files  8 passed (8)` and `Tests  203 passed (203)`.

## Verdicts: items

1. **Holds.**
   - `BoardItem.waiting: WaitedOn[]` (presets.ts:182-187) has a doc naming the card line, the toggle and the group.
   - It is built in `itemOf` (items.ts:169) as `waitedOn(project.waitingOn, people.names, entities.projects)`.
   - ProjectCard reads it (`waiting={item.waiting}`, ProjectCard.svelte:374), and its `personNames` and `waitedOn` imports are gone.
   - ProjectCard has two importers, `Projects.svelte:97` and `Project.svelte:64`. Their items come from `boardItems` (selectors.svelte.ts:366) and from `boardItemFor` via `boardItemOf` (selectors.svelte.ts:520). Both go through `itemOf` (items.ts lines 200 and 224), over the same `entities.portfolio()` snapshot the card read before.
   - `CardLinks` has no other importer, and `src` holds no `as BoardItem` cast. So no card is drawn from an item without `waiting`.
2. **Holds.**
   - `waitingValue` (waiting.ts:64-66) gives `keyOf(id)` for a person or a project, and the trimmed id for a value that names neither.
   - `waitingLabel` returns `id` for a value that names neither (waiting.ts:25).
   - `merge.ts` trims before it resolves, and the CardLinks head comment (:13) is rewritten.
   - The merge also drops empty values and keeps each value once. That goes beyond the text "trims"; see Sp1. I checked every reader of `Project.waitingOn` and none behaves wrongly.
3. **Holds.**
   - `waiting` sits after `venue` in `FACETS` (presets.ts:286) and in `LINE_FACETS` (filter-menu.ts:50).
   - `facetValues` handles it (state.ts:54-55), and `RECORDS.waiting` and `NAMED_RECORDS` include it (facets.ts:72-84).
   - The `words` helper reads the label for `waiting` (facets.ts:165), and `facetHeading` uses the literal key (filter-menu.ts:63).
   - Program cases 3, 5 and 15 confirm this.
4. **Holds.**
   - The state field and its shape are in place (state.ts:152, 165, 195), as are `QuickFilters.waiting`, the filter in `applyFilters` (state.ts:100), `BoardStats.waiting` and the count in `stats()` (stats.ts:48).
   - `waitingWords` is exported through index.ts:66. The Chip in FilterBar.svelte:142-148 sits after the deadline Chip, and Projects.svelte:177 passes `waiting` in `quick`.
   - Cases 1, 2, 11b, 13 and 14 confirm this.
5. **Holds.** The three keys are in key order in projects.yml (:38, :67, :68), and `facet_tones` has `waiting: red` in key order (vocab.yml:237). Case 15 gives tone `"red"`.
6. **Holds.** Every comment item 6 names is rewritten, and HELP.md:306 and :308 are rewritten. Comment-quality findings are S2-S4.
7. **Holds.**
   - The fixture's `item()` carries `waiting: [{ id: key('amir'), label: 'Amir', kind: 'person' }]`.
   - The first test gains the `rows('waiting')` line. The second runs over a third primary-hub item that waits on `zed` alone, with `waiting: ['amir']` in the filters.
   - The head comment names the waited-on person.
   - The first run on unchanged code is quoted, with its two failures at :53 and :63.

## Verdicts: cases

1. **Met.** Case 1 prints `{"waiting":2} "waiting 2"`; at the base, `stats` has no `waiting` key.
2. **Met.** `["p1","p2"] ["p1","p2","p3"] ["p1","p2","p3"]`.
3. **Met.** amir (Amir Haeri, 2), then btfno (BT-FNO, 1).
4. **Met.** `["p2"] ["p1","p2"]`.
5. **Met.** Ann (b-ann), then Zed (a-zed).
6. **Met.** One row, value and label both `IRB: approval`. At the base, `waitingLabel` gives `" approval"`.
7. **Met.** Through a built snapshot, `waitingOn` is `["hub:amir"]`, `item.waiting` holds one entry, there is one row `amir` labelled "Amir Haeri" at 1, and `statsWaiting` is 1. At the base, `waitedOn` gives two entries.
8. **Met.** `{"itemWaiting":[]} {"statsWaiting":0} []`.
9. **Met.** G92 test: 3 passed. The first run on unchanged code is quoted in the report, and reading the base `FACETS` (no `waiting`) supports it.
10. **Met.** No `waiting` group, and the words read `"waiting 0"`.
11. **Met.**
    - 11a: amir at 1 and btfno at 0, both in place.
    - 11b: with `quick: { waiting: true }`, Domain counts `other` 1 and `methods` 1. That is p1 and p2 only.
12. **Met.**
    - 12a: `ghost` is listed at 0 after the held values, labelled `ghost`.
    - 12b: `["amir","amir",0,true]`.
13. **Met.** `true`; then `false` with stale, dated and mine read as given; `false`; `false`.
14. **Met.** `["p1"]`.
15. **Met.** Groups read `year, venue, waiting, hub, ...`. `LINE_FACETS` reads `form, status, role, year, domain, venue, waiting, hub`. The heading is "Waiting on" and the tone is red.
16. **Met.** One row `btfno`, count 2, labelled BT-FNO.
17. **Not verifiable here; the look settles it.** Reading supports it:
    - The Chip sits after the deadline Chip and carries the waiting glyph.
    - The count is `strip.waiting` over the board's projects before any filter (Projects.svelte:204, :382).
    - `shown` applies `quick` (Projects.svelte:194), so the line reads "1 of <n> shown".
    - Rows are ordered by count, then by words: "BT-FNO" sorts before "Maryam Amir Haeri".
    - The tone is red.
    - The track record's board is the same Projects.svelte and FilterBar.
18. **Not verifiable here; the look settles it.** With one hub there is no Hub group, so Waiting on is the last line group and `FoldRun` folds it first, then Venue. More heads its section with the group's tone, which is red.
19. **Not verifiable here; the look settles it.** Case 10 gives no group and `waiting 0`. The Chip is always drawn.

## Spec

1. **Sp1. A change no item asks for (low; recorded under item 2's verdict, which still holds).**
   - Where: merge.ts:153-163.
     ```
     waitingOn: [
         ...new Set(
             one.waitingOn
                 .map((key) => key.trim())
                 .filter((key) => key !== '')
                 .map((key) => resolve(['people', 'projects'], key, waiting) ?? key)
     ```
   - Item 2 asks only that the merge trim each value before resolving it. The empty-value drop and the `Set` are the builder's own, reported as judgment call 1.
   - Trimming alone would already meet every outcome item 2 and case 7 name. `waitedOn` and `facetValues` both deduplicate, so the card shows one tag, the row counts once and the toggle counts once.
   - I read every reader of `Project.waitingOn`; none behaves wrongly:
     - `validate.ts:203-213` reads the raw manifest, so it is unaffected.
     - `person.ts:111-112` and `referrers.ts:79` use `.includes(id)`, which the drop and the deduplication do not change. The trim makes them find padded references, which is correct.
     - `schema.ts:440` (`fieldValues`) now shows the values trimmed, once each, with empty ones gone. The Editor posts only the fields it changed (Editor.svelte `dirty`/`changed`), so an untouched field writes nothing, and an edited one writes the cleaned list.
     - The Focus Awaiting box (focus.ts:607-609) changes; that is B1.
   - The extra stays consistent with the card and with case 8. What is missing is that the report does not state its Awaiting-box effect; see B1. The fix is that one sentence in the report; the code can stay.
   - Failure scenario: none wrong. A manifest with `waiting-on: ['']` on a submitted project now moves from an empty-named "Waiting on" row to its venue's "Under review" row. Nobody was told.

## Proof

None. The changed test failed on the unchanged code, and the failure is quoted (report lines 52-58; the scratchpad `o90-test-first.txt` agrees).

I read the test against the code:
- Without the `waiting` entry in `FACETS`/`applyFilters`, the second test keeps `three` and fails.
- With `waitingValue` returning the full id, the first test gets two rows and fails.

No assertion or predicate is loosened. The one existing assertion that changed is the call in the second test, which now runs over three items.

## Standards

1. **S1. A doc of the field the step reshapes is known false and was left.**
   - Where: model-entities.ts:381-384, outside the write list.
     ```
     * What the project waits for before it moves, the manifest's `waiting-on:`. An entry is a key
     * of the people registry or the id of another project, and nothing else; validate
     * reports a value that is neither, and the Focus strip draws each by the name it resolves to.
     ```
   - The step changes what the field holds: values are trimmed, listed once, with no empty ones. The doc says none of that.
   - It was already false in two ways. An entry is an internal `<hub>:<key>` id, not a registry key. "Nothing else" is wrong because the merge keeps a value that names neither as written (merge.ts:162, `?? key`).
   - The report saw it (report line 190) and left it as "already untrue". spec.md requires a sentence describing the changed behaviour to be marked still true or rewritten, and the never-lazy rule says to widen the path list rather than leave it.
   - focus.ts:571-573 has the same false sentence and the report does not list it:
     ```
     A `waiting-on:` value is a people key or another project's id, drawn by waiting.ts.
     ```
   - Failure scenario: a reader of `Project.waitingOn` trusts "nothing else" and treats every entry as a record id. Free words such as `IRB: approval` then get resolved and dropped, or passed to `keyOf`, which cuts them at the colon. That is the defect item 2 removed.
   - Fix at landing: say that each entry is the internal id of the person or project it names, or the words as written when it names neither, read trimmed, once, with empty values left out.

2. **S2. The rewritten merge comment does not parse.**
   - Where: merge.ts:153-155.
     ```
     // A name of `waiting-on` is read trimmed, an empty one left out and one listed again kept
     // at its first place, so ` amir ` names the person `amir` does: a person's key, a
     // project's or the words of someone the hub keeps no record of, which stay as they are.
     ```
   - After the colon, the list "a person's key, a project's or the words ..." reads as a description of "the person `amir`".
   - "Which stay as they are" contradicts "read trimmed".
   - Failure scenario: a reader concludes that free words are kept untrimmed, which is wrong.

3. **S3. A 'not X' contrast in a head comment.** Where: facets.ts:117-118, `A waited-on value that names no record is its words as written, not a key.` spec.md bans the 'not X but Y' construction; this is its "X, not Y" form. The brief's item 6 dictated the wording, so the fix belongs at landing: drop ", not a key".

4. **S4. The new HELP sentence is hard to parse.** Where: docs/HELP.md:306.
   ```
   Venue, Waiting on, which lists each person and project the board's projects wait on, each once by name, and each `waiting-on:` value that names neither as it is written, and keeps the projects that wait on any value picked, and, while the workspace has more than one hub, Hub, which lists the hubs, ...
   ```
   Three "and" clauses run on before the next group name, so the list of group buttons cannot be read at a glance. Failure scenario: a reader takes "and keeps the projects ..." for a separate group. A separate short sentence for Waiting on would fix it.

5. **S5. A git command spec.md forbids (no effect on the diff).** The report's line 117 says the builder ran `git -C /dev/null status`. spec.md "Where you work" bans `git -C`. It printed nothing and changed nothing, and the report says so.

## Behaviour

1. **B1. The Focus Awaiting box changes in ways the report states only partly.** The report says a duplicated or padded value is "counted once". It does not state two consequences of the merge change (focus.ts:607-614):
   - A project whose `waiting-on:` holds only empty values. Before, it counted as waiting, under an empty-named row. After, it is not waiting; if its stage pauses the countdown, it counts under its venue's "Under review" row.
   - A padded ` amir `. Before, it had a row of its own (" amir (1)"). After, it joins "Amir Haeri (n)".

2. **B2. The Person view and the delete question change; the report does not state it.**
   - Where: person.ts:111-112 (the Person view's Waiting on block) and referrers.ts:79 (a person's record page and the question before a delete).
   - Before: a project whose manifest writes ` amir ` (padded) was not listed under Amir.
   - After: it is listed. This is correct, a consequence of the trim item 2 asks for, but the report should name it for the look.

3. **B3. The new toggle narrows the room for group buttons; the report does not state it.**
   - Where: FilterBar.svelte:142-148, inside `.toggles`, whose width `room()` subtracts (FilterBar.svelte:96).
   - Every project board's line 1 gains a chip, so in a given pane width fewer group buttons fit before folding into More.
   - Before: a pane that fitted Form to Venue showed them all. After: Venue or Domain may fold into More at the same width.
   - The report covers the fold order (case 18), not this change.

## Declined to judge

- I did not run the changed G92 test against the base code myself. That needs the test file placed in the base copy, or a scratch vitest root, and I may write neither. I relied on reading the base `FACETS` and `filter-menu.ts:49`, which have no `waiting`, and on the builder's log `o90-test-first.txt`, which shows the two failures quoted.
- Cases 17-19 are looks on landing at localhost:8790, which I may not open.
- Whether the step's commits or base are as the dispatch entry says would need `git log`, which I may not run.
- The case-run program sets `(globalThis as any).$state`. It is a scratchpad program, not in the diff and not a test fixture of the tree, so I did not judge it against the no-globals rule.

Usage: a06d8386fc5730138, claude-opus-5-5, 224665 tokens, 64 tool uses, 11 min 34 s

## Closed

- Sp1, B1, B2 and B3: the merge's drop of empty and repeated values is kept (inside item 2's purpose: the Focus Awaiting box no longer counts one person twice or an empty name); the four user-visible effects are stated in the booking and the landing report.
- S1: fixed at landing, `model-entities.ts:381-384` and `focus.ts:571-573` say what an entry of `waitingOn` is.
- S2: fixed at landing, the merge comment rewritten.
- S3: fixed at landing, ", not a key" dropped from the `facets.ts` head comment.
- S4: fixed at landing, `docs/HELP.md:306` gives Waiting on a sentence of its own.
- S5: recorded in the booking; the command printed nothing and changed nothing.
