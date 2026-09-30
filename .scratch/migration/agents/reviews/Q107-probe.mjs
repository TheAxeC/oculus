// Q107 probe: does a `sessions` list ever leave out a terminal tmux still runs, and does the page's
// `endedTerminals` then answer it as ended?
//
// Run from tools/oculus (any checkout or worktree that holds this file):
//
//     PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH node .scratch/migration/agents/reviews/Q107-probe.mjs [--list] [name ...]
//
// It starts its own dev server on Q107_PORT (default 8797) with HOME and TMUX_TMPDIR set on that one
// process to folders of Q107_SCRATCH (default ${TMPDIR}q107s), so the server's ~/.oculus and its
// tmux server are its own. Every tmux command names that socket with -S. It refuses to run when
// TMUX is set, when the port is taken, or when the socket path would pass the 104 bytes a unix
// socket holds. It stops its server, kills the tmux server of its own socket and removes the
// scratch folder when it ends, unless Q107_KEEP=1.
//
// Each scenario makes one event happen with shells running and a client subscribed to `sessions`,
// records every payload, and feeds the recorded lists to `endedTerminals` in the two shapes the page
// gives them: after a reload (first list, `held` every terminal the restored tabs hold, `seen`
// empty) and after a reconnect without a reload (`seen` carried over from the earlier lists). A
// scenario is RED when endedTerminals answers a terminal that tmux still lists. The exit code is 1
// when any scenario ran RED.

import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import net from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';

const here = dirname(fileURLToPath(import.meta.url));
const oculus = resolve(here, '../../../..');
const PORT = Number(process.env.Q107_PORT ?? 8797);
const SCRATCH = process.env.Q107_SCRATCH ?? `${process.env.TMPDIR ?? '/tmp/'}q107s`.replace('//', '/');
const HOME_DIR = join(SCRATCH, 'h');
const TMUX_DIR = join(SCRATCH, 'tm');
const UID = process.getuid();
const SOCKET = join(TMUX_DIR, `tmux-${UID}`, 'default');
const ORIGIN = `http://127.0.0.1:${PORT}`;
const CHANNEL_FILE = join(oculus, 'src/lib/server/machine/pty/channel.ts');
const log = (...parts) => console.log(...parts);
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

if (PORT === 8787 || PORT === 8790) throw new Error(`port ${PORT} belongs to the user`);
if (process.env.TMUX !== undefined) throw new Error('TMUX is set: this probe must not run inside tmux');
if (Buffer.byteLength(SOCKET) >= 100) throw new Error(`socket path too long: ${SOCKET}`);

function tmux(...args) {
    return spawnSync('tmux', ['-S', SOCKET, ...args], { encoding: 'utf8' });
}

/** The oculus terminals tmux lists on the probe's socket. */
function tmuxTerminals() {
    const out = tmux('list-sessions', '-F', '#{session_name}');
    if (out.status !== 0) return [];
    return out.stdout
        .split('\n')
        .filter((name) => name.startsWith('oculus-') && !name.startsWith('oculus-usage-'))
        .map((name) => name.slice('oculus-'.length));
}

function killTerminals() {
    for (const id of tmuxTerminals()) tmux('kill-session', '-t', `oculus-${id}`);
}

async function portFree() {
    return new Promise((done) => {
        const probe = net.connect({ port: PORT, host: '127.0.0.1' });
        probe.on('connect', () => {
            probe.destroy();
            done(false);
        });
        probe.on('error', () => done(true));
    });
}

let server = null;
let serverLog = '';

async function startServer() {
    if (!(await portFree())) throw new Error(`port ${PORT} is in use`);
    mkdirSync(HOME_DIR, { recursive: true });
    mkdirSync(TMUX_DIR, { recursive: true });
    const vite = join(oculus, 'node_modules/vite/bin/vite.js');
    server = spawn(process.execPath, [vite, 'dev', '--port', String(PORT), '--strictPort'], {
        cwd: oculus,
        env: { ...process.env, HOME: HOME_DIR, TMUX_TMPDIR: TMUX_DIR },
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true
    });
    serverLog = '';
    server.stdout.on('data', (chunk) => (serverLog += chunk));
    server.stderr.on('data', (chunk) => (serverLog += chunk));
    const gone = new Promise((done) => server.once('exit', done));
    server.exited = gone;
    for (let waited = 0; waited < 90000; waited += 500) {
        try {
            const reply = await fetch(`${ORIGIN}/`);
            if (reply.status === 200) return;
        } catch {
            // not listening yet
        }
        await sleep(500);
    }
    throw new Error(`server did not answer in 90 s\n${serverLog}`);
}

/** Stop the probe's own server: its process group only. */
async function stopServer() {
    if (server === null) return;
    const current = server;
    server = null;
    try {
        process.kill(-current.pid, 'SIGTERM');
    } catch {
        // already gone
    }
    await Promise.race([current.exited, sleep(8000)]);
    try {
        process.kill(-current.pid, 'SIGKILL');
    } catch {
        // already gone
    }
    for (let waited = 0; waited < 10000 && !(await portFree()); waited += 250) await sleep(250);
}

async function restartServer() {
    await stopServer();
    await startServer();
}

async function token() {
    const reply = await fetch(`${ORIGIN}/__data.json`);
    const body = await reply.json();
    const data = body.nodes.find((node) => node && node.type === 'data').data;
    return data[data[0].token];
}

async function post(tokenText, body) {
    const reply = await fetch(`${ORIGIN}/api/terminal`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: ORIGIN, 'x-oculus-token': tokenText },
        body: JSON.stringify(body)
    });
    return { status: reply.status, json: await reply.json() };
}

/** Start a shell terminal the way the page does and answer its id. */
async function startShell(tokenText, name) {
    const reply = await post(tokenText, { action: 'start', kind: 'shell', cwd: SCRATCH, cols: 80, rows: 24, name });
    if (!reply.json.ok) throw new Error(`start refused: ${JSON.stringify(reply.json)}`);
    return reply.json.terminal.id;
}

/** A client subscribed to `sessions`, recording every payload with the time it came. */
function client() {
    const records = [];
    const socket = new WebSocket(`ws://127.0.0.1:${PORT}/ws`, { headers: { Origin: ORIGIN } });
    const opened = new Promise((done, fail) => {
        socket.once('open', () => {
            socket.send(JSON.stringify({ type: 'subscribe', channels: ['sessions'] }));
            done();
        });
        socket.once('error', fail);
    });
    socket.on('message', (data) => {
        const message = JSON.parse(String(data));
        if (message.channel !== 'sessions') return;
        const list = message.payload?.terminals;
        records.push({
            at: Date.now(),
            ids: Array.isArray(list) ? list.map((one) => one.id) : null
        });
    });
    return { records, opened, socket, close: () => socket.terminate() };
}

/** Wait until the last recorded list holds every id (or the time runs out). */
async function listed(recorder, ids, ms = 15000) {
    for (let waited = 0; waited < ms; waited += 200) {
        const last = [...recorder.records].reverse().find((one) => one.ids !== null);
        if (last && ids.every((id) => last.ids.includes(id))) return true;
        await sleep(200);
    }
    return false;
}

// The page's own function, loaded through Vite as the page loads it.
import { createServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

async function loadEnded() {
    const vite = await createServer({
        root: oculus,
        configFile: false,
        appType: 'custom',
        logLevel: 'error',
        server: { middlewareMode: true, hmr: false, watch: null },
        optimizeDeps: { noDiscovery: true, include: [] },
        plugins: [svelte({ compilerOptions: { runes: true } })]
    });
    const module = await vite.ssrLoadModule('/src/lib/state/sessions/terminals.svelte.ts');
    return { ended: module.endedTerminals, close: () => vite.close() };
}

/**
 * The terminals endedTerminals answers over a run of lists, as the page calls it: `first` for the
 * first list heard, `held` the terminals its tabs hold then, `seen` grown by every list.
 */
function answers(ended, lists, held) {
    const seen = new Set();
    const out = [];
    lists.forEach((now, at) => {
        const gone = ended(seen, now, at === 0, at === 0 ? held : []);
        for (const id of gone) out.push({ id, list: at, now });
        for (const id of now) seen.add(id);
    });
    return out;
}

/** Judge one recorded run in the two page shapes. */
function judge(ended, before, after, initial, running, killed) {
    const beforeLists = before.records.filter((one) => one.ids !== null).map((one) => one.ids);
    const afterLists = after.records.filter((one) => one.ids !== null).map((one) => one.ids);
    const shapes = {
        // The page reloaded: its next list is a first list, and its restored tabs hold every terminal.
        reload: answers(ended, afterLists, initial),
        // The page kept running: its `seen` carries the lists heard before the event.
        reconnect: answers(ended, [...beforeLists, ...afterLists], [])
    };
    const report = {};
    for (const [shape, found] of Object.entries(shapes)) {
        const wrong = found.filter((one) => running.includes(one.id));
        const missed = killed !== undefined && !found.some((one) => one.id === killed);
        report[shape] = { wrong, missed, killed, lists: shape === 'reload' ? afterLists.length : beforeLists.length + afterLists.length };
    }
    return report;
}

const scenarios = {
    // The dev server loads channel.ts again after a save: the file is rewritten with its own bytes.
    async save(ctx) {
        const held = ctx.recorder;
        const closed = new Promise((done) => held.socket.once('close', () => done(true)));
        writeFileSync(CHANNEL_FILE, readFileSync(CHANNEL_FILE));
        const restarted = await Promise.race([closed, sleep(20000).then(() => false)]);
        ctx.note = `the socket of the open client ${restarted ? 'closed, so the dev server restarted' : 'stayed open, so the dev server did not restart'}`;
        await waitServerBack();
        return {};
    },
    // The server is stopped and started again.
    async restart() {
        await restartServer();
        return {};
    },
    // The socket closes and opens again; the server stays.
    async reconnect() {
        return {};
    },
    // A start that fires refresh() calls in a burst, with the machine loaded so replies can cross.
    async burst(ctx) {
        const load = [];
        for (let n = 0; n < 6; n += 1) {
            load.push(spawn(process.execPath, ['-e', 'for(;;){}'], { stdio: 'ignore' }));
        }
        try {
            const extra = [];
            for (let round = 0; round < 6; round += 1) {
                const made = await Promise.all(
                    Array.from({ length: 10 }, (_, n) => startShell(ctx.token, `burst-${round}-${n}`).catch(() => null))
                );
                extra.push(...made.filter((id) => id !== null));
                await sleep(1200);
            }
            ctx.started.push(...extra);
        } finally {
            for (const child of load) child.kill('SIGKILL');
        }
        return { keepRecording: true };
    },
    // One list read fails as "no server" while sessions run. A page is attached to a terminal, so the
    // server holds a control client; the probe holds one of its own, opened before the socket file is
    // moved away for 400 ms. A session created through the probe's connection (which needs no socket
    // path) makes the server's control client report `%sessions-changed`, and the server reads the
    // list by path while the path is gone. The socket is then given back and a second session is
    // created, which is the next read.
    async noserver(ctx) {
        const page = new WebSocket(`ws://127.0.0.1:${PORT}/ws`, { headers: { Origin: ORIGIN } });
        await new Promise((done, fail) => {
            page.once('open', () => {
                page.send(JSON.stringify({ type: 'subscribe', channels: [`pty:${ctx.started[0]}`], token: ctx.token }));
                done();
            });
            page.once('error', fail);
        });
        await sleep(2500);
        const mine = spawn('tmux', ['-S', SOCKET, '-C', 'attach-session', '-t', `oculus-${ctx.started[1]}`], {
            stdio: ['pipe', 'pipe', 'ignore']
        });
        await sleep(1000);
        const away = `${SOCKET}.away`;
        renameSync(SOCKET, away);
        const probe = tmux('list-sessions');
        ctx.note = `while the socket is away tmux says: ${probe.stderr.trim().replace(SCRATCH, '<scratch>')}`;
        mine.stdin.write('new-session -d -s oculus-f1e2d3-shell\n');
        ctx.started.push('f1e2d3-shell');
        await sleep(400);
        renameSync(away, SOCKET);
        await sleep(1500);
        tmux('new-session', '-d', '-s', 'oculus-f1e2d4-shell');
        ctx.started.push('f1e2d4-shell');
        await sleep(3500);
        mine.kill();
        page.terminate();
        return { keepRecording: true };
    },
    // A terminal that really ends: its tmux session is killed on the probe's socket while the page is
    // attached to the other one, so the server's control client reports the change at once. The
    // killed terminal must be answered as ended and the other one must not.
    async ended(ctx) {
        const page = new WebSocket(`ws://127.0.0.1:${PORT}/ws`, { headers: { Origin: ORIGIN } });
        await new Promise((done, fail) => {
            page.once('open', () => {
                page.send(JSON.stringify({ type: 'subscribe', channels: [`pty:${ctx.started[1]}`], token: ctx.token }));
                done();
            });
            page.once('error', fail);
        });
        await sleep(2500);
        tmux('kill-session', '-t', `oculus-${ctx.started[0]}`);
        await sleep(4000);
        page.terminate();
        return { keepRecording: true, killed: ctx.started[0] };
    },
    // The usage refresh's session starts and is killed beside the terminals.
    async usage(ctx) {
        tmux('new-session', '-d', '-s', 'oculus-usage-probe', '-x', '80', '-y', '24');
        await sleep(2500);
        tmux('kill-session', '-t', 'oculus-usage-probe');
        await sleep(3500);
        return { keepRecording: true };
    },
    // A running terminal whose shell sits in a folder named with a newline, which the list format
    // (tab separated, one row per line) would split in two; a refresh follows.
    async oddcwd(ctx) {
        const folder = join(SCRATCH, 'odd\nfolder');
        mkdirSync(folder, { recursive: true });
        tmux('send-keys', '-t', `oculus-${ctx.started[0]}`, `cd "$(printf 'odd\\nfolder')" && pwd`, 'Enter');
        await sleep(1500);
        ctx.started.push(await startShell(ctx.token, 'refresh'));
        await sleep(3000);
        return { keepRecording: true };
    },
    // A running terminal whose name option holds a newline (the endpoint refuses one, tmux does not).
    async oddname(ctx) {
        tmux('set-option', '-t', `oculus-${ctx.started[0]}`, '@oculus_name', 'two\nlines');
        ctx.started.push(await startShell(ctx.token, 'refresh'));
        await sleep(3000);
        return { keepRecording: true };
    }
};

async function waitServerBack() {
    // Vite restarts its own server on a save of a file the config imports; the old socket closes
    // first, then the port answers again.
    await sleep(2000);
    for (let waited = 0; waited < 90000; waited += 500) {
        try {
            const reply = await fetch(`${ORIGIN}/`);
            if (reply.status === 200) return;
        } catch {
            // restarting
        }
        await sleep(500);
    }
    throw new Error('the server did not come back after the save');
}

async function run(name, ended) {
    killTerminals();
    const tokenText = await token();
    const recorder = client();
    await recorder.opened;
    const started = [await startShell(tokenText, 'one'), await startShell(tokenText, 'two')];
    if (!(await listed(recorder, started))) throw new Error('the two shells were never listed');
    const initial = [...started];
    const ctx = { token: tokenText, started, recorder, note: '' };
    const count = recorder.records.length;
    const result = await scenarios[name](ctx);
    let after;
    if (result.keepRecording) {
        after = { records: recorder.records.slice(count) };
        recorder.close();
    } else {
        // A new connection after the event, as the page makes one.
        recorder.close();
        const tokenAgain = await token();
        ctx.token = tokenAgain;
        const fresh = client();
        await fresh.opened;
        await listed(fresh, started, 30000);
        await sleep(6000);
        after = { records: fresh.records };
        fresh.close();
    }
    const running = tmuxTerminals().filter((id) => ctx.started.includes(id));
    const before = { records: recorder.records.slice(0, count) };
    const report = judge(ended, before, after, initial, running, result.killed);
    return { name, report, running, note: ctx.note };
}

const only = process.argv.slice(2).filter((one) => !one.startsWith('--'));
if (process.argv.includes('--list')) {
    log(Object.keys(scenarios).join('\n'));
    process.exit(0);
}

let red = false;
const loader = await loadEnded();
try {
    await startServer();
    for (const name of only.length > 0 ? only : Object.keys(scenarios)) {
        const { report, running, note } = await run(name, loader.ended);
        for (const [shape, { wrong, missed, killed, lists }] of Object.entries(report)) {
            const bad = wrong.length > 0 || missed;
            const verdict = bad ? 'RED' : 'green';
            if (bad) red = true;
            const ends = killed === undefined ? '' : `; the killed terminal ${missed ? 'was NOT' : 'was'} answered`;
            log(`${verdict} ${name} / page shape ${shape}: ${lists} lists, endedTerminals answers ${wrong.length} terminal(s) tmux still lists (${running.length} running)${ends}`);
            for (const one of wrong) log(`    answered ${one.id} at list ${one.list}; that list held [${one.now.join(', ')}]`);
        }
        if (note !== '') log(`    ${note}`);
    }
} finally {
    await stopServer();
    await loader.close();
    tmux('kill-server');
    if (process.env.Q107_KEEP !== '1') rmSync(SCRATCH, { recursive: true, force: true });
}
log(red ? 'RESULT: RED' : 'RESULT: green');
process.exit(red ? 1 : 0);
