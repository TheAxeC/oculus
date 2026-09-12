# Migration plan: cockpit to oculus

Execution ledger for `tools/oculus/DESIGN.md`. One bullet is one package of work and one agent dispatch, except the bookkeeping packages the orchestrator does itself (marked). A package is ticked only after its verification commands ran and the orchestrator read the whole diff; the commands are in `orchestrator-state.md`, and nothing is ticked on inspection. The green checkmark is this file's status vocabulary by Axel's instruction of 2026-09-10; everything else in this folder is ASCII. Read `orchestrator-state.md` first after any context compaction. The lettering C, R, S, O is the ledger's own; the cockpit roadmap's letters A to I map onto the O packages as noted.

## Packages, in execution order

One line per package: the status mark, the id, the title, and where the rest is (the brief, the review, the landing note in `orchestrator-state.md`). Lean by Axel's rule of 2026-09-12; nothing about a package lives only here.
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
- ✅ O4 data, validate and normalise: `validate.ts`, `normalise.ts`, `index.ts` (landed; brief `agents/briefs/O4.md`)
- ✅ O5 themes and catalog: `themes/tokens.css`, `themes.css` (landed; brief `agents/briefs/O5.md`)
- ✅ O6 socket: `server/channels.ts` (landed; brief `agents/briefs/O6.md`)
- ✅ O7 shell, layout as data (landed; brief `agents/briefs/O7.md`)
- ✅ O8 shell, workbench (landed; brief `agents/briefs/O8.md`)
- ✅ O9 primitives: `ui/Card`, `Chip`, `Meter`, `Table`, `Pane`, `Empty`, `Toolbar`, (landed; brief `agents/briefs/O9.md`)
- ✅ O10 Projects view: `state/board.ts` (landed; brief `agents/briefs/O10.md`)
- ✅ O10b docking (landed; brief `agents/briefs/O10b.md`)
- ✅ O10c config regrouped (landed; brief `agents/briefs/O10c.md`)
- ✅ O10d appearance: the `vscode-dark-modern` and `vscode-light-modern` theme blocks (landed; brief `agents/briefs/O10d.md`)
- ✅ O11 writes: `server/yaml-edit.ts` (landed; brief `agents/briefs/O11.md`)
- ✅ O12 sessions, server (landed; brief `agents/briefs/O12.md`)
- ✅ O13 sessions, channels (landed; brief `agents/briefs/O13.md`)
- ✅ O14 sessions, views (landed; brief `agents/briefs/O14.md`)
- ✅ O14b project tab and rail tooltips (landed; brief `agents/briefs/O14b.md`)
- ✅ O14c document tabs (landed; brief `agents/briefs/O14c.md`)
- ✅ O14d rail groups (landed; brief `agents/briefs/O14d.md`)
- ✅ O15 sessions, writes and cards (B): dismiss and pin through `api/write`; project cards showing their sessions (1 commit)
- ✅ O16 notifications (E): `Notification` and `Stop` hooks in `~/.claude/settings.json`, the server endpoint, the `osascript` push (1 commit)
- ✅ O17 terminal, server (landed; brief `agents/briefs/O17.md`)
- ✅ O18 terminal, view (C): xterm.js vendored, `Terminal.svelte`, the composer, human routing into another session; the new-terminal control offers the three kinds (1 commit)
- ✅ O19 terminal, migration (C): explicit `claude --resume <id>` and `codex resume <id>` into tmux, one session per command (1 commit)
- ✅ O20 git panel (landed; brief `agents/briefs/O20.md`)
- ✅ O19b transcript view (landed; brief `agents/briefs/O19b.md`)
- ✅ O21 tools (landed; brief `agents/briefs/O21.md`)
- ✅ O10e pages (landed; brief `agents/briefs/O10e.md`)
- ✅ O22 view: Focus, the landing board: the model gains `priority`, `waitingOn`, `followups`, (landed; brief `agents/briefs/O22.md`)
- ✅ P0 parity audit (landed)
- ✅ P1 writes foundation: `POST /api/write` gains `kind: 'entry'` (landed; brief `agents/briefs/P1.md`)
- ✅ P2 Focus parity (landed; brief `agents/briefs/P2.md`)
- ✅ P3 boards parity (landed 2026-09-11; brief `agents/briefs/P3.md`)
- ✅ P4 collections parity (landed 2026-09-11; brief `agents/briefs/P4.md`)
- ✅ Q1 consolidation (landed 2026-09-11; brief `agents/briefs/Q1.md`)
- ✅ Q2 browser test layer (landed 2026-09-11; brief `agents/briefs/Q2.md`)
- ✅ O22b view: the career panel, folded into P2 on 2026-09-11 and landed with it (landed; brief `agents/briefs/O22b.md`)
- ✅ O23 views: Archive, Coauthor: landed with O10, which registered the one board three times (landed)
- ✅ O24a the metalist editor, the entry form as the shared partial `views/shared/EntryForm.svelte`, the three registries carried as collections, and the Venues view (landed 2026-09-11; brief `agents/briefs/O24a.md`; review `agents/reviews/O24a.md`)
- ✅ O24b Programs, Domains and Map (landed 2026-09-11; brief `agents/briefs/O24b.md`; review `agents/reviews/O24b.md`)
- ✅ O25a the Data view with the per-dataset recovery terminal (landed 2026-09-11; brief `agents/briefs/O25a.md`; review `agents/reviews/O25a.md`)
- ✅ O25b Lit Watch and the feed module (landed 2026-09-11; brief `agents/briefs/O25b.md`; review `agents/reviews/O25b.md`)
- ✅ O25c the Position Leads view (landed 2026-09-12; brief `agents/briefs/O25c.md`; review `agents/reviews/O25c.md`)
- ✅ O25d the Inbox view (landed 2026-09-12; brief `agents/briefs/O25d.md`; review `agents/reviews/O25d.md`)
- ✅ O25e the LinkedIn view (landed 2026-09-12; brief `agents/briefs/O25e.md`; review `agents/reviews/O25e.md`)
- ✅ O25f the Update action and the Cmd-K search (landed 2026-09-12; brief `agents/briefs/O25f.md`; review `agents/reviews/O25f.md`)
- ✅ O25g the Focus ticker's feed lines open their views (landed 2026-09-12; brief `agents/briefs/O25g.md`; review `agents/reviews/O25g.md`)
- ✅ O26 view: Live HPC (landed 2026-09-11; brief `agents/briefs/O26.md`)
- ✅ Q4a the rail: counts and badges, the groups, the foot controls, the tray's place (landed 2026-09-12; brief `agents/briefs/Q4a.md`; review `agents/reviews/Q4a.md`)
- ✅ Q4b the views: one type scale, the terminal's size control, the folded groups' look, the cards' surface, the intro block (landed 2026-09-12; brief `agents/briefs/Q4b.md`; review `agents/reviews/Q4b.md`; the pillar tone rule is open for Axel)
- ✅ Q5 several sessions and terminals at once: pinned panes with labelled tabs (Axel's option A; landed 2026-09-12; brief `agents/briefs/Q5.md`; review `agents/reviews/Q5.md`; the collision rule on Pin is open for Axel)
- ✅ Q6 the counts on the pane tabs, with the cockpit's splits and rollups (landed 2026-09-12; brief `agents/briefs/Q6.md`; review `agents/reviews/Q6.md`; `tab_split` is a new config key)
- Q7 the type of every view against the cockpit, an app-wide text size control, the terminal's reflow after a size step (Axel, 2026-09-12 19:40: every view, side by side with the cockpit; runs after Q6; brief `agents/briefs/Q7.md`)
- Q8 the project cards and the Focus board as the cockpit has them: ghost folders (no manifest), the waiting-on / under-review / blocked line, copy context, open folder, the human and public marks on document links, the cockpit's cross-link words, the Funding, Job applications and Teaching lanes, the "manifests behind their docs" line, the "not on the board" hint, the entry reorder grip (Axel's parity decisions of 2026-09-12; brief at dispatch)
- Q9 the feed writes the cockpit has: lead mute with a Muted section, LinkedIn idea editing in place through a Markdown editor pane (Axel's parity decisions of 2026-09-12; brief at dispatch; the editor is shared with O27b's notes)
- Q10 the map's link mode: drag one project onto another to add or remove a related edge, written to the manifest (Axel's parity decision of 2026-09-12; brief at dispatch)
- Q11 chat about a project as a claude terminal started in the project's folder, the way the Update tasks run (Axel agreed 2026-09-12; brief at dispatch)
- O27a the file browser: roots, saved workspaces, the tree and the file view (brief `agents/briefs/O27a.md`)
- O27b the file browser: bookmarks as a collection and transient notes (`~/.oculus/bookmarks.yml`, `~/.oculus/notes/`, `notes.autosave_ms`; brief at `agents/briefs/O27b.md`) (1 commit)
- O28 views: Memories with the copied images, Help, Audit, Config, and the cockpit's three document tabs of the More group (`RESEARCH-APPROACH.md`, `AGENT-APPROACH.md`, `HPC-UTwente-howto.md`) as O14c document tabs in the rail's More group rather than as user bookmarks (multiple commits)
- R2 release readiness (booked 2026-09-11 at Axel's instruction, after the comparison with the cockpit): a `README.md` with a quickstart (clone, `npm ci`, `local.yml`, `npm run build`, `node src/server.ts`); a demo hub as the cockpit's `dummy/` twin is (synthetic projects, registries, collections and feeds over the same config vocabulary, so a stranger sees every view with data and the hub's own files never ship); a licence file, MIT (Axel, 2026-09-11); a pass over the config defaults for anything that is the hub's rather than the tool's (the career file name, the feeds folders, the hub path, the `~/.oculus` state folder, every name in `text.yml` and `layout.yml`), each moved behind a `sources.yml` or `local.yml` key with a neutral default; runs after O28 and before O29 (multiple commits)
- O29 retire (step 8): launcher repointed, `tools/cockpit` archived, the `research-cockpit` skill and the hub docs updated, this folder deleted (multiple commits)
- ✅ X1 execution exercise of the plan-orchestration skill (landed)
- X2 second execution exercise of the plan-orchestration skill (booked 2026-09-11, Axel's green light on the orchestrator's recommendation after X1): on the disposable scratch repository again, the four paths X1 did not reach, each forced on the orchestrator's side: a conflict at the cherry-pick (an edit to the same line committed on main after the worktree is cut), a red check on main after a clean landing (a main-side commit that applies cleanly and breaks the package's tests, so step 12's take-out runs on a failure), a range of more than one wip commit (the repair round run after a first landing attempt), and a dead worker (the process killed mid-run, then the resumption rule). The record goes into `agents/reviews/x2-exercise.md`; a rule that fails is corrected in the skill. Inline, the orchestrator's own work; runs at the next pause, after O27 (1 commit)
- ✅ Q3 workbench and view polish (landed 2026-09-12; brief `agents/briefs/Q3.md`; review `agents/reviews/Q3.md`)
- ✅ Q3b the terminal pane (landed 2026-09-12; brief `agents/briefs/Q3b.md`; review `agents/reviews/Q3b.md`)
- O31 worker sessions (booked 2026-09-11 at Axel's instruction, after O26 showed a Codex worker is invisible to oculus): a worker dispatched on the other harness has no link to the orchestrating session in any file, so the orchestrator writes a dispatch note at launch (`~/.oculus/dispatches.json`, one record per dispatch: the package, the worktree, the harness and model, the orchestrating session's id, the worker's rollout or transcript path once known, the launch and exit times) and the sessions layer reads it, so the sessions views group the worker under its orchestrator the way a Claude sub-agent is grouped under its parent, and a Codex worker's rollout (kept, since the launch recipe dropped `--ephemeral`) is listed with its usage; the plan-orchestration skill's launch step writes the note; brief to write when the pause lifts (1 commit)
- O30 native window (I): Electron, Tauri or pywebview, chosen after O19 from how much the browser gets in the way with a terminal in it (1 commit)

## Could run in parallel
Independent of each other; the standing rule of one agent at a time still serialises them.
- S1 with anything after R1.
- O5 with O2 to O4.
- O9 with O7 and O8.
- O12 with O7 to O11.
- O22 to O28 with each other once O10 has landed.

## Rulings (2026-09-10)
- 2026-09-12 20:15, Axel, on the parity audit (every difference between a landed view and its cockpit tab): items 1 to 11 and 17 are ported as the cockpit has them (Q8, Q9, Q10); 12 (Chat) becomes a claude terminal in the project's folder (Q11); 14 (+ status) and 15 (built date) are dropped; 13 (Slides and Present) and 16 (the fetch window) are open, to be redone: the deck is built by `tools/present/build.py` and the cockpit is retired, so Present is not a link to a cockpit artefact. Standing rule from the same day: oculus is a port of the cockpit; any difference must be explicitly allowed by Axel.
- Agent work and `/rewind`: an agent works in a git worktree at main's head, its result lands only by the orchestrator's `git cherry-pick -n` after the diff is read, one package is one commit, and undoing a package is `git revert` of that commit. Agreed by Axel; unblocks O1.
- S1 is wanted, generic across code tools, research projects, funding proposals and manuscripts, and meant to be installable user-level so cathedra and game-engine can replace their local copies. Agreed by Axel.
- Agents may run on Codex for the O26 trial (Axel, 2026-09-11), an exception to the rule that agents are Opus 5 or lower: the same brief, spec, worktree, checks and diff read apply, and the agent still runs no git command; whether the exception widens to other packages is decided from the O26 usage row. Packages that install dependencies stay on Opus until Codex's sandbox and network settings are settled.
- The Codex trial held (O26 landed on the second run within the Opus rows' fix range), so the worker is chosen per package and Axel opts for Codex `gpt-5.6-sol` as the default worker from O24 on, effective when the pause lifts (Axel, 2026-09-11: "i would opt for sol now, but we're still paused"). R2's licence is MIT (Axel, 2026-09-11).
- The Funding view's "No funding" card counts the active and manuscript projects with no scheme (Axel, 2026-09-11, at the P4 landing: "Agree with the live count"). The cockpit's card counts every project outside the dead archive types, ideas included; oculus does not follow it. The rule is `noFunding()` in `state/collection.ts`.

## Blocked, and by what
- O16: no longer blocked. The `Notification` and `Stop` hooks exist since 2026-09-10 in the hub's `.claude/settings.local.json` and, Axel said the same day, in cathedra's and game-engine's local settings too, written by Axel: `curl -s -m 1 -X POST http://127.0.0.1:8790/api/hook -d @- || true`, timeout 5, verified by parsing the file. Project scope, so they fire only for sessions started in the research hub; sessions in other repositories show registry state, not hook state, until the same block is in `~/.claude/settings.json`. Whether to move it there is Axel's call. O16 itself now needs only the endpoint and the `osascript` push; nothing blocks it after O13.
- O30: decided after O19 from experience, by design.
