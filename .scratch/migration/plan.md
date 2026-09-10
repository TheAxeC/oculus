# Migration plan: cockpit to oculus

Execution ledger for `tools/oculus/DESIGN.md`. One bullet is one package of work and one agent dispatch, except the bookkeeping packages the orchestrator does itself (marked). A package is ticked only after its verification commands ran and the orchestrator read the whole diff; the commands are in `orchestrator-state.md`, and nothing is ticked on inspection. The green checkmark is this file's status vocabulary by Axel's instruction of 2026-09-10; everything else in this folder is ASCII. Read `orchestrator-state.md` first after any context compaction. The lettering C, R, S, O is the ledger's own; the cockpit roadmap's letters A to I map onto the O packages as noted.

## Packages, in execution order
- ✅ C1 cockpit: `claude` CLI resolved when PATH is minimal (1 commit)
- ✅ C2 cockpit: `tools/mcp` deleted, stale registration removed (1 commit)
- ✅ C3 cockpit: Sessions design record and mockup (1 commit)
- ✅ C4 cockpit B1 and B2: transcript watcher, workspace and area grouping (1 commit)
- ✅ C5 cockpit B3: session poller and `/__sessions` (1 commit)
- ✅ C6 cockpit B4: Sessions tab shell and rail (1 commit)
- ✅ C7 cockpit: Map to Collections, rail toggle unclipped (1 commit)
- ✅ C8 cockpit B5: live and ended sessions from the registry, dismissal (1 commit)
- ✅ C9 cockpit B6: Timeline and Agents views, re-exec path fix (1 commit)
- ✅ C10 cockpit B7: Changes view over four read-only git commands (1 commit)
- ✅ C11 cockpit B8: project cards link to their sessions, tests README (1 commit)
- ✅ C12 cockpit H1: feeds out of the engine folder into hub-root `feeds/`, runbook and search spec beside the skill, `email-tracker.md` deleted (commit fc6d299, with C13)
- ✅ C13 cockpit H2: no environment variable configures the engine; `config.init(argv)`, `cockpit.local.yml`, flags; `setstatus` resolves against the configured root only; `COLL_STATUS` NameError fixed (commit fc6d299, with C12)
- ✅ R1 hub: working rules in `CLAUDE.md`, git allowlist in `.claude/settings.local.json` (commit f8af492, with O0; orchestrator)
- ✅ O0 oculus: `DESIGN.md` and this folder (commit f8af492, with R1; orchestrator)
- ✅ S1 hub: the generic `plan-orchestration` skill under `.agents/skills/plan-orchestration/` (commit 7c0ab4f; a rule removed afterwards in 5aaa29e and 72dd725)
- ✅ O1 scaffold: SvelteKit with the Node adapter, Svelte 5, Vite 8, Vitest 4, TypeScript; `local.yml` (`hub`, `port` 8790); `state/text.ts`; the built server answers on 8790 (1 commit)
- ✅ O2 data sources, part one: `lib/data/model.ts`, `sources/manifests.ts`, `sources/registries.ts`, tests, the read-only probe; zero findings on the real hub (1 commit; facts the tree taught are in the state file)
- ✅ O3 data sources, part two: `sources/collections.ts`, `sources/docs.ts`, `loadConfig` in `sources/config.ts`, tests; zero findings on the real hub (commit 91a0a40)
- ✅ O4 data, validate and normalise: `validate.ts`, `normalise.ts`, `index.ts` (`buildPortfolio`, `portfolioConfigFrom`, `HUB_CONFIG_TODAY` until O5), tests; `tests/integrity.test.ts` reports zero findings against the real hub, 91/70/49/9/12/11 entities and 7 collections (1 commit)
- ✅ O5 themes and catalog: `themes/tokens.css`, `themes.css` (fourteen token blocks, rice, crt), `derive.ts` and `parse.ts`; the six cockpit config files copied byte for byte plus `meta.yml`; `textCatalog` from the merged config; `HUB_CONFIG_TODAY` deleted, the integrity test derives its counts; `tests/contrast.test.ts` (1950 pairs, fifteen themes, none below 4.5:1), `tests/keys.test.ts`; `static/` deleted (1 commit)
- ✅ O6 socket: `server/channels.ts` (the hub, latest-only backpressure), `server/socket.ts` on `ws` with the origin check, `server/watch/portfolio.ts` (recursive `fs.watch`, `.yml` outside `code/` and `attic/`, 200 ms debounce, the `portfolio` and `config` channels), `state/socket.svelte.ts`, `state/entities.svelte.ts`, the socket in `vite.config.ts` for dev; seen in Chrome: the page showed snapshot version 1 with 91 projects and ticked to 2 when a manifest's mtime changed, no reload (1 commit)
- ✅ O7 shell, layout as data (cockpit roadmap A): `state/layout.ts` (the tree type, every operation pure, `checkLayout`, `parseLayout`), `state/layout.svelte.ts` (the store, `oculus.layout.v1`), `ui/Sash.svelte`, `shell/SplitView.svelte`; 47 layout tests, the split view rendered through `svelte/server`; seen in Chrome: two panes, the sash dragged 300 px, the sizes kept across a reload (1 commit)
- ✅ O8 shell, workbench (A): `shell/Workbench.svelte`, `ActivityRail.svelte`, `PaneView.svelte`, `ui/Tabs.svelte`, `Menu.svelte`, `Glyph.svelte`, `ui/theme.ts` (the derived tokens set on the document), `views/registry.ts` with the `status` and `findings` views, `state/ui.svelte.ts` (theme, crt, instance state under `oculus.ui.v1`), the workbench envelope version 2 (main tree, panel tree, dock, panel size); seen in Chrome: rail, tabs, panel right, bottom and hidden, mocha and back to light, all kept across a reload (1 commit)
- ✅ O9 primitives: `ui/Card`, `Chip`, `Meter`, `Table`, `Pane`, `Empty`, `Toolbar`, `ToolButton`, `Segment`, `Search`; `state/tones.ts` (config colours to hue names); the `gallery` view; `tests/ui/colours.test.ts` refusing any text colour outside the contrast test's measured pairs (one O8 declaration brought under it) and measuring the 75 `--on-<surface>` pairs; seen in Chrome under light and three terminal themes (1 commit)
- ✅ O10 Projects view: `state/board.ts` (presets, joins, buckets, facets, filters, search), `selectors.svelte.ts`, `views/Projects.svelte` registered as `projects`, `archive` and `coauthor`; the model gains `pin`, `compute`, `codeAvailability`, `reproduced`, `collaborators`, `venue`, `docs` and the `collaborators` check (zero findings on the hub); seen in Chrome against the cockpit on 8787: 50 project cards on both, the same chips, focus, compute, program and code on a sample card, ten facets, the list mode, the archive and coauthor boards (1 commit)
- ✅ O10b docking (A, asked for by Axel on 2026-09-10 after seeing O8): `state/layout.ts` gains `closePane`, `transfer`, `splitWith`, `maximise`, `restore` and the `focus` field; `state/drag.svelte.ts` (the one drag, the 6 px threshold, strip, edge and centre drops); `Tabs` reports presses and draws the insertion mark; `PaneView` has the edge zones and the pane menu (close, maximise or restore, move to the other tree, split right or down); `shell/DropLayer.svelte` draws the ghost and the indicator; 94 layout tests, 21 drag tests; seen in Chrome: a tab dragged from the main strip to the panel strip, a tab dropped on a pane's right edge splitting it, maximise from the menu, Escape restoring, the arrangement kept across a reload (1 commit)
- O10c config regrouped (asked for by Axel on 2026-09-10): the same keys, one concern per file: `sources.yml` (scan, the registry and collection paths, docs, the feed and site file pointers), `vocab.yml` (words and their colours only; `themes` renamed `domains`), `layout.yml` (the default arrangement, rail groups, board columns, `tab_rollup`), `behavior.yml` (thresholds and horizons only), `appearance.yml` (the UI theme list moved out of `text.js.theme`, wallpaper, crt), `meta.yml`, `glyphs.yml`, `text.yml`, `manifest-schema.yml`; dropped: `nav`, `tabs`, `coll_files`, `venue_categories` (derived from the venues registry); every key with a consumer in a later package stays; `DESIGN.md`'s "seven files" sentence rewritten (1 commit)
- O10d appearance: the `vscode-dark-modern` and `vscode-light-modern` theme blocks; wallpaper behind the panels with the transparency that goes with it, chosen from `appearance.yml`, persisted in `ui.svelte.ts`; the glyph and ASCII stand-in toggle from `glyphs.yml` `ascii:` (1 commit)
- O11 writes: `server/auth.ts` with the origin check and the token, `routes/api/write`, the manifest edit form (1 commit)
- O12 sessions, server (B): `server/sessions/transcripts.ts`, `registry.ts`, `group.ts` ported with their tests (1 commit)
- O13 sessions, channels (B, D read side): `watch/sessions.ts`, `server/git.ts` with its four read-only commands and the test that asserts nothing else, `watch/git.ts`, the `sessions` and `git` channels (1 commit)
- O14 sessions, views (B): `SessionList`, `SessionDetail`, `Timeline`, `Changes`, `Agents`, a `Terminal` placeholder, the default arrangement (multiple commits, one per view)
- O15 sessions, writes and cards (B): dismiss and pin through `api/write`; project cards showing their sessions (1 commit)
- O16 notifications (E): `Notification` and `Stop` hooks in `~/.claude/settings.json`, the server endpoint, the `osascript` push (1 commit)
- O17 terminal, server (C): `server/pty.ts`, sessions inside tmux, the `pty:<id>` channel (1 commit)
- O18 terminal, view (C): xterm.js vendored, `Terminal.svelte`, the composer, human routing into another session (1 commit)
- O19 terminal, migration (C): explicit `claude --resume <id>` into tmux, one session per command (1 commit)
- O20 git panel (D write side): staging, unstaging, discard behind confirm, marks for files another live session holds, the token-guarded commit, message generation by one-shot `claude -p` (multiple commits)
- O21 tools (G): deposit as a library with the dry run behind the token; the Data view's per-dataset recovery command (1 commit)
- O22 view: Focus (1 commit)
- O23 views: Archive, Coauthor (1 commit)
- O24 views: Venues, Funding (1 commit)
- O25 views: Data, Lit Watch, Leads, Inbox, LinkedIn (multiple commits, one per view)
- O26 view: Live HPC (1 commit)
- O27 file browser (F): `/__fs` over user-set roots and saved workspaces, the tree, local HTML with relative assets, CodeMirror 6 or highlight.js, bookmarks as a collection, transient notes (multiple commits)
- O28 views: Memories with the copied images, Help, Audit, Config (multiple commits)
- O29 retire (step 8): launcher repointed, `tools/cockpit` archived, the `research-cockpit` skill and the hub docs updated, this folder deleted (multiple commits)
- O30 native window (I): Electron, Tauri or pywebview, chosen after O19 from how much the browser gets in the way with a terminal in it (1 commit)

## Could run in parallel
Independent of each other; the standing rule of one agent at a time still serialises them.
- S1 with anything after R1.
- O5 with O2 to O4.
- O9 with O7 and O8.
- O12 with O7 to O11.
- O22 to O28 with each other once O10 has landed.

## Rulings (2026-09-10)
- Agent work and `/rewind`: an agent works in a git worktree at main's head, its result lands only by the orchestrator's `git cherry-pick -n` after the diff is read, one package is one commit, and undoing a package is `git revert` of that commit. Agreed by Axel; unblocks O1.
- S1 is wanted, generic across code tools, research projects, funding proposals and manuscripts, and meant to be installable user-level so cathedra and game-engine can replace their local copies. Agreed by Axel.

## Blocked, and by what
- O16: the `Notification` and `Stop` hooks exist since 2026-09-10 in the hub's `.claude/settings.local.json`, written by Axel: `curl -s -m 1 -X POST http://127.0.0.1:8790/api/hook -d @- || true`, timeout 5, verified by parsing the file. Project scope, so they fire only for sessions started in the research hub; sessions in other repositories show registry state, not hook state, until the same block is in `~/.claude/settings.json`. Whether to move it there is Axel's call. O16 itself now needs only the endpoint and the `osascript` push; nothing blocks it after O13.
- O30: decided after O19 from experience, by design.
