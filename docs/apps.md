# Building an oculus app

An app is a folder of web files that oculus draws in a tab. This guide is the reference for building one: the manifest, the approval, every bridge method, channel and write, the refusal words, the limits, what an app cannot do and a worked example. The rest of the manual is [HELP.md](../HELP.md).

## What an app is

- An app is a folder holding an HTML page, its scripts and styles, and a manifest `app.yml`. oculus finds the folder while it runs and lists the app in the Views catalogue under Apps. A new or edited folder is picked up with no build and no restart.
- An approved app is drawn in an iframe with `sandbox="allow-scripts allow-downloads"`. It has an opaque origin: no cookies, no storage, no popups and no access to the rest of oculus. The only way out is the bridge, a client at `/apps/-/oculus.js` that the app's script imports.
- A machine app lives in the hub's `.oculus/apps/` folder and may read every channel an app can read. A root app lives in the `.oculus/apps/` folder of any other root shown in the Files view and travels with that repository. A root app is offered fewer channels, cannot be kept approved while it changes, and opens files only from its own root.
- An app opens from the Apps button on the rail, from the Views catalogue (a root app's title is followed by its root's key in parentheses), or by the chord `v` and the digit the catalogue shows beside it.

## Where the files go

- A machine app's folder is `<apps_dir>/<name>/`, where `apps_dir` in `config/local.yml` defaults to `<hub>/.oculus/apps`. A root app's folder is `<root>/.oculus/apps/<name>/` for every root of the Files view except the hub, whose `.oculus/apps` is the machine folder.
- `apps_dir` takes a path. `~` and `~/...` are under your home folder, and any other relative value is resolved against the engine directory. The root `engine` is oculus's own `config/` folder and holds no apps.
- An app folder is a direct subfolder of an apps folder and holds `app.yml`. Its name matches `^[a-z][a-z0-9-]{0,39}$`. A file in an apps folder, a folder whose name starts with a dot and a folder with no `app.yml` are skipped without a finding.
- A file or folder whose name starts with a dot, and every symbolic link, is not part of the app: it is neither hashed nor served. Subfolders are fine, and a path in the app has no empty or dot-led segment. At most 500 files and 20 MB are allowed, `app.yml` counted; past that the finding is `too_large` (limits are in Limits).
- The approval hash is a SHA-256 over the real folder path, the name, the bytes of `app.yml` and each recorded file's path and bytes in sorted order, every field framed by its length. Two copies of an app in two folders are two apps with two approvals, and moving a folder asks again.
- An app has one store file outside its folder, so writing the store never changes the hash: `~/.oculus/app-data/<name>.json` for a machine app, `<root>/.oculus/app-data/<name>.json` for a root app (git tracks it unless the root ignores `.oculus/app-data/`).
- Files are served at `/apps/<name>/<key>/<path>`, or `/apps/@<root key>/<name>/<key>/<path>` for a root app. `<key>` is the first 32 hex characters of an HMAC-SHA256 over the view id and the hash, made with a secret minted at server start, so it changes with the files and with every server process. Use relative paths in the HTML and never copy an address.

## The manifest

`app.yml` is one map of the nine keys below. Any other key refuses the app (`key_unknown`).

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

- A finding other than `glyph_unknown` means the folder is not an app: it is not offered, registered or served. The Findings view shows each one with the file, the key `apps[<name>]` (`apps[<root>/<name>]` for a root app) and a sentence.
- A `connects` origin is `https://host` or `https://host:port`; `http:` is accepted only for `localhost` and `127.0.0.1` on a port other than oculus's own. No user name, path, query or wildcard is allowed, a trailing slash is dropped, and `wss:` gives `connect_shape`. An origin admits requests of its own scheme only.
- `app.yml` that does not parse gives `does not parse: <reason>`, and one that is not a map gives `is not a map of keys`. A file that cannot be read gives `file_unreadable`, and a folder over the file or size limit gives `too_large`.
- Four findings concern a folder as a whole: `folder_outside` (a root's `.oculus/apps` resolves outside the root), `repeated` (a folder whose real path an earlier one holds), `apps_dir_not_folder` (`apps_dir` names a file) and `closed_paths_shape` (the `closed_paths` setting is missing or not a list).

## Approval and change

An app runs only after you approve it. The panel in the app's tab names what it reads and writes, the outside addresses it reaches, where it keeps its data, its folder and its size, and offers three controls.

| Control | Effect |
|---------|--------|
| Approve | Approves exactly the files shown. If a file changed meanwhile the approval is refused with "The app changed while you read it, so it was not approved. Read what it asks for now." |
| Keep approved while I edit | Machine apps only. Approves the same way and keeps the app approved while its files change, until the oculus server process ends. |
| Open the app's folder | Shows the folder in the Files view; when no root shows it, the notice is "The folder of this app, <folder>, is inside no root the file browser shows." |

- Any change to any file changes the hash, and the tab shows the panel again: "This app changed since you approved it. Read what it asks for again and approve it to run it." A root app changed by a `git pull` asks again the same way. Revoke in the toolbar takes an approval back.
- A kept machine app stays approved when any file except `app.yml` changes: the frame reloads and no question is asked. A change to `app.yml` ends the keeping, because the manifest names what you approved.
- Keeping is held in server memory. After a restart an app is approved by the entry Approve wrote to the approvals file, `~/.oculus/approvals.json` unless the `approvals` key of `config/local.yml` names another, and it asks at the first change.
- A tab shows a lock mark while its app is not approved and an edit mark while it is kept approved. A removed folder leaves the tab as `Unknown view: app:<name>` with its state kept, and the app is drawn again when the folder returns.

## The bridge

```js
import { connect } from '/apps/-/oculus.js';

const oculus = await connect({ onChannel, onTheme, onStore });
```

`connect(handlers)` resolves with the nine methods once the handshake completes; all three handlers are optional. Before it resolves it paints the theme on the document, and afterwards it forwards key chords and clicks on outside links to oculus. Every app calls `connect`; one that does not finish within `connect_timeout_s` shows "The app did not answer in time." with a Reload the app button.

### The handlers

| Handler | Called with | When |
|---------|-------------|------|
| `onChannel(channel, version, payload)` | the channel name, its version and payload | each time oculus receives a message of a channel in `reads`; one call in flight per channel, a newer payload replacing a queued one |
| `onTheme(theme)` | `{ name, tokens, wall }` | after the theme, wallpaper, CRT overlay or text size changes, and each time the app's view is drawn again |
| `onStore(value)` | the parsed store | when the store file changes, in every tab of the app, the writing tab included |

`onChannel` and `onTheme` are not called for what oculus already holds at connect: use `read(channel)` and `getTheme()` for the first values.

### The nine methods

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

### Channels

An app reads a channel by listing it in `reads`. `read` resolves with a copy of the newest message, and a root app gets only its root's part of `git` and `files`.

| Channel | Who | What it carries |
|---------|-----|-----------------|
| `portfolio` | every app | projects, venues, datasets, pillars, domains, funding, people, organisations, resources, collections, side projects, the feeds summary and the career file |
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

No app can read `apps` (the address key of every approved app), `processes` (the process table) or `pty:<id>` (whatever a terminal printed). A channel added to oculus is closed to apps until it is named here. A root app listing a machine-only channel gets `channel_closed`.

### Channel payloads

Every payload is plain JSON. `list of X` is a list of `X`, `map of X` a map from text to `X`, a name ending in `?` may be absent, and times and durations are text as their source gives them. A `Finding` is `{ file, key, message }` (text, `line?` a number), where `key` is empty for a finding about the whole file.

**`portfolio`** is `{ version: number, entities, relations, findings: list of Finding }`. `entities` holds these maps, each keyed by the record's `id`:

| Key | Record fields |
|-----|---------------|
| `projects` | `id`, `title`, `folder`, `file` (absolute paths), `tier` (`ideas`, `active`, `manuscripts`, `software`, `coauthor`, `archive` or `side-projects`), `ghost` (boolean), `chips`, `results`, `ideas` (lists of text), `docs` (list of `{ name, label, present, human, mtime? }`), lists of ids `waitingOn`, `resourceIds`, `relatedIds`, `fundingIds`, `datasetIds`, `pillarIds`, `domainIds`, `collaborators`, `followups` (list of `{ do, after? }`), `subtasks` (list of `{ key, do, deadline?, done, snooze? }`); text `category?`, `type?`, `typeWritten?`, `short?`, `lead?`, `statusLine?`, `focus?`, `priority?`, `eli5?`, `next?`, `latest?`, `deadline?`, `snooze?`, `doi?`, `outcome?`, `venue?`, `deck?`, `venueId?` (an id); `authors?` (text or list of text), `year?` and `staleDays?` (number), `pin?` (boolean), `deckTags?` (list of text), `codeAvailability?` (`{ status?, date?, url?, doi?, repo? }`), `reproduced?` (`{ date?, note? }`) |
| `venues` | `id`, `name`, `themes` (list of text); text `short?`, `tier?`, `category?`, `jif?`, `quartile?`, `wos?`, `scopus?`, `free?`, `format?`, `wants?`, `link?`, `deadline?`, `deadlineMonth?`, `heldMonth?`, `timing?`, `call?`, `email?`; `wosMark?` and `scopusMark?` are `yes` or `no` |
| `datasets` | `id`, `name`, `themes`, `projectIds`; text `modality?`, `description?`, `size?`, `access?`, `source?`, `hpcPath?`; `retrieval?` (a map) |
| `pillars`, `domains` | `id`, `title`, `projectIds`; text `blurb?`; a pillar also has `fundingIds` and text `color?`, `kind?`, `goal?` |
| `funding` | `id`, `title`, `followups`, `subtasks`, `tags` (list of text), `projectIds`, `pillarIds`; text `sub?`, `status?`, `date?`, `deadline?`, `note?`, `statement?`, `link?`, `url?`, `snooze?`; `funder?` (an organisation id) |
| `people` | `id`, `name`, `affiliations` (organisation ids), `links`, `projectIds`, `jointWorkIds`; text `role?`, `orcid?`, `email?`, `folder?`, `file?` (the absolute path of the people file, on a person of a hub other than the first); `self?` (boolean) |
| `organisations` | `id`, `name`, `links`, `personIds`, `fundingIds`; text `kind?`, `country?` |
| `resources` | `id`, `name`, `kind` (`cluster`, `machine` or `storage`), `links`, `order` (number); text `host?`, `access?` |
| `collections` | `id`, `title`, `file`, `entries` (list of Entry), `intro?`, `schema?` (list of `{ field, type, label?, options?, from?, required?, help?, when?, open?, map?, fields? }`) |
| `personal` | side projects: `id`, `title`, `status`, `eli5`, `next`, `links`, `source` (`{ kind: 'hub', folder }` or `{ kind: 'root', key, dir }`), `file`, `folder` (`side-projects/<slug>` against the hub for a hub folder, the repository's absolute path for a repository), `docs` (list of `{ name, label, present, human, mtime? }`, the fixed project documents the folder holds); `deck?` (the path of the folder's `present/` folder against the Files root that holds the project, present when `present/present.yml` is there); and, when the side manifest holds them, `short?`, `priority?`, `latest?`, `deadline?`, `snooze?`, `pin?`, `waitingOn?`, `relatedIds?`, `collaborators?`, `followups?`, `subtasks?` as in a project |
| `feeds` | `leads` (list of `{ title, deadline, status, fit, root? }`, the middle three text or null, or null), `radar` and `scout` (`{ lastRun }` or null), `linkedin` (`{ lastPost }` or null) |
| `career` | the career file of the hub, or null: `title`, `milestone?`, `situation` (list of `{ label, value }`), `order` (list of `{ task, when?, note? }`), `orderNote?`, `hosts` (list of `{ name, inst?, tag?, status, scores, note? }`), `hostCriteria` (list of text), `notHosts` (list of `{ who, why? }`), `eligibility` (`{ rule, shots, caveat? }` or null), `dropped` (list of `{ what, why? }`) |

An Entry is `{ id, title, fields: map, file, index: number, root? }`: `fields` holds every key the entry has in the file, and `id` is the entry's `key` when it has one and its `title` otherwise, with the hub's key in front for an entry of a hub other than the first. `relations` holds lists of `[id, id]` pairs named `projectVenue`, `projectFunding`, `projectDataset`, `projectPillar`, `projectDomain`, `projectRelated`, `fundingPillar`, `projectPerson`, `jointWorkPerson`, `personOrganisation` and `fundingOrganisation`.

A `roots:` entry of the hub marked `hub: true` is a hub of its own, merged into the same portfolio. Every record of `entities`, every Entry, every lead and every `audit` finding carries `root`: absent or `hub` for the first hub, and the root's key for another hub. A record of another hub has the id `<root key>:<id>`, every id inside it (a list of ids, a `venueId`, a relation pair, an Entry field whose `from:` names a registry or the projects) has the same key in front, and an `audit` finding of that hub has it in front of its `scope`. An app reads the records of every hub and writes those of the first hub alone: a write that names a record of another hub answers not found.

| Channel | Payload |
|---------|---------|
| `feeds` | a map `radar`, `leads`, `linkedin`; each is `{ ok: true, kind, file, meta: map, entries: list of map, cadenceDays?, schema?, missing?, error?, hubFiles? }`, where `cadenceDays` (number) is on `linkedin`, `missing` (boolean) says the feed's file is not on this machine, and `hubFiles` maps the key of each other hub to its file of the feed, relative to that hub; an entry of another hub carries `root` and keeps its own title |
| `hpc` | `status` (`starting`, `ok`, `unreachable` or `error`), `hint?`, `jobs` (list of `{ id, name, partition, state, time, limit, nodes, cpus, gpus, mem, priority, start, reason }`), `running`, `pending`, `total`, `recent` (list of `{ id, name, state, exit, elapsed, end, memUsed, memReq, memPct, cpuPct }`, the last two number or null), `sinfo` (list of `{ partition, avail, nodes, state, gres }`), `quota` (list of `{ name, used, limit, pct }`), `updated`, `lastOk?`, `host`, `pollMin`, `retryMin?` |
| `audit` | `{ findings: list of { scope, where, file, kind, message, signature }, muted: list of text }`; `kind` is `todo`, `data`, `conform`, `manifest`, `readability` or `publink`, and `signature` is twelve hex characters |
| `config` | `{ config: map, text: map of text, icons: map of text, host: { name, address }, findings: list of Finding }` |
| `git` | a map from a repository's folder to its state: `branch`, `ahead`, `behind`, `upstream?` (boolean or null), `detached`, `ignoresWorktrees`, `present`, `repository` (booleans), `staged`, `unstaged`, `untracked`, `conflicted` (lists of `{ path, status, added, deleted, from? }`, the counts number or null), `held` (`{ staged, changes, untracked, merge }`), `sequence` (`merging`, `rebasing`, `cherry-picking` or empty), `mergeMessage`, `remotes`, `stashes` (`{ ref, hash, message, when }`), `tags` (`{ name, commit, annotated, subject }`), `log` (`{ hash, short, subject, when }`), `branches` (`{ name, upstream, current }`), `worktrees` (`{ path, branch, head, main }`), `error` (text or null) |
| `files` | `{ root, folders?, bookmarks?, workspaces? }`: `root` is the folder of the root that changed and `folders` the folders of it the writes landed in, relative to the root and `''` for its top; a notice without `folders` concerns the whole root and one with an empty list concerns nothing. The `bookmarks` and `workspaces` notices name no root and reach machine apps only; a root app receives only notices whose `root` is its own folder |
| `inbox` | `status` (`ok`, `error` or `unconfigured`), `accounts` (list of `{ provider, label, status, hint?, needsSetup?, ownHalf?, lastOk? }`), `threads` (list of `{ id, account, provider, sender, replyTo, subject, received, snippet, messages, url?, triage }`, where `triage` is `{ kind?, what?, draft?, triaged }`), `updated`, `pollMin`, `retryMin`, `notesRun` (text or null), `notesError?`. `snippet` is part of each message's text |
| `calendar` | `status`, `accounts` (as in `inbox`, `provider` also `ics`, plus `calendars`: list of `{ id, name }`), `events` (list of `{ id, account, calendar, title, start, end, allDay, location?, link?, status? }`, with `status` `confirmed`, `tentative` or `cancelled` and no attendee list), `updated`, `pollMin`, `retryMin`, `daysBack`, `daysAhead` |
| `sessions` | `{ records, workspaces, terminals? }`. A record holds `id`, `path`, `slug`, `tool` (`claude` or `codex`), `title`, `lastPrompt`, `state`, `cwd`, `branch`, `model`, `effort`, `permissionMode`, `version`, `entrypoint`, `started`, `lastActivity`, `liveStatus`, `registryName`, `live`, `hidden`, `truncated`, `pid`, `contextWindow`, `prompts`, `messages`, `contextTokens`, `lastCacheRead`, `tokens`, `cache`, `tools`, `files`, `agents`, `timeline` and `hook`. A workspace is `{ key, name, lastActivity, areas }`, and an area is `{ key, short, full, known, lastActivity, sessions }`. A terminal holds `id`, `name`, `title`, `icon`, `color`, `kind` (`claude`, `codex` or `shell`), `cwd`, `command`, `pid`, `created`, `attached`, `resumes`, `task`, `exit`, `job` and `foreign?`. `lastPrompt` and the `timeline` text carry the words of the session |
| `usage` | `{ accounts, days, builtAt }`. An account holds `tool` (`claude` or `codex`), `label`, `dir`, `email`, `organisation`, `tier`, `tierLabel`, `billing`, `fetchedAt?`, `windows` (list of `{ name, observedAt, usedPercent, resetsAt, windowMinutes, model?, severity?, active? }`), `live` (list of `{ sessionId, model, updatedAt, cwd, contextPercent, costUsd }`) and `refresher?` (`{ state, since, reason, lastRefresh, renewed }`). A day is `{ tool, account, day, model, input, output, cacheRead, cacheCreation }` |

### Writes

`write(kind, body)` asks oculus to change the hub's data. The kind must be in the app's `writes`, the body is a map whose own `kind` field equals it, and the write route refuses with `refused:kind` when the body matches another kind, the kind is closed to apps, the body is not a map, or the collection is `bookmarks`.

| Kind | Body | Asks first |
|------|------|------------|
| `manifest` | `{ kind, id, fields }` for the project `id` or a hub side project `side:<slug>` (`root:<key>` answers not found to an app) | no |
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
| `new-idea` | `{ kind, fields }`, `fields.id` the idea's id | yes, no undo |

- `root` on `feed-field`, `feed-delete` and `linkedin-post` names the hub whose feed holds the item, absent or `hub` for the first hub; an app writes the first hub's feeds alone, so another `root` answers not found.
- The five kinds that ask first show "The app <title> asks to <words>: <body>" with the body as JSON cut at 300 characters. The words are `delete an entry of a collection`, `delete a feed item`, `create an idea project`, `move a LinkedIn idea` and `move a LinkedIn post`. The keyboard is on Cancel, which rejects `declined`.
- Every write is recorded in the change log with the app's id, and the History view undoes it. The three kinds marked no undo are not undoable.
- Closed to apps, and refused with `write_closed` in a manifest: `undo`, `rail`, `audit-mute`, `config-key`, `config-value`, `session`, `deck-slides`, `deck-edit`, `roots`, `app-store`, `calendar`, `connect`, `mail`, `memories`, `fs`, `open`, `source`, `deposit`, `git`, `hpc`, `usage/refresh`, `hook` and `terminal`. Any route that runs processes, writes arbitrary files, reaches a remote or acts on an account is among them.

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
| `{ file: { root, path } }` | the file as source text, with no program started | `closed`, `missing`, `failed:0` |
| `{ url: '<address>' }` | the address in a new browser tab, after you confirm | `closed` for a scheme other than `http:` or `https:`, an address over 2048 characters or one with a user name or password; `declined` on Cancel |

A `{ file }` target is checked in this order: exactly `root` and `path`, both text; no empty, `.`, `..` or dot-led segment, backslash or NUL in the path; no leading folder of `closed_paths` (by segment, ignoring letter case); a root other than `engine`, and a root app naming only its own root (else `closed` for each); a root the Files view shows (else `missing`); then on the server a real path inside the root, outside oculus's `config/` folder and passing the same rules (else `closed`), that is a file (else `missing`). With no answer from the server the call rejects `failed:0`.

`open` counts toward `apps.opens_per_min` before it is judged. The question for `{ url }` shows the whole address: "The app <title> asks to open this address in a new browser tab. The address can carry what the app has read." oculus makes the same call when you press a link that leaves the app, and a `mailto:` or `ftp:` link is refused `closed`.

### Theme and keys

`getTheme()` and `onTheme` carry `{ name, tokens, wall }`: the theme's class on the body, every custom property of oculus's `tokens.css`, and whether the wallpaper is on. `connect` writes the tokens on the document's root element, toggles a `wall` class there and puts `color-scheme: light dark` ahead of the app's style sheet, so CSS can use `var(--bg)` and `var(--ink)`; with the wallpaper on the frame paints nothing. `connect` forwards `keydown` as `key({ key, code, altKey, ctrlKey, metaKey, shiftKey })`.

## Refusal words

| Word | Raised by | Cause |
|------|-----------|-------|
| `not_declared` | `read`, `write` | the channel is not in `reads`, or the kind is not in `writes` or is closed to apps |
| `closed` | `read`, `open` | a listed channel closed to the app's kind; an `open` target that is not allowed |
| `too_large` | `setState`, `setStore` | the JSON is over `apps.state_max_kb` or `apps.store_max_kb` |
| `not_json` | `setState`, `setStore` | the value is not plain JSON |
| `rate` | `write`, `setStore`, `open` | more than `apps.writes_per_min` or `apps.opens_per_min` calls in a sliding minute from one frame |
| `declined` | `write`, `open` | you pressed Cancel on the question |
| `missing` | `read`, `getStore`, `write`, `open` | oculus holds no row for the app, a view id nothing registers, a project not in the portfolio, or a root or file that is not there |
| `refused:<reason>` | `write`, `setStore` | the write route refused with a 4xx status and a sentence, or answered 200 and refused the first field it could not write; `<reason>` is that sentence |
| `failed:<status>` | `write`, `setStore`, `getStore`, `open` | the route answered 500 or more, or a 4xx with no error text; `0` is no answer |

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
| `unwritable`, `outside`, `too_large`, `readback` | `setStore`: the store folder cannot be written, is not inside the app data folder or the app's root, the value is over `apps.store_max_kb` as the server measures it, or the file read back differs |

Other reasons are the writer's own sentences, such as `the entry is not in the file` and `the edit did not verify; nothing was written`. The sentence names what to change.

## Limits

Nine keys of the `apps:` block of `config/behavior.yml` set the limits, each a setting under Apps on the Settings view. A number is a whole number of at least 1, and a missing or wrong value takes its default. A kilobyte is 1024 bytes, and a reload of the frame starts the per-frame counts again.

| Key | Default | What it limits | Past the limit |
|-----|---------|----------------|----------------|
| `connect_timeout_s` | 10 | seconds a frame is given to complete the handshake | "The app did not answer in time." |
| `state_max_kb` | 64 | kilobytes of one tab's state | `too_large` |
| `store_max_kb` | 256 | kilobytes of the store | `too_large`; `getStore` answers `null` for a larger file |
| `writes_per_min` | 30 | writes, `setStore` included, per frame | `rate` |
| `opens_per_min` | 30 | calls of `open` per frame | `rate` |
| `keys_per_s` | 20 | key events per second taken from a frame | the extra events are dropped |
| `max_files` | 500 | files in an app folder | the finding `too_large` |
| `max_mb` | 20 | megabytes in an app folder | the finding `too_large` |
| `closed_paths` | `[secrets]` | folders, relative to a root and applied to every root, that `open({ file })` never reaches | `closed` |

`closed_paths` takes folder paths with no empty, dot or dot-led segment; an invalid entry is left out and a duplicate counts once. A value that is missing or not a list closes every file for every app and raises `closed_paths_shape`.

## What an app cannot do

- Run a process or server code, or read a file outside its folder. `open({ file })` shows source text in oculus and gives the app no content.
- Read another app's files or store, any `/api/` route, the write token or oculus's own page. The frame's origin is opaque and the address key is held by nobody else.
- Use cookies, `localStorage`, `sessionStorage` or IndexedDB; open a popup, submit a form, show a modal dialog, lock the pointer or navigate the frame.
- Run an inline script. The Content-Security-Policy allows scripts from the app's own files and the shared bridge files only, so scripts are files loaded with `<script type="module" src>`.
- Load anything from outside the app's folder except `data:` images and the bridge files. The `connects` origins are allowed for `fetch` and other connections only, so an `<img>` or a `<script>` cannot load from them. Styles may be inline.
- Run a file type oculus does not type. Only `.html`, `.js`, `.mjs`, `.css`, `.json`, `.svg`, `.png`, `.jpg`, `.gif`, `.webp`, `.woff2`, `.txt` and `.wasm` get a content type; any other file, a `.ts` included, is sent as `application/octet-stream` with `nosniff`.
- Read `apps`, `processes` or `pty:*`, a root app's `inbox`, `calendar`, `sessions` or `usage`, or write a closed kind. Open `local.yml`, a file under oculus's `config/` folder, a dot-led path or a path under `closed_paths`. Edit your bookmarks.

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
| The approval panel appears again | a file of the app changed, or a root app arrived by `git pull` | read the panel and approve again; use Keep approved while I edit for a machine app you are editing |
| "The app did not answer in time." | the script never completed `connect` within `connect_timeout_s`: it is not loaded, threw first or is inline | call `connect` first, in a script file loaded with `<script type="module" src>` |
| A script or style does not load, or the page never updates | an inline `<script>` does not run; a `.ts` file is not typed; the file is dot-led or a link | put the code in `.js` and `.css` files with plain names |
| A fetch to an outside address fails | the origin is not in `connects` | add it to `connects`; the panel asks again |
| `not_declared` or `refused:kind` | the manifest lacks the channel or kind, or the body does not match the kind | add it to `reads` or `writes`, or fix the body |
| A call never answers | the tab closed or reloaded, or a question waits for you | answer the question in the app's tab |
| A link in the app only asks a question | a link that leaves the app goes through `open({ url })` | confirm, or link to a page of the app |
| A root app is missing after a workspace change | its root is not in the workspace's Files view | add the root again; the tab keeps its state |
