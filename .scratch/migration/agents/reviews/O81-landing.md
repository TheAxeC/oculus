# O81 landing

Roadmap entry: the oculus migration plan (`.scratch/migration/`). Step O81, the grouping heading, the Venues view by `venue_categories` and the track record's board, landed 2026-10-26. Next: O79's review and landing, O85's cases ruling, /spec O86 and O87.

## Open items

- none.

## Check of the agents

`ListAgents` before the landing listed only O79's builder (aed0feff241baf1c1) and O85's builder (a3a4085fe48cb342d); none of O81's builder or reviewers was running.

## NOT DONE

Nothing of the step.

## What landed

The whole range from base 335db1c9 (one wip commit d76b612f of the builder's work), 49 paths with the Doc text:

- `GroupHead.svelte`, one heading (a fold control, the optional glyph, the label in its tone at `--fs-md`, the count) on a project board's category sections, the Focus clusters, lane sections and band, and the Venues sections; Career, Command center and Tasks keep `FoldHead`.
- `venue_categories` in `config/catalogs/vocab.yml` as rows `{ key, label, ribbon? }`; the Venues view draws one section per row in its order, then Other, and the month ribbon on a row with `ribbon: true` (set on `conference`).
- A role row of the Focus career track record opens a tab of its own, `<Role>: track record`, of exactly the projects the row counts, one section per record row.
- Each hub's vocabulary on the `config` channel carries `list` (Z1032), written in `docs/apps.md`.
- The Doc text applied to `docs/HELP.md`, `docs/data-map.md:117`, `docs/templates.md` and `docs/apps.md`.

## Checks

In the gate worktree at main's head 91e56256, after `git cherry-pick -n 335db1c9..migration-O81` (a conflict in the generated `docs/diagrams/layers.dot` and `layers.svg`, resolved by regenerating them with `npm run diagrams`):

```
$ npm run diagrams && npm run test:quick
ok      prettier (3.1 s): All matched files use Prettier code style!
ok      ASCII gate (3.6 s)
ok      svelte-kit sync (20.8 s)
ok      svelte-check (193.8 s): 1793025082013 COMPLETED 545 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (249.1 s)
ok      vitest checks (280.9 s)
FAILED  vitest (335.7 s)
ok      vitest slow (513.4 s)
Error: [vitest-pool]: Failed to start forks worker for test files .../tests/ui/html.dom.test.ts.
 Test Files  227 passed | 61 skipped (288)
$ uptime
load averages: 22.92 21.11 17.98
$ npx vitest run tests/ui/html.dom.test.ts
 Test Files  1 passed (1)
      Tests  8 passed (8)
```

The step does not change `tests/ui/html.dom.test.ts`. On main the gate's staged diff was applied with `git apply --index`, the `docs/data-map.md` line staged alone so the uncommitted section on the primary hub stays out of the commit; every one of the 49 staged paths is equal under `cmp` to the gate's file.

## The look

On the default page of a scratch server on port 8797, started from the gate in a scratch home that opens the scratch copy of the hub:

- Focus: the cluster heading `Now: do these 8` folds and unfolds by its control, with `Parked / on hold 19` under it.
- Venues: `Journals 46` and `Conferences 27`, the latter with the ribbon of next deadlines and the month grid; each section folds.
- Track record: the Lead row opens `Lead: track record` with the section `in review 9` and 44 projects, the counts of its row (9 in review, 16 in flight, 10 publications, 9 other outputs).
- Projects: the `in review 9` section is headed by the same heading.

Nothing wrong was seen. The server is stopped and port 8797 is free.

## What was found

- The builder's first report did not pass its bar: one repair round of four items.
- The review over the round found one Standards point (five red files rerun in one run), needing no change.
- Fixes at landing: none. No premise correction. `agents/guarded.md` unchanged.

## Usage

- Brief check a5d05f8c3ea7e30b0, claude-opus-5-5: 269017 tokens, 92 tool uses, 11 min 20 s.
- Builder a88ba93357e1b0941, claude-opus-5-5: 312064 tokens, 102 tool uses, 17 min 53 s (first run); 309417 tokens, 392 tool uses, 65 min 18 s (build under the cases ruling); 339844 tokens, 24 tool uses, 3 min 49 s, then 113806 tokens, 57 tool uses, 24 min 46 s (repair round 1).
- Reviewer acff93497f9c76629, claude-opus-5-5: 319541 tokens, 89 tool uses, 19 min 1 s.
- Reviewer over round 1 ad19dc3160a25fdc1, claude-opus-5-5: 228877 tokens, 46 tool uses, 16 min 56 s.

## Next

O79's review, its repair round and its landing with the split of `hub-names.ts`; O85's cases ruling; /spec O86; /spec O87.
