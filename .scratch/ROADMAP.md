# Cockpit roadmap

**2026-09-10: the work moves to a new tool, `oculus`.** The cockpit is frozen at what it does today plus bug fixes. Everything from A onward is built in `oculus` instead: a Vite + Svelte app with three layers (data, code, view), one definition per screen rather than the current split between Python f-strings and client JS. Reason: the single-portable-file property that forced the no-build-step design is unused, so the awkwardness it bought (the morph, `data-skipmorph`, the hand-rolled `window.CK` module system, the config re-exec) buys nothing. Design: `oculus/DESIGN.md` once written. Nothing here is deleted; the table below says where each item now lands.

## Where each item lands

| Item | Lands as | Where |
|---|---|---|
| H, paths and private content out | step 1 | the cockpit, it has to happen here |
| new: scaffold, data layer, tests ported | step 2 | oculus |
| A, layout | step 3, now the app shell rather than one tab | oculus |
| B, sessions observe | step 4, ported to parity | oculus |
| D, git panel | step 4, part of Sessions | oculus |
| C, terminal | step 5 | oculus |
| E, notifications | after step 5 | oculus |
| F, file browser | step 6, a view like any other | oculus |
| G, deposit action, data command | step 6 | oculus |
| I, native window | REOPENED: Node removes the second-package-manager objection, so Electron and Tauri are back on the table beside pywebview | undecided, still last |

B is complete and shipped in the cockpit. It gets ported rather than rebuilt.

Work agreed on 2026-09-09. Reasoning and design detail live in `design/SESSIONS.md`; the mockup is `design/sessions-mockup.html`. Checked items are done and verified. Order of work and how tasks are split are at the bottom.

## Done

- [x] `claude` CLI path fix: `config.claude_bin()` resolves `claude_bin:` from `cockpit.local.yml`, then PATH, then the standard install dirs; the app launcher extends PATH so claude's own subprocesses resolve too
- [x] `tools/mcp` deleted, `CONTEXT.md` updated, stale `~/.claude.json` registration removed
- [x] design record and mockup written
- [x] fixed: a config edit killed the server when it had been started from anywhere but the engine directory, because the re-exec reused a relative `argv[0]`

## A. Layout, VSCode-style workbench

- [x] shape decided (2026-09-10): panes resize by sash, and the four views become ONE panel that docks right or bottom, chosen once. No free-form drag-to-dock: that is where the complexity lives and it is an arrangement people set once and never touch. The panel is per-tab, not page-wide, for now
- [ ] sashes with persisted sizes, and the panel's dock side (right / bottom / hidden)
- [ ] persist layout per view, restore on load
- [x] scope decided: ONE workbench tab (activity rail + main area with its own strip + dockable panel); the other 15 tabs unchanged. Files are a rail source inside it, not a separate tab. Full migration of every tab into the engine stays open as a later step
- [ ] keep it morph-safe (`data-skipmorph`) so live-reload does not wipe panes

## B. Sessions tab, observe half

- [x] transcript watcher tailing `~/.claude/projects/*/*.jsonl` (`src/cockpit/sessions.py`, `scan()` / `read_session()`, byte-offset cache at `~/.cockpit/transcript-cache.json`, 13 tests)
- [x] session model, attached vs observed (`kind` on every record; the PTY supplies the attached set in C)
- [x] served: a 4-second poller in `serve.py` and `GET /__sessions` in `serve_http.py`, no import cycle, `--no-sessions` disables it
- [x] two-level grouping: workspace by walking up to `.git`, then area scored from touched files, clamped to 2 segments below the workspace root with known project folders exempt (`src/cockpit/sessions_group.py`, 24 tests)
- [x] area labels wired to the existing Short/Full toggle
- [x] one row per session under its primary area, other areas as chips
- [x] manual pin and rename in `~/.cockpit/sessions.json` (read side; the UI writes it in B4)
- [x] rail with status dots, model, elapsed, current activity (`render/sessions.py`, `11-sessions.js`, `10-sessions.css`)
- [x] live vs ended from Claude Code's own registry (`~/.claude/sessions/<pid>.json`): real busy/idle status, ended sessions collapsed under a count, dismissal via `POST /__sessions-set` into `~/.cockpit/sessions.json`, a live session can never be hidden
- [x] Changes view: per-session touched files above the repository's staged/changed/untracked, read-only git only (`src/cockpit/sessions_git.py`, four commands, once per workspace on a 10 s timer), a file another live session holds is marked
- [x] Timeline view: prompts, tools, edits, turn durations and cache busts, newest at the foot, following only when you are already there
- [x] Agents view: `Agent` tool calls paired with their results, showing subagent type, model, status and duration
- [x] right pane: metadata, context meter (last turn's occupancy against 1M), token totals, cache TTL and busts
- [x] project cards cross-link to every session that touched them: a chip in the card head (visible collapsed) showing the session count and how many are live, click opens the Sessions tab on that session; primary and secondary areas both count, dismissed sessions do not; re-applied after the live-reload morph

## C. Sessions tab, attach half

- [ ] `brew install tmux`, sessions as `tmux new-session -d -s ck-<id> claude`
- [ ] vendor xterm.js and the fit addon into `assets/vendor/`
- [ ] `serve_pty.py`: spawn, ring buffer, in/out/resize/kill routes, long-poll first
- [ ] composer, plus human-driven routing into another session's stdin
- [ ] agent-driven routing directive, deliberately later
- [ ] migration path: `claude --resume <id>` into tmux, one at a time, explicit only
- [ ] `Origin` and `Sec-Fetch-Site` check plus a token minted at server start
- [ ] `Cockpit.app` attaches when the server is healthy and its code fingerprint matches the source, restarts when it does not; explicit Restart control in the Config tab; `.command` launcher unchanged

## D. Git panel

- [ ] per-file checkboxes defaulting to this session's touched set
- [ ] stage, unstage, add untracked, discard behind `uiConfirm`
- [ ] concurrent-edit warning when another live session touched the same file
- [ ] commit button reachable only with the UI token, no route from jobs or sessions
- [ ] message generation via one-shot `claude -p` over `git diff --cached`, editable box, no attribution trailer

## E. State and notifications

- [ ] `Notification` and `Stop` hooks in `~/.claude/settings.json` posting to a cockpit endpoint, each `curl -s -m 1 ... || true` so a stopped cockpit can never block a session (permission granted 2026-09-09). SHRUNK by B5: the registry already gives live busy/idle state, so what remains is the push, firing a notification the moment a session wants you
- [ ] server-side macOS notifications via `osascript`
- [x] running / idle / ended state, from the live registry rather than hooks or a transcript guess

## F. File browser and code window

- [ ] `/__fs` route serving allow-listed roots at a path-preserving prefix; roots are user-settable in-page with saved workspaces, vscode.dev style, default `~/workspace`
- [ ] file tree, plus rendering local HTML manuals with their relative assets intact
- [ ] syntax highlighting: vendor CodeMirror 6 or highlight.js rather than Monaco
- [ ] bookmarks as a collection YAML, editable in-page
- [ ] transient notes autosaved to a scratch dir, editable in-page
- [x] decided: not a separate tab. Files are the second source in the workbench's activity rail, so a session and the file it just edited stay visible together

## G. Tools

- [ ] `deposit.py` to a library, CLI preserved, cockpit action with dry run behind the commit token
- [ ] Data tab shows the exact per-dataset recovery command, `redownload.py` stays CLI-only
- [ ] `figures`, `present`, `skills` unchanged

## H. Paths, private content, publishing

- [x] the env vars are gone: `config.init()` resolves every setting once - a build.py flag, then `cockpit.local.yml`, then a default derived from `config.py`'s own location. Paths and hosts in `cockpit.local.yml`, timings and the chat model in `data/config/behavior.yml`, per-run switches as flags (`--no-git-sync` / `--no-slurm` / `--no-sessions` / `--restarted`)
- [x] `config.init(argv)` builds every setting and singleton once, before any other module imports; nothing is read at import time, and reading a setting before init raises
- [x] H1 done 2026-09-10: the three machine-written feeds (`inbox.yml`, `literature-radar.yml`, `position-leads.yml`) moved to hub-root `feeds/`; the litwatch runbook and the position-leads search spec moved beside the skill that reads them (`.agents/skills/research-cockpit/`); `email-tracker.md` deleted (a 2026-07-01 triage output nothing read, superseded by `inbox.yml`); `AUDIT_AUTO.md` generated beside `cockpit.html`; `tools/cockpit/data/` holds only `cockpit.yml`, `config/`, `HELP.md`
- [x] superseded 2026-09-10: genericising the cockpit's `HELP.md` and `text.yml` for publication no longer applies; the cockpit is frozen and retires, and oculus carries its own catalog
- [x] superseded 2026-09-10: the cockpit is not being published; oculus is the thing that may be

## I. Shell, after the tab is in use

- [ ] `pip install pywebview` into a dedicated `tools/cockpit/.venv`; both launch modes kept, a native window and the existing browser path
- [ ] native menu so Cmd-W, Cmd-T and Cmd-1..9 belong to the app

## Deferred, not tasks

- Node or Electron rewrite, revisit only if one language becomes a goal in itself
- clodex peering, teams, plugin API

## Order of work

1. **B, observe half.** Highest value for the work, and it shows the sessions you are already running without touching them. No risk to anything that exists.
2. **E, state and notifications.** Small, and it is what makes the tab useful when you are not looking at it.
3. **A, layout.** After B, so the docking system is designed against a real multi-pane case instead of a guess. B ships with the mockup's plain three-pane grid, which the workbench absorbs later without changing the DOM.
4. **C, attach half.** The terminal, tmux, and the security token.
5. **D, git panel.** Needs the token from C.
6. **G, tools.** Independent of everything else, good filler between the larger items.
7. **H, paths and private content**, then the public repo extraction. After the tab is stable, so the refactor moves finished code rather than code in flight.
8. **F, file browser and code window.** The largest new surface, and the one with the least urgency.
9. **I, pywebview.** Last, decided from friction rather than in advance.

## How the work is split

Each item gets a spec in `design/` before it starts (`spec-B1-transcript-watcher.md` is the first). Tasks that are self-contained and mechanically verifiable go to one agent at a time, on Opus, carrying the spec plus the rules in `CLAUDE.md` that the build gates enforce silently. Nothing counts as done until `bash tests/run.sh` passes and the full diff has been read. Tasks that cross those gates stay inline: the PTY and tmux module, the security model, the `config.init` refactor, and the layout engine.

## Who decides what

Autonomous, no asking: everything left in B; C's xterm vendoring, `serve_pty.py`, composer and routing; the whole of D including building the commit button; E's `osascript` notifications; F's bookmarks, notes and highlighter choice; G; H's `config.init` refactor; and all specs, tests, verification and doc upkeep.

One decision from Axel, then autonomous: A's layout and its scope (Sessions only or all 16 tabs); installing tmux; letting `Cockpit.app` stop restarting the server on each click; editing `~/.claude/settings.json` for the hooks, which affects every session on the machine; which roots `/__fs` may serve; whether the file browser is a tab or a docked panel; when the private content move happens, since the running server writes those files; and pywebview's environment plus the launcher change.

Always Axel's, no standing permission: any `git commit` / `merge` / `push` (one request licenses one action); migrating a live session into tmux; the real deposit run, which creates a public GitHub repo; extracting the engine to a public repo; installing software; editing global config outside the repo; and pressing commit, discard or any destructive control in the UI.

The test for anything unlisted: reversible, inside the repo, and cannot disturb running work. Two yeses and a no means do it and report afterwards. A spec that turns out wrong against real data always comes back to him rather than being quietly widened.
