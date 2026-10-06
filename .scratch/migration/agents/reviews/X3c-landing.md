# X3c landing

Position: plan oculus/migration, step X3c (the tab strip brought to VS Code's editor tabs) landed. In flight: T1c (the sweep of `tests/server/`), its repair round 1 reported. Next: the run over T1c's round and its landing; `/spec` of T1b, T1d and T1e, which X3c's landing unblocks.

## Open items

- Z314 (the owed look Q81): a Confirm drawn over the update tray, shown only while `tasks.skip_permissions` is on in `config/behavior.yml`; the classifier refuses the edit. Options: (a) Axel sets `skip_permissions: true` himself, the look is taken, and Axel sets it back; (b) the point is dropped from the look. Recommendation (a); (b) is the lazy option.

## NOT DONE

Nothing of X3c's brief.

## Check of the agents

X3c's builder `aa0cc6392e8b3076f` and its reviewers `a535e06539cbd8738` and `afe977eb85adbd5f1` are not running: `ListAgents` listed only the peer session `ordo-01`.

## What landed

X3c, one commit on main (the commit that carries this file), from base c02b7570, as `agents/briefs/X3c.md` and its round-1 rulings say: pinned tabs, wrapped tabs and preview tabs; the tab's right-click menu on bits-ui with its close questions; a file tab's path breadcrumb under the strip and its Save, Revert, star, Preview and Blame at the strip's end; New Text File opening an untitled source whose first Save asks for a served root and a name; the strip revealing the active tab; the key sheet and the update tray taking the focus; palette rows kept to one line. Merged on main with D25 and Q91: `DESIGN.md`, `HELP.md`, `Files.svelte`, `Editor.svelte` and `Source.svelte` keep both steps' changes, and X3c's `gutter-read.ts`, a copy of `source-gutter.svelte.ts`, is removed.

## Fixes at landing

1. Spec 1: `closeAsk` (`state/workbench/navigation/pages.ts`) names the tabs holding unsaved text under the many-tabs question; the tab-menu test is red before the fix and green after.
2. Spec 2: DESIGN's strip-menu sentence names New Text File and Lock Group or Unlock Group.
3. Standards 1: `state/sources/fs-history.ts` (fs.svelte.ts at 809 lines) and `views/sessions/terminal/grid/grid-links.ts` (TerminalGrid.svelte at 516 lines) split out under the size caps.
4. Z361: the light Modern theme's inactive tab text is `#717171`, and `tests/checks/look/contrast.test.ts` measures hand-written `-txt` tokens; with `#868686` it fails at 3.43:1 and 3.64:1.
5. Z355: `tab-measures.test.ts` and `select.test.ts` deleted, three cases deleted, two pairs of cases folded.
6. Z372 (a): a strip too narrow for `--tabs-least` and its two scroll controls draws no scroll controls (`controlsFit` in `ui/tabs/tab-strip.ts`, read by `tab-scroll.svelte.ts` and `Tabs.svelte`); `tests/ui/tabs/tab-strip.test.ts` is red with the controls always drawn.
7. `source-said.client.test.ts` mocks `Code.svelte` at its path under `views/shared/prose/`.
8. `SourceNote.svelte` and `untitled-save.ts` moved to `views/sources/source/save/`, since the merge left the folder at 11 items.
9. Five comment lines past 100 columns rewrapped.
10. The layer diagrams regenerated, and `layerDot` (`utils/diagrams/graphs.mjs`) runs Graphviz with `mclimit=4`: the step removed the one runtime import from `state/workbench` into `state/life`, and Graphviz then drew `state/client` to `state/boards` along `state/workbench` to `state/system` for 78 pt. `arrowsAlong` over the step's own `layer-state.svg` prints that pair, and over the regenerated one prints nothing.

## What was found

The round 1 run's findings are closed under "Closed" in `agents/reviews/X3c-refuter.md`. Proof 1 needed no change; Proof 2 and Proof 3 were report-only. The builder ran git commands in the worktree against the no-git rule (`git rm --cached`, `git show`, `git status`, `git ls-files`), as its report states.

The harness used for Z372's check (a scratch Vite server over a symlink to oculus's `node_modules`) rewrote the shared `node_modules/.vite` dependency cache, and TEST showed "Failed to fetch dynamically imported module" for monaco-editor until it was reloaded with `location.reload()`. The harness server is stopped.

## Verification on main

`sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` from `tools/oculus`, after every fix: `checks: 7 commands passed` (npm test 598 files, 14311 passed, 661 skipped; test:checks 31 files, 471 passed, 9 skipped; check 3372 files 0 errors 0 warnings; build; format:check; lint; the ASCII gate), 425 s, load average 4.22 7.90 9.32 after. No A/B: the block names no `bench:`.

## The look on TEST

- The left pane at 97 px: the tab list 97 px wide, the active tab "Changes" whole with its close control, no scroll controls, the strip's actions on a line of their own. Before the fix the list was 0 px wide.
- The Q78 steps replayed under `:theme mocha`: all four strips show their active tab whole.
- `:theme vscode-light-modern`: the inactive tab text reads rgb(113,113,113) on rgb(248,248,248); the theme put back to vscode-dark-modern.
- HELP.md's source tab: the breadcrumb "hub > tools > oculus > HELP.md" under the strip, Save, Revert, star, Preview and Blame at the strip's end.
- No write left behind: `~/.oculus/changes.jsonl` and `workspaces.json` checksums and the history count as before; `git diff --exit-code -- config` clean; the middle pane put back on Staged Changes.

## Usage

Builder `aa0cc6392e8b3076f`, claude-sonnet-5-5 at ordo-high: 221,047 tokens, 823 tool uses, 195.1 min; round 1 336,267 tokens, 375 tool uses, 117.4 min. Reviewer `a535e06539cbd8738`, claude-opus-5-5: 364,675 tokens, 113 tool uses, 33.4 min; over round 1 `afe977eb85adbd5f1`, claude-opus-5-5: 113,188 tokens, 116 tool uses, 33.9 min. Brief check, claude-opus-5-5: 318,282 tokens, 113 tool uses, 17.0 min. The first report did not pass its bar; ten fixes at landing. Review branch: `review: every`.

## Next

The run over T1c's round 1 and T1c's landing; `/spec` of T1b, T1d and T1e; T1a after the four sweeps.
