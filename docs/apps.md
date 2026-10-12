# Building an oculus app

An app is a folder of web files that oculus draws in a tab. This guide is the reference for building one: the manifest, the approval, managing apps, what an app adds to the shell, the host, every bridge method, channel and write, the refusal words, the limits, what an app cannot do and a worked example. The rest of the manual is [HELP.md](../HELP.md).

## What an app is

- An app is a folder holding an HTML page, its scripts and styles, and a manifest `app.yml`. oculus finds the folder while it runs and lists the app in the Views catalogue under Apps. A new or edited folder is picked up with no build and no restart.
- An approved app is drawn in an iframe with `sandbox="allow-scripts allow-downloads"`. It has an opaque origin: no cookies, no storage, no popups and no access to the rest of oculus. The only way out is the bridge, a client at `/apps/-/oculus.js` that the app's script imports.
- A machine app lives in the primary hub's `.oculus/apps/` folder and may read every channel an app can read. A root app lives in the `.oculus/apps/` folder of any other folder of the open workspace and travels with that repository. A root app is offered fewer channels, reads files only from its own folder, lists no `files`, and has no Remove. With no primary hub there are no machine apps, and a root app of a folder taken out of the workspace stops.
- An app whose manifest names a `host` also runs a program on this machine, the host, described in The host. An app is enabled or disabled, and a machine app can be removed or added from a folder, described in Managing apps.
- An app opens from the Apps button on the rail, from the Views catalogue (a root app's title is followed by its root's key in parentheses), or by the chord `v` and the digit the catalogue shows beside it.

## Where the files go

- A machine app's folder is `<apps_dir>/<name>/`, where `apps_dir` in the primary hub's `.oculus/local.yml` defaults to `<primary hub folder>/.oculus/apps`. A root app's folder is `<folder>/.oculus/apps/<name>/` for every folder of the workspace except the primary hub's, whose `.oculus/apps` is the machine folder.
- `apps_dir` takes a path. `~` and `~/...` are under your home folder, and any other relative value is resolved against the primary hub's folder. Oculus's own `config/` folder holds no apps, whatever name a workspace folder lists it under.
- An app folder is a direct subfolder of an apps folder and holds `app.yml`. Its name matches `^[a-z][a-z0-9-]{0,39}$`. A file in an apps folder, a folder whose name starts with a dot and a folder with no `app.yml` are skipped without a finding.
- A file or folder whose name starts with a dot, and every symbolic link, is not part of the app: it is neither hashed nor served. Subfolders are fine, and a path in the app has no empty or dot-led segment. At most 500 files and 20 MB are allowed, `app.yml` counted; past that the finding is `too_large` (limits are in Limits).
- The approval hash is a SHA-256 over the real folder path, the name, the bytes of `app.yml` and each recorded file's path and bytes in sorted order, every field framed by its length. Two copies of an app in two folders are two apps with two approvals, and moving a folder asks again.
- An app has one store file outside its folder, so writing the store never changes the hash: `~/.oculus/app-data/<name>.json` for a machine app, `<root>/.oculus/app-data/<name>.json` for a root app (git tracks it unless the root ignores `.oculus/app-data/`).
- Files are served at `/apps/<name>/<key>/<path>`, or `/apps/@<folder name>/<name>/<key>/<path>` for a root app. `<key>` is the first 32 hex characters of an HMAC-SHA256 over the view id and the hash, made with a secret minted at server start, so it changes with the files and with every server process. Use relative paths in the HTML and never copy an address.

## The manifest

`app.yml` is one map of the fifteen keys below. Any other key refuses the app (`key_unknown`).

| Key | Required | Type and limits | Findings |
|-----|----------|-----------------|----------|
| `name` | yes | matches `^[a-z][a-z0-9-]{0,39}$` and equals the folder's name | `name_empty`, `name_shape`, `name_not_folder` |
| `title` | yes | 1 to 40 characters after trimming, no control character | `key_missing`, `title_shape` |
| `description` | no | text of at most 200 characters, shown on the approval panel; every manifest word is drawn as text, never as HTML | `description_shape` |
| `glyph` | no | a name from `config/catalogs/glyphs.yml` other than `app`; default `app_view` | `glyph_unknown`, and the app is offered |
| `bridge` | yes | the number `1` | `key_missing`, `bridge_unknown` |
| `entry` | no | relative path ending in `.html` naming a file of the app; default `index.html` | `entry_shape`, `entry_missing` |
| `reads` | no | list of channel names, each once | `list_shape`, `list_repeated`, `channel_unknown`, `channel_closed` |
| `writes` | no | list of write kinds, each once | `list_shape`, `list_repeated`, `write_unknown`, `write_closed` |
| `connects` | no | list of origins, each once | `list_shape`, `list_repeated`, `connect_shape` |
| `host` | no | relative path ending in `.js` or `.mjs` naming a file of the app, run as the app's host | `host_shape`, `host_missing` |
| `files` | no | machine apps only: list of folders the app's page may read, each `<folder name>` or `<folder name>/<path>` | `files_root_app`, `files_unknown`, `files_shape`, `files_closed`, `files_private`, `list_shape`, `list_repeated` |
| `secrets` | no | `true` | `secrets_value` |
| `activation` | no | list of events, each once: `onTab`, `onStartupFinished`, `onCommand:<id>`, `onView:<id>`, `onLanguage:<id>`, `workspaceContains:<glob>`; absent means `[onTab]`; needs `host`; `onCommand:<id>` names a command and `onView:<id>` a view that `contributes` declares | `activation_no_host`, `event_unknown`, `event_empty`, `event_glob`, `event_command`, `event_view`, `list_shape`, `list_repeated` |
| `depends` | no | list of machine app names, each once, never the app's own | `depends_name`, `depends_self`, `list_shape`, `list_repeated` |
| `contributes` | no | a map of the nine contribution points of What an app adds to the shell | `contributes_*`, `id_taken`, `key_unknown` |

- A `files` entry names a folder of the open workspace: the folder name is the longest name of those folders that the entry equals or that is followed by `/` in it, and the rest is the path under it. The path has no empty or dot-led segment and names no folder of `closed_paths`, no private folder (see What an app cannot do) and no folder inside one. An entry that names no folder of the workspace is a finding (`files_unknown`) and the app is not an app. `hub` beside `hub/projects` keeps both, the wider one deciding. A folder that holds oculus's own `config/` folder is read as a folder of the workspace, and a read of a file in `config/` answers `closed`. A root app reads its own folder and nothing else, so `files` on a root app refuses the app.
- A `workspaceContains` glob is matched against paths relative to a root, and one that starts with `/` or holds a `..` segment refuses the app. `onLanguage:<id>` takes the language ids of the editor.
- A `depends` entry that is absent, refused, disabled or not approved does not refuse the folder: the host of the depending app waits and says which app it waits for.
- A finding other than `glyph_unknown` means the folder is not an app: it is not offered, registered or served. The Findings view shows each one with the file, the key `apps[<name>]` (`apps[<root>/<name>]` for a root app) and a sentence.
- A `connects` origin is `https://host` or `https://host:port`; `http:` is accepted only for `localhost` and `127.0.0.1` on a port other than oculus's own. No user name, path, query or wildcard is allowed, a trailing slash is dropped, and `wss:` gives `connect_shape`. An origin admits requests of its own scheme only.
- `app.yml` that does not parse gives `does not parse: <reason>`, and one that is not a map gives `is not a map of keys`. A file that cannot be read gives `file_unreadable`, and a folder over the file or size limit gives `too_large`.
- Five findings concern a folder or the machine as a whole: `folder_outside` (a root's `.oculus/apps` resolves outside the root), `repeated` (a folder whose real path an earlier one holds), `apps_dir_not_folder` (`apps_dir` names a file) `closed_paths_shape` (the `closed_paths` setting is missing or not a list) and `state_unread` (`~/.oculus/apps.json` does not read, so every app is disabled).

## Approval and change

An app runs only after you approve it. The panel in the app's tab names what it reads and writes, the outside addresses it reaches, where it keeps its data, its folder and its size, and offers three controls. An app with a `host` is also said to run a program on this machine with your rights, which can read and write your files and reach any address, and the panel names the host file. It says "Add 3 commands, 2 keys to oculus." with the kinds and counts of `contributes`. It names the folders `files` lists, says "Store secrets in the keyring of this machine" for `secrets: true`, and names the apps `depends` lists. An app that can read files (a machine app with `files`, or any root app) and has `connects` is said to be able to send what it reads from your files to those addresses.

| Control | Effect |
|---------|--------|
| Approve | Approves exactly the files shown. If a file changed meanwhile the approval is refused with "The app changed while you read it, so it was not approved. Read what it asks for now." |
| Keep approved while I edit | Approves the same way and keeps the app approved while its files change, until the oculus server process ends. Machine apps and root apps both offer it. |
| Open the app's folder | Shows the folder in the Files view; when no root shows it, the notice is "The folder of this app, <folder>, is inside no root the file browser shows." |

- Any change to any file changes the hash, and the tab shows the panel again: "This app changed since you approved it. Read what it asks for again and approve it to run it." A root app changed by a `git pull` asks again the same way. Revoke in the toolbar takes an approval back.
- A kept app stays approved when any file except `app.yml` changes: the frame reloads and no question is asked. A change to `app.yml` ends the keeping, because the manifest names what you approved. The host of a kept app does not run files other than the approved ones: while its files differ from the approved hash the host stops or does not start, and the tab says it waits for you to approve the changed files.
- Keeping is held in server memory. After a restart an app is approved by the entry Approve wrote to the approvals file, `~/.oculus/approvals.json` unless the `approvals` key of the primary hub's `.oculus/local.yml` names another, and it asks at the first change.
- A tab shows a lock mark while its app is not approved, an edit mark while it is kept approved and a disabled mark while it is disabled. A removed folder leaves the tab as `Unknown view: app:<name>` with its state kept, and the app is drawn again when the folder returns.

## Managing apps

- **Disable and enable.** Disable, Disable (Workspace), Enable and Enable (Workspace) are on an app's right-click menu in the Views catalogue, on its approval panel and on its tab. A disabled app stays in the catalogue with a disabled mark, its tabs show a line with an Enable button in place of the frame, its host stops, and it reads no channel, store, secret, file or command. The server refuses its file route, its fs route, its secrets, its host requests, its writes and its store while it is disabled.
- Disable and Enable change the state for the whole machine. Disable (Workspace) and Enable (Workspace) change it for the current workspace only. An app is disabled in a workspace when its view id is in that workspace's `disabled` list, or in the machine-wide list and not in that workspace's `enabled` list. A switch of workspace starts and stops hosts as the new state says.
- The state is kept in `~/.oculus/apps.json`: `{ "version": 1, "disabled": [<view id>], "workspaces": { "<workspace name, or default>": { "disabled": [<view id>], "enabled": [<view id>] } } }`. A file that does not parse reads every app as disabled, the Findings view names the file (`state_unread`), and Disable and Enable are refused with that reason and leave the file as it was until you put it right. An entry for a view id no app has is kept, so an app removed from a root and put back keeps its state.
- **Remove** is on a machine app's right-click menu and approval panel. The question names the app's folder and the number of secrets it holds. On yes, the host stops, and the folder and its store file move to the system trash (a link in the folder moves as a link, never its target). Every secret of the app is deleted from the keyring, its approval is revoked and its entry in `apps.json` is dropped. When the keyring is not available the question says the secrets could not be counted and will not be deleted, and Remove goes ahead. A root app offers no Remove: it is deleted from its repository. The tabs of a removed app stay and show the unknown view, as for a removed folder.
- **Add app from folder** is an action in the Apps group of the Views catalogue, and Add as App is on the right-click menu of a folder in the Files view that holds an `app.yml`. The folder must hold `app.yml`, have a name that matches the name pattern and that no entry of the machine apps folder holds, lie neither inside the apps folder nor hold it, and fit `max_files` and `max_mb`. It is copied without links and dot-led names, as the approval hash leaves them out, into a temporary folder beside the apps folder and renamed into place. A refusal says why in one line and copies nothing. Where the folder panel is not available the catalogue's action says so and names Add as App. The copied app asks for approval like any other.
- **Depends.** Disable or Remove of an app that enabled apps depend on asks first, naming those apps, and on yes disables them too and stops their hosts, the dependency's host last. A revoke of a dependency stops the hosts that depend on it, and each tab and Processes row says which app's revoke stopped it.

## What an app adds to the shell

`contributes` in `app.yml` is a map of VS Code's contribution points, each by its own name and in its own shape, written in YAML. An app adds nothing to the shell while it is unapproved, disabled, removed or changed since its approval. Its contributions are drawn from its approval on, before its host runs. They are withdrawn the moment one of those states begins, together with everything its host registered and every context key it set. The approval panel lists what the app adds by kind and count, as "Add 3 commands, 2 keys, 1 view, 1 setting to oculus."

```yaml
contributes:
  commands:
    - command: notes.new
      title: New Note
      category: Notes
      icon: $(add)
  keybindings:
    - command: notes.new
      key: ctrl+alt+n
      mac: cmd+alt+n
      when: notes.ready
  menus:
    commandPalette:
      - command: notes.new
        when: notes.ready
    view/title:
      - command: notes.new
        group: navigation
  viewsContainers:
    activitybar:
      - id: notes.bar
        title: Notes
  views:
    notes.bar:
      - id: notes.list
        name: Notes
        type: tree
  configuration:
    title: Notes
    properties:
      notes.width:
        type: integer
        default: 80
        minimum: 20
        description: Characters per line.
```

### Ids

- Every id an app adds (a command, a view container, a view, a custom editor's `viewType`, a setting key, a context key) starts with the app's `name` and a dot. An id that does not refuses the app (`contributes_id`), and so does one in the `oculus.` namespace, which is oculus's own (`contributes_reserved`), or one an app declares twice (`contributes_repeated`).
- Two apps may share a `name` (a machine app and a root app, or root apps of two roots). An id that an app earlier in the Views catalogue's order already declares refuses the later app with the finding `id_taken`, which names both apps.
- A view is `appview:<the app's view id, percent-encoded>#<the declared id>` in the Views catalogue, in the saved layout and for `onView:<id>`; the declared id is the one you write in `app.yml`.

### The points

| Point | Entries | Fields |
|-------|---------|--------|
| `commands` | list | `command`, `title`, `category?`, `icon?`, `enablement?` |
| `keybindings` | list | `command`, `key`, `mac?`, `linux?`, `win?`, `when?`, `args?` |
| `menus` | map from a menu id to a list | `command`, `when?`, `group?`, `alt?` |
| `viewsContainers` | map from `activitybar` or `panel` to a list | `id`, `title`, `icon?` |
| `views` | map from a container id, or `explorer`, to a list | `id`, `name`, `type?` (`tree` or `webview`), `when?`, `entry?` |
| `customEditors` | list | `viewType`, `displayName`, `selector` (list of `{ filenamePattern }`), `priority?` (`default` or `option`), `entry` |
| `configuration` | map | `title?`, `properties` (map from a setting key to a setting) |
| `themes` | list | `label`, `uiTheme` (`vs`, `vs-dark`, `hc-black` or `hc-light`), `path` |
| `iconThemes` | list | `id`, `label`, `path` |

- A fault in a point refuses the app with a finding keyed `apps[<name>]`: a value of another kind than VS Code gives it (`contributes_shape`), an id that breaks the rules above, a command a key, menu entry or activation event names that the app does not declare (`contributes_command_unknown`, `event_command`, `event_view`), a container a view names that is neither declared nor `explorer` (`contributes_container`), a file that is not a file of the app (`contributes_file`), an icon that is neither `$(name)` of a glyph in `config/catalogs/glyphs.yml` nor a file of the app (`contributes_icon`), a `when` clause that does not parse (`contributes_when`), a key that spells no key of VS Code's key syntax (`contributes_key`), an `entry` on a tree view (`contributes_tree_entry`), a bound or a list of values a setting's type does not take (`contributes_setting_kind`) and a setting default that breaks its own declaration (`contributes_default`). Any other key under `contributes`, `submenus` included, is `key_unknown`.
- Three cases leave the entry out and the app offered, each with a finding: a menu id oculus does not draw (`contributes_menu_dropped`), a menu entry that is a `submenu` (`contributes_submenu_dropped`) and a `viewsContainers` kind other than `activitybar` and `panel` (`contributes_container_dropped`).
- `icon` is `$(name)`, naming a glyph of `config/catalogs/glyphs.yml`, or a path of a file of the app. `$(name)` in a status item's text, a tree item's `iconPath` and a command's `icon` draw the glyph; a name oculus does not know is drawn as its text.

### When clauses and context keys

A `when` or `enablement` is read with the grammar of VS Code's `ContextKeyExpr`. A clause that does not parse refuses the app. A key nothing set is undefined, as in VS Code.

| Key | Holds |
|-----|-------|
| `isMac`, `isLinux`, `isWindows` | the platform of the page |
| `editorTextFocus`, `editorFocus` | whether the source editor holds the keyboard |
| `editorLangId` | the language id of the source tab on screen |
| `resourceExtname`, `resourceFilename`, `resourceLangId` | the extension, name and language of the file of the tab, the Files row or the editor the menu or key concerns |
| `resourcePath` | `<root>/<path>` of that file |
| `explorerResourceIsFolder` | whether the Files row is a folder |
| `view`, `focusedView` | the declared id of the app view a tab draws, and of the one that holds the focus |
| `viewItem` | the `contextValue` of the tree row a menu concerns |
| `activeCustomEditorId` | the `viewType` of the custom editor on screen |
| `activeWebviewPanelId` | the `viewType` of the webview panel on screen |

An app sets its own keys with `executeCommand('setContext', key, value)`, where the key starts with the app's name and a dot (else `refused:context_key`) and the value is text, a number, a boolean or `null` (else `refused:value`). The keys an app set go when its host stops, so after a restart a key is undefined until the app sets it again.

### Commands

- A declared command is listed in Cmd-K as `<category>: <title>`, or the title alone without a category, with the app's title as its hint and its key as its key hint, while the app is approved and enabled and the `when` of its `commandPalette` entry, if any, holds. An `enablement` that does not hold draws the row disabled.
- Choosing it runs the handler the host registered with `oculus.commands.registerCommand(id, handler)`, starting the host first when the app declares the command, whatever its `activation` lists. When the host registers no handler, the handler an open tab of the app registered with the frame's `oculus.register('command', id)` runs (its `onCommand(id, args)`). When neither exists, a notice names the command and the app. When the program of the app ended on its own, the notice says so and offers Restart, since such a program starts again only when the reader asks.
- `executeCommand(id, ...args)` of the host and `commands.execute(id, ...args)` of a frame run a command of any approved and enabled app, `setContext`, and those of oculus's own colon commands that change only what a page shows, as `oculus.<name>` with one text argument: `oculus.theme`, `oculus.crt`, `oculus.tab` and `oculus.goto`. A host's run is taken by the page that has the focus (the first page that gains it when none has, and it waits while no page is open); a frame's runs on the frame's own page. The other colon commands (`language`, `interpreter`, `compile-database`, `eslint-config` and `file-icons`, which write configuration; `update`, which starts agents; `workspace` and `workspace-save`, which write the workspaces file; `folder`, which opens the system's folder panel; `accent` and `help`) answer `closed`, since no approval names what they do, and any other id answers `missing`. An argument the command does not take is `refused:argument`.
- A command an app runs counts under `apps.opens_per_min`, per frame or host.

### Keybindings

- `key` is VS Code's key syntax: `ctrl+shift+p`, `cmd+k`, and a chord of two parts such as `ctrl+k ctrl+c`. `mac` takes the place of `key` on macOS, `linux` on Linux and `win` on Windows. `cmd`, `meta`, `win` and `super` name one key: Command on macOS, the Windows or Super key elsewhere. `args` is passed to the command.
- oculus's own keys come first. A binding whose key, or the first part of whose chord, is one oculus takes (a key of the key sheet, the editor's keys, Cmd+K and Ctrl+K, Cmd+P, Cmd+Shift+P, `:`, `?`, a chord prefix oculus reads, which is the `chord` letter of a group of `nav_groups` and the `direct_chord` of `config/layout.yml`, or a key of the desktop app's menu) is not bound: a finding names the binding and what takes the key, and the app is still offered. Two apps binding one key under one `when` give it to the app first in the Views catalogue's order, with a finding on the other.
- A binding is resolved after oculus's keys and before the browser, while no text field, overlay or editor holds the keyboard. A binding whose `when` asks for `editorTextFocus` is resolved in the editor too, after the editor's own keys. The key sheet (`?`) lists app bindings under the heading Apps, each with its command's title and the app's title.

### Menus

| Menu id | Where it draws |
|---------|----------------|
| `commandPalette` | Cmd-K: a `when` that does not hold hides the command |
| `editor/context` | the right-click menu of the source editor |
| `editor/title` | the action strip of a source tab or custom editor: group `navigation` as buttons with the command's icon, the rest in the More Actions menu |
| `editor/title/context` | the right-click menu of a tab |
| `explorer/context` | the right-click menu of a Files row |
| `view/title` | the title actions of an app view |
| `view/item/context` | the right-click menu of a row of an app tree view: group `inline` as buttons on the row |

- Groups are ordered as in VS Code: `navigation` first, then by name, `@<n>` ordering inside a group, a separator between groups. An app's groups come after oculus's own in each menu.
- A command is called with VS Code's arguments: the resource `{ root, path }` for `explorer/context`, `editor/context` and `editor/title`, and the row's element for `view/item/context`. `alt` names the command run with Alt held.
- Any other menu id, and a `submenu` entry, is left out with a finding.

### Status bar items

A host creates one with `oculus.window.createStatusBarItem(id, alignment, priority)`, and a frame with `oculus.register('statusItem', id, { alignment, priority })` followed by `oculus.changed('statusItem', id, fields)`. An item has `text`, `tooltip`, `command`, `name`, `backgroundColor` (the warning or error tone alone) and `accessibilityInformation`, with `show()`, `hide()` and `dispose()` on a host's item. Left items are drawn after the `latex` item and right items before `sessions`, each side by priority with the higher first, then by the app's view id. The bar's right-click menu lists each item as `<name> (<app title>)` and hides it as it hides oculus's items; the hidden list is kept where oculus keeps its own, an app item under `<view id>/<item id>`, so it stays hidden across a reload. A frame's items go when the app's last tab closes, a host's when the host stops.

### Views

- `viewsContainers.activitybar` and `viewsContainers.panel` declare containers, and `views` lists the views of a container or of `explorer`. Each view is a view of the Views catalogue in the Apps group, under its container's title as a heading, opened as a tab and found by Cmd-K. The rail gains no button.
- The first opening of a view of an `activitybar` container puts it in a float docked on the left, of a `panel` container in a float docked at the bottom, and of `explorer` in the pane that holds the Files view, else beside the active pane. Later openings show the tab where it is. `onView:<id>` fires when the view is drawn. A view whose `when` does not hold is drawn as a line saying so.
- A view of `type: webview` is a frame of the view's `entry` file (an `.html` file of the app), with the bridge, its own tab state and the handler `onVisibility(visible)`.
- A view of `type: tree` gets its rows from the host: `oculus.window.registerTreeDataProvider(viewId, provider)` or `createTreeView(viewId, { treeDataProvider, showCollapseAll, canSelectMany })`. The provider's `getChildren(element)` and `getTreeItem(element)` answer VS Code's TreeItem (`label`, `description`, `tooltip`, `iconPath` as `$(glyph)` or a file of the app, `collapsibleState`, `command`, `contextValue`, `id`, `resourceUri` as `{ root, path }`). Elements stay in the host and reach oculus as handles; a command the row runs, through a press or its menu, is called with the element, as are the elements among its `command.arguments`. `onDidChangeTreeData` redraws the rows. The TreeView answers `reveal`, `title`, `description`, `message`, `badge`, `onDidChangeSelection`, `onDidExpandElement`, `onDidCollapseElement` and `onDidChangeVisibility`. A press runs a row's `command`, and its `contextValue` is the `viewItem` key. A tree view of an app with no `host` is drawn as a line saying the app has no program to fill it, and one whose host stopped as a line saying the program stopped.
- A panel is `oculus.window.createWebviewPanel(viewType, title, { entry, preserveFocus })` from the host or `oculus.createPanel(viewType, title, { entry })` from a frame: a tab of the app drawing that file of the app, with `title`, `reveal()`, `dispose()` and `onDidDispose` on the host's panel, which the host reaches with `sendToPage` and the panel's tab id. `entry` names an `.html` file of the app's recorded files, else `missing`. A host's panel opens on the page that has the focus. It closes, `onDidDispose` firing, when its host stops or its page reloads or closes, and it is not restored with the page's layout.

### Custom editors

A file whose name matches the `filenamePattern` of a `default` editor opens in it from every opener, except a file of an apps folder, which stays source text. An `option` editor adds Open With... to a Files row's menu and Reopen Editor With... to a tab's menu, each listing Text Editor and every editor that matches. The editor's frame gets `document.read()` (the opened file's bytes), `document.save(bytes)` (writes that file and no other) and `document.dirty(flag)` (the tab's unsaved mark, so closing the tab asks), and the handlers `onSave()` for Cmd+S and `onRevert()` for Revert File.

- The file is the one the reader opened, so reading and saving are under the checks of `open({ file })`: a closed path or a private folder answers `closed`, a file outside every folder of the workspace `missing`. A machine app is not limited to its `files`, and a root app reaches its own root alone. A file above `apps.max_mb` megabytes answers `too_large`.
- A save carries the hash of the bytes last read. When the file changed on disk since, the tab asks whether to replace it, as the source editor does. The save has the source save's other checks and its copy into the local history, and answers `readonly` or `outside` as the source save does. A save while a source tab of the same file holds unsaved text is refused `refused:unsaved` and the text is kept.
- A custom editor tab whose app becomes unapproved, disabled, removed or changed shows the line an app tab shows in that state. Disable, Remove and Revoke pressed while a custom editor of the app is dirty ask first. An approval that ends because the app's files changed on disk posts a notice naming each file whose unsaved changes were lost.

### Settings

`configuration.properties` declares settings, each with a key that starts with the app's name and a dot and a `type` of `boolean`, `number`, `integer`, `string` or `array` (of strings), a `default`, a `description` or `markdownDescription`, and for a fitting type `enum` with `enumDescriptions`, `minimum`, `maximum` or `items`. Each is a row of the Settings view under the heading `apps`, in the section named by the configuration's `title`, as a toggle, a number box, a text box, a choice or a list.

- A value is written to the primary hub's `.oculus/config/behavior.yml` under `app_settings:`, a map whose keys are the settings' whole keys (`notes.width` is one key, never split at its dot), by the write kind `app-setting` (`{ key, value }`), which creates the file when the hub has none. The kind is closed to apps.
- The apps watcher judges each stored value against its declaration. A value outside its type, `enum` or bounds, and a key no approved app declares, is a finding keyed `config/behavior.yml` that names the key and the app (`setting_type`, `setting_enum`, `setting_minimum`, `setting_maximum`, `setting_undeclared`), and the app reads the default.
- A host reads `oculus.workspace.getConfiguration(section).get(key, fallback)` and `has(key)` at once, and hears `onDidChangeConfiguration` with the keys that changed. A frame reads `oculus.settings.get(key)`, a promise, and hears `onSettings(keys)`. An app reads its own keys alone (`not_declared` for another's).

### Themes and file icon themes

- `themes` name a VS Code colour theme file of the app. The server resolves the file and its `include` chain inside the app's recorded files and serves the resolved JSON at `GET /api/app-theme?choice=`; the page converts it with the same mapping as `utils/migrations/convert-vscode-themes.ts`. The theme is offered in the theme picker and `:theme` as `<label> (<app title>)`, saved as `<view id>/<label>` with the label percent-encoded, and its `tokenColors` give the code colours.
- `iconThemes` name a VS Code file icon theme file (`iconDefinitions` with `iconPath` or `fontCharacter` and `fonts`, `file`, `folder`, `folderExpanded`, `fileExtensions`, `fileNames`, `folderNames`, `languageIds`, `light`). The server serves it with the picture and font paths turned into the addresses of the app's files at `GET /api/app-icons?choice=`. It is chosen by the `file_icons` key of `config/appearance.yml` (default `seti`, otherwise `<view id>/<id>` with the id percent-encoded), the Settings row File Icon Theme and the colon command `:file-icons`, and it is drawn wherever a file icon is drawn. A file name is matched by `fileNames`, then `fileExtensions` (the longest ending first), then `languageIds`, then `file`; a folder by `folderNames`, then `folderExpanded` when open, then `folder`.
- A theme or icon theme whose app is unapproved, disabled, removed or changed, or whose folder name this workspace does not list, falls back to the default: a colour theme, which is chosen per browser, with a notice on that page naming it, and `file_icons`, a key of the configuration, with the finding `icon_theme_unavailable`. A page that loads before the `apps` payload draws the default and says nothing until the payload arrives.

## The bridge

```js
import { connect } from '/apps/-/oculus.js';

const oculus = await connect({ onChannel, onTheme, onStore, onHost });
```

`connect(handlers)` resolves with the page methods once the handshake completes; every handler is optional. Before it resolves it paints the theme on the document, and afterwards it forwards key chords and clicks on outside links to oculus. Every app calls `connect`; one that does not finish within `connect_timeout_s` shows "The app did not answer in time." with a Reload the app button.

### The handlers

| Handler | Called with | When |
|---------|-------------|------|
| `onChannel(channel, version, payload)` | the channel name, its version and payload | each time oculus receives a message of a channel in `reads`; one call in flight per channel, a newer payload replacing a queued one |
| `onTheme(theme)` | `{ name, tokens, wall }` | after the theme, wallpaper, CRT overlay or text size changes, and each time the app's view is drawn again |
| `onStore(value)` | the parsed store | when the store file changes, in every tab of the app, the writing tab included |
| `onHost(method, params)` | what the host passed to `sendToPage` | for each message the app's host sends to this tab, or to every open tab when it names none |
| `onCommand(id, args)` | the id and JSON arguments of a command | when a command this frame registered with `register('command', id)` is chosen in Cmd-K, run by a key or a menu, or run by `executeCommand`; its result is the command's result |
| `onVisibility(visible)` | a boolean | when the view the frame draws is shown or hidden |
| `onSettings(keys)` | the whole keys that changed | when a setting of the app changed |
| `onSave()` | nothing | when the reader saves the custom editor's document (Cmd+S) |
| `onRevert()` | nothing | when the reader reverts the custom editor's document (Revert File) |

`onChannel` and `onTheme` are not called for what oculus already holds at connect: use `read(channel)` and `getTheme()` for the first values.

### The nine methods

The methods for files, commands, secrets and the host are under Files, commands, secrets and the host, and those for the shell (commands, registrations, panels, messages, settings and documents) under Methods for the shell.

| Method | Resolves with | Rejects with |
|--------|---------------|--------------|
| `read(channel)` | `{ version, payload }`, or `null` when oculus holds no message of that channel yet | `not_declared`, `closed`, `missing` |
| `getTheme()` | `{ name, tokens, wall }` | none |
| `getState()` | a copy of the tab's saved value, `null` when none | none |
| `setState(value)` | nothing | `not_json`, `too_large` |
| `getStore()` | the store's value, `null` when the file is absent, does not parse or is over the limit | `missing`, `failed:<status>` |
| `setStore(value)` | nothing | `not_json`, `too_large`, `rate`, `refused:<reason>`, `failed:<status>` |
| `write(kind, body)` | nothing | `not_declared`, `rate`, `declined`, `refused:<reason>`, `failed:<status>`, `missing` |
| `open(target)` | nothing, once the tab is open | `rate`, `missing`, `closed`, `declined`, `failed:0` |
| `key(init)` | nothing | none |

- Every rejection is a plain string. A value the browser cannot clone between frames, such as a function, fails in the frame with a `PenpalError` whose `code` is `TRANSMISSION_FAILED`, which is not a refusal word.
- `setState` and `setStore` take plain JSON: text, a finite number, a boolean, `null`, or lists and maps of those. `undefined`, `NaN`, infinity, a `Date`, a `Map`, a `Set` and a cycle give `not_json`, and a class instance passes as a map of its fields. Size is the JSON text in bytes.
- `key` is sent by `oculus.js` for `keydown` events holding Control, Meta or Alt, and for Escape. It never rejects: a call over `keys_per_s` or while the frame does not hold the keyboard focus is dropped silently.
- A call whose tab closes or reloads before oculus answers never settles. oculus shows one notice per name and mount when an app asks for something it may not, or sends calls faster than the limits allow.

### Methods for the shell

These calls need no manifest entry. Each resolves with what the table says and rejects with the words under Refusal words.

| Method | Resolves with | Needs |
|--------|---------------|-------|
| `commands.execute(id, ...args)` | the command's result (`null` for none) | nothing; the commands are those of What an app adds to the shell |
| `register(kind, id, options)` | nothing | `kind` is `command` or `statusItem`; a command's `id` is handled by `onCommand`, a status item's `options` are `{ alignment, priority }` |
| `unregister(kind, id)` | nothing | the same kinds |
| `changed(kind, id, options)` | nothing | `kind` is `statusItem` (`options` hold `visible`, `text`, `tooltip`, `command`, `name`, `background`, `accessibility`) or `progress` |
| `createPanel(viewType, title, { entry, preserveFocus })` | the panel's id, once its tab is open | `entry` an `.html` file of the app |
| `ui.message(message, { tone, items, modal })` | the item pressed, or `null` when the notice is cleared | `tone` is `info`, `warning` or `error`; `modal: true` asks through Confirm |
| `ui.quickPick(items, { title, placeHolder, canPickMany, matchOnDescription, matchOnDetail })` | the list of the indexes of the chosen items, or `null` | an item is a text or `{ label, description, detail, picked }` |
| `ui.inputBox({ title, prompt, value, placeHolder, password })` | the text, or `null` | takes no validation function |
| `ui.progress({ location, title, cancellable }, task)` | what `task` returns | `location` is `notification` or `window`; `task` is called with `{ report({ message, percent }), cancelled() }` |
| `settings.get(key)` | the resolved value of one of the app's own settings | the key starts with the app's name and a dot |
| `document.read()` | a `Uint8Array` of the opened file | a custom editor tab |
| `document.save(bytes)` | nothing | a custom editor tab |
| `document.dirty(flag)` | nothing | a custom editor tab; `true` marks the tab unsaved |

- A quick pick and an input box open oculus's quick input over the page, one at a time; a second cancels the first, as in VS Code. A frame's request shows on the frame's own page alone.
- A progress ends when its `task` returns or throws. Cancel reaches the task as `cancelled()` returning `true`.
- `commands.execute` counts under `apps.opens_per_min`, `createPanel` too, each `ui` call under `apps.messages_per_min`, and `document.save` under `apps.writes_per_min`.

### Channels

An app reads a channel by listing it in `reads`. `read` resolves with a copy of the newest message, and a root app gets only its root's part of `git` and `files`.

| Channel | Who | What it carries |
|---------|-----|-----------------|
| `portfolio` | every app | projects, venues, datasets, pillars, domains, funding, people, organisations, resources, collections, the feeds summary and the career file |
| `feeds` | every app | the Lit Watch radar, the position leads and the LinkedIn posts, each with its entries |
| `hpc` | every app | the cluster queue, recent jobs, partitions and quota |
| `audit` | every app | the audit findings and the signatures parked |
| `config` | every app | the merged configuration, the text catalog, the icons, this machine's name and address |
| `git` | every app | the state of each repository |
| `files` | every app | a notice that a file under a root or the bookmarks changed, with no file content |
| `inbox` | machine only | mail threads with sender, reply address, subject, time and a preview |
| `calendar` | machine only | calendar events |
| `sessions` | machine only | Claude and Codex session records with prompts and paths, and oculus's terminals |
| `usage` | machine only | token usage and plan windows of each account |

No app can read `apps` (the address key of every approved app), `app-shell` (what the hosts registered in the shell, the context keys they set and the open requests of their `oculus/ui` calls), `processes` (the process table), `pty:<id>` (whatever a terminal printed), `app-hosts` (`{ rows }`: the process id, state and output size of every host) or `app-messages` (`{ messages: [{ app, tab, method, params }] }`: what hosts sent to their pages, which the page hands to the frames of the app named in each message alone). A channel added to oculus is closed to apps until it is named here. A root app listing a machine-only channel gets `channel_closed`.

### Channel payloads

Every payload is plain JSON. `list of X` is a list of `X`, `map of X` a map from text to `X`, a name ending in `?` may be absent, and times and durations are text as their source gives them. A `Finding` is `{ file, key, message }` (text, `line?` a number), where `key` is empty for a finding about the whole file.

**`portfolio`** is `{ version: number, entities, relations, findings: list of Finding }`. `entities` holds these maps, each keyed by the record's `id`:

| Key | Record fields |
|-----|---------------|
| `projects` | `id`, `title`, `folder` (against the hub; the repository's absolute path for a project read from a repository), `file` (an absolute path), `workspaceFolder?` (`{ root, dir }`, the workspace folder's name and the absolute folder of a project read from a workspace folder), `repository?` (the manifest's `repository:` block: `url?`, `visibility?`, `description?`, `homepage?`, `topics?`, `date?` and `clones`, the absolute folders of the repositories of the workspace whose `origin` is `url`, empty when none), `chips`, `results`, `ideas` (lists of text), `docs` (list of `{ name, label, present, human, mtime? }`), lists of ids `waitingOn`, `resourceIds`, `relatedIds`, `fundingIds`, `datasetIds`, `pillarIds`, `domainIds`, `collaborators`, `followups` (list of `{ do, after? }`), `subtasks` (list of `{ key, do, deadline?, done, snooze? }`); text `tier?` (`projects`, `coauthor`, `archive`, `personal` or `software`; absent when the manifest names none of these), `category?` (the first folder under the scan folder, for a project that lies deeper than one level), `type?` (the manifest's stage word), `short?`, `lead?`, `statusLine?`, `focus?`, `priority?`, `eli5?`, `next?`, `latest?`, `deadline?`, `snooze?`, `doi?`, `outcome?`, `venue?`, `deck?`, `venueId?` (an id); `authors?` (text or list of text), `year?` and `staleDays?` (number), `pin?` (boolean), `deckTags?` (list of text), `codeAvailability?` (`{ status?, date?, url?, doi?, repo? }`), `reproduced?` (`{ date?, note? }`), `links?` (list of text, the addresses or paths the manifest's `links:` lists), `tags?` (list of text, the words the manifest's `tags:` lists), `codeFolder?` (`true` when the project's folder holds a `code/` folder) |
| `venues` | `id`, `name`, `themes` (list of text); text `short?`, `tier?`, `category?`, `jif?`, `quartile?`, `wos?`, `scopus?`, `free?`, `format?`, `wants?`, `link?`, `deadline?`, `deadlineMonth?`, `heldMonth?`, `timing?`, `call?`, `email?`; `wosMark?` and `scopusMark?` are `yes` or `no` |
| `datasets` | `id`, `name`, `themes`, `projectIds`; text `modality?`, `description?`, `size?`, `access?`, `source?`, `hpcPath?`; `retrieval?` (a map) |
| `pillars`, `domains` | `id`, `title`, `projectIds`; text `blurb?`; a pillar also has `fundingIds` and text `color?`, `kind?`, `goal?` |
| `funding` | `id`, `title`, `followups`, `subtasks`, `tags` (list of text), `projectIds`, `pillarIds`; text `sub?`, `status?`, `date?`, `deadline?`, `note?`, `statement?`, `link?`, `url?`, `snooze?`; `funder?` (an organisation id) |
| `people` | `id`, `name`, `affiliations` (organisation ids), `links`, `projectIds`, `jointWorkIds`; text `role?`, `orcid?`, `email?`, `folder?`, `file?` (the absolute path of the people file, on a person of a hub other than the primary); `self?` (boolean) |
| `organisations` | `id`, `name`, `links`, `personIds`, `fundingIds`; text `kind?`, `country?` |
| `resources` | `id`, `name`, `kind` (`cluster`, `machine` or `storage`), `links`, `order` (number); text `host?`, `access?` |
| `collections` | `id`, `title`, `file`, `entries` (list of Entry), `intro?`, `schema?` (list of `{ field, type, label?, options?, from?, required?, help?, when?, open?, map?, fields? }`) |
| `feeds` | `leads` (list of `{ title, deadline, status, fit, root? }`, the middle three text or null, or null), `radar` and `scout` (`{ lastRun }` or null), `linkedin` (`{ lastPost }` or null) |
| `career` | the career file of the hub, or null: `title`, `milestone?`, `situation` (list of `{ label, value }`), `order` (list of `{ task, when?, note? }`), `orderNote?`, `hosts` (list of `{ name, inst?, tag?, status, scores, note? }`), `hostCriteria` (list of text), `notHosts` (list of `{ who, why? }`), `eligibility` (`{ rule, shots, caveat? }` or null), `dropped` (list of `{ what, why? }`) |

An Entry is `{ id, title, fields: map, file, index: number, root? }`: `fields` holds every key the entry has in the file, and `id` is the entry's `key` when it has one and its `title` otherwise, with the hub's key in front for an entry of a hub other than the primary. `relations` holds lists of `[id, id]` pairs named `projectVenue`, `projectFunding`, `projectDataset`, `projectPillar`, `projectDomain`, `projectRelated`, `fundingPillar`, `projectPerson`, `jointWorkPerson`, `personOrganisation` and `fundingOrganisation`.

A folder of the workspace that holds `.oculus/config/` is a hub, merged into the same portfolio. Every record of `entities`, every Entry, every lead and every `audit` finding carries `root`: absent for the primary hub, and the hub's name for another hub (with no primary every hub's name). A record of another hub has the id `<hub name>:<id>`, every id inside it (a list of ids, a `venueId`, a relation pair, an Entry field whose `from:` names a registry or the projects) has the same name in front, and an `audit` finding of that hub has it in front of its `scope`. An `audit` finding about a project read from a repository has the repository's folder name for its `scope`; when it names a file of the repository, its `file` is relative to the repository and its `root` is the folder's name, the one case where an `audit` finding's `root` names no hub. An app reads the records of every hub and writes those of the primary hub alone: a write that names a record of another hub answers not found.

| Channel | Payload |
|---------|---------|
| `feeds` | a map `radar`, `leads`, `linkedin`; each is `{ ok: true, kind, file, meta: map, entries: list of map, cadenceDays?, schema?, missing?, error?, hubFiles? }`, where `cadenceDays` (number) is on `linkedin`, `missing` (boolean) says the feed's file is not on this machine, and `hubFiles` maps the name of each other hub to its file of the feed, relative to that hub; an entry of another hub carries `root` and keeps its own title |
| `hpc` | `status` (`starting`, `ok`, `unreachable` or `error`), `hint?`, `jobs` (list of `{ id, name, partition, state, time, limit, nodes, cpus, gpus, mem, priority, start, reason }`), `running`, `pending`, `total`, `recent` (list of `{ id, name, state, exit, elapsed, end, memUsed, memReq, memPct, cpuPct }`, the last two number or null), `sinfo` (list of `{ partition, avail, nodes, state, gres }`), `quota` (list of `{ name, used, limit, pct }`), `updated`, `lastOk?`, `host`, `pollMin`, `retryMin?` |
| `audit` | `{ findings: list of { scope, where, root?, file, kind, message, signature }, muted: list of text }`; `root` is the workspace folder `file` is relative to: absent for the primary hub, another hub's name, or a repository folder's name for a file of a project read from it, and absent for a repository project's finding that names no file; `kind` is `todo`, `data`, `conform`, `manifest`, `readability` or `publink`, and `signature` is twelve hex characters |
| `config` | `{ config: map, text: map of text, icons: map of text, host: { name, address }, findings: list of Finding }` |
| `git` | a map from a repository's folder to its state: `branch`, `ahead`, `behind`, `upstream?` (boolean or null), `detached`, `ignoresWorktrees`, `present`, `repository` (booleans), `staged`, `unstaged`, `untracked`, `conflicted` (lists of `{ path, status, added, deleted, from? }`, the counts number or null), `held` (`{ staged, changes, untracked, merge }`), `sequence` (`merging`, `rebasing`, `cherry-picking` or empty), `mergeMessage`, `remotes`, `stashes` (`{ ref, hash, message, when }`), `tags` (`{ name, commit, annotated, subject }`), `log` (`{ hash, short, subject, when }`), `branches` (`{ name, upstream, current }`), `worktrees` (`{ path, branch, head, main }`), `error` (text or null) |
| `files` | `{ root, folders?, bookmarks?, workspaces? }`: `root` is the folder of the workspace folder that changed and `folders` the folders of it the writes landed in, relative to the root and `''` for its top; a notice without `folders` concerns the whole folder and one with an empty list concerns nothing. The `bookmarks` and `workspaces` notices name no root and reach machine apps only; a root app receives only notices whose `root` is its own folder |
| `inbox` | `status` (`ok`, `error` or `unconfigured`), `accounts` (list of `{ provider, label, status, hint?, needsSetup?, ownHalf?, lastOk? }`), `threads` (list of `{ id, account, provider, sender, replyTo, subject, received, snippet, messages, url?, triage }`, where `triage` is `{ kind?, what?, draft?, triaged }`), `updated`, `pollMin`, `retryMin`, `notesRun` (text or null), `notesError?`. `snippet` is part of each message's text |
| `calendar` | `status`, `accounts` (as in `inbox`, `provider` also `ics`, plus `calendars`: list of `{ id, name }`), `events` (list of `{ id, account, calendar, title, start, end, allDay, location?, link?, status? }`, with `status` `confirmed`, `tentative` or `cancelled` and no attendee list), `updated`, `pollMin`, `retryMin`, `daysBack`, `daysAhead` |
| `sessions` | `{ records, workspaces, terminals? }`. A record holds `id`, `path`, `slug`, `tool` (`claude` or `codex`), `title`, `lastPrompt`, `state`, `cwd`, `branch`, `model`, `effort`, `permissionMode`, `version`, `entrypoint`, `started`, `lastActivity`, `liveStatus`, `registryName`, `live`, `hidden`, `truncated`, `pid`, `contextWindow`, `prompts`, `messages`, `contextTokens`, `lastCacheRead`, `tokens`, `cache`, `tools`, `files`, `agents`, `timeline` and `hook`. A workspace is `{ key, name, lastActivity, areas }`, and an area is `{ key, short, full, known, lastActivity, sessions }`. A terminal holds `id`, `name`, `title`, `icon`, `color`, `kind` (`claude`, `codex` or `shell`), `cwd`, `command`, `pid`, `created`, `attached`, `resumes`, `task`, `exit`, `job` and `foreign?`. `lastPrompt` and the `timeline` text carry the words of the session |
| `usage` | `{ accounts, days, builtAt }`. An account holds `tool` (`claude` or `codex`), `label`, `dir`, `email`, `organisation`, `tier`, `tierLabel`, `billing`, `fetchedAt?`, `windows` (list of `{ name, observedAt, usedPercent, resetsAt, windowMinutes, model?, severity?, active? }`), `live` (list of `{ sessionId, model, updatedAt, cwd, contextPercent, costUsd }`) and `refresher?` (`{ state, since, reason, lastRefresh, renewed }`). A day is `{ tool, account, day, model, input, output, cacheRead, cacheCreation }` |

### Writes

`write(kind, body)` asks oculus to change the hub's data. The kind must be in the app's `writes`, the body is a map whose own `kind` field equals it, and the write route refuses with `refused:kind` when the body matches another kind, the kind is closed to apps, the body is not a map, or the collection is `bookmarks`.

| Kind | Body | Asks first |
|------|------|------------|
| `manifest` | `{ kind, id, fields }` for the project `id`, of any tier, in a folder of the hub (the id of a project read from a repository answers not found to an app) | no |
| `entry` | `{ kind, collection, id, fields }` | no |
| `subtask` | `{ kind, target: { id, collection? }, key, action, value? }`, `action` one of `done`, `reopen`, `snooze`, `delete` | no |
| `subtask-add` | `{ kind, target: { id, collection? }, fields }`, `fields.do` the text | no |
| `host` | `{ kind, name, status }` for a career host | no |
| `new-entry` | `{ kind, collection, fields }`; `fields` holds the collection's identity field | no |
| `reorder` | `{ kind, collection, order }`, the entry ids in the new order | no |
| `delete-entry` | `{ kind, collection, id }` | yes |
| `feed-field` | `{ kind, feed, id, field, value, root? }`, `feed` one of `radar`, `leads`, `linkedin` | no |
| `feed-delete` | `{ kind, feed, id, root? }` | yes |
| `lead-add` | `{ kind, fields }`, `fields.title` required | no |
| `radar-add` | `{ kind, fields }`, `fields.title` required | no |
| `linkedin-idea` | `{ kind, title, category? }` | yes, no undo |
| `linkedin-post` | `{ kind, file, root? }`, `file` an `xx-*.md` idea | yes, no undo |
| `new-idea` | `{ kind, fields }`, `fields.id` the project's id, `fields.tier` and `fields.folder` optional | yes, no undo |

- `root` on `feed-field`, `feed-delete` and `linkedin-post` names the hub whose feed holds the item, absent for the primary hub; an app writes the primary hub's feeds alone, so another `root` answers not found.
- A `new-idea` write with no `fields.tier` and no `fields.folder` creates the project in the tier `projects`, in the folder the hub's `new_project_dir` names for `projects`; when the hub names none, the write is refused with a sentence saying so and nothing is written.
- The five kinds that ask first show "The app <title> asks to <words>: <body>" with the body as JSON cut at 300 characters. The words are `delete an entry of a collection`, `delete a feed item`, `create an idea project`, `move a LinkedIn idea` and `move a LinkedIn post`. The keyboard is on Cancel, which rejects `declined`.
- Every write is recorded in the change log with the app's id, and the History view undoes it. The three kinds marked no undo are not undoable.
- Closed to apps, and refused with `write_closed` in a manifest: `undo`, `rail`, `app-setting`, `audit-mute`, `config-key`, `config-value`, `session`, `deck-slides`, `deck-edit`, `roots`, `app-store`, `calendar`, `connect`, `mail`, `memories`, `fs`, `open`, `source`, `deposit`, `git`, `hpc`, `usage/refresh`, `hook` and `terminal`. Any route that runs processes, writes arbitrary files, reaches a remote or acts on an account is among them.

### State and store

- State (`getState`, `setState`) is kept in the saved layout per tab, is not shared between tabs, is limited by `apps.state_max_kb`, and is not a write.
- The store (`getStore`, `setStore`) is one file per app shared by every tab and window, limited by `apps.store_max_kb`. `onStore` announces a change in every tab, a store write counts against `apps.writes_per_min`, and History lists it as `app store`, undoable.
- A store write equal to the file's value writes nothing. The file is written by rename and read back, and a mismatch puts the old file back and answers `refused:readback`. Nothing else persists, since an opaque origin has no `localStorage` or IndexedDB.

### Open

`open(target)` needs no manifest entry. The target is a map with exactly one of these keys; any other target rejects `closed`.

| Target | Opens | Rejects |
|--------|-------|---------|
| `{ view: '<id>' }` | a view of the Views catalogue with no state (`terminal` opens a Terminal tab) | `closed` for a view opened only for something (`project`, `editor`, `document`, `file`, `source` and the like), `missing` for an unknown id |
| `{ project: '<key>' }` | the project's tab | `missing` when the portfolio has no such project |
| `{ file: { root, path } }` | the file as the Files view opens it: a PDF in the file view, a file a `default` custom editor matches in that editor, other files as source text, a file of an apps folder always as source text | `closed`, `missing`, `failed:0` |
| `{ url: '<address>' }` | the address in a new browser tab, after you confirm | `closed` for a scheme other than `http:` or `https:`, an address over 2048 characters or one with a user name or password; `declined` on Cancel |

A `{ file }` target is checked in this order: exactly `root` and `path`, both text; no empty, `.`, `..` or dot-led segment, backslash or NUL in the path; no leading folder of `closed_paths` (by segment, ignoring letter case); a root app naming only its own folder (else `closed`); a name that is a folder of the open workspace (else `missing`); then on the server a real path inside the folder, outside oculus's own `config/` folder and every hub's `.oculus/local.yml`, passing the same rules (else `closed`), that is a file (else `missing`). With no answer from the server the call rejects `failed:0`.

`open` counts toward `apps.opens_per_min` before it is judged. The question for `{ url }` shows the whole address: "The app <title> asks to open this address in a new browser tab. The address can carry what the app has read." oculus makes the same call when you press a link that leaves the app, and a `mailto:` or `ftp:` link is refused `closed`.

### Theme and keys

`getTheme()` and `onTheme` carry `{ name, tokens, wall }`: the theme's class on the body, every custom property of oculus's `tokens.css`, and whether the wallpaper is on. `connect` writes the tokens on the document's root element, toggles a `wall` class there and puts `color-scheme: light dark` ahead of the app's style sheet, so CSS can use `var(--bg)` and `var(--ink)`; with the wallpaper on the frame paints nothing. `connect` forwards `keydown` as `key({ key, code, altKey, ctrlKey, metaKey, shiftKey })`.

### Files, commands, secrets and the host

The client nests these calls as `oculus.fs`, `oculus.commands`, `oculus.secrets` and `oculus.host`.

| Method | Needs | Resolves with | Rejects with |
|--------|-------|---------------|--------------|
| `fs.readFile({ root, path })` | `files` (machine app) or its own root (root app) | a `Uint8Array` of the file | `not_declared`, `closed`, `missing`, `failed:<status>` |
| `fs.readDirectory({ root, path })` | as above | a list of `[name, type]` pairs | as above |
| `fs.stat({ root, path })` | as above | `{ type, ctime, mtime, size }`, times in milliseconds | as above |
| `commands.run(name)` | nothing | nothing, once a terminal running the command is open | `missing`, `declined`, `rate` |
| `secrets.get(key)` | `secrets: true` | the stored text, or `undefined` | `not_declared`, `refused:<reason>` |
| `secrets.store(key, value)` | `secrets: true` | nothing | `not_declared`, `too_large`, `rate`, `refused:<reason>` |
| `secrets.delete(key)` | `secrets: true` | nothing | `not_declared`, `rate`, `refused:<reason>` |
| `host.request(method, params)` | `host` | what the host's handler answers | `not_declared`, `host_down`, `refused:<message>` |

- `type` is the editor's `FileType`: 1 for a file, 2 for a folder, with 64 added for a link. `readDirectory` lists no dot-led name and no name `closed_paths` closes, and at most `apps.scan_entries` names in the order the disk gives them.
- For a machine app the folder must lie in a `files` entry, else `not_declared`. The checks of `open({ file })` follow in their order: the segment rule, `closed_paths`, a folder name the open workspace lists, then on the server a real path inside the folder and outside oculus's `config/` folder. A dot-led segment in the path is `closed`, a file that is not there is `missing`, and a FIFO, socket or device file is `closed` without being opened.
- The bytes go from the server to the frame over the app's own address, a route on a dot-led first segment that no app file can have, answered only under the app's current key while the app is approved and enabled. The page never holds the bytes and no size limit applies. The answer is `application/octet-stream` with `nosniff` and `Content-Disposition: attachment`, so a file of a root is never drawn as a page.
- `commands.run(name)` runs the command of that name from the `commands.yml` in `.oculus/` of the app's root (the hub's for a machine app) in a terminal you see, through the same approval a command gets there. A command that is not yet approved asks you first. A command saved through the form is not reachable. It counts under `apps.opens_per_min`.
- A secret key is 1 to 64 of `A-Z a-z 0-9 . _ -`, else `refused:key`; a value is at most 2048 bytes of UTF-8, else `too_large`. A store or delete counts under `apps.writes_per_min`. A machine without a secret store refuses with a line that says so, as `refused:<line>`.
- `host.request` starts the host when it is not running. The handler in the host is called with `(method, params, tab)`, where `tab` is the id of the asking tab; its answer is the result and a throw rejects `refused:<the error's message>`.

## The host

An app whose manifest names `host` gets one host process while it is approved, enabled and unchanged. The host is a program that runs on this machine with your rights, in the background, with no window. It can read and write your files, start processes, reach any address and watch folders with Node's own modules, and the approval panel says so before you approve the app. The page and the host talk through oculus: the page calls `oculus.host.request`, the host answers, and the host calls `sendToPage` to reach the page.

```js
// host.mjs, named by `host: host.mjs` in app.yml
export async function activate(oculus) {
    oculus.onRequest(async (method, params, tab) => {
        if (method === 'ping') return { n: params.n + 1 };
        throw new Error(`no method ${method}`);
    });
    await oculus.store.update('started', Date.now());
    return { double: (n) => n * 2 };
}

export function deactivate() {}
```

- **The file.** `host` names a `.js` or `.mjs` file of the app. oculus loads it as an ES module and calls its exported `activate(oculus)` once with the connection object, then `deactivate()` before it stops the host when the file exports one. A file that exports no `activate`, or whose `activate` throws, ends the host with the error in its output. What `activate` returns is the host's API for the apps that depend on it.
- **The process.** The program is the one that runs oculus, with `ELECTRON_RUN_AS_NODE=1` added to oculus's own environment, started with an argument array and never through a shell, in the app's real folder. The host needs no package of its own to talk to oculus.
- **Only approved files run.** The host starts only while the app's current hash is the approved one, and the hash is taken again right before each start. A module hook refuses every file import, dynamic `import()` and `createRequire` load whose real path is not a recorded file of the app, and the error names the file. Built-in `node:` modules load. A package the host needs is shipped inside the app's folder, where it is recorded, counted under `max_files` and `max_mb`, and approved.
- **Output.** What the host writes to standard output is sent to standard error, so it never breaks the messages. A write to file descriptor 1 that skips this breaks the message stream, and oculus stops the host and names the broken stream in its output. Standard error is the host's output: the last 1000 lines and at most `apps.host_output_kb` kilobytes are kept and shown in the Processes view, which asks oculus for the lines when you open an output and again whenever the output has grown. No app reads them.
- **Start.** At the first of its `activation` events. `onTab`: a tab of the app is drawn. `onStartupFinished`: oculus has read its apps after it started, or the app becomes approved and enabled. `workspaceContains:<glob>`: a file matching the glob exists in a root the Files view shows (the app's own root for a root app, every shown root for a machine app). The look reads at most `apps.scan_entries` entries per root and enters no dot-led folder and no `node_modules`. `onLanguage:<id>`: a source tab of a file of that language opens. `onCommand:<id>` fires when a command the app declares is run, and `onView:<id>` when a view the app declares is drawn; the host also starts for a declared command whatever `activation` lists. A request from a tab always starts the host. Two events at once start one process.
- **The connection object.** `oculus.onRequest(handler)` sets the handler of `oculus.host.request`, called with `(method, params, tab)`. `oculus.store` is the app's store file as a map: `get(key)`, `update(key, value)` (`undefined` deletes the key), `keys()` and `onDidChange(handler)`, called with the changed keys when a frame or another writer changes the store. An `update` is a store write: it counts under `apps.store_max_kb` and `apps.writes_per_min`, is recorded in the change log and undone from History, and reaches every tab's `onStore`. `oculus.secrets` has `get`, `store` and `delete` as the frame's do. `oculus.sendToPage(method, params, tab)` calls `onHost` of that tab, or of every open tab of the app when `tab` is left out, and counts under `apps.messages_per_min`. `oculus.apps.get(name)` answers an object whose functions call the API that app's `activate` returned, with JSON arguments and result; it rejects `not_declared` for a name not in `depends` and `host_down` for a dependency that is not running and cannot start. `oculus.commands`, `oculus.window` and `oculus.workspace` follow VS Code's API by name and are described under The shell namespaces.
- **Dependencies.** Before a host starts, the host of each app in its `depends` starts. A dependency that is refused, disabled or not approved leaves the depending host waiting, and the tab and the Processes row name it as an app that cannot run; a dependency that no app provides is named as not installed. Apps that depend on each other in a cycle start none of the apps in it, and the Processes view says so.
- **Stop.** When the app is disabled, revoked, changed or removed, when Stop is pressed in the Processes view, and when oculus closes, oculus calls `deactivate()`, gives the host `apps.host_stop_seconds` to settle, sends SIGTERM and 2 seconds later SIGKILL. A host also ends when its standard input closes, so a server that is killed leaves none running. A request in flight when the host stops rejects `host_down`.
- **A host that ends on its own** is not started again. Each open tab of the app shows a line with the exit code or signal and a Restart button, and the Processes view shows the same row with Restart.

### The shell namespaces

| Member | What it does |
|--------|--------------|
| `commands.registerCommand(id, handler)` | registers the handler of a command, run with the command's arguments; answers a disposable whose `dispose()` unregisters it; a second registration of one id throws `refused:registered` |
| `commands.executeCommand(id, ...args)` | runs a command of any approved and enabled app, `setContext` or an `oculus.<name>` command, as `commands.execute` does for a frame |
| `window.showInformationMessage`, `showWarningMessage`, `showErrorMessage(message, options?, ...items)` | posts a notification of that tone with the items as its actions; resolves with the item pressed, or `undefined` when it is cleared; `{ modal: true }` as the options asks through Confirm |
| `window.showQuickPick(items, options?)` | resolves with the chosen item, or the list of them with `canPickMany`, or `undefined`; an item is a text or `{ label, description, detail, picked }` |
| `window.showInputBox(options?)` | resolves with the text or `undefined`; `validateInput(value)` is asked 150 ms after each change and its text is shown as the message |
| `window.withProgress({ location, title, cancellable }, task)` | `location` is `ProgressLocation.Notification` (a notification with a progress bar, its message and Cancel) or `ProgressLocation.Window` (a spinner and title in the status bar's left group); `task(progress, token)` reports `{ message, increment }` and reads `token.isCancellationRequested` |
| `window.createStatusBarItem(id, alignment, priority)` | a status bar item with the fields of Status bar items; `alignment` is `StatusBarAlignment.Left` or `Right` |
| `window.registerTreeDataProvider(viewId, provider)`, `createTreeView(viewId, options)` | fills a tree view; see Views |
| `window.createWebviewPanel(viewType, title, { entry, preserveFocus })` | opens a panel; see Views |
| `workspace.getConfiguration(section?)` | `get(key, fallback)` and `has(key)` over the app's own settings, answered at once |
| `workspace.onDidChangeConfiguration(listener)` | called with `{ keys, affectsConfiguration(section) }` |

The `window.create*` calls and the registrations they make reject with the refusal words of the call that caused them: `refused:registered` for an id registered twice, `refused:id` for a command id that does not start with the app's name and a dot, `refused:view` for a tree view the app does not declare, `missing` for a panel whose `entry` is no recorded `.html` file of the app and `refused:params` for a body of another shape. A message, quick pick, input box or progress counts under `apps.messages_per_min` and a command run under `apps.opens_per_min`, per host.

## Refusal words

| Word | Raised by | Cause |
|------|-----------|-------|
| `not_declared` | `read`, `write`, `fs.*`, `secrets.*`, `host.request`, `apps.get`, `settings.get`, `document.*` | the channel is not in `reads`, the kind is not in `writes` or is closed to apps, the folder is in no `files` entry, the app lacks `secrets: true` or `host`, the app is not in `depends`, the key is not one of the app's own settings, or the tab is no custom editor |
| `closed` | `read`, `open`, `fs.*`, `commands.execute`, `document.*` | a listed channel closed to the app's kind; an `open` target or a file that is not allowed, including a file in a private folder; an `oculus.<name>` command that writes configuration or starts something |
| `too_large` | `setState`, `setStore`, `secrets.store`, `document.read`, `document.save` | the JSON is over `apps.state_max_kb` or `apps.store_max_kb`, a secret is over 2048 bytes, or a document is over `apps.max_mb` |
| `readonly`, `outside` | `document.save` | the file is read-only or is a hub's `.oculus/local.yml`, or its real path lies outside the folder |
| `not_json` | `setState`, `setStore` | the value is not plain JSON |
| `rate` | `write`, `setStore`, `open`, `commands.run`, `commands.execute`, `createPanel`, `ui.*`, `document.save`, `secrets.store`, `secrets.delete`, and the host's `update`, `sendToPage`, `executeCommand` and `window.*` | more than `apps.writes_per_min`, `apps.opens_per_min` or `apps.messages_per_min` calls in a sliding minute from one frame or host |
| `declined` | `write`, `open`, `commands.run`, `document.save` | you pressed Cancel on the question |
| `missing` | `read`, `getStore`, `write`, `open`, `fs.*`, `commands.run`, `commands.execute`, `createPanel`, `document.*` | oculus holds no row for the app, a view id nothing registers, a project not in the portfolio, a root or file that is not there, a command no approved and enabled app owns, or a panel `entry` that is no recorded `.html` file of the app |
| `refused:<reason>` | `write`, `setStore`, `secrets.*`, `host.request`, `commands.execute`, `register`, `unregister`, `changed`, `createPanel`, `ui.*`, `document.*` | the write route refused with a 4xx status and a sentence, or answered 200 and refused the first field it could not write; `<reason>` is that sentence; for a secret it is `key` or the line that says the keyring is not available, and for a host request it is the message of the error the handler threw |
| `host_down` | `host.request`, `apps.get`, `commands.execute` of a command a host owns, a call to a dependency | the host is not running and cannot start, or stopped while the request was in flight |
| `failed:<status>` | `write`, `setStore`, `getStore`, `open`, `fs.*` | the route answered 500 or more, or a 4xx with no error text; `0` is no answer |

### Reasons

The reasons are sentences the route or a writer gives, so the set is open. These come from the routes' own checks.

| Reason | Cause |
|--------|-------|
| `kind` | the body's kind is not the kind named, the kind is closed to apps, the collection is `bookmarks`, or the body is not a map |
| `no project with the id <id>` | `manifest`, `subtask` or `subtask-add` names a project that is not in the hub |
| `no entry <id> in <collection>` | an entry, subtask, `feed-field` or `feed-delete` target is not there (a feed takes the place of `<collection>`) |
| `no collection <name>` | `new-entry` or `reorder` names a collection the hub does not have |
| `unknown feed <name>` | `feed-field` or `feed-delete` names a feed other than `radar`, `leads` or `linkedin` |
| `no host named <name>` | `host` names a career host that is not in the career file |
| `a new entry needs a <identity field>` | `new-entry` has no value for the field that names an entry |
| `an entry with that <identity field> is already in the file` | `new-entry` repeats an identity |
| `id`, `kind`, `params` | `register`, `unregister`, `changed`, `ui.*`, `createPanel`: a command id that does not start with the app's name and a dot or is empty, a kind other than the ones named, or a value of another shape than the call takes |
| `registered`, `view` | the host's `oculus/register`: the id is held already, or names a tree view the app does not declare |
| `context_key`, `value` | `setContext`: the key does not start with the app's name and a dot, or the value is not text, a number, a boolean or `null` |
| `argument` | an `oculus.<name>` command run with an argument it does not take |
| `answer` | a page's answer to a command or a tree request was no answer |
| `unsaved` | `document.save` while a source tab of the same file holds unsaved text |
| `unwritable`, `outside`, `too_large`, `readback` | `setStore`: the store folder cannot be written, is not inside the app data folder or the app's root, the value is over `apps.store_max_kb` as the server measures it, or the file read back differs |

Other reasons are the writer's own sentences, such as `the entry is not in the file` and `the edit did not verify; nothing was written`. The sentence names what to change.

## Limits

Thirteen keys of the `apps:` block of `config/behavior.yml` set the limits, each a setting under Apps on the Settings view. A number is a whole number of at least 1, and a missing or wrong value takes its default. A kilobyte is 1024 bytes, and a reload of the frame starts the per-frame counts again.

| Key | Default | What it limits | Past the limit |
|-----|---------|----------------|----------------|
| `connect_timeout_s` | 10 | seconds a frame is given to complete the handshake | "The app did not answer in time." |
| `state_max_kb` | 64 | kilobytes of one tab's state | `too_large` |
| `store_max_kb` | 256 | kilobytes of the store | `too_large`; `getStore` answers `null` for a larger file |
| `writes_per_min` | 30 | writes, `setStore`, `secrets.store`, `secrets.delete` and `document.save` included, per frame, and store updates per host | `rate` |
| `opens_per_min` | 30 | calls of `open`, `commands.run`, `commands.execute` and `createPanel` per frame, and of `executeCommand` per host | `rate` |
| `messages_per_min` | 600 | calls of `sendToPage` and of the `ui` and `window.show*` calls per host, and `ui.*` calls per frame | `rate` for the call; a message is dropped |
| `keys_per_s` | 20 | key events per second taken from a frame | the extra events are dropped |
| `max_files` | 500 | files in an app folder | the finding `too_large` |
| `max_mb` | 20 | megabytes in an app folder, and in a file a custom editor reads or saves | the finding `too_large`; `too_large` for the document |
| `host_output_kb` | 256 | kilobytes of a host's output kept | the oldest lines are dropped |
| `host_stop_seconds` | 5 | seconds a host is given to settle `deactivate` | SIGTERM, then SIGKILL 2 seconds later |
| `scan_entries` | 10000 | entries read per root by a `workspaceContains` look, and names listed by `fs.readDirectory` | the look ends; the listing is cut |
| `closed_paths` | `[secrets]` | folders, relative to a root and applied to every root, that `open({ file })` and a custom editor's document never reach | `closed` |

`closed_paths` takes folder paths with no empty, dot or dot-led segment; an invalid entry is left out and a duplicate counts once. A value that is missing or not a list closes every file for every app and raises `closed_paths_shape`.

## What an app cannot do

- Run a process or server code from its page, or read from its page a file outside its folder in any other way than these two. A page reads a file of a workspace folder through `fs`, within the folders its `files` names; the one other read is a custom editor's page reading, through `document.read`, the bytes of the file you opened in it, whatever `files` names. Server code and processes belong to the app's host, which you approve with the app. `open({ file })` shows the file in oculus and gives the app no content.
- Read another app's files or store, any `/api/` route, the write token or oculus's own page. The frame's origin is opaque and the address key is held by nobody else.
- Use cookies, `localStorage`, `sessionStorage` or IndexedDB; open a popup, submit a form, show a modal dialog, lock the pointer or navigate the frame.
- Run an inline script. The Content-Security-Policy allows scripts from the app's own files and the shared bridge files only, so scripts are files loaded with `<script type="module" src>`. A script can compile a `.wasm` file of its own folder, since `script-src` holds `'wasm-unsafe-eval'`.
- Load anything from outside the app's folder except `data:` images and the bridge files. The `connects` origins are allowed for `fetch` and other connections only, so an `<img>` or a `<script>` cannot load from them. Styles may be inline.
- Run a file type oculus does not type. Only `.html`, `.js`, `.mjs`, `.css`, `.json`, `.svg`, `.png`, `.jpg`, `.gif`, `.webp`, `.woff`, `.woff2`, `.ttf`, `.otf`, `.txt` and `.wasm` get a content type; any other file, a `.ts` included, is sent as `application/octet-stream` with `nosniff`.
- Run an `oculus.<name>` command that writes configuration, starts agents, writes the workspaces file or opens the system's folder panel (`closed`), bind a key oculus takes, or add an id outside its own name and a dot.
- Read or write a private folder: `~/.oculus`, a hub's `secrets` folder, and each state file or folder that `local.yml` places outside them (the paths of `sessions_cache`, `sessions_overrides`, `bookmarks`, `notes`, `changes`, `history`, `approvals`, `schedules`, `schedule_record`, `accounts`, `calendar_dir`, `apps_dir` and `mail_dir`). A `files` entry in one refuses the app, and `fs.*`, `open({ file })` and a custom editor's document answer `closed` for a real path in one, links resolved.
- Read `apps`, `app-shell`, `processes` or `pty:*`, a root app's `inbox`, `calendar`, `sessions` or `usage`, or write a closed kind. Open or read a hub's `.oculus/local.yml`, a file under oculus's own `config/` folder (by its real path, whatever name a workspace lists it under), a dot-led path or a path under `closed_paths`. Edit your bookmarks. Use a secret, a host or a file folder its manifest does not declare, or reach the secrets of another app.

Your approval of the app's files and of its `connects` origins is the boundary against an app sending what it read to another machine. The policy does not stop a frame from reaching a STUN server through WebRTC, resolving a host name through a DNS prefetch link or making a preconnect. An address passed to `open({ url })` can also carry what the app read, which is why the question shows the whole address.

## A worked example

The app `nudge` reads the `portfolio` channel, counts its presses in the tab's state and asks for one write, a subtask on the project pressed. Put the three files in `<hub>/.oculus/apps/nudge/`, write `app.yml` last and approve the app.

`app.yml`:

```yaml
name: nudge
title: Nudge
description: Adds a subtask to the project you press.
bridge: 1
reads: [portfolio]
writes: [subtask-add]
```

`index.html`:

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Nudge</title>
    <script type="module" src="app.js"></script>
</head>
<body style="background: var(--bg); color: var(--ink)">
    <p id="msg">Connecting.</p>
    <ul id="list"></ul>
</body>
</html>
```

`app.js`:

```js
import { connect } from '/apps/-/oculus.js';
const msg = document.getElementById('msg');
const list = document.getElementById('list');
function draw(payload) {
    list.replaceChildren(...Object.values(payload.entities.projects).map((project) => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.textContent = project.title;
        button.onclick = () => nudge(project.id);
        item.append(button);
        return item;
    }));
}

const oculus = await connect({ onChannel: (channel, version, payload) => draw(payload) });

async function nudge(id) {
    const count = ((await oculus.getState()) ?? 0) + 1;
    await oculus.setState(count);
    try {
        const fields = { do: `Nudge ${count}` };
        await oculus.write('subtask-add', { kind: 'subtask-add', target: { id }, fields });
        msg.textContent = `Added nudge ${count} to ${id}.`;
    } catch (word) {
        msg.textContent = `Refused: ${word}`;
    }
}

const first = await oculus.read('portfolio');
if (first !== null) draw(first.payload);
msg.textContent = 'Press a project to add a subtask.';
```

The write changes the project's manifest file, and the History view undoes it. Removing `subtask-add` from `writes` makes the page show `Refused: not_declared`.

## When something goes wrong

| What you see | Cause | What to do |
|--------------|-------|------------|
| The app is not in the Views catalogue | the folder is not an app: no `app.yml`, a dot-led name, a file instead of a folder, a name outside the pattern, or a folder outside the apps folder | look for `apps[<name>]` in the Findings view; a folder with no `app.yml` gives no finding |
| The Findings view shows `apps[<name>]` | the manifest or the folder broke a rule of the manifest section | fix the file named in the finding; it clears when the folder is read again |
| The approval panel appears again | a file of the app changed, or a root app arrived by `git pull` | read the panel and approve again; use Keep approved while I edit for an app you are editing |
| "The app did not answer in time." | the script never completed `connect` within `connect_timeout_s`: it is not loaded, threw first or is inline | call `connect` first, in a script file loaded with `<script type="module" src>` |
| A script or style does not load, or the page never updates | an inline `<script>` does not run; a `.ts` file is not typed; the file is dot-led or a link | put the code in `.js` and `.css` files with plain names |
| A fetch to an outside address fails | the origin is not in `connects` | add it to `connects`; the panel asks again |
| `not_declared` or `refused:kind` | the manifest lacks the channel or kind, or the body does not match the kind | add it to `reads` or `writes`, or fix the body |
| A call never answers | the tab closed or reloaded, or a question waits for you | answer the question in the app's tab |
| A link in the app only asks a question | a link that leaves the app goes through `open({ url })` | confirm, or link to a page of the app |
| The tab shows "This app is disabled, so it reads, writes and runs nothing." | the app is disabled, machine-wide or in this workspace | press Enable, or Enable (Workspace) when you disabled it for the workspace |
| The tab says the program of the app ended with an exit code or a signal | the host ended on its own and is not started again | read its output in the Processes view, then press Restart |
| The tab says the program waits for you to approve its changed files | a file of a kept app or a root app changed and the hash is not approved | press Approve, read the panel and approve |
| The tab says the program waits for an app that cannot run | an app in `depends` is refused, disabled, not approved or itself waiting | enable or approve that app, or take it out of `depends` |
| The tab says the program waits for an app that is not installed | no app of the name in `depends` exists | install that app, or take the name out of `depends` |
| The host ends at once with a refused file in its output | it imported a file that is not a recorded file of the app | put the file or package inside the app's folder |
| A root app is missing after a workspace change | its root is not in the workspace's Files view | add the root again; the tab keeps its state |
