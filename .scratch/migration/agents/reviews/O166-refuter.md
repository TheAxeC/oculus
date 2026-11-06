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
