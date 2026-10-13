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
import {
    adapterProgram,
    debugApp,
    EVERY_CAP,
    requestsTo,
    waiter,
    type AdapterCaps
} from '../apps/world/debug-app.ts';
import { world } from '../apps/world/hosts-world.ts';

const catalog = textCatalog(loadConfig(engineDir()).config);

/** The capabilities of the adapter of the app the symptom was seen with. */
const SOME: AdapterCaps = {
    supportsConfigurationDoneRequest: true,
    supportsConditionalBreakpoints: true,
    supportsTerminateRequest: true
};

/** An adapter that declares every capability the client reads. */
const ALL: AdapterCaps = { ...EVERY_CAP, supportsLoadedSourcesRequest: true };

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
    const { wake, until } = waiter();
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
        until,
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
