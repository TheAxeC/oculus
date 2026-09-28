# Q89 repair round 2 (sent 2026-09-28)

The round starts at the worktree commit `8803f5b9` (the step's work after round 1, committed by the orchestrator). The round is earned by an acceptance item of the brief left unbuilt: Split opening "with the row's folder" (brief item 2), which Axel ruled on as open item Z39 (a) and which is too large for a fix at landing. The review over round 1 (`agents/reviews/Q89-refuter.md`, "Repair round 1, refuted") found the other items below. Every item is a known change. You work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q89/tools/oculus` and nowhere else, run no git command of any kind in any checkout, and write under `.scratch/` only your report. The rules file and the brief still hold.

## Rulings on what stays

- `src/lib/state/client/context.ts` joins the step's paths: the rule reaches the layout where the client is wired, beside `registerOpened`.
- The load order holds on a real page load (`+page.svelte:67` registers the views before `loadLayout` at `:210`); no change.

## Change

1. Z39 (a), Split in the row's own folder. Split (`TerminalList.svelte:94-108`) writes the terminal's own folder into the new tab's composer record, and the composer offers that folder as a place of its own, listed first by its path, and starts there, whether or not one of the composer's places holds it. The composer record (`state/sessions/composer.ts`, `composerOf` at `:60`) gains an optional field for the folder the tab was split from, read by `composerOf` as a string and dropped when empty; `Composer.svelte:73-78` adds it to the places it offers when no place equals it and takes it as the starting workspace. A composer not opened by Split offers exactly what it offers today. `placeOf` goes with its tests, having no reader left. The Split tooltip and `HELP.md:123` ("in its folder") stay as they are, since they are now true. Cases: Split of a terminal in `/hub/projects/foo/code`, with places `/hub` and `/hub/tools`, gives a composer whose places are `/hub/projects/foo/code` then `/hub`, `/hub/tools`, and whose workspace is `/hub/projects/foo/code`; Split of a terminal in `/hub/tools` gives the places as today with `/hub/tools` chosen; a composer record with no split folder offers today's places.
2. Delete and Backspace made safe (Behaviour 1). `rowKey(key, shift, repeat)`: an auto-repeated Delete or Backspace is `null`, so holding the key never kills. In `TerminalList.svelte`, `arming` is cleared when the stop moves and when focus leaves the list (`onfocusout` on the list, when `relatedTarget` is outside it). A pointer press on a row that shows it moves focus to the grid, so typing after a press goes to the terminal. Cases: `rowKey('Backspace', false, true)` and `rowKey('Delete', false, true)` are `null`; `rowKey('Backspace', false, false)` is `'kill'`; the arm-clearing rule as a pure function (the arm kept only while the armed row is the stop and focus is in the list) with its cases.
3. `TerminalList.svelte:323-324`: the comment on the controls' drawing says the true reason: they are drawn while the pointer or the keyboard's stop is on the row, so the armed Kill shows while a Delete or Backspace waits for its second press.
4. `terminal-list.ts:80`: drop "as VS Code's tabs list kills with Delete"; the comment says the keys are the keyboard's way to Split and Kill, which the list keeps out of the focus order.

## Report corrections

5. The line-count row of `terminal-list.ts` gives what `wc -l` prints.
6. For each new case, quote its failure with the change it guards undone, then put the file back.
7. The before and after of Split for a terminal outside every place, and of a held Backspace on a row.

## Tests

Run only the test files you change while working, then `npm run check`, `npm run format:check` and `npm run lint`. Do not run the full verify list: the orchestrator runs it on main at landing.

Rewrite the report at `.agents/worktrees/Q89/tools/oculus/.scratch/migration/agents/reviews/Q89-report.md` with these items, in the brief's shape, its first section the open items as the main checkout's `tools/oculus/.scratch/migration/orchestrator-state.md` lists them when you finish.
