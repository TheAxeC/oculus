# Diagnosis: O30 round 2 P2-1, the typed line after a Restart

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. A diagnosis of the same step later is appended below under its own heading at the level of the title above, `# Diagnosis: <the symptom in a few words>`, which names its finding or quotes its part.

Diagnosis agent: ae831f63ce80bd34e, claude-opus-5-5, 281,869 tokens, 108 tool uses, 53.1 min

**What it found.** The line in run r27 was never sent by the page, and the Restart is not the reason. r27 pasted `echo after-restart\n`, and that text ends in a line break. The terminal grid's paste hold (`holdPastes`, `terminal-list.ts:220-233`, wired at `TerminalGrid.svelte:330`) stops any paste that holds a line break and asks "Paste 1 lines into the terminal?". Nobody answered the question, so nothing reached the pane and no `pty: input on` line was logged. New Terminal still worked because it is an HTTP POST. The hold was added by c347facbf, which is already in base 9a5f38a5b.

**Typing after a Restart.** A line typed into the open terminal after the restart reaches the pane in 3 of 3 runs. This was checked in headless Chrome; the desktop app was not started.

**Is it the same fix as B2-1 and B2-2?** No. The case is red with no restart at all, so the socket's subscription and token are not involved.

**For the orchestrator, beside P2-1:**
- A one-line paste ending in a line break is asked about. That contradicts HELP.md ("several lines"), and the question says "1 lines". This was there before the step, and the choice is Axel's.
- Bracketed paste mode is lost after a Restart. This is a separate concern and was not diagnosed.
- Files disappeared from the scratch copy's `node_modules` while this diagnosis was running. The cause is not verified.

Details are under "Cause" and "Fix and test".

## Symptom

From `/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/agents/reviews/O30-refuter.md`, heading "Repair round 2, refuted", finding P2-1, word for word:

```
- **P2-1. The typed line after a Restart is not shown, and the run cannot tell where it was lost.**
  - **The run:** `cases/r27.sh` pastes with `keys.mjs ... "cmd+v=paste"` after the Restart. r27.out shows `pane:  words|kept words|axelfaes@YQ530VVFGK hub %|`. The `kept words` line came from `tmux send-keys`, not from the page.
  - **The control exists from round 1.** r12.out shows the same paste route putting `hello world` in a pane, on the round 1 tree.
  - **What a read settles: the drop was not at the token check.**
    - A keystroke from a socket that never carried the token is dropped at `channel.ts:497-499`, which prints `pty: input on <channel> from a socket without the write token`.
    - Server stderr reaches the app's log (`process.ts:94`, and the log's `[server] sessions watch` lines are stderr).
    - `grep -c "pty" scratchpad/o30-look/app.log` prints 1, a build line. No such refusal follows the second `[server] oculus on http://127.0.0.1:8819` line.
  - **The places that remain.** The keystroke was either:
    - never sent by the page: `socket.send` returning false (`socket.svelte.ts:163-166`), `order.hold` holding it behind a grid attach (`pty-wire.ts:39-40`), or xterm producing no `onData`; or
    - dropped without a log at `channel.ts:501`, because the new socket was not attached to that terminal's channel. That happens when the channel left `channels` through `unsubscribePty` on a grid close (`TerminalGrid.svelte:386`).
  - **A lead in the run's own output.** The page's shell tabs read `["7d3624-shell"]` before the Restart and `["44e39f-shell"]` after New Terminal, while tmux still lists `oculus-7d3624-shell`. Whether the focused `.xterm-helper-textarea` at the paste belonged to 7d3624's grid is not recorded.
  - **The probe that settles it**, in one start:
    1. After the Restart, read in the page which terminal the focused grid shows, its `pty:` channel, and `socket.status()`.
    2. Paste once.
    3. grep the app log for `pty: input on`.
    4. If nothing is logged, compare the server's attached set for that terminal, or read whether the page's reconnect subscription named that channel.
  - **Size:** cause unknown, so not a landing fix. HELP.md:13 says the open windows keep "their running terminals" after a Restart, and a reader will take that to include typing into them.
  - **Verdict:** item 2 partial, case 24 partial.
```

The symptom has two parts:
- After a Restart, a line put into an already open terminal never reaches its tmux pane, and no token refusal is logged.
- New Terminal works.

The builder's run files were read and not changed: `scratchpad/cases/r27.sh`, `r27.out` and `r12.sh`, and `r12.out`, `o30-look/app.log` and `o30-look/dialogs.log`. They are under `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/`. The lines that carry the symptom:

```
r27.sh:  printf 'echo after-restart\n' | pbcopy
r27.sh:  K "$M" "cmd+v=paste"; sleep 2
r27.out: pane:  words|kept words|axelfaes@YQ530VVFGK hub %|
r27.out: New Terminal after the Restart:
r27.out: "{\"tabs\":[\"44e39f-shell\"]}"
r12.out: clipboard: hello world
r12.out: pane after Cmd+V: look/home/.oh-my-zsh/oh-my-zsh.sh|axelfaes@YQ530VVFGK hub % sleep 600|hello world|
$ grep -n -i "pty\|token\|input on" o30-look/app.log
720:[build] Generated an empty chunk: "chunks/env.js".
```

## Where the probes run

The probes ran in the scratch copy `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.yilYbS/tree`. It was built as follows:
- `git worktree add --detach "$tmp/tree" 9a5f38a5b`, run from the main checkout.
- The step's diff `git diff --binary 9a5f38a5b`, taken inside `.agents/worktrees/O30` and applied with `git apply --allow-empty`, which printed "applied".
- The 52 files that `git status --porcelain --untracked-files=all` lists with `??` in the worktree, each copied to the same path.
- `tools/oculus/node_modules` cloned from the worktree with `cp -cR`.
- The server build made in the copy with `npx vite build` (exit 0).

Before the first probe, `diff -rq` of the worktree's `src`, `config`, `tests` and `utils` against the copy printed nothing.

The paths redirected under `$TMPDIR` were these:
- `HOME` and `TMUX_TMPDIR`, so the server has its own tmux socket `<tmp>/tmuxdir/tmux-502/default`.
- An engine folder `<tmp>/engine`: the copy's shipped `config/` plus a `local.yml` written by the red command (`hub: <tmp>/hub`, `port: 8841`).
- A scratch hub holding one project manifest.
- A headless Chrome profile `<tmp>/chrome` on CDP port 9411.

`ORDO_STABLE` and `ORDO_SKILL_DIRS` were not redirected, since nothing touches them. No command used port 8787 or 8790, Axel's `~/.oculus` or his tmux server, and no command read `tools/oculus/config/local.yml`.

Taken before the copy was made, from inside the step's worktree:

```
$ git status --short
 M tools/oculus/.scratch/migration/agents/briefs/O30.md
 M tools/oculus/.scratch/migration/agents/spec.md
 M tools/oculus/DESIGN.md
 M tools/oculus/HELP.md
 M tools/oculus/README.md
 M tools/oculus/config/text/server.yml
 M tools/oculus/config/text/ui.yml
 M tools/oculus/docs/diagrams/channels.dot
 M tools/oculus/docs/diagrams/channels.svg
 M tools/oculus/docs/diagrams/layer-server.dot
 M tools/oculus/docs/diagrams/layer-server.svg
 M tools/oculus/docs/diagrams/layer-shell.dot
 M tools/oculus/docs/diagrams/layer-shell.svg
 M tools/oculus/docs/diagrams/layer-state.dot
 M tools/oculus/docs/diagrams/layer-state.svg
 M tools/oculus/docs/diagrams/layer-views.dot
 M tools/oculus/docs/diagrams/layer-views.svg
 M tools/oculus/docs/diagrams/layers.dot
 M tools/oculus/docs/diagrams/layers.svg
 M tools/oculus/package-lock.json
 M tools/oculus/package.json
 M tools/oculus/src/hooks.server.ts
 M tools/oculus/src/lib/assets/favicon.svg
 M tools/oculus/src/lib/server/core/auth.ts
 M tools/oculus/src/lib/server/files/fs/picker.ts
 M tools/oculus/src/lib/server/root/process/args.ts
 M tools/oculus/src/lib/shell/Workbench.svelte
 M tools/oculus/src/lib/shell/context-guard.ts
 M tools/oculus/src/lib/shell/keys/key-dom.ts
 M tools/oculus/src/lib/shell/keys/keys.ts
 M tools/oculus/src/lib/shell/keys/workbench-keys.svelte.ts
 M tools/oculus/src/lib/shell/panes/PaneView.svelte
 M tools/oculus/src/lib/shell/panes/floats/FloatLayer.svelte
 M tools/oculus/src/lib/shell/panes/floats/float-geometry.ts
 M tools/oculus/src/lib/shell/panes/pane-view.ts
 M tools/oculus/src/lib/shell/panes/strip/tab-menu-state.svelte.ts
 M tools/oculus/src/lib/shell/panes/strip/tab-menu.ts
 M tools/oculus/src/lib/state/client/context.ts
 M tools/oculus/src/lib/state/client/socket.svelte.ts
 M tools/oculus/src/lib/state/client/writes.svelte.ts
 M tools/oculus/src/lib/state/sessions/source.svelte.ts
 M tools/oculus/src/lib/state/sessions/terminal/commands.svelte.ts
 M tools/oculus/src/lib/state/sessions/terminal/pty/pty-io.ts
 M tools/oculus/src/lib/state/sessions/terminal/workbench-shape.ts
 M tools/oculus/src/lib/state/sessions/terminals.svelte.ts
 M tools/oculus/src/lib/state/shared/stores/shapes.ts
 M tools/oculus/src/lib/state/shared/words/appearance.ts
 M tools/oculus/src/lib/state/workbench/drag.svelte.ts
 M tools/oculus/src/lib/state/workbench/layout.svelte.ts
 M tools/oculus/src/lib/state/workbench/layout/index.ts
 M tools/oculus/src/lib/state/workbench/layout/instances.ts
 M tools/oculus/src/lib/state/workbench/layout/model.ts
 D tools/oculus/src/lib/state/workbench/layout/open/floats.ts
 M tools/oculus/src/lib/state/workbench/layout/saved/saved.ts
 M tools/oculus/src/lib/state/workbench/layout/saved/storage.ts
 M tools/oculus/src/lib/state/workbench/ui.svelte.ts
 M tools/oculus/src/lib/ui/controls/editor/Editor.svelte
 M tools/oculus/src/lib/ui/controls/editor/commands.ts
 M tools/oculus/src/lib/ui/controls/text/TextBoxMenu.svelte
 M tools/oculus/src/lib/ui/controls/text/text-menu.ts
 M tools/oculus/src/lib/ui/menu/ContextMenu.svelte
 M tools/oculus/src/lib/views/sources/source/Editor.svelte
 M tools/oculus/src/lib/views/sources/source/Source.svelte
 M tools/oculus/src/routes/+page.svelte
 M tools/oculus/src/routes/+page.ts
 M tools/oculus/src/server.ts
 M tools/oculus/tests/checks/config/config-folder.test.ts
 M tools/oculus/tests/checks/imports/order.ts
 M tools/oculus/tests/checks/tree/boundaries.test.ts
 M tools/oculus/tests/state/workbench/layout/saved/layout-saved.test.ts
 M tools/oculus/utils/diagrams/graphs.mjs
?? tools/oculus/.scratch/migration/agents/briefs/O30-cases.md
?? tools/oculus/.scratch/migration/agents/reviews/O30-report.md
?? tools/oculus/assets/app-icon.png
?? tools/oculus/assets/app-icon.svg
?? tools/oculus/config/text/desktop.yml
?? tools/oculus/src/desktop/
?? tools/oculus/src/lib/server/root/process/parent.ts
?? tools/oculus/src/lib/server/root/process/port.ts
?? tools/oculus/src/lib/server/root/process/words.ts
?? tools/oculus/src/lib/shell/desktop-windows.svelte.ts
?? tools/oculus/src/lib/shell/panes/floats/FloatWindow.svelte
?? tools/oculus/src/lib/shell/panes/floats/window-bounds.ts
?? tools/oculus/src/lib/shell/panes/strip/strip-tab.ts
?? tools/oculus/src/lib/state/shared/page/
?? tools/oculus/src/lib/state/shared/stores/desktop.ts
?? tools/oculus/src/lib/state/workbench/layout/open/float/
?? tools/oculus/src/lib/state/workbench/layout/saved/load.ts
?? tools/oculus/src/lib/ui/controls/text/spelling.ts
?? tools/oculus/src/lib/views/sources/source/save/LockedCode.svelte
?? tools/oculus/src/lib/views/sources/source/save/locked-words.ts
?? tools/oculus/src/routes/api/health/
?? tools/oculus/src/routes/find/
?? tools/oculus/tests/server/desktop/
$ git diff --binary 9a5f38a5b | shasum
66606744f9692c588f9e9542a04ca9f0dfcf93fa  -
```

After the run, from the same worktree:

```
$ git diff --binary 9a5f38a5b | shasum
66606744f9692c588f9e9542a04ca9f0dfcf93fa  -
$ git status --short | wc -l
      94
```

The worktree is unchanged.

## Red command

The red command was built without the desktop app, as the brief ordered. Because it reproduced the symptom, the app was not started.

```
PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH D=$TMPDIR/diagnose.yilYbS node $D/red.mjs
```

It does five things:
- Starts a scratch server (`node src/server.ts --engine <tmp>/engine` on port 8841) and headless Chrome (`--headless=new`, CDP 9411, scratch profile; it takes no focus).
- Opens Sessions, then Terminal, then New Terminal, and types a control line.
- Kills the server and starts it again on the same port.
- After 14 s, about where r27 pasted, puts the line into the open terminal the way r27 did: a paste of `echo line-$((40+3))\n`.
- Reads the pane with `tmux -S <socket> capture-pane`, then presses New Terminal.

It asserts both parts of the symptom and reads the server log for `pty: input on`. Its source, `red.mjs`, as run:

```js
// The red command of O30 round 2 P2-1. A scratch oculus server (port 8841, scratch HOME, its own
// tmux socket) and a headless Chrome page (CDP 9411, scratch profile) holding an open terminal;
// the server killed and started again on the same port (RESTART=1, the default); a line put into
// the open terminal the way run r27 put it (INPUT=paste, a paste event carrying the line and, with
// NL=1, its trailing newline) or typed (INPUT=keys); the tmux pane read with capture-pane.
// Exit 1 when the line never reaches the pane (the symptom), 0 when it does.
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, openSync, readFileSync, writeFileSync } from 'node:fs';
const D = process.env.D;
const TREE = `${D}/tree/tools/oculus`;
const PORT = 8841;
const CDP = 9411;
const RESTART = process.env.RESTART !== '0';
const INPUT = process.env.INPUT ?? 'paste';
const NL = process.env.NL !== '0';
const WAIT_AFTER_RESTART = Number(process.env.WAIT_AFTER_RESTART ?? 14000);
const env = { ...process.env, HOME: `${D}/home`, TMUX_TMPDIR: `${D}/tmuxdir` };
const SOCK = `${D}/tmuxdir/tmux-${process.getuid()}/default`;
const LOG = `${D}/server.log`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tmux = (...a) => { try { return execFileSync('tmux', ['-S', SOCK, ...a], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return ''; } };
const shells = () => tmux('list-sessions', '-F', '#{session_name}').split('\n').filter((s) => /shell/.test(s));
tmux('kill-server');
for (const p of ['home', 'hub', 'tmuxdir', 'chrome']) rmSync(`${D}/${p}`, { recursive: true, force: true, maxRetries: 10 });
for (const p of ['home', 'hub/projects/active/demo', 'tmuxdir']) mkdirSync(`${D}/${p}`, { recursive: true });
writeFileSync(`${D}/hub/projects/active/demo/project.yml`, readFileSync(`${D}/manifest.yml`));   // id: demo, type: active, a scratch project
writeFileSync(`${D}/engine/config/local.yml`, `hub: ${D}/hub\nport: ${PORT}\n`);
writeFileSync(LOG, '');
let server; let starts = 0;
async function startServer() {
    const fd = openSync(LOG, 'a');
    server = spawn(process.execPath, ['src/server.ts', '--engine', `${D}/engine`], { cwd: TREE, env, stdio: ['ignore', fd, fd] });
    starts += 1;
    for (let i = 0; i < 900; i++) { if (readFileSync(LOG, 'utf8').split('\n').filter((l) => l.startsWith('oculus on')).length >= starts) return; await sleep(100); }
    throw new Error('server did not start: ' + readFileSync(LOG, 'utf8').slice(-400));
}
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${CDP}`, `--user-data-dir=${D}/chrome`, '--no-first-run', '--no-default-browser-check', '--window-size=1400,900', 'about:blank'], { stdio: 'ignore' });
const say = (s) => console.log(s);
let code = 2;
try {
    say(`case: restart ${RESTART ? 'yes' : 'no'}, input ${INPUT}, trailing newline ${INPUT === 'paste' ? (NL ? 'yes' : 'no') : 'Enter key'}`);
    await startServer();
    let list = [];
    for (let i = 0; i < 100; i++) { try { list = await (await fetch(`http://127.0.0.1:${CDP}/json/list`)).json(); if (list.some((t) => t.type === 'page')) break; } catch {} await sleep(100); }
    const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));
    let id = 0; const T0 = Date.now(); const at = () => ((Date.now() - T0) / 1000).toFixed(1);
    const frames = []; const consoleLines = [];
    ws.addEventListener('message', (m) => {
        const d = JSON.parse(m.data);
        if (d.method === 'Network.webSocketFrameSent') frames.push(`${at()} sent ${d.params.response.payloadData.slice(0, 150)}`);
        if (d.method === 'Network.webSocketCreated') frames.push(`${at()} socket created`);
        if (d.method === 'Runtime.consoleAPICalled') { const text = d.params.args.map((a) => a.value ?? a.description ?? '').join(' '); if (text.includes('DIAG-')) consoleLines.push(`${at()} ${text}`); }
    });
    const send = (method, params = {}) => new Promise((res) => { const me = ++id; const h = (m) => { const d = JSON.parse(m.data); if (d.id === me) { ws.removeEventListener('message', h); res(d); } }; ws.addEventListener('message', h); ws.send(JSON.stringify({ id: me, method, params })); });
    const ev = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
    const focus = () => ev(`(()=>{const ta=document.querySelector('.xterm-helper-textarea'); if(ta) ta.focus(); return document.activeElement.className})()`);
    const keys = async (text) => { await focus(); await send('Input.insertText', { text }); await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }); };
    const paste = async (text) => { await focus(); return ev(`(()=>{const ta=document.activeElement; const dt=new DataTransfer(); dt.setData('text/plain', ${JSON.stringify(text)}); const e=new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true}); ta.dispatchEvent(e); return e.defaultPrevented})()`); };
    const pane = (s) => tmux('capture-pane', '-p', '-t', s);
    const tail = (s) => pane(s).split('\n').filter((l) => l.trim()).slice(-2).join(' | ');
    await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
    await sleep(10000);
    await ev(`(async()=>{const s=(ms)=>new Promise(r=>setTimeout(r,ms));
        document.querySelector('button[aria-label=Sessions]').click(); await s(3000);
        const t=[...document.querySelectorAll('button[role=tab]')].find(t=>t.textContent.trim()==='Terminal'); if(t) t.click(); await s(1500);
        document.querySelector('button[aria-label="new terminal"]').click(); await s(6000); return 1})()`);
    const SES = shells()[0];
    say(`open terminal: tmux session ${SES}`);
    await keys('echo typed-$((40+2))'); await sleep(2000);
    say(`control, a line typed before anything else reached the pane: ${/^typed-42$/m.test(pane(SES)) ? 'yes' : 'no'}`);
    const origin = await ev('Math.round(performance.timeOrigin)');
    if (RESTART) {
        const t0 = Date.now(); frames.push(`${at()} --- server killed`);
        server.kill('SIGKILL'); await new Promise((r) => server.once('exit', r)); await startServer();
        frames.push(`${at()} --- server listening again`);
        say(`server killed and listening again on ${PORT} after ${((Date.now() - t0) / 1000).toFixed(1)} s`);
    }
    await sleep(WAIT_AFTER_RESTART);
    say(`page reloaded: ${origin === (await ev('Math.round(performance.timeOrigin)')) ? 'no' : 'yes'}`);
    frames.push(`${at()} --- the line put into the open terminal`);
    const line = 'echo line-$((40+3))';
    if (INPUT === 'paste') say(`paste event default prevented: ${await paste(line + (NL ? '\n' : ''))}`);
    else await keys(line);
    await sleep(2500);
    const reached = /^line-43$/m.test(pane(SES)) || (!NL && INPUT === 'paste' && pane(SES).includes(line));
    say(`PART A, the line reached pane ${SES}: ${reached ? 'yes' : 'no'}   (pane: ${tail(SES)})`);
    const asked = await ev(`document.body.innerText.match(/Paste \\d+ lines? into the terminal\\?/)?.[0] ?? ''`);
    say(`question on the page: ${asked === '' ? 'none' : JSON.stringify(asked)}`);
    const before = shells().length;
    await ev(`(async()=>{document.querySelector('button[aria-label="new terminal"]').click(); await new Promise(r=>setTimeout(r,5000)); return 1})()`);
    say(`PART B, New Terminal started a session: ${shells().length > before ? 'yes' : 'no'} (${before} -> ${shells().length})`);
    const logged = readFileSync(LOG, 'utf8').split('\n').filter((l) => /pty: input on|DIAG-/.test(l));
    say(`server log, pty refusals and DIAG lines: ${logged.length}`);
    for (const l of logged) say(`  server: ${l.slice(0, 200)}`);
    for (const l of consoleLines) say(`  page: ${l.slice(0, 200)}`);
    if (process.env.FRAMES === '1') for (const l of frames) say(`  ws ${l}`);
    code = reached ? 0 : 1;
    say(code === 1 ? 'RED: the line never reached the pane' : 'GREEN: the line reached the pane');
    ws.close();
} catch (e) { say(`error: ${e.stack}`); } finally { server?.kill('SIGKILL'); chrome.kill('SIGKILL'); tmux('kill-server'); await sleep(500); }
process.exit(code);
```

The three runs (the same command each time; every run sets its own state):

```
== run 1: D=$D node red.mjs
case: restart yes, input paste, trailing newline yes
open terminal: tmux session oculus-9be791-shell
control, a line typed before anything else reached the pane: yes
server killed and listening again on 8841 after 1.4 s
page reloaded: no
paste event default prevented: true
PART A, the line reached pane oculus-9be791-shell: no   (pane: typed-42 | axelfaes@YQ530VVFGK hub %)
question on the page: "Paste 1 lines into the terminal?"
PART B, New Terminal started a session: yes (1 -> 2)
server log, pty refusals and DIAG lines: 0
RED: the line never reached the pane
exit 1
== run 2: D=$D node red.mjs
case: restart yes, input paste, trailing newline yes
open terminal: tmux session oculus-ef48e2-shell
control, a line typed before anything else reached the pane: yes
server killed and listening again on 8841 after 1.2 s
page reloaded: no
paste event default prevented: true
PART A, the line reached pane oculus-ef48e2-shell: no   (pane: typed-42 | axelfaes@YQ530VVFGK hub %)
question on the page: "Paste 1 lines into the terminal?"
PART B, New Terminal started a session: yes (1 -> 2)
server log, pty refusals and DIAG lines: 0
RED: the line never reached the pane
exit 1
== run 3: D=$D node red.mjs
case: restart yes, input paste, trailing newline yes
open terminal: tmux session oculus-796bc1-shell
control, a line typed before anything else reached the pane: yes
server killed and listening again on 8841 after 1.5 s
page reloaded: no
paste event default prevented: true
PART A, the line reached pane oculus-796bc1-shell: no   (pane: typed-42 | axelfaes@YQ530VVFGK hub %)
question on the page: "Paste 1 lines into the terminal?"
PART B, New Terminal started a session: yes (1 -> 2)
server log, pty refusals and DIAG lines: 0
RED: the line never reached the pane
exit 1
```

The red matches r27 on every part: the line is not in the pane, New Terminal works, no `pty: input on` line is logged, and the page does not reload. The red command was not tightened further. It sets its own state, isolates `HOME`, the tmux socket and the browser profile, and reproduces on all three runs. Each run takes about 60 s because of the page loads, and the waits match r27's.

## No red command

Not applicable.

## Shrunk case

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| The parts of r27 the browser case does not have: the Electron app, popped-out windows, tab drags between windows, case 21's Cmd+A, Cmd+C, Cmd+X and Cmd+Z, the Search text menu, the page switch to Explorer and back | red, runs 1 to 3 above | cut |
| The server restart (`RESTART=0 D=$D node red.mjs`) | red: `PART A ... no`, `question on the page: "Paste 1 lines into the terminal?"`, `PART B ... yes (1 -> 2)`, `RED: the line never reached the pane` | cut |
| The trailing newline of the pasted line (`NL=0 D=$D node red.mjs`) | green: `paste event default prevented: false`, `PART A ... yes (pane: typed-42 \| axelfaes@YQ530VVFGK hub % echo line-$((40+3)))`, `question on the page: none`, `GREEN` | put back |
| The paste itself, with the line typed and Enter pressed instead (`INPUT=keys D=$D node red.mjs`) | green: `PART A ... yes (pane: line-43 \| axelfaes@YQ530VVFGK hub %)`, `question on the page: none`, `GREEN` | put back |

The shrunk case, as it stands: a paste event carrying a line that ends in a line break, put into the grid of an open terminal. The restart is not needed for the red.

## Hypotheses

1. If the grid's paste hold (`holdPastes`, `src/lib/views/sessions/terminal/terminal-list.ts:220-233`, wired at `TerminalGrid.svelte:330`) stops a paste that holds a line break and waits for the "Paste N lines into the terminal?" answer, then answering that question with Paste turns the red command green. Falsified by either of these: no DIAG line from the hold for that paste, or the line still missing from the pane after Paste is pressed.

The shrink and the browser's own record of the socket's frames (CDP `Network.webSocketFrameSent`, read without changing the code) leave only this cause standing. The others named in P2-1 are falsified as follows:
- The page's socket dropping the key after the reconnect (`socket.send` false, or `order.hold` behind a grid attach). The case is red with no restart and no reconnect at all.
- `channel.ts:501` dropping input from a socket that is not attached. No `input` frame left the page for the paste in any red run, so nothing reached the server to drop.
- A stale token on the reconnect subscription (B2-1). No refusal line was logged, and in three runs a line typed after the restart was admitted (`INPUT=keys`, under "Fix and test").
- xterm producing no `onData`. This is part of hypothesis 1: the hold stops the event in the capture phase before xterm sees it.

The reply to the hypotheses: none, no person present.

The second list: not needed.

## Probes

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 1 (logging at the boundary between the page's paste event and xterm) | `src/lib/views/sessions/terminal/terminal-list.ts`, in `holdPastes`'s `pasted`: `+        console.log('DIAG-7c41 paste on the grid', JSON.stringify(text), 'held:', lines !== null, 'lines:', lines);` after `const lines = pasteLines(text);`, then `npx vite build` | `D=$D FRAMES=1 node red.mjs`: `page: 38.0 DIAG-7c41 paste on the grid "echo line-$((40+3))\n" held: true lines: 1`. After `38.0 --- the line put into the open terminal` no `input` frame is sent; the next frames are the subscription and resize of New Terminal (`40.8 sent {"type":"subscribe",...,"pty:4ace86`). `PART A ... no`, `question on the page: "Paste 1 lines into the terminal?"`, `RED` | standing |
| 1 (the change it names: the question answered with Paste) | in `red.mjs`, after the paste: `+    await sleep(500);` `+    say(\`question answered: ${await ev(\`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Paste'); if(!b) return 'no Paste button'; b.click(); return 'Paste pressed'})()\`)}\`);` | `D=$D FRAMES=1 node red.mjs`: `question answered: Paste pressed`, `ws 38.3 sent {"type":"input","channel":"pty:169561-shell","bytes":"ZWNobyBsaW5lLSQoKDQwKzMpKQ0="}` (that is `echo line-$((40+3))\r`), `PART A, the line reached pane oculus-169561-shell: yes (pane: line-43 \| axelfaes@YQ530VVFGK hub %)`, `question on the page: none`, `PART B ... yes (1 -> 2)`, `GREEN: the line reached the pane` | standing; green with the change, red without it (runs 1 to 3) |

Each probe was undone after its run:
- Probe 1: the file was copied back from the saved original. `diff` against the saved original printed nothing, and `diff -q` against the step's worktree copy printed nothing. `grep -rn "DIAG-" src | wc -l` printed 0. After `npx vite build`, `grep -rln "DIAG-7c41" build | wc -l` printed 0.
- Probe 2: `red.mjs` was copied back from `red.mjs.orig`, and `diff` printed nothing.

## Cause

Hypothesis 1 stands, shown by the two probes: the red command is green with the question answered and red without it.

- Run r27 put its line into the open terminal as a paste of `echo after-restart\n`. The `r27.sh` line is `printf 'echo after-restart\n' | pbcopy` followed by Cmd+V.
- `pasteLines` (`terminal-list.ts:196-206` on main) answers 1 for a text that holds a line break, including a single line closed by one. It answers null only for text with no line break.
- `holdPastes` therefore stopped the paste in the capture phase, before xterm saw it, and the grid asked "Paste 1 lines into the terminal?" (`config/text/views/sessions/terminal.yml:85`).
- Nobody answered that question in r27, so the page sent no `input` frame. That is why the app log has no `pty: input on` line, and why New Terminal, an HTTP POST, still worked.

The round 1 control in r12 pasted `hello world` with no line break, so it went through.

The hold came with c347facbf ("Draw the terminal as VS Code's terminal panel"). `git merge-base --is-ancestor c347facbf 9a5f38a5b` prints "in base", and `terminal-list.ts` is not in the step's diff. So the hold was there before O30, and P2-1 is not a defect of the Restart.

The behaviour P2-1 doubted does hold in the browser: a line typed into an open terminal after the server restarts reaches the pane, 3 runs of 3 (under "Fix and test"). This was not run in the desktop app. The page code that recovers is the same in both, and r27's own output shows the app's windows were not reloaded (`timeOrigin at the end: main 1791245532098 (before 1791245532098)`).

## Fix and test

There is no fix in the step's code for P2-1: the defect is in the run's input, r27's case script. The text, before:

```
printf 'echo after-restart\n' | pbcopy
C "$M" "(()=>{const ta=document.querySelector('.xterm-helper-textarea'); if(ta) ta.focus(); return document.activeElement.className})()"
K "$M" "cmd+v=paste"; sleep 2
```

After: put the line in the way a reader types it, so the paste hold does not ask, or answer the question if it does. Either of these:

```
printf 'echo after-restart' | pbcopy
C "$M" "(()=>{const ta=document.querySelector('.xterm-helper-textarea'); if(ta) ta.focus(); return document.activeElement.className})()"
K "$M" "cmd+v=paste"; C "$M" "key:0,Enter,Enter,13"; sleep 2
```

The second is the red command with `INPUT=keys`: the line typed into the open terminal after the restart and Enter pressed. Before the second run below, `find node_modules -type f | wc -l` printed 32770.

Runs after the fix (each run with the restart):

```
== run 1: INPUT=keys FRAMES=1 D=$D node red.mjs
case: restart yes, input keys, trailing newline Enter key
server killed and listening again on 8841 after 1.5 s
PART A, the line reached pane oculus-72f63d-shell: yes   (pane: line-43 | axelfaes@YQ530VVFGK hub %)
question on the page: none
PART B, New Terminal started a session: yes (1 -> 2)
server log, pty refusals and DIAG lines: 0
GREEN: the line reached the pane
  ws 24.5 socket created
  ws 24.6 sent {"type":"subscribe","channels":["portfolio","config","sessions","git","files","hpc","calendar",
  ws 38.2 sent {"type":"input","channel":"pty:72f63d-shell","bytes":"ZWNobyBsaW5lLSQoKDQwKzMpKQ=="}
== run 2: INPUT=keys FRAMES=1 D=$D node red.mjs
server killed and listening again on 8841 after 1.5 s
PART A, the line reached pane oculus-642d47-shell: yes   (pane: line-43 | axelfaes@YQ530VVFGK hub %)
PART B, New Terminal started a session: yes (1 -> 2)
server log, pty refusals and DIAG lines: 0
GREEN: the line reached the pane
  ws 24.5 socket created
  ws 24.8 sent {"type":"subscribe",...
== run 3: INPUT=keys FRAMES=1 D=$D node red.mjs
server killed and listening again on 8841 after 1.5 s
PART A, the line reached pane oculus-f30709-shell: yes   (pane: line-43 | axelfaes@YQ530VVFGK hub %)
PART B, New Terminal started a session: yes (1 -> 2)
server log, pty refusals and DIAG lines: 0
GREEN: the line reached the pane
  ws 24.4 socket created
  ws 24.5 sent {"type":"subscribe",...
```

The red command itself stays red, since nothing in the product changed: runs 1 to 3 above. With the question answered it is green (probe 2). The original, unshrunk case (r27 in the desktop app, with its windows, drags and Cmd keys) was not run again. The brief allowed the app only if the browser could not reproduce, and it did.

- **No test reaches it:** not applicable to P2-1, since there is no defect in code.
- **The Restart behaviour:** whether typing reaches an open terminal after the server process changes, through `socket.svelte.ts`, `writes.svelte.ts` and `pty-io.ts`, is named by no entry of `agents/guarded.md`. `grep -n -o -E "terminal-list|TerminalGrid|socket\.svelte|writes\.svelte|pty-io|paste" agents/guarded.md` finds only the file-operation paste rows at :15, :45, :46 and :48. A test of it would need a new entry, which needs Axel's yes, for example under "Your work is not lost or misplaced": "A page that reconnects to a new server process takes that process's write token, and its open terminals take input again".
- **No test is written:** the cause is in the run, not in code.

## For the orchestrator, beside P2-1

1. **B2-1 and B2-2 have a different fix from P2-1.**
   - The B2-1 and B2-2 fix is to send the subscription in the `open` handler and send it again whenever the token last sent differs from the one held. It touches no part of the paste hold, so r27's paste would still be held with that fix in place.
   - The case is red with `RESTART=0`, where no reconnect and no token renewal happen.
   - In the three typed runs, the subscription after the reconnect carried a token the server admitted.
   - These runs do not exercise B2-1's window (two renewals overlapping) or B2-2's window (keys typed between the socket opening and the subscription). In the three typed runs the gap from `socket created` to the subscription frame was 0.1, 0.3 and 0.1 s. In one earlier run of this session, under load with the new server taking about 32 s to listen, the frames read `63.7 Created` and `66.4 FrameSent {"type":"subscribe"...`, a gap of 2.7 s, which is B2-2's window.
   - B2-1 and B2-2 stand as the reviewer wrote them. This diagnosis neither confirms nor falsifies them.
2. **A one-line paste closed by a line break is asked about, and the docs say otherwise.** This was there before the step (c347facbf) and is outside its brief.
   - HELP.md says "A paste of several lines asks before it is sent, from the menu as from the keyboard" (main `HELP.md:138`, worktree `:147`).
   - The question reads "Paste 1 lines into the terminal?".
   - This is a user-visible behaviour, so the choice is Axel's. The options:
     - (a) A paste of one line closed by a line break goes through without a question; `pasteLines` answers null for it, and HELP stays. Pro: matches HELP and the reader's expectation of pasting a command. Con: the pasted command runs at once.
     - (b) Keep asking. HELP says "a paste that holds a line break asks before it is sent", and `paste_confirm` gets a singular form for one line. Pro: nothing runs unseen. Con: one extra press for a pasted command.
   - Recommendation: (b), since the pasted line runs the moment it is sent. The lazy option is to change only the HELP sentence and leave "Paste 1 lines" as it is.
3. **Bracketed paste mode is lost after a Restart.** Not diagnosed; it is a separate concern. A one-line paste without a line break is sent with the bracketed-paste markers before any restart. Into the same open terminal after a Restart, the same paste is sent without them:

   ```
   RESTART=0 NL=0: sent {"type":"input",...,"bytes":"G1syMDB+ZWNobyBsaW5lLSQoKDQwKzMpKRtbMjAxfg=="}   (ESC[200~echo line-$((40+3))ESC[201~)
   RESTART=1 NL=0: sent {"type":"input",...,"bytes":"ZWNobyBsaW5lLSQoKDQwKzMpKQ=="}                   (echo line-$((40+3)))
   ```

   The terminal's mode is likely not carried through the re-attach, but this is not verified. Whether a fresh grid after a page switch loses the mode too, and whether the answered multi-line paste is bracketed without a restart, were not measured. In both runs the pasted line stayed in zsh's line editor (pane: `hub % echo line-$((40+3))`).
4. **Files disappeared from the scratch copy's `node_modules` during this diagnosis.** No command of this diagnosis touched them.
   - `find .../diagnose.yilYbS/tree/tools/oculus/node_modules -type f | wc -l` printed 7827, against 32770 in the step's worktree. The emptied directories carry the time of about 03:41.
   - `git worktree list` showed another diagnosis copy live at the time (`diagnose.M9CEDn`, at 81daf48b1, A3's commit).
   - The copy's `node_modules` was cloned again, and 32770 files were counted before the runs quoted here. `diff -rq` of `src`, `config`, `tests` and `utils` against the worktree printed nothing.
   - The cause is not verified. A broad delete under `$TMPDIR` by another session could damage other scratch copies.

## Cleanup

```
$ grep -rn "DIAG-7c41" $D/tree --exclude-dir=node_modules --exclude=local.yml; echo "grep exit $?"
grep exit 1
$ pgrep -f "diagnose.yilYbS" | wc -l
       0
$ lsof -nP -iTCP:8841 -sTCP:LISTEN; lsof -nP -iTCP:9411 -sTCP:LISTEN
(no output)
$ git worktree remove --force "$D/tree" && echo removed      # from /Users/axelfaes/workspace/research-hub
removed
$ git worktree list | grep -c yilYbS
0
$ rm -rf "$D"; ls -d "$D"
ls: /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.yilYbS: No such file or directory
```

All of the following are gone:
- The scratch server, which `red.mjs` kills by its pid at the end of every run.
- Headless Chrome and its profile.
- The scratch tmux server: `tmux -S <socket> kill-server` at the end of every run, with the socket folder removed along with `$D`.
- The engine copy with its scratch `local.yml`, the hub, the HOME and `red.mjs`.

No credential or `.env` file was copied. The step's worktree reads the same as before (both outputs under "Where the probes run"). The builder's run files were read and not changed. Run r27 was not repeated in the desktop app; the round's check, or the landing's look, would type the line after the Restart as the red command's `INPUT=keys` form does.

# Diagnosis: bracketed paste lost after a server restart

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. A diagnosis of the same step later is appended below under its own heading at the level of the title above, `# Diagnosis: <the symptom in a few words>`, which names its finding or quotes its part.

Diagnosis agent: adfea7fe3bb4905aa, claude-opus-5-5, 219,885 tokens, 66 tool uses, 33.9 min

**What it found.**
- The defect is on main's head (67623000e) with no O30 change: red 3 of 3 runs. It was there before O30, and it is red on O30's tree too (3 of 3).
- The restart is not needed for it. A page switch away from the terminal and back, with no restart, is red too.
- Where the mode is lost: every time a grid attaches (a reconnect after a restart, or a new grid after a page switch), the page resets the grid before it writes the scrollback (`TerminalGrid.svelte:358`, `term.reset()`). The scrollback the server sends (`channel.ts:578-623` `#attach`: `capture-pane -p -e` plus the cursor move of `screenAt`, `sessions.ts:700`, `:729`, `:746`) holds text and colours but no terminal mode. zsh writes `ESC[?2004h` only when it draws its prompt, so nothing turns bracketed paste back on until the next prompt, while tmux still holds the pane's flag at 1.
- The candidate fix: the server reads the pane's mode flags in the same `display-message` it already runs for the cursor, and sends the matching sequences after the scrollback. With it, both cases are green on main and on O30's tree. The pty tests, the repository checks, svelte-check, eslint and prettier pass on both copies.
- No test is written: no entry of `agents/guarded.md` covers it. The entry a test would need is under "Fix and test".

## Symptom

From the task, word for word:

> After a server restart, a paste into an already open terminal is sent without the bracketed-paste markers (ESC[200~ ... ESC[201~) that the same paste carries before the restart; seen in the O30 diagnosis record agents/reviews/O30-diagnosis.md, "For the orchestrator, beside P2-1", item 3.

The symptom has two parts:
- Before the restart, a one-line paste into the open terminal is sent bracketed.
- After the restart, the same paste into the same open terminal is sent without the markers.

The two questions it was given:
1. Is the symptom on main's head with no O30 change?
2. Where is the terminal's mode lost, and does a fresh grid after a page switch lose it with no restart?

## Where the probes run

Two scratch copies, each a detached worktree made from the main checkout under `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.2CAKjq`:
- `main`: `git worktree add --detach "$tmp/main" HEAD`, at 67623000e, with nothing applied.
- `o30`: `git worktree add --detach "$tmp/o30" 9a5f38a5b`. Applied to it:
  - The step's diff `git diff --binary 9a5f38a5b`, taken inside `.agents/worktrees/O30` and applied with `git apply --allow-empty`, which printed "applied".
  - The 52 `??` files of `git status --porcelain --untracked-files=all`, each copied to the same path.
  - `diff -rq` of `src`, `config`, `tests` and `utils` between the worktree and the copy printed nothing.
- In each copy:
  - `tools/oculus/node_modules` was cloned with `cp -cR` from that tree's own source: the main checkout gave 29220 files and O30's worktree 32770.
  - The server build was made with `npx vite build` (exit 0).
  - An engine folder `engine-<tree>` was made: a copy of the copy's shipped `config/` (the copy has no `local.yml`), plus a scratch `local.yml` that the red command writes (`hub: <tmp>/hub`, `port: 8851`).

The paths redirected under `$TMPDIR` were these:
- `HOME` and `TMUX_TMPDIR`, so the server has its own tmux socket.
- A scratch hub holding one manifest.
- A headless Chrome profile on CDP port 9421.

`ORDO_STABLE` and `ORDO_SKILL_DIRS` were not redirected, since nothing touches them. No command used port 8787 or 8790, Axel's `~/.oculus` or his tmux server. No command opened, printed or hashed `tools/oculus/config/local.yml`, the desktop app was not started and no curl was run.

Taken before the copy was made, from inside O30's worktree:

```
$ git status --short | wc -l
      94
$ git diff --binary 9a5f38a5b | shasum
66606744f9692c588f9e9542a04ca9f0dfcf93fa  -
```

The 94 lines are the same list the O30 record quotes under its "Where the probes run" (`M` rows from `.scratch/migration/agents/briefs/O30.md` to `utils/diagrams/graphs.mjs`, `D tools/oculus/src/lib/state/workbench/layout/open/floats.ts`, and the `??` rows from `O30-cases.md` to `tests/server/desktop/`). After the run, from the same worktree:

```
$ git diff --binary 9a5f38a5b | shasum
66606744f9692c588f9e9542a04ca9f0dfcf93fa  -
$ git status --short | diff - <the list saved before>; echo "status same"
status same
```

## Red command

```
PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH D=<tmp> T=<main|o30> node <tmp>/red.mjs
```

What it does:
- Starts a scratch server from the tree `T` and headless Chrome (`--headless=new`, so it takes no focus).
- Opens Sessions, then Terminal, then New Terminal.
- Pastes `echo one-$((40+1))`, with no line break so the paste hold does not ask, then presses Enter.
- Kills the server and starts it again on the same port, then waits 14 s.
- Pastes `echo two-$((40+2))` into the same open terminal.
- Reads the page's sent `input` frames over CDP (`Network.webSocketFrameSent`).

It asserts both parts: paste 1 sent as `ESC[200~...ESC[201~`, and paste 2 sent the same way. It also prints:
- tmux's own `#{bracket_paste_flag}` for the pane.
- Whether the page reloaded.
- The number of grids.

The options:
- `RESTART=0` leaves the restart out.
- `SWITCH=1` switches the page to Explorer and back before paste 2.
- `FRAMES=1 RECV=1` prints the frames sent and the pty frames received, decoded.

Its source as run, with the two tightenings below applied:

```js
// Red command: bracketed paste after a server restart. A scratch oculus server (T=main or T=o30
// tree, port 8851, scratch HOME, own tmux socket) and headless Chrome (CDP 9421, scratch profile)
// holding one open terminal. A one-line paste with no line break is put into the open terminal
// before the restart and again after it; the page's sent `input` frames are read over CDP.
// Exit 1 when the paste after the restart is sent without ESC[200~ ... ESC[201~ (the symptom).
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, openSync, readFileSync, writeFileSync } from 'node:fs';
const D = process.env.D;
const T = process.env.T ?? 'main';
const TREE = `${D}/${T}/tools/oculus`;
const ENGINE = `${D}/engine-${T}`;
const PORT = 8851;
const CDP = 9421;
const RESTART = process.env.RESTART !== '0';
const SWITCH = process.env.SWITCH === '1';           // a page switch away and back instead of nothing
const WAIT_AFTER_RESTART = Number(process.env.WAIT_AFTER_RESTART ?? 14000);
const env = { ...process.env, HOME: `${D}/home`, TMUX_TMPDIR: `${D}/tmuxdir` };
const SOCK = `${D}/tmuxdir/tmux-${process.getuid()}/default`;
const LOG = `${D}/server.log`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tmux = (...a) => { try { return execFileSync('tmux', ['-S', SOCK, ...a], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return ''; } };
const shells = () => tmux('list-sessions', '-F', '#{session_name}').split('\n').filter((s) => /shell/.test(s));
tmux('kill-server');
for (const p of ['home', 'hub', 'tmuxdir', 'chrome']) rmSync(`${D}/${p}`, { recursive: true, force: true, maxRetries: 10 });
for (const p of ['home', 'hub/projects/active/demo', 'tmuxdir']) mkdirSync(`${D}/${p}`, { recursive: true });
writeFileSync(`${D}/hub/projects/active/demo/project.yml`, 'id: demo\ntitle: Demo\ntype: active\n');
writeFileSync(`${ENGINE}/config/local.yml`, `hub: ${D}/hub\nport: ${PORT}\n`);
writeFileSync(LOG, '');
let server; let starts = 0;
async function startServer() {
    const fd = openSync(LOG, 'a');
    server = spawn(process.execPath, ['src/server.ts', '--engine', ENGINE], { cwd: TREE, env, stdio: ['ignore', fd, fd] });
    starts += 1;
    for (let i = 0; i < 900; i++) { if (readFileSync(LOG, 'utf8').split('\n').filter((l) => l.startsWith('oculus on')).length >= starts) return; await sleep(100); }
    throw new Error('server did not start: ' + readFileSync(LOG, 'utf8').slice(-400));
}
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${CDP}`, `--user-data-dir=${D}/chrome`, '--no-first-run', '--no-default-browser-check', '--window-size=1400,900', 'about:blank'], { stdio: 'ignore' });
const say = (s) => console.log(s);
const show = (b) => b.replace(/\x1b/g, 'ESC').replace(/\r/g, '\\r').replace(/\n/g, '\\n');
let code = 2;
try {
    say(`tree ${T}, restart ${RESTART ? 'yes' : 'no'}, page switch ${SWITCH ? 'yes' : 'no'}`);
    await startServer();
    let list = [];
    for (let i = 0; i < 100; i++) { try { list = await (await fetch(`http://127.0.0.1:${CDP}/json/list`)).json(); if (list.some((t) => t.type === 'page')) break; } catch {} await sleep(100); }
    const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r));
    let id = 0; const T0 = Date.now(); const at = () => ((Date.now() - T0) / 1000).toFixed(1);
    const inputs = []; const frames = []; const consoleLines = [];
    ws.addEventListener('message', (m) => {
        const d = JSON.parse(m.data);
        if (d.method === 'Network.webSocketFrameSent') {
            const p = d.params.response.payloadData;
            try { const j = JSON.parse(p); if (j.type === 'input') inputs.push(Buffer.from(j.bytes, 'base64').toString('utf8')); } catch {}
            frames.push(`${at()} sent ${p.slice(0, 160)}`);
        }
        if (d.method === 'Network.webSocketFrameReceived' && process.env.RECV === '1') {
            const p = d.params.response.payloadData;
            try { const j = JSON.parse(p); if (j.payload?.bytes !== undefined) frames.push(`${at()} recv ${j.channel} v${j.version} ${show(Buffer.from(j.payload.bytes, 'base64').toString('utf8')).slice(-200)}`); } catch { frames.push(`${at()} recv ${p.slice(0, 160)}`); }
        }
        if (d.method === 'Network.webSocketCreated') frames.push(`${at()} socket created`);
        if (d.method === 'Runtime.consoleAPICalled') { const text = d.params.args.map((a) => a.value ?? a.description ?? '').join(' '); if (text.includes('DIAG-')) consoleLines.push(`${at()} ${text}`); }
    });
    const send = (method, params = {}) => new Promise((res) => { const me = ++id; const h = (m) => { const d = JSON.parse(m.data); if (d.id === me) { ws.removeEventListener('message', h); res(d); } }; ws.addEventListener('message', h); ws.send(JSON.stringify({ id: me, method, params })); });
    const ev = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
    const focus = () => ev(`(()=>{const ta=document.querySelector('.xterm-helper-textarea'); if(ta) ta.focus(); return document.activeElement.className})()`);
    const enter = async () => { await focus(); await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }); };
    const paste = async (text) => { await focus(); return ev(`(()=>{const ta=document.activeElement; const dt=new DataTransfer(); dt.setData('text/plain', ${JSON.stringify(text)}); const e=new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true}); ta.dispatchEvent(e); return e.defaultPrevented})()`); };
    const pane = (s) => tmux('capture-pane', '-p', '-t', s);
    const xtermMode = () => ev(`(()=>{const el=document.querySelector('.xterm'); return el ? 'grids:' + document.querySelectorAll('.xterm').length : 'no grid'})()`);
    await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
    await sleep(10000);
    await ev(`(async()=>{const s=(ms)=>new Promise(r=>setTimeout(r,ms));
        document.querySelector('button[aria-label=Sessions]').click(); await s(3000);
        const t=[...document.querySelectorAll('button[role=tab]')].find(t=>t.textContent.trim()==='Terminal'); if(t) t.click(); await s(1500);
        document.querySelector('button[aria-label="new terminal"]').click(); await s(6000); return 1})()`);
    const SES = shells()[0];
    say(`open terminal: tmux session ${SES}, ${await xtermMode()}`);
    say(`tmux pane bracketed-paste flag before: ${tmux('display', '-p', '-t', SES, '#{bracket_paste_flag}').trim() || '?'}`);
    const line1 = 'echo one-$((40+1))';
    let n = inputs.length;
    say(`paste 1 default prevented: ${await paste(line1)}`); await sleep(1000);
    const sent1 = inputs.slice(n).join('');
    await enter(); await sleep(1500);
    const part1 = sent1.startsWith('\x1b[200~') && sent1.endsWith('\x1b[201~');
    say(`PART 1, the paste before the restart was sent bracketed: ${part1 ? 'yes' : 'no'}   (sent: ${show(sent1)})`);
    const origin = await ev('Math.round(performance.timeOrigin)');
    if (RESTART) {
        const t0 = Date.now(); frames.push(`${at()} --- server killed`);
        server.kill('SIGKILL'); await new Promise((r) => server.once('exit', r)); await startServer();
        frames.push(`${at()} --- server listening again`);
        say(`server killed and listening again on ${PORT} after ${((Date.now() - t0) / 1000).toFixed(1)} s`);
        await sleep(WAIT_AFTER_RESTART);
    }
    if (SWITCH) {
        frames.push(`${at()} --- page switch`);
        say(`page switch: ${await ev(`(async()=>{const s=(ms)=>new Promise(r=>setTimeout(r,ms));
            const b=document.querySelector('button[aria-label=Explorer]')||[...document.querySelectorAll('nav button, [role=toolbar] button, aside button')].find(x=>x.getAttribute('aria-label') && x.getAttribute('aria-label')!=='Sessions');
            if(!b) return 'no other page button'; const name=b.getAttribute('aria-label'); b.click(); await s(2500);
            const g1=document.querySelectorAll('.xterm').length;
            document.querySelector('button[aria-label=Sessions]').click(); await s(4000);
            return 'to '+name+' (grids there '+g1+') and back, grids now '+document.querySelectorAll('.xterm').length})()`)}`);
    }
    say(`page reloaded: ${origin === (await ev('Math.round(performance.timeOrigin)')) ? 'no' : 'yes'}, ${await xtermMode()}`);
    say(`tmux pane bracketed-paste flag after: ${tmux('display', '-p', '-t', SES, '#{bracket_paste_flag}').trim() || '?'}`);
    frames.push(`${at()} --- paste 2`);
    const line2 = 'echo two-$((40+2))';
    n = inputs.length;
    say(`paste 2 default prevented: ${await paste(line2)}`); await sleep(1000);
    const sent2 = inputs.slice(n).join('');
    await enter(); await sleep(2000);
    const part2 = sent2.startsWith('\x1b[200~') && sent2.endsWith('\x1b[201~');
    say(`PART 2, the same paste into the same open terminal after ${RESTART ? 'the restart' : 'that'} was sent bracketed: ${part2 ? 'yes' : 'no'}   (sent: ${show(sent2)})`);
    say(`pane tail: ${pane(SES).split('\n').filter((l) => l.trim()).slice(-4).join(' | ')}`);
    for (const l of consoleLines) say(`  page: ${l.slice(0, 300)}`);
    for (const l of readFileSync(LOG, 'utf8').split('\n').filter((l) => /DIAG-/.test(l))) say(`  server: ${l.slice(0, 300)}`);
    if (process.env.FRAMES === '1') for (const l of frames) say(`  ws ${l}`);
    code = part1 && part2 ? 0 : 1;
    say(code === 1 ? 'RED: the paste is sent without the bracketed-paste markers' : 'GREEN: both pastes sent bracketed');
    ws.close();
} catch (e) { say(`error: ${e.stack}`); } finally { server?.kill('SIGKILL'); chrome.kill('SIGKILL'); tmux('kill-server'); await sleep(500); }
process.exit(code);
```

Runs on main's head, unchanged (`T=main`). Every run sets its own state.

```
== main run 1
tree main, restart yes, page switch no
open terminal: tmux session oculus-eb5565-shell, grids:1
paste 1 default prevented: false
PART 1, the paste before the restart was sent bracketed: yes   (sent: ESC[200~echo one-$((40+1))ESC[201~)
server killed and listening again on 8851 after 1.0 s
page reloaded: no, grids:1
paste 2 default prevented: false
PART 2, the same paste into the same open terminal after the restart was sent bracketed: no   (sent: echo two-$((40+2)))
pane tail: p/T/diagnose.2CAKjq/home/.oh-my-zsh/oh-my-zsh.sh | axelfaes@YQ530VVFGK hub % echo one-$((40+1)) | one-41 | axelfaes@YQ530VVFGK hub %
RED: the paste is sent without the bracketed-paste markers
exit 1
== main run 2
... PART 1 ... yes   (sent: ESC[200~echo one-$((40+1))ESC[201~)
server killed and listening again on 8851 after 1.4 s
page reloaded: no, grids:1
PART 2 ... no   (sent: echo two-$((40+2)))
RED: the paste is sent without the bracketed-paste markers
== main run 3
... PART 1 ... yes   (sent: ESC[200~echo one-$((40+1))ESC[201~)
server killed and listening again on 8851 after 1.3 s
page reloaded: no, grids:1
PART 2 ... no   (sent: echo two-$((40+2)))
RED: the paste is sent without the bracketed-paste markers
```

Runs on O30's tree (`T=o30`):

```
== o30 run 1
exit 1
open terminal: tmux session oculus-27d8d6-shell, grids:1
PART 1, the paste before the restart was sent bracketed: yes   (sent: ESC[200~echo one-$((40+1))ESC[201~)
server killed and listening again on 8851 after 1.1 s
page reloaded: no, grids:1
PART 2, the same paste into the same open terminal after the restart was sent bracketed: no   (sent: echo two-$((40+2)))
pane tail: one-41 | axelfaes@YQ530VVFGK hub % echo two-$((40+2)) | two-42 | axelfaes@YQ530VVFGK hub %
RED: the paste is sent without the bracketed-paste markers
== o30 run 2
exit 1
PART 1 ... yes; server ... after 1.4 s; PART 2 ... no   (sent: echo two-$((40+2))); RED
== o30 run 3
exit 1
PART 1 ... yes; server ... after 1.5 s; PART 2 ... no   (sent: echo two-$((40+2))); RED
```

So the answer to question 1 is yes. The symptom is on main's head with no O30 change, and on O30's tree the same way.

Runs after the tightening. Two changes, both to the measurement only:
- The tmux flag is read as `#{bracket_paste_flag}`, the name `man tmux` gives for tmux 3.7c. The first runs asked for an unknown format and printed `?`.
- The received pty frames are decoded from `payload.bytes`.

A run on main after both, `FRAMES=1 RECV=1`:

```
exit 1
tmux pane bracketed-paste flag before: 1
PART 1, the paste before the restart was sent bracketed: yes   (sent: ESC[200~echo one-$((40+1))ESC[201~)
tmux pane bracketed-paste flag after: 1
PART 2, the same paste into the same open terminal after the restart was sent bracketed: no   (sent: echo two-$((40+2)))
  ws 17.1 recv pty:938fd6-shell v1 ...ESC[Jaxelfaes@YQ530VVFGK hub % ESC[KESC[?2004h
  ws 21.7 recv pty:938fd6-shell v3 ...ESC[27m)ESC[27m)ESC[?2004l\r\r\n
  ws 21.7 recv pty:938fd6-shell v6 ...ESC[Jaxelfaes@YQ530VVFGK hub % ESC[KESC[?2004h
  ws 23.2 --- server killed
  ws 31.9 --- server listening again
  ws 36.1 recv pty:938fd6-shell v0 ...axelfaes@YQ530VVFGK hub %\r\n\r\n ... \r\nESC[9;27H
  ws 45.9 --- paste 2
RED: the paste is sent without the bracketed-paste markers
```

tmux holds the pane's bracketed-paste flag at 1 before and after the restart. `ESC[?2004h` reaches the page only in chunks of zsh's own output (v1 and v6, each at the end of a prompt). The scrollback after the reconnect (v0) ends in a cursor move only, and no chunk after it carries the mode before paste 2.

## No red command

Not applicable.

## Shrunk case

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| The desktop app, its windows and the Cmd+V route of the builder's runs; the browser case has none of them | red, main runs 1 to 3 | cut |
| O30's diff (`T=main` in place of `T=o30`) | red, main runs 1 to 3: `PART 2 ... no (sent: echo two-$((40+2)))` | cut |
| The line break and the paste question: the case pastes one line with no line break | red: `paste 2 default prevented: false`, no question involved | cut |
| The server restart, with nothing in its place (`RESTART=0`) | green: `PART 2 ... yes (sent: ESC[200~echo two-$((40+2))ESC[201~)`, `GREEN: both pastes sent bracketed` | put back |
| The server restart, with a page switch to Explorer and back in its place (`RESTART=0 SWITCH=1`) | red: `page switch: to Explorer (grids there 0) and back, grids now 1`, `PART 2 ... no (sent: echo two-$((40+2)))`, `RED` | cut; the restart is one of two ways to the same red |

The shrunk case, as it stands:
- An open terminal whose shell waits at its prompt, with bracketed paste on (tmux flag 1).
- A new attach of a grid to it, by either of two routes: the reconnect after a server restart, or the new grid a page switch draws.
- A one-line paste.

Without the new attach it is green. So the answer to the second half of question 2 is yes: a fresh grid after a page switch loses the mode with no restart.

## Hypotheses

1. If the page's `term.reset()` on the version-0 scrollback (`TerminalGrid.svelte:357-360`) turns the grid's bracketed-paste mode off, and the scrollback `#attach` sends (`channel.ts:578-623`, `capture-pane -p -e` and the cursor move of `screenAt`) carries no mode, then sending the pane's modes after the scrollback turns the red command green. That change is the server reading tmux's flags in the cursor's `display-message` and appending the sequences. Falsified by either of these: tagged logging shows the grid's `term.modes.bracketedPasteMode` true after the scrollback is written, or paste 2 still goes out unbracketed with the sequences appended.
2. If the mode is lost in the tmux re-attach, then the grid's mode is already false when the reconnect's scrollback arrives. That would be a new `tmux -C attach-session` control client after the restart that replays no mode the pane set earlier. In that case keeping the grid's state across the scrollback would not turn it green. Falsified by either of these: the grid's mode reads true when the reconnect's scrollback arrives, or the page switch case is red while the control client stays open (`IDLE_MS` 60 s, `channel.ts`, `attached`).
3. If the reconnect remounts the grid, then the new xterm instance starts with its modes at their defaults, and the change of hypothesis 1 is needed only for that new instance. Falsified by: the grid that receives the reconnect's scrollback reads mode true before its reset, which shows it is the instance that had the mode on.

O30's own changes to the reconnect (`socket.svelte.ts`, `writes.svelte.ts`) as the cause were already falsified by the shrink, which is red on main with no O30 change. They are not one of the hypotheses.

The reply to the hypotheses: none, no person present.

The second list: not needed.

## Probes

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 1 (logging at the boundary between the scrollback and the grid) | `TerminalGrid.svelte`, in the `subscribePty` listener: `+ if (scrollback) console.log('DIAG-b2c7 scrollback for', wanted, 'mode before reset:', term.modes.bracketedPasteMode);` before `if (scrollback) { term.reset();`, and `+ if (scrollback) term.write('', () => console.log('DIAG-b2c7 after scrollback written, mode:', term.modes.bracketedPasteMode));` after `} else term.write(shown);`, then `npx vite build` | `T=main FRAMES=1 RECV=1`: `page: 15.1 DIAG-b2c7 scrollback for 6e8f1c-shell mode before reset: false`, `page: 15.1 DIAG-b2c7 after scrollback written, mode: false`, `page: 25.1 DIAG-b2c7 scrollback for 6e8f1c-shell mode before reset: true`, `page: 25.1 DIAG-b2c7 after scrollback written, mode: false`; tmux flag `1` before and after; `RED` | 1 standing; 2 falsified (mode true when the reconnect's scrollback arrives, and the page switch case is red with the control client kept); 3 falsified (the same grid had the mode on until its reset) |
| 1 (the change it names) | the fix under "Fix and test" (`sessions.ts`, `channel.ts`), then `npx vite build` | `T=main FRAMES=1 RECV=1`: `tmux ... flag before: 1`, `PART 1 ... yes`, `page reloaded: no, grids:1`, `PART 2 ... yes (sent: ESC[200~echo two-$((40+2))ESC[201~)`, `ws 25.0 recv pty:06f55d-shell v0 ...hub %\r\n...ESC[9;27HESC[?2004h`, `GREEN: both pastes sent bracketed`, exit 0 | standing; green with the change, red without it (main runs 1 to 3) |

Probe 1 was undone after its run: the file was copied back from the saved original, `git status --short` in the copy printed nothing, and `grep -rn "DIAG-" tools/oculus/src | wc -l` printed 0. The change of probe 2 was saved as a diff, undone with `git checkout -- tools/oculus/src` (after which `git status --short | wc -l` printed 0), and applied again as the fix.

The first scrollback reads mode false at 15.1, and the mode then turns on at 17.1 from zsh's own prompt (chunk v1 above). That works only because New Terminal's first resize makes zsh redraw its prompt. A reconnect, or a grid drawn again at the same size, makes no resize that zsh sees, so no prompt is redrawn.

## Cause

Hypothesis 1 stands, shown by probe 2: the red command is green with the change and red without it. Where the mode is lost (question 2):
- On every attach, the page resets the grid before it writes the scrollback (`src/lib/views/sessions/terminal/grid/TerminalGrid.svelte:358`, `term.reset()`). xterm's reset turns bracketed paste off, along with every other DEC private mode.
- The scrollback the server sends to an attaching socket (`src/lib/server/machine/pty/channel.ts:578-623`, `#attach`) is the pane's `capture-pane -p -e` (`sessions.ts:700`) followed by a cursor move (`screenAt`, `sessions.ts:746`). A capture holds text and colours, never the pane's modes.
- zsh writes `ESC[?2004h` only when it draws a prompt, and a tmux control client streams only what the program writes. So after an attach that does not make the shell redraw, nothing sets the mode again until the next prompt, while tmux still holds `bracket_paste_flag` 1. Two such attaches were measured: the reconnect after a server restart, and the new grid after a page switch.
- The tmux re-attach is not where it is lost: the grid reads mode true right up to its reset.

The defect is on main before O30: red on main at 67623000e with nothing applied (main runs 1 to 3), and red on O30's tree the same way. O30's diff touches none of `TerminalGrid.svelte`, `channel.ts` or `sessions.ts`.

The same reset loses the other modes a program sets, by reading of xterm's `reset()`. Those are application cursor keys, the keypad, mouse reporting and its encoding, insert, wrap and a hidden cursor. That loss was not run in a browser. On a private tmux server, `tmux display -p` was measured to answer each flag the fix reads, after the sequence that sets it:
- `ESC[?2004h ESC[?1h ESC=` gave `bp=1 kc=1 kp=1`.
- `ESC[?1000h` gave `std=1 any=1`.
- `ESC[?1002h` gave `btn=1 any=1`.
- `ESC[?1003h ESC[?1006h ESC[?1005h` gave `all=1 any=1 sgr=1 utf8=1`.
- `ESC[?25l ESC[4h ESC[?7l` gave `cur=0 ins=1 wrap=0`.

## Fix and test

Test, run on the tree without the fix: none written.
- No entry of `agents/guarded.md` covers this behaviour. G35 says "A terminal operation acts only on the terminal it names, and ends only what it says it ends", and G1 is the token. No entry is about what an attaching page is given.
- A test would need a new entry, which needs Axel's yes. For example, under "Your work is not lost or misplaced": "A page that attaches to a terminal, on a reconnect or in a new grid, is given the modes the pane's program set, so a paste, the arrow keys and the mouse reach the program in the form it asked for."
- Its tests would be `tests/server/machine/pty/sessions.test.ts` (private tmux: after `printf '\e[?2004h'` in a pane, `modesAt` of the `cursorArgs` answer is `ESC[?2004h`) and `tests/server/machine/pty/channel.test.ts` (the fixture's `display-message` answers the flags, and the version-0 message ends with the sequences).

Fix, the code part (on both copies; `git apply` of the same diff applied to main's copy and to O30's copy):

```diff
diff --git a/tools/oculus/src/lib/server/machine/pty/channel.ts b/tools/oculus/src/lib/server/machine/pty/channel.ts
--- a/tools/oculus/src/lib/server/machine/pty/channel.ts
+++ b/tools/oculus/src/lib/server/machine/pty/channel.ts
@@ -38,6 +38,7 @@ import {
     cursorArgs,
     isTerminalId,
     listArgs,
+    modesAt,
     parseTerminals,
     serverPid,
     resizeArgs,
@@ -610,7 +611,9 @@ export class Terminals {
         // capture-pane writes one line per row with a bare newline between them; a terminal moves
         // down without returning to the left on a bare newline, so the rows would step across the
         // grid (seen in Chrome as a staircase). Every line break goes out as CR LF.
-        const screen = placed.replace(/\r?\n/g, '\r\n');
+        // The modes the pane's program set go after the screen, since the page resets its grid
+        // before writing it.
+        const screen = placed.replace(/\r?\n/g, '\r\n') + modesAt(cursor);
         const message = {
             channel: ptyChannel(id),
             // The scrollback is not a chunk, so it carries no chunk number; the chunks count from
diff --git a/tools/oculus/src/lib/server/machine/pty/sessions.ts b/tools/oculus/src/lib/server/machine/pty/sessions.ts
--- a/tools/oculus/src/lib/server/machine/pty/sessions.ts
+++ b/tools/oculus/src/lib/server/machine/pty/sessions.ts
@@ -725,26 +725,68 @@ export async function scrollback(
     return (options.run ?? run)(captureArgs(id, lines), options);
 }
 
-/** The arguments that read where tmux has a pane's cursor, and how many rows the pane has. */
+/**
+ * The modes a pane's program sets that the capture does not hold, as tmux names each one's flag,
+ * the flag's value that differs from a grid just reset, and the sequence that sets that value in
+ * the grid. The grid is reset before the capture is written into it, on a new grid and on a
+ * reconnect alike, and a shell sets its modes only when it draws its prompt, so without these a
+ * page that attaches to a waiting shell sends a paste without the bracketed-paste markers, and one
+ * that attaches to an editor sends the arrow keys and the mouse in forms the editor did not ask
+ * for. Origin mode is left out: setting it moves the cursor to the top of a scroll region the
+ * capture does not carry.
+ */
+const PANE_MODES: readonly (readonly [flag: string, value: '0' | '1', sequence: string])[] = [
+    ['bracket_paste_flag', '1', '\u001b[?2004h'],
+    ['keypad_cursor_flag', '1', '\u001b[?1h'],
+    ['keypad_flag', '1', '\u001b='],
+    ['mouse_standard_flag', '1', '\u001b[?1000h'],
+    ['mouse_button_flag', '1', '\u001b[?1002h'],
+    ['mouse_all_flag', '1', '\u001b[?1003h'],
+    ['mouse_utf8_flag', '1', '\u001b[?1005h'],
+    ['mouse_sgr_flag', '1', '\u001b[?1006h'],
+    ['insert_flag', '1', '\u001b[4h'],
+    ['wrap_flag', '0', '\u001b[?7l'],
+    ['cursor_flag', '0', '\u001b[?25l']
+];
+
+/**
+ * The arguments that read where tmux has a pane's cursor, how many rows the pane has, and then the
+ * flag of each of PANE_MODES, in its order.
+ */
 export function cursorArgs(id: string): string[] {
+    const flags = PANE_MODES.map(([flag]) => `#{${flag}}`).join(' ');
     return [
         'display-message',
         '-p',
         '-t',
         sessionName(id),
-        '#{cursor_x} #{cursor_y} #{pane_height}'
+        `#{cursor_x} #{cursor_y} #{pane_height} ${flags}`
     ];
 }
 
+/**
+ * The sequences that set in a grid just reset the modes the pane's program has set, read from what
+ * cursorArgs answered: empty when that answer does not hold a flag for each of PANE_MODES.
+ */
+export function modesAt(cursor: string): string {
+    const found = /^\d+ \d+ \d+((?: [01])*)\s*$/.exec(cursor);
+    const flags = found === null ? [] : found[1].trim().split(' ');
+    if (flags.length !== PANE_MODES.length) return '';
+    return PANE_MODES.filter(([, value], at) => flags[at] === value)
+        .map(([, , sequence]) => sequence)
+        .join('');
+}
+
 /**
  * The screen an attaching page is given: the whole capture without its final newline, then the
  * cursor put where tmux has it. Written into a grid as high as the pane, the capture's last rows
  * are the pane's rows, so a new shell's prompt sits on its own row at the top rather than under
  * the capture's blank rows, and the rows under a prompt's cursor stay drawn. A cursor that does not
- * read as three whole numbers, or whose row is outside the pane, leaves the capture as it is.
+ * read as three whole numbers, with the flags of modesAt after them or not, or whose row is outside
+ * the pane, leaves the capture as it is.
  */
 export function screenAt(capture: string, cursor: string): string {
-    const found = /^(\d+) (\d+) (\d+)\s*$/.exec(cursor);
+    const found = /^(\d+) (\d+) (\d+)(?: [01])*\s*$/.exec(cursor);
     if (found === null) return capture;
     const [column, row, height] = [Number(found[1]), Number(found[2]), Number(found[3])];
     if (row >= height) return capture;
```

Fix, the docs part. `git apply --check` of this part on O30's copy passed, although O30 changes both files. Each change is to one sentence:
- `tools/oculus/DESIGN.md:374`, before: "A page that attaches is given the pane's whole capture followed by a move to tmux's own cursor (`screenAt` of `server/machine/pty/sessions.ts`), which lands right once the page's grid and the pane are the same height". After: "A page that attaches is given the pane's whole capture followed by a move to tmux's own cursor (`screenAt` of `server/machine/pty/sessions.ts`) and by the modes the pane's program set that a capture does not hold, read from tmux's flags in the same `display-message` (bracketed paste, the cursor and keypad keys, the mouse reports, insert, wrap and a hidden cursor; `modesAt` of the same file), since the page resets its grid before it writes the capture, on a new grid and on a reconnect alike; the cursor move lands right once the page's grid and the pane are the same height".
- `tools/oculus/HELP.md:138`, before: "A terminal opened again shows its screen with the cursor where the program left it, so a new shell's prompt is at the top." After: "A terminal opened again, or shown again after the server restarted, shows its screen with the cursor where the program left it, so a new shell's prompt is at the top, and keeps the modes the program set, so a paste into a waiting shell still reaches it as a paste and the arrow keys and the mouse reach an editor as it asked."

Runs after the fix:

```
== main+fix, restart (run 1, the probe 2 run above): PART 1 yes, PART 2 yes (sent: ESC[200~echo two-$((40+2))ESC[201~), GREEN, exit 0
== main+fix restart run 2
exit 0
PART 1, the paste before the restart was sent bracketed: yes   (sent: ESC[200~echo one-$((40+1))ESC[201~)
PART 2, the same paste into the same open terminal after the restart was sent bracketed: yes   (sent: ESC[200~echo two-$((40+2))ESC[201~)
GREEN: both pastes sent bracketed
== main+fix restart run 3
exit 0
PART 1 ... yes; PART 2 ... yes (sent: ESC[200~echo two-$((40+2))ESC[201~); GREEN
== main+fix RESTART=0 SWITCH=1
exit 0
page switch: to Explorer (grids there 0) and back, grids now 1
PART 2, the same paste into the same open terminal after that was sent bracketed: yes   (sent: ESC[200~echo two-$((40+2))ESC[201~)
GREEN: both pastes sent bracketed
== o30+fix run 1 (the original case: O30's tree, restart)
exit 0
PART 1 ... yes   (sent: ESC[200~echo one-$((40+1))ESC[201~)
PART 2 ... yes   (sent: ESC[200~echo two-$((40+2))ESC[201~)
pane tail: one-41 | axelfaes@YQ530VVFGK hub % echo two-$((40+2)) | two-42 | axelfaes@YQ530VVFGK hub %
GREEN: both pastes sent bracketed
== o30+fix run 2: exit 0, PART 1 yes, PART 2 yes, two-42 in the pane, GREEN
== o30+fix run 3: exit 0, PART 1 yes, PART 2 yes, two-42 in the pane, GREEN
== o30+fix RESTART=0 SWITCH=1
exit 0
page switch: to Explorer (grids there 0) and back, grids now 1
PART 2 ... yes   (sent: ESC[200~echo two-$((40+2))ESC[201~)
GREEN: both pastes sent bracketed
```

The repository's own checks on the fixed copies:

```
main+fix: npx vitest run tests/server/machine/pty tests/routes/sessions   -> Test Files 8 passed (8), Tests 40 passed (40)
main+fix: npx vitest run tests/checks --tagsFilter '!slow' ...            -> Test Files 15 passed | 1 skipped (16), Tests 226 passed | 3 skipped (229)
          (the 3 skipped are tests/checks/utils/claude-usage.test.ts)
main+fix: svelte-check                                                    -> COMPLETED 2871 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
main+fix: eslint on sessions.ts and channel.ts                            -> eslint ok
main+fix: prettier --check sessions.ts channel.ts DESIGN.md HELP.md       -> All matched files use Prettier code style!
o30+fix:  npx vitest run tests/server/machine/pty tests/routes/sessions   -> Test Files 8 passed (8), Tests 40 passed (40)
o30+fix:  npx vitest run tests/checks --tagsFilter '!slow' ...            -> Test Files 15 passed | 1 skipped (16), Tests 226 passed | 3 skipped (229)
o30+fix:  svelte-check                                                    -> COMPLETED 2950 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
o30+fix:  eslint src/lib/server/machine/pty/                              -> eslint ok
o30+fix:  prettier --check (the same four files)                          -> All matched files use Prettier code style!
o30+fix:  npx vitest run --tagsFilter '!slow' --exclude 'tests/checks/**' -> Test Files 88 passed | 17 skipped (105), Tests 349 passed | 67 skipped (416)
```

What these runs do not cover:
- The modes other than bracketed paste were not exercised in a page. Their tmux flags were measured as quoted under "Cause".
- The desktop app was not run.
- The slow-tagged tests were not run.

No test reaches it: not applicable. A test can reach it at `sessions.test.ts` and `channel.test.ts`, but no guarded entry names it; the entry it needs is quoted above and needs Axel's yes. No test is written: no entry of `agents/guarded.md` covers this behaviour, as the brief requires for a test.

## For the orchestrator, beside this diagnosis

1. **Where the fix goes.** The defect is on main before O30, in files O30's diff does not touch.
   - It is outside O30's brief, unless that brief names the terminal's state across a Restart. HELP.md:13 in O30's worktree says the open windows keep "their running terminals" after a Restart.
   - The code diff applies cleanly to main's head and to O30's tree, and the docs part applies to both.
   - What to do with it is the orchestrator's call: fix it at O30's landing, or give it a step of its own.
2. **On main's head, nothing typed reaches an open terminal after a server restart.** In every main run with the restart, `two-42` never appeared in the pane. With the fix in place, main's `server.log` holds `pty: input on pty:06f55d-shell from a socket without the write token`, twice. On O30's tree the same keystrokes reach the pane: `two-42` in all of O30's runs. This is the reconnect token that O30's step changes, and it is recorded here only as measured.
3. **The alternate screen is not carried either.** A pane in an editor's alternate screen is captured as the shown screen and written into the grid's normal buffer. This is a separate concern with a design choice of its own: whether to switch the grid to its alternate buffer first, which loses the normal buffer's text when the editor exits. It was not diagnosed or measured, and the fix above does not change it.

## Cleanup

```
$ grep -rn "DIAG-b2c7" $D/main $D/o30 --exclude-dir=node_modules --exclude-dir=build --exclude-dir=.svelte-kit --exclude=local.yml; echo "grep src exit $?"
grep src exit 1
$ grep -rln "DIAG-b2c7" $D/main/tools/oculus/build $D/o30/tools/oculus/build | wc -l
       0
$ pgrep -f diagnose.2CAKjq | wc -l
       0
$ lsof -nP -iTCP:8851 -sTCP:LISTEN; lsof -nP -iTCP:9421 -sTCP:LISTEN
(no output)
$ git worktree remove --force "$D/main" && git worktree remove --force "$D/o30" && echo removed      # from /Users/axelfaes/workspace/research-hub
removed
$ git worktree list | grep -c 2CAKjq
0
$ rm -rf "$D"; ls -d "$D"
ls: /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.2CAKjq: No such file or directory
```

All of the following are gone:
- The scratch servers, which `red.mjs` kills at the end of every run.
- Headless Chrome and its profile.
- The scratch tmux servers (`kill-server` at the end of every run), and the private tmux server of the flag measurement (`kill-server`, socket removed).
- The engine copies with their scratch `local.yml`, the hub, the HOME, `red.mjs`, the saved diffs and the saved originals.
- The status list and the copy of the fix diff in the session's scratchpad.

No credential or `.env` file was copied. O30's worktree reads the same as before: the shasum and status are under "Where the probes run". The main checkout was not changed: `git status --short` there printed nothing after the cleanup. The red command, run on O30's tree with the restart, is the check for whoever lands the fix.

# Diagnosis: O30's landing red line, a dialog in place of the window in start.test.ts

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. A diagnosis of the same step later is appended below under its own heading at the level of the title above, `# Diagnosis: <the symptom in a few words>`, which names its finding or quotes its part.

Diagnosis agent: adb7a3d3f5225357b, claude-opus-5-5, 270,792 tokens, 87 tool uses, 64.1 min

**Summary for the session.**
- **Cause, found.** The landing ran two `vite build`s in one checkout at the same time.
  - `tests/tiers/landing.mjs` runs `npm run test:slow` in its own lane, beside the lane `npm run check; npm run build`.
  - Since O30, `test:slow` builds the server into that same checkout: every start of the app from the checkout runs `vite build` (`src/desktop/app.ts:284-294`, `src/desktop/server/build.ts`).
  - The lane's build empties `.svelte-kit/output` at its start (`@sveltejs/kit` `src/exports/vite/index.js:1218-1224`, `rimraf(out)` in `buildStart`). The app's build was still reading that folder, so it failed.
  - The app then showed the dialog `build_failed`. The harness's recorder never answers a dialog, and `printed()` in `start.test.ts` fails only when the process closes, so case 1 waited the full 600000 ms.
- **Fix of the red line, two changes, for `/spec` to carry into O30's new brief:**
  - (A) `landing.mjs` runs `test:slow` in the lane after the type check and the build.
  - (B) `printed()` in `start.test.ts` fails as soon as the app records a dialog that came before the text the row waits for.
- **The open item, for Axel.** The app's build from the checkout shares its output folders with any build in the same checkout, so a `npm run build` during `npm run app`'s start still fails it. With fixes A and B in the tree, the shrunk red command is still red. Ending that needs output folders of the app's own, which is a folder and flag shape nothing names yet. It is raised below with options.
- **Two further findings:**
  - Both dialogs name a useless line as the reason: `}` and `Node.js v24.21.0`. This is in O30's own code.
  - The diagrams case has a 60 s limit of its own, against the documented no-limit rule for tree checks. This is on main and is not O30's.

## Symptom

From `/Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/plan.md`, under "- O30 native window (I)", word for word:

```
  - Step 0, landing 2026-10-06 backed out before main was touched: in the landing worktree `.agents/worktrees/gate-O30` (main daf935a66 with O30's range 9a5f38a5b..815ac40cd and the fixes at landing for S2-1, P2-3, St2-1, St2-2, B2-1 to B2-4, Z612 and Z619, saved whole as `agents/reviews/O30-gate.patch`), `npm run test:landing` failed one case: `tests/server/desktop/start.test.ts` 'brings the running app forward on a second start and starts no server' timed out at 600000 ms, with the recorder's line `recorded, nothing shown: [screen] dialog`. `npm run test:checks` failed in the same run on a 60 s timeout of `diagrams.test.ts` and passed when run alone (226 passed, 3 skipped). Cause not known; diagnosed with `/diagnose oculus/migration O30 red line`.
```

These are the lines of the landing log that carry the symptom (`.../scratchpad/o30-gate.log`). The test's own `afterEach` prints one `recorded` line per case that started the app; the first one belongs to case 1:

```
recorded, nothing shown: [screen] dialog
recorded, nothing shown: [screen] dialog
recorded, nothing shown: none
recorded, nothing shown: [screen] dialog
 > |unit| tests/server/desktop/start.test.ts (5 tests | 1 failed) 686491ms
     x brings the running app forward on a second start and starts no server 600211ms
 FAIL  |unit| tests/server/desktop/start.test.ts > the desktop app starting and stopping > brings the running app forward on a second start and starts no server
Error: Test timed out in 600000ms.
```

The same log shows that the lane `npm run check, then npm run build` passed (122.6 s) while `npm run test:slow` ran beside it (703.2 s).

The state file's dispatch entry for O30 reads `landing: backed-out (the landing check failed in .agents/worktrees/gate-O30, main untouched; ...)` (`orchestrator-state.md:44`).

## Where the probes run

The probes ran in a scratch copy, `$TMPDIR/diagnose.b8PoTY/tree`:
- It is a detached worktree of the main checkout at HEAD `d4bd8a503` ("Start the diagnosis of O30's landing red line"). It differs from daf935a66 only under `tools/oculus/.scratch`.
- `agents/reviews/O30-gate.patch` was applied to it with `git apply --3way --allow-empty`, which changed 123 paths.

The gate patch was applied in place of Steps 3's red-line diff because it is the landing worktree's whole state relative to main. It already holds O30's range. Comparing each of the 118 files of `git diff --name-only 9a5f38a5b O30` with the copy gave:
- 94 files identical to the O30 branch;
- 24 files differing, which are the landing fixes and main's own changes since 9a5f38a5b (DESIGN.md, HELP.md, the diagrams, package.json and the lockfile, `src/desktop/windows/bridge.ts` and `windows.ts`, and eleven client files).

Applying the step diff first and then the gate patch would have applied the step twice.

`diff -rq` of `src`, `tests` and `package.json` between the copy and `.agents/worktrees/gate-O30/tools/oculus` printed nothing.

`node_modules` is a `cp -c` clone of the gate worktree's. Node is `$HOME/.nvm/versions/node/v24.21.0/bin`.

Paths redirected under `$TMPDIR`:
- `HOME` and `TMUX_TMPDIR` for every load lane;
- for the app, a scratch HOME, hub, engine and tmux folder per run.

The app's port is 18917, not 8787, 8790 or 8817 to 8819.

**The Electron app was never started.** The app's main-process code ran under plain Node with Electron's modules replaced by a stub, through a module hook that resolves `electron` to the stub. The stub stands in as follows:
- `app` holds its event loop open, as Electron's main loop does, and `whenReady()` resolves at once.
- `BrowserWindow`'s page load fetches the URL and then emits `ready-to-show`.
- `utilityProcess.fork` is Node's `fork` with a `process.parentPort` over the IPC channel.
- `dialog`, `Menu`, `session`, `screen` and `ipcMain` are no-ops.

The app ran through the unchanged `tests/server/desktop/app-harness.ts`, so its recorder printed the `[screen]` lines as in the test. The build (`vite build`), the server (`src/server.ts`) and `src/desktop/*` are the real code.

`start.test.ts` was not run. No window was opened, no focus was taken, and `osascript` was not run.

## Red command

The red command is case 1's first start through the stubbed app, with the scratch world the test builds. It is joined by a second `npm run build` in the same checkout, started 12 s after the app's build prints its first line. That second build stands in for the landing lane's build.

```
cd $TMPDIR/diagnose.b8PoTY/diag && HOME=$D/home TMUX_TMPDIR=$D/tmuxdir CHECKOUT=$D/tree/tools/oculus COMPETE_AFTER_MS=12000 LIMIT_MS=200000 node first-start.mjs
```

`first-start.mjs` reproduces `start.test.ts`'s `scratch(PORT)` and `app()`: an engine copied without `local.yml`, then a `local.yml` naming the hub and the port; the env `HOME`, `TMUX_TMPDIR`, `USER`, `PATH` and `OCULUS_TEST_DEFAULT_PORT`; and spawning `app-harness.ts --engine <engine>`. It waits for `oculus on http://127.0.0.1:<port>` and `[screen] window.show`, as case 1 does, and prints three parts:
- part 1, whether `oculus on` was printed;
- part 2, the `[screen]` lines, which are what the test's `recorded, nothing shown:` line prints;
- part 3, whether the app is still running 10 s after a dialog, which is what keeps `printed()` waiting.

It exits 1 on red: a dialog recorded, no `window.show`, and the app still running.

Runs, with the output of each quoted:

```
=== run 1
exit 1
the second build started at 14.2s, ended at 37.7s, exit 0
part 1, the first start printed "oculus on http://127.0.0.1:18917": no
part 2, recorded, nothing shown: [screen] dialog
part 3, the app still running 10 s after the dialog: true
the dialog's message: 22.9s dialog: The build of the oculus server failed: }
RED: a dialog in place of window.show, the app left waiting
22.7s [build] error during build:
22.7s [build] Error: Could not load .../tree/tools/oculus/.svelte-kit/output/server/manifest.js: ENOENT: no such file or directory, open '.../tree/tools/oculus/.svelte-kit/output/server/manifest.js'
=== run 2
exit 1
the second build started at 14.6s, ended at 38.2s, exit 0
part 1, the first start printed "oculus on http://127.0.0.1:18917": no
part 2, recorded, nothing shown: [screen] dialog
part 3, the app still running 10 s after the dialog: true
the dialog's message: 23.4s dialog: The build of the oculus server failed: }
RED: a dialog in place of window.show, the app left waiting
23.2s [build] Error: Could not load .../.svelte-kit/output/server/manifest.js: ENOENT: no such file or directory, ...
=== run 3
exit 1
the second build started at 14.8s, ended at 38.7s, exit 0
part 1, the first start printed "oculus on http://127.0.0.1:18917": no
part 2, recorded, nothing shown: [screen] dialog
part 3, the app still running 10 s after the dialog: true
the dialog's message: 24.8s dialog: The build of the oculus server failed: }
RED: a dialog in place of window.show, the app left waiting
24.6s [build] Error: Could not load .../.svelte-kit/output/server/manifest.js: ENOENT: no such file or directory, ...
```

In every run the second build exits 0, as the landing's check-then-build lane passed.

**How the red command was reached, and the failure rate.** The symptom was seen only sometimes: the same suite passed in an earlier gate run.

1. The stubbed first start alone, with no load, was green: `part 2, recorded, nothing shown: [screen] window.show`, `oculus on` at 43.8 s.
2. With the landing's six other lanes running beside it in the copy (`load.mjs`: `npm test`, `npm run test:checks`, `npm run check; npm run build`, `format:check`, `lint`, the ASCII gate), started together, 2 runs gave 1 red:
   - The red run: `part 2, recorded, nothing shown: [screen] dialog`, `the dialog's message: 63.2s dialog: The build of the oculus server failed: }`, with the lane's `@@ build starts at 54s; @@ build ends at 94s`.
   - The green run: lane build `starts at 29s`, `window.show` at 48.0 s.
3. With the lane's build started a set time after the app's build printed its first line (`COMPETE_AFTER_MS`), a first pass at 0, 8, 16 and 24 s gave red, red, red, green. At 0 s the dialog was a different one: `dialog: The oculus server ended (exit code 1): Node.js v24.21.0`. The app's build had passed, and the server it started from `build/` died while the second build rewrote that folder.
4. A sweep, 2 runs per offset:

```
offset 4s run a: RED ... | dialog: The build of the oculus server failed: }
offset 4s run b: RED ... | dialog: The build of the oculus server failed: }
offset 8s run a: GREEN: window.show recorded, no dialog |
offset 8s run b: GREEN: window.show recorded, no dialog |
offset 12s run a: RED ... | dialog: The build of the oculus server failed: }
offset 12s run b: RED ... | dialog: The build of the oculus server failed: }
offset 16s run a: RED ... | dialog: The build of the oculus server failed: }
offset 16s run b: RED ... | dialog: The build of the oculus server failed: }
offset 20s run a: GREEN: window.show recorded, no dialog |
offset 20s run b: GREEN: window.show recorded, no dialog |
```

Over the sweep, 6 of 10 runs were red. At 12 s it was 2 of 2, and then 3 of 3 in the runs above, so 5 of 5. Earlier, 3 runs at 8 s were all green, and one at 8 s in the first pass was red. The window between the two builds is a few seconds wide, and 12 s sits inside it.

The record cannot say which dialog the gate's case 1 showed. Its message is printed only on the app's output, and the test prints that output only when the process closes. The `[screen] dialog` line and the 600 s wait match both `build_failed` and `server_exited`, and both come from the same two builds in one checkout.

Runs after the tightening: the red command already runs unattended in about 38 s. The network is cut to the app's own scratch port. Time and seeds play no part. The checkout's own `.svelte-kit` and `build/` cannot be isolated, since they are the symptom. The three runs above are the runs after the tightening.

## No red command

Not applicable.

## Shrunk case

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| The landing's other lanes (`npm test`, `test:checks`, `format:check`, `lint`, the ASCII gate) | red: the red command above runs without them, 3 of 3 | cut |
| The `npm run check` half of the check-then-build lane (as the second command, in place of the build) | green at offsets 0, 4, 8, 12 and 16 s: `check-only-0: GREEN` ... `check-only-16: GREEN` | cut (the build half is the part needed) |
| The `port:` line of the scratch `local.yml` (port from `--default-port`) | red: `cut-port-line: RED ... dialog: The build of the oculus server failed: }` | cut |
| The second build | green: `cut-second-build: GREEN: window.show recorded, no dialog` | put back |
| The rest of `start.test.ts` (the second start, cases 2 to 5) | red without them; the red command is the first start alone | cut |

The shrunk case, as it stands, has two parts, each needed for the red:
- the app's first start from the checkout, whose `vite build` writes into the checkout;
- one `npm run build` in the same checkout that starts while the app's build runs.

## Hypotheses

1. If the two builds share `.svelte-kit/output` (each build's `buildStart` runs `rimraf('.svelte-kit/output')`, kit `vite/index.js:1218-1224`, and the adapter step of the app's build then reads `.svelte-kit/output/server/*`), then giving the second build a `kit.outDir` of its own turns the red command green. Falsified by: red with the change, on the same ENOENT under the app's `.svelte-kit/output`.
2. If the shared `build/` folder is what fails the start (adapter-node runs `builder.rimraf(out)` with `out = 'build'`, `adapter-node/index.js:24,30-33`), then giving the second build an adapter `out` of its own, with `.svelte-kit` still shared, turns the red command green. Falsified by: red with the change.
3. If CPU load from a second build fails the app's build or start, and not shared files, then the same second build at the same moment run in a clone of the oculus folder, sharing no output, leaves the red command red. Falsified by: green with the build in the clone.

A fourth candidate was falsified by the shrink and is not listed: that `svelte-kit sync` rewriting `.svelte-kit/generated` breaks the app's build. `npm run check` (sync plus svelte-check) as the second command was green at five offsets.

The reply to the hypotheses, or "none, no person present": none, no person present.

The second list, when every hypothesis was falsified, in the same form: not needed.

## Probes

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 1 | `vite.config.ts`: `-            adapter: development.adapter` `+            adapter: development.adapter,` `+            outDir: process.env.DIAG_7C1E_OUT ?? '.svelte-kit' // DIAG-7c1e`, the red command with `COMPETE_CMD='DIAG_7C1E_OUT=.svelte-kit-diag7c1e npm run build'` (the app's build unchanged, on `.svelte-kit`) | 3 runs: `the second build started at 14.5s, ended at 38.1s, exit 0` / `part 2, recorded, nothing shown: [screen] window.show` / `GREEN`; run 2 `window.show`, `oculus on` at 25.7 s, GREEN; run 3 `oculus on` at 25.1 s, GREEN | still standing: green 3 of 3 with the change, red 5 of 5 at the same offset without it |
| 2 | `src/lib/server/root/vite-plugin.ts:48`: `-    const node = adapter();` `+    const node = adapter({ out: process.env.DIAG_7C1E_BUILD ?? 'build' }); // DIAG-7c1e`, the red command with `COMPETE_CMD='DIAG_7C1E_BUILD=build-diag7c1e npm run build'` | 3 runs, each `RED: a dialog in place of window.show, the app left waiting`, `dialog: The build of the oculus server failed: }`, `Error: Could not load .../.svelte-kit/output/server/manifest.js: ENOENT` | falsified |
| 3 | No tree change: the second command is `cd $D/copy/oculus && npm run build`, an APFS clone of the oculus folder with no `.svelte-kit` or `build` | 3 runs, each `GREEN: window.show recorded, no dialog` (second build started at 13.9, 23.7 and 14.8 s) | falsified |

Each change was undone after its runs: `git diff -- vite.config.ts src/lib/server/root/vite-plugin.ts | wc -l` printed `0` both times, and `.svelte-kit-diag7c1e` and `build-diag7c1e` were removed.

## Cause

Hypothesis 1, together with the trigger in the landing. Two `vite build`s ran in one checkout at the same time, and the build that started second emptied `.svelte-kit/output` while the app's build was reading it.

- Since O30, `npm run test:slow` builds the server into the checkout: `start.test.ts`'s `beforeAll` builds when `build/handler.js` is missing, and every app start from the checkout runs `buildServer` (`src/desktop/app.ts:284-294`).
- `tests/tiers/landing.mjs` runs `test:slow` in a lane of its own, beside the lane `npm run check; npm run build` (main daf935a66, `landing.mjs:22-33`).
- The lane's build runs `rimraf('.svelte-kit/output')` in its `buildStart`, while the app's build is in its adapter step reading `.svelte-kit/output/server/manifest.js`. The app's build fails with ENOENT.
- The app shows `desktop.dialog.build_failed`. The harness's `dialog.showMessageBox` records `[screen] dialog` and never resolves. The app stays alive.
- `printed(first, 'oculus on ...')` settles only on the text or on the process's `close`, so case 1 waits until vitest's 600000 ms limit. Its timeout error does not print the app's output, so the log holds no dialog message.

When the lane's build lands earlier in the app's start (offset 0 s), the app's build passes, but the server it starts dies while `build/` is rewritten. That gives `desktop.dialog.server_exited` and the same recorded line.

The probe that shows it: with only the second build's `kit.outDir` its own, the red command is green 3 of 3. Without that change it is red 5 of 5 at the same offset, and 3 of 3 with only `build/` separate. The same build at the same moment in a clone gives green 3 of 3, so the CPU load alone does not cause it.

**Was this on main before O30?** No. At daf935a66, 9a5f38a5b and d4bd8a503, main has no `tools/oculus/src/desktop` and no `tests/server/desktop`: `git ls-tree -r --name-only <c> -- tools/oculus/src/desktop | wc -l` printed 0 for each, and so did the count of `"app"` in `package.json`. The O30 branch has 25 files under `src/desktop` and the `app` script. On main, nothing under `tests` runs a build: `git grep` over `tests` for `vite.js`, `vite build` and `handler.js` finds only a fixture string in `diagrams.test.ts:175`. Main's runner already ran `test:slow` in its own lane, but before O30 nothing in `test:slow` wrote into `.svelte-kit` or `build/`. O30's `start.test.ts` and the app's build from the checkout make `test:slow` such a writer. The runner's own head comment already states the rule that writers of `.svelte-kit` share one lane.

## Fix and test

Test, run on the tree without the fix: no test is written. The record holds the reason under "No test reaches it" below, and Steps 17 has no failing test output to quote. The record gives the as-landed runs as "before". They come from the landing stand-in, `landing-standin.mjs MODE=landed`: the six lanes plus the first start in a lane of its own, all at once, with the lane's build started after `npm run check` and no sooner than 12 s after the app's build begins:

```
=== landed, run 1   lane 3 @@ build starts at 42s; @@ build ends at 83s   first start: GREEN (window.show, oculus on at 46.6s)
=== landed, run 2   lane 3 @@ build starts at 57s; @@ build ends at 84s   first start: GREEN (oculus on at 55.3s)
=== landed, run 3   lane 3 @@ build starts at 39s; @@ build ends at 68s
FAILED  first start (53.9 s, ended at 53.9s)
    part 1, the first start printed "oculus on http://127.0.0.1:18917": no
    part 2, recorded, nothing shown: [screen] dialog
    the dialog's message: 42.1s dialog: The build of the oculus server failed: }
    RED: a dialog in place of window.show, the app left waiting
```

As landed, this gives 1 red in 3 runs, and with the two earlier full-load runs, 2 red in 5. The gate itself passed this suite once and failed it once.

Fix, two changes. Both were applied in the scratch copy and checked there, and both are handed over by Step 0, since the step is out of main.

(A) `tools/oculus/tests/tiers/landing.mjs`: the slow tests run in the lane after the type check and the build.

```diff
-// The type check and the build run one after the other in one lane, since both write the generated
-// files under .svelte-kit. The lint keeps its cache in node_modules/.cache/eslint/, the one
-// npm run test:quick keeps.
+// The type check, the build and the slow tests run one after the other in one lane, since each
+// writes under .svelte-kit: the slow tests start the app, and every start of the app from the
+// checkout builds the server into .svelte-kit/output and build/, which a build running beside it
+// empties. The lint keeps its cache in node_modules/.cache/eslint/, the one npm run test:quick
+// keeps.
@@
     [
-        'npm run check, then npm run build',
+        'npm run check, then npm run build, then npm run test:slow',
         'sh',
-        ['-c', 'npm run check; c=$?; npm run build; b=$?; [ $c -eq 0 ] && [ $b -eq 0 ]']
+        [
+            '-c',
+            'npm run check; c=$?; npm run build; b=$?; npm run test:slow; s=$?; ' +
+                '[ $c -eq 0 ] && [ $b -eq 0 ] && [ $s -eq 0 ]'
+        ]
     ],
@@
-    ['ASCII gate', 'sh', ['-c', ASCII_GATE], judgeAscii],
-    ['npm run test:slow', NPM, ['run', 'test:slow']]
+    ['ASCII gate', 'sh', ['-c', ASCII_GATE], judgeAscii]
 ];
```

The cost of (A), added from the gate log's figures and not measured: the lane becomes about 122.6 s + 703.2 s = 826 s, where the landing's longest lane was 703.2 s.

(B) `tools/oculus/tests/server/desktop/start.test.ts`, `printed()`: a recorded dialog before the awaited text fails the wait at once and prints the app's output, the dialog's message included.

```diff
 /**
- * Settle when a line the process printed contains `text`, read from its output streams, and fail
- * when the process has closed without printing one.
+ * Settle when a line the process printed contains `text`, read from its output streams. Fail when
+ * the process has closed without printing one, and when the app asked for a dialog before `text`
+ * came: the recorder leaves every dialog unanswered, so the app would wait on it to the row's
+ * limit. The app prints a dialog's message before the recorder's line, so a row that waits for
+ * the message of the dialog it expects is settled by it first.
  */
 function printed(running: Running, text: string): Promise<void> {
     const { child, lines } = running;
     const seen = (): boolean => lines.some((line) => line.includes(text));
+    const asked = (): boolean => lines.some((line) => line.startsWith('[screen] dialog'));
     return new Promise<void>((done, fail) => {
+        const refused = (): Error =>
+            new Error(`a dialog before "${text}"; the output was:\n${lines.join('\n')}`);
         if (seen()) {
             done();
             return;
         }
+        if (asked()) {
+            fail(refused());
+            return;
+        }
         const streams = [child.stdout, child.stderr];
         const heard = (): void => {
-            if (!seen()) return;
-            stop();
-            done();
+            if (seen()) {
+                stop();
+                done();
+            } else if (asked()) {
+                stop();
+                fail(refused());
+            }
         };
```

Runs after the fix:

```
# (A), the landing stand-in with the first start in the lane after the build (MODE=fixed), 3 runs
=== fixed, run 1   lane 3 (80.1 s) @@ build starts at 21s; @@ build ends at 53s
    part 1 ... "oculus on http://127.0.0.1:18917": yes at 25.2s
    part 2, recorded, nothing shown: [screen] window.show
    GREEN: window.show recorded, no dialog
=== fixed, run 2   lane 3 (102.2 s) @@ build starts at 22s; @@ build ends at 68s
    part 2, recorded, nothing shown: [screen] window.show    GREEN
=== fixed, run 3   lane 3 (96.2 s) @@ build starts at 38s; @@ build ends at 70s
    part 2, recorded, nothing shown: [screen] window.show    GREEN

# (B), the fixed printed() copied verbatim from the fixed start.test.ts into a scratch module,
# driven on the stubbed first start
path red: printed(running, "oculus on http://127.0.0.1:18917") rejected: a dialog before "oculus on http://127.0.0.1:18917"; the output was: after 23.4 s
the recorder's dialog line arrived at: 23.4 s
path red: ... rejected: a dialog before "oculus on http://127.0.0.1:18917"; the output was: after 23.2 s
the recorder's dialog line arrived at: 23.2 s
path green: printed(running, "oculus on http://127.0.0.1:18917") settled after 23.8 s
path expected: printed(running, "Port 18917 is held by another program, so oculus did not start.") settled after 24.7 s
the dialog lines: dialog: Port 18917 is held by another program, so oculus did not start.

# the checks over the two changed files, in the copy
npx prettier --check ...      All matched files use Prettier code style!   (exit 0)
npx eslint ...                (exit 0, no output)
npm run check                 COMPLETED 2966 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npx vitest run tests/checks/source/comment-width.test.ts tests/checks/source/history.test.ts   Test Files 2 passed (2), Tests 5 passed (5)
LC_ALL=C grep -n '[^ -~]' <both files>   (exit 1, no output)

# the shrunk red command with (A) and (B) in the tree
part 1, the first start printed "oculus on http://127.0.0.1:18917": no
part 2, recorded, nothing shown: [screen] dialog
part 3, the app still running 10 s after the dialog: true
the dialog's message: 23.1s dialog: The build of the oculus server failed: }
RED: a dialog in place of window.show, the app left waiting
```

The red path rejects at the moment the recorder's line arrives, not at 600000 ms. The "expected" path is case 2's shape: a port held by another program, and the row waiting for that dialog's own message. It still settles, so the ordering that (B) relies on holds.

What the fix does not cover:
- **The shrunk red command stays red with (A) and (B).** It forces a second build into the checkout during the app's start, and neither change touches the app's build. (A) ends the red line because the landing then never runs a build beside `test:slow`. The red command still describes the product: `npm run app` from a checkout fails with the `build_failed` dialog whenever a `npm run build` runs in that checkout during its start. That is the open item below.
- **What was not verified.** (B) was not run inside `start.test.ts`, which this diagnosis may not run. It was run as a verbatim copy of the function. The fixed `landing.mjs` itself was not run, since its slow lane starts Electron. The stand-in runs its lanes in the same arrangement.

No test reaches it: the defect as it occurs is the arrangement of lanes in `tests/tiers/landing.mjs` together with `test:slow` starting the app. The only run that reaches it starts the Electron app, which this diagnosis may not start. A test of the runner's lanes would need a new entry in `agents/guarded.md`, which only Axel adds (`agents/spec.md:57`). No test is written: the failure costs nothing in the rules' sense. A false red at landing loses no work, breaks no installation and accepts no wrong configuration. (B) changes a test, and a test is judged by reading it.

## Findings for the session beside the cause

1. **Open item for Axel: the app's build from the checkout shares `.svelte-kit/output` and `build/` with every other build of that checkout.** Shown by the shrunk red command, still red with (A) and (B). Neither (A) nor (B) changes the app, and ending this needs a folder convention and a way to tell the server where the app's build is, which is a user-visible shape nothing names. Options:
   - (a) The app's build from the checkout writes into folders of its own: a `kit.outDir` and adapter `out` that the app passes to `vite build`, with `src/server.ts` and `app.ts:295` told where the handler is. A start then never meets another build. It costs a new folder pair in the checkout, `.gitignore` and DESIGN.md's tree, and a flag or variable between the app and the server. Recommended.
   - (b) Leave it, and rely on (A) for the landing. The app from the checkout keeps failing with `build_failed` when anyone builds in that checkout during its start. This is the lazy option.
2. **Defect in O30's own code: the reason a dialog names is the last line of the error output, which is not the error.**
   - Evidence: the app's build failed and the dialog said `The build of the oculus server failed: }`. The last stderr line is the `}` that closes vite's error object, while the error is the line `Error: Could not load .../manifest.js: ENOENT ...`. When the server died the dialog said `The oculus server ended (exit code 1): Node.js v24.21.0`.
   - The code: `src/desktop/server/build.ts:32` (`if (error) last = line;`) and `src/desktop/server/process.ts:65` (`if (error) remember(line);`).
   - Fix for O30's new brief: take the last line that names an error (a line opening with an error name such as `Error`, `SyntaxError` or `Error [CODE]`), and fall back to the last line when none does.
   - This is a defect in delivered work and needs no ruling.
3. **The 60 s timeout of `tests/checks/diagrams/diagrams.test.ts`.** It comes from the same parallel run's CPU load, which O30's slow tests add to, and not from the shared-folder race. The diagrams tool names `../build/` only to read an import of the built app in the source text (`utils/diagrams/graphs.mjs:83-87`). A grep of `utils/diagrams` and `tests/checks/diagrams` for `svelte-kit` and `build` finds nothing else.
   - The case 'are named stale, every one at once, when an import and a publish are added' measured:
     - alone, twice: 20482 ms and 19424 ms;
     - beside the landing's lanes without the slow tests: 25715 ms;
     - with five back-to-back builds in the clone added, standing in for the slow suite's builds: 43782 ms;
     - in the gate: 62442 ms.
   - It is a defect, on main and not O30's. The case carries its own `60_000` limit (`diagrams.test.ts:85, 111, 826`), while `npm run test:checks` runs with `--testTimeout 0`. The documented rule for the tree checks is "run by npm run test:checks with no time limit, since a finding of theirs is a defect in the tree" (`vite.config.ts:34-36`, README.md:17). So a tree check fails on machine load, not on a finding. The limits came in with R18 (`git log -S'60_000'`: 8d6c3a976, 2026-09-23).
   - Removing a limit is loosening a threshold, which `agents/spec.md:16,59` forbids as an edit made to pass a check, so this is raised and not edited. Options:
     - (a) drop the three per-case limits so the tree checks follow their documented rule, recommended;
     - (b) keep them and rerun the tree checks alone after a load red, the lazy option.
   - With (A), `test:slow` starts after the type check and the build, about 120 s into the run, when `test:checks` (124.9 s in the gate) is nearly done, so less of the two would overlap. That is not measured.

## Cleanup

```
$ grep -rn --exclude-dir=node_modules --exclude-dir=.scratch --exclude=local.yml -i "DIAG-7c1e\|DIAG_7C1E\|diag7c1e" $TMPDIR/diagnose.b8PoTY/tree/tools/oculus
(no output; exit 1)
```

The same grep without `--exclude-dir=.scratch` prints only lines of `tools/oculus/.scratch/migration/agents/reviews/Q106-diagnosis.md`, an earlier diagnosis record committed on main that used the same four hex digits. None is a line of this diagnosis.

Before removal, `ps -ax` showed no process holding `diagnose.b8PoTY`, no tmux socket existed under the scratch folders, and `lsof -iTCP:18917 -sTCP:LISTEN` printed nothing.

The removal:
- `git worktree remove --force "$TMPDIR/diagnose.b8PoTY/tree"` from the main checkout: exit 0.
- `rm -rf` of the clone, the probe scripts and their outputs, the scratch HOME and the tmux folder, the step diff and the patch copy, then `rmdir` of the folder: exit 0.
- `ls -d $TMPDIR/diagnose.b8PoTY`: No such file.
- `git worktree list | grep -c diagnose`: 0.

No credential or `.env` file was copied.

Nothing was changed in the main checkout, `.agents/worktrees/O30` (HEAD 815ac40cd) or `.agents/worktrees/gate-O30` (`git status --short | wc -l` 123, as at the start).

The red command run again on the original case: carried by `/spec` into O30's new brief as its check. The fixed landing runs `npm run test:landing` in the gate worktree with (A) and (B) applied, and on a red `start.test.ts` the row prints the dialog's message.

Record path for the booking: `agents/reviews/O30-diagnosis.md`, under its own heading below the two earlier diagnoses of O30. The cause, (A), (B), the record's path and the three findings above are what Steps 20 writes into O30's Step 0.
