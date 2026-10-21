# oculus

Oculus is a workbench for a research hub. A hub is a folder that holds your projects, manuscripts, grants, data and code, described in YAML and Markdown files. Oculus reads those files and shows them as boards, lists and documents, beside a file tree, an editor, git, terminals and the Claude Code sessions working on the hub. It looks and works much like VS Code.

Oculus runs on your own machine, in a browser tab or in its own window, on macOS and Linux, and on Windows through WSL2. The server listens on 127.0.0.1 only. Oculus writes to a hub only where a control says so: back into the file a value came from, and the files and folders you make. Its own state lives in `~/.oculus`.

## What it shows

Each button on the rail at the left opens a page:

- **Focus**: see what wants attention now, such as deadlines, follow-ups, tasks and the lanes your projects sit on.
- **Projects**: browse your projects as cards or a list, with separate tabs for coauthored, archived, personal and software projects.
- **Incoming**: read your mail, position leads, LinkedIn posts and calendars.
- **Sessions**: follow every Claude Code or Codex session on the machine, with its terminal, transcript, timeline and changes.
- **Explorer**: work on files, with the file tree, git, search, references, the TeX view and the problems list.
- **Academic Life**: track funding, talks and events, teaching and service, position applications, joint work, tasks and photos.
- **Pillars**: see your projects grouped by research pillar and application domain, and as a graph of what links them.
- **Registries**: keep the shared lists of venues, datasets, statements, people, organisations and computing resources.
- **Literature**: search the literature sources, watch new papers and keep the ones you want.
- **Present**: show a slide deck written in Markdown, with a presenter screen and PDF export.
- **Apps**: add, enable, disable and remove apps, which are folders of web files oculus draws in a tab.
- **Help**: read the manual, the keyboard shortcuts, the Apps guide, the templates, the data map and the palette commands.
- **System**: change settings and look at oculus itself: its views, pages, processes, status, findings, audit and the history of its writes.

## Install

Download the archive for your machine from the [releases page](https://github.com/TheAxeC/oculus/releases):

- `oculus-0.1.0-darwin-arm64.zip` is the macOS app for Apple silicon. Unzip it and open `oculus.app`. The app is signed ad hoc and not notarized, so macOS refuses to open it the first time: open System Settings, Privacy and Security, and choose Open Anyway beside the message about oculus.
- `oculus-0.1.0-linux-x64.tar.gz` and `oculus-0.1.0-linux-arm64.tar.gz` are the Linux app. Unpack the archive and run the `oculus` program in the folder `oculus-linux-<arch>`.

The app carries its own runtime, so it needs no Node. It uses these programs when they are on the PATH:

- `git` for the Repositories view and every other git feature.
- `tmux` for the terminals.
- `perl` for the line counts of the Status view.
- `claude`, the Claude Code CLI, for the agent sessions.
- On Linux, `zenity` for the folder panel and `xdg-open` (package `xdg-utils`, or `wslview` from `wslu` under WSL2) to open files and links.

At its first window the app names each program it cannot find and what does not work without it. The rest of oculus works.

## Run from source

You need Node 24.15 or later on the 24 line, or Node 26 or later, and npm 11 or later.

```sh
git clone https://github.com/TheAxeC/oculus.git
cd oculus
npm ci
npm run dev    # serves the page at http://127.0.0.1:8790
npm run app    # opens oculus in its own window (Electron)
```

Each start checks the Node version, that the installed packages match `package-lock.json`, and the programs listed above. It says what is missing and how to fix it. The port is 8790 unless the hub's `.oculus/local.yml` names another.

`npm run app:release` builds the archives a release holds into `release/`. Add `-- --platform linux --arch x64` (or `darwin`, `arm64`) to choose the target. The macOS archive can only be built on a Mac.

## Start with a hub

Oculus opens with an empty workspace. To make your first hub:

1. Open the Explorer page on the rail. In the Files view, choose Add Folder to Workspace and pick a folder.
2. Right-click the folder and choose Make Folder a Hub..., then tick the collections the hub keeps and press Make. Oculus writes `.oculus/config.yml` and a data file under `.oculus/data/` for each ticked collection, from its template with every key commented out.
3. Make a project: right-click a folder and choose Make Folder a Project. Oculus writes the folder's `.oculus/project.yml`.

Save the workspace with Save Workspace As... in the Files view's `...` menu. It is kept as `.oculus/workspaces/<name>.yml` in the hub. Values that belong to this machine, such as the port and where the Claude CLI is, go in the hub's `.oculus/local.yml`, which stays out of git.

To see the views filled before you have a hub of your own, add the demo hub `tests/fixtures/hubs/demo/` of a checkout to the workspace. It is a synthetic hub with projects, registries, feeds and decks.

To have Claude Code sessions tell oculus when they want you, merge the hooks block the Status view prints into the top level of `~/.claude/settings.json`.

## Documentation

- [docs/HELP.md](docs/HELP.md) is the manual: every view, key, setting and file. The app shows it on its Help page.
- [docs/templates.md](docs/templates.md) gives every YAML file oculus reads as a template to copy.
- [docs/data-map.md](docs/data-map.md) maps a hub's data files, the views that show them and the keys that link them.
- [docs/apps.md](docs/apps.md) shows how to build an app, a folder of web files oculus draws in a tab.
- [docs/palette.md](docs/palette.md) lists every palette command and key. `npm run docs:palette` writes it from the code.

## Checks

Run these from the checkout:

```sh
npm test               # the unit suite
npm run test:checks    # the checks over the source tree, in tests/checks
npm run test:slow      # the tests tagged slow
npm run check          # the TypeScript and Svelte type check
npm run lint           # ESLint
npm run format:check   # Prettier; npm run format applies it
npm run build          # builds the server
```
