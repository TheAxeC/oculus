# O196 brief check

## Names

1. The brief renames nothing. It adds a writer call (unnamed), a `fields.ts` function beside `numberRefusal` (unnamed) and a `refused` prop on `TextInput` and `SuggestInput`. I grepped the names it touches over `src tests docs README.md utils` and `agents/guarded.md` (`git grep -n -- "<name>"`). The hits outside "Paths this step writes" follow, each with whether the change makes it false.
   - `src/lib/views/system/workbench/settings/Control.svelte:38,140` and `src/lib/views/system/workbench/settings/other-rows/AppControl.svelte:20,112` both draw every top-level row through `FieldControl.svelte`.
     - If the form refusal is computed in `FieldControl` the way `refusedWords` is (`FieldControl.svelte:258-262`, applied to every caller), the top-level text rows change too. Control.svelte's head comment (lines 15-20: "the box is marked refused while the message stands") then stops being the whole story.
     - `Item.svelte:140-141,241` already draws the writer's refusal of a top-level row under the item. The same sentence would then show twice.
     - This contradicts "Not covered: the top-level text rows (`Control.svelte`) ... The step does not change them" (brief:76). See The question 6.
   - `src/lib/ui/forms/NumberInput.svelte:22-25` builds its props as `Omit<ComponentProps<typeof TextInput>, ...>`, so a new `refused` on TextInput enters NumberInput's `Own` type next to NumberInput's own `refused` (line 31). The types are compatible and NumberInput does not forward it, so nothing draws twice.
     - NumberInput's `refused` also blocks Enter and blur (lines 42-48). If TextInput's `refused` does not block, two props with one name have two meanings. The brief does not say whether TextInput's `refused` blocks.
     - NumberInput's head comment at lines 14-16 ("as to a text box: ... draws no words beside it") stays true only if TextInput's `invalid` keeps that meaning. NumberInput is not in the write list.
   - About 60 other callers of `<TextInput` (shell, account-setup, forms and more) and 3 of `<SuggestInput` (`ScheduleDialog.svelte:126`, `shared/forms/entry/edit/FieldControl.svelte:336`, `debug/Console.svelte:217`). An optional prop leaves them unchanged only if nothing is drawn while it is undefined. Not false as long as no wrapper element is added for every caller.
   - `.scratch/migration/agents/guarded.md:335-337` (G96): "a family's draft ends at the push once the Save left the file holding it". It stays roughly true, but the Code line names `saveFile` only for "a change or a secret typed while a Save is out". It needs the new role and `Settings.svelte`'s wiring. The brief covers only the test titles for the edit at landing (brief:84).
   - `.scratch/migration/agents/guarded.md:222-224` (G138): its text is about `sparse: true` families, and `update_tasks` is not sparse (`grep -n sparse config/options/sources.yml` prints nothing). Its Code line does not name `FieldControl.svelte`, `TextInput.svelte` or `SuggestInput.svelte`. The brief has G138 gain a sentence but not those Code names. See Cases and checks 6.
   - Head comments inside the write list that the change makes false. All are writable, but the brief names only writer.ts, saveFile and "each changed head comment":
     - `writer.ts:8-10` ("A push ends a draft ... once the row's value is the draft's and no change is held, which is what a Save of the scope leaves").
     - `scopes.svelte.ts:6-8`.
     - `Settings.svelte:230-231`. It already says a draft ends at "another value", which `writer.ts:113` does not do while a change is held.
     - `FieldControl.svelte:18-19`, `TextInput.svelte:16-18`, `SuggestInput.svelte:22-25`.
     - `tests/state/system/settings/editor-saved.test.ts:4-6`.
     - `tests/state/system/config/sparse-card.test.ts:18-19` ("It does not cover the cards ... the editor draws ..., which the look at landing does"). This becomes false if part 2's render test goes in that file.
   - Docs: `grep -n -i "unsaved change|changed since|not saved yet|refused" docs/HELP.md docs/apps.md docs/data-map.md README.md` finds `docs/HELP.md:501` ("A change is held as unsaved until Save..."). It stays true. No docs page describes the writer's push behaviour or a box refusal.

## The step line

Plan line 1797 (`grep -n '^- O196 ' .scratch/migration/plan.md`).

1. "a Save that lands ends the drafts and drops the changes it wrote, for every edit of a family row (changed 7 to 8; cleared `stale_days` or `last_run`)" maps to item 1, bullets 1 and 3.
2. "scope bar 'No unsaved change', tab no longer marked unsaved, Save off, no 'The file changed since...' sentence, with no reload" maps to item 1, bullet 2.
3. "a family card's text field that has a form (`task_name` and every other form ... a card's text box draws)" maps to item 2 "Covered: every form a card's text field carries (the list above)". The list misses one form, so this part is only partly mapped. See Premises 5.
4. "marked refused and draws its refusal sentence beside the box as a number box does" maps to item 2, bullet 1.
5. "'Bad Name' ... shows 'It must be lowercase letters...' beside the box and stages nothing" maps to item 2, bullets 2 and 3.
6. "each with its test" maps to item 3.
7. "a look on a scratch hub (ruling 790)" has no item in "What to build". Only the Report's "before and after ... for the look" (brief:189) covers it. That is consistent with spec.md:61, where the orchestrator takes the look, but no requirement names the look's states.
8. `plan.md` has no `## Goal` section: `grep -n '^## ' .scratch/migration/plan.md` lists only Steps, Could run in parallel, Rulings, Agents and Blocked. I used the goal given in my task.

## Premises

1. Line numbers and quotes, read with `cat -n` and `sed -n`. All hold, except that troubleOf ends at line 464, not 463 (minor).
   - `scopes.svelte.ts:167-203` saveFile, with `inner.drop(name)` at 198.
   - `writer.ts:96-117` pushed, the kept-draft branch at 104-111, and the `return` at 113.
   - `Settings.svelte:311-320`, the effect that calls `editors.pushed(row)` at 317.
   - `FieldControl.svelte:258-262` (refusedWords), `:319-327` (NumberInput) and `:440-447` (TextInput, `invalid` only).
   - `fields.ts:448-464` troubleOf, `:467-496` formMessage and `:541-546` numberRefusal.
   - `NumberInput.svelte:9-16`, `:57-64`; `TextInput.svelte:16-18`, `:99-100`; `SuggestInput.svelte:22-25`, `:126-127`.
   - `guarded.md:222` (G138) and `:335` (G96), from `grep -n "^- G96\.\|^- G138\."`.
2. Sizes (`wc -l`) all match the brief: 800, 495, 134, 304, 495, 120, 207, 92. `writer.svelte.ts` 30, `Editor.svelte` 303. The spec.md:48 limits hold.
3. G96 and G138 quotes match. `grep -n "FieldControl.svelte|TextInput.svelte|SuggestInput.svelte|NumberInput.svelte" guarded.md` prints nothing, which holds.
4. The existing row 'ends the draft at the push once the scope's Save left the file holding it' (`editor-saved.test.ts:112-120`) does `save`, then `stage.drop(row)`, then a push of the new value. This holds: it never pushes the old value between the drop and the new value.
5. The `form:` walk. I ran a `python3 -I` yaml walk of `config/options/*.yml`, leaving out `options/local.yml`, recursing into `fields:`. It disagrees with the brief:
   - It prints one field-level text form the brief's list omits: `config/options/sources.yml  field  project_docs.name  control=text  form=inner_path` (sources.yml:190-193).
   - Every other field-level row matches the brief: `update_tasks.task` task_name; `latex.literate_recipes.key` and `open.program_ext.key` extension; `latex.program_recipes.key` program; `sign_in.key` row_key; nine `sign_in.*` https_address plus `sign_in.credential_address` https_origin; `slurm.scratch_roots.value` absolute_folder; `recover.partitions.value` partition; `open.program_ext.value` bundle_id with `from=bundle_ids`, a suggesting box.
   - The top-level text rows (`latex.main_file`, `recover.data_dir`, `slurm.cluster_folder`, `code_dir` and others) and the list rows (`file_index.skip_folders`, `audit.skip_folders`, `slurm.log_dirs`, `processes.patterns` and others) match.
   - So "Covered: every form a card's text field carries (the list above)" misses `inner_path` on the project_docs card, and no case names it.
6. "An empty box is not refused by its form." `value-rule.ts:155-159` (`formProblem`) refuses `''` unless `spec.empty` is set, and `update_tasks.task` has no `empty`. The empty case therefore holds only because `fromText` (`fields.ts:388-390`) turns `''` into an absent field, so `boxText` is `''`. The new function must return null for `''` itself rather than reuse `valueProblem` unchanged. The brief states the rule but not this detail.
7. `ls docs/adr` gives "No such file or directory", which holds. The state file has `standards: [.scratch/migration/agents/spec.md]` (`orchestrator-state.md:11`), which holds.
8. The cause the brief gives for part 1, judged by reading `writer.ts`, `scopes.svelte.ts`, `Settings.svelte`, `Editor.svelte`, `writer.svelte.ts`, `scopes/rows.ts`, `groups.ts` and `fs.svelte.ts`. The reasoning holds.
   - With no change held, a draft that differs from the row, and the row unmoved from the draft's base, `pushed` sets the change again (`writer.ts:103-110`).
   - A later push of the saved value finds `made.value` equal to the row and a change held, so it returns at line 113 and the draft stays.
   - `Editor.svelte:108-110` (`stale`: base old, row new) then draws `changedSince`, and `unsaved` draws `editor_unsaved`. That matches both reported symptoms.
   - What the brief does not name is what brings the old-value push after the drop:
     - `groups` (`Settings.svelte:284-298`) reads `merged` from the config channel, `files.userFiles()`, `files.read(scope)` and `scope`. None of them reads `scopes.changes`.
     - Row values come from `merged` (`rows.ts:282`).
     - The `files` channel rereads a root's texts on its own messages (`fs.svelte.ts:370,382,736-738`), separately from the config channel's version. A reread of `.oculus/config.yml` that lands after the write's answer but before the config channel's new merged value would recompute `groups` with the old value after the drop, which fits.
     - So does any instance-state write in that window, since `scope` is derived from `ui.instanceState` (`Settings.svelte:150`).
   - The fix is meant to work whatever the order, so this does not change what to build. But the unit test models one order, and only the look shows the real one.
9. Not rerun: the two browser reproductions, and "A second Save sends a change equal to the file, which writes nothing" (`saveOf` not traced). See Declined to judge.

## Cases and checks

1. Cases 1-3 say the scope bar reads 'No unsaved change' and Save is off, and brief:107 keeps cases 1-4 as tests of item 3. The unit suite cannot see the bar or the Save button, which need the view (spec.md:65, 67), and item 3 asks for one row over the writer and a memory stage. The brief should say which part of cases 1-3 the row covers (the writer's end state) and that the bar, the tab mark and Save-off are the look's. "The builder's first task ... is the first run of every case" cannot be done by a builder for those parts (spec.md:65).
2. Case 5 says a change typed while the Save is out stays held, with "the existing `scopes.client.test.ts` rows" as its check. Those rows (`scopes.client.test.ts:51-90`) cover a `local.yml` port and `downloads` secrets, never a family draft or the writer.
   - The hazard the new code brings is that a writer told "this row was saved" ends the draft of a family row that was edited again while the Save was out.
   - Those rows would not fail if that hazard were real (spec.md:17).
3. Case 6 (refused Save keeps its changes) is listed among "the existing G96 rows" (brief:107). No existing G96 row checks a refused Save: I grepped the titles of `row-writer.test.ts`, `hub-scope.test.ts` and `scopes.client.test.ts`. The only near one is 'names the reasons of a refused Save with no full stop of their own', which is about the wording of the reasons. So case 6 has neither a test nor a quoted run.
4. Item 3 Part 1: "On the unchanged tree it fails, with the change held again". If the row calls the new writer method that tells it what a Save wrote, the unchanged tree has no such method. The run then fails with a TypeError, not "with the change held again", so the quoted failure would not prove the behaviour. The brief should say how the row tells the writer the Save landed in a way the unchanged tree can run, or which failure line counts.
5. The cases do not cover `project_docs.name` (`inner_path`), which "Covered: every form" includes by the step line's wording (Premises 5).
6. Part 2's test is placed under G138, whose subject is `sparse: true` families. `update_tasks` is not sparse, and the boxes changed (`FieldControl`, `TextInput`, `SuggestInput`) are in no entry's Code line. Folding an unrelated behaviour into G138 works as a new entry. spec.md:60 says "A step that needs a new entry stops and asks Axel for it", and the brief does not say why this extension of G138 does not need that.
7. No case asks the builder to check or explain a place the step does not change. Case 12 runs through `NumberInput`, which is unchanged, but its caller `FieldControl` is changed.

## The question

1. Item 1 and its test, one row over the writer and a memory stage. Yes, it could pass without the goal.
   - The row never runs `saveFile` or the wiring in `Settings.svelte`, so it passes if `Settings.svelte` never calls the new method.
   - It also passes if `saveFile` reports keys that do not match `heldKey(row)`. That risk is real for a Hub-scope row, whose key carries `row.slot`, while a `SaveChange` carries only `file` and `key` under the scope file's name.
   - The `scopes.client.test.ts` row is optional ("If the wiring ... needs its own row"). It should be required: a landed Save reports what it sent; a refused one reports nothing; a change typed while the Save was out is not reported.
2. Item 1, "whatever order the view's pushes arrive in". Yes, it could pass without the goal. The row models old-then-saved, and the real trigger was not identified (Premises 8). Only the look proves the end state on the view.
3. Cases 1-3. Yes, as tests they could pass without the goal: the writer's state can be clean while the bar still counts a change, if the scopes' `inner.drop` and the writer disagree.
4. Case 4. As a writer row, no: it fails if the draft is held again.
5. Cases 5-7. Case 5 yes: its check does not exercise the family path (Cases and checks 2). Case 6 yes: there is no check (Cases and checks 3). Case 7 no: the existing row 'holds a kept draft again at a push...' fails if a kept draft is no longer held again.
6. Item 2 "Not covered: Control.svelte". Yes, it could pass while the goal's scope is overrun.
   - With the refusal computed in `FieldControl`, the top-level text rows with a form change too: beside-box words as typed, plus Item.svelte's line after settle, so the sentence shows twice. If TextInput's `refused` blocks like NumberInput's, Control's `settle` never runs, so `markRefused` is never set.
   - No case or test looks at a top-level row.
   - Keeping them unchanged needs a gate from `Cards.svelte` (`Cards.svelte:285-305`), which is not in the write list.
7. Item 2's test, 'Bad Name' rendered through `drawnItem`, checking `aria-invalid` and the sentence beside the box. Yes for the sentence: the unchanged tree already contains it in the foot list ('Entry 1, task: It must be...', `Editor.svelte:235-243`), so a `toContain(sentence)` passes without the goal. The row must tell the box's `role="status"` element from the foot list's, for example by the sentence appearing twice or by the element after the input. The `aria-invalid` check does fail on the unchanged tree.
8. Case 9 ('litwatch' draws neither). It is an audit: it passes on the unchanged tree. Fine, as long as it is labelled as one (brief:172).
9. Case 10 (empty box). It is an audit on the unchanged tree. The new function must special-case `''` (Premises 6).
10. Case 11 (`bundle_id` suggest box). No, it could not pass without the goal: it is checked by a quoted render, which fails while SuggestInput draws no words.
11. Case 12 ('1.5', the sentence once). No: it fails if the words are drawn twice.
12. Item 2 "Covered: every form". Yes, it could pass with `inner_path` on `project_docs.name` never checked, and only `task_name` and `bundle_id` are run.

## Implied inputs

Each item below is missing from "Cases", with its expected result.

1. A family row edited again while its Save is out. Expected: the newer change and its draft stay held after the answer. Neither push (old value or saved value) ends the draft, and the bar counts 1.
2. Save All over several files, among them a file of a scope not on screen with a family draft. Expected: every saved file holds no change. When the reader switches to that scope, its row's draft ends at the first push, with no stale sentence. Rows of files whose Save was refused keep their change and draft.
3. A Save of a hub other than the primary (Hub scope, `row.slot` set), with a draft of the same key in the primary's scope. Expected: lab's draft and change end; the primary's draft and change of the same key stay.
4. Discard after a landed Save, before the push. Expected: no change, no draft, and the row shows the saved value once it is pushed. A later push of the old value holds nothing.
5. A refused Save (stale digest), then a successful Save. Expected: after the refusal the change, the draft and the refusal sentence stay. After the success, the end state of case 1.
6. An edit of the same row after a landed Save but before the push of the saved value. Expected: the new edit is held as a change, and the push of the saved value keeps it.
7. The writer closed (tab closed) while the Save is out (spec.md:73, an asynchronous path after close). Expected: the answer moves no draft and no state of the closed writer.
8. The unsaved workspace's Save through the name question (`resume`, then `saveFile(saved)`) with a family draft. Expected: the end state of case 1 for the workspace file's row.
9. A suggest box whose list is loading (`offer.note === 'loading'`) holding 'not a bundle'. Expected: the box is marked and the `bundle_id` sentence is drawn beside it whatever the list's state, since the form does not depend on the list.
10. A card whose file already holds a value of the wrong form (no draft), for example `task: Bad Name` in the file. Expected: the box is marked with the sentence beside it, as for a typed text, or the brief says otherwise.
11. `project_docs.name` holding '../x' or an absolute path (`inner_path`). Expected: the box is marked with the `notInnerPath` sentence beside it.
12. A top-level text row with a form (`latex.main_file` 'a/b'). Expected, per the brief, today's behaviour: the box is marked only after settle and the sentence is drawn once, under the item. The design as written changes this (The question 6).

## ADRs

1. `ls docs/adr` gives "No such file or directory", and `ls docs | grep -i adr` prints nothing. There is no ADR folder and no `NNNN-*.md`.

## Dictated text

1. The brief dictates no new text word for word for any file. Every quoted sentence it gives is an existing catalog line, found by `grep -rn --exclude=local.yml ... config/text`:
   - 'It must be lowercase letters, digits and dashes, starting with a letter.' (brief:29,72,95), at `config/text/views/system/workbench.yml:273`.
   - 'No unsaved change' (brief:61,88), at `workbench.yml:109`.
   - 'Changed and not saved yet...' (brief:14,61), at `workbench.yml:49`.
   - 'The file changed since this edit was started...' (brief:14,21,61), at `workbench.yml:197`.
   - 'It must be a whole number.' (brief:32), at `workbench.yml:265`.
   - The brief's `grep -n "'[A-Z][^']*\.'"` hits are these lines and the repro quote 'Saved into hub/.oculus/config.yml.' (brief:14), which is observed output.
   - No test title, comment or G138 sentence is given word for word (brief:84 describes the sentence and does not dictate it).

## Declined to judge

1. The two browser reproductions on port 8797: they need a page, and I may not run one.
2. "A second Save sends a change equal to the file, which writes nothing" (brief:22): `saveOf` and the server's write of an equal value were not traced. Not verified.
3. `config/options/local.yml`: left out of the `form:` walk to keep to the rule of excluding every `local.yml` under `config/`. Any card text field with a form in that catalog (the This machine families) is not checked, so the "Covered" list may miss more.
4. "The verify list of the state file equals its own verification page" (brief:55): not compared line by line.
5. Whether `refresh` with the config channel's unchanged version, rerun when `scopes.changes.files()` moves after the drop, rereads anything: `fs.svelte.ts:737` returns for a version already refreshed. Which event actually brings the old-value push was not determined, since that needs a page (Premises 8).
6. The brief names no worktree path, base copy folder or unused-exports base list file (spec.md:32-33, 89). I assumed the dispatch supplies them, as O195's brief also omits them. Not verified.
7. No vitest run: no premise needed one.

## Closed

Not closed: O196 stopped at this check for open item 791 (a guarded entry for part 2). The next /spec of O196 closes every finding in the brief it writes, as the skill says of a report that stands.

Usage: a2b2618a414f8f4c0, claude-opus-5-5, 217330 tokens, 50 tool uses, 441 s.
