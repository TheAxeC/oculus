# Step Q32 refuter report (on .agents/worktrees/q32, base 77ef1c91)

## Verification (rerun by the reviewer)
All commands were run from `tools/oculus` in the worktree, with node v24.21.0.
- `npx vitest run --reporter=dot`: `Test Files 235 passed (235)`, `Tests 3952 passed (3952)`. No timing test failed, so none was rerun.
- `npm run check`: `COMPLETED 1175 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npm run build`: `built in 3.80s`.
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: exit 0, no output.
- ASCII perl gate: prints nothing (exit 0).
- `find src tests bin -type f | xargs wc -l | sort -n | tail -3`: largest files are 970 (`tests/state/layout.test.ts`) and 979 (`tests/state/board.test.ts`). The largest touched component is `Files.svelte` at 525 lines.
- `npx playwright test tests/browser/files.spec.ts tests/browser/repositories.spec.ts tests/browser/search.spec.ts tests/browser/source.spec.ts`: `28 passed (47.4s)`.
- `npx playwright test tests/browser/open-file.spec.ts` (quoted in the report): `8 passed`.
- `git status --short` is the same before and after the review. My probes and reverts ran only under `scratchpad/q32-review/`:
  - `probe/look.spec.ts` and `probe/keys.spec.ts`, run through their own config against the suite's server on 8792.
  - The reverts ran in a cloned `copy/`.
- Reverts rerun in the copy. Every one turned its test red:
  - Tree `stop` always on the first row: 1 red.
  - Repositories `shownRoot(roots, '')`: 3 red.
  - Changes without `count={total}`: 1 red.
  - Change groups always open: 1 red.
  - `filterRows` with `below` empty: 2 red.
  - Root row without `heading`: 1 red.
  - Notes head control labelled "Notes": 1 red.
  - TreeSection drawing its list while closed: 2 red.
  - Busy line always drawn: 1 red.
  - Browser: dropping `.item:hover .actions` from TreeItem, rebuilt in the copy: the hover case failed with `Expected "1" Received "0"`.

## The look against VS Code
Screenshots are under `scratchpad/q32-review/shots/`. They cover the light and vscode-dark-modern themes at a 1280x900 viewport: `*-files-1-open-selected-hover.png`, `*-files-2b-first-head-hover.png`, `*-files-3-sections.png`, `*-files-4-filter.png`, `*-repos-1-hover-change.png`, `*-repos-2-picker.png` and `keys-tooltip-focus.png`. The numbers below were measured by `probe/look.spec.ts`.
- **Row density.** `src/lib/ui/TreeItem.svelte:126` sets rows to 24px and `:156` sets 11.5px text (headings 10.5px, `:228`). VS Code uses 22px rows at 13px. The tree reads taller and with smaller type than the Explorer.
- **Row width.** Every row spans the full pane (1148px wide measured), so the row controls sit about 1100px from the name (`TreeItem.svelte:240-247`), and so do the heading counts (`:234-237`, `margin-left: auto`). VS Code's controls and count badges sit next to the header or item in a narrow sidebar. Nothing in the view limits the width.
- **Selection colour.** The selected row uses the theme's accent tint with accent-coloured text (`TreeItem.svelte:139-141, 165-167`): light gives background rgb(230,214,210) with text rgb(149,73,44), dark gives rgb(19,43,61) with rgb(8,147,254). VS Code keeps the foreground colour on selection.
- **Focus outline.** The 1px outline is on `.main` only (`TreeItem.svelte:169-172`), while the highlight covers the whole `.item`. The outline box stops short of the controls column (visible in `light-files-1-open-selected-hover.png`).
- **Selection look used for other states.** It also marks the workspace in force (`views/files/Workspaces.svelte:54`), the checked-out branch (`views/repositories/Branches.svelte:43`) and the bookmark being edited (`views/files/Bookmarks.svelte:59`). The Files view therefore shows two highlighted rows at once (the tree row and "Configured roots"). VS Code does not draw "current" as "selected".
- **Tooltip covers the next row.** The tooltip of the keyboard-focused row sits over the row below, with the mouse parked away: the tooltip box was y=380-401 and the next row y=374-398 (`keys.spec.ts`). The cause is `TreeItem.svelte:94`, which wraps every row in `Tooltip`. Arrowing down the tree always hides the next name.
- **Root head controls.** The first root's head holds a full `Select` (`views/files/Tree.svelte:137`, 23px inside the 24px head) at opacity 0, so the workspace in force is not readable until hover. VS Code headers carry icon buttons only.
- **Indent guides.** Guides are always drawn, 16px per level (`TreeItem.svelte:176-182`). A first-level entry under a root has none (`Tree.svelte`, `depth={row.depth - 1}`). VS Code draws them on hover by default.
- **Change rows.** The status letter comes inline after the folder and the +/- counts (`views/repositories/Changes.svelte:111-117`), where VS Code puts it in a right-hand column.
- **Empty change groups.** Staged 0 and Untracked 0 are drawn open with nothing under them (`Changes.svelte:90-99`); VS Code hides an empty Staged group.
- **Count placement.** Group counts sit right after the label (`Changes.svelte:93-98`) while section counts sit at the far edge: two placements in one view.
- **Inline forms.** Branches and Worktrees end in bordered text inputs with a bordered "create" button, 31px tall (measured). That is not the row style (`Branches.svelte:62-70`, `Worktrees.svelte:87-99`).
- **Empty states.** Bookmarks 0 and Notes 0 draw a head with nothing under it (`Bookmarks.svelte:34-59`, `Notes.svelte:41-75`). Commits, Branches and Worktrees draw a sentence, placed with hand-set 20px left padding (`Repo.svelte` `.empty`, `Branches.svelte:83`, `Worktrees.svelte:2154-2165` in the diff) rather than the row geometry.
- **Repository picker.** It is a bordered `Menu` button ("demo") above the branch line (`Repositories.svelte` `.picker`). Its list also holds roots that are not repositories: cathedra, game-engine and the probe folders (`vsdark-repos-2-picker.png`).
- **What matches.** The chevron rotates 90 degrees with a 120ms transition (measured `matrix(0, 1, -1, 0, 0, 0)`). Hover is `--chip` (light rgb(241,245,249), dark rgb(38,38,38)). Headings are small capitals with a chevron.

## 1. Spec
- **"Every action the view offers today stays reachable" is broken in error and loading states** (`src/lib/views/Files.svelte`):
  - `:464`: `{#if marks.error !== ''}` draws only the error line, so "+ bookmark" is gone while the bookmarks cannot be read.
  - `:480`: same for "+ note" while the notes cannot be read.
  - `:422`: while `saved.loading`, neither "+ root" nor the workspace choice is drawn (the fallback toolbar is only in the error and no-rows branches).
  - On main all five controls sat in the pane toolbar in every state.
- **Main's actions and where they are now:**

| Action on main | Where it is now |
|---|---|
| Files: workspace select (toolbar) | First root head on hover (`Tree.svelte:137`); Workspaces section rows; fallback toolbar |
| Files: + root (toolbar) | First root head on hover; fallback toolbar |
| Files: save as (toolbar) | Workspaces head |
| Files: + bookmark (toolbar) | Bookmarks head (missing on bookmarks error) |
| Files: + note (toolbar) | Notes head (missing on notes error) |
| Files: folder open/close | Row press, Right/Left |
| Files: file preview (click) | Row press, Enter |
| Files: keep (double click) | Double click; row "open in a new tab" |
| Files: remove root | Root head on hover |
| Files: bookmark open / edit | Row press / row control |
| Files: note open / delete (confirm) | Row press / row control |
| Repositories: stage / unstage / discard (confirm) / diff per change | Row controls; row press opens the diff |
| Repositories: switch branch | Branch row control |
| Repositories: create branch | Input in Branches |
| Repositories: create worktree (confirm) | Input in Worktrees |
| Repositories: worktree diff / terminal / merge back / remove | Row controls; row press opens the diff |

- **Brief item 3.** Row height and indent were to be "tokens or catalog-free CSS in the view". They are hardcoded px custom properties in the primitive (`TreeItem.svelte:126-127`).
- **The filter defect is not in the report.** The brief's "parent folders kept open" is met only for drawing. The keyboard defect and the lost open folders (section 4) are missing from the report's limitations; it names only the press case.
- **Changes no item asks for:**
  - `repositories.log` changed from "Recent commits" to "Commits" (`config/text/views/repositories.yml:17`).
  - The row star also removes a bookmark (`Files.svelte:215-227`).
  - The new-branch and new-worktree labels became placeholders (`Branches.svelte:66`, `Worktrees.svelte` `placeholder={t('repositories.worktree_new')}`); the visible label is gone once text is typed.
  - The busy and outcome lines moved above the sections (`Repo.svelte:80-85`).
- **Decisions taken silently, beyond the report's list:**
  - A row star bookmarks under the file's bare name (`Files.svelte:221`).
  - Empty sections and groups are always drawn.
  - "Current" is drawn as "selected".
  - The picker lists roots that are not repositories, and labels by last folder name (`state/repositories.ts:403-406`), so two roots with the same last folder read the same.
  - The refresh control repeats on every root head and re-reads everything (`fs.svelte.ts:669`).
- **Judgment calls 3, 4, 7 and 8 are user-visible and belong with the orchestrator:**
  - 3: picker and + root on the first head only, and hidden until hover.
  - 4: folder rows get no controls, although the brief lists bookmark and open-in-tab for rows.
  - 7: a row press opens a diff.
  - 8: the filter text is kept in instance state, so a tree comes back filtered after a tab switch or reload.
- **False head comment the change created, not in the report.** `src/lib/views/shared/ChangeGroups.svelte:5-8` still says "Two views draw them ... the Repositories view over every root ... the diff control to Repositories". Repositories no longer uses it, and its `controls` prop (`:26`) now has no caller. The file is outside the brief's paths; the report does not mention it.

## 2. Proof
- **Reverts.** All ten reverts I reran turned their tests red (see Verification). No figure in the report failed to reproduce: 3952 tests, 1175 files, 28 passed, 8 passed, 17 repository cases, and the line counts all match.
- **Keyboard (probe, `keys.spec.ts` and `look.spec.ts`):**
  - Filter off: Up, Down, Home, End, Right, Left and Enter behave as the brief says (browser case 10 and the probe). Left on a first-level file goes to its root head.
  - Filter on: Left on a folder drawn open by the filter does nothing. On `sub/deeper`, three presses of Left left the focus there with `aria-expanded="true"`, so the reader never reaches the parent by Left. Each press writes "closed" into `expanded` (`Files.svelte:198-199` via `Tree.svelte:121` and `state/fs.ts` `treeMove` `row.open`). After clearing the filter, `one/README.md` was no longer drawn: the real tree lost that open folder.
  - Filter on: Up, Home and End still work.
  - No node or browser case covers the keyboard with the filter on.
- **Focus stop.** It holds for the tree rows, with two extra stops.
  - The first head's workspace `Select` is always a stop (`Tree.svelte:137`, no `tabindex`).
  - The stop row's own controls are stops.
  - Measured tab order from the filter box: 3 breadcrumb buttons, the Workspace select, the stop row, its bookmark and new-tab controls, then each section head, head control and row.
  - Repositories has no roving stop: 16 Tab stops for one change and empty sections.
- **Tests encoding a debatable behaviour.** `tests/browser/repositories.spec.ts:94-127` asserts that a non-repository folder is a picker entry showing `repositories.error`, which pins non-repositories in the picker.
- **Assertions over markup only.** `tests/views/files.test.ts` "offers the filter over the trees ..." checks an aria-label string. These are audits, not coverage.
- **Module-level mutable state:** none added in `src`. `tests/ui/tree.test.ts:26-29` sets `text.ts`'s catalogs at import, as 53 other test files do.
- **Widened predicate:** none. `tests/ui/wall.test.ts` gains two SOLID registry entries with reasons, following the existing hover entry for `SessionWorkspace`.

## 3. Standards
- **DRY: the status-letter tone map exists twice.** `views/repositories/Changes.svelte:45-57` (`TONES`, `letterStyle`) copies `views/shared/ChangeGroups.svelte:43-55`, and the `counts` snippet (`Changes.svelte:70-81`) copies `ChangeGroups.svelte:58-69`. Fixing it needs an edit outside the brief's paths (a shared helper in `state/repositories.ts` plus `ChangeGroups.svelte`), which is a paths clash for the orchestrator. The report lists it only as a limitation.
- **False comment in `TreeItem.svelte:123-124`.** It says "a view that wants a denser tree sets them on an ancestor". `--tree-row` and `--tree-indent` are declared on `.item` itself (`:126-127`), so a value set on an ancestor is overridden and cannot take effect.
- **Primitive coupling.** `TreeItem.svelte:256-264` restyles another primitive's internal class (`.actions :global(.tool)` from `ToolButton.svelte`). `ui/` imports no state; TreeItem, TreeSection and Breadcrumb import only `Glyph`, `Tooltip` and `TreeItem`, and `tests/boundaries.test.ts` passes.
- **Stale or inaccurate sentences:**
  - `Files.svelte:105`: "Which form the toolbar has open" (the toolbar is only a fallback now).
  - `config/text/views/files.yml:1`: "the tree, its toolbar".
  - `Tree.svelte` head comment: "The list is one stop of the focus order: the selected row carries it" (false; see the stops above).
  - `TreeItem.svelte:5`: the count "beside" the name (it sits at the far edge).
  - `DESIGN.md:311`: "its tree and its two lists" (now three sections), not carried into the report's Doc text.
- **Catalog strings contradict the behaviour.** `config/text/views/files.yml:25-26` say "Filter the open folders by name" and "No open folder holds a name with that text". The filter searches folders read and then closed (`state/fs.ts` `filterRows`; `explorer.test.ts:73`) and skips folders never opened.
- **Report's Doc text:**
  - The HELP.md line 85 text repeats "a filter over the open folders", which contradicts its own DESIGN text ("walks every listing already read").
  - The DESIGN text "the tree is one focus stop on the selected row" is false by the measured tab order.
  - The DESIGN text "the workspace picker and the add-root control sit on the first root's head only, so each is on the page once": the workspace choice is also the Workspaces section's rows.
- **Hand-set alignment.** The 20px left padding is repeated to line text up with row geometry: `Repo.svelte` `.empty`, `Branches.svelte:79,83`, and `Worktrees.svelte` `.add`, `.none` and `.warn`.
- **Clean:** history in comments (grep for package ids and dates over the new and changed files: none), non-ASCII (gate clean), raw controls (the raw `<button>`s are inside `ui/` primitives only), missing catalog strings (none; every glyph name used exists in `config/glyphs.yml`), and component size (`Files.svelte` 525).

## 4. Behaviour
Changes the report does not state, with before and after:
- **Row star on a second file of the same name.**
  - Before: no row star.
  - After: `Files.svelte:221` bookmarks under `row.name`. A second `README.md` is refused with "The bookmark was not written: an entry with that label is already in the file" (probe: `one/README.md` pressed=true, `two/README.md` pressed=false with that note).
- **Filter with folders never opened.** `hidden.txt` in the never-opened `never/` gave only the root heads and `files.filter_none` (probe). A press on a folder drawn by the filter changes nothing on screen (probe: the rows are identical before and after). Left on it traps the keyboard and closes the real folder (section 2).
- **Controls kept transparent but present.**
  - The tree list has no `role="tree"`, `treeitem` or `aria-level`; the ARIA snapshot is a flat list of buttons, so depth is not exposed at all.
  - Of 32 buttons in the list, 20 are at opacity 0 and are still announced, for example "refresh", "collapse all" and "remove" on every root head.
  - On a touch screen there is no hover, so the controls are invisible but pressable.
  - A pointer on the right edge of a root head reveals and hits the unconfirmed "remove" (`Tree.svelte:173-181`; `Files.svelte` `remove()` has no confirm, as on main, but it used to be visible).
- **Tooltip on focus.** It covers the row below on every arrow move (measured, section "The look").
- **Workspace in force.**
  - Before: always visible in the toolbar select.
  - After: visible only on hover of the first head, or in the Workspaces section at the bottom, which can be collapsed.
- **Empty change groups.**
  - Before: `sessions.ch_group_empty` ("nothing") under each empty group.
  - After: a group row with count 0, open, and nothing under it.
- **Commit row.**
  - Before: hash, subject, time right-aligned.
  - After: glyph, subject, then hash and time inline.
- **Current branch.**
  - Before: green name text.
  - After: the selection highlight with `aria-current`.
- **Picker entries.**
  - Before: a non-repository root was a stacked section with the error line.
  - After: it is a picker entry among the repositories, named by its last folder.
- **Repositories keyboard.**
  - Before: only the controls were stops.
  - After: every change row, group row and section head is also a Tab stop, with no arrow-key movement.
- **Bookmarks and notes error states.** "+ bookmark" and "+ note" disappear (section 1).

## Not checked
- A screen reader was not run; the accessibility findings come from the ARIA snapshot and computed styles.
- A narrow pane (a split layout, where the rows would be sidebar-width) was not screenshotted.
- The TEST page on port 8787 was not used.
- The wallpaper themes were not checked.
- Reverts for the explorer's filter, breadcrumb and arrow-key browser cases were not rerun individually. Only the hover browser revert was rerun; the builder's six-at-once build was not reproduced.

Reviewer usage: about 40 tool uses, about 16 minutes (11:29 to 11:45 CEST).
