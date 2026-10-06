# Q107 landing

Position: roadmap entry oculus/migration (the cockpit-to-oculus migration); step 192 of 308, Q107: a Terminal tab never closes while its terminals run, and a Terminal tab offers the running terminals no tab owns. Next: /spec Q109; S3a's review and X3d's build are in flight.

## Open items (verbatim)

- None.

## Not done

Nothing inside the brief. `bench: []`, so no A/B. One limit is kept as ruled in round 2 (ruling 1 (f)): a dev server that has just started has read no list yet, so it holds no tmux server pid. If tmux then answers "no server" on that first read, three times in a row, the page is still told the list is empty.

## The check of Steps 1

The runner's agent listing (ListAgents) showed X3d's builder and S3a's builder running, Q107's round-2 reviewer as completed, and neither Q107's builder a47f5dbf141e5a482 nor its earlier reviewers ad54a4d0f4137b7ba and a498a23d465b6bf60.

## What landed

Main at a1a2692e plus the step, cherry-picked from base b7a5618a with no conflict (`Auto-merging` on `DESIGN.md`, `HELP.md`, `docs/diagrams/layers.dot` and `layers.svg`). 43 files changed in the step's wip commit.

- **Server (`src/lib/server/machine/pty/`).**
  - `channel.ts`: reads of the list are ordered by turn. A "no server" answer is confirmed by two more reads. The empty list is taken only when no control client runs and the tmux server that gave the last list is not running.
  - `sessions.ts`: the list format gains `#{pid}`, read back by `serverPid`.
  - `tmux.ts`: `tmuxRuns` and `isTmuxCommand`.
- **State.**
  - `state/sessions/terminals.svelte.ts` and `state/sessions/terminal/terminal-lists.ts`: the running terminals no tab owns, and Attach to Session.
  - `state/workbench/layout.svelte.ts`, `layout/saved/storage.ts` and `state/shared/stores/storage-events.ts`: the arrangement another browser tab saves is taken (Z115 (a)).
  - `state/workbench/ui.svelte.ts`: a browser tab's ui save keeps the other tab's instance records (Z128 (a)).
- **Views.** `TerminalList.svelte`, `terminal-list.ts`, `Terminal.svelte`, `TerminalFontTools.svelte`, `TerminalRows.svelte` and `routes/+page.svelte`.
- **Text and docs.**
  - The catalog key `sessions.menu_attach` in `config/text/views/sessions/terminal.yml`.
  - `DESIGN.md:154` and `:361`, and `HELP.md:127` and `:146`.
  - The regenerated `docs/diagrams/layer-state`, `layer-views` and `layers`.
- **Tests.** The step's tests, among them `tests/server/machine/pty/channel-list.test.ts`, `tests/state/workbench/ui-shared.test.ts` and `tests/state/workbench/layout/saved/`.

The landing script's own check ran from the repository root and failed there (`npm error enoent Could not read package.json`), since the verify list's commands run in `tools/oculus`. The list was then run from `tools/oculus` on main with the step and the fixes at landing staged.

## Verification on main

```
$ npm run diagrams          exit 0
$ sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md
$ npm test
 Test Files  355 passed | 20 skipped (375)
      Tests  5473 passed | 573 skipped (6046)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790813211971 COMPLETED 2487 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

## Fixes at landing

These are the four findings of the run over repair round 2. Each was small and inside the brief. Each test was seen failing first: on the unfixed code, or with its guard taken out of a copy that was then restored and `cmp`-checked.

1. **Spec 1.**
   - The defect: `serverPid` read field 11 of the first row. A tab or a newline in that row's folder or title therefore kept no pid, and a "no server" read with no control client ended every running terminal.
   - The fix: it now reads the last tab field of the last non-empty line (`src/lib/server/machine/pty/sessions.ts`).
   - The test: "is found when the first row holds a tab or a newline in its folder or its title" in `tests/server/machine/pty/channel-list.test.ts`. On the unfixed code it failed with "expected null to be 60420". The pure `serverPid` cases moved out of the slow `sessions.test.ts` into that unit file.
2. **Proof 1.**
   - The defect: no test bound the stale guard on the kept pid.
   - The test: "keeps the server of a newer list when an older read answers after it" fails with the guard taken out of `channel.ts:410` ("expected [ 9003 ] to deeply equal [ 9002 ]") and passes with it.
3. **Proof 2.**
   - The defect: the `ps` half of `tmuxRuns` was tested only in a slow file.
   - The test: `tests/server/machine/pty/tmux.test.ts` gains "is not a running tmux for a live process that runs another command, or for no pid". It fails with the `ps` check replaced by `resolve(true)` ("expected true to be false").
4. **Standards 1.**
   - The defect: the `LIST_FORMAT` comment said the last three fields were title, icon and colour, which the new pid field made false.
   - The fix: the comment now names the ninth to eleventh fields as title, icon and colour, and the twelfth as the pid.
   - The new comments were held to the 100-column check (`tests/checks/source/comment-width.test.ts`, "Tests 2 passed (2)").

The four are recorded under the Closed heading of `agents/reviews/Q107-refuter.md`.

## The look (TEST, localhost:8790, tab 812136282 of tab group 727993564)

- **The kinds dropdown.** The bar's dropdown in the Sessions page's Terminal tab holds Shell, Claude, Codex, With a Prompt... and Attach to Session.
  - Attach to Session's submenu listed the two terminals no tab owned, `a5f844-shell` and `d0935c-shell`, each under its name.
  - Choosing `a5f844-shell` put it in the tab, alone, and the tab took its name.
- **During the server reload.** The dev server reloaded its server modules while the fixes at landing were saved on main.
  - The page then showed "the write token is missing or stale", and the attached terminal drew only its cursor.
  - The Terminal tab stayed open. `tmux list-sessions` still listed both terminals, `oculus-a5f844-shell` with 1 client.
- **After a reload of the page.**
  - The terminal drew its lines: the prompt line and "2:06:09", read from the `.xterm-rows` text.
  - The submenu then listed only `d0935c-shell`, since `a5f844-shell` was now owned by the tab.
- **Not covered.** The list's empty-area menu was not opened. It needs two terminals in one tab, and the dropdown is the same submenu built by the same function (`kindsMenu` and `emptyListMenu`, case 7).

## Agents' usage

- **Brief check:** claude-opus-5-5, 223,547 tokens, 87 tool uses, 12.3 min.
- **Builder a47f5dbf141e5a482 (claude-sonnet-5-5):**

  | Run | Tokens | Tool uses | Time |
  |---|---|---|---|
  | First run | 233,656 | 208 | 87.1 min |
  | Repair round 1 | 332,448 | 48 | 36.1 min |
  | Repair round 2 | 122,605 | 55 | 23.4 min |

- **Reviewers (claude-opus-5-5):**

  | Run | Reviewer | Tokens | Tool uses | Time |
  |---|---|---|---|---|
  | First review | ad54a4d0f4137b7ba | 259,978 | 59 | 22.2 min |
  | Over round 1 | a498a23d465b6bf60 | 209,457 | 47 | 18.8 min |
  | Over round 2 | a9fb6ca7bd62d2f37 | 210,751 | 53 | 26.2 min |

- **The bar.** The builder's first report did not pass its bar: two repair rounds, the second the round cap's exception for item 2 left unbuilt with no control client, and four fixes at landing.
