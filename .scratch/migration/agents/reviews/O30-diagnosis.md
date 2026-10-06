# Diagnosis: O30 round 2 P2-1, the typed line after a Restart

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. A diagnosis of the same step later is appended below under its own heading at the level of the title above, `# Diagnosis: <the symptom in a few words>`, which names its finding or quotes its part.

Diagnosis agent: ae831f63ce80bd34e, claude-opus-5-5, 281,869 tokens, 108 tool uses, 53.1 min

**What it found.** The line in run r27 was never sent by the page, and the Restart is not the reason. r27 pasted `echo after-restart\n`, and that text ends in a line break. The terminal grid's paste hold (`holdPastes`, `terminal-list.ts:220-233`, wired at `TerminalGrid.svelte:330`) stops any paste that holds a line break and asks "Paste 1 lines into the terminal?". Nobody answered the question, so nothing reached the pane and no `pty: input on` line was logged. New Terminal still worked because it is an HTTP POST. The hold was added by a99e184d8, which is already in base b5299f4e5.

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
- `git worktree add --detach "$tmp/tree" b5299f4e5`, run from the main checkout.
- The step's diff `git diff --binary b5299f4e5`, taken inside `.agents/worktrees/O30` and applied with `git apply --allow-empty`, which printed "applied".
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
$ git diff --binary b5299f4e5 | shasum
66606744f9692c588f9e9542a04ca9f0dfcf93fa  -
```

After the run, from the same worktree:

```
$ git diff --binary b5299f4e5 | shasum
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

The hold came with a99e184d8 ("Draw the terminal as VS Code's terminal panel"). `git merge-base --is-ancestor a99e184d8 b5299f4e5` prints "in base", and `terminal-list.ts` is not in the step's diff. So the hold was there before O30, and P2-1 is not a defect of the Restart.

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
2. **A one-line paste closed by a line break is asked about, and the docs say otherwise.** This was there before the step (a99e184d8) and is outside its brief.
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
   - `git worktree list` showed another diagnosis copy live at the time (`diagnose.M9CEDn`, at 995e6dfad, A3's commit).
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
