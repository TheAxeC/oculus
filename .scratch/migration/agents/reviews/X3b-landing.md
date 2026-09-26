# X3b landing

## Open items

- R1, where a tree row's status letter and controls sit (raised 2026-09-26 at X3b's landing, seen on the TEST page). In the Repositories view, as in the Files view, a row's hover controls and its status letter (`M`, `U`, `A`) follow the path, so the letters of a list sit at a different place on every row. VS Code puts them at the row's right edge, one column down the list. `src/lib/ui/tree/TreeItem.svelte:270-276` keeps the name to its own width on purpose: Q59's orchestrator, not Axel, decided that the controls and counts should sit beside the name in a wide pane (`agents/reviews/Q59-report.md:72`). That decision now clashes with Axel's standing demand that VS Code surfaces match VS Code. Options: (a) the name takes the free width, so every row's controls and letter sit at the right edge as in VS Code's Source Control and Explorer, in every view that draws a tree row; the change is `.main { flex: 1 1 auto }` and a browser case; (b) keep the controls beside the name. Recommended (a): it is what VS Code does, a column of letters can be read down the list, and a count or letter a pane's width from its name is what VS Code accepts too. (b) is the lazy option.

Booked, no ruling needed: 4 (Q72, Q79, O33, O32). Q79 gained the 14 raw buttons found here.

## NOT DONE

Nothing of X3b's brief.

## What landed

X3b, VS Code's Source Control, one commit on main (the commit that carries this file). The Repositories view, its diff and merge editor, and the source tab's quick diff and blame:

- the repository list, the commit box with its Commit list and Ctrl+Enter or Cmd+Enter, the Merge Changes, Staged, Changes and Untracked groups with their head actions, the graph, stashes, tags and the `...` menu;
- the side-by-side and inline diff with hunk and line staging, unstaging and reverting;
- the three-way merge editor with Accept Deletion and Mark Resolved;
- the source tab's gutter marks and blame;
- a browser port per worktree (`OCULUS_BROWSER_PORT`, `layerPort`, a free port per revert-check case), which Q77's line no longer carries.

## Resolved on the way in

The cherry-pick onto main's head, taken in the worktree on `X3b-land`, conflicted in 18 files after S2, Q67 and Q76 had landed. The conflicts were in DESIGN.md and HELP.md, eight diagram files (regenerated), `TextArea.svelte` (both props kept), two browser helpers, the duplication allow list, and five directive lines. A line each side changed was resolved by taking each side's own change. Two of main's directives were already stale: `notices.spec.ts` and `notice-sources.test.ts` pointed at `layout.openView` rather than `writes.onUnwritten`, and `duplication.test.ts` was one line off. All three were re-pointed.

## Fixed at landing (15)

From the refutation of the round:
1. AU and UA conflicts read as a deletion (`git.ts`): a side is deleted only when the base holds the path. New case in `git-reads.test.ts`, red with the fix reverted.
2. Cmd+Enter unproven: a `commit.spec.ts` case presses Meta+Enter.
3. Complete Merge over a non-empty Result on a UD row: a directive on `Merge.svelte:134` in the conflicts case.
4. `git-write.ts`: the `rm` comment named Mark Resolved, which runs `add`.
5. Three branch parsers: `git-parse.ts`, `deposit-git.ts` and the old `BRANCH_FORMAT` made one, `parseBranches` reading `REFS_FORMAT` through `parseRefs`; `git-write.ts` and `deposit.ts` list with `REFS_FORMAT`; the head comment says so.
6. `git.ts`'s head comment still named `branch`.
7. `git.test.ts` titles said "the pinned five"; there are six.
8. The source-text case in `layer.test.ts` removed. The accounts spec now asserts the redirect addresses on the served port, and the port is proven by every browser case revert-check runs on a free port.

From the orchestrator's read and the look:
9. The merge editor's Result crashed on a keystroke when the versions left no lines: `regionsOf` always returns one region; a case in `merge.test.ts`, red with the fix reverted.
10. The side-by-side diff was as wide as its longest line (40,148 px for `HELP.md`, the new side off screen): side by side, each column wraps within the pane; a case in `diff.spec.ts`, red with the fix reverted.
11. The blame age said "1 days ago": each unit has its singular key in `repositories.yml`, and the unit test that asserted "1 hours ago" now asserts the singular.
12. `accounts.spec.ts` (Q67) hardcoded port 8792 and failed on any other port.
13. `tests/ui/primitives.test.ts` reached 917 lines: the Tooltip cases moved to `tests/ui/menu/tooltip.test.ts`.
14. Five duplication allow entries named copies that no longer exist (the removed parser, the folded commit box, Q67's folded account parts).
15. Every directive whose target line moved in the merge or the fixes was re-pointed by its target line's content, and S2's directive on the moved `repositories.svelte.ts` was re-pointed to its new path.

## Verification on main, after the fixes

- `npx vitest run --reporter=dot`: `Test Files  339 passed (339)`, `Tests  5313 passed (5313)`
- `npm run check`: `COMPLETED 1503 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`; `npm run build`: exit 0; `npm run format:check`: `All matched files use Prettier code style!`; `npm run lint`: exit 0
- ASCII gate: 0 lines; `sh bin/size-check.sh` and `sh bin/folder-check.sh`: exit 0
- `npm run diagrams` twice: `1ba3658911c8ae0cc934b5538a0ad6986e24d576` both times
- `npm run test:browser`, the whole suite once after the diff fix: `458 passed (10.2m)`. After it, the specs changed later (`tests/browser/scm`, `accounts.spec.ts`, `repositories.spec.ts`): `60 passed (1.7m)`
- revert-check, scoped by Axel's option (b) to the directives whose target code on main differs from the tree they were proven on (86 of them, in 23 files; a partly affected file run as a copy keeping only its affected directives, deleted after): first pass `86 reverts, 4 unproven`. Of the four, one was the stale path of item 15, two were the serve.ts port directives of item 8, which cannot go red because no case runs when the server's port is wrong (dropped), and one was a range that swallowed a line (fixed). The second pass: `9 reverts, 0 unproven`; `file-git.test.ts` after its last change: `7 reverts, 0 unproven, 0 unchecked`
- `ls -d $TMPDIR/oculus-*`: none
- Agents: X3b's builder and its two reviewers are not running (`TaskStop` answered that no such task exists for each; `ListAgents` lists no agent of this session)

## The look

On the TEST page of the dev server on 8790, light theme. X3b changes no theme.

- The Repositories view: six repositories with their branch and counts, the commit box, 145 staged paths.
- The `HELP.md` diff side by side: before the fix, 40,148 px wide; after it, 697 px with both sides wrapped in step.
- `server/core/git.ts` (800 lines) in a source tab with blame on: 819 gutter cells within about 218 ms of the press, no long task recorded, and the ages read "1 day ago" and "1 week ago" after the fix.
- The three tabs opened were closed, blame turned off, and the page left on Views and Settings, as found.

## Next

Q78 and Q77, then Q79 and Q80, each alone, then the queue of `plan.md`.
