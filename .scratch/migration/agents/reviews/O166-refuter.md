# Step O166 refuter report (on .agents/worktrees/migration-O166, base feb1d1354)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

The machine's load average was 3.96 at the start (`uptime`). No test timed out. `npm run test:quick` and every whole-suite command were not run.

```
$ npx vitest run tests/state/forms/referrers.test.ts --reporter=dot        (check 2, after the change)
 Test Files  1 passed (1)
      Tests  15 passed (15)

$ LC_ALL=C perl -ne '...the gate of spec.md...' $(find src tests config -type f ! -name local.yml); echo "exit $?"   (check 3)
exit 0
$ LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/reviews/O166-report.md; echo $?
1

$ grep -rn "Referrers.svelte\|<Referrers" src; echo "exit $?"              (check 4, C11 first grep)
exit 1
$ grep -rn "GroupHead" src/lib/views/boards/project src/lib/views/boards/person src/lib/views/boards/entry src/lib/views/shared/card/record/RecordPage.svelte src/lib/views/shared/card/record/RecordCounts.svelte src/lib/views/shared/card/record/RecordDetails.svelte; echo "exit $?"
exit 1

$ git diff feb1d1354 --stat -- tests docs/HELP.md docs/data-map.md docs/decks.md; git status --short <same paths>   (checks 5 and 6)
(nothing printed)

$ npx vitest run tests/state/boards/board/board-rules.test.ts tests/state/boards/board/board-views.test.ts tests/state/forms/referrers.test.ts tests/state/system/settings/fold.test.ts tests/state/system/settings/hub-scope.test.ts tests/state/shared/hub-words.test.ts --reporter=dot
 Test Files  6 passed (6)
      Tests  182 passed (182)
$ npx vitest run tests/checks/tree/duplication.test.ts tests/checks/tree/boundaries.test.ts tests/checks/source/comment-width.test.ts --testTimeout=0 --reporter=dot
 Test Files  3 passed (3)
      Tests  31 passed (31)
$ npx vitest run tests/data/hubs/workspace-projects.test.ts tests/data/shapes/catalog-files/vocab.test.ts tests/views/shared/forms/entry-add.test.ts --reporter=dot
 Test Files  3 passed (3)
      Tests  47 passed (47)
$ sh utils/unused-exports.sh > <scratchpad>/ue-now.txt; diff .agents/worktrees/O166-base/unused-exports.txt <scratchpad>/ue-now.txt
227c227
< Unused exported types (107)
---
> Unused exported types (106)
279d278
< src/lib/state/boards/collection/index.ts: FieldKind
$ grep -rn --exclude=local.yml "listsReferrers\|REFERRED\b\|...\|z\.enum(\['rail'\])" src tests config docs README.md; echo "exit $?"
exit 1
$ grep -rn "Referrers\|RAIL_ROW\|settingsReveal\|revealShape\|lineMembers\|domainMembers\|domainsWithMembers\|venueUsers" docs README.md | grep -v "^docs/diagrams"; echo "exit $?"
exit 1
$ npx vitest run tests/checks/source/keys.test.ts tests/checks/source/catalog-file-keys.test.ts tests/checks/source/history.test.ts tests/checks/tree/size.test.ts tests/checks/source/strip-types.test.ts --testTimeout=0 --reporter=dot
 Test Files  5 passed (5)
      Tests  28 passed (28)
$ sh utils/folder-check.sh; echo $?
0
$ npx vitest run tests/checks/config/arrangements.test.ts tests/checks/config/config-folder.test.ts tests/state/boards/board/board-new-project.test.ts tests/state/boards/board/hub-facets.test.ts tests/state/boards/board/items.test.ts tests/state/workbench/navigation/registry-glyphs.test.ts --testTimeout=120000 --reporter=dot
 Test Files  6 passed (6)
      Tests  176 passed | 2 skipped (178)
$ npx vitest run tests/checks/diagrams/diagrams.test.ts --testTimeout=300000 --reporter=dot
 Test Files  1 passed (1)
      Tests  47 passed (47)
$ npx vitest run tests/checks/diagrams/palette.test.ts --testTimeout=300000 --reporter=verbose
 FAIL  |unit| tests/checks/diagrams/palette.test.ts > the palette page > is what the palette gives now
-   | Projects of a record | record_board |
 Test Files  1 failed (1)
$ npx prettier --check <the changed .ts, .svelte and .yml files>
All matched files use Prettier code style!
$ git status --short | wc -l
60
```

## Verdicts

Items:

- 1: holds. `RecordPage.svelte` draws the said line, the card, the row (`RecordCounts.svelte`, only when `row.total > 0 || row.waiting > 0`), then the blocks; `row` is optional, so `Listing.svelte`, `Career.svelte` and `Post.svelte` draw as at the base.
- 2: holds. `recordButtons` (`record-board.ts:183-207`) keeps the archival row, counts only projects with a slice (Ruling 2), "other" last; total by `projectCount`; `pressedState` sets the whole board state with `mine: false`; on a page `RecordCard.svelte` draws no foot strip. Behaviour 2 names one input where the count and the board differ.
- 3: holds. `RECORD_VIEW` beside `AWAITING_VIEW`, `listed: false`; `idsPreset` shared, skipping its own id; tab id `JSON.stringify([board, kind, collection, id])`; ids live through `recordIds`; `record_gone` for no record, gone and a changed key; no New project.
- 4: violated, Behaviour 1. The widened reveal does not show a row asked a second time in an open Settings tab whose scope changed in between.
- 5: holds.
- 6: holds. No `GroupHead`, `usePaneFold` or `instanceFolded` in the pages; documents keep `Segment` and `Markdown`.
- 7: holds by reading; every field, tag and action at the base is present on the page.
- 8: holds for the changed files; two head comments of unchanged files are made false (Standards 2).

Cases: C1 met (reading); C2 met (reading); C3 met (reading, look to confirm); C4 met (reading, look to confirm the card counts on four records); C5 met (reading); C6 partial (Behaviour 1); C7 met (reading); C8 met (reading); C9 met (reading); C10 met (reading); C11 met; C12 met (reading); C13 met (reading).

## 1. Spec

none

## 2. Proof

none

## 3. Standards

- S1. `docs/palette.md` against the `RECORD_VIEW` registration (`Projects.svelte`): the palette page is not regenerated and `tests/checks/diagrams/palette.test.ts` fails ("| Projects of a record | record_board |" missing); `test:quick` does not choose that check. Fix at landing: `npm run docs:palette` and `docs/palette.md` in the landing's paths. Verdict: none.
- S2. `src/lib/views/shared/card/pane-fold.ts:5-6` ("the project page's blocks and its LaTeX panel, the blocks of every other record's page") and `src/lib/views/shared/card/record/sets/ProjectCards.svelte:2-3` ("A list of projects on a record's page, the person page's sections and a set's page"): made false; no record page folds through `pane-fold.ts`, and only `Listing.svelte` imports `ProjectCards.svelte`. Verdict: none.
- S3. Four full-list runs, one beyond the rules file's "Token discipline". Verdict: none.
- S4. The report states no empty, duplicate and colliding case for `RECORD_VIEW`, the tab id or the widened `reveal` ask, and no superseded path; by reading, `show` (`reveal.svelte.ts:87-95`) awaits `tick()` and `unfold`, then `deps.end()` removes whatever ask is in the state, so an ask for another row written during the await is dropped unshown. Failure scenario: a press on a resource's `slurm.resource` tag while the rail's reveal of the same open Settings tab is awaiting its unfold leaves Settings at the rail row and the setting's ask gone. Verdict: none.

## 4. Behaviour

- B1. `src/lib/views/system/workbench/reveal.svelte.ts:75-84`: `scoped` is never reset when an ask ends, so a second ask for the same row in a mounted Settings tab never switches the scope; the base's rail effect picked Workspace whenever `revealing && scope.kind !== 'workspace'`. Failure scenario: open Settings from the rail, switch to the Hub scope, press the rail's Settings choice again: the rail row is not shown, the ask stays, and the next manual switch to Workspace scrolls to the rail row unasked. Fix: reset `scoped` when the ask ends. Verdict: item 4 violated, C6 partial.
- B2. `src/lib/state/boards/structure/cross-links.ts:135-139`, through `record-board.ts:127` and `:235`: a `related:` list naming one project twice (or by key and hub-qualified) counts it twice, while the board shows it once. Failure scenario: `related: [p1, hub/p1]` draws "2 projects", and the total opens a board with one card. Fix: one id per project in `recordProjects` (or `namedProjects`). Verdict: none.
- B3. The report's "User-visible changes" says "dead ends included" only for the pillar, domain, venue and dataset pages; on a funding scheme's, an organisation's, a resource's and any other entry's page, and on the project page, the row now counts dead-end projects under a `dead-ends` button where the base's strip left them out, and on the project page a held dead-end related project moves from the Related line to that button. Verdict: none.

## Declined to judge

- The looks C3 to C10, C12 and C13, taken at landing.
- `npm run test:quick` and the whole verify list.
- Which Pillars and Domains cards change their count under Ruling 1 (needs the hub's manifests).
- Whether every edit was made with Edit and Write (needs the builder's transcript).
- The HELP sentences of check 6, the orchestrator's at landing.
- Whether the Settings rows of `behavior.yml:slurm.resource` carry that id and the `hub` layer beyond `rows.ts:82`, `:300`, `:412`; the look settles it.

Reviewer usage: a3498add57a00290f, claude-opus-5-5, 334161 tokens, 116 tool uses, 19.4 min

## Repair round 1, refuted

The machine's load average was 5.32 at the start (`uptime`). No test timed out. `npm run test:quick` and every whole-suite command were not run; they run at landing.

```
$ npx vitest run tests/state/forms/referrers.test.ts --reporter=dot        (check 2)
 Test Files  1 passed (1)
      Tests  15 passed (15)

$ LC_ALL=C perl -ne '...the gate of spec.md...' $(find src tests config -type f ! -name local.yml); echo "exit $?"   (check 3)
exit 0
$ ls -d bin
ls: bin: No such file or directory
$ LC_ALL=C grep -n '[^ -~]' <record-board.ts, reveal.svelte.ts, pane-fold.ts, ProjectCards.svelte>; echo "delta exit $?"
delta exit 1
$ LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/reviews/O166-report.md; echo "report exit $?"
report exit 1

$ grep -rn "Referrers.svelte\|<Referrers" src; echo "exit $?"              (check 4, C11 first grep)
exit 1
$ grep -rn "GroupHead" src/lib/views/boards/project src/lib/views/boards/person src/lib/views/boards/entry src/lib/views/shared/card/record/RecordPage.svelte src/lib/views/shared/card/record/RecordCounts.svelte src/lib/views/shared/card/record/RecordDetails.svelte; echo "exit $?"
exit 1

$ git diff feb1d1354 --stat -- tests docs/HELP.md docs/data-map.md docs/decks.md; git status --short <same paths>   (checks 5 and 6)
(nothing printed)

$ npx vitest run tests/state/boards/board/board-rules.test.ts tests/state/boards/board/board-views.test.ts tests/state/forms/referrers.test.ts tests/state/system/settings/fold.test.ts tests/state/system/settings/hub-scope.test.ts tests/state/shared/hub-words.test.ts --reporter=dot
 Test Files  6 passed (6)
      Tests  182 passed (182)
$ npx vitest run tests/state/boards/board/board-rules.test.ts tests/state/boards/board/board-views.test.ts tests/state/system/settings/fold.test.ts tests/state/system/settings/hub-scope.test.ts --reporter=dot
 Test Files  4 passed (4)
      Tests  162 passed (162)
$ npx vitest run tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts tests/checks/tree/size.test.ts tests/checks/tree/duplication.test.ts tests/checks/tree/boundaries.test.ts --testTimeout=0 --reporter=dot
 Test Files  5 passed (5)
      Tests  47 passed (47)
$ npx prettier --check <the four files of the round's delta>
All matched files use Prettier code style!
$ sh utils/unused-exports.sh > <scratchpad>/ue-r1.txt; diff .agents/worktrees/O166-base/unused-exports.txt <scratchpad>/ue-r1.txt
227c227
< Unused exported types (107)
---
> Unused exported types (106)
279d278
< src/lib/state/boards/collection/index.ts: FieldKind
$ grep -rn --exclude=local.yml "listsReferrers\|REFERRED\b\|entry_form\.referrers\b\|...\|z\.enum(\['rail'\])" src tests config docs README.md; echo "stale exit $?"
stale exit 1
$ grep -rn "Referrers\|RAIL_ROW\|settingsReveal\|revealShape\|lineMembers\|domainMembers\|domainsWithMembers\|venueUsers" docs README.md | grep -v "^docs/diagrams"; echo "docs exit $?"
docs exit 1
$ grep -n -i -E "\b(previously|used to|no longer|anymore|formerly|was moved|replaced|instead of|old |legacy|revert|earlier|today)\b" <the six new files>; echo "exit $?"
exit 1
$ git diff feb1d1354 -U0 -- src config | grep "^+" | grep -c -w "today"
0
$ grep -rn "ProjectCards" src/lib
src/lib/views/shared/card/record/CardGrid.svelte:15:    // sections of a page (sets/ProjectCards.svelte) draw their cards through it.
src/lib/views/boards/listing/Listing.svelte:30:    import ProjectCards from '../../shared/card/record/sets/ProjectCards.svelte';
src/lib/views/boards/listing/Listing.svelte:115:                <ProjectCards
src/lib/views/boards/listing/Listing.svelte:130:            <ProjectCards projects={listed} onsaid={(answer: string) => (said = answer)} />
$ grep -rln "usePaneFold\|pane-fold" src/lib    (the users the rewritten pane-fold.ts head names: Listing.svelte and Career.svelte among the hits)
$ sh utils/folder-check.sh; echo "folder exit $?"
folder exit 0
$ for d in <the five folders the report names>; do ls -A $d | wc -l; done
10 each
$ wc -l record-board.ts reveal.svelte.ts pane-fold.ts ProjectCards.svelte Settings.svelte
277, 123, 55, 77, 491 (as the report's table gives them; Settings.svelte at the base 520)
```

The round's delta has four files. Three are listed in files.txt and one has a whole-diff change since the base: `record-board.ts` (`eachOnce`, `joinedProjects`, head and doc comments), `reveal.svelte.ts` (`:82` scope reset, `:98` guard, comments), `pane-fold.ts` (head comment) and `ProjectCards.svelte` (head comment). No other path of files.txt differs from its snapshot copy.

### Verdicts

Items of the brief's "What to build", for the whole diff since the base:

- 1: holds. `RecordPage.svelte:73-77` draws the said line, the card, then the row only when `row !== undefined && (row.total > 0 || row.waiting > 0)`, then the blocks. `row` is optional, so `Listing.svelte`, `Career.svelte` and `Post.svelte` draw as at the base.
- 2: holds for the row on every record page. `recordRow` and `recordButtons` (`record-board.ts:204-257`) keep the archival row, count only projects that have a slice (Ruling 2) and put "other" last. `RecordCounts.svelte:40-42` opens the board with `pressedState`, which sets `mine: false`. On a page, `RecordCard.svelte:187` draws no strip. The views' cards are Finding 1.
- 3: holds. `RECORD_VIEW` and `idsPreset` are shared with `awaitingPreset` (`presets.ts:566-630`) and skip their own view id. The tab id is `JSON.stringify([board, kind, collection, id])`. The ids are read live through `recordIds`, and they now come once each through `eachOnce`.
- 4: holds. The repeated ask is closed by `reveal.svelte.ts:82`, and the superseded ask by `:98` (round items 1 and 2).
- 5: holds. `RecordCounts.svelte` draws `record_waiting` when `row.waiting > 0`.
- 6: holds. The C11 second grep prints nothing.
- 7: holds by reading.
- 8: holds. The two head comments of the first review's S2 are rewritten and true: `pane-fold.ts` names Listing and Career, which are both among the hits of the `pane-fold` grep, and `ProjectCards.svelte` names `Listing.svelte`, its only importer.

Cases of the brief's "Cases", judged against the cases ruling where it rules:

- C1: met, by reading `recordProjects`, `recordIds` and `recordRow` (`record-board.ts:146-180`, `:243-257`).
- C2: met, by reading `pressedState` (`:265-277`) and `recordButtons` (`:219`).
- C3: met by reading; the look is at landing.
- C4: met by reading (row and board read one list, each project once); the look is at landing.
- C5: met by reading.
- C6: met by reading. A second rail press from another scope now picks Workspace again (`:82`). The look is at landing.
- C7: met by reading for the pages and for the fields the views' cards show. The count on the views' cards is Finding 1.
- C8: met by reading.
- C9: met by reading.
- C10: met by reading.
- C11: met, by the run above.
- C12: met by reading.
- C13: partial, Finding 1. Each record page shows the `dead-ends` button and its board holds that project. On the Pillars, Domains and Venues views, the same record's card shows that project in no group of its strip, against Ruling 1's "the card and the row always agree".

Items of the round's brief:

- 1 (B1): holds. `reveal.svelte.ts:82` `if (id === undefined) scoped = undefined;` sits inside an effect that tracks `deps.asked()`. `end` writes the layout store synchronously (`restateInstance`, then `access.change`, then `apply`, then `savePages`, which sets `store.current`; `layout.svelte.ts:580-599`), so the next ask for the same row passes the `id === scoped` test and picks the row's scope. The scope effect still sets a scope only when the scope on screen does not draw the row, so no check was removed.
- 2 (S4): holds. `show` returns after its awaits when `deps.asked() !== id` (`:98`). The show effect tracks `deps.asked()` and runs again for the newer row. The scope effect sees an id different from `scoped` and picks the newer row's scope. Read for shown twice: a second `show` for the same ask, started when the effect reran (the query cleared, the group unfolded), resumes after the first has called `end()`. It then reads `asked()` undefined and returns, so the row is scrolled once and ended once. Read for left unshown: a newer ask is never ended by an older `show`. A tab closed during the waits reads undefined and returns.
- 3 (B2): partial, Finding 2. The row and the board read `recordProjects`, which applies `eachOnce`, so they agree. The card's strip on a collection's view still counts the project twice.
- 4 (S2): holds (see item 8).
- 5 (S4 and B3, the report): holds. The report's "Edge cases of the record board's tab and the reveal ask" gives the empty, duplicated, colliding and gone cases, and the in-flight, after-close and superseded cases, each with what the code does. "User-visible changes" lists the `dead-ends` button page by page, the project page's Related line included.

### Findings

- Finding 1, Spec (Ruling 1 of the cases ruling). Place: `src/lib/views/shared/card/record/RecordCard.svelte:186-190`, with `LineCard.svelte:97`, `DomainCard.svelte:68` and `VenueCard.svelte` passing `{projects}`: "const linked = $derived.by(() => { if (page) return []; return ( groups ?? (projects === undefined ? [] : groupProjects(projects, configMap(), vocabOf))". What is wrong: under Ruling 1, `lineMembers`, `domainMembers` and `venueUsers` now include dead-end projects. Off the page, the card's strip still groups them with `groupProjects` and its default `archival = false`, which drops the `dead-ends` row (`cross-links.ts:288`). On the Pillars and Domains views the card then disagrees with itself: the tag `projectCount(projects.length)` counts the dead end and the strip does not show it. On the Venues view the strip is the card's only count, and it leaves the dead end out. On the record's page, the row counts it under `dead-ends` and in the total. Ruling 1 reads: "One count per record, the same everywhere ... on the record's page and on the Pillars, Domains and Venues views alike, so the card and the row always agree." Failure scenario: a pillar named by two projects at `submitted` and one at `failed`. On the Pillars view its card reads "3 projects", but its strip has one group, in review, with a count of 2. On its page the row reads "2 in review", "1 dead-ends", "3 projects". The brief's item 2 and C7 keep the views' cards unchanged; the reviewer leaves the clash with Ruling 1 to the orchestrator. Verdict: C13 partial.
- Finding 2, Behaviour (round item 3). Place: `src/lib/views/shared/forms/entry/card/EntryCard.svelte:207`, `rows === null ? crossLinks(entry, held, projects, people, configMap(), vocabOf, keeps) : []`. That call reaches `cross-links.ts:156`, `const named = namedProjects(entry, collection, projects, people);`, with no deduplication, and `groupProjects` then counts both hits (`cross-links.ts:296`, `:316`). What is wrong: `eachOnce` was put in `recordProjects` (`record-board.ts:146-149`), so only the row and the board count the project once; the card's strip off the page still counts it twice. The round's brief offered `namedProjects` as the place for the fix, which would reach the row, the board and every strip together. Failure scenario: an entry of a plain collection with `related: [p1, hub/p1]`; its card on the collection's view shows a count of 2, its page row "1 project", and the total opens a board with one card. Verdict: round item 3 partial.

### Declined to judge

- The looks C3 to C10, C12 and C13, which are taken at landing, including whether the second rail press reaches a mounted Settings tab through `openView` writing the new ask.
- `npm run test:quick` and the whole verify list, which run at landing.
- `docs/palette.md` and `tests/checks/diagrams/palette.test.ts`: regenerated at landing.
- Which Pillars and Domains cards change their count under Ruling 1 (needs the hub's manifests).
- Whether every edit of the round was made with Edit and Write (needs the builder's transcript).
- The HELP sentences of check 6, the orchestrator's at landing.

Reviewer usage: a8ce87366f2e26d24, claude-opus-5-5, 200549 tokens, 48 tool uses, 8.0 min
