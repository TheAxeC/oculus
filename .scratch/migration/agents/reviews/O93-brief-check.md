# Step O93 brief check (on main at 744de6aaf)

`git log -1 --format=%h` in `~/workspace/oculus` printed `744de6aaf`. `plan.md` has no "Goal" section: `grep -n -i "goal" .scratch/migration/plan.md` finds no `## Goal` heading, and the file opens "Execution ledger for `tools/oculus/DESIGN.md`". Every "the goal" below is the O93 step line (`plan.md:851`) together with rulings 472 to 476, 480 and 482 (`plan.md:2871-2882`). The brief's ruling texts match the ledger's word for word.

## 1. Names

- `FollowupAction`, `SubtaskAction`: `git grep -n "FollowupAction\|SubtaskAction" -- src tests config docs README.md`. Hits outside the paths:
  - `src/lib/server/edit/writes.ts:221` (`export type { SubtaskAction, SubtaskTarget } from './writes/subtasks.ts';`): a type re-export. Stays true.
  - `src/lib/server/edit/writes/bodies.ts:15` (the import; the write ranges are 40-80 and 300-335): stays true.
  - `src/lib/state/client/writes.svelte.ts:44`, `:48`, `:56`, `:59` (imports; the write range is 330-380): stay true.
  - `docs/apps.md`. The type name does not appear there, but `git grep -n "takes the note out\|takes it out" -- src config docs README.md` prints `docs/apps.md:441: | \`followup\` | ... \`action\` \`done\` (takes the note out), \`do\` or \`after\`, the last two with the new text or date in \`value\` | no |`. `sed -n 436,444p docs/apps.md` shows `:439`, which lists the subtask actions as `done`, `reopen`, `snooze`, `delete`, `do` or `deadline`, and `:440` and `:442`, the add rows with only `fields.do` and `fields.after`. The change makes all four false: there are new actions, `done` no longer removes the note, there is a list value, and adds now take people and `done`. These writes are open to apps through `src/lib/server/edit/writes/apps/gate.ts:70-73`. `docs/apps.md` is not in the paths, and the rules file ("What every package obeys", the last-but-two bullet) puts what an app builder meets into `docs/apps.md`.
- `subtasksOf`, `SubtaskRow`, `subtaskShape`: `git grep -n "subtasksOf\|SubtaskRow\|subtaskShape" -- src tests`. Hits outside the paths:
  - `src/lib/data/shapes/shapes.ts:280: const subtaskShape = z.object({ key: z.string(), do: z.string() });` and `:289` (the task-reference shape, outside 340-406).
  - `src/lib/server/edit/writes/bodies.ts:298: const subtaskShape = z.object({` and `:550: return readAs(subtaskShape, body);` (the request body shape, outside 300-335).
  - Neither is the ticker's line reader, so the change does not make them false. They do make verify item 5 impossible as written (see 4).
- The line readers: `git grep -n "followups:" -- src tests` and `git grep -n "entryFollowups\|entrySubtasks" -- src` find a third subtask-line reader that the brief does not name. It is `entrySubtasks` at `src/lib/state/boards/collection/index.ts:737`, with its own `subtaskFieldsShape` at `:726-731` (`do`, `done`, `deadline`, `snooze`). `src/lib/views/shared/forms/entry/entry-actions.ts:183` and `:221` use it for the Subtasks block of an entry's card. The file is not in the paths. Item 1's "the line shape exists once" is false while it stays. An entry's card row would also have no people to draw (item 4), since this reader drops the three fields.
- `FOLLOWUP_NOTES`: `git grep -n "FOLLOWUP_NOTES" -- src tests config docs README.md` gives only `src/lib/data/snapshot/schema/record.ts:256` and `:272`. No hit outside the paths.
- `dueFollowups`: `grep -n "...dueFollowups..." -r src tests` gives `ticker.ts:36`, `:64`, `:406`, `:428`, `:451` and `Followups.svelte:85`. All are inside the paths.
- `FocusFilter`: `git grep -n "FocusFilter\b" -- src tests config docs README.md` hits only `filter.ts`, `Focus.svelte` and `FocusFilter.svelte`, all in the paths.
- `TickerRow`: `git grep -ln "TickerRow\b" -- src tests config docs README.md`. Outside the paths it hits `ui/display/ticker/TickerGroup.svelte`, `reveal.svelte.ts`, `views/boards/focus/CommandCenter.svelte`, `CommandCenterView.svelte` and `career/career-rows.ts`. An added optional field makes none of them false.
- `followup_done_tip`: `git grep -n "followup_done_tip" -- . ':!config/local.yml'` hits `config/text/views/boards/project.yml:25: followup_done_tip: done; takes the note out`, `rows.ts:226` and `Followups.svelte:171`, all in the paths. The words "takes the note out" become false once Done sets `done: true`. The brief names no rewording of this key, and no words for the follow-up's Reopen and Del tips or for the three pick labels.
- The glyph `waiting`: `grep -n '"(w)"\|^ *waiting' config/catalogs/glyphs.yml config/catalogs/icons.yml` prints nothing (rc=1). `git grep -n "^ *waiting\b\|_glyph: waiting" -- config ':!config/local.yml'` hits only text keys of other groups (`config/text/app.yml:318`, `account-setup.yml:96`, `debug.yml:92`) and the vocab status flag (`config/options/catalogs/vocab.yml:107`). No glyph collides.
- Follow-up readers outside the paths: `git grep -n "\.followups\b\|followups(" -- src` hits `src/lib/state/forms/schema.ts:394` (`followupText`). It lists every note in the manifest editor's read-only Follow-ups box, while `openSubtasks` at `:403-409` filters done lines. After the change a done note is listed there as if open. The comment stays literally true, but what the box shows becomes misleading.
- Help sentences outside the paths:
  - `grep -n "asks What..." docs/HELP.md` prints `docs/HELP.md:285: - The form has a rule above it, a heading and a label over each box. A follow-up is headed "New follow-up" and asks What and Not before; a subtask is headed "New subtask" and asks What and Deadline.` This becomes false when the form asks Lead, Supervisors and Collaborators.
  - `sed -n 296p docs/HELP.md` holds "Under it come the labelled lines: WAITING ON, an amber tag for each value of `waiting-on:`". This becomes false when the tags turn red with the clock glyph.
  - The paths list only `docs/HELP.md` lines 282 and 294.
- `docs/data-map.md:223`: `git show HEAD:docs/data-map.md | grep -n "followup"` prints `219:- \`project.yml\`: \`followup:\` is a list of notes, each \`{ do, after }\`` and `254:`. The number 223 is the main checkout's uncommitted numbering (`grep -n "followup" docs/data-map.md` prints `223:`; `git diff --stat HEAD -- docs/data-map.md` shows 19 insertions). The report's "Doc text" section asks for the HEAD numbering, which is 219.

Findings:
- `docs/apps.md:439-442` become false and are not in the paths.
- `src/lib/state/boards/collection/index.ts:725-751` (`entrySubtasks`, `subtaskFieldsShape`) is a third line reader. It is not named, and it is not in the paths.
- `docs/HELP.md:285` and `:296` become false and are not in the paths.
- `project.action.followup_done_tip` becomes false, and the brief names no new words for it.
- `src/lib/state/forms/schema.ts:393-401` (`followupText`) would list done notes in the manifest form. It is not named.
- `docs/data-map.md:223` is 219 at HEAD.

## 2. The step line

- "a subtask and a follow-up line take optional `lead`, `supervisors` and `collaborators` (people keys)": items 1, 2 and 3.
- "asked by the line form and Quick add as multi-picks": item 4 (`DatedForm`, so the card's form and Quick add, and `LineForm`).
- "shown on the line and its Focus row": items 4 and 5, and decision 2.
- "read by Mine only and Role": item 7.
- "a line with none taking its record's": item 7.
- "a follow-up gets `done: true` as a subtask has": items 1, 2 and 3.
- "Done keeps it struck through with Reopen": items 3 and 4.
- "a separate Del removes it": items 3 and 4.
- "its Focus row gets Done and Remove": item 6.
- "a done follow-up leaves the Focus lists": item 5 (`dueFollowups` skips a done note).
- "a task entry's Focus row gets Remove, which asks first as the card's Delete does and deletes the entry": item 6.
- "a Pillar checklist in the Focus filter beside Role, Tier and Hub": item 8.
- "keeping the records whose `pillars:` hold a ticked pillar, a record with no pillar always kept": item 8.
- "the Focus lane card's waiting line in red with a waiting glyph": item 9.
- "the project card's waiting tags red with the same glyph": item 9.

Findings: none.

## 3. Premises

- 1. `sed -n 340,406p src/lib/data/shapes/shapes.ts`; `grep -n "export function followups\|export function subtasks\|const noteShape\|const lineShape" shapes.ts` printed `351`, `360`, `374` and `395`. `noteShape` is `{ do, after }`. `followups()` runs from 353 to 372 and `subtasks()` from 374 to 406. `sed -n 305,330p model-entities.ts` shows `Followup` at 312 and `Subtask` at 323. `grep -n "subtasks(\|followups(" normalise.ts` printed `275`, `277`, `495` and `496`. All of this matches.
  - `sed -n 50,180p ticker-lines.ts` shows `dueFollowups` at 109-124, `SubtaskRow` at 127, `subtaskShape` at 136, `subtasksOf` at 149 and `subtaskLines` at 157-177. `TickerItem` (56-86) carries no people. This matches.
  - Two things differ. `ticker.ts:507-508` is the use, as the brief says, but "The two readers read the same line shape" is incomplete: `entrySubtasks` (`collection/index.ts:737`) is a third reader. Also, `subtaskShape` in ticker-lines uses `wordShape`, which reads a missing field as `''`, where `lineShape` reads it as undefined.
- 2. `sed -n 245,280p src/lib/data/snapshot/schema/record.ts` shows `FOLLOWUP_NOTES` at 256-267 with `do`, `after` and `additionalProperties: false`. `hub.ts:41-45` holds the `followup` field. `manifest-schema.yml:66` is `type: keymap`, and `schema/manifest.ts:47` has `keymap: 'raw'`. `findings.yml:342-343` are `subtasks_help` and `followup_help`. This matches.
- 3. `cat -n src/lib/server/edit/writes/subtasks.ts` (339 lines) shows `SubtaskAction` at 104 and `FollowupAction` at 140, and follow-up `done` calling `deleteSubtask` (157-158). `entry-edit/subtasks.ts` shows `setSubtask` at 190-246 dropping null, `''` and false, `LINE_FIELDS` at 42-45, and `addSubtask` at 301-306 copying the text fields and a subtask's `done`. `asFieldValue` is at `yaml-edit.ts:160` and `FieldValue` at `yaml-values.ts:31`. `flowScalar` at `lines.ts:140-149` writes a list as JSON, and `renderFlowList` is at `lines.ts:155`. Mirror types are at `stores/shapes.ts:208-217` and `:313-330`; bodies at `bodies.ts:45-75`; the route at `writes.ts:512-532`; the client at `writes.svelte.ts:349-370`; undo at `undo.ts:520-534`. This matches, with two differences:
  - A flow line is rendered by `renderFlowMap` at `src/lib/server/edit/entry-edit/render.ts:10-12`, which calls `flowScalar` (`git grep -n "renderFlowMap" -- src tests` hits `subtasks.ts:239`, `:309` and `:318`). Writing `[a, b]` therefore means changing `render.ts` (or `lines.ts`), and neither is in the paths. `flowScalar` is also used by `merge.ts:100`, `:112`, `:215`, `:234` and `:249`, so a change there would change other write kinds' bytes (G8).
  - The zod shapes the step changes are not only `:313-330`. The subtask action enum is `bodies.ts:302`, inside `subtaskShape` at 298-304. Line 302 is inside the write range 300-335, but 298 is not.
- 4. `cat -n Followups.svelte` shows a follow-up row with Done (`writeFollowup(..., 'done')`) and Edit. `grep -n "class:done" Subtasks.svelte` printed `164`, and its rows draw Reopen or Done, the snoozes, Edit and Del. `DatedForm.svelte` asks What and the date. `LineForm.svelte` edits text and date. `RecordPick.svelte` draws `DatedForm` at `:190`, and `QuickAdd.svelte:68` draws `RecordPick`. This matches.
- 5. `sed -n 1,40p MultiSelect.svelte`; `sed -n 235,270p src/lib/state/forms/schema.ts` shows `recordChoices` at 246; `addressOfId` is at `hub-names.ts:68-71`. This matches.
- 6. `grep -n "^roles:" -A5 config/catalogs/vocab.yml` printed the four rows (`lead`, `supervisors`, `collaborators`, `other` with no field). `roles.ts` shows `roleOf` at 71, `isMine` at 100, `entryPeople` at 122 and `isSelfByKey` at 127. This matches.
- 7. `cat -n src/lib/state/boards/focus/filter.ts` (500 lines) shows `FocusFilter { mine, roles, tiers, hubs }` at 61, `KEY = 'filter'`, `keptSnapshot` at 209-229, `sectionsOf` at 262-277, `mineWouldHide` at 410-467 and no pillar. `FocusFilter.svelte` is 283 lines, and `Focus.svelte:226` draws it. This matches.
- 8. `grep -rn "pillarIds" src/lib` and `sed -n 150,190p links.ts` show `projectPillar` at 163 and `fundingPillar` at 181. `grep -rn "field: pillars" config tests/fixtures --exclude=local.yml` printed nothing (rc=1). `Pillar` is at `model-entities.ts:585`. This matches.
- 9. `sed -n 120,386p rows.ts` shows `actionsFor` (subtask: Done, agent, snoozes, Del; follow-up: Done alone; entry: statuses, agent, snoozes) and `write` sending `writeFollowup(host, note, 'done')`. `DeleteAsk.svelte` takes `collection` and `id`, and `RecordCard.svelte:317-323` draws it. This matches.
- 10. `cat -n ticker-rows.ts` shows `TickerRow { id, glyph, label, tail?, tone?, mark?, actions?, plain? }`. This matches.
- 11. `grep -n "wait" LaneCard.svelte` printed `202: <p class="wait">{wait}</p>`, and `:296-302` gives `.wait` the muted colour. `CardLinks.svelte:88-90` has `tone: 'amber'`. `icons.yml:138-139` hold `stale: hourglass` and `deadline: alarm-clock`. `node_modules/lucide-static/icons/clock.svg` exists, and the package's version is `1.46.0`. There is no `(w)`. This matches.
- 12. `grep -rln "followup\|follow-up" tests` and the titles show:
  - `writes.test.ts:291` describe and the it at 292-294, tagged slow.
  - `changes.test.ts:322-323`, with the done row at 360.
  - `undo.test.ts:373-410`, with 'a follow-up done' and 'an added follow-up'.
  - `normalise.test.ts:98`, `:129` and `:307`.
  - `schema-rules.test.ts:319`, with no followup row (rc=1).
  - `grep -rln "focusPage\|actionsFor\|dueFollowups\|subtaskLines" tests` printed nothing (rc=1), and `grep -n -i "focus filter" .scratch/migration/agents/guarded.md` printed nothing (rc=1).
  - All of this matches. One addition: the undo row 'an added follow-up' is already in `INSIDE_ROWS`, which 'writes the project of a folder of the workspace inside $hub ... and takes it back: $name' (`undo.test.ts:416-431`) runs, asserting the file back as it was.
- 13. `awk` over the "Paths this step writes" sections of `briefs/O88.md` and `briefs/O91.md`. Both steps are in flight (`orchestrator-state.md:26-45`). The ranges the brief quotes are right, but "This step writes none of those lines or files" is false:
  - O88 writes `tests/data/snapshot/normalise.test.ts` (its `intro:` inputs, at lines 58 and 236 on main), which O93 also writes.
  - O88 and O91 both write `docs/diagrams/*.dot` and `*.svg`, and O91 writes `docs/palette.md`. O93 regenerates all of these.

Findings:
- Premise 1: the third reader (`entrySubtasks`) is missing.
- Premise 3: the flow line is written through `render.ts` `renderFlowMap`, and `render.ts` is missing from the paths.
- Premise 13: `tests/data/snapshot/normalise.test.ts`, `docs/palette.md` and `docs/diagrams/*` are shared with O88 or O91, though the brief says no file is shared.

## 4. Cases and checks

- Cases 1 to 5, 8, 10 and 12: consistent with the rules file.
- Case 6: consistent, but item 11 does not place it. Its G8 bullet lists Done, Reopen, Delete and the people writes, and no add with people.
- Case 7: the rules file's "Every id or key a step introduces is checked ..." and "A write that edits a file's text re-parses its own result" fit. The case names neither the layer that refuses (the body shape in `bodies.ts`, the writer, or both) nor the refusal's words. A new refusal sentence would go in `config/text/server.yml`, which is not in the paths. Item 11 gives the case no test home.
- Case 9: the row already exists ('an added follow-up', `undo.test.ts:403-409`). Item 11's "`tests/routes/edit/undo/undo.test.ts` gains the row ..." would duplicate it, against the rules file's guarded-test rule ("one test per unit it covers ... one row per input that gives a different outcome", "What every package obeys").
- Case 11: its second half, the ticker reading through the same reader, is not a test of item 11 (no guarded entry covers the ticker), yet the brief calls cases 1-12 tests.
- Cases 13, 14, 16 to 21 and 23 to 27: consistent, as case-run programs ("A case of the brief may be run by a case-run program", "What every package obeys").
- Case 15: "pressing it opens the question for that entry and writes nothing until yes; yes deletes the entry; No closes the question with nothing written". This needs a DOM: the press, `DeleteAsk`'s `Confirm` and the answer. The rules file says "A builder runs no page" and "A behaviour that needs a DOM (a press, a focus, an effect) is seen at the look on landing" ("What every package obeys"). The case is listed among the case-runs, and look case 36 covers only the question being shown, not yes or No.
- Case 22: "its band and Awaiting rows". The band is drawn from collection entries (`collectionLanes`, `filter.ts:274`), so a project has no band rows. The case asks the builder to check something that does not exist.
- Case 28: the Pillar group is built inside `FocusFilter.svelte`'s `$derived` list (see `FocusFilter.svelte:86-121`), a component. A case-run over "the snapshot builders and the filter" cannot run it, and by the same DOM bullet its proof is a look. It is not among the looks 31-36.
- Case 29: consistent, run through `rowMaker` of `rows.ts`.
- Case 30: consistent. "the ASCII theme draws `(w)`" is read from `glyphs.yml`.
- Cases 31 to 36: consistent ("A step whose change a reader can see is looked at on screen").
- Verify item 5: `git grep -n "subtasksOf\|SubtaskRow\|subtaskShape" -- src tests` "prints nothing". On main it prints the two unrelated `subtaskShape` of `shapes.ts:280` and `bodies.ts:298`, both outside the paths, so the check cannot pass. The rules file also bars the builder from `git grep` ("Where you work": the git commands are `git status`, `git diff` and `git show`).
- Verify item 2: `wc -l src/lib/state/client/writes.svelte.ts` printed `877`. The rules file's size bullet asks for a split by concern of a file that would pass 880, and the step adds list values to `writeSubtask`, `writeFollowup`, `writeLine`, `addSubtask` and `addFollowup`. `git ls-files src/lib/state/client` shows 10 items, so the folder rule forbids a new file beside it. The brief allows for a split only for `filter.ts`. No path covers a split of `writes.svelte.ts` into a subfolder.

Findings:
- Case 15 and case 28 can only be proved at a look, yet are listed as case-runs. Case 15's yes and No have no look.
- Case 22's "band" rows do not exist for a project.
- Case 9 duplicates an existing row, through item 11's "gains the row".
- Cases 6, 7 and the second half of 11 have no home in item 11, though "Cases 1-12 are tests (item 11)".
- Case 7 names neither the refusing layer nor its words, and `config/text/server.yml` is not in the paths.
- Verify item 5 cannot pass and uses a git command the builder may not run.
- `writes.svelte.ts` at 877 lines in a folder of 10 items has no split path.

## 5. The question

- Case 1: no. It asserts `done: true` written.
- Case 2: no.
- Case 3: no.
- Case 4: no. It asserts the inline form and the drop on `[]`.
- Case 5: no.
- Case 6: no.
- Case 7: yes. It can pass with the refusal made only by the route's body shape while `writeSubtask` and `writeFollowup`, which `restoreSubtask` and `writeSubtaskAdd` reach from the undo path, accept a scalar or a number. `asFieldValue` takes a number, and `setSubtask` writes it.
- Case 8: no.
- Case 9: no after the change (an undo left on `done` would leave `done: true` and the file would differ). It also passes on the unchanged tree, since the row exists.
- Case 10: no.
- Case 11: yes. With `subtasksOf` gone and the ticker on `subtasks()`, both halves pass while `entrySubtasks` (`collection/index.ts:737`) still reads lines with its own shape. The line shape does not then exist once, and an entry's card row cannot show people.
- Case 12: no.
- Case 13: no.
- Case 14: no.
- Case 15: yes. A case-run can show only that `actionsFor` gives Remove last. The question, yes and No are not run.
- Case 16: no.
- Case 17: no, if run through `focusPage`.
- Case 18: no.
- Case 19: no.
- Case 20: no.
- Case 21: no.
- Case 22: no, apart from the "band" part, which checks nothing.
- Cases 23 to 27: no.
- Case 28: yes. Read from source, it passes without the group being drawn.
- Case 29: no.
- Case 30: no.
- Case 31: no.
- Case 32: no.
- Case 33: yes, for decision 2. It looks at Done, Reopen and Del but not at a line's people drawn after its text on the card.
- Case 34: yes, for `LineForm`. It covers the add form only, so the edit form's three picks, their start from the line's people and the save that writes each changed field have no case.
- Case 35: no.
- Case 36: no for what it says.
- The step line: it carries no check of its own beyond its rulings.
- Item 1: yes. Verify 5 and case 11 do not reach `entrySubtasks`.
- Item 2: no (case 12).
- Item 3: no for done, reopen, delete and the people writes (cases 1-6). Yes for the refusal (case 7, above) and for the undo of a people write or of a Delete, which no case runs (see 6).
- Item 4: yes. No case shows a line's people on a card row or the `LineForm` picks.
- Item 5: no (cases 13 and 29).
- Item 6: yes. "its yes deletes the entry ... the answer said on the board's outcome line" has no case or look.
- Item 7: no (cases 17-21).
- Item 8: no (cases 22-27), except the drawing (case 28).
- Item 9: no (cases 30-32).
- Item 10: yes. It passes with `docs/HELP.md:285`, `:296` and `docs/apps.md:439-442` left false, since none is in the paths.
- Item 11: yes. The undo row it asks for already exists, and "A subtask row of the same file" does not say whether this is a new `it` or a step inside 'ticks, reopens, edits and removes a line of a manifest', whose `LINE_ROWS` are project kinds, not actions. In the second case the G8-named title would no longer say what it checks.

Findings:
- Case 7, case 11, case 15, case 28, case 33, case 34 and items 1, 3 (undo), 4, 6, 10 and 11 could each pass without the goal being reached, as stated above.

## 6. Implied inputs

This is a code step. Each input below is implied by the step and missing from "Cases", with its expected result.

- The undo of a people write: `restoreSubtask` gets a list in `before` and goes through `setSubtask`. Expected: the earlier list is written back in the form `[a, b]` and the line is byte for byte as before.
- The undo of a follow-up Delete goes through `writeSubtaskAdd(..., before, FOLLOWUP)` (`undo.ts:525-527`). Expected: the note comes back with its `done: true` and its people lists, not reduced to `do` and `after`.
- The undo of a follow-up Done, now a field change through `restoreSubtask`. Expected: `done` cleared and the file as before. The existing row 'a follow-up done' (`undo.test.ts:373-380`) reaches this, but no case names it.
- A people key needing quotes inside the flow list: a comma, a bracket or a brace (`a,b`). Expected: written double quoted, read back as one key, and the re-parse check passing. Decision 1 shows six keys run through `renderFlowList`, none with a comma.
- An empty key or a duplicated key in a people list (`['']`, `['ann', 'ann']`). Expected: refused, or written once; the case should say which. The rules file asks every new key to be checked empty and duplicated.
- Reopen on a note that is not done. Expected: nothing changed and the answer saying so.
- Pillars with two hubs, each with pillar `a`. An entry's `fields.pillars` holds keys while the Pillar rows hold ids. Expected: unticking `lab:a` hides lab's project and entry and keeps the other hub's.
- Remove on a task entry whose file has unsaved text in a source tab. Expected: Remove disabled with the file's words, as `lockedActions` (`rows.ts:120-128`) disables the other buttons.
- Remove pressed on a second task entry while the question for the first is open, or the entry gone by a watcher push while its question is open. Expected: the question names only the latest entry, and a yes deletes only the entry named or answers not found.
- A follow-up Del from the Focus row addressed by position after the list changed under it. Expected: refused as the base check of G8 refuses, or as today's subtask delete behaves. Done no longer deletes, so Del becomes the only position-addressed delete of a note.

Findings: every input above is missing from "Cases".

## 7. ADRs

- `ls -d docs/adr` printed "ls: docs/adr: No such file or directory". `grep -n "adr" .agents/plan.yaml .scratch/migration/orchestrator-state.md` printed nothing. There is no record. The brief says the same.

Findings: none.

## 8. Dictated text

- "`icons.yml` gains `waiting: clock`": `grep -n "waiting: clock" .scratch/migration/agents/briefs/O93.md` finds line 69. Holds: ASCII, and `clock.svg` exists in `lucide-static` 1.46.0.
- "`glyphs.yml` `waiting: \"(w)\"`": the same grep finds line 69. Holds: printable ASCII of one to three characters, as `config/options/catalogs/glyphs.yml` asks.
- Decision 2's separator, "joined by \", \"": `grep -n '", "' .scratch/migration/agents/briefs/O93.md` finds line 157. It holds as a decision. The brief does not say whether the separator is a catalog word, as the rules file's catalog bullet asks for every user-facing string ("What every package obeys"). The tree has both forms: catalog keys such as `config/text/statusbar.yml:60: problems_join: ', '`, and 43 literal `join(', ')` (`git grep -n "join(', ')" -- src/lib/views src/lib/state | wc -l`).

Findings: none that breaks a rule outright. Where decision 2's ", " lives is unnamed.

## Declined to judge

- Whether the Focus filter's line rule and Pillar rule need a guarded entry (item 11's last bullet rests on `spec.md:59` and writes no test). That is Axel's call under the rules file's guarded-test rule.
- Whether a case-run program can import `rows.ts` and `filter.ts`, which import through `$lib` and call `t()`, under `npx tsx`. A run would settle it, and none was made, since this check changes nothing and runs no program.
- How item 7 keeps a line naming the user while its record is dropped by `keptSnapshot`, since the ticker is built over the kept records (`filter.ts:209-229`, `:495-497`). The brief states the behaviour and leaves the mechanism to the builder.
- Whether the merges of `tests/data/snapshot/normalise.test.ts` with O88 and of the regenerated `docs/palette.md` and `docs/diagrams/*` are simple. That judgment belongs to the session's `shared_paths:`.

Agent usage: ab796b16704212b3e, claude-opus-5-5, 278711 tokens, 103 tool uses, 13 min 57 s.

## Closed

Each finding is closed in `agents/briefs/O93.md` by the session.

1. Names, `docs/apps.md:439-442`: "What is on the tree" 14 and item 10 name them, and the paths hold `docs/apps.md` lines 439-442.
2. Names and premise 1, the third reader `entrySubtasks`: premise 1 names it with `subtaskFieldsShape` and its two callers; item 1 has it read through the one reader with its own shape gone and its signature kept; case 11 and verify 5 reach it; the paths hold `collection/index.ts` lines 720-755.
3. Names, `docs/HELP.md:285` and `:296`: premise 14 and item 10 name them; the paths hold lines 282, 285, 294 and 296.
4. Names, `followup_done_tip` and the new words: premise 4 quotes the key; item 4 has it reworded and names the new keys (Reopen and Del tips, the three pick labels, the separator) in `project.yml`.
5. Names, `followupText`: premise 1 names it; item 1 has it leave a done note out; the paths hold `schema.ts` lines 390-412.
6. Names, `docs/data-map.md:223`: premise 14 and item 10 give 219 at HEAD.
7. Premise 3, `renderFlowMap` in `render.ts`: premise 3 names it and the other users of `flowScalar`; item 3 has `renderFlowMap` write a list through `renderFlowList` with `flowScalar` unchanged; the paths hold `render.ts` lines 1-15; `bodies.ts` widened to lines 290-335.
8. Premise 13, the shared files: corrected in premise 13 (`normalise.test.ts` with O88 at separate lines, the generated files regenerated at each landing), and recorded under `shared_paths` in the dispatch entry.
9. Cases 15 and 28 provable only at a look: case 15 keeps the run of Remove's place and target, and look 36 takes the question, yes and No; case 28 is a look.
10. Case 22's band rows: removed from the case.
11. Case 9 duplicating an existing row: case 9 is the existing row run after the change, and item 11 adds no such row.
12. Cases 6, 7 and the second half of 11 with no home: case 6 is a G8 row of item 11; case 7 and the second half of 11 are runs, named in item 11's last bullet.
13. Case 7, the refusing layer and its words: item 3 makes the body shape the gate, answered with `server.write_route.not_a_write` (`writes.ts:712`), no new words; case 7 runs `subtaskWrite` and `followupWrite`.
14. Verify 5: rewritten as three plain greps that reach the three readers and none of the unrelated shapes.
15. `writes.svelte.ts` at 877 lines: item 3 takes the widened types from `stores/shapes.ts`, the file changed in place at or under 880, and a hand-back before any split.
16. The question, cases 7, 11, 15, 28, 33, 34 and items 1, 3, 4, 6, 10 and 11: each closed by the changes above, with looks 33, 34 and 36 widened to the people drawn on a card row, the edit form's picks and save, and Remove's yes and No.
17. Implied inputs: cases 37 to 46 added (the undo of a people write and of a follow-up Delete as tests, the undo of a follow-up Done by the existing row, a key needing quotes, a key twice or empty, Reopen on a note not done, pillars of two hubs, Remove under unsaved text, Remove on a second entry and a vanished entry as a look, a follow-up Del after the list changed); item 3 and item 11 carry what they need. `renderFlowList` was run on the quoted keys and the doubled key; the output is in decision 1.
18. Dictated text, the separator: decision 2 makes it a catalog word of `project.yml`.

