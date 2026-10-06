# Q109 diagnoses

## Diagnosis 1: a terminal's name, icon and colour not drawn when set

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. None of the quoted lines held one.

**Result.** The symptom does not happen on main at a8c061d1. The red command below, which asserts every part of the symptom, ran green three times in a row on a8c061d1. It also ran green once on Q107's parent (a1a2692e). The same command ran RED on every part when the server's `channel.ts` had the list signature from before commit 874a27b4 (id and name only). With that signature the whole symptom comes back, including the second-terminal and the colour-on-end parts. So Q107 is not what removed the symptom; 874a27b4 (2026-09-30 16:29) is. As the brief says, I stopped here: no shrink, no hypotheses, no probes, no fix and no test. One other defect turned up during the runs and is not diagnosed (see "Not diagnosed: the sessions list held back while a store is written"). The orchestrator decides whether to raise it.

## Symptom

"Seen on a shell the look started: Rename to "build", Change Color to Red and Change Icon to `wallpaper` each reached tmux (`tmux show-options -t oculus-e2a788-shell` printed `@oculus_title build`, `@oculus_color red`, `@oculus_icon wallpaper`), and the bar went on showing "zsh", the strip tab "e2a788-shell" and the default mark, after 6 s, after the view's Refresh and after a reload of the page. The row, the strip tab and the bar drew "build" with the red mark only when a second terminal was started, and a later change to Green (`@oculus_color green` in tmux) was drawn only when that second terminal ended. While the name was not drawn, the question before closing named the terminal "e2a788-shell"."

Source: the orchestrator's brief for Q109, the same text as Z101 in `tools/oculus/.scratch/migration/orchestrator-state.md:258`.

## Where the probes run

- **Scratch copy:** `$tmp/tree`, where `$tmp=/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.EU4ddC`. It was made with `git worktree add --detach "$tmp/tree" a8c061d1` from the main checkout. Nothing was applied to it. `npm ci` was run in `$tmp/tree/tools/oculus` (node v24.21.0). The copy has no `config/local.yml` (`test -e config/local.yml` printed "no local.yml in copy").
- **Server:** `vite dev --port 8823 --strictPort`, started from the copy's `tools/oculus` by `$tmp/drv/server.sh`:
  `env -i HOME=$tmp/sh TMUX_TMPDIR=$tmp/stm PATH=$tmp/bin:<node 24>:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin SHELL=/bin/zsh LANG=en_US.UTF-8 TERM=xterm-256color node node_modules/vite/bin/vite.js dev --port 8823 --strictPort`
  `$tmp/bin/ssh` is a stub that prints "ssh disabled in the diagnosis scratch server" and exits 255.
- **tmux:** every tmux command named the socket `$tmp/stm/tmux-502/default`.
- **Browser:** headless Chrome (`--headless=new`, a new `--user-data-dir` under `$tmp/profiles` for every run, `--remote-debugging-port=9411`), driven over the DevTools protocol by `$tmp/drv/cdp.mjs`. Ports 8787 and 8790 were never touched.
- **Paths redirected under `$TMPDIR`:** HOME and TMUX_TMPDIR on the server process. ORDO_STABLE and ORDO_SKILL_DIRS are not read by this code and were not set.
- **Comparison runs:** for the run on Q107's parent, `$tmp/drv/swap.sh parent` wrote `git show a8c061d1^:<path>` over the 17 source and config paths Q107 changed (`git diff --name-status a8c061d1^ a8c061d1 -- tools/oculus/src tools/oculus/config`) and removed the 4 it added. `swap.sh main` put them back, checked byte for byte against `git show a8c061d1:<path>`. For the pre-fix signature runs, main's `channel.ts` had one hunk replaced: the reverse of 874a27b4's change at `#took`, shown under "Comparison runs". It was then restored and checked with `git show a8c061d1:.../channel.ts | cmp`, which printed "channel.ts is a8c061d1's".
- **One side effect outside `$tmp`:** two early server-level runs (`diag-red.mjs`, quoted under "Comparison runs") started the dev server with HOME and TMUX_TMPDIR redirected. The first of them had the real `ssh` on PATH. OpenSSH reads its configuration from the account's home directory and not from HOME, so that start may have run the server's HPC poll once (`squeue`, `sacct`, `sinfo`, `quota`, `df` on the login node; no compute). That run's log was not kept, so whether the poll reached the host is not verified. Every later start ran with the ssh stub, and the later logs say "hpc publish: unreachable".

## Red command

Command, from `$tmp/drv`:

```
T=$tmp PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH node red-page.mjs
```

What it does, against the scratch server on 8823:

1. Kills every `oculus-*` session on its own socket.
2. Subscribes a websocket client to `sessions` and records every list.
3. Opens the page in a fresh Chrome profile, presses Sessions, then the Terminal tab, then "new terminal", and waits for the new terminal to be listed.
4. POSTs `/api/terminal` with `{action:'rename', title:'build'}`, `{action:'restyle', color:'red'}` and `{action:'restyle', icon:'wallpaper'}`. These are the same calls `renameTerminal` and `restyleTerminal` in `src/lib/state/sessions/terminals.svelte.ts:745-755` make, with the token the page holds.
5. Prints `tmux show-options` for the terminal.
6. After 6 s, asserts:
   - the latest `sessions` list carries title "build", icon "wallpaper" and colour "red";
   - the bar draws the title "build" (`[data-terminal-title]`);
   - the bar's mark is glyph `wallpaper` (`.mark [data-glyph]`) in red (its style);
   - a strip tab reads "build".
7. Restyles to green and asserts, after 6 s, both the list's colour and the bar's mark colour.
8. Reloads the page and asserts the bar title, mark glyph, mark colour and strip tab again.
9. Opens the composer ("With a Prompt..."), which draws the list for one terminal (`listDrawn` in `terminal-list.ts`). It then asserts the terminal's row draws "build" with the `wallpaper` mark in green.

No second terminal is started. RED is any failed assertion, and the exit code is 1 on RED.

Runs on main at a8c061d1 (the final script; the server freshly started on a8c061d1's sources):

```
=== run 1
started 17965f-shell; page draws {"bar":"zsh","glyph":"terminal_shell","markStyle":null,"tabs":["Sessions","17965f-shell","Transcript","Timeline","Session","Changes","Agents","Files"],"rows":[]}
rename: 200 {"ok":true,"id":"17965f-shell"}
color:  200 {"ok":true,"id":"17965f-shell"}
icon:   200 {"ok":true,"id":"17965f-shell"}
tmux:   @oculus_color red | @oculus_icon wallpaper | @oculus_title build
after 6000 ms: 1 sessions lists heard; terminals open in tmux: oculus-17965f-shell
green sessions list: {"title":"build","icon":"wallpaper","color":"red"}
green bar title: "build"
green bar mark icon: "wallpaper"
green bar mark colour: "color: var(--c-red);"
green strip tab: ["Sessions","build","Transcript","Timeline","Session","Changes","Agents","Files"]
row: no list drawn (one terminal)
green: 200 {"ok":true,"id":"17965f-shell"}; tmux @oculus_color green
green sessions list after green: "green"
green bar mark colour after green: "color: var(--c-green);"
green after a reload: bar title, mark icon, mark colour, strip tab: {"bar":"build","glyph":"wallpaper","markStyle":"color: var(--c-green);","tabs":["Sessions","build","Transcript","Timeline","Session","Changes","Agents","Files"],"rows":[]}
green row (list drawn with the composer): [{"id":"17965f-shell","title":"build","glyph":"wallpaper","markStyle":"color: var(--c-green);"}]
RESULT: green
exit 0
=== run 2
started 3103f1-shell; page draws {"bar":"zsh","glyph":"terminal_shell","markStyle":null,"tabs":["Sessions","3103f1-shell","Transcript","Timeline","Session","Changes","Agents","Files"],"rows":[]}
rename: 200 {"ok":true,"id":"3103f1-shell"}
color:  200 {"ok":true,"id":"3103f1-shell"}
icon:   200 {"ok":true,"id":"3103f1-shell"}
tmux:   @oculus_color red | @oculus_icon wallpaper | @oculus_title build
after 6000 ms: 1 sessions lists heard; terminals open in tmux: oculus-3103f1-shell
green sessions list: {"title":"build","icon":"wallpaper","color":"red"}
green bar title: "build"
green bar mark icon: "wallpaper"
green bar mark colour: "color: var(--c-red);"
green strip tab: ["Sessions","build","Transcript","Timeline","Session","Changes","Agents","Files"]
row: no list drawn (one terminal)
green: 200 {"ok":true,"id":"3103f1-shell"}; tmux @oculus_color green
green sessions list after green: "green"
green bar mark colour after green: "color: var(--c-green);"
green after a reload: bar title, mark icon, mark colour, strip tab: {"bar":"build","glyph":"wallpaper","markStyle":"color: var(--c-green);","tabs":["Sessions","build","Transcript","Timeline","Session","Changes","Agents","Files"],"rows":[]}
green row (list drawn with the composer): [{"id":"3103f1-shell","title":"build","glyph":"wallpaper","markStyle":"color: var(--c-green);"}]
RESULT: green
exit 0
=== run 3
started d28182-shell; page draws {"bar":"zsh","glyph":"terminal_shell","markStyle":null,"tabs":["Sessions","d28182-shell","Transcript","Timeline","Session","Changes","Agents","Files"],"rows":[]}
rename: 200 {"ok":true,"id":"d28182-shell"}
color:  200 {"ok":true,"id":"d28182-shell"}
icon:   200 {"ok":true,"id":"d28182-shell"}
tmux:   @oculus_color red | @oculus_icon wallpaper | @oculus_title build
after 6000 ms: 1 sessions lists heard; terminals open in tmux: oculus-d28182-shell
green sessions list: {"title":"build","icon":"wallpaper","color":"red"}
green bar title: "build"
green bar mark icon: "wallpaper"
green bar mark colour: "color: var(--c-red);"
green strip tab: ["Sessions","build","Transcript","Timeline","Session","Changes","Agents","Files"]
row: no list drawn (one terminal)
green: 200 {"ok":true,"id":"d28182-shell"}; tmux @oculus_color green
green sessions list after green: "green"
green bar mark colour after green: "color: var(--c-green);"
green after a reload: bar title, mark icon, mark colour, strip tab: {"bar":"build","glyph":"wallpaper","markStyle":"color: var(--c-green);","tabs":["Sessions","build","Transcript","Timeline","Session","Changes","Agents","Files"],"rows":[]}
green row (list drawn with the composer): [{"id":"d28182-shell","title":"build","glyph":"wallpaper","markStyle":"color: var(--c-green);"}]
RESULT: green
exit 0
```

### The same command on the pre-fix signature

This run shows the command fails when the defect is present. Main's `channel.ts` had its `#took` signature replaced by the line from before 874a27b4, and the server was started on it:

```
started dd8847-shell; page draws {"bar":"zsh","glyph":"terminal_shell","markStyle":null,"tabs":["Sessions","dd8847-shell","Transcript","Timeline","Session","Changes","Agents","Files"],"rows":[]}
rename: 200 {"ok":true,"id":"dd8847-shell"}
color:  200 {"ok":true,"id":"dd8847-shell"}
icon:   200 {"ok":true,"id":"dd8847-shell"}
tmux:   @oculus_color red | @oculus_icon wallpaper | @oculus_title build
after 6000 ms: 0 sessions lists heard; terminals open in tmux: oculus-dd8847-shell
RED sessions list: {"title":"","icon":"","color":""}
RED bar title: "zsh"
RED bar mark icon: "terminal_shell"
RED bar mark colour: null
RED strip tab: ["Sessions","dd8847-shell","Transcript","Timeline","Session","Changes","Agents","Files"]
row: no list drawn (one terminal)
green: 200 {"ok":true,"id":"dd8847-shell"}; tmux @oculus_color green
RED sessions list after green: ""
RED bar mark colour after green: null
RED after a reload: bar title, mark icon, mark colour, strip tab: {"bar":"zsh","glyph":"terminal_shell","markStyle":null,"tabs":["Sessions","dd8847-shell","Transcript","Timeline","Session","Changes","Agents","Files"],"rows":[]}
RED row (list drawn with the composer): [{"id":"dd8847-shell","title":"zsh","glyph":"terminal_shell","markStyle":null}]
RESULT: RED
exit 1
```

### The same command on Q107's parent (a1a2692e)

The 17 changed paths were swapped to a1a2692e and the 4 added ones removed. The run is the same as the three main runs, with the line ending `RESULT: green` / `exit 0`. Every assertion was green: list `{"title":"build","icon":"wallpaper","color":"red"}`; bar "build"; mark `wallpaper` in `var(--c-red)`, then `var(--c-green)`; strip tab "build"; after the reload the same; the row `{"title":"build","glyph":"wallpaper","markStyle":"color: var(--c-green);"}`.

### Runs after the tightening

Not run. The command already runs unattended in about 40 s per run, and the brief stops here.

## No red command

Not applicable. The red command was built and detects the symptom (the pre-fix run above). It is green on a8c061d1.

## Comparison runs

These were run while building the red command. Each is one input through two versions, or one condition of TEST that the scratch server lacked. They are not probes of a hypothesis.

| Run | Version and condition | Result |
|---|---|---|
| `node diag-red.mjs`: websocket client only, no page; start a shell, rename, red, wallpaper, then green, 6 s each | a8c061d1 | green: "sessions list says title="build" icon="wallpaper" color="red"", then color="green" |
| the same with a client subscribed to the terminal's `pty:` channel (`DIAG_ATTACH=1`), so a control client is open | a8c061d1 | green, the same lines |
| `red-page.mjs`, an early version without the reload and row checks | a8c061d1 | green on every assertion |
| the same | a1a2692e (Q107's parent) | green on every assertion |
| the same, `routes.ts` rewritten with its own bytes before the start (SSR reload) | a8c061d1 | green |
| the same, `channel.ts` rewritten with its own bytes before the start ("[vite] server restarted") | a8c061d1 | green |
| the same, server started on the pre-fix signature | pre-fix | RED: "0 sessions lists heard", bar "zsh", mark `terminal_shell`, strip tab "ca773f-shell" |
| server started on the pre-fix signature, then main's `channel.ts` written over it while running, by plain write and by write-then-rename ("channel.ts changed, restarting server..."), then the look | pre-fix, then main | green in both: the restart loads the fixed signature |
| pre-fix signature, `SECOND=1`: after the first checks a second shell is started, the colour set to yellow, and the second shell stopped | pre-fix | every part of the symptom (block below) |
| `SECOND=1`, 4 other shells running first (`EXTRA=4`) | a8c061d1 | green; after the second shell started and ended, the colour followed every change |
| `SECOND=1` (final script) | a8c061d1 | green; yellow drawn at once ("after yellow: list says color "yellow"; page draws mark "color: var(--c-gold);"") |

The pre-fix `SECOND=1` run reproduces every part of the symptom:

```
RED sessions list: {"title":"","icon":"","color":""}
RED bar title: "zsh"
RED strip tab: ["Sessions","9bf083-shell",...]
second terminal started: a889c2-shell
after the second terminal started: list says {"title":"build","icon":"wallpaper","color":"green"}; page draws {"bar":"build","glyph":"wallpaper","markStyle":"color: var(--c-green);","tabs":["Sessions","build",...]}
yellow: 200 {"ok":true,"id":"9bf083-shell"}
after yellow: list says color "green"; page draws mark "color: var(--c-green);"
stop the second terminal: 200 {"ok":true,"id":"a889c2-shell"}
after the second terminal ended: list says color "yellow"; page draws mark "color: var(--c-gold);"
```

The pre-fix hunk, which is the reverse of 874a27b4's change to `src/lib/server/machine/pty/channel.ts` at `#took`:

```diff
-        // Everything the reader sets on a terminal is in the signature, so a rename or a new icon
-        // or colour is a change the pages are told of.
-        const signature = JSON.stringify(
-            terminals.map((one) => [one.id, one.name, one.title, one.icon, one.color])
-        );
+        const signature = terminals.map((terminal) => `${terminal.id}:${terminal.name}`).join('|');
```

**What TEST on 8790 ran at 18:20 is not verified.** 8790 was neither touched nor read. Three facts bear on it:

- `git log -S'one.title, one.icon, one.color' -- .../channel.ts` names only 874a27b4 (2026-09-30 16:29:19) as adding the fixed signature, and no later commit removes it.
- The patch of changes taken off main (`agents/reviews/inline-fixes-2026-09-30.patch`) holds no `channel.ts` (`grep "^diff --git"` lists ten other paths).
- On this scratch server, a running dev server picked up the fixed `channel.ts` on save and drew every change.

A dev server on main that restarted after 16:29 would therefore not show the symptom. A server running code from before 16:29 (one that did not restart, a built server, or a build from before then) shows exactly the symptom.

## Shrunk case

Not run. The red command is green on a8c061d1, and the brief stops at that point.

## Hypotheses

Not formed, for the same reason. The reply to the hypotheses: none, no person present. The second list: not needed.

## Probes

None. The comparison runs above are version comparisons made while building the red command, each tied to no hypothesis.

## Cause

The symptom does not occur on main at a8c061d1: the red command ran green three times in a row. On a server running the list signature from before 874a27b4, the symptom occurs in full, every part of the red command RED. On Q107's parent it does not occur. The commit that ends it is therefore 874a27b4, not Q107. That TEST's server ran pre-874a27b4 code at 18:20 is consistent with every part of the symptom but is not verified.

## Fix and test

None. There is no defect on main to fix for this symptom. 874a27b4 already holds the fix at `#took` and its test in `tests/server/machine/pty/channel.test.ts` (the commit message says "Add the test that fails without it"; that test was not run in this diagnosis). No test reaches it: not applicable. No test is written: not applicable.

## Not diagnosed: the sessions list held back while a store is written

**Not diagnosed. The orchestrator decides whether to raise it.** On a8c061d1, while a watched session store (`$HOME/.claude/projects`, present when the server started) was written more often than every 500 ms, the `sessions` channel published no list at all. A terminal start was not listed within 20 s, and the list came about 260 to 510 ms after the writes stopped. The same hold-back applies to a rename, an icon or a colour. It does not match Z101: Z101's second terminal was drawn at once, while here a start is held back too.

Measured with `node starve.mjs 0 100 300 450 600 1000` (a websocket client, a writer appending a line to `$tmp/sh/.claude/projects/-diag/w.jsonl` at the interval named, then a shell started through `/api/terminal`):

```
writes every 0 ms: the started terminal listed in 567 ms
writes every 100 ms: the started terminal listed NOT within 20000 ms; after the writes stopped, listed in 511 ms
writes every 300 ms: the started terminal listed NOT within 20000 ms; after the writes stopped, listed in 263 ms
writes every 450 ms: the started terminal listed NOT within 20000 ms; after the writes stopped, listed in 259 ms
writes every 600 ms: the started terminal listed in 725 ms
writes every 1000 ms: the started terminal listed in 569 ms
```

The likely place, from reading `src/lib/server/root/watch/sessions.ts` and not from a probe:

- the terminals' change and every store event share one `perfect-debounce` debounce of 500 ms (`DEBOUNCE`);
- that debounce restarts its wait on every call and has no maximum wait.

Not verified:

- whether Claude Code writes its transcripts more often than every 500 ms for long stretches on Axel's machine;
- whether any run of TEST was held back this way.

## Cleanup

```
$ lsof -nP -iTCP:8823 -sTCP:LISTEN || echo "8823: nothing listening"
8823: nothing listening
$ tmux -S $tmp/stm/tmux-502/default kill-server; echo "kill-server exit $?"
kill-server exit 0
$ lsof -nP -iTCP:9411 -sTCP:LISTEN || echo "9411: nothing listening"
9411: nothing listening
$ pgrep -f "diagnose.EU4ddC" >/dev/null && echo "a process still names \$tmp" || echo "no process names \$tmp"
no process names $tmp
$ grep -rln "DIAG-" $tmp/tree/tools/oculus/src $tmp/tree/tools/oculus/tests; echo "grep DIAG- matches exit $? (1 = none)"
grep DIAG- matches exit 1 (1 = none)
$ git worktree remove --force "$tmp/tree"; echo "worktree remove exit $?"     (from the main checkout)
worktree remove exit 0
$ rm -rf "$tmp"; ls -d "$tmp"
ls: $tmp: No such file or directory
$ git worktree list | grep -c diagnose.EU4ddC
0
```

- No probe added logging, so the tag grep has nothing to find.
- Before the removal, `git status --short` in the copy listed only the untracked `tools/oculus/diag-red.mjs`. Every swapped source was back at a8c061d1, checked with `git show a8c061d1:<path> | cmp` for each of the 17 paths.
- No credential or `.env` file was copied into `$tmp`.
- The red command on the original case: carried by the record, since no fix was made.
- Nothing was written into the ledger, the main checkout or any step's worktree.

## Usage

Not measured by a command; these are estimates.

- **Tokens:** about 240,000. The session's token budget went from 15,000,000 to 14,759,982 left.
- **Tool calls:** about 60.
- **Wall time:** about 35 minutes. The scratch server's first start was logged at 02:17 and cleanup ended at about 02:46 on 2026-10-01.

## Diagnosis 2: a terminal's lines not drawn after its tab moves to another pane

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it. None of the quoted lines below held one.

**Not done, and one breach of the brief.** The cause is found. The fix and its test are made and verified on the scratch copy, and the copy is removed. Under the plan, handing the fix to the builder (Step 20) is the orchestrator's job; this record is what it hands over. The breach: I ran `cp` of three files into the session scratchpad `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/`: `final.diff`, `red.mjs` and `cdp.mjs`. That is outside `$tmp`, which the brief forbids. I then removed them with `rm -v`, which printed all three paths. `cp` overwrites without warning. Files with those three names may already have been in that scratchpad before my copy, and if so their earlier content is lost. I cannot tell whether they existed. Other plan work used that scratchpad (it holds `X3d-final.md`, `checks.log` and others), so someone should check whether anything they relied on had those names.

## Symptom

From Z101 in `orchestrator-state.md`, as the orchestrator quoted it: "after "Split tab downwards" moved the Terminal tab into a pane of its own, the grid drew only the cursor and none of the shell's earlier lines, until the list of two terminals was shown." It was seen before Q107 landed.

**Does it still happen on main at a8c061d1? Yes.** The red command below is red on a8c061d1.

## Where the probes run

- **Scratch copy:** `git worktree add --detach "$tmp/tree" a8c061d1`, run from the main checkout, with `tmp=/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.G8fR6w`. Nothing was applied to it. `npm ci` ran in `tools/oculus` with node v24.21.0.
- **Dev server:** started from the copy on port 8824 (`vite dev --port 8824 --strictPort`), in its own process group. It ran with `HOME=$tmp/h`, `ZDOTDIR=$tmp/h` (so zsh reads no real rc file), `TMUX_TMPDIR=$tmp/tm` (so it has its own tmux socket) and `PATH` led by `$tmp/bin/ssh`, a stub that exits 255.
- **Browser:** headless Chrome with `--remote-debugging-port=9424` and a fresh profile under `$tmp/profiles/<run>` for every run. It is driven over the DevTools protocol by `$tmp/drv/cdp.mjs` and `$tmp/drv/red.mjs`.
- **tmux:** every command named `-S $tmp/tm/tmux-502/default`.
- **Not touched:** ports 8787 and 8790, the user's Chrome, and `config/local.yml` (the only listing of `config/` was `ls | grep -v local.yml`).
- **Paths redirected under `$TMPDIR`:** `HOME` (and `ZDOTDIR`, `TMUX_TMPDIR`).
- The finding is not a reviewer's finding, so there are no step-worktree outputs to record.

## Red command

```
cd $tmp/drv && RUN=<run> T=$tmp PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH node red.mjs
```

What `red.mjs` does:
1. Kills its own tmux server and starts Chrome with a fresh profile. It has a 90 s watchdog.
2. Opens localhost:8824 and the Sessions page.
3. Right-clicks the empty strip of the pane holding Transcript and Timeline, and picks New Terminal. This puts the Terminal tab beside other tabs.
4. Types `printf 'MARK-%s\n' one two three` with `tmux send-keys`.
5. Reads the `.xterm-rows` text.
6. Opens that pane's Pane menu and picks "Split tab downwards", waits 4 s, and reads `.xterm-rows` again.
7. Reports RED (exit 1) when all three MARK lines were drawn before the move and not all are drawn after it.

The env switches used by the shrink are `PAGE=focus`, `SPLIT=right`, `CLOSEMIDDLE=1`, `WAIT` and `AFTERPRINT=1`.

Three runs in a row (red3, red4, red5; red2 before them was the same):

```
=== run red3
before the move: panes [Sessions] [Terminal] [Transcript, Timeline, bcd651-shell] [Session, Changes, Agents, Files]; 1 grid(s), marks drawn: [MARK-one, MARK-two, MARK-three]
after the move: panes [Sessions] [Terminal] [Transcript, Timeline] [bcd651-shell] [Session, Changes, Agents, Files]; 1 grid(s), marks drawn: []
  grid 0 text: ""
RESULT: RED (the earlier lines are not drawn after the move)
exit 1
=== run red4
(same, b7c62d-shell) marks drawn after the move: []  grid 0 text: ""  RESULT: RED  exit 1
=== run red5
(same, 652623-shell) marks drawn after the move: []  grid 0 text: ""  RESULT: RED  exit 1
```

Runs after the tightening:
- **Longer wait (`WAIT=15000`):** still `marks drawn: []`, RED. It is not a slow redraw.
- **A print after the move (`AFTERPRINT=1`):** RED, and the later output is drawn while the earlier lines are not:
  ```
  after a later print: ["                           printf 'LATER-%s\\n' four\nLATER-four\naxelfaes@YQ530VVFGK tree %"]
  ```
- **Run-to-run hang:** one run hung while the previous Chrome was still holding port 9424. `cdp.mjs` now waits for the port to be free before starting and after stopping, and `red.mjs` has the watchdog. Every run after that finished.

A Terminal tab that is alone in its pane is not moved by "Split tab downwards" (run red1, green). The tab must sit beside other tabs for the move to happen.

## No red command

Not applicable.

## Shrunk case

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| The Sessions page (`PAGE=focus`: New Terminal on the Focus page's pane holding Live HPC and Usage) | RED: `after the move: panes [Focus] [Live HPC, Usage] [8c8b49-shell]; ... marks drawn: []` | cut |
| The other Terminal tab, in the middle pane (`CLOSEMIDDLE=1`) | RED: `marks drawn: []`, `grid 0 text: ""` | cut |
| The downward direction (`SPLIT=right`) | RED, partly: `marks drawn: [MARK-two, MARK-three]`, `grid 0 text: "MARK-two\nMARK-three\naxelfaes@YQ530VVFGK tree %"`. The direction is not needed for the defect. | cut (down kept as the canonical form) |
| The other tabs in the pane (Terminal tab alone in its pane) | green (red1): the split leaves a sole tab where it is, so no move happens | put back |
| The lines printed before the move | needed, since they are what the assertion reads | kept |

The shrunk case as it stands has three parts, each needed for the red:
1. A Terminal tab opened with the strip's New Terminal in a pane that holds other tabs.
2. Its shell prints known lines.
3. "Split tab downwards" moves the tab into a new pane, which is shorter than the pane it left.

## Hypotheses

As formed after the red command and before the first probe:

1. **If** the scrollback the server sends on attach is written for a pane taller than the new grid, so its lines end up above the grid's view, **then** making the tmux window take the new grid's size before the scrollback is captured turns the red command green. Falsified by: the scrollback's lines sitting inside the viewport after the write.
2. **If** the new grid never asks for the channel again (its subscribe runs while the channel is still in the socket's list, so `socket.subscribe` sends nothing and the server sends no scrollback), **then** forcing a subscribe message on mount turns it green. Falsified by: a subscribe message written for the new grid and a version-0 message reaching its listener.
3. **If** the server's capture lacks the lines (wrong pane, a failed capture), **then** a correct capture turns it green. Falsified by: a version-0 message that contains `MARK-one` reaching the new listener.
4. **If** the scrollback arrives and is drawn, but a later chunk or reset wipes the grid, **then** dropping that later write turns it green. Falsified by: no message after the version-0 one, while the lines are still not in view.

The reply to the hypotheses: none, no person present.

The second list: not needed.

## Probes

Every log line carries the tag `DIAG-7c3e`. Probes 2 and 3 ran with the logging of the probes before them still in place. That logging changes no behaviour.

**Probe 1 (tests hypotheses 2 and 3): logging at the subscribe, unsubscribe, listener, mount and teardown boundaries.**

```diff
--- src/lib/state/client/socket.svelte.ts
         const added = names.filter((name) => !channels.includes(name));
+        console.log('DIAG-7c3e socket.subscribe', names.join(','), 'added', added.join(',') || '(none, nothing sent)'); // DIAG-7c3e
@@ function unsubscribe
+        console.log('DIAG-7c3e socket.unsubscribe', names.join(',')); // DIAG-7c3e
--- src/lib/state/sessions/terminals.svelte.ts (subscribePty listener)
+            console.log('DIAG-7c3e pty message', id, 'version', received.version, 'MARK-one in it', new TextDecoder().decode(decodeBytes(encoded)).includes('MARK-one')); // DIAG-7c3e
--- src/lib/views/sessions/terminal/grid/TerminalGrid.svelte
+            console.log('DIAG-7c3e grid mounted, subscribing', wanted); // DIAG-7c3e
@@ close = () => {
+                console.log('DIAG-7c3e grid torn down', wanted); // DIAG-7c3e
```

Run (PAGE=focus): RED.
```
  log DIAG-7c3e --- the move
  log DIAG-7c3e grid torn down 24590f-shell
  log DIAG-7c3e socket.unsubscribe pty:24590f-shell
  log DIAG-7c3e grid mounted, subscribing 24590f-shell
  log DIAG-7c3e socket.subscribe pty:24590f-shell added pty:24590f-shell
  log DIAG-7c3e pty message 24590f-shell version 6 MARK-one in it false
  log DIAG-7c3e pty message 24590f-shell version 0 MARK-one in it true
```
Result: hypotheses 2 and 3 are falsified. The old grid is torn down before the new one subscribes, the subscribe is sent, and a version-0 scrollback containing `MARK-one` reaches the new listener.

**Probe 2 (tests hypotheses 1 and 4): logging where the scrollback's lines land in xterm's buffer.**

```diff
--- TerminalGrid.svelte
                 if (scrollback) term.reset();
-                term.write(titles(bytes));
+                term.write(titles(bytes), () => { // DIAG-7c3e
+                    if (!scrollback) return; // DIAG-7c3e
+                    const b = term.buffer.active; // DIAG-7c3e
+                    let at = -1; // DIAG-7c3e
+                    for (let i = 0; i < b.length; i++) if (b.getLine(i)?.translateToString().includes('MARK-one')) at = i; // DIAG-7c3e
+                    const text = new TextDecoder().decode(bytes); // DIAG-7c3e
+                    console.log('DIAG-7c3e scrollback written: grid rows', term.rows, 'cols', term.cols, 'buffer lines', b.length, 'viewport top', b.viewportY, 'cursor row', b.cursorY, 'MARK-one at buffer line', at, 'capture rows', text.split('\r\n').length, 'tail', JSON.stringify(text.slice(-24))); // DIAG-7c3e
+                }); // DIAG-7c3e
```

Run: RED.
```
  log DIAG-7c3e scrollback written: grid rows 57 cols 54 buffer lines 57 viewport top 0 cursor row 0 MARK-one at buffer line -1 capture rows 25 ...   (first mount)
  log DIAG-7c3e --- the move
  ...
  log DIAG-7c3e pty message a6baa4-shell version 0 MARK-one in it true
  log DIAG-7c3e scrollback written: grid rows 23 cols 54 buffer lines 59 viewport top 36 cursor row 5 MARK-one at buffer line 6 capture rows 59 tail "\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\u001b[6;28H"
```
Result: hypothesis 1 stands and hypothesis 4 is falsified.
- No message follows the version-0 one.
- A 59-row capture is written into a 23-row grid. The view is buffer lines 36 to 58, which are the blank rows below the prompt.
- `MARK-one` is at buffer line 6, above the view.
- The cursor is placed at view row 6, in the blank area. That is "only the cursor".

**Probe 3 (sharpens hypothesis 1): server-side logging of the capture, the cursor read and the resize timing** (`src/lib/server/machine/pty/channel.ts`).

```diff
@@ async #attach
         let text = '';
+        console.log(`DIAG-7c3e attach ${id}: capture starts at ${Date.now() % 100000}`); // DIAG-7c3e
@@
+        console.log(`DIAG-7c3e attach ${id}: cursor read "${cursor.trim()}" at ${Date.now() % 100000}, capture ${text.split('\n').length} lines`); // DIAG-7c3e
         if (!this.#attached.get(id)?.has(sink)) return;
@@ async #resize
+        console.log(`DIAG-7c3e resize ${id} to ${cols}x${rows} starts at ${Date.now() % 100000}`); // DIAG-7c3e
         try {
             await this.#driver.run(resizeArgs(id, cols, rows));
+            console.log(`DIAG-7c3e resize ${id} to ${cols}x${rows} done at ${Date.now() % 100000}`); // DIAG-7c3e
```

Run: RED. Server log after the move:
```
DIAG-7c3e attach df64da-shell: capture starts at 11601
DIAG-7c3e resize df64da-shell to 54x23 starts at 11603
DIAG-7c3e resize df64da-shell to 54x23 done at 11612
DIAG-7c3e attach df64da-shell: cursor read "27 5 23" at 11617, capture 60 lines
```
Result: hypothesis 1 stands. The capture starts before the new grid's resize reaches tmux, so the pane is captured at the old height of 55 rows that the previous grid left. The grid's resize arrives on the socket after its subscribe, and `#attach` does not wait for it.

**Probe 4 (the change hypothesis 1 names; all logging removed first with `patch -p1 -R`):** the diff under "Fix" below, without the test changes.

Runs PAGE=focus x3, each:
```
after the move: panes [Focus] [Live HPC, Usage] [3ae729-shell]; 1 grid(s), marks drawn: [MARK-one, MARK-two, MARK-three]
  grid 0 text: "axelfaes@YQ530VVFGK tree % printf 'MARK-%s\\n' one two\nthree\nMARK-one\nMARK-two\nMARK-three\naxelfaes@YQ530VVFGK tree %"
RESULT: green
exit 0
```
(the same for dc34ef-shell and 446775-shell)

After the change was undone with `patch -p1 -R`:
```
after the move: panes [Focus] [Live HPC, Usage] [ce9dce-shell]; 1 grid(s), marks drawn: []
  grid 0 text: ""
RESULT: RED (the earlier lines are not drawn after the move)
exit 1
```
Result: hypothesis 1 stands. The red command is green with the change and red without it.

## Cause

**What goes wrong:** When a grid mounts, it subscribes to `pty:<id>` before it tells tmux its size. On main this is `src/lib/views/sessions/terminal/grid/TerminalGrid.svelte:371-377`: `subscribePty(wanted, ...)` and then `resized(wanted)`. The subscribe makes the server's `Terminals.#attach` (`src/lib/server/machine/pty/channel.ts:542-590`) run `capture-pane` at once. That captures the pane at the window's current size, which is the size the previous grid left. `screenAt` (`src/lib/server/machine/pty/sessions.ts:461-468`) then sends the whole capture with an absolute cursor position. Its comment says it is meant to be "Written into a grid as high as the pane".

**What the reader sees:** When the tab moves into a shorter pane, the 55-row capture is written into a 23-row grid. The grid shows the blank rows below the prompt and the cursor, and the shell's lines are above the view (probe 2).

**Why it later recovers:** Any later resize makes the shell redraw its prompt, and with a wider or narrower grid tmux also reflows the pane. Showing the list of two terminals narrows the grid, which is why the lines came back then. A right split changes the width, which is why `SPLIT=right` drew some rows.

**Shown by:** probe 4. The red command is green with the change (three runs) and red without it.

**Seen in probe 3, not needed for the red:** `#attach` captures first and reads the cursor second, so a resize that lands between the two pairs a 55-row capture with a cursor read at 23 rows. A capture and a cursor both taken at 55 rows would still fill the 23-row grid with blank rows, so the client-side order is the cause. The fix removes the resize this grid sends between the two reads. A resize from another page or grid in that window is still possible; it is not part of this symptom.

## Fix and test

**Test, run on the tree without the fix.** The two new cases were added to `tests/state/sessions/terminals.test.ts` under "subscribing to a terminal"; the existing cases were left unchanged for this run.

```
npx vitest run tests/state/sessions/terminals.test.ts -t "subscribing to a terminal"
     x resizes the window to the grid before it asks for the channel 5ms
     x asks for nothing when the listener is taken off before the resize answered 4ms
 FAIL  |unit| tests/state/sessions/terminals.test.ts > subscribing to a terminal > resizes the window to the grid before it asks for the channel
AssertionError: expected [] to deeply equal [ { action: 'resize', ...(3) } ]
- [
-   {
-     "action": "resize",
-     "cols": 54,
-     "id": "a1b2c3-shell",
-     "rows": 23,
-   },
- ]
+ []
 FAIL  |unit| ... > asks for nothing when the listener is taken off before the resize answered
AssertionError: expected [ { type: 'subscribe', ...(2) } ] to deeply equal []
+ [ { "channels": [ "sessions", "pty:a1b2c3-shell" ], "token": "", "type": "subscribe" } ]
      Tests  2 failed | 3 passed | 31 skipped (36)
```

**Fix, at the cause:**

```diff
--- a/tools/oculus/src/lib/state/sessions/terminals.svelte.ts
+++ b/tools/oculus/src/lib/state/sessions/terminals.svelte.ts
@@ -172,7 +172,11 @@ export type TerminalsStore = {
     resizeTerminal: (id: string, cols: number, rows: number) => Promise<TerminalAnswer>;
     sendInput: (id: string, text: string) => boolean;
     sendResize: (id: string, cols: number, rows: number) => boolean;
-    subscribePty: (id: string, onBytes: PtyListener) => () => void;
+    subscribePty: (
+        id: string,
+        size: { cols: number; rows: number },
+        onBytes: PtyListener
+    ) => () => void;
     unsubscribePty: (id: string) => void;
@@ -820,19 +824,34 @@ export function createTerminals(
     /**
-     * Read one terminal's output. The listener is handed the scrollback first, then every chunk
-     * after it, and the call returned takes the listener off without unsubscribing, for a view that
-     * is swapping one terminal for another.
+     * Read one terminal's output into a grid of this size. The window takes the grid's size first
+     * and the channel is asked for once tmux has it: the scrollback is the pane captured at the
+     * window's size with the cursor placed from the pane's top (server/machine/pty/sessions.ts,
+     * `screenAt`), so a window taller than the grid, as the last grid to show the terminal left it,
+     * would fill the grid with the blank rows under the cursor and put every line above them out of
+     * view. The listener is handed the scrollback first, then every chunk after it, and the call
+     * returned takes the listener off without unsubscribing, for a view that is swapping one
+     * terminal for another; a listener taken off before the resize answered asks for nothing.
      */
-    function subscribePty(id: string, onBytes: PtyListener): () => void {
+    function subscribePty(
+        id: string,
+        size: { cols: number; rows: number },
+        onBytes: PtyListener
+    ): () => void {
         const channel = ptyChannel(id);
+        let listening = true;
         const off = socket.listen(channel, (received) => {
             const payload = received.payload as PtyPayload | null;
             const encoded = typeof payload?.bytes === 'string' ? payload.bytes : '';
             onBytes(decodeBytes(encoded), received.version === 0);
         });
-        socket.subscribe([channel]);
-        return off;
+        void resizeTerminal(id, size.cols, size.rows).then(() => {
+            if (listening) socket.subscribe([channel]);
+        });
+        return () => {
+            listening = false;
+            off();
+        };
     }
--- a/tools/oculus/src/lib/views/sessions/terminal/grid/TerminalGrid.svelte
+++ b/tools/oculus/src/lib/views/sessions/terminal/grid/TerminalGrid.svelte
@@ -368,13 +368,19 @@
             const titles = titleStripper();
-            const off = subscribePty(wanted, (bytes, scrollback) => {
-                // The scrollback is sent to this socket alone at version 0, so a reconnect hands it
-                // over again; repainting from it is what keeps a second copy off the grid.
-                if (scrollback) term.reset();
-                term.write(titles(bytes));
-            });
-            resized(wanted);
+            // The store resizes the window to this grid before it asks for the channel, so the
+            // scrollback is captured at the grid's size.
+            const off = subscribePty(
+                wanted,
+                { cols: term.cols, rows: term.rows },
+                (bytes, scrollback) => {
+                    // The scrollback is sent to this socket alone at version 0, so a reconnect
+                    // hands it over again; repainting from it is what keeps a second copy off the
+                    // grid.
+                    if (scrollback) term.reset();
+                    term.write(titles(bytes));
+                }
+            );
```

Why it works:
- `resizeTerminal` posts `{action: 'resize'}` to `/api/terminal`. The route awaits `resize-window` before it answers (`src/lib/server/machine/pty/routes.ts:536-545`), so tmux has the grid's size before the subscribe triggers the capture.
- This also covers a fresh page or a reconnecting socket. On those, a socket `resize` sent before the subscribe would be dropped, because the sink is not yet attached (`channel.ts:478`).
- `postTerminal` never rejects (`src/lib/state/sessions/terminal/pty-io.ts:50`), so a refused resize still subscribes, as before.

**Test changes, part of the same diff.** These are in `tools/oculus/tests/state/sessions/terminals.test.ts`:
- A `const GRID = { cols: 54, rows: 23 };` constant.
- The three existing subscribe cases take `GRID`, stub fetch with `serving(200, { ok: true, id: ID })` and `await vi.waitFor(() => expect(socket.written()).toHaveLength(1))` before reading the subscribe message.
- An `answerLater()` helper, a fetch whose answer the case releases.
- Two new cases:
  - "resizes the window to the grid before it asks for the channel": the resize is posted with the grid's size, nothing is written on the socket until the fetch answers, then `[['sessions', CHANNEL]]` is written.
  - "asks for nothing when the listener is taken off before the resize answered".

**Runs after the fix:**
```
npx vitest run tests/state/sessions/terminals.test.ts            ->  Tests  36 passed (36)
npx vitest run ... -t "subscribing to a terminal" (final tree)   ->  Tests  5 passed | 31 skipped (36)
red command, shrunk case (PAGE=focus), final tree:
  after the move: panes [Focus] [Live HPC, Usage] [98a18c-shell]; 1 grid(s), marks drawn: [MARK-one, MARK-two, MARK-three]
  RESULT: green   exit 0
original, unshrunk case (Sessions page, beside Transcript and Timeline, middle Terminal tab open):
  after the move: panes [Sessions] [Terminal] [Transcript, Timeline] [d8f8e9-shell] [Session, Changes, Agents, Files]; 1 grid(s), marks drawn: [MARK-one, MARK-two, MARK-three]
  grid 0 text: "axelfaes@YQ530VVFGK tree % printf 'MARK-%s\\n' one two three\nMARK-one\nMARK-two\nMARK-three\naxelfaes@YQ530VVFGK tree %"
  RESULT: green   exit 0
SPLIT=right: marks drawn: [MARK-one, MARK-two, MARK-three]   RESULT: green
npm test (HOME and TMUX_TMPDIR under $tmp):  Test Files  355 passed | 20 skipped (375); Tests  5475 passed | 573 skipped (6048); exit 0
npm run check:  COMPLETED 2487 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npx eslint (3 changed files): exit 0;  npx prettier --check (3 changed files): All matched files use Prettier code style!
```

**Remaining problems for the builder and the look:**
- **First row of a narrowed grid.** With `SPLIT=right`, the narrower grid's first row reads `n' one two three`. tmux reflows the long prompt line at the narrower width and pushes its first rows into history, and the grid shows the same screen tmux does. The earlier rows are reachable by scrolling up. This is tmux's own presentation, not this defect, but the look will see it.
- **Not covered by any test:** the grid's own call, that `TerminalGrid.svelte` passes `term.cols`/`term.rows` after `fit.fit()`. It needs a DOM and xterm, and `agents/spec.md` puts DOM behaviour with the look. The red command covers it in a browser.
- **Mount cost:** each mount now makes one HTTP round trip before the subscribe; about 10 ms in probe 3's resize timing.

No test reaches it: the grid's call, for the reason above. No test is written: not applicable.

## Cleanup

```
grep -rn "DIAG-7c3e" $tmp/tree/tools/oculus/src $tmp/tree/tools/oculus/tests    -> no output (grep exit 1)
$tmp/stop-server.sh; lsof -nP -iTCP:8824 -sTCP:LISTEN                            -> port 8824 listeners: 0
tmux -S $tmp/tm/tmux-502/default kill-server; ... ls                            -> no server running on .../diagnose.G8fR6w/tm/tmux-502/default
pgrep -f 'remote-debugging-port=9424' | wc -l                                   -> 0 processes
git worktree remove --force "$tmp/tree"   (from the main checkout)              -> worktree remove exit 0
rm -rf "$tmp"; ls -d "$tmp"                                                     -> No such file or directory
git worktree list | grep -c diagnose.G8fR6w                                     -> 0
```

The throwaway files went with `$tmp`: the server log, Chrome profiles, screenshots and the drivers. No credential or `.env` file was copied. The three files copied into and removed from the session scratchpad are described at the top. The red command will be run again on the original case as the round's check.

## Usage

This record is the only output. I wrote nothing into the ledger, the main checkout or any worktree. The only state-changing git commands were the one `git worktree add --detach` and the one `git worktree remove --force`. One dev server ran on port 8824, about 32 headless Chrome runs went to port 9424, and every tmux command named my own socket. The unit suite ran once and the type check once. No remote compute.

## Diagnosis 3: the sessions list held back while a session store is written

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it. No quoted line below held one.

### Symptom

Quoted from the brief. It was found by Q109's first diagnosis, measured on main at a8c061d1 with a websocket client subscribed to `sessions`, a writer appending a line to a transcript under the server's `$HOME/.claude/projects` at the interval named, then a shell started through `/api/terminal`:

"writes every 0 ms: the started terminal listed in 567 ms
writes every 100 ms: the started terminal listed NOT within 20000 ms; after the writes stopped, listed in 511 ms
writes every 300 ms: the started terminal listed NOT within 20000 ms; after the writes stopped, listed in 263 ms
writes every 450 ms: the started terminal listed NOT within 20000 ms; after the writes stopped, listed in 259 ms
writes every 600 ms: the started terminal listed in 725 ms
writes every 1000 ms: the started terminal listed in 569 ms"

The brief adds that the same hold-back applies to a rename, an icon or a colour, and to the sessions records themselves.

### Where the probes run

- **Scratch copy:** `$tmp=/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.c56kE4`, with a detached worktree at `$tmp/tree` made by `git worktree add --detach "$tmp/tree" a8c061d1` from the main checkout. Nothing was applied to it, and `npm ci` was run in `$tmp/tree/tools/oculus` with node v24.21.0.
- **Server:** the copy's own dev server on port 8825, started by `$tmp/tree/tools/oculus/diag-starve.mjs` (an untracked file in the copy) under `env -i HOME=$tmp/home TMUX_TMPDIR=$tmp/tmux PATH=$tmp/bin:<node>:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin`.
  - `$tmp/bin/ssh` was a stub that prints "ssh disabled" and exits 255.
  - Every tmux command named `-S $tmp/tmux/tmux-502/default`.
- **Redirected paths:** HOME and TMUX_TMPDIR, for the server only. The unit tests used the suite's own scratch directories under the system temporary directory. The copy has no `config/local.yml`, and it was never read.
- **Untouched:** ports 8787 and 8790, the real `~/.claude`, `~/.oculus/dispatches.json`, the ledger, the main checkout and every step's worktree.

### Red command

This is the first way: a failing test at the watcher, with held watches and fake timers. In the copy it was a `describe('RED Q109 ...')` block appended to `tests/server/root/watch/sessions.test.ts`.
- It uses production's waits (`DEBOUNCE` 500, liveness 15000, rescanEvery 300000).
- For each interval, it fires the store's held `fs.watch` listener and appends a line to `projects/-diag/w.jsonl` every `every` ms. After 2 s it sets the terminal source's list to one shell and calls its `onChange`.
- It then advances the fake clock in 10 ms steps for up to 20000 ms, waiting for a `sessions` payload that lists the shell. If none comes, it stops the writes and measures again.
- It asserts that the shell is listed within 20000 ms.

```
$tmp/red.sh   =   cd $tmp/tree/tools/oculus && npx vitest run tests/server/root/watch/sessions.test.ts -t "RED Q109" --reporter=verbose 2>&1 | grep -E "^writes every|Tests  "
```

Runs, the same output each time (run 1 of 3 quoted; runs 2 and 3 were byte-identical):

```
--- run 1   (runs 2 and 3 identical)
writes every 100 ms: the started terminal listed NOT within 20000 ms; after the writes stopped, listed in 500 ms
writes every 300 ms: the started terminal listed NOT within 20000 ms; after the writes stopped, listed in 400 ms
writes every 450 ms: the started terminal listed NOT within 20000 ms; after the writes stopped, listed in 100 ms
writes every 600 ms: the started terminal listed in 900 ms
writes every 1000 ms: the started terminal listed in 500 ms
      Tests  3 failed | 2 passed | 15 skipped (20)
```

The symptom's 0 ms row was not put in the unit red command, because a fake 1 ms writer bypasses FSEvents. Measured instead on the copy's own server at a8c061d1 with `$tmp/orig.sh 0 100 300 450 600 1000` (the original case, below):

```
writes every 0 ms: the started terminal listed NOT within 20000 ms; after the writes stopped, listed in 569 ms
writes every 100 ms: the started terminal listed NOT within 20000 ms; after the writes stopped, listed in 495 ms
writes every 300 ms: the started terminal listed NOT within 20000 ms; after the writes stopped, listed in 449 ms
writes every 450 ms: the started terminal listed NOT within 20000 ms; after the writes stopped, listed in 137 ms
writes every 600 ms: the started terminal listed in 911 ms
writes every 1000 ms: the started terminal listed in 526 ms
```

`$tmp/orig.sh 0 0 0` gave "listed NOT within 20000 ms; after the writes stopped, listed in 538 / 579 / 561 ms".
- **0 ms row:** the started terminal was held back in 4 of 4 runs on this harness, so the symptom's row "listed in 567 ms" did not reproduce. The first diagnosis's `starve.mjs` was removed with its `$tmp`, so how its 0 ms writer differed is not verified. The 538 to 579 ms after the writes stopped is close to its 567 ms.
- **100, 300 and 450 ms rows:** they reproduce on the server as in the symptom.

**Tightening:** the case already runs on fake timers with the watches held, so no real file event and no network is involved. The shrunk case takes 2.571 s of wall time (`time (Q109_CUT=clocks,append,transcript,others,lead $tmp/red.sh)`), and its output is quoted under Shrunk case.

### No red command

Not applicable.

### Shrunk case

The cuts were made one at a time and cumulatively, through a `Q109_CUT` switch in the red block.

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| The liveness re-check and slow clock (`liveness: 0, rescanEvery: 0`) | red: 100/300/450 "NOT within 20000 ms" | cut |
| The real append to `w.jsonl` (event only) | red, same lines | cut |
| The fixture's initial transcript | red, same lines | cut |
| The codex store and the registry | red, same lines | cut |
| The 2 s of writes before the terminal start | red: 100/300/450 "NOT within 20000 ms; after the writes stopped, listed in 500/300/300 ms" | cut |
| The quiet (`debounce: 0`) | green: all five "listed in 10 ms", `Tests 5 passed` | put back |
| The store events (no event fired) | green: all five "listed in 500 ms", `Tests 5 passed` | put back |

**The shrunk case** is the watcher with its 500 ms quiet, one store event every 100, 300 or 450 ms, and one terminal change. Removing either the quiet or the events turns the red command green.

### Hypotheses

1. If the shared trailing debounce (`perfect-debounce`, wait 500, timer restarted on every call, no maximum wait) holds the rescan back for as long as events keep arriving, then capping the wait turns the red command green. Falsified by: the red command still red with a 1000 ms cap.
2. If the rescans do run during the writes but their publish is lost or does not carry the terminal, then counting the watcher's completed rescans during the writes shows more than zero. Falsified by: zero rescans while the writes go on.
3. If the terminal change is held only because it shares one debounce with the store events, then giving the terminals' change a debounce of its own turns the terminal part green. Falsified by: still red with a separate debounce. Even if it stands, it does not cover the held records.
4. If perfect-debounce's promise and trailing bookkeeping holds the call, rather than the restart of the timer, then a plain `clearTimeout`/`setTimeout` debounce of 500 ms in its place turns the red command green. Falsified by: still red with the plain restarting debounce.

The reply to the hypotheses: none, no person present.

The second list: not needed.

### Probes

Each probe ran the shrunk red command (`Q109_CUT=clocks,append,transcript,others,lead $tmp/red.sh`), and each was undone by copying `$tmp/pristine/<file>` back, with `cmp` confirming the file was restored.

| Rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 1 | In `sessions.ts` `queue()`: `+ let cap = null;` and, after `void queued();`, `+ if (cap === null) { cap = setTimeout(() => { cap = null; void queued.flush(); }, 1000); }` | 100/300/450: "listed in 1000 ms"; 600/1000: "listed in 500 ms"; `Tests 5 passed`. Unshrunk unit case: "listed in 200/500/800/800/500 ms", `Tests 5 passed`. Undone, the same command gives 100/300/450 "NOT within 20000 ms", `Tests 3 failed \| 2 passed` | still standing |
| 2 | In the red test: `+ let rescans = 0; watcher.onChange(() => (rescans += 1));` before the terminal start, and `+ console.log(... rescans while the writes went on: ${rescans})` after the writes stop (no logging in the code under test) | "writes every 100 ms: rescans while the writes went on: 0", 300: 0, 450: 0, 600: 1, 1000: 1 | falsified |
| 3 | `- const offTerminals = options.terminals?.onChange(() => queue()) ?? null;` `+ const terminalsQueued = debounced(() => { rescan(); }, debounce);` `+ const offTerminals = options.terminals?.onChange(() => void terminalsQueued()) ?? null;` | all five "listed in 500 ms", `Tests 5 passed` | stands for the terminal part only; probe 2 shows the store rescans still never run during the writes, so the records stay held |
| 4 | `- const queued = debounced(() => { rescan(); }, debounce);` `+ let plain = null; const queued = { cancel: () => { if (plain !== null) clearTimeout(plain); } };` and in `queue()` `- void queued();` `+ if (plain !== null) clearTimeout(plain); plain = setTimeout(() => { plain = null; rescan(); }, debounce);` | 100/300/450 "NOT within 20000 ms", `Tests 3 failed \| 2 passed` | falsified |

No probe added logging to the code under test, so no `DIAG-` tag was used.

### Cause

The cause is hypothesis 1. In `src/lib/server/root/watch/sessions.ts`, every store event (`open`, `:218-225`) and the terminals' change (`:258`) call one `perfect-debounce` debounce of `DEBOUNCE = 500` ms (`:44`, `:209-216`).
- **What the library does:** that debounce clears and restarts its timer on every call (`clearTimeout(timeout); timeout = setTimeout(..., wait)` in `node_modules/perfect-debounce/dist/index.mjs`, version 2.1.0) and has no maximum-wait option.
- **What follows:** while any watched store is written more often than every 500 ms, no rescan runs. Probe 2 counted 0 rescans during writes every 100, 300 and 450 ms. Nothing is published: not a started, renamed or recoloured terminal, and not the session's own records.
- **The probe that shows it:** probe 1. With a 1000 ms cap, the red command is green on every interval. Without it, it is red on 100, 300 and 450 ms.
- **The other hypotheses:** hypothesis 3 shows the shared debounce is why the terminal part is held. It is not the cause of the held records, so the fix belongs at the debounce and not at the terminals' handle. Hypothesis 4 shows the restart of the timer is the mechanism, not the library's promise handling.

### Fix and test

**The bound.** A change is published at most `MAX_WAIT = 2 * DEBOUNCE = 1000` ms after the first event of the burst it falls into, however often events keep coming. Since the terminal change is itself in that burst, a terminal start, end, rename, icon or colour, and a store write, are each published within 1000 ms plus the time of the rescan and the delivery. The reasons for 1000 ms:
- **A burst still costs one rescan.** A burst that ends within one quiet of its start is rescanned once, by the quiet, before the cap fires. Measured with a throwaway counting block over the watcher's `onChange` (the "COUNT Q109" cases, removed with the copy): "a burst of three events 100 ms apart: 1 rescans", both with the fix and without it.
- **Steady writes cost no more than they do today.** Under writes that never stop, it costs about one rescan a second, which is fewer than a writer every 600 ms already causes at a8c061d1, where each write is a rescan. Measured over 20000 simulated ms, writes every 100 / 300 / 600 / 1000 ms:
  - without the fix: 0 / 0 / 32 / 19 rescans;
  - with the fix: 18 / 16 / 32 / 19 rescans.
- **A started terminal appears within about a second.** The server measurement below shows 94 to 998 ms.

**Test, run on the tree without the fix.** The test is `describe('while a session store is written more often than the quiet')` inside `describe('watchSessions')` in `tests/server/root/watch/sessions.test.ts`, as in the diff further down. It has five cases on fake timers with the watches held, at production's `DEBOUNCE`, and `BOUND = 2 * DEBOUNCE`:
- a started terminal, with the store written every 100, 300 and 450 ms;
- a renamed terminal with a new icon and colour, with writes every 100 ms;
- the session's own appended prompts, with writes every 100 ms.

`sessions.ts` was at a8c061d1, checked with `git diff --quiet src/lib/server/root/watch/sessions.ts && echo "sessions.ts == a8c061d1"`, which printed that line:

```
$ cd $tmp/tree/tools/oculus && npx vitest run tests/server/root/watch/sessions.test.ts --reporter=verbose
 FAIL publishes a started terminal within the bound when the store is written every 100 ms 109ms
 FAIL publishes a started terminal within the bound when the store is written every 300 ms 42ms
 FAIL publishes a started terminal within the bound when the store is written every 450 ms 19ms
 FAIL publishes a renamed terminal within the bound while the store is written 70ms
 FAIL publishes the session's own appended prompts within the bound while they are written 44ms
AssertionError: the started terminal published in -1 ms: expected -1 to be greater than 0
AssertionError: the renamed terminal published in -1 ms: expected -1 to be greater than 0
AssertionError: the 21 prompts written published in -1 ms: expected -1 to be greater than 0
      Tests  5 failed | 15 passed (20)
```

The same five cases failed on three earlier runs of the test before its formatting pass.

**Fix**, `tools/oculus/src/lib/server/root/watch/sessions.ts`:

```diff
@@ -4,14 +4,15 @@
-// One debounce over every handle, perfect-debounce's. A transcript is appended to as a session
-// works, so a change there is an ordinary .jsonl write; a registry file appears when a session
-// starts, changes when it goes from busy to idle, and vanishes when it ends; a rollout appends
-// under YYYY/MM/DD, and a new day makes a new folder, which the recursive watch on the store's root
-// sees. One more is a file no session writes: the overrides file, which is api/write's, and without
-// it a dismissal or a pin made on one page would not reach another until a transcript happened to
-// change. The byte-offset cache in sessions/cache.ts is what makes the rescan cost the appended
-// bytes rather than the whole store.
+// One debounce over every handle, perfect-debounce's, with a cap on how long it holds a rescan
+// back (MAX_WAIT). A transcript is appended to as a session works, so a change there is an ordinary
+// .jsonl write, and a working session makes them more often than the quiet; a registry file appears
+// when a session starts, changes when it goes from busy to idle, and vanishes when it ends; a
+// rollout appends under YYYY/MM/DD, and a new day makes a new folder, which the recursive watch on
+// the store's root sees. One more is a file no session writes: the overrides file, which is
+// api/write's, and without it a dismissal or a pin made on one page would not reach another until a
+// transcript happened to change. The byte-offset cache in sessions/cache.ts is what makes the
+// rescan cost the appended bytes rather than the whole store.
@@ -42,6 +43,15 @@
 /** Milliseconds of quiet after the last file event before one rescan runs. */
 export const DEBOUNCE = 500;
+/**
+ * Milliseconds the first event of a burst waits at most for its rescan, however often events keep
+ * coming. A session that is working appends to its transcript many times a second, and each append
+ * restarts the quiet, so without a cap neither a terminal started, renamed or ended nor the
+ * session's own records would be published for as long as it works. Twice the quiet still makes a
+ * burst that ends within one quiet one rescan, and under writes that never stop it costs one rescan
+ * a second, fewer than a write every 600 ms already causes, since each of those is a rescan.
+ */
+export const MAX_WAIT = 2 * DEBOUNCE;
@@ -206,13 +216,26 @@
-    const queued = debounced(() => {
+    /** The cap's timer, armed by the first event of a burst and cleared by its rescan. */
+    let cap: ReturnType<typeof setTimeout> | null = null;
+
+    const run = (): void => {
+        if (cap !== null) clearTimeout(cap);
+        cap = null;
         rescan();
-    }, debounce);
+    };
+
+    const queued = debounced(run, debounce);
 
     const queue = (): void => {
         if (closed) return;
         void queued();
+        // The cap cancels the quiet rather than flushing it, so the promises perfect-debounce
+        // keeps for every call since the burst began are dropped with it.
+        cap ??= setTimeout(() => {
+            queued.cancel();
+            run();
+        }, MAX_WAIT);
     };
@@ -290,6 +313,8 @@
             closed = true;
             if (offTerminals !== null) offTerminals();
             queued.cancel();
+            if (cap !== null) clearTimeout(cap);
+            cap = null;
             if (ticker !== null) clearInterval(ticker);
```

`tools/oculus/DESIGN.md:116`, the "Watchers" paragraph, gets one sentence appended after "...plus the overrides file.":

```
+ Its debounce is capped at `MAX_WAIT` in `server/root/watch/sessions.ts`, twice the 500 ms quiet: a working session appends to its transcript more often than the quiet, and each append restarts it, so the first event of a burst is rescanned at most 1000 ms after it however often events keep coming, and a terminal started or renamed and the session's own records reach the page within that time.
```

**Test**, `tools/oculus/tests/server/root/watch/sessions.test.ts`. It adds `DEBOUNCE,` to the import from `sessions.ts`, and inserts this block before `it('carries no terminal list when it was given no terminal source', ...)`:

```ts
    describe('while a session store is written more often than the quiet', () => {
        /**
         * The longest a change waits to be published, however often the stores are written: twice
         * the quiet of one burst. A session that is working appends to its transcript many times a
         * second, and each append restarts the quiet.
         */
        const BOUND = 2 * DEBOUNCE;

        type Writing = {
            got: Message[];
            moved: () => void;
            set: (list: Terminal[]) => void;
            written: () => number;
        };

        /**
         * The watcher with its own quiet over `initial` terminals, its watches held, and a prompt
         * appended to the transcript with the store's event fired every `every` ms from then on,
         * for two seconds before the case changes anything.
         */
        async function writing(every: number, initial: Terminal[] = []): Promise<Writing> {
            const fixture = new Fixture();
            fixture.transcript([prompt('2026-09-10T10:00:00.000Z', 'first question')]);
            let terminals = initial;
            let moved = noop;
            const source: TerminalSource = {
                list: () => terminals,
                onChange: (listener) => {
                    moved = listener;
                    return noop;
                }
            };
            watches.held = true;
            vi.useFakeTimers({
                toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval']
            });
            const hub = new Hub();
            const client = recording();
            hub.subscribe(client.sink, ['sessions']);
            watchers.push(
                watchSessions(hub, {
                    stores: [fixture.store],
                    cache: fixture.cache,
                    overrides: fixture.overrides,
                    roots: [fixture.root],
                    projectFolders: () => [],
                    liveness: 0,
                    rescanEvery: 0,
                    terminals: source,
                    probe: fixture.probe(),
                    codexProbe: fixture.codexProbe()
                })
            );
            await vi.advanceTimersByTimeAsync(0);
            const event = watches.listeners.get(fixture.store);
            expect(event).toBeDefined();
            let written = 1;
            setInterval(() => {
                written += 1;
                fixture.append([prompt('2026-09-10T10:00:01.000Z', `question ${written}`)]);
                event?.('change', join(SLUG, `${SID}.jsonl`));
            }, every);
            await vi.advanceTimersByTimeAsync(2000);
            return {
                got: client.got,
                moved: () => moved(),
                set: (list) => (terminals = list),
                written: () => written
            };
        }

        /** The simulated ms until the channel's latest payload holds, or -1 past BOUND. */
        async function publishedIn(
            got: Message[],
            holds: (payload: SessionsPayload) => boolean
        ): Promise<number> {
            for (let at = 10; at <= BOUND; at += 10) {
                await vi.advanceTimersByTimeAsync(10);
                if (holds(latest(got))) return at;
            }
            return -1;
        }

        for (const every of [100, 300, 450]) {
            it(`publishes a started terminal within the bound when the store is written every ${every} ms`, async () => {
                const run = await writing(every);
                run.set([terminal('a1b2c3-shell')]);
                run.moved();
                const at = await publishedIn(run.got, (payload) =>
                    (payload.terminals ?? []).some((one) => one.id === 'a1b2c3-shell')
                );
                expect(at, `the started terminal published in ${at} ms`).toBeGreaterThan(0);
            });
        }

        it('publishes a renamed terminal within the bound while the store is written', async () => {
            const run = await writing(100, [terminal('a1b2c3-shell')]);
            expect(latest(run.got).terminals?.map((one) => one.name)).toEqual(['a1b2c3-shell']);
            run.set([
                { ...terminal('a1b2c3-shell'), name: 'renamed', icon: 'flask', color: 'teal' }
            ]);
            run.moved();
            const at = await publishedIn(run.got, (payload) =>
                (payload.terminals ?? []).some(
                    (one) => one.name === 'renamed' && one.icon === 'flask' && one.color === 'teal'
                )
            );
            expect(at, `the renamed terminal published in ${at} ms`).toBeGreaterThan(0);
        });

        it("publishes the session's own appended prompts within the bound while they are written", async () => {
            const run = await writing(100);
            const written = run.written();
            expect(written).toBeGreaterThan(2);
            const at = await publishedIn(
                run.got,
                (payload) => payload.records[0].prompts >= written
            );
            expect(at, `the ${written} prompts written published in ${at} ms`).toBeGreaterThan(0);
        });
    });
```

**Runs after the fix:**

```
$ npx vitest run tests/server/root/watch/sessions.test.ts --reporter=verbose       (the test, with the fix)
 PASS publishes a started terminal within the bound when the store is written every 100 ms 331ms
 PASS publishes a started terminal within the bound when the store is written every 300 ms 53ms
 PASS publishes a started terminal within the bound when the store is written every 450 ms 45ms
 PASS publishes a renamed terminal within the bound while the store is written 57ms
 PASS publishes the session's own appended prompts within the bound while they are written 50ms
      Tests  20 passed (20)
(three more runs before the formatting pass: Tests  20 passed (20) each; the existing
 "debounces a burst into one rescan, waits the whole quiet again, and runs none after close" passed in each)

$ Q109_CUT=clocks,append,transcript,others,lead $tmp/red.sh     (the red command, shrunk, with the fix)
writes every 100 ms: the started terminal listed in 1000 ms
writes every 300 ms: the started terminal listed in 1000 ms
writes every 450 ms: the started terminal listed in 1000 ms
writes every 600 ms: the started terminal listed in 500 ms
writes every 1000 ms: the started terminal listed in 500 ms
      Tests  5 passed | 20 skipped (25)
$ $tmp/red.sh                                                   (the red command, unshrunk unit case, with the fix)
writes every 100 ms: the started terminal listed in 200 ms
writes every 300 ms: the started terminal listed in 500 ms
writes every 450 ms: the started terminal listed in 800 ms
writes every 600 ms: the started terminal listed in 800 ms
writes every 1000 ms: the started terminal listed in 500 ms
      Tests  5 passed | 20 skipped (25)

$ $tmp/orig.sh 0 100 300 450 600 1000                           (the original case: the copy's own server on 8825, with the fix)
writes every 0 ms: the started terminal listed in 998 ms
writes every 100 ms: the started terminal listed in 94 ms
writes every 300 ms: the started terminal listed in 513 ms
writes every 450 ms: the started terminal listed in 795 ms
writes every 600 ms: the started terminal listed in 799 ms
writes every 1000 ms: the started terminal listed in 525 ms
```

**The repository's own checks on the fixed copy:**
- `npx vitest run tests/server/root/watch`: "Test Files 8 passed (8)", "Tests 101 passed (101)".
- `npx eslint src/lib/server/root/watch/sessions.ts tests/server/root/watch/sessions.test.ts`: clean.
- `npx prettier --check` on both files: "All matched files use Prettier code style!"
- `npm run check`: "COMPLETED 2487 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS".
- `npx vitest run tests/checks --tagsFilter '!slow'`: "Test Files 27 passed | 2 skipped (29)", "Tests 365 passed | 9 skipped (374)".

**What these do not cover:**
- **0 ms on the server:** 998 ms sits at the bound. The server's figure includes the rescan, the websocket delivery and the client's 10 ms poll, so a bound stated for the server is MAX_WAIT plus that time. Here that time is not measured on its own.
- **Real Claude Code writes:** the fix is not measured against a real Claude Code session's write pattern.

No test reaches it: not applicable. No test is written: not applicable.

**Observations outside this symptom, from reading only (not probed):**
- **Other watchers:** `portfolio.ts:25`, `bookmarks.ts:28`, `local.ts:12` and `machine/usage/watch.ts:11` use the same restarting perfect-debounce with no cap. A store of theirs that is written more often than their quiet would hold their channel back the same way.
- **Promise list:** perfect-debounce pushes one `resolve` per call onto `resolveList`, which is emptied only when its timer fires or on `cancel()`. At a8c061d1, that list grows for as long as writes never leave a quiet. The fix's cap calls `queued.cancel()`, which empties it at least once per MAX_WAIT. The memory this costs today is not measured.

### Cleanup

```
$ lsof -nP -iTCP:8825 -sTCP:LISTEN || echo "8825: nothing listening"
8825: nothing listening
$ tmux -S $tmp/tmux/tmux-502/default kill-server
no server running on $tmp/tmux/tmux-502/default
$ pgrep -f diagnose.c56kE4
no process names $tmp
$ grep -rln "DIAG-" $tmp/tree/tools/oculus/src $tmp/tree/tools/oculus/tests
grep exit 1 (1 = none)
$ git worktree remove --force "$tmp/tree"        (from the main checkout)
worktree remove exit 0
$ rm -rf "$tmp"; ls -d "$tmp"
ls: $tmp: No such file or directory
$ git worktree list | grep -c diagnose.c56kE4
0
```

- **Server and tmux:** `diag-starve.mjs` stopped its own server's process group and killed its own tmux server in its `finally` block, so the `kill-server` above found none running.
- **Throwaway files:** the red block, the count block, `diag-starve.mjs`, `red.sh`, `orig.sh`, `test.sh`, the pristine copies, the probe files and the stub `ssh` went with the copy and `$tmp`.
- **Credentials:** no credential or `.env` file was copied into `$tmp`.
- **Nothing else written:** nothing was written into the ledger, the main checkout or any step's worktree. `git status --short` in the main checkout lists only files this diagnosis did not touch (ledger files, `shikijs-types-4.4.3.tgz`, `Q109-diagnosis.md`).
- **Red command on the original case:** run with the fix, quoted under "Runs after the fix"; it is carried by the round as its check.

### Usage

From the completion notice: agent add169c371291c833, served claude-opus-5-5, 188,283 tokens, 50 tool uses, 19.8 min.
