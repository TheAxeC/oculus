# Step O93 refuter report (on .agents/worktrees/migration-O93, base 46657382a)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number. A finding in code keeps its `file:line`.

**Verdict:** verify 1 is green on my run, and the LaTeX red the builder reported did not reproduce. Every item is built. I found 4 spec findings, 1 proof finding, 7 standards findings and 1 behaviour finding. Item 1 is violated (task-seed.ts keeps its own copy of the line shape), and cases 10 and 40 are partial. No ADR folder exists: `ls docs/adr` printed "No such file or directory".

## Verification (rerun by the reviewer)

```
Verify 1, once, from the worktree root with PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH:
npm run diagrams && npm run docs:palette && npm run test:quick -- --base 46657382a   (exit 0)
test:quick: 69 changed file(s), from git since 46657382a
test:quick: 302 test file(s)
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.3 s)
ok      eslint (2.5 s)
ok      svelte-check (10.3 s): 1793077550985 COMPLETED 549 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (153.3 s): Duration  144.67s (transform 94.68s, setup 0ms, import 222.98s, tests 322.78s, environment 16.00s)
ok      vitest checks (155.3 s): Duration  146.46s (transform 79.05s, setup 0ms, import 250.08s, tests 287.13s, environment 4ms)
ok      vitest slow (233.4 s): Duration  224.99s (transform 14.34s, setup 0ms, import 129.45s, tests 760.29s, environment 18ms)
test:quick: 235.9 s; every command passed
  tests/state/sessions/terminal/latex-fast-failure.test.ts was in the run ("imports at depth 2") and passed, so the builder's one red does not reproduce.
  git diff 46657382a --stat -- docs/diagrams: "10 files changed, 36 insertions(+), 36 deletions(-)" (the same as the builder's); docs/palette.md unchanged.

Verify 2, wc -l of every changed file: largest source src/lib/state/client/writes.svelte.ts 868, src/lib/data/model/index.ts 847, src/lib/server/edit/writes.ts 789; largest component src/lib/views/boards/focus/Focus.svelte 395. Every count matches the report's table.

Verify 3, the changed test rows:
  after, worktree: npx vitest run tests/server/edit/lines.test.ts tests/server/edit/writes.test.ts tests/server/edit/deck tests/server/core/changes.test.ts tests/routes/edit/undo tests/data/snapshot/normalise.test.ts tests/data/snapshot/schema-rules.test.ts tests/routes/edit/write.test.ts tests/server/edit/writes-collection.test.ts
    Test Files  13 passed (13)
    Tests  239 passed (239)
  before: a scratch copy of .agents/worktrees/O93-base (src, tests, utils, config) with the worktree's package files, a link to node_modules and the final test files copied over, the same seven targets as the builder:
    Test Files  6 failed | 5 passed (11)
    Tests  23 failed | 189 passed (212)
    The failing titles are exactly the builder's list (normalise 1, schema-rules 2, changes 3, lines 4, folder-undo 8, user-key 5).

Verify 4: sh utils/unused-exports.sh (exit 0), then diff ../O93-base/unused-exports.txt <output>: nothing printed, diff exit 0.

Verify 5: grep -rn "subtasksOf\|SubtaskRow" src tests; grep -n "subtaskShape" src/lib/state/boards/board/ticker-lines.ts; grep -n "subtaskFieldsShape" src/lib/state/boards/collection/index.ts: each printed nothing.

Verify 6: grep -rn 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO9[0-9]\b' src config docs tests --exclude=local.yml: nothing, exit 1.

Verify 7: the perl gate of spec.md over every changed file and tests/server/edit/deck/*.ts: nothing, gate exit 0.
  LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/reviews/O93-report.md: 246 lines (the first is "664:1<tab>"), so this half is red as the brief writes it (Proof 1).

Commands the report quotes, rerun:
- The case programs, rebuilt byte for byte from the report's code blocks (lines 753-778, 786-929 and 1011-1352) and run as quoted:
  - cases.test.ts on the worktree.
  - both.test.ts on the worktree and on the scratch base copy.
  - After normalising temporary paths, every printed case line equals the quoted output: 64 lines of "a N", 8 of "w N" and 8 of "b N".
- git diff 46657382a -- src/lib/state/sessions/latex/ src/lib/data/sources/config/settings/latex.ts tests/server/text.ts tests/state/sessions/terminal/latex-fast-failure.test.ts: 0 lines.
- ls tests/server/edit | wc -l: 10. ls tests/routes/edit/undo | wc -l: 4. ls src/lib/views/shared/forms/dated | wc -l: 8. sh utils/folder-check.sh: exit 0.
- Moved deck tests: git show 46657382a:tests/server/edit/deck-acts.test.ts and deck-edit.test.ts, each diffed with its copy under tests/server/edit/deck/. Only the relative import lines differ (3 lines in deck-acts, 1 in deck-edit).
- Moved undo block: base undo.test.ts lines 300-440 diffed with folder-undo.test.ts 29-174 after stripping indent. Only the INSIDE_ROWS doc comment changed and three rows were added.
- npm run format / npx prettier --write: not rerun, because they write files. The prettier check above passes, and git status --short lists 68 paths, every one a path of the step's file table, so no file outside the step was rewritten.
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: violated, Spec 1. The rest holds: `subtasks()` and `followups()` read through one `lineFieldsShape` (`shapes.ts:288-303`), the ticker and `entrySubtasks` read through `subtasks()` (`ticker.ts:523`, `collection/index.ts:731-733`), `Followup.done` exists and `followupText` filters done notes (`schema.ts:397-398`).
- 2: holds. `record.ts:255-276`, both help lines and `templates.md:752-754`; the cases 12 rows pass.
- 3: holds. `lineEdit` (`writes/subtasks.ts:486-502`), `lineWriteShape` (`bodies.ts:345-353`), `flowValue` (`render.ts:21-26`), `peopleKeys`, and `lineUndo` putting a deleted line back at its index. Cases 1-7 and 37-42 pass.
- 4: holds. Followups.svelte draws Done/Reopen, Edit and Del with `class:done`. PeoplePicks is drawn in DatedForm (not for a deadline) and LineForm. The new catalog keys are in project.yml.
- 5: holds. `dueFollowups` skips a done note (`ticker-lines.ts:67`), and `peopleMark` sets `people` and `names`. `TickerRow.detail` is drawn muted; its size is the row's own `--fs-xs`.
- 6: holds. `actionsFor` gives a follow-up Done and Remove, and a task entry Remove last. `removeAsked` and `DeleteAsk` sit under Tasks. Cases 14, 15, 44 and 48 pass.
- 7: holds. `lineKeeps`, `linePeopleRule` and `mineWouldHide` (`filter.ts:433-436`, `547-572`, `605`); cases 17-21. Cost: Standards 5.
- 8: holds. `pillars` in `FocusFilter`, `pillarRows`, `entryPillarsKeep`, `schemeEntryKeeps` and the FocusFilter group between Tier and Hub. Cases 22-27 and 43 pass.
- 9: holds. The icons.yml and glyphs.yml rows, `LaneCard.svelte` `.wait` in `--c-red-txt` with the glyph, and `CardLinks.svelte` `tone: 'red'` with `waiting_glyph` on every tag.
- 10: holds for HELP.md 282, 285, 294 and 296, apps.md 439-442 and the Doc text for data-map.md:219. The `docs/palette.md` part is not applicable: the brief is wrong there (Spec 3).
- 11: holds, except that halves of cases 10 and 40 are not in a test (Spec 2). The guarded tests are changed and renamed as the brief and rulings 1-3 say. The moves for `agents/guarded.md` are listed in the report.

Cases of the brief's "Cases":

- 1, 2, 3, 4: met. `lines.test.ts` follow-up `it` and program lines a5-a10.
- 5: met. `lines.test.ts` 'sets and drops the people of a subtask line'.
- 6: met. `lines.test.ts:172-181`, a12.
- 7: met. a27-a36 give null for each bad value and the write for `['ann']`. The route answers null with `not_a_write` (`writes.ts` body dispatch, as for every body).
- 8: met. `changes.test.ts` rows.
- 9: met. folder-undo 'an added follow-up'.
- 10: partial, Spec 2. The `done: "yes"` half is checked only by the program (a39), not by the G32 test.
- 11: met. normalise test, a40, a41 and a46; verify 5c.
- 12: met. schema-rules rows.
- 13-27: met. Program lines as the report maps them; I reproduced every one.
- 28: not verifiable here; it is a look on landing. The data is a54, a55 and a82.
- 29: met. a61 and a63.
- 30: met for `(w)` (a91). The palette half is not applicable (Spec 3).
- 31-36: not verifiable here; looks on landing.
- 37, 38, 39: met. folder-undo rows, both hubs.
- 40: partial, Spec 2. The test asserts `lead: ["a,b"]` written; the read-back as one key is program line a14 only.
- 41, 42, 43, 44, 46: met. a15-a21, a33-a34, a64 and a81.
- 45: not verifiable here; a look on landing.
- 47: met (w5, w6). There is an unstated visible change: Behaviour 1.
- 48: met. w11 and w14; base b13 shows the `snooze: 'true'` write.

## 1. Spec

1. `src/lib/server/machine/runs/seeds/task-seed.ts:41-44`: `const lineShape = z.union([ z.string().transform((line) => ({ do: line, deadline: '', done: false })), z.object({ do: wordShape, deadline: wordShape, done: z.boolean().catch(false) }) ]);`
   - What is wrong: item 1 says "the line shape exists once". A fourth reader of subtask lines keeps its own shape, outside the step's paths. The builder names it as a judgment call and leaves it.
   - Failure scenario: the next field or rule added to a line in `shapes.ts` (another people field, a change to how `done` reads) is read differently by the agent seed than by the board and the card the user pressed. The seed's "must hold the `do` text the page drew" check then compares texts made by two readers.
   - Fix shape: a reader in `shapes.ts` that keeps blank-`do` lines and is reused here. Or the orchestrator rules that item 1 covers only the three readers the brief named.
   - Verdict: item 1 violated.
2. `tests/data/snapshot/normalise.test.ts:98-105` and `tests/server/edit/lines.test.ts:157-160`.
   - What is wrong: the brief lists cases 10 and 40 among the tests (Cases preamble, item 11).
     - Case 10's "a note with `done: "yes"` reads as not done" has no test row; normalise.test.ts has no such note.
     - Case 40's "`followups()` reads it back as the one key `a,b`" is not asserted by lines.test.ts.
     - Both halves are only in the case program (a39, a14).
   - Failure scenario: a later change to `lineFieldsShape` that reads `done: "yes"` as true, or that splits `"a,b"`, passes the suite.
   - Verdict: cases 10 and 40 partial.
3. Brief case 30 and item 10 ("`docs/palette.md` as `npm run docs:palette` writes it"). This is a premise of the brief that does not reproduce: `docs/palette.md` is the command palette's page (`head docs/palette.md`: "# The palette / Cmd+K opens the palette ..."; `utils/diagrams/palette.mjs` head comment).
   - What is wrong: no `waiting` row can appear there. The builder's claim holds.
   - Failure scenario: an orchestrator who reads case 30 as unmet sends a repair round for a page that cannot change.
   - Disposition: correct the brief. Not the builder's defect.
   - Verdict: case 30 palette half not applicable.
4. `tests/routes/edit/undo/folder-undo.test.ts:142-150`: row 'a follow-up deleted before another', `key: '0'`.
   - What is wrong: ruling 3 of O93-cases.md says "the new rows act on key '1', and the existing rows keep key '0'". This third new row acts on key '0'. It is the check of the builder's undo-position fix, so it is needed, but it departs from the ruling's words.
   - Failure scenario: a reader of the ruling and the test finds a row the ruling excludes and cannot tell whether it is allowed.
   - Disposition: close it by the orchestrator's acceptance at landing.

## 2. Proof

1. The builder's report, "DONE / NOT DONE", row "Verify 7, ASCII gate | DONE", and the line "`LC_ALL=C grep -n $'[^\t -~]' ... prints nothing`".
   - What is wrong: the brief's check is `LC_ALL=C grep -n '[^ -~]'` over the report, and it must print nothing. My run prints 246 lines, the tabs after the line numbers of the quoted outputs (first hit "664:1<tab>").
   - The builder ran a widened predicate that admits tabs and marked the row DONE. That is a check loosened.
   - The report's tabs also break the brief's "a character outside it ... written by its name in angle brackets, such as `<tab>`".
   - Failure scenario: the saved report fails the character-set check at landing, and a reader of the DONE row believes verify 7 passed as written.
   - Verdict: verify 7 is red as specified.

## 3. Standards

1. `src/lib/data/model/model-entities.ts:386`: `/** The \`followup:\` notes, a list of \`{ do, after }\` maps. */`
   - What is wrong: a doc comment the change makes false; a note now carries `done` and people. Rules file, "What every package obeys", the rename grep and the "sentence ... that the change makes false" rule.
   - The report quotes no such grep across src, tests, config and docs.
   - Failure scenario: a reader of `Project.followups` believes a note has two fields and writes code that drops `done`.
2. `src/lib/views/shared/forms/dated/line-save.ts:11`: `export const PEOPLE_FIELDS: readonly PeopleAction[] = ['lead', 'supervisors', 'collaborators'];`
   - It duplicates `LINE_PEOPLE` (`src/lib/data/shapes/shapes.ts:357`). Views already import `$lib/data/shapes` (for example `views/boards/collection/Collection.svelte`).
   - `peopleMark` (`src/lib/state/boards/board/ticker-lines.ts:145-149`) repeats the loop of `peopleOfLine` (`shapes.ts:394-401`).
   - What is wrong: rules file, "The principles every package is judged on" (DRY, "a parser, a fold or a rule exists once and is reused").
   - Failure scenario: a fourth people field added to `LINE_PEOPLE` is read and drawn on the board but never offered by the line form's picks.
3. `src/lib/views/shared/forms/dated/line-save.ts:30` and `:33`: `export type HeldLine = ...`, `export type EditedLine<Text extends string> = ...`.
   - What is wrong: exports with no importer outside their own file (`grep -rlw` gives only line-save.ts; the HeldLine in `server/machine/debug/breakpoints.ts` is another, local type). Rules file principles: "one with no importer outside its own file and its tests is removed or made local".
   - Failure scenario: dead public surface; the next reader takes them for a shared API.
   - A small fix at landing: drop `export`.
4. `src/lib/server/edit/writes.ts:207-209` and `:229-231`: `setsPeople(subtask) ? writeSubtask(...hubOf(at), subtask.key, subtask.action, subtask.value) : writeSubtask(...hubOf(at), subtask.key, subtask.action, subtask.value)`
   - What is wrong: two textually identical branches, written only to satisfy overload resolution. Rules file principles (KISS). A third overload taking the union (the implementation signature already does) would make one call.
   - The report's sentence "The route and the client call the overloaded writers from two branches" is also inaccurate: `writes.svelte.ts` has one union call (`writeLine`).
   - Failure scenario: a maintainer changes one branch, the second keeps the old call, and the type check does not tell them.
5. `src/lib/state/boards/focus/filter.ts:547-572` (`linePeopleRule`), which builds the snapshot and the whole ticker a third time while Mine only or a role applies.
   - What is wrong: the builder names the cost and leaves it unmeasured in the judgment-call list. Rules file working rules: "A risk you name is a task you own: fix it, or say plainly and prominently that it is unfixed."
   - Failure scenario: on a workspace the size of the research hub, every snapshot push and every filter pick on Focus runs three ticker builds; the board may lag, and nobody has measured it.
   - Not verified by me either; a timing of `focusPage` over a large synthetic snapshot with Mine only on and off settles it.
6. The builder's report as a whole: it omits what the rules file requires.
   - The number of times the verify list ran ("Token discipline"). It names at least two full runs, one before the last change, which that section allows only after the last change.
   - The grep of added comment lines and test titles for the history words, with each hit judged ("What every package obeys"). My grep of the added lines finds only present-tense uses ("before which", "still open"), none a history word.
   - The grep after each renamed name or shape (same section), whose absence left Standards 1.
   - The empty, duplicate and collision checks of each key the step adds (the `pillars` filter key, the people fields, the catalog keys).
   - Failure scenario: the orchestrator cannot tell from the report whether these were done; Standards 1 shows one was not.
7. `tests/server/edit/lines.test.ts:1` opens "// What the line writes do ..." with no layer.
   - What is wrong: rules file, "Every module and component you add opens with the head comment ...: its layer". folder-undo.test.ts, the other new test file, does: "Layer 2, route tests".
   - Failure scenario: none at run time; the head comment rule is broken for one new file.
   - A small fix at landing.

## 4. Behaviour

1. Visible changes that the report's "Host- or user-visible changes" section does not state with a before and after:
   - History's undo of a subtask Del or a follow-up Del of a line that is not the last, from `undo.ts` `lineUndo` with `writeSubtaskAdd(..., at)`. Before: the line came back at the end of the block and the line that had moved up into its place was overwritten and lost (base run b18: `"asBefore":false`, "test it" lost). After: it comes back in its place and the file is as it was (w17, w20).
   - The entry card's Subtasks block for an entry whose line has a non-text `do` or a non-text deadline. Before, b5: `[{"key":"0","do":"3",...},{"key":"1","do":"x | y",...},{"key":"2","do":"z","done":false,"deadline":"20261201"}]`. After, w5: `[{"key":"2","do":"z","done":false}]`. The non-text lines go (ruling 4), and so does the deadline tag of a numeric `deadline:`, which ruling 4 does not mention.
   - The Filter button's tip words, now "show only what the ticked roles, tiers, pillars and hubs hold".
   - These appear only in the judgment calls and the case lines.
   - Failure scenario: the look on landing is read against that section and does not check the History undo of a Del or an entry card with a numeric deadline, so a regression in either goes unseen.

## Declined to judge

- Looks 28, 31-36 and 45: they need the running page, which a reviewer does not open.
- The cost of the third ticker build (Standards 5): it needs a timing run on a large workspace, which the brief does not list.
- Whether an undone line should come back byte for byte rather than in the fixed field order `do`, dates, `done`, people. Today unknown fields of a deleted line are dropped on undo, as `addSubtask`'s field list has always done for subtasks. Within the brief, item 3 defines "as it was" by keeping `done` and the people, and case 38 is met. Recording the line's text instead would change how line records are made, which is the user's call.
- The builder's scratch base copy reports `tests/routes/edit/undo/user-key.test.ts` red on the base copy and green in the worktree. My copy reproduces the five reds. I did not look into their cause: the file is unchanged, and the cause lies in the scratch copy's environment, which no decision of this step rests on.

Reviewer usage: af10579613d04f309, claude-opus-5-5, 341761 tokens, 79 tool uses, 19 min 30 s.

Files written by the review, all in the session scratchpad `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/`:
- o93-review-verify1.txt
- o93-review-unused.txt
- o93rev-before.txt
- o93rev-cases-after.txt
- o93rev-both-after.txt
- o93rev-both-base.txt
- o93-rev-server.diff
- o93-rev-state.diff
- o93-rev-views.diff
- o93rev-undo-base-block.txt

The scratch base copy and the rebuilt programs are removed. Nothing in the worktree or the main checkout was edited. The verify command regenerated `docs/diagrams/*` in the worktree with the same diff size as before (10 files, 36+/36-).

# Repair round 1, refuted

Round 1 closes every finding it was sent. The round brief's three verify checks are green on my rerun, and every command the round report quotes as evidence reproduces. Every item of the brief, the round-0 ruling and round 1 now holds or is not applicable, and every case is met or is a look on landing. The round leaves two Standards findings, both small and fixable at landing, and one Spec point that is an error in the round brief. Read-only throughout: no file of the worktree, the main checkout or the ledger was edited. The only writes were by verify 1's own `npm run diagrams` and `npm run docs:palette`, and the md5 of every `docs/diagrams/*` file and of `docs/palette.md` is the same before and after that run. `git status --short` lists 70 paths before and after.

```
From the worktree root, PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH:

Verify 1: npm run diagrams && npm run docs:palette && npm run test:quick -- --base 46657382a   (exit 0)
test:quick: 71 changed file(s), from git since 46657382a
test:quick: 302 test file(s)
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.6 s)
ok      svelte-kit sync (2.3 s)
ok      eslint (2.5 s)
ok      svelte-check (8.4 s): 1793080144709 COMPLETED 549 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (135.5 s): Duration  127.47s (transform 63.43s, setup 0ms, import 204.20s, tests 258.02s, environment 5ms)
ok      vitest (135.9 s): Duration  128.41s (transform 76.54s, setup 0ms, import 192.45s, tests 295.54s, environment 13.64s)
ok      vitest slow (217.1 s): Duration  209.74s (transform 12.57s, setup 0ms, import 119.19s, tests 710.43s, environment 18ms)
test:quick: 219.6 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
  The run held tests/data/snapshot/normalise.test.ts (changed), tests/server/edit/lines.test.ts (changed), tests/routes/sessions/compose.test.ts (imports at depth 2, reaches task-seed.ts) and tests/state/sessions/terminal/latex-fast-failure.test.ts (depth 2), all passing.
  git diff 46657382a --stat -- docs/diagrams docs/palette.md: 10 files changed, 40 insertions(+), 40 deletions(-); md5 of docs/diagrams/* and docs/palette.md equal before and after the run; git status --short docs/palette.md: nothing.

Verify 2: sh utils/unused-exports.sh (exit 0, 341 lines); diff ../O93-base/unused-exports.txt <output>: nothing printed, diff exit 0.

Verify 3: the perl gate of spec.md over the 17 files of the round's delta (the 12 non-diagram paths of files.txt that changed, task-seed.ts, and docs/diagrams/layer-views.{dot,svg}, layers.{dot,svg}): nothing printed, gate exit 0.
  LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/reviews/O93-report.md (worktree ledger): nothing printed, exit 1. The main ledger's copy is byte-equal (cmp) and gives 0 hits.

Round delta: diff -u of each files.txt path between ../migration-O93-round-1 and the worktree: 410 lines. Changed: model-entities.ts, shapes.ts, writes.ts, writes/bodies.ts, writes/subtasks.ts, ticker-lines.ts, focus/filter.ts, forms/schema.ts, normalise.test.ts, PeoplePicks.svelte, line-save.ts, lines.test.ts, four diagram files. The one path not in files.txt: src/lib/server/machine/runs/seeds/task-seed.ts (git diff 46657382a, 35 lines).

Commands the round report quotes, rerun in the same form:
- grep -n "z.union\|lineShape" src/lib/server/machine/runs/seeds/task-seed.ts: nothing, exit 1. On the base (git show 46657382a:...): 42:const lineShape = z.union([ and 50:        const line = readAs(lineShape, held);
- npx vitest run tests/data/snapshot/normalise.test.ts tests/server/edit/lines.test.ts tests/routes/sessions/compose.test.ts --reporter=verbose: Test Files  3 passed (3), Tests  32 passed (32); 'fills a project from the manifest keys of the same meaning' and the three rows of the follow-up it of lines.test.ts pass.
- grep -rn "PEOPLE_FIELDS" src tests docs config --exclude=local.yml: nothing. On the round snapshot: line-save.ts:11, :21, PeoplePicks.svelte:19, :43.
- grep -n "setsPeople(subtask) ?" src/lib/server/edit/writes.ts: nothing, exit 1; on the round snapshot also nothing, exit 1. grep -n "setsPeople" on the snapshot's writes.ts: 93, 492, 525. grep -rn "setsPeople" src tests docs config --exclude=local.yml: nothing.
- grep -rn "HeldLine\|EditedLine" src tests docs config --exclude=local.yml: line-save.ts 28, 31, 41, 42, 43 (local types) and server/machine/debug/breakpoints.ts 17, 24 (another local type). Same as quoted.
- Item 4's greps, grep -rnw <name> src tests docs config --exclude=local.yml: subtasksOf 0, SubtaskRow 0, subtaskFieldsShape 0, lineShape 2, noteShape 4, FOLLOWUP_NOTES 2, FollowupAction 8, SubtaskAction 9, Followup 22, Subtask 37. Hits and files are as quoted. The prose grep ("do, after }\|{ do, after\b\|...") gives record.ts:262, shapes.ts:411, model-entities.ts:387, HELP.md:282, templates.md:752 and docs/data-map.md:219, as quoted.
- History words: the added comment lines and test titles (git diff 46657382a -U0 over src tests config docs, without docs/diagrams, plus the new files whole), 517 lines, grep -iwE of the list: 13 hits, each "before" as a position or a date. No "still" or "no longer" remains.
- Keys: grep -cE "^ +<key>:" gives 1 for each of the 5 focus.yml keys, the 8 project.yml keys and waiting in glyphs.yml and icons.yml.
- wc -l of the 13 round files: 448, 207, 177, 59, 74, 405, 781, 772, 757, 669, 603, 370, 191, as quoted. Largest of the whole step: writes.svelte.ts 868, model/index.ts 847; largest component Focus.svelte 395. sh utils/folder-check.sh: exit 0.
- Case 1's program (seed.test.ts and vitest.round.mts rebuilt from report lines 1600-1624 and 1630-1685, HERE pointed at my scratch folder), run on the worktree: Tests  1 passed (1). Its 21 lines, diffed with the quoted block (report 1691-1711): diff exit 0.
- Before half of case 1, by a comparison program of mine: the base's own lineShape (copied from git show 46657382a) against the worktree's linesOf reading through checklistLineShape, over 25 inputs (strings, blank, number, null, list, {}, do as number, list or null, missing do, numeric deadline, done true, "yes" and 1, people, extra fields, a null-prototype object, a Date): "inputs 25, differ 0".
- Item 8's timing program (report 1721-1841), worktree: size {"projects":120,"entries":1210,"lines":200,"naming":40,"people":10}; ticker lines {"tasks":466,"deadlines":100}; focusPage none 44.0 ms (hides false, tasks 466); Mine only 131.9 ms (true, 286); Supervisor unticked 130.8 ms (true, 464); only Supervisor ticked 126.2 ms (true, 448); ticker one build 37.6 ms. The counts are equal to the report's and the medians are within 5 per cent of them (42.7, 126.5, 124.9, 124.1, 37.0).
- Item 10's key checks program (report 1862-1915): Tests  2 passed (2); its 26 lines diffed with the quoted block: diff exit 0.
- Case 6: cases.test.ts and both.test.ts with vitest.cases.mts (report 1014-1355, 789-932, 756-781), O93_TREE=$PWD, on the worktree: Tests  9 passed (9) and Tests  3 passed (3). Every printed line, compared with the quoted last runs (report 1361-1460 and 975-1006) after the temporary folder and its random suffix were normalised: 64 lines and 8 lines, both diffs exit 0.
- Step brief verify 5 and 6, rerun for the whole-step verdicts: grep -rn "subtasksOf\|SubtaskRow" src tests, grep -n "subtaskShape" ticker-lines.ts, grep -n "subtaskFieldsShape" collection/index.ts, and the history-word grep 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO9[0-9]\b': each nothing, exit 1.
```

### Verdicts

Items of the step brief's "What to build" (O93.md), for the whole diff since 46657382a:

- 1: holds. `subtasks()` and `followups()` read through `lineFieldsShape` (`shapes.ts:375-381`). The ticker and `entrySubtasks` read through `subtasks()` (`collection/index.ts:731-733`). The agent seed now reads through the exported `checklistLineShape` (`task-seed.ts:49`) and has no line shape of its own (case 1 grep), with its answers unchanged: the comparison program gives "differ 0" over 25 inputs, and the seed program's 21 lines are equal to those quoted. This closes review Spec 1.
- 2: holds. `record.ts:262-285`, the help words and `templates.md:752`. The schema-rules rows pass in verify 1.
- 3: holds. Case lines 1-7 and 37-42 reproduce (case 6 diff exit 0). The route calls each writer once (`writes.ts:489`, `:519`) through the union overload (`writes/subtasks.ts:164-171`, `:210-217`). The body shape `lineWriteShape` (`bodies.ts:343-353`) is still the one gate, and the people values keep `peopleValueShape`.
- 4: holds. The views read `LINE_PEOPLE` of `$lib/data/shapes/shapes` (`PeoplePicks.svelte:19`, `line-save.ts:7`). The rest is as the first review found, and the case lines reproduce.
- 5: holds. `peopleMark` reads through `peopleOfLine` (`ticker-lines.ts:146`). Case lines 13 and 29 reproduce.
- 6: holds. Case lines 14-16, 44 and 48 reproduce.
- 7: holds. Case lines 17-21 reproduce. The cost is measured (round item 8).
- 8: holds. Case lines 22-27 and 43 reproduce.
- 9: holds. Unchanged in the round, and the case 30 glyph line reproduces.
- 10: holds for `HELP.md` 282, 285, 294 and 296, `apps.md` 439-442 and the Doc text for `data-map.md:219`. The `docs/palette.md` half is not applicable, since `docs/palette.md` is the command palette's page; this is the brief's error, closed by the orchestrator in O93-round1.md.
- 11: holds. G32 now asserts `done: 'yes'` read as not done (`normalise.test.ts:107`, `:324`), and lines.test.ts asserts `followups(...)[1].lead` equal to `['a,b']` (`lines.test.ts:167-168`). Both pass in my rerun, which closes review Spec 2.

Cases of the step brief:

- 1-9: met. lines.test.ts, changes.test.ts and folder-undo rows pass in verify 1, and case lines 1-9 reproduce.
- 10: met. The normalise row for `done: 'yes'` and the `done: true` with people row pass.
- 11: met. The normalise row passes, the case lines reproduce, and verify 5c prints nothing.
- 12: met. The schema-rules rows pass.
- 13-27: met. The case lines reproduce (case 6 diff exit 0).
- 28: not verifiable here; a look on landing.
- 29: met. Case lines reproduce.
- 30: met for `(w)` (case line). The palette half is not applicable (the brief's error, closed by the orchestrator).
- 31-36: not verifiable here; looks on landing.
- 37-39: met. The folder-undo rows pass in verify 1.
- 40: met. The lines.test.ts assertion of the read-back as one key passes.
- 41-44 and 46: met. Case lines reproduce.
- 45: not verifiable here; a look on landing.
- 47 (O93-cases.md): met. The w lines reproduce (both diff exit 0).
- 48 (O93-cases.md): met. The w lines reproduce.

Items of round 1 (O93-round1.md):

- 1: holds. See step item 1. The head comment (`task-seed.ts:10-13`) and the doc comments of `linesOf` (`task-seed.ts:42-46`) and `checklistLineShape` (`shapes.ts:387-391`) are true.
- 2: holds. See step item 11.
- 3: holds. Verify 3's report grep prints nothing. Round item 3 of the report says the first run's row used `$'[^\t -~]'`.
- 4: holds. `model-entities.ts:386-389` names `{ do, after, done }` and the people. The greps are quoted with their hits and reproduce. See Standards 1 for a rewrap point.
- 5: holds. `PEOPLE_FIELDS` is gone (grep: nothing), and `peopleMark` calls `peopleOfLine`.
- 6: holds. `HeldLine` and `EditedLine` are local (`line-save.ts:28`, `:31`).
- 7: holds. One call per writer (`writes.ts:489`, `:519`), and `setsPeople` is gone from src and tests. The judgment call on the client's `writeLine` is corrected (report "Judgment calls", second-to-last bullet).
- 8: holds. The timing reproduces within 5 per cent, and nothing is changed for it.
- 9: holds. `lines.test.ts:1` opens "// Layer 2, server tests."
- 10: holds. The verify count, the history-word grep, the key checks and the three host-visible changes with before and after are in the report (lines 290-292 and the Round 1 sections). The Filter tip's before (`git show 46657382a:config/text/views/boards/focus.yml`, line 117) and after (line 119) match the report.

Cases of round 1:

- 1: met. Grep nothing; compose.test.ts passes; the seed's 21 lines are equal to those quoted; the before equivalence holds by my comparison program (differ 0).
- 2: met. Both assertions pass after the change. Their pass on the starting tree is judged by reading: the round changed no reader behaviour (the shapes.ts delta is two `export` keywords and comments).
- 3: met. Nothing printed; the first review counted 246 on the starting tree.
- 4: met. Nothing after; the snapshot gives the four lines.
- 5: met by `grep -rn "setsPeople" src tests docs config --exclude=local.yml` printing nothing. The check the round brief wrote prints nothing on the starting tree too (Spec 1 below).
- 6: met. Every case line of both programs is equal to the quoted run, and verify 1 is green.

### Findings

1. Spec
   - Round brief `O93-round1.md`, case 5. The text: "`grep -n "setsPeople(subtask) ?" src/lib/server/edit/writes.ts` prints nothing; on the starting tree it prints two lines."
     - What is wrong: this premise does not reproduce. On the round snapshot the grep prints nothing (exit 1), because prettier writes the `?` on the next line (`grep -n "setsPeople"` there gives 93, 492, 525). The brief's check is green on both trees and so proves nothing. The builder named this and ran the wider grep, which is the effective check. This is the brief's error, not the builder's defect.
     - Failure scenario: a reader of the case who takes its empty output as proof of the closure would accept it even if the twin branches had stayed.
     - Verdict: none; case 5 is met by the wider grep.
2. Proof: none. The new assertions in `normalise.test.ts:107`/`:324` and `lines.test.ts:167-168` fail if `done: "yes"` were read as true or if `"a,b"` were split. The round removed no check: `setsPeople` was only a type guard picking between two identical calls, and the body shape (`bodies.ts:343-353`) is unchanged.
3. Standards
   - Comment paragraphs the round edited and did not rewrap as whole paragraphs (rules file `spec.md`, "What every package obeys": "A comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short").
     - `src/lib/state/boards/board/ticker-lines.ts:4-5`: "// data/shapes/shapes.ts (`subtasks`), so the board and a card read a line alike, and a line's" / "// people by its `peopleOfLine`. The projects'". Line 5 is 46 columns inside a sentence, and line 6 (87 columns) is short too.
     - `src/lib/data/shapes/shapes.ts:14`: "// (`peopleOfLine`), which the ticker reads. They sit in a folder of their own". It is 78 columns, and "so every data folder" from line 15 fits.
     - `src/lib/state/boards/focus/filter.ts:456`: " * a line by its record. A line with people is only ever a line of the tasks section or a". It is 89 columns, and "snoozed" fits.
     - `src/lib/state/boards/focus/filter.ts:317`: " ... so a kept project reads". It is 96 columns, and "its" fits at 100.
     - Failure scenario: none at run time. A reader meets ragged head and doc comments against the tree's convention.
     - Small and inside the brief: fix at landing by rewrapping these four paragraphs.
     - Verdict: none.
   - The builder's report, Round 1 item 10: "the first run (phase 1 and round 0) ran verify 1 five times ... more than the token-discipline paragraph of `spec.md` allows".
     - What is wrong: by the builder's own count, the first run ran the verify list beyond what `spec.md` "Token discipline" allows, which that section names a finding of the review. I could not verify the count: it comes from the builder's transcript, which a read and a rerun here do not reach.
     - Failure scenario: cost only, in tokens and minutes; no wrong result.
     - Nothing can be fixed now; it is recorded for the booking.
     - Verdict: none.
4. Behaviour: none. The round makes no host- or user-visible change. Over 25 inputs, `linesOf` with the base's `lineShape` and with the worktree's `checklistLineShape` reads every input the same (comparison program: "inputs 25, differ 0"), and the route makes the same call it did before.

### Declined to judge

- Looks 28, 31-36 and 45: they need the running page, which a reviewer does not open.
- The base-tree halves of the round-0 programs (the "b N" lines of both.test.ts, and the first run of cases.test.ts on the base copy): not rerun. They need a scratch base copy, the first review reproduced them, and the round changed no base-tree code.
- The count of verify runs in the first run and in this round (round report item 10): it comes from the builder's transcript and cannot be checked by a read or a rerun.
- The union overload of round item 7 (`writes/subtasks.ts:164-171`, `:210-217`) also lets an in-process caller pair a text action with a list, or a people action with a text, at compile time. The round brief ruled for this shape. Today the only callers are the route, with values the body shape has paired, and `undo.ts:247-248` with `'delete'` (grep of `writeSubtask(\|writeFollowup(` over src). Whether to keep that wider type is the orchestrator's call under its ruling.
- Scratch note: my scratch files were removed at the end. Five of them (delta.diff, diag-before.txt, round-files.txt, unused.txt, verify1.txt) were first written into the existing folder `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/r1`, which holds files of earlier sessions. A file of the same name there, if one existed, was replaced. Nothing in a ledger refers to that folder's files by these names, so no decision rests on them.

Reviewer usage: a6dc009d56544abb8, claude-opus-5-5, 237935 tokens, 67 tool uses, 14 min 7 s.

## Closed

- First review, Spec 1, Spec 2, Proof 1, Standards 1-4, 6, 7 and Behaviour 1: closed in repair round 1 (`agents/briefs/O93-round1.md` items 1-7, 9 and 10), each closure reproduced by the review over the round.
- First review, Spec 3 (`docs/palette.md` is the command palette's page): the brief's error, closed by the orchestrator in the round's brief; the palette half of item 10 and case 30 is not applicable.
- First review, Spec 4 (the folder-undo row on key '0'): accepted by the orchestrator in the round's brief; it checks the undo of a delete of a line that is not the last.
- First review, Standards 5 (the third ticker build): measured in round 1 item 8 (median of 20 over 120 projects and 1200 entries: `focusPage` 42.7 ms with nothing ticked, 124-127 ms with Mine only or a role filter, one `ticker` build 37.0 ms; the review over the round reproduced them within 5 per cent). The orchestrator's judgment: a filtered Focus page at about 125 ms on a hub of this size is a cost, not a defect that breaks a use, and it is stated in the booking with these numbers.
- Round 1, Spec 1 (case 5's grep prints nothing on both trees, since prettier puts the `?` on the next line): the orchestrator's error in the round's brief; the case is met by `grep -rn "setsPeople" src tests docs config --exclude=local.yml` printing nothing.
- Round 1, Standards 1 (four comment paragraphs not rewrapped: `ticker-lines.ts:4-6`, `shapes.ts:14`, `filter.ts:317`, `filter.ts:456`): fixed at landing, with the orchestrator's own read of the same `ticker-lines.ts` paragraph.
- Round 1, Standards 2 (the first run ran verify 1 five times, beyond `spec.md` "Token discipline"): recorded in the booking; nothing to change in the tree.
- Round 1, declined to judge, the union overload's wider compile-time type: kept as round 1 item 7 ruled; its callers are the route, whose body shape pairs action and value, and `undo.ts` with `'delete'`.
