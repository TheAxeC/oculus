# X3f round 3: a file tab's actions in its breadcrumb bar

Rules: `agents/spec.md`, `agents/guarded.md`, the step's brief `agents/briefs/X3f.md` and its round-2 brief `agents/briefs/X3f-round2.md`, which stay in force except where this file says otherwise. This round is built on the worktree that holds X3f's round-2 code, applied from `agents/reviews/X3f-backed-out.patch`.

## Why X3f is back

Axel took X3f out of main: Save, Revert, Blame, the star, Open in Program and Open Preview are on no visible control of a file tab. Round 2 moved them off the tab row (ruling Z466) into the palette and menus only. Axel's ruling: they leave the tab row and go into the tab's breadcrumb bar. Item (B) of X3f's step line stands: every file tab draws them where they apply to its file, whatever view the file opens in.

## What to build

1. **The actions row in the breadcrumb bar.** The breadcrumb bar of every file tab (the bar drawn by `src/lib/ui/tabs/Breadcrumb.svelte` through `src/lib/shell/panes/strip/tab-crumbs.ts` and `PaneStrip.svelte` / `PaneView.svelte`) carries, at its right end, the file tab's own actions as icon buttons with tooltips naming the action and its key where it has one:
   - Save (writable tab with unsaved text; disabled with no unsaved text);
   - Revert File (writable tab with unsaved text);
   - Add Bookmark / Remove Bookmark (the star, filled when bookmarked; a file under a served root);
   - Open in Program (a file on disk);
   - Open Preview (a Markdown file shown as source) or Open Source is not added (Z466);
   - Toggle Blame (a file in a repository, the HEAD and index tabs included, item 3).
   Each appears only where it applies, for every view a file opens in (source, picture, document, PDF, download, Doc, Markdown preview), using the actions each tab already hands up through `src/lib/ui/tabs/tab-actions.svelte.ts` (`handUp`). The tab row keeps only what Z466 gives it: Open Preview to the Side on a Markdown file, Split and the `...` menu. The palette rows, the tab's right-click menu and the file row's menu keep the entries round 2 gave them.
2. **The breadcrumb bar shows on every file tab** that has a file, as VS Code's (`breadcrumbs.enabled`); a tab whose bar is hidden by a setting still reaches the actions through the palette and menus. Where the bar is narrower than path plus actions, the path is cut from the left first (VS Code's behaviour) and the actions stay whole.
3. **Blame on a file read at HEAD or in the index (Z531, (a)).** `blameOf` (`src/lib/server/core/git/reads.ts:294`) takes an optional stage: `head` runs `git blame --porcelain HEAD -- <path>`; `index` reads the staged text (reuse the existing `git show :<path>` read) and runs `git blame --porcelain --contents - -- <path>` with it as `run`'s `input`; no stage is today's command. `GET /api/git?blame=<root>&path=<path>&stage=head|index`; any other `stage` is answered 400 as the route answers other bad parameters. `blameUrl(root, path, stage?)` in `src/lib/state/sources/repositories/repositories.ts`. `Source.svelte` gives the gutter the repository for a HEAD or index tab with its stage; the gutter then reads only the blame, never the quick-diff marks. Such a tab lists Toggle Blame, and only it, among its own actions.
4. **The status bar's blame as VS Code's Git blame (Z466).** The status bar shows the caret line's blame for a file in a repository whether or not the editor decoration is on, as VS Code's `git.blame.statusBarItem.enabled` does at its default; check that default against VS Code's source or documentation and quote it in the report. `src/lib/shell/status/SourceItems.svelte:117` today draws it only while the tab's blame is on.
5. Every sentence of `DESIGN.md` and `HELP.md` that this round makes false is rewritten (grep `breadcrumb`, `blame`, `Revert`, `star`, `title actions`, `tab row` in both and read every hit). Head comments of every file changed stay true.
6. Tests under G37 (its text and Test line are in round 2's brief; the entry is written into `agents/guarded.md` at landing): a row that a file tab of each view kind hands its actions to the breadcrumb bar and not to the tab row, seen failing first on the round-2 tree.

## Cases (first run on the round-2 tree in the worktree, then after)

1. A source tab of `README.md` with unsaved text: the breadcrumb bar shows Save, Revert File, the star, Open in Program, Open Preview and Toggle Blame; the tab row shows Open Preview to the Side, Split and `...` only.
2. The same tab saved: Save disabled, Revert File gone.
3. A picture tab (`.png`): the star and Open in Program only (Blame too when the file is in a repository).
4. A PDF tab and an HTML document tab: the star, Open in Program, Toggle Blame when in a repository.
5. A Doc tab of a `docs/` file and a Markdown preview tab: the star, Open in Program.
6. A HEAD tab (Open File (HEAD)) of a tracked Markdown file: Toggle Blame only; turning it on draws blame read with `stage=head`.
7. An index tab: Toggle Blame only, blame read with `stage=index`; a staged change to a line shows git's uncommitted author on that line.
8. `stage=bogus` answers 400; a path outside the repository is refused as today; a working tab's marks and blame URLs are unchanged.
9. A file outside any repository: no Toggle Blame anywhere, no blame in the status bar.
10. The caret on a line of a tracked file with the decoration off: the status bar shows that line's blame; pressing it opens the commit as today.
11. A narrow pane: the path is cut from the left and every action stays drawn.
12. The star in the breadcrumb bar bookmarks and unbookmarks the file, and a refusal shows "The bookmark was not written: <reason>".

## Verify

From `tools/oculus` in the worktree: `npm run diagrams`, then from the worktree root `sh /Users/axelfaes/.claude-work/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md` (it runs `npm run test:quick`); pass is `checks: 1 commands passed`. The look on TEST is the orchestrator's, before landing, over every case above.

## Paths this round writes

Everything the round-2 brief names, plus:
- `tools/oculus/src/lib/ui/tabs/Breadcrumb.svelte`, `tools/oculus/src/lib/shell/panes/strip/tab-crumbs.ts`, `tools/oculus/src/lib/shell/panes/strip/PaneStrip.svelte`, `tools/oculus/src/lib/shell/panes/PaneView.svelte`
- `tools/oculus/src/lib/server/core/git/reads.ts`, `tools/oculus/src/lib/server/git/git-reads.ts`, `tools/oculus/src/lib/state/sources/repositories/repositories.ts`, `tools/oculus/src/lib/views/sources/source/Source.svelte`, `tools/oculus/src/lib/views/sources/source/source-gutter.svelte.ts`
- `tools/oculus/src/lib/shell/status/SourceItems.svelte`, `tools/oculus/src/lib/shell/status/status-items.ts`
- the catalog files under `tools/oculus/config/text/` that hold the new tooltips
- `tools/oculus/.scratch/migration/agents/reviews/X3f-report.md` (the report, replacing round 2's)

## Report

What is NOT done first; the cases' first run on the round-2 tree; a DONE / NOT DONE table naming the command behind each row; the verify output after the last change; the number of full-list runs; every file changed with its line count; each sentence of DESIGN.md and HELP.md rewritten, before and after; the VS Code default quoted for item 4.
