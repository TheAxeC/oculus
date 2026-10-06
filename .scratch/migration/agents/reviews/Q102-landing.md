# Q102 landing

Position: oculus/migration (the migration plan), Q102 the terminal working as VS Code's terminal, landed 2026-09-30; next: E1's landing and its choices to Axel, then `/spec` X3d, S3, U2, Q88b and D23.

## Open items

None.

## The check of Steps 1

`ListAgents` before the landing listed no agent of this session: the builder (a90b503af9ee56689) and both reviewers had ended. Nothing was stopped.

## NOT DONE

- The look on TEST was not taken. The Chrome tab was in the background (`document.visibilityState` was "hidden" and both screenshots were blank). It is booked in the state file's Booked section as Q102's look owed, with every view and state it covers.
- Not verified, since it needs that look: what a reload shows after Clear in a shell. tmux's reset erases the prompt row, so the grid is expected empty until Enter.
- The first run of each of the brief's 40 cases on the unchanged tree was not recorded by the builder and cannot be recovered without rebuilding the step. Each test names the revert that turns it red, and both reviews reran those reverts.

## What landed

Base c296a1c7, `git cherry-pick -n main..Q102-land` on main, 80 files, 4453 insertions and 672 deletions before the fixes at landing.

- New Terminal starts a shell at once in the tab's folder; the other kinds (Claude, Codex, a start with a prompt) are in a dropdown beside it.
- Split starts a terminal of the same kind and folder right of the one split; a tab's row holds any number of terminals and scrolls sideways when they do not fit.
- Rename, Change Icon, Change Color, Clear and Copy as HTML (through `@xterm/addon-serialize` 0.14.0, Z69 (a)) on the grid's and a row's menu.
- Closing a tab, a pane or a page, a reset, and unregistering a view end the terminals the tab owns, and ask first when one runs a program other than its shell.

What changes for the reader, beyond the builder's table in `agents/reviews/Q102-report.md`:

| What | Before | After |
|---|---|---|
| The pane strip's tab of a Terminal tab | the view's glyph, default colour | the shown terminal's icon and colour |
| New Terminal on a hub with no folder | the press waited, nothing said | the bar says "No folder to start the terminal in" |
| Clear, then a reload | tmux's screen painted back | an empty grid for a shell; a full-screen program's screen unchanged |

## Conflicts with main, resolved by the orchestrator

- `README.md`: main's dependency sentence (with `@tanstack/query-core`), with Q102's `@xterm/addon-serialize` clause.
- `DESIGN.md`: main's code theme paragraph, with Q102's path `views/sessions/terminal/grid/grid-look.ts`.
- `src/lib/state/workbench/ui.svelte.ts`: both imports kept.
- `docs/diagrams/`: main's copies taken, then `npm run diagrams` on main.

## Fixes at landing (nine)

1. T1: the doc comment of `showTerminal` (`src/lib/state/sessions/terminals.svelte.ts`) said "one half of the tab's split"; it says the tab's row.
2. T2: `grid-actions.test.ts` moved from `tests/state/sessions/terminal/` to `tests/views/sessions/`, each case named as an audit.
3. T3: the sentence fragment in the head comment of `tests/views/sessions/terminal-style.test.ts`.
4. T4: `colorLabel` (`src/lib/views/sessions/terminal/terminal-list.ts`) reads a record typed over the colour list, so a ninth colour without words fails `npm run check`.
5. B1: `clearTerminal` (`src/lib/server/machine/pty/edit.ts`) skips `send-keys -R` while the pane is on the alternate screen. Test: "leaves the screen of a full-screen program alone and clears only the history" in `tests/routes/sessions/terminal-edit.test.ts`. A probe on a tmux server of its own (`tmux -L q102probe`) printed `before: alt=1 mouse=1`, `after clear-history only: alt=1 mouse=1`, and the program's text still on the screen.
6. B2: `composeTerminal` takes the Terminal tab that asked; a terminal answered after that tab closed is ended and the answer is a refusal without words. Test: "is ended and refused when its tab closed before the answer came" in `tests/state/client/terminal/terminal-start.test.ts`; without the fix it fails with `expected { ok: true, id: 'f0f0f0-shell', ... } to deeply equal { ok: false, id: '', error: '' }`.
7. S1: the Clear row of `agents/reviews/vscode-parity.md` written on main by the orchestrator; the builder's edit of that file did not reach main.
8. `tests/state/client/` held 11 items after the merge with main; its four terminal files moved to `tests/state/client/terminal/`, and the comments naming them follow.
9. The compose comment and `showTerminal`'s comment shortened so `terminals.svelte.ts` is 900 lines, at the size line.

Not changed: S2 (a shortened comment that is still true). P1 (the builder's grep claim for item 9 does not reproduce; the one line of that grep the step made false is fix 1).

## Verification on main, after the last fix

`npm run diagrams`, then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` from `tools/oculus`, node v24.21.0, exit 0:

```
$ npm test
 Test Files  348 passed | 19 skipped (367)
      Tests  5303 passed | 557 skipped (5860)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790770500531 COMPLETED 2377 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
built in 4.06s
built in 9.36s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

What this does not cover: anything drawn on screen (the look owed), and a real tmux for Rename, Change Icon and Change Color.

No A/B: the configuration block's `bench:` names nothing.

## Usage

- Builder, claude-sonnet-5-5: 348 tool uses, 133,312 tokens, 102.3 min; repair round 1: 109 tool uses, 309,016 tokens, 41.4 min.
- Brief check, claude-opus-5-5: 66 tool uses, 200k tokens, 8 min.
- Reviewer, claude-opus-5-5: 68 tool uses, 285,026 tokens, 12.6 min. Reviewer over round 1, claude-opus-5-5: about 50 tool uses and 215,000 tokens by its own count, time not measured.
- The builder's first report did not pass its bar: the first review sent eleven items back. The review over round 1 left nine fixes for the landing.

## Next

E1's landing, then `/spec` X3d, S3, U2, Q88b (free now that Q102 is on main) and D23.
