# Step O196 refuter report (on .agents/worktrees/migration-O196, base c4dae5477)

Nothing in the step is unmet. Every check passes on the final tree. The findings are all low: two doc comment lines at 101 columns (fix at landing), one coupling note, one doc-comment wording, three proof notes and one behaviour that exists unchanged on the base. Only the look can confirm the on-screen parts of cases 1 to 3 and 14 to 21.

## Verification (rerun by the reviewer)

All commands ran from the worktree root, vitest with `TMPDIR` unset, at `nice -n 10`.

Item 1: the brief's ten files plus the two importers the report adds. I confirmed the two importers with `grep -rl -F <module path> tests`, which also gives `fold.test.ts` and `options-pages.test.ts`.
```
npx vitest run --maxWorkers 4 --reporter dot tests/state/system/settings/editor-saved.test.ts tests/views/system/workbench/scopes.client.test.ts tests/state/system/config/sparse-card.test.ts tests/state/system/settings/row-writer.test.ts tests/state/system/settings/hub-scope.test.ts tests/state/system/settings/collection-fields.test.ts tests/state/system/settings/machine-section.test.ts tests/state/system/settings/port-row.test.ts tests/checks/tree/size.test.ts tests/checks/tree/boundaries.test.ts tests/state/system/settings/fold.test.ts tests/state/workbench/options-pages.test.ts
 Test Files  12 passed (12)
      Tests  170 passed (170)
```
Item 2, over the 8 changed files:
```
npx prettier --check <8 files>
All matched files use Prettier code style!
npx eslint <8 files>
eslint exit 0
```
Item 3, the ASCII gate of spec.md over the 8 files:
```
LC_ALL=C perl -ne '...' <8 files>
ascii exit 0   (nothing printed)
```
Item 4:
```
npm run check
COMPLETED 4690 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
```
Item 5:
```
sh utils/unused-exports.sh > <scratch>/unused.txt ; diff ../migration-O196-base/unused-exports.txt <scratch>/unused.txt
script exit 0 | 335 lines both | diff exit 0
```
The new scopes rows run against the base source. This is a scratch copy of the new `scopes.client.test.ts` with its imports aimed at `migration-O196-base/src`. The `$lib` imports of the base `scopes.svelte.ts` resolve to modules that are identical in both trees (`diff -q` of `changes.ts` and `fixture.ts` prints nothing).
```
<cross> ... 'scout\'s stale_days changed from 7 to<ellipsis>'  -> expected [ 1, true ] to deeply equal [ +0, false ]
<cross> ... 'litwatch\'s stale_days cleared, the o<ellipsis>'  -> expected [ [ <ellipsis>(2) ], [ 1, true ] ] to deeply equal [ [ <ellipsis>(2) ], [ +0, false ] ]
<cross> ... 'litwatch\'s last_run set to Not set, <ellipsis>'  -> expected [ 1, true ] to deeply equal [ +0, false ]
<cross> ... 'an entry added, the old value pushed <ellipsis>'  -> expected [ 1, true ] to deeply equal [ +0, false ]
<cross> ... 'the family emptied, the old value pus<ellipsis>'  -> expected [ [], [ 1, true ] ] to deeply equal [ [], [ +0, false ] ]
<check> ... 'the saved value pushed alone'
<cross> ... 'the saved value pushed while the Save<ellipsis>'  -> expected [ +0, true ] to deeply equal [ +0, false ]
<cross> ... 'a row edited again while its Save is <ellipsis>'  -> expected [ [ 1, true ], [] ] to deeply equal [ [ 1, true ], [ [] ] ]
<cross> ... 'a refused Save, then a Save that land<ellipsis>'  -> expected [ [ false, 1, true, true ], <ellipsis>(1) ] to deeply equal [ [ false, 1, true, true ], <ellipsis>(1) ]
<cross> ... 'a Save of lab\'s file, the primary ho<ellipsis>'  -> expected [ [ 1, true ], [ 1, true ], [] ] to deeply equal [ [ +0, false ], [ 1, true ], <ellipsis>(1) ]
      Tests  9 failed | 4 passed (13)
```
Every failure is an assertion about the held change, the draft or the slots told. None comes from a missing function. On the base, the 'edited again' row fails only on `told` (`[]` for `[[]]`), and its held-change part passes there. This matches the report.

Case-run of cases 9 to 13 and the writer-alone row. I rebuilt it from the source the report quotes and ran it on the worktree, then on the base.
```
(worktree)
case 9 both land => {"done":true,"primary":{"changes":0,"draft":false},"lab":{"changes":0,"draft":false}}
case 9 lab refused => {"done":false,"primary":{"changes":0,"draft":false},"lab":{"changes":1,"draft":true},"labSaid":true}
case 10 => {"afterDiscard":{"changes":0,"draft":false},"afterOldPush":{"changes":0,"draft":false}}
case 11 => {"afterEdit":{"changes":1,"draft":true},"afterSavedPush":{"changes":1,"draft":true}}
case 12 => {"done":true,"left":{"changes":0,"draft":true},"ended":0}
case 13 => {"asked":false,"question":"scope","sent":1,"left":{"changes":0,"draft":false}}
writer alone => {"held":false,"ended":0}
      Tests  7 passed (7)
(base)
case 9 both land => {"done":true,"primary":{"changes":1,"draft":true},"lab":{"changes":1,"draft":true}}
case 9 lab refused => {"done":false,"primary":{"changes":1,"draft":true},"lab":{"changes":1,"draft":true},"labSaid":true}
case 10 => {"afterDiscard":{"changes":0,"draft":false},"afterOldPush":{"changes":0,"draft":false}}
case 11 => {"afterEdit":{"changes":1,"draft":true},"afterSavedPush":{"changes":1,"draft":true}}
case 12 => {"done":true,"left":{"changes":0,"draft":true},"ended":0}
case 13 => {"asked":false,"question":"scope","sent":1,"left":{"changes":1,"draft":true}}
writer alone => "TypeError: writer.saved is not a function"
```
These are identical to the report's lines.

Render run of cases 14 to 21. I rebuilt it from the report's source. "after" imports the worktree's `Item.svelte`. "before" imports the base copy's `Item.svelte`, whose relative imports reach the base `Control`, `Editor`, `Cards` and `FieldControl`.
```
(after)
case 14 => {"value":"Bad Name","invalid":true,"title":"It must be lowercase letters, digits and dashes, starting with a letter.","afterBox":"<span> It must be lowercase letters, digits and dashes, starting with a letter.","drawnAsText":1,"footLine":"Entry 1, task: It must be lowercase letters, digits and dashes, starting with a letter.","staged":0}
case 15 => {"value":"litwatch","invalid":false,"title":null,"afterBox":null,"drawnAsText":0,"footLine":null}
case 16 => {"value":"","invalid":false,"title":null,"afterBox":null,"drawnAsText":0,"footLine":null}
case 17 => {"value":"../x","invalid":true,"title":"It must be a path inside the folder ...","afterBox":"<span> It must be a path inside the folder it is read in: not absolute, ending in no slash, with no .. and no backslash.","drawnAsText":1,"footLine":"Entry 1, name: It must be a path inside the folder it is read in: not absolute, ending in no slash, with no .. and no backslash."}
case 18 ready => {"label":"Entry 1, value","value":"not a bundle","invalid":true,"title":"It must be the bundle id of an application, such as com.apple.Preview.","afterBox":"<span> It must be the bundle id of an application, such as com.apple.Preview.","drawnAsText":1,"footLine":"Entry 1, value: It must be the bundle id of an application, such as com.apple.Preview."}
case 18 loading => (same as ready)
case 19 => {"value":"Bad Name","invalid":true,"title":"It must be lowercase letters, digits and dashes, starting with a letter.","afterBox":"<span> It must be lowercase letters, digits and dashes, starting with a letter.","drawnAsText":1,"footLine":null}
case 20 => {"value":"1.5","invalid":true,"title":"It must be a whole number.","afterBox":"<span> It must be a whole number.","drawnAsText":1,"footLine":"Entry 1, stale_days: It must be a whole number."}
case 21 typed => {"value":"a/b","invalid":false,"title":null,"afterBox":null,"drawnAsText":0,"footLine":null}
case 21 settled => {"value":"a/b","invalid":true,"title":"It must be the name of one file: no slash or backslash, and neither . nor .. alone.","afterBox":"<p> It must be the name of one file: ...","drawnAsText":1,"footLine":null,"underItem":"It must be the name of one file: no slash or backslash, and neither . nor .. alone."}
      Tests  9 passed (9)
(before)
case 14 => {"value":"Bad Name","invalid":false,"title":null,"afterBox":null,"drawnAsText":0,"footLine":"Entry 1, task: It must be lowercase letters, digits and dashes, starting with a letter.","staged":0}
case 17 => {"value":"../x","invalid":false,"title":null,"afterBox":null,"drawnAsText":0,"footLine":"Entry 1, name: ..."}
case 18 ready|loading => {"invalid":false,"title":null,"afterBox":"<li> Entry 1, value: It must be the bundle id ...","drawnAsText":0,...}
case 19 => {"value":"Bad Name","invalid":false,"title":null,"afterBox":null,"drawnAsText":0,"footLine":null}
case 15, 16, 20, 21 typed, 21 settled => identical to the after lines
      Tests  9 passed (9)
```
On "..." in these blocks: the full lines printed the whole sentence, which equals the after line of the same case. The "..." is my cut for length and was not printed by the run.
- Case 14 after shows the mark beside the box, as a `<span>` status, the title and `aria-invalid`.
- Case 21 is byte-identical before and after, so the top-level row is unchanged.

I removed `.agents/scratch/O196-review/` before this report. `ls -a .agents` gives `. .. plan.yaml`. `git status --short` gives the 8 changed files, the brief and the report.

## Verdicts

Items:
1. Item 1, a Save that lands ends what it saved: holds. Every listed shape is met by the scopes rows and the quoted runs, which I reran:
   - field edited, field cleared, `last_run` Not set;
   - entry added, family emptied;
   - Save All (case 9);
   - the workspace saved through the name question (case 13).

   The kept behaviours also hold: edited again while out, edit after landing, refused, kept draft (existing row), third value (existing row), Discard, closed writer. The required parts are all in place:
   - the wiring at `Settings.svelte:189`;
   - the dep at `scopes.svelte.ts:56-57`;
   - the layer rules (boundaries test green);
   - the comments `writer.ts:8-18`, `scopes.svelte.ts:6-16` and `Settings.svelte:232-235`.
2. Item 2, a card's text field of a form is refused at the box: holds.
   - `textFormRefusal` (`fields.ts:553`) returns null for `''`.
   - `refusesForm` is passed only by `Cards.svelte:305`.
   - `formWords` is computed only for `control === 'text'` (`FieldControl.svelte:273-276`). It marks the box through `invalid` (`:448`, `:457`) and draws a `role="status"` span (`:463-465`).
   - The inputs are unchanged (no file under `src/lib/ui/` in the diff stat).
3. Item 3, tests: holds.
   - The scopes table under G96 fails on the base on held-change assertions (reproduced above).
   - The writer-alone row is dropped, under the brief's own condition (reproduced `TypeError: writer.saved is not a function`).
   - Part 2 has no test (ruling 791), and its render run is quoted before and after.

Cases:
1. met (scopes row; the bar, Save off and the stale sentence are for the look)
2. met (the sent value has no `stale_days` on litwatch; `[0, false]`)
3. met
4. met (old then saved; saved alone; saved before the answer)
5. met (`[[1, true], [[]]]`)
6. met (`[[false, 1, true, true], [true, 0, false]]`)
7. met (existing row 'holds a kept draft again at a push...' in the green 12-file run)
8. met (lab `[0, false]`, primary `[1, true]`, told lab's slot only)
9. met (quoted run reproduced; both land, and lab refused keeps lab)
10. met
11. met
12. met (the closed writer moves nothing: `ended: 0`, draft kept)
13. met (`left: {"changes":0,"draft":false}`; base keeps `1, true`)
14. met for the mark, title and sentence beside the box and for the foot line (render). For "nothing staged", see Proof 1. On screen, the look.
15. met
16. met
17. met
18. met for ready and loading. Independence from the list holds by reading `FieldControl.svelte:273-276`, which reads no list. See Declined to judge 3.
19. met
20. met (identical before and after; the sentence once beside the box)
21. met (identical before and after)

## 1. Spec

No finding. The diff writes only paths of the write list (diff stat: 8 files, all listed; `writer.svelte.ts` and `workbench-fixture.ts` unchanged). There is no history wording in added lines: `git diff -U0 c4dae5477 -- src tests | grep -E "^\+" | grep -i -E "\b(before|...|now)\b|O[0-9]{2,3}\b|..."` gives three "before" hits, each about the order of events at run time:
- `Settings.svelte:234`;
- the bench doc at `scopes.client.test.ts`;
- the row title 'the saved value pushed while the Save is out, before its answer'.

## 2. Proof

1. `render` case 14, `"staged":0` (report's render source, `drawn()`). The render puts the draft straight into instance state and never calls `editors.save`, so the memory stage is empty whatever the code does. The line therefore shows nothing about staging.
   - That nothing is staged rests on `writer.ts:96-97` (`if (!made.ok) return;`), which is unchanged code.
   - Failure scenario: none in this step. The run would also print 0 if that code were wrong.
   - Verdict: case 14's "nothing staged" holds by reading and is not proven by the run. No change needed. The look shows the bar.
2. `Settings.svelte:189`, `wrote: (slots) => editors.saved(slots)`. No test or run reaches this line, because the bench wires `writer.saved` itself.
   - By reading it is correct: `reactiveEditors` returns `{ ...inner, ... }` (`writer.svelte.ts:24-29`), so `saved` passes through. `editors` is only called after an await, so it is declared by then.
   - Failure scenario: a wrong wiring would bring back the original defect on screen while every unit row stays green.
   - Verdict: proof by the look, as the brief and the brief check accept.
3. Report, "Runs of each test command". By the builder's own account, `scopes.client.test.ts` was edited (the `told` checks on two rows) after the 12-file last round, and then prettier, the ASCII gate and `npm run check` ran again. The spec allows one more round only after a red line in a changed file.
   - My rerun of the 12 files on the final tree is green, so the outcome is unaffected.
   - Verdict: low, a token-discipline deviation, no repair needed.

## 3. Standards

1. Two added doc comments run to 101 columns. Spec rule: "A comment edited by the step is rewrapped ... at 100 columns" (`awk 'length > 100'`).
   - `src/lib/state/system/config/editors/writer.ts:56`: `    /** The slots of the rows a Save that landed wrote, whose drafts end once the file holds them. */` (101 columns).
   - `tests/views/system/workbench/scopes.client.test.ts:221`: `    /** An edit of a row's draft as the family editor makes it: kept in the tab, held as a change. */` (101 columns).
   - The other over-100 lines in that test file are unbreakable strings or imports, as on the base.
   - Failure scenario: none at run time. It breaks the comment-width rule.
   - Verdict: fix at landing by rewrapping each into a two-line doc comment.
2. `scopes.svelte.ts:236-244`, `slotHub`. It re-derives from the file name the hub that the row builders set as `row.slot`:
   - `rows.ts:503`: `...(of.primary ? {} : { slot: of.hub })`;
   - `rows.ts:553`: `slot: root`;
   - `hub-settings.svelte.ts:208`: `{ ...hubRow(...), slot: of.hub }`, applied only when `Settings.svelte:161` `scopeHub` is set.

   I checked that the two agree today for every kind (see Behaviour c). The same rule now lives in two places.
   - Failure scenario: a later change to when a row gets a slot (a new scope kind, or the Hub scope of the primary given a slot) changes one side only. A landed Save of that scope then tells a slot no draft has, and the original defect returns for that scope with every current row green.
   - Verdict: holds as written; this is a low coupling note. A cross-reference in `slotHub`'s doc comment to the three builders would make the dependency visible. Carrying `row.slot` on the staged change would remove the duplicate, but that change is the wire shape `saveOf` sends, so it is a larger change than this step needs.
3. `scopes.svelte.ts:56`, `/** Told, once a Save's answer lands, the slots of the rows it wrote. */`. The function leaves out a key the Save wrote that was typed again while it was out (`:217-229`). The head comment (`:8-9`) states this correctly; this doc comment does not.
   - Failure scenario: a reader of `ScopesDeps` expects every written key and wires something that relies on it.
   - Verdict: low wording; fix at landing by adding "but a row changed again while it was out".
4. Point e, `FieldControl.svelte` at 517 lines (`wc -l`). The limit is 520 (`spec.md:48`), so this holds. The next change to the component must split it by concern. The added lines are a 4-line comment, the prop, the derived value, three lines of markup and a 4-line style, so nothing was compacted.
   - The `.refused` style (`FieldControl.svelte:506-509`) repeats `NumberInput.svelte:87-91` except for `flex: 0 1 auto`. This is acceptable, since a component's style is scoped.
   - Verdict: holds.
5. Point d. `formWords` reaches the `bundle_id` suggesting box.
   - `open.program_ext.value` is `control: text, form: bundle_id, from: bundle_ids` (`config/options/behavior.yml:1817-1821`).
   - `controlOf` gives `text`, and `suggests(spec)` takes the `SuggestInput` branch with `invalid={invalid ?? formWords}` (`:448`).
   - A walk of every card field with `form:` in `config/options/*.yml` (`local.yml` left out) prints `control= text` for all 18 fields.
   - No caller of `FieldControl` other than `Cards.svelte` changes: the diff stat has no `Control.svelte` or `AppControl.svelte`. Both pass no `refusesForm`, which defaults to `false` (`:149`), so `invalid ?? undefined` is `invalid`. Case 21 is byte-identical before and after.
   - Verdict: holds.

## 4. Behaviour

Point a, a stale mark in `written`: I found no sequence where a stale mark changes an outcome.
- Marks do stay until `close` for:
  - scalar rows;
  - a family whose change was a Reset (`reset` forgets, then the Save marks a slot with no draft);
  - a draft the Editor ends itself (`Editor.svelte:177-180`, an edit back to the file's value, which never calls `forget`);
  - a draft discarded while its Save was out.
- `wrote(row)` is read only in the kept-draft re-hold at `writer.ts:135`. That branch needs a draft, no change held under the scope on screen, a draft that differs from the row and a file that has not moved.
- Within one writer's life this arises in only two ways:
  - after a landed Save of that slot, where `saved` re-adds the mark anyway, so it is correct;
  - after the scope's changes are lost while the tab's drafts survive, which happens only across a remount. `Settings.svelte` creates `scopes` and `editors` in one component and closes the writer in its teardown (`:247`), and `close` empties `written` (`writer.ts:174-177`), so a remount meets a writer with no marks.
- A tab switch therefore either keeps the same writer with the same in-memory changes (no re-hold needed) or remounts it (no marks).
- A later edit in the same writer holds its change through `save` (`writer.ts:99`), so `unheld` is false and the mark is not consulted.
- The one reachable difference I found, by reading and without a run: the workspace's primary changes while the tab holds a primary draft whose earlier Save left a mark with no draft end.
  - The draft's slot has no hub, so it is drawn on the new primary's row.
  - The base would hold it again into the new primary's file if the values match; the step does not.
  - This is a corner where not holding the change is the safer outcome.

Point b, stale `seen` rows: no stale `seen` row can hold a wrong change or wrongly end a draft.
- `saved` pushes only rows whose slots it has just added to `written` (`writer.ts:150-159`). `wrote(row)` is then true, so the re-hold branch cannot run from `saved`.
- `seen` is refreshed at every `save` and at every push of a row with a draft (`:95`, `:125`). A stale row can only end a draft whose value equals that row's value while no change is held under the same file and key in the scope on screen.
- For a lab slot told while the primary is on screen, `stage.held` reads `hub:primary`:
  - if the primary holds a change of the same key, the push returns and lab's draft ends later at lab's own push (case 9 run: `lab {"changes":0,"draft":false}`);
  - if not, lab's change was just dropped, so ending it is right.
- A row edited again while out is never told (`scopes.svelte.ts:222-229`; told `[[]]`).

Point c, `slotHub` and `writtenSlots` against `slotOf(row)`: they match for every scope kind.
- **Primary:** `hub:<primary>` maps to `{kind:'primary'}` (`scope.ts:128`), so there is no hub. Primary rows have no slot, and `withHubs` is not applied while `scopeHub` is null (`Settings.svelte:161`, `:298-306`). The same holds for a Hub scope that names the primary.
- **Second hub:** `hub:lab` gives hub `lab`, and rows carry `slot: of.hub` (`hub-settings.svelte.ts:208`). Case 8 row: told `[{ file: 'sources.yml', key: 'update_tasks', hub: 'lab' }]`.
- **This machine:** `local:<hub>` gives no hub for the primary and the hub otherwise. `localRows` sets `slot` only when `!of.primary`, and `primary: scope.hub === hubRoot` (`Settings.svelte:281`, `rows.ts:503`).
- **Repository:** `repo:<root>` gives `root`, and `repoRow` sets `slot: root` (`rows.ts:553`).
- **Workspace through the name question:** `workspace:<path>` gives no hub, and workspace rows have no slot. Case 13 run: `left {"changes":0,"draft":false}`.
- `file` and `key` come from the staged change, which `stage.set` builds from `row.file` and `row.key` (`scopes.svelte.ts:161-165`). This equals `slotOf(row)`'s `file` and `key`.

Findings:
1. A row edited back to the file's value while its Save is out loses that newer word. The relevant code is `scopes.svelte.ts:203-211`, `const left = inner.of(name).filter((one) => !sent.has(one));`.
   - The Editor ends the draft and `save` drops the change (`Editor.svelte:177-180`, `writer.ts:100`), so nothing is left to restage. The Save then writes the old edit.
   - My run (scratch case, the Editor's back-edit modelled): `edit back => {"meanwhile":{"changes":0,"draft":false},"sentDays":8,"left":{"changes":0,"draft":false}}`, identical on the base.
   - Failure scenario: the reader changes `stale_days` 7 to 8, presses Save, sets it back to 7 while the Save is out, and sees 'No unsaved change' while the file holds 8.
   - This step neither causes nor changes it. It is a different concern: the scopes' rule for a change the reader withdrew while its Save was out, which the brief's case 5 does not name.
   - Verdict: not a finding against the step. It is reported for the orchestrator to book or leave.

## Declined to judge

1. The order in which the real view pushes rows after a Save, and whether the emptied primary `update_tasks` family reads back from the hub file as `[]`. The rows push `tasks([])`. Both need a page; the look covers them.
2. Where the words beside the box sit and how they wrap in `.control`, the red border `TextInput` draws for `invalid` compared with `NumberInput`'s outline, and the screen reader announcing at each keystroke. These are for the look.
3. Case 18 with the list loading. My render run used a `bundle_ids` list in the `loading` state but did not print `offerFor(...).note`. The builder's `"offerNote":"loading"` line is not re-verified. The independence from the list holds by reading `FieldControl.svelte:273-276`.
4. What `git show c4dae5477:<path>` would add. I read the base through the base copy and did not compare the copy with the commit.

Reviewer usage: abbfb7cf823a685ea, claude-opus-5-5, 256793 tokens, 63 tool uses, 865 s.

## Repair round 1, refuted

```
(all from the worktree root; vitest with TMPDIR unset, nice -n 10, --maxWorkers 4)

npx vitest run --maxWorkers 4 --reporter dot <the brief's 10 files> tests/state/system/settings/fold.test.ts tests/state/workbench/options-pages.test.ts
 Test Files  12 passed (12)
      Tests  174 passed (174)

npx prettier --check <11 changed files>
Checking formatting...
All matched files use Prettier code style!
prettier exit 0
npx eslint <11 changed files>
eslint exit 0
LC_ALL=C perl -ne '<the spec.md gate>' <11 changed files>
ascii exit 0          (nothing printed)
awk 'length > 100' over the 11 changed files
tests/state/system/settings/editor-saved.test.ts:104: 103   (base :102)
tests/state/system/settings/editor-saved.test.ts:133: 110   (base :131)
tests/state/system/settings/editor-saved.test.ts:147: 101   (base :145)
tests/state/system/settings/editor-saved.test.ts:180: 102   (base :178)
tests/views/system/workbench/scopes.client.test.ts:49: 107  (base :13)
tests/views/system/workbench/scopes.client.test.ts:90: 101  (base :52)
tests/views/system/workbench/scopes.client.test.ts:104: 133 (base :66)

npm run check
1795727618019 COMPLETED 4690 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS

sh utils/unused-exports.sh > <scratch>/unused.txt; diff ../migration-O196-base/unused-exports.txt <scratch>/unused.txt
script exit 0 | 335 | 335 | diff exit 0

wc -l: fields.ts 810, writer.ts 184, write.ts 176, Settings.svelte 498, Cards.svelte 500, Editor.svelte 304,
FieldControl.svelte 517, scopes.svelte.ts 421, editor-saved.test.ts 217, scopes.client.test.ts 561, workbench-fixture.ts 86

Evidence the round's report quotes, rerun: a copy of the worktree's scopes.client.test.ts with every
'../../../../src/' import aimed at migration-O196-base/src (fixture import at the worktree's unchanged
tests/state/system/settings/fixture.ts), run under a scratch config whose client include is the scratch folder:
<cross> ... a row whose Save lands > 'scout\'s stale_days changed from 7 to<ellipsis>'   (first build's row)
<cross> ... 'litwatch\'s stale_days cleared, the o<ellipsis>'
<cross> ... 'litwatch\'s last_run set to Not set, <ellipsis>'
<cross> ... 'an entry added, the old value pushed <ellipsis>'
<cross> ... 'the family emptied, the old value pus<ellipsis>'
<check> ... 'the saved value pushed alone'
<cross> ... 'the saved value pushed while the Save<ellipsis>'
<cross> ... 'a row edited again while its Save is <ellipsis>'
<cross> ... 'a refused Save, then a Save that land<ellipsis>'
<cross> ... 'a Save of lab\'s file, the primary ho<ellipsis>'
<cross> ... 'scout\'s stale_days changed from 7 to<ellipsis>'   (round: set back to 7 while out)
<cross> ... 'apps_dir changed and typed back to th<ellipsis>'
<cross> ... 'apps_dir the file holds no key for, s<ellipsis>'
<check> ... 'scout\'s stale_days changed from 7 to<ellipsis>'   (round: discarded while out)
AssertionError: expected [ [ <ellipsis>(2) ], [], false, <ellipsis>(3) ] to deeply equal [ [ <ellipsis>(2) ], <ellipsis>(5) ]   (family back: held [] on base)
AssertionError: expected [ [], false, [], [ [ { <ellipsis>(3) } ] ] ] to deeply equal [ <ellipsis>(4) ]                        (apps_dir back: held [] on base)
AssertionError: expected [ [], false ] to deeply equal [ <ellipsis>(2) ]                                                        (apps_dir emptied: held [] on base)
      Tests  12 failed | 5 passed (17)
(the 9 first-build failure lines are byte-identical to the first review's base run)

Cases 9 to 13, rebuilt from the report's source, rerun on the worktree after the round:
case 9 both land => {"done":true,"primary":{"changes":0,"draft":false},"lab":{"changes":0,"draft":false}}
case 9 lab refused => {"done":false,"primary":{"changes":0,"draft":false},"lab":{"changes":1,"draft":true},"labSaid":true}
case 10 => {"afterDiscard":{"changes":0,"draft":false},"afterOldPush":{"changes":0,"draft":false}}
case 11 => {"afterEdit":{"changes":1,"draft":true},"afterSavedPush":{"changes":1,"draft":true}}
case 12 => {"done":true,"left":{"changes":0,"draft":true},"ended":0}
case 13 => {"asked":false,"question":"scope","sent":1,"left":{"changes":0,"draft":false}}
writer alone => {"held":false,"ended":0}
      Tests  7 passed (7)

Reviewer's case-run (a copy of the worktree test's bench, exposing its answer queue; prints only), worktree:
P1 family (push of 8 before the answer, edited to 9 and back to 8 while out) => held [{update_tasks, value: scout at 8, base: scout at 8}] [1,false] unsaved true
P1 row (apps_dir more-apps, typed x and back to more-apps while out)          => [{"file":"sources.yml","key":"apps_dir","value":"more-apps"}] true
C1 edited back, then edited to 9 while out      => held scout at 9 (base 7), [1,true], told [[]]
C2 back, to 9, back to 7 while out              => held scout at 7 (base 8), told [[]]
C3 back, then the bar's Discard while out       => []
C4 back, then writer.discard(row) while out     => held scout at 7 (base 8)
C5 back, then Reset of the row while out        => [{"file":"sources.yml","key":"update_tasks","reset":true}]
B1 refused Save with an apps_dir back, then a landed Save of update_tasks => false [] true [] (last body: update_tasks only)
B2 two Saves of one file out, edit back, first lands first              => [{"file":"sources.yml","key":"apps_dir","value":"apps"}] true
B2 two Saves of one file out, edit back, refused second answered first  => [] false
B2 two Saves of one file out, edit back, both land, second first        => [{"file":"sources.yml","key":"apps_dir","value":"apps"}] true
B3 second Save sends update_tasks only; its edit back after the first landed => held only apps_dir 'apps' (the update_tasks back is lost)
A1 withdraw with nothing out (edit, edit back, Save of another key)     => [] [] (one body, update_tasks only)
D1 family the file holds no key for, 7 to 8, back while out => own false, held [{"file":"sources.yml","key":"update_tasks","reset":true}], after a second Save [0,false], told [[],[update_tasks]], second body [{...,"reset":true}]
Same file aimed at the base copy:
P1 => [] [0,false] false
P1 row => [] false
B2 (all three orders) => [] false
```

The case-run printed through `console.log` and its rows failed only on vitest's "expected any number of assertion" rule. Every review scratch file was removed afterwards (`ls -a .agents` gives `. .. plan.yaml`). `git status --short` lists the 12 modified paths and the three untracked ledger files, the same as when the review started.

### Verdicts

Items of "What to build", over the whole diff since c4dae5477:
1. A Save that lands ends what it saved: holds. The rows of cases 1 to 6 and 8 fail on the base copy on the held change (rerun above) and pass on the worktree. Cases 9 to 13 reproduce after the round. Behaviour 1 is a new defect in one push order and is fixable at landing.
2. A card's text field of a form is refused at the box: holds. In round 1, `diff -u` of the snapshot against the worktree prints nothing for `fields.ts`, `FieldControl.svelte` and `Cards.svelte`, and `Editor.svelte` changes only in its head comment. I did not rerun the first review's render run.
3. Tests: holds. Proof 1 notes one branch that no row reaches.

Cases:
1 met; 2 met; 3 met; 4 met; 5 met; 6 met; 7 met (existing row green in the 12-file run); 8 met; 9 met (rerun); 10 met (rerun); 11 met (rerun); 12 met (rerun); 13 met (rerun); 14 to 21 met (first review's render run; their code is unchanged in this round, by diff). The on-screen parts of 1 to 3 and 14 to 21 are for the look.

Round items:
1. Edit back kept: holds for each sequence the round names. The family row and the top-level row fail on the base copy on the held change, and the Discard row passes there. A row edited back is left out of `wrote`. Discard is told apart by how the change left the stage (`drop` vs `withdraw`). Findings Behaviour 1 (a regression the round adds), Behaviour 2 (low) and Behaviour 3 (the same defect remains in three other editors) are against this item.
2. Rewrap of the 101-column comments: holds. The only lines over 100 columns are the seven above, each over 100 on the base.
3. `ScopesDeps.wrote` doc: holds (`scopes.svelte.ts:59-62`).
4. `slotHub` doc names the three setters: holds (`scopes.svelte.ts:301-307`). `rows.ts:465`/`:503` (`localRows`), `rows.ts:520`/`:553` (`repoRow`) and `hub-settings.svelte.ts:200`/`:208` (`withHubs`) all exist as named.
5. Nothing else changes: holds. The round touches `write.ts`, `Editor.svelte` (comment only), `writer.ts`, `scopes.svelte.ts` and the test. `workbench-fixture.ts:47` is outside the round's list but on the step's list; the builder names it.

Judged points (a) to (e):
- (a) holds. When the name is not out, `withdraw` runs `inner.drop(at, name)`, which is exactly the base `drop`. The only difference from the new `drop` is `unback`, a no-op when no back is recorded for that name. Probe A1 and the green `row-writer.test.ts` and `editor-saved.test.ts` agree. Every implementer of `Stage` (`scopes.svelte.ts:183`, `workbench-fixture.ts:40`) has the member. The callers moved from `drop` to `withdraw` are `writer.ts:104`, `:120` and `write.ts:132`, `:145`, `:159`; `writer.ts:112` (Discard) keeps `drop`.
- (b) A refusal clears both `out` and `backs` before its check (`scopes.svelte.ts:258-265`), and B1 shows a later landed Save brings nothing stale back. Save All saves one file at a time, each under its own `out` entry: correct by reading. Two Saves of one file out at once: see Behaviour 2.
- (c) An edit again, an edit back again, the bar's Discard and a Reset after an edit back each give the right result (C1, C2, C3, C5). A row Discard after an edit back brings the back again (C4), because `writer.ts:112` drops only when a change is held. The Editor cannot reach that state: its Discard is drawn only when `held !== undefined || unsaved` (`Editor.svelte:254`), and an edit back ends both. No finding.
- (d) Holding `{reset: true}` departs from the round brief's letter ("the value ... carries it as `base`"). It has the effect the brief asks for: the file goes back to holding no key, and the editor draws `row.default` (`rows.ts:296`, `entry.default`) marked unsaved (D1). Using `base` would write the inherited value into a file that held no key. My judgment is that the builder's choice is the better one, and the orchestrator may reverse it (report, judgment call 9).
- (e) Confirmed by reading: all three lose an edit back. See Behaviour 3.

### Findings

**Spec**

None. History-word grep over the round's added lines (`diff` of the snapshot and `git diff c4dae5477 -- write.ts Editor.svelte workbench-fixture.ts`, lines added only): eight hits. Each "before" names a value the file held before a Save, or the order of events at run time. The one "no longer" (`Editor.svelte:285`) is a reflowed sentence from the base comment.

**Proof**

1. `tests/views/system/workbench/scopes.client.test.ts:173-186`:
   ```
   hubFile: { text: text(`update_tasks: ${JSON.stringify(value)}\n`), present: true },
   ```
   - `tasks()` now always builds a row whose file holds the key. So no row of the table reaches the family branch where `row.own` is false: `withdraw`'s `{ reset: true }` for a family, and `writer.ts:120`.
   - The only row that reaches `{reset: true}` is the top-level emptied row, and it asserts only held and pending.
   - Probe D1 shows the family branch works.
   - Failure scenario: a later change breaks the family no-key back and every row stays green.
   - Verdict: low, round item 1 and judgment call 9. A row like D1 would cover it.
   - The fixture change does not cost a first-build row its proof: the nine base failure lines are unchanged (rerun above).
2. The report's "Cases 9 to 13 after the change" lines date from the first build. Its round-1 run list has no run of the cases file, although `scopes.svelte.ts` changed. My rerun gives identical lines, so the verdicts stand. Low, no repair.

**Standards**

None. Each new comment paragraph is wrapped at 100 columns with no short line inside a sentence. No file is over its size limit. `memoryStage.withdraw` deleting as `drop` does is fine, because only the scopes tell the two apart.

**Behaviour**

1. `src/lib/views/system/workbench/settings/scopes/scopes.svelte.ts:202-216`:
   ```
   if (out.get(at)?.has(name) === true) {
       const held: Held = row.own ? { value: row.value } : { reset: true };
   ```
   - The back is read from `row.value` at the moment of the edit back. When the config channel has already pushed the saved value before the answer, `row.value` is the value the Save is writing. The step's own row 'the saved value pushed while the Save is out, before its answer' treats that order as real.
   - The landed Save then holds a change equal to what the file holds (probe P1: family `value` scout at 8 with `base` scout at 8, `[1,false]`, unsaved true; top-level `apps_dir: more-apps` held, pending true). The base holds nothing in the same sequence (`P1 => [] [0,false] false`).
   - Failure scenario: scout 7 to 8, Save; the push of 8 arrives before the answer; while the answer is out the reader sets 9 and then back to 8. After the answer the bar reads '1 unsaved change', the editor draws 'Changed and not saved yet' for a value the file already holds, and a second Save writes nothing new.
   - Verdict: a defect the round adds, against round item 1 and the brief's "No unsaved change". Fix at landing: in `heldBack` (`:226-233`), hold nothing for a back whose value `isEqual`s the value the Save sent for that key. The round brief's `base` would not fix it: it would hold 7 where the reader typed 8.
2. `scopes.svelte.ts:257-261`:
   ```
   out.set(name, new Set([...sent].flatMap(nameOf)));
   const answer = await deps.send(body);
   out.delete(name);
   const edited = [...(backs.get(name)?.values() ?? [])];
   backs.delete(name);
   ```
   - `out` and `backs` have one entry per file. A second Save of the same file overwrites the first one's `out` entry, and whichever answer comes first deletes both.
   - Probe B2: when the second Save's refusal is answered before the first Save lands, the back is lost (`[] false`). The other two orders keep it.
   - Probe B3: when the second Save sends another key, an edit back of that key made after the first answer is lost.
   - A second Save is reachable. `ScopeBar.svelte:145` disables Save only at `count === 0`, and a change stays counted until its answer. Autosave's Save All (`Settings.svelte:227`) also saves.
   - Whether the server can answer the second request first, or write it, is not verified. The builder's judgment call 11 claims, by reading, that the second is always refused; that covers only the first order.
   - Failure scenario: a double Save (or Save plus autosave) with an edit back between them; the refusal comes back first; the reader's 7 is lost while the file holds 8.
   - Verdict: low, round item 1. Fix: let each Save delete only its own record (for example `if (out.get(name) === mine) out.delete(name)`, with `backs` kept per Save).
3. `src/lib/views/system/workbench/RailEditor.svelte:105`, `settings/other-rows/AppControl.svelte:71`, `settings/scopes/WorkspaceRows.svelte:45`, `:52`:
   ```
   if (scopes.stage.held(row) !== undefined) scopes.stage.drop(row);
   scopes?.stageApp(row.setting.key, null);
   scopes.stageWorkspace(PRIMARY_NAME, hub === ground.primary ? null : { primary: hub });
   scopes.stageWorkspace(folderName(folder), name === folder ? null : { folder, name });
   ```
   - All three drop the change when the edit equals the file's value, and none records a back. `stageApp` and `stageWorkspace` with null call `inner.drop` (`scopes.svelte.ts:404-418`), and `out` records only key changes (`nameOf`, `:283-285`).
   - So, by reading, the rail list, an app's setting and the workspace file's primary and folder names each lose an edit back made while their Save is out, exactly as round item 1 describes for the two writers.
   - Failure scenario: an app setting changed, Save, typed back while out; after the answer the bar reads 'No unsaved change' and the file holds the first edit.
   - Verdict: the same defect class as round item 1, and inside its reason ("every edit made while a Save is out"). It sits outside the round's write list and item 5, so the builder named it and left it.
   - The rail is a `Stage` caller with a `ConfigRow`, so swapping `drop` for `withdraw` there is likely enough. Not verified: that the rail row's `row.value` has the shape `configRail(merged)` gives.
   - The other two need a record of non-key changes in `out` and `backs`.
   - Verdict: for the orchestrator. My judgment is that this is a miss inside the round's reason rather than a different concern: the rail could be fixed at landing, and the other two need a repair round.

### Declined to judge

1. Whether the server can answer a second Save of one file before the first, or write it rather than refuse it as a changed file (Behaviour 2). That needs a read of the server's save path and its ordering, which this review did not make.
2. The look: the bar, the tab mark, the editor's sentences and the Save button for round item 1's sequence. The round's window only opens if the Save is slowed.
3. Part 2's render run after round 1. I did not rerun it, because the round left its code paths unchanged (empty `diff -u` for `fields.ts`, `FieldControl.svelte`, `Cards.svelte`; comment-only `Editor.svelte`).
4. What `git show c4dae5477:<path>` would add. I read the base through the base copy.

Reviewer usage: a5c31131fd67e946b, claude-opus-5-5, 224151 tokens, 54 tool uses, 700 s.

### Closed

- Behaviour 1 (an edit back to the value the Save wrote, pushed before its answer), fixed at landing: `heldBack` in `scopes.svelte.ts` holds nothing when the edit back equals what the Save wrote; row 'apps_dir changed, the saved value reaching the view and typed back to while its Save is out' of `tests/views/system/workbench/scopes.client.test.ts`.
- Behaviour 2 (two Saves of one file out, the second refused first), fixed at landing: each Save keeps its own record of what it sent (`Out`), and `takeBacks` keeps an edit back for a Save still out; row 'apps_dir typed back while two Saves of its file are out, the second refused first'.
- Behaviour 3 (the rail, an app setting and the workspace rows withdrew nothing), fixed at landing: `RailEditor.svelte` withdraws, or drops at a Discard; `AppControl.svelte` calls the new `withdrawApp`; `WorkspaceRows.svelte` calls the new `withdrawWorkspace`; rows 'the app's setting brought back' and 'the workspace's primary and folder name brought back'.
- Proof 1 (no row reached the family that the file holds no key for), fixed at landing: row 'the family with no key set back while its Save is out', a reset held and sent.
- Proof 2 (the round-1 run list held no run of the cases file), closed with no change: the reviewer's rerun gives the same lines, and the gate at landing ran `scopes.client.test.ts` green.
