# O88 round 0: the cases ruled

Rules: `agents/spec.md`, `agents/guarded.md` and the step's brief `agents/briefs/O88.md`, which stay in force except where this file says otherwise. The builder's hand-back of its first run raised three places where the brief disagrees with the code's own rules. Each fix stays inside the step's part, so the orchestrator rules them.

## Ruling R1: the heading components move into `ui/`

The shell may import no view (`spec.md:55`, `tests/checks/tree/boundaries.test.ts`), and item 6 asks the Update tray for the shared heading.

- `GroupHead.svelte`, `FoldControl.svelte` and `FoldHead.svelte` move from `src/lib/views/shared/card/heads/` into a folder of `src/lib/ui/` that holds fewer than 10 items, with `SubHead.svelte` beside them, and every importer follows. `UpdateTray.svelte` and `ScheduleList.svelte` then draw `GroupHead` from there.
- The boundaries check is not changed.
- The option that takes the tray out of item 6 was the lazy one; the option that adds the heads folder to the shell's row loosens a check and is not taken.

## Ruling R2: a hub file that still holds `intro:` gets the schema's finding

With `intro` gone from the file schema, a hub file that holds it gets `findings.schema.not_declared intro`, as any key the schema does not list. Case 18 reads so: the key is not drawn, and the schema check names it. The hub commit at landing removes the hub's `intro:` lines, so the user's hub raises none. Keeping `intro` as an accepted key that nothing reads is code that carries an older form of stored data, which `spec.md:43` forbids, and is not taken.

## Ruling R3: `pillar_kinds` is shaped as `venue_categories`

`pillar_kinds` is read and merged exactly as `venue_categories` is: an empty key is the finding that key gives and the row is not read, and the list is replaced whole. G126 rules that two rows naming one key in a list replaced whole are a finding naming the file and the dotted key, with oculus's list standing; that rule is built for every list replaced whole by O87's repair round 1, in the merge both steps share (`src/lib/data/sources/config/merge/in-place.ts`). This step adds `pillar_kinds` to the lists replaced whole and does not build a second duplicate check of its own; at landing the orchestrator adds `pillar_kinds` to G126's list and to the row O87 lands. Case 21 reads so: an empty key is refused as `venue_categories` refuses it, and the duplicate is the G126 finding once both steps are on main.

## Paths

The brief's paths, and these, each needed by item 6 or item 7 as the hand-back shows:
- the folder of `src/lib/ui/` the heading components move to, and every file that imports them
- `src/lib/views/shared/links/FolderFiles.svelte`
- `src/lib/views/system/machine/processes/Processes.svelte` and `src/lib/views/system/machine/hpc/Hpc.svelte` (their pane state keeps `folded`)
- `src/lib/ui/display/table/Table.svelte` (a sticky table header sits under the group strip)
- `src/lib/shell/keys/workbench-keys.svelte.ts` (the card cursor skips a folded group's cards)
- a new `pane-fold.svelte.ts` beside the heading components, for the partials that hold no instance id
