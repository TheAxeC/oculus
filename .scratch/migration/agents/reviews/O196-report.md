# O196 report: the Settings form tells the truth about a row setting

Not done: the writer-alone row of item 3 in `tests/state/system/settings/editor-saved.test.ts`, dropped as the brief directs, since it cannot run on the unchanged tree (its run there gives `TypeError: writer.saved is not a function`, quoted under the first run, case 9 to 13 block); the scopes row stands alone. Everything else in the brief and in repair round 1 (`agents/briefs/O196-round1.md`, items 1 to 5) is done.

Outside the round, named for the orchestrator (item 5 of the round says nothing else in the code changes): three other editors drop a change edited back to the file's value through a path other than the `Stage`'s `withdraw`, so the same loss of the newer word while a Save is out remains for them, by reading and not run: the rail editor (`RailEditor.svelte:105`, `scopes.stage.drop(row)` when the list equals the one in force), an app's setting (`AppControl.svelte:71`, `scopes?.stageApp(row.setting.key, null)`), and the workspace file's primary and folder names (`WorkspaceRows.svelte:45`, `:52`, `scopes.stageWorkspace(name, null)`). My judgment, not checked by a run: the rail editor needs only `scopes.stage.drop` replaced by `scopes.stage.withdraw`, and the other two need `stageApp` and `stageWorkspace` to record what the workspace file or the app setting held before the Save, the record `withdraw` keeps for a key.

One path outside the round's write list is changed, inside the step's write list: `tests/views/system/workbench/workbench-fixture.ts`, whose `memoryStage` gains the `withdraw` member the `Stage` type requires (one line, `workbench-fixture.ts:47`), since both writers call it (`write.ts:132`, `writer.ts:104`) and four test files build their writers over `memoryStage`.

## Open items of the state file

`.scratch/migration/orchestrator-state.md`, section "Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)": the list holds no entry (the section is blank lines followed by "An entry leaves this list for the closed log the moment Axel rules on it. ...").

## The cases' first run (unchanged tree, before any code change)

No case of the brief's rules turned out wrong, so the build went on without a stop.

Commands (vitest with `TMPDIR` unset, `nice -n 10`, at most 4 workers):

- Cases 1 to 6 and 8, the new rows of `tests/views/system/workbench/scopes.client.test.ts`, written first: `npx vitest run --maxWorkers 4 --reporter verbose tests/views/system/workbench/scopes.client.test.ts`.
- Case 7: `npx vitest run --maxWorkers 4 --reporter verbose tests/state/system/settings/editor-saved.test.ts`.
- Cases 9 to 13: the case-run `.agents/scratch/O196/tests/cases.client.test.ts` (source below), run with `npx vitest run --config .agents/scratch/O196/vitest.config.ts --root . --maxWorkers 4 --reporter verbose .agents/scratch/O196/tests/cases.client.test.ts`.
- Cases 14 to 21: the render run `.agents/scratch/O196/tests/render.test.ts` (source below), same form of command.

Results on the unchanged tree (each a quoted line of the run; `<check>` and `<cross>` stand for vitest's pass and fail marks, `<ellipsis>` for its cut of a long title):

1. Scout's `stale_days` 7 to 8, saved, old value then saved value pushed: fails, `<cross> ... a family row whose Save lands > 'scout\'s stale_days changed from 7 to<ellipsis>'` with `expected [ 1, true ] to deeply equal [ +0, false ]` (one change held again and the draft kept). The bar, Save and the stale sentence are for the look.
2. Litwatch's `stale_days` cleared: fails, `expected [ [ <ellipsis>(2) ], [ 1, true ] ] to deeply equal [ [ <ellipsis>(2) ], [ +0, false ] ]`; the sent value already has no `stale_days` on litwatch (the first element matched).
3. Litwatch's `last_run` set to Not set: fails, `expected [ 1, true ] to deeply equal [ +0, false ]`.
4. Pushes after a landed Save: old then saved fails (case 1's line); the saved value alone passes, `<check> ... 'the saved value pushed alone'`; the saved value pushed while the Save is out, before its answer (an order the step adds to the table, see judgment calls), fails, `expected [ +0, true ] to deeply equal [ +0, false ]` (no change, the draft kept). The added-entry and emptied-family rows fail with `expected [ 1, true ] to deeply equal [ +0, false ]` and `expected [ [], [ 1, true ] ] to deeply equal [ [], [ +0, false ] ]`.
5. A row edited again while its Save is out: passes, `<check> ... 'a row edited again while its Save is <ellipsis>'` (preserved behaviour; the check of the slots the Save tells was added to this row after this run, see item 3 below).
6. A refused Save, then one that lands: fails, `expected [ [ false, 1, true, true ], <ellipsis>(1) ] to deeply equal [ [ false, 1, true, true ], <ellipsis>(1) ]`, the diff showing the second part `[true, 1, true]` for `[true, 0, false]`: after the refusal the change, the draft and the sentence stay, and after the landed Save the change is held again.
7. A kept draft over a reload, no Save: passes, `<check> ... a family whose last entry is removed > holds a kept draft again at a push, unless the file moved from the value it was started over 1ms`; the file `Tests  11 passed (11)`.
8. A Save of lab with a primary draft of the same key: fails, `expected [ [ 1, true ], [ 1, true ] ] to deeply equal [ [ +0, false ], [ 1, true ] ]` (lab's change held again; the primary's kept as it should be).
9. Save All, two files, lab off screen: `case 9 both land => {"done":true,"primary":{"changes":1,"draft":true},"lab":{"changes":1,"draft":true}}`; lab refused: `case 9 lab refused => {"done":false,"primary":{"changes":1,"draft":true},"lab":{"changes":1,"draft":true},"labSaid":true}`.
10. Discard after a landed Save: `case 10 => {"afterDiscard":{"changes":0,"draft":false},"afterOldPush":{"changes":0,"draft":false}}`.
11. An edit after a landed Save, before the saved push: `case 11 => {"afterEdit":{"changes":1,"draft":true},"afterSavedPush":{"changes":1,"draft":true}}`.
12. The writer closed while a Save is out: `case 12 => {"done":true,"left":{"changes":0,"draft":true},"ended":0}`.
13. The unsaved workspace saved through the name question: `case 13 => {"asked":false,"question":"scope","sent":1,"left":{"changes":1,"draft":true}}` (the workspace file's change held again after the Save). The same run's writer-alone row: `writer alone => "TypeError: writer.saved is not a function"`.
14. 'Bad Name' in the task box: `case 14 => {"value":"Bad Name","invalid":false,"title":null,"afterBox":null,"drawnAsText":0,"footLine":"Entry 1, task: It must be lowercase letters, digits and dashes, starting with a letter.","staged":0}`.
15. 'litwatch': `case 15 => {"value":"litwatch","invalid":false,"title":null,"afterBox":null,"drawnAsText":0,"footLine":null}`.
16. Empty task box: `case 16 => {"value":"","invalid":false,"title":null,"afterBox":null,"drawnAsText":0,"footLine":null}`.
17. '../x' in a `project_docs` name box: `case 17 => {"value":"../x","invalid":false,"title":null,"afterBox":null,"drawnAsText":0,"footLine":"Entry 1, name: It must be a path inside the folder it is read in: not absolute, ending in no slash, with no .. and no backslash."}`.
18. 'not a bundle' in `open.program_ext`'s value box: ready `case 18 ready => {"label":"Entry 1, value","value":"not a bundle","invalid":false,"title":null,"afterBox":"<li> Entry 1, value: It must be the bundle id of an application, such as com.apple.Preview.","drawnAsText":0,"footLine":"Entry 1, value: It must be the bundle id of an application, such as com.apple.Preview."}`; loading the same with `case 18 loading`. The element after the box is the foot list's `<li>`, since it is the last box of the editor.
19. A file holding `task: Bad Name`, no draft: `case 19 => {"value":"Bad Name","invalid":false,"title":null,"afterBox":null,"drawnAsText":0,"footLine":null}`.
20. '1.5' in a `stale_days` box: `case 20 => {"value":"1.5","invalid":true,"title":"It must be a whole number.","afterBox":"<span> It must be a whole number.","drawnAsText":1,"footLine":"Entry 1, stale_days: It must be a whole number."}`.
21. `latex.main_file` holding 'a/b': typed `case 21 typed => {"value":"a/b","invalid":false,"title":null,"afterBox":null,"drawnAsText":0,"footLine":null}`; settled `case 21 settled => {"value":"a/b","invalid":true,"title":"It must be the name of one file: no slash or backslash, and neither . nor .. alone.","afterBox":"<p> It must be the name of one file: no slash or backslash, and neither . nor .. alone.","drawnAsText":1,"footLine":null,"underItem":"It must be the name of one file: no slash or backslash, and neither . nor .. alone."}`.

## Repair round 1: the new rows on the base copy, before the code change

The four rows of round item 1 were written into `tests/views/system/workbench/scopes.client.test.ts` first, and run against the base copy before any code of the round changed: a scratch copy of the test at `.agents/scratch/O196/tests/scopes-base.client.test.ts` with every `../../../../src/` import aimed at `../../../../../migration-O196-base/src/` and the fixture import at the worktree's unchanged `tests/state/system/settings/fixture.ts`, run with `npx vitest run --config .agents/scratch/O196/vitest.config.ts --root . --maxWorkers 4 --reporter verbose .agents/scratch/O196/tests/scopes-base.client.test.ts` (the config's source is quoted further down). The base `scopes.svelte.ts` reaches `scopes/write.ts` and `scopes/changes.ts` through `$lib`, which resolves to the worktree's copies; at that run both were identical to the base (`diff -q` of each printed nothing).

The four rows' lines (`<check>` and `<cross>` for vitest's marks, `<ellipsis>` for its cut of a title):

```
<cross> |client| .agents/scratch/O196/tests/scopes-base.client.test.ts > a row whose Save lands > 'scout\'s stale_days changed from 7 to<ellipsis>' 2ms
<cross> |client| .agents/scratch/O196/tests/scopes-base.client.test.ts > a row whose Save lands > 'apps_dir changed and typed back to th<ellipsis>' 1ms
<cross> |client| .agents/scratch/O196/tests/scopes-base.client.test.ts > a row whose Save lands > 'apps_dir the file holds no key for, s<ellipsis>' 1ms
<check> |client| .agents/scratch/O196/tests/scopes-base.client.test.ts > a row whose Save lands > 'scout\'s stale_days changed from 7 to<ellipsis>' 1ms
      Tests  12 failed | 5 passed (17)
```

The failures, each on the held change:

- "scout's stale_days changed from 7 to 8 and set back to 7 while its Save is out": `AssertionError: expected [ [ <ellipsis>(2) ], [], false, <ellipsis>(3) ] to deeply equal [ [ <ellipsis>(2) ], <ellipsis>(5) ]`. The diff: the first element (the value the Save sent, scout at `"stale_days": 8`) matches; the held changes are `[]` where `[{ file: 'sources.yml', key: 'update_tasks', value: <litwatch, scout at 7>, base: <litwatch, scout at 8> }]` is expected, `unsaved` is `false` for `true`, the count and draft `[0, false]` for `[1, false]`, and the second Save sends nothing (the last body is the first Save's, scout at 8, where the expected second body holds scout at 7).
- "apps_dir changed and typed back to the file's value while its Save is out": `AssertionError: expected [ [], false, [], [ [ { <ellipsis>(3) } ] ] ] to deeply equal [ <ellipsis>(4) ]`; held `[]` for `[{ file: 'sources.yml', key: 'apps_dir', value: 'apps' }]`, pending `false` for `true`, and one body sent (`more-apps`) where the second body `apps` is expected.
- 'apps_dir the file holds no key for, set and its box emptied while its Save is out': `AssertionError: expected [ [], false ] to deeply equal [ <ellipsis>(2) ]`; held `[]` for `[{ file: 'sources.yml', key: 'apps_dir', reset: true }]`, pending `false` for `true`.
- "scout's stale_days changed from 7 to 8 and discarded while its Save is out" passes on the base copy: a test of preserved behaviour.

The top-level row's run on the base copy does not hold the change back, so its code is changed (`createRowWriter` calls `withdraw`), as round item 1 directs for that outcome. The 9 other failures of the same run are the first build's rows, with the same assertion lines as the first run above.

After the code change, the worktree's file: `npx vitest run --maxWorkers 4 --reporter dot tests/views/system/workbench/scopes.client.test.ts`: `Test Files  1 passed (1)`, `Tests  17 passed (17)`; then in the last round below.

## DONE / NOT DONE

| Item | State | Proof (command and last line) |
| --- | --- | --- |
| 1. A landed Save ends what it saved, in any push order, matched by slot | DONE | the last round's 12 files: `Tests  174 passed (174)`, which hold the scopes rows of cases 1 to 6 and 8; case-run of cases 9 to 13 after the first build's change, quoted below |
| 1. Kept behaviours (edited again while out, edit after landing, refused, kept draft, third value, Discard, closed writer) | DONE | scopes rows 'a row edited again...' and 'a refused Save...'; `editor-saved.test.ts` in the last round; case-run lines of cases 10 to 12 below |
| 1. Wiring through `ScopesDeps.wrote` in `Settings.svelte`, layer rules | DONE | `Settings.svelte:189` `wrote: (slots) => editors.saved(slots)`; `tests/checks/tree/boundaries.test.ts` in the last round, `Test Files  12 passed (12)` |
| 1. Comments made true | DONE | read; each listed under "Comments and documents" |
| Round 1, item 1: an edit back to the file's value while the Save is out is kept (family and top-level row), not told as written; a Discard while out stays a Discard | DONE | the four rows of "Repair round 1" above, three failing on the base copy on the held change and the Discard row passing there; all four pass in the last round (`Tests  174 passed (174)`) |
| Round 1, item 2: the two 101-column doc comments rewrapped; `awk 'length > 100'` prints only lines over 100 on the base | DONE | `writer.ts:58-60` (the doc of `saved`) and `scopes.client.test.ts:257-260` (the doc of the bench's `edit`) are doc comments of more than one line, each line at or under 100 columns; the `awk` over the 11 changed files prints 7 lines, each over 100 on the base, listed under "Lines over 100 columns" |
| Round 1, item 3: `ScopesDeps.wrote`'s doc comment names the rows left out | DONE | `scopes.svelte.ts:59-62`: "Told, once a Save's answer lands, the slots of the rows it wrote, leaving out a row changed again or edited back to its file's value while the Save was out." |
| Round 1, item 4: `slotHub`'s doc comment names the three places that set `row.slot` | DONE | `scopes.svelte.ts:301-307`, naming `localRows` and `repoRow` in `state/system/config/rows.ts` and `withHubs` in `state/system/config/view/hub-settings.svelte.ts` |
| Round 1, item 5: nothing else in the code changes | DONE | `diff -rq` against the base copy lists the 11 files of "Files changed", the round's additions being `write.ts`, `Editor.svelte` (head comment) and `workbench-fixture.ts` (outside the round's list, named in the first section) |
| 2. A card's text field of a form refused at the box | DONE | render run after the change, cases 14 to 21, quoted below |
| 2. Only a card's field changes; inputs unchanged | DONE | `diff -rq ../migration-O196-base/src src` lists no file under `src/lib/ui/` and no `Control.svelte`, `AppControl.svelte`, `Item.svelte`; case 21 after the change unchanged |
| 3. Part 1 scopes row under G96, fails on the unchanged tree on the held change | DONE | first run above, 8 rows failing on `[1, true]` or `[+0, true]` assertions |
| 3. Part 1 writer-alone row in `editor-saved.test.ts` | NOT DONE, dropped as the brief directs | case-run line `writer alone => "TypeError: writer.saved is not a function"` on the unchanged tree |
| 3. Part 2 render run (ruling 791, no test) | DONE | source and output below |
| Verify 1: the test files | DONE | `npx vitest run --maxWorkers 4 --reporter dot` over the 12 files below: `Test Files  12 passed (12)`, `Tests  174 passed (174)` |
| Verify 2: prettier and eslint over the 11 changed files | DONE | `npx prettier --check <11 files>`: `All matched files use Prettier code style!`, `prettier exit 0`; `npx eslint <11 files>`: `eslint exit 0` |
| Verify 3: ASCII gate over the 11 changed files | DONE | the gate's `perl` command printed nothing, `ascii exit 0` |
| Verify 4: `npm run check` | DONE | `COMPLETED 4690 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| Verify 5: `sh utils/unused-exports.sh` against the base list | DONE | `script exit 0`; `diff ../migration-O196-base/unused-exports.txt <output>`: no line, `diff exit 0` (335 lines both) |
| `npm run diagrams` before the last round | DONE | `diagrams exit 0`; `git status --short` afterwards lists no file under `docs/` |

The 12 test files of the last round: `tests/state/system/settings/editor-saved.test.ts`, `tests/views/system/workbench/scopes.client.test.ts`, `tests/state/system/config/sparse-card.test.ts`, `tests/state/system/settings/row-writer.test.ts`, `tests/state/system/settings/hub-scope.test.ts`, `tests/state/system/settings/collection-fields.test.ts`, `tests/state/system/settings/machine-section.test.ts`, `tests/state/system/settings/port-row.test.ts`, `tests/checks/tree/size.test.ts`, `tests/checks/tree/boundaries.test.ts`, and the two found by `grep -rl -F` of the changed modules under `tests`: `tests/state/system/settings/fold.test.ts` (imports `editors/fields`) and `tests/state/workbench/options-pages.test.ts` (imports `workbench-fixture`, which draws `Item.svelte` and so `FieldControl.svelte` and `Cards.svelte`). The grep, after the round's last change: `scopes/write` gives row-writer, options-pages, scopes.client, workbench-fixture; `editors/writer` gives sparse-card, editor-saved, scopes.client, workbench-fixture; `scopes/scopes.svelte` gives scopes.client; `workbench-fixture` gives sparse-card, editor-saved, row-writer, options-pages; `editors/fields` gives sparse-card, collection-fields, fold; `editors/Cards.svelte` gives collection-fields; `editors/Editor.svelte`, `editors/FieldControl.svelte` and `workbench/Settings.svelte` give none. So the round adds no file to the twelve.

The last round's lines, as printed:

```
 Test Files  12 passed (12)
      Tests  174 passed (174)
Checking formatting...
All matched files use Prettier code style!
prettier exit 0
eslint exit 0
ascii exit 0
1795726936848 COMPLETED 4690 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
script exit 0
     335
     335
diff exit 0
```

Runs of each test command in repair round 1: the last round (12 files) once, after the round's last change, with no edit after it. `scopes.client.test.ts` alone (1 file) once, after the code change (`Tests  17 passed (17)`). The base-copy file (1 file) four times: once with two rows running out of time (the bench's Save waited for a send that a scope with nothing held never makes, fixed in the bench by `Promise.race([out, saving])`), once after that fix (`Tests  12 failed | 5 passed (17)`), once with `-t` (which matched no row, `Tests  17 skipped (17)`) and once with its output kept for the diffs quoted above (`Tests  12 failed | 5 passed (17)`). `npm run diagrams`, prettier check, eslint, the ASCII gate, `npm run check` and `sh utils/unused-exports.sh` once each, in the last round; `npx prettier --write` twice over the files edited. No whole-suite command ran.

Runs of each test command in the first build: the last round (12 files) once. `scopes.client.test.ts` alone four more times: once on the unchanged tree, once after the part 1 change, once after the eslint fix of its line 251 (`Unnecessary conditional`, a destructuring replaced by `.at(0)`), once after the check of the slots the Save tells was added to two rows (`Tests  13 passed (13)` each time). `editor-saved.test.ts` alone once, on the unchanged tree. After the last test edit, prettier check, the ASCII gate and `npm run check` ran again (`0 ERRORS 0 WARNINGS`), and eslint over that file (exit 0). `npm run check` ran twice, eslint three times, `sh utils/unused-exports.sh` twice. No whole-suite command ran: no `npm run test:quick`, `npm test`, `npm run test:checks`, `npm run test:landing`, `npm run test:slow` or `npx vitest run` without a file. The case-run files ran under their own config: the cases file twice (before, after), the render file four times (twice before, the first with a box finder that matched the wrong element, then after, then the case 18 rows alone after with `offerNote` added).

## Cases 9 to 13 after the change

```
case 9 both land => {"done":true,"primary":{"changes":0,"draft":false},"lab":{"changes":0,"draft":false}}
case 9 lab refused => {"done":false,"primary":{"changes":0,"draft":false},"lab":{"changes":1,"draft":true},"labSaid":true}
case 10 => {"afterDiscard":{"changes":0,"draft":false},"afterOldPush":{"changes":0,"draft":false}}
case 11 => {"afterEdit":{"changes":1,"draft":true},"afterSavedPush":{"changes":1,"draft":true}}
case 12 => {"done":true,"left":{"changes":0,"draft":true},"ended":0}
case 13 => {"asked":false,"question":"scope","sent":1,"left":{"changes":0,"draft":false}}
writer alone => {"held":false,"ended":0}
      Tests  7 passed (7)
```

Source of `.agents/scratch/O196/vitest.config.ts` (the worktree's config with each project's include set to this folder):

```ts
import { defineConfig } from 'vitest/config';
import base from '../../../vite.config.ts';

const HERE = '.agents/scratch/O196/tests';

export default defineConfig((env) => {
    const made = typeof base === 'function' ? base(env) : base;
    const projects = (made.test?.projects ?? []) as { test: { name: string; include: string[] } }[];
    for (const project of projects) {
        project.test.include =
            project.test.name === 'client'
                ? [`${HERE}/**/*.client.test.ts`]
                : project.test.name === 'unit'
                  ? [`${HERE}/**/*.test.ts`, `!${HERE}/**/*.client.test.ts`]
                  : [`${HERE}/**/*.dom.test.ts`];
    }
    return made;
});
```

Source of `.agents/scratch/O196/tests/cases.client.test.ts` (unchanged between the two runs):

```ts
import { tick } from 'svelte';
import { expect, it, vi } from 'vitest';
import { applyEdit, draftOf, movedFrom, type Draft, type Edit } from '../../../../src/lib/state/system/config/editors/draft.ts';
import { savedBase, savedDraft, slotOf, withSavedDraft } from '../../../../src/lib/state/system/config/editors/slots.ts';
import { createEditorWriter } from '../../../../src/lib/state/system/config/editors/writer.ts';
import { fileRows, type ConfigRow } from '../../../../src/lib/state/system/config/rows.ts';
import type { SaveBody } from '../../../../src/lib/state/system/config/scopes/changes.ts';
import { fileOf, type Scope, type ScopeGround } from '../../../../src/lib/state/system/config/scopes/scope.ts';
import type { WriteAnswer } from '../../../../src/lib/state/shared/stores/shapes.ts';
import { createScopes } from '../../../../src/lib/views/system/workbench/settings/scopes/scopes.svelte.ts';
import { memoryStage } from '../../../../tests/views/system/workbench/workbench-fixture.ts';
import { bareLists, config, shipped, text } from '../../../../tests/state/system/settings/fixture.ts';

const WRITTEN: WriteAnswer = { ok: true, changed: ['x'], refused: [] };
const REFUSED: WriteAnswer = { ok: false, changed: [], refused: [{ field: 'digest', reason: 'The file changed since it was read' }] };
const HUBS: ScopeGround = {
    folders: [{ key: 'hub', dir: '/w/hub', hub: true }, { key: 'lab', dir: '/w/lab', hub: true }],
    primary: 'hub',
    workspaceFile: '.oculus/workspaces/w.yml'
};
const PRIMARY: Scope = { kind: 'primary' };
const LAB: Scope = { kind: 'hub', hub: 'lab' };
const WORKSPACE: Scope = { kind: 'workspace' };
const TASKS = [
    { task: 'litwatch', label: 'L', note: 'N', last_run: 'radar', stale_days: 31 },
    { task: 'scout', label: 'S', note: 'N', last_run: 'scout', stale_days: 7 }
];
const LISTS = bareLists(config);

function tasks(value: unknown, scope: Scope = PRIMARY): ConfigRow {
    const made = fileRows('sources.yml', shipped['sources.yml'], { ...config, update_tasks: value },
        { hubFile: { text: text('{}\n'), present: true }, workspace: null }).rows.find((one) => one.key === 'update_tasks');
    if (made === undefined) throw new Error('no row');
    return scope.kind === 'hub' ? { ...made, hub: scope.hub, slot: scope.hub } : made;
}

function limits(value: unknown): ConfigRow {
    const made = fileRows('behavior.yml', shipped['behavior.yml'], { ...config, read_limits: value },
        { workspace: { root: 'hub', path: '.oculus/workspaces/w.yml', text: text('') } }).rows.find((one) => one.key === 'read_limits');
    if (made === undefined) throw new Error('no row');
    return made;
}

function bench(on: Scope, ground: ScopeGround = HUBS) {
    let scope = on;
    let floor = ground;
    let state: unknown = {};
    const sent: SaveBody[] = [];
    const answers: ((answer: WriteAnswer) => void)[] = [];
    const ended = vi.fn();
    const scopes = createScopes({
        scope: () => scope,
        ground: () => floor,
        read: () => ({ name: 'file', present: true, blocked: null, digest: 'digest' }),
        downloads: () => undefined,
        send: (body) => { sent.push(body); return new Promise<WriteAnswer>((answer) => answers.push(answer)); },
        saveWorkspace: () => Promise.resolve(WRITTEN),
        wrote: (slots) => writer.saved(slots)
    });
    const writer = createEditorWriter({
        stage: scopes.stage,
        changed: () => undefined,
        ended: (row) => { ended(row); state = withSavedDraft(state, slotOf(row), null); },
        held: (row) => savedDraft(state, row),
        stale: (row) => movedFrom(savedBase(state, slotOf(row)), row),
        lists: () => LISTS
    });
    function edit(row: ConfigRow, next: Edit): void {
        const held = savedDraft(state, row);
        const draft: Draft | null = held ?? draftOf(row);
        if (draft === null) throw new Error('no draft');
        const changed = applyEdit(draft, next);
        const base = held === undefined ? row.value : savedBase(state, slotOf(row));
        state = withSavedDraft(state, slotOf(row), changed, base);
        writer.save(row, changed);
    }
    async function settle(): Promise<void> {
        for (let at = 0; at < 10; at += 1) await tick();
    }
    return {
        scopes, writer, edit, sent, ended, settle,
        answer: (answer: WriteAnswer) => answers.shift()?.(answer),
        discard: (row: ConfigRow) => writer.discard(row),
        left: (row: ConfigRow, of: Scope = scope) => ({ changes: scopes.changes.count(fileOf(of, floor)), draft: savedDraft(state, row) !== undefined }),
        valueOf: (at: number) => { const change = sent[at]?.changes[0]; return change !== undefined && 'value' in change ? change.value : undefined; },
        show: (next: Scope) => { scope = next; },
        ground: (next: ScopeGround) => { floor = next; }
    };
}

function print(name: string, result: unknown): void {
    console.log(`${name} => ${JSON.stringify(result)}`);
    expect(name).not.toBe('');
}

it('case 9: Save All over two files with family drafts, lab not on screen, both landing', async () => {
    const view = bench(LAB);
    view.edit(tasks(TASKS, LAB), { do: 'set', index: 1, field: 'stale_days', value: '8' });
    view.show(PRIMARY);
    view.edit(tasks(TASKS), { do: 'set', index: 0, field: 'stale_days', value: '30' });
    const all = view.scopes.saveAll();
    await view.settle(); view.answer(WRITTEN);
    await view.settle(); view.answer(WRITTEN);
    const done = await all;
    view.writer.pushed(tasks(TASKS));
    view.writer.pushed(tasks(view.valueOf(1)));
    const primary = view.left(tasks(view.valueOf(1)), PRIMARY);
    view.show(LAB);
    view.writer.pushed(tasks(TASKS, LAB));
    view.writer.pushed(tasks(view.valueOf(0), LAB));
    print('case 9 both land', { done, primary, lab: view.left(tasks(view.valueOf(0), LAB), LAB) });
});

it('case 9: Save All over two files, lab refused', async () => {
    const view = bench(LAB);
    view.edit(tasks(TASKS, LAB), { do: 'set', index: 1, field: 'stale_days', value: '8' });
    view.show(PRIMARY);
    view.edit(tasks(TASKS), { do: 'set', index: 0, field: 'stale_days', value: '30' });
    const all = view.scopes.saveAll();
    await view.settle(); view.answer(REFUSED);
    await view.settle(); view.answer(WRITTEN);
    const done = await all;
    view.writer.pushed(tasks(TASKS));
    view.writer.pushed(tasks(view.valueOf(1)));
    const primary = view.left(tasks(view.valueOf(1)), PRIMARY);
    view.show(LAB);
    view.writer.pushed(tasks(TASKS, LAB));
    print('case 9 lab refused', { done, primary, lab: view.left(tasks(TASKS, LAB), LAB), labSaid: view.scopes.said('hub:lab') !== null });
});

it('case 10: Discard after a landed Save, before the push', async () => {
    const view = bench(PRIMARY);
    view.edit(tasks(TASKS), { do: 'set', index: 1, field: 'stale_days', value: '8' });
    const saving = view.scopes.save();
    await view.settle(); view.answer(WRITTEN); await saving;
    view.discard(tasks(TASKS));
    const after = view.left(tasks(TASKS));
    view.writer.pushed(tasks(TASKS));
    print('case 10', { afterDiscard: after, afterOldPush: view.left(tasks(TASKS)) });
});

it('case 11: an edit after a landed Save, before the push of the saved value', async () => {
    const view = bench(PRIMARY);
    view.edit(tasks(TASKS), { do: 'set', index: 1, field: 'stale_days', value: '8' });
    const saving = view.scopes.save();
    await view.settle(); view.answer(WRITTEN); await saving;
    view.edit(tasks(TASKS), { do: 'set', index: 1, field: 'stale_days', value: '9' });
    const held = view.left(tasks(TASKS));
    view.writer.pushed(tasks(view.valueOf(0)));
    print('case 11', { afterEdit: held, afterSavedPush: view.left(tasks(view.valueOf(0))) });
});

it('case 12: the writer closed while a Save is out', async () => {
    const view = bench(PRIMARY);
    view.edit(tasks(TASKS), { do: 'set', index: 1, field: 'stale_days', value: '8' });
    const saving = view.scopes.save();
    await view.settle();
    view.writer.close();
    view.answer(WRITTEN);
    const done = await saving;
    view.writer.pushed(tasks(TASKS));
    view.writer.pushed(tasks(view.valueOf(0)));
    print('case 12', { done, left: view.left(tasks(TASKS)), ended: view.ended.mock.calls.length });
});

it('case 13: the unsaved workspace saved through the name question with a family draft', async () => {
    const unsaved: ScopeGround = { ...HUBS, workspaceFile: null };
    const view = bench(WORKSPACE, unsaved);
    view.edit(limits({ next: 300 }), { do: 'remove', index: 0 });
    const asked = await view.scopes.save();
    const question = view.scopes.asking();
    await view.scopes.named('w');
    view.ground(HUBS);
    view.scopes.resume();
    await view.settle(); view.answer(WRITTEN); await view.settle();
    view.writer.pushed(limits({ next: 300 }));
    view.writer.pushed(limits(view.valueOf(0)));
    print('case 13', { asked, question, sent: view.sent.length, left: view.left(limits(view.valueOf(0))) });
});

it('the writer alone told of a landed Save in the form the view wires it', () => {
    const stage = memoryStage();
    const draft = applyEdit(draftOf(tasks(TASKS)) as Draft, { do: 'set', index: 1, field: 'stale_days', value: '8' });
    const ended = vi.fn();
    const writer = createEditorWriter({ stage, changed: () => undefined, ended, held: () => draft, stale: () => false, lists: () => LISTS });
    writer.save(tasks(TASKS), draft);
    stage.drop(tasks(TASKS));
    let result: unknown;
    try {
        writer.saved([slotOf(tasks(TASKS))]);
        writer.pushed(tasks(TASKS));
        result = { held: stage.held(tasks(TASKS)) !== undefined, ended: ended.mock.calls.length };
    } catch (error) {
        result = String(error);
    }
    print('writer alone', result);
});
```

The source above is the file as run, with lines of one statement joined for length; the file ran as written with one statement per line.

## The render run of part 2

Before the change: the 21 lines quoted under the first run (cases 14 to 21). After the change:

```
case 14 => {"value":"Bad Name","invalid":true,"title":"It must be lowercase letters, digits and dashes, starting with a letter.","afterBox":"<span> It must be lowercase letters, digits and dashes, starting with a letter.","drawnAsText":1,"footLine":"Entry 1, task: It must be lowercase letters, digits and dashes, starting with a letter.","staged":0}
case 15 => {"value":"litwatch","invalid":false,"title":null,"afterBox":null,"drawnAsText":0,"footLine":null}
case 16 => {"value":"","invalid":false,"title":null,"afterBox":null,"drawnAsText":0,"footLine":null}
case 17 => {"value":"../x","invalid":true,"title":"It must be a path inside the folder it is read in: not absolute, ending in no slash, with no .. and no backslash.","afterBox":"<span> It must be a path inside the folder it is read in: not absolute, ending in no slash, with no .. and no backslash.","drawnAsText":1,"footLine":"Entry 1, name: It must be a path inside the folder it is read in: not absolute, ending in no slash, with no .. and no backslash."}
case 18 ready => {"offerNote":null,"label":"Entry 1, value","value":"not a bundle","invalid":true,"title":"It must be the bundle id of an application, such as com.apple.Preview.","afterBox":"<span> It must be the bundle id of an application, such as com.apple.Preview.","drawnAsText":1,"footLine":"Entry 1, value: It must be the bundle id of an application, such as com.apple.Preview."}
case 18 loading => {"offerNote":"loading","label":"Entry 1, value","value":"not a bundle","invalid":true,"title":"It must be the bundle id of an application, such as com.apple.Preview.","afterBox":"<span> It must be the bundle id of an application, such as com.apple.Preview.","drawnAsText":1,"footLine":"Entry 1, value: It must be the bundle id of an application, such as com.apple.Preview."}
case 19 => {"value":"Bad Name","invalid":true,"title":"It must be lowercase letters, digits and dashes, starting with a letter.","afterBox":"<span> It must be lowercase letters, digits and dashes, starting with a letter.","drawnAsText":1,"footLine":null}
case 20 => {"value":"1.5","invalid":true,"title":"It must be a whole number.","afterBox":"<span> It must be a whole number.","drawnAsText":1,"footLine":"Entry 1, stale_days: It must be a whole number."}
case 21 typed => {"value":"a/b","invalid":false,"title":null,"afterBox":null,"drawnAsText":0,"footLine":null}
case 21 settled => {"value":"a/b","invalid":true,"title":"It must be the name of one file: no slash or backslash, and neither . nor .. alone.","afterBox":"<p> It must be the name of one file: no slash or backslash, and neither . nor .. alone.","drawnAsText":1,"footLine":null,"underItem":"It must be the name of one file: no slash or backslash, and neither . nor .. alone."}
      Tests  10 passed (10)
```

How to read it: `afterBox` is the first `role="status"` element between the box's `<input>` and the next `<input>`, with its tag, so `<span>` is the sentence beside the box (`FieldControl`'s or `NumberInput`'s), `<li>` the foot list and `<p>` the line under the item. `drawnAsText` counts the sentence as a whole text node (`>sentence<`), which leaves out the box's title and the foot line's "Entry 1, task: " prefix; 1 means it is drawn once outside the foot list. `offerNote` (added to the case 18 rows for the after run; the before run had no such field) is `offerFor(spec, 'not a bundle', lists).note`, which shows the loading row ran with its list loading.

Source of `.agents/scratch/O196/tests/render.test.ts` as it ran after the change (the before run is the same file without the `offerFor` import and the `offerNote` and `spec` lines of case 18):

```ts
import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';
import { vscodeRuleIds } from '../../../../src/lib/data/places/code-rules.ts';
import { catalogOf } from '../../../../src/lib/data/sources/config/catalog/options.ts';
import { applyEdit, draftOf, type Draft } from '../../../../src/lib/state/system/config/editors/draft.ts';
import { slotOf, withSavedDraft } from '../../../../src/lib/state/system/config/editors/slots.ts';
import { listsOf, type Lists } from '../../../../src/lib/state/system/config/editors/sources.ts';
import { offerFor } from '../../../../src/lib/state/system/config/editors/offers.ts';
import { createEditorWriter } from '../../../../src/lib/state/system/config/editors/writer.ts';
import { fileRows, type ConfigRow } from '../../../../src/lib/state/system/config/rows.ts';
import { createRowWriter, type RowWriter } from '../../../../src/lib/state/system/config/scopes/write.ts';
import { withTypedText } from '../../../../src/lib/state/system/config/typed.ts';
import { t } from '../../../../src/lib/state/shared/words/text.ts';
import Item from '../../../../src/lib/views/system/workbench/settings/Item.svelte';
import { clientContext, emptyClient } from '../../../../tests/fixtures/client.ts';
import { memoryStage } from '../../../../tests/views/system/workbench/workbench-fixture.ts';

const config = loadConfig(engineDir()).config;
const shipped = catalogOf(config);
const TAB = 'settings-1';

const LITWATCH = { task: 'litwatch', label: 'L', note: 'N', last_run: 'radar', stale_days: 31 };

function withKey(key: string, value: unknown): Record<string, unknown> {
    const [head, ...more] = key.split('.');
    if (more.length === 0) return { ...config, [head]: value };
    const inner = (config[head] ?? {}) as Record<string, unknown>;
    return { ...config, [head]: { ...inner, [more.join('.')]: value } };
}

function rowOf(file: string, key: string, value: unknown): ConfigRow {
    const made = fileRows(file, shipped[file], withKey(key, value),
        { hubFile: { text: { text: '{}\n', truncated: false, error: '', loading: false }, present: true }, workspace: null }
    ).rows.find((one) => one.key === key);
    if (made === undefined) throw new Error(`no row ${key}`);
    return made;
}

function lists(bundles: 'ready' | 'loading' = 'ready'): Lists {
    const made = listsOf({ config, portfolio: null, views: [], tiers: null, themeClasses: [], codeThemeClasses: vscodeRuleIds(),
        offers: { themes: [], icons: [] }, folder: () => ({ state: 'ready', entries: [] }) });
    return {
        ...made,
        items: (source) =>
            source === 'bundle_ids'
                ? bundles === 'ready' ? { state: 'ready', items: ['com.apple.Preview'] } : { state: 'loading' }
                : made.items(source)
    } as Lists;
}

function drawn(row: ConfigRow, draft?: Draft, made: Lists = lists(), prepare?: (writer: RowWriter, client: ReturnType<typeof emptyClient>) => void) {
    const client = emptyClient();
    if (draft !== undefined) client.ui.setInstanceState(TAB, withSavedDraft({}, slotOf(row), draft, row.value));
    const stage = memoryStage();
    const writer = createRowWriter(stage, () => undefined, () => made);
    const editors = createEditorWriter({ stage, changed: () => undefined, ended: () => undefined, held: () => draft, stale: () => false, lists: () => made });
    prepare?.(writer, client);
    const { body } = render(Item, {
        props: { row, id: TAB, writer, editors, lists: made, kept: true, onrepo: () => undefined },
        context: clientContext(client)
    });
    return { body, staged: stage.changes.size };
}

function box(body: string, label: string, sentence: string) {
    const input = [...body.matchAll(/<input[^>]*>/g)].find((one) => one[0].includes(`aria-label="${label}"`));
    if (input === undefined) return { found: false };
    const tag = input[0];
    const rest = body.slice((input.index ?? 0) + tag.length);
    const next = rest.indexOf('<input');
    const after = next < 0 ? rest : rest.slice(0, next);
    const status = /<(span|li|p)[^>]*role="status"[^>]*>([^<]*)</.exec(after);
    return {
        value: /value="([^"]*)"/.exec(tag)?.[1] ?? '',
        invalid: /aria-invalid="true"/.test(tag),
        title: /title="([^"]*)"/.exec(tag)?.[1] ?? null,
        afterBox: status === null ? null : `<${status[1]}> ${status[2]}`,
        drawnAsText: body.split(`>${sentence}<`).length - 1,
        footLine: /<li role="status">([^<]*)<\/li>/.exec(body)?.[1] ?? null
    };
}

function print(name: string, result: unknown): void {
    console.log(`${name} => ${JSON.stringify(result)}`);
    expect(name).not.toBe('');
}

const TASK_NAME = t('workbench.settings_not_task_name');

function setTask(text: string): Draft {
    const row = rowOf('sources.yml', 'update_tasks', [LITWATCH]);
    return applyEdit(draftOf(row) as Draft, { do: 'set', index: 0, field: 'task', value: text === '' ? undefined : text });
}

const TASK_BOX = t('settings.editor_field', 1, 'task');

it('labels', () => { print('task sentence', TASK_NAME); print('task box label', TASK_BOX); });

it("case 14: 'Bad Name' in the task box", () => {
    const row = rowOf('sources.yml', 'update_tasks', [LITWATCH]);
    const { body, staged } = drawn(row, setTask('Bad Name'));
    print('case 14', { ...box(body, TASK_BOX, TASK_NAME), staged });
});

it("case 15: 'litwatch' in the task box", () => {
    const row = rowOf('sources.yml', 'update_tasks', [LITWATCH]);
    const { body } = drawn(row, setTask('litwatch'));
    print('case 15', box(body, TASK_BOX, TASK_NAME));
});

it('case 16: an empty task box', () => {
    const row = rowOf('sources.yml', 'update_tasks', [LITWATCH]);
    const { body } = drawn(row, setTask(''));
    print('case 16', box(body, TASK_BOX, TASK_NAME));
});

it("case 17: '../x' in a project_docs name box", () => {
    const row = rowOf('sources.yml', 'project_docs', [{ name: 'README.md', label: 'Readme' }]);
    const draft = applyEdit(draftOf(row) as Draft, { do: 'set', index: 0, field: 'name', value: '../x' });
    const { body } = drawn(row, draft);
    print('case 17', box(body, t('settings.editor_field', 1, 'name'), t('workbench.settings_not_inner_path')));
});

for (const state of ['ready', 'loading'] as const) {
    it(`case 18: 'not a bundle' in open.program_ext's value box, its list ${state}`, () => {
        const row = rowOf('behavior.yml', 'open.program_ext', { '.pdf': 'com.apple.Preview' });
        const draft = applyEdit(draftOf(row) as Draft, { do: 'set', index: 0, field: 'value', value: 'not a bundle' });
        const { body } = drawn(row, draft, lists(state));
        const label = /aria-label="([^"]*)"[^>]*value="not a bundle"|value="not a bundle"[^>]*aria-label="([^"]*)"/.exec(body);
        const spec = row.entry.fields?.value;
        print(`case 18 ${state}`, {
            offerNote: spec === undefined ? 'no spec' : offerFor(spec, 'not a bundle', lists(state)).note,
            label: label?.[1] ?? label?.[2] ?? null,
            ...box(body, label?.[1] ?? label?.[2] ?? '', t('workbench.settings_not_bundle_id'))
        });
    });
}

it('case 19: a file holding task: Bad Name, no draft', () => {
    const row = rowOf('sources.yml', 'update_tasks', [{ ...LITWATCH, task: 'Bad Name' }]);
    const { body } = drawn(row);
    print('case 19', box(body, TASK_BOX, TASK_NAME));
});

it("case 20: '1.5' in a stale_days box", () => {
    const row = rowOf('sources.yml', 'update_tasks', [LITWATCH]);
    const draft = applyEdit(draftOf(row) as Draft, { do: 'set', index: 0, field: 'stale_days', value: '1.5' });
    const { body } = drawn(row, draft);
    print('case 20', box(body, t('settings.editor_field', 1, 'stale_days'), t('workbench.settings_not_whole')));
});

it("case 21: latex.main_file holding 'a/b', typed and then settled", () => {
    const row = rowOf('behavior.yml', 'latex.main_file', 'main.tex');
    const sentence = t('workbench.settings_not_file_name');
    const typed = drawn(row, undefined, lists(), (_writer, client) =>
        client.ui.setInstanceState(TAB, withTypedText({}, slotOf(row), 'a/b')));
    print('case 21 typed', box(typed.body, row.title, sentence));
    const settled = drawn(row, undefined, lists(), (writer, client) => {
        client.ui.setInstanceState(TAB, withTypedText({}, slotOf(row), 'a/b'));
        writer.submit(row, 'a/b');
    });
    const said = /<p class="said[^"]*" role="status">([^<]*)<\/p>/.exec(settled.body)?.[1] ?? null;
    print('case 21 settled', { ...box(settled.body, row.title, sentence), underItem: said });
});
```

As with the cases file, short statements are joined onto one line here for length; the file ran with the same statements. The `.agents/scratch/O196/` folder (the case-run files of both launches, the config, the base-copy test of round 1, its log, the diagrams log and the unused-exports output) is removed: `ls -a .agents` lists `.`, `..`, `plan.yaml`. The config of round 1's base-copy run is the `vitest.config.ts` quoted above, written again with the same source.

## Files changed

From `diff -rq` of `src` and `tests` against `../migration-O196-base/` after the round's last change; every path is on the step's write list, and each is on the round's except `workbench-fixture.ts` (named in the first section). Line counts by `wc -l`.

| File | Lines (base to now) | Changed in |
| --- | --- | --- |
| `src/lib/state/system/config/editors/writer.ts` | 134 to 184 | build, round 1 |
| `src/lib/state/system/config/scopes/write.ts` | 167 to 176 | round 1 |
| `src/lib/views/system/workbench/settings/scopes/scopes.svelte.ts` | 304 to 421 | build, round 1 |
| `src/lib/views/system/workbench/Settings.svelte` | 495 to 498 | build |
| `src/lib/views/system/workbench/editors/Editor.svelte` | 303 to 304 (head comment only) | round 1 |
| `src/lib/state/system/config/editors/fields.ts` | 800 to 810 | build |
| `src/lib/views/system/workbench/editors/FieldControl.svelte` | 495 to 517 | build |
| `src/lib/views/system/workbench/editors/Cards.svelte` | 499 to 500 | build |
| `tests/state/system/settings/editor-saved.test.ts` | 215 to 217 (head comment only) | build |
| `tests/views/system/workbench/scopes.client.test.ts` | 91 to 561 | build, round 1 |
| `tests/views/system/workbench/workbench-fixture.ts` | 85 to 86 | round 1 |

Not changed, though on a write list: `src/lib/views/system/workbench/editors/writer.svelte.ts` (it spreads the inner writer, so `saved` passes through; its head comment stays true) and `src/lib/state/system/config/scopes/changes.ts` (the record of a row edited back lives in the scopes, which know which Save is out). `git status --short` also lists `.scratch/migration/agents/briefs/O196.md`, `briefs/O196-round1.md` and `reviews/O196-refuter.md`, the orchestrator's files, which this step did not write.

What changed, by file:

- `writer.ts`: `EditorWriter.saved(slots)`. The writer keeps `written` (the slots a landed Save wrote whose drafts have not ended) and `seen` (the row each draft was last edited or pushed with). `pushed` does not hold a kept draft again while `wrote(row)`; `saved` marks the slots and pushes each seen row of them again, so a push of the saved value that came before the answer ends the draft. The marks and the seen row are forgotten when the draft ends (`pushed`, `discard`, `reset`) and at `close`.

```ts
if (unheld && !hooks.stale(row) && !wrote(row)) {
    hooks.stage.set(row, made.value);
    hooks.changed();
}
```

- `writer.ts`, round 1: a draft equal to the row's value calls `hooks.stage.withdraw(row)` where it called `drop` (`writer.ts:104`), and so does a Reset of a row the file holds no key for (`writer.ts:120`); Discard keeps `drop` (`writer.ts:112`).
- `write.ts`, round 1: `Stage` gains `withdraw: (row: ConfigRow) => void` (`write.ts:76-81`), and `drop`'s doc says it is a Discard's. `createRowWriter` calls `withdraw` for a value equal to the row's with a change held (`:132`), an emptied box of a row the file holds no key for (`:145`) and a Reset of such a row (`:159`).
- `scopes.svelte.ts`, round 1: `out` holds the names of the key changes each file's Save sent until its answer lands, and `backs` what each row edited back while that Save was out held before it. `stage.withdraw` records it, only while the row's name is out, as `{ value: row.value }` for a row the file holds the key of and `{ reset: true }` for one it does not, and drops the change; `stage.set`, `stage.reset`, `stage.drop` and the bar's `discard` forget the record (`unback`, `backs.delete`). A landed answer restages, after the changes typed while out, `heldBack` of each record: the value with `base` the value the Save wrote for a row written whole, or the taking out; these are passed with the changes typed while out to `writtenSlots`, so the row is not told. A refused answer forgets the records, the file holding what the row was edited back to.

```ts
withdraw: (row) => {
    const at = file();
    const name = keyName(row.file, row.key);
    if (out.get(at)?.has(name) === true) {
        const held: Held = row.own ? { value: row.value } : { reset: true };
        const back = { file: row.file, key: row.key, held, whole: writtenWhole(row.control) };
        backs.set(at, new Map(backs.get(at)).set(name, back));
    }
    inner.drop(at, name);
},
```

(The block above leaves out the code comment and joins the lines prettier breaks `back` over.)

- `Editor.svelte`, round 1: the head comment only; the editor's edit back (`Editor.svelte:178-181`) calls `editors.save`, which reaches `withdraw`, so no code of it changes.
- `workbench-fixture.ts`, round 1: `memoryStage` gains `withdraw`, which deletes the change as `drop` does.
- `scopes.svelte.ts`, first build: `ScopesDeps.wrote: (slots: Slot[]) => void`; after a landed answer `saveFile` drops, restages what was typed while out, then calls `deps.wrote(writtenSlots(...))`. `writtenSlots` gives one slot per key change sent whose key no restaged change holds; `slotHub` gives the slot's hub from the file's name (a hub or `local` file of a hub other than the primary: the hub; `repo:<root>`: the root; else none), the same rule `row.slot` is set by (`rows.ts:503`, `rows.ts:553`, `hub-settings.svelte.ts:208`). A refused, blocked, gone or name-waiting Save calls nothing.
- `Settings.svelte:189`: `wrote: (slots) => editors.saved(slots)`.
- `fields.ts:553`: `textFormRefusal(spec, text)`: null for `''`, for a spec with no form or a text that has it (`hasForm`), else `formMessage(spec.form)`.
- `FieldControl.svelte`: prop `refusesForm`; `formWords` derived for `control === 'text'` only; the text and suggesting boxes get `invalid={invalid ?? formWords}`; after the control, `{#if formWords !== undefined}<span class="refused" role="status">{formWords}</span>{/if}`, styled red at `--fs-sm` as `NumberInput`'s words.
- `Cards.svelte:305`: `refusesForm` on its `FieldControl`.

## Edits to existing assertions, allow lists and predicates

None. `diff` of each changed test file against the base copy (`grep "^<"` of it) removes only these lines: in `editor-saved.test.ts` the head comment line `// keys set to null (tests/server/edit/config-value.test.ts).` (extended by a sentence); in `scopes.client.test.ts` the head comment line `// tests/routes/edit/undo/config-save.test.ts holds.` (extended), the import `import type { ScopeGround } ...` (merged into a wider import) and `saveWorkspace: () => Promise.resolve(WRITTEN)` in the existing helper `scopesOnLocal`, which gains a comma and `wrote: () => undefined`, since the dependency is required; in `workbench-fixture.ts` none (one line added). No `expect` line of an existing row changed.

Round 1 also changes rows the first build added, none of them on the base: the describe 'a family row whose Save lands' is 'a row whose Save lands', since it now holds top-level rows; two row titles are shortened to fit 100 columns ('...the old value pushed, then the saved one' and '...each followed by the old and saved value'); `tasks()` builds its row over a hub file that holds the key (`update_tasks: <the value as JSON>`), as the brief's reproduction's file does, so `row.own` is true; the bench's `edit` follows the family editor's edit back (`Editor.svelte:178-181`: no draft, `writer.save`), and its `save` waits for the send or for the Save's end, whichever comes first, so a Save with nothing held does not wait forever. On the base copy in round 1's run the first build's ten rows print the assertion lines the refuter's review quotes for its own run on the base (`agents/reviews/O196-refuter.md`, Verification): nine failing, 'the saved value pushed alone' passing.

Tests added, with their failing line on the unchanged tree: the table now 'a row whose Save lands' in `scopes.client.test.ts`, failing lines quoted under cases 1 to 6 and 8 of the first run, and round 1's four rows, quoted under "Repair round 1" (three fail on the held change; the Discard row is a test of preserved behaviour and passes there). Two rows pass on the unchanged tree and are not proofs of the fix: 'the saved value pushed alone' is preserved behaviour (an audit), and 'a row edited again while its Save is out...' passed there on its held change; its check of the slots the Save tells (`[[]]`) and the lab row's check (`[[{ file: 'sources.yml', key: 'update_tasks', hub: 'lab' }]]`) were added after the unchanged-tree run and are checked by reading: on the unchanged tree `wrote` is never called, so `told` is `[]` and both comparisons fail.

## Judgment calls the brief left open

1. The rows are matched by slot (`slotOf` and `inSlot` of `editors/slots.ts`: file, key and hub), the key the drafts themselves are kept under. This is the same match as `heldKey` with the slot, since `row.id` is `${file}:${key}` in all three row builders (`rows.ts:286`, `rows.ts:478`, `rows.ts:530`); the lab row proves only lab's draft ends.
2. The scopes tell slots (`ScopesDeps.wrote(slots)`), computing the hub from the file name inside `scopes.svelte.ts` (`slotHub`), so `Settings.svelte`'s wiring is one call. The dependency is required, not optional.
3. Beyond the two orders the brief lists, the writer handles the push of the saved value arriving before the answer: it keeps the row each draft was last edited or pushed with and pushes it again at `saved`. Without it that order leaves the draft drawn with "The file changed since this edit was started" (the first run's `[+0, true]`). The brief says the fix must not depend on the order and the trigger of the stray push is not known, so I took this to be inside item 1; the orchestrator may drop it.
4. A mark is forgotten only when the writer ends the draft. A draft the editor drops itself (an edit back to the file's value, `Editor.svelte:177-180`) leaves its mark until the tab closes; it can only stop a kept draft being held again, and a kept draft over a reload meets a new writer with no marks.
5. The function is named `textFormRefusal`, since `formRefusal` is taken by `src/lib/state/feeds/literature/form.ts:119`; the prop is `refusesForm`. Both are internal names.
6. `formWords` is computed only for `control === 'text'` (the plain and the suggesting text boxes); every card field with a form is `control: text` (the walk of `config/options/*.yml` the brief quotes; the four specs of the cases read again).
7. The words are drawn once, after the control's branch chain inside `.control` (flex, wrap), so at a narrow width they wrap under the box. `NumberInput` places its words in its own wrapper; this one sits beside the `TextBoxMenu` wrapper of the box.
8. Round 1: the `Stage` says a withdrawal by an edit through a member of its own (`withdraw`) beside `drop`, rather than an optional flag on `drop`, so each call names what the reader did. It costs the one line in `memoryStage`.
9. Round 1: what is held again is read from the row at the moment of the edit back, while the Save is out and the row holds the file's value from before it: `{ value: row.value }` when the file holds the key (`row.own`), the taking out of the key when it does not. For a family this value equals the change's `base` (both are the row's value before the Save); the record serves the top-level rows too, which carry no `base`. A family the file held no key for is held as a Reset, so the second Save takes the key out rather than writing the defaults into the file; the server's undo of a Save makes the same choice for a key the file did not hold (`src/lib/server/edit/writes/config/save/settings-save.ts:351-355`). The orchestrator may prefer the value.
10. Round 1: the same withdrawal covers a Reset of a row the file holds no key for and an emptied box of such a row, since both bring the row back to what the file holds; the round's brief names the edit back. A Reset of a row the file holds (`stage.reset`) and a Discard are unchanged.
11. Round 1: the record is kept only for a name the file's Save has out (`out`). Two Saves of one file out at once share that set: the first answer clears it, and the second Save, sent with the digest read before the first landed, is refused by the server as a changed file (`saveFile` takes its digest from `target(name)` when it is pressed), so nothing of it lands. This is by reading, not run.

## Visible changes, for the look

1. Settings, scope Primary hub, a hub whose `.oculus/config.yml` holds the two `update_tasks` rows of the brief (litwatch `stale_days: 31`, scout `stale_days: 7`). Change scout's `stale_days` to 8 and press Save. Before: the bar read '1 unsaved change', Save stayed on and the editor drew both 'The file changed since this edit was started, so it was not saved.' and 'Changed and not saved yet; ...'. After: the bar reads 'No unsaved change', the tab is not marked unsaved, Save is off and the editor draws neither sentence, without a reload. The same for clearing litwatch's `stale_days`, setting `last_run` to Not set, adding or removing an entry, Save All with a second file, the Hub scope of a second hub, and the unsaved workspace saved through the name question.
2. A refused Save (for example the file edited on disk after the page read it) keeps the change, the draft and the refusal under the bar, as before; a second Save that lands ends them.
3. Settings, Update tasks family, type 'Bad Name' in Entry 1's task box. Before: only the foot line 'Entry 1, task: It must be lowercase letters, digits and dashes, starting with a letter.'. After: the box has the red border of `aria-invalid`, its tooltip is the sentence, and the sentence is drawn in small red text beside the box (wrapping under it in a narrow pane); the foot line stays and nothing is staged. A screen reader hears the sentence as a status as it appears. The same for '../x' in a Project docs name box, 'not a bundle' in an Opening in programs value box (whether or not its suggestions have loaded), and a file that already holds `task: Bad Name` (marked with no edit). 'litwatch' and an empty box draw nothing.
4. Unchanged, to confirm at the look: a number box of a card ('1.5' in `stale_days`: the sentence once beside the box, plus the foot line), and a top-level text row (`latex.main_file` 'a/b': no mark while typed; after Enter or leaving the box, marked and the sentence once under the item).
5. Round 1, Settings, scope Primary hub, the same hub file (litwatch `stale_days: 31`, scout `stale_days: 7`). Change scout's `stale_days` to 8, press Save, and while the Save is out set it back to 7; the Save lands with the file holding 8. Before: the bar reads 'No unsaved change', Save is off, and the editor draws scout at 8 with no line, so the reader's 7 is lost. After: the bar reads '1 unsaved change', Save is on, the tab is marked unsaved, the editor draws scout at 7 with 'Changed and not saved yet; ...' and no 'The file changed since this edit was started' sentence, and a second Save writes `stale_days: 7`. The same for a top-level row of that file, such as Apps folder (`apps_dir`): set it to another folder, Save, and type the old folder back while the Save is out; after it lands the row shows the old folder, marked unsaved, and a second Save writes it. For a row the file held no key for, emptied while the Save is out, the row shows the default, marked unsaved, and the second Save takes the key out. Pressing Discard in the editor while the Save is out leaves nothing unsaved after it lands, before and after. The window is the time the Save is out, which on a local server is short; the look needs a Save slowed or held (for example a file on a slow disk, or the browser's network throttling) to type in it.

## G96, for the orchestrator's edit of `agents/guarded.md`

Test, to add: `tests/views/system/workbench/scopes.client.test.ts`, describe 'a row whose Save lands', every row:

- "scout's stale_days changed from 7 to 8, the old value pushed and then the saved one"
- "litwatch's stale_days cleared, the old value pushed and then the saved one"
- "litwatch's last_run set to Not set, the old value pushed and then the saved one"
- 'an entry added, the old value pushed and then the saved one'
- 'the family emptied, the old value pushed and then the saved one'
- 'the saved value pushed alone'
- 'the saved value pushed while the Save is out, before its answer'
- 'a row edited again while its Save is out, the old value pushed, then the saved one'
- 'a refused Save, then a Save that lands, each followed by the old and saved value'
- "a Save of lab's file, the primary holding a draft of the same key"
- "scout's stale_days changed from 7 to 8 and set back to 7 while its Save is out"
- "apps_dir changed and typed back to the file's value while its Save is out"
- 'apps_dir the file holds no key for, set and its box emptied while its Save is out'
- "scout's stale_days changed from 7 to 8 and discarded while its Save is out"

Code, new names: `saved` of `createEditorWriter` in `src/lib/state/system/config/editors/writer.ts`; `withdraw` of `Stage` in `src/lib/state/system/config/scopes/write.ts`, called by `createRowWriter` and `createEditorWriter` for a change an edit brings back to the file's value; in `saveFile` of `src/lib/views/system/workbench/settings/scopes/scopes.svelte.ts` the slots of the rows a landed Save wrote, told through `ScopesDeps.wrote` (`writtenSlots`, `slotHub`), and the change of a row edited back while the Save was out, held again (`heldBack`); the wiring `wrote: (slots) => editors.saved(slots)` in `createScopes`'s deps in `src/lib/views/system/workbench/Settings.svelte`. The G96 text's "a change is held as unsaved until the scope's Save" may gain "and a row edited back to its file's value while a Save is out holds that value again once the Save lands".

## Comments and documents

- `writer.ts:1-8` head comment (round 1, the withdrawal and a Reset of a row the file holds no key for) and `writer.ts:10-20` (the first build): rewritten. The doc of `saved` (`writer.ts:58-60`): rewrapped. The doc comments of `pushed`, `save` ("Hold the draft of a row as its change, or drop the change for a draft equal to the row.") and of `EditorHooks`: still true.
- `write.ts:8-17` head comment: rewritten (round 1); the doc of `drop` rewritten and the doc of `withdraw` new (`write.ts:74-81`); the doc of `createRowWriter` and of `RowWriter.submit`: still true.
- `scopes.svelte.ts:6-19` head comment: rewritten (first build and round 1); `ScopesDeps.wrote` (`:59-62`), `writtenSlots`, `slotHub` (`:301-307`) and `restage` doc comments rewritten in round 1; `Back`, `out`, `backs`, `unback`, `heldBack` and `nameOf` docs new; the doc comment of `saveFile` ("Save the changes of one file; whether they were written or there were none."): still true.
- `Editor.svelte:8-20` head comment: rewritten (round 1), since "An edit that leaves the draft equal to the file's puts the file's own back, which holds nothing" no longer held while a Save of the earlier change is out.
- `Settings.svelte:232-235`: rewritten; the head comment (lines 15-66): still true.
- `editors/writer.svelte.ts` head comment: still true.
- `fields.ts` head comment ("The page refuses the number, form and path problems here, before the write..."): still true.
- `FieldControl.svelte:14-23`: rewritten. `Cards.svelte`, `Control.svelte`, `NumberInput.svelte`, `TextInput.svelte`, `SuggestInput.svelte` head comments: still true (none of their files changed but `Cards.svelte`, whose head comment says nothing of a box's refusal).
- `RailEditor.svelte`, `AppControl.svelte`, `WorkspaceRows.svelte`: unchanged, and their head comments say nothing of a Save that is out; their own loss of an edit back while a Save is out is named in the first section.
- `tests/state/system/settings/editor-saved.test.ts:12-16`: rewritten to point at the scopes rows; lines 4-6 still name what its rows cover, since its rows are unchanged.
- `docs/HELP.md:501` ('A change is held as unsaved until Save, and a save is one write of the file, its comments and its other keys kept.'): still true. `grep -rn -i -E "draft ends|ends the draft|ends a draft|beside the box|unsaved until" docs README.md` finds only that line.

Greps: `grep -rnE "formRefusal|refusesForm|writtenSlots|slotHub|wrote: |editors\.saved|writer\.saved|deps\.wrote" src tests docs README.md` finds the new names only in the changed files and the two tests' deps, and `formRefusal` only in the literature form's own files (hence the rename); after the rename `grep -rn "formRefusal" src/lib/state/system/config src/lib/views/system/workbench` prints nothing. The history-word grep over the added lines (`git diff -U0 -- src tests | grep -E "^\+" | grep -i -E "\b(before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|now)\b|O[0-9]{2,3}\b|20[0-9]{2}-[0-9]{2}"`) gave, in the first build, three lines, each "before" in the order of events at run time, never a comparison with earlier code: `Settings.svelte` "ends at the push of the value written, before the answer or after", the bench's "`meanwhile` runs while the Save is out, before its answer", and the row title 'the saved value pushed while the Save is out, before its answer'.

After round 1, the same pattern over the added lines of `diff` of each changed file against the base copy (`diff <base> <file> | grep "^>" | grep -iE "<the words>"`) gives ten lines. Each "before" names the value a file held before a Save, or the order of events at run time: `Settings.svelte` (as above); `Editor.svelte` "the value the file held before it is held as the change again"; `scopes.svelte.ts` "a row edited back to its file's value meanwhile had before", "held before that" (the doc of `Back`), "the row holds what the file held before" (the comment in `withdraw`) and "the value the row held before it" (the doc of `heldBack`); the test's head comment "the value it had before"; and the bench's and the row title's lines quoted above. The tenth, `Editor.svelte` "A draft started over a value the file no longer holds", is a sentence of the base's head comment, reflowed: the file moved under the draft at run time.

New names, `grep -rnw "heldBack\|unback\|nameOf\|withdraw\|appsDir\|backs" src tests docs README.md` outside the changed files: `nameOf` and `heldBack` are local functions of other modules (for example `src/lib/shell/status/LanguageItems.svelte:138`, `src/lib/server/machine/lsp/adapters/yaml/hub-keys.ts:204`), `withdraw` a member of other stores (`src/lib/state/workbench/palette-source.svelte.ts:80`, the apps' requests), `appsDir` the server's name of the apps folder; none is imported by the changed files and the new ones are local to `createScopes` or a member of `Stage`, so nothing collides. `grep -rn "withdraw\|stage.drop\|edited back" docs README.md` finds only the status word 'withdrawn' of `docs/templates.md`, so no document describes the stage.

Ids and paths: `wrote`, `saved` and `refusesForm` are internal names, not keys of a saved record or a config file. `saved([])` marks nothing and pushes nothing; a slot told twice is marked once. In flight: a change typed while the Save is out is not told (the told `[[]]` of the edited-again row). After close: `saved` returns, and `close` empties the marks (case 12). Superseded: a later edit is held and kept by both pushes (case 11); a second Save that lands marks the same slot once.

Round 1: `out` and `backs` are keyed by the file name `fileOf` gives and the change name `keyName` gives, the keys `inner` already uses, so a key of two scopes is two records. Empty: a withdrawal of a row whose name no Save has out records nothing and drops the change as before the round; a landed Save with no record restages nothing more. Duplicated: a second edit back of the same row while out replaces the record with the same value. In flight: an edit again after an edit back forgets the record (`stage.set` calls `unback`), so the newer change is the one restaged, as the edited-again row shows. After the answer: the record is taken when the answer comes, landed or refused, so a later edit back with no Save out records nothing. After close: the scopes have no close; a closed editor writer calls nothing, so no withdrawal reaches them from it.

Sentences and list items of the comments were read against `spec.md`'s prose rules (plain, ASCII, no em dash, no 'not X but Y'); the spec sets no sentence length, and none was written to a list form.

## Limitations and sharp edges

- What brings the push of the old value after the drop in the real view is still not identified; the fix works for both orders and for the push ahead of the answer in the unit runs, and only the look shows the view's own order.
- With no draft, a file value of the wrong form gives no foot line (case 19, before and after); the box now marks it. This is the editor's existing rule for a value the draft is read from, outside this step.
- The `role="status"` words are read out again at each keystroke that changes them, as `NumberInput`'s are.
- `FieldControl.svelte` is at 517 lines of the 520 a component may hold.
- The rail editor, an app's setting and the workspace file's primary and folder names lose an edit back made while a Save is out, by reading and not run (first section); the round's item 5 keeps their code as it is.
- The round's behaviour needs a Save out long enough to type in, which the look on a local server reaches only with the Save slowed (visible change 5).
- A family whose file holds no key, edited back while its Save is out, holds a Reset after the Save lands (judgment call 9); the editor then draws the default family marked unsaved.

## Lines over 100 columns

`for f in <the 11 changed files>; do awk -v F="$f" 'length > 100 {print F":"FNR": "length}' "$f"; done` prints seven lines, each over 100 on the base (the same `awk` over the base copy's two test files prints the same seven lines at their base numbers, and no changed source file has one):

- `tests/state/system/settings/editor-saved.test.ts:104`, `:133`, `:147`, `:180` (base `:102`, `:131`, `:145`, `:178`): `it(` lines whose titles are single strings;
- `tests/views/system/workbench/scopes.client.test.ts:49` (base `:13`): the import of `createScopes`, one path;
- `tests/views/system/workbench/scopes.client.test.ts:90` and `:104` (base `:52`, `:66`): the two `it(` lines of the existing secret rows, titles as single strings.

## Anything in the brief wrong or impossible

- The writer-alone row of item 3 cannot run on the unchanged tree in the form `Settings.svelte` wires it: `writer alone => "TypeError: writer.saved is not a function"`, so it is dropped, as the brief directs.
- Round 1's write list leaves out `tests/views/system/workbench/workbench-fixture.ts`, which the `Stage` change needs (first section); it is on the step's write list.
- Round 1's brief says the family's value to hold is the change's `base`; the code holds the row's value read at the edit back, which is that value for a family the file holds the key of, and a Reset for one it does not (judgment call 9).
- Nothing else.
