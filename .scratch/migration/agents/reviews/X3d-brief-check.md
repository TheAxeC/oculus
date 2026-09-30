# Step X3d brief check (on main at 3ab29091)

Not done: three points are under "Declined to judge" (whether VS Code's modern UI experiment is on in Axel's install, the full order of VS Code's diff editor title actions, the order of controls on VS Code's repository row). Nothing was written, no git state changed, no server or browser started, `config/local.yml` not read. Every other check asked for was run.

Commands are run from `tools/oculus` unless a path says otherwise. `VSC` stands for `/Applications/Visual Studio Code.app/Contents/Resources/app`.

## 1. Names

Greps run: `grep -rnIE -e '<name>' src tests config DESIGN.md HELP.md README.md docs --exclude=local.yml`.

- `messageRows`, `actionButton`, `changeTree`, `laneX`, `lanePath`, `commitCircles`, `view_tree`, `goto_current`: no hit anywhere. No collision.
- `--badge-size`, `--badge-font`, `--button-line`, `--button-font`, `--input-radius`: no hit. No collision.
- Glyph names `stage`, `unstage`, `discard`: `grep -nE "^\s*(stage|unstage|discard|view_tree|goto_current|plus|minus|undo|target):" config/catalogs/glyphs.yml config/catalogs/icons.yml` prints nothing. No collision in the catalogs.
- `mode`: `DiffView.mode` (`'side' | 'inline'`) already exists at `src/lib/state/sources/repositories/repositories.ts:152-159`, in the same module the new `RepositoriesView.mode` (`'list' | 'tree'`) goes into. Two fields of one name and two meanings in one file; not a break, since they sit on different types.

Findings:

1. `--lane` collides. `src/lib/views/boards/focus/lanes/LaneHead.svelte:30` sets `--lane: var(--c-${tone}-lane)` inline and reads it at `:51` as a background colour; `tests/views/boards/focus.test.ts:131,150,338` assert that inline style. A `:root` token `--lane: 11px` gives one custom property two meanings (a colour and a length). The brief's item 1 should name the token otherwise, for example `--graph-lane`.
2. `badge` collides as a word with three existing badges that are other shapes: `TabStripItem.badge` (`src/lib/ui/tabs/tab-strip.ts:18`, tokens `--tab-badge-min/pad/line` at `tokens.css:139-141`), `MenuItem.badge` (`src/lib/ui/menu/menu-items.ts:23`, custom properties `--badge-bg`/`--badge-fg` at `src/lib/ui/menu/MenuList.svelte:58,246`), the rail badge (`src/lib/shell/rail/RailPages.svelte:245`), and the local class `.badge` in `RepoList.svelte:110,133` that draws the shape words ("gone", "no repository") at the row's end. The new `--badge-size`/`--badge-font` sit next to `--badge-bg`/`--badge-fg` of another component. The brief should name the tokens for what they are (`--tree-badge-size`, `--tree-badge-font`) and say what happens to RepoList's own `.badge` span and class.
3. The old glyphs stay in use for the same actions outside the paths, so one action gets two icons. `grep -rnE 'glyph="(note_back|expand|collapse)"' src/lib/views/sources/repositories src/lib/views/shared/changes` prints `views/shared/changes/ChangeGroups.svelte:76,84,91,99` (the session Changes panel's Stage, Unstage, Discard; not in the paths), `diff/DiffSection.svelte:207,216,224` (the hunk bars, which item 11 says stay), `refs/Stashes.svelte:76`, `graph/Graph.svelte:398`. `Changes.svelte`'s head comment (lines 19-21) says the two lists agree. The brief should either add `src/lib/views/shared/changes/ChangeGroups.svelte` (and `tests/views/sessions/changes.test.ts` is already listed) and say the hunk bars take `stage`/`unstage`/`discard`, or say in "Decisions" that the session panel and the hunk bars keep the circled icons.
4. `discard` is a second name for an icon that has one: `config/catalogs/icons.yml:20` is `note_back: undo-2`. The brief should say whether `note_back` stays for the other users or is replaced.
5. The removed layout toggle leaves glyph and text keys without a reader: `side_by_side`, `inline_diff` (`config/catalogs/glyphs.yml:54-55`, `icons.yml:53-54`, read only at `diff/Diff.svelte:338,345`), `repositories.diff_side`, `repositories.list_sync`, `repositories.list_changes` (`config/text/views/sources/repositories.yml:73-74`, read only at `RepoList.svelte:68,118`), `git.commit_more` if the dropdown's label changes. `tests/checks/source/keys.test.ts` fails on a key with no reader. All are in listed paths; the brief should list the keys and glyph names that go, so the builder does not keep a dead reader to hold them.
6. A heading row is drawn outside `TreeSection`: `src/lib/views/sources/files/tree/Tree.svelte:273` passes `heading` to `TreeItem` directly (`grep -rnE "^\s*heading\s*$" src/lib --include='*.svelte'`), asserted at `tests/views/sources/files/files.test.ts:173-179`. Decision 1 lists the views reached through `grep -rln TreeSection` and so misses that the Files tree's root rows also become uppercase, weight 700, ink. Decision 1 should name it.
7. Sentences the change makes false outside "Paths this step writes" (which names `DESIGN.md` line 373 and `HELP.md` line 112 only): `HELP.md:176` ("The button beside the field writes a message", "its list beside it"), `HELP.md:180` ("stays side by side in a narrow pane while Side by Side is chosen", "list each file under its path", the bar), `HELP.md:198` (the graph row: "the branch and tag names on it, and the checked-out commit marked", Load More), `HELP.md:130` (the session panel's commit box), `DESIGN.md:389` (TreeItem's "a count or mark"; it already says the parts after the name "follow it rather than the pane's far edge", which `TreeItem.svelte:273-275` contradicts today). Item 13 says every false sentence in the two files is corrected, the path list allows two lines. The path list should name the two files whole.

## 2. The step line

- The title bar and its actions: item 8 (the list and tree toggle before `...`). The `...` menu is unchanged.
- The repository rows: item 4.
- The commit box and its button: item 6.
- The change groups and rows with their icons, status letters and hover actions: items 3 and 7. "Icons" is answered by decision 5 (no file-type icon until X3a).
- List and tree modes: item 8.
- The graph with its lanes: items 9 and 10.
- The incoming and outgoing rows: item 10, decision 6.
- The diff editor's header and actions: item 11.
- Sizes, spacing, colours and interactions read from VS Code's stylesheet and layout code: the table "VS Code's measures", item 1 (tokens), item 2 (heads).
- Each compared side by side on TEST: no item. The brief gives it to the landing ("The look ... is the landing's"), and the report asks for a table of every measure with the file and line where oculus sets it.
- The features X3b and D13b built stay: the paragraph "What oculus does better" and "What it must do".

Findings:

1. "Each compared side by side on TEST" has no list of what is compared. The report's measure table gives the file and line per measure but no state to put each view in. The rules file ("What every package obeys", the look) says the report's before-and-after names the view, the state and what should differ. The brief's Report section should ask for one row per element of the step line with the TEST state that shows it (a repository ahead and behind, a merge in progress, a commit open in the graph, a stash diff of several files, tree mode).
2. A change group's hover actions in VS Code include Open Changes on the group head (`VSC/extensions/git/package.json`, `scm/resourceGroup/context`: `git.viewStagedChanges`, `git.viewChanges`, `git.viewUntrackedChanges` at `inline@1`) and Stage All on the merge group (`git.stageAllMerge inline@2`). Item 7 builds neither and no decision says so. The brief should list both under "Decisions" as not built, or build them.

## 3. Premises

Confirmed by rerun (command, then what it printed):

- `grep -m1 '"version"' "VSC/package.json"`: `"version": "1.137.0"`. `wc -l .scratch/migration/agents/reviews/X3d-vscode-scm.css`: 130.
- `find src/lib/views/sources/repositories -type f | xargs wc -l`: 19 files, 3915 total; Repositories 365, RepoList 140, Repo 294, Changes 378, Graph 447, Lanes 69, CommitFiles 107, Diff 505, DiffSection 344.
- `wc -l`: CommitBox 179, TreeItem 463, TreeSection 86, repositories.yml 220. `grep -rln CommitBox src/lib`: `ChangesRepo.svelte`, `Repo.svelte`.
- `sed -n 145,148p src/lib/themes/tokens.css`: `--tree-row: 22px`, `--tree-font: 13px`, `--tree-indent: 12px`, `--tree-heading-font: 11px`. `TreeItem.svelte:419-427`: small caps and the muted colour.
- `grep -rn "viewMode\|asTree" src/lib/state/sources/repositories src/lib/views/sources/repositories`: nothing.
- `Lanes.svelte:41,45,58`: Bezier `C`, `r="0.16"`, `stroke-width: 0.08`.
- `grep -n statusStyle src/lib/state/sources/repositories/repositories.ts`: line 511.
- `grep -rn "glyph=" src/lib/views/sources/files/*.svelte`: `Files.svelte:454,458`, both `Empty`.
- The glyph names the brief says exist are all in `config/catalogs/icons.yml`; `ls node_modules/lucide-static/icons/ | grep -E "^(plus|minus|undo-2|list-tree|locate-fixed)\.svg$"` prints all five.
- `RailPages.svelte:260-261`: `background: var(--accent); color: var(--on-accent);`.
- `ls tests/state/sources/repositories`: seven files. `sed -n 373p DESIGN.md` and `sed -n 112p HELP.md` are the view's lines.
- The state file's recent landings quote `checks: 7 commands passed`.

Findings on "What is on the tree":

1. `tokens.css:71-77` holds `--c-scm-added`, `-modified`, `-deleted`, `-conflict` and the three `-bg` forms (`sed -n 68,78p`), not the `-txt` forms; the comment at 69-70 says `derive.ts` mints `-txt`. The brief's bullet should say so.
2. "In a diff of several files each file starts with its path as a bold line" is incomplete: `Diff.svelte:424` is `headed={several || !acts}`, so a one-file diff nothing may act on (a commit's change to one file) draws the path too. Item 11 only speaks of several files; it should say what that one-file diff draws.
3. The bar's Open File is conditional: `Diff.svelte:366`, `{#if held.path !== '' && !held.worktree && (held.commit ?? '') === ''}`. The bullet lists it as always there, and case 22 asserts it without naming the state.
4. The commit row's date is `stamp(one.when)` (`Graph.svelte:295`), which `src/lib/state/shared/words/format.ts:58-70` makes the clock for today and date with clock earlier; the hover words carry `one.when.slice(0, 10)` only (`Graph.svelte:258-263`, `repositories.yml:37`). Item 10 and decision 3 say the date "stays in its hover words"; the time of day does not. The brief should extend `repositories.commit_title` or say the time goes.

Rows of "VS Code's measures":

Confirmed against the saved stylesheet and the installed files:
- Every row 22 px, line-height 22 px: saved lines 23, 24.
- Pane header 22 px, 11 px, 700, uppercase, actions hidden until hover or focus: `.monaco-pane-view{...--pane-header-size: 22px}`, `.pane>.pane-header{height:var(--pane-header-size);...font-size:11px;font-weight:700...}`, `.pane>.pane-header>.title{text-transform:uppercase}`, `.pane>.pane-header>.actions{display:none...}` (perl extracts over `workbench.desktop.main.css`). The actions show only on an expanded pane (`...pane-header.expanded>.actions`), which the row does not say.
- Message box: saved lines 65, 66, 71, 4 (11 px left, 12 px right, 1 px border, radius 4 px, toolbar padding). `"scm.inputMaxLineCount":{...default:10}` and `inputMinLineCount` read as 1 in the script. Placeholder: `grep -rhoE 'Message \([^"`]{0,80}' VSC/extensions/git/dist` prints `Message ({0} to commit on ` and `Message ({0} to commit)`.
- Action button: `.monaco-text-button{...width:100%;padding:4px 8px;border-radius:4px;...border:1px solid ...;line-height:16px;font-size:12px...}`, `.monaco-dropdown-button{...padding:0 4px...}`, `.monaco-button-dropdown-separator{padding:4px 0...}` with a 1 px child.
- What the button says: `{0} Sync Changes{1}{2}`, `Publish Branch`, `$(cloud-upload)`, `$(sync)` in `VSC/extensions/git/dist`.
- Count badge: `.monaco-count-badge{padding:3px 5px;border-radius:11px;font-size:11px;min-width:18px;min-height:18px;line-height:11px;...}`.
- Change row: `.label-description{opacity:.7;margin-left:.5em;font-size:.9em...}`, `.monaco-icon-label.strikethrough ... {text-decoration:line-through}`, `.monaco-icon-label:after{opacity:.75;font-size:90%;font-weight:600;margin:auto 16px 0 5px...}`, saved line 64 (`padding:2px`). Hover order Open File, Discard, Stage: `scm/resourceState/context` has `git.openFile2 inline@1`, `git.clean inline@2`, `git.stage inline@2`.
- List and tree: `"scm.defaultViewMode":{...default:"list"}`, `"scm.compactFolders":{...default:!0}`.
- Lanes: `var R0=22,mf=11,gIe=5,RY=4,cae=2`; width `mf*(Math.max(t.length,i.length,1)+1)`; lane x `mf*(n+1)`; `stroke-linecap","round"`, `stroke-width` 1 px; circles: commit `RY+1`=5, merge `RY+2`=6 and `RY-1`=3, HEAD `RY+3`=7 and radius `cae`=2 with stroke `RY`=4; incoming and outgoing 7, 5 and a dashed ring of 5, `strokeDasharray="4,2"`, 1 px. Saved line 28: 3 px on the last path of an open item.
- Graph row text: saved lines 40-45, 48, 50. Load more: saved lines 120, 123.

Found different:

5. Repository row, "the name at weight 700". The Repositories pane draws it at 400. `grep -bo` over the installed stylesheet: `1168876:.scm-view .scm-provider .monaco-highlighted-label{...font-weight:700}` and `1182412:.scm-view.scm-repositories-view .monaco-highlighted-label{font-weight:400}` (saved lines 12 and 99). Both selectors have three classes, the second comes later, so it wins in the REPOSITORIES pane. 700 is the provider row inside the Changes list and the graph (`.scm-history-view .scm-provider .label-name`, saved line 112). Item 4 and the row should say 400, or the brief should say why oculus takes the other pane's weight.
6. Lanes, "a lane that moves sideways does so with quarter circles of radius 5". In the drawing function (`iqo`, extracted with perl around `function e8n`), radius 5 is only the lane that continues while shifting columns: `V 6`, `A 5 5`, `H`, `A 5 5`, `V 22`. A lane that ends in the commit from another column is `M 11(l+1) 0 A 11 11 0 0 1 11l 11 H 11(r+1)`, and a merge parent is `M 11u 11 A 11 11 0 0 1 11(u+1) 22` plus `M 11u 11 H 11(r+1)`: one arc of radius 11 and a horizontal run. Oculus's `laneRows()` never shifts a continuing lane (`graph-lanes.ts:8-9`, "Lanes are never moved sideways"); its only sideways strokes are exactly the join into a commit (`:51`) and the merge parent (`:68`). So item 9's "quarter circle of radius 5, a straight run and a second quarter circle" and case 11's "two arcs of radius 5 and one horizontal run" describe a stroke oculus never draws and give the wrong shape for the two it does. The row, item 9 and case 11 should give the radius 11 forms; `lanePath(from, to)` also needs the half it draws (top into the dot, or dot to the foot), which two lane numbers do not say.
7. Lanes through an open commit's file rows. VS Code draws a placeholder of verticals beside each change row of an open commit (`eqi`: `let i=t===o?3:1` over every lane; saved line 117 `.history-item-change>.graph-placeholder`). The table's "3 px on the lane of an open commit" is that. Oculus's `CommitFiles.svelte` rows carry no lanes, and items 9 and 10 add none, so with a commit open the lanes break across its files. The brief should add the placeholder to item 9 (CommitFiles is already in the paths) or decide against it.
8. The graph's header actions. `scm/history/title` in `VSC/extensions/git/package.json`: `git.fetchAll@900`, `git.pullRef@901` (no condition), `git.pushRef@902` when the ref has a remote, `git.publish@903` when it has none. The row and item 10 drop Pull without an upstream and draw no Publish. The workbench also registers `workbench.scm.action.graph.refresh`, `pickRepository` and `pickHistoryItemRefs` there. The brief should draw Publish in Push's place, keep Pull or say why not, and list Refresh and the two pickers as not built.
9. A file of a diff of several files, "the file's added and removed counts". VS Code's header template is `div.collapse-button`, `div.file-path` holding `div.title.modified`, `div.status.deleted` ("R") and `div.title.original`, then `div.actions` (perl extract around `div.header-content`). No counts; a rename shows the status and the old path. The row should say the counts are oculus's addition and add the rename's old path.
10. Graph row text, "weight 600 on HEAD's commit": saved line 49 also sets the description (the author) semi-bold on the current item. The row and item 10 give 600 to the subject only.
11. The diff editor's actions: the editor title also holds `diffEditor.toggleCollapseUnchangedRegions` as a navigation icon (`menu:{when:isInDiffEditor,id:EditorTitle,order:22,group:"navigation"}`). Oculus hides unchanged runs always (`DiffSection.svelte:264`). The row omits it; the brief should list it as not built.
12. The circle ring colour. Saved lines 31-39 change the ring and the inner fill to the hover and selection backgrounds on a hovered, focused or selected row. The row and item 9 say "a 2 px ring in the panel colour" only, which leaves a halo on a hovered row (`TreeItem.svelte:257-259`, `--chip`) and a selected one (`--accent-bg`).

Could not settle: see "Declined to judge" (modern UI, the repository row's control order, the diff title's order).

## 4. Cases and checks

Read against the rules file's "What every package obeys" (the unit suite renders to a string; a press needs a DOM; an assertion over source text is an audit; every id or key exercised empty, duplicated and colliding; every asynchronous path in flight, after close and superseded).

- Cases 1-12: pure functions, consistent.
- Cases 13-16, 18, 22: server renders asserting markup, consistent. The absences in 14, 16, 18 and 21 each need a reason comment above them (`tests/checks/tree/negatives.test.ts`, head comment); the brief's Conventions do not say so.
- Cases 17, 19, 20, 23: presses. The suite's way is the recorder of `tests/views/sessions/presses.test.ts:1-30` (a mocked primitive whose handler the case calls). Consistent if written that way; the brief does not say so.

Findings:

1. Case 24 cannot be a test. `vite.config.ts:31` is `environment: 'node'` and the view tests use `render` from `svelte/server`; uppercase, weight 700 and the ink colour are in `TreeItem.svelte`'s `<style>`, which is not in the rendered body. Only a read of the source text can assert it, which the rules file calls an audit. The brief should mark case 24 an audit by name or drop it for the look on TEST.
2. Case 21 cannot be drawn as the tree stands. A commit row is the snippet `row` inside `Graph.svelte:240-304`, filled from `commits`, which `load()` sets after a `fetch` started in an `$effect` (`Graph.svelte:117-129,176-201`); a server render runs no effect, and `tests/views/sources/repositories/repositories.test.ts:6-8` says so ("the reads the graph ... make, none of which a server rendering runs"). The same holds for Incoming, Outgoing, Load more and Go to Current. The brief should name a component for the row (for example `graph/CommitRow.svelte`; `graph/` holds three items) in the paths, so the case has something to render.
3. Case 13's and 15's "as before" half, and case 16's "no number": fine as markup, but case 15's second half (a `count` without `badge` "draws the count as before") already passes on the unchanged tree and no revert of the step turns it red. Under Verify 3 it carries "audit" in its name; the brief should say so.
4. No case exercises the new ids as the rules file asks: `dir:<group>:<path>` empty, duplicated (the same folder in two groups, the same folder in two repositories, since `collapsed` is one list per instance, `Repositories.svelte:309-310,321-324`) and colliding with a section or group id (`changes`, `graph`, `staged`, `repos`, `Repo.svelte:92-94` strips `group:`). No case exercises the `folded` keys of the diff pane against `fileKeys()`'s NUL form (`repositories.ts:189-198`) or a file that leaves the diff (`diffViewOf` prunes `views`, `:173-181`).
5. No case exercises the new asynchronous paths in flight: the Sync, Publish, Fetch, Pull, Push controls and the folder row's Stage while `repositories.busy(root)` is true (the store refuses a second write, `repositories.svelte.ts:168-176`).
6. Verify 4's grep (`grep -rn "px" ...`) is a count of literals with a reason each; item 1 says "Every size below reads a token; none is a literal in a component", while items 3, 6 and 10 give sizes no token is named for (`padding: 3px 5px`, radius 11 px, 6 px, `padding: 4px 8px`, radius 10 px, `line-height: 18px`, 100 px, 4 px). The two cannot both hold. The brief should name a token for each or say which stay literals.
7. Verify 3 ("each new or changed test names the revert that turns it red") against the rules file's "there is no browser suite and no revert directive, and a step adds neither": consistent only if the revert is a comment, as `tests/views/sources/files/files.test.ts:173` does. The brief should say "in a comment".

## 5. The question

Could this pass without the goal (the view and the diff look and work as VS Code's Source Control, nothing lost) being reached?

Cases:
- 1-5 (`changeTree`): no for the rows' shape. Yes for order: "each sorted by name" names no collation, so `B.ts` before `a.ts` or after both pass.
- 6: no.
- 7: yes. `messageRows` counts newlines; one long line that wraps in a narrow pane is one row and scrolls, where VS Code's box grows with wrapped lines.
- 8: yes. "An upstream" is not defined over `GitState.upstream?: boolean | null` (`model-sessions.ts:491`, null is "not answered yet") and `upstreamOf()` (`repositories.ts:532`, empty until the branch listing names it). `CommitBox.svelte:43` needs both. A `sync` answer with an empty upstream name asks `repositories.sync_confirm` with a blank.
- 9: no for the words; the chord's wording is open (finding 9 below).
- 10, 12: no.
- 11: yes, it passes on a shape VS Code does not draw for these strokes (Premises 6).
- 13-15: no for markup; yes for look, since the class can be present and the rule wrong. The look on TEST covers it.
- 16, 17: no for the shown repository. Yes for another row: the brief does not say what the Branch control does on a row that is not the one shown.
- 18: yes. It holds for "a readable repository" while a repository whose read failed loses its branch and path with nothing in their place (finding 3 below).
- 19, 20: case 20 yes. A fake store records the calls; the real store takes one path per call and refuses a second write in flight (finding 1 below).
- 21: cannot run (Cases 2).
- 22: yes, it names no state; for a commit's or a stash's diff there is no Open File today.
- 23: yes. Folded, the file has no editor, so `counts[index]` stays null and Next Change stops on it (finding 5 below).
- 24: yes, an audit.

The check on the step's line (the look on TEST at landing): it cannot pass without the goal, but it is not the builder's and the brief gives it no list (step line 1).

Items of "What to build":

1. Item 8, the folder row's Stage, Unstage and Discard "the store's calls over those paths". `repositories.svelte.ts:273-281` takes one path (`stage(root, path)` sends `{ paths: [path] }`), and `send()` at `:168-176` returns `{ ok: false }` for a second write while one is in flight. Called once per path, the first path is staged and the rest are refused without a word. The store needs calls over several paths, and `src/lib/state/sources/repositories/repositories.svelte.ts` is not in "Paths this step writes". The brief should add the file and name the calls (`stagePaths`, `unstagePaths`, `discardPaths`, or a widened signature).
2. Items 3, 6, 10 and 11, colours by role. Oculus already maps VS Code's roles in `src/lib/ui/controls/editor/kit/colours.ts`: `'badge.background': '--muted'` (`:123`), `'badge.foreground': '--c-on'` (`:379`), `'input.background': '--panel'` (`:162`), `'input.border': '--line 00'` (`:265`), `'textLink.foreground': '--accent-txt'` (`:333`), `'button.separator': '--c-on 66'` (`:387`). The brief gives the badge `--chip` with `--ink`, the box "the panel's input background" with no token named, the border `--line`, and Load more `--accent`. A row's hover is `--chip` (`TreeItem.svelte:257-259`), so a `--chip` badge and a `--chip` pill have no edge on a hovered row, and a local-branch pill on `--accent-bg` has none on a selected row (`:261-264`). `--accent` as text is what `TabFace.svelte:201` avoids with `var(--accent-txt, var(--accent))`. The brief should name each token, in line with `colours.ts` or with the reason it departs.
3. Item 5. `Repo.svelte:126-133` draws the branch line whenever `git.branch !== ''` and the path always, above the row of a root that is no repository or whose read failed; its head comment (lines 15-17) and `DESIGN.md:373` say the branch stays because it was read before the failure. Item 4 draws the Branch control on "a readable repository's row" only. After the step a failed repository shows no branch anywhere, and `branchState(git)`'s words (`views/shared/changes/branch-state.ts:13-20`: in sync, ahead, behind) go for every repository. The brief does not list either as lost. It should say where a failed repository's branch is drawn, and whether "in sync" is said.
4. Item 4, the Branch control: "pressing it opens the Branches section and moves the focus to it". The Branches section is drawn for the shown repository only (`Repo.svelte:209-217`) and sits in another `TreeView` than the list (`RepoList.svelte:73`, `Repo.svelte:173`), so `nav.focus` of the list does not reach it. What a press does on a row that is not shown (choose it first, or nothing), and how the focus crosses the two trees as state and not as a DOM side effect (rules file, "The principles"), is left to the builder.
5. Item 11, folding. `Diff.svelte:231-240`: `go()` calls `sections[next.file]?.reveal()` and waits for `drawn()`; `stops` at `:134` is true while any count is null. A folded file never draws, so Previous and Next Change stall on it, and a palette action (`:319-324`) runs on a section with no editor. The brief should say a step unfolds the file or passes over it.
6. Item 11, "the file's counts through `ChangeCounts`". `ChangeCounts.svelte:9` takes a `GitEntry` (`added`, `deleted`); `DiffSides` (`model-sessions.ts:445-453`) carries no counts. The source of the counts is not decided: Monaco's line changes exist only once a section has drawn (`DiffSection.svelte:117-131`), so a folded or far file has none. The brief should name the source.
7. Item 11, Open File on a file's header. Today no Open File is offered for a stash, a commit or a worktree diff (`Diff.svelte:366`), and those are the diffs of several files. What the header's Open File opens for a stash (the working file, which may be gone) and for a worktree diff (the file lives in the worktree's folder, not `held.root`) is not decided.
8. Items 6 and 4, the primitives. The action button needs a full-width accent look, the dropdown a separator part, the message field 13 px text. `ToolButton.svelte` has `compact`, `bare`, `rail`, `status`, `cell`, `plain`, `cut` and no such look; `TextArea.svelte:89` sets `font-size: var(--fs-sm)` (11.5 px, `tokens.css:111`); the opener's looks are `MenuOpener.svelte`'s. The rules file forbids a raw `<button>`; `tests/checks/tree/allow-styling.ts` fails a view that styles a primitive's class through `:global`. The brief's "Read" 4 says `ToolButton` and `Menu` are not changed, and none of `src/lib/ui/controls/ToolButton.svelte`, `src/lib/ui/forms/TextArea.svelte`, `src/lib/ui/menu/MenuOpener.svelte` is in the paths (`ui/controls` and `ui/menu` hold ten items each, so a new primitive there needs a regroup). The brief should name the prop each primitive gains and add the files, with their rows in `tests/views/whole/type-scale.test.ts`.
9. Item 6, the placeholder's chord "worded for the platform as the rest of the view words its chords". The view's chords are catalog literals: `config/text/views/sessions/changes.yml:27` "(Ctrl+Enter)", `repositories.yml:31,33` "(Alt+F5)". `grep -rnlE "isMac|navigator\.platform|userAgentData" src/lib` finds no platform wording. Whether the placeholder says `Ctrl+Enter` always or `Cmd+Enter` on macOS is a user-visible shape left open.
10. Item 9, the text scale. The row is `calc(var(--tree-row) * var(--text-scale, 1))` high (`TreeItem.svelte:249`); item 9 makes the SVG `--tree-row` high and the geometry functions return pixels of a 22 px row. At a text scale other than 1 the lanes of two rows do not meet (today's `Lanes.svelte:50` has the same `--row: 22px`). The brief should give the SVG the scaled height over a 22-unit `viewBox`.
11. Item 10, the row's order. `TreeItem.svelte:231-239` draws `actions`, then `count`, then `end`, and `current` draws weight 700 with a check (`:167-171,352-354`). Pills at the right followed by `...` on hover, and weight 600 with no check, need a change in `TreeItem` the brief does not describe.
12. Item 7 and 8, the right-click menus. `menus/change-menu.ts` is not in the paths; a folder row's menu is not mentioned, and "What oculus keeps" lists the right-click menus.
13. Items 8, 10, 11 against the size check. `tests/checks/tree/size.test.ts:30-31`: a component over 540 lines fails. `Graph.svelte` is 447, `Diff.svelte` 505, `Changes.svelte` 378, and the step adds the tree, the folder rows, the head actions, the pills and the fold. `src/lib/views/sources/repositories` holds ten items (`ls | wc -l`), so a split can only go into `graph/`, `diff/`, `menus/` or `refs/`. The paths allow one new file (`change-tree.ts`). The brief should name the new components or allow new files under those four folders.
14. Test files at the size line: `tests/state/sources/repositories/repositories.test.ts` is 873 lines and `tests/views/sources/files/files.test.ts` 886, against 900. The brief allows new test files; it should say the new state cases go in a new file.
15. Item 1's glyph names have no ASCII stand-in named. `config/catalogs/glyphs.yml` needs a printable value per name (`expand: "[+]"`, `check: "+"`), which a terminal theme draws. Five user-visible values are left to the builder.
16. Item 6, the rice theme. `TextArea.svelte:119-125` redraws the field under `body.rice` (no border, a left rule, no radius, the mono font). The box of item 6 under that theme is not decided.
17. Item 4 removes the count's hover words (`RepoList.svelte:116-120`, `repositories.list_changes`, "N changes") when the count moves to `TreeItem`'s `count`, which has no title. Not listed as lost.

## 6. Implied inputs

Missing from "Cases", each with the result it should have:

1. A detached HEAD with a remote and no upstream: `canPublish()` is false (`repositories.ts:540-548`) and a remote exists, so neither clause of item 4 applies. Expected: no sync control.
2. `git.upstream === null` (not answered yet) and `upstream === true` with `upstreamOf(git) === ''`: expected `none` from `actionButton` and no sync control until both hold.
3. A repository with no commit and a remote: `canPublish()` is true. Expected: stated (Publish offered as the `...` menu does today, or `none`), and Go to Current not drawn.
4. A repository whose read failed, with a branch in its state: where the branch is drawn (The question 3).
5. A merge in progress with nothing left to stage or change, and a rebase in progress: expected `commit` (the merge is concluded by a commit, `CommitBox.svelte:45-51`), never `sync` or `publish`.
6. A write in flight: the action button in `sync` and `publish`, the row's Sync control, the graph head's Fetch, Pull, Push and a folder row's controls are disabled with `git.busy` as the tooltip (`HELP.md:112`, "No write is offered while one is running").
7. A rename (`R`): `GitEntry` has one `path` (`model-sessions.ts:323-330`). Expected: one row under the new path's folder, the violet tone (`repositories.ts` `STATUS_TONES`), no strike. In a diff of several files: the header names the old path (`DiffSides.oldPath`).
8. A path with non-ASCII letters and two names differing in case: the sort order of `changeTree`.
9. A conflict row in tree mode (the merge group): whether the merge group draws a tree, and what a folder row there carries (nothing, by item 8's list of Stage, Unstage, Discard).
10. The untracked group's folder row: Stage only, no Discard (`change-menu.ts:6-8`).
11. The same folder in two groups: two rows with ids `dir:staged:src` and `dir:changed:src`, closed apart.
12. The same folder path in two repositories of one view: `collapsed` is per instance, so closing `src` in one closes it in the other; and ids of folders no longer changed stay in the list. Expected: stated, or the id carries the root.
13. A folder closed whose file holds the focus or is the row a key moves to: `VirtualRows`' `owns` answers -1 for it.
14. Zero lanes (no commit) and many lanes (30): the width for 0 is 22 (VS Code's `max(..., 1) + 1`), and what gives way in a narrow pane.
15. A merge commit that is HEAD: `commitCircles` takes one kind. VS Code tests HEAD first, so radius 7 and 2.
16. A graph with no upstream: the head draws Publish where VS Code does (Premises 8).
17. `ChangesRepo.svelte`: `CommitBox`'s props stay `{ root, git }` (`ChangesRepo.svelte:108`) if it asks its own questions. The brief lists the file in the paths and says nothing of what changes in it; with the step the session panel shows Sync Changes or Publish Branch under its own Push button and "no upstream" line (`:86-101`). Expected: stated.
18. An empty message with staged files: the button disabled with `git.commit_empty` (covered by "exactly where Commit is disabled today"; no case).
19. One long line in the message in a narrow pane (The question, case 7).
20. A narrow pane: on a repository row VS Code lets the controls give way first (`.scm-provider>.actions{min-width:24px;flex:1 10000 auto;overflow:hidden}`, saved line 13) and cuts the branch name; on a graph row the pills do not shrink (saved line 40). The brief states neither.
21. The keyboard: the row's Branch and Sync controls take `reach` from `actions` with `showActions`; the file header's chevron and Open File, the action button's dropdown and the Suggest button inside the box are not given a stop or an order.
22. The text scale (The question 10) and the themes: rice (16), wall (`Diff.svelte:490-493` and `DiffSection.svelte:341-343` draw translucent surfaces; a sticky header "on the panel colour" over them is not decided), and the ASCII glyph mode (15).
23. A diff of one file nothing may act on (Premises 2) and a binary or an unchanged file in a diff of several: what a folded header shows for them.
24. A branch name longer than the row: cut with an ellipsis, the full name in the hover words.

## 7. ADRs

- `ls tools/oculus/docs/adr` and `ls docs/adr` from the repository root: both "No such file or directory". No record.

Findings: none.

## Declined to judge

- Whether VS Code's modern UI is on in Axel's install. `"workbench.experimental.modernUI":{type:"boolean",default:!1,...experiment:{mode:"auto"}}` is in the script; with it on, `.modern-ui .monaco-pane-view{--pane-header-size: var(--vscode-spacing-size280, 28px)}`, the badge radius is `--vscode-cornerRadius-small` (saved line 130), the headers are not uppercase unless `modernUIUppercaseViewHeaders` is set, and saved lines 127-129 change the row's spacing. `grep -n modernUI "~/Library/Application Support/Code/User/settings.json"` prints nothing, so it is not set by hand; an experiment assignment cannot be read from a file. If it is on, the side-by-side on TEST will differ from the table in those rows. The brief should say which of the two it measures.
- The order of the diff editor's title actions (Open File, Previous Change, Next Change): the contributions are spread over the workbench script and the git extension (`editor/title`: `git.openFile navigation`), and their merged order needs the running app.
- The order of the controls on VS Code's repository row (branch, then sync, then `...`): the row is filled from the git extension's status bar commands at run time; not settled by a read.
- Whether `--chip` with `--ink`, or `--muted` with `--c-on`, reads better for the badge: a judgment for the look on TEST.
- The full test suite, the type check and the build were not run, as instructed.

Agent usage: claude-opus-5-5, about 285,000 tokens, about 51 tool uses, minutes not measured.

Usage, from the completion notice: claude-opus-5-5 (agent a55005ae4b75915f9), 301,056 tokens, 52 tool uses, 742,584 ms.

## Closed

Every finding is closed in `agents/briefs/X3d.md` as rewritten after this check; none is left open and none went to Axel. By section of this report:

- Names. The lane token is `--graph-lane` and the badge tokens `--tree-badge-size` and `--tree-badge-font` (item 1); `RepoList.svelte`'s own `.badge` span is renamed `.shape` (item 3). Stage, Unstage and Discard take `stage`, `unstage` and `note_back` wherever they are drawn, `ChangeGroups.svelte` and the hunk bars included, and the glyph name `discard` is dropped (item 8). `side_by_side`, `inline_diff`, `repositories.diff_side` and every other key or glyph the step leaves without a reader are removed (item 12). The Files tree's root rows are named as heading rows the change reaches (item 2, decision 1). DESIGN.md and HELP.md are in the paths whole, with the lines that turn false named (item 14).
- The step line. The report carries one row per element of the plan line with the state on TEST that shows it (Report). A group head's Open Changes is built, over a group diff subject (item 8, case 24). Stage All on the merge group is not built, with the reason (decision 9).
- Premises. The `-txt` tokens, the conditional Open File, `headed`, the date's time, the repository row's weight of 400, the two sideways strokes `laneRows()` draws at radius 11, the lane verticals beside an open commit's files, the graph head's Fetch, Pull and Push or Publish, the file header without counts and with a rename's old path, the author's weight on HEAD, the Collapse Unchanged Regions toggle and the ring taking the row's background are each corrected under "What is on the tree", in the table and in items 3, 5, 10, 11 and 12. The brief says it takes VS Code's default look, the `.modern-ui` rules left out.
- Cases and checks. Case 25 is an audit by name; the commit row is its own component `graph/CommitRow.svelte` so case 21 renders; case 15's second half is an audit; the id cases are in case 20 and the fold keys in case 23; the busy cases are in case 17; item 1 says which sizes are tokens and which stay literals, and Verify 3 lists them; the revert directive is gone and Verify 4 is the template's form; absences carry a reason comment and presses go through the recorder (Cases, first paragraph).
- The question. The store gains `stagePaths`, `unstagePaths` and `discardPaths` and its file is in the paths (item 9). Colours follow `colours.ts` by role (the paragraph above item 1, items 3, 4, 7, 11). A failed repository keeps its branch line and path, and the `branchState` words are the Sync control's hover (items 5, 6). The Branch control of a row not shown chooses it first, and the focus crosses the two trees through a `reveal` field of the view state (item 5). A change step unfolds a folded file (item 12). The header's Open File is drawn for a file's own diff and a group's (item 12). The primitives' new props and their files are named (item 4). The chord is the catalog literal `Ctrl+Enter` (decision 7). The lanes take the scaled row height over a 22-unit viewBox (item 10). `TreeItem` gains `trailing` and `strong` (item 3). `menus/change-menu.ts` is in the paths with the folder row's menu (item 9). New components are named and allowed under `graph/`, `diff/`, `changes/`, `menus/` and `refs/` (item 8, Paths). New state cases go in new files (Cases). Each new glyph name has its ASCII stand-in (item 8). The rice form stays (item 4). The count's hover words are `countTitle` (items 3, 5). The sort is `localeCompare` with base sensitivity and ties by code unit (item 9, case 5). `actionButton` is defined over `git.upstream === true` and `upstreamOf(git) !== ''` (item 7, case 8). The message box grows with wrapped lines through `field-sizing: content` (items 4, 7).
- Implied inputs 1 to 24. In cases 8, 13, 16, 17, 20, 21, 23, 26 and 27 and in items 5 to 12: the detached HEAD with a remote, the unanswered upstream, the repository with no commit, the failed read, the merge or rebase in progress, the write in flight, the rename, the sort order, the merge group as a list in both modes, the untracked folder row, the folder in two groups and in two repositories, the closed folder holding the focus, zero and 30 lanes, the merge that is HEAD, the graph with no upstream, the session panel's own Push button removed, the empty message, the long line, the narrow pane, the Tab order, the text scale and the themes, the one-file diff nothing may act on, the binary file's header, and the long branch name.
- Declined to judge. The brief states it measures VS Code's default look (first bullet of "What is on the tree"); the order of the controls is decision 10; the badge's colour pair follows `colours.ts` and the look on TEST judges it.
