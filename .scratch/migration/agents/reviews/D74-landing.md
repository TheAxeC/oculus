# D74 landing

Position: oculus/migration, step D74 (the shell and source-control fixes); 351 of the 355 step lines of plan.md's "Packages, in execution order" are ticked (counted by their `- <tick> <id>` prefix). Next: /spec D73 (the Literature view) from main's head; D76 (notes like Obsidian) is building; then Q72 and O33.

## Open items

None.

## Check of Steps 1

ListAgents before the landing listed one agent of this session running, D76's builder a167a0af4861f0040; none of D74's: its builders (aac8ad09939b7cc54, afff48d2ef6a116fb), its brief check (a1dd027bb4d25ddfb), its reviewers (aae4a86c850771659, ace5c1e4521c02fb0) and its diagnosis agent (a5e4e011ba391dc69) had all finished.

## NOT DONE

Cmd+W and Cmd+Shift+T were not pressed in the look (the browser owns both keys and the desktop app was not started); the pinned-tab rule and Reopen Closed Tab were looked at through the pins and `:reopen-closed-tab`, and the keys are covered by the rows of G54.

## What landed

The booking in plan.md under D74, 236 paths, +7,146 -4,352 against main, the ledger left out: the thirteen parts of the brief, the hub's `.oculus/config.yml` in place of `.oculus/config/`, and the rewritten `.oculus/wallpaper/README.md`.

## What was found

- The review over round 1: four findings, all fixed at landing (`agents/reviews/D74-refuter.md`, Closed).
- Axel's look at the Repositories view, and the look that followed on a scratch oculus on port 8796 whose workspace holds this hub's real folders, three scratch apps and a scratch folder, found three parts not doing what was asked, each fixed at landing: (4) the agents' worktrees `.agents/worktrees/D76` and `gate` were rows of their own beside their entries in research-hub's Worktrees section; (5) a press on an Apps view row opened the app's tab over the list instead of beside it; (2) after a reload of the page the hidden source tab was no longer the focused file. After the fixes the look saw every part of the brief as it asks: one row per repository (10 rows), the Apps view with states, search, row menus and the tab opening beside the list, Live HPC saying "no cluster" on a hub with none, History showing a write and its undo at once, a lead's page with its card and a save shown at once, Debug finding the hidden file before and after a reload, each hub's records drawn with its own vocabulary, and the float holding Live HPC, Usage and Workbenches. The booking in plan.md lists what was seen.

## Verification

In the gate worktree at main's head with the step and every fix at landing, `npm run diagrams && npm run test:landing`: every command passed (`test:landing: 434.5 s; every command passed`, `scratchpad/gate-runs/D74-gate-4.log`), and the source under `tools/oculus` is equal between main and the gate.

## Agents

The builder's first report did not pass its bar; one repair round, refuted again, four findings fixed at landing, ten fixes at landing in all (the booking lists them). Usage: builder aac8ad09939b7cc54 (claude-sonnet-5-5) stopped for another model at Axel's word, 651 tool uses, 101 min; builder afff48d2ef6a116fb (claude-opus-5-5) 256,333 tokens, 867 tool uses, 211.5 min, round 1 117,350 tokens, 162 tool uses, 25.2 min; brief check a1dd027bb4d25ddfb (claude-opus-5-5) 324,217 tokens, 144 tool uses, 17.4 min; reviewer aae4a86c850771659 (claude-opus-5-5) 76,686 tokens, 98 tool uses, 18.5 min; reviewer over round 1 ace5c1e4521c02fb0 (claude-opus-5-5) 261,447 tokens, 90 tool uses, 19.7 min; diagnosis a5e4e011ba391dc69 (claude-opus-5-5) 338,652 tokens, 117 tool uses, 31.8 min.
