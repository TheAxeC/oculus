# O93 report: people and Done on the dated lines, Remove on Focus rows, a Pillar filter, and the waiting line in red

NOT done: one check is not green. The last run of `npm run test:quick -- --base 46657382a` printed `FAILED  vitest (202.5 s)` with one failure: `tests/state/sessions/terminal/latex-fast-failure.test.ts`, 'posts the failure notice of a build whose terminal ended while its list was read' (`expected [ [Function], [Function], [Function] ] to have a length of 2 but got 3`). That test's code is unchanged by this step (`git diff --quiet -- src/lib/state/sessions/latex/ src/lib/data/sources/config/settings/latex.ts tests/server/text.ts` prints "none of these changed"); it reaches a changed file only through a type import of `src/lib/data/model/index.ts`. The full run before it, over the same tree but for two comment lines in `src/lib/server/edit/writes.ts`, ended `test:quick: 276.8 s; every command passed`, and the test alone passed three times in a row (`Tests  1 passed (1)` each). My judgment is that it is a timing failure under the load of the full tier; the step did not run the tier again to get a green, so the reviewer's run decides. Everything else in the brief, the round-0 rulings and cases 47 and 48 is built; the looks (cases 28, 31-36, 45) are for landing.

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md`, section "Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)", lines 199-210 (`sed -n 195,212p`):

- 490 (2026-10-27, O88's report, the orchestrator; a lowered threshold in a committed check is a finding for Axel, never an edit made at landing). What it is about: `tests/checks/source/html-sites.test.ts:242` asserts that the scanner finds at least 34 `{@html}` sites under `src/lib`, so that the check over every site (the test before it, "draws the sanitiser, inline Markdown, the catalog, or a named exception") is never run over nothing. O88 removes the intro paragraphs (ruling 484), which takes six sites out: the four of `views/feeds/radar/RadarIntro.svelte`, which is deleted, and two in `views/structure/pillars/Pillars.svelte`. `grep -rho '{@html' <src/lib> --include='*.svelte' | wc -l` prints 40 at O88's base and 34 in its worktree; the builder reports 33 found by the scanner, and every one of them passes the check over every site. So the floor now fails at 33 against 34, and it is O88's one red.
  - (a) The floor becomes 33, the number of sites after O88. Pros: the check keeps its job, proving the scanner reads the tree; the rule each site is judged by is unchanged; one number changes. Cons: a threshold in a committed check is lowered, and the next removal of a site turns it red again.
  - (b) The floor is replaced by the list of files that hold a site, each with its count, so the test checks the sites by name, as its title "is one of the sites this file knows about" says. Pros: a new or removed site is seen by name, never only as a count; the test matches its title. Cons: every added or removed `{@html}` site needs this test edited; a longer test for a check whose job is only to prove the scanner is not empty.
  - (c) O88 lands with the floor red and the red named in the booking. Pros: no change to the check. Cons: main is left red, which the landing refuses. This is the lazy option.
  - Recommendation: (a). The floor only proves the scan is not empty; 33 real sites prove that as well as 34, and the rule the sites are judged by does not move. (b) costs an edit at every future site for no protection the check over every site does not already give.
  - Scheduling: inside O88, at its landing; the review runs meanwhile. O88 lands only after the ruling.
- 489 (2026-10-27, /spec O91, the orchestrator; kind 2 of self-rule, it deletes data, so it waits for Axel). What it is about: each of the ten entries of the research hub's `.oculus/data/academic/joint-work.yml` has a `title` you wrote (for example moreau "Privacy-preserving ML for health & genomics", van-hulle "Neuro & psychophysiology (ECoG / BCI)", naesens "Transplant nephrology - federated, interpretable outcome prediction"). Ruling 470 (a) moves only `note` and `tags` onto the person in `people.yml` and deletes the file, so the ten titles would be deleted. Most titles restate the note, but some hold words the note does not (moreau's "genomics", van-hulle's "psychophysiology"). The other fields carry nothing: `status` is `active` in all ten, and no entry has `meta`, `deadline` or `followup`.
  - (a) Each title is kept as the first sentence of that person's `note`: "<title>. <note>". Pros: nothing you wrote is lost; no new field in the people schema; the note stays the one place for the work with that person. Cons: the moved note is no longer byte for byte the old note; a terse title reads as a heading inside prose.
  - (b) The people schema gains a third field, `work` (text, "What the work with the person is about."), holding the title. Pros: the title is kept as written, apart from the note. Cons: a new field on every person for one line that the note mostly repeats, and one more schema key than ruling 470 named.
  - (c) The titles are deleted with the file, as ruling 470's words read. Pros: no extra work, the ruling's text carried out literally. Cons: deletes text you wrote that the notes do not hold. This is the lazy option.
  - Recommendation: (a). It loses nothing, and it adds no schema key for content the note already mostly holds. (b) keeps the titles too, but adds a field to every person for little gain.
  - Scheduling: inside O91, in the hub commit at its landing; the builder works meanwhile, since the hub text is the orchestrator's. O91 lands only after the ruling.

## The round-0 rulings, as built

Each ruling of `.scratch/migration/agents/briefs/O93-cases.md`, with what is on the tree now:

- Ruling 1, H1 (a). `tests/server/edit/lines.test.ts` is new (184 lines) and holds the describes 'writing one subtask line' (with `LINE_ROWS`) and 'writing the follow-up notes of a manifest', moved from `tests/server/edit/writes.test.ts`, and the new `it` 'sets and drops the people of a subtask line'. `tests/server/edit/deck/deck-acts.test.ts` and `deck-edit.test.ts` were moved with `mv` into the new folder; only their relative imports changed, no title. `ls tests/server/edit | wc -l` prints 10. The moved paths are in "Renamed and moved guarded tests".
- Ruling 2, H2. `tests/routes/edit/undo/folder-undo.test.ts` is new (174 lines) and holds `FOLDER_ROWS`, `INSIDE_ROWS`, `PLACED_ROWS` and their two `it.each`, from `undo.test.ts:318-432` at the base, with the rows of cases 37 and 38. `made` is in `tests/routes/edit/write-fixture.ts:213-219`, and `undo.test.ts` and `folder-undo.test.ts` both import it. `ls tests/routes/edit/undo | wc -l` prints 4.
- Ruling 3, H3. `INSIDE_MANIFEST` (`write-fixture.ts:473`) is the repository manifest with `followup:\n  - { do: ask about the tool }\n  - { do: chase the reply, done: true, lead: [ann], supervisors: [ann] }\n`. The rows of cases 37 and 38 act on key '1'; 'a follow-up done' and 'an added follow-up' act on key '0' and the end of the list.
- Ruling 4, H4 (a). `subtasks()` of `src/lib/data/shapes/shapes.ts` is the one reader of a subtask line for the snapshot, the ticker and an entry's card: `entrySubtasks` (`src/lib/state/boards/collection/index.ts:731-733`) is `subtasks(entry.fields.subtasks)`, and `subtaskFieldsShape`, `subtasksOf`, `SubtaskRow` and the ticker's `subtaskShape` are gone (verify 5 below). Case 47 shows a line whose `do` is a number or a list is drawn nowhere.
- Ruling 5. A Remove press on a task line writes nothing: `act` in `src/lib/views/boards/focus/rows.ts` returns before any write for `remove` on a task entry, and `removeAsked` names the entry whose question Tasks.svelte opens. Case 48 shows it.
- Cases 47 and 48: run before and after, below.
- The four added paths are the ones written.

## The cases

### First run, on the unchanged tree

Cases 1-46 were run in phase 1, before any change; the program, its config and its whole output are quoted in "The case-run program, first run" at the end, and "out N" is line N of that output. Cases 47 and 48 and the undo of a delete before another line were run in round 0 on a copy of the unchanged tree (`<scratch>/o93/base`, described under "Commands that wrote a file"); "b N" is line N of that run's output, quoted at the end.

1. `writeFollowup(..., '0', 'done')`: out 5, `changed: ["followup"]`, the note taken out (`"file":""`).
2. Reopen: out 6, `changed: []`, unchanged.
3. Delete on two notes and on one: out 7 and 8, `changed: []`, unchanged.
4. `'supervisors', ['ann', 'bob']`: out 9, `threw: TypeError: value?.trim is not a function`.
5. `writeSubtask(..., '0', 'lead', ['ann'])`: out 10, `changed: []`.
6. Add with `collaborators`, `done`, `deadline`, `extra`: out 11, `followup:\n  - { do: x }\n`.
7. People bodies: out 24-33, `null` for every value, `['ann']` included.
8. Records: out 20, Done recorded as `{"field":"0","before":{"do":"ask Ann"},"after":null,"undo":"delete"}`; out 21, Delete records `[]`.
9. 'an added follow-up' undo row: `Tests  4 passed | 52 skipped (56)` (phase 1).
10. `followups(...)`: out 36, `[{"key":"0","do":"a"},{"key":"1","do":"b"}]`.
11. `subtasks` and `entrySubtasks` of a line with `collaborators`: out 37 and 38, no people; out 45, the ticker's entry lines carry none; `grep -n "subtaskFieldsShape"` printed lines 726 and 740.
12. The hub schema: out 69 and 70, `followup[0].done` and `followup[0].lead` "is not declared by the schema of this file".
13. Out 44: "pann - closed" (a note with `done: true`) is a Tasks line.
14. Out 53, `["done"]`; out 56, Done sends `writeFollowup({ id: 'lab:pann' }, '0', 'done')`; Remove sends nothing.
15. Out 54, no Remove; out 56, `act(..., 'remove')` on the task writes `["tasks","lab:t1",{"snooze":"true"}]`.
16. Out 55, `["done","agent","snooze:7","snooze:30","snooze:hide","del"]`.
17. Out 46: "pbob: mine" hidden and "pann: theirs" kept; lines follow their projects.
18. Out 48: "pann - sup" kept with Supervisor unticked.
19. No fixture had every record the user's (out 46 and 47, `mineHides: true` from pbob).
20. Out 49, every project line hidden, `hidden: 8`.
21. Out 44: "pbob: ghost" drawn; out 57, no names on a row.
22-24, 26. Out 50 and 51: a pillar choice hides nothing (`hidden: 0`).
25. `grep -n pillar src/lib/state/boards/focus/filter.ts` printed nothing.
27. Out 52: no `pillars` key read.
28. Look on landing. First run: `FocusFilter.svelte:68-123` draws mine, role, tier and hub only.
29. Out 57: the row has no field for names.
30. Out 73, `[]`; `grep -n '"(w)"\|waiting' config/catalogs/glyphs.yml config/catalogs/icons.yml` printed nothing.
31-36. Looks on landing; first run read as quoted in phase 1 (amber waiting tags with the team or related glyph, `CardLinks.svelte:85-90` and `:140-146`; the lane card's wait line muted, `LaneCard.svelte:201-203` and `:296-302`; Done and Edit only on a note, `Followups.svelte:159-184`; What and the date in the forms, `DatedForm.svelte:96-123`, `LineForm.svelte:38-53`; no Remove).
37, 38. No people write and no follow-up delete exist on the unchanged tree (cases 3 and 7).
39. 'a follow-up done' undo row: passed (phase 1, one note in the fixture).
40, 41. Out 12 and 13, `threw: TypeError: value?.trim is not a function`.
42. Out 14 and 15, `changed: []` both.
43. Out 65, every lane and line of both hubs kept.
44. Out 58, no Remove to disable.
45. Look on landing; no Remove on the unchanged tree.
46. Out 16-19: a key past the end is refused for both blocks; a subtask Delete of '0' after a shift takes out the line now at 0, a follow-up writes nothing.
47. b 5: the entry card's lines are `[{"key":"0","do":"3",...},{"key":"1","do":"x | y",...},{"key":"2","do":"z","done":false,"deadline":"20261201"}]`; b 6: the Focus rows of the entry are `["A talk: z"]`.
48. b 10: `removeAsked` is no export; b 13: the Remove press writes `[["writeEntry","tasks","lab:t1",{"snooze":"true"}]]`.
- The undo of a delete before another line, on the unchanged tree: b 18, a subtask Delete of key '0' is recorded `"undo":"field"` with `after` the line that moved up, and its undo leaves `subtasks:\n  - { do: read it, lead: [\"ann\"] }\n`, the line "test it" lost (`"asBefore":false`); b 24, a follow-up Done of key '0' (a delete there) loses "chase the reply" the same way.

### Last run, on the worktree

"a N" is line N of the cases program's last output and "w N" of the cases 47 and 48 program's worktree output, both quoted at the end.

1. a 5: `changed: ["done"]`, `followup:\n  - { do: ask Ann, done: true }\n`. Met.
2. a 6: `changed: ["done"]`, `- { do: ask Ann }`. Met.
3. a 7: two notes leave `- { do: ask Bob }`; a 8: one note leaves the file without `followup:` (`"file":""`). Met.
4. a 9: `- { do: ask Ann, supervisors: [ann, bob] }`; a 10: `[]` gives `- { do: ask Ann }`. Met.
5. a 11: `- { do: write it, deadline: 2026-12-01, lead: [ann] }`. Met; the test is `lines.test.ts`, 'sets and drops the people of a subtask line'.
6. a 12: `- { do: x, done: true, collaborators: [ann] }`; `deadline` and `extra` dropped (a follow-up's date is `after`). Met.
7. a 27-34 `null` for `'ann'`, `3`, `['ann', 4]` and `['']`; a 35 and 36 the write for `['ann']`. Met. The route answers a null body with `server.write_route.not_a_write`, as for every body.
8. `changes.test.ts`, 'records a follow-up note added, changed, marked done and deleted': passes (verbose run below); a 22 and 23 the same records from the program. Met.
9. `folder-undo.test.ts`, 'an added follow-up', both hubs: passes (verbose run below). Met.
10. a 39: `{"key":"0","do":"a","done":true,"lead":["ann"],"supervisors":["bob"]}` and `{"key":"1","do":"b","done":false}`. Met.
11. a 40 and 41: `collaborators: ['ann']` from both readers; a 45 and 46: the ticker line "A task: sub of task" carries `"people":{"collaborators":["ann"]}`; verify 5c prints nothing. Met.
12. a 86: no finding; a 87: `["alpha/project.yml","followup[0].done",6,"followup[0].done must be true or false, not a string"]`. Met.
13. a 45 and 48: no "pann - closed" line, and `hidden.tasks` 0 with nothing unticked. Met.
14. a 56: `["done","remove"]`; a 60: Done sends `writeFollowup(..., '0', 'done')`, Remove `writeFollowup(..., '0', 'delete')`. Met.
15. a 57: Remove last; a 58: `removeAsked` names `{"collection":"tasks","id":"lab:t1"}`; a 60: the task's Remove sends nothing. Met.
16. a 59: unchanged. Met.
17. a 47: Mine only hides "pann: theirs" (`lead: [bob]` under ann's project) and keeps "pbob: mine" (`lead: [ann]` under bob's); "pann: plain" and "pnone: free" follow their projects. Met.
18. a 49: "pann - sup" hidden, "pann - led" kept, `hidden.tasks` 1. Met.
19. a 70: every record ann's, Mine only off, `mineHides: true`; a 71: Mine only on hides "pann: theirs". Met.
20. a 50: with tier `research` unticked "pbob: mine" (naming ann) is hidden. Met.
21. a 47: "pbob: ghost" (`lead: [zed]`) hidden by Mine only; a 62: its row's names are `zed`. Met.
22. a 51: pann hidden, its lane, its lines and its Awaiting tally (Bob Bell) gone, `hidden` counts 5 tasks, 1 awaiting, 1 lane card. Met.
23. a 51: pbob (`[a, b]`) kept. Met.
24. a 52: pnone kept with every pillar unticked. Met.
25. a 74: `lab:s1` has pillar `lab:a` from pann, `lab:s2` none; a 75-76: with `a` unticked, "Scheme one" leaves the deadlines and its band card goes (`band: [["lab:s2"]]`, `hidden.command` 1, `hidden.band.funding` 1); Scheme two is kept. Met.
26. a 51: "A talk: slides" (events, schema declares `pillars`) hidden; "B course: notes" (education, no `pillars` field) kept. Met.
27. a 53: `{}` and `pillars: 'a'` read as `pillars: []`, `['a']` as `['a']`. Met.
28. Look on landing: the Filter list draws no Pillar group with no pillar, and with two hubs each pillar row names its hub. The data it draws: a 54-55 (one hub: "Pillar a"; no pillar: `[]`), a 82 ("Pillar a (home)", "Pillar a (lab)").
29. a 61: `"detail":"Ann Arbor, Bob Bell"` (the registry names); a 63: no detail on a line naming nobody. Met.
30. Partly a brief error (see "Anything in the brief that was wrong"): a 90, `docs/palette.md` holds no `waiting` row, since that page lists the command palette, and `npm run docs:palette` leaves it unchanged (`git status --short docs/palette.md` prints nothing); a 91, the ASCII theme's word is `(w)`.
31-36. Looks on landing; what to look at is under "Host- or user-visible changes".
37. `folder-undo.test.ts`, 'a people write on a follow-up note', both hubs: passes. Met.
38. `folder-undo.test.ts`, 'a follow-up deleted', both hubs: passes. Met.
39. `folder-undo.test.ts`, 'a follow-up done', both hubs: passes. Met.
40. a 13: `lead: ["a,b"]`; a 14: read back as the one key `a,b`. Met.
41. a 15: `['ann', 'ann']` writes `[ann]`; `['']` is no write (a 33-34). Met.
42. a 16: Reopen on an open note, `changed: []`, as a 17 for a subtask. Met.
43. a 81: unticking `lab:a` hides lab's pann and lab's "A talk", and keeps every line and lane of home. Met.
44. a 64: the task's Remove is drawn disabled with "the file has unsaved text". Met.
45. Look on landing.
46. a 18-21: the follow-up and the subtask answer alike: a key past the end is refused ("there is no follow-up note 1", "there is no subtask 1"), and a Delete of '0' after a shift takes out the line now at 0. Met.
47. w 5: the entry card draws `[{"key":"2","do":"z","done":false}]`; w 6: the Focus rows `["A talk: z"]`. Met: both draw only line z.
48. w 11: `removeAsked` gives `{"collection":"tasks","id":"lab:t1"}`; w 14: the press makes no write call, `[]`. Met.
- The undo of a delete before another line, on the worktree: w 17 and w 20, a subtask and a follow-up Delete of key '0' are recorded `"undo":"delete"` and their undo gives the file back (`"asBefore":true`); w 23, a follow-up Done is recorded as a field change and its undo gives the file back.

## DONE / NOT DONE

| Row | State | Proof |
| --- | --- | --- |
| Items 1-11 and rulings 1-5 | DONE | cases above; the guarded rows below |
| Changed and new test rows, before | DONE | base copy: `Tests  23 failed | 189 passed (212)`, each failure listed under "Changed test rows" |
| Changed and new test rows, after | DONE | `Test Files  13 passed (13)`, `Tests  239 passed (239)` |
| Verify 1, the last run | NOT DONE | `FAILED  vitest (202.5 s)`, one test outside the step (first line) |
| Verify 1, the run before | DONE | `test:quick: 276.8 s; every command passed` |
| Verify 2, line counts | DONE | `wc -l` below; largest source 868, largest component 344 |
| Verify 3, rows before and after | DONE | as the two rows above |
| Verify 4, unused exports | DONE | `diff` against the base list prints nothing, `diff exit 0` |
| Verify 5, the three greps | DONE | each prints nothing |
| Verify 6, the history grep | DONE | prints nothing |
| Verify 7, ASCII gate | DONE | `gate exit 0`, nothing printed; the report's grep below |
| Looks, cases 28, 31-36, 45 | For landing | "Host- or user-visible changes" |

The checks, verbatim:

- Verify 1, the last run (`npm run diagrams && npm run docs:palette && npm run test:quick -- --base 46657382a`): the diagrams wrote `docs/diagrams/*.dot` and `*.svg`, the palette `docs/palette.md`; then `test:quick: 69 changed file(s), from git since 46657382a`, `test:quick: 302 test file(s)`, `ok      prettier (0.5 s): All matched files use Prettier code style!`, `ok      ASCII gate (0.8 s)`, `ok      svelte-kit sync (2.8 s)`, `ok      eslint (10.4 s)`, `ok      svelte-check (35.1 s): 1793076455906 COMPLETED 549 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok      vitest checks (172.1 s)`, `FAILED  vitest (202.5 s)` (`Test Files  1 failed | 218 passed | 68 skipped (287)`, `Tests  1 failed | 2858 passed | 790 skipped (3649)`), `ok      vitest slow (262.0 s)`, `test:quick: 265.0 s; failed: vitest`, and "not covered: tests that reach no changed file within the import depth, other than the checks under tests/checks/source and tests/checks/tree, which run for any change under src, tests or utils; the build, the lint of unchanged files".
- Verify 1, the run before it: every line `ok` (`ok      vitest (215.1 s)`, `ok      vitest slow (274.5 s)`, `ok      vitest checks (169.0 s)`, `ok      eslint (11.7 s)`), `test:quick: 276.8 s; every command passed`. The only change after it is the two comment lines in `src/lib/server/edit/writes.ts` (lines 487-488 and 520).
- The LaTeX test alone, three times: `npx vitest run tests/state/sessions/terminal/latex-fast-failure.test.ts` printed `Tests  1 passed (1)` each time.
- Verify 4: `sh utils/unused-exports.sh` then `diff .agents/worktrees/O93-base/unused-exports.txt <the output>`: nothing printed, `diff exit 0`.
- Verify 5: `grep -rn "subtasksOf\|SubtaskRow" src tests`, `grep -n "subtaskShape" src/lib/state/boards/board/ticker-lines.ts`, `grep -n "subtaskFieldsShape" src/lib/state/boards/collection/index.ts`: each printed nothing.
- Verify 6: `grep -rn 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO9[0-9]\b' src config docs tests --exclude=local.yml`: nothing.
- Verify 7: the perl gate of `spec.md:102` over every changed file (the list from `git status --short` with the deck folder's files, the diagrams aside): nothing printed, `gate exit 0`. The report: `LC_ALL=C grep -n $'[^\t -~]' .scratch/migration/agents/reviews/O93-report.md` prints nothing, `ascii exit 1` (run after writing it); the only bytes outside printable ASCII are the tabs after the line numbers of the quoted program outputs. Its open-items section, compared with `sed -n 199,210p .scratch/migration/orchestrator-state.md` by `diff`, gives `diff exit 0`.
- svelte-check alone after the last source change: `COMPLETED 4335 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npx eslint` over `src/lib/views/shared/forms/dated` and the other edited files: `eslint exit 0`.
- `npx vitest run tests/checks/source/comment-width.test.ts tests/checks/source/keys.test.ts tests/checks/tree/duplication.test.ts`: `Test Files  3 passed (3)`, `Tests  30 passed (30)`.

### Changed test rows, before and after

Before, on the base copy with the final test files copied over it: `npx vitest run tests/server/edit/lines.test.ts tests/server/edit/writes.test.ts tests/server/edit/deck tests/server/core/changes.test.ts tests/routes/edit/undo tests/data/snapshot/normalise.test.ts tests/data/snapshot/schema-rules.test.ts` printed `Test Files  6 failed | 5 passed (11)`, `Tests  23 failed | 189 passed (212)`. The failures:

- `normalise.test.ts` 'fills a project from the manifest keys of the same meaning' (`expected { Object (id, tier, ...) } to deeply equal ...`).
- `schema-rules.test.ts`, both rows of "reads a manifest's follow-up note against the schema" (`expected [ ...(2) ] to deeply equal []`, and the not-declared finding in place of the type finding).
- `changes.test.ts` 'records a follow-up note added, changed, marked done and deleted', all three rows (`to match object { kind: 'followup', field: '0', ...}`).
- `lines.test.ts` 'sets and drops the people of a subtask line' (`expected [] to deeply equal [ 'lead' ]`) and the follow-up `it`, all three rows (`expected [ 'followup' ] to deeply equal [ 'done' ]`).
- `folder-undo.test.ts` inside both hubs: 'a follow-up done' (the file not as before: on the base, Done takes note 0 out and its undo overwrites note 1), 'a people write on a follow-up note', 'a follow-up deleted' and 'a follow-up deleted before another' (`expected 400 to be 200`).
- `tests/routes/edit/undo/user-key.test.ts`, all five (`self: ada` where `self: bob` was written). This file is unchanged by the step and passes in the worktree (it is in the 239 below); it fails only on the base copy, whose cause was not looked into.

After, on the worktree, the same files with `tests/routes/edit/write.test.ts` and `tests/server/edit/writes-collection.test.ts`: `Test Files  13 passed (13)`, `Tests  239 passed (239)`. The guarded rows by name (`--reporter=verbose`, every one a pass mark): the two schema-rules rows, 'fills a project from the manifest keys of the same meaning', 'sets and drops the people of a subtask line', the follow-up `it` three times, the changes row three times, and the 22 rows of `folder-undo.test.ts`: own file only 'a snooze set' and 'a tick', and inside 'the primary hub' and 'a second hub' each of 'a field of the manifest editor', 'a snooze set', 'a follow-up done', 'Pin', 'a tick', 'an added line', 'an added follow-up', 'a people write on a follow-up note', 'a follow-up deleted', 'a follow-up deleted before another' (`Tests  22 passed (22)`).

## Commands that wrote a file other than through Edit or Write

In the worktree:

- `mkdir tests/server/edit/deck` and `mv tests/server/edit/deck-acts.test.ts tests/server/edit/deck-edit.test.ts tests/server/edit/deck/` (ruling 1).
- `npm run format` (`prettier --write .`): it rewrote `src/lib/server/edit/writes/bodies.ts`, `src/lib/state/boards/person.ts`, `src/lib/state/client/writes.svelte.ts`, `src/lib/state/shared/stores/shapes.ts`, `src/lib/views/boards/focus/rows.ts`, `src/lib/views/shared/forms/dated/LineForm.svelte`, `RecordPick.svelte` and `Subtasks.svelte`; every other file printed `(unchanged)`.
- `npx prettier --write` on named files after later edits: it rewrote `src/lib/state/client/writes.svelte.ts` (the `export type { ... }` list onto one line) and `src/lib/views/shared/forms/dated/line-save.ts` (its import onto one line).
- `npm run diagrams`: `docs/diagrams/layer-server`, `layer-state`, `layer-views`, `layers` and `writes`, each `.dot` and `.svg` (`git diff --stat -- docs/diagrams`: `10 files changed, 36 insertions(+), 36 deletions(-)`).
- `npm run docs:palette`: `docs/palette.md`, unchanged.
- `npm run test:quick` and `svelte-check`: `.svelte-kit/`.
- The suites' fixtures and the case programs made scratch hubs under the system temporary directory.

In the scratchpad `<scratch>` (`/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad`):

- The base copy `<scratch>/o93/base`: `cp` of the worktree's `package.json`, `vite.config.ts`, `tsconfig.json`, `.npmrc`, `.svelte-kit`, `.oculus` and `assets`; `cp -R` of `src`, `tests`, `utils` and `config` from `.agents/worktrees/O93-base` (it has no `local.yml`); `ln -s` of the worktree's `node_modules`; then `cp` of the final test files over its `tests`, and `rm -f` of its two old deck test paths.
- Shell redirects of the runs' outputs into `<scratch>/o93/` (`both-base.txt`, `both-after.txt`, `cases-after.txt`, `verify1.txt`, `unused.txt`, `quoted.txt`), and `sed -i ''` on `quoted.txt` alone, to shorten its paths for quoting.
- `rm -rf <scratch>/o93`: every program, config, output and the base copy are gone (`ls -a <scratch>` lists no `o93`). `<scratch>/o93-flow.ts` (dated 03:58, importing from the main checkout) is not this step's and was left.

## Files with line counts

`wc -l` after the last change (source at or under 880, component at or under 520):

| File | Lines |
| --- | --- |
| config/catalogs/glyphs.yml | 282 |
| config/catalogs/icons.yml | 281 |
| config/schemas/manifest-schema.yml | 101 |
| config/text/findings.yml | 473 |
| config/text/views/boards/focus.yml | 167 |
| config/text/views/boards/project.yml | 196 |
| docs/HELP.md | 584 |
| docs/apps.md | 847 |
| docs/templates.md | 1542 |
| src/lib/data/model/index.ts | 847 |
| src/lib/data/model/model-entities.ts | 754 |
| src/lib/data/shapes/shapes.ts | 442 |
| src/lib/data/snapshot/schema/record.ts | 457 |
| src/lib/server/edit/entry-edit/index.ts | 23 |
| src/lib/server/edit/entry-edit/render.ts | 62 |
| src/lib/server/edit/entry-edit/subtasks.ts | 361 |
| src/lib/server/edit/writes.ts | 789 |
| src/lib/server/edit/writes/bodies.ts | 779 |
| src/lib/server/edit/writes/subtasks.ts | 386 |
| src/lib/server/edit/writes/undo.ts | 647 |
| src/lib/state/boards/board/ticker-lines.ts | 180 |
| src/lib/state/boards/collection/index.ts | 747 |
| src/lib/state/boards/focus/filter.ts | 669 |
| src/lib/state/boards/person.ts | 174 |
| src/lib/state/boards/ticker.ts | 688 |
| src/lib/state/client/writes.svelte.ts | 868 |
| src/lib/state/forms/schema.ts | 603 |
| src/lib/state/shared/stores/shapes.ts | 548 |
| src/lib/ui/display/ticker/Ticker.svelte | 294 |
| src/lib/ui/display/ticker/ticker-rows.ts | 43 |
| src/lib/views/boards/focus/Focus.svelte | 395 |
| src/lib/views/boards/focus/FocusFilter.svelte | 301 |
| src/lib/views/boards/focus/Tasks.svelte | 205 |
| src/lib/views/boards/focus/lanes/LaneCard.svelte | 316 |
| src/lib/views/boards/focus/rows.ts | 428 |
| src/lib/views/shared/card/project/CardLinks.svelte | 252 |
| src/lib/views/shared/forms/dated/DatedForm.svelte | 167 |
| src/lib/views/shared/forms/dated/Followups.svelte | 289 |
| src/lib/views/shared/forms/dated/LineForm.svelte | 87 |
| src/lib/views/shared/forms/dated/ListHead.svelte | 116 |
| src/lib/views/shared/forms/dated/PeoplePicks.svelte (new) | 74 |
| src/lib/views/shared/forms/dated/RecordPick.svelte | 226 |
| src/lib/views/shared/forms/dated/Subtasks.svelte | 344 |
| src/lib/views/shared/forms/dated/line-save.ts (new) | 61 |
| tests/data/snapshot/normalise.test.ts | 368 |
| tests/data/snapshot/schema-rules.test.ts | 765 |
| tests/routes/edit/undo/folder-undo.test.ts (new) | 174 |
| tests/routes/edit/undo/undo.test.ts | 743 |
| tests/routes/edit/write-fixture.ts | 591 |
| tests/server/core/changes.test.ts | 582 |
| tests/server/edit/deck/deck-acts.test.ts (moved) | 376 |
| tests/server/edit/deck/deck-edit.test.ts (moved) | 143 |
| tests/server/edit/lines.test.ts (new) | 184 |
| tests/server/edit/writes-fixture.ts | 226 |
| tests/server/edit/writes.test.ts | 730 |

Folders: `tests/server/edit` 10 items, `tests/server/edit/deck` 2, `tests/routes/edit/undo` 4, `src/lib/views/shared/forms/dated` 8 (`ls | wc -l`).

### Paths outside the write list, and why

- `src/lib/data/model/index.ts`: the facade re-exports `LinePeople`, the people type of `model-entities.ts`.
- `src/lib/state/boards/person.ts`: `lineNames`, the names of a line's people in its record's hub, which the ticker and both card blocks draw.
- `src/lib/server/edit/entry-edit/index.ts`: re-exports `peopleKeys` and the line editor's new parameters.
- `src/lib/views/shared/forms/dated/PeoplePicks.svelte` (new): the three people picks, which `DatedForm.svelte` and `LineForm.svelte` both draw.
- `src/lib/views/shared/forms/dated/line-save.ts` (new): `PEOPLE_FIELDS`, `changedPeople` and `saveLine`, the edit form's save both blocks run. It exists because `tests/checks/tree/duplication.test.ts` refused the save written twice in `Followups.svelte` and `Subtasks.svelte`, and because eslint cannot type an export of a component's module script (`no-unsafe-call` at `Followups.svelte:130` and `Subtasks.svelte:134` while `changedPeople` lived in `PeoplePicks.svelte`).
- `tests/server/edit/writes-fixture.ts`: `Subject`, `SUBJECTS` and `fileOf`, which `writes.test.ts` and `lines.test.ts` both use.
- `tests/routes/edit/write-fixture.ts`, `tests/routes/edit/undo/folder-undo.test.ts`, `tests/server/edit/lines.test.ts`, `tests/server/edit/deck/`: added by the round-0 rulings.
- Lines outside a shared file's range, each base-numbered from `git diff -U0` hunk heads: `shapes.ts:20` (the model import); `collection/index.ts:23-27` (imports); `bodies.ts:13-15` (imports); `writes.ts:92` (import), `:474` (the `hubOf` helper) and the two comments at the line writes; `undo.ts:18` (head comment), `:75` (import), `:215` (`lineIndex`, `LINE_BLOCKS`, `lineUndo`) and `:512-524` (the line branches of `apply`); `writes.svelte.ts:44-63` (imports and the re-export list) and `:325-329`; `stores/shapes.ts` exports `LineWriter` inside its 211-217 range. The undo lines are the fix of the defect under "Judgment calls"; the rest are imports and helpers of the ranged code.

## Judgment calls the brief left open

- The undo of a delete of a line that is not the last lost the line that moved up, for subtasks on the unchanged tree and for the new follow-up Delete (base run b 18 and b 24). The fix: `subtaskRecord` (`writes/subtasks.ts`) sets the undo kind by whether the block grew or shrank, and records as `after` what the key holds now (the next line, or null for the last); `undo.ts` `lineUndo` puts a deleted line back before the line now at its index (`writeSubtaskAdd(..., at)`, `addSubtask(..., at)` in `entry-edit/subtasks.ts`), and takes an added line out with a delete. The undo's check compares the file with `after`, so it refuses when the line at that key has changed since. The check that fails without the fix is `folder-undo.test.ts` 'a follow-up deleted before another'; on the base copy it cannot run (400, no follow-up delete), and the subtask form of it is the program's row b 18, which loses "test it".
- A line put back by an undo is written from its recorded fields in a fixed order (`do`, the date fields, `done`, the people), so a line whose fields stood in another order or were quoted by hand comes back with the same values in that order; the fixtures' lines come back byte for byte (w 17, w 20 and the undo rows).
- `renderFlowMap` (`entry-edit/render.ts`) writes any list of texts in a flow line inline, `[a, b]`, through `renderFlowList`, not only the people fields; any other value is written by `flowScalar` as before.
- The people of a line are drawn as their registry names in the line's record's hub, a key no hub holds as the key (a 62 `zed`), joined by `project.card.line_people_join`.
- The line rule of item 7 is a third ticker build (`linePeopleRule` in `filter.ts`), made only while a self is named and Mine only or a role is set. Its cost was not measured.
- A funding scheme's band card is read from the entries of the hub's funding file, not from the scheme records the Pillar rule filters, so `keptSnapshot` also keeps an entry of a funding registry file as its scheme is kept (`schemeEntryKeeps`); without it the band kept the card of a scheme the Pillar list hid (case 25).
- `ListHead.svelte` takes the record's `target` and derives the record key and the hub from it, in place of `record` and `root` props, so both blocks hand it the same thing; the markup the duplication check refused at `Followups.svelte:161` and `Subtasks.svelte:170` was two attributes longer than the base's.
- The two body shapes of the line writes are built by one helper (`lineWriteShape` in `bodies.ts`), each caller writing `kind: z.literal(...)` in the head it hands over, the form the list of recorded kinds (`tests/fixtures/kinds.ts`) reads; with the literal inside the helper, `history.kind_subtask` and `history.kind_followup` lost their reader in `keys.test.ts`.
- The route and the client call the overloaded writers from two branches whose text reads alike (`setsPeople(...) ? write(...) : write(...)`), since each call picks one overload; a comment says so at `writes.ts:487-488`.
- `src/lib/server/machine/runs/seeds/task-seed.ts` keeps its own `lineShape`, which keeps lines with a blank `do` on purpose; it is a reader of subtask lines outside the brief's three and was not changed.

## Host- or user-visible changes

- A project page or a record card's Follow-ups block: a done note stays, struck through, with Reopen in place of Done; every note has Del, which deletes it. A note and a subtask line that name people show the names after the text in small muted text (look 33).
- The add form of a follow-up and of a subtask, on a card and through Quick add on Focus: What, the date, then Lead, Supervisors and Collaborators. The deadline form asks Deadline alone. The edit form of a line shows the three picks starting from the line's people; a save writes only the fields that changed (look 34).
- Focus, Tasks section: a follow-up line has Done (marks it done, the line leaves the board) and Remove (deletes the note). A task entry's line has Remove last; pressing it asks the card's Delete question under the section, naming any file that refers to the entry; No closes it, yes deletes the entry and says so on the board's outcome line; a second Remove asks about the second entry alone (looks 36, 45). A row of a line naming people shows their names after its label.
- Focus, the Filter list: a Pillar group after Tier and before Hub, one row per pillar, all ticked, drawn only while a pillar exists; with several hubs each row names its hub, as "Pillar a (lab)" (looks 28, 35). Mine only and Role read a line's own people where it names any.
- Focus, the WAITING ON tags of a project card: red, each with the clock glyph (`waiting`), in the light and the dark theme (look 31).
- Focus, a lane card waiting on someone: the waiting line red after the clock glyph; Blocked the same (look 32).
- The ASCII theme draws `(w)` for the waiting glyph.
- The manifest editor's Follow-ups box leaves a done note out.
- The schema: a follow-up note may carry `done` and the three people fields, and a subtask line the three people fields, with no finding; a `done` that is no flag gives a type finding.
- `docs/HELP.md` lines 282, 285, 294 and 296 and `docs/apps.md` lines 439-442 say the above.

## Changed lines of existing assertions, allow lists and predicates

| File | Line | Before | After |
| --- | --- | --- | --- |
| tests/server/edit/lines.test.ts (from writes.test.ts:325-332) | 146-149 | `writeFollowup(..., '0', 'done')` gives `changed` `['followup']` and the file `followup:\n  - { do: chase the call, after: 2026-12-01 }\n` | `changed` `['done']`, the file contains `- { do: ask Ann again, after: 2026-11-30, done: true }` |
| same | 150-170 | (none) | Reopen gives `['done']`, Reopen again `[]`; supervisors `['ann', 'bob', 'ann']` and lead `['a,b']` give `supervisors: [ann, bob]` and `lead: ["a,b"]`; dropping supervisors; Delete gives `['followup']` and the one note left |
| same | 169-171 | the second `'done'` gives `['followup']` and the file `original` | `'delete'` gives `['followup']` and the file `original` |
| same | 172-182 | (none) | an add `{ do: 'x', done: true, collaborators: ['ann'], snooze }` writes `- { do: x, done: true, collaborators: [ann] }` |
| tests/server/core/changes.test.ts | 363 | `done[0]` matches `{ field: '0', after: null, undo: 'delete' }` | matches `{ kind: 'followup', field: '0', before: { do: 'ask Ann', after: '2026-12-01' }, after: { ..., done: true }, undo: 'field' }` |
| same | 369-380 | (none) | a Delete matches `{ field: '0', before: { ..., done: true }, after: null, undo: 'delete' }` |
| tests/data/snapshot/normalise.test.ts | 99 | note `{ do: 'chase the coauthor', after: '2026-01-01' }` | the same with `done: true, lead: 'someone', supervisors: ['someone']` |
| same | 110-111 | `fig` and `ack` lines without people | `fig` with `lead: 'someone'`, `ack` with `collaborators: ['someone']` |
| same | 314-322 | expected notes without `done` | `done: true, lead: ['someone'], supervisors: ['someone']` on note 0, `done: false` on note 1 |
| same | 326-338 | expected lines without people | `lead: ['someone']` on fig, `collaborators: ['someone']` on ack |
| tests/routes/edit/write-fixture.ts | 473 | `INSIDE_MANIFEST` with one note | a second note `{ do: chase the reply, done: true, lead: [ann], supervisors: [ann] }` (ruling 3) |

New rows (no existing line changed): the two `schema-rules.test.ts` rows, the `lines.test.ts` `it` 'sets and drops the people of a subtask line', and the three `INSIDE_ROWS` rows of `folder-undo.test.ts`.

## Renamed and moved guarded tests

Renamed titles:

- G8 (`guarded.md:72`): `tests/server/edit/writes.test.ts`, describe 'writing the follow-up notes of a manifest', 'adds notes to a list, changes one, takes one out when done, and the list with the last' is now `tests/server/edit/lines.test.ts`, same describe, 'adds notes to a list, changes one, marks one done and open, sets its people, and deletes one and the list with the last'.
- G9 (`guarded.md:75`): `tests/server/core/changes.test.ts`, 'records a follow-up note added, changed and taken out once done' is now 'records a follow-up note added, changed, marked done and deleted'.

New, for the orchestrator to add at landing: G8, `tests/server/edit/lines.test.ts`, 'sets and drops the people of a subtask line'.

Moved, titles unchanged:

- G8 (`guarded.md:72`): `tests/server/edit/writes.test.ts` to `tests/server/edit/lines.test.ts`: describe 'writing one subtask line' (with `LINE_ROWS`) and describe 'writing the follow-up notes of a manifest'. G8's clause "`tests/server/edit/writes.test.ts`, ... 'ticks, reopens, edits and removes a line of a manifest'" names a test of the describe 'writing one subtask line', now in `lines.test.ts`.
- G2 (`guarded.md:12`) and G8 (`guarded.md:72`): `tests/server/edit/deck-acts.test.ts` to `tests/server/edit/deck/deck-acts.test.ts` ('refuses a path outside the roots in every act, and writes nothing', 'changes the files each act names and no other byte, ...', 'copies a dropped image beside the slide ...', 'makes a deck in an existing folder ...'), and `tests/server/edit/deck-edit.test.ts` to `tests/server/edit/deck/deck-edit.test.ts` ('replaces a list in place and keeps every comment around it').
- G9 (`guarded.md:75`): `tests/server/edit/deck-acts.test.ts`, 'puts every file an act changed back, and the files it made go to the Trash' and 'leaves every file as the act left it, and a later undo works once the Trash does', now under `tests/server/edit/deck/`.
- G9 (`guarded.md:75`): `tests/routes/edit/undo/undo.test.ts`, describe 'taking a change back', 'writes the project of a folder of the workspace inside $hub and outside every scan folder in its own file, and takes it back: $name', every row, and 'writes the project of a folder of the workspace in its own file only, and takes it back: $name', are now `tests/routes/edit/undo/folder-undo.test.ts`, describe 'taking back a write to the project of a folder of the workspace', the same titles. G9's clause "describe 'taking a change back', ... every row" no longer takes in these two, which leave that describe.

## Head comments of changed files

Rewritten (the text says what the file now does): `src/lib/data/model/model-entities.ts` (the `LinePeople` and `Followup` doc comments), `src/lib/server/edit/entry-edit/subtasks.ts`, `src/lib/server/edit/writes/subtasks.ts`, `src/lib/server/edit/writes/undo.ts`, `src/lib/state/boards/board/ticker-lines.ts`, `src/lib/state/boards/focus/filter.ts`, `src/lib/state/boards/person.ts`, `src/lib/ui/display/ticker/Ticker.svelte`, `src/lib/ui/display/ticker/ticker-rows.ts`, `src/lib/views/boards/focus/Focus.svelte`, `FocusFilter.svelte`, `Tasks.svelte`, `lanes/LaneCard.svelte`, `rows.ts`, `src/lib/views/shared/card/project/CardLinks.svelte`, `src/lib/views/shared/forms/dated/DatedForm.svelte`, `Followups.svelte`, `LineForm.svelte`, `RecordPick.svelte`, `Subtasks.svelte`, `src/lib/server/edit/entry-edit/render.ts` (the `renderFlowMap` doc comment), `tests/data/snapshot/schema-rules.test.ts`, `tests/routes/edit/undo/undo.test.ts`, `tests/routes/edit/write-fixture.ts`, `tests/server/edit/writes-fixture.ts`, `tests/server/edit/writes.test.ts`.

New: `src/lib/views/shared/forms/dated/PeoplePicks.svelte`, `line-save.ts`, `tests/server/edit/lines.test.ts`, `tests/routes/edit/undo/folder-undo.test.ts`.

Still true, unchanged: `config/catalogs/glyphs.yml`, `config/catalogs/icons.yml`, `config/schemas/manifest-schema.yml`, `config/text/findings.yml`, `config/text/views/boards/focus.yml`, `config/text/views/boards/project.yml`, `src/lib/data/model/index.ts`, `src/lib/data/shapes/shapes.ts` (it names the `followups` and `subtasks` readers), `src/lib/data/snapshot/schema/record.ts`, `src/lib/server/edit/entry-edit/index.ts`, `src/lib/server/edit/writes.ts`, `src/lib/server/edit/writes/bodies.ts`, `src/lib/state/boards/collection/index.ts`, `src/lib/state/boards/ticker.ts`, `src/lib/state/client/writes.svelte.ts`, `src/lib/state/forms/schema.ts`, `src/lib/state/shared/stores/shapes.ts`, `src/lib/views/shared/forms/dated/ListHead.svelte`, `tests/data/snapshot/normalise.test.ts`, `tests/server/core/changes.test.ts`, `tests/server/edit/deck/deck-acts.test.ts`, `tests/server/edit/deck/deck-edit.test.ts`.

## Anything in the brief that was wrong or impossible

- Case 30: `docs/palette.md` is the command palette's page (views, commands, chords), not a list of glyphs, so `npm run docs:palette` writes no `waiting` row and leaves the page unchanged (`git status --short docs/palette.md` prints nothing; a 90). No generated page lists the glyphs (`grep -rln "hourglass\|alarm-clock" docs` prints nothing). The ASCII theme's `(w)` is in `config/catalogs/glyphs.yml` and read back at a 91; the config tests that check the two catalogs against each other ran green in `vitest checks`.
- H4's premise, ruled in round 0 (ruling 4).

## The case-run program, first run

The config, `<scratch>/o93/vitest.cases.mts`:

```ts
// The config the case-run program runs under: the worktree's own Vite config (so `$lib`, Svelte
// runes and the plugins resolve as in the suite), with one node project whose only file is the
// case-run program in this folder.
import base from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O93/vite.config.ts';

const HERE = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o93';

export default (env: { mode: string; command: string }) => {
    const made = (base as unknown as (e: typeof env) => Record<string, any>)(env);
    return {
        ...made,
        test: {
            ...made.test,
            projects: undefined,
            environment: 'node',
            dir: HERE,
            include: ['cases.test.ts'],
            expect: { requireAssertions: false },
            testTimeout: 60000,
            reporters: ['verbose']
        }
    };
};
```

The program, `<scratch>/o93/cases.test.ts`, run from the worktree's root with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npx vitest run --config <scratch>/o93/vitest.cases.mts --configLoader runner`:

```ts
// The case-run program of O93: it prints what each case of the brief gives on the tree it runs
// over and asserts nothing. Every hub it writes is a scratch directory under the system
// temporary directory, made by the suite's own fixtures.
import { it } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { engineDir, glyphCatalog, loadConfig, textCatalog } from '$lib/data/sources/config';
import { portfolioConfigFrom } from '$lib/data/index';
import { setCatalog, setGlyphs } from '$lib/state/shared/words/text';
import {
    followupWrite,
    subtaskWrite,
    writeFollowup,
    writeSubtask,
    writeSubtaskAdd
} from '$lib/server/edit/writes';
import { FOLLOWUP } from '$lib/server/edit/entry-edit/index';
import { followups, subtasks } from '$lib/data/shapes/shapes';
import { entrySubtasks } from '$lib/state/boards/collection/index';
import { mergeHubs } from '$lib/data/snapshot/hubs/merge';
import { hubVocabs } from '$lib/data/index';
import { ticker } from '$lib/state/boards/ticker';
import { focusFilter, focusPage, type FocusFilter } from '$lib/state/boards/focus/filter';
import { actionsFor, act, rowMaker } from '$lib/views/boards/focus/rows';
import { buildOneHub } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O93/tests/fixtures/hubs/hub-build.ts';
import { plantScratch } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O93/tests/fixtures/scratch.ts';
import { configFor, hub, manifestOf } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O93/tests/server/edit/writes-fixture.ts';
import type { Snapshot } from '$lib/data/model/index';
import type { TickerItem } from '$lib/state/boards/ticker';

const LOADED = loadConfig(engineDir()).config;
const CONFIG = portfolioConfigFrom(LOADED);
const TEXT = textCatalog(LOADED);
setCatalog(TEXT);
setGlyphs(glyphCatalog(LOADED));

const out = (label: string, value: unknown): void => {
    console.log(`${label}: ${typeof value === 'string' ? value : JSON.stringify(value)}`);
};

/** A manifest of the writes fixture's shape with the block given after it. */
const BASE = 'id: alpha\ntier: research\nstage: submitted\ntitle: "A title"\n';

/** One write over a scratch hub whose manifest is BASE and `block`, and the file after it. */
function written(block: string, run: (dir: string) => unknown): { answer: unknown; file: string } {
    const dir = hub(BASE + block);
    let answer: unknown;
    try {
        answer = run(dir);
    } catch (error) {
        answer = `threw: ${String(error)}`;
    }
    const strip = (one: unknown): unknown =>
        typeof one === 'object' && one !== null
            ? { ...one, records: undefined, changed: (one as { changed?: unknown }).changed }
            : one;
    return { answer: strip(answer), file: manifestOf(dir).slice(BASE.length) };
}

const config = configFor();
const host = { id: 'alpha' };
type Loose = (...args: unknown[]) => unknown;
const followupLoose = writeFollowup as unknown as Loose;
const subtaskLoose = writeSubtask as unknown as Loose;

it('the writes', () => {
    const one = 'followup:\n  - { do: ask Ann }\n';
    out('case 1', written(one, (dir) => writeFollowup(dir, config, host, '0', 'done')));
    const done = 'followup:\n  - { do: ask Ann, done: true }\n';
    out('case 2', written(done, (dir) => followupLoose(dir, config, host, '0', 'reopen')));
    const two = 'followup:\n  - { do: ask Ann }\n  - { do: ask Bob }\n';
    out('case 3 two', written(two, (dir) => followupLoose(dir, config, host, '0', 'delete')));
    out('case 3 one', written(one, (dir) => followupLoose(dir, config, host, '0', 'delete')));
    out(
        'case 4 set',
        written(one, (dir) => followupLoose(dir, config, host, '0', 'supervisors', ['ann', 'bob']))
    );
    const sub = 'subtasks:\n  - { do: write it, deadline: 2026-12-01 }\n';
    out('case 5', written(sub, (dir) => subtaskLoose(dir, config, host, '0', 'lead', ['ann'])));
    out(
        'case 6',
        written('', (dir) =>
            writeSubtaskAdd(
                dir,
                config,
                host,
                { do: 'x', collaborators: ['ann'], done: true, deadline: '2026-01-01', extra: 'y' },
                FOLLOWUP
            )
        )
    );
    const people = ['a,b'];
    out('case 40', written(one, (dir) => followupLoose(dir, config, host, '0', 'lead', people)));
    out(
        'case 41',
        written(one, (dir) => followupLoose(dir, config, host, '0', 'lead', ['ann', 'ann']))
    );
    out('case 42 followup', written(one, (dir) => followupLoose(dir, config, host, '0', 'reopen')));
    out(
        'case 42 subtask',
        written('subtasks:\n  - { do: write it }\n', (dir) =>
            writeSubtask(dir, config, host, '0', 'reopen')
        )
    );
    const shifted = 'followup:\n  - { do: ask Bob }\n';
    out('case 46 followup gone', written(shifted, (dir) => followupLoose(dir, config, host, '1', 'delete')));
    out(
        'case 46 subtask gone',
        written('subtasks:\n  - { do: ask Bob }\n', (dir) => writeSubtask(dir, config, host, '1', 'delete'))
    );
    out(
        'case 46 subtask shifted',
        written('subtasks:\n  - { do: ask Bob }\n  - { do: ask Cy }\n', (dir) =>
            writeSubtask(dir, config, host, '0', 'delete')
        )
    );
    out(
        'case 46 followup shifted',
        written('followup:\n  - { do: ask Bob }\n  - { do: ask Cy }\n', (dir) =>
            followupLoose(dir, config, host, '0', 'delete')
        )
    );
    const dirA = hub(BASE + one);
    out('case 8 done records', writeFollowup(dirA, config, host, '0', 'done').records);
    const dirB = hub(BASE + one);
    out('case 8 delete records', (followupLoose(dirB, config, host, '0', 'delete') as { records?: unknown }).records);
});

it('the request bodies', () => {
    const target = { id: 'alpha' };
    for (const value of ['ann', 3, ['ann', 4], [''], ['ann']]) {
        for (const kind of ['subtask', 'followup'] as const) {
            const body = { kind, target, key: '0', action: 'lead', value };
            const read = kind === 'subtask' ? subtaskWrite(body) : followupWrite(body);
            out(`case 7 ${kind} lead ${JSON.stringify(value)}`, read);
        }
    }
});

it('the readers', () => {
    out(
        'case 10',
        followups([{ do: 'a', done: true, lead: 'ann', supervisors: ['bob'] }, { do: 'b', done: 'yes' }])
    );
    out('case 11 subtasks', subtasks([{ do: 'a', collaborators: ['ann'] }]));
    out('case 11 entrySubtasks', entrySubtasks({ fields: { subtasks: [{ do: 'a', collaborators: ['ann'] }] } }));
    const odd = [{ do: 3 }, { do: ['x', 'y'] }, { do: 'z', deadline: 20261201 }];
    out('case 11 readers apart, subtasks', subtasks(odd));
    out('case 11 readers apart, entrySubtasks', entrySubtasks({ fields: { subtasks: odd } }));
});

/** The schema of a registry file keyed by `key` and titled by `name` or `title`. */
const KEYED =
    'schema:\n  - { field: key, type: text, primary_key: true }\n  - { field: name, type: text, display: 1 }\n  - { field: title, type: text, display: 2 }\n';

/** The people, pillars and records every Focus case reads, planted in one scratch hub. */
function plantHub(prefix: string, pillar: string, extra: Record<string, string> = {}): string {
    const manifest = (id: string, rest: string): string =>
        `id: ${id}\ntier: research\nstage: submitted\ntitle: ${id}\n${rest}`;
    return plantScratch(
        prefix,
        {
            '.oculus/data/people/people.yml': `${KEYED}entries:\n  - { key: ann, name: Ann Arbor }\n  - { key: bob, name: Bob Bell }\n`,
            '.oculus/data/pillars/pillars.yml': `${KEYED}entries:\n  - { key: ${pillar}, title: Pillar ${pillar} }\n  - { key: b, title: Pillar b }\n`,
            'projects/active/pann/project.yml': manifest(
                'pann',
                'lead: [ann]\npillars: [a]\nsubtasks:\n  - { do: theirs, lead: [bob] }\n  - { do: plain }\nfollowup:\n  - { do: sup, supervisors: [ann] }\n  - { do: led, lead: [ann] }\n  - { do: closed, done: true }\n'
            ),
            'projects/active/pbob/project.yml': manifest(
                'pbob',
                'lead: [bob]\npillars: [a, b]\nsubtasks:\n  - { do: mine, lead: [ann], collaborators: [bob] }\n  - { do: ghost, lead: [zed] }\n'
            ),
            'projects/active/pnone/project.yml': manifest('pnone', 'subtasks:\n  - { do: free }\n'),
            '.oculus/data/academic/tasks.yml': `schema:\n  - { field: key, type: text, primary_key: true }\n  - { field: title, type: text, display: 1 }\n  - { field: status, type: select, options: [todo, doing, done] }\nentries:\n  - { key: t1, title: A task, status: todo, subtasks: [{ do: sub of task, collaborators: [ann] }] }\n`,
            '.oculus/data/academic/events.yml':
                'schema:\n  - { field: title, type: text, display: 1, primary_key: true }\n  - { field: pillars, type: tags }\n  - { field: date, type: date }\nentries:\n  - { title: A talk, pillars: [a], subtasks: [{ do: slides }] }\n',
            ...extra
        },
        ['projects/active']
    );
}

const FILES = new Proxy({}, { get: () => '' }) as Record<string, string>;

function snapshotOf(hubs: { key: string; dir: string }[]): Snapshot {
    const parts = hubs.map((one) => ({
        key: one.key,
        files: FILES as never,
        snapshot: buildOneHub(one.dir, CONFIG, 0, [], undefined, null, one.key).snapshot
    }));
    return mergeHubs(parts, TEXT as never, 0);
}

const NOW = Date.parse('2026-10-27T12:00:00Z');
const LISTS = hubVocabs({ primary: null, folders: [], own: LOADED }, null, []);
const wordsOf = (() => LOADED) as never;

function brief(line: TickerItem): unknown {
    return { label: line.label, target: line.target, root: line.root };
}

it('the ticker and the Focus filter', () => {
    const snapshot = snapshotOf([{ key: 'lab', dir: plantHub('oculus-o93-', 'a') }]);
    out('ids', {
        projects: Object.keys(snapshot.entities.projects),
        people: Object.keys(snapshot.entities.people),
        pillars: Object.keys(snapshot.entities.pillars),
        pillarIds: Object.values(snapshot.entities.projects).map((one) => [one.id, one.pillarIds])
    });
    const week = ticker(snapshot, LOADED, NOW, wordsOf, LISTS);
    out('case 13 tasks', week.tasks.map(brief));
    out('case 11 ticker entry lines', week.tasks.filter((one) => one.target?.kind === 'entry').map((one) => ({ ...brief(one), item: one })));
    const self = new Set(Object.keys(snapshot.entities.people).filter((id) => id.endsWith('ann')));
    const scope = { self, hubs: [], wordsOf, lists: LISTS };
    const page = (filter: Partial<FocusFilter> & Record<string, unknown>) => {
        const made = focusPage(snapshot, LOADED, NOW, focusFilter({ filter }), scope);
        return {
            tasks: made.sections.week.tasks.map((one) => one.label),
            lanes: Object.values(made.sections.lanes).flat().map((one) => one.id),
            hidden: made.hidden.tasks,
            hides: made.hides,
            mineHides: made.mineHides
        };
    };
    out('case 17/19 mine', page({ mine: true }));
    out('case 17/19 all', page({ mine: false }));
    out('case 18 supervisor unticked', page({ mine: false, roles: ['supervisor'] }));
    out('case 20 tier unticked', page({ mine: false, tiers: ['research'] }));
    out('case 22/26 pillar a unticked', page({ mine: false, pillars: ['lab:a'] }));
    out('case 24 every pillar unticked', page({ mine: false, pillars: ['lab:a', 'lab:b'] }));
    out('case 27 read', [focusFilter({}), focusFilter({ filter: { pillars: 'a' } }), focusFilter({ filter: { pillars: ['a'] } })]);
    const rows = rowMaker('t');
    const follow = week.tasks.find((one) => one.kind === 'followup');
    const sub = week.tasks.find((one) => one.target?.subtask !== undefined);
    const task = week.tasks.find((one) => one.target?.task === true);
    out('case 14 followup actions', follow === undefined ? null : actionsFor(follow)?.map((one) => one.id));
    out('case 15 task actions', task === undefined ? null : actionsFor(task)?.map((one) => one.id));
    out('case 16 subtask actions', sub === undefined ? null : actionsFor(sub)?.map((one) => one.id));
    const pressed: unknown[] = [];
    const record = (...args: unknown[]) => {
        pressed.push(args);
        return Promise.resolve({ ok: true, changed: [], refused: [] });
    };
    const writes = { writeFollowup: record, writeSubtask: record, writeEntry: record, writeManifest: record };
    const client = { writes: writes as never, terminals: { composeAt: () => Promise.resolve('') } };
    void act(client, follow, 'done', NOW);
    void act(client, follow, 'remove', NOW);
    void act(client, task, 'remove', NOW);
    out('case 14/15 writes sent', pressed);
    const named = week.tasks.find((one) => one.label.includes('mine'));
    out('case 29 row', named === undefined ? null : rows.row(named, ''));
    const blocked = rowMaker('t', () => 'the file has unsaved text');
    out('case 44 task row', task === undefined ? null : blocked.row(task, '').actions);
});

it('two hubs', () => {
    const snapshot = snapshotOf([
        { key: 'lab', dir: plantHub('oculus-o93-lab-', 'a') },
        { key: 'home', dir: plantHub('oculus-o93-home-', 'a') }
    ]);
    const scope = { self: new Set<string>(), hubs: ['lab', 'home'], wordsOf, lists: LISTS };
    const made = focusPage(snapshot, LOADED, NOW, focusFilter({ filter: { mine: false, pillars: ['lab:a'] } }), scope);
    out('case 43', {
        lanes: Object.values(made.sections.lanes).flat().map((one) => one.id),
        tasks: made.sections.week.tasks.map((one) => `${one.root}:${one.label}`)
    });
});

it('the hub schema', () => {
    for (const note of ['{ do: a, done: true, lead: [ann] }', '{ do: a, done: maybe }']) {
        const dir = plantScratch(
            'oculus-o93-schema-',
            { 'projects/active/alpha/project.yml': `id: alpha\ntier: research\nstage: exploring\ntitle: Alpha\nfollowup:\n  - ${note}\n` },
            ['projects/active']
        );
        const found = buildOneHub(dir, CONFIG).snapshot.findings
            .filter((one) => one.file.endsWith('project.yml'))
            .map((one) => [one.key, one.line, one.message]);
        out(`case 12 ${note}`, found);
    }
});

it('the glyph', () => {
    const palette = readFileSync('/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O93/docs/palette.md', 'utf8');
    out('case 30 palette waiting rows', palette.split('\n').filter((one) => /waiting|\(w\)/.test(one)));
    void writeFileSync;
    void join;
});
```

Its output, whole (the vitest pass mark written `<check mark>`; `<scratch>` stands for the scratchpad path above):

```
1	
2	 RUN  v4.1.11 /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O93
3	
4	stdout | ../../../../../../..<scratch>/o93/cases.test.ts > the writes
5	case 1: {"answer":{"found":true,"changed":["followup"],"refused":[]},"file":""}
6	case 2: {"answer":{"found":true,"changed":[],"refused":[]},"file":"followup:\n  - { do: ask Ann, done: true }\n"}
7	case 3 two: {"answer":{"found":true,"changed":[],"refused":[]},"file":"followup:\n  - { do: ask Ann }\n  - { do: ask Bob }\n"}
8	case 3 one: {"answer":{"found":true,"changed":[],"refused":[]},"file":"followup:\n  - { do: ask Ann }\n"}
9	case 4 set: {"answer":"threw: TypeError: value?.trim is not a function","file":"followup:\n  - { do: ask Ann }\n"}
10	case 5: {"answer":{"found":true,"changed":[],"refused":[]},"file":"subtasks:\n  - { do: write it, deadline: 2026-12-01 }\n"}
11	case 6: {"answer":{"found":true,"changed":["followup"],"refused":[]},"file":"followup:\n  - { do: x }\n"}
12	case 40: {"answer":"threw: TypeError: value?.trim is not a function","file":"followup:\n  - { do: ask Ann }\n"}
13	case 41: {"answer":"threw: TypeError: value?.trim is not a function","file":"followup:\n  - { do: ask Ann }\n"}
14	case 42 followup: {"answer":{"found":true,"changed":[],"refused":[]},"file":"followup:\n  - { do: ask Ann }\n"}
15	case 42 subtask: {"answer":{"found":true,"changed":[],"refused":[]},"file":"subtasks:\n  - { do: write it }\n"}
16	case 46 followup gone: {"answer":{"found":true,"changed":[],"refused":[{"field":"delete","reason":"there is no follow-up note 1"}]},"file":"followup:\n  - { do: ask Bob }\n"}
17	case 46 subtask gone: {"answer":{"found":true,"changed":[],"refused":[{"field":"subtasks","reason":"there is no subtask 1"}]},"file":"subtasks:\n  - { do: ask Bob }\n"}
18	case 46 subtask shifted: {"answer":{"found":true,"changed":["subtasks"],"refused":[]},"file":"subtasks:\n  - { do: ask Cy }\n"}
19	case 46 followup shifted: {"answer":{"found":true,"changed":[],"refused":[]},"file":"followup:\n  - { do: ask Bob }\n  - { do: ask Cy }\n"}
20	case 8 done records: [{"file":"/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-writes-NrgHWW/projects/manuscripts/alpha/project.yml","key":"alpha","field":"0","before":{"do":"ask Ann"},"after":null,"undo":"delete"}]
21	case 8 delete records: []
22	
23	stdout | ../../../../../../..<scratch>/o93/cases.test.ts > the request bodies
24	case 7 subtask lead "ann": null
25	case 7 followup lead "ann": null
26	case 7 subtask lead 3: null
27	case 7 followup lead 3: null
28	case 7 subtask lead ["ann",4]: null
29	case 7 followup lead ["ann",4]: null
30	case 7 subtask lead [""]: null
31	case 7 followup lead [""]: null
32	case 7 subtask lead ["ann"]: null
33	case 7 followup lead ["ann"]: null
34	
35	stdout | ../../../../../../..<scratch>/o93/cases.test.ts > the readers
36	case 10: [{"key":"0","do":"a"},{"key":"1","do":"b"}]
37	case 11 subtasks: [{"key":"0","do":"a","done":false}]
38	case 11 entrySubtasks: [{"key":"0","do":"a","done":false}]
39	case 11 readers apart, subtasks: [{"key":"2","do":"z","done":false}]
40	case 11 readers apart, entrySubtasks: [{"key":"0","do":"3","done":false},{"key":"1","do":"x | y","done":false},{"key":"2","do":"z","done":false,"deadline":"20261201"}]
41	
42	stdout | ../../../../../../..<scratch>/o93/cases.test.ts > the ticker and the Focus filter
43	ids: {"projects":["lab:pann","lab:pbob","lab:pnone"],"people":["lab:ann","lab:bob"],"pillars":["lab:a","lab:b"],"pillarIds":[["lab:pann",["lab:a"]],["lab:pbob",["lab:a","lab:b"]],["lab:pnone",[]]]}
44	case 13 tasks: [{"label":"pann - sup","target":{"kind":"followup","id":"lab:pann","note":"0"},"root":"lab"},{"label":"pann - led","target":{"kind":"followup","id":"lab:pann","note":"1"},"root":"lab"},{"label":"pann - closed","target":{"kind":"followup","id":"lab:pann","note":"2"},"root":"lab"},{"label":"pann: theirs","target":{"kind":"manifest","id":"lab:pann","subtask":"0"},"root":"lab"},{"label":"pann: plain","target":{"kind":"manifest","id":"lab:pann","subtask":"1"},"root":"lab"},{"label":"pbob: mine","target":{"kind":"manifest","id":"lab:pbob","subtask":"0"},"root":"lab"},{"label":"pbob: ghost","target":{"kind":"manifest","id":"lab:pbob","subtask":"1"},"root":"lab"},{"label":"pnone: free","target":{"kind":"manifest","id":"lab:pnone","subtask":"0"},"root":"lab"},{"label":"A talk: slides","target":{"kind":"entry","id":"lab:A talk","collection":"events","subtask":"0"},"root":"lab"},{"label":"A task: sub of task","target":{"kind":"entry","id":"lab:t1","collection":"tasks","subtask":"0"},"root":"lab"},{"label":"A task","target":{"kind":"entry","id":"lab:t1","collection":"tasks","statuses":["todo","doing","done"],"task":true},"root":"lab"}]
45	case 11 ticker entry lines: [{"label":"A talk: slides","target":{"kind":"entry","id":"lab:A talk","collection":"events","subtask":"0"},"root":"lab","item":{"kind":"","glyph":"pin","label":"A talk: slides","days":null,"snoozed":false,"entry":"events","root":"lab","subtaskDo":"slides","target":{"kind":"entry","id":"lab:A talk","collection":"events","subtask":"0"}}},{"label":"A task: sub of task","target":{"kind":"entry","id":"lab:t1","collection":"tasks","subtask":"0"},"root":"lab","item":{"kind":"","glyph":"pin","label":"A task: sub of task","days":null,"snoozed":false,"entry":"tasks","root":"lab","subtaskDo":"sub of task","target":{"kind":"entry","id":"lab:t1","collection":"tasks","subtask":"0"}}},{"label":"A task","target":{"kind":"entry","id":"lab:t1","collection":"tasks","statuses":["todo","doing","done"],"task":true},"root":"lab","item":{"kind":"task","glyph":"tasks","label":"A task","days":null,"snoozed":false,"entry":"tasks","status":"todo","root":"lab","target":{"kind":"entry","id":"lab:t1","collection":"tasks","statuses":["todo","doing","done"],"task":true}}}]
46	case 17/19 mine: {"tasks":["pann - sup","pann - led","pann - closed","pann: theirs","pann: plain","pnone: free","A talk: slides","A task: sub of task","A task"],"lanes":["lab:pann","lab:pnone"],"hidden":2,"hides":true,"mineHides":true}
47	case 17/19 all: {"tasks":["pann - sup","pann - led","pann - closed","pann: theirs","pann: plain","pbob: mine","pbob: ghost","pnone: free","A talk: slides","A task: sub of task","A task"],"lanes":["lab:pann","lab:pbob","lab:pnone"],"hidden":0,"hides":false,"mineHides":true}
48	case 18 supervisor unticked: {"tasks":["pann - sup","pann - led","pann - closed","pann: theirs","pann: plain","pbob: mine","pbob: ghost","pnone: free","A talk: slides","A task: sub of task","A task"],"lanes":["lab:pann","lab:pbob","lab:pnone"],"hidden":0,"hides":false,"mineHides":true}
49	case 20 tier unticked: {"tasks":["A talk: slides","A task: sub of task","A task"],"lanes":[],"hidden":8,"hides":true,"mineHides":true}
50	case 22/26 pillar a unticked: {"tasks":["pann - sup","pann - led","pann - closed","pann: theirs","pann: plain","pbob: mine","pbob: ghost","pnone: free","A talk: slides","A task: sub of task","A task"],"lanes":["lab:pann","lab:pbob","lab:pnone"],"hidden":0,"hides":false,"mineHides":true}
51	case 24 every pillar unticked: {"tasks":["pann - sup","pann - led","pann - closed","pann: theirs","pann: plain","pbob: mine","pbob: ghost","pnone: free","A talk: slides","A task: sub of task","A task"],"lanes":["lab:pann","lab:pbob","lab:pnone"],"hidden":0,"hides":false,"mineHides":true}
52	case 27 read: [{"mine":true,"roles":[],"tiers":[],"hubs":[]},{"mine":true,"roles":[],"tiers":[],"hubs":[]},{"mine":true,"roles":[],"tiers":[],"hubs":[]}]
53	case 14 followup actions: ["done"]
54	case 15 task actions: ["status:doing","status:done","agent","snooze:7","snooze:30","snooze:hide"]
55	case 16 subtask actions: ["done","agent","snooze:7","snooze:30","snooze:hide","del"]
56	case 14/15 writes sent: [[{"id":"lab:pann"},"0","done"],["tasks","lab:t1",{"snooze":"true"}]]
57	case 29 row: {"id":"tmanifest::lab%3Apbob:0","glyph":"pin","label":"pbob: mine","tail":"","mark":"lab","actions":[{"id":"done","label":"done","title":"mark done"},{"id":"agent","label":"agent","title":"open the composer seeded with this task, in its folder"},{"id":"snooze:7","label":"1w","title":"snooze 1w"},{"id":"snooze:30","label":"1mo","title":"snooze 1mo"},{"id":"snooze:hide","label":"hide","title":"snooze hide"},{"id":"del","label":"del","title":"delete subtask"}],"plain":false}
58	case 44 task row: [{"id":"status:doing","label":"doing","title":"the file has unsaved text","disabled":true},{"id":"status:done","label":"done","title":"the file has unsaved text","disabled":true},{"id":"agent","label":"agent","title":"open the composer seeded with this task, in its folder"},{"id":"snooze:7","label":"1w","title":"the file has unsaved text","disabled":true},{"id":"snooze:30","label":"1mo","title":"the file has unsaved text","disabled":true},{"id":"snooze:hide","label":"hide","title":"the file has unsaved text","disabled":true}]
59	
60	 <check mark> ../../../../../../..<scratch>/o93/cases.test.ts > the writes 92ms
61	 <check mark> ../../../../../../..<scratch>/o93/cases.test.ts > the request bodies 1ms
62	 <check mark> ../../../../../../..<scratch>/o93/cases.test.ts > the readers 1ms
63	 <check mark> ../../../../../../..<scratch>/o93/cases.test.ts > the ticker and the Focus filter 91ms
64	stdout | ../../../../../../..<scratch>/o93/cases.test.ts > two hubs
65	case 43: {"lanes":["home:pann","lab:pann","home:pbob","lab:pbob","home:pnone","lab:pnone"],"tasks":["home:pann - sup","home:pann - led","home:pann - closed","lab:pann - sup","lab:pann - led","lab:pann - closed","home:pann: theirs","home:pann: plain","home:pbob: mine","home:pbob: ghost","home:pnone: free","lab:pann: theirs","lab:pann: plain","lab:pbob: mine","lab:pbob: ghost","lab:pnone: free","home:A talk: slides","home:A task: sub of task","lab:A talk: slides","lab:A task: sub of task","home:A task","lab:A task"]}
66	
67	 <check mark> ../../../../../../..<scratch>/o93/cases.test.ts > two hubs 290ms
68	stdout | ../../../../../../..<scratch>/o93/cases.test.ts > the hub schema
69	case 12 { do: a, done: true, lead: [ann] }: [["followup[0].done",6,"key followup[0].done is not declared by the schema of this file"],["followup[0].lead",6,"key followup[0].lead is not declared by the schema of this file"]]
70	case 12 { do: a, done: maybe }: [["followup[0].done",6,"key followup[0].done is not declared by the schema of this file"]]
71	
72	stdout | ../../../../../../..<scratch>/o93/cases.test.ts > the glyph
73	case 30 palette waiting rows: []
74	
75	 <check mark> ../../../../../../..<scratch>/o93/cases.test.ts > the hub schema 46ms
76	 <check mark> ../../../../../../..<scratch>/o93/cases.test.ts > the glyph 1ms
77	
78	 Test Files  1 passed (1)
79	      Tests  7 passed (7)
80	   Start at  04:15:57
81	   Duration  4.28s (transform 1.23s, setup 0ms, import 3.66s, tests 521ms, environment 0ms)
82	
```

## The case-run programs, round 0 and last run

One config ran both round-0 programs, on the tree `O93_TREE` names and the file `O93_FILE` names, `<scratch>/o93/vitest.cases.mts`:

```ts
// The config the case-run programs run under: the Vite config of the tree named by O93_TREE (so
// `$lib`, Svelte runes and the plugins resolve as in that tree's suite), with one node project
// whose only file is the program named by O93_FILE in this folder, and `@tree` naming that tree's
// root for the test fixtures.
const HERE = '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o93';
const TREE = process.env.O93_TREE ?? '';
const FILE = process.env.O93_FILE ?? '';
const base = (await import(/* @vite-ignore */ `${TREE}/vite.config.ts`)).default;

export default (env: { mode: string; command: string }) => {
    const made = (base as unknown as (e: typeof env) => Record<string, any>)(env);
    return {
        ...made,
        resolve: { ...made.resolve, alias: [{ find: '@tree', replacement: TREE }] },
        test: {
            ...made.test,
            projects: undefined,
            environment: 'node',
            dir: HERE,
            include: [FILE],
            expect: { requireAssertions: false },
            testTimeout: 60000,
            reporters: ['verbose']
        }
    };
};
```

### Cases 47 and 48, on both trees

`<scratch>/o93/both.test.ts`, run on the base copy with `cd <scratch>/o93/base && O93_TREE=<scratch>/o93/base O93_FILE=both.test.ts npx vitest run --config <scratch>/o93/vitest.cases.mts --configLoader runner`, and on the worktree from its root with `O93_TREE=$PWD`:

```ts
// The case-run program of O93 for cases 47 and 48 and the undo of a delete of a line before
// another, run on the unchanged tree and on the worktree: it prints what each gives on the tree
// `@tree` names and asserts nothing. Every hub it writes is a scratch directory under the system
// temporary directory, made by that tree's own fixtures.
import { it } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { engineDir, glyphCatalog, loadConfig, textCatalog } from '$lib/data/sources/config';
import { hubVocabs, portfolioConfigFrom } from '$lib/data/index';
import { setCatalog, setGlyphs } from '$lib/state/shared/words/text';
import { mergeHubs } from '$lib/data/snapshot/hubs/merge';
import { ticker } from '$lib/state/boards/ticker';
import * as rows from '$lib/views/boards/focus/rows';
import { entryDated } from '$lib/views/shared/forms/entry/entry-actions';
import { handleWrite } from '$lib/server/edit/writes';
import { buildOneHub } from '@tree/tests/fixtures/hubs/hub-build.ts';
import { plantScratch } from '@tree/tests/fixtures/scratch.ts';
import {
    changesOf,
    insideHubTarget,
    REPOSITORY_ID,
    request,
    TOKEN,
    undone
} from '@tree/tests/routes/edit/write-fixture.ts';

const LOADED = loadConfig(engineDir()).config;
const CONFIG = portfolioConfigFrom(LOADED);
const TEXT = textCatalog(LOADED);
setCatalog(TEXT);
setGlyphs(glyphCatalog(LOADED));

const out = (label: string, value: unknown): void => {
    console.log(`${label}: ${typeof value === 'string' ? value : JSON.stringify(value)}`);
};

const NOW = Date.parse('2026-10-27T12:00:00Z');
const LISTS = hubVocabs({ primary: null, folders: [], own: LOADED }, null, []);
const wordsOf = (() => LOADED) as never;
const FILES = new Proxy({}, { get: () => '' }) as Record<string, string>;

/** One scratch hub with an event whose subtasks hold a number, a list and a text, and a task. */
function snapshotOf() {
    const dir = plantScratch(
        'oculus-o93-both-',
        {
            '.oculus/data/academic/events.yml':
                'schema:\n  - { field: title, type: text, display: 1, primary_key: true }\n  - { field: date, type: date }\nentries:\n  - { title: A talk, subtasks: [{ do: 3 }, { do: [x, y] }, { do: z, deadline: 20261201 }] }\n',
            '.oculus/data/academic/tasks.yml':
                'schema:\n  - { field: key, type: text, primary_key: true }\n  - { field: title, type: text, display: 1 }\n  - { field: status, type: select, options: [todo, doing, done] }\nentries:\n  - { key: t1, title: A task, status: todo }\n'
        },
        ['projects/active']
    );
    const snapshot = buildOneHub(dir, CONFIG, 0, [], undefined, null, 'lab').snapshot;
    return mergeHubs([{ key: 'lab', files: FILES as never, snapshot }], TEXT as never, 0);
}

it('case 47: the lines of an entry whose subtasks hold a number and a list', () => {
    const snapshot = snapshotOf();
    const events = Object.values(snapshot.entities.collections).find((one) =>
        one.id.endsWith('events')
    );
    const entry = events?.entries[0];
    const client = { writes: {} } as never;
    const card =
        entry === undefined ? null : entryDated(client, 'events', entry, events?.schema, '', true);
    out('case 47 entry card lines', card?.subtasks ?? null);
    const week = ticker(snapshot, LOADED, NOW, wordsOf, LISTS);
    const maker = rows.rowMaker('t');
    const lines = [...week.overdue, ...week.deadlines, ...week.tasks, ...week.snoozed];
    out(
        'case 47 Focus rows of the entry',
        lines.filter((one) => one.label.startsWith('A talk')).map((one) => maker.row(one, '').label)
    );
});

it('case 48: a Remove press on a task line, before the question is answered', async () => {
    const snapshot = snapshotOf();
    const week = ticker(snapshot, LOADED, NOW, wordsOf, LISTS);
    const task = week.tasks.find((one) => one.target?.task === true);
    const pressed: unknown[] = [];
    const record =
        (name: string) =>
        (...args: unknown[]) => {
            pressed.push([name, ...args]);
            return Promise.resolve({ ok: true, changed: [], refused: [] });
        };
    const writes = {
        writeFollowup: record('writeFollowup'),
        writeSubtask: record('writeSubtask'),
        writeEntry: record('writeEntry'),
        writeManifest: record('writeManifest'),
        removeEntry: record('removeEntry')
    };
    const client = { writes: writes as never, terminals: { composeAt: () => Promise.resolve('') } };
    out('case 48 line', task?.label ?? null);
    out('case 48 removeAsked', 'removeAsked' in rows ? rows.removeAsked(task, 'remove') : 'no such export');
    await rows.act(client as never, task as never, 'remove', NOW);
    out('case 48 write calls', pressed);
});

/** A manifest of the inside-hub folder with two subtask lines and two follow-up notes. */
const TWO = [
    'tier: personal',
    'stage: building',
    'title: "A repository"',
    'subtasks:',
    '  - { do: read it, lead: [ann] }',
    '  - { do: test it }',
    'followup:',
    '  - { do: ask about the tool, supervisors: [ann] }',
    '  - { do: chase the reply }',
    ''
].join('\n');

it('the undo of a write that takes out a line before another', async () => {
    const bodies = [
        { kind: 'subtask', key: '0', action: 'delete' },
        { kind: 'followup', key: '0', action: 'delete' },
        { kind: 'followup', key: '0', action: 'done' }
    ];
    for (const body of bodies) {
        const { into, file } = insideHubTarget();
        writeFileSync(file, TWO);
        const sent = { ...body, target: { id: `hub:${REPOSITORY_ID}` } };
        const label = `${body.kind} ${body.action} 0`;
        const status = (await handleWrite(request(sent), TOKEN, into)).status;
        const written = readFileSync(file, 'utf8');
        if (status !== 200) {
            out(`undo, ${label}`, { status, file: written === TWO ? 'unchanged' : written });
            continue;
        }
        const [change] = changesOf(into);
        const back = await undone(into, change);
        const after = readFileSync(file, 'utf8');
        out(`undo, ${label}`, {
            status,
            written,
            record: { field: change.field, before: change.before, after: change.after, undo: change.undo },
            undoStatus: back.status,
            asBefore: after === TWO,
            after
        });
    }
});
```

The base run's output, whole ("b N"; `<scratch>` as above, the pass mark written `<check mark>`):

```
1	
2	 RUN  v4.1.11 <scratch>/o93/base
3	
4	stdout | ../both.test.ts > case 47: the lines of an entry whose subtasks hold a number and a list
5	case 47 entry card lines: [{"key":"0","do":"3","done":false},{"key":"1","do":"x | y","done":false},{"key":"2","do":"z","done":false,"deadline":"20261201"}]
6	case 47 Focus rows of the entry: ["A talk: z"]
7	
8	stdout | ../both.test.ts > case 48: a Remove press on a task line, before the question is answered
9	case 48 line: A task
10	case 48 removeAsked: no such export
11	
12	stdout | ../both.test.ts > case 48: a Remove press on a task line, before the question is answered
13	case 48 write calls: [["writeEntry","tasks","lab:t1",{"snooze":"true"}]]
14	
15	 <check mark> ../both.test.ts > case 47: the lines of an entry whose subtasks hold a number and a list 98ms
16	 <check mark> ../both.test.ts > case 48: a Remove press on a task line, before the question is answered 36ms
17	stdout | ../both.test.ts > the undo of a write that takes out a line before another
18	undo, subtask delete 0: {"status":200,"written":"tier: personal\nstage: building\ntitle: \"A repository\"\nsubtasks:\n  - { do: test it }\nfollowup:\n  - { do: ask about the tool, supervisors: [ann] }\n  - { do: chase the reply }\n","record":{"field":"0","before":{"do":"read it","lead":["ann"]},"after":{"do":"test it"},"undo":"field"},"undoStatus":200,"asBefore":false,"after":"tier: personal\nstage: building\ntitle: \"A repository\"\nsubtasks:\n  - { do: read it, lead: [\"ann\"] }\nfollowup:\n  - { do: ask about the tool, supervisors: [ann] }\n  - { do: chase the reply }\n"}
19	
20	stdout | ../both.test.ts > the undo of a write that takes out a line before another
21	undo, followup delete 0: {"status":400,"file":"unchanged"}
22	
23	stdout | ../both.test.ts > the undo of a write that takes out a line before another
24	undo, followup done 0: {"status":200,"written":"tier: personal\nstage: building\ntitle: \"A repository\"\nsubtasks:\n  - { do: read it, lead: [ann] }\n  - { do: test it }\nfollowup:\n  - { do: chase the reply }\n","record":{"field":"0","before":{"do":"ask about the tool","supervisors":["ann"]},"after":{"do":"chase the reply"},"undo":"field"},"undoStatus":200,"asBefore":false,"after":"tier: personal\nstage: building\ntitle: \"A repository\"\nsubtasks:\n  - { do: read it, lead: [ann] }\n  - { do: test it }\nfollowup:\n  - { do: ask about the tool, supervisors: [\"ann\"] }\n"}
25	
26	 <check mark> ../both.test.ts > the undo of a write that takes out a line before another 1657ms
27	
28	 Test Files  1 passed (1)
29	      Tests  3 passed (3)
30	   Start at  05:43:49
31	   Duration  6.88s (transform 1.97s, setup 0ms, import 4.98s, tests 1.79s, environment 0ms)
32	
```

The worktree run's output, whole ("w N"):

```
1	
2	 RUN  v4.1.11 /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O93
3	
4	stdout | <scratch>/o93/both.test.ts > case 47: the lines of an entry whose subtasks hold a number and a list
5	case 47 entry card lines: [{"key":"2","do":"z","done":false}]
6	case 47 Focus rows of the entry: ["A talk: z"]
7	
8	 <check mark> <scratch>/o93/both.test.ts > case 47: the lines of an entry whose subtasks hold a number and a list 300ms
9	stdout | <scratch>/o93/both.test.ts > case 48: a Remove press on a task line, before the question is answered
10	case 48 line: A task
11	case 48 removeAsked: {"collection":"tasks","id":"lab:t1"}
12	
13	stdout | <scratch>/o93/both.test.ts > case 48: a Remove press on a task line, before the question is answered
14	case 48 write calls: []
15	
16	stdout | <scratch>/o93/both.test.ts > the undo of a write that takes out a line before another
17	undo, subtask delete 0: {"status":200,"written":"tier: personal\nstage: building\ntitle: \"A repository\"\nsubtasks:\n  - { do: test it }\nfollowup:\n  - { do: ask about the tool, supervisors: [ann] }\n  - { do: chase the reply }\n","record":{"field":"0","before":{"do":"read it","lead":["ann"]},"after":{"do":"test it"},"undo":"delete"},"undoStatus":200,"asBefore":true,"after":"tier: personal\nstage: building\ntitle: \"A repository\"\nsubtasks:\n  - { do: read it, lead: [ann] }\n  - { do: test it }\nfollowup:\n  - { do: ask about the tool, supervisors: [ann] }\n  - { do: chase the reply }\n"}
18	
19	stdout | <scratch>/o93/both.test.ts > the undo of a write that takes out a line before another
20	undo, followup delete 0: {"status":200,"written":"tier: personal\nstage: building\ntitle: \"A repository\"\nsubtasks:\n  - { do: read it, lead: [ann] }\n  - { do: test it }\nfollowup:\n  - { do: chase the reply }\n","record":{"field":"0","before":{"do":"ask about the tool","supervisors":["ann"]},"after":{"do":"chase the reply"},"undo":"delete"},"undoStatus":200,"asBefore":true,"after":"tier: personal\nstage: building\ntitle: \"A repository\"\nsubtasks:\n  - { do: read it, lead: [ann] }\n  - { do: test it }\nfollowup:\n  - { do: ask about the tool, supervisors: [ann] }\n  - { do: chase the reply }\n"}
21	
22	stdout | <scratch>/o93/both.test.ts > the undo of a write that takes out a line before another
23	undo, followup done 0: {"status":200,"written":"tier: personal\nstage: building\ntitle: \"A repository\"\nsubtasks:\n  - { do: read it, lead: [ann] }\n  - { do: test it }\nfollowup:\n  - { do: ask about the tool, supervisors: [ann], done: true }\n  - { do: chase the reply }\n","record":{"field":"0","before":{"do":"ask about the tool","supervisors":["ann"]},"after":{"do":"ask about the tool","supervisors":["ann"],"done":true},"undo":"field"},"undoStatus":200,"asBefore":true,"after":"tier: personal\nstage: building\ntitle: \"A repository\"\nsubtasks:\n  - { do: read it, lead: [ann] }\n  - { do: test it }\nfollowup:\n  - { do: ask about the tool, supervisors: [ann] }\n  - { do: chase the reply }\n"}
24	
25	 <check mark> <scratch>/o93/both.test.ts > case 48: a Remove press on a task line, before the question is answered 32ms
26	 <check mark> <scratch>/o93/both.test.ts > the undo of a write that takes out a line before another 1854ms
27	
28	 Test Files  1 passed (1)
29	      Tests  3 passed (3)
30	   Start at  05:43:59
31	   Duration  6.60s (transform 1.48s, setup 0ms, import 4.31s, tests 2.19s, environment 0ms)
32	
```

### Cases 1-46, last run

`<scratch>/o93/cases.test.ts`, run from the worktree's root with `O93_TREE=$PWD O93_FILE=cases.test.ts npx vitest run --config <scratch>/o93/vitest.cases.mts --configLoader runner`:

```ts
// The case-run program of O93: it prints what each case of the brief gives on the tree `@tree`
// names and asserts nothing. Every hub it writes is a scratch directory under the system temporary
// directory, made by the suite's own fixtures.
import { it } from 'vitest';
import { readFileSync } from 'node:fs';
import { engineDir, glyphCatalog, loadConfig, textCatalog } from '$lib/data/sources/config';
import { hubVocabs, portfolioConfigFrom } from '$lib/data/index';
import { setCatalog, setGlyphs } from '$lib/state/shared/words/text';
import {
    followupWrite,
    subtaskWrite,
    writeFollowup,
    writeSubtask,
    writeSubtaskAdd
} from '$lib/server/edit/writes';
import { FOLLOWUP } from '$lib/server/edit/entry-edit/index';
import { followups, subtasks } from '$lib/data/shapes/shapes';
import { entrySubtasks } from '$lib/state/boards/collection/index';
import { mergeHubs } from '$lib/data/snapshot/hubs/merge';
import { ticker } from '$lib/state/boards/ticker';
import { focusFilter, focusPage, pillarRows, type FocusFilter } from '$lib/state/boards/focus/filter';
import { actionsFor, act, removeAsked, rowMaker } from '$lib/views/boards/focus/rows';
import { buildOneHub } from '@tree/tests/fixtures/hubs/hub-build.ts';
import { plantScratch } from '@tree/tests/fixtures/scratch.ts';
import { configFor, hub, manifestOf } from '@tree/tests/server/edit/writes-fixture.ts';
import type { Snapshot } from '$lib/data/model/index';
import type { TickerItem } from '$lib/state/boards/ticker';

const LOADED = loadConfig(engineDir()).config;
const CONFIG = portfolioConfigFrom(LOADED);
const TEXT = textCatalog(LOADED);
setCatalog(TEXT);
setGlyphs(glyphCatalog(LOADED));

const out = (label: string, value: unknown): void => {
    console.log(`${label}: ${typeof value === 'string' ? value : JSON.stringify(value)}`);
};

/** A manifest of the writes fixture's shape with the block given after it. */
const BASE = 'id: alpha\ntier: research\nstage: submitted\ntitle: "A title"\n';

/** One write over a scratch hub whose manifest is BASE and `block`, and the file after it. */
function written(block: string, run: (dir: string) => unknown): { answer: unknown; file: string } {
    const dir = hub(BASE + block);
    let answer: unknown;
    try {
        answer = run(dir);
    } catch (error) {
        answer = `threw: ${String(error)}`;
    }
    const strip = (one: unknown): unknown =>
        typeof one === 'object' && one !== null
            ? { ...one, records: undefined, changed: (one as { changed?: unknown }).changed }
            : one;
    return { answer: strip(answer), file: manifestOf(dir).slice(BASE.length) };
}

const config = configFor();
const host = { id: 'alpha' };

it('the writes', () => {
    const one = 'followup:\n  - { do: ask Ann }\n';
    out('case 1', written(one, (dir) => writeFollowup(dir, config, host, '0', 'done')));
    const done = 'followup:\n  - { do: ask Ann, done: true }\n';
    out('case 2', written(done, (dir) => writeFollowup(dir, config, host, '0', 'reopen')));
    const two = 'followup:\n  - { do: ask Ann }\n  - { do: ask Bob }\n';
    out('case 3 two', written(two, (dir) => writeFollowup(dir, config, host, '0', 'delete')));
    out('case 3 one', written(one, (dir) => writeFollowup(dir, config, host, '0', 'delete')));
    out(
        'case 4 set',
        written(one, (dir) => writeFollowup(dir, config, host, '0', 'supervisors', ['ann', 'bob']))
    );
    const set = 'followup:\n  - { do: ask Ann, supervisors: [ann, bob] }\n';
    out('case 4 drop', written(set, (dir) => writeFollowup(dir, config, host, '0', 'supervisors', [])));
    const sub = 'subtasks:\n  - { do: write it, deadline: 2026-12-01 }\n';
    out('case 5', written(sub, (dir) => writeSubtask(dir, config, host, '0', 'lead', ['ann'])));
    out(
        'case 6',
        written('', (dir) =>
            writeSubtaskAdd(
                dir,
                config,
                host,
                { do: 'x', collaborators: ['ann'], done: true, deadline: '2026-01-01', extra: 'y' },
                FOLLOWUP
            )
        )
    );
    out('case 40', written(one, (dir) => writeFollowup(dir, config, host, '0', 'lead', ['a,b'])));
    out('case 40 read back', followups([{ do: 'ask Ann', lead: ['a,b'] }]));
    out(
        'case 41',
        written(one, (dir) => writeFollowup(dir, config, host, '0', 'lead', ['ann', 'ann']))
    );
    out('case 42 followup', written(one, (dir) => writeFollowup(dir, config, host, '0', 'reopen')));
    out(
        'case 42 subtask',
        written('subtasks:\n  - { do: write it }\n', (dir) =>
            writeSubtask(dir, config, host, '0', 'reopen')
        )
    );
    const shifted = 'followup:\n  - { do: ask Bob }\n';
    out('case 46 followup gone', written(shifted, (dir) => writeFollowup(dir, config, host, '1', 'delete')));
    out(
        'case 46 subtask gone',
        written('subtasks:\n  - { do: ask Bob }\n', (dir) => writeSubtask(dir, config, host, '1', 'delete'))
    );
    out(
        'case 46 subtask shifted',
        written('subtasks:\n  - { do: ask Bob }\n  - { do: ask Cy }\n', (dir) =>
            writeSubtask(dir, config, host, '0', 'delete')
        )
    );
    out(
        'case 46 followup shifted',
        written('followup:\n  - { do: ask Bob }\n  - { do: ask Cy }\n', (dir) =>
            writeFollowup(dir, config, host, '0', 'delete')
        )
    );
    const dirA = hub(BASE + one);
    out('case 8 done records', writeFollowup(dirA, config, host, '0', 'done').records);
    const dirB = hub(BASE + one);
    out('case 8 delete records', writeFollowup(dirB, config, host, '0', 'delete').records);
});

it('the request bodies', () => {
    const target = { id: 'alpha' };
    for (const value of ['ann', 3, ['ann', 4], [''], ['ann']]) {
        for (const kind of ['subtask', 'followup'] as const) {
            const body = { kind, target, key: '0', action: 'lead', value };
            const read = kind === 'subtask' ? subtaskWrite(body) : followupWrite(body);
            out(`case 7 ${kind} lead ${JSON.stringify(value)}`, read);
        }
    }
});

it('the readers', () => {
    out(
        'case 10',
        followups([{ do: 'a', done: true, lead: 'ann', supervisors: ['bob'] }, { do: 'b', done: 'yes' }])
    );
    out('case 11 subtasks', subtasks([{ do: 'a', collaborators: ['ann'] }]));
    out('case 11 entrySubtasks', entrySubtasks({ fields: { subtasks: [{ do: 'a', collaborators: ['ann'] }] } }));
});

/** The schema of a registry file keyed by `key` and titled by `name` or `title`. */
const KEYED =
    'schema:\n  - { field: key, type: text, primary_key: true }\n  - { field: name, type: text, display: 1 }\n  - { field: title, type: text, display: 2 }\n';

/** A manifest of a research project. */
const manifest = (id: string, rest: string): string =>
    `id: ${id}\ntier: research\nstage: submitted\ntitle: ${id}\n${rest}`;

/** The people, pillars and records every Focus case reads, planted in one scratch hub. */
function plantHub(prefix: string, pillar: string, extra: Record<string, string> = {}): string {
    return plantScratch(
        prefix,
        {
            '.oculus/data/people/people.yml': `${KEYED}entries:\n  - { key: ann, name: Ann Arbor }\n  - { key: bob, name: Bob Bell }\n`,
            '.oculus/data/pillars/pillars.yml': `${KEYED}entries:\n  - { key: ${pillar}, title: Pillar ${pillar} }\n  - { key: b, title: Pillar b }\n`,
            'projects/active/pann/project.yml': manifest(
                'pann',
                'lead: [ann]\npillars: [a]\nwaiting-on: [bob]\nsubtasks:\n  - { do: theirs, lead: [bob] }\n  - { do: plain }\nfollowup:\n  - { do: sup, supervisors: [ann] }\n  - { do: led, lead: [ann] }\n  - { do: closed, done: true }\n'
            ),
            'projects/active/pbob/project.yml': manifest(
                'pbob',
                'lead: [bob]\npillars: [a, b]\nwaiting-on: [ann]\nsubtasks:\n  - { do: mine, lead: [ann], collaborators: [bob] }\n  - { do: ghost, lead: [zed] }\n'
            ),
            'projects/active/pnone/project.yml': manifest('pnone', 'subtasks:\n  - { do: free }\n'),
            '.oculus/data/academic/tasks.yml': `schema:\n  - { field: key, type: text, primary_key: true }\n  - { field: title, type: text, display: 1 }\n  - { field: status, type: select, options: [todo, doing, done] }\nentries:\n  - { key: t1, title: A task, status: todo, subtasks: [{ do: sub of task, collaborators: [ann] }] }\n`,
            '.oculus/data/academic/events.yml':
                'schema:\n  - { field: title, type: text, display: 1, primary_key: true }\n  - { field: pillars, type: tags }\n  - { field: date, type: date }\nentries:\n  - { title: A talk, pillars: [a], subtasks: [{ do: slides }] }\n',
            '.oculus/data/academic/education.yml':
                'schema:\n  - { field: title, type: text, display: 1, primary_key: true }\n  - { field: date, type: date }\nentries:\n  - { title: B course, pillars: [a], subtasks: [{ do: notes }] }\n',
            ...extra
        },
        ['projects/active']
    );
}

const FILES = new Proxy({}, { get: () => '' }) as Record<string, string>;

function snapshotOf(hubs: { key: string; dir: string }[]): Snapshot {
    const parts = hubs.map((one) => ({
        key: one.key,
        files: FILES as never,
        snapshot: buildOneHub(one.dir, CONFIG, 0, [], undefined, null, one.key).snapshot
    }));
    return mergeHubs(parts, TEXT as never, 0);
}

const NOW = Date.parse('2026-10-27T12:00:00Z');
const LISTS = hubVocabs({ primary: null, folders: [], own: LOADED }, null, []);
const wordsOf = (() => LOADED) as never;

function brief(line: TickerItem): unknown {
    return { label: line.label, target: line.target, root: line.root, people: line.people, names: line.names };
}

/** The Focus page of one snapshot under one filter, as the lines, lanes, counts and Mine only. */
function pageOf(snapshot: Snapshot, self: ReadonlySet<string>, hubs: string[] = []) {
    const scope = { self, hubs, wordsOf, lists: LISTS };
    return (filter: Partial<FocusFilter> & Record<string, unknown>) => {
        const made = focusPage(snapshot, LOADED, NOW, focusFilter({ filter }), scope);
        const week = made.sections.week;
        return {
            tasks: week.tasks.map((one) => `${hubs.length > 0 ? `${one.root}:` : ''}${one.label}`),
            deadlines: week.deadlines.map((one) => one.label),
            lanes: Object.values(made.sections.lanes).flat().map((one) => one.id),
            awaiting: made.sections.strip.people,
            band: made.sections.band.funding.map((stage) => stage.items.map((item) => item.id)),
            hidden: made.hidden,
            hides: made.hides,
            mineHides: made.mineHides
        };
    };
}

it('the ticker and the Focus filter', () => {
    const snapshot = snapshotOf([{ key: 'lab', dir: plantHub('oculus-o93-', 'a') }]);
    out('ids', {
        projects: Object.keys(snapshot.entities.projects),
        people: Object.keys(snapshot.entities.people),
        pillars: Object.keys(snapshot.entities.pillars),
        pillarIds: Object.values(snapshot.entities.projects).map((one) => [one.id, one.pillarIds])
    });
    const week = ticker(snapshot, LOADED, NOW, wordsOf, LISTS);
    out('case 13 tasks', week.tasks.map(brief));
    out('case 11 ticker entry lines', week.tasks.filter((one) => one.target?.kind === 'entry').map(brief));
    const self = new Set(Object.keys(snapshot.entities.people).filter((id) => id.endsWith('ann')));
    const page = pageOf(snapshot, self);
    out('case 13/17/21 mine', page({ mine: true }));
    out('case 13/17 all', page({ mine: false }));
    out('case 18 supervisor unticked', page({ mine: false, roles: ['supervisor'] }));
    out('case 20 tier unticked', page({ mine: false, tiers: ['research'] }));
    out('case 22/23/26 pillar a unticked', page({ mine: false, pillars: ['lab:a'] }));
    out('case 24 every pillar unticked', page({ mine: false, pillars: ['lab:a', 'lab:b'] }));
    out('case 27 read', [
        focusFilter({}),
        focusFilter({ filter: { pillars: 'a' } }),
        focusFilter({ filter: { pillars: ['a'] } })
    ]);
    out('case 28 pillar rows, one hub', pillarRows(snapshot.entities.pillars, []));
    out('case 28 pillar rows, no pillar', pillarRows({}, []));
    const rows = rowMaker('t');
    const follow = week.tasks.find((one) => one.kind === 'followup');
    const sub = week.tasks.find((one) => one.target?.subtask !== undefined);
    const task = week.tasks.find((one) => one.target?.task === true);
    out('case 14 followup actions', follow === undefined ? null : actionsFor(follow)?.map((one) => one.id));
    out('case 15 task actions', task === undefined ? null : actionsFor(task)?.map((one) => one.id));
    out('case 15 removeAsked', [removeAsked(task, 'remove'), removeAsked(task, 'snooze:7'), removeAsked(follow, 'remove')]);
    out('case 16 subtask actions', sub === undefined ? null : actionsFor(sub)?.map((one) => one.id));
    const pressed: unknown[] = [];
    const record =
        (name: string) =>
        (...args: unknown[]) => {
            pressed.push([name, ...args]);
            return Promise.resolve({ ok: true, changed: [], refused: [] });
        };
    const writes = {
        writeFollowup: record('writeFollowup'),
        writeSubtask: record('writeSubtask'),
        writeEntry: record('writeEntry'),
        writeManifest: record('writeManifest')
    };
    const client = { writes: writes as never, terminals: { composeAt: () => Promise.resolve('') } };
    void act(client, follow, 'done', NOW);
    void act(client, follow, 'remove', NOW);
    void act(client, task, 'remove', NOW);
    out('case 14/15 writes sent', pressed);
    const named = week.tasks.find((one) => one.label.includes('mine'));
    const ghost = week.tasks.find((one) => one.label.includes('ghost'));
    const plain = week.tasks.find((one) => one.label.includes('plain'));
    out('case 29 row naming people', named === undefined ? null : rows.row(named, ''));
    out('case 21 row naming zed', ghost === undefined ? null : rows.row(ghost, '').detail ?? null);
    out('case 29 row naming nobody', plain === undefined ? null : rows.row(plain, '').detail ?? null);
    const blocked = rowMaker('t', () => 'the file has unsaved text');
    out('case 44 task row', task === undefined ? null : blocked.row(task, '').actions);
});

it('every record the user\'s', () => {
    const dir = plantScratch(
        'oculus-o93-own-',
        {
            '.oculus/data/people/people.yml': `${KEYED}entries:\n  - { key: ann, name: Ann Arbor }\n  - { key: bob, name: Bob Bell }\n`,
            'projects/active/pann/project.yml': manifest(
                'pann',
                'lead: [ann]\nsubtasks:\n  - { do: theirs, lead: [bob] }\n  - { do: plain }\n'
            )
        },
        ['projects/active']
    );
    const snapshot = snapshotOf([{ key: 'lab', dir }]);
    const page = pageOf(snapshot, new Set(['lab:ann']));
    out('case 19 Mine only off', page({ mine: false }));
    out('case 19 Mine only on', page({ mine: true }));
});

it('a funding scheme', () => {
    const funding =
        'schema:\n  - { field: key, type: text, primary_key: true }\n  - { field: title, type: text, display: 1 }\n  - { field: status, type: select, options: [in-prep, planned, submitted] }\n  - { field: deadline, type: date }\nentries:\n  - { key: s1, title: Scheme one, status: in-prep, deadline: "2026-11-01" }\n  - { key: s2, title: Scheme two, status: in-prep, deadline: "2026-11-02" }\n';
    const dir = plantHub('oculus-o93-fund-', 'a', {
        '.oculus/data/academic/funding.yml': funding,
        'projects/active/pann/project.yml': manifest('pann', 'lead: [ann]\npillars: [a]\nfunding: [s1]\n'),
        'projects/active/pnone/project.yml': manifest('pnone', 'funding: [s2]\n')
    });
    const snapshot = snapshotOf([{ key: 'lab', dir }]);
    out('schemes', Object.values(snapshot.entities.funding).map((one) => [one.id, one.pillarIds]));
    const page = pageOf(snapshot, new Set());
    out('case 25 nothing unticked', page({ mine: false }));
    out('case 25 pillar a unticked', page({ mine: false, pillars: ['lab:a'] }));
});

it('two hubs', () => {
    const snapshot = snapshotOf([
        { key: 'lab', dir: plantHub('oculus-o93-lab-', 'a') },
        { key: 'home', dir: plantHub('oculus-o93-home-', 'a') }
    ]);
    const page = pageOf(snapshot, new Set(), ['lab', 'home']);
    out('case 43', page({ mine: false, pillars: ['lab:a'] }));
    out('case 28 pillar rows, two hubs', pillarRows(snapshot.entities.pillars, ['lab', 'home']));
});

it('the hub schema', () => {
    for (const note of ['{ do: a, done: true, lead: [ann] }', '{ do: a, done: maybe }']) {
        const dir = plantScratch(
            'oculus-o93-schema-',
            { 'projects/active/alpha/project.yml': `id: alpha\ntier: research\nstage: exploring\ntitle: Alpha\nfollowup:\n  - ${note}\n` },
            ['projects/active']
        );
        const found = buildOneHub(dir, CONFIG).snapshot.findings
            .filter((one) => one.file.endsWith('project.yml'))
            .map((one) => [one.file.split('/').slice(-2).join('/'), one.key, one.line, one.message]);
        out(`case 12 ${note}`, found);
    }
});

it('the glyph', () => {
    const palette = readFileSync('/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O93/docs/palette.md', 'utf8');
    out('case 30 palette waiting rows', palette.split('\n').filter((one) => /waiting|\(w\)/.test(one)));
    out('case 30 glyph catalog', glyphCatalog(LOADED).waiting ?? null);
});
```

Its output, whole ("a N"; `<tmp>` stands for the system temporary directory):

```
1	
2	 RUN  v4.1.11 /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O93
3	
4	stdout | <scratch>/o93/cases.test.ts > the writes
5	case 1: {"answer":{"found":true,"changed":["done"],"refused":[]},"file":"followup:\n  - { do: ask Ann, done: true }\n"}
6	case 2: {"answer":{"found":true,"changed":["done"],"refused":[]},"file":"followup:\n  - { do: ask Ann }\n"}
7	case 3 two: {"answer":{"found":true,"changed":["followup"],"refused":[]},"file":"followup:\n  - { do: ask Bob }\n"}
8	case 3 one: {"answer":{"found":true,"changed":["followup"],"refused":[]},"file":""}
9	case 4 set: {"answer":{"found":true,"changed":["supervisors"],"refused":[]},"file":"followup:\n  - { do: ask Ann, supervisors: [ann, bob] }\n"}
10	case 4 drop: {"answer":{"found":true,"changed":["supervisors"],"refused":[]},"file":"followup:\n  - { do: ask Ann }\n"}
11	case 5: {"answer":{"found":true,"changed":["lead"],"refused":[]},"file":"subtasks:\n  - { do: write it, deadline: 2026-12-01, lead: [ann] }\n"}
12	case 6: {"answer":{"found":true,"changed":["followup"],"refused":[]},"file":"followup:\n  - { do: x, done: true, collaborators: [ann] }\n"}
13	case 40: {"answer":{"found":true,"changed":["lead"],"refused":[]},"file":"followup:\n  - { do: ask Ann, lead: [\"a,b\"] }\n"}
14	case 40 read back: [{"key":"0","do":"ask Ann","done":false,"lead":["a,b"]}]
15	case 41: {"answer":{"found":true,"changed":["lead"],"refused":[]},"file":"followup:\n  - { do: ask Ann, lead: [ann] }\n"}
16	case 42 followup: {"answer":{"found":true,"changed":[],"refused":[]},"file":"followup:\n  - { do: ask Ann }\n"}
17	case 42 subtask: {"answer":{"found":true,"changed":[],"refused":[]},"file":"subtasks:\n  - { do: write it }\n"}
18	case 46 followup gone: {"answer":{"found":true,"changed":[],"refused":[{"field":"followup","reason":"there is no follow-up note 1"}]},"file":"followup:\n  - { do: ask Bob }\n"}
19	case 46 subtask gone: {"answer":{"found":true,"changed":[],"refused":[{"field":"subtasks","reason":"there is no subtask 1"}]},"file":"subtasks:\n  - { do: ask Bob }\n"}
20	case 46 subtask shifted: {"answer":{"found":true,"changed":["subtasks"],"refused":[]},"file":"subtasks:\n  - { do: ask Cy }\n"}
21	case 46 followup shifted: {"answer":{"found":true,"changed":["followup"],"refused":[]},"file":"followup:\n  - { do: ask Cy }\n"}
22	case 8 done records: [{"file":"<tmp>/oculus-writes-ct9M9I/projects/manuscripts/alpha/project.yml","key":"alpha","field":"0","before":{"do":"ask Ann"},"after":{"do":"ask Ann","done":true},"undo":"field"}]
23	case 8 delete records: [{"file":"<tmp>/oculus-writes-QmMP9o/projects/manuscripts/alpha/project.yml","key":"alpha","field":"0","before":{"do":"ask Ann"},"after":null,"undo":"delete"}]
24	
25	 <check mark> <scratch>/o93/cases.test.ts > the writes 187ms
26	stdout | <scratch>/o93/cases.test.ts > the request bodies
27	case 7 subtask lead "ann": null
28	case 7 followup lead "ann": null
29	case 7 subtask lead 3: null
30	case 7 followup lead 3: null
31	case 7 subtask lead ["ann",4]: null
32	case 7 followup lead ["ann",4]: null
33	case 7 subtask lead [""]: null
34	case 7 followup lead [""]: null
35	case 7 subtask lead ["ann"]: {"kind":"subtask","target":{"id":"alpha"},"key":"0","action":"lead","value":["ann"]}
36	case 7 followup lead ["ann"]: {"kind":"followup","target":{"id":"alpha"},"key":"0","action":"lead","value":["ann"]}
37	
38	stdout | <scratch>/o93/cases.test.ts > the readers
39	case 10: [{"key":"0","do":"a","done":true,"lead":["ann"],"supervisors":["bob"]},{"key":"1","do":"b","done":false}]
40	case 11 subtasks: [{"key":"0","do":"a","done":false,"collaborators":["ann"]}]
41	case 11 entrySubtasks: [{"key":"0","do":"a","done":false,"collaborators":["ann"]}]
42	
43	stdout | <scratch>/o93/cases.test.ts > the ticker and the Focus filter
44	ids: {"projects":["lab:pann","lab:pbob","lab:pnone"],"people":["lab:ann","lab:bob"],"pillars":["lab:a","lab:b"],"pillarIds":[["lab:pann",["lab:a"]],["lab:pbob",["lab:a","lab:b"]],["lab:pnone",[]]]}
45	case 13 tasks: [{"label":"pann - sup","target":{"kind":"followup","id":"lab:pann","note":"0"},"root":"lab","people":{"supervisors":["ann"]},"names":"Ann Arbor"},{"label":"pann - led","target":{"kind":"followup","id":"lab:pann","note":"1"},"root":"lab","people":{"lead":["ann"]},"names":"Ann Arbor"},{"label":"pann: theirs","target":{"kind":"manifest","id":"lab:pann","subtask":"0"},"root":"lab","people":{"lead":["bob"]},"names":"Bob Bell"},{"label":"pann: plain","target":{"kind":"manifest","id":"lab:pann","subtask":"1"},"root":"lab"},{"label":"pbob: mine","target":{"kind":"manifest","id":"lab:pbob","subtask":"0"},"root":"lab","people":{"lead":["ann"],"collaborators":["bob"]},"names":"Ann Arbor, Bob Bell"},{"label":"pbob: ghost","target":{"kind":"manifest","id":"lab:pbob","subtask":"1"},"root":"lab","people":{"lead":["zed"]},"names":"zed"},{"label":"pnone: free","target":{"kind":"manifest","id":"lab:pnone","subtask":"0"},"root":"lab"},{"label":"B course: notes","target":{"kind":"entry","id":"lab:B course","collection":"education","subtask":"0"},"root":"lab"},{"label":"A talk: slides","target":{"kind":"entry","id":"lab:A talk","collection":"events","subtask":"0"},"root":"lab"},{"label":"A task: sub of task","target":{"kind":"entry","id":"lab:t1","collection":"tasks","subtask":"0"},"root":"lab","people":{"collaborators":["ann"]},"names":"Ann Arbor"},{"label":"A task","target":{"kind":"entry","id":"lab:t1","collection":"tasks","statuses":["todo","doing","done"],"task":true},"root":"lab"}]
46	case 11 ticker entry lines: [{"label":"B course: notes","target":{"kind":"entry","id":"lab:B course","collection":"education","subtask":"0"},"root":"lab"},{"label":"A talk: slides","target":{"kind":"entry","id":"lab:A talk","collection":"events","subtask":"0"},"root":"lab"},{"label":"A task: sub of task","target":{"kind":"entry","id":"lab:t1","collection":"tasks","subtask":"0"},"root":"lab","people":{"collaborators":["ann"]},"names":"Ann Arbor"},{"label":"A task","target":{"kind":"entry","id":"lab:t1","collection":"tasks","statuses":["todo","doing","done"],"task":true},"root":"lab"}]
47	case 13/17/21 mine: {"tasks":["pann - sup","pann - led","pann: plain","pbob: mine","pnone: free","B course: notes","A talk: slides","A task: sub of task","A task"],"deadlines":[],"lanes":["lab:pann","lab:pnone"],"awaiting":[{"label":"Bob Bell","count":1}],"band":[],"hidden":{"command":0,"tasks":2,"awaiting":1,"lanes":{"run":0,"push":0,"revise":0,"review":1,"blocked":0,"backburner":0,"scope":0,"derisk":0,"build":0,"idea":0},"band":{"funding":0,"jobs":0,"teaching":0}},"hides":true,"mineHides":true}
48	case 13/17 all: {"tasks":["pann - sup","pann - led","pann: theirs","pann: plain","pbob: mine","pbob: ghost","pnone: free","B course: notes","A talk: slides","A task: sub of task","A task"],"deadlines":[],"lanes":["lab:pann","lab:pbob","lab:pnone"],"awaiting":[{"label":"Ann Arbor","count":1},{"label":"Bob Bell","count":1}],"band":[],"hidden":{"command":0,"tasks":0,"awaiting":0,"lanes":{"run":0,"push":0,"revise":0,"review":0,"blocked":0,"backburner":0,"scope":0,"derisk":0,"build":0,"idea":0},"band":{"funding":0,"jobs":0,"teaching":0}},"hides":false,"mineHides":true}
49	case 18 supervisor unticked: {"tasks":["pann - led","pann: theirs","pann: plain","pbob: mine","pbob: ghost","pnone: free","B course: notes","A talk: slides","A task: sub of task","A task"],"deadlines":[],"lanes":["lab:pann","lab:pbob","lab:pnone"],"awaiting":[{"label":"Ann Arbor","count":1},{"label":"Bob Bell","count":1}],"band":[],"hidden":{"command":0,"tasks":1,"awaiting":0,"lanes":{"run":0,"push":0,"revise":0,"review":0,"blocked":0,"backburner":0,"scope":0,"derisk":0,"build":0,"idea":0},"band":{"funding":0,"jobs":0,"teaching":0}},"hides":true,"mineHides":true}
50	case 20 tier unticked: {"tasks":["B course: notes","A talk: slides","A task: sub of task","A task"],"deadlines":[],"lanes":[],"awaiting":[],"band":[],"hidden":{"command":0,"tasks":7,"awaiting":3,"lanes":{"run":0,"push":0,"revise":0,"review":3,"blocked":0,"backburner":0,"scope":0,"derisk":0,"build":0,"idea":0},"band":{"funding":0,"jobs":0,"teaching":0}},"hides":true,"mineHides":true}
51	case 22/23/26 pillar a unticked: {"tasks":["pbob: mine","pbob: ghost","pnone: free","B course: notes","A task: sub of task","A task"],"deadlines":[],"lanes":["lab:pbob","lab:pnone"],"awaiting":[{"label":"Ann Arbor","count":1}],"band":[],"hidden":{"command":0,"tasks":5,"awaiting":1,"lanes":{"run":0,"push":0,"revise":0,"review":1,"blocked":0,"backburner":0,"scope":0,"derisk":0,"build":0,"idea":0},"band":{"funding":0,"jobs":0,"teaching":0}},"hides":true,"mineHides":true}
52	case 24 every pillar unticked: {"tasks":["pnone: free","B course: notes","A task: sub of task","A task"],"deadlines":[],"lanes":["lab:pnone"],"awaiting":[],"band":[],"hidden":{"command":0,"tasks":7,"awaiting":2,"lanes":{"run":0,"push":0,"revise":0,"review":2,"blocked":0,"backburner":0,"scope":0,"derisk":0,"build":0,"idea":0},"band":{"funding":0,"jobs":0,"teaching":0}},"hides":true,"mineHides":true}
53	case 27 read: [{"mine":true,"roles":[],"tiers":[],"pillars":[],"hubs":[]},{"mine":true,"roles":[],"tiers":[],"pillars":[],"hubs":[]},{"mine":true,"roles":[],"tiers":[],"pillars":["a"],"hubs":[]}]
54	case 28 pillar rows, one hub: [{"key":"lab:a","label":"Pillar a"},{"key":"lab:b","label":"Pillar b"}]
55	case 28 pillar rows, no pillar: []
56	case 14 followup actions: ["done","remove"]
57	case 15 task actions: ["status:doing","status:done","agent","snooze:7","snooze:30","snooze:hide","remove"]
58	case 15 removeAsked: [{"collection":"tasks","id":"lab:t1"},null,null]
59	case 16 subtask actions: ["done","agent","snooze:7","snooze:30","snooze:hide","del"]
60	case 14/15 writes sent: [["writeFollowup",{"id":"lab:pann"},"0","done"],["writeFollowup",{"id":"lab:pann"},"0","delete"]]
61	case 29 row naming people: {"id":"tmanifest::lab%3Apbob:0","glyph":"pin","label":"pbob: mine","detail":"Ann Arbor, Bob Bell","tail":"","mark":"lab","actions":[{"id":"done","label":"done","title":"mark done"},{"id":"agent","label":"agent","title":"open the composer seeded with this task, in its folder"},{"id":"snooze:7","label":"1w","title":"snooze 1w"},{"id":"snooze:30","label":"1mo","title":"snooze 1mo"},{"id":"snooze:hide","label":"hide","title":"snooze hide"},{"id":"del","label":"del","title":"delete subtask"}],"plain":false}
62	case 21 row naming zed: zed
63	case 29 row naming nobody: null
64	case 44 task row: [{"id":"status:doing","label":"doing","title":"the file has unsaved text","disabled":true},{"id":"status:done","label":"done","title":"the file has unsaved text","disabled":true},{"id":"agent","label":"agent","title":"open the composer seeded with this task, in its folder"},{"id":"snooze:7","label":"1w","title":"the file has unsaved text","disabled":true},{"id":"snooze:30","label":"1mo","title":"the file has unsaved text","disabled":true},{"id":"snooze:hide","label":"hide","title":"the file has unsaved text","disabled":true},{"id":"remove","label":"Remove","title":"the file has unsaved text","disabled":true}]
65	
66	 <check mark> <scratch>/o93/cases.test.ts > the request bodies 1ms
67	 <check mark> <scratch>/o93/cases.test.ts > the readers 0ms
68	 <check mark> <scratch>/o93/cases.test.ts > the ticker and the Focus filter 127ms
69	stdout | <scratch>/o93/cases.test.ts > every record the user's
70	case 19 Mine only off: {"tasks":["pann: theirs","pann: plain"],"deadlines":[],"lanes":["lab:pann"],"awaiting":[],"band":[],"hidden":{"command":0,"tasks":0,"awaiting":0,"lanes":{"run":0,"push":0,"revise":0,"review":0,"blocked":0,"backburner":0,"scope":0,"derisk":0,"build":0,"idea":0},"band":{"funding":0,"jobs":0,"teaching":0}},"hides":false,"mineHides":true}
71	case 19 Mine only on: {"tasks":["pann: plain"],"deadlines":[],"lanes":["lab:pann"],"awaiting":[],"band":[],"hidden":{"command":0,"tasks":1,"awaiting":0,"lanes":{"run":0,"push":0,"revise":0,"review":0,"blocked":0,"backburner":0,"scope":0,"derisk":0,"build":0,"idea":0},"band":{"funding":0,"jobs":0,"teaching":0}},"hides":true,"mineHides":true}
72	
73	stdout | <scratch>/o93/cases.test.ts > a funding scheme
74	schemes: [["lab:s1",["lab:a"]],["lab:s2",[]]]
75	case 25 nothing unticked: {"tasks":["pbob: mine","pbob: ghost","B course: notes","A talk: slides","A task: sub of task","A task"],"deadlines":["Scheme one","Scheme two"],"lanes":["lab:pann","lab:pbob","lab:pnone"],"awaiting":[{"label":"Ann Arbor","count":1}],"band":[["lab:s1","lab:s2"]],"hidden":{"command":0,"tasks":0,"awaiting":0,"lanes":{"run":0,"push":0,"revise":0,"review":0,"blocked":0,"backburner":0,"scope":0,"derisk":0,"build":0,"idea":0},"band":{"funding":0,"jobs":0,"teaching":0}},"hides":false,"mineHides":false}
76	case 25 pillar a unticked: {"tasks":["pbob: mine","pbob: ghost","B course: notes","A task: sub of task","A task"],"deadlines":["Scheme two"],"lanes":["lab:pbob","lab:pnone"],"awaiting":[{"label":"Ann Arbor","count":1}],"band":[["lab:s2"]],"hidden":{"command":1,"tasks":1,"awaiting":1,"lanes":{"run":0,"push":0,"revise":0,"review":1,"blocked":0,"backburner":0,"scope":0,"derisk":0,"build":0,"idea":0},"band":{"funding":1,"jobs":0,"teaching":0}},"hides":true,"mineHides":false}
77	
78	 <check mark> <scratch>/o93/cases.test.ts > every record the user's 47ms
79	 <check mark> <scratch>/o93/cases.test.ts > a funding scheme 66ms
80	stdout | <scratch>/o93/cases.test.ts > two hubs
81	case 43: {"tasks":["home:pann - sup","home:pann - led","home:pann: theirs","home:pann: plain","home:pbob: mine","home:pbob: ghost","home:pnone: free","lab:pbob: mine","lab:pbob: ghost","lab:pnone: free","home:B course: notes","home:A talk: slides","home:A task: sub of task","lab:B course: notes","lab:A task: sub of task","home:A task","lab:A task"],"deadlines":[],"lanes":["home:pann","home:pbob","lab:pbob","home:pnone","lab:pnone"],"awaiting":[{"label":"Ann Arbor","count":2},{"label":"Bob Bell","count":1}],"band":[],"hidden":{"command":0,"tasks":5,"awaiting":1,"lanes":{"run":0,"push":0,"revise":0,"review":1,"blocked":0,"backburner":0,"scope":0,"derisk":0,"build":0,"idea":0},"band":{"funding":0,"jobs":0,"teaching":0}},"hides":true,"mineHides":false}
82	case 28 pillar rows, two hubs: [{"key":"home:a","label":"Pillar a (home)"},{"key":"home:b","label":"Pillar b (home)"},{"key":"lab:a","label":"Pillar a (lab)"},{"key":"lab:b","label":"Pillar b (lab)"}]
83	
84	 <check mark> <scratch>/o93/cases.test.ts > two hubs 297ms
85	stdout | <scratch>/o93/cases.test.ts > the hub schema
86	case 12 { do: a, done: true, lead: [ann] }: []
87	case 12 { do: a, done: maybe }: [["alpha/project.yml","followup[0].done",6,"followup[0].done must be true or false, not a string"]]
88	
89	stdout | <scratch>/o93/cases.test.ts > the glyph
90	case 30 palette waiting rows: []
91	case 30 glyph catalog: (w)
92	
93	 <check mark> <scratch>/o93/cases.test.ts > the hub schema 72ms
94	 <check mark> <scratch>/o93/cases.test.ts > the glyph 1ms
95	
96	 Test Files  1 passed (1)
97	      Tests  9 passed (9)
98	   Start at  05:44:09
99	   Duration  4.59s (transform 1.29s, setup 0ms, import 3.70s, tests 800ms, environment 0ms)
100	
```

## Doc text

For `docs/data-map.md`, which the step does not edit in the worktree. Line 219 at HEAD (`git show HEAD:docs/data-map.md | sed -n 219p`) begins:

"- `project.yml`: `followup:` is a list of notes, each `{ do, after }`, and a note's `after` hides it until that date. The Focus lane is no key: ..."

Its first sentence becomes the following, the rest of the line (from "The Focus lane is no key:") kept as it is:

"- `project.yml`: `followup:` is a list of notes, each `{ do, after, done, lead, supervisors, collaborators }`; a note's `after` hides it until that date, and `done: true` keeps it on its card, struck through, and off the Focus board. The three people fields each hold a person key or a list of keys, which Mine only and the Role list read in place of the project's own people, and a `subtasks:` line takes the same three fields."
