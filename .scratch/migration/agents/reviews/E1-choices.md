# E1, the choices for Axel's ruling (open item Z93)

The section "Apps added while oculus runs" is in `tools/oculus/DESIGN.md` as an unbuilt proposal. Its text holds the recommended option of every choice below. A ruling that picks another option changes the text before a build step is booked. Answer as `C7 (d)`, or "all as recommended" with the exceptions.

Where an app lives and how it is named

- C1, the folder. (a) `apps_dir` in `config/local.yml`, `~/.oculus/apps` when absent: per machine like `calendar_dir` and `mail_dir`, and approval is per machine too. (b) `apps/` in the hub: shared through git, but puts code in the data repository. (c) under `config/`: tracked with oculus, so every user of oculus gets Axel's apps. (d) `~/.oculus/apps` with no key: breaks the rule that a path has a config key. Recommended (a). Lazy: (d).
- C2, the manifest. (a) `app.yml` with `name`, `title`, `description`, `glyph`, `bridge`, `entry`, `reads`, `writes`; an unknown key, channel or write kind refuses the app when the folder is read. (b) `manifest.json`: no YAML, unlike every other oculus file. (c) unknown keys ignored: a newer app runs on an older oculus, and the reader approves keys nothing reads. (d) any name accepted and refused when the app calls: the reader approves a list that was never checked. Recommended (a). Lazy: (d).
- C3, the view id. (a) `app:<name>`: can never equal a built-in view or a collection. (b) `app/<name>`: same, another separator. (c) the bare name with a finding on a clash: an app named `focus` is refused. Recommended (a). Lazy: (c).
- C21, reserved names. (a) the name pattern excludes every reserved form, so there is no list. (b) an explicit list to keep up. Recommended (a).
- C22, a folder without `app.yml`. (a) ignored, no finding: a scratch folder stays quiet. (b) a finding: tells a reader who forgot the file, and is noise otherwise. Recommended (a).
- C23, a manifest asking for a closed or unknown channel or write. (a) refused when the folder is read, with a sentence in the Findings view. (b) refused at approval. (c) offered with that item denied: the app then fails at a call. Recommended (a).

How an app is served and isolated

- C4, the address. (a) `/apps/<name>/<key>/<path>` outside `/api/`, the key derived from the app's content and a server secret: another web page cannot guess it. (b) no key: any web page can read an approved app's files. (c) under `/api/` with the guard opened for it: same exposure, and a weaker guard. (d) one port per app: a real origin, and a server per app. Recommended (a). Lazy: (b).
- C5, the `Access-Control-Allow-Origin` header on app files. (a) `*`, with the key as the protection. (b) `null`: admits every sandboxed page of any site, so it protects no more. (c) an echo of the request's origin: a sandboxed frame sends `null`, so it is (b). Recommended (a).
- C6, the frame's sandbox. (a) `allow-scripts` only, and a policy that allows the app's own files, inline styles and `data:` images. (b) forms, dialogs and popups allowed as well: convenient, more to guard. (c) no inline styles: stricter, breaks `style=`. (d) `allow-same-origin`: the app gets oculus's origin and the write token. Recommended (a). Lazy: (d).
- C7, keeping an app from navigating its frame away with the reader's data. (a) the page sends `frame-src 'self'`; an outside link inside a manual in the Document view then stops loading. (b) nothing sent: the exit stays open. (c) the policy added by script when the first app frame mounts: not verified that it governs frames already there. (d) as (a), and the Document view opens an outside link in a browser tab itself. Recommended (d): it closes the exit and the manuals keep their links. Lazy: (b).
- C24, the bridge's client file. (a) served by oculus (`/apps/-/oculus.js`, `/apps/-/penpal.js`): one version, one place to fix. (b) each app bundles penpal: versions drift. Recommended (a).
- C27, the Electron window. (a) this section says Node integration stays off, subframes included. (b) left to the native-window ruling: the frame's safety then waits on another decision. Recommended (a). Lazy: (b).
- C30, an app's own page in the Document view. The Document view's frame carries oculus's origin, so an app's `.html` opened there from the file browser would run before approval with the write token in reach. (a) a file under `apps_dir` opens as source text, never in the Document view. (b) the approval panel gets no control that opens the folder: the reader cannot read the files from oculus, and the file browser can still reach them. (c) the Document view's frame loses oculus's origin for every file: a larger change to the manuals' right-click menu. Recommended (a). Lazy: (b).

What an app may read

- C8, the channels. (a) open: `portfolio`, `feeds`, `git`, `hpc`, `audit`, `config` (which includes this machine's name and address) and `files` (a change notice, no content); closed: `apps`, `inbox`, `calendar`, `sessions`, `usage` and every terminal. (b) all closed until Axel names each. (c) all open except mail, calendar and terminals. (d) as (a) with `git` and `hpc` closed: no paths, job names or hosts reach an app, and no repository app works. Recommended (a). Lazy: (c).
- C28, coauthors' commit text on `git`. (a) open: a repository app works, and it sees coauthors' commit messages. (b) `git` closed. (c) open with subjects and messages removed from the app's copy: costs a stripped copy of the payload. Recommended (a), since the repositories are Axel's own. Lazy: (b).
- C25, the list of apps. (a) a channel `apps` of its own, closed to apps, each row carrying the app's hash and key. (b) inside `config`, which apps may read, so every app would see every key. (c) rows without hash and key, fetched per app. Recommended (a). Lazy: (b).
- C10, the title and glyph in the catalogue. (a) two new registration fields, `words` and `glyphName`. (b) a catalog key that takes the title: every place that draws a label must learn arguments. (c) the title written into the text catalog at run time: changes a build-time structure. Recommended (a).
- C31, the glyph names. (a) the group's glyph is a new `app`, the default glyph of an app is a new `app-view`, and a manifest may not name `app`. (b) other names, given by Axel. Recommended (a).

What an app keeps and writes

- C11, state. (a) one JSON value per tab, up to 64 KB, saved with the layout. (b) none: an app must write to the hub to remember anything. (c) a write kind for state. Recommended (a). Lazy: (b).
- C9, the write kinds. (a) 14 open (`manifest`, `entry`, `subtask`, `subtask-add`, `host`, `new-entry`, `reorder`, `delete-entry`, `feed-field`, `feed-delete`, `lead-add`, `linkedin-idea`, `linkedin-post`, `new-idea`), 5 closed (`undo`, `rail`, `audit-mute`, `session`, `deck`); an app allowed an entry kind can also edit the bookmarks. (b) only `entry` and `new-entry` open. (c) the four entry kinds closed: apps cannot edit any collection. (d) `manifest` closed as well. (e) as (a), and a write naming the bookmarks is refused for an app. Recommended (e): a bookmark can name an `.html` file that then opens with oculus's origin. Lazy: all 19 open.
- C16, enforcing the kinds. (a) the page sends the app's name and the kind as headers and the server refuses a body that matches another kind; the change log names the app. (b) the page checks alone: a body shaped for a closed kind passes. Recommended (a). Lazy: (b).
- C17, asking the reader. (a) `delete-entry`, `feed-delete`, `new-idea`, `linkedin-idea` and `linkedin-post` ask every time (the last three cannot be undone); the rest are recorded and undoable. (b) every write asks. (c) the two delete kinds only. (d) none. Recommended (a). Lazy: (d), and (c).
- C18, the limits. (a) 30 writes a minute, 64 KB of state, 500 files, 20 MB, a 10 s handshake and 20 forwarded keys a second, each a key of `apps:` in `config/behavior.yml`. (b) no limits. Recommended (a).
- C26, the refusal words an app gets. (a) fixed words: `not_declared`, `closed`, `too_large`, `rate`, `declined`, `failed:<status>`. (b) numbers. (c) sentences from the catalog. Recommended (a). Lazy: the raw exception, which carries page detail.
- C15, the bridge's method names. (a) the page gives `read`, `getTheme`, `getState`, `setState`, `write`, `key`; the app gives `onChannel`, `onTheme`; the app starts with `connect`. (b) one `request(type, ...)` method. (c) each app talks penpal itself. Recommended (a).

Approval

- C13, what an approval covers. (a) the app's content: any changed file asks again. (b) the name and its reads and writes: a changed script runs unreviewed, and editing an app does not ask at each save. Recommended (a). Lazy: (b).
- C14, where approvals are kept. (a) one `approvals.json` named by an `approvals` key of `local.yml`, for apps and for the commands of the processes rule, changed only through `POST /api/approve`. (b) one file per kind. (c) a table in an existing file. Recommended (a).
- C29, what stops an approved app sending what it read to another machine. The policy stops scripts, styles, images, fonts, media, fetches, forms and frames; whether it also stops WebRTC and DNS prefetch is not verified. (a) the section says approval is the boundary and claims nothing for the two. (b) as (a) now, and the build step measures both in Chrome and the section then states what was measured. Recommended (b). Lazy: (a).

In the workbench

- C19, where apps sit. (a) a new group `apps` with a rail button and a page of its own, where an app's tab opens; the button is drawn on machines with no app too. (b) under Views and Settings: no button, and apps sit among settings. Recommended (a). Lazy: (b).
- C12, the tabs of a removed app. (a) they stay and draw "Unknown view" until the folder is back: a sync or a rename loses nothing. (b) they close. Recommended (a). Lazy: (b).
- C20, keys pressed inside an app. (a) Control, Command and Alt combinations and Escape are passed to oculus, only while the app's frame has the focus, at most 20 a second. (b) none: the reader clicks outside the frame before any chord. (c) every key: typing in the app triggers oculus. (d) as (a) without the focus check: an app could close the reader's form with a forwarded Escape. Recommended (a).
