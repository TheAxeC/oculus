Everything in the brief and in repair round 1 is done and `checks: 7 commands passed`. Not verified: the look of the graph circles' ring and of the commit field under `body.rice` on TEST, which is the landing's check (no browser was opened). Ruling 1 differs from its wording in one point: `--row-bg` is set for the rest and the pointer states and not for a selected state, because no graph row is ever drawn selected (Repair round 1, row 1).

# X3d report: the Repositories view and the diff as VS Code's Source Control

Worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/X3d`, oculus at `tools/oculus`. Base 4fe6ce93, unchanged copy at `.agents/worktrees/X3d-base` (its `src` is unchanged; its `tests` hold copies of the changed and new test files).

## 2. Open items of the state file (verbatim, `.scratch/migration/orchestrator-state.md` lines 88 to 94)

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is booked as its own step in `plan.md` and carried in the Booked section below, since it needs no ruling from him.

- Z93, the design of apps added while oculus runs: 31 choices (raised 2026-09-30 at E1's landing). The section is in `tools/oculus/DESIGN.md` as an unbuilt proposal whose text holds the recommended option of each choice; nothing is built and no build step is booked until Axel rules. The choices in full, each with its options, what speaks for and against each, the recommendation and the lazy option, are `agents/reviews/E1-choices.md`, which every report prints whole. They are C1 the folder, C2 the manifest, C3 the view id, C21 reserved names, C22 a folder without `app.yml`, C23 a manifest asking for a closed item, C4 the address, C5 the cross-origin header, C6 the sandbox, C7 the frame policy and the manuals' outside links, C24 the bridge's client file, C27 the Electron window, C30 an app's page in the Document view, C8 the channels, C28 coauthors' commit text, C25 the list of apps, C10 the title and glyph, C31 the glyph names, C11 state, C9 the write kinds and the bookmarks, C16 enforcing the kinds, C17 asking the reader, C18 the limits, C26 the refusal words, C15 the method names, C13 what an approval covers, C14 where approvals are kept, C29 what stops an app sending data out, C19 where apps sit, C12 a removed app's tabs, C20 keys inside an app. Recommendation: every choice as its file line recommends, which is what the section says now; the lazy option of each is named there. Blocks only E1's build step, which does not exist yet.
- Z94, the Settings editor's four shapes (raised 2026-09-30 at /spec S3; S3 is stopped until ruled). Z75 (a) and Z77 (a) fix that the Settings view becomes VS Code's Settings editor over every option from one catalog under `config/catalogs/`; they do not fix the four shapes below, each of which a reader of the config or of the view sees. The tree: the five tracked files hold 66 top-level keys and 249 key paths when a list counts as one value (appearance 6 and 14, behavior 31 and 64, layout 13 and 101, present 1 and 55, sources 15 and 15; counted with `yaml.safe_load` over each file); the Settings view today is `views/system/workbench/Settings.svelte` with `Appearance.svelte`, `RailEditor.svelte` and `PagesReset.svelte`; the only config writes are the rail list, the audit mute list and the deck's lists (`server/edit/writes.ts:109-120`, `deck-edit.ts`); `local.yml`'s keys are `LOCAL_KEYS` (`data/sources/config/local.ts:91`). (1) What one option is. (a) every key path, a list being one option: 249 entries, and `arrangements.<page>.<field>` or `deck.<key>` each get a row, so the editor is long and exact. (b) every top-level key: 66 entries, and `slurm`, `calendar`, `wallpaper` and the like are one row each whose description has to explain every key inside. (c) every key path, except that a family of records of one shape (`themes`, `arrangements`, `collections`, `usage_tiers`, the deck's lists) is one option whose entry describes the record's fields once. Recommended (c): each scalar a reader sets is found by its own name, and a family is explained once instead of once per member. Lazy: (b). (2) The catalog's file and entry. (a) one file `config/catalogs/options.yml`, a map of config file name to a map of dotted key path to `{ description, default, section?, control?, values? }`, `control` one of `toggle`, `number`, `text`, `choice`, `list`, and `values` the choices of a `choice`. (b) one file per config file under `config/catalogs/options/` with the same entries: five shorter files, and a search of descriptions reads five files. (c) the descriptions kept as the YAML comments they are today and parsed out: no second place to write, but a comment is free text with no default or control in it. Recommended (a): Z75 says one catalog, and Z77's check reads one file. Lazy: (c). (3) What Default and Modified mean. (a) the catalog entry holds the default, and Modified is a value in the file that differs from it; the default of a key is then a fact of oculus, the same on every machine. (b) the default is the value at git's HEAD and Modified is an uncommitted change: nothing to write in the catalog, and it says nothing about what the option is set to against oculus's own default. (c) the default is what the code falls back to when the key is absent: only some keys have one, the rest would show none. Recommended (a), and Z77's check then also fails on an entry with no `default`. Lazy: (b). (4) Which options get a control. (a) only what has one today: the appearance values kept per browser and the rail list; every other option shows its value and a control that opens its file at its line. (b) every `toggle`, `number`, `text` and `choice` option gets a control that writes that one key into its config file, comments kept, through one new confirmed write kind `config-key` (`{ file, key, value }`, refused for `local.yml`, for a key with no catalog entry and for a value its `control` does not allow), recorded in the History view and undoable; a `list` or a family opens its file at its line. (c) as (b) without the History record. Recommended (b): an editor that cannot change an option is a list, and the write goes through the chain every other write uses. Lazy: (a). Answer as `Z94 (1) (c), (2) (a), (3) (a), (4) (b)` or "as recommended".
- Z95, floating panes: three shapes (raised 2026-09-30 at /spec L4; L4 is stopped until ruled). Ruled already: any pane can float over the page with an orange border, on top and still there when the rail switches pages, docked it keeps the border and shows on every page (answer 10, `agents/reviews/axel-2026-09-21.md:63`); the move and resize run on `interactjs` (LA18); Live HPC and Usage are the first floats (Z1); a float's state stands alone so it can move to its own window (Z3). The tree: a page is one tree of splits, panes and page leaves (`state/workbench/layout/model.ts`), saved per browser under `oculus.layout.v1` (`layout/saved/storage.ts`); the Focus arrangement holds Live HPC and Usage as one pane of two tabs (`config/layout.yml:53`); the pane strip's menu holds Open File, the four splits, Close and New Terminal (`shell/panes/pane-view.ts:121-131`); nothing on main floats a pane (`grep -rni float src/lib/shell src/lib/state/workbench` finds two CSS comments, on the Update tray and the palette, and no code). (1) What docked is. (a) a float dragged to the window's left, right or bottom edge becomes a strip along that edge, outside every page's tree, drawn beside whichever page is on screen, resized by a sash, with the orange border; (b) docked is a float dropped into one page's tree, which then shows that pane on the other pages too by putting a copy of the spot in each: every page's arrangement changes when one pane docks; (c) no docking in L4, a float only floats, and docking is a later step. Recommended (a): it is the only reading in which a docked pane is on every page without rewriting every page. Lazy: (c). (2) How a pane floats and comes back. (a) a Float item in the pane strip's right-click menu and in the pane's menu, and a tab dragged off every pane onto the page's middle with Alt held floats on drop; the float's own strip menu holds Dock Left, Dock Right, Dock Bottom and Return to Page, which puts it back in the page on screen as a split of its largest pane; (b) the menu items alone, no drag; (c) a float button on every pane's strip beside the menu. Recommended (a): the menu is where the splits already are, and the drag is how every other pane move is made. Lazy: (b). (3) Where floats are kept and how the first ones are named. (a) the saved layout gains `floats:`, a list beside the pages, each `{ pane, x, y, w, h }` in fractions of the window as split sizes are, or `{ pane, dock: left | right | bottom, size }`; `config/layout.yml` gains a top-level `floats:` list in the same shape with `view:` in place of the pane, which a first load and Reset all pages read; its first entry is `{ view: [hpc, usage], dock: right, size: 0.3 }`, and the Focus arrangement loses its Live HPC and Usage pane; (b) the saved layout alone, no config key: Live HPC and Usage are floated by hand on each browser, and Reset all pages closes every float; (c) as (a) with the first entry floating at the lower right instead of docked. Recommended (a): Z1 names the first floats, so they have to be written somewhere a fresh browser reads, and docked right is where the Focus page has them today. Lazy: (b). Decided in the brief, not asked: the border is a new token `--float-border`, `--c-orange` by default and set by every theme; a float is kept inside the window when the window shrinks; Escape and the keyboard reach a float as they reach a pane. Answer as `Z95 (1) (a), (2) (a), (3) (a)` or "as recommended".

Ruled in repair round 1, no change made for them: the badge pair `--line` / `--on-line` is kept (the brief's pair is below 4.5:1 in 13 of 17 themes); the separator `--on-accent` at 40% is kept; the four paths outside the brief's list are accepted, the pass-through of `primary` in `Menu.svelte` included.

## 3. The cases on the unchanged tree (base 4fe6ce93, tests copied into X3d-base, run with `npx vitest run <the 26 files> --reporter=json` there and in the worktree)

Each case is a test in the form it has after its last change, run on the unchanged tree and on the finished tree. "FAIL" quotes the first line of the assertion error on the unchanged tree; "fails to load" quotes the error that stops the whole file there (the module or component the test renders does not exist on the unchanged tree); "FAIL (narrow copy, section 3b)" is a case whose file does not load on the unchanged tree only because of other cases, and whose own failure is quoted from a run of the case alone. A case whose rule is wrong under the brief: none; every case ran as written.

Finished tree: the 26 files print 723 passed of 723, 0 failed. Unchanged tree: 650 tests listed, 486 passed, 164 failed (the failures are the new behaviour); `change-tree.test.ts`, `graph-row.test.ts` and `tree-mode.test.ts` fail to load there, so their tests are not listed.

Cases 15 (second half) and 25 are audits by the brief. Every test named "audits" that passes on the unchanged tree tests a rule the unchanged tree already holds and the change keeps: a count without `badge` drawn as plain text and the detail, count and end at the small size (`tree.test.ts`), the terminal form of `TextArea` (`text-area.test.ts`), the two branch-state sentence audits (`sessions/changes.test.ts`), the mono font left to the text area and no forced override in the commit box (`commit-box.test.ts`), the picker status tone and the first changed files of a long group (`repositories.test.ts`), the Settings pages section of `type-scale.test.ts`, and the 16 audits of `repositories-menu.test.ts`, which this step does not change. Each other test that passes on the unchanged tree tests behaviour the change preserves and is counted in section 3a.

Cases 9 (the graph commit's folder), 21 (the ring), 23 (the reveal after an unfold, the two audits of the section) and the badge of Monaco-drawn surfaces (case 3 row) also carry the tests added in repair round 1; they are listed under the case they belong to.

| Case | Test (file, then the test) | Unchanged tree |
|---|---|---|
| 1 | `change-tree.test.ts`: the tree of a change group puts two files of one folder under it and the file at the root beside it | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' |
| 2 | `change-tree.test.ts`: the tree of a change group joins a chain of folders with one child each into one row and puts the file unde... | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' |
| 3 | `change-tree.test.ts`: the tree of a change group keeps a folder that holds a folder and a file as its own row | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' |
| 4 | `change-tree.test.ts`: the tree of a change group keeps spaces in a folder name and a file name | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' |
| 5 | `change-tree.test.ts`: the tree of a change group gives no rows for no paths, and sorts by base letter with ties in code unit order | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' |
| 6 | `view-state.test.ts`: the mode of the view is the list for an absent or an unknown value and the tree only when it says tree | FAIL: AssertionError: expected undefined to be 'list' // Object.is equality |
| 7 | `commit-action.test.ts`: the lines of the commit message field is one for an empty message and one for a long line that wraps | FAIL: TypeError: (0 , __vite_ssr_import_1__.messageRows) is not a function |
| 7 | `commit-action.test.ts`: the lines of the commit message field is the line count up to ten, a trailing newline counting its empty line | FAIL: TypeError: (0 , __vite_ssr_import_1__.messageRows) is not a function |
| 7 | `commit-box.test.ts`: the message field carries the line count of the message as its rows, one for an empty field | FAIL: AssertionError: expected '3' to be '1' // Object.is equality |
| 8 | `commit-action.test.ts`: what the commit box button is is Commit while anything is staged, changed, untracked or unmerged | FAIL: TypeError: (0 , __vite_ssr_import_1__.actionButton) is not a function |
| 8 | `commit-action.test.ts`: what the commit box button is is Commit while a merge or a rebase is in progress with nothing left to stage | FAIL: TypeError: (0 , __vite_ssr_import_1__.actionButton) is not a function |
| 8 | `commit-action.test.ts`: what the commit box button is is Sync Changes with nothing to commit and a branch ahead of or behind its up... | FAIL: TypeError: (0 , __vite_ssr_import_1__.actionButton) is not a function |
| 8 | `commit-action.test.ts`: what the commit box button is is the disabled Commit button with nothing to commit and nothing to sync | FAIL: TypeError: (0 , __vite_ssr_import_1__.actionButton) is not a function |
| 8 | `commit-action.test.ts`: what the commit box button is is the disabled Commit button on a detached head, whatever the upstream state... | FAIL: TypeError: (0 , __vite_ssr_import_1__.actionButton) is not a function |
| 8 | `commit-action.test.ts`: what the commit box button is is Publish Branch with nothing to commit, no upstream and a remote to publish to | FAIL: TypeError: (0 , __vite_ssr_import_1__.actionButton) is not a function |
| 8 | `commit-action.test.ts`: what the commit box button is is Publish Branch for a repository with no commit exactly when Publish Branch... | FAIL: TypeError: (0 , __vite_ssr_import_1__.actionButton) is not a function |
| 8 | `commit-action.test.ts`: what the commit box button is is Commit before it is Sync or Publish | FAIL: TypeError: (0 , __vite_ssr_import_1__.actionButton) is not a function |
| 9 | `commit-box.test.ts`: the message field says the chord and the branch it commits on | FAIL: AssertionError: expected '' to be 'Message (Ctrl+Enter to commit on "mai...' // Object.is equality |
| 9 | `commit-box.test.ts`: the message field says the chord alone when no branch is checked out | FAIL: AssertionError: expected '' to be 'Message (Ctrl+Enter to commit)' // Object.is equality |
| 9 | `commit-box.test.ts`: the message field draws a branch name with markup characters in it as text | FAIL: AssertionError: expected '' to be 'Message (Ctrl+Enter to commit on "fea...' // Object.is equality |
| 10 | `graph.test.ts`: the lane geometry of a 22 pixel row puts lane n at 11 * (n + 1) and makes the row 11 * (max(lanes, 1) + 1) ... | FAIL: TypeError: (0 , __vite_ssr_import_1__.laneX) is not a function |
| 11 | `graph.test.ts`: the lane geometry of a 22 pixel row draws a lane that passes as one vertical from the top of the row to its... | FAIL: TypeError: (0 , __vite_ssr_import_1__.lanePaths) is not a function |
| 11 | `graph.test.ts`: the lane geometry of a 22 pixel row draws a lane that ends in the commit from a column to its right as one ... | FAIL: TypeError: (0 , __vite_ssr_import_1__.lanePaths) is not a function |
| 11 | `graph.test.ts`: the lane geometry of a 22 pixel row draws a merge parent leaving the commit to the next column as one arc | FAIL: TypeError: (0 , __vite_ssr_import_1__.lanePaths) is not a function |
| 11 | `graph.test.ts`: the lane geometry of a 22 pixel row holds no Bezier curve in any stroke of any row | FAIL: TypeError: (0 , __vite_ssr_import_1__.lanePaths) is not a function |
| 12 | `graph.test.ts`: the circle of a commit is one circle of radius 5 for a commit | FAIL: TypeError: (0 , __vite_ssr_import_1__.commitCircles) is not a function |
| 12 | `graph.test.ts`: the circle of a commit is radius 6 with an inner circle of radius 3 for a merge | FAIL: TypeError: (0 , __vite_ssr_import_1__.commitCircles) is not a function |
| 12 | `graph.test.ts`: the circle of a commit is radius 7 with an inner circle of radius 2 for HEAD | FAIL: TypeError: (0 , __vite_ssr_import_1__.commitCircles) is not a function |
| 12 | `graph.test.ts`: the circle of a commit is radius 7, radius 5 and a dashed ring of radius 5 for Incoming and Outgoing | FAIL: TypeError: (0 , __vite_ssr_import_1__.commitCircles) is not a function |
| 12 | `graph.test.ts`: the circle of a commit takes HEAD before a merge when a commit is both | FAIL: TypeError: (0 , __vite_ssr_import_1__.commitKind) is not a function |
| 13 | `change-rows.test.ts`: the name of a change row is struck through in the deleted tone for a deleted path | FAIL: AssertionError: expected 'data-entry="gone.txt"><!--[0--><!--[-...' to match /class="item[^"]*\bstruck\b/ |
| 13 | `change-rows.test.ts`: the name of a change row is in the modified tone and not struck for a modified path | FAIL: AssertionError: expected '<span class="name svelte-dj5yz8">kept...' to contain '--c-scm-modified-txt' |
| 13 | `change-rows.test.ts`: the name of a change row is one row under the new path in the renamed tone and not struck for a renamed path | FAIL: AssertionError: expected '<span class="name svelte-dj5yz8">move...' to contain '--c-violet-txt' |
| 14 | `change-rows.test.ts`: the controls of a change row are Open File, Discard and Stage on a changed row, in that order | FAIL: AssertionError: expected [ 'diff', 'Open File', 'stage', ...(1) ] to deeply equal [ 'Open File', 'discard', 'stage' ] |
| 14 | `change-rows.test.ts`: the controls of a change row are Open File and Unstage on a staged row | FAIL: AssertionError: expected [ 'diff', 'Open File', 'unstage' ] to deeply equal [ 'Open File', 'unstage' ] |
| 14 | `change-rows.test.ts`: the controls of a change row are Open File and Stage on an untracked row | pass (behaviour kept) |
| 14 | `change-rows.test.ts`: the controls of a change row include no Diff control on any row, since pressing the row opens the diff | FAIL: AssertionError: expected 'data-group="changes"><div class="sect...' not to contain 'aria-label="diff"' |
| 14 | `change-rows.test.ts`: the controls of a change row draw the icon each action has in every list of changes | FAIL: AssertionError: expected 'expand' to be 'stage' // Object.is equality |
| 14 | `change-rows.test.ts`: the controls of a change row keep Open in Merge Editor and Mark Resolved on a conflicted row | pass (behaviour kept) |
| 15 | `change-rows.test.ts`: the head of a change group carries a badge reading the number of its paths and an Open Changes control | FAIL: AssertionError: expected 'data-changes="staged"><!--[0--><!--[-...' to match /class="count[^"]*\bbadge\b[^"]*".../span> |
| 15 | `change-rows.test.ts`: the head of a change group offers Open Changes then Unstage All on the staged group | FAIL: AssertionError: expected [ 'Unstage All Changes' ] to deeply equal [ 'Open Changes', ...(1) ] |
| 15 | `change-rows.test.ts`: the head of a change group offers Open Changes, then Discard All and Stage All on the changed group | FAIL: AssertionError: expected [ 'Discard All Changes', ...(1) ] to deeply equal [ 'Open Changes', ...(2) ] |
| 15 | `change-rows.test.ts`: the head of a change group offers Stage All and no Open Changes on the untracked group | pass (behaviour kept) |
| 15 (second half, audit) | `tree.test.ts`: the count of a row drawn as a badge audits that draws a count as plain text in the number font when the row... | pass (behaviour kept) |
| 16 | `repo-row.test.ts`: the Branch control of a repository row reads the branch, and carries the whole name as its hover words | FAIL: AssertionError: expected undefined to match object { label: 'main', title: 'main', ...(1) } |
| 16 | `repo-row.test.ts`: the Sync control of a repository row reads the behind count and then the ahead count, each with its arrow | FAIL: AssertionError: expected undefined to be defined |
| 16 | `repo-row.test.ts`: the Sync control of a repository row holds no number and says in step when the branch is neither ahead nor ... | FAIL: AssertionError: expected undefined to match object { title: 'in step with the upstream' } |
| 16 | `repo-row.test.ts`: the Sync control of a repository row names the distance in the hover words the branch line has said until now | FAIL: AssertionError: expected undefined to match object { title: '1 ahead / 2 behind' } |
| 16 | `repo-row.test.ts`: the Sync control of a repository row is Publish Branch for a branch with no upstream and a remote to publis... | FAIL: AssertionError: expected undefined to match object { title: 'Publish Branch' } |
| 16 | `repo-row.test.ts`: the Sync control of a repository row is not drawn with no upstream and no remote, with an upstream not answ... | pass (behaviour kept) |
| 16 | `repo-row.test.ts`: the Sync control of a repository row is not drawn for an upstream the state names but the listing has not | pass (behaviour kept) |
| 16 | `repo-row.test.ts`: the Sync control of a repository row is drawn for neither a root that is no repository nor one whose read f... | pass (behaviour kept) |
| 16 | `repo-row.test.ts`: the Sync control of a repository row asks the Sync question first, and runs the same store call on a yes only | FAIL: AssertionError: expected undefined to be 'Sync main with origin/main?' // Object.is equality |
| 16 | `repo-row.test.ts`: the Sync control of a repository row calls nothing when the answer is no | FAIL: AssertionError: expected null not to be null |
| 16 | `repo-row.test.ts`: the Sync control of a repository row asks the Publish Branch question for the first remote | FAIL: AssertionError: expected undefined to be 'Publish main to origin?' // Object.is equality |
| 16 | `repo-row.test.ts`: the Sync control of a repository row is disabled with the busy words while a write runs on the repository | FAIL: AssertionError: expected undefined to match object { disabled: true, title: 'Working' } |
| 16 | `repo-row.test.ts`: the repository below its row keeps the branch line and the path above the state row of a repository whose r... | pass (behaviour kept) |
| 17 | `repo-row.test.ts`: the Sync control of a repository row asks the Sync question first, and runs the same store call on a yes only | FAIL: AssertionError: expected undefined to be 'Sync main with origin/main?' // Object.is equality |
| 17 | `repo-row.test.ts`: the Sync control of a repository row calls nothing when the answer is no | FAIL: AssertionError: expected null not to be null |
| 17 | `commit-box.test.ts`: the action button in each of its states is disabled with the busy words in the sync and publish states whil... | FAIL: AssertionError: expected undefined to match object { disabled: true, title: 'Working' } |
| 17 | `graph-row.test.ts`: the actions on the Graph head are disabled with the busy words while a write runs, Go to Current apart | FAIL (narrow copy, section 3b): AssertionError: expected undefined to match object { disabled: true, title: 'Working' } |
| 17 | `tree-mode.test.ts`: the controls of a folder row are disabled with the busy words while a write runs on the repository | fails to load: Cannot find module '/src/lib/views/sources/repositories/changes/Changes.svelte' |
| 18 | `repo-row.test.ts`: the repository below its row draws neither the branch line nor the path line for a readable repository | FAIL: AssertionError: expected '<!--[--><section class="pane svelte-b...' not to contain 'class="branch' |
| 19 | `tree-mode.test.ts`: the toggle between the list and the tree is View as Tree with its icon in list mode, which is where the vie... | FAIL (narrow copy, section 3b): AssertionError: expected undefined to match object { Object (label, glyph) } |
| 19 | `tree-mode.test.ts`: the toggle between the list and the tree is drawn for a state with no repository to draw as well, since the... | FAIL (narrow copy, section 3b): AssertionError: expected undefined to match object { label: undefined } |
| 19 | `tree-mode.test.ts`: the toggle between the list and the tree is View as List with the list icon in tree mode | FAIL (narrow copy, section 3b): AssertionError: expected undefined to match object { label: undefined, glyph: 'list' } |
| 19 | `tree-mode.test.ts`: the toggle between the list and the tree writes tree into the instance state when pressed in list mode, and... | FAIL (narrow copy, section 3b): AssertionError: expected undefined to be type of 'function' |
| 19 | `tree-mode.test.ts`: the toggle between the list and the tree is drawn before the menu of More Actions in the bar | FAIL (narrow copy, section 3b): AssertionError: expected -1 to be greater than -1 |
| 19 | `tree-mode.test.ts`: the groups in tree mode draw the merge group as a list | fails to load: Cannot find module '/src/lib/views/sources/repositories/changes/Changes.svelte' |
| 20 | `tree-mode.test.ts`: the controls of a folder row call stagePaths once with exactly the paths under a changed folder | fails to load: Cannot find module '/src/lib/views/sources/repositories/changes/Changes.svelte' |
| 20 | `tree-mode.test.ts`: the controls of a folder row call unstagePaths once with exactly the paths under a staged folder | fails to load: Cannot find module '/src/lib/views/sources/repositories/changes/Changes.svelte' |
| 20 | `tree-mode.test.ts`: the controls of a folder row ask first when a folder is discarded, naming how many paths, and call discardP... | fails to load: Cannot find module '/src/lib/views/sources/repositories/changes/Changes.svelte' |
| 20 | `tree-mode.test.ts`: the controls of a folder row carry Stage and no Discard on an untracked folder | fails to load: Cannot find module '/src/lib/views/sources/repositories/changes/Changes.svelte' |
| 20 | `tree-mode.test.ts`: the controls of a folder row are disabled with the busy words while a write runs on the repository | fails to load: Cannot find module '/src/lib/views/sources/repositories/changes/Changes.svelte' |
| 20 | `change-tree.test.ts`: the ids of the folders of a change group tells one folder apart in two groups and in two repositories | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' |
| 20 | `change-tree.test.ts`: the ids of the folders of a change group never equals the id of a section, a group or the repositories head | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' |
| 20 | `change-tree.test.ts`: the ids of the folders of a change group gives a file at the root of the group no folder row and so no fold... | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' |
| 20 | `change-tree.test.ts`: the rows the keyboard reads in tree mode lists the folder row and the files under it, in the order they are... | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' |
| 20 | `change-tree.test.ts`: the rows the keyboard reads in tree mode leaves a row inside a closed folder out | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' |
| 20 | `change-tree.test.ts`: the rows the keyboard reads in tree mode lists no folder row in list mode, whatever the instance kept closed | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' |
| 20 | `change-tree.test.ts`: the rows the keyboard reads in tree mode keeps the merge group a list in tree mode | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' |
| 20 | `change-tree.test.ts`: the closed folders the instance keeps drops a folder id of the shown repository whose folder is in no group | fails to load: Cannot find module '../../../../src/lib/state/sources/repositories/change-tree.ts' |
| 20 | `tree-mode.test.ts`: the closed folders the instance keeps drop the id of a folder that is in none of the groups when the next c... | fails to load: Cannot find module '/src/lib/views/sources/repositories/changes/Changes.svelte' |
| 21 | `graph-row.test.ts`: a commit row draws one pill per ref and tag, the local branch first on the accent tint | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' |
| 21 | `graph-row.test.ts`: a commit row draws the subject and then the author, and neither the short hash nor the time | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' |
| 21 | `graph-row.test.ts`: a commit row puts the hash, the author, the date and the time in the hover words | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' |
| 21 | `graph-row.test.ts`: a commit row draws the pills at the right of the row, before the row actions | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' |
| 21 | `graph-row.test.ts`: a commit row cuts the name of a pill and keeps it whole in its hover words | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' |
| 21 | `graph-row.test.ts`: a commit row is strong, with the circle of HEAD, when it is the commit HEAD points at | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' |
| 21 | `graph-row.test.ts`: a commit row draws the circle of a merge when it is one and not HEAD | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' |
| 21 | `graph-row.test.ts`: the rules of a commit row audits that draws a pill 10px round, on an 18px line of the button size, at the t... | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' |
| 21 | `graph-row.test.ts`: the rules of a commit row audits that draws the author at 0.9 of the row size, opacity 0.7 and half an em f... | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' |
| 21 | `graph-row.test.ts`: the rules of a commit row audits that puts the accent tint on the local branch pill and the panel on the ot... | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' |
| 21 | `graph-row.test.ts`: the ring of a circle audits that the lanes of a commit row sit in an element that sets the row's --row-bg a... | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' |
| 21 | `graph-row.test.ts`: the ring of a circle audits that the element holding the lanes of a commit row paints the pointer's backgro... | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' |
| 21 | `graph-row.test.ts`: the ring of a circle audits that the TreeItem of a commit row is given no selected state, so the accent tin... | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' |
| 22 | `diff-pane.test.ts`: the bar of the diff pane over a file of its own holds Open File, Previous Change, Next Change, Collapse Unc... | FAIL: AssertionError: expected [ 'Previous Change', ...(2) ] to deeply equal [ Array(5) ] |
| 22 | `diff-pane.test.ts`: the bar of the diff pane over a file of its own draws each control as a bare icon button with the icon of i... | FAIL: AssertionError: expected { label: 'Open File', ...(3) } to match object { Object (glyph, bare, ...) } |
| 22 | `diff-pane.test.ts`: the bar of the diff pane over a file of its own draws Collapse Unchanged Regions pressed at the start and n... | FAIL: AssertionError: expected undefined to match object { pressed: true } |
| 22 | `diff-pane.test.ts`: the bar of the diff pane over a file of its own holds Inline View as an item that is checked in inline mode... | FAIL: TypeError: Cannot read properties of undefined (reading 'items') |
| 22 | `diff-pane.test.ts`: the bar of the diff pane over a file of its own keeps the side by side and inline buttons and the re-read b... | FAIL: AssertionError: expected '<!--[--><section class="pane svelte-b...' not to contain 'aria-label="Side by Side"' |
| 22 | `diff-pane.test.ts`: the bar of the diff pane over a file of its own draws no Open File over the diff of a commit | pass (behaviour kept) |
| 23 | `diff-pane.test.ts`: the header of a file of a diff draws one row holding the name and, muted after it, the folder | FAIL: AssertionError: expected '<!--[--><section class="file svelte-c...' to contain 'data-file-header="src/lib/a.ts"' |
| 23 | `diff-pane.test.ts`: the header of a file of a diff carries a chevron that folds the file, with its state, then Open File, in th... | FAIL: AssertionError: expected [] to deeply equal [ 'chevron', 'open_file' ] |
| 23 | `diff-pane.test.ts`: the header of a file of a diff says the file is folded on its chevron when it is | FAIL: AssertionError: expected undefined to match object { expanded: false, title: undefined } |
| 23 | `diff-pane.test.ts`: the header of a file of a diff presses the chevron through to the pane, which keeps the file folded | FAIL: TypeError: Cannot read properties of undefined (reading 'onclick') |
| 23 | `diff-pane.test.ts`: the header of a file of a diff draws a one-file diff nothing may act on with its header and no chevron | FAIL: AssertionError: expected '<!--[--><section class="file svelte-c...' to contain 'data-file-header=' |
| 23 | `diff-pane.test.ts`: the header of a file of a diff carries the letter R and the old path for a rename | FAIL: AssertionError: expected '>' to contain '>R<' |
| 23 | `diff-pane.test.ts`: the header of a file of a diff leaves out Open File for a diff that has no file on disk | FAIL: AssertionError: expected [] to deeply equal [ 'chevron' ] |
| 23 | `diff-pane.test.ts`: the header of a file of a diff audits that stays at the top of the pane on the panel, and on the translucen... | FAIL: Error: ENOENT: no such file or directory, open 'src/lib/views/sources/repositories/diff/FileHeader.svelte' |
| 23 | `diff-pane.test.ts`: a section whose file is folded leaves its header and removes its editor | FAIL: AssertionError: expected '<!--[--><section class="file svelte-c...' not to contain 'class="editor' |
| 23 | `diff-pane.test.ts`: a section whose file is folded folds a binary file over the sentence it draws today | FAIL: AssertionError: expected '<!--[--><section class="file svelte-c...' not to contain 'Binary file, no lines to show.' |
| 23 | `diff-pane.test.ts`: a section whose file is folded names the header of a header-less diff as it did when it holds one file | pass (behaviour kept) |
| 23 | `view-state.test.ts`: what a diff pane keeps of its files folds the unchanged runs and no file to start with | FAIL: AssertionError: expected { mode: 'side', views: {} } to deeply equal { mode: 'side', views: {}, ...(2) } |
| 23 | `view-state.test.ts`: what a diff pane keeps of its files reads the unchanged choice and the folded files, and defaults anything ... | FAIL: AssertionError: expected { mode: 'side', views: {} } to match object { unchanged: 'shown', ...(1) } |
| 23 | `view-state.test.ts`: what a diff pane keeps of its files drops a folded file that is not among the files of the diff | FAIL: AssertionError: expected undefined to deeply equal [ 'a' ] |
| 23 | `view-state.test.ts`: what a diff pane keeps of its files folds a file that is open and opens one that is folded | FAIL: TypeError: (0 , __vite_ssr_import_1__.toggleFolded) is not a function |
| 23 | `view-state.test.ts`: what a diff pane keeps of its files opens a folded file a step lands on and leaves the rest as they were | FAIL: TypeError: (0 , __vite_ssr_import_1__.unfolded) is not a function |
| 24 | `view-state.test.ts`: the id of a diff over a change group holds the group and the root, so the staged and the changed group are ... | FAIL: AssertionError: expected 'staged:/hub:' to contain 'group@staged' |
| 24 | `view-state.test.ts`: the id of a diff over a change group tells the same group of two repositories apart | pass (behaviour kept) |
| 24 | `view-state.test.ts`: the id of a diff over a change group is no id of a file, a stash or a worktree diff over the same empty path | FAIL: AssertionError: expected [ 'staged:/hub:', ...(2) ] to not include 'staged:/hub:' |
| 24 | `view-state.test.ts`: the id of a diff over a change group allows no hunk action, as a stash does not | FAIL: AssertionError: expected true to be false // Object.is equality |
| 25 | `tree.test.ts`: the look of a row, read from the source audits that draws a heading row in capitals, not small capitals, at... | FAIL: AssertionError: expected '.heading .main {\n        font-weight...' to contain 'text-transform: uppercase' |
| 26 | `changes.test.ts`: the changes view draws Sync Changes and no Push button for a branch ahead of its upstream with nothing to c... | FAIL: AssertionError: expected '<!--[--><section class="pane svelte-b...' to include undefined |
| 27 | `repo-row.test.ts`: the Branch control of a repository row cuts a branch name longer than the row and keeps it whole in the hov... | FAIL: AssertionError: expected undefined to match object { cut: true, ...(2) } |
| 21 | `graph-row.test.ts`: the ring of a circle audits that a row gives --row-bg its panel at rest, its chip under the pointer, its ac... | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' |
| 21 | `graph-row.test.ts`: the ring of a circle audits that the lanes of the Incoming and Outgoing rows sit in an element that sets th... | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' |
| 21 | `graph-row.test.ts`: the ring of a circle audits that the element holding the lanes of the Incoming and Outgoing rows paints the... | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' |
| 21 | `graph-row.test.ts`: the ring of a circle audits that the TreeItem of the Incoming and Outgoing rows is given no selected state,... | fails to load: Cannot find module '/src/lib/views/sources/repositories/graph/CommitRow.svelte' |
| 23 | `view-state.test.ts`: a reveal asked of a diff section is done at once by a section whose editor is drawn and has reported its ch... | FAIL: TypeError: (0 , __vite_ssr_import_2__.revealAsked) is not a function |
| 23 | `view-state.test.ts`: a reveal asked of a diff section is kept by a folded or not yet drawn section, and done when its editor rep... | FAIL: TypeError: (0 , __vite_ssr_import_2__.revealAsked) is not a function |
| 23 | `view-state.test.ts`: a reveal asked of a diff section is replaced by a later reveal asked before the editor reports | FAIL: TypeError: (0 , __vite_ssr_import_2__.revealAsked) is not a function |
| 23 | `view-state.test.ts`: a reveal asked of a diff section keeps nothing for a step whose hunk is not known yet, since the pane asks ... | FAIL: TypeError: (0 , __vite_ssr_import_2__.revealAsked) is not a function |
| 23 | `view-state.test.ts`: a reveal asked of a diff section does nothing when the editor reports its changes and none is kept | FAIL: TypeError: (0 , __vite_ssr_import_2__.revealDue) is not a function |
| 23 | `diff-pane.test.ts`: a section asked to reveal a change before its editor is back audits that asks the pure rule when a reveal c... | FAIL: AssertionError: expected 'export function reveal(hunk: number):...' to contain 'revealAsked(' |
| 23 | `diff-pane.test.ts`: a section asked to reveal a change before its editor is back audits that performs the kept reveal when its ... | FAIL: AssertionError: expected 'function changed(next: LineChange[]):...' to contain 'revealDue(pending)' |
| 9 | `tree-mode.test.ts`: a folder of a graph commit that closes over the row that holds the focus takes the focus itself | fails to load: Cannot find module '/src/lib/views/sources/repositories/changes/Changes.svelte' |
| 9 | `tree-mode.test.ts`: a folder of a graph commit that closes over the row that holds the focus leaves the focus alone when the fo... | fails to load: Cannot find module '/src/lib/views/sources/repositories/changes/Changes.svelte' |
| 9 | `tree-mode.test.ts`: a folder of a graph commit that closes over the row that holds the focus leaves the focus alone when the fo... | fails to load: Cannot find module '/src/lib/views/sources/repositories/changes/Changes.svelte' |
| 3 | `theme.test.ts`: the badge of a Monaco-drawn surface is painted from the pair a tree row draws its count badge with, at 4.5:... | FAIL: AssertionError: expected '--muted' to be '--line' // Object.is equality |
| 3 | `tree.test.ts`: the look of a row, read from the source audits that draws the detail, the count and the end at the small si... | pass (behaviour kept) |
| 7 | `commit-box.test.ts`: the message field under body.rice audits that draws the terminal form of a text area: a line at its left, n... | FAIL: AssertionError: expected '' to contain 'border-left: 1px solid var(--line)' |
| 7 | `commit-box.test.ts`: the message field under body.rice audits that leaves the mono font of the terminal form to the text area, w... | pass (behaviour kept) |
| 7 | `commit-box.test.ts`: the message field under body.rice audits that draws it by the rules scope and never by a forced override | pass (behaviour kept) |

### 3a. Tests of the changed and new files that pass on the unchanged tree (behaviour the change preserves)

- `tests/checks/source/keys.test.ts`: 7 pass on both trees
- `tests/state/sources/repositories/diff-view.test.ts`: 2 pass on both trees
- `tests/state/sources/repositories/graph.test.ts`: 3 pass on both trees
- `tests/state/sources/repositories/repositories.test.ts`: 45 pass on both trees
- `tests/state/sources/repositories/view-state.test.ts`: 1 pass on both trees
- `tests/ui/controls/editor/theme.test.ts`: 11 pass on both trees
- `tests/ui/forms/text-area.test.ts`: 2 pass on both trees
- `tests/ui/menu/menu-opener.test.ts`: 1 pass on both trees
- `tests/ui/tree/tree.test.ts`: 16 pass on both trees
- `tests/views/sessions/changes.test.ts`: 21 pass on both trees
- `tests/views/sources/repositories/change-rows.test.ts`: 4 pass on both trees
- `tests/views/sources/repositories/commit-box.test.ts`: 2 pass on both trees
- `tests/views/sources/repositories/diff-pane.test.ts`: 2 pass on both trees
- `tests/views/sources/repositories/repo-row.test.ts`: 5 pass on both trees
- `tests/views/sources/repositories/repositories.test.ts`: 35 pass on both trees

(Files not listed here were not changed: diff, file-git, hunks-git and merge state tests and repositories-menu.test.ts pass on both trees unchanged. `type-scale.test.ts`: 259 tests, 11 fail on the unchanged tree because the new components are not in its audit lists: shared/changes/CommitBox.svelte, sources/repositories/changes/Changes.svelte, sources/repositories/changes/ChangeRow.svelte, sources/repositories/changes/FolderRow.svelte, sources/repositories/diff/DiffBar.svelte, sources/repositories/diff/FileHeader.svelte, sources/repositories/graph/CommitRow.svelte, sources/repositories/graph/GraphHead.svelte, src/lib/ui/tree/TreeActions.svelte, the view type scale audits that every ui component is listed in the pass-through audit, the view type scale lists every view file in the audit.)

### 3b. Cases of components the unchanged tree has, run alone on the unchanged tree

`tree-mode.test.ts` (the five toggle cases) and `graph-row.test.ts` (the seven Graph head cases and the two Lanes cases) render `Repositories.svelte`, `Graph.svelte` and `Lanes.svelte`, which exist on the unchanged tree; the files do not load there because other cases in them import `Changes.svelte`, `CommitRow.svelte`, `GraphHead.svelte` and `CommitFiles.svelte`. Each of the 14 was copied into a file of its own whose imports point at the unchanged tree's sources, and run there with `npx vitest run tests/narrow-r1 --reporter=json` from `X3d-base/tools/oculus` (the copies were removed after the run). Result: `Tests  14 failed (14)`. One line per case, the first line of its error:

- the lanes of a row draw the verticals of the lanes that pass beside the files of an open commit, 3px on the open lane: TypeError: Cannot read properties of undefined (reading 'width')
- the lanes of a row audits that draw a line 1px with round caps and a 2px ring in the colour of the row: AssertionError: expected '<script lang="ts">\n    // Layer 3, p...' to contain 'stroke-linecap: round'
- the actions on the Graph head are drawn while the section is open and not while it is closed: AssertionError: expected 0 to be greater than 0
- the actions on the Graph head are Go to Current, Fetch, Pull and Push for a branch that has an upstream: AssertionError: expected [] to deeply equal [ undefined, 'Fetch', 'Pull', 'push' ]
- the actions on the Graph head are Go to Current, Fetch and Publish for a branch that has none and a remote to publish to: AssertionError: expected [] to deeply equal [ Array(3) ]
- the actions on the Graph head draw no Go to Current for a repository with no commit: AssertionError: expected [] to include 'Fetch'
- the actions on the Graph head draw the icons of the same actions elsewhere: AssertionError: expected undefined to be 'goto_current' // Object.is equality
- the actions on the Graph head ask what the menu asks before a pull and a push, and fetch at once: TypeError: (intermediate value) is not a function
- the actions on the Graph head are disabled with the busy words while a write runs, Go to Current apart: AssertionError: expected undefined to match object { disabled: true, title: 'Working' }
- the toggle between the list and the tree is View as Tree with its icon in list mode, which is where the view starts: AssertionError: expected undefined to match object { Object (label, glyph) }
- the toggle between the list and the tree is drawn for a state with no repository to draw as well, since the mode is t...: AssertionError: expected undefined to match object { label: undefined }
- the toggle between the list and the tree is View as List with the list icon in tree mode: AssertionError: expected undefined to match object { label: undefined, glyph: 'list' }
- the toggle between the list and the tree writes tree into the instance state when pressed in list mode, and list when...: AssertionError: expected undefined to be type of 'function'
- the toggle between the list and the tree is drawn before the menu of More Actions in the bar: AssertionError: expected -1 to be greater than -1

## 4. DONE / NOT DONE

NOT DONE: nothing inside the brief or repair round 1. Not verified, because the brief assigns it to the landing: the look side by side with VS Code on TEST, the ring of the graph circles and the commit field under `body.rice` included (this step opened no browser and added no browser test).

Verification commands, all run from `tools/oculus` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, once at the end, after the last change of repair round 1 (the tool prints a check mark before each `built in` line):

```
$ npm run diagrams            -> ... docs/diagrams/writes.dot / docs/diagrams/writes.svg / diagrams exit 0
$ sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md
$ npm test
 Test Files  360 passed | 19 skipped (379)
      Tests  5539 passed | 558 skipped (6097)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  365 passed | 9 skipped (374)
$ npm run check
1790795799954 COMPLETED 2399 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
built in 4.55s
built in 11.33s
$ npm run format:check
Checking formatting...
All matched files use Prettier code style!
$ npm run lint
> eslint .
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
exit 0
$ npx vitest run tests/ui/controls/editor/theme.test.ts tests/ui/theme/colours.test.ts
 Test Files  2 passed (2)
      Tests  25 passed (25)
```

The last command is the slow-tagged file `npm test` leaves out; it holds the badge test of repair round 1 (row 7).

| # | Item of "What to build" | State | Proof (command and where) |
|---|---|---|---|
| 1 | Tokens | DONE | `themes/tokens.css:151-159`: `--tree-badge-size: 18px`, `--tree-badge-font: 11px`, `--graph-lane: 11px`, `--button-line: 16px`, `--button-font: 12px`, `--input-radius: 4px`. Every rule that reads a pre-scale token multiplies it by `var(--text-scale, 1)`; `tests/views/whole/type-scale.test.ts` (259 tests) passes. Literals left: section 7. |
| 2 | Section heads | DONE | `TreeItem.svelte:508-516` uppercase, weight 700, `--tree-heading-font`, ink colour; `tests/ui/tree/tree.test.ts` "draws a heading row in capitals, not small capitals, at weight 700 in the ink" fails on the unchanged tree, passes now. Shared with every heading row. |
| 3 | TreeItem props | DONE | `badge`, `countTitle`, `trailing`, `strong` and `--row-bg` in `TreeItem.svelte`; tests in `tests/ui/tree/tree.test.ts` (9 of its 25 fail on the unchanged tree, section 3). The badge colour pair departs from the brief (section 2). Four props besides the four named: section 6, item 8. |
| 4 | Primitives | DONE | `ToolButton` `primary` and `joined` (`:359-394`), `TextArea` `size` and `grow` (`:128-138`), `MenuOpener` `primary` (`:151-163`); `tests/ui/controls/tool-button.test.ts`, `tests/ui/forms/text-area.test.ts`, `tests/ui/menu/menu-opener.test.ts`. Sizes at text scale. |
| 5 | Repository row | DONE | `RepoList.svelte:126-200`; `tests/views/sources/repositories/repo-row.test.ts` (26 tests; 21 fail on the unchanged tree). Each control has 4px on its left and a 16px line at `TreeActions.svelte:46-52`. |
| 6 | Repo.svelte | DONE | branch and path lines only for a non-readable state (`Repo.svelte`, test "draws neither the branch line nor the path line"); commit box held 11px and 12px in at `Repo.svelte:270`. |
| 7 | Commit box | DONE | `CommitBox.svelte`, `messageRows` (`repositories.ts:694`), `actionButton` (`repositories.ts:715`); `tests/state/sources/repositories/commit-action.test.ts`, `tests/views/sources/repositories/commit-box.test.ts`, `tests/views/sessions/changes.test.ts`. The session panel draws no Push button. |
| 8 | Change groups and rows | DONE | `changes/{Changes,ChangeRow,FolderRow}.svelte`, `DiffSubject.group`, `stagePaths`/`unstagePaths`/`discardPaths`; `tests/views/sources/repositories/change-rows.test.ts`, `diff-pane.test.ts`, `tests/state/sources/repositories/view-state.test.ts`. |
| 9 | List and tree | DONE | `state/sources/repositories/change-tree.ts`, `Repositories.svelte:289-305` (the toggle, drawn in every state), `CommitFiles.svelte` folders; `tests/state/sources/repositories/change-tree.test.ts` (19), `tests/views/sources/repositories/tree-mode.test.ts` (23). A folder closing over the focused row takes the focus: tested for the change groups (`tree-mode.test.ts`, three cases; fails when the `nav.focus(id)` call in `changes/Changes.svelte:122` is taken out) and for a graph commit's files (`tree-mode.test.ts`, three more cases over `CommitFiles.svelte` given its files through `seed`; the first fails when the `nav.focus(id)` call at `CommitFiles.svelte:123` is taken out, repair round 1 row 8). |
| 10 | Lanes | DONE | `graph-lanes.ts:89-190` (`laneX`, `laneWidth`, `lanePaths`, `lanesBelow`, `commitCircles`); `tests/state/sources/repositories/graph.test.ts`. |
| 11 | Graph row | DONE | `graph/CommitRow.svelte`, `graph/GraphHead.svelte`, `Graph.svelte`; head actions drawn while the section is open; `tests/views/sources/repositories/graph-row.test.ts` (31). |
| 12 | Diff pane | DONE | `diff/DiffBar.svelte`, `diff/FileHeader.svelte`, `DiffSection.svelte`, `Diff.svelte`, `DiffView.unchanged/folded`; `tests/views/sources/repositories/diff-pane.test.ts`, `tests/state/sources/repositories/view-state.test.ts` (the reveal rules `revealAsked` and `revealDue`), `diff-view.test.ts`. |
| 13 | Words | DONE | `config/text/views/sources/repositories.yml`, `config/text/views/sessions/changes.yml`; `tests/checks/source/keys.test.ts` passes (a reader for every key, a literal at every read). |
| 14 | Docs | DONE | `DESIGN.md` (the view, the tree row, the graph head, the commit box insets), `HELP.md` lines 112, 130, 176, 180, 198; `LC_ALL=C grep -n '[^ -~]' HELP.md DESIGN.md` prints nothing. The `DESIGN.md:389` sentence on how the row's name part and detail take the width is the description of `.main` (`flex: 1 1 auto`, `TreeItem.svelte:327-329`), and its sentence on the detail size says the detail, count and mark are drawn at `--fs-sm` (repair round 1, rows 4 and 6). Head comments of the changed components are corrected. |

Stale-name grep, run from `tools/oculus` over `src tests config HELP.md DESIGN.md README.md` for the removed catalog keys and glyphs (`commit_title` of the old wording, `diff_side`, `list_sync`, `push_pending`, `push_title`, `side_by_side`, `inline_diff`): every remaining hit is a live key (`git.commit_title`, `repositories.commit_title`, `repositories.diff_inline`, `deposit.push_title`) or the test that asserts `repositories.diff_side` is gone.

Verify 3: the pixel literals left. The raw list is `grep -rn "px" src/lib/views/sources/repositories src/lib/views/shared/changes/CommitBox.svelte`, run on the final tree (51 lines). Sorted by the rule of item 1 they fall under:

- Literal in the element's own rule, a measure VS Code gives once for that element: `Repo.svelte:270` `padding: 0 12px 0 11px` (the message box and button insets); `CommitBox.svelte:236` `border: 1px solid` (box border), `:266` `padding: 3px 0 3px 6px` (field), `:272` `padding: 1px 3px 1px 1px` (box toolbar), `:228` `gap: 4px`, `:284` `gap: 2px` and `:285` `margin-left: 4px` (button row); `CommitRow.svelte:183` `margin-left: 4px`, `:184` `padding: 0 4px`, `:185` `border: 1px solid`, `:186` `border-radius: 10px`, `:190` `line-height: calc(18px * ...)`, `:204` `max-width: calc(100px * ...)` (the pill); `ChangeRow.svelte:208` `margin-left: 5px` (status letter), `:199-200` `gap: 4px` and `margin-left: 4px` (line counts); `FileHeader.svelte:78` `gap: 4px`; `RepoList.svelte:232-233` `gap: 1px` and `margin-left: 4px` (the behind and ahead counts of the Sync control); `Repositories.svelte:393` `--action-pad: 2px` and `:394` `--action-font: calc(16px * var(--text-scale, 1))` (the 16 px icon and its 2 px of padding, in the one rule that reads them).
- `CommitBox.svelte:254` `border-left: 1px solid var(--line)`: the terminal line of the box under `body.rice` (repair round 1, row 3).
- Literal that a single-element rule of the view already had and this step did not change: `Repositories.svelte:398` `gap: 6px`; `Repo.svelte:264,276,314` `gap: 6px`; `merge/Merge.svelte:273,284,298,304`; `merge/MergeSide.svelte:124,133,141-143`; `diff/DiffSection.svelte:163` (the observer's `rootMargin: '100% 0px'`), `:373`, `:385-387`; `diff/Diff.svelte:504,511,516-517,527`. The comparison of the base list and the finished list by content (`grep -rn "px"` in both trees, line numbers dropped, `comm -13`) prints as new only the lines named in the first two bullets and the comments of the next one.
- Pixel numbers in comments: `CommitFiles.svelte` (the 3 px lane), `Lanes.svelte` (3 px and 1 px), `CommitRow.svelte` (comment of the pill), `Repo.svelte` (comment of the insets), `Repositories.svelte:391` (comment of the icon controls).
- Sizes that more than one rule reads are tokens, not literals: badge size and font, button line and font, graph lane, input radius. The 16 px icon has one reader and is a literal.


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
 293 src/lib/state/sources/repositories/diff-hunks.ts (was 268)
 194 src/lib/state/sources/repositories/graph-lanes.ts (was 75)
 378 src/lib/state/sources/repositories/repositories.svelte.ts (was 364)
 756 src/lib/state/sources/repositories/repositories.ts (was 577)
 175 src/lib/themes/tokens.css (was 164)
 525 src/lib/ui/controls/editor/kit/colours.ts (was 523)
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
 287 src/lib/views/shared/changes/CommitBox.svelte (was 179)
 295 src/lib/views/sources/repositories/changes/Changes.svelte (new)
 216 src/lib/views/sources/repositories/changes/ChangeRow.svelte (new)
 112 src/lib/views/sources/repositories/changes/FolderRow.svelte (new)
 535 src/lib/views/sources/repositories/diff/Diff.svelte (was 505)
 100 src/lib/views/sources/repositories/diff/DiffBar.svelte (new)
 405 src/lib/views/sources/repositories/diff/DiffSection.svelte (was 344)
 129 src/lib/views/sources/repositories/diff/FileHeader.svelte (new)
 223 src/lib/views/sources/repositories/graph/CommitFiles.svelte (was 107)
 209 src/lib/views/sources/repositories/graph/CommitRow.svelte (new)
 430 src/lib/views/sources/repositories/graph/Graph.svelte (was 447)
 74 src/lib/views/sources/repositories/graph/GraphHead.svelte (new)
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
244 tests/state/sources/repositories/view-state.test.ts
112 tests/state/sources/repositories/diff-view.test.ts
193 tests/state/sources/repositories/graph.test.ts
894 tests/state/sources/repositories/repositories.test.ts
102 tests/ui/controls/tool-button.test.ts
70 tests/ui/forms/text-area.test.ts
63 tests/ui/menu/menu-opener.test.ts
440 tests/ui/tree/tree.test.ts
207 tests/ui/controls/editor/theme.test.ts
413 tests/views/sessions/changes.test.ts
313 tests/views/sources/repositories/change-rows.test.ts
302 tests/views/sources/repositories/commit-box.test.ts
345 tests/views/sources/repositories/diff-pane.test.ts
507 tests/views/sources/repositories/graph-row.test.ts
369 tests/views/sources/repositories/repo-row.test.ts
384 tests/views/sources/repositories/tree-mode.test.ts
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
9. Icon size and padding of the row controls: the brief wants a 16 px icon with 2 px of padding on the view's rows. `TreeActions.svelte` reads `--action-pad`, `--action-font` and `--action-glyph` with the values every other view has today as defaults, and the Repositories view sets them on `.repos` (`Repositories.svelte:393-395`; `--action-font` is the literal `calc(16px * var(--text-scale, 1))`, the one place the 16 px is read, and the token `--tree-action-icon` no longer exists). No other view's row controls change. Not checked on screen; the look on TEST decides whether the 22 px row holds a 16 px icon with its transparent 1 px border without crowding.
10. The 0.9 em of the folder after a change name and of the author after a commit subject is set in `ChangeRow.svelte` (`.folder`, `:191-195`) and `CommitRow.svelte` (`.author`, `:170-174`), each sized from `--tree-font` at 90%. `TreeItem`'s `.detail`, `.count` and `.end` keep the small size `--fs-sm` as on the base (`TreeItem.svelte:446-454`), so the detail text of every other view is unchanged.
11. Text scale: every new size that is a font, a line or a pill measure is multiplied by `var(--text-scale, 1)` (badge, pill line and name cut, button fonts and lines, the text area's tree size, the lane width and height). Borders, paddings, gaps and radii are literals and do not scale, as those of `TreeItem` do not.
12. The Graph head's actions are drawn while the section is open, as the measures table says of a pane header; the change groups' heads keep theirs when closed, since the table names only the pane headers.
13. The Branch control of the row keeps the open commit of the graph when the row is the repository already shown (`Repositories.svelte`, `showBranches`); it clears it when another repository is shown.
14. The folder row that closes over the focused row gives it the focus (brief item 9). For the change groups this is tested by rendering `Changes.svelte` with a navigation double and pressing the folder (`tree-mode.test.ts`; that test fails with the `nav.focus(id)` call in `changes/Changes.svelte:122` removed, checked by taking it out once). For a graph commit's files (`graph/CommitFiles.svelte`, `folderToggled`) the decision is the pure function `insideFolder` with the prefix `file:<hash>:` (`change-tree.test.ts`), and the wiring is tested by rendering `CommitFiles.svelte` given its files through the optional `seed` prop (a render runs no effect, so the read that normally fills the list does not run); that test fails with the `nav.focus(id)` call at `CommitFiles.svelte:123` taken out. Not verified in a browser.
15. `CommitFiles.svelte` has a new optional prop `seed` (`:53`, `:66`), the files the component starts with before its read replaces them, so a render test can draw the tree. It is read once, through `untrack`. Recommended: keep; the other way would have been no test of the hand-over.
16. The commit field under `body.rice` is drawn by a rule of `CommitBox.svelte` on its own `.box` (`:249-261`), not on `TextArea`'s classes, because `tests/checks/tree/boundaries.test.ts` refuses a view that styles a primitive's own class. The rule is `:global(body.rice) .box`, which has a higher specificity than the default `.box` (it adds `body.rice`) and comes after it, so no `!important` is needed.
17. A graph row holds `--row-bg` on `.commit` and `.head` (`CommitRow.svelte`, `GraphHead.svelte`) with `--panel` at rest and `--chip` under the pointer, and has no value for a selected row because no graph row is drawn selected (`grep -n selected` over `graph/*.svelte` finds no selected state passed to `TreeItem`). The hover highlight is painted on that holder, so it now spans the lanes as well as the row; before, it stopped at the row. Recommended: keep, since the ring of a circle is drawn in the colour of what is behind it.
18. Not built, as the brief's Decisions say: Stage All on the merge group, the graph head's Refresh and its pickers. Nothing else from the brief is left out.

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
- Graph row under the pointer: the highlight spans the lanes as well as the subject (item 17 of section 6); the circles keep a ring in the colour of what is behind them.
- Monaco-drawn surfaces (the diff editors and the pickers that use the editor theme): the badge is drawn in `--line` with `--on-line` text, the pair a tree row's count badge uses, and was `--muted` with its old ink (`ui/controls/editor/kit/colours.ts`); the lowest contrast over the 17 themes is 8.63 (nord).
- The glyph `side_by_side` and `inline_diff` and the words `diff_side`, `list_sync`, `push_pending`, `push_title` (sessions) are gone; the old `commit_title` words are reworded.

## 8. The look: states a repository on TEST must be in, and where each measure is set

| Element | State on TEST | Measures (file:line) |
|---|---|---|
| Title bar | any repository; the bar shows View as Tree then `...` | toggle `Repositories.svelte:289-305`; row height 22 and 13 px text `TreeItem.svelte:291,295`; heading capitals, 700, 11 px, ink `TreeItem.svelte:508-516` |
| Repository row | one repository ahead 1 and behind 2 (Sync with both counts); one with no upstream and a remote (Publish); a long branch name in a narrow pane (cut, controls give way); a second root that is no repository | weight 400 `RepoList.svelte:139`; 4 px left and 16 px line per control `TreeActions.svelte:46-52`; 16 px icon, 2 px padding `Repositories.svelte` `.repos`, `TreeActions.svelte:62-76`; counts `RepoList.svelte:232-233`; badge `TreeItem.svelte:481-497` |
| Commit box | empty message (one line); a message of 12 lines (grows to ten, then scrolls); a long line in a narrow pane | border, radius `CommitBox.svelte:236-237`; the rice form `CommitBox.svelte:249-261`; 11 px and 12 px insets `Repo.svelte:270`; field padding `CommitBox.svelte:266`; toolbar padding `CommitBox.svelte:272`; grow 1 to 10 `CommitBox.svelte:151-153`, `TextArea.svelte:132-138`; 13 px text `TextArea.svelte:128-130` |
| Action button, Commit | something staged or changed; nothing typed (disabled with its reason) | `ToolButton.svelte:359-370` (4px 8px, 16 px line, 12 px, radius, accent), dropdown `MenuOpener.svelte:151-163`, separator `ToolButton.svelte:386-395` |
| Action button, Sync Changes | clean tree, branch ahead or behind | same rules; `actionButton` `repositories.ts:715` |
| Action button, Publish Branch | clean tree, branch with no upstream and a remote | same rules |
| Change group | staged, changed and untracked paths present; three paths in one group | badge `TreeItem.svelte:481-497`; head controls `changes/Changes.svelte` group head snippet; `tokens.css:151-159` |
| Change row | a modified, a deleted, an added and a renamed path; a merge in progress for the merge group | folder 0.9 em of `--tree-font`, opacity 0.7, 0.5 em `ChangeRow.svelte:191-195`; status letter 5 px, 90%, 600, 0.75 `ChangeRow.svelte:203-216`; strike `TreeItem.svelte:414`; controls 16 px icon, 2 px padding as the repository row |
| Tree mode | paths `src/a/x.ts`, `src/a/y.ts`, `readme.md`, a chain `a/b/c/one.ts`; a folder closed while its file holds the focus | `change-tree.ts:42` and sort `:36`; folder row `changes/FolderRow.svelte:73`; focus hand-over `changes/Changes.svelte:118-123` and `graph/CommitFiles.svelte` `folderToggled` |
| Graph lanes | a branch with a merge, several lanes, a commit open (verticals beside its files, 3 px on the open lane) | `graph-lanes.ts:89-190`; SVG size `graph/Lanes.svelte:58-59`; widths `:65`, caps `:91`; `--graph-lane` `tokens.css:153` |
| Graph row with pills | a commit with `main`, `origin/main` and a tag; HEAD's commit (strong, larger circle) | pill `graph/CommitRow.svelte:176-191`; author `:168-174`; ring holder `:144-161`; strong `:97`; trailing `:99` |
| Incoming and Outgoing | branch ahead and behind (dashed circles) | `graph/GraphHead.svelte:45`, circles `graph-lanes.ts:176`; Load More link row `GraphHead.svelte:39`, `TreeItem.svelte:434-440` |
| Diff bar | a file's own diff (Open File present); a commit's diff (absent); inline mode (checked item) | `diff/DiffBar.svelte:58-94` |
| File header | a stash diff of several files; a rename; fold one file | `diff/FileHeader.svelte:72-129` (sticky `:73`, 22 px `:80`, R at 90% `:120`) |

## 9. Anything in the brief that was wrong or impossible

- Badge colours (item 3, "What to build"): `background: var(--muted)`, `color: var(--c-on)` is below 4.5:1 in 13 of 17 themes. Evidence: a throwaway test in `X3d-base/tests/checks/look/` that called `ratio()` of `themes/derive.ts` over `NAMES` of `tests/checks/look/themes.ts` and wrote to a file, run with `npx vitest run tests/checks/look/probe-badge.test.ts`, deleted after (`ls tests/checks/look` prints contrast.test.ts, lane-distance.test.ts, themes.ts). Output: `themes 17; below 4.5 with the brief pair: 13; with the built pair: 0`; lowest of the built pair is nord, 8.63. Per-theme figures are in section 2.
- Joined button separator (item 4): `--c-on` at 40% is the fixed on-chip ink, not the button's text colour; the button's words are `--on-accent`, so the separator uses `--on-accent` at 40% (`ToolButton.svelte:393`).
- The read list says `Menu.svelte` is not changed; `MenuOpener`'s new look needs its prop passed through it (section 6, item 2).
- The measures table has a `...` on the repository row that item 5 does not list (section 6, item 7).
- Nothing was impossible.

## Repair round 1

Every row is DONE. Row 1 differs from its wording in one point, stated in the row. Not verified: the look on TEST (rows 1, 3 and 4), which the landing checks. "Round's base" is the tree as first handed in, with the tests of this round added to it; its failures are quoted from `red.txt`, and the failures with the new rules taken out again (names as in the final tests) from `red2.txt`, both in the session's scratch directory, both from `npx vitest run` on the files named.

| # | Ruling | State | Proof |
|---|---|---|---|
| 1 | Graph circles keep their ring | DONE, except that no selected value is set | `CommitRow.svelte:144-161` and `GraphHead.svelte:52-68`: `.commit` and `.head` hold both the lanes and the row, set `--row-bg: var(--panel)` at rest and `--chip` under the pointer (TreeItem's two values for those states) and paint the pointer's background on themselves, so it spans the lanes. No value for a selected row, because no graph row is drawn selected (`grep -n selected graph/*.svelte` finds comments only); TreeItem's third value, `--accent-bg`, has no row to belong to here. Tests in `graph-row.test.ts`, "the ring of a circle" (they derive the holder's class from the render, so they fail if the lanes are drawn outside it). Round's base: `x the ring of a circle > audits that a commit row set --row-bg, in the three states, on the element that holds their lanes -> expected [] to deeply equal [ 'var(--accent-bg)', ...(2) ]` and `x ... draws the lanes of a commit row inside the element that sets --row-bg -> expected '<!--[--><li role="none" class="commit...' to match /<li[^>]*class="commit[ "][^>]*>(?:<!-...../`. With the rules taken out again: `x ... audits that a commit row draw their lanes in an element that sets the row's --row-bg at rest and under the pointer -> expected [] to deeply equal [ { selector: '.commit', ...(1) }, ...(1) ]`, and the same for the Incoming and Outgoing rows (`selector: '.head'`). Final tree: the file prints 31 passed. The look on TEST is not verified. Decision made here, surfaced: the hover highlight now covers the lanes (section 6, item 17). |
| 2 | Next Change onto a folded, drawn file reveals the change | DONE | `state/sources/repositories/diff-hunks.ts` `revealAsked(ready, hunk)` and `revealDue(pending)`; `DiffSection.svelte:42-43,178,191` keeps `pending` and performs it when `changed()` reports. Tests: five in `view-state.test.ts` "a reveal asked of a diff section", two wiring audits in `diff-pane.test.ts`. Round's base: `x ... is done at once by a section whose editor is drawn and has reported its changes -> revealAsked is not a function`, `x ... does nothing when the editor reports its changes and none is kept -> revealDue is not a function`, `x a section asked to reveal a change before its editor is back > audits that asks the pure rule when a reveal comes and keeps what it returns -> expected 'export function reveal(hunk: number):...' to contain 'revealAsked('`, `x ... audits that performs the kept reveal when its editor reports its changes -> expected 'function changed(next: LineChange[]):...' to contain 'revealDue(pending)'`. Final tree: `npx vitest run` over the eight files of this round (theme, graph-row, commit-box, tree-mode, view-state, diff-pane, change-rows, tree) prints `Test Files  8 passed (8)` and `Tests  169 passed (169)`. |
| 3 | The commit field under `body.rice` draws the terminal form | DONE; the look on TEST is not verified | Rules, in order: default (no `body.rice`), `.box` `CommitBox.svelte:232-239` draws the 1px `--line` border, `--input-radius` and `--panel` fill (`body.wall` makes the fill transparent, `:241-243`; the accent border on focus, `:245-247`), and the field in it is TextArea's `.area.bare` (no border, no fill, no padding). Under `body.rice`, `CommitBox.svelte:249-261` `:global(body.rice) .box` (after `.box` and with `body.rice` added to its specificity, no `!important`) removes the border, radius and fill and draws the line at the left, in the accent while the box holds the focus; the field in it is `.area.bare`, whose `body.rice` variant (`TextArea.svelte:116-122`) keeps it without border, fill or padding, and `:global(body.rice) .area` (`TextArea.svelte:154-160`) gives it the mono font. The rule sits on the box and not on TextArea's classes because `tests/checks/tree/boundaries.test.ts` refuses a view that styles a primitive's own class. Tests: three audits in `commit-box.test.ts`, "the message field under body.rice". Round's base: `x the message field under body.rice > audits that draws the terminal form of a text area: a line at its left, no radius, the mono font -> expected '' to contain 'border-left: 1px solid var(--line)'`. With the rule taken out again: `x ... audits that draws the terminal form of a text area: a line at its left, no radius, no fill -> expected '' to contain 'border-left: 1px solid var(--line)'`. Final tree: passes. |
| 4 | `.detail` keeps `--fs-sm`; `.folder` and `.author` size from `--tree-font` | DONE | `TreeItem.svelte:446-454` (`.detail, .count, .end` with `font-size: var(--fs-sm)`); `ChangeRow.svelte:191-195` `.folder` and `CommitRow.svelte:170-174` `.author`: `font-size: calc(var(--tree-font) * var(--text-scale, 1) * 0.9)`. The sentence on the detail size is corrected in section 6 item 10 and in `DESIGN.md:389`. Tests: `tree.test.ts` "audits that draws the detail, the count and the end at the small size", `change-rows.test.ts` folder audit, `graph-row.test.ts` author audit. Round's base: `x ... audits that draws the detail, the count and the end at the small size, as every tree view does -> expected '.detail,\n    .count,\n    .end {\n  ...' to contain 'font-size: var(--fs-sm)'`, `x ... audits that draws the folder at 0.9 of the row size, opacity 0.7 and 0.5em from the name -> expected '.folder {\n        margin-left: 0.5em...' to contain 'font-size: calc(var(--tree-font) * va...'`, `x ... audits that draws the author at 0.9 of the row size, opacity 0.7 and half an em from the subject -> expected '    .author {\n        font-size: 0.9...' to contain 'font-size: calc(var(--tree-font) * va...'`. Final tree: pass. The look on TEST is not verified. |
| 5 | `--tree-action-icon` becomes a literal | DONE | `Repositories.svelte:394` `--action-font: calc(16px * var(--text-scale, 1));`; `grep -rn 'tree-action-icon' src DESIGN.md HELP.md config` prints 0 lines. Test: `change-rows.test.ts` "audits that draws a 16px icon with 2px of padding round it, in this view only" (reads the literal and asserts the token is absent from `tokens.css`). Round's base: `x ... > audits that draws a 16px icon with 2px of padding round it, in this view only -> expected '    .repos {\n        --action-pad: 2...' to contain '--action-font: calc(16px * var(--text...'`. Final tree: passes. |
| 6 | The false `DESIGN.md:389` sentence | DONE | `DESIGN.md:389` now says the name part is `.main` with `flex: 1 1 auto` (`ui/tree/TreeItem.svelte:327-329`) and takes the row's free width with the detail inside it, and that the detail, count and mark are drawn at the small size `--fs-sm`, with a view sizing a larger detail from `--tree-font` in its own rule. `--tree-action-icon` is gone from it. `LC_ALL=C grep -n '[^ -~]' DESIGN.md HELP.md` prints nothing. |
| 7 | Monaco badge pair | DONE | `ui/controls/editor/kit/colours.ts:385-386`: `'badge.background': '--line'`, `'badge.foreground': '--on-line'`. Lowest contrast over the 17 themes, from a throwaway probe test over `ratio()` of `themes/derive.ts` and `themeTokens` of `tests/checks/look/themes.ts` (deleted after the run): `PROBE pair --line / --on-line; themes 17; below 4.5: 0; lowest nord 8.63`. Test: `theme.test.ts` "the badge of a Monaco-drawn surface ... at 4.5:1 in every theme" (a slow-tagged file, run by name). Round's base: `x ... is painted from the pair a tree row draws its count badge with, at 4.5:1 in every theme -> expected '--muted' to be '--line' // Object.is equality`. Final tree: `npx vitest run tests/ui/controls/editor/theme.test.ts tests/ui/theme/colours.test.ts` prints `Tests  25 passed (25)`. |
| 8 | Test for CommitFiles' focus hand-over | DONE | `tree-mode.test.ts` "a folder of a graph commit that closes over the row that holds the focus" (three cases) over `CommitFiles.svelte` given its files through the new `seed` prop. Round's base (no `seed`): `x ... takes the focus itself -> expected '<!--[--><!--[1--><li role="none"><div...' to contain 'data-commit-file'`. With the hand-over removed (a scratch copy of `CommitFiles.svelte` with line 123, `if (closing && holding) nav.focus(id);`, replaced by a comment, and a scratch copy of `tree-mode.test.ts` importing it, both deleted after the run; `npx vitest run tests/views/sources/repositories/tree-mode-scratch.test.ts -t 'graph commit'`): `x a folder of a graph commit that closes over the row that holds the focus > takes the focus itself -> AssertionError: expected [] to deeply equal [ Array(1) ]` with `- "dir:/hub:commit-cccccccccccccccccccccccccccccccccccccccc:src"` expected and `+ []` received, and `Tests  1 failed \| 2 passed \| 20 skipped (23)`. Final tree: the three cases pass. |
| 9 | First-run failures of the 14 narrow cases | DONE | Section 3b quotes the first line of the error of each of the 14 (5 toggle cases, 7 Graph head cases, 2 Lanes cases), from `npx vitest run tests/narrow-r1` in `X3d-base/tools/oculus`, which loaded them: `Tests  14 failed (14)`. The 14 copies were removed from `X3d-base` after the run. |
| 10 | Checks, pixel grep, first line | DONE | The check block and the pixel list of section 4 are from the final tree: `checks: 7 commands passed`; `LC_ALL=C grep -rna '[^ -~]' src tests` prints 0 lines. The first line of this report says what is not verified. |

Checks of section 4, verbatim from the final tree:

```
checks: 7 commands passed
Test Files  360 passed | 19 skipped (379)
Tests  5539 passed | 558 skipped (6097)
Test Files  27 passed | 2 skipped (29)
Tests  365 passed | 9 skipped (374)
1790795799954 COMPLETED 2399 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
built in 4.55s
built in 11.33s
All matched files use Prettier code style!
```

Files written by repair round 1 beyond those of the first handback: `src/lib/state/sources/repositories/diff-hunks.ts`, `DiffSection.svelte`, `CommitRow.svelte`, `GraphHead.svelte`, `CommitBox.svelte`, `TreeItem.svelte`, `ChangeRow.svelte`, `Repositories.svelte`, `themes/tokens.css`, `ui/controls/editor/kit/colours.ts`, `CommitFiles.svelte`, `DESIGN.md`, and the tests named in the rows. Section 5 holds the counts.
