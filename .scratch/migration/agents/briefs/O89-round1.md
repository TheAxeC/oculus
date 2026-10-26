# O89 round 1: the review's findings, and three checks red on main

Rules: `agents/spec.md`, `agents/guarded.md` and the step's brief `agents/briefs/O89.md`, which stay in force except where this file says otherwise. The review is `agents/reviews/O89-refuter.md`. This round is built on the worktree as it stands. You write no script beyond what this round builds.

## What to change

1. **Save to Literature waits for one change of the collections only (review Behaviour 1).** In `src/lib/views/shared/card/feed/SaveToLiterature.svelte:69-79`, the effect that ends the wait reads the Literature collections themselves (expose them from `literature-save.svelte.ts`), so any change of them ends the wait, as on the base, and a paper the answer's entry does not match never takes the focus later. The comments at :34-36 and :66-67 are then true again; read them against the code.

2. **The dated forms' buttons read "Save" and "Cancel" (review Behaviour 2).** Every other form of the app writes its buttons capitalised (`app.yml`, `editor.yml`, `commands.yml`). `DatedForm.svelte`'s two buttons, on every card and in Quick add, read "Save" and "Cancel": change the words of `project.action.subtask_save` and `project.action.subtask_cancel` in `config/text/views/boards/project.yml` (lines 32 and the save line), or point the form at keys that hold them, whichever leaves no key unread.

3. **The Archival card keeps one stage open at a time and the snapshot's order (review Behaviour 3).** No item asked for a change here. `ArchivalCard.svelte` and `stageGroup` in `src/lib/state/boards/structure/cross-links.ts`: pressing a second stage chip closes the first, as on the base, and a stage's members keep the snapshot's order (drop the sort by id). If `CrossLinks` cannot hold "one open at a time", give it that as an option the Archival card sets; other callers keep theirs.

4. **A record card's deadline carries the countdown tone (review "Declined to judge", the deadline Tag).** The brief's "as the project card's `due`" means the form and the tone: an entry's and a venue's deadline Tag takes the tone `deadline()` in `src/lib/views/shared/card/card.ts` gives a project's due (overdue, soon, later).

5. **The lines the Add run writes are listed on the record's page (review "Declined to judge", lead and Lit Watch pages).** Read `EntryEditor` and `Entry.svelte:311-329`. If a lead's or a Lit Watch paper's page does not list its `subtasks:` and `followup:` lines, it lists them with the same Subtasks and Follow-ups blocks the card uses, so a line written from the card is seen on the page. State what you found, with file and line.

6. **Three tree checks red on main (choice Z1047).** In this worktree, `npx vitest run tests/checks/source/comment-width.test.ts tests/checks/tree/duplication.test.ts` fails:
   - comment-width, 13 lines: `src/lib/data/helpers/hub-names.ts:142`, `src/lib/data/model/model-collections.ts:374,375`, `src/lib/data/sources/collections.ts:4`, `src/lib/data/sources/config/sections/vocab.ts:75`, `src/lib/state/boards/career.ts:58`, `src/lib/state/boards/focus.ts:533`, `src/lib/state/boards/focus/filter.ts:109`, `src/lib/views/boards/focus/lanes/LaneCard.svelte:14`, `src/lib/views/boards/projects/Projects.svelte:255`, `src/lib/views/shared/card/heads/GroupHead.svelte:28`, `src/lib/views/sources/venues/Venues.svelte:14`, `tests/data/sources/config/catalog/options-schema.test.ts:2`. Rewrap each comment within the hundredth column, its words unchanged.
   - duplication: `FoldHead.svelte:46` and `GroupHead.svelte:39` hold the same 9 lines; `tests/data/sources/config/layers/language.test.ts:160` and `tests/server/root/process/config-cache.test.ts:269` hold the same 9 lines. Take each copied block into one place both read (a shared helper or component in the folder that already serves both), with no entry added to `tests/checks/tree/allow-duplication.txt`.
   Both test files pass afterwards. No check is loosened.

7. **The palette page (`docs/palette.md`) is stale on main.** `npx vitest run tests/checks/diagrams/palette.test.ts --testTimeout 0` fails: the page lists "Track record" where the palette now gives "Projects", "Supervision", "Coauthor", "Archive", "Personal", "Software". Regenerate it with `npm run docs:palette`, and the test passes.

8. **`npm run test:quick` runs the checks that scan source text (ruling 467 (a)).** In `tests/tiers/quick.mjs`, a test file under `tests/checks/source` or `tests/checks/tree` is related to every changed file under `src`, `tests` or `utils`, so it is chosen whenever such a file changed, whatever the import depth; those test files run in the checks run with the others. The head comment of `quick.mjs` and the "not covered" line it prints say so. The selection over a change outside `src`, `tests` and `utils` (a `.scratch/` or `docs/` file alone) is unchanged.

9. **The report (review Proof 1, Standards 1, Behaviour 4).**
   - The reason given for `state/shared/page/hubs.ts` is corrected: `REGISTRY_VIEWS` lives in `src/lib/data/helpers/hub-names.ts:133`, the data layer, and the re-export lets a view read it through the state layer; and `RecordPick.svelte:30` imports `$lib/state/workbench/navigation/registry` directly. Either RecordPick reads the kind words through `hubs.ts` too, or the report says why it does not.
   - The report says the list ran three times where the rules file's "Token discipline" allows one run after the last change, and runs it once more only after this round's last change.
   - Each registry card (venue, dataset, domain, pillar line) now lists its subtasks and follow-up lines: stated per kind with its before and after.
   - Every behaviour this round changes is stated with its before and after.

## Cases of this round

- R1. A Literature search hit, Save to Literature, the server's entry not matching the hit: the wait ends at that one change of the collections; a later save that matches does not take the focus. Checked by reading, quoted.
- R2. Quick add and a project's Subtask form: the buttons read "Save" and "Cancel".
- R3. Archival card: press stage A then stage B: A closes, B opens; its members in the snapshot's order.
- R4. A venue whose deadline is 3 days ahead: its Tag carries the same tone a project due in 3 days carries.
- R5. A lead with `subtasks:` and `followup:` lines: its page lists them (or the report shows the file and line where it already does).
- R6. `npx vitest run tests/checks/source/comment-width.test.ts tests/checks/tree/duplication.test.ts tests/checks/diagrams/palette.test.ts --testTimeout 0` passes, its failing run before this round quoted.
- R7. `npm run test:quick -- --base 1da23d50b` lists `tests/checks/source/comment-width.test.ts` and `tests/checks/tree/duplication.test.ts` among its chosen files with their reason, and passes; a run with only a `docs/` file changed chooses none of them. Name the test of `quick.mjs` you change or add, if the rules file's test rule calls for one, with its run before the change.

## Verify before you report

The brief's "Verify before you report" checks again, from the worktree root, over every file the step changes, plus R6. The plan's whole verify list runs once, at landing on main.

## Paths this round writes

The brief's paths, and:
- `src/lib/views/shared/card/feed/SaveToLiterature.svelte`, `src/lib/views/shared/card/feed/literature-save.svelte.ts`
- `config/text/views/boards/project.yml`, `src/lib/views/shared/forms/dated/DatedForm.svelte`
- `src/lib/views/structure/pillars/ArchivalCard.svelte`, `src/lib/state/boards/structure/cross-links.ts`, `src/lib/views/shared/links/CrossLinks.svelte`
- `src/lib/views/shared/card/card.ts` and the record cards that draw a deadline Tag
- `src/lib/views/shared/forms/entry/` (the entry page's editor, if item 5 needs it)
- the 12 files of item 6's comment-width list, `src/lib/views/shared/card/heads/FoldHead.svelte`, `GroupHead.svelte` and a shared file beside them, `tests/data/sources/config/layers/language.test.ts`, `tests/server/root/process/config-cache.test.ts` and a shared fixture beside one of them
- `docs/palette.md`
- `tests/tiers/quick.mjs` and its test, if one
- `.scratch/migration/agents/reviews/O89-report.md` (the report, rewritten whole with this round in it)

## The report

The whole report again, with a section "Round 1" that gives, per numbered item above, what changed (file and line) and the run or reading that shows it, and each case R1 to R7 with its run before this round's change and after.
