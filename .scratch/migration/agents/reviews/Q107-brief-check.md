# Step Q107 brief check (on main at 751de88f)

This is the report of the fresh agent from the `spec` skill's "Steps / The brief check", on `agents/briefs/Q107.md` (`/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/agents/briefs/Q107.md`). I read the brief, the Goal paragraph and Q107's line in `plan.md` (line 277), the Rulings Z99 (line 584) and Z111 (line 590), the closed log's Z99 (state file line 213) and Z111 (lines 179-183), the rules file `agents/spec.md`, and the tree on main at `751de88f` (`git log --oneline -1`). I changed nothing. I ran no server, no browser and no tmux command.

## 1. Names

- `endedTerminals`: `grep -rn --exclude=local.yml -e endedTerminals src tests config DESIGN.md HELP.md README.md`. Hits are `terminals.svelte.ts:127,342`, `tests/state/sessions/terminals.test.ts:16,431-448` and `DESIGN.md:361`. All of them are inside the brief's paths.
- `closeEnded`: same grep. It also hits `tests/state/client/terminal/terminal-close.test.ts:270`, which is outside the paths. That file tests the tab-closing behaviour of cases 3-5 ("a terminal that ended on its own", line 269 onward). A fix of item 2 on the page side changes what this file asserts.
- `kindsMenu` / `emptyListMenu`: same grep. `emptyListMenu` is also hit at `tests/ui/menu/menu-words.test.ts:30,85`, outside the paths. Line 85 calls `emptyListMenu(words)` "in the state that gives it its most items" (header of the file). Item 3 gives `emptyListMenu` unowned terminals as input and a new submenu of terminal names, so this audit has to change: its call gets the new argument, and the handed names go into its `NAMES`. Case 12 only says the file "still passes". It does not list the file as one the step writes.
- `showTerminal` / the store's join rule: `grep -rn -e showTerminal ... src tests`. The store tests of `showTerminal`, `moveTerminal` and the tab closing live in `tests/state/client/terminal/terminal-tabs.test.ts` (10 hits) and `terminal-close.test.ts`, with the fixture `terminal-tabs-fixture.ts`. `tests/state/sessions/terminal/terminal-tabs.test.ts`, which the brief names, has 0 hits: its header says it holds only the pure one-tab rules. Store cases 8-11 therefore belong in `tests/state/client/terminal/`, which is not in "Paths this step writes".
- `sessions.menu_attach` / "Attach to Session": no hit anywhere, so the name is new.
- "a terminal belongs to one tab" (`HELP.md:127`): the step makes this sentence no truer or falser. `HELP.md:125` already says the Sessions view lists "those no Terminal tab owns". See Premises.

Findings:
- `tests/ui/menu/menu-words.test.ts` (the audit calls `emptyListMenu(words)` at line 85, and the new argument and submenu names change it) is outside "Paths this step writes".
- `tests/state/client/terminal/terminal-tabs.test.ts`, `terminal-close.test.ts` and `terminal-tabs-fixture.ts` hold the store-level cases (8-11, 3-5) and are outside the paths. The brief points those cases at `tests/state/sessions/terminal/terminal-tabs.test.ts`, which holds only pure rules.

## 2. The step line

- "a Terminal tab never closes while its terminals run": items 1 and 2, and cases 3-5. They serve it only for a closing that goes through a `sessions` list and `endedTerminals` (item 1's red criterion, item 2's "no `sessions` message leaves out ... or the page never treats such a message as the terminal's end").
- "a Terminal tab offers the running terminals no tab owns": item 3.
- "the closing reproduced on a server of the step's own (a port neither 8787 nor 8790, a tmux socket of its own, started and stopped by the builder)": items 1 and 4.
- "the cause fixed": item 2.
- "(ruling Z99)": the Z99 text in the closed log (state file line 213) matches items 1-3. Z99's own "against" line ("if a server restart causes it, every restart closes every Terminal tab on every page") is served by item 1's restart event.
- "(ruling Z111)": "Finding the cause is part of your work here" (brief line 14).

Findings:
- "never closes while its terminals run" has no item for a closing that bypasses the `sessions` list. One such path is on the tree. After a restart, Vite's client reloads every open page: `node_modules/vite/dist/client/client.mjs:1031-1036` prints "server connection lost. Polling for restart..." and then runs `location.reload()` (Vite 8.3.0). A config dependency such as `channel.ts` triggers that restart: `node.js:24896-24898` has `isConfigDependency` leading to a restart. The reloaded page restores its workbench from one localStorage key, `oculus.layout.v1` (`storage.ts:14,67-71`). Every layout change writes that key (`layout.svelte.ts:444-449` `savePages` calls `storage.write`), and nothing listens for another browser tab's writes (`grep -rn addEventListener src/lib/state src/lib/shell src/routes | grep -i storage` prints nothing, exit 1). So with two browser tabs of one server open (for example Axel's own and the one a look opens), the reload after a restart can restore a layout the other browser tab saved, one without the Terminal tab. The result is a Terminal tab gone while tmux lists its terminals, with no `sessions` list missing anything. Item 1's red criterion ("`endedTerminals` answers a terminal that tmux still lists") cannot see this path, and item 2's fix is framed only in terms of the list. I have not established that this is Z99's cause. It is a path the step line covers and the brief does not.

## 3. Premises

- "The page closes a Terminal tab when ... `endedTerminals` (`terminals.svelte.ts:127-138`) ... `afterReceive` (`:326-348`) ... `closeEnded` (`:313-324`) ... (`:320`). A message with no list says nothing (`:331`). `seen` and `heard` live for the page's life." Checked with `grep -n` and `sed -n` over that file: 127 `export function endedTerminals(`, 313 `function closeEnded`, 320 `if (next.terminals.length === 0 && !held.composing) workbench.close`, 326 `entities.afterReceive((message) => {`, 348 `});`, 287-288 `const seen` / `let heard`. The early return is at 332 (`if (!Array.isArray(list)) return;`); 331 is its comment. Everything else matches.
- "`list()` answers null ... (`channel.ts:318-325`); `refresh()` (`:333-345`), a failure other than 'no server' at `:340` onward." Checked with `cat -n channel.ts`: 318-325 and 333-345 match. The catch is at 339-344. It matches.
- "`socketArgs` adds `-S <socket>` only when a caller passes one (`tmux.ts:31-47`); no server module passes one (`grep -rln "socketArgs\|socket?:" src/lib/server` finds only `tmux.ts`), so the running server uses the tmux server of the user who runs it, under `TMUX_TMPDIR` or `/tmp/tmux-<uid>/`." The grep printed `src/lib/server/machine/pty/tmux.ts`, and `socketArgs` is at `tmux.ts:43-46`, so both match. The conclusion is incomplete. With no `-S` or `-L`, tmux takes the socket from `$TMUX` when that variable is set, and only otherwise uses `TMUX_TMPDIR` or `/tmp`. This is tmux's own `main()` in tmux.c; `strings /opt/homebrew/bin/tmux | grep -n '^TMUX'` shows the binary reads `TMUX` and `TMUX_PANE`, and the man page's `-L` text covers only `TMUX_TMPDIR`. I did not probe this, since I may run no tmux command. `run()` (`tmux.ts:53-75`) and `control()` (`:222-231`) pass no `env`, so they inherit the server's environment. In this session `echo $TMUX` printed empty. A builder whose process runs inside a tmux pane would inherit `TMUX`, and then its server, and every shell it starts, would reach the user's tmux server despite `TMUX_TMPDIR`.
- "The server's own state folder is `join(homedir(), '.oculus')` (for example `changes.ts:85-88`); Node's `homedir()` reads `HOME`." `sed -n 85,88p` matches. `grep -rn -e "homedir()" -e "process\.env" src` shows every `~/.oculus` path (`changes.ts:87`, `overrides.ts:30`, `transcripts.ts:50`, `connect/store.ts:73,78`, `fs.ts:159`, `deposit-git.ts:101`, `notes.ts:38`, `bookmarks.ts:39`, `usage/accounts.ts:150`) goes through `homedir()`. It matches.
- "`npm run dev` is `vite dev` (`package.json:7`)" matches. "the socket server is attached by the Vite plugin (`src/lib/server/vite-plugin.ts`)": `ls src/lib/server/vite-plugin.ts` prints "No such file or directory". The file is `src/lib/server/root/vite-plugin.ts` (`git ls-files | grep vite-plugin`), imported at `vite.config.ts:9`. The wrong path also appears in "Paths this step writes" (brief line 60) and "Read" item 3 (line 91).
- "`showTerminal` (`:378-406`) ... `moveTerminal` (`:415`) ... Join Terminals (`terminal-list.ts:349-370`, `sessions.menu_join`, `terminal.yml:28`) ... `kindsMenu` (`:372-377`, drawn at `Terminal.svelte:349`) ... `emptyListMenu` (`:387-399`, drawn at `TerminalList.svelte:314`). Nothing lists a running terminal that no tab owns." All the line numbers match (`grep -n` over each file). The last sentence is false. `src/lib/views/sessions/session-list/TerminalRows.svelte:2-6` says "Every terminal oculus runs is a row, those no Terminal tab owns among them; a press ... takes it into the Terminal tab of the page on screen (the terminals store's `showTerminal`)". Its rows are `SessionList.svelte:89` `const panes = $derived(terminals())` and `:275`, and `HELP.md:125` says the same to the reader. What is missing is an offer from inside a Terminal tab, which is what Z99 rules.
- "The palette ... has no terminal commands": `grep -n "terminal\|Terminal" src/lib/state/workbench/palette.ts` prints nothing. It matches.
- "Tests: ..." `ls` finds all four named files. The list omits `tests/state/client/terminal/terminal-tabs.test.ts` and `terminal-close.test.ts`, which hold the store-level tests of `showTerminal`, `moveTerminal` and the closing (see Names).
- "Docs: `DESIGN.md:361` ... `HELP.md:127`": `sed -n` matches.
- "Read" item 2 says "`sessions.ts` where it publishes the `sessions` payload". `src/lib/server/machine/pty/sessions.ts` publishes nothing. The publisher is `src/lib/server/root/watch/sessions.ts:162-168` (`terminals: options.terminals === undefined ? null : options.terminals.list()`, then `hub.publish('sessions', payload)`), and the payload is built in `src/lib/server/sessions/index.ts:59-60`. A second publisher, `src/lib/server/root/hooks.ts:277-284`, republishes `hub.latest('sessions')`, so it keeps the list.
- A premise the brief does not state, which item 1 needs: the socket refuses a handshake without an `Origin` naming 127.0.0.1 or localhost (`socket.ts:88`, `auth.ts:29-38`). A Node `ws` client, `ws` being in `package.json:80`, sends no Origin unless it is given one.

Findings:
- The Vite plugin path is wrong: `src/lib/server/vite-plugin.ts` does not exist; it is `src/lib/server/root/vite-plugin.ts`, in three places in the brief.
- "Nothing lists a running terminal that no tab owns" is false: the Sessions view's `TerminalRows.svelte` lists them and `HELP.md:125` says so.
- The tmux socket premise is incomplete: `$TMUX`, when set, decides the socket before `TMUX_TMPDIR`.
- `sessions.ts` does not publish the payload: the publisher is `root/watch/sessions.ts:162-168`.
- The test list omits `tests/state/client/terminal/terminal-tabs.test.ts` and `terminal-close.test.ts`.
- The `Origin` requirement of the socket is not stated.

## 4. Cases and checks

- Cases 1-13 were each read against `agents/spec.md`. No case asks for a browser suite. The red command is a probe, not a unit test, which the rules file allows since it bans only a browser suite and a revert directive (spec.md, "What every package obeys"). The port rule (spec.md, "Where you work", never 8787) holds.
- spec.md, "What every package obeys": "Every id or key a package introduces is exercised empty, duplicated, and colliding with a configured or reserved key. Every asynchronous path is exercised in flight, after close, and superseded by a later one." Item 3 adds a menu item id and a pick id per terminal, parsed beside `joinedOf` and `profileOf`, plus the catalog key `sessions.menu_attach`. No case gives two unowned terminals the same name, or checks that an Attach pick id is not read as a Join or Profile pick (`JOIN` and `PROFILE` prefixes in `terminal-list.ts:365,402-420`) and the reverse. If item 2's fix is in the asynchronous list read (`refresh()`), no case exercises it superseded by a later read or after `close()`.
- spec.md, "What every package obeys" (a DOM behaviour is seen at the look; an assertion over a label alone is an audit): case 12 is an audit, and the wiring of the unowned list into `Terminal.svelte` and `TerminalList.svelte` is only seen at the look. The brief says so ("No browser: the Terminal tab's look is taken at landing").

Findings:
- Item 3's new ids have no case for a duplicated name or for a pick id colliding with the existing `JOIN` and `PROFILE` prefixes (spec.md, "What every package obeys").
- Item 2 has no case for its asynchronous path superseded or after close, should the fix be in `refresh()`.

## 5. The question

- Case 1 could pass without the goal. The brief says to "feed the recorded payloads to `endedTerminals` as the page does" but does not say how `first` and `held` are fed. After a server restart the page is reloaded (Vite client `client.mjs:1036`, `location.reload()`), so its next list is a first list (`heard` false, `seen` empty) and `held` is every terminal its restored tabs hold (`terminals.svelte.ts:336-342`). A socket client that only reconnects feeds `first = false`. A red command built only that way stays green on a closing that needs the reload shape. It also cannot see the layout path of section 2.
- The check on the step line ("the closing reproduced ..., the cause fixed") could pass without the goal. The builder can find some event that makes `endedTerminals` answer a running terminal, for example two list reads out of order (see Implied inputs), fix it and turn its red command green, while Z99's closing had another cause, such as the layout path of section 2. The brief does not say what the builder does when none of item 1's events turns red on the base.
- Item 1: yes, for the same reason. The brief also does not say where the probe script lives. Item 4 removes the scratch folder, and "Paths this step writes" names no path for it, so the red command the report quotes cannot be rerun by the reviewer, whom the `refute` skill has rerun every command the report quotes.
- Item 2: it could pass with the goal unmet only in the way already given (a different cause fixed). Its own wording ("A guard at `closeEnded` that hides a wrong list is not a fix while the list is what is wrong") closes the cosmetic fix.
- Item 3: no for the store and the pure function, which cases 6-11 check. The drawn menus depend on the two components passing the list in, which is seen only at the look.
- Item 4: no. Its check quotes `lsof` and `ls` failing.
- Item 5: no.
- Cases 3-5: no, they are unchanged behaviour.
- Cases 6-7: no.
- Case 8 is ambiguous, not passable-wrongly: "shows it in the row". The store's rule for joining a terminal no tab owns is `withTerminal` (`terminal-tabs.ts:191-207`), which sets `row: [terminal]`, `shown: terminal` and `composing: false`, so it is shown alone. Join Terminals instead puts it beside the row (`TerminalList.svelte:202-206`, `joined(showingOne(...))`).
- Case 9: its expected result does not say that `withTerminal` sets `composing: false`, which drops the composer and what was typed in it.
- Cases 10-13: no.

Findings:
- Case 1 and item 1 do not fix the page shape the payloads are fed in (reload after restart: `first = true`, `held` = the restored tabs' terminals; reconnect: `first = false`, `seen` carried). Without that, the red command can miss the cause.
- The step line's check and item 1 have no instruction for when no listed event turns red on the base. They also do not reach a closing that bypasses the `sessions` list (the layout path of section 2).
- The probe script has no kept path and item 4 deletes the scratch folder, so the red command cannot be rerun at review.
- Case 8's "shows it in the row" does not say whether the terminal is shown alone (`withTerminal`) or beside the row (Join).
- Case 9 does not say that the composer and its text are dropped.

## 6. Implied inputs

This is a code step. Each input the step implies but never states, with the result it should have:

- The page reconnecting without a reload (socket drop, same page): named in item 1 ("the socket reconnecting"). Not under "Cases" with its shape (`seen` carried, `first = false`). Expected: no running terminal is ended.
- A page opened, or reloaded by Vite, after the server restarted (`client.mjs:1031-1036`): missing. Expected: the first list with `held` = the restored tabs' terminals ends none that tmux lists, and the restored layout still holds the Terminal tab.
- Several browser tabs of one server (one localStorage key, `storage.ts:14`, no cross-tab listener): missing, for both halves.
  - For the closing: the reload after a restart must not restore another browser tab's layout without this Terminal tab. Expected: the Terminal tab stays, or the brief says this is out of scope, with the reason.
  - For Attach: a terminal owned by a Terminal tab in the other browser tab is "unowned" in this one. Expected: the brief states the rule. `showTerminal` today would take it in the same way.
- Several workbench pages, including a Terminal tab on a hidden page: cases 6 and 11 cover pages P and Q. Neither case says that one of them is hidden. `terminalTabs()` reads every page (`terminals.svelte.ts:303-305`), so the expected result is the same. Listed partially.
- A terminal started from this page and not yet listed: missing.
  - For the closing: the list reply read before the start that resolves after one read later. `refresh()` (`channel.ts:334-345`) has no sequence guard, `#took` keeps whichever reply resolves last (`:417-429`), and one start fires several change events (`CHANGE_EVENTS`, `:55-65`, each calling `refresh()` at `:290`). Expected: no list drops it once listed.
  - For Attach: it is owned by the tab that started it, so it is not offered. Expected: not offered.
- A foreign terminal (a hand-made `oculus-*` session, `foreign: true`, `sessions.ts:251-253`): missing. Join excludes it (`Terminal.svelte:148`) and so does `terminalChoices` (`folds.ts:275`), and `withTerminal` refuses a non-terminal id (`terminal-tabs.ts:196`). Expected: not offered under Attach to Session.
- A list read failing with a message `noServer` takes for "no server" while sessions run (the socket path unreachable, such as `$TMUX` naming another server, or `/tmp/tmux-<uid>` removed): `channel.ts:343` then takes `[]` as the list. Missing as an event of item 1. Expected: no running terminal ended.
- The usage refresh session: `usage/refresh.ts:302-305` starts `claude` in a `oculus-usage-*` tmux session at server start and every `usage_refresh_min: 10` (`config/behavior.yml:26`), then kills it. The list filters it (`sessions.ts:244`), but its start and kill are list-moving events in the builder's server and in the user's. Missing from item 1's events. Expected: no terminal ended.
- A terminal attached by another tab between the Attach menu opening and the pick: missing. Case 10 covers only one that ended. Expected: the brief chooses between nothing and a move (`moveTerminal`).
- Two unowned terminals with the same name: missing. Expected: two entries, told apart by id.
- A terminal with a reader-given title (Rename): missing. The brief labels entries by `name`, while the tab's rows label by title (`folds.ts:283`) and the Sessions rows by `title || name` (`TerminalRows.svelte:56`). Expected: the brief states which.

Findings:
- Missing from "Cases":
  - a page reloaded after a restart;
  - two browser tabs of one server (closing and Attach);
  - a terminal started and not yet listed, with list replies out of order;
  - a foreign terminal;
  - a `noServer` false reading;
  - the usage session's start and kill;
  - a terminal owned elsewhere before the pick;
  - duplicate names;
  - a renamed terminal's label.

## 7. ADRs

- `ls docs/adr` at the repository root and `ls tools/oculus/docs/adr` both print "No such file or directory". `grep -n "^adr" orchestrator-state.md` prints nothing, so the configuration has no `adr` key. `git ls-files | grep -iE "(^|/)adr/|/[0-9]{4}-[^/]*\.md$"` prints nothing. There is no record.

Findings: none.

## The isolation of item 1, in full

The brief asks whether `HOME` and `TMUX_TMPDIR` on the server process keep the user's tmux server and `~/.oculus` untouched, and whether the server can start that way.

- **Whether the server can start.** In a worktree, `config/local.yml` is absent: it is git-ignored (`git check-ignore -v config/local.yml` points to `.gitignore:4`). So `loadLocal` returns `localDefaults` (`local.ts:309-313`, `:114-126`), with `hub = resolve(engine, '..', '..')`, the worktree root and not the user's hub, and `port` 8790. `vite.config.ts:31-33` sets `port: loadLocal(...).port, strictPort: true`, and the CLI's `--port 8797 --strictPort` overrides it, so the server can start. `hostInfo(local.port)` (`context.ts:75-77`) will name 8790 on the status bar. That is cosmetic.
- **`~/.oculus`, the user's sources and the Claude and Codex stores.** Every one is reached through `homedir()`, so a scratch `HOME` isolates them:
  - `~/.oculus`;
  - the default accounts `~/.claude` and `~/.codex` (`local.ts:120-121`), so the session watcher reads empty folders;
  - the roots `~/workspace/cathedra` and `~/workspace/game-engine` (`config/sources.yml:99-100`, resolved at `files.ts:191-192`), which become missing roots, so the user's repositories are not watched.
- **tmux.** Isolated only while `TMUX` is unset on that process (Premises). The brief should unset `TMUX` and `TMUX_PANE` on the server's command line, for example with `env -u TMUX -u TMUX_PANE HOME=... TMUX_TMPDIR=... npx vite dev ...`.
  - Keep the scratch path short. The socket is `$TMPDIR` (49 bytes here) plus the scratch name plus `/tmux-502/default`, and a macOS unix socket path is limited to 104 bytes. This limit is from knowledge of the platform, not measured here.
- **Not isolated, and not named by the brief.**
  - The Live HPC poller starts at server start (`context.ts` `watchHpc`, host `utwente` from `config/behavior.yml:79`) and runs `ssh` (`hpc/ssh.ts:32`, BatchMode). OpenSSH takes its config and keys from the passwd home, not `$HOME`: `HOME=<scratch>/fakehome ssh -G utwente` printed `user faesayl`, `hostname hpc-head1.ewi.utwente.nl` and an `identityfile`. So the builder's server, and every restart item 1 makes, runs the poller's squeue, sacct, sinfo and quota queries on the cluster login node under Axel's account, whenever EduVPN is up. Those are read-only queries, not compute, but they reach his real account.
  - The usage refresh starts `claude` in the builder's tmux server at start (`usage/refresh.ts:302-305`), with the scratch `HOME`. Whether Claude Code then finds the macOS login keychain is not verified.
  - The process-list read of `sessions/registry.ts:67` runs over the whole machine. It is read-only.

## Item 3 against the existing code

- **Unowned set.** Join Terminals offers the terminals other Terminal tabs own on every page (`Terminal.svelte:142-150`): foreign ones excluded, labelled `one.name`, inserted after the row and shown beside it in a split (`TerminalList.svelte:202-206`). `showTerminal` joins a terminal no tab owns at the end of the page's Terminal tab, shown alone, composer dropped (`terminals.svelte.ts:397-406`, `withTerminal`). The brief's "every page's Terminal tabs" matches Join's `pages().flatMap(...)`.
- **Differences the brief does not settle.**
  - Foreign terminals: Join excludes them; the brief is silent.
  - The label: `name` in the brief, the same as Join, while the rows of the tab the terminal lands in use the title (`folds.ts:283`), so a renamed terminal is listed under a name the tab never shows.
  - Placement: "shown" means alone, under `showTerminal`'s rule, and not beside like Join.
  - An existing lister: the Sessions view already lists unowned terminals and takes one in on a press (`TerminalRows.svelte`, `HELP.md:125`), which the brief says does not exist.
- **User-visible choices.** The brief takes these, lists them as reversible "Decisions taken in this brief" 1-3, and no ruling names them:
  - the item's place in the bar's kinds dropdown and in the empty-list menu, where VS Code has it in neither, only in the palette;
  - its words, "Attach to Session";
  - the label of each entry;
  - the terminal joining at the end of this tab and shown alone.

## Declined to judge

- Whether the layout-overwrite path (section 2) or an out-of-order list read is Z99's cause. Reading cannot settle it. The probe item 1 describes can settle the list path, once the page shapes of section 5 are fed. The layout path needs two stores sharing one `Storable`, since `storage.ts` is written for a test to hand it a plain object.
- Whether the reviewer may start a server to rerun the red command. Z99 grants that leave to Q107's builder only, and the `refute` skill reruns every command the report quotes, so this is the user's call.
- Whether the Live HPC poller reaching the cluster login node from the builder's server is acceptable, or must be turned off for the step (for example through a worktree-only `hpc_host`). That is the orchestrator's or the user's call. I did not open `config/local.yml`.
- Whether item 3's placement, words, entry label and join position need Axel's ruling before the build, or are covered by Z99's "has a Terminal tab offer running terminals no tab owns". That is the user's call: the choices are user-visible and the brief takes them without a ruling.

## Closed (the session's change to the brief for every finding above, made before the preparation commit)

- Names: `tests/ui/menu/menu-words.test.ts` and `tests/state/client/terminal/terminal-tabs.test.ts`, `terminal-close.test.ts`, `terminal-tabs-fixture.ts` added to "What is on the tree" and "Paths this step writes"; the store cases 8-11 and 3-5 point at the client files.
- Step line, the layout path: added to "What is on the tree" and item 1 (three stores sharing one `Storable`); its fix waits on open item Z115; item 1 says what happens when neither path turns red.
- Premises: the Vite plugin path corrected in three places; the false "Nothing lists" sentence replaced by the Sessions view's `TerminalRows.svelte` and `HELP.md:125`; the `$TMUX` premise added, with `printenv TMUX` exiting 1 in the orchestrator's session and the builder stopping if it is set, and the 104-byte socket limit; the publisher corrected to `root/watch/sessions.ts:162-168` with `sessions/index.ts:59-60` and `root/hooks.ts:277-284`; the test list completed; the `Origin` requirement added and given to item 1's client.
- Cases and checks: cases 20 (duplicate labels, pick ids against `JOIN` and `PROFILE`) and the in-flight, after-close and superseded tests of a `refresh()` fix (item 2) added.
- The question: the two page shapes stated in item 1 and case 14; the no-red instruction added to item 1; the probe script kept at `agents/reviews/Q107-probe.mjs` in the worktree's ledger copy, rerun by the reviewer under the same isolation; case 8 says shown alone (`withTerminal`); case 9 says the composer and its text are dropped.
- Implied inputs: cases 14-21 cover the reload and reconnect shapes, the layout path, a terminal not yet listed with replies out of order, the `noServer` false reading, the usage session, foreign terminals, duplicate labels and a renamed terminal's label; a terminal another tab took before the pick changes nothing (case 10); in two browser tabs, the unowned set is what this browser tab's store holds, which Z115's ruling decides.
- Isolation: the Live HPC poller's read-only queries (squeue, sacct, sinfo, quota) are stated in "What is on the tree" as the queries the user's own server already runs, which the hub's HPC rules allow on a login node; the usage refresh is case 18.
- Declined points: the reviewer's leave to run the probe is given in the brief (Decisions 4); item 3's place, words, label and join position are the brief's reversible decisions 2 and 3, under Z99 (a).

Usage: brief-check agent ae55d11a40e206b7c, served claude-opus-5-5; 223,547 tokens, 87 tool uses, 12.3 min (from its completion notice)
