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
- ✅ C12 cockpit H1: feeds out of the engine folder into hub-root `feeds/`, runbook and search spec beside the skill, `email-tracker.md` deleted (1 commit, not yet committed)
- ✅ C13 cockpit H2: no environment variable configures the engine; `config.init(argv)`, `cockpit.local.yml`, flags; `setstatus` resolves against the configured root only; `COLL_STATUS` NameError fixed (1 commit, not yet committed)
- ✅ R1 hub: working rules in `CLAUDE.md`, git allowlist in `.claude/settings.local.json` (1 commit, not yet committed; orchestrator)
- ✅ O0 oculus: `DESIGN.md` and this folder (1 commit, not yet committed; orchestrator)
- S1 hub: a generic plan-orchestration skill under `.agents/skills/`, the cathedra one with its cathedra specifics removed (1 commit)
- O1 scaffold: SvelteKit with the Node adapter, Svelte 5, Vitest, TypeScript; `local.yml` resolution with the hub path; `tests/boundaries.test.ts`; an empty `+page.svelte` that renders (1 commit)
- O2 data sources, part one: `lib/data/model.ts`, `sources/manifests.ts`, `sources/registries.ts`, per-source tests on synthetic fixtures (1 commit)
- O3 data sources, part two: `sources/collections.ts`, `sources/docs.ts`, `sources/config.ts`, tests (1 commit)
- O4 data, validate and normalise: `validate.ts`, `normalise.ts`, `index.ts`; `tests/integrity.test.ts` reports zero findings against the real hub (1 commit)
- O5 themes and catalog: `tokens.css` and `themes.css` ported, `config/*.yml` copied in, `state/text.ts`, `tests/contrast.test.ts`, `tests/keys.test.ts` (1 commit)
- O6 socket: `server/socket.ts`, `watch/portfolio.ts`, `state/socket.svelte.ts`, `state/entities.svelte.ts`; the bare page shows the snapshot version change when a manifest is edited (1 commit)
- O7 shell, layout as data (cockpit roadmap A): `state/layout.svelte.ts` with the tree type, `ui/Sash.svelte`, `shell/SplitView.svelte`, persistence (1 commit)
- O8 shell, workbench (A): `Workbench`, `ActivityRail`, `Tabs`, `Panel` with right, bottom and hidden, the view registry, theme switching, `state/ui.svelte.ts` (1 commit)
- O9 primitives: `Card`, `Chip`, `Meter`, `Table`, `Pane`, `Empty`, `Toolbar`, every pair under the contrast test (1 commit)
- O10 Projects view: `state/selectors.svelte.ts`, `views/Projects.svelte` with cards and filters, parity with the cockpit's Projects tab (1 commit)
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

## Blocked, and by what
- O1 and everything after it: the rewind mechanism for agent work is Axel's to confirm. `/rewind` cannot undo an agent's edits or a commit; the proposed substitute is a worktree per package at main's head, landed by the orchestrator's cherry-pick after the diff is read, one commit per package, so undoing a package is `git revert` of one commit.
- S1: Axel raised the generic skill as a possibility; whether to build it is his call.
- O16: the settings.json edit was permitted on 2026-09-09; the exact JSON is shown before it is written, so this waits for that moment, not for a decision.
- O30: decided after O19 from experience, by design.
