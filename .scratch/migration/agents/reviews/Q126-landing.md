# Q126 landing

Position: oculus/migration, step Q126 (DESIGN.md reduced to its decisions where Q125 left it short) landed. Next: D23c, D45, X3e, M8, D43, D23b and D33 are ready to prepare; PR3's builder is running.

## Open items

None.

## Agents stopped

`ListAgents` before the landing lists one subagent, PR3's builder a348cc74b67ed634e; none of Q126's agents.

## Not done

Nothing inside the brief.

## What landed

DESIGN.md's items outside Apps reduced to their decisions, the reader's detail in the guides (`docs/files-and-search.md`, `docs/source-control.md`, `docs/views.md`, `docs/window.md`) and in the head comments of `server/git/deposit.ts`, `server/machine/pty/channel.ts`, `state/life/memories.ts` and `state/system/audit.ts`. 9 files, +113 -121 staged on main from base 60263c8d.

## Fixes at landing (6)

- The merge with D23. D23 landed first and wrote DESIGN.md's socket, Processes, Search, References, editor, status bar and language server text on a base before Q125, so the worktree's cherry-pick onto main's head conflicted in `DESIGN.md` (8 hunks), `channel.ts` and `socket.ts`. Resolved by Z642's rule, D23's text carried into Q126's items: the schedules and seeds paths under `machine/runs/`, the bullet on a file locked by its mode, the Monaco options sentence, the semantic-token theme sentence, the References view bullet, Find All References in the Search paragraph, the breadcrumb's document symbols, the status bar's language server item, and the two language server bullets. Every insertion of D23's word diff over DESIGN.md is in the merged text except four Q126 reworded: the two schedules paths stand in Q126's sentences, the processes-rule bullet Q126 removed as a repeat of the Processes paragraph (which holds D23's language server sentence), and the breadcrumb sentence. The head comments of `channel.ts` and `socket.ts` keep D23's citation of "The socket", where D23 moved the rule they cite, so `socket.ts` carries no change of Q126's.
- Spec 1: the Literature search cite names the Views guide's "Literature search" and the Configuration guide's "The Literature search's keys" (`docs/configuration.md:44`).
- Spec 2: a pane's `locked` and `recent` cite `docs/window.md`'s "Inside a page" (`:43`) and "Where an opened tab lands" (`:39`).
- Standards 1: the change log sentence and the worktree sentence restated without the negation.
- Standards 2: the Calendar paragraph says what the client half is, the reader's own OAuth client id and secret or Entra application id and tenant (`server/accounts/connect/store.ts:5-6`).
- Behaviour 1: Fixed git choices states the one setting oculus adds, `user.useConfigOnly` on every commit, and its reason (`server/git/git-write.ts:38-41`).

## Proof 1 to 4, corrected here

The builder's report is a record and is not rewritten; this report supersedes it.

- `docs/source-control.md:55` now opens "These git choices have no setting. Untracked files are their own group".
- The report's item rows and before-and-after quotes for DESIGN.md's Git writes item and Worktrees item give the text before the round; main carries the text after it.
- The report's line numbers are Q126's tree before the merge with D23 and do not hold on main: main's `DESIGN.md` has 574 lines (`wc -l`) and the native window item is at line 570.
- The history-word grep has one hit, `channel.ts:27` on main "again before it is taken as an empty list", a time order and no defect.

The round's builder ran `git status` once in the worktree, read only, against the brief.

## The look

No look: the step changes documents and head comments, and no view.

## Verification

`npm run diagrams && npm run test:landing` from `tools/oculus` on main: ASCII gate, format:check, `npm test`, `test:checks`, lint, and check, build and test:slow, "test:landing: 343.3 s; every command passed".

## Usage

- Builder afcd520222de3ff13 (claude-sonnet-5-5): 236,054 tokens, 132 tool uses, 29.5 min; round 1 300,288 tokens, 30 tool uses, 5.5 min.
- Brief check a184d66639bbbd679 (claude-opus-5-5): 193,539 tokens, 55 tool uses, 8.1 min.
- Reviewer a632fa655d3e8b1a2 (claude-opus-5-5): 309,031 tokens, 82 tool uses, 13.5 min; over round 1 a3c24fe9dcb004e1d (claude-opus-5-5): 249,685 tokens, 73 tool uses, 8.8 min.
- The first report did not pass its bar (one repair round, 16 items); 6 fixes at landing.
