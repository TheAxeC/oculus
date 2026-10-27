# O92 round 1: the review's findings and the orchestrator's read

Rules: `agents/spec.md`, `agents/guarded.md` and the step's brief `agents/briefs/O92.md`, which stay in force except where this file says otherwise. The review is `agents/reviews/O92-refuter.md`. Each item below is a ruling: build it as written.

Not in this round, closed by the orchestrator: review Spec 1 (`onfilters` in place of `ontoggle`, `onslices` and `onclear`, accepted: the records each press writes are those the base board wrote); review Spec 2 (the "+<n>" list's pick writes the slice, accepted as the fix of a defect of delivered work, checked by look 31); review Spec 3 (case 37 is the brief's error: the optional radar `maps_to` is not asked, as item 2 and ruling 471 say; the built behaviour stands); review Spec 5 (`map.filters` kept as line 1's accessible name, and the words `map.slices`, `collection.slices` and `collection.title_column`, accepted: each is drawn); review Spec 6 (the paths written outside the brief's list, each internal, accepted); review Standards 1 (the inline programs, under the standing ruling "Unapproved builder scripts": every hunk of the files they touched is read, and the breach is booked at landing); review Standards 4 and 8 (booked at landing).

## What to build

1. **A required typed line keeps the yes off (G134, the orchestrator's read).** G134 says "a required field left unanswered keeps the yes off". Today `answered` (`src/lib/ui/forms/prompt.ts:56-66`) keeps the yes off only for a required pick or multi-pick, and `questionOf` (`src/lib/views/shared/forms/entry/entry-add.ts:107-131`) gives a typed line, and the `list` form of a multi-pick whose hub offers no choices, no `required`. So a tasks Add with its Key or Title left empty has its yes on. After the change: `questionOf` sets `required` on the `line` and `list` prompts of a field the schema marks `required: true`, and `answered` keeps the yes off while such a field holds only spaces (its text trimmed is empty). A prompt of any other caller sets no `required` on a typed line, so its yes does not change. The doc comments of `PromptField` and `answered` say the rule as it is after the change.
2. **No shared default handed to callers (review Proof 2, `agents/spec.md:87`).** `SHOW_DEFAULT` (`src/lib/state/boards/structure/graph.ts:54`, used as `.catch(SHOW_DEFAULT)` at :383) is built per call, so two `parseMapState` calls never return the same `show` object. `parseCollectionState(null)` (`src/lib/state/boards/collection/index.ts:136`) returns `filters` and `more` built per call, as the base's `emptyCollectionState` did. A default object held at file scope and handed to callers is built per call wherever this step added one; the report names each place with its grep.
3. **One reading of a field's words, one column type (review Standards 5).** `EntryList.svelte:82-92` `cellWords` and `collection/bar.ts:96-103` `fieldWords` read a value the same way: one function does it and both read it. `EntryColumn` (`collection/index.ts`) and `ListedColumn` (`table-rows.ts:53`) are one type, `ListedColumn`.
4. **Head comments and a style comment (review Standards 6, the orchestrator's read).** `table-rows.ts:1-3` names the column fitting both lists read (`fittedColumns`). The `.end` style comment of `src/lib/views/shared/forms/bar/SliceLine.svelte` says how many are shown, not "how many projects", since a collection's bar draws it too.
5. **The test file's entries (review Spec 4).** In `tests/views/shared/forms/entry-add.test.ts`, G8 keeps the describe 'the hub an Add writes to' and the describe 'the page an Add opens', and G134 holds the describe 'what a collection Add asks and writes'. The head comment names each entry with the describes it holds, and every row's title ends with the entry it tests ("(G8)" or "(G134)"). The orchestrator writes G134's Test line to name that describe alone at landing, and G8's two lines stay.
6. **G134's rows for item 1.** In the describe 'what a collection Add asks and writes', rows for: a tasks Add's yes off while its Key or Title is empty or only spaces, and on once both hold text with every other required field answered; a required `list` field of a hub with no choices off while empty. Each row is run first on the round's starting tree, where it fails, and the failing run is quoted.
7. **The report (review Proof 1, Standards 1, 2 and 3, Behaviour 1 to 5).** Append to the report:
   - the case 33 reading as the code holds it (`typed` and `kept`, `AddAsk.svelte:23-24` and `:72-73`);
   - the two read-only `python3` runs of the first round (10:42:45 and 10:48:17) beside the list of programs, and the three git reads (`git log --oneline -3`, two `git grep`) that are outside `agents/spec.md:33`;
   - the grep of the added comment lines and test titles for history words, the grep of every removed export and changed name across `src`, `tests`, `docs`, `config --exclude=local.yml` and `README.md`, the helper-reuse grep for `withPick`, `withPicks`, `fittedColumns` and `facetToneIn`, and the collision check of each new id (the group ids `role`, `hub` and `field:<f>`, the facet `status`, `:title`, `stage`, the Show items `projects`, `pillars`, `team` and `connected`) and of the hub re-ask's async path, each with its command and output;
   - under "Host- or user-visible changes", each with its before and after: the Map dropping a project with no stage once a Stage is picked (B1); a saved Collection or Map tab reopening with no filter (B2); a Map Pillar pick drawing only that pillar's projects and pillar nodes (B3); People and Organisations drawing a line 2 with the count and Clear all (B4); the Map's empty case reading `map.empty_filtered` when every project is filtered out (B5); and the yes of an Add with a required typed line empty (item 1).

## Cases (first run on the round's starting tree quoted before the result)

1. The case-run program's `answered` over a tasks Add with Key empty, Key `'  '`, and Key and Title filled: on the starting tree `true`, `true`, `true`; after the change `false`, `false`, `true`.
2. A prompt of another caller with a typed line left empty (the leads Add, `leadAsk`): `answered` is `true` before and after.
3. `parseMapState({}).show === parseMapState({}).show` prints `true` on the starting tree and `false` after; `parseCollectionState(null).filters === parseCollectionState(null).filters` likewise.
4. `grep -n "cellWords\|EntryColumn" -r src` prints no own value reading and no `EntryColumn` after the change; on the starting tree it prints both.
5. The G134 rows of item 6 fail on the starting tree (quoted) and pass after.
6. Every case of the step's brief still met, case 37 as corrected above.

## Paths this round writes

The step's paths, and:
- `src/lib/ui/forms/prompt.ts`
- `src/lib/views/shared/forms/entry/entry-add.ts`
- `src/lib/state/boards/structure/graph.ts`
- `src/lib/state/boards/collection/index.ts`
- `src/lib/state/boards/collection/bar.ts`
- `src/lib/views/boards/collection/EntryList.svelte`
- `src/lib/ui/display/table/table-rows.ts`
- `src/lib/views/shared/forms/bar/SliceLine.svelte`
- `tests/views/shared/forms/entry-add.test.ts`
- `.scratch/migration/agents/reviews/O92-report.md`

## Verify before you report

From the worktree's root, once after the last change, the scoped test files while you work (`agents/spec.md:25`):
1. `npm run diagrams && npm run docs:palette && npm run test:quick -- --base a964e0170`: every command passed.
2. `sh utils/unused-exports.sh`, compared with `.agents/worktrees/O92-base/unused-exports.txt`: no export added to the list.
3. The ASCII gate over every file this round changes, and `LC_ALL=C grep -n '[^ -~]'` over the report: nothing printed.

The plan's whole verify list runs once, at landing on main. The report states how many times the verify list ran in this round.

## Report

Append a section "Round 1" to `.scratch/migration/agents/reviews/O92-report.md` in the worktree's copy of the ledger: each item with DONE or NOT DONE and the evidence, the cases' first run, then the result table, the verification lines, and anything handed back with its reason. Files are edited with the edit tool, never by a program (`agents/spec.md:65`).
