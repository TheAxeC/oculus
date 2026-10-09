# Building an oculus app

This guide takes you from an empty folder to a working app, then lists every key, method and refusal an app meets. Parts 1 to 3 are enough to see an app run. Part 10 is a complete app, with every file given whole, that exercises each method of the bridge. Parts 4 to 9 and 11 are the reference.

## 1. What an app is

An app is a folder of web files: an HTML page, its scripts and styles, and a manifest named `app.yml`. oculus finds the folder while it runs. It lists the app in the Views catalogue under Apps. Once you approve it, oculus draws its page in a tab inside a sandboxed frame. There is no build step and no restart. A new folder is offered within a few seconds. An edited folder asks for approval again.

The frame is an iframe with `sandbox="allow-scripts allow-downloads"`. The app runs in an opaque origin with no cookies, no storage, no popups, no forms that submit and no access to the rest of oculus. The only way out of the frame is the bridge, a small client at `/apps/-/oculus.js` that your script imports. It gives the script nine methods (part 6). Everything an app reads, writes or opens goes through those methods. Each call is checked against the manifest and against fixed rules in oculus.

There are two kinds of app. A machine app lives in a folder of this machine and may read every channel an app can read (part 6). A root app lives in the `.oculus/apps/` folder of a root shown in the Files view, so it travels with that repository. Whoever writes to a root, a `git pull` included, writes the root app. A root app is therefore offered fewer channels, cannot be kept approved while it changes, and can open files only from its own root.

You reach an app in three places. The Apps button on the rail opens the Apps page, whose pane is empty until you open something. The Views catalogue on the System page lists every offered app under Apps, a root app's title followed by its root's key in parentheses. The chord `v` followed by the digit the catalogue shows beside an entry opens it.

## 2. Where the files go

| Kind | Folder of one app | Set by |
|------|-------------------|--------|
| Machine app | `<apps_dir>/<name>/` | `apps_dir` in `config/local.yml`, `~/.oculus/apps` when absent |
| Root app | `<root>/.oculus/apps/<name>/` | each root shown in the Files view, the hub included |

`apps_dir` takes a path. A value of `~` or one starting with `~/` is under your home folder, and any other relative value is resolved against the engine directory. A change to it is read again at once. The root `engine` is oculus's own `config/` folder and holds no apps. The hub is a root like any other, so `<hub>/.oculus/apps/board/` is the root app `board` of the root `hub`.

Each app folder is a direct subfolder of an apps folder and holds a file `app.yml`. The folder's name is the app's name and must match `^[a-z][a-z0-9-]{0,39}$`: a lowercase letter, then lowercase letters, digits and hyphens, 40 characters at most. Three things are skipped: a file directly in an apps folder, a folder whose name starts with a dot, and a folder with no `app.yml`. A folder with no `app.yml` raises no finding, since nothing in it claims to be an app.

Inside an app folder:

- A file or folder whose name starts with a dot, and every symbolic link, is not part of the app. It is neither recorded for the approval hash nor served.
- The folder may hold at most 500 files and 20 MB in total, `app.yml` counted. More than that gives the finding `too_large` and the folder is not an app. Both limits are settings (part 8).
- Subfolders are fine. A path in the app is relative to the folder and its segments must not be empty or start with a dot.

The approval hash covers the real path of the folder as the disk stores it, the app's name and the bytes of `app.yml`. For each recorded file, in sorted order, it covers the path, the length and the bytes. Two byte-identical copies of an app in two folders are therefore two apps with two approvals. Moving a folder asks for approval again.

An app keeps one store file outside its folder, so writing the store never changes the hash. A machine app's store is `~/.oculus/app-data/<name>.json`. A root app's is `<root>/.oculus/app-data/<name>.json`, which git tracks unless the root ignores `.oculus/app-data/`.

oculus serves the folder at an address that holds a key, `/apps/<name>/<key>/<path>`, or `/apps/@<root key>/<name>/<key>/<path>` for a root app. The key is a hash over the app's view id and content, so it changes whenever a file changes and with every server process. Write relative paths in your HTML (`app.js`, `app.css`) and never copy an address.

## 3. Quick start

This builds the smallest app that connects, in a machine app folder. Write `index.html` and the script before `app.yml`. The folder is offered as soon as `app.yml` exists, and a manifest whose `entry` file is missing gives the finding `entry_missing`. Put the script in its own file, because the frame refuses inline scripts.

Make the folder:

```sh
mkdir -p ~/.oculus/apps/hello
```

`~/.oculus/apps/hello/index.html`:

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Hello</title>
</head>
<body>
    <p id="out">Waiting for oculus.</p>
    <script type="module" src="app.js"></script>
</body>
</html>
```

`~/.oculus/apps/hello/app.js`:

```js
import { connect } from '/apps/-/oculus.js';

const oculus = await connect();
const theme = await oculus.getTheme();
document.getElementById('out').textContent = `Connected. The theme is ${theme.name}.`;
```

`~/.oculus/apps/hello/app.yml`, written last:

```yaml
name: hello
title: Hello
bridge: 1
```

Then:

1. Open the System page and its Views tab. Under Apps the entry Hello appears within a few seconds. Press it, or press `v` and the digit shown beside it.
2. The tab shows the approval panel: the title, the name, the folder, the file count and size, and what the app can do. For this app it says that it reads nothing, writes nothing and reaches no address outside this machine.
3. Press Approve. The tab shows the app's page and the text "Connected. The theme is light." (the name of the theme in use).

Every app calls `connect` at least once, even an app that reads and writes nothing. An app that does not complete the handshake within 10 seconds shows "The app did not answer in time." with a Reload the app button.

## 4. The manifest

`app.yml` is one map of keys. Only the nine keys below are read. Any other key refuses the app (`key_unknown`), so a key meant for a later version never leaves you approving something other than what runs.

| Key | Required | Type | Default | Limits | Finding raised |
|-----|----------|------|---------|--------|----------------|
| `name` | yes | text | none | matches `^[a-z][a-z0-9-]{0,39}$` and equals the folder's name | `name_empty` (absent or empty), `name_shape`, `name_not_folder` |
| `title` | yes | text | none | 1 to 40 characters after trimming, no control character | `key_missing` (absent), `title_shape` |
| `description` | no | text | empty | 200 characters at most | `description_shape` |
| `glyph` | no | a name from `config/catalogs/glyphs.yml`, other than `app` | `app_view` | an absent, unknown or reserved name draws the default | `glyph_unknown`, and the app is offered |
| `bridge` | yes | the number `1` | none | no other version | `key_missing` (absent), `bridge_unknown` |
| `entry` | no | relative path | `index.html` | segments neither empty nor dot-led, no backslash or NUL, ends in `.html`, names a file of the app | `entry_shape`, `entry_missing` |
| `reads` | no | list of channel names | empty | each name once, from the lists in part 6 | `list_shape`, `list_repeated`, `channel_unknown`, `channel_closed` |
| `writes` | no | list of write kinds | empty | each kind once, from the list in part 6 | `list_shape`, `list_repeated`, `write_unknown`, `write_closed` |
| `connects` | no | list of origins | empty | `https://host` or `https://host:port`, no user name, path, query or wildcard, each origin once | `list_shape`, `list_repeated`, `connect_shape` |

Notes on the table:

- A finding other than `glyph_unknown` means the folder is not an app: it is not offered, registered or served. The Findings view on the System page shows each finding with the file, the key `apps[<name>]` (`apps[<root>/<name>]` for a root app) and a sentence. The sentences are quoted in part 7.
- `connects` lists the outside origins the app may fetch from. `http:` is accepted only for `localhost` and `127.0.0.1` on a port other than oculus's own. A trailing slash is dropped (`https://api.example.org/` is stored as `https://api.example.org`). A `wss:` origin is refused with `connect_shape`. An origin admits requests of its own scheme only.
- A root app may not list `inbox`, `calendar`, `sessions` or `usage` in `reads`. No app may list `apps`, `processes` or a `pty:` channel. Each gives `channel_closed`, with a sentence that names the channel and says what it carries.
- A kind in the closed set of writes, and `app-store`, give `write_closed`. A name in neither set gives `channel_unknown` or `write_unknown`.
- An `app.yml` that does not parse gives the finding `does not parse: <reason>`. One that is not a map gives `is not a map of keys`. Either way the folder is not an app.
- `description` is shown on the approval panel. Every word from the manifest is drawn as text, never as HTML, so a title that holds markup shows the markup.

Four findings are about a folder as a whole:

- `folder_outside`: a root's `.oculus/apps` is a link that resolves outside the root, so none of its apps is offered.
- `repeated`: an apps folder or app folder has a real path that an earlier one already holds. It belongs to the first, and the later one is left out.
- `apps_dir_not_folder`: `apps_dir` names a file, so there are no machine apps.
- `closed_paths_shape`: the `closed_paths` setting is missing or not a list (part 8).

## 5. Approval and change

An app runs only after you approve it. The panel in the app's tab says in plain sentences what the app reads and writes. It names the outside addresses the app reaches and where it keeps its own data. It also gives the folder and size of the app. It offers three controls.

| Control | Effect |
|---------|--------|
| Approve | Approves exactly the files you were shown. If a file changed while you read the panel the approval is refused with "The app changed while you read it, so it was not approved. Read what it asks for now." |
| Keep approved while I edit | Machine apps only. Approves the same way and keeps the app approved while you edit it, until the oculus server process ends. |
| Open the app's folder | Shows the folder in the Files view so you can read the files. When no root of the Files view holds the folder, nothing is shown and oculus posts the notice `The folder of this app, <folder>, is inside no root the file browser shows.` |

Once approved, the pane's toolbar shows Revoke, which takes the approval back and returns the tab to the panel.

What changes the approval:

- Any change to any file of the app changes the hash, so the approval does not hold. The tab shows the panel again with the sentence "This app changed since you approved it. Read what it asks for again and approve it to run it." The tab's saved state is kept. A root app changed by a `git pull` asks again in the same way.
- A machine app kept approved is the exception. A change to any file except `app.yml` leaves it approved. The address key changes with the files, so the frame reloads, and no question is asked. A change to `app.yml` ends the keeping and the panel asks again, because the manifest is what names what you approved.
- Keeping is held in the server's memory. It ends with Revoke, with a change to `app.yml` and with the server process.
- After a restart the app is approved only by the entry the button wrote to the approvals file. It runs while its files are as they were at that press and asks at the first change. The file is `~/.oculus/approvals.json` unless the `approvals` key of `config/local.yml` names another.
- A root app cannot be kept: the button is not offered for one.
- The approval is keyed by content and folder, so two copies of an app are approved separately and revoking one leaves the other.

A tab shows a lock mark while its app is not approved ("This app is not approved"). It shows an edit mark while the app is kept approved ("This app stays approved while its files change").

If the folder is removed, the tab shows `Unknown view: app:<name>` and keeps its state, and draws the app again when the folder comes back. The same holds for a root app whose root leaves the Files view.

## 6. The bridge

### Connecting

```js
import { connect } from '/apps/-/oculus.js';

const oculus = await connect({ onChannel, onTheme, onStore });
```

`connect(handlers)` resolves with the nine methods once the handshake completes. All three handlers are optional. Before it resolves, `connect` paints the theme on the document (below). From then on it forwards key chords and presses on outside links to oculus.

### The three handlers

| Handler | Called with | When |
|---------|-------------|------|
| `onChannel(channel, version, payload)` | the channel's name, its version number and its payload | each time oculus receives a new message of a channel the app declares in `reads`, at most one call in flight per channel, a newer payload replacing a queued one |
| `onTheme(theme)` | `{ name, tokens, wall }` | one frame after the theme, the wallpaper, the CRT overlay or the text size changes, and each time oculus draws the app's view again |
| `onStore(value)` | the parsed store | when the app's store file changes, whoever changed it, in every tab of the app, the tab that wrote included |

`onChannel` is not called for the payload oculus already holds when the app connects: call `read(channel)` for the first value. `onTheme` is not called at connect either; call `getTheme()`. `connect` itself has already painted that theme on the document.

### The nine methods

| Method | Resolves with | Refusals (rejects with a plain string) |
|--------|---------------|----------------------------------------|
| `read(channel)` | `{ version, payload }`, or `null` when oculus holds no message of that channel yet | `not_declared` (channel not in `reads`), `missing` (no row for the app) |
| `getTheme()` | `{ name, tokens, wall }` | none |
| `getState()` | a copy of the tab's saved value, `null` when none | none |
| `setState(value)` | nothing | `not_json`, `too_large` |
| `getStore()` | the store's value, `null` when the file is absent, does not parse or is over the size limit | `missing`, `failed:<status>` |
| `setStore(value)` | nothing | `not_json`, `too_large`, `rate`, `refused:<reason>`, `failed:<status>` |
| `write(kind, body)` | nothing | `not_declared`, `rate`, `declined`, `refused:<reason>`, `failed:<status>`, `missing` |
| `open(target)` | nothing, once the tab is open | `rate`, `missing`, `closed`, `declined`, `failed:0` |
| `key(init)` | nothing | none |

Every refusal is a plain string, never an `Error` object, so a refusal carries no stack from oculus. Part 7 gives the cause of each word. Notes:

- `read`: the channel names are in the next table. The value is a copy of the newest message oculus holds; for a root app it is the root's own part of `git` and `files`.
- `setState` and `setStore` take a value that is plain JSON: text, a finite number, a boolean, `null`, or a list or map of plain JSON. `undefined` (also as a map value), `NaN`, an infinite number, a `Date`, a `Map`, a `Set` and a cycle give `not_json`. The browser copies a value between frames by structured clone. A class instance becomes a map of its own fields, so it passes as that map. Size is the JSON text in bytes against the limit of part 8.
- A value the browser cannot copy between frames, such as a function, fails in the frame's bridge before oculus sees it. The call rejects with a `PenpalError` object whose `code` is `TRANSMISSION_FAILED` and whose message says the value could not be cloned. It is not one of the refusal words.
- `getState` answers a copy of the value `setState` saved, a list or a map included, and `null` when none was saved. The value is kept in the saved layout.
- `key` is called by `oculus.js` for you. It never rejects: a call over the rate limit or while the app's frame does not hold the keyboard focus is dropped silently.
- A call whose tab closes or reloads before oculus answers never settles.
- oculus also shows a notice, once per name and mount, in two cases. One is an app asking to read, write or open something it may not. The other is an app sending calls faster than the limits allow.

### Channels

An app reads a channel by listing it in `reads` and calling `read`. A root app cannot declare the four channels marked machine only.

The payload tables use these words:

- `text` is a string and `number` is a number.
- `list of X` is a list whose items are `X`.
- `map of X` is a map from text to `X`.
- A name ending in `?` may be absent.

Every payload is plain JSON. Times and durations are text as their source gives them.

| Channel | Who | What it carries |
|---------|-----|-----------------|
| `portfolio` | every app | the hub's projects, venues, datasets, pillars, domains, funding, people, organisations, resources, collections, side projects, feeds summary and career |
| `feeds` | every app | the Lit Watch radar, the position leads and the LinkedIn posts, each with its entries |
| `hpc` | every app | the cluster queue, recent jobs, partitions and quota |
| `audit` | every app | what the hub's audit found and the signatures parked |
| `config` | every app | the merged configuration, the text catalog, the icons and this machine's name and address |
| `git` | every app | the state of each repository |
| `files` | every app | a notice that a file under a root or the bookmarks changed, with no file content |
| `inbox` | machine only | mail threads: sender, reply address, subject, time and a preview |
| `calendar` | machine only | calendar events |
| `sessions` | machine only | Claude and Codex session records with prompts and paths, and oculus's terminals |
| `usage` | machine only | token usage and plan windows of each account |

No app can read these channels:

- `apps` carries the address key of every approved app.
- `processes` is the machine's process table.
- `pty:<id>` carries whatever a terminal printed, secrets included.

A channel added to oculus is closed to apps until it is named here.

`read(channel)` resolves with `{ version, payload }`. `onChannel(channel, version, payload)` gets the same two values. A root app gets, for `git` and `files`, only its root's part.

#### `portfolio`

The payload is `{ version: number, entities, relations, findings: list of Finding }`. A `Finding` is `{ file: text, key: text, message: text }`. `file` is an absolute path, and `key` is empty when the finding is about the whole file.

`entities` holds one map per kind, each keyed by the record's `id`:

| Key | Value | Record fields |
|-----|-------|---------------|
| `projects` | map of Project | the fields in the table below |
| `venues` | map of Venue | `id`, `name`, `themes` (list of text), and text `short?`, `tier?`, `category?`, `jif?`, `quartile?`, `wos?`, `scopus?`, `free?`, `format?`, `wants?`, `link?`, `deadline?`, `deadlineMonth?`, `heldMonth?`, `timing?`, `call?`, `email?`; `wosMark?` and `scopusMark?` are `yes` or `no` |
| `datasets` | map of Dataset | `id`, `name`, `themes` (list of text), `projectIds` (list of ids), and text `modality?`, `description?`, `size?`, `access?`, `source?`, `hpcPath?`; `retrieval?` is a map |
| `pillars` | map of Pillar | `id`, `title`, `fundingIds`, `projectIds`, and text `color?`, `kind?`, `goal?`, `blurb?` |
| `domains` | map of Domain | `id`, `title`, `projectIds`, `blurb?` |
| `funding` | map of Funding | `id`, `title`, `followups`, `subtasks` (as in a project), `tags` (list of text), `projectIds`, `pillarIds`, and text `sub?`, `status?`, `date?`, `deadline?`, `note?`, `statement?`, `funder?` (an organisation id), `link?`, `url?`, `snooze?` |
| `people` | map of Person | `id`, `name`, `affiliations` (organisation ids), `links` (list of text), `projectIds`, `jointWorkIds`, and text `role?`, `orcid?`, `email?`, `folder?`; `self?` is a boolean |
| `organisations` | map of Organisation | `id`, `name`, `links`, `personIds`, `fundingIds`, and text `kind?`, `country?` |
| `resources` | map of Resource | `id`, `name`, `kind` (`cluster`, `machine` or `storage`), `links`, `order` (number), and text `host?`, `access?` |
| `collections` | map of Collection | `id`, `title`, `file` (absolute path), `entries` (list of Entry), `intro?`, `schema?` (list of `{ field, type, label?, options?, from?, required?, help?, when?, open?, map?, fields? }`; `field` and `type` are text, `options` a list of text, `from` a list of source names or a map `{ field, sources }`, `required` a boolean or `{ when }`, `when` a map of field to a value or a list of values, `open` a boolean, `map` a boolean that says a `records` field holds a map from a name to one record, `fields` a list of the same shape) |
| `personal` | map of SideProject | `id`, `title`, `status`, `eli5`, `next` (text), `links` (list of text), `source`, `file` |
| `feeds` | map | `leads` (list of `{ title, deadline: text or null, status, fit: text or null }`, or null), `radar` (`{ lastRun: text or null }` or null), `scout` (the same shape) and `linkedin` (`{ lastPost: text or null }` or null) |
| `career` | map or null | the career strategy of `registries/career.yml` |

A Project holds:

| Fields | Type |
|--------|------|
| `id`, `title`, `folder`, `file` | text; `folder` and `file` are absolute paths |
| `tier` | `ideas`, `active`, `manuscripts`, `software`, `coauthor`, `archive` or `side-projects` |
| `ghost` | boolean |
| `category?`, `type?`, `short?`, `lead?`, `statusLine?`, `focus?`, `priority?`, `eli5?`, `next?`, `latest?`, `deadline?`, `snooze?`, `doi?`, `outcome?`, `venue?` | text |
| `authors?` | text or list of text |
| `year?`, `staleDays?` | number |
| `pin?` | boolean |
| `chips`, `results`, `ideas` | list of text |
| `waitingOn`, `resourceIds`, `relatedIds`, `fundingIds`, `datasetIds`, `pillarIds`, `domainIds`, `collaborators` | list of ids |
| `venueId?` | id |
| `followups` | list of `{ do: text, after?: text }` |
| `subtasks` | list of `{ key: text, do: text, deadline?: text, done: boolean, snooze?: text }` |
| `codeAvailability?` | `{ status?, date?, url?, doi?, repo? }`, all text |
| `reproduced?` | `{ date?, note? }`, text |
| `docs` | list of `{ name, label, present: boolean, human: boolean, mtime?: number }` |
| `deck?` | text, the hub folder of the project's `present/` deck, present when `present/present.yml` exists |

An Entry of a collection is `{ id: text, title: text, fields: map, file: text, index: number }`. `fields` holds every key the entry has in the file, `title` and `key` included. `id` is the entry's `key` when it has one and its `title` otherwise. A collection's `schema` lists the fields in the order the file draws them. The example of part 10 reads the first one to learn what names an entry.

`relations` holds lists of `[id, id]` pairs named `projectVenue`, `projectFunding`, `projectDataset`, `projectPillar`, `projectDomain`, `projectRelated`, `fundingPillar`, `projectPerson`, `jointWorkPerson`, `personOrganisation` and `fundingOrganisation`.

#### `feeds`

The payload is a map with the keys `radar`, `leads` and `linkedin`. Each value is `{ ok: true, kind, file, meta: map, entries: list of map, cadenceDays?, schema?: list of schema fields, missing?, error? }`. `kind`, `file` and `error` are text, `cadenceDays` is a number and `missing` is a boolean. `cadenceDays` is present on `linkedin`, the configured days between posts. `missing` is true when the feed's file is not on this machine, and `error` holds the reason when it cannot be read.

#### `hpc`

| Field | Type |
|-------|------|
| `status` | `starting`, `ok`, `unreachable` or `error` |
| `hint?` | text |
| `jobs` | list of `{ id, name, partition, state, time, limit, nodes, cpus, gpus, mem, priority, start, reason }`, all text |
| `running`, `pending`, `total` | number |
| `recent` | list of `{ id, name, state, exit, elapsed, end, memUsed, memReq }` (text) with `memPct` and `cpuPct` (number or null) |
| `sinfo` | list of `{ partition, avail, state, gres }` (text) and `nodes` (number) |
| `quota` | list of `{ name, used, limit }` (text) and `pct` (number) |
| `updated`, `lastOk?`, `host` | text |
| `pollMin`, `retryMin?` | number |

#### `audit`

`{ findings: list of { scope, where, kind, message, signature }, muted: list of text }`. All five fields of a finding are text. `kind` is `todo`, `data`, `conform`, `manifest`, `readability` or `publink`, and `signature` is twelve hex characters.

#### `config`

`{ config: map, text: map of text, icons: map of text, host: { name: text, address: text }, findings: list of Finding }`. `config` is the merged configuration as the Settings view reads it. `text` is the flat catalog of the words oculus draws, and `icons` the drawing of each glyph. `host` is this machine's name and the address oculus listens at.

#### `git`

A map from a repository's folder to its state. Every state is:

| Field | Type |
|-------|------|
| `branch` | text |
| `ahead`, `behind` | number |
| `upstream?` | boolean or null |
| `detached`, `ignoresWorktrees`, `present`, `repository` | boolean |
| `staged`, `unstaged`, `untracked`, `conflicted` | list of `{ path: text, status: text, added: number or null, deleted: number or null, from?: text }` |
| `held` | `{ staged, changes, untracked, merge }`, all number |
| `sequence` | `merging`, `rebasing`, `cherry-picking` or the empty text |
| `mergeMessage` | text |
| `remotes` | list of text |
| `stashes` | list of `{ ref, hash, message, when }`, all text |
| `tags` | list of `{ name: text, commit: text, annotated: boolean, subject: text }` |
| `log` | list of `{ hash, short, subject, when }`, all text |
| `branches` | list of `{ name: text, upstream: text, current: boolean }` |
| `worktrees` | list of `{ path: text, branch: text, head: text, main: boolean }` |
| `error` | text or null |

#### `files`

`{ root: text, folders?: list of text, bookmarks?: boolean, workspaces?: boolean }`. `root` is the folder of the root that changed. `folders` names the folders of that root the writes landed in, each relative to the root and `''` for the root's own top; a notice without it concerns the whole root, and one whose list is empty concerns nothing. A notice with `bookmarks` names no root: it says the reader's bookmarks file changed. A notice with `workspaces` names no root either: it says the roots the file browser serves may have changed. An app of a root receives only the notices whose `root` is its root's folder, and none whose `folders` list is empty; the bookmarks and workspaces notices reach machine apps only.

#### `inbox`

| Field | Type |
|-------|------|
| `status` | `ok`, `error` or `unconfigured` |
| `accounts` | list of `{ provider: google or microsoft, label: text, status: connected, not-connected or error, hint?: text, needsSetup?: boolean, ownHalf?: boolean, lastOk?: text }` |
| `threads` | list of `{ id, account, provider, sender, replyTo, subject, received, snippet: text, messages: number, url?: text, triage }` |
| `updated` | text |
| `pollMin`, `retryMin` | number |
| `notesRun` | text or null |
| `notesError?` | text |

`snippet` is the provider's preview of the message text, so a machine app that reads `inbox` receives part of every message's content. `triage` is `{ kind?: reply, action or info, what?: text, draft?: text, triaged: boolean }`.

#### `calendar`

| Field | Type |
|-------|------|
| `status` | `ok`, `error` or `unconfigured` |
| `accounts` | list of `{ provider: google, microsoft or ics, label, status, hint?, needsSetup?, ownHalf?, lastOk?, calendars: list of { id: text, name: text } }` |
| `events` | list of `{ id, account, calendar, title, start, end: text, allDay: boolean, location?: text, link?: text, status?: confirmed, tentative or cancelled }` |
| `updated` | text |
| `pollMin`, `retryMin`, `daysBack`, `daysAhead` | number |

An event holds no attendee list.

#### `sessions`

`{ records: list of SessionRecord, workspaces: list of Workspace, terminals?: list of Terminal }`.

A SessionRecord holds:

| Field | Type |
|-------|------|
| `id`, `path`, `slug`, `title`, `lastPrompt`, `state` | text |
| `tool` | `claude` or `codex` |
| `cwd`, `branch`, `model`, `effort`, `permissionMode`, `version`, `entrypoint`, `started`, `lastActivity`, `liveStatus`, `registryName` | text or null |
| `live`, `hidden`, `truncated` | boolean |
| `pid`, `contextWindow` | number or null |
| `prompts`, `messages`, `contextTokens`, `lastCacheRead` | number |
| `tokens` | `{ input, output, cacheRead, cacheCreation, thinking }`, all number |
| `cache` | `{ ttl: text or null, lastCreation: text or null, lastRead: text or null, busts: number }` |
| `tools` | map of number, the count of calls by tool name |
| `files` | list of `{ path: text, tool: text, count: number, last: text or null }` |
| `agents` | list of `{ id, description, subagentType, status }` (text), with `model`, `started` and `ended` (text or null) and `resultChars` (number) |
| `timeline` | list of `{ ts: text or null, kind: text, text: text }` |
| `hook` | `{ session, event, at, kind?, message?, title?, cwd? }` (text) or null |

`lastPrompt` and the `text` of the `timeline` carry the words of the session.

A Workspace holds `key` and `name` (text), `lastActivity` (text or null) and `areas`.

An area holds `key`, `short` and `full` (text), `known` (boolean), `lastActivity` (text or null) and `sessions`. Its sessions are SessionRecords that also hold `workspace`, `area` and `kind` (text), `secondaryAreas` (list of `{ key, short }`) and `pinned` (boolean).

A Terminal holds:

| Field | Type |
|-------|------|
| `id`, `name`, `title`, `icon`, `color`, `cwd`, `command`, `created` | text |
| `kind` | `claude`, `codex` or `shell` |
| `pid` | number |
| `attached`, `task`, `foreign?` | boolean |
| `exit` | number or null |
| `resumes` | `{ tool: claude or codex, id: text }` or null |
| `job` | `{ repo: text, name: text, source?: text, token?: text, chain?: list of { name, cwd } }` or null |

#### `usage`

`{ accounts: list of UsageAccount, days: list of UsageDay, builtAt: text }`.

A UsageAccount holds:

| Field | Type |
|-------|------|
| `tool` | `claude` or `codex` |
| `label`, `dir`, `email`, `organisation`, `tier`, `tierLabel`, `billing`, `fetchedAt?` | text |
| `windows` | list of `{ name, observedAt, usedPercent, resetsAt, windowMinutes, model?, severity?, active? }`; `name` is `five_hour`, `seven_day`, `weekly_model`, `primary` or `secondary`, the three numbers are number, `severity` is `normal`, `warning` or `critical`, `active` is boolean |
| `live` | list of `{ sessionId, model, updatedAt, cwd, contextPercent, costUsd }`; the last two are number or null, the others text |
| `refresher?` | `{ state, since, reason, lastRefresh, renewed }`; `state` is `running`, `refreshing` or `down`, `renewed` is boolean, the others text |

A UsageDay holds `tool` (`claude` or `codex`), `account`, `day` and `model` (text), and `input`, `output`, `cacheRead` and `cacheCreation` (number).

### Writes

`write(kind, body)` asks oculus to change the hub's data. The kind must be in the app's `writes` list. The body is a map whose own `kind` field equals the kind you name. oculus sends it to its write route with the app's id. The route refuses with `refused:kind` unless the body matches the kind named and that kind is open to apps. A body that carries the collection key `bookmarks` is refused the same way, so no app edits your bookmarks.

| Kind | Body | Asks you first |
|------|------|----------------|
| `manifest` | `{ kind, id, fields }`: edit the fields of the project `id` | no |
| `entry` | `{ kind, collection, id, fields }`: edit the fields of one entry | no |
| `subtask` | `{ kind, target: { id, collection? }, key, action, value? }`, `action` one of `done`, `reopen`, `snooze`, `delete` | no |
| `subtask-add` | `{ kind, target: { id, collection? }, fields }`, `fields.do` the text of the subtask | no |
| `host` | `{ kind, name, status }`: set the status of a career host | no |
| `new-entry` | `{ kind, collection, fields }`: add an entry; `fields` must hold the collection's identity field | no |
| `reorder` | `{ kind, collection, order }`, `order` the list of entry ids in the new order | no |
| `delete-entry` | `{ kind, collection, id }` | yes |
| `feed-field` | `{ kind, feed, id, field, value }`, `feed` one of `radar`, `leads`, `linkedin`, `value` text, number, boolean or `null` | no |
| `feed-delete` | `{ kind, feed, id }` | yes |
| `lead-add` | `{ kind, fields }`: add a lead; `fields.title` is required | no |
| `radar-add` | `{ kind, fields }`: add a paper to Lit Watch; `fields.title` is required | no |
| `linkedin-idea` | `{ kind, title, category? }` | yes, and no undo |
| `linkedin-post` | `{ kind, file }`: `file` names an `xx-*.md` idea | yes, and no undo |
| `new-idea` | `{ kind, fields }`, `fields.id` the idea's id | yes, and no undo |

The five kinds that ask you first show a confirmation in one sentence, `The app <title> asks to <kind in words>: <body>`. An example is `The app Task demo asks to delete an entry of a collection: {"kind":"delete-entry","collection":"tasks","id":"Task demo 1"}`. The words for the five kinds are `delete an entry of a collection`, `delete a feed item`, `create an idea project`, `move a LinkedIn idea` and `move a LinkedIn post`. The body is shown as JSON text, cut at 300 characters. The keyboard is on Cancel, so a key meant for the app never confirms it. Cancel rejects with `declined`. `new-idea`, `linkedin-idea` and `linkedin-post` are recorded with no way back; every other write can be undone in History.

Every write is recorded in the change log with the app's id. The History view on the System page lists it with the kind in words (`entry added`, `entry removed`, `app store`). Each row shows the two values and an Undo button. An app cannot ask for `undo`, `rail`, `roots`, `audit-mute`, `config-key`, `config-value`, `session`, `deck-slides`, `deck-edit` or `app-store`. It cannot ask for any write route that runs processes, writes arbitrary files, reaches a remote or acts on an account. Listing one of those in `writes` refuses the app with `write_closed`.

### State and store

| | State | Store |
|---|-------|-------|
| Methods | `getState`, `setState` | `getStore`, `setStore` |
| Kept | in the saved layout, per tab | in one file per app |
| Shared | no: two tabs of an app hold separate values, and a moved tab keeps its value | yes: every tab in every window |
| Limit | `apps.state_max_kb`, 64 KB | `apps.store_max_kb`, 256 KB |
| Change notice | none | `onStore` in every tab |
| Counts as a write | no | yes, against `apps.writes_per_min` |
| In History | no | yes, as `app store`, with sizes in bytes, and undoable |

A store write of a value equal to the one in the file writes nothing and records nothing. `setStore` rejects `refused:<reason>` when the file cannot be written. Nothing else persists: an opaque origin has no cookies, `localStorage` or IndexedDB.

### Open

`open(target)` opens a tab in oculus and needs no manifest entry. The target is a map with exactly one of these four keys:

| Target | Opens | Rejects |
|--------|-------|---------|
| `{ view: '<id>' }` | a view the Views catalogue lists, with no state; `terminal` is listed, so it opens a Terminal tab | `closed` for a view that is opened only for something (`project`, `editor`, `document`, `file`, `source` and the like), `missing` for an id no view holds |
| `{ project: '<key>' }` | the project's tab | `missing` when the portfolio holds no project with that key |
| `{ file: { root, path } }` | the file as source text in the source tab; no program is started | `closed` and `missing`, ordered as below |
| `{ url: '<address>' }` | the address in a new browser tab, after you confirm | `closed` for an address that is not `http:` or `https:`, is longer than 2048 characters or holds a user name or password; `declined` on Cancel |

Any other target, and a target of two keys, rejects `closed`. A `{ file }` target is checked in this order:

1. The target holds exactly `root` and `path`, both text, else `closed`.
2. A path with an empty, `.`, `..` or dot-led segment, or with a backslash or NUL, is `closed`. So are `.env`, `.ssh/key`, `a//b` and `/etc/hosts`.
3. A path that starts with a folder of `closed_paths` (`secrets` as shipped, compared by segment and without regard to letter case) is `closed`.
4. The root `engine` is `closed`. A root app naming any root but its own is `closed`.
5. A root that the Files view does not show is `missing`.
6. oculus then checks the real path on the server. A real path outside the root, inside oculus's own `config/` folder, or failing rules 2 and 3 on the part under the root is `closed`. A file that does not exist is `missing`. If that check gets no answer, the call rejects `failed:0`.

The address in `{ url }` is shown whole in the question `The app <title> asks to open this address in a new browser tab. The address can carry what the app has read.` with the keyboard on Cancel. Confirm opens it with no link back to oculus. oculus makes this call for you when you press a link in the app that leads outside the app's own address. The frame does not navigate, and a `mailto:` or `ftp:` link is refused `closed`.

`open` counts toward `apps.opens_per_min` before it is judged. A confirmation question is drawn inside the app's own tab. oculus selects that tab in its pane when it asks. You therefore see the question even when a view opened by `open` has taken the selection. Questions of one tab are asked one at a time, and the call waits for the answer.

### Theme and keys

`getTheme()` and `onTheme` carry `{ name, tokens, wall }`. `name` is the theme's class on the body. `tokens` holds every custom property that oculus's `tokens.css` declares. `wall` says whether the wallpaper is on. `connect` writes the tokens on the document's root element and toggles a `wall` class there. Your CSS can then use them as variables, such as `var(--bg)`, `var(--ink)`, `var(--muted)` and `var(--c-red)` in the example of part 10. It also puts `color-scheme: light dark` ahead of your own style sheet, so controls follow the theme. An app that sets its own `color-scheme` keeps it. With the wallpaper on, the frame paints nothing, and a document you leave transparent shows the picture.

`connect` forwards a `keydown` to oculus as `key({ key, code, altKey, ctrlKey, metaKey, shiftKey })`. It does so when the key holds Control, Meta or Alt, or is Escape. oculus's chords then work while the frame holds the keyboard. oculus takes at most 20 per second.

## 7. Refusal words

A call's rejection is one of these strings.

| Word | Raised by | Cause | What to change |
|------|-----------|-------|----------------|
| `not_declared` | `read`, `write` | the channel is not in `reads`, or the kind is not in `writes` or is closed to apps | add it to the manifest, or use another route |
| `closed` | `open` | the target is not allowed (part 6) | change the target |
| `too_large` | `setState`, `setStore` | the JSON is over `apps.state_max_kb` or `apps.store_max_kb` | keep less, or raise the setting |
| `not_json` | `setState`, `setStore` | the value is not plain JSON | pass text, numbers, booleans, `null`, lists and maps |
| `rate` | `write`, `setStore`, `open` | more than `apps.writes_per_min` or `apps.opens_per_min` calls in a minute from one frame | slow down |
| `declined` | `write`, `open` | you pressed Cancel on the question | none |
| `missing` | `read`, `getStore`, `write`, `open` | oculus holds no row for the app; a view id nothing registers; a project not in the portfolio; a root or file that is not there | check the name |
| `refused:<reason>` | `write`, `setStore` | the write route refused with a 4xx status and a sentence, or answered 200 and refused the first field it could not write; `<reason>` is that sentence | read the reason |
| `failed:<status>` | `write`, `setStore`, `getStore`, `open` | the route answered a status of 500 or more, or a 4xx with no error text, and `0` is no answer | retry |

A reason is a sentence the route or a writer gives, so the set is open. These are the ones the routes' own checks give, and the field reasons the example of part 10 can meet.

| Reason | Cause |
|--------|-------|
| `kind` | the body's `kind` is not the kind named, the kind is closed to apps, the collection is `bookmarks`, or the body is not a map |
| `the body is not a write this route knows` | the body matches no write |
| `no project with the id <id>` | `manifest`, or a `subtask` or `subtask-add` target, names a project that is not in the hub |
| `no entry <id> in <collection>` | an entry, subtask, `feed-field` or `feed-delete` target names an entry that is not there (a feed takes the place of `<collection>`) |
| `no collection <name>` | `new-entry` or `reorder` names a collection the hub does not have |
| `unknown feed <name>` | `feed-field` or `feed-delete` names a feed other than `radar`, `leads` or `linkedin` |
| `no host named <name>` | `host` names a career host that is not in the career file |
| `the leads feed is not on this hub` | `lead-add` and no leads feed file |
| `Lit Watch has no file on this hub` | `radar-add` and no radar file |
| `the LinkedIn folder is not on this hub` | `linkedin-idea` and no LinkedIn folder |
| `the LinkedIn idea file is not on this hub` | `linkedin-post` names a file that is not there |
| `a new entry needs a <identity field>` | `new-entry` has no value for the field that names an entry |
| `an entry with that <identity field> is already in the file` | `new-entry` repeats an identity |
| `the identity field is what the entry is found by` | `entry` sets the identity field to `null` or to a list |
| `nothing to write` | `new-entry` has no field it can write |
| `unwritable` | `setStore`: the store file's folder cannot be written |
| `outside` | `setStore`: the store file's folder is not inside the app data folder of a machine app or the root of a root app |
| `too_large` | `setStore`: the value is over `apps.store_max_kb` as the server measures it (the page checks first and rejects the bare word `too_large`) |
| `readback` | `setStore`: the file read back differs from the value, so the file is put back as it was |

Other field reasons are the writer's own sentences. Examples are:

- `the entry is not in the file`
- `not a string, number, boolean, list of strings, metalist, map of scalars, lists and maps, or null`
- `an id is lower case letters, digits and hyphens`
- `the edit did not verify; nothing was written`

Read the sentence: it names what to change.

The sentences of the findings the manifest reader raises, with the key `apps[<name>]`:

| Finding | Sentence |
|---------|----------|
| `name_empty` | the name is missing or empty, so the folder is not an app |
| `name_shape` | the name `<x>` must start with a lowercase letter and hold only lowercase letters, digits and hyphens, 40 characters at most, so the folder is not an app |
| `name_not_folder` | the name `<x>` is not the folder name `<y>`, so the folder is not an app |
| `key_missing` | the key `<x>` is missing, so the folder is not an app |
| `key_unknown` | the key `<x>` is not one this oculus reads, so the folder is not an app |
| `title_shape` | the title must be 1 to 40 characters with no control character, so the folder is not an app |
| `description_shape` | the description must be text of 200 characters at most, so the folder is not an app |
| `bridge_unknown` | bridge `<x>` is not a version this oculus reads, which is 1, so the folder is not an app |
| `entry_shape` | the entry `<x>` must be a relative path of names that do not start with a dot, ending in .html, so the folder is not an app |
| `entry_missing` | the entry `<x>` is not a file of the app, so the folder is not an app |
| `list_repeated` | `<list>` names `<x>` twice, so the folder is not an app |
| `list_shape` | `<list>` must be a list of names, so the folder is not an app |
| `file_unreadable` | the file `<x>` cannot be read, so the folder is not an app |
| `channel_unknown` | reads names `<x>`, which is no channel an app can read, so the folder is not an app |
| `channel_closed` | reads names `<x>`, which is closed to `<every app or a root app>`: it carries `<what>`, so the folder is not an app |
| `write_unknown` | writes names `<x>`, which is no write an app can ask for, so the folder is not an app |
| `write_closed` | writes names `<x>`, which is closed to every app, so the folder is not an app |
| `connect_shape` | connects names `<x>`, which is not an https origin, or an http origin of localhost or 127.0.0.1 on a port other than oculus's own, with no user name, path, query or wildcard, so the folder is not an app |
| `too_large` | the folder holds more than `<files>` files or `<MB>` MB, so the folder is not an app |
| `glyph_unknown` | the glyph `<x>` is no glyph an app can use, so the app is drawn with the default glyph |

## 8. Limits

Nine keys of the `apps:` block of `config/behavior.yml` set the limits. Each is a setting you can change on the System page's Settings tab under Apps. A number must be a whole number of at least 1, and a missing or wrong value takes its default.

| Key | Default | What it limits | Past the limit |
|-----|---------|----------------|----------------|
| `connect_timeout_s` | 10 | seconds a frame is given to complete the handshake (at most 2147483) | the tab shows "The app did not answer in time." with Reload the app |
| `state_max_kb` | 64 | kilobytes of one tab's state that `setState` accepts | `too_large` |
| `store_max_kb` | 256 | kilobytes of the store that `setStore` accepts and `getStore` reads | `too_large`; `getStore` answers `null` for a larger file |
| `writes_per_min` | 30 | writes, `setStore` included, per frame in a sliding minute | `rate` |
| `opens_per_min` | 30 | calls of `open` per frame in a sliding minute | `rate` |
| `keys_per_s` | 20 | key events per second oculus takes from a frame | the extra events are dropped |
| `max_files` | 500 | files in an app folder, `app.yml` counted | the finding `too_large` |
| `max_mb` | 20 | megabytes in an app folder | the finding `too_large` |
| `closed_paths` | `[secrets]` | folders, relative to a root and applied to every root, that `open({ file })` never reaches | `closed` |

A kilobyte here is 1024 bytes. A reload of the frame starts the per-frame counts again. `closed_paths` takes a list of folder paths with no empty, dot or dot-led segment. An entry that is not valid is left out, and a duplicate counts once. A value that is missing or not a list closes every file for every app and raises the finding `closed_paths_shape`, which names `config/behavior.yml` and `apps.closed_paths`.

## 9. What an app cannot do

- Run a process or server code. oculus runs nothing an app holds, and `open` starts no program.
- Read a file outside its folder. The frame reaches only the recorded files of its own folder by address, and the store only through `getStore` and `setStore`. `open({ file })` shows a file as source text in oculus and gives the app no content.
- Read another app's files or store, or any `/api/` route, the write token, the socket or oculus's own page. The frame's origin is opaque, so oculus refuses its requests, and the address key of an app is held by nobody else.
- Use cookies, `localStorage`, `sessionStorage` or IndexedDB.
- Open a popup, submit a form, show a modal dialog, lock the pointer or navigate the frame. A link that leaves the app goes through `open({ url })` and your confirmation.
- Run an inline script. The frame's policy is `script-src` the app's own files and the shared bridge files only. Scripts must be files loaded with `<script type="module" src>`.
- Load anything from an address outside the app's own folder, except `data:` images and the shared bridge files. Scripts, styles, images, fonts and media come from the app's own folder only. The origins in `connects` are allowed for `fetch` and other connection requests and for nothing else. An `<img src>` or `<script src>` on one of them is blocked. Styles may be inline (`style-src` allows `'unsafe-inline'`). `<form>` actions are refused.
- Run a file type oculus does not type. Only `.html`, `.js`, `.mjs`, `.css`, `.json`, `.svg`, `.png`, `.jpg`, `.gif`, `.webp`, `.woff2`, `.txt` and `.wasm` files get a content type. Any other file, a `.ts` file included, is sent as `application/octet-stream` with `nosniff`, so a browser does not run it as a script. Ship `.js`.
- Read `apps`, `processes` or a terminal channel, a root app's `inbox`, `calendar`, `sessions` or `usage`, or write any kind in the closed set (part 6).
- Open `local.yml`, a file under oculus's `config/` folder, a dot-led path or a path under `closed_paths`.
- Edit your bookmarks.

Your approval of the app's files and of the origins it lists in `connects` is the boundary against an app sending what it read to another machine. The approval panel shows those origins. oculus's policy does not stop three things a browser frame can do:

- reach a STUN server by address through WebRTC
- resolve a host name of its choosing through a DNS prefetch link
- make a preconnect to an address

The address an app passes to `open({ url })` is a fourth way to put what it read into an address. The question that shows the whole address is how oculus closes it.

## 10. A worked example

The example is a machine app named `task-demo`. It reads the `tasks` collection of the hub (the shipped `config/sources.yml` lists it as `tasks/tasks.yml`) and keeps notes in its store. It creates one task and deletes it again, opens an address and a view, and shows each refusal. The `tasks` file needs a schema whose first field names an entry. The example reads that field's name from the schema, falls back to `title`, and writes that field, `title` and `status: todo` into the task it creates, since the shipped `tasks` schema requires `key`, `title` and `status`. If the hub has no collection `tasks`, the page says so and the Create button answers `refused:no collection tasks`. Change `COLLECTION` at the top of `app.js` to a collection you have.

Make the folder `~/.oculus/apps/task-demo/` and put the four files in it. Write `app.yml` last.

`index.html`:

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Task demo</title>
    <link rel="stylesheet" href="app.css">
    <script type="module" src="app.js"></script>
</head>
<body>
    <h1>Task demo</h1>
    <p id="status">Connecting to oculus.</p>

    <h2>Channel</h2>
    <p id="channel"></p>

    <h2>Store</h2>
    <p>
        <input id="note" type="text" placeholder="A note">
        <button id="add-note" type="button">Add note</button>
    </p>
    <ul id="notes"></ul>

    <h2>Write</h2>
    <p>
        <button id="create" type="button">Create a task</button>
        <button id="remove" type="button" disabled>Delete that task</button>
    </p>
    <p id="created"></p>

    <h2>Open</h2>
    <p>
        <button id="open-url" type="button">Open example.org</button>
        <button id="open-view" type="button">Open Findings</button>
    </p>

    <h2>Refusals</h2>
    <p>
        <button id="try-read" type="button">Read inbox</button>
        <button id="try-file" type="button">Open the engine's local.yml</button>
        <button id="try-view" type="button">Open a view that is not there</button>
    </p>
    <ul id="refusals"></ul>
</body>
</html>
```

`app.css`:

```css
body {
    margin: 12px 16px;
    background: var(--bg);
    color: var(--ink);
    font: 14px system-ui, sans-serif;
}

h1 {
    font-size: 18px;
}

h2 {
    margin: 16px 0 4px;
    font-size: 13px;
    color: var(--muted);
}

input,
button {
    font: inherit;
}

#refusals li {
    color: var(--c-red);
}
```

`app.js`:

```js
import { connect } from '/apps/-/oculus.js';

const COLLECTION = 'tasks';
const $ = (id) => document.getElementById(id);

let oculus = null;
let identity = 'title';

/** Show one refusal word beside the call that met it. */
function showRefusal(call, word) {
    const item = document.createElement('li');
    item.textContent = `${call}: ${word}`;
    $('refusals').prepend(item);
}

/** Wait for one call. A refusal is a plain string; it is shown and the call counts as failed. */
async function run(call, promise) {
    try {
        return { ok: true, value: await promise };
    } catch (word) {
        showRefusal(call, String(word));
        return { ok: false, value: undefined };
    }
}

function showChannel(payload) {
    const collection = payload.entities.collections[COLLECTION];
    if (collection === undefined) {
        $('channel').textContent = `The hub has no collection ${COLLECTION}.`;
        return;
    }
    identity = collection.schema?.[0]?.field ?? 'title';
    $('channel').textContent = `${collection.entries.length} entries in ${COLLECTION}; an entry is named by its ${identity}.`;
}

function showNotes(value) {
    const notes = Array.isArray(value?.notes) ? value.notes : [];
    $('notes').replaceChildren(
        ...notes.map((text) => {
            const item = document.createElement('li');
            item.textContent = text;
            return item;
        })
    );
}

/** The tab's state is the id of the task this tab created, or the empty string. */
function showCreated(id) {
    $('created').textContent = id === '' ? '' : `Created: ${id}`;
    $('remove').disabled = id === '';
}

$('add-note').addEventListener('click', async () => {
    const text = $('note').value.trim();
    if (text === '') return;
    const stored = await run('getStore', oculus.getStore());
    if (!stored.ok) return;
    const notes = Array.isArray(stored.value?.notes) ? stored.value.notes : [];
    const saved = await run('setStore', oculus.setStore({ notes: [...notes, text] }));
    if (saved.ok) $('note').value = '';
});

$('create').addEventListener('click', async () => {
    const id = `Task demo ${Date.now()}`;
    const body = { kind: 'new-entry', collection: COLLECTION, fields: { [identity]: id, title: id, status: 'todo' } };
    const written = await run('write new-entry', oculus.write('new-entry', body));
    if (!written.ok) return;
    await oculus.setState(id);
    showCreated(id);
});

$('remove').addEventListener('click', async () => {
    const id = await oculus.getState();
    if (typeof id !== 'string' || id === '') return;
    const body = { kind: 'delete-entry', collection: COLLECTION, id };
    const written = await run('write delete-entry', oculus.write('delete-entry', body));
    if (!written.ok) return;
    await oculus.setState('');
    showCreated('');
});

$('open-view').addEventListener('click', () => run('open view', oculus.open({ view: 'findings' })));
$('open-url').addEventListener('click', () =>
    run('open url', oculus.open({ url: 'https://example.org' }))
);
$('try-read').addEventListener('click', () => run('read inbox', oculus.read('inbox')));
$('try-file').addEventListener('click', () =>
    run('open file', oculus.open({ file: { root: 'engine', path: 'local.yml' } }))
);
$('try-view').addEventListener('click', () =>
    run('open view', oculus.open({ view: 'nonesuch' }))
);

oculus = await connect({
    onChannel: (channel, version, payload) => {
        if (channel === 'portfolio') showChannel(payload);
    },
    onTheme: (theme) => {
        $('status').textContent = `Connected. The theme is ${theme.name}.`;
    },
    onStore: showNotes
});

const theme = await oculus.getTheme();
$('status').textContent = `Connected. The theme is ${theme.name}.`;
const portfolio = await run('read portfolio', oculus.read('portfolio'));
if (portfolio.value !== null && portfolio.value !== undefined) showChannel(portfolio.value.payload);
const stored = await run('getStore', oculus.getStore());
showNotes(stored.value);
const state = await oculus.getState();
showCreated(typeof state === 'string' ? state : '');
```

`app.yml`:

```yaml
name: task-demo
title: Task demo
description: Reads the tasks collection, keeps notes, creates and deletes one task, and opens a view and an address.
glyph: page
bridge: 1
entry: index.html
reads: [portfolio]
writes: [new-entry, delete-entry]
```

Run it in this order.

1. Open the Views catalogue and press Task demo. The panel lists what the manifest asks for:
   - `Read the portfolio, with every project, person, venue and funding entry.`
   - `Add an entry to a collection.`
   - `Delete an entry of a collection, asking you first.`
   - `Reach no address outside this machine.`
   - `Keep its own data in <home>/.oculus/app-data/task-demo.json.`, where `<home>` is your home folder written out in full.

   Press Approve.
2. The page reads "Connected. The theme is light." and under Channel a line such as "2 entries in tasks; an entry is named by its key." That count came from `read('portfolio')`; `onChannel` redraws it whenever the hub changes.
3. Type a note and press Add note. The note appears under Store. The file `~/.oculus/app-data/task-demo.json` holds `{"notes":["first note"]}`, and History lists an `app store` row that goes from 0 to 24 bytes. The file is not in the app's folder, so the approval holds.
4. Press Create a task. The line `Created: Task demo <number>` appears and the entry is appended to `tasks/tasks.yml`. The id is kept with `setState` for the Delete button.
5. Press Delete that task, then Cancel. The question reads `The app Task demo asks to delete an entry of a collection:` followed by the body as text. Under Refusals the page adds `write delete-entry: declined`, and the entry stays in the file. Press Delete that task again and Confirm. The entry leaves the file, the file is as it was, and the Created line empties.
6. Press Open example.org. The question shows the address `https://example.org/`. Cancel adds `open url: declined`. Press it again and Confirm: the address opens in a new browser tab.
7. Press Read inbox, Open the engine's local.yml and Open a view that is not there. Refusals gains `read inbox: not_declared`, `open file: closed` and `open view: missing`.
8. Press Open Findings. The Findings view opens in the app's own pane and takes the selection, which hides the app's tab. The app's page is kept; select its tab to return. A question the app asks while its tab is hidden, or while its page is not on screen, shows the page and brings the tab forward.
9. Open the History tab of the System page. It holds three rows from this app, newest first: `entry removed`, `entry added` and `app store`, each with Undo and with Before and After. Press Undo on `entry removed`: the task is back in the file and History says `Task demo <number> / entries is back.`. Press Undo on the row `entry added`: the task leaves the file again, and `tasks/tasks.yml` is as it was before step 4.

The Create and Delete steps change your real `tasks` file. Step 5 ends with the file as it was, and step 9 leaves it as it was after undoing both rows.

## 11. When something goes wrong

| What you see | Cause | What to do |
|--------------|-------|------------|
| The app is not in the Views catalogue | the folder is not an app: no `app.yml`, a name starting with a dot, a file instead of a folder, a name outside the pattern, or the folder is outside the apps folder | open the Findings view and look for `apps[<name>]`; a folder with no `app.yml` gives no finding |
| The Findings view shows `apps[<name>]` with a sentence | the manifest or the folder broke a rule of part 4 | fix the file named in the finding; the finding clears when the folder is read again |
| The approval panel appears again | a file of the app changed, or a root app arrived by `git pull` | read the panel and approve again; use Keep approved while I edit for a machine app you are editing |
| "The app did not answer in time." with Reload the app | the script never completed `connect` within `connect_timeout_s`: it never calls `connect`, it failed to load, it threw before `connect`, or all of the page's script is inline and does not run | call `connect` first in a script file loaded with `<script type="module" src>` and check the script's address |
| The page shows its first text and nothing updates | the page loads a script file and also holds an inline `<script>`, whose code does not run | move the inline code into the script file |
| A script or style does not load | the extension is not typed (a `.ts` file is `application/octet-stream`), the path is wrong, or the file is dot-led or a link | ship `.js` and `.css` files with plain names |
| A fetch to an outside address fails | the origin is not in `connects` | add it to `connects`; the panel asks again |
| `not_declared` on a call | the manifest lacks the channel or the kind | add it to `reads` or `writes` |
| `refused:kind` on a write | the body's `kind` differs from the kind named, the body does not match the kind's shape, or the collection is `bookmarks` | fix the body |
| A call never answers | the tab closed or reloaded, or a question waits for your answer | answer the question in the app's tab |
| A write or open rejects `rate` | more than 30 calls in a minute from one frame | slow down, or raise the setting |
| A link in the app does nothing but ask a question | a link that leaves the app goes through `open({ url })` | confirm, or link to a page of the app |
| A root app is missing after a workspace change | its root is not in the Files view of the workspace | add the root again; the tab keeps its state and draws the app when the root returns |

### Reading a refusal in the browser console

A refusal is a plain string. The app receives it as the reason its promise rejects, and the browser console shows it when no code in the app catches it.

1. Open the browser's developer tools on the tab that shows oculus (F12, or Cmd+Option+I on macOS) and select the Console.
2. Repeat the failing action. A rejection that nothing catches is logged as `Uncaught (in promise)` followed by the refusal word, for example `not_declared`.
3. To see the word of a call you handle yourself, log it. After this line the console prints `refused: not_declared` when `reads` lacks `inbox`:

   ```js
   oculus.read('inbox').catch((word) => console.log('refused:', word));
   ```

4. A `refused:<reason>` or `failed:<status>` from `write` or `setStore` names a request that the oculus page sent, not your frame. Open the Network panel and select the request to `/api/write`. A refusal with a 4xx status has the body `{"error":"<reason>"}`, for example status 404 with `{"error":"no collection nonesuch"}`. An answer with status 200 lists the refused fields in `refused` instead.
5. Put the same words on the app's own page, as the example does with its Refusals list, so a refusal is visible without the console.
