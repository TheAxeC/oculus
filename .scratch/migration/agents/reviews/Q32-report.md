Everything in the brief is done. HELP.md and DESIGN.md are left untouched, as decision 2 says; the exact lines for them are in "Doc text" below.

## DONE / NOT DONE

All commands were run from `tools/oculus` in the q32 worktree.

| Deliverable | State | Proof |
|---|---|---|
| 1. Files as an explorer: one tree per root under a small-capitals head; fixed-height rows with indent guides and a chevron that rotates; hover and selection highlight; selection kept in instance state; Up/Down/Home/End/Right/Left/Enter; filter; breadcrumb; Bookmarks, Notes and Workspaces as collapsible sections; every action still reachable | DONE | `npx vitest run tests/state/explorer.test.ts tests/views/files.test.ts` pass. Browser cases 10 to 14 of files.spec.ts pass (below). |
| 2. Repositories as Source Control: picker kept in instance state; Changes (staged/changed/untracked), Commits, Branches, Worktrees as collapsible sections with counts; row controls on hover or focus; confirm dialog and write answers unchanged | DONE | `tests/views/repositories.test.ts` passes 17/17. Browser cases 15 to 19 pass. |
| 3. Look: theme tokens only; new glyphs with Lucide icons and ASCII stand-ins | DONE | `tests/ui/wall.test.ts`, `tests/contrast.test.ts` and `tests/ui/colours.test.ts` pass inside the full run. |
| Tests 1: node tests of the row model, filter, keys, breadcrumb and picker state | DONE | `tests/state/explorer.test.ts` (new), `tests/state/repositories.test.ts`, `tests/ui/tree.test.ts` (new) |
| Tests 2: both browser specs follow the new markup, plus the six new cases | DONE | Playwright run below: 28 passed |
| Tests 3: every new or changed test names its revert, and each revert was run | DONE | Revert list below; every revert turned its test red and the file was restored afterwards |
| `npx vitest run --reporter=dot` | DONE | `Test Files 235 passed (235)`, `Tests 3952 passed (3952)`. An earlier full run under load failed one timing test (`tests/server/hpc/ssh.test.ts` "rejects a command that never returns at the budget"). Rerun alone it gave `Tests 5 passed (5)`, and it also passed in the final full run. |
| `npm run check` | DONE | `COMPLETED 1175 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `npm run build` | DONE | `built in 4.62s` |
| `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| `npm run lint` | DONE | eslint exit 0, no output |
| ASCII perl gate | DONE | prints nothing |
| `find src tests bin -type f \| xargs wc -l \| sort -n \| tail -3` | DONE | Largest files: 970 `tests/state/layout.test.ts`, 979 `tests/state/board.test.ts`. The largest component is `Files.svelte` at 525 lines. |
| Playwright: files, repositories, search, source specs | DONE | `28 passed (36.2s)`. I also ran `open-file.spec.ts`, which uses `data-fs-row`: `8 passed`. |

## Reverts run
Each line is the change made and the tests it turned red. The file was restored after each one.

**`state/fs.ts` against `tests/state/explorer.test.ts`**
- Drop the name test in filterRows: 4 filter cases red.
- Skip the rows below a matching folder: the parents case and the closed-folder case red.
- Make `below` empty in the walk: the same two red.
- setExpanded always adds the key: its case red.
- Swap the ArrowDown and ArrowUp branches: the up/down case red.
- Home selects the last row: the Home/End case red.
- Right on a closed folder selects instead of opening: the Right case red.
- Drop the Left close line: the Left case red.
- Build each crumb from its part alone: the breadcrumb case red.
- collapseRoot also drops the root's own key: its case red.
- Drop the string checks on `selected`: the instance-state case red.
- parentOf always returns the root: the parent case and the Left case red.
- Drop the Enter line: the Enter case red.
- Return null while nothing is selected: the nothing-selected case red.

**`state/repositories.ts` against `tests/state/repositories.test.ts`**
- shownRoot returns what the instance keeps, whether or not it exists: its case red.
- `root` read from `collapsed`: the instance-state case red.
- repositoryName returns the whole path: its case red.

**Files view, against `tests/views/files.test.ts`**
- Drop the Search box: the filter case red.
- Draw only depth-0 rows: 6 cases red.
- `expanded={row.open}` on file rows too: the expanded case red.
- `depth={row.depth}` instead of `depth - 1`: the guides case red.
- Drop `heading` from the root row: the heading case red.
- Always draw the root removal: 2 removal cases red.
- Draw the picker and add-root on every head: the first-head case red.
- File controls on folder rows too: the controls case red.
- `pressed={false}` on the row star: the pressed case red.
- Put the focus stop on the first row whatever is selected: the selection case red.
- No stop at all when nothing is selected: the no-selection case red.
- File glyph on folder rows: the marks case red.
- Drop the leading `''` in the Workspaces rows: 3 cases red.
- TreeSection draws its list while closed: the closed-section case red.
- Notes head control labelled with the section name: the heads case red.
- Bookmarks drawn only when there are entries: 2 cases red.
- Bookmark tooltip without the path: the where-it-points case red.

**Repositories view, against `tests/views/repositories.test.ts`**
- Show the last root: the one-repository case and the busy case red.
- Show `roots[0]` whatever the instance keeps: the kept case, the picker label case and the busy case red.
- Fixed word as the picker label: the picker label case red.
- `count={0}` on Changes: the Changes count case red.
- Other word on a row's diff control: the change-row case red.
- Group rows always open: the collapsed case red.
- Draw only the first commit: the Commits case red.
- Switch control on the current branch too: the Branches case red.
- List the checkout among the worktrees: the Worktrees case red.
- Drop `git.detached` from the merge control's `disabled`: the merge case red.
- Busy line always drawn: the busy case red.

**Primitives, against `tests/ui/tree.test.ts`**
- Always take TreeItem's text branch: 4 cases red.
- `depth + 1` guides: the guides case red.
- Actions without their `actions` box: the controls-beside case red.
- Always take the button branch: the text-row case red.
- Never draw the count: the heading count case red.
- TreeSection draws its list while closed: the section case red.
- Breadcrumb marks the first segment as current: the breadcrumb case red.

**Browser.** Build A carried six reverts at once, each touching a different case: treeMove returns null, `rows` passed instead of `shown`, no `.item:hover .actions` rule, Notes always open, `shown = roots[0]`, Commits always open. It gave `6 failed`: the arrow-key, filter, hover, section, picker and Repositories section cases. Build B carried one revert, a breadcrumb segment selecting the root line, and gave `1 failed`: the breadcrumb case. Both builds restored the files and rebuilt.

## Doc text

HELP.md line 85, the `files` row of the views table:
`| \`files\` | Files | The file browser over the hub, the engine config folder and the configured roots, read like an editor's explorer: a filter over the open folders, a breadcrumb naming the selected row, one tree per root under a head carrying that root's controls (the workspace picker and the add-root control on the first head, refresh, collapse all, and the removal of a root the reader added), and the Bookmarks, Notes and Workspaces sections under the trees. The arrow keys move the selection, Right and Left open and close a folder, and a file row's star and new-tab controls show on hover. A scratch note's file is made by the first keystroke typed into it, and the delete control in the Notes list is the one thing that takes a note away. |`

HELP.md line 86, the `repositories` row:
`| \`repositories\` | Repositories | One repository at a time, picked at the top from every repository oculus knows: its branch line, then Changes (staged, changed, untracked), Commits, Branches and Worktrees as sections with their counts. A change row opens its diff, and each row's controls (diff, stage, unstage, discard, switch, terminal, merge back, remove) show on hover. |`

HELP.md line 140, first two sentences of "Worktrees and the merge back":
`The Repositories view is over every root the file browser serves, the hub and the configured roots and whatever the current workspace added, plus the workspace of every session, one repository at a time through the picker at its top. What it shows is the pushed state of that repository: nothing is polled, and a commit made in a terminal moves it within two seconds.`

HELP.md line 144, first sentence:
`Each worktree row opens its diff when pressed and carries four controls on hover: its diff against the repository's checked-out branch, a shell started in it, the merge back, and the removal.`

DESIGN.md, a new decision entry after line 329:
`- 2026-09-17, Files and Repositories read as an explorer and a source control view. Both views draw rows through three primitives: \`ui/TreeItem.svelte\` (one row of one fixed height, an indent guide per level, a chevron on a row that opens, glyph, name, muted detail, and the row's controls beside the button, transparent until the row is hovered or holds the focus; a row given no press is text), \`ui/TreeSection.svelte\` (a heading row with its count over a list that is drawn while open) and \`ui/Breadcrumb.svelte\`. The Files view keeps \`expanded\`, \`selected: { root, path }\`, \`filter\` and \`collapsed\` in its instance state; the tree is one focus stop on the selected row, and \`treeMove\` in \`state/fs.ts\` answers Up, Down, Home, End, Right, Left and Enter. The filter walks every listing already read (\`heldEntries\` of the fs store asks the server for nothing) and draws a match under its folders, open; a folder never opened is not read for it. The workspace picker and the add-root control sit on the first root's head only, so each is on the page once, with a fallback toolbar when no root is drawn. The Repositories view shows one root of the \`git\` channel, \`shownRoot(roots, kept)\` in \`state/repositories.ts\`, the kept one while the channel carries it and the first otherwise, with \`root\` and \`collapsed\` in its instance state.`

DESIGN.md line 317: change "one section per repository:" to "one repository at a time through a picker:".

## Before and after
- **Files, top of the view.** Before: a pane toolbar with the workspace select, + root, save as, + bookmark and + note. After: no pane toolbar. There is a filter box and, once a row is selected, a breadcrumb. + root and the workspace select show on the first root's head on hover or focus; save as is on the Workspaces head, + bookmark on the Bookmarks head, + note on the Notes head.
- **Files, the tree.** Before: bordered ToolButtons indented by padding. After: flat 24px rows with indent guides and a rotating chevron. Rows highlight in `--chip` on hover and `--accent-bg` / `--accent-bg-txt` when selected. File rows gain a star (bookmark or un-bookmark) and an "open in a new tab" control. Root heads carry refresh, collapse all and, for added roots, remove.
- **Files, the lists.** Before: Bookmarks and Notes were drawn only when non-empty, and workspaces were only the select. After: Bookmarks, Notes and Workspaces are always-drawn collapsible sections with counts. The Workspaces rows are the configured roots plus each saved workspace; the one in force is highlighted and a press switches to it.
- **Repositories.** Before: every repository stacked, with bordered buttons. After: a picker menu at the top, then the branch line, path, busy and outcome lines, then four collapsible sections. A change row's name opens its diff and a worktree row opens its worktree diff; stage, unstage, discard, diff, switch, terminal, merge and remove are icon controls on hover. The create-branch and create-worktree lines stay at the end of their sections, and the planned path and the .gitignore warning are unchanged.
- **Catalog.** `repositories.log` now reads "Commits" (was "Recent commits"). New keys: `repositories.changes`, `repositories.switch_title`, and fifteen `files.*` keys: filter, filter_none, breadcrumb, refresh, collapse_all, row bookmark and open-tab words, bookmark_failed, workspaces, workspace_open_title.
- **Glyphs.** New names `chevron`, `collapse_all`, `folder_add`, `save`, `branch`, `merge`, `commit`, `worktree`, drawn with the icons chevron-right, chevrons-down-up, folder-plus, save, git-branch, git-merge, git-commit-horizontal and folder-tree.

## Files changed (paths under tools/oculus)
- **New:**
  - `src/lib/ui/TreeItem.svelte` 265
  - `src/lib/ui/TreeSection.svelte` 53
  - `src/lib/ui/Breadcrumb.svelte` 96
  - `src/lib/views/repositories/Changes.svelte` 191
  - `src/lib/views/repositories/Branches.svelte` 87
  - `tests/state/explorer.test.ts` 214
  - `tests/ui/tree.test.ts` 176
- **Modified (lines added / removed):**
  - `config/glyphs.yml` +16
  - `config/icons.yml` +8
  - `config/text/views/files.yml` +15
  - `config/text/views/repositories.yml` +4/-2
  - `src/lib/state/fs.svelte.ts` +11
  - `src/lib/state/fs.ts` +167 (377 lines)
  - `src/lib/state/repositories.ts` +37/-2
  - `src/lib/views/Files.svelte` (525 lines)
  - `src/lib/views/Repositories.svelte` (199)
  - `src/lib/views/files/Bookmarks.svelte` (85)
  - `src/lib/views/files/Notes.svelte` (96)
  - `src/lib/views/files/Tree.svelte` (273)
  - `src/lib/views/files/Workspaces.svelte` (66; now the section, and the picker is a Select inside Tree)
  - `src/lib/views/repositories/Repo.svelte` (191)
  - `src/lib/views/repositories/Worktrees.svelte` (161)
  - `tests/browser/files.spec.ts` +184
  - `tests/browser/repositories.spec.ts` +90
  - `tests/state/repositories.test.ts` +35
  - `tests/views/files.test.ts` +232/-?
  - `tests/views/repositories.test.ts` +150/-?
  - `tests/ui/wall.test.ts` +4
  - `tests/views/type-scale.test.ts` +11/-?
  - `git diff --stat` total: 22 files, +1599/-623

## Judgment calls the orchestrator may reverse
1. Two test files outside the brief's listed paths were edited: `tests/ui/wall.test.ts` gets SOLID entries for `TreeItem .item:hover` and `Breadcrumb .crumb:hover`, and `tests/views/type-scale.test.ts` gets entries for the new and changed view files. Both audits list every file, and a new file fails them without an entry.
2. The explorer tests live in a new `tests/state/explorer.test.ts`, because adding them to `tests/state/fs.test.ts` would have taken it to 1007 lines. `fs.test.ts` is byte-identical to main.
3. The workspace picker and + root are on the first root's head only. The brief lists them on "the root header", but on every head they would appear twice with two roots, which breaks `source.spec.ts`'s exact `getByRole('button', { name: '+ root' })` under Playwright strict mode. Save as moved to the Workspaces section head.
4. Folder rows carry no row controls. Notes are not files of a folder, so "new note" stays on the Notes head, which is where the view has it today.
5. The filter looks through every listing already read, including folders opened once and closed again, and draws the parents of a match open. It does not read folders never opened.
6. Refresh on a root head calls the fs store's `invalidate()`, which re-reads every held answer. `refresh(root, version)` is tied to a channel version and cannot be bumped from a click without breaking its ordering.
7. Pressing a change row opens its diff, and pressing a worktree row opens the worktree diff; before, only the diff control did. Commit rows are text, since the view has no commit action. The current branch row is drawn selected (`aria-current`).
8. Instance-state shapes: Files uses `{ expanded, selected: { root, path }, filter, collapsed: ['bookmarks'|'notes'|'workspaces'] }`. Repositories uses `{ root, collapsed: ['changes'|'staged'|'changed'|'untracked'|'log'|'branches'|'worktrees'] }`. Section open state is per view instance, not per repository.
9. New browser-facing selectors: `data-fs-workspaces`, `data-fs-workspace`, `data-repo-picker`, `data-changes`, `data-branch`, `data-commit`, `data-group="log"` and `data-group="branches"`. The hover case also selects the class `.actions`. Every existing selector still resolves: `data-fs-row` (first button is the row), `data-fs-bookmark(s)`, `data-fs-note(s)`, `data-root`, `data-group="changes"` and `"worktrees"`, and `data-entry`.
10. `{#key shown}` around Repo, so the branch and worktree names typed for one repository are cleared when switching to another.

## Limitations and sharp edges
- `views/repositories/Changes.svelte` repeats the status-letter tone map from `views/shared/ChangeGroups.svelte`, which is outside my paths. The session Changes panel keeps its card style.
- The workspace Select on the first head has no `tabindex` prop, so it stays its own tab stop even when that head does not hold the tree's stop.
- Row controls are transparent (`opacity: 0`), not removed, until hover or focus, so they stay in the accessibility tree and are clickable where they sit.
- Pressing Right twice before a folder's listing arrives does nothing on the second press. The browser cases wait for the listing between presses.
- While filtering, pressing a folder that is drawn open because it holds a match writes "closed" into `expanded`, and the filtered drawing does not change.
- `collapseRoot` matches by the `root:` prefix, so a root key that itself contains `:` could collapse another root's folders. This is the existing `treeKey` ambiguity, and it is not tested.
- Keyboard focus moves after `tick()` by querying the list's own `[data-fs-row]` elements. It is proven only in the browser case.
- I took no screenshot and did not look at the views on the TEST page. The look is proven only as far as the browser specs assert: opacity on hover, `aria-expanded`, `aria-current` and focus.


## Repair round

All fourteen repair items are done. One item comes with a condition: the change rows count and status-letter column share one partial, but that partial is a new file, `views/shared/ChangeCounts.svelte`, outside the paths the round listed. See decision 4.

## DONE / NOT DONE (all fourteen items)

| # | Item | State | Proof |
|---|---|---|---|
| 1 | Actions reachable in every state | DONE | `tests/views/files.test.ts`: "offers the workspace menu and the add-root control on its header while the roots are read"; "says why the two lists could not be read, and keeps both heads and their add controls". Both pass. |
| 2 | Density: 22px rows, 13px names, 11px heads; custom properties with fallbacks | DONE | Browser case "a row is 22 pixels at 13-pixel names under 11-pixel heads..." passes. Probe measured `{"h":22,"font":"13px"}`, head font `11px`. `TreeItem.svelte` reads `var(--tree-row, 22px)`, `var(--tree-indent, 12px)`, `var(--tree-font, calc(13px * var(--text-scale, 1)))` and `var(--tree-heading-font, calc(11px * ...))`, and declares none of them itself. |
| 3 | Selection and current | DONE | Selected row: ink on `--accent-bg`. The detail, count, arrow and mark of a selected row are also drawn in ink. Outline is on `.item:focus-visible, .item:has(:focus-visible)`. Workspace in force, checked-out branch and the bookmark being edited use `current`: bold name, check glyph, `aria-current`, no tint. Cases: tree.test "draws the row in force as a bold name with a check...", files.test workspaces case, repositories.test "draws the checked-out branch as in force...", browser 22-pixel case (colour and outline). |
| 4 | Tooltips on hover only | DONE | The Tooltip now sits inside the row button, so a keyboard focus never reaches it. Browser arrow-keys case asserts `[role="tooltip"]:not([hidden])` count 0 after arrow moves. |
| 5 | Heads | DONE | Root heads carry icon controls only: refresh, collapse all, remove. The workspace choice is an icon `Menu` in the view header (`views/files/Controls.svelte`) and stays as the Workspaces section rows. Removing a root goes through `Confirm`. Cases: files.test "draws icon controls alone on a root head"; browser "removing a root the reader added asks first, and a cancel keeps it"; browser "the workspace menu on the header lists the configured roots, drawn as in force". |
| 6 | Indent guides on tree hover or focus | DONE | Browser "the indent guides are drawn while the tree is hovered and not while it is left alone" passes. |
| 7 | Source Control rows | DONE | Status letter in an `end` column at the right edge. An empty Staged group is not drawn (`changeGroups`). Empty groups and sections draw a muted `TreeItem` row. Every count is in the right-edge `count` column. Branch and worktree forms are rows whose visible label is also the input's accessible name. Cases: repositories.test staged, fields and tree cases; state test `changeGroups`. |
| 8 | Picker: repositories only, same last folder told apart | DONE | `repositoryRoots` keeps roots with `error === null`; `repositoryLabels` uses the last folder, then the last two, then the full path. Browser case at repositories.spec.ts:119 makes two repos named `repo` plus a non-repo folder; the picker lists `<parent>/repo` twice, not the loose folder, and switches. |
| 9 | Filter and keyboard | DONE | `treeKeyRows(rows, filtering)` marks rows `fixed`. `rowMove` never toggles a fixed row. `toggle()` in `Files.svelte` writes nothing while filtering. Catalog: "Filter the folders already read by name" / "No folder read so far holds a name with that text." Browser cases for Left, Right and Enter under a filter each clear the filter and assert the folder is closed again. |
| 10 | Focus and ARIA | DONE | `ui/TreeView.svelte` gives `role="tree"` and one stop. Rows are `treeitem` with `aria-level`, `aria-expanded` and `aria-selected`. Mechanism under "How Tab reaches a row's controls". Browser "the tree is one stop from the filter box..." asserts the exact tab order; repositories "is one stop the arrow keys move along..." too. |
| 11 | Bookmark label | DONE | `markLabel`: the file name, or the path under the root when the name is already a label. Browser "a second file of the same name is bookmarked under its path from the row star": `README.md` and `sub/README.md`, both pressed, both listed. |
| 12 | One tone map, one counts partial; ChangeGroups head comment and `controls` prop | DONE | `statusStyle()` in `state/repositories.ts` and `views/shared/ChangeCounts.svelte` are used by both `Changes.svelte` and `ChangeGroups.svelte`. The ChangeGroups head comment is rewritten and its `controls` prop dropped. `tests/views/sessions.test.ts`: 58 passed. |
| 13 | False sentences | DONE | `Files.svelte` form comment, `files.yml:1`, Tree head comment and TreeItem head comment are rewritten. HELP.md and DESIGN.md are unedited; their exact lines are in Doc text below, including DESIGN.md:311. |
| 14 | Report states every visible change | DONE | "Before and after" below. |

## Verification
All run from `tools/oculus` in the worktree.
- `npx vitest run --reporter=dot`: `Test Files 236 passed (236)`, `Tests 3970 passed (3970)`. No timing test failed.
- `npm run check`: `COMPLETED 1180 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run build`: `built in 5.82s`
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: exit 0
- ASCII perl gate: prints nothing
- `find src tests bin -type f | xargs wc -l | sort -n | tail -3`: 970 `tests/state/layout.test.ts`, 979 `tests/state/board.test.ts`. Largest component: `Files.svelte` at 525, then `TreeItem.svelte` at 412.
- `npx playwright test tests/browser/files.spec.ts tests/browser/repositories.spec.ts tests/browser/search.spec.ts tests/browser/source.spec.ts tests/browser/open-file.spec.ts`: `46 passed (1.1m)`.
- Contrast of ink on `--accent-bg`, computed from `tokens.css` and `themes.css` for every class in `config/appearance.yml`: lowest 4.52 (rice solarized), light 12.68. Muted text on the tint fails (light 3.64), which is why a selected row's muted parts switch to ink. `tests/contrast.test.ts` does not measure this pair; the probe ran from the scratch folder.

## Reverts run (every one restored; `git status` shows only this round's files)

**Node, one revert per run**
- `tests/ui/tree-keys.test.ts`:
  - swap the ArrowDown/ArrowUp lines: the up/down case red.
  - Home focuses the last row: the Home/End case red.
  - Right on a closed row focuses instead of opening: the Right case and the fixed case red.
  - drop the Left close line: the Left case red.
  - drop the `fixed` tests: the fixed case red.
  - null from a row not drawn: its case red.
  - `stopOf` returns `wanted`: the stop case red.
- `tests/state/explorer.test.ts`:
  - `open: row.open` for files: the key-rows case red.
  - `fixed: false`: the fixed case red.
  - `markLabel` returns the name: the label case red.
- `tests/state/repositories.test.ts`:
  - `repositoryRoots` returns all roots: its case red.
  - labels by last folder only: the labels case red.
  - `changeGroups` keeps an empty staged group: the groups case and the key-rows case red.
  - `head()` always reports open: the key-rows case red.
  - `statusStyle` always grey: its case red.
- `tests/ui/tree.test.ts`:
  - drop `role` and `aria-level`: 2 cases red.
  - tabindex 0 whatever the stop: the stop case red.
  - `actions(0)`: the controls case red.
  - `depth + 1` guides: the guides case red.
  - span branch never taken: the text-row case red.
  - `class:selected={selected || current}`: the current case red.
  - count before the controls: the count case red.
  - TreeSection list drawn while closed: the section case red.
  - drop `role="tree"`: the tree case red.
  - breadcrumb marks the first segment current: the breadcrumb case red.
- `tests/views/files.test.ts`:
  - header toolbar only once workspaces arrive: the header case red.
  - `expanded` on file rows: the treeitem case red.
  - add-root control in `rootActions`: the icon-only case red.
  - `current={''}` in Tree: the selected-stop case red.
  - `stopOf` gives no stop: the first-row-stop case red.
  - Workspaces `selected` instead of `current`: the workspaces case red.
  - drop the empty Bookmarks row: the empty-heads case red.
  - bookmarks error as a paragraph instead of the section: the error case red.
- `tests/views/repositories.test.ts`:
  - picker over unfiltered `gitRoots()`: its case red.
  - last-folder labels: the labels case red.
  - staged group kept: the staged case red.
  - drop `role="tree"`: the tree case red.
  - Branches `selected` instead of `current`: 2 cases red.
  - field label `git.branch_new_label`: the fields case red.
  - picker label a fixed word: 2 cases red.

**Browser**
- `treeKeyRows` `fixed: false`: Left case red; Right and Enter stay green.
- `fixed: false` plus dropping the filtering guard in `toggle()`: Right case red.
- Filtering guard dropped alone: Enter case red; Right stays green.
- One build with ten reverts: hover rule dropped, guides always drawn, row height 24, removal without confirm, `markLabel` returns the name, Notes always open, menu `active: false`, picker unfiltered, Commits always open, breadcrumb selects the root line. Result: the breadcrumb, hover, guides, 22-pixel, removal, same-name bookmark, section, workspace menu, picker and Repositories section cases all red (10 failed). Each revert touches a different case, but in one build it is not proven which revert turned which case red.
- `rowMove` returns null: arrow-keys case red.
- TreeView tabindex 0 for every row: both one-stop cases red (files and repositories).
- `rows` instead of `shown`: filter-narrows case red.

## How Tab reaches a row's controls
Each treeitem `div` is the focus target. `ui/TreeView.svelte` hands every row `nav.tabindex(id)`: 0 for the stop, -1 for the rest. The row's inner button always carries `tabindex -1`. `ui/TreeItem.svelte` keeps `inside` state from `focusin` and `focusout`, where `relatedTarget` outside the row clears it, and passes `inside ? 0 : -1` to the caller's `actions(reach)` snippet. Every control uses that value as its `tabindex`.

So while the focus is on a row, that row's controls are the next Tab stops. Once the focus leaves the row they go back to -1, and a Tab from outside the tree lands only on the stop row.

Measured order from the filter box: breadcrumb segments, the selected row, its star, its new-tab control, the Bookmarks head, "+ bookmark", the Notes head.

## Decisions the orchestrator may reverse
1. "+ root" and the workspace `Menu` are icon controls on the Files view header (Pane toolbar), not on the first root head. That is the one place drawn while loading, on a read error and with no roots, and each control is drawn once. The workspace in force is no longer shown as text in the header; it shows as the bold, checked row in Workspaces and as the active menu item.
2. Each Files section (Bookmarks, Notes, Workspaces) is its own tree and focus stop; the roots are one tree. Repositories is one tree over all four sections. The branch and worktree inputs remain ordinary stops.
3. The treeitem `div` takes focus and Enter presses its inner button. The button stays in the DOM, so `open-file.spec.ts` and `source.spec.ts` (`[data-fs-row] getByRole('button').first()`) still resolve unchanged.
4. The counts partial is a new file, `src/lib/views/shared/ChangeCounts.svelte`. A snippet exported from ChangeGroups' module script failed lint (`no-unsafe-call`), and the round did not list this new file.
5. Catalog:
   - `files.yml` gains:
     - `bookmarks_empty`, `notes_empty`
     - `remove_root_confirm`, `remove_root_detail`
     - `workspace_glyph` (folder)
   - The `filter` and `filter_none` words are rewritten.
   - `repositories.yml` loses `error` (unreachable now) and `worktree_new_label` (the field's name is now `repositories.worktree_new`).
   - The branch field's name is now `git.branch_new`.
6. Commit rows and branch rows are focusable text treeitems. Their press does nothing; they exist so a branch's switch control is reachable by Tab.
7. A root whose git read failed for any reason (not only "not a repository") is left out of the picker.
8. While a filter is typed, a mouse press on a folder selects it and writes nothing into the open folders, as the keyboard does.
9. The 13px and 11px sizes are `calc(Npx * var(--text-scale, 1))` in the primitive, because `tokens.css` has no 13px or 11px token. Terminal palettes get the same sizes.
10. A selected row draws its detail, count, arrow and check in ink, since muted text on the tint measured below 4.5.

## Before and after (every visible change, including the reviewer's Behaviour list)
- **Row density.**
  - Before: 24px rows, 11.5px names, 10.5px heads.
  - After: 22px, 13px, 11px.
- **Selection.**
  - Before: accent tint with accent-coloured text; the outline stopped short of the controls.
  - After: accent tint with ink text; the outline is round the whole row.
- **In force.**
  - Before: the workspace in force, the checked-out branch and the bookmark being edited used the selection tint.
  - After: bold name, check glyph, `aria-current`.
- **Tooltip.**
  - Before: opened on keyboard focus and covered the next row.
  - After: opens only while the pointer rests on the row.
- **Root heads.**
  - Before: the first head held a Select, "+ root" and more.
  - After: every head carries icon refresh, collapse all and, on reader-added roots, remove. Remove now asks through a Confirm.
- **View header.**
  - Before: nothing.
  - After: workspace menu icon and "+ root" icon, drawn in every state.
- **Indent guides.**
  - Before: always drawn.
  - After: drawn while the tree is hovered or holds focus.
- **Bookmarks and Notes on a read error.**
  - Before: an error line replaced the section and "+ bookmark"/"+ note" disappeared.
  - After: head and control stay, and the error is one red row.
- **Empty Bookmarks and Notes.**
  - Before: a head with nothing under it.
  - After: a muted row, "No bookmark yet." / "No note yet."
- **Row star on a second file of the same name.**
  - Before: refused with "an entry with that label is already in the file".
  - After: bookmarked under its path under the root (`sub/README.md`).
- **Filter.**
  - Before: Left on a folder the filter held open trapped the focus and closed the real folder, and clearing the filter lost open folders.
  - After: Left goes to the parent, Right steps in or does nothing, Enter and a click only select, and clearing restores the open folders exactly. Folders never opened are still not searched; the words now say "folders already read".
- **ARIA.**
  - Before: a flat list of buttons.
  - After: `tree` with `treeitem`, `aria-level`, `aria-expanded` and `aria-selected`. Row controls are no longer Tab stops but are still announced (opacity 0, as before).
- **Repositories picker.**
  - Before: listed every root, including folders that are not repositories, named by last folder.
  - After: repositories only, with `parent/name` where two share a name.
- **Change groups.**
  - Before: Staged 0 and Untracked 0 drawn open and empty; counts beside the label; status letter inline after the counts.
  - After: empty Staged not drawn; an empty group shows a muted "nothing" row; group and section counts at the right edge; letter in the right-edge column.
- **Commit row.**
  - Before: glyph, subject, then hash and time inline.
  - After: glyph, subject, muted short hash, time at the right edge.
- **Branch and worktree forms.**
  - Before: bordered input with a placeholder and a bordered "create" button, 31px tall.
  - After: a row with a visible label ("New branch", "New worktree") that is also the input's name, a check-glyph create button, and the planned path and .gitignore warning as muted or amber rows.
- **Empty Commits, Branches, Worktrees.**
  - Before: sentences with hand-set 20px padding.
  - After: muted rows in the row geometry.
- **Repositories keyboard.**
  - Before: every row and head was a Tab stop.
  - After: one stop; arrows move; Right and Left open and close heads and groups; Tab from a row reaches its controls.

## Limitations and sharp edges
- Row controls are still hidden until hover or focus. On a touch screen they stay invisible but pressable.
- A row's tooltip no longer describes the row to a screen reader (no `aria-describedby`), because the Tooltip sits inside the button.
- Rows still span the full pane width in a wide pane, so the right-edge controls and counts sit far from the name.
- The picker is still a bordered `Menu` button.
- The Right-under-filter case turns red only when both the `fixed` flag and the view's filtering guard are reverted; each alone still keeps the folder closed.
- `TreeItem.svelte` still restyles `ToolButton`'s `.tool` class, left as ruled.

## Doc text
HELP.md line 85:
`| \`files\` | Files | The file browser over the hub, the engine config folder and the configured roots, read like an editor's explorer. The view's header carries the workspace menu and the add-root control. Under a filter over the folders already read and a breadcrumb naming the selected row sits one tree per root, each under a head with its refresh, collapse-all and (for a root you added) remove controls, then the Bookmarks, Notes and Workspaces sections. The tree is one Tab stop: the arrow keys move the selection, Right and Left open and close a folder, Enter opens a file, and Tab from a row reaches its controls. A scratch note's file is made by the first keystroke typed into it, and the delete control in the Notes list is the one thing that takes a note away. |`

HELP.md line 86:
`| \`repositories\` | Repositories | One repository at a time, picked at the top from the roots that are git repositories: its branch line, then Changes (staged when anything is, changed, untracked), Commits, Branches and Worktrees as sections with their counts. A change or worktree row opens its diff; each row's controls (diff, stage, unstage, discard, switch, terminal, merge back, remove) show on hover or when the row has the focus. The sections are one Tab stop moved along with the arrow keys. |`

HELP.md line 140, first two sentences:
`The Repositories view is over every root the file browser serves that is a git repository, the hub and the configured roots and whatever the current workspace added, plus the workspace of every session, one repository at a time through the picker at its top. What it shows is the pushed state of that repository: nothing is polled, and a commit made in a terminal moves it within two seconds.`

HELP.md line 144, first sentence:
`Each worktree row opens its diff when pressed and carries four controls, shown on hover or when the row has the focus: its diff against the repository's checked-out branch, a shell started in it, the merge back, and the removal.`

DESIGN.md line 311, first sentence:
`- 2026-09-15, the file browser's box and its scratch notes: the Files view asks \`ui/Pane.svelte\` for the tint, since its trees and its three sections draw straight into the box, and it renders \`shared/EntryForm.svelte\` with \`surface={false}\`, a variant of the one form component that keeps the border and the padding and paints no box, so the form is not a second translucent layer inside a tinted one.`

DESIGN.md line 317: replace "one section per repository:" with "one repository at a time through a picker over the roots that are git repositories:".

DESIGN.md, new entry after line 329:
`- 2026-09-17, Files and Repositories read as an explorer and a source control view. Rows are drawn by \`ui/TreeItem.svelte\`. A row is one fixed-height line holding an indent guide per level (shown while its tree is hovered or holds the focus), an expand arrow on a row that opens, glyph, name, muted detail, the row's controls (transparent until the row is hovered or holds the focus), and a count or mark at the right edge. Its height, indent and two type sizes are \`var(--tree-row, 22px)\`, \`var(--tree-indent, 12px)\`, \`var(--tree-font, 13px)\` and \`var(--tree-heading-font, 11px)\`, each scaled by the text scale, so an ancestor may set them. Selected is the reader's cursor, the accent tint under the ink; current is what is in force, a bold name with a check. A row's tooltip opens on pointer hover only. Rows sit in \`ui/TreeView.svelte\`, a \`tree\` that is one stop of the focus order: \`ui/tree-keys.ts\`'s \`rowMove\` answers Up, Down, Home, End, Right and Left, and a row marked \`fixed\` is stepped through and never opened or closed. Each row is a \`treeitem\` with its level that takes the focus, and Enter presses it. Its controls take tabindex 0 only while the focus is inside the row, so Tab from a row reaches them and Tab from outside does not. Sections are \`ui/TreeSection.svelte\`. The Files view's header carries the workspace menu and the add-root control, so both exist in every state. Its instance keeps \`expanded\`, \`selected: { root, path }\`, \`filter\` and \`collapsed\`. The filter walks every listing already read (\`heldEntries\` asks the server for nothing) and draws a match open under its folders, holding those folders \`fixed\` and writing nothing to \`expanded\`, so clearing it restores the tree. A row star bookmarks under the file's name, or under its path under the root when the name is already a label. Removing a root asks first. Repositories picks among the roots of the \`git\` channel whose state has no error, labelled by last folder or by the last two where two share it (\`repositoryRoots\`, \`repositoryLabels\`, \`shownRoot\`), and keeps \`root\` and \`collapsed\`. An empty staged group is not drawn, and a status letter's colour (\`statusStyle\`) and the line counts (\`shared/ChangeCounts.svelte\`) are shared with the session views' Changes panel.`

## Files changed (under tools/oculus), with line counts
- **Modified:**
  - `config/glyphs.yml` 279
  - `config/icons.yml` 147
  - `config/text/views/files.yml` 85
  - `config/text/views/repositories.yml` 44
  - `src/lib/state/fs.svelte.ts` 765
  - `src/lib/state/fs.ts` 367
  - `src/lib/state/repositories.ts` 203
  - `src/lib/views/Files.svelte` 525
  - `src/lib/views/Repositories.svelte` 202
  - `src/lib/views/files/Bookmarks.svelte` 122
  - `src/lib/views/files/Notes.svelte` 134
  - `src/lib/views/files/Tree.svelte` 244
  - `src/lib/views/files/Workspaces.svelte` 90
  - `src/lib/views/repositories/Repo.svelte` 222
  - `src/lib/views/repositories/Worktrees.svelte` 170
  - `src/lib/views/shared/ChangeGroups.svelte` 136
  - `tests/browser/files.spec.ts` 860
  - `tests/browser/repositories.spec.ts` 252
  - `tests/state/repositories.test.ts` 433
  - `tests/ui/wall.test.ts` 185
  - `tests/views/files.test.ts` 743
  - `tests/views/repositories.test.ts` 364
  - `tests/views/type-scale.test.ts` 238
- **New:**
  - `src/lib/ui/Breadcrumb.svelte` 96
  - `src/lib/ui/TreeItem.svelte` 412
  - `src/lib/ui/TreeSection.svelte` 69
  - `src/lib/ui/TreeView.svelte` 79
  - `src/lib/ui/tree-keys.ts` 69
  - `src/lib/views/files/Controls.svelte` 53
  - `src/lib/views/repositories/Branches.svelte` 101
  - `src/lib/views/repositories/Changes.svelte` 180
  - `src/lib/views/shared/ChangeCounts.svelte` 43
  - `tests/state/explorer.test.ts` 171
  - `tests/ui/tree-keys.test.ts` 77
  - `tests/ui/tree.test.ts` 245
- `git diff --stat` over tracked files: 23 files changed, 2395 insertions, 766 deletions.
- Scratch probes, screenshots and revert runners are under `scratchpad/q32-builder/`.
