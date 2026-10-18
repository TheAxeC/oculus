# O42 report: the app's menu, the repository header, the settings file in the folder list, the rice empty state and the citation key of "et al."

Everything in the brief is done. The cases that only the page or the app shows (9, 17, 18, 19, and the look rows of the menu below) are proved at the look on landing, as the brief says.

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md`, the section as it stands (it holds no entry):

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

## The cases' first run (on the unchanged tree, the base copy)

Each new or changed test file was copied into the base copy `/Users/axelfaes/workspace/research-hub/.agents/worktrees/O42-base/tools/oculus`, run there, and removed again (the base `literature.test.ts` was restored from a saved copy; `cmp` of the two prints nothing). Vitest's own marks are written by name, `<multiplication sign>` for its failed-row mark.

1. Menu template, macOS. `npx vitest run tests/server/desktop/menu-template.test.ts` in the base copy: `FAIL |unit| tests/server/desktop/menu-template.test.ts`, `Error: Cannot find module '../../../src/lib/data/helpers/keys/oculus/menu-commands.ts' imported from .../O42-base/tools/oculus/tests/server/desktop/menu-template.test.ts`, `Test Files 1 failed (1)`, `Tests no tests`. Proof: the unchanged tree has no command list and no template function.
2. Menu keys, macOS. The same run and output as case 1 (the rows 'shows and takes the page key of each command whose key holds Cmd or Ctrl' and 'shows no key for a command whose key holds neither Cmd nor Ctrl' are in that file).
3. Menu keys, Linux. The same run and output as case 1 (describe 'the menu template off macOS').
4. The page's answer. `npx vitest run tests/shell/window/menu-answer.test.ts` in the base copy: the import of `answerMenu`, `menuPage` from `src/lib/shell/window/menu-answer.ts` fails at line 17 of the test, `Test Files 1 failed (1)`, `Tests no tests`.
5. A popped-out window. The same run and output as case 4 (describe "a popped-out window's answer").
6. Open in Browser. The same run and output as case 1 (describe 'where a command and Open in Browser go').
7. Open Recent. The same run and output as case 1 (describe 'Open Recent').
8. The apps' keybinding audit. `npx vitest run tests/state/system/apps/app-keys.test.ts` in the base copy: `Test Files 1 passed (1)`, `Tests 71 passed (71)`.
9. Repository header. A look on landing; nothing runs it here. Read on the base: `Repo.svelte` (471 lines) draws the moving line at its top (`.running`) and, for a state that is not readable, a branch line and the path.
10. Settings text, server. `npx vitest run tests/state/sources/folder-settings.test.ts` in the base copy: `<multiplication sign> is the text of a folder that holds one and null for every file the route would not read as text`, `AssertionError: expected { held: undefined, ...(5) } to deeply equal { ...(6) }` with every folder received as `undefined` (`binary`, `gone`, `held`, `large`, `linked`, `none`).
11. The watcher. The same run: `<multiplication sign> reads the workspaces again for an event at the root's settings file and not for one below it`, `Error: Test timed out in 5000ms.`; a print in the base copy showed the event of `sub/.oculus` heard (`[{"root":".../oculus-settings-watch-EI4Msx","folders":["sub/.oculus"]}]`) and no `workspaces: true` after the write of the root's own settings file. `Tests 2 failed | 1 passed (3)` (the passing row is 'is read as null from an answer that carries none or carries no text', which the base reads as null too). The test was edited after this run (a probe folder whose event marks the point after which the writes' events are counted); that edit is checked by reading it.
12. No request. `npx vitest run tests/state/sources/settings-readers.test.ts` in the base copy: `TypeError: Cannot read properties of undefined (reading 'listing')` at `named src/lib/views/shared/prose/editor/source-options.ts:129:36`, the base readers asking the file store for listings and texts.
13. HEAD or Index tab. The same run, the row 'give a tab rooted at the repository path of a folder that folder's records, and a root that is no folder none, asking for nothing': the same `TypeError ... (reading 'listing')`. That run held a third row on the Settings sentence, which was taken out of the test since case 14 is a quoted run; the other two rows were edited after the run (`languages` given as a `Map`, the type the readers take), checked by reading.
14. The Settings row for a folder whose `settings` is null. Base copy: `node --input-type=module -e` with `globalThis.$state = (value) => value;`, then `repoOrigins([{ key: 'plain' }], () => missing, parse)` where `missing` is a 404 answer: printed `[]` (no line for a folder with no settings file).
15. Cmd+S before the settings (G107). Base copy: `npx vitest run tests/views/sources/source/save-key.client.test.ts` cannot run there: `Error: Denied ID .../migration-O42/tools/oculus/node_modules/@shikijs/themes/dist/andromeeda.mjs?url` (the base copy's `node_modules` is a link into the worktree, outside vite's allowed folders). The same command in the worktree before `Source.svelte` was changed: `Test Files 1 passed (1)`, `Tests 1 passed (1)`.
16. Citation key. `npx vitest run tests/server/edit/literature.test.ts` in the base copy: `Tests 7 failed | 17 passed (24)`. The failing rows: 'M. Osei et al.', 'M. Osei et al', 'M. Osei ET AL.', `['Osei M.', 'et al.']`, `['Osei M.']`, `['Van Hulle M.M.']`, `['et al.']`, with `expected 'al2026certified' to be 'osei2026certified'`, `expected 'm2026certified' to be 'osei2026certified'`, `expected 'mm2023tensor' to be 'vanhulle2023tensor'` and `expected 'al2026certified' to be 'anon2026certified'`. The kept forms pass on the base: `['Faes A']`, `['Van Hulle MM']`, `['Marc M. Van Hulle']`, `'Osei, M., et al.'` and `'Marc M. Van Hulle'` as strings, and the rest.
17. Rice empty state. A look on landing. Read on the base: `Empty.svelte:77-83` set `flex-direction: row` under `body.rice`, so the `# ` mark, the message and the action sat side by side as flex items.
18. Monaco's Cmd+F, the terminal's Ctrl+-, Ctrl+Tab with a text field focused. A look on landing in the app.
19. A key press on macOS for Save, Close Tab and Next Tab runs once. A look on landing in the app.

## DONE / NOT DONE

| Check | State | Command and output |
| --- | --- | --- |
| Part 0, G108 to G110 in `agents/guarded.md` after G107 | DONE | `grep -n "^- G10[78]\|^- G109\|^- G110" .scratch/migration/agents/guarded.md` lists the four in order; G59's Code line names `settingsOf` too |
| Part 1, the menu | DONE | `npx vitest run tests/server/desktop/menu-template.test.ts tests/shell/window/menu-answer.test.ts`: `Test Files 2 passed (2)`, `Tests 119 passed (119)` |
| Part 2, the repository header | DONE, look owed | svelte-check and eslint in the verify list below; case 9 at the look |
| Part 3, the settings text | DONE | the G109 files in the guarded run below; case 14 run: `[{"kind":"none","root":"plain","lead":"","label":"plain","tail":" has no .oculus/settings.yml, or one that does not read as text"},{"kind":"none","root":"gone",...}]` |
| Part 4, rice empty state | DONE, look owed | case 17 at the look |
| Part 5, citation key | DONE | `tests/server/edit/literature.test.ts` in the guarded run below, 24 rows |
| 1. `npm run diagrams && npm run test:quick` | DONE | exit 0; last lines below |
| 2. Tests of G8, G59, G69, G77, G107, G108, G109, G110 | DONE | the 60 files named on their Test lines plus `tests/state/client/terminal/terminal-close.test.ts`: `Test Files 61 passed (61)`, `Tests 769 passed (769)` |
| 3. Boundaries | DONE | `npx vitest run tests/checks/tree/boundaries.test.ts --testTimeout 0 --hookTimeout 0`: `Test Files 1 passed (1)`, `Tests 11 passed (11)` |
| 4. Sizes and folders | DONE | `wc -l` below; `ls -A <folder> \| wc -l` of each folder with a new item: 9, 9, 10, 8, 3, 7, 6, 1, 7 |
| 5. First runs on the base | DONE | the cases above |
| Unused exports | DONE | `sh utils/unused-exports.sh` against the base list: `diff` prints nothing, exit 0 |
| History words | DONE | grep of every added line for was, previously, formerly, used to, no longer, earlier, old, replaced, moved, fix, bug, revert, now: 11 hits, each a present-tense description (a file "was not read", a window "moved or resized", "from now on" of a wait) |

The verify list's last lines, as printed:

```
ok      ASCII gate (1.0 s)
ok      prettier (1.3 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.1 s)
ok      eslint (16.5 s)
ok      svelte-check (26.8 s): 1792332579815 COMPLETED 515 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (62.3 s): Duration  52.62s (transform 80.97s, setup 0ms, import 141.08s, tests 25.80s, environment 13.92s)
test:quick: 64.6 s (limit 45.0 s); every command passed
test:quick: over the time limit
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
```

Exit status 0. The list selected `68 changed file(s), from git since HEAD` and `73 test file(s), 9 essential`. It ran over its 45 s limit at 64.6 s; every command passed.

What the green results do not cover: no page, server, Electron app or browser was run, so the menu as Electron draws it, the keys taken on macOS, the bridge messages between processes, the repository header and the rice empty state are proved only at the look; `tests/checks` (the diagrams' check among them) runs at landing.

## Files and line counts

Changed (from `diff -rq` against the base copy, then `wc -l`): `DESIGN.md` 763, `HELP.md` 512, `config/text/desktop.yml` 91, `config/text/views/system/workbench.yml` 249, `src/desktop/app.ts` 382, `src/desktop/decide/channels.ts` 56, `src/desktop/preload.cjs` 57, `src/desktop/windows/bridge.ts` 313, `src/desktop/windows/menu.ts` 14, `src/desktop/windows/windows.ts` 532, `src/lib/data/helpers/keys/oculus/debug-keys.ts` 31, `desktop-keys.ts` 156, `editor-keys.ts` 44, `resolve.ts` 402, `src/lib/server/edit/feeds/literature-key.ts` 153, `src/lib/server/files/fs.ts` 561, `src/lib/server/root/watch/git.ts` 878, `src/lib/shell/Workbench.svelte` 480, `src/lib/shell/keys/Palette.svelte` 514, `src/lib/shell/keys/rows/CommandRows.svelte` 260, `src/lib/shell/keys/workbench-keys.svelte.ts` 620, `src/lib/shell/window/desktop-windows.svelte.ts` 76, `src/lib/state/client/context.ts` 880, `src/lib/state/sessions/terminal/terminal-lists.ts` 213, `src/lib/state/sessions/terminals.svelte.ts` 880, `src/lib/state/shared/stores/desktop.ts` 147, `src/lib/state/sources/explorer/view/place.ts` 280, `src/lib/state/sources/fs-transport.ts` 573, `src/lib/state/system/config/editors/origins.ts` 127, `src/lib/state/workbench/navigation/editor-status.svelte.ts` 285, `src/lib/state/workbench/navigation/editor-text.ts` 153, `src/lib/ui/controls/editor/chords.ts` 152, `src/lib/ui/frame/Empty.svelte` 106, `src/lib/views/sessions/terminal/start/Composer.svelte` 519, `src/lib/views/sessions/terminal/terminal-list.ts` 719, `src/lib/views/shared/prose/editor/source-options.ts` 169, `src/lib/views/sources/repositories/RepoList.svelte` 309, `Repositories.svelte` 518, `diff/DiffSection.svelte` 504, `repo/Repo.svelte` 443, `src/lib/views/sources/source/Source.svelte` 519, `src/lib/views/sources/source/status/ask-perform.ts` 142, `src/lib/views/system/workbench/editors/Origins.svelte` 47, `src/routes/+page.svelte` 331, `tests/server/edit/literature.test.ts` 192, `tests/views/sources/source/SaveKeyHost.svelte` 88, `.scratch/migration/agents/guarded.md`, and the diagrams `npm run diagrams` wrote (`docs/diagrams/layers`, `layer-server`, `layer-shell`, `layer-state`, `layer-views`, each `.dot` and `.svg`).

New: `src/desktop/windows/menu-template.ts` 324, `src/lib/data/helpers/keys/oculus/menu-commands.ts` 87, `src/lib/data/helpers/keys/oculus/page-keys.ts` 101, `src/lib/shell/commands/colon-effects.ts` 77, `src/lib/shell/window/menu-answer.ts` 211, `src/lib/shell/window/menu-commands.svelte.ts` 32, `src/lib/views/sources/repositories/repo/branch-words.ts` 21, `tests/server/desktop/menu-template.test.ts` 341, `tests/shell/window/menu-answer.test.ts` 194, `tests/state/sources/folder-settings.test.ts` 184, `tests/state/sources/settings-readers.test.ts` 133.

Paths written beyond the brief's list, each because the change reaches it: `src/routes/+page.svelte` (hands Save All to the workbench, since the shell may not read `autosave`); `src/lib/shell/window/menu-answer.ts` and `menu-commands.svelte.ts` (the page's answer, in a folder the brief names as having room); `src/lib/shell/keys/Palette.svelte` (reads `dockedEdges` from the module the effects moved to); `src/lib/state/sessions/terminals.svelte.ts` (the store the shell may import; see the judgment calls); `src/lib/views/sessions/terminal/start/Composer.svelte` (imported `kindLabel`, now `profileWords`); `src/lib/ui/controls/editor/chords.ts` (imported `SAVE_PRESS` from `editor-keys.ts`, now from `page-keys.ts`); `src/lib/state/workbench/navigation/editor-status.svelte.ts` and `src/lib/views/sources/source/status/ask-perform.ts` (`REVERT_ACTION`, the id Revert File asks for, named once).

## Judgment calls

1. An unavailable command sent from the menu posts a warning notice in the words its palette row carries: `files.picker_busy` for Open Folder and Add Folder to Workspace while the folder panel is open (what a press of the row says), else the row's note, the command's `why` or `app.palette_unavailable`. One module, `shell/commands/colon-effects.ts`, gives both words to the palette and the menu.
2. Accent Colour... is always unavailable (`commands()` sets `available: false`), so the menu item posts that notice.
3. Save All is `client.autosave.saveEvery()`, handed to the workbench as a prop by `routes/+page.svelte`, since `autosave` is not among the shell's stores.
4. The G109 tests are in `tests/state/sources/`, since `tests/server` holds ten items.
5. Off macOS the menu's own items (Settings, New Window, Close Window, Reload, Full Screen, the zooms, DevTools) keep today's registration; only items that send a page command carry `registerAccelerator: false`.
6. New title-case catalogue keys under `desktop.menu` where an existing word differs only in case or form: `close_tab` beside `ui.close_tab` "Close tab", `save_all` beside `files.editors_save_all` "save all", `crt` "CRT Overlay" beside `workbench.settings_browser_crt` "CRT overlay", `update_tasks` beside `app.tasks.update_tasks` "Update tasks".
7. `?` as an Electron accelerator off macOS (Keyboard Shortcuts shows it there) is not verified, since no app runs here; the look on Linux would show it.
8. The Settings `editor.languages` row now says one sentence for every folder whose settings text is null, `'{0} has no {1}, or one that does not read as text'`; `settings_origin_cut` ("longer than the file window reads") had no reader left and is removed. A file over the limit says the new sentence.
9. The repository header is the explorer's section-head row (`TreeItem ... heading`), so the name is drawn in that style's capitals.
10. Cmd+S in a popped-out window now saves the float's tab: `sourceKeys` in `Workbench.svelte` reads `pageActiveTab` (the tab the page draws) where it read the main area's `activeInstance`; the menu's Save uses the same function, which G108's float rows assert.
11. The Terminal items run two functions added to the terminals store (`startOnPage`, `splitShown` in `state/sessions/terminals.svelte.ts`), since the shell's boundary row allows `state/sessions/terminals` and no module under `state/sessions/terminal/`. To keep the store at 880 lines, `pageTab`'s rule and `showTerminal`'s writes moved into `state/sessions/terminal/terminal-lists.ts` (`pageTabOf`, `showIn`), unchanged in what they do; the terminal tests (`show-focus.client`, `terminal-close`, `ending.client`) pass.
12. New Terminal from the menu starts in the page's Terminal tab by `pageTarget`'s rule (the active Terminal tab, else the first), else in a new Terminal tab opened on that page (the float in a popped-out window), which is activated. Split Terminal does nothing, and says nothing, when the tab on screen is no Terminal tab, shows no terminal, or shows one with no folder.
13. Open Recent is fed the open workspace's whole `recent` list, the open one included, from the main window's page only, and a read that changes no entry sends nothing.
14. A command sent with an argument it does not take runs nothing, as a name not in the list does.
15. The colon list the menu reads is `commands(..., source = false, served = '', panelOpen, reopenable = true, docked)`: `source`, `served` and `reopenable` change only commands the menu does not run through the colon list.
16. `kindLabel` and `PROFILES` of `terminal-list.ts` are replaced by `profileWords` and `TERMINAL_PROFILES` of `menu-commands.ts`, which the host's menu reads, so the kinds and their words are written once.
17. Found and not changed (outside the brief): in a popped-out window the apps' keybindings still resolve against the main area's tab (`appKey`'s `tab: activeMain` in `Workbench.svelte`), so an app binding's `when` reads the wrong tab there. It is a G77 behaviour no part of this brief covers.

## Host- and user-visible changes, for the look

- The menu bar (app, macOS). Before: oculus, File (New Window, Close Window), Edit, View, Window, Help (oculus Help). After: oculus (with Services), File, Edit (with Find and Find in Files), View, Go, Run, Terminal, Window (with Next Tab and Previous Tab), Help (with Keyboard Shortcuts and Update Tasks), the items in the brief's order. Look: each item runs once in the window the reader is in; Save shows Cmd+S, Close Tab Cmd+W, New Text File Cmd+N, Quick Open Cmd+K, Go to File... Cmd+P, Command Palette Cmd+Shift+P, Find Cmd+F, Find in Files Cmd+Shift+F, Next Tab Ctrl+Tab; Keyboard Shortcuts, Start or Continue and Step Over show no key.
- The menu off macOS: every page command's item shows its key and a press goes to the page (cases 3 and 18).
- Open Recent: a submenu of the recent workspaces, a gone file greyed; a pick switches as `:workspace` does.
- Open in Browser: opens `<origin>/` of the window the reader is in in the default browser.
- A popped-out window: Save, Revert File and Close Tab act on its float's tab; Settings and Help open into its float. Before, Settings and Help went only to the main window and Cmd+S in a float window saved the main area's tab.
- Under the palette, the update tray, a confirm or the key sheet, no menu item runs.
- An unavailable command (Accent Colour..., a dock toggle with no docked float, Open Folder... with the panel open) posts a warning notice.
- Repositories view, a repository open: before, a moving line at the top of the details and, for a state that is not readable, a branch line and the path; after, a header row with the repositories glyph, the list row's name and the branch (as the row draws it, a detached HEAD included), the path as hover words, and while an action runs the moving line along the header's foot with no row moving (case 9).
- Settings, Workbench, the `editor.languages` row with a folder that has no `.oculus/settings.yml`: before, no line for it; after, "<folder> has no .oculus/settings.yml, or one that does not read as text".
- A HEAD or Index tab of a workspace folder's repository: before, its `.oculus/settings.yml` was not found (a 404); after, the folder's indentation and save rules apply.
- An edit of a root's `.oculus/settings.yml` on disk: before, the folder list was not read again; after, it is, and the readers follow.
- Rice theme, an empty view with an action, narrow and wide pane: before, `# `, the message and the action side by side; after, `# ` and the message on one left-aligned line and the action under it; the error box unchanged (case 17).
- Save to Literature with "M. Osei et al." (and the other case 16 forms): before `al2026...`, `m2026...`, `mm2023...`; after `osei2026certified`, `vanhulle2023tensor`, `anon2026certified`.

## Edits to existing assertions, allow lists or predicates

`diff -u` of each changed existing test file against the base copy:

```
--- O42-base/tools/oculus/tests/server/edit/literature.test.ts
+++ migration-O42/tools/oculus/tests/server/edit/literature.test.ts
-/** The key rule: the authors, the year and the title a paper carries, and the key it gets. */
-const KEY_ROWS: { authors: string[]; year?: number; title: string; key: string }[] = [
+/** The title of the rows whose first author is written with "et al.". */
+const CERTIFIED = 'Certified robustness of tensor networks';
+
+/**
+ * The key rule: the authors, the year and the title a paper carries, and the key it gets. Authors
+ * are a list or one line of names, as a feed sends them (G110).
+ */
+const KEY_ROWS: { authors: string | string[]; year?: number; title: string; key: string }[] = [
...
-    { authors: [], title: 'Tensor', key: 'anonndtensor' }
+    { authors: [], title: 'Tensor', key: 'anonndtensor' },
+    { authors: 'M. Osei et al.', year: 2026, title: CERTIFIED, key: 'osei2026certified' },
+    { authors: 'M. Osei et al', year: 2026, title: CERTIFIED, key: 'osei2026certified' },
+    { authors: 'M. Osei ET AL.', year: 2026, title: CERTIFIED, key: 'osei2026certified' },
+    { authors: ['Osei M.', 'et al.'], year: 2026, title: CERTIFIED, key: 'osei2026certified' },
+    { authors: ['Osei M.'], year: 2026, title: CERTIFIED, key: 'osei2026certified' },
+    { authors: ['Van Hulle M.M.'], year: 2023, title: 'Tensor', key: 'vanhulle2023tensor' },
+    { authors: ['et al.'], year: 2026, title: CERTIFIED, key: 'anon2026certified' },
+    { authors: 'Osei, M., et al.', year: 2026, title: CERTIFIED, key: 'osei2026certified' },
+    { authors: 'Marc M. Van Hulle', year: 2023, title: 'Tensor', key: 'vanhulle2023tensor' }
 ];

--- O42-base/tools/oculus/tests/views/sources/source/SaveKeyHost.svelte
+++ migration-O42/tools/oculus/tests/views/sources/source/SaveKeyHost.svelte
-        fs: client.fs
+        folders: () => client.fs.workspaces().folders
```

No existing row's expected key changed; rows are added. `SaveKeyHost.svelte` follows the readers' new input (the folder list in place of the file store). No allow list or predicate changed.

## Greps of the changed names, and the document paragraphs read

`grep -rn -E "<name>" src tests config docs HELP.md DESIGN.md README.md` (diagrams left out), count of lines: `DesktopCommand` 0; `settings_origin_cut` 0; `kindLabel` 7, all local functions of `InboxCard.svelte`, `Customizations.svelte` and `Timeline.svelte`, none the terminal one; `PROFILES` 9, all `TERMINAL_PROFILES`; `fileText` 25, none in the three readers or their callers (`source-options.ts`, `editor-text.ts`, `origins.ts`, `Source.svelte`, `DiffSection.svelte`, `context.ts` grep to nothing); `settings_origin_none` 2; `settingsOf` 24; `REVERT_ACTION` 7; `SAVE_PRESS` 7; `debugKeyOf` 5; `buildMenu` 3; `registerBridge` 3; `menuTemplate` 5; `RECENT_WORKSPACES` 4; `recentWorkspaces` 3; `answerMenu` 12; `useMenuCommands` 3; `colonEffects` 5; `dockedEdges` 5; `dockEdgeOf` 5; `pressRefusal` 5; `noteOf` 17 (the other hits are other `noteOf` functions); `pageTabOf` 6; `startOnPage` 5; `splitShown` 5; `branchOf` 10; `branchTitle` 3.

Document paragraphs:

- `HELP.md`, "The window": a bullet on the app's menu bar is added (rewritten).
- `HELP.md:329`, the order indentation comes from, the repository's `.oculus/settings.yml` included: still true.
- `HELP.md:457`, the moving line of a running write in the repository's view: still true.
- `DESIGN.md:530`, Keybindings: the accelerators of the menu, now set by `desktop/windows/menu-template.ts` with the page's keys read from `page-keys.ts` and `palette-table.ts`: rewritten.
- `DESIGN.md:616`, `workspacesAnswer` writing `real` beside `dir`: still true.
- `DESIGN.md:675`, the citation key made from the first author's surname: still true.
- `DESIGN.md:737`, the preload's one bridge object answering the top frame alone: still true (the new `oculus:recent-workspaces` handler checks its caller with `callerOf`, as the others do).
- `DESIGN.md:748`, the application menu among what is the app's: still true.
- `docs/templates.md:468`, `settings.yml`: still true.
- `docs/data-map.md:26` and `:197`, a repository's `.oculus/settings.yml`: still true.
- `README.md`: no paragraph names the menu, the settings file's reading or the citation key.
- `src/lib/data/helpers/keys/oculus-keys.ts:10-11`, the menu's accelerators on macOS: still true.

## What in the brief was wrong or impossible

- `INITIALS` is at `literature-key.ts:30` on the base, not `:34` (`grep -n "INITIALS =" .../O42-base/.../literature-key.ts` prints `30:const INITIALS = /^[A-Z]{1,3}$/;`).
- The brief puts the Terminal items' functions under `src/lib/state/sessions/terminal/`, "moved there from the view if the view holds them". The view holds none: the start and the split are the terminals store's (`startInTab`, `splitTerminal` in `src/lib/state/sessions/terminals.svelte.ts`), and the shell's boundary row (`tests/checks/tree/boundaries.test.ts`, the `shell:` list) allows `state/sessions/terminals` and no module under `state/sessions/terminal/`. The two new functions are on the store, with the moved rules in `state/sessions/terminal/terminal-lists.ts` (judgment call 11).
- `save-key.client.test.ts` cannot run in the base copy (vite refuses the linked `node_modules`); its first run is the worktree's run before `Source.svelte` changed.

## Runs of the verify list

One run of `npm run diagrams && npm run test:quick`. No whole-suite command was run. While working, besides the covering test files, `npx svelte-check --tsconfig ./tsconfig.json --threshold error` was run twice and `npx eslint` over the changed files twice, and the guarded tests were run once as one `npx vitest run` of their 61 files.
