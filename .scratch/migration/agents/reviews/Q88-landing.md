# Q88 landing

Roadmap entry oculus/migration (the cockpit-to-oculus migration). Plan step Q88: right-click menus wherever vscode.dev gives one. Next: Q86b (the Map's drag after neato's placement) to /refute, D13b (the diffs and the merge on Monaco) to its preparation commit.

## Open items

None.

## Check of Steps 1

`ListAgents` before the landing listed two running subagents, Q86b's builder and D13b's brief check; Q88's builder and both its reviewers were not listed.

## NOT DONE

- Not looked at on TEST: the terminal's grid and row menus and the Kill arming (no terminal on the TEST page, and no terminal is started or stopped for a look), the graph's bare name (drawn only while a write is in flight), rendered Markdown and the Document frame's menus.
- Fixes 1 and 2 have no unit test: both are focus and effect behaviour the string-rendering unit suite cannot run.

## What landed

The right-click menus of the pane strip and an empty pane, the Files rows, the Repositories rows, the terminal's grid and list, every text box, rendered Markdown and the Document frame, with the inventory's items, a rule between groups and VS Code's words from the catalogs. Z53 ruled (b): oculus's text menu on every box. The replay conflicted in `TextArea.svelte` with D13a and was resolved by hand; `docs/diagrams/` regenerated.

Fixes at landing (6), each named with its cause in the booking in `plan.md`: the row menu's Kill (the menu's focus move disarmed it); the arm cleared when a tab's terminals change; HELP.md's Terminal row and `Terminal.svelte`'s head comment; the text menu on the search, date and multi-select boxes through `ui/controls/text/TextBoxMenu.svelte`, with `Search.svelte` and `text-menu.ts` moved to `ui/controls/text/`; the first-run record saved as `agents/reviews/Q88-first-run.txt`; the scratch folders removed from the worktree root.

## Verification on main

```
$ npm test
 Test Files  374 passed (374)
      Tests  5856 passed | 1 skipped (5857)
$ npm run check
COMPLETED 2127 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
built in 6.90s
built in 16.82s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 6 commands passed
```

`bash bin/folder-check.sh` exit 0; the perl ASCII gate over src, tests, bin, config, HELP.md and DESIGN.md prints nothing.

## The look

On the TEST page: the pane strip, a Files row, a repository row, a staged change, the commit box and the Files filter each open their menu with the items listed in the booking; the Files filter still filters and Escape still clears it. Nothing was picked. The theme was not changed.

## Usage

Builder: 227 tool uses, 110k tokens, 62 min (the build with the cases hand-back); 67, 247k, 17 min (round 1). Reviewers: 68 tool uses, 286k tokens, 13 min; 41, 184k, 7 min (round 1). No brief check ran for Q88. First report passed its bar: no. Fixes at landing: 6.
