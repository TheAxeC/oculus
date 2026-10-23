# O56, repair round 1

The rules file and `agents/briefs/O56.md` still hold. This round closes the findings of `agents/reviews/O56-refuter.md`, one ruling each below. A shortcut is a finding: a narrower reading of a ruling, or work inside it reported as outside it, is done or handed back with the reason before the report.

The rules file's "Where you work" holds in full: you run no git command, read-only ones included; the base copy `.agents/worktrees/migration-O56-base/` is where the unchanged tree is read and run. No script or program is written to check a case; a case is checked by a test row the step has or by reading, and the report says which.

## Rulings

1. **Spec 1, the focus after a pick that saves (item 3, C12).** After Enter on a hub of the Save menu saves the paper, the focus is on the card's Save control: In Literature is drawn as a ToolButton in its `waiting` look (`ToolButton.svelte`, `aria-disabled`, still in the focus order), not `disabled`, and it takes the focus once the save lands when the focus was on the menu's opener. The same for the one-hub button. For the apply menu on a Position Lead card: after a pick, the focus goes where the base's apply button leaves it after a press (read on the base copy and stated in the report); where the base leaves it on the card and the lead now reads applied, the control drawn in the menu's place takes it the same way.

2. **Proof 1, a true sentence for a chosen hub that holds no collection.** Two new text keys. In `config/text/app.yml` beside `task_add_collection`: `task_hub_collection: 'The hub {0} holds no tasks collection, so no task can be added to it.'`, `{0}` the hub's name. In `config/text/views/feeds/leads.yml` beside `no_applications`: `hub_no_applications: 'The hub {0} holds no Applications collection, so no application can be opened in it.'`, `{0}` the hub's name. `addTask` (`new-entry.ts`) says the first when a hub is chosen and that hub holds none, and keeps `task_add_collection` for no hub of the workspace holding one; `applyFromLead` (`lead-apply.ts`) says the second when the picked hub holds none, and keeps `no_applications` for no hub holding one. The row at `tests/state/forms/new-entry.test.ts:138-141` asserts the new sentence for its input; its run on the base copy is quoted. The apply case is checked by reading unless a test file guards `lead-apply.ts`, in which case a row is added there.

3. **Standards 2, the apply pick in flight.** `LeadCard.svelte` gets a guard as `SaveToLiterature.svelte` has `saving`: while one apply placement is out, a second pick does nothing. The report states, for each new key or async path the step adds, what the code does: the palette row value `task-hub:<hub>` against every other row value of the palette (grep the prefixes and say whether any can collide); a second apply pick in flight (after this ruling); `addTaskTitled` answering after the palette closed.

4. **Behaviour 1, the report.** "Cases before and after" gains a row for a Position Lead's apply control in a workspace whose hubs hold no Applications file: before, the control opened the path the merged `collections:` names for `applications` under the primary (`config/defaults/sources.yml:41`), and drew nothing with no primary; after, the card says `leads.action.no_applications`.

5. **At landing, no work here:** G8's Code and Test lines in `agents/guarded.md`. After this round's last change the verify list runs once, and the report says how many times it ran (Standards 1 of the review: a start stopped for a comment edit is a run).

## Paths this round writes

Every path of `agents/briefs/O56.md`'s "Paths this step writes", the two the first report named outside it (`src/lib/server/edit/writes.ts`, `src/lib/server/content/feed-route.ts`), and:

- `src/lib/ui/controls/ToolButton.svelte` only if the `waiting` look needs a change to take the focus, named in the report with why
- the test file that guards `src/lib/views/shared/card/feed/lead-apply.ts`, if one exists
- `.scratch/migration/agents/reviews/O56-report.md` (a section "# Repair round 1" appended)

## Report

Append "# Repair round 1" to `.scratch/migration/agents/reviews/O56-report.md`: each ruling with DONE or NOT DONE, its diff and the check that shows it; each new or changed test row with its run on the base copy and after; the verify lines.
