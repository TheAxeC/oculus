# oculus, design

The successor to the research cockpit (`tools/cockpit`). Same job: a private, local dashboard over the research portfolio, its projects, venues, funding, data, and the Claude Code sessions working on it. Different construction: one language, three layers, one definition per screen, live data pushed by the server rather than polled by the page, and an arrangement you edit in the app.

Written 2026-09-10. This is the artefact every later step is measured against. When the code and this file disagree, one of them is wrong and the disagreement is a finding, never something to paper over.

The name: the eye, alongside `iris`, `scotoma` and `umbra`; and the opening at the top of a dome that lets the light in, alongside `cathedra`.

## Why a new tool

The cockpit is a Python static-site generator that emits one 8.8 MB HTML file with all CSS and JS inlined, plus a Python dev server that patches the page in place when files change. That shape was chosen so the output would be a single portable file with no build step. The file is never opened; only the served app is used. Every awkward thing in the cockpit follows from a constraint that no longer applies:

- 3668 lines of Python build HTML through f-strings, and 3477 lines of client JS render the live half of the same screens. The Sessions tab is defined in both.
- A live-reload "morph" patches the generated document in place, with `data-skipmorph` escape hatches so it does not wipe what the client rendered, and MutationObservers to re-apply client decoration after it does.
- A hand-rolled module system (`window.CK`, load-order rules, a custom test) stands in for a bundler.
- Config is read into module-level singletons at import, so a config edit re-execs the whole process.

None of these are bugs. They are the cost of the constraint. oculus drops the constraint and therefore the cost. Nothing in the cockpit is thrown away carelessly: the data files are kept as they are, the configuration files are copied over and keep their roles, the palette and themes port unchanged, the gates port as tests, and the Sessions work (cockpit roadmap B, complete) ports rather than being rebuilt.

## Non-goals

- Not multi-user, not remote, not peered. Clodex-style fleet features are out.
- Not a general editor. It reads the portfolio and drives sessions; it does not replace an editor.
- Not a rewrite of the data. The YAML in the hub is the source of truth and its shape does not change for oculus.

## The three layers

**Data.** Reads files, produces a typed, validated model. Knows nothing about screens. Runs on the server.

**Code.** Everything between the model and the pixels. Split by where it can run: the server-pinned half touches the filesystem, git, processes and the socket; the client half holds state and computes joins and filters. Neither half renders anything.

**View.** Components. Split into primitives that know no domain, a shell that knows no view, and views that know no layout.

The rule that keeps this honest is an import-graph test (`tests/boundaries.test.ts`) plus one boundary SvelteKit enforces itself. See Boundaries below.

## Repository layout

```
tools/oculus/
  DESIGN.md                    this file
  README.md                    how to run it
  .scratch/migration/          the migration's ledger (plan.md), state file (orchestrator-state.md) and agent material (agents/); tracked; deleted at step 8
  config/                      the interface described as data, one concern per file; no link back
    meta.yml                   the tool's own identity
    sources.yml                what the portfolio reads: scan paths, registries, collections, docs, feeds
    vocab.yml                  words and their colours: palette, domains, statuses, lanes, tiers
    layout.yml                 how things are arranged: rail groups, board chrome, rollups, label modes
    behavior.yml               thresholds and horizons
    appearance.yml             the UI theme list, the wallpaper, the CRT default
    glyphs.yml                 the icon vocabulary
    text.yml                   every user-facing string, keyed
    manifest-schema.yml        the project.yml edit form
  local.yml                    machine-local values (the hub path), gitignored
  src/
    routes/
      +page.svelte             mounts <Workbench/>; nothing else
      api/docs/+server.ts      one markdown document, on demand
      api/wallpaper/+server.ts the image behind the panels, from the configured directory alone
      api/write/+server.ts     the write endpoints (dismiss, pin, rename; later commit, deposit)
    lib/
      data/                    LAYER 1
        model.ts               the types; no logic
        sources/
          manifests.ts         walk the tiers, parse every project.yml
          registries.ts        venues, datasets, programs, funding
          collections.ts       the generic collection shape (events, education, tasks, ...)
          docs.ts              markdown and frontmatter, on demand only
          config.ts            merge config/*.yml and local.yml
        validate.ts            the integrity gate: every key resolves, every status is in vocab
        normalise.ts           entities by id plus relation tables, JSON-safe
        index.ts               buildPortfolio(root): composition only
      server/                  LAYER 2, server-pinned; Kit forbids client imports of this folder
        socket.ts              the one WebSocket: channels, subscribe, push
        watch/
          portfolio.ts         watch the hub's yaml, rebuild, push
          sessions.ts          watch ~/.claude/projects and ~/.claude/sessions, push
          git.ts               watch each workspace's git state, push
        sessions/
          transcripts.ts       incremental JSONL reader with byte-offset cache (ports cockpit B1)
          registry.ts          ~/.claude/sessions/<pid>.json, liveness by pid and procStart
          group.ts             workspace and area scoring (ports cockpit B2)
        git.ts                 four read-only commands, nothing else, ever
        pty.ts                 tmux attach (step 6)
        auth.ts                origin check and the write token
      state/                   LAYER 2, client
        entities.svelte.ts     what the socket delivers, by channel
        selectors.svelte.ts    the joins: projects with their venue, funding, sessions
        layout.svelte.ts       the layout tree, persisted
        ui.svelte.ts           theme, per-view-instance selection and filters, persisted
        socket.svelte.ts       the client end: subscribe, reconnect, status
        text.ts                t("group.key"), reading config/text.yml
      ui/                      LAYER 3, primitives, domain-blind
        Card.svelte Chip.svelte Meter.svelte Table.svelte Pane.svelte Tabs.svelte Sash.svelte Empty.svelte Toolbar.svelte
      shell/                   LAYER 3, the workbench, view-blind
        Workbench.svelte ActivityRail.svelte Panel.svelte SplitView.svelte
      views/                   LAYER 3, domain-aware, layout-blind; one file per surface
        Focus.svelte Projects.svelte Archive.svelte Venues.svelte Funding.svelte ...
        sessions/
          SessionList.svelte SessionDetail.svelte Terminal.svelte Timeline.svelte Changes.svelte Agents.svelte
      themes/
        tokens.css             the palette, ported from the cockpit unchanged
        themes.css             the seventeen themes: fifteen ported unchanged, the two VS Code ones oculus's own
    server.ts                  the Node entry: http server with the WebSocket attached
  tests/
    contrast.test.ts           every text/background pair, every theme, at least 4.5:1
    integrity.test.ts          the model validates against the real hub with zero findings
    keys.test.ts               every t("...") key used in a component exists in config/text.yml
    boundaries.test.ts         the import graph respects the layers
    data/*.test.ts             per-source unit tests on synthetic fixtures
    server/*.test.ts           transcripts, registry, grouping, git parser
```

The mapping to the three layers is literal: `lib/data` is layer 1; `lib/server` and `lib/state` are the two halves of layer 2; `lib/ui`, `lib/shell`, `lib/views` are layer 3. `routes/` is SvelteKit's required entry and stays thin.

## Configuration

The nine files under `config/` are the interface described as data, one concern to a file, and they are treated alike. What the portfolio reads in `sources.yml` (the tier scan paths, the registry and collection files, the document and feed paths); words and their colours in `vocab.yml` (the palette, the research `domains`, the status legend and palette, the focus lanes, the venue tiers, the radar buckets); how things are arranged in `layout.yml` (the rail's groups, the board chrome, the tab rollups, the live badges, which title a surface draws); thresholds and horizons in `behavior.yml`; the UI theme list, the wallpaper and the CRT default in `appearance.yml`; icons in `glyphs.yml`; every user-facing string in `text.yml` read through `t("group.key")`; the edit form in `manifest-schema.yml`; the tool's own identity in `meta.yml`. `loadConfig` merges every file's top-level keys into one map and reports a key two files define, so a key moves between files without a reader noticing and no key sits in two. No component contains a literal user-facing string, a raw colour, or a literal glyph. `tests/keys.test.ts` fails on a `t()` key that does not exist, so a typo is caught before it renders blank, which is the same gate the cockpit has.

Paths resolve without environment variables: a command-line argument, then `local.yml`, then a default derived from the file's own location. The hub path is the one value every machine must set and it lives in `local.yml`, gitignored, so the tree carries no machine path. Roots the file browser may serve (step 7) are set in the app and stored in config; nothing outside a root is ever served.

## Layer 1, data

**Sources.** One module per kind of file. Each exposes one function that takes a root and returns raw records, and each is unit-tested against synthetic fixtures in a temporary directory. No source knows another exists.

**Model.** `model.ts` holds the types and nothing else. The core entities are `Project`, `Venue`, `Dataset`, `Program`, `Domain`, `Funding`, `Collection`, `Entry`, `Doc`. A project carries the ids of its relations (`venueId`, `fundingIds`, `datasetIds`), never resolved objects: a project points at its funding and the funding points back at its projects, and that loop cannot be turned into JSON.

**Validate.** Every id referenced resolves to an entity; every status is in the vocabulary; every manifest field is one the schema names. Failures are reported with file and key, and a run against the real hub must report zero. This is the cockpit's `selftest.py` referential check, ported. It runs on every rebuild, so a bad manifest edit shows in the app within a second, as a finding, never a crash.

**Normalise.** What goes over the wire:

```ts
type Snapshot = {
  version: number                         // increments on every rebuild
  entities: { projects: Record<Id, Project>; venues: Record<Id, Venue>; ... }
  relations: { projectFunding: [Id, Id][]; projectDataset: [Id, Id][]; ... }
  findings: Finding[]                     // from validate
}
```

Flat, JSON-safe, small: the whole hub is a few hundred kilobytes. Documents are not in it; `api/docs` serves one when a view opens it. That is the reason the cockpit's page is 8.8 MB and this one is not.

## Layer 2, code

### Server

**The socket.** One WebSocket per open page. Messages are `{channel, version, payload}`. Channels: `portfolio`, `sessions`, `git`, `slurm`, later `pty:<id>`. A page subscribes to the channels it needs; the server sends the current payload on subscribe and pushes on change. If a page falls behind, the server keeps only the latest payload per channel: the newest state is the only one that matters.

**Watchers.** Each channel has one watcher module that owns its `fs.watch` handles, debounces, rebuilds only what changed, and pushes. Portfolio watches the hub's YAML directories. Sessions watches `~/.claude/projects` (transcripts) and `~/.claude/sessions` (the registry). Git watches each workspace's `.git/index` and worktree and re-reads on change, no more often than every two seconds.

**Sessions.** Ports the cockpit's B1, B2 and B5 with their tests. Facts that cost real time to establish and must not be rediscovered:

- Transcripts: `~/.claude/projects/<slug>/<id>.jsonl`, 490 files and 1.2 GB on this machine. A 48 MB transcript folds in 0.2 s, so there is no size bound on a first read; a byte-offset cache means a later read takes only what was appended. Any change to the accumulator's shape bumps the cache version.
- Subagents are `tool_use` blocks named `Agent`, paired to their `tool_result` by id. `isSidechain` is false on every record everywhere and carries no information.
- The live registry: `~/.claude/sessions/<pid>.json`, with `sessionId`, `status` (`busy` or `idle`), `name`, `cwd`. Liveness is `kill(pid, 0)` plus a `procStart` match; the registry writes that stamp in UTC and `ps` reports local time, so the match parses both and allows two seconds.
- Grouping: workspace by walking up to `.git`; area scored from touched files with the cwd counting double, directories clamped to two segments below the workspace root, known project folders exempt from the clamp.
- Context occupancy is the last assistant turn's `input + cache_creation + cache_read`, never the lifetime sums.

**Git.** Exactly four read-only commands (`rev-parse --abbrev-ref HEAD`, `rev-list --left-right --count`, `status --porcelain=v1 -z`, `diff --numstat -z`), one subprocess call site, a five-second timeout, list arguments only. No writing subcommand appears in the module, and a test asserts it. Git writes are Axel's alone; the commit action (step 6) runs `git commit` only from an explicit click carrying the write token, and nothing else in the application can reach that endpoint.

**PTY** (step 6). Sessions run inside tmux (`tmux new-session -d -s ock-<id> claude`), so they outlive the server. oculus attaches a pty to the tmux session and bridges it over the `pty:<id>` channel; the page renders it with xterm.js. A session started elsewhere is observed (transcript only) until Axel explicitly resumes it into tmux with `claude --resume <id>`; nothing migrates on its own. The server sends no signal to any registry pid other than the liveness probe.

**Auth.** The server binds 127.0.0.1. Every request is checked against `Origin` and `Sec-Fetch-Site`; a request from another origin is refused, since any page open in the browser can address localhost. Writes additionally carry a token minted at server start and delivered to the page once. The socket accepts nothing from the page except subscriptions and, later, terminal input.

### Client state

Svelte 5 state modules (`.svelte.ts`). `entities` holds the latest payload per channel. `selectors` computes the joins (`projects` with venue, funding, datasets; `sessionsByProject`; `workspaces`). `layout` holds the tree below. `ui` holds theme and per-view-instance state such as selection and filters. `layout` and `ui` persist to `localStorage` under one versioned key. Views read selectors and write `ui`; they never touch `entities` directly.

## Layer 3, view

**Primitives** (`ui/`): `Card`, `Chip`, `Meter`, `Table`, `Pane`, `Tabs`, `Sash`, `Empty`, `Toolbar`. Props are values and callbacks; a `Chip` takes a label and a tone. Nothing here imports state or knows what a project is.

**Shell** (`shell/`): the workbench. An activity rail on the left selecting what the rail lists; a main area with tabs; a panel that docks right, bottom, or hidden; sashes between all of them. The shell renders the layout tree and mounts whatever view instance a pane names. It does not import any view by name; views register themselves in a registry keyed by `ViewId`.

**Views** (`views/`): one file per surface. A view reads selectors, composes primitives, writes its own instance state. It does not know whether it sits in the main area or the panel, and it has no internal multi-pane layout. Sessions is therefore six views, arranged by a saved default layout, not one view with three panes inside.

**Boundaries**, enforced by `tests/boundaries.test.ts` over the import graph:

| From | May import | May not import |
|---|---|---|
| `ui/` | `ui/`, `themes/`, `state/text` | `state/*` otherwise, `views/`, `shell/`, `server/` |
| `shell/` | `ui/`, `state/layout`, `state/drag`, `state/ui`, `state/text`, `state/appearance`, `state/palette`, `state/palette-source`, `state/selection`, `state/terminals`, the view registry | any view by name, `server/` |
| `views/` | `ui/`, `state/`, `views/shared/`, its own partials under `views/<name>/` | `shell/`, `server/`, other views and their partials |
| `state/` | `data/model`, `data/guards` | `server/`, anything in layer 3 |
| `data/`, `server/` | `data/` | anything client-side |

SvelteKit enforces the last row's server half by refusing client imports of `$lib/server`.

A partial under `views/shared/` may import `ui/`, `state/` and `views/shared/`, and nothing under any other `views/<name>/`; nothing outside `views/` imports it. It is where a block two views draw the same way lives, the project card and the subtasks block being the two, so the alternative to a view importing another view's partial is one shared partial rather than a copy that falls behind.

## Layout as data

```ts
type ViewId   = 'focus' | 'projects' | 'archive' | 'venues' | ... | 'session-list' | 'terminal' | 'timeline' | 'changes' | 'agents'
type Instance = { id: string; view: ViewId; state: unknown }
type Layout =
  | { kind: 'split'; dir: 'row' | 'col'; sizes: number[]; children: Layout[] }
  | { kind: 'pane';  tabs: Instance[]; active: string }
```

The shell renders the tree; a sash drag edits `sizes`; opening a view appends an `Instance`; a drop moves an `Instance` between panes. The saved arrangement is the serialised tree. This is decided now, even though the first release offers only right, bottom and hidden for the panel, so that free-form docking later is an interaction added to existing data rather than a new model. Two instances of the same view have separate state by construction.

## Theming

`tokens.css` and `themes.css` port from the cockpit unchanged: colours, type scale, radii, fifteen theme blocks that override tokens and nothing else. VS Code Dark Modern and Light Modern are two more blocks, authored for oculus rather than ported, which is why a contrast failure in one of them is fixed in the block and a failure in a ported one is a finding about the port. The contrast test walks every text-on-background pair the primitives declare, under every theme, and fails below 4.5:1. Primitives use tokens only; a raw hex in a component is a test failure.

The wallpaper is one image behind everything, served by `api/wallpaper` from a directory `appearance.yml` names under the hub and nothing outside it. It is on where a theme's class carries `rice`, or under every theme where the config says `all`; the body then carries `wall`, and the panes, the rail and the menus keep a configured percentage of their own surface colour so the picture reads through them. The colour is still the token the contrast test measured.

The glyph vocabulary has an ASCII half, `glyphs.yml`'s `ascii:` map, keyed by the character. A terminal theme draws it unless the viewer asks for the real glyphs. The swap is a lookup where a glyph renders, in `ui/Glyph.svelte` and in `ui/Chip.svelte`'s data icon, and never a pass over the document.

## Hot reload

Three kinds of change, three mechanisms, no restart in any of them.

| Change | Mechanism |
|---|---|
| a component, a selector, a primitive | Vite swaps the module in the open page; state survives |
| a server module or an endpoint | Kit's dev server reloads it; the socket reconnects |
| a YAML file in the hub or in `config/` | the watcher rebuilds and pushes; identical in production |

## Relationship to the cockpit

- The cockpit is frozen at what it does on 2026-09-10, plus bug fixes. Nothing new is built there.
- No code is shared. oculus copies the config YAML into `config/` and the memory-tab images into its own assets; the copies are then oculus's.
- Both read the hub's data. After cockpit roadmap H (the private feeds move out of `tools/cockpit/data/` into the hub proper), the hub has one documented data path and oculus reads it from `local.yml`.
- The cockpit retires when the last view it still has and oculus does not has moved. The `.app` launcher then points at oculus.

## Conventions

- Every source file under 1000 lines. A file approaching it is split by concern, never by line count.
- Four-space indentation in every source file, by Axel's instruction of 2026-09-10. Prettier is the formatter, pinned in `.prettierrc` (`tabWidth: 4`, `useTabs: false`), with `npm run format` to apply it and `npm run format:check` as the fourth verification command beside `npm test`, `npm run check` and `npm run build`. A hand-formatted file is never the answer to a failing check.
- ASCII only in every authored file. Glyphs come from `glyphs.yml`, strings from `text.yml`, colours from `tokens.css`.
- One continuous line per paragraph and per bullet in Markdown and YAML; no hard wrapping.
- Plain prose in docs and comments; a comment says why, not what.
- No git command that writes is run by the application or by an agent working on it. Commits are Axel's, one request per commit.
- Work proceeds from the ledger in `.scratch/migration/` (the `.scratch/<feature>/` convention shared with cathedra): `plan.md` is the package list in execution order, `orchestrator-state.md` is read first after any compaction, and every package has a brief under `agents/briefs/` written from `agents/spec.md` and checked against the tree before dispatch. One agent at a time, Opus 5 or lower, never Fable, working in a git worktree at main's head; the result lands on main only by the orchestrator's `git cherry-pick` after the whole diff was read and the verification commands ran, and one package is one commit. Agents never run git and never edit the plan files.

## Migration order

Each step names what "done" means. Nothing visual before step 3.

1. **Cockpit H.** Private feeds moved to the hub proper; path resolution without environment variables. Done when the cockpit runs from the new paths and `tools/cockpit/data/` holds only config.
2. **Scaffold.** SvelteKit with the Node adapter, Svelte 5, Vitest. `lib/data` complete with per-source tests; `validate` reports zero findings on the real hub; `normalise` produces a snapshot; `server/socket` pushes it; the boundaries, contrast and keys tests pass on the ported tokens and catalog. Done when a bare page shows the snapshot's version number updating as a manifest is edited.
3. **The shell** (cockpit roadmap A). Workbench, activity rail, tabs, panel with right/bottom/hidden, sashes, the layout tree persisted, theme switching. Done when an empty view can be opened, arranged, and the arrangement survives a reload.
4. **Projects.** The first real view: cards, filters, the manifest edit form writing back through `api/write`. Proves the design system and the data layer on a static, simple case. Done at parity with the cockpit's Projects tab.
5. **Sessions** (cockpit roadmap B, D's read side, and E). The six session views and their default arrangement; the `sessions` and `git` channels; dismissal and pinning through `api/write`; the `Notification` and `Stop` hooks posting to the server (permission granted 2026-09-09) and the server firing a macOS notification through `osascript` the moment a session wants you. Done at parity with the cockpit's Sessions tab plus the notifications.
6. **Terminal** (cockpit roadmap C, then D's write side and G). tmux, the `pty` channel, xterm.js, the composer, explicit migration of an existing session. Then the git panel with staging and the token-guarded commit, then the deposit action with its dry run and the Data view's per-dataset recovery command.
7. **The remaining views** (cockpit roadmap F among them), in the order they are used: Focus, Archive, Coauthor, Venues, Funding, Data (with the per-dataset recovery command), Lit Watch, Leads, Inbox, LinkedIn, Live HPC, the file browser with bookmarks and notes, Memories, Help, Audit, Config.
8. **Retire the cockpit.** Launcher repointed; `tools/cockpit` archived; hub docs updated.

## Decisions taken

- 2026-09-10, name: `oculus`, at `research-hub/tools/oculus`.
- 2026-09-10, stack: SvelteKit with the Node adapter, Svelte 5, Vite, Vitest, TypeScript. The one enforced boundary (`$lib/server`) is the reason for Kit over bare Vite.
- 2026-09-10, live data: one WebSocket with channels, the server watches and pushes; no polling. Writes are `fetch` POSTs.
- 2026-09-10, wire model: entities and relations, joins in client selectors, documents on demand.
- 2026-09-10, layout: a serialisable tree from day one; the first release offers right, bottom and hidden for the panel.
- 2026-09-10, configuration regrouped, after Axel read the copied files: one concern per file (`sources`, `vocab`, `layout`, `behavior`, `appearance`, `meta`, `glyphs`, `text`, `manifest-schema`), the research domains' colours keyed `domains`, the UI theme list in `appearance.yml` as data rather than catalog strings, four cockpit-only keys dropped; package O10c. Appearance, in the same conversation: VS Code Dark Modern and Light Modern as two more themes, the wallpaper behind the panels, the glyph or ASCII toggle; package O10d.
- 2026-09-10, git writes and the deposit: a project's `code/` is ordinary tracked content of the hub and never carries a `.git` of its own. The deposit (O21) grows from a force-pushed snapshot into a repository with history that lives outside the hub tree: a mirror clone per deposit repo under the machine-local state folder, into which each deposit syncs `code/` (minus the deposit-exclude rules) and commits with a message, and from which the tool pushes, lists, creates and switches branches; every write behind the token and a confirm. A project that is also a public repository (engram) folds into the hub as tracked files, its GitHub history kept in the mirror. The git panel (O20) commits, pushes and manages branches on the sessions' workspaces the same way.
- 2026-09-10, sessions cover two agents and a shell: Claude Code transcripts (`~/.claude/projects`, with the pid registry) and Codex CLI rollouts (`~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`, no registry, liveness from a running `codex` process) fold into one record shape with a `tool` field, in O12; a terminal pane runs `claude`, `codex` or a plain shell inside tmux, in O17 to O19.
- 2026-09-10, after the Projects board was first used: a project opens as its own tab (`project` view, one instance per project, documents on demand through `api/docs`); a local HTML file under a configured root opens as a tab (`document` view over `api/file`, the roots in `sources.yml`, bookmarks in `layout.yml`, the two user manuals of cathedra and game-engine first); the rail draws a large `nav_groups` group as one button with a flyout, so it does not grow one icon per view; every control has an immediate tooltip. Packages O14b, O14c, O14d.
- 2026-09-10, docking, after the workbench was first used: tabs drag between panes and across the main and panel trees, a drop on a pane's edge splits it, a pane can be closed whole and maximised, all with keyboard equivalents; package O10b, on the tree operations O7 already has. The panel's own dock stays right, bottom or hidden.
- 2026-09-10, order: shell, then Projects, then Sessions. The simple view proves the stack before the complex one.
- 2026-09-10, sessions are six views, not one.
- 2026-09-10, the cockpit is frozen; B ports rather than being rebuilt.
- 2026-09-09, tmux is the session backend (installed, 3.7c); migration of a running session is explicit and per session.
- 2026-09-11, the pty bridge is tmux control mode and no native pty module: a terminal is a tmux session `oculus-<id>`, and the server holds one `tmux -C attach-session` client per attached terminal, since tmux streams `%output` only for the panes of the session a control client is attached to (measured on 2026-09-11; a single client per server, the earlier assumption, left a second terminal silent). Terminal input and resizes are accepted only on a socket whose subscription carried the write token.
- 2026-09-10, O1: `local.yml` carries `hub` (the research hub's absolute path, default two directories above `tools/oculus`) and `port` (default 8790; 8787 is the cockpit and is never used). The verification commands are `npm test`, `npm run check`, `npm run build`. The text catalog reaches the browser as the page's data at first load and afterwards by push over the socket like every other YAML (O6's watcher covers `config/` as well as the hub); the browser never fetches the YAML as a file. Until O6 exists, the server reads the catalog per request, so a browser reload shows an edit.
- 2026-09-11, pages, asked for by Axel after the boards, the sessions views and the terminal had each wanted their own arrangement: the workbench becomes one of several pages, each a whole workbench (its two trees, dock and panel share) with a name, and the saved layout is the list of pages plus which one is current, so the layout tree of "Layout as data" is unchanged and gains a level above it. A strip of page names runs across the top of the main area and the panel together, since a page governs both; the rail stays what it is. A page is made by a control at the end of the strip and named from its menu; the saved arrangements of `layout.yml` open as pages, which retires the control that swapped the one workbench for an arrangement and back. Switching pages unmounts the hidden page's views, which rebuild from the stores when it returns (a terminal repaints its scrollback), so nothing is drawn twice and no hidden terminal holds a client. Ctrl+1 to Ctrl+9 switch pages. Package O10e.

## Still undecided, and not needed yet

**The native window.** Whether the app eventually runs in its own window with a Dock icon and its own keyboard shortcuts rather than in a browser tab. Node makes Electron and Tauri candidates alongside pywebview. It is chosen after step 6, from how much the browser actually gets in the way with a terminal in it. Nothing before then depends on it.
