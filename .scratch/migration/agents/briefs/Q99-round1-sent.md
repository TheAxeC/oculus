# Q99 repair round 1 (sent 2026-09-28)

The round starts at the worktree commit `bc5c3bef` (the step's work as you left it, committed by the orchestrator). The findings are those of `agents/reviews/Q99-refuter.md`. Every item below is a known change: nothing here asks you to find a cause, reproduce a fault or measure. You work in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/Q99/tools/oculus` and nowhere else, run no git command of any kind in any checkout, start no tmux session on the default server (a scratch `-L <name>` server is allowed), run no browser test and write under `.scratch/` only your report. Never open, print or grep `config/local.yml` in any checkout. The rules file and the brief still hold. The paths below that the brief did not list (`server/machine/pty/sessions.ts`'s steer) are added to this step.

## Change

1. A following Terminal tab that shows a selected Claude or Codex session's terminal closes when that terminal ends, as plan.md's point 2 ("a tab showing a terminal that has ended closes") says of every tab. Today `closeEnded` knows only `selectedTerminal()`, which is null for a session id, so such a tab stays open over nothing.
   - `TerminalTabs.selected` returns the raw selection (`selection.selected` in `state/client/context.ts`), a terminal id or a session id or null.
   - The store keeps, after each `sessions` message, `followed`: the terminal the selection shows, which is the selection itself when `isTerminalId` holds and otherwise `terminalOfSession` of the selected session's record in that message's payload, and the selection it was resolved from.
   - On the next message, `followed` is among the ids `endedTerminals` is handed as held. When it ended and the selection is still the one it was resolved from: a terminal selection is cleared and the following tabs with no identity close, as today; a session selection is kept (the Transcript and the other views still show the session) and the following tabs with no identity close.
   - Cases in `tests/state/sessions/terminals.test.ts`: a session selected whose terminal is listed, then a message without that terminal, closes a following tab and keeps the selection; the same with the selection moved to another session between the two messages closes nothing; the terminal selection case keeps its behaviour.
2. `terminals.svelte.ts:338-339`: `first` and `heard` are set only by a message whose `terminals` is an array, so a message with no list does not spend the first message. Case: a first message with no list, then a message with a list that lacks the terminal a tab is pinned to, closes that tab. Quote its failure with the fix undone.
3. The injected `identity: stateId` goes: `TerminalTabs` loses its `identity` field, `closeEnded` calls the module's own `identity()` (`terminals.svelte.ts:191`), and `state/client/context.ts` and every test fixture stop passing it.
4. The bracketed paste claim made true: `DESIGN.md:264` and the comment at `server/machine/pty/channel.ts:495-498` say that a mouse report and a focus report reach the program in one write, and that a paste over INPUT_MOST bytes arrives in several writes, in order, with its opening and closing markers each whole.
5. `server/root/watch/sessions.ts:99`: the comment names exactly when `terminals` is absent, as the code leaves it out (the source missing from the watcher's options), and that the payload then carries no `terminals` field.
6. A Pages row drag released over the same row does not show the page. The row's click takes the Catalogue's rule (`Catalogue.svelte` `dragged(event)`): the press keeps its origin, and a click whose distance from it is at or past `THRESHOLD` (with `event.detail` above 0) is the drop's and calls nothing. Case in `tests/views/system/workbench/pages.test.ts`: a press, a move past the threshold and a click on the same row leave `switchPage` uncalled; a press and a click with no move call it once.
7. The steer types any length it accepts. `steerArgs` builds one `send-keys -H` command per piece of `inputChunks(Buffer.from(text, 'utf8'))`, through the same builder the channel's input uses (one function for a `-H` command, shared by the two), then Enter. Cases in `tests/server/machine/pty/sessions.test.ts`: a 20000-character steer gives `ceil(20000 / INPUT_MOST)` `-H` commands, each of at most INPUT_MOST byte words, then Enter; a line break inside it is typed as its byte. Before: a steer over about 16.3 KB was one `send-keys -l` word, which tmux refuses. After: any steer up to STEER_MAX arrives.

## Report corrections

8. The test count of `npx vitest run tests/server/machine/pty` is what the run prints (80 at the review, and whatever the round leaves).
9. Under "Reader-visible changes", with the before and after: large input to a terminal (before, a literal run over about 16.3 KB was refused by tmux; after, any size arrives in 996-byte commands, about 1 s per 100 KB); the steer of item 7; the Pages drag of item 6; the following tab of item 1.
10. The report's first section is the open items as the main checkout's `tools/oculus/.scratch/migration/orchestrator-state.md` lists them when you finish.
11. For each new or changed case, quote its failure with the change it guards undone, then put the file back.

## Tests

Run only the test files you change while working, then `npm run check`, `npm run format:check`, `npm run lint` and `npm run diagrams`. Do not run the full verify list: the orchestrator runs it on main at landing.

Rewrite the report at `.agents/worktrees/Q99/tools/oculus/.scratch/migration/agents/reviews/Q99-report.md` with these items, in the brief's shape.
