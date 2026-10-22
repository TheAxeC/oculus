# O49 round 1: the comments and pages made true and rewrapped, the Apps guide naming Open View

Rules: `agents/spec.md`, the step's brief `agents/briefs/O49.md` and the cases ruling `agents/briefs/O49-cases.md`, which stay in force except where this file says otherwise. The refuter report is `agents/reviews/O49-refuter.md`; the findings below are its St1, St2, St3, St4, P1 and P2, each with the ruling to carry out.

## What to build

1. **St1, the comments rewrapped.** The head comment of `src/lib/shell/panes/strip/open-view.svelte.ts` and the doc comment of `stripMenu` in `src/lib/shell/panes/pane-view.ts` (the paragraph around lines 300-308) are rewrapped as whole paragraphs at 100 columns, so no line inside a sentence ends short when the next word fits (`spec.md`, the comment rule). The words stay as they are.
2. **St2, the head comment of `src/lib/shell/panes/PaneView.svelte` (lines 44-45).** It says what the pick does: a view a page or a float holds is shown where it is held, and any other view opens in this pane. The comment no longer says every view opens in this pane.
3. **St3, the Open View bullet of `docs/HELP.md` (line 76).** It says what the submenu lists, true to the code: the views the Views catalogue lists, so not a view opened only for an entry and not the view of an app that is not active, by rail page, then the floats' section, then the views the apps add under Apps, each item named so that Float and the apps' views read as two sections.
4. **St4, the Apps guide.** `docs/apps.md` line 87 (where an app is opened from) and line 263 (where an app's view is listed) also name Open View: an app's views and the app's own entry are listed in Open View under Apps, with the container's title as their hover words. The path list is widened to these two lines.
5. **P1, the verify list after the last change.** `npm run test:quick` runs once after the last change of this round, and the report quotes that run.
6. **P2, the after-close path.** The report states, by reading, what a pick does when the pane closed or the tree changed while the menu was open: the menu is drawn inside the pane and unmounts with it, and a pick reads the pane's place through its getters, so it uses the current path.

## Cases (first read on the round-0 tree in the worktree, then after)

1. St1: `awk 'length > 100' ` over the two files prints nothing, and each line of the two paragraphs ends where the next word would pass 100 columns; quote the paragraphs before and after.
2. St2: the head comment read against `open-view.svelte.ts`'s pick: before, it says the views open in this pane; after, it says a held view is shown where it is held.
3. St3: the bullet read against `listedViews` (`src/lib/state/workbench/navigation/catalogue.ts:381-383`) and the submenu's sections: before, "every view" and the Float phrase; after, true to both.
4. St4: `sed -n '87p;263p' docs/apps.md` before and after.

## Paths this round writes

- `src/lib/shell/panes/strip/open-view.svelte.ts`
- `src/lib/shell/panes/pane-view.ts` lines 296-394
- `src/lib/shell/panes/PaneView.svelte`
- `docs/HELP.md` lines 76-76
- `docs/apps.md` lines 87-87
- `docs/apps.md` lines 263-263
- `.scratch/migration/agents/reviews/O49-report.md` (the report, a section "Repair round 1" appended)

## Verify before you report

From the worktree root, after the last change, once: `npm run test:quick`. The ASCII gate of `spec.md` over the changed files. The plan's whole verify list runs once, at landing on main.

## Report

Append "Repair round 1" to the report: per finding, what changed with the file and line, the case reads before and after, the verify lines quoted from the run after the last change, and P2's statement.
