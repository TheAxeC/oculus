# O119, repair round 1

The review is `agents/reviews/O119-refuter.md`. Each ruling below says what to change. The brief stands except where a ruling changes it. The same rules hold: no git that changes state, no page, scoped tests while you work, the verify list once after the last change. Everything here is done in this round; a limit stated in place of a fix is a shortcut.

1. **A press on a cut run (Behaviour, Limit 1).** `turn-rows.ts` and `TranscriptBody.svelte`. `turn-rows.ts` gets a `callKey(call)` that `runKey` uses for the first call. When a read of older turns grows the run at the top, the choice moves to the grown run's key from whichever of that run's later calls holds one, not only from the key the run had. The value of `runKey` stays as the brief names it. The head comment of `turn-rows.ts` says this.

2. **The long press (Behaviour, Limit 3).** `src/lib/ui/menu/ContextMenu.svelte`, added to the write list. bits-ui opens a context menu on a long press of a non-mouse pointer without the `contextmenu` event, so a `read` menu opens empty or with the last right-click's items, and Copy then gives older text. A menu with `read` does not open on that path: stop it with a pointer handler through bits-ui's `composeHandlers`, as the review names at `node_modules/bits-ui/dist/bits/menu/menu.svelte.js:1534-1539`. A menu with `items` or `groups` keeps its long press. The head comment says so. Read the file's callers; a right-click and the menu key stay as they are.

3. **A false sentence (Standards).** `turn-rows.ts:14-15`: the key names the same call in every read, not the same run.

4. **The report (Spec, Proof, Limit 2).** Rewrite `.scratch/migration/agents/reviews/O119-report.md` with this round in it. Correct the `getSelection` inventory to what the grep prints. The case on a page switch reads: a tab in a float keeps its presses through a page switch, since a float stays mounted. Decision 2's list holds maximising a pane as well: it unmounts `Terminal.svelte`, so presses read as never pressed. Remove limits 1 and 3 as limits, and give their closure at `file:line`. State the number of full-list runs of this round.

No test is added: the rulings change the view, which has no guarded entry, and each is read at `file:line` in the report and goes to the look.
