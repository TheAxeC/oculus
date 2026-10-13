# Diagnosis: an app debugger's paused session never shows on the page

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. A diagnosis of the same step later is appended below under its own heading at the level of the title above, `# Diagnosis: <the symptom in a few words>`, which names its finding or quotes its part.

Diagnosis agent: ae6afdb9bb471f3bb, ordo-high, served claude-opus-5-5; 267,969 tokens, 101 tool uses, 20.9 min.

## Symptom

"In oculus with D64 staged on main (tools/oculus), an app that contributes a debugger (type `notes.dbg`, languages [notes], an initialConfigurations entry `{ type: notes.dbg, request: launch, name: "Run note", program: "${file}", stopOnEntry: true }`, its host registering a DebugAdapterExecutable factory) is started from the Debug view's Start with a .note file open. The adapter is started and its message log shows initialize, launch (stopOnEntry true, name "Run note"), configurationDone, then stackTrace (threadId 1), scopes (frameId 1) and variables (variablesReference 1): the server got the adapter's `stopped` event and fetched the frame. The adapter process keeps running. But the page never shows the session: the Debug view keeps "The program is not paused" under Variables and Call Stack, no debug item appears in the status bar, the editor is not opened at the paused line, and a page reload shows the same."

Parts the red command must assert, as the orchestrator gave them: (A) the server holds a session paused on entry for the app adapter; (B) the page-facing state (what the `debug` channel publishes, or what GET /api/debug answers) does not show that session as paused with its frame; (C) a reload (a fresh read of the state) shows the same.

## Where the probes run

The scratch copy `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.X110uN/tree`, a detached worktree at main's HEAD `f6fdc112e` with main's staged D64 change and the landing's unstaged fixes applied, made by the orchestrator; `tools/oculus/node_modules` is a symlink to the main checkout's. Every test ran from `tools/oculus` there with `export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. The test's red run on the unchanged tree was made in a copy of that `tools/oculus` (`rsync -a --exclude node_modules --exclude local.yml --exclude .svelte-kit`) under the session scratchpad, with `payloads.ts` the file as it stands (`cmp` against `.agents/worktrees/D64/tools/oculus/src/lib/state/client/shapes/payloads.ts`: equal), removed afterwards. Main's `payloads.ts` equals the step worktree's (`cmp` printed nothing). The paths redirected under `$TMPDIR`: none; every folder the tests make comes from `tests/fixtures/scratch.ts` under the system temporary directory.

## Red command

```
npx vitest run tests/server/machine/apps/tools/debug-page.test.ts --reporter=verbose
```

The file was a scratch test (removed at cleanup; its three assertions are case 1 of the test below, which is the round's check). It plants the app `notes` of `tests/server/machine/apps/world/debug-app.ts` (executable descriptor, the look's capabilities `supportsConfigurationDoneRequest`, `supportsConditionalBreakpoints`, `supportsTerminateRequest`) in `world(..., { real: true })`, builds a `DebugClient` over a `Hub` the way `src/lib/server/root/context.ts:316-320` and `:499-507` do, starts the session as the page's Start posts it (`startSession` with `name: null` and the initial configuration given whole, `src/lib/state/system/machine/debug/debug.svelte.ts:495-507`, `debug-file.ts:128`), waits for `variables` in the adapter's log and for `client.state().status === 'paused'`, then with `expect.soft` so each part prints:
- A: `client.state()` is paused with frames `['main']`, variables `x=1`, adapter `notes.dbg`.
- B: `hub.latest('debug')` read as the page reads it: `payloadShapes.debug.safeParse(payload)`, the check `handle` makes at `src/lib/state/client/socket.svelte.ts:427-428` before anything on the page sees the frame, and that `entities.payloadOf` makes again at `src/lib/state/client/entities.svelte.ts:56` for `heard` at `debug.svelte.ts:300`.
- C: a new sink subscribed to `debug` (a reload: `Hub.subscribe` replays `#latest`, `src/lib/server/core/channels.ts:116-121`) and the message it is handed, read the same way.

GET /api/debug answers configurations or the console, never the state (`src/lib/server/machine/debug/routes.ts:140-141`, `src/routes/api/(machine)/debug/+server.ts`), so the page-facing state is the channel's message.

Runs, with the output of each quoted:

```
run 1:
DIAG-7c41 parts {"started":{"ok":true},"server":{"status":"paused","frames":["main"],"scopes":[["x=1"]],"adapter":{"type":"notes.dbg","label":"Notes Debug","app":"app:notes"}},"latest":{"dropped":[["declared.rite.pause","Invalid input: expected boolean, received undefined"],["declared.notes.dbg.pause","Invalid input: expected boolean, received undefined"]]},"handed":{"dropped":[["declared.rite.pause","Invalid input: expected boolean, received undefined"],["declared.notes.dbg.pause","Invalid input: expected boolean, received undefined"]]}}
 x |unit| ... shows the session paused on entry with its frame, and hands the same to a page that subscribes again 137ms
AssertionError: B: the debug channel publishes the session paused with its frame: expected { dropped: [ [ ...(2) ], [ ...(2) ] ] } to deeply equal { status: 'paused', ...(3) }
AssertionError: C: a page that subscribes again is handed the same: expected { dropped: [ [ ...(2) ], [ ...(2) ] ] } to deeply equal { status: 'paused', ...(3) }
      Tests  1 failed (1)
run 2: the same parts line, x 142ms, the same two AssertionErrors, Tests 1 failed (1)
run 3: the same parts line, x 125ms, the same two AssertionErrors, Tests 1 failed (1)
```

Parts of the reported symptom, with whether the red command catches each:

| Part of the symptom | Caught by the red command | Lines read, for a part not caught | Reproduced |
|---|---|---|---|
| A: the server holds a session paused on entry and fetched the frame | yes; assertion A holds on all three runs (`"server":{"status":"paused","frames":["main"],...}`), as the symptom says | not applicable | yes |
| B: the page-facing state does not show the session paused with its frame | yes; assertion B red on all three runs (`dropped: declared.rite.pause, declared.notes.dbg.pause`) | not applicable | yes, caught |
| C: a reload shows the same | yes; assertion C red on all three runs | not applicable | yes, caught |
| "the Debug view keeps 'The program is not paused'" | no assertion | `socket.svelte.ts:427-428` returns before `entities.receive`, so `messages['debug']` is never set; `debug.svelte.ts:216-219` `payload = entities.debug() ?? IDLE`, `paused()` false | yes, produced on the path B drives |
| "no debug item appears in the status bar" | no assertion | `StatusBar.svelte:136,234` draw on `debug.ran()`, which is `payload().session !== null` (`debug.svelte.ts:836`), null for `IDLE` | yes, produced on that path |
| "the editor is not opened at the paused line" | no assertion | `heard` (`debug.svelte.ts:303-316`) opens the top frame through `openServed`; it returns at `if (next === null) return` since `payloadOf` answers null for the refused payload (`entities.svelte.ts:56`, `shapes.ts:205-208`) | yes, produced on that path |

Runs after the tightening: none needed; each run takes about 130 ms of test time, 2.2 s whole.

## No red command

not applicable

## Shrunk case

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| The two extra capabilities (`supportsConditionalBreakpoints`, `supportsTerminateRequest`) | red: B and C `dropped: declared.rite.pause, declared.notes.dbg.pause` | cut |
| The configuration given whole (a `launch.yml` entry `run` started by name instead) | red, same lines | cut |
| The adapter process (inline descriptor instead of executable) | red, same lines | cut |
| `stopOnEntry` | A turns red (`"server":{"status":"running","frames":[]...}`), B and C still dropped for the same two fields | put back: without it the server holds no paused session, which is the case reported |
| The app and the session (a bare `DebugClient`'s `state()` through the page schema) | refused for `declared.rite.pause`; nothing is published while idle, so this is not the reported case | put back |

The shrunk case, as it stands: a `DebugClient` over a `Hub`, an app debugger session paused on entry (any descriptor, any start path), and the page's schema read of the channel's message. The schema refusal itself needs only the client's `declared` map, which holds `rite` from construction (`src/lib/server/machine/debug/session.ts:124`).

## Hypotheses

1. If the page's schema of the `debug` channel requires `declared[type].pause` as a boolean (`src/lib/state/client/shapes/payloads.ts:207`), a field the data model's `DebugCapabilities` (`src/lib/data/model/machine/model-debug.ts:94-112`) does not declare and the server never writes, so the socket drops every `debug` frame, then removing `pause: z.boolean()` from that schema turns B and C green. Falsified by: B or C still red with that change, or the refusal naming another field.
2. If the server's capabilities are what is short, each type's entry needing a `pause` field because Pause is offered to every adapter, then adding `pause: true` in `shown()` (`src/lib/server/machine/debug/app/capabilities.ts:86-90`) turns B and C green. Falsified by: B or C still red with that change.

Fewer than three: the red output's refusal lists exactly two issues, both `declared.<type>.pause`, and every other field of the schema (`payloads.ts:131-228`) matches `DebugPayload` and its nested types (`model-debug.ts:9-151`) field by field, so no third cause is live on the page's read. A cause on the server side that publishes before the frames are fetched is falsified by run 1: the message itself holds `frames ["main"]` and `x=1`.

The reply to the hypotheses, or "none, no person present": none, no person present.

The second list, when every hypothesis was falsified, in the same form: not needed.

## Probes

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 1 | `src/lib/state/client/shapes/payloads.ts`: `-            pause: z.boolean(),` (line 207) | `DIAG-7c41 parts {"started":{"ok":true},"server":{"status":"paused",...},"latest":{"status":"paused","frames":["main"],"scopes":[["x=1"]],...},"handed":{"status":"paused","frames":["main"],"scopes":[["x=1"]],...}}` / `v ... 127ms` / `Tests 1 passed (1)` | still standing |
| 2 | `capabilities.ts` `shown()`: `return { pause: true, ...Object.fromEntries(Object.entries(declared).filter(([key]) => key !== 'configurationDone')) } as unknown as DebugCapabilities;` | the same parts line with B and C paused / `v ... 183ms` / `Tests 1 passed (1)` | still standing, set aside (Cause) |

Each change was undone by copying back the saved original; `cmp` of `capabilities.ts` against the step worktree's printed nothing, and `grep -c "pause: z.boolean()"` on `payloads.ts` printed 1 before the fix.

## Cause

The page refuses every message of the `debug` channel. The operation is the schema check of a `debug` frame: `shape.safeParse(message.payload)` at `src/lib/state/client/socket.svelte.ts:427-428` (and `readAs(payloadShapes.debug, ...)` at `src/lib/state/client/entities.svelte.ts:56`, which `heard` at `debug.svelte.ts:300` uses), with `payloadShapes.debug` (`payloads.ts:131`), whose `declared` record value requires `pause: z.boolean()` (`payloads.ts:207`). The data model's `DebugCapabilities` has no `pause` (`model-debug.ts:94-112`), and the server builds every `declared` entry as that type: `RITE_CAPABILITIES` (`capabilities.ts:41-55`) and `declaredBy` (`capabilities.ts:59-82`), both through `shown` (`capabilities.ts:86-90`), held at `session.ts:124` and `:391` and published at `session.ts:178,198`. Since `declared.rite` is in the map from the client's construction, every state the client publishes, for every adapter and status, is dropped before the page reads it, and a reload is handed the same refused message. The annotation `z.ZodType<Payloads['debug']>` at `payloads.ts:131` lets a schema with an extra required field type-check, which is why `svelte-check` did not refuse it, and the page tests feed `declared: {}` straight to `entities.receive` (`tests/shell/commands/debug/debug-toolbar.test.ts:37-53,64`), past the socket's check.

Probe 1 shows it: the red command is green with the line removed and red without it. Hypothesis 2 also turned the red command green; it is set aside because `pause` is a field of no type in the data model, no reader on the page or the server reads `declared[type].pause` (the page's Pause is offered to every adapter, `debug-adapter.svelte.ts:120-121`; `grep -rn "declared" src/lib/state src/lib/views src/lib/shell` shows no reader of it), and its change needs the cast `as unknown as DebugCapabilities` to write it. Each other input and each place written as not fixed: none.

## Operation and other inputs

The operation that goes wrong: the page's schema check of a `debug` payload, `socket.svelte.ts:427-428` and `entities.svelte.ts:56`, against `payloads.ts:131-228`, which requires `declared[*].pause` (`payloads.ts:207`).

The rule, stated at the kind of value: a channel's payload is read on the page by a schema that requires exactly the fields the data model's type of that payload declares, so every payload the server builds as that type is accepted, whatever its adapter, status or declared capabilities.

Places of the defect:

1. `src/lib/state/client/shapes/payloads.ts:207`: the `declared` value object requires `pause`, which `DebugCapabilities` does not declare.
2. none further: every other field of `debugShape` matches `DebugPayload` (`model-debug.ts:9-151`); the console append schema `debugAppendShape` (`src/lib/data/shapes/shapes.ts:309-313`) matches `DebugConsoleAppend` (`model-debug.ts:177`); `grep -rn "payloadShapes.debug\|payloadOf(.*'debug')" src` finds only `debug.svelte.ts:300`, which uses the same schema.

| Other input | Why it reaches a place of the defect | Right result | Place at which it is wrong | Result on the tree without the fix | Result with the change of the probe that shows the cause | Class | Result after the fix |
|---|---|---|---|---|---|---|---|
| An app debugger that declares every capability, paused on entry | `declaredBy` writes its entry (`capabilities.ts:59-82`) | accepted; paused, frames `main`, `x=1`, adapter `notes.dbg` | place 1 | wrong: `expected { refused: [ ...(2) ] }`, refused `declared.rite.pause`, `declared.notes.dbg.pause` | right (the fix is the probe's change; see runs after the fix) | part of the defect | right: `v ... 102ms` |
| An app debugger session ended by Stop | every publish carries `declared` | accepted; status `ended`, no frames, adapter `notes.dbg`, the end in words | place 1 | wrong: refused `declared.rite.pause`, `declared.notes.dbg.pause` | right | part of the defect | right: `v ... 111ms` |
| A session of oculus's own adapter, paused | `declared.rite` from `session.ts:124` | accepted; paused, frames `main`, `x=1`, adapter `rite`, and the same on a reload | place 1 | wrong: refused `declared.rite.pause` for the message and the reload | right | part of the defect | right: `v ... 34ms` |

The orchestrator's lead that `rite_dap` sessions show on the page does not hold on this tree: the oculus adapter's messages are refused for `declared.rite.pause` as well. An idle client publishes nothing from its constructor (`session.ts:130-134`), so a page that loads before any session is handed no message and uses `IDLE`; it is not on the list.

## Fix and test

Test, run on the tree without the fix (the unchanged copy described above):

```
$ npx vitest run tests/server/machine/debug/channel.test.ts --reporter=verbose
 x ... shows a session of an app debugger paused on entry with its frame and variables, and hands the same to a page that reloads
 x ... shows a session of an app debugger that declares every capability paused on entry 96ms
   -> expected { refused: [ ...(2) ] } to deeply equal { status: 'paused', ...(3) }
 x ... shows a session of an app debugger ended by Stop, with the words of its end 99ms
   -> expected [ { refused: [ ...(2) ] }, false ] to deeply equal [ { status: 'ended', ...(3) }, false ]
 x ... shows a session of oculus's own adapter paused with its frame and variables 30ms
+     "refused": [ "declared.rite.pause", "declared.notes.dbg.pause",   (case 1, the message and the reload)
+   "refused": [ "declared.rite.pause", "declared.notes.dbg.pause",     (case 2)
+     "refused": [ "declared.rite.pause", "declared.notes.dbg.pause",   (case 3)
+     "refused": [ "declared.rite.pause",                                (case 4, the message and the reload)
      Tests  4 failed (4)
```

Places the fix covers: place 1, `payloads.ts:207`, the field removed, so the schema is the data model's type; the one change covers both page reads, since both use `payloadShapes.debug`.

Fix:

```diff
--- a/tools/oculus/src/lib/state/client/shapes/payloads.ts
+++ b/tools/oculus/src/lib/state/client/shapes/payloads.ts
@@ -204,7 +204,6 @@
     declared: z.record(
         z.string(),
         z.object({
-            pause: z.boolean(),
             conditions: z.boolean(),
             hitConditions: z.boolean(),
             logpoints: z.boolean(),
```

The test, a new file `tools/oculus/tests/server/machine/debug/channel.test.ts` (291 lines, tagged slow; `tests/server/machine/debug` then holds 2 items), in the scratch copy at `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.X110uN/tree/tools/oculus/tests/server/machine/debug/channel.test.ts`:

```ts
// Layer 2, server test. What the page reads of the `debug` channel: the socket drops a frame whose
// payload the channel's schema refuses (`handle` in state/client/socket.svelte.ts), and the Debug
// view, the status bar and the editor draw only a payload that schema accepted
// (`entities.payloadOf`), so each state the debug client publishes is read here through that same
// schema. A session of an app's debugger is started as the Debug view's Start starts it, with the
// debugger's first initial configuration given whole; a session of oculus's own adapter is
// launched with the scripted adapter standing in for `rite_dap`. A page that reloads is handed the
// channel's current message, which is read the same way.
//
// The adapter is the node program of tests/server/machine/apps/world/debug-app.ts, which speaks the
// debug protocol and records every request. Every folder is under the system temporary directory.
// What this does NOT cover: the drawing of the views, which the look on landing shows.
// @module-tag slow: each case starts a node process for the adapter, and one for an app's host.

import { realpathSync, watch, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import type { DebugPayload, Message } from '../../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import { spawnChild } from '../../../../src/lib/server/machine/lsp/held/process.ts';
import { DebugClient } from '../../../../src/lib/server/machine/debug/session.ts';
import {
    debugControl,
    startSession,
    type StartDeps
} from '../../../../src/lib/server/machine/debug/session/start.ts';
import { payloadShapes } from '../../../../src/lib/state/client/shapes/payloads.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import { adapterProgram, debugApp, requestsTo, type AdapterCaps } from '../apps/world/debug-app.ts';
import { world } from '../apps/world/hosts-world.ts';

const catalog = textCatalog(loadConfig(engineDir()).config);

/** The capabilities of the adapter of the app the symptom was seen with. */
const SOME: AdapterCaps = {
    supportsConfigurationDoneRequest: true,
    supportsConditionalBreakpoints: true,
    supportsTerminateRequest: true
};

/** An adapter that declares every capability the client reads. */
const ALL: AdapterCaps = {
    supportsConfigurationDoneRequest: true,
    supportsConditionalBreakpoints: true,
    supportsHitConditionalBreakpoints: true,
    supportsLogPoints: true,
    supportsFunctionBreakpoints: true,
    supportsEvaluateForHovers: true,
    supportsSetVariable: true,
    supportsRestartRequest: true,
    supportsTerminateRequest: true,
    supportsCompletionsRequest: true,
    supportsLoadedSourcesRequest: true,
    exceptionBreakpointFilters: [{ filter: 'all', label: 'All', default: true }]
};

/** What the page draws of a session: its status, its frames, its variables and its adapter. */
type Drawn = { status: string; frames: string[]; variables: string[][]; adapter: string | null };

/**
 * What a page reads of one message of the channel, as the socket and `entities.payloadOf` read it:
 * the fields it draws, or the fields the schema refused it for.
 */
function onPage(message: Message | undefined): Drawn | { refused: string[] } | null {
    if (message === undefined) return null;
    const read = payloadShapes.debug.safeParse(message.payload);
    if (!read.success) return { refused: read.error.issues.map((one) => one.path.join('.')) };
    const payload: DebugPayload = read.data;
    return {
        status: payload.status,
        frames: payload.frames.map((one) => one.name),
        variables: payload.scopes.map((one) => one.variables.map((v) => `${v.name}=${v.value}`)),
        adapter: payload.adapter?.type ?? null
    };
}

type Rig = {
    hub: Hub;
    client: DebugClient;
    log: string;
    until: (accepts: () => boolean) => Promise<void>;
    /** What a page that subscribes now is handed, read as the page reads it. */
    reloaded: () => ReturnType<typeof onPage>;
    close: () => Promise<void>;
};

/** A hub, a debug client over it and a wait on what it publishes and the adapter records. */
function rig(dir: string, spawn: ConstructorParameters<typeof DebugClient>[0]['spawn']): Rig {
    const log = join(dir, 'adapter.log');
    const hub = new Hub();
    const waiting = new Set<() => void>();
    const wake = (): void => {
        for (const look of [...waiting]) look();
    };
    const sink = {
        send(): Promise<void> {
            wake();
            return Promise.resolve();
        },
        close: () => undefined
    };
    hub.subscribe(sink, ['debug']);
    const watcher = watch(dir, wake);
    const client = new DebugClient({
        hub,
        spawn,
        adapter: () => process.execPath,
        catalog: () => catalog,
        killAfterMs: 500
    });
    return {
        hub,
        client,
        log,
        until: (accepts) =>
            new Promise((resolve) => {
                const look = (): void => {
                    if (!accepts()) return;
                    waiting.delete(look);
                    resolve();
                };
                waiting.add(look);
                look();
            }),
        reloaded() {
            const handed: string[] = [];
            const page = {
                send(text: string): Promise<void> {
                    handed.push(text);
                    return Promise.resolve();
                },
                close: () => undefined
            };
            hub.subscribe(page, ['debug']);
            hub.remove(page);
            const last = handed.at(-1);
            return onPage(last === undefined ? undefined : (JSON.parse(last) as Message));
        },
        close() {
            watcher.close();
            client.close();
            return Promise.resolve();
        }
    };
}

/**
 * A session of the app `notes`'s debugger started as the Debug view's Start starts it with a
 * `.note` file on screen and no `launch.yml`: the first of the debugger's initial configurations,
 * given whole.
 */
async function appSession(caps: AdapterCaps) {
    const dir = scratchDir('oculus-dbg-channel-');
    const r = rig(dir, () => {
        throw new Error('no child');
    });
    const w = world(
        {
            notes: debugApp('executable', caps, r.log, 0, {
                contributes: '  commands:\n    - command: notes.do\n      title: Do\n'
            })
        },
        {},
        { real: true, roots: { r: { 'a.note': 'hello\n' } } }
    );
    const root = realpathSync(w.fixture.roots[0].dir);
    r.client.attachApps(w.hosts.tools.debugPort());
    const deps: StartDeps = {
        rootsFor: () => [root],
        approvalsFor: () => join(dir, 'approvals.json'),
        catalog: () => catalog,
        client: r.client,
        port: () => r.client.port()
    };
    w.hosts.tools.attachDebug(debugControl(deps));
    const started = await startSession(
        {
            repo: root,
            name: null,
            configuration: {
                name: 'Run note',
                type: 'notes.dbg',
                request: 'launch',
                args: { stopOnEntry: true },
                program: '${file}',
                cwd: '.'
            },
            context: { file: join(root, 'a.note') },
            breakpoints: [],
            functions: [],
            watch: []
        },
        deps
    );
    await r.until(
        () =>
            r.client.state().status === 'paused' &&
            requestsTo(r.log).some((one) => one.command === 'variables') &&
            r.client.state().scopes.length > 0
    );
    return {
        ...r,
        started,
        async close() {
            await r.close();
            await w.hosts.close();
        }
    };
}

const PAUSED_APP: Drawn = {
    status: 'paused',
    frames: ['main'],
    variables: [['x=1']],
    adapter: 'notes.dbg'
};

describe('the debug channel as the page reads it', () => {
    it('shows a session of an app debugger paused on entry with its frame and variables, and hands the same to a page that reloads', async () => {
        const s = await appSession(SOME);
        const server = s.client.state().status;
        const published = onPage(s.hub.latest('debug'));
        const reloaded = s.reloaded();
        await s.close();
        expect([s.started, server, published, reloaded]).toEqual([
            { ok: true },
            'paused',
            PAUSED_APP,
            PAUSED_APP
        ]);
    }, 60000);

    it('shows a session of an app debugger that declares every capability paused on entry', async () => {
        const s = await appSession(ALL);
        const published = onPage(s.hub.latest('debug'));
        await s.close();
        expect(published).toEqual(PAUSED_APP);
    }, 60000);

    it('shows a session of an app debugger ended by Stop, with the words of its end', async () => {
        const s = await appSession(SOME);
        s.client.stop(true);
        await s.until(() => s.client.state().status === 'ended');
        const published = onPage(s.hub.latest('debug'));
        const ended = s.client.state().ended;
        await s.close();
        expect([published, ended === '']).toEqual([
            { status: 'ended', frames: [], variables: [], adapter: 'notes.dbg' },
            false
        ]);
    }, 60000);

    it("shows a session of oculus's own adapter paused with its frame and variables", async () => {
        const dir = scratchDir('oculus-dbg-channel-');
        const program = join(dir, 'adapter.js');
        writeFileSync(program, adapterProgram());
        const log = join(dir, 'adapter.log');
        const r = rig(dir, (command, _args, options) =>
            spawnChild(
                command,
                [program, log, JSON.stringify({ supportsConfigurationDoneRequest: true })],
                options
            )
        );
        r.client.launch({
            repo: dir,
            name: 'run',
            program: join(dir, 'a.rite'),
            cwd: dir,
            breakpoints: [],
            functions: [],
            watch: []
        });
        await r.until(() => r.client.state().status === 'running');
        await r.client.controls.pause();
        await r.until(
            () => r.client.state().status === 'paused' && r.client.state().scopes.length > 0
        );
        const published = onPage(r.hub.latest('debug'));
        const reloaded = r.reloaded();
        await r.close();
        const paused: Drawn = {
            status: 'paused',
            frames: ['main'],
            variables: [['x=1']],
            adapter: 'rite'
        };
        expect([published, reloaded]).toEqual([paused, paused]);
    }, 60000);
});
```

Runs after the fix (in the scratch copy):

```
$ npx vitest run tests/server/machine/debug/channel.test.ts --reporter=verbose
 v ... shows a session of an app debugger paused on entry with its frame and variables, and hands the same to a page that reloads 128ms
 v ... shows a session of an app debugger that declares every capability paused on entry 102ms
 v ... shows a session of an app debugger ended by Stop, with the words of its end 111ms
 v ... shows a session of oculus's own adapter paused with its frame and variables 34ms
      Tests  4 passed (4)
$ npx vitest run tests/server/machine/apps/tools/debug-page.test.ts --reporter=verbose      (the red command, shrunk case)
DIAG-7c41 parts {"started":{"ok":true},"server":{"status":"paused",...},"latest":{"status":"paused","frames":["main"],"scopes":[["x=1"]],"adapter":{"type":"notes.dbg","label":"Notes Debug","app":"app:notes"}},"handed":{"status":"paused","frames":["main"],"scopes":[["x=1"]],...}}
 v ... 150ms   Tests  1 passed (1)
$ (the same command on the original, unshrunk case: executable, the look's three capabilities, the configuration given whole)
DIAG-7c41 parts {... "latest":{"status":"paused","frames":["main"],"scopes":[["x=1"]],...},"handed":{"status":"paused",...}}
 v ... 146ms   Tests  1 passed (1)
$ npx vitest run tests/server/machine/apps/tools/debug-adapters.test.ts tests/routes/machine/debug.test.ts tests/shell/commands/debug/debug-toolbar.test.ts tests/server/machine/debug/channel.test.ts
 Test Files  4 passed (4)
      Tests  30 passed (30)
$ npx prettier --check tests/server/machine/debug/channel.test.ts src/lib/state/client/shapes/payloads.ts
All matched files use Prettier code style!
$ npx eslint tests/server/machine/debug/channel.test.ts src/lib/state/client/shapes/payloads.ts; echo eslint=$?
eslint=0
$ npx svelte-check --tsconfig ./tsconfig.json --threshold error
... COMPLETED 3963 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ LC_ALL=C grep -n '[^ -~]' tests/server/machine/debug/channel.test.ts src/lib/state/client/shapes/payloads.ts; echo ascii=$?
ascii=1
$ grep -n -i -E "before|used to|no longer|still|always has|always had|as before|previously|the step adds|after this package" tests/server/machine/debug/channel.test.ts; echo rc=$?
rc=1
```

The other inputs after the fix are cases 2 to 4 above, each green.

For the orchestrator at landing:
- The test needs an entry in `agents/guarded.md`, as the rules file says a test exists only as the test of one entry; it sits with G77's debug rows (`debug-adapters.test.ts`) in what it covers, and whether it joins that entry or needs a new one is the orchestrator's booking (a new entry is Axel's ruling).
- The file is tagged slow (each case starts node processes), so `npm test` leaves it out and `npm run test:slow` runs it; `npx vitest run <file>` runs it alone, as above.
- What the page then draws (the Debug view's Call Stack and Variables, the status bar item, the editor opened at the paused line) is seen at the look on landing: start the look app's `notes.dbg` from the Debug view's Start with `look.note` open; the Debug view should show the session paused with frame `main` and `x=1`, a debug item in the status bar, the editor at line 1 of `look.note`, and the same after a reload; a `.rite` session should show likewise.

No test reaches it: not applicable. No test is written: not applicable.

## Cleanup

```
$ grep -rn "DIAG-7c41" src tests config; echo "src/tests/config grep exit $?"
src/tests/config grep exit 1
```

The tag `DIAG-7c41` is not unique to this diagnosis: a grep over the whole scratch `tools/oculus` (`grep -rn "DIAG-7c41" --exclude=local.yml --exclude-dir=node_modules .`) lists only the committed records `.scratch/migration/agents/reviews/D33-diagnosis.md`, `O30-diagnosis.md` and `D41-diagnosis.md`, which already hold it. Every line this diagnosis tagged was in the scratch test `tests/server/machine/apps/tools/debug-page.test.ts` and a scratch `tests/server/machine/apps/tools/diag-idle.test.ts`, both removed. The probe changes to `payloads.ts` and `capabilities.ts` were undone (`capabilities.ts` equals the step worktree's by `cmp`); the fix is the only change left in `payloads.ts` (`diff -u` against the step worktree's file shows the one removed line). The unchanged-tree copy and the saved originals under the session scratchpad were removed; `ls $TMPDIR | grep -c "oculus-dbg-channel-\|oculus-dbg-page-"` printed 0. As the orchestrator asked, the scratch worktree is left in place at `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.X110uN/tree` with the fix and the test in it. The red command is carried by case 1 of `tests/server/machine/debug/channel.test.ts` as the check.

# Diagnosis: an app server's hover is never asked, and a documentSymbol it never declared is sent to it

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. A diagnosis of the same step later is appended below under its own heading at the level of the title above, `# Diagnosis: <the symptom in a few words>`, which names its finding or quotes its part.

Diagnosis agent: ad244115b44ae7270, ordo-high, served claude-opus-5-5; 285,183 tokens, 251 tool uses, 82.1 min.

## Symptom

"In oculus with D64 staged on main (tools/oculus), an app's language server registered with oculus.languages.registerLanguageServer for a language no oculus server serves (language `notes`, server declares capabilities { hoverProvider: true } only) never receives textDocument/hover when the reader hovers a word in an open .note file (no hover box appears on a word without a problem; the server's message log shows initialize, initialized, didOpen, then two textDocument/documentSymbol requests and no hover), and it does receive textDocument/documentSymbol although it never declared documentSymbolProvider; the Outline view then stays on "Loading document symbols...". Diagnostics the server publishes on didOpen do show (warning squiggle and "look: first word" in the problem hover)."

## Where the probes run

The scratch copy /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.PopIRr/tree: a detached worktree at f6fdc112e with main's staged D64 change and the landing's unstaged fixes applied. tools/oculus/node_modules there is a symlink to the main checkout's node_modules. Before-runs used a second copy of tools/oculus in the session scratchpad (`scratchpad/unfixed`), with every source file this fix changes restored to main's text (each compared with `diff -q` against /Users/axelfaes/workspace/research-hub/tools/oculus, which printed nothing), the new test and helper copied in, and node_modules symlinked to the main checkout's. That copy is removed. The paths redirected under `$TMPDIR`: none.

The block for a reviewer's finding is not applicable: the symptom is the user's.

Boundaries this diagnosis crossed, for the orchestrator to judge:

- One run of the whole suite on the fixed tree (`npx vitest run --exclude 'tests/checks/**'`, slow rows included) ran tests/server/desktop/start.test.ts. That file starts the worktree's Electron binary under tests/server/desktop/app-harness.ts, which replaces every window, focus and dialog call with a recorder. It uses a scratch HOME, port 8817 and a tmux socket named with `-S`. The brief says never to start Electron. Checks after the run:
  - `grep -rnE "\b(8787|8790|8796)\b" tests`: the only hits are strings, fixture fields and `Request` objects handed to route handlers in process.
  - `grep -rlE "\bfetch\(" tests` names only start.test.ts, which fetches 127.0.0.1:8817.
  - `ps -axo pid,command | grep diagnose.PopIRr` printed nothing, so no process was left.
- That run's build wrote `.svelte-kit-app/` and `build-app/` in the scratch tree (02:46 to 02:49). `git status --ignored` shows both as ignored.
- Writes into the shared node_modules (the main checkout's):
  - The prescribed `npx vitest run` calls wrote `node_modules/.vite/_svelte_metadata.json`, `node_modules/.vite/vitest/*/results.json`, `node_modules/.vite/vitest/*/_svelte_metadata.json` and the empty folder `node_modules/.vite-temp`, with mtimes 02:14 to 02:57.
  - The two runs of `sh utils/unused-exports.sh` (knip, 02:49:25 to 02:49:47) wrote 937 files into `node_modules/.cache/jiti`, mtimes 02:49:36 to 02:49:46 (`find node_modules/.cache/jiti -newermt "2026-10-13 01:50" -type f | wc -l` = 937 of 2125). Nothing was removed from node_modules, because the brief forbids changing it.

## Red command

```
cd /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.PopIRr/tree/tools/oculus && export PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH && npx vitest run tests/server/machine/apps/tools/languages-red.test.ts
```

How the scratch file `tests/server/machine/apps/tools/languages-red.test.ts` (150 lines, removed at cleanup) works:

- It drives the real relay (`languageWorld`) and a real app server (`languageApp`) whose script is `{ capabilities: { hoverProvider: true }, hover: 'a note', diagnostics: [warning 0:0-0:4 'look: first word'] }`.
- The page's real `LspTransport` sits between the relay and a recording stand-in for Monaco's client.
- Part A asserts that the client is handed a hover declaration, in the initialize answer or by `client/registerCapability`.
- Part B asserts that a `textDocument/documentSymbol` asked through `transport.ask` is answered within 4 s and never reaches the server's log.
- Case 1 and case 8 of the new test (below) carry the two parts.

Runs on the tree without the fix, with the output of each quoted:

```
unfixed run 1
A registration from the relay: {"jsonrpc":"2.0","id":"oculus:1","method":"client/registerCapability","params":{"registrations":[{"id":"oculus-app:notes:hoverProvider","method":"textDocument/hover","registerOptions":{"documentSelector":[{"language":"notes"}]}}]}}
A reply of the transport: {"jsonrpc":"2.0","id":"oculus:1","error":{"code":-32601,"message":"client/registerCapability is not handled"}}
A methods handed to the Monaco client: ["answer 1"]
B the page: no answer in 4 s | reached the server: true
     x A: the Monaco client is told hover is served by an app server that declared hoverProvider 129ms
     x B: a documentSymbol of the page is answered to the page and not sent to a server that did not declare it 4094ms
AssertionError: expected false to be true // Object.is equality
AssertionError: expected { answered: 'no answer in 4 s', ...(1) } to deeply equal { Object (answered, reached) }
      Tests  2 failed (2)
unfixed run 2
(the same four A/B lines)
     x A: ... 114ms
     x B: ... 4103ms
      Tests  2 failed (2)
unfixed run 3
(the same four A/B lines)
     x A: ... 122ms
     x B: ... 4104ms
      Tests  2 failed (2)
```

Parts of the reported symptom, with whether the red command catches each:

| Part of the symptom | Caught by the red command | Lines read, for a part not caught | Reproduced |
|---|---|---|---|
| "never receives textDocument/hover ... no hover box appears" | yes, A: the client is handed no hover registration, and the transport answers the relay's `client/registerCapability` with -32601 | not applicable | yes, caught once the red command was changed to assert the part where it happens (see the note below) |
| "it does receive textDocument/documentSymbol although it never declared documentSymbolProvider" | yes, B: `reached the server: true` | not applicable | yes, caught |
| "the Outline view then stays on "Loading document symbols..."" | yes, B: `the page: no answer in 4 s` | not applicable | yes, caught |
| "Diagnostics the server publishes on didOpen do show" | no assertion: this part is behaviour that works, and the script's diagnostics reach the page (the red command waits on `textDocument/publishDiagnostics` before it asks) | not applicable | not a failure |

The first version of the red command asserted A at the relay only. It was green on A: the relay does send `client/registerCapability`, and the initialize answer was `{"capabilities":{"textDocumentSync":2},"serverInfo":{"name":"oculus"}}`. Reading the page's path showed that `#serverRequest` of transport.ts refuses the registration, so the command was changed to put the page's transport in the path. The runs above are of the changed command.

Runs after the tightening: the three runs above.

## No red command

Not applicable.

## Shrunk case

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| the diagnostics of the script | red on A and B | cut |
| the hover text | red on A and B | cut |
| the page's own `initialize` (env DIAG_NOINIT=1) | red on A and B | cut |
| the capabilities, for B (`{}`) | B red: `B the page: no answer in 4 s \| reached the server: true` | cut |

The shrunk case, as it stands: an app server of `notes` with no oculus server for the language, and a page transport that registers one document. Part A needs the server to declare `hoverProvider`. Part B needs a server that declares nothing.

## Hypotheses

1. If the page transport refuses `client/registerCapability` and never hands it to Monaco's client, then delivering register and unregister to the client turns A green. Falsified by: A red with the change.
2. If relay-route.ts `route()`, at `else if (offering.length === 0) { held = open.held; }`, sends a request no server declared to the document's first server even when that server is an app's, then answering null there for an app's server turns B green. Falsified by: B red with the change.
3. If the relay misjudges `held.capabilities` (empty or stale when `declaring()` runs), then logging the capabilities at the decision shows something other than `{"hoverProvider":true}`. Falsified by: the logged capabilities are the server's.

The reply to the hypotheses: none, no person present.

The second list: not needed.

## Probes

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 1 | transport.ts `#serverRequest`: `+ case 'client/registerCapability':` / `+ case 'client/unregisterCapability':` / `+     this.#deliver(message);` / `+     return;` before `default:` | With it: `Tests 1 failed \| 1 passed (2)`, and only B failed (`B the page: no answer in 4 s \| reached the server: true`). With the file copied back: `A reply of the transport: {..."error":{"code":-32601,"message":"client/registerCapability is not handled"}}`, `A methods handed to the Monaco client: ["answer 1"]`, `Tests 2 failed (2)` | still standing |
| 2 | relay-route.ts `route()`: `+ } else if (offering.length === 0 && appInfo(open.held.entry) !== undefined) {` / `+     if (isRequest) reply(state, page, channel, message.id, null);` / `+     return;` before `} else if (offering.length === 0) {` | With it: `Tests 1 failed \| 1 passed (2)`, and only A failed. With the file copied back: `B the page: no answer in 4 s \| reached the server: true`, B red | still standing. It broke the existing case "starts with the first document..." in languages.test.ts, which asks a hover before the server answered `initialize`: the decision must wait for `initialize` |
| 3 | relay-route.ts after `const offering = declaring(targets, asked, language);`: `+ process.stderr.write(\`DIAG-7c41 ${method} offering=${offering.length} caps=${JSON.stringify(targets.map((one) => one.capabilities))}\n\`); // DIAG-7c41` | `DIAG-7c41 textDocument/documentSymbol offering=0 caps=[{"hoverProvider":true}]`, `Tests 1 failed \| 1 skipped (2)`; the file was copied back (`diff -q` printed "undone") | falsified |

## Cause

There are two causes, one for each part.

**A.** The relay registers an app server's features with the page's client by sending `client/registerCapability`. The page's transport answers that request with -32601 in `#serverRequest` (transport.ts, the `default:` branch) and never hands it to Monaco's client. Monaco's client therefore never asks for hover. This breaks the rule that a feature registration for a page channel reaches every reader of the client's features. Probe 1 shows it: A is green with the change and red without it.

**B.** `route()` in relay-route.ts sends a request that no server of the document declared to the document's first server (`held = open.held`), even when that server is an app's. The app's server is sent `documentSymbol`, which it does not answer, so the page waits forever. This breaks the rule that an app's server is asked only for features it declared. Probe 2 shows it: B is green with the change and red without it.

The fix covers every place of the defect below. Places not fixed: none.

## Operation and other inputs

The operations that go wrong:

- (A) transport.ts `#serverRequest`, whose `default:` branch answers `client/registerCapability` and `client/unregisterCapability` with -32601. Rule A below.
- (B) relay-route.ts `route()`, `else if (offering.length === 0) { held = open.held; }`. Rule B below.

The rules, stated at the kind of value:

- **Rule A (a feature registration for a page channel).** It must reach every reader of the client's features: Monaco's client and `provides` in client.ts. It must reach each client made on the channel. It must name a feature Monaco's client knows. A server's own dynamic registration counts as a declaration. DESIGN.md (Language servers of apps): "A capability an app server registers dynamically (`client/registerCapability`) is passed to the page's client."
- **Rule B (a request of the page for a feature).** It goes to an app's server only when that server declared the feature, in its `initialize` answer or by registering it. A request that no server it could go to declared is answered with no result. That holds also while the server is starting: the decision waits for its `initialize` answer. Oculus's own servers are exempt: the page asks them only what their entry names, and they answer every request.

Places of the defect:

1. A1, transport.ts `#serverRequest` (main lines 743-750): refuses register and unregister, so Monaco's client is never told.
2. A2, client.ts `provides` (main lines 302-305): reads `#capabilities`, set only from the initialize answer (main lines 584-586). A registered feature is never counted, so the editor's menu items that `provides` gates stay hidden.
3. A3, relay-server.ts `ready()` and `Page.registered`: the relay keeps the registered ids per page and channel, and the page's rpc `initialize` (relay-route.ts, main line 131) re-sends nothing. A client the page makes again on the same socket, after its last document closed, gets no registration.
4. A4, relay-join.ts `REGISTRATION`: it maps `semanticTokensProvider` to `textDocument/semanticTokens`. Monaco's `LspCapabilitiesRegistry.getCapabilityByMethod` throws for that method (node_modules/monaco-editor/esm/external/monaco-lsp-client/out/index.js line 2818). Its method table has 48 entries and no `textDocument/semanticTokens`. The page draws app tokens from the `oculus: 'legend'` frame.
5. A5, held.ts `#registered` (main lines 525-540): keeps only file watchers. A server's own `client/registerCapability` of a feature is not added to `held.capabilities`, so the relay neither registers it with the page nor routes the request to the server.
6. A6, relay-join.ts `REGISTRATION`: has no `callHierarchyProvider`, `typeHierarchyProvider` or `workspaceSymbolProvider`, so those features of an app server are never registered with the page.
7. B1, relay-route.ts `route()`: the `offering.length === 0` fallback to `open.held` (the operation the cause names).
8. B2, relay-route.ts `heldFor`: for `workspace/symbol` and a hierarchy follow-up it takes the first entry's server of the root without checking what that server declared.
9. B3, relay-join.ts `CAPABILITY`: has no `callHierarchy/incomingCalls`, `callHierarchy/outgoingCalls`, `typeHierarchy/supertypes` or `typeHierarchy/subtypes`, so `declares()` answers true for them.

The other inputs below are the ten cases of the new test plus three more. "Without the fix" is the tree without the fix. "With the probe" means the probe 1 and probe 2 changes together.

| Other input | Why it reaches a place of the defect | Right result | Place at which it is wrong | Result on the tree without the fix | Result with the change of the probe that shows the cause | Class | Result after the fix |
|---|---|---|---|---|---|---|---|
| 1. hover on an app-only language (the reported case) | the relay registers hover; the transport refuses it | registration handed, nothing refused, hover answered | A1 | wrong: `expected [ [], ...(2) ] to deeply equal [ [ 'textDocument/hover' ], [], ...(1) ]`; received holds the -32601 refusal | right | part of the defect | right |
| 2. app server beside oculus's Markdown server, with `codeLensProvider` | the relay registers codeLens, which oculus's entry lacks | `['textDocument/codeLens']` handed | A1 | wrong: `expected [] to deeply equal [ 'textDocument/codeLens' ]` | right | part of the defect | right |
| 3. in-host providers (`registerHoverProvider`) | the `providers` server is an app server | hover registration handed, hover answered | A1 | wrong: `expected [ [], true ] to deeply equal [ [ 'textDocument/hover' ], true ]` | right | part of the defect | right |
| 4. hover, workspaceSymbol, call and type hierarchy, semanticTokens declared | REGISTRATION decides what is registered | hover, workspace/symbol, prepareCallHierarchy, prepareTypeHierarchy; no semanticTokens | A1, A4, A6 | wrong: `expected [] to deeply equal [ 'textDocument/hover', ...(3) ]` | wrong | part of the defect | right |
| 5. a second client made on the same socket after the last document closed | `page.registered` keeps ids per socket | hover registration handed to the second client | A1, A3 | wrong: `expected [ [], '{"contents":"again"}' ] to deeply equal [ [ 'textDocument/hover' ], ...(1) ]` | wrong | part of the defect | right |
| 6. app disabled | `retired()` sends `client/unregisterCapability` | the unregistration handed: `[{ id: 'oculus-app:notes:hoverProvider', method: 'textDocument/hover' }]` | A1 | wrong: `expected undefined to deeply equal [ { ...(2) } ]` | right | part of the defect | right |
| 7. server declares nothing and registers hover after initialize | held.ts drops the feature registration | hover registration handed, hover reaches the server | A5 (with the probe also B1) | wrong: `expected [ [], ...(1) ] to deeply equal [ [ 'textDocument/hover' ], ...(1) ]` | wrong (hover answered null) | part of the defect | right |
| 8. documentSymbol asked at open (before initialize) and once ready, to a server that declares nothing | B1 | `[null, null]`, nothing sent to the server | B1 | wrong: `expected [ [], null, [ ...(3) ] ] to deeply equal [ [ null, null ], null, [] ]`, with documentSymbol, documentSymbol and definition sent | right | part of the defect | right |
| 9. workspace/symbol to a server that declared only hover | B2, B3 | null, not sent | B2 | wrong: `expected [ 'waiting', ...(2) ] to deeply equal [ null, '{"contents":"signal"}', [] ]` | wrong | part of the defect | right |
| 10. `callHierarchy/incomingCalls` with app one declaring hover and app two declaring callHierarchy | B2, B3 | sent to two only | B2, B3 | wrong: `expected { one: true, two: false } to deeply equal { one: false, two: true }` | wrong | part of the defect | right |
| N1. documentSymbol to an app server that declared documentSymbolProvider | B1 path with offering 1 | sent to it | none | right | right | not part of the defect | right |
| N3. app one declaring nothing, app two declaring documentSymbol | `declaring()` | sent to two only | none | right | right | not part of the defect | right |
| E. hover asked before the server answered initialize (existing case "starts with the first document..." in languages.test.ts) | B1 decision before `initialize` | routed once the server answered | none | right | wrong (answered null too early) | not part of the defect; the fix waits for `initialize` because of it | right |

## Fix and test

Test, run on the tree without the fix:

```
$ cd <scratchpad>/unfixed/tools/oculus && npx vitest run tests/server/machine/apps/tools/language-features.test.ts
     x is handed to the page client as a registration, which the transport refuses none of, for a language no oculus server serves 119ms
     x is handed to the page client for a language oculus serves, when oculus own server does not declare it 94ms
     x is handed to the page client from the providers an app registers in its host 63ms
     x is registered for workspace symbols and the call and type hierarchies, and not for semantic tokens, which the page draws from the legend 98ms
     x is handed to a second client the page makes on the same socket after its last document closed 104ms
     x is withdrawn from the page client when the app stops acting 95ms
     x is handed to the page client when the server registers it after initialize, and its requests reach the server 108ms
     x that the server of an app did not declare is answered with no result and not sent to it, asked as the document opens and once the server is ready 99ms
     x for the workspace symbols of a root, whose server of an app did not declare them, is answered with no result and not sent to it 99ms
     x that follows a call hierarchy goes to the server that declared the call hierarchy, not to the first server of the document 186ms
AssertionError: expected [ [], ...(2) ] to deeply equal [ [ 'textDocument/hover' ], [], ...(1) ]
AssertionError: expected [] to deeply equal [ 'textDocument/codeLens' ]
AssertionError: expected [ [], true ] to deeply equal [ [ 'textDocument/hover' ], true ]
AssertionError: expected [] to deeply equal [ 'textDocument/hover', ...(3) ]
AssertionError: expected [ [], '{"contents":"again"}' ] to deeply equal [ [ 'textDocument/hover' ], ...(1) ]
AssertionError: expected undefined to deeply equal [ { ...(2) } ]
AssertionError: expected [ [], ...(1) ] to deeply equal [ [ 'textDocument/hover' ], ...(1) ]
AssertionError: expected [ [], null, [ ...(3) ] ] to deeply equal [ [ null, null ], null, [] ]
AssertionError: expected [ 'waiting', ...(2) ] to deeply equal [ null, '{"contents":"signal"}', [] ]
AssertionError: expected { one: true, two: false } to deeply equal { one: false, two: true }
 Test Files  1 failed (1)
      Tests  10 failed (10)
```

The expanded diffs of case 1 and case 8 show the symptom.

Case 1, received: `[ [], [ { "error": { "code": -32601, "message": "client/registerCapability is not handled" }, "id": "oculus:1", "jsonrpc": "2.0" } ], "{\"contents\":\"a note\"}" ]`.

Case 8, received: `[ [], null, [ "textDocument/documentSymbol", "textDocument/documentSymbol", "textDocument/definition" ] ]`.

Places the fix covers:

- **A1**, transport.ts `#serverRequest`: register and unregister are told to the host (`TransportHost.registered`) and then delivered to Monaco's client.
- **A2**, client.ts: `#registered` (registration id to capability key) is filled by the host's `registered`. `provides` answers true for a registered key. `declared` clears the map.
- **A3**:
  - relay-route.ts rpc `initialize` calls `initialized()` of relay-server.ts.
  - `initialized()` clears `page.registered` for the channel and calls `align`.
  - `align` registers every feature the page's app servers of the language declare and oculus's own does not, and withdraws the ones no such server declares now.
  - `ready()` and `retired()` both use `align`.
- **A4**: relay-join.ts `registrationsFor` skips `semanticTokensProvider` (`DRAWN`).
- **A5**:
  - held.ts `#registered` adds a registered feature to `capabilities`, and removes a withdrawn one, with `withFeature`.
  - register and unregister call `host.ready(this)`, so the relay aligns the page.
- **A6**: the shared table `FEATURES` in data/prose/lsp-servers.ts, which relay-join.ts, held.ts and client.ts read, includes workspace symbols and the two hierarchies.
- **B1**, relay-route.ts `route()`:
  - After the server is chosen, a request to an app's server that does not declare the feature waits on `held.whenDeclared`.
  - Once `initialize` is answered, the request is routed again if the server declares the feature, and answered null otherwise.
  - It is answered null if the server ends or closes without answering `initialize`.
  - `Knowing` (held/requests/knowing.ts) holds the waiters.
- **B2**: `heldFor`'s `ofRoot` takes the first server of the root that declared the feature, else the first.
- **B3**: relay-join.ts `CAPABILITY` gains the four hierarchy follow-ups.
- **Docs**: DESIGN.md and docs/apps.md state the rule. docs/diagrams layers and layer-server are regenerated with `node utils/diagrams/diagrams.mjs`; two imports from server to data were added.

Fix (the whole change, 18 files). It is also saved as /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/D64-diagnosis-fix.patch (1418 lines, shasum d262db2553d80c06fbccae54199a077863838f7a). The patch is taken against the main checkout's current files. Applied with `patch -p1` to copies of main's files, it gave files byte-identical to the scratch tree's for 17 of them (`cmp`). For docs/apps.md, whose main copy has moved on since the scratch copy was made, it gave main's text plus the one new bullet.

```diff
--- a/tools/oculus/src/lib/data/prose/lsp-servers.ts
+++ b/tools/oculus/src/lib/data/prose/lsp-servers.ts
@@ -11,6 +11,18 @@
 //
 // A `words` value is the key of a catalog line, which the page reads with its own `t`; the module
 // holds no sentence.
+//
+// The features of every language server are here too, each by the key of the capability a server
+// declares it under in its `initialize` answer and the method it is registered under with
+// `client/registerCapability` (`FEATURES`): the relay counts a feature a server registers as
+// declared (server/machine/lsp/held/held.ts) and registers with the page's client each feature a
+// server of an app declares that oculus's own server of the language does not
+// (server/machine/lsp/relay/relay-join.ts), and the page's client counts a registration it is
+// handed as the feature declared (ui/controls/editor/kit/lsp/client.ts). The protocol registers
+// semantic tokens under `textDocument/semanticTokens`, which is here for a server's own
+// registration; the page draws a server's semantic tokens from the legend the relay sends it, so
+// the relay registers no semantic tokens with the page's client, whose Monaco client knows no
+// feature by that method.
 
 /** The ids of the language servers. */
 export type LspServerId =
@@ -284,3 +296,54 @@
 export function choicesOfLanguage(language: string): readonly LspChoiceKind[] {
     return factsForLanguage(language)?.choices ?? [];
 }
+
+/** The method each feature is registered under, by the key of its capability. */
+export const FEATURES: Readonly<Record<string, string>> = {
+    hoverProvider: 'textDocument/hover',
+    completionProvider: 'textDocument/completion',
+    signatureHelpProvider: 'textDocument/signatureHelp',
+    definitionProvider: 'textDocument/definition',
+    declarationProvider: 'textDocument/declaration',
+    typeDefinitionProvider: 'textDocument/typeDefinition',
+    implementationProvider: 'textDocument/implementation',
+    referencesProvider: 'textDocument/references',
+    documentHighlightProvider: 'textDocument/documentHighlight',
+    documentSymbolProvider: 'textDocument/documentSymbol',
+    workspaceSymbolProvider: 'workspace/symbol',
+    codeActionProvider: 'textDocument/codeAction',
+    codeLensProvider: 'textDocument/codeLens',
+    documentLinkProvider: 'textDocument/documentLink',
+    documentFormattingProvider: 'textDocument/formatting',
+    documentRangeFormattingProvider: 'textDocument/rangeFormatting',
+    documentOnTypeFormattingProvider: 'textDocument/onTypeFormatting',
+    renameProvider: 'textDocument/rename',
+    foldingRangeProvider: 'textDocument/foldingRange',
+    selectionRangeProvider: 'textDocument/selectionRange',
+    inlayHintProvider: 'textDocument/inlayHint',
+    callHierarchyProvider: 'textDocument/prepareCallHierarchy',
+    typeHierarchyProvider: 'textDocument/prepareTypeHierarchy',
+    semanticTokensProvider: 'textDocument/semanticTokens'
+};
+
+/** The capability key of the feature registered under a method; undefined for no feature. */
+export function featureOf(method: unknown): string | undefined {
+    return Object.keys(FEATURES).find((key) => FEATURES[key] === method);
+}
+
+/**
+ * The capabilities a server declares once it registered (`added`) or withdrew the feature of a
+ * method, under the options it registered it with; the same capabilities for a method of no
+ * feature.
+ */
+export function withFeature(
+    capabilities: Readonly<Record<string, unknown>>,
+    method: unknown,
+    added: boolean,
+    options: unknown
+): Record<string, unknown> {
+    const feature = featureOf(method);
+    if (feature === undefined) return { ...capabilities };
+    const others = Object.entries(capabilities).filter(([key]) => key !== feature);
+    const value = typeof options === 'object' && options !== null ? options : {};
+    return Object.fromEntries(added ? [...others, [feature, value]] : others);
+}
--- a/tools/oculus/src/lib/server/machine/lsp/held/held.ts
+++ b/tools/oculus/src/lib/server/machine/lsp/held/held.ts
@@ -19,6 +19,10 @@
 // The server is told of changes on disk by held/requests/notices.ts, a list at a time in the order
 // the root watch saw them, and of the files inside a folder that was created or deleted; a link
 // rewrite waits there until the server has read the files written since.
+//
+// What a server declares is its `initialize` answer's capabilities, with each feature it registers
+// later (`client/registerCapability`) added and each it withdraws taken away, so a feature a server
+// registers is asked of it and given to the page's client like one it declared at once.
 
 import { basename, join } from 'node:path';
 import type { watch } from 'node:fs';
@@ -36,6 +40,8 @@
 import { RootWatch, entryFiles, globsOf, type FileChange } from './watch.ts';
 import { Notices } from './requests/notices.ts';
 import type { Join } from '../relay/relay-join.ts';
+import { withFeature } from '../../../../data/prose/lsp-servers.ts';
+import { Knowing } from './requests/knowing.ts';
 import { normal, type ServedRoot } from '../uris.ts';
 
 /** The milliseconds a server outlives its last document or its page. */
@@ -87,7 +93,10 @@
     schemas?(): SchemaSet;
     /** A message from the server that is not the answer to something this module sent. */
     message(held: Held, message: LspRpc): void;
-    /** The server answered `initialize`; its capabilities are in `held.capabilities`. */
+    /**
+     * The server answered `initialize`, or registered or withdrew a feature after it; what it
+     * declares is in `held.capabilities`.
+     */
     ready(held: Held): void;
     /** The held server's process ended, for whatever reason, and what waited on it is answered. */
     stopped(held: Held): void;
@@ -135,7 +144,10 @@
     legend: { types: string[]; modifiers: string[] } | null = null;
     /** Whether the page has yet to be told the legend: set when the server is ready or adopted. */
     legendDue = false;
-    /** The capabilities of the server's `initialize` answer; empty until it answered. */
+    /**
+     * The capabilities of the server's `initialize` answer, with the features it registered since
+     * and without those it withdrew; empty until it answered.
+     */
     capabilities: Record<string, unknown> = {};
     readonly docs = new Map<string, Doc>();
     /** The highest version sent to the server for each file, kept after the file is closed. */
@@ -150,6 +162,7 @@
     #proc: ServerProcess | null = null;
     #setup: Setup | null = null;
     #early: LspRpc[] = [];
+    #knowing = new Knowing();
     #generation = 0;
     #timer: ReturnType<typeof setTimeout> | null = null;
     #exits: number[] = [];
@@ -269,9 +282,19 @@
         await this.close();
     }
 
+    /**
+     * Run `then` once what the server declares is known: at once when it has answered
+     * `initialize`, else when it answers it, with true; with false when its process ends, or the
+     * held server is closed, without that answer.
+     */
+    whenDeclared(then: (known: boolean) => void): void {
+        this.#knowing.when(then);
+    }
+
     /** End the server and everything of the held server, for good. */
     async close(): Promise<void> {
         this.#closed = true;
+        this.#knowing.tell(false);
         this.#clear();
         this.docs.clear();
         await this.#stop();
@@ -439,9 +462,11 @@
             }
             case 'client/registerCapability':
                 this.#registered(params.registrations, true);
+                this.#host.ready(this);
                 return reply(null);
             case 'client/unregisterCapability':
                 this.#registered(params.unregisterations, false);
+                this.#host.ready(this);
                 return reply(null);
             case 'workspace/diagnostic/refresh':
                 if (this.entry.pulls === true) this.#pulls.all();
@@ -522,10 +547,19 @@
         }
     }
 
-    /** The server registered or dropped capabilities: only its file watchers matter here. */
+    /**
+     * The server registered or withdrew capabilities: a feature is added to or taken from what it
+     * declares, under the options it registered, and a file watcher is kept or ended.
+     */
     #registered(list: unknown, add: boolean): void {
         for (const one of Array.isArray(list) ? list : []) {
             if (!isRecord(one) || typeof one.id !== 'string') continue;
+            this.capabilities = withFeature(
+                this.capabilities,
+                one.method,
+                add,
+                one.registerOptions
+            );
             if (one.method !== 'workspace/didChangeWatchedFiles') continue;
             if (!add) {
                 this.#watch?.unregister(one.id);
@@ -653,6 +687,7 @@
                     this.#watchEntryFiles();
                     if (this.state.state === 'starting') this.#set({ state: 'ready' });
                     this.#host.ready(this);
+                    this.#knowing.tell(true);
                 },
                 failed: (code, program) => {
                     if (this.#proc !== proc) return;
@@ -668,6 +703,7 @@
                     this.#proc = null;
                     this.#calls.end();
                     this.#host.stopped(this);
+                    this.#knowing.tell(false);
                     if (asked || this.#closed) return;
                     if (this.state.state === 'failed' || this.state.state === 'not_found') return;
                     this.#unexpected();
@@ -810,8 +846,11 @@
     tabs: Set<string>;
     /** The diagnostics each server of a document on several servers published, by its address. */
     joined: Map<string, Map<Held | string, unknown[]>>;
-    /** The capabilities registered with the page for its client, by channel and method. */
-    registered: Map<string, Set<string>>;
+    /**
+     * The features registered with the page's client, by channel: each registration's method, by
+     * its id.
+     */
+    registered: Map<string, Map<string, string>>;
 };
 
 /**
--- a/tools/oculus/src/lib/server/machine/lsp/held/requests/knowing.ts
+++ b/tools/oculus/src/lib/server/machine/lsp/held/requests/knowing.ts
@@ -0,0 +1,27 @@
+// Layer 2, server. The wait for what a language server declares: a request of the page for a
+// feature a server of an app did not declare is answered with no result (relay/relay-route.ts),
+// which can be decided only once the server answered `initialize`. A request made while the server
+// starts waits here, and is told once the answer came, or that it will not come when the server's
+// process ended or the held server closed without it.
+
+export class Knowing {
+    #known = false;
+    #waiting: ((known: boolean) => void)[] = [];
+
+    /** Whether the server answered `initialize` once, so what it declares is known. */
+    get known(): boolean {
+        return this.#known;
+    }
+
+    /** Run `then` with true at once when what the server declares is known, else once told. */
+    when(then: (known: boolean) => void): void {
+        if (this.#known) then(true);
+        else this.#waiting.push(then);
+    }
+
+    /** The server answered `initialize` (true), or ended or closed without that answer (false). */
+    tell(known: boolean): void {
+        if (known) this.#known = true;
+        for (const then of this.#waiting.splice(0)) then(this.#known);
+    }
+}
--- a/tools/oculus/src/lib/server/machine/lsp/relay/relay-join.ts
+++ b/tools/oculus/src/lib/server/machine/lsp/relay/relay-join.ts
@@ -18,11 +18,20 @@
 //
 // A capability an app server declares that oculus's own entry does not is registered with the
 // page's client (`client/registerCapability`) so the client asks for it; one oculus declares
-// already is asked for by the client already, and the request is joined here.
+// already is asked for by the client already, and the request is joined here. Semantic tokens are
+// not registered: the page draws a server's tokens from the legend the relay sends it.
+//
+// A request goes to a server of an app only for a feature that server declared, in its
+// `initialize` answer or by registering it later, as VS Code's client asks a server only for what
+// it declared. A request for a feature no server it could go to declared is answered with no
+// result at once when the server it would go to is an app's; oculus's own server is sent it, since
+// the page asks it only what its entry names and it answers every request it is sent. A
+// hierarchy's follow-up needs the hierarchy's feature, as its first request does.
 
 import type { LspRpc } from '../../../../data/model/index.ts';
 import type { Held, Page } from '../held/held.ts';
 import { isRecord } from '../wire.ts';
+import { FEATURES } from '../../../../data/prose/lsp-servers.ts';
 import { appInfo } from './relay-apps.ts';
 
 /** The milliseconds a joined request waits for the servers of apps. */
@@ -54,7 +63,11 @@
     'textDocument/semanticTokens/full': 'semanticTokensProvider',
     'textDocument/semanticTokens/range': 'semanticTokensProvider',
     'textDocument/prepareCallHierarchy': 'callHierarchyProvider',
+    'callHierarchy/incomingCalls': 'callHierarchyProvider',
+    'callHierarchy/outgoingCalls': 'callHierarchyProvider',
     'textDocument/prepareTypeHierarchy': 'typeHierarchyProvider',
+    'typeHierarchy/supertypes': 'typeHierarchyProvider',
+    'typeHierarchy/subtypes': 'typeHierarchyProvider',
     'workspace/symbol': 'workspaceSymbolProvider'
 };
 
@@ -83,30 +96,8 @@
     'inlayHint/resolve': 'textDocument/inlayHint'
 };
 
-/** The method of a registration for a capability key, and how its options are made. */
-const REGISTRATION: Record<string, string> = {
-    hoverProvider: 'textDocument/hover',
-    completionProvider: 'textDocument/completion',
-    signatureHelpProvider: 'textDocument/signatureHelp',
-    definitionProvider: 'textDocument/definition',
-    declarationProvider: 'textDocument/declaration',
-    typeDefinitionProvider: 'textDocument/typeDefinition',
-    implementationProvider: 'textDocument/implementation',
-    referencesProvider: 'textDocument/references',
-    documentHighlightProvider: 'textDocument/documentHighlight',
-    documentSymbolProvider: 'textDocument/documentSymbol',
-    codeActionProvider: 'textDocument/codeAction',
-    codeLensProvider: 'textDocument/codeLens',
-    documentLinkProvider: 'textDocument/documentLink',
-    documentFormattingProvider: 'textDocument/formatting',
-    documentRangeFormattingProvider: 'textDocument/rangeFormatting',
-    documentOnTypeFormattingProvider: 'textDocument/onTypeFormatting',
-    renameProvider: 'textDocument/rename',
-    foldingRangeProvider: 'textDocument/foldingRange',
-    selectionRangeProvider: 'textDocument/selectionRange',
-    inlayHintProvider: 'textDocument/inlayHint',
-    semanticTokensProvider: 'textDocument/semanticTokens'
-};
+/** The feature the page draws itself, which is never registered with the page's client. */
+const DRAWN = 'semanticTokensProvider';
 
 /** One server's share of a joined request. */
 type Part = { held: Held; relayId: number; answered: boolean; result: unknown };
@@ -125,7 +116,7 @@
 };
 
 /** Whether a server has declared the feature a request needs. */
-function declares(held: Held, method: string, language: string): boolean {
+export function declares(held: Held, method: string, language: string): boolean {
     const key = CAPABILITY[method];
     if (key === undefined) return true;
     const caps =
@@ -244,7 +235,7 @@
 /**
  * The registrations a server's capabilities need the page's client to make, for a language: one
  * for each feature the server declares that the entry of oculus does not, with the document
- * selector of the language.
+ * selector of the language, semantic tokens left out.
  */
 export function registrationsFor(
     capabilities: Record<string, unknown>,
@@ -252,7 +243,8 @@
     language: string
 ): { id: string; method: string; registerOptions: Record<string, unknown> }[] {
     const out = [];
-    for (const [key, method] of Object.entries(REGISTRATION)) {
+    for (const [key, method] of Object.entries(FEATURES)) {
+        if (key === DRAWN) continue;
         const value = capabilities[key];
         if (value === undefined || value === false || value === null) continue;
         if (present[key] !== undefined) continue;
--- a/tools/oculus/src/lib/server/machine/lsp/relay/relay-route.ts
+++ b/tools/oculus/src/lib/server/machine/lsp/relay/relay-route.ts
@@ -4,7 +4,10 @@
 // the entry's own (`answers`), or routed by the document it names to the server that holds the
 // document, with the addresses turned into the server's and the id into one of the relay's. A
 // request about the workspace (its symbols) and a follow-up of a hierarchy item name a root and a
-// file that may be open in no tab, and go to the server of that root.
+// file that may be open in no tab, and go to the server of that root. A request for a feature no
+// server of an app it would go to declared is answered with no result (relay-join.ts), and each
+// `initialize` of the page's client is followed by the registrations of the features the page's
+// servers of apps declare (relay-server.ts).
 
 import type { LspRpc } from '../../../../data/model/index.ts';
 import { WORKSPACE_LANGUAGE } from '../../../../data/prose/lsp-servers.ts';
@@ -32,11 +35,19 @@
 import { libraryFile } from '../library/pages.ts';
 import type { PageAnswer, ServerEntry } from '../servers.ts';
 import { appInfo, entriesFor, selects } from './relay-apps.ts';
-import { JOIN_MS, declaring, joinKind, resolveOf, untagged, type Join } from './relay-join.ts';
+import {
+    JOIN_MS,
+    declares,
+    declaring,
+    joinKind,
+    resolveOf,
+    untagged,
+    type Join
+} from './relay-join.ts';
 import { normal, parsePageUri, toServer } from '../uris.ts';
 import { HIERARCHY, addressOf, isRecord, languageOf, readFrame, type Inbound } from '../wire.ts';
 import { envOf, makeHeld } from './relay-make.ts';
-import { replayCollections, settleJoin } from './relay-server.ts';
+import { initialized, replayCollections, settleJoin } from './relay-server.ts';
 import { fail, mapperOf, pageOf, publishState, reply, rootsOf, send } from './relay-pages.ts';
 import {
     INVALID_PARAMS,
@@ -133,6 +144,7 @@
                 capabilities: entry.capabilities(language),
                 serverInfo: { name: 'oculus' }
             });
+            initialized(state, page, channel);
             return;
         case 'shutdown':
             reply(state, page, channel, message.id, null);
@@ -232,7 +244,25 @@
             joinWith = offering;
         }
     } else {
-        held = heldFor(state, page, entries, method, resolved.params, address);
+        held = heldFor(state, page, entries, method, language, resolved.params, address);
+    }
+    // A server of an app is asked only for a feature it declared; when the server a request would
+    // go to is an app's that did not, no server declared it and the page is answered with no
+    // result. What a starting server declares is known once it answered `initialize`, so the
+    // request is routed then, and answered with no result when the server ends without an answer.
+    if (
+        held !== undefined &&
+        isRequest &&
+        appInfo(held.entry) !== undefined &&
+        !declares(held, resolveOf(method) ?? method, language)
+    ) {
+        const starting = held;
+        held.whenDeclared((known) => {
+            if (known && declares(starting, resolveOf(method) ?? method, language)) {
+                route(state, page, channel, language, entries, message);
+            } else reply(state, page, channel, message.id, null);
+        });
+        return;
     }
     if (held === undefined) {
         if (isRequest) {
@@ -380,20 +410,24 @@
 /**
  * The server a request that names no open document is for: the one of the root a
  * `workspace/symbol` names, or of the file a hierarchy follow-up's item names, the first entry's
- * that has one; or the server that offers the command a `workspace/executeCommand` names.
+ * that declared the feature, else the first entry's that has one; or the server that offers the
+ * command a `workspace/executeCommand` names.
  */
 function heldFor(
     state: RelayState,
     page: Page,
     entries: readonly ServerEntry[],
     method: string,
+    language: string,
     params: unknown,
     address: string | null
 ): Held | undefined {
-    const ofRoot = (key: string): Held | undefined =>
-        entries
+    const ofRoot = (key: string): Held | undefined => {
+        const helds = entries
             .map((entry) => heldOfRoot(state, page, entry, key))
-            .find((one) => one !== undefined);
+            .filter((one): one is Held => one !== undefined);
+        return declaring(helds, method, language)[0] ?? helds[0];
+    };
     if (method === 'workspace/symbol') {
         const key = isRecord(params) && typeof params.root === 'string' ? params.root : null;
         return key === null ? undefined : ofRoot(key);
--- a/tools/oculus/src/lib/server/machine/lsp/relay/relay-server.ts
+++ b/tools/oculus/src/lib/server/machine/lsp/relay/relay-server.ts
@@ -1,9 +1,15 @@
 // Layer 2, server. What the relay does with the messages a language server sends: the answer to a
 // page's request, with the page's id put back and the addresses turned into the page's; a request
 // of the server to its client, which is answered here and not forwarded (`workspace/configuration`
-// from the registry, `client/registerCapability` as file watchers, progress as `state` messages),
-// except `workspace/applyEdit` and the two refreshes, which reach the page; and the diagnostics a
-// server publishes.
+// from the registry, `client/registerCapability` as file watchers and as features the server
+// declares, progress as `state` messages), except `workspace/applyEdit` and the two refreshes,
+// which reach the page; and the diagnostics a server publishes.
+//
+// The features the servers of apps declare are registered with the page's client of each channel
+// they serve, and withdrawn when no server of the page declares them: when a server answers
+// `initialize`, registers or withdraws a feature, or is retired, and in full each time the page's
+// client initializes the channel, since a new client the page makes on the same socket holds none
+// of the registrations of the client it replaces.
 
 import type { LspRpc } from '../../../../data/model/index.ts';
 import { PUBLISHED, publish, type Publishing } from '../held/diagnostics/published.ts';
@@ -186,36 +192,69 @@
 }
 
 /**
- * A server answered `initialize`. When it is an app's, the features it declared that oculus's own
- * server for the language does not are registered with the page's client for each language
- * channel the server serves, once for each feature.
+ * A server answered `initialize`, or registered or withdrew a feature after it. When it is an
+ * app's, the registrations of each language channel it serves are brought in line with what the
+ * page's servers of apps declare.
  */
 export function ready(state: RelayState, held: Held): void {
     if (appInfo(held.entry) === undefined) return;
     const page = held.owner as Page | null;
     if (page === null) return;
-    for (const channel of channelsOf(page, held.entry)) {
-        const language = languageOf(channel);
-        if (language === null) continue;
-        const own = state.servers.forLanguage(language);
-        const present = own === undefined ? {} : own.capabilities(language);
-        const done = page.registered.get(channel) ?? new Set<string>();
-        page.registered.set(channel, done);
-        const registrations = registrationsFor(held.capabilities, present, language).filter(
-            (one) => !done.has(one.id)
-        );
-        if (registrations.length === 0) continue;
-        for (const one of registrations) done.add(one.id);
+    for (const channel of channelsOf(page, held.entry)) align(state, page, channel, null);
+}
+
+/**
+ * The page's client initialized a channel: every feature the page's servers of apps declare for
+ * its language is registered with it, since it holds none yet.
+ */
+export function initialized(state: RelayState, page: Page, channel: string): void {
+    page.registered.delete(channel);
+    align(state, page, channel, null);
+}
+
+/**
+ * Register with the page's client of a channel each feature a server of an app of the page declares
+ * for the channel's language that oculus's own server of it does not and that is not registered
+ * yet, and withdraw each registered one that no such server declares; `leaving` is a server being
+ * retired, whose features are not counted.
+ */
+function align(state: RelayState, page: Page, channel: string, leaving: Held | null): void {
+    const language = languageOf(channel);
+    if (language === null) return;
+    const own = state.servers.forLanguage(language);
+    const present = own === undefined ? {} : own.capabilities(language);
+    const wanted = new Map(
+        [...new Set(page.helds.values())]
+            .filter((one) => one !== leaving && appInfo(one.entry) !== undefined)
+            .filter((one) => one.entry.languages.includes(language))
+            .flatMap((one) => registrationsFor(one.capabilities, present, language))
+            .map((one) => [one.id, one] as const)
+    );
+    const done = page.registered.get(channel) ?? new Map<string, string>();
+    page.registered.set(channel, done);
+    const registrations = [...wanted.values()].filter((one) => !done.has(one.id));
+    const withdrawn = [...done].filter(([id]) => !wanted.has(id));
+    for (const one of registrations) done.set(one.id, one.method);
+    for (const [id] of withdrawn) done.delete(id);
+    // The client's answers to these name no server that waits on them, and are dropped.
+    if (registrations.length > 0) {
         state.next += 1;
-        const id = `oculus:${state.next}`;
-        state.asks.set(id, { held, id: null });
         send(state, page, channel, {
             jsonrpc: '2.0',
-            id,
+            id: `oculus:${state.next}`,
             method: 'client/registerCapability',
             params: { registrations }
         });
     }
+    if (withdrawn.length > 0) {
+        state.next += 1;
+        send(state, page, channel, {
+            jsonrpc: '2.0',
+            id: `oculus:${state.next}`,
+            method: 'client/unregisterCapability',
+            params: { unregisterations: withdrawn.map(([id, method]) => ({ id, method })) }
+        });
+    }
 }
 
 /**
@@ -238,32 +277,7 @@
         for (const root of roots) {
             send(state, page, channel, { oculus: 'gone', root, server: held.entry.id });
         }
-        const language = languageOf(channel);
-        if (language === null) continue;
-        const own = state.servers.forLanguage(language);
-        const present = own === undefined ? {} : own.capabilities(language);
-        const needed = new Set(
-            [...page.helds.values()]
-                .filter((one) => one !== held && appInfo(one.entry) !== undefined)
-                .filter((one) => one.entry.languages.includes(language))
-                .flatMap((one) => registrationsFor(one.capabilities, present, language))
-                .map((one) => one.id)
-        );
-        const done = page.registered.get(channel);
-        const withdrawn = registrationsFor(held.capabilities, present, language).filter(
-            (one) => done?.has(one.id) === true && !needed.has(one.id)
-        );
-        if (withdrawn.length === 0) continue;
-        for (const one of withdrawn) done?.delete(one.id);
-        state.next += 1;
-        send(state, page, channel, {
-            jsonrpc: '2.0',
-            id: `oculus:${state.next}`,
-            method: 'client/unregisterCapability',
-            params: {
-                unregisterations: withdrawn.map((one) => ({ id: one.id, method: one.method }))
-            }
-        });
+        align(state, page, channel, held);
     }
     for (const { uri, channel } of documents) {
         const diagnostics = remainingDiagnostics(page, uri);
--- a/tools/oculus/src/lib/ui/controls/editor/kit/lsp/client.ts
+++ b/tools/oculus/src/lib/ui/controls/editor/kit/lsp/client.ts
@@ -29,7 +29,7 @@
 } from './transport/messages';
 import { namedBy } from './transport/edits';
 import type { Jump } from './transport/renames';
-import { factsForLanguage } from '$lib/data/prose/lsp-servers';
+import { factsForLanguage, featureOf } from '$lib/data/prose/lsp-servers';
 import { inactiveDecorations, markerOwner, toMarkers } from './markers';
 import type { Peeks } from './peeks';
 import { semanticProvider, type Legend } from './semantic';
@@ -82,7 +82,10 @@
     format(timeoutMs: number): Promise<FormatOutcome>;
     /** The file was saved: the servers that declared `save` are told, with the text. */
     saved(): void;
-    /** Whether the server's `initialize` answer declared the capability, by its name. */
+    /**
+     * Whether the server's `initialize` answer declared the capability, by its name, or a feature
+     * of it was registered with the client after that answer.
+     */
     provides(capability: string): boolean;
     /** End the registration: the server drops the model, and its markers are removed. */
     dispose(): void;
@@ -217,6 +220,8 @@
     /** The legend of each server, by root key and server id, the id of oculus's own being empty. */
     #legends = new Map<string, Legend>();
     #capabilities: Record<string, unknown> = {};
+    /** The capability key of each feature registered after `initialize`, by registration id. */
+    #registered = new Map<string, string>();
     #sweep: ReturnType<typeof setInterval> | null = null;
     #refreshTokens: (() => void) | null = null;
     /** Whether the reader accepted the rename box with the preview key. */
@@ -301,7 +306,8 @@
             format: (timeoutMs) => this.#format(entry, timeoutMs),
             provides: (capability) => {
                 const declared = this.#capabilities[capability];
-                return declared !== undefined && declared !== false && declared !== null;
+                if (declared !== undefined && declared !== false && declared !== null) return true;
+                return [...this.#registered.values()].includes(capability);
             },
             saved: () => this.#transport?.saved(model),
             dispose: () => this.#unregister(model)
@@ -584,6 +590,7 @@
             refreshTokens: () => this.#refreshTokens?.(),
             declared: (capabilities) => {
                 this.#capabilities = capabilities;
+                this.#registered.clear();
                 const provider = capabilities.executeCommandProvider as
                     { commands?: unknown } | undefined;
                 const commands = Array.isArray(provider?.commands) ? provider.commands : [];
@@ -593,6 +600,13 @@
                     }
                 }
             },
+            registered: (added, list) => {
+                for (const { id, method } of list) {
+                    const feature = featureOf(method);
+                    if (added && feature !== undefined) this.#registered.set(id, feature);
+                    else this.#registered.delete(id);
+                }
+            },
             notice: (key, ...words) => services.notice(key, ...words),
             completed: async (request, result) => {
                 const document = isRecord(request) ? request.textDocument : null;
--- a/tools/oculus/src/lib/ui/controls/editor/kit/lsp/transport.ts
+++ b/tools/oculus/src/lib/ui/controls/editor/kit/lsp/transport.ts
@@ -22,18 +22,20 @@
 //
 // What the client has no handler for is the transport's own: `publishDiagnostics` and
 // `inactiveRegions` go to the host, and `workspace/semanticTokens/refresh` is answered and told to
-// the host. An edit a server asks for (its `workspace/applyEdit`, a rename's answer, a code
-// action's edit) is never given to Monaco, whose client applies an edit to the models it can name:
-// the transport hands the whole edit to the host (`TransportHost.applyEdit`), which edits the
-// tabs and writes the other files or refuses the whole edit with a notice. A code action's edit is
-// kept under a token and the action carries the command that applies it (`APPLY_COMMAND`), so an
-// action that names other files is offered like any other. An edit whose document changed since
-// the request it answers was made is refused. The client declares `workspace.applyEdit` and a
-// `workspace.workspaceEdit` of `documentChanges` with transactional failure handling to the
-// server. A request of the client the relay could not pass on to a server is answered with no
-// result. The host's own questions to the server (the
-// symbols, the semantic tokens, the formatting) go through `ask`, which answers the protocol's
-// result as the relay sent it, addresses in the page's form.
+// the host. A feature the relay registers with the client after `initialize`, or withdraws, is
+// handed to the client, which asks for it from then on, and told to the host
+// (`TransportHost.registered`), which counts it as declared. An edit a server asks for (its
+// `workspace/applyEdit`, a rename's answer, a code action's edit) is never given to Monaco, whose
+// client applies an edit to the models it can name: the transport hands the whole edit to the host
+// (`TransportHost.applyEdit`), which edits the tabs and writes the other files or refuses the whole
+// edit with a notice. A code action's edit is kept under a token and the action carries the command
+// that applies it (`APPLY_COMMAND`), so an action that names other files is offered like any other.
+// An edit whose document changed since the request it answers was made is refused. The client
+// declares `workspace.applyEdit` and a `workspace.workspaceEdit` of `documentChanges` with
+// transactional failure handling to the server. A request of the client the relay could not pass on
+// to a server is answered with no result. The host's own questions to the server (the symbols, the
+// semantic tokens, the formatting) go through `ask`, which answers the protocol's result as the
+// relay sent it, addresses in the page's form.
 //
 // A rename is asked in two steps and the transport answers each as VS Code's language client does
 // (transport/renames.ts). The `prepareRename` the client sends is held back until the server has
@@ -79,27 +81,19 @@
     isRecord,
     keyOf,
     openMessage,
+    registrationsOf,
     saveMessage,
     type LspModel,
     type LspRange,
     type ModelChange,
-    type Rpc,
-    type TextEdit
+    type Rpc
 } from './transport/messages';
 import { Connection } from './transport/connection';
 import { addressesIn, pageOf, toPage } from './transport/addresses';
 import { GoneRoots } from './transport/roots';
 import { EDITING, type Doc, type Own, type Peek, type Waiting } from './transport/records';
+import { JUMPS, PREPARE, RENAME, Settling, placesOf, refusalOf } from './transport/renames';
 import {
-    JUMPS,
-    PREPARE,
-    RENAME,
-    Settling,
-    placesOf,
-    refusalOf,
-    type Jump
-} from './transport/renames';
-import {
     EditTokens,
     declaringEdits,
     keeping,
@@ -111,58 +105,9 @@
     type KeptEdit
 } from './transport/edits';
 import { libraryOf, pageUri, placeOf, type Place, type Target } from './uris';
+import type { TransportHost } from './transport/host';
 
-/** What the host does for the transport. */
-export type TransportHost = {
-    /**
-     * Make a read-only model of a file no tab holds, under the page's address of it, `spelling`
-     * naming the variant of the address to use when the plain one differs from another model's only
-     * by case (0 for the plain one). Null when the file cannot be read.
-     */
-    peek(target: Target, page: string, spelling: number): Promise<LspModel | null>;
-    /** Dispose a peek model the transport has no use for. */
-    drop(model: LspModel): void;
-    /** Apply edits to a registered model as one undo stop; false when it could not be. */
-    apply(model: LspModel, edits: readonly TextEdit[]): boolean;
-    /**
-     * Make the edit a server asked for, all or none; the outcome says why not. `preview` is set for
-     * the answer of a rename the reader asked to see before it is made, which is then shown and
-     * not made until the reader says so.
-     */
-    applyEdit(edit: unknown, preview: boolean): Promise<LspEditOutcome>;
-    /** The reader asks for the next rename to be previewed, or the mark is cleared (false). */
-    markPreview(marked: boolean): void;
-    /** Whether the next rename was marked for the preview; reading it clears the mark. */
-    takePreview(): boolean;
-    /**
-     * The places the answer to a jump named, for the editor with the address `asking` (the
-     * client's address of its model), in the client's addresses.
-     */
-    targeted(asking: string, places: readonly Jump[]): void;
-    /** A catalog line of the page's words, filled with `words`. */
-    words(key: string, ...words: string[]): string;
-    /**
-     * A server's diagnostics for one file, whether or not a model holds it: the file's address,
-     * and its place when it is a file of a served root.
-     */
-    diagnostics(page: string, place: Place | null, items: readonly LspDiagnostic[]): void;
-    /** The regions of a file clangd found inactive, by the file's address. */
-    inactive(page: string, regions: readonly LspRange[]): void;
-    /** A server named a library file in an answer to a request made for a document of the root. */
-    library(address: string, root: string): void;
-    /** The server asks for its semantic tokens again. */
-    refreshTokens(): void;
-    /** The capabilities the server's `initialize` answer declared. */
-    declared(capabilities: Record<string, unknown>): void;
-    /** Shows a notice by its catalog key, with the words it is said with. */
-    notice(key: string, ...words: string[]): void;
-    /**
-     * The answer to a completion request, or the one item a resolve answers, in the client's form,
-     * for the host to add to; `request` is the client's params of the completion request. It
-     * answers `result` itself when it adds nothing.
-     */
-    completed(request: unknown, result: unknown): Promise<unknown>;
-};
+export type { TransportHost } from './transport/host';
 
 /** The transport of one language over one open period of its port. */
 export class LspTransport {
@@ -743,6 +688,14 @@
             case 'workspace/inlayHint/refresh':
                 this.#deliver(message);
                 return;
+            case 'client/registerCapability':
+            case 'client/unregisterCapability':
+                this.#host.registered(
+                    message.method === 'client/registerCapability',
+                    registrationsOf(message.params)
+                );
+                this.#deliver(message);
+                return;
             default:
                 void this.#write({
                     jsonrpc: '2.0',
--- a/tools/oculus/src/lib/ui/controls/editor/kit/lsp/transport/host.ts
+++ b/tools/oculus/src/lib/ui/controls/editor/kit/lsp/transport/host.ts
@@ -0,0 +1,67 @@
+// Layer 3, primitive. What the host of a language server transport (transport.ts) does for it: the
+// models it makes and drops, the edits it applies, the words and notices it shows, and what it is
+// told of the server's diagnostics, inactive regions, library files, capabilities and the features
+// registered after them. It is a module of its own so the transport holds only the carrying of
+// messages.
+
+import type { LspDiagnostic, LspEditOutcome } from '../services';
+import type { LspModel, LspRange, TextEdit } from './messages';
+import type { Jump } from './renames';
+import type { Place, Target } from '../uris';
+
+/** What the host does for the transport. */
+export type TransportHost = {
+    /**
+     * Make a read-only model of a file no tab holds, under the page's address of it, `spelling`
+     * naming the variant of the address to use when the plain one differs from another model's only
+     * by case (0 for the plain one). Null when the file cannot be read.
+     */
+    peek(target: Target, page: string, spelling: number): Promise<LspModel | null>;
+    /** Dispose a peek model the transport has no use for. */
+    drop(model: LspModel): void;
+    /** Apply edits to a registered model as one undo stop; false when it could not be. */
+    apply(model: LspModel, edits: readonly TextEdit[]): boolean;
+    /**
+     * Make the edit a server asked for, all or none; the outcome says why not. `preview` is set for
+     * the answer of a rename the reader asked to see before it is made, which is then shown and
+     * not made until the reader says so.
+     */
+    applyEdit(edit: unknown, preview: boolean): Promise<LspEditOutcome>;
+    /** The reader asks for the next rename to be previewed, or the mark is cleared (false). */
+    markPreview(marked: boolean): void;
+    /** Whether the next rename was marked for the preview; reading it clears the mark. */
+    takePreview(): boolean;
+    /**
+     * The places the answer to a jump named, for the editor with the address `asking` (the
+     * client's address of its model), in the client's addresses.
+     */
+    targeted(asking: string, places: readonly Jump[]): void;
+    /** A catalog line of the page's words, filled with `words`. */
+    words(key: string, ...words: string[]): string;
+    /**
+     * A server's diagnostics for one file, whether or not a model holds it: the file's address,
+     * and its place when it is a file of a served root.
+     */
+    diagnostics(page: string, place: Place | null, items: readonly LspDiagnostic[]): void;
+    /** The regions of a file clangd found inactive, by the file's address. */
+    inactive(page: string, regions: readonly LspRange[]): void;
+    /** A server named a library file in an answer to a request made for a document of the root. */
+    library(address: string, root: string): void;
+    /** The server asks for its semantic tokens again. */
+    refreshTokens(): void;
+    /** The capabilities the server's `initialize` answer declared. */
+    declared(capabilities: Record<string, unknown>): void;
+    /**
+     * Features the relay registered with the client after `initialize` (`added`), or withdrew, each
+     * by its registration's id and method.
+     */
+    registered(added: boolean, list: readonly { id: string; method: string }[]): void;
+    /** Shows a notice by its catalog key, with the words it is said with. */
+    notice(key: string, ...words: string[]): void;
+    /**
+     * The answer to a completion request, or the one item a resolve answers, in the client's form,
+     * for the host to add to; `request` is the client's params of the completion request. It
+     * answers `result` itself when it adds nothing.
+     */
+    completed(request: unknown, result: unknown): Promise<unknown>;
+};
--- a/tools/oculus/src/lib/ui/controls/editor/kit/lsp/transport/messages.ts
+++ b/tools/oculus/src/lib/ui/controls/editor/kit/lsp/transport/messages.ts
@@ -159,3 +159,17 @@
         text: change.text
     }));
 }
+
+/**
+ * The registrations a `client/registerCapability`, or the withdrawals a
+ * `client/unregisterCapability`, carries, each by its id and method; an entry of another shape is
+ * left out.
+ */
+export function registrationsOf(params: unknown): { id: string; method: string }[] {
+    const list = isRecord(params) ? (params.registrations ?? params.unregisterations) : undefined;
+    return (Array.isArray(list) ? list : []).flatMap((one) =>
+        isRecord(one) && typeof one.id === 'string' && typeof one.method === 'string'
+            ? [{ id: one.id, method: one.method }]
+            : []
+    );
+}
--- a/tools/oculus/tests/server/machine/apps/world/language-app.ts
+++ b/tools/oculus/tests/server/machine/apps/world/language-app.ts
@@ -2,7 +2,9 @@
 // server is a node program that answers the requests a case scripts and records every message it is
 // sent to a file, the app's host is the real runner, and the relay is the real one over the host
 // manager's tools. A case reads what the page was sent from the recording sink and what the server
-// was sent from the log.
+// was sent from the log. The page's own transport (ui/controls/editor/kit/lsp/transport.ts) can be
+// put between the relay and a recording stand-in for Monaco's client (`pageClients`), to read what
+// the client is handed.
 //
 // Every folder is under the system temporary directory (tests/fixtures/scratch.ts).
 
@@ -17,6 +19,12 @@
 import { config } from '../../../../routes/apps/apps-fixture.ts';
 import { frame, recordingSink, settle } from '../../lsp/lsp-fixture.ts';
 import { world, type AppSpec, type World } from './hosts-world.ts';
+import {
+    LspTransport,
+    type TransportHost
+} from '../../../../../src/lib/ui/controls/editor/kit/lsp/transport';
+import type { LspPort } from '../../../../../src/lib/ui/controls/editor/kit/lsp/services';
+import type { LspModel } from '../../../../../src/lib/ui/controls/editor/kit/lsp/transport/messages';
 
 /** The folder of the oculus package, whose own servers a shipped relay runs. */
 const OWN = resolve(import.meta.dirname, '../../../../..');
@@ -84,22 +92,31 @@
 `;
 }
 
-/** An app `name` that declares the language `notes` and registers a server with this script. */
+/**
+ * An app `name` that declares a language (`notes`, of `.note` files, unless `language` names
+ * another with its extension) and registers a server for it with this script.
+ */
 export function languageApp(
     name: string,
     script: ServerScript,
     log: string,
-    over: { title?: string; extra?: string; keys?: string } = {}
+    over: {
+        title?: string;
+        extra?: string;
+        keys?: string;
+        language?: { id: string; extension: string };
+    } = {}
 ): AppSpec {
     const title = over.title ?? name;
+    const language = over.language ?? { id: 'notes', extension: '.note' };
     return {
-        keys: `activation: [onTab]\ncontributes:\n  languages:\n    - id: notes\n      extensions: [".note"]\n${over.keys ?? ''}`,
+        keys: `activation: [onTab]\ncontributes:\n  languages:\n    - id: ${language.id}\n      extensions: ["${language.extension}"]\n${over.keys ?? ''}`,
         files: { 'server.js': serverProgram(script) },
         host: `import { fileURLToPath } from 'node:url';
 export function activate(oculus) {
   const client = oculus.languages.registerLanguageServer('${name}', {
     outputChannelName: '${title}',
-    documentSelector: [{ language: 'notes' }],
+    documentSelector: [{ language: '${language.id}' }],
     serverOptions: { command: process.execPath, args: [fileURLToPath(new URL('./server.js', import.meta.url)), ${JSON.stringify(log)}] }
   });
   client.start();
@@ -247,6 +264,105 @@
             await relay.close();
             await w.hosts.close();
             await settle();
+        }
+    };
+}
+
+/** The page's transport of one language channel over the relay, and what it handed its client. */
+export type PageClient = {
+    transport: LspTransport;
+    /** The messages the transport handed the client, in order. */
+    handed: LspRpc[];
+    /** The messages the transport wrote to the relay, in order. */
+    written: LspRpc[];
+    /** Register the model of a file of the root `r`, which puts the file on the servers. */
+    open: (path: string, text?: string) => LspModel;
+    /** Wait until a message handed to the client or written to the relay is one `accepts` takes. */
+    seen: (accepts: (message: LspRpc) => boolean) => Promise<void>;
+};
+
+/**
+ * The page's side of a language channel: each call of `make` puts a new transport, as a client the
+ * page makes, on the one port, which carries what the transport writes to the relay and every frame
+ * the relay sends on the channel to the transports that listen. The host of the transport does
+ * nothing; the client is a recording stand-in that answers nothing.
+ */
+export function pageClients(l: LanguageWorld, language: string): { make: () => PageClient } {
+    const channel = `lsp:${language}`;
+    const listeners = new Set<(payload: LspRpc) => void>();
+    const writers = new Set<(payload: LspRpc) => void>();
+    const port: LspPort = {
+        state: { value: 'open', onChange: () => () => undefined },
+        send: (payload) => {
+            for (const one of writers) one(payload as LspRpc);
+            l.send(channel, payload as LspRpc);
+            return true;
+        },
+        listen: (fn) => {
+            const one = fn as (payload: LspRpc) => void;
+            listeners.add(one);
+            return () => listeners.delete(one);
         }
     };
+    const send = l.page.sink.send.bind(l.page.sink);
+    l.page.sink.send = (text) => {
+        const out = send(text);
+        const sent = JSON.parse(text) as { channel: string; payload: LspRpc };
+        if (sent.channel === channel) for (const one of listeners) one(sent.payload);
+        return out;
+    };
+    const host = new Proxy({}, { get: () => () => undefined }) as TransportHost;
+    const make = (): PageClient => {
+        const transport = new LspTransport(port, language, host, () => 0);
+        const handed: LspRpc[] = [];
+        const written: LspRpc[] = [];
+        let waiting: { accepts: (message: LspRpc) => boolean; resolve: () => void }[] = [];
+        const heard = (message: LspRpc): void => {
+            waiting = waiting.filter((one) => {
+                if (!one.accepts(message)) return true;
+                one.resolve();
+                return false;
+            });
+        };
+        const writer = (message: LspRpc): void => {
+            if (transport.closed) return;
+            written.push(message);
+            heard(message);
+        };
+        writers.add(writer);
+        transport.setListener((message) => {
+            handed.push(message);
+            heard(message);
+        });
+        void transport.send({
+            jsonrpc: '2.0',
+            id: 1,
+            method: 'initialize',
+            params: { capabilities: {} }
+        } as never);
+        let models = 0;
+        return {
+            transport,
+            handed,
+            written,
+            open(path, text = 'hello\n') {
+                models += 1;
+                const id = models;
+                const model: LspModel = {
+                    uri: { toString: () => `inmemory://model/${id}` },
+                    getValue: () => text,
+                    getVersionId: () => 1,
+                    getLanguageId: () => language,
+                    onDidChangeContent: () => ({ dispose: () => undefined })
+                };
+                transport.register(model, { root: 'r', path });
+                return model;
+            },
+            seen(accepts) {
+                if ([...handed, ...written].some(accepts)) return Promise.resolve();
+                return new Promise((resolve) => waiting.push({ accepts, resolve }));
+            }
+        };
+    };
+    return { make };
 }
--- a/tools/oculus/tests/server/machine/apps/tools/language-features.test.ts
+++ b/tools/oculus/tests/server/machine/apps/tools/language-features.test.ts
@@ -0,0 +1,303 @@
+// Layer 2, server test. The features a server of an app declares, as the page's client of the
+// language sees them and asks for them (lib/server/machine/lsp/relay/relay-server.ts,
+// relay-route.ts, relay-join.ts, held/held.ts, and ui/controls/editor/kit/lsp/transport.ts on the
+// page's side), over the real runner, the real relay and the page's real transport between the
+// relay and a recording stand-in for Monaco's client:
+//
+// - each feature an app server declares that oculus's own server of the language does not, whether
+//   in its `initialize` answer or by registering it later, is handed to the client as a
+//   registration, for every client the page makes on the channel, and withdrawn when the server
+//   goes; the semantic tokens of an app server are drawn by the page from its legend and are not
+//   registered;
+// - a request of the page for a feature goes only to the servers that declared it, and one no
+//   server of an app declared is answered with no result at once.
+//
+// These are language-server rows of G77. The servers are node programs that answer a script
+// (world/language-app.ts) and log what they are sent. Every folder is synthetic, under the system
+// temporary directory. What this does NOT cover: Monaco's client taking a registration and the
+// menu of the editor reading it (`provides` in ui/controls/editor/kit/lsp/client.ts), which need a
+// DOM.
+// @module-tag slow: each case starts node processes.
+
+import { join } from 'node:path';
+import { describe, expect } from 'vitest';
+import type { LspRpc } from '../../../../../src/lib/data/model/index.ts';
+import { it, scratchDir } from '../../../../fixtures/scratch.ts';
+import {
+    languageApp,
+    languageWorld,
+    logged,
+    pageClients,
+    sentTo,
+    type PageClient,
+    type ServerScript
+} from '../world/language-app.ts';
+
+/** The registrations of the requests a client was handed, by method, in order. */
+function registered(client: PageClient): string[] {
+    return client.handed
+        .filter((one) => one.method === 'client/registerCapability')
+        .flatMap((one) =>
+            ((one.params as { registrations?: { method: string }[] }).registrations ?? []).map(
+                (r) => r.method
+            )
+        );
+}
+
+/** Whether the transport answered the relay's request with this id, or handed it to the client. */
+const dealtWith = (id: unknown) => (message: LspRpc) => message.id === id;
+
+/** The relay's last request to the page of this method, once it is sent. */
+async function relayAsks(l: ReturnType<typeof languageWorld>, method: string): Promise<LspRpc> {
+    await l.until((payload) => payload.method === method);
+    const all = l.page.frames.filter((one) => one.payload.method === method);
+    return all[all.length - 1].payload;
+}
+
+/** One app `look` with a server of this script, its log, and the page's client with a.note. */
+async function oneApp(name: string, script: ServerScript) {
+    const log = join(scratchDir('oculus-feat-'), `${name}.jsonl`);
+    const l = languageWorld({ look: languageApp('look', script, log) });
+    await l.w.hosts.tab('app:look');
+    const clients = pageClients(l, 'notes');
+    const client = clients.make();
+    const model = client.open('a.note');
+    await l.until((payload) => payload.oculus === 'state' && payload.state === 'ready');
+    return { l, log, clients, client, model };
+}
+
+const AT = { position: { line: 0, character: 0 } };
+
+describe('a feature a server of an app declares', () => {
+    it('is handed to the page client as a registration, which the transport refuses none of, for a language no oculus server serves', async () => {
+        const { l, client, model } = await oneApp('a', {
+            capabilities: { hoverProvider: true },
+            hover: 'a note'
+        });
+        const ask = await relayAsks(l, 'client/registerCapability');
+        await client.seen(dealtWith(ask.id));
+        const hover = await client.transport.ask(model, 'textDocument/hover', AT);
+        const refused = client.written.filter((one) => one.id === ask.id && one.error);
+        await l.close();
+        expect([registered(client), refused, JSON.stringify(hover)]).toEqual([
+            ['textDocument/hover'],
+            [],
+            JSON.stringify({ contents: 'a note' })
+        ]);
+    }, 30000);
+
+    it('is handed to the page client for a language oculus serves, when oculus own server does not declare it', async () => {
+        const log = join(scratchDir('oculus-feat-'), 'md.jsonl');
+        const l = languageWorld(
+            {
+                look: languageApp(
+                    'look',
+                    { capabilities: { hoverProvider: true, codeLensProvider: {} } },
+                    log,
+                    { language: { id: 'markdown', extension: '.md' } }
+                )
+            },
+            { r: { 'a.md': '# a\n' } }
+        );
+        await l.w.hosts.tab('app:look');
+        const client = pageClients(l, 'markdown').make();
+        client.open('a.md', '# a\n');
+        const ask = await relayAsks(l, 'client/registerCapability');
+        await client.seen(dealtWith(ask.id));
+        await l.close();
+        expect(registered(client)).toEqual(['textDocument/codeLens']);
+    }, 30000);
+
+    it('is handed to the page client from the providers an app registers in its host', async () => {
+        const l = languageWorld({
+            prov: {
+                keys: 'activation: [onTab]\ncontributes:\n  languages:\n    - id: notes\n      extensions: [".note"]\n',
+                host: `export function activate(oculus) {
+  oculus.languages.registerHoverProvider({ language: 'notes' }, {
+    provideHover() { return new oculus.Hover('from a provider'); }
+  });
+}
+`
+            }
+        });
+        await l.w.hosts.tab('app:prov');
+        const client = pageClients(l, 'notes').make();
+        const model = client.open('a.note');
+        const ask = await relayAsks(l, 'client/registerCapability');
+        await client.seen(dealtWith(ask.id));
+        const hover = await client.transport.ask(model, 'textDocument/hover', AT);
+        await l.close();
+        expect([registered(client), JSON.stringify(hover).includes('from a provider')]).toEqual([
+            ['textDocument/hover'],
+            true
+        ]);
+    }, 30000);
+
+    it('is registered for workspace symbols and the call and type hierarchies, and not for semantic tokens, which the page draws from the legend', async () => {
+        const { l, client } = await oneApp('sem', {
+            capabilities: {
+                hoverProvider: true,
+                workspaceSymbolProvider: true,
+                callHierarchyProvider: true,
+                typeHierarchyProvider: true,
+                semanticTokensProvider: {
+                    legend: { tokenTypes: ['a'], tokenModifiers: [] },
+                    full: true
+                }
+            }
+        });
+        const ask = await relayAsks(l, 'client/registerCapability');
+        await client.seen(dealtWith(ask.id));
+        await l.close();
+        expect(registered(client)).toEqual([
+            'textDocument/hover',
+            'workspace/symbol',
+            'textDocument/prepareCallHierarchy',
+            'textDocument/prepareTypeHierarchy'
+        ]);
+    }, 30000);
+
+    it('is handed to a second client the page makes on the same socket after its last document closed', async () => {
+        const { l, clients, client, model } = await oneApp('again', {
+            capabilities: { hoverProvider: true },
+            hover: 'again'
+        });
+        const first = await relayAsks(l, 'client/registerCapability');
+        await client.seen(dealtWith(first.id));
+        client.transport.unregister(model);
+        client.transport.close();
+        const next = clients.make();
+        const reopened = next.open('a.note');
+        // The answer of a hover comes after every message the relay sent the client before it.
+        const hover = await next.transport.ask(reopened, 'textDocument/hover', AT);
+        await l.close();
+        expect([registered(next), JSON.stringify(hover)]).toEqual([
+            ['textDocument/hover'],
+            JSON.stringify({ contents: 'again' })
+        ]);
+    }, 30000);
+
+    it('is withdrawn from the page client when the app stops acting', async () => {
+        const { l, client } = await oneApp('stop', { capabilities: { hoverProvider: true } });
+        const ask = await relayAsks(l, 'client/registerCapability');
+        await client.seen(dealtWith(ask.id));
+        l.w.disable('app:look');
+        const withdrawn = await relayAsks(l, 'client/unregisterCapability');
+        await client.seen(dealtWith(withdrawn.id));
+        const handed = client.handed.find((one) => one.id === withdrawn.id);
+        await l.close();
+        expect(
+            (handed?.params as { unregisterations?: { method: string }[] } | undefined)
+                ?.unregisterations
+        ).toEqual([{ id: 'oculus-app:notes:hoverProvider', method: 'textDocument/hover' }]);
+    }, 30000);
+
+    it('is handed to the page client when the server registers it after initialize, and its requests reach the server', async () => {
+        const { l, log, client, model } = await oneApp('dyn', {
+            capabilities: {},
+            dynamicHover: true,
+            hover: 'registered later'
+        });
+        // The server logs the relay's answer to its registration.
+        await logged(log, (all) =>
+            all.some((one) => one.id === 'reg1' && one.method === undefined)
+        );
+        const hover = await client.transport.ask(model, 'textDocument/hover', AT);
+        await l.close();
+        expect([registered(client), JSON.stringify(hover)]).toEqual([
+            ['textDocument/hover'],
+            JSON.stringify({ contents: 'registered later' })
+        ]);
+    }, 30000);
+});
+
+describe('a request of the page for a feature', () => {
+    it('that the server of an app did not declare is answered with no result and not sent to it, asked as the document opens and once the server is ready', async () => {
+        const log = join(scratchDir('oculus-feat-'), 'sym.jsonl');
+        const l = languageWorld({ look: languageApp('look', {}, log) });
+        await l.w.hosts.tab('app:look');
+        const client = pageClients(l, 'notes').make();
+        const model = client.open('a.note');
+        const answers: unknown[] = [];
+        const symbols = (): void =>
+            void client.transport.ask(model, 'textDocument/documentSymbol').then(
+                (result) => answers.push(result),
+                (error: unknown) => answers.push(String(error))
+            );
+        // The outline asks as the document opens, before the server answered `initialize`.
+        symbols();
+        await l.until((payload) => payload.oculus === 'state' && payload.state === 'ready');
+        symbols();
+        // The script answers a definition with no result, so its answer is a signal that comes
+        // after both documentSymbol requests, which the script never answers, were dealt with.
+        const definition = await client.transport.ask(model, 'textDocument/definition', AT);
+        const answered = [...answers];
+        const sent = sentTo(log)
+            .map((one) => one.method)
+            .filter(
+                (one) => one === 'textDocument/documentSymbol' || one === 'textDocument/definition'
+            );
+        await l.close();
+        expect([answered, definition, sent]).toEqual([[null, null], null, []]);
+    }, 30000);
+
+    it('for the workspace symbols of a root, whose server of an app did not declare them, is answered with no result and not sent to it', async () => {
+        const { l, log, client, model } = await oneApp('wsym', {
+            capabilities: { hoverProvider: true },
+            hover: 'signal'
+        });
+        let settled: unknown = 'waiting';
+        void client.transport.ask(model, 'workspace/symbol', { query: 'a' }).then(
+            (result) => (settled = result),
+            (error: unknown) => (settled = String(error))
+        );
+        // The server answers a hover after it read every request sent to it before the hover.
+        const hover = await client.transport.ask(model, 'textDocument/hover', AT);
+        const answered = settled;
+        const sent = sentTo(log)
+            .map((one) => one.method)
+            .filter((one) => one === 'workspace/symbol');
+        await l.close();
+        expect([answered, JSON.stringify(hover), sent]).toEqual([
+            null,
+            JSON.stringify({ contents: 'signal' }),
+            []
+        ]);
+    }, 30000);
+
+    it('that follows a call hierarchy goes to the server that declared the call hierarchy, not to the first server of the document', async () => {
+        const dir = scratchDir('oculus-feat-');
+        const logs = { one: join(dir, 'one.jsonl'), two: join(dir, 'two.jsonl') };
+        const l = languageWorld({
+            one: languageApp('one', { capabilities: { hoverProvider: true } }, logs.one),
+            two: languageApp('two', { capabilities: { callHierarchyProvider: true } }, logs.two)
+        });
+        await l.w.hosts.tab('app:one');
+        await l.w.hosts.tab('app:two');
+        l.open('lsp:notes', 'a.note');
+        const opened = (log: string) =>
+            logged(log, (all) => all.some((one) => one.method === 'textDocument/didOpen'));
+        await opened(logs.one);
+        await opened(logs.two);
+        const item = {
+            name: 'a',
+            kind: 12,
+            uri: l.uri('a.note'),
+            range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
+            selectionRange: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } }
+        };
+        l.send('lsp:notes', {
+            jsonrpc: '2.0',
+            id: 7,
+            method: 'callHierarchy/incomingCalls',
+            params: { item }
+        });
+        const asked = (log: string) =>
+            sentTo(log).some((one) => one.method === 'callHierarchy/incomingCalls');
+        // Both logs are in one folder, so a wait on one sees a write to either.
+        await logged(logs.one, () => asked(logs.one) || asked(logs.two));
+        const where = { one: asked(logs.one), two: asked(logs.two) };
+        await l.close();
+        expect(where).toEqual({ one: false, two: true });
+    }, 30000);
+});
--- a/tools/oculus/docs/apps.md
+++ b/tools/oculus/docs/apps.md
@@ -555,6 +555,7 @@
 - A server is given only documents of the folders of the app's scope. A document outside them is never sent.
 - Several servers for one language, oculus's own and apps', are joined as VS Code's client joins its providers. (rest of the line unchanged)
 - A capability a server registers after `initialize` with `client/registerCapability` is passed to the editor.
+- A request is sent to your server only for a feature it declared, in its `initialize` answer or by registering it. A request for a feature no server of the language declared is answered with no result.
--- a/tools/oculus/docs/diagrams/layers.dot
+++ b/tools/oculus/docs/diagrams/layers.dot
@@ -44,7 +44,7 @@
-    "server to data" [label="434", shape=box, color="transparent", fontsize=8, width=0, height=0, margin="0.04,0.02"];
+    "server to data" [label="436", shape=box, color="transparent", fontsize=8, width=0, height=0, margin="0.04,0.02"];
--- a/tools/oculus/docs/diagrams/layers.svg
+++ b/tools/oculus/docs/diagrams/layers.svg
@@ -31,7 +31,7 @@
-<text fill="currentColor" xml:space="preserve" text-anchor="middle" x="464" y="-61.44" font-family="Helvetica,Arial,sans-serif" font-size="8.00">434</text>
+<text fill="currentColor" xml:space="preserve" text-anchor="middle" x="464" y="-61.44" font-family="Helvetica,Arial,sans-serif" font-size="8.00">436</text>
--- a/tools/oculus/docs/diagrams/layer-server.dot
+++ b/tools/oculus/docs/diagrams/layer-server.dot
@@ -38,7 +38,7 @@
-        "folder server/machine to layer data" [label="160", shape=box, color="transparent", fontsize=8, width=0, height=0, margin="0.04,0.02"];
+        "folder server/machine to layer data" [label="162", shape=box, color="transparent", fontsize=8, width=0, height=0, margin="0.04,0.02"];
--- a/tools/oculus/docs/diagrams/layer-server.svg
+++ b/tools/oculus/docs/diagrams/layer-server.svg
@@ -310,7 +310,7 @@
-<text fill="currentColor" xml:space="preserve" text-anchor="middle" x="253" y="-649.4" font-family="Helvetica,Arial,sans-serif" font-size="8.00">160</text>
+<text fill="currentColor" xml:space="preserve" text-anchor="middle" x="253" y="-649.4" font-family="Helvetica,Arial,sans-serif" font-size="8.00">162</text>
```

Two of the hunks above are shortened, and the saved patch file holds them whole:

- The docs/apps.md hunk has its second context line cut.
- The four diagram hunks show only their changed lines. Their context is the three lines on each side in the patch.

The DESIGN.md change (one line, the paragraph **Language servers of apps.**, main line 549) inserts these two sentences right after "A capability an app server registers dynamically (`client/registerCapability`) is passed to the page's client.":

"What an app server declares, in its `initialize` answer or by registering it later, is registered with the page's client of each channel the server serves, in full each time that client initializes the channel, and withdrawn when the server goes, except semantic tokens, which the page draws from the server's legend (`relay-server.ts`). A request for a feature that no app server it could go to declared is answered with no result and sent to none of them, as VS Code's client asks a server only for what it declared; oculus's own server is sent every request the page makes of it (`relay-route.ts`)."

The rest of the line is unchanged, and the patch carries it as a one-line hunk (`@@ -546,7 +546,7 @@`).

Runs after the fix (in the scratch tree, Node from ~/.nvm v24.21.0):

```
$ npx vitest run tests/server/machine/apps/tools/language-features.test.ts
 Test Files  1 passed (1)
      Tests  10 passed (10)

$ npx vitest run tests/server/machine/apps/tools/languages-red.test.ts --reporter=verbose   (the red command, unshrunk case, run 3 times plain and once verbose)
A registration from the relay: {"jsonrpc":"2.0","id":"oculus:1","method":"client/registerCapability","params":{"registrations":[{"id":"oculus-app:notes:hoverProvider","method":"textDocument/hover","registerOptions":{"documentSelector":[{"language":"notes"}]}}]}}
A reply of the transport: undefined
A methods handed to the Monaco client: ["answer 1","client/registerCapability"]
B the page: answered | reached the server: false
 v ... red > A: the Monaco client is told hover is served by an app server that declared hoverProvider 110ms
 v ... red > B: a documentSymbol of the page is answered to the page and not sent to a server that did not declare it 96ms
      Tests  2 passed (2)
fixed run 1 / 2 / 3:  Tests  2 passed (2)

shrunk case:
$ DIAG_NOINIT=1 DIAG_SCRIPT='{"capabilities":{"hoverProvider":true}}' npx vitest run .../languages-red.test.ts -t 'A:'
 v ... A: ...   Tests  1 passed | 1 skipped (2)
$ DIAG_NOINIT=1 DIAG_SCRIPT='{}' npx vitest run .../languages-red.test.ts -t 'B:'
B the page: answered | reached the server: false
 v ... B: ...   Tests  1 passed | 1 skipped (2)

the other inputs: cases 2 to 10 of language-features above (10 passed). N1 and N3 were right on both trees (scratch file languages-other.test.ts, removed).

$ npx vitest run tests/server/machine/lsp tests/server/machine/apps tests/ui/controls/editor tests/state/system/machine/lsp tests/state/system/apps-tools tests/data
 Test Files  2 failed | 74 passed (76)
      Tests  4 failed | 932 passed (936)
 (the 4 failures are the Markdown cases named below, which fail on the tree without the fix too)

$ npx vitest run --exclude 'tests/checks/**'        (whole suite, slow rows included, before the comment rewording)
 Test Files  2 failed | 256 passed (258)
      Tests  4 failed | 2466 passed (2470)
 (the same 4 Markdown failures)

$ npx vitest run tests/checks --testTimeout 0 --hookTimeout 0   (after the docs edit; diagrams stale: 2 failed)
$ node utils/diagrams/diagrams.mjs && npx vitest run tests/checks/diagrams tests/checks/source --testTimeout 0 --hookTimeout 0
 Test Files  5 passed (5)
      Tests  78 passed (78)
$ npx vitest run tests/checks/tree tests/server/machine/apps/tools/language-features.test.ts
 Test Files  4 passed (4)
      Tests  49 passed (49)
$ npx svelte-check --threshold error
 COMPLETED 3964 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npx prettier --check <the 12 source and test files>   All matched files use Prettier code style!
$ npx eslint <the 12 source and test files>              exit 0, no output
$ LC_ALL=C grep -nP '[^\x00-\x7F]' <the 12 files>        exit 1, no output
$ wc -l: held.ts 878, transport.ts 827, client.ts 795, relay-route.ts 595, lsp-servers.ts 349 (all at or under 880)
$ sh utils/unused-exports.sh on both trees: 361 lines each, diff empty; none of FEATURES, featureOf, withFeature, initialized, declares, registrationsOf, Knowing, TransportHost is listed
```

The four failures that also fail on the tree without the fix (`npx vitest run tests/server/machine/apps/tools/languages.test.ts tests/server/machine/lsp/adapters/markdown-created.test.ts` there gave `Tests 4 failed | 14 passed (18)`):

- tests/server/machine/apps/tools/languages.test.ts, "the providers of an app beside oculus own Markdown server > answer a hover of the document and add their diagnostics with the collection as the source, while oculus own server stays ready", which times out at 40 s.
- Three cases of tests/server/machine/lsp/adapters/markdown-created.test.ts ("a file created after the first refere...", "a file moved after the first referenc...", "a folder moved after the first refere..."), which time out at 30 s.

All four involve the shipped Markdown server. They are not part of this defect and were not investigated.

Required at landing:

- **G77 in agents/guarded.md**: add the new test, `tests/server/machine/apps/tools/language-features.test.ts`, every row, beside `tests/server/machine/apps/tools/languages.test.ts`. A test exists only as the test of a guarded entry.
- **The boundary check**: the feature table lives in `src/lib/data/prose/lsp-servers.ts`, which the boundary check's primitives row allows client.ts to import, so the allow list is unchanged.
- **Folder counts**:
  - tests/server/machine/apps/tools now holds 10 items.
  - src/lib/server/machine/lsp/held/requests and src/lib/ui/controls/editor/kit/lsp/transport each gain one file.
  - The size and folder checks of tests/checks/tree pass.

History-word grep over the comment lines and test titles added, for "before|used to|no longer|still|always|previously|again|any more|anymore|since|now|first|already". Each hit, judged:

- "already ... already" (relay-join.ts head): text of main kept in a changed line.
- "since" (relay-join.ts and relay-server.ts heads): means "because".
- "first request" / "first server" (relay-join.ts head and a test title): ordinals.
- "again" in host.ts: the moved `refreshTokens` doc, text of main.
- Three test comments: "before it", "before the server answered `initialize`" and "before the hover" describe the order of messages at run time. None compares the code with an earlier state.

No test reaches it:

- A2, `provides` in client.ts: it needs Monaco's editor and a DOM. It is reached only through the page, at the look.
- Monaco's own taking of a registration (`LspCapabilitiesRegistry`, monaco-lsp-client index.js lines 2718 to 2735): it needs the browser.

No test is written: not applicable.

## Cleanup

```
$ grep -rln "DIAG-7c41" /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.PopIRr/tree --exclude=local.yml --exclude-dir=node_modules --exclude-dir=.git
.../tools/oculus/.scratch/migration/agents/reviews/D33-diagnosis.md
.../tools/oculus/.scratch/migration/agents/reviews/O30-diagnosis.md
.../tools/oculus/.scratch/migration/agents/reviews/D41-diagnosis.md
$ git -C <tree> diff --stat -- <those three files>          (empty: committed text, unchanged)
$ grep -rn "DIAG-7c41\|DIAG_" <tree>/tools/oculus/src <tree>/tools/oculus/tests <tree>/tools/oculus/docs <tree>/tools/oculus/DESIGN.md; echo "grep exit $?"
grep exit 1
```

The tag `DIAG-7c41` was not unique to this diagnosis: three committed diagnosis records already hold it. This diagnosis added one tagged line (probe 3, relay-route.ts). It was undone by copying the file back (`diff -q` printed "undone"), and relay-route.ts now differs from main only by the fix.

Removed:

- The red command file `tests/server/machine/apps/tools/languages-red.test.ts` and the scratch file `languages-other.test.ts`, both from the scratch tree.
- From the session scratchpad: the copy without the fix (`unfixed/`; its node_modules was a symlink, removed as a link), the `.orig` copies, the patch-apply test folders and the run outputs.

Kept: /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/D64-diagnosis-fix.patch, the patch to apply at landing.

The scratch worktree is left in place, as the brief says. It also holds `.svelte-kit/`, `.svelte-kit-app/` and `build-app/`, all git-ignored. The writes into the main checkout's node_modules are listed under "Where the probes run".

After the last edit, the red command was run on the original, unshrunk case: `Tests 2 passed (2)` on three runs.
