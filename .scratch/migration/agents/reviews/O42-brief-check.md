# Brief check of O42 (tools/oculus/.scratch/migration/agents/briefs/O42.md), main at d67c82904 plus the uncommitted ledger edits

The brief cannot be dispatched as written. Four premises it builds on do not hold on the tree:
- an edit of `.oculus/settings.yml` never marks the folder list (3.10);
- the "app keys of resolve.ts" are code branches, not a table the menu can read (3.6);
- the host has no recent list and the bridge carries no argument for Open Recent (3.8);
- most cases ask for tests that no entry of `agents/guarded.md` covers, which the rules file forbids without Axel's ruling (4.1).

The write list also leaves out files the step has to change (1.1 to 1.6).

## 1. Names

Command: `git grep -n -w <name> -- . ':!tools/oculus/.scratch' ':!tools/oculus/docs/diagrams'` for each name, then `git grep -n 'desktop\.menu'`, `git grep -n 'data-repo-running\|repo-running\|\.running\b'` and `git grep -n registerAccelerator`.

These hits are outside "Paths this step writes" and the change makes them false or forces them to change:

1. `src/lib/state/shared/stores/desktop.ts:48` `type DesktopCommand = 'settings' | 'help';` and `:57` `command: DesktopCommand;`. These are the page's own type of the bridge's command names. The fixed list in a module "the host and the page both import" replaces this type, so the line becomes false. The file is not on the write list.
2. `src/lib/data/helpers/keys/oculus/resolve.ts:171-185` (`appKey`: Cmd+W, Cmd+N, Cmd+F, Cmd+Shift+T as `event.code === 'KeyW'` branches) and its inline keys:
   - Cmd+Shift+F/H at `:243-258`;
   - Ctrl+Tab at `:300-315`;
   - `?` at `:324`;
   - Go Back and Forward in `navigateKey`, `:195-202`.

   Related files:
   - `debug-keys.ts:17-29` (`debugKeyOf` is a function, with no table from an action to its key);
   - `editor-keys.ts:24` (`SAVE_PRESS`).

   "Each item shows the key the page binds ... read from the page's own key tables ... never typed as a second copy" (brief :53), and case 4 asks that a change in `debugKeyOf` reach the menu. Neither can be met without changing these files into tables, and none of them is on the write list. Only the folder `src/lib/data/helpers/keys/oculus/` is listed, and only as "(the new module of the menu's command list)".
3. `src/lib/shell/keys/workbench-keys.svelte.ts` (`perform`, `:225-298`) and `src/lib/shell/Workbench.svelte` (it wires `debugKey`, `saveSource` and `find` at `:234` and around). The page answer for `close-tab`, `save`, `cycle-tab`, `debug`, `sheet` and `find` has to reach `perform` or the Workbench's options, because `desktop-windows.svelte.ts` only receives `client`. These files are covered only by the ambiguous folder entry `tools/oculus/src/lib/shell/` "(the module the colon commands' effects move to)".
4. The Terminal items' actions live in the Terminal view:
   - `src/lib/views/sessions/terminal/terminal-list.ts:529-536` (`MENU_NEW`, the `PROFILE_LIST` submenu);
   - `:584` (`handlers.split(terminal)`, which needs "the terminal the menu was opened on").

   The shell may not import a view by name (`spec.md:55`). The brief names no path and no mechanism for "Terminal items run what the Terminal tab's menu runs". Revert File is `revertSourceDraft(id)` (`src/lib/state/sessions/source/source.svelte.ts:575`), reached today only from `BarActions.svelte:116` and `DiskNote.svelte:71`. That file is not on the list either.
5. `src/lib/views/sources/repositories/Repositories.svelte:152` (`const labels = $derived(repositoryLabels(every, gitFor))`) and `:451` (`<Repo`).
   - The list's row name is `labels[root] ?? root` (`RepoList.svelte:176,185`), passed in from Repositories.svelte.
   - Part 2's "its name as the list's row names it" needs Repo.svelte to get that label. Repositories.svelte (517 lines, the component limit is 520) is not on the write list.
6. Open Recent needs a new bridge call or a new host read:
   - `src/desktop/preload.cjs`;
   - `src/desktop/decide/channels.ts`;
   - `src/desktop/windows/bridge.ts`;
   - `desktop.ts`.

   `grep -rn "recent\|api/fs" src/desktop` printed only `src/desktop/app.ts:191: Menu.setApplicationMenu(`, so the host does not hold the recent list. None of these files is on the list (see 6.3).
7. Part 3's watcher path needs `src/lib/server/root/watch/git.ts` and/or `markedBy` in `src/lib/server/files/project/make.ts:128-134` (see 3.10). Neither is on the list.

These hits are outside the list and the change leaves them true:

8. `menuKeys`: `src/lib/data/helpers/keys/oculus-keys.ts:17,86`. Still true.
9. `REPO_SETTINGS`: `editor.ts:64`. Unchanged and true. Its uses in `Origins.svelte:12,29,31` are callers, which the list covers as "the callers of those three readers".
10. `saveRulesOf`:
    - `DESIGN.md:660` ("with the rules from `saveRulesOf`") is still true;
    - `save-text.ts:5` comment is still true;
    - `context.ts:125,359-365` is a caller that changes.
11. `recordsOf`: `src/lib/server/edit/writes/file-undo.ts:180,276` is a different function. Unaffected.
12. `createSourceOptions`:
    - `DiffSection.svelte:53,228` and `Source.svelte:107,176` are callers;
    - `tab-draft.svelte.ts:6,10` (`ReturnType<...>['toggled']`) is unaffected;
    - `tests/views/sources/source/SaveKeyHost.svelte:11,28` is under `tests/`.
13. `FsRoot`: about 40 type-only uses across `src/lib/state` and `src/lib/views`. They stay true if `settings` is optional. If it is required, every FsRoot literal in tests breaks the type check (for example `tests/state/sessions/served-roots.client.test.ts:26-28`, `{ key: 'a', dir: '/w/a', real: '/w/a' }`). The brief does not say which.
14. `workspacesAnswer`:
    - `DESIGN.md:616` and `src/lib/server/files/project/make.ts:11` stay true;
    - `tests/routes/hubs/make.test.ts:363-373`, `tests/state/sources/workspaces-real.test.ts:29-38` and `tests/routes/hubs/hub-secrets.test.ts:103,225` assert on single fields or use `toMatchObject`, so they stay true.
15. `surnameOf`, `citationBase`: `literature.ts:33,155,157` stays true.
16. `MenuActions`, `buildMenu`, `ACCELERATORS`: no hit outside menu.ts, app.ts and desktop-keys.ts.
17. `named`: no hit outside `source-options.ts:110,125`.
18. `.running` in Repo.svelte: no hit outside the component. The other `.running` hits are unrelated fields.
19. `desktop.menu.*`: no hit outside menu.ts and desktop.yml.
20. `registerAccelerator`: menu.ts only.

## 2. The step line

The O42 line (`grep -n '^- O42 ' plan.md`, line 583) and its rulings, mapped:

1. "the app's menu with File > Open in Browser": Part 1, the Open in Browser paragraph, and case 7. Served.
2. "every item of the 2026-10-18 proposal (open item 136)": Part 1's item lists. The proposal's own item list is not in the ledger. `grep -rln 'Go to Project\|Accent Colour\|Update Tasks' .scratch/migration` finds only `agents/briefs/O42.md`. Its only trace is `agents/reviews/O41-landing.md:7`, which says only "File > Open in Browser ..., and the other menu items the app needs", with decisions on where, what it opens and "no new item takes a key the page or an app holds". So the brief's items cannot be checked against the proposal (see Declined).
3. Ruling "136, the further items" (plan.md:2183): Edit > Find, Window > Next Tab and Previous Tab, File > Open Recent, Help > Keyboard Shortcuts, oculus > Services, no Check for Updates. Each is in Part 1 (brief :41-49), and case 1 covers "no Check for Updates". Served.
4. Ruling 147 (a) (plan.md, the new last 147 line):
   - Cmd/Ctrl keys shown and taken on macOS, the others not shown, the keys joining ACCELERATORS, off macOS shown and not taken: Part 1 "Keys", cases 2, 3 and 9.
   - Its clause "the press running the same page command once" has no case and no look (see 6.1).
   - The brief adds F1 to the list of keys not shown. F1 is not in the ruling's list; it is harmless, because Command Palette shows Cmd+Shift+P.
5. "a header row for the shown repository's details with its moving line along it (open item 137 (d))": Part 2 and case 10. Served.
6. "each root's `.oculus/settings.yml` text carried in the folder list the server answers at GET /api/fs": Part 3 and case 11. Served.
7. "(premise corrected at /spec: the list is answered, and read again on the messages that mark it, not pushed)": Part 3's last sentence and case 14.
   - Ruling 138 (plan.md, "Open item 138") still reads "the roots payload the server pushes". The plan line records the correction, but no ruling line of Axel's backs it, and `grep -n self_rule orchestrator-state.md .agents/plan.yaml` prints nothing.
   - The correction also rests on a watcher path that does not exist for this file (3.10).
8. "read by the source list, the Settings `editor.languages` row and the save rules with no request of their own (138 (b))": Part 3's three readers and case 12. The line's "source list" is read as the source tab's options (`repository()` of source-options.ts). The wording differs, and the brief does not say so.
9. "which also ends the 404 of `/api/fs?root=<repository path>` ... (O40's look 33)": Part 3 "A root key that is not a folder of the workspace ... no request, no 404" and case 13. Served.
10. "the rice theme's empty state ... message on its own line with the action under it (146 (a))": Part 4 and case 17. Served.
11. "the citation key ... from the first author's surname rather than from 'al' of 'et al.' (144 (a))": Part 5 and case 16. Served.
12. "runs once O40 has landed, before O38 (ruling One extra step)": an order, so no requirement is needed. `git log --oneline -3` shows `2eab73263 Land O40, the open look defects of O37`.
13. Parts of the brief with no line or ruling behind them:
    - decisions 1 to 6 (brief :153-158), among them the menu order Go/Run/Terminal between View and Window, Open View... as `:tab `, Open Recent as a native submenu, and the focused-window routing;
    - the Go, Run and Terminal menus;
    - Settings and Help opening in a popped-out window when it is focused.

    These may come from the proposal, but the ledger does not show that.

## 3. Premises

1. Menu items, `sed -n 34,149p src/desktop/windows/menu.ts` and `wc -l`: 149 lines. oculus (About, Settings, Hide, Hide Others, Show All, Quit), File (New Window, Close Window), Edit (six roles with `registerAccelerator: false`), View, Window and Help, as stated. Holds.
2. `MenuActions.command` is `(name: 'settings' | 'help')` at menu.ts:23 (the brief says :22, the type opens at :20). `app.ts:197-201` sends `main.win.webContents.send(EVENT, 'command', name)` to `windows.lastMain()`. `desktop-windows.svelte.ts:65-69` opens `SETTINGS_VIEW` or `'help'` inside `if (float === null)` (line 50). Holds.
3. `grep -n registerAccelerator -B2 node_modules/electron/electron.d.ts`: `22562- * @platform linux,win32` / `22564: registerAccelerator?: boolean;`. `node -p` of the package version: `44.5.1`. Holds.
4. `desktop-keys.ts` is 26 lines with 13 keys (settings to minimize). `oculus-keys.ts:86` is `if (mac && holds(chordsOf(menuKeys()), chord)) return 'desktop';`, after the workbench, the palette and the editor. `app-keys.test.ts` exists, under G77. Holds.
5. `windows.focused()` (windows.ts:483-486) falls back to `lastMain()`, `origin` is at windows.ts:59-60, and `shell.openExternal` is at :144. Holds. Not stated: audience windows are not in the list (windows.ts:6, "The audience window of a presentation ... is not one of these entries"), so a focused audience window resolves to the last main window (see 6.2).
6. `KeyAction` is at resolve.ts:51-78 (brief: 52-78), `KEY_ROWS` at palette-table.ts:41, and `debugKeyOf` at debug-keys.ts:17-29 (brief: 12-27). Holds, with the line drift noted. The phrase "the app keys of `resolve.ts`" (brief :53) presents them as a key table. They are conditionals (`if (event.code === 'KeyW') return { kind: 'close-tab' };`, resolve.ts:181). Cmd+S is `SAVE_PRESS` in editor-keys.ts:24, and Ctrl+Tab, `?` and Cmd+Shift+F are inline in `resolveKey`. **Premise misleading.** A menu cannot "read" these keys without the refactor named in 1.2.
7. `commands()` runs palette.ts:497-643 (brief: 497-648), and the list matches `grep -n "name: '"`. CommandRows.svelte has 260 lines. Not stated:
   - `accent` is `available: false` (palette.ts:527-531), and CommandRows.svelte:135 and :228 draw an unavailable command disabled and do not run it, so Accent Colour... opens the palette on a row that cannot run;
   - the dock toggles are unavailable without a docked float (palette.ts:551-563);
   - `reopen-closed-tab` is not listed when nothing can be reopened (:539-548);
   - `folder` and `folder-add` are unavailable while the panel is open (:625-636).

   The brief gives the menu's enabled state for none of these.
8. Catalogue words, from `sed -n 40,86p config/text/app.yml` and the named lines:
   - `cmd_*` sit at 42-84 (brief: 40-85);
   - files.yml:50-51 is `editors_save_all: save all` (lower case) and `editors_save_all_title: Save every editor with unsaved changes`;
   - source.yml:72 is `bar_revert: Revert File`;
   - repositories.yml:56 is `clone: Clone Repository...`;
   - terminal.yml:34-39 holds `menu_new: New Terminal`, `menu_new_profile: New Terminal With Profile` (no "...") and `menu_split: Split Terminal`;
   - desktop.yml:29-60 is `desktop.menu`.

   The lines hold, but several named words differ from the labels the brief dictates (see 8). Existing words the brief does not name, found with `grep -rn ": <label>" config/text`:
   - `ui.yml:85 strip_new_text_file: New Text File`;
   - `files.yml:123 menu_open_folder: Open Folder...`;
   - `debug.yml:82-84 step_into/step_out/step_over`.
9. `WorkspacesState` is at fs-transport.ts:79-97 with `recent`. Holds. Not stated: the host has no copy of `recent` (1.6).
10. Folder list and watcher (brief :26):
    - `workspacesAnswer` is at fs-transport.ts:445. Holds.
    - The server's `workspacesAnswer` opens at fs.ts:361 and ends at 399, with the folders map at 377-392 (brief: 367-395). Line drift.
    - fs.svelte.ts:373-394 marks WORKSPACES on `config`, on `workspaces: true` and on a version gap. Holds.
    - git.ts:60-63 is a comment. The code that marks is `heard` at git.ts:553-554, `const owner = markedBy(path); if (owner === '') marked.add(root);`. `markedBy` (make.ts:128-134) returns `''` only for a path whose last part is `.oculus` or `project.yml`, or whose last two parts are `.oculus/config.yml` (`HUB_FILE`, hub-names.ts:215) or `.oculus/project.yml`. For `.oculus/settings.yml` it returns `null`, so the root is not marked and no `workspaces: true` is sent.
    - **Premise false for this file.** Part 3's "a page save sends the `files` message the git watcher announces for an event at the root's `.oculus` with `workspaces: true`" does not hold on the tree. Case 14's server test fails there for a missing behaviour, which the write list (1.7) leaves no room to add.
11. The three readers, checked with `sed`:
    - `repository()` and `named()` sit at source-options.ts:108-134;
    - `repoOrigins` at origins.ts:115-122;
    - `recordsOf` at editor-text.ts:114-121.

    Holds. The 404 of a non-root key could not be rerun, since running it needs a server (see Declined).
12. Literature: `authorsOf` is at literature.ts:81-84, splitting on `,`; `surnameOf` at literature-key.ts:54-65; "al." gives `al`. Holds.
13. `Empty.svelte` (94 lines): `:77-83` is the rice rule with `flex-direction: row`, and `.message` at `:71-74` has `min-width: 0; overflow-wrap: anywhere`. Holds. Not stated: the `# ` mark is `.empty::before` (`:90-93`), a flex item, so a plain switch to `flex-direction: column` puts `# ` on a line of its own.
14. Size (`wc -l`): fs.svelte.ts is 898. Holds, and it is already over 880. **Premise incomplete.** Files at or near the limit that the step changes or must change:
    - `src/lib/state/client/context.ts` 880 (the caller at :359-365);
    - `src/lib/views/sources/source/Source.svelte` 519 (component limit 520);
    - `src/lib/views/sources/repositories/Repositories.svelte` 517;
    - `src/lib/server/root/watch/git.ts` 876;
    - `src/lib/state/workbench/palette.ts` 832.
15. Folder rule. `git ls-files <dir> | ... | sort -u | wc -l` gives these folders at ten items:
    - `src/lib/shell` 10, `src/lib/shell/keys` 10, `src/lib/shell/keys/rows` 10;
    - `src/lib/views/sources/repositories` 10;
    - `src/lib/ui/frame` 10;
    - `src/lib/state/sources` 10;
    - `tests/server/edit` 10, `tests/state/system/apps` 10, `tests/server` 10.

    The brief offers "a shared module under `src/lib/views/sources/repositories/`" and "the module the colon commands' effects move to" under `src/lib/shell/`. Both would be an eleventh item unless they go into a subfolder (`shell/window` 6, `shell/commands` 9, `views/sources/repositories/repo` 2). The brief does not say this.
16. Guarded entries, `grep -n "editor-text\|workspacesAnswer\|G107" agents/guarded.md`: lines 147 (G59), 201 (G69) and 298 (G107). Holds. **Premise incomplete.**
    - G77 (guarded.md:56, Code "`src/lib/data/helpers/keys/` (... `oculus-keys.ts`, and `oculus/` ...)") covers desktop-keys.ts and resolve.ts. Its tests besides app-keys.test.ts (`contributions.test.ts`, `shell.test.ts`, `page-commands.client.test.ts` and others, guarded.md:57) are not in the verify list.
    - G8 (guarded.md:71, "the Literature save: `src/lib/server/edit/feeds/literature.ts`") owns `tests/server/edit/literature.test.ts` "every row".
    - G2 and G3, the path and secret guards, apply once `workspacesAnswer` reads a file (6.4).
17. ADR, `ls docs/adr` and `ls tools/oculus/docs/adr`: both fail. Holds.

## 4. Cases and checks

1. Cases 1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14 and 15 each say "Expected: a test". `spec.md:59` says "A test exists only as the test of one entry of `agents/guarded.md` ... A builder writes no other test. A step that needs a new entry stops and asks Axel for it". No entry covers:
   - the menu template;
   - the bridge answer;
   - Open in Browser;
   - Open Recent;
   - the Repo header;
   - the settings text in the folder list (G69's guarantee is about rows leaving with a root, not this);
   - the readers' zero requests (G59's tests are `save-text.test.ts` alone).

   The generic bullet at :108 ("only when the rules file's test rule calls for a test") contradicts the cases' Expected lines and leaves the builder to stop on every one. **Inconsistent with the rules file.**
2. Case 10 asks for "a client test over `Repo.svelte` for ... the line's place in the DOM". `spec.md:69` says a `*.client.test.ts` runs "with no DOM", and `spec.md:65` says an assertion over a rendered string, a label or a constant "proves nothing and is not written". **Inconsistent.** The row has to name the look.
3. Cases 1 and 3 ("a test over the template lists them") are assertions over labels in order. Under `spec.md:65` that is a label assertion. Also, `buildMenu` returns `Menu.buildFromTemplate(template)` (menu.ts:148), not a template, so the case presumes a refactor the brief does not name.
4. Case 15 expects "the Settings row says what it says today for a file that does not read". Today `originsOf` says `file.error` for a failed read and `settings_origin_cut` for a truncated one (origins.ts:75-79). With `settings: null` for missing, NUL and over-limit files alike, the reader cannot tell those apart. That contradicts Part 3's "keeps its reason words for a file that is there and does not read" and decision 5. As the case stands, the result is undefined.
5. Verify item 6 says each sentence "is read against the standards pages' rules on list items and sentence length". `spec.md` has no rule on list items or sentence length, so it asks for a check against a rule that does not exist.
6. Verify item 5's last bullet says "this brief says which it is" of audit and proof tests. The brief names neither for any case.
7. `spec.md:32-33` and `:87` call for the brief to name the worktree, a base copy, and the base of `sh utils/unused-exports.sh`. `grep -n -i "worktree\|base copy\|unused-exports" O42.md` finds only "Run from `tools/oculus` in the worktree" (:179). By comparison, O40.md:16 and :129 name both.
8. The Conventions bullet "A key is read from the page's key tables, never written twice" (:170) clashes with "The keys the menu takes on macOS join `ACCELERATORS`" (:53) and case 2's "the taken keys are in `ACCELERATORS`", because ACCELERATORS is a literal string table (desktop-keys.ts:7-21). The brief should say ACCELERATORS' new entries are derived from the page's tables.
9. Places the step does not change that a case asks the builder to check or explain:
   - verify item 3 runs G59's tests (`save-text.test.ts`), which do not exercise `saveRulesOf`'s settings read;
   - case 18 runs G107, whose code (`tab-asks.svelte.ts`, `editor-status.svelte.ts`, `source-keys.ts`) is not changed, though Source.svelte, its caller, is.

## 5. The question

Could each case, check or item pass without the goal being reached?

Cases:
1. Case 1: yes. A label-and-order test passes with every item's `click` sending the wrong name or none. Nothing ties an item to its command name.
2. Case 2: yes for the ruling's "takes it when the page leaves it ... once". Accelerator strings in a template say nothing about the order of page and menu, which plan.md's 147 text says is "not verified here ... checked in the app at the look". No look is named.
3. Case 3: yes. The template can be right while no reader sees a menu: `app-keys.test.ts:195` is titled "keeps Cmd+R free off macOS, where the desktop menu is not drawn", and the windows use `titleBarStyle: 'hidden'` (window-options.ts:83,89). Whether the menu is drawn at all off macOS is not verified.
4. Case 4: no, if the item reads the table. It cannot pass honestly for resolve.ts's keys without 1.2.
5. Case 5: yes. Stubbed stores prove the page answer dispatches, not that the real stores act. It also does not prove that a key press and the menu together run the command once.
6. Case 6: no, for close-tab in a float. Other names in a float are untested.
7. Case 7: no for the focused case. The "no window focused" branch is not in the case.
8. Case 8: yes for "the submenu is rebuilt when the recent list changes" and "opens that workspace". A template test with a stubbed click covers neither.
9. Case 9: yes. If every new key is already a workbench or palette key under `WIDEST` (oculus-keys.ts:64-69), no row changes and the test passes unchanged.
10. Case 10: yes. It cannot be written as asked (4.2), and "no row moves" is look-only.
11. Case 11: no for the two-folder shape. It passes while a symlinked settings file outside the root is read (6.4).
12. Case 12: no, as long as it asserts both the resolved records and zero fetches.
13. Case 13: no.
14. Case 14: the server half cannot pass without a code change outside the write list (3.10). The client half covers `saveRulesOf` only, not the source tab's options or `repoOrigins`.
15. Case 15: undefined (4.4).
16. Case 16: yes for "any case", and for an author list element such as `"Osei M., et al."`. That form takes the comma branch of `surnameOf` (literature-key.ts:57), or after the drop gives `"Osei M."`, whose `M.` fails `INITIALS` (`/^[A-Z]{1,3}$/`, :34) and yields the key `m...`. Its rows "Osei, M., et al.", "Marc M. Van Hulle" and "Faes A" already pass on the tree, so they prove preserved behaviour only.
17. Case 17: yes. A column layout passes with the `# ` pseudo-element on its own line, while the goal says "the `# ` mark stays before the message".
18. Case 18: no for G107 itself. It says nothing about Part 3.

What to build:

19. Part 1: yes, as in items 1, 2 and 5. No case or look covers the press under an overlay (6.1), the audience window (6.2), or the Terminal and Revert paths (1.4).
20. Part 2: yes, if the header takes `root` as its name. Only reading against Repositories.svelte's `labels` catches that.
21. Part 3: yes for "an edit ... reaches the readers" (3.10), and for the security of the new read (6.4).
22. Part 4: yes (item 17).
23. Part 5: yes (item 16).

Verify list:

24. V1 and V2: yes. Green runs cover none of the look-only behaviour.
25. V3: yes. G59's tests do not touch the changed reader.
26. V4: no.
27. V6: it checks against no rule.

## 6. Implied inputs

1. **A menu key pressed under an overlay**, with the palette, a confirm dialog (for example the close question over unsaved text), the key sheet or the update tray open. `appKey` returns null under an overlay (resolve.ts:173), Ctrl+Tab and Cmd+Shift+F also yield under one (:249-251, :299-307), and nothing calls `preventDefault`. On macOS the menu then takes Cmd+W, Cmd+N, Cmd+F, Cmd+Shift+T, Ctrl+Tab and Cmd+Shift+F and runs Close Tab and the rest under the overlay. Today those presses do nothing there. Expected: the page answer refuses under an overlay as the key does. Missing from Cases.
2. **A press or a menu click while an audience window is focused.** `focused()` falls back to `lastMain()` (windows.ts:483-486), so Cmd+W, Cmd+S or Close Tab in the audience window would close or save the main window's tab. Expected: nothing, or the audience window's own action. Missing.
3. **Open Recent's data path and argument.** The host has no recent list (1.6). Choosing a file needs its path, while the bridge carries "a name from one fixed list" with no argument (:55). A new bridge channel, a wire shape, is a user-visible design decision under `spec.md:18` and is not in "Decisions taken". Expected: named. Missing.
4. **The settings file is a symlink out of the workspace or into a `secrets` folder.** The file route refuses such a path (G2 and G3), but a direct read in `workspacesAnswer` would hand its text to the page. Expected: null, read under the file route's guards. Missing.
5. **A key held by both the menu and Monaco or the terminal.**
   - Monaco's Cmd+F and the terminal's Ctrl+- call `preventDefault` (resolve.ts:169-170, HELP.md:122), so the menu does not run.
   - Ctrl+Tab while a text field or the terminal's textarea holds the keyboard is left by the page (`held`, resolve.ts:299-307), and the menu then cycles tabs: ruling 147's accepted con.

   Expected results as stated, but no case or look names them. Missing.
6. **A press in a popped-out window.** The window's page runs its own keys, and a key it leaves goes to the focused float window. Expected: the float's tab (case 6 covers close-tab only). Settings and Help in a float: decision 1 says "keep opening in the window that gets the message", while :55 says "keep their behaviour", which today is the last main window. The two disagree. Missing.
7. **Two items with one key.** Quick Open (case 2: Cmd+P) and Go to File... ("the file mode", `KEY_ROWS.files`, Cmd+P) are both menu items with Cmd+P on macOS. Expected: one shows the key, or both run the same command once. Missing.
8. **An item whose command is unavailable**: Accent Colour... on `available: false`, a dock toggle with no docked float, Reopen Closed Tab with none, Open Folder... while the panel is open, Close Workspace refused (its refusal is said in the palette, CommandRows.svelte:17-18, but the menu has none). Expected: drawn disabled, or the refusal said somewhere. Missing.
9. **Split Terminal with no terminal focused**, or on a terminal that cannot split (`splitItems`, terminal-list.ts:350-352). New Terminal With Profile is a submenu of shell, claude and codex (:530-536), not a "..." palette. Expected: not stated. Missing.
10. **An author string with "et al" inside a list element** (`["Osei M., et al."]`), in upper case ("M. Osei ET AL."), or "et al." alone. Expected: `osei...`, `osei...` and `anon...`. Missing.
11. **The settings file changes while the folder list is being read, or during a workspace switch.** The fs store marks WORKSPACES again (fs.svelte.ts:390-392). Whether a mark during an in-flight read re-reads is not verified. Expected: the later answer wins, and a reader of a root that left the workspace gets none. Missing.
12. **A HEAD or Index tab of a repository that is itself a workspace folder.** Its root is the repository path, not the key, so by Part 3 it gets no settings, while the working tab of the same file does. Expected: stated either way. Missing.
13. **A repository whose details show while its state is not readable.** Repo.svelte:259-267 already draws a branch line and the path for `shape !== 'readable'`, so the new header would repeat the branch. Also unstated: one repository against several, and whether the header shows when the list is hidden. Missing.
14. **A non-root key whose request is still in flight when the readers switch to the folder list**, and an `FsRoot` built by tests without `settings` (1.13). Expected: no 404 and no type break. Missing.

## 7. ADRs

1. `ls docs/adr` (repository root) prints "No such file or directory". `ls tools/oculus/docs/adr` prints "No such file or directory". `find . -type d -iname 'adr*'` (without node_modules and worktrees) prints nothing. There is no ADR folder.

## 8. Dictated text

Each item names the `grep -n` in O42.md that finds it.

1. `grep -n "A design ruling decides" O42.md` (:7): holds.
2. `grep -n "Diagnosis is banned" O42.md` (:9): holds.
3. `grep -n "^- oculus: About" O42.md` (:41), "About, Settings..., then the `services` role submenu (Services), then Hide, Hide Others, Show All, Quit, as today": holds. The words today are "About oculus", "Hide oculus" and "Quit oculus" (desktop.yml:30,42,47), kept "as today".
4. `grep -n "^- File: New Text File" O42.md` (:42):
   - "Switch Workspace...", "New Workspace...", "Save Workspace As..." and "Add Folder to Workspace..." break the brief's own rule at :39 ("an existing catalogue word where one is named"), because the named words are `cmd_workspace: Switch Workspace`, `cmd_workspace_new: New Workspace`, `cmd_workspace_save: Save Workspace As` and `cmd_folder_add: Add Folder to Workspace`, all without "...";
   - "Open Folder..." matches `files.yml:123 menu_open_folder`, which the brief does not name, while `cmd_folder` is "Open a folder in the Files view";
   - "Save All" breaks the same rule: the named word at files.yml:50 is "save all" in lower case;
   - "New Text File" exists at `ui.yml:85` and is not named, so a duplicate key would be made under `desktop.menu`, against "a parser, a fold or a rule exists once" (`spec.md:87`);
   - the rest hold.
5. `grep -n "^- Edit: Undo" O42.md` (:43), "Find, Find in Files": holds.
6. `grep -n "^- View: Command Palette" O42.md` (:44):
   - "Theme...", "File Icon Theme..." and "Accent Colour..." break the :39 rule, because the named words are sentences (`cmd_theme: Switch the theme`, `cmd_file_icons: Switch the file icon theme`, `cmd_accent: Set the accent colour`);
   - "CRT Overlay" against `cmd_crt: Turn the CRT overlay on or off` breaks it the same way;
   - "Toggle Left Dock", "Toggle Right Dock" and "Toggle Bottom Dock" match `cmd_toggle_*` and hold;
   - "Accent Colour..." also names an unavailable command (3.7).
7. `grep -n "^- Go (new)" O42.md` (:45):
   - "Back, Forward" against the named `cmd_go_back: Go Back` and `cmd_go_forward: Go Forward` breaks the :39 rule;
   - "Go to Project...." is the label "Go to Project..." followed by a full stop, and its command (`:goto `, `cmd_goto: Open a project in a tab`) is not paired with it in the brief;
   - the rest hold.
8. `grep -n "^- Run (new)" O42.md` (:46): Step Over, Step Into and Step Out exist at `debug.yml:82-84` and are not named, so duplicates would be made (as in item 4). The rest hold.
9. `grep -n "^- Terminal (new)" O42.md` (:47), "New Terminal With Profile...": breaks the :39 rule, since the named word (terminal.yml:35) has no "...". Its "..." also brings it under :51's rule ("an item whose label ends in '...' opens the palette prefilled"), while it is a submenu in the Terminal tab. New Terminal and Split Terminal hold.
10. `grep -n "^- Window: Minimize" O42.md` (:48): holds.
11. `grep -n "^- Help: oculus Help" O42.md` (:49): holds.
12. `grep -n 'ends in "..."' O42.md` (:51): the rule has exceptions it does not list. "Settings..." (desktop.yml:51) opens Settings, and "New Terminal With Profile..." runs a Terminal action. Open Folder... and Add Folder to Workspace... are listed as exceptions; these two are not.
13. `grep -n "^## Decisions taken" -A7 O42.md` (:151-158): plain and ASCII. They hold as text. Decision 1's "Settings and Help keep opening in the window that gets the message" contradicts :55's "Settings and Help keep their behaviour" (6.6).
14. `grep -n "^## Conventions" -A4 O42.md` (:166-170): holds.
15. `LC_ALL=C grep -n '[^ -~]' O42.md` printed nothing. `grep -n ' - \| -- ' O42.md` found only markdown sub-bullet indentation (:186-190). Holds.

## Declined to judge

1. Whether the items in Part 1 are exactly those of "the menu proposal of 2026-10-18". Its text is not in the ledger: `grep -rln 'Go to Project\|Accent Colour\|Update Tasks'` finds only O42.md.
2. The order of page and menu for a Cmd key on macOS in Electron 44.5.1. Plan.md's 147 text says "not verified", and checking it needs the app, which I may not run.
3. The 404 of a text read for a non-root key (brief :25, O40 look 33). Checking it needs a server.
4. Whether the desktop menu is drawn at all off macOS with `titleBarStyle: 'hidden'`. Checking it needs the app; only the test title at app-keys.test.ts:195 says it is not.
5. Whether `seenBy` (git.ts:548) drops the event of a page save before `markedBy` is reached. The answer would need a run of the watcher.
6. Whether a WORKSPACES mark made while a read is in flight causes a second read. That needs a run of the query store.
7. Whether "the source list" in ruling 138 means the source tab's options, as the brief reads it. Only Axel's wording settles that.

Usage: a66ad9473b70689d0, claude-opus-5-5, 284,652 tokens, 95 tool uses, 16.0 min

## Closed

Each finding below is closed by the change to the brief named beside it, made when /spec runs again after open item 148; 4.1 is raised as open item 148.

- 1.1: `src/lib/state/shared/stores/desktop.ts` (`DesktopCommand`) joins the paths; the type is replaced by the command list's type.
- 1.2, 3.6, 4.8: the keys of `appKey`, `navigateKey`, `SAVE_PRESS`, the inline Ctrl+Tab, Cmd+Shift+F and Cmd+Shift+H keys and `debugKeyOf` are made into one table each in `src/lib/data/helpers/keys/oculus/` that `resolve.ts` and the menu both read; `resolve.ts`, `editor-keys.ts`, `debug-keys.ts` join the paths; `ACCELERATORS`' new entries are derived from those tables, never written as strings.
- 1.3: `workbench-keys.svelte.ts` and `Workbench.svelte` join the paths; the page's answer to a menu command runs `perform`'s action through the options the Workbench already hands it.
- 1.4: the Terminal items run state-level functions of `src/lib/state/sessions/terminal/` (New Terminal and the profile kinds as the Terminal tab's `+` and its kinds list start them; Split Terminal on the active terminal of the Terminal tab on screen, nothing when there is none or it cannot split); New Terminal With Profile is a native submenu of the profile kinds, so it has no "..."; Save and Revert File go through `editorStatus.ask` on the source tab on screen, as the palette's editor actions do; `source.svelte.ts` is not changed.
- 1.5: `Repositories.svelte` joins the paths and hands `Repo` the label `labels[root] ?? root`.
- 1.6, 6.3: Open Recent: the page sends its recent list to the host over one new bridge call whenever the list changes, and the host rebuilds the submenu; choosing one sends `command` `open-recent` with the file's path as its one argument; `preload.cjs`, `decide/channels.ts`, `windows/bridge.ts` join the paths (decision, internal and reversible).
- 1.7, 3.10: `heard` in `src/lib/server/root/watch/git.ts` marks the root for an event at the root's own `.oculus/settings.yml`, so the folder list is read again; `git.ts` (876 lines) stays under 880 or is split.
- 1.13, 6.14: `settings` is a required field of the server's answer and optional on `FsRoot` (absent in a test literal reads as null).
- 2.7: ruling 138's "pushes" is carried out on what it names (the folder list the page holds); the correction is in O42's plan line, and nothing else changes.
- 2.8, D7: "the source list" is read as the source tab's options (`repository()` and `named()`), the reader the ruling's own text names in its options.
- 3.5, 6.2: a menu command whose focused window is no entry (the audience window) does nothing; Settings and Help keep going to the last main window, so decision 1 is narrowed to the other commands.
- 3.7, 6.8: an item whose page command is unavailable still sends it; the page says the refusal as a notice, the palette's words; Accent Colour... stays and gets the same notice while `accent` is unavailable.
- 3.13, 6.17 (case 17): under rice the `# ` mark stays on the message's line (it moves into the message's box); the brief says so.
- 3.14: `context.ts` 880, `Source.svelte` 519, `Repositories.svelte` 517, `git.ts` 876 are named with the split rule.
- 3.15: new modules go to folders with room: `src/lib/shell/commands/`, `src/lib/shell/window/`, `src/lib/views/sources/repositories/repo/`; the brief names each.
- 3.16: G77's and G8's tests join the checks to run.
- 4.1: open item 148.
- 4.2, 4.3, 5.1-5.3, 5.10: cases 1, 3 and 10 are rewritten: the menu's template is built by a function the test reads for each item's command name and its key from the page's table (no label assertion); the header's drawing and the line's place are look rows.
- 4.4, case 15: by ruling 138 (b) the value is the text or null; the Settings row says one sentence for null, that the file is missing or does not read as text.
- 4.5, 4.6: verify item 6 is removed; each case's test is named a proof or an audit.
- 4.7: the brief names the worktree, a base copy `.agents/worktrees/O42-base/tools/oculus` and its `unused-exports.txt`, as O40's did.
- 4.9: verify item 3 runs G59's tests only if `saveRulesOf`'s save path changes; case 18 stays, since `Source.svelte` changes.
- 6.1: the page refuses a menu command under an overlay (palette, tray, confirm, key sheet) as its key does; a case.
- 6.4: `workspacesAnswer` reads the settings file through the file route's text read with its guards (real path inside the root, no secrets folder, text only, the limit); a link out of the root gives null; a case.
- 6.5: the Monaco and terminal keys and Ctrl+Tab in a field are look rows with their expected results.
- 6.6: case 6 covers close-tab and save in a float window.
- 6.7: Quick Open runs the palette's open mode (Cmd+K) and Go to File... the file mode (Cmd+P), so no two items share a key.
- 6.9: as 1.4.
- 6.10, 5.16: Part 5 reads a first author written "Osei M." or "Osei M.M." as surname then initials, drops a trailing "et al." in any case with or without the full stop, and drops an "et al." list element; cases with those inputs.
- 6.11: a mark while a read is out reads again after it (the query store's `replace` mark); a case.
- 6.12: a reader looks a root up by key, then by folder path, so a HEAD or Index tab of a workspace folder's repository gets that folder's settings.
- 6.13: the header carries the branch whenever one is known, the old branch line goes, and the path is the header's hover words.
- 8.4 to 8.12: labels reuse the existing title-case words (`ui.yml` `strip_new_text_file`, `files.yml` `menu_open_folder`, `debug.yml` `step_over`, `step_into`, `step_out`, `app.yml` `cmd_go_back`, `cmd_go_forward`, `cmd_toggle_*_dock`, `terminal.yml` `menu_new`, `menu_new_profile`, `menu_split`, `repositories.yml` `clone`); the other labels are new `desktop.menu` keys with the "..." the menu shows; the "..." rule lists its exceptions (Settings..., Open Folder..., Add Folder to Workspace...); "Go to Project...." loses its extra full stop and runs `:goto `.
