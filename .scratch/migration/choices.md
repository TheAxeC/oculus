# Choices made in automode

Each entry is an open item the orchestrator closed itself with the option it judged Axel would take, booked everywhere a ruling is booked (the state file's closed log, `plan.md`'s Rulings, the step's brief). Axel reads this list when he likes: an entry he agrees with is removed; one he disagrees with is discussed, and when it changed what was built it becomes a new step that changes it on top. Newest first.



## Z816 (2026-10-11, step D67, the orchestrator, automode): how a bookmark of a root's top is stored

- The writer writes no line for an empty field, so a bookmark added with `path: ''` is stored with no `path` line. Options: (a) an entry with a `root` and no `path` names that root's top, the readers taking a missing path as the empty text, the writer unchanged; (b) `path: ""` written explicitly, which changes the renderer every collection write uses; the lazy option is to leave the root's star unwritable. Taken: (a).

Where it applies: D67. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z815 (2026-10-11, step D63, the orchestrator, automode): the machine's state placed outside `~/.oculus`

- `local.yml` may place the machine's state files and folders outside `~/.oculus` (`sessions_cache`, `sessions_overrides`, `workspaces`, `bookmarks`, `notes`, `changes`, `history`, `approvals`, `schedules`, `schedule_record`, `accounts`, `calendar_dir`, `apps_dir`, `mail_dir`), and `privateFolders` names only `~/.oculus` and each hub's `secrets`. Options: (a) every path those keys name is closed to apps as the private folders are, the set one function of the server's apps folder, `privateFolders` unchanged; (b) `privateFolders` itself widened, which changes what the library rules and the language servers withhold, outside this step; the lazy option is to state the limit and close only `~/.oculus`. Taken: (a).

Where it applies: D63. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z814 (2026-10-11, step D63, the orchestrator, automode): the saved names of app themes, and a theme that is gone

- A view id starts with `app:` and may hold a `/` (a root key may), so `app:<view id>/<label>` has no single reading. Options: (a) the saved name `<view id>/<label>` and `file_icons: <view id>/<id>`, the label and the id percent-encoded and read by splitting at the last `/`; a colour theme that is gone (its app unapproved, disabled, removed or changed, or its root key not served by this workspace) falls back to the default with a notice on that page, since the colour theme is chosen per browser and the server does not know it; `file_icons`, a key of the configuration, falls back to Seti with a finding keyed `config/appearance.yml`; a page that loads before the `apps` payload draws the default and says nothing until the payload arrives; the find page and the presenter's pages draw an app theme as the workbench does; (b) a server finding for the colour theme, which the server cannot know; (c) the default drawn silently, the reader left to guess why the theme changed; the lazy option is (c). Taken: (a).

Where it applies: D63. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z813 (2026-10-11, step D63, the orchestrator, automode): the reader's words for file icons and keybindings

- "Icons" already names the Settings row of a terminal theme's icons and the Icons view, and the key sheet and HELP.md call a keybinding a key. Options: (a) VS Code's name File Icon Theme for the choice, with the colon command `:file-icons` and the Settings row File Icon Theme, and "key" for a keybinding wherever the reader reads it (the approval panel, HELP.md, the key sheet), the manifest point keeping VS Code's name `keybindings`; (b) `:icons` and "keybindings", one word for two things and two words for one; the lazy option is (b). Taken: (a).

Where it applies: D63. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z812 (2026-10-11, step D63, the orchestrator, automode): where app settings are written and read

- Z800 writes app settings to the hub layer's `behavior.yml` under `app_settings:`, but `HUB_LIST` lets that layer set only `slurm.resource` and `data_domains`, the config-key writer writes only catalog keys and splits a key at its dots, and the editor's schema refuses an undeclared top-level key. Options: (a) a write kind `app-setting` `{ key, value }` that writes `app_settings` with each setting's whole key as one map key, creating the file when the hub has none, closed to apps; `HUB_LIST` gains `app_settings`; the schema gains it as a map of scalars and lists of strings; the apps watcher judges each value against its declaration, a value outside its type, `enum` or bounds or a key no approved app declares being a finding keyed `config/behavior.yml`; (b) app settings as options-catalog entries generated per app, which writes the shipped catalog from a reader's apps; (c) app settings in a file of their own, which Z800 did not choose; the lazy option is to leave item 12 as written, unbuildable. Taken: (a).

Where it applies: D63. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z811 (2026-10-11, step D63, the orchestrator, automode): `getConfiguration` synchronous

- VS Code's `getConfiguration(section).get(key)` answers at once. Options: (a) the host holds its app's resolved values, sent when it starts and with each change, so `get` answers at once as in VS Code, and a frame's `oculus.settings.get(key)` is a promise like every frame method; (b) `get` a promise over `oculus/settings/get`, which breaks every ported extension that reads a setting synchronously; the lazy option is (b). Taken: (a).

Where it applies: D63. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z810 (2026-10-11, step D63, the orchestrator, automode): the reach of a custom editor

- Item 11 read a custom editor's file under the checks of `fs.readFile`, which a machine app passes only for folders its `files:` names, while Z803's entry said the scope of `open({ file })`. Options: (a) the file the reader opened, under the checks `open({ file })` applies (closed paths and the private folders answer `closed`), for a machine app whatever its `files:`, a root app in its own root; the save writes bytes, text or binary, through a bytes write beside the source save with its `changed` hash, its local-history copy and its refusals; a save while a source tab of the file holds unsaved text is refused `refused:unsaved`; Disable, Remove and Revoke ask through Confirm while a custom editor of the app is dirty, and an approval ended by a change of the app's files posts a notice naming each file whose unsaved changes were lost; (b) the `fs.readFile` checks, so a machine app's editor opens nothing outside its `files:` though the reader chose the file; (c) text files alone through the source save, which leaves a binary editor (an image or a hex editor) unable to save; the lazy option is (c). Taken: (a).

Where it applies: D63. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z809 (2026-10-11, step D63, the orchestrator, automode): what goes when a host stops, and where a host's page work lands

- Options: (a) when an app becomes unapproved, disabled, removed or changed, or its host stops, its host's open requests are withdrawn on every page (the host's promise settling `undefined`), its handlers, status items, tree views (drawing the line that the program stopped) and panels go, and its context keys go; a host's panel and a host's run of a command only a frame registered are taken by the page that has the focus, as Z808's commands are; a host's panel is not restored with a page's layout and closes, `onDidDispose` firing, when its page reloads or closes; (b) panels kept open after their host stops, drawing an entry no program answers; (c) a host's panel opened on every page, which draws one panel many times; the lazy option is to leave these states unstated for the builder. Taken: (a).

Where it applies: D63. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z808 (2026-10-11, step D63, the orchestrator, automode): oculus's own commands run by an app

- Z791 lets an app run oculus's palette colon commands as `oculus.<name>`, and the theme is per browser, so a host's call has no page of its own. Options: (a) an app runs only the colon commands that change what a page shows (`theme`, `file-icons`, `crt`, `tab`, `goto`); the others answer `closed`, since they write configuration (`language`, `interpreter`, `compile-database`, `eslint-config`), start agents (`update`), write the workspaces file (`workspace`, `workspace-save`) or open the system's folder panel (`folder`), which no approval names; a host's call is a request of `app-shell` taken by the page that has the focus, else by the first page that gains it; a frame's call runs on its own page; (b) every colon command, which lets an app start agents and write configuration unasked; (c) no colon command from an app, which drops what Z791 gave for no gain; the lazy option is (b) as Z791 reads, leaving the page unnamed. Taken: (a); Z791 is amended to it.

Where it applies: D63. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z807 (2026-10-11, step D63, the orchestrator, automode): two apps of one name

- Two apps may share a `name` (a machine app and a root app, or root apps of two roots), so the id prefix alone does not keep their ids apart. Options: (a) an id an app earlier in the Views catalogue's order already declares refuses the later app with a finding naming both, and two apps of one name that declare no common id are both offered; (b) every app of a repeated name refused, which refuses apps that never collide; (c) ids prefixed with the view id, which breaks VS Code's id shape for every ported manifest; the lazy option is to leave the collision unhandled, the later registration silently winning. Taken: (a).

Where it applies: D63. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z806 (2026-10-11, step D67 and D63, the orchestrator, automode): the bookmark of `~/.oculus`

- Options: (a) a root `oculus-state` over `~/.oculus` in Axel's workspace beside `claude`, a bookmark that names a root's top (an empty path), and the private folders closed to every app (a `files:` entry under one refuses the app, an `oculus.fs` read under one answers `closed`), built in D63; (b) a root over the home folder with a bookmark of `.oculus`, which serves the whole home folder; (c) the root alone, the lazy option. Taken: (a).

Where it applies: D63 (the private folders closed to apps) and D67 (the bookmark). Booked in `plan.md` Rulings and the closed log of `orchestrator-history.md`.

## Z805 (2026-10-11, step D63, the orchestrator, automode): how a host's contributions and requests reach the page and come back

- Options: (a) a new channel `app-shell`, closed to every app like `app-hosts` and `app-messages` (`CLOSED_CHANNELS` in `data/helpers/files/apps.ts`, a manifest that lists it refused with `findings.apps.carries.app_shell`), carrying for each app with a running host what it registered (command handlers, status items, tree views with a change count per element handle, panels, context keys set by `setContext`) and the open requests of `oculus/ui` (quick pick, input box, message, progress), each with an id; the page asks and answers through `POST /api/app-host` with new actions under the write token: `run` (a command, with its arguments), `provide` (a tree's children or item, a `validateInput`), `answer` (a request's result or its cancel) and `settings`; a request shows on every page the server serves and the first answer settles it, the others withdrawing it; what a manifest declares stays on the `apps` channel's `AppRow`, which gains `contributes`; (b) the registrations inside the `app-hosts` rows, which mixes a stream of requests into a per-host state row read by the Processes view, as Z787 already declined for messages; (c) the page polling the host, the lazy option. Taken: (a).

Where it applies: D63. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z804 (2026-10-11, step D63, the orchestrator, automode): the library that reads a `when` clause

- Options: (a) `ContextKeyExpr` of monaco-editor 0.57.0 (MIT, Microsoft, released 2026-09-24, already pinned in `package.json` and the editor oculus draws), imported as `monaco-editor/platform/contextkey/common/contextkey` through the package's `./*` export: VS Code's own parser and evaluator, so a clause means in oculus what it means in VS Code; `ContextKeyExpr.deserialize` answers `undefined` for a clause that does not parse, which the manifest reader turns into the refusal, and `evaluate` reads a context of oculus's keys; it runs in Node and in the page (probed: `editorLangId == python && !editorReadonly || view =~ /^ghost./` evaluates true over `{ editorLangId: 'python' }`, and `a && (` deserializes to `undefined`); the import names an internal path of the package, held by the exact pin; key strings (`ctrl+shift+p`, two-part chords) are read by hand with the key names of the same package's `KeyCodeUtils`; (b) `@codingame/monaco-vscode-api` 37.3.11 (MIT, CodinGame), which brings VS Code's whole service graph (49 MB unpacked, seven service-override packages) and replaces oculus's shell rather than a parser; (c) a hand-written parser, the lazy option measured against (a): more code for a grammar the editor already ships. Taken: (a).

Where it applies: D63. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z802 (2026-10-11, step D63, the orchestrator, automode): colour and icon themes

- Options: (a) `themes` entries `{ label, uiTheme: vs | vs-dark | hc-black | hc-light, path }` naming a VS Code colour theme file of the app (its `include` chain inside the app), converted when the app is read by the converter's mapping moved from `utils/migrations/convert-vscode-themes.ts` into `src/lib/themes/` (the script then imports it), offered in the theme picker and `:theme` as `<label> (<app title>)` under the name `app:<view id>/<label>`, its `tokenColors` giving the code colours as the 19 VS Code themes do; `iconThemes` entries `{ id, label, path }` naming a VS Code file icon theme file (`iconDefinitions` with `iconPath` or `fontCharacter` and its `fonts`, `file`, `folder`, `folderExpanded`, `fileExtensions`, `fileNames`, `folderNames`, `languageIds`, `light`), chosen by a new `appearance.yml` key `file_icons: seti`, a choice in the Settings view and `:icons` in Cmd-K, drawn in every place a file icon is drawn, the icon files served from the app's address; a theme or icon theme of an app that becomes unapproved or disabled falls back to the default with a finding; (b) colour themes alone, the lazy option. Taken: (a).

Where it applies: D63. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z801 (2026-10-11, step D63, the orchestrator, automode): messages, quick pick, input box and progress

- Options: (a) VS Code's `showInformationMessage`, `showWarningMessage` and `showErrorMessage(message, options, ...items)` as a notification of that tone with the items as its actions, resolving with the item pressed or undefined when the notification is cleared, `modal: true` as oculus's Confirm; `showQuickPick(items, { title, placeHolder, canPickMany, matchOnDescription, matchOnDetail })` and `showInputBox({ title, prompt, value, placeHolder, password, validateInput })` as oculus's quick input over the page (the palette's rows and field), one at a time, a second one cancelling the first as in VS Code, `validateInput` of a host asked through `oculus/provide` kind `validateInput` 150 ms after each change, a frame's input box taking no function; `withProgress({ location: Notification | Window, title, cancellable }, task)` as a notification with a progress bar, its message and Cancel, or a spinner and title in the status bar's left group, Cancel reaching the task's token; each counted under `apps.messages_per_min`; host `oculus.window.*`, frame `oculus.ui.quickPick`, `ui.inputBox`, `ui.message` and `ui.progress` as DESIGN.md names them; (b) messages only, the lazy option. Taken: (a).

Where it applies: D63. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z800 (2026-10-11, step D63, the orchestrator, automode): settings an app declares

- Options: (a) `configuration` `{ title, properties: { '<app>.<key>': { type, default, description or markdownDescription, enum, enumDescriptions, minimum, maximum, items } } }` with `type` boolean, number, integer, string or array of strings; each is a row of the Settings view under the heading `apps`, its section the configuration's title, its control from its type (toggle, number, text, choice, list); a value is written to the hub layer's `behavior.yml` under `app_settings:` keyed by the setting's key, and a value outside its type or bounds is a finding while the reader uses the default; the host reads `oculus.workspace.getConfiguration(section).get(key)` (`oculus/settings/get`) and hears `onDidChangeConfiguration` (`oculus/event` kind `settings`), a frame `oculus.settings.get(key)` and `onSettings(keys)`; an app reads its own keys alone; (b) a machine file `~/.oculus/app-settings.json`, which the Settings view's layers do not hold; (c) the app's store, the lazy option, which the Settings view cannot show. Taken: (a).

Where it applies: D63. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z799 (2026-10-11, step D63, the orchestrator, automode): custom editors

- Options: (a) `customEditors` entries `{ viewType, displayName, selector: [{ filenamePattern }], priority: default | option, entry }`; a file whose name matches a `default` editor opens in it from every opener (`tabForKind` and its six callers), a file of an apps folder staying source text; `option` adds Open With... to a Files row's menu and Reopen Editor With... to a tab's menu, each listing Text Editor and every editor that matches, in VS Code's words; the editor's frame gets `document.read()` (the file's bytes, under the checks of `fs.readFile` for the file it opened, a root app only in its own root), `document.save(bytes)` (writes that file and no other through the file save the source editor uses, refused for a closed path or a file outside a root), `document.dirty(flag)` (the tab's unsaved mark, so closing asks), and the handlers `onSave()` for Cmd+S and `onRevert()` for Revert File; (b) read-only custom editors, which leaves an editor unable to edit; (c) Open With only, no default, the lazy option. Taken: (a).

Where it applies: D63. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z798 (2026-10-11, step D63, the orchestrator, automode): webview views and panels

- Options: (a) a view of `type: webview` is drawn as a frame of the app's file its `entry` names (an `.html` file of the app), with the bridge, its own tab state and the handler `onVisibility(visible)`; a panel is `oculus.window.createWebviewPanel(viewType, title, { entry, preserveFocus })` from the host or `oculus.createPanel(...)` from a frame, a tab of the app drawing that entry, with `title`, `reveal()`, `dispose()` and `onDidDispose`; the host reaches it through `sendToPage` with the panel's tab id; (b) VS Code's `webview.html` string set by the host, which needs inline scripts the app policy refuses and draws HTML the reader never approved; (c) no panels, the lazy option. Taken: (a).

Where it applies: D63. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z797 (2026-10-11, step D63, the orchestrator, automode): tree views

- Options: (a) a view of `type: tree` gets its rows from the host: `oculus.window.registerTreeDataProvider(viewId, provider)` or `createTreeView(viewId, { treeDataProvider, showCollapseAll, canSelectMany })`, the provider's `getChildren(element)` and `getTreeItem(element)` answering VS Code's TreeItem (`label`, `description`, `tooltip`, `iconPath` as `$(glyph)` or a file of the app, `collapsibleState`, `command`, `contextValue`, `id`, `resourceUri` as `{ root, path }`), elements kept in the host and passed to oculus as handles, `onDidChangeTreeData` sent as `oculus/changed`; the TreeView answers `reveal`, `title`, `description`, `message`, `badge` and `onDidChangeSelection`, `onDidExpandElement`, `onDidCollapseElement`, `onDidChangeVisibility`; drawn with oculus's tree (`ui/tree`), its keys and its virtual rows; a tree view of an app with no host draws a line saying the app has no program to fill it; (b) a frame-driven tree, which a closed tab cannot fill; (c) a flat list, the lazy option. Taken: (a).

Where it applies: D63. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z796 (2026-10-11, step D63, the orchestrator, automode): views in the side bar and panel

- Options: (a) `viewsContainers.activitybar` and `viewsContainers.panel` entries `{ id, title, icon }`, and `views` keyed by a container id or by `explorer`, each view `{ id, name, type: tree | webview, when, entry }`; each view is a view of the Views catalogue in the Apps group, under its container's title as a heading, opened as a tab and found by Cmd-K; the first opening of a view of an `activitybar` container puts it in a float docked left (the side bar), of a `panel` container in a float docked bottom (the panel), and of `explorer` in the pane that holds the Files view on the page, else beside the active pane; `onView:<id>` fires when a view is drawn; the rail gains no button, since the rail is the reader's `layout.yml`; (b) a rail button per `activitybar` container, which writes into the reader's rail; (c) catalogue tabs with no placement, the lazy option. Taken: (a).

Where it applies: D63. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z795 (2026-10-11, step D63, the orchestrator, automode): status bar items

- Options: (a) `oculus.window.createStatusBarItem(id, alignment, priority)` in the host, and `oculus.register('statusItem', id, options)` with `oculus.changed` in a frame, each item VS Code's `{ text, tooltip, command, name, backgroundColor of warning or error, accessibilityInformation }` with `show()`, `hide()` and `dispose()`; `$(name)` in the text draws a glyph of `glyphs.yml` and an unknown name as its text; left items are drawn after `latex` and right items before `sessions`, each side by priority, higher first, then by app view id; the bar's right-click menu lists each as `<name> (<app title>)` and hides it as it hides oculus's items; a frame's items go when the app's last tab closes, a host's when the host stops; (b) one Apps item opening a list, which VS Code does not do; (c) no status items, the lazy option. Taken: (a).

Where it applies: D63. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z794 (2026-10-11, step D63, the orchestrator, automode): menus

- Options: (a) the VS Code menu ids D63 builds: `commandPalette` (a `when` hides a command from Cmd-K), `editor/context` (the source editor's right-click), `editor/title` (the tab bar's actions of a source tab or custom editor: group `navigation` as buttons with the command's icon, the rest in its More Actions menu), `editor/title/context` (a tab's right-click), `explorer/context` (a Files row's right-click), `view/title` (an app view's title actions) and `view/item/context` (an app tree row's right-click, group `inline` as row buttons); an entry `{ command, when, group, alt }`, groups ordered as VS Code orders them (`navigation` first, then by name, `@<n>` inside a group), an app's groups after oculus's own in each menu; another menu id (`scm/*`, `debug/*`, `terminal/*`, ...) drops the entry with a finding naming it, the app offered, since D64 builds the tools' menus; (b) one Apps submenu per menu, which hides app items a level down unlike VS Code; (c) the command palette alone, the lazy option. Taken: (a).

Where it applies: D63. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z793 (2026-10-11, step D63, the orchestrator, automode): `when` clauses and context keys

- Options: (a) VS Code's when grammar: `!`, `&&`, `||`, parentheses, `==`, `!=`, `=~` with a `/regex/flags`, `<`, `<=`, `>`, `>=`, `in` and `not in`, and a bare key as its truth; the keys oculus sets: `editorTextFocus`, `editorFocus`, `editorLangId`, `resourceExtname`, `resourceFilename`, `resourceLangId`, `resourcePath` (`<root>/<path>`), `explorerResourceIsFolder`, `view`, `viewItem`, `focusedView`, `activeCustomEditorId`, `activeWebviewPanelId`, `isMac`, `isLinux`, `isWindows`, plus each key an app sets with `executeCommand('setContext', key, value)`, whose key must start with the app's name and a dot; a key nothing set is undefined, as in VS Code; a clause that does not parse refuses the app with a finding naming it; (b) no `when`, every item always drawn, which floods menus; (c) only `!` and `&&`, the lazy option, which breaks clauses VS Code extension authors write. Taken: (a).

Where it applies: D63. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z792 (2026-10-11, step D63, the orchestrator, automode): keybindings

- Options: (a) `contributes.keybindings` entries `{ command, key, mac, linux, win, when, args }` in VS Code's key syntax, a two-part chord included (`ctrl+k ctrl+c`), `mac` taking the place of `key` on macOS; oculus's own keys and the editor's come first: a binding equal to a key oculus resolves is not bound and is a finding naming both, the app still offered; two apps binding one key in one `when` give it to the app first in the Views catalogue's order, with a finding on the other; a binding is resolved after oculus's keys and before the browser, while no field or overlay holds the keyboard unless its `when` asks for `editorTextFocus`; the key sheet (`?`) lists app bindings under Apps, and Cmd-K shows a command's key as its hint; (b) app keys before oculus's, which lets an app take Cmd+S; (c) no keybindings, the lazy option. Taken: (a).

Where it applies: D63. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z791 (2026-10-11, step D63, the orchestrator, automode): commands, and the host's and frame's API for the shell

- Options: (a) a declared command (`command`, `title`, `category`, `icon` as `$(glyph)` naming a glyph of `glyphs.yml` or a file of the app, `enablement` as a when clause) is listed in Cmd-K as `<category>: <title>` with the app's title as its hint while its app is approved and enabled; choosing it fires `onCommand:<id>` through the manager's `activate`, then runs the handler the host registered with `oculus.commands.registerCommand(id, handler)` (`oculus/register` kind `command`, run by `oculus/provide` kind `command` with the arguments), else the handler of an open tab of the app that registered it with `oculus.register('command', id)` (the frame's handler `onCommand(id, args)`), else a notice naming the command and the app; the host's new members follow VS Code's namespaces, `oculus.commands`, `oculus.window` and `oculus.workspace`, beside the members it has; `oculus.commands.executeCommand(id, ...args)` (`oculus/commands/execute`) runs a command of any approved and enabled app, `setContext` (Z793) and oculus's own palette commands as `oculus.<name>` with one text argument (`oculus.theme`, `oculus.workspace`, ...), and refuses any other id `missing`; (b) a frame-only command handler, which loses commands of apps whose tab is closed; (c) commands listed but run only by opening the app's tab, the lazy option. Taken: (a).

Where it applies: D63. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z790 (2026-10-11, step D63, the orchestrator, automode): how an app declares what it adds to the shell

- Options: (a) one manifest key `contributes:`, a map holding VS Code's contribution points by their own names and shapes, written in YAML: `commands`, `keybindings`, `menus`, `viewsContainers`, `views`, `customEditors`, `configuration`, `themes` and `iconThemes`; every id an app adds (a command, a container, a view, a custom editor's `viewType`, a setting key, a context key) starts with the app's name and a dot, so two apps never take one id; `appShape` checks the map and a fault refuses the app as every manifest key does, except a menu id or a container D63 does not build, which drops that entry with a finding and leaves the app offered; what an app declares is drawn from its approval on, before its host runs, and an unapproved, disabled, removed or changed app adds nothing; the approval panel lists what the app adds, by kind and count; (b) one top-level key per kind, which an author who knows VS Code's `package.json` has to learn again; (c) registration at run time alone, the lazy option, which leaves a reader nothing to approve and makes `onCommand` and `onView` activation impossible, since nothing is listed before the host runs. Taken: (a).

Where it applies: D63. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z786 (2026-10-10, step D61, the orchestrator, automode): what New workbench in the Workbenches view opens

- Options: (a) a menu of the served roots' tops and Open Folder..., which shows the folder panel Add Folder to Workspace uses (POST /api/folders/pick): a folder inside a served root opens its workbench at that root and path, and a folder outside every served root is added to the workspace by the same act as Add Folder to Workspace and its workbench then opens, as VS Code's Open Folder opens any folder; (b) the same, refusing a folder outside every served root with a line that says to add it first, which leaves the reader to do by hand what the act already does; (c) the roots' tops only, the lazy option, which drops the step line's "New workbench from a folder". Taken: (a).

Where it applies: D61. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z785 (2026-10-10, step D60, the orchestrator, automode): the `tier` of a root in the Settings view

- Options: (a) the Settings view's `roots` fields gain `tier`, a choice of the four words with none allowed, and its help names what each does (`config/catalogs/options.yml:1363-1371`), so a reader sets it where the roots are edited; (b) the docs say it is set in the file, which leaves a Settings edit unable to show it; (c) neither, the lazy option, which hides a key the Settings view would then write around. Taken: (a).

Where it applies: D60. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z784 (2026-10-10, step D60, the orchestrator, automode): how a `tier: projects` repository moves between ideas, active and manuscripts

- Options: (a) by its manifest's `type:` line, which picks the flat scan rule and so the board column, edited in the manifest's source, as a hub project moves by its folder; a write still refuses `type` (DATA-MAP.md:570), the board offers no move, and HELP.md says so beside the `tier` change that archives it; (b) let the editor write `type` for a repository alone, which breaks the one rule every manifest write keeps; (c) say nothing, the lazy option, which leaves a reader with no way to move it. Taken: (a).

Where it applies: D60. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z783 (2026-10-10, step D60, the orchestrator, automode): an app's write to a repository's research project

- Options: (a) answers not found to an app's frame, as a repository side project's `.oculus/project.yml` does today (`sidesFor`, `src/lib/server/edit/writes.ts:329-336`, DESIGN.md:558), so an approved app's writes stay inside the hub's folders; the page's own writes reach it; (b) an app may write it as it writes a hub research project, which lets an app reach a file in a repository outside the hub that its approval never named; (c) leave it to whatever `homeOf` answers, the lazy option, which decides a security boundary by accident. Taken: (a).

Where it applies: D60. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z782 (2026-10-10, step D61, the orchestrator, automode): the status bar's repository item and the last chosen repository

- Options: (a) a status bar item of its own, `repository`, before the branch item and hideable, its tooltip naming the folder and why it is shown; a pick is the last chosen repository, one value for the window kept in the ui store, and a pick made while a file or a workbench decides is kept for when neither does, the picker's heading saying so; (b) the name inside the branch item, which the bar's menu then cannot hide apart; (c) a pick that overrides the active file, which the ruling's order forbids. Taken: (a).

Where it applies: D61. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z781 (2026-10-10, step D61, the orchestrator, automode): where the Workbenches view lives

- Options: (a) a unique view of the Views catalogue's `views` group registered last, after Processes, so it is the eleventh entry and has no chord and every existing chord stays (amended at D61's brief check: placed after Pages it would take `y5` and shift five chords), opened from the rail menu's new item Manage Workbenches; New workbench as Z786 says (amended at D61's brief check); (b) a rail page of its own, which adds a button for a list the menu already reaches; (c) only the rail menu, the lazy option, which the ruling's view replaces. Taken: (a).

Where it applies: D61. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z780 (2026-10-10, step D60, the orchestrator, automode): Deposit and LaTeX for a repository

- Options: (a) a repository's research project has no Deposit, since the deposit mirrors a hub folder's `code/` and a repository is its own git repository; LaTeX reads a research project's `manuscript/` from its folder as `placeOf` gives it, a repository's included, so a repository paper has the LaTeX panel, while a repository side project stays as it is (no panel), since the step line keeps it a side project as now (amended at D60's brief check); (b) keep LaTeX off for research repositories, the lazy option, which leaves a repository paper without its panel. Taken: (a).

Where it applies: D60. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z779 (2026-10-10, step D60, the orchestrator, automode): the board and type a repository's `tier` gives, and an unusable one

- Options: (a) the root's `tier` names the scan rules carrying the same `tier:` word in the hub's layer: `coauthor` and `archive` take that nested rule, the type (the outcome) read from the manifest; `projects` takes the flat rule whose `type` equals the manifest's; a type no such rule names, a `tier` word no rule carries, or a key a scan project already uses is a finding and the repository is read as a side project, so it never vanishes; a research `tier` with no `.oculus/project.yml` is a finding and no project; (b) a fixed map in code from the four words to tiers, which ignores the hub's own layer; (c) drop an unusable repository silently, the lazy option. Taken: (a).

Where it applies: D60. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z778 (2026-10-10, step D60, the orchestrator, automode): the id of a repository's research project

- Options: (a) the root's key (`cathedra`), as a scan project's id is its folder's name, so another manifest's `related:` and `waiting-on:` name it plainly; a key a scan project already uses is a finding and the repository stays a side project; a tab saved on the side id `root:<key>` draws the project view's empty line after the change; (b) keep `root:<key>`, which marks a research project with the side projects' prefix and makes every reference carry it; (c) the repository folder's name, which two roots can share. Taken: (a); none of this hub's six root keys is a hub project's folder name.

Where it applies: D60. Booked in `plan.md` Rulings, the brief and the closed log of `orchestrator-history.md`.

## Z777 (2026-10-10, step D62, ruled by Axel): D62 beside D60 and D61

- Chosen: D62 starts once D59 lands, beside D60 and D61; it needs D59's changes to `ApprovalPanel.svelte` and `docs/apps.md`, nothing of D60 or D61.
- Not chosen: D62 after D61 (the lazy option), which held the three app steps back with no cause.

Where it applies: D62. Booked in `plan.md` Rulings, `queue.md` and the closed log of `orchestrator-history.md`.

## Z776 (2026-10-10, step D59, the orchestrator, automode): existing workbenches renamed too

- Chosen: a workbench kept from before, closed or open at reload, drops a Files or LaTeX tab label equal to its folder name, so every workbench reads Files and LaTeX.
- Not chosen: new workbenches only (the lazy option).

Where it applies: D59 item 5. Booked in `plan.md` Rulings and the closed log of `orchestrator-history.md`.

## Z775 (2026-10-10, step D59, the orchestrator, automode): which pages take hub documents as tabs

- Chosen: any page whose key a `docs:` entry's `group` names, the Help page among them.
- Not chosen: the Help page alone, as a special case.

Where it applies: D59 item 1. Booked in `plan.md` Rulings and the closed log of `orchestrator-history.md`.

## Z774 (2026-10-10, step D59, the orchestrator, automode): your saved Help page gets the documents

- Chosen: a saved page gains each document of its group once, remembered, so your Help page shows them without a Reset and a document tab you close stays closed.
- Not chosen: added on every reload (a closed tab comes back); saved pages untouched until Reset (the lazy option).

Where it applies: D59 item 1. Booked in `plan.md` Rulings and the closed log of `orchestrator-history.md`.

## Z773 (2026-10-10, step D59, the orchestrator, automode): the rail badge under a rice theme

- Chosen: 8px, one step below its 9px under every other theme.
- Not chosen: 9px kept as an exception, since the rice digits are already narrower.

Where it applies: D59 item (7). Booked in `plan.md` Rulings and the closed log of `orchestrator-history.md`.

## Z772 (2026-10-10, step D59, the orchestrator, automode): the slide scale under a rice theme

- Chosen: the slide sizes times 12/13 rounded (52, 33, 26, 22, 17 px instead of 56, 36, 28, 24, 18), so a deck under a rice theme and its print follow the same step-down as the chrome.
- Not chosen: slides left out of the step-down (the lazy option, slide text stays larger); slides kept in the sans face under rice, which changes what a rice deck looks like.

Where it applies: D59 item (7). Booked in `plan.md` Rulings and the closed log of `orchestrator-history.md`.

## Z771 (2026-10-10, step D59, the orchestrator, automode): what "larger" means for the rice font sizes

- Chosen: the font size: every text under a rice theme is one size below the same text under a VS Code theme. The diagnosis found six size tokens, the slide scale and the app approval panel that kept the VS Code size; all are stepped down.
- Not chosen: the rendered width, no rice text drawing a wider box. The monospace face is wider per letter, so after the fix 681 of 1394 measured texts still take more room under rice; ending that means dropping the monospace face or shrinking about 25%, which replaces the rice look.

Where it applies: D59 item (7). Booked in `plan.md` Rulings and the closed log of `orchestrator-history.md`.

## Z770 (2026-10-10, step D59, the orchestrator, automode): where the memories photos and the wallpaper go

- Chosen: `<hub>/.oculus/memories/` and `<hub>/.oculus/wallpaper/`, the hub's own oculus folder; `memories.dir` and `wallpaper.dir` default to `.oculus/memories` and `.oculus/wallpaper`, relative to the hub; the other wallpaper keys stay oculus's.
- Not chosen: two new top-level folders `memories/` and `wallpaper/` in the hub; leaving the images in `tools/oculus/assets/` and moving only the keys, the lazy option.

Where it applies: D59. Booked in `plan.md` Rulings and the closed log of `orchestrator-history.md`.

## Z769 (2026-10-10, step D58, the orchestrator, automode): G2 and the engine's documents

- Chosen: G2's guarantee gains the exception for a Markdown document of the engine folder, which `api/docs` serves from inside that folder alone and never from `node_modules` or a dot folder; the docs route joins G2's Code line and its table test the Test line; the orchestrator writes the three lines at landing.
- Not chosen: a new guarded entry for the docs route alone, which is yours to approve; no test for the engine read (the lazy option).

Where it applies: D58. Booked in `plan.md` Rulings and the closed log of `orchestrator-history.md`.

Reviewed 2026-10-10 by Axel: agreed.

## Z768 (2026-10-10, step D58, the orchestrator, automode): how a tab and the docs route name a document of the engine

- Chosen: a doc tab's state may carry `engine: true`, its `path` then relative to the engine folder and its id `engine:<path>`; `api/docs?engine=<path>` serves a Markdown file inside the engine's real folder; the manual's and an engine document's answers name paths relative to the engine, so links between them work wherever the engine sits; a saved tab at the guide's old hub path is restated; the Help page's tab names the guide this way, and this hub's `docs:` entry for the guide is removed so one file is one tab.
- Not chosen: a view of its own for the guide with a fixed path, which serves one file and special-cases the manual's link; the server trying the engine folder when a hub path fails, which still breaks when the engine sits outside the hub (the lazy option).

Where it applies: D58. Booked in `plan.md` Rulings and the closed log of `orchestrator-history.md`.

Reviewed 2026-10-10 by Axel: agreed.

## Z767 (2026-10-10, step D55's landing, the orchestrator, automode): the hub fields an app sees on feed writes and people

- Chosen: `root?` on the `feed-field` and `feed-delete` writes, as on the LinkedIn posted write, and `file?` (the absolute path of the people file) on a person of a hub other than the first, both kept and documented in `docs/apps.md` with the other hub fields; an app's write naming another `root` answers not found.
- Not chosen: routing a feed write by its item id alone, which sends a first-hub lead titled like a second-hub id to the wrong hub; keeping the two fields undocumented (the lazy option).

Where it applies: D55. Booked in `plan.md` Rulings and the closed log of `orchestrator-history.md`.

Reviewed 2026-10-10 by Axel: agreed.

## Z766 (2026-10-10, step D49's landing, the orchestrator, automode): the Apps guide on every hub

- Chosen: a new step, D58, after D49 and D55 and before Q72: the Help page's Apps guide tab and the manual's link to the guide name it by its path in the engine and are served as the manual is, so the guide opens on any hub.
- Not chosen: listing the guide in the engine's `docs:` (the hub's layer replaces that key whole, and the path still resolves against the hub); leaving it, so the guide opens only on this hub (the lazy option).

Where it applies: D58, Q72. Booked in `plan.md` Rulings and the closed log of `orchestrator-history.md`.

Reviewed 2026-10-10 by Axel: agreed.

## Z765 (2026-10-10, step D55, the orchestrator, automode): the internal shapes of a second hub

- Chosen: an audit finding of a second hub carries `root`, opened under it by the Audit view; the LinkedIn posted write carries `root`; an app's write naming a second hub's record is refused as an unknown record; a second hub's word with no colour in the first hub's vocabulary is drawn neutral; the workspaces answer marks each hub root with `hub: true` so the page withholds every hub's `secrets`.
- Not chosen: absolute paths on audit findings; apps routed to a second hub; a finding for an uncoloured word; the page's private check left on the first hub only (the lazy option: a second hub's `secrets` would open in the page).

Where it applies: D55. Booked in `plan.md` Rulings, the closed log of `orchestrator-history.md` and `agents/briefs/D55.md`.

Reviewed 2026-10-10 by Axel: agreed.

## Z764 (2026-10-10, step D49, the orchestrator, automode): the standing spec's rule on HELP.md and the guides

- Chosen: the sentence of `agents/spec.md` that sends detail to "the guide under `docs/` that owns it" becomes "A step writes what a user does into HELP.md as short bullets, what an app builder meets into the Apps guide `docs/apps.md`, and a decision with its reason into DESIGN.md.", following ruling (8), which cuts the guides into HELP.md.
- Not chosen: the sentence left as it is (the lazy option: later steps would be told to write into guides that no longer exist); a clash raised for Axel (ruling (8) already decides it).

Where it applies: D49 and every later step. Booked in `plan.md` Rulings, the closed log of `orchestrator-history.md` and `agents/briefs/D49.md`.

## Z763 (2026-10-10, step D56, the orchestrator, automode): Reset all pages and a unique view a workbench holds

- Chosen: Reset all pages leaves every workbench and its tabs as they are; a rail page whose arrangement names a unique view (Settings, for instance) that a workbench holds is built without it, and DESIGN.md's unique-view sentence names this exception.
- Not chosen: moving the held view out of the workbench into the rail page (it changes a workbench the reader built); resetting workbenches too (a workbench has its own reset); DESIGN.md left as it is (the lazy option: it would then state a rule Reset all pages breaks).

Where it applies: D56, repair round 1. Booked in `plan.md` Rulings, the closed log of `orchestrator-history.md` and `agents/briefs/D56-round1.md`.

## Z762 (2026-10-09, step D55, the orchestrator, automode): the shapes of a second hub

- Chosen: (a) `hub: true` on a `roots:` entry of the first hub's layer, with findings for a non-boolean, a hub inside, holding or equal to the first, and a key `side`, `root` or one holding `:`; (b) a second hub's ids `<root key>:<id>`, references never crossing hubs; (c) a `root` field on every record (`hub` or the root key), paths relative to their own hub; (d) each hub built with its own settings, the page's settings and `roots:` the first hub's; (e) career and website the first hub's, feeds and audit merged; (f) a write goes to its record's hub, a new record to the first, the change log naming a second hub's file by its absolute path; (g) a root-key chip on a second hub's cards, rows and entry pages; (h) every hub's `secrets` private; (i) a hub root's own `.oculus/project.yml` not a side project.
- Not chosen: bare ids with collisions refused (the lazy option, against the step's line); `/` as the separator (reads as a path); a hub per page; asking which hub for a new record; a second hub's career and website.

Where it applies: D55. Booked in `plan.md` Rulings (and D55's Step 0) and the closed log of `orchestrator-history.md`.

## Z761 (2026-10-09, step R2, the orchestrator, automode): the supported Node, an unreadable hub, and the app's install check

- Chosen: (a) Node `^24.15.0 || >=26.0.0`, the range every installed package accepts, in `engines`, the start check and the docs, `engine-strict` kept; (b) an unreadable hub reported as the hub lack with its error code; (c) `preapp` runs only the Node and packages check, the app checking the hub and programs over its own engine.
- Not chosen: `engines` kept at `>=24` (the lazy option: npm refuses Node 24.0 to 24.14 and 25 over write-file-atomic while the README says below 24); `engine-strict` dropped (Node 25 installs a package that declares it unsupported); `preapp` removed (missing packages reach Electron's load error).

Where it applies: R2, repair round 1. Booked in `plan.md` Rulings, the closed log of `orchestrator-history.md` and `agents/briefs/R2-round1.md`.

## Z760 (2026-10-09, step R2, the orchestrator, automode): the scratch port, and where engineDir lives

- Chosen: (a) port 8811 through the scratch engine's `local.yml` or `--default-port`; (b) a new `src/lib/data/places/` holding `engine-dir.ts` and `hub-address.ts`.
- Not chosen: `engine-dir.ts` among the zod schemas of `src/lib/data/shapes/` (the lazy option); moving `file-ops.ts` and `hub-address.ts` together (57 importers, a folder no name fits).

Where it applies: R2. Booked in `plan.md` Rulings, the closed log of `orchestrator-history.md` and `agents/briefs/R2-cases.md`.

## Z759 (2026-10-09, step D56, the orchestrator, automode): the kept workbench's view state, and Close in the Workbenches menu

- Chosen: (a) each kept workbench entry carries `states: { <instanceId>: <state> }` in browser storage, the ui record of each tab snapshotted at close and written back at reopen, a source tab's unsaved text left out; (b) an optional trailing action on `MenuItem`, drawn as its own button, used for Close.
- Not chosen: a kept layout with no view state (the lazy option: the reopened tabs lose their folder limit); two rows per workbench (the lazy option); a hand-drawn popover (against the Menu primitive).

Where it applies: D56. Booked in `plan.md` Rulings, the closed log of `orchestrator-history.md` and `agents/briefs/D56-cases.md`.

## Z758 (2026-10-09, step D50, the orchestrator, automode): links in the carry-over, and the findings of D50's review over repair round 1

Replaced by Axel's ruling The move (`plan.md` Rulings): no carry-over code; its findings (d) and (e) are fixed at D50's landing.

- Chosen: (a) a link under a carried folder is copied only when its target lies inside that carried folder, so no secret of `~/.oculus` reaches the hub's tracked folder; (b) a carried path that is itself a link is copied as what it points to, unless it points into the secret folders or at `approvals.json`; (c) a dangling link is left out with a finding and the rest is copied; (d) the DATA-MAP sentences fixed at landing, the apps sentences after open item 31; (e) the test titles and the roots helper fixed at landing.
- Not chosen: the build's refusal of a top-level link (empties Bookmarks or Notes at every start); Z755's boundary at `~/.oculus` (a linked token lands in git); the build's refusal of the whole folder for one dangling link (hides every note).

Where it applies: D50, at its landing, after open item 31. Replaces Z755. Booked in `plan.md` Rulings and the closed log of `orchestrator-history.md`.

## Z757 (2026-10-09, step D56, the orchestrator, automode): the shapes D56's brief check found open

- Chosen: (a) the workbench arrangement is a top-level `workbench:` key of `config/layout.yml`, read by `parseArrangement`, replacing Z756 (b)'s `arrangements: workbench:`, so the rail reader and the Settings rail editor never take it for a rail page; (b) reader-facing text calls the page a workbench, code calls its field `folder` and its new identifiers `folderPage`, and DESIGN.md says once that the word keeps its two existing uses; (c) the left pane is one pane of six tabs, Files active; (d) Problems gains an `under` path beside its root `scope`; (e) Repositories lists the repositories inside the folder and the one that holds it; (f) LaTeX takes the folder-only shape `{ root, path, label }` the view already reads; (g) the sessions list shows `sessionsForProject`, sessions working in the folder or filed into it by their area; (h) the action goes on ProjectCard (project view and Projects board), EntryCard, the side project card, FolderFiles, the entry page and the Files folder menu, and not on the venue card or a worktree's opening; (i) a workbench made from the config or by Reset layout takes held unique views in as every build from the config does (DESIGN.md:481), a restored one leaves them out; (j) Reset layout keeps the plan line's words and asks first as Reset of a rail page does; (k) Reset all pages leaves workbenches and their kept layouts as they are; (l) at most 20 kept layouts, the one closed longest ago dropped first; (m) the root itself is named by its key, as a rooted Files tab is; (n) a second opener of an open workbench switches to it and keeps its words, and a Pages rename lasts while it is open; (o) New in its sessions list opens a Terminal tab in the documents pane at the folder; (p) a side project's documents pane shows its `project.yml`, as its card's title opens it; (q) the 19 VS Code classes go first in the Code theme menu, in its dark and light groups; (r) a kept entry that does not read is dropped and the rest of the envelope read; (s) the cards' and entry page's action is "Open Workbench"; (t) Problems, Repositories and the sessions list draw Search's "In {0}/{1}" line with a clear control worded for each view.
- Not chosen: (a) `arrangements: workbench:` kept with an exclusion in `readRail` and in the rail editor's choices, two special cases for one key; (c) panes of a column, against the plan line's one left pane; (d) Problems left at root scope, the lazy option, which shows every problem of the hub in a project's workbench; (e) only repositories inside the folder, which lists none for every hub project; (f) a new LaTeX folder field, a second way to say what the folder-only shape says; (h) the action on every Show in Files, including a venue link that may be a file; (i) leaving held views out of a fresh build, against DESIGN.md:481; (j) "Reset to its arrangement" for both, or no question, which loses unsaved text; (l) no cap (the earlier brief's choice), which lets the kept layouts fill the browser's storage and stop the whole layout saving; (r) refusing the whole envelope, which loses every page.

Where it applies: D56. Booked in `plan.md` Rulings, the closed log of `orchestrator-history.md` and `agents/briefs/D56.md`.

## Z756 (2026-10-09, step D56, the orchestrator, automode): the Workbenches button, the workbench's arrangement and where a closed workbench is kept

- Chosen: (a) a fixed Workbenches button at the rail's foot beside Bookmarks, always drawn, opening a menu of the open workbenches that switches to one and closes one; (b) the workbench page made from a new `arrangements: workbench:` entry of `config/layout.yml`, which the reader can change like any rail page's, its tabs given the folder when the workbench opens; (c) a closed workbench's layout kept in the browser's saved layout beside the pages, by its folder.
- Not chosen: (a) a new `rail:` entry form such as `{ label, glyph, workbenches: true }`, which adds a key to the rail list, the Settings rows and the rail reader for a button with one job; workbench pages listed only in the Pages view with no button, the lazy option, which leaves out the step line's button; (b) the arrangement written in code, which the reader could not change and Reset could not give back from the config; (c) a file in the hub's `.oculus/` shared across machines, which adds a record file and a lock and keeps one browser's arrangement for every machine.

Where it applies: D56. Booked in `plan.md` Rulings, the closed log of `orchestrator-history.md` and `agents/briefs/D56.md`.

## Z754 (2026-10-09, step D46, the orchestrator, automode): the 50 ms bound over queries of several words

- Chosen: B, the file mode's matching moved into a Web Worker (Vite's `?worker`, as Monaco's workers are built), which takes the names once per answer and answers each numbered query with at most 200 rows, the page drawing only the newest answer and keeping the last rows while it waits. The bound of the brief's line 73 is restated as under 50 ms of the page's main thread per keystroke over 100,000 names, with the worker's matching time quoted as measured.
- Not chosen: A, the stock figures accepted with the requirement unmet (the lazy option); C, the rarest word matched first, which returns wrong rows when two words both match many names; D, a new meaning for a query of several words, which changes what a user's query finds.

Where it applies: D46. Booked in `plan.md` Rulings and `agents/briefs/D46-cases.md` (its second section).

## Z753 (2026-10-09, step D50, the orchestrator, automode): the choices of D50's brief check

(f) replaced by Axel's ruling The move (`plan.md` Rulings).

- Chosen: (a) the hub's `.oculus/` tracked in the hub's git, since ruling (9) calls the five files shareable; (b) `loadConfig(engine, hub?)`, every server caller passing `local.hub`, a call with no hub reading the engine alone, so fixture tests are unchanged and no test reads the real hub's layer; (c) `slurm.resource` `''` meaning no cluster, `config.test.ts`'s empty-resource row made true to it, and the hub-list options' defaults set to the engine's general values so Reset writes them, `domains` `{}`; (d) `linkedin_dir` absent is no LinkedIn feed, the website fallback dropped; (e) a write of a hub-list key the hub layer lacks inserts it (file and folder created when absent), its undo removing what it created; (f) a link under a carried folder copied as what it points to, a carried app asked for approval again, a carried note's earlier save copies not carried, each said in the docs; (g) this hub's layer keeps the whole `docs:` list, oculus's guides with it; (h) the hub layer checked per dotted key, a `local.yml` there a finding and never read; (i) the cases over this hub read it only through G14's integrity test.
- Not chosen: `.oculus/` ignored (the lazy option: no `.gitignore` decision, and the shareable files stay machine-local in another folder); `loadConfig` reading `local.yml` itself (every test over the real engine would then read the real hub's layer); `slurm.resource` absent with the `utwente` default kept (a hub with no cluster would poll utwente); a write refused when the hub layer lacks the key (the lazy option: the Settings view could not set a hub key on a fresh hub); links copied as links (a link out of the hub inside its git).

Where it applies: D50. Booked in `plan.md` Rulings, D50's brief ("Decisions taken in this brief", "Closed") and `agents/reviews/D50-brief-check.md`.

## Z752 (2026-10-09, step D52, the orchestrator, automode): the choices of D52's brief check

- Chosen: (a) `checkFundingIdentity` (`funding_no_identity`), `checkFundingStatements`' `funding_no_key` and the keyless funding branch of `checkEntryIdentity` removed with their two sentences, a keyless funding entry named by `entry_no_id` and the schema's `required` finding as in every keyed file; (b) the project page's session row and the person page's folder block moved into `views/shared/sessions/SessionRow.svelte` and `views/shared/links/FolderFiles.svelte`, drawn by both pages and the entry page; (c) `task-card.ts` moved with the card, so the page's card keeps Start Agent on a task; (d) an entry whose link is a file inside a folder of its own (Veni, ENW-XS, VIB.AI) gets no page, its key from its title; (e) the keys written by hand under Axel's ruling (13), every key line listed in the report; an empty slug takes `entry-<n>`, a clash a `-2` suffix in file order, a key YAML would read as other than text is quoted; (f) an undo of a write recorded before the step, naming the entry by its title, refused as a gone entry, nothing written.
- Not chosen: keeping the funding checks beside `entry_no_id` (two sentences for one fact); copying the session row and the folder block into the page (the duplication check, and two copies to keep in step); the page's card without Start Agent (the lazy option); a page for the folder a file link sits in (beyond the ruling's "an entry whose link is a folder"); a new migration script for the keys (a new script needs Axel's approval of what it computes, and the rules let a ruling's rewording be written by hand); an undo that searches for the entry by its old title (a second identity read for a one-off).

Where it applies: D52. Booked in `plan.md` Rulings, D52's brief and `agents/reviews/D52-brief-check.md` ("Closed").

## Z751 (2026-10-09, step D50, the orchestrator, automode): the choices of D50's brief

(d) replaced by Axel's ruling The move (`plan.md` Rulings).

- Chosen: (a) the hub layer may set only the hub list: the keys of `sources.yml` that name hub paths and the hub's served folders (`roots`), `docs` of `layout.yml`, `slurm.resource` and `data_domains` of `behavior.yml`, and `domains`, `venue_themes` and `data_themes` of `catalogs/vocab.yml`; any other key there is a finding and is not applied; (b) a hub key replaces the engine's value of its path whole, a list included; (c) the machine's apps folder defaults to `<hub>/.oculus/apps` and is read once, as the machine folder, never again as the hub root's apps; (d) at start, each of `bookmarks.yml`, `notes/`, `apps/`, `schedules.yml` and `workspaces.json` is copied from `~/.oculus` to `<hub>/.oculus/` when the hub has none, nothing deleted; (e) the engine keeps the general folder layout, and the two website keys, `roots`, `docs`, `slurm.resource` and the four research lists are empty or absent there, this hub's values moved to `<hub>/.oculus/config/`; the `help` arrangement opens oculus's own guides, the hub's documents reached from the catalogue; (f) the chat instruction names the owner from `self: true`, or "its owner", and drops the owner's null-result sentence, which the hub's `CLAUDE.md` carries to the agent.
- Not chosen: any key settable in the hub layer (the lazy option: one merge with no list, and the per-hub structure the ruling refuses); lists merged entry by entry (the engine's entries would stay in every hub); the hub's apps read as root apps (fewer channels for the reader's own apps) or read twice (a `repeated` finding on every app); leaving the files in `~/.oculus` for the reader to move (the lazy option: the bookmarks and notes vanish from the page); moving them (deletes from `~/.oculus`); the hub's documents kept in the engine's `help` arrangement (a hub path in oculus's general defaults).

Where it applies: D50. Booked in `plan.md` Rulings and D50's brief ("Decisions taken in this brief").

## Z750 (2026-10-09, step D51, the orchestrator, automode): the choices of D51's brief check, replacing Z747

- Chosen: (a) all 19 VS Code colour themes through the converter, the two Modern blocks regenerated and their hand-written blocks removed; (b) each token the first key of its list the theme sets, then the first with a registered default; `--chip` follows `--card`; `--muted` skips a candidate stronger than `--ink`; a high-contrast theme's `--line` and `--accent` from contrastBorder and contrastActiveBorder first; (c) a key the theme does not set takes VS Code's registered default, the git extension's `contributes.colors` read at run time and the workbench's registrations held as a table in the converter, oculus's base only where VS Code has no colour and for `--c-scm-conflict-bg`; (d) under `code_theme: tokens` the editor colours code with each VS Code theme's own scoped rules, written by the converter into `src/lib/themes/vscode-rules.json` and nudged to 4.5:1, the six code hues kept for highlight.js; (e) `derive.ts` nudges `--ink-txt` and the code `-txt` tokens on the three Source Control tints for every theme, and the contrast test measures those pairs and fails an `appearance.yml` row whose class has no block; (f) the classes and labels from the label VS Code shows, in the table of D51's brief, after the Modern rows; (g) the converter run from `tools/oculus`, its outputs formatted as `npm run format` leaves them.
- Not chosen: oculus's base as the first fallback (Z747's choice, on the wrong premise that the registered defaults are in no file the converter can read; it drew Default High Contrast Light as oculus's light theme and Dark+ with a navy line); reading the minified workbench at every run (breaks with any VS Code build); six code hues for the editor (the lazy option: every theme's keywords one colour, against the step line's "the editor's colour rules"); the text-on-tint pairs left for later (the lazy option: the step sets those tints for 19 themes); `merge.incomingContentBackground` for the conflict tint (the incoming change, a different meaning); class names from the theme `id` (two disagree with the label VS Code shows); a comment stripper for the theme files (no installed file needs one).

Where it applies: D51. Booked in `plan.md` Rulings, D51's brief ("Decisions taken in this brief") and `agents/reviews/D51-brief-check.md` ("Closed"). Z747 is replaced by it.

## Z749 (2026-10-09, step D52, the orchestrator, automode): the choices of D52's brief

- Chosen: (a) a `key` on every entry of the funding, events, education, applications, tasks, code and statements files: an existing key kept, a folder entry named by its folder, any other by its title as a slug; (b) `key` the first `schema:` field of those seven files, so a write, Edit in File and the identity findings address an entry by a value that does not change when the title is reworded; (c) venues keep `id` as their key; (d) funding's `idRequired` true, so a funding entry without a key is a finding; (e) the page is a view `entry` with the identity `<collection>:<key>`, opened from the title of a card whose link is a hub folder, folder-ness read from the file store's live listing of the parent folder; (f) Show in Files of a folder link opens a Files tab rooted at the folder, a file link keeps today's reveal; (g) the card, its actions and its grip moved to `views/shared/forms/entry/`; (h) the demo hub's collection files keyed by the same rule.
- Not chosen: the key added with `title` left as the identity (the lazy option: the key is carried and read by nothing); keys typed by hand per entry (no rule a reader can apply to the next entry); `id` on venues renamed to `key` (changes a shape every manifest's `venue_id` and the reference index use, which the ruling did not ask about); a folder flag computed when the snapshot is built (goes stale, the snapshot is rebuilt only on `.yml` and `.md` changes); the card copied into the page's folder (a second copy of one card); the card in `views/shared` or `views/shared/card` (both hold 10 items).

Where it applies: D52. Booked in `plan.md` Rulings and D52's brief ("Decisions taken in this brief").

## Z748 (2026-10-09, step D48, the orchestrator, automode): the choices of D48's brief check

- Chosen: (a) `live: false` on the `parked` row of `side_project_status`, read by the ticker, so no status word is written in code; (b) a ticker row's button is exactly the row's height at every text scale from 0.7 to 1.6; (c) a side project's subtasks and undated follow-ups under the heading "side projects", the catalog word of its deadline group; (d) a "related" line (`personal.related`) of project tags on the Personal card; (e) the apps API's `personal` map carrying the new side fields, listed in `docs/apps.md`; (f) a side write's file found through the portfolio the server last published, a `sideProjects` beside `projects` on `WriteTarget`, an id it does not hold refused as not found.
- Not chosen: the word `parked` written in the ticker (the lazy option: a vocabulary word bound in code); `padding: 1px 6px` (taller than the row below a text scale of 1); the raw word `side` or the research "other" heading for side tasks (a raw word breaks the catalog rule, "other" misfiles them); `related` read and not drawn (the lazy option); the apps API's old shape kept by dropping fields (a second shape of one record); the personal roots carried into every write (more plumbing, and a root no longer served would still be written until the next read).

Where it applies: D48. Booked in `plan.md` Rulings, D48's brief ("Decisions taken in this brief" 2, 4, 7-10) and `agents/reviews/D48-brief-check.md` ("Closed").

## Z747 (2026-10-09, step D51, the orchestrator, automode): the choices of D51's brief, replaced by Z750

- Chosen: (a) all 19 VS Code colour themes through the converter, Dark Modern and Light Modern regenerated and their hand-written blocks removed; (b) the mapping of D51's "What to build" 2, each token the first key of its list, alphas composited over `--panel`, `--chip` following `--card`; (c) a missing key falls back to the same token of oculus's base of the theme's type, a high-contrast theme's `contrastBorder` and `contrastActiveBorder` first, a missing tab key left out; (d) a text token short of 4.5:1 nudged by `derive.ts`'s rule, VS Code's value named in the block's comment, the contrast threshold unchanged; (e) the converter at `utils/migrations/convert-vscode-themes.ts` with `--from` and `--check`, its output `src/lib/themes/vscode.css` committed; (f) rows named `vscode-<slug>` with glyph `theme_base` and the label "vscode " plus VS Code's label in lower case, after the Modern rows in VS Code's order.
- Not chosen: the two Modern blocks kept by hand beside the generated ones (the lazy option: two ways to the same kind of theme, and the hand-written sentence stays); `--chip` from `badge.background` (a filled accent where oculus's chip is a neutral surface); VS Code's registered defaults as the fallback (they sit in its compiled workbench, no file the converter can read); a theme that misses 4.5:1 added with the check loosened (the lazy option); a new top-level `utils/` file (the folder is full).

Where it applies: D51. Booked in `plan.md` Rulings and D51's brief ("Decisions taken in this brief").

## Z746 (2026-10-09, step D48, the orchestrator, automode): the choices of D48's brief

- Chosen: (a) a side project's deadlines form a Focus group of their own, `side`, headed "side projects" with the glyph `spark`, after `task`; (b) a parked side project draws no Focus line; (c) a side project's write goes through the existing `writeManifest` and `writeSubtask` requests, the server looking a `side:` or `root:` id up through `readPersonal` and writing only a file it found, with `side_project_schema`'s field names; (d) a ticker row's button takes `padding: 1px 6px`, 18 px high, so the 18 px row keeps its height; (e) the Personal card draws `pin` (first in its status, with its glyph), `priority` (the lane card's flames), `latest`, `waiting-on`, `collaborators` and `related` as oculus draws them for a research project.
- Not chosen: side deadlines under `paper` or `task` (the lazy option; it misnames them); every side project on Focus whatever its status (a parked project's dates would crowd the board); a new write request for side manifests (a second request with the same fields); the 22 px button on an 18 px row (every row with a shown button would grow to 22 px); the six keys read and drawn nowhere (the lazy option: a key the reader writes and never sees).

Where it applies: D48. Booked in `plan.md` Rulings and D48's brief ("Decisions taken in this brief").

## Z745 (2026-10-09, step D47, the orchestrator, automode): the choices of D47's brief check

- Chosen: (a) a pick, pin or unpin in a tab's bar changes only `session` and `label` and keeps the tab's other state (`instances.ts` `pinInstance`, `unpinInstance`), so the Session view's closed sections and order survive a session change; (b) the saved-layout migration functions are renamed for the retired views they carry (`treeWithoutRetired`, `withoutRetiredTabs`) and the workbench held before pages goes through them; (c) the glyph `changes` leaves `glyphs.yml` and `icons.yml`, its last readers gone; (d) the chords read `m1-m5`; (e) each Session section is its own tree, Tab between them, as the Files view's; (f) G29's text is reworded at landing to name the retired tabs carried and dropped (`config`, `changes`, `agents`), with the new test's title; (g) the section state keys are `closed` and `sections`.
- Not chosen: `instances.ts` left as it is (the lazy option: every session pick would reopen the closed sections and reset their order); the old function names kept on functions that now carry three views, and the pre-pages workbench left unmigrated (the lazy option; a retired tab there draws as an unknown view); the glyph kept with no reader (fails `config-folder.test.ts`); one tree for the three heads (`Section.svelte` gives each head the id `head`, and the Files view does not do it); G29's text left saying every tab is kept (false since the `config` drop).

Where it applies: D47. Booked in `plan.md` Rulings, D47's Step 0 and `agents/reviews/D47-brief-check.md` ("Closed"); G29's wording at D47's landing.

## Z744 (2026-10-09, step D46, the orchestrator, automode): the choices of D46's brief check

- Chosen: (a) the file names come from the search route as `GET /api/search?list=names[&root=<key>]`, answered `{ ok, roots: [{ root, paths, error? }], cut }`, a request with no `list` a search as today and an empty, repeated or unknown `list` a 400; (b) the cap is the config key `search.max_names` (default 100000) beside `search.max_hits`; (c) hidden files and folders are listed, `.gitignore` honoured, the private folders left out, no size limit, a file under two roots listed under the deepest; (d) a file opened from the file mode opens in the view the Files view would choose (`tabForKind`, moved into `state/sources/explorer/file-type.ts` and reached through the `explorer` store), as a kept tab with the keyboard in its content; (e) F1, and off macOS Ctrl+P and Ctrl+Shift+P, are kept from a terminal's program in `grid-keys.ts`, the modifier read mac-aware as `appKey` reads it; (f) the editor's right-click "Command Palette" opens oculus's command mode; (g) at most 200 rows are drawn for a query, and `PaletteRow` gains the file icon.
- Not chosen: a route of its own for the names (makes `src/routes/api/(files)/` hold 11 items, and repeats the roots, the token and the timeout); a constant cap beside the `max_hits` key (the lazy option, the one search bound a reader cannot set); ripgrep's default that hides `.scratch/`, `.agents/` and `.oculus/` (the lazy option, 1,708 files Axel opens, the plan ledgers among them); every file opened in a source tab (a PDF or a picture shown as text); the preview tab (a file chosen by name is one the reader means to keep, as VS Code's quick open keeps it); F1 left to the terminal's program (the key then does nothing the reader sees in a terminal); Monaco's right-click palette kept (a second command list beside oculus's).

Where it applies: D46. Booked in `plan.md` Rulings, D46's Step 0 and `agents/reviews/D46-brief-check.md` ("Closed").

## Z743 (2026-10-09, step D41, the orchestrator, automode): the choices of D41's brief check

- Chosen: (a) the link rewrite after a move also rewrites backticked hub paths into the moved file or folder, in the same preview, each kept in its form (from the root or from the file's folder, a `:line` suffix kept); (b) the Audit's wrong-`type` item checks the coauthor `abandoned` folder (`type: abandoned`) besides the flat tiers and the archive outcome folders, its `active` and `published/<year>` folders holding several types; (c) the Markdown entry declares every provider the server offers that VS Code's Markdown support uses (path completion, hover, definition, references, heading rename, document and workspace symbols, folding, selection ranges, code actions, document links), and the Outline takes its symbols, its own heading reading as the fallback while the server is not running; (d) G2's and G36's Code and Test lines gain the Markdown entry, G36 names one Markdown server per root and page, and one started for a rewrite with no tab open ends 60 s after its answer; (e) a rewrite asks every served root whose folder holds both places, the edits merged; (f) the words "File does not exist at path: {0}" for a backticked mark (the server's own sentence, so one kind of mark has one sentence), "This file is no longer in a served folder; Save is not offered until its folder is served again." for the unserved tab, "Update links in Markdown files" as the preview's title; (g) the 68 marks on paths in `.agents/skills/*` that do not exist in the hub stay.
- Not chosen: links only, backticked paths left stale after a move (the lazy option, against item 4 treating them as links); the coauthor tier unchecked (the lazy option); document links and definition only, which still changes the Outline (the server is asked for symbols whatever is declared) and drops what ruling 23 (a) listed as its gain; a new sentence of oculus's for backticked marks beside the server's; the vendored skills' paths exempted, which hides a fact.

Where it applies: D41. Booked in `plan.md` Rulings, D41's Step 0 and `agents/reviews/D41-brief-check.md` ("Closed"). G3's wording is open item 24, for Axel.

## Z742 (2026-10-09, step D40, the orchestrator, automode): the choices of D40's brief

- Chosen: C1 (a), the linter's id `writing`, its name "Writing rules", owner `lint-writing`; C2 (a), every row a warning, with the codes `em-dash`, `en-dash`, `curly-quote`, `ellipsis`, `arrow`, `nbsp` and `wrapped-paragraph`; C3 (a), an em dash or a spaced en dash gets comma, colon and semicolon suggestions and no automatic fix, so Fix All never writes wrong punctuation; C5 (a), three settings, `lint.writing` (on or off), `lint.writing_skip` (files not read, defaulting to the remove-unicode skill's exempt list) and `lint.writing_glyphs` (files where arrows are icons, defaulting to its glyph surfaces); C6 (a), the comments of Python, TypeScript, JavaScript, Svelte, shell, CSS, SCSS, C, C++, Lua and LaTeX, Python docstrings counted.
- Not chosen: the names `ascii` (wrong for wrapped paragraphs) and `prose` (comments and YAML are not prose); paragraphs as info; every row as info (the lazy option, it hides the marks); a `, ` fix Fix All applies (writes "ENW, XS"); a mark with no fix (the lazy option, against the plan line); one key with the lists in code (the lazy option, hub paths in code); one skip list covering the glyph surfaces (would leave an em dash in a `project.yml` unmarked); only D36's languages (the lazy option); docstrings not counted (the hub's only banned characters in Python are in one).

Where it applies: D40. Booked in `plan.md` Rulings and D40's Step 0 and brief. C4 is open item 18 and C7 open item 19, both for Axel.

## Z741 (2026-10-09, step D39, the orchestrator, automode): where a rename's refusal shows, and D39's first review

- Chosen: a refusal that does not depend on the new name is given at `prepareRename` and shows at the caret, and every such check of the rename plan (a file over the write limit or not text, a private folder, unsaved text in another window, a key shared by two sources, from its reference or its definition) moves to the prepare answer; a refusal that depends on the new name is given at `rename` and shows as a notice, where Monaco 0.57 and VS Code put a rename-time reason. This absorbs a premise Z735 got wrong: VS Code shows a rename-time refusal as a notification, and Monaco's rename sends it to the notification service. The rest of D39's first review goes back as repair round 1 (`agents/briefs/D39-round1.md`), with new sentences for a refusal with no words, a closed file over 5 MB and a closed file that is not text.
- Not chosen: every refusal at the caret through Monaco's message controller, which departs from VS Code and reaches into an editor contribution Monaco does not export as API; every rename-time refusal left as a notice with no check moved to the prepare answer, as built (the lazy option); a closed file the page cannot read reported in the report with the generic "could not be made" sentence kept (the lazy option).

Where it applies: D39. Booked in `plan.md` Rulings and `agents/briefs/D39-round1.md`.

## Z740 (2026-10-08, step D36, the orchestrator, automode): the ESLint approval per configuration file, and D36's first review

- Chosen: the ESLint approval and the held ESLint process are per configuration folder: the key is over the folder and the one `eslint.config.*` the process loads with `overrideConfigFile`, so the approval names exactly the code that runs, a nested configuration that was never approved is never loaded, and no lint walks the repository for every configuration file; `DESIGN.md:166`, `docs/files-and-search.md` and the `:eslint-config` list say so. The lint route's body carries an `action` (`lint`, `stop`, `config`, `approve`, `revoke`) and an approval carries the key the reader was shown, so an approval made after the file changed approves nothing; a lint answer carries the hash of the bytes its rows were read from. Sent back as repair round 1: a linter with no answer draws no item; a documentation address is opened only as an `http:` or `https:` address; Fix All is disabled while the tab's text is not the linted text; the hung-child end and the switch-off end get their test rows; the comments, the negation-contrast and the docs' switch values are fixed.
- Not chosen: one key per repository over all its configuration files, as the brief worded it, which approves configurations the process never loads and makes a nested one wait on an unrelated change; removing the `lint.eslint` switch-off from G36's text instead of testing it, and deleting the unused hung-child fixture instead of testing the end it guards (both the lazy option).

Where it applies: D36. Booked in `plan.md` Rulings and `agents/briefs/D36-round1.md`.

## Z739 (2026-10-08, step D39, the orchestrator, automode): the choices of D39's premise recheck on main at a60dcb4fa, all but the closed paths

- Chosen: `diskName` is replaced in `hub-names.ts` by one function that says whether two names are one disk file from the served roots' real folders, used by the unsaved-text refusal, the page's edit plan and the YAML hook; while the page has not read its roots it falls back to the present prefix rule, which errs toward refusing; each side joins its root's real folder with the path, so a file reached through a symlinked folder inside a root counts as another file; a rename writes the new key through the one scalar writer `renderScalar`, so `123` or `null` as a new key is written quoted instead of refused; the function's test is a table in `tests/data/helpers/hub-names.test.ts`.
- Not chosen: a second comparison beside `diskName` (the lazy option); comparing by root and path alone while the roots load; the server's resolved path on one side and the join on the other; a second scalar writer; no test of the function.

Where it applies: D39. Booked in `plan.md` Rulings and D39's Step 0. The closed paths of a language server's edit are open item 16 for Axel.

## Z738 (2026-10-08, step D36, the orchestrator, automode): the choices of D36's premise recheck on main at a60dcb4fa

- Chosen: a `lint.chktex_path`, `lint.ruff_path` or `lint.shellcheck_path` value is read as `latex.texlab_path` reads its value: empty finds the program on PATH, otherwise an absolute path or one starting with `~`, and a named path that cannot be used shows `not_found` naming the path, with no PATH fallback; the status tooltips say "name its absolute path, or one starting with ~, in lint.<linter>_path". The held ESLint processes follow the served roots through the language servers' one follower and end at once when `lint.eslint` is switched off. The comment at `relay.ts:23-25` says texlab sends no ChkTeX rows. The approval key functions take the key kind, so D43's `latexmkrc:` copy is folded into them.
- Not chosen: the path handed to the program runner as written, as the older `latex.<tool>_path` keys do (the lazy option; a relative path would depend on where the server runs); a fallback to PATH, which runs another program than the one named; ESLint processes left to the 15-minute idle after their root leaves or the switch goes off; the comment left as it reads; a third copy of the key functions.

Where it applies: D36. Booked in `plan.md` Rulings, D36's step line and Step 0, the brief's "Rulings on the choices" and the closed log of `orchestrator-history.md`.

## Z737 (2026-10-08, step D43, the orchestrator, automode): the review over D43's repair round 1, closed at landing

- Chosen: the LaTeX status item counts the waiting main files of the followed main's own folder (the same served root and folder path); a Rerun or Restart of a LaTeX build or clean terminal whose task mark names no folder takes the folder from the served root holding the terminal's working folder, and one whose mark names no step and main file is refused with a new word `latex-unmarked` and the sentence "This LaTeX terminal does not record its main file and folder, so what it would run cannot be checked; press Build or Clean of its main file to run it again."; a Rerun of a file that is no longer a main is refused `not-a-main`, as Build is; the clean held before a retry is let go when a later build of that main succeeds; G55 is written with the widening open item 14 ruled, without the report's added clause about Rerun, which the widened sentence already covers, and the case-32 route row is filed under G31.
- Not chosen: the served root as the item's scope, which would show on a hub tab a build waiting in any project; old terminals left ungated on Rerun (the lazy option, and a gap in G55); the owed retry kept after a success, which cleans a good build's files and forces a rebuild nobody asked for.

Where it applies: D43. Booked in `plan.md` Rulings, the closed log of `orchestrator-history.md` and `agents/reviews/D43-refuter.md`, Closed.

## Z736 (2026-10-08, step D43, the orchestrator, automode): D43's first review, what was not sent back

- Chosen: the body of `approve-latex` carries `step`, `recipe` and `last` beside the brief's `target`, `main` and `texts`, so the server recomputes the same step and texts it showed; case 24 reads "`\alph` offers `\upalpha` and `\mitalpha` with their glyphs", since the unimath data has no `alpha` row; with no root followed, the status item reads the entry that has waited longest.
- Not chosen: a body of `target`, `main` and `texts` alone, which cannot name the recipe a weave text came from; case 24 as written, which no data can meet; the entry that waited least long.

Where it applies: D43. Booked in `plan.md` Rulings and the closed log of `orchestrator-history.md`.

## Z735 (2026-10-08, step D39, the orchestrator, automode): the choices of D39's brief check

- Chosen: the deck schema's attribute for a map of records is `map: true`; a rename refusal travels as the error's message and shows at the caret, where VS Code shows a language client's refusal, and a null `prepareRename` from any server gives VS Code's "The element can't be renamed."; the options catalog's vocabulary fields (`project_types`, `status_chips`, `entry_statuses`, `slide_tags`) are references, so Find References on `manuscript` lists `sources.yml`'s scan type; D39 is prepared after M6 and D43 land, since D43 also splits `transport.ts` and changes the relay's constructor.
- Not chosen: the word `keyed`, which two other schema readers use for other things; the refusal as a tab notice, which VS Code does not do; vocabulary references from the hub fields only (the lazy option); D39 in flight beside D43.

Where it applies: D39. Booked in `plan.md` Rulings, D39's step line and the closed log of `orchestrator-history.md`. Open item 15, ruled (a) by Axel, holds the guarded entries.

## Z734 (2026-10-08, step D43, the orchestrator, automode): which recipe tools ask for a weave approval

- Chosen: every recipe tool whose program is not a TeX program (latexmk, latex, pdflatex, xelatex, lualatex, bibtex, biber, makeindex, makeglossaries, tectonic) asks once per repository, folder and tools, so `R CMD Sweave`, `python -m pweave`, `quarto` or any program a reader adds is approved before it runs a document's code; the status tip reads 'An automatic build or clean of {0} waits for your approval of the code it would run. Press to see it.'
- Not chosen: Z732 O2's three names `Rscript`, `julia` and `pweave` alone, which would run any other weave program unasked (the lazy option); a tip that names only latexmk's files.

Where it applies: D43. Booked in `plan.md` Rulings, D43's step line and the closed log of `orchestrator-history.md`.

## Z733 (2026-10-08, step D36, the orchestrator, automode): the linters' on and off keys, and D36's order

- Chosen: each `lint.<linter>` key of `behavior.yml` is `true` or `false` with `control: toggle`, as the 22 toggles of `options.yml`; D36 runs after D43, since both rewrite the same lines of `recipes.ts` and that merge is not simple.
- Not chosen: `on` and `off`, which no key of oculus's config uses and which a YAML 1.1 reader takes as booleans; D36 and D43 in flight at once.

Where it applies: D36 (and D43's order). Booked in `plan.md` Rulings, D36's step line and the closed log of `orchestrator-history.md`.

## Z732 (2026-10-08, step D43, the orchestrator, automode): the choices of D43's brief

- Chosen: the words the brief gives for texlab's status items, the not-found tip with its install command, the two LaTeX commands, the three options' help, the latexmkrc and weave approval ask and the waiting status item; a weave recipe approved under the `command:` kind with a `weave` member (repository, main folder, the recipe's tools as written), a weave step being one whose program is Rscript, julia or pweave, and an automatic build waiting on it as on a latexmkrc; the 2415 Unicode math symbols as a catalog file `config/catalogs/unimath.yml` pushed with the other catalogs, its byte cost measured in the report.
- Not chosen: the generic not-found sentence, leaving the weave recipes unasked, a fifth approval kind, a separate route for the symbols, the symbols inside `latex.yml` (the lazy options).

Where it applies: D43. Booked in `plan.md` Rulings, D43's step line and the closed log of `orchestrator-history.md`. Open item 14 holds the guarded entries.

## Z731 (2026-10-08, step M6, the orchestrator, automode): the choices of M6's brief

- Chosen: one exported identity rule in `validate.ts`, run per collection and by `leads()` over the whole leads file, closed leads included; a written field of a type Z724 did not name takes null, `textarea` `""`; every control that writes a file Add or Edit opens is disabled while a source tab holds unsaved text of that file, and every other write (manifests, career, radar, decks, config, memories, audit mutes, deposits, History's undo) is refused in the client's write path before it is sent, with the sentence "<file> has unsaved text in a tab; save or revert it first"; the new keys' words as the brief gives them.
- Not chosen: checking the live leads alone, `""` for every type, the listed controls alone, and booking the other writers as a step of their own (the lazy options).

Where it applies: M6. Booked in `plan.md` Rulings, M6's step line and the closed log of `orchestrator-history.md`. Open item 13 holds the test of the write-path refusal.

## Z730 (2026-10-08, step D39, the orchestrator, automode): the choices of D39's brief

- Chosen: the rename box's preview key Cmd+Enter (Ctrl+Enter off macOS), VS Code's and Monaco's own binding, in place of the Shift+Enter Z725 named; a new schema attribute `keyed: true` on a `records` field, so the deck groups' `slides` carry `from: projects`; the Refactor Preview as an unlisted view `refactor-preview` opened when a preview is asked, with VS Code's words and oculus's refusal sentences; References rows and Go to Definition opening with the whole range the server named, so a hyphenated key is selected whole; `lsp-edit` refusing a path under a `closed_paths` folder (`secrets`), a fix of D23b's delivered work.
- Not chosen: Shift+Enter, a code rule for the deck, a listed view taking chord s9, a YAML word pattern that changes double-click, leaving hyphenated keys half-selected, leaving the secrets gap (the lazy options).

Where it applies: D39. Booked in `plan.md` Rulings, D39's step line and the closed log of `orchestrator-history.md`.

## Z729 (2026-10-08, step D36, the orchestrator, automode): the choices of D36's brief

- Chosen: ChkTeX, ruff and ShellCheck run as one process per lint, ESLint held per repository in a child process of oculus's own (one file in 7 to 17 s through the CLI); the repository's ESLint runs only after an `eslint-config:` approval made in the palette list `:eslint-config`; a `lint:` block in `behavior.yml` (each linter on or off, its path, ChkTeX's arguments); a lint on save and when a clean tab opens; each linter's quick fix, a disable comment, the rule's documentation and Fix All; one status item per linter saying not found, failed, timed out or not approved; files chosen by extension (no `.zsh`, `.bib`, `.sty`; `.slurm` by ShellCheck; JavaScript by ESLint); no new dependency, and ShellCheck installed with brew before the look.
- Not chosen: ESLint through its CLI on every save, ESLint with no approval, no settings, a lint on save only, marks with no fixes, nothing shown for a missing linter, the language map's file sets, eslint_d (the lazy options); the linters as language servers, which needs two servers per language in the relay and an unmaintained ESLint server.

Where it applies: D36. Booked in `plan.md` Rulings, D36's step line and the closed log of `orchestrator-history.md`.

## Z726 (2026-10-08, step D43, the orchestrator, automode): the choices of D43's third premise recheck

- Chosen: texlab started without `latexmk` on its PATH so it never runs a latexmkrc, the latexmkrc approval kept on the build and clean steps; a weave recipe asking once per repository, folder and tools; `brew install texlab` by the orchestrator before the look; an automatic build that waits on an unapproved latexmkrc, shown on the LaTeX status item, and a pressed build that asks.
- Not chosen: an approval before texlab starts with a watcher, which texlab's own watcher outruns; changes after start ignored, weave recipes left out, a look without texlab, a silent skip (the lazy options).

Where it applies: D43; it replaces Z703 (U3)'s approval before texlab starts. Booked in `plan.md` Rulings, D43's step line and the closed log of `orchestrator-history.md`.

## Z725 (2026-10-08, step D39, the orchestrator, automode): the choices of D39's premise survey

- Chosen: hub-key definition, references and rename answered by the YAML server entry through a relay hook, from an index built with the snapshot and overlaid with open tabs; every reference declared in a schema, `waiting-on`, the deck groups and the engine's two keys included; vocabulary values navigable and their rename refused; a project id's rename refused and left to M7's folder move, D39 queued before M7; a Refactor Preview as VS Code's; the rename copy limit raised to the delete limit so the literature radar can be renamed in.
- Not chosen: page-side providers over a new route; the 17 schema fields alone, which leave broken values; no navigation for vocabulary values; ids renamed with their folders left; a Confirm with counts; the radar refused; a disk read per request without the open tabs (each the lazy option of its choice).

Where it applies: D39, M7's order. Booked in `plan.md` Rulings, D39's step line and the closed log of `orchestrator-history.md`.

## Z724 (2026-10-08, step M6, the orchestrator, automode): the choices of M6's third premise recheck

- Chosen: every control that writes a file disabled while a source tab on this browser page holds unsaved text of it; Edit's caret through D33's range when an empty range places a caret, otherwise the placement flag; `""` for a text field and an empty value for a `select` with `from` or a `date`; D33's `asked` nonce reused.
- Not chosen: the three in-place controls alone, or the current workbench page alone (the lazy options); `""` for every field, which marks the first Add on Joint work wrong.

Where it applies: M6. Booked in `plan.md` Rulings, M6's step line and the closed log of `orchestrator-history.md`.

## Z723 (2026-10-08, step D33, the orchestrator, automode): a removed served root and the rows of a nested repository

- Chosen: a command row goes when its repository lies under no served root, and the LaTeX store forgets the targets and diagnostics of a root that is no longer served; fixed at D33's landing.
- Not chosen: rows dropped when their repository is not itself a served root, which removes a nested git repository's live rows; a filter at the problem lists that leaves the dead entries in the stores (the lazy option).

Where it applies: D33. Booked in `plan.md` Rulings, D33's step line and the closed log of `orchestrator-history.md`.

## Z722 (2026-10-08, step M6, the orchestrator, automode): the eight choices of M6's second premise recheck

- Chosen: the Leads view stops sending `lead-add`, which stays a write kind apps may send; the existing identity check extended to empty identities, venues' `id` and the leads feed; M6's stub built on M8's schema format, M8 having landed; a card's in-place controls disabled while a source tab holds unsaved text of the same file; Edit's caret just after `<key>: `; every open of a source file stamped so a second press goes there again; the Literature search's add form kept.
- Not chosen: `lead-add` retired from the apps API (a breaking change to a published shape); two new finding keys beside the existing identity check; an in-place write left to meet the save conflict, where Overwrite would erase it (the lazy option); the caret at the line alone (the lazy option); the second press fixed for M6's callers only (the lazy option); the radar file opened with a stub in place of the add form, which loses the hit's prefill.

Where it applies: M6. Booked in `plan.md` Rulings, M6's step line and the closed log of `orchestrator-history.md`.

## Z719 (2026-10-08, step M6, the orchestrator, automode): the desktop app's EPIPE crash folded into M6

- Chosen: M6, the next step to be prepared, drops a write to a closed output in `src/desktop/app.ts`'s `print` and makes `tests/server/desktop/app-harness.ts` end its Electron when the process that started it ends.
- Not chosen: the fix left to the paused R2 or O35, so it waits for Axel's unpause; a note with no step (the lazy option).

Where it applies: M6 (`plan.md`, M6's "Widened 2026-10-08" line). Booked in `plan.md` Rulings and the closed log of `orchestrator-history.md`.

## Z718 (2026-10-08, step D33, the orchestrator, automode): the brief check's choices

- Chosen: Copy copies a Problems row as VS Code's tab-indented JSON; the filter splits terms on commas, a term with a glob character is a path glob, a malformed glob matches literally; "filtered to the root" is a root-key scope drawn as a removable chip; F8 walks the whole problem list whatever a view's filter; a second single press on a preview tab's file keeps the preview and goes to the new place; a reload does not go to an opened place again (`wentTo` saved with the tab), a press after it does; Enter on a Settings card moves into its first field without changing it; the status counts read as VS Code's (1500 is `1K`, 9999 is `9K`); Q118's Audit cases restored whole.
- Not chosen: a path-text filter for the root; F8 following a view's filter; `Intl.NumberFormat`'s `1.5K`; Q118's cases dropped (the lazy option); Monaco's F8 left bound beside the walk (the lazy option).

Where it applies: D33, written into its brief before dispatch (`agents/briefs/D33.md`, "Closed"). Booked in `plan.md` Rulings and the closed log of `orchestrator-history.md`.

## Z717 (2026-10-08, step M8, the orchestrator, automode): a builder's case handed back, the worktree missing `deck/`

- Chosen: the worktree paths of `.agents/plan.yaml` and the state file gain `deck` (the portfolio deck `config/sources.yml:24` names) and the hub's `docs`; M8's worktree and base copy gain `deck/`, and the builder resumes with G14's gate unchanged.
- Not chosen: the deck finding and the portfolio-deck test accepted as the build's baseline (the lazy option).

Where it applies: M8 (`agents/briefs/M8-cases.md`) and every worktree made from now on. Booked in `plan.md` Rulings and the closed log of `orchestrator-history.md`.

## Z716 (2026-10-08, step D33, the orchestrator, automode): the choices of D33's third premise recheck

- Chosen: (N1) a single press on a Problems row opens the file in the preview tab and keeps the keyboard in the view; Enter or a double press opens a kept tab with the keyboard in the editor, as VS Code. (N2) D33 builds the one way to go to a place again: `openSourceFile` stamps a fresh `asked` value on every open, the source editor's go-to effect runs once per `asked` in place of once per line and column, and the end line and end column travel in the same tab state; M6, prepared after D33 and M8 land, uses that value and adds none of its own. (N3) Open Editors rows and file tabs draw the problem colour and count as the Files tree does, as VS Code's `workbench.editor.decorations.colors` and `.badges` defaults. (N4) each Settings card gets a card id unique in its pane, built from the file, the option key and its index path; Enter moves the keyboard into the card's first field. (Library) picomatch 4.0.7 as a direct dependency for the filter box's globs and `!` exclusions.
- Not chosen: every press opening a kept tab; D33 waiting for M6, or a second go-again mechanism beside M6's; decorations on the Files tree alone (the lazy option); the colliding card ids left (the lazy option); minimatch; a filter with no globs (the lazy option); a repeated press doing nothing (the lazy option).

Where it applies: D33, written into its brief before dispatch; M6's brief at its next /spec. Booked in `plan.md` Rulings and the closed log of `orchestrator-history.md`.

## Z715 (2026-10-08, step M8, the orchestrator, automode): a top-level key other than `languages` in a repository's `.oculus/settings.yml`

- Chosen: the generated schema declares only `languages`, so the editor marks any other top-level key (an `editor:` block, for one); `parseRepoSettings` names such a key as a skipped entry under the Settings view's Languages row, and `docs/files-and-search.md` says so, as Z701 (6) asks of a field no schema declares.
- Not chosen: the schema marking the key while the reader stays silent, two rules for one file; the top level left open, the key neither marked nor listed (the lazy option).

Where it applies: M8, written into its brief before dispatch. Booked in `plan.md` Rulings and the closed log of `orchestrator-history.md`.

## Z714 (2026-10-08, step D28, the orchestrator, automode): the brief check's choices

- Chosen: the conflict compare as VS Code's, the source tab's own text editable on the right; each open-file poll checks the path is still inside the roots before reading; a dropped tab unsubscribes its file's channel on the wire and the server stops the poll; files over 2 MB signalled by their stat, at most 200 open-file channels per page; restored drafts keep their base; saves of one tab queued; the language-server edit refuses a NUL anywhere; autosave over every writable file; a 130-byte file drawn within 300 ms.
- Not chosen: a read-only snapshot for Compare; polls living until the page closes; reading a growing log every half second; no bound on a page's channels (the lazy options).

Where it applies: D28, written into its brief before dispatch. Booked in `plan.md` Rulings and the closed log of `orchestrator-history.md`.

## Z713 (2026-10-08, step D28, the orchestrator, automode): the change on disk, the deleted mark, the save's order, Revert File and the conflict pane

- Chosen: the open-file channel polled every 500 ms stays (the `files` channel now covers every root but is up to 2 s late and names folders); a source tab's deleted state feeds the struck-through tab label X3e built; the trim runs before the format and the final newline after it, an `after_delay` save never formats, as VS Code; Revert File always reads the file again; the conflict pane's side word is `unsaved@<id>`.
- Not chosen: the `files` channel with a hash read per tab; the label left on the folder listing alone; automatic saves never formatting; two Reverts with different results (the lazy options); reusing Compare Selected's pane shape.

Where it applies: D28, written into its brief before dispatch. Booked in `plan.md` Rulings and the closed log of `orchestrator-history.md`.

## Z712 (2026-10-08, step M8, the orchestrator, automode): the schemas of the new oculus files, how they reach the YAML server, and the event roles' text

- Chosen: `.oculus/commands.yml` and D11's `.oculus/launch.yml` get JSON Schemas generated from their readers' own zod shapes, one definition per file; the schemas leave the snapshot build through a callback of the portfolio watcher to the language server relay, so nothing new goes over the socket; `network/events.yml`'s header comment and intro name the new role `co-present`.
- Not chosen: hand-written schemas beside zod readers; the schemas in the `portfolio` payload sent to every page; `launch.yml` checked for syntax only and the events text left incomplete (the lazy options).

Where it applies: M8, prepared after D28 lands. Booked in `plan.md` Rulings and M8's Step 0, and the closed log of `orchestrator-history.md`.

## Z711 (2026-10-07, step X3e, the orchestrator, automode): the head pill on HEAD's graph row

- Chosen: the head pill names the checked-out branch, and carries the short hash only while HEAD is detached, so the branch HEAD is on is read on its row without a tooltip, as in VS Code's graph.
- Not chosen: D9 as written (the short hash always, the branch name grouped as a glyph with its name in a tooltip), stated in the report; it hides the one branch a reader most needs on that row, and keeping it would be the lazy option.

Where it applies: X3e, sent in its round 1. Booked in `plan.md` Rulings, the state file's closed log and `orchestrator-history.md`.

## Z709 (2026-10-07, step D15, the orchestrator, automode): which viewer takes a place another page wrote

- Chosen: only a viewer whose box was hidden when `open` runs again goes to the place in the tab's record that it did not send, which is the tab returning from a window; a viewer in view keeps its own place. Two oculus pages that share one arrangement no longer move each other's PDF when a pane is split or a rail page switched.
- Not chosen: (a) every viewer goes to the record's place, as round 1 built it, and the report states the jump; it leaves a PDF the reader is looking at jumping to another browser tab's page on a redraw. It is the lazy option, since it states the defect instead of fixing it.

Where it applies: D15, fixed at its landing. Booked in the state file's closed log and `plan.md` Rulings.

## Z706 (2026-10-07, step M8, the orchestrator, automode): how the hub's YAML reaches the editor, and the brief check's other choices

- Chosen: the schemas come to the YAML server from the same snapshot build the hub's validation uses, so M8 waits for X3e and D11 to make room in the server's start file; oculus answers which schema each file gets; the YAML server cannot read any file on disk outside oculus's packages; oculus's own catalogs, text files, `.oculus/settings.yml` and apps' `app.yml` are checked through their own readers; career's sections are `type: records`; `suggest_from` and `values_by` become forms of `from:`; the help line is `help` in the code as in the files; the moved manifest schema stays listed in Settings; the hub's existing accented names and glyphs stay; the YAML server's own words in the editor, as pyright's; integer years, career's free keys and the radar's `new-idea-candidate` pass.
- Not chosen: a second reader of the hub in the adapter, globs handed to the server, the disk left readable, hand-written JSON Schemas, a second meaning for `metalist`, two more reference keys, a half rename, settings and app files left unchecked (the lazy options).

## Z705 (2026-10-07, step X3e, the orchestrator, automode): the Files view's choices left by the fourth recheck

- Chosen: HEAD's graph mark keeps the target icon as VS Code's; an empty folder list in a files notice concerns nothing; the repository scan walks folders in oculus's own code; the server's start file split by moving the git watcher's start beside the watcher; the desktop folder sheet stops waiting when its page goes; the palette hints of the language-server commands in the text catalog; a LaTeX build follows the folders of its inputs; the delete measurement awaits the listing; hidden sections keep their place in the order.
- Not chosen: a second icon for HEAD, an empty list read as the whole root, the fdir library, the hints kept in code (the lazy option).

## Z704 (2026-10-07, step D11, the orchestrator, automode): the rite debugger's places, approval, framing and keys

- Chosen: Debug and Debug Console after the TeX view (s6, s7), no shipped chord moved; a debug launch approved as a `command`; a short HELP section and a Debugging guide; the debug messages framed by the library the language servers already use; `~/` read as the home folder in `rite_dap_bin`; a guarded test that a debug launch runs only after approval; a frame outside the roots listed but not opened; the debug keys reach the debugger even from a terminal; breakpoints shared across tabs.
- Not chosen: the brief's clashing order, everything in HELP.md, a second hand-written framing parser, `~` failing, no test (the lazy options).

## Z703 (2026-10-07, step D43, the orchestrator, automode): texlab, and a repository's latexmkrc

- Chosen: texlab and the LaTeX build both wait for an approval of a repository's latexmkrc (Perl that latexmk runs), as the Svelte config does; `brew install texlab` named when it is missing; a `latex.texlab_path` key; `.bib` files get their own language; keys for the unicode-math symbols (off) and the picture preview (on); every texlab feature except formatting, build and forward search; each build error shown once; the Outline keeps its headings while texlab is missing.
- Not chosen: running latexmkrc unapproved, PATH only, `.bib` as LaTeX, the four features of the step text only (the lazy options).

## Z702 (2026-10-07, step D33, the orchestrator, automode): the Problems view

- Chosen: Problems in the Explorer group after the TeX view and the debug views (s8) so no chord moves, Cmd+Shift+M; VS Code's fixed defaults stated in the guide; its own status item; a press selects the whole range (after D28); command errors as editor marks; Files decorations as VS Code's; outside and library rows listed; `source(code)`; the TeX view's own Problems list removed in favour of the view; the Settings cards get the cursor; F8 across files; no guarded entry; per page.
- Not chosen: moving the TeX view's chord, no key, one joined count, the column only, no marks, D45's three lists kept (the lazy options among them).

## Z701 (2026-10-07, step M8, the orchestrator, automode): how the hub's YAML is checked in the editor

- Chosen: references name the registries as the code already does (`people`, `venues`, ..., `projects`, `vocab.<key>`); every YAML tab gets the YAML server, with a schema where its path matches; a co-author's talk is the event role `co-present`; the YAML server never formats a file; `snooze` and `subtasks`, which oculus writes, are allowed everywhere; an unknown field is marked; `.oculus/commands.yml` and oculus's own catalogs and text files get schemas too; the schemas move to a new `config/schemas/` folder; `redownload.py` handles `direct`, `script` and `url`; a key that exists twice in a registry is a finding.
- Not chosen: unresolved names, formatting hub files on save, marking oculus's own fields, letting typos through, only the files the ruling lists (the lazy options).

## Z700 (2026-10-07, step D15, the orchestrator, automode): where a PDF's place is kept

- Chosen: each PDF tab keeps its place (page, offset, zoom, scroll and spread, side panel) across a reload and a new window, and a PDF opened again starts where it was last read, for the last 50 files; the cockpit's deck is left alone under your Z650 and oculus's own equation card is looked at and fixed instead; Restore panes on a document is looked at first and fixed only if it still reloads.
- Not chosen: a place kept per tab only, which a reopen loses; the page alone without the zoom and layout; M4 dropped with no look (the lazy options).

## Z698 (2026-10-07, step D45, the orchestrator, automode): three choices of the second LaTeX repair round

- Chosen: the server tells every page how the last build of a main file ended (a new field on the LaTeX answer), so a page that did not start a build still knows not to show a failed PDF; a page in the desktop app holds the same lock a browser page does, so a PDF window can tell when the page that opened it has closed; a PDF window whose tab closed is freed after about 10 to 20 seconds rather than at once, so a reload of that tab keeps it.
- Not chosen: each page judging only the builds it started itself, a new message between the desktop app and the page for a closed owner, and freeing the window at once (the lazy options).

## Z696 (2026-10-07, step D45, the orchestrator, automode): a second repair round for LaTeX

- Chosen: one more repair round, since a failed build still replaces a PDF window's document, one save can start several LaTeX builds in one folder, a Cmd+click in the desktop window can raise the wrong window, and the status item hides during a build; the fixes are too large to make at landing.
- Not chosen: landing it with those defects booked for later (the lazy option).

## Z695 (2026-10-07, step D45, the orchestrator, automode): three choices of the LaTeX repair

- Chosen: a PDF window whose ChromeTab is missing waits up to 10 seconds, then comes back into the main page as a free float; a duplicated ChromeTab of oculus gets its own identity, so a Cmd+click in a PDF window opens the source in the right page; a PDF window shows notices, so a jump that fails says so.
- Not chosen: the old behaviour that closed a PDF ChromeTab at once, two pages sharing one identity, or failures nobody sees (the lazy options).

## Z694 (2026-10-07, step D23b, the orchestrator, automode): a second repair round for the language features

- Chosen: one more repair round, since a rename can still corrupt a second tab of the same file or wrongly refuse a C header or `.js` tab, and the fix is too large to make at landing.
- Not chosen: landing it with those defects booked for later (the lazy option).

## Z693 (2026-10-07, step D23b, the orchestrator, automode): three choices of the language-features repair

- Chosen: the refusal of an edit to a file open in another oculus page keeps its automatic test, since without it one page's save can overwrite the other's; a file named twice in one edit gets the existing "could not be made" notice; an approval of a Svelte config that changed since you looked approves nothing and shows the new text.
- Not chosen: relying on one live run for the two-page refusal (the lazy option); new notice words for the other two.

## Z692 (2026-10-07, step D23b, the orchestrator, automode): the Svelte plugin of the TypeScript server

- Chosen: the plugin that lets a rename in a `.ts` file reach the `.svelte` files is loaded only after the repository's Svelte config is approved, since it loads the repository's own Svelte, which oculus never runs unapproved; the tooltip and the docs say so.
- Not chosen: loading it always (it would run the repository's code unapproved), or patching the plugin.

## Z691 (2026-10-07, step D23b, the orchestrator, automode): hierarchy items a server does not offer

- Chosen: Show Call Hierarchy and Show Type Hierarchy are left out of the editor's right-click menu and the palette when the file's language server cannot answer them, as VS Code does.
- Not chosen: greyed-out items, which VS Code does not show.

## Z690 (2026-10-07, step D45, the orchestrator, automode): LaTeX hovers, two extras, the status item's reads

- Chosen: both hovers kept where oculus's LaTeX support and the texlab language server each answer, since they show different things; the picture preview while typing `\includegraphics` and the Unicode math symbol completion built with texlab (D43), the symbols off by default as LaTeX Workshop ships them; the status bar's LaTeX item allowed to read the build and the file's root.
- Not chosen: dropping one hover, or leaving the two extras unbuilt (the lazy options).

## Z689 (2026-10-07, step PR4, the orchestrator, automode): Presenter pressed again during a talk

- Chosen: in the oculus desktop window, pressing Presenter again reloads the audience window only when it shows that the presentation ended; during a live talk it only brings the window forward.
- Not chosen: reloading the projector's page on every press, which flashes the slide and drops full screen (the lazy option).

## Z688 (2026-10-07, step PR4, the orchestrator, automode): the audience window after a reload

- Chosen: in the oculus desktop window, pressing Presenter again always brings back a live audience window, even after the presenter screen was reloaded; reloading the audience window itself keeps the talk going, and only closing it ends the presentation.
- Not chosen: leaving the projector stuck on "The presenter screen has ended." after a reload, or a reload of the audience window ending the talk (the lazy options).

## Z687 (2026-10-07, step D23b, the orchestrator, automode): Organize Imports

- Chosen: Organize Imports made to work for every language server that offers it; today it never reaches pyright or clangd, because the editor's built-in client does not ask for it.
- Not chosen: leaving it as it is (the lazy option), which leaves the command dead in every language.

## Z686 (2026-10-07, step D23b, the orchestrator, automode): the TypeScript and Svelte servers and the cross-file edit

- Chosen: the Svelte server runs at once in its safe mode and gets its full features only after you approve the repository's Svelte and Vite config files, asked again when they change; a new guarded rule that no repository code runs before that approval, with its test; renames in TypeScript reach the `.svelte` files through the Svelte team's TypeScript plugin; no background `npm` installs and no server logs in repositories; one shared list of what each server offers; History names an edit made by a language server, in the singular for one file.
- Not chosen: keeping the approval per folder, no test for it, splitting the step, renames that miss `.svelte` files (the lazy options).

## Z685 (2026-10-07, step PR4, the orchestrator, automode): how the presenter screen holds up

- Chosen: presenting survives switching tabs and pages and ends only on End, Esc, closing the audience window or the tab; the audience window notices the presenter page has gone at once, not by a timer, so a hidden presenter never ends the talk; one presenter per deck, a second Presenter press takes the audience over; switching deck ends the presentation; in the desktop app the audience window fills its display without blanking the others, is not opened twice, closes with the window that opened it, gets full screen, and Close Window closes it; P is named on the Presenter control and the first-slide hint, never on the projector; a click on the current slide moves on.
- Not chosen: the state kept only in the view (a page switch would end the talk), the 5-second silence rule, native full screen, leaving the desktop app's half to the landing look (the lazy options).

## Z684 (2026-10-07, step X3e, the orchestrator, automode): eight choices in the Files lists step

- Chosen: the desktop app's folder sheet ends when the page goes away, with its own test; the C++ AST and memory sections can be dragged like the other Files sections; every reader of the file-change notice skips folder-only changes; apps get the new fields and their guide says so; palette descriptions with no new file; refusal sentences keep their no-full-stop form; a folder that was missing is watched once it appears; the guide text goes to the `docs/` pages.
- Not chosen: the lazy versions of each (the AST and memory sections fixed, three readers only, the apps guide left wrong, the palette file squeezed, a missing folder never watched, `HELP.md` only).

## Z683 (2026-10-07, step D45, the orchestrator, automode): the PDF's new window, the SyncTeX click, LaTeX with texlab, Preview

- Chosen: Open in New Window gives a window holding the PDF tab alone (no rail, no status bar), in the desktop app and as a new ChromeTab; inverse search is Cmd or Ctrl and a click (or a double click, a setting), so a plain click still selects text; D45's LaTeX features stay on when texlab later serves the file; a PDF opens in Preview through the existing Open in Program item, `.pdf` mapped to Preview in the shipped config.
- Not chosen: opening the main page with the PDF tab active, or leaving the LaTeX and texlab overlap to whichever step finds it (the lazy options); a full workbench in the new ChromeTab; a plain click for inverse search.

## Z682 (2026-10-07, step D23b, the orchestrator, automode): rename, cross-file edits, symbols, hierarchies, TypeScript and Svelte

- Chosen: a language server's edit of files no tab holds is written to disk as one undoable change in History, open tabs edited unsaved; refused whole when another page has one of the files open, or it touches a library file, a file outside the roots, or creates, renames or deletes a file; F2 rename from every server; workspace symbols under `#` and Cmd+T in the palette; call and type hierarchy in the References view (Shift+Alt+H); the TypeScript server on oculus's own TypeScript; the Svelte server only after you approve running the repository's Svelte, as for pyright's interpreter.
- Not chosen: rename and cross-file actions left refused, or the TypeScript server on a repository's own TypeScript without approval (the lazy options); a new view for hierarchies.

## Z680 (2026-10-07, step PR4, the orchestrator, automode): the presenter screen's shape

- Chosen: a Presenter control and the key P turn the pane into the presenter screen (the slide, the next slide, the notes, the counter, the time of day, a timer with Pause and Reset) and open the audience window, the slide alone; in the desktop app the audience window goes full screen on the second display, in a browser it is a second browser window you move to the projector and press F in; either window's keys and a clicker move both; both draw the saved deck while presenting; End, Esc or closing the audience window ends it.
- Not chosen: a presenter screen in the browser only, or notes in a separate tab with no sync (the lazy options); a new channel of the desktop app to open the audience window, which a browser lacks; drafts drawn on the presenter only, which shows the presenter a slide the audience does not see.

## Z679 (2026-10-07, step D23c, the orchestrator, automode): a remembered cursor just after a word

- Chosen: the cursor goes to that place with nothing selected; a word is selected only when the cursor lies inside it.
- Not chosen: selecting the word that ends just before the cursor (the lazy option, it selects text the reader never pointed at).

## Z678 (1) (2026-10-07, step D23c, the orchestrator, automode): a remembered cursor past the end of its line

- Chosen: the cursor goes to the end of the line with nothing selected; the word under it is selected only when the remembered column lies inside the line.
- Not chosen: selecting the word that ends the line (the lazy option, it selects text the reader never pointed at).

## Z678 (2) (2026-10-07, step D23c, the orchestrator, automode): a library file reached through a link that is later pointed elsewhere

- Chosen: keep it as built. The library tab reads the file the link pointed to when the language server named it, and never any other file.
- Not chosen: refusing the read once the link points elsewhere, which refuses a file that is still exactly what the server named.

## Z678 (3) (2026-10-07, step D23c, the orchestrator, automode): the source tab's head comment, cut to fit the size limit

- Chosen: the comment gets back every sentence D23c removed, and code moves out of `Source.svelte` into a file beside it to stay within 520 lines.
- Not chosen: leaving the comment shortened (the lazy option, and against the rule that comments are never cut to fit a limit).

## Z678 (4) (2026-10-07, step D23c, the orchestrator, automode): what a link press selects in the file it opens

- Chosen: nothing, as before D23c. Only an open that names a symbol (go to definition, the Outline, References) selects its name.
- Not chosen: selecting the file's first word on every link press (the lazy option, a change nobody asked for).

## Z678 (5) (2026-10-07, step D23c, the orchestrator, automode): F4 and Shift+F4 through References results

- Chosen: each location opens with its word selected, the same as a press on the References row.
- Not chosen: going to the line only, which makes the key and the press differ.

## Z678 (6) (2026-10-07, step D23c, the orchestrator, automode): F12 into a library file too large or binary to show

- Chosen: F12 opens the read-only tab, which says why it cannot show the file.
- Not chosen: F12 doing nothing and saying nothing (the lazy option, as built).

## Z678 (7) (2026-10-07, step D23c, the orchestrator, automode): the exception to the dot-folder rule for Python's own install

- Chosen: the exception never applies when the Python install reports the home folder, the filesystem root or a folder holding the home folder, so `~/.ssh` and every other dot folder stay refused whatever the interpreter reports.
- Not chosen: leaving it as built, where an interpreter whose install is the home folder would open every dot folder in it (the lazy option).

## Z676 (2026-10-07, step D23c, the orchestrator, automode): where the keyboard goes after a press in the Outline

The question: D23c makes a press on a symbol in the Files view's Outline select the symbol's name in the editor. As built, the keyboard then stays in the Outline, where before D23c it moved into the editor.

- Chosen: the keyboard moves into the editor, as before; the new select command takes a flag for it that only the Outline sets, so the clangd AST view keeps the keyboard where it is.
- Not chosen: leaving the keyboard in the Outline (the lazy option, a change of behaviour nobody asked for).

## Z675 (2026-10-07, step PR3, the orchestrator, automode): an image dropped on a slide whose name holds a space

The question: PR3's builder found that an image named `my fig.png` is linked as `![my fig](<my fig.png>)`, a form the slide reader does not recognise, so the slide does not draw the image.

- Chosen: write a space and parentheses percent-encoded as well (`my%20fig.png`), the same way as `#`, `%` and `?`, fixed when PR3 lands.
- Not chosen: refusing names with spaces (the lazy option); a second repair round for a one-line change.

## Z674 (1) (2026-10-07, step PR3, the orchestrator, automode): the tests PR3 added that nothing asked for

The question: PR3's builder wrote four tests the plan's test rule does not allow (a test exists only for an entry of the guarded list): the print window's guard rows, the PDF export's address and file name, the palette's offered commands, and the source read that asks the server each time.

- Chosen: keep the print window's guard rows, since they test the safety rule that the print window may call nothing (G47), and book them on that entry; delete the other three, since a failure of any of them is seen at once and loses nothing.
- Not chosen: keeping all four (the lazy option, and it breaks the test rule).

## Z674 (2) (2026-10-07, step PR3, the orchestrator, automode): no test that the print window stays out of the saved window state

- Chosen: no test. The hidden window that prints a deck is built in `print.ts` and never passes through the code that saves window sizes and full screen, so it cannot be saved.
- Not chosen: a test over every window, whose failure would cost nothing lasting.

## Z674 (3) (2026-10-07, step PR3, the orchestrator, automode): an image dropped on a slide whose name holds #, % or ?

The question: an image named `fig#1.png` is copied beside the slide, but the link written into the slide reads `fig#1.png`, which the browser reads as `fig` plus a page anchor, so the image does not show.

- Chosen: write those three characters percent-encoded in the link (`fig%231.png`), so the file keeps its name and the image shows.
- Not chosen: refusing such names (the lazy option: a legal file the reader dropped is refused).

## Z674 (4) (2026-10-07, step PR3, the orchestrator, automode): undo of a slide action after the change log is trimmed

The question: one slide action (New Slide, Delete, an image drop) writes several records to the change log, and its undo takes them all back together. The log is trimmed to its last 500 records, and the trim can cut through one action, after which its undo takes back only part of it (a slide file trashed while the deck still lists it).

- Chosen: the trim keeps whole actions, moving its cut back to the first record of the action it falls inside.
- Not chosen: refusing the undo of an action that lost records (the action can then never be undone); leaving it (the lazy option).

## Z674 (5) (2026-10-07, step PR3, the orchestrator, automode): the History row of a slide reorder

- Chosen: the row reads "order" beside the kind "deck order", in place of "order / order".
- Not chosen: naming it by the deck's file, which the kind column already says.

## Z674 (7) (2026-10-07, step PR3, the orchestrator, automode): three fields PR3 added to the deck data the page receives

- Chosen: keep them as built. A slide's source carries the entry and the line it comes from, and a deck carries its `order:` list; only the Present view reads them, for Edit Slide and the order rows.
- Not chosen: removing them, which removes Edit Slide's jump to the line.

## Z673 (1) (2026-10-07, step D23c, the orchestrator, automode): the test case for a library opened read-only

The question: D23c opens a library file outside every folder oculus serves as a read-only tab. Its first test case, F12 on `os.path.join`, lands on the copy of Python's type descriptions pyright ships inside oculus's own folder, which is inside the hub, so it opens as an ordinary tab and tests nothing of D23c.

- Chosen: the case becomes F12 on `idlelib` (`import idlelib` in a hub Python file), which lands in the Python install under `~/.pyenv`, outside the hub, and must open read-only.
- Not chosen: opening files inside oculus's `node_modules` read-only too (a different rule from the one D23c builds).

## Z673 (2) (2026-10-07, step D23c, the orchestrator, automode): the safety rule against dot folders

The question: D23c's brief refuses to open any file whose path has a folder starting with a dot, so a language server can never make oculus show `~/.ssh/config` or `~/.claude`. The Python install lives in `~/.pyenv/versions/3.13.4`, so the rule refuses every Python library on this machine and F12 into a library does nothing.

- Chosen: one exception. A file under the Python install pyright already reports (`sys.prefix` and `sys.base_prefix`) is allowed for the pyright server that named it. Every other dot folder stays refused.
- Not chosen: the rule as written (no Python library opens, the lazy option); a setting listing allowed folders (a new config key to keep); a fixed list of refused dot folders such as `.ssh` and `.aws` (any folder not on the list opens, `~/.claude` among them).

## Z673 (3) (2026-10-07, step D23c, the orchestrator, automode): three build details

The question: three points the builder proposed, none visible to the reader.

- Chosen: `held.ts` and `watch.ts` move into a subfolder `server/machine/lsp/held/`, since the language server folder is at its 10-item limit; the page learns which folder and language a library file belongs to from its own request, so no new message between server and page is added; a small editor command selects the word at the position a file is opened at.
- Not chosen: a new message from the server naming the folder and language of each library file (more protocol for a fact the page already has).

## Z671 (2026-10-07, step D45, Axel)

Ruled by Axel, so not an automode choice: a PDF opens four ways. "Open in New Tab" (a new OculusTab with oculus's PDF viewer); "Open in New Window" (a new oculus window holding that OculusTab: a ChromeTab with oculus in Chrome, a new oculus desktop window with the oculus desktop window); "Open in Browser" (a ChromeTab with Chrome's PDF viewer, the existing "Open in Browser Tab" renamed); the Preview program. A click on a word in oculus's PDF viewer opens the `.tex` at that line in oculus. Replaces the automode names "Open in Default Browser" and "View LaTeX PDF in Default Browser" and the ChromeTab-only viewer page.

## Z672 (1) (2026-10-07, step M8, the orchestrator, automode): one name for a reference to another file

The question: a field whose allowed values come from another file is marked three ways: `options_from:` in the hub's 16 `schema:` blocks, `from:` in `manifest-schema.yml`, `values_from:` in `options.yml`.

- Chosen: `from:` everywhere; the code that reads it, the apps interface's `optionsFrom` (`docs/apps.md`) and the cockpit self-test change with it.
- Not chosen: the three names kept (the lazy option).

## Z672 (2) (2026-10-07, step M8, the orchestrator, automode): what the word after from: names

The question: today `options_from: people` means the file `registries/people.yml` and `options_from: venue_categories` a list inside `vocab.yml`, and the line does not say which.

- Chosen: a registry by its name (`from: people`), a vocab list with a prefix (`from: vocab.venue_categories`).
- Not chosen: the file path and key written out in every schema; the bare words as today (the lazy option).

## Z672 (3) (2026-10-07, step M8, the orchestrator, automode): fields that apply only sometimes

The question: conditions such as "deadline is for conferences" live only in help text, which no program reads.

- Chosen: a `when:` key, for example `when: { category: conference }`; `required: { when: ... }` for a field required only then; a condition on a project's tier written as a path, `when: { path: projects/archive/** }`.
- Not chosen: a text expression (a small language to keep); raw JSON Schema `if`/`then` in the YAML (unreadable); conditions left in help text (the lazy option).

## Z672 (4) (2026-10-07, step M8, the orchestrator, automode): two names in oculus's settings catalog

The question: `options.yml` says `description:` and `values:` where every other schema says `help:` and `options:`.

- Chosen: renamed to `help:` and `options:`.
- Not chosen: kept and translated in the code (the lazy option).

## Z672 (5) (2026-10-07, step M8, the orchestrator, automode): where the three missing descriptions go

The question: `registries/career.yml`, `feeds/literature-radar.yml` and the side projects' `project.yml` have no field description.

- Chosen: career and the radar get a `schema:` block at their top, as the other 16 hub files have (career's with fields nested under its sections); the side projects, spread over nine folders, share `config/catalogs/side-project-schema.yml`.
- Not chosen: all three in `config/catalogs/` (over its 10-item limit, forcing a subfolder); one combined file (each description away from its file).

## Z672 (6) (2026-10-07, step M8, the orchestrator, automode): the Findings view follows the same rules as the editor

The question: whether a value the editor underlines is also a finding in the Findings view and fails the test that holds the real hub to zero findings.

- Chosen: the hub is checked through the same descriptions with ajv 8.20.0 (MIT) as a new dependency, in place of the hand-written reference table in `validate.ts`.
- Not chosen: a hand-written second copy of the rules in `validate.ts`; underlining in the editor only (the lazy option).

## Z672 (7) (2026-10-07, step M8, the orchestrator, automode): the entries in the hub's data the new checks flag

The question: six things in the data break the rules once a program checks them.

- `pmc-patients` in `registries/data.yml` has `access: public`: becomes `open`, which its own notes describe ("Public, no data use agreement"). Not chosen: a fifth value `public`.
- `outcome` and `doi` on 18 projects outside the archive: allowed on every project, the schema's "Archive (archive tier)" section renamed. Not chosen: moving the text to a new field; deleting it (the lazy option).
- The journal `hcin` has `timing`, `deadline` and `call` for a topical collection: these three allowed on every venue, the month fields conference-only. Not chosen: dropping them (loses the 2026-12-02 deadline).
- The Graz BCI event has `role: present` and no `link`, a co-author presenting: a new role value for a talk a co-author gives, set on it, `link` kept required for a talk Axel gives. Not chosen: `link` optional for every talk (nothing checks his own talks have slides).
- `kuleuven-thesis`, `uhasselt-thesis` and `xai-nl` have no `category`: `thesis` and `meeting` added, the two theses take `thesis`, XAI-NL `meeting`. Not chosen: `journal` or `conference` (false); `category` optional (the lazy option).
- Eight retrieval methods are in use while `data.yml:9` names four, and `tools/data/redownload.py` skips `direct` and `script`: the eight become the allowed list, the comment is rewritten, and `redownload.py` handles `direct` and `script`. Not chosen: the script left skipping those 5 datasets (the lazy option).

## Z672 (8) (2026-10-07, step M8, the orchestrator, automode): which YAML files M8 covers

The question: the files M8's line names, or every YAML file the editor opens.

- Chosen: also the 26 deck `present.yml` files (their description after PR3 lands) and `.oculus/cpp.yml`.
- Not chosen: only the files the line names (the lazy option).

## Z655 (2026-10-06, step PR2)

The question: the transition slide's hint belongs in the foot with no lede (brief part 4), but a section slide's foot is the text after its numbered list (part 1), and the transition has no list.

- Chosen: (d) a section slide may carry `foot:` in its front matter, the key the summary and grid entries of `order:` already use; the transition carries its hint there with no cards, which draws the old slide exactly.
- Not chosen: (a) four numbered cards the builder wrote (words the deck never had, repeating the foot); (b) the hint as the lede (the foot unmet); (c) a text slide (the legend lost).

## Z667 (2026-10-06, step PR3, Axel)

Ruled (a): PR3's builder rewords the 40 carried deck lines by hand in its worktree copies of the 8 files its brief names, and `agents/spec.md:101` gains the sentence that allows hub text a ruling asks to have reworded, each line listed before and after and read by the reviewer. Not chosen: (b) a step of its own; (c) Axel rewords them (the lazy option).

## Z668 (2026-10-06, step PR3, the orchestrator, automode)

PR3's brief, closing its brief check: the `deck-edit` acts `new`, `duplicate`, `delete`, `image`, `create`, `outline`, with `create` and `outline` in the body's shape; the write kind keeps the name `deck-edit` and the line-edit module `server/edit/deck-edit.ts` keeps its own; an image goes into the folder of the slide's file (the folder the reader resolves images against, the deck's folder for every deck on the tree); a project deck's PDF is named after the project folder (`btfno/present/btfno.pdf`), a root's own deck after the root's folder; the slide heading of New Slide comes from the catalog; G1 gets no row (the deck POST is a read, the write route's row covers every body), the desktop and drop cases are looks at landing. Not chosen: renaming the kind to `deck-file` (the two names never meet a reader); the image in the deck's folder linked with `../` (a link that breaks when the slide file moves); `present/present.pdf` for every project (the lazy option: thirteen PDFs of one name).

## Z666 (2026-10-06, step PR3, the orchestrator, automode)

PR3's brief takes six choices, each its recommendation: the slide actions in a slide's right-click menu and the palette, Export to PDF the one new toolbar control; one write kind `deck-edit`, one record per file with its text before and after, undone as one step; `deck-slides` carries several lists and `order:` in one request applied as one edit, so a move across groups is never half done; the live drawing is a POST of the drafts to the deck route, read on the server; the names `slide-<n>.md`, `<stem>-copy.md`, an image's own name then `-2`, `<stem>-slides/`, `<deck folder name>.pdf`; the PDF written through the ops upload, recorded and undone. Not chosen: a toolbar button per act (crowds the reader's controls); a write per file (an act could leave a file and its `order:` entry out of step); one write per group (the lazy option: the existing write kept unchanged, and a move across groups could be half done); a second slide builder in the page (it would draw differently from the server); a file written by the desktop host (outside the change log).

## Z665 (2026-10-06, step PR3, Axel)

PDF export with no new dependency: the slides printed through the browser, the desktop app writing the file with Electron's `printToPDF`. Not chosen: a driven Chromium (playwright-core, puppeteer-core); rasterised pages (modern-screenshot with jsPDF, the lazy option).

## Z664 (2026-10-06, step PR3, Axel)

The 38 carried slide lines with a spaced hyphen are reworded to the prose rule in PR3. Not chosen: keeping them (the lazy option).

## Z663 (2026-10-06, step PR2)

`start.test.ts` 'asks the default port ... starts no second server', red on main's head without PR2: the orchestrator finds the cause read-only and its fix goes into D23's landing as a fix at landing when small, otherwise into the brief of the next step that changes `src/desktop/`. Not chosen: leaving the red test (the lazy option).

## Z662 (2026-10-06, step PR2)

PR2's look on a scratch oculus over the gate's build (port 8793, its own HOME, engine config and local.yml, Z507's form), because Axel's server on 8790 runs the server code of before the landing and answers the old deck shape until it restarts. Not chosen: no look (the lazy option); a restart of Axel's server (his hands).

## Z661 (2026-10-06, step D23)

D23's B1 and St4: a root that stops being served sends `failed` with a new code `root_gone` for each ended server, and a tab still open under it is served again when the root returns; a localhost socket is not a network wait, so the socket tests stay untagged. Not chosen for B1: the status left at `ready` (the lazy option).

## Z660 (2026-10-06, step D23)

D23's wire: `approve` (page to relay, an interpreter the adapter listed) and `legend` (relay to page, clangd's token legend) join Z496's UV-2 vocabulary, as built. Not chosen: (b) an HTTP approve route and the legend inside `state`, more code for the same effect.

## Z659 (2026-10-06, step D23)

D23's case 47: pyright alone peaks at 513 to 553 MB on this machine and through the relay at 532 to 562 MB; the brief's 320.0 MB was wrong and is corrected in the report; no code change, since nothing in D23 causes the size. No option is lazy.

## Z658 (2026-10-06, step D23)

D23's case 46: a root key holding `/` is percent-encoded twice in the page address, as built, and DESIGN.md:438 says so. Not chosen: (b) such a root refused (the lazy option, a hand-edited `workspaces.json` allows it); (c) an opaque root id on the wire, unreadable in logs.

## Z657 (2026-10-06, step D23)

D23's case 45: a changed `lsp` key ends every held server; one a page has documents open in starts again at once under the new folder, the rest on their next document; DESIGN.md:250 says both. Not chosen: (b) every server on its next request, which leaves an open tab without features until the reader acts; (c) the build as it is, which respawns orphans and failed servers (the lazy option).

## Z656 (2026-10-06, step PR2)

The question: PR2's last review finds Z653's tab identity short in three places (the deck menu can leave two tabs on one deck; Open Presentation on the portfolio's own folder opens a second portfolio tab; a deck at a root's own folder shows a "." crumb and a path ending in "/."), and Present tabs of a folder deck now draw a breadcrumb bar and file items in their tab menu.

- Chosen: all three fixed at landing; the breadcrumb bar and file items kept, as an Open LaTeX tab has them, and stated in the report.
- Not chosen: a later step for the three (the lazy option); the breadcrumb bar removed from Present tabs (unlike Open LaTeX, against item 6).

## Z654 (2026-10-06, step Q125)

The question: after its last repair round, Q125's review still finds about 60 DESIGN.md items outside Apps that repeat a guide, a head comment or another item, so item 5 (DESIGN.md states each decision with its reason, in a few sentences) is short. The round cap allows no further round.

- Chosen: (a) Q125 lands after Axel's read, its small findings fixed at landing, and a new step Q126, next after it, reduces the listed items from the review's per-item list.
- Not chosen: (b) a third round (the cap forbids it); (c) the reduction done by the orchestrator at landing (a builder's work, not a fix); (d) Q125 landed with the repeats left (the lazy option).

## Z653 (2026-10-06, step PR2)

The question: brief item 5 puts a Present deck's `root` and `path` in the pane's instance state, and item 6 says Open Presentation opens a deck "as Open LaTeX does", which gives each file its own tab through `{ root, path, label }` in the tab's layout state. Built to item 5, a second Open Presentation re-points the pane's one Present tab (the review over PR2's round 1, Behaviour 1).

- Chosen: (a) `root` and `path` in the tab's layout state beside `label`, so each deck has its own tab and pressing a deck already open focuses it; `slide`, `overview` and `recent` stay in the instance state.
- Not chosen: (b) both in the instance state, one Present tab per pane re-pointed to each deck (the lazy option, already built).

## Z651 (2026-10-06, step PR2)

The question: points PR2's brief check found the brief and the ruled design leave open or state wrongly.

- Chosen: a count counts every slide of a group's members, placed or not, as the design says; the key hint drawn by Present in the foot of every deck's first slide, since no key catalog exists; the Present deck menu also lists the decks opened in that pane before; a summary member with no project slide gives a row with empty mechanism and headline and no finding; a project carries `deck?` (its `present/` folder) for apps in place of `present?`; the `deck-slides` write carries the list it was read from and refuses a changed file; the two old `deck` records keep their History name and their undo is refused; a domain missing from `vocab.yml` is a finding drawn in the neutral tone; the archived `hccnet-fl` and `fed-faithful-ecg` slides become their own decks; the malformed-deck cases are quoted runs, not tests, since no guarded entry covers a malformed deck.
- Not chosen: the key hint on the title slide only (a deck without a title slide would show none); deleting the archive's `PRESENT.md` files (loses the HCCNet-FL slide); widening G32 to malformed input, which is Axel's wording to rule.

Where it is built: PR2. Booked in `plan.md` Rulings and `agents/briefs/PR2.md`.
## Z649 (2026-10-06, step PR2)

The question: the deck format Axel ruled leaves open how a later slide in a file takes its own kind and notes, how the general kinds are written in Markdown, how a deck is named in `slides:`, and the words that replace the hand-typed counts and domain lists.

- Chosen: Slidev's convention for a slide's own front matter (YAML right after the `---`, closed by `---`); `|||` splits two columns; a section's numbered list draws as cards; a deck is named by its folder, or by its project for a `present/` folder; "A dozen active projects..." becomes "{{pillars.count}} pillar projects and {{more.count}} more."; the transition becomes "{{more.count}} more, same backbone"; both summary foots lose their domain lists; new ideas start `nascent`; a project card opens that project's own deck.
- Not chosen: one front matter per file, so a second slide could carry no notes for PR4's presenter screen; keeping the hand-typed lines, which the ruled design removes.

Where it is built: PR2. Booked in `plan.md` Rulings and `agents/briefs/PR2.md`.

## Z648 (2026-10-06, step PR2)

The question: a library for the Markdown slide decks, under `libraries: check`.

- Chosen: the split written by hand (about 30 lines over the existing `splitFrontmatter` and `yaml`), the slides drawn by oculus's Present parts.
- Not chosen: `@slidev/parser` (it would replace only the roughly 50-line split, and brings Slidev's own rules for the decks, such as a slide's last HTML comment taken as notes and a leading yaml code block taken as front matter, which any upgrade can change, and `@slidev/types` with Vue, Monaco, Mermaid and Vite plugins as dependencies); `@marp-team/marp-core` and `reveal.js` (would replace the Present view PR1 just built); `gray-matter` and `front-matter` (front matter is already split by oculus).

Where it is built: PR2.
## Z647 (2026-10-06, step E4g)

The question: E4g's round fix selects an asking app's tab in its pane, but a tab on a page not on screen stays unseen while the app's call waits, and DESIGN.md and the apps guide say the reader sees it.

- Chosen: (a) the question switches to the page that holds the tab before selecting it, as the status bar's jump to an unsaved file does.
- Not chosen: (b) DESIGN.md and the guide narrowed to "selected in its pane", leaving the question unseen, the lazy option.

Where it is built: E4g's landing. Booked in `plan.md` Rulings.

## Z646 (2026-10-06, step Q125)

The question: Q125's builder handed back at its first run: the brief named three guides, so about 100,000 of HELP.md's 165,450 characters (the window, the views table's detail, files and search, terminals and commands) had no destination, and HELP.md and DESIGN.md would each have been cut because the other said a behaviour, leaving it only in code comments.

- Chosen: (a) four more guides under `docs/` (Window, Views, Files and search, Terminals and commands), each the one home of its concern's user-visible behaviour; DESIGN.md keeps the decisions and points to them; every guide a tab of the Help page, chords to h9 (`agents/briefs/Q125-cases.md`).
- Not chosen: (b) the detail kept in HELP.md, which leaves the manual as long as it is, against Z636, the lazy option for HELP.md; (c) the detail dropped where DESIGN.md or a head comment says it, which loses what a reader needs, the lazy option for the facts.

Where it is built: Q125. Booked in `plan.md` Rulings.

## Z643 (2026-10-06, step Q125)

The question: Q125 moves HELP.md's developer sections, which hold the nine diagrams, into README.md and DESIGN.md. The Help view draws diagrams only for the manual (`server/content/docs.ts`, `renderManualParts`; `views/system/help/Diagram.svelte`), so the diagrams would leave oculus, and the guides under `docs/` need a place to be opened.

- Chosen: (a) the Help group lists the Configuration guide (h8), the Source Control guide (h9) and DESIGN.md as Design (from the catalogue, no chord, a chord holding one digit), and the doc view draws DESIGN.md's diagrams in the page's text colour as the manual's are drawn now.
- Not chosen: (b) the diagrams leave the Help view and the code that drew them is removed, which drops a view of the architecture Axel has in oculus; (c) the diagram code kept with nothing using it, the lazy one.

Where it is built: Q125. Booked in `plan.md` Rulings.

## Z641 (2026-10-06, step PR1)

The question: PR1's step line asks for "a key" and a control, and names no key, no label and no time for the pointer.

- Chosen: (a) `F` toggles full screen and Esc leaves it; the control is labelled Present; Space, Page Down and the right arrow move on, Shift+Space, Page Up and the left arrow move back; a click on the slide moves on, a click on a link or a control does not; the pointer hides after 2 s at rest.
- Not chosen: (b) F5, PowerPoint's key, which a browser tab takes as a reload when the deck does not hold the focus; (c) Cmd+Enter, Google Slides' key, a chord where the deck's other keys are single letters. No option was the lazy one.

Where it is built: PR1. Booked in `plan.md` Rulings.

## Z629 (2026-10-06, step O30)

The question: O30, O30's landing look runs the unpackaged app from the gate on a scratch hub, a scratch HOME and a scratch tmux socket, on port 8817, photographs each window with `screencapture -o -l <window id>` and reads each photograph, then quits the app; no window is driven through the remote debugging port, which the runner refused. The cases that need a press, a drag or a key are booked as not looked at.

- Chosen: (a) the look by photographs of the windows.
- Not chosen: (b) no look, the lazy one.

Where it is built: O30's landing. Booked in `plan.md` Rulings.

## Z628 (2026-10-06, step O30)

The question: O30, the three per-case limits of `tests/checks/diagrams/diagrams.test.ts` (:85, :111, :826) are dropped, so the tree checks follow their documented no-limit rule (`vite.config.ts:34-36`, README.md:17) and a red there is a finding of the tree, never machine load; built by step Q124.

- Chosen: (a) drop the three limits.
- Not chosen: (b) keep them and rerun the tree checks alone after a red from load, the lazy one.

Where it is built: step Q124. Booked in `plan.md` Rulings.

## Z627 (2026-10-06, step O30)

The question: O30, the app's build from the checkout writes into folders of its own (an `outDir` and an adapter `out` the app passes to `vite build`, the server told where its handler is by a flag), listed in `.gitignore` and DESIGN.md's tree, so a start never meets another build in the same checkout; built by step O30b after O30 lands. The folder names and the flag are chosen in O30b's brief and listed under its decisions.

- Chosen: (a) folders of the app's own.
- Not chosen: (b) leave it and rely on the landing's lane order, the lazy one.

Where it is built: step O30b. Booked in `plan.md` Rulings.

## Z621 (2026-10-06, step O30)

The question: O30, a pane in an editor's alternate screen is given to an attaching page in the grid's alternate buffer, the normal buffer keeping the shell's text, so the editor draws full screen and leaving it brings the shell's text back; built by step Q123.

- Chosen: (a) switch to the alternate buffer and keep the normal buffer's capture.
- Not chosen: (b) the alternate buffer only, which loses the shell's text when the editor exits; (c) leave it, the lazy one.

Where it is built: step Q123. Booked in `plan.md` Rulings.

## Z620 (2026-10-06, step O30)

The question: O30, a test for the terminal modes given to an attaching page needs a guarded entry.

- Chosen: (a) the entry and its test, built by step Q123; the entry's words are raised to Axel as Z630, since guarded entries are his.
- Not chosen: (b) no entry, the diagnosis's runs standing as the proof, the lazy one.

Where it is built: step Q123. Booked in `plan.md` Rulings.

## Z626 (2026-10-06, step A3)

The question: A3, the commit inside the record's lock reads `schedules.yml` again and refuses 409 `entry-changed` when its text differs from the text the save planned from, so a hand edit made during the lock wait is never overwritten.

- Chosen: read again inside the lock and refuse on a change.
- Not chosen: (b) plan the edit inside the lock, which reworks `planEdit`'s callers for the same effect; (c) keep it, the lazy one.

Where it is built: A3's landing. Booked in `plan.md` Rulings.

## Z625 (2026-10-06, step A3)

The question: A3, a record change that fails after `schedules.yml` was committed writes back the text the save read, so a 500 `record-unwritten` means nothing was saved and HELP.md:25 holds.

- Chosen: (a) write the read text back.
- Not chosen: (b) drop the record key of a new entry before the commit, which covers only the new-entry path; (c) keep it and state the window, the lazy one.

Where it is built: A3's landing. Booked in `plan.md` Rulings.

## Z623 (2026-10-06, step A3)

The question: A3, the builder's shapes stand: the word `record-unwritten`, the `schedule` payload's `ScheduleRow.unchosen`, and the dialog's empty task choice and Run unattended box's third state with their words.

- Chosen: keep them.
- Not chosen: (b) drop `unchosen` and name only the first problem, which leaves an entry's second problem unfixable from the dialog, the lazy one.

Where it is built: A3's landing. Booked in `plan.md` Rulings.

## Z622 (2026-10-06, step A3)

The question: A3, a command entry whose `unattended` value does not read takes off on any save, since the dialog draws no Run unattended box for a command and off is the one value a command takes; HELP.md:25 and DESIGN.md:138 say so in one clause each.

- Chosen: (a) keep the behaviour and state it.
- Not chosen: (b) skip the key for a command, which brings back a Save that closes with the problem still there; (c) leave it unstated, the lazy one.

Where it is built: A3's landing. Booked in `plan.md` Rulings.

## Z619 (2026-10-06, step O30)

The question: the paste mode, and every other mode a program sets, is lost on each new attach of a terminal grid (a reconnect after a Restart, or a page switch), a defect on main before O30. Where is it fixed?

- Chosen: (a) at O30's landing, with the diagnosis's fix in `sessions.ts` and `channel.ts` and its two doc sentences, since O30's HELP.md promises running terminals survive a Restart.
- Not chosen: (b) a step of its own after O30, which ships O30's promise broken until then, the lazy one.

Where it is built: O30's landing. Booked in `plan.md` Rulings.

## Z618 (2026-10-06, step A3)

The question: A3 gets the plan's extra repair round: A3.md item 4 (G46, close() starts nothing) is violated in `launch` and item 3's S19 window stays open through Z614, both too large for landing; the review's other findings go in the same round.

- Chosen: an extra round.
- Not chosen: (b) fix at landing, which is too large for the landing and leaves Z613 and Z614 unreviewed, the lazy one.

Where it is built: A3's repair round 2 (`agents/briefs/A3-round2.md`). Booked in `plan.md` Rulings.

## Z617 (2026-10-06, step A3)

The question: A3, the builder's words stand: `schedules-unwritten` for a schedules file that could not be written, and the sentence of `server-stopped`; `ui.answer_unreachable` becomes the one key for "The server did not answer.", read by the command bar too.

- Chosen: keep the words and fold the duplicate sentence into one key.
- Not chosen: (b) keep both keys, the lazy one, which lets the tray and the command bar drift.

Where it is built: A3's repair round 2 (`agents/briefs/A3-round2.md`). Booked in `plan.md` Rulings.

## Z616 (2026-10-06, step A3)

The question: A3, a run record naming a reason this version does not know shows the catalog sentence `outcome_failed_unknown` instead of the raw word; `outcome_failed_bare` stays for a run with no reason.

- Chosen: a catalog sentence for an unknown word.
- Not chosen: (b) keep showing the raw word, against spec.md's catalog rule, the lazy one.

Where it is built: A3's repair round 2 (`agents/briefs/A3-round2.md`). Booked in `plan.md` Rulings.

## Z615 (2026-10-06, step A3)

The question: A3, an entry the dialog cannot write (neither the byte patch nor the rendered entry holds) is refused 409 with `entry-unwritable` and the sentence "The entry \"{name}\" cannot be changed from here; edit schedules.yml by hand."

- Chosen: a word of its own with a sentence that tells the reader what to do.
- Not chosen: (b) reuse `entry-changed`, whose "try again" cannot help; (c) leave the 500, the lazy one.

Where it is built: A3's repair round 2 (`agents/briefs/A3-round2.md`). Booked in `plan.md` Rulings.

## Z614 (2026-10-06, step A3)

The question: A3, a save that renames or drops a record entry holds the record's lock across the commit: lock, check the record reads, commit schedules.yml, change the record, release; a lock held past LOCK_WAIT_MS refuses before any write with `record-locked`.

- Chosen: (a) hold the lock across the commit.
- Not chosen: (b) keep commit-first with new words for the failure, which leaves the catch-up window of S19 open; (c) keep it, the lazy one.

Where it is built: A3's repair round 2 (`agents/briefs/A3-round2.md`). Booked in `plan.md` Rulings.

## Z613 (2026-10-06, step A3)

The question: A3, a dialog field whose value carries a problem (an unknown task, a wrong flag) opens with no value chosen and asks for one; the server treats a value sent for such a key as a change and compares it with the raw value, so a Save can correct it while an untouched key keeps its bytes.

- Chosen: (a) the field opens empty and the server compares a sent value for a problem key with the raw value.
- Not chosen: (b) compare every key with the raw value, which rewrites keys the reader did not touch against Z609; (c) keep it, the lazy one.

Where it is built: A3's repair round 2 (`agents/briefs/A3-round2.md`). Booked in `plan.md` Rulings.

## Z612 (2026-10-06, step O30)

The question: a one-line terminal paste closed by a line break asks "Paste 1 lines into the terminal?", while HELP.md says only a paste of several lines asks.

- Chosen: (b) keep asking for any paste that holds a line break, with a singular question for one line and HELP.md saying so, since the pasted line runs the moment it is sent.
- Not chosen: (a) let a one-line paste through without a question; (c) change only the HELP sentence and leave "1 lines", the lazy one.

Where it is built: O30's landing. Booked in `plan.md` Rulings.

## Z611 (2026-10-06, step A3)

The question: the diagnosis found A3's one red run was a tree check timing out at vitest's default 5000 ms under machine load, because the brief ran it through a direct `npx vitest run`; it offered a `checks` project in `vite.config.ts` with no time limit, or a change to the brief's command.

- Chosen: (a) briefs run tree checks inside `npm run test:checks`, the project's own way with no limit; A3's verify item 2 split so.
- Not chosen: (b) remove the per-test limit for `tests/checks` in `vite.config.ts`, which widens a limit to make a check pass, against the hub rule on loosening a threshold, so it was filtered out; (c) rerun item 2 until green, the lazy one.

Where it is built: A3's repair round 1 item 10; every later brief. Booked in `plan.md` Rulings.

## Z610 (2026-10-06, step A3)

The question: a server stop between a schedule's claim and its launch leaves the run `started` with no terminal, and that due time never runs.

- Chosen: (a) record the run `failed` with `server-stopped`, the due time handled.
- Not chosen: (b) release the claim so the due time runs at the next start, which can start a run hours late; (c) leave it. The lazy one was (c).

Where it is built: A3's repair round 1 (`agents/briefs/A3-rebuild-round1.md`). Booked in `plan.md` Rulings.

## Z609 (2026-10-06, step A3)

The question: Pause and Resume rewrite a whole entry from its normalised reading, turning `task: radar` into `task: litwatch` and dropping comments and unknown keys; DESIGN says a pause or resume refuses on `record-unread` though it writes no record.

- Chosen: (a) edit the entry's node in place, compare raw lists; pause and resume refuse only on `schedules-unread`, and DESIGN says so.
- Not chosen: (b) hide Pause on a row with a problem, which leaves comments and key order lost on every other row. The lazy one was (b).

Where it is built: A3's repair round 1 (`agents/briefs/A3-rebuild-round1.md`). Booked in `plan.md` Rulings.

## Z608 (2026-10-06, step O30)

The question: O30 put `install.ts` directly in `state/shared`, which the import order check does not place.

- Chosen: (a) its own folder `state/shared/page`, registered in `INNER`.
- Not chosen: (b) merge it into `words/appearance.ts`, a poor fit of concern. Neither was the lazy one; (b) blurs a folder.

Where it is built: O30's extra round 2. Booked in `plan.md` Rulings.

## Z607 (2026-10-06, step O30)

The question: G48's rewritten `start.test.ts` shows windows and takes focus when the landing list runs it, its cleanup can hang, and one Quit check cannot fail.

- Chosen: (a) rows read from main-process recorders, no window shown, a cleanup with a fallback, the Quit row checks the server pid.
- Not chosen: (b) leave the test out of the landing run, which loosens a check. The lazy one was (b).

Where it is built: O30's extra round 2. Booked in `plan.md` Rulings.

## Z606 (2026-10-06, step O30)

The question: Restart reloaded every window to hand over the new write token, losing undo history, open dialogs and scroll, and reloading at the old port after a port move.

- Chosen: (a) the page recovers on its own: socket reconnect and a 403 re-run the load and retry; no reload.
- Not chosen: (b) keep the reload and point it at the new address; (c) a bridge event from the main. The lazy one was (b).

Where it is built: O30's extra round 2. Booked in `plan.md` Rulings.

## Z604 (2026-10-06, step E4)

The question: `color-scheme: dark` on the dark themes leaves an app with no scheme of its own on a white backdrop, and a light theme lets an app follow the system's dark mode.

- Chosen: (a) `color-scheme: light` on the base body, and `oculus.js` sets `light dark` on the app's root unless the app sets its own.
- Not chosen: (b) keep Z593 as built, so the defect it names stays. The lazy one was (b).

Where it is built: E4's landing. Booked in `plan.md` Rulings.

## Z603 (2026-10-06, step E4)

The question: an app's Confirm takes the keyboard on its Confirm button, so an Enter typed into the app confirms an address the app chose.

- Chosen: (a) an app's Confirm opens on Cancel.
- Not chosen: (b) the Confirm button ignores presses for a moment after it opens, a timing guard; (c) leave it. The lazy one was (c).

Where it is built: E4's landing. Booked in `plan.md` Rulings.

## Z602 (2026-10-06, step E4)

The question: round 2's drops left 14 of E4.md's cases with no row, against Z600's text that the case list is the least a table holds.

- Chosen: (a) restore those inputs at landing.
- Not chosen: (b) accept the drops and narrow E4.md's case list. The lazy one was (b).

Where it is built: E4's landing. Booked in `plan.md` Rulings.

## Z601 (2026-10-06, step E4)

The question: the app-store table's brief title names a 405 answer that round item 13 removed.

- Chosen: (a) the title drops "405".
- Not chosen: (b) keep a title no row can meet.

Where it is built: E4's extra round 2. Booked in `plan.md` Rulings.

## Z600 (2026-10-06, step E4)

The question: E4's tables hold rows beyond the cases each brief line lists.

- Chosen: (a) keep every row that gives a different outcome of the table's unit, as the test rule allows; drop a row that repeats an outcome.
- Not chosen: (b) cut each table to the listed cases, which drops the rows that prove round item 12's new answers. The lazy one was neither; (b) loses proof.

Where it is built: E4's extra round 2. Booked in `plan.md` Rulings.

## Z599 (2026-10-06, step E4)

The question: Z595 sent an app's outside link to a browser tab, but the bridge runs in the app's realm, so an app could open any address it builds and carry what it read out in it.

- Chosen: (a) `open({ url })` with a Confirm showing the whole address before a browser tab opens; a link no longer kills the frame.
- Not chosen: (b) leave links killing the frame, with Reload. The lazy one was (b). Z595 is replaced.

Where it is built: E4's extra round 2. Booked in `plan.md` Rulings.

## Z598 (2026-10-06, step O30)

The question: the app lets through only six named Chromium switches, where the brief says every Chromium switch passes.

- Chosen: (a) every `--name` or `--name=value` that is not an oculus flag passes to Chromium; only a positional argument or a wrong oculus value gets the dialog.
- Not chosen: (b) keep the list of six, which refuses `--lang=nl` and every other switch. The lazy one was (b).

Where it is built: O30's repair round 1. Booked in `plan.md` Rulings.

## Z597 (2026-10-06, step O30)

The question: four test files of O30 hold tests no `guarded.md` entry names.

- Chosen: (a) delete them; each behaviour is shown by a run in the report.
- Not chosen: (b) new guarded entries, which need Axel and add tests the entry rule exists to stop.

Where it is built: O30's repair round 1. Booked in `plan.md` Rulings.

## Z596 (2026-10-06, step O30)

The question: O30 added a server flag `--default-port` the brief does not name, and two docs say the server takes one argument.

- Chosen: (a) keep the flag and name it in HELP.md and README.md.
- Not chosen: (b) an environment variable, the same shape hidden. The lazy one was leaving the docs false.

Where it is built: O30's repair round 1. Booked in `plan.md` Rulings.

## Z595 (2026-10-06, step E4)

The question: an app frame that navigates to an outside address is refused by the page policy and the app tab shows that it did not load.

- Chosen: (a) keep the policy; the bridge script turns a press on an outside link into a browser tab through `open`, and other navigation keeps the load-failed message with Reload.
- Not chosen: (b) loosen `frame-src`, which lets an app frame load any address; leaving every link to kill the frame was the lazy one.

Where it is built: E4's landing. Booked in `plan.md` Rulings.

## Z594 (2026-10-06, step E4)

The question: a press inside an app frame does not make its pane the active pane, since Chrome sends the page no focus event for it.

- Chosen: (b) activate the pane when the window blurs and the focused element is a frame of the frame layer, as a press anywhere else in a pane does.
- Not chosen: (a) leave it, the builder's recommendation, which was the lazy one.

Where it is built: E4's landing. Booked in `plan.md` Rulings.

## Z593 (2026-10-06, step E4)

The question: no theme declares `color-scheme`, so an app frame's native controls and scrollbars stay light in a dark theme.

- Chosen: (b) the dark theme classes declare `color-scheme: dark`, checked in the look in both schemes.
- Not chosen: (a) leave it. The lazy one was (a).

Where it is built: E4's landing. Booked in `plan.md` Rulings.

## Z592 (2026-10-06, step O30)

The question: a Copy into New Window of a source tab scrolled to line 3 opens at line 1, so case 12's scroll clause is not met.

- Chosen: (a) a source tab's saved state gains its scroll position, so a copied or moved tab opens where the original was read.
- Not chosen: (b) accept that the copy opens at the top. The lazy one was (b).

Where it is built: O30's repair round, with its review findings. Booked in `plan.md` Rulings.

## Z591 (2026-10-05, step A3)

The question: DESIGN.md:153 says a map built from an outside map's keys skips an own `__proto__` key, and the brief check asked that a schedule named `__proto__` keep its own record entry.

- Chosen: (a) reword DESIGN.md:153 to "A plain object built from an outside map's keys skips an own `__proto__` key; a `Map` keeps it.", which keeps the guard where it applies and lets the record use a `Map`.
- Not chosen: (b) refuse `__proto__` as a schedule name, which adds a refusal for a name only because of how the record is stored. The lazy one was (b).

Where it is built: A3's brief, item 3 and the DESIGN.md line in its write list. Booked in `plan.md` Rulings.

## Z590 (2026-10-05, step A3)

The question: Z586 says a prompt schedule runs "only in the hub or a root the file browser serves"; read literally, a project folder under the hub is refused.

- Chosen: (a) in or under the hub or a served root, so a prompt can run in `projects/x`, and a folder outside them (`~/`, any other folder) is still refused.
- Not chosen: (b) exactly the hub folder or a root folder, which refuses every project folder and makes prompt schedules unusable for project work. The lazy one was (b), the literal reading.

Where it is built: A3's brief, items 1, 2 and 5, Decision 10, cases S49 and S50. Booked in `plan.md` Rulings.

## Z589 (2026-10-05, step A3)

The question: an entry of `schedules.yml` that is not a map (`- just text`, `- null`) had an outcome in the brief but no problem word.

- Chosen: (a) `entry-wrong`, worded "Entry {0} of the file is not a map of keys, so it does not run.", shown with Delete only.
- Not chosen: (b) leave the row without a word, so the reader sees a row that does not run and no reason. The lazy one was (b).

Where it is built: A3's brief, `SCHEDULE_WORDS`, Decision 5, case S38. Booked in `plan.md` Rulings.

## Z568 (2026-10-05, step A3)

The question: the run over A3's round 1 found item 5 unbuilt (a 29 February pattern stops the server process; a due time before the first sessions payload is dropped), and the fix is too large for landing.

- Chosen: (a) the plan's one extra repair round (`repair_rounds`: "one more only when the delta leaves ... an acceptance item unbuilt and the fix is too large for landing"), `agents/briefs/A3-round2.md`.
- Not chosen: (b) fix both at landing, which is larger than a landing fix and would land unreviewed scheduler logic; (c) raise them to Axel, though the plan's own rule settles it. The lazy one was (c).

Where it is built: A3's worktree in round 2. Booked in `plan.md` Rulings.

## Z565 (2026-10-05, step D44)

The question: D44's `tests/data/snapshot/cluster-folder.test.ts` falls under no entry of `agents/guarded.md`.

- Chosen: (a) name it under G15, whose sentence (a manifest with a broken field still shows its project, with a finding) it tests, and whose Code line holds `validate.ts`.
- Not chosen: (b) fold its rows into `resources.test.ts`, which mixes two readers' tables in one file. The lazy one was neither; (a) and (b) cost the same.

Where it is built: `agents/guarded.md`, G15's Test line. Booked in `plan.md` Rulings.

## Z564 (2026-10-05, step D44)

The question: D44's `tests/server/machine/hpc/submit-files.test.ts` falls under no entry, and G43's Code line does not name `keptFiles`, which its rows exercise.

- Chosen: (a) name the file under G43 and add `keptFiles` in `src/lib/server/core/git/files.ts` to G43's Code line; the files of the plan are part of G43's sentence.
- Not chosen: (b) leave it under no entry, which breaks `agents/spec.md:57`. The lazy one was (b).

Where it is built: `agents/guarded.md`, G43's Code and Test lines. Booked in `plan.md` Rulings.

## Z563 (2026-10-05, step O30)

The question: O30's find bar: `findInPage` counts a text box of the page holding the query, so a bar drawn in the page counts itself (the builder's probe2 and probe4).

- Chosen: (a) the bar is a `WebContentsView` over the window's top right loading the server's own small route `/find`, drawn with `ui/` primitives, so the page's document holds no find box and the count is the page's own.
- Not chosen: (b) subtract one from the count and skip the bar's own match, which breaks whenever the box is not the first match or the query is not in it. The lazy one was (b).

Where it is built: `agents/briefs/O30-cases.md`. Booked in `plan.md` Rulings.

## Z562 (2026-10-05, step O30)

The question: O30's spelling suggestions: Electron emits no `context-menu` when the page cancels the DOM right-click, which oculus's text menu does, so Z555 (a)'s mechanism cannot work (the builder's probe3).

- Chosen: (a) keep everything Z555 (a) rules (no library, no native menu, oculus's text menu shows the suggestions at its top in the app) and take the facts from the preload's `webFrame.isWordMisspelled` and `getWordSuggestions`, the page finding the word at the pointer in its own box and replacing it as Paste does, the spell server warmed when the preload loads.
- Not chosen: (b) drop the app's spelling suggestions, which leaves the ruled feature unbuilt. The lazy one was (b).

Where it is built: `agents/briefs/O30-cases.md`. Booked in `plan.md` Rulings.

## Z561 (2026-10-05, step E4)

The question: the Settings section words of the nine `apps.*` entries under the Apps heading (Z558).

- Chosen: (a) two sections: "App limits" for the eight limits and "Closed folders" for `closed_paths`, in the plain words the other sections use.
- Not chosen: (b) one section for all nine, which puts the closed folders among numbers. The lazy one was (b).

Where it is built: E4's brief. Booked in `plan.md` Rulings.

## Z560 (2026-10-05, step E4)

The question: G49's Code line, which I wrote, left out units its approved sentence covers: the page's `open`, the write's target and rate checks, and the apps-folder file's tab choice and file-route answer (E4's closing, C63, C72, C81).

- Chosen: (a) the Code line names them, so spec.md's test rule gives each a G49 test table; the sentence Axel approved under Z523 is unchanged.
- Not chosen: (b) keep C63, C72 and C81 as quoted runs, which breaks spec.md's rule of one test per unit an entry covers. The lazy one was (b).

Where it is built: E4's brief. Booked in `plan.md` Rulings.

## Z559 (2026-10-05, step E4)

The question: the icon of `app_view` (E4's brief check: Z520 gave it lucide `app-window`, which `open_program` already draws, `icons.yml:17`).

- Chosen: (a) `app_view` draws lucide `layout-panel-top`, which no entry of `icons.yml` uses (`grep -c`: 0).
- Not chosen: (b) keep `app-window`, so an app's tab and Open in Program draw the same icon. The lazy one was (b).

Where it is built: E4's brief. Booked in `plan.md` Rulings.

## Z558 (2026-10-05, step E4)

The question: the Settings heading of the `apps.*` limits (E4's brief check: `options.yml:9` requires a heading and HEADINGS has no word for apps).

- Chosen: (a) HEADINGS gains `apps`, drawn "Apps" after `calendar`, and the `apps.*` entries sit under it.
- Not chosen: (b) the entries under `sources`, where a reader looking for the apps' limits would not look. The lazy one was (b).

Where it is built: E4's brief. Booked in `plan.md` Rulings.

## Z554 (2026-10-05, step X3e)

The question: a stop of X3e's recheck after S5 to D20 (`agents/reviews/X3e-brief-check.md`).

- Chosen: (a) H1.4 makes `keptFiles` asynchronous, and X3e's paths gain D44's `src/lib/server/machine/hpc/submit.ts` for its await, added at X3e's dispatch.
- Not chosen: (b) D44's builder makes it asynchronous now, outside D44's brief. (the lazy one was (b)).

Where it is built: X3e's brief, "Rulings after the recheck". Booked in `plan.md` Rulings.

## Z553 (2026-10-05, step X3e)

The question: a stop of X3e's recheck after S5 to D20 (`agents/reviews/X3e-brief-check.md`).

- Chosen: (a) X3e is dispatched after D44 lands, and its D2 change goes into whichever file then holds `Source.svelte`'s load effect after D44's split (`Source.svelte` is 528 lines, over the 520 limit, its folder at 10 items).
- Not chosen: (b) X3e splits it too, two splits that do not merge; (c) no split, which breaks the size rule. (the lazy one was (c)).

Where it is built: X3e's brief, "Rulings after the recheck". Booked in `plan.md` Rulings.

## Z552 (2026-10-05, step X3e)

The question: a stop of X3e's recheck after S5 to D20 (`agents/reviews/X3e-brief-check.md`).

- Chosen: (a) X3e's read failures are worded through D20's failure codes and `server.git` keys (`classifyFailure`, `parse.ts:703-730`): `answered` and `ran` stay, a timeout fills `timed_out`'s two arguments, a signal takes `signal`, and no `server.git.failed` key is added.
- Not chosen: (b) new read keys, two wordings for one ending; (c) the brief as written, which leaves two placeholders unfilled. (the lazy one was (c)).

Where it is built: X3e's brief, "Rulings after the recheck". Booked in `plan.md` Rulings.

## Z438 (2026-10-05, step X3e)

The question: G31 names no notes order file, so the order X3e writes has no guarded test.

- Chosen: (a) G31 widened: Code names `src/lib/server/files/fs/notes.ts`, Test names one new case in the notes test file, 'refuses a write over an order file it cannot read, leaving it'; a lost order file is lost work, which the test rule covers.
- Not chosen: (b) no test and the look alone (the lazy one), which leaves an order file that does not read to be written over unseen.

Where it is built: X3e's brief and `agents/guarded.md` G31 (entered when X3e lands). Booked in `plan.md` Rulings.

## Z439 (2026-10-05, step X3e)

The question: The wire and file shapes X3e adds, which no ruling names.

- Chosen: (a) as the brief takes them: the `files` channel payload `{ root, folders?, bookmarks?, workspaces? }`; the notes order file `{ "version": 1, "order": [...] }`; the refusal codes `roots-changed` and `notes-order-unreadable`; the body fields `keys` and `ids` on `POST /api/fs`; the glyph `head` (ASCII `@`, lucide `target`). Each follows the shape of its neighbours (the `files` payload keeps `root`, which D37's reader uses; the order file carries a version as `workspaces.json` does).
- Not chosen: (b) one new channel per list, which doubles the socket handling for no reader; (c) leaving the shapes to the builder (the lazy one).

Where it is built: X3e's brief, Decisions. Booked in `plan.md` Rulings.

## Z440 (2026-10-05, step X3e)

The question: The `repository_scan_depth` reader: G13 says a wrong value is refused with a finding and its default used, while the setting readers of `settings.ts` throw naming the key.

- Chosen: (a) the new reader throws naming the key, as its siblings in `data/sources/config/settings.ts` do, with one case in `tests/data/sources/config/settings.test.ts` (G13: one case per setting reader); the mismatch between G13's sentence and the setting readers is older than X3e and is raised to Axel as an open item.
- Not chosen: (b) a finding and the shipped value for this one reader, which makes it the only reader of its file to answer differently; (c) no case (the lazy one).

Where it is built: X3e's brief. Booked in `plan.md` Rulings.

## Z441 (2026-10-05, step X3e)

The question: Five defects X3e holds out because no read-only look found their cause: D27-3, the hub Graph's 10 s first read, X3a-1's 5 s Delete, Q88c-19's server half, Q88c-22.

- Chosen: (a) D27-3 is read at X3f's landing look, since its press path is X3f's; the Graph's first read, the 5 s Delete and Q88c-19's server half each go through /diagnose (brief check) on a diagnosis agent before X3e's builder starts, and a cause found joins the brief; Q88c-22 is closed, since the stray folders are gone (`ls config` at the hub root fails) and `~/.oculus/changes.jsonl` names no write that made them.
- Not chosen: (b) the builder asked to find the causes, which a round never does; (c) the five left out with no diagnosis (the lazy one).

Where it is built: X3e's brief, section G. Booked in `plan.md` Rulings.

## Z444 (2026-10-05, step D42)

The question: Four details of D42's Timeline that no ruling names: a malformed paging cursor, a pinned file that goes, the Load more row while a page is read, and Open Timeline for a root the workspace lacks.

- Chosen: (a) as the brief's Decisions 9 to 12 take them: a `before` that is no hash is refused with a 400 and the commits failure line drawn, never read as the first page (which would draw the first page twice); a deleted or renamed pinned file keeps the Timeline on its path, and a pin whose root leaves the workspace is dropped; the Load more row says `files.timeline_reading` while its page is read, as VS Code's says Loading; Open Timeline for a root the workspace lacks says the outcome line, opens the section and scrolls nothing.
- Not chosen: (b) a malformed cursor read as the first page, a pin dropped on any change of the file, and no reading word (the lazy one).

Where it is built: D42's brief, Decisions 9 to 12. Booked in `plan.md` Rulings.

## Z445 (2026-10-05, step S5)

The question: S5's first run: which held value passes the server's check (cases 35 and 22), the closed-groups premise of item 1.6, and the key a catalog finding names.

- Chosen: a value or record equal to one the base holds passes wherever it stands; in a changed record each field is checked in full unless the base held that value at that field (same key in a map, any record in a list) and its check reads no other field, so case 35 is refused and case 22's stray at another key is refused; case 10 reads every heading open, no saved list added since none exists; a finding's key is `<file>:<key path>` with a field as one more dotted segment. In full in `agents/briefs/S5-cases.md`.
- Not chosen: the path checked on every write (refuses untouched records whose folder went), or case 35 dropped (the lazy one), or Decision 6 (a) kept (a crafted write moves a stray to another key).

Where it is built: S5, through `agents/briefs/S5-cases.md`. Booked in `plan.md` Rulings.

## Z446 (2026-10-05, from Q35's owed look)

The question: Q35's owed look found the Audit's arrow keys moving a card cursor that no row draws: `Audit.svelte:115` gives each row `data-card`, but the view never reads `cardCursor`, and before Q35 it passed `cursor={false}`.

- Chosen: (a) a step, Q118, that draws the cursor on the Audit row, as the Inbox and the Focus lanes draw theirs; Q35's brief said the rows keep `data-card` so the keyboard reaches the findings.
- Not chosen: (b) `data-card` taken off the Audit rows, so the arrow keys skip the Audit; (c) left as it is, the lazy one.

Where it is built: step Q118. Booked in `plan.md` Rulings.

## Z447 (2026-10-05, step D11)

The question: D11's local.yml key naming the debug adapter `rite_dap` (O1 of its brief).

- Chosen: (a) `rite_dap_bin`, read as `claude_bin` is: an absolute path or a name on PATH, default `rite_dap`; a live debug look on TEST then needs Axel to set the key in his local.yml, since `rite_dap` is not on PATH (`which rite_dap` exits 1).
- Not chosen: (b) a nested `debug: { adapter }` block, which no other program key uses; (c) (a) plus a fallback to the repository's `bin/debug/rite_dap`, which runs a repository's binary without its text approved, against DESIGN.md:153 (the lazy one).

Where it is built: D11's brief. Booked in `plan.md` Rulings.

## Z448 (2026-10-05, step D11)

The question: D11's DAP transport (O2): hand-written framing or a library.

- Chosen: (a) hand-written Content-Length framing and request pairing in `server/machine/debug/wire.ts` on the `@vscode/debugprotocol` types LA17 ruled, since `@vscode/debugadapter-testsupport` 1.68.0's `ProtocolClient` parses each message unguarded (`protocolClient.js:82`, one bad message throws in the server), waits forever on a bad Content-Length and never settles pending requests when the adapter exits.
- Not chosen: (b) `@vscode/debugadapter-testsupport`'s `ProtocolClient` (the lazy one, three defects to wrap); (c) `node-debugprotocol-client` 0.5.1, last released 2022-11-13 on the deprecated `vscode-debugprotocol` types.

Where it is built: D11's brief. Booked in `plan.md` Rulings.

## Z449 (2026-10-05, step D11)

The question: Where D11 keeps breakpoints, function breakpoints, watch expressions and the chosen launch configuration (O3).

- Chosen: (a) the browser's localStorage under `oculus.debug.v1`, beside the saved layout, read as empty lists when storage throws or holds another shape; chosen because the pages and tabs are already kept per browser there.
- Not chosen: (b) a record file under `~/.oculus/` with a new local.yml key, per machine, needing the unreadable-file handling G31 holds.

Where it is built: D11's brief. Booked in `plan.md` Rulings.

## Z450 (2026-10-05, step D11)

The question: What a launch configuration's `before` may name (O4).

- Chosen: (a) any command of the repository, found by D17's `depends_on` rule (the file's commands, then the saved ones, then the found ones, `server/machine/commands/resolve.ts:5-7`), as a command name already resolves inside `commands.yml`.
- Not chosen: (b) only an entry of `.oculus/commands.yml`, the narrower reading of Z92 (1) (a).

Where it is built: D11's brief. Booked in `plan.md` Rulings.

## Z451 (2026-10-05, step X3e)

The question: X3e's A6 (Alt+Up and Alt+Down move an open editor within its pane): no ruling names it, and the step line, Z263 and Z284 name four lists reordered by drag (roots, bookmarks, notes, sections), with no drop for A6 to follow (X3e brief check finding 8).

- Chosen: (a) A6 removed from X3e's brief, since nothing asked for it and it would add a keybinding no ruling names.
- Not chosen: (b) A6 kept as a decision of the brief with a case, which adds a user-visible keybinding nothing asked for.

Where it is built: X3e's brief. Booked in `plan.md` Rulings.

## Z452 (2026-10-05, step X3e)

The question: X3e shares `Sections.svelte`, `Files.svelte` and the Files view's state with D42 in flight, both restructuring them (A5 adds `sections` to `FilesView` where D42 adds the Timeline's state) (X3e brief check finding 15).

- Chosen: (a) X3e is prepared after D42 lands, its brief closed now against D42's write list and premises checked again at /spec then; its slot goes to Q118. The Z441 diagnoses run before X3e's builder starts, as ruled.
- Not chosen: (b) X3e dispatched now with a hand merge at the second landing, which `agents/spec.md`'s rule on parallel steps does not allow for two structural changes to the same components.

Where it is built: X3e's brief. Booked in `plan.md` Rulings.

## Z443 (2026-10-05, from X3e's /spec)

The question: G13 (approved by Axel) says a wrong config value is refused with a finding naming the key and its default is used; the setting readers of `data/sources/config/settings.ts` (`blockOf`, `settingOf`, :65-81) throw instead, so a wrong value in `behavior.yml` stops the server at start (`server/root/context.ts:273-285`) and, on a change while it runs, is only logged and the old settings kept (`server/root/live-settings.ts:152-170`), with no finding in the page.

- Chosen: (a) the readers made to keep G13, through step Q119: a wrong value gives a finding naming the key and the default is used, so a typo costs one setting and the server still starts. The code breaking an approved rule is a defect, and fixing it keeps the ruling, so it closes in automode.
- Not chosen: (b) G13's sentence changed to what the readers do, which reverses Axel's approved entry (the lazy one, and not the orchestrator's to take).

Where it is built: step Q119. Booked in `plan.md` Rulings.

## Z469 (2026-10-05, from X3e's brief check)

The question: X3e's brief-check closing, open item 1: Z451 removes A6's move of an open editor within its pane; Z284 rules Alt+Up and Alt+Down for roots, bookmarks, notes and section heads.

- Chosen: (a) only the open-editor move is removed and the four lists keep Alt+Up and Alt+Down, which keeps both rulings.
- Not chosen: (b) all of A6 removed, which reverses Z284 (not the orchestrator's to take).

Booked in `plan.md` Rulings.

## Z470 (2026-10-05, from X3e's brief check)

The question: X3e's brief-check closing, open item 2: Add Folder and Remove Folder drop a comment line inside `sources.yml`'s `roots:` list without a word.

- Chosen: (a) every roots write refuses with `files.refused_roots_invalid` when the list holds a comment line among its entries, so no comment Axel wrote is lost and he is told why.
- Not chosen: (b) the comment kept with the entry below it, a change to `setItems`, which four writers share; (c) dropped without a word (the lazy one).

Booked in `plan.md` Rulings.

## Z471 (2026-10-05, from X3e's brief check)

The question: X3e's brief-check closing, open item 3: D5's catalog sentences cover `server/git` and `auth.ts`; the git reads under `server/core/git` (run.ts, compare.ts, files.ts, reads.ts) answer in lower-case English too, which Q88c-6 names.

- Chosen: (a) D5 covers `server/core/git` too, after D42 lands (Z452), the write list widened by the handlers and the tests that call them.
- Not chosen: (b) D5 left at `server/git` and `auth.ts`, which leaves GET /api/git's answers in lower case (the lazy one).

Booked in `plan.md` Rulings.

## Z476 (2026-10-05, from D23's brief, OI-1)

The question: where D23's machine-local files live (clangd's index folders and the remembered interpreter and database choices).

- Chosen: (a) one `config/local.yml` key `lsp`, default `~/.oculus/lsp`, holding `<root key>/<database folder>/` and `choices.json`, as every other machine-local file of oculus has a key with its `~/.oculus/...` default.
- Not chosen: (b) two keys, one per kind of file, which splits one concern; (c) fixed paths with no key (the lazy one), the only machine-local files no key moves.

Booked in `plan.md` Rulings.

## Z477 (2026-10-05, from D23's brief, OI-2)

The question: the status bar items of the language servers.

- Chosen: (a) three items in `RIGHT_ITEMS` before `language`: `language_server`, `interpreter` and `compile_database`, each drawn only when its language is the file's.
- Not chosen: (b) one VS Code `{}` language status item, which hides the interpreter and the database behind a hover.

Booked in `plan.md` Rulings.

## Z478 (2026-10-05, from D23's brief, OI-3)

The question: a library for the server side's JSON-RPC over stdio.

- Chosen: (a) `vscode-jsonrpc` 9.0.3 with `vscode-languageserver-protocol` 3.18.4 (MIT, Microsoft), which carry the framing, the partial reads and every message type the relay rewrites.
- Not chosen: (b) `vscode-jsonrpc` alone, which leaves every message untyped; (c) the framing written by hand (the lazy one under the libraries rule).

Booked in `plan.md` Rulings.

## Z479 (2026-10-05, from D23's brief, OI-4)

The question: a new guarded entry for language server lifetimes.

- Chosen: (a) G36 as the brief words it (a server ends 60 s after its last page closed, at once when its root is no longer served, and with the oculus server; never started twice for one page, root and language), tested by one table over a stub server.
- Not chosen: (b) quoted runs only, which leave a leak of 280 MB per server unguarded (the lazy one).

Booked in `plan.md` Rulings.

## Z480 (2026-10-05, from D23's brief, OI-5)

The question: a file this machine locks by its mode.

- Chosen: (a) opened in Monaco as read-only with the features that change no text (hover, definition, references, the Outline), as VS Code does; truncated files and HEAD or index versions stay in the `Code` window.
- Not chosen: (b) every locked tab kept in the `Code` window, with no language features (the lazy one).

Booked in `plan.md` Rulings.

## Z481 (2026-10-05, from D23's brief, OI-6)

The question: clangd's semantic tokens.

- Chosen: (a) on, with theme rules that map each token type to the TextMate scope VS Code falls back to, so a token is drawn in the theme's colour.
- Not chosen: (b) off (the lazy one), which also leaves Z72 (4) (b1)'s feature list short.

Booked in `plan.md` Rulings.

## Z482 (2026-10-05, from D23's brief check)

The question: a language server under Z72 (1) (a) "ended with their tab" ends 60 s after the last tab of its root and language closes on the page, unless a tab of them opens again inside the 60 s, besides the page closing, the root no longer served and the oculus server's close; written into D23's brief and its cases.

- Chosen: (a) the server ends 60 s after the last tab of its root and language closes, a tab opened again inside the 60 s keeping it.
- Not chosen: (b) at once when the last tab closes, which restarts pyright's index on every close and reopen; (c) kept while the page is open, which leaves Z72 (1) (a)'s "ended with their tab" unbuilt, the lazy option.

Booked in `plan.md` Rulings.

## Z483 (2026-10-05, from D23's brief check)

The question: the References view in the side bar and clangd's AST and memory-usage views are inside D23's ruled scope (Z72 (4) (b1)) and are built in D23; the uncommitted widening of D23b's line that moved them is withdrawn.

- Chosen: (a) the three views built in D23, as Z72 (4) (b1) rules.
- Not chosen: (b) moved to D23b, a deferral inside D23's scope with no ruling behind it, the lazy option.

Booked in `plan.md` Rulings.

## Z484 (2026-10-05, from D23's brief check)

The question: each closed in D23's brief by a session agent, the brief re-read on main's head after H3 lands, every closing listed under the brief check's Closed heading.

- Chosen: (a) every finding closed in the brief before dispatch.
- Not chosen: (b) the findings handed to the builder to settle, which makes the builder find causes and choose shapes, the lazy option.

Booked in `plan.md` Rulings.

## Z486 (2026-10-05, from S5's review)

The question: S5's review Spec 1: the catalog key `empty` takes `true` or words (`empty: <words>`, on `chat.model`, `git.message_model` and `direct_chord`), the words drawn as the choice's empty item, where item 2.2 named `true` only

- Chosen: (a) both forms kept and said in the catalog's head and DESIGN.md.
- Not chosen: (b) `true` only, every empty item drawn with one generic word, which hides what the empty value does, the lazy option; (c) a separate key `empty_label`, two keys for one fact.

Booked in `plan.md` Rulings.

## Z485 (2026-10-05, Axel, from D23's brief)

The question: a new entry G36 in `agents/guarded.md` for language server lifetimes, which Z392 reserves to Axel.

- Chosen by Axel: (a) yes, G36 as worded, with its test.
- Not chosen: (b) no entry, the lifetimes checked only at the landing look, the lazy option.

Booked in `plan.md` Rulings.

## Z487 (2026-10-05, Axel)

Axel asked for a new step: the LaTeX view redone so a `.tex` file opened in the editor is all it takes, as VS Code's LaTeX Workshop. Booked as D45; D15's PDF beside the source moves into it.

Booked in `plan.md` Rulings and the step list.

## Z550 (2026-10-05, from M6's brief)

The questions: what Add writes into a new entry; what `applied` on a lead does; what becomes of the bookmark form, whose file is under no served root; what an entry with an empty or shared identity gets.

- Chosen: (1) the first field, the registry key, the required fields and `status`; (2) the lead set to applied and Applications opened filled from it; (3) the form goes, each bookmark row gets Rename Bookmark... and Remove Bookmark, adding is the star; (4) a finding per such entry.
- Not chosen: (1) every field, or the others as comment lines; (2) only opening Applications, the lazy option; (3) serving `~/.oculus` as a root, which exposes the change log and `connect/`, or keeping the form, the lazy option; (4) only disabled controls, the lazy option.

Where it applies: M6's brief. Booked in `plan.md` Rulings.

## Z549 (2026-10-05, from D20's review over round 1, Behaviour 4.2)

The question: every move of a sash drag writes the layout and appends a record entry, so a few seconds of drag push out the 500 entries the record keeps.

- Chosen: a write equal to the newest entry in all but its time is counted on that entry (`n`, `last`), so every write is still recorded and a drag keeps the older entries.
- Not chosen: recording only writes that change the tab set, which drops writes your ruling on the record says are recorded; leaving it as built, the lazy option.

Where it applies: D20, fixed at its landing (`state/workbench/layout/saved/storage.ts`, DESIGN.md's layout paragraph). Booked in `plan.md` Rulings.

## Z548 (2026-10-05, from A3's brief check)

The question: whether a text control may hold an empty value when its text has a form, such as a cron pattern.

- Chosen: the catalog key `empty: true` on a text control lets a text with a form hold `''`; a text control with no form takes `''` as it does today.
- Not chosen: every text control without `empty` refusing `''`, which widens the change past A3's need and turns a hand-written `''` into a finding.

Where it applies: A3. Booked in `plan.md` Rulings.

## Z547 (2026-10-05, from D11's recheck)

The question: where D11's debug toolbar stands while a session runs.

- Chosen: it floats over the top of the workbench, draggable along the top edge and hidden at the end, its position kept in `oculus.debug.v1`, as VS Code's `debug.toolBarLocation` default `floating`.
- Not chosen: docked in the Debug view's header, the lazy option, out of sight whenever the view is closed.

Where it applies: D11. Booked in `plan.md` Rulings.

## Z546 (2026-10-05, from X3f's review over round 3)

The question: the icons of Open Preview and Open Preview to the Side, now drawn side by side in a Markdown source tab's breadcrumb bar, where Z508 gave `file-search` to Open Preview to the Side.

- Chosen: Open Preview takes lucide `file-search` and Open Preview to the Side `panel-right-open`, so the side icon shows where the tab opens.
- Not chosen: both on `file-search`, two buttons a reader cannot tell apart.

Where it applies: X3f. Booked in `plan.md` Rulings.

## Z534 (2026-10-05, from D20's review)

The question: whether Cancel, a timeout and an output-limit kill end only git, or git and its descendants (a hook's processes).

- Chosen: git and its descendants, as D20 built it.
- Not chosen: git alone, the lazy option, which leaves a hook running and holding the index lock.

Where it applies: D20. Booked in `plan.md` Rulings.

## Z528 (2026-10-05, from D28's brief)

The question: seven designs D28's brief leaves open: how a tab hears its file changed on disk, the names of the save keys and the delay key, a file deleted under a tab, closing under autosave, a fourth autosave value, and the pane while a file is read.

- Chosen: a `source:` channel per open file polled every 500 ms; `trim_trailing_whitespace` and `final_newline` as global keys a language or repository overrides; `editor.autosave_delay_ms`; a deleted file's tab kept and saved again on Save; close saves under the short autosave modes; no `on_window_change`; an empty pane while reading.
- Not chosen: the lazy options (the `files` channel plus focus, language fields only, a deleted tab that saves nothing, the close question in every mode, the old waiting sentence), VS Code's three save keys, page polling.

Where it applies: D28. Booked in `plan.md` Rulings.

## Z526 (2026-10-05, from D20's second brief check, its closing)

The question: four designs the closing took inside D20's brief that no ruling names exactly.

- Chosen: per-mode confirmation sentences as catalog keys picked in `composer.ts`; `approvals-unwritable` naming the path only; Cancel as a `cancel` action on `/api/git` and `/api/deposit` over a registry of runs in flight; the deposit's switch and push without a time limit.
- Not chosen: a sentence key in `agents.yml`; a reason code from `approveTexts`; the request's abort signal; the lazy options (one generic sentence, a documented server restart, only the commands Z519 names).

Where it applies: D20. Booked in `plan.md` Rulings.

## Z525 (2026-10-05, from X3e's diagnoses)

The question: what X3e builds from its three diagnoses, and whether the on-demand git reads move off the event loop too.

- Chosen: the watcher's reads through `execFile`, one per root at a time; the on-demand reads of `GET /api/git` moved to the asynchronous runner as well; the folder panel tied to its request's connection, ended on close, a -128 cancel answered as no folder.
- Not chosen: the on-demand reads left on `spawnSync`, the lazy option, which still held the loop for 2.9 s under load.

Where it applies: X3e. Booked in `plan.md` Rulings.

## Z520 (2026-10-05, from E4's brief)

The question: E4's shapes 1, 2, 4, 5 and 6 that the plan does not name.

- Chosen: as booked in `plan.md` Z520.
- Not chosen, the lazy ones: no rail button; an existing glyph such as `page`; no catalog entries for the limits; the download leak stated and kept; one refusal word for two causes.

Where it applies: E4. Booked in `plan.md` Rulings.

## Z519 (2026-10-05, from D20's second brief check)

The question: seven shapes the brief took without a ruling, the renderer variable's reach, and two rules for one catalog group.

- Chosen: as booked in `plan.md` Z519.
- Not chosen, the lazy ones: English from the server on `approve-seed`; a wrong `confirm` read as false, which drops the confirmation silently; a hung hook with no way out; the variable on every start without checking the usage refresh; two capitalisation rules for one group.

Where it applies: D20, then X3e's re-base. Booked in `plan.md` Rulings.

## Z516 (2026-10-05, from O30's brief)

The question: O30's shapes D4 to D15 that the plan does not name.

- Chosen: as booked in `plan.md` Z516.
- Not chosen, the lazy ones: window state not kept; Electron's own icon and menu; `npm run app` only; no pop-out; the pop-out's tabs closed with a question; the app quit with its last window; a dialog then quit on a port in use; the menu roles only for keys; no find.

Where it applies: O30. Booked in `plan.md` Rulings.

## Z513 (2026-10-05, from D20's brief)

The question: D20's ten shapes the plan does not name.

- Chosen: as booked in `plan.md` Z513.
- Not chosen, the lazy ones: the Focus rows only; an approval keyed by the title alone; Start Here on worktree rows alone; the 10 s constant raised; the confirmation for bypassPermissions alone.

Where it applies: D20. Booked in `plan.md` Rulings.

## Z510 (2026-10-05, from A3's brief)

The question: A3's shapes the plan does not name, choices 1 to 4 and 6 to 9.

- Chosen: `tasks.<task>.schedule`; croner's five fields and nicknames, local time; `form: cron` in the value rule; going = terminal listed and its session not idle; `~/.oculus/schedule.json`; a `schedule` channel; next run and latest five runs in the tray; empty shipped patterns.
- Not chosen, the lazy ones: one `tasks.schedule` map; every croner mode; a check in the reader alone; "terminal listed" alone, which blocks every later run; a record in memory, which loses catch-up; a polled GET route; next run only.

Where it applies: A3. Booked in `plan.md` Rulings.

## Z509 (2026-10-05, from Q119's closing)

The question: `latex.auto_build` is read by the page through its own rule, so a misspelt value builds with no finding.

- Chosen: (a) read in `settings.ts` against its catalog entry in S5's round 1, the same concern as Z494.
- Not chosen: (b) a step of its own, which Z468 rules out; (c) left as it is, the lazy option.

Where it applies: S5's repair round 1, then D45. Booked in `plan.md` Rulings.

## Z508 (2026-10-05, from X3f's round-2 brief)

The question: eight choices the round-2 brief of X3f leaves to the orchestrator.

- Chosen: Z466 carried; the rendered half kept, reached from the palette; Title Case menu items; a `headings` field on `api/docs` from the same render; `[TOC]` in `docs/DATA-MAP.md`; Cmd+S always takes the browser's save dialog away; Open in Browser Tab by file name; lucide `file-search`.
- Not chosen: Z466 left out (a ruling unmet); the rendered half removed (a feature dropped, spec.md:85); the old sentence-case words reused; the headings read off the rendered page or parsed twice (the lazy option); an explicit 24-link list that goes stale; Cmd+S bound inside Monaco only (the lazy option); the file kind read when the menu opens.

Where it applies: X3f's repair round 2. Booked in `plan.md` Rulings.

## Z505 (2026-10-05, from Q119's closing, C1)

The question: four rules the readers apply are not a catalog control, `min`, `max` or list: whole numbers, a program name, an extension with its dot, a bundle id.

- Chosen: (a) two catalog words, `whole: true` and `form: program|extension|bundle_id`, read by the one value rule, so every place refuses the same values.
- Not chosen: (b) the readers keep their own rules, two rules for one value; (c) the rules dropped, so `slurm.days: 1.5` reaches `sacct -S`, the lazy option.

Where it applies: S5's repair round 1. Booked in `plan.md` Rulings.

## Z506 (2026-10-05, from Q119's closing, C3)

The question: `readEditorOptions` and `parseRepoSettings` in `editor.ts` hold their own copy of the catalog's rules for the editor's settings.

- Chosen: (a) folded into S5's round 1: both read through the catalog's rule and their copies go.
- Not chosen: (b) a later step, which keeps a second copy until it runs; (c) left as it is, the lazy option.

Where it applies: S5's repair round 1. Booked in `plan.md` Rulings.

## Z503 (2026-10-05, from D45's brief)

The question: D45's user-visible choices 1 to 7 and 9.

- Chosen: (1) `on_file_change`, LaTeX Workshop's default, with `on_save` and `never`; (2) the PDF.js viewer for every PDF, View in Web Browser opening oculus's viewer with SyncTeX through a `BroadcastChannel`; (3) LaTeX Workshop's settings under `latex:` with its defaults; (4) every unsaved tab saved before a build, as `saveAll`; (5) the TeX view in the explorer group at order 5 and in the Explorer arrangement; (6) the project tab's panel kept, drawn from the new store; (7) LaTeX Workshop's keys, each command also on the title bar, the TeX view and the palette; (9) `pdfjs-dist` 6.4.299, a newer release of LA19's library.
- Not chosen: (1) `on_save` only, (2) two viewers for one kind of file and a raw-PDF browser tab, (3) fixed behaviour, (5) an unlisted view, (6) the old rows left, (7) other keys: each the brief's lazy option; (4) (b) saving only the root's files, which is not VS Code's behaviour.

Where it applies: D45 and D15. Booked in `plan.md` Rulings.

## Z494 (2026-10-05, from Q119's brief check)

The question: Q119's brief check found its line numbers moved on S5's tree, sentences outside its paths made false (DESIGN.md:395, HELP.md:261 and :282, `source.ts:85-99`, `rows.ts:10-11`, `boundaries.test.ts:62-63`, `config.test.ts:369-376`), cases that start real processes, a test placement against G13, an upward import, and no rule for which check makes a value wrong when the reader and S5's catalog control disagree.

- Chosen: every finding closed in Q119's brief by a session agent before S5's repair round 1; one rule for wrong, the catalog entry's control, `min`, `max` and values, read by `settings.ts`, so each bound exists once; case 1's synthetic defaults differ from the shipped ones; cases 25 and 26 on case 11's recorders; the look taken at landing.
- Not chosen: two rules, the reader's and the catalog's, kept side by side; the round sent with the brief as it stands and its premises left for the builder to hit, the lazy option.

Where it applies: S5's repair round 1. Booked in `plan.md` Rulings.

## Z495 (2026-10-05, from X3f's diagnosis)

The question: the diagnosis found and proved the causes of three symptoms; one form of symptom 1, no tab opened and the Files view left active (icons.yml and behavior.yml on TEST), has no cause found after 120 double clicks over a timing sweep on a scratch copy.

- Chosen: repair round 2 carries the three proved fixes; at X3f's landing look that form is tried on TEST with the network requests and `document.activeElement` recorded, and a reproduction goes to `/diagnose` with that evidence.
- Not chosen: holding the round until the form is found, which keeps three proved defects in the Files view; dropping the form, the lazy option.

Where it applies: X3f. Booked in `plan.md` Rulings.

## Z496 (2026-10-05, from D23's brief check closing)

The question: D23's user-visible choices UV-1, UV-2, UV-4 and UV-5, and the folder name Z476 named as `<root key>`.

- Chosen: UV-1 (a) a relative include path resolved against the repository root; UV-2 (a) oculus's messages on the language's own channel; UV-4 (a) two palette commands; UV-5 (a) a `references` view in the Explorer group, the AST and Memory Usage as Files sections, as VS Code's clangd draws them; the folder named by 16 hex digits of the SHA-256 of the root's real path.
- Not chosen: UV-1 (b) paths passed as written, the lazy option; UV-2 (b) a Hub channel and routes, two paths that can arrive out of order; UV-4 (b) one command with modes; UV-5 (b) a rail button, which changes Axel's rail table, and (c) results under the file tree.

Where it applies: D23. Booked in `plan.md` Rulings.

## Z497 (2026-10-05, from D38's brief)

The question: D38's user-visible choices 2 to 13.

- Chosen: each recommendation of the brief: (2) one request per source, merged on the page as each answers; (3) the states ok, limited, timeout, refused, failed, no-key, skipped; (4) one type list mapped to each source; (5) relevance asked of each source, the merged list sorted on the page, on the probe evidence that Crossref and Europe PMC sort by date wrongly; (6) a More control; (7) one hit per DOI, PubMed id or arXiv id, a preprint joined to its published version when a source names both; (8) a small Add form with bucket, project, relevance and why preset; (9) markup stripped and banned characters folded, names kept; (10) `literature:` in `behavior.yml` with `timeout_s: 20`, `per_source: 25`, `cache_min: 30`; (11) the incoming group at order 5, glyph `book`; (12) the tab's instance state, keyless toggles disabled with their key named; (13) a DOI query looked up by DOI.
- Not chosen: the brief's lazy options, (2) one request for all, (3) ok and failed, (4) untranslated types, (6) one page, (7) DOI alone, (8) one press, (9) text as given, (10) constants, (12) a list in `behavior.yml`, (13) a DOI sent as text.

Where it applies: D38. Booked in `plan.md` Rulings.

## Z493 (2026-10-05, from Q119's brief check, section 9)

The question: Q122: `config/catalogs/options.yml:3` and `:9` and `catalog/options.ts:145` define an option's `default` as "the value the tracked file holds", and no check holds it; the shipped files agree today (108 leaf entries, 0 differing).

- Chosen: (b) the three places say what `default` is: the value the Settings view's Reset writes and its Modified filter compares with, and for the settings `settings.ts` reads, the value used when the key is missing or wrong; Q119's case 9 holds that each shipped default reads through its reader.
- Not chosen: (a) a test holding each default equal to the file's value, which goes red after every Settings save and forbids the Modified state S5 builds; leaving the sentence as it is, the lazy option.

Where it applies: S5's repair round 1. Booked in `plan.md` Rulings.

## Z474 (2026-10-05, from D42's review)

The question: D42's review Spec 1: paging by `<hash>^` walks the first parent only, so the page after a merge, or after a side-branch commit at a page boundary, leaves out commits that changed the file; `--skip` under `--follow` repeats the first page on git 2.49.0 (Z434).

- Chosen: (a) the cursor and the answer keep their shape; the server reads the log from HEAD in git's order and answers the 50 rows after the cursor's row, so every page is a slice of one ordering and no commit is lost or repeated.
- Not chosen: (b) the first-parent paging kept, which loses commits in any repository with merges (the lazy one).

Booked in `plan.md` Rulings.

## Z475 (2026-10-05, from D42's review)

The question: D42's review, declined to judge: Open Timeline on a file while a pin holds another file releases the pin (the builder's judgment call).

- Chosen: (a) kept: the reader names a file by the command, so the Timeline shows it, and HELP.md says the pin is released.
- Not chosen: (b) the pin kept and the command showing nothing, which reads as a broken command (the lazy one).

Booked in `plan.md` Rulings.

## Z468 (2026-10-05, Axel)

Axel ruled that no step is ever added: the content of Q118, Q119, Q121 and Q122 is folded into S5 (Q119, Q122) and D33 (Q118, Q121), nothing dropped. Booked in `plan.md` Rulings.

## Z462 (2026-10-05, from Q119's brief)

The question: Q119's brief shares `config/catalogs/options.yml` with S5, which rewrites the entries whose descriptions Q119 edits, and HELP.md:282 and DESIGN.md 358-431 with D11.

- Chosen: (a) Q119 is prepared once S5 has landed, its line numbers read again then; D11, prepared after S5 and H3, follows Q119 in the queue where they share lines.
- Not chosen: (b) prepared now and merged by hand at landing, which the `spec` skill rules out for a merge judged not simple (the lazy one).

Booked in `plan.md` Rulings.

## Z463 (2026-10-05, from Q119's brief)

The question: Q119's brief decision 10: a wrong `port` in behavior.yml while the server runs takes its default under G13, which moves the server to 8790.

- Chosen: (a) the port takes its default as every other setting does, the move stated in HELP.md with its before and after, as G13's words say.
- Not chosen: (b) the port in force kept as a special case, an exception G13 does not name (the lazy one).

Booked in `plan.md` Rulings.

## Z464 (2026-10-05, from Q119's brief)

The question: Q119's brief premise 2: `config/catalogs/options.yml:3` cites `tests/checks/config/options-catalog.test.ts`, which does not exist, and nothing holds a catalog `default` to the tracked file's value.

- Chosen: (a) a step of its own, Q122: the sentence at `options.yml:3` made true, by naming the check that holds each catalog `default` equal to the tracked value or, if none is to exist, by saying what does.
- Not chosen: (b) left as a false sentence (the lazy one).

Booked in `plan.md` Rulings.

## Z458 (2026-10-05, from Q118's brief)

The question: Q118's brief O1: an Audit row has no place link (`Audit.svelte:124-126`) and `AuditFinding` carries no file (`data/model/index.ts:258-264`), so Enter on a row has nothing to open.

- Chosen: (a) each finding carries `file`, the hub-relative path it is about (empty for a missing file or a folder); the place becomes a link that opens it in a source tab, and Enter presses it, as VS Code's Problems list opens a row on Enter; the signature does not read `file`, so every mute is kept.
- Not chosen: (b) Enter presses the mute control, which writes `behavior.yml` from a key press and is not what VS Code gives a row's Enter; (c) Enter does nothing (the lazy one).

Booked in `plan.md` Rulings.

## Z459 (2026-10-05, from Q118's brief)

The question: Q118's brief O2: Enter on a Focus lane card does nothing, its name button carrying no `dataCardToggle` (`LaneCard.svelte:107-109`).

- Chosen: (a) folded into Q118: the name button gets `dataCardToggle`, `LaneCard.svelte` joins the write list.
- Not chosen: (b) a step of its own for one prop; (c) left dead (the lazy one).

Booked in `plan.md` Rulings.

## Z460 (2026-10-05, from Q118's brief)

The question: Q118's brief Decision 4 leaves the doc line of `ToolButton.svelte:106` ("Marks the project-card control...") false once the Audit and the lane card use `dataCardToggle`, and books its rewrite with a later split of the file.

- Chosen: (a) Q118 rewrites that one doc line to name what the prop marks on any card, as a one-line change that keeps the file at its line count, so `ToolButton.svelte` joins the write list.
- Not chosen: (b) booking the rewrite with a later split, leaving a false comment on main (the lazy one).

Booked in `plan.md` Rulings.

## Z461 (2026-10-05, from Q118's brief)

The question: Q118's brief records that a held card cursor may be lost on a reload, since the shell reconciles before a view's channel sends its first rows, for every view that reads the cursor, while the cursor is kept in the instance state the layout restores.

- Chosen: (a) a step of its own, Q121: the card cursor survives a reload in every view that reads it; diagnosed first, then built.
- Not chosen: (b) recorded as a case of Q118 and left (the lazy one); (c) folded into Q118, which is about the Audit rows and would grow into the shell's reconcile.

Booked in `plan.md` Rulings.

## Z454 (2026-10-05, from D11's brief check)

The question: D11's brief check case 31: `loadLocal` (`data/sources/config/local.ts:163-172`) throws on the first wrong `local.yml` key and `loadLocalOrDefaults` (:349-359) then uses every default, against G13 (a wrong value gives a finding naming the key and that key's default is used).

- Chosen: (a) Q119 widened to the readers of `local.ts`: a wrong key gives its finding and only that key takes its default; D11's case 31 expects the finding `local.yml: rite_dap_bin must be a non-empty string`, which holds before and after Q119. The code breaking an approved rule is a defect, fixed as Z443 fixes `settings.ts`.
- Not chosen: (b) a second step for `local.ts`, splitting one defect of one rule over two steps; (c) D11 alone fixing `local.ts` for its own key, which leaves every other key under the defect (the lazy one).

Booked in `plan.md` Rulings.

## Z455 (2026-10-05, from D11's brief check)

The question: D11's brief check N7 and N8: D11's brief shares `config/catalogs/options.yml` with S5 (adjacent hunks at the `claude_bin` and `open_bin` entries, and S5 gives each local.yml entry a `section:` the new `rite_dap_bin` entry then needs) and `config/text/app.yml` line 12 with H3 (one physical line both rewrite).

- Chosen: (a) D11 is prepared once S5 and H3 have landed, as the `spec` skill's Steps 5 says for a merge that is not simple; its brief check findings are closed now, and its premises are read again at its preparation.
- Not chosen: (b) D11 prepared now and the two files merged by hand at landing, which the skill rules out for a merge judged not simple (the lazy one).

Booked in `plan.md` Rulings.

## Z456 (2026-10-05, from D11's brief check)

The question: D11's brief check, declined to judge: whether a debug launch from a repository with no `.oculus/launch.yml` runs with no approval question, while `DESIGN.md:153` names a debug launch among the processes that need approval and Z92 says a launch runs after that approval.

- Chosen: (a) every debug launch asks the approval DESIGN.md:153 requires, the default configuration included, keyed by its launch text as a configured one is.
- Not chosen: (b) the default configuration launching without a question, which breaks DESIGN.md:153 (the lazy one).

Booked in `plan.md` Rulings.

## Z457 (2026-10-05, from D11's brief check)

The question: D11's brief check P6: rite_dap's `evaluate` of an undefined name adds that name to the frame's Module scope as `<undefined>`, so a hover over a comment word or a special form changes what the Variables section shows.

- Chosen: (a) the hover evaluates only a word that a scope of the paused frame already holds (read from the published variables), so a hover never writes into the adapter; a watch and a console line evaluate as the reader typed them, and Variables shows what the adapter answers.
- Not chosen: (b) the client hiding `<undefined>` entries, which hides a value the adapter reports; (c) a fix in cathedra's adapter, outside this repository and this plan (the lazy one for this step, since it leaves the hover writing).

Booked in `plan.md` Rulings.

## Z453 (2026-10-05, step X3f's landing)

The question: the landing look found the keyboard not in the kept tab's editor after a double click (round 1 item 7), cause not known.

- Chosen: (a) X3f lands with its three fixes at landing; the defect is step Q120, its cause found with /diagnose first.
- Not chosen: (b) X3f held off main until the cause is found, holding back the parts the look found working.

Where it is built: step Q120. Booked in `plan.md` Rulings.

## Z442 (2026-10-05, step X3e)

The question: The write-token sentence of `server/core/auth.ts:97` is answered by every route, so capitalising it changes routes outside git.

- Chosen: (a) the sentence is worded once in the server catalog as the other server sentences become (Z439's neighbour, the brief's Decision 8), every route answering it changes with it, and the eleven test assertions quoting the old words follow.
- Not chosen: (b) a second git-only sentence beside it, which says one refusal two ways; (c) leaving it lower case (the lazy one).

Where it is built: X3e's brief, D5. Booked in `plan.md` Rulings.

## Z437 (2026-10-05, step S5)

The question: S5's new list check would refuse the G9 route test's input `'queued'`, and its new catalog-findings test needs a guarded entry.

- Chosen: (a) the input becomes `'revision'`, a status the list holds, so the test still proves a list write's undo through the route; T1 joins G13.
- Not chosen: (b) leave `waiting_status` unchecked by the server (the lazy one), which accepts a value the page refuses.

Where it is built: S5's brief, Decision 25, and `agents/guarded.md` G13. Booked in `plan.md` Rulings.

## Z434 (2026-10-05, step D42)

The question: How D42 pages a file's history, since `--skip` under `--follow` counts the whole walk and repeats page one.

- Chosen: a cursor `before=<hash>` with the path at that commit, which pages correctly (probe: `git log --follow -51 e6ef04947^ -- tools/oculus/HELP.md`).
- Not chosen: (b) read the whole history once and page on the client, which reads every commit of a 1,000-commit file to show 50; (c) keep the cap of 50 with no paging (the lazy one), which hides history.

Where it is built: D42's brief. Booked in `plan.md` Rulings.

## Z435 (2026-10-05, step D42)

The question: D42's user-visible shapes (menu items, row content, date, section controls, tab label) were taken in the brief without booking.

- Chosen: the brief's options (a) for each, as VS Code's Timeline has them.
- Not chosen: the smaller options (author only, no controls, no menu item), the lazy ones, which leave the Timeline short of VS Code's.

Where it is built: D42's brief. Booked in `plan.md` Rulings.

## Z436 (2026-10-05, step H3)

The question: H3's brief check found lines the map makes false outside its write list, a third map it did not name, and no later step keeping the map true.

- Chosen: widen H3 to those lines and add the map to M6's and M8's paths.
- Not chosen: (b) leave them for a later step (the lazy one), which ships a map false at M6's landing and a README calling itself the map.

Where it is built: H3's brief. Booked in `plan.md` Rulings.

## Z433 (2026-10-05, step D44)

The question: whether D44's two checks become guarded tests: Submit runs only a confirmed plan equal to the server's plan at the press, and the warning for a job script that never uses `/local/$SLURM_JOB_ID`.

- Chosen (a): both guarded, in `tests/server/machine/hpc/submit.test.ts`, since a failure of either runs a job against the cluster's I/O rule or one the reader did not confirm.
- Not chosen: (b) neither guarded, checked by quoted runs and the look only (the lazy one), which lets a later change drop either check unseen; (c) only the first, which leaves the scratch warning unprotected.

Where it is built: D44's brief at its /spec run. Booked in `plan.md` Rulings.

## Z430 (2026-10-05, step D44)

The question: where Submit copies a project's code on the cluster. Only btfno's cluster folder is `~/projects/<id>`; six projects' run scripts read their code from another folder by absolute path.

- Chosen (b): a manifest key `paths.cluster` in the path overrides, default `~/projects/<id>`, with D44 writing the six values read from each project's own run script; rsync copies the project's `code/` folder.
- Not chosen: (a) always `~/projects/<id>` (the lazy one), which makes six projects' jobs run their old code; (c) a file on this machine only, which hides a project fact from its manifest; (d) reorganising the cluster folders and scripts first, a different concern.

Where it is built: D44's brief. Booked in `plan.md` Rulings.

## Z431 (2026-10-05, step D44)

The question: which reader parses a job script for Submit's scratch check.

- Chosen (a): `sh-syntax` 0.7.0, MIT, no dependencies, which reads quotes, comments and here-documents.
- Not chosen: (b) `shell-quote`, which reads one command line and no here-document; (c) a hand-written reader (the lazy one).

Where it is built: D44's brief. Booked in `plan.md` Rulings.

## Z427 (2026-10-05, step D37)

The question: Cmd+Z after Format Document on a `.tex` file does not undo the format, and reading the code did not find why.

- Chosen (a): diagnose it on TEST with `/diagnose` while D37 builds, `latex.formatter` set to `tex-fmt` for the probe and put back; the fix joins D37 as a repair round.
- Not chosen: (b) diagnose it at D37's landing look, which needs its own step for the fix; (c) drop it (the lazy one), which leaves HELP.md false.

Where it is built: D37's Step 0 in `plan.md`. Booked in `plan.md` Rulings.

## Z429 (2026-10-05, step X3f)

The question: X3f's builder found that case 33 (a removed file pressed opens the cannot-open line) has no rule in the brief; today a removed file of a name outside the named formats opens a download tab with a dead link.

- Chosen (1): a 404 is read as a `missing` kind and opens the source tab's cannot-open line with Retry, as VS Code opens an editor saying the file was not found; three paths join the step.
- Not chosen: (2) open nothing and say it in the Files view, a new place to say it that nothing names; (3) reword the case to the download tab, which keeps a dead link (the lazy one).

Where it is built: `agents/briefs/X3f-cases.md`. Booked in `plan.md` Rulings.

## Z428 (2026-10-05, step S5)

The question: S5 needs a heading for every option and a control for every text, list and family field, and the catalog keys that say them.

- Chosen: the table and the decisions of `agents/briefs/S5.md`; each field takes the control its value needs (a choice of a short list or of another list's keys, a glyph, a hue or palette colour picker, a multi-pick, a folder or file box, a nested sub-editor), text only for free words and for names the reader makes up.
- Not chosen: keeping text boxes for the fields whose values come from a list (the lazy one), and per-option control code in the view in place of catalog keys, which would put the vocabulary outside `options.yml`.

Where it is built: S5's brief. Booked in `plan.md` Rulings.

## Z151 (2026-10-01 11:43, step Q88b)

The question: building the Files view's file operations takes user-visible choices the plan leaves open: whether they show in History with an undo, their route, the label of a two-file diff, the name rule, Upload's limit, the delete question, where the clipboard lives, what of the Explorer stays X3a's, how local.yml is guarded, where Find in Folder shows, and what a read-only row offers.

- Chosen (a): as Q88b's brief, Decisions 1 to 11: not recorded in History (History is the log of `api/write`'s structured writes, and a source save is not in it either); `POST /api/ops` and `GET /api/ops` for the compare; `{left} vs {right}`; VS Code's macOS name rule; files under the 32 MiB body cap the server has; the delete question always shown, no opt-out key; the clipboard and the compare selection page-wide; multi-select, drag and drop, Duplicate, the title-bar buttons, the Explorer's keys and the menu's key hints X3a's (VS Code's macOS rename key is Enter, which opens a file in oculus; booked on X3a's line for its /spec), the wire shapes taking lists; `config/local.yml` protected from every write and copy through the Files view (it holds this machine's secrets), its compare allowed as the source tab reads it; Find in Folder on every folder row, a root's included, and the root's Find in Workspace gone, as VS Code's source places them; the write items on every row with `denied` said, since a listing has no writable flag.
- Not chosen: (b) each operation a write kind of `api/write`, recorded in History with an undo, which needs a record shape for files and an inverse for a Trash move that `trash` does not report.

Where it is built: Q88b's brief, "Decisions taken in this brief". Booked in the state file's closed log and `plan.md` Rulings.

Reviewed 2026-10-02 (Axel's review of every choice): built wrong. VS Code's Explorer undoes its file operations (`explorer.enableUndo`, default true) and puts the delete question behind `explorer.confirmDelete`. Ruled by Axel: file operations go into History with undo and the delete question gets a setting; built in X3a (Z197).

## Z150 (2026-10-01 11:40, step Q88b)

The question: Q88b's line covers three surfaces, each the size of a step: the Files view's file operations (New File, New Folder, Rename, Delete to the Trash, Cut, Copy, Paste, Upload, Compare Selected, Reveal in Finder, Find in Folder), the Source Control rows' git operations (thirteen, each a new server write or read), and the pane strip (Lock Group, New Text File, the Tab Bar and Editor Actions settings) with the page-wide right-click handler.

- Chosen (a): split by surface into Q88b (Files), Q88c (Source Control, after Q88b, which brings `trash`) and Q88d (the pane strip and the right-click handler), as S3 and X3 were split. X3c waits for Q88d, X3a for Q88b.
- Not chosen: (b) one step for all three, one builder and one review across three surfaces.

Where it is built: `plan.md`'s Q88b and Q88c lines. Booked in the state file's closed log and `plan.md` Rulings.

Axel's review (Z152, 2026-10-01 13:11): Q88c and Q88d merged into one step Q88c, after Q88b and S3c; X3c waits for Q88c. Q88b stays its own step (in flight).

## Z149 (2026-10-01 11:08, step S3c)

The question: S3c's brief check found three things the brief left open about the Settings editor. (1) The rail editor and Reset all pages, drawn as the controls of the `rail` and `arrangements` rows, each carry their own heading; (2) what Modified and Reset mean for a "This browser" row; (3) the ui store keeps a seventh per-browser value, the terminal text size, that the brief did not list.

- (1) chosen (a): drawn as a row's control, each leaves out its own heading, since the row's title and the catalog's description stand in its place; their sentence about what a row is stays. Not chosen: (b) both headings kept under the row's title, a heading twice.
- (2) chosen (a): a "This browser" row is Modified when this browser holds a value of its own, and Reset Setting forgets that value so the config's default applies; the ui store takes null for the wallpaper and the code theme as it does for the text size. Not chosen: (b) no Modified or Reset on those rows, the lazy option.
- (3) chosen (a): the terminal text size is a "This browser" row. Not chosen: (b) left to the terminal's own font tools only, the lazy option.

Where it is built: S3c's brief, "The step's line and its rulings" and What to build 1 and 2. Booked in the state file's closed log and `plan.md` Rulings.

## Z142 (2026-10-01 06:19, step X3d)

The question: X3d's landing look on TEST showed two differences that are on main before the step: a pane's header actions wrap onto a second line when the pane is narrow and its title long (`Pane.svelte`'s `.tools`, about 480 px), and an open editor or diff keeps the old theme's colours after a live theme switch. (1) Fold both into U2, the step that audits every view's look against VS Code's; (2) a step of their own.

- Chosen (1): U2's What to build 3 and its case 11 carry both. Not chosen: (2) a new step, which would split work U2 exists to do.

## Z141 (2026-10-01 05:31, step X3d)

The question: Round-1 ruling 20 said the change row's status letter keeps its mono font; it is drawn in the interface font (`ChangeRow.svelte:212`), which the first build's audit requires, so the ruling's premise was wrong. (1) Keep the interface font, as built. (2) Mono and the audit changed. Neither is the lazy one.

- Chosen (1): the interface font, as built. Not chosen: (2) mono with the audit changed.

Reviewed 2026-10-02 (Axel's review of every choice): the outcome is right and the reason given was not one; the reason is VS Code's. VS Code draws the letter as `.monaco-icon-label:after{opacity:.75;font-size:90%;font-weight:600;...}` (its `workbench.desktop.main.css`), with no font family of its own, so the letter is in the label's interface font, as built.

## Z140 (2026-10-01 05:31, step X3d)

The question: Round-1 ruling 4 asked for one shared declaration of the diff pane's and its file header's wall surface; `tests/ui/theme/colours.test.ts` and `wall.test.ts` accept under `body.wall` only a surface token or the literal `color-mix(in srgb, var(--chip) var(--wall-panel), transparent)`, which 13 components repeat.

- Chosen (2): one surface token, the checks taught it, all 13 components on it, at X3d's landing. Not chosen: (1) two literals and an audit (lazy); (3) one component for header and pane.

## Z139 (2026-10-01 03:36, step X3d)

The question: a renamed file in a group diff is drawn as a new file, since `GitEntry` (`model-sessions.ts:323`) holds no old path.

- Chosen (1): `GitEntry` gains `from`, read with rename detection, and the group diff draws "R" and the old path, in X3d's repair round. Not chosen: (2) leave it (lazy).

## Z137 (2026-10-01 03:20, step Q109)

The question: the names of D30's four keys under `terminal:` in `config/appearance.yml`, which Z82 (a) named only by meaning.

- Chosen (a): VS Code's names for the same settings in the file's snake case: `mac_option_is_meta` (false), `copy_on_selection` (false), `cursor_style` (`block`, `line` or `underline`, VS Code's words; `line` is xterm's `bar`) and `cursor_blinking` (false), each default today's behaviour. Not chosen: (b) names of our own (Option as Meta as `option_meta`), which a reader who knows VS Code would have to learn again.

## Z136 (2026-10-01 03:20, step Q109)

The question: the capped debounce Z135 asks for is a debounce with a maximum wait, which `perfect-debounce` (the five server watchers' only debounce, `grep -rln perfect-debounce src tests`) lacks; `libraries: check` names the candidates: `es-toolkit` 1.52.0 (MIT, Toss, released 2026-08-28, own types) whose `es-toolkit/compat` `debounce` takes `maxWait`, `lodash-es` 4.18.1 (MIT, needs `@types/lodash-es`), or a cap written by hand around `perfect-debounce`.

- Chosen (a): `es-toolkit`'s `debounce` from `es-toolkit/compat` with `maxWait` in all five watchers, and `perfect-debounce` removed from `package.json`, so the server has one debounce. Not chosen: (b) `lodash-es` (two packages for the same function); (c) a cap written by hand (lazy, code a library already has).
- Corrected by the orchestrator, automode, at Q109's brief check (`agents/reviews/Q109-brief-check.md`): to (b) `lodash-es` 4.18.1 (MIT, released 2026-04-01) with `@types/lodash-es` 4.17.12, `perfect-debounce` removed. es-toolkit's `maxWait` is checked only when the debounced function is called, so writes every 450 ms publish a change 1150 ms late against a 1000 ms bound; lodash fires on a timer at `maxWait` (1450, 2450 under the same writes) and raises `maxWait` to at least the wait. Not chosen: (a) es-toolkit kept with the bound widened to `maxWait` plus the quiet (lazy, a check loosened); (c) a cap written by hand (code a library already has).

Reviewed 2026-10-02 (Axel's review of every choice): the first choice, es-toolkit, was wrong and is corrected above to lodash-es. `package.json:26` holds `@types/lodash-es` and `:69` `lodash-es`, and neither `es-toolkit` nor `perfect-debounce` is in it; `maxWait` is passed in `usage/watch.ts:141`, `watch/local.ts:49` and `watch/bookmarks.ts:84`.

## Z131 (2026-10-01 03:08, step S3a)

The question: whether the week's ticker lines follow `focus_label_mode` with the lane cards, reversing a clause of Axel's Z120 (a). Axel: "you decide 131".

- Chosen (a): cards and ticker lines both follow the key, as S3a built it; one setting governs every project name on the Focus board, and the default `short` changes nothing on screen. Not chosen: (b) the ticker keeps the short handle (lazy, the narrower reading).

## Z135 (2026-10-01 03:10, step Q109)

The question: the same restarting perfect-debounce with no maximum wait holds four more watchers back under steady writes: `machine/usage/watch.ts:94` (500 ms, which also watches Claude's session store and so is held while a session works, its 60 s clock the only update), `root/watch/portfolio.ts:396` (200 ms), `root/watch/bookmarks.ts:69` (500 ms) and `root/watch/local.ts:32` (200 ms); found by Q109's diagnosis 3 by reading, confirmed by `grep -rn perfect-debounce src/lib/server`.

- Chosen (a): Q109 makes the cap one shared helper and puts every one of the five watchers on it, each with a test under steady writes, since its subject is the same defect. Not chosen: (b) a step of its own (a tiny step); (c) only the sessions watcher capped (lazy).

## Z134 (2026-10-01 02:47, step Q109)

The question: the `sessions` channel publishes nothing while a session store is written more often than every 500 ms (one debounce with no maximum wait, `src/lib/server/root/watch/sessions.ts:209-216`).

- Chosen (a): diagnosed and fixed in Q109, whose subject is the terminal list reaching the page. Not chosen: (b) a step of its own; (c) nothing built (lazy).

## Z133 (2026-10-01 02:23, step S3a)

The question: `title:` and `icon:` on the `collections` rows of `config/sources.yml` have no reader (`src/lib/data/index.ts:60-69` keeps `key` and `file`).

- Chosen (a): remove them, as Z130 (a) removed keys no code reads; in S3a's repair round 1. Not chosen: (b) keep them (lazy). `tier:` on the `scan` rows is read by the Projects tab's count split and stays.

## Z132 (2026-10-01 02:23, step S3a)

The question: `map_label_mode` says `title` for the full title where the other label modes say `full`.

- Chosen (a): the map takes `short|full`; in S3a's repair round 1. Not chosen: (b) leave the map's word (lazy).

## Z122, taken off this list (2026-10-01 02:23)

Z122 reverses a clause of Axel's Z120 (a), which automode leaves to him; it is open item Z131.

## Z130 (2026-10-01 01:08, step S3a)

S3a's first run: `board.no_funding.label`, `board.no_funding.sub` (`config/layout.yml:132-134`) and `indexes` (`config/sources.yml:64-69`) have no reader in `src`, so the options catalog can neither leave them out nor describe them truthfully. (a) Remove the three keys and their comments; for: the catalog and the files agree, and the Settings editor offers no option that does nothing; against: two more paths for S3a. (b) Build readers; for: nothing removed; against: the no_funding words would duplicate the text catalog, and `indexes` would be a feature no plan line names. (c) Keep them with entries saying nothing reads them; for: no change to the files; against: inert options in the editor. Closed (a): nothing reads them (the cockpit reads its own copy, `tools/cockpit/data/config/layout.yml:128`). The lazy option was (c).

## Z128 (2026-10-01 00:10, step Q107)

The question: two browser tabs each write the ui store whole, so one drops the other's instance records.

- Chosen (a): `save` merges into the saved records and the store follows another tab's saves, the appearance staying each tab's own; in Q107's repair round. Not chosen: (b) only the docs corrected (lazy).

## Z126 (2026-10-01 00:08, on Axel's question whether other steps are too tiny)

The question: which queued steps are small enough to fold into a step they belong with.

- Chosen (a): D26 into D27 (one extension-to-language map, one grammar loader), D29 into D25 (the editor's per-language options), D30 into Q109 (the terminal), D34 into D23b (two more servers on D23's relay), A2 into D20 (starting an agent session). Kept: D15 (widened to `pdfjs-dist` and SyncTeX both ways, not small), D31 (a git poller no queued step covers), the Q85a steps (Z96, Axel's split; Z127). Not chosen: (b) leave them as steps (lazy).

## Z125 (2026-10-01 00:03, on Axel's word against tiny steps)

The question: where the `focus_label_mode` reader (Z120, Z122) and the `stale_days` fold (Z123) are built.

- Chosen (a): inside S3a, whose catalog describes both keys. Not chosen: (b) one small step holding both (lazy, and a tiny step).

## Z123 (2026-10-01 00:00, step S3a's brief check; adds Q113)

The question: `stale_days` and `refresh_stale_days` both set a feed's staleness (`feeds.ts:56-65`), the later always winning, and `stale_days.audit` has no reader.

- Chosen (a): `refresh_stale_days` is the one key, `stale_days` and the fallback `STALE_DAYS` in code removed; built in S3a (Z125). Not chosen: (b) keep both, the catalog describing the dead values (lazy).

## Z122 (2026-10-01 00:00, step Q112)

The question: Z120 (a) had the comment drop the "This week" ticker on the wrong fact that oculus has none; the Focus board draws it and names projects through the same `labelOf` as the cards.

- Chosen (a): the cards and the ticker lines both take `focus_label_mode`, and the comment keeps the ticker. Not chosen: (b) cards only, the comment dropping the ticker (lazy).

Reviewed 2026-10-02 (Axel's review of every choice): Z120 (a) first reversed Axel's ruling on the ticker; this entry and Z131 put it back. The ticker reads `focus_label_mode` (`src/lib/state/boards/ticker.ts:195`) and names projects through `focusLabel(project, labelMode)` at lines 215, 337 and 382.

## Z121 (2026-09-30 23:41, steps S3a and S3b)

The question: four details of the options catalog.

- (1) chosen (a): the file holds one top-level key `options:`, so the merged config gains one key and not six keys named after files. Corrected 23:58 from S3a's brief check: the reason given first, that every other catalog holds one key named for itself, is wrong for `vocab.yml`, which holds 24; the choice stands on the reason above. Not chosen: (b) the six config file names as top-level keys.
- (2) chosen (a): an option's default is the value the tracked file holds. Corrected 23:58 from S3a's brief check: the clause "`null` where leaving the key out means something" is dropped, since the two keys it named hold values in the tracked file (`terminal.font_px: 12.5`, `wallpaper.popover_opacity: 0.97`); their defaults are those values, and their descriptions say what leaving the key out does. Not chosen: (b) the code's fallback, which most readers do not have (lazy).
- (3) chosen (a): a number is refused when oculus's own config readers refuse it, so no min or max fields. Not chosen: (b) `min`, `max` and `integer` in each entry.
- (4) chosen (a): the catalog check fails on a missing or empty description. Not chosen: (b) no such check (lazy).

Reviewed 2026-10-02 (Axel's review of every choice): two reasons were wrong when first given and are corrected above; the built file is right. `grep -c "^options:" config/catalogs/options.yml` prints 1 and the file has 1 top-level key; `config/appearance.yml:32` holds `font_px: 12.5` and `:49` holds `popover_opacity: 0.97`, the defaults the catalog takes.

## Z119 (2026-09-30 23:41, step S3)

The question: whether the Settings editor is one step. Its brief check judged it too large for one builder.

- (a) chosen: three steps, S3a the catalog and its check, S3b the `config-key` write, S3c the editor after both, as Z96 split Q85a.
- (b) not chosen: one step (lazy).

## Z118 (2026-09-30 23:24, step S3)

The question: four shapes of the Settings editor and its catalog that Z94 left open.

- (1) chosen (a): a family of records (the themes, the rail, the arrangements, the collections and the like) is one catalog entry with a `fields:` map explaining each field once. Not chosen: (b) the family explained in one description (lazy).
- (2) chosen (a): every option carries its default except a family and a `local.yml` key. Not chosen: (b) families carry their shipped records as a default.
- (3) chosen (a): the Modified filter is `@modified` typed in the search box, with a filter button that types it, as VS Code does. Not chosen: (b) a checkbox beside the search.
- (4) chosen (a): the per-browser appearance values stay in the Settings view as a group "This browser", and the rail editor and Reset all pages are the controls of their rows. Not chosen: (b) moved out of the Settings view (lazy).

Where it is built: S3's brief, "Decisions taken in this brief" 1 to 4. Booked in the state file's closed log and `plan.md` Rulings.

## Z117 (2026-09-30 22:58, step Q106)

The question: after the dialog fix, where is the keyboard once a tab of another pane is chosen in the palette (Cmd+K)?

- (a) chosen: the chosen tab becomes the active tab and the keyboard goes to it, as VS Code's Quick Open does.
- (b) not chosen: the keyboard goes back to where it was before Cmd+K, so the chosen tab is shown but the other pane stays active. This was the lazy option (no code).

An editor action from the palette (Add Line Comment, Fold All) moves no tab, so the keyboard stays in the editor; the palette's `:tab` and `:goto` commands land on their tab as a picked tab does.

Where it is built: Q106's brief, item 6 (`Palette.svelte`'s `choose` and `run`) and case 19; `HELP.md:90` and `DESIGN.md:218` say it. Booked in the state file's closed log and `plan.md` Rulings.

## Z153 (2026-10-01 13:39, step S3c)

The question: the Terminal text size box and a config number row read a number by one rule; that rule accepts an exponent, so `1e1` is 10.

- Chosen (a): one rule, `1e1` read as 10 in both; `0x10`, `Infinity`, `1,5` and `1x` refused with the config row's message.
- Not chosen: (b) exponents refused in both, which changes a config row's answer; (c) a second rule only for the box.

Where it is built: S3c's round 1. Booked in the state file's closed log and `plan.md` Rulings.

Reviewed 2026-10-02 (Axel's review of every choice): the outcome is right and the reason given was not one; the reason is VS Code's. VS Code reads a number setting with `parseFloat` (`static float(o,e){return typeof o=="string"&&(o=parseFloat(o)),...}` in its `workbench.desktop.main.js`), which reads `1e1` as 10. VS Code would read `0x10` as 0; oculus refuses it with the config row's message instead of reading a wrong number.

## Z154 (2026-10-01 14:12, step Q85b)

The question: seven answers of the state layer that Q85b's rulings did not name, N1 to N7 of its final report.

- Chosen (a), as built: a channel payload checked once per frame by the socket; an agents answer with lists of the wrong type a failed read; a deposit state that is not whole read as none; a lookup by `constructor` or `__proto__` answers nothing; a search body that is null or not JSON says `HTTP 200`; a terminal counts as busy only when `busy` is `true`; a start answer with an id of the wrong type started with no id.
- Not chosen: a schema pass on every read of a payload; partial values whose type says they are whole; the old answers.

Where it is built: Q85b. Booked in the state file's closed log and `plan.md` Rulings.

Reviewed 2026-10-02 (Axel's review of every choice): built wrong. The seven answers were accepted as built without judging each, and a search can fail with the words "HTTP 200" (`src/lib/state/sources/search.svelte.ts:127`). Ruled by Axel: each answer judged on its own and the search error made a sentence; built in D32 (Z197, Z198).

## Z155 (2026-10-01 14:56, step Q85b)

The question: an `/api/agents` answer of 200 whose body lacks the `agents`, `accounts` or `findings` list was handed to the view, which then throws reading `agents.find`.

- Chosen (a): a missing list makes the answer a failed read, as a list of the wrong type already does.
- Not chosen: (b) keep handing such a body on, which keeps the throw.

Where it is built: Q85b's round 1. Booked in the state file's closed log and `plan.md` Rulings.

## Z156 (2026-10-01 14:56, step Q88b)

The question: a search scoped to a folder that is not there showed the route's English text, never the catalog sentence.

- Chosen (a): the 400 body carries the refusal word `refused` beside `error`, and the page says the catalog sentence for a word it knows.
- Not chosen: (b) the page matching the route's English text.

Where it is built: Q88b, as the builder's report states it. Booked in the state file's closed log and `plan.md` Rulings.

## Z157 (2026-10-01 15:03, step U3)

The question: a 22 px header (Z146) cannot hold a 26 px search box or text button, so where do a view's inputs and filters go.

- Chosen (a): the header holds the title and 20 px icon actions, with an overflow opener for what does not fit; a bar under the header holds the search boxes, selects, segments, filter toggles and the text buttons whose words carry state.
- Not chosen: (b) a header that grows to hold inputs; (c) every control behind the overflow opener.

Where it is built: U3. Booked in the state file's closed log and `plan.md` Rulings.

## Z158 (2026-10-01 15:14, step Q88b)

The question: the Delete question of a link to a folder said "and its contents", because the listing could not tell a link from a folder.

- Chosen (a): the listing's entry carries `link: true` for a symbolic link, and a link takes the file message.
- Not chosen: (b) keep the folder message for a link.

Where it is built: Q88b's round 1. Booked in the state file's closed log and `plan.md` Rulings.

## Z159 (2026-10-01 15:14, step Q88b)

The question: whether a Cut paste that never reached the server clears the clipboard.

- Chosen (a): it keeps the Cut, since nothing moved; a paste the server refused clears it.
- Not chosen: (b) clear it on every failure.

Where it is built: Q88b's round 1. Booked in the state file's closed log and `plan.md` Rulings.

## Z160 (2026-10-01 15:22, step U3)

The question: the header keeps icon actions only, and the add actions have no glyph.

- Chosen (a): one new glyph `add` (Lucide `plus`) for the add actions; other actions without a glyph go to the bar as text buttons.
- Not chosen: (b) a glyph for every such action; (c) the add actions in the bar.

Where it is built: U3. Booked in the state file's closed log and `plan.md` Rulings.

## Z161 (2026-10-01 15:36, step U3)

- Chosen (A): U3 changes `TabFace.svelte`'s `.cells` to `--fs-xs` and its focus ring to 1px offset -1px, with that file's type-scale pin; nothing else of the tab strip.
- Not chosen: (B) except `ui/tabs/` from case 8's greps (the lazy option).

Where it is built: U3. Booked in the state file's closed log and `plan.md` Rulings.

## Z162 (2026-10-01 16:00, step Q88b)

- Chosen (a): `protected` refuses by identity only (device and inode); making a file where none is at the path is never refused.
- Not chosen: (b) refuse by name in any letter case even where nothing is at the path.

Where it is built: Q88b's landing. Booked in the state file's closed log and `plan.md` Rulings.

## Z163 (2026-10-01 16:55, step Q85c)

- Chosen (a): the step's paths gain `src/lib/data/sources/yaml-file.ts`, where the `readFile` clone of the five source readers is folded, and the rewrite of allowlist lines 46 and 51-54 to the moved test paths; the changed answers are `flattenText` and `loadConfig`'s merge skipping an own `__proto__` key.
- Not chosen: (b) book the fold and the `loadConfig` defect as later steps, the lazy option.

Where it is built: Q85c. Booked in the state file's closed log and `plan.md` Rulings.

## Z164 (2026-10-01 17:12, step U3)

- Chosen (b): a fresh builder takes over U3's worktree as it stands, starts no agent, finishes every item from the brief and the diff as left, runs the cases and reports.
- Not chosen: (a) resume the interrupted builder, which Axel says cannot be done; (c) discard the worktree, which throws away work with no defect found in it.

Where it is built: U3. Booked in the state file's closed log and `plan.md` Rulings.

## Z165 (2026-10-01 17:12, step D31)

- Chosen (a): DESIGN.md:128, DESIGN.md:344 and the head comment of `src/lib/server/git/git-write.ts` name one exception, the timer of `git.autofetch_minutes`, which runs only `git fetch --prune` through the existing call site, in repositories `git remote` names a remote for, only while the key is above 0.
- Not chosen: (b) keep the rule absolute and reverse Z83, the lazy option.

Where it is built: D31. Booked in the state file's closed log and `plan.md` Rulings.

## Z173 (2026-10-01 18:45, step Q85c)

- Chosen (a): the `meta` loops of `sources/collections.ts` and `sources/registries.ts` and the `fields` loop of `snapshot/normalise.ts` skip an own `__proto__` key, with a case each, in Q85c's repair round 1, so the sentence Q85c adds to `DESIGN.md:148` holds for the data folder.
- Not chosen: (b) a booking for a later step, the lazy option.

Where it is built: Q85c. Booked in the state file's closed log and `plan.md` Rulings.

## Z174 (2026-10-01 18:56, step D35)

- Chosen (a): the readers refuse `slurm.poll_min`, `slurm.quota_min`, `calendar.poll_min` and `mail.poll_min` unless above zero, `slurm.days`, `calendar.days_back` and `calendar.days_ahead` below zero, and `mail.per_signal` unless a whole number above zero; the Settings write refuses the same values through those readers, and `options.yml` states each bound. Built in D35, since a cadence of zero made live is a busy loop against the cluster or a provider.
- Not chosen: (b) the readers left accepting any number, the lazy option, leaving a Settings control that makes a poller misbehave.

Where it is built: D35. Booked in the state file's closed log and `plan.md` Rulings.

## Z175 (2026-10-01 18:59, step Q88c)

- Chosen (a): the two rows D31's corrected table shows differing from VS Code that Z172 did not cover are brought to VS Code's default in Q88c: `git.countBadge`, the count of changed files on the rail item that opens the Repositories view (VS Code's `all`, every repository's changes), and `git.autoRepositoryDetection`, each configured root that is not itself a repository scanned one folder deep for repositories (VS Code's `git.repositoryScanMaxDepth` of 1), each listed on the `git` channel like a root.
- Not chosen: (b) both kept as they are and named in Q88c's list of fixed choices, the lazy option, since a repository inside a configured folder stays unseen and the rail says nothing of pending changes.

Where it is built: Q88c. Booked in the state file's closed log and `plan.md` Rulings.

## Z176 (2026-10-01 19:03, step D27)

- Chosen (a): the one extension-to-language map is a top-level key `languages:` in `config/sources.yml`, oculus's language name to a list of endings, an entry with a leading dot an extension and one without a whole file name compared lowercased, the whole name matched first; shown in the Settings view through a family entry of `options.yml`.
- Not chosen: (b) a map from each ending to its language, which repeats the language name on every line and is not the per-language shape Z78 (2) names; (c) the key in `behavior.yml`, whose keys are thresholds and cadences rather than how a file is read.

Where it is built: D27. Booked in the state file's closed log and `plan.md` Rulings.

## Z174, amended (2026-10-01 19:11, step D35)

- Chosen (a): the bounds have an upper limit as well: `slurm.poll_min`, `slurm.quota_min`, `calendar.poll_min`, `mail.poll_min` and `usage_refresh_min` from 1 to 35791 minutes (the longest a Node timer holds; a larger value fires every millisecond); `slurm.days`, `calendar.days_back` and `calendar.days_ahead` whole numbers from 0 to 3650 (ten years); `mail.per_signal` a whole number from 1 to 500 (Gmail's page ceiling).
- Not chosen: (b) "above zero" alone, the lazy option, which leaves 0.00001 and 40000 minutes spinning.

## Z177 (2026-10-01 19:11, step D35)

- Chosen (a): every `local.yml` key except `calendars`, `calendar_dir`, `mail` and `mail_dir` is read once at start and used from that value everywhere; the per-request re-reads of `hub`, `sessions_overrides`, `bookmarks`, `changes` and the terminal routes' `claude_bin` take the start value, so no key is half live; each such key's description says a change takes effect when the server is started again, and `HELP.md:236` says so. Built in D35.
- Not chosen: (b) the per-request re-reads kept with a sentence describing the split, the lazy option, which leaves a hand-edited `hub` writing to one hub while the page shows another until a restart; (c) every key made live, rebuilding the watchers on a `hub` change, a different concern from Z166, which ruled that these keys take a restart.

Where they are built: D35. Booked in the state file's closed log and `plan.md` Rulings.

Reviewed 2026-10-02 (Axel's review of every choice): built wrong. Axel's question behind Z166 asked whether every YAML file reloads, and the restart exception for `local.yml` was written into Z166's option (a) and chosen again here; D35 then removed the per-request re-reads of `local.yml`. Withdrawn by Z198 and Axel's D35 redo ruling: D35 is taken back out of main and prepared again with every `local.yml` key live and every line of this choice removed.

## Z178 (2026-10-01 19:44, step D27)

- Chosen (a): the `languages` map sits in a new Settings section named Files, the group VS Code's Settings editor puts `files.associations` under, and the status bar and the language picker show each new language by VS Code's own display name: C, C++, CMake, Lua, Ruby, SCSS, Java, Dart, Fortran, Fortran (Fixed Form), Jinja, Svelte and Rite.
- Not chosen: (b) the map under an existing section (Code theme or Roots), which holds keys of another subject; (c) the raw ids (`cpp`, `fortran-fixed`) as display names, the lazy option, since the status bar then shows ids no other language there shows.

Where they are built: D27. Booked in the state file's closed log and `plan.md` Rulings.


## Z179 (2026-10-01 20:58, step Q85d)

- Chosen (b): the bodies the views fetch (Changes, CommitFiles, Diff, Graph, Merge and Source's gutter) are read by the rule the state layer reads the server's answers by, in a new `state/sources/repositories/answers.ts`: a list read item by item, the passing items kept, and an `error` that is not text answered by the view's own failure sentence. The answers that change are each a case that fails on the unchanged tree.
- Not chosen: (a) today's answers kept, a cast list of unchecked items handed on whole and `DESIGN.md:148` naming the views as an exception, the lazy option, since it leaves the untyped input the step exists to end.

Where they are built: Q85d. Booked in the state file's closed log and `plan.md` Rulings.

## Z182 (2026-10-01 21:53, step X3a)

- Chosen (a): the Explorer's problem decorations move to D33, the Problems view, which brings the diagnostics they read, and the Outline section's symbols for code languages move to D23, the language server client, which brings the symbol provider; X3a builds the Outline section with the headings of Markdown and LaTeX files and every other row of the parity inventory.
- Not chosen: (b) X3a builds a diagnostics source and a symbol provider of its own, which D23 and D33 then replace, two builds of one thing; (c) the two rows dropped, the lazy option, since VS Code's Explorer shows both.

Where they are built: X3a, D23 and D33. Booked in the state file's closed log and `plan.md` Rulings.

## Z183 (2026-10-01 21:53, step D35)

- Chosen (a): Z177 amended so `apps_dir` is read again on a change, as Axel's apps ruling C1 (`agents/reviews/E1-rulings.md:7`) puts it beside `calendar_dir` and `mail_dir` and `DESIGN.md:266` has the watcher follow a new `apps_dir`; `DESIGN.md:236` names it among the keys read again. No code, since apps are not built.
- Not chosen: (b) `apps_dir` read at start only, with `DESIGN.md:244` and `:266` rewritten, which reverses Axel's ruling; (c) the two sentences left contradicting each other, the lazy option.

Where they are built: D35 (repair round 1). Booked in the state file's closed log and `plan.md` Rulings.

## Z184 (2026-10-01 22:03, step L4)

- Chosen (a): (1) a browser with a saved layout from before L4 gets the shipped floats, and the Live HPC and Usage tabs move from its Focus page into the docked float with their state; (2) a view opened while its tab sits in a float activates that tab; (3) a kept empty pane stays empty whatever removes its last tab; (4) a press in a float never makes the float the place a view opens; (5) a float has no maximise and stays drawn while a page pane is maximised; (6) a build older than L4 reads the new saved layout as none, since each port keeps its own browser storage.
- Not chosen: (b) saved Focus pages left as they are, so existing browsers never see the float the plan line asks for "on every page", the lazy option; (c) a second instance opened beside the float's; (d) the kept rule on a close and a drag only, so an edge drop or a cross-page move removes a pane a close would keep.

Where they are built: L4. Booked in the state file's closed log and `plan.md` Rulings.

## Z188 (2026-10-01 22:15, step X3a)

- Chosen (a): X3a's brief-check findings other than the picker (Z187) closed in its brief: the default workspace's roots written to `sources.yml` through a new list-edit write; a `history` key in `local.yml`; no catalog entry for `file-nesting.yml`; an `ignored` flag on listed entries; git decorations on the existing `--c-scm-*` tokens with VS Code's letters; the file log as a git read; `local.yml` never copied into the history; Paste into the same folder as Duplicate; folder drags under their own type; Seti colours derived on light themes only.
- Not chosen: (b) each finding left for a later step, the lazy option.

Where they are built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

Reviewed 2026-10-02 (Axel's review of every choice): wrong. It closed about twelve findings in one entry and took user-visible decisions in it (the `roots:` of `sources.yml` written by the default workspace, a `history` key in `local.yml`, the route names, the `file-nesting.yml` shape, the `~/.oculus/history` layout). Redone at X3a's /spec, one entry per decision.

## Z189 (2026-10-01 23:05, step Q35)

- Chosen (a): the Present deck fills its pane as a 16:9 frame at a 1280 by 720 design size, the slide scaled uniformly to the frame and letterboxed on the long side; the slide parts keep their sizes inside the frame; the Overview grid is not scaled.
- Not chosen: (b) the slide's words sized in container units so the slide reflows to any pane shape (a slide then looks different in every pane and on the projector); (c) the slide left at the UI's type size, the lazy option.

Where it is built: Q35. Booked in the state file's closed log and `plan.md` Rulings.

Reviewed 2026-10-02 (Axel's review of every choice): the first version was wrong (the slide parts kept the interface's sizes inside the frame); Z193 corrected it in Q35's brief (`agents/briefs/Q35.md` items 5 and 6) and the round-0 ruling `agents/briefs/Q35-cases.md` fixed case 8. Built by Q35's builder.

## Z191 (2026-10-01 23:04, step D11)

- Chosen (a): D11 waits for D17. Z92 (1) (a) gives each launch configuration a `before`, the name of a command of `.oculus/commands.yml`, and that file is D17's; the tree reads no such file (`grep -rn "commands.yml" src` prints nothing). D17 has no wait of its own, so it is prepared now and D11 after it lands.
- Not chosen: (b) D11 built now with `before` left out and added by D17, which moves part of D11's ruled scope into another step, the lazy option; (c) D11 building its own reader of `commands.yml`, which D17 then rebuilds.

Where it is built: D11, after D17. Booked in the state file's closed log and `plan.md` Rulings.

## Z193 (2026-10-01 23:13, step Q35)

- Chosen (a): Z189 amended. The slide parts are laid out for the 1280 by 720 frame: a slide type scale on the frame in px at the design size (56, 36, 28, 24, 18, times the text size), 64 px padding, Title and Closing centred, reading widths at most 1040 px and centred in place of the `ch` caps, a slide taller than the frame scrolling inside it with `jump.ts` correcting for the scale. Q35's brief check showed that the frame with the parts at the UI's tokens fills about a third of the frame's width and draws words at 6 to 7 px in a 700 px pane.
- Not chosen: (b) the frame with the parts unchanged, which leaves the slide in the frame's left third, the lazy option; (c) no scaling, the deck box stretched and the parts centred, which keeps the UI's sizes but is no slide shape a projector shows.

Where it is built: Q35. Booked in the state file's closed log and `plan.md` Rulings.

## Z195 (2026-10-01 23:18, step D20)

- Chosen (a): D20 waits for D17. `DESIGN.md:150` runs "an agent seeded with a task" only after the reader approved that exact text, the approval kept under `~/.oculus/`; no approval store exists (`grep -rn "approval" src/lib` finds none for a command), and D17's brief builds it (`approvals.json`). D20 then seeds its agents through that store.
- Not chosen: (b) D20 building its own approval store, which D17 then duplicates; (c) D20 seeding agents without approval, against the Processes rule, the lazy option.

Where it is built: D20, after D17. Booked in the state file's closed log and `plan.md` Rulings.


## Z197 (2026-10-02 00:45, steps X3a, D32, Q115)

The question: whether Q114 and Q115 stay steps of their own.

- Chosen (a): Q114 folded into X3a, which already builds the Files view's History (`~/.oculus/history`, item 14 of its brief) and whose brief is written again at /spec; the search's "HTTP 200" error (`search.svelte.ts:127`) folded into D32, which changes the Search view's state; Q115 keeps the six other answers, in `socket.svelte.ts`, `agents.svelte.ts`, `deposit.svelte.ts`, `selectors.svelte.ts` and `pty-io.ts`, which no queued step touches.
- Not chosen: (b) both kept as steps, which builds History twice and touches `search.svelte.ts` in two steps; (c) Q115 folded whole into D32, which puts five files outside the Search view into a Search step.

Where it is built: X3a, D32 and Q115; Q115 folded into D32 by Z198. Booked in the state file's closed log and `plan.md` Rulings.

## Z198 (2026-10-02 00:58, steps D35, D32)

The question: Axel's review that D35 was to end the exception that `local.yml` does not reload, and that a small step of its own wastes tokens.

- Chosen (a): D35 taken back out of its landing and prepared again from its patch, with every `local.yml` key made live (`hub` rebuilding the watchers, `port` rebinding, the session files, `claude_bin` and the stores read again when the file changes) and no key taking a restart. The restart exception written into Z166's option (a) and chosen again at Z177, under which D35 removed the per-request re-reads of `local.yml` (`loadLocalOrDefaults`), is withdrawn. Q115 folded whole into D32.
- Not chosen: (b) D35 landed as built and `local.yml` made live later in S4, which lands a change that makes `local.yml` less live than before; (c) a step of its own for `local.yml`, and Q115 kept as a step, the small steps Axel rejected.

Where it is built: D35 and D32. Booked in the state file's closed log and `plan.md` Rulings.

## Z199 (2026-10-02 01:45, step X3a)

The question: where Add Folder to Workspace and Remove Folder from Workspace write when the workspace in force is the default one (Z188 redone, its first decision).

- Chosen (a): the default workspace's folders are the `roots:` of `config/sources.yml`, written through a new list-edit write of `sources.yml:roots` (each entry `{ key, dir }`, the file's comments kept), as Z76 (a) rules "the default workspace's folders edited from the page". A configured root shown inside a named workspace offers no Remove there, and `refused_root_fixed` says why; the hub and the engine's `config/` folder have no Remove anywhere.
- Not chosen: (b) the default workspace kept in `~/.oculus/workspaces.json` like a named one, `sources.yml` never written, which leaves the configured roots uneditable from the page, against Z76 (a); (c) the Settings view's `config-key` write, which refuses a list of records (`not_single`, `config-key.ts:155-159`).

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z200 (2026-10-02 01:45, step X3a)

The question: where the local history folder is set (brief check 6.2).

- Chosen (a): a `history` key of `local.yml`, default `~/.oculus/history`, beside `workspaces`, `bookmarks`, `notes` and `changes`, in `LOCAL_KEYS`, the options catalog's `local.yml` block and HELP.md's list of the keys; read at every request, so a change of it is live as D35 rules every key; tests point it at a scratch folder.
- Not chosen: (b) a fixed `~/.oculus/history` with no key, which no test can redirect and which breaks the rule that no test writes `~/.oculus`.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z201 (2026-10-02 01:45, step X3a)

The question: the layout of the local history folder (brief check 6.3).

- Chosen (a): one folder per file, named by the first 16 hex digits of the SHA-256 of the file's real path, holding `entries.json` (`{ path, saves: [{ id, at, size, kind }] }`, `kind` `save` or `delete`) and one copy per save named by its id (the time as `YYYYMMDDTHHMMSSmmm`, a `-n` suffix for a second save in the same millisecond); 50 copies of kind `save` kept per file, none over 256 KB (the 2026-09-25 ruling); a copy of kind `delete` up to 5 MB (Z212).
- Not chosen: (b) the file's path as a folder tree under the history folder, which spreads the hub's tree into `~/.oculus` and breaks on a renamed root; (c) VS Code's own layout (`<hash>/entries.json` with random names), whose names say nothing to a reader of the folder.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z202 (2026-10-02 01:45, step X3a)

The question: the names and answers of the step's three new reads and one new write (brief check 4.5, 4.7, 6.3).

- Chosen (a): `POST /api/folders/pick` runs the JavaScript for Automation helper of Z187 and answers `{ ok: true, paths: [...] }` (empty when the panel is cancelled) or `{ error: 'unsupported' | 'failed' }`; `GET /api/history?root=<key>&path=<rel>` answers `{ ok: true, saves: [...] }` newest first, and with `&id=<id>` that copy's text, the id taken only from the file's own `entries.json`; the file's commits through the git reads' own form, `GET /api/git?log=<repository>&path=<rel>` beside `blame`, answering `{ ok: true, commits: [...] }`, 50 at most, `git log --follow` with the path after `--` as a literal pathspec. Each takes the token and answers with the `NO_STORE` headers of the other reads.
- Not chosen: (b) `GET /api/folders?dir=` listing any folder's names, which Z187 replaced; (c) `GET /api/git/file-log`, a second convention beside the git reads'.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z203 (2026-10-02 01:45, step X3a)

The question: the shape of `config/catalogs/file-nesting.yml` and whether the options catalog describes it (brief check 4.2, 6.3).

- Chosen (a): one top-level key `patterns:`, a map from a parent pattern to the list of its children's patterns, seeded with VS Code 1.137.0's default `explorer.fileNesting.patterns`, `${capture}` and `${basename}` kept as VS Code writes them, with a head comment; no options-catalog entry, since no catalog file has one, and `DESIGN.md:44` and `tests/checks/config/config-folder.test.ts` name the file and pin its key.
- Not chosen: (b) VS Code's own form, one comma-separated string per parent, which is harder to read and edit in YAML; (c) an options-catalog entry, a shape no catalog file has.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z204 (2026-10-02 01:45, step X3a)

The question: how the Files view knows a listed entry is ignored by git, to draw it muted (brief check 4.3).

- Chosen (a): a listed entry carries `ignored: true` when the ignored toggle shows ignored entries and git ignores it, from the same `ignoredIn` read and cache the listing uses to leave them out; the listing's other entries are unchanged.
- Not chosen: (b) a second request per folder for its ignored names, which doubles the reads of every expanded folder; (c) no muted state, which leaves a row of VS Code's Explorer out.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z205 (2026-10-02 01:45, step X3a)

The question: the letters and colours of the Explorer's git decorations (brief check 4.4).

- Chosen (a): VS Code's git extension's letters: `M` modified, `U` untracked, `A` added, `D` deleted, `R` renamed, `!` conflict; drawn in the existing `--c-scm-added`, `--c-scm-modified`, `--c-scm-deleted`, `--c-scm-conflict` tokens and their `-txt` pairs, untracked in the added hue as VS Code's default themes draw both green, renamed in the modified hue; a folder holding a changed file takes the colour of the strongest change below it (conflict, then deleted, modified, added) with no letter; an ignored entry in the muted text colour.
- Not chosen: (b) a new `--git-*` token family for the same hues, the duplication the rules file bans; (c) `C` for a conflict, which is VS Code's letter for a copy.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z206 (2026-10-02 01:45, step X3a)

The question: what Duplicate is, which Z151 decision 8 gives X3a (brief check 2.1).

- Chosen (a): Duplicate is Copy and then Paste into the same folder, which names the copy by VS Code's rule (`a copy.md`, `a copy 2.md`), as VS Code's Explorer does; no menu item, since VS Code 1.137.0 has none (`grep -o 'duplicate[A-Za-z]*File' workbench.desktop.main.js` prints nothing); a case proves it.
- Not chosen: (b) a Duplicate menu item VS Code does not have.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z207 (2026-10-02 01:45, step X3a)

The question: what a dragged folder row carries (brief check 6.8).

- Chosen (a): a folder row drags under a drag type of its own, which only the Files tree takes as a drop; a file row keeps `FILE_DRAG`, so the composer and the terminal grid take files as today and never a folder.
- Not chosen: (b) folders under `FILE_DRAG`, which hands the composer and the terminal grid a folder path they were never built for.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z208 (2026-10-02 01:45, step X3a)

The question: which themes Z138's darker Seti colours apply to (brief check 5.3).

- Chosen (a): a theme is light when its `--panel` has a higher WCAG luminance than its `--text`; on a light theme each `--seti-*` is darkened in its own hue until it clears 3:1 on `--panel`, the contrast WCAG asks of a graphic; on a dark theme the values stay seti-ui's.
- Not chosen: (b) `readable` run on every theme, which would lighten `--seti-ignore` and `--seti-grey` on dark grounds, against Z138; (c) a light flag written into each theme, which adds a field every theme must carry.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z209 (2026-10-02 01:45, step X3a)

The question: the palette commands for Switch Workspace, Save Workspace As and Open Folder (brief check 6.3, 6.4).

- Chosen (a): three palette commands, `:workspace` (its results the saved workspaces and the default one, the one in force marked; a pick switches in place), `:workspace-save <name>` (saves the folders in force under the name, refusing an empty or taken name with the Workspaces section's words) and `:folder` (Open Folder: the folder panel, then a Files tab rooted at the chosen folder); the header's menu items open the palette with the command typed. The palette stays the shell's; the commands reach the fs store and the layout store, as the other commands do.
- Not chosen: (b) a quick-pick mode of its own in the palette, a second input form the palette does not have; (c) a dialog of the Files view, which the shell cannot open when the page has no Files tab.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z210 (2026-10-02 01:45, step X3a)

The question: what Show in Files opens for each of its five callers (brief check 6.7).

- Chosen (a): Show in Files of a folder (a project card, a person's supervision folder) opens a Files tab rooted at that folder, or activates one already rooted there, with a `..` row that moves the top one folder up as far as the root that serves it; Show in Files of a file (an entry card's path, a venue card's path, the Repositories view's reveal) reveals it in the page's Files tab as today; the rooted top is the instance state's `top`, which `follow` already uses; a rooted tab draws its folder as its one top row and no workspace header.
- Not chosen: (b) every caller rooting a new tab, which opens a tab per file shown; (c) every caller revealing in the page's tab, against Z1.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z211 (2026-10-02 01:45, step X3a)

The question: how the page knows a bookmark names a folder, with the bookmark still `{ root, path }` (brief check 6.6).

- Chosen (a): the bookmarks read answers each entry with a `kind` of `file`, `folder` or `missing`, from a stat of the path under its root at the read; `bookmarkRows` gives a folder the view `files`, which reveals it expanded and selected, and the rail draws a folder icon for it; a `missing` one is drawn as the Bookmarks section draws a gone file today.
- Not chosen: (b) a guess from the name (no extension), wrong for `Makefile` and for `a.d`; (c) a `kind` written into the bookmarks file, against Z167's unchanged shape.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z212 (2026-10-02 01:45, step X3a)

The question: how the Files view's operations go into History with undo (Q114, folded into X3a by Z197).

- Chosen (a): each operation of `POST /api/ops` that changed something (create, rename, move, copy, paste, upload, trash, delete) is one change-log record (`key: files`, the field the operation, before and after the paths, a new undo kind `file`), drawn in History with its undo control, and Cmd+Z in the Files view undoes the newest one not yet undone, Shift+Cmd+Z takes that undo back, as VS Code's Explorer. The undo is checked as every undo is: a create or copy is moved to the Trash only while the file is as the operation left it (size and modification time), a rename or move goes back only while the target is there and the old name free, and a delete is undone by writing back each file whose content was kept before the delete, up to 5 MB a file as VS Code keeps it (`maxSize` 5e6 in VS Code 1.137.0), a folder coming back empty as in VS Code, the rest in the Trash; the content is kept in the local history (Z201, kind `delete`). The undo of a delete asks first, as VS Code's.
- Not chosen: (b) the operations in History with no undo, which is not what Axel ruled; (c) a folder's files kept whole on delete, which copies a large folder's bytes before every delete for an undo VS Code does not offer.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z213 (2026-10-02 01:45, step X3a)

The question: the setting behind the delete question (Q114, Z151 review).

- Chosen (a): `files.confirm_delete` in `config/behavior.yml`, default `true`, as VS Code's `explorer.confirmDelete`; the delete question gains VS Code's "Do not ask me again" box, which writes `false` through the Settings view's `config-key` write; with it `false` a delete to the Trash goes without the question and a permanent delete still asks, as VS Code's; read again at every config push (D35); described in the options catalog and HELP.md. The drag-and-drop question stays fixed at VS Code's default, as the Settings ruling fixes the Explorer's other confirms.
- Not chosen: (b) a key in `local.yml`, which holds this machine's paths and secrets and no behaviour; (c) the drag-and-drop confirm made a setting too, which the Settings ruling fixed.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z214 (2026-10-02 01:45, step X3a)

The question: the place of the listing toggles and the starting state of the new sections (the brief's decisions 1 and 4).

- Chosen (a): the hidden-files and ignored-files toggles and the File Nesting toggle sit in the workspace header's `...` menu as checked items, kept per tab, as VS Code puts a view's options in its `...` menu; Open Editors, Outline and Timeline start collapsed, as VS Code 1.137.0 registers its Outline (`collapsed:!0`), so the tree keeps its room until a reader opens one; each section's open state kept per tab.
- Not chosen: (b) the toggles kept in the bar beside the filter, which VS Code's Explorer has no place for; (c) the sections open at first, which takes the tree's room before a reader asks for them.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z216 (2026-10-02 01:57, step D24)

The question: how the Personal board finds the six repositories that carry a `.oculus/project.yml` (the ruling of 2026-09-25 left it to /spec, a new config key being Axel's).

- Chosen (a): the board reads every Files root; ordo, scotoma, officium and youtube-downloader join cathedra and game-engine under `roots:` in `config/sources.yml`, so the six are roots of the default workspace and no key is added.
- Not chosen: (b) a new list key the board reads, which the ruling makes a stop and which repeats what `roots:` holds; (c) the saved workspace of `~/.oculus/workspaces.json`, which holds only `~/.claude` and is this machine's file.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z218 (2026-10-02 02:03, step D24)

The question: the hub tier of side projects.

- Chosen (a): a flat scan rule `{ dir: side-projects, type: side-project, tier: personal, optional: true }` after `projects/ideas` in `config/sources.yml`, tier id `side-projects`, its manifests kept in a new snapshot entity kind `personal` and never in `projects`.
- Not chosen: (b) side projects as `projects` with their tier filtered out by each research reader, which needs a filter in every reader of the snapshot's projects and lets any reader added later show them.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z219 (2026-10-02 02:03, step D24)

The question: where the Personal board sits.

- Chosen (a): a view `personal`, "Personal", glyph `spark`, the fourth tab of the Projects page after Archive (`config/layout.yml` arrangement `projects`).
- Not chosen: (b) a rail page of its own, a twelfth button for a handful of cards.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z220 (2026-10-02 02:03, step D24)

The question: the status vocabulary.

- Chosen (a): `side_project_status:` in `config/catalogs/vocab.yml` in the shape of `career_host_status:`: running (`live`, #16a34a), building (`active`, #d4a017), idea (`idea`, #0891b2), parked (`snooze`, #9ca3af), the order the board sorts in.
- Not chosen: (b) the words and colours in code, against the catalog rule; (c) the research status chips, which carry none of the four words.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z221 (2026-10-02 02:03, step D24)

The question: what the board and a card do.

- Chosen (a): a search and a toggle per status kept per tab, cards sorted by status then title; a card draws title, status chip, eli5, next, links and where it lives; the title opens the manifest in the editor, Show in Files opens its folder; no facets, list mode or form.
- Not chosen: (b) the research board's facets and list mode, which read research fields a side project has none of; (c) an edit form, which is Q91's manifest editor.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z222 (2026-10-02 02:03, step D24)

The question: what a wrong manifest gives.

- Chosen (a): an unknown status, a missing title and a key outside the five are findings and the card is still drawn (status `unknown`, the folder name as title); a file that does not parse is a finding and no card; a root without the file gives nothing.
- Not chosen: (b) no card for any wrong field, which hides a side project over a typo.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z223 (2026-10-02 02:03, step D24)

The question: how the repositories' manifests reach the page.

- Chosen (a): the portfolio build reads `<root>/.oculus/project.yml` for each Files root the watcher passes, id `root:<key>`, one card per real directory, each root's `.oculus/` watched so a change reaches an open page.
- Not chosen: (b) a route of its own read on demand, which leaves an open page stale until reloaded.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z224 (2026-10-02 02:08, step M4)

The question: how each equation is written in its PRESENT.md.

- Chosen (a): the LaTeX of `make_equations.py` byte for byte as a single-quoted YAML scalar on the `equation:` line, a `'` doubled; all 13 round-trip through `yaml.safe_load` unchanged.
- Not chosen: (b) a double-quoted scalar, every backslash doubled; (c) a block scalar, which changes the front matter's one-line shape.

Where it is built: M4. Booked in the state file's closed log and `plan.md` Rulings.

## Z225 (2026-10-02 02:08, step M4)

The question: what is left of the image branch.

- Chosen (a): `deck.equations_dir`, the image lookup, `equationImage`, `equationMissing`, the `<img>` and gap branches and their catalog keys removed; an `equation:` naming an image file becomes the finding `findings.present.equation_image` and draws nothing.
- Not chosen: (b) a file name typeset as LaTeX without a word; (c) the branch kept, which the plan line removes once unused.

Where it is built: M4. Booked in the state file's closed log and `plan.md` Rulings.

## Z226 (2026-10-02 02:08, step M4)

The question: the dashboard subtitle that names `tools/present`.

- Chosen (a): `config/catalogs/meta.yml`'s subtitle names the Present view as the showcase.
- Not chosen: (b) the subtitle kept, which points at a deck oculus no longer reads.

Where it is built: M4. Booked in the state file's closed log and `plan.md` Rulings.

## Z227 (2026-10-02 02:26, step D24)

The question: whether research readers see a side project.

- Chosen (a): `readManifests` skips the `side-projects` tier and a new `readPersonal` reads it, so the deposit route, subtask and manifest writes, the chat context and project files never find a side project by id.
- Not chosen: (b) refusals added to each write route, which leaves the next caller of `readManifests` open; (c) the exposure documented, the lazy option.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z228 (2026-10-02 02:26, step D24)

The question: which roots the board reads and how it hears a change.

- Chosen (a): `browserRoots` without the hub and engine roots, deduplicated by real path; each root's `.oculus/` watched, through its parent while it does not exist; the saved workspaces file polled as the git watcher polls it.
- Not chosen: (b) the configured roots only, which leaves a folder added in a named workspace off the board.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z229 (2026-10-02 02:26, step D24)

The question: the `*.yml` ignore rule of youtube-downloader.

- Chosen (a): at the landing `~/workspace/youtube-downloader/.gitignore` gains `!.oculus/project.yml` after line 4, committed with the manifest.
- Not chosen: (b) `git add -f`, which leaves the next change of the file ignored; (c) the file left untracked, the lazy option.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z230 (2026-10-02 02:26, step D24)

The question: what a `links` entry is.

- Chosen (a): text; an entry `posting()` accepts (`http` or `https`) is a link opened in a new tab, every other entry plain text; a non-list or non-text entry a finding.
- Not chosen: (b) any entry a link, which makes a `javascript:` entry from a repository clickable.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z231 (2026-10-02 02:26, step D24)

The question: card ids and what file is read.

- Chosen (a): ids `side:<slug>` and `root:<key>`; only a regular file of at most 64 KiB is read, anything else a finding.
- Not chosen: (b) bare slugs and keys, which collide and can be reserved object keys.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z232 (2026-10-02 02:26, step D24)

The question: a drafted manifest's title.

- Chosen (a): the project's name from its README's first heading (Missal for game-engine).
- Not chosen: (b) the folder name, which is not what the project is called.

Where it is built: D24. Booked in the state file's closed log and `plan.md` Rulings.

## Z233 (2026-10-02 02:26, step M4)

The question: the cockpit deck, which reads the same `equation:` field.

- Chosen (a): `tools/present/build.py` draws a LaTeX value through the deck's MathJax, with an `argmin` macro in `mathconfig.js`, and the sentences of `tools/present` that name the image form are rewritten; the research-cockpit skill's step 6 waits for O29, since skills are edited only by Axel.
- Not chosen: (b) the deck left without its 13 equations until O29, a regression of the public deck.

Where it is built: M4. Booked in the state file's closed log and `plan.md` Rulings.

## Z234 (2026-10-02 02:26, step M4)

The question: how the 13 lines are written.

- Chosen (a): by the script the brief names, the plan line's "by script": each `equation: eq_<id>.png` replaced by its `make_equations.py` entry, one line per file, checked by a dry run (13 files, one line each).
- Not chosen: (b) 13 hand edits, against spec.md's rule that a builder writes under `projects/` only through a named script.

Where it is built: M4. Booked in the state file's closed log and `plan.md` Rulings.

## Z235 (2026-10-02 02:26, step M4)

The question: how the 13 are tested.

- Chosen (a): no test reads `tools/present`; `integrity.test.ts` asserts the real hub's 13 slides carry an equation, give no finding and render with no `katex-error`; the comparison with `make_equations.py` is the landing's command.
- Not chosen: (b) the 13 strings as constants in a test, which compares a file with a copy of itself.

Where it is built: M4. Booked in the state file's closed log and `plan.md` Rulings.

## Z236 (2026-10-02 02:47, step M4)

The question: how the deck draws `\bm{\beta}`, which the vendored MathJax does not define.

- Chosen (a): vendor MathJax 3.2.2's `boldsymbol` extension beside `tex-svg.js`, load it offline, and define `bm` as `\boldsymbol`, so the deck draws a bold beta as the image does.
- Not chosen: (b) `bm` as `\mathbf`, which draws a plain beta; the lazy option. (c) Change the slide's LaTeX, which breaks Z234.

Where it is built: M4 (`agents/briefs/M4-cases.md`). Booked in the state file's closed log and `plan.md` Rulings.

## Z237 (2026-10-02 02:47, step M4)

The question: how the deck draws `\text{\small X}`, which MathJax shows as literal text.

- Chosen (a): `build.py` rewrites it to `{\small\text{X}}` in the value it emits for MathJax; the slide values stay as written; the typeset check counts `merror` and red nodes.
- Not chosen: (b) accept the literal `\small` in the deck; the lazy option. (c) Change the slides' LaTeX, which breaks Z234 and the PNG source.

Where it is built: M4. Booked in the state file's closed log and `plan.md` Rulings.

## Z238 (2026-10-02 02:47, step M4)

The question: the paths the builder found it needs outside the brief's list, and a blank equation.

- Chosen (a): add the `Equation.svelte` row of `type-scale.test.ts`, one `deck.css` rule for the MathJax card, and the vendored extension file; `slide()` drops a blank equation.
- Not chosen: (b) leave `type-scale.test.ts` failing or the card unbounded, which leaves the step red or a slide overflowing.

Where it is built: M4. Booked in the state file's closed log and `plan.md` Rulings.

## Z239 (2026-10-02 05:20, step D35)

The question: a page that follows the server to its new port lands on a new origin, whose `localStorage` holds none of the workbench layout and none of the "This browser" settings (D35's review, Behaviour 1).

- Chosen (b): the page carries them across. Before it follows, the page writes the layout and the UI settings it holds into `window.name`; the page loaded at the new address reads them from `window.name` before `loadUi` and `loadLayout`, writes them into its own `localStorage`, and clears `window.name`. Nothing goes to the server, and no new shape is seen by the reader: the workbench comes back as it was.
- Not chosen: (a) follow and state the loss, which is the lazy option and drops the reader's open tabs and pages on every port change; (c) tell the page the new address and leave the reader to go, which loses the same state when the reader goes.

Where it is built: D35, repair round 1. Booked in the state file's closed log and `plan.md` Rulings.

## Z240 (2026-10-02 06:50, step Q88c)

The question: the user-visible choices and blocking findings Q88c's brief check left open (`agents/reviews/Q88c-brief-check.md`, sections 5 and 6).

- Chosen (a): each closed in the brief with VS Code's own behaviour, read from VS Code 1.137.0's git extension: the Trash question's strings, singular and plural; Add to .gitignore written as `ignore` writes it; Open File (HEAD) opening the change's left side (HEAD for a staged change, the index for a working-tree change, not offered on an untracked file); the "Reopen Closed Repositories" quick pick with "All Repositories"; Close Other Repositories only with more than one open; Cherry Pick on every commit, an empty pick aborted; Compare with Remote and Compare with... with the ref on the left; Compare with Merge Base against the base `getBranchBase` reads, without writing the setting back; Open Worktree and Open Worktree in New Window; the badge as `countBadge: all`; the status-limit warning with oculus's 200. Oculus's own: `user.useConfigOnly` passed through git's environment variables so the write gate's reading of the argument vector is unchanged; the read module moved into `server/core/git/` to stay under the size and folder limits; the git route given the Files route's Trash guard. Delete Branch runs `-d` only until Axel rules on Z241.
- Not chosen: (b) a smaller brief leaving these to the builder, which is the lazy option and leaves the builder to take user-visible choices.

Where it is built: Q88c. Booked in the state file's closed log and `plan.md` Rulings.

## Z242 (2026-10-02 08:24, step X3a)

The question: how many copies of deleted files the local history keeps (X3a's review, Behaviour 2: a delete keeps a copy of up to 5 MB with no count or total cap, so `~/.oculus/history` grows without bound unless each delete is undone).

- Chosen (a): the newest 50 delete copies are kept over all files, the oldest removed first when a delete adds the 51st, the bound VS Code's local history keeps per file (`workbench.localHistory.maxFileEntries`, 50); an undo of a delete whose copy was pruned refuses with a sentence saying the copy is gone; said in HELP.md beside the 5 MB limit.
- Not chosen: (b) a total size cap in bytes, which needs a size walk of the folder at every delete;
- Not chosen: (c) no cap, the lazy option, which leaves the folder growing without bound.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z243 (2026-10-02 08:24, step X3a)

The question: what a drag of a file from one root onto another does (X3a's review, Spec 3: the brief's case 8 said a copy and a trash of the source; the tree's `moveItem` renames, with copy and remove only across devices, and nothing goes to the Trash).

- Chosen (a): one move, as built and as VS Code does between workspace folders; one `move` record in History, undone by one move back; case 8 is met by `tests/state/sources/explorer/acts/store.test.ts` "moves between two roots in one paste".
- Not chosen: (b) a copy and a trash of the source as the brief said, which puts a file the reader moved into the Trash and makes two History records of one drop.

Where it is built: X3a. Booked in the state file's closed log and `plan.md` Rulings.

## Z244 (2026-10-02 08:24, step D18)

The question: when the Processes view's server read runs (D18's brief check 5.1: the socket has no unsubscribe message, so a read gated on a mounted Processes tab cannot stop when the tab closes).

- Chosen (b): the HPC poller's pattern, as the plan line books it: the page subscribes to `processes` with every channel, the watcher reads every ten seconds while the hub has any subscriber and stops when the last page closes; no new wire message.
- Not chosen: (a) an unsubscribe message on the wire and a hub `unsubscribe`, so reads stop when the last Processes tab closes: a protocol change for every channel, outside the step's subject;
- Not chosen: (c) gate on the first subscribe and say in the docs that reads go on until the page reloads, the lazy option, which leaves the docs' sentence half true.

Where it is built: D18. Booked in the state file's closed log and `plan.md` Rulings.

## Z245 (2026-10-02 08:24, step D18)

The question: which tmux sessions count as oculus's own (D18's brief check 3.4, 6.9, 6.17, 6.18: `listTerminals()` never returns the usage sessions, which live seconds and have no id to stop; a foreign `oculus-` session has no terminal; `#{pane_pid}` of `list-sessions` is the active pane only).

- Chosen (a): every pane of every terminal session (`tmux list-panes -a`), its pane process and every descendant; the usage sessions and foreign sessions are left out of own and of the agent count, and appear only when a pattern matches their command, with no Stop.
- Not chosen: (b) the usage sessions as own with no Stop, which adds an agent to the head line for a few seconds every refresh;
- Not chosen: (c) the active pane only, the lazy option, which leaves a split terminal's other panes out.

Where it is built: D18. Booked in the state file's closed log and `plan.md` Rulings.

## Z246 (2026-10-02 08:24, step D18)

The question: what the head line counts as agents (D18's brief check 6.15, 6.16: a wrapper and its native child would count twice, and counting only listed rows makes the count depend on the patterns).

- Chosen (a): over the whole table by Decision 2's rule, whatever `processes.patterns` holds, a matched agent whose parent is an agent of the same program not counted again; a project is in flight when an oculus terminal or such an agent works in its folder.
- Not chosen: (b) every matched process counted, which doubles a wrapped agent;
- Not chosen: (c) only listed rows, which drops an agent from the head line when the patterns leave its program out.

Where it is built: D18. Booked in the state file's closed log and `plan.md` Rulings.

## Z247 (2026-10-02 08:24, step D18)

The question: how much of each command line the `processes` payload carries every ten seconds (D18's brief check 6.7: the default `node` pattern matches every language server and test worker, and a command line can run to tens of kilobytes).

- Chosen (a): the payload's `command` is cut at 1,000 characters with `...`, which keeps every program and its first arguments; every matching row is listed.
- Not chosen: (b) the whole line, which sends tens of kilobytes per row to every page every ten seconds;
- Not chosen: (c) a row cap, which hides processes the reader is looking for.

Where it is built: D18. Booked in the state file's closed log and `plan.md` Rulings.

## Z248 (2026-10-02 08:37, step M3)

The question: which entries `registries/resources.yml` starts with, and what the 17 manifests' `compute: hpc` and `compute: local` become.

- Chosen (a): three entries, `utwente` (cluster, host `utwente`, the access rules of the UTwente cluster), `this-mac` (machine) and `data` (storage, `~/data`); `hpc` becomes `[utwente]` and `local` becomes `[this-mac]`, each trailing comment kept.
- Not chosen: (b) only the cluster entry, which leaves the eight `local` manifests with no key to name;
- Not chosen: (c) leaving the manifests as they are, which the validator then reports in 17 places and the board stops reading.

Where it is built: M3. Booked in the state file's closed log and `plan.md` Rulings.

## Z249 (2026-10-02 08:37, step M3)

The question: how the board, the card and the form show a list of resource keys.

- Chosen (a): the Compute facet's values are the keys, labelled by the entry's name; the card draws one tag per entry, the HPC glyph on a cluster; the form field is `type: chips, from: resources`, as the datasets field is.
- Not chosen: (b) collapsing the list back to "HPC" or "Local" by kind, which hides which cluster or machine a project uses, the reason the registry exists.

Where it is built: M3. Booked in the state file's closed log and `plan.md` Rulings.

## Z250 (2026-10-02 08:37, step M3)

The question: how the Live HPC poller finds its host once `slurm.resource` names a registry entry, and what happens when the key names no cluster with a host.

- Chosen (a): `hpc_host` of local.yml when set, else the `host` of the cluster entry `slurm.resource` names, resolved at start, at each config push, at each local.yml change and after each portfolio rebuild; a key that resolves to no host gives the existing `unreachable` status with a sentence naming why, and no ssh runs; the server still starts.
- Not chosen: (b) refusing to start, which takes the whole server down over a registry edit;
- Not chosen: (c) resolving at start only, which leaves the poller on a stale host after the registry changes.

Where it is built: M3. Booked in the state file's closed log and `plan.md` Rulings.

## Z254 (2026-10-02, X3a at landing): how a delete finds the delete copies to prune

- Chosen (a): an index `deletes.json` beside the file folders, `{ deletes: [{ folder, id, at }] }`, oldest first; a delete reads it and the folders of the copies it removes; a missing or unreadable index is built again from the folders once; a folder left with no copy is removed.
- Not chosen: (b) every folder read on every delete, the review's B1, whose cost grows with the history.
- Not chosen: (c) an index held in the server's memory, which the module's no-state rule forbids and a restart loses.

Where it is built: X3a's landing. Booked in the state file's closed log and `plan.md` Rulings.

## Z255 (2026-10-02, found at X3a's landing): `~/` in a `local.yml` path key

- Chosen (a): `~/` is the home folder for every path key, as for an account's `dir`; folded into M3's repair round.
- Not chosen: (b) the path keys left as they are, where `history: ~/h` writes under `config/~/h`, the lazy option.

Where it is built: M3's repair round. Booked in the state file's closed log and `plan.md` Rulings.

## Z256 (2026-10-02, A1's first review): the id of a session's diff pane

- Chosen (a): `${side}@${session}:${root}:${path}`; a diff with no session keeps `${side}:${root}:${path}`; the side tokens hold no `@`, so a path cannot produce a session id.
- Not chosen: (b) the brief's `${place}:${session}`, where a file named `a.ts:s-1` takes the id of `a.ts` opened for session `s-1`.
- Not chosen: (c) leaving it, since session ids are long, which keeps a collision the review showed, the lazy option.

Where it is built: A1's repair round 1. Booked in the state file's closed log and `plan.md` Rulings.

## Z258 (2026-10-02, D32's /spec): how the unused-exports script finds its exports

- Chosen (a): `knip` 6.39.0 (ISC, Lars Kappert, released 2026-09-30, supports SvelteKit and Svelte files) in production mode with `--include exports,types`, which leaves every test file out of the reading; an export imported only by test files is reported. A module's tests are read as the test files that import it, so this computes the approved rule. Run on main at 9e8b0cfa it reported 241 unused exports and 110 unused types; five checked by grep: `FILE_FIELDS` (`data/file-ops.ts`, imported nowhere else), `searchArgs` (own file and `tests/data/helpers/search.test.ts`), `codeThemeIds` (own file and `appearance.test.ts`), `languageNamed` (re-exported by `state/shared/words/languages.ts`, imported by one test), `hostZone` (own file and one test).
- Not chosen: (b) a hand-written import resolver over `$lib`, relative paths, re-exports and Svelte module scripts, which repeats what knip does and is the larger job to keep right.
- Not chosen: (c) reading a module's tests as only the test file that mirrors its path, which this repository does not name tests by.

Where it is built: D32. Booked in the state file's closed log and `plan.md` Rulings.

## Z259 (2026-10-02, D32's /spec): the bare-status errors beyond the search

- Chosen (a): every error the page builds from a bare HTTP status becomes a sentence of the catalog: an answer whose body cannot be read says that the server's answer could not be read, and a refused request with no text of its own says the status in a sentence. `grep -rn 'String(response.status)\|HTTP \${' src/lib/state src/lib/views src/lib/ui` lists 29 places in 14 files, the search's two among them.
- Not chosen: (b) the search's two places only, as Z197 worded it, which leaves the same words in the agents, terminal, deposit, writes and twelve other readers, the lazy option.

Where it is built: D32. Booked in the state file's closed log and `plan.md` Rulings.

## Z257 (2026-10-02, D18's first review): the process table and LA18

- Chosen by Axel (b): `systeminformation` dropped; one `ps -axo pid=,ppid=,pcpu=,rss=,lstart=,command=` run oculus starts itself, with a timeout and a kill on `close()`, read by a hand-written parser. The three defects the review found in the library (a command line with a `:` losing its arguments, `started` an hour off after a clock change, an unbounded `ps` child not ended on close) end at their cause.
- Not chosen: (a) the library for the rows and a second `ps` read for the command lines, two reads that can disagree and a child still not ended; (c) the library as it is, the lazy option.

Where it is built: D18's repair round 1. Booked in the state file's closed log and `plan.md` Rulings.

## Z260 (2026-10-02, Axel's report): sticky scroll's structure

- Chosen by Axel (a): D25 gives Monaco the Markdown and LaTeX headings as document symbols, from the parser the Files Outline uses, and bracket-based folding to the brace languages that have no Monaco language service; D23's clangd symbols then replace the folding for C and C++. TypeScript, JavaScript, JSON and CSS already have Monaco's own services (`kit/workers.ts:17-21`), and Python's indented blocks give the indentation model the right scopes.
- Not chosen: waiting for D23 alone, which leaves Markdown and LaTeX with no sticky lines.

Where it is built: D25. Booked in the state file's closed log and `plan.md` Rulings.

## Z261 (2026-10-02, Axel's report): large files uncoloured

- Chosen (a): `editor.paint_limit_kb` defaults to 20480; `config/behavior.yml:113` holds 64, so `orchestrator-state.md` (1,107,333 bytes) opens as plaintext (`views/sources/source/Editor.svelte:8-9,110-111`). Monaco tokenizes a line at a time in the background, viewport first, so the size of the file does not set the cost of a keystroke; the typing delay on that file is measured at D25's landing.
- Not chosen: (b) keeping 64 KB and saying so, the lazy option; (c) removing the key, which drops the setting a slow machine would want.

Where it is built: D25. Booked in the state file's closed log and `plan.md` Rulings.

## Z262 (2026-10-02, Axel's report): the tab's path, Open Editors order, the Files breadcrumb

- Chosen (a): X3c gives a tab the full path of its file as its tooltip, as VS Code's tab hover does (no tab has a `title` today, read on TEST with `[...document.querySelectorAll('[role=tab]')].map(t => t.title)`); a drag along Open Editors reorders the tabs; the breadcrumb above the Files tree (`Files.svelte:198`, `crumbsOf`) goes once X3c's breadcrumbs over a file tab (Z47 4 (a)) are in, since VS Code's Explorer has none.
- Not chosen: a path shown at the bottom of the screen as Finder's path bar, which VS Code does not do and which the status bar's space would carry for one tab only.

Where it is built: X3c. Booked in the state file's closed log and `plan.md` Rulings.

## Z264 (2026-10-02, D32's brief check): how the replace text is read

- Chosen (a): the replace text means what it means in VS Code. VS Code's source (`src/vs/workbench/services/search/common/replace.ts` and `src/vs/base/common/search.ts` on main, read for this ruling) reads `\n`, `\t` and `\\` and `$0` in regex mode. It runs JavaScript's `replace` on the match alone only when the text holds `$0`-`$99`, `` $` `` or `$'`, and otherwise writes the text as typed, so `$&` alone stays `$&`. It applies `\u \U \l \L` only directly before `$N`, and Preserve Case to the pattern before the substitution. The search run asks ripgrep for every group's text of each match, and one function of `data/` evaluates VS Code's rules over them, on the page for the live preview and on the server for the write.
- Not chosen: (b) the brief's first reading (JavaScript's `$&` and `$$` always, Preserve Case after the substitution), which differs from VS Code on `$&` alone, `$$` alone and `$1` patterns under Preserve Case; (c) ripgrep's own syntax shown to the reader, the lazy option, which makes the reader learn a second syntax.
- Differences kept, each with its reason, in D32's brief: a file a tab holds with unsaved text is left out (oculus searches the disk, VS Code the open buffer); no Replace All on a folder row (the Search view has no folder rows; a file names its root).

Where it is built: D32. Booked in the state file's closed log and `plan.md` Rulings.

## Z265 (2026-10-02, D32's brief check): a refusal's own text

- Chosen (a): the page shows a refusal's `error` only when it is a refusal word of the catalog, worded from the catalog; the search route's English refusal texts (`search-routes.ts:29-35`, `:51`) become words; any other body text gives the `answer_refused` sentence with the status. The rules file maps an engine's error to a catalog line before it is shown.
- Not chosen: (b) Z259's "a body's own `error` text is kept", which shows English from the server unmapped.

Where it is built: D32. Booked in the state file's closed log and `plan.md` Rulings.


## Z277 (2026-10-02, M3's round review): the worktrees' folder list

- Chosen: `tools/present` added to `worktree_paths` in `.agents/plan.yaml` and the state file. `tools/cockpit/tests/run.sh` runs `test_presentation.py`, which imports `deck_config` from `tools/present`, so in a worktree without that folder the script exits 1 on a file no step changed.
- Not chosen: running the script without `test_presentation.py` in a worktree, the lazy option, which leaves one part of the cockpit's check unrun on every step.

Where it applies: every worktree made from now on. Booked in the state file's closed log and `plan.md` Rulings.

## Z192 (2026-10-02, D14's brief check): the LaTeX view's shape

- Chosen: a view `latex` ("LaTeX") opened from the Files row menu on a `.tex` file or a folder holding one, state `{ root, path }`; `/api/latex` folder forms beside the project form, both with `outline` and `count`; `latex.auto_build` (`on_save`, `never`) in `behavior.yml`; latexmk with the magic comment's program; the save's build not shown; Count Words on a press. This is how LaTeX Workshop is reached and behaves.
- Not chosen: the panel kept on project tabs only, the lazy option, which leaves the funding and application folders without a build.

Where it applies: D14. Booked in the state file's closed log and `plan.md` Rulings.

## Z278 (2026-10-02, D14's brief check): LaTeX formatting

- Chosen: Format Document in a `.tex` source tab through `tex-fmt --stdin` (LaTeX Workshop's other formatter; `latexindent` stops on this machine with `Can't locate File/HomeDir.pm`), an undoable edit of the tab's text, in D14; ChkTeX stays D36's.
- Not chosen: the parity row's formatting left unbuilt, the lazy option.

Where it applies: D14. Booked in the state file's closed log and `plan.md` Rulings.

## Z279 (2026-10-02, D14's brief check): one LaTeX reader on latex-utensils

- Chosen: magic comments, the root and the sections read with `latex-utensils` (LA18), and the Files Outline's hand reader replaced by the same shared reader.
- Not chosen: the hand readers kept beside the library, the lazy option, which leaves two LaTeX section readers.

Where it applies: D14, and the Files Outline and D25's sticky scroll through the shared reader. Booked in the state file's closed log and `plan.md` Rulings.

## Z194 (2026-10-02, D17's brief check): the command files and approvals

- Chosen: the form's `~/.oculus/commands.json` through the write chain; `depends_on` in order; approvals in the one `approvals.json` `DESIGN.md` describes (`command:<sha256>` over the exact text and folders, 0600, rename and read back), shared with the apps; a chain in one task terminal; `remain-on-exit` in the same tmux call; Restart behind a confirmation naming the process.
- Not chosen: a separate approvals file of D17's own shape, which contradicts `DESIGN.md`; Restart with no confirmation, which contradicts the Processes rule.

Where it applies: D17, and the apps and D20 through the shared approvals module. Booked in the state file's closed log and `plan.md` Rulings.

## Z389 (2026-10-04, T1d's first run): which view tests the audits check reads

The check as Z376 (b) set it flags 393 cases in 47 files that test plain `.ts` modules of `src/lib/views/`, whose own folder is `tests/views/`. Options: (a) the check reads only files that import a `.svelte` component, and a file that imports none tests a view-layer module and stays; (b) a new folder for those tests, about 47 files moved and `tests/` mirroring `src/lib/` no longer; (c) the allow list and "audits" titles kept, the lazy option. Chosen (a): every view test that imports a view must draw it, and nothing moves away from the code it tests.

## Z388 (2026-10-04, T1b's round review): a bound cleared on success

`arrival.ts` arms a real 1000 ms timer while a test waits for a signal and clears it when the signal comes. Options: (a) a bound with no timer on success, through `onTestFailed` or the test's `signal`, not verified to carry the message; (b) no Decision 1 cause, since the test awaits the signal; (c) the tests tagged slow, the lazy option. Chosen (b).

## Z387 (2026-10-04, T1b's round): same-branch rows in the failed-read table

Six rows of `shared/answers.test.ts`'s failed-read table turn red only together with a kept row under every control. Options: (a) kept, the lazy option; (b) deleted at landing. Chosen (b): one test per behaviour.

## Z386 (2026-10-04, T1b's round): the refusal words' mapping

After the catalog-text test was deleted, nothing checks that `refusalSentence` maps each of 19 file-operation words to its own key. Options: (a) left, the lazy option; (b) a test of distinct keys over `answers.ts` with the catalog stubbed, added at landing. Chosen (b): it asserts code, not catalog text.

## Z385 (2026-10-04, T1e's review): the route-shape check

`tests/routes/shape.test.ts` reads the source of every API route for structure; no written rule asks for it. Options: (a) deleted, the source-text kind the test rule removes; (b) a rule written into `DESIGN.md` and the check moved to `tests/checks`; (c) kept with no rule, the lazy option. Chosen (a).

## Z384 (2026-10-04, T1e's review): slow tags under 100 ms

Seven file and describe tags and three per-test tags covered tests whose minimum was under 100 ms in both the builder's runs and the reviewer's. Options: (a) a tag stands on a cause or a minimum of 100 ms or more, a file or describe tag only where every test under it meets one, the rest moved to single tests; (b) left as near-the-line tags under Z379, the lazy option, which takes passing tests out of every gate. Chosen (a).

## Z383 (2026-10-04, T1b's review): a process started at module load in a slow-tagged file

The file tag keeps a file's tests out of `npm test` but not its imports, so `commands-pane.test.ts` still runs `tmux -V` and spends about 6 s on import in every quick run. Options: (a) a file-tagged file imports such a module with `await import` inside its slow `beforeAll`, T1b's file in its round and T1c's tmux files in T1a; (b) the brief's premise left as written, the lazy option. Chosen (a).

## Z382 (2026-10-04, T1b's review): work at collection

T1b moved a cold config read (about 118 ms) from a `beforeEach` into a describe body, where it runs at collection and leaves the measured test time. Options: (a) collection work counts with the tests it serves, as a hook does; (b) it does not, the lazy option. Chosen (a): the read goes into that describe's `beforeAll`, and the describe is tagged slow.

## Z381 (2026-10-04, T1b's review): assertion cuts in kept tests and a new fold file

About 94 hunks cut or rewrite assertions of kept tests (shipped constants, catalog text, cases on the same branch as a kept one), and the refusal tables of eight stores moved into a new `shared/answers.test.ts`. Options: (a) accepted as deletions under the test rule and as a fold to the lowest level, each cut listed with its holder, the new file's catalog-text test deleted and its tests given failing lines; (b) every cut put back, the lazy option; (c) accepted with no listing. Chosen (a).

## Z380 (2026-10-04, Axel): the look of Q81

Axel: leave the look of Q81 for later. It waits until he takes it up, is not asked of him in reports, and other landings go on.

## Z377 (2026-10-04, the recurring-findings pass): the size check's line

In 9 of the last 14 steps a builder left a file within 20 lines of the size check's line. Options: (a) `tests/checks/tree/size.test.ts` and `utils/size-check.sh` refuse a file over 880 lines and a component over 520, built in T1a, which splits the 13 files on main over those numbers; (b) the rule stays a sentence in `agents/spec.md`, the lazy option. Chosen (a): a builder then sees the line in its own run.

## Z376 (2026-10-04, /spec T1d): the audits check against Z354

`tests/checks/tree/audits.test.ts` fails a non-rendering case under `tests/views/` unless its title starts with "audits" or it is on `allow-audits.txt`; Z354 says no audits. Options: (a) delete the check and its list; (b) rewrite the check to compute one fact, each case under `tests/views/` whose body reaches no `render()`, no `mount()` and no name the file binds to one, failed with no title escape and no allow list, a kept case of that kind moved to the folder of the code it calls, T1d dispatched after T1b lands; (c) keep "audits" in the titles, the lazy option. Chosen (b): it holds Z354 by a fact a machine computes. What the check computes is the sentence of (b), for Axel's review.

## Z379 (2026-10-04, T1c's landing): the tests near the 100 ms line

Two five-run samples, the builder's and the round reviewer's, taken at different loads, put 8 tagged tests under 100 ms and one untagged test over it, and no test sat on the wrong side in both. Options: (a) the builder's measured tags stand, and T1a chooses the quick list from measured file times within its 30 s limit; (b) retag every test by the minimum over both samples; (c) tag every test near the line, the lazy option. Chosen (a): the line moves with the load, and T1a decides what runs quick.

## Z378 (2026-10-04, the recurring-findings pass): the rule sentences

Nine causes recur in three or more of the 14 steps reviewed since 2026-10-02: builder git commands (8 steps), paths outside the write list unmarked (11), exports with no importer (9), files brought near the size line (9), documents made false (11), assertion edits unlisted (6), first runs not per test (5), history wording (4), reviewer git commands (7). Options: (a) the sentences adopted under Z251 (the user: each such cause ends in a rule sentence or a sentence every brief carries); (b) each raised to Axel; (c) nothing changed, the lazy option. Chosen (a): `agents/spec.md` and the standing demands now carry them, the record in `agents/reviews/recurring-2026-10-04.md`.

## Z375 (2026-10-03, D25's owed look of the hunk bar at 300 px): where the cut Revert Block is fixed

The look found Revert Block drawn under the diff's overview ruler in a pane about 300 px wide, its label cut to "Revert Bl". Options: (a) built in D42, the next open step on the diff view; (b) a step of its own, which enters the plan only by Axel's ruling; (c) left, the lazy option. Taken: (a).

## Z364 (2026-10-03, the slow tier's run): the bare `isMap` imports

- Chosen (a): T1 fixes the three imports and lands with the slow tier green but for X3e's colour finding.
- Not chosen: (b) a fix outside any step; (c) a new step, which only Axel adds.

Where it applies: T1. Booked in the state file's closed log and `plan.md` Rulings.

## Z362 (2026-10-03, D25's landing): the looks not taken

- Chosen (a): the four looks are owed in `queue.md` and taken at the next look session.
- Not chosen: (b) leaving them to their tests, the lazy option.

Where it applies: the owed looks. Booked in the state file's closed log and `plan.md` Rulings.

## Z359 (2026-10-03, D25's landing): the open-editors dirty dot and the colour rule

- Chosen (a): X3e, the Files view step, is widened: the open-editors list's dirty dot takes a colour token the slow colour rule accepts.
- Not chosen: (b) a fix at D25's landing, outside D25's brief (the Files view is X3a's and X3e's); (c) widening the rule to accept `currentColor`, a check loosened, the lazy option.

Where it applies: X3e. Booked in the state file's closed log and `plan.md` Rulings.

## Z358 (2026-10-03, Q91's look): the Focus ticker's cut rows

- Chosen (a): X3e is widened: a ticker row cut by its ellipsis gives its whole text as its tooltip.
- Not chosen: (b) a new step for one tooltip, which only Axel's ruling can add; (c) leaving the cut end unreadable, the lazy option.

Where it applies: X3e. Booked in the state file's closed log and `plan.md` Rulings.

## Z355 (2026-10-03, Axel's test ruling): the tests of the steps in flight

- Chosen (a): the landing of X3c, Q91 and D25 reads each test the step added and deletes those that break `agents/spec.md`'s test rule, as a fix at landing.
- Not chosen: (b) leaving them to T1, which reads the tree at its own base and misses the tests of a step that lands after it; the lazy option.

Where it applies: the landings of X3c, Q91 and D25. Booked in the state file's closed log and `plan.md` Rulings.

## Z352 (2026-10-03, Axel's question): T1 runs alone

- Chosen (a): T1 is prepared once X3c, Q91 and D25 have landed, its timings and its landing's 30 s check are taken with nothing else running, and nothing else is dispatched until it lands.
- Not chosen: (b) T1 beside other steps with timings in quiet moments, which cannot be arranged.

Where it applies: T1 and the queue. Booked in the state file's closed log and `plan.md` Rulings.

## Z349 (2026-10-03, D25's repair round 1): where three test files of D25 live

- Chosen (b): `symbols.test.ts`, `source-options.test.ts` and `compare-header.client.test.ts` go back under `tests/state/` with titles that say what they assert, since `tests/checks/tree/audits.test.ts` lets a case under `tests/views/` that renders nothing stand only as an audit.
- Not chosen: (a) 32 cases titled "audits that ..." while they assert values, the cheaper option; (c) entries in the closed `allow-audits.txt`.

Where it applies: D25, fixed at its landing. Booked in the state file's closed log and `plan.md` Rulings.

## Z330 (2026-10-03, D25's brief check): the language picker's entries and the repository file read again

- Chosen (a): the language picker takes VS Code 1.137's entries: Auto Detect (oculus's detection by name and extension), Configure File Association for '<ending>'... (a second list; its choice writes `sources.yml`'s `languages:` through the undoable `config-value` write), Configure '<language>' language based settings... (the Settings view at `@id:editor.languages`), each language's description `(<name>)` and the one in force `(<name>) - Configured Language`; the Marketplace entry left out. A source-tab save marks the saved file's text, so `.oculus/settings.yml` saved in oculus is read again at once; an edit outside oculus at the Files view's refresh or a reload.
- Not chosen: (b) the brief's earlier picker ("(current)", Configure File Association opening Settings) and a reload to see a changed repository file, the lazy option; (c) a server poll of every root's `.oculus/settings.yml`, while no other Files text is watched.

Where it is built: D25's brief, items 2 and 13, decisions 10 and 11. Booked in the state file's closed log and `plan.md` Rulings.

## Z329 (2026-10-03, /spec D25): the editor options' keys

- Chosen: `editor.tab_size` 4, `editor.insert_spaces` true, `editor.word_wrap` off (off, on, wordWrapColumn, bounded), `editor.minimap` true, `editor.render_whitespace` selection (none, boundary, selection, trailing, all), `editor.sticky_scroll` true, and the family `editor.languages` keyed by language with `tab_size`, `insert_spaces`, `word_wrap` and `rulers`, all in `config/behavior.yml`'s `editor:` block; a repository's `.oculus/settings.yml` with `languages:`, read from the Files root holding the file; a value taken from the tab's choice, the detected indentation, the root's file, `editor.languages`, then the global key; the Settings view naming each root whose file sets a language, with a link.
- Not chosen: a separate `editor.yml`; VS Code's quoted `"[python]"` keys; a global `editor.rulers`, which the list editor cannot hold as numbers.

Where it applies: D25. Booked in the state file's closed log and `plan.md` Rulings.

## Z324 (2026-10-03, /spec X3c): the brief check's findings closed

- Chosen: a pinned tab keeps its pin across a float, a page move and a split; Delete on a pinned tab follows VS Code's `preventPinnedEditorClose` default; Pin Editor and Unpin Editor are palette items of kind `editor` with Cmd+K Shift+Enter as a hint; the tab menu is VS Code 1.137's with Reveal in Finder, Compare, Keep Open disabled off a preview, the Split & Move submenu and the name Show in Files; `wrap_tabs` repaired to `false` with no finding, its actions at the end of the last row; the breadcrumb in the strip's title area; the tooltip's `~` from a home folder the roots answer gains; a `doc` tab read under the hub root; a new tab opens right of the active one; the strip measured against VS Code's stylesheet; the Open Editors Close All keeps pinned tabs.
- Not chosen: a live Cmd+K Shift+Enter chord, which changes what Cmd+K does everywhere; a pin lost on a float; the narrower menu of the first brief, the lazy option; the breadcrumb inside `PaneBody`, which enlarges its drop box.

Where it applies: X3c. Booked in the state file's closed log and `plan.md` Rulings.

## Z323 (2026-10-03, D17's look): a task terminal's row title

- Chosen: a task terminal's row in the Terminal tab's list is titled by the project command it ran, as its tab is, a title the reader gave still winning.
- Not chosen: the process tmux reports, which reads `cd` for every task line.

Where it applies: D17. Booked in the state file's closed log and `plan.md` Rulings.

## Z322 (2026-10-03, D17's look): a run's source tab

- Chosen: a command run from a button in another view (the bar, the card, the Files menu) reads its placeholders from the source tab on screen, or else from the source tab whose editor had the focus last, as VS Code's `${file}` reads the last active editor; the default keys keep the active source tab.
- Not chosen: the active tab alone, under which a press on the bar always made the Repositories view active and refused every placeholder but `${workspaceFolder}`, the lazy option; the last-published tab, which a tab merely mounting would take.

Where it applies: D17. Booked in the state file's closed log and `plan.md` Rulings.

## Z321 (2026-10-03, D17's landing, the merge with D32): command refusals in the server's words

- Chosen: the refusals of the terminal route's `command`, `rerun`, `restart` and `capture` actions reach the reader as the server's own sentence (the missing selection, the missing file, a cycle, an unknown command), narrowing Z265 as Z287 did.
- Not chosen: Z265 as it stands, which says "The server refused the request (HTTP 400)" for a missing selection; a catalog word per refusal on the page, which repeats the server's catalog.

Where it applies: D17. Booked in the state file's closed log and `plan.md` Rulings.

## Z320 (2026-10-03, D17's placeholders at landing): the placeholder form

- Chosen: each placeholder becomes `${OCULUS_ARG_<n>+"$OCULUS_ARG_<n>"}` in the run line, its value set in the task's environment, in place of Z305's literal `"$OCULUS_ARG_<n>"`, which closes a run line's own double quotes and splits and globs the value there; a line that evaluates text itself (`eval`, `sh -c`, `$((...))` in bash) still evaluates the value.
- Not chosen: the literal `"$OCULUS_ARG_<n>"`, which splits a value written inside double quotes; refusing a placeholder inside double quotes, which brings back the check Z305 removed.

Where it applies: D17. Booked in the state file's closed log and `plan.md` Rulings.

## Z319 (2026-10-03, S4's look): the two defects of the Settings editors

- Chosen: D25 widened, the step that adds its controls to the Settings editors: Save of an emptied key/value family of single values ends its draft once the file holds what was sent, its cause found at /spec; Undo of a `config-value` write gives back the lines the write replaced, the file's alignment included.
- Not chosen: a new step of its own, against the rule that a defect goes into the step that changes its files; fixing them at landing, since the first has no known cause; an open item, the lazy option.

Where it applies: D25. Booked in the state file's closed log and `plan.md` Rulings.

## Z318 (2026-10-03, D14's look): the seven defects of the LaTeX build and view

- Chosen: a new step D14b after D14, queued after D32b and built by a builder: a build's terminal kept readable when latexmk exits at once, with every terminal refusal a word; the folder read once a build has ended and whenever the view opens or a `.tex` file or PDF in it changes; Format Document undoable; "1 problem" in the singular; Open LaTeX on a folder holding a `.tex` file whether or not it was expanded; the picture hover drawn at the image's size.
- Not chosen: fixing them at landing, too large for a landing fix and three with causes not yet found; an open item, or folding them into D15, the lazy option.

Where it applies: D14b. Booked in the state file's closed log and `plan.md` Rulings.

## Z317 (2026-10-03, D14's landing): the LaTeX refusals as words

- Chosen: every refusal of the LaTeX routes is a word (`LATEX_REFUSALS` in `data/prose/latex.ts`) whose whole sentence is a `refused_*` key of `latex.yml`, said by the page through `refusedAnswer` as the ops refusals are; a root without a path is refused `not-an-action`.
- Not chosen: a catalog key for each engine word filled into a sentence (Standards 2's reading), which keeps a sentence built from the server's parts.

Where it applies: D14, and every later LaTeX route. Booked in the state file's closed log and `plan.md` Rulings.

## Z316 (2026-10-03, D32's look): the three defects of the Search view's replace

- Chosen: a new step D32b after D32, queued after Q91 and built by a builder: the hits of a written file read again after a replace; the cap note and the Replace All question's cap sentence only when the cap cut, a root that ran out of time said to have done so; the Replace Preview opened beside the Search view.
- Not chosen: fixing them at landing, too large for a landing fix; an open item, or a later step on another surface, the lazy option.

Where it applies: D32b. Booked in the state file's closed log and `plan.md` Rulings.

## Z313 (2026-10-03, the Q99 and Q79c looks): the Sessions New button into D20, the Memories exception into X3c

Chosen: the New button's press opening the composer is built in D20, which changes the Sessions and Terminal views, its cause found at D20's /spec; the Memories view's exception joins Z310 in X3c, whose paths already hold `Memories.svelte`.

Not chosen:
- /diagnose by the orchestrator now: investigation outside a step.
- A new step: it needs Axel's ruling.

Where it applies: D20 and X3c. Booked in the state file's closed log and `plan.md` Rulings.

## Z312 (2026-10-03, the Q88 look): the Graph's pill menus and the commit time limit into D20

Chosen: built in D20, which changes the Repositories view and runs git there; a pill's right-click opens the name's own menu, and the commit's while a write is in flight; a commit with long hooks completes, and a failed git command says why. The commit Confirm's missing focus and its ground under the right pane join Z310 in X3c.

Not chosen:
- /diagnose by the orchestrator now: investigation outside a step.
- A new step: it needs Axel's ruling.

Where it applies: D20 and X3c. Booked in the state file's closed log and `plan.md` Rulings.

## Z311 (2026-10-03, the Q82 look): two tree keys into X3e

Chosen: built in X3e, which rebuilds the Files trees' keys and drag; Cmd+A selects a tree's rows (VS Code's `list.selectAll`) and Cmd+Enter opens a row to the side (`list.openToSide`).

Not chosen:
- X3c: its paths hold no tree.
- A new step: it needs Axel's ruling.

Where it applies: X3e. Booked in the state file's closed log and `plan.md` Rulings.

## Z310 (2026-10-03, the Q81 look): four focus and overlay defects into X3c

Chosen: built in X3c, which already writes the tab strip, the palette and the key sheet's text; its paths widened to the modal ground, the quiet focus helpers and the Memories view. X3c's /spec finds each cause read-only and writes it into the brief, and a cause not found goes to Axel as an open item.

Not chosen:
- /diagnose by the orchestrator now: the investigation would run in the orchestrating session, outside a step.
- A new step: it needs Axel's ruling.

Where it applies: X3c. Booked in the state file's closed log and `plan.md` Rulings.

## Z309 (2026-10-03, Z280 (c)): the LaTeX formatter's keys

Chosen: four keys in `behavior.yml`'s `latex:` section beside `auto_build`: `formatter`, one of `none`, `latexindent`, `tex-fmt` and `badness`, default `none`; and `latexindent_path`, `tex_fmt_path` and `badness_path`, each empty by default, meaning the program is found on PATH. They mirror LaTeX Workshop's `latex-workshop.formatting.latex` and its three `.path` settings. Built at D14's landing.

Not chosen:
- One key holding a map of paths: no Settings editor of a scalar draws it, and VS Code keeps a key per path.
- A section of its own: it splits the LaTeX settings across two sections.

Where it applies: D14's landing. Booked in the state file's closed log and `plan.md` Rulings.

## Z308 (2026-10-03, D32's run over round 1): its findings fixed at landing

Chosen: every finding fixed at landing on main, as `agents/reviews/D32-refuter.md` "Closed" lists; the "Replaced ..." sentence only after a Replace All with any later change writing the count back, and a toggle during a run cancelling it and running again, both as VS Code does.

Not chosen:
- A second repair round: the cap allows one only for an unbuilt acceptance item whose fix is too large for landing.
- Leaving findings 8 and 9 as partial: both are defects of item 5 and item 2.

Where it applies: D32's landing. Booked in the state file's closed log and `plan.md` Rulings.

## Z307 (2026-10-03, the Q99 look): two terminal defects into D20

Chosen: built in D20, which already carries the terminal look's other defects (Z297) and works in the terminal views; D20's /spec finds each cause read-only and writes it into the brief, and a cause not found goes to Axel as an open item.

Not chosen:
- /diagnose by the orchestrator now: the investigation would run in the orchestrating session, outside a step.
- A new step: it needs Axel's ruling, and D20 already holds the terminal work.

Where it applies: D20. Booked in the state file's closed log and `plan.md` Rulings.

## Z305 and Z280 (2026-10-03, Axel's rulings)

Z305: (a), placeholder values as environment variables, at D17's landing. Z280: (c), VS Code's formatter setting with none, latexindent, tex-fmt and badness, default none, a path per program, at D14's landing, tex-fmt installed. Ruled by Axel; booked in `plan.md` Rulings and the state file's closed log.

## Z306 (2026-10-03, S4's round 2 review, R2-b): list values in key/value families

Chosen: the options catalog decides. `holds: lists`, which Z302 put on a family whose keys hold lists of records, also marks a key/value family whose keys hold lists of values; `sources.yml` `languages` carries it. The write reads the catalog entry, so an emptied `read_limits`, `deck.tag_tones` or `tab_split` refuses a list, and Undo of the write that emptied `languages` still takes lists, since the catalog says so. Fixed at landing on main, since S4's rounds are spent.

Not chosen:
- The empty-table clause as built: a table with no entries takes a list, a wrong configuration accepted.
- Refusing every list in an empty table: Undo of emptying `languages` would be refused.
- A second catalog word for lists of values: `holds: lists` already says each key holds a list.

Where it applies: S4's landing. Booked in the state file's closed log and `plan.md` Rulings.

## Z304 (2026-10-02, D17's round 2 report, D17-B): the marker a chain prints before each command

Chosen: (b), the printed line carries a per-run token with the command's name, and the store advances only on that exact line. A command's own output can hold a line equal to the next command's name (a make target echoing `test`, say); with the bare name, its errors would then resolve from the next command's folder. Fixed at landing on main, since D17's rounds are spent.

Not chosen:
- (a), the bare name as built: the lazy option, a known wrong folder kept.

Where it applies: D17's landing. Booked in the state file's closed log and `plan.md` Rulings.

## Z303 (2026-10-02, D14's round 1 report, D14-glyph): the LaTeX tab's glyph, again

Chosen: (a), `journals` (`[n]`, `newspaper`), a typeset page that no view uses; the tree has it now. Z300 chose `paper` on a wrong premise: `paper` is the Document view's glyph, and `tests/state/workbench/navigation/registry.test.ts` refuses two views sharing one.

Not chosen:
- (b), `paper` for LaTeX and another glyph for Document: it changes a view D14 does not own.
- (c), `paper` for both with an exemption in the registry test: the lazy option, a check loosened.
- (d), `publish`: Source Control's Publish action, replaced by Z300.

Where it applies: D14. Booked in the state file's closed log and `plan.md` Rulings.

## Z302 (2026-10-02, S4's refuter report, B5): an emptied `tab_rollup`

Chosen: (a), a family entry of the options catalog may carry `holds: lists`, meaning each key of the map holds a list of records; `tab_rollup` carries it. The editor draws the rollup form for `tab_rollup: {}`, and the write refuses a key holding a single record under such a family, so a shape the boards' roll-up does not take is never saved.

Not chosen:
- (b), the records form for an empty map: the lazy option; the reviewer's probe saved `{ projects: { label: x, keys: [a], color: red } }`, a shape the roll-up does not take, and no reader refused it.
- Guessing from the family's name or fields: no rule in the catalog says it.

Where it applies: S4, repair round 1. Booked in the state file's closed log and `plan.md` Rulings.

## Z301 (2026-10-02, D17's refuter report): the form's place, preset names, the approvals folder, the approval key and quoted placeholders

Chosen:
- The command form and the approval dialog stay drawn by the shell (a default key asks with no bar mounted; a wall surface under a tinted view is refused), moved from `shell/keys/` to `shell/commands/`.
- Found presets keep three names, `cmake: <n>`, `cmake build: <n>` and `ctest: <n>`, so a configure and a build preset of one name stay apart; HELP.md says so.
- Each approvals write makes the approvals folder 0700 when it is looser; `~/.oculus` is 0755 on this machine.
- A command's approval key includes the repository's real absolute path, as an app's folder is in its hash in DESIGN.md's Approval paragraph, so approving a text in one repository does not approve it in another; within the processes rule's "that exact text on this machine".
- A placeholder inside single or double quotes in a run line is refused at save and at run, since a value inside double quotes can run `$(...)` unapproved.
- A chain is approved as one text, every line with its folder, as DESIGN.md already says.

Not chosen:
- The form in `shell/keys/`: that folder holds keys.
- One `cmake:` name for all presets: a configure and a build preset named `default` collide and one is dropped.
- A folder of its own for the approvals file: it moves a path `local.yml` names by default.
- The key without the repository, as built: one approval covers every repository holding the same text.
- Leaving quoted placeholders: the lazy option; a selection can run code no one approved.

Where it applies: D17, repair round 1. Booked in the state file's closed log and `plan.md` Rulings.

## Z300 (2026-10-02, D14's refuter report, Spec 2 and Spec 3): where the LaTeX reader lives, and the LaTeX tab's glyph

Chosen: the reader at `data/prose/latex.ts`, beside `markdown.ts`, whose head comment says it is one rule imported by both sides, the same concern; the LaTeX tab draws the existing `paper` glyph (`[d]`, `file-text`), a page of text.

Not chosen:
- `data/helpers/files/latex.ts`, as built: that folder holds helpers about file names, paths and kinds.
- `publish` (`cloud-upload`), as built: it is Source Control's Publish action and reads as "upload".
- A new glyph key: it adds a vocabulary entry where `paper` already reads as a document.

Where it applies: D14, repair round 1. Booked in the state file's closed log and `plan.md` Rulings.

## Z299 (2026-10-02, D14's refuter report, Behaviour 4): the Outline of a file the LaTeX parser refuses

Chosen: on a refusal by `latex-utensils`, the shared reader reads the sectioning commands with a line scan that skips `%` comments and returns them with `refused: true`; the Files Outline and the LaTeX view draw them, and the LaTeX view keeps its line that the file was not parsed. One reader module stays, as Z279 wanted.

Not chosen:
- Z279 as built, a refused file listed as skipped: the Outline of three real hub files went from 20, 18 and 21 headings to 0, and any file mid-edit with an unclosed brace or a lone `$` shows an empty Outline.
- A tolerant parser library in place of `latex-utensils`: it reverses the library Axel named in LA18.
- Keeping the last good outline while a file is unreadable: it leaves a file never parsed (the three real files) empty.

Where it applies: D14, repair round 1. Booked in the state file's closed log and `plan.md` Rulings.

## Z298 (2026-10-02, D17's report, D17-A): the errors of a task terminal no pane shows

Chosen: (a), one capture when the task terminal ends: the commands store asks the server for the terminal's captured output (tmux `capture-pane`, a new `capture` action of the terminal route) and reads its diagnostics from it. VS Code's problem matchers read a task's output whether or not its terminal is on screen, so the errors reach the Problems view (D33) for every task. Sent to D17's builder in its repair round.

Not chosen:
- (b), a page subscription per running task terminal: one tmux control client per task and a grid size for a grid that does not exist.
- Leaving it: the lazy option; D33's Problems view would show nothing for a task not on screen.

Where it applies: D17. Booked in the state file's closed log and `plan.md` Rulings.

## Z297 (2026-10-02, the terminal look): two terminal defects

Chosen: built in D20, which starts agents in Terminal tabs from a task or a worktree and so works in the terminal views and their start: an armed Kill draws armed, and a Terminal tab whose shell is starting draws the terminal starting, never the composer. `TerminalList.svelte` and `terminals.svelte.ts` join D20's paths at its /spec.

Not chosen:
- A new step: it needs Axel's ruling.
- Leaving them: both are defects of delivered work.

Where it applies: D20. Booked in the state file's closed log and `plan.md` Rulings.

## Z296 (2026-10-02, the U4 look): a long word crossing its box in a narrow Focus pane

Chosen: built in Q91, which already works in the Focus view (its follow-up rows): a Focus lane card's note (`Band.svelte`) and the career panel's summary (`CareerPanel.svelte`) wrap a long word inside their box, so nothing crosses a border and the view never scrolls sideways. Both files join Q91's paths at its /spec.

Not chosen:
- A new step: it needs Axel's ruling, for two style rules.
- Leaving it: text drawn across a card's border is a defect of delivered work.

Where it applies: Q91. Booked in the state file's closed log and `plan.md` Rulings.

## Z295 (2026-10-02, the A1 light look): the branch item gone over a diff tab

Chosen: built in X3c, the tab strip step, which reads the file of the tab on screen for its breadcrumbs and tooltip: `repoStatus` also takes a tab whose state names its repository by folder, as a diff tab does, so the status bar keeps its branch and sync items, as VS Code's does for a diff editor. `src/lib/state/workbench/navigation/status.ts` joins X3c's paths at its /spec.

Not chosen:
- A new step: it needs Axel's ruling, and the fix is a few lines in the function X3c's tab reads sit beside.
- Leaving it: the branch item vanishing under a diff is a defect of delivered work.

Where it applies: X3c. Booked in the state file's closed log and `plan.md` Rulings.

## Z294 (2026-10-02, the Q78 look): an active tab out of sight

Chosen: built in X3c, the tab strip step: the strip scrolls the active tab into view whenever a tab becomes active, as VS Code's does.

Not chosen:
- A new step: it needs Axel's ruling and would change the strip X3c changes.

Where it applies: X3c. Booked in the state file's closed log and `plan.md` Rulings.

## Z293 (2026-10-02, the U3 look): its two defects

Chosen: U3-look-1 (a tab's title shrinking to one letter at 150% text in a narrow pane) in X3c, the tab strip step; U3-look-2 (the Text size row showing no current size) in D25, which adds Settings controls, with `BrowserControl.svelte` added to its paths.

Not chosen:
- New steps: they need Axel's ruling and would change the files X3c and D25 change.

Where it applies: X3c and D25. Booked in the state file's closed log and `plan.md` Rulings.

## Z292 (2026-10-02, the R18 look): the palette's row overlap

Chosen: built in X3c, which already changes the palette's commands; `src/lib/shell/keys/Palette.svelte` joins its paths at its brief closure, and a long row keeps to one line cut with an ellipsis, as VS Code's quick pick.

Not chosen:
- A new step: it needs Axel's ruling and would change the file X3c changes.

Where it applies: X3c. Booked in the state file's closed log and `plan.md` Rulings.

## Z291b (2026-10-02, after Axel lowered `workers_at_once` to three): the steps in flight beyond three

Chosen: none is stopped. D14, D17 and S4 finish their builds; D18 and D32, whose builders are done, land; that leaves three in flight, and no builder is dispatched while three or more steps are in flight.

Not chosen:
- Stopping a running builder: it throws away about 2.5 h of work that a continuation builder would redo, and the load it saves lasts only until that continuation runs.

Where it applies: the next /spec dispatches. Booked in the state file's closed log and `plan.md` Rulings.

## Z289 (2026-10-02, the owed looks): the looks' defects folded into the queued steps

Chosen: every defect of `agents/reviews/owed-looks.md` is built in a queued step whose files it touches, each named in that step's brief or, for a step not yet prepared, on its plan line for its /spec:
- X3c (the tab strip): M3-4 (a Markdown preview table's first column squeezed to letters), D13a-4 (the Markdown preview on by default and over half a narrow pane), Q88c-15 (Editor Actions Position's "Title Bar", no check mark, a float's More under Hidden), Q88c-16 (New Text File opens a note form), Q88c-17 (closing a tab activates its left neighbour), L4-1 (Float and Return to Page lose the terminal's scroll position), L4-2 (a Terminal tab titled by an internal id).
- Q91 (the project view and its manifest editor): M3-1 (no glyph on machine and storage resource tags), M3-2 (the chips field's keyboard-active choice drawn as chosen), M3-3 (the card's More menu in mixed casing), Q88c-18 (the manifest editor says "saving" during a git write).
- X3e (the Files view's lists, with Z269's repository scan): X3a-1 to X3a-7, Q88c-1 to Q88c-14 and Q88c-19 to Q88c-22, D27-3, D13a-5, A1-4, and the hub's Graph reading for about 10 s at a count of 0.
- D25 (the editor's options): D13a-1, D13a-2, D27-1, D27-2, D27-4, D27-5, A1-1, A1-2, A1-3.
- D28 (saving a source file): D13a-3 (a small file waits 4 to 6 s for its first snapshot).
- D15 (PDF reading and the document frame): M4-1 (formulas near-white on the equation card), M4-2 (an equation card cut in a narrow pane), M4-3 (Restore panes reloads the document frame).
- D20 (an agent from a task or a worktree, the sessions step): Q66-1 (a transcript above Node's string limit reads as no turns and is read whole again on every activity).

Not chosen:
- New steps for them, which need Axel's ruling and would change the same files as the steps named.
- Leaving them in the owed-looks record only, the lazy option.

Where it applies: the briefs of X3c, Q91 and X3e, and the plan lines of D25, D28, D15 and D20.

## Z288 (2026-10-02, Axel's look): five defects folded into X3c

Chosen: the five defects of Axel's look on 2026-10-02 are built in X3c: (1) a file tab draws a path breadcrumb (root, folders, file) in place of its file-name header row, at VS Code's measured size; (2) the tab's own buttons (Save, Revert, the star, Open in Program, Preview, Blame) move to the right end of the tab strip and the second row goes; (3) the breadcrumb's size is VS Code's, measured from its stylesheet; (4) a long palette result stays on one line with an ellipsis; (5) a click on a rail button never writes a rail reorder, its cause found read-only while X3c's brief is closed (the orchestrator, automode).

Not chosen:
- A new step, which needs Axel's ruling and would change the same strip, header and palette files as X3c.

Where it applies: `agents/briefs/X3c.md`.

## Z287 (2026-10-02, D32's review): the pattern refusal's reason

Chosen: a pattern ripgrep cannot read is refused with the catalog sentence and ripgrep's own reason in it, as VS Code's Search view shows ripgrep's regex parse error (the orchestrator, automode).

Not chosen:
- The catalog sentence alone, as Z265 reads. It hides which part of the regular expression is wrong.

Where it applies: `agents/briefs/D32-round1.md` ruling 4.

## Z286 (2026-10-02, Q91's brief check): the card's tree, revising Z283

Chosen: the explorer tree moves under `views/shared/explorer/`, and the Files view and every card (the board's open card and the project tab's) draw it; each card's tree has its own state record `<tab id>#files:<project id>`, cleared when the tab closes and followed on a rename; the card's finder box stays above the tree and lists flat matches while text is typed; the tree's row menu gains Open in Program; a `followup:` list of one note is written as that note, and emptying the note's text removes the note (the orchestrator, automode).

Not chosen:
- An allow row in the boundaries test so the card imports from `views/sources/`. Cheaper, and it widens the layer rule instead of meeting it: the lazy option.
- The tree replacing the finder. The tree's filter reads only listed folders, so project-wide search, opening in a program, sizes and recency would be lost.
- The tree in the project view only (Z283 as first booked). The board card would keep a second, different file list for the same project.

Where it applies: `agents/briefs/Q91.md` items 1 and 4, decisions 1-4.

## Z285 (2026-10-02, D32's report): the Replace Preview request

- Chosen: the preview read is a POST carrying the hits in its body, the same shape as the replace, so no address length limits it.
- Not chosen: (a) leaving the HTTP 431 past about 1400 hits in one file with its failure sentence; (c) refusing such a replace, the lazy option.

Where it applies: D32, its repair round. Booked in the state file's closed log and `plan.md` Rulings.

## Z284 (2026-10-02, X3e's /spec): where each reordered list is written, and the scan depth key

- Chosen: roots reorder within their group (default workspace: `sources.yml` through the `roots` write's `order` action; named workspace: `workspaces.json` through `POST /api/fs` `order-roots`); the hub and config folder fixed; the notes' order in `~/.oculus/notes/order.json`, a new note on top; the sections' order in the Files tab's instance state; Alt+Up and Alt+Down move a focused row; `repository_scan_depth` in `config/sources.yml`, default 1, range 0 to 3.
- Not chosen: notes left newest first with no stored order, the lazy option; moving the fixed roots, which no file holds.

Where it applies: X3e. Booked in the state file's closed log and `plan.md` Rulings.

## Z283 (2026-10-02, Q91's /spec): the project's file list as the Files view's tree

- Chosen: the project view draws the Files view's tree rooted at the project's folder, through one component moved out of `Files.svelte` and drawn by both; the card in the project view drops its flat list, the board's open card keeps it; several follow-up notes are read-only in the editor.
- Not chosen: restyling the card's flat list to look like the tree, the lazy option; the tree in every board card, which has no height to live in.

Where it applies: Q91. Booked in the state file's closed log and `plan.md` Rulings.

## Z282 (2026-10-02, S4's brief check): Processes in the merged System page

- Chosen: `processes` registers last in the merged group (order 9, after Gallery, lower right pane) with no chord; the second of D18 and S4 to land makes the merge; the group keeps the `settings` glyph and the rail button `sliders`.
- Not chosen: taking a chord from another view for Processes, which moves a chord a reader already uses; leaving the placement to whoever lands, the lazy option.

Where it applies: S4, D18. Booked in the state file's closed log and `plan.md` Rulings.

## Z281 (2026-10-02, D17's brief check): default build and test, clickable errors

- Chosen: `default: build` / `default: test` on a command; Cmd+Shift+B and Cmd+Alt+T run them for the repository of the active source tab's file; one error pattern `path:line[:column]` then `error` or `warning`, clickable in the task terminal and published for D33 in D14's diagnostics shape.
- Not chosen: the three widened parts left out of D17, the lazy option.

Where it applies: D17. Booked in the state file's closed log and `plan.md` Rulings.

## Z418 (2026-10-04, Axel's report of X3c): a new step for the file tab's actions and opening

- Chosen: a new step X3f, first in the queue after T1a's landing, for the double click, the file actions on every file tab and Open Preview; its /spec reproduces each on TEST and finds the causes.
- Not chosen: folding them into X3e, eleventh in the queue, which leaves them broken for ten landings; a note in X3c's landing report and no step, the lazy option.

Where it applies: X3f. Booked in `plan.md` Rulings and the queue.
