# Building an oculus app

An app is a folder of web files that oculus draws in a tab. This guide starts with a working app, then gives the reference. The rest of the manual is [HELP.md](HELP.md).

## Contents

[TOC]

---

## A first app

`nudge` lists the projects and adds a subtask to the one you press. Put three files in `<hub>/.oculus/apps/nudge/`, write `app.yml` last, then open the app and approve it.

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

The write changes the project's `project.yml`, and History undoes it. Take `subtask-add` out of `writes` and the page shows `Refused: not_declared`.

## What an app is

- A folder with an HTML page, its scripts and styles, and `app.yml`. oculus picks up a new or changed folder while it runs; no build, no restart.
- The page runs in a sandboxed frame with no cookies, no storage, no popups and no access to the rest of oculus. It talks to oculus only through the bridge, `/apps/-/oculus.js`. While the pane holding the app hides its tab row (Hide Tab Row), the top of the page is cut off by the band along the pane's top edge, 4 px, or by the row while it shows, and that part takes no pointer, the page keeping its size.
- A machine app lives in the primary hub's `.oculus/apps/` and may read every channel open to apps. A root app lives in `.oculus/apps/` of another folder of the workspace, travels with that repository, reads files only from its own folder, and gets fewer channels.
- An app with a `host` also runs a program on this machine (The host), which reaches the languages, debuggers, tasks, terminals, source control and file decorations of oculus (The tools).
- Open an app from the Apps rail button, the Views catalogue, Open View (the strip's right-click menu, under Apps), or `a` and its digit.

## Where the files go

- A machine app: `<hub>/.oculus/apps/<name>/` (or the folder `apps_dir` of the primary hub's `.oculus/config.yml` names). A root app: `<folder>/.oculus/apps/<name>/`.
- The folder name matches `^[a-z][a-z0-9-]{0,39}$` and holds `app.yml`. Subfolders are fine. Names starting with a dot, and links, are not part of the app.
- At most 500 files and 20 MB (`max_files`, `max_mb`).
- The app's store is one file outside its folder: `~/.oculus/app-data/<name>.json` for a machine app, `<folder>/.oculus/app-data/<name>.json` for a root app.
- Use relative paths in the HTML. The files' address changes with every change and every server start, so never copy it.

## The manifest

`app.yml` is one map of these keys. Any other key refuses the app. The template is in [templates](templates.md).

| Key | Required | What it is |
|-----|----------|------------|
| `name` | yes | the folder's name |
| `title` | yes | 1 to 40 characters |
| `description` | no | up to 200 characters, shown on the approval panel |
| `glyph` | no | a name from `config/catalogs/glyphs.yml`; default `app_view` |
| `bridge` | yes | `1` |
| `entry` | no | the `.html` page; default `index.html` |
| `reads` | no | the channels the app reads |
| `writes` | no | the write kinds the app asks for |
| `connects` | no | outside origins the page may fetch: `https://host[:port]`, or `http://localhost` / `127.0.0.1` |
| `host` | no | a `.js` or `.mjs` file run as the app's program |
| `files` | no | machine apps only: folders of the workspace the page may read, `<folder name>` or `<folder name>/<path>` |
| `secrets` | no | `true` to keep secrets in the keyring |
| `activation` | no | when the host starts: `onTab` (default), `onStartupFinished`, `onCommand:<id>`, `onView:<id>`, `onLanguage:<id>`, `workspaceContains:<glob>`; needs `host` |
| `depends` | no | machine apps whose host must run first |
| `contributes` | no | what the app adds to oculus (What an app adds) |

A fault makes the folder no app; the Findings view names it as `apps[<name>]` with a sentence. An unknown `glyph` is the one fault that still offers the app.

## Approval

- An app runs only after you approve it. The panel in its tab says what it reads, writes and reaches, where it keeps data, its folder and size, what it adds to oculus, and, for a host or a debugger, that it runs a program with your rights.
- Approve approves exactly the files shown. Keep approved while I edit keeps it approved while its files change, until the server stops; a change to `app.yml` still asks again. Open the app's folder shows it in Files.
- Any change to a file asks again, a `git pull` of a root app included. Revoke takes the approval back.
- A tab shows a lock while the app is not approved, an edit mark while kept approved, a disabled mark while disabled.

## Managing apps

- **Disable and Enable**, also per workspace, are in the app's menus, its panel and its tab. A disabled app reads, writes and runs nothing, and its host stops.
- **Remove** (machine apps) moves the folder and its store to the Trash, deletes its secrets and its approval. A root app is deleted from its repository.
- **Add app from folder** (Apps group, or Add as App on a Files folder) copies a folder with an `app.yml` into the apps folder.
- Disable, Remove and Revoke ask first when the app runs a debug session, tasks or terminals, or when other apps depend on it, and name each.

## What an app adds

`contributes` takes VS Code's contribution points, in their own shape, in YAML. Nothing shows until the app is approved, and it all goes the moment the app is disabled, revoked, removed or changed.

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

- Every id an app adds (command, container, view, custom editor `viewType`, setting, context key, problem matcher, source control) starts with the app's `name` and a dot. Language ids, debugger types and task types take no prefix.
- `oculus.` is reserved. An id another app declared first refuses the later app (`id_taken`).

### The points

| Point | Entries | Fields |
|-------|---------|--------|
| `commands` | list | `command`, `title`, `category?`, `icon?`, `enablement?` |
| `keybindings` | list | `command`, `key`, `mac?`, `linux?`, `win?`, `when?`, `args?` |
| `menus` | map from a menu id to a list | `command`, `when?`, `group?`, `alt?` |
| `viewsContainers` | map from `activitybar` or `panel` to a list | `id`, `title`, `icon?` |
| `views` | map from a container id, or `explorer`, to a list | `id`, `name`, `type?` (`tree` or `webview`), `when?`, `entry?` |
| `customEditors` | list | `viewType`, `displayName`, `selector` (list of `{ filenamePattern }`), `priority?` (`default` or `option`), `entry` |
| `configuration` | map | `title?`, `properties` |
| `themes` | list | `label`, `uiTheme`, `path` |
| `iconThemes` | list | `id`, `label`, `path` |
| `languages` | list | `id`, `aliases?`, `extensions?`, `filenames?`, `filenamePatterns?`, `firstLine?`, `configuration?`, `icon?` |
| `grammars` | list | `scopeName`, `path`, `language?`, `embeddedLanguages?`, `injectTo?`, `tokenTypes?` |
| `snippets` | list | `language`, `path` |
| `semanticTokenTypes` | list | `id`, `superType?`, `description?` |
| `semanticTokenModifiers` | list | `id`, `description?` |
| `semanticTokenScopes` | list | `scopes`, `language?` |
| `jsonValidation` | list | `fileMatch`, `url` (a JSON file of the app) |
| `configurationDefaults` | map | an option of oculus or a setting the app declares, with its value |
| `debuggers` | list | `type`, `label`, `languages?`, `program?`, `args?`, `runtime?`, `runtimeArgs?`, `configurationAttributes?`, `initialConfigurations?`, `configurationSnippets?` |
| `breakpoints` | list | `language` |
| `taskDefinitions` | list | `type`, `required?`, `properties?` |
| `problemPatterns` | list | `name`, `regexp` with group numbers, or `patterns` |
| `problemMatchers` | list | `name`, `owner`, `pattern`, `source?`, `fileLocation?`, `severity?`, `background?` |

- A fault in a point refuses the app with a finding that names it. A menu id oculus does not draw, a `submenu`, and a container kind other than `activitybar` and `panel` are left out with a finding; the app is still offered. `notebooks` and `submenus` refuse the app.
- `icon` is `$(name)` of a glyph in `config/catalogs/glyphs.yml`, or a file of the app.

### When clauses and context keys

A `when` or `enablement` uses VS Code's grammar. A key nothing set is undefined.

| Key | Holds |
|-----|-------|
| `isMac`, `isLinux`, `isWindows` | the platform |
| `editorTextFocus`, `editorFocus` | the source editor holds the keyboard |
| `editorLangId` | the language of the source tab on screen |
| `resourceExtname`, `resourceFilename`, `resourceLangId`, `resourcePath` | the file the menu or key concerns |
| `explorerResourceIsFolder` | the Files row is a folder |
| `view`, `focusedView` | the app view a tab draws / that has the focus |
| `viewItem` | the `contextValue` of the tree row |
| `activeCustomEditorId`, `activeWebviewPanelId` | the `viewType` on screen |

Set your own keys with `executeCommand('setContext', key, value)`; the key starts with the app's name and a dot. They go when the host stops.

### Commands

- A command is listed in Cmd-K as `<category>: <title>`, with the app's title and its key.
- Choosing it runs the host's handler (`oculus.commands.registerCommand`), starting the host first, else the handler a tab registered with `register('command', id)`.
- `executeCommand` (host) and `commands.execute` (page) run any approved app's command, `setContext`, and `oculus.theme`, `oculus.crt`, `oculus.tab` and `oculus.goto` with one text argument. oculus's other commands answer `closed`.

### Keybindings

- VS Code's key syntax: `ctrl+shift+p`, `cmd+k`, a chord `ctrl+k ctrl+c`. `mac`, `linux` and `win` replace `key` on that platform.
- oculus's own keys come first: a key oculus takes is not bound, with a finding. The Keyboard Shortcuts view lists app keys under Apps.

### Menus

| Menu id | Where it draws |
|---------|----------------|
| `commandPalette` | Cmd-K |
| `editor/context` | the source editor's right-click menu |
| `editor/title` | a source tab's or custom editor's action strip (`navigation` as buttons) |
| `editor/title/context` | a tab's right-click menu |
| `explorer/context` | a Files row's right-click menu |
| `view/title` | an app view's title actions |
| `view/item/context` | an app tree row's menu (`inline` as buttons) |
| `scm/title`, `scm/repository`, `scm/sourceControl`, `scm/resourceGroup/context`, `scm/resourceFolder/context`, `scm/resourceState/context`, `scm/change/title` | an app source control |
| `debug/callstack/context`, `debug/variables/context`, `debug/toolBar` | the Debug view |
| `terminal/context`, `terminal/title/context` | a terminal and its list row |

Groups order as in VS Code, after oculus's own. A command gets VS Code's arguments: `{ root, path }` for the file menus, the element for a tree row.

### Status bar items

A host calls `oculus.window.createStatusBarItem(id, alignment, priority)`; a page calls `register('statusItem', id, { alignment, priority })` and then `changed('statusItem', id, fields)`. Fields: `text`, `tooltip`, `command`, `name`, `backgroundColor` (warning or error), `accessibilityInformation`. The reader can hide an item from the bar's menu.

### Views

- A view is listed in the Views catalogue under Apps, and in Open View (the strip's right-click menu) under Apps with its container's title as its hover words. The first time, an `activitybar` view docks on the left, a `panel` view at the bottom, an `explorer` view beside Files.
- `type: webview` draws the view's `entry` page, with the bridge.
- `type: tree` gets its rows from the host: `oculus.window.registerTreeDataProvider(viewId, provider)` or `createTreeView`, answering VS Code's TreeItem. A press runs the row's `command`.
- A panel is `oculus.window.createWebviewPanel(viewType, title, { entry })` from a host, or `createPanel(viewType, title, { entry })` from a page: a tab drawing that page of the app.

### Custom editors

- A file matching a `default` editor opens in it. An `option` editor adds Open With... to Files and Reopen Editor With... to a tab.
- The page gets `document.read()`, `document.save(bytes)` and `document.dirty(flag)`, and the handlers `onSave()` and `onRevert()`.
- A save checks the file did not change on disk, keeps a local history copy, and is refused while a source tab holds unsaved text of the file.
- `document.dirty(true)` makes closing the tab ask whether to save it. The question's Save calls `onSave()` and closes the tab when the page has called `document.dirty(false)` by the time `onSave()` answers; a page still marked dirty keeps its tab open.

### Settings

- `configuration.properties` declares settings with `type` (`boolean`, `number`, `integer`, `string`, `array`), `default`, `description`, and `enum`, `minimum`, `maximum` or `items`. They are rows of the Settings view under apps.
- Values are written to `app_settings` of the primary hub's `.oculus/config.yml`. A value that breaks its declaration is a finding and the app reads the default.
- A host reads `oculus.workspace.getConfiguration(section).get(key)` and hears `onDidChangeConfiguration`; a page reads `settings.get(key)` and hears `onSettings(keys)`.

### Themes and file icon themes

- `themes` name a VS Code colour theme file; it is drawn under a heading of the app's title in the Settings view's choice of theme and in Cmd-K's `:theme`, its row reading `<label> (<app title>)`.
- `iconThemes` name a VS Code file icon theme file; choose it as File Icon Theme in Settings or with `:file-icons`.
- When the app stops acting, both fall back to the default.

## The bridge

```js
import { connect } from '/apps/-/oculus.js';

const oculus = await connect({ onChannel, onTheme, onStore, onHost });
```

`connect` resolves once oculus answers, after painting the theme on the page. Every handler is optional. A page that does not connect within `connect_timeout_s` shows "The app did not answer in time."

### The handlers

| Handler | Called with | When |
|---------|-------------|------|
| `onChannel(channel, version, payload)` | the channel's message | each new message of a channel in `reads` |
| `onTheme(theme)` | `{ name, tokens, wall }` | the theme, wallpaper or text size changed |
| `onStore(value)` | the store | the store changed, in every tab |
| `onHost(method, params)` | what the host sent | the host called `sendToPage` |
| `onCommand(id, args)` | a command | a command this page registered is run; its return is the result |
| `onVisibility(visible)` | a boolean | the view is shown or hidden |
| `onSettings(keys)` | the changed keys | a setting of the app changed |
| `onSave()`, `onRevert()` | nothing | Cmd+S, Revert File, in a custom editor |

They are not called for what oculus already holds at connect: use `read(channel)` and `getTheme()` for the first values.

### The methods

| Method | Resolves with | Rejects with |
|--------|---------------|--------------|
| `read(channel)` | `{ version, payload }`, or `null` before the first message | `not_declared`, `closed`, `missing` |
| `getTheme()` | `{ name, tokens, wall }` | none |
| `getState()` | the tab's saved value, or `null` | none |
| `setState(value)` | nothing | `not_json`, `too_large` |
| `getStore()` | the store, or `null` | `missing`, `failed:<status>` |
| `setStore(value)` | nothing | `not_json`, `too_large`, `rate`, `refused:<reason>`, `failed:<status>` |
| `write(kind, body)` | nothing | `not_declared`, `rate`, `declined`, `refused:<reason>`, `failed:<status>`, `missing` |
| `open(target)` | nothing, once the tab is open | `rate`, `missing`, `closed`, `declined`, `failed:0` |
| `key(init)` | nothing | none |
| `commands.execute(id, ...args)` | the command's result | see Refusal words |
| `register(kind, id, options)`, `unregister(kind, id)` | nothing | `kind` `command` or `statusItem` |
| `changed(kind, id, options)` | nothing | `kind` `statusItem` or `progress` |
| `createPanel(viewType, title, { entry })` | the panel's id | |
| `ui.message(message, { tone, items, modal })` | the item pressed, or `null` | |
| `ui.quickPick(items, options)` | the chosen indexes, or `null` | |
| `ui.inputBox(options)` | the text, or `null` | |
| `ui.progress({ location, title, cancellable }, task)` | what `task` returns | |
| `settings.get(key)` | one of the app's settings | |
| `document.read()`, `document.save(bytes)`, `document.dirty(flag)` | the bytes / nothing / nothing | custom editor only |
| `fs.readFile({ root, path })` | a `Uint8Array` | `not_declared`, `closed`, `missing`, `failed:<status>` |
| `fs.readDirectory({ root, path })` | `[name, type]` pairs | as above |
| `fs.stat({ root, path })` | `{ type, ctime, mtime, size }` | as above |
| `commands.run(name)` | nothing, once its terminal is open | `missing`, `declined`, `rate` |
| `secrets.get(key)`, `secrets.store(key, value)`, `secrets.delete(key)` | the text / nothing / nothing | `not_declared`, `too_large`, `rate`, `refused:<reason>` |
| `host.request(method, params)` | the host's answer | `not_declared`, `host_down`, `refused:<message>` |

- Every rejection is a plain string (Refusal words).
- `setState` and `setStore` take plain JSON. State is per tab and kept in the layout; the store is one file shared by every tab, undoable in History.
- `fs.*` reads a folder `files` names (machine app) or the app's own folder (root app). `type` is 1 for a file, 2 for a folder, plus 64 for a link.
- `commands.run(name)` runs a command of `.oculus/commands.yml` in a terminal you see, with that command's approval.
- A secret key is 1 to 64 of `A-Z a-z 0-9 . _ -`; a value at most 2048 bytes.
- A call whose tab closes before oculus answers never settles.

### Channels

| Channel | Who | What it carries |
|---------|-----|-----------------|
| `portfolio` | every app | projects, venues, datasets, pillars, domains, funding, people, organisations, resources, collections, feeds summary, career |
| `feeds` | every app | Lit Watch, position leads, LinkedIn posts |
| `hpc` | every app | the cluster queue, recent jobs, partitions, quota |
| `audit` | every app | the audit findings and the muted ones |
| `config` | every app | the configuration, each hub's lists (read from its domains, venues and data registries), the text catalog, the icons, this machine's name and address |
| `git` | every app | the state of each repository |
| `files` | every app | which folder changed, with no content |
| `inbox` | machine only | mail threads |
| `calendar` | machine only | calendar events |
| `sessions` | machine only | agent sessions and oculus's terminals |
| `usage` | machine only | token usage of each account |

A root app gets only its own folder's part of `git` and `files`. Every other channel is closed to apps.

### Channel payloads

Payloads are plain JSON. `X?` may be absent. A `Finding` is `{ file, key, message, line? }`.

**`portfolio`** is `{ version, entities, relations, findings }`. `entities` holds maps keyed by id:

| Key | Record fields |
|-----|---------------|
| `projects` | `id`, `title`, `folder`, `file`, `workspaceFolder?`, `repository?` (with `clones`), `chips`, `results`, `ideas`, `docs`, `waitingOn`, `resourceIds`, `relatedIds`, `fundingIds`, `datasetIds`, `pillarIds`, `domainIds`, `collaborators`, `followups`, `subtasks`, `tier?`, `category?`, `stage?`, `form?`, `short?`, `lead?`, `statusLine?`, `focus?`, `priority?`, `eli5?`, `next?`, `latest?`, `deadline?`, `snooze?`, `doi?`, `outcome?`, `venue?`, `deck?`, `venueId?`, `authors?`, `year?`, `staleDays?`, `pin?`, `deckTags?`, `codeAvailability?`, `reproduced?`, `links?`, `tags?`, `codeFolder?` |
| `venues` | `id`, `name`, `themes`, `short?`, `tier?`, `category?`, `jif?`, `quartile?`, `wos?`, `scopus?`, `free?`, `format?`, `wants?`, `link?`, `deadline?`, `deadlineMonth?`, `heldMonth?`, `timing?`, `call?`, `email?`, `wosMark?`, `scopusMark?` |
| `datasets` | `id`, `name`, `themes`, `projectIds`, `retrieval` (the sources, each `{ kind, ... }` with the fields its kind takes, and `into?`, `unpack?`, `strip?`, `folder?`; a `url` source's `urls` are `{ url, name?, sha256?, md5? }` rows with at most one of `sha256` and `md5`), `recover` (true when every source is a download), `modality?`, `description?`, `size?`, `access?`, `source?`, `path?`, `notes?` |
| `pillars`, `domains` | `id`, `title`, `projectIds`, `blurb?`; a pillar also `fundingIds`, `color?`, `kind?`, `goal?`; a domain also `color?` (`#rrggbb`) and `expectsDatasets?` |
| `funding` | `id`, `title`, `followups`, `subtasks`, `tags`, `projectIds`, `pillarIds`, `sub?`, `status?`, `date?`, `deadline?`, `note?`, `statement?`, `link?`, `url?`, `snooze?`, `funder?` |
| `people` | `id`, `name`, `affiliations`, `links`, `projectIds`, `jointWorkIds`, `role?`, `orcid?`, `email?`, `folder?`, `file?`, `self?` |
| `organisations` | `id`, `name`, `links`, `personIds`, `fundingIds`, `kind?`, `country?` |
| `resources` | `id`, `name`, `kind`, `links`, `order`, `host?`, `access?` |
| `collections` | `id`, `title`, `file`, `entries`, `intro?`, `schema?`; a schema line is `{ field, type, label?, required?, options?, from?, when?, help?, open?, map?, fields?, filter? }`, an option a word or `{ key, label }` |
| `feeds` | `leads`, `radar`, `scout`, `linkedin` summaries |
| `career` | the career file, or `null` |

An Entry is `{ id, title, fields, file, index, root }`. `relations` holds `[id, id]` lists: `projectVenue`, `projectFunding`, `projectDataset`, `projectPillar`, `projectDomain`, `projectRelated`, `fundingPillar`, `projectPerson`, `jointWorkPerson`, `personOrganisation`, `fundingOrganisation`.

Every record carries `root`, the name of its hub, and has the id `<hub>:<key>`, the primary hub's records included. A key a file names resolves in the record's own hub first, then in the one other hub that holds it; a key two other hubs hold resolves to none and is a finding. A record's `...Ids` fields, `venueId`, `collaborators` and `relations` hold the ids its keys resolved to, and `waitingOn` holds the id of each name that resolved and the name as written for one that did not; an Entry's `fields` hold the keys its file holds. An app writes the primary hub's records only, naming each by its id, so with no primary hub an app writes no record and makes none.

| Channel | Payload |
|---------|---------|
| `feeds` | `radar`, `leads`, `linkedin`, each `{ ok, kind, file, meta, entries, cadenceDays?, schema?, missing?, error?, hubFiles?, hubSchemas? }` |
| `hpc` | `status` (`starting`, `ok`, `unreachable`, `error`, `unconfigured`), `hint?`, `jobs`, `running`, `pending`, `total`, `recent`, `sinfo`, `quota`, `updated`, `lastOk?`, `host`, `pollMin`, `retryMin?` |
| `audit` | `{ findings: [{ hub, scope, where, root, file, kind, message, signature }], muted }`; `hub` is the hub the finding is of, `scope` its place in that hub |
| `config` | `{ config, hubs: { primary, lists }, text, icons, host: { name, address }, findings }`; `lists` holds each hub's `{ domains, venue_themes, data_themes }`, built from its domains registry and the `themes` options of its venues and data registries |
| `git` | per repository folder: `branch`, `ahead`, `behind`, `upstream?`, `detached`, `present`, `repository`, `inWorkspace`, `top`, `staged`, `unstaged`, `untracked`, `conflicted`, `sequence`, `mergeMessage`, `remotes`, `stashes`, `tags`, `log`, `branches`, `worktrees`, `error` |
| `files` | `{ root, folders?, bookmarks?, workspaces? }` |
| `inbox` | `status`, `accounts`, `threads`, `updated`, `pollMin`, `retryMin`, `notesRun`, `notesError?` |
| `calendar` | `status`, `accounts`, `events`, `updated`, `pollMin`, `retryMin`, `daysBack`, `daysAhead` |
| `sessions` | `{ records, workspaces, terminals? }` |
| `usage` | `{ accounts, days, builtAt }` |

### Writes

`write(kind, body)` changes the hub's data. The kind must be in `writes`, and the body's `kind` must equal it.

| Kind | Body | Asks first |
|------|------|------------|
| `manifest` | `{ kind, id, fields }` | no |
| `entry` | `{ kind, collection, id, fields }` | no |
| `subtask` | `{ kind, target: { id, collection? }, key, action, value? }`; `action` `done`, `reopen`, `snooze`, `delete`, `do` or `deadline`, the last two with the new text or date in `value` | no |
| `subtask-add` | `{ kind, target: { id, collection? }, fields }`; `fields.do` the text | no |
| `followup` | `{ kind, target: { id, collection? }, key, action, value? }`; `action` `done` (takes the note out), `do` or `after`, the last two with the new text or date in `value` | no |
| `followup-add` | `{ kind, target: { id, collection? }, fields }`; `fields.do` the text, `fields.after` the date it stays hidden until | no |
| `host` | `{ kind, name, status }` for a career host | no |
| `new-entry` | `{ kind, collection, fields, root? }`; `root` names the hub, which for an app is the primary hub alone | no |
| `reorder` | `{ kind, collection, order }` | no |
| `delete-entry` | `{ kind, collection, id }` | yes |
| `feed-field` | `{ kind, feed, id, field, value }`; `feed` `radar`, `leads` or `linkedin` | no |
| `feed-delete` | `{ kind, feed, id }`; `feed` `radar` or `leads` | yes |
| `lead-add` | `{ kind, fields }`; `fields.title` required | no |
| `radar-add` | `{ kind, fields }`; `fields.title` required | no |
| `linkedin-idea` | `{ kind, title, category? }` | yes, no undo |
| `linkedin-post` | `{ kind, id }`; `id` the idea's id | yes, no undo |
| `new-idea` | `{ kind, fields, root? }`; `fields.id`, and `fields.tier`, `fields.folder`, `fields.title`, `fields.short`, `fields.domain` and `fields.eli5` optional; `root` names the hub, which for an app is the primary hub alone | yes, no undo |

- An `id`, a `target.id` and each id of `order` is the record's id, `<hub>:<key>`, a feed entry's included: its key is the title of a lead or a Lit Watch paper and the file's name of a LinkedIn idea. An id with no hub part is refused with 400, and an id whose hub part no workspace folder carries with 404. For an app the hub of a write that makes a record is the primary hub alone, so with no primary hub such a write (`new-entry`, `lead-add`, `radar-add`, `linkedin-idea`, `new-idea`) is refused with 409; a `host` write goes to the career file of the primary hub, else of the first hub, as the page's does.
- A write that makes or renames a record answers with the record's id, `<hub>:<key>`, in `id`.
- Every write is in the change log with the app's id, and History undoes it, except the three marked.
- Every other kind is closed to apps (`write_closed` in a manifest): nothing that runs processes, writes arbitrary files, reaches a remote or acts on an account.

### Open

`open(target)` needs no manifest entry. The target has exactly one key:

| Target | Opens | Rejects |
|--------|-------|---------|
| `{ view: '<id>' }` | a catalogue view | `closed` for a view opened only for something, `missing` for an unknown id |
| `{ project: '<id>' }` | the project's tab | `missing` |
| `{ file: { root, path } }` | the file, as Files opens it | `closed`, `missing`, `failed:0` |
| `{ file: { root, path, page } }` | a PDF at that page, in a new tab or the tab already showing it | `closed` for a `page` that is no whole number from 1 or a path not ending `.pdf`; `missing`, `failed:0` |
| `{ url: '<address>' }` | the address in a new browser tab, after you confirm | `closed` for a non-http address; `declined` on Cancel |

`page` counts from 1, in the desktop app and in a browser alike. The extension is compared without case, so `.PDF` takes a page too, and a page past the end opens at the last page. A string such as `'3'` is refused.

A link that leaves the app goes through `open({ url })`.

### Theme and keys

The page gets every custom property of oculus's `tokens.css`, so CSS can use `var(--bg)` and `var(--ink)`. With the wallpaper on, the page paints no background. Key presses with Control, Meta or Alt, and Escape, are passed to oculus.

## The host

An app whose manifest names `host` gets one program on this machine, running with your rights while the app is approved, enabled and unchanged. The page calls `oculus.host.request`; the host answers, and reaches the page with `sendToPage`.

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

- oculus loads the file as an ES module and calls `activate(oculus)` once, and `deactivate()` before stopping. What `activate` returns is the API for apps that depend on this one.
- Only the approved files run: an import of any other file is refused. Ship packages inside the app's folder. `node:` modules load.
- What the host prints, on standard output or standard error, shows in the Processes view (the last `host_output_kb`). A write straight to file descriptor 1 breaks the link to oculus and stops the host.
- It starts at its first `activation` event, on a request from a tab, or for a declared command.
- It stops when the app is disabled, revoked, changed or removed, on Stop in Processes, and when oculus closes: `deactivate()`, `host_stop_seconds` to settle, then SIGTERM and SIGKILL. Programs it started stop with it.
- A host that ends on its own is not started again; the tab and Processes offer Restart.
- An app with `debuggers` and no `host` still runs its debug adapters.

The connection object:

| Member | What it does |
|--------|--------------|
| `onRequest(handler)` | answers `host.request`, called with `(method, params, tab)` |
| `store.get`, `update`, `keys`, `onDidChange` | the app's store; `update(key, undefined)` deletes |
| `secrets.get`, `store`, `delete` | as the page's |
| `sendToPage(method, params, tab?)` | calls `onHost` of one tab, or every tab |
| `apps.get(name)` | the API of an app in `depends` |
| `commands.registerCommand(id, handler)`, `executeCommand(id, ...args)` | as VS Code's |
| `window.showInformationMessage`, `showWarningMessage`, `showErrorMessage`, `showQuickPick`, `showInputBox`, `withProgress` | as VS Code's |
| `window.createStatusBarItem`, `registerTreeDataProvider`, `createTreeView`, `createWebviewPanel` | see What an app adds |
| `workspace.getConfiguration`, `onDidChangeConfiguration` | the app's own settings |

## The tools

The tools follow VS Code's API by name and shape, so code written for `vscode.languages.registerHoverProvider` runs with `oculus` in place of `vscode`. They act only inside the app's scope (every folder of the workspace for a machine app, its own folder for a root app), and go with everything they started when the app stops acting.

### Files

| Member | What it does |
|--------|--------------|
| `workspace.workspaceFolders`, `onDidChangeWorkspaceFolders` | the folders of the scope |
| `workspace.getWorkspaceFolder`, `asRelativePath` | as VS Code's |
| `workspace.fs.readFile`, `writeFile`, `stat`, `readDirectory`, `createDirectory`, `delete`, `rename`, `copy` | the files of the scope; every write is undoable in History |
| `workspace.findFiles(include, exclude?, maxResults?, token?)` | files matching a glob |
| `workspace.createFileSystemWatcher(glob)` | create, change and delete events |
| `workspace.applyEdit(edit)` | a `WorkspaceEdit`; `false` when a file is refused |
| `workspace.saveAll()` | saves the open documents |
| `workspace.registerTextDocumentContentProvider(scheme, provider)` | text for `scheme:` addresses |
| `workspace.textDocuments`, `openTextDocument`, `onDidOpenTextDocument`, `onDidChangeTextDocument`, `onDidCloseTextDocument`, `onDidSaveTextDocument` | the documents given to the app |

A path outside the scope fails with `outside`; a private or closed folder with `closed`; a missing file with `missing`.

### Languages

`languages`, `grammars`, `snippets`, `semanticToken*`, `jsonValidation` and `configurationDefaults` give the editor a language with no code and no host. A language, extension or grammar oculus ships, or another app registered first, stays where it is (a finding names it). The reader's `languages:` setting wins over every app.

### Language servers

`notes-lsp` gives `.note` files a language, a grammar, snippets and a server.

```yaml
name: notes-lsp
title: Notes language
bridge: 1
host: host.mjs
activation: [onStartupFinished]
contributes:
  languages:
    - id: notes
      aliases: [Notes]
      extensions: [".note"]
      configuration: notes.language.json
  grammars:
    - language: notes
      scopeName: source.notes
      path: notes.tmLanguage.json
  snippets:
    - language: notes
      path: notes.snippets.json
```

```js
import { fileURLToPath } from 'node:url';

export function activate(oculus) {
    const client = oculus.languages.registerLanguageServer('notes-lsp', {
        outputChannelName: 'Notes language server',
        documentSelector: [{ language: 'notes' }],
        serverOptions: {
            command: process.execPath,
            args: [fileURLToPath(new URL('./server.js', import.meta.url))]
        }
    });
    client.start();
}
```

| Member | What it does |
|--------|--------------|
| `languages.registerLanguageServer(id, options)` | `documentSelector`, `serverOptions`, `outputChannelName`, `initializationOptions`, `synchronize.configurationSection`; answers a client |
| `client.start()`, `stop()`, `dispose()`, `state`, `onDidChangeState` | as VS Code's |
| `client.sendRequest`, `sendNotification`, `onRequest`, `onNotification` | as VS Code's |
| `languages.getLanguages()` | every language the editor knows |

- `serverOptions` is `{ command, args, options }`, `{ run, debug }`, or a function that answers streams.
- One server runs per folder. It must answer `initialize` within 30 seconds, ends 60 seconds after its last tab closes, and restarts on the next request after a crash; the fifth crash in three minutes leaves it stopped until Restart.
- With several servers for one language: lists are joined (oculus's first), hovers shown together, single answers from the first server that offers them. The apps' servers get 2 seconds.

### Language features

`md-notes` adds a hover and a diagnostic to Markdown files.

```js
export function activate(oculus) {
    oculus.languages.registerHoverProvider({ language: 'markdown' }, {
        provideHover(document, position) {
            const line = document.lineAt(position.line).text;
            return new oculus.Hover(`${line.length} characters`);
        }
    });

    const todo = oculus.languages.createDiagnosticCollection('todo');
    const scan = (document) => {
        if (document.languageId !== 'markdown') return;
        const found = [];
        for (let line = 0; line < document.lineCount; line += 1) {
            const at = document.lineAt(line).text.indexOf('TODO');
            if (at < 0) continue;
            const range = new oculus.Range(line, at, line, at + 4);
            found.push(new oculus.Diagnostic(range, 'Unfinished', oculus.DiagnosticSeverity.Warning));
        }
        todo.set(document.uri, found);
    };
    oculus.workspace.onDidOpenTextDocument(scan);
    oculus.workspace.onDidChangeTextDocument((event) => scan(event.document));
}
```

Every `languages.register*Provider` of VS Code is available: hover, completion, definition, declaration, type definition, implementation, references, highlights, document and workspace symbols, code actions, code lens, links, rename, signature help, formatting (document, range, on type), folding, selection ranges, inlay hints, semantic tokens, call and type hierarchy. `createDiagnosticCollection` gives diagnostics with the collection's name as their source. A selector is a language id, `{ language, scheme, pattern }` or a list.

### Debug adapters

```yaml
contributes:
  debuggers:
    - type: notes.dbg
      label: Notes debugger
      languages: [notes]
      program: adapter.js
      runtime: node
      configurationAttributes:
        launch:
          required: [program]
          properties:
            program: { type: string }
            stopOnEntry: { type: boolean }
      initialConfigurations:
        - name: Run
          type: notes.dbg
          request: launch
          program: ${file}
  breakpoints:
    - language: notes
```

| Member | What it does |
|--------|--------------|
| `debug.registerDebugAdapterDescriptorFactory(type, factory)` | answers a `DebugAdapterExecutable`, `DebugAdapterServer` or `DebugAdapterInlineImplementation` |
| `debug.registerDebugConfigurationProvider(type, provider)` | fills Add Configuration and adjusts a configuration before launch |
| `debug.startDebugging(folder, nameOrConfiguration)`, `stopDebugging`, `activeDebugSession`, `breakpoints` | as VS Code's |
| `debug.onDidStartDebugSession`, `onDidTerminateDebugSession`, `onDidReceiveDebugSessionCustomEvent`, `onDidChangeActiveDebugSession`, `onDidChangeBreakpoints` | as VS Code's |

- With no factory, oculus runs `program` with `runtime`.
- A `launch.yml` entry of the app's `type` runs its adapter with no extra approval. The Debug view draws only the controls the adapter declares.
- The type `rite` is oculus's own. One session runs at a time.

### Tasks

`make-tasks` gives every repository build tasks and reads the compiler's lines.

```yaml
name: make-tasks
title: Make tasks
bridge: 1
host: host.mjs
activation: [onStartupFinished]
contributes:
  taskDefinitions:
    - type: make.target
      required: [target]
      properties:
        target:
          type: string
  problemMatchers:
    - name: make-tasks.gcc
      owner: gcc
      fileLocation: relative
      pattern:
        regexp: '^(.*):(\d+):(\d+): (warning|error): (.*)$'
        file: 1
        line: 2
        column: 3
        severity: 4
        message: 5
```

```js
export function activate(oculus) {
    const make = (target, isDefault) => {
        const task = new oculus.Task(
            { type: 'make.target', target },
            oculus.TaskScope.Workspace,
            `make ${target}`,
            'make',
            new oculus.ShellExecution(`make ${target}`),
            ['$make-tasks.gcc']
        );
        task.group = new oculus.TaskGroup('build', 'Build');
        task.group.isDefault = isDefault;
        return task;
    };
    oculus.tasks.registerTaskProvider('make.target', {
        provideTasks: () => [make('all', true), make('clean', false)],
        resolveTask: (task) => make(task.definition.target, false)
    });
}
```

Every repository then lists `make: make all` (its default build) and `make: make clean`, and a `commands.yml` entry `{ name: docs, type: make.target, target: docs }` is a third task.

| Member | What it does |
|--------|--------------|
| `tasks.registerTaskProvider(type, provider)` | `provideTasks()` and `resolveTask(task)` |
| `tasks.fetchTasks`, `executeTask`, `taskExecutions` | as VS Code's |
| `tasks.onDidStartTask`, `onDidEndTask`, `onDidStartTaskProcess`, `onDidEndTaskProcess` | as VS Code's |
| `Task`, `TaskGroup`, `ShellExecution`, `ProcessExecution`, `CustomExecution` | as VS Code's |

- Tasks are listed with the repository's commands as `<source>: <name>`, and run in a terminal with no extra approval.
- A matcher reads the output; a match outside the repository is dropped.

### Terminals

| Member | What it does |
|--------|--------------|
| `window.createTerminal({ name, shellPath, shellArgs, cwd, env })` | a program in tmux; survives a server restart |
| `window.createTerminal({ name, pty })` | a terminal drawn by the host |
| `window.terminals`, `activeTerminal`, `onDidOpenTerminal`, `onDidCloseTerminal`, `onDidChangeActiveTerminal` | the app's terminals |
| `terminal.sendText`, `show`, `hide`, `dispose`, `name`, `processId`, `exitStatus` | as VS Code's |

An app holds at most 32 terminals, only its own, with `cwd` inside its scope.

### Source control

`oculus.scm.createSourceControl(id, label, rootUri?)` adds a row to the Repositories list, with `inputBox`, `count`, `acceptInputCommand`, `statusBarCommands`, `quickDiffProvider` and `createResourceGroup(id, label)`. The `scm/` menus run the app's commands. It is no git repository.

### File decorations

`oculus.window.registerFileDecorationProvider(provider)`: `provideFileDecoration(uri)` answers `{ badge, tooltip, color, propagate }`. A badge has at most two characters. Several apps' badges are shown one after another.

## Refusal words

| Word | Cause |
|------|-------|
| `not_declared` | the manifest does not list the channel, kind, folder, `secrets`, `host` or dependency, or the key is not the app's own setting |
| `closed` | the channel, file, target or command is not open to apps |
| `too_large` | over a size limit |
| `readonly`, `outside` | a custom editor save to a read-only file or outside its folder |
| `not_json` | the value is not plain JSON |
| `rate` | over `writes_per_min`, `opens_per_min` or `messages_per_min` |
| `declined` | you pressed Cancel |
| `missing` | nothing of that name: view, project, file, command, panel page |
| `refused:<reason>` | oculus refused, with a sentence or a word below |
| `outside` | a host's path or terminal folder outside the app's scope |
| `refused:full`, `refused:env`, `not_a_folder` | a terminal: 32 already, a bad `env` name, `cwd` a file |
| `host_down` | the host is not running and cannot start |
| `failed:<status>` | the server failed; `0` is no answer |

Reasons:

| Reason | Cause |
|--------|-------|
| `kind` | the body's kind is not the kind named, or the kind is closed |
| `<key> names no hub: a write names a record by its hub and its key` | an id with no hub part |
| `The workspace has no hub named <hub>` | an id whose hub part no workspace folder carries |
| `The workspace has no primary hub, so there is nowhere to keep this; ...` | an app's write that makes a record, in a workspace with no primary hub |
| `no project with the id <key>` | no such project |
| `no entry <key> in <collection>` | no such entry |
| `no collection <name>` | no such collection |
| `unknown feed <name>` | not `radar`, `leads` or `linkedin` |
| `no host named <name>` | no such career host |
| `the <feed> feed does not allow that field` | a field the feed's schema does not list |
| `the <feed> feed does not allow deletion` | `linkedin` |
| `two entries share the <field> <value>, so a write cannot address one of them` | a shared key |
| `a new entry needs a <field>` | no key |
| `an entry with that <field> is already in the file` | a taken key |
| `id`, `kind`, `params` | a bad id, kind or value shape |
| `registered`, `view` | an id registered twice, or a tree view not declared |
| `context_key`, `value` | a bad `setContext` key or value |
| `argument` | an argument the command does not take |
| `unsaved` | a custom editor save while a source tab holds unsaved text |
| `unwritable`, `readback` | the store could not be written, or read back different |

## Limits

The `apps:` block of `config/defaults/behavior.yml`, each a row of Settings, which writes a changed value into the open workspace file's `settings:`.

| Key | Default | What it limits |
|-----|---------|----------------|
| `connect_timeout_s` | 10 | seconds for `connect` |
| `state_max_kb` | 64 | one tab's state |
| `store_max_kb` | 256 | the store |
| `writes_per_min` | 30 | writes, store, secrets and document saves |
| `opens_per_min` | 30 | `open`, `commands.run`, `commands.execute`, `createPanel` |
| `messages_per_min` | 600 | messages and `ui` calls |
| `keys_per_s` | 20 | key events from a page |
| `max_files` | 500 | files in an app |
| `max_mb` | 20 | megabytes in an app, or in a custom editor's file |
| `host_output_kb` | 256 | a host's kept output |
| `host_stop_seconds` | 5 | time for `deactivate` |
| `scan_entries` | 10000 | entries read for `workspaceContains` and `fs.readDirectory` |
| `closed_paths` | `[secrets]` | folders no app may open a file from |

## What an app cannot do

- Run a process from its page. Programs belong to the host, which you approve.
- Read files outside `files` (machine app) or its own folder (root app), except the file you open in its custom editor.
- Read another app's files or store, oculus's routes, or oculus's own page.
- Use cookies, `localStorage` or IndexedDB, open a popup, submit a form, or navigate the frame.
- Run an inline script: load scripts as files with `<script type="module" src>`. `.wasm` of its own folder is allowed.
- Load anything from outside its folder; `connects` origins are for `fetch` only.
- Serve a file type other than `.html`, `.js`, `.mjs`, `.css`, `.json`, `.svg`, `.png`, `.jpg`, `.gif`, `.webp`, `.woff`, `.woff2`, `.ttf`, `.otf`, `.txt` and `.wasm`.
- Reach another app's terminals, source controls or debug sessions.
- Replace oculus's own debugger, languages or grammars, or bind a key oculus takes.
- Read or write `~/.oculus`, a hub's `secrets` folder, any `local.yml`, oculus's `config/` folder, or the state files `local.yml` or the hub's `config.yml` (`bookmarks`, `schedules`, `apps_dir`) places elsewhere.
- Edit your bookmarks.

Your approval of the files and of `connects` is the boundary against an app sending what it read elsewhere. An address passed to `open({ url })` can carry data too, which is why the question shows the whole address.

## When something goes wrong

| What you see | Cause | What to do |
|--------------|-------|------------|
| The app is not in the Views catalogue | no `app.yml`, a bad folder name, or outside the apps folder | look for `apps[<name>]` in Findings |
| Findings shows `apps[<name>]` | the manifest broke a rule | fix the file it names |
| The approval panel appears again | a file changed, or a `git pull` | approve again, or use Keep approved while I edit |
| "The app did not answer in time." | `connect` never completed | call `connect` first, from a script file |
| A script or style does not load | inline script, a `.ts` file, a dot-led name or a link | use `.js` and `.css` files with plain names |
| A fetch to an outside address fails | the origin is not in `connects` | add it |
| `not_declared` or `refused:kind` | the manifest lacks the channel or kind, or the body is wrong | add it to `reads` or `writes`, or fix the body |
| A call never answers | the tab closed, or a question waits for you | answer the question |
| "This app is disabled..." | disabled here or machine-wide | Enable |
| The program ended with an exit code | the host stopped on its own | read its output in Processes, press Restart |
| The program waits for approval | a kept or root app changed | approve again |
| The program waits for another app | a `depends` app cannot run or is not installed | fix that app, or `depends` |
| The host ends with a refused file | it imported a file outside the app | put the file in the app's folder |
| A language server shows `failed` | no `initialize` in 30 seconds, or five crashes | Show Output, fix, Restart |
| A language, grammar or snippet is missing | taken by oculus or an earlier app, or unreadable | read `apps[<name>]` in Findings |
| A debug launch finds no debugger | the `type` is no acting app's | fix the type, or approve the app |
| A typed `commands.yml` entry is missing | no app defines the type, or a property is missing | read its finding |
| A terminal did not open | 32 already, or a bad `cwd` or `env` | close one, or fix the call |
| A file decoration is missing | badge over two characters, or outside the scope | read the host's output |
| A root app is missing | its folder left the workspace | add the folder again |
