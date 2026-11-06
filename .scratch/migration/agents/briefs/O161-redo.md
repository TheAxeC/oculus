# O161, the script-made edits redone

Your report names twelve files edited by inline `python3` programs without approval (`agents/spec.md`, "What every package obeys", the paragraph on case-run programs and edits). Work made in breach of a rule is discarded and made again by the rule, so those edits are not kept as they stand.

0. First copy the twelve files as they stand now to `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/O161-before-redo/`, at their paths, for the diff of item 4.
1. For each of the twelve files, put the base's copy back in place with `cp` from `/Users/axelfaes/workspace/oculus/.agents/worktrees/O161-base/`:
   - `src/lib/state/boards/structure/cross-links.ts`
   - `src/lib/state/feeds/radar.ts`
   - `src/lib/state/sessions/source/source.svelte.ts`
   - `src/lib/state/sessions/view-source.ts`
   - `src/lib/ui/html.ts`
   - `src/lib/ui/menu/ContextMenu.svelte`
   - `src/lib/ui/menu/Menu.svelte`
   - `src/lib/ui/menu/MenuOpener.svelte`, copied to its new place `src/lib/ui/menu/trigger/MenuOpener.svelte`, the old path left absent
   - `src/lib/ui/menu/Tooltip.svelte`
   - `src/lib/views/shared/forms/bar/PickMenu.svelte`
   - `src/lib/views/shared/card/feed/RadarCard.svelte`
   - `src/lib/views/shared/card/record/CardActions.svelte`
2. Make every change of the step to those twelve files again with the Edit and Write tools only, to the final design of your last report: the cases ruling, `O161-clash.md`, and every later edit you made to them. Neither reading nor copying the current files back is a way around the redo; read them first if you need, then edit the base copies.
3. The `npx prettier --write` formatting counts as a tool's own write and may be run again.
4. Then `npm run test:quick` once, the boundaries case seen passing, the harness and the scoped runs of your report run again where they cover the twelve files, and the report rewritten to its final state: the rule breach line says the twelve files were restored to the base and edited again with Edit and Write, and `diff` of each against its state before the redo is quoted (an empty diff, or each difference with why).
