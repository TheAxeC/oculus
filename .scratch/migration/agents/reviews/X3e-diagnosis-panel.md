# Diagnosis: a second folder panel, a panel that lives for hours, a cancel said as a failure

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. None of the outputs below carries a secret. A diagnosis of the same step later is appended below under its own heading at the level of the title above, `# Diagnosis: <the symptom in a few words>`, which names its finding.

Step X3e of plan oculus/migration, ruling Z441, the server half of Q88c-19, in the brief-check form with no person present (Steps 2 to 7, 11 to 19, 22 and 23). The client half (a busy state on the control) is X3e's item D17 (`agents/briefs/X3e.md:165`) and is not diagnosed here.

## Symptom

From `tools/oculus/.scratch/migration/agents/reviews/owed-looks.md:116`, Q88c-19:

> Add Folder to Workspace and `:folder` open a native macOS folder panel with no sign in oculus that one is open; a second press opens a second panel. An earlier panel (osascript pid 42763, child of the 8790 server) has been open for six hours. When a panel is cancelled the Files view says "The folder panel could not be opened."

Diagnosed here, as the orchestrator's prompt names them: why one page can start a second panel while one is open, why a panel lives for hours, and why a cancel answers as a failure.

## Where the probes run

A scratch copy: a detached worktree of main's head `6dd4684a45ca649533cf94e11e85662a83c2e737` at `$tmp/tree`, with `$tmp` = `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.EGuQFs` (`mktemp -d "${TMPDIR:-/tmp}/diagnose.XXXXXX"`), made by `git worktree add --detach "$tmp/tree" HEAD` from `/Users/axelfaes/workspace/research-hub`. Nothing was applied to it (a brief-check form reads the brief as it stands). `$tmp/tree/tools/oculus/node_modules` is a symbolic link to the main checkout's `tools/oculus/node_modules`, used only to import SvelteKit and Vite. The paths redirected under `$TMPDIR`: HOME (`$tmp/home`), and PATH puts `$tmp/bin` first, where a fake `osascript` stands in for `/usr/bin/osascript`, so no macOS panel was opened by any run. ORDO_STABLE and ORDO_SKILL_DIRS: not touched by any command here.

The server path of the symptom: Add Folder to Workspace (`explorer.addFolders`, `src/lib/state/sources/explorer/ops.svelte.ts:580`) and `:folder` (`explorer.openFolder`, `ops.svelte.ts:596`, from `src/lib/shell/keys/Palette.svelte:272`) both POST `/api/folders/pick` (`src/routes/api/(files)/folders/pick/+server.ts:9-10`), which calls `handlePick` (`src/lib/server/files/fs/picker.ts:91-116`), which runs `osascript -l JavaScript -e PICKER_SCRIPT` through `execFile` (`picker.ts:68-79`). The open flag is `locals.server.folderPicker`, a field of the ServerContext built by `pickerState()` (`src/lib/server/root/context.ts:457`).

The server on 8790 is the dev server, from `ps -o pid,ppid,lstart,command -p 89237`:

```
  PID  PPID STARTED                      COMMAND
89237 89211 Sat Oct  3 13:37:52 2026     node /Users/axelfaes/workspace/research-hub/tools/oculus/node_modules/.bin/vite dev
```

The panel pid 42763 is gone (`ps -o pid,ppid,lstart,etime,command -p 42763` printed only its header) and no osascript runs now (`ps -axo pid,ppid,lstart,etime,command | grep -i "[o]sascript"` printed nothing).

## Red command

The fake osascript, `$tmp/bin/osascript`:

```sh
#!/bin/bash
# Stand-in for /usr/bin/osascript in the diagnosis: no panel, a recorded lifetime.
echo "start $$" >> "$FAKE_LOG"
case "$FAKE_MODE" in
  cancel) echo "execution error: Error: User canceled. (-128)" >&2; exit 1 ;;
  cancelbutton) echo ""; exit 0 ;;
  exit1) exit 1 ;;
  *) trap 'echo "term $$" >> "$FAKE_LOG"; kill $child 2>/dev/null; exit 143' TERM INT HUP
     sleep "${FAKE_SECONDS:-20}" & child=$!; wait $child; echo "/Users/x/chosen"; echo "end $$" >> "$FAKE_LOG" ;;
esac
```

How the fake answers a cancel comes from osascript itself, run with no panel:

```
$ osascript -e 'error number -128'; echo "exit=$?"
0:17: execution error: User canceled. (-128)
exit=1
$ osascript -l JavaScript -e 'const e = new Error("User canceled."); e.errorNumber = -128; throw e'; echo "exit=$?"
execution error: Error: Error: User canceled. (-128)
exit=1
$ osascript -l JavaScript -e "''"; echo "exit=$?"

exit=0
```

The one command, `$tmp/red.sh`:

```sh
#!/bin/bash
cd $tmp && HOME=$tmp/home PATH=$tmp/bin:$PATH OC=$tmp/tree/tools/oculus FAKE_LOG=$tmp/fake.log node --no-warnings $tmp/red.mjs; echo "exit=$?"
```

It runs `$tmp/red.mjs`, which drives `handlePick` from the scratch copy over real HTTP the way `vite dev` serves the route: SvelteKit's own `getRequest` and `setResponse` (`@sveltejs/kit/src/exports/node/index.js`), one node http server per dev-server life, its open sockets destroyed on close as Vite's `createServerCloseFn` does (`vite/dist/node/chunks/node.js:24589-24610`), and a dev-server restart as Vite runs one: the old server closed, a new one with a new ServerContext, whose `pickerState()` is fresh (`context.ts:457`). The real osascript runner of `picker.ts` runs; the fake is what it finds on PATH. Each part prints PASS when the server behaves as it should and FAIL on the symptom, and every part runs whatever the others give:

- P1a: two presses on one server while the first panel is open: the second is answered busy and one panel runs.
- P1b: the dev server restarts while the first panel is open, then the page presses again: at most one panel is open at once.
- P2a: the page that asked goes away (its connection closes): 1 s later no panel runs.
- P2b: a panel whose page still waits is not ended by a time limit after 2 s (the panel waits for the reader, `picker.ts:47`).
- P3a: the reader cancels and osascript reports it as a user cancel (exit 1, "(-128)" on stderr): the answer is `{"ok":true,"paths":[]}`.
- P3b: the panel's Cancel button (the script prints an empty line, exit 0): the answer is `{"ok":true,"paths":[]}`.

```js
// Red command of the folder panel diagnosis. Drives the server function of POST /api/folders/pick
// (handlePick) over real HTTP, the way vite dev serves it: SvelteKit's own getRequest and
// setResponse, one node http server per dev-server life, its open sockets destroyed on close as
// Vite's createServerCloseFn does. The real osascript runner runs; PATH puts the fake first.
import http from 'node:http';
import { readFileSync, writeFileSync } from 'node:fs';

const OC = process.env.OC;
const { getRequest, setResponse } = await import(
    `${OC}/node_modules/@sveltejs/kit/src/exports/node/index.js`
);
const picker = await import(`${OC}/src/lib/server/files/fs/picker.ts`);
const { TOKEN_HEADER } = await import(`${OC}/src/lib/server/core/auth.ts`);
const TOKEN = 'diag-token';
const LOG = process.env.FAKE_LOG;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function starts() {
    try {
        return readFileSync(LOG, 'utf8')
            .split('\n')
            .filter((l) => l.startsWith('start '))
            .map((l) => Number(l.split(' ')[1]));
    } catch {
        return [];
    }
}
function alive(pid) {
    try {
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
}
const living = () => starts().filter(alive);
async function waitFor(test, ms = 3000) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        if (test()) return true;
        await sleep(20);
    }
    return false;
}
function reset(mode) {
    for (const pid of living()) process.kill(pid, 'SIGKILL');
    writeFileSync(LOG, '');
    process.env.FAKE_MODE = mode;
}

/** One dev-server life: the route's glue, handlePick with the request's connection. */
async function serve(state) {
    const sockets = new Set();
    const server = http.createServer(async (req, res) => {
        const request = await getRequest({ request: req, base: 'http://127.0.0.1' });
        const response = await picker.handlePick(request, TOKEN, state, { connection: req.socket });
        await setResponse(res, response);
    });
    server.on('connection', (s) => {
        sockets.add(s);
        s.on('close', () => sockets.delete(s));
    });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    return {
        port: server.address().port,
        close: () =>
            new Promise((r) => {
                sockets.forEach((s) => s.destroy());
                server.close(() => r());
            })
    };
}

/** One press: the page's POST, answered as status and body, or the fetch's failure. */
function press(port, signal) {
    return fetch(`http://127.0.0.1:${port}/api/folders/pick`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', [TOKEN_HEADER]: TOKEN },
        body: '{}',
        signal
    })
        .then(async (r) => ({ status: r.status, body: JSON.stringify(await r.json()) }))
        .catch((e) => ({ status: 'no answer', body: String(e.name) }));
}

const results = [];
const want = (p) => !process.env.ONLY || process.env.ONLY.split(",").includes(p);
function say(part, pass, detail) {
    results.push(pass);
    console.log(`${part}: ${pass ? 'PASS' : 'FAIL'} ${detail}`);
}

// P1a: two presses on one server while the first panel is open.
if (want("P1a")) {
    reset('sleep');
    const s = await serve(picker.pickerState());
    const ac = new AbortController();
    const first = press(s.port, ac.signal);
    await waitFor(() => starts().length >= 1);
    const second = await Promise.race([press(s.port), sleep(1500).then(() => ({ status: 'pending' }))]);
    await sleep(200);
    say(
        'P1a one server, second press while open',
        second.status === 409 && starts().length === 1,
        `second=${second.status} ${second.body ?? ''} panels started=${starts().length}`
    );
    ac.abort();
    await first;
    await s.close();
}

// P1b: the dev server restarts (Vite closes it, destroying its sockets; a new ServerContext holds a
// new pickerState, context.ts:457) while the first panel is open; then the page presses again.
if (want("P1b")) {
    reset('sleep');
    const s1 = await serve(picker.pickerState());
    const first = press(s1.port);
    await waitFor(() => starts().length >= 1);
    await s1.close();
    const firstAnswer = await first;
    const s2 = await serve(picker.pickerState());
    const ac = new AbortController();
    const second = press(s2.port, ac.signal);
    await waitFor(() => starts().length >= 2, 1500);
    await sleep(300);
    const open = living();
    say(
        'P1b second press after a dev-server restart',
        open.length <= 1,
        `first press answered: ${firstAnswer.status} ${firstAnswer.body}; panels started=${starts().length}, open at once=${open.length}`
    );
    ac.abort();
    await second;
    await s2.close();
}

// P2a: the page that asked goes away (its connection closes) while the panel is open.
if (want("P2a")) {
    reset('sleep');
    const s = await serve(picker.pickerState());
    const ac = new AbortController();
    const first = press(s.port, ac.signal);
    await waitFor(() => starts().length >= 1);
    ac.abort();
    await first;
    await sleep(1000);
    say(
        'P2a panel after its page went away',
        living().length === 0,
        `panels still running 1 s after the connection closed=${living().length}`
    );
    await s.close();
}

// P2b: a panel whose page still waits is not ended by a time limit (the panel waits for the reader).
if (want("P2b")) {
    reset('sleep');
    const s = await serve(picker.pickerState());
    const ac = new AbortController();
    const first = press(s.port, ac.signal);
    await waitFor(() => starts().length >= 1);
    await sleep(2000);
    say(
        'P2b panel whose page still waits, after 2 s',
        living().length === 1,
        `panels running=${living().length}`
    );
    ac.abort();
    await first;
    await s.close();
}

// P3a: the reader cancels and osascript reports it as it reports a user cancel: exit 1, -128.
if (want("P3a")) {
    reset('cancel');
    const s = await serve(picker.pickerState());
    const answer = await press(s.port);
    say(
        'P3a cancel reported as -128',
        answer.status === 200 && answer.body === '{"ok":true,"paths":[]}',
        `answer=${answer.status} ${answer.body}`
    );
    await s.close();
}

// P3b: the panel's Cancel button: runModal answers 0, the script prints an empty line, exit 0.
if (want("P3b")) {
    reset('cancelbutton');
    const s = await serve(picker.pickerState());
    const answer = await press(s.port);
    say(
        'P3b cancel button, exit 0 with an empty line',
        answer.status === 200 && answer.body === '{"ok":true,"paths":[]}',
        `answer=${answer.status} ${answer.body}`
    );
    await s.close();
}

reset('sleep');
console.log(`panels left running=${living().length}`);
process.exit(results.every(Boolean) ? 0 : 1);
```

Runs on main's head, three in a row:

```
== red run 1
P1a one server, second press while open: PASS second=409 {"error":"busy"} panels started=1
P1b second press after a dev-server restart: FAIL first press answered: no answer TypeError; panels started=2, open at once=2
P2a panel after its page went away: FAIL panels still running 1 s after the connection closed=1
P2b panel whose page still waits, after 2 s: PASS panels running=1
P3a cancel reported as -128: FAIL answer=500 {"error":"failed"}
P3b cancel button, exit 0 with an empty line: PASS answer=200 {"ok":true,"paths":[]}
panels left running=0
exit=1
== red run 2
P1a one server, second press while open: PASS second=409 {"error":"busy"} panels started=1
P1b second press after a dev-server restart: FAIL first press answered: no answer TypeError; panels started=2, open at once=2
P2a panel after its page went away: FAIL panels still running 1 s after the connection closed=1
P2b panel whose page still waits, after 2 s: PASS panels running=1
P3a cancel reported as -128: FAIL answer=500 {"error":"failed"}
P3b cancel button, exit 0 with an empty line: PASS answer=200 {"ok":true,"paths":[]}
panels left running=0
exit=1
== red run 3
P1a one server, second press while open: PASS second=409 {"error":"busy"} panels started=1
P1b second press after a dev-server restart: FAIL first press answered: no answer TypeError; panels started=2, open at once=2
P2a panel after its page went away: FAIL panels still running 1 s after the connection closed=1
P2b panel whose page still waits, after 2 s: PASS panels running=1
P3a cancel reported as -128: FAIL answer=500 {"error":"failed"}
P3b cancel button, exit 0 with an empty line: PASS answer=200 {"ok":true,"paths":[]}
panels left running=0
exit=1
```

The same result on three runs: P1b, P2a and P3a FAIL, P1a, P2b and P3b PASS.

Tightening: the command sets its own state up (each part clears the fake's log and kills any fake left), uses ephemeral ports on 127.0.0.1 only, HOME under `$tmp`, and no network. `time ./red.sh` printed `0.29s user 0.10s system 9% cpu 4.048 total`. The three runs above are of the tightened command.

## No red command

Not applicable.

## Shrunk case

Each cut was run from `$tmp/shrink.mjs`, which calls `handlePick` directly with a `Request` and no HTTP server (the same fake on PATH, the same HOME):

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| P1b: the HTTP server, the socket destroy and the server close; only a fresh `pickerState()` while the first panel runs | `panels open at once=2 -> red` | cut |
| P1b: the fresh state (the old state kept across the restart) | `second=409 {"error":"busy"} open at once=1 -> green` | put back |
| P2a: the connection (no HTTP, so nothing can close) | `answer 200 {"ok":true,"paths":["/Users/x/chosen"]} after 1013 ms; the run ends only when the panel answers` (with `FAKE_SECONDS=1`) | put back: P2a's symptom is a run that outlives its connection, and with no connection there is nothing to outlive |
| P3a: the HTTP server | `500 {"error":"failed"} -> red` | cut |
| P3a: the stderr text (exit 1 alone, fake mode `exit1`) | `500 {"error":"failed"} -> red` | cut |

The shrunk case, as it stands: P1b needs a second ServerContext (a fresh `pickerState()`) while the first context's osascript still runs; P2a needs a request whose connection closes while its osascript runs; P3a needs an osascript run that exits non-zero, nothing more. The red command keeps the HTTP layer because the fix of P1b and P2a acts on the connection, and Vite's restart reaches the panel only through it.

Why a fresh state arrives in one process under `vite dev`: Vite bundles `vite.config.ts` with its local imports and restarts the dev server in the same process when any of them changes (`node.js:24895-24909`, "changed, restarting server..."), running `configureServer` again (`src/lib/server/root/vite-plugin.ts:59-72`), which builds a new ServerContext through `wireServer` (`src/lib/server/root/process/serve.ts:35-50`). The list of those files, from Vite's own loader run in the scratch copy:

```
$ cd $tmp/tree/tools/oculus && HOME=$tmp/home node --input-type=module -e "const { loadConfigFromFile } = await import('vite'); const r = await loadConfigFromFile({ command: 'serve', mode: 'development' }, 'vite.config.ts'); ..."
config dependencies: 159
src/lib/server/files/fs/picker.ts true
src/lib/server/root/context.ts true
src/lib/server/root/vite-plugin.ts true
```

On the day of the look, eight commits on main touched one of those 159 files, each a restart of a dev server running in the main checkout (`git log --since='2026-10-02 00:00' --until='2026-10-03 00:00' -- <the 159 files>`):

```
8ef3abbe3 2026-10-02 16:18:14 +0200 Land M3, the resources registry
81f5e4fe3 2026-10-02 16:00:54 +0200 Land Q88c, the Source Control rows' and the pane strip's right-click capabilities
33be30af8 2026-10-02 14:40:33 +0200 Land A1, a comment on a line of a session's diff
705e588de 2026-10-02 11:49:21 +0200 Land X3a, the Files view as VS Code's Explorer
4ce50c593 2026-10-02 08:23:30 +0200 Land D24, the Personal board
158247056 2026-10-02 07:47:26 +0200 Land D35, every configuration file live
d210de045 2026-10-02 06:41:47 +0200 Land M4, the Present view's equations as LaTeX
e77103dcb 2026-10-02 01:23:22 +0200 Read the views', shell's and routes' inputs through zod (Q85d)
```

## Hypotheses

1. If the panel's osascript is tied to nothing but the reader's answer (the runner, `picker.ts:68-79`, has no signal; neither the request's connection closing nor `context.close()`, `context.ts:471-489`, ends it), then killing the run when the request's connection closes turns P1b and P2a green. Falsified by: P2a still showing a running panel 1 s after the connection closed, or P1b still showing two panels open at once.
2. If the second panel comes from the open flag being a field of the ServerContext, which a restart builds anew, then one open flag for the whole process turns P1b green. Falsified by: P1b red with a process-wide flag. Makes it worse: a panel nobody waits for then answers every later press busy.
3. If SvelteKit's `request.signal` aborts when the page goes away, then passing `request.signal` to `execFile` turns P2a and P1b green. Falsified by: P2a red with `request.signal` passed.
4. If the server reads only the exit status and answers every non-zero exit, osascript's user cancel (exit 1, "User canceled. (-128)" on stderr) included, as `failed` (`picker.ts:74-76`, `picker.ts:109`), then answering a run whose stderr ends in "(-128)" as `{ ok: true, paths: [] }` turns P3a green. Falsified by: P3a still answered 500.
5. If the six-hour life comes from the missing time limit (`picker.ts:47`, no `timeout` at `picker.ts:73`), then a time limit on `execFile` turns P2a green without turning P2b red. Falsified by: P2a still red at 1 s with a limit above 1 s, or P2b red with a limit under 2 s.

The rank is by how much of the evidence each explains: 1 explains P1b, P2a and the six hours; 2 explains P1b only; 3 is the cheaper form of 1 if Kit's signal carries the disconnect; 4 explains P3a; 5 explains the six hours only.

The reply to the hypotheses: none, no person present.

The second list: not needed.

## Probes

Each probe replaced `picker.ts` in the scratch copy with one change, ran `$tmp/red.sh`, and put `picker.ts` back from `$tmp/picker.orig.ts` (`cmp` printed nothing after the last). No probe added logging, so no `DIAG-` tag was used.

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 1 | Diff H1 below: `execFile` gets a `signal`; `handlePick` aborts it on the `close` of `deps.connection` | P1a PASS, P1b PASS (open at once=1), P2a PASS (0 running), P2b PASS, P3a FAIL, P3b PASS | still standing for P1b and P2a |
| 2 | Diff H2 below: a module-level `PROCESS_PICKER` used for every request | full run: P1b PASS only because the first press was refused busy (panels started=0), P2b, P3a, P3b answered 409 busy; P1b alone PASS; P2a alone FAIL (1 running) | falsified as the cause: P2a's run outlives its page, and the flag turns a panel nobody waits for into busy answers for every later page |
| 3 | Diff H3 below: `execFile` gets `request.signal` | P1b FAIL (open at once=2), P2a FAIL (1 running) | falsified; Kit aborts `request.signal` only when the request closes before its body ended (`@sveltejs/kit/src/exports/node/index.js:143-147`), and a probe of `getRequest` printed `socket closed; request.signal.aborted=false` after the client aborted |
| 4 | Diff H4 below: stderr kept, a run whose stderr ends in "(-128)" is not `failed` | P3a PASS (`200 {"ok":true,"paths":[]}`), P1b and P2a FAIL | still standing for P3a |
| 5 | Diff H5 below: `timeout: 1500` on `execFile` | P2a FAIL (1 running at 1 s), P2b FAIL (0 running at 2 s) | falsified: a limit either outlasts the page's leaving or ends a panel its page still waits on |

The runs:

```
== probe h1
P1a one server, second press while open: PASS second=409 {"error":"busy"} panels started=1
P1b second press after a dev-server restart: PASS first press answered: no answer TypeError; panels started=2, open at once=1
P2a panel after its page went away: PASS panels still running 1 s after the connection closed=0
P2b panel whose page still waits, after 2 s: PASS panels running=1
P3a cancel reported as -128: FAIL answer=500 {"error":"failed"}
P3b cancel button, exit 0 with an empty line: PASS answer=200 {"ok":true,"paths":[]}
panels left running=0
exit=1
== probe h2
P1a one server, second press while open: PASS second=409 {"error":"busy"} panels started=1
P1b second press after a dev-server restart: PASS first press answered: 409 {"error":"busy"}; panels started=0, open at once=0
P2a panel after its page went away: PASS panels still running 1 s after the connection closed=0
P2b panel whose page still waits, after 2 s: FAIL panels running=0
P3a cancel reported as -128: FAIL answer=409 {"error":"busy"}
P3b cancel button, exit 0 with an empty line: FAIL answer=409 {"error":"busy"}
panels left running=0
exit=1
== probe h3
P1a one server, second press while open: PASS second=409 {"error":"busy"} panels started=1
P1b second press after a dev-server restart: FAIL first press answered: no answer TypeError; panels started=2, open at once=2
P2a panel after its page went away: FAIL panels still running 1 s after the connection closed=1
P2b panel whose page still waits, after 2 s: PASS panels running=1
P3a cancel reported as -128: FAIL answer=500 {"error":"failed"}
P3b cancel button, exit 0 with an empty line: PASS answer=200 {"ok":true,"paths":[]}
panels left running=0
exit=1
== probe h4
P1a one server, second press while open: PASS second=409 {"error":"busy"} panels started=1
P1b second press after a dev-server restart: FAIL first press answered: no answer TypeError; panels started=2, open at once=2
P2a panel after its page went away: FAIL panels still running 1 s after the connection closed=1
P2b panel whose page still waits, after 2 s: PASS panels running=1
P3a cancel reported as -128: PASS answer=200 {"ok":true,"paths":[]}
P3b cancel button, exit 0 with an empty line: PASS answer=200 {"ok":true,"paths":[]}
panels left running=0
exit=1
== probe h5
P1a one server, second press while open: PASS second=409 {"error":"busy"} panels started=1
P1b second press after a dev-server restart: FAIL first press answered: no answer TypeError; panels started=2, open at once=2
P2a panel after its page went away: FAIL panels still running 1 s after the connection closed=1
P2b panel whose page still waits, after 2 s: FAIL panels running=0
P3a cancel reported as -128: FAIL answer=500 {"error":"failed"}
P3b cancel button, exit 0 with an empty line: PASS answer=200 {"ok":true,"paths":[]}
panels left running=0
exit=1
== probe h2, P1b alone
P1b second press after a dev-server restart: PASS first press answered: no answer TypeError; panels started=1, open at once=1
panels left running=0
exit=0
== probe h2, P2a alone
P2a panel after its page went away: FAIL panels still running 1 s after the connection closed=1
panels left running=0
exit=1
```

Diff H1:

```diff
--- picker.orig.ts	2026-10-05 04:23:16
+++ probes/h1.ts	2026-10-05 04:26:17
@@ -16,6 +16,7 @@
 // with a non-zero status, and `{ error: 'busy' }`.
 
 import { execFile } from 'node:child_process';
+import type { Socket } from 'node:net';
 import { json } from '@sveltejs/kit';
 import { tokenedBody } from '../../core/auth.ts';
 
@@ -45,7 +46,7 @@
 export type PickRun = { code: number | null; out: string };
 
 /** Run the script and say what it printed, with no timeout: the panel waits for the reader. */
-export type PickRunner = (script: string) => Promise<PickRun>;
+export type PickRunner = (script: string, signal: AbortSignal) => Promise<PickRun>;
 
 /** Whether a panel is open now, held by one ServerContext. */
 export type PickerState = { open: boolean };
@@ -59,18 +60,19 @@
 export type PickDeps = {
     platform?: NodeJS.Platform;
     run?: PickRunner;
+    connection?: Pick<Socket, 'once' | 'off' | 'destroyed'>;
 };
 
 /** What every answer of this route carries besides its type: nothing of it is cached. */
 const NO_STORE = { 'cache-control': 'no-store' };
 
 /** The real runner: `osascript -l JavaScript -e <script>`. */
-const osascript: PickRunner = (script) =>
+const osascript: PickRunner = (script, signal) =>
     new Promise((resolve) => {
         execFile(
             'osascript',
             ['-l', 'JavaScript', '-e', script],
-            { encoding: 'utf8' },
+            { encoding: 'utf8', signal },
             (error, stdout) => {
                 const code = error === null ? 0 : typeof error.code === 'number' ? error.code : 1;
                 resolve({ code, out: stdout });
@@ -104,13 +106,18 @@
     }
     if (state.open) return json({ error: 'busy' }, { status: 409, headers: NO_STORE });
     state.open = true;
+    const gone = new AbortController();
+    const end = (): void => gone.abort();
+    deps.connection?.once('close', end);
+    if (deps.connection?.destroyed === true) end();
     try {
-        const done = await (deps.run ?? osascript)(PICKER_SCRIPT);
+        const done = await (deps.run ?? osascript)(PICKER_SCRIPT, gone.signal);
         if (done.code !== 0) return json({ error: 'failed' }, { status: 500, headers: NO_STORE });
         return json({ ok: true, paths: pathsOf(done.out) }, { headers: NO_STORE });
     } catch {
         return json({ error: 'failed' }, { status: 500, headers: NO_STORE });
     } finally {
+        deps.connection?.off('close', end);
         state.open = false;
     }
 }
```

Diff H2:

```diff
--- picker.orig.ts	2026-10-05 04:23:16
+++ probes/h2.ts	2026-10-05 04:26:17
@@ -61,6 +61,8 @@
     run?: PickRunner;
 };
 
+const PROCESS_PICKER: PickerState = { open: false };
+
 /** What every answer of this route carries besides its type: nothing of it is cached. */
 const NO_STORE = { 'cache-control': 'no-store' };
 
@@ -102,6 +104,7 @@
     if ((deps.platform ?? process.platform) !== 'darwin') {
         return json({ error: 'unsupported' }, { status: 400, headers: NO_STORE });
     }
+    state = PROCESS_PICKER;
     if (state.open) return json({ error: 'busy' }, { status: 409, headers: NO_STORE });
     state.open = true;
     try {
```

Diff H3:

```diff
--- picker.orig.ts	2026-10-05 04:23:16
+++ probes/h3.ts	2026-10-05 04:26:17
@@ -45,7 +45,7 @@
 export type PickRun = { code: number | null; out: string };
 
 /** Run the script and say what it printed, with no timeout: the panel waits for the reader. */
-export type PickRunner = (script: string) => Promise<PickRun>;
+export type PickRunner = (script: string, signal: AbortSignal) => Promise<PickRun>;
 
 /** Whether a panel is open now, held by one ServerContext. */
 export type PickerState = { open: boolean };
@@ -65,12 +65,12 @@
 const NO_STORE = { 'cache-control': 'no-store' };
 
 /** The real runner: `osascript -l JavaScript -e <script>`. */
-const osascript: PickRunner = (script) =>
+const osascript: PickRunner = (script, signal) =>
     new Promise((resolve) => {
         execFile(
             'osascript',
             ['-l', 'JavaScript', '-e', script],
-            { encoding: 'utf8' },
+            { encoding: 'utf8', signal },
             (error, stdout) => {
                 const code = error === null ? 0 : typeof error.code === 'number' ? error.code : 1;
                 resolve({ code, out: stdout });
@@ -105,7 +105,7 @@
     if (state.open) return json({ error: 'busy' }, { status: 409, headers: NO_STORE });
     state.open = true;
     try {
-        const done = await (deps.run ?? osascript)(PICKER_SCRIPT);
+        const done = await (deps.run ?? osascript)(PICKER_SCRIPT, request.signal);
         if (done.code !== 0) return json({ error: 'failed' }, { status: 500, headers: NO_STORE });
         return json({ ok: true, paths: pathsOf(done.out) }, { headers: NO_STORE });
     } catch {
```

Diff H4:

```diff
--- picker.orig.ts	2026-10-05 04:23:16
+++ probes/h4.ts	2026-10-05 04:26:17
@@ -42,7 +42,7 @@
 ].join('\n');
 
 /** What the script came to: its exit status, and what it printed. */
-export type PickRun = { code: number | null; out: string };
+export type PickRun = { code: number | null; out: string; err: string };
 
 /** Run the script and say what it printed, with no timeout: the panel waits for the reader. */
 export type PickRunner = (script: string) => Promise<PickRun>;
@@ -71,9 +71,9 @@
             'osascript',
             ['-l', 'JavaScript', '-e', script],
             { encoding: 'utf8' },
-            (error, stdout) => {
+            (error, stdout, stderr) => {
                 const code = error === null ? 0 : typeof error.code === 'number' ? error.code : 1;
-                resolve({ code, out: stdout });
+                resolve({ code, out: stdout, err: stderr });
             }
         );
     });
@@ -106,7 +106,7 @@
     state.open = true;
     try {
         const done = await (deps.run ?? osascript)(PICKER_SCRIPT);
-        if (done.code !== 0) return json({ error: 'failed' }, { status: 500, headers: NO_STORE });
+        if (done.code !== 0 && !/\(-128\)\s*$/.test(done.err)) return json({ error: 'failed' }, { status: 500, headers: NO_STORE });
         return json({ ok: true, paths: pathsOf(done.out) }, { headers: NO_STORE });
     } catch {
         return json({ error: 'failed' }, { status: 500, headers: NO_STORE });
```

Diff H5:

```diff
--- picker.orig.ts	2026-10-05 04:23:16
+++ probes/h5.ts	2026-10-05 04:26:17
@@ -70,7 +70,7 @@
         execFile(
             'osascript',
             ['-l', 'JavaScript', '-e', script],
-            { encoding: 'utf8' },
+            { encoding: 'utf8', timeout: 1500 },
             (error, stdout) => {
                 const code = error === null ? 0 : typeof error.code === 'number' ? error.code : 1;
                 resolve({ code, out: stdout });
```

The `getRequest` probe for hypothesis 3 (`$tmp/sig.mjs`: an http server that reads the body through Kit's `getRequest`, a client that aborts after 300 ms):

```
$ OC=$tmp/tree/tools/oculus node --no-warnings sig.mjs
socket closed; request.signal.aborted=false
```

## Cause

Parts one and two, the second panel and the panel that lives for hours: hypothesis 1. The osascript a press starts is ended only by the reader's answer. Nothing ends it when the request's connection closes or when the ServerContext that started it closes. Under `vite dev`, which is what serves 8790, a change to any of the 159 files the Vite config imports restarts the dev server in the same process: Vite destroys every open socket (the page's pending press among them) and builds a new ServerContext whose `pickerState()` says no panel is open. The old osascript keeps running as a child of the same node process with nobody waiting for its answer (pid 42763, six hours), and the page's next press reaches the new context and opens a second panel. With one context and no restart the busy refusal holds (P1a PASS on main). The probe: with diff H1, P1b and P2a are green; without it they are red (red runs 1 to 3).

Part three, the cancel said as a failure: hypothesis 4, for a cancel osascript reports as a user cancel. The server reads only the exit status, so exit 1 with "User canceled. (-128)" is answered `{ error: 'failed' }`, which the client says as `files.picker_failed`, "The folder panel could not be opened." (`config/text/views/sources/files.yml:147`, `state/sources/explorer/acts/folders.ts:29-34` and `:77-83`). The probe: with diff H4, P3a is green; without it, red. A press of the panel's Cancel button is answered `{ ok: true, paths: [] }` at main's head already (P3b PASS: `NSOpenPanel.runModal` answers NSModalResponseCancel, 0, and the script prints an empty line and exits 0), and Add Folder to Workspace then writes an empty note (`views/shared/explorer/rooted-tree.svelte.ts:171`, `addedLine` at `folders.ts:99-104`), which clears the line. So the line after a cancel needs osascript to have exited non-zero. Not verified: which cancel the look took, since no real panel was opened. What would settle it: one Cancel press on a real panel with the run's exit status and stderr recorded.

A finding beside the symptom, not a cause of it: after a restart the page's pending press gets no answer (P1b prints `first press answered: no answer TypeError` with and without the fix), which the client says as `files.picker_network`, "The server could not be reached." With the fix that line and the panel agree: the panel closes at the same moment.

## Fix and test

Test, `tests/server/files/picker.test.ts` in the scratch copy, the diff against main's head:

```diff
diff --git a/tools/oculus/tests/server/files/picker.test.ts b/tools/oculus/tests/server/files/picker.test.ts
index 6a60dc381..49e203102 100644
--- a/tools/oculus/tests/server/files/picker.test.ts
+++ b/tools/oculus/tests/server/files/picker.test.ts
@@ -1,12 +1,16 @@
 // Layer 4, server test. POST /api/folders/pick with a runner standing in for the folder panel
-// (server/files/fs/picker.ts): a missing token. No test opens a panel: the runner is always the
-// test's own.
+// (server/files/fs/picker.ts): a missing token, the panel ended when the request's connection
+// closes or its server closes, and a cancel osascript reports as error -128. No test opens a panel:
+// the runner is always the test's own.
 
+import { EventEmitter } from 'node:events';
 import { describe, expect, it } from 'vitest';
 import { TOKEN_HEADER } from '../../../src/lib/server/core/auth.ts';
 import {
+    closePicker,
     handlePick,
     pickerState,
+    type PickConnection,
     type PickRunner
 } from '../../../src/lib/server/files/fs/picker.ts';
 
@@ -19,6 +23,7 @@ async function pick(
         state?: ReturnType<typeof pickerState>;
         platform?: NodeJS.Platform;
         token?: boolean;
+        connection?: PickConnection;
     } = {}
 ) {
     const headers: Record<string, string> = { 'content-type': 'application/json' };
@@ -30,7 +35,8 @@ async function pick(
     });
     const response = await handlePick(request, TOKEN, over.state ?? pickerState(), {
         platform: over.platform ?? 'darwin',
-        run: runner
+        run: runner,
+        connection: over.connection
     });
     return {
         status: response.status,
@@ -40,9 +46,42 @@ async function pick(
 }
 
 const printing =
-    (out: string, code = 0): PickRunner =>
+    (out: string, code = 0, err = ''): PickRunner =>
     () =>
-        Promise.resolve({ code, out });
+        Promise.resolve({ code, out, err });
+
+/**
+ * A panel the reader never answers: it runs until its signal aborts, then exits as killed, and with
+ * a signal aborted already it never runs, as execFile does.
+ */
+function waiting() {
+    const panel = { started: false, ended: false };
+    const runner: PickRunner = (_script, signal) =>
+        new Promise((resolve) => {
+            const kill = (): void => {
+                panel.ended = true;
+                resolve({ code: null, out: '', err: '' });
+            };
+            if (signal.aborted) {
+                kill();
+                return;
+            }
+            panel.started = true;
+            signal.addEventListener('abort', kill);
+        });
+    return { panel, runner };
+}
+
+/** Whether `answer` settles before the event loop's next turn. */
+function settledNow(answer: Promise<unknown>): Promise<string> {
+    return Promise.race([
+        answer.then(() => 'answered'),
+        new Promise<string>((resolve) => setImmediate(() => resolve('still open')))
+    ]);
+}
+
+/** Let the handler read the body and start the runner. */
+const started = () => new Promise((resolve) => setImmediate(resolve));
 
 describe('the folder panel route', () => {
     it('refuses a request without the token with a 403, before it runs anything', async () => {
@@ -50,4 +89,53 @@ describe('the folder panel route', () => {
         expect(answer.status).toBe(403);
         expect(answer.headers.get('cache-control')).toBe('no-store');
     });
+
+    it('ends the panel when the connection the request came on closes, and a new press opens one', async () => {
+        const state = pickerState();
+        const connection = Object.assign(new EventEmitter(), { destroyed: false });
+        const { panel, runner } = waiting();
+        const answer = pick(runner, { state, connection });
+        await started();
+        expect(panel.started).toBe(true);
+        connection.emit('close');
+        expect(await settledNow(answer)).toBe('answered');
+        expect(panel.ended).toBe(true);
+        expect(connection.listenerCount('close')).toBe(0);
+        const again = await pick(printing('/a\n'), { state });
+        expect(again).toMatchObject({ status: 200, body: { ok: true, paths: ['/a'] } });
+    });
+
+    it('never opens the panel when the connection closed before it would open', async () => {
+        const connection = Object.assign(new EventEmitter(), { destroyed: true });
+        const { panel, runner } = waiting();
+        const answer = pick(runner, { connection });
+        await started();
+        expect(await settledNow(answer)).toBe('answered');
+        expect(panel).toEqual({ started: false, ended: true });
+        expect(connection.listenerCount('close')).toBe(0);
+    });
+
+    it('ends the open panel when its server closes', async () => {
+        const state = pickerState();
+        const { panel, runner } = waiting();
+        const answer = pick(runner, { state });
+        await started();
+        closePicker(state);
+        expect(await settledNow(answer)).toBe('answered');
+        expect(panel.ended).toBe(true);
+    });
+
+    it('answers a panel the reader cancelled, which osascript reports as error -128, as no folders', async () => {
+        const answer = await pick(
+            printing('', 1, 'execution error: Error: User canceled. (-128)\n')
+        );
+        expect(answer).toMatchObject({ status: 200, body: { ok: true, paths: [] } });
+    });
+
+    it('answers any other non-zero exit as failed', async () => {
+        const answer = await pick(
+            printing('', 1, 'execution error: Error: Not allowed. (-1743)\n')
+        );
+        expect(answer).toMatchObject({ status: 500, body: { error: 'failed' } });
+    });
 });
```

Run on the tree without the fix (`git apply -R $tmp/fix.diff` in the scratch copy, then `cmp src/lib/server/files/fs/picker.ts $tmp/picker.orig.ts` printed nothing):

```
$ cd $tmp/tree/tools/oculus && HOME=$tmp/home PATH=$tmp/bin:$PATH npx vitest run tests/server/files/picker.test.ts --reporter=verbose
 ok |unit| tests/server/files/picker.test.ts > the folder panel route > refuses a request without the token with a 403, before it runs anything 14ms
 x |unit| tests/server/files/picker.test.ts > the folder panel route > ends the panel when the connection the request came on closes, and a new press opens one 5ms
 x |unit| tests/server/files/picker.test.ts > the folder panel route > never opens the panel when the connection closed before it would open 2ms
 x |unit| tests/server/files/picker.test.ts > the folder panel route > ends the open panel when its server closes 1ms
 x |unit| tests/server/files/picker.test.ts > the folder panel route > answers a panel the reader cancelled, which osascript reports as error -128, as no folders 3ms
 ok |unit| tests/server/files/picker.test.ts > the folder panel route > answers any other non-zero exit as failed 0ms
------- Failed Tests 4 -------
AssertionError: expected false to be true // Object.is equality
 > tests/server/files/picker.test.ts:99:31
AssertionError: expected { started: false, ended: false } to deeply equal { started: false, ended: true }
 > tests/server/files/picker.test.ts:114:23
TypeError: closePicker is not a function
 > tests/server/files/picker.test.ts:123:9
AssertionError: expected { status: 500, ...(2) } to match object { status: 200, ...(1) }
 > tests/server/files/picker.test.ts:132:24
 Test Files  1 failed (1)
      Tests  4 failed | 2 passed (6)
```

The four failures show the symptom: the run is not ended when the connection closes (line 99) or when the connection was gone before the run (line 114), the server has no way to end its panel when it closes (line 123), and a -128 cancel is answered 500 `failed` (line 132). The red runs spawn nothing: every test hands in its own runner, and the fake's log stayed empty.

Fix, three files at main's head `6dd4684a4`: `tools/oculus/src/lib/server/files/fs/picker.ts` (head comment :9-16, `PickRun` :45, `PickRunner` :48, `PickerState` and `pickerState` :50-56, `PickDeps` :58-62, `osascript` :67-79, a new `cancelled` before `pathsOf` :81, `handlePick` :105-115), `tools/oculus/src/lib/server/root/context.ts` (:59, :135, `close()` :471-489) and `tools/oculus/src/routes/api/(files)/folders/pick/+server.ts` (:1-10):

```diff
diff --git a/tools/oculus/src/lib/server/files/fs/picker.ts b/tools/oculus/src/lib/server/files/fs/picker.ts
index 5c08ef79b..80ebdd5ea 100644
--- a/tools/oculus/src/lib/server/files/fs/picker.ts
+++ b/tools/oculus/src/lib/server/files/fs/picker.ts
@@ -8,12 +8,17 @@
 //
 // The subprocess is one injectable runner, so a test hands in one that prints what a panel would
 // and no test opens a panel. One panel is open at a time: a request that arrives while one is open
-// is answered `busy`, since a second window over the first would answer to nobody. The open state
-// is a field of the ServerContext, so two servers in one process hold two panels.
+// is answered `busy`, since a second window over the first would answer to nobody. The open panel
+// is a field of the ServerContext, so two servers in one process hold two panels. A panel lives
+// only while someone waits for its answer: it is ended when the connection its request came on
+// closes (the page went away, or a restart of Vite destroyed the connection) and when its
+// ServerContext closes, so no panel outlives the server that opened it and a new server never opens
+// a second panel over one nobody waits for.
 //
 // The answers, each with no-store headers: `{ ok: true, paths }` (an empty list when the panel was
-// cancelled), `{ error: 'unsupported' }` off macOS, `{ error: 'failed' }` when the script exits
-// with a non-zero status, and `{ error: 'busy' }`.
+// cancelled, by its Cancel button or by the user cancel osascript reports as error -128), `{ error:
+// 'unsupported' }` off macOS, `{ error: 'failed' }` when the script exits with any other non-zero
+// status, and `{ error: 'busy' }`.
 
 import { execFile } from 'node:child_process';
 import { json } from '@sveltejs/kit';
@@ -41,43 +46,67 @@ export const PICKER_SCRIPT = [
     "chosen.join('\\n');"
 ].join('\n');
 
-/** What the script came to: its exit status, and what it printed. */
-export type PickRun = { code: number | null; out: string };
+/** What the script came to: its exit status, what it printed, and what it said on stderr. */
+export type PickRun = { code: number | null; out: string; err: string };
 
-/** Run the script and say what it printed, with no timeout: the panel waits for the reader. */
-export type PickRunner = (script: string) => Promise<PickRun>;
+/**
+ * Run the script and say what it printed, with no timeout: the panel waits for the reader, and is
+ * ended when `signal` aborts.
+ */
+export type PickRunner = (script: string, signal: AbortSignal) => Promise<PickRun>;
 
-/** Whether a panel is open now, held by one ServerContext. */
-export type PickerState = { open: boolean };
+/** The panel open now, held by one ServerContext: what ends it, or null with no panel open. */
+export type PickerState = { panel: AbortController | null };
 
 /** A state with no panel open, for a ServerContext being built. */
 export function pickerState(): PickerState {
-    return { open: false };
+    return { panel: null };
 }
 
-/** The two calls a test replaces: the platform the server runs on, and the script's runner. */
+/** End the panel open now, for a ServerContext that closes. */
+export function closePicker(state: PickerState): void {
+    state.panel?.abort();
+}
+
+/** The connection a request came on, as much of a node Socket as the route reads. */
+export type PickConnection = {
+    destroyed: boolean;
+    once(event: 'close', listener: () => void): unknown;
+    off(event: 'close', listener: () => void): unknown;
+};
+
+/**
+ * The two calls a test replaces, the platform the server runs on and the script's runner, and the
+ * connection the request came on, whose close ends the panel.
+ */
 export type PickDeps = {
     platform?: NodeJS.Platform;
     run?: PickRunner;
+    connection?: PickConnection;
 };
 
 /** What every answer of this route carries besides its type: nothing of it is cached. */
 const NO_STORE = { 'cache-control': 'no-store' };
 
-/** The real runner: `osascript -l JavaScript -e <script>`. */
-const osascript: PickRunner = (script) =>
+/** The real runner: `osascript -l JavaScript -e <script>`, killed when `signal` aborts. */
+const osascript: PickRunner = (script, signal) =>
     new Promise((resolve) => {
         execFile(
             'osascript',
             ['-l', 'JavaScript', '-e', script],
-            { encoding: 'utf8' },
-            (error, stdout) => {
+            { encoding: 'utf8', signal },
+            (error, stdout, stderr) => {
                 const code = error === null ? 0 : typeof error.code === 'number' ? error.code : 1;
-                resolve({ code, out: stdout });
+                resolve({ code, out: stdout, err: stderr });
             }
         );
     });
 
+/** Whether osascript ended the run as cancelled by the reader: error -128, "User canceled." */
+function cancelled(run: PickRun): boolean {
+    return run.code !== 0 && /\(-128\)\s*$/.test(run.err);
+}
+
 /** The paths a run printed, one a line, the empty lines dropped. */
 function pathsOf(out: string): string[] {
     return out.split('\n').filter((line) => line.trim() !== '');
@@ -102,15 +131,21 @@ export async function handlePick(
     if ((deps.platform ?? process.platform) !== 'darwin') {
         return json({ error: 'unsupported' }, { status: 400, headers: NO_STORE });
     }
-    if (state.open) return json({ error: 'busy' }, { status: 409, headers: NO_STORE });
-    state.open = true;
+    if (state.panel !== null) return json({ error: 'busy' }, { status: 409, headers: NO_STORE });
+    const panel = new AbortController();
+    state.panel = panel;
+    const end = (): void => panel.abort();
+    deps.connection?.once('close', end);
+    if (deps.connection?.destroyed === true) end();
     try {
-        const done = await (deps.run ?? osascript)(PICKER_SCRIPT);
+        const done = await (deps.run ?? osascript)(PICKER_SCRIPT, panel.signal);
+        if (cancelled(done)) return json({ ok: true, paths: [] }, { headers: NO_STORE });
         if (done.code !== 0) return json({ error: 'failed' }, { status: 500, headers: NO_STORE });
         return json({ ok: true, paths: pathsOf(done.out) }, { headers: NO_STORE });
     } catch {
         return json({ error: 'failed' }, { status: 500, headers: NO_STORE });
     } finally {
-        state.open = false;
+        deps.connection?.off('close', end);
+        state.panel = null;
     }
 }
diff --git a/tools/oculus/src/lib/server/root/context.ts b/tools/oculus/src/lib/server/root/context.ts
index 2e81524db..5baef6bcd 100644
--- a/tools/oculus/src/lib/server/root/context.ts
+++ b/tools/oculus/src/lib/server/root/context.ts
@@ -56,7 +56,7 @@ import type { LogPaths } from '../machine/hpc/actions.ts';
 import type { Plan } from '../git/deposit.ts';
 import { defaultBookmarksPath } from '../files/fs/bookmarks.ts';
 import { defaultWorkspacesPath, ignoredCache, type IgnoredCache } from '../files/fs.ts';
-import { pickerState, type PickerState } from '../files/fs/picker.ts';
+import { closePicker, pickerState, type PickerState } from '../files/fs/picker.ts';
 import { fsWrites, type FsWrites } from '../core/json.ts';
 import { memoriesMemory, type MemoriesMemory } from '../content/memories.ts';
 import { browserRoots, repositoryRoots } from '../files/roots.ts';
@@ -132,7 +132,7 @@ export type ServerContext = {
     opsWrites: FsWrites;
     /** The ignored names the file browser's listings asked git for lately. */
     ignoredCache: IgnoredCache;
-    /** Whether the folder panel is open, so a second request while it is open is answered busy. */
+    /** The folder panel open now, so a second request while it is open is answered busy. */
     folderPicker: PickerState;
     /** The log path found per HPC job id. */
     hpcLogPaths: LogPaths;
@@ -486,6 +486,7 @@ export function createServerContext(
             held.sessions.close();
             held.portfolio.close();
             terminals.close();
+            closePicker(context.folderPicker);
         }
     };
 
diff --git a/tools/oculus/src/routes/api/(files)/folders/pick/+server.ts b/tools/oculus/src/routes/api/(files)/folders/pick/+server.ts
index d1142a88c..a2c49cf48 100644
--- a/tools/oculus/src/routes/api/(files)/folders/pick/+server.ts
+++ b/tools/oculus/src/routes/api/(files)/folders/pick/+server.ts
@@ -1,10 +1,13 @@
 // Layer 2, server route. The folder panel of the Files view. A route module may export only its
 // verbs, so everything the request does is in lib/server/files/fs/picker.ts and this is the line
-// that joins Kit's request, the process token and the panel's open state to it. The POST opens
-// macOS's folder panel and answers the folders the reader chose; it lists and serves nothing.
+// that joins Kit's request, the process token, the panel's open state and the request's connection
+// to it. The POST opens macOS's folder panel and answers the folders the reader chose; it lists and
+// serves nothing.
 
 import { handlePick } from '$lib/server/files/fs/picker';
 import type { RequestHandler } from './$types';
 
-export const POST: RequestHandler = ({ request, locals }) =>
-    handlePick(request, locals.token, locals.server.folderPicker);
+export const POST: RequestHandler = ({ request, locals, platform }) =>
+    handlePick(request, locals.token, locals.server.folderPicker, {
+        connection: platform?.req.socket
+    });
```

Runs after the fix:

```
$ cd $tmp/tree/tools/oculus && HOME=$tmp/home PATH=$tmp/bin:$PATH npx vitest run tests/server/files/picker.test.ts --reporter=verbose
 ok |unit| tests/server/files/picker.test.ts > the folder panel route > refuses a request without the token with a 403, before it runs anything 13ms
 ok |unit| tests/server/files/picker.test.ts > the folder panel route > ends the panel when the connection the request came on closes, and a new press opens one 2ms
 ok |unit| tests/server/files/picker.test.ts > the folder panel route > never opens the panel when the connection closed before it would open 0ms
 ok |unit| tests/server/files/picker.test.ts > the folder panel route > ends the open panel when its server closes 1ms
 ok |unit| tests/server/files/picker.test.ts > the folder panel route > answers a panel the reader cancelled, which osascript reports as error -128, as no folders 1ms
 ok |unit| tests/server/files/picker.test.ts > the folder panel route > answers any other non-zero exit as failed 0ms
 Test Files  1 passed (1)
      Tests  6 passed (6)
$ $tmp/red.sh
P1a one server, second press while open: PASS second=409 {"error":"busy"} panels started=1
P1b second press after a dev-server restart: PASS first press answered: no answer TypeError; panels started=2, open at once=1
P2a panel after its page went away: PASS panels still running 1 s after the connection closed=0
P2b panel whose page still waits, after 2 s: PASS panels running=1
P3a cancel reported as -128: PASS answer=200 {"ok":true,"paths":[]}
P3b cancel button, exit 0 with an empty line: PASS answer=200 {"ok":true,"paths":[]}
panels left running=0
exit=0
```

Checks over the fixed scratch copy:

```
$ HOME=$tmp/home npx svelte-check --tsconfig ./tsconfig.json --threshold error --output machine | grep COMPLETED
1791168080597 COMPLETED 2776 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ HOME=$tmp/home npx eslint src/lib/server/files/fs/picker.ts "src/routes/api/(files)/folders/pick/+server.ts" src/lib/server/root/context.ts tests/server/files/picker.test.ts; echo eslint=$?
eslint=0
$ HOME=$tmp/home npx prettier --check <the same four files>
All matched files use Prettier code style!
$ HOME=$tmp/home PATH=$tmp/bin:$PATH npx vitest run --tagsFilter '!slow' tests/server tests/routes
 Test Files  49 passed | 16 skipped (65)
      Tests  126 passed | 58 skipped (184)
$ HOME=$tmp/home npx vitest run tests/checks/source --testTimeout 0
 Test Files  4 passed (4)
      Tests  32 passed (32)
```

How `execFile` treats a signal that aborted before the run, which the test's runner copies (`$tmp/bin` first on PATH, fake mode `sleep`):

```
execFile with an already aborted signal: AbortError after 3 ms
fake starts: 0
no fake running
```

The original, unshrunk case is a real `vite dev` restarted while a press waits. It was not run: starting a dev server from the scratch copy on its own port was refused by the permission system. The red command stands in for it with Kit's own request and response functions and Vite's socket handling, and the Vite restart path is shown by Vite's code and its config dependency list above, not by a run.

What the fix leaves as it was, each stated so the builder carries it: a run ended by its connection or its server answers `{ error: 'failed' }` to a connection that is gone or a server that is closing, which no page reads as a result of its own press; the panel still has no time limit, by `picker.ts:47`, and P2b holds it; and the client half (D17: the busy state while a press is out, and a cancel that says nothing) is unchanged.

No test reaches it: the Vite restart itself (a change to a config dependency rebuilding the ServerContext in one process) is not reached by a test; the test reaches the defect at `handlePick`, where the panel's run is tied to its connection and its ServerContext. No test is written: not applicable.

## Cleanup

No probe added logging, so this diagnosis has no tag. The grep for any `DIAG-` tag over the scratch copy, run before its removal, hit only the ledger's committed records of other diagnoses, none in code:

```
$ grep -rn --exclude=local.yml --exclude-dir=node_modules "DIAG-" $tmp/tree | grep -v "\.scratch/"
$
```

The symbolic link `$tmp/tree/tools/oculus/node_modules` removed with `rm` (the main checkout's `tools/oculus/node_modules` still lists 306 entries), the scratch copy removed with `git worktree remove --force "$tmp/tree"` from the main checkout (exit 0, and `git worktree list | grep -c EGuQFs` printed 0), and `$tmp` with every throwaway file in it (the fake, `red.sh`, `red.mjs`, `shrink.mjs`, `sig.mjs`, the probe copies and the saved outputs) removed with `rm -rf`. No credential or `.env` file was copied. `pgrep -fl osascript` printed nothing (exit 1). The red command run again on the original case: left to the orchestrator, who carries the fix and its test into the brief; the harness and the fake are quoted whole under "Red command", so it can be rebuilt.
