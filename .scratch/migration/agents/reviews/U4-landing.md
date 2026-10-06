# U4 landing

Position: plan oculus/migration, step U4 (the Focus and Sessions views brought to the size of the other views), landed; next: the landings of D27 and Q85d and the preparation of Q88c, Q66 and Q35.

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z187, the Files view's folder picker against "nothing outside a root served" (raised 2026-10-01 22:15 by X3a's brief check, finding 6.1, `agents/reviews/X3a-brief-check.md`). Z76 (a) rules both a folder picker for Add Folder to Workspace and, among the kept items, that nothing outside a root is served. A picker has to list folders outside every root, since the folder being added is not a root yet. Today nothing lists a folder outside a root; the token that would guard the new listing already lets its holder start a shell (`routes/api/(sessions)/terminal/+server.ts:13`, `handleTerminal(request, server.token, ...)`), so the listing reveals nothing a token holder cannot already read.
  - (a) The picker lists the names of folders under the home folder only, token-gated, folder names and no file and no content. For: VS Code's folder dialog starts at home; the folders a reader adds live there; nothing a token holder lacks. Against: the kept item becomes "no file content outside a root" instead of "nothing".
  - (b) The same, for any absolute folder, `/` included. For: a folder on another volume can be picked. Against: lists system folders no one adds as a root.
  - (c) No listing outside the roots: the picker browses only inside the served roots, and a folder outside them is added by typing its absolute path, checked to exist. For: the kept item stays word for word. Against: adding a new folder means typing its path, which the picker exists to spare; VS Code never asks for a typed path.
  - (d) No picker: the typed path of today stays. The lazy option: it drops the picker Z76 (a) rules.
  - Recommendation (a): the picker Z76 asks for, limited to the folders a root is ever added from, with nothing served that the token's shell cannot already reach. X3a waits on this ruling; its other brief-check findings are closed in automode (Z188).

## The check of Steps 1

ListAgents showed no U4 builder (a9d3aad609c4df803) and no U4 reviewer (af7ae20aeafc614df) running before anything in the worktree was committed.

## NOT DONE

Nothing of the brief is left undone.

## What landed

The cherry-pick of 1dcb9627..U4 onto main (19 files, 221 insertions, 96 deletions, `git diff --cached --stat`), plus one fix at landing: `src/lib/views/boards/focus/Tasks.svelte` `.head` gap 8 px to 4 px (the review's Spec 1, the head's gap at the counterpart's 4 px).

- Focus: the ticker row actions as the small text button (weight 400, no uppercase, no letter-spacing), lane heads 22 px with the name at 11 px cut with an ellipsis, cards and the career panel a step smaller.
- Sessions: session and terminal rows two lines at 40 px (Z180 (b)).
- Repositories: the commit dropdown at the Commit button's height.

## Verification on main (from tools/oculus)

```
$ npm run diagrams          (exit 0)
$ npm test
 Test Files  418 passed | 22 skipped (440)
      Tests  10977 passed | 618 skipped (11595)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
COMPLETED 2947 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

`land.sh`'s own run of `checks.sh` from the repository root exited 254 (npm finds no `package.json` there); the list above is the run from `tools/oculus`.

## The look (TEST, localhost:8790)

- Focus, opened on TEST from the Views view: command center, Tasks (head gap measured 4 px), the ticker's "Awaiting a response" rows, the lanes (Revise, Review, Funding, Job applications) and the career panel; ticker buttons measured weight 400, `text-transform: none`, letter-spacing normal; a lane head 22 px, its name 11 px, `nowrap` and `ellipsis`. Nothing wrong seen.
- Sessions list: session rows measured 40 px each, no horizontal overflow.
- Repositories: the Commit button 26 px and the dropdown opener beside it 26 px, font 12 px.
- Not looked at: the text scale at 1.5, the 140 px narrow pane and the keyboard walk of the ticker buttons (brief cases 3, 9 and 10 in part); the tab was not in front for focus.

## Findings and how they closed

From `agents/reviews/U4-refuter.md` (its Closed heading): Spec 1 fixed at landing (above); Standards 1 needs no change; Behaviour 1 is stated here: the Sessions rows go from 44 px to 40 px and their details from `--fs-sm` to `--fs-xs`.

## Agents

| Agent | Model | Tokens | Tool uses | Time | Notes |
| --- | --- | --- | --- | --- | --- |
| Brief check | claude-sonnet-5-5 | 306,765 | 84 | 14.6 min | |
| Builder a9d3aad609c4df803 | claude-sonnet-5-5 | 311,295 | 72 | 21.2 min | 1 full-list run, passed |
| Reviewer af7ae20aeafc614df | claude-sonnet-5-5 | 211,235 | 47 | 23.7 min | 1 Spec, 0 Proof, 1 Standards, 1 Behaviour |

The builder's first report passed its bar, with one fix at landing. No repair round.

## Next

/land D27 (its round review is in: two Standards findings, comment text, fixed at landing), /refute Q85d running, L4 and D35 round 1 building, Q88c's brief check running, then /spec Q66 and Q35.
