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

## Repair round 1

Not done: nothing of the seventeen items is left undone. Two facts the reader needs first: `npm run test:quick -- --base 3587a477a` passes every command but prints `test:quick: 56.9 s (limit 45.0 s); every command passed` and `test:quick: over the time limit`; and the lines over 100 columns the round adds are all in Markdown paragraphs, one catalog line of YAML and the generated `.dot` files, none in code or tests (item 6).

Correction to the first report: its line "Settings and Help open into its float" under "Host- and user-visible changes" was wrong. The host sends Settings and Help to the main window focused last (`MAIN_ONLY` in `src/desktop/windows/menu-template.ts`), so they never reach a popped-out window, and they keep going to the last main window as they did on the base tree. The row that asserted the float (`'opens Settings and Help into its float'`) is removed, and `menuPage` opens a view with no float id.

### Items

| Item | State | Shown by |
|---|---|---|
| 1 S1 | DONE | `grep -n "SHEET_CHARACTER" src/lib/shell/keys/workbench-keys.svelte.ts` prints `32:import { SHEET_CHARACTER } ...` and `152:            event.key === SHEET_CHARACTER` |
| 2 S2 | DONE | `openWorkspace(path)` in `colonEffects` (`src/lib/shell/commands/colon-effects.ts`) is the one place with `{ said: true }`; `WorkspaceRows.svelte` calls `effects.openWorkspace(choice.path)` and `menu-answer.ts` calls `settled(effects.openWorkspace(path))`; the row 'switches to the file Open Recent sends, as a pick of `:workspace` does' passes |
| 3 S3 | DONE | `appKey` is a third answer of `sourceKeys` (`src/lib/shell/window/source-keys.ts`) and reads the tab `active()` gives and its status; `Workbench.svelte` spreads `sourceKeys(client, pageTab)` and holds no `appKey` of its own. Row in `tests/state/system/apps/shell.test.ts` (G77, every row): red on the unchanged tree, green now (below) |
| 4 P1 | DONE | 22 rows in `tests/shell/window/menu-answer.test.ts`, describe 'the colon commands a menu command runs', over the real `menuPage` and the real `commands(...)`; all pass (below) |
| 5 S4 | DONE | the title is 'holds the menus and the items of each menu in their order'; `grep -n "Part 1" tests/server/desktop/menu-template.test.ts` prints nothing |
| 6 S5 | DONE | every added line of code and tests is at most 100 columns (check below); `resolve.ts` 257-261 is one paragraph |
| 7 S6 | DONE | server rows moved to `tests/server/files/workspace/folder-settings.test.ts` and `tests/server/root/watch/settings-watch.test.ts`; folders split; G109, G59, G8, G31 and G73 Test lines updated |
| 8 S7 | DONE | the sentence is in both comments; `wc -l src/lib/state/sessions/terminals.svelte.ts` prints 879 |
| 9 S8 | DONE | `src/lib/data/model/machine/terminal-kinds.ts` holds `TERMINAL_PROFILES`, `TerminalProfile` and `profileWords` |
| 10 S9 | DONE | DESIGN.md, three sentences (below) |
| 11 S10 | DONE | HELP.md: the one bullet is eleven bullets |
| 12 S11 | DONE | the grep and its five hits, judged below |
| 13 B1 | DONE | row removed; correction above |
| 14 B2 | DONE | `.branch { text-transform: none; }` in `Repo.svelte`; no other `TreeItem` has `heading` and `detail` |
| 15 B3 | DONE | catalog line changed; the row "name each reason a folder's settings text is null" reads the sentence |
| 16 B4 | DONE | stated below |
| 17 B7 | DONE | `reader()` returns a `Focused<Entry>`; `commandWindow(name, focused, lastMain)`; three rows in `tests/server/desktop/menu-template.test.ts`, red on the unchanged tree, green now (below) |

What each item came to:

- **2 (S2).** `ColonEffects.openWorkspace: (path: string) => Promise<CommandOutcome>` runs `workspaceCommand((value) => client.fs.selectWorkspace(value, { said: true }), path)`. The palette's `:workspace` rows take `colonEffects(state)` from `useState()`. The head comment of `colon-effects.ts` names the switch and the workspace rows.
- **3 (S3).** The tab passed to `appShell.press` is `pageTab()`, the float's active tab in a popped-out window, with `client.editorStatus.statusOf(tab.id)`. `MenuDeps.tab` and `sourceKeys`' tab now carry `state` (the place needs the tab's view state), and `save-key.client.test.ts` hands its tab a `state: {}`. G77's Code line names `appKey` of `sourceKeys`.
- **4 (P1).** One row for each of the 17 menu commands that `RUNS` sends through `colon` (a row asserts the list equals the `colon` rows of `ROWS`), each over stub stores that record every effect: `open-folder` calls `explorer.openFolder` once, `add-folder` `explorer.addFolders`, `close-workspace` `fs.closeWorkspace({ said: true })`, `crt` `ui.setCrt(true)`, the three dock toggles `layout.toggleDock(edge)`, `update-tasks` `openUpdate`; `switch-workspace`, `new-workspace`, `save-workspace-as`, `clone-repository`, `open-view`, `theme`, `file-icon-theme` and `go-to-project` open the palette typed `:<name> `; `accent` posts the notice 'Unavailable'. Three more rows: Open Folder... and Add Folder to Workspace... with the panel open post 'The folder panel is already open.', and a dock toggle with no float docked at its edge posts 'No float is docked at this edge'. Each row expects exactly one recorded call, which only `menuPage`'s `colon` makes, so each would fail without the colon behaviour. A successful effect posts no notice (the rows wait two microtasks and expect only the one call). One row runs Open Recent through `effects.openWorkspace`. The file installs the real catalog (`installRealText`), so the notices are the shipped words.
- **6 (S5).** The added lines over 100 columns in code and tests were rewrapped: the doc comments at `desktop-keys.ts`, `fs.ts`, `menu-template.ts` and `menu-commands.ts` became block comments, the head comments of `source-options.ts` and `menu-template.test.ts` were rewrapped as whole paragraphs, and every test title over the limit was shortened (one moved its last clause into a comment over the row, "A root that is no folder's path, nor its repository's, gets the records of no folder."). The lines still over 100 are Markdown paragraphs (DESIGN.md, HELP.md, one line per paragraph or bullet by the hub's writing rules), the catalog line of item 15 (catalog strings are one line each, 237 lines of `config/text/*.yml` are over 100) and the generated `.dot` files.
- **7 (S6).** `tests/server/files` and `tests/server/root` held ten items each. `tests/server/files/workspaces.test.ts` moved to `tests/server/files/workspace/workspaces.test.ts` (the workspace answer and its writes, beside `src/lib/server/files/workspace/`), with the new `folder-settings.test.ts` there (the `workspacesAnswer` row). `tests/server/root/first-run.test.ts` moved to `tests/server/root/process/first-run.test.ts` (it tests `src/lib/server/root/process/start/first-run.ts`), and `tests/server/root/watch/settings-watch.test.ts` holds the `watchGit` row. The moved files' imports go one folder deeper. `tests/state/sources/folder-settings.test.ts` keeps the client-state row: the page reads `settings` from an answer that carries text, null, nothing and a number. Coverage change: the round-1 row read the server's own answer through `pageWorkspaces` in one row; now the server row asserts the server's answer and the client row asserts the page's read of a literal answer, so no single row runs server answer to page read end to end. Guarded lines updated: G109's Test line names the two new server files beside the two client files; G59 gains a Test line naming the two rows of `settings-readers.test.ts` that read the save rules over the folder's settings text and `tests/state/sources/folder-settings.test.ts`; G8 and G31 name `tests/server/files/workspace/workspaces.test.ts`, G73 names `tests/server/root/process/first-run.test.ts`. `grep -rn "files/workspaces\.test\|root/first-run\.test" src tests docs config utils *.md` prints nothing.
- **8 (S7).** `showTerminal`'s comment holds the whole rule again, "An id that is not a terminal's shows nothing." included, and `showIn`'s comment ends with the sentence; `showIn` now returns at once for an id that is not a terminal's, so its comment is true of it alone (its one caller, `showTerminal`, refused such an id already). The room comes from moving the rule of `terminalOfSession` (which terminal a session runs in) into `sessionTerminal` of `terminal-lists.ts`, whose concern is the rules over the terminal list; the store calls it. No comment was shortened.
- **9 (S8).** The kinds live beside `StartKind` in the model layer (`TERMINAL_PROFILES ... as const satisfies readonly StartKind[]`), re-exported by `src/lib/data/model/index.ts` and, for a view and the shell, by `src/lib/state/sessions/terminals.svelte.ts`, as the other terminal types are. `menu-commands.ts` (`profileCommand`, `MENU_COMMANDS`) and `menu-template.ts` import the module directly; `terminal-list.ts`, `Composer.svelte` and `menu-answer.ts` import from `$lib/state/sessions/terminals.svelte`. A module under `data/helpers/` is not open to the shell and view rows of `tests/checks/tree/boundaries.test.ts`, and the table was not widened.
- **10 (S9).** DESIGN.md: at the sentence on `real` in the Problems paragraph (line 616 of the base numbering), the `settings` field (text, or null for a missing file, no text, a file longer than the file route reads, a link out of the folder), its readers through `settingsOf` with no request, and the git watch reading the workspaces again; at the hub folders' `hub: true` and `folds: true` (line 750), that each folder carries `settings` too; in the Windows paragraph, the menu's routing as item 17 makes it, and that the page answers through `menu-answer.ts`.
- **11 (S10).** HELP.md "The window": the menu bar's menus; an item runs what its key or palette command runs, in your window, and shows the key; on macOS a key without Cmd or Ctrl shows on no item; Settings... and oculus Help open in the main window you used last; an item ending in "..." opens the palette typed with its command; Settings... opens Settings and the two folder items open the folder panel; Open Recent; Open in Browser; a command that cannot run says why in a notice; no item runs under the palette, the tray, a confirm or the key sheet; no item runs while an audience window or an undocked DevTools window has the focus.
- **14 (B2).** The branch words are drawn by Repo.svelte's own snippet, so a scoped `.branch { text-transform: none; }` there keeps their case under `TreeItem.svelte`'s `.heading .main { text-transform: uppercase; }`; the name stays in capitals. `ui/tree/TreeItem.svelte` is not changed (it is at 530 lines). Every `<TreeItem ... heading ...>` in `src/lib`, read by a parse of each tag: `ui/tree/TreeSection.svelte:60`, `views/sources/files/sections/Notes.svelte:62` and `views/sources/files/header/WorkspaceHeader.svelte:100` carry no `detail`, and `views/sources/search/Results.svelte:175` carries none and no `heading` prop (its label is `heading(file)`). Repo.svelte's header is the one heading row with a detail, so no other file is listed.
- **15 (B3).** `settings_origin_none: '{0} has no {1}, or one that does not read as text or is longer than the file window reads'`. No test read the sentence; `tests/state/sources/settings-readers.test.ts` gains "name each reason a folder's settings text is null", which reads the `none` line of `repoOrigins` for the folder `plain` as `plain has no .oculus/settings.yml, or one that does not read as text or is longer than the file window reads`. `settingsOf`'s comment in `place.ts` names the same reasons.
- **17 (B7).** `export type Focused<W> = { kind: 'entry'; entry: W } | { kind: 'none' } | { kind: 'other' }` in `menu-template.ts`; `windows.reader()` answers `none` with no focused window, `entry` for one of the entries, else `other` (an audience window, an undocked DevTools window); `commandWindow` sends nothing for `other`, the last main window for `none` and for Settings and Help, else the entry. `app.ts` passes `windows.reader()` straight in; Open in Browser takes the entry only for `entry` and keeps the last main window otherwise. G108's sentence and Code line say the same.

### First runs on the unchanged tree

Vitest's marks are written by name: `[file]` for a file's line, `[failed]` and `[passed]` for a row's.

Item 3, on the base copy (main at 3587a477a), the new `shell.test.ts` copied in and the base file put back after (`cmp` printed `restored`):

```
 [file] |unit| tests/state/system/apps/shell.test.ts (26 tests | 1 failed) 12ms
     [failed] reads the float's tab for the binding's `when` while the main area shows another file 2ms
TypeError: keys(...).appKey is not a function
      Tests  1 failed | 25 passed (26)
```

Items 3 and 17 on the tree the first round left, which the coordinator's snapshot `.agents/worktrees/migration-O42-round-1` holds: the base copy with the snapshot's 67 files laid over it and the two new test files copied in, run, then every base file put back and the files the overlay added removed (the md5 manifests of the base copy before and after compare equal, `base restored, manifests equal`):

```
 [file] |unit| tests/server/desktop/menu-template.test.ts (12 tests | 3 failed) 12ms
     [failed] sends a command to the entry the reader is in, Settings and Help to the main window 3ms
     [failed] sends a command to the main window focused last while no window is focused 1ms
     [failed] sends no command while a window that is none of the entries is focused 0ms
 [file] |unit| tests/state/system/apps/shell.test.ts (26 tests | 1 failed) 12ms
     [failed] reads the float's tab for the binding's `when` while the main area shows another file 2ms
AssertionError: expected { kind: 'other' } to be null
      Tests  4 failed | 34 passed (38)
```

The first two `commandWindow` rows fail there on the new argument shape; the third fails on the behaviour item 17 changes: the old `commandWindow` with `audience` false sends a command on. Two titles were shortened afterwards for item 6 (the shell row's is now "reads the float's tab for a `when` while the main area shows another file" and the first `commandWindow` row's "sends a command to the reader's entry, Settings and Help to the main window"); the bodies are those of the first runs, less one `as never` eslint called unnecessary.

The same rows on the worktree now:

```
 [passed] ... menu-template.test.ts > where a command and Open in Browser go > sends a command to the reader's entry, Settings and Help to the main window
 [passed] ... menu-template.test.ts > where a command and Open in Browser go > sends a command to the main window focused last while no window is focused
 [passed] ... menu-template.test.ts > where a command and Open in Browser go > sends no command while a window that is none of the entries is focused
 [passed] ... shell.test.ts > a key of an app pressed in a popped-out window > reads the float's tab for a `when` while the main area shows another file
 [passed] ... menu-answer.test.ts > the colon commands a menu command runs > runs the colon command of accent once
 (and the other rows of that describe, all passed)
 Test Files  9 passed (9)
      Tests  203 passed (203)
```

That run is `npx vitest run tests/state/system/apps/shell.test.ts tests/server/desktop/menu-template.test.ts tests/shell/window/menu-answer.test.ts tests/state/sources/settings-readers.test.ts tests/state/sources/folder-settings.test.ts tests/server/files/workspace tests/server/root/watch tests/server/root/process/first-run.test.ts --reporter verbose`.

### History-word check (item 12)

Every added line of the code and test files the step changed (2791 lines, the base copy's file against the worktree's, a new file whole), grepped with `grep -i -E "\bbefore\b|used to|no longer|\bstill\b|always has been|always had|as before|previously|the step adds|after this package lands"`. The grep runs over all added lines, so every comment line and test title is inside it. Five hits:

- `literature-key.ts`: "its surname before them" names where the particles stand in a name. Word order, no history.
- `literature-key.ts`: "The key of a paper before a suffix" names the part of the key ahead of the suffix. Position, no history.
- `Repo.svelte`: "it is drawn still" means motionless under reduce-motion. No history.
- `Repo.svelte`: "since the branch was read before whatever failed" is the order of two reads in one run. No history.
- `settings-watch.test.ts`: "which the watch may still hear, come before the probe's" is the order of events in the case. No history.

### Verification

From `tools/oculus` in the worktree, with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`:

- `npm run diagrams && npm run test:quick -- --base 3587a477a`, exit 0:
  ```
  test:quick: 85 changed file(s), from git since 3587a477a
  test:quick: 212 test file(s), 9 essential
  ok      ASCII gate (0.6 s)
  ok      prettier (1.1 s): All matched files use Prettier code style!
  ok      svelte-kit sync (2.2 s)
  ok      svelte-check (7.0 s): 1792347804793 COMPLETED 515 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      eslint (7.4 s)
  ok      vitest (54.5 s): Duration  48.10s ...
  test:quick: 56.9 s (limit 45.0 s); every command passed
  test:quick: over the time limit
  test:quick: not covered: tests outside the selection, tests/checks, slow tests,
              build, lint of unchanged files; npm run test:landing runs them
  ```
- The guarded tests of G8, G59, G69, G77, G107, G108, G109 and G110, every file their Test lines name (62, read from `guarded.md`), with the moved `tests/server/files/workspace/workspaces.test.ts` and `tests/server/root/process/first-run.test.ts`, as one `npx vitest run`: `Test Files  63 passed (63)`, `Tests  808 passed (808)`.
- `npx vitest run tests/checks/tree/boundaries.test.ts tests/checks/tree/size.test.ts tests/checks/source/keys.test.ts tests/checks/tree/duplication.test.ts --testTimeout 0 --hookTimeout 0`: `Test Files  4 passed (4)`, `Tests  48 passed (48)`.
- `sh utils/unused-exports.sh` against `O42-base/unused-exports.txt`: `diff ... | grep -c '^>'` prints `0`.
- `LC_ALL=C grep -n '[^ -~]'` over the 74 changed files but the `.svg`, `guarded.md` and this report included: no line, exit 1.
- `sh utils/folder-check.sh`: exit 0, no line.
- Added lines over 100 columns in code and tests: none (item 6).

### Paths changed in the round

Against the tree the first round left (the snapshot's file where it has one, else the base copy's):

- Changed: `.scratch/migration/agents/guarded.md`, `.scratch/migration/agents/reviews/O42-report.md`, `DESIGN.md`, `HELP.md`, `config/text/views/system/workbench.yml`, `docs/diagrams/layer-data.dot`, `docs/diagrams/layer-shell.dot`, `docs/diagrams/layer-shell.svg`, `docs/diagrams/layer-state.dot`, `docs/diagrams/layer-state.svg`, `docs/diagrams/layer-views.dot`, `docs/diagrams/layer-views.svg`, `docs/diagrams/layers.dot`, `docs/diagrams/layers.svg`, `src/desktop/app.ts`, `src/desktop/windows/menu-template.ts`, `src/desktop/windows/windows.ts`, `src/lib/data/helpers/keys/oculus/desktop-keys.ts`, `src/lib/data/helpers/keys/oculus/menu-commands.ts`, `src/lib/data/helpers/keys/oculus/resolve.ts`, `src/lib/data/model/index.ts`, `src/lib/server/files/fs.ts`, `src/lib/shell/Workbench.svelte`, `src/lib/shell/commands/colon-effects.ts`, `src/lib/shell/keys/rows/WorkspaceRows.svelte`, `src/lib/shell/keys/workbench-keys.svelte.ts`, `src/lib/shell/window/menu-answer.ts`, `src/lib/shell/window/source-keys.ts`, `src/lib/state/sessions/terminal/terminal-lists.ts`, `src/lib/state/sessions/terminals.svelte.ts`, `src/lib/state/sources/explorer/view/place.ts`, `src/lib/views/sessions/terminal/start/Composer.svelte`, `src/lib/views/sessions/terminal/terminal-list.ts`, `src/lib/views/shared/prose/editor/source-options.ts`, `src/lib/views/sources/repositories/repo/Repo.svelte`, `tests/server/desktop/menu-template.test.ts`, `tests/shell/window/menu-answer.test.ts`, `tests/state/sources/folder-settings.test.ts`, `tests/state/sources/settings-readers.test.ts`, `tests/state/system/apps/shell.test.ts`, `tests/views/sources/source/save-key.client.test.ts`.
- New: `src/lib/data/model/machine/terminal-kinds.ts`, `tests/server/files/workspace/folder-settings.test.ts`, `tests/server/root/watch/settings-watch.test.ts`.
- Moved with `mv`: `tests/server/files/workspaces.test.ts` to `tests/server/files/workspace/workspaces.test.ts`, `tests/server/root/first-run.test.ts` to `tests/server/root/process/first-run.test.ts` (imports one folder deeper, nothing else).

### Before and after, for the look

- **An app keybinding in a popped-out window.** Before: its `when` read the main area's tab, so a binding with `when: resourceExtname == .md` did not fire in a float showing a `.md` file while the main area showed a `.py` file, and fired in a float over any file while the main area showed a `.md` file. After: it reads the float's tab and its editor status.
- **The debug keys in a popped-out window (item 16, a change of the first round).** `breakpointFileOnScreen` reads the float's tab (`sourceKeys(client, pageTab)`; the base tree passed `activeInstance`). After: F5, F9, F10 and F11 pressed in the float's editor are taken when the debugger takes the float's file. Before: the main area's file decided, so a float over a file the debugger takes left them to the editor when the main area's file was one it does not take, and the other way round.
- **A menu command with an undocked DevTools window focused.** Before: it went to the main window focused last. After: it goes to no window, as with a presentation's audience window. With no window focused it goes to the last main window, as on the round-1 tree; Settings and Help go to the last main window from any entry. Open in Browser is unchanged.
- **The repository header.** Before: the branch name, the short hash of a detached HEAD and the word "detached" were drawn in capitals with the repository's name. After: they are drawn as git and the catalog write them; the name stays in capitals.
- **The Settings `editor.languages` line for a folder with no settings text.** Before: "<folder> has no .oculus/settings.yml, or one that does not read as text". After: "<folder> has no .oculus/settings.yml, or one that does not read as text or is longer than the file window reads".
- **HELP.md "The window".** The one long bullet is eleven short ones, and two facts are added: Settings... and oculus Help open in the main window you used last, and no menu item runs while an audience window or an undocked DevTools window has the focus.
- **No visible change:** `?` closes the key sheet through `SHEET_CHARACTER` (`'?'`); `:workspace` and Open Recent switch through the one effect; the terminal kinds' new module, `sessionTerminal` and `showIn`'s own check change no behaviour.
