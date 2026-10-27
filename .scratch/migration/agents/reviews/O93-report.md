# O93 report: handed back after the first run, before any code change

NOT done: nothing of items 1 to 11 is built. The step is handed back after the first run of every case, before any code change, because the brief's test paths cannot be met under the size and folder rules (H1, H2), two of its undo cases need a fixture outside the write list (H3), and one premise of "What is on the tree" does not reproduce (H4). Each is below with its options and a recommendation. `git status --short` in the worktree prints only `?? .scratch/migration/agents/reviews/O93-report.md`, and `diff -rq` against `.agents/worktrees/O93-base` over `src`, `tests`, `utils` and `config` (`--exclude=local.yml`) prints nothing.

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md`, section "Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)":

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

## What is handed back, and why

### H1. `tests/server/edit/writes.test.ts` would pass 880 lines, in a folder that holds 10 items

- `wc -l tests/server/edit/writes.test.ts` prints 861. `ls tests/server/edit | wc -l` prints 10.
- The G8 assertions item 11 asks for, drafted in the scratchpad and counted (`grep -n "^====" g8-draft.ts` prints 37 and 58, `wc -l` prints 77): the follow-up describe's tail is 36 lines in place of today's 9 (lines 324-332, `sed -n 324,332p | wc -l` prints 9), and the new `it` 'sets and drops the people of a subtask line' is 20 lines and a blank. 861 + 27 + 21 = 909, past the 880 of `spec.md:47` and past the 900 `tests/checks/tree/size.test.ts:28` refuses. The draft holds only what item 11 lists (Done sets `done: true`, Reopen clears it, Reopen on a note not done changes nothing, Delete takes a note out and the block with the last, a people list set as `[a, b]` and dropped, a key needing quotes, a key given twice, an add with people and `done`, a subtask's `lead` set and dropped); nothing in it can go without dropping a requirement.
- The brief's rule for the same position (`src/lib/state/client/writes.svelte.ts`, a file in a folder of 10 items): "should it pass 880 the builder hands back before splitting it, since its folder holds 10 items". I apply it here. Any split of writes.test.ts needs a new file in `tests/server/edit`, so a folder of its own for some of its files, which moves test files `guarded.md` names by path.
- (a) A folder `tests/server/edit/deck/` takes `deck-acts.test.ts` and `deck-edit.test.ts` (moved with `mv`, their relative imports one level deeper), and the two line describes of writes.test.ts ('writing one subtask line' with `LINE_ROWS`, and 'writing the follow-up notes of a manifest', with the `Subject` helpers they share) and the new `it` move into a new `tests/server/edit/lines.test.ts`. The folder holds 7 + 1 + 1 + 1 = 10. Pros: one concern a file (the line writes apart from the manifest, career, entry and idea writes); writes.test.ts falls to about 750 lines; only two files move, and their titles stay. Cons: G8's Test line (`guarded.md:72`) and the entry naming `deck-acts.test.ts` at `guarded.md:12` and `:75` change paths, which is the orchestrator's edit at landing; two paths outside the write list.
- (b) A folder `tests/server/edit/writes/` takes `writes.test.ts`, `writes-collection.test.ts`, `writes-fixture.ts` and the new `lines.test.ts`. Pros: the write tests and their fixture sit together. Cons: three files move, `config-key.test.ts` and `config-value.test.ts` change their fixture import, and five Test-line paths of G8 change.
- (c) The additions go into writes.test.ts as it is. Cons: 909 lines, refused by the size check. This is the lazy option, and it does not pass.
- Recommendation: (a). It moves the fewest files, and the line writes are the one concern of writes.test.ts this step changes.

### H2. `tests/routes/edit/undo/undo.test.ts` would pass 880 lines

- `wc -l` prints 866. The two `INSIDE_ROWS` rows item 11 asks for (cases 37 and 38) are 19 lines drafted (the third block of `g8-draft.ts`), so 885: under the 900 the size check refuses, past the 880 at which `spec.md:47` makes the step split the file. The folder holds 3 items (`ls tests/routes/edit/undo | wc -l`), so a new file fits.
- (a) The workspace-folder undo tests, `undo.test.ts:318-432` (`FOLDER_ROWS` and its `it.each`, `INSIDE_ROWS`, `PLACED_ROWS` and their `it.each`, with the two new rows), move into a new `tests/routes/edit/undo/folder-undo.test.ts`; the describe's local helper `made` (`undo.test.ts:219`) moves into `tests/routes/edit/write-fixture.ts` beside `undone`, so the two files share one helper. Pros: one concern a file; undo.test.ts falls to about 750 lines. Cons: G9's Test line names "`tests/routes/edit/undo/undo.test.ts`, 'writes the project of a folder of the workspace inside $hub ...'" and 'writes the project of a folder of the workspace in its own file only ...', whose path changes at landing; one more path outside the write list.
- (b) The two rows go into `INSIDE_ROWS` and the file stays at 885. Cons: breaks `spec.md:47`. This is the lazy option.
- Recommendation: (a).

### H3. Cases 37 and 38 need the fixture's manifest to hold a note with people and `done`

- `INSIDE_MANIFEST` (`tests/routes/edit/write-fixture.ts:462`) is `${REPOSITORY_MANIFEST}followup:\n  - { do: ask about the tool }\n`. Case 37 undoes `supervisors: [ann]` to `[ann, bob]` and case 38 undoes a Delete of `{ do: a, done: true, lead: [ann] }`; an `INSIDE_ROWS` row runs one body over that file (`undo.test.ts:416-431`), so the note must be in the fixture. `grep -rn "insideHubTarget\|INSIDE_MANIFEST" tests` outside the fixture prints one user, `undo.test.ts:420`.
- (a) `INSIDE_MANIFEST` gains a second note, `  - { do: chase the reply, done: true, lead: [ann], supervisors: [ann] }`; the case 37 row writes `supervisors` `['ann', 'bob']` on key `'1'`, the case 38 row deletes key `'1'` (the last note, so the undo's add puts it back in place and the file is as before byte for byte). The rows 'a follow-up done' and 'an added follow-up' keep acting on key `'0'` and the end of the list. Pros: one line of fixture; every row reads the same file. Cons: a path outside the write list.
- Recommendation: (a). There is no lazy option that meets the cases.

### H4. A premise that does not reproduce: the three subtask readers do not read the same line shape

- The brief, "What is on the tree" 1: "The three read the same line shape." The first run (lines 39 and 40 of the output below) over `[{ do: 3 }, { do: ['x', 'y'] }, { do: 'z', deadline: 20261201 }]`: `subtasks()` (`shapes.ts:395-406`) gives `[{"key":"2","do":"z","done":false}]`; `entrySubtasks` (`collection/index.ts:735-751`, through `textOf` at `:208-217`) gives `[{"key":"0","do":"3","done":false},{"key":"1","do":"x | y","done":false},{"key":"2","do":"z","done":false,"deadline":"20261201"}]`. The ticker's `subtasksOf` (`ticker-lines.ts:136-154`, `wordShape`) drops a non-text `do` as `subtasks()` does. So an entry card's Subtasks block today draws a line whose `do` is a number or a list, and a number `deadline`, that the Focus board does not.
- (a) The one reader is `subtasks()`'s (`do`, `deadline` and `snooze` as text only): an entry's card stops drawing a line whose `do` is a number or a list, as the Focus board and a manifest's card already do. Pros: one rule on every surface; the line writes (`setSubtask`) and the snapshot hold `do` as text. Cons: such a line, if a hub holds one, leaves the entry card; `subtasks` has no item schema, so no finding names it.
- (b) The one reader takes a number or a list as text, as `textOf` does, on every surface. Pros: no line leaves a card. Cons: a manifest's line and a Focus line then show a number or a joined list as their text, a widening of what the snapshot reads that no ruling names.
- Recommendation: (a). It is the reader item 1 names ("read by `subtasks()` and `followups()` through one shared shape"), and it makes the card agree with the board. Neither option is the lazy one; this needs only a yes.

### Facts from the first run that change nothing in the brief

- Case 15: on the unchanged tree a press with the id `remove` on a task entry's line reaches `rows.ts` `write`, whose `fieldsFor` falls through to `{ snooze: 'true' }` (output line 56: `["tasks","lab:t1",{"snooze":"true"}]`). The build sends Remove to the question before `write`, so no Remove press writes.
- Case 12: today both notes give "key followup[0].done is not declared by the schema of this file" (output lines 69 and 70), as the brief's premise 2 says.

## The cases' first run, on the unchanged tree

The case-run program and its config are quoted whole at the end; "out N" is line N of its output. The guarded test files were also run whole on the unchanged tree: `npx vitest run tests/server/edit/writes.test.ts tests/server/core/changes.test.ts tests/routes/edit/undo/undo.test.ts tests/data/snapshot/normalise.test.ts tests/data/snapshot/schema-rules.test.ts --reporter=dot` printed `Test Files  5 passed (5)` and `Tests  187 passed (187)`.

1. `writeFollowup(dir, config, { id: 'alpha' }, '0', 'done')` on `followup:\n  - { do: ask Ann }`: out 5, `changed: ["followup"]`, the file's block gone (`"file":""`).
2. `writeFollowup(..., '0', 'reopen')` on `- { do: ask Ann, done: true }`: out 6, `changed: []`, the file unchanged.
3. `'delete'` on two notes and on one: out 7 and 8, `changed: []` both, the files unchanged.
4. `'supervisors', ['ann', 'bob']`: out 9, `threw: TypeError: value?.trim is not a function`, the file unchanged.
5. `writeSubtask(..., '0', 'lead', ['ann'])` on `- { do: write it, deadline: 2026-12-01 }`: out 10, `changed: []`, unchanged (the action falls to `{ done: false }`).
6. `writeSubtaskAdd(..., { do: 'x', collaborators: ['ann'], done: true, deadline: '2026-01-01', extra: 'y' }, FOLLOWUP)`: out 11, `followup:\n  - { do: x }\n`.
7. `subtaskWrite` and `followupWrite` with `action: 'lead'` and `value` `'ann'`, `3`, `['ann', 4]`, `['']`, `['ann']`: out 24-33, `null` for every one, the valid list included (the action is in neither enum today).
8. Records: Done gives out 20, `{"field":"0","before":{"do":"ask Ann"},"after":null,"undo":"delete"}`; Delete gives out 21, `[]`.
9. `npx vitest run tests/routes/edit/undo/undo.test.ts -t "a follow-up done|an added follow-up" --reporter=verbose`: `<check mark>` for 'an added follow-up' in 'the primary hub' and in 'a second hub', `Tests  4 passed | 52 skipped (56)`.
10. `followups([{ do: 'a', done: true, lead: 'ann', supervisors: ['bob'] }, { do: 'b', done: 'yes' }])`: out 36, `[{"key":"0","do":"a"},{"key":"1","do":"b"}]`, no `done` and no people.
11. `subtasks([{ do: 'a', collaborators: ['ann'] }])` and `entrySubtasks` of the same: out 37 and 38, `[{"key":"0","do":"a","done":false}]` both; the ticker's entry lines, out 45, carry no people; `grep -n "subtaskFieldsShape" src/lib/state/boards/collection/index.ts` prints `726:const subtaskFieldsShape = z.object({` and `740:        const record = readAs(subtaskFieldsShape, item);`.
12. `buildOneHub` of a manifest whose `followup:` holds `{ do: a, done: true, lead: [ann] }`: out 69, two findings, `followup[0].done` and `followup[0].lead` "is not declared by the schema of this file", line 6; `{ do: a, done: maybe }`: out 70, the `followup[0].done` not-declared finding, line 6.
13. Ticker over a project whose third note is `{ do: closed, done: true }`: out 44, the line "pann - closed" is in the Tasks lines.
14. `actionsFor` of a follow-up line: out 53, `["done"]`; `act(..., 'done')` sends `writeFollowup({ id: 'lab:pann' }, '0', 'done')` (out 56); `act(..., 'remove')` on a follow-up sends nothing.
15. `actionsFor` of the task entry line: out 54, `["status:doing","status:done","agent","snooze:7","snooze:30","snooze:hide"]`, no Remove; `act(..., 'remove')` writes `writeEntry("tasks", "lab:t1", { snooze: "true" })` (out 56).
16. `actionsFor` of a subtask line: out 55, `["done","agent","snooze:7","snooze:30","snooze:hide","del"]`.
17. Self `lab:ann`; Mine only: out 46, "pbob: mine" (its line names `lead: [ann]` under bob's project) hidden, and "pann: theirs" (`lead: [bob]` under ann's project) kept: the lines follow their projects.
18. Role Supervisor unticked, Mine only off: out 48, "pann - sup" (`supervisors: [ann]` under ann's project) kept.
19. `mineHides`: out 46 and 47, `true` here because pbob is not ann's; no fixture of the first run has every record the user's.
20. Tier `research` unticked: out 49, every project's line hidden, `hidden: 8`.
21. A line naming `lead: [zed]` (no hub holds zed): out 44, "pbob: ghost" is drawn with its project; out 57 shows a row carries no names.
22. `filter: { pillars: ['lab:a'] }`: out 50, nothing hidden (`hidden: 0`, every lane kept).
23. The same run: pbob (`pillars: [a, b]`) kept, as everything is.
24. Every pillar unticked: out 51, nothing hidden.
25. Read: no pillar rule exists (`grep -n pillar src/lib/state/boards/focus/filter.ts` prints nothing), so a scheme is never hidden by a pillar.
26. Out 50: "A talk: slides" (an entry of a file declaring `pillars` with `pillars: [a]`) kept.
27. `focusFilter({})`, `focusFilter({ filter: { pillars: 'a' } })`, `focusFilter({ filter: { pillars: ['a'] } })`: out 52, each `{"mine":true,"roles":[],"tiers":[],"hubs":[]}`, no `pillars` key.
28. Look on landing: the Focus view's Filter list in a workspace with no pillar (no Pillar group drawn), then with two hubs each holding pillars (each pillar row with its hub's name after its title). First run: read, `FocusFilter.svelte:68-123` draws the groups mine, role, tier and hub only.
29. `rowMaker('t').row` of "pbob: mine" (`lead: [ann]`, `collaborators: [bob]`): out 57, the row has no field for names.
30. `docs/palette.md` lines matching `waiting` or `(w)`: out 73, `[]`; `grep -n '"(w)"\|waiting' config/catalogs/glyphs.yml config/catalogs/icons.yml` prints nothing.
31. Look on landing: Focus, a project card waiting on a person and on a project, in the light and the dark theme: both WAITING ON tags red, each with the clock glyph. First run: read, `CardLinks.svelte:85-90` gives the waiting kind `tone: 'amber'`, and `glyphOf` (`:140-146`) the team glyph for a person and the related glyph for a project.
32. Look on landing: Focus, a lane card waiting on a person, and a blocked lane card: the waiting line red with the clock glyph, and Blocked red with the glyph. First run: read, `LaneCard.svelte:201-203` draws `<p class="wait">{wait}</p>` in `--muted-txt` (`:296-302`).
33. Look on landing: a project page's Follow-ups block with a done note (struck through, Reopen and Del), an open note (Done, Edit and Del), and a note and a subtask line naming people (the names after the text, muted and small). First run: read, `Followups.svelte:159-184` draws Done and Edit only, and neither block draws people.
34. Look on landing: the add form of a follow-up and of a subtask on a card and through Quick add on Focus (What, the date, Lead, Supervisors, Collaborators), the deadline form (Deadline alone), and the edit form of a line naming people (the three picks start from the line's people; a save that changes one writes that field alone). First run: read, `DatedForm.svelte:96-123` asks What and the date, `LineForm.svelte:38-53` the text and the date.
35. Look on landing: the Filter list with the Pillar group between Tier and Hub. First run: as 28.
36. Look on landing: the Tasks section, a task entry's Remove pressed: the question under the section naming any file that refers to the entry, nothing written; No closes it with nothing written; yes deletes the entry and the board's outcome line says so. First run: no Remove (case 15).
37. Undo of a people write on a note: on the unchanged tree a people body is no write (case 7), so there is nothing to undo; the row needs H3.
38. Undo of a follow-up Delete: `delete` is no follow-up action today (case 3 writes nothing); the row needs H3.
39. `-t "a follow-up done"` (case 9's run): `<check mark>` for 'a follow-up done' in both hubs.
40. `'lead', ['a,b']`: out 12, `threw: TypeError: value?.trim is not a function`.
41. `'lead', ['ann', 'ann']`: out 13, the same throw; `['']` is case 7.
42. Reopen on a note not done: out 14, `changed: []`, unchanged; a subtask's Reopen on an open line: out 15, `changed: []`, unchanged.
43. Two hubs `lab` and `home`, each with pillar `a`, `pillars: ['lab:a']`: out 65, every lane and line of both hubs kept.
44. `rowMaker('t', () => 'the file has unsaved text').row` of the task line: out 58, every button but agent disabled with the words; no Remove to disable.
45. Look on landing: Remove pressed on a second task entry while the first's question is open (the question names the second alone, and yes deletes only it); an entry taken away by a watcher push while its question is open (yes answers as the card's Delete does). First run: no Remove (case 15).
46. Delete of a key past the list's end: the follow-up gives out 16, refused "there is no follow-up note 1"; the subtask gives out 17, refused "there is no subtask 1"; Delete of key `'0'` after an earlier line was taken out: the subtask takes out the line now at 0 (out 18, `subtasks:\n  - { do: ask Cy }`), the follow-up writes nothing today (out 19).

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| First run of every case | DONE | the case-run program below, `Test Files  1 passed (1)`, `Tests  7 passed (7)`; the two undo rows, `Tests  4 passed | 52 skipped (56)` |
| Items 1 to 11 | NOT DONE | handed back, H1 to H4; `git status --short` prints only this report |
| Verify 1 to 7 | NOT DONE | no change to verify; `npm run test:quick` was not run (0 runs of the list, no whole-suite command) |

## Commands that wrote a file other than through Edit or Write

None in the worktree. In the scratchpad: `mv vitest.cases.ts vitest.cases.mts` renamed the case program's config, and `npx vitest run --config .../vitest.cases.mts --configLoader runner > first-run.txt` wrote the output file. The suite's fixtures (`hub`, `plantScratch`) made scratch hubs under the system temporary directory. The scratch folder `o93/` (the program, its config, its output and `g8-draft.ts`) is deleted; the program, the config and the output are quoted whole below, and `g8-draft.ts` is quoted whole in the next section.

## Files with line counts

No file of the worktree changed. Files the hand-back measures: `tests/server/edit/writes.test.ts` 861, `tests/routes/edit/undo/undo.test.ts` 866 (`wc -l`).

## Judgment calls the brief left open

H1 to H4, each with a recommendation. No other call was made, since nothing was built.

## Host- or user-visible changes

None.

## Changed lines of existing assertions, allow lists and predicates

None.

## Renamed guarded tests

None.

## Head comments of changed files

None changed.

## Anything in the brief that was wrong or impossible

H1 (writes.test.ts past 880 in a folder of 10), H2 (undo.test.ts past 880), H3 (cases 37 and 38 need `tests/routes/edit/write-fixture.ts`, outside the write list), H4 (the three subtask readers differ, output lines 39 and 40).

## The case-run program, first run

The config, `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o93/vitest.cases.mts`:

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

The program, `.../scratchpad/o93/cases.test.ts`, run from the worktree's root with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npx vitest run --config <scratchpad>/o93/vitest.cases.mts --configLoader runner`:

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

Its output, whole, numbered as "out N" above (the vitest pass mark written `<check mark>`; `<scratch>` stands for `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad`):

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

## The line-count draft

`g8-draft.ts` (scratchpad), the text counted in H1 and H2: its first block is the follow-up describe's tail, its second the new `it`, its third the two `INSIDE_ROWS` rows; the `====` lines separate the blocks.

```ts
            const done = writeFollowup(...into, host, '0', 'done');
            expect(done.changed, row.name).toEqual(['done']);
            expect(readFileSync(file, 'utf8'), row.name).toContain(
                '- { do: ask Ann again, after: 2026-11-30, done: true }'
            );
            const open = writeFollowup(...into, host, '0', 'reopen');
            expect(open.changed, row.name).toEqual(['done']);
            const still = writeFollowup(...into, host, '0', 'reopen');
            expect(still.changed, row.name).toEqual([]);
            const team = writeFollowup(...into, host, '0', 'supervisors', ['ann', 'bob', 'ann']);
            expect(team.changed, row.name).toEqual(['supervisors']);
            const quoted = writeFollowup(...into, host, '1', 'lead', ['a,b']);
            expect(quoted.changed, row.name).toEqual(['lead']);
            expect(readFileSync(file, 'utf8'), row.name).toBe(
                `${original}followup:\n  - { do: ask Ann again, after: 2026-11-30, supervisors: [ann, bob] }\n  - { do: chase the call, after: 2026-12-01, lead: ["a,b"] }\n`
            );
            const dropped = writeFollowup(...into, host, '0', 'supervisors', []);
            expect(dropped.changed, row.name).toEqual(['supervisors']);
            const removed = writeFollowup(...into, host, '0', 'delete');
            expect(removed.changed, row.name).toEqual(['followup']);
            expect(readFileSync(file, 'utf8'), row.name).toBe(
                `${original}followup:\n  - { do: chase the call, after: 2026-12-01, lead: ["a,b"] }\n`
            );
            const last = writeFollowup(...into, host, '0', 'delete');
            expect(last.changed, row.name).toEqual(['followup']);
            expect(readFileSync(file, 'utf8'), row.name).toBe(original);
            const kept = writeSubtaskAdd(
                ...into,
                host,
                { do: 'x', done: true, collaborators: ['ann'], snooze: '2026-12-01' },
                FOLLOWUP
            );
            expect(kept.changed, row.name).toEqual(['followup']);
            expect(readFileSync(file, 'utf8'), row.name).toBe(
                `${original}followup:\n  - { do: x, done: true, collaborators: [ann] }\n`
            );
====
describe('writing the people of a subtask line', () => {
    it('sets and drops the people of a subtask line', { tags: ['slow'] }, () => {
        const world = personalWorld();
        const file = fileOf(world, 'alpha');
        const original = readFileSync(file, 'utf8');
        const into = [world.root, world.config] as const;
        const host = { id: 'alpha' };
        writeSubtaskAdd(...into, host, { do: 'write it', deadline: '2026-12-01' });
        const lead = writeSubtask(...into, host, '0', 'lead', ['ann']);
        expect(lead.changed).toEqual(['lead']);
        expect(readFileSync(file, 'utf8')).toBe(
            `${original}subtasks:\n  - { do: write it, deadline: 2026-12-01, lead: [ann] }\n`
        );
        const dropped = writeSubtask(...into, host, '0', 'lead', []);
        expect(dropped.changed).toEqual(['lead']);
        expect(readFileSync(file, 'utf8')).toBe(
            `${original}subtasks:\n  - { do: write it, deadline: 2026-12-01 }\n`
        );
    });
});
====
        {
            name: 'a people write on a follow-up note',
            body: {
                kind: 'followup',
                target: { id: `hub:${REPOSITORY_ID}` },
                key: '1',
                action: 'supervisors',
                value: ['ann', 'bob']
            }
        },
        {
            name: 'a follow-up deleted',
            body: {
                kind: 'followup',
                target: { id: `hub:${REPOSITORY_ID}` },
                key: '1',
                action: 'delete'
            }
        }
```

## The case-run program, last run

Not run: nothing was built.

## Doc text

Not written: nothing was built. `docs/data-map.md` is unchanged in the worktree.
