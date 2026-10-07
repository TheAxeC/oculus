# X3e landing

Position: plan oculus/migration, step X3e (the Files view's lists reordered by drag, the Files tree following the disk, the server's git reads off the event loop), landed 2026-10-08. Next: D28 (saving a file as VS Code does), then M8 once its premises are checked again on main.

## Open items

- Open item 5 (2026-10-08, X3e's landing): the root drag of the Files tree has no guarded entry, so the test written for S-R1 (`tests/views/shared/explorer/root-drag.test.ts`: a drop over a tree whose own drag never ended, from a drag of another tab, writes no order; the tree's own drag still drops) is not landed and is kept as `agents/reviews/X3e-root-drag-test.patch`. A wrong drop writes the order of the roots into `sources.yml` or the workspace in force, a wrong configuration written. Options: (a) a new entry G57, "A root dropped on a Files tree reorders only that tree's roots: a drag from another tab, or one whose start was in another tree, writes no order", Code `src/lib/views/shared/explorer/tree/control/dragging.svelte.ts`, Test the patch's file with its two titles, landed in the next step that touches the tree (D28); (b) no entry, the fix kept and the look the check, as for every view. Recommended (a): the failure writes the reader's configuration, the kind of cost spec.md names for a test, and the test runs in well under a second; (b) is the lazy option, since it leaves a configuration write with no check that runs.

## Not done

- The look ran on a scratch oculus (port 8796), not on TEST: the page on 8790 is Axel's to view only.
- Case 121 was measured on the scratch oculus with no builder running, not under builder load on TEST.
- E80 with the fix: the page showed w2 readable after a start in which its first `status` was made slow past the 5 s limit; the "unreadable" state in between was not caught by the page (sampled every 0.5 s). The diagnosis's harness shows both states on the real watcher (timed out, then readable 3.2 to 4.6 s later).
- The diagnosis's test `git-timeout.test.ts` is not landed, under Z524 (b).

## The check of Steps 1

`ListAgents` lists no agent of X3e: the builder a92e4feff93b8e90c, the reviewers a428b4ea21e9a98c7 and ad7f07abd9fb019bb and the diagnosis agent a9c92f106b8cabbf3 have all ended.

## What landed

On main from base e1a75b8e1, 210 files, +6990 -3105 with the fixes at landing: the roots, the folder bookmarks, the notes and the Files view's sections reordered by drag; a second Collapse Folders press closing the roots; the Files tree following the disk; the server's git reads as child processes, off the event loop; the repositories nested in each root to `repository_scan_depth`; the Source Control defects Q88c-1 to Q88c-20, X3a-1 to X3a-7, Z311's tree keys, Z358's ticker tooltip, Z359 and Z364.

The four findings of the review over round 1, closed at landing: S-R1 (a tree takes a root drop only from a drag carrying a type only its own root drags carry), T-R1 (`carriesRoot`'s doc comment), S-R2 (the brief's D8 and premise line, report parts 1 and 10) and P-R1 (report part 8). G41 in `agents/guarded.md` names `failureLine` in `src/lib/server/core/git/failure.ts`.

Fixes at landing, outside the builder's tree:

- the merge with D11 over the shared paths of the dispatch entry;
- a HEAD or index tab read again from git by Read Again and when HEAD moves (`read-again.ts`, `reloadHead`, `tab-draft.svelte.ts`);
- a tree's refusal said on the tab's note line, so the Files view has one message line over its foot (`picks.svelte.ts`, `Tree.svelte`, `RootedTree.svelte`, `keyed.ts`, `Files.svelte`);
- the Files message line and the Repositories outcome line (X3b's, outside the brief) one row, words left and close control right, flush with the pane's foot;
- a changed file's tooltip and tooltips of several lines;
- a reveal into a root added a moment ago, and the row scrolled to and focused once the list draws it in a tab just brought forward (`ShowPath.svelte`);
- the palette row's end column;
- the commit questions of the Repositories view and the Deposit view in the singular for one path ("Commit 1 staged path on main?");
- comments rewrapped to 100 columns, the diagrams regenerated;
- the git watcher reading a root again after a read whose git ran out of time (`readState` in `server/core/git/state.ts`, `readOnce` in `server/root/watch/git.ts`, the sentence in `docs/source-control.md`), from `agents/reviews/X3e-diagnosis-unreadable.md`.

## Verification

- `test:landing: 277.6 s; every command passed` in `.agents/worktrees/gate`: ASCII gate, format, lint, `npm test`, `test:checks`, then `check`, `build` and `test:slow`. `test:checks` ran again after `root-drag.test.ts` was taken out.
- Main's staged diff equals the gate's: `git diff --cached -- tools/oculus | shasum` cfc74e53 on both.
- Verify 12a and 12b: case 104 base RED mean 1964 ms, landed GREEN mean 156 ms; case 105 base RED mean 6231 ms, landed GREEN mean 136 ms; case 106 base `"red":true` waitMean 251, landed `"red":false` waitMean 3, rows [50]; case 107 landed `"red":false` waitMean 3, rows [50] (cathedra left out).

## The look

On the scratch oculus: C1, C3, C5 (scrollTop 716, the row at 412 in a pane from 101 to 740, the keyboard on its treeitem), D1, D2, D3, D5 (case 53), D7 to D10, D17 (cases 76 and 77), E79, E80, E81, F1 (case 87), F2 (case 88), gamma as no repository, `site` under the hub at depth 1, both message lines at the pane's foot (740). Case 121: Delete 1.78, 1.10 and 0.96 s; the Graph's first rows 1.0 s after the view drew.

## Agents

| Agent | Role | Model | Tokens | Tool uses | Time |
|---|---|---|---|---|---|
| a92e4feff93b8e90c | builder | claude-sonnet-5-5 | 242,603 | 1,064 | 247.4 min |
| a92e4feff93b8e90c | builder, round 1 | claude-sonnet-5-5 | 327,785 | 127 | 47.3 min |
| af2605318ca450b06 | brief check | claude-opus-5-5 | 356,640 | 172 | 18.3 min |
| a428b4ea21e9a98c7 | reviewer | claude-opus-5-5 | 130,768 | 214 | 40.0 min |
| ad7f07abd9fb019bb | reviewer over round 1 | claude-opus-5-5 | 366,125 | 88 | 17.9 min |
| a3197582441fe32df | premise recheck | claude-opus-5-5 | 379,052 | 142 | 17.6 min |
| a50c90211e587451f | premise recheck | claude-opus-5-5 | 264,170 | 194 | 24.9 min |
| a5362788c15eea5c9 | premise recheck | claude-opus-5-5 | 345,597 | 111 | 12.9 min |
| ac0f36057604161b8 | premise recheck | claude-opus-5-5 | 256,101 | 203 | 21.9 min |
| a8790e3b7e3882bba | diagnosis (graph) | claude-opus-5-5 | 342,576 | 147 | 56.0 min |
| a6cc8344f6841003b | diagnosis (delete) | claude-opus-5-5 | 292,313 | 148 | 51.7 min |
| abb9ccd51ca0b8884 | diagnosis (panel) | claude-opus-5-5 | 238,223 | 104 | 29.6 min |
| a9c92f106b8cabbf3 | diagnosis (unreadable) | claude-opus-5-5 | 336,362 | 139 | 76.0 min |

The builder's first report did not pass its bar: the first review's findings went back in round 1. The fixes at landing are listed above.
