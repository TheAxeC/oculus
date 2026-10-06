# Step Q32 refuter report (on .agents/worktrees/q32, base 353f6ec5)

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


## Repair round 1, refuted
```
Round delta: diffed the worktree against the first reviewer's pre-round copy (scratchpad/q32-review/copy, src tests config). The round's changes outside the brief's paths are src/lib/views/shared/ChangeGroups.svelte (modified) and src/lib/views/shared/ChangeCounts.svelte (new). tests/ui/wall.test.ts did not change in the round (it changed in the first build). views/files/Controls.svelte, repositories/Branches.svelte and repositories/Changes.svelte are inside the brief's paths.
npx vitest run --reporter=dot: Test Files 236 passed (236), Tests 3970 passed (3970). No timing test failed.
npm run check: COMPLETED 1180 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run lint: exit 0, no output
npm run format:check: All matched files use Prettier code style!
ASCII perl gate: prints nothing, exit 0
npm run build: built in 4.00s
find src tests bin -type f | xargs wc -l | sort -n | tail -3: 970 tests/state/layout.test.ts, 979 tests/state/board.test.ts
npx playwright test files.spec.ts repositories.spec.ts search.spec.ts source.spec.ts open-file.spec.ts: 46 passed (1.3m). tests/browser/sessions.spec.ts does not exist, so it was dropped. No browser spec draws the session views' Changes panel.
Reverts, one per build, each run alone by -g in my clone (scratchpad/q32-review2/copy), every one restored, clone src identical to the worktree afterwards:
  drop .item:hover .actions: hover case 1 failed
  guides border var(--line) always: guides case 1 failed
  var(--tree-row, 24px): 22-pixel case 1 failed
  .item.selected color var(--accent): 22-pixel case 1 failed
  onremove calls remove(key) with no confirm: removal case 1 failed
  markLabel returns row.name: same-name bookmark case 1 failed
  Notes open={true}: section case 1 failed
  Controls active: false: workspace menu case 1 failed
  picker over gitRoots() unfiltered: picker case 1 failed
  Commits open={true}: Repositories section case 1 failed
  breadcrumb selects the root line: breadcrumb case 1 failed
  actions(-1): files one-stop case 1 failed; repositories one-stop case 1 failed
  actions(0): files one-stop case 1 failed
  TreeView tabindex 0 for every row: repositories one-stop case 1 failed
  treeKeyRows fixed: false: Left-under-filter case 1 failed
  toggle() without `if (filtering) return;`: Enter-under-filter case 1 failed
  Tooltip wrapped round the whole .item (tooltip on keyboard focus): arrow-keys case 1 failed (tooltip count Expected 0, Received 1)
Probe (scratchpad/q32-review2/copy/tests/browser/zz-review2.spec.ts, zz-scale.spec.ts), themes switched through the Theme menu:
  ink on --accent-bg for a selected row and a selected root head, every theme: lowest 4.52 (solarized), then 5.40 everforest, 5.71 latte; light 12.68. The builder's figure reproduces.
  picker with a repository with one commit and a `git init` repository with no commit added as roots: ["demo","oculus-review2-..."]; the no-commit repository is not listed.
  Tab from the picker: Changes head, New branch input, create, New worktree input, create, then out of the view.
  --text-scale 1.6: row 22px, name font 20.8px, line box 31.19px, .main scrollHeight 27 in a 22px box.
Screenshots (scratchpad/q32-review2/shots): light and vscode-dark-modern Files and Repositories at 1280x900 with a row hovered, Files and Repositories at 560px wide, the picker open, Files at text scale 1.6.
```
- src/lib/state/repositories.ts:91-96 with views/Repositories.svelte:63 (decision 7, the picker keeps roots whose `error === null`), Behaviour. `server/git.ts:101` sets `error` when `git rev-parse --abbrev-ref HEAD` fails, and it fails on a repository with no commit yet (git 2.49: "fatal: ambiguous argument 'HEAD'", exit 128). It also sets `error` when `git status` fails or goes past the 5 s TIMEOUT_MS (`git.ts:115`). The probe confirms a `git init` root is missing from the picker. Before the round such a root was a picker entry with the `repositories.error` line. Now nothing in the view says it exists. If a shown repository's read fails on one push, the view jumps to the first repository and comes back on the next push (`shownRoot` does not write back). The report states the filter but not these cases. The Doc text for HELP.md line 140 ("the roots ... that is a git repository") is false for a repository with no commit. The first-build test that covered the error line (`tests/views/repositories.test.ts` "draws the error of a root git could not read") was deleted, and no test covers a repository with no commit.
- src/lib/ui/TreeItem.svelte:219, 245, 285 against :223, 374 (ruling 2, density), Behaviour and Standards. The row height and the indent are fixed at 22px and 12px. The two font sizes are multiplied by `--text-scale`. At the maximum scale of 1.6 (`state/ui.svelte.ts:291`), the probe measured a 31px line inside a 22px row. Hover and selection paint 22px of the line, and neighbouring line boxes overlap by 9px (screenshot light-files-scale16.png). The Doc text for the DESIGN.md entry says "Its height, indent and two type sizes are ... each scaled by the text scale", which is false for height and indent. No case runs above scale 1.
- src/lib/ui/TreeItem.svelte:230-232, 349-355 (ruling 3, ink on the tint), Proof. The contrast rests on a scratch probe; the suite checks nothing. `themes/derive.ts` makes `--ink-txt` readable on chip, card, panel and bg (`derive.ts:219`), not on `--accent-bg`. The token derived for text on that surface is `--on-accent-bg` (`:217`), and `--accent-bg-txt` for accent text on it. Solarized passes at 4.52 by chance. A theme added later can fall under 4.5 and no test turns red. The builder named this gap himself.
- src/lib/views/repositories/Changes.svelte:99 (ruling 7, Source Control rows), Behaviour. A change row's treeitem and button are named `nameOf(entry.path)` alone. The folder, the line counts and the status letter are not in the accessible name. Two changed files `a/README.md` and `b/README.md` are announced the same, and neither says whether it is modified, added or deleted. The report does not state this.
- src/lib/ui/TreeItem.svelte:226-228 (look), Behaviour. `.item:hover` also tints rows with nothing to press: "No bookmark yet.", "nothing", "This repository has no worktree beside itself.", the .gitignore warning and the planned-path row. In light-files-narrow.png the empty Bookmarks row is drawn hovered. VS Code highlights nothing on a message row. The row tooltip opens on hover only, as ruled, but it still covers the row below while the pointer rests (light-files-hover.png covers the next root head; light-repos-hover.png covers the Untracked group).
- src/lib/views/files/Controls.svelte:26-31 and views/files/Workspaces.svelte:33, 40-42 (ruling 5), Standards (DRY, spec.md principles). The same list, the configured roots first under `files.workspace_default` and then the named workspaces with the empty name filtered out, is built in both partials.
- src/lib/ui/tree-keys.ts:41, Standards. One comment line in a block hard-wrapped at 100 columns runs to about 160 ("presses its button (ui/TreeItem.svelte). From a row that is not drawn, ... A key the tree does").
- views/shared/ChangeGroups.svelte and views/shared/ChangeCounts.svelte (ruling 12, reach beyond the paths), Spec. The round went outside its paths only in these two files, both as named in the report. The styles moved to ChangeCounts.svelte are byte-identical to those removed from ChangeGroups (`.bin`, `.add`, `.del`), and the spans still sit directly in `.file`. `tests/views/sessions.test.ts` and `type-scale.test.ts` pass. No browser run draws the session Changes panel, so its look after the move was read, not seen.
- Closures checked and found as claimed: items 1, 4, 5, 6, 8, 9, 10, 11 and 13. No check was weakened. The removed tests were replaced by cases over the new mechanism (`treeMove` became `rowMove` in `ui/tree-keys.ts` with its own tests; `repositoryName` became `repositoryLabels`). `grep -rn "treeMove\|repositoryName\|repositories.error\|worktree_new_label\|letterStyle"` over src, tests, config, HELP.md, DESIGN.md and README.md finds nothing left. The `git.branch_new_label` key that remains is used by `sessions/ChangesRepo.svelte` and `Deposit.svelte`.

Reviewer usage: about 50 tool uses, about 26 minutes (12:41 to 13:07 CEST).

## Closed

- The picker leaves out a repository with no commit, or one whose read failed (`state/repositories.ts` `repositoryRoots`, `server/git.ts` line 101): booked in the state file's open items. The cause is the git reader, a server module outside the step's paths, which reads a repository with no commit as an error; the fix belongs there.
- Row height and indent at a larger text size: `ui/TreeItem.svelte` scales `--tree-row` and `--tree-indent`'s fallbacks by `--text-scale` as it does the two type sizes; `tests/browser/files.spec.ts`'s 22-pixel case now also sets `--text-scale: 1.6` on the tree and checks a 35.2 px row holding its line and a 19.2 px indent (red under the unscaled height: expected 35.2, received 22).
- Ink on the tint unproven: a selected row draws its whole line in `--on-accent-bg`, the token `themes/derive.ts` derives for text on `--accent-bg`, and `tests/contrast.test.ts` measures that pair under every theme; the browser case checks the selected name's colour against that token.
- A change row's accessible name: the row and its button are named by the path and the status word (`repositories.change_name`, `statusWordKey` over `repositories.status_*`); `tests/views/repositories.test.ts` checks `code/one.py, modified` (red with the name removed) and `tests/state/repositories.test.ts` the words.
- Hover on rows with nothing to press: a row drawn with a `tone` (the empty and warning rows) takes no hover tint; `tests/ui/wall.test.ts`'s surface list follows the selector. No browser case: the empty rows the served demo hub draws depend on its bookmarks and notes; read, not seen. The tooltip covering the next row while the pointer rests stays as ruled (hover only).
- The workspace list in two partials: `workspaceChoices` in `state/fs.ts`, used by `views/files/Controls.svelte` and `Workspaces.svelte`, with its case in `tests/state/explorer.test.ts`.
- `ui/tree-keys.ts`'s long comment line rewrapped.
- `views/shared/ChangeGroups.svelte` and `ChangeCounts.svelte` outside the round's paths: kept, as the report named them; the session views' Changes panel is looked at on the TEST page at landing.

After the fixes, in the worktree: `npx vitest run tests/state tests/views tests/ui tests/contrast.test.ts tests/integrity.test.ts` 2,074 passed; `npm run check` 0 errors; `npm run lint`; `npm run build`; `npx playwright test tests/browser/files.spec.ts tests/browser/repositories.spec.ts` 29 passed.
