Brief check of O114, read on main at f29684ef5 (`git rev-parse HEAD`). Nothing in the repository changed: `git status --short` prints the two entries it printed at the start, ` M .scratch/migration/orchestrator-state.md` and `?? .scratch/migration/agents/briefs/O114.md`.

The tmux runs used private sockets `/private/tmp/claude-502/o114b.sock` and `o114c.sock`. Both servers are killed and both socket files removed; `pgrep -fl o114` prints nothing. Those runs started real `claude` and `codex` in panes. No prompt was sent, and each agent left by keys (Escape at the trust question, C-c). Whether they left a startup record under `~/.claude` or `~/.codex` for the scratch folder is not verified.

The eight findings that matter most, each detailed below:
1. Item 6 does not see the steer box that already stands in `TerminalGrid.svelte:486`.
2. `agentOf` names `man claude` and `grep claude notes.txt` as an agent, and case 4's input avoids that.
3. A by-hand session with several panes paints every pane into one grid.
4. Accepting a resize on a by-hand id sets the user's window to `window-size manual`, against the brief's own line 116.
5. Three folders the brief puts new files in already hold ten items.
6. Item 9 and the "tests" of cases 1 to 13 need `agents/guarded.md`, which a builder may not edit, and the brief names no entry for detection or the tab state.
7. `composer.elsewhere` is false for an ended session.
8. A steer in the tick after an agent quits in a shell types the prompt into the shell and presses Enter.

# Names

Command: `grep -rnI --exclude=local.yml -E <name> src tests config docs README.md utils`, and `git grep -nIE "Transcript view|Transcript tab|transcript view|transcript tab|view: transcript|views/sessions/transcript"` over the tracked tree. `git grep` left out briefs, reviews, `plan.md` and the orchestrator files. Hits inside the write list are not repeated.

View `transcript`, "Transcript view", "Transcript tab":
- `.scratch/migration/agents/guarded.md:302` (G86) is outside the write list and becomes false. `agents/spec.md:36` forbids a builder from editing `.scratch/`, yet item 9 says "Move G86's wording and test names". O111's brief said "guarded.md is the orchestrator's at landing" (O111.md:86); O114's says nothing.
- `.scratch/migration/choices.md:424,509` and `.scratch/migration/queue.md:406` are log lines. Not made false.
- `tests/checks/config/config-folder.test.ts:329` names `views/sessions/transcript.yml`, which stays. Not made false.
- `README.md:16,25,37` say "transcript" generically. Still true.
- `docs/HELP.md:342` ("opens that agent's own transcript in a Transcript tab") is on a path in the list, but the brief's list and item 10 name only line 248, and the brief's own grep regex matches 342. It becomes false. `docs/HELP.md:453` ("Once an agent runs, the steer box sends more text") stays true.
- `sessions.turn_bar` (`config/text/views/sessions/transcript.yml:8`) has one reader, `Transcript.svelte:157`, so with no bar it is an orphan key and the orphan test fails. It is on the write list, but item 1 says the file "stays".

`TERMINAL_ID` / `isTerminalId`:
- `src/lib/server/machine/runs/commands/run.ts:186,264,268` is outside the write list. `taskTerminal` (line 186) will pass `h3-claude`, and it then answers `terminal-ended` or `not-a-task`, where item 3 says restart refuses with `not-ours`. Internal path widening.
- These are in the listed folders and must move to `isOwnTerminal`, though the brief does not name them: `sessions.ts:423` (`foreign`), `sessions.ts:510` (`parsePanes`), `sessions.ts:679` (`startTerminal`'s `id`).

`Terminal` gains a required `agent`:
- `src/lib/server/machine/apps/tools/run/stream-terminals.ts:143` builds a `Terminal` literal and is outside the write list. The type check goes red unless it gains `agent: null`. Internal path widening.

Other names:
- `kindOf` (terminal one) has `sessions.ts:301,429` as its only hits, in the list.
- `SESSION_VIEWS` hits are only in `card.ts`, in the list.
- `sessionTerminal`'s rule is duplicated at `folds.ts:307-312` (`terminalChoices`): that code matches `one.pid`, which is false for a typed agent. The file is on the list, but item 4 does not name it, so a terminal row's description stays the tmux name.
- `SteerBox`: `TerminalGrid.svelte:51,487` is on the list but appears nowhere in "What is on the tree" or in item 6 (see Premises).
- `src/lib/state/sources/repositories/review-comment.ts:104` (`deps.terminal()`, then `deps.steer`) is outside the write list. It steers a session that a lock has made read-only (see Implied inputs).
- `SessionPicker` and `PickSession` stay in use by `SessionDetail.svelte:29-30,107,120`. Nothing is left unused.

# The step line

The line is at `plan.md:1601`. No part of it lacks text, and one part has no requirement under "What to build".
- "gains a Live / Transcript switch that shows the terminal's screen or the session's turns": items 1, 5.
- "the Transcript view and its tab go with every mention of them": items 1, 9, 10.
- "the steer box stays under both": item 6, which is wrong as written against `TerminalGrid.svelte:486` (Premises).
- "a session with no terminal (ended, or running elsewhere) opens in Transcript and is read-only": items 7 (last sentence), 8.
- "a live one has a lock that makes the box read-only": item 7, item 4 (`usable`).
- "a terminal's kind follows what runs in it": item 3.
- "`claude` or `codex` typed in a shell, or in a tmux session started by hand, gets the same view and the same box": items 3, 4, 5, 6.
- "layouts that name the Transcript view are changed once on the data, with no code that reads the old form": **no requirement in "What to build"** beyond `config/defaults/layout.yml` in item 1. It is covered only by Conventions (line 134), as the orchestrator's work. The target shape of a saved `{ view: transcript, state: { session, agent? } }` tab is stated nowhere. That transformation stays the orchestrator's, but it needs its shape written down before landing.

# Premises

The premises reproduce, apart from the findings below.

Finding, missing premise, the largest in the brief: `grep -n "SteerBox" src/lib/views/sessions/terminal/grid/TerminalGrid.svelte` prints `51:` and `487:`. Lines 197 and 486-488 draw `<SteerBox {terminal} />` in each grid while `terminal.kind !== 'shell'`.
- Today every agent or app terminal has a box, one per grid of a row, with or without a session record.
- Item 6 puts one box in `.side`'s column and never says the grid's goes.
- If the grid's box stays, Live draws two boxes.
- If it goes, a `-claude` terminal before its first session record, and an `app` terminal, lose the box they have today, and a split row loses all boxes but the shown one's. That makes the line "the steer box stays" false for that state.
- `TerminalGrid.svelte` is also missing from the brief's "Read" list.

Finding, folder rule (`utils/folder-check.sh`, ten items): `git ls-files <dir> | ... | sort -u | wc -l` prints:
- `10 src/lib/server/machine/pty`
- `10 src/lib/state/sessions`
- `10 src/lib/state/sessions/terminal`
- `10 src/lib/views/sessions/terminal`

So "a new file for item 3" in `pty/`, "a new file for item 8" in `state/sessions/`, and "a body component under `src/lib/views/sessions/terminal/`" each make 11, unless the builder regroups. The brief says none of this. The body's natural subfolder adds an item too. `views/sessions/terminal/bar` holds 2 and `list` holds 4; `views/sessions` falls to 4 once `transcript/` goes.

Finding, line caps (`wc -l`, limit 880, components 520, `spec.md:48`):
- `Terminal.svelte` 517
- `channel.ts` 876
- `context.ts` 873
- `terminals.svelte.ts` 870
- `sessions.ts` 863

Items 3, 5 and 7 take the first and second past their limit. Their splits need slots the full folders lack.

Premises rerun:
- `ls docs/adr` fails. Holds.
- `Transcript.svelte` 351 lines, `Terminal.svelte` 517 lines. Hold.
- The grep list (line 14): every line named reproduces. It omits `docs/HELP.md:342`.
- `kindOf` at `sessions.ts:301`, suffix first. Holds.
- tmux run on a private socket, sessions a to d. `list-panes -a -F '#{session_name} #{session_id} #{pane_current_command} #{pane_pid}'` printed `a $0 2.1.316 84525`, `b $1 2.1.316 84536`, `c $2 codex 84558`, `d $3 codex 84562`. `ps -o pid=,ppid=,command=` printed `84536 84515 zsh -f`, `84557 84536 claude`, `84562 84515 zsh -f`, `84569 84562 codex`. Holds in full.
- "`readTable` ... is the one place that runs `ps`" (line 17): false as worded. `grep -rnE "'ps'" src` finds `core/git/running.ts:118`, `sessions/stores/codex.ts:392`, `sessions/registry.ts:59`, `pty/tmux.ts:159`. `readTable` is the one reader of the whole table with command lines, which is what the premise needs. The conclusion stands.
- `sessionTerminal` at `terminal-lists.ts:204`, and `codexLive` carrying `pid: null`. Hold; the function is at `codex.ts:420`, and 417 is its doc comment.
- `parseTerminal` null without the prefix; `socketArgs` default server. Hold.
- SteerBox refusal, `composer.elsewhere`. Holds.
- `channel.ts:469-472`, `POLL_MS` 5000. Holds. But `#arm` at line 463 runs the fast rate only while `#attached.size > 0`, meaning a page attached to a `pty:` channel, which is narrower than item 3's "while a page is connected".
- `terminals.svelte.ts:814`, and `stopTerminal` refusing a bad id at `sessions.ts:771`. Hold.

Also read: `socket.ts:220` hands `Terminals.subscribed` every subscription, so `channel.ts` can see a connected page with no new path. Tmux targets by `$n` work on a real server, as `capture-pane -t '$3'` and `tmux -C attach-session -t '$3'` both answered.

# Cases and checks

- Cases 1 to 6 and 8 to 13 are written as "tests", yet no entry of `agents/guarded.md` covers them. `grep -n "readTab\|closeEnded\|sessionTerminal\|parseTerminal"` on it prints nothing. `spec.md:60` allows a test only under an entry, and says a step that needs a new entry stops and asks. Case 7 fits G35. The brief's line 87 ("only where the rules file's test rule calls for one") leaves the builder to stop at its first run or write none. O111 and O113 had the entry ruled first (Z1091, Z1097). Booking one is the orchestrator's; it is a fact a failure here would cost a wrong kind or a lost tab state, and the choice is an automode close.
- Item 9's G86 wording is outside what a builder may write (Names).
- Case 4 is inconsistent with its purpose: `vim claude.txt` passes only because the word differs from `claude` (The question, Implied inputs).
- Case 16 asks for a sentence that is false for an ended session (Dictated text).
- Cases 15 and 18 start `claude` by typing in a page's terminal and press Send. The state file's standing demand (line 67) says no agent is started from a page, and the look's scratch HOME has no login, so no session record and no box. Case 15's "Send reaches it" also spends tokens. The cases need a stated stand-in (a program named `claude` and a fixture record in the scratch HOME), or they cannot be run as written.
- Case 19's "Unknown view: transcript" checks a place the step does not change (`strip-tab.ts:45`, `workbench-title.ts:21`, `config/text/ui.yml:142`). It is a consequence of the removal and reads true, but Conventions has the orchestrator change saved layouts at landing, so the look must make a saved tab by hand.
- Case 8 checks `ps.ts`, unchanged, only through a double, which is fine.
- Case 11's list of rewriters is four of many. Every other rewriter also spreads `...state`; the risk sits in `readTab`'s literal objects (`terminal-tabs.ts:145-153,159-167`) and in `emptyTab`, which the case does not name.
- Case 12's second sentence (a tab reading Transcript of a live terminal closes under the reader when it ends) is a user-visible decision and is missing from "Decisions taken in this brief", against `spec.md:18`.
- `readTab`'s older-shape branches (`terminal-tabs.ts:13-16,155-167`) break `spec.md:43` and sit in a file the step changes. Removing them widens the step; marked for the orchestrator.
- The brief names no base copy or unused-exports base (`spec.md:33,89`). O113's brief named neither, so I take these as the builder prompt's.

# The question

Could this pass without the goal being reached? The goal is one Terminal view for a session, in which a claude or codex started in a shell or a hand-made tmux session gets the same view and box as one oculus started.

The check on the step's line: the line names no check. The landing list (`npm run diagrams && npm run docs:palette && npm run test:quick`) passes with every page case unmet, so the goal rests on the look alone. Cases 15 and 18 cannot run as written.

Items:
1. Yes as to the goal: the view can go while the turns draw nowhere usable. Removal is necessary and leaves HELP:342 and G86 false.
2. Yes: a shape alone reaches nothing, as expected of a shape.
3. Yes. It passes while `man claude` is an agent, while a two-pane by-hand session is garbled, while each view rewrites the user's window size, and while `claude` typed with no grid attached shows after 60 s, since `#arm` keys on `#attached`.
4. Yes. Two live Codex records in one folder both find the one codex terminal, and `folds.ts:307` keeps the old rule.
5. Yes. `showing: 'transcript'` on a terminal with no session is undefined, and the item can be met with a blank body.
6. Yes. Two boxes, or no box before the first record (Premises).
7. Yes as to the line's "read-only": `review-comment.ts:104` still steers a locked session.
8. Yes. The item never says what the press in the list does when a terminal joins a reading tab.
9. No: it restates G86's behaviour for one body, and the body's mount decides it.
10. No: words only.

Cases:
1, 2, 3. Yes: pure over fixed tables, and they prove the function, while the wiring into `Terminals.#read` is proved only by case 9.
4. Yes: its inputs avoid the second-word match.
5. No: it decides the pid.
6. Yes: a listed row passes with an unusable grid, and it has no case of `oculus-work` running claude, which item 3 names.
7. Yes: `$3` is whichever pane is active, and resize is outside the case.
8. No.
9. Yes: "A live driver" is the case with a control client, and the case that item 3 widens, a page with no `pty:` attachment, is not asked.
10. Yes: the inverse function that draws the switch has no case.
11. Yes: a `readTab` that drops the keys passes, since no round trip of a state with the keys is asked; only look 17 catches it.
12. No.
13. Yes: the retargeted tab and the one-per-session press with a folder have no case.
14. No.
15. Yes: it can pass on a stand-in with no real agent.
16. Yes: it passes with a false sentence.
17. Yes: a one-terminal tab says nothing of a split row.
18. Yes: on a one-pane session it misses the garbled grid, and it never reads `window-size`.
19. Yes, by absence, which is its purpose.

# Implied inputs

Each is missing from Cases. An item marked (widens) has a fix beyond the step's paths; (adds) adds a requirement or a case that serves the step's line.

1. `man claude`, `grep claude notes.txt`, `rg claude src`, `vim claude`, `less codex` in a shell terminal. A run of `agentOf` printed `"man claude" => claude`, `"grep claude notes.txt" => claude`, `"rg claude src" => claude`, `"vim claude" => claude`, `"less codex" => codex`, `"vim claude.txt" => null`. Expected: `kind` shell, `agent` null, no box. As built, Send types a prompt into `man`. The fix is a first-word rule in the new function, or a change to `match.ts`, which the brief keeps import-only and which the Processes view shares. (widens if `match.ts` changes)
2. Send pressed within the tick after the agent quit in a `-shell` terminal, or with a suspended `claude` under the shell. `steerArgs` types the text and Enter into zsh, which runs it as a command. Expected: the server checks before typing and refuses, with nothing typed. (adds)
3. A by-hand session with two panes or windows. On a private socket, one control client attached to `work` received `%output` from `%0`, `%1` and `%2` (`6 %0`, `3 %1`, `3 %2`). `channel.ts:235` drops the pane (`output: (_pane, bytes) => outputs(id, bytes)`) and its comment at line 204 says nothing maps pane ids. Expected: the grid shows the active pane alone. (adds; `channel.ts` is on the list)
4. The active pane of a by-hand session moves off the agent. `list-sessions` then reports another `pane_pid` (`work $0 2953 1 2`), the row leaves the list, `closeEnded` closes the tab, and a steer goes to `$n`, which is now that other pane. Expected: the tab stays while the agent runs, and a steer reaches the agent's pane or is refused.
5. A resize on a by-hand id. `resize-window -t '$3' -x 77 -y 21` changed `show-window-options -t '$3' window-size` from unset (global `latest`) to `window-size manual`. The grid's `ResizeObserver` sends one on every mount, so opening the session rewrites a window option on the user's own window. Line 34 says resize is accepted; line 34 also says no path "marks a session oculus did not start", and line 116 says "oculus never writes to it beyond typing the box and the grid send". The brief contradicts itself. Expected: decided in the brief. Refusing the resize leaves the grid and pane sizes apart.
6. `showing: 'transcript'` while the shown terminal has no session (agent quit in a shell, another row pressed). Expected: the grids draw, with no switch and no box.
7. A terminal joining a tab that has `transcript` set. `pageTarget` picks that tab for an unowned terminal, and New Terminal starts there. Expected: `showing` goes to `live`, and the tab says what `transcript` becomes. Case 12 implies it is kept.
8. An ended session read in a tab, then resumed, so a terminal starts elsewhere. Item 5 keeps Live disabled and item 7 gives `composer.elsewhere` while the session has a terminal. Expected: the box steers that terminal.
9. Two live Codex records in one folder with one codex terminal, and a codex terminal whose `resumes` names another session. Expected: no folder match in either. Case 10 asks only the two-terminal form.
10. An agent quits in a by-hand session whose tab is open. Expected, by the rules as read: the id leaves the list and the tab closes as any. The brief is silent, and case 15 covers a shell only.
11. A locked tab in a split row with a plain shell beside the agent, and a locked terminal moved to another tab. `locked` is on the tab, while item 4 says "the terminal is not locked" and `SteerBox` receives a `Terminal`. Expected: stated in the brief.
12. A review comment sent from a diff to a locked session (`review-comment.ts:104`). Expected: refused. (widens: `src/lib/state/sources/repositories/review-comment.ts` is outside the write list)
13. A burst of tmux events. Reads run side by side (`channel.ts:24`), so "at most once per refresh" allows several `ps` children, against `ps.ts`'s head ("the watcher starts a call only when none is unsettled"). Expected: one child at a time.
14. The first list after a server start, with `readTable` failing. There is no last answer, so by-hand rows are missing, and `endedTerminals` with `first` true closes every tab holding one. Expected: those tabs stay.
15. A tmux server restart with a saved `h3-claude`. After `kill-server`, new sessions took `$0`, `$1`, `$2` (`x $0`, `y $1`, `oculus-h1-claude $2`). Expected: a saved tab does not attach to an unrelated session.
16. A session named `oculus-h1-claude` by hand. `terminalId` gives `h1-claude`, which the widened `TERMINAL_ID` accepts, and its `sessionName` is `$1`, here another session (`y $1`). Expected: `foreign`, tested by `isOwnTerminal`, with no target built from it.
17. A page connected with no grid (a tab on Transcript, or another page). Expected: the 5 s rate of item 3; line 463 gives 60 s.

# ADRs

`ls docs/adr` prints "No such file or directory". `ls docs` shows no such folder, and `.agents/plan.yaml` names none. No record to read.

# Dictated text

Each by `grep -n` on the brief.
- `grep -n "showing: 'live'"` line 28, `showing`, `locked`, `transcript` keys: holds (`spec.md:18`, named by the brief).
- `grep -n 'agent: { tool:'` line 31: holds. The required field reaches `stream-terminals.ts:143` (Names).
- `grep -n 'byHand: true'` line 33, `byHand`, `h<n>-<tool>`, `$<n>`: holds against the rules. Inputs 15 and 16 are the facts behind them.
- `grep -n 'with \`not-ours\`'` line 34: holds. `config/text/views/sessions/terminal.yml:64` reads "That is not a terminal oculus started.", which is true of a by-hand id.
- `grep -n 'Live / Transcript'` line 39 and `grep -n 'A Lock tool'` line 43: holds. These are labels from the catalog under item 10.
- `grep -n 'composer.elsewhere'` lines 43, 82: **breaks `spec.md:72`** (a sentence the change makes false). `config/text/views/sessions/composer.yml:29` reads "This session runs in a terminal of its own, so it cannot be typed into from here.", and an ended session runs nowhere. The same text stands today in the Transcript view, but the step makes it the rule for every ended session. The fix is a new line or a reworded one under `config/text/views/sessions/`, on the write list.
- `grep -n 'Unknown view: transcript'` line 85: holds (`config/text/ui.yml:142`, `spec.md:43`).
- `grep -n 'default of the shape'` line 28: holds. `config/defaults/layout.yml:60` opens a Terminal tab with no state at all, so the absent keys are a current form.
- `grep -n 'Everything in the brief is done'` line 148: holds (`spec.md:84`).
- `grep -n 'at landing on main'` line 142: differs from `spec.md:26` ("in the gate worktree"). The same line stands in O113's brief at line 109. A template line with no effect on the builder.
- `LC_ALL=C grep -n '[^ -~]' O114.md` prints nothing: the brief is ASCII.

# Declined to judge

- Whether a tab reading Transcript should close when its session ends (case 12). That is a design choice, and the brief should list it.
- The cost of a `ps -axww` every 5 s while a page is connected: not measured.
- Whether xterm's `disableStdin` also stops a `grid.paste` and mouse reports: not read in xterm's source.
- Whether `pane_current_path` equals a Codex record's `cwd` through a symlinked folder: not run.
- Which of a guarded entry, a case-run program or a stand-in closes the test and look findings: the orchestrator's.

Usage: a59fef7713e8e61e7, claude-opus-5-5, 313105 tokens, 42 tool uses, 800.0 s

## Closed

Each finding is closed by a change to the brief, by number of the eight and by check.

- 1 (steer box in the grid): item 6 keeps the grid's box in Live and the body draws one in Transcript.
- 2 (`agentOf` reads `man claude`): item 3 has a first-word rule of its own; case 4 holds the inputs.
- 3 and input 4 (panes): item 3 binds a by-hand terminal to its pane, case 7b (Z1100).
- 4 (resize): resize refused, the grid drawn at the pane's size, case 7, look 18 (Z1100).
- 5 and line caps: item 11, internal placement, taken under the amendment to ruling Brief check scope.
- 6 (guarded): G146 and G147 added (Z1101); G86 is the orchestrator's at landing.
- 7 (`composer.elsewhere` false for an ended session): item 7, a new line; case 16.
- 8 (steer after quit): item 3's check before typing, case 7a.
- Names: `run.ts`, `stream-terminals.ts` on the paths; HELP:342 in item 12; `turn_bar` in item 1; `folds.ts` in item 4.
- Step line: Conventions states the saved tab's new shape.
- Cases: 15 and 18 use a stand-in; 19 a hand-made tab; 11 asks a round trip; 12 is a decision listed; older `readTab` forms Z1102.
- Inputs 6 to 9: items 5, 8, 4. Input 10: case 12. Input 11: item 4, case 17. Input 12: decision listed, no widening. Input 13: item 3, case 9. Input 14: decision listed. Inputs 15, 16: id shape, case 6. Input 17: item 3, case 9.
- Dictated text: `composer.elsewhere` as in 7; the new lines above hold no dictated sentence, each says what the words must say.
