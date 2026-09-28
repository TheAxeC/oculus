# Q89 repair round 1 (sent 2026-09-28)

The round starts at the worktree commit `65baf8da` (the step's work as you left it, committed by the orchestrator). The findings are those of `agents/reviews/Q89-refuter.md`. Every item below is a known change: nothing here asks you to find a cause, reproduce a fault or measure. You work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q89/tools/oculus` and nowhere else, run no git command of any kind in any checkout (not even `git rev-parse`), and write under `.scratch/` only your report. The rules file and the brief still hold.

## Rulings on what stays

- `Page.views` in the saved layout stays, the page's layout state that brief decision 4 names; `model.ts`, `saved/saved.ts` and `layout.svelte.ts` stay in the step.
- `TerminalTitle.svelte`, the `tests/ui/wall.test.ts` entry and the `tests/state/workbench/layout/pages.test.ts` cases stay.
- The seven audit cases stay as named audits; the landing's look checks the paste question, the file drop and the drag on screen.
- A drop while the socket is closed stays as typing does today.

## Not in this round

- Where Split starts for a terminal whose folder no composer place holds is open item Z39 for Axel. Leave `placeOf`, the composer and the Split half of `HELP.md:123` as they are; the landing makes that change once he rules.

## Change

1. The list is one keyboard stop (brief item 2). In `TerminalList.svelte:216` and `:230` give Split and Kill `tabindex={-1}`. In `keys()`, Delete or Backspace on the row does what pressing Kill does (the first arms it, the second kills), and Shift+Enter does what Split does; the other keys stay. Say the two keys in `terminal_kill_tip` and `terminal_split_tip` of `config/text/views/sessions/terminal.yml`, and in `HELP.md:123`. Correct the head comment at `TerminalList.svelte:13-14`, which records the three stops. Cases: the Tab order holds one element per list (the row at the stop), and Delete, Backspace and Shift+Enter reach the kill and the split through the functions the view calls.
2. A composer tab with exactly one terminal has no way to show it (Behaviour 2, option (a)). When the tab shows the composer and one terminal exists, draw the list with that one row, so the reader can show it, split it or kill it. A tab that shows a terminal keeps the title bar when it is the only one. Correct the sentence "With one terminal the bar names it instead" in `HELP.md:123` to say both. Case: the composer with one terminal draws one row with that terminal's name, and the composer with none draws no list.
3. `parseLayout` (`saved/saved.ts:312`) keeps in `page.views` only keys that are registered view ids. Cases: an empty key and an unknown key are dropped, a registered id is kept.
4. `storedOrder` gains a duplicate case: `storedOrder({ order: ['a', 'a'] })` equals `['a']`.
5. The Kill check at `tests/views/sessions/terminal.test.ts:195` counts `aria-label="<the terminal_kill word>"` inside each row's slice of the body, so it goes red with Kill on one row only.
6. `DESIGN.md:271`: "except the Terminal view", since the Changes view draws a session picker.
7. `src/lib/state/workbench/layout.svelte.ts:7-9`: re-wrap the head comment to the file's width.

## Report corrections

8. For each of the four new `pages.test.ts` cases and each of the four `folds.test.ts` cases, quote its own failure: undo the step's change to the function the case tests, run the case, quote the failure, put the change back. Do the same for the new cases of items 1 to 5, against the code before this round.
9. Keep the line naming the `git rev-parse` you ran. No git command is run in this round.

## Tests

Run only the test files you change while working, then `npm run check`, `npm run format:check` and `npm run lint`. Do not run the full verify list: the orchestrator runs it on main at landing.

Rewrite the report at `.agents/worktrees/Q89/tools/oculus/.scratch/migration/agents/reviews/Q89-report.md` with these items, in the brief's shape, its first section the open items as the main checkout's `tools/oculus/.scratch/migration/orchestrator-state.md` lists them when you finish.
