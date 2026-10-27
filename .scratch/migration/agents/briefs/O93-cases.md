# O93 round 0: the rulings on the first run's hand-back

Rules: `agents/spec.md`, `agents/guarded.md` and the step's brief `agents/briefs/O93.md`, which stay in force except where this file says otherwise. The hand-back is the report `agents/reviews/O93-report.md`, points H1 to H4. Each ruling below is part of the brief: build it with items 1 to 11.

## Rulings

1. **H1, `tests/server/edit/writes.test.ts` past 880 lines: option (a).** The two line-write describes and the new `it` 'sets and drops the people of a subtask line' move into a new `tests/server/edit/lines.test.ts`, the line writes being one concern of the write route; `deck-acts.test.ts` and `deck-edit.test.ts` move with `mv` into a new folder `tests/server/edit/deck/`, which holds the deck's writes as `src/lib/server/edit/writes/config/lists/deck/` does, so `tests/server/edit` stays at ten items. The imports of the two moved files are corrected for their new folder; no test title changes. Option (b), moving the three `writes` files, changes more imports for the same result; option (c), one 909-line file, is the lazy option and the size check refuses it. The report names every guarded test whose path moved, with its old and new path; the orchestrator corrects `agents/guarded.md` at landing.
2. **H2, `tests/routes/edit/undo/undo.test.ts` past 880 lines: as recommended.** `FOLDER_ROWS`, `INSIDE_ROWS` and `PLACED_ROWS` with their tests (`undo.test.ts:318-432` at the base) move into a new `tests/routes/edit/undo/folder-undo.test.ts`, with the two new `INSIDE_ROWS` rows of cases 37 and 38 there; the helper `made` moves into `tests/routes/edit/write-fixture.ts`, and both test files import it. No test title changes. The report names G9's moved tests with their old and new path, for the orchestrator's correction of `agents/guarded.md` at landing. Staying at 885 lines is the lazy option and breaks `spec.md`'s size rule.
3. **H3, the fixture: yes.** `INSIDE_MANIFEST` in `tests/routes/edit/write-fixture.ts:462` gains the second follow-up `- { do: chase the reply, done: true, lead: [ann], supervisors: [ann] }`; the new rows act on key '1', and the existing rows keep key '0' and their meaning. `tests/routes/edit/write-fixture.ts` is added to the step's paths, for this line and for `made` (ruling 2).
4. **H4, the premise "The three read the same line shape" is false: option (a).** Premise 1 is corrected: `subtasks()` keeps a line only when its `do` is text, while `entrySubtasks` also reads a number or a list as text. Item 1's one reader is the text-only reader `subtasks()` of `src/lib/data/shapes/shapes.ts:395-406`, used by the Focus board, the entry card and `followupText` alike, so a line whose `do` is not text is drawn nowhere, as the Focus board already behaves. The research hub's data holds no such line: a read of every `.yml` file of the hub except `local.yml` (158 files, the orchestrator's run) finds 0 subtask or follow-up lines whose `do` is not text, so no line any view draws today changes. Option (b) would make the Focus board draw a number or a list as a line's words, a new way to read a line for an input that has not happened.
5. **The Remove press on a task line.** The first run shows that a press with the id `remove` on a task line writes `snooze: 'true'` through `fieldsFor` on the unchanged tree. The build sends Remove to its question before any write, as items of the brief say, and the report's run after the change shows that a Remove press writes nothing until the question is answered.

## Cases added

47. A Focus row and an entry card over the lines `[{do: 3}, {do: ['x','y']}, {do: 'z', deadline: 20261201}]` each draw only the line `z`. A run the report quotes, before and after.
48. A Remove press on a task line, before the question is answered, writes nothing: the write route receives no call. A run the report quotes, before (the `snooze: 'true'` write) and after.

## Paths added

- `tests/server/edit/lines.test.ts` (new)
- `tests/server/edit/deck/deck-acts.test.ts` and `tests/server/edit/deck/deck-edit.test.ts` (moved)
- `tests/routes/edit/undo/folder-undo.test.ts` (new)
- `tests/routes/edit/write-fixture.ts`
