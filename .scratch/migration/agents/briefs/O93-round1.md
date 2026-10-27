# O93 round 1: the review's findings

Rules: `agents/spec.md`, `agents/guarded.md`, the step's brief `agents/briefs/O93.md` and the round-0 ruling `agents/briefs/O93-cases.md`, which stay in force except where this file says otherwise. The review is `agents/reviews/O93-refuter.md`. Each item below is a ruling: build it as written.

Not in this round, closed by the orchestrator: review Spec 3 (`docs/palette.md` is the command palette's page, so the palette half of case 30 and of item 10 is the brief's error and is not applicable); review Spec 4 (the row 'a follow-up deleted before another' in `folder-undo.test.ts` acts on key '0' because it checks the undo of a delete of a line that is not the last; the orchestrator accepts it beside ruling 3 of `O93-cases.md`).

## What to build

1. **One line reader for the agent seed (review Spec 1).** `src/lib/server/machine/runs/seeds/task-seed.ts:41-44` keeps its own `lineShape`. The seed reads a `subtasks:` line through the checklist line shape of `src/lib/data/shapes/shapes.ts` (`checklistLineShape`, exported under a name that says it reads one checklist line), and its own `lineShape` goes. What the seed keeps stays as its head comment says: a string line, and a line with a blank or missing `do`, read with `do` as the empty text, `deadline` as the line's deadline or the empty text, and `done` as the shape reads it. The seed's answers for every reference stay as they are now.
2. **The test halves of cases 10 and 40 (review Spec 2).** `tests/data/snapshot/normalise.test.ts` (G32) reads a note with `done: "yes"` and asserts it reads as not done. `tests/server/edit/lines.test.ts` asserts, after the write of `lead: ["a,b"]`, that `followups()` over the file reads that note's `lead` back as the one key `a,b`.
3. **The report's character set (review Proof 1).** The report's quoted outputs carry each tab written as `<tab>`, and the row of the brief's verify 7 is rerun as the brief writes it, `LC_ALL=C grep -n '[^ -~]'` over the report, printing nothing; the round's report section says the first run's row was run with a predicate that admits tabs.
4. **A doc comment the change made false (review Standards 1).** `src/lib/data/model/model-entities.ts:386` names a note's fields as they are now. Then each name or shape the step changed (`Followup`, `Subtask`, `FOLLOWUP_NOTES`, `FollowupAction`, `SubtaskAction`, `subtasksOf`, `SubtaskRow`, `subtaskFieldsShape`, `noteShape`, `lineShape`) is grepped across `src`, `tests`, `config --exclude=local.yml` and `docs`, and every sentence those hits make false is corrected; the report quotes each grep and its hits.
5. **One list of the people fields, one loop over them (review Standards 2).** `PEOPLE_FIELDS` in `src/lib/views/shared/forms/dated/line-save.ts:11` goes: the views read `LINE_PEOPLE` of `$lib/data/shapes`. `peopleMark` (`src/lib/state/boards/board/ticker-lines.ts:145-149`) reads a line's people through `peopleOfLine` (exported from `shapes.ts`) instead of its own loop.
6. **Exports with no importer (review Standards 3).** `HeldLine` and `EditedLine` in `line-save.ts` are made local, unless a file outside `line-save.ts` imports them after item 5.
7. **One call in place of two identical branches (review Standards 4).** `src/lib/server/edit/writes.ts:207-209` and `:229-231` call `writeSubtask` and `writeFollowup` once each: the writers gain an overload over the union of their value types (the implementation signature already takes it), so the ternary goes. The report's sentence on "two branches" in the client is corrected: `writes.svelte.ts` makes one union call (`writeLine`).
8. **The cost of the third ticker build, measured (review Standards 5).** The report gives one timing over a synthetic snapshot the size of the research hub (120 projects, 1200 collection entries, 200 subtask and follow-up lines, 40 of them naming people), built under the system temporary directory by a test-only program the report quotes: the median of 20 calls each of `focusPage` (`src/lib/state/boards/focus/filter.ts`) with nothing ticked, with Mine only on and `self` set, and with one role ticked, and of one `ticker` call (`src/lib/state/boards/ticker.ts:190`) over the same snapshot, so the share of one ticker build in the page is seen. The numbers go in the report as measured; nothing is changed for them in this round.
9. **The head comment of `lines.test.ts` (review Standards 7).** It opens with its layer, as `folder-undo.test.ts` does.
10. **The report (review Standards 6 and Behaviour 1).** Append to the report:
    - how many times the verify list ran in the first run and in this round, the last run after the last change;
    - the grep of the added comment lines and test titles for history words, each hit judged;
    - the empty, duplicate and collision checks of each key the step adds (the `pillars` filter key, the three people fields, each new catalog key), each with its command and output;
    - under "Host- or user-visible changes", with the before and after of each: History's undo of a subtask Del or a follow-up Del of a line that is not the last (before: the line comes back at the end and the line that moved up into its place is lost, base run b18; after: it comes back in its place, w17 and w20); the entry card's Subtasks block for a line whose `do` or `deadline` is not text (before b5, after w5), with the orchestrator's count that the hub holds no such deadline (`grep -rnE "deadline: *[0-9]+ *[,}]|deadline: *[0-9]+$" --include='*.yml' --exclude=local.yml` over the research hub prints nothing); the Filter button's tip words.

## Cases (first run on the round's starting tree quoted before the result)

1. `grep -n "z.union\|lineShape" src/lib/server/machine/runs/seeds/task-seed.ts` prints no line shape of its own; on the starting tree it prints lines 41-44. `tests/routes/sessions/compose.test.ts` (which reaches `taskSeed`) passes after the change, and a reference to a line with a blank `do` and to a string line is answered as on the starting tree: a run the report quotes, before and after.
2. The new `normalise.test.ts` row and the new `lines.test.ts` assertion each pass after the change; each is shown passing on the starting tree too, since they check behaviour the step already has.
3. `LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/reviews/O93-report.md` in the worktree's ledger prints nothing; on the starting tree it prints 246 lines.
4. `grep -rn "PEOPLE_FIELDS" src` prints nothing; on the starting tree it prints `line-save.ts` and its importers.
5. `grep -n "setsPeople(subtask) ?" src/lib/server/edit/writes.ts` prints nothing; on the starting tree it prints two lines.
6. Every case of the step's brief and of `O93-cases.md` still met.

## Paths this round writes

The step's paths, and:
- `src/lib/server/machine/runs/seeds/task-seed.ts`
- `src/lib/data/shapes/shapes.ts`
- every file whose sentence item 4's greps show false
- `.scratch/migration/agents/reviews/O93-report.md`

## Verify before you report

From the worktree's root, once after the last change:
1. `npm run diagrams && npm run docs:palette && npm run test:quick -- --base 46657382a`: every command passed.
2. `sh utils/unused-exports.sh`, compared with `.agents/worktrees/O93-base/unused-exports.txt`: no export added to the list.
3. The ASCII gate over every file this round changes, and `LC_ALL=C grep -n '[^ -~]'` over the report: nothing printed.

The plan's whole verify list runs once, at landing on main.

## Report

Append a section "Round 1" to `.scratch/migration/agents/reviews/O93-report.md` in the worktree's copy of the ledger: each item with DONE or NOT DONE and the evidence, the cases' first run, then the result table, the verification lines, and anything handed back with its reason.
