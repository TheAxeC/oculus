Everything in the brief is done. Two things need your ruling: the brief's badge colour pair fails the contrast floor in 13 of 17 themes, so the badge uses a pair that passes; and four files outside the brief's path list were written because the work needs them (section 6, items 1 to 4).

# X3d report: the Repositories view and the diff as VS Code's Source Control

Worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/X3d`, oculus at `tools/oculus`. Base 4fe6ce93, unchanged copy at `.agents/worktrees/X3d-base`.

## 2. Open items of the state file (verbatim, `.scratch/migration/orchestrator-state.md` lines 88 to 94)

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z93, the design of apps added while oculus runs: 31 choices (raised 2026-09-30 at E1's landing). The section is in `tools/oculus/DESIGN.md` as an unbuilt proposal whose text holds the recommended option of each choice; nothing is built and no build step is booked until Axel rules. The choices in full, each with its options, what speaks for and against each, the recommendation and the lazy option, are `agents/reviews/E1-choices.md`, which every report prints whole. They are C1 the folder, C2 the manifest, C3 the view id, C21 reserved names, C22 a folder without `app.yml`, C23 a manifest asking for a closed item, C4 the address, C5 the cross-origin header, C6 the sandbox, C7 the frame policy and the manuals' outside links, C24 the bridge's client file, C27 the Electron window, C30 an app's page in the Document view, C8 the channels, C28 coauthors' commit text, C25 the list of apps, C10 the title and glyph, C31 the glyph names, C11 state, C9 the write kinds and the bookmarks, C16 enforcing the kinds, C17 asking the reader, C18 the limits, C26 the refusal words, C15 the method names, C13 what an approval covers, C14 where approvals are kept, C29 what stops an app sending data out, C19 where apps sit, C12 a removed app's tabs, C20 keys inside an app. Recommendation: every choice as its file line recommends, which is what the section says now; the lazy option of each is named there. Blocks only E1's build step, which does not exist yet.
- Z94, the Settings editor's four shapes (raised 2026-09-30 at /spec S3; S3 is stopped until ruled). Z75 (a) and Z77 (a) fix that the Settings view becomes VS Code's Settings editor over every option from one catalog under `config/catalogs/`; they do not fix the four shapes below, each of which a reader of the config or of the view sees. The tree: the five tracked files hold 66 top-level keys and 249 key paths when a list counts as one value (appearance 6 and 14, behavior 31 and 64, layout 13 and 101, present 1 and 55, sources 15 and 15; counted with `yaml.safe_load` over each file); the Settings view today is `views/system/workbench/Settings.svelte` with `Appearance.svelte`, `RailEditor.svelte` and `PagesReset.svelte`; the only config writes are the rail list, the audit mute list and the deck's lists (`server/edit/writes.ts:109-120`, `deck-edit.ts`); `local.yml`'s keys are `LOCAL_KEYS` (`data/sources/config/local.ts:91`). (1) What one option is. (a) every key path, a list being one option: 249 entries, and `arrangements.<page>.<field>` or `deck.<key>` each get a row, so the editor is long and exact. (b) every top-level key: 66 entries, and `slurm`, `calendar`, `wallpaper` and the like are one row each whose description has to explain every key inside. (c) every key path, except that a family of records of one shape (`themes`, `arrangements`, `collections`, `usage_tiers`, the deck's lists) is one option whose entry describes the record's fields once. Recommended (c): each scalar a reader sets is found by its own name, and a family is explained once instead of once per member. Lazy: (b). (2) The catalog's file and entry. (a) one file `config/catalogs/options.yml`, a map of config file name to a map of dotted key path to `{ description, default, section?, control?, values? }`, `control` one of `toggle`, `number`, `text`, `choice`, `list`, and `values` the choices of a `choice`. (b) one file per config file under `config/catalogs/options/` with the same entries: five shorter files, and a search of descriptions reads five files. (c) the descriptions kept as the YAML comments they are today and parsed out: no second place to write, but a comment is free text with no default or control in it. Recommended (a): Z75 says one catalog, and Z77's check reads one file. Lazy: (c). (3) What Default and Modified mean. (a) the catalog entry holds the default, and Modified is a value in the file that differs from it; the default of a key is then a fact of oculus, the same on every machine. (b) the default is the value at git's HEAD and Modified is an uncommitted change: nothing to write in the catalog, and it says nothing about what the option is set to against oculus's own default. (c) the default is what the code falls back to when the key is absent: only some keys have one, the rest would show none. Recommended (a), and Z77's check then also fails on an entry with no `default`. Lazy: (b). (4) Which options get a control. (a) only what has one today: the appearance values kept per browser and the rail list; every other option shows its value and a control that opens its file at its line. (b) every `toggle`, `number`, `text` and `choice` option gets a control that writes that one key into its config file, comments kept, through one new confirmed write kind `config-key` (`{ file, key, value }`, refused for `local.yml`, for a key with no catalog entry and for a value its `control` does not allow), recorded in the History view and undoable; a `list` or a family opens its file at its line. (c) as (b) without the History record. Recommended (b): an editor that cannot change an option is a list, and the write goes through the chain every other write uses. Lazy: (a). Answer as `Z94 (1) (c), (2) (a), (3) (a), (4) (b)` or "as recommended".
- Z95, floating panes: three shapes (raised 2026-09-30 at /spec L4; L4 is stopped until ruled). Ruled already: any pane can float over the page with an orange border, on top and still there when the rail switches pages, docked it keeps the border and shows on every page (answer 10, `agents/reviews/axel-2026-09-21.md:63`); the move and resize run on `interactjs` (LA18); Live HPC and Usage are the first floats (Z1); a float's state stands alone so it can move to its own window (Z3). The tree: a page is one tree of splits, panes and page leaves (`state/workbench/layout/model.ts`), saved per browser under `oculus.layout.v1` (`layout/saved/storage.ts`); the Focus arrangement holds Live HPC and Usage as one pane of two tabs (`config/layout.yml:53`); the pane strip's menu holds Open File, the four splits, Close and New Terminal (`shell/panes/pane-view.ts:121-131`); nothing on main floats a pane (`grep -rni float src/lib/shell src/lib/state/workbench` finds two CSS comments, on the Update tray and the palette, and no code). (1) What docked is. (a) a float dragged to the window's left, right or bottom edge becomes a strip along that edge, outside every page's tree, drawn beside whichever page is on screen, resized by a sash, with the orange border; (b) docked is a float dropped into one page's tree, which then shows that pane on the other pages too by putting a copy of the spot in each: every page's arrangement changes when one pane docks; (c) no docking in L4, a float only floats, and docking is a later step. Recommended (a): it is the only reading in which a docked pane is on every page without rewriting every page. Lazy: (c). (2) How a pane floats and comes back. (a) a Float item in the pane strip's right-click menu and in the pane's menu, and a tab dragged off every pane onto the page's middle with Alt held floats on drop; the float's own strip menu holds Dock Left, Dock Right, Dock Bottom and Return to Page, which puts it back in the page on screen as a split of its largest pane; (b) the menu items alone, no drag; (c) a float button on every pane's strip beside the menu. Recommended (a): the menu is where the splits already are, and the drag is how every other pane move is made. Lazy: (b). (3) Where floats are kept and how the first ones are named. (a) the saved layout gains `floats:`, a list beside the pages, each `{ pane, x, y, w, h }` in fractions of the window as split sizes are, or `{ pane, dock: left | right | bottom, size }`; `config/layout.yml` gains a top-level `floats:` list in the same shape with `view:` in place of the pane, which a first load and Reset all pages read; its first entry is `{ view: [hpc, usage], dock: right, size: 0.3 }`, and the Focus arrangement loses its Live HPC and Usage pane; (b) the saved layout alone, no config key: Live HPC and Usage are floated by hand on each browser, and Reset all pages closes every float; (c) as (a) with the first entry floating at the lower right instead of docked. Recommended (a): Z1 names the first floats, so they have to be written somewhere a fresh browser reads, and docked right is where the Focus page has them today. Lazy: (b). Decided in the brief, not asked: the border is a new token `--float-border`, `--c-orange` by default and set by every theme; a float is kept inside the window when the window shrinks; Escape and the keyboard reach a float as they reach a pane. Answer as `Z95 (1) (a), (2) (a), (3) (a)` or "as recommended".

Raised by this step, for your ruling (both with the lazy option named):

- Badge colour pair. The brief says `background: var(--muted)`, `color: var(--c-on)`. Measured over the 17 themes the picker offers, that pair is below the 4.5:1 floor in 13 of them (dark 2.56, vscode-dark-modern 2.71, solarized 2.79, tokyonight 2.91, kanagawa 3.33, dracula 3.36, rosepine 3.42, latte 3.49, tokyoneon 3.88, nord 4.19, everforest 4.24, gruvboxlight 4.29, gruvbox 4.47). The built pair is `background: var(--line)`, `color: var(--on-line)` (`--on-line` is derived black or white, `themes/derive.ts:88`), at least 8.63 in every theme. Options: (a) keep the built pair (recommended; reads in every theme, same hue family as the row); (b) the brief's pair, below the floor in the 13 themes above; (c) a new derived token. The lazy option is (b): it follows the text without checking it. The same applies to the separator of the joined button, which the brief words as `--c-on` at 40% and the build draws in `--on-accent` at 40%, the colour of the button's own words (`ToolButton.svelte:393`).
- Four paths outside the brief's list (section 6, items 1 to 4). Each is needed by a brief item. Recommended: accept them. The lazy option would have been to leave the commit box's dropdown unstyled, the Push wiring of the session panel dangling, and the tree check pointing at a file that no longer holds the literals.

## 3. The cases on the unchanged tree (base 4fe6ce93, tests copied into X3d-base, run with `npx vitest run ...` there)

Each case is a test in the form it has after its last change, run on the unchanged tree and on the finished tree. "FAIL" quotes the first line of the assertion error on the unchanged tree; "fails to load" quotes the error that stops the whole file there (the module or component the test renders does not exist on the unchanged tree). A case whose rule is wrong under the brief: none; every case ran as written.

Finished tree: the same files print 690 passed of 690, 0 failed. Unchanged tree: 627 tests listed, 471 passed, 156 failed (the failures are the new behaviour, plus the files that fail to load, whose tests are not listed).

Cases 15 (second half) and 25 are audits by the brief. Every test named "audits" that passes on the unchanged tree tests a rule the change keeps: a count without `badge` drawn as plain text (`tree.test.ts`), the terminal form of `TextArea` (`text-area.test.ts`), and the two branch-state sentence audits (`sessions/changes.test.ts`). Each other test that passes on the unchanged tree tests behaviour the change preserves and is counted in section 3a.

### 3a. Tests of the changed and new files that pass on the unchanged tree (behaviour the change preserves)

- `tests/checks/source/keys.test.ts`: 7 pass on both trees
- `tests/state/sources/repositories/diff-view.test.ts`: 2 pass on both trees
- `tests/state/sources/repositories/graph.test.ts`: 3 pass on both trees
- `tests/state/sources/repositories/repositories.test.ts`: 45 pass on both trees
- `tests/state/sources/repositories/view-state.test.ts`: 1 pass on both trees
- `tests/ui/forms/text-area.test.ts`: 2 pass on both trees
- `tests/ui/menu/menu-opener.test.ts`: 1 pass on both trees
- `tests/ui/tree/tree.test.ts`: 15 pass on both trees
- `tests/views/sessions/changes.test.ts`: 21 pass on both trees
- `tests/views/sources/repositories/change-rows.test.ts`: 4 pass on both trees
- `tests/views/sources/repositories/diff-pane.test.ts`: 2 pass on both trees
- `tests/views/sources/repositories/repo-row.test.ts`: 5 pass on both trees
- `tests/views/sources/repositories/repositories.test.ts`: 35 pass on both trees

(Files not listed here were not changed: diff, file-git, hunks-git and merge state tests and repositories-menu.test.ts pass on both trees unchanged. `type-scale.test.ts`: 259 tests, 12 fail on the unchanged tree because the new components are not in its audit lists: shared/changes/CommitBox.svelte, sources/repositories/changes/ChangeRow.svelte, sources/repositories/changes/Changes.svelte, sources/repositories/changes/FolderRow.svelte, sources/repositories/diff/DiffBar.svelte, sources/repositories/diff/FileHeader.svelte, sources/repositories/graph/CommitRow.svelte, sources/repositories/graph/GraphHead.svelte, src/lib/ui/tree/TreeActions.svelte, src/lib/ui/tree/TreeItem.svelte, the view type scale audits that every ui component is listed in the pass-through audit, the view type scale lists every view file in the audit.)
## 4. DONE / NOT DONE

NOT DONE: nothing inside the brief. Not done by design, because the brief assigns it elsewhere: the look side by side with VS Code on TEST (the landing's; this step opened no browser and added no browser test).

Verification commands, all run from `tools/oculus` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, once at the end:

```
$ npm run diagrams            -> ... docs/diagrams/writes.svg / diagrams exit 0
$ sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md
$ npm test
 Test Files  360 passed | 19 skipped (379)
      Tests  5516 passed | 557 skipped (6073)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790791513275 COMPLETED 2399 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
Checking formatting...
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
checks exit 0
```

| # | Item of "What to build" | State | Proof (command and where) |
|---|---|---|---|
| 1 | Tokens | DONE | `themes/tokens.css:151-159`: `--tree-badge-size: 18px`, `--tree-badge-font: 11px`, `--graph-lane: 11px`, `--button-line: 16px`, `--button-font: 12px`, `--input-radius: 4px`. Every rule that reads a pre-scale token multiplies it by `var(--text-scale, 1)`; `tests/views/whole/type-scale.test.ts` (259 tests) passes. Literals left: section 7. |
| 2 | Section heads | DONE | `TreeItem.svelte:508-516` uppercase, weight 700, `--tree-heading-font`, ink colour; `tests/ui/tree/tree.test.ts` "draws a heading row in capitals, not small capitals, at weight 700 in the ink" fails on the unchanged tree, passes now. Shared with every heading row. |
| 3 | TreeItem props | DONE | `badge`, `countTitle`, `trailing`, `strong` and `--row-bg` in `TreeItem.svelte`; tests in `tests/ui/tree/tree.test.ts` (9 of them fail on the unchanged tree, section 3). The badge colour pair departs from the brief (section 2). Four props besides the four named: section 6, item 8. |
| 4 | Primitives | DONE | `ToolButton` `primary` and `joined` (`:359-394`), `TextArea` `size` and `grow` (`:128-138`), `MenuOpener` `primary` (`:151-163`); `tests/ui/controls/tool-button.test.ts`, `tests/ui/forms/text-area.test.ts`, `tests/ui/menu/menu-opener.test.ts`. Sizes at text scale. |
| 5 | Repository row | DONE | `RepoList.svelte:126-200`; `tests/views/sources/repositories/repo-row.test.ts` (25 tests; 20 fail on the unchanged tree). Each control has 4px on its left and a 16px line at `TreeActions.svelte:46-52`. |
| 6 | Repo.svelte | DONE | branch and path lines only for a non-readable state (`Repo.svelte`, test "draws neither the branch line nor the path line"); commit box held 11px and 12px in at `Repo.svelte:270`. |
| 7 | Commit box | DONE | `CommitBox.svelte`, `messageRows` (`repositories.ts:694`), `actionButton` (`repositories.ts:715`); `tests/state/sources/repositories/commit-action.test.ts`, `tests/views/sources/repositories/commit-box.test.ts`, `tests/views/sessions/changes.test.ts`. The session panel draws no Push button. |
| 8 | Change groups and rows | DONE | `changes/{Changes,ChangeRow,FolderRow}.svelte`, `DiffSubject.group`, `stagePaths`/`unstagePaths`/`discardPaths`; `tests/views/sources/repositories/change-rows.test.ts`, `diff-pane.test.ts`, `tests/state/sources/repositories/view-state.test.ts`. |
| 9 | List and tree | DONE | `state/sources/repositories/change-tree.ts`, `Repositories.svelte:289-305` (the toggle, drawn in every state), `CommitFiles.svelte` folders; `tests/state/sources/repositories/change-tree.test.ts` (19), `tests/views/sources/repositories/tree-mode.test.ts` (20). A folder closing over the focused row takes the focus: tested for the change groups (`tree-mode.test.ts`, three cases; fails when the `nav.focus(id)` call in `Changes.svelte:122` is taken out), and for a graph commit's files by the pure rule only (`change-tree.test.ts`), since those files are read by an effect that a server render never runs. |
| 10 | Lanes | DONE | `graph-lanes.ts:89-190` (`laneX`, `laneWidth`, `lanePaths`, `lanesBelow`, `commitCircles`); `tests/state/sources/repositories/graph.test.ts`. |
| 11 | Graph row | DONE | `graph/CommitRow.svelte`, `graph/GraphHead.svelte`, `Graph.svelte`; head actions drawn while the section is open; `tests/views/sources/repositories/graph-row.test.ts` (24). |
| 12 | Diff pane | DONE | `diff/DiffBar.svelte`, `diff/FileHeader.svelte`, `DiffSection.svelte`, `Diff.svelte`, `DiffView.unchanged/folded`; `tests/views/sources/repositories/diff-pane.test.ts`, `tests/state/sources/repositories/view-state.test.ts`, `diff-view.test.ts`. |
| 13 | Words | DONE | `config/text/views/sources/repositories.yml`, `config/text/views/sessions/changes.yml`; `tests/checks/source/keys.test.ts` passes (a reader for every key, a literal at every read). |
| 14 | Docs | DONE | `DESIGN.md` (the view, the tree row, the graph head, the commit box insets), `HELP.md` lines 112, 130, 176, 180, 198; `LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md` prints nothing. Head comments of the changed components are corrected. |

Stale-name grep, run from `tools/oculus` over `src tests config HELP.md DESIGN.md README.md` for the removed catalog keys and glyphs (`commit_title` of the old wording, `diff_side`, `list_sync`, `push_pending`, `push_title`, `side_by_side`, `inline_diff`): every remaining hit is a live key (`git.commit_title`, `repositories.commit_title`, `repositories.diff_inline`, `deposit.push_title`) or the test that asserts `repositories.diff_side` is gone.

Verify 3: the pixel literals left. The raw list is `grep -rn "px" src/lib/views/sources/repositories src/lib/views/shared/changes/CommitBox.svelte` (47 lines). Sorted by the rule of item 1 they fall under:

- Literal in the element's own rule, a measure VS Code gives once for that element: `Repo.svelte:270` `padding: 0 12px 0 11px` (the message box and button insets); `CommitBox.svelte:236` `border: 1px solid` (box border), `:252` `padding: 3px 0 3px 6px` (field), `:258` `padding: 1px 3px 1px 1px` (box toolbar), `:228` `gap: 4px`, `:270` `gap: 2px` and `:271` `margin-left: 4px` (button row); `CommitRow.svelte:170` `margin-left: 4px`, `:171` `padding: 0 4px`, `:172` `border: 1px solid`, `:173` `border-radius: 10px`, `:177` `line-height: calc(18px * ...)`, `:191` `max-width: calc(100px * ...)` (the pill); `ChangeRow.svelte:206` `margin-left: 5px` (status letter), `:196-197` `gap: 4px` and `margin-left: 4px` (line counts); `FileHeader.svelte:78` `gap: 4px`; `RepoList.svelte:218-219` `gap: 1px` and `margin-left: 4px` (the behind and ahead counts of the Sync control).
- Literal that a single-element rule of the view already had and this step did not change: `Repositories.svelte:394` `gap: 6px`; `Repo.svelte:264,276,314` `gap: 6px`; `merge/Merge.svelte:273,284,298,304`; `merge/MergeSide.svelte:124,133,141-143`; `diff/DiffSection.svelte:154,344,356-358`; `diff/Diff.svelte:504,511,516-517,527`; `diff/FileHeader.svelte` none else. These are unchanged lines (the comparison of the base list and the finished list prints only the lines named in the first bullet as new).
- Pixel numbers in comments: `CommitFiles.svelte` (the 3 px lane), `Lanes.svelte` (3 px and 1 px), `CommitRow.svelte` (comment of the pill), `Repo.svelte` (comment of the insets).
- Sizes that more than one rule reads are tokens, not literals: badge size and font, button line and font, graph lane, input radius.


## 5. Files and line counts (finished tree; "was" is the base)

```
 183 config/catalogs/glyphs.yml (was 180)
 182 config/catalogs/icons.yml (was 179)
 80 config/text/views/sessions/changes.yml (was 80)
 232 config/text/views/sources/repositories.yml (was 220)
removed (moved): src/lib/views/sources/repositories/Changes.svelte
 402 DESIGN.md (was 402)
 300 HELP.md (was 300)
 154 src/lib/state/sources/repositories/change-tree.ts (new)
 194 src/lib/state/sources/repositories/graph-lanes.ts (was 75)
 378 src/lib/state/sources/repositories/repositories.svelte.ts (was 364)
 756 src/lib/state/sources/repositories/repositories.ts (was 577)
 177 src/lib/themes/tokens.css (was 164)
 508 src/lib/ui/controls/ToolButton.svelte (was 448)
 161 src/lib/ui/forms/TextArea.svelte (was 126)
 167 src/lib/ui/menu/Menu.svelte (was 163)
 237 src/lib/ui/menu/MenuOpener.svelte (was 208)
 81 src/lib/ui/tree/TreeActions.svelte (new)
 516 src/lib/ui/tree/TreeItem.svelte (was 463)
 94 src/lib/ui/tree/TreeSection.svelte (was 86)
 253 src/lib/views/sessions/changes/Changes.svelte (was 268)
 153 src/lib/views/sessions/changes/ChangesRepo.svelte (was 181)
 244 src/lib/views/shared/changes/ChangeGroups.svelte (was 240)
 273 src/lib/views/shared/changes/CommitBox.svelte (was 179)
 295 src/lib/views/sources/repositories/changes/Changes.svelte (new)
 214 src/lib/views/sources/repositories/changes/ChangeRow.svelte (new)
 112 src/lib/views/sources/repositories/changes/FolderRow.svelte (new)
 535 src/lib/views/sources/repositories/diff/Diff.svelte (was 505)
 100 src/lib/views/sources/repositories/diff/DiffBar.svelte (new)
 376 src/lib/views/sources/repositories/diff/DiffSection.svelte (was 344)
 129 src/lib/views/sources/repositories/diff/FileHeader.svelte (new)
 215 src/lib/views/sources/repositories/graph/CommitFiles.svelte (was 107)
 196 src/lib/views/sources/repositories/graph/CommitRow.svelte (new)
 430 src/lib/views/sources/repositories/graph/Graph.svelte (was 447)
 63 src/lib/views/sources/repositories/graph/GraphHead.svelte (new)
 93 src/lib/views/sources/repositories/graph/Lanes.svelte (was 69)
 172 src/lib/views/sources/repositories/menus/change-menu.ts (was 120)
 129 src/lib/views/sources/repositories/refs/Branches.svelte (was 113)
 99 src/lib/views/sources/repositories/refs/Stashes.svelte (was 98)
 83 src/lib/views/sources/repositories/refs/Tags.svelte (was 82)
 322 src/lib/views/sources/repositories/Repo.svelte (was 294)
 235 src/lib/views/sources/repositories/RepoList.svelte (was 140)
 401 src/lib/views/sources/repositories/Repositories.svelte (was 365)
 195 src/lib/views/sources/repositories/Worktrees.svelte (was 194)
docs/diagrams/ (8 files: channels, layer-state, layer-views, layers, each .dot and .svg), regenerated by npm run diagrams

tests changed or new:
471 tests/checks/source/keys.test.ts
259 tests/state/sources/repositories/change-tree.test.ts
98 tests/state/sources/repositories/commit-action.test.ts
207 tests/state/sources/repositories/view-state.test.ts
112 tests/state/sources/repositories/diff-view.test.ts
193 tests/state/sources/repositories/graph.test.ts
894 tests/state/sources/repositories/repositories.test.ts
102 tests/ui/controls/tool-button.test.ts
70 tests/ui/forms/text-area.test.ts
63 tests/ui/menu/menu-opener.test.ts
436 tests/ui/tree/tree.test.ts
413 tests/views/sessions/changes.test.ts
313 tests/views/sources/repositories/change-rows.test.ts
264 tests/views/sources/repositories/commit-box.test.ts
319 tests/views/sources/repositories/diff-pane.test.ts
438 tests/views/sources/repositories/graph-row.test.ts
369 tests/views/sources/repositories/repo-row.test.ts
331 tests/views/sources/repositories/tree-mode.test.ts
756 tests/views/sources/repositories/repositories.test.ts
197 tests/views/sources/repositories/harness.ts
48 tests/views/sources/repositories/press-on-render.ts
370 tests/views/whole/type-scale.test.ts
```

## 6. Judgment calls (each reversible)

Paths written outside "Paths this step writes" (the brief says such a path is reported):

1. `src/lib/ui/tree/TreeActions.svelte` (new, 81 lines). The row's controls, taken out of `TreeItem.svelte` so that file stays under the 540-line component limit (`TreeItem.svelte` is 516 lines; with the controls inside it was over). Recommended: keep. The other way would have been to leave the controls in `TreeItem.svelte` and cut the new props, which the brief requires.
2. `src/lib/ui/menu/Menu.svelte` (4 lines): passes `primary` to `MenuOpener`. The brief's read list says `Menu.svelte` is not changed, but `MenuOpener`'s `primary` look is reachable from the commit box only through `Menu`, which owns the opener.
3. `src/lib/views/sessions/changes/Changes.svelte`: drops `pushIt`, `upstream` and the `upstream` and `onpush` props it handed `ChangesRepo.svelte`, since the session panel's own Push button and "no upstream" line are removed (item 7).
4. `tests/checks/source/keys.test.ts`: names `changes/ChangeRow.svelte` where it named the moved `Changes.svelte` as the file holding the row's catalog reads.

New component named because a size limit forces it (allowed by the brief): `diff/DiffBar.svelte` (100 lines; `Diff.svelte` is 535 of 540).

Choices the brief left open or worded two ways:

5. Mark Resolved keeps its old icon `expand`, and Open in Merge Editor keeps `merge`, because the brief says the merge group's two controls "stay as they are"; Stage and Unstage use the new `stage` and `unstage`. The other reading is one icon per action, Mark Resolved drawn with `stage`. Recommended: the brief's literal reading stays until you rule; the lazy option is changing the icon because it looks tidier. Covered by `change-rows.test.ts` "keep Open in Merge Editor and Mark Resolved on a conflicted row".
6. The list and tree toggle is drawn in every state of the view (a root that is no repository included), because the brief says the bar "gets one toggle" without a condition. `tree-mode.test.ts` "is drawn for a state with no repository to draw as well".
7. The repository row has a `...` menu control (the items of its right-click menu: a shell and Reveal in Finder) because the measures table lists one at the right of the row; brief item 5 lists only Branch, Sync and the badge. It is drawn for a readable repository only, like the other controls. `repo-row.test.ts` "draws the ... menu of the row for a readable repository and for no other".
8. `TreeItem` props beyond the four the brief names: `tone: 'link'` (Load More), `struck` (deleted file), `nameStyle` (status colour and weight 400 of a repository name) and `yielding` (the repository row's controls give way before its name). Each is read by one of the brief's items (11, 8, 5).
9. Icon size and padding of the row controls: the brief wants a 16 px icon with 2 px of padding on the view's rows. `TreeActions.svelte` reads `--action-pad`, `--action-font` and `--action-glyph` with the values every other view has today as defaults, and the Repositories view sets them on `.repos` (`Repositories.svelte`, `--tree-action-icon: 16px` in `tokens.css`). No other view's row controls change. Not checked on screen; the look on TEST decides whether the 22 px row holds a 16 px icon with its transparent 1 px border without crowding.
10. The 0.9 em of the folder after a change name and of the author after a commit subject is set in `ChangeRow.svelte` (`.folder`) and `CommitRow.svelte` (`.author`), not on `TreeItem`'s `.detail`, so the detail text of every other view keeps the row's size.
11. Text scale: every new size that is a font, a line or a pill measure is multiplied by `var(--text-scale, 1)` (badge, pill line and name cut, button fonts and lines, the text area's tree size, the lane width and height). Borders, paddings, gaps and radii are literals and do not scale, as those of `TreeItem` do not.
12. The Graph head's actions are drawn while the section is open, as the measures table says of a pane header; the change groups' heads keep theirs when closed, since the table names only the pane headers.
13. The Branch control of the row keeps the open commit of the graph when the row is the repository already shown (`Repositories.svelte`, `showBranches`); it clears it when another repository is shown.
14. The folder row that closes over the focused row gives it the focus (brief item 9). For the change groups this is tested by rendering `Changes.svelte` with a navigation double and pressing the folder (`tree-mode.test.ts`; that test fails with the `nav.focus(id)` call in `changes/Changes.svelte:122` removed, checked by taking it out once). For a graph commit's files (`graph/CommitFiles.svelte`, `folderToggled`) the same decision is a pure function (`insideFolder` with the prefix `file:<hash>:`, tested in `change-tree.test.ts`), and the wiring in the component is not exercised by a test, because the files are read by an effect that a server render does not run. Not verified in a browser.
15. Not built, as the brief's Decisions say: Stage All on the merge group, the graph head's Refresh and its pickers. Nothing else from the brief is left out.

Constraint note: one read-only `git diff --stat` was run once by mistake; it wrote nothing. No other git command, no browser, no dependency and no environment variable were used. `X3d-base` holds copies of the changed and new test files (its `src` is unchanged).

## 7. User-visible changes, before and after

- Every section head in every view (Files, the session list, the Repositories view): small caps in the muted colour, before; capitals at weight 700 in the ink colour, after (`TreeItem.svelte:508-516`).
- The count of a section head, of a change group and of a repository row: plain number, before; a pill (11 px, 3px 5px padding, radius 11 px, at least 18 by 18), after. Other views' plain counts are unchanged.
- Repository row: name, path as hover words, a muted shape word; now the name at weight 400, and for a readable repository the Branch control, the Sync control (behind and ahead counts with arrows) or Publish Branch, the `...` menu, and the change count pill, all giving way before the name. The branch line and the path line above the sections of a readable repository are gone.
- Commit box: a three-row text area with small buttons Suggest, Commit and a dropdown, and two muted sentences under it; now a box one line high growing to ten, Suggest inside the box, one full-width button that is Commit, Sync Changes (with counts) or Publish Branch, the dropdown only on Commit, the two sentences become the disabled button's hover words, the box and button held 11 px and 12 px in from the row. The session panel's Push button and its "no upstream" line are gone; its box draws the same button.
- Change groups and rows: the Diff control leaves the row (pressing the row opens the diff); the controls are Open File, Discard, Stage or Unstage with new icons; the status letter is in the row's font at 90%, weight 600; deleted files are struck through; heads offer Open Changes, which opens one diff pane over every path of the group; the merge group is unchanged.
- List and tree: a toggle in the view's bar; in tree mode folders are rows (chains joined), Stage, Unstage and Discard on a folder act on every path under it in one write; the graph commit's files follow the mode.
- Graph: rows show the subject and the author at 0.9 em; the short hash and the time moved to the hover words; branch and tag names are pills; lanes are drawn as arcs of radius 11 with round caps; Incoming and Outgoing have dashed circles; Load More is one centred link row; the head offers Go to Current, Fetch, Pull and Push or Publish while open.
- Diff pane: bare icon buttons Open File, Previous Change, Next Change, Collapse Unchanged Regions (a pressed toggle, on at the start) and a `...` menu holding Inline View (checked when inline) and Refresh, in place of the side by side and inline buttons and the re-read button; a diff of several files gives each file a header with a fold chevron.
- The glyph `side_by_side` and `inline_diff` and the words `diff_side`, `list_sync`, `push_pending`, `push_title` (sessions) are gone; the old `commit_title` words are reworded.

## 8. The look: states a repository on TEST must be in, and where each measure is set

| Element | State on TEST | Measures (file:line) |
|---|---|---|
| Title bar | any repository; the bar shows View as Tree then `...` | toggle `Repositories.svelte:289-305`; row height 22 and 13 px text `TreeItem.svelte:291,295`; heading capitals, 700, 11 px, ink `TreeItem.svelte:508-516` |
| Repository row | one repository ahead 1 and behind 2 (Sync with both counts); one with no upstream and a remote (Publish); a long branch name in a narrow pane (cut, controls give way); a second root that is no repository | weight 400 `RepoList.svelte:139`; 4 px left and 16 px line per control `TreeActions.svelte:46-52`; 16 px icon, 2 px padding `Repositories.svelte` `.repos`, `TreeActions.svelte:62-76`; counts `RepoList.svelte:218-219`; badge `TreeItem.svelte:481-497` |
| Commit box | empty message (one line); a message of 12 lines (grows to ten, then scrolls); a long line in a narrow pane | border, radius `CommitBox.svelte:236-237`; 11 px and 12 px insets `Repo.svelte:270`; field padding `CommitBox.svelte:252`; toolbar padding `CommitBox.svelte:258`; grow 1 to 10 `CommitBox.svelte:153`, `TextArea.svelte:132-138`; 13 px text `TextArea.svelte:128-130` |
| Action button, Commit | something staged or changed; nothing typed (disabled with its reason) | `ToolButton.svelte:359-370` (4px 8px, 16 px line, 12 px, radius, accent), dropdown `MenuOpener.svelte:151-163`, separator `ToolButton.svelte:386-395` |
| Action button, Sync Changes | clean tree, branch ahead or behind | same rules; `actionButton` `repositories.ts:715` |
| Action button, Publish Branch | clean tree, branch with no upstream and a remote | same rules |
| Change group | staged, changed and untracked paths present; three paths in one group | badge `TreeItem.svelte:481-497`; head controls `changes/Changes.svelte` group head snippet; `tokens.css:151-159` |
| Change row | a modified, a deleted, an added and a renamed path; a merge in progress for the merge group | folder 0.9 em, opacity 0.7, 0.5 em `ChangeRow.svelte:189-193`; status letter 5 px, 90%, 600, 0.75 `ChangeRow.svelte:203-213`; strike `TreeItem.svelte:414`; controls 16 px icon, 2 px padding as the repository row |
| Tree mode | paths `src/a/x.ts`, `src/a/y.ts`, `readme.md`, a chain `a/b/c/one.ts`; a folder closed while its file holds the focus | `change-tree.ts:42` and sort `:36`; folder row `changes/FolderRow.svelte:73`; focus hand-over `changes/Changes.svelte:118-123` and `graph/CommitFiles.svelte` `folderToggled` |
| Graph lanes | a branch with a merge, several lanes, a commit open (verticals beside its files, 3 px on the open lane) | `graph-lanes.ts:89-190`; SVG size `graph/Lanes.svelte:58-59`; widths `:65`, caps `:91`; `--graph-lane` `tokens.css:153` |
| Graph row with pills | a commit with `main`, `origin/main` and a tag; HEAD's commit (strong, larger circle) | pill `graph/CommitRow.svelte:166-192`; author `:157-161`; strong `:97`; trailing `:99` |
| Incoming and Outgoing | branch ahead and behind (dashed circles) | `graph/GraphHead.svelte:45`, circles `graph-lanes.ts:176`; Load More link row `GraphHead.svelte:39`, `TreeItem.svelte:434-440` |
| Diff bar | a file's own diff (Open File present); a commit's diff (absent); inline mode (checked item) | `diff/DiffBar.svelte:58-94` |
| File header | a stash diff of several files; a rename; fold one file | `diff/FileHeader.svelte:72-129` (sticky `:73`, 22 px `:80`, R at 90% `:120`) |

## 9. Anything in the brief that was wrong or impossible

- Badge colours (item 3, "What to build"): `background: var(--muted)`, `color: var(--c-on)` is below 4.5:1 in 13 of 17 themes. Evidence: a throwaway test in `X3d-base/tests/checks/look/` that called `ratio()` of `themes/derive.ts` over `NAMES` of `tests/checks/look/themes.ts` and wrote to a file, run with `npx vitest run tests/checks/look/probe-badge.test.ts`, deleted after (`ls tests/checks/look` prints contrast.test.ts, lane-distance.test.ts, themes.ts). Output: `themes 17; below 4.5 with the brief pair: 13; with the built pair: 0`; lowest of the built pair is nord, 8.63. Per-theme figures are in section 2.
- Joined button separator (item 4): `--c-on` at 40% is the fixed on-chip ink, not the button's text colour; the button's words are `--on-accent`, so the separator uses `--on-accent` at 40% (`ToolButton.svelte:393`).
- The read list says `Menu.svelte` is not changed; `MenuOpener`'s new look needs its prop passed through it (section 6, item 2).
- The measures table has a `...` on the repository row that item 5 does not list (section 6, item 7).
- Nothing was impossible.
