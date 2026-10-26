# O85, repair round 1

The review is `.scratch/migration/agents/reviews/O85-refuter.md`. Build each item below under the brief, `O85-cases.md` and `agents/spec.md`; every rule of your first prompt still holds. Read the whole review first. The items not listed here are ruled at the end and need no change from you.

## 1. A row with a second hub chosen shows nothing of the primary while that hub is not read (Behaviour 1, item 5)

`hubRow` (`src/lib/state/system/config/view/hub-settings.svelte.ts:170-174`) returns the primary's row with `hub` set while B's slice is being read and after its read failed. So the row shows the primary's value, Modified bar, `own` and line, its line link and Edit in file are named `B/.oculus/config.yml` (`placeName`) but open the primary's file (`placeOf` keeps the primary's root), `EditLink.edit` opens before its `blocked` guard, and a held draft for B is compared with the primary's value and drawn as stale (`Editor.svelte:85-90`).

While B's slice is being read or has failed, a row with B chosen:

- draws no value, no Modified bar and no line of the primary: it draws B's sentence (`settings_hub_loading`, or the failed one with the error) in their place;
- has no line link and no Edit in file that opens the primary's file: the link and Edit are not drawn, or open B's own `.oculus/config.yml` with no line; every place that builds the row's file (`placeOf`, `placeName`, `EditLink`) gives the same file;
- `EditLink.edit` checks `blocked` before it opens anything;
- a draft or typed text held for B is kept, not drawn as stale and not offered for discard, and is drawn again as it was once B's slice is read.

Tests: the rows of `chosen-hub.test.ts` "lab chosen while lab's file ... is being read" and the failed read assert the row holds no value, no `own` and no line of the primary, and that its file is B's or none; `editor-saved.test.ts` asserts a B draft is not stale while B is being read. Run each on the tree before your change and quote its failure.

## 2. The route's answer carries no field no reader reads (Proof 2)

`from` in the hub-settings answer (`hubSliceShape`, `view/hub-settings.svelte.ts:38-42`, and the server's slice) is read by nothing. Take it out of the answer, the shape and the route test, or name the reader that needs it in your round section if one does.

## 3. No branch for an input no sender makes (Standards 1)

The `not_hub_key` branch (`config-write.ts:435`), its catalog key `server.workspace.not_hub_key` (`config/text/server.yml:523`) and its test row in `config-key.test.ts` go: a body with `root` on a key of the open workspace file is refused with `primary_only` and writes nothing, which a run you quote shows.

## 4. The tooltip in its group's style (Standards 3)

`settings_hub_choice_tip` (`config/text/views/system/workbench.yml:221`) ends without a full stop, as the group's other one-sentence tips do.

## 5. The report says what is true (Proof 1, Standards 2 and 4, Behaviour 2)

In the round section of your report:

- "a key read from the primary alone, with no primary and no hub named, refused" and "writes the primary alike for a body naming it and a body naming no hub" are proofs, not audits; give each one's passing run after the change and its run on the unchanged tree by title;
- name every test tagged slow with its run alone;
- `config-place.ts` names `data/shapes/hub-keys.ts` in its head comment and imports nothing from it; say so where the report said "imported by";
- list the Reset change of `keptAsMap` (`config-reset.ts:58-66,141`) under the host- and user-visible changes with its true before and after: on the base, a Reset of the last key of a settings file that also holds a comment is refused with "is not a map of keys" and the file is left as it was; after it, the key comes out and the file holds its comments and `{}`, for the primary's file as for B's, and the next write replaces the `{}`.

## Ruled, no change

- Spec 1: `keptAsMap` stays (Z1042); it is booked at landing as a visible change.
- Spec 2: the shell append to `undo.test.ts` is noted; its end state is byte-equal to the base. In this round every change to a worktree file is made with the Edit or Write tools.
- Spec 3: the brief's `CLOSED_WRITES` place is recorded; no change.
- The Doc text, G9's and G96's Test lines and the reconciling of `docs/data-map.md` with the uncommitted section of the main checkout are the landing's.

## This round

Run the cases of each item you change on the worktree, then `npm run test:quick -- --base 8d52965c` once after your last change. Append a section "Repair round 1" to `.scratch/migration/agents/reviews/O85-report.md` in the worktree: per item, the change with its file and lines, the test or run that shows it, and the verify lines. Your final message is that section's first line and the path.
