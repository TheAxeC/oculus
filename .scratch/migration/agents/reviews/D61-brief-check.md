# Brief check of D61 (brief `tools/oculus/.scratch/migration/agents/briefs/D61.md`, main at 776696a28)

`git log --oneline -1` prints `776696a28 Land D59, the hub fixes and personal projects`.

## Names

Command: `git grep -n -- "<name>" -- ':!tools/oculus/config/local.yml' ':!tools/oculus/.scratch'`, run for each name. The new ids were also grepped: `grep -rn "'workbenches'\|\"workbenches\"\|views\.workbenches\|workbenches:\|workbenches_" src config tests --exclude=local.yml` and `grep -rn "'repository'\|item_repository\|statusbar\.repository" src config tests --exclude=local.yml`.

Hits outside the brief's write list:
- `WorkbenchMenu`: `src/lib/shell/rail/RailFoot.svelte:7,20,82`. The head comment at line 7 ("switches to one and closes one") stays true.
- `workbench-reset`: `src/routes/+page.svelte:14`, which is in the write list. See finding 3.
- `repoStatus`, `RepoStatus`, `LEFT_ITEMS`, `KeptWorkbench`, `withoutKept`: every hit outside the list is in `layout/saved/kept.ts:17,89,91,107-108` and `saved.ts:44,515`. The type is unchanged, so they stay true.
- `status-items`: `DESIGN.md:578`, which says "the problems item after the sync item". That stays true.
- `ActivityRail.svelte:185` uses `'workbenches'` and `RailFoot.svelte:81` uses `data-action="workbenches"`. Both are ids of the rail's keyboard ring, not view ids, so they do not collide with the new view.
- `ui.yml:136-140` holds `ui.workbenches*`. That is a different group from the new `views.workbenches*` keys, so there is no collision.
- No hit for a `repository` status item.
- No test names `LEFT_ITEMS`, the rail menu's groups, `repoStatus` or the `views` group's list.

Findings:

1. **`HELP.md:35` becomes false and is outside the write list.** It reads "Ten views are held once ... Settings, Focus, Usage, Live HPC, Audit, Findings, History, Processes, Pages and Status." A new unique view makes the count and the list false. The write list names only `HELP.md` 53-60 and 80-82.

2. **"No chord" (item 1, Z781, decision 1) cannot hold with the view placed after Pages.**
   - Chords are given by place in the group: `catalogue.ts` `keyOf`, `if (at >= 0 && at < 9) return \`${letter}${at + 1}\``. `config/layout.yml:37` gives the `views` group `chord: y`. `HELP.md:89` says "a chord reaches the first nine entries of a group."
   - The `views` group holds 10 views today, orders 0 to 9 (`grep -rn -B4 -A3 "group: 'views'" src/lib/views`): Settings, Account Setup, Catalogue, Pages, Status, Findings, Audit, History, Gallery, Processes.
   - With the view after Pages, it takes `y5`. Status, Findings, Audit and History each move one digit, and Gallery loses `y9`. That is a keybinding change no ruling names (spec.md:18).
   - The premise of Z781 is wrong. Options:
     - (a) Register the view last, after Processes (order above 9). It is then the 11th entry and has no chord, and every existing chord is kept. Recommended.
     - (b) Keep it after Pages and book the chord shift as a decision.
   - The lazy option is to leave the brief's wording and let the builder report "no chord" because a registration has no chord field.

3. **The view cannot use `useWorkbenchReset`, and the brief keeps code that becomes dead.**
   - `useWorkbenchReset` is a shell module (`src/lib/shell/rail/workbench-reset.ts`). The `views` row of `tests/checks/tree/boundaries.test.ts:222-230` names no `shell/**`, so importing it from a view breaks G16 and spec.md:53.
   - The Pages view already resets a workbench through `folders.reset(id)` (`Pages.svelte:83-85`).
   - Once the rail menu loses its Reset group, `useWorkbenchReset` has no reader. `provideWorkbenchReset` (`+page.svelte:14,237-239`) then provides to nothing (`grep -rn 'useWorkbenchReset\|provideWorkbenchReset\|workbench-reset' src tests config docs HELP.md DESIGN.md README.md` shows only those three files).
   - The brief should say: reset through `folders.reset` with the `createPageFlows` question, and delete `workbench-reset.ts` and its provide call (spec.md:85).

4. **The layout store's path is wrong and its size limit is not given.**
   - The write list names `src/lib/state/workbench/layout/layout.svelte.ts`. `wc -l` answers "No such file or directory".
   - The real file is `src/lib/state/workbench/layout.svelte.ts`, at 877 lines against the 880 limit. It is missing from the brief's "File sizes" line.
   - The view needs a reader for `Pages.kept` and a Forget operation. `grep -n "kept" layout.svelte.ts` shows the store exposes no kept accessor. The returned object (`layout.svelte.ts:800-877`) has 3 lines of room, so a split by concern may be needed (spec.md:45).

5. **`npm run diagrams` writes outside the write list.** Verify item 1 runs `npm run diagrams`, which writes `tools/oculus/docs/diagrams/*.dot` and `*.svg` (`ls docs/diagrams`; `git log --name-only -- docs/diagrams` shows the last landing changing `layer-shell` and `layer-state`). Removing the `workbench-reset` import and adding the view changes the layer diagrams. `tools/oculus/docs/diagrams/` is not in the list.

6. **There is no room in the view's folder for a second file.** `git ls-files src/lib/views/system/workbench | awk -F/ '{print $6}' | sort -u | wc -l` prints `9`. The new component makes 10, which is the limit. "the new view's component and any file beside it" would make 11, which `utils/folder-check.sh` refuses (spec.md:46).

## The step line

`grep -n '^- D61' plan.md` gives line 746. Its parts map to the brief as follows:
- (1) The view lists open workbenches with folder and branch, and closed ones with reopen and forget: item 1, Open and Closed.
- (1) Reset and close on each row: item 1, Open.
- (2) The rail menu stays and loses Reset layout; reset is reached from the view: item 2, and item 1's Open controls.
- (3) Branch and sync follow the file, then the folder, then the last chosen: item 3.

Findings:

7. **"New workbench from a folder" is narrowed.** The brief opens only a root's top (item 1, New workbench, and Z781). A folder inside a root is left to other views. Item 1 has no requirement that opens a workbench from a folder.

8. **"lists every repository of the Files view" is a different set in the brief.** Item 3 says "every repository the Repositories view lists", which is `pickerRoots` (`repositories.ts:580-600`). That list also holds:
   - every session's workspace, which is not a Files view root (`server/root/watch/git.ts:1-2`);
   - rows that are not repositories: shapes `none`, `missing` and `failed`.

   `repoStatus` only accepts `git[root].repository && git[root].error === null` (`status.ts:197-199`), so picking such a row shows nothing. The brief should name the set: the readable repositories of the Files view's roots and the repositories below them.

9. **"Reset and close on each row" has no requirement for Closed rows.** Closed rows get Reopen and Forget only. The brief does not say whether Forget stands for reset there.

## Premises

Each premise below was rerun.

- `grep -n 'export type FolderRef\|export function folderName\|export type Page =\|export type KeptWorkbench\|KEPT_MAX\|export type Pages\|kept?:' model.ts` prints 97, 105, 126, 167, 174, 180, 184. The claims 97-133, 105-107 and 167-185 hold.
- `withKept`, `withoutKept`, `keptFor` and `pageFromKept` are at `folder-pages.ts` 41, 47, 33 and 59. Holds.
- `WorkbenchMenu.svelte` has 114 lines, and its group heading is `ui.workbenches_reset_heading` at line 85. `ui.yml:136-140` holds. Pages has 350 lines and registers `pages` in group `views`, order 3, unique. Holds.
- `status.ts:181` is `export function repoStatus(`, ending at 217. `+page.svelte:188` passes `tabFile(activeInstance()?.state)`. `status-items.ts:35-46` is `LEFT_ITEMS`. `StatusBar.svelte:25` is the hidden-set comment. `repositoryLabels` is at 615. All hold.
- `wc -l` prints 294, 172, 354, 416, 186, 114. Holds. spec.md:45 says 880 and 520. Holds.
- `ls docs/adr tools/oculus/docs/adr` finds neither. Holds.

Findings:

10. **`folder-opener.ts:91-127` is off.** `createFolderPages` starts at line 95 (`grep -n export folder-opener.ts`). Line 91 is inside `arranged`.

11. **The repository's name is not only in the tooltip.** It is also the branch menu's accessible name: `RepoItems.svelte:108`, `label={t('statusbar.branch_menu', repo.name)}`.

12. The layout store path is wrong. This is finding 4.

## Cases and checks

13. **Cases 3, 7 and 8 are declared tests with no guarded entry.**
    - spec.md:57 and `guarded.md:3` allow a test only as the test of a named entry.
    - G29 (reading a saved layout of an earlier version) and G54 (page arrangements) do not cover Forget or the bar's repository. Neither do G31 or G33 (`grep -n '^- G' guarded.md`).
    - The brief names no entry. The entries' wording is the orchestrator's to close in automode (`orchestrator-state.md:40`), but it has to be written before the builder writes a test.

14. **Case 10 contradicts itself.** "shown again after a reload as the hidden set is kept": a kept hidden set keeps the item hidden after a reload.

15. **Case 8 disagrees with item 3's rule.** The case says C is removed "from the served roots". The rule falls back when C is no longer "one the git channel reports". The git channel also carries every session's workspace and the repositories below the roots (`git.ts:1-2,25-30`). A C that is a session's workspace stays reported, so the rule keeps C while the case expects the hub.

16. **Case 3 as a test of `withoutKept` passes on the unchanged tree.** The function exists (`folder-pages.ts:47-52`). The behaviour the step adds is a store operation (finding 4), so verify item 5 is only met by a test of that operation.

17. **Case 2's second half checks a place the step does not change.** The question about unsaved text and No closing nothing are `createPageFlows` (`state/workbench/navigation/pages.ts`), which is outside the write list. Only the wiring is the step's.

No case conflicts with G29 or G54.

## The question

- **Case 1:** could pass with a branch column that reads the wrong rule. The look decides.
- **Case 3:** yes, it could pass without the goal. See finding 16.
- **Cases 7 and 8:** a pure `repoStatus` test can pass while `+page.svelte` wires the wrong page or the wrong stored value. Case 8 can pass either way depending on whether its fixture keeps C on the git channel (finding 15).
- **Case 10:** cannot pass as worded (finding 14).
- **Item 1, "no chord":** could be reported as met while the view in fact takes `y5` (finding 2).
- **Item 3, "every repository":** could pass listing rows that show nothing when picked (finding 8).
- **Verify 1 and verify 2:** pass without the goal. They are hygiene checks.
- **Item 4 (docs):** no.
- **Cases 2, 4, 5, 6 and 9:** no, as worded.

## Implied inputs

18. **The workspaces are still being read at start.** `fs.roots()` is empty then (`fs.svelte.ts:490-493`). Every Closed row would draw disabled as "not served", and the New workbench menu would be empty. Expected: rows are not disabled until the roots are read.

19. **A kept layout whose root is in another workspace.** `folders` checks `fs.roots()`, which is the current workspace only. The status bar's `served` covers every workspace (`+page.svelte:172-177`). The row is disabled with a tooltip "not served", which is false for that root. Expected: the tooltip names the current workspace.

20. **The chosen repository is unreported for a while.** This happens when the git channel is not yet delivered after a reload, or when a read fails. The stored choice must be kept, not cleared, or case 7's "After a reload: C still" fails. Expected: keep the value and show the hub while C is unreported.

21. **The active tab is a Files or LaTeX tab.** Its layout state `{ root, path }` matches `tabFileShape` (`status.ts:113-117`; `folder-opener.ts:62-75`), so it decides as "the active file". The tooltip's reason is then wrong, and a pick never shows while a Files tab is active on a rail page. Expected: say whether a folder tab decides, and how the reason is worded.

22. **The active tab is in a float over a workbench page.** Expected: say whether the page on screen decides.

23. **A workbench whose folder is in no repository.** Item 3 does not say whether this falls through to the last chosen, or draws nothing as case 9 does for a file.

24. **Manage Workbenches pressed while a workbench is on screen.** The view lands in that workbench's documents pane. Closing or resetting that workbench from the view's own row then removes the page that holds the view, and the kept layout carries the view's tab. Expected: state where the view opens.

25. **Reopen when `pageFromKept` answers null** (a tab id collision, `folder-store.ts:113-134`). The code silently makes a fresh workbench and drops the kept layout, which contradicts case 3's "comes back with its kept tabs". Expected: state it.

26. **A ui envelope saved before the change, with no last-chosen field.** It must read as none, through an optional field with `.catch`, without touching `UI_VERSION`. Expected: the hub is shown.

27. **Two browser tabs.** The appearance in the ui store is each browser tab's own (`ui.svelte.ts:16-21`), so "one value for the window" holds per browser tab, and the last save wins on reload.

28. **The view's glyph is not named.** A new glyph name needs `config/catalogs/glyphs.yml` and `icons.yml`, both outside the write list. `app_view` exists (`glyphs.yml:196`, `icons.yml:195`).

Covered by the brief: a nested repository (the deepest rule), two pages showing the view and a float holding it (it is a unique view), the rail menu's keyboard ring (item 2 covers both states of the menu), and a kept layout for a folder whose workbench is open (`openFolderPage` shows the open page).

## ADRs

`ls docs/adr tools/oculus/docs/adr` answers "No such file or directory" for both. `find . -type d -name adr -not -path '*/node_modules/*'` prints nothing. None.

## Dictated text

- "Manage Workbenches": `grep -n 'Manage Workbenches' D61.md` finds lines 31, 45 and 89. Holds.
- The section and control names "Open", "Closed", "New workbench", "Reset layout", "Close", "Reopen" and "Forget": lines 27, 28, 29, 41 and 42. Hold.
- `LC_ALL=C grep -n '[^ -~]' D61.md` prints nothing.

## Declined to judge

- Whether D60's change to the served roots (`server/files/files.ts`, `roots.ts`) changes `fs.roots()` or the git channel under D61. D60 is not built, so this cannot be read from the tree.
- The look under every theme. It is not checkable without a page, and spec.md:62 forbids running one.

Usage: a29257cca60a58268, claude-opus-5-5, 207,035 tokens, 76 tool uses, 8.0 min.
