# O196 landing

Position: the migration plan, step O196, the Settings form tells the truth about a row setting, landed (498 of the plan's 542 step lines ticked). Next: the app rebuilt from main and copied over `~/Applications/oculus.app`. No step is in flight.

## Open items

None. Open item 792 was raised at this landing and ruled by Axel the same day: (a), built at this landing with no new step.

## Agents stopped

The step's builder af2d187765fd06503 and both reviewers had ended before the landing; the runner's agent listing showed no subagent of this session.

## NOT DONE

- The app is not rebuilt yet; it is the next action.
- The research hub's O195 lines in `~/workspace/research-hub/.oculus/config.yml` and `.oculus/workspaces/research-hub.yml` are still uncommitted there: a hub commit needs Axel's word.

## What landed

The whole range from c4dae5477 (wip commit ef9386128: the build and repair round 1) with the fixes at landing, 17 paths, 1031 insertions and 81 deletions:

- A Save that lands tells the writer the slots of the rows it wrote (`saved`, wired from `saveFile` through `Settings.svelte`). The draft of such a row ends at the push that brings the value written, so after a Save the bar reads 'No unsaved change', Save is off and no stale sentence shows, with no reload.
- An edit back to the value in force while a Save is out withdraws the change (`Stage.withdraw`), and the row's value is held again once that Save lands. A Discard drops it.
- A card's text box with a form (`refusesForm`, `Cards.svelte`) is marked, titled and draws the form's sentence (`textFormRefusal`, `fields.ts`) on its own line under the box, in a `role="status"` element.

Fixes at landing, from the review over round 1:

- Behaviour 1: `heldBack` holds nothing for an edit back equal to what the Save wrote.
- Behaviour 2: each Save of a file keeps its own record (`Out`), and `takeBacks` keeps an edit back for a Save still out.
- Behaviour 3: `RailEditor.svelte` withdraws, or drops at a Discard; `AppControl.svelte` calls the new `withdrawApp`; `WorkspaceRows.svelte` calls the new `withdrawWorkspace`.
- Proof 1: a row for the family with no key.
- The five new rows of `tests/views/system/workbench/scopes.client.test.ts`: their first run on the step's tree failed four (value pushed, two Saves, app, workspace) and passed the family with no key.

Fixes at landing, from the look:

- A refused card text box keeps its width and its place beside its name: the sentence's layout is FieldControl's own `.refused`, the control carries `form-refused`, and `Cards.svelte` keeps the names of that card level with their boxes.
- A reset of an app setting was refused as 'takes a whole number': `writeAppSetting` (`src/lib/server/edit/writes/apps/app-setting.ts`) judged a removal's missing value against the type. It now judges only the key. New row in `tests/routes/edit/apps/app-setting.test.ts`; its first run on the unchanged writer failed with 'This setting takes a finite number'.
- Open item 792 (a): a draft that does not read back withdraws the change its row held (`writer.ts` `save`), so '../x' typed into a path box no longer leaves '.' staged for a Save. New row in `tests/state/system/settings/editor-saved.test.ts`; its first run failed with `next: 1` still held after '1x'. `docs/HELP.md` Settings says a field whose text breaks its form holds no change.

Ledger: `agents/guarded.md` G96 covers Saves that land, edits back, Discard and two Saves, its Code and Test lines naming the new functions and the describe 'a row whose Save lands'. The app-setting row falls under G77's 'every row'.

## Verification

In the gate at main's head c0051bf78 with the range and the fixes, `npm run diagrams && npm run docs:palette && npm run test:quick`:

- The diagrams are unchanged by the rerun. Prettier, the ASCII gate, svelte-kit sync, svelte-check (595 files, 0 errors, 0 warnings), eslint, vitest, vitest slow and vitest checks are ok: `test:quick: 80.9 s; every command passed`.
- Main's staged diff equals the gate's (`cmp` of the two diffs: identical).
- Not covered: tests that reach no changed file within the import depth. The verify list was not changed. A/B: none, `bench: []`.

## The look

On scratch servers on port 8797, the gate built with `npm run build`, over a copy of the demo hub with two update tasks and a second folder:

- **Saves that land.** scout's `stale_days` 7 to 8, litwatch's `stale_days` cleared and its `last_run` set to Not set: each Save leaves 'No unsaved change', Save off, no stale sentence.
- **Edits back while a Save is out** (the page's requests held): scout's `stale_days` 8 to 9 and back to 8, the workspace's primary and a folder name, a scratch app's setting `look.columns` back to its default, and a rail label. Each file held the saved value and the view the value brought back as '1 unsaved change'; each second Save wrote it (the app's key and the rail taken out of their files).
- **Discard while a Save is out.** After the Save landed, the file and the view held 10, with nothing unsaved.
- **A refused Save.** It keeps its count, with 'Not written: ...' under the bar.
- **Cases 14 to 21.** 'Bad Name', a file holding 'Bad Name', 'litwatch', an empty box, '../x' in a `project_docs` name, 'not a bundle' in `open.program_ext`, and `latex.main_file` 'a/b': each refused box is marked with its sentence once and nothing is staged; the valid and empty boxes carry no mark; the top-level row is unchanged; '../x' leaves 'No unsaved change' with Save off.

The scratch servers are stopped and their folders removed.

## Agents

- Builder af2d187765fd06503 (claude-opus-5-5): 357427 tokens, 157 tool uses, 1654 s; round 1: 311397 tokens, 144 tool uses, 1182 s.
- Brief check a2b2618a414f8f4c0 (claude-opus-5-5): 217330 tokens, 50 tool uses, 441 s.
- Reviewer abbfb7cf823a685ea (claude-opus-5-5): 256793 tokens, 63 tool uses, 865 s.
- Reviewer over round 1 a5c31131fd67e946b (claude-opus-5-5): 224151 tokens, 54 tool uses, 700 s.

The builder's first report did not pass its bar: the review found findings under Proof, Standards and Behaviour, which went out in repair round 1. The review over round 1 found Behaviour 1 to 3 and Proof 1 and 2; Behaviour 1 to 3 and Proof 1 were fixed at landing, and Proof 2 is closed with no change.
