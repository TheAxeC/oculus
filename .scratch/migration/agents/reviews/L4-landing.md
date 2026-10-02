# L4 landing report

Position: oculus/migration, step L4 (floating panes, and a pane kept when its last document or Terminal tab goes) landed. In flight: D35 and M4 (repair round 1, M4's round review running), X3a and D24 (building). Next: M4's round review saved, then /land M4.

## Open items

None. The "Open items" section of `orchestrator-state.md` holds no entry.

## Agents stopped

L4's builder (ac513303559f8c8e2) and its reviewers (aef82904238b07ede, af927a2e2e0450a91) had finished before the landing; the earlier reviewer ac7c886ff3f54f762 was stopped on 2026-10-01. `ListAgents` at 05:55 listed acf8c525dec67af39 (X3a), aad5c8302bdcacd63 (D24), a3a67c98dc6835b4c (D35) and a3c2d2206f5e1482f (M4's round reviewer), none of them L4's.

## NOT DONE

- A Terminal tab's scrollback across Dock and Float was not looked at. The look showed the same iframe element kept across Dock Left and Float, which is the mechanism the scrollback rests on.

## What landed

- The model and the save: `Float`, `FloatPlace`, `Pages.floats`, `Pane.keeps`, `LAYOUT_VERSION` 5; versions 5, 4 and 3 read; a saved layout of version 4 or 3 has the arrangement's floats adopted (`adoptFloats`), the ids of the tabs kept.
- The `floats:` key in `config/layout.yml` with the Focus page's HPC and Usage tabs in one float, its `options.yml` entry, first load and Reset all.
- Floats in the store (`layout/open/floats.ts`): a float is never a page, takes no split, is removed with its last tab, takes no attention and has no maximise.
- On screen: `shell/panes/floats/` (`FloatLayer.svelte`, `float-geometry.ts`, `float-gesture.ts`), docked strips with a sash, free floats with the orange `--float-border`, moved and resized through interactjs 1.10.28 (a new dependency, LA18), snapped to an edge on release within 24 px.
- The menus: Float in the pane and strip menus; a float's menu with Dock Left, Dock Right, Dock Bottom, Float, Return to Page, Close. Alt-drag floats a tab at the pointer.
- Kept empty panes: one per kind per page, on every route, Close pane removes one.
- The words in `config/text/ui.yml` and `views/system/workbench.yml`, `DESIGN.md`, `HELP.md`, and the regenerated diagrams.

On main: 72 files, 4530 insertions and 381 deletions (`git diff --cached --shortstat` before the commit).

## Fixes at landing

- `land.sh` stopped on conflicts in `DESIGN.md`, six diagram files, `state/client/context.ts` and `views/system/Usage.svelte`. `DESIGN.md` took L4's text with Q35's Present frame sentence added; `context.ts` kept main's `fsForms` (Q66) with `.pages()/page` read as `.hosts()/host`; `Usage.svelte` kept L4's comment and main's `zod` import; the diagrams were regenerated.
- Behaviour 4.1 of the run over round 1: a new free float was drawn under a float already pressed. `stackOf` in `float-geometry.ts` now puts the floats the order has not met in front. Four cases of `float-geometry.test.ts` were red against the old `stackOf`; with the fix, that file and `floatlayer.test.ts` ran 40 passed.
- Found in the look: a float adopted from a saved layout took only the first page's tab of each view, and Focus kept its own Live HPC tab beside the float. `adoptFloats` now takes every tab of the view out of the pages. The new case in `tests/state/workbench/layout/open/floats.test.ts` was red without it (`expected [ 'h2', 'k' ] to deeply equal [ 'k' ]`); with it, 39 passed.
- Found in the look: a Monaco diff in a page pane (z-index 10 and 9) drew over a free float (z-index 5). `.area` in `shell/Workbench.svelte` takes `isolation: isolate`; a probe at z-index 999 inside the page was under the float with the rule and over it without.
- `npm install` put interactjs into `node_modules`; `package-lock.json` is the step's.

## Verification on main

The commands ran from `tools/oculus`. This was the fifth run of the list.

```
$ npm test
 Test Files  435 passed | 22 skipped (457)
      Tests  11435 passed | 621 skipped (12056)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
COMPLETED 2978 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

The earlier runs, at load averages of 19 to 22:
- Run 1, before the fixes at landing: 7 timeouts at 5000 ms in `autofetch.test.ts`, `routes/git` tests, `undo-removed.test.ts` and `config-key.test.ts`, files L4 does not change; each passed alone (44, 32, 37 and 38 tests).
- Run 2: `npm test` passed; `npm run check` red on `floats.ts 133:51 Type 'Instance | null' is not assignable to type 'Instance'`, from the `adoptFloats` fix, which was corrected.
- Run 3: 6 timeouts in the two `config-key.test.ts` files (L4 changes neither); alone, 14 and 38 passed.
- Run 4: one timeout, `tests/server/git/autofetch.test.ts`, which L4 does not change. Alone, at load 19 to 21, it timed out in 1 of 44 tests: a real `git fetch` near the 5000 ms bound.

There was no A/B: the configuration has no `bench:` line.

## The look

On TEST (localhost:8790), main's tree with L4 staged:

| What | Seen |
|---|---|
| A saved layout of version 4 opened | saved again as version 5; the float holds TEST's hpc tab 6da5bff1 and Focus's usage tab 86b4ceb6, ids kept; no page holds an hpc or usage tab |
| A new float made after another was pressed | the new float at z-index 6, over the pressed one at 5 |
| Dock Left, then Float, on a float | the same iframe element kept |
| A Monaco diff in the page under a free float | the float drawn on top (after the `isolation` fix) |
| Console | no errors |

TEST was left with its own layout plus the docked float.

## Findings and their dispositions

The first run's findings (4 Spec, 2 Proof, 3 Standards, 2 Behaviour) were sent in repair round 1. The run over round 1 was closed at landing, as `agents/reviews/L4-refuter.md`'s Closed heading says: Spec 1.1 (the round section supersedes the stale sentences of the first report), Spec 1.2 (no change), Proof 2.1 to 2.3 (none against the round), Behaviour 4.1 (fixed at landing, above), Behaviour 4.2 (no change).

## Agents' usage

- Brief check: claude-sonnet-5-5, 136,054 tokens, 149 tool uses, 20.4 min.
- Builder (claude-sonnet-5-5, ac513303559f8c8e2): the build to the report 134,601 tokens, 314 tool uses, 82.2 min (1 full-list run, passed); repair round 1 277,115 tokens, 104 tool uses, 162.2 min (7 full-list runs, none passing: run 1 red on comment width, fixed; runs 2 to 7 red on 5000 ms timeouts in files the step does not change).
- Reviewer, first run: claude-sonnet-5-5, 335,496 tokens, 71 tool uses, 30.7 min.
- Reviewer over round 1: claude-sonnet-5-5, 210,709 tokens, 54 tool uses, 35.0 min.

The builder's first report did not pass its bar: the review found 11 findings and a repair round was sent. Three code fixes were made at landing, besides the conflict resolution.
