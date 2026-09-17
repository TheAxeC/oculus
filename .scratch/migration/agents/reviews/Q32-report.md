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
