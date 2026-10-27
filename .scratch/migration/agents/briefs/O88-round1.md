# O88 round 1: the review's findings

Rules: `agents/spec.md`, `agents/guarded.md`, the step's brief `agents/briefs/O88.md` and the round-0 ruling `agents/briefs/O88-cases.md`, which stay in force except where this file says otherwise. The review is `agents/reviews/O88-refuter.md`. Each item below is a ruling: build it as written.

Not in this round: the html-sites floor (`tests/checks/source/html-sites.test.ts:242`, review Spec 2) is open item 490 for Axel; the line stays as it is and the round's verification shows it as the one red. The placements of review Spec 1 (`state/shared/page/folds.ts`, `views/shared/card/pane-fold.ts`, `views/shared/card/feed/FeedFile.svelte`, `ui/controls/confirm/`, `views/system/status/Status.svelte`) are accepted by the orchestrator for the reasons the report gives; nothing changes in them for that finding.

## What to build

1. **One fold toggle, reused (review Standards 1, and the orchestrator's read of the diff).** The rules file's principle "a parser, a fold or a rule exists once and is reused" holds for the folds of every view. No view writes `folded` by hand:
   - `views/system/gallery/Gallery.svelte`, `views/personal/account-setup/AccountSetup.svelte`, `views/system/workbench/Catalogue.svelte`, `views/system/machine/usage/Usage.svelte`, `views/system/help/keys/Keys.svelte`, `views/boards/project/Project.svelte` and `views/system/audit/Audit.svelte` read and fold their groups through `usePaneFold()` (`views/shared/card/pane-fold.ts`), whose `open(key)` and `toggle(key)` replace each view's `folded` read and its `toggleFold`; every view is drawn under `TabView.svelte`'s `provideInstance`, so the pane's instance reaches it. Audit's `keep('folded', ...)` goes with its `toggleFold`.
   - `views/boards/projects/Projects.svelte` and `views/academic/slides/Slides.svelte`, which keep `folded` in the state their parser reads and write it with the rest of that state, fold through `stateFolds` (`state/shared/page/folds.ts`), with the folded keys read from that parsed state and the write going through the view's own write of its state, every other key kept as it is now.
   - What each view folds, under which key, and what a reload shows stay as they are now.
   - `pane-fold.ts`'s head comment and the head comments of the nine views say how the view keeps its folds after the change.
2. **The comments edited but not rewrapped (review Standards 2).** Each comment paragraph the step edited is rewrapped whole at 100 columns, as "What every package obeys" says: `src/lib/data/model/model-entities.ts:161-162`, `src/lib/ui/html.ts:458-459`, `tests/data/sources/collections.test.ts:57-58` and `:97-98`, `src/lib/views/system/gallery/Gallery.svelte:32-35`. Every other comment paragraph the step's diff edits is read for the same and rewrapped where a line inside a sentence ends short.
3. **The Catalogue's sub-heading row (review Standards 3).** `views/system/workbench/Catalogue.svelte:397` styles `SubHead`'s inner `h4` through `:global(h4)`. The Catalogue places each `SubHead` inside an element of its own markup that takes the full row, and its style names that element, so no view styles a primitive's inner tag.
4. **The report (review Proof 1, Behaviour 1-3).** Append to the report:
   - the case 9 row corrected: which views unfold a revealed card's group, as the code does it (the Inbox, Radar, Venues, Pillars, LinkedIn, Lit Watch, Leads and Settings, each with its file and line), and that Projects and the collections take no reveal into a folded group;
   - under "Host- and user-visible changes", with the before and after of each: a Pillars line with no `kind:` or an unknown kind is drawn among the pillars before and under Other after; the Ideas, Posted and Triaged counts of LinkedIn and the Inbox count the whole list before and the entries the search leaves after; a revealed triaged thread opens Triaged after, where nothing opened it before, with no path writing such a reveal today (`CommandCenter.svelte:239`);
   - the placement of `state/shared/page/folds.ts` listed under "What in the brief was wrong or impossible", with the import-order rule that decides it.

## Cases (first run on the round's starting tree quoted before the result)

1. `grep -rn "foldedWith\|withInstanceKey(.*'folded'" src/lib/views src/lib/shell` prints only `views/shared/card/pane-fold.ts` and `views/boards/entry/Entry.svelte:196` (the move of a record, which carries the folds and toggles none). On the starting tree it prints the nine views.
2. Each of the nine views folds and unfolds a group under the same key as on the starting tree, and a reload shows the group as it was left: met by reading each view's diff; the look on landing shows it.
3. `grep -rn ":global(h4)" src/lib/views` prints nothing. On the starting tree it prints `Catalogue.svelte:397`.
4. Every case of the step's brief and of `O88-cases.md` still met.

## Paths this round writes

The step's paths, and:
- `src/lib/views/system/gallery/Gallery.svelte`
- `src/lib/views/personal/account-setup/AccountSetup.svelte`
- `src/lib/views/system/workbench/Catalogue.svelte`
- `src/lib/views/system/machine/usage/Usage.svelte`
- `src/lib/views/system/help/keys/Keys.svelte`
- `src/lib/views/boards/project/Project.svelte`
- `src/lib/views/system/audit/Audit.svelte`
- `src/lib/views/boards/projects/Projects.svelte`
- `src/lib/views/academic/slides/Slides.svelte`
- `src/lib/views/shared/card/pane-fold.ts`
- `src/lib/data/model/model-entities.ts`
- `src/lib/ui/html.ts`
- `tests/data/sources/collections.test.ts`
- `.scratch/migration/agents/reviews/O88-report.md`

## Verify before you report

From the worktree's root, once after the last change:
1. `npm run diagrams && npm run docs:palette && npm run test:quick -- --base 85a826ca6`: every command passed except `vitest checks`, whose one failure is `html-sites.test.ts > every {@html} site > is one of the sites this file knows about` (open item 490); any other failure is fixed.
2. `sh utils/unused-exports.sh`, compared with `.agents/worktrees/O88-base/unused-exports.txt`: no export added to the list.
3. The ASCII gate over every file this round changes and the report: nothing printed.

The plan's whole verify list runs once, at landing on main.

## Report

Append a section "Round 1" to `.scratch/migration/agents/reviews/O88-report.md` in the worktree's copy of the ledger: each item with DONE or NOT DONE and the evidence, the cases' first run, then the result table, the verification lines, and anything handed back with its reason.
