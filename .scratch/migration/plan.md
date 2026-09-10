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
- ✅ S1 hub: a generic plan-orchestration skill under `.agents/skills/plan-orchestration/` (`SKILL.md` 86 lines, four templates, the `.claude/skills` symlink): the mechanics with every project specific read from the ledger folder's configuration block (verify, worktree_paths, standards, executor, model); executors `agent`, `academic-paper`, `inline`. Landed 2026-09-10 from worktree `s1` by cherry-pick; six checks green in the worktree and on main. Two flaws in the brief, corrected by the orchestrator on main: check 2's `rite\b` matched "write" (the skill had avoided the word; restored, pattern now `\brite\b`), and check 6 fired on the frontmatter (the agent had padded it with comments; removed, the check now skips the frontmatter). First package run under the worktree-and-cherry-pick mechanism (1 commit)
- ✅ O1 scaffold: SvelteKit 2.63 with the Node adapter, Svelte 5.56, Vite 8, Vitest 4.1, TypeScript 6; `loadLocal` resolving `local.yml` (`hub`, `port` 8790) with derived defaults; `state/text.ts` with `t()` over a catalog shipped as page data and a server hook that sets the document title from it; `tests/boundaries.test.ts` with a negative fixture, `config.test.ts`, `text.test.ts`; `src/server.ts` the Node entry on 127.0.0.1:8790. Landed 2026-09-10 from worktree `o1` by cherry-pick; 10 tests, `svelte-check` 0/0, build, server answered `<title>oculus</title>`, all green in the worktree and on main. Additions beyond the brief, accepted: `@types/node` (types only, needed by `svelte-check`), `hooks.server.ts` (the title is a catalog string and a client-rendered shell has no page data). Sharp edges recorded in the state file: npm 10.9.2 cannot regenerate the lockfile (`--legacy-peer-deps` once; `npm ci` works from it), `.npmrc engine-strict=false` because Node 23 is outside Vite's and Vitest's declared engines (1 commit)
- ✅ O2 data sources, part one: `lib/data/model.ts` (Raw records with provenance, the six entities O4 fills), `sources/manifests.ts` (the tier walk, to any depth under a nested tier, stopping at a project, never into `code/` or `attic/`), `sources/registries.ts` (per-registry id field: `id` in venues, `key` elsewhere, funding's optional by its own schema), 14 tests on synthetic fixtures, a read-only probe. Landed 2026-09-10 from worktree `o2` by cherry-pick; 24 tests, `svelte-check` 0/0, build, the probe reading 91 manifests and 70/49/9/12/11 registry entries with zero findings, green in the worktree and on main. Two premises of the brief were wrong on the tree and are corrected in the code with evidence: nested projects sit under year folders two levels deep (30 of 41), and venues are keyed by `id` (1 commit)
- ✅ O3 data sources, part two: `sources/collections.ts` (`readCollections(hub, files)`, meta kept untouched, entries with `{file, index}` provenance, no identity derived), `sources/docs.ts` (`readDoc` splitting frontmatter, `projectDocs` presence of the six fixed names, never under `attic/`), `sources/config.ts` gaining `loadConfig(engine)` (every `config/*.yml` merged top-level in name order, a duplicate key a finding), `model.ts` gaining `RawEntry`, `RawCollection`, `DocPresence`, `Entry`, `Collection`. Landed 2026-09-10 from worktree `o3` by cherry-pick; 7 test files 51 tests, `svelte-check` 0/0, build, format, the probe reading 8 collections (statements 2, funding 11, events 7, education 21, applications 25, collaborations 13, tasks 3, code 20) and document presence over 91 folders (README 59, PRESENT 17, RESULTS 3, code/README 24, main.pdf 47, main.tex 23) with zero findings, green in the worktree and on main. One premise of the brief was wrong: README.md is present in 59 project folders, not 89 (1 commit)
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

## Rulings (2026-09-10)
- Agent work and `/rewind`: an agent works in a git worktree at main's head, its result lands only by the orchestrator's `git cherry-pick -n` after the diff is read, one package is one commit, and undoing a package is `git revert` of that commit. Agreed by Axel; unblocks O1.
- S1 is wanted, generic across code tools, research projects, funding proposals and manuscripts, and meant to be installable user-level so cathedra and game-engine can replace their local copies. Agreed by Axel.

## Blocked, and by what
- O16: the `Notification` and `Stop` hooks exist since 2026-09-10 in the hub's `.claude/settings.local.json`, written by Axel: `curl -s -m 1 -X POST http://127.0.0.1:8790/api/hook -d @- || true`, timeout 5, verified by parsing the file. Project scope, so they fire only for sessions started in the research hub; sessions in other repositories show registry state, not hook state, until the same block is in `~/.claude/settings.json`. Whether to move it there is Axel's call. O16 itself now needs only the endpoint and the `osascript` push; nothing blocks it after O13.
- O30: decided after O19 from experience, by design.
