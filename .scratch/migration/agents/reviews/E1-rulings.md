# E1, Axel's rulings on the apps design (open item Z93, ruled 2026-09-30)

Every choice of `agents/reviews/E1-choices.md` is ruled as recommended there, except where this file says otherwise. The section "Apps added while oculus runs" in `tools/oculus/DESIGN.md` is rewritten to these rulings by step E2. It stays an unbuilt proposal until a build step is booked.

## Changed from the recommendation

- C1, where apps live. Two places: the machine's folder (`apps_dir` in `config/local.yml`, `~/.oculus/apps` when absent) and, for each root shown in Files, that root's `.oculus/apps/`. An app of the first is a machine app, an app of the second a root app. A root need not be a git repository.
- What follows from C1, each ruled as recommended:
  - the view id and the address carry the root for a root app, so two roots can each hold an app of one name;
  - the approval entry is keyed by the app's folder, so approving or revoking one app never touches another of the same name;
  - a file inside any apps folder, the machine's or a root's, never opens in the Document view and opens as source text;
  - the watcher watches the machine's folder and each root's `.oculus/apps/`, following roots added and removed;
  - the tabs of a root app whose root leaves Files stay and draw the unknown view, as for a removed app.
- N1 (a), what a root app sees. On `git` and `files` it gets only its own root's part. The hub channels it declares (`portfolio`, `feeds`, `hpc`, `audit`, `config`) are whole.
- C8 (e), the channels. `inbox`, `calendar`, `sessions` and `usage` may be declared by a machine app and are refused for a root app. `apps` and every terminal channel are closed to all apps.
- C11 with N2 (c), what an app keeps. The per-tab value stays as designed. Each app also has one store of its own, one JSON value written through a new write kind: a machine app's at `~/.oculus/app-data/<app>.json`, a root app's at `<root>/.oculus/app-data/<app>.json`. Every tab of the app shares it, a write is recorded in History and undoable, and its size is capped by a key of `apps:` in `config/behavior.yml`. The store is outside the app's folder, so writing it does not change the app's content hash.
- N3 (c), outside addresses. A manifest key `connects:` lists the outside origins an app may fetch from, for machine apps and root apps. The approval panel shows them, and the policy's `connect-src` names them beside the app's own files.
- N4 (b), downloads. The sandbox allows downloads (`allow-downloads`).
- N5 (b), opening things in oculus. The bridge gains a method `open` for a view id, a project, or a file shown as source text in the source tab. It never opens a page in the Document view.
- N6 (b), approval while an app is written. The approval panel of a machine app offers to keep it approved while its files change, until oculus restarts. It is never offered for a root app.

## Ruled as recommended, where Axel gave a ruling by name

- C6 (a): the frame's sandbox stays without `allow-same-origin`.
- C27 (a): the Electron window keeps Node integration off, subframes included.
