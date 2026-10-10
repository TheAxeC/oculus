# D58, repair round 1

The rules file, the standing spec and the brief `agents/briefs/D58.md` hold as before. The findings are in `agents/reviews/D58-refuter.md`. Work only in `.agents/worktrees/D58`. Run no git command of any kind, `git -C`, `git diff` and a git command whose output is thrown away included. Write nothing under `tools/oculus/.scratch/` but your report.

## Rulings, one per finding

1. **Spec 1, Behaviour 3, Standards 3 (a hub link that climbs out of the hub).** In the hub's space, a link whose target climbs out of the hub opens nothing, as it did at the base. `openingOf` (`doc-link.ts`) returns no opening for it, the same way it returns none for a link climbing out of the engine when `engineAt` is empty. The doc comment of `openingOf` (`doc-link.ts:87`) and `Markdown.svelte:22-23` are then true as written, or are reworded until they are. Add a row for `docs/DATA-MAP.md` linking `../../x.md` to whatever check covers `openingOf`, so it is checked at the place the defect occurs.
2. **Spec 2, Behaviour 1 (an engine tab has no file).** Item 3 asks that an engine tab acts on the file at `<engineAt>/<path>` under the hub root when `engineAt` is not empty. That covers every place that asks a tab for its file, the pane bar and beyond: the breadcrumb (`strip/tab-crumbs.ts`), the tab menu's Copy Path, Copy Relative Path, Reveal, Show in Files, Open Timeline, Add Bookmark and Open in Program (`tab-menu.ts` through `tab-menu-state.svelte.ts`), the tab's file icon (`shownFileOfTab`), the hover path (`shownTabPath`, `pane-view.ts`), the Open Editors row (`open-editors.ts`, `OpenEditors.svelte`) and the Timeline following the tab (`Timeline.svelte`). For each of these an engine tab with a known, non-empty `engineAt` gives `{ root: HUB_ROOT, path: <engineAt>/<path> }`; with `engineAt` empty (the engine outside the hub) or not yet known, it gives no file, as now.
   - The place comes from the server's own `engineAt`, the field of the docs answers (`manual()`), so the page and the server agree by construction. The page never recomputes it from the served roots' directories.
   - The saved tab state stays as it is (`{ id, path, engine: true, label? }`), with no `engineAt` written into it.
   - No module-level mutable state is added anywhere under `src`: `tests/checks/tree/boundaries.test.ts` ("holds no process-wide state") must pass without an exemption. The docs store `docs.svelte.ts` already holds the manual's answer; read it from there, or pass `engineAt` into `fileOfTab` from the callers, whichever keeps the layering of `tests/checks/tree/boundaries.test.ts` green. Say in the report which you chose and why.
   - The strip label (`strip-tab.ts`) and the window title (`workbench-title.ts`) of an engine tab show its state's label, or the path's last name when it has none, as item 3 says for the tab; never "Hub document". `doc.yml`'s `doc:` word and `Doc.svelte`'s registration comment (Standards 5) say the view draws hub and engine documents.
   - Add test rows where the rules file's test rule calls for one: `fileOfTab` (or its replacement) for an engine tab with `engineAt` `tools/oculus`, with `''`, and for a hub doc tab.
3. **Standards 2, Proof 1 (a link out to a dot folder or `node_modules`).** `engineFile` checks the real path relative to the engine's real folder with `hasHiddenSegment` after the inside check, and refuses a hit with the same message as the name check ("the path has a node_modules or dot segment: X"). Add rows to `tests/routes/docs/docs.test.ts`: `docs/hid.md` a link to `../.scratch/x.md` and `docs/nm.md` a link to `../node_modules/y/r.md`, each answering 404 with that message. DESIGN.md:493 and the Doc text's G2 sentence are then true.
4. **Standards 1.** Rewrap `jump.ts:7-8` so `doc-link.ts` stands on one line.
5. **Standards 5.** `catalogue.ts`'s head comment (lines 1-8) names the engine document helpers it now holds.
6. **Standards 6.** `docs.test.ts:7` says what the test reads: the temporary directory and the engine's `config/` through `loadConfig(engineDir())`. Or the test stops reading the engine's config, if `handleDocs` can be given a config without it; say which.
7. **Behaviour 2 (two serial reads).** A hub doc tab starts its own read and the manual's read together, not the second after the first answers. The restate of item 6 still waits for the manual's `engineAt` before it decides; only the start of the hub read stops waiting on it. State the before and after in the report.
8. **Behaviour 4.** The report's case 6 gives the before and after as the reviewer measured it: with the shipped arrangement the link activates the open guide tab; a new tab, after the guide tab is closed, is named as ruling 2 gives it.
9. **Standards 4.** No git command, in any form. The builder never runs one.

## Paths this round writes, added to the brief's list

- `tools/oculus/src/lib/state/workbench/navigation/pages.ts`
- `tools/oculus/src/lib/data/helpers/files/paths.ts` (`hasHiddenSegment`, as already written)
- `tools/oculus/src/lib/shell/panes/pane-view.ts`
- `tools/oculus/src/lib/shell/panes/PaneView.svelte`
- `tools/oculus/src/lib/shell/panes/workbench-title.ts`
- `tools/oculus/src/lib/shell/panes/strip/strip-tab.ts`
- `tools/oculus/src/lib/shell/panes/strip/tab-crumbs.ts`
- `tools/oculus/src/lib/shell/panes/strip/tab-menu-state.svelte.ts`
- `tools/oculus/src/lib/shell/panes/strip/tab-menu.ts`
- `tools/oculus/src/lib/state/sources/explorer/sections/open-editors.ts`
- `tools/oculus/src/lib/views/sources/files/sections/OpenEditors.svelte`
- `tools/oculus/src/lib/views/sources/files/sections/Timeline.svelte`
- `tools/oculus/src/lib/views/sources/files/Files.svelte`
- `tools/oculus/src/lib/views/sources/files/sections/Outline.svelte`
- `tools/oculus/src/lib/shell/Workbench.svelte`
- the test files under `tools/oculus/tests/` that cover the functions above

A file outside this list that the fix needs is named in the report with why.

## Verify before you report

The brief's checks 1, 2, 3, 3b, 3c and 4, rerun over every file this round touches, each line quoted. Each new test row is run on the tree before this round's change and after it, both quoted.

## Report

Append "Repair round 1" to `tools/oculus/.scratch/migration/agents/reviews/D58-report.md`: per ruling, what changed (file and line), the check that shows it, and the before and after of every behaviour that changed. Then the verification lines.
