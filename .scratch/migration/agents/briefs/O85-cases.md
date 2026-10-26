# O85, cases ruling (round 0)

Your first run is read: `.scratch/migration/agents/reviews/O85-report.md`. Two rulings follow. Build the step under the brief, this file and `agents/spec.md`; every rule of your first prompt still holds.

## 1. Case 16 and item 5's sentence on a file being read or not parsed (Z1036, option (a))

The rule "as the primary's row does" names no behaviour on the tree: the primary's row draws no sentence of its file's read and sends its write whatever that read's status. The ruling:

- A row with a hub other than the primary chosen, whose hub's settings file is being read, could not be read, is cut or does not parse, draws that file's sentence under its control: the messages `loading`, `unreadable`, `cut` and `unparsed` that `rows.ts` `parsed()` gives the group's line, naming B's file.
- While that holds, its control, its editor, its Reset and its Edit in file send nothing.
- The primary's rows stay as they are: no sentence on the row, and the server's `not_parsed` refusal as now.
- Case 16 reads: "B chosen on a row while B's file is being read, could not be read, is cut or does not parse: the row draws that file's sentence and sends nothing; a body naming B whose file does not parse is refused with `not_parsed`."

Option (c), saying nothing and leaving the refusal to the server, was the lazy option.

## 2. Drafts and typed text keyed by hub (Z1035, option (a))

Item 4 already asks that a list or family draft made with one hub chosen is neither ended by a push of the other hub's value nor applied to it. The drafts are kept by file and key alone (`slots.ts:90-96`, `Editor.svelte`), and so is the typed text (`typed.ts`, `Control.svelte`). The ruling:

- A draft and a typed text made with a hub other than the primary chosen are kept under file, key and that hub's name; one made for the primary, or in a workspace of one hub, is kept under file and key alone, as now. That is the shape of a kept draft, so a draft held today needs no change and no code reads an older form.
- A row draws, sends and ends only the draft and typed text of the hub it has chosen; switching the hub keeps both and shows the other hub's.
- The write list gains `src/lib/state/system/config/editors/slots.ts`, `src/lib/state/system/config/typed.ts`, `src/lib/views/system/workbench/editors/Editor.svelte` and `src/lib/views/system/workbench/settings/Control.svelte`, and the tests of G28 (`tests/state/client/held-unsaved.test.ts`) and G96 (`tests/state/system/settings/editor-saved.test.ts`) take any case of it the test rule calls for.
- Case 20 adds: "a draft made with B chosen is drawn again when B is chosen again after a switch to A, and A's row shows A's own draft or none."

Option (b), holding the hub choice still while a draft is held, was the lazy option; option (c), dropping the draft on a switch, loses the reader's work, which G28 forbids.

## Your first run

Its program and outputs stand. The edit of your own case-run program's inputs with `sed -i ''` in the scratchpad is noted; it touched no file of the worktree.
